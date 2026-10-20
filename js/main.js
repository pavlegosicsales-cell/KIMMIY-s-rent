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
     by resetting again right after load. */
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  if (!location.hash) {
    window.scrollTo(0, 0);
    window.addEventListener("load", function () {
      window.scrollTo(0, 0);
      setTimeout(function () {
        window.scrollTo(0, 0);
        if (typeof ScrollTrigger !== "undefined") ScrollTrigger.update();
      }, 60);
    });
  }

  var isDesktop = function () { return window.matchMedia("(min-width: 768px)").matches; };

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
    gsap.fromTo(el,
      { opacity: 0, y: 30 },
      {
        opacity: 1, y: 0, duration: 0.9, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
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
            scrollTrigger: { trigger: wrap, start: "top 85%", once: true }
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
          /* jump the page to the scroll position of that tab so further
             scrolling continues forward instead of replaying earlier tabs */
          var targetProgress = i === 0 ? 0.17 : i === 1 ? 0.5 : 0.83;
          var y = sectionST.start + (sectionST.end - sectionST.start) * targetProgress;
          window.scrollTo({ top: y, behavior: "auto" });
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
     after load, so refresh once everything settles and after each late image. */
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  var refreshT;
  function queueRefresh() {
    clearTimeout(refreshT);
    refreshT = setTimeout(function () { ScrollTrigger.refresh(); }, 250);
  }
  document.querySelectorAll("img").forEach(function (img) {
    if (!img.complete) img.addEventListener("load", queueRefresh);
  });
})();
