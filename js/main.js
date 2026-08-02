/* =========================================================
   [Your Name] — Portfolio · motion layer
   GSAP + ScrollTrigger + Lenis. No build step required.
   ========================================================= */

/* ---------------------------------------------------------
   0. SAFETY NET — never let a missing lib freeze the page.
   If GSAP failed to load, reveal everything and bail.
--------------------------------------------------------- */
const HAS_GSAP = typeof gsap !== "undefined";
const HAS_LENIS = typeof Lenis !== "undefined";

if (!HAS_GSAP) {
  console.warn("[portfolio] GSAP not loaded — falling back to static layout.");
  const pre = document.getElementById("preloader");
  if (pre) pre.style.display = "none";
  document.querySelectorAll("[data-reveal]").forEach((el) => (el.style.opacity = 1));
  // stop here; nothing below can run without gsap
  throw new Error("GSAP unavailable");
}

gsap.registerPlugin(ScrollTrigger);

const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(hover: none)").matches;

/* ---------------------------------------------------------
   1. SMOOTH SCROLL (Lenis) synced with ScrollTrigger
--------------------------------------------------------- */
let lenis;
if (!prefersReduced && HAS_LENIS) {
  lenis = new Lenis({ duration: 1.1, easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)) });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* anchor links go through Lenis */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href");
    if (id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    document.body.classList.remove("menu-open");
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.3 });
    else target.scrollIntoView({ behavior: "smooth" });
  });
});

/* ---------------------------------------------------------
   2. SMALL UTILITY — split text into word / line wrappers
--------------------------------------------------------- */
function splitToLines(el) {
  // Wrap the element's text so each "line" element animates from below.
  const inner = el.innerHTML;
  el.innerHTML = `<span class="split-inner">${inner}</span>`;
  el.classList.add("split-line");
  return el.querySelector(".split-inner");
}

function splitToWords(el) {
  const text = el.textContent.trim().split(/\s+/);
  el.innerHTML = text
    .map((w) => `<span class="word-mask"><span class="word">${w}</span></span>`)
    .join(" ");
  return el.querySelectorAll(".word");
}

/* ---------------------------------------------------------
   3. PRELOADER → hero intro
--------------------------------------------------------- */
function runIntro() {
  // hero lines
  document.querySelectorAll(".hero__title [data-split]").forEach((line) => {
    const inner = splitToLines(line);
    gsap.set(inner, { yPercent: 110 });
  });

  const tl = gsap.timeline();
  tl.to(".hero__title .split-inner", {
    yPercent: 0, duration: 1.1, stagger: 0.09, ease: "expo.out",
    // once revealed, stop clipping so descenders (g, p) + italic overhang show
    onComplete: () => gsap.set(".hero__title .line", { overflow: "visible" }),
  })
    .from(".hero__top [data-reveal], .hero__bottom [data-reveal]",
      { y: 20, opacity: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }, "-=0.7");
}

function preloader() {
  const countNum = document.getElementById("preloaderCountNum");
  const ring = document.getElementById("plRing");
  const pre = document.getElementById("preloader");

  if (prefersReduced) {
    pre.style.display = "none";
    runIntro();
    return;
  }

  const circ = 2 * Math.PI * 60; // r = 60 in the SVG viewBox
  gsap.set(ring, { attr: { "stroke-dasharray": circ, "stroke-dashoffset": circ } });

  const counter = { v: 0 };
  gsap.timeline()
    // lines + mark draw in
    .from(".pl-line--h", { scaleX: 0, duration: 0.8, ease: "expo.out" }, 0)
    .from(".pl-line--v", { scaleY: 0, duration: 0.8, ease: "expo.out" }, 0)
    .from(".pl-mark", { scale: 0.7, opacity: 0, duration: 0.7, ease: "expo.out" }, 0.1)
    // ring draws + counter ticks
    .to(counter, {
      v: 100, duration: 2.4, ease: "power2.inOut",
      onUpdate: () => {
        countNum.textContent = Math.round(counter.v);
        ring.setAttribute("stroke-dashoffset", circ * (1 - counter.v / 100));
      },
    }, 0.35)
    // a small settle, then everything fades and the panels split apart
    .to(".pl-mark", { scale: 1.06, duration: 0.5, ease: "power2.inOut" })
    .to(".preloader__content", { opacity: 0, duration: 0.45, ease: "power2.in" }, ">-0.1")
    .to(".pl-panel--top", { yPercent: -100, duration: 1, ease: "expo.inOut" }, "<0.05")
    .to(".pl-panel--bottom", {
      yPercent: 100, duration: 1, ease: "expo.inOut",
      onComplete: () => (pre.style.display = "none"),
    }, "<")
    .add(runIntro, "<0.35");
}

