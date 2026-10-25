const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  for (const f of ['cpu-quest', 'power-keeper', 'embedded-quest', 'circuit-basics-quest']) {
    const ctx = await br.newContext({ viewport: { width: 375, height: 800 }, reducedMotion: 'reduce' });
    const pg = await ctx.newPage();
    await pg.goto('file:///tmp/claude-0/-home-user-RaiseMyHand/260b780e-de8c-58c5-bc8f-7eba88ae2ae2/scratchpad/study-games/' + f + '.html?test');
    const out = [];
    for (const [lv, ch] of [[0, 0], [12, 5], [3, 2], [5, 3]]) {
      await pg.evaluate(([lv, ch]) => { __kit.home(); if (lv) { __kit.start(lv); __kit.next(); for (let i = 1; i < ch; i++) { __kit.auto(); __kit.next(); } } }, [lv, ch]);
      await pg.waitForTimeout(100);
      out.push(await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
    }
    console.log(f, 'overflow px (home, L12c5, L3c2, L5c3):', out.join(','));
    if (f === 'cpu-quest') { await pg.evaluate(() => { __kit.home(); __kit.start(12); __kit.next(); for (let i = 1; i < 5; i++) { __kit.auto(); __kit.next(); } }); await pg.waitForTimeout(200); await pg.screenshot({ path: 'gshots/mob-cpu-wire.png' }); }
    await ctx.close();
  }
  await br.close();
})();
