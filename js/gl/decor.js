/*
  الديكور الإجرائي: سجاد، أشجار زيتون، مزهريات وأغصان، لوحة أقواس، ستائر، مصابيح (تشتعل ليلاً)،
  لوحة مخدّدة مقوّسة، بوفيه، شعار العلامة ثلاثي الأبعاد.
*/
import * as THREE from 'three';
import { softBox, rrectProfile, roundedCylinder, archShape, archPath, extrude, roundedRectShape, mergeGeos, sweepArc, projectUV, smoothProfile } from './geo.js';
import { METALS, WOODS, byId } from './data.js';

const V3 = THREE.Vector3, PI = Math.PI;
const rnd = (s) => { let x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function put(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, shadow = true) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true;
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz); parent.add(m); return m;
}
function lathe(pts, seg = 40) { return new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg); }

/* ---------------------------------------------------------------- سجاد */
export function makeRug(C, w, d, c0, c1, seed = 1, round = false) {
  const M = C.mats, g = new THREE.Group();
  const mat = M.gm({ kind: 'wool', seed, c0, c1, rough: 1, sheen: 0.4, sheenRough: 0.8, bump: 1.8 });
  let geo;
  if (round) geo = roundedCylinder(w / 2, 0.022, 0.009, 72); else geo = softBox(w, 0.022, d, 0.009, { segR: 3, maxFlat: 4 });
  M.uv(geo, mat, null, seed);
  const m = put(g, geo, mat, 0, 0.011, 0, 0, 0, 0, false); m.receiveShadow = true;
  g.userData.mat = mat; C.styleMats.rug.push(mat);
  return g;
}

/* ---------------------------------------------------------------- شجرة زيتون */
let LEAF_GEO = null;
function leafGeo() {
  if (LEAF_GEO) return LEAF_GEO;
  const g = new THREE.BufferGeometry();
  const p = [0, 0, 0, 0.016, 0.03, 0.006, 0, 0.1, 0.002, -0.016, 0.03, 0.006];
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0.2, 1, 0, 0.2, 1, 0, 0.2, 1, 0, 0.2, 1], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return (LEAF_GEO = g);
}
export function makeOlive(C, scale = 1, seed = 1) {
  const M = C.mats, g = new THREE.Group();
  const pot = M.gm({ kind: 'plaster', seed: seed + 3, c0: '#8d867b', c1: '#d8d0c2', rough: 0.9, bump: 0.8 });
  const pg = lathe([[0, 0], [0.34, 0], [0.38, 0.03], [0.4, 0.4], [0.36, 0.62], [0.3, 0.66], [0.28, 0.6], [0, 0.6]], 48); M.uv(pg, pot, null, seed);
  put(g, pg, pot, 0, 0, 0);
  const soil = new THREE.MeshStandardMaterial({ color: 0x2c2118, roughness: 1 });
  put(g, new THREE.CircleGeometry(0.28, 24).rotateX(-PI / 2), soil, 0, 0.6, 0, 0, 0, 0, false);
  const bark = M.gm({ kind: 'wood', seed: seed + 7, c0: '#2a2420', c1: '#7a6a58', rough: 0.92, bump: 1.4 });
  const leafMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, side: THREE.DoubleSide });
  leafMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = C.timeU;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n transformed.x += sin(uTime*1.4 + position.y*7. + instanceMatrix[3][0]*1.7 + instanceMatrix[3][1]*2.3)*.012*(1.+position.y*8.); transformed.z += cos(uTime*1.1 + position.y*5. + instanceMatrix[3][2]*2.1)*.008;');
  };
  leafMat.customProgramCacheKey = () => 'leafsway';
  const branches = [];
  const trunkPts = [];
  const strands = 3;
  for (let s = 0; s < strands; s++) {
    const ph = (s / strands) * PI * 2, pts = [];
    for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push(new V3(0.055 * Math.sin(t * 4 + ph) * (1 - t * 0.3), 0.58 + t * 1.05, 0.055 * Math.cos(t * 4 + ph) * (1 - t * 0.3))); }
    const cv = new THREE.CatmullRomCurve3(pts);
    put(g, new THREE.TubeGeometry(cv, 24, 0.052 - s * 0.006, 10, false), bark, 0, 0, 0);
    trunkPts.push(pts[8]);
  }
  const top = new V3(0, 1.62, 0);
  const NB = 13; const leafPts = [];
  for (let b = 0; b < NB; b++) {
    const a = rnd(seed * 31 + b) * PI * 2, up = 0.45 + rnd(seed * 17 + b) * 0.5, len = 0.5 + rnd(seed * 5 + b) * 0.55;
    const start = top.clone().add(new V3(0, -rnd(b + seed) * 0.35, 0));
    const end = start.clone().add(new V3(Math.cos(a) * len, up * len * 1.2, Math.sin(a) * len));
    const mid = start.clone().lerp(end, 0.5).add(new V3(0, 0.12, 0));
    const cv = new THREE.CatmullRomCurve3([start, mid, end]);
    put(g, new THREE.TubeGeometry(cv, 10, 0.014, 6, false), bark, 0, 0, 0, 0, 0, 0, false);
    for (let k = 0; k < 70; k++) leafPts.push([cv.getPoint(Math.pow(rnd(seed * 9 + b * 50 + k), 0.7)), rnd(seed + b * 70 + k * 3.1)]);
  }
  const N = leafPts.length, inst = new THREE.InstancedMesh(leafGeo(), leafMat, N);
  const dummy = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const [p, r] = leafPts[i];
    dummy.position.copy(p).add(new V3((rnd(i + seed) - 0.5) * 0.22, (rnd(i * 2 + seed) - 0.5) * 0.2, (rnd(i * 3 + seed) - 0.5) * 0.22));
    dummy.rotation.set((rnd(i * 4 + seed) - 0.5) * 3, rnd(i * 5 + seed) * 6.28, (rnd(i * 6 + seed) - 0.5) * 3);
    const s = 0.75 + rnd(i * 7 + seed) * 0.8; dummy.scale.set(s, s * 1.1, s);
    dummy.updateMatrix(); inst.setMatrixAt(i, dummy.matrix);
    col.setHSL(0.24 + r * 0.06, 0.28 + r * 0.14, 0.2 + r * 0.17); inst.setColorAt(i, col);
  }
  inst.castShadow = true; inst.receiveShadow = true; g.add(inst);
  g.scale.setScalar(scale);
  return g;
}

