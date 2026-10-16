/* Doodle Doggo world art, module C (v1.6 "bigger town"): 7 hangout scenes + 3 walk strips, style G "Doodle sketch".
   Wraps PawArt.scene (square | cafe | dogpark | vet | salon | hilltop | pier) and PawArt.walkStrip (town | hilltop | pier);
   every other name is handed to the previous function. Loads AFTER world A and world B.
   v2.7: the Shelter Playroom scene (playroom, indoor, layout = SR_ROOM in game/src/30_shelter.js) and two props through PawArt.prop:
   adoptboard {n 0..8, more} (0 0 300 220, portrait boxes = SR_SLOTS, so ADOPT_SLOTS is not published) and tosstoy {kind ball|bone|ring} (0 0 60 60).
   The pencil kit, paper, palette, sky and time/weather helpers are copied from world A so both look like one sketchbook. No filters. */
window.PawArt = window.PawArt || {};
(function(){
'use strict';
/* ===== helpers copied from world A (pawart_world_a.js), ids prefixed pwc ===== */
const PA=window.PawArt;
const C={ink:'#5B3D32',graph:'#A8968A',paper:'#FFFBF3',dot:'#E3D2BA',pink:'#F28FA5',
  sky:'#D3E9F6',sky2:'#E6F2F8',cloud:'#FFFFFF',sun:'#FDE49A',grass:'#CBE5A6',grass2:'#B4D98E',grassD:'#93C276',
  leaf:'#B9DD92',leaf2:'#9ACD7C',leafD:'#7FB86A',pine:'#8CC09A',pineD:'#6FA483',trunk:'#C9A07A',trunkD:'#A97E5A',
  wood:'#EBCDA4',woodD:'#CFA77C',roof:'#EBA48C',roofD:'#D88870',wall:'#FCE6CC',wall2:'#F9D9DE',wall3:'#D9E9F7',wall4:'#DDEFD8',
  stone:'#DED6CC',stoneD:'#C7BCAE',path:'#EFDDBA',soil:'#D9B48E',water:'#BEE0F2',waterD:'#9CCDE8',sand:'#F7E4B5',sandD:'#EBCF95',
  red:'#F4A3A3',redD:'#E57E83',yellow:'#FCE59A',orange:'#F8C08A',lav:'#DCCBF2',mint:'#C9EBDA',blue:'#B9D3F2',white:'#FFFFFF',glass:'#E4F2FA'};
let _n=0;const uid=()=>'pwc'+(++_n);
let _un=0;const unlitId=()=>'pwc0'+(++_un);// v2.6.1: its own counter, so the other scenes' ids do not shift (pwc0N never meets uid()'s pwcN: no leading zero there)
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
    // render without the flag stays byte-identical. k.wl: their glows, drawn over the treated art at dusk and night. k.own: a stream of its own (Fuji View Hill)
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
    // coloured-pencil fill that drifts off the outline
    fill(pts,col,o={}){
      const P=dense(pts,true,o.step||14),n=P.length;let cx=0,cy=0;P.forEach(q=>{cx+=q[0]/n;cy+=q[1]/n});
      const dx=o.dx??1+r()*1.6,dy=o.dy??.5+r()*1.4,sc=1+(o.sc??(r()-.4)*.03),amp=o.amp??1.3;let vx=0,vy=0;
      const W=P.map(q=>{vx=vx*.7+J(amp*.6);vy=vy*.7+J(amp*.6);return[cx+(q[0]-cx)*sc+dx+vx,cy+(q[1]-cy)*sc+dy+vy]});
      const d=smooth(W,true);out.push(`<path d="${d}" fill="${col}"${o.op!=null?` fill-opacity="${o.op}"`:''}/>`);return d;
    },
    shape(pts,col,o={}){let d=null;if(col)d=k.fill(pts,col,o);if(o.hatch)k.hatch(pts,o.hatch);if(!o.noline)k.pen(pts,true,{w:o.w,wk:o.wk,amp:o.pamp,col:o.lcol,one:o.one,op:o.lop});return d},
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
    const ap=(o,f)=>{if(!o)return;if(o.gr&&c[1]>c[0]+6&&c[1]>=c[2])c=c.map((v,i)=>v+(h2c('#EEF3EA')[i]-v)*o.gr*sc);
      if(o.ds){const L=.3*c[0]+.59*c[1]+.11*c[2];c=c.map(v=>v+(L-v)*o.ds*f*sc)}const t=h2c(o.m);c=c.map((v,i)=>v+(t[i]-v)*o.a*f*sc)};
    if(St){const mp=St.map&&St.map[u];if(mp)c=h2c(mp);else if(isLeafy(c))c=c.map((v,i)=>v+(h2c(St.g)[i]-v)*St.ga);if(St.ds){const L=.3*c[0]+.59*c[1]+.11*c[2];c=c.map(v=>v+(L-v)*St.ds)}if(St.m){const t=h2c(St.m);c=c.map((v,i)=>v+(t[i]-v)*St.a)}}
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
/* ---------- walk strips: seamless, light (no filter, no clips per object beyond hatching) ---------- */
function strip(area,draw,env){
  const k=kit(hashS('pwc-strip-'+area));k.env=env||DEF_ENV;k.so=k.env.ssn;k.rc=recolorFn(k.env,'strip');const pp=paperDefs(k,1200,400);
  // wrap(x, halfWidth, fn): draw once, and again shifted by 1200 if it crosses an edge
  k.wrap=(x,hw,fn)=>{const s=k.cap(fn);k.add(s);if(x-hw<0)k.add(`<g transform="translate(1200 0)">${s}</g>`);if(x+hw>1200)k.add(`<g transform="translate(-1200 0)">${s}</g>`)};
  // a long edge drawn as overlapping wrapped segments so it matches at x=0 and x=1200
  k.edge=(yf,w,col)=>{[[-40,430],[380,830],[780,1240]].forEach(([a,b])=>k.wrap((a+b)/2,(b-a)/2,()=>{const pts=[];for(let x=a;x<=b;x+=20)pts.push([x,yf(x)]);k.pen(pts,false,{w,col,amp:.6})}))};
  draw(k);
  const ex=(k.env.def?'':` data-time="${k.env.time}" data-weather="${k.env.weather}"${k.env.ssn?` data-season="${k.env.ssn}"`:''}`)+(k.env.hw?' data-halloween="1"':'')+wnAttrs(k.env);
  return assemble(k,pp,1200,`<svg class="pa-wc-strip pa-wc-strip-${area}" viewBox="0 0 1200 400" role="img" aria-label="${area} walking strip${k.env.def?'':`, ${k.env.time}, ${k.env.weather}${k.env.ssn?', '+k.env.ssn:''}`}"${ex}>`,true);
}
// ground treatment for strips (always wrapped so the seam stays clean)
function stripFx(k,o){const e=k.env;
  if(e.rain){sheen(k,0,1200,o.y0,o.y1,o.kind==='grass'?26:36,[],1200);
    if(o.np){for(let i=0;i<o.np;i++){const x=(i+.25+k.r()*.5)*1200/o.np,y=o.y0+16+k.r()*(o.y1-o.y0-26),rx=24+k.r()*16;k.wrap(x,rx+4,()=>puddle(k,x,y,rx,rx*.2))}}}
  if(e.snow){const n=o.ns||6;for(let i=0;i<n;i++){const x=(i+.2+k.r()*.6)*1200/n,y=o.y0+5+k.r()*(o.y1-o.y0-10),rx=(o.rx||34)+k.r()*28;k.wrap(x,rx*1.25,()=>snowPatch(k,x,y,rx,Math.max(4,rx*.17)))}}}
function waterGlints(k,x,y0,y1){const e=k.env;if(e.rain)return;
  if(e.night)k.glints.push([x,y0,y1,'#FFF2B8',e.sunny?1:.45]);else if(e.low)k.glints.push([x,y0,y1,e.time==='dawn'?'#FFE7C0':'#FFD49A',e.sunny?.9:.4])}
const per=(x,amps)=>amps.reduce((s,[a,n,ph])=>s+a*Math.sin(x/1200*Math.PI*2*n+ph),0);// periodic over 1200
const HZ=[[290,428,570,526],[212,488,292,548],[616,326,864,524]];
const inHZ=(x,y,pad=0)=>HZ.some(z=>x>z[0]-pad&&x<z[2]+pad&&y>z[1]-pad&&y<z[3]+pad);
function tufts(k,y0,y1,n,col=C.grassD){let d='';for(let i=0;i<n;i++){const x=k.r()*1000,y=y0+k.r()*(y1-y0);if(inHZ(x,y))continue;d+=`M${R1(x)} ${R1(y)}q1 -6 -1 -10M${R1(x+5)} ${R1(y)}q0 -7 3 -12`}k.add(`<path d="${d}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round"/>`)}
function hubFx(k,o){const e=k.env;// o:{puddles,patches,sheen:[y0,y1],flies}
  if(e.rain){if(o.sheen)sheen(k,0,1000,o.sheen[0],o.sheen[1],60,HZ);(o.puddles||[]).forEach(q=>puddle(k,...q))}
  if(e.snow)(o.patches||[]).forEach(q=>snowPatch(k,...q));
  if(e.night&&!e.rain&&o.flies)o.flies.forEach(f=>k.flies.push(f))}
function duck(k,x,y,s,col){k.add(`<ellipse cx="${x}" cy="${R1(y+3*s)}" rx="${R1(22*s)}" ry="${R1(4*s)}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>`);
  k.shape([[x-16*s,y-2*s],[x-21*s,y-11*s],[x-10*s,y-8*s],[x+4*s,y-10*s],[x+14*s,y-6*s],[x+14*s,y+2*s],[x-10*s,y+3*s]],col,{w:1.8});
  k.shape(E(x+12*s,y-16*s,7*s,7*s,10),col,{w:1.7});
  k.add(`<path d="M${R1(x+18*s)} ${R1(y-17*s)}l${R1(8*s)} ${R1(2*s)} ${R1(-8*s)} ${R1(3*s)}z" fill="${C.orange}" stroke="${C.ink}" stroke-width="1.1" stroke-linejoin="round"/><circle cx="${R1(x+14*s)}" cy="${R1(y-18*s)}" r="${R1(1.3*s+.4)}" fill="${C.ink}"/>`);
  k.line([[x-8*s,y-5*s],[x+2*s,y-3*s],[x+7*s,y-7*s]],1.3)}
function signpost(k,x,gy,txt,w=120,sc=1){k.line([[x,gy],[x+k.J(1),gy-96*sc]],4,C.ink);const b=RC(x-w/2,gy-112*sc,w,38*sc);k.shape(b,C.wood,{w:2,hatch:{side:.8,gap:4,col:C.woodD,op:.4}});k.text(txt,x,gy-85*sc,24*sc,{rot:-2});// sc: a bigger sign (the Mt. Fuji Lookout); sc 1 draws byte for byte as before
  if(k.env.snow)k.side(()=>capLine(k,[[x-w/2-2,gy-112*sc],[x+w/2+2,gy-112*sc]],6))}
function tagLabel(k,x,y,txt,rot=-8){return k.cap(()=>{const w=txt.length*8.6+22;k.add(`<g transform="rotate(${rot} ${x} ${y})">`);k.line([[x-w/2-12,y-14],[x-w/2+2,y]],1.2,C.ink,{op:.8});
  k.shape([[x-w/2,y-11],[x+w/2,y-11],[x+w/2,y+11],[x-w/2,y+11],[x-w/2-10,y]],'#FFD8E0',{w:1.6,one:1});k.add(`<circle cx="${R1(x-w/2-3)}" cy="${y}" r="2.2" fill="#FFFBF3" stroke="${C.ink}" stroke-width="1"/>`);k.text(txt,x+3,y+6,18);k.add('</g>')})}
// appended hotspot: transparent hit, hover outline, label tag (the base art is untouched)
function hotTag(k,attr,val,label,rc,tx,ty,rot){hot(k,attr,val,label,rc,tagLabel(k,tx,ty,label.toLowerCase(),rot))}
/* ===== world C ===== */
// shared overlay zones (same as the world A hubs): dog x300-560 ground y~500, bowl (250,520), right decor x620-860 y330-520
const INDOOR={cafe:1,vet:1,salon:1,playroom:1};
const wnAttrs=e=>(e.lt?' data-lights="1"':'')+(e.ny?' data-newyear="1"':'')+(e.jp?' data-jp="1"':'');// v2.8
const wnKey=e=>(e.lt?'|lt':'')+(e.ny?'|ny':'')+(e.jp?'|jp':'');
// long outlines are resampled a little coarser (same wobble and taper), which keeps big scenes under ~300 KB
function lighten(k){const pen0=k.pen;k.pen=(pts,closed,o={})=>{if(!o.step){let L=0;const n=pts.length,m=closed?n:n-1;for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n];L+=Math.hypot(b[0]-a[0],b[1]-a[1])}if(L>260)o=Object.assign({},o,{step:L>1200?15:L>600?12:9})}return pen0(pts,closed,o)}}
function frameC(name,label,body,env,attrs=''){
  const k=kit(hashS('pwc-'+name));lighten(k);k.env=env||DEF_ENV;k.so=INDOOR[name]?'':k.env.ssn;k.xl=[];k.rc=recolorFn(k.env,INDOOR[name]?'in':'out');const pp=paperDefs(k,1000,600);
  body(k);
  const ex=(k.env.def?'':` data-time="${k.env.time}" data-weather="${k.env.weather}"${k.env.ssn?` data-season="${k.env.ssn}"`:''}`)+(k.env.hw?' data-halloween="1"':'')+wnAttrs(k.env)+attrs;
  return assemble(k,pp,1000,`<svg class="pa-wc-scene pa-wc-${name}" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}${k.env.def?'':`, ${k.env.time}, ${k.env.weather}${k.env.ssn?', '+k.env.ssn:''}`}"${ex}>`,false);
}
/* ---------- small doodle kit for world C ---------- */
const dk=c=>mixH(c,'#5B3D32',.22);
// window seen from inside: frame, curtains, and the real sky (rain streaks on the glass, snow on the sill)
function winIn(k,x,y,w,h,o={}){O.window(k,x,y,w,h,{curtain:o.curtain,frame:o.frame||'#FFFFFF',noLit:1,glass:skyGrad(k,y,y+h),inside:()=>k.side(()=>windowView(k,x,y,w,h,{rainGlass:1,sillSnow:1}))})}
// hanging pendant lamp (lit at dusk/night)
function pendant(k,x,len,col,s=1){k.line([[x,0],[x+k.J(1),len]],1.6);const sh=[[x-26*s,len+30*s],[x+26*s,len+30*s],[x+13*s,len],[x-13*s,len]];
  k.shape(sh,col,{w:2,hatch:{side:.65,gap:4,col:dk(col),op:.5}});k.add(`<ellipse cx="${x}" cy="${R1(len+31*s)}" rx="${R1(9*s)}" ry="${R1(4*s)}" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1.2"/>`);
  if(k.env.lit)k.lamps.push({x,y:len+36*s,s:1.15*s,glass:sh,big:1})}
// tiny lit dot for far windows (unrecoloured light layer)
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
function bike(k,x,gy,s=1,col=C.red){const r=15*s,ax=x-25*s,bx=x+25*s,wy=gy-r;
  [ax,bx].forEach(cx=>{k.add(`<circle cx="${R1(cx)}" cy="${R1(wy)}" r="${R1(r)}" fill="none" stroke="${C.ink}" stroke-width="2.4"/><circle cx="${R1(cx)}" cy="${R1(wy)}" r="${R1(r*.62)}" fill="none" stroke="${C.graph}" stroke-width="1"/><circle cx="${R1(cx)}" cy="${R1(wy)}" r="2" fill="${C.ink}"/>`)});
  const sx=x-6*s,sy=gy-34*s,hx=x+18*s,hy=gy-36*s;k.line([[ax,wy],[sx,sy],[hx,hy],[bx,wy]],2.6,col,{amp:.3});k.line([[ax,wy],[x,wy],[sx,sy]],2.6,col,{amp:.3});k.line([[x,wy],[hx,hy]],2.6,col,{amp:.3});
  k.shape(RC(sx-8*s,sy-5*s,15*s,4*s),C.ink,{noline:1,dx:0,dy:0});k.line([[hx,hy],[hx+2*s,hy-8*s],[hx+9*s,hy-9*s]],2,C.ink);
  k.shape([[hx+3*s,hy-8*s],[hx+19*s,hy-8*s],[hx+17*s,hy+4*s],[hx+5*s,hy+4*s]],'#E7C79E',{w:1.4,one:1});k.line([[hx+5*s,hy-3*s],[hx+17*s,hy-3*s]],1,'#B5875C')}
function planterTree(k,x,gy,s=1){k.shape([[x-20*s,gy],[x+20*s,gy],[x+24*s,gy-26*s],[x-24*s,gy-26*s]],'#E9B9A0',{w:1.8,hatch:{side:.6,gap:4,col:'#CF9479',op:.5}});k.shape(RC(x-27*s,gy-32*s,54*s,7*s),'#D9A086',{w:1.5,one:1});
  k.line([[x,gy-30*s],[x+k.J(1),gy-70*s]],3.4,C.trunkD);const so=k.so,c=crownCols(k,C.leaf,C.leafD,x,gy)[0];// v2.5
  if(so==='winter'){k.cap(()=>O.leafy(k,x,gy-92*s,30*s,28*s,c[0],c[1]));k.ss(()=>bareCrown(k,x,gy+(70*s-70*s*.62)-26*s,s*.62))}else{O.leafy(k,x,gy-92*s,30*s,28*s,c[0],c[1]);if(so==='spring')k.ss(()=>{for(let i=0;i<7;i++)flowerDot(k,x+(k.r()-.5)*44*s,gy-92*s+(k.r()-.5)*36*s,2.2*s,i%2?'#FFFFFF':'#F7B6C8')})}}

// v2 town dressing: window planter, chalkboard sign, passers-by silhouettes
function planterBox(k,x,gy,w=40,cols=[C.red,C.yellow,C.lav,'#FFB3C7']){
  k.shape([[x-w/2,gy-17],[x+w/2,gy-17],[x+w/2-4,gy],[x-w/2+4,gy]],'#E9B9A0',{w:1.6,hatch:{side:.6,gap:4,col:'#CF9479',op:.5}});
  k.shape(RC(x-w/2-2,gy-22,w+4,6),'#D9A086',{w:1.4,one:1});
  k.shape(blobP(x,gy-28,w*.46,9,k.r,8,.2),C.leaf2,{w:1.3,one:1});
  for(let i=0;i<3;i++)O.flower(k,x-w*.26+i*w*.26,gy-31-(i%2)*5,3.4,cols[i%cols.length])}
function aBoard(k,x,gy,txt,s=1){k.line([[x-9*s,gy-34*s],[x-15*s,gy]],2,C.ink);k.line([[x+9*s,gy-34*s],[x+15*s,gy]],2,C.ink);
  k.shape([[x-12*s,gy-6*s],[x-10*s,gy-36*s],[x+10*s,gy-36*s],[x+12*s,gy-6*s]],'#7FA38E',{w:1.6,one:1,hatch:{side:.6,gap:4,col:'#5F8670',op:.4}});
  k.text(txt,x,gy-18*s,Math.round(11*s),{col:'#FFFFFF',rot:-2});k.line([[x-8*s,gy-11*s],[x+8*s,gy-11*s]],1,'#FFFFFF',{op:.8})}
// a passer-by: soft pastel silhouette (coat, head, legs). o: {hair,hat,bag,balloon,skirt}
function walker(k,x,gy,s,coat,o={}){const skin='#F3CFB0',hair=o.hair||'#7A5A48',leg=o.leg||'#8E7F9E',sk=o.dir||1;
  k.line([[x-3.4*s,gy-30*s],[x-5*s*sk,gy-2*s]],3.4*s,leg,{amp:.3});k.line([[x+3.4*s,gy-30*s],[x+6*s*sk,gy-2*s]],3.4*s,leg,{amp:.3});
  k.add(`<ellipse cx="${R1(x-5*s*sk)}" cy="${R1(gy-1*s)}" rx="${R1(4.4*s)}" ry="${R1(2*s)}" fill="${C.ink}"/><ellipse cx="${R1(x+6*s*sk)}" cy="${R1(gy-1*s)}" rx="${R1(4.4*s)}" ry="${R1(2*s)}" fill="${C.ink}"/>`);
  const hem=o.skirt?gy-24*s:gy-30*s;
  k.shape([[x-9*s,hem],[x-7*s,gy-62*s],[x+7*s,gy-62*s],[x+9*s,hem]],coat,{w:1.5,one:1,hatch:{side:.55,gap:4,col:C.ink,op:.22}});
  k.line([[x-7*s,gy-60*s],[x-11*s*sk,gy-44*s],[x-10*s*sk,gy-38*s]],2.6*s,coat,{amp:.3});k.line([[x+7*s,gy-60*s],[x+11*s*sk,gy-46*s],[x+10*s*sk,gy-40*s]],2.6*s,coat,{amp:.3});
  k.shape(E(x,gy-69*s,6.6*s,7*s,9),skin,{w:1.3,one:1});
  k.shape([[x-7*s,gy-70*s],[x-5*s,gy-77*s],[x+5*s,gy-77*s],[x+7*s,gy-70*s],[x+3*s,gy-72*s],[x-4*s,gy-71*s]],hair,{w:1.1,one:1});
  if(o.hat)k.shape([[x-9*s,gy-73*s],[x+9*s,gy-73*s],[x+4*s,gy-83*s],[x-4*s,gy-83*s]],o.hat,{w:1.3,one:1});
  if(o.bag){const bx=x+11*s*sk,by=gy-38*s;k.shape(RC(bx-5*s,by,10*s,12*s),o.bag,{w:1.3,one:1});k.line([[bx-3*s,by],[bx,by-5*s],[bx+3*s,by]],1.2)}
  if(o.balloon){const bx=x-14*s*sk,by=gy-96*s;k.line([[x-11*s*sk,gy-44*s],[bx,by+8*s]],1,C.graph);k.shape(E(bx,by,7*s,9*s,10),o.balloon,{w:1.3,one:1});k.add(`<path d="M${R1(bx-1.5*s)} ${R1(by-5*s)}q${R1(-2*s)} ${R1(2*s)} 0 ${R1(4*s)}" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>`)}}
function kite(k,x,y,s,c1,c2,ang=0,strTo){k.add(`<g transform="rotate(${ang} ${x} ${y})">`);const p=[[x,y-30*s],[x+20*s,y-4*s],[x,y+34*s],[x-20*s,y-4*s]];
  k.fill([[x,y-30*s],[x+20*s,y-4*s],[x,y-4*s]],c2,{dx:.5,dy:.5});k.fill([[x,y-4*s],[x-20*s,y-4*s],[x,y+34*s]],c2,{dx:.5,dy:.5});k.fill([[x,y-30*s],[x-20*s,y-4*s],[x,y-4*s]],c1,{dx:.5,dy:.5});k.fill([[x,y-4*s],[x+20*s,y-4*s],[x,y+34*s]],c1,{dx:.5,dy:.5});
  k.pen(p,true,{w:1.9});k.line([[x,y-28*s],[x,y+32*s]],1.1);k.line([[x-18*s,y-4*s],[x+18*s,y-4*s]],1.1);
  const tl=[];for(let i=0;i<=8;i++)tl.push([x+Math.sin(i*.9)*7*s,y+34*s+i*8*s]);k.line(tl,1.3);[2,5,8].forEach((i,j)=>{const q=tl[i];k.add(`<path d="M${R1(q[0]-6*s)} ${R1(q[1]-4*s)}L${R1(q[0])} ${R1(q[1])}L${R1(q[0]-6*s)} ${R1(q[1]+4*s)}ZM${R1(q[0]+6*s)} ${R1(q[1]-4*s)}L${R1(q[0])} ${R1(q[1])}L${R1(q[0]+6*s)} ${R1(q[1]+4*s)}Z" fill="${[C.pink,C.yellow,C.mint][j]}" stroke="${C.ink}" stroke-width="1"/>`)});
  k.add('</g>');if(strTo)k.line([[x,y+4*s],[(x+strTo[0])/2,(y+strTo[1])/2+30],strTo],1,C.graph,{op:.9})}
// a bone-shaped kite (the town's pride)
function boneKite(k,x,y,s,strTo){k.add(`<g transform="rotate(-14 ${x} ${y})">`);const p=[[x-30*s,y-6*s],[x+30*s,y-6*s],[x+36*s,y-15*s],[x+46*s,y-10*s],[x+42*s,y],[x+46*s,y+10*s],[x+36*s,y+15*s],[x+30*s,y+6*s],[x-30*s,y+6*s],[x-36*s,y+15*s],[x-46*s,y+10*s],[x-42*s,y],[x-46*s,y-10*s],[x-36*s,y-15*s]];
  k.shape(p,'#FFF3DA',{w:2,hatch:{side:.6,gap:4,col:'#E2C69A',op:.6}});k.add('</g>');
  const tl=[];for(let i=0;i<=7;i++)tl.push([x-44*s-i*8*s,y+12*s+Math.sin(i*1.1)*6*s]);k.line(tl,1.2);[3,6].forEach(i=>O.heart(k,tl[i][0],tl[i][1],4*s));
  if(strTo)k.line([[x,y+4*s],[(x+strTo[0])/2,(y+strTo[1])/2+30],strTo],1,C.graph,{op:.9})}
// little shopfront for the square and the town strip
function shopF(k,x,w,top,base,o){const wall=o.wall||C.wall;k.shape(RC(x,top,w,base-top),wall,{w:2.2,hatch:{side:.84,gap:5,col:dk(wall),op:.3}});
  if(o.brick){let d='';for(let y=top+16;y<base-6;y+=16){const off=((y-top)/16)%2?0:18;for(let bx=x+off+4;bx<x+w-30;bx+=36)d+=`M${R1(bx)} ${R1(y)}h28`}k.add(`<path d="${d}" stroke="#fff" stroke-opacity=".45" stroke-width="1.3"/>`)}
  k.shape(RC(x-6,top-12,w+12,14),o.corn||C.wood,{w:1.9,one:1});if(k.env.snow)k.side(()=>capLine(k,[[x-8,top-12],[x+w+8,top-12]],8));
  const up=o.upper??2,uw=Math.min(40,w/(up*1.9));for(let i=0;i<up;i++){const wx=x+w*(i+.5)/up-uw/2;winS(k,wx,top+18,uw,uw*1.1,o.curt||'#FFC9D3')}
  const sy=top+26+uw*1.1+8;k.shape(RC(x+w*.12,sy,w*.76,30),o.signCol||'#FFFBF3',{w:1.9,one:1});k.text(o.sign,x+w/2,sy+23,Math.min(26,w*.76/(o.sign.length*.5+1)),{rot:k.J(1.5)});
  const ay=sy+38;O.awning(k,x+8,ay,w-16,22,o.awn[0],o.awn[1]);
  const gy=ay+34,dw=Math.min(46,w*.24),gw=w-dw-40;k.shape(RC(x+12,gy,gw,base-gy-10),C.glass,{w:2,one:1});if(k.env.lit&&!o.noGlow)k.glows.push([x+12,gy,gw,base-gy-10]);
  k.add(`<path d="M${R1(x+22)} ${R1(base-22)}l${R1(Math.min(30,gw*.3))} ${R1(-(base-gy)*.5)}" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".8"/>`);
  if(o.disp)o.disp(x+12,gy,gw,base-gy-10);
  const dx0=x+w-dw-14;k.shape(RC(dx0,gy-4,dw,base-gy+4),o.door||'#C79A72',{w:2,one:1});k.add(`<circle cx="${R1(dx0+dw-8)}" cy="${R1((gy+base)/2)}" r="2.6" fill="${C.ink}"/>`);
  k.shape(RC(x-4,base-6,w+8,8),C.stoneD,{w:1.5,one:1});
  k.ss(()=>{const so=k.so,dc=dx0+dw/2,sz=Math.min(1,(base-gy)/60);if(o.noDeco){if(so==='winter')frostLine(k,[[x-5,top-12],[x+w+5,top-12]])}else if(so==='winter'){const wr=k.cap(()=>wreath(k,dc,gy+14*sz,.85*sz+.15));if(!k.env.ny)k.add(wr);frostLine(k,[[x-5,top-12],[x+w+5,top-12]])}else if(so==='autumn'){pumpkin(k,dx0-10,base-5,.7*sz+.1);pumpkin(k,dx0-24,base-4,.5*sz+.1)}else if(so==='spring')bulbs(k,dx0-14,base-5,2,.65*sz+.15)})}// v2.5
// light upper-floor window (single pass, used many times on shopfronts)
function winS(k,x,y,w,h,curt){k.fill(RC(x-3,y-3,w+6,h+6),'#FFFFFF',{dx:0,dy:0,amp:.6});k.add(`<rect x="${R1(x)}" y="${R1(y)}" width="${R1(w)}" height="${R1(h)}" fill="${C.glass}"/>`);
  if(curt)k.add(`<path d="M${R1(x)} ${R1(y)}h${R1(w*.3)}q${R1(-w*.14)} ${R1(h*.4)} 0 ${R1(h*.8)}h${R1(-w*.3)}zM${R1(x+w)} ${R1(y)}h${R1(-w*.3)}q${R1(w*.14)} ${R1(h*.4)} 0 ${R1(h*.8)}h${R1(w*.3)}z" fill="${curt}" stroke="${C.ink}" stroke-width="1.1"/>`);
  k.add(`<path d="M${R1(x+w/2)} ${R1(y)}v${R1(h)}M${R1(x)} ${R1(y+h/2)}h${R1(w)}" stroke="${C.ink}" stroke-width="1.6"/>`);k.line([[x-3,y-3],[x+w+3,y-3],[x+w+3,y+h+3],[x-3,y+h+3],[x-3,y-4]],1.9,C.ink,{step:14,amp:.5});k.line([[x-7,y+h+5],[x+w+7,y+h+5]],2.6,C.ink,{step:14});if(k.env.lit)k.glows.push([x,y,w,h])}
// warm light beam that fades out (lighthouse)
function beamGrad(k,x0,x1){const id=uid();k.defs2.push(`<linearGradient id="${id}" x1="${x0}" y1="0" x2="${x1}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFF0A8" stop-opacity=".75"/><stop offset=".5" stop-color="#FFE58A" stop-opacity=".3"/><stop offset="1" stop-color="#FFE58A" stop-opacity="0"/></linearGradient>`);return id}
// light bunting: one string, flags batched per colour, one outline path
function buntingL(k,x0,x1,y,sag,cols){const n=Math.round((x1-x0)/36),pt=t=>[x0+(x1-x0)*t,y+Math.sin(Math.PI*t)*sag];const L=[];for(let i=0;i<=12;i++)L.push(pt(i/12));k.line(L,1.4,C.ink,{step:14});
  const fills=cols.map(()=>''),ol=[];for(let i=0;i<n;i++){const a=pt((i+.2)/n),b=pt((i+.8)/n),m=pt((i+.5)/n),tip=[m[0]+k.J(2),m[1]+24+k.J(2)];const d=`M${R1(a[0])} ${R1(a[1])}L${R1(b[0])} ${R1(b[1])}L${R1(tip[0])} ${R1(tip[1])}Z`;fills[i%cols.length]+=`M${R1(a[0]+1.5)} ${R1(a[1]+1.5)}L${R1(b[0]+1.5)} ${R1(b[1]+1.5)}L${R1(tip[0]+1)} ${R1(tip[1]+1.5)}Z`;ol.push(d)}
  k.add(fills.map((d,i)=>d?`<path d="${d}" fill="${cols[i]}"/>`:'').join('')+`<path d="${ol.join('')}" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/>`)}
const fl=(k,list,s=5)=>list.forEach(f=>O.flower(k,f[0],f[1],s,f[2]));
// perspective paving: rows grow toward the viewer, joints aim at a vanishing point
function paving(k,y0,y1,vx,vy,col,tint){let d='',f='';const rows=[];let y=y0,h=13;while(y<y1){rows.push(y);y+=h;h*=1.16}rows.push(y1+20);
  rows.forEach(yy=>{d+=`M0 ${R1(yy+k.J(1))}L1000 ${R1(yy+k.J(1))}`});
  for(let i=0;i<rows.length-1;i++){const ya=rows[i],yb=rows[i+1],sp=(yb-ya)*3.3,off=(i%2)*sp/2;let px=null;
    for(let x=-sp+off;x<1000+sp;x+=sp){const xb=x+k.J(sp*.08),xa=vx+(xb-vx)*(ya-vy)/(yb-vy);d+=`M${R1(xa)} ${R1(ya)}L${R1(xb)} ${R1(yb)}`;
      if(px&&k.r()<.16)f+=`M${R1(px[0])} ${R1(ya)}L${R1(xa)} ${R1(ya)}L${R1(xb)} ${R1(yb)}L${R1(px[1])} ${R1(yb)}Z`;px=[xa,xb]}}
  k.add(`<path d="${f}" fill="${tint}" opacity=".7"/><path d="${d}" stroke="${col}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".85"/>`)}
