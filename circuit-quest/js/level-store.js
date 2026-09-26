// Level persistence layer.
//
// Levels are plain JSON objects (see levels-data.js for the schema doc and
// seed content). They live in localStorage under STORAGE_KEY so the admin
// panel can add/edit/reorder them without touching any code. If nothing has
// been saved yet (first run), the bundled DEFAULT_LEVELS from
// levels-data.js are used as a seed.
//
// This module is the only place that knows *where* levels are stored, so
// swapping localStorage for a real backend later (Firestore, a REST API...)
// only requires rewriting the functions below.

const STORAGE_KEY = "ee-game-levels-v1";
const PROGRESS_KEY = "ee-game-progress-v1";

const LevelStore = {
  /** Returns the full ordered array of level objects. */
  getAll() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      this.saveAll(window.DEFAULT_LEVELS);
      return structuredClone(window.DEFAULT_LEVELS);
    }
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error("Corrupt level data, falling back to defaults", e);
    }
    this.saveAll(window.DEFAULT_LEVELS);
    return structuredClone(window.DEFAULT_LEVELS);
  },

  saveAll(levels) {
    const ordered = levels
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((lvl, i) => ({ ...lvl, order: i }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ordered));
    return ordered;
  },

  getById(id) {
    return this.getAll().find((l) => l.id === id) || null;
  },

  upsert(level) {
    const levels = this.getAll();
    const idx = levels.findIndex((l) => l.id === level.id);
    if (idx === -1) {
      level.order = levels.length;
      levels.push(level);
    } else {
      levels[idx] = { ...levels[idx], ...level };
    }
    return this.saveAll(levels);
  },

  remove(id) {
    const levels = this.getAll().filter((l) => l.id !== id);
    return this.saveAll(levels);
  },

  move(id, direction) {
    const levels = this.getAll();
    const idx = levels.findIndex((l) => l.id === id);
    const swapWith = idx + direction;
    if (idx === -1 || swapWith < 0 || swapWith >= levels.length) return levels;
    [levels[idx], levels[swapWith]] = [levels[swapWith], levels[idx]];
    return this.saveAll(levels);
  },

  resetToDefaults() {
    return this.saveAll(structuredClone(window.DEFAULT_LEVELS));
  },

  exportJSON() {
    return JSON.stringify(this.getAll(), null, 2);
  },

  importJSON(json) {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) throw new Error("Expected an array of levels");
    return this.saveAll(parsed);
  },

  newId() {
    return "lvl_" + Math.random().toString(36).slice(2, 10);
  },
};

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

window.LevelStore = LevelStore;
window.Progress = Progress;
