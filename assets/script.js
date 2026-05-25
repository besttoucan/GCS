// GCS — Global Core Systems
// Minimal vanilla JS — theme toggle, mobile nav, reveal-on-scroll, form handler.

(function () {
  const root = document.documentElement;

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

  // Close nav after clicking a link (mobile)
  document.querySelectorAll(".nav-links a").forEach((a) =>
    a.addEventListener("click", () => {
      const links = document.querySelector(".nav-links");
      if (links && links.classList.contains("open")) links.classList.remove("open");
    })
  );

  // ---- Mark active nav link ----
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    const href = a.getAttribute("href");
    if (href === path || (path === "" && href === "index.html")) a.classList.add("active");
  });

  // ---- Reveal on scroll ----
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // ---- Contact form (Formspree-compatible OR mailto fallback) ----
  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      const action = form.getAttribute("action");
      // Formspree-style endpoints handle submit natively if action is set to a Formspree URL.
      // Fallback: open user's mail client with the message pre-filled.
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
      // If action IS set to Formspree, the form submits normally. We can still show success after.
    });
  }

  // ---- Year ----
  const y = document.querySelector("[data-year]");
  if (y) y.textContent = new Date().getFullYear();
})();