/* ---------------------------------------------------------------- مزهريات وأغصان جافة */
export function makeVase(C, kind = 0, color = '#e6dccb', seed = 1, branches = true) {
  const M = C.mats, g = new THREE.Group();
  const mat = M.gm({ c1: color, rough: 0.34, cc: 0.35, ccRough: 0.15 });
  const prof = [
    [[0, 0], [0.07, 0], [0.1, 0.05], [0.12, 0.2], [0.07, 0.34], [0.04, 0.42], [0.045, 0.48], [0.0, 0.48]],
    [[0, 0], [0.09, 0], [0.11, 0.1], [0.1, 0.3], [0.05, 0.4], [0.035, 0.46], [0.05, 0.5], [0, 0.5]],
    [[0, 0], [0.06, 0], [0.13, 0.1], [0.13, 0.2], [0.06, 0.28], [0.05, 0.3], [0.0, 0.3]]
  ][kind % 3];
  const sp = smoothProfile(prof.slice(0, prof.length - 1), 48); sp.push([0, prof[prof.length - 1][1]]);
  const geo = lathe(sp, 48); put(g, geo, mat, 0, 0, 0);
  const H = prof[prof.length - 2][1];
  if (branches) {
    const stem = new THREE.MeshStandardMaterial({ color: 0x7a6548, roughness: 0.9 });
    const head = new THREE.MeshStandardMaterial({ color: 0xd9c7a6, roughness: 1 });
    for (let i = 0; i < 7; i++) {
      const a = rnd(seed + i * 3.3) * PI * 2, tilt = 0.12 + rnd(seed + i) * 0.28, L = 0.55 + rnd(seed * 3 + i) * 0.5;
      const p0 = new V3(0, H, 0), p2 = new V3(Math.cos(a) * tilt * L, H + L, Math.sin(a) * tilt * L), p1 = p0.clone().lerp(p2, 0.5).add(new V3(Math.cos(a) * 0.02, 0.0, Math.sin(a) * 0.02));
      const cv = new THREE.CatmullRomCurve3([p0, p1, p2]);
      put(g, new THREE.TubeGeometry(cv, 8, 0.0035, 5, false), stem, 0, 0, 0, 0, 0, 0, false);
      const h = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.2, 7), head); h.scale.set(1, 1, 1);
      h.position.copy(p2).add(new V3(0, 0.07, 0)); h.rotation.set(Math.sin(a) * tilt, 0, -Math.cos(a) * tilt); h.castShadow = true; g.add(h);
    }
  }
  return g;
}