function hatchBand(k,y0,y1,col,op,gap=7){let d='';for(let x=-80;x<1080;x+=gap)d+=`M${R1(x+k.J(1))} ${y1}L${R1(x+(y1-y0)*.5+k.J(1))} ${y0}`;k.add(`<path d="${d}" stroke="${col}" stroke-width="1" stroke-opacity="${op}" fill="none"/>`)}
const BOWC=[C.pink,C.yellow,C.mint,C.lav,C.blue,C.red];
function bow(k,x,y,s,col){k.shape([[x,y],[x-13*s,y-8*s],[x-14*s,y+8*s]],col,{w:1.4,one:1});k.shape([[x,y],[x+13*s,y-8*s],[x+14*s,y+8*s]],col,{w:1.4,one:1});k.add(`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(3.4*s)}" fill="${col}" stroke="${C.ink}" stroke-width="1.2"/><path d="M${R1(x-2*s)} ${R1(y+3*s)}l${R1(-4*s)} ${R1(9*s)}M${R1(x+2*s)} ${R1(y+3*s)}l${R1(4*s)} ${R1(9*s)}" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round"/>`)}
function bottle(k,x,gy,s,col,lab){k.shape([[x-9*s,gy],[x-9*s,gy-26*s],[x-4*s,gy-32*s],[x-4*s,gy-38*s],[x+4*s,gy-38*s],[x+4*s,gy-32*s],[x+9*s,gy-26*s],[x+9*s,gy]],col,{w:1.5,one:1});k.shape(RC(x-5*s,gy-44*s,10*s,6*s),C.white,{w:1.2,one:1});
  if(lab){k.shape(RC(x-7*s,gy-20*s,14*s,10*s),'#FFFBF3',{w:1,one:1,noline:1,dx:0,dy:0})}}
function mug(k,x,gy,col){k.shape([[x-9,gy],[x-10,gy-18],[x+10,gy-18],[x+9,gy]],col,{w:1.5,one:1});k.add(`<path d="M${x+10} ${gy-14}q8 0 7 6q-1 5 -8 4" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`)}
function steam(k,x,y){k.add(`<path d="M${x} ${y}q-5 -7 0 -14q5 -7 0 -14M${x+8} ${y-2}q-4 -6 0 -12q4 -6 0 -11" fill="none" stroke="${C.graph}" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>`)}
function donut(k,x,y,s,icing){k.shape(E(x,y,12*s,8*s,12),'#E8B57A',{w:1.5,one:1});k.fill(E(x,y-1.5*s,10*s,6*s,12),icing,{dx:0,dy:0});k.add(`<ellipse cx="${x}" cy="${R1(y-1*s)}" rx="${R1(3.4*s)}" ry="${R1(2*s)}" fill="#FFFBF3" stroke="${C.ink}" stroke-width="1"/><path d="M${R1(x-6*s)} ${R1(y-3*s)}l2 -1M${R1(x+4*s)} ${R1(y-4*s)}l2 1M${R1(x+6*s)} ${R1(y+1*s)}l1 2" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`)}
function plant(k,x,gy,s=1,pot=C.roof){k.shape([[x-17*s,gy],[x+17*s,gy],[x+21*s,gy-32*s],[x-21*s,gy-32*s]],pot,{w:1.8,hatch:{side:.6,gap:4,col:dk(pot),op:.5}});
  [[-1.95,26],[-1.5,34],[-1.15,30],[-.8,24],[-2.35,22],[-1.3,18]].forEach(([a,l])=>{const px=x+Math.cos(a)*l*1.4*s,py=gy-36*s+Math.sin(a)*l*1.7*s;k.line([[x,gy-32*s],[px,py]],1.2,C.leafD);k.shape(E(px,py,9*s,15*s,8,a+Math.PI/2),C.leaf2,{w:1.4,one:1})})}
function poster(k,x,y,w,h,rot,fn){k.add(`<g transform="rotate(${rot} ${x+w/2} ${y+h/2})">`);k.shape(RC(x,y,w,h),'#FFFFFF',{w:1.9});fn(x,y,w,h);k.add('</g>');O.tape(k,x+w/2-22,y-10,44,rot-3,'#F7B9C6')}

/* ======================= SCENES ======================= */
// ---------- Town Square ----------
function sqSquare(k){
  k.skyD(()=>{skyBand(k,1000,380);O.sun(k,880,66,28);O.cloud(k,300,60,22);O.cloud(k,740,48,18);O.bird(k,390,82,8);O.bird(k,412,94,6)},
    {W:1000,H:400,sun:[880,66,28],low:[905,138,28],moon:[870,70,24],clouds:[[300,60,22],[740,50,18]],rainC:[[120,40,24],[480,28,26],[960,96,22]],birds:[[390,82,8],[412,94,6]],stars:40});
  k.jp(()=>{jpFujiDraw(k,jpSpot('square'));jpDressDraw(k,'square','far')});// v2.8: Fuji over the roofs of Paws & Pages, telephone poles at the back edge
  // shopfronts behind the square
  shopF(k,-14,214,176,394,{wall:C.wall2,noGlow:1,sign:'Bone Appétit',awn:[C.red,'#fff'],door:'#E8A9B8',upper:2,disp:(x,y,w,h)=>{[[x+24,y+h-14],[x+56,y+h-14],[x+88,y+h-14]].forEach(([bx,by],i)=>{k.shape(E(bx,by,13,7,10),'#F0D9B5',{w:1.3,one:1});if(i!==1)donut(k,bx,by-9,.9,i?'#FFB3C7':C.lav);else{k.shape([[bx-9,by-4],[bx+9,by-4],[bx+7,by-18],[bx-7,by-18]],'#F7C5CF',{w:1.3,one:1});k.shape(E(bx,by-20,9,6,10),'#FFFBF3',{w:1.2,one:1})}})}});
  shopF(k,214,290,206,394,{wall:C.wall,brick:1,sign:'Paws &amp; Pages',awn:[C.mint,'#fff'],door:'#B9D3F2',upper:3,curt:C.mint,disp:(x,y,w,h)=>{let bx=x+16;const cs=[C.red,C.blue,C.yellow,C.lav,C.mint,C.orange];for(let i=0;i<9;i++){const bw=10+(i*7%6),bh=28+(i*11%14);k.shape(RC(bx,y+h-bh-4,bw,bh),cs[i%6],{w:1.2,one:1});bx+=bw+3}k.text('(dogs read too)',x+w-60,y+h-8,13,{wt:600,rot:-3})}});
  shopF(k,616,186,190,394,{wall:C.wall3,noDeco:1,sign:'Post Office',awn:[C.blue,'#fff'],door:'#E57E83',upper:2,curt:C.yellow,signCol:'#FFFFFF',disp:(x,y,w,h)=>{k.shape(RC(x+14,y+h-34,40,26),'#FFFBF3',{w:1.3,one:1});k.line([[x+14,y+h-34],[x+34,y+h-20],[x+54,y+h-34]],1.2);O.heart(k,x+34,y+h-18,4)}});
  k.ss(()=>{if(k.so==='winter'){chimney(k,40,166,1);chimney(k,300,196,1.05);chimney(k,700,180,.95)}});// v2.5: chimneys smoke in winter
  shopF(k,816,198,164,394,{wall:C.wall4,sign:'Squeak Shop',awn:[C.yellow,'#fff'],door:'#B9DD92',upper:2,curt:C.lav,disp:(x,y,w,h)=>{k.shape(E(x+26,y+h-14,10,10,10),'#E9F59B',{w:1.4,one:1});k.add(`<path d="M${x+18} ${y+h-20}q8 6 16 0" fill="none" stroke="#fff" stroke-width="1.6"/>`);k.shape([[x+48,y+h-6],[x+50,y+h-26],[x+70,y+h-26],[x+72,y+h-6]],C.yellow,{w:1.3,one:1});k.add(`<circle cx="${x+66}" cy="${y+h-30}" r="7" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1.2"/><path d="M${x+72} ${y+h-31}l6 2 -6 2z" fill="${C.orange}"/>`)}});
  // clock tower
  {const tx=560;k.shape(RC(tx-42,64,84,330),C.stone,{w:2.3,hatch:{side:.78,gap:5,col:C.stoneD,op:.55}});let d='';for(let y=84;y<390;y+=20)d+=`M${tx-38} ${y}h76`;k.add(`<path d="${d}" stroke="#fff" stroke-opacity=".5" stroke-width="1.3"/>`);
   const roof=[[tx-54,68],[tx,8],[tx+54,68]];k.shape(roof,C.roof,{w:2.3,hatch:{side:.55,gap:5,col:C.roofD,op:.55}});k.line([[tx,8],[tx,-6]],2);k.shape([[tx,-6],[tx+16,-1],[tx,4]],C.pink,{w:1.3,one:1});
   k.shape(E(tx,124,30,30,18),'#FFFBF3',{w:2.3});for(let i=0;i<12;i++){const a=i/12*Math.PI*2;k.line([[tx+Math.cos(a)*23,124+Math.sin(a)*23],[tx+Math.cos(a)*27,124+Math.sin(a)*27]],i%3?1.1:2)}
   if(k.env.lit)k.glows.push([tx-21,103,42,42]);
   k.side(()=>{const hm={dawn:[6,0],day:[1,10],dusk:[6,0],night:[10,10]}[k.env.time],ha=(hm[0]%12+hm[1]/60)/12*Math.PI*2-Math.PI/2,ma=hm[1]/60*Math.PI*2-Math.PI/2;
     k.add(`<path d="M${tx} 124L${R1(tx+Math.cos(ha)*14)} ${R1(124+Math.sin(ha)*14)}M${tx} 124L${R1(tx+Math.cos(ma)*21)} ${R1(124+Math.sin(ma)*21)}" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/><circle cx="${tx}" cy="124" r="3" fill="${C.pink}" stroke="${C.ink}"/>`)});
   const ar=[[tx-16,250],[tx-16,206],[tx,192],[tx+16,206],[tx+16,250]];k.shape(ar,'#9AA7B8',{w:1.9});k.shape(E(tx,214,9,9,10),C.yellow,{w:1.5});k.line([[tx,205],[tx,198]],1.4);
   k.shape(RC(tx-22,330,44,64),'#C79A72',{w:2});k.add(`<path d="M${tx} 330v64" stroke="${C.ink}" stroke-width="1.4"/>`);
   if(k.env.snow)k.side(()=>{capLine(k,[[tx-56,68],[tx,7],[tx+56,68]],10)});
   k.lt(()=>ltStar(k,tx,44,.78));// v2.8 Winter Lights: a paper star pinned on the tower roof (clear of the sweater banner below)
   k.ny(()=>{nyKado(k,tx-40,394,1.1,-1);nyKado(k,tx+40,394,1.1,1)})}// v2.8 New Year: the big kadomatsu pair at the tower door
  // bunting from the tower to the edges
  if(k.env.jp)buntingL(k,0,207,150,14,[C.red,C.yellow,C.mint,C.lav,C.blue]);else buntingL(k,0,516,150,26,[C.red,C.yellow,C.mint,C.lav,C.blue]);// v2.8: with the Japan scenery the left string ends at the telephone pole, so Fuji shows over Paws & Pages
  buntingL(k,604,1000,150,22,[C.yellow,C.mint,C.lav,C.blue,C.red]);
  // the square: perspective flagstones, a cobble ring around the fountain
  k.fill([[0,394],[1000,394],[1000,600],[0,600]],'#E8E1D6',{dx:0,dy:0,sc:0});k.pen([[0,396],[500,394],[1000,396]],false,{w:2});
  paving(k,396,600,500,250,'#BFB2A2','#DDD4C8');
  k.ss(()=>{const so=k.so;if(so==='autumn')k.add('<rect y="396" width="1000" height="204" fill="#F2B25C" fill-opacity=".08"/>');// v2.5: warmer paving in autumn
    seasonGround(k,[0,400,1000,598],100,[[630,306,854,518]],0,1);if(so==='autumn')seasonGround(k,[200,528,520,598],40,[],0,1);if(so==='winter'){const wr=k.cap(()=>wreath(k,560,352,1.2));if(!k.env.ny)k.add(wr)}});// v2.5 (v2.8: New Year takes the wreath down, the pine goes up)
  k.fx(()=>{if(k.env.rain){sheen(k,0,1000,404,598,64,HZ);[[450,580,48,9],[760,562,40,8],[930,476,30,6],[60,560,34,7]].forEach(q=>puddle(k,...q))}
    if(k.env.snow){[[450,580,74,13],[760,566,62,11],[934,478,46,9],[70,566,50,9],[300,420,50,8]].forEach(q=>snowPatch(k,...q))}});
  k.jp(()=>jpDressDraw(k,'square','mid'));// v2.8: the noren on the bakery door, the vending machine against Paws & Pages
  // benches against the shops, lamp posts
  O.bench(k,346,424,.82);O.lamp(k,598,428,1);O.lamp(k,266,410,.9);
  // v2.6 Halloween, up high and at the back: paper lanterns strung between the lamp posts, paper bats on the clock tower
  k.hw(()=>{hwLanternString(k,270,300,594,306,26,6,.9);[[531,90,.7],[591,94,.62],[530,178,.66]].forEach(([x,y,s])=>hwBat(k,x,y,s,{col:HWP}));hwSkyBats(k,[[250,96,.8],[300,74,.6],[700,60,.7]])});
  k.lt(()=>ltString(k,sagP(268,342,596,352,22,16),22,{skip:(x,y)=>x>398&&x<450}));// v2.8 Winter Lights: a string of bulbs between the lamp posts
  // fountain with the dog statue (Sir Splashington), left of the bowl spot
  {const fx=126;k.shape(E(fx,450,104,26,20),C.stone,{w:2.3,hatch:{side:.6,gap:5,col:C.stoneD,op:.5}});
   k.shape([[fx-104,450],[fx+104,450],[fx+100,482],[fx-100,482]],C.stone,{w:2.2,hatch:{side:.7,gap:5,col:C.stoneD,op:.5}});k.fill(E(fx,481,100,10,14),C.stone,{dx:0,dy:0});k.pen([[fx-100,481],[fx-50,490],[fx,492],[fx+50,490],[fx+100,481]],false,{w:2.2});
   for(let x=fx-90;x<fx+100;x+=32)k.line([[x,456],[x+2,484]],1.1,C.stoneD);
   k.shape(E(fx,448,88,17,18),C.water,{w:1.6,one:1});k.add(`<path d="M${fx-60} 446q8 -4 16 0t16 0M${fx+10} 452q8 -4 16 0t16 0M${fx-20} 442q6 -3 12 0" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`);
   k.shape([[fx-18,446],[fx-14,386],[fx+14,386],[fx+18,446]],C.stone,{w:2,hatch:{side:.6,gap:4,col:C.stoneD,op:.55}});k.shape(RC(fx-26,376,52,12),C.stoneD,{w:1.8});
   k.shape(RC(fx-17,404,34,18),'#E1C47A',{w:1.3,one:1});k.text('Sir Splash',fx,417,11,{wt:700});
   // the statue: a sitting stone dog with a pink collar, proudly spitting water (lowered so the bakery sign stays readable)
   k.add('<g transform="translate(0 30)">');const sc='#E3E7EA',sd='#9FAEB9';
   k.line([[fx-24,336],[fx-42,328],[fx-48,312],[fx-38,304]],6,C.ink);k.line([[fx-24,336],[fx-42,328],[fx-48,312],[fx-38,304]],3.4,sc);
   k.shape([[fx-28,346],[fx-30,318],[fx-20,296],[fx+2,290],[fx+18,304],[fx+22,346]],sc,{w:2.2,hatch:{side:.55,gap:4,col:sd,op:.7}});
   k.shape([[fx-4,346],[fx-2,322],[fx+8,320],[fx+10,346]],sc,{w:1.6,one:1});k.shape([[fx+10,346],[fx+12,324],[fx+20,326],[fx+22,346]],sc,{w:1.6,one:1});
   k.shape([[fx-2,298],[fx-6,280],[fx+4,264],[fx+24,260],[fx+42,268],[fx+50,280],[fx+44,292],[fx+28,296],[fx+10,300]],sc,{w:2.2,hatch:{side:.62,gap:4,col:sd,op:.65}});
   k.shape([[fx+2,270],[fx-6,244],[fx+16,262]],sd,{w:1.8,one:1});k.shape([[fx+22,262],[fx+30,240],[fx+34,264]],sd,{w:1.8,one:1});
   k.add(`<circle cx="${fx+26}" cy="272" r="3" fill="${C.ink}"/><circle cx="${fx+27}" cy="271" r="1" fill="#fff"/><path d="M${fx+19} 265l9 -3" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/><ellipse cx="${fx+49}" cy="279" rx="4" ry="3" fill="${C.ink}"/><path d="M${fx+50} 288q-6 4 -12 2" fill="${C.pink}" stroke="${C.ink}" stroke-width="1.4"/><ellipse cx="${fx+16}" cy="282" rx="5" ry="3" fill="${C.pink}" opacity=".6"/>`);
   k.shape([[fx-4,300],[fx+22,296],[fx+24,303],[fx-3,307]],C.pink,{w:1.5,one:1});k.add(`<circle cx="${fx+10}" cy="308" r="3.4" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1.2"/>`);
   const arc=[];for(let i=0;i<=12;i++){const t=i/12;arc.push([fx+48+t*54,288-Math.sin(t*Math.PI*.62)*30+t*t*156])}{const wa=k.cap(()=>{k.line(arc,6,'#9CCDE8',{amp:.3});k.line(arc,2.4,'#FFFFFF',{amp:.3})});if(!k.env.lt)k.add(wa)}// v2.8: the fountain is off for Winter Lights
   {const px=fx+14,py=246;k.shape(E(px,py,10,7,10),'#B7B5C9',{w:1.5,one:1});k.shape(E(px+8,py-7,5,5,8),'#B7B5C9',{w:1.4,one:1});k.add(`<path d="M${px+13} ${py-7}l4 1 -4 2z" fill="${C.orange}"/><circle cx="${px+9}" cy="${py-8}" r="1.1" fill="${C.ink}"/><path d="M${px-3} ${py+6}v3M${px+3} ${py+6}v3" stroke="#E8945A" stroke-width="1.4"/>`)}
   k.add('</g>');
   if(!k.env.lt)k.add(`<circle cx="${fx+100}" cy="446" r="2.4" fill="#BEE0F2" stroke="#6F8FA8" stroke-width=".9"/><circle cx="${fx+112}" cy="440" r="1.8" fill="#BEE0F2" stroke="#6F8FA8" stroke-width=".9"/><circle cx="${fx+90}" cy="438" r="1.6" fill="#BEE0F2" stroke="#6F8FA8" stroke-width=".9"/><path d="M${fx+84} 452q16 -8 32 0" fill="none" stroke="#fff" stroke-width="1.6"/>`);
   if(k.env.snow)k.side(()=>{capLine(k,E(fx,450,106,27,20).slice(10,20).concat([[fx+106,450]]),7);capLine(k,[[fx-27,376],[fx+27,376]],6);capLine(k,[[fx+4,294],[fx+24,290],[fx+42,298]],5)});
   k.lt(()=>ltFountain(k,fx))}// v2.8 Winter Lights: "off for winter", the basin heaped with fir and a string of bulbs
  k.hw(()=>{hwJack(k,50,439,.72);hwJack(k,78,472,.85);hwJack(k,176,471,.7)});// v2.6: pumpkins round the fountain rim
  // the town notice board (right decor zone, data-hot="notice")
  // v2.6.1: the board stands in front of the Post Office window, so its silhouette (roof, panel, posts) masks the window glow at dusk and night
  if(k.env.lit)(k.unlit=k.unlit||[]).push('M632 351L740 315L848 351L839 361L740 333L641 361ZM647 353H833V477H647ZM667 470H678V515H667ZM803 470H814V515H803Z');
  {const g=k.cap(()=>{k.line([[672,512],[672+k.J(1),410]],5,C.trunkD);k.line([[808,512],[808+k.J(1),410]],5,C.trunkD);
    k.shape([[636,350],[740,318],[844,350],[836,358],[740,330],[644,358]],C.roof,{w:2,hatch:{side:.6,gap:4,col:C.roofD,op:.55}});
    k.shape(RC(650,356,180,118),C.woodD,{w:2.2});k.shape(RC(660,366,160,98),'#E1B987',{w:1.6,one:1,hatch:{gap:6,col:'#C9A06E',op:.3}});
    k.shape(RC(690,358,100,22),'#FFFBF3',{w:1.6,one:1});k.text('Town Notice',740,375,19);
    const notes=[[668,386,46,40,-6,C.yellow,['Show 3','tricks!']],[720,384,44,44,5,'#FFD8E0',['LOST:','1 squeak']],[770,388,42,36,-4,C.mint,['free','belly rubs']],[680,428,40,30,4,'#FFFFFF',null],[730,432,52,28,-3,C.lav,['dog yoga','tues']],[786,428,30,30,7,C.blue,null]];
    notes.forEach(([x,y,w,h,a,c,t])=>{k.add(`<g transform="rotate(${a} ${x+w/2} ${y+h/2})">`);k.shape(RC(x,y,w,h),c,{w:1.3,one:1});if(t){k.text(t[0],x+w/2,y+h*.42,11.5,{wt:700});k.text(t[1],x+w/2,y+h*.42+12,11,{wt:600})}else if(c==='#FFFFFF'){k.add(`<path d="M${x+10} ${y+20}q10 -10 20 0q-2 6 -10 6q-8 0 -10 -6z" fill="#F5C26B" stroke="#2a2420" stroke-width="1.6"/><circle cx="${x+29}" cy="${y+15}" r="4" fill="#F5C26B" stroke="#2a2420" stroke-width="1.4"/>`)}else{O.heart(k,x+w/2,y+h/2,6)}k.add(`<circle cx="${x+w/2}" cy="${y+3}" r="2.6" fill="#E86A7C" stroke="${C.ink}" stroke-width=".8"/></g>`)});
    if(k.env.snow)k.side(()=>capLine(k,[[634,350],[740,316],[846,350]],8))});
   hot(k,'data-hot','notice','Town notice board',RC(630,306,224,212),g)}
  // planters, flowers, pigeons
  [[968,452]].forEach(([x,y])=>{k.shape(E(x,y,30,10,12),'#D9A086',{w:1.8});k.shape([[x-28,y],[x+28,y],[x+22,y+30],[x-22,y+30]],'#E9B9A0',{w:1.8,hatch:{side:.6,gap:4,col:'#CF9479',op:.5}});fl(k,[[x-14,y-10,C.red],[x+2,y-16,C.yellow],[x+16,y-8,C.lav]],5)});
  {const pg=(x,y,f)=>{k.shape(E(x,y,11,7,10),'#B7B5C9',{w:1.5,one:1});k.shape(E(x+9*f,y-8,5,5,8),'#C9C7D8',{w:1.4,one:1});k.add(`<path d="M${x+14*f} ${y-8}l${4*f} 1 ${-4*f} 2z" fill="${C.orange}"/><circle cx="${x+10*f}" cy="${y-9}" r="1.1" fill="${C.ink}"/><path d="M${x-2} ${y+6}v4M${x+3} ${y+6}v4" stroke="#E8945A" stroke-width="1.4"/>`)};pg(600,566,1);pg(640,580,-1);k.add(`<g fill="#E8C58A"><circle cx="618" cy="586" r="1.6"/><circle cx="626" cy="582" r="1.4"/><circle cx="612" cy="590" r="1.3"/></g>`)}
  fl(k,[[880,584,C.red],[580,592,'#FFB3C7'],[262,588,C.lav],[40,560,C.yellow],[70,580,C.red],[20,590,C.lav]]);
  k.ss(()=>{const so=k.so;if(so==='spring')bulbs(k,968,446,4,.9);else if(so==='autumn')pumpkin(k,930,484,.9);// v2.5
    {const px=446,gy=420;k.shape([[px-30,gy],[px+30,gy],[px+34,gy-24],[px-34,gy-24]],C.stone,{w:1.8,hatch:{side:.6,gap:4,col:C.stoneD,op:.55}});k.shape(RC(px-38,gy-30,76,7),C.stoneD,{w:1.5,one:1});// a stone planter in the phone crop
     if(so==='spring'){bulbs(k,px,gy-28,6,1.1);petalAt(k,px-44,gy+4,4,.4,PET[0]);petalAt(k,px+40,gy+8,4,1.9,PET[2])}
     else if(so==='autumn'){for(let i=0;i<6;i++)flowerDot(k,px-24+i*9.6,gy-36-(i%2)*7,4.2,['#EC9A4E','#F3BE55','#DF7556'][i%3]);k.add(`<path d="M${px-28} ${gy-30}q6 -8 12 -2q6 -8 12 -2q6 -8 12 -2q6 -8 12 -2" fill="none" stroke="#7D9A55" stroke-width="1.6"/>`);pumpkin(k,px+46,gy+4,1.15);pumpkin(k,px+66,gy+6,.8);pumpkin(k,px-48,gy+5,.9)}
     else if(so==='winter'){for(let i=0;i<5;i++)winterFlower(k,px-22+i*11,gy-40,4.5);frostLine(k,[[px-37,gy-30],[px+37,gy-30]]);frostLine(k,[[px-33,gy-23],[px+33,gy-23]])}}
    if(so==='winter'&&!k.env.night)robin(k,330,348,1.1,1);if(so==='spring'&&!k.env.night&&!k.env.rain)butterfly(k,420,330,1);
    seasonDrift(k,[[300,250,1],[500,170,.9],[760,250,1],[900,310,.85],[200,350,.8]])});
  O.sparkle(k,700,220,7);O.heart(k,400,150,6);O.note(k,460,230,11);
  O.tape(k,8,20,90,-26,'#F9E19A');O.tape(k,920,568,80,-24,'#D3C6F1');
}

// ---------- Pupuccino Café (indoors) ----------
function sqCafe(k){
  k.add(`<rect width="1000" height="410" fill="#FBE8D6"/>`);
  let wp='';for(let y=34;y<300;y+=56)for(let x=30+((y/56)%2)*40;x<1000;x+=80){wp+=(x+y)%3?`<path d="M${x-6} ${y}h12l-2 9h-8z" fill="#F2CFB4"/><path d="M${x+6} ${y+2}q4 0 3 4" fill="none" stroke="#F2CFB4" stroke-width="1.6"/>`:`<ellipse cx="${x}" cy="${y+4}" rx="4" ry="5.4" fill="#EDC5A4" transform="rotate(30 ${x} ${y+4})"/>`}k.add(wp);
  // wainscot
  k.add(`<rect y="300" width="1000" height="104" fill="#E9C9A2"/>`);let ws='';for(let x=20;x<1000;x+=40)ws+=`M${x} 306v94`;k.add(`<path d="${ws}" stroke="#D2AA7E" stroke-width="1.4"/>`);k.shape(RC(0,294,1000,10),C.woodD,{w:1.8,one:1});
  // floor: checkered tiles
  k.add(`<rect y="404" width="1000" height="196" fill="#F6E7D3"/>`);let ft='';for(let y=404,r=0;y<600;y+=33,r++)for(let x=(r%2)*48;x<1000;x+=96)ft+=`<rect x="${x}" y="${y}" width="48" height="33" fill="#D9B79A" opacity=".55"/>`;k.add(ft);
  for(let y=404;y<600;y+=33)k.line([[0,y],[1000,y]],1,'#CFAE90',{op:.6});
  k.shape(RC(0,398,1000,10),'#D9B48E',{w:2});
  // café name on the wall
  k.text('Pupuccino Café',430,92,50,{rot:-2});k.line([[290,104],[574,98]],2,C.pink,{amp:.4});O.heart(k,594,70,8);
  // window with a little striped valance (shows the real sky)
  winIn(k,56,98,196,170,{curtain:'#F7C5CF'});
  O.awning(k,46,80,216,20,C.red,'#fff');
  // bistro table and chairs (left, outside the bowl spot)
  {const tx=118;[[tx-64,1],[tx+62,-1]].forEach(([cx,sd])=>{k.line([[cx,520],[cx+sd*2,452]],3,C.ink);k.line([[cx+sd*14,520],[cx+sd*12,470]],3,C.ink);k.shape(E(cx+sd*7,468,20,6,10),'#E9A86A',{w:1.8});k.line([[cx,452],[cx-sd*4,404],[cx+sd*14,404],[cx+sd*14,468]],2.4,C.ink)});
   k.line([[tx,438],[tx,516]],4,C.ink);k.shape(E(tx,520,26,6,10),C.ink,{noline:1,dx:0,dy:0});k.shape(E(tx,436,62,12,16),'#FFFBF3',{w:2.1});
   k.shape(E(tx-20,430,18,5,10),'#FFFFFF',{w:1.4,one:1});donut(k,tx-20,425,1,'#FFB3C7');mug(k,tx+24,434,C.mint);steam(k,tx+22,412)}
  // shelf with mugs and jars
  k.shape(RC(296,214,268,10),C.woodD,{w:1.8});k.line([[316,224],[322,240]],2,C.woodD);k.line([[544,224],[538,240]],2,C.woodD);
  [[318,C.red],[344,C.yellow],[370,C.blue],[396,C.mint]].forEach(([x,c])=>mug(k,x,214,c));
  k.shape(RC(426,166,40,48),C.glass,{w:1.6});k.shape(RC(422,158,48,10),C.orange,{w:1.4,one:1});k.text('beans',446,196,13);
  k.shape(RC(478,174,40,40),C.glass,{w:1.6});k.shape(RC(474,166,48,10),C.lav,{w:1.4,one:1});k.text('bones',498,198,13);
  plant(k,542,214,.55,C.mint);
  k.jp(()=>jpDressDraw(k,'cafe','mid'));// v2.8: the kitchen doorway behind the counter, with its noren
  // pendant lamps
  pendant(k,330,96,'#F7C5CF');pendant(k,520,120,C.yellow,.9);pendant(k,744,60,C.mint,.9);
  // chalkboard menu
  {k.shape(RC(632,112,236,170),C.woodD,{w:2.3});k.shape(RC(642,122,216,150),'#56655F',{w:1.6,one:1});const ck='#FFFBF3';
   let sm='';for(let i=0;i<10;i++)sm+=`M${R1(650+k.r()*196)} ${R1(130+k.r()*130)}l${R1(10+k.r()*16)} ${R1(-3+k.r()*2)}`;k.add(`<path d="${sm}" stroke="#7F8F88" stroke-width="3" stroke-linecap="round" opacity=".5"/>`);
   k.text('~ Menu ~',750,150,28,{col:ck});k.text('Pupuccino',700,184,22,{col:ck,anchor:'start'});k.text('12',836,184,22,{col:'#FCE59A'});k.add(`<path d="M790 180h36" stroke="${ck}" stroke-width="1.2" stroke-dasharray="2 4"/>`);
   k.text('Doggy Donut',700,216,22,{col:ck,anchor:'start'});k.text('18',836,216,22,{col:'#FCE59A'});k.add(`<path d="M808 212h18" stroke="${ck}" stroke-width="1.2" stroke-dasharray="2 4"/>`);
   k.text('(dog-safe recipe!)',752,240,16,{col:'#FFC9D3',wt:600});k.text('one treat per pup per day',752,262,13,{col:'#C9EBDA',wt:600});
   k.add(`<path d="M668 176h20l-3 14h-14zM688 178q6 0 5 6" fill="none" stroke="${ck}" stroke-width="1.6"/><ellipse cx="678" cy="211" rx="11" ry="7" fill="none" stroke="${ck}" stroke-width="1.6"/><ellipse cx="678" cy="211" rx="3" ry="2" fill="none" stroke="${ck}" stroke-width="1.2"/>`);
   k.line([[612,282],[632,250]],1.2,C.graph,{op:.6})}
  // "employee of the month" (it is a dog)
  {k.shape(RC(892,112,88,104),'#E1B987',{w:2.1});k.shape(RC(900,120,72,70),'#FFFFFF',{w:1.3,one:1});
   k.add(`<g stroke="#2a2420" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M912 172q14 -12 30 -2q4 10 -6 14q-14 3 -24 -4z" fill="#F7E1A8"/><circle cx="946" cy="158" r="9" fill="#F7E1A8"/><path d="M940 150l-3 -8M952 150l3 -8"/></g><circle cx="948" cy="157" r="1.8" fill="#2a2420"/>`);O.sparkle(k,964,132,5);
   k.text('employee',936,203,13);k.text('of the month',936,214,11,{wt:600})}
  // hanging plant (right corner)
  k.line([[956,0],[956,44]],1.4);k.shape([[938,44],[974,44],[968,66],[944,66]],C.roof,{w:1.7});[[930,80],[944,92],[970,88],[982,74],[958,98]].forEach(([x,y],i)=>{k.line([[956,60],[x,y]],1.2,'#6FAE5C');k.shape(E(x,y,6,10,8,i),C.leaf,{w:1.2,one:1})});
  // big potted plant behind the bowl spot
  plant(k,262,404,1.1);
  // the counter (right decor zone, data-hot="cafe-menu")
  {const g=k.cap(()=>{
    k.shape(RC(626,388,234,128),'#D9A77C',{w:2.3,hatch:{side:.8,gap:5,col:'#BF8B60',op:.45}});for(let x=646;x<850;x+=26)k.line([[x,394],[x+k.J(1),512]],1.2,'#BF8B60');
    k.shape(RC(616,374,254,16),'#F3E2C8',{w:2.1});
    k.shape(RC(684,420,118,40),'#FFFBF3',{w:1.6,one:1});k.text('order here!',743,446,19);k.add(`<g fill="${C.pink}"><ellipse cx="664" cy="452" rx="6" ry="5"/><circle cx="657" cy="443" r="2.4"/><circle cx="663" cy="439" r="2.4"/><circle cx="670" cy="443" r="2.4"/></g>`);
    // espresso machine
    k.shape(RC(636,316,64,58),'#C9D3DD',{w:2.1,hatch:{side:.7,gap:4,col:'#9AA7B8',op:.5}});k.shape(RC(630,308,76,10),'#9AA7B8',{w:1.7});k.add(`<circle cx="668" cy="332" r="8" fill="#FFFBF3" stroke="${C.ink}" stroke-width="1.4"/><path d="M668 332l4 -5" stroke="${C.ink}" stroke-width="1.3"/><path d="M660 350h16v6h-16z" fill="${C.ink}"/>`);mug(k,668,374,'#FFFFFF');steam(k,664,300);
    // donut dome
    k.shape(E(792,372,34,6,12),'#FFFFFF',{w:1.5});donut(k,780,364,.9,'#FFB3C7');donut(k,804,366,.9,C.lav);donut(k,792,354,.9,'#F7E1A8');
    k.add(`<path d="M758 370q2 -44 34 -46q32 2 34 46" fill="#E4F2FA" fill-opacity=".35" stroke="${C.ink}" stroke-width="1.8"/><circle cx="792" cy="322" r="4" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.3"/><path d="M770 360q2 -20 14 -28" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/>`);
    // the menu tent card + tip jar
    k.shape([[722,374],[732,344],[756,344],[766,374]],C.yellow,{w:1.6,one:1});k.text('menu',744,366,14);
    k.shape([[838,374],[836,342],[862,342],[860,374]],C.glass,{w:1.5,one:1});k.text('tips',849,364,12);k.add(`<circle cx="845" cy="370" r="3" fill="#F7C65E" stroke="${C.ink}"/><circle cx="853" cy="368" r="3" fill="#F7C65E" stroke="${C.ink}"/>`);
    });
   hot(k,'data-hot','cafe-menu','Café counter and menu',RC(610,300,264,222),g)}
  // pup corner by the counter: a small bed and a water bowl
  k.shape(E(934,530,52,16,14),'#E8A9B8',{w:2.1,hatch:{side:.55,gap:4.5,col:'#C9839A',op:.5}});k.shape(E(934,524,38,9,12),'#FCE6CC',{w:1.6});k.add(`<g fill="${C.pink}" opacity=".85"><ellipse cx="934" cy="542" rx="4" ry="3"/><circle cx="929" cy="537" r="1.6"/><circle cx="934" cy="535" r="1.6"/><circle cx="939" cy="537" r="1.6"/></g>`);
  k.shape([[870,556],[908,556],[902,542],[876,542]],C.blue,{w:1.8});k.fill(E(889,543,13,3,10),C.water,{dx:0,dy:0});k.text('H2O',889,555,10,{wt:700});
  k.shape(RC(892,250,82,28),'#FFFFFF',{w:1.5,one:1});k.text('pups welcome!',933,269,15);O.heart(k,970,250,5);
  O.sparkle(k,610,64,6);O.note(k,210,60,11);
  O.tape(k,6,18,90,-26,'#F7B9C6');O.tape(k,920,576,80,-24,'#B9D4F3');
}

