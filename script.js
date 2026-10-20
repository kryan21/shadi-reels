/* ===== Shaadi Reels — interactions ===== */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var isMobile = window.innerWidth < 821;

  /* ---------- Smooth scroll (Lenis) + GSAP ScrollTrigger sync ---------- */
  var lenis = null;
  if (!reduced && typeof Lenis !== "undefined" && !isMobile) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
  }
  // Anchor links work with or without Lenis
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length > 1) {
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          if (lenis) lenis.scrollTo(target, { offset: -70 });
          else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
          document.querySelector(".main-nav").classList.remove("open");
        }
      }
    });
  });

  /* ---------- Header state + mobile nav ---------- */
  var header = document.querySelector(".site-header");
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  toggle.addEventListener("click", function () {
    var open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
  });

  /* ---------- Custom cursor (desktop only) ---------- */
  if (finePointer && !reduced) {
    var dot = document.querySelector(".cursor-dot"), ring = document.querySelector(".cursor-ring");
    var mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + "px"; dot.style.top = my + "px";
    });
    (function ringLoop() {
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      ring.style.left = rx + "px"; ring.style.top = ry + "px";
      requestAnimationFrame(ringLoop);
    })();
    document.querySelectorAll("a, button, .reel-card, .pkg-tab").forEach(function (el) {
      el.addEventListener("mouseenter", function () { ring.classList.add("grow"); });
      el.addEventListener("mouseleave", function () { ring.classList.remove("grow"); });
    });
  }

  /* ---------- Gold dust canvas (hero) ---------- */
  var canvas = document.getElementById("gold-dust");
  if (canvas && !reduced) {
    var ctx = canvas.getContext("2d"), W, H, parts = [];
    var COUNT = isMobile ? 34 : 80;
    function size() {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    }
    size(); addEventListener("resize", size);
    for (var i = 0; i < COUNT; i++) {
      parts.push({
        x: Math.random(), y: Math.random(),
        r: Math.random() * 2.1 + 0.5,
        s: Math.random() * 0.00045 + 0.00012,
        drift: Math.random() * Math.PI * 2,
        a: Math.random() * 0.55 + 0.15
      });
    }
    (function draw() {
      ctx.clearRect(0, 0, W, H);
      parts.forEach(function (p) {
        p.y -= p.s; p.drift += 0.006;
        if (p.y < -0.02) { p.y = 1.02; p.x = Math.random(); }
        var x = p.x * W + Math.sin(p.drift) * 14, y = p.y * H;
        var g = ctx.createRadialGradient(x, y, 0, x, y, p.r * 4);
        g.addColorStop(0, "rgba(246,217,160," + p.a + ")");
        g.addColorStop(1, "rgba(246,217,160,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(x, y, p.r * 4, 0, Math.PI * 2); ctx.fill();
      });
      if (window.scrollY < innerHeight * 1.2) requestAnimationFrame(draw);
      else requestAnimationFrame(draw); // keep cheap; particle count is small
    })();
  }

  /* ---------- 3D phone tilt (desktop) ---------- */
  var phone = document.getElementById("phone");
  if (phone && finePointer && !reduced) {
    var wrap = phone.parentElement;
    wrap.addEventListener("mousemove", function (e) {
      var r = wrap.getBoundingClientRect();
      var px = (e.clientX - r.left) / r.width - 0.5;
      var py = (e.clientY - r.top) / r.height - 0.5;
      phone.style.transform = "rotateY(" + (px * 20) + "deg) rotateX(" + (-py * 14) + "deg)";
    });
    wrap.addEventListener("mouseleave", function () { phone.style.transform = "rotateY(0) rotateX(0)"; });
  }

  /* ---------- 3D tilt on reel cards (desktop) ---------- */
  if (finePointer && !reduced) {
    document.querySelectorAll(".tilt").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(700px) rotateY(" + (px * 10) + "deg) rotateX(" + (-py * 8) + "deg) translateY(-4px)";
      });
      card.addEventListener("mouseleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- Animated counters ---------- */
  var counterIO = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target; counterIO.unobserve(el);
      var target = parseInt(el.dataset.count, 10), dur = 1600, t0 = null;
      if (reduced) { el.textContent = target.toLocaleString("en-IN"); return; }
      function tick(t) {
        if (!t0) t0 = t;
        var p = Math.min((t - t0) / dur, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString("en-IN");
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll(".counter").forEach(function (c) { counterIO.observe(c); });

  /* ---------- Scroll reveals + timeline progress (GSAP if available) ---------- */
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined" && !reduced) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on("scroll", ScrollTrigger.update);
    gsap.utils.toArray(".reveal").forEach(function (el) {
      gsap.from(el, {
        y: 44, opacity: 0, duration: 1, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" }
      });
    });
    gsap.to(".hero-img", {
      yPercent: 10, ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    });
    gsap.to(".timeline-progress", {
      height: "100%", ease: "none",
      scrollTrigger: { trigger: ".timeline", start: "top 75%", end: "bottom 60%", scrub: true }
    });
  } else {
    // Fallback: timeline progress via IntersectionObserver ratio
    var tl = document.querySelector(".timeline"), prog = document.querySelector(".timeline-progress");
    if (tl && prog) {
      var tlIO = new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) prog.style.height = "100%"; prog.style.transition = "height 2.4s ease"; });
      }, { threshold: 0.15 });
      tlIO.observe(tl);
    }
  }

  /* ---------- Packages India / Dubai toggle ---------- */
  var tabs = document.querySelectorAll(".pkg-tab");
  var glider = document.querySelector(".pkg-toggle-glider");
  function moveGlider(tab) {
    glider.style.left = tab.offsetLeft + "px";
    glider.style.width = tab.offsetWidth + "px";
  }
  function activate(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.classList.toggle("active", on);
      t.setAttribute("aria-selected", on);
      document.getElementById("panel-" + t.dataset.region).hidden = !on;
    });
    moveGlider(tab);
    // Re-run reveal for newly shown cards if GSAP set them from-state
    if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { activate(t); }); });
  window.addEventListener("load", function () {
    var active = document.querySelector(".pkg-tab.active");
    if (active) moveGlider(active);
  });
  window.addEventListener("resize", function () {
    var active = document.querySelector(".pkg-tab.active");
    if (active) moveGlider(active);
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q"), panel = item.querySelector(".faq-a");
    btn.addEventListener("click", function () {
      var open = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (o) {
        o.classList.remove("open");
        o.querySelector(".faq-a").style.maxHeight = "0px";
        o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
      });
      if (!open) {
        item.classList.add("open");
        panel.style.maxHeight = panel.scrollHeight + "px";
        btn.setAttribute("aria-expanded", "true");
      }
    });
  });

  /* ---------- Enquiry form -> WhatsApp ---------- */
  var form = document.getElementById("enquiry-form");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(form);
    var name = (f.get("name") || "").toString().trim();
    var phone = (f.get("phone") || "").toString().trim();
    if (!name || !phone) {
      alert("Please add your name and WhatsApp number so we can reply to you.");
      return;
    }
    var lines = [
      "Hi Shaadi Reels! I have a wedding enquiry.",
      "Name: " + name,
      "My WhatsApp: " + phone,
      "I am: " + f.get("who")
    ];
    if (f.get("date")) lines.push("Wedding date: " + f.get("date"));
    if ((f.get("city") || "").toString().trim()) lines.push("City / Venue: " + f.get("city"));
    if ((f.get("events") || "").toString().trim()) lines.push("Events to cover: " + f.get("events"));
    lines.push("Package interest: " + f.get("package"));
    lines.push("Please share a quote. Thank you!");
    window.open("https://wa.me/919266771806?text=" + encodeURIComponent(lines.join("\n")), "_blank");
  });
})();
