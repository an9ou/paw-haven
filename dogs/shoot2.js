const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1400,height:900}});
await p.goto('file://'+__dirname+'/gallery.html');await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(500);
const s=await p.$$('.sizes');for(let i=0;i<s.length;i++)await s[i].screenshot({path:`shots/s${i}.png`});
await p.screenshot({path:'shots/top.png'});
await b.close()})();
