const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const file = process.argv[2]; const reps = +(process.argv[3] || 3);
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const errs = []; let problems = 0;
  for (const ana of [true, false]) {
    const ctx = await br.newContext({ viewport: { width: 1000, height: 900 }, reducedMotion: 'reduce' });
    const pg = await ctx.newPage();
    pg.on('pageerror', e => errs.push(e.message));
    pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
    await pg.goto('file://' + file + '?test');
    await pg.evaluate(a => { const s = __kit.state(); s.ana = a; s.calm = true; }, ana);
    const N = await pg.evaluate(() => __kit.cfg.levels.length);
    for (let rep = 0; rep < reps; rep++) {
      for (let n = 1; n <= N; n++) {
        await pg.evaluate(n => { __kit.home(); __kit.start(n); }, n);
        const info = await pg.evaluate(() => { const l = __kit.run().level; return { len: l.chals.length, title: l.topic }; });
        await pg.evaluate(() => __kit.next()); // briefing
        for (let i = 0; i < info.len; i++) {
          const ok = await pg.evaluate(async () => {
            const r = __kit.run(); if (!r) return 'norun';
            __kit.auto();
            await new Promise(r => setTimeout(r, 5));
            const rr = __kit.run();
            return rr.results[rr.i] ? (rr.results[rr.i].ok ? 'ok' : 'notok') : 'unresolved';
          });
          if (ok !== 'ok') { problems++; console.log('PROBLEM ana=' + ana + ' level ' + n + ' ch ' + (i + 1) + ': ' + ok + ' ' + (await pg.evaluate(() => JSON.stringify(__kit.run().spec).slice(0, 200)))); }
          await pg.evaluate(() => __kit.next());
        }
        const done = await pg.evaluate(() => __kit.run().done);
        if (!done) { problems++; console.log('level', n, 'not finished'); }
      }
    }
    // wrong-answer path: 3 wrongs on level 1 -> lose
    await pg.evaluate(() => { __kit.home(); __kit.start(1); __kit.next(); });
    let fin = false;
    for (let k = 0; k < 8 && !fin; k++) {
      await pg.evaluate(() => { const r = __kit.run(); if (r.answered) __kit.next(); else __kit.autoWrong(); });
      await pg.waitForTimeout(30);
      fin = await pg.evaluate(() => __kit.run().done || !!document.querySelector('.res'));
      await pg.waitForTimeout(950);
      fin = await pg.evaluate(() => !!document.querySelector('.res'));
    }
    console.log('ana=' + ana + ' lose path reached results:', fin);
    await ctx.close();
  }
  console.log('levels:', 'problems:', problems, 'errors:', errs.length ? [...new Set(errs)] : 'none');
  await br.close();
})();
