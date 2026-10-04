// Playwright screenshots of the world C gallery at 1280x720 (Chromium at /opt/pw-browsers/chromium)
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+__dirname+'/gallery.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(800);
console.log(await p.textContent('#perf'));
const only=process.argv[2];
for(const n of ['square','cafe','dogpark','vet','salon','hilltop','pier'])if(!only||only.includes('grid'))await (await p.$('.sec-'+n+' .grid')).screenshot({path:`${__dirname}/shots/grid_${n}.png`});
if(!only||only.includes('close')){const sc=await p.$$('.sec-close .scene');for(let i=0;i<sc.length;i++)await sc[i].screenshot({path:`${__dirname}/shots/close${i}.png`});
  const s2=await p.$$('.sec-close2 .scene');for(let i=0;i<s2.length;i++)await s2[i].screenshot({path:`${__dirname}/shots/var${i}.png`});}
if(!only||only.includes('strip')){const st=await p.$$('.sec-strips .strip, .sec-stripgrid .strip');for(let i=0;i<st.length;i++)await st[i].screenshot({path:`${__dirname}/shots/strip${i}.png`});}
await (await p.$('.sec-deleg')).screenshot({path:`${__dirname}/shots/deleg.png`});
for(const sel of ['notice','cafe-menu','vet-desk','salon-chair']){await p.locator(`.sec-close [data-hot="${sel}"]`).first().click({force:true})}
console.log((await p.textContent('#perf')).split('|').slice(-4).join('|'));
console.log(errs.join('\n')||'no console errors');await b.close()})();