/* ---------------------------------------------------------
   4. SCROLL REVEALS
--------------------------------------------------------- */
function scrollReveals() {
  // generic fade-up
  gsap.utils.toArray("[data-reveal]").forEach((el) => {
    if (el.closest(".hero")) return; // hero handled by intro
    gsap.from(el, {
      y: 40, opacity: 0, duration: 1, ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  // section headline lines (contact big text)
  document.querySelectorAll(".contact__big [data-split]").forEach((line) => {
    const inner = splitToLines(line);
    gsap.set(inner, { yPercent: 110 });
    gsap.to(inner, {
      yPercent: 0, duration: 1, ease: "expo.out",
      scrollTrigger: { trigger: ".contact__big", start: "top 80%" },
      onComplete: () => gsap.set(line, { overflow: "visible" }), // unclip descenders/italics
    });
  });

  // any [data-words] block: words fade from dim → full as you scroll through.
  // Opacity (not colour) keeps it correct in both light and dark themes.
  gsap.utils.toArray("[data-words]").forEach((el) => {
    const words = splitToWords(el);
    gsap.set(words, { opacity: 0.22 });
    gsap.to(words, {
      opacity: 1, ease: "none", stagger: 0.4,
      scrollTrigger: { trigger: el, start: "top 80%", end: "center center", scrub: true },
    });
  });

  // work rows slide in
  gsap.utils.toArray(".work__item").forEach((item) => {
    gsap.from(item, {
      y: 30, opacity: 0, duration: 0.8, ease: "power3.out",
      scrollTrigger: { trigger: item, start: "top 90%" },
    });
  });
}

/* ---------------------------------------------------------
   5. MARQUEE — seamless loop + scroll-velocity skew
--------------------------------------------------------- */
function marquee() {
  const tracks = document.querySelectorAll("[data-marquee]");
  if (!tracks.length) return;
  const loops = [];
  tracks.forEach((track) => {
    const dir = parseFloat(track.dataset.marquee) || 1;
    gsap.set(track, { xPercent: dir < 0 ? -50 : 0 });
    loops.push(
      gsap.to(track, {
        xPercent: dir < 0 ? 0 : -50,
        duration: 26, ease: "none", repeat: -1,
      })
    );
  });
  if (lenis) {
    lenis.on("scroll", (e) => {
      const boost = gsap.utils.clamp(0, 5, Math.abs((e.velocity || 0) * 0.25));
      loops.forEach((l) => l.timeScale(1 + boost));
    });
  }
}

/* ---------------------------------------------------------
   6. CUSTOM CURSOR
--------------------------------------------------------- */
function cursor() {
  if (isTouch) return;
  const cap = document.getElementById("cursorCapsule");
  const dot = document.getElementById("cursorDot");
  const badge = document.getElementById("cursorBadge");
  const label = document.getElementById("cursorLabel");
  if (!cap) return;

  gsap.set(cap, { xPercent: -50, yPercent: -50, force3D: true, opacity: 0 });
  if (dot) gsap.set(dot, { xPercent: -50, yPercent: -50, force3D: true, opacity: 0 });
  if (badge) gsap.set(badge, { xPercent: -50, yPercent: -50, scale: 0.4, opacity: 0, force3D: true });

  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  const cp = { x: mouse.x, y: mouse.y };
  const bp = { x: mouse.x, y: mouse.y };
  let visible = false;
  let wrapEl = null; // element the cursor is currently "wrapping"

  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (!visible) { gsap.to([cap, dot].filter(Boolean), { opacity: 1, duration: 0.4 }); visible = true; }
  });
  window.addEventListener("mouseleave", () => {
    gsap.to([cap, dot].filter(Boolean), { opacity: 0, duration: 0.3 }); visible = false;
  });
  window.addEventListener("mousedown", () => { if (!wrapEl) gsap.to(cap, { scale: 0.8, duration: 0.15 }); });
  window.addEventListener("mouseup", () => gsap.to(cap, { scale: 1, duration: 0.2 }));

  // one ticker, transforms only → smooth. The dot leads (tracks tight); the cat
  // trails behind it. While wrapping, the cat snaps to the element's centre.
  let hitFrame = 0;
  gsap.ticker.add(() => {
    // every few frames, re-derive the hover target from whatever is under the
    // cursor — independent of mouse/scroll events, so it can never get stuck.
    if (++hitFrame % 4 === 0) syncCursor();

    if (dot) gsap.set(dot, { x: mouse.x, y: mouse.y });

    let tx = mouse.x, ty = mouse.y, f = 0.16; // cat trails for a "follow" feel
    if (wrapEl) {
      const r = wrapEl.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      tx = cx + (mouse.x - cx) * 0.15;
      ty = cy + (mouse.y - cy) * 0.15;
      f = 0.28;
    }
    cp.x += (tx - cp.x) * f;
    cp.y += (ty - cp.y) * f;
    gsap.set(cap, { x: cp.x, y: cp.y });
    if (badge) {
      bp.x += (mouse.x - bp.x) * 0.18;
      bp.y += (mouse.y - bp.y) * 0.18;
      gsap.set(badge, { x: bp.x, y: bp.y });
    }
  });

  const clearStates = () => cap.classList.remove("is-hover", "is-big", "is-label", "is-wrap");
  const SELECTOR = "a, button, [data-magnetic], [data-cursor]";
  let target = null;

  // single source of truth for the cursor's state; safe to call repeatedly
  const applyTarget = (el) => {
    if (el === target) return;
    target = el;

    // reset to default
    clearStates();
    if (wrapEl) { wrapEl = null; cap.style.width = ""; cap.style.height = ""; cap.style.borderRadius = ""; }
    label.textContent = "";
    if (badge) gsap.to(badge, { scale: 0.4, opacity: 0, duration: 0.3, ease: "power2.in" });
    gsap.to(cap, { opacity: visible ? 1 : 0, duration: 0.25 });

    if (!el) return;
    const txt = el.getAttribute("data-cursor");
    if (txt === "project") {
      gsap.to(cap, { opacity: 0, duration: 0.25 });
      if (badge) gsap.to(badge, { scale: 1, opacity: 1, duration: 0.4, ease: "power3.out" });
    } else if (txt === "wrap") {
      // snap to wrap the whole element with an elastic jerk; roomy soft capsule
      wrapEl = el;
      const r = el.getBoundingClientRect();
      const h = r.height + 26;
      cap.classList.add("is-wrap");
      cap.style.width = r.width + 40 + "px";
      cap.style.height = h + "px";
      cap.style.borderRadius = h / 2 + "px";
    } else if (txt === "big") {
      cap.classList.add("is-big");
    } else if (txt) {
      label.textContent = txt; cap.classList.add("is-label");
    } else {
      cap.classList.add("is-hover");
    }
  };

  document.querySelectorAll(SELECTOR).forEach((el) => {
    el.addEventListener("mouseenter", () => applyTarget(el));
    el.addEventListener("mouseleave", () => { if (target === el) applyTarget(null); });
  });

  // fast scroll drops mouseenter/leave, so re-derive the cursor's target from
  // whatever is actually under it on every scroll.
  const syncCursor = () => {
    const el = document.elementFromPoint(mouse.x, mouse.y);
    applyTarget(el && el.closest ? el.closest(SELECTOR) : null);
  };
  window.addEventListener("scroll", syncCursor, { passive: true });
  if (lenis) lenis.on("scroll", syncCursor);
}

/* ---------------------------------------------------------
   7. MAGNETIC BUTTONS
--------------------------------------------------------- */
function magnetic() {
  if (isTouch) return;
  document.querySelectorAll("[data-magnetic]").forEach((el) => {
    const strength = 0.4;
    el.addEventListener("mousemove", (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) * strength;
      const y = (e.clientY - (r.top + r.height / 2)) * strength;
      gsap.to(el, { x, y, duration: 0.5, ease: "power3.out" });
    });
    el.addEventListener("mouseleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.6, ease: "elastic.out(1, 0.4)" });
    });
  });
}

