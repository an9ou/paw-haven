const {chromium}=require('playwright');
(async()=>{const [,,file,out,w,h,sel]=process.argv;const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
const p=await b.newPage({viewport:{width:+w||1400,height:+h||900}});
const errs=[];p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push('PAGEERR '+e.message));
await p.goto('file:///home/claude/proto/world/'+file);await p.waitForTimeout(500);
if(sel){const e=await p.$(sel);await e.screenshot({path:out})}else await p.screenshot({path:out,fullPage:true});
console.log(errs.join('\n')||'ok');await b.close()})();
