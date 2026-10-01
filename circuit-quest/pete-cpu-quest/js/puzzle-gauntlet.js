// Gauntlet: a sequence of sub-puzzles (any of the other engines) stepped
// through one at a time, for the combined Midterm level that pulls a
// little from every world.
class GauntletPuzzle {
  constructor(root, parts, hooks) {
    this.root = root;
    this.parts = parts;
    this.hooks = hooks || {};
    this.index = 0;
    this.active = null;
    this._renderPart();
  }

  _makeEngine(part, host) {
    if (part.type === "match") return new DragMatch(host, part.config);
    if (part.type === "numeric") return new NumericPuzzle(host, part.config);
    if (part.type === "formula") return new FormulaPuzzle(host, part.config);
    if (part.type === "wire-connect") return new WireConnect(host, part.config);
    throw new Error("Unknown gauntlet part type: " + part.type);
  }

  _renderPart() {
    this.root.innerHTML = "";
    const part = this.parts[this.index];

    const progress = document.createElement("div");
    progress.className = "badge";
    progress.textContent = `Part ${this.index + 1} / ${this.parts.length}`;
    this.root.appendChild(progress);

    const title = document.createElement("h3");
    title.textContent = part.title;
    this.root.appendChild(title);

    const prompt = document.createElement("p");
    prompt.style.fontFamily = "monospace";
    prompt.style.fontSize = "12px";
    prompt.style.whiteSpace = "pre-wrap";
    prompt.textContent = part.prompt;
    this.root.appendChild(prompt);

    const host = document.createElement("div");
    this.root.appendChild(host);
    this.active = this._makeEngine(part, host);

    this.feedback = document.createElement("p");
    this.root.appendChild(this.feedback);
  }

  checkCurrent() {
    const result = this.active.check();
    const ok = "allCorrect" in result ? result.allCorrect : result.correct;
    if (ok) {
      this.feedback.className = "dim";
      this.feedback.style.color = "var(--good)";
      this.feedback.textContent = "✓ Correct.";
      if (this.index < this.parts.length - 1) {
        setTimeout(() => {
          this.index++;
          this._renderPart();
        }, 900);
      } else {
        if (this.hooks.onComplete) this.hooks.onComplete();
      }
    } else {
      this.feedback.style.color = "var(--danger)";
      this.feedback.textContent = "✗ Not quite — adjust and check again.";
    }
    return ok;
  }
}
window.GauntletPuzzle = GauntletPuzzle;
