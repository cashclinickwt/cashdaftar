/* Cash Daftar — scroll motion (no dependencies)
   - .rv            : reveal on enter (staggered with --i)
   - [data-count]   : count-up numbers
   - .pin > .stage  : pinned sections; progress 0→1 exposed as --p and consumed by journey()/stack()
   - .hero-3d       : 3D device tilt from scroll + pointer
   Reduced motion / narrow screens: pinning is disabled by CSS and final states are applied. */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var narrow = window.matchMedia("(max-width: 860px)");
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var simple = function () { return reduce || narrow.matches; };

  /* ---- reveals ---- */
  var rv = Array.prototype.slice.call(document.querySelectorAll(".rv"));
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rv.forEach(function (el) { io.observe(el); });
  } else rv.forEach(function (el) { el.classList.add("in"); });

  /* ---- counters ---- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-count]"), function (el) {
    var target = Number(el.getAttribute("data-count")) || 0;
    if (reduce || !("IntersectionObserver" in window)) { el.textContent = target; return; }
    var run = function () {
      var t0 = performance.now(), dur = 1400;
      var f = function (t) { var k = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(target * e); if (k < 1) requestAnimationFrame(f); };
      requestAnimationFrame(f);
    };
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { run(); o.disconnect(); } }, { threshold: 0.5 }).observe(el);
  });

  /* ---- pinned sections ---- */
  var pins = Array.prototype.slice.call(document.querySelectorAll(".pin"));
  var tangle = document.getElementById("tangle"), line = document.getElementById("line");
  var L1 = 0, L2 = 0;
  if (tangle && line) {
    L1 = tangle.getTotalLength(); L2 = line.getTotalLength();
    tangle.style.strokeDasharray = L1; line.style.strokeDasharray = L2;
  }
  var journeyEl = document.getElementById("journey");
  var stackEl = document.getElementById("stack");
  var cards = stackEl ? Array.prototype.slice.call(stackEl.querySelectorAll(".dev")) : [];
  var scaps = stackEl ? Array.prototype.slice.call(stackEl.querySelectorAll(".scap")) : [];
  var jcaps = journeyEl ? Array.prototype.slice.call(journeyEl.querySelectorAll(".jcap")) : [];

  function journey(p) {
    if (!tangle) return;
    var d1 = clamp(p / 0.42, 0, 1);                 // thread draws in
    var fade = clamp((p - 0.46) / 0.18, 0, 1);      // thread fades
    var d2 = clamp((p - 0.5) / 0.28, 0, 1);         // clear line draws
    tangle.style.strokeDashoffset = L1 * (1 - d1);
    tangle.style.opacity = 0.95 * (1 - fade) + 0.14 * fade;   // keep a faint ghost of the tangle behind the clear line
    line.style.strokeDashoffset = L2 * (1 - d2);
    line.style.opacity = d2 > 0 ? 1 : 0;
    var idx = p < 0.46 ? 0 : p < 0.78 ? 1 : 2;
    jcaps.forEach(function (c, i) { c.classList.toggle("on", i === idx); });
    journeyEl.classList.toggle("done", p > 0.82);
  }
  function stack(p) {
    var starts = [0, 0.34, 0.68], len = 0.24, vh = window.innerHeight;
    var active = 0;
    cards.forEach(function (card, i) {
      var t = i === 0 ? 1 : clamp((p - starts[i]) / len, 0, 1);
      if (i > 0 && p >= starts[i] + 0.02) active = i;
      var later = 0; for (var j = i + 1; j < cards.length; j++) if (p > starts[j]) later += clamp((p - starts[j]) / len, 0, 1);
      var ty = (1 - t) * vh * 0.75 - later * 26;
      var rx = (1 - t) * 24;
      var sc = (0.9 + 0.1 * t) - later * 0.05;
      card.style.transform = "translate3d(0," + ty.toFixed(1) + "px,0) rotateX(" + rx.toFixed(2) + "deg) scale(" + sc.toFixed(3) + ")";
      card.style.opacity = i === 0 ? 1 : t;
      card.style.filter = "brightness(" + (1 - later * 0.14).toFixed(3) + ")";
      card.style.zIndex = 10 + i;
    });
    scaps.forEach(function (c, i) { c.classList.toggle("on", i === active); });
  }
  var ticking = false;
  function update() {
    ticking = false;
    var vh = window.innerHeight, y = window.scrollY || window.pageYOffset;
    doc.style.setProperty("--hero-p", clamp(y / (vh * 0.9), 0, 1).toFixed(3));
    if (simple()) return;
    pins.forEach(function (sec) {
      var top = sec.offsetTop, h = sec.offsetHeight;
      var p = clamp((y - top) / Math.max(1, h - vh), 0, 1);
      sec.style.setProperty("--p", p.toFixed(4));
      if (sec === journeyEl) journey(p);
      if (sec === stackEl) stack(p);
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  function finalStates() {
    if (tangle) { tangle.style.strokeDashoffset = 0; tangle.style.opacity = 0.35; line.style.strokeDashoffset = 0; line.style.opacity = 1; if (journeyEl) journeyEl.classList.add("done"); jcaps.forEach(function (c, i) { c.classList.toggle("on", i === 2); }); }
    cards.forEach(function (c) { c.style.transform = ""; c.style.opacity = 1; c.style.filter = ""; });
    scaps.forEach(function (c) { c.classList.add("on"); });
  }
  /* narrow screens: pair each caption with its screen (caption, screen, caption, screen…) */
  var sdev = stackEl ? stackEl.querySelector(".sdev") : null, interleaved = false;
  function layout() {
    if (!sdev || !cards.length) return;
    if (narrow.matches && !interleaved) { cards.forEach(function (c, i) { if (scaps[i]) scaps[i].insertAdjacentElement("afterend", c); }); interleaved = true; }
    else if (!narrow.matches && interleaved) { cards.forEach(function (c) { sdev.appendChild(c); }); interleaved = false; }
  }
  function mode() { layout(); if (simple()) finalStates(); else { cards.forEach(function (c) { c.style.opacity = 0; }); update(); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { mode(); }, { passive: true });
  if (narrow.addEventListener) narrow.addEventListener("change", mode);
  mode();

  /* ---- hero pointer tilt ---- */
  var hero = document.querySelector(".hero-3d");
  if (hero && !reduce && window.matchMedia("(hover:hover)").matches) {
    var stage = hero.closest(".hero");
    stage.addEventListener("mousemove", function (e) {
      var r = stage.getBoundingClientRect();
      var mx = (e.clientX - r.left) / r.width - 0.5, my = (e.clientY - r.top) / r.height - 0.5;
      hero.style.setProperty("--mx", mx.toFixed(3)); hero.style.setProperty("--my", my.toFixed(3));
    });
    stage.addEventListener("mouseleave", function () { hero.style.setProperty("--mx", 0); hero.style.setProperty("--my", 0); });
  }
})();
