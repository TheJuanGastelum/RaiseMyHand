// Plays levels using only the keyboard (real key presses) and checks every challenge resolves correct.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const file = process.argv[2]; const only = process.argv[3] ? process.argv[3].split(',').map(Number) : null;
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const pg = await (await br.newContext({ viewport: { width: 1000, height: 900 }, reducedMotion: 'reduce' })).newPage();
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file://' + file + '?test');
  await pg.evaluate(() => { __kit.state().calm = true; });
  const N = await pg.evaluate(() => __kit.cfg.levels.length);
  const press = async k => { await pg.keyboard.press(k); };
  let problems = 0, types = {};
  for (let n = 1; n <= N; n++) {
    if (only && !only.includes(n)) continue;
    await pg.evaluate(n => { __kit.home(); __kit.start(n); }, n);
    const len = await pg.evaluate(() => __kit.run().level.chals.length);
    for (let i = 0; i < len; i++) {
      // lesson pages: Enter continues
      for (let g = 0; g < 4; g++) { const isL = await pg.evaluate(() => !!document.querySelector('#body .lesson') || (!!document.querySelector('#go') && !document.querySelector('#body .q'))); if (!isL) break; await press('Enter'); await pg.waitForTimeout(5); }
      const t = await pg.evaluate(() => __kit.run().spec.t);
      types[t] = (types[t] || 0) + 1;
      if (t === 'lab') { await pg.evaluate(() => __kit.auto()); await press('Enter'); continue; }
      try {
        if (t === 'choice') {
          const k = await pg.evaluate(() => { const r = __kit.run(); const bs = [...document.querySelectorAll('.opts button')]; return bs.findIndex(b => +b.dataset.oi === r.spec.a); });
          await press(String(k + 1));
        } else if (t === 'num') {
          const a = await pg.evaluate(() => { const r = __kit.run(); return Array.isArray(r.spec.a) ? r.spec.a[0] : r.spec.a; });
          await pg.focus('.numrow input'); await pg.keyboard.type(String(a)); await press('Enter'); { const rr=await pg.evaluate(()=>{const r=__kit.run();return JSON.stringify(r.results)+' i='+r.i+' mode='+r.mode+' tol='+r.spec.tol+' abs='+r.spec.abs}); if(process.env.DBG) console.log('num L'+n+' ch'+i+' a='+a+' -> '+rr);}
        } else if (t === 'match') {
          const want = await pg.evaluate(() => __kit.run().spec.pairs.map(p => p[1]));
          for (let s = 0; s < want.length; s++) {
            for (let g = 0; g < 20; g++) {
              const txt = await pg.evaluate(s => { const sl = document.querySelectorAll('.slot')[s]; return sl.textContent; }, s);
              const w = await pg.evaluate(s => { const d = document.createElement('div'); d.innerHTML = __kit.run().spec.pairs[s][1]; return d.textContent; }, s);
              if (txt === w) break; await press('d');
            }
            await press('s');
          }
          await press('Enter');
        } else if (t === 'order') {
          const items = await pg.evaluate(() => __kit.run().spec.items.map(x => { const d = document.createElement('div'); d.innerHTML = x; return d.textContent; }));
          for (const it of items) {
            for (let g = 0; g < 20; g++) {
              const st = await pg.evaluate(it => { const bs = [...document.querySelectorAll('.tray')].pop().querySelectorAll('button'); const cur = [...bs].findIndex(b => b.classList.contains('kfocus')); const tgt = [...bs].findIndex(b => b.textContent === it); return { cur, tgt }; }, it);
              if (st.cur === st.tgt) break; await press(st.tgt > st.cur ? 's' : 'w');
            }
            await press('Enter');
          }
          await press('Enter');
        } else if (t === 'sort') {
          const nb = await pg.evaluate(() => __kit.run().spec.buckets.length);
          const total = await pg.evaluate(() => __kit.run().spec.items.length);
          for (let k = 0; k < total; k++) {
            const bi = await pg.evaluate(() => { const r = __kit.run(); const h = document.querySelector('.sortcard').innerHTML; const it = r.spec.items.find(x => x[0] === h); return it ? it[1] : -1; });
            if (bi < 0) throw new Error('card not found');
            await press(nb === 2 ? (bi === 0 ? 'ArrowLeft' : 'ArrowRight') : nb === 3 ? ['a', 's', 'd'][bi] : String(bi + 1));
          }
        } else if (t === 'wire') {
          const links = await pg.evaluate(() => { const s = __kit.run().spec; return s.links.map(l => [s.left.findIndex(x => x.id === l[0]), s.right.findIndex(x => x.id === l[1])]); });
          for (const [li, ri] of links) {
            await press('a');
            for (let g = 0; g < 20; g++) { const cur = await pg.evaluate(() => { const bs = [...document.querySelectorAll('.wire .col')[0].children]; return bs.findIndex(b => b.classList.contains('kfocus')); }); if (cur === li) break; await press(cur < li ? 's' : 'w'); }
            await press('d');
            for (let g = 0; g < 20; g++) { const cur = await pg.evaluate(() => { const bs = [...document.querySelectorAll('.wire .col')[1].children]; return bs.findIndex(b => b.classList.contains('kfocus')); }); if (cur === ri) break; await press(cur < ri ? 's' : 'w'); }
            await press('Enter');
          }
          await press(' ');
        } else if (t === 'bits') {
          const need = await pg.evaluate(() => { const s = __kit.run().spec; return s.target.split('').map((b, i) => (b !== s.start[i] ? i : -1)).filter(x => x >= 0); });
          for (const idx of need) {
            for (let g = 0; g < 20; g++) { const cur = await pg.evaluate(() => [...document.querySelectorAll('.reg .bit button')].findIndex(b => b.classList.contains('kfocus'))); if (cur === idx) break; await press(cur < idx ? 'd' : 'a'); }
            await press(' ');
          }
          await press('Enter');
        }
        await pg.waitForTimeout(5);
        const ok = await pg.evaluate(() => { const r = __kit.run(); return r.results[r.i] && r.results[r.i].ok; });
        if (!ok) { problems++; console.log('PROBLEM level', n, 'ch', i + 1, t, await pg.evaluate(() => JSON.stringify(__kit.run().spec).slice(0, 160))); }
      } catch (e) { problems++; console.log('ERR level', n, 'ch', i + 1, t, e.message); }
      await press('Enter'); // next
      await pg.waitForTimeout(5);
    }
    const done = await pg.evaluate(() => __kit.run().done);
    if (!done) { problems++; console.log('level', n, 'not finished'); }
  }
  console.log('keyboard-only problems:', problems, JSON.stringify(types), 'errors:', errs.length ? [...new Set(errs)] : 'none');
  await br.close();
})();