/* ---------------------------------------------------------
   8. WORK LIST — image preview follows cursor
--------------------------------------------------------- */
function workPreview() {
  if (isTouch) return;
  const preview = document.getElementById("workPreview");
  const items = document.querySelectorAll(".work__item");
  if (!preview) return;

  // centre on the cursor + start hidden/small — all via GSAP transforms
  gsap.set(preview, { xPercent: -50, yPercent: -50, scale: 0.85, opacity: 0, force3D: true });

  // quickTo = snappy, GPU-smoothed follow (no CSS transition to fight it now)
  const xTo = gsap.quickTo(preview, "x", { duration: 0.3, ease: "power3" });
  const yTo = gsap.quickTo(preview, "y", { duration: 0.3, ease: "power3" });
  const rTo = gsap.quickTo(preview, "rotation", { duration: 0.5, ease: "power3" });
  let prev = innerWidth / 2;
  let mx = innerWidth / 2, my = innerHeight / 2;
  window.addEventListener("mousemove", (e) => {
    mx = e.clientX; my = e.clientY;
    xTo(e.clientX);
    yTo(e.clientY);
    rTo(gsap.utils.clamp(-10, 10, (e.clientX - prev) * 0.35)); // lean into the motion
    prev = e.clientX;
  });

  // Hard guarantee: the preview may only exist while the projects section is on
  // screen. If .work isn't in view, it's force-hidden and can't be shown.
  const workSection = document.querySelector(".work");
  let workInView = true;
  if (workSection) {
    ScrollTrigger.create({
      trigger: workSection, start: "top bottom", end: "bottom top",
      onToggle: (self) => { workInView = self.isActive; if (!self.isActive) forceHide(); },
    });
  }

  let shown = false, curColor = null;
  const show = (color) => {
    if (!workInView) return;
    if (color && color !== curColor) {
      preview.style.background = `linear-gradient(135deg, ${color}, ${shade(color, -25)})`;
      curColor = color;
    }
    if (shown) return;
    shown = true;
    gsap.to(preview, { opacity: 1, scale: 1, duration: 0.4, ease: "power3.out" });
  };
  const hide = () => {
    if (!shown) return;
    shown = false; curColor = null;
    gsap.to(preview, { opacity: 0, scale: 0.85, duration: 0.35, ease: "power2.in" });
  };
  function forceHide() { shown = false; curColor = null; gsap.set(preview, { opacity: 0, scale: 0.85 }); }

  items.forEach((item) => {
    item.addEventListener("mouseenter", () => show(item.getAttribute("data-preview-color") || "#bbb"));
    item.addEventListener("mouseleave", hide);
  });

  // Source of truth: whatever is actually under the cursor, re-checked every
  // frame via the render loop (not events) so it can never get stuck.
  const sync = () => {
    if (!workInView) { if (shown) hide(); return; }
    const el = document.elementFromPoint(mx, my);
    const item = el && el.closest ? el.closest(".work__item") : null;
    if (item) show(item.getAttribute("data-preview-color") || "#bbb");
    else hide();
  };
  gsap.ticker.add(sync);
}

