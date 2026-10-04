const {chromium}=require('/home/claude/.npm-global/lib/node_modules/playwright');
(async()=>{
 const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});
 const p=await b.newPage({viewport:{width:1280,height:900},deviceScaleFactor:+(process.argv[2]||1.5)});
 p.on('pageerror',e=>console.log('ERR',e.message));p.on('console',m=>{if(m.type()==='error')console.log('console:',m.text())});
 await p.goto('file:///home/claude/proto/world/b/gallery.html');await p.waitForTimeout(1500);
 console.log(await p.evaluate(()=>window.__timing+'\nmissing:'+JSON.stringify(window.__missing)));
 const secs=['#tricks','#cafe','#beds','#potty','#v13items','#crops','#plots','#kprops','#bowls','#obs','#wide','#icons','#items','#treasure','#tornmap','#houses','#cols','#props','#chrome'];
 for(const s of secs){const e=await p.$(s);await e.screenshot({path:'/home/claude/proto/world/b/shot_'+s.slice(1)+'.png'})}
 const sz=await p.evaluate(()=>Object.entries(window.__TM).sort((a,b)=>b[1][1]-a[1][1]).slice(0,6).map(e=>e[0]+' '+e[1][1]));console.log(sz.join('\n'));
 await b.close();})();
