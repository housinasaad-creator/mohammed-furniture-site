/*
  المتجر: حقيبة (درج) + إتمام شراء بخطوات + دفع تجريبي بالكامل (لا شبكة، لا تخزين لبيانات البطاقة).
  البطاقة تُقبل فقط إذا كانت من بطاقات الاختبار المعروفة حتى لا يكتب أحد بطاقته الحقيقية بالخطأ.
*/
const KEY = 'mhf-bag-v1';
const FREE_AT = 4000, SHIP = 79;
const TEST_CARDS = ['4242424242424242', '5555555555554444', '378282246310005', '4000056655665556', '6011111111111117'];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const $ = (s, r) => (r || document).querySelector(s);

export function initStore(ctx) {
  const T = () => ctx.T();
  const dir = () => (ctx.lang() === 'ar' ? 'rtl' : 'ltr');
  const S = { items: [], promo: '', step: 0, data: {}, order: null, busy: false };
  try { const raw = JSON.parse(localStorage.getItem(KEY) || 'null'); if (raw && Array.isArray(raw.items)) { S.items = raw.items.filter((i) => i && i.id && i.qty > 0 && i.opts && i.sel).slice(0, 30); S.promo = raw.promo || ''; } } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify({ items: S.items, promo: S.promo })); } catch (e) {} };

  const prod = (id) => ctx.CONTENT[ctx.lang()].products[id] || ctx.CONTENT.en.products[id];
  const cfgOf = (it) => ({ opts: it.opts || {}, sel: it.sel || {} });
  const unit = (it) => ctx.unitPrice(it.id, cfgOf(it));
  const label = (it) => ctx.configLabel(it.id, cfgOf(it), ctx.lang());
  const count = () => S.items.reduce((a, i) => a + i.qty, 0);
  function totals() {
    const sub = S.items.reduce((a, i) => a + unit(i) * i.qty, 0);
    const disc = S.promo === 'ARCH10' ? Math.round(sub * 0.1) : 0;
    const ship = sub === 0 ? 0 : (sub >= FREE_AT ? 0 : SHIP);
    return { sub, disc, ship, total: sub - disc + ship };
  }

  /* ---------------------------------------------------------------- حقيبة */
  const cart = $('#cart'), scrim = $('#cartScrim');
  function openCart() { const tt = document.getElementById('toast'); tt && tt.classList.remove('on'); renderCart(); cart.classList.add('on'); scrim.classList.add('on'); cart.setAttribute('aria-hidden', 'false'); ctx.sfx && ctx.sfx.tick(); }
  function closeCart() { cart.classList.remove('on'); scrim.classList.remove('on'); cart.setAttribute('aria-hidden', 'true'); }
  function keyOf(it) { return it.id + '|' + JSON.stringify(it.opts) + '|' + JSON.stringify(it.sel); }
  function add(item) {
    const it = { id: item.id, qty: item.qty, opts: JSON.parse(JSON.stringify(item.opts)), sel: JSON.parse(JSON.stringify(item.sel)), thumb: item.thumb };
    const hit = S.items.find((i) => keyOf(i) === keyOf(it));
    if (hit) { hit.qty = Math.min(20, hit.qty + it.qty); hit.thumb = it.thumb || hit.thumb; } else S.items.push(it);
    save(); badge(true);
    if (cart.classList.contains('on')) renderCart();
  }
  function setQty(k, q) { const it = S.items.find((i) => keyOf(i) === k); if (!it) return; it.qty = Math.max(0, Math.min(20, q)); if (it.qty === 0) S.items = S.items.filter((i) => i !== it); save(); badge(); renderCart(); if ($('#checkout').classList.contains('on')) renderSide(); }
  function badge(pop) {
    const c = $('#bagCount'), n = count();
    c.textContent = ctx.lang() === 'ar' ? Number(n).toLocaleString('ar-EG', { useGrouping: false }) : n; c.classList.toggle('on', n > 0);
    if (pop) { const b = $('#bag'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  }
  function lineHTML(it, compact) {
    const p = prod(it.id), d = dir();
    const price = ctx.money(unit(it) * it.qty);
    const img = it.thumb ? `<img src="${esc(it.thumb)}" alt="">` : '';
    if (compact) return `<div class="si"><div class="ci-img">${img}</div><div><h4 dir="${d}">${esc(p.name)}</h4><small dir="${d}">${esc(label(it))} · ×${ctx.num(it.qty)}</small></div><b>${price}</b></div>`;
    return `<div class="ci" data-k="${esc(keyOf(it))}"><div class="ci-img">${img}</div>
      <div><h4 dir="${d}">${esc(p.name)}</h4><small dir="${d}">${esc(label(it))}</small>
      <div class="ci-q"><button type="button" data-q="-1" aria-label="-">−</button><b>${ctx.num(it.qty)}</b><button type="button" data-q="1" aria-label="+">+</button></div></div>
      <div class="ci-r"><b>${price}</b><button type="button" class="ci-rm" data-rm="1">${esc(T().cart.remove)}</button></div></div>`;
  }
  function renderCart() {
    const t = T(), c = t.cart, d = dir();
    $('#cartTitle').textContent = c.title; $('#cartTitle').setAttribute('dir', d);
    const body = $('#cartBody'), foot = $('#cartFoot');
    if (!S.items.length) {
      body.innerHTML = `<div class="cart-empty"><h4 dir="${d}">${esc(c.empty)}</h4><p dir="${d}">${esc(c.emptySub)}</p><button class="btn" type="button" id="cartBrowse">${esc(c.browse)}</button></div>`;
      foot.style.display = 'none';
      $('#cartBrowse').onclick = () => { closeCart(); document.getElementById('collection').scrollIntoView({ behavior: 'smooth' }); };
      return;
    }
    foot.style.display = '';
    body.innerHTML = S.items.map((i) => lineHTML(i)).join('');
    body.querySelectorAll('.ci').forEach((row) => {
      const k = row.getAttribute('data-k'), it = S.items.find((i) => keyOf(i) === k);
      row.querySelectorAll('[data-q]').forEach((b) => b.onclick = () => { setQty(k, it.qty + Number(b.getAttribute('data-q'))); ctx.sfx && ctx.sfx.tick(); });
      row.querySelector('[data-rm]').onclick = () => setQty(k, 0);
    });
    const tt = totals(), left = Math.max(0, FREE_AT - tt.sub);
    foot.innerHTML = `
      <div class="free-bar" dir="${d}">${left > 0 ? `<span>${esc(ctx.money(left))} ${esc(c.more)}</span>` : `<span>✓ ${esc(c.freeAt)}</span>`}<i><s style="width:${Math.min(100, tt.sub / FREE_AT * 100)}%"></s></i></div>
      <div class="promo"><input class="field" id="promoIn" type="text" dir="ltr" placeholder="${esc(c.promo)}" value="${esc(S.promo)}" autocomplete="off"><button type="button" id="promoBtn">${esc(c.apply)}</button></div>
      <p class="promo-msg ${S.promo === 'ARCH10' ? 'ok' : ''}" id="promoMsg" dir="${d}">${S.promo === 'ARCH10' ? esc(c.promoOk) : ''}</p>
      <div class="tr"><span dir="${d}">${esc(c.subtotal)}</span><span>${ctx.money(tt.sub)}</span></div>
      ${tt.disc ? `<div class="tr"><span dir="${d}">${esc(c.discount)}</span><span>−${ctx.money(tt.disc)}</span></div>` : ''}
      <div class="tr"><span dir="${d}">${esc(c.shipping)}</span><span>${tt.ship ? ctx.money(tt.ship) : esc(c.free)}</span></div>
      <div class="tr total"><span dir="${d}">${esc(c.total)}</span><b>${ctx.money(tt.total)}</b></div>
      <button class="btn" type="button" id="goCheckout">${esc(c.checkout)}</button>
      <p class="tax" dir="${d}">${esc(c.taxes)}</p>`;
    $('#promoBtn').onclick = () => {
      const v = $('#promoIn').value.trim().toUpperCase();
      if (v === 'ARCH10') { S.promo = 'ARCH10'; save(); renderCart(); ctx.sfx && ctx.sfx.add(); }
      else { S.promo = ''; save(); renderCart(); const m = $('#promoMsg'); m.className = 'promo-msg bad'; m.textContent = v ? c.promoBad : ''; ctx.sfx && ctx.sfx.error(); }
    };
    $('#promoIn').onkeydown = (e) => { if (e.key === 'Enter') $('#promoBtn').click(); };
    $('#goCheckout').onclick = () => { closeCart(); openCheckout(); };
  }
  $('#bag').addEventListener('click', openCart);
  $('#cartClose').addEventListener('click', closeCart);
  scrim.addEventListener('click', closeCart);

  /* ---------------------------------------------------------------- إتمام الشراء */
  const modal = $('#checkout');
  function openCheckout() {
    if (!S.items.length) return;
    S.step = 0; S.order = null; S.busy = false;
    modal.classList.add('on'); modal.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open');
    renderCheckout();
  }
  function closeCheckout() { modal.classList.remove('on'); modal.setAttribute('aria-hidden', 'true'); document.body.classList.remove('modal-open'); stopConfetti(); }
  $('#coClose').addEventListener('click', closeCheckout);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (modal.classList.contains('on')) closeCheckout(); else closeCart(); } });

  function renderSide() {
    const c = T().checkout, tt = totals(), d = dir(), cc = T().cart;
    if (S.order) { const o = S.order; $('#coSide').innerHTML = `<p class="sum-h" dir="${d}">${esc(c.summary)}</p>${o.items.map((i) => lineHTML(i, true)).join('')}
      <div class="tr"><span dir="${d}">${esc(cc.subtotal)}</span><span>${ctx.money(o.t.sub)}</span></div>${o.t.disc ? `<div class="tr"><span dir="${d}">${esc(cc.discount)}</span><span>−${ctx.money(o.t.disc)}</span></div>` : ''}
      <div class="tr"><span dir="${d}">${esc(cc.shipping)}</span><span>${o.t.ship ? ctx.money(o.t.ship) : esc(cc.free)}</span></div><div class="tr total"><span dir="${d}">${esc(cc.total)}</span><b>${ctx.money(o.t.total)}</b></div>`; return; }
    $('#coSide').innerHTML = `<p class="sum-h" dir="${d}">${esc(c.summary)}</p>${S.items.map((i) => lineHTML(i, true)).join('')}
      <div class="tr"><span dir="${d}">${esc(cc.subtotal)}</span><span>${ctx.money(tt.sub)}</span></div>${tt.disc ? `<div class="tr"><span dir="${d}">${esc(cc.discount)}</span><span>−${ctx.money(tt.disc)}</span></div>` : ''}
      <div class="tr"><span dir="${d}">${esc(cc.shipping)}</span><span>${tt.ship ? ctx.money(tt.ship) : esc(cc.free)}</span></div><div class="tr total"><span dir="${d}">${esc(cc.total)}</span><b>${ctx.money(tt.total)}</b></div>
      <p class="tax" dir="${d}">${esc(cc.taxes)}</p>`;
  }
  function renderSteps() {
    const c = T().checkout;
    $('#coSteps').innerHTML = c.steps.map((s, i) => `<li data-n="${i + 1}" class="${i === S.step ? 'on' : i < S.step ? 'done' : ''}"><span dir="${dir()}">${esc(s)}</span></li>`).join('');
    $('#coDemo').textContent = c.demo; $('#coDemo').setAttribute('dir', dir());
  }
  function renderCheckout() { renderSteps(); renderSide(); [stepDetails, stepPay, null][S.step] && [stepDetails, stepPay][S.step](); }

  const fieldHTML = (id, label, type, extra = '', full = false) => `<label class="fl ${full ? 'full' : ''}"><span dir="${dir()}">${esc(label)}</span><input class="field" id="f_${id}" name="${id}" type="${type}" ${extra} autocomplete="off"><em id="e_${id}"></em></label>`;
  function stepDetails() {
    const c = T().checkout, d = dir(), D = S.data;
    $('#coPane').innerHTML = `<h3 dir="${d}">${esc(c.contact)}</h3>
      <button type="button" class="fill-demo" id="fillDemo">${esc(c.fillDemo)}</button>
      <div class="grid2">
        ${fieldHTML('email', c.email, 'email', 'dir="ltr" inputmode="email"')}
        ${fieldHTML('phone', c.phone, 'tel', 'dir="ltr" inputmode="tel"')}
        ${fieldHTML('name', c.name, 'text', `dir="${d}"`, true)}
      </div>
      <h3 dir="${d}" style="margin-top:14px">${esc(c.delivery)}</h3>
      <div class="grid2">
        ${fieldHTML('address', c.address, 'text', `dir="${d}"`, true)}
        ${fieldHTML('city', c.city, 'text', `dir="${d}"`)}
        ${fieldHTML('zip', c.zip, 'text', 'dir="ltr"')}
        <label class="fl"><span dir="${d}">${esc(c.country)}</span><select class="field" id="f_country">${c.countries.map((n, i) => `<option value="${i}">${esc(n)}</option>`).join('')}</select><em></em></label>
        ${fieldHTML('gift', c.gift, 'text', `dir="${d}" maxlength="90"`)}
      </div>
      <div class="co-actions"><button class="btn" type="button" id="toPay">${esc(c.toPay)}</button></div>`;
    ['email', 'name', 'phone', 'address', 'city', 'zip', 'gift'].forEach((k) => { const el = $('#f_' + k); el.value = D[k] || ''; el.oninput = () => { D[k] = el.value; el.classList.remove('bad'); $('#e_' + k).textContent = ''; }; });
    $('#f_country').value = D.country || 0; $('#f_country').onchange = (e) => { D.country = e.target.value; };
    $('#fillDemo').onclick = () => {
      Object.assign(D, { email: 'demo@example.com', name: 'Layla Demo', phone: '+49 30 1234567', address: 'Demo Street 12', city: 'Berlin', zip: '10115', gift: '' });
      if (ctx.lang() === 'tr') D.name = 'Leyla Demo';
      if (ctx.lang() === 'ar') D.name = 'ليلى تجريبي';
      stepDetails(); ctx.sfx && ctx.sfx.tick();
    };
    $('#toPay').onclick = () => {
      let ok = true;
      const need = (k, test, msg) => { const v = (D[k] || '').trim(); if (!v || (test && !test(v))) { ok = false; $('#f_' + k).classList.add('bad'); $('#e_' + k).textContent = v ? msg : c.req; } };
      need('email', (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), c.badEmail); need('name'); need('address'); need('city'); need('zip');
      if (!ok) { ctx.sfx && ctx.sfx.error(); return; }
      S.step = 1; renderCheckout();
    };
    setTimeout(() => $('#f_email') && $('#f_email').focus({ preventScroll: true }), 80);
  }

  const digits = (s) => String(s).replace(/\D/g, '');
  const brandOf = (n) => (/^4/.test(n) ? 'VISA' : /^(5[1-5]|2[2-7])/.test(n) ? 'Mastercard' : /^3[47]/.test(n) ? 'AMEX' : /^6/.test(n) ? 'Discover' : '');
  function fmtCard(v) { const n = digits(v).slice(0, 16); if (/^3[47]/.test(n)) { const a = n.slice(0, 15); return [a.slice(0, 4), a.slice(4, 10), a.slice(10)].filter(Boolean).join(' '); } return n.replace(/(.{4})/g, '$1 ').trim(); }
  function stepPay() {
    const c = T().checkout, d = dir(), tt = totals(), D = S.data;
    $('#coPane').innerHTML = `<h3 dir="${d}">${esc(c.payTitle)}</h3>
      <div class="cardwrap"><div class="card3d" id="card3d">
        <div class="cface front"><span class="brand" id="cBrand">&nbsp;</span><div class="chip-i"></div><div class="num" id="cNum" dir="ltr">•••• •••• •••• ••••</div>
          <div class="row"><div><small dir="${d}">${esc(c.holder)}</small><b id="cName" dir="${d}">—</b></div><div><small>MM/YY</small><b id="cExp" dir="ltr">••/••</b></div></div></div>
        <div class="cface back"><div class="mag"></div><div class="sig"><span id="cCvc" dir="ltr">•••</span></div></div>
      </div></div>
      <div class="grid2">
        ${fieldHTML('card', c.cardNo, 'text', 'dir="ltr" inputmode="numeric" maxlength="19" placeholder="4242 4242 4242 4242"', true)}
        ${fieldHTML('holder', c.holder, 'text', `dir="${d}"`, true)}
        ${fieldHTML('exp', c.expiry, 'text', 'dir="ltr" inputmode="numeric" maxlength="5" placeholder="12/29"')}
        ${fieldHTML('cvc', c.cvc, 'text', 'dir="ltr" inputmode="numeric" maxlength="4" placeholder="123"')}
      </div>
      <p class="test-hint" dir="${d}">${esc(c.testHint)} <button type="button" id="useTest">${esc(c.useTest)}</button></p>
      <p class="secure" dir="${d}">🔒 ${esc(c.secure)}</p>
      <div class="co-actions"><button class="btn ghost" type="button" id="backBtn">${esc(c.back)}</button><button class="btn" type="button" id="payBtn">${esc(c.pay)} ${ctx.money(tt.total)}</button></div>`;
    const el = (k) => $('#f_' + k), card3d = $('#card3d');
    const sync = () => {
      const n = digits(el('card').value);
      $('#cNum').textContent = fmtCard(el('card').value) || '•••• •••• •••• ••••';
      $('#cBrand').innerHTML = brandOf(n) || '&nbsp;';
      $('#cName').textContent = el('holder').value || '—'; $('#cExp').textContent = el('exp').value || '••/••'; $('#cCvc').textContent = el('cvc').value || '•••';
    };
    el('card').oninput = () => { el('card').value = fmtCard(el('card').value); el('card').classList.remove('bad'); $('#e_card').textContent = ''; sync(); };
    el('exp').oninput = () => { let v = digits(el('exp').value).slice(0, 4); if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2); el('exp').value = v; el('exp').classList.remove('bad'); $('#e_exp').textContent = ''; sync(); };
    el('cvc').oninput = () => { el('cvc').value = digits(el('cvc').value).slice(0, 4); el('cvc').classList.remove('bad'); $('#e_cvc').textContent = ''; sync(); };
    el('holder').oninput = () => { sync(); };
    el('cvc').onfocus = () => card3d.classList.add('flip'); el('cvc').onblur = () => card3d.classList.remove('flip');
    $('#useTest').onclick = () => { el('card').value = '4242 4242 4242 4242'; el('exp').value = '12/29'; el('cvc').value = '123'; if (!el('holder').value) el('holder').value = (D.name || 'Layla Demo').toUpperCase(); sync(); ctx.sfx && ctx.sfx.tick(); };
    $('#backBtn').onclick = () => { S.step = 0; renderCheckout(); };
    $('#payBtn').onclick = () => {
      if (S.busy) return;
      let ok = true; const n = digits(el('card').value);
      if (!TEST_CARDS.includes(n)) { ok = false; el('card').classList.add('bad'); $('#e_card').textContent = c.badCard; }
      const m = /^(\d{2})\/(\d{2})$/.exec(el('exp').value); const now = new Date();
      if (!m || +m[1] < 1 || +m[1] > 12 || (2000 + +m[2]) * 12 + +m[1] < now.getFullYear() * 12 + now.getMonth() + 1) { ok = false; el('exp').classList.add('bad'); $('#e_exp').textContent = c.badExp; }
      const need = /^3[47]/.test(n) ? 4 : 3; if (el('cvc').value.length !== need) { ok = false; el('cvc').classList.add('bad'); $('#e_cvc').textContent = c.badCvc; }
      if (!el('holder').value.trim()) { ok = false; el('holder').classList.add('bad'); $('#e_holder').textContent = c.req; }
      if (!ok) { ctx.sfx && ctx.sfx.error(); return; }
      pay();
    };
    sync();
    setTimeout(() => el('card').focus({ preventScroll: true }), 80);
  }

  function pay() {
    S.busy = true; const c = T().checkout, d = dir(); ctx.sfx && ctx.sfx.whoosh();
    $('#coPane').innerHTML = `<div class="co-proc"><div class="loader-m">${window.__logoSVG || ''}</div><p dir="${d}">${esc(c.processing)}</p></div>`;
    setTimeout(() => {
      const t = totals();
      const code = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');
      const eta = new Date(Date.now() + 38 * 864e5);
      S.order = { no: 'MHF-' + code, items: S.items.map((i) => ({ ...i })), t, eta: eta.toLocaleDateString(ctx.lang() === 'ar' ? 'ar-EG' : ctx.lang() === 'tr' ? 'tr-TR' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }), name: (S.data.name || '').split(' ')[0] };
      S.items = []; S.promo = ''; save(); badge(); S.step = 2; S.busy = false;
      renderSteps(); renderSide(); stepDone();
      ctx.sfx && ctx.sfx.seal(); confetti();
    }, 1900);
  }
  function stepDone() {
    const c = T().checkout, o = S.order, d = dir();
    $('#coPane').innerHTML = `<div class="co-done">
      <div class="seal"><svg viewBox="0 0 150 150" aria-hidden="true"><circle class="ring" cx="75" cy="75" r="52" fill="none" stroke="rgba(var(--accent-rgb),.7)" stroke-width="2"/>
        <g class="disc"><circle cx="75" cy="75" r="54" fill="#6b2f1c"/><circle cx="75" cy="75" r="54" fill="url(#sealg)"/><circle cx="75" cy="75" r="44" fill="none" stroke="rgba(255,225,170,.55)" stroke-width="1.6"/>
        <path d="M44 98V76a14 14 0 0 1 28 0V98M72 98V76a14 14 0 0 1 28 0V98" fill="none" stroke="#ffe2a8" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>
        <defs><radialGradient id="sealg" cx="35%" cy="30%"><stop offset="0" stop-color="#ff7a5c" stop-opacity=".8"/><stop offset=".6" stop-color="#8c1d12" stop-opacity="0"/><stop offset="1" stop-color="#2b0603" stop-opacity=".7"/></radialGradient></defs></svg></div>
      <h3 dir="${d}">${esc(c.thanks)}${o.name ? ', ' + esc(o.name) : ''}</h3>
      <p dir="${d}">${esc(c.thanksSub)}</p>
      <div class="ordno" dir="ltr">${esc(c.orderNo)} ${esc(o.no)}</div>
      <p dir="${d}">${esc(c.eta)}: <b style="color:var(--cream)">${esc(o.eta)}</b></p>
      <p dir="${d}" style="margin-top:14px;font-size:.78rem;color:var(--dim)">${esc(c.concept)}</p>
      <button class="btn" type="button" id="again">${esc(c.again)}</button></div>`;
    $('#again').onclick = () => { closeCheckout(); };
  }

  /* قصاصات ذهبية/جمر عند نجاح الطلب */
  let cfRaf = 0, cfCv = null;
  function stopConfetti() { cancelAnimationFrame(cfRaf); if (cfCv) { cfCv.remove(); cfCv = null; } }
  function confetti() {
    stopConfetti();
    cfCv = document.createElement('canvas'); cfCv.className = 'confetti'; document.body.appendChild(cfCv);
    const dpr = Math.min(devicePixelRatio || 1, 2), W = cfCv.width = innerWidth * dpr, H = cfCv.height = innerHeight * dpr, g = cfCv.getContext('2d');
    const cols = ['#cba24f', '#e9d6b0', '#c08a6a', '#8fa27a', '#fff3d6', '#3a281c'];
    const P = Array.from({ length: 170 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .25, y: H * .42, vx: (Math.random() - .5) * 1500 * dpr, vy: -(Math.random() * 1100 + 450) * dpr, r: (Math.random() * 6 + 3) * dpr, a: Math.random() * 6.28, va: (Math.random() - .5) * 9, c: cols[(Math.random() * cols.length) | 0], s: Math.random() < .5 }));
    let t0 = performance.now();
    (function loop(now) {
      const dt = Math.min(.04, (now - t0) / 1000); t0 = now;
      g.clearRect(0, 0, W, H);
      let alive = 0;
      P.forEach((p) => { p.vy += 1500 * dpr * dt; p.vx *= Math.pow(.35, dt); p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt; if (p.y < H + 30) alive++;
        g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.c; g.globalAlpha = Math.max(0, 1 - Math.max(0, p.y - H * .6) / (H * .5));
        if (p.s) g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); else { g.beginPath(); g.arc(0, 0, p.r / 2.2, 0, 6.28); g.fill(); } g.restore(); });
      if (alive) cfRaf = requestAnimationFrame(loop); else stopConfetti();
    })(performance.now());
  }

  badge();
  return {
    add, openCart, closeCart, openCheckout, count, totals,
    rerender() { badge(); if (cart.classList.contains('on')) renderCart(); if (modal.classList.contains('on')) { if (S.step === 2) { renderSteps(); renderSide(); stepDone(); } else renderCheckout(); } }
  };
}
