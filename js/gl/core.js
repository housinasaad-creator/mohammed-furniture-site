/*
  نواة العالم: renderer + ظلال الشمس/القمر + دورة اليوم (ToD) + بيئة انعكاسات + انعكاس الأرضية + معالجة لاحقة.
  الشمس تعبر خلف النوافذ المقوّسة؛ ظلال الأقواس تزحف على الأرض. المصابيح تشتعل عند الغروب.
*/
import * as THREE from 'three';
import { Mats } from './materials.js';
import { Post } from './post.js';

const PI = Math.PI, D2R = PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const C = (h) => new THREE.Color(h);

/* مفاتيح اليوم: ساعة، سماء علوية، أفق، لون الشمس، شدة، بيئة، سماء/أرض الهيمسفير، تعرّض، تألق */
const KEYS = [
  [0,    '#060a18', '#0d1630', '#8fa8ff', 0.0, 0.10, '#1b2a55', '#15100c', 0.22, 1.15, 0.7],
  [4.6,  '#0a1230', '#16203f', '#8fa8ff', 0.0, 0.10, '#1b2a55', '#15100c', 0.22, 1.15, 0.7],
  [5.5,  '#2c3d72', '#e8906a', '#ff9a6a', 2.5, 0.13, '#4a5a8a', '#2a1c14', 0.2, 1.35, 0.75],
  [6.4,  '#5a78b8', '#ffc08a', '#ffc08a', 7.0, 0.17, '#7a96c8', '#3a2a1c', 0.2, 1.15, 0.6],
  [8.0,  '#6f9fdc', '#f7e0bc', '#ffe2bc', 10.5, 0.22, '#9ab8e0', '#4a3a2a', 0.22, 1.0, 0.45],
  [11.0, '#4f93e2', '#bfe3f8', '#fff3e2', 13.0, 0.28, '#a8c8ee', '#52422f', 0.3, 0.95, 0.38],
  [14.0, '#4a8fe0', '#bfe0f4', '#fff6e8', 13.5, 0.3, '#a8c8ee', '#52422f', 0.24, 0.93, 0.38],
  [16.5, '#5b8dd6', '#f5dcb0', '#ffe0b0', 11.5, 0.24, '#a0bce0', '#4e3c28', 0.22, 0.98, 0.45],
  [18.0, '#4a62a0', '#ff9a55', '#ff9650', 7.5, 0.17, '#7a8ac0', '#3a2a1c', 0.2, 1.1, 0.6],
  [19.0, '#26305e', '#e0645a', '#ff7048', 2.8, 0.12, '#3a4a80', '#241812', 0.2, 1.3, 0.7],
  [20.2, '#0e1636', '#3a3358', '#8fa8ff', 0.0, 0.1, '#1b2a55', '#15100c', 0.22, 1.5, 0.78],
  [24,   '#060a18', '#0d1630', '#8fa8ff', 0.0, 0.10, '#1b2a55', '#15100c', 0.22, 1.15, 0.7]
].map((k) => ({ h: k[0], top: C(k[1]), hor: C(k[2]), sun: C(k[3]), si: k[4], env: k[5], hs: C(k[6]), hg: C(k[7]), hi: k[8], ex: k[9], bl: k[10] }));

export function sunVec(hour) {
  const u = (hour - 6) / 12.5;
  let el, az;
  if (u >= 0 && u <= 1) { el = Math.sin(PI * u) * 58 * D2R; az = (-70 + 140 * u) * D2R; }
  else { const n = ((hour - 18.5 + 24) % 24) / 11.5; el = -Math.sin(PI * clamp(n, 0, 1)) * 40 * D2R; az = (70 - 140 * clamp(n, 0, 1)) * D2R; }
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
}
export function moonVec(hour) {
  const n = ((hour - 18.5 + 24) % 24) / 11.5;
  const nn = clamp(n, 0, 1);
  const el = (8 + Math.sin(PI * nn) * 44) * D2R, az = (62 - 124 * nn) * D2R;
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
}

