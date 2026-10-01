// Generic drag-chip-to-slot engine. This is the workhorse behind most
// puzzle levels: register matching, fill-in-the-blank code, sorting
// instructions into bins, control-signal tables, and pipeline-stage
// snapshots are all just this same "drag a labeled chip onto a labeled
// target, then check" interaction with different visual layout.
//
// config = {
//   mode: "slots" | "bins" | "code",
//   slots: [{id,label}]        // mode: slots
//   bins:  [{id,label}]        // mode: bins (each accepts many chips)
//   chips: [{id,label,correct}]  // correct = target id (slot or bin)
//   codeLines: [ "text {{slotId|label}} more text", ... ]  // mode: code
// }
class DragMatch {
  constructor(root, config, opts) {
    this.root = root;
    this.config = config;
    this.opts = opts || {};
    this.placements = {}; // chipId -> targetId
    this._dragging = null;
    this._build();
  }

  _build() {
    const wrap = document.createElement("div");
    wrap.className = "stack";

    this.bank = document.createElement("div");
    this.bank.className = "pq-bank";

    if (this.config.mode === "code") {
      this.targetsEl = this._buildCode();
    } else if (this.config.mode === "bins") {
      this.targetsEl = this._buildBins();
    } else {
      this.targetsEl = this._buildSlots();
    }

    wrap.appendChild(this.targetsEl);
    const bankLabel = document.createElement("div");
    bankLabel.className = "dim";
    bankLabel.style.fontSize = "9px";
    bankLabel.textContent = "Drag from here:";
    wrap.appendChild(bankLabel);
    wrap.appendChild(this.bank);
    this.root.appendChild(wrap);

    this.config.chips.forEach((chip) => this.bank.appendChild(this._makeChip(chip)));

    this._attachDnD();
  }

  _buildSlots() {
    const row = document.createElement("div");
    row.className = "pq-slot-row";
    this.config.slots.forEach((slot) => {
      const col = document.createElement("div");
      col.className = "pq-slot-labeled";
      const target = document.createElement("div");
      target.className = "pq-slot";
      target.dataset.targetId = slot.id;
      target.dataset.capacity = "1";
      const lab = document.createElement("div");
      lab.className = "pq-slot-label";
      lab.textContent = slot.label;
      col.appendChild(target);
      col.appendChild(lab);
      row.appendChild(col);
    });
    return row;
  }

  _buildBins() {
    const row = document.createElement("div");
    row.className = "pq-slot-row";
    this.config.bins.forEach((bin) => {
      const target = document.createElement("div");
      target.className = "pq-bin";
      target.dataset.targetId = bin.id;
      target.dataset.capacity = "999";
      const title = document.createElement("span");
      title.className = "pq-bin-title";
      title.textContent = bin.label;
      target.appendChild(title);
      row.appendChild(target);
    });
    return row;
  }

