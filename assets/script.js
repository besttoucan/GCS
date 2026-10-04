// Genesis Core Systems: site script (no dependencies)

(function () {
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Explicit `behavior: "smooth"` in scrollTo() overrides the CSS reduced-motion
  // rule, so JS-driven scrolls ask this instead.
  const SCROLL_BEHAVIOR = reduceMotion ? "auto" : "smooth";

  // ---- Mobile nav ----
  // Toggling .open on the menu also toggles .nav-open on <body>, which turns the
  // header solid while the menu is open over the transparent homepage hero, and
  // .nav-locked on <html>, which stops the page scrolling underneath it.
  const navLinks = document.querySelector(".nav-links");
  const navToggle = document.querySelector("[data-nav-toggle]");
  const ICON_MENU = navToggle ? navToggle.innerHTML : "";
  const ICON_CLOSE =
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">' +
    '<line x1="5" y1="5" x2="19" y2="19"/><line x1="19" y1="5" x2="5" y2="19"/></svg>';
  const isNavOpen = () => document.body.classList.contains("nav-open");
  // Older iOS ignores overflow:hidden on <html> for touch scrolling, so block
  // touch drags outside the menu while it is open (listener only while open).
  const blockTouchScroll = (e) => {
    if (!(e.target.closest && e.target.closest(".nav-links"))) e.preventDefault();
  };

  const setNavOpen = (open) => {
    if (navLinks) navLinks.classList.toggle("open", open);
    document.body.classList.toggle("nav-open", open);
    document.documentElement.classList.toggle("nav-locked", open);
    if (open) document.addEventListener("touchmove", blockTouchScroll, { passive: false });
    else document.removeEventListener("touchmove", blockTouchScroll, { passive: false });
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", open ? "true" : "false");
      navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (ICON_MENU) navToggle.innerHTML = open ? ICON_CLOSE : ICON_MENU;
    }
  };

  document.addEventListener("click", (e) => {
    const t = e.target.closest ? e.target.closest("[data-nav-toggle]") : null;
    if (t) {
      const opening = !isNavOpen();
      setNavOpen(opening);
      // Move focus into the menu, so the next Tab goes through the links.
      if (opening && navLinks) {
        const first = navLinks.querySelector("a");
        if (first) first.focus({ preventScroll: true });
      }
      return;
    }
    // A tap or click anywhere outside the open menu closes it.
    if (isNavOpen() && !(e.target.closest && e.target.closest(".nav-links"))) setNavOpen(false);
  });

  // Escape closes the menu and puts focus back on the toggle.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || e.defaultPrevented || !isNavOpen()) return;
    setNavOpen(false);
    if (navToggle) navToggle.focus();
  });

  // Tabbing out of the header closes the menu, so it never hangs open over
  // the content that now has focus.
  document.addEventListener("focusin", (e) => {
    if (isNavOpen() && !(e.target.closest && e.target.closest(".site-header"))) setNavOpen(false);
  });

  // Rotating a tablet past the breakpoint shows the desktop nav: drop the lock.
  const navMq = matchMedia("(max-width: 1000px)");
  const onNavMq = () => { if (!navMq.matches && isNavOpen()) setNavOpen(false); };
  if (navMq.addEventListener) navMq.addEventListener("change", onNavMq);
  else if (navMq.addListener) navMq.addListener(onNavMq);

  document.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => {
      if (isNavOpen()) setNavOpen(false);
    })
  );

  // ---- Current page in the nav ----
  // Clean URLs ("/solutions"), .html URLs, trailing slashes and /index all map
  // to the same page. Pages that are not in the nav light up their section,
  // taken from the page's own breadcrumb (articles and guides sit under
  // Articles, the conversion guide under Services).
  const normPath = (p) =>
    (p || "/").toLowerCase()
      .replace(/\/index(\.html)?$/, "/")
      .replace(/\.html$/, "")
      .replace(/\/+$/, "") || "/";
  // Breadcrumb URLs are absolute production URLs, so those match by path.
  const pathOf = (href, anyOrigin) => {
    try {
      const u = new URL(href, location.href);
      return anyOrigin || u.origin === location.origin ? normPath(u.pathname) : null;
    } catch (_) { return null; }
  };
  const here = normPath(location.pathname);
  let section = /^\/article-/.test(here) ? "/articles" : null;
  try {
    document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
      const walk = (n) => {
        if (!n || typeof n !== "object") return;
        if (Array.isArray(n)) { n.forEach(walk); return; }
        if (n["@type"] === "BreadcrumbList" && Array.isArray(n.itemListElement)) {
          const trail = n.itemListElement
            .map((i) => i && i.item && pathOf(typeof i.item === "string" ? i.item : i.item["@id"], true))
            .filter((p) => p && p !== "/" && p !== here);
          if (trail.length) section = trail[trail.length - 1];
        }
        Object.keys(n).forEach((k) => walk(n[k]));
      };
      walk(JSON.parse(s.textContent));
    });
  } catch (_) {}
  if (here !== "/") {
    document.querySelectorAll(".nav-links a").forEach((a) => {
      const p = pathOf(a.getAttribute("href"));
      if (!p) return;
      if (p === here) {
        a.classList.add("active");
        a.setAttribute("aria-current", "page");
      } else if (section && p === section) {
        a.classList.add("active");
        a.setAttribute("aria-current", "true");
      }
    });
  }

  // ---- Reveal on scroll: disabled ----
  // Scroll-triggered reveals were removed by request. Every .reveal element is
  // marked visible at load so content renders in its final position with no
  // motion. (CSS also pins these static as a safety net.)
  document.querySelectorAll(".reveal").forEach((el) => el.classList.add("visible"));

  // ---- Contact form: post to Web3Forms with fetch so the visitor stays on the page ----
  const form = document.getElementById("contact-form");
  if (form) {
    const ok = form.querySelector(".success-msg") || document.querySelector(".success-msg");
    const err = form.querySelector(".error-msg") || document.querySelector(".error-msg");
    // Show a result where the visitor can see it: scroll it into view, then
    // move focus to it so screen readers announce it too.
    const reveal = (m) => {
      if (!m) return;
      m.classList.add("show");
      if (!m.hasAttribute("tabindex")) m.setAttribute("tabindex", "-1");
      m.scrollIntoView({ block: "center", behavior: SCROLL_BEHAVIOR });
      m.focus({ preventScroll: true });
    };

    form.addEventListener("submit", (e) => {
      // `required` accepts whitespace, so check the text fields ourselves.
      const blank = ["name", "message"]
        .map((n) => form.elements.namedItem(n))
        .find((el) => el && typeof el.value === "string" && !el.value.trim());
      if (blank) {
        e.preventDefault();
        blank.value = "";
        blank.reportValidity();
        return;
      }

      const action = form.getAttribute("action") || "";
      if (!/web3forms\.com/.test(action)) return; // unknown backend: submit natively
      e.preventDefault();
      if (err) err.classList.remove("show");
      if (ok) ok.classList.remove("show");
      const btn = form.querySelector("button[type=submit]");
      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.textContent = "Sending…"; }
      fetch(action, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form),
      })
        .then((r) => r.json().catch(() => ({})).then((j) => ({ r, j })))
        .then(({ r, j }) => {
          // Web3Forms returns a JSON success flag; require it explicitly.
          // Clear the form only on success; on failure the visitor keeps
          // what they typed.
          if (r.ok && (j.success === true || j.success === "true")) {
            form.reset();
            reveal(ok);
          } else {
            reveal(err);
          }
        })
        .catch(() => reveal(err))
        .finally(() => {
          if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label || "Send message"; }
        });
    });
  }

  // ---- Year ----
  document.querySelectorAll("[data-year]").forEach((y) => y.textContent = new Date().getFullYear());

  // ---- Wide tables (privacy policy) ----
  // A table that scrolls sideways must be reachable by keyboard: name the
  // wrapper as a region and make it focusable while it actually overflows.
  document.querySelectorAll(".table-wrap").forEach((w) => {
    if (!w.hasAttribute("role")) w.setAttribute("role", "region");
    if (!w.hasAttribute("aria-label") && !w.hasAttribute("aria-labelledby")) {
      let label = "";
      const cap = w.querySelector("caption");
      if (cap) label = cap.textContent;
      else {
        let h = w.previousElementSibling;
        while (h && !/^H[1-6]$/.test(h.tagName)) h = h.previousElementSibling;
        if (h) label = h.textContent.replace(/^\s*\d+\.\s*/, "");
      }
      w.setAttribute("aria-label", label.trim() ? label.trim() + " table" : "Table");
    }
    if (w.hasAttribute("tabindex")) return; // set in the HTML: leave it
    const sync = () => {
      if (w.scrollWidth > w.clientWidth + 1) w.setAttribute("tabindex", "0");
      else w.removeAttribute("tabindex");
    };
    sync();
    if (window.ResizeObserver) new ResizeObserver(sync).observe(w);
    else window.addEventListener("resize", sync);
  });

  // ---- FAQ jump chips ----
  // Native hash-scroll fights with our own scroll and produced a visible
  // judder. Take control: intercept the click, open the details, run a single
  // scroll with the sticky-header offset, and re-trigger the CSS highlight.
  const scrollToFaqTarget = (target) => {
    if (!target) return;
    if (target.tagName === "DETAILS") target.open = true;

    // Clear any previous jump highlight so it can re-fire on the new target.
    document.querySelectorAll(".faq-item.is-jump-target").forEach((el) => {
      el.classList.remove("is-jump-target");
    });
    // Force a reflow so the class re-add definitely restarts the highlight.
    void target.offsetWidth;
    target.classList.add("is-jump-target");

    const header = document.querySelector(".site-header");
    const offset = (header ? header.offsetHeight : 0) + 16;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: SCROLL_BEHAVIOR });
  };

  document.querySelectorAll(".faq-jumps a").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") || "";
      if (!href.startsWith("#")) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      // Update the URL without firing hashchange (which would re-trigger scroll).
      if (history.replaceState) history.replaceState(null, "", href);
      scrollToFaqTarget(target);
    });
  });

  // If someone lands with a URL hash (deep link / refresh), still open + scroll.
  if (location.hash && location.hash.length > 1) {
    try {
      const initial = document.querySelector(location.hash);
      if (initial) scrollToFaqTarget(initial);
    } catch (_) {}
  }

  // ---- Scroll-aware header (transparent over the homepage hero, solid on scroll) ----
  if (document.body.classList.contains("page-home")) {
    // Hysteresis: turn solid further down than we turn transparent again.
    // The header shrinks ~15px when it goes solid, and Chrome's scroll
    // anchoring then moves scrollY by the same 15px. With one 40px threshold
    // that shift pushed scrollY back across the line on every frame, so the
    // header strobed between states. A 48px dead band is wider than any
    // anchoring shift, so the state settles. Keep ENTER - EXIT > header delta.
    const ENTER = 64, EXIT = 16;
    const setScrolled = () => {
      const y = window.scrollY || window.pageYOffset;
      const on = document.body.classList.contains("is-scrolled");
      if (!on && y > ENTER) document.body.classList.add("is-scrolled");
      else if (on && y < EXIT) document.body.classList.remove("is-scrolled");
    };
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  // ---- Decorative videos (hero + illustration) ----
  // These are muted, inline backgrounds. iOS Safari is strict about inline
  // autoplay: the element must be muted (as a *property*, set here, not merely
  // the HTML attribute) at play() time, and it may still defer until the first
  // user gesture. We set muted, call play() and retry it across every
  // readiness event.
  //
  // iOS Low Power Mode refuses autoplay outright (play() rejects with
  // NotAllowedError) and forces a play-button overlay that CSS cannot hide
  // (WebKit bug 219889, WONTFIX). Animated images are not subject to autoplay
  // policy, so when the video is refused, or is still frozen a few seconds after
  // it has data, we swap in its data-fallback animated WebP, which loops like a GIF.
  //
  // Retries only listen for events WebKit counts as a user gesture (touchend,
  // click, keydown).
  //
  // Nothing autoplays for visitors who asked for less motion (Reduce Motion)
  // or less data (Save-Data): they see the poster still, and the homepage
  // hero has a play button if they want the video anyway.
  const conn = navigator.connection;
  const saveData = matchMedia("(prefers-reduced-data: reduce)").matches || !!(conn && conn.saveData);
  const holdStill = reduceMotion || saveData;

  const GESTURES = ["touchend", "click", "keydown"];
  const playWhenReady = (v, onSwap) => {
    if (!v) return;
    v.muted = true; v.defaultMuted = true; v.playsInline = true;
    v.setAttribute("muted", ""); v.setAttribute("playsinline", "");
    let swapped = false;

    const showFallback = () => {
      const src = v.dataset.fallback;
      if (swapped || !src || !v.paused || v.dataset.userPaused) return;
      swapped = true;
      // Stop the video download for good: detach its sources before load(),
      // or load() would run resource selection again and restart it.
      v.removeAttribute("autoplay");
      v.pause();
      v.preload = "none";
      v.querySelectorAll("source").forEach((s) => s.remove());
      v.removeAttribute("src");
      try { v.load(); } catch (_) {}
      const img = new Image();
      img.alt = "";
      img.setAttribute("aria-hidden", "true");
      img.className = v.className;
      if (v.getAttribute("width")) img.width = v.width;
      if (v.getAttribute("height")) img.height = v.height;
      img.onload = () => {
        v.replaceWith(img);
        if (onSwap) onSwap(img);
      };
      img.src = src;
    };

    const tryPlay = () => {
      if (swapped || !v.paused || v.dataset.userPaused) return;
      const pr = v.play();
      if (pr && pr.catch) pr.catch((e) => { if (e && e.name === "NotAllowedError") showFallback(); });
    };
    const retry = () => tryPlay();

    tryPlay();
    ["loadedmetadata", "loadeddata", "canplay", "canplaythrough"].forEach((ev) =>
      v.addEventListener(ev, tryPlay, { once: true })
    );
    GESTURES.forEach((ev) => window.addEventListener(ev, retry, { passive: true }));
    // Returning to the tab, or restoring the page from the back/forward cache,
    // leaves iOS videos paused.
    window.addEventListener("pageshow", retry);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) tryPlay(); });
    v.addEventListener("playing", () =>
      GESTURES.forEach((ev) => window.removeEventListener(ev, retry))
    , { once: true });

    // Safety net: data has loaded but nothing is moving. Show the animated image
    // rather than leave a frozen frame on screen.
    v.addEventListener("loadeddata", () => {
      setTimeout(() => { if (v.paused && !document.hidden) showFallback(); }, 2500);
    }, { once: true });
  };

  // Keep a video from autoplaying and cancel anything it has started to fetch.
  // It shows its poster (for the hero, the CSS poster underneath it). The
  // sources are detached before load(), because Chrome fetches the file on an
  // explicit load() even with preload="none"; releaseVideo() puts them back.
  const holdVideo = (v) => {
    v.removeAttribute("autoplay");
    v.autoplay = false;
    v.preload = "none";
    v.pause();
    v._heldSources = Array.from(v.querySelectorAll("source"));
    v._heldSources.forEach((s) => s.remove());
    if (v.hasAttribute("src")) { v._heldSrc = v.getAttribute("src"); v.removeAttribute("src"); }
    try { v.load(); } catch (_) {}
  };
  const releaseVideo = (v) => {
    v.preload = "auto";
    if (v._heldSrc) { v.setAttribute("src", v._heldSrc); v._heldSrc = null; }
    if (v._heldSources) { v._heldSources.forEach((s) => v.appendChild(s)); v._heldSources = null; }
  };

  // ---- Hero video ----
  // Phones get a full-resolution portrait center crop (the <source media>
  // query); desktops get the landscape clip. data-start (optional) sets where
  // each loop begins.
  const heroVideo = document.getElementById("hero-video");
  if (heroVideo) {
    const hero = heroVideo.closest(".hero-cinema") || heroVideo.parentElement;
    const startAt = parseFloat(heroVideo.dataset.start || "0") || 0;
    const seekToStart = () => {
      try { heroVideo.currentTime = startAt; } catch (_) {}
    };
    if (startAt) heroVideo.addEventListener("loadedmetadata", seekToStart, { once: true });
    heroVideo.addEventListener("ended", () => {
      if (heroVideo.dataset.userPaused) return;
      seekToStart();
      const p = heroVideo.play();
      if (p && p.catch) p.catch(() => {});
    });

    // Pause / play control (WCAG 2.2.2): a background that moves for more
    // than five seconds needs a way to stop it.
    const ICON_PAUSE =
      '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">' +
      '<rect x="2.5" y="1.5" width="3" height="11" rx="0.75" fill="currentColor"/>' +
      '<rect x="8.5" y="1.5" width="3" height="11" rx="0.75" fill="currentColor"/></svg>';
    const ICON_PLAY =
      '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">' +
      '<path d="M3.5 1.9v10.2a.6.6 0 0 0 .91.51l8.1-5.1a.6.6 0 0 0 0-1.02l-8.1-5.1a.6.6 0 0 0-.91.51z" fill="currentColor"/></svg>';
    let moving = !holdStill;
    let started = !holdStill;
    let fallbackImg = null;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "hero-motion-toggle";
    const render = () => {
      btn.innerHTML = moving ? ICON_PAUSE : ICON_PLAY;
      btn.setAttribute("aria-label", moving ? "Pause background video" : "Play background video");
    };
    render();
    btn.addEventListener("click", () => {
      moving = !moving;
      const v = document.getElementById("hero-video");
      if (fallbackImg) {
        // Autoplay was refused and the animated WebP is showing: hiding it
        // leaves the still poster underneath.
        fallbackImg.style.visibility = moving ? "" : "hidden";
      } else if (v) {
        if (moving) {
          delete v.dataset.userPaused;
          if (!started) { started = true; releaseVideo(v); playWhenReady(v, onSwap); }
          else { const p = v.play(); if (p && p.catch) p.catch(() => {}); }
        } else {
          v.dataset.userPaused = "1";
          v.pause();
        }
      }
      render();
    });
    const onSwap = (img) => {
      fallbackImg = img;
      if (!moving) img.style.visibility = "hidden";
    };
    if (hero) {
      hero.appendChild(btn);
      // Sit just above the meta bar, whatever height it wraps to.
      const meta = hero.querySelector(".hero-meta");
      if (meta) {
        const syncMeta = () => hero.style.setProperty("--hero-meta-h", meta.offsetHeight + "px");
        syncMeta();
        if (window.ResizeObserver) new ResizeObserver(syncMeta).observe(meta);
        else window.addEventListener("resize", syncMeta);
      }
    }

    if (holdStill) holdVideo(heroVideo);
    else playWhenReady(heroVideo, onSwap);
  }

  // ---- Illustration loop(s) ----
  // Below the fold, so they load and start only when they come near the
  // viewport (the HTML ships them with preload="none" and no autoplay).
  document.querySelectorAll(".illustration-video").forEach((v) => {
    if (holdStill) { holdVideo(v); return; }
    const start = () => { v.preload = "auto"; playWhenReady(v); };
    if (!("IntersectionObserver" in window)) { start(); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        io.disconnect();
        start();
      });
    }, { rootMargin: "300px 0px" });
    io.observe(v);
  });

  // ---- Custom scroll rail (right-edge scrollbar replacement) ----
  // We hide the native scrollbar in CSS and render our own. The thumb height
  // is proportional to viewport/document ratio; the top offset is proportional
  // to scrollY. Click on track jumps to that position; drag on thumb scrolls.
  (function mountScrollRail() {
    if (matchMedia("(pointer: coarse)").matches) return; // touch: skip
    const rail = document.createElement("div");
    rail.className = "scroll-rail";
    rail.setAttribute("aria-hidden", "true");
    rail.innerHTML =
      '<div class="scroll-rail-track"></div>' +
      '<div class="scroll-rail-thumb"></div>';
    document.body.appendChild(rail);

    const track = rail.querySelector(".scroll-rail-track");
    const thumb = rail.querySelector(".scroll-rail-thumb");
    const MIN_THUMB = 48;

    const trackMetrics = () => {
      const r = track.getBoundingClientRect();
      return { top: r.top, height: r.height };
    };

    const update = () => {
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      if (scrollable <= 4) {
        rail.classList.remove("ready");
        return;
      }
      const { top, height } = trackMetrics();
      const ratio = window.innerHeight / doc.scrollHeight;
      const thumbH = Math.max(MIN_THUMB, Math.round(height * ratio));
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      const pos = Math.round(top + (height - thumbH) * progress);
      rail.style.setProperty("--scroll-thumb-h", thumbH + "px");
      rail.style.setProperty("--scroll-pos", pos + "px");
      rail.classList.add("ready");
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Track page height changes (late images, opened FAQ items, etc.)
    new ResizeObserver(update).observe(document.body);

    // ----- Drag thumb -----
    // Listen on window during a drag so the gesture keeps tracking even when the
    // pointer wanders off the thumb. We update --scroll-pos directly each frame
    // (no waiting for the scroll callback) so the thumb sticks to the cursor.
    let dragging = false;
    let dragOffset = 0;
    let dragFrame = 0;
    let pendingScroll = 0;

    const applyDragFrame = () => {
      dragFrame = 0;
      // Force instant scroll during drag: html { scroll-behavior: smooth }
      // would otherwise animate every micro-update and make the drag feel laggy.
      window.scrollTo({ top: pendingScroll, left: 0, behavior: "instant" });
    };

    const onWindowMove = (e) => {
      if (!dragging) return;
      e.preventDefault();
      const { top, height } = trackMetrics();
      const thumbH = thumb.getBoundingClientRect().height;
      const relative = e.clientY - top - dragOffset;
      const clamped = Math.min(Math.max(0, relative), height - thumbH);
      const ratio = (height - thumbH) > 0 ? clamped / (height - thumbH) : 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      rail.style.setProperty("--scroll-pos", (top + clamped) + "px");
      pendingScroll = ratio * scrollable;
      if (!dragFrame) dragFrame = requestAnimationFrame(applyDragFrame);
    };

    const onWindowUp = () => {
      if (!dragging) return;
      dragging = false;
      rail.classList.remove("dragging");
      document.documentElement.classList.remove("is-rail-dragging");
      try { thumb.releasePointerCapture(activePointerId); } catch (_) {}
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowUp);
    };

    let activePointerId = -1;
    thumb.addEventListener("pointerdown", (e) => {
      if (e.button !== undefined && e.button !== 0) return;
      e.preventDefault();
      dragging = true;
      activePointerId = e.pointerId;
      rail.classList.add("dragging");
      // Disable smooth-scroll while dragging so applyDragFrame's scrollTo lands
      // exactly where the cursor is, with no in-between easing.
      document.documentElement.classList.add("is-rail-dragging");
      try { thumb.setPointerCapture(e.pointerId); } catch (_) {}
      const thumbRect = thumb.getBoundingClientRect();
      dragOffset = e.clientY - thumbRect.top;
      window.addEventListener("pointermove", onWindowMove, { passive: false });
      window.addEventListener("pointerup", onWindowUp);
      window.addEventListener("pointercancel", onWindowUp);
    });

    // ----- Click on track jumps -----
    track.addEventListener("click", (e) => {
      if (e.target !== track) return; // ignore clicks that started on the thumb
      const { top, height } = trackMetrics();
      const thumbH = thumb.getBoundingClientRect().height;
      const target = e.clientY - top - thumbH / 2;
      const ratio = Math.min(Math.max(0, target), height - thumbH) / (height - thumbH);
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      window.scrollTo({ top: ratio * scrollable, behavior: SCROLL_BEHAVIOR });
    });
  })();

  // ---- Cookie consent + analytics (Google Analytics 4, loaded only on Accept) ----
  // GA4 (G-G3EP1H4KHJ) loads only after the visitor clicks Accept. The choice is
  // kept in localStorage, so the banner shows once. "Cookie settings" in the
  // footer of every page reopens it; choosing Decline then switches GA off on
  // this page, removes its cookies, and keeps it off on later page loads.
  (function cookieConsent() {
    var KEY = "gcs-cookie-consent";
    var GA_ID = "G-G3EP1H4KHJ"; // Genesis Core Systems GA4 Measurement ID
    var GA_OFF = "ga-disable-" + GA_ID; // Google's documented per-page opt-out flag

    function readChoice() { try { return localStorage.getItem(KEY); } catch (_) { return null; } }
    function saveChoice(v) { try { localStorage.setItem(KEY, v); } catch (_) {} }

    function loadAnalytics() {
      window[GA_OFF] = false;
      if (window.__gaLoaded) return;
      window.__gaLoaded = true;
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
      document.head.appendChild(s);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", GA_ID, { anonymize_ip: true });
    }

    function stopAnalytics() {
      window[GA_OFF] = true;
      // Expire the GA cookies (_ga, _ga_<id>, and the legacy _gid/_gat) on this
      // host and on each parent domain GA may have used.
      var names = document.cookie.split(";")
        .map(function (c) { return c.split("=")[0].trim(); })
        .filter(function (n) { return /^_(ga|gid|gat)/.test(n); });
      if (!names.length) return;
      var parts = location.hostname.split(".");
      var domains = [""];
      for (var i = 0; i < parts.length - 1; i++) {
        var d = parts.slice(i).join(".");
        domains.push(d, "." + d);
      }
      names.forEach(function (n) {
        domains.forEach(function (d) {
          document.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + (d ? "; domain=" + d : "");
        });
      });
    }

    var bar = null;
    var returnFocus = null;

    // While the banner is up, keep keyboard focus and the end of the page from
    // being hidden behind it.
    function syncBannerSpace() {
      var h = bar && bar.isConnected ? bar.offsetHeight : 0;
      document.documentElement.style.scrollPaddingBottom = h ? (h + 16) + "px" : "";
      document.body.style.paddingBottom = h ? h + "px" : "";
    }
    window.addEventListener("resize", syncBannerSpace);

    function hideBanner() {
      var hadFocus = bar && bar.contains(document.activeElement);
      if (bar) bar.remove();
      bar = null;
      syncBannerSpace();
      if (hadFocus && returnFocus && returnFocus.isConnected) returnFocus.focus();
      returnFocus = null;
    }

    function showBanner(moveFocus) {
      if (!bar) {
        bar = document.createElement("div");
        bar.id = "cookie-banner";
        bar.className = "cookie-banner";
        bar.setAttribute("role", "region");
        bar.setAttribute("aria-label", "Cookie consent");
        bar.innerHTML =
          '<p class="cookie-text">We use cookies to understand how visitors use this site and to improve it. ' +
          'You can accept analytics cookies or decline; declining still lets you use the whole site. ' +
          'You can change your choice anytime with Cookie settings at the bottom of the page. ' +
          'See our <a href="/privacy">Privacy Policy</a>.</p>' +
          '<div class="cookie-actions">' +
          '<button type="button" class="btn btn-ghost" data-cookie="declined">Decline</button>' +
          '<button type="button" class="btn btn-primary" data-cookie="accepted">Accept</button>' +
          '</div>';
        bar.addEventListener("click", function (e) {
          var t = e.target.closest("[data-cookie]");
          if (!t) return;
          var v = t.getAttribute("data-cookie");
          saveChoice(v);
          if (v === "accepted") loadAnalytics();
          else stopAnalytics();
          hideBanner();
        });
        // Early in the page (right after the skip link), so keyboard and
        // screen-reader users reach it first. It is position: fixed, so this
        // does not move it visually, and it never takes focus on its own.
        var skip = document.querySelector(".skip-link");
        document.body.insertBefore(bar, skip ? skip.nextSibling : document.body.firstChild);
        syncBannerSpace();
      }
      if (moveFocus) {
        var first = bar.querySelector("[data-cookie]");
        if (first) first.focus();
      }
    }

    // "Cookie settings" next to the Privacy Policy link in the footer.
    (function mountSettingsLink() {
      var row = document.querySelector(".site-footer .footer-microlinks") ||
                document.querySelector(".site-footer .footer-bottom");
      if (!row || row.querySelector("[data-cookie-settings]")) return;
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "footer-linkbtn";
      btn.setAttribute("data-cookie-settings", "");
      btn.textContent = "Cookie settings";
      var privacy = null;
      Array.prototype.forEach.call(row.querySelectorAll("a"), function (a) {
        if (!privacy && /\/privacy(\.html)?$/.test(a.getAttribute("href") || "")) privacy = a;
      });
      if (privacy && privacy.parentNode === row) {
        row.insertBefore(btn, privacy.nextSibling);
        row.insertBefore(document.createTextNode(" · "), btn);
      } else {
        row.appendChild(document.createTextNode(" · "));
        row.appendChild(btn);
      }
    })();

    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest("[data-cookie-settings]");
      if (!t) return;
      e.preventDefault();
      returnFocus = t;
      showBanner(true);
    });

    var choice = readChoice();
    if (choice === "accepted") loadAnalytics();
    else if (choice === "declined") window[GA_OFF] = true;
    else showBanner(false);
  })();

})();
