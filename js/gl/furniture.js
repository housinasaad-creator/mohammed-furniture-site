/*
  القطع: كلها إجرائية (بلا نماذج خارجية) وقابلة للتعديل الحي:
  أريكة منحنية، كرسي برميلي، طاولتا قهوة، طاولة سفرة بأرجل أقواس (شعار العلامة) مع كراسيها، سرير بظهر مقوّس مخدّد.
  كل قطعة مقسّمة إلى "أجزاء" لها اتجاه تفكيك: تُستخدم للبناء الذاتي وللعرض المفكّك (Anatomy).
*/
import * as THREE from 'three';
import { softBox, rrectProfile, sweepArc, roundedCylinder, archShape, archPath, extrude, roundedRectShape, mergeGeos } from './geo.js';
import { WOODS, FABRICS, STONES, METALS, byId } from './data.js';

const V3 = THREE.Vector3;
const PI = Math.PI;
const easeOutBack = (t) => { const c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

function put(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true; m.receiveShadow = true;
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  parent.add(m);
  return m;
}
function localBoxOf(group) {
  const box = new THREE.Box3(), inv = group.matrixWorld.clone().invert(), m = new THREE.Matrix4();
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    m.multiplyMatrices(inv, o.matrixWorld);
    box.union(o.geometry.boundingBox.clone().applyMatrix4(m));
  });
  return box;
}
function rotProfile(pts, pivot, ang) {
  const c = Math.cos(ang), s = Math.sin(ang);
  return pts.map(([a, b]) => { const dx = a - pivot[0], dy = b - pivot[1]; return [pivot[0] + dx * c - dy * s, pivot[1] + dx * s + dy * c]; });
}

