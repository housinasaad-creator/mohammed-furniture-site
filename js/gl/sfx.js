/*
  صوت مولّد بالكود (WebAudio) بلا أي ملف: نقرات الخشب والقماش والرخام، وشوشة الانتقال، موجة الطلاء،
  وأجواء المكان: رياح وعصافير نهاراً وصراصير ليلاً بحسب ساعة اليوم. افتراضياً مطفأ.
*/
export class Sfx {
  constructor() { this.on = false; this.ctx = null; this.master = null; this.noise = null; this.amb = null; this.night = 0; this._t = 0; }
  _init() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = 0.75;
    const comp = this.ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    this.master.connect(comp); comp.connect(this.ctx.destination);
    const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    this.noise = buf;
  }
  toggle() {
    this.on = !this.on;
    if (this.on) { this._init(); if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); this.startAmbient(); this.add(); } else this.stopAmbient();
    return this.on;
  }
  _src(t0, dur, type, f0, f1, q, gain, atk = 0.005, dest) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, s = c.createBufferSource(); s.buffer = this.noise; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t0 + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + atk); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(dest || this.master); s.start(t0, Math.random()); s.stop(t0 + dur + 0.05);
  }
  _tone(t0, freq, dur, gain, type = 'sine', slide = 1, dest) {
    if (!this.on || !this.ctx) return;
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(gain, t0 + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(dest || this.master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  now() { return this.ctx ? this.ctx.currentTime : 0; }

  /* نقرة على قطعة: خشب (طاولة/كرسي/سرير)، قماش (أريكة)، رخام (قهوة) */
  knock(id) {
    if (!this.on) return; const t = this.now();
    if (id === 'sofa' || id === 'chair') { this._tone(t, 95, 0.22, 0.34, 'sine', 0.6); this._src(t, 0.18, 'lowpass', 700, 180, 0.7, 0.28, 0.004); }
    else if (id === 'coffee') { this._tone(t, 2300, 0.9, 0.08); this._tone(t, 2300 * 2.4, 0.5, 0.04); this._tone(t, 2300 * 4.1, 0.3, 0.02); this._src(t, 0.04, 'highpass', 4000, 5000, 0.7, 0.1, 0.001); }
    else { const f = id === 'bed' ? 120 : id === 'table' ? 170 : 210; this._tone(t, f, 0.18, 0.36, 'sine', 0.55); this._tone(t, f * 2.3, 0.1, 0.12, 'triangle', 0.7); this._src(t, 0.06, 'bandpass', 900, 700, 1.4, 0.25, 0.002); }
  }
  thud() { if (!this.on) return; const t = this.now(); this._tone(t, 80, 0.25, 0.3, 'sine', 0.55); this._src(t, 0.12, 'lowpass', 600, 150, 0.7, 0.2, 0.003); }
  build(n = 8) { if (!this.on) return; const t = this.now(); for (let i = 0; i < n; i++) { const tt = t + i * 0.11 + Math.random() * 0.05; this._tone(tt, 150 + Math.random() * 120, 0.09, 0.14, 'triangle', 0.6); this._src(tt, 0.05, 'bandpass', 1200, 900, 1.2, 0.08, 0.002); } }
  tick() { if (!this.on) return; const t = this.now(); this._tone(t, 2800, 0.04, 0.025, 'triangle', 0.7); }
  whoosh() { if (!this.on) return; const t = this.now(); this._src(t, 2.2, 'bandpass', 180, 1500, 0.6, 0.2, 0.9); this._src(t + 1.0, 1.4, 'bandpass', 1500, 260, 0.7, 0.1, 0.35); }
  wave() { if (!this.on) return; const t = this.now(); [523, 659, 784, 1047, 1319].forEach((f, i) => this._tone(t + i * 0.09, f, 0.9, 0.05, 'sine')); this._src(t, 1.6, 'bandpass', 400, 4200, 0.8, 0.12, 0.5); }
  add() { if (!this.on) return; const t = this.now(); this._tone(t, 784, 0.35, 0.09, 'triangle'); this._tone(t + 0.09, 1175, 0.5, 0.09, 'triangle'); this._tone(t + 0.19, 1568, 0.7, 0.07, 'sine'); }
  seal() { if (!this.on) return; const t = this.now(); this._tone(t, 110, 0.4, 0.4, 'sine', 0.5); this._src(t, 0.25, 'lowpass', 900, 200, 0.7, 0.35, 0.005); this._tone(t + 0.35, 1046, 1.4, 0.07); this._tone(t + 0.5, 1568, 1.6, 0.06); this._tone(t + 0.7, 2093, 1.8, 0.05); }
  error() { if (!this.on) return; const t = this.now(); this._tone(t, 220, 0.25, 0.1, 'sawtooth', 0.8); }
  clink() { if (!this.on) return; const t = this.now(); this._tone(t, 1800, 0.8, 0.1); this._tone(t, 1800 * 2.7, 0.4, 0.04); }

  /* ---------------------------------------------------------------- أجواء */
  startAmbient() {
    if (!this.on || !this.ctx || this.amb) return;
    const c = this.ctx;
    const mk = (type, freq, q) => { const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true; const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = c.createGain(); g.gain.value = 0; s.connect(f); f.connect(g); g.connect(this.master); s.start(); return { s, f, g }; };
    const wind = mk('bandpass', 380, 0.5), room = mk('lowpass', 180, 0.4);
    const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.11; lg.gain.value = 140; lfo.connect(lg); lg.connect(wind.f.frequency); lfo.start();
    // صراصير: نغمة عالية × نبضات سريعة (26Hz) × مجموعات بطيئة
    const cr = c.createOscillator(), cg = c.createGain(), am = c.createOscillator(), amg = c.createGain();
    cr.type = 'sine'; cr.frequency.value = 4300; am.type = 'square'; am.frequency.value = 26; amg.gain.value = 0.5; cg.gain.value = 0.5; am.connect(amg); amg.connect(cg.gain);
    const gate = c.createGain(); gate.gain.value = 0.5; const l2 = c.createOscillator(), lg2 = c.createGain(); l2.frequency.value = 0.33; lg2.gain.value = 0.5; l2.connect(lg2); lg2.connect(gate.gain);
    const level = c.createGain(); level.gain.value = 0;
    cr.connect(cg); cg.connect(gate); gate.connect(level); level.connect(this.master);
    cr.start(); am.start(); l2.start();
    this.amb = { wind, room, level, lfo, cr, am, l2 };
    this._ambTimer = setInterval(() => this._ambTick(), 700);
    this._ambTick();
  }
  _ambTick() {
    if (!this.on || !this.amb) return;
    const c = this.ctx, t = c.currentTime, n = this.night, day = 1 - n;
    this.amb.wind.g.gain.setTargetAtTime(0.05 * (1 - n * 0.6), t, 0.8);
    this.amb.room.g.gain.setTargetAtTime(0.04, t, 0.8);
    this.amb.level.gain.setTargetAtTime(0.03 * n, t, 0.8);
    if (day > 0.35 && Math.random() < 0.55) this._bird(t + Math.random() * 0.6, day);
  }
  _bird(t0, day) {
    const c = this.ctx, notes = 3 + ((Math.random() * 4) | 0), base = 2600 + Math.random() * 1600;
    for (let i = 0; i < notes; i++) {
      const tt = t0 + i * (0.09 + Math.random() * 0.05), f = base * (1 + (Math.random() - 0.4) * 0.35);
      const o = c.createOscillator(), g = c.createGain(), vib = c.createOscillator(), vg = c.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(f, tt); o.frequency.exponentialRampToValueAtTime(f * (1.15 + Math.random() * 0.3), tt + 0.07);
      vib.frequency.value = 38; vg.gain.value = 70; vib.connect(vg); vg.connect(o.frequency);
      g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(0.028 * day, tt + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, tt + 0.085);
      o.connect(g); g.connect(this.master); o.start(tt); vib.start(tt); o.stop(tt + 0.1); vib.stop(tt + 0.1);
    }
  }
  setNight(n) { this.night = n; }
  stopAmbient() {
    clearInterval(this._ambTimer);
    if (this.amb) { try { this.amb.wind.s.stop(); this.amb.room.s.stop(); this.amb.lfo.stop(); this.amb.cr.stop(); this.amb.am.stop(); this.amb.l2.stop(); } catch (e) { /* */ } this.amb = null; }
  }
}
