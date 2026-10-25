// Overworld: Pete walks a winding path between level nodes, grouped into
// 3 colored worlds (Memory / Debug / Datapath) plus the final Gauntlet.

const WORLD_COLORS = {
  memory: "#7ef7c1",
  debug: "#ffb454",
  datapath: "#6fe3ff",
  gauntlet: "#ff6b6b",
};

const Overworld = {
  COLS: 4,
  MARGIN_X: 36,
  MARGIN_Y: 40,
  ROW_H: 62,
  WALK_MS: 320,

  levels: [],
  waypoints: [],
  current: 0,
  anim: null,
  rafId: null,
  onEnter: null,
  promptEl: null,

  layout(levels) {
    const cols = this.COLS;
    const colSpacing = (400 - this.MARGIN_X * 2) / (cols - 1);
    return levels.map((lvl, i) => {
      const row = Math.floor(i / cols);
      const posInRow = i % cols;
      const ltr = row % 2 === 0;
      const col = ltr ? posInRow : cols - 1 - posInRow;
      return { x: this.MARGIN_X + col * colSpacing, y: this.MARGIN_Y + row * this.ROW_H, level: lvl };
    });
  },

  init(canvasEl, levels, promptEl, onEnter) {
    this.levels = levels;
    this.waypoints = this.layout(levels);
    this.onEnter = onEnter;
    this.promptEl = promptEl;
    this.canvas = canvasEl;

    const rows = Math.ceil(levels.length / this.COLS);
    const h = this.MARGIN_Y * 2 + (rows - 1) * this.ROW_H + 30;
    this.pixelCanvas = new PixelCanvas(canvasEl, 400, h);

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
      pixelNotice("Locked — finish the previous level first.");
      return;
    }
    this.anim = { fromIdx: this.current, toIdx: idx, start: performance.now() };
    this.current = idx;
  },

  handleKeydown(e) {
    if (document.getElementById("puzzle-screen").style.display === "block") return;
    const k = e.key.toLowerCase();
    if (k === "arrowright" || k === "arrowdown" || k === "d" || k === "s") {
      e.preventDefault();
      this.walkTo(Math.min(this.current + 1, this.waypoints.length - 1));
    } else if (k === "arrowleft" || k === "arrowup" || k === "a" || k === "w") {
      e.preventDefault();
      this.walkTo(Math.max(this.current - 1, 0));
    } else if (k === "enter" || k === " ") {
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
    let closest = -1,
      bestDist = Infinity;
    this.waypoints.forEach((wp, i) => {
      const d = Math.hypot(wp.x - x, wp.y - y);
      if (d < bestDist) {
        bestDist = d;
        closest = i;
      }
    });
    if (closest === -1 || bestDist > 24) return;
    if (closest === this.current && !this.anim) this.tryEnter();
    else this.walkTo(closest);
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
    this.promptEl.textContent = `${level.lecture} — ${level.title}  ·  Press Enter / Space to play`;
  },

  render(now) {
    const ctx = this.pixelCanvas.ctx;
    const w = this.pixelCanvas.w,
      h = this.pixelCanvas.h;
    ctx.fillStyle = "#121018";
    ctx.fillRect(0, 0, w, h);

    const progress = Progress.get();

    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const a = this.waypoints[i],
        b = this.waypoints[i + 1];
      const unlocked = this.isUnlocked(i + 1);
      ctx.strokeStyle = unlocked ? WORLD_COLORS[b.level.world] || "#6fe3ff" : "#3a3450";
      ctx.lineWidth = 2;
      ctx.setLineDash(unlocked ? [] : [3, 3]);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    this.waypoints.forEach((wp, i) => {
      const unlocked = this.isUnlocked(i);
      const done = progress.completed[wp.level.id];
      const stars = progress.stars[wp.level.id] || 0;
      const r = 9;
      const worldColor = WORLD_COLORS[wp.level.world] || "#6fe3ff";
      ctx.beginPath();
      ctx.arc(wp.x, wp.y, r, 0, Math.PI * 2);
      ctx.fillStyle = !unlocked ? "#3a3450" : done ? "#7ef7c1" : worldColor;
      ctx.fill();
      ctx.strokeStyle = "#f4f1f9";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#121018";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(unlocked ? wp.level.lecture.replace("L", "") : "?", wp.x, wp.y + 3);
      ctx.textAlign = "left";
      if (done && stars > 0) {
        ctx.fillStyle = "#ffb454";
        ctx.font = "7px monospace";
        ctx.textAlign = "center";
        ctx.fillText("★".repeat(stars), wp.x, wp.y - r - 3);
        ctx.textAlign = "left";
      }
    });

    const pos = this.charPos(now);
    const moving = !!this.anim;
    if (moving && now - this.anim.start >= this.WALK_MS) this.anim = null;
    Pete.draw(ctx, pos.x, pos.y + 2, { walking: moving, t: now });
    this.updatePrompt();
  },
};
window.Overworld = Overworld;
