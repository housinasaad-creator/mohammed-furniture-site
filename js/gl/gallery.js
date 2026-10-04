/*
  المعرض: رواق طويل بأربع مناطق (مدخل/صالون/سفرة/نوم)، جدار جص بنوافذ مقوّسة (هي نفسها شعار العلامة)،
  أرضية ترافرتين عاكسة، منتجات حيّة، ديكور، مصابيح تشتعل عند الغروب.
  كل منطقة "تُبنى" أمام الزائر عند وصوله: القطع تتجمّع من أجزائها والديكور يطلع بالتتابع.
*/
import * as THREE from 'three';
import { softBox, roundedCylinder, archShape, archPath, extrude, mergeGeos, projectUV } from './geo.js';
import { METALS, WOODS, FABRICS, STYLES, byId } from './data.js';
import { Sofa, Armchair, CoffeeTable, DiningTable, DiningChair, Bed } from './furniture.js';
import * as D from './decor.js';
import { Outdoors } from './outdoors.js';

const V3 = THREE.Vector3, PI = Math.PI;
export const ZX = [-14, 0, 14, 28];
export const WALL_Z = -3.0;
const WALL_H = 5.4;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (t) => 1 - Math.pow(1 - t, 3);
const easeBack = (t) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };

function put(parent, geo, mat, x = 0, y = 0, z = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; m.position.set(x, y, z); parent.add(m); return m;
}
const wallTones = (hex) => { const c = new THREE.Color(hex); const c0 = c.clone().multiplyScalar(0.8), c1 = c.clone().multiplyScalar(1.1); return { c0: '#' + c0.getHexString(), c1: '#' + c1.getHexString() }; };

export class Gallery {
  constructor(world, styleIndex = 0) {
    this.w = world; this.scene = world.scene; this.M = world.mats;
    this.styleIndex = styleIndex; this.style = STYLES[styleIndex];
    this.C = { mats: world.mats, style: this.style, styleMats: { rug: [], curtain: [], wall: [], floor: [], trim: [] }, lamps: [], fluted: [], timeU: { value: 0 } };
    this.zones = ZX.map((c, i) => ({ i, c, products: [], decor: [], built: false, root: new THREE.Group() }));
    this.zones.forEach((z) => this.scene.add(z.root));
    this.anim = [];
    this.out = new Outdoors(world);
    this.buildShell();
    this.buildZones();
    this.out.buildBeams(15);
    this.finalize();
  }

