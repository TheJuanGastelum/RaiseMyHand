// Main game controller: overworld map, puzzle screen, scoring/progress.

(function () {
  let levels = [];
  let current = null;
  let activeEngine = null;
  let hintUsed = false;
  let introDone = false;

  const mapScreen = document.getElementById("map-screen");
  const puzzleScreen = document.getElementById("puzzle-screen");
  const overworldCanvas = document.getElementById("overworld-canvas");
  const overworldPrompt = document.getElementById("overworld-prompt");
  const scoreBadge = document.getElementById("score-badge");
  const conceptBox = document.getElementById("concept-box");
  const puzzleHost = document.getElementById("puzzle-host");
  const feedbackEl = document.getElementById("feedback");

  function totalStars() {
    const p = Progress.get();
    return Object.values(p.stars).reduce((a, b) => a + b, 0);
  }

  function renderMap() {
    levels = window.PETE_LEVELS.slice().sort((a, b) => a.order - b.order);
    scoreBadge.textContent = `${totalStars()} ★`;
    Overworld.init(overworldCanvas, levels, overworldPrompt, openLevel);
  }

  function buildIntro(host) {
    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.maxWidth = "320px";
    canvas.style.display = "block";
    canvas.style.margin = "0 auto";
    canvas.style.cursor = "pointer";
    host.appendChild(canvas);
    const pc = new PixelCanvas(canvas, 260, 140);
    let clicked = false;
    let clickTime = 0;
    canvas.addEventListener("click", (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * pc.w;
      if (x > 190 && !clicked) {
        clicked = true;
        clickTime = performance.now();
      }
    });
    let raf;
    const loop = (now) => {
      const ctx = pc.ctx;
      ctx.fillStyle = "#121018";
      ctx.fillRect(0, 0, pc.w, pc.h);
      ctx.strokeStyle = "#4a4066";
      ctx.beginPath();
      ctx.moveTo(10, 110);
      ctx.lineTo(250, 110);
      ctx.stroke();
      const peteX = clicked ? Math.min(210, 60 + (now - clickTime) / 3) : 60;
      ctx.strokeStyle = "#ffb454";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(210, 90);
      ctx.lineTo(210, 60);
      ctx.stroke();
      ctx.fillStyle = "#ffb454";
      ctx.fillRect(210, 58, 14, 8);
      ctx.fillStyle = "#f4f1f9";
      ctx.font = "7px monospace";
      ctx.fillText("GO", 212, 64);
      Pete.draw(ctx, peteX, 92, { walking: clicked, t: now });
      raf = requestAnimationFrame(loop);
      if (clicked && peteX >= 209 && !introDone) {
        introDone = true;
        cancelAnimationFrame(raf);
        setTimeout(() => finishLevel(true), 300);
      }
    };
    loop(0);
    return { destroy: () => cancelAnimationFrame(raf), check: () => ({ correct: true }) };
  }

  function openLevel(lvl) {
    current = lvl;
    hintUsed = false;
    introDone = false;
    mapScreen.style.display = "none";
    puzzleScreen.style.display = "block";

    document.getElementById("puzzle-title").textContent = lvl.title;
    document.getElementById("puzzle-lecture").textContent = lvl.lecture;
    conceptBox.textContent = lvl.concept;
    conceptBox.hidden = true;
    feedbackEl.textContent = "";
    feedbackEl.className = "";
    puzzleHost.innerHTML = "";

    const submitBtn = document.getElementById("submit-btn");
    const hintBtn = document.getElementById("hint-btn");
    submitBtn.style.display = lvl.puzzleType === "intro" ? "none" : "";
    hintBtn.style.display = lvl.puzzleType === "intro" || !lvl.hint ? "none" : "";

    if (activeEngine && activeEngine.destroy) activeEngine.destroy();

    switch (lvl.puzzleType) {
      case "intro":
        activeEngine = buildIntro(puzzleHost);
        break;
      case "match":
        activeEngine = new DragMatch(puzzleHost, lvl.config);
        break;
      case "memory-walk":
        activeEngine = new MemoryWalk(puzzleHost, lvl.config);
        break;
      case "stack-sim":
        if (lvl.config.prompt) puzzleHost.appendChild(makePromptEl(lvl.config.prompt));
        activeEngine = new StackSim(puzzleHost, lvl.config);
        break;
      case "wire-connect":
        if (lvl.config.prompt) puzzleHost.appendChild(makePromptEl(lvl.config.prompt));
        activeEngine = new WireConnect(puzzleHost, lvl.config);
        break;
      case "formula":
        activeEngine = new FormulaPuzzle(puzzleHost, lvl.config);
        break;
      case "numeric":
        if (lvl.config.prompt) puzzleHost.appendChild(makePromptEl(lvl.config.prompt));
        activeEngine = new NumericPuzzle(puzzleHost, lvl.config);
        break;
      case "gauntlet":
        activeEngine = new GauntletPuzzle(puzzleHost, lvl.config.parts, { onComplete: () => finishLevel(true) });
        hintBtn.style.display = "none";
        break;
    }
  }

  function makePromptEl(text) {
    const p = document.createElement("p");
    p.style.fontFamily = "monospace";
    p.style.fontSize = "12px";
    p.style.whiteSpace = "pre-wrap";
    p.textContent = text;
    return p;
  }

  function submit() {
    if (!activeEngine) return;
    if (current.puzzleType === "gauntlet") {
      activeEngine.checkCurrent();
      return;
    }
    const result = activeEngine.check();
    const ok = "allCorrect" in result ? result.allCorrect : result.correct;
    if (ok) {
      finishLevel(false);
    } else {
      feedbackEl.className = "incorrect";
      feedbackEl.style.color = "var(--danger)";
      feedbackEl.textContent = "✗ Not quite — adjust and check again.";
    }
  }

  function finishLevel(skipDelay) {
    const stars = hintUsed ? 2 : 3;
    Progress.complete(current.id, stars);
    feedbackEl.className = "correct";
    feedbackEl.style.color = "var(--good)";
    feedbackEl.textContent = `✓ Correct! Earned ${stars} ★.`;
    setTimeout(goBack, skipDelay ? 600 : 1400);
  }

  function showHint() {
    hintUsed = true;
    feedbackEl.style.color = "";
    feedbackEl.textContent = current.hint ? `💡 ${current.hint}` : "No hint for this level.";
  }

  function toggleConcept() {
    conceptBox.hidden = !conceptBox.hidden;
  }

  function goBack() {
    if (activeEngine && activeEngine.destroy) activeEngine.destroy();
    activeEngine = null;
    puzzleScreen.style.display = "none";
    mapScreen.style.display = "block";
    renderMap();
  }

  document.getElementById("submit-btn").addEventListener("click", submit);
  document.getElementById("hint-btn").addEventListener("click", showHint);
  document.getElementById("question-btn").addEventListener("click", toggleConcept);
  document.getElementById("back-btn").addEventListener("click", goBack);
  document.getElementById("reset-btn").addEventListener("click", () => {
    pixelConfirm("Reset all progress?", () => {
      Progress.reset();
      renderMap();
    });
  });

  renderMap();
})();
