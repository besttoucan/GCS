// Genesis Core Systems — minimal client JS

(function () {
  // ---- Mobile nav ----
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-nav-toggle]");
    if (!t) return;
    const links = document.querySelector(".nav-links");
    if (links) links.classList.toggle("open");
  });

  document.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => {
      const links = document.querySelector(".nav-links");
      if (links && links.classList.contains("open")) links.classList.remove("open");
    })
  );

  // ---- Active nav link ----
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
  });

  // ---- Reveal on scroll ----
  // Strategy: .reveal defaults to VISIBLE in CSS now. We split elements
  // into two buckets at load time:
  //   above-the-fold → add .visible immediately, no animation. The user
  //     never sees a fade-in delay on content they can already see.
  //   below-the-fold → add .reveal-pending (opacity:0 + translateY) so
  //     the IntersectionObserver can fade it in when they scroll to it.
  // This fixes the "blank bottom on page open" issue where the pullquote
  // section (just below the hero) was waiting ~1s to fade in.
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.remove("reveal-pending");
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08, rootMargin: "0px 0px -60px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight - 60 && r.bottom > 0) {
      el.classList.add("visible");
    } else {
      el.classList.add("reveal-pending");
      io.observe(el);
    }
  });

  // ---- Contact form: submit via FormSubmit AJAX so the visitor stays on the page ----
  const form = document.querySelector("#contact-form");
  if (form) {
    const ok = form.querySelector(".success-msg");
    const err = form.querySelector(".error-msg");
    // Show success state if FormSubmit redirected back with ?sent=1 (used when JS is off).
    if (ok && /[?&]sent=1\b/.test(location.search)) ok.classList.add("show");

    form.addEventListener("submit", (e) => {
      const action = form.getAttribute("action") || "";
      if (!/formsubmit\.co/.test(action)) return; // let any other backend submit natively
      e.preventDefault();
      if (err) err.classList.remove("show");
      const btn = form.querySelector("button[type=submit]");
      if (btn) { btn.disabled = true; btn.dataset.label = btn.innerHTML; btn.textContent = "Sending…"; }
      const ajax = action.replace("formsubmit.co/", "formsubmit.co/ajax/");
      fetch(ajax, {
        method: "POST",
        headers: { "Accept": "application/json" },
        body: new FormData(form),
      })
        .then((r) => r.json().catch(() => ({})).then((j) => ({ r, j })))
        .then(({ r, j }) => {
          if (r.ok && (j.success === "true" || j.success === true || r.status === 200)) {
            if (ok) ok.classList.add("show");
            form.reset();
          } else {
            if (err) err.classList.add("show");
          }
        })
        .catch(() => { if (err) err.classList.add("show"); })
        .finally(() => {
          if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label || "Send message"; }
        });
    });
  }

  // ---- Year ----
  document.querySelectorAll("[data-year]").forEach((y) => y.textContent = new Date().getFullYear());

  // ---- FAQ jump chips ----
  // Native hash-scroll fights with our own scrollIntoView and was producing the
  // visible judder. Take control: intercept the click, open the details, run
  // a single smooth scroll with the sticky-header offset, and re-trigger the
  // CSS pulse animation by force-restarting it via classlist toggle.
  const scrollToFaqTarget = (target) => {
    if (!target) return;
    if (target.tagName === "DETAILS") target.open = true;

    // Clear any previous jump highlight so the animation can re-fire on the
    // new target. Removing + re-adding in the next frame restarts the keyframes.
    document.querySelectorAll(".faq-item.is-jump-target").forEach((el) => {
      el.classList.remove("is-jump-target");
    });
    // Force a reflow so the class re-add definitely re-triggers the animation.
    void target.offsetWidth;
    target.classList.add("is-jump-target");

    const header = document.querySelector(".site-header");
    const offset = (header ? header.offsetHeight : 0) + 16;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: "smooth" });
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

  // ---- Scroll-aware header (transparent over cinema hero, frosts in on scroll) ----
  if (document.body.classList.contains("page-home")) {
    const setScrolled = () => {
      const y = window.scrollY || window.pageYOffset;
      document.body.classList.toggle("is-scrolled", y > 40);
    };
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }

  // ---- Hero video: start at data-start seconds, manual loop back to same point ----
  // We don't use the native `loop` attribute because we want every loop to begin at
  // 5s (past the source video's watermark), not 0s.
  // On small viewports or data-saver connections, we skip the video entirely —
  // the poster image is already loaded and looks the same as the video's first
  // frame, so the user sees no difference, but we save them a multi-MB MP4
  // download + per-frame decode (the biggest mobile-jank source on this page).
  const heroVideo = document.getElementById("hero-video");
  if (heroVideo) {
    const skipVideo =
      matchMedia("(prefers-reduced-data: reduce)").matches ||
      matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (skipVideo) {
      // Tear down the <source> children so the browser never starts downloading.
      while (heroVideo.firstChild) heroVideo.removeChild(heroVideo.firstChild);
      heroVideo.removeAttribute("autoplay");
      heroVideo.setAttribute("preload", "none");
      try { heroVideo.load(); } catch (_) {}
    } else {
      const startAt = parseFloat(heroVideo.dataset.start || "0") || 0;
      const seekToStart = () => {
        try { heroVideo.currentTime = startAt; } catch (_) {}
      };
      heroVideo.addEventListener("loadedmetadata", seekToStart, { once: true });
      heroVideo.addEventListener("ended", () => {
        seekToStart();
        const p = heroVideo.play();
        if (p && p.catch) p.catch(() => {});
      });
      // Autoplay can be blocked silently — try once after metadata to be safe.
      heroVideo.addEventListener("canplay", () => {
        const p = heroVideo.play();
        if (p && p.catch) p.catch(() => {});
      }, { once: true });
    }
  }

  // ---- Scroll-driven effects: hero parallax + hero content fade + page-head drift + scroll-tied --p ----
  // All variables are written to inline styles once per animation frame, so
  // multiple effects share the same rAF and stay in sync.
  // Gates: skip on (a) reduced-motion preference, (b) small viewports — touch
  // scroll is already smooth and adding per-frame transforms during it causes
  // jank on lower-power GPUs that mobile devices typically have.
  const skipScrollFx =
    matchMedia("(prefers-reduced-motion: reduce)").matches ||
    matchMedia("(max-width: 800px)").matches ||
    matchMedia("(pointer: coarse)").matches;
  if (!skipScrollFx) {
    const heroSkyline = document.querySelector(".hero-cinema .hero-skyline");
    const heroContent = document.querySelector(".hero-cinema .hero-content");
    const pageHead = document.querySelector(".page-head");
    const tiedEls = Array.from(document.querySelectorAll("[data-scroll-tie]"));
    let ticking = false;
    const onScrollFx = () => {
      ticking = false;
      const y = window.scrollY;
      const vh = window.innerHeight;

      // Note: the previous per-frame parallax on .hero-skyline was the source
      // of two problems —
      //  (a) sub-pixel transforms (y * 0.35 → 23.45px) jittered the video
      //      layer on some GPUs, and
      //  (b) the shift exposed the dark background between the skyline and
      //      either the bar (bottom) or the section top, which is what the
      //      user perceived as "the bottom of the video changes in size."
      // The video now stays anchored to its container — the meta bar at the
      // bottom is the intentional fixed edge. Compositor stays cheap, the
      // bottom is frame-perfect, and the cinema feel comes from the video,
      // the overlay gradient, and the title — not from a moving background.
      // (heroSkyline reference kept above so future effects can use it.)

      // Hero content (eyebrow + h1 + lead): rise + fade as we scroll past hero.
      // Integer px on the shift — sub-pixel values jitter the text on certain GPUs.
      if (heroContent && y <= vh * 1.1) {
        const t = Math.min(1, y / (vh * 0.7));
        heroContent.style.setProperty("--hero-shift", Math.round(-y * 0.18) + "px");
        heroContent.style.setProperty("--hero-fade", (1 - t * 0.85).toFixed(3));
      }

      // Page-head heading on interior pages: drifts up and softens as it leaves.
      if (pageHead) {
        const headBottom = pageHead.offsetTop + pageHead.offsetHeight;
        if (y < headBottom + 200) {
          const t = Math.max(0, Math.min(1, y / headBottom));
          pageHead.style.setProperty("--page-head-shift", Math.round(-y * 0.22) + "px");
          pageHead.style.setProperty("--page-head-fade", (1 - t * 0.6).toFixed(3));
        }
      }

      // Scroll-tied values: for each [data-scroll-tie], write two variables
      // every frame —
      //  --p     linear 0..1 progress across the viewport (parallax-style),
      //  --focus center-peaked 0..1 ("active when near viewport center").
      // CSS picks whichever fits the effect on a given element. Recomputed
      // every frame from getBoundingClientRect(), so scrolling back up
      // automatically reverses every effect tied to either variable.
      const vpCenter = vh * 0.5;
      const falloff = vh * 0.4;  // focus reaches 0 this far from viewport center
      for (let i = 0; i < tiedEls.length; i++) {
        const el = tiedEls[i];
        const r = el.getBoundingClientRect();

        // Linear progress --p.
        const total = vh + r.height;
        const traveled = vh - r.top;
        const p = traveled <= 0 ? 0 : traveled >= total ? 1 : traveled / total;
        el.style.setProperty("--p", p.toFixed(4));

        // Center-peaked --focus.
        if (r.bottom < 0 || r.top > vh) {
          el.style.setProperty("--focus", "0");
          continue;
        }
        const elCenter = r.top + r.height * 0.5;
        const dist = Math.abs(elCenter - vpCenter);
        const focus = dist >= falloff ? 0 : 1 - dist / falloff;
        el.style.setProperty("--focus", focus.toFixed(4));
      }
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(onScrollFx); }
    }, { passive: true });
    window.addEventListener("resize", onScrollFx);
    onScrollFx();
  }

  // ---- Word-stagger reveal on big headings ----
  // Wraps each word in a <span class="word">. To stay safe with headings that
  // contain nested HTML (e.g. accent spans), we only split if the element has
  // a single text-node child.
  const wrapWords = (el) => {
    if (el.dataset.split) return;
    if (el.childNodes.length !== 1 || el.firstChild.nodeType !== Node.TEXT_NODE) return;
    el.dataset.split = "1";
    const words = el.textContent.split(/(\s+)/);
    el.textContent = "";
    words.forEach((w) => {
      if (/^\s+$/.test(w)) { el.appendChild(document.createTextNode(w)); return; }
      const span = document.createElement("span");
      span.className = "word";
      span.textContent = w;
      el.appendChild(span);
    });
  };
  const headingTargets = document.querySelectorAll(
    ".section-head h2, .page-head h1, .hero-cinema h1, .cta-band h2"
  );
  headingTargets.forEach(wrapWords);

  const wordIo = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("words-in");
          wordIo.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.25, rootMargin: "0px 0px -10% 0px" }
  );
  headingTargets.forEach((el) => wordIo.observe(el));
  // Trigger immediately on first-paint headings that are already in view.
  requestAnimationFrame(() => {
    headingTargets.forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9 && r.bottom > 0) el.classList.add("words-in");
    });
  });

  // ---- Custom scroll rail (right-edge scrollbar replacement) ----
  // We hide the native scrollbar in CSS and render our own. The thumb height
  // is proportional to viewport/document ratio; the top offset is proportional
  // to scrollY. Click on track jumps to that position; drag on thumb scrolls.
  (function mountScrollRail() {
    if (matchMedia("(pointer: coarse)").matches) return; // touch — skip
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
    // Track DOM mutations (reveal animations expanding height etc.)
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
      // Force instant scroll during drag — html { scroll-behavior: smooth }
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
      window.scrollTo({ top: ratio * scrollable, behavior: "smooth" });
    });
  })();

})();
