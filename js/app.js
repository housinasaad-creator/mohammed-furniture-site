/*
  الواجهة: ثلاث لغات بدون قلب الاتجاه، نصوص الهيرو والساعة، لوحة القطعة وخياراتها الحيّة، أدوات النمط/الضوء/التفكيك/الأبعاد،
  الإضافة للحقيبة بلقطة حقيقية للقطعة بإعدادها، الصوت. المشهد الثلاثي في js/gl، والمتجر في js/store.js.
*/
import { Experience, PRODUCT_ORDER, HERO_HOURS } from './gl/experience.js';
import { sunVec } from './gl/core.js';
import { Sfx } from './gl/sfx.js';
import { WOODS, FABRICS, STONES, STYLES } from './gl/data.js';
import { OPTIONS, unitPrice, configLabel } from './catalog.js';
import { initStore } from './store.js';

const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.prototype.slice.call((r || document).querySelectorAll(s));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
window.__logoSVG = '<svg viewBox="0 0 113 60"><path fill="#cba24f" fill-rule="evenodd" d="M0 60V32.5A32.5 32.5 0 0 1 56.5 10.6A32.5 32.5 0 0 1 113 32.5V60ZM17 60V32.5A15.5 15.5 0 0 1 48 32.5V60ZM65 60V32.5A15.5 15.5 0 0 1 96 32.5V60Z"/></svg>';

/* ---------------------------------------------------------------- اللغة */
const KEY = 'mhf-lang';
let lang = 'en';
{
  const q = new URLSearchParams(location.search).get('lang');
  let saved = null; try { saved = localStorage.getItem(KEY); } catch (e) {}
  const nav = (navigator.language || 'en').toLowerCase();
  lang = q || saved || (nav.startsWith('tr') ? 'tr' : nav.startsWith('ar') ? 'ar' : 'en');
  if (!window.CONTENT[lang]) lang = 'en';
}
const T = () => window.CONTENT[lang];
const num = (n) => (lang === 'ar' ? String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]) : String(n));
const money = (v) => '$' + (lang === 'ar' ? num(Math.round(v).toLocaleString('en-US')).replace(/,/g, '٬') : Math.round(v).toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US'));
const dirAttr = () => (lang === 'ar' ? 'rtl' : 'ltr');
const nameOf = (it) => it[lang] || it.en;
const get = (path) => { let o = T(); for (const k of path.split('.')) { if (o == null) return ''; o = o[k]; } return o == null ? '' : o; };

const UI = { qty: 1, auto: true, ready: false };
const sfx = new Sfx();
let exp = null, store = null;
const thumbs = {};
/* هيرو الفيديو: وقفات اليوم الخمس فيديو مُصوَّر مسبقاً (js/hero-video.js)، والمتجر وحده مشهد حي. HV.on=false يعيد الهيرو الحي القديم كاملاً (احتياط) */
const HV = { on: false, step: 0, pos: 0, expReady: false, noGL: false, home: false };
let hv = null;
const lerp = (a, b, t) => a + (b - a) * t;
const shopTv = () => { const t = clamp(window.scrollY / (innerHeight * 0.9), 0, 1); return t * t * (3 - 2 * t); };
const goHero = (k) => { if (HV.on && hv) hv.jump(k); else if (exp) exp.goStep(k); };
const isLocked = () => document.body.classList.contains('is-loading') || document.body.classList.contains('modal-open') || $('#cart').classList.contains('on');
/* ساعة اليوم من موضع الفيديو: نفس تخفيف اللقطة المصوَّرة (smootherstep ثم smooth) مع ثواني التثبيت في نهاية كل مقطع */
const SEG_S = [4.2, 4.2, 4.2, 4.0], HOLD_S = [1.0, 1.0, 1.0, 0.6];
const q5 = (x) => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };
const smo = (t) => t * t * (3 - 2 * t);
const hourOfPos = (pos) => { const seg = clamp(Math.floor(pos), 0, 3), u = clamp(pos - seg, 0, 1), eff = clamp(u * SEG_S[seg] / (SEG_S[seg] - HOLD_S[seg]), 0, 1); return lerp(HERO_HOURS[seg], HERO_HOURS[seg + 1], smo(q5(eff))); };
const nightOf = (h) => { const y = sunVec(h).y, t = clamp((y + 0.1) / 0.35, 0, 1); return 1 - t * t * (3 - 2 * t); };

