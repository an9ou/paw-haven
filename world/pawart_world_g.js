/* Doodle Doggo world art, module G (v2.15 "Around Town", V215.md sections 2, 5, 6, 8.2, 12). Loads AFTER worlds A to E (and F when present).
   Wraps PawArt.scene and PawArt.walkStrip: the names this module owns are drawn here, every other name goes to the previous function.
   Scenes (viewBox 0 0 W 600, the world C options time, weather, season, halloween, lights, newyear, jp, plus snow: true = snowy weather):
     training   1600 wide. The Training Ground: a sandy oval arena with a rope fence, blue bunting, a scoreboard and a rosette flag. The five
                obstacles are floor props: weave poles, the pause table, the blue tunnel, the jump bar and the tyre (data-prop weave | table |
                tunnel | jump | tyre), plus the trick stage, a water bowl and a shade tree.
     pool       1600 wide. The Splash Pool: a turquoise shallow kidney pool on white tiles, a wide step, a wooden ramp, a ring float, the
                lifeguard chair, a life vest on a hook, a sprinkler and a parasol. No deep end. Winter: the striped Winter Dome tent over the pool.
     boutique   1000 wide. Bow-Wow Boutique: a tall lilac shop, a scalloped pink roof, a huge bow on top, a dog mannequin in the window.
     builder    1000 wide. Barkitecture: a wooden workshop with a saw-tooth roof, a giant hammer on top, planks, a half-built dog house.
     sprout     1000 wide. Pip's Sprout Cart: a mint cart on two big wheels, a green striped canopy, seed packets, a sunflower pot.
                Each storefront has a deep pavement and a door hot spot data-shop="<boutique | builder | sprout>" (the keys openShop() takes).
     sunflower, bamboo, cliffs  1600 wide trailheads with a checkered start arch whose gate is data-hot="run". The cliffs path stays well
                inside a rope fence, far from the edge.
   Every scene puts its floor props in <g id="floorG">, one <g data-fy="<base y>" data-prop="<id>"> each (sorted by base y), so the roam
   engine can sort the dogs among them. PawArt.FLOOR[name] = { w, back, front, kB, kF, poly, props: [{ id, base, box }], spots: [{ id, x, y,
   tags, act, path }] } describes the walkable floor (box [x, y, w, h] = the feet no-go box, null for a prop a dog may stand on).
   Walk strips: PawArt.walkStrip('sunflower' | 'bamboo' | 'cliffs') 1200 x 400, ground y 330, seamless (the world C conventions).
   No text in the art; the aria labels are English and the game may pass { aria, ariaMap } (the v2.14 layer, applied here too).
   The pencil kit, paper, palette, sky and time/weather/season/festival helpers are copied from world E (which copied world C), ids prefixed
   mg-. Fuji comes from world C (PawArt.JP.fuji). No filters. */
window.PawArt = window.PawArt || {};
(function(){
'use strict';
'use strict';
/* ===== helpers copied from world E (pawart_world_e.js, which copied world C), ids prefixed mg- ===== */
const PA=window.PawArt;
const C={ink:'#5B3D32',graph:'#A8968A',paper:'#FFFBF3',dot:'#E3D2BA',pink:'#F28FA5',
  sky:'#D3E9F6',sky2:'#E6F2F8',cloud:'#FFFFFF',sun:'#FDE49A',grass:'#CBE5A6',grass2:'#B4D98E',grassD:'#93C276',
  leaf:'#B9DD92',leaf2:'#9ACD7C',leafD:'#7FB86A',pine:'#8CC09A',pineD:'#6FA483',trunk:'#C9A07A',trunkD:'#A97E5A',
  wood:'#EBCDA4',woodD:'#CFA77C',roof:'#EBA48C',roofD:'#D88870',wall:'#FCE6CC',wall2:'#F9D9DE',wall3:'#D9E9F7',wall4:'#DDEFD8',
  stone:'#DED6CC',stoneD:'#C7BCAE',path:'#EFDDBA',soil:'#D9B48E',water:'#BEE0F2',waterD:'#9CCDE8',sand:'#F7E4B5',sandD:'#EBCF95',
  red:'#F4A3A3',redD:'#E57E83',yellow:'#FCE59A',orange:'#F8C08A',lav:'#DCCBF2',mint:'#C9EBDA',blue:'#B9D3F2',white:'#FFFFFF',glass:'#E4F2FA'};
let _n=0;const uid=()=>'mg-'+(++_n);
let _un=0;const unlitId=()=>'mg-0'+(++_un);// its own counter (mg-0N never meets uid()'s mg-N: no leading zero there)
const TIMES=['dawn','day','dusk','night'],WEATHERS=['sunny','cloudy','rain','snow'],SEASONS=['spring','summer','autumn','winter'];
function mkEnv(o){o=o||{};const time=TIMES.includes(o.time)?o.time:'day',weather=WEATHERS.includes(o.weather)?o.weather:'sunny',season=SEASONS.includes(o.season)?o.season:'summer';
  return {time,weather,season,ssn:season==='summer'?'':season,def:time==='day'&&weather==='sunny'&&season==='summer',night:time==='night',low:time==='dawn'||time==='dusk',sunny:weather==='sunny',
    rain:weather==='rain',snow:weather==='snow',lit:time==='night'?1:time==='dusk'?.55:0,hw:o.halloween===true,
    lt:o.lights===true,ny:o.newyear===true,jp:o.jp===true}}// v2.8: Winter Lights, New Year, the Japan scenery (V28 sections 5, 12)
const DEF_ENV=mkEnv({});
const HEXRE=/#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
const h2c=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const c2h=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();
const mixH=(a,b,t)=>{const A=h2c(a),B=h2c(b);return c2h(A.map((v,i)=>v+(B[i]-v)*t))};
const R1=n=>Math.round(n*10)/10;
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hashS=s=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const E=(cx,cy,rx,ry,n=14,rot=0)=>{const p=[],c=Math.cos(rot),s=Math.sin(rot);for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=Math.cos(a)*rx,y=Math.sin(a)*ry;p.push([cx+x*c-y*s,cy+x*s+y*c])}return p};
const RC=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const blobP=(cx,cy,rx,ry,r,n=9,v=.22)=>{const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,k=1-v/2+r()*v;p.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k])}return p};
function dense(pts,closed,step){
  const out=[],n=pts.length,m=closed?n:n-1;
  for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n],k=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/step));
    for(let j=0;j<k;j++)out.push([a[0]+(b[0]-a[0])*j/k,a[1]+(b[1]-a[1])*j/k])}
  if(!closed)out.push(pts[n-1]);
  return out;
}
// smooth path through points (midpoint quadratic), closed or open
function smooth(P,closed){
  const n=P.length;if(n<2)return'';
  if(!closed){let d=`M${R1(P[0][0])} ${R1(P[0][1])}`;for(let i=1;i<n-1;i++){d+=`Q${R1(P[i][0])} ${R1(P[i][1])} ${R1((P[i][0]+P[i+1][0])/2)} ${R1((P[i][1]+P[i+1][1])/2)}`}return d+`L${R1(P[n-1][0])} ${R1(P[n-1][1])}`}
  const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];let s=m(P[n-1],P[0]),d=`M${R1(s[0])} ${R1(s[1])}`;
  for(let i=0;i<n;i++){const q=m(P[i],P[(i+1)%n]);d+=`Q${R1(P[i][0])} ${R1(P[i][1])} ${R1(q[0])} ${R1(q[1])}`}
  return d+'Z';
}

/* ---------- the pencil kit ---------- */
// 25 Oct 2026: a closed outline P pulled in by dd (each point along its corner's inward normal; small shapes are pulled in less, so they never turn inside out)
function fillIn(P,dd,G){const n=P.length;if(n<3)return P;let a=0,x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;P.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});
  G=G&&G.length>2?G:P;G.forEach((p,i)=>{const q=G[(i+1)%G.length];a+=p[0]*q[1]-q[0]*p[1]});const sg=a>0?1:-1;dd=Math.min(dd,Math.min(x1-x0,y1-y0)/4);// which way is in: from the drawn points G (a smooth curve can loop past a thin shape's ends)
  return P.map((p,i)=>{const A=P[(i+n-1)%n],C=P[(i+1)%n],l1=Math.hypot(p[0]-A[0],p[1]-A[1])||1,l2=Math.hypot(C[0]-p[0],C[1]-p[1])||1;
    const nx=-((p[1]-A[1])/l1+(C[1]-p[1])/l2)*sg,ny=((p[0]-A[0])/l1+(C[0]-p[0])/l2)*sg,m=Math.hypot(nx,ny)||1;return[p[0]+nx/m*dd,p[1]+ny/m*dd]})}
function kit(seed){
  // two seeded streams: the main one draws the base scene, the side one draws time/weather extras,
  // so every variant keeps exactly the same base layout (and day+sunny is byte-identical to before)
  let cur=rng(seed);const sideR=rng((seed^0x5bd1e995)>>>0),seaR=rng((seed^0x2f6b8d3c)>>>0),hwR=rng((seed^0x6c8e9cf5)>>>0),
    ltR=rng((seed^0x3c6ef372)>>>0),nyR=rng((seed^0x1b873593)>>>0),jpR=rng((seed^0x7f4a7c15)>>>0);
  const r=()=>cur(),out=[],defs=[],J=a=>(r()-.5)*2*a;
  const k={r,J,out,defs,env:DEF_ENV,defs2:[],sky:[],top:[],glows:[],lamps:[],bulbs:[],glints:[],flies:[],rc:null,
    side(fn){const sv=cur;cur=sideR;try{return fn()}finally{cur=sv}},
    R(s){return k.rc?s.replace(HEXRE,k.rc):s},
    // default sky code runs as before; in a variant it still runs (discarded, keeps the stream) and the variant sky is drawn instead
    skyD(fn,cfg){if(k.env.def)fn();else{k.cap(fn);drawSky(k,cfg)}},
    fx(fn){if(!k.env.def)k.side(fn)},
    // v2.5: season extras run on their own stream, and only in spring, autumn and winter (k.so: the season of outdoor things)
    so:'',ss(fn){if(!k.env.ssn)return;const sv=cur;cur=seaR;try{return fn()}finally{cur=sv}},
    // v2.6: Halloween dressing runs on a fourth stream, only when env.hw (k.hwl: its glows, drawn over the treated art)
    hwl:[],hw(fn){if(!k.env.hw)return;const sv=cur;cur=hwR;try{return fn()}finally{cur=sv}},
    // v2.8: Winter Lights (k.lt), New Year (k.ny) and the Japan scenery (k.jp) each run on their own stream, only with their env flag, so every
    // render without the flag stays byte-identical. k.wl: their glows, drawn over the treated art at dusk and night. k.own: a stream of its own (Mt. Fuji Lookout)
    wl:[],lt(fn){if(!k.env.lt)return;const sv=cur;cur=ltR;try{return fn()}finally{cur=sv}},ny(fn){if(!k.env.ny)return;const sv=cur;cur=nyR;try{return fn()}finally{cur=sv}},
    jp(fn){if(!k.env.jp)return;const sv=cur;cur=jpR;try{return fn()}finally{cur=sv}},own(r2,fn){const sv=cur;cur=r2;try{return fn()}finally{cur=sv}},
    add(s){out.push(s)},
    // one pencil pass as a filled ribbon: wobble, tapered ends, heavier where the form faces down
    pen(pts,closed,o={}){
      const P=dense(pts,closed,o.step||7),n=P.length;if(n<2)return;
      const w0=o.w||2.2,wk=o.wk??.8,amp=o.amp??.8,col=o.col||C.ink;
      let sg=1;if(closed){let a=0;for(let i=0;i<n;i++){const q=P[(i+1)%n];a+=P[i][0]*q[1]-q[0]*P[i][1]}sg=a>0?1:-1}
      const runs=[];
      if(closed&&!o.one&&n>8){const s0=Math.floor(r()*n),sp=Math.floor(n*(.42+r()*.2)),gp=r()<.3?1:-1-Math.round(r());runs.push([s0,s0+sp],[s0+sp+gp,s0+n+Math.round(r()*2)])}
      else runs.push([0,closed?n:n-1]);
      let d='';
      runs.forEach(([a,b])=>{
        const pts2=[];for(let i=a;i<=b;i++)pts2.push(closed?P[((i%n)+n)%n]:P[Math.max(0,Math.min(n-1,i))]);
        const m=pts2.length;if(m<2)return;let vx=J(amp*.5),vy=J(amp*.5),wn=0;const L=[],Rt=[];
        for(let i=0;i<m;i++){
          vx=vx*.85+J(amp*.25);vy=vy*.85+J(amp*.25);wn=wn*.8+J(.14);
          const p0=pts2[Math.max(0,i-1)],p1=pts2[Math.min(m-1,i+1)];let tx=p1[0]-p0[0],ty=p1[1]-p0[1];const tl=Math.hypot(tx,ty)||1;tx/=tl;ty/=tl;
          const nx=ty*sg,ny=-tx*sg,t=i/(m-1),e=Math.min(t,1-t)/(o.tap??.15),tp=e>=1?1:.2+.8*Math.sin(e*Math.PI/2);
          const w=Math.max(.3,w0*(1+(closed?wk*Math.max(0,ny):0)+wn)*tp)/2,x=pts2[i][0]+vx,y=pts2[i][1]+vy;
          L.push([x+nx*w,y+ny*w]);Rt.push([x-nx*w,y-ny*w]);
        }
        d+=smooth(L.concat(Rt.reverse()),true);
      });
      out.push(`<path d="${d}" fill="${col}"${o.op?` opacity="${o.op}"`:''}/>`);
    },
    // coloured-pencil fill. 25 Oct 2026 (owner: every colour fill stays inside its outline): it no longer drifts off (dx, dy, sc are still drawn
    // from the stream, so nothing else moves). Under a pencil outline (ins: half the line width, from shape()) it is pulled in to the line's inner edge
    // and keeps still; a fill with no outline keeps its little wobble, on the spot.
    fill(pts,col,o={},ins=0){
      const P=dense(pts,true,o.step||14);if(o.dx==null)r();if(o.dy==null)r();if(o.sc==null)r();const amp=o.amp??1.3,In=ins?fillIn(P,ins):null;let vx=0,vy=0;
      const W=P.map((q,i)=>{vx=vx*.7+J(amp*.6);vy=vy*.7+J(amp*.6);return In?In[i]:[q[0]+vx,q[1]+vy]});
      const d=smooth(W,true);out.push(`<path d="${d}" fill="${col}"${o.op!=null?` fill-opacity="${o.op}"`:''}/>`);return d;
    },
    shape(pts,col,o={}){let d=null;if(col)d=k.fill(pts,col,o,o.noline?0:(o.w||2.2)*.5);if(o.hatch)k.hatch(pts,o.hatch);if(!o.noline)k.pen(pts,true,{w:o.w,wk:o.wk,amp:o.pamp,col:o.lcol,one:o.one,op:o.lop});return d},
    // cheap wobbly stroke for details
    line(pts,w=1.4,col=C.ink,o={}){const P=dense(pts,false,o.step||8).map((q,i,a)=>i===0||i===a.length-1?[q[0]+J(.4),q[1]+J(.4)]:[q[0]+J(o.amp??.7),q[1]+J(o.amp??.7)]);out.push(`<path d="${smooth(P,false)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o.op?` opacity="${o.op}"`:''}${o.dash?` stroke-dasharray="${o.dash}"`:''}/>`)},
    // diagonal hatching clipped to a region, only in the lower-right ("shadow") part when o.side
    hatch(pts,o={}){
      const id=uid(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),h=y1-y0,gap=o.gap||4.5;
      defs.push(`<clipPath id="${id}"><path d="${smooth(dense(pts,true,20),true)}"/></clipPath>`);
      let d='';const sx=o.side?x0+(x1-x0)*(o.side):x0-h*.6;
      for(let x=sx;x<x1+4;x+=gap){d+=`M${R1(x+J(1))} ${R1(y1+3)}L${R1(x+h*.6+J(1))} ${R1(y0-3)}`}
      out.push(`<path d="${d}" clip-path="url(#${id})" fill="none" stroke="${o.col||C.ink}" stroke-width="${o.w||1.1}" stroke-opacity="${o.op??.35}" stroke-linecap="round"/>`);
    },
    text(s,x,y,size,o={}){out.push(`<text x="${R1(x)}" y="${R1(y)}"${o.rot?` transform="rotate(${o.rot} ${R1(x)} ${R1(y)})"`:''} font-family="'Caveat',cursive" font-size="${size}" font-weight="${o.wt||700}" fill="${o.col||C.ink}"${o.halo?` stroke="${o.halo}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"`:''} text-anchor="${o.anchor||'middle'}"${o.ls?` letter-spacing="${o.ls}"`:''}>${s}</text>`)},
    // capture output of fn into a string (for wrapping copies in strips)
    cap(fn){const a=out.length;fn();return out.splice(a).join('')}
  };
  return k;
}
/* ---------- paper ---------- */
function paperDefs(k,W,H){
  const g=uid(),t=uid(),r=rng(99);
  let sp='';for(let i=0;i<70;i++){const x=r()*60,y=r()*60,rr=.35+r()*.9;sp+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(rr)}" fill="${r()<.72?'#FFFFFF':'#B9A58F'}" opacity="${R1(.25+r()*.45)}"/>`}
  k.defs.push(`<pattern id="${g}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.1" fill="${C.dot}"/></pattern><pattern id="${t}" width="60" height="60" patternUnits="userSpaceOnUse">${sp}</pattern>`);
  return {bg:`<rect width="${W}" height="${H}" fill="${C.paper}"/><rect width="${W}" height="${H}" fill="url(#${g})"/>`,tooth:`<rect width="${W}" height="${H}" fill="url(#${t})" pointer-events="none"/>`};
}

/* ---------- doodle objects ---------- */
const O={
 sparkle(k,x,y,s,col=C.yellow){const q=s*.16;k.add(`<path d="M${x} ${y-s}Q${x+q} ${y-q} ${x+s*.9} ${y}Q${x+q} ${y+q} ${x} ${y+s}Q${x-q} ${y+q} ${x-s*.9} ${y}Q${x-q} ${y-q} ${x} ${y-s}Z" fill="${col}" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>`)},
 heart(k,x,y,s,col=C.pink){k.add(`<path d="M${x} ${y+s*.9}C${x-s*1.5} ${y} ${x-s*.75} ${y-s*1.25} ${x} ${y-s*.38}C${x+s*.75} ${y-s*1.25} ${x+s*1.5} ${y} ${x} ${y+s*.9}Z" fill="${col}" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>`)},
 note(k,x,y,s){k.add(`<ellipse cx="${x}" cy="${y}" rx="${s*.36}" ry="${s*.27}" transform="rotate(-22 ${x} ${y})" fill="${C.ink}"/><path d="M${R1(x+s*.32)} ${R1(y-s*.08)}V${R1(y-s*1.2)}q${R1(s*.3)} ${R1(s*.2)} ${R1(s*.44)} ${R1(s*.55)}" fill="none" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>`)},
 tape(k,x,y,w,ang,col){const h=22,z=[];for(let i=0;i<=5;i++)z.push(`${i%2?3:0} ${R1(h/5)}`);k.add(`<g transform="translate(${x} ${y}) rotate(${ang})"><path d="M0 0l${-3} ${h/5}l3 ${h/5}l-3 ${h/5}l3 ${h/5}l-3 ${h/5}H${w}l3 ${-h/5}l-3 ${-h/5}l3 ${-h/5}l-3 ${-h/5}l3 ${-h/5}Z" fill="${col}" fill-opacity=".78"/><path d="M4 6H${w-4}M4 16H${w-4}" stroke="#fff" stroke-opacity=".6" stroke-width="2.2" stroke-dasharray="6 5"/></g>`)},
 cloud(k,x,y,s){const p=[];for(let i=0;i<7;i++){const a=Math.PI+i/6*Math.PI;p.push([x+Math.cos(a)*s*1.6,y+Math.sin(a)*s*(i%2?1.05:.8)])}p.push([x+s*1.5,y+s*.25],[x-s*1.5,y+s*.25]);k.shape(p,C.cloud,{w:1.8});k.line([[x-s*.9,y-s*.15],[x-s*.5,y-s*.45]],1.2,C.graph,{op:.7})},
 sun(k,x,y,rad,col=C.sun){k.shape(E(x,y,rad,rad,14),col,{w:2});for(let i=0;i<10;i++){const a=i/10*Math.PI*2+.15;k.line([[x+Math.cos(a)*(rad+7),y+Math.sin(a)*(rad+7)],[x+Math.cos(a)*(rad+17+(i%2)*6),y+Math.sin(a)*(rad+17+(i%2)*6)]],2,C.ink)}
   k.add(`<path d="M${x-rad*.35} ${y-rad*.1}q3 -4 6 0M${x+rad*.15} ${y-rad*.1}q3 -4 6 0M${x-rad*.2} ${y+rad*.25}q${rad*.2} ${rad*.2} ${rad*.4} 0" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`);
   k.add(`<ellipse cx="${x-rad*.5}" cy="${y+rad*.2}" rx="5" ry="3" fill="${C.pink}" opacity=".6"/><ellipse cx="${x+rad*.5}" cy="${y+rad*.2}" rx="5" ry="3" fill="${C.pink}" opacity=".6"/>`)},
 bird(k,x,y,s){k.line([[x-s,y-s*.3],[x-s*.4,y-s*.5],[x,y]],1.6);k.line([[x,y],[x+s*.4,y-s*.5],[x+s,y-s*.3]],1.6)},
 tuft(k,x,y,s=1,col=C.grassD){k.add(`<path d="M${R1(x-6*s)} ${y}q${R1(1*s)} ${R1(-7*s)} ${R1(-1*s)} ${R1(-12*s)}M${R1(x)} ${y}q${R1(-1*s)} ${R1(-9*s)} ${R1(2*s)} ${R1(-15*s)}M${R1(x+6*s)} ${y}q${R1(1*s)} ${R1(-6*s)} ${R1(4*s)} ${R1(-10*s)}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`)},
 flower(k,x,y,s,col){if(k.so==='winter'){k.cap(()=>{k.line([[x,y+s*2.6],[x+k.J(1),y]],1.4,'#7DAE66')});k.ss(()=>winterFlower(k,x,y,s));return}if(k.so==='autumn')col=AUF[col]||col;
   k.line([[x,y+s*2.6],[x+k.J(1),y]],1.4,'#7DAE66');for(let i=0;i<5;i++){const a=i/5*Math.PI*2;k.add(`<circle cx="${R1(x+Math.cos(a)*s)}" cy="${R1(y+Math.sin(a)*s)}" r="${R1(s*.62)}" fill="${col}" stroke="${C.ink}" stroke-width="1"/>`)}k.add(`<circle cx="${x}" cy="${y}" r="${R1(s*.5)}" fill="#F7C65E" stroke="${C.ink}" stroke-width="1"/>`)},
 leafy(k,cx,cy,rx,ry,col,colD){// a scribbled leaf cluster: lumpy canopy, little "c" leaf marks, hatched underside
   const p=[];const n=11;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,kk=i%2?1.06:.9+k.r()*.06;p.push([cx+Math.cos(a)*rx*kk,cy+Math.sin(a)*ry*kk])}
   k.fill(p,col);k.hatch(p,{side:.35,gap:5,col:colD,op:.55,w:1.3});k.pen(p,true,{w:2.1});
   let d='';for(let i=0;i<Math.round(rx*ry/260);i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r())*.75,x=cx+Math.cos(a)*rx*rr,y=cy+Math.sin(a)*ry*rr;d+=`M${R1(x)} ${R1(y)}q3 -4 7 -1`}
   k.add(`<path d="${d}" fill="none" stroke="${colD}" stroke-width="1.4" stroke-linecap="round"/>`);
   if(k.env.snow)k.side(()=>{const q=[];for(let i=0;i<=8;i++){const a=Math.PI*1.12+i/8*Math.PI*.76;q.push([cx+Math.cos(a)*rx*1.02,cy+Math.sin(a)*ry*1.04])}capLine(k,q,Math.max(4,ry*.28))})},
 tree(k,x,gy,s=1,o={}){const col=o.col||C.leaf,colD=o.colD||C.leafD,so=k.so,cs=crownCols(k,col,colD,x,gy);
   const tw=14*s,th=70*s;k.shape([[x-tw*.6,gy],[x-tw*.45,gy-th],[x+tw*.45,gy-th],[x+tw*.7,gy]],C.trunk,{hatch:{side:.5,gap:3.5,col:C.trunkD,op:.6}});
   k.line([[x-2*s,gy-10*s],[x-1*s,gy-30*s],[x-3*s,gy-50*s]],1.2,C.trunkD);k.line([[x+3*s,gy-20*s],[x+4*s,gy-40*s]],1.2,C.trunkD);
   const crown=()=>{O.leafy(k,x-26*s,gy-th-8*s,34*s,28*s,cs[0][0],cs[0][1]);O.leafy(k,x+26*s,gy-th-4*s,32*s,26*s,cs[1][0],cs[1][1]);O.leafy(k,x,gy-th-36*s,40*s,34*s,cs[2][0],cs[2][1])};
   const fruit=()=>{if(o.fruit)for(let i=0;i<5;i++)k.add(`<circle cx="${R1(x+(k.r()-.5)*70*s)}" cy="${R1(gy-th-20*s+(k.r()-.5)*40*s)}" r="${R1(3.6*s)}" fill="${o.fruit}" stroke="${C.ink}" stroke-width="1.2"/>`)};
   // v2.5: winter keeps the stream but draws bare limbs, spring trades the fruit for blossom (the maples stay plain green)
   if(so==='winter'){k.cap(crown);k.cap(fruit);k.ss(()=>bareCrown(k,x,gy,s))}else if(so==='spring'){crown();k.cap(fruit);if(!MAPLE[col])k.ss(()=>blossom(k,x,gy,s))}else{crown();fruit()}},
 pine(k,x,gy,s=1,col=C.pine,colD=C.pineD){k.shape([[x-6*s,gy],[x-5*s,gy-30*s],[x+5*s,gy-30*s],[x+6*s,gy]],C.trunkD,{w:1.8});
   [[0,1],[1,.78],[2,.56]].forEach(([i,f])=>{const yb=gy-24*s-i*34*s,w=46*s*f,h=54*s;const p=[[x-w,yb],[x-w*.4,yb-h*.35],[x-w*.66,yb-h*.38],[x,yb-h],[x+w*.66,yb-h*.38],[x+w*.4,yb-h*.35],[x+w,yb]];k.fill(p,col);k.hatch(p,{side:.5,gap:4.5,col:colD,op:.6,w:1.2});k.pen(p,true,{w:2});
     if(k.env.snow)k.side(()=>{capLine(k,[[x-w*.32,yb-h*.71],[x,yb-h],[x+w*.32,yb-h*.71]],6*s);capLine(k,[[x-w,yb],[x-w*.42,yb-h*.34]],3.5*s);capLine(k,[[x+w*.42,yb-h*.34],[x+w,yb]],3.5*s)})})},
 bush(k,x,gy,s=1,col=C.leaf2,colD=C.leafD,berries){if(k.so==='autumn'){col='#C9C27A';colD='#9F9A54'}else if(k.so==='winter'){col='#A3B293';colD='#7F8F74'}const p=[];for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI;p.push([x+Math.cos(a)*40*s,gy+Math.sin(a)*(i%2?30:24)*s])}k.shape(p,col,{hatch:{side:.45,gap:4.5,col:colD,op:.5}});
   let d='';for(let i=0;i<6;i++)d+=`M${R1(x+(k.r()-.5)*56*s)} ${R1(gy-6*s-k.r()*18*s)}q3 -4 7 -1`;k.add(`<path d="${d}" fill="none" stroke="${colD}" stroke-width="1.3" stroke-linecap="round"/>`);
   if(berries)for(let i=0;i<4;i++)k.add(`<circle cx="${R1(x+(k.r()-.5)*50*s)}" cy="${R1(gy-8*s-k.r()*16*s)}" r="${R1(3*s)}" fill="${berries}" stroke="${C.ink}" stroke-width="1"/>`);
   if(k.so==='spring')k.ss(()=>{for(let i=0;i<6;i++)flowerDot(k,x+(k.r()-.5)*56*s,gy-8*s-k.r()*16*s,2*s,i%2?'#FFFFFF':'#F9C6D4')});
   if(k.env.snow)k.side(()=>capLine(k,p.slice(1,8),6*s))},
 rock(k,x,y,s){k.shape(blobP(x,y,16*s,10*s,k.r,8,.25).map(p=>[p[0],Math.min(p[1],y+4*s)]),C.stone,{w:1.8,hatch:{side:.5,gap:4,col:C.stoneD,op:.6}})},
 board(k,x,y,w,h,col=C.wood,colD=C.woodD,pointy){// one fence board with grain and a knot
   const p=pointy?[[x,y+8],[x+w/2,y],[x+w,y+8],[x+w,y+h],[x,y+h]]:RC(x,y,w,h);k.shape(p,col,{w:1.9,wk:.5});
   const gx=x+w*(.3+k.r()*.4);k.line([[gx,y+12],[gx+k.J(2),y+h*.5],[gx+k.J(2),y+h-6]],1,colD);k.line([[x+w*.75,y+h*.3],[x+w*.72,y+h*.7]],1,colD);
   if(k.r()<.45){const ky=y+h*(.35+k.r()*.3);k.add(`<ellipse cx="${R1(x+w*.4)}" cy="${R1(ky)}" rx="2.6" ry="1.8" fill="none" stroke="${colD}" stroke-width="1.1"/>`)}
   if(k.so==='winter')k.ss(()=>frostLine(k,pointy?[[x+1,y+8],[x+w/2,y+1],[x+w-1,y+8]]:[[x+1,y+1],[x+w-1,y+1]]));
   if(k.env.snow)k.side(()=>capLine(k,pointy?[[x-1,y+8],[x+w/2,y],[x+w+1,y+8]]:[[x,y],[x+w,y]],Math.max(3,w*.2)))},
 fence(k,x0,x1,yt,yb,o={}){const bw=o.bw||26,gap=o.gap||5;k.shape(RC(x0,yt+20,x1-x0,9),C.woodD,{w:1.7,one:1});k.shape(RC(x0,yb-30,x1-x0,9),C.woodD,{w:1.7,one:1});
   for(let x=x0;x<x1-bw*.5;x+=bw+gap){const h=yb-yt+k.J(3);O.board(k,x,yb-h,bw,h,C.wood,C.woodD,true)}},
 bench(k,x,gy,s=1){k.shape(RC(x-50*s,gy-36*s,100*s,8*s),C.woodD,{w:1.8});k.shape(RC(x-50*s,gy-58*s,100*s,8*s),C.wood,{w:1.8});k.shape(RC(x-50*s,gy-70*s,100*s,8*s),C.wood,{w:1.8});
   [-42,36].forEach(dx=>{k.line([[x+dx*s,gy-28*s],[x+dx*s,gy]],3.2,C.ink);k.line([[x+(dx+4)*s,gy-74*s],[x+(dx+4)*s,gy-36*s]],2.6,C.ink)});
   if(k.so==='winter')k.ss(()=>{frostLine(k,[[x-49*s,gy-69*s],[x+49*s,gy-69*s]]);frostLine(k,[[x-49*s,gy-35*s],[x+49*s,gy-35*s]])});
   if(k.env.snow)k.side(()=>{capLine(k,[[x-52*s,gy-70*s],[x+52*s,gy-70*s]],6*s);capLine(k,[[x-52*s,gy-36*s],[x+52*s,gy-36*s]],5*s)})},
 lamp(k,x,gy,s=1){k.line([[x,gy],[x,gy-120*s]],4,C.ink);k.shape([[x-12*s,gy-120*s],[x+12*s,gy-120*s],[x+8*s,gy-140*s],[x-8*s,gy-140*s]],C.yellow,{w:1.8});k.shape([[x-14*s,gy-140*s],[x,gy-152*s],[x+14*s,gy-140*s]],'#9AA7B8',{w:1.8});
   k.add(`<circle cx="${x}" cy="${R1(gy-130*s)}" r="${R1(16*s)}" fill="${C.yellow}" opacity=".35"/>`);
   if(k.env.lit)k.lamps.push({x,y:gy-130*s,s,gy,glass:[[x-12*s,gy-120*s],[x+12*s,gy-120*s],[x+8*s,gy-140*s],[x-8*s,gy-140*s]]});
   if(k.env.snow)k.side(()=>capLine(k,[[x-15*s,gy-140*s],[x,gy-153*s],[x+15*s,gy-140*s]],4*s))},
 mushroom(k,x,gy,s=1){k.shape([[x-5*s,gy],[x-4*s,gy-14*s],[x+4*s,gy-14*s],[x+5*s,gy]],'#FFF6E6',{w:1.6});const p=[];for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI;p.push([x+Math.cos(a)*15*s,gy-12*s+Math.sin(a)*12*s])}k.shape(p,'#F49090',{w:1.8});
   [[-6,-17],[3,-20],[8,-15]].forEach(q=>k.add(`<circle cx="${R1(x+q[0]*s)}" cy="${R1(gy+q[1]*s)}" r="${R1(2*s)}" fill="#fff"/>`));
   if(k.env.snow)k.side(()=>capLine(k,p.slice(1,8),3.5*s))},
 cobbles(k,x0,y0,x1,y1){let d='',f='';for(let y=y0+8,row=0;y<y1;y+=16,row++){for(let x=x0+(row%2)*14;x<x1;x+=28){const rx=11+k.r()*2,ry=6+k.r()*1.5,cx=x+k.J(2),cy=y+k.J(1.5);
   f+=`<ellipse cx="${R1(cx+1)}" cy="${R1(cy+1)}" rx="${R1(rx)}" ry="${R1(ry)}" fill="${k.r()<.5?C.stone:'#E6DFD6'}"/>`;d+=`M${R1(cx-rx)} ${R1(cy)}a${R1(rx)} ${R1(ry)} 0 1 0 ${R1(rx*2)} 0a${R1(rx)} ${R1(ry)} 0 1 0 ${R1(-rx*2)} 0`}}
   k.add(f+`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-opacity=".7"/>`)},
 awning(k,x,y,w,h,c1,c2){const n=Math.round(w/34),sw=w/n;for(let i=0;i<n;i++){const p=[[x+i*sw,y],[x+(i+1)*sw,y],[x+(i+1)*sw+4,y+h],[x+(i+.5)*sw+2,y+h+10],[x+i*sw+4,y+h]];k.fill(p,i%2?c2:c1,{dx:.6,dy:.4})}
   const p=[[x,y]];for(let i=0;i<n;i++){p.push([x+i*sw+4,y+h],[x+(i+.5)*sw+2,y+h+10])}p.push([x+w+4,y+h],[x+w,y]);k.pen(p,true,{w:2});for(let i=1;i<n;i++)k.line([[x+i*sw,y],[x+i*sw+4,y+h]],1.1,C.ink,{op:.7});
   if(k.env.snow)k.side(()=>capLine(k,[[x-2,y],[x+w+2,y]],7))},
 bunting(k,x0,x1,y,sag,cols){const n=Math.round((x1-x0)/36);const pt=t=>[x0+(x1-x0)*t,y+Math.sin(Math.PI*t)*sag];const L=[];for(let i=0;i<=20;i++)L.push(pt(i/20));k.line(L,1.4);
   for(let i=0;i<n;i++){const a=pt((i+.2)/n),b=pt((i+.8)/n),m=pt((i+.5)/n);k.shape([a,b,[m[0],m[1]+24]],cols[i%cols.length],{w:1.5,one:1})}},
 window(k,x,y,w,h,o={}){// framed window with cross bars, curtains, sill and optional flower box
   k.shape(RC(x-5,y-5,w+10,h+10),o.frame||C.white,{w:2});k.shape(RC(x,y,w,h),o.glass||C.glass,{w:1.6,one:1});
   if(o.inside)o.inside();else k.add(`<path d="M${R1(x+w*.2)} ${R1(y+h*.75)}l${R1(w*.3)} ${R1(-h*.4)}M${R1(x+w*.45)} ${R1(y+h*.8)}l${R1(w*.2)} ${R1(-h*.25)}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);
   if(k.env.lit&&!o.noLit)k.glows.push([x,y,w,h]);
   k.line([[x+w/2,y],[x+w/2,y+h]],2,C.ink);k.line([[x,y+h/2],[x+w,y+h/2]],2,C.ink);
   if(o.curtain){const cc=o.curtain;[[x,1],[x+w,-1]].forEach(([cx,sd])=>{const p=[[cx,y],[cx+sd*w*.32,y],[cx+sd*w*.18,y+h*.45],[cx+sd*w*.26,y+h*.9],[cx,y+h*.9]];k.shape(p,cc,{w:1.6,one:1});k.line([[cx+sd*w*.1,y+4],[cx+sd*w*.12,y+h*.8]],1,C.ink,{op:.6})});k.line([[x-6,y+2],[x+w+6,y+2]],2.4,C.ink)}
   k.shape(RC(x-9,y+h+3,w+18,7),o.frame||C.white,{w:1.8});
   if(o.box){k.shape(RC(x-4,y+h+10,w+8,16),C.woodD,{w:1.8});const cols=[C.red,C.yellow,C.lav,'#FFB3C7'];for(let i=0;i<5;i++){const fx=x+4+i*(w-8)/4;O.flower(k,fx,y+h+2-k.r()*6,4.2,cols[i%4])}}}
};
/* ---------- time of day + weather ---------- */
// snow cap: a lumpy white ribbon sitting on a top edge (pts left to right), outlined in cool grey pencil
function capLine(k,pts,th){
  const P=dense(pts,false,9),n=P.length;if(n<2)return;
  const top=P.map((p,i)=>[p[0]+k.J(.5),p[1]-th*.38*Math.min(1,Math.sin(Math.PI*i/(n-1))*3+.2)+k.J(.5)]);
  const bot=[];for(let i=n-1;i>=0;i--){const t=i/(n-1),tp=Math.min(1,Math.sin(Math.PI*t)*2.2+.15),b=th*(.5+k.r()*.55)*(i%3===1?1.4:1)*tp;bot.push([P[i][0]+k.J(.6),P[i][1]+b])}
  k.fill(top.concat(bot),'#FFFFFF',{dx:0,dy:0,amp:.4});
  k.pen(top,false,{w:1.4,col:'#8EA2B8',amp:.4});
  if(n>3)k.line(bot.slice(1,-1),1,'#B4C4D4',{op:.9,amp:.3});
}
function snowPatch(k,cx,cy,rx,ry){const p=blobP(cx,cy,rx,ry,k.r,10,.3);k.fill(p,'#FFFFFF',{dx:0,dy:0,op:.92});
  const lo=p.filter(q=>q[1]>=cy-ry*.1).sort((a,b)=>a[0]-b[0]);if(lo.length>1)k.line(lo,1.1,'#A9BACB',{op:.8});
  k.add(`<path d="M${R1(cx-rx*.5)} ${R1(cy-ry*.2)}q${R1(rx*.3)} ${R1(-ry*.4)} ${R1(rx*.6)} 0" fill="none" stroke="#C9D6E2" stroke-width="1.2" stroke-linecap="round"/>`)}
function puddle(k,cx,cy,rx,ry){const p=blobP(cx,cy,rx,ry,k.r,10,.25);k.fill(p,'#A8C6DD',{dx:0,dy:0,op:.85});k.pen(p,true,{w:1.4,amp:.5,col:'#6F8FA8'});
  k.add(`<path d="M${R1(cx-rx*.55)} ${R1(cy-ry*.15)}h${R1(rx*.5)}M${R1(cx+rx*.05)} ${R1(cy+ry*.3)}h${R1(rx*.35)}" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" opacity=".85"/><ellipse cx="${R1(cx+rx*.3)}" cy="${R1(cy)}" rx="${R1(rx*.28)}" ry="${R1(ry*.32)}" fill="none" stroke="#FFFFFF" stroke-width="1.1" opacity=".7"/>`)}
// short wet-sheen strokes scattered in a box, skipping boxes in `avoid`; wrap duplicates across a strip seam
function sheen(k,x0,x1,y0,y1,n,avoid=[],wrapW=0){let d='';for(let i=0;i<n;i++){const x=x0+k.r()*(x1-x0),y=y0+k.r()*(y1-y0),l=8+k.r()*18;
  if(avoid.some(a=>x>a[0]-l&&x<a[2]&&y>a[1]&&y<a[3]))continue;const seg=`M${R1(x)} ${R1(y)}h${R1(l)}`;d+=seg;if(wrapW&&x+l>wrapW)d+=`M${R1(x-wrapW)} ${R1(y)}h${R1(l)}`}
  k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="2.6" stroke-linecap="round" opacity=".9"/><path d="${d}" stroke="#9FBCD3" stroke-width="1" stroke-linecap="round" opacity=".7" transform="translate(3 3)"/>`)}
function ripples(k,x0,x1,y0,y1,n,wrapW){let d='';for(let i=0;i<n;i++){const x=x0+k.r()*(x1-x0),y=y0+k.r()*(y1-y0),r=4+k.r()*6;const e=`M${R1(x-r)} ${R1(y)}a${R1(r)} ${R1(r*.35)} 0 1 0 ${R1(r*2)} 0a${R1(r)} ${R1(r*.35)} 0 1 0 ${R1(-r*2)} 0`;d+=e;if(wrapW&&x+r>wrapW)d+=`M${R1(x-r-wrapW)} ${R1(y)}a${R1(r)} ${R1(r*.35)} 0 1 0 ${R1(r*2)} 0a${R1(r)} ${R1(r*.35)} 0 1 0 ${R1(-r*2)} 0`;if(wrapW&&x-r<0)d+=`M${R1(x-r+wrapW)} ${R1(y)}a${R1(r)} ${R1(r*.35)} 0 1 0 ${R1(r*2)} 0a${R1(r)} ${R1(r*.35)} 0 1 0 ${R1(-r*2)} 0`}
  k.add(`<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="1.3" opacity=".75"/>`)}

/* ---------- v2.5 seasons: spring, autumn and winter painted over the summer drawing ----------
   Summer is the base art, byte for byte. A season only recolours the base (recolorFn), swaps tree, bush and
   flower colours where they are drawn, and adds extras from its own seeded stream (k.ss). The main and side
   streams, the layout and every hotspot stay exactly where they were. */
const AU=[['#F2B25C','#C98336'],['#E8895A','#B9603E'],['#F3CB58','#C79C36'],['#DE6650','#AE463A']];// amber, rust, gold, maple red
const MAPLE={'#E9A86A':1,'#F2C46D':1,'#E9B074':1};
const AUF={'#F4A3A3':'#E9865C','#FCE59A':'#F3BE55','#FFB3C7':'#EC977C','#F49090':'#DF7556','#F8C08A':'#EC9A4E','#DCCBF2':'#C7AEEC'};
// season recolour of the outdoor base: g = where the yellow-greens drift, map = exact swaps (winter water)
const SRC={spring:{g:'#D9F29C',ga:.3},autumn:{g:'#E6D08E',ga:.46,m:'#F6C27C',a:.04,map:{'#C3DFA5':'#EBC983'}},
  winter:{g:'#E8EEE6',ga:.46,ds:.16,m:'#D9E2EC',a:.07,map:{'#C3DFA5':'#DCD3C6','#BEE0F2':'#C5D2DB','#9CCDE8':'#AABCC9','#86BDDE':'#98AEBE','#A9D3EC':'#B6C6D1','#7FB6D8':'#95ABBC','#A8C6DD':'#B1C1CD'}}};
const SKYS={spring:['#DCEEF8','#F2F8F4',.55],autumn:['#C6DBEA','#F6E5CC',.5],winter:['#CDD8E3','#EEF1F4',.65]};
const hueOf=c=>{const [r,g,b]=c,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d||d/mx<.1)return -1;
  const h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return (h*60+360)%360};
const isLeafy=c=>{const h=hueOf(c);return h>=66&&h<=128};// yellow-greens: grass, leaves, hedges (the blue-green pines stay)
// the bamboo crayons (culms, nodes, leaves, the canopy, the basin spout): evergreen, so no season drift and no snow whitening, only the weather and time tints
const BAMBOO_KEEP={'#C7DDB7':1,'#A8C49B':1,'#A9D08F':1,'#7FAF6B':1,'#9CCB81':1,'#6FA05B':1,'#8CC07B':1,'#9ACD7D':1,'#7FB86B':1};
const hashXY=(x,y)=>(Math.imul(Math.round(x)+977,73856093)^Math.imul(Math.round(y)+331,19349663))>>>0;
// the colours of one broadleaf crown per season: [[fill, hatch] x3] (left, right, top)
function crownCols(k,col,colD,x,gy){const so=k.so;
  if(so==='autumn'){const i=MAPLE[col]?3:hashXY(x,gy)%3,a=AU[i],b=AU[i===3?1:(i+2)%3];return [a,a,[mixH(a[0],b[0],.45),mixH(a[1],b[1],.45)]]}
  if(so==='spring'&&MAPLE[col])return [[C.leaf,C.leafD],[C.leaf2,C.leafD],[C.leaf,C.leafD]];
  return [[col,colD],[col,colD],[col,colD]]}
// winter crown: a faint wash of the old canopy, outlined limbs, twigs, a few brown leaves holding on
function bareCrown(k,x,gy,s){const th=70*s,top=gy-th,segs=[],tips=[];
  k.r();
  const grow=(x0,y0,a,len,w,d)=>{const x1=x0+Math.cos(a)*len,y1=y0+Math.sin(a)*len;segs.push([[x0,y0],[(x0+x1)/2+k.J(len*.07),(y0+y1)/2+k.J(len*.07)],[x1,y1],w,d]);
    if(d<2){const n=d?2:2+(k.r()<.5?1:0);for(let i=0;i<n;i++)grow(x1,y1,a+(i-(n-1)/2)*.62+k.J(.16),len*(.6+k.r()*.12),w*.58,d+1)}else tips.push([x1,y1,a])};
  [[-2.3,30],[-1.9,38],[-1.25,38],[-.85,30]].forEach(([a,l])=>grow(x+k.J(2*s),top+8*s,a+k.J(.08),l*s,4.6*s,0));
  segs.forEach(([p0,pm,p1,w])=>k.line([p0,pm,p1],w+1.8,C.ink,{amp:.35}));
  segs.forEach(([p0,pm,p1,w])=>{if(w>2.2)k.line([p0,pm,p1],w-.7,C.trunk,{amp:.25})});
  let tw='';tips.forEach(([tx,ty,a])=>{[[-.45,9],[.5,7],[.05,6]].forEach(([da,l])=>{tw+=`M${R1(tx)} ${R1(ty)}l${R1(Math.cos(a+da)*l*s)} ${R1(Math.sin(a+da)*l*s)}`})});
  k.add(`<path d="${tw}" fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round"/>`);
  tips.filter((t,i)=>i%3===1).forEach(([tx,ty,a])=>leafAt(k,tx+Math.cos(a)*3,ty+6*s,4.5*s,a+1.2,'#C2925E','#93673E'));
  if(k.env.snow){let d='';segs.filter(sg=>sg[4]<2).forEach(([p0,pm,p1,w])=>{d+=`M${R1(p0[0])} ${R1(p0[1]-w*.5)}Q${R1(pm[0])} ${R1(pm[1]-w*.6)} ${R1(p1[0])} ${R1(p1[1]-w*.5)}`});
    k.add(`<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="${R1(2.6*s)}" stroke-linecap="round"/>`)}}
// spring blossom: pink puffs and little five-petal flowers over the crown
function blossom(k,x,gy,s){const top=gy-70*s,spots=[[x-26*s,top-8*s,30*s,22*s],[x+26*s,top-4*s,28*s,20*s],[x,top-36*s,34*s,26*s]];
  spots.forEach(([cx,cy,rx,ry])=>{for(let i=0;i<3;i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r())*.7,px=cx+Math.cos(a)*rx*rr,py=cy+Math.sin(a)*ry*rr,r=(7+k.r()*4)*s;
    k.shape(blobP(px,py,r*.8,r*.66,k.r,8,.35),k.r()<.7?'#F9C6D4':'#FFF1F4',{w:.9,one:1,lcol:'#D29AAA',pamp:.5,lop:.8})}});
  spots.forEach(([cx,cy,rx,ry])=>{for(let i=0;i<5;i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r())*.85;flowerDot(k,cx+Math.cos(a)*rx*rr,cy+Math.sin(a)*ry*rr,2.3*s,k.r()<.5?'#FFFFFF':'#F7B6C8')}})}
function flowerDot(k,x,y,r,col){let s='';for(let i=0;i<5;i++){const a=i/5*Math.PI*2-.3;s+=`<circle cx="${R1(x+Math.cos(a)*r)}" cy="${R1(y+Math.sin(a)*r)}" r="${R1(r*.75)}" fill="${col}" stroke="${C.ink}" stroke-width=".8" stroke-opacity=".75"/>`}
  k.add(s+`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(r*.5)}" fill="#F7C65E"/>`)}
// one leaf: an almond with a midrib (the same leaf as the Maple Woods floor), rotated
function leafAt(k,x,y,s,rot,col,colD){const c=Math.cos(rot),n=Math.sin(rot),P=(u,v)=>`${R1(x+u*s*c-v*s*n)} ${R1(y+u*s*n+v*s*c)}`;
  k.add(`<path d="M${P(-1,0)}Q${P(0,-.75)} ${P(1,0)}Q${P(0,.75)} ${P(-1,0)}Z" fill="${col}" fill-opacity=".86" stroke="${colD}" stroke-width=".9"/><path d="M${P(-1.25,0)}L${P(.7,0)}" stroke="${colD}" stroke-width=".9" stroke-linecap="round"/>`)}
// a maple leaf, outlined in pencil
function mapleAt(k,x,y,s,rot,col){const p=[];const R=[1,.42,.82,.38,1.05,.38,.82,.42,1,.3];for(let i=0;i<10;i++){const a=rot-Math.PI/2+(i-4.5)/10*Math.PI*1.9;p.push([x+Math.cos(a)*R[i]*s,y+Math.sin(a)*R[i]*s])}p.push([x,y+.35*s]);
  k.add(`<path d="M${p.map(q=>R1(q[0])+' '+R1(q[1])).join('L')}Z" fill="${col}" stroke="${C.ink}" stroke-width="1" stroke-linejoin="round"/><path d="M${R1(x)} ${R1(y+.3*s)}L${R1(x+Math.cos(rot+Math.PI/2)*.7*s)} ${R1(y+Math.sin(rot+Math.PI/2)*.7*s)}" stroke="${C.ink}" stroke-width="1" stroke-linecap="round"/>`)}
function petalAt(k,x,y,s,rot,col){const c=Math.cos(rot),n=Math.sin(rot),P=(u,v)=>`${R1(x+u*s*c-v*s*n)} ${R1(y+u*s*n+v*s*c)}`;
  k.add(`<path d="M${P(-1,0)}Q${P(-.2,-.9)} ${P(.8,-.35)}L${P(.55,0)}L${P(.8,.35)}Q${P(-.2,.9)} ${P(-1,0)}Z" fill="${col}" stroke="#D68CA0" stroke-width=".7"/>`)}
const PET=['#F9C6D4','#FFF1F4','#F7B6C8','#F9C6D4'];
// lawn and paving extras. box [x0,y0,x1,y1], avoid = boxes to keep clear, wrapW = seamless strip width
function seasonGround(k,box,n,avoid=[],wrapW=0,hard=0){const so=k.so;if(!so)return;const [x0,y0,x1,y1]=box,free=(x,y)=>!avoid.some(a=>x>a[0]&&x<a[2]&&y>a[1]&&y<a[3]);
  const cl=[];for(let i=0;i<Math.max(2,Math.round((x1-x0)/220));i++)cl.push([x0+k.r()*(x1-x0),y0+k.r()*(y1-y0)]);// drifts: most of it gathers in clumps
  const put=(x,y,hw,fn)=>{if(wrapW&&k.wrap)k.wrap(x,hw,fn);else fn()};
  for(let i=0;i<n;i++){let x=x0+k.r()*(x1-x0),y=y0+k.r()*(y1-y0);const t=k.r(),rot=k.r()*Math.PI*2,sz=.8+k.r()*.6;if(i%5<3){const c=cl[i%cl.length],a=k.r()*6.283,d=Math.sqrt(k.r());x=c[0]+Math.cos(a)*d*70;y=Math.max(y0,Math.min(y1,c[1]+Math.sin(a)*d*(y1-y0)*.3))}if(!free(x,y))continue;
    const yk=1+(y-y0)/Math.max(1,y1-y0)*.35;// a little bigger toward the viewer
    if(so==='autumn'){const a=AU[Math.floor(t*4)%4];put(x,y,12,()=>t<.16?mapleAt(k,x,y,7.6*sz*yk,rot,a[0]):leafAt(k,x,y,6*sz*yk,rot,a[0],a[1]))}
    else if(so==='spring'){put(x,y,8,()=>t<.62||hard?petalAt(k,x,y,4.4*sz*yk,rot,PET[Math.floor(t*7)%4]):t<.86?flowerDot(k,x,y,2.6*sz*yk,'#FFFFFF'):k.add(`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(3*sz*yk)}" fill="#F7D24E" stroke="${C.ink}" stroke-width=".9"/><path d="M${R1(x)} ${R1(y+3*sz)}v${R1(5*sz)}" stroke="#6FAE5C" stroke-width="1.2"/>`))}
    else if(so==='winter'){put(x,y,14,()=>t<.22||hard?k.fill(blobP(x,y,(10+k.r()*12)*yk,(2.6+k.r()*2)*yk,k.r,8,.3),'#FFFFFF',{dx:0,dy:0,op:.62}):k.add(`<path d="M${R1(x)} ${R1(y)}q${R1(yk)} ${R1(-6*yk)} ${R1(-yk)} ${R1(-10*yk)}M${R1(x+5*yk)} ${R1(y)}q0 ${R1(-7*yk)} ${R1(3*yk)} ${R1(-12*yk)}" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>`))}}}
// leaves or petals in the air, each with a little pencil swoosh behind it (drawn on the top layer)
function seasonDrift(k,pts,wrapW=0){const so=k.so;if(so!=='autumn'&&so!=='spring')return;
  pts.forEach(([x,y,s],i)=>{const rot=(i*1.7)%6.28,str=k.cap(()=>{k.add(`<path d="M${R1(x-26*s)} ${R1(y-10*s)}q${R1(10*s)} ${R1(12*s)} ${R1(20*s)} ${R1(4*s)}" fill="none" stroke="${C.graph}" stroke-width="1.2" stroke-linecap="round" stroke-dasharray="4 4" opacity=".8"/>`);
    if(so==='autumn'){const a=AU[i%4];i%3===2?mapleAt(k,x,y,9*s,rot,a[0]):leafAt(k,x,y,7.4*s,rot,a[0],a[1])}else{petalAt(k,x,y,5.6*s,rot,PET[i%4]);if(i%2)petalAt(k,x+9*s,y+7*s,4.4*s,rot+1.4,PET[(i+1)%4])}});
    k.top.push(str);if(wrapW&&x<30)k.top.push(`<g transform="translate(${wrapW} 0)">${str}</g>`);if(wrapW&&x>wrapW-30)k.top.push(`<g transform="translate(${-wrapW} 0)">${str}</g>`)})}
// winter frost: a thin white rime along a top edge, with a few glints
function frostLine(k,pts){const P=dense(pts,false,7);k.line(P.map(p=>[p[0],p[1]+1.2]),1,'#AFC3D6',{amp:.3});k.line(P,2.6,'#FFFFFF',{amp:.3});
  let g='';for(let i=1;i<P.length-1;i+=3){const p=P[i];g+=`M${R1(p[0]-2)} ${R1(p[1]-2)}l4 4M${R1(p[0]+2)} ${R1(p[1]-2)}l-4 4`}if(g)k.add(`<path d="${g}" stroke="#FFFFFF" stroke-width="1" stroke-linecap="round"/>`)}
function tulip(k,x,gy,s,col){k.line([[x,gy],[x+k.J(1),gy-22*s]],1.6,'#6FAE5C');k.shape([[x,gy-4*s],[x-9*s,gy-17*s],[x-2*s,gy-13*s]],'#9CCB80',{w:1.1,one:1});
  k.shape([[x-6*s,gy-21*s],[x-7*s,gy-31*s],[x-3*s,gy-27*s],[x,gy-33*s],[x+3*s,gy-27*s],[x+7*s,gy-31*s],[x+6*s,gy-21*s],[x,gy-18*s]],col,{w:1.4,one:1});k.line([[x,gy-31*s],[x,gy-21*s]],1,C.ink,{op:.45})}
function daffodil(k,x,gy,s){k.line([[x,gy],[x+k.J(1),gy-24*s]],1.6,'#6FAE5C');k.line([[x+2*s,gy],[x+6*s,gy-14*s]],2.4,'#9CCB80');
  let p='';for(let i=0;i<6;i++){const a=i/6*Math.PI*2;p+=`<ellipse cx="${R1(x+Math.cos(a)*4.6*s)}" cy="${R1(gy-27*s+Math.sin(a)*4.6*s)}" rx="${R1(3.6*s)}" ry="${R1(2.6*s)}" transform="rotate(${R1(a*57.3)} ${R1(x+Math.cos(a)*4.6*s)} ${R1(gy-27*s+Math.sin(a)*4.6*s)})" fill="#FFF3A8" stroke="${C.ink}" stroke-width=".9"/>`}
  k.add(p+`<circle cx="${R1(x)}" cy="${R1(gy-27*s)}" r="${R1(3.2*s)}" fill="#F6AE3E" stroke="${C.ink}" stroke-width="1"/><circle cx="${R1(x)}" cy="${R1(gy-27*s)}" r="${R1(1.4*s)}" fill="none" stroke="${C.ink}" stroke-width=".8"/>`)}
// a little group of spring bulbs: tulips with a daffodil or two
function bulbs(k,x,gy,n,s=1){const cols=['#F28FA5','#F7D24E','#F4A3A3','#FFFFFF','#E86A8A'];for(let i=0;i<n;i++){const bx=x+(i-(n-1)/2)*11*s+k.J(2),by=gy+k.J(2);i%3===1?daffodil(k,bx,by,s*.95):tulip(k,bx,by,s,cols[(i+Math.floor(x))%5])}}
// winter in a flower bed: a dry seed head on a bent stalk, now and then a snowdrop
function winterFlower(k,x,y,s){if(hashXY(x,y)%3===0){k.line([[x,y+s*2.6],[x+k.J(.6),y-s*.2],[x+s*.9,y+s*.3]],1.3,'#7DAE66');
    k.add(`<path d="M${R1(x+s*.9)} ${R1(y+s*.3)}q${R1(-s*.8)} ${R1(s*.4)} ${R1(-s*.2)} ${R1(s*1.6)}q${R1(s*.5)} ${R1(s*.3)} ${R1(s*.9)} ${R1(-s*.1)}q${R1(s*.4)} ${R1(-s*.8)} ${R1(-s*.7)} ${R1(-s*1.5)}z" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1"/>`)}
  else{k.line([[x,y+s*2.6],[x+k.J(.8),y+s*.4],[x+s*.5,y]],1.2,'#A8875E');k.add(`<circle cx="${R1(x+s*.5)}" cy="${R1(y-s*.2)}" r="${R1(s*.45)}" fill="#B08A60" stroke="${C.ink}" stroke-width=".8"/>`)}}
// chimney smoke: soft puffs rising and leaning with the breeze
function smoke(k,x,y,s=1){let p='';for(let i=0;i<5;i++){const px=x+i*8*s+i*i*2.2*s,py=y-i*15*s,r=(5+i*2.6)*s;
    p+=`<path d="${smooth(blobP(px,py,r,r*.8,k.r,8,.3),true)}" fill="#F7F4F1" fill-opacity="${R1(.92-i*.1)}" stroke="${C.graph}" stroke-width="1.2" stroke-opacity="${R1(.85-i*.12)}"/>`}k.add(p)}
// a striped windbreak on its stakes (winter beach)
function windbreak(k,x0,gy,w,h,cols=['#F4A3A3','#FFFBF3']){const n=Math.max(4,Math.round(w/26)),sw=w/n,b=h*.12;
  for(let i=0;i<n;i++){const xa=x0+i*sw,xb=xa+sw,bu=b*(i%2?1:.6);const pp=[[xa,gy-h],[xb,gy-h],[xb+bu,gy-h*.5],[xb+1,gy-4],[xa+1,gy-4],[xa+bu,gy-h*.5]];k.fill(pp,cols[i%2],{dx:.8,dy:.6});k.hatch(pp,{side:.5,gap:4,col:i%2?'#D9C7B0':'#D98A8E',op:.5,w:1})}
  k.pen([[x0,gy-h],[x0+w,gy-h]],false,{w:1.8});k.pen([[x0,gy-4],[x0+w,gy-4]],false,{w:1.8});
  for(let i=0;i<=n;i+=Math.ceil(n/3)){const sx=x0+i*sw;k.line([[sx,gy+6],[sx+k.J(1),gy-h-8]],3.2,C.trunkD)}k.line([[x0+w,gy+6],[x0+w+k.J(1),gy-h-8]],3.2,C.trunkD)}
// wind: long pencil swooshes
function windLines(k,list){let d='';list.forEach(([x,y,l])=>{d+=`M${x} ${y}q${R1(l*.4)} -12 ${R1(l*.8)} 0q${R1(l*.18)} 6 ${R1(l*.06)} 14q${R1(-l*.12)} 4 ${R1(-l*.14)} -4`});k.add(`<path d="${d}" fill="none" stroke="${C.graph}" stroke-width="1.5" stroke-linecap="round" opacity=".85"/>`)}
// thin ice shelves along a river bank
function iceEdge(k,x0,x1,yf,dir=1,wrapW=0){for(let x=x0;x<x1;x+=34+k.r()*30){const w=24+k.r()*34,y=yf(x),p=[[x,y],[x+w,yf(x+w)],[x+w-6,yf(x+w)+dir*(5+k.r()*4)],[x+w*.4,y+dir*(7+k.r()*5)],[x+4,y+dir*4]];
  const f=()=>{k.fill(p,'#F2F6F8',{dx:0,dy:0,op:.92});k.line(p.slice(1).concat([p[0]]),1,'#8EA2B8',{op:.9,amp:.3})};if(wrapW&&k.wrap)k.wrap(x+w/2,w/2+4,f);else f()}}
// a leaf or petal floating on water, with its ring
function floater(k,x,y,i){const so=k.so;k.add(`<ellipse cx="${R1(x)}" cy="${R1(y+2)}" rx="12" ry="3" fill="none" stroke="#FFFFFF" stroke-width="1.3" opacity=".8"/>`);
  if(so==='autumn'){const a=AU[i%4];leafAt(k,x,y,6.4,i*1.3,a[0],a[1])}else if(so==='spring')petalAt(k,x,y,4.6,i*1.1,PET[i%4])}
// sea thrift: a cushion of grass with pink pompoms (spring dunes)
function thrift(k,x,gy,s=1){let d='';for(let i=0;i<7;i++)d+=`M${R1(x+(i-3)*3*s)} ${gy}q${R1((i-3)*1.2*s)} ${R1(-6*s)} ${R1((i-3)*2*s)} ${R1(-9*s)}`;k.add(`<path d="${d}" fill="none" stroke="#7FA86A" stroke-width="1.4" stroke-linecap="round"/>`);
  [[-6,-20],[1,-24],[7,-18]].forEach(([dx,dy])=>{k.line([[x+dx*.4*s,gy-6*s],[x+dx*s,gy+dy*s]],1.2,'#7FA86A');k.add(`<circle cx="${R1(x+dx*s)}" cy="${R1(gy+dy*s)}" r="${R1(3.6*s)}" fill="#F7A8C4" stroke="${C.ink}" stroke-width=".9"/>`)})}
// a small chimney stack (shown in winter, with smoke)
function chimney(k,x,y,s=1){k.shape(RC(x-10*s,y-28*s,20*s,30*s),'#E3A08C',{w:1.7,one:1,hatch:{side:.6,gap:3.5,col:'#C47F6A',op:.5}});k.shape(RC(x-13*s,y-32*s,26*s,6*s),'#C9CED6',{w:1.4,one:1});smoke(k,x+2*s,y-40*s,.9*s)}
// winter mulch: straw tucked over a bare plot
function mulch(k,x,y,w,h){let d='',e='';for(let i=0;i<Math.round(w*h/260);i++){const px=x+4+k.r()*(w-8),py=y+4+k.r()*(h-8),a=k.r()*Math.PI,l=6+k.r()*8;const s=`M${R1(px)} ${R1(py)}l${R1(Math.cos(a)*l)} ${R1(Math.sin(a)*l*.5)}`;if(i%3)d+=s;else e+=s}
  k.add(`<path d="${d}" stroke="#E7CB86" stroke-width="2" stroke-linecap="round"/><path d="${e}" stroke="#B9935C" stroke-width="1.6" stroke-linecap="round"/>`)}
function acorn(k,x,y,s=1,rot=0){k.add(`<g transform="rotate(${rot} ${x} ${y})"><ellipse cx="${x}" cy="${R1(y+3*s)}" rx="${R1(3.4*s)}" ry="${R1(4.4*s)}" fill="#D9A866" stroke="${C.ink}" stroke-width="1"/><path d="M${R1(x-4.4*s)} ${R1(y+1*s)}q${R1(4.4*s)} ${R1(-6*s)} ${R1(8.8*s)} 0z" fill="#A97E5A" stroke="${C.ink}" stroke-width="1"/><path d="M${x} ${R1(y-2.4*s)}v${R1(-2.4*s)}" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round"/></g>`)}
function pumpkin(k,x,gy,s=1){k.shape(E(x,gy-9*s,13*s,9.5*s,12),'#F2A04E',{w:1.6,hatch:{side:.55,gap:3.5,col:'#D27C34',op:.5}});k.add(`<path d="M${R1(x-5*s)} ${R1(gy-17*s)}q${R1(-3*s)} ${R1(8*s)} 0 ${R1(16*s)}M${R1(x+5*s)} ${R1(gy-17*s)}q${R1(3*s)} ${R1(8*s)} 0 ${R1(16*s)}" fill="none" stroke="#C9762F" stroke-width="1.2"/>`);
  k.line([[x,gy-18*s],[x+2*s,gy-23*s]],2.4,'#7D9A55')}
function wreath(k,x,y,s=1){k.add(`<circle cx="${x}" cy="${y}" r="${R1(9*s)}" fill="none" stroke="${C.ink}" stroke-width="${R1(7.6*s)}"/><circle cx="${x}" cy="${y}" r="${R1(9*s)}" fill="none" stroke="#7FAF7A" stroke-width="${R1(5.4*s)}"/><circle cx="${x}" cy="${y}" r="${R1(9*s)}" fill="none" stroke="#5E8F62" stroke-width="${R1(1.6*s)}" stroke-dasharray="3 4"/>`);
  [[-5,-6],[6,-4],[-7,4],[4,7]].forEach(([dx,dy])=>k.add(`<circle cx="${R1(x+dx*s)}" cy="${R1(y+dy*s)}" r="${R1(1.6*s)}" fill="#E05A5A"/>`));
  k.shape([[x,y+8*s],[x-7*s,y+4*s],[x-7*s,y+12*s]],'#E57E83',{w:1,one:1});k.shape([[x,y+8*s],[x+7*s,y+4*s],[x+7*s,y+12*s]],'#E57E83',{w:1,one:1})}
function bluebells(k,x,gy,s=1){k.line([[x,gy],[x+2*s,gy-18*s],[x+6*s,gy-22*s]],1.4,'#6FAE5C');let b='';[[1,-17],[4,-12],[6,-7]].forEach(([dx,dy])=>{const bx=x+dx*s+4*s,by=gy+dy*s;b+=`<path d="M${R1(bx-2.4*s)} ${R1(by)}q${R1(2.4*s)} ${R1(-4*s)} ${R1(4.8*s)} 0l${R1(.6*s)} ${R1(2*s)}h${R1(-6*s)}z" fill="#9EB2EC" stroke="${C.ink}" stroke-width=".9"/>`});k.add(b)}
// the view through a window per season: hill colour, a little tree, a leaf or petal going past
function windowSeason(k,x,y,w,h){const env=k.env,so=env.ssn;if(!so)return;k.ss(()=>{const tx=x+w*.62,gy=y+h*.84;
  if(so==='winter'){k.line([[tx,gy],[tx,gy-h*.22]],2.2,C.trunkD);[[-.7,.16],[-.3,.2],[.4,.18]].forEach(([dx,l])=>k.line([[tx,gy-h*.16],[tx+dx*h*.16,gy-h*(.16+l)]],1.3,C.ink))}
  else{const c=so==='autumn'?AU[(Math.round(x)>>3)%3]:['#F7C3D1','#D997AA'];k.line([[tx,gy],[tx,gy-h*.2]],2.4,C.trunkD);O.leafy(k,tx,gy-h*.28,h*.11,h*.085,c[0],c[1]);
    if(so==='spring')for(let i=0;i<4;i++)flowerDot(k,tx+k.J(h*.08),gy-h*.28+k.J(h*.05),1.6,'#FFFFFF');
    if(!env.rain&&!env.night){if(so==='autumn')leafAt(k,x+w*.4,y+h*.42,4.5,.8,AU[1][0],AU[1][1]);else petalAt(k,x+w*.4,y+h*.42,3.6,.6,'#F9C6D4')}}})}
const WIN_HILL={spring:['#C8E79E','#5A7660'],autumn:['#E3CF8E','#6C6A4E'],winter:['#E1E8E1','#77838E']};
// a flower box hung on a railing (spring by the sea)
function railBox(k,x,y,w=34){k.shape([[x-w/2,y],[x+w/2,y],[x+w/2-3,y+14],[x-w/2+3,y+14]],'#E9B9A0',{w:1.5,one:1,hatch:{side:.6,gap:4,col:'#CF9479',op:.5}});bulbs(k,x,y+2,Math.round(w/12),w/40)}
// icicles under an eave (winter), thin and uneven
function icicles(k,x0,x1,y){let d='';for(let x=x0+6;x<x1-4;x+=9+k.r()*8){const l=5+k.r()*11;d+=`M${R1(x-2.4)} ${R1(y)}L${R1(x+k.J(.6))} ${R1(y+l)}L${R1(x+2.4)} ${R1(y)}Z`}
  k.add(`<path d="${d}" fill="#F4F8FB" stroke="#8EA2B8" stroke-width="1" stroke-linejoin="round"/>`);k.line([[x0,y+.5],[x1,y+.5]],2.2,'#FFFFFF',{amp:.3})}
// a round little robin (winter visitor), facing left or right
function robin(k,x,y,s=1,f=1){const X=v=>x+v*s*f;k.shape(E(x,y-7*s,9*s,7.5*s,12),'#A98B74',{w:1.5,one:1});k.shape(E(X(-3),y-5*s,5.2*s,4.6*s,10),'#EE8A5E',{w:1,one:1,noline:1});
  k.shape(E(X(-6),y-14*s,5.6*s,5.4*s,10),'#A98B74',{w:1.4,one:1});k.add(`<path d="M${R1(X(-11))} ${R1(y-14*s)}l${R1(-4*s*f)} ${R1(1.2*s)} ${R1(4*s*f)} ${R1(1.4*s)}z" fill="${C.ink}"/><circle cx="${R1(X(-7))}" cy="${R1(y-15*s)}" r="${R1(1.1*s+.2)}" fill="${C.ink}"/><path d="M${R1(X(7))} ${R1(y-9*s)}l${R1(6*s*f)} ${R1(-3*s)}M${R1(X(-1))} ${R1(y)}v${R1(3*s)}M${R1(X(2))} ${R1(y)}v${R1(3*s)}" stroke="${C.ink}" stroke-width="1.3" stroke-linecap="round"/>`)}
function butterfly(k,x,y,s=1,col='#F7D24E'){const w=(dx,dy,rx,ry,r)=>`<ellipse cx="${R1(x+dx*s)}" cy="${R1(y+dy*s)}" rx="${R1(rx*s)}" ry="${R1(ry*s)}" transform="rotate(${r} ${R1(x+dx*s)} ${R1(y+dy*s)})" fill="${col}" stroke="${C.ink}" stroke-width="1.1"/>`;
  k.add(w(-5,-3,5.5,4,-30)+w(5,-3,5.5,4,30)+w(-4,3,3.6,2.6,20)+w(4,3,3.6,2.6,-20)+`<path d="M${x} ${R1(y-5*s)}v${R1(10*s)}M${x} ${R1(y-5*s)}l${R1(-3*s)} ${R1(-5*s)}M${x} ${R1(y-5*s)}l${R1(3*s)} ${R1(-5*s)}" stroke="${C.ink}" stroke-width="1.3" stroke-linecap="round" fill="none"/>`);
  k.add(`<path d="M${R1(x-30*s)} ${R1(y+8*s)}q${R1(8*s)} ${R1(-12*s)} ${R1(16*s)} ${R1(-4*s)}" fill="none" stroke="${C.graph}" stroke-width="1.1" stroke-dasharray="3 4" stroke-linecap="round"/>`)}
/* ---------- v2.6 Halloween 2026: cute-spooky dressing over any season, drawn only when env.hw (k.hw runs on its own seeded stream) ----------
   Smiling jack-o-lanterns, paper ghosts, felt bats, paper lanterns, hay bales. At dusk and night the pumpkins and lanterns glow softly
   (k.hwl: drawn over the treated art like the other lights, static, no filters). With Halloween off none of this runs. */
const HWF='#7A6698',HWP='#4E4166';// felt bat purple, paper-bat dark
function hwGlow(k,x,y,r,col='#FFB45A'){const L=k.env.lit;if(!L)return;const g=glowGrad(k,col,'hw'+col.slice(1));k.hwl.push(`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(r)}" fill="url(#${g})" opacity="${R1(.85*L)}"/>`)}
function hwFace(x,gy,s){const cy=gy-9*s;return `M${R1(x-6.6*s)} ${R1(cy-.6*s)}l${R1(2.6*s)} ${R1(-4.4*s)} ${R1(2.6*s)} ${R1(4.4*s)}zM${R1(x+1.4*s)} ${R1(cy-.6*s)}l${R1(2.6*s)} ${R1(-4.4*s)} ${R1(2.6*s)} ${R1(4.4*s)}zM${R1(x-7.2*s)} ${R1(cy+1.8*s)}q${R1(7.2*s)} ${R1(7.4*s)} ${R1(14.4*s)} 0q${R1(-3.6*s)} ${R1(1.4*s)} ${R1(-4.6*s)} ${R1(1.2*s)}l${R1(-1.2*s)} ${R1(2*s)}l${R1(-1.4*s)} ${R1(-1.8*s)}q${R1(-4*s)} ${R1(.6*s)} ${R1(-7.2*s)} ${R1(-1.4*s)}z`}
// a carved pumpkin with a smile; it glows from inside after dark
function hwJack(k,x,gy,s=1){pumpkin(k,x,gy,s);const d=hwFace(x,gy,s);k.add(`<path d="${d}" fill="#7A4630" stroke="${C.ink}" stroke-width="${R1(Math.max(.6,.8*s))}" stroke-linejoin="round"/>`);
  if(k.env.lit){hwGlow(k,x,gy-9*s,32*s);k.hwl.push(`<path d="${d}" fill="#FFD36E" opacity="${R1(.95*k.env.lit)}"/>`)}}
// a friendly paper or cloth ghost, y = the top of its head; len = the string it hangs from
function hwGhost(k,x,y,s=1,len=0,mute=0){if(len)k.line([[x,y-len],[x+k.J(.5),y+1]],1.1,C.ink,{op:.7});
  const p=[];for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI;p.push([x+Math.cos(a)*10*s,y+10*s+Math.sin(a)*10*s])}
  p.push([x+11*s,y+22*s],[x+13*s,y+31*s],[x+8.5*s,y+27.5*s],[x+4.2*s,y+32*s],[x,y+28*s],[x-4.2*s,y+32*s],[x-8.5*s,y+27.5*s],[x-13*s,y+31*s],[x-11*s,y+22*s]);
  k.shape(p,mute?'#E4DDE6':'#FFFFFF',{w:mute?1.2:1.5,one:1,lop:mute?.75:0,hatch:{side:.55,gap:3.5,col:mute?'#B3A8C2':'#C9C2D9',op:.6}});
  const e=(dx,dy,rx,ry,c,o='')=>`<ellipse cx="${R1(x+dx*s)}" cy="${R1(y+dy*s)}" rx="${R1(rx*s)}" ry="${R1(ry*s)}" fill="${c}"${o}/>`;
  k.add(e(-3.6,10,1.5,2.1,C.ink)+e(3.6,10,1.5,2.1,C.ink)+e(-3.2,9.2,.5,.6,'#FFFFFF')+e(4,9.2,.5,.6,'#FFFFFF')+e(-6.6,14,2,1.2,C.pink,' opacity=".75"')+e(6.6,14,2,1.2,C.pink,' opacity=".75"')+`<path d="M${R1(x-2.2*s)} ${R1(y+14.4*s)}q${R1(2.2*s)} ${R1(2.6*s)} ${R1(4.4*s)} 0" fill="none" stroke="${C.ink}" stroke-width="${R1(Math.max(.8,1.1*s))}" stroke-linecap="round"/>`)}
// a felt bat with button eyes and a small smile (o.col: paper-cut colour for window bats)
function hwBat(k,x,y,s=1,o={}){const f=o.col||HWF,w=Math.max(.8,1.3*Math.min(1,s));
  const W=d=>[[x+d*3*s,y-2.4*s],[x+d*9*s,y-8*s],[x+d*15*s,y-9.4*s],[x+d*20*s,y-5*s],[x+d*16.4*s,y-1.6*s],[x+d*13*s,y-3.2*s],[x+d*10.6*s,y+1.6*s],[x+d*7.2*s,y-.4*s],[x+d*3.6*s,y+3.2*s]];
  k.shape(W(-1),f,{w,one:1});k.shape(W(1),f,{w,one:1});
  k.shape([[x-4.6*s,y-3*s],[x-3.8*s,y-10.4*s],[x-1*s,y-6*s],[x+1*s,y-6*s],[x+3.8*s,y-10.4*s],[x+4.6*s,y-3*s],[x+4.4*s,y+3.6*s],[x,y+7*s],[x-4.4*s,y+3.6*s]],f,{w,one:1});
  if(s>=.5)k.add(`<path d="M${R1(x-17*s)} ${R1(y-5*s)}q${R1(5*s)} ${R1(-3*s)} ${R1(10*s)} ${R1(-2*s)}M${R1(x+17*s)} ${R1(y-5*s)}q${R1(-5*s)} ${R1(-3*s)} ${R1(-10*s)} ${R1(-2*s)}" fill="none" stroke="#FFFFFF" stroke-width="${R1(.9*s)}" stroke-dasharray="${R1(1.6*s)} ${R1(1.6*s)}" opacity=".55"/>`);
  k.add(`<circle cx="${R1(x-2*s)}" cy="${R1(y-1.4*s)}" r="${R1(1.5*s)}" fill="#FFFFFF"/><circle cx="${R1(x+2*s)}" cy="${R1(y-1.4*s)}" r="${R1(1.5*s)}" fill="#FFFFFF"/><circle cx="${R1(x-1.8*s)}" cy="${R1(y-1.1*s)}" r="${R1(.75*s)}" fill="${C.ink}"/><circle cx="${R1(x+2.2*s)}" cy="${R1(y-1.1*s)}" r="${R1(.75*s)}" fill="${C.ink}"/>${s>=.5?`<path d="M${R1(x-1.4*s)} ${R1(y+2*s)}q${R1(1.4*s)} ${R1(1.4*s)} ${R1(2.8*s)} 0" fill="none" stroke="#FFFFFF" stroke-width="${R1(.8*s)}" stroke-linecap="round"/>`:''}`)}
// an orange paper lantern, y = where it hangs from
function hwLantern(k,x,y,s=1,col='#F59A4A'){k.shape(E(x,y+10*s,7.5*s,9*s,12),col,{w:1.3,one:1,hatch:{side:.6,gap:3,col:'#D9772E',op:.45}});
  k.add(`<path d="M${R1(x-3.5*s)} ${R1(y+1.8*s)}q${R1(-2.2*s)} ${R1(8.2*s)} 0 ${R1(16.4*s)}M${R1(x+3.5*s)} ${R1(y+1.8*s)}q${R1(2.2*s)} ${R1(8.2*s)} 0 ${R1(16.4*s)}" fill="none" stroke="#C9672A" stroke-width="1" opacity=".8"/><rect x="${R1(x-3.6*s)}" y="${R1(y-.6*s)}" width="${R1(7.2*s)}" height="${R1(2.6*s)}" rx="1" fill="${C.ink}"/><rect x="${R1(x-3*s)}" y="${R1(y+18.4*s)}" width="${R1(6*s)}" height="${R1(2.4*s)}" rx="1" fill="${C.ink}"/><path d="M${R1(x)} ${R1(y+20.8*s)}v${R1(4.2*s)}" stroke="#C9672A" stroke-width="1.4" stroke-linecap="round"/>`);
  if(k.env.lit){hwGlow(k,x,y+10*s,26*s,'#FFC46A');k.hwl.push(`<ellipse cx="${R1(x)}" cy="${R1(y+10.4*s)}" rx="${R1(4.6*s)}" ry="${R1(6.4*s)}" fill="#FFE29A" opacity="${R1(.8*k.env.lit)}"/>`)}}
function hwLanternString(k,x0,y0,x1,y1,sag,n,s=1){const pt=t=>[x0+(x1-x0)*t,y0+(y1-y0)*t+Math.sin(Math.PI*t)*sag],L=[];for(let i=0;i<=20;i++)L.push(pt(i/20));k.line(L,1.3);
  const cols=['#F59A4A','#F7B24E','#F2885A'];for(let i=0;i<n;i++){const [x,y]=pt((i+.5)/n);k.line([[x,y],[x,y+3*s]],1);hwLantern(k,x,y+3*s,s,cols[i%3])}}
// felt bats on a string; skip(x) leaves a gap (the sun or the moon)
function hwBatString(k,x0,x1,y,sag,n,s=1,skip){const pt=t=>[x0+(x1-x0)*t,y+Math.sin(Math.PI*t)*sag],L=[];for(let i=0;i<=24;i++)L.push(pt(i/24));k.line(L,1.4);
  for(let i=0;i<n;i++){const [x,yy]=pt((i+.5)/n);if(skip&&skip(x))continue;k.line([[x,yy],[x,yy+4*s]],1,C.ink,{op:.7});hwBat(k,x,yy+11*s,s)}}
// a hay bale (a pumpkin usually sits on it)
function hwHay(k,x,gy,s=1){const w=34*s,h=20*s;k.shape([[x-w/2,gy],[x-w/2-1*s,gy-h+3*s],[x-w/2+3*s,gy-h],[x+w/2-3*s,gy-h],[x+w/2+1*s,gy-h+3*s],[x+w/2,gy]],'#E2C88E',{w:1.2,one:1,lop:.75,hatch:{side:.5,gap:3.5,col:'#C4A462',op:.5}});
  let d='';for(let i=0;i<7;i++){const xx=x-w/2+4*s+k.r()*(w-12*s),yy=gy-h+4*s+k.r()*(h-7*s);d+=`M${R1(xx)} ${R1(yy)}l${R1(4*s)} ${R1(-1*s)}`}
  k.add(`<path d="${d}" fill="none" stroke="#C9A04E" stroke-width="1.1" stroke-linecap="round"/><path d="M${R1(x-w*.24)} ${R1(gy-h+1)}v${R1(h-1.6)}M${R1(x+w*.24)} ${R1(gy-h+1)}v${R1(h-1.6)}" fill="none" stroke="#A97E5A" stroke-width="1.6" stroke-linecap="round"/>`)}
function hwHayJack(k,x,gy,s=1){hwHay(k,x,gy,s);hwJack(k,x+3*s,gy-19*s,.85*s)}
// a painted ghost cut-out on a wooden stake
function hwCutout(k,x,gy,s=1){k.shape(RC(x-2.4*s,gy-30*s,4.8*s,30*s),C.woodD,{w:1.2,one:1,lop:.75});hwGhost(k,x,gy-60*s,1.15*s,0,1)}
// a little lantern standing on a post top at (x, y)
function hwPostLantern(k,x,y,s=1){const g=[[x-6*s,y-3*s],[x-7*s,y-17*s],[x+7*s,y-17*s],[x+6*s,y-3*s]];
  k.shape(RC(x-8.5*s,y-3.4*s,17*s,3.4*s),C.ink,{noline:1,dx:0,dy:0});k.shape(g,'#FBE3A6',{w:1.4,one:1});
  k.add(`<rect x="${R1(x-1.7*s)}" y="${R1(y-10*s)}" width="${R1(3.4*s)}" height="${R1(6.6*s)}" fill="#FFFBF3" stroke="${C.ink}" stroke-width=".8"/><path d="M${R1(x)} ${R1(y-10.6*s)}q${R1(-1.8*s)} ${R1(-2.2*s)} 0 ${R1(-4.6*s)}q${R1(1.8*s)} ${R1(2.2*s)} 0 ${R1(4.6*s)}z" fill="#F59A4A"/>`);
  k.shape([[x-9.5*s,y-16.6*s],[x,y-24*s],[x+9.5*s,y-16.6*s]],'#F59A4A',{w:1.4,one:1});k.add(`<circle cx="${R1(x)}" cy="${R1(y-27*s)}" r="${R1(2.6*s)}" fill="none" stroke="${C.ink}" stroke-width="1.3"/>`);
  if(k.env.lit){hwGlow(k,x,y-10*s,36*s,'#FFC46A');k.hwl.push(`<path d="M${g.map(p=>R1(p[0])+' '+R1(p[1])).join('L')}Z" fill="#FFE7A0" opacity="${R1(.75*k.env.lit)}"/>`)}}
// walk-strip dressing: [kind, x, ground y, scale] (jack, hay = a hay bale with a pumpkin, ghost = a cut-out on a stake), each wrapped at the seam
function hwStrip(k,list,bats){hwSkyBats(k,bats.map(([x,y,s])=>[x,y,s*1.3]));list.forEach(([t,x,gy,s])=>(s*=t==='jack'?1.15:.8,k.wrap(x,t==='ghost'?17*s:t==='hay'?20*s:14*s,()=>t==='jack'?hwJack(k,x,gy,s):t==='hay'?hwHayJack(k,x,gy,s):hwCutout(k,x,gy,s))))}
// felt bats far up in the dusk and night sky: into the sky layer, behind everything (wrapped on the walk strips)
function hwSkyBats(k,list){const e=k.env;if(!(e.night||e.time==='dusk')||e.rain)return;k.sky.push(k.cap(()=>list.forEach(([x,y,s])=>{const one=()=>hwBat(k,x,y,s,{col:e.night?'#8C78AE':HWF});if(k.wrap)k.wrap(x,21*s,one);else one()})))}
// sky colours: [top, horizon] per time, pulled toward grey by weather
const SKYT={dawn:['#F4B8CC','#FDDBB6'],day:['#C9E2F3','#E4F1F8'],dusk:['#B9A4DD','#F8B07E'],night:['#1E2954','#3A4A82']};
function skyCols(env){let [a,b]=SKYT[env.time];
  if(env.ssn){const q=SKYS[env.ssn],f=q[2]*(env.time==='day'?1:env.night?.3:.5);a=mixH(a,q[0],f);b=mixH(b,q[1],f)}
  if(env.sunny)return[a,b];
  const g=env.night?{cloudy:['#363F5E','#4E5878',.55],rain:['#2A3044','#424A5E',.72],snow:['#46517A','#69759A',.5]}[env.weather]
    :{cloudy:['#CBD2DA','#E3E6EA',.58],rain:['#A6AFBC','#C3CAD2',.75],snow:['#D7DEE6','#EEF1F4',.62]}[env.weather];
  return [mixH(a,g[0],g[2]),mixH(b,g[1],g[2])]}
function cloudCols(env){
  if(env.night)return{cloudy:['#5A6483','#3B4360','#9AA6CA'],rain:['#454D63','#2E3446','#6E7894'],snow:['#76819F','#545E7E','#B4BED8'],sunny:['#4A5578','#36405E','#8E9AC0']}[env.weather];
  const base={sunny:['#FFFFFF','#E6D9E8'],cloudy:['#ECEEF1','#AEB6C0'],rain:['#B6BEC9','#7C8695'],snow:['#F3F5F8','#B5C1CE']}[env.weather];
  if(env.time==='dawn')return[mixH(base[0],'#FFD6DA',.35),mixH(base[1],'#D99AA8',.3),C.ink];
  if(env.time==='dusk')return[mixH(base[0],'#F2C9DE',.4),mixH(base[1],'#A88BC4',.35),C.ink];
  return[base[0],base[1],C.ink]}
function cloudV(k,x,y,s,cc){const p=[];for(let i=0;i<7;i++){const a=Math.PI+i/6*Math.PI;p.push([x+Math.cos(a)*s*1.6,y+Math.sin(a)*s*(i%2?1.05:.8)])}p.push([x+s*1.5,y+s*.25],[x-s*1.5,y+s*.25]);
  k.fill(p,cc[0],{dx:0,dy:0});k.hatch([[x-s*1.55,y+s*.28],[x+s*1.55,y+s*.28],[x+s*1.25,y-s*.18],[x-s*1.25,y-s*.18]],{gap:4,col:cc[1],op:.75,w:1.2});k.pen(p,true,{w:1.8,col:cc[2]});
  k.line([[x-s*.9,y-s*.15],[x-s*.5,y-s*.45]],1.2,cc[2]===C.ink?C.graph:cc[2],{op:.7})}
function glowGrad(k,col,id){if(!k['_g'+id]){k['_g'+id]=uid();k.defs2.push(`<radialGradient id="${k['_g'+id]}"><stop offset="0" stop-color="${col}" stop-opacity=".75"/><stop offset=".45" stop-color="${col}" stop-opacity=".32"/><stop offset="1" stop-color="${col}" stop-opacity="0"/></radialGradient>`)}return k['_g'+id]}
function moon(k,x,y,r,dim){const g=glowGrad(k,'#FFF4C8','moon');
  k.add(`<circle cx="${x}" cy="${y}" r="${R1(r*2.8)}" fill="url(#${g})" opacity="${dim?.45:.8}"/>`);
  const ax=R1(x+r*.34),ty=R1(y-r*.94),by=R1(y+r*.94),d=`M${ax} ${ty}A${r} ${r} 0 1 0 ${ax} ${by}A${R1(r*1.05)} ${R1(r*1.05)} 0 0 1 ${ax} ${ty}Z`;
  k.add(`<path d="${d}" fill="#FFF3C2" transform="translate(1.5 1)"/><path d="${d}" fill="none" stroke="#E2C46E" stroke-width="2" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#C9A956" stroke-width="1" stroke-dasharray="${R1(r*1.6)} ${R1(r*.5)}" transform="translate(-.8 .6)"/>`);
  k.add(`<path d="M${R1(x-r*.72)} ${R1(y-r*.12)}q${R1(r*.12)} ${R1(r*.12)} ${R1(r*.24)} 0" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round"/><ellipse cx="${R1(x-r*.55)}" cy="${R1(y+r*.18)}" rx="${R1(r*.12)}" ry="${R1(r*.08)}" fill="${C.pink}" opacity=".7"/>`)}
// doodled stars: dots, little 4-point twinkles, a few outlined 5-point stars
function stars(k,W,y0,y1,n,wrap,excl){let s='';const addW=(x,str)=>{s+=str;if(wrap&&x<12)s+=`<g transform="translate(${W} 0)">${str}</g>`;if(wrap&&x>W-12)s+=`<g transform="translate(${-W} 0)">${str}</g>`};
  for(let i=0;i<n;i++){const x=k.r()*W,y=y0+k.r()*(y1-y0),t=k.r();if(excl&&excl(x,y)){continue}
    if(t<.5)addW(x,`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(.9+k.r()*1.1)}" fill="#FFF6D2" opacity="${R1(.6+k.r()*.4)}"/>`);
    else if(t<.86){const q=2.6+k.r()*2.6,c=q*.18;addW(x,`<path d="M${R1(x)} ${R1(y-q)}Q${R1(x+c)} ${R1(y-c)} ${R1(x+q)} ${R1(y)}Q${R1(x+c)} ${R1(y+c)} ${R1(x)} ${R1(y+q)}Q${R1(x-c)} ${R1(y+c)} ${R1(x-q)} ${R1(y)}Q${R1(x-c)} ${R1(y-c)} ${R1(x)} ${R1(y-q)}Z" fill="#FFF0A8"/>`)}
    else{const q=5+k.r()*3;let d='';for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,rr=(j%2?q*.45:q)*(1+k.J(.08));d+=(j?'L':'M')+R1(x+Math.cos(a)*rr)+' '+R1(y+Math.sin(a)*rr)}addW(x,`<path d="${d}Z" fill="#FFF0A8" stroke="#E2C46E" stroke-width="1.2" stroke-linejoin="round"/>`)}}
  k.add(s)}
// coloured-pencil hatching as a seamless pattern tile (size divides 1200 so strips stay seamless)
function hatchPat(k,size,col,n,w,op,ang=-.04){const id=uid();let d='';const ca=Math.cos(ang),sa=Math.sin(ang);
  for(let i=0;i<n;i++){const x=k.r()*size,y=k.r()*size,l=16+k.r()*26,a2=ang+k.J(.04),dx=l*Math.cos(a2),dy=l*Math.sin(a2);[[0,0],[-size,0],[0,size],[-size,size],[size,0],[0,-size]].forEach(([ox,oy])=>{d+=`M${R1(x+ox)} ${R1(y+oy)}l${R1(dx)} ${R1(dy)}`})}
  k.defs2.push(`<pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><path d="${d}" stroke="${col}" stroke-width="${w}" stroke-opacity="${op}" stroke-linecap="round" fill="none"/></pattern>`);return id}
function skyGrad(k,y0,y1){const [a,b]=skyCols(k.env),id=uid();k.defs2.push(`<linearGradient id="${id}" x1="0" y1="${y0}" x2="0" y2="${y1}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`);return 'url(#'+id+')'}
function skyTexture(k,x,y,W,H){const env=k.env,[a]=skyCols(env);
  const p1=hatchPat(k,75,env.night?'#5D70AE':mixH(a,'#FFFFFF',.5),12,1.5,env.night?.5:.45),p2=hatchPat(k,100,env.night?'#161E44':mixH(a,'#5B6A80',.25),8,1.5,env.night?.45:.2,.08);
  k.add(`<rect x="${x}" y="${y}" width="${W}" height="${H}" fill="url(#${p1})"/><rect x="${x}" y="${y}" width="${W}" height="${H}" fill="url(#${p2})"/>`)}
// the whole variant sky. cfg: {W,H,sun:[x,y,r],low:[x,y,r],moon:[x,y,r],clouds:[[x,y,s]],rainC:[[x,y,s]],birds:[[x,y,s]]}
function drawSky(k,cfg){const env=k.env;k.side(()=>{k.sky.push(k.cap(()=>{
  const W=cfg.W,H=cfg.H,wrap=!!k.wrap,ww=(x,hw,fn)=>wrap?k.wrap(x,hw,fn):fn();
  k.add(`<rect width="${W}" height="${H}" fill="${skyGrad(k,0,H)}"/>`);skyTexture(k,0,0,W,H);
  if(env.low&&!env.rain){// warm horizon streaks
    let d='';for(let i=0;i<14;i++){const x=k.r()*W,y=H*(.45+k.r()*.45),l=60+k.r()*120;d+=`M${R1(x)} ${R1(y)}h${R1(l)}`;if(wrap&&x+l>W)d+=`M${R1(x-W)} ${R1(y)}h${R1(l)}`}
    k.add(`<path d="${d}" stroke="${env.time==='dawn'?'#FFE7B8':'#FFD0A0'}" stroke-width="4" stroke-opacity=".55" stroke-linecap="round"/>`)}
  const cc=cloudCols(env),show=env.sunny?'full':env.rain?'none':'peek';let peek=null;
  if(env.night){const nS=env.sunny?1:env.weather==='cloudy'?.3:env.snow?.15:0;
    if(nS){const m=cfg.moon;stars(k,W,6,H*.82,Math.round((cfg.stars||W/22)*nS),wrap,(x,y)=>Math.hypot(x-m[0],y-m[1])<m[2]*1.6)}
    if(show!=='none'){const m=cfg.moon;ww(m[0],m[2]*3,()=>moon(k,m[0],m[1],m[2],show==='peek'));if(show==='peek')peek=m}}
  else if(show!=='none'){let sp=env.low?cfg.low:cfg.sun;if(!env.low&&!cfg.keepSun&&(env.ssn==='winter'||env.ssn==='autumn')){const f=env.ssn==='winter'?.36:.15;sp=[sp[0],R1(sp[1]+(cfg.low[1]-sp[1])*f),sp[2]]}ww(sp[0],sp[2]*2.8,()=>{
      if(env.low){const g=glowGrad(k,env.time==='dawn'?'#FFD9A8':'#FFB27A','sun'+env.time);k.add(`<circle cx="${sp[0]}" cy="${sp[1]}" r="${R1(sp[2]*3.2)}" fill="url(#${g})"/>`)}
      O.sun(k,sp[0],sp[1],sp[2],env.time==='dawn'?'#FDD68E':env.time==='dusk'?'#F9AE6E':env.snow||env.ssn==='winter'?'#FBEFC8':C.sun)});
    if(show==='peek')peek=sp}
  let cl=[];if(!env.sunny){cl=cfg.clouds.slice();if(env.rain)cl=cl.concat(cfg.rainC||[]).map(c=>[c[0],c[1],c[2]*1.2])}else if(env.low)cl=cfg.clouds.slice(0,2);
  cl.forEach(([x,y,s])=>ww(x,s*1.7,()=>cloudV(k,x,y,s,cc)));
  if(peek){const [x,y,r]=peek;ww(x+r*.5,r*1.9,()=>cloudV(k,x+r*.55,y+r*.5,r*(env.night?.8:.95),cc))}
  if(cfg.birds&&!env.night&&!env.rain)cfg.birds.forEach(([x,y,s])=>ww(x,s+2,()=>O.bird(k,x,y,s)));
  k.ss(()=>{if(env.sunny&&!env.low&&(env.ssn==='spring'||env.ssn==='winter'))cfg.clouds.slice(0,env.ssn==='spring'?2:1).forEach(([x,y,s])=>ww(x,s*1.7,()=>cloudV(k,x,y,s*.9,cc)));
    if(env.ssn==='autumn'&&!env.night&&!env.rain){const b=(cfg.birds&&cfg.birds[0])||[cfg.clouds[0][0]+120,cfg.clouds[0][1]+40,8];[[0,0],[-14,-9],[-28,-17],[14,-8],[27,-15]].forEach(([dx,dy])=>ww(b[0]+80+dx,12,()=>O.bird(k,b[0]+80+dx,b[1]+30+dy,6.5)))}});
}))})}

// colour treatment for the base art: weather mutes/greys, snow pales the greens, time shifts toward warm or navy
function recolorFn(env,kind){if(env.def)return null;
  const sc=kind==='map'?.5:1,inn=kind==='in';
  const Wt={sunny:null,cloudy:{ds:.2,m:'#B7C0CA',a:.10},rain:{ds:.3,m:'#8592A3',a:.18},snow:{ds:.12,m:'#E9EEF3',a:.10,gr:.5}}[env.weather];
  const Tt=inn?{dawn:{m:'#F3B2A8',a:.06},day:null,dusk:{m:'#E0957E',a:.1},night:{m:'#433A62',a:.26,ds:.12}}[env.time]
    :{dawn:{m:'#F2A6A6',a:.12},day:null,dusk:{m:'#C98698',a:.18,ds:.05},night:{m:'#25325E',a:kind==='strip'?.42:.46,ds:.22}}[env.time];
  const St=env.ssn&&!inn&&kind!=='map'?SRC[env.ssn]:null;// v2.5 season
  const ws=inn?.4:1,memo={},EX={'#FFFFFE':1,'#5B3D33':1};
  return m=>{let u=m.toUpperCase();if(u.length===4)u='#'+u[1]+u[1]+u[2]+u[2]+u[3]+u[3];if(EX[u])return m;if(memo[u])return memo[u];let c=h2c(u);
    const ev=BAMBOO_KEEP[u],ap=(o,f)=>{if(!o)return;if(o.gr&&!ev&&c[1]>c[0]+6&&c[1]>=c[2])c=c.map((v,i)=>v+(h2c('#EEF3EA')[i]-v)*o.gr*sc);
      if(o.ds){const L=.3*c[0]+.59*c[1]+.11*c[2];c=c.map(v=>v+(L-v)*o.ds*f*sc)}const t=h2c(o.m);c=c.map((v,i)=>v+(t[i]-v)*o.a*f*sc)};
    if(St&&!ev){const mp=St.map&&St.map[u];if(mp)c=h2c(mp);else if(isLeafy(c))c=c.map((v,i)=>v+(h2c(St.g)[i]-v)*St.ga);if(St.ds){const L=.3*c[0]+.59*c[1]+.11*c[2];c=c.map(v=>v+(L-v)*St.ds)}if(St.m){const t=h2c(St.m);c=c.map((v,i)=>v+(t[i]-v)*St.a)}}
    ap(Wt,ws);ap(Tt,1);return memo[u]=c2h(c)}}

// lights drawn on top of the treated art: lit windows, lamp halos, string-light bulbs, water glints, fireflies
function lightsLayer(k,W,wrap){const env=k.env,L=env.lit;let s='';
  const add=(x,rr,str)=>{s+=str;if(wrap){if(x-rr<0)s+=`<g transform="translate(${W} 0)">${str}</g>`;if(x+rr>W)s+=`<g transform="translate(${-W} 0)">${str}</g>`}};
  k.side(()=>{
  if(L){const wg=glowGrad(k,'#FFD877','warm');
    const glow=([x,y,w,h])=>add(x+w/2,w,`<rect x="${R1(x-12)}" y="${R1(y-12)}" width="${R1(w+24)}" height="${R1(h+24)}" rx="14" fill="#FFD36E" fill-opacity="${R1(.16*L)}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFD25E" fill-opacity="${R1((w>100?.4:.6)*L)}"/><path d="M${R1(x+w*.18)} ${R1(y+h*.7)}l${R1(w*.22)} ${R1(-h*.34)}" stroke="#FFF6D0" stroke-width="3" stroke-linecap="round" opacity="${R1(.8*L)}"/>`);
    // v2.6.1: a scene can list shapes that stand in front of its windows (k.unlit, e.g. the Square's notice board); the window glows are masked by them
    if(k.unlit&&k.unlit.length&&k.glows.length){const pre=s,m=unlitId();s='';k.glows.forEach(glow);
      s=pre+`<mask id="${m}" maskUnits="userSpaceOnUse" x="-60" y="-60" width="${W+120}" height="760"><rect x="-60" y="-60" width="${W+120}" height="760" fill="#fff"/><path d="${k.unlit.join('')}" fill="#000"/></mask><g mask="url(#${m})">${s}</g>`}
    else k.glows.forEach(glow);
    k.lamps.forEach(l=>{const g=l.glass,gd='M'+g.map(p=>R1(p[0])+' '+R1(p[1])).join('L')+'Z',rr=74*l.s;let rays='';for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.2,r0=22*l.s,r1=(30+(i%2)*8)*l.s;rays+=`M${R1(l.x+Math.cos(a)*r0)} ${R1(l.y+Math.sin(a)*r0)}L${R1(l.x+Math.cos(a)*r1)} ${R1(l.y+Math.sin(a)*r1)}`}
      add(l.x,rr,`${l.big?`<ellipse cx="${R1(l.x)}" cy="${R1(l.y+120)}" rx="${R1(rr*2.8)}" ry="${R1(rr*2.4)}" fill="url(#${wg})" opacity="${R1(.42*L)}"/>`:''}<circle cx="${R1(l.x)}" cy="${R1(l.y)}" r="${R1(rr)}" fill="url(#${wg})" opacity="${R1(L)}"/>${l.gy?`<ellipse cx="${R1(l.x)}" cy="${R1(l.gy+2)}" rx="${R1(46*l.s)}" ry="${R1(8*l.s)}" fill="#FFE08A" opacity="${R1(.35*L)}"/>`:''}<circle cx="${R1(l.x)}" cy="${R1(l.y)}" r="${R1(rr*.62)}" fill="none" stroke="#FFE7A0" stroke-width="1.6" stroke-dasharray="7 9" opacity="${R1(.75*L)}"/><path d="${rays}" stroke="#FFE7A0" stroke-width="2" stroke-linecap="round" opacity="${R1(.85*L)}"/><path d="${gd}" fill="#FFF2B0" stroke="#4A3A40" stroke-width="1.6" stroke-linejoin="round"/>`)});
    k.bulbs.forEach(([x,y,c])=>add(x,14,`<circle cx="${R1(x)}" cy="${R1(y)}" r="14" fill="url(#${wg})" opacity="${R1(L)}"/><circle cx="${R1(x)}" cy="${R1(y)}" r="4.5" fill="${c}"/>`))}
  k.glints.forEach(([x,y0,y1,col,st])=>{let d='';for(let y=y0;y<y1;y+=6){const t=(y-y0)/(y1-y0),wd=(8+t*34)*(.6+k.r()*.6),ox=k.J(8+t*10);d+=`M${R1(x+ox-wd/2)} ${R1(y)}h${R1(wd)}`}add(x,40,`<path d="${d}" stroke="${col}" stroke-width="2.4" stroke-linecap="round" opacity="${R1(.85*st)}"/>`)});
  if(env.ssn!=='winter')k.flies.forEach(([x,y])=>{const g=glowGrad(k,'#E9FF9A','fly');add(x,12,`<circle cx="${R1(x)}" cy="${R1(y)}" r="11" fill="url(#${g})"/><circle cx="${R1(x)}" cy="${R1(y)}" r="2.4" fill="#F6FFB8"/><path d="M${R1(x-4)} ${R1(y-4)}q-3 -4 -6 -1M${R1(x+4)} ${R1(y-4)}q3 -4 6 -1" fill="none" stroke="#F6FFB8" stroke-width="1" opacity=".7"/>`)});
  });
  return s?`<g pointer-events="none">${s}</g>`:''}
function assemble(k,pp,W,open,wrap){
  const R=s=>k.R(s),lights=k.env.def?'':lightsLayer(k,W,wrap);
  return `${open}<defs>${R(k.defs.join(''))}${k.defs2.join('')}</defs>${R(pp.bg)}${k.sky.join('')}${R(k.out.join(''))}${k.top.length?`<g pointer-events="none">${R(k.top.join(''))}</g>`:''}${lights}${k.xl&&k.xl.length?`<g pointer-events="none">${k.xl.join("")}</g>`:""}${k.hwl.length?`<g pointer-events="none">${k.hwl.join('')}</g>`:''}${k.wl.length?`<g pointer-events="none" class="pa-wn-glow">${k.wl.join('')}</g>`:''}${pp.tooth}</svg>`}
// the view through the shelter window: same sky, a little hill, sun or moon, clouds
function windowView(k,x,y,w,h,o={}){const env=k.env,cid=uid();k.defs.push(`<clipPath id="${cid}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`);
  k.add(`<g clip-path="url(#${cid})">`);const cc=cloudCols(env),show=env.sunny?'full':env.rain?'none':'peek';
  if(env.night){if(env.sunny||env.weather==='cloudy'){const st=k.cap(()=>stars(k,w,4,h*.66,env.sunny?16:5,false));k.add(`<g transform="translate(${x} ${y})">${st}</g>`)}
    if(show!=='none')moon(k,x+w*.72,y+h*.3,15,show==='peek')}
  else if(show!=='none'){const sx=env.low?x+w*.7:x+w*.75,sy=env.low?y+h*.74:y+h*.28;O.sun(k,sx,sy,14,env.time==='dawn'?'#FDD68E':env.time==='dusk'?'#F9AE6E':C.sun)}
  const cl=env.sunny?(env.low?[[x+w*.3,y+h*.3,12]]:[]):env.rain?[[x+w*.25,y+h*.25,18],[x+w*.7,y+h*.2,20],[x+w*.5,y+h*.45,14]]:[[x+w*.28,y+h*.3,14]];
  if(show==='peek')cl.push(env.night?[x+w*.78,y+h*.38,12]:[x+w*.8,y+h*(env.low?.78:.36),13]);
  cl.forEach(([cx,cy,cs])=>cloudV(k,cx,cy,cs,cc));
  const hill=[[x-4,y+h*.84],[x+w*.3,y+h*.74],[x+w*.6,y+h*.8],[x+w+4,y+h*.72],[x+w+4,y+h+4],[x-4,y+h+4]];
  k.fill(hill,env.snow?'#FFFFFF':env.ssn?WIN_HILL[env.ssn][env.night?1:0]:env.night?'#55705E':'#BFDDA0',{dx:0,dy:0});k.pen(hill.slice(0,4),false,{w:1.6,col:env.snow?'#8EA2B8':C.ink});
  if(!env.snow)O.pine(k,x+w*.18,y+h*.86,.32,env.night?'#4C6A5A':C.pine,env.night?'#3A5246':C.pineD);else O.pine(k,x+w*.18,y+h*.86,.32);
  windowSeason(k,x,y,w,h);
  if(o.rainGlass&&env.rain){let d='',dr='';for(let i=0;i<18;i++){const sx=x+6+k.r()*(w-12),sy=y+4+k.r()*h*.75,l=14+k.r()*30;d+=`M${R1(sx)} ${R1(sy)}q${R1(k.J(3))} ${R1(l/2)} ${R1(k.J(2))} ${R1(l)}`;dr+=`<ellipse cx="${R1(sx)}" cy="${R1(sy+l+2)}" rx="2.4" ry="3" fill="#EEF5FA" stroke="#8FA9C0" stroke-width=".9"/>`}
    for(let i=0;i<10;i++){const sx=x+k.r()*w,sy=y+k.r()*h;dr+=`<circle cx="${R1(sx)}" cy="${R1(sy)}" r="${R1(1.2+k.r()*1.4)}" fill="#EEF5FA" stroke="#8FA9C0" stroke-width=".7"/>`}
    k.add(`<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="1.7" stroke-linecap="round" opacity=".8"/>${dr}`)}
  if(o.sillSnow&&env.snow)capLine(k,[[x-2,y+h-2],[x+w+2,y+h-2]],12);
  k.add('</g>')}
/* ---------- scenes ---------- */
function hot(k,attr,val,label,hitPts,inner){// clickable group with a transparent hit shape and a pink dashed hover outline
  const hit=smooth(dense(hitPts,true,30),true);
  k.add(`<g ${attr}="${val}" role="button" tabindex="0" aria-label="${label}"><path class="pa-wc-hit" d="${hit}" fill="#000" fill-opacity="0"/>${inner}<path class="pa-wc-hl" d="${hit}" fill="none" stroke="${C.pink}" stroke-width="4" stroke-dasharray="10 8" stroke-linecap="round"/></g>`);
}
function skyBand(k,W,yb,col=C.sky){k.add(`<rect x="0" y="0" width="${W}" height="${yb}" fill="${col}" fill-opacity=".75"/>`);let d='';for(let y=20;y<yb-10;y+=26){for(let x=0;x<W;x+=180){d+=`M${R1(x+k.r()*40)} ${R1(y+k.J(4))}h${R1(60+k.r()*70)}`}}k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="4" stroke-opacity=".32" stroke-linecap="round"/>`)}
const mOut=(k,pts,col,w=1.5)=>{k.add(`<path d="M${pts.map(p=>R1(p[0]+k.J(.8))+' '+R1(p[1]+k.J(.8))).join('L')}Z" fill="${col}" stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"/>`)};
function mHouse(k,x,y,s,wall,roof){mOut(k,RC(x-15*s,y-12*s,30*s,24*s),wall);mOut(k,[[x-19*s,y-11*s],[x,y-28*s],[x+19*s,y-11*s]],roof);k.add(`<rect x="${R1(x-4*s)}" y="${R1(y)}" width="${R1(7*s)}" height="${R1(12*s)}" fill="${C.ink}" opacity=".55"/>`)}
function mTree(k,x,y,s,col){const so=k.so,h=hashXY(x,y);if(so==='autumn')col=AU[h%3][0];else if(so==='winter')col='#D6CABD';else if(so==='spring'&&h%3===0)col='#F7C6D3';// v2.5
  k.add(`<path d="M${x} ${R1(y+10*s)}V${y}" stroke="${C.trunkD}" stroke-width="2"/><path d="${smooth(blobP(x,y-6*s,14*s,12*s,k.r,8,.18),true)}" fill="${col||C.leaf}" stroke="${C.ink}" stroke-width="1.4"/>`);
  if(so==='winter')k.ss(()=>k.add(`<path d="M${x} ${R1(y-2*s)}l${R1(-6*s)} ${R1(-8*s)}M${x} ${R1(y-4*s)}l${R1(5*s)} ${R1(-9*s)}M${x} ${R1(y-6*s)}v${R1(-9*s)}" stroke="${C.trunkD}" stroke-width="1.3" stroke-linecap="round"/>`))}
function mPine(k,x,y,s,col){k.add(`<path d="M${x} ${y}v${R1(6*s)}" stroke="${C.trunkD}" stroke-width="2"/>`);mOut(k,[[x-14*s,y],[x+k.J(1),y-34*s],[x+14*s,y]],col||C.pine,1.4)}
/* ---------- more helpers copied from world C ---------- */
function waterGlints(k,x,y0,y1){const e=k.env;if(e.rain)return;
  if(e.night)k.glints.push([x,y0,y1,'#FFF2B8',e.sunny?1:.45]);else if(e.low)k.glints.push([x,y0,y1,e.time==='dawn'?'#FFE7C0':'#FFD49A',e.sunny?.9:.4])}
const per=(x,amps)=>amps.reduce((s,[a,n,ph])=>s+a*Math.sin(x/1200*Math.PI*2*n+ph),0);// periodic over 1200
function duck(k,x,y,s,col){k.add(`<ellipse cx="${x}" cy="${R1(y+3*s)}" rx="${R1(22*s)}" ry="${R1(4*s)}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>`);
  k.shape([[x-16*s,y-2*s],[x-21*s,y-11*s],[x-10*s,y-8*s],[x+4*s,y-10*s],[x+14*s,y-6*s],[x+14*s,y+2*s],[x-10*s,y+3*s]],col,{w:1.8});
  k.shape(E(x+12*s,y-16*s,7*s,7*s,10),col,{w:1.7});
  k.add(`<path d="M${R1(x+18*s)} ${R1(y-17*s)}l${R1(8*s)} ${R1(2*s)} ${R1(-8*s)} ${R1(3*s)}z" fill="${C.orange}" stroke="${C.ink}" stroke-width="1.1" stroke-linejoin="round"/><circle cx="${R1(x+14*s)}" cy="${R1(y-18*s)}" r="${R1(1.3*s+.4)}" fill="${C.ink}"/>`);
  k.line([[x-8*s,y-5*s],[x+2*s,y-3*s],[x+7*s,y-7*s]],1.3)}
const wnAttrs=e=>(e.lt?' data-lights="1"':'')+(e.ny?' data-newyear="1"':'')+(e.jp?' data-jp="1"':'');// v2.8
const wnKey=e=>(e.lt?'|lt':'')+(e.ny?'|ny':'')+(e.jp?'|jp':'');
function lighten(k){const pen0=k.pen;k.pen=(pts,closed,o={})=>{if(!o.step){let L=0;const n=pts.length,m=closed?n:n-1;for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n];L+=Math.hypot(b[0]-a[0],b[1]-a[1])}if(L>260)o=Object.assign({},o,{step:L>1200?15:L>600?12:9})}return pen0(pts,closed,o)}}
function tinyLit(k,x,y){if(k.env.lit)k.xl.push(`<rect x="${R1(x-1.8)}" y="${R1(y-1.6)}" width="3.6" height="3.2" fill="#FFE27A" opacity="${R1(.95*k.env.lit)}"/><circle cx="${R1(x)}" cy="${R1(y)}" r="6" fill="#FFD36E" opacity="${R1(.22*k.env.lit)}"/>`)}
function gull(k,x,y,s=1,flip){const f=flip?-1:1,X=v=>x+v*s*f,Y=v=>y+v*s;
  k.line([[X(-4),Y(0)],[X(-3),Y(-12)]],1.6,'#E8945A');k.line([[X(5),Y(0)],[X(4),Y(-12)]],1.6,'#E8945A');
  k.shape([[X(-20),Y(-22)],[X(-8),Y(-30)],[X(10),Y(-30)],[X(18),Y(-22)],[X(12),Y(-12)],[X(-6),Y(-11)],[X(-27),Y(-15)]],'#FFFFFF',{w:1.7,one:1});
  k.shape([[X(-22),Y(-19)],[X(-4),Y(-27)],[X(8),Y(-21)],[X(-6),Y(-15)]],'#BFC8D2',{w:1.2,one:1});
  k.shape(E(X(13),Y(-36),8*s,7*s,10),'#FFFFFF',{w:1.6,one:1});
  k.add(`<path d="M${R1(X(20))} ${R1(Y(-37))}l${R1(9*s*f)} ${R1(2*s)} ${R1(-9*s*f)} ${R1(3*s)}z" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1.1" stroke-linejoin="round"/><circle cx="${R1(X(15))}" cy="${R1(Y(-37.5))}" r="${R1(1.3*s+.3)}" fill="${C.ink}"/><path d="M${R1(X(11))} ${R1(Y(-42))}l${R1(7*s*f)} ${R1(2.4*s)}" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round"/>`)}
function crate(k,x,y,w,h,lab){k.shape(RC(x,y,w,h),'#E2B98A',{w:2,hatch:{side:.75,gap:4.5,col:'#C29468',op:.5}});
  k.line([[x+3,y+h/3],[x+w-3,y+h/3+k.J(1)]],1.1,'#B5875C');k.line([[x+3,y+h*2/3],[x+w-3,y+h*2/3+k.J(1)]],1.1,'#B5875C');k.line([[x+5,y+h-5],[x+w-5,y+5]],2,'#B5875C',{op:.8});
  if(lab){const lw=Math.min(w*.8,lab.length*7+14);k.shape(RC(x+w/2-lw/2,y+h*.36,lw,h*.28),'#FFFBF3',{w:1.2,one:1});k.text(lab,x+w/2,y+h*.36+h*.22,Math.min(15,h*.22))}
  if(k.env.snow)k.side(()=>capLine(k,[[x-1,y],[x+w+1,y]],5))}
function beamGrad(k,x0,x1){const id=uid();k.defs2.push(`<linearGradient id="${id}" x1="${x0}" y1="0" x2="${x1}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFF0A8" stop-opacity=".75"/><stop offset=".5" stop-color="#FFE58A" stop-opacity=".3"/><stop offset="1" stop-color="#FFE58A" stop-opacity="0"/></linearGradient>`);return id}
const fl=(k,list,s=5)=>list.forEach(f=>O.flower(k,f[0],f[1],s,f[2]));
const LTC=['#F7D24E','#F28FA5','#9CCB80','#8FC1E8','#F8A95E'];// bulb crayons: yellow, pink, green, blue, orange
const sagP=(x0,y0,x1,y1,s,n=14)=>{const L=[];for(let i=0;i<=n;i++){const t=i/n;L.push([x0+(x1-x0)*t,y0+(y1-y0)*t+Math.sin(Math.PI*t)*s])}return L};
const scallop=(ties,s)=>{let L=[];for(let i=1;i<ties.length;i++){const a=ties[i-1],b=ties[i];L=L.concat(sagP(a[0],a[1],b[0],b[1],s,8).slice(i>1?1:0))}return L};
function wlPush(k,x,str){if(k.wlT)str=`<g transform="${k.wlT}">${str}</g>`;k.wl.push(str);if(k.wrap){if(x<20)k.wl.push(`<g transform="translate(1200 0)">${str}</g>`);if(x>1180)k.wl.push(`<g transform="translate(-1200 0)">${str}</g>`)}}
function ltBulb(k,x,y,col,s=1){const a=k.J(16),r=a*Math.PI/180,bx=x-Math.sin(r)*6*s,by=y+Math.cos(r)*6*s;
  k.add(`<g transform="rotate(${R1(a)} ${R1(x)} ${R1(y)})"><rect x="${R1(x-1.8*s)}" y="${R1(y-.6)}" width="${R1(3.6*s)}" height="${R1(3.2*s)}" fill="#8F8279"/><ellipse cx="${R1(x)}" cy="${R1(y+6*s)}" rx="${R1(3.3*s)}" ry="${R1(4.6*s)}" fill="${col}" stroke="${C.ink}" stroke-width="1"/><path d="M${R1(x-1.3*s)} ${R1(y+4.4*s)}q.4 -1.6 1.6 -2" fill="none" stroke="#FFFFFF" stroke-width="1" opacity=".8"/></g>`);
  const L=k.env.lit;if(L){const g=glowGrad(k,'#FFD877','wnlt');wlPush(k,bx,`<circle cx="${R1(bx)}" cy="${R1(by)}" r="${R1(15*s)}" fill="url(#${g})" opacity="${R1(.95*L)}"/><ellipse cx="${R1(bx)}" cy="${R1(by)}" rx="${R1(2.5*s)}" ry="${R1(3.5*s)}" fill="${mixH(col,'#FFFFFF',.5)}" opacity="${R1(.95*L)}"/>`)}}
function ltString(k,P,gap=26,o={}){k.line(P,1.2,C.ink,{op:.85,amp:.4});let t=gap*(.35+k.r()*.3),i=Math.floor(k.r()*5);
  for(let j=1;j<P.length;j++){const a=P[j-1],b=P[j],L=Math.hypot(b[0]-a[0],b[1]-a[1])||1;while(t<L){const x=a[0]+(b[0]-a[0])*t/L,y=a[1]+(b[1]-a[1])*t/L;if(!(o.skip&&o.skip(x,y)))ltBulb(k,x,y,LTC[i%5],o.s||1);i++;t+=gap}t-=L}}
function ltStar(k,x,y,s=1,thread){if(thread)k.line([[x+k.J(1),y-15*s-thread],[x,y-14*s]],1,C.ink,{op:.75});const p=[];for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5+.06,rr=(j%2?6.2:15)*s*(1+k.J(.06));p.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr])}
  k.shape(p,'#FCE08A',{w:1.6,one:1,hatch:{side:.5,gap:3,col:'#E2B54E',op:.6}});let d='';for(let j=0;j<10;j+=2)d+=`M${R1(x)} ${R1(y)}L${R1(p[j][0])} ${R1(p[j][1])}`;k.add(`<path d="${d}" stroke="#C9973E" stroke-width=".9" opacity=".75"/>`);
  if(k.env.lit){const g=glowGrad(k,'#FFE7A0','wnstar');wlPush(k,x,`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(30*s)}" fill="url(#${g})" opacity="${R1(.75*k.env.lit)}"/>`)}}
function jpShide(k,x,y,s=1){const z=`M${R1(x)} ${R1(y)}v${R1(5*s)}h${R1(4*s)}v${R1(5*s)}h${R1(-4*s)}v${R1(5*s)}h${R1(4*s)}v${R1(4*s)}`;
  k.add(`<path d="${z}" fill="none" stroke="${C.ink}" stroke-width="${R1(4.2*s)}" stroke-linejoin="round"/><path d="${z}" fill="none" stroke="#FFFFFF" stroke-width="${R1(2.4*s)}" stroke-linejoin="round"/>`)}
function nyShime(k,x,y,s=1){
  [-1,1].forEach(d=>{const p=[[x+d*3*s,y],[x+d*19*s,y+7*s],[x+d*27*s,y+17*s],[x+d*15*s,y+13*s]];k.shape(p,'#93C27A',{w:1.1,one:1});k.line([[x+d*4*s,y+2*s],[x+d*23*s,y+13*s]],.9,'#5E8F4E',{amp:.2})});
  let t='';for(let i=-3;i<=3;i++)t+=`M${R1(x+i*1.9*s)} ${R1(y+3*s)}l${R1(i*.9*s)} ${R1((13+Math.abs(i)*1.2)*s)}`;k.add(`<path d="${t}" stroke="#C9A55E" stroke-width="${R1(1.4*s)}" stroke-linecap="round"/>`);
  [-12,12].forEach(dx=>jpShide(k,x+dx*s,y+3*s,s));
  k.shape([[x-17*s,y-3.4*s],[x+17*s,y-3*s],[x+15*s,y+3.6*s],[x-15*s,y+3.4*s]],'#E8CF92',{w:1.3,one:1});
  let d='';for(let i=-14;i<=12;i+=4.4)d+=`M${R1(x+i*s)} ${R1(y+3*s)}l${R1(3*s)} ${R1(-6*s)}`;k.add(`<path d="${d}" stroke="#B48F52" stroke-width="${R1(1.1*s)}" stroke-linecap="round"/>`);
  k.shape(E(x,y+2*s,6.4*s,5.8*s,10),'#F59A3A',{w:1.2,one:1,hatch:{side:.55,gap:2.6,col:'#D9772E',op:.5}});k.shape([[x+1*s,y-3.4*s],[x+7*s,y-7*s],[x+4*s,y-2*s]],'#7FB86A',{w:.9,one:1})}
function nyKite(k,x,y,s,kind,lx,ly){k.line([[x,y+16*s],[(x+lx)/2+k.J(6),(y+ly)/2+18],[lx,ly]],1,C.ink,{op:.55,step:16,amp:.4});
  const tl=[[x,y+18*s],[x+7*s,y+28*s],[x-3*s,y+38*s],[x+5*s,y+48*s],[x-1*s,y+56*s]];k.line(tl,1,C.ink,{op:.8,amp:.3});
  tl.slice(1,4).forEach(([bx,by],i)=>k.add(`<path d="M${R1(bx-4*s)} ${R1(by-2.6*s)}L${R1(bx+4*s)} ${R1(by+2.6*s)}L${R1(bx+4*s)} ${R1(by-2.6*s)}L${R1(bx-4*s)} ${R1(by+2.6*s)}Z" fill="${['#F28FA5','#F7D24E','#8FC1E8'][(i+kind)%3]}" stroke="${C.ink}" stroke-width=".9" stroke-linejoin="round"/>`));
  k.add(`<g transform="rotate(${kind?-12:9} ${R1(x)} ${R1(y)})">`);
  if(kind===0){k.shape(RC(x-14*s,y-19*s,28*s,37*s),'#FFF1D6',{w:1.6,one:1});k.add(`<path d="M${R1(x-14*s)} ${R1(y-19*s)}L${R1(x+14*s)} ${R1(y+18*s)}M${R1(x+14*s)} ${R1(y-19*s)}L${R1(x-14*s)} ${R1(y+18*s)}" stroke="${C.graph}" stroke-width=".9" opacity=".7"/>`);
    k.shape([[x-9*s,y-6*s],[x-7*s,y-15*s],[x-2*s,y-8*s]],'#C9A07A',{w:1,one:1});k.shape([[x+3*s,y-8*s],[x+9*s,y-16*s],[x+10*s,y-5*s]],'#C9A07A',{w:1,one:1});
    k.shape(E(x,y-1*s,9.5*s,8.5*s,12),'#F2B27A',{w:1.3,one:1});k.add(`<circle cx="${R1(x-3.6*s)}" cy="${R1(y-3*s)}" r="${R1(1.4*s)}" fill="${C.ink}"/><circle cx="${R1(x+3.4*s)}" cy="${R1(y-2.4*s)}" r="${R1(1*s)}" fill="${C.ink}"/><ellipse cx="${R1(x)}" cy="${R1(y+1.6*s)}" rx="${R1(1.8*s)}" ry="${R1(1.2*s)}" fill="${C.ink}"/><path d="M${R1(x-3*s)} ${R1(y+4*s)}q${R1(3*s)} ${R1(2.4*s)} ${R1(6*s)} 0" fill="none" stroke="${C.ink}" stroke-width="1"/>`)}
  else{k.shape([[x,y-20*s],[x+14*s,y],[x,y+19*s],[x-14*s,y]],'#BFD9F5',{w:1.6,one:1,hatch:{gap:3.6,col:'#F28FA5',op:.75,w:1.6}});k.add(`<path d="M${R1(x)} ${R1(y-20*s)}V${R1(y+19*s)}M${R1(x-14*s)} ${R1(y)}H${R1(x+14*s)}" stroke="${C.ink}" stroke-width=".9" opacity=".6"/>`)}
  k.add('</g>')}
function nyKites(k,list){const e=k.env;if(e.night||e.time==='dusk'||e.rain)return;k.add('<g class="pa-ny-kites">');list.forEach(([x,y,s,kind,lx,ly])=>{const one=()=>nyKite(k,x,y,s,kind,lx,ly);if(k.wrap)k.wrap(Math.min(x,lx)+Math.abs(x-lx)/2,Math.abs(x-lx)/2+30*s,one);else one()});k.add('</g>')}
function jpGlow(k,x,y,r,f=1){const L=k.env.lit;if(!L||!k.wl)return;const g=glowGrad(k,'#FFD877','jpw');wlPush(k,x,`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(r)}" fill="url(#${g})" opacity="${R1(.9*L*f)}"/>`)}
function nyPine(k,x,y,s,ang){const c=Math.cos(ang),n=Math.sin(ang),L=17*s;k.line([[x,y],[x+c*L,y+n*L]],1.3,'#7A5A3A',{amp:.3});
  let d='';for(let i=1;i<=5;i++){const t=i/5.4,px=x+c*L*t,py=y+n*L*t;for(const sg of[-1,1]){const a=ang+sg*1.1;d+=`M${R1(px)} ${R1(py)}l${R1(Math.cos(a)*7*s)} ${R1(Math.sin(a)*7*s)}`}}
  d+=`M${R1(x+c*L)} ${R1(y+n*L)}l${R1(c*6*s)} ${R1(n*6*s)}`;k.add(`<path d="${d}" stroke="#4F8A5A" stroke-width="${R1(1.6*s)}" stroke-linecap="round"/>`)}
function nyKado(k,x,gy,s=1,f=1){
  [[-15,-40,-2.4],[15,-38,-.7],[-7,-52,-1.9],[9,-54,-1.2],[-19,-30,-2.8],[19,-30,-.3]].forEach(([dx,dy,a])=>nyPine(k,x+dx*s*f,gy+dy*s,s,f>0?a:Math.PI-a));
  [[-8.5,58],[0,78],[8.5,48]].forEach(([dx,h])=>{const sx=x+dx*s*f,top=gy-h*s,bw=7.4*s,hi=top-5*s*f,lo=top+5*s*f,l=f>0?lo:hi,r=f>0?hi:lo;
    k.shape([[sx-bw/2,gy-22*s],[sx-bw/2,l],[sx+bw/2,r],[sx+bw/2,gy-22*s]],'#A2C77F',{w:1.3,one:1,hatch:{side:.6,gap:2.6,col:'#6E9A52',op:.5}});
    k.add(`<ellipse cx="${R1(sx)}" cy="${R1(top)}" rx="${R1(bw*.42)}" ry="${R1(4.4*s)}" transform="rotate(${R1(-56*f)} ${R1(sx)} ${R1(top)})" fill="#F1EAC2" stroke="#9C8B4E" stroke-width=".9"/><path d="M${R1(sx-bw/2)} ${R1(top+h*s*.42)}q${R1(bw/2)} ${R1(2*s)} ${R1(bw)} 0" fill="none" stroke="#5E8A48" stroke-width="1.2"/>`)});
  [[12,-34],[-12,-27],[3,-44]].forEach(([dx,dy],i)=>{const px=x+dx*s*f,py=gy+dy*s,col=i%2?'#FFFFFF':'#E8546A';let d='';for(let j=0;j<5;j++){const a=j*1.2566+.3;d+=`<circle cx="${R1(px+Math.cos(a)*2.2*s)}" cy="${R1(py+Math.sin(a)*2.2*s)}" r="${R1(1.8*s)}"/>`}k.add(`<g fill="${col}" stroke="${C.ink}" stroke-width=".6">${d}</g><circle cx="${R1(px)}" cy="${R1(py)}" r="${R1(1*s)}" fill="#F7C65E"/>`)});
  const sk=[[x-17*s,gy],[x+17*s,gy],[x+14*s,gy-28*s],[x-14*s,gy-28*s]];k.shape(sk,'#E8CF92',{w:1.4,one:1});
  let d='';for(let i=-13;i<=13;i+=3.2)d+=`M${R1(x+i*s)} ${R1(gy-27*s)}L${R1(x+i*1.18*s)} ${R1(gy-1*s)}`;k.add(`<path d="${d}" stroke="#B48F52" stroke-width="${R1(.9*s)}"/>`);
  [gy-22*s,gy-9*s].forEach(y=>k.line([[x-15.5*s,y],[x+15.5*s,y+.6*s]],2.2*s,'#6E5034',{amp:.2}));k.add(`<path d="M${R1(x+2*s)} ${R1(gy-21*s)}l${R1(-3*s)} ${R1(7*s)}M${R1(x+2*s)} ${R1(gy-21*s)}l${R1(3*s)} ${R1(6*s)}" stroke="#6E5034" stroke-width="${R1(1.5*s)}" stroke-linecap="round"/>`);
  if(k.env.snow)capLine(k,[[x-14*s,gy-28*s],[x+14*s,gy-28*s]],4*s)}
function nyChochin(k,x,y,s=1){k.line([[x,y],[x,y+4*s]],1,C.ink,{op:.7,amp:.1});k.shape(RC(x-5*s,y+4*s,10*s,3*s),'#3E3533',{w:.9,one:1});
  k.shape(E(x,y+17*s,8.6*s,10.4*s,14),'#FFF4E6',{w:1.2,one:1});let d='';for(let i=-2;i<=2;i++){const dy=i*3.8*s,hw=8.2*s*Math.sqrt(Math.max(0,1-Math.pow(dy/(10.4*s),2)));d+=`M${R1(x-hw)} ${R1(y+17*s+dy)}h${R1(2*hw)}`}
  k.add(`<path d="${d}" stroke="#D9B48E" stroke-width=".8"/><path d="M${R1(x-8.2*s)} ${R1(y+14.6*s)}h${R1(16.4*s)}v${R1(5*s)}h${R1(-16.4*s)}Z" fill="#E0473A" opacity=".85"/>`);
  k.shape(RC(x-4.6*s,y+26.6*s,9.2*s,2.8*s),'#3E3533',{w:.9,one:1});k.line([[x,y+29.4*s],[x+k.J(.6),y+34*s]],1,'#E0473A',{amp:.1});jpGlow(k,x,y+17*s,20*s)}
function nyChochins(k,x0,y0,x1,y1,sag,n,s=1){const P=sagP(x0,y0,x1,y1,sag,14);k.line(P,1.1,C.ink,{op:.85,amp:.3});for(let i=1;i<=n;i++){const t=i/(n+1);nyChochin(k,x0+(x1-x0)*t,y0+(y1-y0)*t+Math.sin(Math.PI*t)*sag,s)}}
function jpToro(k,x,gy,s=1){const c='#CBC4BA',cd='#A39B90';k.shape([[x-16*s,gy],[x+16*s,gy],[x+12*s,gy-8*s],[x-12*s,gy-8*s]],c,{w:1.4,one:1,hatch:{side:.6,gap:3,col:cd,op:.5}});
  k.shape(RC(x-5*s,gy-37*s,10*s,29*s),c,{w:1.4,one:1,hatch:{side:.6,gap:3,col:cd,op:.5}});k.shape([[x-14*s,gy-37*s],[x+14*s,gy-37*s],[x+11*s,gy-43*s],[x-11*s,gy-43*s]],c,{w:1.3,one:1});
  k.shape(RC(x-11*s,gy-63*s,22*s,20*s),c,{w:1.4,one:1,hatch:{side:.7,gap:3,col:cd,op:.45}});const L=k.env.lit;
  k.shape(RC(x-5*s,gy-59*s,10*s,11*s),L?'#FFD25E':'#6E665E',{w:1,one:1});
  k.shape([[x-23*s,gy-62*s],[x-17*s,gy-69*s],[x-4*s,gy-77*s],[x+4*s,gy-77*s],[x+17*s,gy-69*s],[x+23*s,gy-62*s],[x+25*s,gy-66*s],[x+20*s,gy-64*s],[x-20*s,gy-64*s],[x-25*s,gy-66*s]],c,{w:1.5,one:1,hatch:{side:.62,gap:3,col:cd,op:.55}});
  k.shape(E(x,gy-81*s,4.2*s,4.6*s,10),c,{w:1.2,one:1});k.add(`<path d="M${R1(x)} ${R1(gy-85.6*s)}v${R1(-3*s)}" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round"/><circle cx="${R1(x-6*s)}" cy="${R1(gy-20*s)}" r="${R1(1.6*s)}" fill="#9CB87A" opacity=".8"/><circle cx="${R1(x+7*s)}" cy="${R1(gy-4*s)}" r="${R1(2*s)}" fill="#9CB87A" opacity=".7"/>`);
  if(L){wlPush(k,x,`<rect x="${R1(x-5*s)}" y="${R1(gy-59*s)}" width="${R1(10*s)}" height="${R1(11*s)}" fill="#FFE9A0" opacity="${R1(.9*L)}"/>`);jpGlow(k,x,gy-53*s,30*s)}
  if(k.env.snow)capLine(k,[[x-24*s,gy-64*s],[x-4*s,gy-77*s],[x+4*s,gy-77*s],[x+24*s,gy-64*s]],5*s)}
function skFlowerD(x,y,r,a){let d='';for(let i=0;i<5;i++){const b=a+i*Math.PI*.4,c=Math.cos(b),n=Math.sin(b),P=(u,v)=>`${R1(x+u*c-v*n)} ${R1(y+u*n+v*c)}`;d+=`M${P(r*.1,0)}Q${P(r*.42,-r*.56)} ${P(r,-r*.24)}L${P(r*.78,0)}L${P(r,r*.24)}Q${P(r*.42,r*.56)} ${P(r*.1,0)}Z`}return d}
function jpBlossom(k,cx,cy,rx,ry,n,s=1){let d1='',d2='',dc='';for(let i=0;i<n;i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r()),x=cx+Math.cos(a)*rx*rr,y=cy+Math.sin(a)*ry*rr,r=(3.3+k.r()*1.6)*s,d=skFlowerD(x,y,r,k.r()*1.3);if(i%3)d1+=d;else d2+=d;dc+=`M${R1(x)} ${R1(y)}h.1`}
  k.add(`<path d="${d1}" fill="#FFF3F6" stroke="#D68CA0" stroke-width=".7"/><path d="${d2}" fill="#F7B6C8" stroke="#C97A90" stroke-width=".7"/><path d="${dc}" stroke="#E0697F" stroke-width="${R1(1.9*s)}" stroke-linecap="round"/>`)}
function jpPuffs(k,cx,cy,rx,ry,col,colD,flowers){[[-.42,.14,.6,.6],[.44,.16,.6,.58],[0,-.28,.7,.64],[-.06,.3,.5,.44]].forEach(([dx,dy,fx,fy])=>{const p=blobP(cx+dx*rx,cy+dy*ry,rx*fx,ry*fy,k.r,10,.2);k.fill(p,col);k.hatch(p,{side:.45,gap:4.5,col:colD,op:.55,w:1.2});k.pen(p,true,{w:1.7})});
  if(flowers)jpBlossom(k,cx,cy,rx*.9,ry*.85,Math.max(5,Math.round(rx*ry/75)),Math.min(1.2,Math.max(.7,rx/60)))}
function jpSakuraTree(k,x,gy,s=1){k.shape([[x-4*s,gy],[x-3*s,gy-30*s],[x+3*s,gy-30*s],[x+4.4*s,gy]],'#8A6A5A',{w:1.4,one:1});k.line([[x,gy-24*s],[x-12*s,gy-40*s]],1.6,'#6E5246');k.line([[x+1*s,gy-26*s],[x+13*s,gy-42*s]],1.6,'#6E5246');
  jpPuffs(k,x,gy-48*s,32*s,22*s,'#F9D3DE','#E9A2B8',1)}
const MOMI=['#D9462F','#E8623A','#C93A2A','#F08A3A'];
const MJ_L=[[0,1],[.66,.9],[-.66,.9],[1.3,.7],[-1.3,.7],[2.02,.42],[-2.02,.42]].sort((a,b)=>a[0]-b[0]);
function momijiAt(k,x,y,s,rot,col){const P=(a,r)=>{const b=rot-Math.PI/2+a;return R1(x+Math.cos(b)*r*s)+' '+R1(y+Math.sin(b)*r*s)},hw=.28,pts=[];
  MJ_L.forEach(([a,L],i)=>{const w=hw*(.7+L*.3);pts.push(P(a-w*1.05,.3),P(a-w*.8,.3+(L-.3)*.4),P(a-w*.94,.3+(L-.3)*.48),P(a-w*.46,.3+(L-.3)*.76),P(a-w*.56,.3+(L-.3)*.82),P(a,L),P(a+w*.56,.3+(L-.3)*.82),P(a+w*.46,.3+(L-.3)*.76),P(a+w*.94,.3+(L-.3)*.48),P(a+w*.8,.3+(L-.3)*.4))});
  pts.push(P(Math.PI,.2));const st=rot+Math.PI/2;
  k.add(`<path d="M${pts.join('L')}Z" fill="${col}" stroke="${C.ink}" stroke-width=".6" stroke-linejoin="round"/><path d="M${R1(x)} ${R1(y)}L${R1(x+Math.cos(st)*.95*s)} ${R1(y+Math.sin(st)*.95*s)}" stroke="${C.ink}" stroke-width="1" stroke-linecap="round"/>`)}
function jpMomiji(k,cx,cy,rx,ry,n,s=1){for(let i=0;i<n;i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r());momijiAt(k,cx+Math.cos(a)*rx*rr,cy+Math.sin(a)*ry*rr,(5+k.r()*2.6)*s,k.J(.8),MOMI[i%4])}}
function kite(k,x,y,s,c1,c2,ang=0,strTo){k.add(`<g transform="rotate(${ang} ${x} ${y})">`);const p=[[x,y-30*s],[x+20*s,y-4*s],[x,y+34*s],[x-20*s,y-4*s]];
  k.fill([[x,y-30*s],[x+20*s,y-4*s],[x,y-4*s]],c2,{dx:.5,dy:.5});k.fill([[x,y-4*s],[x-20*s,y-4*s],[x,y+34*s]],c2,{dx:.5,dy:.5});k.fill([[x,y-30*s],[x-20*s,y-4*s],[x,y-4*s]],c1,{dx:.5,dy:.5});k.fill([[x,y-4*s],[x+20*s,y-4*s],[x,y+34*s]],c1,{dx:.5,dy:.5});
  k.pen(p,true,{w:1.9});k.line([[x,y-28*s],[x,y+32*s]],1.1);k.line([[x-18*s,y-4*s],[x+18*s,y-4*s]],1.1);
  const tl=[];for(let i=0;i<=8;i++)tl.push([x+Math.sin(i*.9)*7*s,y+34*s+i*8*s]);k.line(tl,1.3);[2,5,8].forEach((i,j)=>{const q=tl[i];k.add(`<path d="M${R1(q[0]-6*s)} ${R1(q[1]-4*s)}L${R1(q[0])} ${R1(q[1])}L${R1(q[0]-6*s)} ${R1(q[1]+4*s)}ZM${R1(q[0]+6*s)} ${R1(q[1]-4*s)}L${R1(q[0])} ${R1(q[1])}L${R1(q[0]+6*s)} ${R1(q[1]+4*s)}Z" fill="${[C.pink,C.yellow,C.mint][j]}" stroke="${C.ink}" stroke-width="1"/>`)});
  k.add('</g>');if(strTo)k.line([[x,y+4*s],[(x+strTo[0])/2,(y+strTo[1])/2+30],strTo],1,C.graph,{op:.9})}
const MINE={},PROPS={},ITEMS={};

/* ======================= world G: shared helpers ======================= */
const dk=c=>mixH(c,'#5B3D32',.22),lite=c=>mixH(c,'#FFFFFF',.42),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// the floors: back line, front line, depth scale (outdoors 0.5 at the back to 1.05 at the front, the storefront pavements from 0.62)
const FL={training:{w:1600,back:340,front:592,kB:.5,kF:1.05},pool:{w:1600,back:356,front:592,kB:.5,kF:1.05},
  boutique:{w:1000,back:348,front:594,kB:.55,kF:1.05},builder:{w:1000,back:348,front:594,kB:.55,kF:1.05},sprout:{w:1000,back:348,front:594,kB:.55,kF:1.05},
  sunflower:{w:1600,back:358,front:592,kB:.5,kF:1.05},bamboo:{w:1600,back:356,front:592,kB:.5,kF:1.05},cliffs:{w:1600,back:362,front:592,kB:.5,kF:1.05}};
const dep=(F,y)=>F.kB+(F.kF-F.kB)*clamp((y-F.back)/(F.front-F.back),0,1);
// snow on a top edge: thick when it snows, a light dusting all winter (on the season stream, so summer stays the same)
function snowOn(k,pts,th){if(k.env.snow)k.side(()=>capLine(k,pts,th));else if(k.so==='winter')k.ss(()=>capLine(k,pts,th*.6))}
function frostOn(k,pts){if(k.so==='winter')k.ss(()=>frostLine(k,pts))}
function shade(k,x,y,rx,ry){k.add(`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(rx)}" ry="${R1(ry||rx*.18)}" fill="${C.ink}" opacity=".12"/>`)}
function tuftsG(k,x0,x1,y0,y1,n,ok,col=C.grassD){let d='';for(let i=0;i<n;i++){const x=x0+k.r()*(x1-x0),y=y0+k.r()*(y1-y0);if(ok&&!ok(x,y))continue;const s=.55+.6*(y-y0)/Math.max(1,y1-y0);
  d+=`M${R1(x)} ${R1(y)}q${R1(s)} ${R1(-6*s)} ${R1(-s)} ${R1(-10*s)}M${R1(x+5*s)} ${R1(y)}q0 ${R1(-7*s)} ${R1(3*s)} ${R1(-12*s)}`}k.add(`<path d="${d}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round"/>`)}
function pebbles(k,x0,x1,y0,y1,n,col){let s='';for(let i=0;i<n;i++){const y=y0+k.r()*(y1-y0),f=.6+.6*(y-y0)/Math.max(1,y1-y0);s+=`<ellipse cx="${R1(x0+k.r()*(x1-x0))}" cy="${R1(y)}" rx="${R1((1.6+k.r()*1.8)*f)}" ry="${R1(1.2*f)}" fill="${col}"/>`}k.add(s)}
function pawTrail(k,list,col){let s='';list.forEach(([x,y,f],i)=>{const o=i%2?5*f:-5*f;s+=`<ellipse cx="${R1(x)}" cy="${R1(y+o)}" rx="${R1(3.4*f)}" ry="${R1(2.6*f)}" fill="${col}"/><circle cx="${R1(x-3*f)}" cy="${R1(y+o-4*f)}" r="${R1(1.2*f)}" fill="${col}"/><circle cx="${R1(x)}" cy="${R1(y+o-5*f)}" r="${R1(1.2*f)}" fill="${col}"/><circle cx="${R1(x+3*f)}" cy="${R1(y+o-4*f)}" r="${R1(1.2*f)}" fill="${col}"/>`});k.add(s)}
function fxG(k,W,o){const e=k.env;
  if(e.rain){if(o.sheen)sheen(k,0,W,o.sheen[0],o.sheen[1],Math.round(W/15),o.avoid||[]);(o.puddles||[]).forEach(q=>puddle(k,...q))}
  if(e.snow)(o.patches||[]).forEach(q=>snowPatch(k,...q));
  if(e.night&&!e.rain&&o.flies)o.flies.forEach(f=>k.flies.push(f))}
// winter without snowy weather still leaves old snow on the ground (the season stream)
function winterSnow(k,list){if(k.so==='winter'&&!k.env.snow)k.ss(()=>list.forEach(([x,y,rx,ry])=>{const p=blobP(x,y,rx,ry,k.r,10,.3);k.fill(p,'#FFFFFF',{dx:0,dy:0,op:.85});k.pen(p,true,{w:1.1,amp:.5,col:'#B4C4D4',one:1})}))}
function skyG(k,W,yb,c){k.skyD(()=>{skyBand(k,W,yb);O.sun(k,c.sun[0],c.sun[1],c.sun[2]);c.clouds.slice(0,3).forEach(q=>O.cloud(k,q[0],q[1],q[2]));(c.birds||[]).forEach(q=>O.bird(k,q[0],q[1],q[2]))},
  Object.assign({W,H:yb+10,stars:Math.round(W/24)},c))}
function jpFuji(k,cx,by,w){if(PA.JP&&typeof PA.JP.fuji==='function')k.jp(()=>PA.JP.fuji(k,{cx,by,w}))}
// a far band of hills (pts left to right), filled to y yb, outlined in graphite
function hills(k,W,pts,yb,col){k.fill(pts.concat([[W,yb],[0,yb]]),col,{dx:0,dy:0,sc:0});k.pen(pts,false,{w:1.6,col:C.graph})}
function farTrees(k,list){list.forEach(([x,y,s,col])=>{k.line([[x,y+8*s],[x,y+22*s]],1.4,C.trunkD);const so=k.so,c=so==='autumn'?AU[hashXY(x,y)%3][0]:so==='winter'?'#D6CABD':col||'#C3DFA5';
  k.shape(E(x,y,(16+k.r()*5)*s,(13+k.r()*3)*s,10),c,{w:1.3,lcol:C.graph,one:1});if(so==='winter')k.ss(()=>capLine(k,[[x-14*s,y-6*s],[x,y-13*s],[x+14*s,y-6*s]],3*s))})}
// a little house far away (roof, wall, door)
function farHouse(k,x,y,s,wall,roof){mOut(k,RC(x-15*s,y-12*s,30*s,24*s),wall);mOut(k,[[x-19*s,y-11*s],[x,y-28*s],[x+19*s,y-11*s]],roof);k.add(`<rect x="${R1(x-4*s)}" y="${R1(y)}" width="${R1(7*s)}" height="${R1(12*s)}" fill="${C.ink}" opacity=".55"/>`);tinyLit(k,x+7*s,y-4*s)}
// sagging rope between posts [x, groundY, scale] (post height h at scale 1)
function ropeFence(k,posts,h,o={}){const col=o.col||C.woodD,rope=o.rope||'#EAD2A0';
  [.9,.5].forEach(f=>{for(let i=1;i<posts.length;i++){const a=posts[i-1],b=posts[i],s=(a[2]+b[2])/2;const P=sagP(a[0],a[1]-h*a[2]*f,b[0],b[1]-h*b[2]*f,7*s,10);k.line(P,R1(3.2*s+.6),C.ink,{amp:.3});k.line(P,R1(1.7*s+.3),rope,{amp:.2})}});
  posts.forEach(([x,y,s])=>{k.shape([[x-4.5*s,y],[x-4*s,y-h*s],[x+4*s,y-h*s],[x+4.5*s,y]],col,{w:R1(1.4*Math.max(.7,s)),one:1,hatch:{side:.6,gap:3,col:dk(col),op:.4}});
    k.add(`<ellipse cx="${R1(x)}" cy="${R1(y-h*s)}" rx="${R1(5*s)}" ry="${R1(2.6*s)}" fill="${lite(col)}" stroke="${C.ink}" stroke-width="1.1"/>`);snowOn(k,[[x-6*s,y-h*s],[x+6*s,y-h*s]],4*s)});
  if(o.lt)k.lt(()=>{for(let i=1;i<posts.length;i++){const a=posts[i-1],b=posts[i];ltString(k,sagP(a[0],a[1]-h*a[2]-4,b[0],b[1]-h*b[2]-4,6,8),20)}})}
// bunting from tie to tie (pts), triangles alternating cols
function buntingG(k,ties,sag,cols,size=1){let n=0;for(let i=1;i<ties.length;i++){const a=ties[i-1],b=ties[i],P=sagP(a[0],a[1],b[0],b[1],sag,12);k.line(P,1.3,C.ink,{amp:.3});
  const m=Math.max(2,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/(34*size)));for(let j=0;j<m;j++){const t0=(j+.15)/m,t1=(j+.85)/m,tm=(j+.5)/m,pt=t=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+Math.sin(Math.PI*t)*sag];
    const p0=pt(t0),p1=pt(t1),pm=pt(tm);k.shape([p0,p1,[pm[0],pm[1]+20*size]],cols[n++%cols.length],{w:1.3,one:1})}}}
// perspective paving: rows grow toward the viewer, joints run to a vanishing point
function paveG(k,W,y0,y1,vx,vy,col,tint,h0=13){let d='',f='';const rows=[];let y=y0,h=h0;while(y<y1){rows.push(y);y+=h;h*=1.16}rows.push(y1+20);
  rows.forEach(yy=>{d+=`M0 ${R1(yy+k.J(1))}L${W} ${R1(yy+k.J(1))}`});
  for(let i=0;i<rows.length-1;i++){const ya=rows[i],yb=rows[i+1],sp=(yb-ya)*3.3,off=(i%2)*sp/2;let px=null;
    for(let x=-sp+off;x<W+sp;x+=sp){const xb=x+k.J(sp*.08),xa=vx+(xb-vx)*(ya-vy)/(yb-vy);d+=`M${R1(xa)} ${R1(ya)}L${R1(xb)} ${R1(yb)}`;
      if(px&&k.r()<.16)f+=`M${R1(px[0])} ${R1(ya)}L${R1(xa)} ${R1(ya)}L${R1(xb)} ${R1(yb)}L${R1(px[1])} ${R1(yb)}Z`;px=[xa,xb]}}
  k.add(`<path d="${f}" fill="${tint}" opacity=".7"/><path d="${d}" stroke="${col}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/>`)}
// a wooden bench seen from the front (O.bench), with its season dress
function benchG(k,x,gy,s){shade(k,x,gy+2,54*s);O.bench(k,x,gy,s);frostOn(k,[[x-49*s,gy-69*s],[x+49*s,gy-69*s]])}
// a water bowl on the ground
function bowlG(k,x,gy,s,col=C.blue){shade(k,x,gy+2,26*s);k.shape([[x-22*s,gy],[x+22*s,gy],[x+18*s,gy-14*s],[x-18*s,gy-14*s]],col,{w:1.7,one:1,hatch:{side:.6,gap:3.5,col:dk(col),op:.45}});
  k.fill(E(x,gy-14*s,17*s,4.4*s,12),k.so==='winter'?'#E6EEF5':C.water,{dx:0,dy:0});k.add(`<path d="M${R1(x-8*s)} ${R1(gy-15*s)}q4 -2 8 0" stroke="#fff" stroke-width="1.4" fill="none"/>`);
  O.heart(k,x,gy-7*s,3.2*s,'#FFFFFF')}
// the checkered start arch (the run gate): two posts, a checkered banner, pennants and a paw disc. Returns the hit box.
function startArch(k,x,gy,s,col,o={}){const w=170*s,h=176*s,x0=x-w/2,x1=x+w/2,bw=w+34*s,bx=x-bw/2,by=gy-h-8*s,bh=36*s;
  shade(k,x,gy+2,w*.6,6*s);
  [x0,x1].forEach(px=>{k.shape([[px-7*s,gy],[px-6*s,gy-h],[px+6*s,gy-h],[px+7*s,gy]],col,{w:1.9,hatch:{side:.6,gap:3.5,col:dk(col),op:.5}});
    for(let y=gy-h+22*s;y<gy-8*s;y+=30*s)k.line([[px-6*s,y],[px+6*s,y+6*s]],1.2,C.ink,{op:.45});
    k.shape(RC(px-11*s,gy-10*s,22*s,10*s),C.stoneD,{w:1.4,one:1})});
  // the banner: a wobbly checker board
  const n=12,cw=bw/n;let d='';for(let i=0;i<n;i++)for(let j=0;j<2;j++)if((i+j)%2===0){const qx=bx+i*cw,qy=by+j*bh/2;d+=`M${R1(qx+k.J(.5))} ${R1(qy+k.J(.5))}h${R1(cw)}v${R1(bh/2)}h${R1(-cw)}z`}
  k.fill(RC(bx,by,bw,bh),'#FFFFFF',{dx:0,dy:0});k.add(`<path d="${d}" fill="${C.ink}" opacity=".82"/>`);k.pen(RC(bx,by,bw,bh),true,{w:2});
  // pennants on the top corners and a round paw disc in the middle
  [[bx+4*s,1],[bx+bw-4*s,-1]].forEach(([px,f],i)=>{k.line([[px,by],[px,by-34*s]],2,C.ink);k.shape([[px,by-34*s],[px+f*30*s,by-27*s],[px,by-20*s]],i?C.pink:C.yellow,{w:1.4,one:1})});
  k.shape(E(x,by-10*s,20*s,20*s,14),o.disc||C.yellow,{w:1.8,hatch:{side:.6,gap:3,col:dk(o.disc||C.yellow),op:.4}});
  k.add(`<g fill="${C.ink}"><ellipse cx="${R1(x)}" cy="${R1(by-6*s)}" rx="${R1(6*s)}" ry="${R1(5*s)}"/><circle cx="${R1(x-7*s)}" cy="${R1(by-14*s)}" r="${R1(2.4*s)}"/><circle cx="${R1(x-2.4*s)}" cy="${R1(by-18*s)}" r="${R1(2.4*s)}"/><circle cx="${R1(x+2.4*s)}" cy="${R1(by-18*s)}" r="${R1(2.4*s)}"/><circle cx="${R1(x+7*s)}" cy="${R1(by-14*s)}" r="${R1(2.4*s)}"/></g>`);
  snowOn(k,[[bx-2,by],[bx+bw+2,by]],7*s);frostOn(k,[[bx,by+1],[bx+bw,by+1]]);
  k.lt(()=>ltString(k,sagP(bx,by+bh+2,bx+bw,by+bh+2,10*s,12),18));
  k.ny(()=>{nyShime(k,x,by+bh+4*s,.8*s);nyKado(k,x0-26*s,gy,.7*s,1);nyKado(k,x1+26*s,gy,.7*s,-1)});
  k.hw(()=>{hwJack(k,x0-24*s,gy,.9*s);hwJack(k,x1+22*s,gy,.75*s);hwBatString(k,bx,bx+bw,by+bh+6*s,10*s,5,.7*s)});
  return RC(bx-6*s,by-40*s,bw+12*s,gy-by+44*s)}
// wraps every floor prop in its own group; out() writes them sorted by base y inside #floorG
function floorKit(k){const P=[];return {add(id,base,fn){P.push([base,`<g data-fy="${R1(base)}" data-prop="${id}">`+k.cap(fn)+'</g>'])},
  out(){P.sort((a,b)=>a[0]-b[0]);k.add('<g id="floorG">'+P.map(p=>p[1]).join('')+'</g>')}}}
function seasonBits(k,o){k.ss(()=>{if(o.drift)seasonDrift(k,o.drift);const e=k.env;if(k.so==='winter'&&!e.night&&o.robin)robin(k,o.robin[0],o.robin[1],o.robin[2]||1,1);
  if(k.so==='spring'&&!e.night&&!e.rain&&o.fly)butterfly(k,o.fly[0],o.fly[1],1,'#F9C6D4')})}

/* ======================= Training Ground ======================= */
// the arena: a sandy oval (cx, cy, rx, ry) inside the grass
const TR_OV=[800,470,768,126];
const inOv=(x,y,m=0)=>Math.pow((x-TR_OV[0])/(TR_OV[2]+m),2)+Math.pow((y-TR_OV[1])/(TR_OV[3]+m),2)<1;
function weavePoles(k,x0,gy,s){const n=6,gap=46,h=128*s;k.shape([[x0-14,gy+3*s],[x0+(n-1)*gap+14,gy+3*s],[x0+(n-1)*gap+12,gy-5*s],[x0-12,gy-5*s]],C.wood,{w:1.5,one:1,hatch:{side:.6,gap:3.5,col:C.woodD,op:.5}});
  for(let i=0;i<n;i++){const x=x0+i*gap;k.shape(RC(x-3.6*s,gy-h,7.2*s,h),'#FFFFFF',{w:1.4,one:1,dx:0,dy:0});
    let d='';for(let y=gy-h+4*s;y<gy-14*s;y+=26*s)d+=`M${R1(x-3.4*s)} ${R1(y)}h${R1(6.8*s)}v${R1(13*s)}h${R1(-6.8*s)}z`;k.add(`<path d="${d}" fill="#E8677A"/>`);
    k.line([[x+3.6*s,gy-h+2],[x+3.6*s,gy-2]],1,C.ink,{op:.45});k.add(`<circle cx="${R1(x)}" cy="${R1(gy-h-2*s)}" r="${R1(4.4*s)}" fill="#F7D24E" stroke="${C.ink}" stroke-width="1.2"/>`);snowOn(k,[[x-5*s,gy-h-3*s],[x+5*s,gy-h-3*s]],3.5*s)}
  // two little cones at the entry
  [[x0-34,gy+4*s],[x0+(n-1)*gap+34,gy+4*s]].forEach(([cx,cy])=>{k.shape([[cx-9*s,cy],[cx+9*s,cy],[cx+3*s,cy-24*s],[cx-3*s,cy-24*s]],C.orange,{w:1.4,one:1});k.add(`<path d="M${R1(cx-6*s)} ${R1(cy-10*s)}h${R1(12*s)}" stroke="#fff" stroke-width="${R1(3*s)}"/>`);k.shape(RC(cx-12*s,cy-3*s,24*s,4*s),'#E8955A',{w:1.1,one:1})});
  snowOn(k,[[x0-12,gy-5*s],[x0+(n-1)*gap+12,gy-5*s]],4*s)}
function pauseTable(k,x,gy,s){const top=gy-50*s;shade(k,x,gy+2,52*s);
  [[-38,0],[38,0],[-30,-12],[30,-12]].forEach(([dx,dy],i)=>k.shape(RC(x+dx*s-3*s,top+dy*s,6*s,gy-top-(i>1?14*s:0)),C.woodD,{w:1.3,one:1}));
  const tp=[[x-46*s,top],[x+46*s,top],[x+38*s,top-14*s],[x-38*s,top-14*s]];k.shape(tp,'#8FB6E3',{w:1.8,hatch:{side:.6,gap:3.5,col:'#6F96C6',op:.45}});
  k.shape(RC(x-46*s,top,92*s,10*s),'#6F96C6',{w:1.7,one:1});k.add(`<g fill="#FFFFFF" opacity=".9"><ellipse cx="${R1(x)}" cy="${R1(top-6*s)}" rx="${R1(6*s)}" ry="${R1(3.2*s)}"/><circle cx="${R1(x-6*s)}" cy="${R1(top-10*s)}" r="${R1(1.8*s)}"/><circle cx="${R1(x)}" cy="${R1(top-12*s)}" r="${R1(1.8*s)}"/><circle cx="${R1(x+6*s)}" cy="${R1(top-10*s)}" r="${R1(1.8*s)}"/></g>`);
  snowOn(k,[[x-46*s,top],[x-38*s,top-14*s],[x+38*s,top-14*s],[x+46*s,top]],5*s);k.hw(()=>hwJack(k,x+30*s,top-4*s,.6*s))}
function tunnel(k,x0,x1,gy,s){const h=72*s,top=gy-h;shade(k,(x0+x1)/2,gy+3,(x1-x0)*.56,8*s);
  const body=[[x0,gy],[x0,top+18*s],[x0+16*s,top+2*s],[x0+60*s,top-2*s],[x1-60*s,top-2*s],[x1-16*s,top+2*s],[x1,top+18*s],[x1,gy]];
  k.shape(body,C.blue,{w:2.3,hatch:{side:.5,gap:5,col:'#8FAFD6',op:.6}});
  for(let x=x0+26*s;x<x1-14*s;x+=26*s){k.line([[x,top+2*s],[x+2*s,gy-2]],2.4,'#FFFFFF',{op:.85,amp:.4});k.line([[x+2.4*s,top+3*s],[x+4.4*s,gy-2]],1,C.ink,{op:.5,amp:.3})}
  [[x0,1],[x1,-1]].forEach(([ex,f])=>{k.shape(E(ex,gy-h*.48,15*s,h*.5,14),'#4A5874',{w:2.2});k.add(`<ellipse cx="${R1(ex)}" cy="${R1(gy-h*.48)}" rx="${R1(15*s)}" ry="${R1(h*.5)}" fill="none" stroke="${C.red}" stroke-width="${R1(4*s)}"/>`);
    k.shape(blobP(ex+f*26*s,gy-2*s,13*s,6*s,k.r,8,.2),'#D8C7A4',{w:1.3,one:1,hatch:{side:.5,gap:3,col:'#B9A57E',op:.5}})});
  snowOn(k,body.slice(1,7),8*s);k.lt(()=>ltString(k,sagP(x0+10,top+8,x1-10,top+8,6,10),18));k.hw(()=>{hwGhost(k,x1-40*s,top-30*s,.8*s,0,1)})}
// the jump: two wing stands along the depth (b = back, f = front: [x, groundY, scale]), lattice wings, a striped bar between them and a pole on the ground
function jumpBar(k,b,f,hb){const wing=([x,y,s],side)=>{const H=96*s,w=34*s,x0=side<0?x-w:x,x1=side<0?x:x+w;shade(k,(x0+x1)/2,y+2,w*.8,4*s);
    [x0+3*s,x1-3*s].forEach(px=>k.shape([[px-3.4*s,y],[px-3*s,y-H],[px+3*s,y-H],[px+3.4*s,y]],'#FFFFFF',{w:1.4,one:1}));
    let d='';[.25,.5,.75].forEach(t=>{d+=`M${R1(x0+3*s)} ${R1(y-H*t)}L${R1(x1-3*s)} ${R1(y-H*t)}`});d+=`M${R1(x0+3*s)} ${R1(y-H*.25)}L${R1(x1-3*s)} ${R1(y-H*.75)}`;
    k.add(`<path d="${d}" stroke="${C.ink}" stroke-width="${R1(4.4*s+1)}" stroke-linecap="round"/><path d="${d}" stroke="#7FA6D9" stroke-width="${R1(3*s+.4)}" stroke-linecap="round"/>`);
    k.add(`<circle cx="${R1(x0+3*s)}" cy="${R1(y-H-3*s)}" r="${R1(3.6*s)}" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1.1"/><circle cx="${R1(x1-3*s)}" cy="${R1(y-H-3*s)}" r="${R1(3.6*s)}" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1.1"/>`);
    k.shape([[x0+3*s,y-H],[x0+3*s+18*s*(side<0?-1:1),y-H+6*s],[x0+3*s,y-H+12*s]],C.pink,{w:1,one:1});
    snowOn(k,[[x0,y-H-2*s],[x1,y-H-2*s]],3.5*s);frostOn(k,[[x0+2,y-H*.75],[x1-2,y-H*.75]])};
  wing(b,1);const bs=b[2],fs=f[2],p0=[b[0]+3*bs,b[1]-hb*bs],p1=[f[0]+3*fs,f[1]-hb*fs],q0=[b[0]+3*bs,b[1]-6*bs],q1=[f[0]+3*fs,f[1]-6*fs];
  const bar=([a,c,t])=>{const w=(bs+fs)/2*t;k.line([a,c],R1(10*w),C.ink,{amp:.2});k.line([a,c],R1(7*w),'#FFFFFF',{amp:.1});k.line([a,c],R1(7*w),'#E8677A',{amp:.1,dash:`${R1(10*w)} ${R1(10*w)}`})};
  // the full course (data-ag-bar="hi"): the thin ground pole and the raised bar. The low course for puppies and seniors (data-ag-bar="lo", shown by the game's
  // html.ag-low): the striped bar lowered onto the sand on two little wooden chocks, just before the wings on the approach side and clear of
  // them (no raised bar; the game's low hop is centred where the path crosses it). Drawn last so the random stream of the full course stays as it was.
  k.add('<g data-ag-bar="hi">');[[q0,q1,.7],[p0,p1,1]].forEach(bar);snowOn(k,[p0,p1],3);k.add('</g>');wing(f,1);
  const lo=k.cap(()=>{const u=.65,ls=fs+(bs-fs)*u,l0=[f[0]+(b[0]-f[0])*u-40*ls,f[1]+(b[1]-f[1])*u-4*ls],l1=[f[0]-40*fs,f[1]-4*fs];// the front 65% of the depth, round the dog's path
    [[l0,ls],[l1,fs]].forEach(([[x,y],s])=>{shade(k,x,y+4*s,10*s,2.4*s);k.shape([[x-7*s,y+4*s],[x+7*s,y+4*s],[x+5*s,y-2*s],[x-5*s,y-2*s]],C.wood,{w:1.1,one:1})});
    k.add(`<path d="M${R1(l0[0]+5*ls)} ${R1(l0[1]+5*ls)}L${R1(l1[0]+6*fs)} ${R1(l1[1]+6*fs)}" stroke="${C.ink}" stroke-width="${R1(9*(ls+fs)/2)}" stroke-linecap="round" opacity=".13"/>`);// its shadow on the sand
    bar([l0,l1,.95]);snowOn(k,[l0,l1],2.5)});
  k.add(`<g data-ag-bar="lo" display="none">${lo}</g>`)}
function tyre(k,b,f,s){const cx=(b[0]+f[0])/2,cy=(b[1]+f[1])/2,H=150;shade(k,cx,cy+3,52*s,9*s);
  const post=([x,y,q])=>{k.shape([[x-5*q,y],[x-4.4*q,y-H*q],[x+4.4*q,y-H*q],[x+5*q,y]],C.woodD,{w:1.5,one:1,hatch:{side:.6,gap:3,col:dk(C.woodD),op:.4}});k.shape(RC(x-12*q,y-7*q,24*q,7*q),C.stoneD,{w:1.2,one:1})};
  post(b);const tb=[b[0],b[1]-H*b[2]],tf=[f[0],f[1]-H*f[2]];k.shape([[tb[0]-4,tb[1]-5],[tf[0]-4,tf[1]-5],[tf[0]+4,tf[1]+4],[tb[0]+4,tb[1]+4]],C.wood,{w:1.5,one:1});
  const ty=cy-70*s,tx=cx+2*s;k.line([[tx-6*s,(tb[1]+tf[1])/2],[tx-9*s,ty-36*s]],1.3,C.ink,{op:.85});k.line([[tx+6*s,(tb[1]+tf[1])/2],[tx+9*s,ty-36*s]],1.3,C.ink,{op:.85});
  k.shape(E(tx,ty,26*s,40*s,18),'#F59A4A',{w:2.4,hatch:{side:.55,gap:3,col:'#D9772E',op:.5}});k.shape(E(tx+2*s,ty+1*s,13*s,24*s,14),C.sand,{w:1.8,one:1});
  let d='';for(let i=0;i<10;i++){const a=i/10*Math.PI*2;d+=`M${R1(tx+Math.cos(a)*15*s)} ${R1(ty+Math.sin(a)*27*s)}L${R1(tx+Math.cos(a)*24*s)} ${R1(ty+Math.sin(a)*38*s)}`}
  k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="${R1(3*s)}" opacity=".85"/>`);post(f);snowOn(k,[[tb[0]-5,tb[1]-5],[tf[0]+5,tf[1]-5]],4*s);snowOn(k,[[tx-16*s,ty-36*s],[tx,ty-41*s],[tx+16*s,ty-36*s]],4*s)}
function trickStage(k,x0,x1,y0,y1){const h=y1-y0;shade(k,(x0+x1)/2,y1+2,(x1-x0)*.55,6);
  k.shape([[x0+10,y0],[x1-10,y0],[x1,y0+12],[x0,y0+12]],C.wood,{w:2,hatch:{side:.7,gap:4,col:C.woodD,op:.45}});
  let d='';for(let x=x0+40;x<x1-20;x+=40)d+=`M${x} ${y0+1}l${R1((x-(x0+x1)/2)*.04)} 11`;k.add(`<path d="${d}" stroke="${C.woodD}" stroke-width="1.2"/>`);
  k.shape(RC(x0,y0+12,x1-x0,h-12),'#E2B98A',{w:2,hatch:{side:.75,gap:4.5,col:'#C29468',op:.5}});
  // a scalloped pink skirt and a gold star sticker
  const sk=[[x0,y0+12]];for(let x=x0;x<x1;x+=24)sk.push([x+12,y0+24],[Math.min(x1,x+24),y0+12]);k.shape(sk.concat([[x1,y0+12]]),'#F7B9C6',{w:1.4,one:1});
  O.sparkle(k,(x0+x1)/2,y0+h*.62,9,C.yellow);O.sparkle(k,x0+30,y0+h*.7,5);O.sparkle(k,x1-30,y0+h*.7,5);
  snowOn(k,[[x0+8,y0],[x1-8,y0]],6);k.hw(()=>{hwJack(k,x0+18,y0+2,.8);hwJack(k,x1-18,y0+2,.7)});k.lt(()=>ltString(k,sagP(x0+4,y0+14,x1-4,y0+14,4,14),20))}
function scoreboard(k,x,gy,s){const w=180*s,h=86*s,bx=x-w/2,by=gy-150*s;
  [bx+18*s,bx+w-18*s].forEach(px=>k.shape(RC(px-4*s,by+h-4,8*s,gy-by-h+4),C.woodD,{w:1.5,one:1}));
  k.shape(RC(bx-6*s,by-6*s,w+12*s,h+12*s),C.wood,{w:2,hatch:{side:.8,gap:4,col:C.woodD,op:.4}});k.shape(RC(bx,by,w,h),'#6E9A80',{w:1.6,one:1,hatch:{side:.6,gap:4,col:'#557F67',op:.4}});
  // three rosettes (gold, blue, pink) and chalk tallies under them
  [[bx+w*.2,'#F7D24E'],[bx+w*.5,'#8FB6E3'],[bx+w*.8,'#F28FA5']].forEach(([rx,c],i)=>{const ry=by+h*.42,r=15*s;
    k.shape([[rx-6*s,ry+6*s],[rx-11*s,ry+30*s],[rx-4*s,ry+25*s],[rx-1*s,ry+32*s],[rx,ry+8*s]],c,{w:1.1,one:1});k.shape([[rx+6*s,ry+6*s],[rx+11*s,ry+30*s],[rx+4*s,ry+25*s],[rx+1*s,ry+32*s],[rx,ry+8*s]],c,{w:1.1,one:1});
    const p=[];for(let j=0;j<16;j++){const a=j/16*Math.PI*2,rr=j%2?r*.82:r;p.push([rx+Math.cos(a)*rr,ry+Math.sin(a)*rr])}k.shape(p,c,{w:1.4,one:1});k.shape(E(rx,ry,r*.5,r*.5,12),'#FFFBF3',{w:1.1,one:1});
    let t='';for(let j=0;j<=i;j++)t+=`M${R1(rx-6*s+j*5*s)} ${R1(by+h-8*s)}v${R1(-8*s)}`;k.add(`<path d="${t}" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`)});
  snowOn(k,[[bx-8*s,by-6*s],[bx+w+8*s,by-6*s]],7*s);frostOn(k,[[bx-6*s,by-6*s],[bx+w+6*s,by-6*s]]);
  k.lt(()=>ltString(k,[[bx-6*s,by-4*s],[bx+w+6*s,by-4*s]],16));k.ny(()=>nyShime(k,x,by-4*s,.75*s));k.hw(()=>{hwBat(k,bx+w-10*s,by-16*s,.7*s);hwJack(k,bx-14*s,gy,.7*s)})}
function rosetteFlag(k,x,gy,s){k.line([[x,gy],[x+k.J(1),gy-150*s]],3,C.ink);k.add(`<circle cx="${x}" cy="${R1(gy-152*s)}" r="${R1(4*s)}" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1.2"/>`);
  const fy=gy-146*s,p=[[x,fy],[x+72*s,fy+6*s],[x+58*s,fy+22*s],[x+74*s,fy+40*s],[x,fy+44*s]];k.shape(p,'#7FA6D9',{w:1.8,hatch:{side:.6,gap:3.5,col:'#5E86BE',op:.45}});
  const rx=x+30*s,ry=fy+22*s,q=[];for(let j=0;j<14;j++){const a=j/14*Math.PI*2,rr=j%2?9*s:11*s;q.push([rx+Math.cos(a)*rr,ry+Math.sin(a)*rr])}k.shape(q,'#F7D24E',{w:1.2,one:1});k.add(`<circle cx="${R1(rx)}" cy="${R1(ry)}" r="${R1(4*s)}" fill="#FFFBF3" stroke="${C.ink}" stroke-width="1"/>`);
  snowOn(k,[[x,fy],[x+72*s,fy+6*s]],3*s)}
function clubHut(k,x,gy,s){const w=150*s,h=78*s;k.shape(RC(x-w/2,gy-h,w,h),C.wall4,{w:2,hatch:{side:.8,gap:4.5,col:dk(C.wall4),op:.3}});
  let d='';for(let y=gy-h+12*s;y<gy;y+=12*s)d+=`M${R1(x-w/2+2)} ${R1(y)}h${R1(w-4)}`;k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="1.2" opacity=".55"/>`);
  const rf=[[x-w/2-14*s,gy-h+2],[x,gy-h-46*s],[x+w/2+14*s,gy-h+2]];k.shape(rf,'#7FA6D9',{w:2,hatch:{side:.6,gap:4,col:'#5E86BE',op:.5}});
  k.shape(RC(x-14*s,gy-50*s,28*s,50*s),C.woodD,{w:1.6,one:1});k.add(`<circle cx="${R1(x+8*s)}" cy="${R1(gy-25*s)}" r="${R1(2*s)}" fill="${C.ink}"/>`);
  O.window(k,x-56*s,gy-60*s,30*s,26*s,{frame:'#FFFFFF'});O.window(k,x+28*s,gy-60*s,30*s,26*s,{frame:'#FFFFFF'});
  const q=[];for(let j=0;j<14;j++){const a=j/14*Math.PI*2,rr=j%2?8*s:10*s;q.push([x+Math.cos(a)*rr,gy-h-20*s+Math.sin(a)*rr])}k.shape(q,'#F7D24E',{w:1.2,one:1});
  snowOn(k,rf,8*s);k.ny(()=>nyKado(k,x-30*s,gy,.6*s,1));k.hw(()=>hwCutout(k,x+w/2+20*s,gy,.8*s))}
function scTraining(k,F){const e=k.env,W=1600,D=y=>dep(F,y),fk=floorKit(k);
  skyG(k,W,330,{sun:[1210,84,32],low:[1240,250,36],moon:[1240,80,26],clouds:[[260,70,24],[760,56,20],[1500,110,22],[520,150,16]],rainC:[[140,40,28],[640,30,28],[1100,50,26]],birds:[[620,96,8],[644,106,6]]});
  jpFuji(k,330,296,300);
  k.ny(()=>nyKites(k,[[600,130,.9,0,560,300],[1060,110,.8,1,1020,300]]));
  hills(k,W,[[0,300],[180,276],[420,292],[700,266],[960,288],[1240,268],[1460,284],[1600,274]],350,'#DCEDC4');
  farTrees(k,[[60,290,1],[250,284,.9],[520,286,1],[640,278,.9],[880,284,1],[1000,280,.9],[1160,276,1],[1420,282,.9],[1560,280,1]]);
  // the grass and the sandy oval arena
  k.fill([[0,330],[W,326],[W,600],[0,600]],C.grass,{dx:0,dy:0,sc:0});
  {const [cx,cy,rx,ry]=TR_OV,ov=E(cx,cy,rx,ry,48);k.fill(ov,C.sand,{dx:0,dy:0,sc:0});k.fill(E(cx,cy+22,rx*.82,ry*.62,40),'#FBEBC4',{dx:0,dy:0,sc:0,op:.7});
   k.pen(ov,true,{w:1.8,col:'#C9AE77',step:14});
   let rk='';for(let i=1;i<5;i++){const f=1-i*.17;for(let a=.15;a<Math.PI-.15;a+=.5+k.r()*.25){const a1=a+.22+k.r()*.12;rk+=`M${R1(cx+Math.cos(a)*rx*f)} ${R1(cy+Math.sin(a)*ry*f)}A${R1(rx*f)} ${R1(ry*f)} 0 0 1 ${R1(cx+Math.cos(a1)*rx*f)} ${R1(cy+Math.sin(a1)*ry*f)}`}}
   k.add(`<path d="${rk}" fill="none" stroke="${C.sandD}" stroke-width="1.5" stroke-linecap="round" opacity=".9"/>`);
   pebbles(k,80,1520,350,596,90,'#D8BE88');
   pawTrail(k,[[880,560,1],[908,548,1],[936,540,1],[964,532,1],[996,526,.95],[1028,520,.95],[1060,516,.9],[1092,510,.9]],'#DFC48C');pawTrail(k,[[260,520,.9],[288,512,.9],[316,506,.85],[344,500,.85]],'#DFC48C')}
  tuftsG(k,0,W,336,598,170,(x,y)=>!inOv(x,y,14));
  fl(k,[[20,580,C.red],[60,560,C.yellow],[1560,590,C.lav],[1590,560,C.yellow],[24,372,'#FFB3C7'],[1580,380,C.red]],4.6);
  // the back: a rope fence with blue bunting, the club hut, the scoreboard, the rosette flag, two floodlights
  clubHut(k,150,336,.9);
  rosetteFlag(k,1080,338,.9);
  scoreboard(k,1390,338,1);
  {const posts=[];for(let x=10;x<=1600;x+=86)posts.push([x,340+k.J(1),.62]);ropeFence(k,posts,58,{lt:1});
   const ties=posts.filter((p,i)=>i%2===0).map(p=>[p[0],p[1]-58*.62]);buntingG(k,ties,9,['#7FA6D9','#FFFFFF','#B9D3F2'],.7);
   k.hw(()=>hwBatString(k,300,820,296,10,6,.6))}
  O.lamp(k,560,340,.82);O.lamp(k,1240,340,.82);
  k.fx(()=>fxG(k,W,{sheen:[350,598],puddles:[[620,566,48,9],[1180,556,40,8],[300,470,34,6]],patches:[[480,560,80,13],[1120,570,70,12],[240,420,50,8],[1300,410,54,8],[820,440,60,9],[1520,520,46,8]],flies:[[160,420],[520,330],[980,300],[1460,420],[760,560]]}));
  winterSnow(k,[[90,560,70,10],[1520,560,60,10],[420,580,90,12],[1160,590,80,11],[700,420,50,7],[1350,440,46,7]]);
  k.ss(()=>seasonGround(k,[40,350,1560,596],170,[[180,400,300,470],[390,350,700,400],[680,450,920,530],[940,440,1060,570],[1200,390,1290,480],[460,530,720,598]]));
  // the floor props (sorted by base y inside #floorG)
  fk.add('weave',388,()=>weavePoles(k,428,388,D(388)));
  fk.add('table',452,()=>pauseTable(k,238,452,D(452)));
  fk.add('tyre',448,()=>tyre(k,[1262,424,D(424)],[1238,472,D(472)],D(448)));
  fk.add('tunnel',514,()=>tunnel(k,694,904,514,D(514)));
  fk.add('jump',514,()=>jumpBar(k,[1032,474,D(474)],[1002,552,D(552)],40));
  fk.add('stage',548,()=>trickStage(k,470,706,548,594));
  fk.add('bowl',552,()=>bowlG(k,1404,552,D(552)));
  fk.add('tree',478,()=>{shade(k,1500,480,60*D(478));O.tree(k,1500,478,1.15*D(478)/.75,{col:C.leaf2})});
  fk.out();
  seasonBits(k,{drift:[[700,200,1],[980,250,.9],[420,240,.85],[1300,200,.9]],robin:[620,312,1],fly:[880,330]});
  O.sparkle(k,700,190,7);O.heart(k,940,160,6);O.note(k,420,210,11);
  O.tape(k,6,26,90,-24,'#F7B9C6');O.tape(k,W-90,566,80,-28,'#BDE7D2')}

/* ======================= Splash Pool ======================= */
const PL_RIM=[[332,446],[356,408],[452,392],[592,396],[690,418],[790,400],[930,390],[1052,404],[1092,446],[1066,500],[930,526],[720,530],[520,528],[384,516],[340,488]];
const PL_STEP=[[352,452],[374,418],[446,404],[490,416],[478,470],[452,506],[392,508],[356,488]];
function lifeVest(k,x,gy,s){shade(k,x,gy+2,22*s);k.shape([[x-4*s,gy],[x-3.4*s,gy-128*s],[x+3.4*s,gy-128*s],[x+4*s,gy]],C.woodD,{w:1.5,one:1,hatch:{side:.6,gap:3,col:dk(C.woodD),op:.4}});
  k.shape(RC(x-14*s,gy-6*s,28*s,6*s),C.stoneD,{w:1.2,one:1});k.line([[x+3*s,gy-118*s],[x+16*s,gy-118*s],[x+18*s,gy-110*s]],2,C.ink);
  const vx=x+20*s,vy=gy-108*s,v=[[vx-18*s,vy+8*s],[vx-8*s,vy],[vx+8*s,vy],[vx+18*s,vy+8*s],[vx+20*s,vy+46*s],[vx-20*s,vy+46*s]];
  k.shape(v,'#F8A95E',{w:1.8,hatch:{side:.6,gap:3.4,col:'#D9772E',op:.5}});k.shape([[vx-8*s,vy],[vx,vy+16*s],[vx+8*s,vy]],'#FFFBF3',{w:1.2,one:1});
  [vy+22*s,vy+34*s].forEach(y=>{k.shape(RC(vx-20*s,y,40*s,5*s),'#5E86BE',{w:1.1,one:1});k.shape(RC(vx-4*s,y-1*s,8*s,7*s),'#D8D2CC',{w:1,one:1})});
  k.add(`<path d="M${R1(vx-14*s)} ${R1(vy+12*s)}h${R1(6*s)}M${R1(vx+8*s)} ${R1(vy+12*s)}h${R1(6*s)}" stroke="#FFFFFF" stroke-width="${R1(2.2*s)}" stroke-linecap="round"/>`);
  snowOn(k,[[x-4*s,gy-128*s],[x+4*s,gy-128*s]],3*s)}
function guardChair(k,x,gy,s){shade(k,x,gy+2,44*s);const H=150*s,sw=40*s;
  [[-1,0],[1,0]].forEach(([d])=>{k.line([[x+d*30*s,gy],[x+d*18*s,gy-H+30*s]],R1(5*s+1.4),C.ink);k.line([[x+d*30*s,gy],[x+d*18*s,gy-H+30*s]],R1(4*s),'#FFFFFF')});
  for(let i=1;i<4;i++){const y=gy-i*(H-30*s)/4,w=30*s-i*3*s;k.line([[x-w,y],[x+w,y]],R1(3*s+1),C.ink);k.line([[x-w,y],[x+w,y]],R1(2*s),'#FFFFFF')}
  k.shape(RC(x-sw/2,gy-H+22*s,sw,10*s),'#FFFFFF',{w:1.6,one:1});k.shape([[x-sw/2,gy-H+22*s],[x-sw/2+3*s,gy-H-22*s],[x+sw/2-3*s,gy-H-22*s],[x+sw/2,gy-H+22*s]],'#FFFFFF',{w:1.8,hatch:{side:.7,gap:4,col:'#B9D3F2',op:.6}});
  k.add(`<g fill="#7FD0D2"><ellipse cx="${R1(x)}" cy="${R1(gy-H-2*s)}" rx="${R1(6*s)}" ry="${R1(5*s)}"/><circle cx="${R1(x-7*s)}" cy="${R1(gy-H-10*s)}" r="${R1(2.4*s)}"/><circle cx="${R1(x-2.4*s)}" cy="${R1(gy-H-14*s)}" r="${R1(2.4*s)}"/><circle cx="${R1(x+2.4*s)}" cy="${R1(gy-H-14*s)}" r="${R1(2.4*s)}"/><circle cx="${R1(x+7*s)}" cy="${R1(gy-H-10*s)}" r="${R1(2.4*s)}"/></g>`);
  // the parasol over the seat and a ring buoy on the side
  k.line([[x+16*s,gy-H+22*s],[x+16*s,gy-H-70*s]],2.2,C.ink);const um=[[x-36*s,gy-H-52*s],[x+16*s,gy-H-86*s],[x+68*s,gy-H-52*s]];
  k.shape(um.concat([[x+50*s,gy-H-48*s],[x+33*s,gy-H-52*s],[x+16*s,gy-H-46*s],[x-1*s,gy-H-52*s],[x-18*s,gy-H-48*s]]),C.red,{w:1.7,one:1});
  k.add(`<path d="M${R1(x+16*s)} ${R1(gy-H-86*s)}L${R1(x-1*s)} ${R1(gy-H-52*s)}M${R1(x+16*s)} ${R1(gy-H-86*s)}L${R1(x+33*s)} ${R1(gy-H-52*s)}" stroke="#FFFFFF" stroke-width="${R1(5*s)}" opacity=".85"/>`);
  const bx=x-34*s,by=gy-H*.52;k.shape(E(bx,by,15*s,15*s,14),'#FFFFFF',{w:1.8,one:1});k.shape(E(bx,by,7*s,7*s,10),'#B9D3F2',{w:1.3,one:1});
  [0,1,2,3].forEach(i=>{const a=i*Math.PI/2+.4;k.add(`<path d="M${R1(bx+Math.cos(a)*8*s)} ${R1(by+Math.sin(a)*8*s)}L${R1(bx+Math.cos(a)*14*s)} ${R1(by+Math.sin(a)*14*s)}" stroke="${C.red}" stroke-width="${R1(5*s)}"/>`)});
  snowOn(k,um,5*s);k.hw(()=>{hwJack(k,x-34*s,gy,.7*s);hwBat(k,x+40*s,gy-H-96*s,.7*s)});k.lt(()=>ltString(k,sagP(x-36*s,gy-H-50*s,x+68*s,gy-H-50*s,8*s,10),16))}
function sprinkler(k,x,gy,s){shade(k,x,gy+2,16*s);k.shape(E(x,gy-3*s,12*s,4*s,12),'#9CCB80',{w:1.4,one:1});k.shape(RC(x-3*s,gy-18*s,6*s,15*s),'#F7D24E',{w:1.3,one:1});k.shape(E(x,gy-19*s,7*s,3*s,10),'#F28FA5',{w:1.2,one:1});
  k.line([[x-12*s,gy-2*s],[x-60*s,gy+6*s],[x-110*s,gy+2*s]],2.4,'#7FB86A',{amp:.6});
  if(k.so==='winter')return;let d='',dr='';[[-1,1],[1,1],[-.5,1.3],[.5,1.3]].forEach(([f,h])=>{d+=`M${R1(x)} ${R1(gy-20*s)}q${R1(f*40*s)} ${R1(-80*s*h)} ${R1(f*84*s)} ${R1(10*s)}`;
    for(let i=1;i<6;i++){const t=i/6,px=x+f*84*s*t,py=gy-20*s+(-160*s*h*t*(1-t))+10*s*t;dr+=`<ellipse cx="${R1(px)}" cy="${R1(py)}" rx="${R1(2*s)}" ry="${R1(3*s)}" fill="#BEE8F4" stroke="#6FB8D8" stroke-width=".8"/>`}});
  k.add(`<path d="${d}" fill="none" stroke="#9CD6EE" stroke-width="2" stroke-dasharray="5 6" stroke-linecap="round"/>${dr}`)}
function parasol(k,x,gy,s){shade(k,x,gy+2,40*s);k.shape(RC(x-50*s,gy-8*s,92*s,12*s),'#BDE7D2',{w:1.4,one:1});k.add(`<path d="M${R1(x-40*s)} ${R1(gy-2*s)}h${R1(70*s)}" stroke="#FFFFFF" stroke-width="${R1(3*s)}" stroke-dasharray="${R1(8*s)} ${R1(8*s)}"/>`);
  k.line([[x,gy],[x+6*s,gy-150*s]],R1(3*s+.6),C.ink);const cn=[[x-70*s,gy-124*s],[x+6*s,gy-166*s],[x+82*s,gy-124*s]];
  k.shape(cn.concat([[x+56*s,gy-118*s],[x+31*s,gy-124*s],[x+6*s,gy-116*s],[x-19*s,gy-124*s],[x-44*s,gy-118*s]]),'#7FD0D2',{w:1.8,one:1});
  k.add(`<path d="M${R1(x+6*s)} ${R1(gy-166*s)}L${R1(x-19*s)} ${R1(gy-124*s)}M${R1(x+6*s)} ${R1(gy-166*s)}L${R1(x+31*s)} ${R1(gy-124*s)}" stroke="#FFFFFF" stroke-width="${R1(6*s)}" opacity=".85"/>`);snowOn(k,cn,5*s)}
function lounger(k,x,gy,s){shade(k,x+10*s,gy+2,60*s);k.shape([[x-56*s,gy-22*s],[x+30*s,gy-22*s],[x+34*s,gy-30*s],[x+62*s,gy-62*s],[x+70*s,gy-56*s],[x+44*s,gy-20*s],[x+40*s,gy-14*s],[x-58*s,gy-14*s]],'#FFFFFF',{w:1.8,hatch:{side:.7,gap:3.6,col:'#B9D3F2',op:.6}});
  [[-48,0],[30,0]].forEach(([dx])=>k.line([[x+dx*s,gy-14*s],[x+dx*s,gy]],R1(3*s+.8),C.ink));k.shape([[x-40*s,gy-26*s],[x+20*s,gy-26*s],[x+24*s,gy-18*s],[x-44*s,gy-18*s]],'#F7B9C6',{w:1.2,one:1});
  k.add(`<path d="M${R1(x-34*s)} ${R1(gy-22*s)}h${R1(52*s)}" stroke="#FFFFFF" stroke-width="${R1(2.4*s)}" stroke-dasharray="${R1(6*s)} ${R1(6*s)}"/>`);snowOn(k,[[x-58*s,gy-22*s],[x+32*s,gy-22*s]],4*s)}
function cabana(k,x,gy,s){const w=170*s,h=110*s;k.shape(RC(x-w/2,gy-h,w,h),'#FFFFFF',{w:2,hatch:{side:.8,gap:4.5,col:'#D9E9F7',op:.6}});
  let d='';for(let xx=x-w/2+18*s;xx<x+w/2;xx+=22*s)d+=`M${R1(xx)} ${R1(gy-h+2)}V${R1(gy-2)}`;k.add(`<path d="${d}" stroke="#9EDADB" stroke-width="${R1(9*s)}" opacity=".7"/>`);
  const rf=[[x-w/2-16*s,gy-h+4],[x,gy-h-50*s],[x+w/2+16*s,gy-h+4]];k.shape(rf,'#7FD0D2',{w:2,hatch:{side:.6,gap:4,col:'#5DB5B9',op:.5}});
  k.shape(RC(x-20*s,gy-64*s,40*s,64*s),'#F7B9C6',{w:1.7,one:1});k.add(`<circle cx="${R1(x)}" cy="${R1(gy-46*s)}" r="${R1(8*s)}" fill="${C.glass}" stroke="${C.ink}" stroke-width="1.4"/>`);
  // the towel rail beside it
  const tx=x+w/2+40*s;k.line([[tx-30*s,gy],[tx-30*s,gy-60*s],[tx+30*s,gy-60*s],[tx+30*s,gy]],2.4,C.woodD);
  [[-18,'#F7B9C6'],[0,'#FCE59A'],[18,'#BDE7D2']].forEach(([dx,c])=>k.shape(RC(tx+dx*s-8*s,gy-60*s,16*s,34*s),c,{w:1.2,one:1}));
  snowOn(k,rf,7*s);k.ny(()=>nyKado(k,x-34*s,gy,.6*s,1));k.hw(()=>{hwJack(k,x+30*s,gy,.7*s);hwLanternString(k,x-w/2,gy-h,x+w/2,gy-h,10*s,3,.7)})}
// the Winter Dome: a striped warm tent over the pool, open at the front (only in winter)
function winterDome(k){const cx=712,rimL=[318,474],rimR=[1106,474],top=110,back=392,cols=['#F4A3A3','#FFF4E6'];
  // the back wall of the tent (inside), then the canopy rim at the front with a scalloped valance
  const arc=(t)=>{const a=Math.PI*(1-t);return [cx+Math.cos(a)*(rimR[0]-cx),rimL[1]-Math.sin(a)*(rimL[1]-top)]};
  const backP=[];for(let i=0;i<=24;i++){const t=i/24,a=Math.PI*(1-t);backP.push([cx+Math.cos(a)*380,back-Math.sin(a)*(back-top-40)])}
  const n=14;for(let i=0;i<n;i++){const P=[];for(let j=0;j<=6;j++){const t=(i+j/6)/n,a=Math.PI*(1-t);P.push([cx+Math.cos(a)*380,back-Math.sin(a)*(back-top-40)])}k.fill([[cx,back]].concat(P),cols[i%2],{dx:0,dy:0,amp:.4})}
  k.pen(backP,false,{w:1.6,col:C.graph});
  // the side panels from the back corners to the front poles
  [[[cx-380,back],arc(0),arc(.12),[cx-330,back-150]],[[cx+380,back],arc(1),arc(.88),[cx+330,back-150]]].forEach(p=>k.shape(p,'#F6C2BC',{w:1.8,hatch:{side:.5,gap:5,col:'#E39C95',op:.5}}));
  const rim=[];for(let i=0;i<=30;i++)rim.push(arc(i/30));
  const val=[];for(let i=0;i<=30;i++){const p=arc(i/30);val.push([p[0],p[1]+(i%2?16:6)])}
  k.shape(rim.concat(val.slice().reverse()),'#F28FA5',{w:2,one:1});k.line(rim,2.4,C.ink,{amp:.4});
  for(let i=1;i<30;i+=2){const p=arc(i/30);k.line([[p[0],p[1]],[p[0],p[1]+16]],1,C.ink,{op:.4})}
  [rimL,rimR].forEach(([x,y])=>{k.shape([[x-5,y],[x-4,arc(x<cx?0:1)[1]-4],[x+4,arc(x<cx?0:1)[1]-4],[x+5,y]],C.woodD,{w:1.6,one:1});k.shape(RC(x-12,y-6,24,7),C.stoneD,{w:1.2,one:1})});
  // a pennant on top and warm bulbs inside; snow on the canopy
  const tp=arc(.5);k.line([[tp[0],tp[1]],[tp[0],tp[1]-40]],2,C.ink);k.shape([[tp[0],tp[1]-40],[tp[0]+30,tp[1]-33],[tp[0],tp[1]-26]],C.yellow,{w:1.3,one:1});
  k.side(()=>capLine(k,rim.slice(5,26),k.env.snow?12:8));
  ltString(k,sagP(cx-300,back-120,cx+300,back-120,40,24),24);
  [[cx-240,back-24],[cx+240,back-24]].forEach(([x,y])=>{k.shape(RC(x-10,y-40,20,40),'#C9CED6',{w:1.4,one:1});k.shape(E(x,y-44,14,8,12),'#F8A95E',{w:1.4,one:1});jpGlow(k,x,y-44,60)})}
function scPool(k,F){const e=k.env,W=1600,D=y=>dep(F,y),fk=floorKit(k),win=k.so==='winter';
  skyG(k,W,330,{sun:[360,80,30],low:[300,250,36],moon:[300,76,26],clouds:[[700,64,24],[1180,90,20],[1480,60,22],[960,150,16]],rainC:[[200,40,28],[880,30,28],[1380,50,26]],birds:[[1020,90,8],[1044,100,6]]});
  jpFuji(k,1270,300,280);
  k.ny(()=>nyKites(k,[[980,120,.9,0,940,300],[160,150,.8,1,200,300]]));
  hills(k,W,[[0,292],[240,270],[520,286],[820,262],[1100,282],[1380,266],[1600,280]],352,'#DCEDC4');
  farTrees(k,[[90,286,1],[430,280,.9],[690,276,1],[1000,278,.9],[1180,282,1],[1500,278,.9]]);
  // the white wall with an aqua tile band, the cabana, palms in pots
  k.shape([[0,306],[W,306],[W,354],[0,354]],'#FFFFFF',{w:1.8,hatch:{side:.9,gap:5,col:'#D9E9F7',op:.5}});
  {let d='';for(let x=0;x<W;x+=24)d+=`M${x} 320h16`;k.add(`<rect y="318" width="${W}" height="14" fill="#9EDADB" opacity=".75"/><path d="${d}" stroke="#FFFFFF" stroke-width="1.6" opacity=".8"/>`);k.line([[0,306],[W,306]],1.6,C.graph)}
  snowOn(k,[[0,306],[W,306]],5);frostOn(k,[[0,307],[W,307]]);
  cabana(k,150,354,.9);
  [[560,'#E9B9A0'],[1360,'#E9B9A0']].forEach(([x,c])=>plantG(k,x,356,.8,c));
  // the tiled deck and the pool
  k.fill([[0,352],[W,352],[W,600],[0,600]],'#F6F3EC',{dx:0,dy:0,sc:0});paveG(k,W,354,600,800,-260,'#C9D8E2','#E6EEF2',11);
  {const out=PL_RIM.map(([x,y])=>[700+(x-700)*1.04,460+(y-460)*1.12]);k.shape(out,'#FFFFFF',{w:2,one:1});
   k.fill(PL_RIM,'#7FD0D2',{dx:0,dy:0,sc:0});k.fill(PL_RIM.map(([x,y])=>[x,Math.max(y,y+(y-460)*.1)+8]),'#9EDDDC',{dx:0,dy:0,op:.85});k.pen(PL_RIM,true,{w:2.2});
   let tl='';for(let x=360;x<1080;x+=34)tl+=`M${x} 404L${R1(x+(x-700)*.12)} 520`;k.add(`<path d="${tl}" stroke="#6CC0C5" stroke-width="1" opacity=".45"/>`);
   k.shape(PL_STEP,'#BDEDEA',{w:1.6,one:1});k.line([[380,414],[452,404]],2.2,'#FFFFFF');k.line([[480,420],[468,474],[446,506]],2.4,'#FFFFFF',{op:.9});
   let wv='';for(let i=0;i<34;i++){const x=500+k.r()*560,y=410+k.r()*104;wv+=`M${R1(x)} ${R1(y)}q7 -5 14 0t14 0`}k.add(`<path d="${wv}" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`);
   // the ring float and a rubber duck in the water
   k.shape(E(812,468,34,12,16),'#F7B9C6',{w:1.8,one:1});k.shape(E(812,466,17,5,12),'#7FD0D2',{w:1.3,one:1});[0,1,2,3].forEach(i=>{const a=i*Math.PI/2+.3;k.add(`<path d="M${R1(812+Math.cos(a)*20)} ${R1(468+Math.sin(a)*6)}L${R1(812+Math.cos(a)*32)} ${R1(468+Math.sin(a)*11)}" stroke="#FFFFFF" stroke-width="5"/>`)});
   {const x=950,y=436;k.shape([[x-12,y],[x+12,y],[x+14,y-8],[x+4,y-10],[x-10,y-9]],'#FCE59A',{w:1.4,one:1});k.shape(E(x+8,y-14,6,6,10),'#FCE59A',{w:1.3,one:1});k.add(`<path d="M${x+13} ${y-14}l6 1l-6 2z" fill="${C.orange}" stroke="${C.ink}" stroke-width=".9"/><circle cx="${x+9}" cy="${y-16}" r="1.2" fill="${C.ink}"/>`)}
   k.fx(()=>{if(e.rain)ripples(k,380,1060,410,520,26);waterGlints(k,e.night?760:640,410,520)})}
  pebbles(k,40,1560,360,598,40,'#DCD6CC');
  pawTrail(k,[[1150,560,1],[1180,552,1],[1210,546,1],[1240,540,.95],[1270,534,.95]],'#B9D3E6');
  if(win)k.ss(()=>winterDome(k));
  k.fx(()=>fxG(k,W,{sheen:[360,598],avoid:[[330,390,1100,530]],puddles:[[200,560,40,8],[1300,580,44,9]],patches:[[200,570,70,12],[1320,580,70,12],[1500,420,50,8],[120,420,46,8]],flies:[[1480,320],[240,300],[1200,330]]}));
  winterSnow(k,[[120,566,70,10],[1480,570,66,10],[1260,420,46,7],[230,430,40,6]]);
  k.ss(()=>seasonGround(k,[30,360,1570,596],90,[[300,380,1120,540],[1130,380,1250,420],[200,370,300,410]],0,1));
  fk.add('vest',394,()=>lifeVest(k,256,394,D(394)));
  fk.add('chair',398,()=>guardChair(k,1188,398,D(398)));
  fk.add('pool',392,()=>{k.add(`<path d="${smooth(PL_RIM,true)}" fill="#000" fill-opacity="0"/>`)});
  fk.add('ramp',508,()=>{const s=D(508),P=[[1012,452],[1040,446],[1132,500],[1112,512]];shade(k,1100,512,30*s);k.shape(P,C.wood,{w:2,hatch:{side:.7,gap:4,col:C.woodD,op:.5}});
    let d='';for(let t=.12;t<1;t+=.12)d+=`M${R1(1012+(1112-1012)*t)} ${R1(452+(512-452)*t)}L${R1(1040+(1132-1040)*t)} ${R1(446+(500-446)*t)}`;k.add(`<path d="${d}" stroke="${C.woodD}" stroke-width="1.4"/>`);
    k.line([[1040,446],[1132,500]],2.2,C.ink);k.line([[1044,430],[1136,484]],2.6,C.ink);k.line([[1044,430],[1136,484]],1.4,'#FFFFFF');[[1044,446,1044,430],[1090,472,1090,456],[1134,498,1136,484]].forEach(([a,b,c2,d2])=>k.line([[a,b],[c2,d2]],2,C.ink));snowOn(k,[[1012,452],[1040,446],[1132,500]],4)});
  fk.add('sprinkler',524,()=>sprinkler(k,1404,524,D(524)));
  fk.add('parasol',462,()=>parasol(k,1508,462,D(462)));
  fk.add('lounger',566,()=>lounger(k,170,566,D(566)));
  fk.out();
  k.hw(()=>{hwJack(k,620,372,.7);hwJack(k,1300,372,.65);hwSkyBats(k,[[520,120,.8],[560,100,.6],[1420,140,.7]])});
  k.lt(()=>{ltString(k,scallop([[0,302],[200,302],[400,302],[600,302],[800,302],[1000,302],[1200,302],[1400,302],[1600,302]],8),22)});
  buntingG(k,[[300,250],[560,262],[820,250]],8,['#7FD0D2','#FFFFFF','#FCE59A'],.6);
  seasonBits(k,{drift:[[600,200,1],[900,240,.9],[1300,210,.85]],robin:[460,302,1],fly:[1300,330]});
  O.sparkle(k,860,180,7);O.heart(k,520,150,6);
  O.tape(k,6,26,90,-24,'#BDE7D2');O.tape(k,W-90,566,80,-28,'#F7B9C6')}
// a potted plant (a little palm) on the ground
function plantG(k,x,gy,s,pot){k.shape([[x-17*s,gy],[x+17*s,gy],[x+21*s,gy-32*s],[x-21*s,gy-32*s]],pot,{w:1.8,hatch:{side:.6,gap:4,col:dk(pot),op:.5}});
  [[-1.95,26],[-1.5,34],[-1.15,30],[-.8,24],[-2.35,22],[-1.3,18]].forEach(([a,l])=>{const px=x+Math.cos(a)*l*1.4*s,py=gy-36*s+Math.sin(a)*l*1.7*s;k.line([[x,gy-32*s],[px,py]],1.2,C.leafD);k.shape(E(px,py,9*s,15*s,8,a+Math.PI/2),C.leaf2,{w:1.4,one:1})});
  snowOn(k,[[x-21*s,gy-32*s],[x+21*s,gy-32*s]],4*s)}

/* ======================= the three storefronts (1000 wide, a deep pavement) ======================= */
const arch=(x0,x1,yb,yt)=>{const cx=(x0+x1)/2,w=(x1-x0)/2,s=yt+w;return [[x0,yb],[x0,s],[x0+w*.12,yt+w*.5],[x0+w*.42,yt+w*.1],[cx,yt],[x1-w*.42,yt+w*.1],[x1-w*.12,yt+w*.5],[x1,s],[x1,yb]]};
// draws fn scaled by a about the scene (matrix a 0 0 a tx ty): the storefront and its neighbours stand on y 342, so the pavement is deep.
// The lights the block pushes (window glows, lamps, bulbs, Halloween and Winter Lights glows, tiny lit windows) are moved with it.
function scaled(k,a,tx,ty,fn){const T=`matrix(${a} 0 0 ${a} ${tx} ${ty})`,P=(x,y)=>[a*x+tx,a*y+ty],n={glows:k.glows.length,lamps:k.lamps.length,bulbs:k.bulbs.length,hwl:k.hwl.length,xl:k.xl.length,top:k.top.length},sv=k.wlT;
  k.wlT=sv?sv+' '+T:T;k.add(`<g transform="${T}">`);fn();k.add('</g>');k.wlT=sv;
  for(let i=n.glows;i<k.glows.length;i++){const [x,y,w,h]=k.glows[i],p=P(x,y);k.glows[i]=[p[0],p[1],w*a,h*a]}
  for(let i=n.lamps;i<k.lamps.length;i++){const l=k.lamps[i],p=P(l.x,l.y);k.lamps[i]=Object.assign({},l,{x:p[0],y:p[1],s:l.s*a,gy:l.gy==null?l.gy:a*l.gy+ty,glass:l.glass.map(q=>P(q[0],q[1]))})}
  for(let i=n.bulbs;i<k.bulbs.length;i++){const b=k.bulbs[i],p=P(b[0],b[1]);k.bulbs[i]=[p[0],p[1]].concat(b.slice(2))}
  ['hwl','xl','top'].forEach(key=>{const A=k[key];for(let i=n[key];i<A.length;i++)A[i]=`<g transform="${T}">${A[i]}</g>`})}
// pavement dressing: a doormat at the door, chalk doodles, a drain cover, flower tubs against the wall
function doormat(k,x,y,w,col){const h=w*.16;k.fill([[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2+6,y+h/2],[x-w/2-6,y+h/2]],col,{dx:0,dy:0});k.pen([[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2+6,y+h/2],[x-w/2-6,y+h/2]],true,{w:1.5,one:1});
  k.add(`<path d="M${R1(x-w/2+8)} ${R1(y)}h${R1(w-16)}" stroke="#FFFFFF" stroke-width="1.6" stroke-dasharray="6 5" opacity=".8"/>`);snowOn(k,[[x-w/2,y-h/2],[x+w/2,y-h/2]],3)}
function chalk(k,list){if(k.env.rain||k.env.snow)return;let d='';const P={};list.forEach(([t,x,y,s,col])=>{let p='';
  if(t==='heart')p=`M${R1(x)} ${R1(y+9*s)}C${R1(x-16*s)} ${R1(y)} ${R1(x-8*s)} ${R1(y-12*s)} ${R1(x)} ${R1(y-4*s)}C${R1(x+8*s)} ${R1(y-12*s)} ${R1(x+16*s)} ${R1(y)} ${R1(x)} ${R1(y+9*s)}Z`;
  else if(t==='paw')p=`M${R1(x-7*s)} ${R1(y)}a${R1(7*s)} ${R1(5*s)} 0 1 0 ${R1(14*s)} 0a${R1(7*s)} ${R1(5*s)} 0 1 0 ${R1(-14*s)} 0`+[[-9,-8],[-3,-12],[3,-12],[9,-8]].map(([dx,dy])=>`M${R1(x+dx*s-2.4*s)} ${R1(y+dy*s)}a${R1(2.4*s)} ${R1(2*s)} 0 1 0 ${R1(4.8*s)} 0a${R1(2.4*s)} ${R1(2*s)} 0 1 0 ${R1(-4.8*s)} 0`).join('');
  else if(t==='star'){for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,rr=(j%2?5:13)*s;p+=(j?'L':'M')+R1(x+Math.cos(a)*rr)+' '+R1(y+Math.sin(a)*rr*.55)}p+='Z'}
  else if(t==='bow')p=`M${R1(x)} ${R1(y)}L${R1(x-14*s)} ${R1(y-6*s)}L${R1(x-14*s)} ${R1(y+6*s)}ZM${R1(x)} ${R1(y)}L${R1(x+14*s)} ${R1(y-6*s)}L${R1(x+14*s)} ${R1(y+6*s)}Z`;
  else if(t==='house')p=`M${R1(x-12*s)} ${R1(y+6*s)}V${R1(y-4*s)}L${R1(x)} ${R1(y-12*s)}L${R1(x+12*s)} ${R1(y-4*s)}V${R1(y+6*s)}Z`;
  P[col]=(P[col]||'')+p});Object.keys(P).forEach(c=>{d+=`<path d="${P[c]}" fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="7 2" opacity=".85"/>`});k.add(d)}
function drain(k,x,y){k.shape(E(x,y,26,8,14),'#C7BCAE',{w:1.4,one:1});k.add(`<path d="M${x-16} ${y}h32M${x-12} ${y-4}h24M${x-12} ${y+4}h24" stroke="#A39B90" stroke-width="1.3"/>`)}
function tubs(k,list){list.forEach(([x,gy,c])=>{k.shape([[x-16,gy],[x+16,gy],[x+19,gy-22],[x-19,gy-22]],'#E39A6E',{w:1.6,one:1,hatch:{side:.6,gap:3.5,col:'#C47F55',op:.5}});k.shape(blobP(x,gy-28,18,9,k.r,8,.2),k.so==='winter'?'#A3B293':C.leaf2,{w:1.2,one:1});
  if(k.so!=='winter')for(let i=0;i<3;i++)O.flower(k,x-10+i*10,gy-31-(i%2)*4,3.2,c);snowOn(k,[[x-19,gy-28],[x+19,gy-28]],4)})}
function streetSky(k,c){skyG(k,1000,384,c)}
function streetTree(k,x,gy,s){shade(k,x,gy+2,30*s);k.shape([[x-20*s,gy],[x+20*s,gy],[x+24*s,gy-26*s],[x-24*s,gy-26*s]],'#E9B9A0',{w:1.8,hatch:{side:.6,gap:4,col:'#CF9479',op:.5}});k.shape(RC(x-27*s,gy-32*s,54*s,7*s),'#D9A086',{w:1.5,one:1});
  k.line([[x,gy-30*s],[x+k.J(1),gy-80*s]],3.4,C.trunkD);const so=k.so,c=crownCols(k,C.leaf,C.leafD,x,gy)[0];
  if(so==='winter'){k.cap(()=>O.leafy(k,x,gy-104*s,34*s,30*s,c[0],c[1]));k.ss(()=>bareCrown(k,x,gy-10*s,s*.7))}else{O.leafy(k,x,gy-104*s,34*s,30*s,c[0],c[1]);if(so==='spring')k.ss(()=>{for(let i=0;i<7;i++)flowerDot(k,x+(k.r()-.5)*50*s,gy-104*s+(k.r()-.5)*40*s,2.2*s,i%2?'#FFFFFF':'#F7B6C8')})}
  snowOn(k,[[x-27*s,gy-32*s],[x+27*s,gy-32*s]],4*s)}
function planterG(k,x,gy,s,cols){shade(k,x,gy+2,26*s);k.shape([[x-22*s,gy-18*s],[x+22*s,gy-18*s],[x+18*s,gy],[x-18*s,gy]],'#E9B9A0',{w:1.6,hatch:{side:.6,gap:4,col:'#CF9479',op:.5}});
  k.shape(RC(x-24*s,gy-23*s,48*s,6*s),'#D9A086',{w:1.4,one:1});k.shape(blobP(x,gy-30*s,20*s,10*s,k.r,8,.2),k.so==='winter'?'#A3B293':C.leaf2,{w:1.3,one:1});
  if(k.so!=='winter')for(let i=0;i<3;i++)O.flower(k,x-12*s+i*12*s,gy-33*s-(i%2)*5*s,3.4*s,cols[i%cols.length]);snowOn(k,[[x-24*s,gy-30*s],[x,gy-38*s],[x+24*s,gy-30*s]],4*s)}
function pavement(k,y0){k.fill([[0,y0],[1000,y0],[1000,600],[0,600]],'#EDE6DC',{dx:0,dy:0,sc:0});paveG(k,1000,y0+2,600,500,-220,'#D3C9BC','#E2D8CB',12);
  k.shape(RC(-4,y0-6,1008,9),C.stoneD,{w:1.5,one:1});frostOn(k,[[0,y0-6],[1000,y0-6]])}
function streetBits(k,o){winterSnow(k,o.snow);k.ss(()=>seasonGround(k,[20,o.y0+10,980,596],70,o.avoid||[],0,1));
  k.fx(()=>fxG(k,1000,{sheen:[o.y0+8,598],puddles:[[300,560,40,8],[760,580,44,9]],patches:[[260,560,70,12],[760,575,64,11],[120,440,46,8],[880,430,44,8]],flies:o.flies}))}
// a big ribbon bow (the Boutique's roof sign)
function bigBow(k,x,y,s,col){const cd=dk(col);
  [[-1],[1]].forEach(([f])=>{const L=[[x,y],[x+f*30*s,y-34*s],[x+f*74*s,y-40*s],[x+f*92*s,y-14*s],[x+f*80*s,y+22*s],[x+f*40*s,y+16*s]];k.shape(L,col,{w:2.4,hatch:{side:.55,gap:4,col:cd,op:.5}});
    k.line([[x+f*14*s,y-6*s],[x+f*60*s,y-22*s],[x+f*74*s,y-2*s]],1.4,cd);
    k.shape([[x+f*6*s,y+8*s],[x+f*26*s,y+60*s],[x+f*40*s,y+82*s],[x+f*50*s,y+66*s],[x+f*30*s,y+48*s],[x+f*16*s,y+8*s]],col,{w:2,hatch:{side:.55,gap:4,col:cd,op:.5}})});
  k.shape(E(x,y+2*s,17*s,19*s,14),mixH(col,'#FFFFFF',.2),{w:2.2,hatch:{side:.55,gap:3.5,col:cd,op:.5}});k.add(`<path d="M${R1(x-6*s)} ${R1(y-8*s)}q6 8 0 20M${R1(x+6*s)} ${R1(y-8*s)}q-6 8 0 20" fill="none" stroke="${cd}" stroke-width="1.4"/>`);
  O.sparkle(k,x+104*s,y-46*s,8*s);O.sparkle(k,x-108*s,y-30*s,6*s);snowOn(k,[[x-80*s,y-38*s],[x-30*s,y-34*s],[x,y-14*s],[x+30*s,y-34*s],[x+80*s,y-38*s]],6*s)}
// the dog mannequin in the window: a crayon dog-shaped dress form on a stand, in a frilly dress
function mannequin(k,x,gy,s){k.line([[x,gy],[x,gy-60*s]],2.6,C.ink);k.shape([[x-18*s,gy],[x+18*s,gy],[x+12*s,gy-6*s],[x-12*s,gy-6*s]],C.woodD,{w:1.3,one:1});
  const b=[[x-34*s,gy-62*s],[x-38*s,gy-86*s],[x-20*s,gy-100*s],[x+22*s,gy-98*s],[x+30*s,gy-82*s],[x+26*s,gy-62*s]];k.shape(b,'#F3E3CF',{w:1.8});
  k.shape(E(x+34*s,gy-108*s,15*s,13*s,12),'#F3E3CF',{w:1.8});k.shape([[x+26*s,gy-118*s],[x+22*s,gy-136*s],[x+36*s,gy-120*s]],'#F3E3CF',{w:1.5,one:1});k.shape([[x+40*s,gy-120*s],[x+50*s,gy-134*s],[x+48*s,gy-114*s]],'#F3E3CF',{w:1.5,one:1});
  k.add(`<circle cx="${R1(x+38*s)}" cy="${R1(gy-110*s)}" r="${R1(2*s)}" fill="${C.ink}"/><ellipse cx="${R1(x+48*s)}" cy="${R1(gy-104*s)}" rx="${R1(3*s)}" ry="${R1(2.4*s)}" fill="${C.ink}"/>`);
  const dr=[[x-26*s,gy-96*s],[x+20*s,gy-96*s],[x+30*s,gy-60*s],[x+24*s,gy-52*s],[x+14*s,gy-58*s],[x+4*s,gy-50*s],[x-6*s,gy-58*s],[x-16*s,gy-50*s],[x-26*s,gy-58*s],[x-36*s,gy-52*s],[x-38*s,gy-60*s]];
  k.shape(dr,'#F7B9C6',{w:1.8,hatch:{side:.6,gap:3.5,col:'#E58FA4',op:.45}});let d='';[[-20,-84],[0,-80],[16,-88],[-10,-68],[12,-68],[-28,-70]].forEach(([dx,dy])=>{d+=`<circle cx="${R1(x+dx*s)}" cy="${R1(gy+dy*s)}" r="${R1(2.6*s)}" fill="#FFFFFF"/>`});k.add(d);
  bow(k,x+30*s,gy-124*s,.8*s,C.lav)}
function bow(k,x,y,s,col){k.shape([[x,y],[x-13*s,y-8*s],[x-14*s,y+8*s]],col,{w:1.4,one:1});k.shape([[x,y],[x+13*s,y-8*s],[x+14*s,y+8*s]],col,{w:1.4,one:1});k.add(`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(3.4*s)}" fill="${col}" stroke="${C.ink}" stroke-width="1.2"/><path d="M${R1(x-2*s)} ${R1(y+3*s)}l${R1(-4*s)} ${R1(9*s)}M${R1(x+2*s)} ${R1(y+3*s)}l${R1(4*s)} ${R1(9*s)}" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round"/>`)}
function topiary(k,x,gy,s){shade(k,x,gy+2,24*s);k.shape([[x-18*s,gy],[x+18*s,gy],[x+22*s,gy-28*s],[x-22*s,gy-28*s]],'#DCCBF2',{w:1.7,hatch:{side:.6,gap:4,col:'#B9A6E8',op:.5}});
  const col=k.so==='winter'?'#A3B293':C.leaf2,cd=k.so==='winter'?'#7F8F74':C.leafD;k.line([[x,gy-28*s],[x,gy-50*s]],3,C.trunkD);
  // a crude poodle hedge: a pom body, a pom head, pom ears, a pom tail
  [[0,-62,22,16],[24,-96,15,14],[34,-92,7,10],[-26,-74,8,8],[-14,-50,7,6],[14,-50,7,6]].forEach(([dx,dy,rx,ry])=>{const p=blobP(x+dx*s,gy+dy*s,rx*s,ry*s,k.r,9,.25);k.fill(p,col);k.hatch(p,{side:.5,gap:3.5,col:cd,op:.5});k.pen(p,true,{w:1.6})});
  k.line([[x+14*s,gy-74*s],[x+20*s,gy-86*s]],5*s,col);k.add(`<circle cx="${R1(x+28*s)}" cy="${R1(gy-98*s)}" r="${R1(1.8*s)}" fill="${C.ink}"/>`);bow(k,x+20*s,gy-108*s,.6*s,C.pink);
  snowOn(k,[[x-22*s,gy-74*s],[x,gy-78*s],[x+22*s,gy-74*s]],4*s);snowOn(k,[[x+10*s,gy-108*s],[x+24*s,gy-110*s],[x+38*s,gy-106*s]],3*s)}
function scBoutique(k,F,o){const e=k.env,D=y=>dep(F,y),fk=floorKit(k),L='#DCCBF2',LD='#B9A6E8',PK='#F7B9C6';
  streetSky(k,{sun:[880,70,28],low:[900,260,32],moon:[880,70,24],clouds:[[130,60,22],[820,150,16],[180,180,16]],rainC:[[400,30,28],[700,40,26]],birds:[[160,120,7],[180,128,5]]});
  jpFuji(k,130,330,190);
  hills(k,1000,[[0,330],[220,306],[460,322],[700,300],[1000,318]],384,'#DCEDC4');farTrees(k,[[60,326,.9],[200,316,.8],[820,312,.9],[940,320,.8]]);
  scaled(k,.9,50,-3.6,()=>{
  // the neighbours: a peach house on the left, a hedge and a lamp on the right
  k.shape(RC(-60,214,274,170),C.wall,{w:2,hatch:{side:.8,gap:5,col:dk(C.wall),op:.3}});k.shape([[-66,218],[80,146],[226,218]],C.roof,{w:2,hatch:{side:.6,gap:4,col:C.roofD,op:.5}});snowOn(k,[[-66,218],[80,146],[226,218]],7);
  O.window(k,56,262,46,44,{curtain:'#FFC9D3',box:1});O.window(k,140,262,46,44,{curtain:'#FFC9D3'});
  {const hp=[[780,384]];for(let x=780;x<=1060;x+=34)hp.push([x+17,344-k.r()*8],[Math.min(1060,x+34),354]);hp.push([1060,384]);const col=k.so==='winter'?'#A3B293':C.leaf2;k.shape(hp,col,{w:1.8,hatch:{side:.4,gap:4.5,col:C.leafD,op:.5}});snowOn(k,hp.slice(1,-1),5)}
  // the Boutique: lilac walls, the scalloped pink roof, the huge bow
  k.shape(RC(262,118,476,268),L,{w:2.4,hatch:{side:.84,gap:5,col:LD,op:.35}});
  {let d='';for(let x=284;x<730;x+=28)d+=`M${x} 124V384`;k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="2" opacity=".4"/>`)}
  const rf=[[244,128],[756,128],[724,66],[276,66]];k.shape(rf,PK,{w:2.4,hatch:{side:.6,gap:4,col:'#E58FA4',op:.45}});
  {let d='';for(let row=0;row<3;row++){const y=80+row*16;for(let x=284+(row%2)*14;x<720;x+=28)d+=`M${x} ${y}q14 14 28 0`}k.add(`<path d="${d}" fill="none" stroke="#E58FA4" stroke-width="1.5"/>`);
   const sc=[[244,128]];for(let x=244;x<756;x+=32)sc.push([x+16,148],[Math.min(756,x+32),128]);k.shape(sc,PK,{w:1.9,one:1})}
  snowOn(k,[[274,66],[726,66]],9);bigBow(k,500,40,1,'#F28FA5');
  [[350,184],[650,184]].forEach(([x,y])=>{k.shape(E(x,y,28,28,18),'#FFFFFF',{w:2});k.shape(E(x,y,21,21,16),C.glass,{w:1.5,one:1});k.line([[x,y-21],[x,y+21]],1.6);k.line([[x-21,y],[x+21,y]],1.6);if(e.lit)k.glows.push([x-15,y-15,30,30]);
    k.shape(RC(x-34,y+30,68,12),'#E9B9A0',{w:1.6,one:1});if(k.so!=='winter')for(let i=0;i<4;i++)O.flower(k,x-24+i*16,y+28-(i%2)*4,3.6,[C.red,C.yellow,'#FFB3C7',C.lav][i])});
  k.shape(RC(474,154,52,30),'#FFFFFF',{w:1.7});bow(k,500,168,.9,'#F28FA5');
  // the display window with the mannequin and hanging bows, its awning and planter
  O.awning(k,288,206,200,20,L,'#FFFFFF');
  k.shape(RC(296,238,184,128),'#FFFFFF',{w:2.2});k.shape(RC(304,246,168,112),C.glass,{w:1.6,one:1});if(e.lit)k.glows.push([304,246,168,112]);
  k.add(`<path d="M318 340l40 -70M340 346l26 -46" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`);
  [[330,'#F28FA5'],[440,C.mint],[456,C.yellow]].forEach(([x,c],i)=>{k.line([[x,246],[x,262+i*8]],1,C.ink,{op:.7});bow(k,x,268+i*8,.75,c)});
  mannequin(k,392,356,.9);
  k.shape(RC(290,364,196,14),'#E9B9A0',{w:1.6,one:1});
  // the door: pink, arched, a round window and a bow; the steps
  const door=()=>{k.shape(arch(540,640,384,226),'#FFFFFF',{w:2.2});k.shape(arch(550,630,384,236),'#F28FA5',{w:2,hatch:{side:.7,gap:4,col:'#E0708A',op:.45}});
    k.shape(E(590,278,16,16,14),C.glass,{w:1.6,one:1});k.line([[574,278],[606,278]],1.4);bow(k,590,316,1.1,C.lav);k.add(`<circle cx="618" cy="330" r="3" fill="${C.ink}"/>`);if(e.lit)k.glows.push([578,266,24,24]);
    k.shape(RC(532,374,116,10),C.stoneD,{w:1.6,one:1});k.shape(RC(540,366,100,9),C.stone,{w:1.4,one:1});k.shape(RC(552,382,76,6),'#F7B9C6',{w:1.1,one:1})};
  hot(k,'data-shop','boutique','Bow-Wow Boutique',RC(522,208,136,182),k.cap(door));
  O.window(k,664,246,50,74,{curtain:'#FFC9D3'});
  k.ss(()=>{if(k.so==='winter'&&!e.ny)wreath(k,590,252,.9);else if(k.so==='autumn'){pumpkin(k,532,372,.6);pumpkin(k,650,374,.5)}else if(k.so==='spring')bulbs(k,526,376,2,.6)});
  k.lt(()=>{ltString(k,scallop([[262,126],[380,126],[500,126],[620,126],[738,126]],10),18);ltString(k,sagP(540,236,640,236,6,10),16)});
  k.ny(()=>{nyKado(k,526,384,.75,1);nyKado(k,654,384,.75,-1);nyKites(k,[[860,120,.8,0,820,320]])});
  k.hw(()=>{hwJack(k,520,384,.8);hwJack(k,660,384,.7);hwBatString(k,296,480,214,8,4,.6);hwSkyBats(k,[[860,110,.8],[900,90,.6]])});
  k.jp(()=>{k.shape(RC(552,236,76,30),'#5E86BE',{w:1.4,one:1});k.add(`<path d="M590 236v30" stroke="#FFFFFF" stroke-width="2"/>`)});
  O.lamp(k,236,392,.86);O.lamp(k,764,392,.86);
  });
  pavement(k,346);
  pawTrail(k,[[560,540,1],[588,528,1],[606,512,.95],[620,494,.95],[600,470,.9],[594,450,.9]],'#D6CCBE');
  doormat(k,581,360,92,'#F7B9C6');chalk(k,[['heart',240,420,1,'#F28FA5'],['paw',420,470,1.1,'#B9A6E8'],['star',760,520,1.2,'#F7D24E'],['bow',520,560,1.3,'#F28FA5'],['heart',880,560,1,'#B9A6E8']]);drain(k,120,560);tubs(k,[[256,352,C.red],[742,352,'#FFB3C7']])
  streetBits(k,{y0:346,snow:[[120,560,70,10],[880,566,64,10],[440,590,80,8]],avoid:[[90,400,250,480],[660,390,760,440],[820,400,940,480]],flies:[[160,330],[860,320]]});
  fk.add('bench',452,()=>benchG(k,150,452,D(452)));
  fk.add('bowl',388,()=>bowlG(k,690,388,D(388),C.lav));
  fk.add('topiary',440,()=>topiary(k,880,440,D(440)));
  fk.add('planter',540,()=>planterG(k,330,540,D(540),[C.red,'#FFB3C7',C.lav]));
  fk.out();
  seasonBits(k,{drift:[[820,240,1],[140,300,.9],[900,330,.85]],robin:[180,220,1],fly:[860,300]});
  O.sparkle(k,860,200,7);O.heart(k,170,120,6);
  O.tape(k,6,26,90,-24,'#DCCBF2');O.tape(k,910,566,80,-28,'#F7B9C6')}
// Barkitecture: the saw-tooth roof with glass faces, the giant hammer, the open barn door with tools inside
function hammer(k,x0,y0,x1,y1,s){const a=Math.atan2(y1-y0,x1-x0),c=Math.cos(a),n=Math.sin(a),P=(u,v)=>[x0+u*c-v*n,y0+u*n+v*c],L=Math.hypot(x1-x0,y1-y0);
  k.shape([P(0,-9*s),P(L,-11*s),P(L,11*s),P(0,9*s)],'#E2B07E',{w:2.2,hatch:{side:.6,gap:4,col:'#C58F5E',op:.5}});k.line([P(20*s,0),P(L-30*s,-2*s)],1.4,'#C58F5E');
  [0,1,2].forEach(i=>k.shape([P(14*s+i*14*s,-10*s),P(22*s+i*14*s,-10*s),P(22*s+i*14*s,10*s),P(14*s+i*14*s,10*s)],'#F28FA5',{w:1.1,one:1}));
  const h=[P(L-14*s,-58*s),P(L+30*s,-58*s),P(L+30*s,40*s),P(L-14*s,40*s)];k.shape(h,'#AEB8C4',{w:2.4,hatch:{side:.6,gap:4,col:'#8794A3',op:.55}});
  k.shape([P(L-14*s,40*s),P(L+30*s,40*s),P(L+22*s,78*s),P(L+4*s,86*s),P(L-6*s,78*s)],'#AEB8C4',{w:2.2,hatch:{side:.6,gap:4,col:'#8794A3',op:.55}});
  k.shape([P(L+30*s,-50*s),P(L+46*s,-46*s),P(L+46*s,-12*s),P(L+30*s,-8*s)],'#C9CED6',{w:1.8,one:1});
  k.line([P(L-6*s,-50*s),P(L+20*s,-50*s)],2.4,'#FFFFFF',{op:.8});snowOn(k,[P(L-16*s,-58*s),P(L+32*s,-58*s)],6*s)}
function plankStack(k,x,gy,s){const cols=['#E2B98A','#EBCDA4','#D9A97A','#E8C597'];for(let i=0;i<5;i++){const lx=x+i*12*s,top=gy-170*s+i*6*s;k.shape([[lx,gy],[lx+16*s,gy],[lx+30*s,top],[lx+16*s,top]],cols[i%4],{w:1.6,one:1,hatch:{side:.6,gap:4,col:'#C29468',op:.4}})}
  snowOn(k,[[x+14*s,gy-172*s],[x+76*s,gy-148*s]],4*s)}
function dogHouseKit(k,x,gy,s){shade(k,x,gy+3,80*s,10*s);const w=120*s,h=70*s,x0=x-w/2,x1=x+w/2;
  k.shape([[x0-8*s,gy],[x1+8*s,gy],[x1+2*s,gy-10*s],[x0-2*s,gy-10*s]],C.woodD,{w:1.6,one:1});
  // the boarded left half, the open frame on the right, the rafters of the roof, a little paw sign
  for(let i=0;i<5;i++){const y=gy-10*s-(i+1)*12*s;k.shape(RC(x0,y,w*.55,11*s),i%2?'#EBCDA4':'#E2B98A',{w:1.2,one:1})}
  [x0,x0+w*.55,x1].forEach(px=>k.shape(RC(px-3*s,gy-10*s-h,6*s,h),'#E2B98A',{w:1.3,one:1}));k.shape(RC(x0,gy-14*s-h,w,6*s),'#E2B98A',{w:1.3,one:1});
  k.add(`<path d="M${R1(x0+w*.28-14*s)} ${R1(gy-10*s)}v${R1(-26*s)}q${R1(14*s)} ${R1(-16*s)} ${R1(28*s)} 0v${R1(26*s)}z" fill="#8A6A5A" stroke="${C.ink}" stroke-width="1.6"/>`);
  [[x0-10*s,gy-14*s-h,x,gy-14*s-h-56*s],[x1+10*s,gy-14*s-h,x,gy-14*s-h-56*s]].forEach(([a,b,c2,d2])=>{k.line([[a,b],[c2,d2]],R1(7*s),C.ink,{amp:.2});k.line([[a,b],[c2,d2]],R1(4.6*s),'#E2B98A',{amp:.1})});
  k.line([[x0+20*s,gy-14*s-h-18*s],[x1-20*s,gy-14*s-h-18*s]],R1(4*s),'#D9A97A');
  k.shape(RC(x1-22*s,gy-48*s,30*s,20*s),'#FFFBF3',{w:1.2,one:1});k.add(`<g fill="${C.pink}"><ellipse cx="${R1(x1-7*s)}" cy="${R1(gy-35*s)}" rx="${R1(4*s)}" ry="${R1(3*s)}"/><circle cx="${R1(x1-12*s)}" cy="${R1(gy-41*s)}" r="${R1(1.6*s)}"/><circle cx="${R1(x1-7*s)}" cy="${R1(gy-43*s)}" r="${R1(1.6*s)}"/><circle cx="${R1(x1-2*s)}" cy="${R1(gy-41*s)}" r="${R1(1.6*s)}"/></g>`);
  // a hammer and a few nails on the floor beside it
  k.line([[x1+14*s,gy-2*s],[x1+48*s,gy-10*s]],R1(4*s),'#C58F5E');k.shape(RC(x1+42*s,gy-20*s,10*s,18*s),'#AEB8C4',{w:1.2,one:1});
  snowOn(k,[[x0,gy-14*s-h],[x0+w*.55,gy-14*s-h]],4*s);k.hw(()=>hwJack(k,x0+w*.28,gy-14*s-h,.6*s))}
function sawhorse(k,x,gy,s){shade(k,x,gy+2,50*s);[[-34],[34]].forEach(([dx])=>{k.line([[x+dx*s-12*s,gy],[x+dx*s,gy-46*s],[x+dx*s+12*s,gy]],R1(4*s+1),C.ink);k.line([[x+dx*s-12*s,gy],[x+dx*s,gy-46*s],[x+dx*s+12*s,gy]],R1(2.8*s),'#E2B98A')});
  k.shape(RC(x-52*s,gy-54*s,104*s,9*s),'#E2B98A',{w:1.6,one:1});k.shape(RC(x-70*s,gy-63*s,128*s,9*s),'#EBCDA4',{w:1.5,one:1});
  let d='';for(let i=0;i<10;i++){const px=x+(k.r()-.5)*90*s,py=gy-2*s+(k.r()-.5)*8*s;d+=`M${R1(px)} ${R1(py)}q2 -3 4 0`}k.add(`<path d="${d}" fill="none" stroke="#C29468" stroke-width="1.2"/>`);
  snowOn(k,[[x-70*s,gy-63*s],[x+58*s,gy-63*s]],4*s)}
function logBench(k,x,gy,s){shade(k,x,gy+2,56*s);[[-36],[36]].forEach(([dx])=>{k.shape(RC(x+dx*s-12*s,gy-28*s,24*s,28*s),C.trunk,{w:1.5,one:1,hatch:{side:.6,gap:3,col:C.trunkD,op:.5}});k.shape(E(x+dx*s,gy-28*s,12*s,4*s,10),'#F0D6B0',{w:1.1,one:1})});
  k.shape(RC(x-60*s,gy-40*s,120*s,12*s),'#D9A97A',{w:1.7,one:1,hatch:{side:.7,gap:4,col:'#B5875C',op:.5}});snowOn(k,[[x-60*s,gy-40*s],[x+60*s,gy-40*s]],5*s);frostOn(k,[[x-58*s,gy-40*s],[x+58*s,gy-40*s]])}
function scBuilder(k,F,o){const e=k.env,D=y=>dep(F,y),fk=floorKit(k),WD='#E2B98A',WDD='#C29468';
  streetSky(k,{sun:[150,74,28],low:[130,260,32],moon:[140,70,24],clouds:[[420,50,20],[880,80,22],[700,150,14]],rainC:[[300,30,28],[760,40,26]],birds:[[820,140,7],[842,150,5]]});
  jpFuji(k,890,334,200);
  hills(k,1000,[[0,320],[260,300],[520,316],[780,298],[1000,312]],384,'#DCEDC4');farTrees(k,[[40,316,.9],[880,306,.8],[960,310,.9]]);
  scaled(k,.9,50,-3.6,()=>{
  // the river and its reeds on the left, a willow; the timber yard on the right
  k.fill([[-60,340],[200,344],[204,384],[-60,384]],C.water,{dx:0,dy:0,sc:0});{let wv='';for(let i=0;i<8;i++){const x=-50+k.r()*230,y=350+k.r()*28;wv+=`M${R1(x)} ${R1(y)}q6 -5 12 0t12 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.5" stroke-linecap="round"/>`)}
  {let d='';for(let x=-52;x<210;x+=14){d+=`M${x} 384q-2 -22 3 -36M${x+5} 384q3 -16 -1 -28`}k.add(`<path d="${d}" fill="none" stroke="#7FA86A" stroke-width="2" stroke-linecap="round"/>`);[[30,346],[96,342],[170,350]].forEach(([x,y])=>{k.shape(E(x,y,3.4,8,8),'#A97E5A',{w:1,one:1})})}
  {const x=110,gy=346;k.line([[x,gy],[x-4,gy-110],[x+6,gy-150]],7,C.trunkD);const col=k.so==='autumn'?'#E3C36A':k.so==='winter'?'#C9C2B4':'#B9DD92';let d='';for(let i=0;i<16;i++){const sx=x-80+i*11,sy=gy-150+Math.abs(i-8)*4;d+=`M${R1(sx)} ${R1(sy)}q${R1(k.J(6))} 50 ${R1(k.J(8))} ${R1(90+k.r()*30)}`}
   k.shape(blobP(x,gy-156,80,30,k.r,10,.2),col,{w:1.8,hatch:{side:.5,gap:4.5,col:dk(col),op:.5}});k.add(`<path d="${d}" fill="none" stroke="${dk(col)}" stroke-width="2.2" stroke-linecap="round"/>`);snowOn(k,blobP(x,gy-162,80,24,k.r,8,.1).slice(4,8).concat([]),5)}
  [[850,356],[890,350],[930,358],[870,330],[910,326]].forEach(([x,y])=>{k.shape(E(x,y,24,14,12),C.trunk,{w:1.6,one:1,hatch:{side:.6,gap:3,col:C.trunkD,op:.5}});k.shape(E(x-18,y,7,12,10),'#F0D6B0',{w:1.3,one:1});k.add(`<ellipse cx="${x-18}" cy="${y}" rx="3" ry="6" fill="none" stroke="#C9A07A" stroke-width="1"/>`)});
  snowOn(k,[[846,316],[910,312],[950,326]],5);[972,994,1016,1038,1060].forEach(x=>O.board(k,x,296,20,88,C.wood,C.woodD,true));
  // the workshop
  k.shape(RC(226,166,548,220),WD,{w:2.4});{let d='';for(let y=180;y<384;y+=14)d+=`M228 ${y}H772`;k.add(`<path d="${d}" stroke="${WDD}" stroke-width="1.3" opacity=".75"/>`);let n='';for(let i=0;i<26;i++)n+=`<circle cx="${R1(240+k.r()*520)}" cy="${R1(184+k.r()*190)}" r="1.4" fill="${C.ink}" opacity=".5"/>`;k.add(n)}
  k.hatch(RC(226,166,548,220),{side:.82,gap:5,col:WDD,op:.35});
  [[226,413],[413,600],[600,786]].forEach(([a,b],i)=>{const t=[[a-4,170],[a,94],[b+4,170]];k.shape(t,'#AFC3D6',{w:2.2,hatch:{side:.55,gap:4,col:'#8DA4BD',op:.5}});
    k.shape([[a+4,166],[a+4,104],[a+16,110],[a+16,166]],C.glass,{w:1.4,one:1});k.line([[a+10,106],[a+10,166]],1.2,C.ink,{op:.6});if(e.lit)k.glows.push([a+4,110,12,54]);snowOn(k,[[a,96],[b+4,170]],7)});
  hammer(k,360,92,600,30,1);
  // the sign plank with a dog house drawn on it, the wide doorway with the tools inside, the slid-open door
  k.shape(RC(430,180,140,30),'#F0D6B0',{w:2});mOut(k,[[486,204],[486,192],[500,184],[514,192],[514,204]],C.red);k.add('<path d="M496 204v-6q4 -4 8 0v6" fill="#5E463D"/>');
  const doorway=()=>{k.shape(RC(400,222,200,162),'#8A6A5A',{w:2.4});k.fill(RC(404,226,192,156),'#76594C',{dx:0,dy:0,op:.6});
    let pg='';for(let y=236;y<300;y+=10)for(let x=414;x<590;x+=10)pg+=`M${x} ${y}h.1`;k.add(`<path d="${pg}" stroke="#5E463D" stroke-width="2.4" stroke-linecap="round"/>`);
    k.line([[430,250],[470,250],[470,262],[436,262]],2.4,'#C9CED6');k.shape([[480,244],[528,244],[528,270],[490,282],[480,270]],'#C9CED6',{w:1.4,one:1});k.line([[540,244],[540,290]],3,'#E2B07E');k.shape(RC(532,240,16,10),'#AEB8C4',{w:1.2,one:1});
    k.line([[564,246],[580,286]],3,'#AEB8C4');k.shape(E(562,244,6,6,8),'#AEB8C4',{w:1.2,one:1});
    k.shape(RC(410,316,180,12),'#C58F5E',{w:1.8,one:1});[[420],[580]].forEach(([x])=>k.line([[x,328],[x,382]],4,'#5E463D'));
    k.shape(RC(440,296,40,20),C.red,{w:1.3,one:1});k.shape(RC(500,302,56,14),'#F0D6B0',{w:1.3,one:1});if(e.lit)k.glows.push([404,226,192,90])};
  hot(k,'data-shop','builder','Barkitecture',RC(392,214,216,174),k.cap(doorway));
  {const dp=RC(604,214,130,170);k.shape(dp,'#C97B5E',{w:2.2,hatch:{side:.7,gap:4.5,col:'#A85E44',op:.45}});k.line([[606,216],[732,382]],3,'#F0D6B0');k.line([[732,216],[606,382]],3,'#F0D6B0');k.shape(RC(598,206,142,8),'#8794A3',{w:1.4,one:1})}
  plankStack(k,250,384,.95);O.window(k,330,236,46,52,{frame:'#FFFFFF'});
  k.ss(()=>{if(k.so==='winter'&&!e.ny)wreath(k,500,166,.8);else if(k.so==='autumn'){pumpkin(k,392,382,.6);pumpkin(k,612,384,.55)}else if(k.so==='spring')bulbs(k,380,384,2,.6)});
  k.lt(()=>{ltString(k,sagP(226,172,413,172,6,10),18);ltString(k,sagP(413,172,600,172,6,10),18);ltString(k,sagP(600,172,774,172,6,10),18)});
  k.ny(()=>{nyKado(k,386,384,.75,1);nyKado(k,620,384,.75,-1);nyShime(k,500,214,.8)});
  k.hw(()=>{hwHayJack(k,800,384,.9);hwJack(k,388,384,.7);hwSkyBats(k,[[300,120,.8],[340,100,.6]]);hwCutout(k,180,384,.8)});
  k.jp(()=>{jpToro(k,940,390,.7)});
  O.lamp(k,800,392,.86);
  });
  pavement(k,346);
  {let d='';for(let i=0;i<40;i++){const x=200+k.r()*620,y=392+k.r()*190;d+=`M${R1(x)} ${R1(y)}q3 -4 6 0`}k.add(`<path d="${d}" fill="none" stroke="#D2B48A" stroke-width="1.3" stroke-linecap="round"/>`)}
  pawTrail(k,[[480,560,1],[502,546,1],[522,530,.95],[536,512,.95],[530,490,.9]],'#D6CCBE');
  doormat(k,500,362,150,'#C29468');chalk(k,[['house',280,420,1,'#FFFFFF'],['paw',600,470,1.1,'#F7D24E'],['star',420,560,1.2,'#9EB2EC'],['paw',860,560,1,'#FFFFFF']]);drain(k,700,560);{let d='';for(let i=0;i<10;i++){const x=380+k.r()*240,y=364+k.r()*40;d+=`M${R1(x)} ${R1(y)}q3 -4 6 0q2 3 5 0`}k.add(`<path d="${d}" fill="none" stroke="#D9A97A" stroke-width="1.6" stroke-linecap="round"/>`)}
  streetBits(k,{y0:346,snow:[[120,570,70,10],[880,566,64,10],[480,590,80,8]],avoid:[[60,400,200,450],[680,400,880,490],[150,480,330,540]],flies:[[100,330],[860,320],[160,280]]});
  fk.add('bench',420,()=>logBench(k,120,420,D(420)));
  fk.add('bowl',388,()=>bowlG(k,650,388,D(388),C.orange));
  fk.add('doghouse',470,()=>dogHouseKit(k,790,470,D(470)));
  fk.add('sawhorse',530,()=>sawhorse(k,250,530,D(530)));
  fk.out();
  seasonBits(k,{drift:[[700,240,1],[300,300,.9],[880,280,.85]],robin:[90,330,1],fly:[700,330]});
  O.sparkle(k,700,200,7);O.heart(k,820,130,6);
  O.tape(k,6,26,90,-24,'#EBCDA4');O.tape(k,910,566,80,-28,'#BDE7D2')}
// Pip's Sprout Cart: a mint cart on two big wheels under a green striped canopy, on the Hilltop trail by the allotments
function seedPacket(k,x,y,s,col,kind){k.shape(RC(x-8*s,y-22*s,16*s,22*s),'#FFFBF3',{w:1.2,one:1});k.shape(RC(x-8*s,y-22*s,16*s,7*s),col,{w:1,one:1,noline:1,dx:0,dy:0});
  if(kind===0)O.flower(k,x,y-9*s,2.6*s,col);else if(kind===1)k.add(`<circle cx="${R1(x)}" cy="${R1(y-8*s)}" r="${R1(3.4*s)}" fill="#F4A3A3" stroke="${C.ink}" stroke-width=".9"/><path d="M${R1(x)} ${R1(y-11*s)}l${R1(2*s)} ${R1(-3*s)}" stroke="#6FAE5C" stroke-width="1.2"/>`);
  else k.add(`<path d="M${R1(x-3*s)} ${R1(y-4*s)}q${R1(3*s)} ${R1(-10*s)} ${R1(6*s)} 0" fill="#F8C08A" stroke="${C.ink}" stroke-width=".9"/><path d="M${R1(x)} ${R1(y-10*s)}l${R1(-2*s)} ${R1(-3*s)}M${R1(x)} ${R1(y-10*s)}l${R1(2*s)} ${R1(-3*s)}" stroke="#6FAE5C" stroke-width="1.2"/>`)}
function bigWheel(k,x,y,r){k.shape(E(x,y,r,r,22),'#FFFBF3',{w:2.4});k.add(`<circle cx="${x}" cy="${y}" r="${R1(r-6)}" fill="none" stroke="#7FB89A" stroke-width="5"/>`);
  let d='';for(let i=0;i<10;i++){const a=i/10*Math.PI*2+.2;d+=`M${R1(x+Math.cos(a)*7)} ${R1(y+Math.sin(a)*7)}L${R1(x+Math.cos(a)*(r-8))} ${R1(y+Math.sin(a)*(r-8))}`}k.add(`<path d="${d}" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>`);
  k.shape(E(x,y,9,9,12),'#F28FA5',{w:1.6,one:1});snowOn(k,[[x-r*.8,y-r*.6],[x,y-r],[x+r*.8,y-r*.6]],4)}
function sunflowerPot(k,x,gy,s){shade(k,x,gy+2,26*s);k.shape([[x-20*s,gy],[x+20*s,gy],[x+25*s,gy-36*s],[x-25*s,gy-36*s]],'#E39A6E',{w:1.8,hatch:{side:.6,gap:4,col:'#C47F55',op:.5}});k.shape(RC(x-28*s,gy-42*s,56*s,8*s),'#D98A5E',{w:1.5,one:1});
  const so=k.so;if(so==='winter'){k.line([[x,gy-42*s],[x+4*s,gy-110*s],[x+16*s,gy-128*s]],3,'#9C8A6A');k.shape(E(x+18*s,gy-132*s,12*s,9*s,10),'#8A6A4A',{w:1.4,one:1});snowOn(k,[[x+6*s,gy-140*s],[x+30*s,gy-136*s]],4*s);snowOn(k,[[x-28*s,gy-42*s],[x+28*s,gy-42*s]],5*s);return}
  const tall=so==='spring'?.55:1,top=gy-42*s-130*s*tall;k.line([[x,gy-42*s],[x+3*s,top+20*s],[x,top]],3.2,'#6FAE5C');
  [[-1,.45],[1,.62]].forEach(([f,t])=>{const ly=gy-42*s-(gy-42*s-top)*t;k.shape(E(x+f*18*s,ly,16*s,7*s,10,f*.5),'#9CCB80',{w:1.3,one:1})});
  if(so==='spring'){k.shape(E(x,top,9*s,12*s,10),'#9CCB80',{w:1.4,one:1});return}
  const pc=so==='autumn'?'#E8A84E':'#F7D24E',p=[];for(let i=0;i<26;i++){const a=i/26*Math.PI*2,rr=i%2?21*s:31*s;p.push([x+Math.cos(a)*rr,top+Math.sin(a)*rr])}k.shape(p,pc,{w:1.8,hatch:{side:.6,gap:3.5,col:'#E0A82E',op:.45}});
  k.shape(E(x,top,14*s,14*s,14),'#8A5A3A',{w:1.8,one:1});let d='';for(let i=0;i<12;i++)d+=`<circle cx="${R1(x+(k.r()-.5)*18*s)}" cy="${R1(top+(k.r()-.5)*18*s)}" r="1.3" fill="#5E3D2A"/>`;k.add(d);
  k.add(`<path d="M${R1(x-5*s)} ${R1(top-2*s)}q2 -2 4 0M${R1(x+2*s)} ${R1(top-2*s)}q2 -2 4 0M${R1(x-4*s)} ${R1(top+4*s)}q4 4 8 0" fill="none" stroke="#FFE7B0" stroke-width="1.4" stroke-linecap="round"/>`)}
function seedCrates(k,x,gy,s){shade(k,x+20*s,gy+2,50*s);crate(k,x-36*s,gy-34*s,56*s,34*s);crate(k,x+20*s,gy-34*s,56*s,34*s);crate(k,x-8*s,gy-66*s,56*s,32*s);
  for(let i=0;i<4;i++){const px=x-30*s+i*13*s;k.line([[px,gy-34*s],[px+k.J(1),gy-46*s]],1.4,'#6FAE5C');if(k.so!=='winter')k.shape(E(px+2*s,gy-48*s,5*s,3*s,8,-.5),'#9CCB80',{w:1,one:1})}
  snowOn(k,[[x-8*s,gy-66*s],[x+48*s,gy-66*s]],4*s)}
function wateringCan(k,x,gy,s){k.shape([[x-14*s,gy],[x+14*s,gy],[x+12*s,gy-24*s],[x-12*s,gy-24*s]],'#9EB2EC',{w:1.6,one:1,hatch:{side:.6,gap:3,col:'#7F94CF',op:.45}});
  k.line([[x+12*s,gy-8*s],[x+30*s,gy-26*s]],3,C.ink);k.shape(E(x+31*s,gy-27*s,4*s,2.4*s,8,-.7),'#9EB2EC',{w:1.1,one:1});k.add(`<path d="M${R1(x-10*s)} ${R1(gy-24*s)}q${R1(10*s)} ${R1(-18*s)} ${R1(20*s)} 0" fill="none" stroke="${C.ink}" stroke-width="2"/>`)}
function scSprout(k,F,o){const e=k.env,D=y=>dep(F,y),fk=floorKit(k),M='#C9EBDA',MD='#9FD3BC';
  streetSky(k,{sun:[820,76,28],low:[860,250,32],moon:[840,70,24],clouds:[[180,60,22],[520,90,18],[940,150,14]],rainC:[[320,30,28],[700,40,26]],birds:[[300,120,7],[322,128,5]]});
  jpFuji(k,170,300,220);
  scaled(k,.9,50,-3.6,()=>{
  // the hill trail rising to the right, the allotments with bean poles, a shed and the hedgerow
  hills(k,1060,[[-60,304],[300,284],[600,262],[800,236],[1060,206]],384,'#D2E8BA');
  {const tr=[[640,384],[690,330],[760,296],[850,262],[940,236],[1000,224]];k.line(tr,14,'#EFDDBA',{amp:.4});k.line(tr,1.4,'#C9AE77',{amp:.4})}
  k.fill([[-60,320],[1060,298],[1060,384],[-60,384]],C.grass,{dx:0,dy:0,sc:0});
  {let d='';for(let r=0;r<3;r++){const y=330+r*16;d+=`M20 ${y}h600M680 ${y-8}h300`}k.add(`<path d="${d}" stroke="${C.soil}" stroke-width="7" stroke-linecap="round" opacity=".75"/>`);
   [[60,310],[110,310],[160,310],[750,296],[800,296]].forEach(([x,y])=>{k.line([[x-14,y+30],[x,y-30],[x+14,y+30]],2,C.trunkD);k.line([[x-8,y+10],[x+8,y+10]],1.4,C.trunkD);if(k.so!=='winter'){let lv='';for(let i=0;i<6;i++)lv+=`M${R1(x+(k.r()-.5)*20)} ${R1(y-24+i*8)}q4 -3 7 1`;k.add(`<path d="${lv}" fill="none" stroke="#6FAE5C" stroke-width="2.4" stroke-linecap="round"/>`)}})}
  {const x=900,gy=322;k.shape(RC(x-40,gy-50,80,50),'#BDE7D2',{w:2,hatch:{side:.7,gap:4,col:'#9FD3BC',op:.5}});const rf=[[x-48,gy-48],[x,gy-76],[x+48,gy-48]];k.shape(rf,'#C97B5E',{w:2});k.shape(RC(x-12,gy-36,24,36),C.woodD,{w:1.5,one:1});snowOn(k,rf,6)}
  {const hp=[[-60,384]];for(let x=-60;x<=1060;x+=40)hp.push([x+20,364-k.r()*8],[Math.min(1060,x+40),372]);hp.push([1060,384]);const col=k.so==='winter'?'#A3B293':k.so==='autumn'?'#C9C27A':C.leaf2;k.shape(hp,col,{w:1.8,hatch:{side:.4,gap:4.5,col:C.leafD,op:.5}});
   if(k.so==='spring')k.ss(()=>{for(let i=0;i<14;i++)flowerDot(k,k.r()*1000,366+k.r()*12,2,i%2?'#FFFFFF':'#F9C6D4')});snowOn(k,hp.slice(1,-1),5)}
  // the cart
  const cart=()=>{const top=252,bot=344;
    [[352,top],[648,top]].forEach(([x])=>k.line([[x,top],[x,148]],3.6,C.ink));
    O.awning(k,318,128,364,30,'#9CCB80','#FFFFFF');
    k.shape(RC(336,top+10,328,bot-top-10),M,{w:2.4,hatch:{side:.8,gap:5,col:MD,op:.5}});{let d='';for(let x=362;x<660;x+=30)d+=`M${x} ${top+12}V${bot-2}`;k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="1.6" opacity=".6"/>`)}
    k.shape(RC(326,top,348,12),C.wood,{w:2,one:1});
    // seed packets on a string along the front, rows of packets on the counter, a crate of seedlings, a watering can, a straw hat
    k.line(sagP(346,top+24,654,top+24,8,14),1.2,C.ink,{op:.8});[0,1,2,3,4,5,6,7].forEach(i=>{const x=362+i*40,y=top+24+Math.sin(Math.PI*(x-346)/308)*8;k.add(`<rect x="${R1(x-2)}" y="${R1(y-2)}" width="4" height="5" fill="#F7D24E"/>`);seedPacket(k,x,y+28,1.1,[C.red,C.yellow,C.lav,'#9CCB80','#F8C08A'][i%5],i%3)});
    [[372,C.red],[396,C.yellow],[420,C.lav],[444,'#9CCB80']].forEach(([x,c],i)=>seedPacket(k,x,top,.95,c,i%3));
    crate(k,470,top-30,70,30);for(let i=0;i<5;i++){const px=480+i*12;k.line([[px,top-30],[px+k.J(1),top-44]],1.4,'#6FAE5C');if(k.so!=='winter')k.shape(E(px+2,top-46,5,3,8,-.5),'#9CCB80',{w:1,one:1})}
    wateringCan(k,580,top,1);
    k.shape(E(640,top-4,30,7,12),'#F3D58E',{w:1.6,one:1});k.shape([[624,top-6],[628,top-24],[652,top-24],[656,top-6]],'#F3D58E',{w:1.6,one:1});k.shape(RC(626,top-14,28,5),'#F28FA5',{w:1,one:1});
    // the shafts and the two big wheels
    k.line([[336,bot-20],[262,bot+6]],5,C.ink);k.line([[336,bot-20],[262,bot+6]],3,C.wood);k.line([[336,bot-36],[256,bot-14]],5,C.ink);k.line([[336,bot-36],[256,bot-14]],3,C.wood);
    bigWheel(k,394,bot,50);bigWheel(k,606,bot,50);
    if(e.lit)k.glows.push([350,top+40,300,40]);
    snowOn(k,[[318,128],[682,128]],8)};
  hot(k,'data-shop','sprout',"Pip's Sprout Cart",RC(310,118,380,280),k.cap(cart));
  k.ss(()=>{if(k.so==='winter'&&!e.ny)wreath(k,500,236,.8);else if(k.so==='autumn'){pumpkin(k,320,394,.7);pumpkin(k,684,396,.6)}else if(k.so==='spring')bulbs(k,690,394,3,.6)});
  k.lt(()=>ltString(k,sagP(318,160,682,160,14,16),18));
  k.ny(()=>{nyKado(k,296,396,.75,1);nyKado(k,704,396,.75,-1);nyKites(k,[[600,90,.8,0,560,300]])});
  k.hw(()=>{hwHayJack(k,250,396,.9);hwJack(k,700,396,.75);hwLanternString(k,352,150,648,150,12,4,.7)});
  k.jp(()=>{k.shape(RC(452,148,96,24),'#E9E1D3',{w:1.2,one:1});k.add(`<path d="M476 148v24M500 148v24M524 148v24" stroke="#5E86BE" stroke-width="2"/>`)});
  });
  // the gravel path where the pack waits
  k.fill([[0,384],[1000,384],[1000,600],[0,600]],C.path,{dx:0,dy:0,sc:0});k.fill([[0,384],[1000,384],[1000,600],[0,600]],'#E9D6B0',{dx:0,dy:0,op:.5});
  k.pen([[0,386],[1000,386]],false,{w:1.6,col:'#C9AE77'});pebbles(k,10,990,392,598,120,'#D2BC94');
  tuftsG(k,0,1000,388,420,30);
  pawTrail(k,[[520,560,1],[540,546,1],[556,530,.95],[566,512,.95],[560,490,.9],[548,470,.9]],'#D2BC94');
  doormat(k,500,368,170,'#E2C88E');tubs(k,[[60,356,C.yellow],[948,356,C.red]]);{const so=k.so;[[120,380],[300,376],[880,382]].forEach(([x,y])=>{if(so!=='winter')O.flower(k,x,y,4.6,[C.yellow,C.red,C.lav][Math.round(x)%3])})}
  streetBits(k,{y0:346,snow:[[140,570,70,10],[860,566,64,10],[480,590,80,8]],avoid:[[180,400,300,450],[700,410,820,460],[820,480,940,540]],flies:[[100,330],[900,300],[560,330]]});
  fk.add('crates',420,()=>seedCrates(k,236,420,D(420)));
  fk.add('bowl',390,()=>bowlG(k,660,390,D(390),'#9CCB80'));
  fk.add('sunflower',440,()=>sunflowerPot(k,790,440,D(440)));
  fk.add('bench',520,()=>benchG(k,880,520,D(520)));
  fk.out();
  seasonBits(k,{drift:[[700,200,1],[300,280,.9],[900,250,.85]],robin:[60,300,1],fly:[200,290]});
  O.sparkle(k,560,90,7);O.heart(k,260,150,6);
  O.tape(k,6,26,90,-24,'#C9EBDA');O.tape(k,910,566,80,-28,'#FCE59A')}

/* ======================= the three trailheads (1600 wide) and their walk strips ======================= */
// a sunflower head (petal star + seed disc), by season: summer bloom, autumn bowed and amber, spring a green bud, winter a dry seed head
function sfHead(k,x,y,r,so){if(so==='spring'){k.add(`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(r*.4)}" ry="${R1(r*.55)}" fill="#9CCB80" stroke="${C.ink}" stroke-width="1"/>`);return}
  if(so==='winter'){k.add(`<ellipse cx="${R1(x)}" cy="${R1(y+r*.2)}" rx="${R1(r*.55)}" ry="${R1(r*.45)}" fill="#8A6A4A" stroke="${C.ink}" stroke-width="1"/>`);return}
  const pc=so==='autumn'?'#E8A84E':'#F7D24E';let d='';for(let i=0;i<16;i++){const a=i/16*Math.PI*2,rr=i%2?r*.68:r;d+=(i?'L':'M')+R1(x+Math.cos(a)*rr)+' '+R1(y+Math.sin(a)*rr*(so==='autumn'?.7:1))}
  k.add(`<path d="${d}Z" fill="${pc}" stroke="${C.ink}" stroke-width="1" stroke-linejoin="round"/><ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(r*.45)}" ry="${R1(r*.45*(so==='autumn'?.7:1))}" fill="#8A5A3A" stroke="${C.ink}" stroke-width=".9"/>`)}
// rows of sunflowers along a back line: rows [[groundY, scale]], x0..x1, wrap for strips
function sfRows(k,x0,x1,rows,wrap){const so=k.so;rows.forEach(([gy,s])=>{let st='',lv='';const heads=[];for(let x=x0+k.r()*10*s;x<x1;x+=(20+k.r()*8)*s){const h=(64+k.r()*22)*s*(so==='spring'?.5:1),tx=x+k.J(3*s);
    st+=`M${R1(x)} ${R1(gy)}Q${R1(x+k.J(2))} ${R1(gy-h*.5)} ${R1(tx)} ${R1(gy-h)}`;lv+=`M${R1(x)} ${R1(gy-h*.4)}q${R1(-10*s)} ${R1(-6*s)} ${R1(-14*s)} ${R1(2*s)}q${R1(8*s)} ${R1(4*s)} ${R1(14*s)} ${R1(-2*s)}M${R1(x)} ${R1(gy-h*.6)}q${R1(10*s)} ${R1(-6*s)} ${R1(14*s)} ${R1(2*s)}q${R1(-8*s)} ${R1(4*s)} ${R1(-14*s)} ${R1(-2*s)}`;heads.push([tx,gy-h])}
    const one=()=>{k.add(`<path d="${st}" fill="none" stroke="${so==='winter'?'#9C8A6A':'#6FAE5C'}" stroke-width="${R1(2.6*s)}" stroke-linecap="round"/>`);if(so!=='winter')k.add(`<path d="${lv}" fill="${so==='autumn'?'#B7B26A':'#9CCB80'}" stroke="${C.ink}" stroke-width=".8"/>`);heads.forEach(([hx,hy])=>sfHead(k,hx,hy,10*s,so))};
    if(wrap)k.wrap((x0+x1)/2,(x1-x0)/2+20,one);else one();if(k.so==='winter')k.ss(()=>heads.forEach(([hx,hy],i)=>{if(i%3===0)capLine(k,[[hx-6*s,hy-2*s],[hx+6*s,hy-2*s]],3*s)}))})}
function scarecrow(k,x,gy,s){shade(k,x,gy+2,30*s);k.line([[x,gy],[x+k.J(1),gy-150*s]],R1(6*s),C.trunkD);k.line([[x-58*s,gy-104*s],[x+58*s,gy-100*s]],R1(5*s),C.trunkD);
  const body=[[x-30*s,gy-116*s],[x+30*s,gy-114*s],[x+26*s,gy-50*s],[x-26*s,gy-52*s]];k.shape(body,'#9EB2EC',{w:1.8,hatch:{side:.6,gap:4,col:'#7F94CF',op:.45}});
  [[x-18*s,gy-80*s,'#F4A3A3'],[x+12*s,gy-66*s,'#FCE59A']].forEach(([px,py,c])=>k.shape(RC(px-7*s,py-7*s,14*s,14*s),c,{w:1.1,one:1}));
  [[-1],[1]].forEach(([f])=>{k.shape([[x+f*28*s,gy-112*s],[x+f*60*s,gy-106*s],[x+f*62*s,gy-94*s],[x+f*28*s,gy-96*s]],'#F4A3A3',{w:1.5,one:1});let d='';for(let i=0;i<4;i++)d+=`M${R1(x+f*62*s)} ${R1(gy-104*s+i*3*s)}l${R1(f*8*s)} ${R1(-2*s+i*2*s)}`;k.add(`<path d="${d}" stroke="#D9B45A" stroke-width="1.6" stroke-linecap="round"/>`)});
  k.shape(E(x,gy-132*s,17*s,18*s,14),'#F3E3CF',{w:1.8});k.add(`<path d="M${R1(x-8*s)} ${R1(gy-136*s)}l${R1(5*s)} ${R1(4*s)}M${R1(x-3*s)} ${R1(gy-136*s)}l${R1(-5*s)} ${R1(4*s)}M${R1(x+3*s)} ${R1(gy-136*s)}l${R1(5*s)} ${R1(4*s)}M${R1(x+8*s)} ${R1(gy-136*s)}l${R1(-5*s)} ${R1(4*s)}M${R1(x-7*s)} ${R1(gy-124*s)}q${R1(7*s)} ${R1(6*s)} ${R1(14*s)} 0" fill="none" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>`);
  const hat=[[x-34*s,gy-144*s],[x+34*s,gy-144*s],[x+22*s,gy-150*s],[x+16*s,gy-170*s],[x-16*s,gy-170*s],[x-22*s,gy-150*s]];k.shape(hat,'#F3D58E',{w:1.8,hatch:{side:.6,gap:3.4,col:'#D9B45A',op:.5}});k.shape(RC(x-18*s,gy-156*s,36*s,5*s),C.red,{w:1,one:1});
  k.add(`<path d="M${R1(x-20*s)} ${R1(gy-52*s)}l-3 ${R1(10*s)}M${R1(x-8*s)} ${R1(gy-50*s)}l0 ${R1(10*s)}M${R1(x+8*s)} ${R1(gy-50*s)}l2 ${R1(10*s)}M${R1(x+20*s)} ${R1(gy-52*s)}l4 ${R1(9*s)}" stroke="#D9B45A" stroke-width="2" stroke-linecap="round"/>`);
  if(!k.env.night&&!k.env.rain)O.bird(k,x+52*s,gy-120*s,7*s);
  snowOn(k,hat.slice(0,2).reverse().concat([]),5*s);snowOn(k,[[x-58*s,gy-106*s],[x-28*s,gy-110*s]],3*s);k.hw(()=>{hwJack(k,x+26*s,gy,.8*s);hwBat(k,x-60*s,gy-150*s,.7*s)})}
function hayRound(k,x,gy,s){shade(k,x,gy+2,56*s,9*s);k.shape([[x-50*s,gy],[x-52*s,gy-50*s],[x-40*s,gy-66*s],[x+40*s,gy-66*s],[x+50*s,gy-52*s],[x+48*s,gy]],'#E2C88E',{w:1.8,hatch:{side:.55,gap:3.6,col:'#C4A462',op:.5}});
  k.shape(E(x-46*s,gy-32*s,14*s,32*s,16),'#EAD3A0',{w:1.6,one:1});k.add(`<path d="M${R1(x-46*s)} ${R1(gy-32*s)}m-8 0a8 18 0 1 0 16 0a8 18 0 1 0 -16 0" fill="none" stroke="#C4A462" stroke-width="1.3"/>`);
  let d='';for(let i=0;i<14;i++){const px=x-30*s+k.r()*76*s,py=gy-6*s-k.r()*56*s;d+=`M${R1(px)} ${R1(py)}l${R1(6*s)} ${R1(-2*s)}`}k.add(`<path d="${d}" stroke="#B89A5A" stroke-width="1.2" stroke-linecap="round"/>`);
  snowOn(k,[[x-42*s,gy-64*s],[x+42*s,gy-64*s]],6*s);k.hw(()=>hwJack(k,x+10*s,gy-62*s,.8*s))}
function hayBales(k,x,gy,s){shade(k,x,gy+2,70*s,9*s);hwHay(k,x-34*s,gy,2*s);hwHay(k,x+34*s,gy,2*s);hwHay(k,x,gy-40*s,2*s);snowOn(k,[[x-36*s,gy-80*s],[x+36*s,gy-80*s]],5*s);snowOn(k,[[x-70*s,gy-40*s],[x-36*s,gy-40*s]],4*s)}
function signpost(k,x,gy,s,icon){shade(k,x,gy+2,22*s);k.shape([[x-4*s,gy],[x-3.4*s,gy-120*s],[x+3.4*s,gy-120*s],[x+4*s,gy]],C.woodD,{w:1.5,one:1});
  const a=[[x-6*s,gy-112*s],[x+52*s,gy-112*s],[x+66*s,gy-98*s],[x+52*s,gy-84*s],[x-6*s,gy-84*s]];k.shape(a,C.wood,{w:1.8,hatch:{side:.7,gap:4,col:C.woodD,op:.4}});
  const b=[[x+6*s,gy-76*s],[x-46*s,gy-76*s],[x-60*s,gy-62*s],[x-46*s,gy-48*s],[x+6*s,gy-48*s]];k.shape(b,C.wood,{w:1.8,hatch:{side:.7,gap:4,col:C.woodD,op:.4}});
  icon(x+26*s,gy-98*s,s);k.add(`<g fill="${C.ink}" opacity=".75"><ellipse cx="${R1(x-26*s)}" cy="${R1(gy-60*s)}" rx="${R1(4*s)}" ry="${R1(3.4*s)}"/><circle cx="${R1(x-31*s)}" cy="${R1(gy-66*s)}" r="${R1(1.6*s)}"/><circle cx="${R1(x-26*s)}" cy="${R1(gy-68*s)}" r="${R1(1.6*s)}"/><circle cx="${R1(x-21*s)}" cy="${R1(gy-66*s)}" r="${R1(1.6*s)}"/></g>`);
  snowOn(k,a.slice(0,2),4*s);snowOn(k,[b[1],b[0]],4*s)}
// the dirt track: a ribbon from the arch (narrow, far) to the front (wide), through pts [x, y, halfWidth]
function track(k,pts,col,edge){const L=pts.map(([x,y,w])=>[x-w,y]),Rt=pts.map(([x,y,w])=>[x+w,y]).reverse();k.fill(L.concat(Rt),col,{dx:0,dy:0,sc:0});
  k.line(L,1.4,edge,{amp:.5});k.line(Rt.slice().reverse(),1.4,edge,{amp:.5});let d='';pts.forEach(([x,y,w],i)=>{if(i%2)d+=`M${R1(x-w*.5)} ${R1(y)}q${R1(w*.2)} -2 ${R1(w*.35)} 0`});k.add(`<path d="${d}" fill="none" stroke="${edge}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`)}
function farBarn(k,x,gy,s){k.shape(RC(x-40*s,gy-44*s,80*s,44*s),'#E57E83',{w:1.6,one:1,hatch:{side:.7,gap:4,col:'#C9646B',op:.45}});k.shape([[x-48*s,gy-42*s],[x-30*s,gy-66*s],[x+30*s,gy-66*s],[x+48*s,gy-42*s]],'#9C8F86',{w:1.6,one:1});
  k.add(`<path d="M${R1(x-12*s)} ${R1(gy)}v${R1(-26*s)}h${R1(24*s)}v${R1(26*s)}M${R1(x-12*s)} ${R1(gy-26*s)}l${R1(24*s)} ${R1(26*s)}M${R1(x+12*s)} ${R1(gy-26*s)}l${R1(-24*s)} ${R1(26*s)}" fill="none" stroke="#FFFFFF" stroke-width="${R1(2.4*s)}"/>`);
  k.shape(RC(x+52*s,gy-80*s,24*s,80*s),'#C9CED6',{w:1.6,one:1});k.shape(E(x+64*s,gy-80*s,12*s,8*s,10),'#AEB8C4',{w:1.4,one:1});snowOn(k,[[x-30*s,gy-66*s],[x+30*s,gy-66*s]],4*s);snowOn(k,[[x+52*s,gy-84*s],[x+76*s,gy-84*s]],3*s)}
function runGate(k,x,gy,s,col,disc){hot(k,'data-hot','run','Start the run',RC(x-110*s,gy-250*s,220*s,256*s),k.cap(()=>startArch(k,x,gy,s,col,{disc})))}
function scSunflower(k,F){const e=k.env,W=1600,D=y=>dep(F,y),fk=floorKit(k),so=k.so;
  skyG(k,W,320,{sun:[1260,78,32],low:[1300,240,36],moon:[1280,74,26],clouds:[[280,64,24],[700,92,20],[1480,60,22],[1000,150,16]],rainC:[[160,40,28],[860,30,28],[1380,50,26]],birds:[[520,120,8],[544,130,6]]});
  jpFuji(k,260,290,280);
  k.ny(()=>nyKites(k,[[1000,110,.9,0,960,300],[480,140,.8,1,520,300]]));
  hills(k,W,[[0,288],[260,272],[560,284],[900,262],[1200,280],[1600,268]],350,'#DCEDC4');
  farTrees(k,[[120,282,.9],[640,278,1],[760,272,.8],[1460,272,.9]]);farBarn(k,1080,288,.9);farHouse(k,420,292,.7,C.wall,C.roof);
  // the field and the dirt track coming out of the sunflowers through the arch
  k.fill([[0,318],[W,314],[W,600],[0,600]],C.grass,{dx:0,dy:0,sc:0});
  {let d='';for(let i=0;i<16;i++){const x0=i*110-80;d+=`M${R1(x0)} 600L${R1(800+(x0-800)*.18)} 340`}k.add(`<path d="${d}" stroke="${C.grass2}" stroke-width="22" opacity=".45"/>`)}
  sfRows(k,0,700,[[300,.62],[320,.78],[342,.95]]);sfRows(k,900,W,[[300,.62],[320,.78],[342,.95]]);
  {const fx=[];for(let x=0;x<=W;x+=100){if(x>700&&x<900)continue;fx.push(x)}fx.forEach(x=>{k.shape(RC(x-5,316,10,40),C.wood,{w:1.5,one:1,hatch:{gap:4,col:C.woodD,op:.5}});snowOn(k,[[x-6,316],[x+6,316]],4)});
   [[0,700],[900,W]].forEach(([a,b])=>{[326,340].forEach(y=>{k.shape(RC(a,y,b-a,6),C.wood,{w:1.3,one:1});snowOn(k,[[a,y],[b,y]],3);frostOn(k,[[a,y],[b,y]])})});
   k.lt(()=>{[[0,700],[900,W]].forEach(([a,b])=>{for(let x=a;x<b;x+=100)ltString(k,sagP(x,322,Math.min(b,x+100),322,6,8),20)})})}
  track(k,[[800,352,40],[790,400,60],[760,450,80],[780,500,100],[840,550,120],[880,600,140]],'#E9D6B0','#C9AE77');
  pebbles(k,700,1000,360,598,40,'#D2BC94');pawTrail(k,[[800,570,1],[790,548,1],[784,526,.95],[778,504,.95],[772,484,.9],[770,464,.9]],'#D2BC94');
  tuftsG(k,0,W,350,598,160,(x,y)=>Math.abs(x-800+(y-350)*.1)>(40+(y-350)*.4));
  fl(k,[[40,560,C.yellow],[200,590,C.red],[1500,580,C.lav],[1560,520,C.yellow],[640,380,'#FFB3C7'],[1000,370,C.yellow]],4.6);
  runGate(k,800,354,.9,C.woodD,C.yellow);
  k.fx(()=>fxG(k,W,{sheen:[350,598],puddles:[[820,520,46,9],[300,560,40,8]],patches:[[820,540,90,13],[300,570,70,12],[1300,560,70,12],[560,420,50,8],[1100,410,50,8]],flies:[[200,300],[620,280],[1060,290],[1400,320],[500,500]]}));
  winterSnow(k,[[180,566,80,11],[1420,572,76,11],[560,450,50,7],[1100,460,54,7],[300,400,40,6]]);
  k.ss(()=>seasonGround(k,[30,356,1570,596],140,[[700,350,920,600],[300,380,460,480],[1100,380,1260,440],[1320,480,1500,560]]));
  fk.add('bench',412,()=>benchG(k,360,412,D(412)));
  fk.add('scarecrow',436,()=>scarecrow(k,1180,436,D(436)));
  fk.add('hay',478,()=>hayRound(k,460,478,D(478)));
  fk.add('bales',552,()=>hayBales(k,1410,552,D(552)));
  fk.out();
  seasonBits(k,{drift:[[600,200,1],[980,240,.9],[300,240,.85],[1300,220,.9]],robin:[1000,312,1],fly:[620,330]});
  O.sparkle(k,640,200,7);O.heart(k,1060,170,6);O.note(k,360,230,11);
  O.tape(k,6,26,90,-24,'#FCE59A');O.tape(k,W-90,566,80,-28,'#BDE7D2')}
// one bamboo culm from ground gy up past the top (y1), w wide, with nodes and leaf sprays
function culm(k,x,gy,y1,w,col,colD,leaves){const lean=k.J(6);k.add(`<path d="M${R1(x-w/2)} ${R1(gy)}L${R1(x-w/2+lean)} ${R1(y1)}L${R1(x+w/2+lean)} ${R1(y1)}L${R1(x+w/2)} ${R1(gy)}Z" fill="${col}" stroke="${C.ink}" stroke-width="${R1(Math.max(.9,w*.12))}" stroke-linejoin="round"/>`);
  let d='',lv='';for(let y=gy-20-k.r()*20;y>y1+10;y-=34+k.r()*24){const t=(gy-y)/(gy-y1),lx=x+lean*t;d+=`M${R1(lx-w/2-1)} ${R1(y)}h${R1(w+2)}`;
    if(leaves&&k.r()<.45){const f=k.r()<.5?-1:1;for(let j=0;j<3;j++){const a=f*(.5+j*.35),L=w*3.2+j*4;const ex=lx+f*L*Math.cos(.35+j*.3),ey=y-6+j*6;lv+=`M${R1(lx)} ${R1(y)}Q${R1((lx+ex)/2)} ${R1(Math.min(y,ey)-6)} ${R1(ex)} ${R1(ey)}Q${R1((lx+ex)/2)} ${R1(Math.max(y,ey)+2)} ${R1(lx)} ${R1(y)}Z`}}}
  k.add(`<path d="${d}" stroke="${colD}" stroke-width="${R1(Math.max(1.2,w*.18))}" stroke-linecap="round"/><path d="M${R1(x-w*.15)} ${R1(gy-6)}L${R1(x-w*.15+lean)} ${R1(y1)}" stroke="#FFFFFF" stroke-width="${R1(w*.14)}" opacity=".45"/>`);
  if(lv)k.add(`<path d="${lv}" fill="#8CC07B" stroke="${C.ink}" stroke-width=".8"/>`)}
function bambooWall(k,x0,x1,gy,y1,wmin,wmax,col,colD,gap,leaves,wrap){for(let x=x0;x<x1;x+=gap*(.6+k.r()*.8)){const w=wmin+k.r()*(wmax-wmin),g=gy+k.J(4);const one=()=>culm(k,x,g,y1,w,col,colD,leaves);if(wrap)k.wrap(x,w*4+30,one);else one();
    if(k.env.snow||k.so==='winter'){const th=k.env.snow?4:2.6;(k.env.snow?(f=>k.side(f)):(f=>k.ss(f)))(()=>{for(let y=g-60;y>y1+40;y-=90+k.r()*60){const P=[[x-w/2-2,y],[x+w/2+2,y]];if(wrap)k.wrap(x,w,()=>capLine(k,P,th));else capLine(k,P,th)}})}}}
function canopy(k,W,y,col,colD){const p=[[0,-10],[W,-10],[W,y]];for(let x=W;x>=0;x-=60)p.push([x-30,y+18+k.r()*24],[Math.max(0,x-60),y+k.r()*10]);k.fill(p,col,{dx:0,dy:0,sc:0});k.hatch(p,{side:.4,gap:5,col:colD,op:.45,w:1.2});k.pen(p.slice(2),false,{w:1.8});
  if(k.env.snow||k.so==='winter')(k.env.snow?(f=>k.side(f)):(f=>k.ss(f)))(()=>{for(let x=40;x<W;x+=180+k.r()*60)capLine(k,[[x,y+12],[x+60,y+16]],5)})}
function basin(k,x,gy,s){shade(k,x,gy+2,40*s);k.shape([[x-34*s,gy],[x+34*s,gy],[x+30*s,gy-30*s],[x-30*s,gy-30*s]],'#CBC4BA',{w:1.8,hatch:{side:.6,gap:3.5,col:'#A39B90',op:.5}});
  k.fill(E(x,gy-30*s,26*s,7*s,14),k.so==='winter'?'#DDE6EE':'#9CCDE8',{dx:0,dy:0});k.pen(E(x,gy-30*s,26*s,7*s,14),true,{w:1.2,one:1});
  k.shape([[x+18*s,gy-28*s],[x+22*s,gy-92*s],[x+30*s,gy-92*s],[x+28*s,gy-28*s]],'#9CCB81',{w:1.4,one:1});k.shape([[x+24*s,gy-80*s],[x-6*s,gy-60*s],[x-4*s,gy-54*s],[x+26*s,gy-72*s]],'#9CCB81',{w:1.3,one:1});
  if(k.so!=='winter')k.add(`<path d="M${R1(x-4*s)} ${R1(gy-56*s)}q-2 10 -1 ${R1(22*s)}" stroke="#9CCDE8" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
  k.add(`<ellipse cx="${R1(x-8*s)}" cy="${R1(gy-31*s)}" rx="${R1(5*s)}" ry="${R1(1.6*s)}" fill="#FFFFFF" opacity=".8"/>`);snowOn(k,[[x-34*s,gy-30*s],[x+34*s,gy-30*s]],4*s)}
function stoneLantern(k,x,gy,s){shade(k,x,gy+2,28*s);jpToro(k,x,gy,1.4*s);snowOn(k,[[x-22*s,gy-52*s],[x,gy-62*s],[x+22*s,gy-52*s]],5*s);if(k.env.lit)k.wl.push(`<circle cx="${R1(x)}" cy="${R1(gy-34*s)}" r="${R1(30*s)}" fill="url(#${glowGrad(k,'#FFD877','jpw')})" opacity="${R1(.9*k.env.lit)}"/>`)}
function woodBench(k,x,gy,s){shade(k,x,gy+2,56*s);k.shape([[x-60*s,gy-34*s],[x+60*s,gy-34*s],[x+52*s,gy-44*s],[x-52*s,gy-44*s]],'#C9A07A',{w:1.8,hatch:{side:.7,gap:4,col:C.trunkD,op:.5}});k.shape(RC(x-60*s,gy-34*s,120*s,8*s),'#A97E5A',{w:1.5,one:1});
  [[-48],[48]].forEach(([dx])=>k.shape(RC(x+dx*s-5*s,gy-26*s,10*s,26*s),'#8A6A5A',{w:1.3,one:1}));k.shape(RC(x-40*s,gy-48*s,30*s,4*s),'#F7B9C6',{w:1,one:1});snowOn(k,[[x-52*s,gy-44*s],[x+52*s,gy-44*s]],5*s);frostOn(k,[[x-52*s,gy-44*s],[x+52*s,gy-44*s]])}
function scBamboo(k,F){const e=k.env,W=1600,D=y=>dep(F,y),fk=floorKit(k),so=k.so;
  skyG(k,W,330,{sun:[640,80,28],low:[640,250,34],moon:[640,74,24],clouds:[[300,70,20],[980,60,22],[1300,120,18]],rainC:[[200,40,28],[800,30,28],[1400,50,26]],birds:[[860,110,8],[884,120,6]]});
  jpFuji(k,1180,300,240);
  hills(k,W,[[0,296],[300,280],[640,292],[1000,270],[1300,286],[1600,276]],350,'#D2E4C8');
  // the grove: pale far culms, then deeper green, a leafy canopy over the top
  bambooWall(k,-10,W+10,326,-10,8,12,'#C7DDB7','#A8C49B',26,0);
  bambooWall(k,-10,W+10,342,-10,12,18,'#A9D08F','#7FAF6B',38,1);
  canopy(k,W,46,'#9ACD7D','#7FB86B');
  // the floor: moss, a stepping-stone path from the arch, the stream on the right with its stones
  k.fill([[0,340],[W,340],[W,600],[0,600]],'#C3DDA8',{dx:0,dy:0,sc:0});k.fill(blobP(700,520,600,70,k.r,12,.2),'#B4D98E',{dx:0,dy:0,op:.5});
  {const st=[[760,360,22],[748,384,26],[772,410,30],[748,440,34],[780,474,40],[752,512,46],[790,552,52],[760,594,58]];st.forEach(([x,y,r])=>{k.shape(blobP(x,y,r,r*.36,k.r,9,.2),'#D9D2C7',{w:1.5,one:1,hatch:{side:.6,gap:3.5,col:'#B9B0A4',op:.5}});snowOn(k,[[x-r*.8,y-r*.2],[x+r*.8,y-r*.2]],3)})}
  {const s1=[[1380,340],[1430,380],[1470,430],[1530,480],[1600,520],[1600,600],[1560,600],[1500,520],[1440,468],[1396,420],[1352,370],[1340,340]];k.fill(s1,so==='winter'?'#C5D2DB':C.water,{dx:0,dy:0,sc:0});k.pen(s1.slice(0,6),false,{w:1.6,col:C.graph});k.pen(s1.slice(6),false,{w:1.6,col:C.graph});
   let wv='';for(let i=0;i<14;i++){const t=k.r(),x=1360+t*220,y=350+t*200+k.J(8);wv+=`M${R1(x)} ${R1(y)}q6 -4 12 0`}k.add(`<path d="${wv}" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`);
   [[1378,372],[1404,388],[1430,404],[1460,424],[1488,446]].forEach(([x,y],i)=>{k.shape(blobP(x+30,y,14+i*2,6+i,k.r,8,.2),'#CBC4BA',{w:1.4,one:1});snowOn(k,[[x+18,y-3],[x+42,y-3]],3)});
   k.fx(()=>{if(e.rain)ripples(k,1360,1580,360,560,10)})}
  tuftsG(k,0,1340,350,598,150,(x,y)=>Math.abs(x-765)>60);
  {let d='';for(let i=0;i<30;i++){const x=k.r()*1300,y=360+k.r()*230;d+=`M${R1(x)} ${R1(y)}q4 -6 8 0q4 -6 8 0`}k.add(`<path d="${d}" fill="none" stroke="#7FB86A" stroke-width="1.3" opacity=".7"/>`)}
  runGate(k,760,352,.86,'#9CCB80',C.red);
  k.jp(()=>{jpToro(k,620,350,.9);jpToro(k,900,350,.9)});
  k.fx(()=>fxG(k,W,{sheen:[350,598],avoid:[[1340,340,1600,600]],puddles:[[400,560,40,8],[1000,580,44,9]],patches:[[400,570,80,12],[1000,580,80,12],[200,420,50,8],[1200,430,50,8]],flies:[[300,300],[700,260],[1100,280],[1450,320],[500,480]]}));
  winterSnow(k,[[200,566,80,11],[1180,572,76,11],[480,440,50,7],[1000,450,54,7]]);
  k.ss(()=>{seasonGround(k,[30,356,1330,596],120,[[700,350,830,600],[480,380,640,440],[980,420,1220,480],[180,480,420,540]]);if(so==='autumn')jpMomiji(k,320,330,120,30,16,1)});
  fk.add('lantern',424,()=>stoneLantern(k,560,424,D(424)));
  fk.add('bench',470,()=>woodBench(k,1100,470,D(470)));
  fk.add('basin',530,()=>basin(k,300,530,D(530)));
  fk.add('clump',586,()=>{const s=D(586);shade(k,1260,588,60*s);[[1236,588,15],[1262,592,19],[1284,586,13]].forEach(([x,g,w])=>culm(k,x,g,-10,w,'#9CCB81','#6FA05B',1));snowOn(k,[[1226,520],[1294,520]],3)});
  fk.out();
  k.hw(()=>{hwLanternString(k,300,250,620,250,16,4,.8);hwSkyBats(k,[[900,120,.8],[940,100,.6]])});
  k.lt(()=>{ltString(k,sagP(100,240,700,250,30,24),22);ltString(k,sagP(860,250,1300,240,30,20),22)});
  k.ny(()=>nyChochins(k,560,230,960,230,24,5,1));
  seasonBits(k,{drift:[[400,220,1],[1000,260,.9],[1300,240,.85]],robin:[1120,440,1],fly:[480,330]});
  O.sparkle(k,1000,180,7);O.heart(k,420,200,6);
  O.tape(k,6,26,90,-24,'#C9EBDA');O.tape(k,W-90,566,80,-28,'#F7B9C6')}
// the cliff top: the sea behind, a rope fence well back from the edge, the rock face over the waves on the right
const CL_EDGE=y=>1380+(y-330)*.62;// the cliff edge on the right (x at each y)
function gullFly(k,x,y,s){O.bird(k,x,y,9*s)}
function viewer(k,x,gy,s){shade(k,x,gy+2,22*s);k.shape([[x-4*s,gy],[x-3*s,gy-70*s],[x+3*s,gy-70*s],[x+4*s,gy]],'#9AA7B8',{w:1.5,one:1});k.shape(RC(x-14*s,gy-6*s,28*s,6*s),C.stoneD,{w:1.2,one:1});
  const P=[[x-26*s,gy-92*s],[x+24*s,gy-100*s],[x+28*s,gy-80*s],[x-22*s,gy-72*s]];k.shape(P,'#7FA6D9',{w:1.8,hatch:{side:.6,gap:3.4,col:'#5E86BE',op:.5}});k.shape(E(x+27*s,gy-90*s,6*s,11*s,10),'#4A5874',{w:1.4,one:1});k.shape(E(x-24*s,gy-82*s,4*s,8*s,10),'#4A5874',{w:1.2,one:1});
  snowOn(k,P.slice(0,2),4*s)}
function rockG(k,x,gy,s){shade(k,x,gy+2,50*s);k.shape(blobP(x,gy-20*s,46*s,26*s,k.r,9,.25).map(p=>[p[0],Math.min(p[1],gy)]),C.stone,{w:1.8,hatch:{side:.5,gap:4,col:C.stoneD,op:.6}});
  if(k.so!=='winter'){thrift(k,x-34*s,gy,1.2*s);thrift(k,x+38*s,gy,1.1*s)}snowOn(k,[[x-36*s,gy-34*s],[x,gy-46*s],[x+36*s,gy-34*s]],5*s)}
function scCliffs(k,F){const e=k.env,W=1600,D=y=>dep(F,y),fk=floorKit(k),so=k.so;
  skyG(k,W,310,{sun:[1080,80,32],low:[1100,240,36],moon:[1080,74,26],clouds:[[200,60,24],[620,90,20],[1420,70,22],[880,150,16]],rainC:[[140,40,28],[760,30,28],[1300,50,26]],birds:[[420,120,9],[446,132,7],[1260,150,8]]});
  jpFuji(k,240,262,220);
  // the sea to the horizon with a far headland and a sailboat
  k.add(`<rect y="248" width="${W}" height="352" fill="${C.water}"/><rect y="248" width="${W}" height="18" fill="#A9D3EC" opacity=".7"/>`);k.pen([[0,249],[W/2,248],[W,249]],false,{w:1.6,col:C.graph});
  k.fill([[0,250],[120,236],[260,244],[340,250]],'#C9CFC3',{dx:0,dy:0});
  {let wv='';for(let i=0;i<50;i++){const x=k.r()*W,y=262+k.r()*70;wv+=`M${R1(x)} ${R1(y)}q7 -5 14 0t14 0`}for(let i=0;i<30;i++){const x=1300+k.r()*300,y=340+k.r()*250;wv+=`M${R1(x)} ${R1(y)}q8 -6 16 0t16 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`)}
  k.fx(()=>{if(e.rain)ripples(k,0,W,260,330,30);waterGlints(k,e.night?1080:1100,258,330)});
  {const bx=760,by=286;k.shape([[bx-26,by],[bx+26,by],[bx+20,by+10],[bx-20,by+10]],C.red,{w:1.6});k.line([[bx,by],[bx,by-46]],1.5);k.shape([[bx+2,by-44],[bx+24,by-4],[bx+2,by-4]],'#FFFFFF',{w:1.3,one:1});k.shape([[bx-2,by-36],[bx-20,by-4],[bx-2,by-4]],'#FFD8E0',{w:1.3,one:1})}
  // the cliff top: the grass ends at the back edge (a lip of rock) and at the right edge (the rock face down to the waves)
  const top=[[0,330]];for(let y=330;y<=600;y+=30)top.push([CL_EDGE(y)+k.J(6),y]);top.push([0,600]);
  {const T=[],Ft=[];for(let y=326;y<=620;y+=21){T.push([CL_EDGE(y),y]);Ft.push([CL_EDGE(y)+96+(y-330)*.42,y+78])}k.shape(T.concat(Ft.slice().reverse()),'#C9C0B4',{w:2.2,hatch:{side:.25,gap:4.5,col:'#A39B90',op:.55}});
   let d='';T.forEach(([x,y],i)=>{const f=Ft[i];d+=`M${R1(x+k.J(3))} ${R1(y+4)}Q${R1((x+f[0])/2+k.J(10))} ${R1((y+f[1])/2)} ${R1(f[0]+k.J(4))} ${R1(f[1])}`;if(i%2)d+=`M${R1(x+30)} ${R1(y+26)}l18 4`});k.add(`<path d="${d}" fill="none" stroke="#9C9286" stroke-width="1.6" stroke-linecap="round"/>`);
   Ft.forEach(([x,y],i)=>{if(i%2===0)k.shape(blobP(x-6,y-4,18+i,10+i*.4,k.r,8,.3),'#B9B0A4',{w:1.4,one:1})});let fm='';Ft.forEach(([x,y])=>{fm+=`M${R1(x-14)} ${R1(y+2)}q8 -7 16 0t16 0t16 0`});k.add(`<path d="${fm}" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".95"/>`);if(!e.night&&!e.rain)gull(k,CL_EDGE(470)+120,520,.8,0)}
  {const lip=[[-10,318]];for(let x=0;x<=1400;x+=40)lip.push([x+20,315+k.r()*4],[x+40,318]);lip.push([1400,340],[-10,340]);k.shape(lip,'#C9C0B4',{w:1.8,hatch:{side:.3,gap:4,col:'#A39B90',op:.5}});let d='';for(let x=30;x<1380;x+=46+k.r()*30)d+=`M${R1(x)} ${R1(320+k.r()*3)}l${R1(k.J(4))} 9`;k.add(`<path d="${d}" stroke="#9C9286" stroke-width="1.4" stroke-linecap="round"/>`);let fm='';for(let x=10;x<1380;x+=60+k.r()*50)fm+=`M${R1(x)} 314q6 -4 12 0t12 0`;k.add(`<path d="${fm}" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".9"/>`);snowOn(k,[[0,316],[1380,316]],4)}
  k.shape(top,C.grass,{w:2.2,dx:0,dy:0});k.fill([[0,330],[1350,330],[1350,342],[0,346]],'#B4D98E',{dx:0,dy:0,op:.7});
  {let d='';for(let x=0;x<1370;x+=30)d+=`M${x} 331q8 4 16 0`;k.add(`<path d="${d}" fill="none" stroke="#A39B90" stroke-width="1.4"/>`)}
  // thrift and wildflowers along the verge outside the fence
  for(let x=40;x<1350;x+=70+k.r()*40){if(so!=='winter')thrift(k,x,342+k.r()*6,.9)}for(let y=380;y<600;y+=60){const x=CL_EDGE(y)-40;if(so!=='winter')thrift(k,x,y,1.1)}
  // the rope fence: along the back and down the right, well inside the edge
  {const posts=[];for(let x=20;x<=1220;x+=92)posts.push([x,358,dep(F,358)]);for(let y=358;y<=600;y+=60)posts.push([CL_EDGE(y)-150+(y-358)*.05,y,dep(F,y)]);ropeFence(k,posts,70,{lt:1})}
  // the dirt path from the arch
  track(k,[[560,354,36],[574,400,50],[620,450,70],[600,500,90],[540,550,110],[520,600,130]],'#E9D6B0','#C9AE77');
  pebbles(k,420,700,360,598,40,'#D2BC94');pawTrail(k,[[540,570,1],[556,548,1],[574,526,.95],[590,504,.95],[600,482,.9]],'#D2BC94');
  tuftsG(k,0,1260,360,598,140,(x,y)=>Math.abs(x-580)>(40+(y-350)*.35)&&x<CL_EDGE(y)-160);
  fl(k,[[60,560,C.yellow],[240,590,'#FFB3C7'],[900,560,C.lav],[1060,580,C.yellow],[1000,400,'#FFB3C7'],[120,400,C.red]],4.6);
  runGate(k,560,356,.88,'#FFFFFF','#8FB6E3');
  if(!e.night&&!e.rain){gullFly(k,700,180,1);gullFly(k,1200,120,.8);gull(k,1430,320,.9,1)}
  k.fx(()=>fxG(k,W,{sheen:[350,598],avoid:[[1240,330,1600,600]],puddles:[[600,560,40,8],[200,520,44,9]],patches:[[600,570,80,12],[200,540,70,12],[1000,560,70,12],[900,420,50,8],[300,410,50,8]],flies:[[300,320],[860,300],[1100,320],[500,480]]}));
  winterSnow(k,[[180,566,80,11],[1000,572,76,11],[860,440,50,7],[300,450,54,7]]);
  k.ss(()=>seasonGround(k,[30,360,1200,596],120,[[480,350,700,600],[280,380,440,420],[880,400,1060,450],[700,480,840,540]]));
  fk.add('sign',404,()=>signpost(k,360,404,D(404),(x,y,s)=>{gull(k,x+4*s,y+10*s,.55*s,0)}));
  fk.add('bench',432,()=>benchG(k,980,432,D(432)));
  fk.add('viewer',470,()=>viewer(k,1140,470,D(470)));
  fk.add('rock',530,()=>rockG(k,780,530,D(530)));
  fk.out();
  k.hw(()=>{hwJack(k,180,360,.7);hwJack(k,1040,364,.7);hwSkyBats(k,[[400,100,.8],[440,86,.6],[1300,130,.7]])});
  k.ny(()=>nyKites(k,[[900,110,.9,0,860,330],[300,140,.8,1,340,330]]));
  seasonBits(k,{drift:[[700,200,1],[1000,240,.9],[300,230,.85]],robin:[110,330,1],fly:[880,320]});
  O.sparkle(k,860,200,7);O.heart(k,460,170,6);
  O.tape(k,6,26,90,-24,'#B9D3F2');O.tape(k,W-90,566,80,-28,'#FCE59A')}

const STRIPS_G={};
/* ---- the walk strips (1200 x 400, ground y 330, seamless: everything that crosses an edge is wrapped) ---- */
const SKYW_G={sunflower:{W:1200,H:250,sun:[900,70,28],low:[880,210,30],moon:[900,64,22],clouds:[[220,60,22],[600,90,18],[1080,50,20]],rainC:[[400,40,26],[800,48,26]],birds:[[420,90,8],[444,100,6]],stars:44},
  bamboo:{W:1200,H:240,sun:[600,60,24],low:[600,200,28],moon:[600,56,22],clouds:[[260,50,20],[900,60,20]],rainC:[[400,40,26],[1000,48,26]],birds:[[700,80,7],[722,90,5]],stars:30},
  cliffs:{W:1200,H:220,sun:[760,64,28],low:[760,190,30],moon:[760,58,22],clouds:[[180,50,22],[520,80,18],[1040,46,20]],rainC:[[360,40,26],[860,56,24]],birds:[[300,100,9],[326,112,7],[960,90,8]],stars:40}};
function stripPath(k,col,edge,pb){k.add(`<rect y="330" width="1200" height="70" fill="${col}"/>`);k.edge(x=>330+per(x,[[2,6,.5]]),2.2,edge);
  let tf='';for(let x=14;x<1200;x+=40)tf+=`M${x} 330q1 -7 -1 -11M${x+5} 330q0 -8 3 -13`;k.add(`<path d="${tf}" fill="none" stroke="${C.grassD}" stroke-width="1.5" stroke-linecap="round"/>`);
  let p='';for(let i=0;i<36;i++){const x=(i*37)%1200+4,y=348+(i*23%44);p+=`<ellipse cx="${x}" cy="${y}" rx="${2+(i%3)}" ry="1.6" fill="${pb}"/>`}k.add(p);
  k.fx(()=>{stripFx(k,{y0:338,y1:396,kind:'path',ns:5,np:2,rx:26});if(k.env.night&&!k.env.rain)[[150,270],[460,250],[700,280],[980,262],[1120,290]].forEach(f=>k.flies.push(f))})}
function stripFx(k,o){const e=k.env;
  if(e.rain){sheen(k,0,1200,o.y0,o.y1,o.kind==='grass'?26:36,[],1200);
    if(o.np){for(let i=0;i<o.np;i++){const x=(i+.25+k.r()*.5)*1200/o.np,y=o.y0+16+k.r()*(o.y1-o.y0-26),rx=24+k.r()*16;k.wrap(x,rx+4,()=>puddle(k,x,y,rx,rx*.2))}}}
  if(e.snow){const n=o.ns||6;for(let i=0;i<n;i++){const x=(i+.2+k.r()*.6)*1200/n,y=o.y0+5+k.r()*(o.y1-o.y0-10),rx=(o.rx||34)+k.r()*28;k.wrap(x,rx*1.25,()=>snowPatch(k,x,y,rx,Math.max(4,rx*.17)))}}}
function duckling(k,x,y,s){k.shape(E(x,y-5*s,7*s,5*s,10),'#FCE59A',{w:1.2,one:1});k.shape(E(x+6*s,y-11*s,4*s,4*s,8),'#FCE59A',{w:1.1,one:1});k.add(`<path d="M${R1(x+9*s)} ${R1(y-11*s)}l${R1(4*s)} 1l${R1(-4*s)} 1z" fill="${C.orange}"/><circle cx="${R1(x+7*s)}" cy="${R1(y-12*s)}" r="1" fill="${C.ink}"/>`)}
function mamaDuck(k,x,y,s){k.shape([[x-16*s,y-4*s],[x-20*s,y-14*s],[x-6*s,y-20*s],[x+12*s,y-18*s],[x+16*s,y-6*s],[x+10*s,y]],'#FFFFFF',{w:1.5,one:1});k.shape(E(x+14*s,y-26*s,7*s,7*s,10),'#FFFFFF',{w:1.4,one:1});
  k.add(`<path d="M${R1(x+20*s)} ${R1(y-27*s)}l${R1(8*s)} 2l${R1(-8*s)} 2z" fill="${C.orange}" stroke="${C.ink}" stroke-width=".9"/><circle cx="${R1(x+16*s)}" cy="${R1(y-28*s)}" r="1.3" fill="${C.ink}"/><path d="M${R1(x-2*s)} ${R1(y)}v${R1(5*s)}M${R1(x+6*s)} ${R1(y)}v${R1(5*s)}" stroke="${C.orange}" stroke-width="2"/>`)}
STRIPS_G.sunflower=function(k){const so=k.so;
  k.skyD(()=>k.add(`<rect width="1200" height="250" fill="${C.sky}" fill-opacity=".7"/>`),SKYW_G.sunflower);
  k.jp(()=>{if(PA.JP&&PA.JP.fuji)PA.JP.fuji(k,{cx:300,by:232,w:200})});
  const far=x=>222+per(x,[[8,2,.4],[5,5,1.2]]);const fp=[];for(let x=0;x<=1200;x+=20)fp.push([x,far(x)]);k.add(`<path d="${smooth(fp,false)}L1200 340L0 340Z" fill="#DCEAC9"/>`);k.edge(far,1.3,C.graph);
  k.wrap(760,90,()=>farBarn(k,760,far(760)+14,.8));[[120],[560],[1000]].forEach(([x])=>k.wrap(x,20,()=>mTree(k,x,far(x)+8,.6,C.leaf2)));
  k.add(`<rect y="236" width="1200" height="104" fill="${C.grass}"/>`);k.edge(x=>236+per(x,[[2,3,.2]]),1.4,C.graph);
  sfRows(k,0,1200,[[268,.6],[290,.74]],1);
  // the split-rail fence
  {for(let x=50;x<1200;x+=100)k.wrap(x,10,()=>{k.shape(RC(x-5,286,10,40),C.wood,{w:1.6,one:1,hatch:{gap:4,col:C.woodD,op:.5}});snowOn(k,[[x-6,286],[x+6,286]],4)});
   [[294],[310]].forEach(([y])=>{k.add(`<rect y="${y}" width="1200" height="6" fill="${C.wood}"/>`);k.edge(x=>y+per(x,[[1,4,y]]),1.4);k.edge(x=>y+6+per(x,[[1,4,y]]),1.2)});
   if(k.so==='winter')k.ss(()=>{[[0,600],[600,1200]].forEach(([a,b])=>frostLine(k,[[a,294],[b,294]]))});if(k.env.snow)k.side(()=>{[[0,600],[600,1200]].forEach(([a,b])=>capLine(k,[[a,294],[b,294]],4))})}
  sfRows(k,0,1200,[[316,.86]],1);
  // hay bales, the scarecrow and a family of ducks crossing at the path's edge
  [[220,.7],[980,.66]].forEach(([x,s])=>k.wrap(x,60,()=>hayRound(k,x,328,s)));k.wrap(1110,30,()=>hayBales(k,1110,328,.45));
  k.wrap(560,50,()=>scarecrow(k,560,328,.62));
  k.wrap(820,60,()=>{mamaDuck(k,800,330,1);[[830,.9],[850,.85],[868,.8]].forEach(([x,s])=>duckling(k,x,330,s))});
  k.lt(()=>{for(let x=50;x<1200;x+=100)k.wrap(x+50,58,()=>ltString(k,sagP(x,290,x+100,290,7,8),22))});
  k.ny(()=>{k.wrap(400,24,()=>nyShime(k,400,300,.75));nyKites(k,[[700,70,.8,1,740,280]])});
  stripPath(k,'#E9D6B0','#C9AE77','#D2BC94');
  k.wrap(640,10,()=>O.sparkle(k,640,150,7));
  k.ss(()=>{seasonGround(k,[0,338,1200,396],50,[],1200,1);seasonDrift(k,[[700,190,1],[820,240,.9],[400,200,.85],[1080,220,.8]],1200)});
  k.hw(()=>hwStrip(k,[['jack',340,326,.75],['jack',740,326,.7],['hay',430,326,.9],['ghost',1040,326,.85]],[[420,80,.8],[470,60,.6],[1100,90,.7]]))};
STRIPS_G.bamboo=function(k){const so=k.so;
  k.skyD(()=>k.add(`<rect width="1200" height="240" fill="${C.sky}" fill-opacity=".7"/>`),SKYW_G.bamboo);
  k.jp(()=>{if(PA.JP&&PA.JP.fuji)PA.JP.fuji(k,{cx:640,by:226,w:180})});
  const far=x=>218+per(x,[[8,2,.9],[4,5,.3]]);const fp=[];for(let x=0;x<=1200;x+=20)fp.push([x,far(x)]);k.add(`<path d="${smooth(fp,false)}L1200 340L0 340Z" fill="#D2E4C8"/>`);k.edge(far,1.3,C.graph);
  bambooWall(k,0,1200,300,-10,7,11,'#C7DDB7','#A8C49B',30,0,1);
  bambooWall(k,0,1200,312,-10,11,16,'#A9D08F','#7FAF6B',46,1,1);
  {const p=[[-60,-40],[1260,-40],[1260,40]];for(let x=1260;x>=-60;x-=60)p.push([x-30,58+per(x,[[6,4,.2]])+k.r()*0],[x-60,40+per(x-60,[[4,3,.9]])]);k.add(`<path d="${smooth(p,true)}" fill="#9ACD7D"/>`);k.edge(x=>48+per(x,[[8,10,.3],[4,3,.9]]),1.8)}
  // the stream behind the path with its stepping stones, stone lanterns between the culms
  k.add(`<rect y="300" width="1200" height="30" fill="${so==='winter'?'#C5D2DB':C.water}"/>`);k.edge(x=>300+per(x,[[2,5,.4]]),1.6,C.graph);
  {let wv='';for(let i=0;i<24;i++){const x=(i*53)%1200+10,y=308+(i*7%16);wv+=`M${x} ${y}q6 -4 12 0`}k.add(`<path d="${wv}" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".85"/>`)}
  [[140],[180],[220],[760],[800]].forEach(([x],i)=>k.wrap(x,20,()=>{k.shape(blobP(x,316+(i%2)*4,16,6,k.r,8,.2),'#CBC4BA',{w:1.4,one:1});snowOn(k,[[x-12,312+(i%2)*4],[x+12,312+(i%2)*4]],3)}));
  k.fx(()=>{if(k.env.rain)k.wrap(600,600,()=>ripples(k,0,1200,304,326,14))});
  [[460],[1060]].forEach(([x])=>k.wrap(x,30,()=>{jpToro(k,x,300,1);snowOn(k,[[x-16,286],[x,280],[x+16,286]],4);if(k.env.lit)wlPush(k,x,`<circle cx="${x}" cy="${282}" r="26" fill="url(#${glowGrad(k,'#FFD877','jpw')})" opacity="${R1(.9*k.env.lit)}"/>`)}));
  k.wrap(1000,40,()=>woodBench(k,1000,330,.6));k.wrap(320,30,()=>basin(k,320,330,.55));
  k.lt(()=>{for(let x=0;x<1200;x+=150)k.wrap(x+75,80,()=>ltString(k,sagP(x,250,x+150,250,12,10),22))});
  k.ny(()=>{k.wrap(600,220,()=>nyChochins(k,400,240,800,240,18,4,.9))});
  k.add(`<rect y="330" width="1200" height="70" fill="#D9D2C7"/>`);k.edge(x=>330+per(x,[[2,6,.5]]),2.2,'#A39B90');
  {let d='';for(let x=0;x<1200;x+=60)d+=`M${x+((x/60)%2)*12} 332v66`;d+='M0 364h1200';k.add(`<path d="${d}" stroke="#B9B0A4" stroke-width="1.4"/>`);
   let m='';for(let i=0;i<30;i++){const x=(i*41)%1200+6,y=336+(i*19%56);m+=`M${x} ${y}q3 -4 6 0`}k.add(`<path d="${m}" fill="none" stroke="#9CCB80" stroke-width="1.6" stroke-linecap="round"/>`)}
  k.fx(()=>{stripFx(k,{y0:338,y1:396,kind:'path',ns:5,np:2,rx:26});if(k.env.night&&!k.env.rain)[[150,270],[460,250],[700,280],[980,262],[1120,290]].forEach(f=>k.flies.push(f))});
  k.ss(()=>{seasonGround(k,[0,338,1200,396],50,[],1200,1);seasonDrift(k,[[700,190,1],[820,240,.9],[400,200,.85],[1080,220,.8]],1200)});
  k.hw(()=>hwStrip(k,[['jack',260,330,.75],['jack',880,330,.7],['ghost',620,300,.85]],[[420,80,.8],[470,60,.6],[1100,90,.7]]))};
STRIPS_G.cliffs=function(k){const so=k.so;
  k.skyD(()=>k.add(`<rect width="1200" height="220" fill="${C.sky}" fill-opacity=".7"/>`),SKYW_G.cliffs);
  k.jp(()=>{if(PA.JP&&PA.JP.fuji)PA.JP.fuji(k,{cx:220,by:214,w:170})});
  k.add(`<rect y="212" width="1200" height="100" fill="${C.water}"/><rect y="212" width="1200" height="14" fill="#A9D3EC" opacity=".7"/>`);k.edge(x=>213+per(x,[[.6,3,.2]]),1.4,C.graph);
  {let wv='';for(let i=0;i<40;i++){const x=(i*61)%1200+8,y=232+(i*13%50);wv+=`M${x} ${y}q7 -5 14 0t14 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`)}
  k.fx(()=>{if(k.env.rain)k.wrap(600,600,()=>ripples(k,0,1200,226,290,20));waterGlints(k,760,220,290)});
  k.wrap(560,40,()=>{const bx=560,by=248;k.shape([[bx-22,by],[bx+22,by],[bx+17,by+8],[bx-17,by+8]],C.red,{w:1.5});k.line([[bx,by],[bx,by-38]],1.4);k.shape([[bx+2,by-36],[bx+20,by-4],[bx+2,by-4]],'#FFFFFF',{w:1.2,one:1})});
  // the cliff lip, the grass verge with thrift, the rope fence between the path and the edge
  k.add(`<rect y="286" width="1200" height="54" fill="${C.grass}"/>`);k.edge(x=>286+per(x,[[3,4,.2],[2,9,.8]]),2,C.ink);
  {let d='';for(let x=0;x<1200;x+=30)d+=`M${x} 288q8 4 16 0`;k.add(`<path d="${d}" fill="none" stroke="#A39B90" stroke-width="1.4"/>`)}
  if(so!=='winter')[[60],[210],[380],[520],[690],[860],[1010],[1140]].forEach(([x])=>k.wrap(x,12,()=>thrift(k,x,300,1)));
  {const ps=[];for(let x=40;x<1200;x+=100)ps.push(x);ps.forEach(x=>k.wrap(x,10,()=>{k.shape([[x-4.5,328],[x-4,280],[x+4,280],[x+4.5,328]],C.woodD,{w:1.5,one:1});k.add(`<ellipse cx="${x}" cy="280" rx="5" ry="2.6" fill="${lite(C.woodD)}" stroke="${C.ink}" stroke-width="1.1"/>`);snowOn(k,[[x-6,280],[x+6,280]],4)}));
   ps.forEach(x=>k.wrap(x+50,56,()=>{[286,304].forEach(y=>{const P=sagP(x,y,x+100,y,7,10);k.line(P,3.2,C.ink,{amp:.3});k.line(P,1.7,'#EAD2A0',{amp:.2})})}))}
  [[300,.9],[880,.8]].forEach(([x,s])=>k.wrap(x,16,()=>{if(!k.env.night&&!k.env.rain)gull(k,x,326,s,x>600?1:0)}));
  [[160,1],[700,.8],[1050,1]].forEach(([x,s])=>{if(!k.env.night&&!k.env.rain)k.wrap(x,12,()=>O.bird(k,x,120+s*20,9*s))});
  k.lt(()=>{for(let x=40;x<1200;x+=100)k.wrap(x+50,58,()=>ltString(k,sagP(x,276,x+100,276,7,8),22))});
  k.ny(()=>{nyKites(k,[[700,70,.8,1,740,280]])});
  stripPath(k,'#E9D6B0','#C9AE77','#D2BC94');
  [[120,C.yellow],[420,'#FFB3C7'],[760,C.lav],[1080,C.yellow]].forEach(([x,c])=>k.wrap(x,10,()=>O.flower(k,x,326,4.4,c)));
  k.ss(()=>{seasonGround(k,[0,338,1200,396],50,[],1200,1);seasonDrift(k,[[700,190,1],[820,240,.9],[400,200,.85],[1080,220,.8]],1200)});
  k.hw(()=>hwStrip(k,[['jack',340,328,.75],['jack',740,328,.7],['ghost',1040,328,.85]],[[420,80,.8],[470,60,.6],[1100,90,.7]]))};

/* ======================= the floors (PawArt.FLOOR, V215.md section 8.2) ======================= */
// poly: the walkable floor (feet), closed (the last point joins the first). props: the floor props (box [x, y, w, h] = the feet no-go box,
// null = a dog may stand on it). spots: where the roaming acts happen (path = the line the dog follows through an obstacle)
const FLOOR_G={
 training:{poly:[[24,340],[1576,340],[1594,592],[6,592]],
  props:[{id:'weave',base:388,box:[404,376,262,18]},{id:'table',base:452,box:[190,436,96,18]},{id:'tyre',base:448,box:[1226,418,48,60]},{id:'tunnel',base:514,box:[690,480,218,38]},
   {id:'jump',base:514,box:[996,466,64,92]},{id:'stage',base:548,box:null},{id:'bowl',base:552,box:[1380,540,48,16]},{id:'tree',base:478,box:[1486,468,30,16]}],
  spots:[{id:'weave',x:392,y:392,tags:['agility'],act:'weave',path:[[392,392],[451,402],[497,376],[543,402],[589,376],[635,402],[681,376],[700,392]]},
   {id:'table',x:238,y:446,tags:['agility'],act:'table'},{id:'tunnel',x:672,y:500,tags:['agility'],act:'tunnel',path:[[672,500],[694,500],[904,500],[928,500]]},
   {id:'jump',x:930,y:512,tags:['agility'],act:'jump',path:[[930,512],[1022,512],[1112,508]]},{id:'tyre',x:1150,y:448,tags:['agility'],act:'tyre',path:[[1150,448],[1250,446],[1350,444]]},
   {id:'stage',x:588,y:572,tags:['trick'],act:'trick'},{id:'bowl',x:1440,y:556,tags:['bowl'],act:'drink'},{id:'shade',x:1536,y:512,tags:['shade','rest'],act:'rest'}]},
 pool:{poly:[[24,356],[1576,356],[1594,592],[6,592]],
  props:[{id:'vest',base:394,box:[244,384,40,14]},{id:'chair',base:398,box:[1152,386,72,16]},{id:'pool',base:392,box:[316,386,794,160]},{id:'ramp',base:508,box:null},
   {id:'sprinkler',base:524,box:[1392,516,24,12]},{id:'parasol',base:462,box:[1496,452,24,12]},{id:'lounger',base:566,box:[110,542,142,26]}],
  spots:[{id:'paddle',x:322,y:470,tags:['water','paddle'],act:'paddle',path:[[322,470],[372,464],[420,462]]},{id:'ramp',x:1150,y:518,tags:['water','ramp'],act:'ramp',path:[[1150,518],[1122,504],[1072,476],[1010,456]]},
   {id:'sprinkler',x:1404,y:550,tags:['sprinkler'],act:'sprinkler'},{id:'shade',x:1530,y:486,tags:['shade','rest'],act:'rest'},{id:'water',x:760,y:470,tags:['water'],act:'swim'},{id:'vest',x:292,y:406,tags:['vest'],act:'look'}]},
 boutique:{poly:[[22,348],[978,348],[996,594],[4,594]],
  props:[{id:'bench',base:452,box:[96,438,108,18]},{id:'bowl',base:388,box:[670,378,40,12]},{id:'topiary',base:440,box:[858,428,44,14]},{id:'planter',base:540,box:[304,528,52,16]}],
  spots:[{id:'door',x:581,y:366,tags:['door','shop'],act:'door'},{id:'bowl',x:724,y:394,tags:['bowl'],act:'drink'},{id:'bench',x:150,y:470,tags:['bench','rest'],act:'sit'}]},
 builder:{poly:[[22,348],[978,348],[996,594],[4,594]],
  props:[{id:'bench',base:420,box:[64,408,112,14]},{id:'bowl',base:388,box:[630,378,40,12]},{id:'doghouse',base:470,box:[712,452,164,20]},{id:'sawhorse',base:530,box:[180,518,140,14]}],
  spots:[{id:'door',x:500,y:366,tags:['door','shop'],act:'door'},{id:'bowl',x:684,y:394,tags:['bowl'],act:'drink'},{id:'bench',x:120,y:438,tags:['bench','rest'],act:'sit'},{id:'doghouse',x:700,y:490,tags:['sniff'],act:'sniff'}]},
 sprout:{poly:[[22,348],[978,348],[996,594],[4,594]],
  props:[{id:'crates',base:420,box:[196,408,104,14]},{id:'bowl',base:390,box:[640,380,40,12]},{id:'sunflower',base:440,box:[766,430,48,12]},{id:'bench',base:520,box:[826,506,108,18]}],
  spots:[{id:'door',x:500,y:374,tags:['door','shop'],act:'door'},{id:'bowl',x:694,y:396,tags:['bowl'],act:'drink'},{id:'bench',x:880,y:536,tags:['bench','rest'],act:'sit'},{id:'sunflower',x:752,y:458,tags:['sniff'],act:'sniff'}]},
 sunflower:{poly:[[24,358],[1576,358],[1594,592],[6,592]],
  props:[{id:'bench',base:412,box:[306,398,108,16]},{id:'scarecrow',base:436,box:[1166,426,28,14]},{id:'hay',base:478,box:[400,462,120,18]},{id:'bales',base:552,box:[1330,534,160,20]}],
  spots:[{id:'arch',x:800,y:374,tags:['arch','run'],act:'arch'},{id:'rest',x:540,y:500,tags:['rest','hay'],act:'rest'},{id:'sniff',x:1140,y:458,tags:['sniff'],act:'sniff'},{id:'bench',x:360,y:428,tags:['bench','rest'],act:'sit'}]},
 bamboo:{poly:[[24,356],[1330,356],[1380,420],[1480,520],[1540,592],[6,592]],
  props:[{id:'lantern',base:424,box:[540,414,40,14]},{id:'bench',base:470,box:[1040,456,120,18]},{id:'basin',base:530,box:[262,518,76,16]},{id:'clump',base:586,box:[1222,574,76,16]}],
  spots:[{id:'arch',x:760,y:372,tags:['arch','run'],act:'arch'},{id:'rest',x:1100,y:488,tags:['bench','rest'],act:'sit'},{id:'sniff',x:604,y:438,tags:['sniff'],act:'sniff'},{id:'drink',x:358,y:542,tags:['bowl'],act:'drink'}]},
 cliffs:{poly:[[24,362],[1222,362],[1384,592],[6,592]],
  props:[{id:'sign',base:404,box:[350,396,24,12]},{id:'bench',base:432,box:[924,418,112,16]},{id:'viewer',base:470,box:[1124,462,32,12]},{id:'rock',base:530,box:[732,516,96,18]}],
  spots:[{id:'arch',x:560,y:374,tags:['arch','run'],act:'arch'},{id:'rest',x:980,y:448,tags:['bench','rest'],act:'sit'},{id:'sniff',x:700,y:542,tags:['sniff'],act:'sniff'},{id:'view',x:1096,y:488,tags:['view'],act:'look'}]}
};

/* ======================= the scene API ======================= */
const MINE_G={training:['Training Ground',scTraining],pool:['Splash Pool',scPool],boutique:['Bow-Wow Boutique',scBoutique],builder:['Barkitecture',scBuilder],sprout:["Pip's Sprout Cart",scSprout],sunflower:['Sunflower Lanes',scSunflower],bamboo:['Bamboo Grove Trail',scBamboo],cliffs:['Seaside Cliffs Run',scCliffs]};
const wnAttrsG=e=>(e.lt?' data-lights="1"':'')+(e.ny?' data-newyear="1"':'')+(e.jp?' data-jp="1"':'');
function frameG(name,label,body,env){const F=FL[name],W=F.w;
  const k=kit(hashS('mg-'+name));lighten(k);k.env=env;k.so=env.ssn;k.xl=[];k.rc=recolorFn(env,'out');const pp=paperDefs(k,W,600);
  body(k,F);
  const ex=(env.def?'':` data-time="${env.time}" data-weather="${env.weather}"${env.ssn?` data-season="${env.ssn}"`:''}`)+(env.hw?' data-halloween="1"':'')+wnAttrsG(env)+` data-w="${W}" data-back="${F.back}"`;
  return assemble(k,pp,W,`<svg class="pa-wc-scene pa-wg-scene pa-wg-${name}" viewBox="0 0 ${W} 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}${env.def?'':`, ${env.time}, ${env.weather}${env.ssn?', '+env.ssn:''}`}"${ex}>`,false)}
function stripG(area,draw,env){
  const k=kit(hashS('mg-strip-'+area));k.env=env;k.so=env.ssn;k.xl=[];k.rc=recolorFn(env,'strip');lighten(k);const pp=paperDefs(k,1200,400);
  k.wrap=(x,hw,fn)=>{const s=k.cap(fn);k.add(s);if(x-hw<0)k.add(`<g transform="translate(1200 0)">${s}</g>`);if(x+hw>1200)k.add(`<g transform="translate(-1200 0)">${s}</g>`)};
  k.edge=(yf,w,col)=>{[[-40,430],[380,830],[780,1240]].forEach(([a,b])=>k.wrap((a+b)/2,(b-a)/2,()=>{const pts=[];for(let x=a;x<=b;x+=20)pts.push([x,yf(x)]);k.pen(pts,false,{w,col,amp:.6})}))};
  draw(k);
  const ex=(env.def?'':` data-time="${env.time}" data-weather="${env.weather}"${env.ssn?` data-season="${env.ssn}"`:''}`)+(env.hw?' data-halloween="1"':'')+wnAttrsG(env);
  return assemble(k,pp,1200,`<svg class="pa-wc-strip pa-wg-strip pa-wg-strip-${area}" viewBox="0 0 1200 400" role="img" aria-label="${area} walking strip${env.def?'':`, ${env.time}, ${env.weather}${env.ssn?', '+env.ssn:''}`}"${ex}>`,true)}
const cacheG={};
const freshG=s=>{const suf='x'+(++_n);return s.replace(/mg-(\d+)/g,m=>m+suf)};
const envOf=o=>{o=o||{};if(o.snow===true&&!WEATHERS.includes(o.weather))o=Object.assign({},o,{weather:'snow'});return mkEnv(o)};// o.snow: the Snow Days flag reads as snowy weather
function renderG(name,o){const env=envOf(o),key=name+'|'+env.time+'|'+env.weather+'|'+env.season+(env.hw?'|hw':'')+wnKey(env);if(cacheG[key])return freshG(cacheG[key]);
  const s=frameG(name,MINE_G[name][0],(k,F)=>MINE_G[name][1](k,F,o||{}),env);cacheG[key]=s;return s}
function renderStripG(area,o){const env=envOf(o),key='strip|'+area+'|'+env.time+'|'+env.weather+'|'+env.season+(env.hw?'|hw':'')+wnKey(env);if(cacheG[key])return freshG(cacheG[key]);
  const s=stripG(area,k=>STRIPS_G[area](k),env);cacheG[key]=s;return s}
// the v2.14 aria layer (as world E's last layer): { aria } relabels the root svg, { ariaMap } any other English aria-label
const ea=t=>String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function overG(svg,o){if(!o||typeof o!=='object'||typeof svg!=='string')return svg;
  if(typeof o.aria==='string'&&o.aria)svg=svg.replace(/^(\s*<svg\b[^>]*?\baria-label=")[^"]*(")/,(m,x,y)=>x+ea(o.aria)+y);
  const M=o.ariaMap;if(M&&typeof M==='object')svg=svg.replace(/(\baria-label=")([^"]*)(")/g,(m,x,v,y)=>Object.prototype.hasOwnProperty.call(M,v)&&typeof M[v]==='string'&&M[v]?x+ea(M[v])+y:m);
  return svg}
PA.FLOOR=PA.FLOOR||{};
Object.keys(FLOOR_G).forEach(n=>{const F=FL[n],R=FLOOR_G[n];PA.FLOOR[n]={w:F.w,back:F.back,front:F.front,kB:F.kB,kF:F.kF,poly:R.poly.map(p=>p.slice()),
  props:R.props.map(p=>({id:p.id,base:p.base,box:p.box?p.box.slice():null})),spots:R.spots.map(s=>Object.assign({},s,{tags:s.tags.slice()},s.path?{path:s.path.map(p=>p.slice())}:{}))}});
const prevScene=PA.scene,prevStrip=PA.walkStrip;
PA.scene=function(name,o){return MINE_G[name]?overG(renderG(name,o),o):(prevScene?prevScene.apply(this,arguments):'')};
PA.walkStrip=function(area,o){return STRIPS_G[area]?overG(renderStripG(area,o),o):(prevStrip?prevStrip.apply(this,arguments):'')};
PA.WORLD_G_SCENES=Object.keys(MINE_G);PA.WORLD_G_STRIPS=Object.keys(STRIPS_G);
// the scene's own time, weather and season treatment for markup the game draws over a world G scene (the Training Ground's rosette board):
// tintG(svgMarkup, { time, weather, season, snow }) recolours its hex colours as the outdoor scene's are (day, sunny, summer: unchanged)
PA.tintG=function(str,o){const f=typeof str==='string'?recolorFn(envOf(o),'out'):null;return f?str.replace(HEXRE,f):str};
})();
