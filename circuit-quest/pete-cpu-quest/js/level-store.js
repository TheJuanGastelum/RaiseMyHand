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
  isUnlocked() {
    // Every level is reachable — nothing is gated. Stars/completion are
    // still only ever earned by actually solving a level (see complete()
    // above); this only affects whether you can walk in and try one.
    return true;
  },
  reset() {
    localStorage.removeItem(PROGRESS_KEY);
  },
};

window.Progress = Progress;
