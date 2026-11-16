// Apply the saved theme before the page paints (same key as the main site).
// Own file, not inline, so the Content-Security-Policy in _headers can block inline scripts.
try {
  var t = localStorage.getItem("smn_theme");
  if (!t && window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) t = "light";
  if (t === "light") document.documentElement.setAttribute("data-theme", "light");
} catch (e) {}
