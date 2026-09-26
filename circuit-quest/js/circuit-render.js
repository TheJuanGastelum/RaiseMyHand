// Shared low-level drawing primitives for circuit diagrams.
//
// Everything is drawn at a small internal resolution (see PixelCanvas in
// engine.js) and then scaled up with nearest-neighbor scaling, which is
// what gives the chunky retro-pixel look without needing sprite art files.

const PALETTE = {
  bg: "#0f1021",
  panel: "#1b1e3a",
  wire: "#7ef7c1",
  wireOff: "#3a3f6b",
  node: "#ffe66d",
  battery: "#ff6b6b",
  resistor: "#4ecdc4",
  capacitor: "#c77dff",
  text: "#f4f4f9",
  textDim: "#8b8fc4",
  good: "#7ef7c1",
  bad: "#ff6b6b",
  target: "#ffe66d",
};

const CircuitRender = {
  palette: PALETTE,

  clear(ctx, w, h) {
    ctx.fillStyle = PALETTE.bg;
    ctx.fillRect(0, 0, w, h);
  },

  wire(ctx, x1, y1, x2, y2, animated, t) {
    ctx.strokeStyle = PALETTE.wire;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1 + 0.5, y1 + 0.5);
    ctx.lineTo(x2 + 0.5, y2 + 0.5);
    ctx.stroke();
    if (animated) this.flowDots(ctx, x1, y1, x2, y2, t);
  },

  flowDots(ctx, x1, y1, x2, y2, t) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const dx = (x2 - x1) / len;
    const dy = (y2 - y1) / len;
    const spacing = 14;
    const count = Math.max(1, Math.floor(len / spacing));
    ctx.fillStyle = PALETTE.node;
    for (let i = 0; i < count; i++) {
      const base = (i * spacing + t) % len;
      const px = x1 + dx * base;
      const py = y1 + dy * base;
      ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 2, 2);
    }
  },

  battery(ctx, x, y) {
    ctx.strokeStyle = PALETTE.battery;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - 10);
    ctx.lineTo(x, y + 10);
    ctx.moveTo(x + 6, y - 6);
    ctx.lineTo(x + 6, y + 6);
    ctx.stroke();
    ctx.fillStyle = PALETTE.text;
    ctx.font = "8px monospace";
    ctx.fillText("+", x - 10, y - 8);
    ctx.fillText("-", x + 10, y - 8);
  },

  resistor(ctx, x, y, w, label) {
    const zig = 6;
    const steps = 6;
    const stepW = w / steps;
    ctx.strokeStyle = PALETTE.resistor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - w / 2, y);
    for (let i = 0; i < steps; i++) {
      const sx = x - w / 2 + stepW * (i + 1);
      const sy = y + (i % 2 === 0 ? -zig : zig);
      ctx.lineTo(sx, sy);
    }
    ctx.lineTo(x + w / 2, y);
    ctx.stroke();
    if (label) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y + 22);
      ctx.textAlign = "left";
    }
  },

  capacitor(ctx, x, y, label) {
    ctx.strokeStyle = PALETTE.capacitor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - 8, y - 10);
    ctx.lineTo(x - 8, y + 10);
    ctx.moveTo(x + 8, y - 10);
    ctx.lineTo(x + 8, y + 10);
    ctx.stroke();
    if (label) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(label, x, y + 24);
      ctx.textAlign = "left";
    }
  },

  node(ctx, x, y, label, highlight) {
    ctx.fillStyle = highlight ? PALETTE.target : PALETTE.node;
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
    if (label) {
      ctx.fillStyle = PALETTE.textDim;
      ctx.font = "8px monospace";
      ctx.fillText(label, x + 6, y - 6);
    }
  },

  text(ctx, x, y, str, color, size) {
    ctx.fillStyle = color || PALETTE.text;
    ctx.font = (size || 9) + "px monospace";
    ctx.fillText(str, x, y);
  },
};

window.CircuitRender = CircuitRender;
