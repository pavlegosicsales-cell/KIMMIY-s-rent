/* Kimmy's Rent — interactions (GSAP + ScrollTrigger) */
(function () {
  "use strict";

  var hasGsap = typeof gsap !== "undefined";
  if (hasGsap && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  /* Always start at the top on reload, so scroll-driven sections
     (fleet tabs, services deck...) always play from their first state.
     Chrome restores the old position asynchronously, so win the race
     by resetting again right after load — but never yank the page away
     from a user who has already started scrolling. */
  var userMoved = false;
  ["wheel", "touchstart", "keydown"].forEach(function (ev) {
    window.addEventListener(ev, function () { userMoved = true; }, { passive: true, once: true });
  });
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!location.hash) {
    window.scrollTo(0, 0);
    window.addEventListener("load", function () {
      if (userMoved) return;
      window.scrollTo(0, 0);
      setTimeout(function () {
        if (userMoved) return;
        window.scrollTo(0, 0);
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.update();
      }, 60);
    });
  }

  var isDesktop = function () { return window.matchMedia("(min-width: 768px)").matches; };

  /* ---------- Smooth anchor scrolling ----------
     Done here rather than with CSS `scroll-behavior: smooth`, because that
     property stops ScrollTrigger.refresh() from jumping the page to measure,
     so every trigger below the fold got the wrong start once you had scrolled
     (the fleet opened on the wrong car, thumbnail clicks landed off-section). */
  document.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest('a[href*="#"]') : null;
    if (!a) return;
    var href = a.getAttribute("href");
    var hashIdx = href.indexOf("#");
    var path = href.slice(0, hashIdx);
    if (path && path !== location.pathname.split("/").pop()) return; /* other page */
    var id = href.slice(hashIdx + 1);
    var target = id ? document.getElementById(id) : document.body;
    if (!target) return;
    e.preventDefault();
    var margin = parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
    var y = id ? target.getBoundingClientRect().top + window.pageYOffset - margin : 0;
    window.scrollTo({ top: y, behavior: "smooth" });
    if (history.replaceState) history.replaceState(null, "", id ? "#" + id : location.pathname);
  });

  /* ---------- Cars page: brand filter pills ---------- */
  (function carsFilter() {
    var pills = document.querySelectorAll(".category-link[data-filter]");
    if (!pills.length) return;
    var items = document.querySelectorAll(".project_items[data-brand]");
    pills.forEach(function (pill) {
      pill.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        var f = pill.getAttribute("data-filter");
        pills.forEach(function (p) { p.classList.toggle("w--current", p === pill); });
        items.forEach(function (it) {
          it.classList.toggle("is-hidden", f !== "All" && it.getAttribute("data-brand") !== f);
        });
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.refresh();
      }, true);
    });
  })();

  /* ---------- Contact: booking wizard ----------
     Skill 02, step 8: choice cards on steps 1-4 (a tap picks and advances),
     text fields last, progress ticks, Back on every step after the first,
     submit disabled while sending, inline confirmation.

     ENDPOINT is the Apps Script /exec URL from skill 03.
     Paste the Apps Script URL here after running Skill 03. While it is empty
     the request is handed to the visitor's mail client instead, so nothing
     is lost before the backend exists. */
  var ENDPOINT = '';
  var BOOKING_MAIL = 'bookings@kimmiysrent.com';
  var BOOKING_TEL = '+381 65 2017 777';

  (function bookingWizard() {
    var form = document.getElementById("wizard");
    if (!form) return;
    var box = form.closest(".contact-us-form");
    var steps = Array.prototype.slice.call(form.querySelectorAll(".wstep"));
    var ticks = Array.prototype.slice.call(form.querySelectorAll(".wizard__tick"));
    var count = form.querySelector(".wizard__count");
    var back = form.querySelector(".wnav__back");
    var next = form.querySelector(".wnav__next");
    var submit = form.querySelector(".wnav__submit");
    var err = form.querySelector(".wizard__err");
    var done = box.querySelector(".wizard__done");
    var i = 0;

    function render() {
      steps.forEach(function (s, n) { s.classList.toggle("is-active", n === i); });
      ticks.forEach(function (t, n) { t.classList.toggle("is-done", n <= i); });
      if (count) count.textContent = "Step " + (i + 1) + " of " + steps.length;
      back.hidden = i === 0;
      var last = i === steps.length - 1;
      next.hidden = last;
      submit.hidden = !last;
      err.hidden = true;
      var q = steps[i].querySelector(".wstep__q");
      if (q) { q.setAttribute("tabindex", "-1"); q.focus({ preventScroll: true }); }
    }
    function go(n) { i = Math.max(0, Math.min(steps.length - 1, n)); render(); }

    /* a step with a choice group needs a pick; a step with inputs needs its
       required ones filled and valid */
    function stepOk(n) {
      var step = steps[n];
      var group = step.querySelector(".wopts");
      if (group && !group.dataset.value) return "Please pick one option to continue.";
      var fields = step.querySelectorAll("input, textarea");
      for (var k = 0; k < fields.length; k++) {
        if (!fields[k].checkValidity()) {
          fields[k].focus();
          return fields[k].validationMessage || "Please fill in the highlighted field.";
        }
      }
      return "";
    }

    form.addEventListener("click", function (e) {
      var opt = e.target.closest(".wopt");
      if (opt) {
        var group = opt.closest(".wopts");
        Array.prototype.forEach.call(group.querySelectorAll(".wopt"), function (b) {
          b.classList.remove("is-picked"); b.setAttribute("aria-pressed", "false");
        });
        opt.classList.add("is-picked");
        opt.setAttribute("aria-pressed", "true");
        group.dataset.value = opt.dataset.value;
        if (i < steps.length - 1) window.setTimeout(function () { go(i + 1); }, 160);
        return;
      }
      if (e.target.closest(".wnav__back")) { go(i - 1); return; }
      if (e.target.closest(".wnav__next")) {
        var problem = stepOk(i);
        if (problem) { err.textContent = problem; err.hidden = false; return; }
        go(i + 1);
      }
    });

    /* Enter inside a field behaves like Continue, except on the last step */
    form.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.tagName === "INPUT" && i < steps.length - 1) {
        e.preventDefault(); next.click();
      }
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      err.hidden = true;
      var problem = stepOk(i);
      if (problem) { err.textContent = problem; err.hidden = false; return; }
      var data = {};
      Array.prototype.forEach.call(form.querySelectorAll(".wopts"), function (g) { data[g.dataset.name] = g.dataset.value || ""; });
      Array.prototype.forEach.call(form.querySelectorAll("input, textarea"), function (f) { if (f.name) data[f.name] = f.value.trim(); });
      data.page = window.location.pathname;

      submit.disabled = true;
      var label = submit.querySelector(".btn__label");
      var old = label ? label.textContent : "";
      if (label) label.textContent = "Sending...";

      function ok() { box.classList.add("is-sent"); if (done) done.classList.add("is-shown"); }
      function fail() {
        submit.disabled = false;
        if (label) label.textContent = old;
        err.textContent = "Sending failed. Call " + BOOKING_TEL + " or write to " + BOOKING_MAIL + ".";
        err.hidden = false;
      }

      if (!ENDPOINT) {
        /* no backend yet: open the mail client with the whole request */
        window.console.warn("Kimmiy's Rent: ENDPOINT is empty, request handed to the mail client.", data);
        var lines = [
          "Car: " + data.car, "Pick-up: " + data.pickup_date + " " + data.pickup_time,
          "Duration: " + data.duration, "Meeting point: " + data.pickup_location, "",
          "Name: " + data.first_name + " " + data.last_name, "Phone: " + data.phone, "Email: " + data.email,
          "Flight: " + data.flight, "", data.message
        ];
        window.location.href = "mailto:" + BOOKING_MAIL + "?subject=" + encodeURIComponent("Booking request: " + data.car) + "&body=" + encodeURIComponent(lines.join("\n"));
        ok();
        return;
      }

      /* GET with URL params and no-cors: Apps Script redirects every POST
         and sends no CORS headers (same approach as the other sites) */
      var qs = Object.keys(data).map(function (k) { return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]); }).join("&");
      window.fetch(ENDPOINT + "?" + qs, { method: "GET", mode: "no-cors" }).then(ok).catch(fail);
    });

    render();
  })();

  /* ---------- Clock ---------- */
  (function clock() {
    var hh = document.querySelector(".hh"),
        mm = document.querySelector(".mm"),
        ss = document.querySelector(".ss"),
        ampm = document.querySelector(".ampm");
    if (!hh) return;
    function pad(n) { return n.toString().padStart(2, "0"); }
    var prev = {};
    function setSeg(el, key, val) {
      if (prev[key] === val) return;
      prev[key] = val;
      if (hasGsap) {
        var tl = gsap.timeline();
        tl.to(el, { opacity: 0, y: -5, duration: 0.15 })
          .add(function () { el.textContent = val; })
          .to(el, { opacity: 1, y: 0, duration: 0.15 });
      } else {
        el.textContent = val;
      }
    }
    function tick() {
      var now = new Date();
      var h = now.getHours();
      var ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setSeg(hh, "hh", pad(h));
      setSeg(mm, "mm", pad(now.getMinutes()));
      setSeg(ss, "ss", pad(now.getSeconds()));
      setSeg(ampm, "ampm", ap);
    }
    tick();
    setInterval(tick, 1000);
  })();

  /* ---------- Mobile nav ---------- */
  (function nav() {
    var btn = document.getElementById("menu-button");
    var menu = document.getElementById("nav-menu");
    if (!btn || !menu) return;
    function toggle() {
      menu.classList.toggle("nav-open");
      btn.classList.toggle("nav-open-state");
    }
    btn.addEventListener("click", toggle);
    btn.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); }
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        menu.classList.remove("nav-open");
        btn.classList.remove("nav-open-state");
      });
    });
  })();

  /* ---------- Newsletter ---------- */
  (function newsletter() {
    var form = document.getElementById("newsletter-email-form");
    if (!form) return;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = form.parentElement.querySelector(".form-success-message");
      if (ok) ok.style.display = "block";
      form.style.display = "none";
    });
  })();

  /* ---------- FAQ accordion ---------- */
  (function faq() {
    var items = document.querySelectorAll(".faq-dropdown");
    items.forEach(function (item) {
      var toggleEl = item.querySelector(".faq-dropdown-toggle");
      var list = item.querySelector(".faq-dropdown-list");
      if (!toggleEl || !list) return;
      function openItem() {
        item.classList.add("open");
        if (hasGsap) gsap.to(list, { height: "auto", duration: 0.5, ease: "power2.out" });
        else list.style.height = "auto";
      }
      function closeItem() {
        item.classList.remove("open");
        if (hasGsap) gsap.to(list, { height: 0, duration: 0.4, ease: "power2.inOut" });
        else list.style.height = "0px";
      }
      function onToggle() {
        var isOpen = item.classList.contains("open");
        items.forEach(function (other) {
          if (other !== item && other.classList.contains("open")) {
            other.classList.remove("open");
            var ol = other.querySelector(".faq-dropdown-list");
            if (ol) { if (hasGsap) gsap.to(ol, { height: 0, duration: 0.4 }); else ol.style.height = "0px"; }
          }
        });
        if (isOpen) closeItem(); else openItem();
      }
      toggleEl.addEventListener("click", onToggle);
      toggleEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); }
      });
    });
  })();

  /* ---------- Discover cards: blur hover + icon rotate ---------- */
  (function discoverCards() {
    if (!hasGsap) return;
    document.querySelectorAll(".travel-cards-wrap").forEach(function (wrap) {
      var cards = wrap.querySelectorAll(".discover-card-wrap");
      if (!cards.length) return;

      function blurAll() {
        cards.forEach(function (card) {
          var h3 = card.querySelector("h3");
          gsap.to(card, { borderColor: "rgba(0,0,0,0.4)", filter: "blur(5px)", duration: 0.6 });
          if (h3) gsap.to(h3, { color: "rgb(0,0,0)", filter: "blur(5px)", duration: 0.6 });
        });
      }
      function resetIcons() {
        cards.forEach(function (card) {
          var icon = card.querySelector(".comfort-card-icon");
          if (icon) gsap.to(icon, { rotation: -45, duration: 0.6 });
        });
      }
      function resetAll() {
        cards.forEach(function (card) {
          var h3 = card.querySelector("h3");
          var icon = card.querySelector(".comfort-card-icon");
          gsap.to(card, { borderColor: "rgba(255,104,41,1)", filter: "none", duration: 0.6 });
          if (h3) gsap.to(h3, { color: "rgb(0,0,0)", filter: "none", duration: 0.6 });
          if (icon) gsap.to(icon, { rotation: -45, duration: 0.6 });
        });
      }
      var hoverImages = window.matchMedia("(min-width: 768px)");
      function hideImages() {
        if (!hoverImages.matches) return;
        cards.forEach(function (card) {
          var img = card.querySelector(".travel-card-image");
          if (img) gsap.to(img, { opacity: 0, scale: 0.55, rotation: -10, duration: 0.45, ease: "power2.in" });
        });
      }
      function showImage(card) {
        if (!hoverImages.matches) return;
        var img = card.querySelector(".travel-card-image");
        if (img) gsap.to(img, { opacity: 1, scale: 1, rotation: 0, duration: 0.55, ease: "back.out(1.4)" });
      }
      function highlight(card) {
        var h3 = card.querySelector("h3");
        var icon = card.querySelector(".comfort-card-icon");
        gsap.to(card, { borderColor: "rgb(255,104,41)", filter: "none", duration: 0.6 });
        if (h3) gsap.to(h3, { color: "rgb(255,104,41)", filter: "none", duration: 0.6 });
        if (icon) gsap.to(icon, { rotation: 0, duration: 0.6 });
      }
      wrap.addEventListener("mouseenter", function () { if (hoverImages.matches) blurAll(); });
      wrap.addEventListener("mouseleave", function () { if (!hoverImages.matches) return; resetAll(); hideImages(); });
      cards.forEach(function (card) {
        card.addEventListener("mouseenter", function () {
          if (!hoverImages.matches) return;
          blurAll();
          resetIcons();
          hideImages();
          highlight(card);
          showImage(card);
        });
      });
    });
  })();

  if (!hasGsap) return; /* everything below needs GSAP */

  document.documentElement.classList.add("ix-ready");

  /* ---------- Reveal on scroll ---------- */
  gsap.utils.toArray("[data-reveal]").forEach(function (el) {
    if (el.closest(".why-choose-us-cards-wrap")) return;
    if (el.closest(".testimonial-cards-wrap")) return;
    var isHeading = el.classList.contains("section-heading") || el.classList.contains("our-process-heading");
    var delay = el.hasAttribute("data-reveal-delay") ? parseFloat(el.getAttribute("data-reveal-delay")) || 0 : (isHeading ? 0.2 : 0);
    var startAt = el.getAttribute("data-reveal-start") || "70%";
    gsap.fromTo(el,
      { opacity: 0, y: 100 },
      {
        opacity: 1, y: 0, duration: 1, ease: "power4.out",
        delay: delay,
        scrollTrigger: { trigger: el, start: "top " + startAt, once: true }
      });
  });

  /* ---------- Why choose us: staggered card rise ---------- */
  (function whyChoose() {
    var wrap = document.querySelector(".why-choose-us-cards-wrap");
    if (!wrap) return;
    var cards = wrap.querySelectorAll("[data-reveal]");
    gsap.fromTo(cards,
      { opacity: 0, y: 120 },
      {
        opacity: 1, y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.18,
        scrollTrigger: { trigger: wrap, start: "top 82%", once: true }
      });
  })();

  /* ---------- Testimonials: tilted cards rise in ---------- */
  (function testimonials() {
    var wrap = document.querySelector(".testimonial-cards-wrap");
    if (!wrap) return;
    var cards = wrap.querySelectorAll(".testimonial-card-wrap");
    if (!cards.length) return;
    var finalRot = [-8, -4, -8, -4];
    var finalY = [0, 10, 0, 10];
    gsap.matchMedia().add("(min-width: 768px)", function () {
      var tweens = [];
      cards.forEach(function (card, i) {
        tweens.push(gsap.fromTo(card,
          { y: 280, rotation: finalRot[i % 4] - 14, opacity: 0 },
          {
            y: finalY[i % 4], rotation: finalRot[i % 4], opacity: 1,
            duration: 1.1,
            ease: "power3.out",
            delay: i * 0.12,
            scrollTrigger: { trigger: wrap, start: "top 82%", toggleActions: "play none none reverse" }
          }));
      });
      return function () {
        tweens.forEach(function (t) { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
        cards.forEach(function (c) { gsap.set(c, { clearProps: "transform,opacity" }); });
      };
    });
    gsap.matchMedia().add("(max-width: 767px)", function () {
      var tweens = [];
      cards.forEach(function (card) {
        tweens.push(gsap.fromTo(card,
          { opacity: 0, y: 60 },
          {
            opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
            scrollTrigger: { trigger: card, start: "top 92%", once: true }
          }));
      });
      return function () {
        tweens.forEach(function (t) { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
        cards.forEach(function (c) { gsap.set(c, { clearProps: "transform,opacity" }); });
      };
    });
  })();

  /* ---------- Gray-to-black paragraph on scroll ---------- */
  (function grayToBlack() {
    var p = document.querySelector(".gray-to-black-scroll");
    if (!p) return;
    function splitWords(node) {
      var out = [];
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (/^\s+$/.test(part) || part === "") {
              frag.appendChild(document.createTextNode(part));
            } else {
              var span = document.createElement("span");
              span.className = "gtb-word";
              span.textContent = part;
              frag.appendChild(span);
              out.push(span);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          out = out.concat(splitWords(child));
        }
      });
      return out;
    }
    var words = splitWords(p);
    gsap.fromTo(words,
      { color: "#c6c6c6" },
      {
        color: "#000000",
        stagger: 0.06,
        ease: "none",
        scrollTrigger: {
          trigger: p.closest(".about-us-section") || p,
          start: "top 60%",
          end: "+=60%",
          scrub: true
        }
      });
  })();

  /* ---------- About marquee + footer marquee ---------- */
  function marquee(el, speed) {
    if (!el) return;
    var half = el.scrollWidth / el.children.length * Math.floor(el.children.length / 2);
    if (!half) return;
    gsap.to(el, {
      x: -half,
      duration: speed,
      ease: "none",
      repeat: -1,
      modifiers: {
        x: function (x) { return (parseFloat(x) % half) + "px"; }
      }
    });
  }
  marquee(document.querySelector(".about-us-text-slider-wrap"), 28);
  marquee(document.querySelector(".kimmys-footer-marquee"), 24);

  /* ================= About page ================= */

  /* ---------- Banner marquee (orange band) ---------- */
  marquee(document.querySelector(".about-marquee-track"), 30);

  /* ---------- Who we are: white overlay slides off each image once it is
     half way into view (source: height 100% -> 0, 500ms, 300ms delay) ---------- */
  (function whoWeAre() {
    var wraps = document.querySelectorAll(".who-we-are-image-wrap .appear-image-wrapper");
    if (!wraps.length) return;
    gsap.matchMedia().add("(min-width: 992px)", function () {
      var tweens = [];
      wraps.forEach(function (wrap) {
        var overlay = wrap.querySelector(".appear-image-overlay");
        if (!overlay) return;
        tweens.push(gsap.fromTo(overlay,
          { scaleY: 1 },
          {
            scaleY: 0, ease: "power1.inOut", duration: 0.5, delay: 0.3,
            scrollTrigger: { trigger: wrap, start: "top 50%", once: true }
          }));
      });
      return function () {
        tweens.forEach(function (t) { t.scrollTrigger && t.scrollTrigger.kill(); t.kill(); });
        wraps.forEach(function (w) { gsap.set(w.querySelectorAll(".appear-image-overlay"), { clearProps: "all" }); });
      };
    });
  })();

  /* ---------- Why choose us deck: the four cards start gathered in the middle
     of the row (shifted up a quarter) and spread to their slots between 25% and
     85% of the section's scroll (source template keyframes, smoothing 85) ---------- */
  (function travelDrive() {
    var section = document.querySelector(".travel-drive-choose-us-section");
    if (!section) return;
    var cards = [
      section.querySelector(".travel-card-one"),
      section.querySelector(".travel-card-two"),
      section.querySelector(".travel-card-three"),
      section.querySelector(".travel-card-four")
    ].filter(Boolean);
    if (cards.length < 4) return;
    var startX = [75, 25, -25, -75];
    var heading = section.querySelector(".travel-drive-heading-wrap");
    var cardsWrap = section.querySelector(".drive-travel-cards-wrap");
    gsap.matchMedia().add("(min-width: 992px)", function () {
      /* the template lifts the gathered cards by a quarter of their height,
         which runs them over the heading; cap the lift at the free space
         between heading and cards so the title always stays readable */
      var lift = cards[0].offsetHeight * 0.25;
      if (heading && cardsWrap) {
        var room = cardsWrap.getBoundingClientRect().top - heading.getBoundingClientRect().bottom - 8;
        lift = Math.max(0, Math.min(lift, room));
      }
      var tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.6 }
      });
      cards.forEach(function (card, i) {
        tl.fromTo(card,
          { xPercent: startX[i], y: -lift },
          { xPercent: 0, y: 0, ease: "none", duration: 0.6 },
          0.25);
      });
      /* keyframes at 25% and 85% of a 0-1 timeline: hold before, hold after */
      tl.to({}, { duration: 0.15 });
      return function () {
        tl.scrollTrigger && tl.scrollTrigger.kill();
        tl.kill();
        gsap.set(cards, { clearProps: "transform" });
      };
    });
  })();

  /* ---------- Our process: row two starts 25% towards the middle, row three
     50%, and they slide out to their slots between 40-53% and 58-73% of the
     section's scroll (source template keyframes, smoothing 86) ---------- */
  (function processCards() {
    var section = document.querySelector(".our-process-section");
    if (!section) return;
    var pairs = [
      { els: [section.querySelector(".process-card-two"), section.querySelector(".process-card-three")], from: [25, -25], at: 0.40, to: 0.53 },
      { els: [section.querySelector(".process-card-four"), section.querySelector(".process-card-five")], from: [50, -50], at: 0.58, to: 0.73 }
    ];
    if (pairs.some(function (p) { return p.els.some(function (e) { return !e; }); })) return;
    gsap.matchMedia().add("(min-width: 992px)", function () {
      var tl = gsap.timeline({
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: 0.7 }
      });
      pairs.forEach(function (p) {
        p.els.forEach(function (el, i) {
          tl.fromTo(el, { xPercent: p.from[i] }, { xPercent: 0, ease: "none", duration: p.to - p.at }, p.at);
        });
      });
      tl.to({}, { duration: 1 - pairs[pairs.length - 1].to });
      return function () {
        tl.scrollTrigger && tl.scrollTrigger.kill();
        tl.kill();
        pairs.forEach(function (p) { gsap.set(p.els, { clearProps: "transform" }); });
      };
    });
  })();

  /* ---------- Drive circle reveal ---------- */
  (function drive() {
    var section = document.querySelector(".drive-section");
    var overlay = document.querySelector(".drive-heading-overlay");
    var heading = document.querySelector(".drive-heading");
    if (!section || !overlay) return;
    var tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: "top top", end: "bottom bottom", scrub: true }
    });
    tl.fromTo(overlay, { clipPath: "circle(8% at 50% 50%)" }, { clipPath: "circle(75% at 50% 50%)", ease: "none" }, 0)
      .fromTo(heading, { scale: 0.6 }, { scale: 1, ease: "none" }, 0);
  })();

  /* ---------- Featured model tabs (scroll driven) ---------- */
  (function featuredTabs() {
    var section = document.querySelector(".featured-model-layout");
    if (!section) return;
    var groups = [
      document.querySelectorAll(".tab-text-content-wrap"),
      document.querySelectorAll(".model-small-image-wrap")
    ];
    var midImgs = [
      document.querySelector(".middle-wrap .model-tab-image-wrap.one"),
      document.querySelector(".middle-wrap .model-tab-image-wrap.two"),
      document.querySelector(".middle-wrap .model-tab-image-wrap.three")
    ];
    var order = ["one", "two", "three"];
    var current = -1;
    function setActive(i) {
      if (i === current) return;
      current = i;
      groups.forEach(function (nodes) {
        nodes.forEach(function (node) {
          var isTarget = node.classList.contains(order[i]);
          if (isTarget && !node.classList.contains("is-active")) {
            node.classList.add("is-active");
            gsap.fromTo(node, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power1.out", overwrite: true });
          } else if (!isTarget && node.classList.contains("is-active")) {
            node.classList.remove("is-active");
            gsap.to(node, { opacity: 0, duration: 0.3, overwrite: true, onComplete: function () { gsap.set(node, { clearProps: "opacity" }); } });
          }
        });
      });
    }
    setActive(0);
    function setClips(p3) {
      /* image 2 wipes in from the right between 0.65-1.35, image 3 between 1.65-2.35 */
      var c2 = gsap.utils.clamp(0, 100, 100 - ((p3 - 0.65) / 0.7) * 100);
      var c3 = gsap.utils.clamp(0, 100, 100 - ((p3 - 1.65) / 0.7) * 100);
      if (midImgs[1]) gsap.set(midImgs[1], { clipPath: "inset(0% 0% 0% " + c2 + "%)" });
      if (midImgs[2]) gsap.set(midImgs[2], { clipPath: "inset(0% 0% 0% " + c3 + "%)" });
    }
    var sectionST = null;
    gsap.matchMedia().add("(min-width: 768px)", function () {
      setClips(0);
      sectionST = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: function (self) {
          var p3 = self.progress * 3;
          setClips(p3);
          setActive(p3 < 1 ? 0 : p3 < 2 ? 1 : 2);
        }
      });
      return function () { sectionST.kill(); sectionST = null; };
    });
    document.querySelectorAll(".models-tab-link[data-tab]").forEach(function (link) {
      link.addEventListener("click", function () {
        var i = parseInt(link.getAttribute("data-tab"), 10);
        if (sectionST) {
          /* jump the page instantly (bypassing CSS smooth scrolling) to the
             scroll position of that tab; the section is sticky, so the user
             sees only the tab change, never the page travelling */
          var targetProgress = i === 0 ? 0.17 : i === 1 ? 0.5 : 0.83;
          var y = sectionST.start + (sectionST.end - sectionST.start) * targetProgress;
          window.scrollTo(0, y);
          ScrollTrigger.update();
        } else {
          setActive(i);
        }
      });
    });
  })();

  /* ---------- Core services deck ---------- */
  (function services() {
    var layout = document.querySelector(".core-services-layout");
    if (!layout) return;
    gsap.matchMedia().add("(min-width: 768px)", function () {
      var cards = [
        document.querySelector(".core-service-one"),
        document.querySelector(".core-service-two"),
        document.querySelector(".core-service-three")
      ].filter(Boolean);
      var tl = gsap.timeline({
        scrollTrigger: { trigger: layout, start: "top top", end: "bottom bottom", scrub: true }
      });
      cards.forEach(function (card, i) {
        tl.to(card, { xPercent: -170, ease: "power1.in", duration: 1 }, i * 1 + 0.4);
      });
      return function () {
        tl.scrollTrigger && tl.scrollTrigger.kill();
        tl.kill();
        cards.forEach(function (c) { gsap.set(c, { clearProps: "all" }); });
      };
    });
  })();

  /* ---------- How it works: cards reveal sequentially ---------- */
  (function howItWorks() {
    var section = document.querySelector(".how-it-works-section");
    if (!section) return;
    var cards = [
      ".how-it-works-card-one", ".how-it-works-card-two",
      ".how-it-works-card-three", ".how-it-works-card-four"
    ].map(function (s) { return document.querySelector(s); }).filter(Boolean);
    gsap.matchMedia().add("(min-width: 768px)", function () {
      /* each card snaps in with its own quick tween once scroll passes its threshold,
         and reverses if you scroll back above it */
      var thresholds = [0.12, 0.32, 0.52, 0.72];
      var shown = [false, false, false, false];
      gsap.set(cards, { opacity: 0, y: 80 });
      var st = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: function (self) {
          cards.forEach(function (card, i) {
            if (self.progress >= thresholds[i] && !shown[i]) {
              shown[i] = true;
              gsap.to(card, { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", overwrite: true });
            } else if (self.progress < thresholds[i] && shown[i]) {
              shown[i] = false;
              gsap.to(card, { opacity: 0, y: 80, duration: 0.4, ease: "power2.in", overwrite: true });
            }
          });
        }
      });
      return function () {
        st.kill();
        cards.forEach(function (c) { gsap.set(c, { clearProps: "all" }); });
      };
    });
  })();

  /* ---------- Insights heading: blur builds up through scroll ---------- */
  (function insightsBlur() {
    var heading = document.querySelector(".numbers-heading-wrap .h2.section-heading");
    var cardsWrap = document.querySelector(".number-cards-wrap");
    if (!heading || !cardsWrap) return;
    gsap.fromTo(heading,
      { filter: "blur(0px)", opacity: 1 },
      {
        filter: "blur(9px)",
        opacity: 0.55,
        ease: "none",
        scrollTrigger: {
          trigger: cardsWrap,
          start: "top 45%",
          end: "top 5%",
          scrub: true
        }
      });
  })();

  /* ---------- Counters ---------- */
  document.querySelectorAll(".counter").forEach(function (counter) {
    var target = parseInt(counter.getAttribute("data-target"), 10) || 0;
    gsap.fromTo(counter,
      { innerText: 0 },
      {
        innerText: target,
        duration: 2,
        ease: "power1.out",
        snap: { innerText: 1 },
        scrollTrigger: { trigger: counter, start: "top 85%", once: true },
        onUpdate: function () { counter.innerText = Math.floor(counter.innerText); }
      });
  });

  /* ---------- Hero intro timeline ---------- */
  (function hero() {
    var h1 = document.querySelector(".home-banner-section .h1");
    if (!h1) return;
  })();

  /* Keep ScrollTrigger measurements correct: lazy images shift the layout
     after load, so refresh once everything settles and after each late image.
     Never refresh WHILE the user is scrolling — a mid-scroll refresh causes
     a visible hitch — wait for the scroll to go idle first. */
  ScrollTrigger.config({ ignoreMobileResize: true });
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  var lastScrollAt = 0;
  window.addEventListener("scroll", function () { lastScrollAt = Date.now(); }, { passive: true });
  var refreshT;
  function queueRefresh() {
    clearTimeout(refreshT);
    refreshT = setTimeout(function () {
      if (Date.now() - lastScrollAt < 400) { queueRefresh(); return; }
      ScrollTrigger.refresh();
    }, 400);
  }
  document.querySelectorAll("img").forEach(function (img) {
    if (!img.complete) img.addEventListener("load", queueRefresh);
  });
})();
