const fs=require('fs'),vm=require('vm');const src=fs.readFileSync(__dirname+'/../pawart_world_a.js','utf8');
const sc=new vm.Script(src);const load=()=>{const ctx={window:{},Math,JSON,Set,performance};vm.createContext(ctx);sc.runInContext(ctx);return ctx.window.PawArt};
const run=(P,log)=>{const r=[];for(const t of ['dawn','day','dusk','night'])for(const w of ['sunny','cloudy','rain','snow']){for(const n of ['yard','market','shelter','map']){const a=performance.now();P.scene(n,{time:t,weather:w});r.push([n+' '+t+' '+w,performance.now()-a])}
  for(const n of ['park','river','woods','beach']){const a=performance.now();P.walkStrip(n,{time:t,weather:w});r.push(['strip '+n+' '+t+' '+w,performance.now()-a])}}
  if(log){r.sort((a,b)=>b[1]-a[1]);const avg=r.reduce((s,x)=>s+x[1],0)/r.length;console.log('warm avg',avg.toFixed(1),'ms; slowest:',r.slice(0,5).map(x=>x[0]+' '+x[1].toFixed(1)).join(' | '))}};
run(load(),false);run(load(),false);run(load(),true);
const P=load();let a=performance.now();P.scene('yard');console.log('default yard fresh',(performance.now()-a).toFixed(1));
