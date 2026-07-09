/* =========================================================
   app.js — portfolio behaviour
   Modules: theme · reveal · counters
   No dependencies. Runs after DOM parse (defer).
   ========================================================= */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Theme: system default, manual toggle, remembered ---------- */
  var Theme = {
    init: function () {
      var root = document.documentElement;
      var saved = null;
      try { saved = localStorage.getItem("theme"); } catch (e) {}
      if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

      var btn = document.getElementById("themeToggle");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var cur = root.getAttribute("data-theme");
        if (cur === "auto" || !cur) {
          cur = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        var next = cur === "dark" ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) {}
      });
    }
  };

  /* ---------- Scroll reveal ---------- */
  var Reveal = {
    init: function () {
      var items = document.querySelectorAll("[data-reveal]");
      if (prefersReduced || !("IntersectionObserver" in window)) {
        items.forEach(function (el) { el.classList.add("in"); });
        return;
      }
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
        });
      }, { threshold: 0.14 });
      items.forEach(function (el) { io.observe(el); });
    }
  };

  /* ---------- Metric count-up ---------- */
  var Counters = {
    run: function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var pre = el.getAttribute("data-prefix") || "";
      var suf = el.getAttribute("data-suffix") || "";
      if (prefersReduced || isNaN(target) || target === 0) {
        el.innerHTML = pre + (isNaN(target) ? "" : target) + suf;
        return;
      }
      var start = null, dur = 1100;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.innerHTML = pre + Math.round(target * eased) + suf;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    },
    init: function () {
      var nums = document.querySelectorAll(".metric-val[data-count]");
      if (!("IntersectionObserver" in window)) {
        nums.forEach(Counters.run);
        return;
      }
      var self = this;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { self.run(e.target); io.unobserve(e.target); }
        });
      }, { threshold: 0.6 });
      nums.forEach(function (el) { io.observe(el); });
    }
  };

  /* ---------- Boot ---------- */
  Theme.init();
  Reveal.init();
  Counters.init();
})();
