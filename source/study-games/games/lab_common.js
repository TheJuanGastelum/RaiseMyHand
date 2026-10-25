/* Shared helpers for the workshop builds. Game-neutral. */
const meterOf = (k, v, st) => ({ k, v, st });
const near = (x, t, tol) => Math.abs(x - t) <= Math.abs(t) * tol + 1e-12;
const par = (a, b) => a * b / (a + b);
const pickR = (list, n, must) => { const m = Array.isArray(must) ? must : [must]; const out = m.slice(); shuffle(list.filter(v => !m.includes(v))).slice(0, Math.max(0, n - m.length)).forEach(v => out.push(v)); return shuffle(out).sort((a, b) => a - b); };
// engineering format: E(0.0153,'A') -> "15.3 mA"
const E = (x, u) => { if (x === 0) return '0 ' + u; const a = Math.abs(x), P = [[1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n']]; const p = P.find(q => a >= q[0] * 0.9995) || P[P.length - 1]; const v = x / p[0]; return (Math.round(v * 100) / 100) + ' ' + p[1] + u; };
const N2 = x => String(Math.round(x * 1000) / 1000);
// a simple generic part
const PT = (label, v, kind) => ({ label, v, kind: kind || 'BOX' });
const ohm = v => v >= 1e6 ? (v / 1e6) + ' MΩ' : v >= 1000 ? (v / 1000) + ' kΩ' : v + ' Ω';
const RP = v => PT(ohm(v), v, 'R');
const LP = v => PT(E(v, 'H'), v, 'L'), CP = v => PT(E(v, 'F'), v, 'C');

/* ---- layouts. All are 11 wide, 7 tall. The bins fill row 6. ---- */
// a loop: left part, right part, sockets/fixed parts along the top row
function benchRig(o) {
  const sockets = (o.sockets || []).map(k => ({ id: k.id, label: k.label, x: k.x, y: k.y == null ? 1 : k.y }));
  const fixed = [];
  if (o.left !== null) fixed.push(Object.assign({ x: 1, y: 3, kind: 'BAT', label: '', info: '' }, o.left || {}));
  if (o.right !== null) fixed.push(Object.assign({ x: 9, y: 3, kind: 'BOX', label: '', info: '' }, o.right || {}));
  (o.top || []).forEach(f => fixed.push(Object.assign({ y: 1 }, f)));
  (o.extra || []).forEach(f => fixed.push(f));
  return { cols: 11, rows: 7, sockets, fixed, wires: o.wires || [[[1, 3], [1, 1], [9, 1], [9, 3], [9, 5], [1, 5], [1, 3]]], start: o.start || { x: 5, y: 3 }, lever: o.lever || { x: 10, y: 5 } };
}
// sockets along a row (ordering, matching, picking settings)
function rowRig(o) {
  const n = o.sockets.length, xs = n === 1 ? [5] : n === 2 ? [3, 7] : n === 3 ? [2, 5, 8] : n === 4 ? [1, 4, 7, 10] : n === 5 ? [1, 3, 5, 7, 9] : n === 6 ? [0, 2, 4, 6, 8, 10] : [0, 1, 3, 4, 6, 7, 9].slice(0, n);
  const sockets = o.sockets.map((k, i) => ({ id: k.id, label: k.label, x: xs[i], y: o.y == null ? 1 : o.y }));
  const wires = o.wires === undefined ? [[[Math.min(...xs), sockets[0].y], [Math.max(...xs), sockets[0].y]]] : o.wires;
  return { cols: 11, rows: 7, sockets, fixed: o.fixed || [], wires, start: o.start || { x: 5, y: 3 }, lever: o.lever || { x: 10, y: 4 } };
}
// two rows of sockets (e.g. cause on top, effect below)
function gridRig(o) {
  const sockets = [], rows = o.rows; const ys = rows.length === 1 ? [1] : rows.length === 2 ? [1, 3] : [1, 2, 3];
  rows.forEach((row, r) => { const n = row.length, xs = n === 1 ? [5] : n === 2 ? [3, 7] : n === 3 ? [2, 5, 8] : n === 4 ? [1, 4, 7, 10] : [1, 3, 5, 7, 9]; row.forEach((k, i) => sockets.push({ id: k.id, label: k.label, x: xs[i], y: ys[r] })); });
  return { cols: 11, rows: 7, sockets, fixed: o.fixed || [], wires: o.wires || [], start: o.start || { x: 5, y: 5 }, lever: o.lever || { x: 10, y: 5 } };
}

/* ---- builders ---- */
// mk: wraps a calc(p) that runs only once every socket is filled
const mk = o => Object.assign({}, o.rig, { q: o.q, teach: o.teach, hint: o.hint, parts: o.parts, coach: o.coach,
  model(p) { const need = (o.rig.sockets || []).every(k => p[k.id]); if (!need) return { meters: o.idle || [], note: o.idleNote || '' }; return Object.assign({ live: true }, o.calc(p)); } });
// dial: one socket whose part sets a number; the meter shows it; match the target
function dial(o) {
  const id = o.id || 'r', rd = v => o.read(v), tgt = o.target, tol = o.tol == null ? 0.03 : o.tol, show = o.show || (x => N2(x));
  const spec = {
    rig: o.rig, q: o.q, teach: o.teach, hint: o.hint, parts: o.parts,
    idle: [meterOf(o.label || 'Reading', '—'), meterOf('Target', show(tgt))], idleNote: o.idleNote || 'Place a part to see the reading.',
    calc(p) { const x = rd(p[id]), ok = near(x, tgt, tol), ms = [meterOf(o.label || 'Reading', show(x), ok ? 'good' : 'bad'), meterOf('Target', show(tgt))].concat(o.extra ? o.extra(p[id], x) : []);
      return { ok, meters: ms, note: o.note(p[id], x), why: o.why, fail: typeof o.fail === 'function' ? o.fail(x, tgt) : (o.fail || (x > tgt ? 'Too high.' : 'Too low.')) }; },
  };
  if (o.guide) spec.coach = (p, carry) => { if (!p[id] && !carry) return 'walk to a bin, face it and press Space.'; if (!p[id]) return 'face the socket and press Space to place it.'; const x = rd(p[id]); if (near(x, tgt, tol)) return 'right on target. Press Enter to test.';
    const nb = o.parts.slice().sort((a, b) => a.v - b.v), i = nb.findIndex(q => q.label === p[id].label), e = q => Math.abs(rd(q) - tgt), up = nb[i + 1], dn = nb[i - 1];
    const cands = [up, dn].filter(q => q && e(q) < e(p[id])); const pick1 = cands.sort((a, b) => e(a) - e(b))[0];
    return (x > tgt ? 'too high. ' : 'too low. ') + (pick1 ? 'Try a <b>' + (pick1 === up ? 'bigger' : 'smaller') + '</b> one.' : 'Try a different one.'); };
  return mk(spec);
}
// slot: fill labelled slots with the matching part (ordering, matching, picking settings)
function slot(o) {
  const n = o.slots.length, want = {}; o.slots.forEach((s, i) => want[s.id] = s.want);
  const rig = o.rig || rowRig({ sockets: o.slots.map(s => ({ id: s.id, label: s.label })), fixed: o.fixed });
  const spec = { rig, q: o.q, teach: o.teach, hint: o.hint, parts: o.parts.map(x => typeof x === 'string' ? PT(x, x, o.kind || 'BOX') : x),
    idle: o.count === false ? [] : [meterOf('In place', '0 of ' + n)], idleNote: o.idleNote || '',
    calc(p) { const good = o.slots.filter(s => p[s.id].label === s.want).length, ok = good === n; const ms = o.count === false ? [] : [meterOf('In place', good + ' of ' + n, ok ? 'good' : '')].concat(o.meters ? o.meters(p, good) : []);
      return { ok, meters: ms, note: o.note ? o.note(p, good) : (ok ? 'Everything is in place.' : (o.count === false ? '' : good + ' of ' + n + ' are right.')), why: o.why, fail: o.fail || '' }; } };
  if (o.guide) spec.coach = (p, carry) => { const empty = o.slots.find(s => !p[s.id]); if (!carry && empty) return 'pick a part from the bins.'; if (carry) return 'place it in a socket.'; const bad = o.slots.find(s => p[s.id].label !== s.want); return bad ? 'swap the one that does not belong: take it back with Space on the socket.' : 'all in place. Press Enter.'; };
  const m = mk(spec); m.coach = spec.coach; return m;
}
const LABSET = (arr, name) => (idx, topic, labs) => { const L = arr[idx - 1]; if (!L || L.topic !== topic) throw new Error(name + ' lab/level mismatch at ' + idx + ': ' + (L && L.topic) + ' vs ' + topic); L.chals.push(...labs); };