// ---------- Dog Park ----------
function sqDogpark(k){
  k.skyD(()=>{skyBand(k,1000,380);O.sun(k,150,78,30);O.cloud(k,420,66,24);O.cloud(k,760,96,20);O.bird(k,560,74,8);O.bird(k,584,86,6)},
    {W:1000,H:390,sun:[150,78,30],low:[160,280,34],moon:[160,80,26],clouds:[[420,66,24],[760,100,20],[300,140,16]],rainC:[[600,40,28],[920,60,24],[60,140,22]],birds:[[560,74,8],[584,86,6]],stars:44});
  k.jp(()=>jpFujiDraw(k,jpSpot('dogpark')));// v2.8
  k.ny(()=>nyKites(k,[[690,140,.9,0,640,350],[880,196,.8,1,840,350]]));// v2.8 New Year: kites over the far hills
  const hl=[[0,330],[160,306],[360,324],[560,298],[760,318],[1000,300],[1000,410],[0,410]];k.fill(hl,'#DCEDC4',{dx:0,dy:0,sc:0});k.pen(hl.slice(0,6),false,{w:1.6,col:C.graph});
  for(let x=30;x<1000;x+=74){const y=330+k.J(6);k.line([[x,y+8],[x,y+22]],1.4,C.trunkD);k.shape(E(x,y,16+k.r()*5,13+k.r()*3,10),'#C3DFA5',{w:1.3,lcol:C.graph,one:1})}
  const lawn=[[0,404],[1000,398],[1000,600],[0,600]];k.fill(lawn,C.grass,{dx:0,dy:0,sc:0});
  [[470,588,130,20],[800,578,100,18],[120,470,90,14]].forEach(q=>k.fill(E(q[0],q[1],q[2],q[3],12),C.grass2,{op:.7}));
  // a mowed stripe pattern
  hatchBand(k,404,600,'#B4D98E',.35,22);
  // the fence across the back with a gate and the sign
  {const yb=414,yt=356;k.shape(RC(0,yt+12,1000,7),C.woodD,{w:1.6,one:1});k.shape(RC(0,yb-26,1000,7),C.woodD,{w:1.6,one:1});
   for(let x=-4;x<1000;x+=20){if(x>470&&x<540)continue;k.line([[x,yb],[x+k.J(1),yt+4]],2.2,C.wood);}
   let d='';for(let x=-4;x<1000;x+=20){if(x>470&&x<540)continue;d+=`M${x-1} ${yb}V${yt+4}`}k.add(`<path d="${d}" stroke="${C.ink}" stroke-width=".9" opacity=".5" transform="translate(2 0)"/>`);
   for(let x=-10;x<1010;x+=120){if(x>440&&x<560)continue;k.shape(RC(x-4,yt-6,10,yb-yt+6),C.woodD,{w:1.6,one:1});k.add(`<circle cx="${x+1}" cy="${yt-8}" r="4" fill="${C.woodD}" stroke="${C.ink}" stroke-width="1.2"/>`)}
   // gate posts + an arch sign
   [466,546].forEach(x=>k.shape(RC(x-6,yt-40,12,yb-yt+40),C.woodD,{w:1.8}));k.line([[478,yb-4],[478,yt+6],[534,yt+6],[534,yb-4]],2,C.ink,{op:.6});k.line([[478,yt+6],[534,yb-4]],1.6,C.ink,{op:.5});
   const sg=[[430,yt-82],[582,yt-82],[586,yt-40],[426,yt-40]];k.shape(sg,C.wood,{w:2.2,hatch:{side:.8,gap:4,col:C.woodD,op:.4}});k.text('Dog Park',506,yt-52,32,{rot:-2});k.add(`<g fill="${C.pink}"><ellipse cx="444" cy="${yt-58}" rx="5" ry="4"/><circle cx="439" cy="${yt-65}" r="2"/><circle cx="444" cy="${yt-68}" r="2"/><circle cx="449" cy="${yt-65}" r="2"/></g>`);
   if(k.so==='winter')k.ss(()=>{frostLine(k,[[0,yt+12],[466,yt+12]]);frostLine(k,[[546,yt+12],[1000,yt+12]]);frostLine(k,[[428,yt-82],[584,yt-82]])});// v2.5
   if(k.env.snow)k.side(()=>{capLine(k,[[0,yt+4],[470,yt+4]],5);capLine(k,[[540,yt+4],[1000,yt+4]],5);capLine(k,[[424,yt-82],[588,yt-82]],7)});
   k.lt(()=>{ltString(k,scallop([[-10,yt-6],[110,yt-6],[230,yt-6],[350,yt-6],[460,yt-14]],8),22);ltString(k,scallop([[552,yt-14],[590,yt-6],[710,yt-6],[830,yt-6],[950,yt-6],[1010,yt-6]],8),22)});// v2.8 Winter Lights: bulbs from post to post
   k.ny(()=>nyShime(k,506,yt-38,.9))}// v2.8 New Year: a shimekazari under the gate sign
  // a big tree behind the fence (right) and the rules sign
  O.tree(k,880,408,1.3,{fruit:'#F49090'});
  {const x=700,gy=410;k.line([[x,gy],[x,gy-62]],3.4,C.ink);k.shape(RC(x-50,gy-110,100,54),'#FFFFFF',{w:1.9});k.text('Park rules:',x,gy-92,15);k.text('1. sniff',x-2,gy-78,13,{wt:600});k.text('2. see rule 1',x,gy-64,13,{wt:600});if(k.env.snow)k.side(()=>capLine(k,[[x-52,gy-110],[x+52,gy-110]],5))}
  // benches along the fence
  O.bench(k,300,418,.8);O.bench(k,620,416,.72);
  tufts(k,420,598,110);
  k.ss(()=>seasonGround(k,[0,422,1000,598],110,[[630,420,856,520],[30,470,220,480]]));// v2.5
  k.fx(()=>hubFx(k,{sheen:[424,598],puddles:[[450,580,46,9],[760,568,38,8],[920,440,30,6],[90,580,34,7]],patches:[[450,580,72,13],[760,570,60,11],[130,440,50,8],[900,440,46,8],[300,596,44,8],[960,580,40,8]],flies:[[200,470],[600,480],[880,560],[470,584],[150,380],[760,300]]}));
  // agility: A-frame (back left), weave poles, hoop (behind the dog), tunnel (decor zone), tyre hoop (front right)
  {const a=[[50,476],[130,382],[210,476]];k.shape(a,C.red,{w:2.3,hatch:{side:.55,gap:5,col:C.redD,op:.5}});k.fill([[78,442],[182,442],[166,422],[94,422]],C.yellow,{op:.95,dx:0,dy:0});k.pen(a,true,{w:2.3});
   for(let t=.2;t<.95;t+=.15){const y=476-94*t;k.line([[50+80*t,y],[50+80*t+6,y+2]],1.4,C.ink,{op:.7});k.line([[210-80*t,y],[210-80*t-6,y+2]],1.4,C.ink,{op:.7})}
   k.line([[50,476],[210,476]],1.2,C.graph,{op:.6});if(k.env.snow)k.side(()=>capLine(k,[[48,476],[130,380],[212,476]],6))}
  {let x=372;for(let i=0;i<6;i++){k.line([[x,424],[x+k.J(1),376]],3.2,i%2?C.red:'#FFFFFF');k.line([[x+1.6,424],[x+1.6,376]],1,C.ink,{op:.6});x+=26}k.line([[366,424],[508,424]],2.6,C.ink)}
  {const hx=926,gy=548;k.line([[hx-40,gy],[hx-40,gy-80]],3.4,C.ink);k.line([[hx+40,gy],[hx+40,gy-80]],3.4,C.ink);k.add(`<ellipse cx="${hx}" cy="${gy-80}" rx="30" ry="30" fill="none" stroke="${C.ink}" stroke-width="7"/><ellipse cx="${hx}" cy="${gy-80}" rx="30" ry="30" fill="none" stroke="${C.yellow}" stroke-width="4" stroke-dasharray="12 8"/>`);k.line([[hx-40,gy-80],[hx-30,gy-80]],2.4);k.line([[hx+30,gy-80],[hx+40,gy-80]],2.4);[[hx-48,gy],[hx+32,gy]].forEach(([x,y])=>k.line([[x,y],[x+16,y]],3,C.ink))}
  {// fabric tunnel with rings
   const p=[[640,510],[642,452],[668,430],[720,424],[790,432],[838,452],[850,500],[846,512]];k.shape(p,C.blue,{w:2.3,hatch:{side:.5,gap:5,col:'#8FAFD6',op:.6}});
   for(let x=664;x<850;x+=30){const t=(x-640)/210;k.line([[x,430+Math.abs(t-.5)*30-6],[x+4,512]],2.2,'#FFFFFF',{op:.85});k.line([[x+2,432+Math.abs(t-.5)*30-6],[x+6,512]],1,C.ink,{op:.55})}
   k.shape(E(642,482,18,30,12),'#4A5874',{w:2.2});k.add(`<ellipse cx="642" cy="482" rx="18" ry="30" fill="none" stroke="${C.red}" stroke-width="4"/>`);
   k.add(`<path d="M640 470q2 -10 4 0" stroke="#fff" stroke-width="1.6" fill="none"/>`);k.text('wheee',790,420,16,{rot:-6});
   if(k.env.snow)k.side(()=>capLine(k,p.slice(1,7),8))}
  // dog water fountain (front left)
  {const x=60,gy=574;k.shape([[x-12,gy],[x-10,gy-70],[x+10,gy-70],[x+12,gy]],'#B9D3F2',{w:2,hatch:{side:.6,gap:4,col:'#8FAFD6',op:.6}});k.shape(E(x,gy-72,26,7,12),'#9AA7B8',{w:1.8});k.add(`<path d="M${x+4} ${gy-78}q10 -14 18 -2" fill="none" stroke="#9CCDE8" stroke-width="3" stroke-linecap="round"/>`);
   k.shape([[x+10,gy],[x+52,gy],[x+46,gy-14],[x+16,gy-14]],'#9AA7B8',{w:1.8});k.fill(E(x+31,gy-13,14,3,10),C.water,{dx:0,dy:0});k.text('drinks',x,gy+20,14)}
  // a forgotten ball and a frisbee on the grass
  k.shape(E(590,560,10,10,10),'#E9F59B',{w:1.6});k.add(`<path d="M582 556q8 6 16 0" fill="none" stroke="#fff" stroke-width="1.6"/>`);k.shape(E(210,590,20,6,12),C.pink,{w:1.6});
  fl(k,[[600,590,C.red],[880,590,C.yellow],[270,560,C.lav],[984,520,'#FFB3C7'],[14,500,C.yellow]]);
  O.sparkle(k,640,200,7);O.heart(k,330,170,6);O.note(k,250,230,11);
  O.tape(k,6,26,90,-24,'#F7B9C6');O.tape(k,930,566,80,-28,'#BDE7D2');
  k.ss(()=>{seasonDrift(k,[[820,250,1],[700,300,.9],[960,330,.85],[420,250,.9],[250,300,.8]]);if(k.so==='winter'&&!k.env.night)robin(k,180,368,1.1,1);if(k.so==='spring'&&!k.env.night&&!k.env.rain)butterfly(k,560,330,1,'#F9C6D4')});// v2.5
}

// ---------- Vet Clinic (indoors) ----------
function sqVet(k){
  k.add(`<rect width="1000" height="404" fill="#E6F3EF"/>`);let wp='';for(let y=40;y<290;y+=60)for(let x=40+((y/60)%2)*50;x<1000;x+=100)wp+=`<path d="M${x-5} ${y}h10M${x} ${y-5}v10" stroke="#CDE6DE" stroke-width="3" stroke-linecap="round"/>`;k.add(wp);
  k.add(`<rect y="296" width="1000" height="108" fill="#CFE7E0"/>`);k.shape(RC(0,290,1000,10),'#FFFFFF',{w:1.7,one:1});k.add(`<path d="M0 330h1000" stroke="#B7D8CE" stroke-width="2" stroke-dasharray="1 12" stroke-linecap="round"/>`);
  k.add(`<rect y="404" width="1000" height="196" fill="#EEF2F4"/>`);let ft='';for(let y=404;y<600;y+=36)ft+=`M0 ${y}h1000`;for(let y=404,r=0;y<600;y+=36,r++)for(let x=(r%2)*40;x<1000;x+=80)ft+=`M${x} ${y}v36`;k.add(`<path d="${ft}" stroke="#D3DCE2" stroke-width="1.2"/>`);
  k.shape(RC(0,398,1000,10),'#BCD9CF',{w:2});
  // window with blinds half up
  winIn(k,44,96,180,160,{curtain:C.mint});{let d='';for(let y=100;y<150;y+=8)d+=`M44 ${y}h180`;k.add(`<rect x="44" y="96" width="180" height="56" fill="#F3EEE4" opacity=".92"/><path d="${d}" stroke="#D8CDBD" stroke-width="1.4"/>`);k.line([[44,152],[224,152]],2.4);k.line([[200,152],[204,190]],1.2)}
  // clock
  k.shape(E(560,70,24,24,16),'#FFFFFF',{w:2.2});k.add(`<path d="M560 70v-14M560 70l10 6" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`);k.text('(time for a treat)',560,110,13,{wt:600});
  // posters
  poster(k,286,120,170,128,-2,(x,y,w,h)=>{k.text("Brush your dog's",x+w/2,y+26,18);k.text('teeth!',x+w/2,y+46,22,{col:'#D2475B'});
    const tx=x+52,ty=y+92;k.shape([[tx-18,ty-22],[tx+18,ty-22],[tx+20,ty-6],[tx+14,ty+22],[tx+6,ty+22],[tx+2,ty+6],[tx-2,ty+6],[tx-6,ty+22],[tx-14,ty+22],[tx-20,ty-6]],'#FFFFFF',{w:1.9});
    k.add(`<circle cx="${tx-7}" cy="${ty-10}" r="1.8" fill="${C.ink}"/><circle cx="${tx+7}" cy="${ty-10}" r="1.8" fill="${C.ink}"/><path d="M${tx-5} ${ty-3}q5 5 10 0" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);O.sparkle(k,tx+24,ty-20,5);
    k.line([[x+92,y+110],[x+150,y+68]],4,C.blue);k.shape(RC(x+142,y+58,14,12),'#FFFFFF',{w:1.2,one:1});k.add(`<path d="M${x+144} ${y+58}v-6M${x+149} ${y+58}v-7M${x+154} ${y+58}v-6" stroke="${C.ink}" stroke-width="1.2"/>`)});
  poster(k,478,132,100,104,3,(x,y,w,h)=>{k.text('Drink',x+w/2,y+24,18);k.text('water!',x+w/2,y+42,18);k.shape([[x+50,y+52],[x+64,y+76],[x+60,y+90],[x+40,y+90],[x+36,y+76]],C.water,{w:1.6,one:1});k.add(`<circle cx="${x+45}" cy="${y+78}" r="1.4" fill="${C.ink}"/><circle cx="${x+55}" cy="${y+78}" r="1.4" fill="${C.ink}"/>`)});
  // waiting bench along the back wall (behind the dog)
  {k.line([[316,346],[316,372]],3,C.ink);k.line([[534,346],[534,372]],3,C.ink);k.shape(RC(300,370,250,12),C.wood,{w:1.9});k.shape(RC(300,318,250,30),C.wood,{w:1.9,hatch:{side:.8,gap:4,col:C.woodD,op:.4}});[312,538].forEach(x=>k.line([[x,382],[x,404]],3.4,C.ink));
   k.shape(RC(474,354,40,16),'#FFD8E0',{w:1.2,one:1});k.text('Bark Digest',494,366,9,{wt:700});k.shape([[340,370],[344,358],[372,356],[376,368]],C.yellow,{w:1.4,one:1})}
  // scale (front left)
  {k.shape(RC(40,520,150,16),'#C9D3DD',{w:2});k.shape(RC(48,510,134,12),'#E4E9EE',{w:1.6,one:1});k.line([[176,512],[176,452]],3.4,C.ink);
   k.shape(E(176,438,24,24,16),'#FFFFFF',{w:2.1});for(let i=0;i<7;i++){const a=Math.PI*(1.1+i*.13);k.line([[176+Math.cos(a)*16,438+Math.sin(a)*16],[176+Math.cos(a)*20,438+Math.sin(a)*20]],1.2)}k.add(`<path d="M176 438l13 -9" stroke="#D2475B" stroke-width="2" stroke-linecap="round"/>`);
   k.text('weigh-in',114,560,17);k.text('(no tummy sucking)',114,576,12,{wt:600})}
  // tall plant behind the bowl spot
  plant(k,256,404,1.1,C.blue);
  // exam room door
  {k.shape(RC(890,150,94,250),'#FFFFFF',{w:2.3,hatch:{side:.8,gap:5,col:'#D3DCE2',op:.6}});k.shape(RC(906,170,62,46),C.glass,{w:1.6});k.add(`<circle cx="972" cy="290" r="3.4" fill="${C.ink}"/>`);
   k.shape(RC(898,232,78,26),C.mint,{w:1.5,one:1});k.text('Exam room',937,250,15);k.add(`<g fill="${C.pink}"><ellipse cx="937" cy="300" rx="7" ry="6"/><circle cx="929" cy="290" r="2.6"/><circle cx="935" cy="286" r="2.6"/><circle cx="941" cy="286" r="2.6"/><circle cx="947" cy="290" r="2.6"/></g>`)}
  // ceiling lights
  [[420,1],[770,1]].forEach(([x])=>{k.line([[x,0],[x,46]],1.4);const sh=[[x-34,76],[x+34,76],[x+22,46],[x-22,46]];k.shape(sh,'#FFFBF3',{w:2});k.add(`<path d="M${x-30} 76q30 10 60 0" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);if(k.env.lit)k.lamps.push({x,y:82,s:1.2,glass:sh,big:1})});
  // reception desk (right decor zone, data-hot="vet-desk")
  {const g=k.cap(()=>{
    k.add(`<path d="M690 236L700 286M830 236L820 286" stroke="${C.ink}" stroke-width="1.2"/>`);k.shape(RC(676,260,168,34),'#FFFFFF',{w:2});k.text('Reception',760,284,22);
    k.shape(RC(630,394,228,122),C.wall3,{w:2.3,hatch:{side:.8,gap:5,col:'#A9C7E8',op:.5}});k.shape(RC(620,380,248,16),'#F3EEE4',{w:2.1});
    {const hx=744,hy=446;k.shape([[hx,hy+22],[hx-26,hy-2],[hx-22,hy-16],[hx-10,hy-20],[hx,hy-10],[hx+10,hy-20],[hx+22,hy-16],[hx+26,hy-2]],'#F7B2B2',{w:1.9});k.add(`<path d="M${hx-8} ${hy-2}h16M${hx} ${hy-10}v16" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>`)}
    // monitor with a happy heartbeat
    k.shape(RC(646,322,66,50),'#E4E9EE',{w:2});k.shape(RC(652,328,54,36),'#4A5874',{w:1.4,one:1});k.add(`<path d="M655 348h12l4 -10 5 18 4 -8h18" fill="none" stroke="#9CE6B4" stroke-width="2" stroke-linejoin="round"/>`);k.shape(RC(668,372,22,8),'#C9D3DD',{w:1.4,one:1});
    // bell, treat jar, clipboard
    k.shape([[730,380],[732,368],[748,364],[764,368],[766,380]],'#F7C65E',{w:1.6,one:1});k.add(`<circle cx="748" cy="361" r="3" fill="#F7C65E" stroke="${C.ink}" stroke-width="1.2"/>`);k.text('ding!',754,350,13,{rot:8});
    k.shape([[788,380],[786,338],[826,338],[824,380]],C.glass,{w:1.6});k.shape(RC(784,330,44,10),C.pink,{w:1.4,one:1});k.text('good',806,358,12);k.text('patient',806,370,11);k.add(`<path d="M796 376h8M812 374h8" stroke="#C9A07A" stroke-width="4" stroke-linecap="round"/>`);
    k.shape(RC(836,352,24,30),'#E1B987',{w:1.4,one:1});k.shape(RC(839,358,18,22),'#FFFFFF',{noline:1,dx:0,dy:0});k.add(`<path d="M842 364h12M842 370h10M842 376h8" stroke="${C.graph}" stroke-width="1"/>`)});
   hot(k,'data-hot','vet-desk','Vet reception desk',RC(612,250,262,272),g)}
  // a stethoscope doodle and a little sign by the desk
  k.shape(RC(872,420,110,30),'#FFFFFF',{w:1.5,one:1});k.text('check-ups daily',927,440,14);
  O.sparkle(k,240,60,6);O.heart(k,640,90,6);
  O.tape(k,6,18,90,-26,'#BDE7D2');O.tape(k,920,576,80,-24,'#F7B9C6');
}

// ---------- Grooming Salon (indoors) ----------
function sqSalon(k){
  k.add(`<rect width="1000" height="404" fill="#FBE3EA"/>`);let bb='';for(let i=0;i<34;i++){const x=k.r()*1000,y=20+k.r()*260,r=4+k.r()*9;bb+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(r)}" fill="none" stroke="#F4C3D2" stroke-width="1.6"/><path d="M${R1(x-r*.4)} ${R1(y-r*.4)}q2 -2 4 -2" stroke="#FFFFFF" stroke-width="1.4" fill="none"/>`}k.add(bb);
  // tiled wainscot
  k.add(`<rect y="296" width="1000" height="108" fill="#FFFFFF"/>`);let tl='';for(let x=0;x<=1000;x+=24)tl+=`M${x} 296v108`;for(let y=296;y<=404;y+=24)tl+=`M0 ${y}h1000`;k.add(`<path d="${tl}" stroke="#E7D6E8" stroke-width="1.2"/>`);k.shape(RC(0,290,1000,10),'#E8A9C4',{w:1.8,one:1});
  // checkered floor
  k.add(`<rect y="404" width="1000" height="196" fill="#FBF4FF"/>`);let ft='';for(let y=404,r=0;y<600;y+=33,r++)for(let x=(r%2)*48;x<1000;x+=96)ft+=`<rect x="${x}" y="${y}" width="48" height="33" fill="#DCCBF2" opacity=".7"/>`;k.add(ft);
  k.shape(RC(0,398,1000,10),'#D9B7E6',{w:2});
  // garland of bows
  {const pt=t=>[t*1000,24+Math.sin(Math.PI*t*4)*10];const L=[];for(let i=0;i<=40;i++)L.push(pt(i/40));k.line(L,1.3);for(let i=1;i<14;i++){const p=pt(i/14);bow(k,p[0],p[1]+6,.75,BOWC[i%6])}}
  // tub station (back left)
  {k.add(`<rect x="22" y="160" width="236" height="140" fill="#D9EEF7"/>`);let t2='';for(let x=22;x<=258;x+=20)t2+=`M${x} 160v140`;for(let y=160;y<=300;y+=20)t2+=`M22 ${y}h236`;k.add(`<path d="${t2}" stroke="#B9D6E6" stroke-width="1.2"/>`);
   k.shape(RC(30,206,220,10),'#FFFFFF',{w:1.6,one:1});[[52,C.mint,1],[78,C.pink,1],[104,C.yellow,1],[214,C.lav,1]].forEach(([x,c])=>bottle(k,x,206,.8,c,1));
   k.line([[150,160],[150,196],[178,214]],3.4,'#9AA7B8');k.shape(E(182,218,9,5,10,.6),'#C9D3DD',{w:1.6,one:1});k.line([[150,196],[136,280]],2.6,'#9AA7B8');
   const tub=[[30,322],[250,322],[240,376],[220,392],[60,392],[40,376]];k.shape(tub,'#FFFFFF',{w:2.4,hatch:{side:.72,gap:5,col:'#C9D3DD',op:.6}});k.shape(RC(22,314,236,12),'#EEF2F4',{w:2,one:1});
   [[62,392],[218,392]].forEach(([x,y])=>{k.line([[x,y],[x-4,y+12]],4,'#F7C65E');k.add(`<circle cx="${x-5}" cy="${y+12}" r="4" fill="#F7C65E" stroke="${C.ink}" stroke-width="1.2"/>`)});
   let bs='';[[54,306,14],[80,300,18],[110,304,15],[140,298,19],[172,304,14],[200,306,12],[228,308,10],[96,288,11],[156,284,12],[124,282,9]].forEach(([x,y,r])=>bs+=`<circle cx="${x}" cy="${y}" r="${r}" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.5"/><path d="M${x-r*.45} ${y-r*.3}q${R1(r*.2)} ${R1(-r*.3)} ${R1(r*.5)} ${R1(-r*.3)}" stroke="#B9D6E6" stroke-width="1.4" fill="none"/>`);k.add(bs);
   {const dx=222,dy=290;k.shape(E(dx,dy,12,8,10),C.yellow,{w:1.5,one:1});k.shape(E(dx+9,dy-9,6,6,8),C.yellow,{w:1.4,one:1});k.add(`<path d="M${dx+14} ${dy-9}l6 1 -6 2z" fill="${C.orange}" stroke="${C.ink}" stroke-width=".8"/><circle cx="${dx+10}" cy="${dy-10}" r="1.1" fill="${C.ink}"/>`)}
   k.text('bath time',140,370,20,{rot:-2})}
  // vanity mirror with bulbs
  {const mx=420,my=190;k.shape(E(mx,my,96,78,22),'#E1B987',{w:2.4,hatch:{side:.7,gap:5,col:'#BF9767',op:.4}});k.shape(E(mx,my,80,64,20),'#E4F2FA',{w:1.8});
   k.add(`<path d="M${mx-40} ${my+30}l40 -60M${mx-20} ${my+40}l26 -40" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".85"/>`);k.text('you look',mx+20,my+18,16,{col:'#D58AA4'});k.text('pawsome',mx+24,my+36,16,{col:'#D58AA4'});
   for(let i=0;i<10;i++){const a=Math.PI*(1.05+i*.1),bx=mx+Math.cos(a)*92,by=my+Math.sin(a)*74;k.add(`<circle cx="${R1(bx)}" cy="${R1(by)}" r="6" fill="#FFF3C2" stroke="${C.ink}" stroke-width="1.3"/>`);if(k.env.lit)k.bulbs.push([bx,by,'#FFF3C2'])}
   k.shape(RC(mx-80,my+80,160,10),'#E1B987',{w:1.8});bottle(k,mx-50,my+80,.7,C.mint,1);bottle(k,mx-30,my+80,.6,C.pink,1);k.add(`<path d="M${mx+20} ${my+78}h40" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/><path d="M${mx+24} ${my+78}v-6M${mx+30} ${my+78}v-6M${mx+36} ${my+78}v-6M${mx+42} ${my+78}v-6M${mx+48} ${my+78}v-6M${mx+54} ${my+78}v-6" stroke="${C.ink}" stroke-width="1.4"/>`)}
  // "Fresh & Fluffy" sign
  k.shape(RC(330,66,180,32),'#FFFFFF',{w:1.8,one:1});k.text('Fresh &amp; Fluffy',420,90,24,{col:'#C95C86'});O.sparkle(k,322,66,6);O.sparkle(k,518,96,5,C.pink);
  // window (top right, shows the real sky)
  winIn(k,880,96,96,110,{curtain:'#FFC9D3'});
  // shelf of bottles and a jar of bows above the grooming table
  {k.shape(RC(632,234,232,10),C.woodD,{w:1.8});const lab=[['Fluff',C.mint],['Shine',C.yellow],['Bubbles',C.blue],['Calm',C.lav]];lab.forEach(([t,c],i)=>{const x=656+i*36;bottle(k,x,234,.95,c,1);k.text(t,x,226,8.5,{wt:700})});
   k.shape([[804,234],[802,192],[846,192],[844,234]],C.glass,{w:1.6});k.shape(RC(800,186,48,8),C.pink,{w:1.3,one:1});[[812,212,C.pink],[832,206,C.yellow],[822,224,C.mint]].forEach(([x,y,c])=>bow(k,x,y,.5,c));
   // rolled towels
   [[644,276],[676,276],[708,276]].forEach(([x,y],i)=>{k.shape(E(x,y,14,12,12),[C.mint,'#FFD8E0',C.lav][i],{w:1.5,one:1});k.add(`<path d="M${x} ${y}m-5 0a5 4 0 1 0 10 0a5 4 0 1 0 -10 0" fill="none" stroke="${C.ink}" stroke-width="1.1"/>`)});k.shape(RC(628,286,104,8),C.woodD,{w:1.5,one:1})}
  // pendant lamp over the table
  pendant(k,770,120,'#F7C5CF',.85);
  // the grooming table (right decor zone, data-hot="salon-chair")
  {const g=k.cap(()=>{
    k.line([[660,516],[820,446]],3.4,'#9AA7B8');k.line([[820,516],[660,446]],3.4,'#9AA7B8');k.add(`<circle cx="740" cy="481" r="4" fill="#C9D3DD" stroke="${C.ink}" stroke-width="1.4"/>`);
    [[656,516],[824,516]].forEach(([x,y])=>k.shape(E(x,y,12,4,8),C.ink,{noline:1,dx:0,dy:0}));
    k.shape(RC(632,428,216,18),'#C9D3DD',{w:2.2});k.shape(RC(640,418,200,12),C.lav,{w:1.8,hatch:{gap:5,col:'#B9A6DA',op:.6}});
    // grooming arm with a pink loop
    k.line([[830,420],[830,312],[748,312]],4,'#9AA7B8');k.add(`<circle cx="830" cy="312" r="4" fill="#C9D3DD" stroke="${C.ink}" stroke-width="1.3"/>`);k.line([[756,312],[752,340],[744,354],[758,360],[766,346],[760,320]],2,C.pink);bow(k,758,318,.6,C.pink);
    // tools on the table: comb, brush, scissors
    k.shape(RC(654,404,40,8),'#FFFFFF',{w:1.4,one:1});k.add(`<path d="M658 404v-6M664 404v-6M670 404v-6M676 404v-6M682 404v-6M688 404v-6" stroke="${C.ink}" stroke-width="1.2"/>`);
    k.shape(E(784,410,18,7,10),C.pink,{w:1.5,one:1});k.line([[800,410],[818,404]],3,C.ink);k.add(`<path d="M772 404v-5M778 404v-6M784 404v-6M790 404v-5" stroke="${C.ink}" stroke-width="1.1"/>`);
    k.add(`<g transform="rotate(-18 724 404)"><circle cx="712" cy="408" r="5" fill="none" stroke="${C.ink}" stroke-width="2"/><circle cx="712" cy="398" r="5" fill="none" stroke="${C.ink}" stroke-width="2"/><path d="M716 405l22 -6M716 401l22 2" stroke="#9AA7B8" stroke-width="2.4" stroke-linecap="round"/></g>`);
    k.text('pampering station',740,540,16,{wt:600});});
   hot(k,'data-hot','salon-chair','Grooming table',RC(620,296,252,256),g)}
  // the fluffy bonnet dryer (right of the table), puffing fluff
  {const x=930,gy=560;k.shape(E(x,gy,34,9,12),'#9AA7B8',{w:1.9});k.line([[x,gy],[x,gy-200]],4,'#9AA7B8');
   const hood=[[x-50,gy-206],[x-46,gy-246],[x-18,gy-268],[x+18,gy-268],[x+42,gy-246],[x+44,gy-206]];k.shape(hood,C.lav,{w:2.3,hatch:{side:.6,gap:5,col:'#B9A6DA',op:.6}});k.shape(E(x-3,gy-206,48,10,14),'#B9A6DA',{w:1.8});
   k.add(`<circle cx="${x+30}" cy="${gy-232}" r="4" fill="${C.red}" stroke="${C.ink}" stroke-width="1.2"/>`);k.text('FLUFF-O-MATIC',x-2,gy-180,11,{wt:700});
   [[x-62,gy-220,10],[x-76,gy-236,7],[x+56,gy-222,9],[x+64,gy-244,6],[x-58,gy-198,6]].forEach(([fx,fy,r])=>k.shape(blobP(fx,fy,r,r*.8,k.r,7,.35),'#FFFFFF',{w:1.3,one:1}));
   k.add(`<path d="M${x-70} ${gy-210}q-8 -4 -14 0M${x+62} ${gy-206}q8 -4 14 0" fill="none" stroke="${C.graph}" stroke-width="1.4"/>`)}
  // plant behind the bowl spot + a towel basket
  plant(k,280,404,.9,C.mint);
  k.shape([[30,560],[34,520],[110,520],[114,560]],'#E1B987',{w:1.9,hatch:{gap:5,col:'#BF9767',op:.5}});k.shape(E(72,516,40,10,12),'#FFD8E0',{w:1.6,one:1});k.shape(E(64,508,24,8,10),C.mint,{w:1.4,one:1});
  O.sparkle(k,600,140,7);O.heart(k,560,250,6);
  O.tape(k,6,18,90,-26,'#F7B9C6');O.tape(k,920,576,80,-24,'#B9D4F3');
}

