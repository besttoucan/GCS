// GCS — Global Core Systems
// Vanilla JS — theme, nav, reveal, counters, charts, ticker, parallax, form.

(function () {
  const root = document.documentElement;
  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- Theme ----
  const saved = localStorage.getItem("gcs-theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  root.setAttribute("data-theme", saved || (prefersDark ? "dark" : "light"));

  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-theme-toggle]");
    if (!t) return;
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("gcs-theme", next);
  });

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

  // ---- Scroll progress bar ----
  const bar = document.createElement("div");
  bar.className = "scroll-progress";
  document.body.prepend(bar);
  let ticking = false;
  function updateProgress() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight;
    const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
    bar.style.width = pct + "%";
    ticking = false;
  }
  document.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateProgress);
      ticking = true;
    }
  }, { passive: true });

  // ---- Reveal on scroll ----
  const revealIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));

  // ---- Animated counters ----
  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const duration = parseInt(el.dataset.duration || "1400", 10);
    const prefix = el.dataset.prefix || "";
    const suffix = el.dataset.suffix || "";
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = target * eased;
      el.textContent = prefix + val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    }
    if (prefersReduced) {
      el.textContent = prefix + target.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
    } else {
      requestAnimationFrame(tick);
    }
  }
  const counterIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          counterIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.4 }
  );
  document.querySelectorAll(".counter").forEach((el) => counterIO.observe(el));

  // ---- SVG chart animation triggers ----
  const chartIO = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          chartIO.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );
  document.querySelectorAll(".chart-svg, .bars").forEach((el) => chartIO.observe(el));

  // ---- Hero cursor-follow spotlight ----
  const hero = document.querySelector(".hero");
  if (hero && !prefersReduced) {
    hero.addEventListener("pointermove", (e) => {
      const r = hero.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 100;
      const y = ((e.clientY - r.top) / r.height) * 100;
      hero.style.setProperty("--mx", x + "%");
      hero.style.setProperty("--my", y + "%");
    });
  }

  // ---- Live transaction feed ----
  const feed = document.querySelector("#tx-feed");
  if (feed) {
    const banks = ["First Heritage Bank", "Pine Valley CU", "Cascade Community Bank", "Northgate Financial", "Liberty Trust", "Summit Savings", "Westchester Federal", "Acadia Bank", "Beacon Bank & Trust", "Sierra Credit Union"];
    const names = ["Acme Corp", "M. Carter", "Riverside LLC", "J. Owens", "Pacific Holdings", "S. Patel", "Greenline Co.", "L. Vásquez", "Northwind Inc.", "T. Nguyen", "Crestmark Logistics", "K. Schultz"];
    const types = [
      { lab: "ACH", code: "AC", cls: "" },
      { lab: "Wire", code: "WI", cls: "" },
      { lab: "RTP", code: "RT", cls: "ok" },
      { lab: "Card", code: "CD", cls: "" },
      { lab: "Deposit", code: "DP", cls: "ok" },
      { lab: "Loan Pmt", code: "LP", cls: "out" },
    ];
    function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
    function fmt(n) { return "$" + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
    function makeRow() {
      const t = pick(types);
      const amt = +(Math.random() * 48000 + 250).toFixed(2);
      const isIn = Math.random() > 0.4;
      const div = document.createElement("div");
      div.className = "tx-row";
      div.innerHTML =
        `<span class="tx-icon ${t.cls || (isIn ? "" : "out")}">${t.code}</span>` +
        `<div class="tx-meta"><strong>${pick(names)}</strong><span>${t.lab} · ${pick(banks)}</span></div>` +
        `<span class="tx-amount">${isIn ? "+" : "−"}${fmt(amt)}</span>`;
      return div;
    }
    // Seed initial rows
    for (let i = 0; i < 5; i++) feed.appendChild(makeRow());
    // Add a new row periodically
    if (!prefersReduced) {
      setInterval(() => {
        feed.prepend(makeRow());
        while (feed.children.length > 6) feed.removeChild(feed.lastChild);
      }, 2200);
    }
  }

  // ---- Live updating stat tiles (subtle drift) ----
  const driftTiles = document.querySelectorAll("[data-drift]");
  if (driftTiles.length && !prefersReduced) {
    setInterval(() => {
      driftTiles.forEach((el) => {
        const base = parseFloat(el.dataset.driftBase || el.dataset.count || "0");
        const range = parseFloat(el.dataset.drift || "0.5");
        const decimals = parseInt(el.dataset.decimals || "0", 10);
        const prefix = el.dataset.prefix || "";
        const suffix = el.dataset.suffix || "";
        const v = base + (Math.random() - 0.5) * 2 * range;
        el.textContent = prefix + v.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix;
      });
    }, 2800);
  }

  // ---- Contact form ----
  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      const action = form.getAttribute("action");
      if (!action || action === "" || action === "#mailto-fallback") {
        e.preventDefault();
        const data = new FormData(form);
        const subject = encodeURIComponent("New inquiry from " + (data.get("name") || "website visitor"));
        const body = encodeURIComponent(
          "Name: " + (data.get("name") || "") + "\n" +
          "Email: " + (data.get("email") || "") + "\n" +
          "Organization: " + (data.get("organization") || "") + "\n" +
          "Topic: " + (data.get("topic") || "") + "\n\n" +
          (data.get("message") || "")
        );
        window.location.href = "mailto:osavir@yahoo.com?subject=" + subject + "&body=" + body;
        const ok = document.querySelector(".success-msg");
        if (ok) ok.classList.add("show");
        form.reset();
      }
    });
  }

  // ---- Year ----
  document.querySelectorAll("[data-year]").forEach((y) => y.textContent = new Date().getFullYear());
})();
