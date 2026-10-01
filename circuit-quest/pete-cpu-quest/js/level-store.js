// Progress persistence (localStorage). Levels themselves are fixed code
// data (js/levels-data.js) — see that file's header comment for the
// content schema if you want to add/edit levels.

const PROGRESS_KEY = "pete-cpu-quest-progress-v1";

const Progress = {
  get() {
    try {
      return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || { completed: {}, stars: {} };
    } catch {
      return { completed: {}, stars: {} };
    }
  },
  save(p) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(p));
  },
  complete(levelId, stars) {
    const p = this.get();
    p.completed[levelId] = true;
    p.stars[levelId] = Math.max(p.stars[levelId] || 0, stars);
    this.save(p);
    return p;
  },
  isUnlocked(levels, levelId) {
    const p = this.get();
    const idx = levels.findIndex((l) => l.id === levelId);
    if (idx <= 0) return true;
    const prev = levels[idx - 1];
    return !!p.completed[prev.id];
  },
  reset() {
    localStorage.removeItem(PROGRESS_KEY);
  },
};

window.Progress = Progress;