// ---------- Hilltop Meadow ----------
function sqHilltop(k){
  k.skyD(()=>{skyBand(k,1000,250);O.sun(k,880,70,30);O.cloud(k,540,70,24);O.cloud(k,860,170,16);O.bird(k,720,96,8);O.bird(k,742,108,6)},
    {W:1000,H:270,sun:[880,70,30],low:[640,224,34],moon:[880,72,26],clouds:[[540,70,24],[860,170,16],[100,170,16]],rainC:[[240,40,26],[700,30,28],[980,90,22]],birds:[[720,96,8],[742,108,6]],stars:48});
  k.jp(()=>jpFujiDraw(k,jpSpot('hilltop')));// v2.8: over the far coast haze
  // the far coast and the sea haze
  k.fill([[0,236],[1000,228],[1000,262],[0,262]],'#CFE4EC',{dx:0,dy:0,sc:0});k.pen([[0,236],[500,232],[1000,228]],false,{w:1.3,col:C.graph});
  const fh=[[0,250],[140,238],[300,252],[420,244],[600,256],[800,240],[1000,250],[1000,420],[0,420]];k.fill(fh,'#D8EAC2',{dx:0,dy:0,sc:0});k.pen(fh.slice(0,7),false,{w:1.4,col:C.graph});
  // patchwork fields
  [[[40,280],[180,268],[200,300],[60,312]],[[220,300],[340,290],[352,322],[230,330]],[[700,286],[860,276],[880,306],[716,316]],[[880,300],[1000,292],[1000,330],[892,334]],[[60,330],[200,320],[214,354],[70,362]]].forEach((p,i)=>{k.fill(p,['#C9E3A6','#E8E2B0','#BFDDA0','#E6D7A8','#CFE8B4'][i],{dx:0,dy:0,op:.9});k.line(p.concat([p[0]]),1,C.graph,{op:.6})});
  // the river winding down to the sea
  {const rv=[[0,318],[120,326],[260,346],[400,340],[520,352],[660,338],[800,322],[920,300],[1000,290]];const top=rv.map(p=>[p[0],p[1]-6]),bot=rv.map(p=>[p[0],p[1]+6]).reverse();k.fill(top.concat(bot),C.water,{dx:0,dy:0});k.line(top,1.3,C.ink,{op:.7});k.line(bot.slice().reverse(),1.3,C.ink,{op:.7});
   k.shape([[500,338],[540,334],[540,342],[500,346]],C.wood,{w:1.2,one:1});k.line([[506,336],[506,344]],1);k.line([[534,334],[534,342]],1)}
  // the tiny town (with the square's clock tower and the far lighthouse)
  {const hs=[[388,300,.7,C.wall,C.roof],[420,292,.62,C.wall2,C.roofD],[448,304,.74,C.wall3,C.roof],[476,296,.6,C.wall4,C.red],[560,302,.72,C.wall,C.roofD],[590,292,.6,C.wall2,C.roof],[620,304,.7,C.wall3,C.red],[650,296,.62,C.wall,C.roof],[680,306,.68,C.wall4,C.roofD],[366,316,.6,C.wall3,C.roof],[700,318,.6,C.wall2,C.roof],[430,320,.66,C.wall,C.red],[600,322,.64,C.wall4,C.roofD]];
   hs.forEach(([x,y,s,w,r])=>{mHouse(k,x,y,s,w,r);tinyLit(k,x+4*s,y-4*s)});
   mOut(k,RC(514,262,16,40),C.stone);mOut(k,[[510,264],[522,248],[534,264]],C.roof);k.add(`<circle cx="522" cy="272" r="4" fill="#FFFBF3" stroke="${C.ink}" stroke-width="1"/>`);tinyLit(k,522,272);
   [[340,300],[540,316],[720,300],[410,334],[660,334]].forEach(([x,y])=>mTree(k,x,y,.55,C.leaf2));
   mOut(k,[[944,246],[952,206],[960,206],[968,246]],'#FFFFFF');k.add(`<path d="M946 236h20M949 222h14" stroke="${C.red}" stroke-width="3"/>`);mOut(k,RC(948,198,16,10),C.yellow);
   if(k.env.lit)k.xl.push(`<circle cx="956" cy="203" r="16" fill="#FFE27A" opacity="${R1(.35*k.env.lit)}"/><path d="M956 203L1010 186L1010 214Z" fill="#FFE9A0" opacity="${R1(.3*k.env.lit)}"/>`);
   if(k.env.snow)k.side(()=>{let d='';hs.forEach(([x,y,s])=>{d+=`M${R1(x-17*s)} ${R1(y-12*s)}L${R1(x)} ${R1(y-27*s)}L${R1(x+17*s)} ${R1(y-12*s)}`});k.add(`<path d="${d}" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`)})}
  // the meadow hill (foreground)
  const hill=[[0,398],[180,388],[400,400],[620,396],[820,384],[1000,372],[1000,600],[0,600]];k.fill(hill,C.grass,{dx:0,dy:0,sc:0});k.pen(hill.slice(0,6),false,{w:2.2});
  [[160,470,120,18],[520,590,140,20],[860,560,110,18]].forEach(q=>k.fill(E(q[0],q[1],q[2],q[3],12),C.grass2,{op:.7}));
  // wind swooshes in the grass and the sky
  {let d='';[[90,440],[560,420],[880,450],[300,580],[700,570]].forEach(([x,y])=>{d+=`M${x} ${y}q20 -10 40 0t40 0`});k.add(`<path d="${d}" fill="none" stroke="${C.grassD}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`);
   let s='';[[140,110],[380,190],[640,150],[280,60]].forEach(([x,y])=>{s+=`M${x} ${y}q30 -12 60 0q14 6 4 14q-8 4 -10 -4`});k.add(`<path d="${s}" fill="none" stroke="${C.graph}" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>`)}
  tufts(k,410,598,120);
  k.ss(()=>seasonGround(k,[0,400,1000,598],110,[[616,420,864,524],[30,400,160,530]]));// v2.5
  k.fx(()=>hubFx(k,{sheen:[414,598],puddles:[[450,580,44,9],[760,560,38,8],[120,560,34,7]],patches:[[450,582,70,13],[760,562,60,11],[120,562,50,9],[300,420,50,8],[960,420,40,8],[600,420,50,8]],flies:[[200,470],[600,476],[880,560],[470,584],[160,420],[760,430]]}));
  // the lone tree, leaning with the wind
  k.add('<g transform="rotate(5 910 474)">');O.tree(k,910,474,1.35,{col:C.leaf2});k.add('</g>');
  // kites (strings run down to somebody off the page)
  kite(k,250,120,1.2,C.red,C.yellow,-12,[262,290]);boneKite(k,600,96,1,[742,296]);kite(k,110,210,.8,C.mint,C.lav,8,[214,288]);
  [[262,290,C.red],[214,288,C.blue],[742,296,C.yellow]].forEach(([x,y,c])=>{k.add(`<path d="M${x} ${y}v8M${x} ${y+8}l-3 6M${x} ${y+8}l3 6M${x} ${y+3}l4 -4" stroke="${C.ink}" stroke-width="1.4" stroke-linecap="round"/><circle cx="${x}" cy="${y-2}" r="2.6" fill="#F6D3B5" stroke="${C.ink}" stroke-width="1"/><path d="M${x-2} ${y+2}h4v5h-4z" fill="${c}"/>`)});
  // bench in the decor zone, facing the view
  O.bench(k,742,506,1.25);k.shape(RC(704,438,40,24),'#E1B987',{w:1.6,hatch:{gap:4,col:'#BF9767',op:.5}});k.add(`<path d="M708 438q16 -18 32 0" fill="none" stroke="${C.ink}" stroke-width="1.8"/>`);k.shape([[712,438],[740,438],[736,432],[716,432]],'#F7B2B2',{w:1,one:1,noline:1});
  // signpost and wildflowers
  signpost(k,96,520,'Hilltop Meadow',150);
  k.lt(()=>{ltString(k,sagP(856,368,966,374,16,10),20);ltString(k,sagP(872,330,950,336,10,8),20);ltString(k,sagP(680,418,804,418,5,10),20)});// v2.8 Winter Lights: bulbs in the lone tree and along the bench back
  k.ny(()=>{nyShime(k,96,454,.9);nyKites(k,[[780,180,.9,0,820,300],[468,62,.8,1,520,300]])});// v2.8 New Year: a shimekazari on the signpost, two paper kites
  fl(k,[[40,560,C.red],[70,590,C.yellow],[180,580,C.lav],[600,588,'#FFB3C7'],[640,560,C.yellow],[880,590,C.red],[960,560,C.lav],[990,520,C.yellow],[200,448,C.red],[580,440,C.lav],[880,520,'#FFB3C7'],[270,590,C.yellow],[230,430,C.yellow]],5);
  O.sparkle(k,440,200,7);O.heart(k,820,250,6);O.note(k,380,60,11);
  O.tape(k,6,26,90,-24,'#F7B9C6');O.tape(k,930,566,80,-28,'#BDE7D2');
  k.ss(()=>{seasonDrift(k,[[860,300,1],[780,250,.9],[700,330,.85],[460,270,.8],[350,340,.9]]);if(k.so==='spring'&&!k.env.night&&!k.env.rain){butterfly(k,330,440,1);butterfly(k,620,470,.85,'#F9C6D4')}});// v2.5
}

// ---------- Lighthouse Pier ----------
function sqPier(k){
  k.skyD(()=>{skyBand(k,1000,264);O.sun(k,860,70,30);O.cloud(k,420,64,24);O.cloud(k,700,110,18)},
    {W:1000,H:274,sun:[860,70,30],low:[640,250,36],moon:[860,74,26],clouds:[[420,64,24],[700,112,18],[960,170,16]],rainC:[[260,40,28],[580,30,26],[900,60,24]],birds:[],stars:44});
  k.jp(()=>jpFujiDraw(k,jpSpot('pier')));// v2.8: over the sea, the sea hides its foot
  // the sea
  k.add(`<rect y="262" width="1000" height="150" fill="${C.water}"/><rect y="262" width="1000" height="24" fill="#A9D3EC" opacity=".7"/>`);k.pen([[0,263],[500,262],[1000,263]],false,{w:1.6,col:C.graph});
  let wv='';for(let i=0;i<44;i++){const x=k.r()*980,y=276+k.r()*120;wv+=`M${R1(x)} ${R1(y)}q7 -6 14 0t14 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`);
  k.jp(()=>jpFujiReflect(k,jpSpot('pier'),263));// v2.8: a faint reflection in calm water by day
  k.fx(()=>{if(k.env.rain)ripples(k,0,1000,272,400,26);waterGlints(k,k.env.night?860:640,274,398)});
  // flying gulls (not at night or in rain)
  {const gs=k.cap(()=>{[[300,120,10],[330,104,8],[760,170,9]].forEach(([x,y,s])=>O.bird(k,x,y,s))});if(!k.env.night&&!k.env.rain)k.add(gs)}
  // the lighthouse on its rocks
  {const x=150;k.shape(blobP(x,330,88,24,k.r,10,.25).map(p=>[p[0],Math.min(p[1],342)]),C.stone,{w:2,hatch:{side:.5,gap:4,col:C.stoneD,op:.6}});
   k.shape(blobP(x+70,338,30,12,k.r,8,.3).map(p=>[p[0],Math.min(p[1],344)]),C.stoneD,{w:1.8});
   const tw=[[x-34,322],[x-22,104],[x+22,104],[x+34,322]];k.fill(tw,'#FFFFFF');
   [[150,186],[234,270]].forEach(([a,b])=>{const wa=34-(322-a)/218*12,wb=34-(322-b)/218*12;k.fill([[x-wb,b],[x-wa,a],[x+wa,a],[x+wb,b]].map(([px,py])=>[px,py]),C.red,{dx:0,dy:0,op:.95})});
   k.hatch(tw,{side:.62,gap:4.5,col:'#C9A9A9',op:.5});k.pen(tw,true,{w:2.3});
   O.window(k,x-8,210,16,20,{noLit:1});k.shape(RC(x-12,288,24,34),'#C79A72',{w:1.8});
   k.shape(RC(x-34,96,68,10),C.ink,{w:1.6,one:1,noline:1,dx:0,dy:0});k.line([[x-34,96],[x+34,96]],2.2);for(let i=0;i<=6;i++)k.line([[x-32+i*10.6,96],[x-32+i*10.6,82]],1.4);k.line([[x-34,82],[x+34,82]],1.8);
   const lg=[[x-18,82],[x+18,82],[x+18,52],[x-18,52]];k.shape(lg,C.yellow,{w:2});k.line([[x,52],[x,82]],1.2);k.shape([[x-26,54],[x,26],[x+26,54]],C.red,{w:2.1});k.add(`<circle cx="${x}" cy="24" r="4" fill="${C.ink}"/>`);
   if(k.env.lit){k.lamps.push({x,y:67,s:1.1,glass:lg});const b1=beamGrad(k,x+18,x+330),b2=beamGrad(k,x-18,x-200);k.xl.push(`<path d="M${x+18} 60L${x+330} 22L${x+330} 116Z" fill="url(#${b1})" opacity="${R1(k.env.lit)}"/><path d="M${x-18} 60L${x-200} 34L${x-200} 96Z" fill="url(#${b2})" opacity="${R1(.7*k.env.lit)}"/>`)}
   if(k.env.snow)k.side(()=>{capLine(k,[[x-28,54],[x,25],[x+28,54]],7);capLine(k,[[x-36,96],[x+36,96]],4)})}
  // boats and the buoy
  {const bx=560,by=300;k.shape([[bx-40,by],[bx+40,by],[bx+30,by+14],[bx-30,by+14]],C.red,{w:1.9});k.line([[bx,by],[bx,by-70]],1.8);k.shape([[bx+2,by-66],[bx+36,by-6],[bx+2,by-6]],'#FFFFFF',{w:1.6,one:1});k.shape([[bx-2,by-56],[bx-30,by-6],[bx-2,by-6]],'#FFD8E0',{w:1.6,one:1});k.shape([[bx,by-70],[bx+14,by-66],[bx,by-62]],C.yellow,{w:1,one:1})}
  {const bx=330,by=340;k.shape([[bx-56,by],[bx+60,by-4],[bx+44,by+22],[bx-46,by+22]],'#B9D3F2',{w:2,hatch:{side:.6,gap:4,col:'#8FAFD6',op:.6}});k.shape(RC(bx-30,by-30,40,28),'#FFFFFF',{w:1.8});O.window(k,bx-22,by-24,14,12,{noLit:1});k.line([[bx+24,by-4],[bx+30,by-56],[bx+60,by-30]],1.6);k.text('Salty',bx,by+16,15);
   if(k.env.lit)k.glows.push([bx-22,by-24,14,12]);if(k.env.snow)k.side(()=>capLine(k,[[bx-32,by-30],[bx+12,by-30]],5))}
  {const x=470,y=356;k.shape([[x-12,y+6],[x-8,y-22],[x+8,y-22],[x+12,y+6]],'#FFFFFF',{w:1.8});k.fill(RC(x-10,y-14,20,8),C.red,{dx:0,dy:0});k.shape(E(x,y+6,18,5,10),C.red,{w:1.6});k.line([[x,y-22],[x,y-34]],1.6);k.add(`<circle cx="${x}" cy="${y-36}" r="4" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1.2"/>`);k.add(`<ellipse cx="${x}" cy="${y+10}" rx="26" ry="4" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>`)}
  // railing across the back of the boardwalk
  {k.shape(RC(0,392,1000,14),C.woodD,{w:1.8,one:1});const rt=346;
   for(let x=20;x<1000;x+=120){k.shape(RC(x-6,rt-8,12,402-rt+8),C.wood,{w:1.8,one:1,hatch:{gap:4,col:C.woodD,op:.5}})}
   k.shape(RC(0,rt,1000,9),C.wood,{w:1.9,one:1});k.shape(RC(0,rt+26,1000,7),C.wood,{w:1.7,one:1});
   let d='';for(let x=10;x<1000;x+=40)d+=`M${x} ${rt+10}v18`;k.add(`<path d="${d}" stroke="${C.woodD}" stroke-width="1.4"/>`);
   if(k.so==='winter')k.ss(()=>frostLine(k,[[0,rt+1],[1000,rt+1]]));else if(k.so==='spring')k.ss(()=>[80,380,500,620].forEach(x=>railBox(k,x,rt+10,46)));// v2.5
   if(k.env.snow)k.side(()=>capLine(k,[[0,rt],[1000,rt]],6));
   k.lt(()=>ltString(k,scallop([20,140,260,380,500,620,740,860,980].map(x=>[x,rt-7]),9),22));// v2.8 Winter Lights: bulbs along the rail
   // life ring on the rail (behind the dog area, left)
   const lx=260,ly=372;k.add(`<circle cx="${lx}" cy="${ly}" r="22" fill="none" stroke="${C.ink}" stroke-width="13"/><circle cx="${lx}" cy="${ly}" r="22" fill="none" stroke="#FFFFFF" stroke-width="10"/><circle cx="${lx}" cy="${ly}" r="22" fill="none" stroke="${C.red}" stroke-width="10" stroke-dasharray="17.3 17.3"/>`)}
  // the boardwalk deck in perspective
  {k.fill([[0,404],[1000,404],[1000,600],[0,600]],'#EBCDA4',{dx:0,dy:0,sc:0});const rows=[];let y=404,h=14;while(y<600){rows.push(y);y+=h;h*=1.12}
   let d='',f='';rows.forEach((yy,i)=>{d+=`M0 ${R1(yy+k.J(.8))}L1000 ${R1(yy+k.J(.8))}`;const nh=(rows[i+1]||600)-yy,sp=nh*9;for(let x=(i*137)%sp-sp;x<1000;x+=sp)d+=`M${R1(x)} ${R1(yy)}v${R1(nh)}`;if(i%2)f+=`<rect x="0" y="${R1(yy)}" width="1000" height="${R1(nh)}" fill="#E2BE90" opacity=".45"/>`;
     let nl='';for(let x=(i*61)%90+20;x<1000;x+=150)nl+=`<circle cx="${R1(x)}" cy="${R1(yy+nh/2)}" r="1.4" fill="${C.ink}" opacity=".55"/>`;f+=nl});
   k.add(f+`<path d="${d}" stroke="${C.woodD}" stroke-width="1.4" fill="none"/>`);k.pen([[0,405],[500,404],[1000,405]],false,{w:2})}
  k.ss(()=>{if(k.so==='winter')windLines(k,[[200,150,140],[560,200,150],[360,240,110],[760,120,130]]);else{seasonGround(k,[0,410,1000,598],k.so==='autumn'?50:30,[[630,370,900,520]],0,1);if(k.so==='autumn'){pumpkin(k,200,560,1.2);pumpkin(k,232,568,.9);pumpkin(k,178,574,.75)}}});// v2.5
  k.fx(()=>hubFx(k,{sheen:[410,598],puddles:[[450,580,44,9],[760,568,38,8],[120,470,30,6]],patches:[[450,582,70,12],[760,570,60,11],[120,470,46,8],[920,440,40,7],[300,596,44,8]]}));
  // lamp post on the pier
  O.lamp(k,588,412,1);
  k.ny(()=>{nyShime(k,588,334,.8);nyKites(k,[[720,96,.9,1,660,392],[880,146,.8,0,840,392]])});// v2.8 New Year: a shimekazari on the lamp post, kites over the sea
  // seagulls on posts: a piling front-left, one on the rail, one on a piling front-right
  [[34,600,456],[968,600,446]].forEach(([x,gy,top])=>{k.shape([[x-14,gy],[x-14,top],[x+14,top],[x+14,gy]],C.trunk,{w:2,hatch:{side:.55,gap:4,col:C.trunkD,op:.6}});k.shape(E(x,top,14,4,10),'#E7C79E',{w:1.6});k.line([[x-14,top+30],[x+14,top+34]],2.4,'#C9B48C')});
  gull(k,34,456,1);gull(k,968,446,1.05,1);gull(k,500,346,.8);
  k.text('no snacks pls!',946,500,13,{wt:600,rot:-4,halo:'#FFFBF3'});
  // crates, a leaning fishing rod and a bait bucket (right decor zone)
  crate(k,646,440,96,76,'FISH?');crate(k,748,456,86,60,'ROPE');crate(k,662,376,72,64,'NO');
  {const tip=[868,300];k.line([[812,516],tip],3,C.trunkD,{amp:.3});k.shape(E(820,486,8,8,10),'#9AA7B8',{w:1.4,one:1});k.line([[818,486],[828,480]],1.6);
   k.line([tip,[884,330],[900,380],[930,404]],1,C.graph,{op:.9});k.add(`<circle cx="930" cy="404" r="3.4" fill="${C.red}" stroke="${C.ink}" stroke-width="1"/>`)}
  {const x=870,gy=516;k.shape([[x-16,gy],[x-18,gy-30],[x+18,gy-30],[x+16,gy]],C.blue,{w:1.8});k.add(`<path d="M${x-18} ${gy-30}q18 -20 36 0" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);k.text('bait',x,gy-11,12);}
  // coiled rope
  {const x=110,y=556;k.add(`<ellipse cx="${x}" cy="${y}" rx="34" ry="11" fill="#E7C79E" stroke="${C.ink}" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="24" ry="7.5" fill="none" stroke="#B5875C" stroke-width="2"/><ellipse cx="${x}" cy="${y}" rx="13" ry="4" fill="none" stroke="#B5875C" stroke-width="2"/>`);k.line([[x+30,y+4],[x+60,y+14],[x+90,y+8]],3,'#B5875C')}
  O.sparkle(k,520,200,7);O.heart(k,700,220,6);
  O.tape(k,8,20,90,-26,'#F9E19A');O.tape(k,920,568,80,-24,'#D3C6F1');
  k.ss(()=>{seasonDrift(k,[[420,200,1],[640,240,.9],[300,300,.85],[880,330,.8]]);if(k.so==='winter'){windLines(k,[[400,470,120],[60,520,100]])}});// v2.5
}

/* ======================= WALK STRIPS ======================= */
const SKYW={
  town:{W:1200,H:240,sun:[1000,60,26],low:[990,190,30],moon:[1000,56,22],clouds:[[260,50,22],[640,72,18],[1110,40,18]],rainC:[[440,40,26],[860,52,26]],birds:[[420,80,8],[444,90,6]],stars:30},
  hilltop:{W:1200,H:250,sun:[880,70,30],low:[860,210,32],moon:[880,64,24],clouds:[[200,60,22],[560,96,18],[1080,56,20]],rainC:[[400,40,26],[780,48,26]],birds:[[640,86,8],[662,96,6]],stars:44},
  pier:{W:1200,H:190,sun:[700,64,28],low:[700,170,30],moon:[700,58,22],clouds:[[180,50,22],[520,80,18],[1000,46,20]],rainC:[[360,40,26],[820,56,24]],stars:36}};
const STRIPS_C={
 town(k){
  k.skyD(()=>k.add(`<rect width="1200" height="240" fill="${C.sky}" fill-opacity=".7"/>`),SKYW.town);
  k.jp(()=>{jpFujiDraw(k,jpSpot('strip:town'));jpDressDraw(k,'strip:town','far')});// v2.8: Fuji over the flower shop, telephone poles and wires (never across Fuji or the sun)
  // a row of shopfronts (no building crosses the seam)
  const shops=[[6,186,120,C.wall2,'Bakery',[C.red,'#fff'],C.lav],[204,196,96,C.wall3,'Books',[C.mint,'#fff'],C.yellow],[412,180,128,C.wall,'Flowers',[C.yellow,'#fff'],'#FFC9D3'],[604,192,104,C.wall4,'Toys',[C.lav,'#fff'],C.mint],[808,188,118,C.wall2,'Café',[C.blue,'#fff'],C.yellow],[1006,188,100,C.wall3,'Bikes',[C.red,'#fff'],'#FFC9D3']];
  shops.forEach(([x,w,top,wall,sign,awn,curt],i)=>shopF(k,x,w,top,300,{wall,sign,awn,curt,upper:2,brick:i%2,door:['#C79A72','#E8A9B8','#B9D3F2'][i%3]}));
  // sidewalk with slabs, curb and a bit of street at the bottom
  k.add(`<rect y="296" width="1200" height="78" fill="#EDE6DC"/>`);let sl='';for(let x=0;x<1200;x+=60)sl+=`M${x} 300v72`;sl+='M0 334h1200';k.add(`<path d="${sl}" stroke="#D3C9BC" stroke-width="1.3"/>`);
  k.edge(x=>300+per(x,[[1,6,.3]]),1.8);
  k.add(`<rect y="372" width="1200" height="8" fill="#D6CEC3"/><rect y="378" width="1200" height="22" fill="#CBC5BE"/>`);k.edge(x=>373+per(x,[[1,5,.6]]),2);
  let dsh='';for(let x=20;x<1200;x+=80)dsh+=`M${x} 392h40`;k.add(`<path d="${dsh}" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".85"/>`);
  let pb='';for(let i=0;i<30;i++){const x=(i*41)%1200+8,y=340+(i*17%28);pb+=`<ellipse cx="${x}" cy="${y}" rx="${2+(i%3)}" ry="1.4" fill="#D9CFC2"/>`}k.add(pb);
  // behind the path: trees in planters, lamp posts, parked bikes
  [[600],[1200]].forEach(([x])=>k.wrap(x,40,()=>planterTree(k,x,322,.9)));
  [[200],[800]].forEach(([x])=>k.wrap(x,24,()=>O.lamp(k,x,324,.88)));
  k.wrap(400,40,()=>{O.bush(k,400,324,.5,C.leaf2,C.leafD,'#F49090')});
  [[480,C.mint],[1100,C.red]].forEach(([x,c])=>k.wrap(x,50,()=>bike(k,x,320,.85,c)));
  k.fx(()=>stripFx(k,{y0:338,y1:370,kind:'path',ns:5,np:2,rx:26}));
  // v2: more street life. Appended after the original drawing so the base layout is untouched.
  // bunting along three cornices
  [[14,186,174],[418,586,160],[814,990,168]].forEach(([x0,x1,y],i)=>k.wrap((x0+x1)/2,(x1-x0)/2+6,()=>buntingL(k,x0,x1,y,5,[[C.red,C.yellow,C.mint,C.lav],[C.blue,C.red,C.yellow,'#FFB3C7'],[C.mint,C.lav,C.red,C.yellow]][i])));
  // two more lamp posts
  [[422,.88],[1040,.84]].forEach(([x,s])=>k.wrap(x,24,()=>O.lamp(k,x,326,s)));
  // benches, planters, a chalkboard, bikes
  k.wrap(330,30,()=>O.bench(k,330,332,.5));k.wrap(930,30,()=>O.bench(k,930,332,.5));
  [[140,40],[700,40],[1000,36]].forEach(([x,w])=>k.wrap(x,w/2+6,()=>planterBox(k,x,330,w)));
  k.wrap(1176,24,()=>planterBox(k,1176,330,36,[C.lav,'#FFB3C7',C.yellow,C.red]));
  k.wrap(372,20,()=>aBoard(k,372,332,'fresh!',1));k.wrap(788,20,()=>aBoard(k,788,330,'sale',.9));
  k.wrap(690,50,()=>bike(k,640,322,.8,C.yellow));
  // passers-by
  [[88,.8,'#D9CBEA',{hair:'#8A5A44',bag:C.yellow}],[560,.74,'#BFD9EE',{hair:'#3E3A4A',hat:'#F4A3A3',dir:-1}],[868,.5,'#FCE59A',{hair:'#5B3D32',balloon:C.red}],[880,.8,'#C9E4D1',{hair:'#7A5A48',dir:-1}],[1130,.76,'#F8C08A',{hair:'#4A3A34',bag:C.mint}]].forEach(([x,s,c,o])=>k.wrap(x,26,()=>walker(k,x,340+((x*7)%9),s,c,o)));
  k.wrap(560,10,()=>O.sparkle(k,560,96,7));k.wrap(160,10,()=>O.heart(k,160,80,6));
  k.ss(()=>{seasonGround(k,[0,338,1200,370],k.so==='winter'?30:44,[],1200,1);seasonDrift(k,[[300,230,1],[700,250,.9],[980,230,.85]],1200)});// v2.5
  k.hw(()=>hwStrip(k,[['hay',262,312,.9],['ghost',976,312,.85]],[[330,60,.8],[380,44,.6],[700,40,.65]]));// v2.6
  // v2.8 Winter Lights: bulbs under every cornice. New Year: a shimekazari over every shop door, a kite over the roofs
  k.lt(()=>shops.forEach(([x,w,top])=>k.wrap(x+w/2,w/2+8,()=>ltString(k,scallop([0,1,2,3,4].map(i=>[x+4+i*(w-8)/4,top+3]),4),20))));
  k.ny(()=>{shops.forEach(([x,w,top])=>{const dw=Math.min(46,w*.24),uw=Math.min(40,w/3.8),dx=x+w-dw-14+dw/2,gy=top+26+uw*1.1+8+38+34;k.wrap(dx,30,()=>nyShime(k,dx,gy+2,.7))});nyKites(k,[[300,30,.7,0,340,92]])});
 },
 hilltop(k){
  k.skyD(()=>k.add(`<rect width="1200" height="250" fill="${C.sky}" fill-opacity=".7"/>`),SKYW.hilltop);
  k.jp(()=>jpFujiDraw(k,jpSpot('strip:hilltop')));// v2.8
  // distant hills with the tiny town
  const far=x=>214+per(x,[[10,2,.4],[6,5,1.2]]);const fp=[];for(let x=0;x<=1200;x+=20)fp.push([x,far(x)]);k.add(`<path d="${smooth(fp,false)}L1200 340L0 340Z" fill="#DCEAC9"/>`);k.edge(far,1.3,C.graph);
  {const hs=[[300,.6,C.wall,C.roof],[324,.52,C.wall2,C.roofD],[348,.62,C.wall3,C.red],[372,.5,C.wall4,C.roof],[398,.58,C.wall,C.roofD],[338,.5,C.wall2,C.roof]];
   hs.forEach(([x,s,w,r],i)=>{const y=far(x)+8+(i===5?10:0);mHouse(k,x,y,s,w,r);tinyLit(k,x+3*s,y-4*s)});mOut(k,RC(358,far(358)-26,10,30),C.stone);mOut(k,[[355,far(358)-25],[363,far(358)-36],[371,far(358)-25]],C.roof);
   [[270],[430],[820],[860],[1000]].forEach(([x])=>mTree(k,x,far(x)+8,.6,C.leaf2))}
  // rolling grass hills
  const mid=x=>262+per(x,[[9,3,.8],[5,7,.2]]);const mp=[];for(let x=0;x<=1200;x+=20)mp.push([x,mid(x)]);k.add(`<path d="${smooth(mp,false)}L1200 340L0 340Z" fill="${C.grass}"/>`);k.edge(mid,1.8);
  {let d='';for(let i=0;i<14;i++){const x=(i*89)%1200+10,y=mid(x)+18+(i*13%30);d+=`M${x} ${y}q16 -8 32 0t32 0`}k.add(`<path d="${d}" fill="none" stroke="${C.grassD}" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>`)}
  k.fx(()=>stripFx(k,{y0:290,y1:326,kind:'grass',ns:6}));
  // two sheep on the hill (they do not care about the dog)
  [[520,1],[580,-1]].forEach(([x,f])=>k.wrap(x,24,()=>{const y=mid(x)+20;k.shape(blobP(x,y,18,11,k.r,9,.25),'#FFFFFF',{w:1.6,one:1});k.add(`<ellipse cx="${R1(x+16*f)}" cy="${R1(y-4)}" rx="6" ry="5" fill="${C.ink}"/><path d="M${x-8} ${R1(y+9)}v7M${x+8} ${R1(y+9)}v7" stroke="${C.ink}" stroke-width="2"/>`)}));
  // a lone tree and kites
  k.wrap(760,80,()=>{k.add('<g transform="rotate(4 760 300)">');O.tree(k,760,300,.9,{col:C.leaf2});k.add('</g>')});
  k.wrap(240,40,()=>kite(k,240,100,1,C.red,C.yellow,-10,[300,300]));k.wrap(980,60,()=>boneKite(k,980,120,.85,[930,300]));
  // wooden fence behind the path
  {const fx=[];for(let x=40;x<1200;x+=100)fx.push(x);fx.forEach(x=>k.wrap(x,10,()=>{k.shape(RC(x-5,284,10,44),C.wood,{w:1.7,one:1,hatch:{gap:4,col:C.woodD,op:.5}});if(k.so==='winter')k.ss(()=>frostLine(k,[[x-4,285],[x+4,285]]));if(k.env.snow)k.side(()=>capLine(k,[[x-6,284],[x+6,284]],4))}));
   [[292],[310]].forEach(([y])=>{k.add(`<rect y="${y}" width="1200" height="6" fill="${C.wood}"/>`);k.edge(x=>y+per(x,[[1,4,y]]),1.4);k.edge(x=>y+6+per(x,[[1,4,y]]),1.2)});
   if(k.so==='winter')k.ss(()=>{[[0,600],[600,1200]].forEach(([a,b])=>frostLine(k,[[a,292],[b,292]]))});// v2.5
   if(k.env.snow)k.side(()=>{[[0,600],[600,1200]].forEach(([a,b])=>capLine(k,[[a,292],[b,292]],4))})}
  [[90,C.red],[180,C.yellow],[420,C.lav],[560,'#FFB3C7'],[690,C.yellow],[880,C.red],[1060,C.lav],[1150,C.yellow]].forEach(([x,c])=>k.wrap(x,10,()=>O.flower(k,x,318,4.5,c)));
  k.jp(()=>jpDressDraw(k,'strip:hilltop','mid'));// v2.8: a jizo by the fence, a momiji in autumn
  k.lt(()=>{for(let x=40;x<1200;x+=100)k.wrap(x+50,58,()=>ltString(k,sagP(x,287,x+100,287,7,8),22))});// v2.8 Winter Lights: bulbs from post to post
  k.ny(()=>{k.wrap(440,24,()=>nyShime(k,440,300,.75));nyKites(k,[[700,70,.8,1,740,280]])});// v2.8 New Year
  // trail
  k.add(`<rect y="330" width="1200" height="70" fill="#E9D6B0"/>`);k.edge(x=>330+per(x,[[2,6,.5]]),2.2);
  let tf='';for(let x=14;x<1200;x+=40)tf+=`M${x} 330q1 -7 -1 -11M${x+5} 330q0 -8 3 -13`;k.add(`<path d="${tf}" fill="none" stroke="${C.grassD}" stroke-width="1.5" stroke-linecap="round"/>`);
  let pb='';for(let i=0;i<36;i++){const x=(i*37)%1200+4,y=348+(i*23%44);pb+=`<ellipse cx="${x}" cy="${y}" rx="${2+(i%3)}" ry="1.6" fill="#D2BC94"/>`}k.add(pb);
  k.fx(()=>{stripFx(k,{y0:338,y1:396,kind:'path',ns:5});if(k.env.night&&!k.env.rain)[[150,270],[460,250],[700,280],[980,262],[1120,290]].forEach(f=>k.flies.push(f))});
  k.wrap(620,10,()=>O.sparkle(k,620,150,7));
  k.ss(()=>{seasonGround(k,[0,338,1200,396],50,[],1200,1);seasonDrift(k,[[700,190,1],[820,240,.9],[400,200,.85],[1080,220,.8]],1200)});// v2.5
  k.hw(()=>hwStrip(k,[['jack',340,285,.75],['jack',740,285,.7],['jack',1040,285,.75],['hay',430,306,.9],['ghost',910,306,.85]],[[420,80,.8],[470,60,.6],[1100,90,.7]]));// v2.6
 },
 pier(k){
  k.skyD(()=>k.add(`<rect width="1200" height="190" fill="${C.sky}" fill-opacity=".75"/>`),SKYW.pier);
  k.jp(()=>jpFujiDraw(k,jpSpot('strip:pier')));// v2.8: over the sea
  k.add(`<rect y="182" width="1200" height="120" fill="${C.water}"/><rect y="182" width="1200" height="18" fill="#A9D3EC" opacity=".7"/>`);k.edge(x=>184+per(x,[[1,4,0]]),1.5,C.graph);
  let wv='';for(let i=0;i<34;i++){const x=(i*73)%1200,y=200+(i*29%80);wv+=`M${x} ${y}q7 -6 14 0t14 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`);
  k.fx(()=>{if(k.env.rain)ripples(k,0,1200,196,286,24,1200);waterGlints(k,SKYW.pier.moon[0],192,290)});
  {const bs=k.cap(()=>[[160,80],[420,60],[1000,96]].forEach(([x,y])=>k.wrap(x,12,()=>O.bird(k,x,y,10))));if(!k.env.night&&!k.env.rain)k.add(bs)}
  // the lighthouse far off on its rocks
  k.wrap(900,50,()=>{const x=900;k.shape(blobP(x,220,44,10,k.r,9,.3).map(p=>[p[0],Math.min(p[1],226)]),C.stone,{w:1.6});const tw=[[x-14,214],[x-9,108],[x+9,108],[x+14,214]];k.fill(tw,'#FFFFFF');k.fill([[x-12,180],[x-11,156],[x+11,156],[x+12,180]],C.red,{dx:0,dy:0});k.fill([[x-10,136],[x-9,118],[x+9,118],[x+10,136]],C.red,{dx:0,dy:0});k.pen(tw,true,{w:1.7});
   const lg=[[x-8,106],[x+8,106],[x+8,92],[x-8,92]];k.shape(lg,C.yellow,{w:1.5});k.shape([[x-12,93],[x,78],[x+12,93]],C.red,{w:1.6});
   if(k.env.lit){k.lamps.push({x,y:99,s:.6,glass:lg});}if(k.env.snow)k.side(()=>capLine(k,[[x-13,93],[x,77],[x+13,93]],4))});
  if(k.env.lit){const b=beamGrad(k,908,1160);k.xl.push(`<path d="M908 97L1160 64L1160 132Z" fill="url(#${b})" opacity="${R1(k.env.lit)}"/>`)}
  // boats and a buoy
  k.wrap(300,46,()=>{const bx=300,by=246;k.shape([[bx-36,by],[bx+36,by],[bx+28,by+12],[bx-28,by+12]],C.red,{w:1.7});k.line([[bx,by],[bx,by-56]],1.6);k.shape([[bx+2,by-52],[bx+30,by-4],[bx+2,by-4]],'#FFFFFF',{w:1.4,one:1});k.shape([[bx-2,by-44],[bx-24,by-4],[bx-2,by-4]],'#FFD8E0',{w:1.4,one:1})});
  k.wrap(620,56,()=>{const bx=620,by=270;k.shape([[bx-50,by],[bx+52,by-3],[bx+38,by+18],[bx-40,by+18]],'#B9D3F2',{w:1.8,hatch:{side:.6,gap:4,col:'#8FAFD6',op:.6}});k.shape(RC(bx-26,by-24,34,22),'#FFFFFF',{w:1.6});O.window(k,bx-19,by-19,12,10,{noLit:1});if(k.env.lit)k.glows.push([bx-19,by-19,12,10]);if(k.env.snow)k.side(()=>capLine(k,[[bx-28,by-24],[bx+10,by-24]],4))});
  k.wrap(1080,20,()=>{const x=1080,y=282;k.shape([[x-9,y+4],[x-6,y-16],[x+6,y-16],[x+9,y+4]],'#FFFFFF',{w:1.6});k.fill(RC(x-8,y-10,16,6),C.red,{dx:0,dy:0});k.shape(E(x,y+4,14,4,10),C.red,{w:1.4});k.add(`<circle cx="${x}" cy="${y-22}" r="3.4" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1.1"/>`);k.line([[x,y-16],[x,y-19]],1.4)});
  // back edge of the boardwalk and the railing behind the path
  k.add(`<rect y="298" width="1200" height="34" fill="#E2BE90"/>`);k.edge(x=>299+per(x,[[1,5,.2]]),1.8);
  {const rt=262;for(let x=75;x<1200;x+=150)k.wrap(x,10,()=>{k.shape(RC(x-5,rt-6,10,300-rt+6),C.wood,{w:1.7,one:1,hatch:{gap:4,col:C.woodD,op:.5}})});
   k.add(`<rect y="${rt}" width="1200" height="7" fill="${C.wood}"/><rect y="${rt+22}" width="1200" height="6" fill="${C.wood}"/>`);k.edge(x=>rt+per(x,[[.8,4,.1]]),1.5);k.edge(x=>rt+7+per(x,[[.8,4,.9]]),1.2);k.edge(x=>rt+22+per(x,[[.8,5,.4]]),1.3);k.edge(x=>rt+28+per(x,[[.8,3,.4]]),1.1);
   let bal='';for(let x=15;x<1200;x+=30)bal+=`M${x} ${rt+8}v14`;k.add(`<path d="${bal}" stroke="${C.woodD}" stroke-width="1.3"/>`);
   if(k.so==='winter')k.ss(()=>{[[0,600],[600,1200]].forEach(([a,b])=>frostLine(k,[[a,rt+1],[b,rt+1]]))});else if(k.so==='spring')k.ss(()=>[300,600,980].forEach(x=>k.wrap(x,22,()=>railBox(k,x,rt+9,30))));// v2.5
   if(k.env.snow)k.side(()=>{[[0,600],[600,1200]].forEach(([a,b])=>capLine(k,[[a,rt],[b,rt]],4))});
   k.lt(()=>{for(let x=75;x<1200;x+=150)k.wrap(x+75,82,()=>ltString(k,sagP(x,257,x+150,257,8,10),22))});// v2.8 Winter Lights: bulbs along the rail
   k.wrap(450,24,()=>{const lx=450,ly=284;k.add(`<circle cx="${lx}" cy="${ly}" r="16" fill="none" stroke="${C.ink}" stroke-width="10"/><circle cx="${lx}" cy="${ly}" r="16" fill="none" stroke="#FFFFFF" stroke-width="7.5"/><circle cx="${lx}" cy="${ly}" r="16" fill="none" stroke="${C.red}" stroke-width="7.5" stroke-dasharray="12.6 12.6"/>`)})}
  // seagull posts (taller pilings) behind the path
  [[180],[780]].forEach(([x])=>k.wrap(x,30,()=>{k.shape([[x-11,326],[x-11,234],[x+11,234],[x+11,326]],C.trunk,{w:1.8,hatch:{side:.55,gap:4,col:C.trunkD,op:.6}});k.shape(E(x,234,11,3.4,10),'#E7C79E',{w:1.4});k.line([[x-11,262],[x+11,265]],2,'#C9B48C');gull(k,x,234,.8,x>500)}));
  // planks as the walking ground
  k.add(`<rect y="330" width="1200" height="70" fill="#EBCDA4"/>`);k.edge(x=>331+per(x,[[1,6,.4]]),2.2);
  {let d='',f='';[[330,18],[348,24],[372,28]].forEach(([y,h],i)=>{d+=`M0 ${y+h}H1200`;const sp=[120,150,200][i];for(let x=(i*53)%sp;x<1200;x+=sp)d+=`M${x} ${y}v${h}`;if(i===1)f+=`<rect y="${y}" width="1200" height="${h}" fill="#E2BE90" opacity=".45"/>`;for(let x=(i*37)%100+30;x<1200;x+=150)f+=`<circle cx="${x}" cy="${y+h/2}" r="1.4" fill="${C.ink}" opacity=".5"/>`});k.add(f+`<path d="${d}" stroke="${C.woodD}" stroke-width="1.4"/>`)}
  {let d='';for(let x=0;x<1200;x+=100)d+=`M${x} 300v30`;k.add(`<path d="${d}" stroke="${C.woodD}" stroke-width="1.2"/>`)}
  k.fx(()=>stripFx(k,{y0:338,y1:396,kind:'path',ns:5}));
  k.wrap(560,10,()=>O.sparkle(k,560,130,7));
  k.ss(()=>{if(k.so==='winter')windLines(k,[[100,120,140],[480,150,150],[760,110,120],[260,230,110]]);else seasonGround(k,[0,338,1200,396],30,[],1200,1);seasonDrift(k,[[260,140,1],[640,120,.9],[980,160,.85]],1200)});// v2.5
  k.hw(()=>hwStrip(k,[['jack',375,257,.7],['jack',975,257,.7],['hay',560,312,.85],['ghost',1120,312,.85]],[[300,70,.8],[350,52,.6],[1000,50,.7]]));// v2.6
  k.ny(()=>{k.wrap(780,24,()=>nyShime(k,780,268,.7));nyKites(k,[[350,80,.85,0,300,300]])});// v2.8 New Year: a shimekazari on a piling, a kite over the sea
 }
};

/* ======================= v2.7 "Home & Pack": the Shelter Playroom (scene 'playroom') + props 'adoptboard' and 'tosstoy' =======================
   A cozy dog-café playroom. The layout is SR_ROOM (game/src/30_shelter.js): sign [370,10,260,64]; board [350,84,300,220] stays plain wallpaper
   (the game draws PawArt.prop('adoptboard') there); window [70,90,230,180] with the real sky; toy shelf [716,96,236,264]; toy basket
   [800,360,140,84] in <g data-hot="toys">; low café tables [214,392,120,48] (two water bowls) and [610,392,120,48] (the vase of the season's
   flowers); floor cushions at (170,560), (500,576), (850,562); floor band feet x 40..960, y 450..596 with nothing upright in it.
   Indoor treatment like the café (time tints, the window shows the weather). Night: the two sconces glow. Halloween: a smiling pumpkin on the
   toy shelf and paper bats in the window, nothing else. Every variant keeps the same base layout (time, weather and season extras run on the
   side and season streams, Halloween on its own). */
const PRF=430;// the floor line: wall above, boards below
const PR_BOARD=[350,84,300,220];
// soft wallpaper: wide pale stripes and a scatter of tiny bones and hearts, kept off the board, the window, the shelf and the sign
function prWall(k){
  k.add(`<rect width="1000" height="${PRF}" fill="#FBE6D3"/>`);
  let st='';for(let x=0;x<1000;x+=64)st+=`M${x+30} 0h24v364h-24z`;k.add(`<path d="${st}" fill="#F6DAC2" opacity=".55"/>`);
  const B=PR_BOARD,skip=(x,y)=>(x>B[0]-20&&x<B[0]+B[2]+20&&y>B[1]-16&&y<B[1]+B[3]+16)||(x>50&&x<322&&y>62&&y<296)||(x>700&&x<968&&y>84&&y<366)||(x>352&&x<648&&y<90)||(x>80&&x<214&&y>276);
  let bn='',ht='';
  for(let y=40,r=0;y<350;y+=48,r++)for(let x=r%2?22:54;x<1000;x+=64){if(skip(x,y))continue;const jx=x+k.J(3),jy=y+k.J(3);
    if((r+Math.round(x/64))%3===0)ht+=`M${R1(jx)} ${R1(jy+4)}c-6 -6 -3 -12 3 -8c6 -4 9 2 3 8l-3 3z`;
    else{const a=k.J(.5),c=Math.cos(a)*6,s=Math.sin(a)*6;bn+=`M${R1(jx-c)} ${R1(jy-s)}L${R1(jx+c)} ${R1(jy+s)}`;
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([u,v])=>{bn+=`M${R1(jx+u*c-v*s*.4+.01)} ${R1(jy+u*s+v*c*.4)}h.01`})}}
  k.add(`<path d="${ht}" fill="#F4C7CD" opacity=".75"/><path d="${bn}" fill="none" stroke="#EDCDB0" stroke-width="3.2" stroke-linecap="round"/>`);
  // painted beadboard below a chair rail, then the skirting
  k.add(`<rect y="366" width="1000" height="${PRF-366}" fill="#D9E8D2"/>`);let bd='';for(let x=10;x<1000;x+=18)bd+=`M${R1(x+k.J(.6))} 372V${PRF-12}`;
  k.add(`<path d="${bd}" stroke="#B8CFB2" stroke-width="1.4"/>`);k.add(`<rect y="368" width="1000" height="8" fill="#B8CFB2" opacity=".45"/>`);
  k.shape(RC(-4,358,1008,10),C.wood,{w:1.9,one:1});
}
// honey floorboards in gentle perspective, a soft shadow along the skirting
function prFloor(k){
  k.fill([[-6,PRF],[1006,PRF],[1006,606],[-6,606]],'#EED3AC',{dx:0,dy:0});
  const rows=[];let y=PRF+10,h=13;while(y<600){rows.push(y);y+=h;h*=1.14}
  let d='',f='',g='';rows.forEach(yy=>{d+=`M-4 ${R1(yy+k.J(.8))}L1004 ${R1(yy+k.J(.8))}`});
  for(let i=0;i<rows.length;i++){const ya=rows[i],yb=i+1<rows.length?rows[i+1]:600,sp=(yb-ya)*11,off=((i*37)%10)/10*sp;let px=null;
    for(let x=off-sp;x<1000+sp;x+=sp*(.8+k.r()*.45)){const xa=x,xb=x+(x-500)*.05;d+=`M${R1(xa)} ${R1(ya)}L${R1(xb)} ${R1(yb)}`;
      if(px!==null&&k.r()<.2)f+=`M${R1(px)} ${R1(ya+1)}L${R1(xa)} ${R1(ya+1)}L${R1(xb)} ${R1(yb-1)}L${R1(px+(px-500)*.05)} ${R1(yb-1)}Z`;
      if(k.r()<.35){const gx=xa+12+k.r()*Math.max(8,sp*.5),gy=ya+(yb-ya)*(.35+k.r()*.3);g+=`M${R1(gx)} ${R1(gy)}h${R1(10+k.r()*18)}`}px=xa}}
  k.add(`<path d="${f}" fill="#E4C193" opacity=".55"/><path d="${g}" stroke="#D9B48E" stroke-width="1.1" stroke-linecap="round" fill="none"/><path d="${d}" stroke="#C99F74" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".9"/>`);
  k.add(`<rect y="${PRF}" width="1000" height="9" fill="${C.ink}" opacity=".07"/>`);
  k.shape(RC(-4,PRF-13,1008,14),'#F3E2C8',{w:2,one:1});
}
// a flat floor cushion seen from a little above: puffy top, piping, a tuft button and corner tassels (a curled dog at 0.7 fits on it)
function prCushion(k,cx,cy,col){const cd=dk(col),lt=mixH(col,'#FFFFFF',.42);
  k.add(`<ellipse cx="${cx+4}" cy="${cy+9}" rx="84" ry="15" fill="${C.ink}" opacity=".1"/>`);
  k.shape(E(cx,cy,82,23,20),col,{w:2.2,hatch:{side:.5,gap:4.5,col:cd,op:.45}});
  k.fill(E(cx-3,cy-5,60,12,18),lt,{dx:0,dy:0,amp:.8});
  k.add(`<ellipse cx="${cx}" cy="${cy-1}" rx="71" ry="17" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="5 5" opacity=".95"/>`);
  k.add(`<path d="M${cx-16} ${cy-3}q16 5 32 0M${cx-5} ${cy-12}q5 9 10 0" fill="none" stroke="${cd}" stroke-width="1.3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy-4}" r="3.3" fill="${lt}" stroke="${C.ink}" stroke-width="1.3"/>`);
  [-1,1].forEach(sd=>{const tx=cx+sd*81,ty=cy+3;k.add(`<path d="M${tx} ${ty}l${sd*8} -4M${tx} ${ty}l${sd*9} 1M${tx} ${ty}l${sd*7} 6" stroke="${cd}" stroke-width="1.7" stroke-linecap="round"/><circle cx="${tx}" cy="${ty}" r="2.4" fill="${col}" stroke="${C.ink}" stroke-width="1.1"/>`)})}
