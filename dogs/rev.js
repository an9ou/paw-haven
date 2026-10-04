const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1340,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
for(const spec of process.argv.slice(2)){const [k,m,f]=spec.split(':');await p.goto(`file://${__dirname}/review.html?k=${k}&m=${m||'poses'}&f=${f||0}`);await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(300);await p.locator('#g').screenshot({path:`shots/r_${k}_${m||'poses'}_${f||0}.png`})}
console.log(errs.join('\n')||'ok');await b.close()})();