  _buildCode() {
    const pre = document.createElement("div");
    pre.className = "pq-code";
    this.config.codeLines.forEach((line, i) => {
      const lineEl = document.createElement("div");
      const parts = line.split(/(\{\{[^}]+\}\})/g);
      parts.forEach((part) => {
        const m = part.match(/^\{\{([^|]+)\|?(.*)\}\}$/);
        if (m) {
          const target = document.createElement("span");
          target.className = "pq-slot";
          target.dataset.targetId = m[1];
          target.dataset.capacity = "1";
          target.title = m[2] || "";
          lineEl.appendChild(target);
        } else {
          lineEl.appendChild(document.createTextNode(part));
        }
      });
      if (i < this.config.codeLines.length - 1) lineEl.appendChild(document.createElement("br"));
      pre.appendChild(lineEl);
    });
    return pre;
  }

  _makeChip(chip) {
    const el = document.createElement("div");
    el.className = "pq-chip";
    el.textContent = chip.label;
    el.dataset.chipId = chip.id;
    return el;
  }

  _attachDnD() {
    this.root.addEventListener("pointerdown", (e) => {
      const chip = e.target.closest(".pq-chip");
      if (!chip) return;
      e.preventDefault();
      this._startDrag(chip, e);
    });
  }

  _startDrag(chip, e) {
    const rect = chip.getBoundingClientRect();
    this._dragging = {
      chip,
      offX: e.clientX - rect.left,
      offY: e.clientY - rect.top,
      w: rect.width,
      h: rect.height,
      homeParent: chip.parentElement,
    };
    chip.classList.add("dragging");
    chip.style.width = rect.width + "px";
    chip.style.left = rect.left + "px";
    chip.style.top = rect.top + "px";
    document.body.appendChild(chip);
    chip.setPointerCapture?.(e.pointerId);

    const move = (ev) => this._onMove(ev);
    const up = (ev) => {
      document.removeEventListener("pointermove", move);
      document.removeEventListener("pointerup", up);
      this._onDrop(ev);
    };
    document.addEventListener("pointermove", move);
    document.addEventListener("pointerup", up);
  }

  _onMove(e) {
    if (!this._dragging) return;
    const { chip, offX, offY } = this._dragging;
    chip.style.left = e.clientX - offX + "px";
    chip.style.top = e.clientY - offY + "px";
  }

  _onDrop(e) {
    if (!this._dragging) return;
    const { chip, homeParent } = this._dragging;
    chip.classList.remove("dragging");
    chip.style.position = "";
    chip.style.left = "";
    chip.style.top = "";
    chip.style.width = "";

    const under = document.elementFromPoint(e.clientX, e.clientY);
    const targetEl = under && (under.closest(".pq-slot") || under.closest(".pq-bin"));

    if (targetEl && targetEl !== this.bank) {
      const cap = parseInt(targetEl.dataset.capacity, 10);
      const current = targetEl.querySelectorAll(".pq-chip").length - (targetEl === chip.parentElement ? 1 : 0);
      if (cap === 1) {
        const existing = targetEl.querySelector(".pq-chip");
        if (existing && existing !== chip) {
          this.bank.appendChild(existing);
          delete this.placements[existing.dataset.chipId];
        }
        targetEl.appendChild(chip);
        targetEl.classList.add("filled");
        this.placements[chip.dataset.chipId] = targetEl.dataset.targetId;
      } else if (current < cap) {
        targetEl.appendChild(chip);
        this.placements[chip.dataset.chipId] = targetEl.dataset.targetId;
      } else {
        homeParent.appendChild(chip);
        delete this.placements[chip.dataset.chipId];
      }
    } else {
      this.bank.appendChild(chip);
      delete this.placements[chip.dataset.chipId];
      const prevParent = homeParent;
      if (prevParent && prevParent.classList.contains("pq-slot")) prevParent.classList.remove("filled");
    }
    this._dragging = null;
    if (this.opts.onChange) this.opts.onChange(this.placements);
  }

  allPlaced() {
    return this.config.chips.every((c) => this.placements[c.id] !== undefined);
  }

  check() {
    // Chips with correct == null are decoys/distractors: they're only
    // "wrong" if actually placed somewhere, and never required to move.
    let correct = 0;
    let total = 0;
    this.config.chips.forEach((c) => {
      const el = this.root.querySelector(`.pq-chip[data-chip-id="${CSS.escape(c.id)}"]`);
      const placed = this.placements[c.id];
      if (c.correct == null) {
        const ok = placed === undefined;
        if (el) {
          el.classList.remove("correct", "wrong");
          if (!ok) el.classList.add("wrong");
        }
        if (!ok) total++; // a misplaced decoy counts against the player
        return;
      }
      total++;
      const ok = Array.isArray(c.correct) ? c.correct.includes(placed) : placed === c.correct;
      if (el) {
        el.classList.remove("correct", "wrong");
        el.classList.add(ok ? "correct" : "wrong");
      }
      if (ok) correct++;
    });
    return { correct, total, allCorrect: correct === total };
  }

  clearFeedback() {
    this.root.querySelectorAll(".pq-chip").forEach((el) => el.classList.remove("correct", "wrong"));
  }
}

window.DragMatch = DragMatch;