// a scalloped valance over the window
function prValance(k,x,y,w,h,col){const n=7,p=[[x,y],[x+w,y]];for(let i=n;i>=0;i--){p.push([x+i*w/n,y+h-5]);if(i)p.push([x+(i-.5)*w/n,y+h+6])}
  k.shape(p,col,{w:2,hatch:{side:.7,gap:4,col:dk(col),op:.35}});let dt='';for(let i=0;i<n;i++)dt+=`<circle cx="${R1(x+(i+.5)*w/n)}" cy="${R1(y+h*.45)}" r="2.6" fill="#F28FA5" opacity=".8"/>`;k.add(dt);
  k.shape(RC(x-8,y-6,w+16,7),C.woodD,{w:1.6,one:1});k.add(`<circle cx="${x-10}" cy="${y-3}" r="4.4" fill="${C.wood}" stroke="${C.ink}" stroke-width="1.4"/><circle cx="${x+w+10}" cy="${y-3}" r="4.4" fill="${C.wood}" stroke="${C.ink}" stroke-width="1.4"/>`)}
// little round bulbs between the bunting flags (they glow after dark, like the old shelter string lights)
function prBulbs(k,x0,x1,y,sag){const n=Math.round((x1-x0)/36),cols=[C.yellow,'#FFB3C7',C.mint];let s='';
  for(let i=1;i<n;i++){const t=i/n,bx=R1(x0+(x1-x0)*t),by=R1(y+Math.sin(Math.PI*t)*sag+6),c=cols[i%3];s+=`<path d="M${bx} ${R1(by-6)}v3" stroke="${C.ink}" stroke-width="1.2"/><circle cx="${bx}" cy="${by}" r="4.4" fill="${c}" stroke="${C.ink}" stroke-width="1.2"/>`;if(k.env.lit)k.bulbs.push([bx,by,c])}k.add(s)}
// the painted shelter sign: a wooden plank on two strings, a paw and a heart
function prSign(k,x,y,w,h){
  k.line([[x+34,-4],[x+38,y+7]],1.3,C.ink,{op:.8});k.line([[x+w-34,-4],[x+w-38,y+7]],1.3,C.ink,{op:.8});
  k.add(`<rect x="${x+5}" y="${y+5}" width="${w}" height="${h}" rx="7" fill="${C.ink}" opacity=".09"/>`);
  k.shape([[x+5,y],[x+w-5,y],[x+w,y+6],[x+w,y+h-6],[x+w-5,y+h],[x+5,y+h],[x,y+h-6],[x,y+6]],C.wood,{w:2.4,hatch:{side:.84,gap:4.5,col:C.woodD,op:.45}});
  k.line([[x+8,y+h*.5],[x+w*.3,y+h*.5+1],[x+w-8,y+h*.5-1]],1,C.woodD,{op:.55});
  k.add(`<rect x="${x+8}" y="${y+7}" width="${w-16}" height="${h-14}" rx="6" fill="none" stroke="#FFFBF3" stroke-width="2" stroke-dasharray="7 5" opacity=".9"/><circle cx="${x+38}" cy="${y+7}" r="2.4" fill="${C.ink}"/><circle cx="${x+w-38}" cy="${y+7}" r="2.4" fill="${C.ink}"/>`);
  k.text('Doodle Doggo Shelter',x+w/2+1,y+h*.66,28,{rot:-1.5});
  const px=x+21,py=y+h*.52;k.add(`<g fill="${C.pink}" stroke="${C.ink}" stroke-width="1.1"><ellipse cx="${px}" cy="${py+3}" rx="5.6" ry="4.6"/><circle cx="${px-6}" cy="${py-4}" r="2.3"/><circle cx="${px-2}" cy="${py-8}" r="2.3"/><circle cx="${px+3}" cy="${py-8}" r="2.3"/><circle cx="${px+7}" cy="${py-4}" r="2.3"/></g>`);
  O.heart(k,x+w-19,y+h*.5,7)}
// the chalk menu by the window: "today: belly rubs"
function prChalk(k,x,y,w,h){
  k.line([[x+w*.28,y+2],[x+w/2,y-13],[x+w*.72,y+2]],1.2,C.ink,{op:.8});k.add(`<circle cx="${x+w/2}" cy="${y-13}" r="2.3" fill="${C.ink}"/>`);
  k.shape(RC(x,y,w,h),C.woodD,{w:2.1});k.shape(RC(x+7,y+7,w-14,h-14),'#56655F',{w:1.4,one:1});const ck='#FFFBF3';
  let sm='';for(let i=0;i<6;i++)sm+=`M${R1(x+12+k.r()*(w-40))} ${R1(y+12+k.r()*(h-26))}l${R1(8+k.r()*12)} ${R1(-2+k.r()*2)}`;k.add(`<path d="${sm}" stroke="#7F8F88" stroke-width="3" stroke-linecap="round" opacity=".45"/>`);
  k.text('today:',x+16,y+26,17,{col:ck,anchor:'start'});k.text('belly rubs',x+w/2,y+48,23,{col:'#FCE59A',rot:-2});
  k.text('(and ear scratches)',x+w/2,y+63,12,{col:'#C9EBDA',wt:600});
  k.add(`<path d="M${x+w-24} ${y+19}c-5 -5 -2.5 -10 2.5 -6.6c5 -3.4 7.5 1.6 2.5 6.6l-2.5 2.5z" fill="none" stroke="#FFC9D3" stroke-width="1.5"/>`)}
// a peg rail with three leads hanging on it
function prLeads(k,x,y,w){
  k.shape(RC(x,y,w,10),C.wood,{w:1.8,one:1});const cols=['#E57E83','#7FA8D8','#F3BE55'];
  cols.forEach((c,i)=>{const px=x+20+i*(w-40)/2,len=34+((i*13)%3)*6;
    const loop=smooth(E(px,y+17,6.5,12.5,12).map(q=>[q[0]+k.J(.5),q[1]+k.J(.5)]),true),
      lead=smooth(dense([[px,y+30],[px+k.J(2),y+30+len*.5],[px+k.J(3),y+30+len]],false,6),false);
    k.add(`<path d="${loop}${lead}" fill="none" stroke="${C.ink}" stroke-width="5.4" stroke-linecap="round"/><path d="${loop}${lead}" fill="none" stroke="${c}" stroke-width="3.1" stroke-linecap="round"/>`);
    k.add(`<rect x="${R1(px-3)}" y="${R1(y+28+len)}" width="6" height="9" rx="2" fill="#C9D3DD" stroke="${C.ink}" stroke-width="1.2"/><circle cx="${R1(px)}" cy="${y+5}" r="3.4" fill="${C.woodD}" stroke="${C.ink}" stroke-width="1.2"/>`)})}
// a little wall sconce (glows after dark)
function prSconce(k,x,y){k.shape(RC(x-6,y+4,12,22),C.woodD,{w:1.5,one:1});k.line([[x,y+14],[x+k.J(.5),y+1]],2.4,C.ink);
  const sh=[[x-8,y+2],[x+8,y+2],[x+15,y-20],[x-15,y-20]];k.shape(sh,'#FCE59A',{w:1.8,hatch:{side:.6,gap:3.5,col:dk('#FCE59A'),op:.4}});
  k.add(`<path d="M${x-12} ${y-14}h24" stroke="#F28FA5" stroke-width="1.6" stroke-dasharray="3 3"/>`);if(k.env.lit)k.lamps.push({x,y:y-9,s:.8,glass:sh})}
// a crude crayon dog (the joke: the photos are drawn by the dogs' new families)
function prCrayonDog(k,cx,cy,s,col,o={}){const f=o.flip?-1:1,X=v=>R1(cx+v*s*f),Y=v=>R1(cy+v*s);
  const body=`M${X(-14)} ${Y(2)}Q${X(-15)} ${Y(-9)} ${X(-2)} ${Y(-8)}Q${X(12)} ${Y(-10)} ${X(13)} ${Y(-1)}Q${X(13)} ${Y(8)} ${X(0)} ${Y(7)}Q${X(-14)} ${Y(9)} ${X(-14)} ${Y(2)}Z`;
  const sc=mixH(col,'#5B3D32',.25);let scr='';for(let i=0;i<5;i++)scr+=`M${X(-11+i*5)} ${Y(5)}L${X(-8+i*5)} ${Y(-6)}`;
  k.add(`<path d="${body}" fill="${col}" transform="translate(${R1(1.2*s)} ${R1(.8*s)})"/><path d="${scr}" stroke="${sc}" stroke-width="${R1(1.4*s)}" stroke-linecap="round" opacity=".6"/>`);
  k.add(`<g fill="none" stroke="#2a2420" stroke-width="${R1(Math.max(1.3,1.6*s))}" stroke-linecap="round" stroke-linejoin="round"><path d="${body}"/>`+
    `<path d="M${X(-10)} ${Y(6)}l${R1(-1*s*f)} ${R1(7*s)}M${X(-4)} ${Y(7)}l0 ${R1(7*s)}M${X(5)} ${Y(7)}l${R1(1*s*f)} ${R1(7*s)}M${X(10)} ${Y(5)}l${R1(2*s*f)} ${R1(7*s)}M${X(-14)} ${Y(-1)}q${R1(-5*s*f)} ${R1(-3*s)} ${R1(-6*s*f)} ${R1(-9*s)}"/>`+
    // the head (art review: it read as a cat): a snout bump with a dot nose, one floppy ear, one pointy ear and a tongue, still crude
    `<path d="M${X(18.5)} ${Y(-8)}l0 ${R1(4*s)}q${R1(1.6*s*f)} ${R1(2.4*s)} ${R1(3.2*s*f)} 0l0 ${R1(-4*s)}" fill="#F28FA5" stroke-width="${R1(Math.max(1,1.1*s))}"/>`+
    `<path d="M${X(16)} ${Y(-14.5)}Q${X(24)} ${Y(-15.5)} ${X(24)} ${Y(-11)}Q${X(24)} ${Y(-7)} ${X(16)} ${Y(-7.5)}" fill="${col}"/>`+
    `<circle cx="${X(12.5)}" cy="${Y(-11)}" r="${R1(7*s)}" fill="${col}"/><path d="M${X(15.5)} ${Y(-17)}l${R1(3*s*f)} ${R1(-6*s)}l${R1(1*s*f)} ${R1(7*s)}"/>`+
    `<path d="M${X(9.5)} ${Y(-17)}Q${X(3.5)} ${Y(-17)} ${X(4)} ${Y(-7)}Q${X(7.5)} ${Y(-6)} ${X(10)} ${Y(-12)}" fill="${mixH(col,'#5B3D32',.3)}"/>`+
    `<path d="M${X(17)} ${Y(-8.5)}q${R1(2.5*s*f)} ${R1(1.2*s)} ${R1(6*s*f)} ${R1(-.6*s)}"/></g><circle cx="${X(15)}" cy="${Y(-12.5)}" r="${R1(1.3*s)}" fill="#2a2420"/><circle cx="${X(23.6)}" cy="${Y(-12.2)}" r="${R1(1.9*s)}" fill="#2a2420"/>`)}
// a taped polaroid of an adopted dog, with a caption
function prPhoto(k,x,y,w,h,rot,bg,dog,cap,flip){k.add(`<g transform="rotate(${rot} ${R1(x+w/2)} ${R1(y+h/2)})">`);
  k.add(`<rect x="${x+3}" y="${y+4}" width="${w}" height="${h}" fill="${C.ink}" opacity=".1"/>`);k.shape(RC(x,y,w,h),'#FFFFFF',{w:1.6,one:1});
  k.add(`<rect x="${x+4}" y="${y+4}" width="${w-8}" height="${h-17}" fill="${bg}"/>`);k.pen(RC(x+4,y+4,w-8,h-17),true,{w:1,one:1,amp:.4});
  prCrayonDog(k,x+w/2-4,y+(h-13)/2+3,(w-8)/42,dog,{flip});
  if(cap)k.text(cap,x+w/2,y+h-4,11,{wt:700});k.add('</g>');
  k.add(`<g transform="rotate(${rot-4} ${R1(x+w/2)} ${y})"><rect x="${R1(x+w/2-10)}" y="${y-5}" width="20" height="9" fill="#F7B9C6" fill-opacity=".8"/></g>`)}
// a low café table: round top seen from a little above, two front legs and one at the back
function prTable(k,x,y,w,h){const cx=x+w/2;
  k.add(`<ellipse cx="${cx}" cy="${y+h-1}" rx="${w/2+6}" ry="4.5" fill="${C.ink}" opacity=".1"/>`);
  k.line([[cx+2,y+14],[cx+3,y+h-7]],2.6,C.ink,{op:.5});
  k.line([[x+16,y+17],[x+10,y+h]],3.4,C.ink);k.line([[x+w-16,y+17],[x+w-10,y+h]],3.4,C.ink);
  k.shape([[x,y+9],[x+w,y+9],[x+w-2,y+19],[x+2,y+19]],'#E9C9A2',{w:1.8,one:1,hatch:{side:.7,gap:3.5,col:C.woodD,op:.4}});
  k.shape(E(cx,y+9,w/2,10,18),'#FFFBF3',{w:2})}