/* -------------------------------------------------------------------- فئة القطعة */
export class Product {
  constructor(C, id, defaults) {
    this.C = C; this.M = C.mats; this.id = id;
    this.group = new THREE.Group(); this.group.name = id;
    this.parts = []; this.opts = Object.assign({}, defaults.opts || {});
    this.sel = Object.assign({}, defaults.sel || {});
    this.mats = {}; this.anatomy = 0; this.build = 1; this.buildDelay = 0; this._dispose = [];
    this.dims = { w: 1, h: 1, d: 1 };
    this.center = new V3(); this.box = new THREE.Box3();
    this.makeMats();
    this.rebuild();
  }
  /* مواد القطعة: تُنشأ مرة وتُعاد استخدامها عند تغيّر الهندسة */
  makeMats() { /* تعرّفها كل قطعة */ }
  part(name, ex, delay = 0, label = null) {
    const g = new THREE.Group(); g.userData = { name, ex: ex.clone(), delay, label: label || name, base: new V3() };
    this.group.add(g); this.parts.push(g); return g;
  }
  clear() {
    for (const p of this.parts) { p.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); this.group.remove(p); }
    this.parts = [];
    for (const o of [...this.group.children]) { o.traverse((c) => { if (c.geometry) c.geometry.dispose(); }); this.group.remove(o); }
  }
  rebuild() {
    this.clear(); this.buildGeometry(this.opts);
    // نقيس الأبعاد والحالة "المركّبة" (الأجزاء في مكانها) ثم نعيد حالة الأنيميشن
    for (const p of this.parts) { p.position.set(0, 0, 0); p.scale.setScalar(1); p.visible = true; }
    this.group.updateMatrixWorld(true);
    this.localBox = localBoxOf(this.group);
    const s = new V3(); this.localBox.getSize(s); this.dims = { w: s.x, h: s.y, d: s.z };
    this.center = this.localBox.getCenter(new V3()); this.box = this.localBox;
    this.pop = this.pop || 0;
    this.applyAnim();
  }
  worldCenter() { return this.group.localToWorld(this.center.clone()); }
  buildGeometry() {}
  /* بناء/تفكيك: build 0..1 (مرحلة التجميع)، anatomy 0..1 (العرض المفكّك) */
  applyAnim() {
    const n = this.parts.length;
    for (let i = 0; i < n; i++) {
      const p = this.parts[i], u = p.userData;
      const bp = this.build >= 1 ? 1 : clamp((this.build * (1 + 0.8) - u.delay * 0.8) / 1.0, 0, 1);
      const e = bp >= 1 ? 1 : easeOutBack(bp);
      const fly = 1 - e;
      p.position.set(
        u.ex.x * this.anatomy + (u.ex.x * 0.4) * fly + Math.sin(i * 2.1) * 1.4 * fly,
        u.ex.y * this.anatomy + (1.8 + u.ex.y * 0.6) * fly,
        u.ex.z * this.anatomy + (u.ex.z * 0.4) * fly + Math.cos(i * 1.7) * 0.8 * fly
      );
      const sc = bp <= 0 ? 0.0001 : 0.55 + 0.45 * Math.min(1, e);
      p.scale.setScalar(sc);
      p.visible = bp > 0.002;
    }
  }
  /* مركز عالمي لجزء (لوضع بطاقات المسمّيات) */
  partCenter(i, out = new V3()) {
    const b = new THREE.Box3().setFromObject(this.parts[i]);
    return b.getCenter(out);
  }
  /* تغيير خيار: إما تغيير مادة (موجة) أو إعادة هندسة */
  fabricTo(f) { return { kind: f.kind, c0: f.c0, c1: f.c1, rough: f.rough, sheen: f.sheen, sheenC: f.sheenC || '#ffffff', cc: f.cc || 0, bump: f.bump }; }
  woodTo(w) { return { c0: w.c0, c1: w.c1, rough: w.rough }; }
  stoneTo(s) { return { c0: s.c0, c1: s.c1 }; }
  setSel(key, id, center, instant) {
    this.sel[key] = id;
    const c = center || this.worldCenter();
    const go = (mat, to, opts) => { if (!mat) return; instant ? this.M.set(mat, to) : this.M.morph(mat, to, c, Object.assign({ radius: Math.max(this.dims.w, this.dims.d) * 0.8 + 1.4, dur: 1.15 }, opts)); };
    if (key === 'fabric') go(this.mats.fabric, this.fabricTo(byId(FABRICS, id)));
    else if (key === 'wood') { const w = byId(WOODS, id); go(this.mats.wood, this.woodTo(w)); if (this.mats.wood2) go(this.mats.wood2, this.woodTo(w)); }
    else if (key === 'stone') go(this.mats.stone, this.stoneTo(byId(STONES, id)));
    else if (key === 'top') { this.opts.top = id; this.rebuild(); }
  }
  setOpt(key, v) { this.opts[key] = v; this.rebuild(); }
}

