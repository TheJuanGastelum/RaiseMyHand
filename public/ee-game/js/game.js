// Main game controller: level map, puzzle screen, scoring/progress.

(function () {
  let levels = [];
  let current = null;
  let pixelCanvas = null;
  let rafId = null;
  let hintUsed = false;

  const mapScreen = document.getElementById("map-screen");
  const puzzleScreen = document.getElementById("puzzle-screen");
  const mapEl = document.getElementById("map");
  const scoreBadge = document.getElementById("score-badge");

  function totalStars() {
    const p = Progress.get();
    return Object.values(p.stars).reduce((a, b) => a + b, 0);
  }

  function renderMap() {
    levels = LevelStore.getAll();
    scoreBadge.textContent = `${totalStars()} ★`;
    mapEl.innerHTML = "";
    levels.forEach((lvl) => {
      const unlocked = Progress.isUnlocked(levels, lvl.id);
      const progress = Progress.get();
      const stars = progress.stars[lvl.id] || 0;
      const card = document.createElement("div");
      card.className = "panel level-card" + (unlocked ? "" : " locked");
      card.innerHTML = `
        <span class="topic">${lvl.topic}</span>
        <span class="title">${lvl.title}</span>
        <span class="dim">${unlocked ? (stars ? "★".repeat(stars) + "☆".repeat(3 - stars) : "Not completed") : "🔒 Locked"}</span>
      `;
      if (unlocked) card.addEventListener("click", () => openLevel(lvl));
      mapEl.appendChild(card);
    });
  }

  function openLevel(lvl) {
    current = lvl;
    hintUsed = false;
    mapScreen.style.display = "none";
    puzzleScreen.style.display = "block";

    document.getElementById("puzzle-title").textContent = lvl.title;
    document.getElementById("puzzle-topic").textContent = lvl.topic;
    document.getElementById("concept-text").textContent = lvl.concept;
    document.getElementById("feedback").textContent = "";
    document.getElementById("feedback").className = "";

    const puzzleType = PuzzleEngine.types[lvl.puzzleType];
    document.getElementById("answer-label").textContent = puzzleType.label(lvl.config) + ":";

    const givenList = document.getElementById("given-list");
    givenList.innerHTML = "";
    puzzleType.givenText(lvl.config).forEach((g) => {
      const span = document.createElement("span");
      span.className = "badge";
      span.textContent = g;
      givenList.appendChild(span);
    });

    const input = document.getElementById("answer-input");
    const cfg = lvl.config;
    input.min = cfg.min ?? 0;
    input.max = cfg.max ?? 100;
    input.step = cfg.step ?? 1;
    input.value = (Number(input.min) + Number(input.max)) / 2;
    updateReadout();
    input.oninput = updateReadout;

    const canvasEl = document.getElementById("circuit-canvas");
    pixelCanvas = new PixelCanvas(canvasEl, 400, 220);

    if (rafId) cancelAnimationFrame(rafId);
    const loop = () => {
      const t = performance.now() / 16;
      const guess = parseFloat(document.getElementById("answer-input").value);
      puzzleType.render(pixelCanvas.ctx, pixelCanvas.w, pixelCanvas.h, cfg, guess, t);
      rafId = requestAnimationFrame(loop);
    };
    loop();
  }

  function updateReadout() {
    const input = document.getElementById("answer-input");
    const puzzleType = PuzzleEngine.types[current.puzzleType];
    document.getElementById("answer-readout").textContent =
      parseFloat(input.value).toFixed(2) + " " + puzzleType.unit(current.config);
  }

  function submit() {
    const guess = parseFloat(document.getElementById("answer-input").value);
    const result = PuzzleEngine.check(current, guess);
    const feedback = document.getElementById("feedback");
    const unit = PuzzleEngine.types[current.puzzleType].unit(current.config);
    if (result.correct) {
      const stars = hintUsed ? 2 : 3;
      Progress.complete(current.id, stars);
      feedback.className = "correct";
      feedback.textContent = `✓ Correct! Answer ≈ ${result.answer.toFixed(2)} ${unit}. Earned ${stars} ★. ${
        current.hint ? "" : ""
      }`;
      setTimeout(() => {
        renderMap();
        goBack();
      }, 1600);
    } else {
      feedback.className = "incorrect";
      feedback.textContent = `✗ Not quite. Your answer: ${isFinite(guess) ? guess.toFixed(2) : "?"} ${unit}. Try adjusting the slider and check again.`;
    }
  }

  function showHint() {
    hintUsed = true;
    const feedback = document.getElementById("feedback");
    feedback.className = "";
    feedback.textContent = current.hint ? `💡 ${current.hint}` : "No hint available for this level.";
  }

  function goBack() {
    if (rafId) cancelAnimationFrame(rafId);
    puzzleScreen.style.display = "none";
    mapScreen.style.display = "block";
    renderMap();
  }

  document.getElementById("submit-btn").addEventListener("click", submit);
  document.getElementById("hint-btn").addEventListener("click", showHint);
  document.getElementById("back-btn").addEventListener("click", goBack);
  document.getElementById("reset-btn").addEventListener("click", () => {
    if (confirm("Reset all progress?")) {
      Progress.reset();
      renderMap();
    }
  });

  renderMap();
})();