function shade(hex, amt) {
  const n = parseInt(hex.replace("#", ""), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

/* ---------------------------------------------------------
   9. SCROLL PROGRESS BAR
--------------------------------------------------------- */
function progress() {
  const bar = document.getElementById("scrollProgress");
  gsap.to(bar, {
    scaleX: 1, ease: "none",
    scrollTrigger: { trigger: document.body, start: "top top", end: "bottom bottom", scrub: 0.3 },
  });
}

/* ---------------------------------------------------------
   10. MOBILE MENU
--------------------------------------------------------- */
function mobileMenu() {
  const burger = document.getElementById("burger");
  if (!burger) return;
  burger.addEventListener("click", () => document.body.classList.toggle("menu-open"));
  document.querySelectorAll("[data-menu-link]").forEach((a) =>
    a.addEventListener("click", () => document.body.classList.remove("menu-open"))
  );
}

/* ---------------------------------------------------------
   10b. THEME TOGGLE (persisted, no flash)
--------------------------------------------------------- */
function themeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const dark = document.documentElement.dataset.theme === "dark";
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (e) {}
    ScrollTrigger.refresh(); // recalc after the colour transition
  });
}

/* ---------------------------------------------------------
   11. MISC — year + local time
--------------------------------------------------------- */
function footerInfo() {
  const y = document.getElementById("year");
  const t = document.getElementById("localTime");
  const now = new Date();
  if (y) y.textContent = now.getFullYear();
  if (t) {
    const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    t.textContent = `[Pune] — ${time} local`;
  }
}

/* ---------------------------------------------------------
   12. PARALLAX — gentle depth on tagged elements
--------------------------------------------------------- */
function parallax() {
  if (prefersReduced) return;
  gsap.utils.toArray("[data-parallax]").forEach((el) => {
    const amt = parseFloat(el.getAttribute("data-parallax")) || 30;
    gsap.to(el, {
      y: amt, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
    });
  });
}