function prBowl(k,x,gy,col,lab){k.shape([[x-19,gy],[x+19,gy],[x+15,gy-13],[x-15,gy-13]],col,{w:1.7,one:1,hatch:{side:.6,gap:3.5,col:dk(col),op:.4}});
  k.shape(E(x,gy-13,15.5,3.6,12),C.water,{w:1.3,one:1});k.add(`<path d="M${x-8} ${gy-13.6}h6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`);
  if(lab)k.text(lab,x,gy-3,9.5);else k.add(`<g fill="#FFFFFF" opacity=".85"><ellipse cx="${x}" cy="${gy-4}" rx="3" ry="2.4"/><circle cx="${x-3.6}" cy="${gy-7.4}" r="1.3"/><circle cx="${x}" cy="${gy-8.8}" r="1.3"/><circle cx="${x+3.6}" cy="${gy-7.4}" r="1.3"/></g>`)}
// toys (shared by the shelf, the basket and the tosstoy prop)
function prBall(k,cx,cy,r,col,band){k.shape(E(cx,cy,r,r,14),col,{w:Math.min(2,r*.13+.6),hatch:{side:.55,gap:3.2,col:dk(col),op:.45}});
  if(band){const d=`M${R1(cx-r*.92)} ${R1(cy-r*.28)}Q${R1(cx)} ${R1(cy+r*.42)} ${R1(cx+r*.92)} ${R1(cy-r*.28)}`;k.add(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${R1(r*.42)}" stroke-linecap="round" opacity=".9"/><path d="${d}" fill="none" stroke="${band}" stroke-width="${R1(r*.3)}" stroke-linecap="round"/>`)}
  k.add(`<ellipse cx="${R1(cx-r*.38)}" cy="${R1(cy-r*.48)}" rx="${R1(r*.26)}" ry="${R1(r*.15)}" transform="rotate(-30 ${R1(cx-r*.38)} ${R1(cy-r*.48)})" fill="#FFFFFF" opacity=".75"/>`)}
function prTennis(k,cx,cy,r){k.shape(E(cx,cy,r,r,14),'#D9EA7A',{w:1.6,hatch:{side:.55,gap:3,col:'#A9BE4E',op:.5}});k.add(`<path d="M${R1(cx-r*.7)} ${R1(cy-r*.7)}Q${R1(cx+r*.1)} ${R1(cy)} ${R1(cx-r*.7)} ${R1(cy+r*.7)}M${R1(cx+r*.7)} ${R1(cy-r*.7)}Q${R1(cx-r*.1)} ${R1(cy)} ${R1(cx+r*.7)} ${R1(cy+r*.7)}" fill="none" stroke="#FFFFFF" stroke-width="${R1(r*.16)}" stroke-linecap="round"/>`)}
const BONEP=[[-30,-6],[30,-6],[36,-15],[46,-10],[42,0],[46,10],[36,15],[30,6],[-30,6],[-36,15],[-46,10],[-42,0],[-46,-10],[-36,-15]];
function prBone(k,cx,cy,len,rot,col){const s=len/92,c=Math.cos(rot),n=Math.sin(rot),P=BONEP.map(([u,v])=>[cx+(u*c-v*n)*s,cy+(u*n+v*c)*s]);
  k.shape(P,col,{w:Math.min(2,1+s),hatch:{side:.6,gap:3.5,col:dk(col),op:.45}});
  const st=[[-27,0],[27,0]].map(([u,v])=>[cx+(u*c-v*n)*s,cy+(u*n+v*c)*s]);k.add(`<path d="M${R1(st[0][0])} ${R1(st[0][1])}L${R1(st[1][0])} ${R1(st[1][1])}" stroke="${dk(col)}" stroke-width="${R1(Math.max(1,1.6*s))}" stroke-dasharray="${R1(4*s)} ${R1(3.5*s)}" stroke-linecap="round"/>`)}
function prRing(k,cx,cy,rx,ry,t,c1,c2){const d=smooth(E(cx,cy,rx,ry,16).map(q=>[q[0]+k.J(.4),q[1]+k.J(.4)]),true);
  k.add(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${R1(t+3.2)}"/><path d="${d}" fill="none" stroke="${c1}" stroke-width="${R1(t)}"/><path d="${d}" fill="none" stroke="${c2}" stroke-width="${R1(t*.7)}" stroke-dasharray="${R1(t*.55)} ${R1(t*.55)}"/><path d="${d}" fill="none" stroke="${C.ink}" stroke-width=".8" stroke-dasharray="${R1(t*.55)} ${R1(t*.55)}" opacity=".35"/>`)}
function prDuck(k,x,gy,s){k.shape([[x-16*s,gy],[x-19*s,gy-12*s],[x-6*s,gy-16*s],[x+14*s,gy-14*s],[x+17*s,gy-4*s],[x+12*s,gy]],'#FCE59A',{w:1.7,hatch:{side:.6,gap:3.5,col:'#E2C46E',op:.5}});
  k.shape(E(x+7*s,gy-24*s,9*s,9*s,12),'#FCE59A',{w:1.6,one:1});k.add(`<path d="M${R1(x+15*s)} ${R1(gy-25*s)}l${R1(8*s)} ${R1(2*s)} ${R1(-7*s)} ${R1(4*s)}z" fill="${C.orange}" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="${R1(x+9*s)}" cy="${R1(gy-27*s)}" r="${R1(1.5*s)}" fill="${C.ink}"/><path d="M${R1(x-8*s)} ${R1(gy-9*s)}q${R1(8*s)} ${R1(4*s)} ${R1(14*s)} ${R1(-3*s)}" fill="none" stroke="${C.ink}" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="${R1(x+3*s)}" cy="${R1(gy-21*s)}" rx="${R1(2.4*s)}" ry="${R1(1.5*s)}" fill="${C.pink}" opacity=".7"/>`)}
// the toy shelf against the right wall
function prShelf(k,x,y,w,h){const bx=x+8,bw=w-16,lv=[y+82,y+168,y+252];
  k.add(`<rect x="${x+5}" y="${y+6}" width="${w}" height="${h}" fill="${C.ink}" opacity=".08"/>`);
  k.shape(RC(bx,y+8,bw,h-16),'#F2D3B8',{w:1.2,one:1,lop:.6,hatch:{side:.7,gap:5,col:'#D9B396',op:.35}});
  k.shape(RC(x,y,10,h),C.wood,{w:1.9,one:1});k.shape(RC(x+w-10,y,10,h),C.wood,{w:1.9,one:1});
  k.shape(RC(x-6,y-6,w+12,13),C.woodD,{w:2,one:1});
  lv.forEach((ly,i)=>k.shape(RC(x+4,ly,w-8,i===2?12:10),i===2?C.woodD:C.wood,{w:1.8,one:1}));
  // top shelf: a jar of dog biscuits, two balls, a little spider plant
  {const jx=x+44,gy=lv[0];k.shape(RC(jx-22,gy-56,44,56),C.glass,{w:1.7});k.shape(RC(jx-25,gy-64,50,10),'#F8C08A',{w:1.5,one:1});
   [[-11,-12,.3],[6,-10,-.4],[-4,-24,.1],[11,-28,.5],[-12,-36,-.3]].forEach(([dx,dy,a])=>prBone(k,jx+dx,gy+dy,20,a,'#F3D9A8'));
   k.shape(RC(jx-17,gy-50,34,13),'#FFFBF3',{w:1.1,one:1});k.text('biscuits',jx,gy-40,11.5);
   k.add(`<path d="M${jx-16} ${gy-8}l6 -30" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`);
   prBall(k,x+100,gy-15,14,'#F28F8F','#FCE59A');prTennis(k,x+130,gy-11,11);
   plant(k,x+w-40,gy,.62,C.mint)}
  // middle shelf: a plush bone, a plush duck, two rope rings (a gap on the right for the Halloween pumpkin)
  {const gy=lv[1];prBone(k,x+52,gy-14,60,-.32,'#FFF3DA');prDuck(k,x+108,gy,.95);
   prRing(k,x+156,gy-6,20,6,6,'#E57E83','#FFFBF3');prRing(k,x+156,gy-14,18,5.4,6,'#7FA8D8','#FFFBF3')}
  // bottom shelf: folded blankets, a knotted tug rope, a frisbee on its edge
  {const gy=lv[2];[['#C9EBDA',0],['#FFC9D3',13],['#DCCBF2',26]].forEach(([c,dy])=>{k.shape(RC(x+22+(dy%2?2:0),gy-14-dy,62,13),c,{w:1.6,one:1,hatch:{side:.7,gap:3.5,col:dk(c),op:.4}});k.line([[x+30,gy-8-dy],[x+76,gy-8-dy]],1,dk(c),{op:.8})});
   const tr=[[x+98,gy-4],[x+110,gy-22],[x+128,gy-12],[x+146,gy-30]];k.add(`<path d="${smooth(tr,false)}" fill="none" stroke="${C.ink}" stroke-width="8.4" stroke-linecap="round"/><path d="${smooth(tr,false)}" fill="none" stroke="#F3D9A8" stroke-width="5.4" stroke-linecap="round"/><path d="${smooth(tr,false)}" fill="none" stroke="#E57E83" stroke-width="5.4" stroke-dasharray="4 4"/>`);
   [tr[0],tr[3]].forEach(q=>k.add(`<circle cx="${R1(q[0])}" cy="${R1(q[1])}" r="6.4" fill="#F3D9A8" stroke="${C.ink}" stroke-width="1.5"/><path d="M${R1(q[0]-3)} ${R1(q[1]-2)}l6 4" stroke="#C9A956" stroke-width="1.2"/>`));
   k.shape(E(x+w-42,gy-24,9,24,14),'#F7B6C8',{w:1.8,hatch:{side:.55,gap:3.5,col:'#D98FA6',op:.5}});k.add(`<ellipse cx="${x+w-42}" cy="${gy-24}" rx="4.4" ry="16" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".8"/>`)}
  // a paper tag on the side
  k.line([[x+w-6,y+30],[x+w+4,y+44]],1,C.ink,{op:.7});k.add(`<g transform="rotate(10 ${x+w+12} ${y+56})">`);k.shape([[x+w,y+46],[x+w+26,y+46],[x+w+26,y+66],[x+w,y+66],[x+w-6,y+56]],'#FFD8E0',{w:1.3,one:1});k.text('share!',x+w+13,y+60,10.5);k.add('</g>')}
// the toy basket on the floor by the shelf (the game binds it: tap = toss a toy)
function prBasket(k,x,y,w,h){const top=y+30,bot=y+h-1;
  return k.cap(()=>{k.add(`<ellipse cx="${x+w/2+4}" cy="${bot}" rx="${w/2+4}" ry="6" fill="${C.ink}" opacity=".12"/>`);
   prBall(k,x+30,top-8,15,'#B9D3F2','#FFFBF3');prBone(k,x+70,top-14,56,-.55,'#FFF3DA');prRing(k,x+108,top-10,16,13,5.4,'#F3BE55','#E57E83');prDuck(k,x+80,top+4,.7);
   const body=[[x+4,top],[x+w-4,top],[x+w-14,bot],[x+14,bot]];k.shape(body,'#E3BC86',{w:2.2,hatch:{side:.7,gap:4.5,col:'#C2925E',op:.45}});
   let wv='';for(let r=0;r<4;r++){const yy=top+8+r*(bot-top-10)/3.4,ins=(yy-top)/(bot-top)*10;let px=x+6+ins;wv+=`M${R1(px)} ${R1(yy)}`;for(let xx=px;xx<x+w-6-ins;xx+=12)wv+=`q3 ${r%2?-3:3} 6 0q3 ${r%2?3:-3} 6 0`}
   let sk='';for(let xx=x+18;xx<x+w-12;xx+=14){const t=(xx-x)/w;sk+=`M${R1(xx)} ${top+4}L${R1(xx+(t-.5)*12)} ${bot-3}`}
   k.add(`<path d="${sk}" stroke="#B88A58" stroke-width="1.2" opacity=".7"/><path d="${wv}" fill="none" stroke="#B88A58" stroke-width="1.6" stroke-linecap="round"/>`);
   k.shape(RC(x-1,top-5,w+2,10),'#D4A574',{w:2,one:1});k.add(`<path d="M${x+6} ${top}h${w-12}" stroke="#F3D9A8" stroke-width="1.6" stroke-dasharray="5 4"/>`);
   [x+2,x+w-2].forEach(hx=>k.add(`<path d="M${hx} ${top+2}q${hx<x+w/2?-9:9} 6 0 14" fill="none" stroke="${C.ink}" stroke-width="3.6" stroke-linecap="round"/><path d="M${hx} ${top+2}q${hx<x+w/2?-9:9} 6 0 14" fill="none" stroke="#D4A574" stroke-width="1.8" stroke-linecap="round"/>`));
   k.shape(RC(x+w/2-24,top+18,48,17),'#FFFBF3',{w:1.2,one:1});k.text('toys!',x+w/2,top+31,14)})}
// the season's flowers in the vase (sunflowers in summer; dog-safe picks: snapdragons, maple twigs and asters, camellias)
function prFlowers(k,x,y){const so=k.env.season;
  const stem=(x1,y1,col='#7DAE66')=>k.line([[x,y+2],[(x+x1)/2+k.J(2),(y+y1)/2],[x1,y1]],1.7,col);
  if(so==='spring'){[[-14,326,'#F7B6C8'],[2,316,'#FFF1F4'],[16,330,'#F8C08A']].forEach(([dx,ty,c])=>{stem(x+dx,ty+20);for(let i=0;i<6;i++){const py=ty+i*6;k.shape(E(x+dx+(i%2?3:-3),py,4.4,3.6,8),c,{w:1,one:1})}});
    k.shape(E(x-10,y-8,3,8,8,.6),'#9CCB80',{w:1.1,one:1});k.shape(E(x+11,y-10,3,8,8,-.6),'#9CCB80',{w:1.1,one:1})}
  else if(so==='autumn'){[[-18,330],[14,322]].forEach(([dx,ty],i)=>{stem(x+dx,ty,C.trunkD);mapleAt(k,x+dx,ty,10,i?.4:-.4,AU[i?3:1][0]);mapleAt(k,x+dx*.6,ty+18,8,i?.9:-.9,AU[i?0:2][0])});
    [[-4,318],[4,334]].forEach(([dx,ty])=>{stem(x+dx,ty);flowerDot(k,x+dx,ty,3.4,'#C7AEEC');k.add(`<circle cx="${x+dx}" cy="${ty}" r="1.8" fill="#F7C65E"/>`)})}
  else if(so==='winter'){[[-14,330,'#FFFFFF'],[3,318,'#F7B6C8'],[17,332,'#FFFFFF']].forEach(([dx,ty,c])=>{stem(x+dx,ty,'#5F8A62');k.shape(E(x+dx-7,ty+10,6,3,8,.5),'#6FA483',{w:1,one:1});
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;k.add(`<circle cx="${R1(x+dx+Math.cos(a)*4.6)}" cy="${R1(ty+Math.sin(a)*4.6)}" r="4" fill="${c}" stroke="${C.ink}" stroke-width=".9"/>`)}k.add(`<circle cx="${x+dx}" cy="${ty}" r="2.6" fill="#F7D24E" stroke="${C.ink}" stroke-width=".8"/>`)})}
  else{[[-16,334],[3,318],[19,338]].forEach(([dx,ty])=>{stem(x+dx,ty);k.shape(E(x+dx*.5-6,(y+ty)/2+6,7,3.4,8,.6),'#9CCB80',{w:1,one:1});
      for(let i=0;i<10;i++){const a=i/10*Math.PI*2;k.add(`<ellipse cx="${R1(x+dx+Math.cos(a)*8)}" cy="${R1(ty+Math.sin(a)*8)}" rx="4.6" ry="2.4" transform="rotate(${R1(a*180/Math.PI)} ${R1(x+dx+Math.cos(a)*8)} ${R1(ty+Math.sin(a)*8)})" fill="#F7D24E" stroke="${C.ink}" stroke-width=".9"/>`)}
      k.add(`<circle cx="${x+dx}" cy="${ty}" r="5.4" fill="#9A6B45" stroke="${C.ink}" stroke-width="1.1"/><circle cx="${x+dx-1.6}" cy="${ty-1.4}" r="1" fill="#5B3D32"/><circle cx="${x+dx+1.8}" cy="${ty+1}" r="1" fill="#5B3D32"/>`)})}}
function sqPlayroom(k){
  prWall(k);
  buntingL(k,-6,372,6,22,[C.red,C.yellow,C.mint,C.lav,C.blue,'#FFB3C7']);buntingL(k,628,1006,6,22,['#FFB3C7',C.blue,C.lav,C.mint,C.yellow,C.red]);prBulbs(k,-6,372,6,22);prBulbs(k,628,1006,6,22);
  prSign(k,370,10,260,64);
  // the window with the real sky, a valance, a spider plant on the sill
  winIn(k,70,90,230,180,{curtain:'#F7C5CF'});prValance(k,62,78,246,20,'#FCE59A');plant(k,276,275,.4,C.mint);
  k.hw(()=>[[126,22,1],[190,40,.85],[250,16,.95]].forEach(([x,len,s])=>{k.line([[x,100],[x+k.J(.6),100+len]],1,C.ink,{op:.75});hwBat(k,x,100+len+9*s,s,{col:HWP})}));// v2.7 Halloween: paper bats in the window
  prChalk(k,88,292,116,74);prLeads(k,224,298,104);
  prSconce(k,328,150);prSconce(k,684,150);
  prPhoto(k,660,190,46,54,-4,'#E9F3FB','#F3BE55','adopted!');prPhoto(k,664,256,44,52,3,'#FDE7EC','#C9A07A','adopted!',1);
  // the toy shelf, a smiling pumpkin on it at Halloween
  prShelf(k,716,96,236,264);k.hw(()=>hwJack(k,920,264,1.25));
  // potted plants in the corners, off the floor band
  plant(k,22,PRF+2,.8,C.roof);plant(k,980,PRF+2,.8,'#B9D3F2');
  // the low café tables: water bowls on one, the vase and a little framed photo on the other
  {const [t1,t2]=[[214,392,120,48],[610,392,120,48]];prTable(k,...t1);prBowl(k,t1[0]+36,t1[1]+11,'#B9D3F2','H2O');prBowl(k,t1[0]+84,t1[1]+11,'#F7C5CF');
   prTable(k,...t2);const vx=t2[0]+38,vy=t2[1]+11;k.side(()=>prFlowers(k,vx,vy-30));
   k.shape([[vx-10,vy],[vx+10,vy],[vx+13,vy-14],[vx+7,vy-26],[vx+8,vy-31],[vx-8,vy-31],[vx-7,vy-26],[vx-13,vy-14]],'#C9EBDA',{w:1.7,hatch:{side:.6,gap:3.5,col:'#9CC9B2',op:.5}});
   k.add(`<path d="M${vx-9} ${vy-12}q9 4 18 0" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-dasharray="3 3"/>`);
   const fx=t2[0]+86,fy=t2[1]-30;k.line([[fx+10,fy+30],[fx+16,fy+40]],1.6,C.ink);k.shape(RC(fx-2,fy,32,40),C.woodD,{w:1.7,one:1});k.add(`<rect x="${fx+3}" y="${fy+5}" width="22" height="30" fill="#FFF4D6"/>`);prCrayonDog(k,fx+11,fy+22,.5,'#EFEFEF');O.heart(k,fx+22,fy+10,3)}
  // the floor: boards, two flat rugs, three cushions (dogs nap on them)
  prFloor(k);
  k.shape(E(520,522,222,44,22),'#F7C5CF',{w:2,hatch:{side:.62,gap:5,col:'#E39AAE',op:.3}});k.add(`<ellipse cx="520" cy="522" rx="196" ry="34" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-dasharray="7 6"/><ellipse cx="520" cy="522" rx="150" ry="24" fill="none" stroke="#EFA9BB" stroke-width="1.6"/>`);
  k.shape(E(176,554,124,32,18),C.mint,{w:2,hatch:{side:.62,gap:5,col:'#A9D4BE',op:.35}});k.add(`<ellipse cx="176" cy="554" rx="104" ry="24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="6 6"/>`);
  prCushion(k,170,560,C.lav);prCushion(k,500,576,'#FCE59A');prCushion(k,850,562,C.blue);
  // the toy basket (tap: toss a toy)
  {const B=[800,360,140,84];hot(k,'data-hot','toys','Toy basket',RC(B[0]-6,B[1]-8,B[2]+12,B[3]+12),prBasket(k,...B))}
  O.sparkle(k,40,90,7);O.sparkle(k,968,74,6);O.note(k,330,250,10);
  O.tape(k,6,18,90,-26,'#F7B9C6');O.tape(k,920,576,80,-24,'#B9D4F3');
}
/* ---------- props: the "Adopt me!" board and the toy that gets tossed ---------- */
// poster portrait boxes in the board's viewBox (300 x 220), the same as SR_SLOTS in 30_shelter.js: [x, y, w, h] for slot 0..7 (2 rows of 4)
const PR_SLOTS=[0,1,2,3,4,5,6,7].map(i=>[20+(i%4)*70,58+Math.floor(i/4)*80,54,50]);
const PR_PAPER=['#FFFFFF','#FFF4D6','#FDE7EC','#E8F2FB'];
function prAdoptBoard(k,n,more){
  k.add(`<rect x="8" y="11" width="292" height="208" rx="5" fill="${C.ink}" opacity=".1"/>`);
  k.shape(RC(3,5,293,209),'#C9976A',{w:2.4,hatch:{side:.86,gap:4.5,col:'#A97E5A',op:.45}});
  k.shape(RC(13,15,273,189),'#E3BC8C',{w:1.4,one:1,lop:.8});
  let sp='';for(let i=0;i<110;i++){const x=16+k.r()*267,y=18+k.r()*183;sp+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(.6+k.r()*1)}" fill="${k.r()<.6?'#C99A68':'#F2D5AE'}"/>`}k.add(`<g opacity=".8">${sp}</g>`);
  // the hand-lettered header on a paper banner
  k.add(`<g transform="rotate(-1.5 150 27)">`);k.shape([[52,7],[248,7],[240,27],[248,47],[52,47],[60,27]],'#FFFBF3',{w:1.9});
  k.text('Adopt me!',150,39,31);O.heart(k,80,26,6.5);O.heart(k,220,27,6.5,'#F7B6C8');k.add('</g>');
  for(let i=0;i<n;i++){const [sx,sy,sw,sh]=PR_SLOTS[i],px=sx-5,py=sy-6,pw=sw+10,ph=sh+23,cx=sx+sw/2;
    k.add(`<rect x="${px+2}" y="${py+3}" width="${pw}" height="${ph}" fill="${C.ink}" opacity=".12"/>`);
    k.shape(RC(px,py,pw,ph),PR_PAPER[i%4],{w:1.5,one:1});
    k.add(`<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#FFFDF8"/>`);k.pen(RC(sx,sy,sw,sh),true,{w:1.2,one:1,amp:.35});
    k.line([[sx+5,sy+sh+8],[sx+sw-14,sy+sh+8]],1.3,C.graph,{amp:.4});k.line([[sx+5,sy+sh+14],[sx+sw-24,sy+sh+14]],1.1,C.graph,{amp:.4,op:.8});
    k.add(`<g fill="${C.pink}" opacity=".85"><ellipse cx="${sx+sw-5}" cy="${sy+sh+12}" rx="3" ry="2.5"/><circle cx="${sx+sw-8.4}" cy="${sy+sh+8.4}" r="1.2"/><circle cx="${sx+sw-5}" cy="${sy+sh+7.2}" r="1.2"/><circle cx="${sx+sw-1.6}" cy="${sy+sh+8.4}" r="1.2"/></g>`);
    O.heart(k,cx,py+1,4.4,'#E86A7C');k.add(`<circle cx="${cx-1.2}" cy="${py-.4}" r="1" fill="#FFFFFF" opacity=".8"/>`)}
  if(!n){k.text('everyone is home!',150,128,25,{rot:-3});O.heart(k,150,156,9)}
  if(more>0){const t='+'+more;k.line([[258,4],[268,14]],1.1,C.ink,{op:.8});k.add(`<g transform="rotate(8 272 30)">`);
    k.shape([[256,16],[292,16],[292,44],[256,44],[249,30]],'#FFD8E0',{w:1.5,one:1});k.add(`<circle cx="255" cy="30" r="2" fill="#FFFBF3" stroke="${C.ink}" stroke-width="1"/>`);k.text(t,274,37,t.length>2?17:20);k.add('</g>')}
}
function prTossToy(k,kind){
  if(kind==='bone')prBone(k,30,31,54,-.38,'#FFF3DA');
  else if(kind==='ring'){prRing(k,30,30,19,19,8,'#F3BE55','#E57E83');k.add(`<path d="M17 20q6 -8 15 -8" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".7"/>`)}
  else{prBall(k,30,30,20,'#F28F8F','#FCE59A');k.add(`<circle cx="40" cy="20" r="2.2" fill="${C.ink}" opacity=".7"/>`)}
}
const cacheP={};
function propC(key,name,label,W,H,draw){if(!cacheP[key]){const k=kit(hashS('pwc-prop-'+name));k.env=DEF_ENV;draw(k);
    cacheP[key]=`<svg xmlns="http://www.w3.org/2000/svg" class="pa-wc-prop pa-wc-${name}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">${k.defs.length?`<defs>${k.defs.join('')}</defs>`:''}${k.out.join('')}</svg>`}
  return freshC(cacheP[key])}

/* ======================= v2.8: Winter Lights (k.lt), New Year (k.ny), the Japan scenery (k.jp, PA.JP) and Fuji View Hill (V28 sections 5 and 12) =======================
   The bulbs, the paper star, the shimekazari and the kites are world A's (SCENE ART), copied here so both modules hang the same ones.
   PA.JP draws Mt. Fuji and the Japanese details into whichever kit it is handed (world A's or this one), with that kit's own pencil only and on the
   stream the caller set (k.jp): it never switches streams, so the base drawing never moves. The details sit in pointer-events:none groups (a tap never
   lands on them). Fuji keeps its own light: its colours are written as rgb() so the time and weather recolour pass (hex only) leaves them alone. */
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
// white paper zigzags (shide) hanging from (x, y)
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
// a warm glow for something lit (dusk and night), drawn over the treated art with the bulbs
function jpGlow(k,x,y,r,f=1){const L=k.env.lit;if(!L||!k.wl)return;const g=glowGrad(k,'#FFD877','jpw');wlPush(k,x,`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(r)}" fill="url(#${g})" opacity="${R1(.9*L*f)}"/>`)}
// kadomatsu: three bamboo stalks cut on the slant, pine sprigs and a little plum, a straw skirt tied with rope. (x, gy): its foot, f: which way the cuts face
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
// a paper lantern (chouchin) hanging from (x, y): white paper, ribs, a red band, black caps; it glows after dark
function nyChochin(k,x,y,s=1){k.line([[x,y],[x,y+4*s]],1,C.ink,{op:.7,amp:.1});k.shape(RC(x-5*s,y+4*s,10*s,3*s),'#3E3533',{w:.9,one:1});
  k.shape(E(x,y+17*s,8.6*s,10.4*s,14),'#FFF4E6',{w:1.2,one:1});let d='';for(let i=-2;i<=2;i++){const dy=i*3.8*s,hw=8.2*s*Math.sqrt(Math.max(0,1-Math.pow(dy/(10.4*s),2)));d+=`M${R1(x-hw)} ${R1(y+17*s+dy)}h${R1(2*hw)}`}
  k.add(`<path d="${d}" stroke="#D9B48E" stroke-width=".8"/><path d="M${R1(x-8.2*s)} ${R1(y+14.6*s)}h${R1(16.4*s)}v${R1(5*s)}h${R1(-16.4*s)}Z" fill="#E0473A" opacity=".85"/>`);
  k.shape(RC(x-4.6*s,y+26.6*s,9.2*s,2.8*s),'#3E3533',{w:.9,one:1});k.line([[x,y+29.4*s],[x+k.J(.6),y+34*s]],1,'#E0473A',{amp:.1});jpGlow(k,x,y+17*s,20*s)}
function nyChochins(k,x0,y0,x1,y1,sag,n,s=1){const P=sagP(x0,y0,x1,y1,sag,14);k.line(P,1.1,C.ink,{op:.85,amp:.3});for(let i=1;i<=n;i++){const t=i/(n+1);nyChochin(k,x0+(x1-x0)*t,y0+(y1-y0)*t+Math.sin(Math.PI*t)*sag,s)}}

// the Square's fountain "off for winter": the basin heaped with fir branches, a string of bulbs over them
function ltFountain(k,fx){const m=[];for(let i=0;i<=14;i++){const a=Math.PI+i/14*Math.PI;m.push([fx+Math.cos(a)*90,446+Math.sin(a)*(20+(i%2?7:2))])}m.push([fx+88,452],[fx+40,460],[fx-40,460],[fx-88,452]);
  k.shape(m,'#6FA46E',{w:1.6,one:1,hatch:{side:.5,gap:4,col:'#4F7F55',op:.6}});
  for(let i=0;i<15;i++){const t=i/14,a=Math.PI+.15+t*(Math.PI-.3),x=fx+Math.cos(a)*84,y=446+Math.sin(a)*22;nyPine(k,x,y+4,.95,a+k.J(.3))}
  ltString(k,[[fx-86,446],[fx-56,428],[fx-24,440],[fx+8,424],[fx+40,436],[fx+70,426],[fx+88,440]],17)}
/* ---------- Mt. Fuji (V28 section 12.2) ---------- */
// [cx, by, w] per scene or strip: in a dip of the far line, clear of the sun and moon spots, inside the phone home crop of the yard and the Square;
// the Square's is big and set low so its cap and upper slopes fill the strip of sky the desktop crop shows over Paws & Pages (y 147-194), right of the location chip;
// Market Street's summit and cap peek over the Boutique's roof right of the phone location chip (x 543+, above the dev button), and on desktop
// (05_market_shops.js lifts the street 30 units there, so the crop starts at y 117 instead of the cornices at 136)
const JP_SPOTS={yard:[432,304,290],market:[586,189,220],shelter:[470,214,110],garden:[360,118,220],park:[290,322,220],river:[560,294,240],beach:[680,291,240],
  square:[420,253,300],dogpark:[300,326,240],hilltop:[380,246,260],pier:[400,263,300],fujihill:[400,344,540],
  'strip:park':[250,252,200],'strip:river':[760,202,200],'strip:beach':[750,188,200],'strip:town':[502,122,200],'strip:hilltop':[520,222,200],'strip:pier':[460,184,200]};
function jpSpot(name){const s=JP_SPOTS[name];return s?{cx:s[0],by:s[1],w:s[2]}:null}
const rgbS=h=>{const c=h2c(h);return `rgb(${c[0]},${c[1]},${c[2]})`};
// [body, shadow side, cap, cap shade, outline] by time: lilac with a peach cap at dawn, blue-grey by day, red Fuji at dusk, a navy shape at night.
// The day cap is an off-white (never pure white on the cream paper), still the brightest thing against the sky
const FJ_T={dawn:['#C9B8DC','#A895C6','#FFE6CF','#F0C3AE','#9C8CB2'],day:['#AFC3D6','#8DA4BD','#F7F9FC','#CCDAE8','#8394A8'],
  dusk:['#E8A08A','#9C6C96','#FAC8D2','#E3A0B4','#93657C'],night:['#5A6688','#48526F','#B8C5D9','#93A2BC','#7480A2']};
const FJ_CAP={winter:.45,spring:.35,summer:.1,autumn:.15};
function fjCols(env){let c=FJ_T[env.time].slice();if(env.ssn==='winter'&&env.time==='day'){c[0]='#A6BBD1';c[3]='#C3D3E4'}
  if(env.weather==='cloudy'){const g=env.night?'#4E5878':'#B9C1CB';c=c.map((h,i)=>mixH(h,g,i<2?.3:.16))}
  if(env.rain||env.snow){const g=env.night?'#424A5E':env.snow?'#DCE2EA':'#B7BFCA';c=c.map(h=>mixH(h,g,.45))}
  return c.map(rgbS)}
// the real profile: a wide cone whose slopes flare out at the foot (concave, exponents about 1.5-1.7), a flat summit with three small bumps,
// a little lopsided (a shoulder low on the right flank)
function fjProfile(cx,by,w,r){const H=w/3.2,hw=w/2,p=.09,gl=1.5+r()*.08,gr=1.6+r()*.08,bumps=[[-.046,.016],[-.006,.01],[.032,.019]].map(([t,a])=>[t+(r()-.5)*.012,a*(.8+r()*.4)]);
  const h=t=>{const a=Math.abs(t);let v;if(a<=p)v=.982;else{const u=Math.min(1,(a-p)/(1-p));v=.982*Math.pow(1-u,t<0?gl:gr);if(t>0)v+=.02*Math.exp(-Math.pow((u-.4)/.07,2))*(1-u)}
    bumps.forEach(([bt,ba])=>{v+=ba*Math.exp(-Math.pow((t-bt)/.016,2))});return Math.max(0,v)};
  const ts=[],N=Math.max(36,Math.round(w/6));for(let i=0;i<=N;i++)ts.push(-1+2*i/N);for(let t=-.11;t<=.11;t+=.008)ts.push(t);ts.sort((a,b)=>a-b);
  const pts=[];ts.forEach(t=>{if(!pts.length||t-pts[pts.length-1].t>.002)pts.push({t,x:cx+t*hw,y:by-h(t)*H})});
  return {H,hw,y:x=>by-h((x-cx)/hw)*H,pts:pts.map(q=>[q.x,q.y])}}
// a soft cloud band: lumpy top, flatter bottom, crayon hatching underneath, a pencil outline. o: { op: fill opacity, ol / olw / olop: the outline's colour, width, opacity }
function jpCloudBand(k,x0,x1,yb,th,cc,sw,o={}){// a long cartoon cloud like the sky ones: a scalloped top of round bumps (the middle ones higher), a flat bottom
  const n=Math.max(3,Math.round((x1-x0)/(th*.95))),bw=(x1-x0)/n,B=[],p=[];
  for(let j=0;j<n;j++){const cx=x0+bw*(j+.5),mid=1-Math.abs((j+.5)/n-.5)*1.3,r=bw*.62*(.88+k.r()*.24);B.push([cx,yb-th*(.18+.5*mid)+r*.45,r])}
  for(let x=x0-bw*.05;x<=x1+bw*.05;x+=3){let y=yb-2;B.forEach(([cx,cy,r])=>{const d=x-cx;if(Math.abs(d)<r)y=Math.min(y,cy-Math.sqrt(r*r-d*d))});p.push([x,y])}
  p.push([x1+bw*.1,yb],[x0-bw*.1,yb]);
  k.fill(p,cc[0],{dx:0,dy:0,amp:.5,op:o.op});k.hatch([[x0,yb+1],[x1,yb+1],[x1-bw*.3,yb-th*.3],[x0+bw*.3,yb-th*.3]],{gap:4,col:cc[1],op:o.op?.5:.75,w:1.15*sw});
  k.pen(p,true,{w:o.olw||1.7*sw,col:o.ol||cc[2],amp:.5,op:o.olop});
  k.line([[x0+bw*.5,yb-th*.4],[x0+bw*.75,yb-th*.62]],1.1*sw,o.ol||(cc[2]===rgbS(C.ink)?rgbS(C.graph):cc[2]),{op:.7})}
// the snow cap's lower edge, right to left: 5-7 long fingers down the gullies (varied lengths, radiating from the summit) with short irregular
// scallops between them. Returns the edge points and the finger tips (where the streaks carry on down)
function fjCapEdge(k,F,cx,yl,xl,xr,so){const H=F.H,hw=F.hw,span=xr-xl,fr={winter:[.12,.25],spring:[.1,.22],summer:[.06,.15],autumn:[.05,.12]}[so]||[.06,.15],
    nF=5+Math.floor(k.r()*3),edge=[],tips=[],ins=(x,y)=>[x,Math.max(F.y(x)+1,y)];
  let xa=xr;for(let i=0;i<nF;i++){const c=xr-span*(i+.5+k.J(.28))/nF,bw=span/nF*(.15+k.r()*.17)*(so==='summer'?.55:1),L=H*(fr[0]+Math.pow(k.r(),1.2)*(fr[1]-fr[0])),dx=(c-cx)/hw*L*.6,xb=c+bw;
    // scallops from the last finger to this one: two or three little bumps, some up, some down
    const m=2+Math.floor(k.r()*2);for(let j=1;j<=m;j++){const x=xa+(xb-xa)*j/(m+1);edge.push(ins(x,yl+H*(k.r()*.04-.02)))}
    [[c+bw,yl+L*.04],[c+bw*.56+dx*.4,yl+L*.4],[c+bw*.2+dx*.8,yl+L*.82],[c+dx,yl+L],[c-bw*.24+dx*.78,yl+L*.8],[c-bw*.62+dx*.38,yl+L*.36],[c-bw,yl+L*.03]].forEach(q=>edge.push(ins(q[0],q[1])));
    tips.push([c+dx,yl+L,L]);xa=c-bw}
  const m=2;for(let j=1;j<=m;j++){const x=xa+(xl-xa)*j/(m+1);edge.push(ins(x,yl+H*(k.r()*.04-.015)))}
  return {edge,tips}}
function jpFujiDraw(k,sp,o={}){if(!sp)return;const env=k.env,{cx,by,w}=sp,F=fjProfile(cx,by,w,k.r),H=F.H,hw=F.hw,cs=fjCols(env),hid=env.rain||env.snow,sw=Math.max(.7,Math.min(1.7,w/220)),so=env.season;
  const draw=()=>{k.add('<g data-fuji="1" pointer-events="none">');
    const body=F.pts.concat([[cx+hw+2,by+10],[cx-hw-2,by+10]]);
    k.fill(body,cs[0],{dx:0,dy:0,amp:.5,op:hid?.55:null});
    if(!hid){
      // the shadow flank (left): a soft wash and pencil hatching, then the gullies running down from the summit
      const inner=[[cx-hw*.01,by-H*.96],[cx-hw*.07,by-H*.62],[cx-hw*.17,by-H*.3],[cx-hw*.3,by+10]],sh=F.pts.filter(q=>q[0]<=cx-hw*.01).concat(inner,[[cx-hw-2,by+10]]);
      k.fill(sh,cs[1],{dx:0,dy:0,amp:.4,op:.42});k.hatch(sh,{gap:Math.max(3.4,w/70),col:cs[1],op:.5,w:.9*sw});
      let g='';for(let i=0;i<9;i++){const sg=i<5?-1:1,t0=sg*(.07+k.r()*.1),x0=cx+t0*hw,y0=F.y(x0)+H*(.04+k.r()*.05),t1=sg*(.22+k.r()*.5),x1=cx+t1*hw,y1=by-H*(.06+k.r()*.3);g+=`M${R1(x0)} ${R1(y0)}Q${R1((x0+x1)/2+sg*hw*.03)} ${R1((y0+y1)/2-H*.04)} ${R1(x1)} ${R1(y1)}`}
      k.add(`<path d="${g}" fill="none" stroke="${cs[1]}" stroke-width="${R1(.9*sw)}" stroke-linecap="round" opacity=".55"/>`);
      // the snow cap, by season: a ragged edge with fingers down the gullies (winter and spring), a few streaks at the summit (summer), a patchy dusting (autumn)
      const cf=FJ_CAP[so]||.1,yl=by-H*(1-cf),top=F.pts.filter(q=>q[1]<=yl);
      if(top.length>2){const xl=top[0][0],xr=top[top.length-1][0],{edge,tips}=fjCapEdge(k,F,cx,yl,xl,xr,so);
        const cap=top.concat(edge);k.fill(cap,cs[2],{dx:0,dy:0,amp:.35,op:so==='autumn'?.82:null});
        k.hatch(cap.filter(q=>q[0]<=cx+hw*.02),{gap:3.2,col:cs[3],op:.75,w:.8*sw});
        k.line(edge,.9*sw,cs[3],{op:.9,amp:.3});
        // streaks: the snow in the gullies carries on down from the finger tips (not in autumn's first dusting)
        let st='';if(so!=='autumn')tips.forEach(([x,y,L],i)=>{if(so==='summer'&&i%2)return;const l=L*(.2+k.r()*.3),dx=(x-cx)/hw*l*.5;st+=`M${R1(x)} ${R1(y-1)}q${R1(dx*.4)} ${R1(l*.5)} ${R1(dx)} ${R1(l)}`});
        if(st)k.add(`<path d="${st}" fill="none" stroke="${cs[2]}" stroke-width="${R1(1.1*sw)}" stroke-linecap="round" opacity=".8"/>`);
        if(so==='autumn'){let ho='';for(let i=0;i<5;i++){const x=xl+(xr-xl)*(.15+k.r()*.7),y=Math.max(F.y(x)+2,yl-H*(.02+k.r()*.06));ho+=`M${R1(x-2.4*sw)} ${R1(y)}a${R1(2.4*sw)} ${R1(1.4*sw)} 0 1 0 ${R1(4.8*sw)} 0a${R1(2.4*sw)} ${R1(1.4*sw)} 0 1 0 ${R1(-4.8*sw)} 0`}k.add(`<path d="${ho}" fill="${cs[0]}" opacity=".7"/>`)}}
      // the pencil outline: two light strokes, lighter than the far hills' line
      k.pen(F.pts,false,{w:1.3*sw,col:cs[4],amp:.45,op:env.night?.5:.92});k.line(F.pts.map(q=>[q[0]+.8,q[1]+.7]),.7*sw,cs[4],{op:env.night?.22:.45,amp:.4,step:10});
      if(env.night&&env.weather!=='cloudy'){const sx=cx+hw*.18,sy=by-H*1.06,q=Math.max(4,w/42);let d='';for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,rr=j%2?q*.45:q;d+=(j?'L':'M')+R1(sx+Math.cos(a)*rr)+' '+R1(sy+Math.sin(a)*rr)}
        k.add(`<path d="${d}Z" fill="${rgbS('#FFF0A8')}" stroke="${rgbS('#E2C46E')}" stroke-width="1.2" stroke-linejoin="round"/>`)}
      // cloudy: two lobes of cloud, offset and at different heights (a high one over the left shoulder, a low one across the middle),
      // see-through enough that the cap ghosts through where they cross it: never a flat lid
      if(env.weather==='cloudy'){const cc=cloudCols(env).map(rgbS),co={op:.72,ol:cs[4],olw:1.3*sw,olop:.9};
        jpCloudBand(k,cx-hw*.7,cx-hw*.02,by-H*.76,H*.28,cc,sw,co);jpCloudBand(k,cx-hw*.28,cx+hw*.3,by-H*.54,H*.26,cc,sw,co)}}
    else{// rain and snow: Fuji is behind the clouds, only a faint foot shows
      k.pen(F.pts.filter(q=>q[1]>by-H*.36),false,{w:1.1*sw,col:cs[4],amp:.4,op:.45});
      const cc=cloudCols(env).map(rgbS);jpCloudBand(k,cx-hw*.46,cx+hw*.3,by-H*.66,H*.62,cc,sw);jpCloudBand(k,cx-hw*.12,cx+hw*.64,by-H*.5,H*.56,cc,sw);jpCloudBand(k,cx-hw*.7,cx+hw*.34,by-H*.3,H*.5,cc,sw)}
    k.add('</g>')};
  if(k.wrap&&(cx-hw<0||cx+hw>1200))k.wrap(cx,hw+4,draw);else draw()}
// a faint reflection in calm water by day (the pier): the body and the cap upside down, broken by ripples
function jpFujiReflect(k,sp,y0){const env=k.env;if(env.time!=='day'||env.rain||env.snow)return;const {cx,by,w}=sp,F=fjProfile(cx,by,w,rng(4242)),H=F.H,hw=F.hw,cs=fjCols(env);
  // no solid shape: rows of ripple strokes, each as long as the upside-down mountain is wide at that depth (broken into dashes), the cap's rows
  // in the cap colour, the whole thing faint
  const r=rng(4243),cf=FJ_CAP[env.season]||.1,capD=H*(1-cf),wid=d=>{let a=null,b=null;F.pts.forEach(q=>{if(by-q[1]>=d){if(a===null)a=q[0];b=q[0]}});return a===null?null:[a,b]};
  let rb='',rc='';for(let d=2;d<H*.98;d+=3.6){const e=wid(d);if(!e)break;const y=R1(y0+d+(r()-.5)*.8),xe=e[1]-r()*3;let x=e[0]+r()*3,s='';
    while(x<xe-2){const L=Math.min(xe-x,6+(e[1]-e[0])*(.18+r()*.4));s+=`M${R1(x)} ${y}h${R1(L)}`;x+=L+2+r()*5}
    if(d>=capD)rc+=s;else rb+=s}
  k.add(`<g pointer-events="none" opacity=".3" stroke-linecap="round"><path d="${rb}" stroke="${cs[0]}" stroke-width="2.4"/><path d="${rc}" stroke="${cs[2]}" stroke-width="2.4"/></g>`)}

/* ---------- the Japanese details (V28 section 12.3) ---------- */
// a grey concrete telephone pole: two crossarms with insulators, step bolts, (tr) a transformer can. Returns the two wire points of its top crossarm
function jpPole(k,x,gy,top,s=1,tr){k.shape([[x-3.4*s,gy],[x-2.4*s,top],[x+2.4*s,top],[x+3.4*s,gy]],'#B9B1A7',{w:1.4,one:1,hatch:{side:.55,gap:3,col:'#8E867C',op:.5}});
  [[top+8*s,22],[top+19*s,16]].forEach(([y,l])=>{k.shape(RC(x-l*s,y-1.6*s,l*2*s,3.2*s),'#9A9188',{w:1,one:1});k.add(`<circle cx="${R1(x-(l-3)*s)}" cy="${R1(y-3.2*s)}" r="${R1(1.7*s)}" fill="#F3F0EA" stroke="${C.ink}" stroke-width=".8"/><circle cx="${R1(x+(l-3)*s)}" cy="${R1(y-3.2*s)}" r="${R1(1.7*s)}" fill="#F3F0EA" stroke="${C.ink}" stroke-width=".8"/>`)});
  if(tr){k.shape(RC(x+4*s,top+28*s,12*s,19*s),'#C9CDD1',{w:1.2,one:1,hatch:{side:.6,gap:2.6,col:'#9AA0A8',op:.5}});k.line([[x+10*s,top+28*s],[x+7*s,top+20*s]],1,C.ink,{op:.7})}
  let d='';for(let y=top+44*s;y<gy-24*s;y+=13*s)d+=`M${R1(x-2.4*s)} ${R1(y)}h${R1(-3.6*s)}M${R1(x+2.4*s)} ${R1(y+6.5*s)}h${R1(3.6*s)}`;if(d)k.add(`<path d="${d}" stroke="${C.ink}" stroke-width=".9" opacity=".55"/>`);
  return poleEnds(x,top,s)}
const poleEnds=(x,top,s=1)=>[[x-19*s,top+5*s],[x+19*s,top+5*s],[x-13*s,top+16*s],[x+13*s,top+16*s]];
// sagging wires between two poles' points (a, b: the arrays jpPole returns)
function jpWires(k,a,b,sag){[[0,0,0],[1,1,3],[3,3,6]].forEach(([i,j,d])=>k.line(sagP(a[i][0],a[i][1],b[j][0],b[j][1],sag+d,14),.9,C.ink,{op:.72,amp:.25,step:22}))}
// a round little sparrow sitting on a wire at (x, y)
function jpSparrow(k,x,y,s=1,f=1){const X=v=>R1(x+v*s*f);k.shape(E(x,y-5*s,6*s,4.6*s,10),'#B98A60',{w:1,one:1});k.shape(E(x+4.4*s*f,y-9*s,3.4*s,3.2*s,8),'#9C6E4A',{w:1,one:1});
  k.add(`<path d="M${X(7.6)} ${R1(y-9.6*s)}l${R1(2.4*s*f)} ${R1(.9*s)} ${R1(-2.4*s*f)} ${R1(.9*s)}z" fill="${C.ink}"/><circle cx="${X(5.2)}" cy="${R1(y-9.8*s)}" r="${R1(.75*s)}" fill="${C.ink}"/><ellipse cx="${X(4.8)}" cy="${R1(y-7.2*s)}" rx="${R1(1.7*s)}" ry="${R1(1*s)}" fill="#F5EBDD"/><path d="M${X(-5)} ${R1(y-5*s)}l${R1(-4.4*s*f)} ${R1(2.2*s)}M${X(-1)} ${R1(y-.8*s)}v${R1(1.6*s)}M${X(1.4)} ${R1(y-.8*s)}v${R1(1.6*s)}" stroke="#6E5034" stroke-width="${R1(1.4*s)}" stroke-linecap="round"/>`)}
function jpSparrows(k,P,ts,s=1){const e=k.env;if(e.night||e.rain)return;ts.forEach((t,i)=>{const p=P[Math.round(t*(P.length-1))];jpSparrow(k,p[0],p[1],s,i%2?-1:1)})}
// poles along a stretch: xs = pole x positions (left to right), the first may carry the transformer; birds = [span index, [t...]]
function jpPoleRow(k,xs,gy,top,s,sag,birds,tr=-1){const ends=xs.map((x,i)=>jpPole(k,x,gy,top+(i%2)*3,s,i===tr));
  for(let i=1;i<ends.length;i++)jpWires(k,ends[i-1],ends[i],sag);
  if(birds){const a=ends[birds[0]],b=ends[birds[0]+1];jpSparrows(k,sagP(a[0][0],a[0][1],b[0][0],b[0][1],sag,30),birds[1],s*.95)}}
// the round red post box: a domed cap, a white slot plate, a little stone base
function jpPostBox(k,x,gy,s=1){const w=26*s,h=60*s,t=gy-h;k.shape(RC(x-w/2-3*s,gy-6*s,w+6*s,6*s),'#9A9188',{w:1.2,one:1});
  k.shape(RC(x-w/2,t,w,h-6*s),'#E04A3C',{w:1.7,one:1,hatch:{side:.64,gap:3,col:'#B5322A',op:.55}});
  const dm=[];for(let i=0;i<=10;i++){const a=Math.PI+i/10*Math.PI;dm.push([x+Math.cos(a)*(w/2+2.5*s),t+Math.sin(a)*9*s])}k.shape(dm,'#E04A3C',{w:1.6,one:1,hatch:{side:.6,gap:2.8,col:'#B5322A',op:.5}});
  k.shape(RC(x-w/2-2.5*s,t-1.6*s,w+5*s,4*s),'#C93B30',{w:1.2,one:1});
  k.shape(RC(x-9*s,t+9*s,18*s,10*s),'#FFFBF3',{w:1.1,one:1});k.add(`<path d="M${R1(x-6*s)} ${R1(t+13.6*s)}h${R1(12*s)}" stroke="${C.ink}" stroke-width="${R1(1.8*s)}" stroke-linecap="round"/><rect x="${R1(x-6*s)}" y="${R1(t+28*s)}" width="${R1(12*s)}" height="${R1(8*s)}" fill="#FFFBF3" stroke="${C.ink}" stroke-width=".8"/><path d="M${R1(x-4*s)} ${R1(t+31*s)}h${R1(8*s)}M${R1(x-4*s)} ${R1(t+33.6*s)}h${R1(6*s)}" stroke="${C.graph}" stroke-width=".8"/>`);
  if(k.env.snow)capLine(k,dm.slice(1,10),4*s)}
// a sleeping cat curled into a loaf (on top of the vending machine)
function jpCat(k,x,y,s=1){k.shape([[x-13*s,y],[x-14*s,y-6*s],[x-9*s,y-11*s],[x+4*s,y-12*s],[x+11*s,y-8*s],[x+12*s,y]],'#F2B27A',{w:1.3,one:1,hatch:{side:.6,gap:3,col:'#D9894E',op:.55}});
  k.shape(E(x+10*s,y-9*s,6*s,5.4*s,10),'#F2B27A',{w:1.3,one:1});k.add(`<path d="M${R1(x+5*s)} ${R1(y-12*s)}l${R1(1*s)} ${R1(-5*s)} ${R1(3.4*s)} ${R1(3.4*s)}M${R1(x+12*s)} ${R1(y-13.4*s)}l${R1(2.6*s)} ${R1(-4*s)} ${R1(1.6*s)} ${R1(5*s)}" fill="#F2B27A" stroke="${C.ink}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${R1(x+6.6*s)} ${R1(y-9*s)}q${R1(1.2*s)} ${R1(1.2*s)} ${R1(2.4*s)} 0M${R1(x+11*s)} ${R1(y-9*s)}q${R1(1.2*s)} ${R1(1.2*s)} ${R1(2.4*s)} 0" fill="none" stroke="${C.ink}" stroke-width=".9" stroke-linecap="round"/><path d="M${R1(x-13*s)} ${R1(y-1*s)}q${R1(-5*s)} ${R1(-1*s)} ${R1(-4*s)} ${R1(-7*s)}" fill="none" stroke="${C.ink}" stroke-width="${R1(3.2*s)}" stroke-linecap="round"/><path d="M${R1(x-13*s)} ${R1(y-1*s)}q${R1(-5*s)} ${R1(-1*s)} ${R1(-4*s)} ${R1(-7*s)}" fill="none" stroke="#F2B27A" stroke-width="${R1(1.8*s)}" stroke-linecap="round"/>`);
  k.text('z',x+18*s,y-16*s,Math.round(11*s),{wt:600,col:C.graph})}
// a drinks vending machine: rows of tiny bottles (no brands), buttons, a coin slot, a cat asleep on top; lit at dusk and night
function jpVend(k,x,gy,s=1){const w=44*s,h=74*s,t=gy-h,L=k.env.lit;k.shape(RC(x-w/2,t,w,h),'#E6EEF5',{w:1.8,one:1,hatch:{side:.82,gap:3.4,col:'#B7C6D4',op:.5}});
  k.shape(RC(x-w/2+3*s,t+4*s,w*.66,h*.56),L?'#FFF2C4':'#F8FBFD',{w:1.2,one:1});
  const cols=['#F28FA5','#8FC1E8','#F7D24E','#9CCB80','#F8A95E'];let bt='',bu='';for(let r=0;r<3;r++)for(let i=0;i<4;i++){const bx=x-w/2+7*s+i*7.2*s,by=t+15*s+r*12*s;bt+=`<rect x="${R1(bx-1.8*s)}" y="${R1(by-6*s)}" width="${R1(3.6*s)}" height="${R1(6*s)}" rx="${R1(1*s)}" fill="${cols[(r*4+i)%5]}" stroke="${C.ink}" stroke-width=".5"/>`;bu+=`M${R1(bx-.8*s)} ${R1(by+2.4*s)}h${R1(1.6*s)}`}
  k.add(bt+`<path d="${bu}" stroke="#E04A3C" stroke-width="${R1(1.4*s)}" stroke-linecap="round"/>`);
  k.shape(RC(x+w*.2,t+8*s,w*.22,h*.4),'#C9D3DD',{w:1,one:1});k.add(`<rect x="${R1(x+w*.26)}" y="${R1(t+14*s)}" width="${R1(w*.1)}" height="${R1(5*s)}" fill="${C.ink}" opacity=".7"/><circle cx="${R1(x+w*.31)}" cy="${R1(t+26*s)}" r="${R1(1.6*s)}" fill="#E04A3C"/>`);
  k.shape(RC(x-w/2+5*s,t+h*.72,w*.6,h*.16),'#5B6170',{w:1.2,one:1});k.shape(RC(x-w/2-1*s,gy-3*s,w+2*s,3*s),'#9AA3AE',{w:1,one:1});
  if(L){jpGlow(k,x-w*.12,t+h*.32,58*s,1.1);wlPush(k,x,`<rect x="${R1(x-w/2+3*s)}" y="${R1(t+4*s)}" width="${R1(w*.66)}" height="${R1(h*.56)}" fill="#FFF6D0" opacity="${R1(.85*L)}"/><g opacity="${R1(.9*L)}">${bt}</g>`)}// lit: the window glows over the night wash and the bottles show bright in it
  jpCat(k,x-2*s,t,.9*s)}
// a short indigo noren (a split curtain) on its rod, with a white paw print across the middle
function jpNoren(k,x0,x1,y,len,n=3){const pw=(x1-x0)/n;k.line([[x0-5,y],[x1+5,y]],2.6,C.woodD,{amp:.2});let ol='';
  for(let i=0;i<n;i++){const a=x0+i*pw+1,b=x0+(i+1)*pw-1,sw=k.J(1.2),P=[[a,y+1],[b,y+1],[b+sw,y+len],[a+sw,y+len]];k.fill(P,'#3F5585',{dx:0,dy:0,amp:.3});k.hatch(P,{gap:4,col:'#2C3D66',op:.6,w:1});ol+=`M${P.map(q=>R1(q[0])+' '+R1(q[1])).join('L')}Z`}
  k.add(`<path d="${ol}" fill="none" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/>`);
  const cx=(x0+x1)/2,cy=y+len*.56,s=Math.min(1,len/30);k.add(`<g fill="#FFFFFF" opacity=".95"><ellipse cx="${R1(cx)}" cy="${R1(cy+3*s)}" rx="${R1(5.4*s)}" ry="${R1(4.4*s)}"/><circle cx="${R1(cx-6*s)}" cy="${R1(cy-3*s)}" r="${R1(2.3*s)}"/><circle cx="${R1(cx-2*s)}" cy="${R1(cy-6.6*s)}" r="${R1(2.3*s)}"/><circle cx="${R1(cx+2.6*s)}" cy="${R1(cy-6.6*s)}" r="${R1(2.3*s)}"/><circle cx="${R1(cx+6.4*s)}" cy="${R1(cy-3*s)}" r="${R1(2.3*s)}"/></g>`)}
// jizo: a small round stone figure with a red bib (and a red knitted hat in winter), smiling
function jpJizo(k,x,gy,s=1){k.shape(E(x,gy-3*s,15*s,5*s,12),'#BDB5AA',{w:1.3,one:1});
  k.shape([[x-11*s,gy-4*s],[x-12.5*s,gy-20*s],[x-8*s,gy-29*s],[x+8*s,gy-29*s],[x+12.5*s,gy-20*s],[x+11*s,gy-4*s]],'#D3CCC2',{w:1.5,one:1,hatch:{side:.6,gap:3,col:'#A79F94',op:.5}});
  k.shape(E(x,gy-37*s,9*s,9.4*s,14),'#DAD3C9',{w:1.5,one:1,hatch:{side:.62,gap:3,col:'#A79F94',op:.4}});
  k.shape([[x-10.5*s,gy-29.5*s],[x+10.5*s,gy-29.5*s],[x+1*s,gy-15*s]],'#E04A3C',{w:1.2,one:1,hatch:{side:.6,gap:2.6,col:'#B5322A',op:.5}});
  k.add(`<path d="M${R1(x-5*s)} ${R1(gy-37*s)}q${R1(1.6*s)} ${R1(-1.8*s)} ${R1(3.2*s)} 0M${R1(x+1.8*s)} ${R1(gy-37*s)}q${R1(1.6*s)} ${R1(-1.8*s)} ${R1(3.2*s)} 0M${R1(x-2.2*s)} ${R1(gy-32.6*s)}q${R1(2.2*s)} ${R1(1.8*s)} ${R1(4.4*s)} 0" fill="none" stroke="${C.ink}" stroke-width="${R1(Math.max(.8,1.1*s))}" stroke-linecap="round"/><ellipse cx="${R1(x-6*s)}" cy="${R1(gy-34*s)}" rx="${R1(1.6*s)}" ry="${R1(1*s)}" fill="${C.pink}" opacity=".5"/><ellipse cx="${R1(x+6*s)}" cy="${R1(gy-34*s)}" rx="${R1(1.6*s)}" ry="${R1(1*s)}" fill="${C.pink}" opacity=".5"/><path d="M${R1(x-4*s)} ${R1(gy-12*s)}q${R1(4*s)} ${R1(-4*s)} ${R1(8*s)} 0" fill="none" stroke="#A79F94" stroke-width="1"/>`);
  if(k.env.season==='winter'){const hp=[];for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI;hp.push([x+Math.cos(a)*9.6*s,gy-40*s+Math.sin(a)*9*s])}k.shape(hp,'#E04A3C',{w:1.2,one:1});let rb='';for(let i=-3;i<=3;i++)rb+=`M${R1(x+i*2.6*s)} ${R1(gy-41*s)}v${R1(-4*s)}`;k.add(`<path d="${rb}" stroke="#B5322A" stroke-width=".8"/><circle cx="${R1(x)}" cy="${R1(gy-50*s)}" r="${R1(2.8*s)}" fill="#FFFFFF" stroke="${C.ink}" stroke-width=".9"/>`)}
  else if(k.env.snow)capLine(k,[[x-8*s,gy-43*s],[x,gy-46.5*s],[x+8*s,gy-43*s]],3.5*s)}
// a stone lantern: a base, a post, the light box with its window (warm after dark), a wide roof with turned-up corners, a knob on top
function jpToro(k,x,gy,s=1){const c='#CBC4BA',cd='#A39B90';k.shape([[x-16*s,gy],[x+16*s,gy],[x+12*s,gy-8*s],[x-12*s,gy-8*s]],c,{w:1.4,one:1,hatch:{side:.6,gap:3,col:cd,op:.5}});
  k.shape(RC(x-5*s,gy-37*s,10*s,29*s),c,{w:1.4,one:1,hatch:{side:.6,gap:3,col:cd,op:.5}});k.shape([[x-14*s,gy-37*s],[x+14*s,gy-37*s],[x+11*s,gy-43*s],[x-11*s,gy-43*s]],c,{w:1.3,one:1});
  k.shape(RC(x-11*s,gy-63*s,22*s,20*s),c,{w:1.4,one:1,hatch:{side:.7,gap:3,col:cd,op:.45}});const L=k.env.lit;
  k.shape(RC(x-5*s,gy-59*s,10*s,11*s),L?'#FFD25E':'#6E665E',{w:1,one:1});
  k.shape([[x-23*s,gy-62*s],[x-17*s,gy-69*s],[x-4*s,gy-77*s],[x+4*s,gy-77*s],[x+17*s,gy-69*s],[x+23*s,gy-62*s],[x+25*s,gy-66*s],[x+20*s,gy-64*s],[x-20*s,gy-64*s],[x-25*s,gy-66*s]],c,{w:1.5,one:1,hatch:{side:.62,gap:3,col:cd,op:.55}});
  k.shape(E(x,gy-81*s,4.2*s,4.6*s,10),c,{w:1.2,one:1});k.add(`<path d="M${R1(x)} ${R1(gy-85.6*s)}v${R1(-3*s)}" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round"/><circle cx="${R1(x-6*s)}" cy="${R1(gy-20*s)}" r="${R1(1.6*s)}" fill="#9CB87A" opacity=".8"/><circle cx="${R1(x+7*s)}" cy="${R1(gy-4*s)}" r="${R1(2*s)}" fill="#9CB87A" opacity=".7"/>`);
  if(L){wlPush(k,x,`<rect x="${R1(x-5*s)}" y="${R1(gy-59*s)}" width="${R1(10*s)}" height="${R1(11*s)}" fill="#FFE9A0" opacity="${R1(.9*L)}"/>`);jpGlow(k,x,gy-53*s,30*s)}
  if(k.env.snow)capLine(k,[[x-24*s,gy-64*s],[x-4*s,gy-77*s],[x+4*s,gy-77*s],[x+24*s,gy-64*s]],5*s)}
// a koi pond: a ring of rim stones, three koi, a flat stone; lily pads in summer, petals in spring, maple leaves in autumn, a thin ice ring in winter
function jpKoi(k,x,y,L,a,kind){const c=Math.cos(a),n=Math.sin(a),P=(u,v)=>[x+u*c-v*n,y+u*n+v*c],body=[[-L*.5,0],[-L*.28,-L*.13],[0,-L*.17],[L*.32,-L*.11],[L*.5,0],[L*.32,L*.11],[0,L*.17],[-L*.28,L*.13]].map(q=>P(...q)),tail=[[-L*.44,0],[-L*.74,-L*.2],[-L*.62,0],[-L*.74,L*.2]].map(q=>P(...q));
  const base=kind===1?'#FFFBF3':kind===2?'#F7C65E':'#F28A3C';k.shape(tail,base,{w:.9,one:1});k.shape(body,base,{w:1,one:1});
  if(kind===1){const p1=P(L*.22,0),p2=P(-L*.12,-L*.03);k.add(`<ellipse cx="${R1(p1[0])}" cy="${R1(p1[1])}" rx="${R1(L*.13)}" ry="${R1(L*.09)}" fill="#E3503E"/><ellipse cx="${R1(p2[0])}" cy="${R1(p2[1])}" rx="${R1(L*.1)}" ry="${R1(L*.07)}" fill="#E3503E"/>`)}
  const fa=P(L*.05,-L*.2),fb=P(L*.05,L*.2),e1=P(L*.38,-L*.06),e2=P(L*.38,L*.06);k.add(`<path d="M${R1(P(L*.12,-L*.13)[0])} ${R1(P(L*.12,-L*.13)[1])}L${R1(fa[0])} ${R1(fa[1])}M${R1(P(L*.12,L*.13)[0])} ${R1(P(L*.12,L*.13)[1])}L${R1(fb[0])} ${R1(fb[1])}" stroke="${C.ink}" stroke-width=".9" stroke-linecap="round"/><circle cx="${R1(e1[0])}" cy="${R1(e1[1])}" r=".9" fill="${C.ink}"/><circle cx="${R1(e2[0])}" cy="${R1(e2[1])}" r=".9" fill="${C.ink}"/>`)}
function jpKoiPond(k,cx,cy,rx,ry){const so=k.env.season,w=E(cx,cy,rx,ry,18).map(q=>[q[0]+k.J(2),q[1]+k.J(1)]);
  k.fill(w,'#9FCFE6',{dx:0,dy:0,amp:.5});k.hatch(w,{gap:5,col:'#7FB5D3',op:.45,w:1.1});
  let rp='';for(let i=0;i<4;i++){const x=cx-rx*.6+k.r()*rx*1.2,y=cy-ry*.4+k.r()*ry*.8;rp+=`M${R1(x-8)} ${R1(y)}q4 -3 8 0t8 0`}k.add(`<path d="${rp}" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" opacity=".85"/>`);
  if(so==='winter'){const ir=E(cx,cy,rx*.97,ry*.9,18);k.line(ir.concat([ir[0]]),5,'#F2F6FA',{op:.75,amp:.6});k.line(ir.slice(2,9),1,'#A9BACB',{op:.8,amp:.4});k.add(`<path d="M${R1(cx-rx*.7)} ${R1(cy-ry*.3)}l9 3 5 -4M${R1(cx+rx*.5)} ${R1(cy+ry*.2)}l-7 2 -4 5" fill="none" stroke="#C9D6E2" stroke-width="1" opacity=".9"/>`)}
  [[cx-rx*.35,cy+ry*.05,20,-.3,0],[cx+rx*.15,cy-ry*.2,17,2.7,1],[cx+rx*.5,cy+ry*.25,15,.5,2]].forEach(([x,y,L,a,t])=>jpKoi(k,x,y,L,a,t));
  if(so==='summer'){[[cx-rx*.72,cy-ry*.2,9],[cx-rx*.1,cy+ry*.45,7],[cx+rx*.72,cy-ry*.1,8]].forEach(([x,y,r])=>{k.add(`<path d="M${R1(x)} ${R1(y)}L${R1(x+r)} ${R1(y-r*.12)}A${r} ${R1(r*.42)} 0 1 1 ${R1(x+r*.6)} ${R1(y-r*.38)}Z" fill="#8FC27A" stroke="${C.ink}" stroke-width="1"/>`)});flowerDot(k,cx-rx*.68,cy-ry*.36,3,'#F7B6C8')}
  if(so==='spring')[[cx-rx*.6,cy,.3],[cx,cy+ry*.3,1.9],[cx+rx*.3,cy-ry*.35,.9],[cx+rx*.75,cy+ry*.1,2.4]].forEach(([x,y,r],i)=>petalAt(k,x,y,3.4,r,PET[i%3]));
  if(so==='autumn'){momijiAt(k,cx-rx*.5,cy-ry*.25,6.2,.4,'#D9462F');momijiAt(k,cx+rx*.62,cy+ry*.3,5.4,-.6,'#E8623A')}
  // rim stones and the flat stone
  let n=0;for(let a=0;a<Math.PI*2;a+=.42+k.r()*.14,n++){if(a>.25&&a<1.1&&n%2)continue;const x=cx+Math.cos(a)*rx*1.02,y=cy+Math.sin(a)*ry*1.08,sz=5+k.r()*4;k.shape(blobP(x,y,sz*1.5,sz*.8,k.r,7,.3),n%3?'#D3CCC2':'#C2BAAF',{w:1.2,one:1})}
  k.shape(blobP(cx+rx*.82,cy-ry*.75,15,6,k.r,8,.2),'#DED6CC',{w:1.4,one:1,hatch:{side:.55,gap:3,col:'#B5AC9F',op:.5}});
  if(k.env.snow)capLine(k,[[cx-rx*.98,cy-ry*.3],[cx-rx*.5,cy-ry*1.08],[cx,cy-ry*1.15],[cx+rx*.5,cy-ry*1.08],[cx+rx*.98,cy-ry*.3]],4)}
// a bamboo fence: split green poles cut on the slant, rails of split bamboo tied with black twine (batched into a few paths)
function jpBamboo(k,x0,x1,top,gy,o={}){const pw=o.pw||9,gap=o.gap||1.4;let f1='',f2='',ol='',nd='',cu='';let i=0;
  for(let x=x0;x<x1-2;x+=pw+gap,i++){const t=top+k.J(2.4)+(i%4===1?-3:0),xa=R1(x+k.J(.3)),xb=R1(x+pw+k.J(.3)),c=pw*.62;
    const d=`M${xa} ${gy}L${xa} ${R1(t+c)}L${xb} ${R1(t)}L${xb} ${gy}Z`;if(i%2)f2+=d;else f1+=d;ol+=`M${xa} ${gy}L${xa} ${R1(t+c)}L${xb} ${R1(t)}L${xb} ${gy}`;
    cu+=`M${R1(+xa+1.2)} ${R1(t+c-1)}L${R1(+xb-1.2)} ${R1(t+1)}`;for(let y=t+18+k.r()*16;y<gy-6;y+=30+k.r()*12)nd+=`M${xa} ${R1(y)}q${R1(pw/2)} 2.2 ${R1(pw)} 0`}
  k.add(`<path d="${f1}" fill="#A6C982"/><path d="${f2}" fill="#96BD73"/><path d="${cu}" stroke="#E9E2B4" stroke-width="2.2" stroke-linecap="round"/><path d="${nd}" fill="none" stroke="#5E8A48" stroke-width="1.2"/><path d="${ol}" fill="none" stroke="${C.ink}" stroke-width="1.05" stroke-linejoin="round" opacity=".8"/>`);
  (o.rails||[top+20,gy-24]).forEach(y=>{k.shape(RC(x0-2,y-3.2,x1-x0+4,6.4),'#B7C98A',{w:1.3,one:1,hatch:{gap:6,col:'#8EA562',op:.35}});let tw='';for(let x=x0+pw*1.5;x<x1-4;x+=(pw+gap)*4)tw+=`M${R1(x-3)} ${R1(y-4.6)}l6 9.2M${R1(x+3)} ${R1(y-4.6)}l-6 9.2`;k.add(`<path d="${tw}" stroke="#2E2826" stroke-width="1.5" stroke-linecap="round"/>`)});
  if(k.env.snow)capLine(k,[[x0,top-1],[x1,top-1]],5)}
// sakura: notched five-petal flowers (batched), a pale pink crown of puffs, a small tree in bloom
function skFlowerD(x,y,r,a){let d='';for(let i=0;i<5;i++){const b=a+i*Math.PI*.4,c=Math.cos(b),n=Math.sin(b),P=(u,v)=>`${R1(x+u*c-v*n)} ${R1(y+u*n+v*c)}`;d+=`M${P(r*.1,0)}Q${P(r*.42,-r*.56)} ${P(r,-r*.24)}L${P(r*.78,0)}L${P(r,r*.24)}Q${P(r*.42,r*.56)} ${P(r*.1,0)}Z`}return d}
function jpBlossom(k,cx,cy,rx,ry,n,s=1){let d1='',d2='',dc='';for(let i=0;i<n;i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r()),x=cx+Math.cos(a)*rx*rr,y=cy+Math.sin(a)*ry*rr,r=(3.3+k.r()*1.6)*s,d=skFlowerD(x,y,r,k.r()*1.3);if(i%3)d1+=d;else d2+=d;dc+=`M${R1(x)} ${R1(y)}h.1`}
  k.add(`<path d="${d1}" fill="#FFF3F6" stroke="#D68CA0" stroke-width=".7"/><path d="${d2}" fill="#F7B6C8" stroke="#C97A90" stroke-width=".7"/><path d="${dc}" stroke="#E0697F" stroke-width="${R1(1.9*s)}" stroke-linecap="round"/>`)}
