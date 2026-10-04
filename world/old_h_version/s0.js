const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:1300,height:900}});
await p.goto('file:///home/claude/art/paw_haven_style_study.html');await p.waitForTimeout(1500);
await p.screenshot({path:'ref_full.png',fullPage:true});
const t=await p.evaluate(()=>document.body.scrollHeight);console.log(t);await b.close()})();
