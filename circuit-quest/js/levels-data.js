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
//                            "kirchhoff-current", "rc-time-constant",
//                            "ac-impedance", "ac-power", "three-phase",
//                            "laplace-transform".
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
  {
    id: "lvl_impedance_1",
    order: 8,
    topic: "AC Impedance",
    title: "Combining R and X",
    concept:
      "Add an inductor or capacitor to a resistor and Ohm's law still holds, but resistance alone can't describe it anymore — reactance (X) also opposes current, just 90° out of step with resistance. Together they form impedance, a single complex quantity:\n\nZ = R + jX\n\nBecause R and X are 90° apart, their combined magnitude isn't R + X — it's the hypotenuse of a right triangle with R and X as legs, exactly like Pythagoras:\n\n|Z| = √(R² + X²)\n\nThis triangle is the single most useful picture in AC circuit analysis — you'll see the same shape again in a few levels for power. Find the impedance magnitude for the R and X shown below.",
    puzzleType: "ac-impedance",
    config: { R: 30, X: 40, find: "Z", min: 0, max: 80, step: 0.5 },
    tolerance: 0.05,
    hint: "|Z| = √(R² + X²) = √(30² + 40²) = √(900+1600) = √2500.",
  },
  {
    id: "lvl_impedance_2",
    order: 9,
    topic: "AC Impedance",
    title: "The Impedance Angle",
    concept:
      "|Z| tells you how much the load opposes current overall; the angle θ of Z tells you the *character* of that opposition — how far current gets pushed out of step with voltage.\n\nθ = arctan(X / R)\n\nA positive X (inductive) makes current lag voltage — θ > 0. A negative X (capacitive) makes current lead voltage — θ < 0. Pure resistance gives θ = 0: current and voltage stay perfectly in step. This is the exact same θ that shows up later in the power triangle.\n\nFind θ for this load. Note the reactance is negative — it's capacitive, so expect a negative angle.",
    puzzleType: "ac-impedance",
    config: { R: 10, X: -17.32, find: "angle", min: -90, max: 90, step: 0.5 },
    tolerance: 0.05,
    hint: "θ = arctan(X/R) = arctan(-17.32/10) ≈ -60°.",
  },
  {
    id: "lvl_power_1",
    order: 10,
    topic: "AC Power",
    title: "Real, Reactive, and Apparent Power",
    concept:
      "Once current and voltage are sinusoids instead of steady DC, \"power\" splits into three related numbers. If the load's current lags the voltage by an angle θ (as it does for anything inductive — motors, transformers, most real loads):\n\nApparent power:  S = V·I  (volt-amps, VA — what the source actually has to supply)\nReal power:  P = V·I·cos θ  (watts, W — what actually does work: heat, light, torque)\nReactive power:  Q = V·I·sin θ  (VAR — energy sloshing in and out of magnetic/electric fields, doing no net work)\n\nThe phasor diagram below shows why: V and I aren't aligned when θ ≠ 0, and P is literally the projection of S onto the V axis.\n\nFind the real power P delivered to the load.",
    puzzleType: "ac-power",
    config: { V: 120, I: 10, angleDeg: 30, find: "P", min: 0, max: 1500, step: 1 },
    tolerance: 0.05,
    hint: "P = V·I·cos(θ) = 120 × 10 × cos(30°).",
  },
  {
    id: "lvl_power_2",
    order: 11,
    topic: "AC Power",
    title: "Power Factor",
    concept:
      "Power factor is just cos θ — the fraction of the apparent power (S) that's actually real power (P). A power factor of 1.0 means every volt-amp the source supplies does useful work; a low power factor (a big, inductive motor with no correction) means the source and wiring have to be sized for far more current than the load's real output would suggest.\n\nThis is why utilities charge industrial customers for poor power factor: the current — and the wiring, transformers, and losses that come with it — is set by S = V·I, not by P.\n\nFind the power factor for this load.",
    puzzleType: "ac-power",
    config: { V: 240, I: 8, angleDeg: 45, find: "pf", min: 0, max: 1, step: 0.01 },
    tolerance: 0.03,
    hint: "pf = cos(θ) = cos(45°).",
  },
  {
    id: "lvl_3phase_1",
    order: 12,
    topic: "Three-Phase Power",
    title: "Wye: Line vs. Phase Voltage",
    concept:
      "Three-phase power sends three sinusoidal voltages 120° apart down three lines instead of one, which is why almost all power generation and industrial distribution uses it — it delivers constant instantaneous power (unlike single-phase, which pulses) and needs less conductor for the same power.\n\nIn a Y (wye) connection, each phase winding is tied to a common neutral point. The voltage between any two lines (line-to-line) isn't just the phase voltage doubled — it's the phasor sum of two phase voltages 120° apart, which works out to:\n\nV_line = √3 × V_phase ≈ 1.732 × V_phase\n\nThe line current, though, is the same as the phase current in a wye system — there's only one path for it to take.\n\nFind the line-to-line voltage for the wye source shown.",
    puzzleType: "three-phase",
    config: { system: "wye", V_phase: 120, I_phase: 20, cosPhi: 0.9, find: "V_line", min: 0, max: 300, step: 1 },
    tolerance: 0.05,
    hint: "V_line = √3 × V_phase = 1.732 × 120.",
  },
  {
    id: "lvl_3phase_2",
    order: 13,
    topic: "Three-Phase Power",
    title: "Total Power in a Balanced System",
    concept:
      "For a balanced three-phase load (all three phases identical), the total real power delivered is:\n\nP_total = √3 × V_line × I_line × cos θ\n\nNotice this uses line quantities, not phase quantities — which is convenient, because line voltage and line current are exactly what you'd measure with a meter clipped onto the incoming feed, no need to know whether the load inside is wired wye or delta.\n\nThis wye-connected load has phase voltage 120 V and phase current 15 A at a power factor of 0.85. Work out the line quantities first, then the total power.",
    puzzleType: "three-phase",
    config: { system: "wye", V_phase: 120, I_phase: 15, cosPhi: 0.85, find: "P_total", min: 0, max: 8000, step: 10 },
    tolerance: 0.05,
    hint: "V_line = √3×120, I_line = 15 (wye), P = √3 × V_line × I_line × 0.85.",
  },
  {
    id: "lvl_laplace_1",
    order: 14,
    topic: "Laplace Transforms",
    title: "Transforming an Exponential",
    concept:
      "Laplace transforms turn differential equations (the natural language of circuits with L's and C's) into algebra. Instead of solving in the time domain, you transform into the s-domain, solve with algebra, and transform back.\n\nOne of the most useful pairs — because it's exactly the shape of a capacitor discharging or an inductor's current decaying — is the exponential:\n\nℒ{ e^(−at) } = 1 / (s + a)\n\nThe time-domain curve below decays as e^(−at). Evaluate its Laplace transform F(s) at the given value of s.",
    puzzleType: "laplace-transform",
    config: { kind: "exp", a: 2, s: 3, min: 0, max: 2, step: 0.01 },
    tolerance: 0.05,
    hint: "F(s) = 1/(s + a) = 1/(3 + 2).",
  },
  {
    id: "lvl_laplace_2",
    order: 15,
    topic: "Laplace Transforms",
    title: "Transforming a Ramp",
    concept:
      "A ramp, f(t) = t, is what you get integrating a constant — like the current build-up in an inductor driven by a fixed voltage before anything else limits it. Its transform is:\n\nℒ{ t } = 1 / s²\n\nNote it falls off faster (as 1/s²) than the unit step's 1/s — the transform 'remembers' that a ramp keeps growing, so it needs a stronger low-s dependence to represent it.\n\nEvaluate F(s) for the ramp shown, at the given s.",
    puzzleType: "laplace-transform",
    config: { kind: "ramp", s: 2, min: 0, max: 2, step: 0.01 },
    tolerance: 0.05,
    hint: "F(s) = 1/s² = 1/(2²) = 1/4.",
  },
  {
    id: "lvl_power_3",
    order: 16,
    topic: "AC Power",
    title: "Apparent Power at Unity PF",
    concept:
      "When a load is purely resistive — a toaster, an incandescent bulb, a resistive heater — current and voltage stay perfectly in step: θ = 0. That makes cos θ = 1 (\"unity power factor\"), so real power and apparent power become the same number:\n\nP = S = V·I\n\nThis is the best case for a utility: every volt-amp it delivers turns into real work, with nothing wasted sloshing back and forth reactively. Find the apparent power S for this unity-power-factor load.",
    puzzleType: "ac-power",
    config: { V: 220, I: 5, angleDeg: 0, find: "S", min: 0, max: 1500, step: 1 },
    tolerance: 0.05,
    hint: "θ = 0, so S = V·I = 220 × 5 (and P would equal the same number).",
  },
  {
    id: "lvl_power_4",
    order: 17,
    topic: "AC Power",
    title: "Leading Loads and Negative Q",
    concept:
      "A capacitive load makes current *lead* voltage instead of lag it — the impedance angle θ is negative. Run that through Q = V·I·sin θ and Q comes out negative too.\n\nThat sign is exactly why capacitor banks are used to fix a plant's power factor: an inductive load (motors) produces positive Q, a capacitive load produces negative Q, and utilities size capacitor banks to cancel the two out so the net reactive power — and the extra current it costs — drops toward zero.\n\nFind Q for this leading (capacitive) load. It should come out negative.",
    puzzleType: "ac-power",
    config: { V: 100, I: 4, angleDeg: -60, find: "Q", min: -400, max: 0, step: 1 },
    tolerance: 0.05,
    hint: "Q = V·I·sin(θ) = 100 × 4 × sin(−60°) — sin of a negative angle is negative.",
  },
  {
    id: "lvl_3phase_3",
    order: 18,
    topic: "Three-Phase Power",
    title: "Delta: Line vs. Phase Current",
    concept:
      "A Δ (delta) connection wires the three windings end-to-end in a triangle instead of to a shared neutral. That flips which quantity gets the √3 treatment: in delta, it's line voltage that equals phase voltage, while line current is the one that picks up the √3 factor from combining two phase currents 120° apart:\n\nV_line = V_phase        I_line = √3 × I_phase\n\n(Compare this to wye, where it was the other way around — V_line = √3×V_phase and I_line = I_phase. Both systems are just different ways of wiring the same three sinusoids.)\n\nFind the line current for this delta-connected load.",
    puzzleType: "three-phase",
    config: { system: "delta", V_phase: 208, I_phase: 12, cosPhi: 0.9, find: "I_line", min: 0, max: 30, step: 0.1 },
    tolerance: 0.05,
    hint: "I_line = √3 × I_phase = 1.732 × 12.",
  },
  {
    id: "lvl_3phase_4",
    order: 19,
    topic: "Three-Phase Power",
    title: "Delta System, Total Power",
    concept:
      "The total-power formula doesn't care whether the load is wired wye or delta, as long as you plug in line quantities:\n\nP_total = √3 × V_line × I_line × cos θ\n\nThat's the whole point of using line quantities — one formula covers both wiring schemes. For this delta load, V_line equals V_phase directly (208 V), but you still need to convert I_phase to I_line first.",
    puzzleType: "three-phase",
    config: { system: "delta", V_phase: 208, I_phase: 20, cosPhi: 0.88, find: "P_total", min: 0, max: 14000, step: 20 },
    tolerance: 0.05,
    hint: "V_line = 208 (delta). I_line = √3×20 ≈ 34.64. P = √3 × 208 × 34.64 × 0.88.",
  },
  {
    id: "lvl_laplace_3",
    order: 20,
    topic: "Laplace Transforms",
    title: "The Unit Step",
    concept:
      "The unit step, u(t) — off for all t < 0, then instantly on and held at 1 forever after — models any signal that switches on and stays on: a switch closing, a source turning on. It's the simplest possible transform pair, and everything else in the standard table builds on it:\n\nℒ{ u(t) } = 1 / s\n\nEvaluate F(s) for the step function at the given s.",
    puzzleType: "laplace-transform",
    config: { kind: "step", s: 4, min: 0, max: 1, step: 0.005 },
    tolerance: 0.05,
    hint: "F(s) = 1/s = 1/4.",
  },
];
