// node harness: default calls must match the v2 backup byte-for-byte; time all variants
const fs=require('fs'),vm=require('vm');
function load(f){const ctx={window:{},Math,JSON,Set,performance};vm.createContext(ctx);vm.runInContext(fs.readFileSync(f,'utf8'),ctx);return ctx.window.PawArt}
const A=load(__dirname+'/pawart_world_a_v3.js'),B=load(__dirname+'/../pawart_world_a.js');
const calls=[['scene','yard'],['scene','market'],['scene','shelter'],['scene','map',{}],['scene','map',{locked:['woods','beach']}],['walkStrip','park'],['walkStrip','river'],['walkStrip','woods'],['walkStrip','beach']];
let same=0;calls.forEach(([f,n,o])=>{const a=A[f](n,o),b=B[f](n,o);if(a===b)same++;else{let i=0;while(a[i]===b[i])i++;console.log('DIFF',f,n,i,a.slice(i-60,i+60),'\n  vs',b.slice(i-60,i+60))}});
console.log('identical defaults:',same,'/',calls.length);
const B2=load(__dirname+'/../pawart_world_a.js');let worst=0,tot=0,cnt=0,big=0;const rows=[];
for(const t of ['dawn','day','dusk','night'])for(const w of ['sunny','cloudy','rain','snow']){
  for(const n of ['yard','market','shelter','map','house','park','river','woods','beach']){const a=performance.now();const s=B2.scene(n,{time:t,weather:w,locked:n==='map'?['woods','beach']:undefined});const ms=performance.now()-a;worst=Math.max(worst,ms);tot+=ms;cnt++;big=Math.max(big,s.length);rows.push([n,t,w,ms.toFixed(1),(s.length/1024).toFixed(0)])}
  for(const n of ['park','river','woods','beach']){const a=performance.now();const s=B2.walkStrip(n,{time:t,weather:w});const ms=performance.now()-a;worst=Math.max(worst,ms);tot+=ms;cnt++;big=Math.max(big,s.length);rows.push(['strip '+n,t,w,ms.toFixed(1),(s.length/1024).toFixed(0)])}}
rows.sort((a,b)=>b[3]-a[3]);console.log('slowest:',rows.slice(0,6).map(r=>r.join(' ')).join(' | '));
console.log(`fresh renders: ${cnt}, avg ${(tot/cnt).toFixed(1)} ms, worst ${worst.toFixed(1)} ms, biggest ${(big/1024).toFixed(0)} KB`);
const a=performance.now();B2.scene('yard',{time:'night',weather:'snow'});console.log('cached call',(performance.now()-a).toFixed(2),'ms');
const s1=B2.scene('yard',{time:'night',weather:'rain'}),s2=B2.scene('yard',{time:'night',weather:'rain'});console.log('fresh ids differ:',s1!==s2,'unknown opts fallback eq default:',B2.scene('yard',{time:'noon',weather:'hail'}).replace(/pwa\d+x?\d*/g,'')===B2.scene('yard').replace(/pwa\d+x?\d*/g,''));
const bad=/Nintendo|Pok[eé]mon|Animal Crossing|filter/i;let hits=0;for(const t of ['dawn','night'])for(const w of ['rain','snow'])for(const n of ['yard','market','shelter','map','house','park','river','woods','beach'])if(bad.test(B2.scene(n,{time:t,weather:w})))hits++;console.log('banned/filter hits',hits);
