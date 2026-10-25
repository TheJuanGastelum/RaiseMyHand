// plays every lab with real key presses: BFS walk to bins/sockets, place the solution, press Enter
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const file = process.argv[2]; const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null; const reps = +(process.argv[4] || 2);
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await (await br.newContext({ viewport: { width: 1000, height: 1000 }, reducedMotion: 'reduce' })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file + '?test'); await pg.evaluate(() => { __kit.state().calm = true; });
  const N = await pg.evaluate(() => __kit.cfg.levels.length); let problems = 0, labs = 0; const seen = new Set();
  const press = k => pg.keyboard.press(k);
  const info = () => pg.evaluate(() => { const r = __kit.run(), l = r.b.lab; return { pos: l.pos(), cols: l.cols, rows: l.rows, ents: l.ents.map(e => ({ type: e.type, x: e.x, y: e.y, id: e.id, label: e.part && e.part.label })), carry: l.carry() && l.carry().label, placed: Object.fromEntries(Object.entries(l.placed()).map(([k, v]) => [k, v && v.label])) }; });
  async function walkTo(ent) { // stand next to ent, face it
    for (let guard = 0; guard < 60; guard++) {
      const I = await info(); const blocked = new Set(I.ents.map(e => e.x + ',' + e.y));
      const goals = [[0, 1, 'u'], [0, -1, 'd'], [1, 0, 'l'], [-1, 0, 'r']].map(([dx, dy, f]) => ({ x: ent.x + dx, y: ent.y + dy, f })).filter(g => g.x >= 0 && g.y >= 0 && g.x < I.cols && g.y < I.rows && !blocked.has(g.x + ',' + g.y));
      // BFS
      const q = [[I.pos.x, I.pos.y, []]], seen = new Set([I.pos.x + ',' + I.pos.y]); let path = null;
      const gm = new Map(goals.map(g => [g.x + ',' + g.y, g.f]));
      while (q.length) { const [x, y, p] = q.shift(); if (gm.has(x + ',' + y)) { path = p.concat('F' + gm.get(x + ',' + y)); break; }
        for (const [dx, dy, k] of [[0, -1, 'w'], [0, 1, 's'], [-1, 0, 'a'], [1, 0, 'd']]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= I.cols || ny >= I.rows || blocked.has(nx + ',' + ny) || seen.has(nx + ',' + ny)) continue; seen.add(nx + ',' + ny); q.push([nx, ny, p.concat(k)]); } }
      if (!path) throw new Error('no path'); const faceKey = { u: 'w', d: 's', l: 'a', r: 'd' };
      for (const k of path) await press(k.length === 1 ? k : faceKey[k[1]]);
      return;
    }
  }
  for (let n = 1; n <= N; n++) {
    if (only && !only.includes(n)) continue;
    for (let rep = 0; rep < reps; rep++) {
      await pg.evaluate(n => { __kit.home(); __kit.start(n); }, n);
      const len = await pg.evaluate(() => __kit.run().level.chals.length);
      for (let i = 0; i < len; i++) {
        for (let g = 0; g < 4; g++) { const isL = await pg.evaluate(() => !!document.querySelector('#body .lesson')); if (!isL) break; await press('Enter'); }
        const t = await pg.evaluate(() => __kit.run().spec.t);
        if (t !== 'lab') { await pg.evaluate(() => __kit.auto()); await press('Enter'); continue; }
        labs++;
        try {
          // find solution through the model by brute force inside the page
          const sol = await pg.evaluate(() => { const r = __kit.run(), s = r.spec, ids = s.sockets.map(k => k.id); const out = []; const rec = (i, cur) => { if (i === ids.length) { if (s.model(cur).ok) out.push(Object.assign({}, cur)); return; } s.parts.forEach(p => { cur[ids[i]] = p; rec(i + 1, cur); }); }; rec(0, {}); return out.length ? Object.fromEntries(Object.entries(out[0]).map(([k, v]) => [k, v.label])) : null; });
          if (!sol) throw new Error('no solution');
          for (const [sid, label] of Object.entries(sol)) {
            let I = await info(); const bin = I.ents.find(e => e.type === 'bin' && e.label === label); await walkTo(bin); await press(' ');
            I = await info(); const sock = I.ents.find(e => e.type === 'socket' && e.id === sid); await walkTo(sock); await press(' ');
          }
          await press('Enter');
          const ok = await pg.evaluate(() => { const r = __kit.run(); return r.results[r.i] && r.results[r.i].ok; });
          if (!ok) { problems++; const k = 'PROBLEM level ' + n + ' ch ' + (i + 1); if (!seen.has(k)) { seen.add(k); console.log(k); } }
        } catch (e) { problems++; const k = 'ERR level ' + n + ' ch ' + (i + 1) + ' ' + e.message.split('\n')[0]; if (!seen.has(k)) { seen.add(k); console.log(k); } await pg.evaluate(() => { try { __kit.auto(); } catch (x) {} }); }
        await press('Enter');
      }
    }
  }
  console.log('labs played by keyboard:', labs, 'problems:', problems, 'errors:', errs.length ? errs : 'none'); await br.close();
})();