/* ---------------------------------------------------------------- لون التمييز يتبع النمط */
function setAccent(hex) {
  const root = document.documentElement; root.style.setProperty('--accent', hex);
  const n = parseInt(hex.slice(1), 16); root.style.setProperty('--accent-rgb', `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`);
}

/* ---------------------------------------------------------------- خامات الأقمشة للمعاينة (CSS) */
function swTex(key, item) {
  if (key === 'wood') return 'repeating-linear-gradient(98deg, rgba(0,0,0,.22) 0 1px, transparent 1px 5px), repeating-linear-gradient(92deg, rgba(255,255,255,.12) 0 2px, transparent 2px 9px)';
  if (key === 'stone') return 'linear-gradient(118deg, transparent 36%, rgba(120,120,120,.55) 37% 38%, transparent 39%), linear-gradient(62deg, transparent 58%, rgba(120,120,120,.4) 59% 60%, transparent 61%)';
  const k = item.kind;
  if (k === 'boucle') return 'radial-gradient(circle at 30% 30%, rgba(0,0,0,.28) 0 1.2px, transparent 1.6px) 0 0 / 5px 5px, radial-gradient(circle at 70% 70%, rgba(255,255,255,.35) 0 1px, transparent 1.4px) 0 0 / 4px 4px';
  if (k === 'linen') return 'repeating-linear-gradient(0deg, rgba(0,0,0,.14) 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,.12) 0 1px, transparent 1px 3px)';
  if (k === 'leather') return 'radial-gradient(circle, rgba(0,0,0,.28) 0 1px, transparent 1.4px) 0 0 / 4px 4px';
  return 'linear-gradient(135deg, rgba(255,255,255,.3), transparent 45%, rgba(0,0,0,.25))';
}

