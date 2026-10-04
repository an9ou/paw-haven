// median fresh-render time per scene/strip: each sample is a fresh module load (empty cache), JIT warmed on other variants first
const fs=require('fs'),vm=require('vm');const src=['../pawart_world_a.js','../pawart_world_b.js','../pawart_world_c.js'].map(f=>new vm.Script(fs.readFileSync(__dirname+'/'+f,'utf8')));
const load=()=>{const ctx={window:{},Math,JSON,Set,Map,performance,console};vm.createContext(ctx);src.forEach(s=>s.runInContext(ctx));return ctx.window.PawArt};
const S=['square','cafe','dogpark','vet','salon','hilltop','pier'],R=['town','hilltop','pier'];
{const P=load();for(const t of ['dawn','day','dusk'])for(const n of S)P.scene(n,{time:t,weather:'cloudy'});for(const n of R)P.walkStrip(n,{time:'dusk'})}
const med=a=>{a.sort((x,y)=>x-y);return a[a.length>>1]};const out=[],all=[];
for(const [kind,list] of [['scene',S],['strip',R]])for(const n of list){const ts=[];for(let i=0;i<7;i++){const P=load();const a=performance.now();kind==='scene'?P.scene(n,{time:'night',weather:['rain','snow','sunny','cloudy'][i%4]}):P.walkStrip(n,{time:'night',weather:['rain','snow','sunny','cloudy'][i%4]});ts.push(performance.now()-a)}const m=med(ts);all.push(m);out.push((kind==='strip'?'strip ':'')+n+' '+m.toFixed(1))}
console.log('median fresh ms (night variants):',out.join(', '),'| mean',(all.reduce((a,b)=>a+b,0)/all.length).toFixed(1));
