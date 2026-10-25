  /* ---------- lab: walk, carry parts, build the thing, test it ---------- */
  const GLY = {
    R: '<path d="M1 10h6l2-6 4 12 4-12 4 12 4-12 2 6h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    C: '<path d="M1 10h15M16 3v14M24 3v14M24 10h15" fill="none" stroke="currentColor" stroke-width="2"/>',
    L: '<path d="M1 12h5a4 6 0 0 1 8 0a4 6 0 0 1 8 0a4 6 0 0 1 8 0h9" fill="none" stroke="currentColor" stroke-width="2"/>',
    BAT: '<path d="M1 10h13M14 3v14M20 6v8M20 10h19" fill="none" stroke="currentColor" stroke-width="2"/><text x="26" y="6" font-size="7" fill="currentColor">+</text>',
    LED: '<path d="M1 10h12M13 3l10 7-10 7zM24 3v14M24 10h15M26 2l5-3M30 5l5-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    BULB: '<circle cx="20" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 4l12 12M26 4L14 16M1 10h5M34 10h5" stroke="currentColor" stroke-width="2"/>',
    SRC: '<circle cx="20" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 10c2-5 4-5 6 0s4 5 6 0M1 10h5M34 10h5" fill="none" stroke="currentColor" stroke-width="2"/>',
    MOTOR: '<circle cx="20" cy="10" r="8" fill="none" stroke="currentColor" stroke-width="2"/><text x="15.5" y="14" font-size="11" font-weight="700" fill="currentColor">M</text><path d="M1 10h5M34 10h5" stroke="currentColor" stroke-width="2"/>',
    BOX: '<rect x="8" y="2" width="24" height="16" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M1 10h7M32 10h7" stroke="currentColor" stroke-width="2"/>',
  };
  const glyph = k => '<svg class="gly" viewBox="0 0 40 20" aria-hidden="true">' + (GLY[k] || GLY.BOX) + '</svg>';

  BUILD.lab = (s, c) => {
    const cols = s.cols || 11, rows = s.rows || 7;
    const ents = [];
    const parts = s.parts;
    parts.forEach((p, i) => ents.push({ type: 'bin', x: parts.length === 1 ? Math.floor(cols / 2) : Math.round(1 + i * (cols - 3) / (parts.length - 1)), y: rows - 1, part: p }));
    (s.sockets || []).forEach(k => ents.push(Object.assign({ type: 'socket' }, k)));
    (s.fixed || []).forEach(k => ents.push(Object.assign({ type: 'fixed' }, k)));
    const lev = Object.assign({ x: cols - 1, y: Math.floor(rows / 2) }, s.lever || {});
    ents.push({ type: 'lever', x: lev.x, y: lev.y });
    const at = (x, y) => ents.find(e => e.x === x && e.y === y);
    const sockets = ents.filter(e => e.type === 'socket');
    const placed = {}; sockets.forEach(k => placed[k.id] = null);
    let pos = Object.assign({ x: Math.floor(cols / 2), y: Math.floor(rows / 2) - 1 }, s.start || {}), face = 'u', carry = null, done = false, busy = false;
    const DV = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
    const pct = (x, y) => 'left:' + (x / cols * 100) + '%;top:' + (y / rows * 100) + '%;width:' + (100 / cols) + '%;height:' + (100 / rows) + '%';

    const wiresSvg = '<svg class="labwires" viewBox="0 0 ' + cols + ' ' + rows + '" preserveAspectRatio="none" aria-hidden="true">' +
      (s.wires || []).map(w => '<polyline points="' + w.map(p => (p[0] + .5) + ',' + (p[1] + .5)).join(' ') + '" />').join('') + '</svg>';
    const room = h('div', { class: 'lab', role: 'group', 'aria-label': 'Workshop. Walk with W A S D or the arrow keys.', style: '--cols:' + cols + ';--rows:' + rows + ';aspect-ratio:' + cols + '/' + rows, html: wiresSvg });
    const els = new Map();
    ents.forEach(e => {
      let el;
      if (e.type === 'bin') el = h('div', { class: 'ent bin', style: pct(e.x, e.y), html: glyph(e.part.kind || 'R') + '<b>' + e.part.label + '</b>', 'aria-label': 'Parts bin: ' + e.part.label });
      else if (e.type === 'socket') el = h('div', { class: 'ent socket', style: pct(e.x, e.y), 'aria-label': 'Socket ' + (e.label || e.id) });
      else if (e.type === 'lever') el = h('div', { class: 'ent lever', style: pct(e.x, e.y), html: '<i></i><b>TEST</b>', 'aria-label': 'Test lever' });
      else el = h('div', { class: 'ent fixed k-' + (e.kind || 'BOX'), style: pct(e.x, e.y), html: glyph(e.kind) + '<b>' + (e.label || '') + '</b>' + (e.sub ? '<small>' + e.sub + '</small>' : ''), 'aria-label': (e.label || '') + ' ' + (e.sub || '') });
      el.addEventListener('click', () => clickEnt(e));
      els.set(e, el); room.append(el);
    });
    const me = h('div', { class: 'me', style: pct(pos.x, pos.y), 'aria-hidden': 'true' }, h('div', { class: 'carry' }), h('div', { class: 'body' }));
    room.append(me);
    const marker = h('div', { class: 'facemark', 'aria-hidden': 'true' }); room.append(marker);

    const note = h('div', { class: 'labnote', 'aria-live': 'polite' });
    const meters = h('div', { class: 'labmeters', 'aria-live': 'polite' });
    const tipbar = h('div', { class: 'labtip' });
    const teach = s.teach ? h('div', { class: 'labteach', html: '<b class="eh">Lab notebook</b>' + s.teach }) : null;
    const pad = h('div', { class: 'labpad' },
      h('button', { tabindex: -1, 'aria-label': 'Up', onclick: () => step('u') }, '▲'), h('button', { tabindex: -1, 'aria-label': 'Left', onclick: () => step('l') }, '◀'),
      h('button', { tabindex: -1, 'aria-label': 'Down', onclick: () => step('d') }, '▼'), h('button', { tabindex: -1, 'aria-label': 'Right', onclick: () => step('r') }, '▶'),
      h('button', { class: 'act', tabindex: -1, onclick: () => act() }, 'Grab / place'), h('button', { class: 'act', tabindex: -1, onclick: () => b.check() }, 'TEST'));
    const el = h('div', { class: 'labwrap' }, teach, room, tipbar, meters, note, pad);

    const target = () => { const d = DV[face]; return at(pos.x + d[0], pos.y + d[1]); };
    const free = (x, y) => x >= 0 && y >= 0 && x < cols && y < rows && !at(x, y);
    function step(dir) {
      if (done || run.answered) return; face = dir;
      const d = DV[dir], nx = pos.x + d[0], ny = pos.y + d[1];
      if (free(nx, ny)) { pos = { x: nx, y: ny }; sfx.tick && sfx.tick(); }
      paint();
    }
    function snapshot() { return Object.assign({}, placed); }
    function act() {
      if (done || run.answered) return;
      const t = target(); if (!t) { tipbar.textContent = 'Nothing in front of you. Face a bin, a socket or the lever.'; return; }
      if (t.type === 'bin') { carry = t.part; }
      else if (t.type === 'socket') {
        if (carry) { const prev = placed[t.id]; placed[t.id] = carry; carry = prev || null; }
        else if (placed[t.id]) { carry = placed[t.id]; placed[t.id] = null; }
      } else if (t.type === 'lever') { return b.check(); }
      else if (t.type === 'fixed') { tipbar.textContent = t.info || ((t.label || '') + ' ' + (t.sub || '')); return; }
      paint();
    }
    function clickEnt(e) {
      if (done || run.answered) return;
      // stand on any free neighbour and face the thing
      const opts = [['u', 0, 1], ['d', 0, -1], ['l', 1, 0], ['r', -1, 0]].map(([f, dx, dy]) => ({ f, x: e.x + dx, y: e.y + dy })).filter(o => free(o.x, o.y));
      if (!opts.length) return; opts.sort((a, b2) => Math.abs(a.x - pos.x) + Math.abs(a.y - pos.y) - Math.abs(b2.x - pos.x) - Math.abs(b2.y - pos.y));
      pos = { x: opts[0].x, y: opts[0].y }; face = opts[0].f; act();
    }
    function result() {
      const filled = sockets.every(k => placed[k.id]);
      const r = s.model(snapshot()) || {};
      return { filled, r };
    }
    function paint() {
      me.style.cssText = pct(pos.x, pos.y);
      me.className = 'me f-' + face + (carry ? ' has' : '');
      me.firstChild.innerHTML = carry ? glyph(carry.kind || 'R') + '<b>' + carry.label + '</b>' : '';
      const d = DV[face], t = target();
      marker.style.cssText = pct(pos.x + d[0], pos.y + d[1]); marker.classList.toggle('on', !!t);
      ents.forEach(e => {
        const x = els.get(e); x.classList.toggle('target', e === t);
        if (e.type === 'socket') { const p = placed[e.id]; x.classList.toggle('full', !!p); x.innerHTML = p ? glyph(p.kind || 'R') + '<b>' + p.label + '</b>' : '<b class="q">?</b>' + (e.label ? '<small>' + e.label + '</small>' : ''); x.setAttribute('aria-label', 'Socket ' + (e.label || e.id) + (p ? ' holds ' + p.label : ' empty')); }
      });
      if (t) tipbar.textContent = t.type === 'bin' ? (carry ? 'Space: swap what you hold for ' : 'Space: pick up ') + t.part.label : t.type === 'socket' ? (carry ? (placed[t.id] ? 'Space: swap ' + carry.label + ' with ' + placed[t.id].label : 'Space: place ' + carry.label + ' here') : (placed[t.id] ? 'Space: take ' + placed[t.id].label + ' back' : 'Hold a part first')) : t.type === 'lever' ? 'Space or Enter: TEST the circuit' : 'Look: ' + (t.label || '');
      else tipbar.textContent = carry ? 'You are holding ' + carry.label + '. Walk to a socket.' : 'Walk to a parts bin and press Space to pick one up.';
      const { filled, r } = result();
      meters.replaceChildren(...(r.meters || []).map(m => h('div', { class: 'meter ' + (m.st || '') }, h('small', null, m.k), h('b', null, m.v))));
      const coach = s.coach && !done ? s.coach(snapshot(), carry) : '';
      note.innerHTML = (filled ? (r.note || '') : (r.note || '')) + (coach ? '<div class="coach"><b>Next:</b> ' + coach + '</div>' : '');
      room.classList.toggle('live', !!(filled && r.live));
    }
    paint();
    const b = {
      el, checkLabel: 'Test circuit (Enter)', keys: 'W A S D or arrows walk · Space / E grab or place · Q put down · Enter / T test',
      key(e, dir) {
        if (done) return false;
        if (dir) { step(dir); return true; }
        if (e.key === ' ' || e.key === 'e' || e.key === 'E') { act(); return true; }
        if (e.key === 'q' || e.key === 'Q' || e.key === 'Backspace') { carry = null; paint(); return true; }
        if (e.key === 'Enter' || e.key === 't' || e.key === 'T') { b.check(); return true; }
        return false;
      },
      check() {
        if (done || run.answered) return;
        const { filled, r } = result();
        if (!filled) { note.innerHTML = '<b>Fill every socket first.</b> ' + (r.note || ''); tipbar.textContent = 'Some sockets are still empty.'; return; }
        if (r.ok) { done = true; run.spec.why = r.why || r.note; room.classList.add('live', 'won'); }
        else { note.innerHTML = '<b>Not working yet.</b> ' + (r.fail || r.note || ''); }
        c.attempt(!!r.ok);
      },
      retry() { room.classList.remove('won'); },
      reveal() { done = true; solve(); paint(); },
      auto() { solve(); paint(); b.check(); },
      autoWrong() { const combos = enumerate(); const bad = combos.find(x => !s.model(x).ok); Object.assign(placed, bad || {}); paint(); b.check(); },
      lab: { cols, rows, ents, pos: () => pos, face: () => face, carry: () => carry, placed: () => placed },
    };
    function enumerate() {
      const out = [], ids = sockets.map(k => k.id);
      const rec = (i, cur) => { if (i === ids.length) return void out.push(Object.assign({}, cur)); parts.forEach(p => { cur[ids[i]] = p; rec(i + 1, cur); }); };
      rec(0, {}); return out;
    }
    function solve() { const ok = enumerate().find(x => s.model(x).ok); if (ok) Object.assign(placed, ok); carry = null; }
    return b;
  };

