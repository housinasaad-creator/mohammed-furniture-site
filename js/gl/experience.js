/*
  التجربة: "يوم في بيت محمد". خمس وقفات للهيرو (الفجر → الصباح → الظهر → الغروب → الليل) تمرّ فيها الكاميرا
  بالمناطق الأربع، والشمس تتحرك والمصابيح تشتعل. بعدها وضع المتجر: كل قطعة قابلة للتعديل الحي
  (قماش/خشب/حجر/مقاس) مع موجة إعادة الطلاء، وعرض مفكّك (Anatomy) وأبعاد (Dimensions) وتحكم بالشمس.
  الواجهة (DOM) تتصل عبر callbacks؛ كل ما هنا في المشهد الثلاثي الأبعاد.
*/
import * as THREE from 'three';
import { World } from './core.js';
import { Gallery, ZX } from './gallery.js';

const V3 = THREE.Vector3;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* الوقفات: كاميرا، هدف، ساعة اليوم، رقم المنطقة */
const HERO = [
  { zone: 0, cam: [-13.2, 1.15, 7.4], tgt: [-14, 1.05, -0.9], fov: 30, hour: 5.75 },
  { zone: 1, cam: [1.9, 1.5, 6.9], tgt: [0.1, 0.95, -0.7], fov: 30, hour: 8.6 },
  { zone: 2, cam: [14.9, 1.55, 6.2], tgt: [14, 1.0, 0.0], fov: 30, hour: 13.0 },
  { zone: 3, cam: [29.0, 1.45, 7.0], tgt: [28, 1.05, -1.3], fov: 30, hour: 17.9 },
  { zone: 3, cam: [26.9, 1.15, 5.0], tgt: [28.1, 0.9, -1.45], fov: 30, hour: 22.3 }
];
const LAST = HERO.length - 1;
export const HERO_HOURS = HERO.map((h) => h.hour);
const DUR = 2600;

/* لقطات المتجر: مسافة، ارتفاع، زاوية، ارتفاع الهدف */
const SHOTS = {
  sofa: { d: 7.0, h: 1.45, yaw: -0.2, ty: 0.55 },
  chair: { d: 4.9, h: 1.2, yaw: 0.2, ty: 0.45 },
  coffee: { d: 4.6, h: 1.55, yaw: 0.0, ty: 0.2 },
  table: { d: 7.6, h: 1.6, yaw: -0.18, ty: 0.55 },
  dchair: { d: 7.6, h: 1.6, yaw: -0.18, ty: 0.55 },
  bed: { d: 7.6, h: 1.6, yaw: 0.0, ty: 0.8 }
};
export const PRODUCT_ORDER = ['sofa', 'chair', 'coffee', 'table', 'dchair', 'bed'];
const ZONE_OF = { sofa: 1, chair: 1, coffee: 1, table: 2, dchair: 2, bed: 3 };

export class Experience {
  constructor(o) {
    this.o = o;
    this.mql = window.matchMedia('(max-width: 860px)');
    this.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.step = 0; this.pos = 0; this.anim = null; this.introStart = null;
    this.shopT = 0; this.active = true;
    this.sel = 'sofa'; this.selZone = 1;
    this.userYaw = 0; this.userPitch = 0; this.userVel = 0; this.userZoom = 0; this.drag = null;
    this.look = new THREE.Vector2(); this.lookTgt = new THREE.Vector2();
    this.shopHour = 11; this.hourNow = HERO[0].hour;
    this.anatomy = 0; this.anatomyOn = false; this.dimsOn = false;
    this.pointer = new THREE.Vector2(); this.ray = new THREE.Raycaster();
    this.curKind = null; this.hover = null;
    this._cp = new V3(); this._ct = new V3();
    this.styleIndex = 0;
    /* هيرو الفيديو: الوقفات الخمس فيديو مُصوَّر مسبقاً (js/hero-video.js) والمشهد الحي يبدأ من حالة نهاية اليوم (كل المناطق مبنية، الليل)؛ ولا يرسم ما دام الفيديو ظاهراً (قمة الصفحة) */
    this.vOn = !o.videoHero;
    if (o.videoHero) { this.step = this.pos = LAST; this.hourNow = HERO[LAST].hour; this.introStart = performance.now() - 9999; }
  }
  get mobile() { return this.mql.matches; }

