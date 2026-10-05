/* Paw Haven world art, module C (v1.6 "bigger town"): 7 hangout scenes + 3 walk strips, style G "Doodle sketch".
   Wraps PawArt.scene (square | cafe | dogpark | vet | salon | hilltop | pier) and PawArt.walkStrip (town | hilltop | pier);
   every other name is handed to the previous function. Loads AFTER world A and world B.
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
const TIMES=['dawn','day','dusk','night'],WEATHERS=['sunny','cloudy','rain','snow'];
function mkEnv(o){o=o||{};const time=TIMES.includes(o.time)?o.time:'day',weather=WEATHERS.includes(o.weather)?o.weather:'sunny';
  return {time,weather,def:time==='day'&&weather==='sunny',night:time==='night',low:time==='dawn'||time==='dusk',sunny:weather==='sunny',
    rain:weather==='rain',snow:weather==='snow',lit:time==='night'?1:time==='dusk'?.55:0}}
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
  let cur=rng(seed);const sideR=rng((seed^0x5bd1e995)>>>0);
  const r=()=>cur(),out=[],defs=[],J=a=>(r()-.5)*2*a;
  const k={r,J,out,defs,env:DEF_ENV,defs2:[],sky:[],top:[],glows:[],lamps:[],bulbs:[],glints:[],flies:[],rc:null,
    side(fn){const sv=cur;cur=sideR;try{return fn()}finally{cur=sv}},
    R(s){return k.rc?s.replace(HEXRE,k.rc):s},
    // default sky code runs as before; in a variant it still runs (discarded, keeps the stream) and the variant sky is drawn instead
    skyD(fn,cfg){if(k.env.def)fn();else{k.cap(fn);drawSky(k,cfg)}},
    fx(fn){if(!k.env.def)k.side(fn)},
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
 flower(k,x,y,s,col){k.line([[x,y+s*2.6],[x+k.J(1),y]],1.4,'#7DAE66');for(let i=0;i<5;i++){const a=i/5*Math.PI*2;k.add(`<circle cx="${R1(x+Math.cos(a)*s)}" cy="${R1(y+Math.sin(a)*s)}" r="${R1(s*.62)}" fill="${col}" stroke="${C.ink}" stroke-width="1"/>`)}k.add(`<circle cx="${x}" cy="${y}" r="${R1(s*.5)}" fill="#F7C65E" stroke="${C.ink}" stroke-width="1"/>`)},
 leafy(k,cx,cy,rx,ry,col,colD){// a scribbled leaf cluster: lumpy canopy, little "c" leaf marks, hatched underside
   const p=[];const n=11;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,kk=i%2?1.06:.9+k.r()*.06;p.push([cx+Math.cos(a)*rx*kk,cy+Math.sin(a)*ry*kk])}
   k.fill(p,col);k.hatch(p,{side:.35,gap:5,col:colD,op:.55,w:1.3});k.pen(p,true,{w:2.1});
   let d='';for(let i=0;i<Math.round(rx*ry/260);i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r())*.75,x=cx+Math.cos(a)*rx*rr,y=cy+Math.sin(a)*ry*rr;d+=`M${R1(x)} ${R1(y)}q3 -4 7 -1`}
   k.add(`<path d="${d}" fill="none" stroke="${colD}" stroke-width="1.4" stroke-linecap="round"/>`);
   if(k.env.snow)k.side(()=>{const q=[];for(let i=0;i<=8;i++){const a=Math.PI*1.12+i/8*Math.PI*.76;q.push([cx+Math.cos(a)*rx*1.02,cy+Math.sin(a)*ry*1.04])}capLine(k,q,Math.max(4,ry*.28))})},
 tree(k,x,gy,s=1,o={}){const col=o.col||C.leaf,colD=o.colD||C.leafD;
   const tw=14*s,th=70*s;k.shape([[x-tw*.6,gy],[x-tw*.45,gy-th],[x+tw*.45,gy-th],[x+tw*.7,gy]],C.trunk,{hatch:{side:.5,gap:3.5,col:C.trunkD,op:.6}});
   k.line([[x-2*s,gy-10*s],[x-1*s,gy-30*s],[x-3*s,gy-50*s]],1.2,C.trunkD);k.line([[x+3*s,gy-20*s],[x+4*s,gy-40*s]],1.2,C.trunkD);
   O.leafy(k,x-26*s,gy-th-8*s,34*s,28*s,col,colD);O.leafy(k,x+26*s,gy-th-4*s,32*s,26*s,col,colD);O.leafy(k,x,gy-th-36*s,40*s,34*s,col,colD);
   if(o.fruit)for(let i=0;i<5;i++)k.add(`<circle cx="${R1(x+(k.r()-.5)*70*s)}" cy="${R1(gy-th-20*s+(k.r()-.5)*40*s)}" r="${R1(3.6*s)}" fill="${o.fruit}" stroke="${C.ink}" stroke-width="1.2"/>`)},
 pine(k,x,gy,s=1,col=C.pine,colD=C.pineD){k.shape([[x-6*s,gy],[x-5*s,gy-30*s],[x+5*s,gy-30*s],[x+6*s,gy]],C.trunkD,{w:1.8});
   [[0,1],[1,.78],[2,.56]].forEach(([i,f])=>{const yb=gy-24*s-i*34*s,w=46*s*f,h=54*s;const p=[[x-w,yb],[x-w*.4,yb-h*.35],[x-w*.66,yb-h*.38],[x,yb-h],[x+w*.66,yb-h*.38],[x+w*.4,yb-h*.35],[x+w,yb]];k.fill(p,col);k.hatch(p,{side:.5,gap:4.5,col:colD,op:.6,w:1.2});k.pen(p,true,{w:2});
     if(k.env.snow)k.side(()=>{capLine(k,[[x-w*.32,yb-h*.71],[x,yb-h],[x+w*.32,yb-h*.71]],6*s);capLine(k,[[x-w,yb],[x-w*.42,yb-h*.34]],3.5*s);capLine(k,[[x+w*.42,yb-h*.34],[x+w,yb]],3.5*s)})})},
 bush(k,x,gy,s=1,col=C.leaf2,colD=C.leafD,berries){const p=[];for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI;p.push([x+Math.cos(a)*40*s,gy+Math.sin(a)*(i%2?30:24)*s])}k.shape(p,col,{hatch:{side:.45,gap:4.5,col:colD,op:.5}});
   let d='';for(let i=0;i<6;i++)d+=`M${R1(x+(k.r()-.5)*56*s)} ${R1(gy-6*s-k.r()*18*s)}q3 -4 7 -1`;k.add(`<path d="${d}" fill="none" stroke="${colD}" stroke-width="1.3" stroke-linecap="round"/>`);
   if(berries)for(let i=0;i<4;i++)k.add(`<circle cx="${R1(x+(k.r()-.5)*50*s)}" cy="${R1(gy-8*s-k.r()*16*s)}" r="${R1(3*s)}" fill="${berries}" stroke="${C.ink}" stroke-width="1"/>`);
   if(k.env.snow)k.side(()=>capLine(k,p.slice(1,8),6*s))},
 rock(k,x,y,s){k.shape(blobP(x,y,16*s,10*s,k.r,8,.25).map(p=>[p[0],Math.min(p[1],y+4*s)]),C.stone,{w:1.8,hatch:{side:.5,gap:4,col:C.stoneD,op:.6}})},
 board(k,x,y,w,h,col=C.wood,colD=C.woodD,pointy){// one fence board with grain and a knot
   const p=pointy?[[x,y+8],[x+w/2,y],[x+w,y+8],[x+w,y+h],[x,y+h]]:RC(x,y,w,h);k.shape(p,col,{w:1.9,wk:.5});
   const gx=x+w*(.3+k.r()*.4);k.line([[gx,y+12],[gx+k.J(2),y+h*.5],[gx+k.J(2),y+h-6]],1,colD);k.line([[x+w*.75,y+h*.3],[x+w*.72,y+h*.7]],1,colD);
   if(k.r()<.45){const ky=y+h*(.35+k.r()*.3);k.add(`<ellipse cx="${R1(x+w*.4)}" cy="${R1(ky)}" rx="2.6" ry="1.8" fill="none" stroke="${colD}" stroke-width="1.1"/>`)}
   if(k.env.snow)k.side(()=>capLine(k,pointy?[[x-1,y+8],[x+w/2,y],[x+w+1,y+8]]:[[x,y],[x+w,y]],Math.max(3,w*.2)))},
 fence(k,x0,x1,yt,yb,o={}){const bw=o.bw||26,gap=o.gap||5;k.shape(RC(x0,yt+20,x1-x0,9),C.woodD,{w:1.7,one:1});k.shape(RC(x0,yb-30,x1-x0,9),C.woodD,{w:1.7,one:1});
   for(let x=x0;x<x1-bw*.5;x+=bw+gap){const h=yb-yt+k.J(3);O.board(k,x,yb-h,bw,h,C.wood,C.woodD,true)}},
 bench(k,x,gy,s=1){k.shape(RC(x-50*s,gy-36*s,100*s,8*s),C.woodD,{w:1.8});k.shape(RC(x-50*s,gy-58*s,100*s,8*s),C.wood,{w:1.8});k.shape(RC(x-50*s,gy-70*s,100*s,8*s),C.wood,{w:1.8});
   [-42,36].forEach(dx=>{k.line([[x+dx*s,gy-28*s],[x+dx*s,gy]],3.2,C.ink);k.line([[x+(dx+4)*s,gy-74*s],[x+(dx+4)*s,gy-36*s]],2.6,C.ink)});
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

// sky colours: [top, horizon] per time, pulled toward grey by weather
const SKYT={dawn:['#F4B8CC','#FDDBB6'],day:['#C9E2F3','#E4F1F8'],dusk:['#B9A4DD','#F8B07E'],night:['#1E2954','#3A4A82']};
function skyCols(env){let [a,b]=SKYT[env.time];if(env.sunny)return[a,b];
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
  else if(show!=='none'){const sp=env.low?cfg.low:cfg.sun;ww(sp[0],sp[2]*2.8,()=>{
      if(env.low){const g=glowGrad(k,env.time==='dawn'?'#FFD9A8':'#FFB27A','sun'+env.time);k.add(`<circle cx="${sp[0]}" cy="${sp[1]}" r="${R1(sp[2]*3.2)}" fill="url(#${g})"/>`)}
      O.sun(k,sp[0],sp[1],sp[2],env.time==='dawn'?'#FDD68E':env.time==='dusk'?'#F9AE6E':env.snow?'#FBEFC8':C.sun)});
    if(show==='peek')peek=sp}
  let cl=[];if(!env.sunny){cl=cfg.clouds.slice();if(env.rain)cl=cl.concat(cfg.rainC||[]).map(c=>[c[0],c[1],c[2]*1.2])}else if(env.low)cl=cfg.clouds.slice(0,2);
  cl.forEach(([x,y,s])=>ww(x,s*1.7,()=>cloudV(k,x,y,s,cc)));
  if(peek){const [x,y,r]=peek;ww(x+r*.5,r*1.9,()=>cloudV(k,x+r*.55,y+r*.5,r*(env.night?.8:.95),cc))}
  if(cfg.birds&&!env.night&&!env.rain)cfg.birds.forEach(([x,y,s])=>ww(x,s+2,()=>O.bird(k,x,y,s)));
}))})}

// colour treatment for the base art: weather mutes/greys, snow pales the greens, time shifts toward warm or navy
function recolorFn(env,kind){if(env.def)return null;
  const sc=kind==='map'?.5:1,inn=kind==='in';
  const Wt={sunny:null,cloudy:{ds:.2,m:'#B7C0CA',a:.10},rain:{ds:.3,m:'#8592A3',a:.18},snow:{ds:.12,m:'#E9EEF3',a:.10,gr:.5}}[env.weather];
  const Tt=inn?{dawn:{m:'#F3B2A8',a:.06},day:null,dusk:{m:'#E0957E',a:.1},night:{m:'#433A62',a:.26,ds:.12}}[env.time]
    :{dawn:{m:'#F2A6A6',a:.12},day:null,dusk:{m:'#C98698',a:.18,ds:.05},night:{m:'#25325E',a:kind==='strip'?.42:.46,ds:.22}}[env.time];
  const ws=inn?.4:1,memo={},EX={'#FFFFFE':1,'#5B3D33':1};
  return m=>{let u=m.toUpperCase();if(u.length===4)u='#'+u[1]+u[1]+u[2]+u[2]+u[3]+u[3];if(EX[u])return m;if(memo[u])return memo[u];let c=h2c(u);
    const ap=(o,f)=>{if(!o)return;if(o.gr&&c[1]>c[0]+6&&c[1]>=c[2])c=c.map((v,i)=>v+(h2c('#EEF3EA')[i]-v)*o.gr*sc);
      if(o.ds){const L=.3*c[0]+.59*c[1]+.11*c[2];c=c.map(v=>v+(L-v)*o.ds*f*sc)}const t=h2c(o.m);c=c.map((v,i)=>v+(t[i]-v)*o.a*f*sc)};
    ap(Wt,ws);ap(Tt,1);return memo[u]=c2h(c)}}

// lights drawn on top of the treated art: lit windows, lamp halos, string-light bulbs, water glints, fireflies
function lightsLayer(k,W,wrap){const env=k.env,L=env.lit;let s='';
  const add=(x,rr,str)=>{s+=str;if(wrap){if(x-rr<0)s+=`<g transform="translate(${W} 0)">${str}</g>`;if(x+rr>W)s+=`<g transform="translate(${-W} 0)">${str}</g>`}};
  k.side(()=>{
  if(L){const wg=glowGrad(k,'#FFD877','warm');
    k.glows.forEach(([x,y,w,h])=>add(x+w/2,w,`<rect x="${R1(x-12)}" y="${R1(y-12)}" width="${R1(w+24)}" height="${R1(h+24)}" rx="14" fill="#FFD36E" fill-opacity="${R1(.16*L)}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#FFD25E" fill-opacity="${R1((w>100?.4:.6)*L)}"/><path d="M${R1(x+w*.18)} ${R1(y+h*.7)}l${R1(w*.22)} ${R1(-h*.34)}" stroke="#FFF6D0" stroke-width="3" stroke-linecap="round" opacity="${R1(.8*L)}"/>`));
    k.lamps.forEach(l=>{const g=l.glass,gd='M'+g.map(p=>R1(p[0])+' '+R1(p[1])).join('L')+'Z',rr=74*l.s;let rays='';for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.2,r0=22*l.s,r1=(30+(i%2)*8)*l.s;rays+=`M${R1(l.x+Math.cos(a)*r0)} ${R1(l.y+Math.sin(a)*r0)}L${R1(l.x+Math.cos(a)*r1)} ${R1(l.y+Math.sin(a)*r1)}`}
      add(l.x,rr,`${l.big?`<ellipse cx="${R1(l.x)}" cy="${R1(l.y+120)}" rx="${R1(rr*2.8)}" ry="${R1(rr*2.4)}" fill="url(#${wg})" opacity="${R1(.42*L)}"/>`:''}<circle cx="${R1(l.x)}" cy="${R1(l.y)}" r="${R1(rr)}" fill="url(#${wg})" opacity="${R1(L)}"/>${l.gy?`<ellipse cx="${R1(l.x)}" cy="${R1(l.gy+2)}" rx="${R1(46*l.s)}" ry="${R1(8*l.s)}" fill="#FFE08A" opacity="${R1(.35*L)}"/>`:''}<circle cx="${R1(l.x)}" cy="${R1(l.y)}" r="${R1(rr*.62)}" fill="none" stroke="#FFE7A0" stroke-width="1.6" stroke-dasharray="7 9" opacity="${R1(.75*L)}"/><path d="${rays}" stroke="#FFE7A0" stroke-width="2" stroke-linecap="round" opacity="${R1(.85*L)}"/><path d="${gd}" fill="#FFF2B0" stroke="#4A3A40" stroke-width="1.6" stroke-linejoin="round"/>`)});
    k.bulbs.forEach(([x,y,c])=>add(x,14,`<circle cx="${R1(x)}" cy="${R1(y)}" r="14" fill="url(#${wg})" opacity="${R1(L)}"/><circle cx="${R1(x)}" cy="${R1(y)}" r="4.5" fill="${c}"/>`))}
  k.glints.forEach(([x,y0,y1,col,st])=>{let d='';for(let y=y0;y<y1;y+=6){const t=(y-y0)/(y1-y0),wd=(8+t*34)*(.6+k.r()*.6),ox=k.J(8+t*10);d+=`M${R1(x+ox-wd/2)} ${R1(y)}h${R1(wd)}`}add(x,40,`<path d="${d}" stroke="${col}" stroke-width="2.4" stroke-linecap="round" opacity="${R1(.85*st)}"/>`)});
  k.flies.forEach(([x,y])=>{const g=glowGrad(k,'#E9FF9A','fly');add(x,12,`<circle cx="${R1(x)}" cy="${R1(y)}" r="11" fill="url(#${g})"/><circle cx="${R1(x)}" cy="${R1(y)}" r="2.4" fill="#F6FFB8"/><path d="M${R1(x-4)} ${R1(y-4)}q-3 -4 -6 -1M${R1(x+4)} ${R1(y-4)}q3 -4 6 -1" fill="none" stroke="#F6FFB8" stroke-width="1" opacity=".7"/>`)});
  });
  return s?`<g pointer-events="none">${s}</g>`:''}
function assemble(k,pp,W,open,wrap){
  const R=s=>k.R(s),lights=k.env.def?'':lightsLayer(k,W,wrap);
  return `${open}<defs>${R(k.defs.join(''))}${k.defs2.join('')}</defs>${R(pp.bg)}${k.sky.join('')}${R(k.out.join(''))}${k.top.length?`<g pointer-events="none">${R(k.top.join(''))}</g>`:''}${lights}${k.xl&&k.xl.length?`<g pointer-events="none">${k.xl.join("")}</g>`:""}${pp.tooth}</svg>`}
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
  k.fill(hill,env.snow?'#FFFFFF':env.night?'#55705E':'#BFDDA0',{dx:0,dy:0});k.pen(hill.slice(0,4),false,{w:1.6,col:env.snow?'#8EA2B8':C.ink});
  if(!env.snow)O.pine(k,x+w*.18,y+h*.86,.32,env.night?'#4C6A5A':C.pine,env.night?'#3A5246':C.pineD);else O.pine(k,x+w*.18,y+h*.86,.32);
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
function mTree(k,x,y,s,col){k.add(`<path d="M${x} ${R1(y+10*s)}V${y}" stroke="${C.trunkD}" stroke-width="2"/><path d="${smooth(blobP(x,y-6*s,14*s,12*s,k.r,8,.18),true)}" fill="${col||C.leaf}" stroke="${C.ink}" stroke-width="1.4"/>`)}
function mPine(k,x,y,s,col){k.add(`<path d="M${x} ${y}v${R1(6*s)}" stroke="${C.trunkD}" stroke-width="2"/>`);mOut(k,[[x-14*s,y],[x+k.J(1),y-34*s],[x+14*s,y]],col||C.pine,1.4)}
/* ---------- walk strips: seamless, light (no filter, no clips per object beyond hatching) ---------- */
function strip(area,draw,env){
  const k=kit(hashS('pwc-strip-'+area));k.env=env||DEF_ENV;k.rc=recolorFn(k.env,'strip');const pp=paperDefs(k,1200,400);
  // wrap(x, halfWidth, fn): draw once, and again shifted by 1200 if it crosses an edge
  k.wrap=(x,hw,fn)=>{const s=k.cap(fn);k.add(s);if(x-hw<0)k.add(`<g transform="translate(1200 0)">${s}</g>`);if(x+hw>1200)k.add(`<g transform="translate(-1200 0)">${s}</g>`)};
  // a long edge drawn as overlapping wrapped segments so it matches at x=0 and x=1200
  k.edge=(yf,w,col)=>{[[-40,430],[380,830],[780,1240]].forEach(([a,b])=>k.wrap((a+b)/2,(b-a)/2,()=>{const pts=[];for(let x=a;x<=b;x+=20)pts.push([x,yf(x)]);k.pen(pts,false,{w,col,amp:.6})}))};
  draw(k);
  const ex=k.env.def?'':` data-time="${k.env.time}" data-weather="${k.env.weather}"`;
  return assemble(k,pp,1200,`<svg class="pa-wc-strip pa-wc-strip-${area}" viewBox="0 0 1200 400" role="img" aria-label="${area} walking strip${k.env.def?'':`, ${k.env.time}, ${k.env.weather}`}"${ex}>`,true);
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
function signpost(k,x,gy,txt,w=120){k.line([[x,gy],[x+k.J(1),gy-96]],4,C.ink);const b=RC(x-w/2,gy-112,w,38);k.shape(b,C.wood,{w:2,hatch:{side:.8,gap:4,col:C.woodD,op:.4}});k.text(txt,x,gy-85,24,{rot:-2});
  if(k.env.snow)k.side(()=>capLine(k,[[x-w/2-2,gy-112],[x+w/2+2,gy-112]],6))}
function tagLabel(k,x,y,txt,rot=-8){return k.cap(()=>{const w=txt.length*8.6+22;k.add(`<g transform="rotate(${rot} ${x} ${y})">`);k.line([[x-w/2-12,y-14],[x-w/2+2,y]],1.2,C.ink,{op:.8});
  k.shape([[x-w/2,y-11],[x+w/2,y-11],[x+w/2,y+11],[x-w/2,y+11],[x-w/2-10,y]],'#FFD8E0',{w:1.6,one:1});k.add(`<circle cx="${R1(x-w/2-3)}" cy="${y}" r="2.2" fill="#FFFBF3" stroke="${C.ink}" stroke-width="1"/>`);k.text(txt,x+3,y+6,18);k.add('</g>')})}
// appended hotspot: transparent hit, hover outline, label tag (the base art is untouched)
function hotTag(k,attr,val,label,rc,tx,ty,rot){hot(k,attr,val,label,rc,tagLabel(k,tx,ty,label.toLowerCase(),rot))}
/* ===== world C ===== */
// shared overlay zones (same as the world A hubs): dog x300-560 ground y~500, bowl (250,520), right decor x620-860 y330-520
const INDOOR={cafe:1,vet:1,salon:1};
// long outlines are resampled a little coarser (same wobble and taper), which keeps big scenes under ~300 KB
function lighten(k){const pen0=k.pen;k.pen=(pts,closed,o={})=>{if(!o.step){let L=0;const n=pts.length,m=closed?n:n-1;for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n];L+=Math.hypot(b[0]-a[0],b[1]-a[1])}if(L>260)o=Object.assign({},o,{step:L>1200?15:L>600?12:9})}return pen0(pts,closed,o)}}
function frameC(name,label,body,env){
  const k=kit(hashS('pwc-'+name));lighten(k);k.env=env||DEF_ENV;k.xl=[];k.rc=recolorFn(k.env,INDOOR[name]?'in':'out');const pp=paperDefs(k,1000,600);
  body(k);
  const ex=k.env.def?'':` data-time="${k.env.time}" data-weather="${k.env.weather}"`;
  return assemble(k,pp,1000,`<svg class="pa-wc-scene pa-wc-${name}" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}${k.env.def?'':`, ${k.env.time}, ${k.env.weather}`}"${ex}>`,false);
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
  k.line([[x,gy-30*s],[x+k.J(1),gy-70*s]],3.4,C.trunkD);O.leafy(k,x,gy-92*s,30*s,28*s,C.leaf,C.leafD)}

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
  k.shape(RC(x-4,base-6,w+8,8),C.stoneD,{w:1.5,one:1})}
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
  // shopfronts behind the square
  shopF(k,-14,214,176,394,{wall:C.wall2,noGlow:1,sign:'Bone Appétit',awn:[C.red,'#fff'],door:'#E8A9B8',upper:2,disp:(x,y,w,h)=>{[[x+24,y+h-14],[x+56,y+h-14],[x+88,y+h-14]].forEach(([bx,by],i)=>{k.shape(E(bx,by,13,7,10),'#F0D9B5',{w:1.3,one:1});if(i!==1)donut(k,bx,by-9,.9,i?'#FFB3C7':C.lav);else{k.shape([[bx-9,by-4],[bx+9,by-4],[bx+7,by-18],[bx-7,by-18]],'#F7C5CF',{w:1.3,one:1});k.shape(E(bx,by-20,9,6,10),'#FFFBF3',{w:1.2,one:1})}})}});
  shopF(k,214,290,206,394,{wall:C.wall,brick:1,sign:'Paws &amp; Pages',awn:[C.mint,'#fff'],door:'#B9D3F2',upper:3,curt:C.mint,disp:(x,y,w,h)=>{let bx=x+16;const cs=[C.red,C.blue,C.yellow,C.lav,C.mint,C.orange];for(let i=0;i<9;i++){const bw=10+(i*7%6),bh=28+(i*11%14);k.shape(RC(bx,y+h-bh-4,bw,bh),cs[i%6],{w:1.2,one:1});bx+=bw+3}k.text('(dogs read too)',x+w-60,y+h-8,13,{wt:600,rot:-3})}});
  shopF(k,616,186,190,394,{wall:C.wall3,sign:'Post Office',awn:[C.blue,'#fff'],door:'#E57E83',upper:2,curt:C.yellow,signCol:'#FFFFFF',disp:(x,y,w,h)=>{k.shape(RC(x+14,y+h-34,40,26),'#FFFBF3',{w:1.3,one:1});k.line([[x+14,y+h-34],[x+34,y+h-20],[x+54,y+h-34]],1.2);O.heart(k,x+34,y+h-18,4)}});
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
   if(k.env.snow)k.side(()=>{capLine(k,[[tx-56,68],[tx,7],[tx+56,68]],10)})}
  // bunting from the tower to the edges
  buntingL(k,0,516,150,26,[C.red,C.yellow,C.mint,C.lav,C.blue]);buntingL(k,604,1000,150,22,[C.yellow,C.mint,C.lav,C.blue,C.red]);
  // the square: perspective flagstones, a cobble ring around the fountain
  k.fill([[0,394],[1000,394],[1000,600],[0,600]],'#E8E1D6',{dx:0,dy:0,sc:0});k.pen([[0,396],[500,394],[1000,396]],false,{w:2});
  paving(k,396,600,500,250,'#BFB2A2','#DDD4C8');
  k.fx(()=>{if(k.env.rain){sheen(k,0,1000,404,598,64,HZ);[[450,580,48,9],[760,562,40,8],[930,476,30,6],[60,560,34,7]].forEach(q=>puddle(k,...q))}
    if(k.env.snow){[[450,580,74,13],[760,566,62,11],[934,478,46,9],[70,566,50,9],[300,420,50,8]].forEach(q=>snowPatch(k,...q))}});
  // benches against the shops, lamp posts
  O.bench(k,346,424,.82);O.lamp(k,598,428,1);O.lamp(k,266,410,.9);
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
   const arc=[];for(let i=0;i<=12;i++){const t=i/12;arc.push([fx+48+t*54,288-Math.sin(t*Math.PI*.62)*30+t*t*156])}k.line(arc,6,'#9CCDE8',{amp:.3});k.line(arc,2.4,'#FFFFFF',{amp:.3});
   {const px=fx+14,py=246;k.shape(E(px,py,10,7,10),'#B7B5C9',{w:1.5,one:1});k.shape(E(px+8,py-7,5,5,8),'#B7B5C9',{w:1.4,one:1});k.add(`<path d="M${px+13} ${py-7}l4 1 -4 2z" fill="${C.orange}"/><circle cx="${px+9}" cy="${py-8}" r="1.1" fill="${C.ink}"/><path d="M${px-3} ${py+6}v3M${px+3} ${py+6}v3" stroke="#E8945A" stroke-width="1.4"/>`)}
   k.add('</g>');
   k.add(`<circle cx="${fx+100}" cy="446" r="2.4" fill="#BEE0F2" stroke="#6F8FA8" stroke-width=".9"/><circle cx="${fx+112}" cy="440" r="1.8" fill="#BEE0F2" stroke="#6F8FA8" stroke-width=".9"/><circle cx="${fx+90}" cy="438" r="1.6" fill="#BEE0F2" stroke="#6F8FA8" stroke-width=".9"/><path d="M${fx+84} 452q16 -8 32 0" fill="none" stroke="#fff" stroke-width="1.6"/>`);
   if(k.env.snow)k.side(()=>{capLine(k,E(fx,450,106,27,20).slice(10,20).concat([[fx+106,450]]),7);capLine(k,[[fx-27,376],[fx+27,376]],6);capLine(k,[[fx+4,294],[fx+24,290],[fx+42,298]],5)})}
  // the town notice board (right decor zone, data-hot="notice")
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
   if(k.env.snow)k.side(()=>{capLine(k,[[0,yt+4],[470,yt+4]],5);capLine(k,[[540,yt+4],[1000,yt+4]],5);capLine(k,[[424,yt-82],[588,yt-82]],7)})}
  // a big tree behind the fence (right) and the rules sign
  O.tree(k,880,408,1.3,{fruit:'#F49090'});
  {const x=700,gy=410;k.line([[x,gy],[x,gy-62]],3.4,C.ink);k.shape(RC(x-50,gy-110,100,54),'#FFFFFF',{w:1.9});k.text('Park rules:',x,gy-92,15);k.text('1. sniff',x-2,gy-78,13,{wt:600});k.text('2. see rule 1',x,gy-64,13,{wt:600});if(k.env.snow)k.side(()=>capLine(k,[[x-52,gy-110],[x+52,gy-110]],5))}
  // benches along the fence
  O.bench(k,300,418,.8);O.bench(k,620,416,.72);
  tufts(k,420,598,110);
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
  fl(k,[[40,560,C.red],[70,590,C.yellow],[180,580,C.lav],[600,588,'#FFB3C7'],[640,560,C.yellow],[880,590,C.red],[960,560,C.lav],[990,520,C.yellow],[200,448,C.red],[580,440,C.lav],[880,520,'#FFB3C7'],[270,590,C.yellow],[230,430,C.yellow]],5);
  O.sparkle(k,440,200,7);O.heart(k,820,250,6);O.note(k,380,60,11);
  O.tape(k,6,26,90,-24,'#F7B9C6');O.tape(k,930,566,80,-28,'#BDE7D2');
}

