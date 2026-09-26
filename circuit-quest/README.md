# Circuit Quest — an EE fundamentals learning game

A browser-based, retro-pixel-art game that teaches electrical engineering
fundamentals through interactive circuit puzzles, structured like a
progressive university EE curriculum: Ohm's Law → series circuits →
parallel circuits → Kirchhoff's Current Law → capacitors/RC transients →
AC power (P/Q/S, power factor) → three-phase power → Laplace transforms.

No build step, no dependencies beyond a static file server. This is a
standalone project — it does not share hosting, deployment, or any code
with anything else in this repository.

## Play it

Any static file server works, e.g.:

```bash
cd circuit-quest && python3 -m http.server 8080
```

then open `http://localhost:8080`. Progress and scores are saved in
`localStorage` per-browser.

To deploy it publicly, host the contents of this folder on any static
host of your choice (GitHub Pages, Netlify, Vercel, Firebase Hosting on
its own project, etc.) — it's plain HTML/CSS/JS with no build step.

## Admin panel

Open `admin.html`. It's gated by a client-side passphrase (`circuits`,
change it in `js/admin.js`'s `PASSPHRASE` constant) — **this is not real
security**, just a speed bump against casual visitors, since there is no
backend to authenticate against. From there you can:

- Add, edit, delete, and reorder levels (no code required)
- Pick from the supported puzzle types and fill in a form for that type's
  parameters
- Export all levels to a JSON file (for backup or to move into version
  control) and re-import them

## Architecture

```
js/engine.js           Low-res canvas wrapper (pixel-scaling trick)
js/circuit-render.js   Drawing primitives shared by every puzzle renderer
js/puzzle-engine.js    One module per *kind* of puzzle: answer logic +
                       canvas renderer. Adding a new kind of puzzle means
                       adding an entry here.
js/levels-data.js      Bundled seed levels + the full level content schema,
                       documented in the comment at the top of the file.
js/level-store.js      Persistence (localStorage) + progress tracking.
js/game.js             Player-facing screens: level map, puzzle screen,
                       scoring/unlocking.
js/admin.js            Admin CRUD screens + per-puzzle-type config forms.
```

**Levels are pure data.** The default levels in `levels-data.js` and
anything added via the admin panel share one JSON schema — see the comment
block at the top of `levels-data.js` for the field-by-field spec. Adding a
new *level* of an existing puzzle type (say, a harder Ohm's Law problem, or
a fourth series-circuit level) never touches code — do it from the admin
panel. Adding a wholly new *kind* of puzzle (say, AC phasors, or a full
mesh-analysis puzzle) means adding one entry to `PuzzleEngine.types` in
`puzzle-engine.js` (answer formula + canvas renderer) and one schema entry
to `CONFIG_SCHEMAS` in `admin.js` (which form fields to show) — everything
else (content, ordering, tolerance, hints) stays data-only from then on.

## Extending the curriculum

Suggested next topics, in the same progressive style: Thevenin/Norton
equivalents, RLC transients & resonance, AC phasors and impedance,
op-amp basics (inverting/non-inverting gain), diodes/rectification,
digital logic gates. Each would be one new `puzzleType` module plus a
handful of seed levels.
