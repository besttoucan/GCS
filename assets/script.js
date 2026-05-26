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
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

  // ---- Contact form: mailto fallback ----
  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      const action = form.getAttribute("action");
      if (!action || action === "" || action === "#mailto-fallback") {
        e.preventDefault();
        const data = new FormData(form);
        const subject = encodeURIComponent("Inquiry from " + (data.get("name") || "website visitor"));
        const body = encodeURIComponent(
          "Name: " + (data.get("name") || "") + "\n" +
          "Email: " + (data.get("email") || "") + "\n" +
          "Organization: " + (data.get("organization") || "") + "\n" +
          "Topic: " + (data.get("topic") || "") + "\n\n" +
          (data.get("message") || "")
        );
        window.location.href = "mailto:info@genesiscoresystems.com?subject=" + subject + "&body=" + body;
        const ok = document.querySelector(".success-msg");
        if (ok) ok.classList.add("show");
        form.reset();
      }
    });
  }

  // ---- Year ----
  document.querySelectorAll("[data-year]").forEach((y) => y.textContent = new Date().getFullYear());

  // ---- Scroll-aware header (transparent over cinema hero, frosts in on scroll) ----
  if (document.body.classList.contains("page-home")) {
    const setScrolled = () => {
      const y = window.scrollY || window.pageYOffset;
      document.body.classList.toggle("is-scrolled", y > 40);
    };
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });
  }
})();