  async init(progress) {
    const canvas = this.o.canvas;
    const mobile = this.mobile || /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
    this.world = new World(canvas, { mobile, preserve: this.o.preserve });
    progress && progress(0.1);
    await new Promise((r) => setTimeout(r, 30));
    this.gal = new Gallery(this.world, 0);
    progress && progress(0.55);
    await new Promise((r) => setTimeout(r, 30));
    this.world.fade = 0; this.world.fadeTarget = 0;
    this.world.setHour(HERO[this.step].hour, true);
    this.bindInput(canvas);
    this.world.onFrame((dt, t) => this.update(dt, t));
    window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    this.onScroll();
    // نوقف الرسم حين لا يُرى المشهد
    const watch = [this.o.heroEl, this.o.shopEl].filter(Boolean);
    if ('IntersectionObserver' in window) {
      const vis = new Map();
      const io = new IntersectionObserver((es) => {
        es.forEach((e) => vis.set(e.target, e.isIntersecting));
        const on = [...vis.values()].some(Boolean);
        if (on !== this.active) { this.active = on; this.applyRun(); }
      }, { threshold: 0 });
      watch.forEach((el) => io.observe(el));
    }
    this.camSetup(0);
    this.warm();
    if (this.o.videoHero) this.buildAll();
    progress && progress(0.95);
    this.applyRun();
    return this;
  }
  /* الرسم يعمل فقط حين يكون الكانفس ظاهراً: قسم المتجر مرئي، وفي وضع هيرو الفيديو أيضاً بعد مغادرة قمة الصفحة */
  applyRun() { const run = this.active && this.vOn; run ? this.world.start() : this.world.stop(); }
  /* كل المناطق مبنية فوراً كما تكون بعد أن يمرّ الزائر بالرحلة كلها (الفيديو أظهر البناء) */
  buildAll() {
    const g = this.gal, w = this.world;
    g.zones.forEach((z) => { z.built = true; g.setZoneBuilt(z, 1); });
    g.anim.length = 0; g.logoAnim = null; g.logo.position.y = 0.42; g.logo.scale.setScalar(1);
    w.fade = 1; w.fadeTarget = 1;
  }

  /* تجميع الشيدرات مسبقاً كي لا يحدث تقطيع عند أول ظهور */
  warm() {
    const w = this.world, g = this.gal, cam = w.camera;
    const hour = w.hour, pos0 = cam.position.clone(), q0 = cam.quaternion.clone(), fov0 = cam.fov, fade0 = w.fade;
    g.zones.forEach((z) => g.setZoneBuilt(z, 1));
    w.fade = 1;
    // رسم حقيقي من كل وقفة وبساعتها كي تُترجَم كل الشيدرات قبل أن يراها الزائر
    HERO.forEach((H, i) => {
      w.setHour(H.hour, true);
      cam.position.set(...H.cam); cam.lookAt(...H.tgt); cam.fov = H.fov; cam.updateProjectionMatrix(); cam.updateMatrixWorld();
      w.focus.set(H.tgt[0], 0, 0);
      w.render();
    });
    cam.position.copy(pos0); cam.quaternion.copy(q0); cam.fov = fov0; cam.updateProjectionMatrix();
    w.setHour(hour, true); w.fade = fade0;
    g.zones.forEach((z) => { g.setZoneBuilt(z, 0); z.built = false; });
  }

