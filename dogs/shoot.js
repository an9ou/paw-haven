const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1400,height:900},deviceScaleFactor:Number(process.env.DSF||1)});
const errs=[];p.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errs.push(m.text())});p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
await p.goto('file://'+__dirname+'/gallery.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);
console.log(await p.textContent('#perf'));
const hs=await p.$$('h3');const sel=process.argv[2]||'all';
console.log(await p.textContent('#legcheck'));const rows=await p.$$('.grid');
for(let i=0;i<rows.length;i++){if(sel!=='all'&&!sel.split(',').includes(String(i)))continue;await rows[i].screenshot({path:`shots/g${i}.png`})}
console.log('grids',rows.length);console.log(errs.join('\n')||'no console errors');await b.close()})();
