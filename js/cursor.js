/*
  مؤشر الماوس بهوية العلامة: قوس نحاسي صغير (شعار m) يتبع المؤشر + حلقة تلحقه بنعومة + غبار ضوء ينطفئ خلفه.
  الحلقة تتحول إلى كلمة (اسحب / أدِر / اختر / أضف ...) فوق العناصر التفاعلية والقطع.
  يظهر فقط على الأجهزة التي فيها ماوس، وعلى اللمس يبقى المؤشر الطبيعي.
*/
(function () {
  'use strict';
  if (!window.matchMedia || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;
  var DICT = { sound: ['Sound', 'الصوت', 'Ses'], add: ['Add', 'أضف', 'Ekle'] };
  var LANG = { en: 0, ar: 1, tr: 2 };

  var ring = document.createElement('div'); ring.className = 'cur-ring'; ring.innerHTML = '<span></span>';
  var label = ring.firstChild;
  var core = document.createElement('div'); core.className = 'cur-core';
  core.innerHTML = '<svg viewBox="0 0 113 60" aria-hidden="true"><path fill="#f0d38a" fill-rule="evenodd" d="M0 60V32.5A32.5 32.5 0 0 1 56.5 10.6A32.5 32.5 0 0 1 113 32.5V60ZM17 60V32.5A15.5 15.5 0 0 1 48 32.5V60ZM65 60V32.5A15.5 15.5 0 0 1 96 32.5V60Z"/></svg>';
  var fx = document.createElement('canvas'); fx.className = 'cur-fx';
  document.body.appendChild(fx); document.body.appendChild(ring); document.body.appendChild(core);
  var g = fx.getContext('2d');

  var mx = -100, my = -100, rx = -100, ry = -100, seen = false, sparks = [], lastSpawn = 0, W = 0, H = 0, dpr = 1, ext = null;
  function size() { dpr = Math.min(window.devicePixelRatio || 1, 2); W = window.innerWidth; H = window.innerHeight; fx.width = W * dpr; fx.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); }
  size(); window.addEventListener('resize', size);

  var HOT = 'a, button, .cc, .chip, .sw, .st, .tool-b, [role="tab"], label, summary, .dots button, .langs button';
  var TXT = 'input[type=text], input[type=email], input[type=tel], input:not([type]):not([type=range]), textarea';
  function setLabel(txt) { if (txt) { label.textContent = txt; root.classList.add('cur-label'); } else root.classList.remove('cur-label'); }
  function setState(el) {
    var hot = !!(el && el.closest && el.closest(HOT)), txt = !!(el && el.closest && el.closest(TXT));
    root.classList.toggle('cur-hot', hot && !txt);
    root.classList.toggle('cur-txt', txt);
    var dc = el && el.closest && el.closest('[data-cursor]');
    var t = null;
    if (dc && !txt) { var d = DICT[dc.getAttribute('data-cursor')]; if (d) t = d[LANG[document.documentElement.lang] || 0]; }
    setLabel(t || ext);
  }
  window.addEventListener('mhf-cursor', function (e) { ext = e.detail || null; if (!document.querySelector('[data-cursor]:hover')) setLabel(ext); });

  window.addEventListener('pointermove', function (e) {
    if (e.pointerType && e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    if (!seen) { seen = true; rx = mx; ry = my; root.classList.add('cur-on'); }
    core.style.transform = 'translate3d(' + mx + 'px,' + my + 'px,0)';
    setState(e.target);
    var now = performance.now();
    if (!reduce && now - lastSpawn > 38 && sparks.length < 34) {
      lastSpawn = now;
      sparks.push({ x: mx + (Math.random() - .5) * 8, y: my + 4, vx: (Math.random() - .5) * .4, vy: -(.15 + Math.random() * .5), r: 1 + Math.random() * 1.6, life: 1, d: .014 + Math.random() * .016 });
    }
  }, { passive: true });
  document.addEventListener('pointerdown', function () { root.classList.add('cur-down'); });
  document.addEventListener('pointerup', function () { root.classList.remove('cur-down'); });
  document.documentElement.addEventListener('mouseleave', function () { root.classList.remove('cur-on'); seen = false; });
  document.documentElement.addEventListener('mouseenter', function () { if (mx > -50) root.classList.add('cur-on'); });

  function loop() {
    requestAnimationFrame(loop);
    if (!seen && !sparks.length) return;
    rx += (mx - rx) * (reduce ? 1 : 0.2); ry += (my - ry) * (reduce ? 1 : 0.2);
    ring.style.transform = 'translate3d(' + rx + 'px,' + ry + 'px,0)';
    g.clearRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    for (var i = sparks.length - 1; i >= 0; i--) {
      var s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.life -= s.d;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      var grd = g.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
      grd.addColorStop(0, 'rgba(255,226,160,' + (s.life * .85) + ')'); grd.addColorStop(1, 'rgba(203,162,79,0)');
      g.fillStyle = grd; g.beginPath(); g.arc(s.x, s.y, s.r * 4, 0, 6.283); g.fill();
    }
  }
  root.classList.add('has-cur');
  requestAnimationFrame(loop);
})();