/* ---------------------------------------------------------------- لوحة بأقواس (Canvas2D) */
export function makeArt(C, w, h, seed = 1, pal = null) {
  const g = new THREE.Group();
  const cv = document.createElement('canvas'); const W = 512, H = Math.round(512 * h / w); cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  const P = pal || ['#e9dcc5', '#c9824f', '#7c8a63', '#3a2f26', '#d9b36c'];
  x.fillStyle = P[0]; x.fillRect(0, 0, W, H);
  for (let i = 0; i < 5; i++) {
    const cw = W * (0.45 - i * 0.07), cx = W * (0.5 + (rnd(seed + i) - 0.5) * 0.12), by = H * (0.9 - i * 0.015);
    x.fillStyle = P[(i + 1) % P.length]; x.globalAlpha = 0.92;
    x.beginPath(); x.moveTo(cx - cw / 2, by); x.lineTo(cx - cw / 2, by - cw * 0.75 - i * 18); x.arc(cx, by - cw * 0.75 - i * 18, cw / 2, PI, 0); x.lineTo(cx + cw / 2, by); x.closePath(); x.fill();
  }
  x.globalAlpha = 1;
  const id = x.getImageData(0, 0, W, H);
  for (let i = 0; i < id.data.length; i += 4) { const n = (Math.random() - 0.5) * 16; id.data[i] += n; id.data[i + 1] += n; id.data[i + 2] += n; }
  x.putImageData(id, 0, 0);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85 });
  const frame = C.mats.metalMat(METALS.brass);
  const bg = softBox(w, h, 0.03, 0.006, { segR: 2, maxFlat: 2 }); projectUV(bg, w, h, null, 0);
  const body = put(g, bg, mat, 0, 0, 0);
  const fr = new THREE.Group();
  put(fr, softBox(w + 0.04, 0.025, 0.045, 0.006, { segR: 2 }), frame, 0, h / 2 + 0.01, 0);
  put(fr, softBox(w + 0.04, 0.025, 0.045, 0.006, { segR: 2 }), frame, 0, -h / 2 - 0.01, 0);
  put(fr, softBox(0.025, h + 0.045, 0.045, 0.006, { segR: 2 }), frame, -w / 2 - 0.01, 0, 0);
  put(fr, softBox(0.025, h + 0.045, 0.045, 0.006, { segR: 2 }), frame, w / 2 + 0.01, 0, 0);
  g.add(fr);
  return g;
}

/* ---------------------------------------------------------------- ستارة (طيّات) */
export function makeCurtain(C, w, h, seed = 1) {
  const M = C.mats, g = new THREE.Group();
  const mat = M.gm({ kind: 'linen', seed, c0: '#cfc2ab', c1: '#fbf5e6', rough: 1, sheen: 0.5, side: THREE.DoubleSide, bump: 1.0 });
  mat.transparent = true; mat.opacity = 0.9;
  const sx = 40, sy = 6, geo = new THREE.PlaneGeometry(w, h, sx, sy);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); const f = Math.sin((x / w) * Math.PI * 2 * 5 + y * 0.18) * 0.085 + Math.sin((x / w) * Math.PI * 2 * 11 + 1.3) * 0.02; p.setZ(i, f * (0.5 + 0.5 * (1 - (y / h + 0.5)))); }
  geo.computeVertexNormals(); geo.translate(0, h / 2, 0); M.uv(geo, mat, null, seed);
  const m = put(g, geo, mat, 0, 0, 0, 0, 0, 0, false); m.castShadow = false; m.receiveShadow = true;
  const rod = C.mats.metalMat(METALS.brass);
  put(g, new THREE.CylinderGeometry(0.014, 0.014, w + 0.2, 10).rotateZ(PI / 2), rod, 0, h + 0.02, -0.04, 0, 0, 0, false);
  C.styleMats.curtain.push(mat);
  return g;
}

