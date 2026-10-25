/* Workshop builds for Circuit Basics Quest. Each level starts with 2-3 hands-on builds: the first is coached, the next less, the last not at all.
   The older questions stay in the level as knowledge checks that come after the builds. */
const amp = a => a >= 1 ? (Math.round(a * 100) / 100) + ' A' : (Math.round(a * 10000) / 10) + ' mA';
const volt = v => (Math.round(v * 100) / 100) + ' V';
const LABS = (idx, topic, labs) => {
  const L = WATER_LEVELS[idx - 1];
  if (!L || L.topic !== topic) throw new Error('lab/level mismatch at ' + idx + ': ' + (L && L.topic) + ' vs ' + topic);
  L.chals.push(...labs);
};
// one loop: battery on the left, resistor sockets along the top, ammeter on the right
function loopRig(o) {
  const sockets = o.sockets.map((k, i) => ({ id: k.id, label: k.label, x: k.x, y: 1 }));
  const left = o.left || { kind: 'BAT', label: volt(o.V), sub: 'battery', info: 'The battery pushes with ' + volt(o.V) + '.' };
  const right = o.right || { kind: 'BOX', label: 'A', sub: 'ammeter', info: 'The ammeter reads the current that flows around the loop.' };
  const fixed = [Object.assign({ x: 1, y: 3 }, left), Object.assign({ x: 9, y: 3 }, right)].concat(o.fixed || []);
  return { cols: 11, rows: 7, sockets, fixed, wires: [[[1, 3], [1, 1], [9, 1], [9, 3], [9, 5], [1, 5], [1, 3]]], start: { x: 5, y: 3 }, lever: { x: 10, y: 5 } };
}

