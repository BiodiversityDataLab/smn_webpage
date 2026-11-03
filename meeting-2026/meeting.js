/* SMN meeting 2026 registration page
   - theme toggle (same localStorage key as the main site)
   - form: posts to the Apps Script web app via a hidden iframe (as for the BioSyst workshops)
   - conditional fields: best-practice session -> group (required); "Other substrates" -> substrates (required);
     workshop ticked -> dataset + laptop questions; own dataset "Yes" -> details (required)
   - places: asks the backend (?format=status) how many places are left; full -> form becomes the waiting list
   - preview mode: on localhost / file:// without an endpoint, submitting only shows the thank-you message
*/
(function () {
  const root = document.documentElement;

  // ---------- Theme ----------
  const THEME_KEY = "smn_theme";
  const toggles = document.querySelectorAll(".theme-toggle");
  function setIcon() {
    const isLight = root.getAttribute("data-theme") === "light";
    toggles.forEach((t) => {
      const icon = t.querySelector(".theme-icon");
      if (icon) icon.textContent = isLight ? "🌙" : "☀";
      t.setAttribute("aria-label", isLight ? "Switch to dark mode" : "Switch to light mode");
    });
  }
  toggles.forEach((t) => t.addEventListener("click", () => {
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    if (next === "light") root.setAttribute("data-theme", "light");
    else root.removeAttribute("data-theme");
    try { localStorage.setItem(THEME_KEY, next); } catch (e) {}
    setIcon();
  }));
  setIcon();

  // ---------- Form ----------
  const form = document.querySelector("form[data-meeting-form]");
  if (!form) return;

  const status = form.querySelector("[data-status]");
  const submit = form.querySelector('button[type="submit"]');
  const frame = document.getElementById(form.getAttribute("target"));
  const endpoint = window.SMN_MEETING_CONFIG && window.SMN_MEETING_CONFIG.endpoint;
  const connected = endpoint && !endpoint.includes("PASTE_YOUR");
  const isLocal = location.protocol === "file:" || ["localhost", "127.0.0.1", ""].includes(location.hostname);
  const preview = !connected && isLocal;
  const SUBMIT_LABEL = submit.textContent;
  let submitted = false;

  function showStatus(text, kind) {
    status.textContent = text;
    status.className = "form-status show" + (kind ? " " + kind : "");
  }

  if (connected) {
    form.action = endpoint;
  } else if (preview) {
    showStatus("Preview mode: the form is not connected yet, nothing will be sent.", "preview");
  } else {
    submit.disabled = true;
    showStatus("Registration opens shortly. Please check back soon or write to smn-members@lists.uu.se.", "error");
    return;
  }

  // ----- Conditional fields -----
  const reveal = (key) => form.querySelector(`[data-reveal="${key}"]`);
  // Show/hide a block; required inputs inside only count while it is visible
  function setShown(block, shown, requiredSelector) {
    block.hidden = !shown;
    block.querySelectorAll(requiredSelector).forEach((el) => { el.required = shown; });
  }
  // Group + substrates are always visible; required only when joining the best-practice session
  function setRequired(key, required) {
    form.querySelectorAll(`[name="${key}"]`).forEach((el) => { el.required = required; });
    form.querySelector(`[data-req="${key}"]`).hidden = !required;
  }
  function syncConditionals() {
    const bestPractice = form.querySelector('[data-toggles="session"]').checked;
    setRequired("session", bestPractice);
    const session = form.querySelector('input[name="session"]:checked')?.value;
    setRequired("substrates", bestPractice && session === "Other substrates");
    const workshop = form.querySelector('[data-toggles="workshop"]').checked;
    reveal("workshop").hidden = !workshop;
    const ownData = form.querySelector('input[name="own_dataset"]:checked')?.value === "Yes";
    setShown(reveal("dataset"), workshop && ownData, "textarea");
  }
  form.addEventListener("change", syncConditionals);
  syncConditionals();

  // At least one part must be ticked
  const partsGroup = form.querySelector('[data-required-group="parts"]');
  const partsError = partsGroup.querySelector("[data-group-error]");
  const partsOk = () => partsGroup.querySelectorAll('input[name="parts"]:checked').length > 0;
  partsGroup.addEventListener("change", () => { if (partsOk()) partsError.hidden = true; });

  // ----- Places left (cap of 60 in Code.gs; the backend decides, this is only the display) -----
  // The "N of 60 places left" line only appears from this many registrations on:
  // low numbers early on could put people off. "Fully booked" is always shown.
  const SHOW_PLACES_FROM = 30;
  const spots = document.querySelector("[data-spots]");
  let full = false;
  function showPlaces(s) {
    if (!s || typeof s.left !== "number") return;
    full = !!s.full;
    spots.hidden = !full && s.registered < SHOW_PLACES_FROM;
    spots.classList.toggle("full", full);
    spots.textContent = full
      ? "Fully booked. You can still register for the waiting list, we will email you if a place opens up."
      : `${s.left} of ${s.max} places left`;
    submit.textContent = full ? "Join the waiting list →" : SUBMIT_LABEL;
  }
  function loadPlaces() {
    if (!connected) return;
    fetch(endpoint + "?format=status", { cache: "no-store" })
      .then((r) => r.json()).then(showPlaces).catch(() => {}); // no number shown if this fails
  }
  loadPlaces();

  function thankYou() {
    form.reset();
    form.classList.remove("was-validated");
    syncConditionals();
    submit.disabled = false;
    submit.textContent = full ? "Join the waiting list →" : SUBMIT_LABEL;
    showStatus(
      preview
        ? "Preview: this is where the thank-you message appears. Nothing was sent."
        : full
          ? "Thank you! The meeting is fully booked, so you are on the waiting list. A confirmation email is on its way (check your spam folder if it doesn't arrive)."
          : "Thank you, your registration has been received! A confirmation email with your choices is on its way (check your spam folder if it doesn't arrive). If the last place was just taken, the email tells you that you are on the waiting list.",
      ""
    );
    status.scrollIntoView({ behavior: "smooth", block: "nearest" });
    loadPlaces();
  }

  form.addEventListener("submit", (e) => {
    const valid = form.checkValidity();
    const parts = partsOk();
    partsError.hidden = parts;
    if (!valid || !parts) {
      e.preventDefault();
      form.classList.add("was-validated");
      const firstBad = !parts ? partsGroup : form.querySelector(":invalid");
      firstBad.scrollIntoView({ behavior: "smooth", block: "center" });
      showStatus("Please fill in the highlighted fields.", "error");
      return;
    }

    submit.disabled = true;
    submit.textContent = "Submitting…";
    status.className = "form-status";

    if (preview) {
      e.preventDefault();
      setTimeout(thankYou, 600);
      return;
    }
    submitted = true; // the browser now posts the form into the hidden iframe
  });

  if (frame) {
    frame.addEventListener("load", () => {
      if (!submitted) return;
      submitted = false;
      thankYou();
    });
  }
})();
