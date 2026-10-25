// Overworld: a walkable map screen. Instead of clicking level cards, the
// player moves a little pixel character along a path between level nodes
// and steps onto one to play it. The puzzle screen itself (game.js) is
// unchanged — this only replaces how you get there.

const Overworld = {
  COLS: 4,
  MARGIN_X: 36,
  MARGIN_Y: 40,
  ROW_H: 62,
  WALK_MS: 320,

  canvas: null,
  pixelCanvas: null,
  levels: [],
  waypoints: [],
  current: 0, // index into waypoints the character occupies
  anim: null, // { fromIdx, toIdx, start } while walking
  rafId: null,
  onEnter: null, // callback(level)
  promptEl: null,

  layout(levels) {
    const cols = this.COLS;
    const colSpacing = (400 - this.MARGIN_X * 2) / (cols - 1);
    return levels.map((lvl, i) => {
      const row = Math.floor(i / cols);
      const posInRow = i % cols;
      const ltr = row % 2 === 0;
      const col = ltr ? posInRow : cols - 1 - posInRow;
      return {
        x: this.MARGIN_X + col * colSpacing,
        y: this.MARGIN_Y + row * this.ROW_H,
        level: lvl,
      };
    });
  },

  init(canvasEl, levels, promptEl, onEnter) {
    this.levels = levels;
    this.waypoints = this.layout(levels);
    this.onEnter = onEnter;
    this.promptEl = promptEl;

    const rows = Math.ceil(levels.length / this.COLS);
    const h = this.MARGIN_Y * 2 + (rows - 1) * this.ROW_H + 30;
    this.pixelCanvas = new PixelCanvas(canvasEl, 400, h);
    this.canvas = canvasEl;

    const progress = Progress.get();
    const completedCount = levels.filter((l) => progress.completed[l.id]).length;
    this.current = Math.min(completedCount, this.waypoints.length - 1);
    this.anim = null;

    if (!this._boundKeydown) {
      this._boundKeydown = this.handleKeydown.bind(this);
      this._boundClick = this.handleClick.bind(this);
    }
    document.addEventListener("keydown", this._boundKeydown);
    canvasEl.addEventListener("click", this._boundClick);

    if (this.rafId) cancelAnimationFrame(this.rafId);
    const loop = () => {
      this.render(performance.now());
      this.rafId = requestAnimationFrame(loop);
    };
    loop();
    this.updatePrompt();
  },

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this._boundKeydown) document.removeEventListener("keydown", this._boundKeydown);
    if (this._boundClick && this.canvas) this.canvas.removeEventListener("click", this._boundClick);
  },

  isUnlocked(idx) {
    return Progress.isUnlocked(this.levels, this.levels[idx].id);
  },

  charPos(now) {
    if (!this.anim) return this.waypoints[this.current];
    const t = Math.min(1, (now - this.anim.start) / this.WALK_MS);
    const a = this.waypoints[this.anim.fromIdx];
    const b = this.waypoints[this.anim.toIdx];
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    return { x: a.x + (b.x - a.x) * ease, y: a.y + (b.y - a.y) * ease };
  },

  walkTo(idx) {
    if (idx < 0 || idx >= this.waypoints.length) return;
    if (idx === this.current && !this.anim) return;
    if (!this.isUnlocked(idx)) {
      pixelNotice("That level is still locked — finish the one before it first.");
      return;
    }
    this.anim = { fromIdx: this.current, toIdx: idx, start: performance.now() };
    this.current = idx;
  },

  handleKeydown(e) {
    if (document.getElementById("puzzle-screen").style.display === "block") return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      this.walkTo(Math.min(this.current + 1, this.waypoints.length - 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      this.walkTo(Math.max(this.current - 1, 0));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      this.tryEnter();
    }
  },

  handleClick(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.pixelCanvas.w / rect.width;
    const scaleY = this.pixelCanvas.h / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    let closest = -1;
    let bestDist = Infinity;
    this.waypoints.forEach((wp, i) => {
      const d = Math.hypot(wp.x - x, wp.y - y);
      if (d < bestDist) {
        bestDist = d;
        closest = i;
      }
    });
    if (closest === -1 || bestDist > 24) return;
    if (closest === this.current && !this.anim) {
      this.tryEnter();
    } else {
      this.walkTo(closest);
    }
  },

  tryEnter() {
    if (this.anim) return;
    const level = this.waypoints[this.current].level;
    if (!this.isUnlocked(this.current)) {
      pixelNotice("Locked — finish the previous level first.");
      return;
    }
    if (this.onEnter) this.onEnter(level);
  },

  updatePrompt() {
    if (!this.promptEl) return;
    const level = this.waypoints[this.current].level;
    this.promptEl.textContent = `${level.topic} — ${level.title}  ·  Press Enter / Space to play`;
  },

  render(now) {
    const ctx = this.pixelCanvas.ctx;
    const w = this.pixelCanvas.w,
      h = this.pixelCanvas.h;
    CircuitRender.clear(ctx, w, h);

    const progress = Progress.get();

    // path
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const a = this.waypoints[i],
        b = this.waypoints[i + 1];
      const unlocked = this.isUnlocked(i + 1);
      ctx.strokeStyle = unlocked ? CircuitRender.palette.wire : CircuitRender.palette.wireOff;
      ctx.lineWidth = 2;
      ctx.setLineDash(unlocked ? [] : [3, 3]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // nodes
    this.waypoints.forEach((wp, i) => {
      const unlocked = this.isUnlocked(i);
      const done = progress.completed[wp.level.id];
      const stars = progress.stars[wp.level.id] || 0;
      const r = 9;
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, r, 0, Math.PI * 2);
      ctx.fillStyle = !unlocked
        ? CircuitRender.palette.wireOff
        : done
        ? CircuitRender.palette.good
        : CircuitRender.palette.node;
      ctx.fill();
      ctx.strokeStyle = CircuitRender.palette.text;
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = CircuitRender.palette.bg;
      ctx.font = "8px monospace";
      ctx.textAlign = "center";
      ctx.fillText(unlocked ? String(i + 1) : "?", wp.x, wp.y + 3);
      ctx.textAlign = "left";
      if (done && stars > 0) {
        ctx.fillStyle = CircuitRender.palette.target;
        ctx.font = "7px monospace";
        ctx.textAlign = "center";
        ctx.fillText("★".repeat(stars), wp.x, wp.y - r - 3);
        ctx.textAlign = "left";
      }
    });

    // character
    const pos = this.charPos(now);
    const moving = !!this.anim;
    if (moving && now - this.anim.start >= this.WALK_MS) this.anim = null;
    this.drawCharacter(ctx, pos.x, pos.y - 14, moving, now);
    this.updatePrompt();
  },

  drawCharacter(ctx, x, y, walking, now) {
    const bob = walking ? Math.sin(now / 60) * 2 : 0;
    const legPhase = walking ? Math.sin(now / 70) : 0;
    ctx.fillStyle = "#ffcf6b";
    ctx.fillRect(x - 3, y + bob, 6, 6); // head
    ctx.fillStyle = CircuitRender.palette.good;
    ctx.fillRect(x - 4, y + 6 + bob, 8, 7); // body
    ctx.fillStyle = "#2b2f57";
    ctx.fillRect(x - 4 + legPhase * 2, y + 13 + bob, 3, 5); // left leg
    ctx.fillRect(x + 1 - legPhase * 2, y + 13 + bob, 3, 5); // right leg
    ctx.fillStyle = "#000";
    ctx.fillRect(x - 2, y + 2 + bob, 1, 1);
    ctx.fillRect(x + 1, y + 2 + bob, 1, 1);
  },
};

window.Overworld = Overworld;
