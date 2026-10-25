// Tiny UI helpers used in place of native confirm()/alert(), which some
// embedded/sandboxed viewers silently no-op. Pixel-styled, self-contained.

function pixelConfirm(message, onYes) {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;";
  const box = document.createElement("div");
  box.className = "panel stack";
  box.style.cssText = "max-width:320px;";
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
  yes.addEventListener("click", () => { close(); onYes(); });
  no.addEventListener("click", close);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
}

function pixelNotice(message) {
  const toast = document.createElement("div");
  toast.className = "panel";
  toast.style.cssText =
    "position:fixed;bottom:16px;left:50%;transform:translateX(-50%);z-index:1000;max-width:90vw;";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2600);
}

function pixelTextDialog(title, text) {
  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:16px;";
  const box = document.createElement("div");
  box.className = "panel stack";
  box.style.cssText = "max-width:520px;width:100%;";
  box.innerHTML = `<h3 style="margin:0;">${title}</h3>`;
  const ta = document.createElement("textarea");
  ta.readOnly = true;
  ta.value = text;
  ta.style.minHeight = "220px";
  box.appendChild(ta);
  const row = document.createElement("div");
  row.className = "row";
  const copyBtn = document.createElement("button");
  copyBtn.className = "primary";
  copyBtn.textContent = "Copy to Clipboard";
  const closeBtn = document.createElement("button");
  closeBtn.textContent = "Close";
  row.appendChild(copyBtn);
  row.appendChild(closeBtn);
  box.appendChild(row);
  overlay.appendChild(box);
  document.body.appendChild(overlay);
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(text);
      pixelNotice("Copied to clipboard.");
    } catch {
      ta.focus();
      ta.select();
      pixelNotice("Copy failed — text is selected, press Ctrl/Cmd+C.");
    }
  });
  closeBtn.addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
}
