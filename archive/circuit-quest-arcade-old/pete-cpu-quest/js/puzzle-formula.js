// Formula puzzle: drag terms into a formula's blanks (reusing DragMatch in
// "code" mode), then enter the computed numeric result. Used for every
// performance-formula lecture (CPU time, CPI, Amdahl's Law).
class FormulaPuzzle {
  constructor(root, config) {
    this.root = root;
    this.config = config; // { formulaLines, chips, numeric: {min,max,step,unit,answer,tolerance} }
    this._build();
  }

  _build() {
    const wrap = document.createElement("div");
    wrap.className = "stack";

    const matchHost = document.createElement("div");
    wrap.appendChild(matchHost);

    const label = document.createElement("div");
    label.className = "dim";
    label.style.fontSize = "9px";
    label.textContent = "Then compute the answer:";
    wrap.appendChild(label);

    const numHost = document.createElement("div");
    wrap.appendChild(numHost);

    this.root.appendChild(wrap);

    this.match = new DragMatch(matchHost, { mode: "code", codeLines: this.config.formulaLines, chips: this.config.chips });
    this.numeric = new NumericPuzzle(numHost, this.config.numeric);
  }

  check() {
    const m = this.match.check();
    const n = this.numeric.check();
    return { correct: m.allCorrect && n.correct, matchResult: m, numericResult: n };
  }
}
window.FormulaPuzzle = FormulaPuzzle;
