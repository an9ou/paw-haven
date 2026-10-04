// v1.3: existing defaults must equal v4 backup except for appended hotspot / cart content (defs may only grow at the end)
const fs=require('fs'),vm=require('vm');
function load(f){const ctx={window:{},Math,JSON,Set,performance};vm.createContext(ctx);vm.runInContext(fs.readFileSync(f,'utf8'),ctx);return ctx.window.PawArt}
const A=load(__dirname+'/pawart_world_a_v4.js'),B=load(__dirname+'/../pawart_world_a.js');
const split=s=>{const a=s.indexOf('<defs>'),b=s.indexOf('</defs>');return[s.slice(0,a),s.slice(a+6,b),s.slice(b+7)]};
const calls=[['scene','yard'],['scene','market'],['scene','shelter'],['scene','map',{}],['scene','map',{locked:['woods','beach']}],['scene','house'],['scene','park'],['scene','river'],['scene','woods'],['scene','beach'],
 ['scene','yard',{time:'night',weather:'rain'}],['scene','market',{time:'dusk',weather:'snow'}],['scene','house',{time:'night',weather:'snow'}],['walkStrip','park'],['walkStrip','river'],['walkStrip','woods'],['walkStrip','beach']];
const norm=s=>{const m={};let i=0;return s.replace(/pwa\d+(x\d+)?/g,x=>m[x]||(m[x]='id'+(i++)))};
let ok=0;calls.forEach(([f,n,o])=>{const a=norm(A[f](n,o)),b=norm(B[f](n,o));if(a===b){ok++;return}
  const [ah,ad,ab]=split(a),[bh,bd,bb]=split(b);const tooth=ab.slice(ab.lastIndexOf('<rect'));
  const pre=ab.slice(0,ab.length-tooth.length);
  const good=ah===bh&&bd.startsWith(ad)&&bb.endsWith(tooth)&&bb.startsWith(pre.replace(/<g pointer-events="none">[\s\S]*$/,''));
  if(good){ok++;console.log('appended only:',n,JSON.stringify(o||{}),'+'+(b.length-a.length)+' chars')}else console.log('CHANGED',n,JSON.stringify(o||{}))});
console.log('ok',ok,'/',calls.length);
const hit=(s,attr)=>(s.match(new RegExp(`<g ${attr}="[a-z]+"[^>]*><path class="pa-wa-hit" d="[^"]+"`,'g'))||[]).map(x=>x.replace(/pwa\d+x?\d*/g,''));
for(const [n,at] of [['market','data-shop'],['map','data-area'],['yard','data-hot'],['house','data-hot']]){const a=hit(A.scene(n,{locked:n==='map'?['woods','beach']:undefined}),at),b=hit(B.scene(n,{locked:n==='map'?['woods','beach']:undefined}),at);console.log(n,at,'old',a.length,'new',b.length,'old shapes kept:',a.every(x=>b.includes(x)))}
const P=load(__dirname+'/../pawart_world_a.js');const r=[];for(const t of ['dawn','day','dusk','night'])for(const w of ['sunny','cloudy','rain','snow'])for(const n of ['garden','kitchen']){const a=performance.now();const s=P.scene(n,{time:t,weather:w});r.push([n+' '+t+' '+w,performance.now()-a,s.length])}
for(const p of ['empty','growing','ready']){const a=performance.now();P.scene('yard',{patch:p});r.push(['yard '+p,performance.now()-a,0])}
r.sort((a,b)=>b[1]-a[1]);console.log('slowest',r.slice(0,4).map(x=>x[0]+' '+x[1].toFixed(1)).join(' | '),'avg',(r.reduce((s,x)=>s+x[1],0)/r.length).toFixed(1),'max KB',(Math.max(...r.map(x=>x[2]))/1024).toFixed(0));
console.log('patch growing == default:',P.scene('yard',{patch:'growing'}).replace(/pwa\d+x?\d*/g,'')===P.scene('yard').replace(/pwa\d+x?\d*/g,''),'| empty differs:',P.scene('yard',{patch:'empty'}).length!==P.scene('yard').length);