/* ==================================================================== الأريكة المنحنية Arc */
export class Sofa extends Product {
  constructor(C) { super(C, 'sofa', { opts: { seats: 3 }, sel: Object.assign({}, C.style.defaults.sofa) }); }
  makeMats() {
    const M = this.M, s = this.sel;
    this.mats.fabric = M.fabricMat(byId(FABRICS, s.fabric), 3);
    this.mats.wood = M.woodMat(byId(WOODS, s.wood), 2);
    this.mats.metal = M.metalMat(METALS[this.C.style.metal]);
    this.mats.foam = M.gm({ c1: '#e9e2d0', rough: 0.95 });
    this.mats.web = M.gm({ c1: '#26231f', rough: 0.9 });
    this.mats.accent = M.gm({ kind: 'velvet', seed: 9, c0: '#2a120a', c1: this.C.style.accent, rough: 0.85, sheen: 1, sheenC: '#ffe0c0' });
  }
  buildGeometry(o) {
    const seats = o.seats || 3, Rc = 2.05;
    const A = (seats * 0.74 + 0.34) / Rc, a0 = -A / 2, a1 = A / 2;
    const m = this.mats, M = this.M;
    const SW = (prof, b0, b1, er, fn) => sweepArc(prof, { R: Rc, a0: b0, a1: b1, segs: Math.max(28, Math.round((b1 - b0) * 70)), endRound: er, fn });
    const at = (phi, rho) => { const Rt = Rc + rho; return [Rt * Math.sin(phi), Rc - Rt * Math.cos(phi)]; };
    // أرجل
    const legs = this.part('legs', new V3(0, 0, 0), 0.0, 'legs');
    const lg = new THREE.CylinderGeometry(0.032, 0.02, 0.13, 14); M.uv(lg, m.wood, 'y', 4);
    const cap = new THREE.CylinderGeometry(0.021, 0.021, 0.012, 14);
    const lp = seats === 2 ? [a0 + 0.13, a1 - 0.13] : [a0 + 0.13, 0, a1 - 0.13];
    for (const phi of lp) for (const rho of [-0.3, 0.32]) {
      const [x, z] = at(phi, rho);
      put(legs, lg, m.wood, x, 0.065, z); put(legs, cap, m.metal, x, 0.006, z);
    }
    // قاعدة خشبية منحسرة (تعطي إيحاء الطفو) ثم جسم القماش المتصل
    const frame = this.part('frame', new V3(0, 0.34, 0), 0.1, 'frame');
    const fg = SW(rrectProfile(0.62, 0.1, 0.025, 4, -0.02, 0.18), a0 + 0.06, a1 - 0.06, 0.05); M.uv(fg, m.wood, 'y', 5);
    put(frame, fg, m.wood);
    const web = this.part('web', new V3(0, 0.6, 0), 0.25, 'springs');
    const body = SW(rrectProfile(0.9, 0.2, 0.07, 5, -0.02, 0.3), a0 + 0.02, a1 - 0.02, 0.07, (i, phi, t) => ({ sy: 1 + 0.03 * Math.sin(PI * t) })); M.uv(body, m.fabric, null, 6);
    put(web, body, m.fabric);
    // إسفنج
    const foam = this.part('foam', new V3(0, 0.95, 0), 0.4, 'foam');
    // مخدّات المقعد
    const seat = this.part('seat', new V3(0, 1.35, 0.12), 0.55, 'cushions');
    const span = (A - 0.16) / seats, st = a0 + 0.08;
    for (let k = 0; k < seats; k++) {
      const b0 = st + k * span + 0.002, b1 = st + (k + 1) * span - 0.002;
      const fgm = SW(rrectProfile(0.78, 0.1, 0.04, 4, 0, 0.4), b0 + 0.012, b1 - 0.012, 0.045); M.uv(fgm, m.foam, null, 1);
      put(foam, fgm, m.foam);
      const g = SW(rrectProfile(0.84, 0.15, 0.065, 5, 0, 0.42), b0, b1, 0.05, (i, phi, t) => ({ sy: 1 + 0.18 * Math.sin(PI * t), sr: 1 + 0.015 * Math.sin(PI * t) })); M.uv(g, m.fabric, null, k + 3);
      put(seat, g, m.fabric);
    }
    // ظهر متّصل مع وسائد بارزة بعدد المقاعد
    const back = this.part('back', new V3(0, 1.1, -0.65), 0.7, 'back');
    const bprof = rotProfile(rrectProfile(0.3, 0.5, 0.11, 5, 0.33, 0.7), [0.33, 0.46], -0.17);
    const bk = SW(bprof, a0 + 0.02, a1 - 0.02, 0.08, (i, phi, t) => {
      const f = (t * seats) % 1, bump = Math.pow(Math.sin(PI * f), 0.55);
      return { sy: 1 + 0.05 * bump, sr: 1 + 0.2 * bump };
    }); M.uv(bk, m.fabric, null, 7);
    put(back, bk, m.fabric);
    // وسائد زينة
    const pil = this.part('pillows', new V3(0, 2.0, 0.5), 0.85, 'pillows');
    const pg = softBox(0.44, 0.42, 0.15, 0.07, { puff: { z: 0.05 } }); M.uv(pg, m.accent, null, 2);
    const plist = seats === 2 ? [[a1 - 0.2, 0.1, 0.1]] : seats === 3 ? [[a0 + 0.22, 0.1, 0.1], [a1 - 0.2, 0.08, -0.12]] : [[a0 + 0.22, 0.1, 0.1], [a1 - 0.2, 0.08, -0.12], [a0 + A * 0.42, 0.12, 0.05]];
    plist.forEach(([phi, rho, tw], i) => { const [x, z] = at(phi, rho); const pm = put(pil, pg, m.accent, x, 0.7, z, -0.3, -phi + tw * (i % 2 ? 1 : -1), 0); pm.scale.setScalar(i === 2 ? 0.86 : 1); });
  }
}