export class World {
  constructor(canvas, o = {}) {
    this.canvas = canvas; this.mobile = !!o.mobile;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!o.preserve });
    const r = this.renderer;
    r.outputColorSpace = THREE.LinearSRGBColorSpace; r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap; r.shadowMap.autoUpdate = false;
    this.quality = { dpr: Math.min(window.devicePixelRatio || 1, this.mobile ? 1.25 : 1.5), shadow: this.mobile ? 1024 : 2048, refl: this.mobile ? 0 : 0.35, level: 0 };
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.1, 400);
    this.scene.add(this.camera);
    this.mats = new Mats(r, this.mobile);
    this.post = new Post(r, this.mobile);
    this.time = 0; this.hooks = []; this.running = false; this.clock = new THREE.Clock();
    this.hour = 7; this.tod = {}; this.envScale = 2.3; this.hemiScale = 1.8; this.lampOverride = null;
    this.lamps = []; this.focus = new THREE.Vector3(0, 0, 0);
    this.reflHide = []; this.fade = 0; this.fadeTarget = 1; this.extraTint = [1, 1, 1];
    this.skyUniforms = null; this.reflOn = false;
    this.buildEnv(); this.buildLights(); this.buildReflection();
    this.resize();
    this.setHour(this.hour, true);
    window.addEventListener('resize', () => this.resize());
  }

  /* ---------------------------------------------------------------- بيئة */
  buildEnv() {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color('#3a2f26').multiplyScalar(0.8), side: THREE.BackSide })));
    const panel = (w, h, pos, color, k) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(pos[0], pos[1], pos[2]); m.lookAt(0, 1.2, 0); s.add(m);
    };
    panel(40, 30, [0, 24, 0], 0xfff4e4, 1.35);        // سقف مضيء
    panel(16, 20, [-9, 8, -24], 0xfff0dc, 5.2);       // نافذة خلفية يسار
    panel(16, 20, [9, 8, -24], 0xfff0dc, 5.2);        // نافذة خلفية يمين
    panel(60, 12, [0, 0.5, -30], 0xe8d2b4, 0.9);      // جدار خلفي
    panel(30, 20, [-26, 6, 6], 0xf2dcc0, 1.0);        // جدار جانبي يسار
    panel(30, 20, [26, 6, 6], 0xf2dcc0, 1.0);         // جدار جانبي يمين
    panel(50, 20, [0, 8, 28], 0xf6e6d0, 0.85);        // أمام (خلف الكاميرا)
    panel(60, 40, [0, -1.2, 0], 0xcdb596, 0.55);      // أرضية عاكسة
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = this.pmrem.fromScene(s, 0.02);
    this.scene.environment = this.envRT.texture;
    // بيئة ستوديو عالية التباين للمعادن (نحاس الشعار والأرجل): ألواح ضوء كبيرة وفراغات سوداء تعطي انعكاسات غنية
    const m = new THREE.Scene();
    m.add(new THREE.Mesh(new THREE.SphereGeometry(80, 24, 12), new THREE.MeshBasicMaterial({ color: 0x050403, side: THREE.BackSide })));
    const box = (w, h, pos, color, k) => { const q = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide })); q.position.set(pos[0], pos[1], pos[2]); q.lookAt(0, 1.2, 0); m.add(q); };
    box(16, 7, [0, 11, 2], 0xfff1dc, 8); box(2.4, 16, [-10, 3, 5], 0xffe2bc, 11); box(1.6, 16, [11, 3, 4], 0xdce8ff, 7);
    box(30, 9, [0, 3, -16], 0xcfe3ff, 3.4); box(18, 6, [0, 2, 15], 0xfff0de, 0.3); box(2.6, 15, [-6.5, 3, 14], 0xfff0de, 4.2); box(2.0, 15, [6.5, 3, 14], 0xffdcb4, 3.0); box(26, 26, [0, -2.2, 0], 0xcdb596, 0.45);
    this.metalRT = this.pmrem.fromScene(m, 0.015);
    this.mats.envTex = this.metalRT.texture;
    this.pmrem.dispose();
  }

  buildLights() {
    this.sun = new THREE.DirectionalLight(0xffffff, 3);
    this.sun.castShadow = true;
    const sc = this.sun.shadow.camera; const E = 15; sc.left = -E; sc.right = E; sc.top = E; sc.bottom = -E; sc.near = 1; sc.far = 190;
    this.sun.shadow.bias = -0.0003; this.sun.shadow.normalBias = 0.025; this.sun.shadow.radius = 3.2;
    this.sun.shadow.mapSize.set(this.quality.shadow, this.quality.shadow);
    this.sun.target.position.set(0, 0, 0);
    this.scene.add(this.sun, this.sun.target);
    this.hemi = new THREE.HemisphereLight(0xaac8ee, 0x52422f, 0.7);
    this.scene.add(this.hemi);
  }

  /* ---------------------------------------------------------------- انعكاس الأرضية (مستوى y=0) */
  buildReflection() {
    this.reflCam = new THREE.PerspectiveCamera();
    this.reflU = { tRefl: { value: null }, uTexMat: { value: new THREE.Matrix4() }, uReflK: { value: 0.0 } };
    this._plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this._tmp = { n: new THREE.Vector3(0, 1, 0), v: new THREE.Vector3(), t: new THREE.Vector3(), l: new THREE.Vector3(), rot: new THREE.Matrix4(), cp: new THREE.Plane(), cv: new THREE.Vector4(), q: new THREE.Vector4(), cw: new THREE.Vector3() };
    this.reflRT = null;
  }
  /* يحوّل مادة أرضية GM لتأخذ الانعكاس */
  floorReflective(mat) {
    const base = mat.onBeforeCompile; const self = this;
    mat.onBeforeCompile = (sh) => {
      base(sh);
      Object.assign(sh.uniforms, self.reflU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform mat4 uTexMat; varying vec4 vReflUv;')
        .replace('vWPos = (modelMatrix * vec4(transformed,1.0)).xyz;', 'vWPos = (modelMatrix * vec4(transformed,1.0)).xyz; vReflUv = uTexMat * vec4(vWPos,1.0);');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D tRefl; uniform float uReflK; varying vec4 vReflUv;')
        .replace('#include <opaque_fragment>', `
          if (uReflK > 0.001) {
            vec2 ruv = vReflUv.xy / vReflUv.w;
            ruv += normal.xy * 0.012;
            vec3 rc = texture2D(tRefl, ruv, 1.2).rgb * 0.5 + texture2D(tRefl, ruv + vec2(0.0035, 0.0), 2.4).rgb * 0.25 + texture2D(tRefl, ruv - vec2(0.0035, 0.0), 2.4).rgb * 0.25;
            float fres = pow(1.0 - clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0), 3.0);
            outgoingLight += rc * uReflK * (0.1 + 0.6 * fres) * (1.0 - roughnessFactor * 0.5);
          }
          #include <opaque_fragment>`);
    };
    mat.customProgramCacheKey = () => 'gmfloor';
    return mat;
  }
  updateReflection() {
    const cam = this.camera, rc = this.reflCam, T = this._tmp;
    cam.updateMatrixWorld();
    const wpos = T.cw.setFromMatrixPosition(cam.matrixWorld);
    if (wpos.y <= 0.05) return false;
    const n = T.n, planePos = T.t.set(0, 0, 0);
    T.v.copy(planePos).sub(wpos);
    T.v.reflect(n).negate().add(planePos);
    T.rot.extractRotation(cam.matrixWorld);
    T.l.set(0, 0, -1).applyMatrix4(T.rot).add(wpos);
    const tgt = new THREE.Vector3().subVectors(planePos, T.l).reflect(n).negate().add(planePos);
    rc.position.copy(T.v);
    rc.up.set(0, 1, 0).applyMatrix4(T.rot).reflect(n);
    rc.lookAt(tgt);
    rc.far = cam.far; rc.near = cam.near;
    rc.updateMatrixWorld();
    rc.projectionMatrix.copy(cam.projectionMatrix);
    const tm = this.reflU.uTexMat.value;
    tm.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    tm.multiply(rc.projectionMatrix).multiply(rc.matrixWorldInverse);
    // قصّ مائل: تجاهل ما تحت الأرض
    T.cp.setFromNormalAndCoplanarPoint(n, planePos).applyMatrix4(rc.matrixWorldInverse);
    T.cv.set(T.cp.normal.x, T.cp.normal.y, T.cp.normal.z, T.cp.constant);
    const pm = rc.projectionMatrix;
    T.q.x = (Math.sign(T.cv.x) + pm.elements[8]) / pm.elements[0];
    T.q.y = (Math.sign(T.cv.y) + pm.elements[9]) / pm.elements[5];
    T.q.z = -1.0; T.q.w = (1.0 + pm.elements[10]) / pm.elements[14];
    T.cv.multiplyScalar(2.0 / T.cv.dot(T.q));
    pm.elements[2] = T.cv.x; pm.elements[6] = T.cv.y; pm.elements[10] = T.cv.z + 1.0 - 0.003; pm.elements[14] = T.cv.w;
    return true;
  }

  /* ---------------------------------------------------------------- دورة اليوم */
  setHour(h, force) {
    h = ((h % 24) + 24) % 24;
    this.hour = h;
    let a = KEYS[0], b = KEYS[1];
    for (let i = 0; i < KEYS.length - 1; i++) if (h >= KEYS[i].h && h <= KEYS[i + 1].h) { a = KEYS[i]; b = KEYS[i + 1]; break; }
    const t = (h - a.h) / Math.max(0.001, b.h - a.h), s = t * t * (3 - 2 * t);
    const T = this.tod;
    T.top = a.top.clone().lerp(b.top, s); T.hor = a.hor.clone().lerp(b.hor, s); T.sunCol = a.sun.clone().lerp(b.sun, s);
    T.si = a.si + (b.si - a.si) * s; T.env = a.env + (b.env - a.env) * s;
    T.hs = a.hs.clone().lerp(b.hs, s); T.hg = a.hg.clone().lerp(b.hg, s); T.hi = a.hi + (b.hi - a.hi) * s;
    T.ex = a.ex + (b.ex - a.ex) * s; T.bl = a.bl + (b.bl - a.bl) * s;
    T.sunDir = sunVec(h); T.moonDir = moonVec(h);
    T.sunUp = smooth(-0.03, 0.12, T.sunDir.y);
    T.night = 1 - smooth(-0.1, 0.25, T.sunDir.y);
    T.lamp = 1 - smooth(0.04, 0.34, T.sunDir.y);
    // الإضاءة
    const dir = T.sunUp > 0.001 ? T.sunDir : T.moonDir;
    this.lightDir = dir.clone().normalize();
    this.sun.color.copy(T.sunUp > 0.5 ? T.sunCol : T.sunCol).lerp(new THREE.Color('#9db4ff'), 1 - T.sunUp);
    this.sun.intensity = T.sunUp * T.si + (1 - T.sunUp) * 1.4 * smooth(-0.05, 0.06, T.moonDir.y) * (T.night > 0.3 ? 1 : 0.3);
    this.hemi.color.copy(T.hs); this.hemi.groundColor.copy(T.hg); this.hemi.intensity = T.hi * this.hemiScale;
    this.scene.environmentIntensity = T.env * (this.envScale || 1); this.mats.updateEnv(T.env * (this.envScale || 1));
    if (this.skyUniforms) {
      const u = this.skyUniforms;
      u.uTop.value.copy(T.top); u.uHor.value.copy(T.hor); u.uSunDir.value.copy(T.sunDir); u.uMoonDir.value.copy(T.moonDir); u.uSunCol.value.copy(T.sunCol); u.uNight.value = T.night;
    }
    this._placeSun();
    this.onTod && this.onTod(T, h);
  }
  _placeSun() {
    const f = this.focus; this.sun.target.position.copy(f);
    this.sun.position.copy(f).addScaledVector(this.lightDir, 80);
  }
  lampLevel() { return this.lampOverride === null ? this.tod.lamp : this.lampOverride; }

  /* ---------------------------------------------------------------- حجم/جودة */
  resize() {
    const w = this.canvas.clientWidth || window.innerWidth, h = this.canvas.clientHeight || window.innerHeight;
    this.w = w; this.h = h;
    const r = this.renderer;
    r.setPixelRatio(1); r.setSize(Math.round(w * this.quality.dpr), Math.round(h * this.quality.dpr), false);
    this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    this.post.resize(w, h, this.quality.dpr);
    if (this.reflRT) { this.reflRT.dispose(); this.reflRT = null; }
    if (this.quality.refl > 0) {
      this.reflRT = new THREE.WebGLRenderTarget(Math.round(w * this.quality.dpr * this.quality.refl), Math.round(h * this.quality.dpr * this.quality.refl), { type: this.post.hfType, depthBuffer: true, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
      this.reflU.tRefl.value = this.reflRT.texture;
    }
    this.cam2 = this.camera.clone();
  }
  setQuality(p) {
    Object.assign(this.quality, p);
    if (p.shadow) { this.sun.shadow.mapSize.set(p.shadow, p.shadow); if (this.sun.shadow.map) { this.sun.shadow.map.dispose(); this.sun.shadow.map = null; } }
    this.resize();
  }

  onFrame(fn) { this.hooks.push(fn); }
  start() { if (this.running) return; this.running = true; this.clock.getDelta(); this.renderer.setAnimationLoop(() => this.tick()); }
  stop() { this.running = false; this.renderer.setAnimationLoop(null); }

  tick() {
    const dt = Math.min(0.05, this.clock.getDelta()); this.time += dt;
    // حوكمة الجودة
    this._ema = (this._ema || 16) * 0.96 + dt * 1000 * 0.04;
    this._slow = this._ema > 24 ? (this._slow || 0) + dt : Math.max(0, (this._slow || 0) - dt * 2);
    if (this._slow > 2.4 && this.quality.level < 3) {
      this.quality.level++; this._slow = 0; this._ema = 16;
      const L = this.quality.level;
      if (L === 1) this.setQuality({ dpr: Math.max(1, this.quality.dpr - 0.35), refl: this.quality.refl ? 0.35 : 0 });
      else if (L === 2) this.setQuality({ dpr: Math.max(1, this.quality.dpr - 0.3), shadow: Math.min(this.quality.shadow, 2048), refl: 0 });
      else this.setQuality({ dpr: 1, shadow: 1024 });
    }
    this.mats.update(dt);
    for (const fn of this.hooks) fn(dt, this.time);
    this.fade += (this.fadeTarget - this.fade) * (1 - Math.exp(-dt * 2.2));
    this.render();
  }

  render() {
    const r = this.renderer, T = this.tod;
    this._placeSun();
    // 1) انعكاس الأرضية
    r.shadowMap.needsUpdate = true;
    let didRefl = false;
    if (this.reflRT && this.reflFloor) {
      if (this.updateReflection()) {
        const hide = this.reflHide.map((o) => o.visible);
        this.reflHide.forEach((o) => (o.visible = false));
        const bg = r.getRenderTarget();
        r.setRenderTarget(this.reflRT); r.clear(); r.render(this.scene, this.reflCam); r.setRenderTarget(bg);
        this.reflHide.forEach((o, i) => (o.visible = hide[i]));
        this.reflU.uReflK.value = 1; didRefl = true;
      } else this.reflU.uReflK.value = 0;
    } else this.reflU.uReflK.value = 0;
    // 2) المشهد → HDR
    r.setRenderTarget(this.post.sceneRT); r.clear(); r.render(this.scene, this.camera);
    // 3) تألّق + تركيب
    this.post.bloom();
    this.post.composite(this.time, { bloom: T.bl * (this.bloomK || 1), exposure: T.ex * (this.exposureK || 1), fade: this.fade, tint: this.extraTint });
  }
}