/* ---------------------------------------------------------------- نصوص ثابتة */
function renderStatic() {
  const t = T();
  document.documentElement.lang = t.lang; document.documentElement.dir = 'ltr'; document.title = t.title;
  $$('[data-i]').forEach((el) => { el.textContent = get(el.getAttribute('data-i')); el.setAttribute('dir', dirAttr()); });
  $('#mailIn').placeholder = t.contact.ph; $('#mailIn').setAttribute('dir', dirAttr());
  $$('#langs button').forEach((b) => b.classList.toggle('on', b.dataset.l === lang));
  $('#chapters').innerHTML = t.chapters.map((c, i) => {
    const dd = ` dir="${dirAttr()}"`;
    return `<article class="chap${i === 0 ? ' brand' : ''}"><p class="k"${dd}>${esc(c.k)}</p><h2${dd}>${esc(c.t)}</h2><p class="s"${dd}>${esc(c.s)}</p>${c.cta ? `<a class="go" href="#collection"${dd}>${esc(c.cta)}</a>` : ''}</article>`;
  }).join('');
  $('#dots').innerHTML = t.dots.map((d, i) => `<button type="button" data-i-dot="${i}" aria-label="${esc(d)}"><span dir="${dirAttr()}">${esc(d)}</span></button>`).join('');
  $$('#dots button').forEach((b) => b.addEventListener('click', () => goHero(+b.getAttribute('data-i-dot'))));
  const go = $('.go', $('#chapters')); go && go.addEventListener('click', (e) => { e.preventDefault(); scrollToShop(); });
  // الكاروسيل
  $('#carousel').innerHTML = PRODUCT_ORDER.map((id) => `<button type="button" class="cc${exp && exp.sel === id ? ' on' : ''}" data-id="${id}" aria-label="${esc(t.products[id].name)}"><div class="th" style="background-image:url('${thumbs[id] || ''}')"></div><span dir="${dirAttr()}">${esc(t.products[id].name)}</span></button>`).join('');
  $$('#carousel .cc').forEach((b) => b.addEventListener('click', () => { UI.auto = false; sfx.clink(); exp && exp.select(b.dataset.id); }));
  // أنماط
  $('#styles').innerHTML = STYLES.map((s, i) => `<button type="button" class="st${exp && exp.styleIndex === i ? ' on' : ''}" data-i="${i}"><i>${s.walls.slice(0, 3).map((c) => `<s style="background:${c}"></s>`).join('')}</i><span dir="${dirAttr()}">${esc(nameOf(s))}</span></button>`).join('');
  $$('#styles .st').forEach((b) => b.addEventListener('click', () => { UI.auto = false; const i = +b.dataset.i; exp && exp.setStyle(i); setAccent(STYLES[i].accent); $$('#styles .st').forEach((x, k) => x.classList.toggle('on', k === i)); setTimeout(() => fillPanel(false), 120); }));
  // الصنعة
  const ICONS = [
    '<svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="30" pathLength="1"/><circle cx="42" cy="42" r="21" pathLength="1"/><circle cx="42" cy="42" r="12" pathLength="1"/><circle cx="42" cy="42" r="4" pathLength="1"/><path d="M12 42h-6M78 42h6" pathLength="1"/></svg>',
    '<svg viewBox="0 0 84 84"><path d="M16 74V40a26 26 0 0 1 52 0v34" pathLength="1"/><path d="M30 74V42a12 12 0 0 1 24 0v32" pathLength="1"/><path d="M8 74h68" pathLength="1"/></svg>',
    '<svg viewBox="0 0 84 84"><path d="M14 58c14-22 28 22 42 0s14-12 14-12" pathLength="1"/><path d="M14 40c14-22 28 22 42 0s14-12 14-12" pathLength="1"/><path d="M60 14l10 10-26 30-8-2-2-8z" pathLength="1"/></svg>',
    '<svg viewBox="0 0 84 84"><circle cx="42" cy="42" r="14" pathLength="1"/><path d="M42 12v10M42 62v10M12 42h10M62 42h10M21 21l7 7M56 56l7 7M63 21l-7 7M28 56l-7 7" pathLength="1"/></svg>'
  ];
  $('#steps').innerHTML = t.craft.steps.map((s, i) => `<li class="step">${ICONS[i]}<b dir="${dirAttr()}">${esc(s.n)}</b><h4 dir="${dirAttr()}">${esc(s.t)}</h4><p dir="${dirAttr()}">${esc(s.d)}</p></li>`).join('');
  // بطاقات العيّنات
  const picks = [FABRICS[0], FABRICS[2], FABRICS[3], FABRICS[4], FABRICS[1], FABRICS[5]];
  $('#swatches').innerHTML = t.voices.items.map((v, i) => { const f = picks[i % picks.length]; return `<article class="swc" style="--r:${[-2.5, 1.8, -1.2, 2.6][i % 4]}deg;--sw:linear-gradient(135deg, ${f.c1}, ${f.c0});--tex:${swTex('fabric', f)}"><div class="sw-top"></div><div class="sw-body"><q dir="${dirAttr()}">${esc(v.q)}</q><cite dir="${dirAttr()}">${esc(v.a)}</cite></div></article>`; }).join('');
  $('#mkGrid').innerHTML = t.makers.pts.map((m, i) => `<article class="mk rv"><b dir="${dirAttr()}">0${i + 1}</b><h4 dir="${dirAttr()}">${esc(m.t)}</h4><p dir="${dirAttr()}">${esc(m.d)}</p></article>`).join('');
  const cta = $('#mkCta'); if (window.CONTACT_URL) { cta.href = window.CONTACT_URL; cta.hidden = false; } else cta.hidden = true;
  $('#soundBtn').setAttribute('aria-label', sfx.on ? t.soundOn : t.soundOff);
  $('#mail').dataset.thanks = t.contact.thanks;
  fillPanel(false);
  if (store) store.rerender();
  updateHero();
  observeReveal();
}