/* ==================================================================== الكرسي البرميلي Lune */
export class Armchair extends Product {
  constructor(C) { super(C, 'chair', { opts: {}, sel: Object.assign({}, C.style.defaults.chair) }); }
  makeMats() {
    const M = this.M, s = this.sel;
    this.mats.fabric = M.fabricMat(byId(FABRICS, s.fabric), 5);
    this.mats.wood = M.woodMat(byId(WOODS, s.wood), 6);
    this.mats.metal = M.metalMat(METALS[this.C.style.metal]);
    this.mats.accent = M.gm({ kind: 'velvet', seed: 4, c0: '#2a120a', c1: this.C.style.accent, rough: 0.85, sheen: 1, sheenC: '#ffe0c0' });
  }
  buildGeometry() {
    const m = this.mats, M = this.M, R = 0.4;
    const legs = this.part('legs', new V3(0, 0, 0), 0.0, 'legs');
    const lg = new THREE.CylinderGeometry(0.03, 0.017, 0.26, 12); M.uv(lg, m.wood, 'y', 2);
    const cap = new THREE.CylinderGeometry(0.018, 0.018, 0.012, 12);
    for (let k = 0; k < 4; k++) {
      const a = PI / 4 + k * PI / 2, rx = Math.cos(a), rz = Math.sin(a);
      const tilt = 0.17;
      const g = put(legs, lg, m.wood, rx * 0.3, 0.125, rz * 0.3);
      g.rotation.set(-rz * tilt, 0, rx * tilt);
      put(legs, cap, m.metal, rx * 0.3 + rx * 0.026, 0.006, rz * 0.3 + rz * 0.026);
    }
    const shell = this.part('shell', new V3(0, 0.9, -0.55), 0.3, 'shell');
    const prof = rrectProfile(0.22, 0.6, 0.085, 5, 0, 0.52);
    const sg = sweepArc(prof, {
      R, a0: -2.5, a1: 2.5, segs: 90, endRound: 0.12,
      fn: (i, phi) => { const sy = 0.52 + 0.48 * Math.pow(Math.max(0, Math.cos(phi * 0.64)), 1.4); return { sy, dy: (sy - 1) * 0.3 }; }
    });
    M.uv(sg, m.fabric, null, 5);
    put(shell, sg, m.fabric, 0, 0, -R); // مركز الحلقة عند الأصل، الفتحة نحو +z
    const seat = this.part('seat', new V3(0, 1.15, 0.2), 0.55, 'cushions');
    const cg = roundedCylinder(0.3, 0.15, 0.07, 56); M.uv(cg, m.fabric, null, 9);
    put(seat, cg, m.fabric, 0, 0.37, 0.0);
    const pil = this.part('pillows', new V3(0, 1.6, -0.2), 0.8, 'pillows');
    const pg = softBox(0.4, 0.3, 0.13, 0.06, { puff: { z: 0.05 } }); M.uv(pg, m.accent, null, 4);
    put(pil, pg, m.accent, 0.0, 0.6, -0.2, -0.3, 0, 0);
  }
}

