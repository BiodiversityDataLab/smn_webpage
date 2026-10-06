/* Swedish Metabarcoding Network landing page JS
  - navigation: dropdown groups, mobile menu, sticky mini logo
  - theme toggle (persists in localStorage)
  - partner logo auto-loader from link domains
  - reveal-on-scroll animations
  - animated counters
  - contact form direct-send handler
*/

(function () {
  const root = document.documentElement;
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Theme ----------
  const THEME_KEY = "smn_theme";
  const themeToggles = Array.from(document.querySelectorAll(".theme-toggle"));

  function setTheme(theme) {
    if (theme === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    localStorage.setItem(THEME_KEY, theme);
    updateThemeToggleIcon(theme);
  }

  function getPreferredTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    const prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
    return prefersLight ? "light" : "dark";
  }

  function updateThemeToggleIcon(theme) {
    const isLight = theme === "light";
    themeToggles.forEach((toggle) => {
      const icon = toggle.querySelector(".theme-icon");
      if (icon) icon.textContent = isLight ? "🌙" : "☀";
      toggle.setAttribute("data-icon", isLight ? "moon" : "sun");
      toggle.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
      toggle.setAttribute("title", isLight ? "Switch to dark mode" : "Switch to light mode");
    });
  }

  setTheme(getPreferredTheme());

  themeToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const isLight = root.getAttribute("data-theme") === "light";
      setTheme(isLight ? "dark" : "light");
    });
  });

  // ---------- Navigation (mobile menu + dropdowns) ----------
  const navToggle = document.querySelector(".nav-toggle");
  const navMenu = document.querySelector(".nav-menu");
  const navGroups = Array.from(document.querySelectorAll(".nav-group"));
  const navLinks = document.querySelectorAll(".nav-menu a, .nav-cta");

  function setGroupOpen(group, open) {
    group.classList.toggle("is-open", open);
    const toggle = group.querySelector(".nav-group-toggle");
    if (toggle) toggle.setAttribute("aria-expanded", String(open));
  }

  function closeGroups(except) {
    navGroups.forEach((group) => {
      if (group !== except) setGroupOpen(group, false);
    });
  }

  function closeMenu() {
    closeGroups();
    if (!navMenu || !navToggle) return;
    navMenu.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }

  navGroups.forEach((group) => {
    const toggle = group.querySelector(".nav-group-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      const willOpen = !group.classList.contains("is-open");
      closeGroups(group);
      setGroupOpen(group, willOpen);
    });
  });

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", () => {
      const isOpen = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
      navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
      if (!isOpen) closeGroups();
    });
  }

  // Close menu when clicking a link
  navLinks.forEach((link) => link.addEventListener("click", () => {
    closeMenu();
    // drop focus so the :hover/:focus dropdown doesn't stay visible after jumping
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  }));

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!target || !navMenu) return;
    const clickedInside = navMenu.contains(target) || (navToggle && navToggle.contains(target));
    if (!clickedInside) closeMenu();
  });

  // Close on escape
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // Show the small logo in the nav bar once the big header logo has scrolled away
  const siteHeader = document.querySelector(".site-header");
  const siteNav = document.querySelector(".site-nav");
  if (siteHeader && siteNav && "IntersectionObserver" in window) {
    const stuckObserver = new IntersectionObserver(
      ([entry]) => siteNav.classList.toggle("is-stuck", !entry.isIntersecting),
      { threshold: 0 }
    );
    stuckObserver.observe(siteHeader);
  }

  // ---------- Partner logos from partner links ----------
  function addPartnerLogosFromLinks() {
    const partnerLinks = Array.from(document.querySelectorAll(".partner-link"));

    partnerLinks.forEach((link) => {
      if (link.querySelector(".partner-logo")) return;

      let domain = "";
      try {
        domain = new URL(link.href).hostname.replace(/^www\./i, "");
      } catch {
        return;
      }

      const linkText = link.textContent ? link.textContent.trim() : "";
      const logo = document.createElement("img");
      const text = document.createElement("span");

      logo.className = "partner-logo";
      logo.alt = "";
      logo.setAttribute("aria-hidden", "true");
      logo.loading = "lazy";

      const manualLogoUrl = link.getAttribute("data-logo-url") || "";
      const clearbitLogoUrl = `https://logo.clearbit.com/${domain}`;
      const directFaviconUrl = `https://${domain}/favicon.ico`;
      const faviconFallbackUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

      const logoCandidates = [];
      if (manualLogoUrl) logoCandidates.push(manualLogoUrl);
      logoCandidates.push(clearbitLogoUrl, directFaviconUrl, faviconFallbackUrl);

      let currentCandidateIndex = 0;
      logo.src = logoCandidates[currentCandidateIndex];
      logo.addEventListener("error", () => {
        currentCandidateIndex += 1;
        if (currentCandidateIndex >= logoCandidates.length) return;
        logo.src = logoCandidates[currentCandidateIndex];
      });

      text.className = "partner-link-text";
      text.textContent = linkText;

      link.textContent = "";
      link.append(logo, text);
    });
  }

  function addResourceLogosFromLinks() {
    const resourceLinks = Array.from(document.querySelectorAll(".resource-logo-link"));

    resourceLinks.forEach((link) => {
      const top = link.querySelector(".resource-top");
      if (!top || top.querySelector(".resource-logo")) return;

      let domain = "";
      try {
        domain = new URL(link.href).hostname.replace(/^www\./i, "");
      } catch {
        return;
      }

      const logo = document.createElement("img");
      logo.className = "resource-logo";
      logo.alt = "";
      logo.setAttribute("aria-hidden", "true");
      logo.loading = "lazy";

      const clearbitLogoUrl = `https://logo.clearbit.com/${domain}`;
      const faviconFallbackUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;

      logo.src = clearbitLogoUrl;
      logo.addEventListener("error", () => {
        if (logo.dataset.fallbackApplied === "1") return;
        logo.dataset.fallbackApplied = "1";
        logo.src = faviconFallbackUrl;
      });

      const title = top.querySelector("h3");
      if (title) {
        top.insertBefore(logo, title);
      } else {
        top.textContent = "";
        top.append(logo);
      }
    });
  }

  addPartnerLogosFromLinks();
  addResourceLogosFromLinks();

  // ---------- Reveal on scroll ----------
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach((el) => revealObserver.observe(el));

  // ---------- Side navigation: highlight the section currently in view ----------
  const sideLinks = Array.from(document.querySelectorAll(".side-nav-link"));
  const spySections = sideLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  function updateSideNav() {
    const line = window.innerHeight * 0.35;
    let current = spySections[0];
    spySections.forEach((section) => {
      if (section.getBoundingClientRect().top <= line) current = section;
    });
    sideLinks.forEach((link) => {
      const active = link.getAttribute("href") === `#${current.id}`;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
    document.querySelectorAll(".side-nav-group").forEach((group) => {
      group.classList.toggle("is-current", !!group.querySelector(".side-nav-link.is-active"));
    });
  }

  if (spySections.length) {
    let spyQueued = false;
    window.addEventListener("scroll", () => {
      if (spyQueued) return;
      spyQueued = true;
      requestAnimationFrame(() => {
        spyQueued = false;
        updateSideNav();
      });
    }, { passive: true });
    window.addEventListener("resize", updateSideNav);
    updateSideNav();
  }

  // ---------- Events: mark past / upcoming from data-date (YYYY-MM-DD) ----------
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  document.querySelectorAll(".event[data-date]").forEach((eventEl) => {
    const [y, m, d] = eventEl.dataset.date.split("-").map(Number);
    if (!y || !m || !d) return;
    const isPast = new Date(y, m - 1, d) < startOfToday;
    eventEl.classList.add(isPast ? "event--past" : "event--upcoming");
  });

  // ---------- Tutorial topic filter ----------
  const tutorialFilters = document.querySelector("[data-tutorial-filters]");
  if (tutorialFilters) {
    const filterButtons = Array.from(tutorialFilters.querySelectorAll(".filter-button"));
    const tutorialCards = Array.from(document.querySelectorAll(".tutorial-card[data-topics]"));
    const emptyNote = document.querySelector("[data-tutorial-empty]");

    filterButtons.forEach((button) => {
      button.addEventListener("click", () => {
        const topic = button.dataset.topic;
        filterButtons.forEach((b) => {
          const isActive = b === button;
          b.classList.toggle("active", isActive);
          b.setAttribute("aria-pressed", String(isActive));
        });

        let visible = 0;
        tutorialCards.forEach((card) => {
          const topics = (card.dataset.topics || "").split(/\s+/);
          const show = topic === "all" || topics.includes(topic);
          card.hidden = !show;
          if (show) visible += 1;
        });
        if (emptyNote) emptyNote.hidden = visible > 0;
      });
    });
  }

  // ---------- Animated counters ----------
  const counters = Array.from(document.querySelectorAll("[data-count-to]"));
  const counterObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.getAttribute("data-count-to") || "0");
        animateCount(el, target, 900);
        counterObserver.unobserve(el);
      });
    },
    { threshold: 0.35 }
  );

  counters.forEach((el) => counterObserver.observe(el));

  function animateCount(el, target, durationMs) {
    const start = 0;
    const startTime = performance.now();

    function tick(now) {
      const t = Math.min(1, (now - startTime) / durationMs);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(start + (target - start) * eased);
      el.textContent = String(value);
      if (t < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // ---------- Contact form ----------
  window.SMN = window.SMN || {};
  const contactRecipient = "linus-finn.lassen.6588@student.uu.se";
  const contactEndpoint = "https://formsubmit.co/ajax/linus-finn.lassen.6588@student.uu.se";
  window.SMN.handleFakeSubmit = function (event) {
    event.preventDefault();

    const form = event.target;
    const note = document.getElementById("formNote");
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const message = String(formData.get("message") || "").trim();

    if (note) {
      note.textContent = "Sending message...";
    }

    fetch(contactEndpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: name || "(not provided)",
        email: email || "(not provided)",
        message: message || "(no message)",
        _subject: `SMN Quick Message${name ? ` from ${name}` : ""}`,
        _replyto: email || contactRecipient,
        _captcha: "false",
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Request failed");
        }
        return response.json();
      })
      .then(() => {
        if (note) {
          note.textContent = "Message sent successfully.";
        }
        form.reset();
      })
      .catch(() => {
        if (note) {
          note.textContent = `Could not send automatically. Please email ${contactRecipient}.`;
        }
      });

    return false;
  };

})();