/* ---------------------------------------------------------------- مصابيح */
function emissiveShade(C, color = '#ffd9a0') {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color('#f1e4cc'), emissive: new THREE.Color(color), emissiveIntensity: 0, roughness: 0.9, side: THREE.DoubleSide, transparent: false });
  return m;
}
function regLamp(C, light, mats, lightMax, emMax) { C.lamps.push({ light, mats, lightMax, emMax }); }
export function makeTableLamp(C, color = '#e6dccb', seed = 1, h = 0.4) {
  const M = C.mats, g = new THREE.Group();
  const base = M.gm({ c1: color, rough: 0.3, cc: 0.4, ccRough: 0.12 });
  put(g, lathe(smoothProfile([[0.001, 0], [0.09, 0], [0.12, 0.05], [0.13, 0.15], [0.09, 0.26], [0.03, 0.33], [0.025, h]], 36).concat([[0, h]]), 36), base);
  const shade = emissiveShade(C);
  const sg = new THREE.CylinderGeometry(0.15, 0.2, 0.26, 40, 1, true);
  put(g, sg, shade, 0, h + 0.08, 0, 0, 0, 0, false);
  const light = new THREE.PointLight(0xffc27a, 0, 6.5, 2); light.position.set(0, h + 0.05, 0.05); g.add(light);
  regLamp(C, light, [shade], 3.2, 0.85);
  return g;
}
export function makeArcLamp(C) {
  const M = C.mats, g = new THREE.Group();
  const metal = M.metalMat(METALS.brass), stone = M.stoneMat({ c0: '#e3dac4', c1: '#16130f' }, 3);
  put(g, roundedCylinder(0.24, 0.05, 0.012, 48), stone, 0, 0.025, 0);
  const cv = new THREE.CatmullRomCurve3([new V3(0, 0.04, 0), new V3(0, 1.2, 0), new V3(-0.15, 2.0, 0.02), new V3(-0.8, 2.35, 0.1), new V3(-1.5, 2.2, 0.15), new V3(-1.8, 1.95, 0.18)]);
  put(g, new THREE.TubeGeometry(cv, 60, 0.012, 8, false), metal);
  const shade = emissiveShade(C);
  put(g, lathe([[0.0, 0.21], [0.07, 0.205], [0.17, 0.15], [0.23, 0.04], [0.235, 0.0], [0.22, 0.0], [0.16, 0.12], [0.07, 0.185], [0, 0.19]], 40), shade, -1.8, 1.75, 0.18, 0, 0, 0, false);
  const inner = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffe2b0').multiplyScalar(1.6), transparent: true, opacity: 0 });
  put(g, new THREE.CircleGeometry(0.2, 32).rotateX(PI / 2), inner, -1.8, 1.77, 0.18, 0, 0, 0, false);
  const light = new THREE.PointLight(0xffc27a, 0, 8, 2); light.position.set(-1.8, 1.65, 0.2); g.add(light);
  regLamp(C, light, [shade], 6, 0.8);
  C.lamps[C.lamps.length - 1].fade = inner;
  return g;
}
export function makePendants(C, n = 3, spacing = 0.9, y = 2.15) {
  const M = C.mats, g = new THREE.Group();
  const metal = M.metalMat(METALS.brass);
  const shade = emissiveShade(C);
  const light = new THREE.PointLight(0xffc27a, 0, 8, 2); light.position.set(0, y - 0.35, 0); g.add(light);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * spacing, yy = y + (i === 1 ? 0.14 : 0);
    put(g, lathe(smoothProfile([[0.0, 0.0], [0.04, 0.0], [0.17, -0.05], [0.25, -0.15], [0.285, -0.27], [0.272, -0.27], [0.24, -0.2], [0.16, -0.12], [0.04, -0.06], [0, -0.06]], 48), 48), shade, x, yy, 0, 0, 0, 0, false);
    put(g, new THREE.CylinderGeometry(0.004, 0.004, 5.5, 5), metal, x, yy + 2.75, 0, 0, 0, 0, false);
    put(g, new THREE.CylinderGeometry(0.03, 0.03, 0.05, 14), metal, x, yy + 0.02, 0, 0, 0, 0, false);
  }
  regLamp(C, light, [shade], 6.5, 0.8);
  return g;
}

/* ---------------------------------------------------------------- لوحة خشبية مخدّدة مقوّسة */
export function makeFluted(C, w, hs, seed = 3, wood = 'walnut') {
  const M = C.mats, g = new THREE.Group();
  const mat = M.woodMat(byId(WOODS, wood), seed);
  const n = Math.round(w / 0.07), rw = w / n, geos = [];
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + rw * (i + 0.5), u = x / (w / 2);
    const h = hs + (w / 2) * Math.sqrt(Math.max(0, 1 - u * u * 0.9985));
    const cg = new THREE.CylinderGeometry(rw * 0.5, rw * 0.5, h, 10, 1, false, -PI / 2, PI); // نصف أسطوانة بارزة
    cg.rotateY(0); cg.translate(x, h / 2, 0); geos.push(cg);
  }
  const merged = mergeGeos(geos); M.uv(merged, mat, 'y', seed);
  put(g, merged, mat, 0, 0, 0);
  C.fluted.push(mat);
  return g;
}

