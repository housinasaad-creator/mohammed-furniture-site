/*
  مكتبة المواد: خامات إجرائية (GPU) × خريطة تدرّج لونية، وموجة "إعادة الطلاء":
  عند تغيير اللون/القماش يمتد من نقطة معيّنة حلقة ضوء تُعيد كسوة القطعة (أو البيت كله) أثناء مرورها.
*/
import * as THREE from 'three';
import { TexGen } from './texgen.js';
import { projectUV } from './geo.js';

/* مواصفات الخامات: حجم النسيج بالبكسل، المساحة التي تغطيها بالأمتار (u,v)، البروز */
const SPEC = {
  wood: { size: [2048, 1024], uv: [0.9, 0.45], bump: 0.9 },
  plaster: { size: [1024, 1024], uv: [2.4, 2.4], bump: 0.8 },
  travertine: { size: [2048, 2048], uv: [2.4, 2.4], bump: 0.7 },
  boucle: { size: [1024, 1024], uv: [0.24, 0.24], bump: 2.2 },
  velvet: { size: [1024, 1024], uv: [0.3, 0.3], bump: 0.5 },
  linen: { size: [1024, 1024], uv: [0.22, 0.22], bump: 1.6 },
  leather: { size: [1024, 1024], uv: [0.3, 0.3], bump: 1.2 },
  wool: { size: [1024, 1024], uv: [0.4, 0.4], bump: 1.4 },
  marble: { size: [1024, 1024], uv: [1.5, 1.5], bump: 0 }
};

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Mats {
  constructor(renderer, mobile) {
    this.r = renderer; this.mobile = !!mobile;
    this.tg = new TexGen(renderer, mobile ? 0.5 : 1);
    this.all = new Set(); this.active = []; this.glow = new THREE.Color('#ffd9a0'); this.envTex = null; this.own = new Set(); this.envLevel = 0.4;
  }

  tex(kind, opts = {}) { const s = SPEC[kind]; return this.tg.make(kind, s.size, Object.assign({ bump: s.bump > 0 }, opts)); }

  /*
    مادة تدرّجية. o: {kind, seed, fig, c0, c1, rough, metal, sheen, sheenC, cc, ccRough, bump, env, side}
    بدون kind = لون ثابت (معدن/طلاء) يستخدم c1.
  */
  gm(o = {}) {
    const spec = o.kind ? SPEC[o.kind] : null;
    const t = o.kind ? this.tex(o.kind, { seed: o.seed || 0, fig: o.fig || 0 }) : null;
    const m = new THREE.MeshPhysicalMaterial({
      color: 0xffffff, map: t ? t.map : null, bumpMap: t && t.bump ? t.bump : null, bumpScale: o.bump !== undefined ? o.bump : (spec ? spec.bump : 0),
      roughness: o.rough !== undefined ? o.rough : 0.6, metalness: o.metal || 0,
      sheen: o.sheen || 0, sheenRoughness: o.sheenRough !== undefined ? o.sheenRough : 0.5, sheenColor: new THREE.Color(o.sheenC || '#ffffff'),
      clearcoat: o.cc || 0, clearcoatRoughness: o.ccRough !== undefined ? o.ccRough : 0.12,
      envMapIntensity: o.env !== undefined ? o.env : 1, side: o.side || THREE.FrontSide
    });
    const U = {
      uC0: { value: new THREE.Color(o.c0 || o.c1 || '#ffffff') }, uC1: { value: new THREE.Color(o.c1 || '#ffffff') },
      uD0: { value: new THREE.Color(o.c0 || o.c1 || '#ffffff') }, uD1: { value: new THREE.Color(o.c1 || '#ffffff') },
      uWaveC: { value: new THREE.Vector3() }, uWaveR: { value: -1 }, uWaveW: { value: 1.4 }, uGlow: { value: this.glow }, uMapB: { value: t ? t.map : null }
    };
    if (o.ownEnv && this.envTex) { m.envMap = this.envTex; m.userData.envK = o.ownEnv; m.envMapIntensity = o.ownEnv; this.own.add(m); }
    m.userData.U = U; m.userData.spec = spec; m.userData.kind = o.kind || null;
    m.userData.uvSize = o.uv || (spec ? spec.uv : [1, 1]);
    m.userData.params = { rough: m.roughness, sheen: m.sheen, cc: m.clearcoat, bump: m.bumpScale };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nvarying vec3 vWPos;')
        .replace('#include <project_vertex>', '#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed,1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          varying vec3 vWPos; uniform vec3 uC0, uC1, uD0, uD1, uWaveC, uGlow; uniform float uWaveR, uWaveW; uniform sampler2D uMapB;`)
        .replace('#include <map_fragment>', `
          float gA = 1.0, gB = 1.0;
          #ifdef USE_MAP
            gA = texture2D( map, vMapUv ).r; gB = texture2D( uMapB, vMapUv ).r;
          #endif
          float wd = distance(vWPos, uWaveC);
          float wm = 1.0 - smoothstep(uWaveR - uWaveW, uWaveR, wd);
          float rimW = smoothstep(uWaveR - uWaveW, uWaveR - uWaveW*0.5, wd) * (1.0 - smoothstep(uWaveR - uWaveW*0.5, uWaveR, wd));
          diffuseColor.rgb *= mix(mix(uC0, uC1, gA), mix(uD0, uD1, gB), wm);
          totalEmissiveRadiance += uGlow * rimW * 0.55 * step(0.0, uWaveR);`);
    };
    m.customProgramCacheKey = () => 'gm1';
    this.all.add(m);
    return m;
  }

  /* يطبّق إسقاط UV على هندسة بحسب مقاس خامة المادة */
  uv(geo, mat, grain = null, seed = 0) { const s = mat.userData.uvSize; return projectUV(geo, s[0], s[1], grain, seed); }

  /* ألوان جاهزة */
  woodMat(w, seed = 1) { return this.gm({ kind: 'wood', seed, fig: w.fig, c0: w.c0, c1: w.c1, rough: w.rough, cc: 0.12, ccRough: 0.35, bump: 0.22 }); }
  metalMat(m) { return this.gm({ c1: m.c, rough: m.rough, metal: 1, ownEnv: m.envK || 0.9 }); }
  updateEnv(level) { this.envLevel = level; for (const m of this.own) m.envMapIntensity = m.userData.envK * (0.5 + level * 1.1); }
  fabricMat(f, seed = 1) {
    return this.gm({ kind: f.kind, seed, c0: f.c0, c1: f.c1, rough: f.rough, sheen: f.sheen, sheenC: f.sheenC || '#ffffff', sheenRough: 0.45, cc: f.cc || 0, ccRough: 0.35, bump: f.bump });
  }
  stoneMat(s, seed = 1) { return this.gm({ kind: 'marble', seed, c0: s.c0, c1: s.c1, rough: 0.14, cc: 0.35, ccRough: 0.08, bump: 0 }); }

  /*
    يعيد كسوة مادة من القيم الحالية إلى `to` بحلقة تمتد من center.
    to: {c0, c1, kind(seed) ← يغيّر الخامة, rough, sheen, cc, bump}
  */
  morph(mat, to, center, o = {}) {
    const U = mat.userData.U;
    this.finish(mat);
    U.uD0.value.set(to.c0 || to.c1); U.uD1.value.set(to.c1 || to.c0);
    let nt = null;
    if (to.kind && to.kind !== mat.userData.kind) { nt = this.tex(to.kind, { seed: to.seed || 0 }); U.uMapB.value = nt.map; }
    else if (to.seed !== undefined && mat.userData.kind) { nt = this.tex(mat.userData.kind, { seed: to.seed }); U.uMapB.value = nt.map; }
    U.uWaveC.value.copy(center); U.uWaveR.value = 0; U.uWaveW.value = o.w || 1.4;
    const p = mat.userData.params;
    const item = { mat, t: 0, dur: o.dur || 1.1, rmax: o.radius || 6, nt, to, from: { rough: mat.roughness, sheen: mat.sheen, cc: mat.clearcoat, bump: mat.bumpScale }, delay: o.delay || 0 };
    if (to.glow) item.glow = true;
    this.active.push(item);
    return item;
  }
  finish(mat) {
    const i = this.active.findIndex((a) => a.mat === mat);
    if (i < 0) return;
    this._end(this.active[i]); this.active.splice(i, 1);
  }
  _end(it) {
    const m = it.mat, U = m.userData.U, to = it.to;
    U.uC0.value.copy(U.uD0.value); U.uC1.value.copy(U.uD1.value); U.uWaveR.value = -1;
    if (it.nt) { m.map = it.nt.map; if (it.nt.bump) m.bumpMap = it.nt.bump; m.userData.kind = to.kind || m.userData.kind; const sp = SPEC[m.userData.kind]; if (sp) m.userData.uvSize = sp.uv; }
    if (to.rough !== undefined) m.roughness = to.rough;
    if (to.sheen !== undefined) m.sheen = to.sheen;
    if (to.sheenC) m.sheenColor.set(to.sheenC);
    if (to.cc !== undefined) m.clearcoat = to.cc;
    if (to.bump !== undefined) m.bumpScale = to.bump;
    m.userData.params = { rough: m.roughness, sheen: m.sheen, cc: m.clearcoat, bump: m.bumpScale };
  }
  /* تغيير فوري بلا موجة */
  set(mat, to) {
    this.finish(mat);
    const U = mat.userData.U;
    U.uD0.value.set(to.c0 || to.c1); U.uD1.value.set(to.c1 || to.c0);
    this._end({ mat, to, nt: to.kind && to.kind !== mat.userData.kind ? this.tex(to.kind, { seed: to.seed || 0 }) : null });
  }

  update(dt) {
    if (!this.active.length) return;
    for (let i = this.active.length - 1; i >= 0; i--) {
      const it = this.active[i];
      if (it.delay > 0) { it.delay -= dt; continue; }
      it.t += dt / it.dur;
      const e = ease(Math.min(1, it.t)), U = it.mat.userData.U;
      U.uWaveR.value = e * (it.rmax + U.uWaveW.value);
      const m = it.mat, to = it.to;
      if (to.rough !== undefined) m.roughness = it.from.rough + (to.rough - it.from.rough) * e;
      if (to.sheen !== undefined) m.sheen = it.from.sheen + (to.sheen - it.from.sheen) * e;
      if (to.cc !== undefined) m.clearcoat = it.from.cc + (to.cc - it.from.cc) * e;
      if (it.t >= 1) { this._end(it); this.active.splice(i, 1); }
    }
  }
  setGlow(c) { this.glow.set(c); }
}
