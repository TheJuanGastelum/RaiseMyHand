// One-time "agree to Terms & Privacy" gate shown before the game is usable.
// Bump TERMS_VERSION to make everyone re-accept (e.g. after a legal.html change).
(function () {
  const TERMS_VERSION = "2026-10-02.1";
  const KEY = "circuit-quest-terms-accepted";

  function accepted() {
    try {
      return localStorage.getItem(KEY) === TERMS_VERSION;
    } catch {
      return false;
    }
  }

  const gate = document.getElementById("terms-gate");
  if (!gate) return;

  if (accepted()) {
    gate.remove();
    return;
  }

  const checkbox = document.getElementById("terms-agree-checkbox");
  const btn = document.getElementById("terms-agree-btn");

  // Keep keyboard/screen-reader focus trapped on the gate until it's accepted.
  const rest = Array.from(document.body.children).filter((el) => el !== gate);
  rest.forEach((el) => el.setAttribute("inert", ""));
  checkbox.focus();

  checkbox.addEventListener("change", () => {
    btn.disabled = !checkbox.checked;
  });

  btn.addEventListener("click", () => {
    if (!checkbox.checked) return;
    try {
      localStorage.setItem(KEY, TERMS_VERSION);
    } catch {}
    rest.forEach((el) => el.removeAttribute("inert"));
    gate.remove();
  });
})();
