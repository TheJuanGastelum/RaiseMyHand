// Stack simulator: the player clicks push/pop action buttons in order;
// Pete visually climbs a tower of stack frames as $sp moves. Used for the
// "why does a nested call need a stack" lesson (L6).
class StackSim {
  constructor(root, config) {
    this.root = root;
    this.config = config; // { actions: [{id,label,kind:'push'|'pop'}], correctSequence: [ids] }
    this.sequence = [];
    this.stack = []; // labels currently "on" the stack
    this._build();
  }

  _build() {
    const wrap = document.createElement("div");
    wrap.className = "stack";

    const canvas = document.createElement("canvas");
    this.canvasEl = canvas;
    canvas.style.width = "100%";
    canvas.style.maxWidth = "280px";
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
    this.pc = new PixelCanvas(canvas, 200, 220);
    wrap.appendChild(canvas);

    const actionsRow = document.createElement("div");
    actionsRow.className = "row";
    actionsRow.style.justifyContent = "center";
    this.config.actions.forEach((a) => {
      const btn = document.createElement("button");
      btn.textContent = a.label;
      btn.addEventListener("click", () => this._act(a));
      actionsRow.appendChild(btn);
    });
    const undoBtn = document.createElement("button");
    undoBtn.textContent = "↩ Undo";
    undoBtn.className = "ghost";
    undoBtn.addEventListener("click", () => this._undo());
    actionsRow.appendChild(undoBtn);
    wrap.appendChild(actionsRow);

    this.seqEl = document.createElement("div");
    this.seqEl.className = "dim";
    this.seqEl.style.fontSize = "9px";
    this.seqEl.style.textAlign = "center";
    wrap.appendChild(this.seqEl);

    this.root.appendChild(wrap);
    this._renderLoop();
    this._updateSeqLabel();
  }

  _act(action) {
    if (action.kind === "push") {
      this.stack.push(action.label);
    } else {
      this.stack.pop();
    }
    this.sequence.push(action.id);
    this._updateSeqLabel();
  }

  _undo() {
    if (this.sequence.length === 0) return;
    this.sequence.pop();
    // Rebuild stack state from scratch (simplest correct way to undo).
    this.stack = [];
    this.sequence.forEach((id) => {
      const a = this.config.actions.find((x) => x.id === id);
      if (a.kind === "push") this.stack.push(a.label);
      else this.stack.pop();
    });
    this._updateSeqLabel();
  }

  _updateSeqLabel() {
    this.seqEl.textContent = this.sequence.length ? this.sequence.join(" → ") : "(no actions yet)";
  }

  check() {
    const correct =
      this.sequence.length === this.config.correctSequence.length &&
      this.sequence.every((id, i) => id === this.config.correctSequence[i]);
    return { correct };
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  _renderLoop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    const loop = (now) => {
      this.render(now);
      this.raf = requestAnimationFrame(loop);
    };
    loop(0);
  }

  render(now) {
    const ctx = this.pc.ctx;
    ctx.fillStyle = "#0a0812";
    ctx.fillRect(0, 0, this.pc.w, this.pc.h);

    const baseY = 200;
    const frameH = 22;
    const frameW = 90;
    const x = this.pc.w / 2 - frameW / 2;

    // $sp baseline
    ctx.strokeStyle = "#4a4066";
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(10, baseY);
    ctx.lineTo(this.pc.w - 10, baseY);
    ctx.stroke();
    ctx.setLineDash([]);

    this.stack.forEach((label, i) => {
      const y = baseY - (i + 1) * frameH;
      ctx.fillStyle = i % 2 === 0 ? "#2a2440" : "#231d38";
      ctx.fillRect(x, y, frameW, frameH - 2);
      ctx.strokeStyle = "#6fe3ff";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, frameW, frameH - 2);
      ctx.fillStyle = "#f4f1f9";
      ctx.font = "9px monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, this.pc.w / 2, y + 15);
    });
    ctx.textAlign = "left";

    const topY = baseY - this.stack.length * frameH;
    ctx.fillStyle = "#ffb454";
    ctx.font = "8px monospace";
    ctx.textAlign = "right";
    ctx.fillText("$sp →", x - 4, topY + 14);
    ctx.textAlign = "left";

    Pete.draw(ctx, this.pc.w / 2 + frameW / 2 + 20, topY + frameH, { t: now });
  }
}
window.StackSim = StackSim;