// ---------- Lighthouse Pier ----------
function sqPier(k){
  k.skyD(()=>{skyBand(k,1000,264);O.sun(k,860,70,30);O.cloud(k,420,64,24);O.cloud(k,700,110,18)},
    {W:1000,H:274,sun:[860,70,30],low:[640,250,36],moon:[860,74,26],clouds:[[420,64,24],[700,112,18],[960,170,16]],rainC:[[260,40,28],[580,30,26],[900,60,24]],birds:[],stars:44});
  // the sea
  k.add(`<rect y="262" width="1000" height="150" fill="${C.water}"/><rect y="262" width="1000" height="24" fill="#A9D3EC" opacity=".7"/>`);k.pen([[0,263],[500,262],[1000,263]],false,{w:1.6,col:C.graph});
  let wv='';for(let i=0;i<44;i++){const x=k.r()*980,y=276+k.r()*120;wv+=`M${R1(x)} ${R1(y)}q7 -6 14 0t14 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`);
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
   if(k.env.snow)k.side(()=>capLine(k,[[0,rt],[1000,rt]],6));
   // life ring on the rail (behind the dog area, left)
   const lx=260,ly=372;k.add(`<circle cx="${lx}" cy="${ly}" r="22" fill="none" stroke="${C.ink}" stroke-width="13"/><circle cx="${lx}" cy="${ly}" r="22" fill="none" stroke="#FFFFFF" stroke-width="10"/><circle cx="${lx}" cy="${ly}" r="22" fill="none" stroke="${C.red}" stroke-width="10" stroke-dasharray="17.3 17.3"/>`)}
  // the boardwalk deck in perspective
  {k.fill([[0,404],[1000,404],[1000,600],[0,600]],'#EBCDA4',{dx:0,dy:0,sc:0});const rows=[];let y=404,h=14;while(y<600){rows.push(y);y+=h;h*=1.12}
   let d='',f='';rows.forEach((yy,i)=>{d+=`M0 ${R1(yy+k.J(.8))}L1000 ${R1(yy+k.J(.8))}`;const nh=(rows[i+1]||600)-yy,sp=nh*9;for(let x=(i*137)%sp-sp;x<1000;x+=sp)d+=`M${R1(x)} ${R1(yy)}v${R1(nh)}`;if(i%2)f+=`<rect x="0" y="${R1(yy)}" width="1000" height="${R1(nh)}" fill="#E2BE90" opacity=".45"/>`;
     let nl='';for(let x=(i*61)%90+20;x<1000;x+=150)nl+=`<circle cx="${R1(x)}" cy="${R1(yy+nh/2)}" r="1.4" fill="${C.ink}" opacity=".55"/>`;f+=nl});
   k.add(f+`<path d="${d}" stroke="${C.woodD}" stroke-width="1.4" fill="none"/>`);k.pen([[0,405],[500,404],[1000,405]],false,{w:2})}
  k.fx(()=>hubFx(k,{sheen:[410,598],puddles:[[450,580,44,9],[760,568,38,8],[120,470,30,6]],patches:[[450,582,70,12],[760,570,60,11],[120,470,46,8],[920,440,40,7],[300,596,44,8]]}));
  // lamp post on the pier
  O.lamp(k,588,412,1);
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
}

