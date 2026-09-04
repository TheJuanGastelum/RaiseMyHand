const { chromium } = require('playwright');

(async () => {
  // One shared browser context so all simulated "devices" (tabs) share the
  // same localStorage/origin storage — that's what lets the fake Firestore
  // (backed by localStorage + the cross-tab `storage` event) simulate
  // multiple real devices talking to one backend.
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const context = await browser.newContext();
  const errors = [];

  async function run(name, fn) {
    const page = await context.newPage();
    page.on('pageerror', (e) => errors.push(name + ': pageerror: ' + e.message));
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(name + ': console.error: ' + msg.text()); });
    await page.goto('http://127.0.0.1:8934/test/index.html');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForSelector('#pickTeacher', { timeout: 5000 });
    await fn(page);
    await page.close();
  }

  await run('teacher-flow', async (page) => {
    await page.click('#pickTeacher');
    await page.waitForSelector('#className');
    await page.fill('#className', 'Period 3 — ECE 175');
    await page.click('#startBtn');
    await page.waitForSelector('.code-value', { timeout: 5000 });
    const code = await page.$eval('.code-value', (el) => el.textContent.trim());
    console.log('Created session code:', code);

    // Seed queue entries directly through the app's own db by opening a second page acting as students.
    const studentPages = [];
    for (const name of ['Jordan R.', 'Priya K.']) {
      const sp = await context.newPage();
      await sp.goto('http://127.0.0.1:8934/test/index.html');
      await sp.waitForSelector('#pickStudent', { timeout: 5000 });
      await sp.click('#pickStudent');
      await sp.waitForSelector('#joinCode');
      await sp.fill('#joinCode', code);
      await sp.fill('#joinName', name);
      await sp.click('#joinBtn');
      await sp.waitForSelector('#raiseBtn', { timeout: 5000 });
      await sp.click('#raiseBtn');
      await sp.waitForSelector('#ticketCard', { timeout: 5000 });
      const posText = await sp.$eval('#posValue', (el) => el.textContent);
      console.log(name, 'ticket position:', posText);
      studentPages.push(sp);
    }

    await page.waitForTimeout(500);
    const rows = await page.$$eval('.stub .name', (els) => els.map((e) => e.textContent));
    console.log('Teacher board shows:', rows);
    if (rows.length !== 2) throw new Error('Expected 2 queued students, saw ' + rows.length);

    const waitCount = await page.$eval('#waitCount', (el) => el.textContent);
    console.log('Wait count label:', waitCount);

    // Mark the first student (Jordan, who is "next") helped and confirm the row disappears
    // AND that Jordan's own tab sees the "you've been called" confirmation live.
    await page.click('.help-btn');
    await page.waitForTimeout(400);
    const rowsAfter = await page.$$eval('.stub .name', (els) => els.map((e) => e.textContent));
    console.log('After marking helped:', rowsAfter);
    if (rowsAfter.length !== 1) throw new Error('Expected 1 student left after helping, saw ' + rowsAfter.length);

    const jordanPage = studentPages[0];
    await jordanPage.waitForSelector('.called-flash', { timeout: 5000 });
    const calledText = await jordanPage.$eval('.called-flash h2', (el) => el.textContent);
    console.log('Jordan’s tab shows:', calledText);
    await jordanPage.waitForSelector('#raiseBtn', { timeout: 5000 });
    console.log('Jordan’s tab returned to the raise-hand pad automatically.');

    for (const sp of studentPages) await sp.close();

    // End the session.
    await page.click('#endBtn');
    await page.click('#endBtn');
    await page.waitForSelector('#className', { timeout: 5000 });
    console.log('Session ended, back at start screen.');
  });

  await browser.close();

  if (errors.length) {
    console.error('\n--- Page errors detected ---');
    errors.forEach((e) => console.error(e));
    process.exit(1);
  } else {
    console.log('\nAll smoke checks passed with no page errors.');
  }
})();
