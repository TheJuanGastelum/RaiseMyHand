// Default seed content, loaded the first time the game runs (before the
// admin panel has saved anything of its own). This is also the reference
// example for the level content schema.
//
// ===========================================================================
// LEVEL SCHEMA
// ===========================================================================
// {
//   id: string            — unique, stable (e.g. "lvl_ohm_1"). Never reuse.
//   order: number          — 0-based position in the progression. The admin
//                            panel's up/down buttons rewrite this for you;
//                            you don't need to set it by hand.
//   topic: string          — short curriculum label shown on the map, e.g.
//                            "Ohm's Law", "Series Circuits".
//   title: string          — level title shown on the level card/header.
//   concept: string        — the teaching text shown before/while the
//                            player solves the puzzle. Plain text,
//                            paragraphs separated by "\n\n". This is the
//                            actual lesson — write it so a student who has
//                            never seen the topic can follow along.
//   puzzleType: string     — one of the keys in PuzzleEngine.types (see
//                            js/puzzle-engine.js): "ohms-law",
//                            "series-circuit", "parallel-circuit",
//                            "kirchhoff-current", "rc-time-constant".
//   config: object         — parameters for that puzzle type. Each type
//                            documents its own config shape at the top of
//                            its entry in puzzle-engine.js. This is the
//                            "problem logic" — it is pure data, so the
//                            admin panel can build a form for it without
//                            any code changes, and adding a new *value* of
//                            an existing puzzle type never touches code.
//   tolerance: number      — accepted fractional error on the numeric
//                            answer, e.g. 0.05 = within 5%. Optional,
//                            defaults to 0.05.
//   hint: string           — one-line nudge shown if the player asks for a
//                            hint (costs a star). Optional.
// }
//
// Adding a brand-new *kind* of puzzle (rather than a new level of an
// existing kind) does require adding a small module to puzzle-engine.js —
// that's the one piece of "problem logic" that isn't fully data-driven,
// because it's the renderer + checker for a new circuit shape. Everything
// else (which values, which topic, how hard) is content, set via the admin
// panel.
// ===========================================================================