/* ======================= WALK STRIPS ======================= */
const SKYW={
  town:{W:1200,H:240,sun:[1000,60,26],low:[990,190,30],moon:[1000,56,22],clouds:[[260,50,22],[640,72,18],[1110,40,18]],rainC:[[440,40,26],[860,52,26]],birds:[[420,80,8],[444,90,6]],stars:30},
  hilltop:{W:1200,H:250,sun:[880,70,30],low:[860,210,32],moon:[880,64,24],clouds:[[200,60,22],[560,96,18],[1080,56,20]],rainC:[[400,40,26],[780,48,26]],birds:[[640,86,8],[662,96,6]],stars:44},
  pier:{W:1200,H:190,sun:[700,64,28],low:[700,170,30],moon:[700,58,22],clouds:[[180,50,22],[520,80,18],[1000,46,20]],rainC:[[360,40,26],[820,56,24]],stars:36}};
const STRIPS_C={
 town(k){
  k.skyD(()=>k.add(`<rect width="1200" height="240" fill="${C.sky}" fill-opacity=".7"/>`),SKYW.town);
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
 },
 hilltop(k){
  k.skyD(()=>k.add(`<rect width="1200" height="250" fill="${C.sky}" fill-opacity=".7"/>`),SKYW.hilltop);
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
  {const fx=[];for(let x=40;x<1200;x+=100)fx.push(x);fx.forEach(x=>k.wrap(x,10,()=>{k.shape(RC(x-5,284,10,44),C.wood,{w:1.7,one:1,hatch:{gap:4,col:C.woodD,op:.5}});if(k.env.snow)k.side(()=>capLine(k,[[x-6,284],[x+6,284]],4))}));
   [[292],[310]].forEach(([y])=>{k.add(`<rect y="${y}" width="1200" height="6" fill="${C.wood}"/>`);k.edge(x=>y+per(x,[[1,4,y]]),1.4);k.edge(x=>y+6+per(x,[[1,4,y]]),1.2)});
   if(k.env.snow)k.side(()=>{[[0,600],[600,1200]].forEach(([a,b])=>capLine(k,[[a,292],[b,292]],4))})}
  [[90,C.red],[180,C.yellow],[420,C.lav],[560,'#FFB3C7'],[690,C.yellow],[880,C.red],[1060,C.lav],[1150,C.yellow]].forEach(([x,c])=>k.wrap(x,10,()=>O.flower(k,x,318,4.5,c)));
  // trail
  k.add(`<rect y="330" width="1200" height="70" fill="#E9D6B0"/>`);k.edge(x=>330+per(x,[[2,6,.5]]),2.2);
  let tf='';for(let x=14;x<1200;x+=40)tf+=`M${x} 330q1 -7 -1 -11M${x+5} 330q0 -8 3 -13`;k.add(`<path d="${tf}" fill="none" stroke="${C.grassD}" stroke-width="1.5" stroke-linecap="round"/>`);
  let pb='';for(let i=0;i<36;i++){const x=(i*37)%1200+4,y=348+(i*23%44);pb+=`<ellipse cx="${x}" cy="${y}" rx="${2+(i%3)}" ry="1.6" fill="#D2BC94"/>`}k.add(pb);
  k.fx(()=>{stripFx(k,{y0:338,y1:396,kind:'path',ns:5});if(k.env.night&&!k.env.rain)[[150,270],[460,250],[700,280],[980,262],[1120,290]].forEach(f=>k.flies.push(f))});
  k.wrap(620,10,()=>O.sparkle(k,620,150,7));
 },
 pier(k){
  k.skyD(()=>k.add(`<rect width="1200" height="190" fill="${C.sky}" fill-opacity=".75"/>`),SKYW.pier);
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
   if(k.env.snow)k.side(()=>{[[0,600],[600,1200]].forEach(([a,b])=>capLine(k,[[a,rt],[b,rt]],4))});
   k.wrap(450,24,()=>{const lx=450,ly=284;k.add(`<circle cx="${lx}" cy="${ly}" r="16" fill="none" stroke="${C.ink}" stroke-width="10"/><circle cx="${lx}" cy="${ly}" r="16" fill="none" stroke="#FFFFFF" stroke-width="7.5"/><circle cx="${lx}" cy="${ly}" r="16" fill="none" stroke="${C.red}" stroke-width="7.5" stroke-dasharray="12.6 12.6"/>`)})}
  // seagull posts (taller pilings) behind the path
  [[180],[780]].forEach(([x])=>k.wrap(x,30,()=>{k.shape([[x-11,326],[x-11,234],[x+11,234],[x+11,326]],C.trunk,{w:1.8,hatch:{side:.55,gap:4,col:C.trunkD,op:.6}});k.shape(E(x,234,11,3.4,10),'#E7C79E',{w:1.4});k.line([[x-11,262],[x+11,265]],2,'#C9B48C');gull(k,x,234,.8,x>500)}));
  // planks as the walking ground
  k.add(`<rect y="330" width="1200" height="70" fill="#EBCDA4"/>`);k.edge(x=>331+per(x,[[1,6,.4]]),2.2);
  {let d='',f='';[[330,18],[348,24],[372,28]].forEach(([y,h],i)=>{d+=`M0 ${y+h}H1200`;const sp=[120,150,200][i];for(let x=(i*53)%sp;x<1200;x+=sp)d+=`M${x} ${y}v${h}`;if(i===1)f+=`<rect y="${y}" width="1200" height="${h}" fill="#E2BE90" opacity=".45"/>`;for(let x=(i*37)%100+30;x<1200;x+=150)f+=`<circle cx="${x}" cy="${y+h/2}" r="1.4" fill="${C.ink}" opacity=".5"/>`});k.add(f+`<path d="${d}" stroke="${C.woodD}" stroke-width="1.4"/>`)}
  {let d='';for(let x=0;x<1200;x+=100)d+=`M${x} 300v30`;k.add(`<path d="${d}" stroke="${C.woodD}" stroke-width="1.2"/>`)}
  k.fx(()=>stripFx(k,{y0:338,y1:396,kind:'path',ns:5}));
  k.wrap(560,10,()=>O.sparkle(k,560,130,7));
 }
};