/* ---------------------------------------------------------------- بوفيه */
export function makeSideboard(C, len = 2.2, seed = 4) {
  const M = C.mats, g = new THREE.Group();
  const wood = M.woodMat(byId(WOODS, C.style.defaults.table.wood), seed);
  const metal = M.metalMat(METALS[C.style.metal]);
  put(g, softBox(len, 0.78, 0.46, 0.022, { segR: 3 }), wood, 0, 0.4 + 0.13, 0);
  g.children[0].geometry = M.uv(g.children[0].geometry, wood, 'x', seed);
  const n = Math.round((len - 0.1) / 0.052), rw = (len - 0.1) / n, geos = [];
  for (let i = 0; i < n; i++) { const cg = new THREE.CylinderGeometry(rw * 0.5, rw * 0.5, 0.64, 8, 1, false, -PI / 2, PI); cg.translate(-(len - 0.1) / 2 + rw * (i + 0.5), 0.0, 0); geos.push(cg); }
  const flutes = mergeGeos(geos); M.uv(flutes, wood, 'y', seed + 1);
  put(g, flutes, wood, 0, 0.55, 0.24);
  for (const sx of [-1, 1]) put(g, new THREE.CylinderGeometry(0.014, 0.01, 0.15, 8), metal, sx * (len / 2 - 0.12), 0.075, 0.12);
  for (const sx of [-1, 1]) put(g, new THREE.CylinderGeometry(0.014, 0.01, 0.15, 8), metal, sx * (len / 2 - 0.12), 0.075, -0.12);
  const h = softBox(0.01, 0.2, 0.016, 0.004, { segR: 1 });
  put(g, h, metal, 0, 0.7, 0.262);
  C.fluted.push(wood);
  return g;
}

/* ---------------------------------------------------------------- كتب */
export function makeBooks(C, seed = 1) {
  const M = C.mats, g = new THREE.Group();
  let y = 0;
  const cols = ['#d9c9ac', '#8c4a2f', '#33473a', '#caa764'];
  for (let i = 0; i < 4; i++) {
    const w = 0.28 - i * 0.02, d = 0.2 - i * 0.01, h = 0.035 + rnd(seed + i) * 0.02;
    const mat = M.gm({ kind: 'linen', seed: seed + i, c0: '#555', c1: cols[i], rough: 0.8 });
    const b = softBox(w, h, d, 0.004, { segR: 2, maxFlat: 2 }); M.uv(b, mat, null, seed + i);
    put(g, b, mat, (rnd(seed * 3 + i) - 0.5) * 0.02, y + h / 2, 0, 0, (rnd(seed + i * 9) - 0.5) * 0.3, 0);
    y += h;
  }
  return g;
}

/* ---------------------------------------------------------------- الشعار ثلاثي الأبعاد: m من قوسين */
export function logoShape(t = 0.34, w = 0.62) {
  const R = t + w / 2, Ys = 0.55, c1 = R, c2 = t + w + R;
  const d = c2 - c1, dx = d / 2, th = Math.acos(dx / R), total = 3 * t + 2 * w;
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.lineTo(0, Ys); s.absarc(c1, Ys, R, PI, th, true); s.absarc(c2, Ys, R, PI - th, 0, true); s.lineTo(total, 0); s.lineTo(0, 0);
  const hole = (x0) => { const p = new THREE.Path(); p.moveTo(x0, 0); p.lineTo(x0, Ys); p.absarc(x0 + w / 2, Ys, w / 2, PI, 0, true); p.lineTo(x0 + w, 0); p.lineTo(x0, 0); return p; };
  s.holes.push(hole(t)); s.holes.push(hole(2 * t + w));
  return { shape: s, width: total, height: Ys + R };
}
export function makeLogo3D(C, scale = 1) {
  const M = C.mats, g = new THREE.Group();
  const { shape, width, height } = logoShape();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 5, curveSegments: 40 });
  geo.translate(-width / 2, 0, -0.11);
  const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#dcae55'), metalness: 1, roughness: 0.17, clearcoat: 0.3, clearcoatRoughness: 0.08, envMap: M.envTex, envMapIntensity: 1.2 }); mat.userData.envK = 0.9; M.own.add(mat);
  const m = put(g, geo, mat, 0, 0, 0);
  g.scale.setScalar(scale); g.userData = { width: width * scale, height: height * scale, mat };
  return g;
}