/* ---------------------------------------------------------------- لوحة القطعة */
const valOf = (p, def) => (def.where === 'opts' ? p.opts[def.key] : p.sel[def.key]);
function fillPanel(animate) {
  if (!exp) return;
  const id = exp.sel, p = exp.product(), t = T(), d = dirAttr(), P = t.products[id], inner = $('#panelIn');
  const apply = () => {
    $('#pTag').textContent = P.tag; $('#pName').textContent = P.name; $('#pDesc').textContent = P.d;
    ['#pTag', '#pName', '#pDesc'].forEach((q) => $(q).setAttribute('dir', d));
    const O = t.shop.options;
    $('#pOpts').innerHTML = OPTIONS[id].filter((def) => !def.showIf || def.showIf(p)).map((def) => {
      const v = valOf(p, def), lbl = O[def.label || def.key] || def.key;
      if (def.type === 'chips') {
        const cur = O.fmt[def.fmt](v);
        return `<div class="og" data-k="${def.key}"><div class="og-h"><span class="og-l" dir="${d}">${esc(lbl)}</span><span class="og-v" dir="${d}">${esc(cur)}</span></div><div class="chips">${def.values.map((x) => `<button type="button" class="chip${x === v ? ' on' : ''}" data-v="${esc(x)}">${esc(O.fmt[def.fmt](x))}</button>`).join('')}</div></div>`;
      }
      const cur = def.list.find((x) => x.id === v) || def.list[0];
      return `<div class="og" data-k="${def.key}"><div class="og-h"><span class="og-l" dir="${d}">${esc(lbl)}</span><span class="og-v" dir="${d}">${esc(nameOf(cur))}</span></div><div class="sws">${def.list.map((x) => `<button type="button" class="sw${x.id === v ? ' on' : ''}" data-v="${x.id}" title="${esc(nameOf(x))}" aria-label="${esc(nameOf(x))}" style="background:linear-gradient(135deg, ${x.c1 || x.sw}, ${x.c0 || x.sw});--tex:${swTex(def.key === 'fabric' ? 'fabric' : def.key === 'stone' ? 'stone' : 'wood', x)}"></button>`).join('')}</div></div>`;
    }).join('');
    $$('#pOpts .og').forEach((g) => {
      const key = g.dataset.k, def = OPTIONS[id].find((x) => x.key === key);
      $$('[data-v]', g).forEach((b) => b.addEventListener('click', () => {
        UI.auto = false;
        let v = b.dataset.v; if (def.type === 'chips') v = typeof def.values[0] === 'number' ? Number(v) : v;
        exp.setOption(key, v); fillPanel(false);
        if (id === 'dchair' || id === 'table') syncChairQty();
      }));
    });
    refreshPrice();
    $('#qVal').textContent = num(UI.qty);
    const btn = $('#addBtn'); btn.classList.remove('added'); $('#addTxt').textContent = t.shop.add;
    $$('#carousel .cc').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    inner.classList.remove('swap');
  };
  if (!animate || reduce) { apply(); return; }
  inner.classList.add('swap'); setTimeout(apply, 240);
}
function syncChairQty() { if (exp.sel === 'dchair') { UI.qty = exp.gal.dchair.opts.count; $('#qVal').textContent = num(UI.qty); refreshPrice(); } }
function refreshPrice() {
  const id = exp.sel, p = exp.product(), u = unitPrice(id, p);
  $('#pPrice').textContent = money(u * UI.qty);
  $('#pEach').textContent = UI.qty > 1 ? `${money(u)} × ${num(UI.qty)}` : '';
}
$('#qMinus').addEventListener('click', () => { UI.qty = clamp(UI.qty - 1, 1, 20); $('#qVal').textContent = num(UI.qty); refreshPrice(); sfx.tick(); });
$('#qPlus').addEventListener('click', () => { UI.qty = clamp(UI.qty + 1, 1, 20); $('#qVal').textContent = num(UI.qty); refreshPrice(); sfx.tick(); });