/* ==================================================================== طاولتا القهوة Orbe */
function flutedCylinder(r, h, flutes, depth, seg = 192) {
  const g = new THREE.CylinderGeometry(r, r, h, seg, 1, false);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), th = Math.atan2(z, x);
    const k = 1 + depth * Math.cos(th * flutes);
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  return g;
}
export class CoffeeTable extends Product {
  constructor(C) { super(C, 'coffee', { opts: { size: 1 }, sel: Object.assign({}, C.style.defaults.coffee, { wood: C.style.defaults.sofa.wood }) }); }
  makeMats() {
    const M = this.M, s = this.sel;
    this.mats.stone = M.stoneMat(byId(STONES, s.stone), 7);
    this.mats.wood = M.woodMat(byId(WOODS, s.wood), 8);
    this.mats.metal = M.metalMat(METALS[this.C.style.metal]);
  }
  buildGeometry(o) {
    const m = this.mats, M = this.M, k = o.size === 2 ? 1.18 : 1;
    const tops = this.part('tops', new V3(0, 0.9, 0), 0.4, 'top'), bases = this.part('bases', new V3(0, 0.0, 0), 0.0, 'base'), rings = this.part('rings', new V3(0, 0.3, 0), 0.2, 'ring');
    const mk = (r, h, x, z, seed) => {
      const tg = roundedCylinder(r, 0.036, 0.008, 72); M.uv(tg, m.stone, null, seed);
      put(tops, tg, m.stone, x, h - 0.018, z);
      const bg = flutedCylinder(r * 0.64, h - 0.04, 22, 0.02); M.uv(bg, m.wood, 'y', seed + 1);
      put(bases, bg, m.wood, x, (h - 0.04) / 2 + 0.012, z);
      const rg = new THREE.TorusGeometry(r * 0.655, 0.0065, 10, 72); put(rings, rg, m.metal, x, h - 0.045, z, PI / 2, 0, 0);
      const rg2 = new THREE.TorusGeometry(r * 0.655, 0.0065, 10, 72); put(rings, rg2, m.metal, x, 0.02, z, PI / 2, 0, 0);
    };
    mk(0.46 * k, 0.4, 0, 0, 1);
    mk(0.28 * k, 0.3, 0.56 * k + 0.1, 0.5 * k + 0.05, 5);
  }
}

