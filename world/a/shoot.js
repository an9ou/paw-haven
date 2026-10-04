const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1280,height:720}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+__dirname+'/gallery.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(600);
console.log(await p.textContent('#perf'));
await (await p.$('.bigmap')).screenshot({path:`${__dirname}/shots/bigmap.png`});await (await p.$('.bigcrop')).screenshot({path:`${__dirname}/shots/bigmap_crop.png`});
const v1=await p.$$('.sec-v131 .scene');for(let i=0;i<v1.length;i++)await v1[i].screenshot({path:`${__dirname}/shots/v131_${i}.png`});
for(const g of ['garden','kitchen'])await (await p.$('.sec-'+g+' .grid')).screenshot({path:`${__dirname}/shots/grid_${g}.png`});
await (await p.$('.sec-hot .hotrow')).screenshot({path:`${__dirname}/shots/hotspots.png`});
const vc=await p.$$('.sec-v13close .scene');for(let i=0;i<vc.length;i++)await vc[i].screenshot({path:`${__dirname}/shots/v13_${i}.png`});
await (await p.$('.sec-hubs .grid')).screenshot({path:`${__dirname}/shots/grid_hubs.png`});
const hc=await p.$$('.sec-hubclose .scene');for(let i=0;i<hc.length;i++)await hc[i].screenshot({path:`${__dirname}/shots/hub${i}.png`});
const cs=await p.$$('.sec-cleanstrips .strip');for(let i=0;i<cs.length;i++)await cs[i].screenshot({path:`${__dirname}/shots/clean${i}.png`});
for(const s of ['yard','market','shelter'])await (await p.$('.sec-'+s+' .grid')).screenshot({path:`${__dirname}/shots/grid_${s}.png`});
const st=await p.$$('.strip');for(let i=0;i<st.length;i++)await st[i].screenshot({path:`${__dirname}/shots/vstrip${i}.png`});
const sc=await p.$$('.sec-close .scene');for(let i=0;i<sc.length;i++)await sc[i].screenshot({path:`${__dirname}/shots/close${i}.png`});
await p.locator('.sec-close [data-shop="boutique"]').first().click({force:true});console.log(await p.textContent('#perf'));
for(const sel of ['[data-shop="sprout"]','[data-hot="garden"]','[data-hot="kitchen"]']){await p.locator('.sec-v13close '+sel+', .sec-hot '+sel).first().click({force:true});console.log(await p.textContent('#perf'))}
console.log(errs.join('\n')||'no console errors');await b.close()})();
