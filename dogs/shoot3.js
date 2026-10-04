const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1500,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+__dirname+'/gallery.html');await p.waitForTimeout(800);console.log(await p.textContent('#legcheck'));console.log(await p.textContent('#perf'));
const hs=await p.$$('h3');const grids=await p.$$('.grid');let n=0;
for(const g of grids){const t=await g.evaluate(e=>e.previousElementSibling&&e.previousElementSibling.textContent||'');if(/PawGenes|Random rescue|hand palettes/.test(t)){await g.screenshot({path:`shots/coat${n++}.png`})}}
console.log('coat grids',n,errs.join('\n')||'no errors');await b.close()})();
