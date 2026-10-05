// Playwright contact sheet for the v2 world art: node world/b/shoot_v2.js  (NODE_PATH=$(npm root -g))
const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME||'/opt/pw-browsers/chromium'});const p=await b.newPage({viewport:{width:1540,height:900}});
const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('file://'+__dirname+'/contact_v2.html');await p.evaluate(()=>document.fonts.ready).catch(()=>{});await p.waitForTimeout(600);
await (await p.$('main')).screenshot({path:__dirname+'/contact_v2.png'});
console.log(errs.join('\n')||'no console errors');await b.close()})();