  /* ---------------------------------------------------------------- مدخلات */
  bindInput(canvas) {
    const stepTo = (d) => this.goStep(this.step + d);
    let lastWheel = 0, consumed = true, owned = false;
    window.addEventListener('wheel', (e) => {
      const now = performance.now(), fresh = now - lastWheel > 110; lastWheel = now;
      if (fresh) { consumed = false; owned = false; }
      if (e.ctrlKey || e.defaultPrevented) return;
      let dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      if (Math.abs(dy) < 2) return;
      // في المتجر: عجلة الماوس فوق المشهد تقرّب/تبعّد قليلاً
      if (this.shopT > 0.85 && e.target && e.target.id === 'gl' && !e.shiftKey) { this.userZoom = clamp(this.userZoom + dy * 0.0014, -0.35, 0.35); }
      if (this.o.videoHero) return;                      // وقفات الهيرو يديرها محرّك الفيديو
      if (window.scrollY > 2 || this.o.locked?.()) { consumed = true; return; }
      const down = dy > 0;
      if (this.busy()) { e.preventDefault(); owned = true; consumed = true; return; }
      if (!owned) {
        if ((down && this.step >= LAST) || (!down && this.step <= 0)) { consumed = true; return; }
        owned = true;
      }
      e.preventDefault();
      if (consumed) return;
      consumed = true; stepTo(down ? 1 : -1);
    }, { passive: false });

    let tY = 0, tX = 0, tTop = false, tDone = false;
    window.addEventListener('touchstart', (e) => { const t = e.touches[0]; tY = t.clientY; tX = t.clientX; tTop = window.scrollY <= 2; tDone = false; }, { passive: true });
    window.addEventListener('touchmove', (e) => {
      if (this.o.videoHero) return;
      if (!tTop || e.touches.length > 1 || window.scrollY > 2 || this.o.locked?.()) return;
      const t = e.touches[0], dy = tY - t.clientY, dx = tX - t.clientX;
      if (Math.abs(dy) < 6 || Math.abs(dy) < Math.abs(dx)) return;
      const down = dy > 0;
      if (this.busy()) { if (e.cancelable) e.preventDefault(); tDone = true; return; }
      if (!tDone && ((down && this.step >= LAST) || (!down && this.step <= 0))) return;
      if (e.cancelable) e.preventDefault();
      if (!tDone && Math.abs(dy) > 26) { tDone = true; stepTo(down ? 1 : -1); }
    }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || this.o.locked?.()) return;
      const tg = e.target && e.target.tagName;
      if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT' || tg === 'BUTTON' || tg === 'A') return;
      const k = e.key;
      if (this.shopT > 0.85) {
        const i = PRODUCT_ORDER.indexOf(this.sel);
        if (k === 'ArrowRight') { this.select(PRODUCT_ORDER[(i + 1) % PRODUCT_ORDER.length]); e.preventDefault(); }
        else if (k === 'ArrowLeft') { this.select(PRODUCT_ORDER[(i + PRODUCT_ORDER.length - 1) % PRODUCT_ORDER.length]); e.preventDefault(); }
        return;
      }
      if (window.scrollY > 2 || this.o.videoHero) return;
      const down = k === 'ArrowDown' || k === 'PageDown' || k === ' ', up = k === 'ArrowUp' || k === 'PageUp';
      if (!down && !up) return;
      if (!this.busy() && ((down && this.step >= LAST) || (up && this.step <= 0))) return;
      e.preventDefault();
      if (!this.busy()) stepTo(down ? 1 : -1);
    });

    // مؤشر: تحويم/سحب/نقر
    const toNdc = (e) => { const r = canvas.getBoundingClientRect(); this.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
    const setKind = (k) => { if (k !== this.curKind) { this.curKind = k; this.o.onHover && this.o.onHover(k); } };
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      this.lookTgt.set(((e.clientX / innerWidth) - 0.5) * 2, ((e.clientY / innerHeight) - 0.5) * 2);
      if (this.drag) return;
      if (!e.target || e.target.id !== 'gl' || this.shopT < 0.8) { this.hover = null; setKind(null); return; }
      toNdc(e);
      const id = this.pick();
      this.hover = id;
      setKind(id ? (id === this.sel ? 'rotate' : 'select') : 'drag');
    }, { passive: true });
    canvas.addEventListener('pointerdown', (e) => {
      if (this.shopT < 0.8) return;
      toNdc(e);
      this.drag = { x: e.clientX, y: e.clientY, sx: e.clientX, sy: e.clientY, id: this.pick(), moved: false, t: performance.now() };
      canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener('pointermove', (e) => {
      const d = this.drag; if (!d) return;
      const dx = e.clientX - d.x, dy = e.clientY - d.y; d.x = e.clientX; d.y = e.clientY;
      if (Math.hypot(e.clientX - d.sx, e.clientY - d.sy) > 6) d.moved = true;
      if (!d.moved) return;
      const now = performance.now(), dtm = Math.max(1, now - d.t); d.t = now;
      this.userYaw = clamp(this.userYaw - dx * 0.006, -1.05, 1.05);
      this.userPitch = clamp(this.userPitch + dy * 0.004, -0.45, 0.9);
      this.userVel = lerp(this.userVel, (-dx * 0.006) / (dtm / 1000), 0.4);
    });
    const end = () => {
      const d = this.drag; if (!d) return; this.drag = null;
      if (!d.moved && d.id) { if (d.id !== this.sel) { this.select(d.id); this.o.sfx && this.o.sfx.knock(d.id); } else { this.o.onTap && this.o.onTap(d.id); this.o.sfx && this.o.sfx.knock(d.id); this.bump(d.id); } }
    };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('dblclick', () => { this.userYaw = 0; this.userPitch = 0; this.userZoom = 0; });
    // جيروسكوب (هواتف)
    const gyro = (e) => {
      if (e.gamma == null) return;
      this.lookTgt.set(clamp(e.gamma / 28, -1, 1), clamp(((e.beta || 60) - 62) / 30, -1, 1));
    };
    this.enableGyro = () => {
      if (this._gyro) return; this._gyro = true;
      const DE = window.DeviceOrientationEvent;
      if (DE && typeof DE.requestPermission === 'function') DE.requestPermission().then((s) => { if (s === 'granted') window.addEventListener('deviceorientation', gyro); }).catch(() => {});
      else if (DE) window.addEventListener('deviceorientation', gyro);
    };
    if ('ontouchstart' in window) window.addEventListener('touchend', () => this.enableGyro(), { once: true, passive: true });
  }

  pick() {
    this.ray.setFromCamera(this.pointer, this.world.camera);
    let best = null, bd = 1e9;
    for (const id of PRODUCT_ORDER) {
      const p = this.gal.products[id];
      if (p.build < 0.98 || !this.gal.zones[ZONE_OF[id]].built) continue;
      const h = this.ray.intersectObject(p.group, true);
      if (h.length && h[0].distance < bd) { bd = h[0].distance; best = id; }
    }
    return best;
  }
  bump(id) { const p = this.gal.products[id]; if (p) p.pop = 1; }

  /* ---------------------------------------------------------------- الوقفات */
  busy() { return !!this.anim || document.body.classList.contains('is-loading'); }
  goStep(i, instant) {
    i = clamp(i, 0, LAST);
    if (i === this.step && !this.anim) return;
    const from = this.pos; this.step = i;
    if (instant || this.reduce) { this.anim = null; this.pos = i; this.o.onStep && this.o.onStep(this.step, this.pos); return; }
    const dist = Math.abs(i - from);
    this.anim = { from, to: i, t0: performance.now(), dur: DUR + 800 * Math.max(0, dist - 1) };
    this.o.sfx && this.o.sfx.whoosh();
    this.o.onStep && this.o.onStep(this.step, this.pos);
  }
  onScroll() {
    const vh = window.innerHeight;
    this.shopT = smooth(clamp(window.scrollY / (vh * 0.9), 0, 1));
    this.o.onShopT && this.o.onShopT(this.shopT);
    if (this.o.videoHero && this.world) { const on = window.scrollY > 2; if (on !== this.vOn) { this.vOn = on; this.applyRun(); } }
    // إذا توقف التمرير بين الهيرو والمتجر نُكمل باتجاه حركة المستخدم (كي لا تبقى الواجهة في منتصف الطريق)
    const y = window.scrollY, dy = y - (this._lastY || 0); this._lastY = y;
    if (Math.abs(dy) > 0.5) this._dir = dy > 0 ? 1 : -1;
    clearTimeout(this._snap);
    this._snap = setTimeout(() => {
      const yy = window.scrollY;
      if (yy > 3 && yy < vh * 0.97 && !this.o.locked?.()) window.scrollTo({ top: (this._dir || 1) > 0 ? vh : 0, behavior: 'smooth' });
    }, 180);
  }

  /* ---------------------------------------------------------------- واجهة عامة */
  intro() {
    this.introStart = performance.now();
    this.world.fadeTarget = 1;
    this.gal.enterZone(0);
    this.o.sfx && this.o.sfx.whoosh();
  }
  select(id) {
    if (!this.gal.products[id] || id === this.sel) return;
    this.sel = id; this.selZone = ZONE_OF[id];
    this.userYaw = 0; this.userPitch = 0; this.userZoom = 0;
    if (this.gal.enterZone(this.selZone)) this.o.sfx && setTimeout(() => this.o.sfx.build(9), 400);
    this.setAnatomy(false);
    this.o.onSelect && this.o.onSelect(id);
  }
  product() { return this.gal.products[this.sel]; }
  setHour(h) { this.shopHour = clamp(h, 0, 24); }
  getHour() { return this.world.hour; }
  setStyle(i) {
    this.styleIndex = i;
    const c = this._ct.clone(); c.y = 0.5;
    this.gal.applyStyle(i, c);
    this.o.sfx && this.o.sfx.wave();
  }
  setOption(key, val) {
    const p = this.product(), g = this.gal;
    this.o.sfx && this.o.sfx.tick();
    const rebuilds = { seats: 1, size: 1, length: 1, top: 1 };
    if (rebuilds[key]) {
      if (key === 'top') p.setSel('top', val); else p.setOpt(key, val);
      g.replay(p);
      if (p.id === 'table') { this.gal.dchair.syncTable(); g.replay(this.gal.dchair); }
      this.o.sfx && this.o.sfx.thud();
    } else {
      p.setSel(key, val, p.worldCenter());
    }
    this.o.onOption && this.o.onOption(key, val);
  }
  setAnatomy(on) { this.anatomyOn = !!on; }
  setDims(on) { this.dimsOn = !!on; }
  flyPoint(id) {
    const p = this.gal.products[id || this.sel];
    const c = p.center.clone(); p.group.localToWorld(c); c.project(this.world.camera);
    return { x: (c.x * 0.5 + 0.5) * innerWidth, y: (-c.y * 0.5 + 0.5) * innerHeight };
  }

  /* لقطة صغيرة (data URL) لقطعة بإعدادها الحالي: للسلة والمصغّرات */
  snapshot(id, size = 240) {
    const w = this.world, p = this.gal.products[id], cam = w.camera;
    const save = { pos: cam.position.clone(), q: cam.quaternion.clone(), fov: cam.fov, vo: cam.view ? Object.assign({}, cam.view) : null };
    const hour = w.hour, fade = w.fade, zb = this.gal.zones[ZONE_OF[id]].built, pb = p.build, an = p.anatomy;
    if (!zb) this.gal.setZoneBuilt(this.gal.zones[ZONE_OF[id]], 1);
    p.build = 1; p.anatomy = 0; p.applyAnim();
    w.fade = 1;
    if (hour < 7 || hour > 18) w.setHour(11, true);
    const shot = SHOTS[id], center = p.group.localToWorld(p.center.clone());
    const pf = Math.max(1, 1.0 / (w.canvas.width / w.canvas.height)) * 0.95;
    cam.fov = 30; cam.clearViewOffset();
    const dd = shot.d * 0.92 * pf;
    cam.position.set(center.x + Math.sin(shot.yaw - 0.35) * dd, center.y + shot.h * 0.7 * pf, center.z + Math.cos(shot.yaw - 0.35) * dd);
    cam.lookAt(center.x, center.y + shot.ty * 0.5, center.z);
    cam.updateProjectionMatrix(); cam.updateMatrixWorld();
    w.focus.set(center.x, 0, 0);
    w.render();
    const cv = w.canvas, W = cv.width, H = cv.height;
    // قصّ مربع حول إسقاط الصندوق المحيط بالبكسل
    const box = new THREE.Box3().setFromObject(p.group), pts = [];
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) pts.push(new V3(x, y, z).project(cam));
    let x0 = 1, x1 = -1, y0 = 1, y1 = -1; pts.forEach((q) => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
    const bw = (x1 - x0) / 2 * W, bh = (y1 - y0) / 2 * H;
    const side = Math.max(Math.max(bw, bh) * 1.3, Math.min(W, H) * 0.3);
    const px = ((x0 + x1) / 4 + 0.5) * W, py = (-(y0 + y1) / 4 + 0.5) * H;
    const out = document.createElement('canvas'); out.width = out.height = size;
    const g2 = out.getContext('2d'); g2.fillStyle = '#e9e0d0'; g2.fillRect(0, 0, size, size);
    g2.drawImage(cv, px - side / 2, py - side / 2, side, side, 0, 0, size, size);
    const url = out.toDataURL('image/jpeg', 0.82);
    // استعادة
    cam.position.copy(save.pos); cam.quaternion.copy(save.q); cam.fov = save.fov; cam.updateProjectionMatrix();
    w.fade = fade; w.setHour(hour, true);
    p.build = pb; p.anatomy = an; p.applyAnim();
    if (!zb) this.gal.setZoneBuilt(this.gal.zones[ZONE_OF[id]], 0);
    return url;
  }

  /* ---------------------------------------------------------------- كاميرا */
  heroCam(pos) {
    const seg = clamp(Math.floor(pos), 0, LAST - 1), u = clamp(pos - seg, 0, 1), e = smooth(u);
    const A = HERO[seg], B = HERO[seg + 1];
    const m = (a, b) => lerp(a, b, e);
    const lift = Math.sin(Math.PI * u) * (A.zone !== B.zone ? 1.1 : 0.15);
    return {
      cam: new V3(m(A.cam[0], B.cam[0]), m(A.cam[1], B.cam[1]) + lift, m(A.cam[2], B.cam[2])),
      tgt: new V3(m(A.tgt[0], B.tgt[0]), m(A.tgt[1], B.tgt[1]), m(A.tgt[2], B.tgt[2])),
      fov: m(A.fov, B.fov), hour: lerp(A.hour, B.hour, e)
    };
  }
  shopCam() {
    const p = this.product(), shot = SHOTS[this.sel];
    const c = p.group.localToWorld(p.center.clone());
    const dist = shot.d * (1 + this.userZoom) * (1 + this.anatomy * 0.38) * (this.mobile ? 1.18 : 1);
    const yaw = shot.yaw + this.userYaw, pitch = this.userPitch;
    const cam = new V3(c.x + Math.sin(yaw) * dist * Math.cos(pitch * 0.5), c.y + shot.h * (1 + pitch * 0.6) + this.anatomy * 0.7, c.z + Math.cos(yaw) * dist);
    const tgt = new V3(c.x, c.y + shot.ty + this.anatomy * 0.55 - c.y + 0.0, c.z); tgt.y = shot.ty + this.anatomy * 0.55;
    return { cam, tgt, fov: 30 };
  }
  camSetup(dt) {
    // يُستدعى مرة قبل التحديث لوضع أولي
    const h = this.heroCam(0);
    this.world.camera.position.copy(h.cam); this.world.camera.lookAt(h.tgt);
  }

  /* ---------------------------------------------------------------- كل إطار */
  update(dt, time) {
    const w = this.world, cam = w.camera, g = this.gal;
    // وقفات
    if (this.anim) {
      const t = Math.min(1, (performance.now() - this.anim.t0) / this.anim.dur);
      this.pos = t >= 1 ? this.anim.to : this.anim.from + (this.anim.to - this.anim.from) * ease(t);
      if (t >= 1) { this.anim = null; this.o.onStep && this.o.onStep(this.step, this.pos, true); }
    }
    const st = this.shopT;
    const h = this.heroCam(this.pos), s = this.shopCam();
    // مزج الهيرو مع المتجر (المسار يرتفع قليلاً في المنتصف)
    const k = st, lift = Math.sin(Math.PI * k) * 1.4;
    const cp = this._cp.copy(h.cam).lerp(s.cam, k); cp.y += lift;
    const ct = this._ct.copy(h.tgt).lerp(s.tgt, k);
    // مقدّمة: الكاميرا تقترب
    const ik = this.introStart === null ? 0 : ease(clamp((performance.now() - this.introStart) / 3200, 0, 1));
    cp.z += (1 - ik) * 2.6 * (1 - st);
    // شاشات ضيّقة: نُبعد الكاميرا ليتّسع العرض
    const pf = Math.max(1, 0.82 / cam.aspect);
    cp.x = ct.x + (cp.x - ct.x) * pf; cp.y = ct.y + (cp.y - ct.y) * pf; cp.z = ct.z + (cp.z - ct.z) * pf;
    // حركة خفيفة + مؤشر
    this.look.lerp(this.lookTgt, 1 - Math.exp(-dt * 3));
    const br = Math.sin(time * 0.5) * 0.04;
    cam.position.set(cp.x + this.look.x * 0.45 + br, cp.y - this.look.y * 0.14 + br * 0.5, cp.z);
    cam.fov = lerp(h.fov, s.fov, k); cam.lookAt(ct);
    // إزاحة المنظور: الموضوع يسار اللوحة (سطح المكتب) أو أعلى (موبايل)
    const W = w.w, H = w.h;
    const hero = this.mobile ? { x: 0, y: 0.12 } : { x: -0.1, y: 0.0 }, shop = this.mobile ? { x: 0, y: 0.2 } : { x: 0.17, y: 0.0 };
    const ox = lerp(hero.x, shop.x, k) * W, oy = lerp(hero.y, shop.y, k) * H;
    cam.setViewOffset(W, H, ox, oy, W, H);
    cam.updateProjectionMatrix();
    // الشمس: في الهيرو تتبع الوقفات وفي المتجر المستخدم يتحكم
    const hr = lerp(h.hour, this.shopHour, k);
    this.hourNow = hr;
    w.setHour(hr);
    w.focus.set(ct.x, 0, 0);
    // بناء المناطق عند الاقتراب
    const near = ZX.reduce((b, c, i) => (Math.abs(ct.x - c) < Math.abs(ct.x - ZX[b]) ? i : b), 0);
    if (Math.abs(ct.x - ZX[near]) < 6.5 && !g.zones[near].built && this.introStart !== null) { if (g.enterZone(near)) this.o.sfx && setTimeout(() => this.o.sfx.build(9), 500); }
    // عرض مفكّك
    const sel = this.product();
    const target = this.anatomyOn && st > 0.8 ? 1 : 0;
    this.anatomy += (target - this.anatomy) * (1 - Math.exp(-dt * 3.4));
    if (Math.abs(this.anatomy - (sel.anatomy || 0)) > 0.0005) { sel.anatomy = this.anatomy; if (sel.build >= 1) sel.applyAnim(); }
    for (const id of PRODUCT_ORDER) { const p = g.products[id]; if (p !== sel && p.anatomy) { p.anatomy = 0; if (p.build >= 1) p.applyAnim(); } }
    // دوران ذاتي ناعم
    if (!this.drag) { this.userYaw += this.userVel * dt * 0.1; this.userVel *= Math.exp(-dt * 3); }
    // نبضة النقر
    for (const id of PRODUCT_ORDER) { const p = g.products[id]; if (p.pop > 0) { p.pop = Math.max(0, p.pop - dt * 3.2); const s2 = 1 + Math.sin((1 - p.pop) * Math.PI) * 0.02 * p.pop; p.group.scale.setScalar(s2); } else if (p.group.scale.x !== 1) p.group.scale.setScalar(1); }
    this.o.onFrame && this.o.onFrame(dt, time);
    this.updateOverlays();
  }

  /* مسمّيات التشريح + أبعاد: إحداثيات شاشة */
  updateOverlays() {
    const cam = this.world.camera, p = this.product();
    const W = innerWidth, H = innerHeight;
    const toScreen = (v) => { const q = v.clone().project(cam); return { x: (q.x * 0.5 + 0.5) * W, y: (-q.y * 0.5 + 0.5) * H, z: q.z }; };
    if (this.anatomy > 0.6 && this.o.onLabels) {
      const seen = new Set(), list = [];
      p.parts.forEach((part, i) => { if (seen.has(part.userData.label)) return; seen.add(part.userData.label); const c = p.partCenter(i); const sc = toScreen(c); list.push({ label: part.userData.label, x: sc.x, y: sc.y }); });
      this.o.onLabels(list, this.anatomy);
    } else if (this._labelsOn) { this.o.onLabels && this.o.onLabels([], 0); }
    this._labelsOn = this.anatomy > 0.6;
    if (this.dimsOn && this.shopT > 0.8 && this.o.onDims) {
      const b = p.localBox || p.box, m = p.group.matrixWorld;
      const P = (x, y, z) => new V3(x, y, z).applyMatrix4(m);
      const a = P(b.min.x, b.min.y, b.max.z), bb = P(b.max.x, b.min.y, b.max.z), c = P(b.max.x, b.min.y, b.min.z), d = P(b.min.x, b.max.y, b.max.z);
      const dm = { w: Math.round(b.max.x - b.min.x) , h: 0, d: 0 };
      void dm;
      this.o.onDims({
        w: { a: toScreen(a), b: toScreen(bb), v: Math.round((b.max.x - b.min.x) * 100) },
        d: { a: toScreen(bb), b: toScreen(c), v: Math.round((b.max.z - b.min.z) * 100) },
        h: { a: toScreen(a), b: toScreen(d), v: Math.round((b.max.y - b.min.y) * 100) }
      });
      this._dimsOn = true;
    } else if (this._dimsOn) { this._dimsOn = false; this.o.onDims && this.o.onDims(null); }
  }
}