/* ---------------------------------------------------------------- الإضافة للحقيبة (طيران بلقطة حقيقية) */
function flyToBag(thumb, from, done) {
  const layer = $('#flyLayer'), bag = $('#bag').getBoundingClientRect();
  if (reduce) { done(); return; }
  const a = from, b = { x: bag.left + bag.width / 2, y: bag.top + bag.height / 2 };
  const c = { x: (a.x + b.x) / 2 + (a.x < b.x ? 80 : -80), y: Math.min(a.y, b.y) - 150 };
  const el = document.createElement('div'); el.className = 'fly'; el.innerHTML = `<img src="${thumb}" alt="">`; layer.appendChild(el);
  const frames = [], N = 28;
  for (let k = 0; k <= N; k++) {
    const u = k / N, e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
    const x = (1 - e) * (1 - e) * a.x + 2 * (1 - e) * e * c.x + e * e * b.x, y = (1 - e) * (1 - e) * a.y + 2 * (1 - e) * e * c.y + e * e * b.y;
    frames.push({ transform: `translate(${x}px, ${y}px) scale(${1 - 0.78 * e}) rotate(${e * 200}deg)`, opacity: u > 0.92 ? 1 - (u - 0.92) / 0.08 : 1, offset: u });
  }
  const anim = el.animate(frames, { duration: 950, easing: 'linear', fill: 'forwards' });
  anim.onfinish = () => { el.remove(); done(); };
}
$('#addBtn').addEventListener('click', () => {
  const btn = $('#addBtn'); if (btn.disabled) return;
  btn.disabled = true; sfx.clink();
  const id = exp.sel, p = exp.product(), P = T().products[id];
  const thumb = exp.snapshot(id, 220), from = exp.flyPoint(id), qty = UI.qty;
  flyToBag(thumb, from, () => {
    store.add({ id, qty, opts: Object.assign({}, p.opts), sel: Object.assign({}, p.sel), thumb });
    sfx.add(); btn.disabled = false; btn.classList.add('added'); $('#addTxt').textContent = T().shop.added + ' ✓';
    toast(`${P.name} · ${T().shop.added}`);
    setTimeout(() => { if (btn.classList.contains('added')) { btn.classList.remove('added'); $('#addTxt').textContent = T().shop.add; } }, 2200);
  });
});

/* ---------------------------------------------------------------- toast */
let toastT = 0;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.setAttribute('dir', dirAttr()); t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); }

