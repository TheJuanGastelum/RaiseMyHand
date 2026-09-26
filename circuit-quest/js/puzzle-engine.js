// Generic puzzle engine: one entry per *kind* of circuit puzzle. Each entry
// is pure logic + a canvas renderer; levels.config supplies the numbers.
// This is the layer that would need a code change to add a wholly new kind
// of puzzle — adding new levels of an existing kind never does.
//
// Each type implements:
//   unit(config)               -> string shown after the numeric answer
//   label(config)               -> what the player is solving for, e.g. "Current (I)"
//   answer(config)              -> the correct numeric value
//   givenText(config)           -> array of "known value" strings for the sidebar
//   render(ctx, w, h, config, guess, t) -> draws the circuit at internal
//                                          resolution w×h. `guess` is the
//                                          player's current input (may be
//                                          NaN before they've touched it);
//                                          `t` is an animation clock in ms.

const R = CircuitRender;

function seriesTotalR(config) {
  return config.resistors.reduce((a, b) => a + b, 0);
}
function parallelTotalR(config) {
  return 1 / config.resistors.reduce((a, r) => a + 1 / r, 0);
}

const PuzzleEngine = {
  types: {
    "ohms-law": {
      unit: () => "",
      label(config) {
        return { V: "Voltage (V)", I: "Current (I)", R: "Resistance (Ω)" }[config.unknown];
      },
      answer(config) {
        const { V, I, R: Rv, unknown } = config;
        if (unknown === "I") return V / Rv;
        if (unknown === "R") return V / I;
        return I * Rv; // unknown V
      },
      givenText(config) {
        const out = [];
        if (config.unknown !== "V") out.push(`V = ${config.V} V`);
        if (config.unknown !== "I") out.push(`I = ${config.I} A`);
        if (config.unknown !== "R") out.push(`R = ${config.R} Ω`);
        return out;
      },
      render(ctx, w, h, config, guess, t) {
        R.clear(ctx, w, h);
        const cy = h / 2;
        const left = 40,
          right = w - 40;
        const iForAnim = config.unknown === "I" ? guess : config.I ?? guess;
        const speed = isFinite(iForAnim) ? Math.max(2, Math.min(30, iForAnim * 4)) : 0;
        R.wire(ctx, left, cy - 30, left, cy + 30, false);
        R.battery(ctx, left, cy);
        R.wire(ctx, left, cy - 30, right, cy - 30, true, t * speed * 0.02);
        R.wire(ctx, left, cy + 30, right, cy + 30, true, -t * speed * 0.02);
        R.resistor(ctx, (left + right) / 2, cy - 30, 80, config.unknown === "R" ? "R = ?" : `R = ${config.R}Ω`);
        R.wire(ctx, right, cy - 30, right, cy + 30, false);
        R.text(ctx, left - 30, cy + 5, config.unknown === "V" ? "V=?" : `${config.V}V`, R.palette.battery);
        R.text(ctx, (left + right) / 2 - 10, cy + 45, config.unknown === "I" ? `I = ${isFinite(guess) ? guess.toFixed(2) : "?"} A` : `I = ${config.I}A`, R.palette.textDim);
      },
    },

    "series-circuit": {
      unit: (config) => (config.find === "totalR" ? "Ω" : "A"),
      label: (config) => (config.find === "totalR" ? "Total Resistance" : "Total Current"),
      answer(config) {
        const totalR = seriesTotalR(config);
        return config.find === "totalR" ? totalR : config.V / totalR;
      },
      givenText(config) {
        const out = [`V = ${config.V} V`];
        config.resistors.forEach((r, i) => out.push(`R${i + 1} = ${r} Ω`));
        return out;
      },
      render(ctx, w, h, config, guess, t) {
        R.clear(ctx, w, h);
        const cy = h / 2;
        const n = config.resistors.length;
        const segW = (w - 100) / n;
        const left = 50,
          right = w - 50;
        const totalR = seriesTotalR(config);
        const iAnim = config.find === "totalI" && isFinite(guess) ? guess : config.V / totalR;
        const speed = Math.max(2, Math.min(30, iAnim * 4));
        R.wire(ctx, left, cy - 30, left, cy + 30, false);
        R.battery(ctx, left, cy);
        R.wire(ctx, left, cy - 30, left, cy - 30, false);
        for (let i = 0; i < n; i++) {
          const x0 = left + segW * i;
          const x1 = left + segW * (i + 1);
          R.wire(ctx, x0, cy - 30, x0 + segW / 2 - 40, cy - 30, true, t * speed * 0.02);
          R.resistor(ctx, x0 + segW / 2, cy - 30, 40, `R${i + 1}`);
          R.wire(ctx, x0 + segW / 2 + 40, cy - 30, x1, cy - 30, true, t * speed * 0.02);
        }
        R.wire(ctx, right, cy - 30, right, cy + 30, false);
        R.wire(ctx, left, cy + 30, right, cy + 30, true, -t * speed * 0.02);
        R.text(ctx, left - 20, cy + 50, `V = ${config.V}V`, R.palette.battery);
        if (config.find === "totalR") {
          R.text(ctx, w / 2 - 30, 20, "Find R_total (add them up)", R.palette.textDim);
        } else {
          R.text(ctx, w / 2 - 60, 20, `R_total = ${totalR.toFixed(2)}Ω. Find I.`, R.palette.textDim);
        }
      },
    },

    "parallel-circuit": {
      unit: (config) => (config.find === "totalR" ? "Ω" : "A"),
      label: (config) => (config.find === "totalR" ? "Total Resistance" : "Total Current"),
      answer(config) {
        const totalR = parallelTotalR(config);
        return config.find === "totalR" ? totalR : config.V / totalR;
      },
      givenText(config) {
        const out = [`V = ${config.V} V`];
        config.resistors.forEach((r, i) => out.push(`R${i + 1} = ${r} Ω`));
        return out;
      },
      render(ctx, w, h, config, guess, t) {
        R.clear(ctx, w, h);
        const n = config.resistors.length;
        const left = 60,
          right = w - 60;
        const top = 40,
          bottom = h - 30;
        const rowGap = (bottom - top) / (n - 1 || 1);
        const totalR = parallelTotalR(config);
        R.wire(ctx, left, h / 2, left, top, false);
        R.wire(ctx, left, h / 2, left, bottom, false);
        R.wire(ctx, right, top, right, bottom, false);
        R.battery(ctx, 30, h / 2);
        R.wire(ctx, 30, top, 30, bottom, false);
        R.wire(ctx, 30, top, left, top, false);
        R.wire(ctx, 30, bottom, left, bottom, false);
        config.resistors.forEach((rv, i) => {
          const y = n === 1 ? h / 2 : top + rowGap * i;
          const branchI = config.V / rv;
          const speed = Math.max(2, Math.min(30, branchI * 4));
          R.wire(ctx, left, y, left + (right - left) / 2 - 40, y, true, t * speed * 0.02);
          R.resistor(ctx, (left + right) / 2, y, 40, `R${i + 1}`);
          R.wire(ctx, (left + right) / 2 + 40, y, right, y, true, t * speed * 0.02);
        });
        R.text(ctx, 4, h / 2 + 24, `${config.V}V`, R.palette.battery);
        if (config.find === "totalR") {
          R.text(ctx, w / 2 - 60, 16, "Find R_total (combine branches)", R.palette.textDim);
        } else {
          R.text(ctx, w / 2 - 70, 16, `R_total = ${totalR.toFixed(2)}Ω. Find I.`, R.palette.textDim);
        }
      },
    },

    "kirchhoff-current": {
      unit: () => "A",
      label: () => "Unknown Branch Current",
      _unknownSide(config) {
        const outIdx = config.outOf.findIndex((v) => v === null);
        if (outIdx !== -1) return { side: "out", idx: outIdx };
        const inIdx = config.into.findIndex((v) => v === null);
        return { side: "in", idx: inIdx };
      },
      answer(config) {
        const sumIn = config.into.reduce((a, v) => a + (v || 0), 0);
        const sumOut = config.outOf.reduce((a, v) => a + (v || 0), 0);
        const { side } = this._unknownSide(config);
        return side === "out" ? sumIn - sumOut : sumOut - sumIn;
      },
      givenText(config) {
        const out = [];
        config.into.forEach((v, i) => v !== null && out.push(`I_in${i + 1} = ${v} A`));
        config.outOf.forEach((v, i) => v !== null && out.push(`I_out${i + 1} = ${v} A`));
        return out;
      },
      render(ctx, w, h, config, guess, t) {
        R.clear(ctx, w, h);
        const cx = w / 2,
          cy = h / 2;
        R.node(ctx, cx, cy, "node", true);
        const { side, idx } = this._unknownSide(config);
        config.into.forEach((v, i) => {
          const angle = Math.PI + (i - (config.into.length - 1) / 2) * 0.5;
          const x0 = cx + Math.cos(angle) * 90,
            y0 = cy + Math.sin(angle) * 50;
          const isUnknown = side === "in" && i === idx;
          R.wire(ctx, x0, y0, cx, cy, !isUnknown, t * (v || guess || 1) * 3);
          R.text(ctx, x0 - 20, y0 - 6, isUnknown ? "? A in" : `${v}A in`, R.palette.good);
        });
        config.outOf.forEach((v, i) => {
          const angle = (i - (config.outOf.length - 1) / 2) * 0.5;
          const x0 = cx + Math.cos(angle) * 90,
            y0 = cy + Math.sin(angle) * 50;
          const isUnknown = side === "out" && i === idx;
          R.wire(ctx, cx, cy, x0, y0, !isUnknown, t * (v || guess || 1) * 3);
          R.text(ctx, x0 - 10, y0 - 6, isUnknown ? "? A out" : `${v}A out`, R.palette.bad);
        });
      },
    },

    "rc-time-constant": {
      unit: () => "µs",
      label: () => "Time Constant (τ)",
      answer: (config) => config.R * config.C,
      givenText: (config) => [`R = ${config.R} Ω`, `C = ${config.C} µF`],
      render(ctx, w, h, config, guess, t) {
        R.clear(ctx, w, h);
        const cy = h / 2;
        const left = 50,
          right = w - 60;
        R.wire(ctx, left, cy - 20, left, cy + 20, false);
        R.battery(ctx, left, cy);
        R.wire(ctx, left, cy - 20, left + 60, cy - 20, true, t * 6);
        R.resistor(ctx, left + 90, cy - 20, 50, `R=${config.R}Ω`);
        R.wire(ctx, left + 115, cy - 20, right, cy - 20, true, t * 6);
        R.wire(ctx, right, cy - 20, right, cy + 20, false);
        R.capacitor(ctx, right - 10, cy, `C=${config.C}µF`);
        R.wire(ctx, left, cy + 20, right, cy + 20, false);

        // charging curve preview
        const gx = 20,
          gy = h - 30,
          gw = w - 40,
          gh = 40;
        ctx.strokeStyle = R.palette.textDim;
        ctx.strokeRect(gx, gy - gh, gw, gh);
        const tau = isFinite(guess) && guess > 0 ? guess : this.answer(config);
        ctx.strokeStyle = R.palette.good;
        ctx.beginPath();
        for (let px = 0; px <= gw; px++) {
          const timeUs = (px / gw) * tau * 5;
          const frac = 1 - Math.exp(-timeUs / tau);
          const py = gy - frac * gh;
          if (px === 0) ctx.moveTo(gx + px, py);
          else ctx.lineTo(gx + px, py);
        }
        ctx.stroke();
        R.text(ctx, gx, gy - gh - 4, "capacitor voltage vs. time", R.palette.textDim, 7);
      },
    },
  },

  compute(level) {
    return this.types[level.puzzleType].answer(level.config);
  },

  check(level, guess) {
    const answer = this.compute(level);
    const tolerance = level.tolerance ?? 0.05;
    if (!isFinite(guess)) return { correct: false, answer };
    const err = Math.abs(guess - answer) / Math.max(Math.abs(answer), 1e-9);
    return { correct: err <= tolerance, answer, err };
  },
};

window.PuzzleEngine = PuzzleEngine;
