// Per-level feedback -> submits to Netlify Forms (no backend needed).
// Submissions land in the Netlify dashboard under Forms > "feedback".
// (Forms must be enabled in Netlify site settings for submissions to be captured — confirmed enabled 2026-10-02.)
(function () {
  const modal = document.getElementById("feedback-modal");
  const btn = document.getElementById("feedback-btn");
  const closeBtn = document.getElementById("feedback-close");
  const form = document.getElementById("feedback-form");
  const levelField = document.getElementById("feedback-level-field");
  const messageField = document.getElementById("feedback-message");
  const statusEl = document.getElementById("feedback-status");
  if (!modal || !btn || !form) return;

  function currentLevelTitle() {
    const el = document.getElementById("puzzle-title");
    const text = el && el.textContent.trim();
    return text || "Map / overworld";
  }

  function open() {
    levelField.value = currentLevelTitle();
    messageField.value = "";
    statusEl.textContent = "";
    modal.hidden = false;
    messageField.focus();
  }

  function close() {
    modal.hidden = true;
  }

  btn.addEventListener("click", open);
  closeBtn.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !modal.hidden) close();
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    statusEl.textContent = "Sending...";
    try {
      await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(new FormData(form)).toString(),
      });
      statusEl.textContent = "Thanks — sent!";
      setTimeout(close, 1200);
    } catch {
      statusEl.textContent = "Couldn't send — check your connection and try again.";
    }
  });
})();
