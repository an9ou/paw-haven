const {chromium}=require('/home/claude/.npm-global/lib/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium'});const p=await b.newPage();
 await p.goto('file:///home/claude/proto/world/b/gallery.html');await p.waitForTimeout(500);
 const r=await p.evaluate(()=>{const W=PawArt.WORLD_B,F={icon:W.icons,item:W.items,house:W.houses,collectible:W.collectibles,prop:W.props,obstacle:W.obstacles},T={};
  for(let rep=0;rep<7;rep++){PawArt._wbFlush();for(const f in F)F[f].forEach(n=>{const t0=performance.now();PawArt[f](n);(T[f+':'+n]=T[f+':'+n]||[]).push(performance.now()-t0)})}
  const med=a=>a.sort((x,y)=>x-y)[a.length>>1];const out={};for(const k in T){const f=k.split(':')[0];(out[f]=out[f]||[]).push([med(T[k]),k])}
  return Object.entries(out).map(([f,l])=>{l.sort((a,b)=>b[0]-a[0]);return `${f.padEnd(12)} median-avg ${(l.reduce((s,x)=>s+x[0],0)/l.length).toFixed(2)} ms, slowest ${l[0][0].toFixed(2)} ms (${l[0][1]}), 2nd ${l[1][0].toFixed(2)} (${l[1][1]})`}).join('\n')});
 console.log(r);await b.close()})();
