# Study games: source

The four games are single self-contained HTML files built from the pieces in `games/`.

- Build: `python3 games/build.py water|grid|cpu|mcu` (writes to `out/`). Copy each result to `circuit-quest/<game>/index.html`.
- `kit.js` / `kit.css`: the shared engine (levels, scoring, keyboard play, the walk-around workshop, the Analogy button).
- `<game>_data.js`: the knowledge-check questions. `<game>_learn*.js`: the older text lessons (kept, used when a level has no builds).
- `<game>_labs*.js`: the playable builds (3 per level: guided, less help, boss). `lab_common.js` has the shared builders (`dial`, `slot`, `mk`, rigs).
- `tests/`: Playwright scripts. `labtest.js <file.html> "" 10` plays every build with real key presses.
