// Wire-connect: click one node, then another, to draw a connection between
// them (click an existing connection's pair again to remove it). Used for
// "wire the datapath" (L10) and "add the forwarding path" (L16) puzzles.
class WireConnect {
  constructor(root, config) {
    this.root = root;
    this.config = config; // { nodes:[{id,label,x,y}], correctPairs:[[a,b],...], w, h }
    this.connections = []; // [[a,b], ...]
    this.selected = null;
    this.feedback = null; // after check(): array of {pair, ok}
    this._build();
  }

  _build() {
    const wrap = document.createElement("div");
    wrap.className = "stack";
    const canvas = document.createElement("canvas");
    this.canvasEl = canvas;
    canvas.style.width = "100%";
    canvas.style.maxWidth = "480px";
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
    canvas.style.cursor = "pointer";
    this.pc = new PixelCanvas(canvas, this.config.w || 400, this.config.h || 220);
    wrap.appendChild(canvas);
    const hint = document.createElement("p");
    hint.className = "dim";
    hint.style.fontSize = "9px";
    hint.style.textAlign = "center";
    hint.textContent = "Tap one component, then another, to wire them. Tap a wire's two ends again to remove it.";
    wrap.appendChild(hint);
    this.root.appendChild(wrap);

    canvas.addEventListener("click", (e) => this._onClick(e));
    const loop = (now) => {
      this.render(now);
      this.raf = requestAnimationFrame(loop);
    };
    loop(0);
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
  }

  _nodeAt(clientX, clientY) {
    const rect = this.canvasEl.getBoundingClientRect();
    const scaleX = this.pc.w / rect.width;
    const scaleY = this.pc.h / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    let best = null,
      bestDist = 18;
    this.config.nodes.forEach((n) => {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = n;
      }
    });
    return best;
  }

  _onClick(e) {
    this.feedback = null;
    const node = this._nodeAt(e.clientX, e.clientY);
    if (!node) {
      this.selected = null;
      return;
    }
    if (!this.selected) {
      this.selected = node.id;
      return;
    }
    if (this.selected === node.id) {
      this.selected = null;
      return;
    }
    const a = this.selected,
      b = node.id;
    const idx = this.connections.findIndex((c) => (c[0] === a && c[1] === b) || (c[0] === b && c[1] === a));
    if (idx !== -1) this.connections.splice(idx, 1);
    else this.connections.push([a, b]);
    this.selected = null;
  }

  check() {
    const norm = (p) => [p[0], p[1]].sort().join("|");
    const correctSet = new Set(this.config.correctPairs.map(norm));
    const haveSet = new Set(this.connections.map(norm));
    let correct = 0;
    correctSet.forEach((p) => {
      if (haveSet.has(p)) correct++;
    });
    const extra = [...haveSet].filter((p) => !correctSet.has(p)).length;
    this.feedback = { correctSet, haveSet };
    return { correct, total: correctSet.size, extra, allCorrect: correct === correctSet.size && extra === 0 };
  }

  render() {
    const ctx = this.pc.ctx;
    ctx.fillStyle = "#0a0812";
    ctx.fillRect(0, 0, this.pc.w, this.pc.h);

    const byId = {};
    this.config.nodes.forEach((n) => (byId[n.id] = n));

    this.connections.forEach((c) => {
      const a = byId[c[0]],
        b = byId[c[1]];
      let color = "#6fe3ff";
      if (this.feedback) {
        const key = [c[0], c[1]].sort().join("|");
        color = this.feedback.correctSet.has(key) ? "#7ef7c1" : "#ff6b6b";
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });

    this.config.nodes.forEach((n) => {
      const sel = this.selected === n.id;
      ctx.fillStyle = sel ? "#ffb454" : "#2a2440";
      ctx.strokeStyle = "#6fe3ff";
      ctx.lineWidth = 2;
      ctx.fillRect(n.x - 26, n.y - 10, 52, 20);
      ctx.strokeRect(n.x - 26, n.y - 10, 52, 20);
      ctx.fillStyle = sel ? "#121018" : "#f4f1f9";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(n.label, n.x, n.y + 3);
      ctx.textAlign = "left";
    });
  }
}
window.WireConnect = WireConnect;
