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
      var mq = window.matchMedia("(prefers-color-scheme: dark)");
      var saved = null;
      try { saved = localStorage.getItem("theme"); } catch (e) {}
      if (saved === "light" || saved === "dark") root.setAttribute("data-theme", saved);

      var btn = document.getElementById("themeToggle");
      if (!btn) return;

      function isDark() {
        var t = root.getAttribute("data-theme");
        if (t === "dark") return true;
        if (t === "light") return false;
        return mq.matches; // auto: follow the system
      }
      function syncPressed() {
        btn.setAttribute("aria-pressed", isDark() ? "true" : "false");
      }
      syncPressed();

      btn.addEventListener("click", function () {
        var next = isDark() ? "light" : "dark";
        root.setAttribute("data-theme", next);
        try { localStorage.setItem("theme", next); } catch (e) {}
        syncPressed();
      });

      // Keep the announced state correct while following the system in auto mode.
      if (mq.addEventListener) {
        mq.addEventListener("change", function () {
          if (root.getAttribute("data-theme") === "auto") syncPressed();
        });
      }
    }
  };

  /* ---------- Scroll reveal (with grouped stagger) ----------
     Standalone [data-reveal] elements fade in individually. Elements inside a
     [data-stagger] container reveal together, cascading by ~70ms each. */
  var Reveal = {
    init: function () {
      var all = document.querySelectorAll("[data-reveal]");
      if (prefersReduced || !("IntersectionObserver" in window)) {
        all.forEach(function (el) { el.classList.add("in"); });
        return;
      }

      // Reveal items that are NOT part of a stagger group, one at a time.
      var soloIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); soloIO.unobserve(e.target); }
        });
      }, { threshold: 0.14 });
      all.forEach(function (el) {
        if (!el.closest("[data-stagger]")) soloIO.observe(el);
      });

      // Reveal each stagger group's children as a cascade when the group enters.
      var groupIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          var kids = e.target.querySelectorAll("[data-reveal]");
          kids.forEach(function (kid, i) {
            kid.style.transitionDelay = (i * 70) + "ms";
            kid.classList.add("in");
          });
          groupIO.unobserve(e.target);
        });
      }, { threshold: 0.2 });
      document.querySelectorAll("[data-stagger]").forEach(function (el) { groupIO.observe(el); });
    }
  };

  /* ---------- Metric count-up ---------- */
  var Counters = {
    run: function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var pre = el.getAttribute("data-prefix") || "";
      var suf = el.getAttribute("data-suffix") || "";
      if (prefersReduced || isNaN(target) || target === 0) {
        el.textContent = pre + (isNaN(target) ? "" : target) + suf;
        return;
      }
      var start = null, dur = 1100;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + Math.round(target * eased) + suf;
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

  /* ---------- Screenshots: hide any that are missing / fail to load ----------
     Prevents broken-image icons in the work section. When a shot cannot load it
     is removed; if a project's whole grid ends up empty, the grid is hidden. */
  var Shots = {
    init: function () {
      var containers = document.querySelectorAll(".shots");
      containers.forEach(function (container) {
        var imgs = container.querySelectorAll("img");
        imgs.forEach(function (img) {
          function fail() {
            img.setAttribute("data-failed", "");
            img.style.display = "none";
            if (!container.querySelector("img:not([data-failed])")) {
              container.style.display = "none";
            }
          }
          img.addEventListener("error", fail);
          // Catch images that already failed before this script ran.
          if (img.complete && img.naturalWidth === 0) fail();
        });
      });
    }
  };

  /* ---------- Scroll progress hairline ---------- */
  var Progress = {
    init: function () {
      var bar = document.querySelector(".scroll-progress");
      if (!bar) return;
      var ticking = false;
      function update() {
        var doc = document.documentElement;
        var max = doc.scrollHeight - doc.clientHeight;
        var p = max > 0 ? doc.scrollTop / max : 0;
        bar.style.transform = "scaleX(" + p + ")";
        ticking = false;
      }
      window.addEventListener("scroll", function () {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      window.addEventListener("resize", update, { passive: true });
      update();
    }
  };

  /* ---------- Section navigator: highlight the section in view ----------
     Active = the last section whose top has scrolled past a line just below
     the sticky bar. A bottom-of-page case ensures the final (short) section
     still activates, which a centre-band observer cannot guarantee. */
  var SectionNav = {
    init: function () {
      var nav = document.querySelector(".section-nav");
      if (!nav) return;

      var links = {}, order = [];
      nav.querySelectorAll("a[data-spy]").forEach(function (a) {
        var id = a.getAttribute("data-spy");
        links[id] = a;
        order.push(id);
      });
      var sections = order
        .map(function (id) { return { id: id, el: document.getElementById(id) }; })
        .filter(function (s) { return s.el; });
      if (!sections.length) return;

      var current = null;
      function setActive(id) {
        if (current === id) return;
        if (current && links[current]) {
          links[current].classList.remove("active");
          links[current].removeAttribute("aria-current");
        }
        current = id;
        if (links[id]) {
          links[id].classList.add("active");
          links[id].setAttribute("aria-current", "true");
        }
      }

      var ticking = false;
      function update() {
        ticking = false;
        var line = 120; // activation line, just below the ~64px sticky bar
        var doc = document.documentElement;
        var atBottom = window.innerHeight + window.scrollY >= doc.scrollHeight - 2;
        var activeId = sections[0].id;
        if (atBottom) {
          activeId = sections[sections.length - 1].id;
        } else {
          for (var i = 0; i < sections.length; i++) {
            if (sections[i].el.getBoundingClientRect().top <= line) activeId = sections[i].id;
          }
        }
        setActive(activeId);
      }

      window.addEventListener("scroll", function () {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      window.addEventListener("resize", update, { passive: true });
      update();
    }
  };

  /* ---------- Scroll to top ---------- */
  var ToTop = {
    init: function () {
      var btn = document.querySelector(".to-top");
      if (!btn) return;
      var ticking = false;
      function update() {
        var y = document.documentElement.scrollTop || document.body.scrollTop || 0;
        btn.classList.toggle("show", y > window.innerHeight * 0.6);
        ticking = false;
      }
      window.addEventListener("scroll", function () {
        if (!ticking) { requestAnimationFrame(update); ticking = true; }
      }, { passive: true });
      btn.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: prefersReduced ? "auto" : "smooth" });
      });
      update();
    }
  };

  /* ---------- Download CV → print (site has a print stylesheet) ---------- */
  var Print = {
    init: function () {
      document.querySelectorAll("[data-print]").forEach(function (btn) {
        btn.addEventListener("click", function () { window.print(); });
      });
    }
  };

  /* ---------- Boot ---------- */
  Theme.init();
  Reveal.init();
  Counters.init();
  Shots.init();
  Progress.init();
  SectionNav.init();
  ToTop.init();
  Print.init();
})();