/* ======================= API (wraps world A/B) ======================= */
const MINE={square:['Town Square',sqSquare],cafe:['Pupuccino Café',sqCafe],dogpark:['Dog Park',sqDogpark],vet:['Vet Clinic',sqVet],salon:['Grooming Salon',sqSalon],hilltop:['Hilltop Meadow',sqHilltop],pier:['Lighthouse Pier',sqPier]};
const cacheC={};
const freshC=s=>{const suf='x'+(++_n);return s.replace(/pwc(\d+)/g,m=>m+suf)};
function renderScene(name,o){const env=mkEnv(o),key=name+'|'+env.time+'|'+env.weather;if(cacheC[key])return freshC(cacheC[key]);
  const s=frameC(name,MINE[name][0],k=>MINE[name][1](k,o||{}),env);cacheC[key]=s;return s}
function renderStrip(area,o){const env=mkEnv(o),key='strip|'+area+'|'+env.time+'|'+env.weather;if(cacheC[key])return freshC(cacheC[key]);
  const s=strip(area,k=>{k.xl=[];lighten(k);STRIPS_C[area](k)},env);cacheC[key]=s;return s}
const prevScene=PA.scene,prevStrip=PA.walkStrip;
PA.scene=function(name,o){return MINE[name]?renderScene(name,o):(prevScene?prevScene.apply(this,arguments):'')};
PA.walkStrip=function(area,o){return STRIPS_C[area]?renderStrip(area,o):(prevStrip?prevStrip.apply(this,arguments):'')};
PA.WORLD_C_SCENES=Object.keys(MINE);PA.WORLD_C_STRIPS=Object.keys(STRIPS_C);
const cssC=`.pa-wc-scene [data-hot]{cursor:pointer;outline:none}
.pa-wc-scene .pa-wc-hit{pointer-events:all}
.pa-wc-scene .pa-wc-hl{opacity:0;pointer-events:none;transition:opacity .15s}
.pa-wc-scene [data-hot]:hover .pa-wc-hl,.pa-wc-scene [data-hot]:focus-visible .pa-wc-hl{opacity:1}`;
if(typeof document!=='undefined'&&!document.getElementById('pawart-world-c-css')){const st=document.createElement('style');st.id='pawart-world-c-css';st.textContent=cssC;document.head.appendChild(st)}
})();
