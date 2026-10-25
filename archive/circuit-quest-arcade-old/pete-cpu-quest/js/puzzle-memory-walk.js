// Memory-walk: a row of word-aligned memory boxes (4 bytes apart). Pete
// stands at the start; the player clicks the box holding the requested
// array element, and Pete walks over to it.
class MemoryWalk {
  constructor(root, config, onPick) {
    this.root = root;
    this.config = config; // { startAddr, count, correctAddr, arrayLabel }
    this.onPick = onPick;
    this.picked = null;
    this._build();
  }

  _build() {
    const wrap = document.createElement("div");
    wrap.className = "stack";
    const canvas = document.createElement("canvas");
    this.canvasEl = canvas;
    wrap.appendChild(canvas);
    this.root.appendChild(wrap);

    this.pc = new PixelCanvas(canvas, 400, 140);
    canvas.style.width = "100%";
    canvas.style.maxWidth = "480px";
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
    canvas.style.cursor = "pointer";

    this.boxW = 40;
    this.gap = 6;
    this.startX = 20;
    this.boxY = 60;

    canvas.addEventListener("click", (e) => this._onClick(e));
    if (this.raf) cancelAnimationFrame(this.raf);
    const loop = () => {
      this.render(performance.now());
      this.raf = requestAnimationFrame(loop);
    };
    loop();
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  boxIndexAt(clientX, clientY) {
    const rect = this.canvasEl.getBoundingClientRect();
    const scaleX = this.pc.w / rect.width;
    const scaleY = this.pc.h / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    if (y < this.boxY || y > this.boxY + 36) return -1;
    const idx = Math.floor((x - this.startX) / (this.boxW + this.gap));
    if (idx < 0 || idx >= this.config.count) return -1;
    return idx;
  }

  _onClick(e) {
    const idx = this.boxIndexAt(e.clientX, e.clientY);
    if (idx === -1) return;
    this.picked = idx;
    this.petePos = idx;
  }

  check() {
    const addr = this.config.startAddr + (this.picked ?? -999) * 4;
    return { correct: addr === this.config.correctAddr, picked: this.picked };
  }

  render(now) {
    const ctx = this.pc.ctx;
    ctx.fillStyle = "#0a0812";
    ctx.fillRect(0, 0, this.pc.w, this.pc.h);
    for (let i = 0; i < this.config.count; i++) {
      const x = this.startX + i * (this.boxW + this.gap);
      const addr = this.config.startAddr + i * 4;
      const picked = this.picked === i;
      ctx.fillStyle = picked ? "#3b2d1c" : "#1f1b2e";
      ctx.fillRect(x, this.boxY, this.boxW, 30);
      ctx.strokeStyle = picked ? "#ffb454" : "#4a4066";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, this.boxY, this.boxW, 30);
      ctx.fillStyle = "#9b93b0";
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(String(addr), x + this.boxW / 2, this.boxY + 20);
      ctx.fillText(`[${i}]`, x + this.boxW / 2, this.boxY + 42);
    }
    ctx.textAlign = "left";

    const idx = this.petePos ?? 0;
    const px = this.startX + idx * (this.boxW + this.gap) + this.boxW / 2;
    Pete.draw(ctx, px, this.boxY, { t: now });

    ctx.fillStyle = "#f4f1f9";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(this.config.arrayLabel || "", this.pc.w / 2, 20);
    ctx.textAlign = "left";
  }
}
window.MemoryWalk = MemoryWalk;
