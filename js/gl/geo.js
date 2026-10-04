/*
  أدوات الهندسة: صندوق ناعم بحواف مدوّرة مع انتفاخ المخدّات، مسح مقطع حول قوس (للأرائك المنحنية)،
  أقواس، إسقاط UV من فضاء الجسم (حبيبات الخشب تمشي مع محور الألياف).
*/
import * as THREE from 'three';

const PI = Math.PI;

/* قائمة إحداثيات على محور واحد: نطاق دائري كثيف عند الحواف + منطقة مسطّحة مقسّمة */
function axisList(h, r, segR, nFlat) {
  const inner = Math.max(0, h - r);
  const out = [];
  for (let j = segR; j >= 0; j--) out.push(-(inner + r * Math.tan((j / segR) * PI / 4)));
  for (let k = 1; k < nFlat; k++) out.push(-inner + (2 * inner * k) / nFlat);
  for (let j = 0; j <= segR; j++) out.push(inner + r * Math.tan((j / segR) * PI / 4));
  // إزالة المكرّر (عندما inner = 0)
  return out.filter((v, i) => i === 0 || Math.abs(v - out[i - 1]) > 1e-7);
}

/*
  صندوق مدوّر الحواف، مركزه الأصل. puff: انتفاخ الوجوه (رقم أو {x,y,z}) لأشكال المخدّات.
  flat: عدد تقسيمات المنطقة المسطّحة لكل محور (يُحسب تلقائياً بحسب الحجم إن لم يُحدد).
*/
export function softBox(w, h, d, r = 0.03, o = {}) {
  const segR = o.segR || 4;
  const hx = w / 2, hy = h / 2, hz = d / 2;
  r = Math.min(r, hx, hy, hz);
  const pf = typeof o.puff === 'number' ? { x: o.puff, y: o.puff, z: o.puff } : Object.assign({ x: 0, y: 0, z: 0 }, o.puff || {});
  const maxPuff = Math.max(pf.x, pf.y, pf.z);
  const dens = o.density || (maxPuff > 0 ? 0.045 : 0.2);
  const fl = (hh) => Math.max(1, Math.min(o.maxFlat || 26, Math.round(((hh - r) * 2) / dens)));
  const AX = [axisList(hx, r, segR, fl(hx)), axisList(hy, r, segR, fl(hy)), axisList(hz, r, segR, fl(hz))];
  const half = [hx, hy, hz], inn = [hx - r, hy - r, hz - r];
  const pw = o.puffPow || 0.65;
  const pos = [], nor = [], idx = [];
  const faces = [[0, 1, 1, 2], [0, -1, 1, 2], [1, 1, 2, 0], [1, -1, 2, 0], [2, 1, 0, 1], [2, -1, 0, 1]]; // [محور الناظم، إشارة، محور u، محور v]
  const p0 = [0, 0, 0], p = [0, 0, 0], nn = [0, 0, 0];
  for (const [n, sg, ua, va] of faces) {
    const U = AX[ua], V = AX[va], base = pos.length / 3;
    for (let j = 0; j < V.length; j++) for (let i = 0; i < U.length; i++) {
      p0[n] = sg * half[n]; p0[ua] = U[i]; p0[va] = V[j];
      let len2 = 0;
      for (let k = 0; k < 3; k++) { const c = Math.max(-inn[k], Math.min(inn[k], p0[k])); nn[k] = p0[k] - c; p[k] = c; len2 += nn[k] * nn[k]; }
      const len = Math.sqrt(len2) || 1;
      for (let k = 0; k < 3; k++) { nn[k] /= len; p[k] += nn[k] * r; }
      const amp = pf[['x', 'y', 'z'][n]];
      if (amp > 0) {
        const a = p0[ua] / half[ua], b = p0[va] / half[va];
        const fa = Math.max(0, 1 - a * a), fb = Math.max(0, 1 - b * b);
        const bump = amp * Math.pow(fa, pw) * Math.pow(fb, pw);
        const dA = fa > 1e-4 ? amp * pw * Math.pow(fa, pw - 1) * (-2 * a / half[ua]) * Math.pow(fb, pw) : 0;
        const dB = fb > 1e-4 ? amp * pw * Math.pow(fb, pw - 1) * (-2 * b / half[va]) * Math.pow(fa, pw) : 0;
        for (let k = 0; k < 3; k++) p[k] += nn[k] * bump;
        nn[ua] -= dA; nn[va] -= dB;
        const l2 = Math.hypot(nn[0], nn[1], nn[2]) || 1; nn[0] /= l2; nn[1] /= l2; nn[2] /= l2;
      }
      pos.push(p[0], p[1], p[2]); nor.push(nn[0], nn[1], nn[2]);
    }
    const W = U.length;
    // اتجاه اللف: نختبر أول مثلث مقابل الناظم
    let flip = 1;
    {
      const a = base, b = base + 1, e = base + W + 1;
      const ax = pos[b * 3] - pos[a * 3], ay = pos[b * 3 + 1] - pos[a * 3 + 1], az = pos[b * 3 + 2] - pos[a * 3 + 2];
      const bx = pos[e * 3] - pos[a * 3], by = pos[e * 3 + 1] - pos[a * 3 + 1], bz = pos[e * 3 + 2] - pos[a * 3 + 2];
      const cxp = ay * bz - az * by, cyp = az * bx - ax * bz, czp = ax * by - ay * bx;
      const d = cxp * nor[a * 3] + cyp * nor[a * 3 + 1] + czp * nor[a * 3 + 2];
      flip = d >= 0 ? 1 : -1;
    }
    for (let j = 0; j < V.length - 1; j++) for (let i = 0; i < W - 1; i++) {
      const a = base + j * W + i, b = a + 1, c = a + W, e = c + 1;
      if (flip > 0) idx.push(a, b, e, a, e, c); else idx.push(a, e, b, a, c, e);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}

/* مقاطع جاهزة (مغلقة، عكس عقارب الساعة) بإحداثيات (ρ, y) */
export function rrectProfile(w, h, r, n = 5, cx = 0, cy = 0) {
  r = Math.min(r, w / 2, h / 2);
  const pts = [];
  const corner = (ox, oy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * (PI / 2); pts.push([ox + r * Math.cos(a), oy + r * Math.sin(a)]); } };
  corner(cx + w / 2 - r, cy + h / 2 - r, 0);
  corner(cx - w / 2 + r, cy + h / 2 - r, PI / 2);
  corner(cx - w / 2 + r, cy - h / 2 + r, PI);
  corner(cx + w / 2 - r, cy - h / 2 + r, PI * 1.5);
  return pts;
}

/*
  مسح مقطع حول قوس دائرة (محور الدوران عمودي). الأرائك تواجه +z والتقعّر نحو المشاهد.
  profile: [[ρ, y]...] مغلق. ρ موجب = بعيداً عن مركز الدائرة (جهة الظهر).
  opts: R نصف القطر المركزي، a0/a1 زوايا (راديان، 0 = منتصف)، segs، endRound، endPow، fn(i, φ) → {s, sy, sr, dy}
*/
export function sweepArc(profile, o) {
  const R = o.R, a0 = o.a0, a1 = o.a1, segs = o.segs || 40;
  const er = o.endRound === undefined ? 0.12 : o.endRound, pw = o.endPow || 2.4;
  let cx = 0, cy = 0; for (const [a, b] of profile) { cx += a; cy += b; } cx /= profile.length; cy /= profile.length;
  const np = profile.length, rings = segs + 1;
  const pos = new Float32Array(np * rings * 3), idx = [];
  for (let i = 0; i < rings; i++) {
    const t = i / segs, phi = a0 + (a1 - a0) * t;
    const dist = Math.min(phi - a0, a1 - phi);
    let s = 1;
    if (er > 0 && dist < er) { const u = Math.max(0, dist / er); s = Math.pow(1 - Math.pow(1 - u, pw), 1 / pw); }
    const f = o.fn ? o.fn(i, phi, t) || {} : {};
    const sy = (f.sy === undefined ? 1 : f.sy) * s, sr = (f.sr === undefined ? 1 : f.sr) * s, dy = f.dy || 0, dr = f.dr || 0;
    const sn = Math.sin(phi), cs = Math.cos(phi);
    for (let j = 0; j < np; j++) {
      const rho = cx + (profile[j][0] - cx) * sr + dr, y = cy + (profile[j][1] - cy) * sy + dy;
      const rt = R + rho;
      const o3 = (i * np + j) * 3;
      pos[o3] = rt * sn; pos[o3 + 1] = y; pos[o3 + 2] = R - rt * cs;
    }
  }
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < np; j++) {
    const a = i * np + j, b = i * np + ((j + 1) % np), c = (i + 1) * np + j, e = (i + 1) * np + ((j + 1) % np);
    idx.push(a, b, c, b, e, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/* قطع ناقص/أسطوانة مدوّرة الحافة بدوران مقطع (محور y) */
export function roundedCylinder(radius, height, r = 0.02, seg = 48, o = {}) {
  r = Math.min(r, radius, height / 2);
  const pts = [];
  const n = o.n || 5;
  pts.push(new THREE.Vector2(0, -height / 2));
  for (let i = 0; i <= n; i++) { const a = -PI / 2 + (i / n) * (PI / 2); pts.push(new THREE.Vector2(radius - r + r * Math.cos(a), -height / 2 + r + r * Math.sin(a))); }
  for (let i = 0; i <= n; i++) { const a = (i / n) * (PI / 2); pts.push(new THREE.Vector2(radius - r + r * Math.cos(a), height / 2 - r + r * Math.sin(a))); }
  pts.push(new THREE.Vector2(0, height / 2));
  const g = new THREE.LatheGeometry(pts, seg);
  return g;
}

/* شكل قوس: عرض w، ارتفاع نهاية الجزء المستقيم hs ثم نصف دائرة. القاعدة عند y0 */
export function archShape(w, hs, close = true, y0 = 0) {
  const r = w / 2, s = new THREE.Shape();
  s.moveTo(-r, y0); s.lineTo(-r, hs); s.absarc(0, hs, r, PI, 0, true); s.lineTo(r, y0);
  if (close) s.lineTo(-r, y0);
  return s;
}
export function archPath(w, hs, y0 = 0) {
  const r = w / 2, s = new THREE.Path();
  s.moveTo(-r, y0); s.lineTo(-r, hs); s.absarc(0, hs, r, PI, 0, true); s.lineTo(r, y0); s.lineTo(-r, y0);
  return s;
}
export function roundedRectShape(w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
/* قرص مسطّح بحواف دائرية ناعمة من أي شكل: Extrude مع bevel ثم مركزة على المحور z */
export function extrude(shape, depth, bevel = 0.01, curve = 3) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.0001, depth - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: curve, curveSegments: 28 });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  return g;
}

/*
  إسقاط UV من فضاء الجسم. grain: 'x' | 'y' | 'z' = محور الألياف: u يمشي معه على الوجوه الجانبية.
  sx/sy: عدد الأمتار التي تغطيها الخامة عند u/v.
*/
export function projectUV(geo, sx, sy = sx, grain = null, seed = 0) {
  const p = geo.attributes.position;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const nrm = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  const ox = (Math.sin(seed * 12.9898) * 43758.5453) % 1, oy = (Math.sin(seed * 78.233) * 12345.6789) % 1;
  const gi = grain ? { x: 0, y: 1, z: 2 }[grain] : -1;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const ax = Math.abs(nrm.getX(i)), ay = Math.abs(nrm.getY(i)), az = Math.abs(nrm.getZ(i));
    const dom = ax >= ay && ax >= az ? 0 : (ay >= az ? 1 : 2);
    const c = [x, y, z];
    let a, b;
    if (gi >= 0 && dom !== gi) { a = gi; b = [0, 1, 2].find((k) => k !== gi && k !== dom); }
    else { const t = [0, 1, 2].filter((k) => k !== dom); a = t[0]; b = t[1]; }
    uv[i * 2] = c[a] / sx + ox; uv[i * 2 + 1] = c[b] / sy + oy;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

/* دمج هندسات بإزاحات (دون مكتبة خارجية) */
export function mergeGeos(list) {
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  let vo = 0, io = 0;
  for (const g of list) {
    const c = g.attributes.position.count;
    pos.set(g.attributes.position.array, vo * 3);
    if (g.attributes.normal) nor.set(g.attributes.normal.array, vo * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, vo * 2);
    if (g.index) for (let i = 0; i < g.index.count; i++) idx[io + i] = g.index.array[i] + vo; else for (let i = 0; i < c; i++) idx[io + i] = vo + i;
    vo += c; io += g.index ? g.index.count : c;
  }
  const m = new THREE.BufferGeometry();
  m.setAttribute('position', new THREE.BufferAttribute(pos, 3)); m.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); m.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  m.setIndex(new THREE.BufferAttribute(idx, 1));
  return m;
}

/* منحنى ناعم يمرّ بنقاط المقطع (لمزهريات ومصابيح) */
export function smoothProfile(pts, n = 40) {
  const c = new THREE.SplineCurve(pts.map(([r, y]) => new THREE.Vector2(r, y)));
  return c.getPoints(n).map((p) => [Math.max(0, p.x), p.y]);
}