/* ==================================================================== كرسي السفرة Courbe */
function buildChairInto(P, parts, x, z, ry, seedBase) {
  const m = P.mats, M = P.M;
  const mk = (part) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; parts[part].add(g); return g; };
  const gL = mk('legs'), gF = mk('frame'), gS = mk('seat'), gB = mk('back');
  // أرجل أمامية
  const fl = new THREE.CylinderGeometry(0.027, 0.016, 0.44, 12); M.uv(fl, m.wood, 'y', seedBase);
  const cap = new THREE.CylinderGeometry(0.0175, 0.0175, 0.012, 10);
  for (const sx of [-1, 1]) { put(gL, fl, m.wood, sx * 0.205, 0.22, 0.2); put(gL, cap, m.metal, sx * 0.205, 0.006, 0.2); }
  // أرجل خلفية منحنية
  for (const sx of [-1, 1]) {
    const cv = new THREE.CatmullRomCurve3([new V3(sx * 0.2, 0, -0.2), new V3(sx * 0.2, 0.44, -0.205), new V3(sx * 0.205, 0.72, -0.255), new V3(sx * 0.215, 0.83, -0.3)]);
    const tg = new THREE.TubeGeometry(cv, 24, 0.0185, 10, false); M.uv(tg, m.wood, 'y', seedBase + 1);
    put(gL, tg, m.wood);
    put(gL, cap, m.metal, sx * 0.2, 0.006, -0.2);
  }
  const fr = softBox(0.46, 0.045, 0.46, 0.016, { segR: 3 }); M.uv(fr, m.wood, 'x', seedBase + 2);
  put(gF, fr, m.wood, 0, 0.43, 0.0);
  const sg = softBox(0.44, 0.075, 0.43, 0.034, { puff: { y: 0.014 }, segR: 3, density: 0.09 }); M.uv(sg, m.fabric, null, seedBase + 3);
  put(gS, sg, m.fabric, 0, 0.49, 0.005);
  const R = 0.3;
  const bg = sweepArc(rrectProfile(0.06, 0.25, 0.026, 3, 0, 0.68), { R, a0: -0.66, a1: 0.66, segs: 22, endRound: 0.07, fn: (i, phi, t) => ({ sr: 1 + 0.1 * Math.sin(PI * t) }) }); M.uv(bg, m.fabric, null, seedBase + 4);
  put(gB, bg, m.fabric, 0, 0, -0.245 - 0.015);
  const rg = sweepArc(rrectProfile(0.026, 0.034, 0.012, 3, 0.012, 0.82), { R: R + 0.0, a0: -0.7, a1: 0.7, segs: 22, endRound: 0.04 }); M.uv(rg, m.wood, 'x', seedBase + 5);
  put(gB, rg, m.wood, 0, 0, -0.26);
}
export class DiningChair extends Product {
  constructor(C, table) { super(C, 'dchair', { opts: { count: 6 }, sel: Object.assign({}, C.style.defaults.dchair) }); this.table = table; this.syncTable(); }
  makeMats() {
    const M = this.M, s = this.sel;
    this.mats.fabric = M.fabricMat(byId(FABRICS, s.fabric), 11);
    this.mats.wood = M.woodMat(byId(WOODS, s.wood), 12);
    this.mats.metal = M.metalMat(METALS[this.C.style.metal]);
  }
  syncTable() { if (!this.table) return; const L = this.table.opts.length, per = Math.floor((L - 0.2) / 0.58); this.opts.count = per * 2 + 2; this.rebuild(); }
  buildGeometry() {
    if (!this.table) return;
    const L = this.table.opts.length, W = 1.0, per = Math.floor((L - 0.2) / 0.58);
    const parts = { legs: this.part('legs', new V3(0, 0, 0), 0.0, 'legs'), frame: this.part('frame', new V3(0, 0.55, 0), 0.2, 'frame'), seat: this.part('seat', new V3(0, 1.0, 0), 0.4, 'seat'), back: this.part('back', new V3(0, 1.4, -0.3), 0.6, 'back') };
    let n = 0;
    const gap = (L - 0.2) / per;
    for (let i = 0; i < per; i++) {
      const x = -L / 2 + 0.1 + gap * (i + 0.5);
      buildChairInto(this, parts, x, W / 2 + 0.1, 0, ++n * 7);
      buildChairInto(this, parts, x, -W / 2 - 0.1, PI, ++n * 7);
    }
    buildChairInto(this, parts, -L / 2 - 0.22, 0, -PI / 2, ++n * 7);
    buildChairInto(this, parts, L / 2 + 0.22, 0, PI / 2, ++n * 7);
  }
}

