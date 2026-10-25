const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});let bad=0;
for(const g of ['circuit-basics-quest','power-keeper','cpu-quest','embedded-quest']){
const pg=await (await br.newContext({viewport:{width:390,height:800},reducedMotion:'reduce'})).newPage();await pg.goto('file://'+process.cwd()+'/study-games/'+g+'.html?test');
await pg.evaluate(()=>{__kit.state().calm=true});
const N=await pg.evaluate(()=>__kit.cfg.levels.length);
for(let n=1;n<=N;n++){await pg.evaluate(n=>{__kit.home();__kit.start(n)},n);
 for(let i=0;i<3;i++){const w=await pg.evaluate(()=>[document.documentElement.scrollWidth-window.innerWidth,__kit.run().spec.t]);
  if(w[0]>0){bad++;console.log(g,'L'+n,'ch'+(i+1),w[1],'overflow',w[0]);}
  await pg.evaluate(()=>{__kit.auto()}); await pg.evaluate(()=>__kit.next());}}
}
console.log('mobile sweep done, overflows:',bad);await br.close();})();