function jpPuffs(k,cx,cy,rx,ry,col,colD,flowers){[[-.42,.14,.6,.6],[.44,.16,.6,.58],[0,-.28,.7,.64],[-.06,.3,.5,.44]].forEach(([dx,dy,fx,fy])=>{const p=blobP(cx+dx*rx,cy+dy*ry,rx*fx,ry*fy,k.r,10,.2);k.fill(p,col);k.hatch(p,{side:.45,gap:4.5,col:colD,op:.55,w:1.2});k.pen(p,true,{w:1.7})});
  if(flowers)jpBlossom(k,cx,cy,rx*.9,ry*.85,Math.max(5,Math.round(rx*ry/75)),Math.min(1.2,Math.max(.7,rx/60)))}
function jpSakuraTree(k,x,gy,s=1){k.shape([[x-4*s,gy],[x-3*s,gy-30*s],[x+3*s,gy-30*s],[x+4.4*s,gy]],'#8A6A5A',{w:1.4,one:1});k.line([[x,gy-24*s],[x-12*s,gy-40*s]],1.6,'#6E5246');k.line([[x+1*s,gy-26*s],[x+13*s,gy-42*s]],1.6,'#6E5246');
  jpPuffs(k,x,gy-48*s,32*s,22*s,'#F9D3DE','#E9A2B8',1)}