  /* ---------------------------------------------------------------- القشرة: أرضية، جدران، نوافذ، سقف */
  buildShell() {
    const w = this.w, M = this.M, st = this.style, scene = this.scene;
    // أرضية
    const fm = M.gm({ kind: 'travertine', c0: st.floor[0], c1: st.floor[1], rough: 0.34, cc: 0.0, bump: 0.12 });
    w.floorReflective(fm);
    const fg = new THREE.PlaneGeometry(110, 60).rotateX(-PI / 2);
    const p = fg.attributes.position, uv = new Float32Array(p.count * 2);
    for (let i = 0; i < p.count; i++) { uv[i * 2] = (p.getX(i) + 7) / 2.4; uv[i * 2 + 1] = (p.getZ(i) + 27) / 2.4; }
    fg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    this.floor = new THREE.Mesh(fg, fm); this.floor.position.set(7, 0, 27); this.floor.receiveShadow = true;
    scene.add(this.floor); w.reflHide.push(this.floor); w.reflFloor = true; this.C.styleMats.floor.push(fm);
    this.floorMat = fm;
    // جدران لكل منطقة مع نافذتين مقوّستين
    this.wallMats = [];
    const steel = M.metalMat(METALS.black);
    const WW = 1.6, HS = 2.6;
    ZX.forEach((c, zi) => {
      const sh = new THREE.Shape(); sh.moveTo(-7, -0.3); sh.lineTo(7, -0.3); sh.lineTo(7, WALL_H); sh.lineTo(-7, WALL_H); sh.lineTo(-7, -0.3);
      // إزاحة الفتحات أفقياً: نبنيها بمسارات مركزها ±1.24
      for (const sx of [-1, 1]) {
        const r = WW / 2, cx = sx * 1.24, pth = new THREE.Path();
        pth.moveTo(cx - r, 0); pth.lineTo(cx - r, HS); pth.absarc(cx, HS, r, PI, 0, true); pth.lineTo(cx + r, 0); pth.lineTo(cx - r, 0);
        sh.holes.push(pth);
      }
      const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.45, bevelEnabled: false, curveSegments: 20 });
      const tones = wallTones(st.walls[zi]);
      const mat = M.gm({ kind: 'plaster', seed: zi * 3 + 1, c0: tones.c0, c1: tones.c1, rough: 0.92, bump: 0.7 });
      M.uv(geo, mat, null, zi);
      const m = put(this.scene, geo, mat, c, 0, WALL_Z - 0.45); m.castShadow = true;
      this.wallMats.push(mat); this.C.styleMats.wall.push(mat);
      // إطارات النوافذ الفولاذية
      for (const sx of [-1, 1]) {
        const x = c + sx * 1.24;
        this.out.addWindow(x, WALL_Z, WW, HS);
        const fr = new THREE.Shape(); {
          const r = WW / 2; fr.moveTo(-r, 0); fr.lineTo(-r, HS); fr.absarc(0, HS, r, PI, 0, true); fr.lineTo(r, 0); fr.lineTo(-r, 0);
          const ri = r - 0.05, ip = new THREE.Path(); ip.moveTo(-ri, 0.06); ip.lineTo(-ri, HS); ip.absarc(0, HS, ri, PI, 0, true); ip.lineTo(ri, 0.06); ip.lineTo(-ri, 0.06); fr.holes.push(ip);
        }
        const fgeo = new THREE.ExtrudeGeometry(fr, { depth: 0.06, bevelEnabled: false, curveSegments: 24 });
        const bars = [];
        const bar = (bw, bh, bx, by, rot = 0) => { const b = new THREE.BoxGeometry(bw, bh, 0.05); if (rot) b.rotateZ(rot); b.translate(bx, by, 0.03); bars.push(b); };
        bar(0.026, HS + WW / 2 - 0.06, 0, (HS + WW / 2 + 0.06) / 2);
        for (const y of [0.95, 1.85]) bar(WW - 0.08, 0.024, 0, y);
        bar(WW - 0.08, 0.024, 0, HS);
        for (const a of [PI / 4, -PI / 4]) bar(0.024, WW / 2 - 0.05, Math.sin(-a) * (WW / 4 - 0.02), HS + Math.cos(a) * (WW / 4 - 0.02), a);
        const all = mergeGeos([fgeo, ...bars]);
        put(this.scene, all, steel, x, 0, WALL_Z - 0.26, true);
      }
    });
    // أعمدة فاصلة بين المناطق
    const tr = M.gm({ kind: 'plaster', seed: 11, c0: '#6e6355', c1: '#cfc3ad', rough: 0.9, bump: 0.6 });
    this.C.styleMats.trim.push(tr);
    for (const x of [-21, -7, 7, 21, 35]) {
      const g = softBox(0.7, WALL_H, 0.24, 0.02, { segR: 2, maxFlat: 3 }); M.uv(g, tr, null, 5);
      put(this.scene, g, tr, x, WALL_H / 2, WALL_Z + 0.12);
    }
    // جدران طرفية (تمنع دخول الضوء من الجانبين)
    const endMat = M.gm({ kind: 'plaster', seed: 31, c0: '#8a7d6a', c1: '#e6dac4', rough: 0.95, bump: 0.5 });
    this.C.styleMats.trim.push(endMat);
    for (const x of [-21.4, 35.4]) {
      const eg = new THREE.BoxGeometry(0.4, WALL_H + 0.3, 40); M.uv(eg, endMat, null, 9);
      const em = new THREE.Mesh(eg, endMat); em.position.set(x, WALL_H / 2, 15); em.castShadow = true; em.receiveShadow = true; scene.add(em);
    }
    // سقف

    const cm = M.gm({ kind: 'plaster', seed: 21, c0: '#8a7d6a', c1: '#e6dac4', rough: 0.95, bump: 0.5 });
    const cg = new THREE.PlaneGeometry(70, 30).rotateX(PI / 2); M.uv(cg, cm, null, 3);
    this.ceiling = new THREE.Mesh(cg, cm); this.ceiling.position.set(7, WALL_H, 12); this.ceiling.castShadow = true; this.ceiling.receiveShadow = false; scene.add(this.ceiling);
    this.C.styleMats.trim.push(cm);
    // حواف السقف مضيئة (cove) لتمنح عمقاً
    const cove = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd9a8').multiplyScalar(0.9) });
    this.coveMat = cove;
    const cvg = new THREE.BoxGeometry(70, 0.05, 0.1); const cvm = new THREE.Mesh(cvg, cove); cvm.position.set(7, WALL_H - 0.18, WALL_Z + 0.3); scene.add(cvm);
  }

  /* ---------------------------------------------------------------- المناطق */
  buildZones() {
    const C = this.C, w = this.w, M = this.M, st = this.style;
    const Z = this.zones;
    // المنتجات
    this.sofa = new Sofa(C); this.chair = new Armchair(C); this.coffee = new CoffeeTable(C);
    this.table = new DiningTable(C); this.dchair = new DiningChair(C, this.table); this.bed = new Bed(C);
    this.products = { sofa: this.sofa, chair: this.chair, coffee: this.coffee, table: this.table, dchair: this.dchair, bed: this.bed };
    const addTo = (zi, obj, x, y, z, ry = 0, delay = 0, pop = true) => { obj.position.set(x, y, z); obj.rotation.y = ry; Z[zi].root.add(obj); if (pop) Z[zi].decor.push({ o: obj, delay, base: obj.scale.clone() }); return obj; };

    // ---------- 0: المدخل + الشعار
    const logo = D.makeLogo3D(C, 1.0); this.logo = logo;
    const plinthMat = M.stoneMat({ c0: '#d8cdb6', c1: '#f3eee4' }, 5);
    const pl = new THREE.Group();
    const pg = softBox(3.1, 0.42, 1.05, 0.03, { segR: 3, maxFlat: 4 }); M.uv(pg, plinthMat, null, 3);
    put(pl, pg, plinthMat, 0, 0.21, 0);
    logo.position.set(0, 0.42, 0); pl.add(logo);
    addTo(0, pl, ZX[0], 0, -0.9, 0, 0, false);
    Z[0].logoGroup = pl;
    this.spots = [];
    for (const [sx, k, col] of [[-3.2, 1.0, 0xffe3bc], [3.6, 0.55, 0xcfe0ff]]) {
      const sp = new THREE.SpotLight(col, 0, 26, 0.55, 0.85, 2); sp.position.set(ZX[0] + sx, 5.0, 4.6); sp.target.position.set(ZX[0], 1.0, -0.9);
      this.scene.add(sp, sp.target); this.spots.push({ sp, k });
    }
    const o0a = D.makeOlive(C, 1.15, 1), o0b = D.makeOlive(C, 0.95, 4);
    addTo(0, o0a, ZX[0] - 4.4, 0, -1.9, 0, 0.5); addTo(0, o0b, ZX[0] + 4.6, 0, -1.8, 2, 0.7);
    const bench = new THREE.Group(); const bm = M.stoneMat({ c0: '#c4b79d', c1: '#efe7d6' }, 9);
    const bg = softBox(1.7, 0.42, 0.55, 0.05, { segR: 3, maxFlat: 3 }); M.uv(bg, bm, null, 4);
    put(bench, bg, bm, 0, 0.21, 0); addTo(0, bench, ZX[0] + 3.0, 0, 0.7, -0.4, 0.3);

    // ---------- 1: الصالون
    const c1 = ZX[1];
    const rug1 = D.makeRug(C, 4.8, 3.5, st.rug[0], st.rug[1], 2); addTo(1, rug1, c1 + 0.2, 0, 0.3, 0, 0);
    this.sofa.group.position.set(c1, 0, -1.4); Z[1].root.add(this.sofa.group); Z[1].products.push(this.sofa);
    this.coffee.group.position.set(c1 + 0.25, 0, 0.75); Z[1].root.add(this.coffee.group); Z[1].products.push(this.coffee);
    this.chair.group.position.set(c1 - 3.05, 0, 0.55); this.chair.group.rotation.y = 1.08; Z[1].root.add(this.chair.group); Z[1].products.push(this.chair);
    addTo(1, D.makeArcLamp(C), c1 + 3.4, 0, -1.95, 0, 0.9);
    addTo(1, D.makeOlive(C, 1.3, 3), c1 - 5.3, 0, -2.1, 0.7, 0.6);
    const art = D.makeArt(C, 1.3, 1.9, 3); addTo(1, art, c1 - 5.0, 2.15, WALL_Z + 0.03, 0, 1.0);
    const fl = D.makeFluted(C, 2.3, 1.8, 9, st.defaults.sofa.wood); addTo(1, fl, c1 + 5.0, 0, WALL_Z + 0.002, 0, 0.8);
    const cons = D.makeSideboard(C, 1.5, 12); cons.scale.set(1, 0.75, 0.8); addTo(1, cons, c1 + 5.0, 0, WALL_Z + 0.4, 0, 1.0);
    const v1 = D.makeVase(C, 0, '#d9c8aa', 2); addTo(1, v1, c1 + 4.6, 0.98 * 0.75 + 0.02, WALL_Z + 0.42, 0, 1.2);
    const bk = D.makeBooks(C, 3); bk.position.set(0, 0, 0);
    const kb = new THREE.Group(); kb.add(bk); addTo(1, kb, c1 + 0.2, 0.4, 0.55, 0.3, 1.1);
    const v2 = D.makeVase(C, 2, '#b5683f', 7, false); addTo(1, v2, c1 + 0.8, 0.3, 1.3, 0, 1.1);

    // ---------- 2: السفرة
    const c2 = ZX[2];
    const rug2 = D.makeRug(C, 4.8, 3.3, st.rug[0], st.rug[1], 5); addTo(2, rug2, c2, 0, 0.1, 0, 0);
    this.table.group.position.set(c2, 0, 0.1); this.dchair.group.position.set(c2, 0, 0.1);
    Z[2].root.add(this.table.group, this.dchair.group); Z[2].products.push(this.table, this.dchair);
    const pend = D.makePendants(C, 3, 0.9, 1.95); addTo(2, pend, c2, 0, 0.1, 0, 0.9, false); Z[2].decor.push({ o: pend, delay: 0.9, base: pend.scale.clone(), drop: true });
    const sb = D.makeSideboard(C, 2.2, 6); addTo(2, sb, c2, 0, WALL_Z + 0.38, 0, 0.7);
    addTo(2, D.makeTableLamp(C, '#cfc0a4', 2), c2 - 0.85, 0.79, WALL_Z + 0.4, 0, 1.0);
    addTo(2, D.makeTableLamp(C, '#cfc0a4', 3), c2 + 0.85, 0.79, WALL_Z + 0.4, 0, 1.1);
    addTo(2, D.makeVase(C, 1, '#e8dfcf', 4), c2 + 0.05, 0.79, WALL_Z + 0.4, 0, 1.2);
    addTo(2, D.makeOlive(C, 1.2, 5), c2 + 5.4, 0, -2.0, 1.1, 0.6);
    addTo(2, D.makeCurtain(C, 1.15, 3.9, 4), c2 - 3.35, 0, WALL_Z + 0.12, 0, 0.9);
    addTo(2, D.makeCurtain(C, 1.15, 3.9, 5), c2 + 3.35, 0, WALL_Z + 0.12, 0, 1.0);
    const v3 = D.makeVase(C, 0, '#a87a52', 8); addTo(2, v3, c2 - 5.2, 0, -2.5, 0, 1.0); v3.scale.setScalar(2.2);

    // ---------- 3: غرفة النوم
    const c3 = ZX[3];
    const rug3 = D.makeRug(C, 3.8, 3.0, st.rug[0], st.rug[1], 8); addTo(3, rug3, c3, 0, -0.2, 0, 0);
    this.bed.group.position.set(c3, 0, -1.75); Z[3].root.add(this.bed.group); Z[3].products.push(this.bed);
    for (const sx of [-1, 1]) {
      const ns = new THREE.Group(); const nm = M.woodMat(byId(WOODS, st.defaults.bed.wood), 20); this.nightMat = this.nightMat || nm;
      const flute = this.fluteCyl();
      put(ns, flute, nm, 0, 0.26, 0); M.uv(flute, nm, 'y', 3);
      const top = roundedCylinder(0.27, 0.025, 0.006, 48); put(ns, top, M.metalMat(METALS[st.metal]), 0, 0.5, 0);
      const lamp = D.makeTableLamp(C, '#e0d2b8', 6 + sx, 0.42); lamp.position.y = 0.512; ns.add(lamp);
      addTo(3, ns, c3 + sx * 1.62, 0, -2.4, 0, 0.9 + (sx > 0 ? 0.1 : 0));
    }
    addTo(3, D.makeCurtain(C, 1.15, 3.9, 8), c3 - 3.35, 0, WALL_Z + 0.12, 0, 0.9);
    addTo(3, D.makeCurtain(C, 1.15, 3.9, 9), c3 + 3.35, 0, WALL_Z + 0.12, 0, 1.0);
    addTo(3, D.makeOlive(C, 1.25, 6), c3 + 5.4, 0, -2.0, 0.4, 0.6);
    const v4 = D.makeVase(C, 2, '#d8c9ad', 11); addTo(3, v4, c3 - 5.1, 0, -2.4, 0, 1.0); v4.scale.setScalar(2.0);
    addTo(3, D.makeArt(C, 1.0, 1.5, 7, ['#d9cdb6', '#8a9a72', '#c88a5a', '#2f3a30', '#e0c27c']), c3 - 5.2, 1.9, WALL_Z + 0.03, 0, 1.1);
  }
  fluteCyl() {
    const g = new THREE.CylinderGeometry(0.235, 0.235, 0.5, 192, 1, false);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), th = Math.atan2(z, x), k = 1 + 0.03 * Math.cos(th * 20); p.setX(i, x * k); p.setZ(i, z * k); }
    g.computeVertexNormals(); return g;
  }

  finalize() {
    // الأضواء تُنقل لجذر المشهد: عددها ثابت دائماً (تغيّر العدد يعيد ترجمة كل الشيدرات ويسبب تجمّداً)
    this.scene.updateMatrixWorld(true);
    for (const l of this.C.lamps) {
      const o = l.light.parent; l.anchor = o; l.localPos = l.light.position.clone();
      for (let q = o; q; q = q.parent) { const z = this.zones.find((zz) => zz.root === q); if (z) { l.zone = z; break; } }
      o.remove(l.light); this.scene.add(l.light);
    }
    this.logo.scale.setScalar(0.0001);
    // كل شيء يبدأ "غير مبني"
    for (const z of this.zones) { z.built = false; this.setZoneBuilt(z, 0); }
    // رقم وكلّ منتج قابل للالتقاط
    for (const p of Object.values(this.products)) { p.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } }); }
    this.world = this.w;
    this.w.onFrame((dt, t) => this.update(dt, t));
    this.setStyleMats(this.style, false);
  }

  /* ---------------------------------------------------------------- بناء المنطقة (بالتتابع) */
  setZoneBuilt(z, v) {
    for (const p of z.products) { p.build = v; p.applyAnim(); }
    for (const d of z.decor) { const s = Math.max(0.0001, v); d.o.scale.copy(d.base).multiplyScalar(s); d.o.visible = v > 0.001; }
    if (z.logoGroup) z.logoGroup.visible = true;
  }
  enterZone(i, o = {}) {
    const z = this.zones[i]; if (!z || z.built) return false; z.built = true;
    if (i === 0) this.logoAnim = { t: -0.25 };
    const sp = o.speed || 1;
    for (const p of z.products) this.anim.push({ kind: 'prod', p, t: -(0.0 + (p.id === 'dchair' ? 0.5 : p.id === 'coffee' ? 0.3 : p.id === 'chair' ? 0.5 : 0)) / sp, dur: 2.0 / sp });
    for (const d of z.decor) this.anim.push({ kind: 'dec', d, t: -(0.15 + d.delay * 0.7) / sp, dur: 0.9 / sp });
    return true;
  }
  replay(p) { p.build = 0; p.applyAnim(); this.anim.push({ kind: 'prod', p, t: 0, dur: 1.1 }); }
  isBuilt(i) { return this.zones[i].built; }

  /* ---------------------------------------------------------------- الأنماط */
  setStyleMats(st, wave, center) {
    const M = this.M, c = center || new V3(ZX[1], 0, 0);
    const o = wave ? { radius: 42, dur: 1.9, w: 2.4 } : null;
    const go = (mat, to) => (wave ? M.morph(mat, to, c, o) : M.set(mat, to));
    this.wallMats.forEach((m, i) => go(m, wallTones(st.walls[i])));
    go(this.floorMat, { c0: st.floor[0], c1: st.floor[1] });
    this.C.styleMats.rug.forEach((m) => go(m, { c0: st.rug[0], c1: st.rug[1] }));
    this.C.styleMats.curtain.forEach((m) => go(m, { c0: st.curtain[0], c1: st.curtain[1] }));
    this.C.styleMats.trim.forEach((m, i) => go(m, i === 0 ? wallTones(st.walls[1]) : { c0: '#8a7d6a', c1: '#e6dac4' }));
    M.setGlow(st.accent);
  }
  applyStyle(index, center) {
    this.styleIndex = index; this.style = STYLES[index]; this.C.style = this.style;
    const st = this.style, c = center || new V3(ZX[1], 0, 0);
    this.setStyleMats(st, true, c);
    const d = st.defaults;
    for (const [id, p] of Object.entries(this.products)) {
      const def = d[id]; if (!def) continue;
      p.sel = Object.assign(p.sel, {});
      if (def.fabric) p.setSel('fabric', def.fabric, c);
      if (def.wood) p.setSel('wood', def.wood, c);
      if (def.stone) p.setSel('stone', def.stone, c);
      if (def.top && id === 'table') p.setSel('top', def.top);
      if (p.mats.accent) this.M.morph(p.mats.accent, { c0: '#2a120a', c1: st.accent }, c, { radius: 42, dur: 1.9, w: 2.4 });
    }
  }

  /* ---------------------------------------------------------------- كل إطار */
  update(dt, time) {
    const w = this.w, C = this.C;
    C.timeU.value = time;
    this.out.update(dt, time);
    // مصابيح
    const L = w.lampLevel();
    for (const l of C.lamps) {
      l.anchor.updateWorldMatrix(true, false);
      l.light.position.copy(l.localPos).applyMatrix4(l.anchor.matrixWorld);
      const sc = l.anchor.matrixWorld.getMaxScaleOnAxis(), on = l.zone && l.zone.built ? Math.min(1, sc) : 0;
      l.light.intensity = L * l.lightMax * on;
      for (const m of l.mats) { m.emissiveIntensity = L * l.emMax; m.color.setRGB(0.88 * (1 - 0.88 * L), 0.8 * (1 - 0.88 * L), 0.68 * (1 - 0.88 * L)); }
      if (l.fade) l.fade.opacity = L * 0.9;
    }
    for (const p of Object.values(this.products)) if (p.led) p.led.material.color.set('#ffb868').multiplyScalar(0.15 + 2.4 * L);
    this.coveMat.color.set('#ffd9a8').multiplyScalar(0.25 + 1.2 * L);
    // أنيميشن البناء
    for (let i = this.anim.length - 1; i >= 0; i--) {
      const a = this.anim[i]; a.t += dt;
      if (a.t < 0) continue;
      const u = clamp(a.t / a.dur, 0, 1);
      if (a.kind === 'prod') { a.p.build = u; a.p.applyAnim(); }
      else { const e = easeBack(u); const s = Math.max(0.0001, e); a.d.o.scale.copy(a.d.base).multiplyScalar(s); a.d.o.visible = true; if (a.d.drop) a.d.o.position.y = (1 - ease(u)) * 1.6; }
      if (u >= 1) { if (a.kind === 'prod') { a.p.build = 1; a.p.applyAnim(); } else { a.d.o.scale.copy(a.d.base); if (a.d.drop) a.d.o.position.y = 0; } this.anim.splice(i, 1); }
    }
    // ظهور الشعار: يصعد من الأرض ويستقر
    const la = this.logoAnim;
    if (la) { la.t += dt; const u = clamp(la.t / 2.6, 0, 1); const e = easeBack(Math.max(0, u)); this.logo.position.y = 0.42 - (1 - ease(u)) * 1.3; const sc = 0.2 + 0.8 * Math.min(1.04, e); this.logo.scale.setScalar(Math.max(0.0001, sc)); if (u >= 1) { this.logoAnim = null; this.logo.position.y = 0.42; this.logo.scale.setScalar(1); } }
    else if (!this._logoOn) { this._logoOn = true; }
    this.logo.rotation.y = Math.sin(time * 0.35) * 0.12 + (la ? (1 - ease(clamp(la.t / 2.6, 0, 1))) * 1.8 : 0);
    const night = w.tod.night || 0;
    for (const s of this.spots) s.sp.intensity = s.k * (13 + 45 * night) * (this.spotK === undefined ? 1 : this.spotK);
  }
}
