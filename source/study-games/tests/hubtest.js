const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const pg=await (await br.newContext({viewport:{width:1000,height:1100}})).newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('http://localhost:8123/');await pg.waitForTimeout(400);
await pg.screenshot({path:'hub1.png'});
// walk to door 3 with the keyboard: press 3 (auto-walk) then Enter near
await pg.keyboard.press('3');await pg.waitForTimeout(2500);
console.log('after key 3, url:',pg.url());

// manual: go back, use arrows
await pg.goto('http://localhost:8123/');await pg.focus('#c');
await pg.keyboard.down('ArrowUp');await pg.waitForTimeout(500);await pg.keyboard.up('ArrowUp');
await pg.keyboard.down('ArrowLeft');await pg.waitForTimeout(560);await pg.keyboard.up('ArrowLeft');
console.log('hint2:',await pg.evaluate(()=>document.getElementById('hint').textContent));
await pg.keyboard.press('Enter');await pg.waitForTimeout(800);console.log('url2:',pg.url());
console.log('has hub btn:',await pg.evaluate(()=>!!document.querySelector('.hubbtn')));
await pg.click('.hubbtn');await pg.waitForTimeout(500);console.log('back at:',pg.url());
console.log(errs);await br.close();})();