LABS(3, 'Sources and Ohm’s Law', [
  Object.assign({ t: 'lab', tier: 1, hint: 'I = V ÷ R. For 20 mA from 10 V you need R = 10 ÷ 0.02.', concept: null,
    q: '<b>Build:</b> make the ammeter read <b>20 mA</b>. Pick a resistor from a bin and place it in the socket.',
    teach: '<p><b>Ohm’s law:</b> the current through a resistor is <b>I = V ÷ R</b>. More push (volts) gives more current. More resistance gives less. Watch the ammeter change as you try parts.</p>' },
    (() => {
      const V = 10, tgt = 0.02, parts = [100, 250, 500, 1000, 2000].map(RP);
      const r = loopRig({ V, sockets: [{ id: 'r', label: 'R', x: 5 }] });
      return Object.assign(r, { parts,
        model(p) { if (!p.r) return { meters: [{ k: 'Current', v: '— mA' }, { k: 'Target', v: amp(tgt) }], note: 'Place a resistor to close the loop.' };
          const I = V / p.r.v, ok = Math.abs(I - tgt) / tgt < 0.03;
          return { ok, live: true, meters: [{ k: 'Current', v: amp(I), st: ok ? 'good' : 'bad' }, { k: 'Target', v: amp(tgt) }],
            note: 'I = V ÷ R = ' + V + ' ÷ ' + p.r.v + ' = <b>' + amp(I) + '</b>.', why: 'I = V ÷ R = ' + V + ' ÷ ' + p.r.v + ' = ' + amp(I) + '. To get 20 mA from 10 V you need R = V ÷ I = 500 Ω.', fail: I > tgt ? 'Too much current. More resistance means less current.' : 'Too little current. Less resistance means more current.' }; },
        coach(p, carry) { if (!p.r && !carry) return 'walk to a bin, face it and press Space.'; if (!p.r) return 'face the socket (top) and press Space to place it.'; const I = V / p.r.v; if (Math.abs(I - tgt) / tgt < 0.03) return 'the ammeter matches the target. Press Enter to test.'; return I > tgt ? 'too much current. Pick a <b>bigger</b> resistor.' : 'too little current. Pick a <b>smaller</b> resistor.'; } });
    })()),
  { t: 'lab', tier: 2, hint: 'Work out R = V ÷ I first, then look for that part.', q: '', gen() {
    const V = pick([6, 12, 24]), R = pick([120, 240, 300, 400, 600, 800]), tgt = V / R;
    const r = loopRig({ V, sockets: [{ id: 'r', label: 'R', x: 5 }] });
    return Object.assign(r, { q: '<b>Build:</b> the ammeter must read <b>' + amp(tgt) + '</b> from the ' + V + ' V battery. Choose the resistor.',
      teach: '<p>Same law, new numbers. Rearrange it: <b>R = V ÷ I</b>. Work it out before you walk to the bins.</p>',
      parts: pickR([100, 120, 240, 300, 400, 600, 800, 1200], 5, R).map(RP),
      model(p) { if (!p.r) return { meters: [{ k: 'Current', v: '— mA' }, { k: 'Target', v: amp(tgt) }], note: '' };
        const I = V / p.r.v, ok = Math.abs(I - tgt) / tgt < 0.03;
        return { ok, live: true, meters: [{ k: 'Current', v: amp(I), st: ok ? 'good' : 'bad' }, { k: 'Target', v: amp(tgt) }], note: 'I = ' + V + ' ÷ ' + p.r.v + ' = <b>' + amp(I) + '</b>.', why: 'R = V ÷ I = ' + V + ' ÷ ' + amp(tgt) + ' = ' + R + ' Ω.', fail: I > tgt ? 'Too much current.' : 'Too little current.' }; } });
  } },
  { t: 'lab', tier: 3, boss: true, hint: 'The LED keeps Vf of the push for itself. The resistor gets the rest: R = (Vs − Vf) ÷ I.', q: '', gen() {
    const c = pick([{ R: 330, I: .02, Vf: 2.4, Vs: 9 }, { R: 220, I: .015, Vf: 1.7, Vs: 5 }, { R: 150, I: .02, Vf: 2, Vs: 5 }, { R: 680, I: .01, Vf: 2.2, Vs: 9 }, { R: 100, I: .03, Vf: 2, Vs: 5 }]);
    const r = loopRig({ V: c.Vs, sockets: [{ id: 'r', label: 'R', x: 4 }], fixed: [{ x: 7, y: 1, kind: 'LED', label: 'LED', sub: 'drops ' + volt(c.Vf), info: 'The LED uses up ' + volt(c.Vf) + ' of the push whenever it is on.' }] });
    return Object.assign(r, { q: '<b>Build:</b> the LED needs exactly <b>' + amp(c.I) + '</b>. It always drops <b>' + volt(c.Vf) + '</b>. The battery is ' + volt(c.Vs) + '. Pick the resistor.',
      teach: '<p>A new part: an <b>LED</b> keeps a fixed slice of the push for itself. The resistor only sees what is left.</p>',
      parts: pickR([100, 150, 220, 330, 470, 680, 1000], 5, c.R).map(RP),
      model(p) { if (!p.r) return { meters: [{ k: 'Current', v: '— mA' }, { k: 'Target', v: amp(c.I) }], note: '' };
        const I = Math.max(0, (c.Vs - c.Vf) / p.r.v), ok = Math.abs(I - c.I) / c.I < 0.05;
        return { ok, live: true, meters: [{ k: 'Current', v: amp(I), st: ok ? 'good' : 'bad' }, { k: 'Target', v: amp(c.I) }], note: 'The resistor sees ' + volt(c.Vs - c.Vf) + '. I = ' + volt(c.Vs - c.Vf) + ' ÷ ' + p.r.v + ' = <b>' + amp(I) + '</b>.', why: 'R = (Vs − Vf) ÷ I = (' + c.Vs + ' − ' + c.Vf + ') ÷ ' + c.I + ' = ' + c.R + ' Ω.', fail: I > c.I ? 'The LED would burn out. Add resistance.' : 'The LED is too dim. Use less resistance.' }; } });
  } },
]);
