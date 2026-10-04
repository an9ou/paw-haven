const {chromium}=require('/home/claude/.npm-global/lib/node_modules/playwright');
(async()=>{const [,,qs,out,w]=process.argv;
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const p=await b.newPage({viewport:{width:+w||1300,height:400}});p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto('file:///home/claude/proto/world/b/zoom.html?'+qs);await p.waitForTimeout(1200);
 await p.screenshot({path:out,fullPage:true});await b.close()})();
