const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const g of ['circuit-basics-quest','power-keeper','cpu-quest','embedded-quest']){
const pg=await (await br.newContext({viewport:{width:1000,height:900},reducedMotion:'reduce'})).newPage();
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+process.cwd()+'/study-games/'+g+'.html?test');
await pg.evaluate(()=>{__kit.state().calm=true;__kit.home();});
const vis=await pg.evaluate(()=>{const b=document.getElementById('anaBtn');const r=b.getBoundingClientRect();return [b.textContent,Math.round(r.right),Math.round(r.top)]});
await pg.evaluate(()=>__kit.start(3)); await pg.evaluate(()=>__kit.next());
const before=await pg.evaluate(()=>document.querySelector('.anabox')?1:0);
await pg.click('#anaBtn'); const t1=await pg.evaluate(()=>[document.getElementById('anaBtn').textContent,document.body.classList.contains('ana-off'),__kit.state().ana,__kit.mode()]);
await pg.keyboard.press('n'); const t2=await pg.evaluate(()=>[document.getElementById('anaBtn').textContent,__kit.state().ana,__kit.mode(),document.querySelector('#lvtitle').textContent]);
await pg.evaluate(()=>__kit.home()); await pg.click('#anaBtn');
console.log(g,vis.join(' '),'| toggled:',JSON.stringify(t1),JSON.stringify(t2),'errs',errs.length?errs:'none');
if(g==='circuit-basics-quest')await pg.screenshot({path:'anabtn.png',clip:{x:0,y:0,width:1000,height:260}});
}
await br.close();})();