/* ==================================================================== طاولة السفرة Atelier */
export class DiningTable extends Product {
  constructor(C) { super(C, 'table', { opts: { length: 2.2, top: C.style.defaults.table.top || 'wood' }, sel: Object.assign({ stone: 'carrara' }, C.style.defaults.table) }); }
  makeMats() {
    const M = this.M, s = this.sel;
    this.mats.wood = M.woodMat(byId(WOODS, s.wood), 13);
    this.mats.stone = M.stoneMat(byId(STONES, s.stone || 'carrara'), 14);
    this.mats.metal = M.metalMat(METALS[this.C.style.metal]);
  }
  buildGeometry(o) {
    const m = this.mats, M = this.M, L = o.length, W = 1.0;
    const topMat = o.top === 'stone' ? m.stone : m.wood, th = o.top === 'stone' ? 0.04 : 0.052;
    const top = this.part('top', new V3(0, 1.0, 0), 0.4, 'top');
    const tg = extrude(roundedRectShape(L, W, 0.14), th, 0.008, 4); tg.rotateX(-PI / 2); M.uv(tg, topMat, 'x', 3);
    put(top, tg, topMat, 0, 0.74 - th / 2, 0);
    if (o.top === 'stone') {
      // إطار خشبي تحت الرخام
      const ag = extrude(roundedRectShape(L - 0.28, W - 0.28, 0.1), 0.05, 0.006, 3); ag.rotateX(-PI / 2); M.uv(ag, m.wood, 'x', 4);
      put(top, ag, m.wood, 0, 0.74 - th - 0.025, 0);
    }
    const legs = this.part('legs', new V3(0, 0, 0), 0.0, 'legs');
    const ow = 0.86, hs = 0.3, th2 = 0.1;
    const sh = archShape(ow, hs); sh.holes.push(archPath(0.6, 0.3));
    for (const sx of [-1, 1]) {
      const lg = extrude(sh, th2, 0.006, 3); lg.rotateY(PI / 2); M.uv(lg, m.wood, 'y', 5 + sx);
      put(legs, lg, m.wood, sx * (L / 2 - 0.42), 0, 0);
    }
    const bar = this.part('bar', new V3(0, 0.45, 0), 0.2, 'beam');
    const bg = softBox(L - 0.9, 0.06, 0.07, 0.02, { segR: 3 }); M.uv(bg, m.wood, 'x', 9);
    put(bar, bg, m.wood, 0, 0.36, 0);
    const feet = this.part('feet', new V3(0, -0.0, 0), 0.0, 'brass');
    const fg = softBox(0.1, 0.012, 0.13, 0.004, { segR: 2 });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(feet, fg, m.metal, sx * (L / 2 - 0.42), 0.006, sz * 0.37);
    const inl = this.part('inlay', new V3(0, 1.3, 0), 0.5, 'inlay');
    const pg = softBox(0.2, 0.004, 0.016, 0.001, { segR: 1 });
    for (const sx of [-1, 1]) put(inl, pg, m.metal, sx * (L / 2 - 0.2), 0.7405, 0).castShadow = false;
  }
}

