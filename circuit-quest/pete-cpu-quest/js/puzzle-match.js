// Walk-and-carry matching engine. Pete physically walks over to a chip,
// picks it up (Space), carries it to the right slot or bin, and sets it
// down (Space again). This is the workhorse behind most puzzle levels:
// register matching, fill-in-the-blank code, sorting instructions into
// bins, control-signal tables, and pipeline-stage snapshots are all just
// this same "carry a labeled chip to a labeled target" task with
// different target layouts.
//
// Move with WASD / arrow keys, or click/tap a chip or target to have Pete
// walk straight to it (and auto pick-up/drop on arrival) — the
// touch-friendly shortcut for the same action.
//
// config = {
//   mode: "slots" | "bins" | "code",
//   slots: [{id,label}]        // mode: slots
//   bins:  [{id,label}]        // mode: bins (each accepts many chips)
//   chips: [{id,label,correct}]  // correct = target id (slot or bin), or
//                                 // an array of acceptable ids, or null
//                                 // for a decoy that should stay unplaced
//   codeLines: [ "text {{slotId|label}} more text", ... ]  // mode: code
// }
class DragMatch {
  static W = 400;
  static H = 230;
  static CHIP_W = 52;
  static CHIP_H = 18;
  static SLOT_W = 58;
  static SLOT_H = 24;
  static BIN_W = 74;
  static BIN_H = 56;
  static REACH = 26;
  static SPEED = 2.6;

  constructor(root, config) {
    this.root = root;
    this.config = config;
    this.placements = {}; // chipId -> targetId
    this.carrying = null; // chipId or null
    this.pete = { x: 200, y: 195 };
    this.walkTarget = null;
    this.held = { up: false, down: false, left: false, right: false };
    this._build();
  }

  _build() {
    if (this.config.mode === "code") this._buildCodePanel();

    const wrap = document.createElement("div");
    wrap.className = "stack";
    const canvas = document.createElement("canvas");
    this.canvasEl = canvas;
    canvas.style.width = "100%";
    canvas.style.maxWidth = "480px";
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
    canvas.style.cursor = "pointer";
    this.pc = new PixelCanvas(canvas, DragMatch.W, DragMatch.H);
    wrap.appendChild(canvas);

    const hint = document.createElement("p");
    hint.className = "dim";
    hint.style.fontSize = "9px";
    hint.style.textAlign = "center";
    hint.textContent = "WASD/arrows to move, Space to pick up or set down — or just tap a chip, then tap where it goes.";
    wrap.appendChild(hint);

    this.root.appendChild(wrap);

    this._buildTargets();
    this._buildChips();

    canvas.addEventListener("click", (e) => this._onClick(e));
    this._onKeydown = (e) => this._keydown(e);
    this._onKeyup = (e) => this._keyup(e);
    document.addEventListener("keydown", this._onKeydown);
    document.addEventListener("keyup", this._onKeyup);

    const loop = (now) => {
      this._tick();
      this.render(now);
      this.raf = requestAnimationFrame(loop);
    };
    loop(0);
  }

  destroy() {
    if (this.raf) cancelAnimationFrame(this.raf);
    document.removeEventListener("keydown", this._onKeydown);
    document.removeEventListener("keyup", this._onKeyup);
  }

