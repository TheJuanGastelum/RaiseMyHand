// Small UI helpers in place of native confirm()/alert(), which can silently
// no-op in some embedded/sandboxed viewers. Pixel-styled, self-contained.

function pixelConfirm(message, onYes) {
  const overlay = document.createElement("div");
  overlay.className = "pq-overlay";
  const box = document.createElement("div");
  box.className = "panel stack";
  box.style.maxWidth = "320px";
  box.innerHTML = `<p style="margin:0;">${message}</p>`;
  const row = document.createElement("div");
  row.className = "row";
  const yes = document.createElement("button");
  yes.className = "danger";
  yes.textContent = "Yes";
  const no = document.createElement("button");
  no.textContent = "Cancel";
  row.appendChild(yes);
  row.appendChild(no);
  box.appendChild(row);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  yes.addEventListener("click", () => {
    close();
    onYes();
  });
  no.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
}

function pixelNotice(message) {
  const toast = document.createElement("div");
  toast.className = "panel pq-toast";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2400);
}

window.pixelConfirm = pixelConfirm;
window.pixelNotice = pixelNotice;