/* ==================================================================== السرير Nuit */
export class Bed extends Product {
  constructor(C) { super(C, 'bed', { opts: { size: 1.8 }, sel: Object.assign({}, C.style.defaults.bed) }); }
  makeMats() {
    const M = this.M, s = this.sel, st = this.C.style;
    this.mats.fabric = M.fabricMat(byId(FABRICS, s.fabric), 15);
    this.mats.wood = M.woodMat(byId(WOODS, s.wood), 16);
    this.mats.metal = M.metalMat(METALS[st.metal]);
    this.mats.sheet = M.gm({ kind: 'linen', seed: 3, c0: '#bdb2a0', c1: '#fbf6ea', rough: 0.95, sheen: 0.3 });
    this.mats.duvet = M.gm({ kind: 'linen', seed: 6, c0: st.curtain[0], c1: st.curtain[1], rough: 0.95, sheen: 0.35 });
    this.mats.throw = M.gm({ kind: 'boucle', seed: 8, c0: '#2a1a10', c1: st.accent, rough: 0.96, sheen: 0.4 });
    this.mats.accent = M.gm({ kind: 'velvet', seed: 5, c0: '#2a120a', c1: st.accent, rough: 0.85, sheen: 1, sheenC: '#ffe0c0' });
    this.mats.glow = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffb868').multiplyScalar(2.2) });
  }
  buildGeometry(o) {
    const m = this.mats, M = this.M, W = o.size, Lm = 2.0, Wm = W, Wf = W + 0.1, Lf = Lm + 0.12;
    const zc = 0; // مركز المرتبة
    const base = this.part('base', new V3(0, -0.0, 0), 0.0, 'base');
    const bg = softBox(Wf, 0.2, Lf, 0.035, { segR: 3, maxFlat: 6 }); M.uv(bg, m.wood, 'x', 3);
    put(base, bg, m.wood, 0, 0.21, zc);
    const strip = new THREE.BoxGeometry(Wf - 0.08, 0.012, Lf - 0.08);
    const sm = put(base, strip, m.glow, 0, 0.098, zc); sm.castShadow = false; sm.userData.led = true;
    const head = this.part('head', new V3(0, 0.9, -0.5), 0.25, 'headboard');
    const hw = Wf / 2 + 0.06, Hs = 0.95, Hp = 1.5, n = Math.round((hw * 2) / 0.072), rw = (hw * 2) / n;
    for (let i = 0; i < n; i++) {
      const x = -hw + rw * (i + 0.5), u = x / hw;
      const hgt = Hs + (Hp - Hs) * Math.sqrt(Math.max(0, 1 - u * u * 0.999));
      const rg = softBox(rw - 0.004, hgt, 0.12, 0.028, { segR: 3, puff: { z: 0.012 }, density: 0.2, maxFlat: 5 }); M.uv(rg, m.fabric, null, 20 + i);
      put(head, rg, m.fabric, x, hgt / 2 + 0.0, -Lf / 2 - 0.04);
    }
    const mat = this.part('mattress', new V3(0, 0.55, 0.0), 0.5, 'mattress');
    const mg = softBox(Wm, 0.25, Lm, 0.07, { puff: { y: 0.012 }, segR: 3, density: 0.14, maxFlat: 14 }); M.uv(mg, m.sheet, null, 5);
    put(mat, mg, m.sheet, 0, 0.44, zc);
    const bed = this.part('bedding', new V3(0, 1.0, 0.25), 0.7, 'bedding');
    const dl = 1.5, dg = softBox(Wm + 0.16, 0.12, dl, 0.05, { puff: { y: 0.032, x: 0.012 }, segR: 3, density: 0.1, maxFlat: 14 }); M.uv(dg, m.duvet, null, 6);
    put(bed, dg, m.duvet, 0, 0.6, zc + Lm / 2 - dl / 2 + 0.1);
    const tg = softBox(Wm + 0.12, 0.05, 0.46, 0.022, { puff: { y: 0.01 }, segR: 3, density: 0.1 }); M.uv(tg, m.throw, null, 8);
    put(bed, tg, m.throw, 0, 0.678, zc + Lm / 2 - 0.34);
    const pil = this.part('pillows', new V3(0, 1.5, -0.3), 0.85, 'pillows');
    const pg = softBox(0.62, 0.16, 0.44, 0.07, { puff: { y: 0.055 }, segR: 3, density: 0.07, maxFlat: 10 }); M.uv(pg, m.sheet, null, 7);
    const eg = softBox(0.62, 0.62, 0.14, 0.07, { puff: { z: 0.05 }, segR: 3, density: 0.07, maxFlat: 10 }); M.uv(eg, m.duvet, null, 8);
    const cnt = W >= 1.8 ? 2 : 2, gapx = W / (cnt * 2) * 1.0;
    for (let i = 0; i < cnt; i++) {
      const x = (i - (cnt - 1) / 2) * (W / cnt);
      put(pil, eg, m.duvet, x, 0.74, zc - Lm / 2 + 0.2, -0.12, 0, 0);
      put(pil, pg, m.sheet, x, 0.64, zc - Lm / 2 + 0.55, -0.28, (i ? -1 : 1) * 0.03, 0);
    }
    const lum = softBox(0.5, 0.2, 0.12, 0.06, { puff: { z: 0.045 }, segR: 3, density: 0.07 }); M.uv(lum, m.accent, null, 9);
    put(pil, lum, m.accent, 0.12, 0.7, zc - Lm / 2 + 0.78, -0.55, 0.12, 0);
    // مقعد القدم
    const bench = this.part('bench', new V3(0, 0.4, 0.7), 0.95, 'bench');
    const bw = Math.min(1.4, Wm - 0.3);
    const sg = softBox(bw, 0.13, 0.42, 0.055, { puff: { y: 0.02 }, segR: 3, density: 0.1 }); M.uv(sg, m.fabric, null, 21);
    put(bench, sg, m.fabric, 0, 0.41, Lf / 2 + 0.38);
    const lg = new THREE.CylinderGeometry(0.03, 0.02, 0.33, 12); M.uv(lg, m.wood, 'y', 7);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) put(bench, lg, m.wood, sx * (bw / 2 - 0.08), 0.165, Lf / 2 + 0.38 + sz * 0.15);
    this.led = sm;
  }
}
