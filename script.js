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

      // Wide wordmark logos already contain the name -> show only the logo, keep the text for screen readers
      if (manualLogoUrl && link.hasAttribute("data-logo-wide")) {
        logo.classList.add("partner-logo--wide");
        text.classList.add("visually-hidden");
      }

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

  // ---------- Announcement banner: open the linked event's programme ----------
  document.querySelectorAll("[data-open-programme]").forEach((link) => {
    link.addEventListener("click", () => {
      const programme = document.querySelector(`${link.getAttribute("href")} .event-programme`);
      if (programme) programme.open = true;
    });
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
  const contactRecipient = "linus.lassen@ebc.uu.se";
  const contactEndpoint = "https://formsubmit.co/ajax/linus.lassen@ebc.uu.se";
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


  // ---------- Data map (live from GBIF) ----------
  // Filter: records with DNA sequences (isSequenced) published by organisations in Sweden.
  // No API key needed. Leaflet is loaded only when the map comes near the viewport.
  const gbifMapEl = document.getElementById("gbifMap");
  if (gbifMapEl) {
    const GBIF_FILTER = { publishingCountry: "SE", isSequenced: "true" };
    const LEAFLET_JS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    const LEAFLET_CSS = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    const LEAFLET_JS_SRI = "sha384-NElt3Op+9NBMCYaef5HxeJmU4Xeard/Lku8ek6hoPTvYkQPh3zLIrJP7KiRocsxO";
    const LEAFLET_CSS_SRI = "sha384-c6Rcwz4e4CITMbu/NBmnNS8yN2sC3cUElMEMfP3vqqKFp7GOYaaBBCqmaWBjmkjb";
    const statusEl = gbifMapEl.querySelector(".gbif-map-status");
    const fmt = new Intl.NumberFormat("en-GB");

    // Same style in light and dark mode (light map, darker green = more records): no tile reload on theme switch
    const ratio = window.devicePixelRatio > 1 ? 2 : 1;
    const baseUrl = `https://tile.gbif.org/3857/omt/{z}/{x}/{y}@${ratio}x.png?style=gbif-light`;
    const dataParams = new URLSearchParams({
      srs: "EPSG:3857",
      bin: "hex",
      hexPerTile: "45",
      style: "green2.poly",
      ...GBIF_FILTER,
    });
    const dataUrl = `https://api.gbif.org/v2/map/occurrence/adhoc/{z}/{x}/{y}@${ratio}x.png?${dataParams}`;

    function loadLeaflet() {
      if (window.L) return Promise.resolve(window.L);
      return new Promise((resolve, reject) => {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = LEAFLET_CSS;
        css.integrity = LEAFLET_CSS_SRI;
        css.crossOrigin = "anonymous";
        document.head.appendChild(css);
        const js = document.createElement("script");
        js.src = LEAFLET_JS;
        js.integrity = LEAFLET_JS_SRI;
        js.crossOrigin = "anonymous";
        js.onload = () => resolve(window.L);
        js.onerror = reject;
        document.head.appendChild(js);
      });
    }

    function initMap(L) {
      // GBIF tiles are 512 px -> tileSize 512 + zoomOffset -1 keeps Leaflet's zoom levels standard
      const tileOpts = { tileSize: 512, zoomOffset: -1, minZoom: 1, maxZoom: 12 };
      const map = L.map(gbifMapEl, { scrollWheelZoom: false, worldCopyJump: true, minZoom: 1, zoomSnap: 0.25 });
      map.fitBounds([[-26, -18], [69, 52]]); // Sweden plus field sites in Africa and Madagascar
      const base = L.tileLayer(baseUrl, {
        ...tileOpts,
        attribution:
          '<a href="https://www.gbif.org/" target="_blank" rel="noopener">GBIF</a> · © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> · © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors',
      }).addTo(map);
      // GBIF answers some empty hex tiles with an error image (red "503") -> only show tiles that return 200
      const SafeTileLayer = L.TileLayer.extend({
        createTile(coords, done) {
          const tile = document.createElement("img");
          tile.alt = "";
          fetch(this.getTileUrl(coords))
            .then((res) => {
              if (res.status !== 200) throw new Error(String(res.status));
              return res.blob();
            })
            .then((blob) => {
              tile.onload = () => {
                URL.revokeObjectURL(tile.src);
                done(null, tile);
              };
              tile.src = URL.createObjectURL(blob);
            })
            .catch(() => {
              tile.onload = () => done(null, tile);
              tile.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; // transparent pixel
            });
          return tile;
        },
      });
      new SafeTileLayer(dataUrl, tileOpts).addTo(map);
      base.once("load", () => statusEl && statusEl.remove());

      // scroll-wheel zoom only after the user clicks the map (no scroll hijacking)
      map.on("click focus", () => map.scrollWheelZoom.enable());
      map.on("mouseout blur", () => map.scrollWheelZoom.disable());
    }

    function loadStats() {
      const predicates = Object.entries(GBIF_FILTER)
        .map(([key, value]) => `{type: equals, key: "${key}", value: "${value}"}`)
        .join(", ");
      const query = `{ occurrenceSearch(predicate: {type: and, predicates: [${predicates}]}) {
        documents(size: 0) { total }
        cardinality { speciesKey datasetKey countryCode }
        facet { datasetKey(size: 500) { key count dataset { title } } }
      } }`;
      return fetch("https://graphql.gbif.org/graphql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(`GBIF ${res.status}`);
          return res.json();
        })
        .then((json) => {
          const search = json.data.occurrenceSearch;
          const values = {
            records: search.documents.total,
            species: search.cardinality.speciesKey,
            datasets: search.cardinality.datasetKey,
            countries: search.cardinality.countryCode,
          };
          document.querySelectorAll("[data-gbif-stat]").forEach((el) => {
            const value = values[el.getAttribute("data-gbif-stat")];
            if (typeof value === "number") countUp(el, value);
          });

          const list = document.getElementById("gbifDatasetList");
          if (list) {
            list.replaceChildren(
              ...search.facet.datasetKey.map((d) => {
                const li = document.createElement("li");
                const a = document.createElement("a");
                a.href = `https://www.gbif.org/dataset/${d.key}`;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                a.textContent = (d.dataset && d.dataset.title) || d.key;
                const count = document.createElement("span");
                count.className = "gbif-dataset-count";
                count.textContent = ` · ${fmt.format(d.count)} records`;
                li.append(a, count);
                return li;
              })
            );
          }
        });
    }

    function countUp(el, target) {
      const startTime = performance.now();
      const durationMs = 1200;
      function tick(now) {
        const t = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt.format(Math.round(target * eased));
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    const mapObserver = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        mapObserver.disconnect();
        loadLeaflet()
          .then(initMap)
          .catch(() => {
            if (statusEl) statusEl.textContent = "The map could not be loaded right now. Explore the data on GBIF instead.";
          });
        loadStats().catch(() => {
          document.querySelectorAll("[data-gbif-stat]").forEach((el) => (el.textContent = "–"));
        });
      },
      { rootMargin: "600px 0px" }
    );
    mapObserver.observe(gbifMapEl);
  }

})();
