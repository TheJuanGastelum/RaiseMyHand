const { chromium } = require('/opt/node22/lib/node_modules/playwright');
(async()=>{const br=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
for(const g of ['circuit-basics-quest','power-keeper','cpu-quest','embedded-quest']){
const pg=await (await br.newContext()).newPage();await pg.goto('file://'+process.cwd()+'/study-games/'+g+'.html?test');
const r=await pg.evaluate(()=>__kit.cfg.levels.map(l=>[l.n,l.chals.filter(c=>c.t==='lab').length,l.chals.filter(c=>c.t!=='lab').length]));
const missing=r.filter(x=>x[1]<3).map(x=>x[0]);console.log(g,'levels',r.length,'labs',r.reduce((a,x)=>a+x[1],0),'checks',r.reduce((a,x)=>a+x[2],0),'levels with <3 labs:',JSON.stringify(r.filter(x=>x[1]<3))||'none');}
await br.close();})();
