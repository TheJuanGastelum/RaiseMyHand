// Slider/number-input puzzle: used for anything whose answer is a single
// computed value (loop trip counts, stack bytes, branch offsets, Amdahl's
// Law speedups, critical-path cycle times, ...).
class NumericPuzzle {
  constructor(root, config) {
    this.root = root;
    this.config = config; // { min, max, step, unit, answer, tolerance, negative }
    this._build();
  }

  _build() {
    const wrap = document.createElement("div");
    wrap.className = "stack";
    const row = document.createElement("div");
    row.className = "row";
    this.input = document.createElement("input");
    this.input.type = "range";
    this.input.min = this.config.min;
    this.input.max = this.config.max;
    this.input.step = this.config.step ?? 1;
    this.input.value = (Number(this.config.min) + Number(this.config.max)) / 2;
    this.readout = document.createElement("span");
    this.readout.className = "badge";
    row.appendChild(this.input);
    row.appendChild(this.readout);
    wrap.appendChild(row);
    this.root.appendChild(wrap);
    this.input.addEventListener("input", () => this._updateReadout());
    this._updateReadout();
  }

  _updateReadout() {
    this.readout.textContent = parseFloat(this.input.value).toFixed(2) + " " + (this.config.unit || "");
  }

  value() {
    return parseFloat(this.input.value);
  }

  check() {
    const guess = this.value();
    const answer = this.config.answer;
    const tolerance = this.config.tolerance ?? 0.02;
    const err = Math.abs(guess - answer) / Math.max(Math.abs(answer), 1e-9);
    return { correct: err <= tolerance, answer, guess };
  }
}
window.NumericPuzzle = NumericPuzzle;