/* ---------------------------------------------------------------- الهيرو */
const fmtHour = (h) => { const hh = Math.floor(h) % 24, mm = Math.floor((h - Math.floor(h)) * 60); return num(String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0')); };
function updateHero() {
  if (!HV.on && !exp) return;
  const step = HV.on ? HV.step : exp.step, pos = HV.on ? HV.pos : exp.pos, st = exp ? exp.shopT : shopTv();
  $$('#chapters .chap').forEach((c, i) => c.classList.toggle('on', i === step && Math.abs(pos - i) < 0.25 && st < 0.4));
  $$('#dots button').forEach((b, i) => { b.classList.toggle('on', i === step); b.setAttribute('aria-current', i === step ? 'true' : 'false'); });
  $('#progressBar').style.width = (pos / 4 * 100).toFixed(1) + '%';
  $('#cue').classList.toggle('hide', step > 0 || pos > 0.04 || st > 0.05);
  const h = HV.on && st < 0.02 ? hourOfPos(pos) : exp ? exp.hourNow : hourOfPos(pos);
  $('#clockT').textContent = fmtHour(h);
  const th = clamp((h - 5) / 15, 0, 1) * Math.PI, sun = $('#clockSun');
  sun.setAttribute('cx', (100 - 90 * Math.cos(th)).toFixed(1)); sun.setAttribute('cy', (100 - 90 * Math.sin(th)).toFixed(1));
  sun.setAttribute('fill', h < 5 || h > 20 ? '#bcc8ff' : h > 17 || h < 7 ? '#ffb070' : '#fff4d6');
  $('#clock').style.opacity = String(clamp(1 - st * 1.6, 0, 1));
}
/* الفيديو يختفي حين يصير الكانفس الحي جاهزاً وننزل عن القمة (حالة المشهد الحي الابتدائية = نهاية الفيديو)؛ وهو مخفي نقفز به صامتاً إلى الأخيرة كي يتطابق عند العودة */
function syncVideoStage() {
  if (!HV.on) return;
  const scrolled = window.scrollY > 2;
  if (!exp) document.documentElement.style.setProperty('--st', shopTv().toFixed(3));
  updateHero();
  const off = scrolled && (HV.expReady || HV.noGL);
  $('#hvStage').classList.toggle('off', off);
  if (off && hv) { const want = HV.home ? 0 : 4; if (hv.stage !== want) hv.snap(want); } else if (!scrolled) HV.home = false;
  if (hv) { if (window.scrollY > innerHeight * 2.5) hv.unload(); else if (window.scrollY < innerHeight * 1.5) hv.load(); }   // الفيديو يُفرَّغ من الذاكرة حين نبتعد عن الهيرو ويعود قبل الوصول للقمة
}
window.addEventListener('scroll', () => syncVideoStage(), { passive: true });
function scrollToShop() { sfx.whoosh(); document.getElementById('collection').scrollIntoView({ behavior: 'smooth' }); }

/* ---------------------------------------------------------------- أدوات المتجر */
function closePops(except) { $$('.tool.open').forEach((t) => { if (t !== except) t.classList.remove('open'); }); }
$$('.tool > .tool-b').forEach((b) => b.addEventListener('click', (e) => { e.stopPropagation(); const t = b.parentElement; const was = t.classList.contains('open'); closePops(); t.classList.toggle('open', !was); sfx.tick(); }));
document.addEventListener('click', (e) => { if (!e.target.closest('.tool')) closePops(); });
$('#hourR').addEventListener('input', (e) => { const v = +e.target.value; UI.auto = false; exp && exp.setHour(v); $('#hourT').textContent = fmtHour(v); });
$('#anatomyBtn').addEventListener('click', () => { const on = $('#anatomyBtn').getAttribute('aria-pressed') !== 'true'; $('#anatomyBtn').setAttribute('aria-pressed', on); exp.setAnatomy(on); if (on) { $('#dimsBtn').setAttribute('aria-pressed', 'false'); exp.setDims(false); } sfx.whoosh(); });
$('#dimsBtn').addEventListener('click', () => { const on = $('#dimsBtn').getAttribute('aria-pressed') !== 'true'; $('#dimsBtn').setAttribute('aria-pressed', on); exp.setDims(on); if (on) { $('#anatomyBtn').setAttribute('aria-pressed', 'false'); exp.setAnatomy(false); } sfx.tick(); });

/* مسمّيات التشريح */
const labelEls = new Map();
function onLabels(list, amt) {
  const box = $('#labels');
  const keys = new Set(list.map((l) => l.label));
  for (const [k, el] of labelEls) if (!keys.has(k)) { el.remove(); labelEls.delete(k); }
  for (const l of list) {
    let el = labelEls.get(l.label);
    if (!el) { el = document.createElement('div'); el.className = 'lab'; el.innerHTML = `<i></i><span dir="${dirAttr()}">${esc(T().shop.parts[l.label] || l.label)}</span>`; box.appendChild(el); labelEls.set(l.label, el); requestAnimationFrame(() => el.classList.add('on')); }
    el.style.transform = `translate(${l.x.toFixed(1)}px, ${l.y.toFixed(1)}px)`;
    el.querySelector('span').textContent = T().shop.parts[l.label] || l.label;
  }
}
/* أبعاد */
function onDims(d) {
  const svg = $('#dims');
  if (!d) { svg.classList.remove('on'); return; }
  svg.classList.add('on');
  const L = T().shop.dimsLabel;
  const one = (m, i) => {
    const a = m.a, b = m.b, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    return `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}"/><circle cx="${a.x.toFixed(1)}" cy="${a.y.toFixed(1)}" r="4"/><circle cx="${b.x.toFixed(1)}" cy="${b.y.toFixed(1)}" r="4"/><text x="${mx.toFixed(1)}" y="${(my - 10).toFixed(1)}">${esc(L[i])} ${num(m.v)} ${lang === 'ar' ? 'سم' : 'cm'}</text>`;
  };
  svg.innerHTML = one(d.w, 0) + one(d.d, 1) + one(d.h, 2);
}

/* ---------------------------------------------------------------- لغة + صوت + رأس */
$$('#langs button').forEach((b) => b.addEventListener('click', () => {
  if (b.dataset.l === lang) return;
  lang = b.dataset.l; try { localStorage.setItem(KEY, lang); } catch (e) {}
  renderStatic(); $('#hourT').textContent = fmtHour(exp ? exp.shopHour : 11);
}));
function toggleSound() {
  const on = sfx.toggle();
  $('#soundBtn').setAttribute('aria-pressed', on ? 'true' : 'false'); $('#soundBtn').setAttribute('aria-label', on ? T().soundOn : T().soundOff);
  $('#soundTip').classList.add('hide');
}
$('#soundBtn').addEventListener('click', toggleSound);
$('#soundTip').addEventListener('click', toggleSound);
const hdr = $('#hdr');
window.addEventListener('scroll', () => hdr.classList.toggle('solid', window.scrollY > 40), { passive: true });
$$('#nav a, .logo').forEach((a) => a.addEventListener('click', (e) => {
  const h = a.getAttribute('href');
  if (h === '#top') { e.preventDefault(); if (HV.on) { if (window.scrollY > 2) HV.home = true; else goHero(0); } else exp && exp.goStep(0, window.scrollY > innerHeight * 0.6); window.scrollTo({ top: 0, behavior: 'smooth' }); }
}));
$('#mail').addEventListener('submit', (e) => { e.preventDefault(); toast(T().contact.thanks); e.target.reset(); });

/* ظهور تدريجي عند التمرير */
let io = null;
function observeReveal() {
  if (!('IntersectionObserver' in window)) { $$('.rv, .step').forEach((e) => e.classList.add('in')); return; }
  if (!io) io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.2 });
  $$('.rv:not(.in), .step:not(.in)').forEach((e) => io.observe(e));
}
/* سحب أفقي لبطاقات العيّنات بالماوس */
{ const sc = $('#swatches'); let d = null; sc.addEventListener('pointerdown', (e) => { if (e.pointerType === 'mouse') d = { x: e.clientX, l: sc.scrollLeft }; }); window.addEventListener('pointermove', (e) => { if (d) { sc.scrollLeft = d.l - (e.clientX - d.x); } }); window.addEventListener('pointerup', () => { d = null; }); }