window.DEFAULT_LEVELS = [
  {
    id: "lvl_ohm_1",
    order: 0,
    topic: "Ohm's Law",
    title: "Find the Current",
    concept:
      "Ohm's Law ties together voltage (V), current (I), and resistance (R) in the simplest possible circuit: a battery and a resistor.\n\nV = I × R\n\nThe battery pushes charge around the loop; the resistor pushes back. A bigger resistor for the same voltage means less current gets through — same idea as a narrower pipe slowing down water flow.\n\nBelow, you're given the battery's voltage and the resistor's value. Turn the dial on the ammeter until it reads the true current, then submit.",
    puzzleType: "ohms-law",
    config: { V: 12, R: 4, unknown: "I", min: 0, max: 10, step: 0.1 },
    tolerance: 0.05,
    hint: "I = V / R. Divide the voltage by the resistance.",
  },
  {
    id: "lvl_ohm_2",
    order: 1,
    topic: "Ohm's Law",
    title: "Find the Resistance",
    concept:
      "Same law, different unknown. If you know how much voltage is being applied and you can measure the current flowing, you can work out the resistance that's causing it:\n\nR = V / I\n\nThis is exactly how a multimeter's resistance mode secretly works — it applies a known small voltage, measures the current, and does the division for you.",
    puzzleType: "ohms-law",
    config: { V: 9, I: 3, unknown: "R", min: 0, max: 10, step: 0.1 },
    tolerance: 0.05,
    hint: "R = V / I.",
  },
  {
    id: "lvl_series_1",
    order: 2,
    topic: "Series Circuits",
    title: "Resistors in a Row",
    concept:
      "When resistors are chained one after another (series), the *same current* has to flow through all of them — there's only one path. Their resistances simply add up:\n\nR_total = R1 + R2 + R3 + ...\n\nOnce you have R_total, the whole chain behaves like one resistor and Ohm's law still applies: I = V / R_total.\n\nAdd up the three resistors below to find the total resistance of the chain.",
    puzzleType: "series-circuit",
    config: { V: 10, resistors: [2, 3, 5], find: "totalR", min: 0, max: 20, step: 0.1 },
    tolerance: 0.05,
    hint: "Just add the three resistor values together.",
  },
  {
    id: "lvl_series_2",
    order: 3,
    topic: "Series Circuits",
    title: "Current Through the Chain",
    concept:
      "Now that you can find total resistance, use it. In a series circuit, the current is the same everywhere in the loop — at the battery, and through every resistor.\n\nI = V / R_total\n\nFind the total resistance in your head first, then use Ohm's law to get the current the whole chain is drawing from the battery.",
    puzzleType: "series-circuit",
    config: { V: 24, resistors: [4, 4, 4], find: "totalI", min: 0, max: 10, step: 0.01 },
    tolerance: 0.05,
    hint: "R_total = 4+4+4 = 12. I = V / R_total.",
  },
  {
    id: "lvl_parallel_1",
    order: 4,
    topic: "Parallel Circuits",
    title: "Resistors Side by Side",
    concept:
      "Parallel resistors give current more than one path to take, so adding a branch always makes it *easier* for current to flow — total resistance goes down, not up.\n\n1/R_total = 1/R1 + 1/R2 + ...\n\nWith exactly two resistors this simplifies to the handy shortcut:\n\nR_total = (R1 × R2) / (R1 + R2)\n\nUse it (or the general formula) to find the combined resistance of the two branches below.",
    puzzleType: "parallel-circuit",
    config: { V: 12, resistors: [6, 3], find: "totalR", min: 0, max: 10, step: 0.01 },
    tolerance: 0.05,
    hint: "R_total = (6×3)/(6+3) = 2.",
  },
  {
    id: "lvl_parallel_2",
    order: 5,
    topic: "Parallel Circuits",
    title: "Total Current Draw",
    concept:
      "Each parallel branch draws its own current, but the battery has to supply *all* of it — the branch currents add up at the source, even though the voltage across every branch is the same.\n\nFirst collapse the branches into one equivalent resistance, then use Ohm's law with the source voltage to get the total current the battery delivers.",
    puzzleType: "parallel-circuit",
    config: { V: 18, resistors: [9, 9, 9], find: "totalI", min: 0, max: 12, step: 0.01 },
    tolerance: 0.05,
    hint: "Three equal 9Ω branches in parallel give R_total = 3. I = V/R_total.",
  },
  {
    id: "lvl_kcl_1",
    order: 6,
    topic: "Kirchhoff's Current Law",
    title: "What Goes In Must Come Out",
    concept:
      "Kirchhoff's Current Law (KCL) says that at any junction (node) in a circuit, the total current flowing in equals the total current flowing out — charge doesn't pile up or vanish at a wire junction.\n\nΣ I_in = Σ I_out\n\nBelow is a node with two currents flowing in and one measured current flowing out, plus one unknown branch. Figure out what current the unknown branch must be carrying to keep the books balanced.",
    puzzleType: "kirchhoff-current",
    config: { into: [5, 3], outOf: [4, null], min: 0, max: 15, step: 0.1 },
    tolerance: 0.05,
    hint: "5 + 3 = 8 in. One known branch out is 4, so the unknown branch is 8 − 4.",
  },
  {
    id: "lvl_rc_1",
    order: 7,
    topic: "Capacitors & Transients",
    title: "The Time Constant",
    concept:
      "A capacitor charging through a resistor doesn't jump straight to full voltage — it eases in on a curve, and the speed of that curve is set by the time constant:\n\nτ = R × C\n\nAfter one time constant, the capacitor has reached about 63% of the source voltage; after five, it's essentially fully charged. This single number is the heartbeat of every RC filter and timing circuit.\n\nCompute τ for the resistor and capacitor shown (capacitance is in microfarads, so τ comes out in microseconds — don't worry about unit conversion, just multiply the numbers shown).",
    puzzleType: "rc-time-constant",
    config: { R: 10, C: 5, min: 0, max: 100, step: 0.5 },
    tolerance: 0.05,
    hint: "τ = R × C = 10 × 5.",
  },
];