  _buildCodePanel() {
    const pre = document.createElement("div");
    pre.className = "pq-code";
    this.config.codeLines.forEach((line, i) => {
      const lineEl = document.createElement("div");
      const text = line.replace(/\{\{([^|}]+)(\|[^}]*)?\}\}/g, (m, id) => `[ ${id} ]`);
      lineEl.appendChild(document.createTextNode(text));
      if (i < this.config.codeLines.length - 1) lineEl.appendChild(document.createElement("br"));
      pre.appendChild(lineEl);
    });
    this.root.appendChild(pre);
  }

  _targetDefs() {
    if (this.config.mode === "bins") return this.config.bins.map((b) => ({ ...b, capacity: Infinity }));
    if (this.config.mode === "code") {
      const seen = [];
      this.config.codeLines.forEach((line) => {
        const re = /\{\{([^|}]+)\|?([^}]*)\}\}/g;
        let m;
        while ((m = re.exec(line))) seen.push({ id: m[1], label: m[2] || m[1], capacity: 1 });
      });
      return seen;
    }
    return this.config.slots.map((s) => ({ ...s, capacity: 1 }));
  }

  _buildTargets() {
    const defs = this._targetDefs();
    const n = defs.length;
    const margin = 44;
    const spacing = n > 1 ? (DragMatch.W - margin * 2) / (n - 1) : 0;
    this.targets = defs.map((d, i) => ({
      ...d,
      x: n === 1 ? DragMatch.W / 2 : margin + i * spacing,
      y: 50,
      occupants: [],
    }));
  }

  _buildChips() {
    const n = this.config.chips.length;
    const margin = 36;
    const spacing = n > 1 ? (DragMatch.W - margin * 2) / (n - 1) : 0;
    this.chips = this.config.chips.map((c, i) => ({
      ...c,
      x: n === 1 ? DragMatch.W / 2 : margin + i * spacing,
      y: DragMatch.H - 24,
      state: "bank", // bank | carried | placed | loose
      targetId: null,
    }));
  }

  _keydown(e) {
    const k = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " "].includes(k)) e.preventDefault();
    if (k === "arrowup" || k === "w") this.held.up = true;
    else if (k === "arrowdown" || k === "s") this.held.down = true;
    else if (k === "arrowleft" || k === "a") this.held.left = true;
    else if (k === "arrowright" || k === "d") this.held.right = true;
    else if (k === " ") this._interact();
    if (this.held.up || this.held.down || this.held.left || this.held.right) this.walkTarget = null;
  }

  _keyup(e) {
    const k = e.key.toLowerCase();
    if (k === "arrowup" || k === "w") this.held.up = false;
    else if (k === "arrowdown" || k === "s") this.held.down = false;
    else if (k === "arrowleft" || k === "a") this.held.left = false;
    else if (k === "arrowright" || k === "d") this.held.right = false;
  }

  _nearest(items, px, py, reach) {
    let best = null,
      bestDist = reach;
    items.forEach((it) => {
      const d = Math.hypot(it.x - px, it.y - py);
      if (d < bestDist) {
        bestDist = d;
        best = it;
      }
    });
    return best;
  }

  _onClick(e) {
    const rect = this.canvasEl.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * this.pc.w;
    const y = ((e.clientY - rect.top) / rect.height) * this.pc.h;

    const chip = this._nearest(
      this.chips.filter((c) => c.state !== "placed"),
      x,
      y,
      30
    );
    const target = this._nearest(this.targets, x, y, 34);

    if (!this.carrying && chip) {
      this.walkTarget = { x: chip.x, y: chip.y, thenInteract: true };
      this.held = { up: false, down: false, left: false, right: false };
      return;
    }
    if (this.carrying && target) {
      this.walkTarget = { x: target.x, y: target.y, thenInteract: true };
      this.held = { up: false, down: false, left: false, right: false };
      return;
    }
    this.walkTarget = { x, y, thenInteract: false };
  }

  _interact() {
    if (!this.carrying) {
      const chip = this._nearest(
        this.chips.filter((c) => c.state !== "placed"),
        this.pete.x,
        this.pete.y,
        DragMatch.REACH
      );
      if (!chip) return;
      chip.state = "carried";
      this.carrying = chip.id;
      delete this.placements[chip.id];
      if (this.feedback) delete this.feedback[chip.id];
    } else {
      const chip = this.chips.find((c) => c.id === this.carrying);
      const target = this._nearest(this.targets, this.pete.x, this.pete.y, DragMatch.REACH);
      if (target) {
        if (target.capacity === 1 && target.occupants.length) {
          const bumpedId = target.occupants[0];
          const bumped = this.chips.find((c) => c.id === bumpedId);
          bumped.state = "loose";
          bumped.x = target.x;
          bumped.y = target.y + 30;
          target.occupants = [];
          delete this.placements[bumpedId];
        }
        target.occupants.push(chip.id);
        chip.state = "placed";
        chip.targetId = target.id;
        chip.x = target.x + (target.occupants.length - 1) * 14 - 7;
        chip.y = target.y + (this.config.mode === "bins" ? 14 + (target.occupants.length - 1) * 14 : 0);
        this.placements[chip.id] = target.id;
      } else {
        chip.state = "loose";
        chip.x = this.pete.x;
        chip.y = this.pete.y - 14;
      }
      this.carrying = null;
    }
  }

  _tick() {
    const p = this.pete;
    if (this.held.up) p.y -= DragMatch.SPEED;
    if (this.held.down) p.y += DragMatch.SPEED;
    if (this.held.left) p.x -= DragMatch.SPEED;
    if (this.held.right) p.x += DragMatch.SPEED;

    if (this.walkTarget) {
      const dx = this.walkTarget.x - p.x,
        dy = this.walkTarget.y - p.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 3) {
        if (this.walkTarget.thenInteract) this._interact();
        this.walkTarget = null;
      } else {
        p.x += (dx / dist) * DragMatch.SPEED;
        p.y += (dy / dist) * DragMatch.SPEED;
      }
    }

    p.x = Math.max(14, Math.min(DragMatch.W - 14, p.x));
    p.y = Math.max(36, Math.min(DragMatch.H - 14, p.y));

    if (this.carrying) {
      const chip = this.chips.find((c) => c.id === this.carrying);
      chip.x = p.x;
      chip.y = p.y - 22;
    }
  }

  render(now) {
    const ctx = this.pc.ctx;
    ctx.fillStyle = "#0a0812";
    ctx.fillRect(0, 0, this.pc.w, this.pc.h);

    this.targets.forEach((t) => {
      const w = this.config.mode === "bins" ? DragMatch.BIN_W : DragMatch.SLOT_W;
      const h = this.config.mode === "bins" ? DragMatch.BIN_H : DragMatch.SLOT_H;
      const filled = t.occupants.length > 0;
      ctx.strokeStyle = filled ? "#ffb454" : "#4a4066";
      ctx.setLineDash(filled ? [] : [3, 3]);
      ctx.lineWidth = 2;
      ctx.strokeRect(t.x - w / 2, t.y - h / 2, w, h);
      ctx.setLineDash([]);
      ctx.fillStyle = "#9b93b0";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      ctx.fillText(t.label, t.x, t.y + h / 2 + 10);
      ctx.textAlign = "left";
    });

    this.chips.forEach((chip) => {
      if (chip.state === "carried") return; // drawn with Pete below
      const w = DragMatch.CHIP_W,
        h = DragMatch.CHIP_H;
      const fb = this.feedback && this.feedback[chip.id];
      ctx.fillStyle = fb === true ? "#1c3b2d" : fb === false ? "#3b1c1c" : "#2a2440";
      ctx.fillRect(chip.x - w / 2, chip.y - h / 2, w, h);
      ctx.strokeStyle = fb === true ? "#7ef7c1" : fb === false ? "#ff6b6b" : "#6fe3ff";
      ctx.lineWidth = 1;
      ctx.strokeRect(chip.x - w / 2, chip.y - h / 2, w, h);
      ctx.fillStyle = "#f4f1f9";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      const label = chip.label.length > 11 ? chip.label.slice(0, 10) + "…" : chip.label;
      ctx.fillText(label, chip.x, chip.y + 3);
      ctx.textAlign = "left";
    });

    Pete.draw(ctx, this.pete.x, this.pete.y, { walking: !!(this.held.up || this.held.down || this.held.left || this.held.right || this.walkTarget), t: now });

    if (this.carrying) {
      const chip = this.chips.find((c) => c.id === this.carrying);
      const w = DragMatch.CHIP_W,
        h = DragMatch.CHIP_H;
      ctx.fillStyle = "#3b2d1c";
      ctx.fillRect(chip.x - w / 2, chip.y - h / 2, w, h);
      ctx.strokeStyle = "#ffb454";
      ctx.strokeRect(chip.x - w / 2, chip.y - h / 2, w, h);
      ctx.fillStyle = "#f4f1f9";
      ctx.font = "7px monospace";
      ctx.textAlign = "center";
      const label = chip.label.length > 11 ? chip.label.slice(0, 10) + "…" : chip.label;
      ctx.fillText(label, chip.x, chip.y + 3);
      ctx.textAlign = "left";
    }

    ctx.fillStyle = "#9b93b0";
    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.fillText(
      this.carrying ? `Carrying: ${this.chips.find((c) => c.id === this.carrying).label}` : "Hands empty — walk to a chip and press Space",
      this.pc.w / 2,
      this.pc.h - 4
    );
    ctx.textAlign = "left";
  }

  check() {
    // Chips with correct == null are decoys/distractors: they're only
    // "wrong" if actually placed somewhere, and never required to move.
    let correct = 0;
    let total = 0;
    this.feedback = {};
    this.chips.forEach((c) => {
      const placed = this.placements[c.id];
      if (c.correct == null) {
        const ok = placed === undefined;
        if (!ok) {
          total++;
          this.feedback[c.id] = false;
        }
        return;
      }
      total++;
      const ok = Array.isArray(c.correct) ? c.correct.includes(placed) : placed === c.correct;
      this.feedback[c.id] = ok;
      if (ok) correct++;
    });
    return { correct, total, allCorrect: correct === total };
  }
}

window.DragMatch = DragMatch;