/* ---------------------------------------------------------------- تشغيل */
const expOpts = (videoHero) => ({
  canvas: $('#gl'), heroEl: $('#hero'), shopEl: $('#collection'),
  locked: () => document.body.classList.contains('modal-open') || $('#cart').classList.contains('on'),
  sfx, videoHero,
  onStep: () => updateHero(),
  onFrame: () => { updateHero(); const n = exp.world.tod.night || 0; if (Math.abs(n - (UI.night || 0)) > 0.02) { UI.night = n; sfx.setNight(n); } },
  onSelect: () => { UI.qty = exp.sel === 'dchair' ? exp.gal.dchair.opts.count : 1; fillPanel(UI.ready); UI.ready = true; },
  onHover: (kind) => window.dispatchEvent(new CustomEvent('mhf-cursor', { detail: kind ? T().shop.cur[kind] || null : null })),
  onShopT: (st) => {
    document.documentElement.style.setProperty('--st', st.toFixed(3));
    if (st > 0.45 && UI.auto && exp.sel !== autoPick()) exp.select(autoPick());
  },
  onLabels, onDims
});
/* بعد بناء المتجر الحي: مصغّرات حقيقية من المشهد وقيم اللوحة */
function afterExp() {
  for (const id of PRODUCT_ORDER) thumbs[id] = exp.snapshot(id, 170);
  renderStatic();
  window.__mhf = { exp, store, UI, sfx, thumbs, hv, HV };
  $('#hourR').value = exp.shopHour; $('#hourT').textContent = fmtHour(exp.shopHour);
  setAccent(STYLES[0].accent);
}

async function start() {
  const lbar = $('#loaderBar');
  store = initStore({ T, lang: () => lang, CONTENT: window.CONTENT, money, num, sfx, unitPrice, configLabel });
  renderStatic();
  const showUI = () => { lbar.style.width = '100%'; setTimeout(() => { $('#loader').classList.add('done'); document.body.classList.remove('is-loading'); }, 450); };
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  if (!reduce && !saveData && !/[?&]live3d\b/.test(location.search)) {
    try { await startVideoHero(lbar, showUI); return; } catch (err) { console.warn('Video hero unavailable, using the live 3D hero', err); fallbackToLive(); }
  }
  await startLive3D(lbar, showUI);
}

