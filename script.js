/* ===== Shaadi Reels — interactions ===== */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var isMobile = window.innerWidth < 821;

  /* ---------- Muted autoplay previews (works on mobile: muted + playsinline) ---------- */
  var saveData = navigator.connection && navigator.connection.saveData;
  var videoIO = (!reduced && !saveData && "IntersectionObserver" in window)
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var v = en.target;
          if (en.isIntersecting) { var p = v.play(); if (p && p.catch) p.catch(function () {}); }
          else v.pause();
        });
      }, { threshold: 0.35 })
    : null;
  function attachVideo(host, media) {
    var src = host && host.getAttribute("data-video");
    if (!videoIO || !src || !media || media.querySelector("video")) return;
    var img = media.querySelector("img");
    var v = document.createElement("video");
    v.muted = true; v.loop = true; v.playsInline = true; v.preload = "none";
    v.setAttribute("muted", ""); v.setAttribute("playsinline", ""); v.setAttribute("webkit-playsinline", "");
    v.setAttribute("aria-hidden", "true"); v.tabIndex = -1;
    if (img) v.poster = img.getAttribute("src");
    v.src = src;
    v.addEventListener("playing", function () { if (img) img.style.animation = "none"; });
    v.addEventListener("error", function () { videoIO.unobserve(v); v.remove(); }); // missing file: keep the still image
    media.insertBefore(v, img ? img.nextSibling : media.firstChild);
    videoIO.observe(v);
  }

  /* ---------- Scroll lock (mobile menu + reel player share it) ---------- */
  var locks = { nav: false, modal: false };
  var lenis = null;
  function applyLock() {
    var on = locks.nav || locks.modal;
    document.documentElement.style.overflow = on ? "hidden" : "";
    document.body.style.overflow = on ? "hidden" : "";
    if (lenis) { if (on) lenis.stop(); else lenis.start(); }
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  if (!reduced && typeof Lenis !== "undefined" && !isMobile) {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    (function raf(time) { lenis.raf(time); requestAnimationFrame(raf); })(0);
  }

  /* ---------- Header state + mobile nav ---------- */
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".main-nav");
  window.addEventListener("scroll", function () {
    header.classList.toggle("scrolled", window.scrollY > 60);
  }, { passive: true });
  function setNav(open) {
    nav.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    locks.nav = open;
    applyLock();
  }
  toggle.addEventListener("click", function () { setNav(!nav.classList.contains("open")); });

  // Anchor links work with or without Lenis
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length > 1) {
        var target = document.querySelector(id);
        if (target) {
          e.preventDefault();
          setNav(false);
          if (lenis) lenis.scrollTo(target, { offset: -70 });
          else target.scrollIntoView({ behavior: reduced ? "auto" : "smooth" });
        }
      }
    });
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
    document.addEventListener("mouseover", function (e) {
      ring.classList.toggle("grow", !!e.target.closest("a, button, .reel-card, .pkg-tab"));
    });
  }

  /* ---------- Gold dust canvas (hero) — pauses when off-screen ---------- */
  var canvas = document.getElementById("gold-dust");
  if (canvas && !reduced) {
    var ctx = canvas.getContext("2d"), W, H, parts = [];
    var COUNT = isMobile ? 16 : 70;
    var dustVisible = true, dustRunning = false;
    var size = function () {
      W = canvas.width = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
    };
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
    var drawDust = function () {
      if (!dustVisible) { dustRunning = false; return; }
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
      requestAnimationFrame(drawDust);
    };
    new IntersectionObserver(function (en) {
      dustVisible = en[0].isIntersecting;
      if (dustVisible && !dustRunning) { dustRunning = true; requestAnimationFrame(drawDust); }
    }).observe(canvas);
  }

  /* ---------- Hero phone: seamless vertical reel loop ---------- */
  var phoneTrack = document.getElementById("phone-track");
  if (phoneTrack) {
    var originals = Array.prototype.slice.call(phoneTrack.children);
    originals.forEach(function (card) {
      var c = card.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      phoneTrack.appendChild(c);
    });
    phoneTrack.querySelectorAll(".phone-card").forEach(function (c) { attachVideo(c, c); });
    if (!reduced) phoneTrack.classList.add("is-looping");
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

  /* ---------- Reel strip: seamless loop that fills any screen width ---------- */
  var apTrack = document.getElementById("ap-track");
  var apOriginals = apTrack ? Array.prototype.slice.call(apTrack.children) : [];
  var apWidth = 0;
  function buildStrip() {
    if (!apTrack || !apOriginals.length) return;
    apWidth = window.innerWidth;
    apTrack.classList.remove("ap-ready");
    apTrack.innerHTML = "";
    apOriginals.forEach(function (c) { apTrack.appendChild(c.cloneNode(true)); });
    var gap = parseFloat(getComputedStyle(apTrack).columnGap) || 16;
    apTrack.style.paddingRight = gap + "px"; // makes each set exactly (cards + gaps) wide
    var setW = apTrack.getBoundingClientRect().width;
    if (!(setW > 50)) { // not laid out yet (hidden/zero-size container): keep one set, retry shortly — never divide by ~0
      if (!buildStrip._retried) { buildStrip._retried = true; setTimeout(buildStrip, 400); }
      if (!reduced) apTrack.classList.add("ap-ready");
      apTrack.querySelectorAll(".ap-card[data-video]").forEach(function (c) { attachVideo(c, c.querySelector(".ap-media")); });
      return;
    }
    var k = Math.min(4, Math.max(1, Math.ceil(window.innerWidth / setW)));
    // k sets for the visible half + k identical sets for the second half => translateX(-50%) loops with no jump
    for (var n = 1; n < k * 2; n++) {
      apOriginals.forEach(function (c) {
        var clone = c.cloneNode(true);
        if (n >= k) { clone.setAttribute("aria-hidden", "true"); clone.setAttribute("tabindex", "-1"); }
        apTrack.appendChild(clone);
      });
    }
    apTrack.querySelectorAll(".ap-card").forEach(function (card, idx) {
      if (idx >= apOriginals.length * k) { card.setAttribute("aria-hidden", "true"); card.setAttribute("tabindex", "-1"); }
    });
    if (!reduced) apTrack.classList.add("ap-ready");
    apTrack.querySelectorAll(".ap-card[data-video]").forEach(function (c) { attachVideo(c, c.querySelector(".ap-media")); });
  }
  buildStrip();
  var apResizeT;
  addEventListener("resize", function () {
    clearTimeout(apResizeT);
    apResizeT = setTimeout(function () {
      if (window.innerWidth !== apWidth) buildStrip();
    }, 250);
  });

  /* ---------- Reviews: auto-scrolling loop ---------- */
  var rvTrack = document.getElementById("review-track");
  var rvOriginals = rvTrack ? Array.prototype.slice.call(rvTrack.children) : [];
  var rvWidth = 0;
  function buildReviews() {
    if (!rvTrack || !rvOriginals.length) return;
    rvWidth = window.innerWidth;
    rvTrack.classList.remove("rv-ready");
    rvTrack.innerHTML = "";
    rvOriginals.forEach(function (c) { rvTrack.appendChild(c.cloneNode(true)); });
    var gap = parseFloat(getComputedStyle(rvTrack).columnGap) || 22;
    rvTrack.style.paddingRight = gap + "px";
    var setW = rvTrack.getBoundingClientRect().width;
    if (!(setW > 50)) { // same zero-layout guard as the reel strip
      if (!buildReviews._retried) { buildReviews._retried = true; setTimeout(buildReviews, 400); }
      if (!reduced) rvTrack.classList.add("rv-ready");
      return;
    }
    var k = Math.min(4, Math.max(1, Math.ceil(window.innerWidth / setW)));
    for (var n = 1; n < k * 2; n++) {
      rvOriginals.forEach(function (c) {
        var clone = c.cloneNode(true);
        if (n >= k) clone.setAttribute("aria-hidden", "true");
        rvTrack.appendChild(clone);
      });
    }
    if (!reduced) rvTrack.classList.add("rv-ready");
  }
  buildReviews();
  var rvT;
  addEventListener("resize", function () {
    clearTimeout(rvT);
    rvT = setTimeout(function () { if (window.innerWidth !== rvWidth) buildReviews(); }, 250);
  });

  /* ---------- Pause looping animations while off-screen (saves battery on phones) ---------- */
  if ("IntersectionObserver" in window) {
    [".marquee-track", "#ap-track", "#review-track", "#phone-track"].forEach(function (sel) {
      var el = document.querySelector(sel);
      if (!el || !el.parentElement) return;
      new IntersectionObserver(function (en) {
        el.style.animationPlayState = en[0].isIntersecting ? "" : "paused";
      }).observe(el.parentElement);
    });
  }

  /* ---------- Reel player (on-page Instagram embed) ---------- */
  var modal = document.getElementById("reel-modal");
  var frame = document.getElementById("reel-frame");
  var igLink = document.getElementById("reel-ig");
  var lastFocus = null;
  function reelId(url) {
    var m = String(url).match(/\/reel\/([A-Za-z0-9_-]+)/);
    return m ? m[1] : null;
  }
  var LOCAL_REELS = {
    DIadNsvT1w5: "couple-reel", DPzLfmSjM3F: "family-mob-dance", DWbkuJQk5b1: "itc-grand-goa",
    "DYY-GWlxBbC": "bidaai", DTscOlSCNwq: "reception-afterparty", DeMuArOTrsh: "bridal-entry",
    DWlM9DqEXEI: "friends-musical", DWniX6hgfxk: "st-regis", DX321bvRGdU: "joota-chupai",
    "DYbcPE-RI8L": "emotional-moment", DWleuo5gWba: "love-story", DXMXgv3k1FI: "live-band",
    DWvZdHXk9Xa: "groom-entry", "DYG_YK9Rkzc": "paisdewan-mehndi"
  };
  function openReel(url) {
    var id = reelId(url);
    if (!modal || !id) { window.open(url, "_blank", "noopener"); return; }
    lastFocus = document.activeElement;
    frame.innerHTML = "";
    var local = LOCAL_REELS[id];
    if (local) {
      // Play our own file natively — no Instagram embed, nothing external to hang or freeze.
      var vid = document.createElement("video");
      vid.src = "assets/reels/full/" + local + ".mp4";
      vid.poster = "assets/poster-" + local + ".jpg";
      vid.controls = true; vid.autoplay = true; vid.playsInline = true;
      vid.setAttribute("playsinline", "");
      vid.setAttribute("title", "Shaadi Reels video player");
      vid.addEventListener("error", function () {
        // Local file missing: fall back to the Instagram embed for this reel.
        frame.innerHTML = "";
        var f2 = document.createElement("iframe");
        f2.src = "https://www.instagram.com/reel/" + id + "/embed/";
        f2.setAttribute("allow", "autoplay; encrypted-media; fullscreen; picture-in-picture");
        f2.setAttribute("allowfullscreen", "");
        frame.appendChild(f2);
      }, { once: true });
      frame.appendChild(vid);
      var vp = vid.play(); if (vp && vp.catch) vp.catch(function () {});
    } else {
      var ifr = document.createElement("iframe");
      ifr.src = "https://www.instagram.com/reel/" + id + "/embed/";
      ifr.setAttribute("allow", "autoplay; encrypted-media; fullscreen; picture-in-picture");
      ifr.setAttribute("allowfullscreen", "");
      ifr.setAttribute("title", "Instagram reel player");
      frame.appendChild(ifr);
    }
    igLink.href = url;
    modal.hidden = false;
    locks.modal = true; applyLock();
    var closeBtn = modal.querySelector(".reel-modal-close");
    if (closeBtn) closeBtn.focus();
  }
  function closeReel() {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    frame.innerHTML = ""; // removing the iframe stops playback
    locks.modal = false; applyLock();
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  document.addEventListener("click", function (e) {
    if (modal && e.target.closest("[data-close]") && modal.contains(e.target)) { closeReel(); return; }
    var a = e.target.closest("a.reel-card, a.ap-card");
    if (!a) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; // let "open in new tab" work
    e.preventDefault();
    openReel(a.href);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (modal && !modal.hidden) closeReel();
    else if (nav.classList.contains("open")) setNav(false);
  });

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
  var hasGsap = typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined" && !reduced;
  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) lenis.on("scroll", ScrollTrigger.update);
    gsap.utils.toArray(".reveal").forEach(function (el) {
      gsap.from(el, {
        y: 44, opacity: 0, duration: 1, ease: "power3.out",
        // clearProps hands transform back to CSS so :hover lifts and the tilt effect keep working
        clearProps: "transform,opacity",
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
    // Fallback: timeline progress via IntersectionObserver
    var tl = document.querySelector(".timeline"), prog = document.querySelector(".timeline-progress");
    if (tl && prog) {
      var tlIO = new IntersectionObserver(function (en) {
        en.forEach(function (e) {
          if (e.isIntersecting) { prog.style.transition = "height 2.4s ease"; prog.style.height = "100%"; }
        });
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
      t.setAttribute("aria-selected", on ? "true" : "false");
      document.getElementById("panel-" + t.dataset.region).hidden = !on;
    });
    moveGlider(tab);
    if (hasGsap) {
      // cards in the newly shown panel must never be left half-faded
      var shown = document.getElementById("panel-" + tab.dataset.region);
      gsap.set(shown.querySelectorAll(".reveal"), { opacity: 1, clearProps: "transform" });
      ScrollTrigger.refresh();
    }
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { activate(t); }); });
  function syncGlider() {
    var active = document.querySelector(".pkg-tab.active");
    if (active) moveGlider(active);
  }
  window.addEventListener("load", syncGlider);
  window.addEventListener("resize", syncGlider);

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
  window.addEventListener("resize", function () {
    document.querySelectorAll(".faq-item.open .faq-a").forEach(function (p) {
      p.style.maxHeight = p.scrollHeight + "px";
    });
  });

  /* ---------- Enquiry form -> WhatsApp ---------- */
  var form = document.getElementById("enquiry-form");
  var errBox = document.createElement("p");
  errBox.className = "form-error";
  errBox.setAttribute("role", "alert");
  form.insertBefore(errBox, form.querySelector(".form-submit"));
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var f = new FormData(form);
    var name = (f.get("name") || "").toString().trim();
    var phone = (f.get("phone") || "").toString().trim();
    var digits = phone.replace(/\D/g, "");
    if (!name) { errBox.textContent = "Please add your name so we know who to reply to."; form.elements.name.focus(); return; }
    if (digits.length < 8) { errBox.textContent = "Please add a valid WhatsApp number (with country code if outside India)."; form.elements.phone.focus(); return; }
    errBox.textContent = "";
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
    // Dubai package picks go to the Dubai WhatsApp number
    var number = /Dubai/i.test(String(f.get("package"))) ? "971507298608" : "919266771806";
    var url = "https://wa.me/" + number + "?text=" + encodeURIComponent(lines.join("\n"));
    if (!window.open(url, "_blank")) window.location.href = url; // popup blocked fallback
  });
  /* ---------- Enhancement pack: gallery videos, stories, preloader, polish ---------- */
  // Live video previews inside gallery cards
  document.querySelectorAll(".reel-card[data-video]").forEach(function (c) { attachVideo(c, c); });

  // Stories row: open the reel in the on-site player
  document.querySelectorAll("[data-open-reel]").forEach(function (chip) {
    chip.addEventListener("click", function () { openReel(chip.getAttribute("data-open-reel")); });
  });

  // Preloader: hide on load (with a minimum moment), never trap the page
  var pre = document.getElementById("preloader");
  if (pre) {
    var preDone = false, preStart = Date.now();
    var hidePre = function () {
      if (preDone) return; preDone = true;
      var wait = Math.max(0, 1950 - (Date.now() - preStart));
      setTimeout(function () { pre.classList.add("done"); setTimeout(function () { pre.remove(); }, 1500); }, wait);
    };
    if (document.readyState === "complete") hidePre();
    else window.addEventListener("load", hidePre);
    setTimeout(hidePre, 3600);
  }

  // Scroll progress bar
  var fill = document.getElementById("scroll-progress-fill");
  if (fill) {
    var onScroll = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      fill.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
  }

  // Magnetic CTA buttons (desktop)
  if (finePointer && !reduced) {
    document.querySelectorAll(".btn, .header-cta").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "translate(" + (px * 10) + "px," + (py * 7 - 2) + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  // Petal burst on quote / WhatsApp taps
  if (!reduced) {
    document.querySelectorAll('a[href*="wa.me"]').forEach(function (a) {
      a.addEventListener("click", function (e) {
        var x = e.clientX || innerWidth / 2, y = e.clientY || innerHeight / 2;
        for (var i = 0; i < 12; i++) {
          var s = document.createElement("span"); s.className = "petal";
          s.style.left = x + "px"; s.style.top = y + "px";
          s.style.setProperty("--dx", (Math.random() * 150 - 75) + "px");
          s.style.setProperty("--dy", (40 + Math.random() * 90) + "px");
          s.style.setProperty("--rot", (Math.random() * 320 - 160) + "deg");
          document.body.appendChild(s);
          (function (el) { setTimeout(function () { el.remove(); }, 1000); })(s);
        }
      });
    });
  }

  // Headline word-by-word rise
  if (typeof gsap !== "undefined" && !reduced) {
    var splitWords = function (el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          var frag = document.createDocumentFragment();
          node.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var wi = document.createElement("span"); wi.className = "wi"; wi.textContent = part;
            w.appendChild(wi); frag.appendChild(w);
          });
          el.replaceChild(frag, node);
        } else if (node.nodeType === 1 && node.tagName === "EM") {
          // Never split inside <em>: its gradient text (background-clip:text) disappears in
          // Chrome when the glyphs sit inside transformed child spans. Wrap the whole phrase
          // as ONE masked unit; the gradient lives on the unit itself (.em-unit in CSS).
          var w = document.createElement("span"); w.className = "w";
          var wi = document.createElement("span"); wi.className = "wi em-unit";
          el.replaceChild(w, node);
          wi.appendChild(node); w.appendChild(wi);
        } else if (node.nodeType === 1) splitWords(node);
      });
    };
    var h1 = document.querySelector(".hero h1");
    if (h1) {
      splitWords(h1);
      gsap.from(h1.querySelectorAll(".wi"), { yPercent: 115, duration: 0.9, ease: "power3.out", stagger: 0.055, delay: 2.2, onComplete: function () { gsap.set(this.targets(), { clearProps: "transform" }); } });
    }
    if (typeof ScrollTrigger !== "undefined") {
      document.querySelectorAll("section h2").forEach(function (h2) {
        splitWords(h2);
        gsap.from(h2.querySelectorAll(".wi"), {
          yPercent: 115, duration: 0.8, ease: "power3.out", stagger: 0.04,
          scrollTrigger: { trigger: h2, start: "top 86%" },
          onComplete: function () { gsap.set(this.targets(), { clearProps: "transform" }); }
        });
      });
    }
  }
  // Package "Get a Quote" buttons: pre-select that package in the enquiry form
  document.querySelectorAll(".pkg-quote[data-package]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var sel = document.querySelector('#enquiry-form select[name="package"]');
      if (sel) sel.value = btn.getAttribute("data-package");
    });
  });
})();
