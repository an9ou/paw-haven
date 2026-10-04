const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});const p=await b.newPage({viewport:{width:1410,height:400}});
await p.addInitScript(`window.BDX=${process.argv[2]||'{}'}`);
await p.goto('file://'+__dirname+'/calib.html'+(process.argv[3]?'?k='+process.argv[3]:''));await p.waitForTimeout(400);await p.screenshot({path:__dirname+'/'+(process.argv[4]||'calib')+'.png',fullPage:true});await b.close();})();
