// usage: node shot.js url out.png w h [fullPage] [evalJS]
const {chromium}=require(require('path').join(require('child_process').execSync('npm root -g').toString().trim(),'playwright'));
(async()=>{const [url,out,w,h,full,js]=process.argv.slice(2);const b=await chromium.launch();const p=await b.newPage({viewport:{width:+w,height:+h},deviceScaleFactor:2});
p.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});p.on('pageerror',e=>console.log('PAGEERR',e.message));
await p.goto(url);await p.waitForTimeout(300);if(js){await p.evaluate(js);await p.waitForTimeout(400)}
await p.screenshot({path:out,fullPage:full==='1'});await b.close()})();