/* ------------------------------------------------ الهيرو كفيديو (الأساس): وقفات اليوم الخمس فيديو، والمشهد الحي يتولى المتجر */
async function startVideoHero(lbar, showUI) {
  const { initHeroVideo } = await import('./hero-video.js');
  const stage = $('#hvStage'), vid = $('#hv');
  HV.on = true; document.documentElement.classList.add('hv-on');
  let vOk = false, eOk = false, shown = false, fillV = 0, fillE = 0;
  const bar = () => { lbar.style.width = Math.round(((vOk ? 1 : fillV) * 0.5 + fillE * 0.5) * 100) + '%'; };
  const reveal = () => { if (shown) return; shown = true; window.__ready = true; showUI(); };
  const tryShow = () => { if (vOk && eOk) reveal(); };
  hv = initHeroVideo({
    hero: $('#hero'), stick: stage, video: vid, reduced: false, saveData: false, virtual: true,
    stops: [0, 4.2, 8.4, 12.6, 16.6],
    clips: 'assets/hero/', mobileQuery: '(max-width: 860px)', locked: isLocked,
    onGo: () => sfx.whoosh(),
    onPos: (p) => {
      HV.pos = p; HV.step = Math.round(p);
      const n = nightOf(hourOfPos(p)); if (Math.abs(n - (UI.night || 0)) > 0.02) { UI.night = n; sfx.setNight(n); }
      updateHero();
    },
    onReady: () => { vOk = true; bar(); tryShow(); },
    onFail: () => { fallbackToLive(); reveal(); }
  });
  vid.addEventListener('progress', () => { try { const b = vid.buffered; if (b.length && vid.duration) { fillV = Math.min(0.95, b.end(b.length - 1) / vid.duration); bar(); } } catch (e) {} });
  window.__mhf = { exp: null, store, UI, sfx, hv, HV, thumbs };
  hv.load(); updateHero();
  setTimeout(reveal, 9000);
  /* المتجر الحي يُبنى بالتوازي خلف شاشة التحميل كي لا يتقطع الفيديو لاحقاً */
  try {
    exp = new Experience(expOpts(true));
    await exp.init((f) => { fillE = f; bar(); });
    afterExp(); HV.expReady = true; syncVideoStage();
  } catch (err) {
    console.warn('WebGL unavailable, the shop uses the static fallback', err);
    document.documentElement.classList.add('no-gl'); exp = null; HV.noGL = true; syncVideoStage();
  }
  eOk = true; fillE = 1; bar(); tryShow();
}

/* الفيديو فشل بعد البدء: نرجع للهيرو الحي (المشهد الثلاثي الأبعاد محفوظ كاملاً) */
function fallbackToLive() {
  HV.on = false; hv = null; document.documentElement.classList.remove('hv-on');
  const st = $('#hvStage'); st && (st.hidden = true);
  if (exp) { exp.o.videoHero = false; exp.vOn = true; exp.applyRun(); exp.goStep(0, true); setTimeout(() => exp.intro(), 300); }
  updateHero();
}

/* ------------------------------------------------ الهيرو الحي القديم (محفوظ: ?live3d أو حركة أقل أو توفير بيانات أو فشل الفيديو) */
async function startLive3D(lbar, showUI) {
  if (exp) { showUI(); return; }                                  // بُني أصلاً (حالة فشل الفيديو بعد بدء المتجر)
  try {
    exp = new Experience(expOpts(false));
    await exp.init((f) => { lbar.style.width = Math.round(f * 100) + '%'; });
    afterExp();
    showUI();
    setTimeout(() => exp.intro(), 650);
    window.__ready = true;
  } catch (err) {
    console.warn('WebGL unavailable, using the static fallback', err);
    document.documentElement.classList.add('no-gl');
    exp = null; showUI(); window.__ready = true;
    let step = 0; const show = () => { $$('#chapters .chap').forEach((c, i) => c.classList.toggle('on', i === step)); $$('#dots button').forEach((b, i) => b.classList.toggle('on', i === step)); };
    show(); $$('#dots button').forEach((b) => b.addEventListener('click', () => { step = +b.getAttribute('data-i-dot'); show(); }));
  }
}
function autoPick() { const s = HV.on ? HV.step : exp.step; return s <= 1 ? 'sofa' : s === 2 ? 'table' : 'bed'; }
document.fonts && document.fonts.ready ? document.fonts.ready.then(start) : start();