const MOMI=['#D9462F','#E8623A','#C93A2A','#F08A3A'];
// a momiji leaf: seven long pointed lobes cut deep between, each edge with a small tooth (serrated, not a star), and a stem
const MJ_L=[[0,1],[.66,.9],[-.66,.9],[1.3,.7],[-1.3,.7],[2.02,.42],[-2.02,.42]].sort((a,b)=>a[0]-b[0]);
function momijiAt(k,x,y,s,rot,col){const P=(a,r)=>{const b=rot-Math.PI/2+a;return R1(x+Math.cos(b)*r*s)+' '+R1(y+Math.sin(b)*r*s)},hw=.28,pts=[];
  MJ_L.forEach(([a,L],i)=>{const w=hw*(.7+L*.3);pts.push(P(a-w*1.05,.3),P(a-w*.8,.3+(L-.3)*.4),P(a-w*.94,.3+(L-.3)*.48),P(a-w*.46,.3+(L-.3)*.76),P(a-w*.56,.3+(L-.3)*.82),P(a,L),P(a+w*.56,.3+(L-.3)*.82),P(a+w*.46,.3+(L-.3)*.76),P(a+w*.94,.3+(L-.3)*.48),P(a+w*.8,.3+(L-.3)*.4))});
  pts.push(P(Math.PI,.2));const st=rot+Math.PI/2;
  k.add(`<path d="M${pts.join('L')}Z" fill="${col}" stroke="${C.ink}" stroke-width=".6" stroke-linejoin="round"/><path d="M${R1(x)} ${R1(y)}L${R1(x+Math.cos(st)*.95*s)} ${R1(y+Math.sin(st)*.95*s)}" stroke="${C.ink}" stroke-width="1" stroke-linecap="round"/>`)}
function jpMomiji(k,cx,cy,rx,ry,n,s=1){for(let i=0;i<n;i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r());momijiAt(k,cx+Math.cos(a)*rx*rr,cy+Math.sin(a)*ry*rr,(5+k.r()*2.6)*s,k.J(.8),MOMI[i%4])}}

/* ---------- PA.JP.dress: the details per scene and strip, at 'far' (after the far hills) or 'mid' (before the foreground) ---------- */
const JP_DRESS={
  market:{far:k=>{jpPoleRow(k,[18,342],448,96,1,14);jpPoleRow(k,[657,982],448,96,1,14,[0,[.36,.44,.5]],0)},// no wires over the Boutique, where Fuji peeks over the roof
    mid:k=>jpPostBox(k,645,472,.85)},// the wires sit low enough to show over the roofs on desktop too; the post box between the Boutique door (559-629) and the lamp (662), clear of the dog
  garden:{far:k=>jpBamboo(k,150,1000,104,252,{rails:[130,222]})},
  park:{mid:k=>{const so=k.env.season;jpToro(k,34,458,.78);jpToro(k,228,462,.7);jpKoiPond(k,120,470,90,18);
    if(so==='spring'){jpPuffs(k,70,294,84,60,'#F9D3DE','#E9A2B8',1);jpPuffs(k,440,312,68,52,'#F9D3DE','#E9A2B8',1);[[180,380,.4],[300,350,1.8],[520,372,2.6],[620,340,.9]].forEach(([x,y,r],i)=>petalAt(k,x,y,4,r,PET[i%3]))}
    else if(so==='autumn'){jpPuffs(k,935,298,70,50,'#E2583E','#B83E2C');jpMomiji(k,935,298,64,44,20);[[880,380,.4],[840,430,2],[980,420,1.2]].forEach(([x,y,r],i)=>momijiAt(k,x,y,5.4,r,MOMI[i]))}}},
  river:{far:k=>{if(k.env.season==='spring')[[255,.46],[302,.52],[348,.44],[708,.48]].forEach(([x,s])=>jpSakuraTree(k,x,318,s))},
    mid:k=>{jpJizo(k,164,484,.95);if(k.env.season==='spring')[[300,372,.4],[342,404,1.9],[420,360,.9],[520,392,2.4],[560,424,1.2],[180,352,.2],[250,428,2.9]].forEach(([x,y,r],i)=>petalAt(k,x,y,3.6,r,PET[i%3]))}},
  'strip:river':{mid:k=>k.top.push(k.cap(()=>jpBamboo(k,596,764,294,333,{pw:8,rails:[306,321]})))},// on the near bank (top layer: the bank and path are drawn after 'mid'), clear of the reeds (560, 880),
  square:{far:k=>{jpPoleRow(k,[809,1006],394,104,1,12,[0,[.4,.47,.55]],0);jpPoleRow(k,[-18,207],394,108,1,12)},
    mid:k=>{jpNoren(k,138,188,323,26,2);jpVend(k,424,394,.86)}},
  cafe:{mid:k=>{// the kitchen doorway behind the counter, its noren
    k.shape(RC(570,142,58,262),'#F3D9B8',{w:2.2,one:1});k.fill(RC(574,146,50,254),'#EBC9A0',{dx:0,dy:0,op:.6});k.shape(RC(580,236,38,6),C.woodD,{w:1.2,one:1});mug(k,590,236,'#F7C5CF');mug(k,610,236,C.mint);
    jpNoren(k,572,626,146,58,2)}},
  'strip:town':{far:k=>{// two spans of wires, none across Fuji (402-602) or the sun (1000): 598-802 and 1198-1398 (= -2..198 across the seam)
    jpPoleRow(k,[598,802],300,32,1,10,[0,[.42,.5,.58]],1);k.wrap(1198,24,()=>jpPole(k,1198,300,35,1));k.wrap(198,24,()=>jpPole(k,198,300,32,1));k.wrap(1298,110,()=>jpWires(k,poleEnds(1198,35),poleEnds(1398,32),10))}},
  'strip:hilltop':{mid:k=>{jpJizo(k,612,330,.8);if(k.env.season==='autumn')k.wrap(860,48,()=>{k.shape([[856,300],[857,262],[863,262],[865,300]],'#8A6A5A',{w:1.3,one:1});jpPuffs(k,860,244,40,26,'#E2583E','#B83E2C');jpMomiji(k,860,244,36,22,10,.85)})}}
};
function jpDressDraw(k,name,layer){const f=JP_DRESS[name]&&JP_DRESS[name][layer];if(!f)return;k.add('<g class="pa-jp" pointer-events="none">');f(k);k.add('</g>')}
PA.JP={spot:jpSpot,fuji:(k,sp)=>jpFujiDraw(k,sp),dress:jpDressDraw,SPOTS:JP_SPOTS};

/* ---------- Fuji View Hill (V28 section 12.4): the hero view of Fuji over a lake, a small torii with a knee-high shrine, two stone lanterns,
   a bench facing the view, sakura and momiji, a stepping-stone path the dog stands on. Every time x weather x season and festival flag. ---------- */
const FH_BENCH=[530,454,.84];// x, ground y, scale: inside the phone crop (x 93-595 at 390 px), right of the dog
const FH_SPOT=[FH_BENCH[0],R1(FH_BENCH[1]-36*FH_BENCH[2])];// where the dog sits: the middle of the seat
function jpShimenawa(k,x0,x1,y,s=1,sag=5){const P=sagP(x0,y,x1,y,sag,12),n=P.length,th=4.6*s,f=i=>.5+.5*Math.sin(Math.PI*i/(n-1));
  const top=P.map((p,i)=>[p[0],p[1]-th*f(i)]),bot=P.map((p,i)=>[p[0],p[1]+th*f(i)]).reverse();k.shape(top.concat(bot),'#E3C989',{w:1.2,one:1});
  let d='';for(let i=1;i<n-1;i++){const p=P[i],t=th*f(i);d+=`M${R1(p[0]-t*.5)} ${R1(p[1]-t*.9)}L${R1(p[0]+t*.5)} ${R1(p[1]+t*.9)}`}k.add(`<path d="${d}" stroke="#B48F52" stroke-width="${R1(1.1*s)}" stroke-linecap="round"/>`);
  [.25,.5,.75].forEach(t=>{const p=P[Math.round(t*(n-1))];jpShide(k,p[0]-2*s,p[1]+th*.9,s*.8)});
  [.12,.38,.62,.88].forEach(t=>{const p=P[Math.round(t*(n-1))];k.line([[p[0],p[1]+th*.8],[p[0]+k.J(.8),p[1]+th*.8+7*s]],1.6*s,'#C9A55E',{amp:.2})})}
function jpTorii(k,x,gy,s=1){const V='#E2563D',VD='#B83E2C',B='#3E3533',hw=40*s,h=86*s;
  [-1,1].forEach(sg=>{const xb=x+sg*hw*.74,xt=x+sg*hw*.68;k.shape([[xb-4.2*s,gy],[xt-3.8*s,gy-h+16*s],[xt+3.8*s,gy-h+16*s],[xb+4.2*s,gy]],V,{w:1.5,one:1,hatch:{side:.6,gap:2.8,col:VD,op:.5}});k.shape(RC(xb-5.4*s,gy-8*s,10.8*s,8*s),B,{w:1,one:1})});
  k.shape(RC(x-hw*.98,gy-h+32*s,hw*1.96,6*s),V,{w:1.3,one:1,hatch:{side:.7,gap:3,col:VD,op:.45}});k.shape(RC(x-2.6*s,gy-h+18*s,5.2*s,14*s),V,{w:1.1,one:1});
  k.shape([[x-hw*1.04,gy-h+18*s],[x+hw*1.04,gy-h+18*s],[x+hw*1.08,gy-h+11*s],[x-hw*1.08,gy-h+11*s]],V,{w:1.3,one:1});
  k.shape([[x-hw*1.32,gy-h-1*s],[x-hw*.6,gy-h+3.4*s],[x,gy-h+4*s],[x+hw*.6,gy-h+3.4*s],[x+hw*1.32,gy-h-1*s],[x+hw*1.14,gy-h+11*s],[x-hw*1.14,gy-h+11*s]],B,{w:1.3,one:1});
  if(k.env.snow)capLine(k,[[x-hw*1.32,gy-h-1*s],[x,gy-h+3.6*s],[x+hw*1.32,gy-h-1*s]],4*s)}
function jpHokora(k,x,gy,s=1){const W='#C49A6C',WD='#9C7550',R='#7C8C86';k.shape(RC(x-24*s,gy-11*s,48*s,11*s),C.stone,{w:1.3,one:1,hatch:{side:.6,gap:3.4,col:C.stoneD,op:.5}});
  k.shape(RC(x-16*s,gy-44*s,32*s,33*s),W,{w:1.4,one:1,hatch:{side:.7,gap:3.2,col:WD,op:.45}});k.add(`<path d="M${R1(x)} ${R1(gy-40*s)}v${R1(27*s)}M${R1(x-12*s)} ${R1(gy-30*s)}h${R1(24*s)}M${R1(x-12*s)} ${R1(gy-22*s)}h${R1(24*s)}" stroke="${WD}" stroke-width="1"/><circle cx="${R1(x-2*s)}" cy="${R1(gy-26*s)}" r="${R1(1*s)}" fill="${C.ink}"/><circle cx="${R1(x+2*s)}" cy="${R1(gy-26*s)}" r="${R1(1*s)}" fill="${C.ink}"/>`);
  const roof=[[x-28*s,gy-42*s],[x-22*s,gy-49*s],[x,gy-64*s],[x+22*s,gy-49*s],[x+28*s,gy-42*s],[x+19*s,gy-45*s],[x-19*s,gy-45*s]];k.shape(roof,R,{w:1.4,one:1,hatch:{side:.6,gap:3,col:'#5E6E68',op:.55}});
  k.add(`<path d="M${R1(x-5*s)} ${R1(gy-68*s)}l${R1(10*s)} ${R1(8*s)}M${R1(x+5*s)} ${R1(gy-68*s)}l${R1(-10*s)} ${R1(8*s)}" stroke="${C.ink}" stroke-width="${R1(1.6*s)}" stroke-linecap="round"/>`);
  jpShimenawa(k,x-16*s,x+16*s,gy-41*s,s*.85,3*s);if(k.env.snow)capLine(k,roof.slice(0,5),4*s)}
// the tree on the right: sakura (a cloud of blossom in spring, green in summer, golden in autumn, bare in winter)
function fhSakura(k,x,gy,s){const so=k.env.season,th=[[x-9*s,gy],[x-7*s,gy-60*s],[x-1*s,gy-96*s],[x+4*s,gy-96*s],[x+6*s,gy-60*s],[x+11*s,gy]];k.shape(th,'#8A6A5A',{w:1.8,hatch:{side:.6,gap:3.4,col:'#6E5246',op:.55}});
  const br=[[[x,gy-70*s],[x-40*s,gy-112*s],[x-70*s,gy-118*s]],[[x+2*s,gy-80*s],[x+46*s,gy-128*s],[x+60*s,gy-150*s]],[[x,gy-94*s],[x-8*s,gy-140*s],[x-22*s,gy-160*s]],[[x+1*s,gy-60*s],[x+52*s,gy-84*s],[x+80*s,gy-86*s]]];br.forEach(b=>k.line(b,3.4*s,'#6E5246',{amp:.5}));
  const cr=[[x-48*s,gy-122*s,46*s,30*s],[x+40*s,gy-136*s,50*s,32*s],[x-6*s,gy-160*s,48*s,30*s],[x+64*s,gy-96*s,38*s,24*s]];
  if(so==='winter'){br.forEach(b=>k.line([b[1],[b[1][0]+k.J(14),b[1][1]-14*s]],1.4,'#6E5246'));if(k.env.snow)br.forEach(b=>capLine(k,b.slice(0,2),3))}
  else cr.forEach(([cx,cy,rx,ry])=>{if(so==='spring')jpPuffs(k,cx,cy,rx,ry,'#F9D3DE','#E9A2B8',1);else if(so==='autumn')jpPuffs(k,cx,cy,rx,ry,'#F2B25C','#C98336');else jpPuffs(k,cx,cy,rx,ry,C.leaf2,C.leafD)})}
// the small tree on the left: momiji (fresh green, deep green, red, bare)
function fhMomiji(k,x,gy,s){const so=k.env.season;k.shape([[x-5*s,gy],[x-3*s,gy-50*s],[x+3*s,gy-50*s],[x+6*s,gy]],'#7E6A60',{w:1.5,hatch:{side:.6,gap:3,col:'#5E4E46',op:.5}});
  [[[x,gy-40*s],[x-30*s,gy-62*s]],[[x,gy-46*s],[x+28*s,gy-70*s]]].forEach(b=>k.line(b,2.4*s,'#5E4E46'));
  const cr=[[x-30*s,gy-70*s,32*s,18*s],[x+26*s,gy-78*s,32*s,18*s],[x-2*s,gy-92*s,36*s,20*s]];
  if(so==='winter'){if(k.env.snow)capLine(k,[[x-30*s,gy-62*s],[x,gy-46*s],[x+28*s,gy-70*s]],3)}
  else cr.forEach(([cx,cy,rx,ry])=>{if(so==='autumn'){jpPuffs(k,cx,cy,rx,ry,'#E2583E','#B83E2C');jpMomiji(k,cx,cy,rx*.9,ry*.8,7)}else jpPuffs(k,cx,cy,rx,ry,so==='spring'?'#C9E89E':'#9ACD7C',C.leafD)})}
function sqFujihill(k){const e=k.env;
  // the desktop crop starts near y 150 here, so the whole view sits low: Fuji, the sun and the clouds all show under the HUD
  k.skyD(()=>{skyBand(k,1000,372);O.sun(k,905,196,28);O.cloud(k,215,236,20);O.cloud(k,905,300,14);O.bird(k,250,276,8);O.bird(k,272,288,6)},
    {W:1000,H:380,sun:[905,196,28],low:[935,300,30],moon:[900,196,24],clouds:[[215,236,20],[905,300,14],[90,290,14]],rainC:[[300,120,26],[700,96,28],[960,180,22]],birds:[[250,276,8],[272,288,6]],stars:56});
  k.own(rng(0x46554a49),()=>jpFujiDraw(k,jpSpot('fujihill')));
  // the far hills, a lake and a band of forest below Fuji
  const fh=[[0,342],[130,330],[270,344],[430,336],[580,346],[720,334],[870,344],[1000,332],[1000,372],[0,372]];k.fill(fh,'#C6DBC4',{dx:0,dy:0,sc:0});k.pen(fh.slice(0,8),false,{w:1.4,col:C.graph});
  k.add(`<rect x="0" y="358" width="1000" height="22" fill="${C.water}"/>`);k.line([[0,358],[1000,358]],1.2,C.graph,{op:.8});
  let lw='';for(let i=0;i<22;i++){const x=k.r()*980,y=363+k.r()*13;lw+=`M${R1(x)} ${R1(y)}q6 -4 12 0t12 0`}k.add(`<path d="${lw}" fill="none" stroke="#86BDDE" stroke-width="1.4" stroke-linecap="round"/>`);
  k.fx(()=>waterGlints(k,e.night?900:935,362,378));
  const mh=x=>384+per(x*1.2,[[5,2,.6],[3,5,1.4]]),mp=[];for(let x=0;x<=1000;x+=25)mp.push([x,mh(x)]);k.add(`<path d="${smooth(mp,false)}L1000 430L0 430Z" fill="#B8D79A"/>`);k.line(mp,1.4,C.graph,{op:.9});
  for(let x=14;x<1000;x+=34){const y=mh(x)+4+k.J(3);k.add(`<path d="${smooth(blobP(x,y,13+k.r()*4,10+k.r()*3,k.r,8,.2),true)}" fill="${k.r()<.5?'#A3C989':'#94BE7C'}" stroke="${C.graph}" stroke-width="1"/>`)}
  // the hilltop meadow we stand on
  const hill=[[0,410],[200,404],[420,412],[640,406],[860,400],[1000,404],[1000,600],[0,600]];k.fill(hill,C.grass,{dx:0,dy:0,sc:0});k.pen(hill.slice(0,6),false,{w:2.2});
  [[150,560,130,20],[560,592,140,18],[820,560,110,18]].forEach(q=>k.fill(E(q[0],q[1],q[2],q[3],12),C.grass2,{op:.7}));
  tufts(k,420,598,110);
  k.ss(()=>seasonGround(k,[0,418,1000,598],100,[[616,420,864,524],[300,440,560,520]]));
  k.fx(()=>hubFx(k,{sheen:[412,598],puddles:[[620,580,44,9],[880,540,38,8],[120,576,34,7]],patches:[[620,582,70,12],[880,544,58,10],[110,560,50,9],[300,420,46,8],[760,420,40,7],[980,470,40,7]],flies:[[160,470],[620,476],[880,560],[470,584],[760,430]]}));
  // the momiji (left) and the sakura (right) frame the view
  k.own(rng(0x4d4f4d49),()=>fhMomiji(k,44,420,1));
  k.own(rng(0x53414b55),()=>fhSakura(k,928,446,1));
  // the shrine behind the torii, the torii, two stone lanterns
  jpHokora(k,255,428,.8);k.add('<g class="pa-jp-torii">');jpTorii(k,255,448,1.8);k.add('</g>');jpToro(k,128,458,.9);jpToro(k,382,458,.9);// (v2.8.3: the torii at 1.8, taller than the dog, and still whole in the phone crop)
  // the stepping-stone path from the foreground (where the dog stands) up to the torii
  [[468,594,36,11],[430,556,33,10],[396,522,30,9],[360,494,26,8],[320,474,22,7],[284,462,18,6],[270,454,15,5],[256,449,12,4]].forEach(([x,y,rx,ry])=>{const p=blobP(x,y,rx,ry,k.r,9,.22);k.shape(p,'#DCD3C6',{w:1.6,one:1,hatch:{side:.6,gap:3.6,col:'#B5AC9F',op:.5}})});
  if(e.snow)k.side(()=>[[430,556,30],[360,494,22],[280,458,15]].forEach(([x,y,r])=>capLine(k,[[x-r,y-4],[x+r,y-4]],4)));
  // the bench, facing the view (its back to us)
  O.bench(k,FH_BENCH[0],FH_BENCH[1],FH_BENCH[2]);
  // wildflowers and the sign
  fl(k,[[40,560,C.red],[90,590,C.yellow],[210,580,C.lav],[640,588,'#FFB3C7'],[700,560,C.yellow],[880,592,C.red],[960,566,C.lav],[600,470,C.yellow],[780,470,'#FFB3C7']],5);
  signpost(k,606,408,'Mt. Fuji Lookout',150,.75);// further back, clear of the place buttons (desktop x 842-991, y 527+) and the bench
  O.tape(k,6,26,90,-24,'#F7B9C6');O.tape(k,930,566,80,-28,'#BDE7D2');
  k.ss(()=>{const so=k.so;if(so==='spring')[[300,420,.4],[520,440,1.9],[680,500,.9],[760,450,2.4],[860,520,1.2],[620,560,.2],[200,520,2.9],[100,480,1.4]].forEach(([x,y,r],i)=>petalAt(k,x,y,4,r,PET[i%3]));
    else if(so==='autumn')[[90,470,.4],[150,520,1.9],[640,520,.9],[760,470,2.4],[880,540,1.2],[300,570,.2]].forEach(([x,y,r],i)=>momijiAt(k,x,y,5.4,r,MOMI[i%4]));
    seasonDrift(k,[[700,200,1],[620,250,.9],[820,300,.85],[450,240,.8]]);if(so==='winter'&&!e.night)robin(k,610,446,1,-1);if(so==='spring'&&!e.night&&!e.rain)butterfly(k,700,420,1,'#F9C6D4')});
  k.hw(()=>{hwJack(k,592,456,.7);hwJack(k,610,460,.5);hwGhost(k,872,302,.75,16)});// v2.6-style: two pumpkins by the bench, a paper ghost hanging in the sakura
  k.lt(()=>{const b=FH_BENCH,s=b[2];ltString(k,sagP(b[0]-50*s,b[1]-70*s,b[0]+50*s,b[1]-70*s,6,10),18);ltString(k,sagP(856,334,930,326,14,10),19);ltString(k,sagP(880,300,976,304,12,10),19)});
  k.ny(()=>{nyKado(k,160,460,.8,-1);nyKado(k,350,460,.8,1);// the kadomatsu pair at the torii, a row of paper lanterns each side on bamboo poles
    k.line([[430,452],[430,342]],2.4,'#7FA65E');k.line([[54,452],[54,342]],2.4,'#7FA65E');nyChochins(k,340,352,430,344,7,3,.7);nyChochins(k,54,344,154,352,7,3,.7);
    nyKites(k,[[104,226,.85,1,30,400],[790,236,.8,0,730,404]])})}

/* ======================= API (wraps world A/B) ======================= */
const MINE={square:['Town Square',sqSquare],cafe:['Pupuccino Café',sqCafe],dogpark:['Dog Park',sqDogpark],vet:['Vet Clinic',sqVet],salon:['Grooming Salon',sqSalon],hilltop:['Hilltop Meadow',sqHilltop],pier:['Lighthouse Pier',sqPier],playroom:['Shelter Playroom',sqPlayroom],
  fujihill:['Mt. Fuji Lookout',sqFujihill,` data-spot-bench="${FH_SPOT.join(',')}"`]};// v2.8: data-spot-bench = where the dog sits on the bench (the middle of the seat)
const cacheC={};
const freshC=s=>{const suf='x'+(++_n);return s.replace(/pwc(\d+)/g,m=>m+suf)};
function renderScene(name,o){const env=mkEnv(o),key=name+'|'+env.time+'|'+env.weather+'|'+env.season+(env.hw?'|hw':'')+wnKey(env);if(cacheC[key])return freshC(cacheC[key]);
  const s=frameC(name,MINE[name][0],k=>MINE[name][1](k,o||{}),env,MINE[name][2]||'');cacheC[key]=s;return s}
function renderStrip(area,o){const env=mkEnv(o),key='strip|'+area+'|'+env.time+'|'+env.weather+'|'+env.season+(env.hw?'|hw':'')+wnKey(env);if(cacheC[key])return freshC(cacheC[key]);
  const s=strip(area,k=>{k.xl=[];lighten(k);STRIPS_C[area](k)},env);cacheC[key]=s;return s}
const prevScene=PA.scene,prevStrip=PA.walkStrip;
PA.scene=function(name,o){return MINE[name]?renderScene(name,o):(prevScene?prevScene.apply(this,arguments):'')};
PA.walkStrip=function(area,o){return STRIPS_C[area]?renderStrip(area,o):(prevStrip?prevStrip.apply(this,arguments):'')};
PA.WORLD_C_SCENES=Object.keys(MINE);PA.WORLD_C_STRIPS=Object.keys(STRIPS_C);
// v2.7: the playroom props; every other name goes to world B (and A)
const prevProp=PA.prop;
PA.prop=function(name,o){
  if(name==='adoptboard'){const n=Math.max(0,Math.min(8,Math.floor(+(o&&o.n))||0)),more=Math.max(0,Math.floor(+(o&&o.more))||0);
    return propC('ab|'+n+'|'+more,'adoptboard','Adopt me board'+(n?', '+n+' posters':'')+(more?', '+more+' more':''),300,220,k=>prAdoptBoard(k,n,more))}
  if(name==='tosstoy'){const kind=['ball','bone','ring'].includes(o&&o.kind)?o.kind:'ball';
    return propC('tt|'+kind,'tosstoy-'+kind,{ball:'Squeaky ball',bone:'Plush bone',ring:'Rope ring'}[kind],60,60,k=>prTossToy(k,kind))}
  return prevProp?prevProp.apply(this,arguments):''};
PA.WORLD_C_PROPS=['adoptboard','tosstoy'];
const cssC=`.pa-wc-scene [data-hot]{cursor:pointer;outline:none}
.pa-wc-scene .pa-wc-hit{pointer-events:all}
.pa-wc-scene .pa-wc-hl{opacity:0;pointer-events:none;transition:opacity .15s}
.pa-wc-scene [data-hot]:hover .pa-wc-hl,.pa-wc-scene [data-hot]:focus-visible .pa-wc-hl{opacity:1}`;
if(typeof document!=='undefined'&&!document.getElementById('pawart-world-c-css')){const st=document.createElement('style');st.id='pawart-world-c-css';st.textContent=cssC;document.head.appendChild(st)}
})();