/* ---------------------------------------------------------
   13. AUTO-HIDING NAV (hide on scroll down, reveal on up)
--------------------------------------------------------- */
function navHide() {
  const nav = document.getElementById("nav");
  if (!nav) return;
  let last = 0;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (self) => {
      const y = self.scroll();
      const goingDown = y > last && y > 240;
      gsap.to(nav, { yPercent: goingDown ? -130 : 0, duration: 0.45, ease: "power3.out" });
      // frosted bar once we leave the hero; transparent blend at the very top
      nav.classList.toggle("is-scrolled", y > 80);
      last = y;
    },
  });
}

/* ---------------------------------------------------------
   14. PANEL REVEAL — dark section slides up with rounded top
--------------------------------------------------------- */
function panelReveal() {
  if (prefersReduced) return;
  const panel = document.querySelector(".services");
  if (!panel) return;
  gsap.fromTo(panel,
    { borderTopLeftRadius: 80, borderTopRightRadius: 80 },
    {
      borderTopLeftRadius: 0, borderTopRightRadius: 0, ease: "none",
      scrollTrigger: { trigger: panel, start: "top bottom", end: "top center", scrub: true },
    }
  );
}

/* ---------------------------------------------------------
   15. MARQUEE SECTION HEADINGS — slight horizontal drift
--------------------------------------------------------- */
function headingDrift() {
  if (prefersReduced) return;
  gsap.utils.toArray(".statement__text").forEach((el) => {
    gsap.from(el, {
      x: -40, ease: "none",
      scrollTrigger: { trigger: el, start: "top bottom", end: "top center", scrub: true },
    });
  });
}

/* ---------------------------------------------------------
   17. GIANT FOOTER NAME — letters rise in on scroll
--------------------------------------------------------- */
function megaName() {
  const mega = document.querySelector("[data-mega]");
  if (!mega) return;
  const text = mega.textContent.trim();
  mega.innerHTML = text
    .split("")
    .map((c) => `<span class="mega-mask"><span class="mega-char">${c === " " ? "&nbsp;" : c}</span></span>`)
    .join("");
  const chars = mega.querySelectorAll(".mega-char");
  const masks = mega.querySelectorAll(".mega-mask");
  if (prefersReduced) { gsap.set(masks, { overflow: "visible" }); return; }
  gsap.set(chars, { yPercent: 110 });
  gsap.to(chars, {
    yPercent: 0, duration: 1, ease: "expo.out", stagger: 0.04,
    scrollTrigger: { trigger: mega, start: "top 92%" },
    onComplete: () => gsap.set(masks, { overflow: "visible" }), // unclip the [ ] brackets
  });
}

/* ---------------------------------------------------------
   18. STATS — numbers count up when they enter view
--------------------------------------------------------- */
function statsCounters() {
  gsap.utils.toArray("[data-count]").forEach((el) => {
    const end = parseFloat(el.getAttribute("data-count")) || 0;
    const obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el, start: "top 88%", once: true,
      onEnter: () =>
        gsap.to(obj, {
          v: end, duration: 1.8, ease: "power2.out",
          onUpdate: () => (el.textContent = Math.round(obj.v)),
        }),
    });
  });
}

/* ---------------------------------------------------------
   19. HORIZONTAL PINNED GALLERY (desktop) / swipe (mobile)
--------------------------------------------------------- */
function horizontalGallery() {
  const track = document.getElementById("galleryTrack");
  const section = document.getElementById("gallery");
  if (!track || !section) return;
  // mobile / reduced motion → leave it as a native horizontal scroll strip
  if (prefersReduced || isTouch || innerWidth < 760) {
    section.querySelector(".gallery__viewport").style.overflowX = "auto";
    return;
  }
  const travel = () => Math.max(0, track.scrollWidth - innerWidth + 40);
  gsap.to(track, {
    x: () => -travel(),
    ease: "none",
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => "+=" + travel(),
      scrub: 1,
      pin: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
}

/* ---------------------------------------------------------
   INIT
--------------------------------------------------------- */
window.addEventListener("DOMContentLoaded", () => {
  preloader();
  scrollReveals();
  marquee();
  cursor();
  magnetic();
  workPreview();
  progress();
  mobileMenu();
  themeToggle();
  footerInfo();
  parallax();
  navHide();
  panelReveal();
  headingDrift();
  megaName();
  statsCounters();
  horizontalGallery();
  ScrollTrigger.refresh();
});
