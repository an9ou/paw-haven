// loads world A, B, C in a fake window; renders every scene/strip variant, checks size, timing, determinism, delegation
const fs=require('fs'),vm=require('vm');
const src=['../pawart_world_a.js','../pawart_world_b.js','../pawart_world_c.js'].map(f=>fs.readFileSync(__dirname+'/'+f,'utf8'));
const load=()=>{const ctx={window:{},Math,JSON,Set,Map,performance,console};vm.createContext(ctx);src.forEach(s=>vm.runInContext(s,ctx));return ctx.window.PawArt};
const T=['dawn','day','dusk','night'],W=['sunny','cloudy','rain','snow'],S=['square','cafe','dogpark','vet','salon','hilltop','pier'],R=['town','hilltop','pier'];
const P=load();const rows=[];let maxKB=0,big='';
for(const n of S)for(const t of T)for(const w of W){const a=performance.now();const s=P.scene(n,{time:t,weather:w});const ms=performance.now()-a;rows.push([n+' '+t+' '+w,ms,s.length]);if(s.length>maxKB*1024){maxKB=s.length/1024;big=n+' '+t+' '+w}}
for(const n of R)for(const t of T)for(const w of W){const a=performance.now();const s=P.walkStrip(n,{time:t,weather:w});const ms=performance.now()-a;rows.push(['strip '+n+' '+t+' '+w,ms,s.length]);if(s.length>maxKB*1024){maxKB=s.length/1024;big='strip '+n+' '+t+' '+w}}
rows.sort((a,b)=>b[1]-a[1]);const avg=rows.reduce((s,r)=>s+r[1],0)/rows.length;
console.log('fresh renders:',rows.length,'avg',avg.toFixed(1),'ms; slowest',rows.slice(0,4).map(r=>r[0]+' '+r[1].toFixed(1)).join(' | '));
console.log('largest SVG',maxKB.toFixed(0),'KB ('+big+')');
// warm JIT timing on a second instance
const P2=load();for(const n of S)P2.scene(n,{time:'dusk',weather:'cloudy'});const t2=[];for(const n of S){const a=performance.now();P2.scene(n,{time:'night',weather:'rain'});t2.push(n+' '+(performance.now()-a).toFixed(1))}console.log('warm fresh (night rain):',t2.join(', '));
const t3=[];for(const n of R){const a=performance.now();P2.walkStrip(n,{time:'night',weather:'snow'});t3.push(n+' '+(performance.now()-a).toFixed(1))}console.log('warm fresh strips (night snow):',t3.join(', '));
// cache hit
let a=performance.now();for(let i=0;i<50;i++)P2.scene('square');console.log('cached call avg',((performance.now()-a)/50).toFixed(2),'ms');
// determinism (strip ids) across fresh loads
const norm=s=>s.replace(/pwc\d+(x\d+)?/g,'ID');const P3=load(),P4=load();let det=true;for(const n of S)if(norm(P3.scene(n,{time:'night',weather:'snow'}))!==norm(P4.scene(n,{time:'night',weather:'snow'})))det=false;for(const n of R)if(norm(P3.walkStrip(n,{weather:'rain'}))!==norm(P4.walkStrip(n,{weather:'rain'})))det=false;console.log('deterministic:',det);
// unique ids per call
const s1=P3.scene('cafe'),s2=P3.scene('cafe');const ids=x=>new Set((x.match(/id="([^"]+)"/g)||[]));const i1=ids(s1),i2=ids(s2);let clash=0;i1.forEach(i=>{if(i2.has(i))clash++});console.log('id clashes between two calls:',clash,'ids/call',i1.size);
// hotspots
console.log('hotspots:',['square','cafe','vet','salon'].map(n=>n+':'+((P3.scene(n).match(/data-hot="([^"]+)"/)||[])[1])).join(' '));
// delegation
const y=P3.scene('yard'),pk=P3.scene('park'),ws=P3.walkStrip('park'),ic=P3.icon?P3.icon('cafe'):'';console.log('delegation: yard',/pa-wa-yard/.test(y),'park',/pa-wa-park/.test(pk),'strip park',/pa-wa-strip-park/.test(ws),'icon',ic.length>0);
// no filters, no forbidden words, no falling particles markers
const all=S.map(n=>P3.scene(n,{weather:'rain'})).join('')+R.map(n=>P3.walkStrip(n,{weather:'snow'})).join('');console.log('filters:',/<filter/.test(all),'forbidden words:',/nintendo|pok[eé]mon|animal crossing/i.test(fs.readFileSync(__dirname+'/../pawart_world_c.js','utf8')));
