/* Paw Haven world art, module A: scenes + walk strips, style G "Doodle sketch".
   PawArt.scene(name, o)  name: yard | market | shelter | map   (viewBox 0 0 1000 600, xMidYMid slice)
   PawArt.walkStrip(area) area: park | river | woods | beach  (viewBox 0 0 1200 400, ground y=330, seamless)
   Everything is drawn on warm sketchbook paper: coloured-pencil fills that drift off the lines,
   two-stroke tapered pencil outlines, hatching, Caveat labels, washi tape, sparkles.
   No filters at all: the paper grain is a seeded speck <pattern>, so scenes stay cheap to composite. */
window.PawArt = window.PawArt || {};
(function(){
'use strict';
const PA=window.PawArt;
const C={ink:'#5B3D32',graph:'#A8968A',paper:'#FFFBF3',dot:'#E3D2BA',pink:'#F28FA5',
  sky:'#D3E9F6',sky2:'#E6F2F8',cloud:'#FFFFFF',sun:'#FDE49A',grass:'#CBE5A6',grass2:'#B4D98E',grassD:'#93C276',
  leaf:'#B9DD92',leaf2:'#9ACD7C',leafD:'#7FB86A',pine:'#8CC09A',pineD:'#6FA483',trunk:'#C9A07A',trunkD:'#A97E5A',
  wood:'#EBCDA4',woodD:'#CFA77C',roof:'#EBA48C',roofD:'#D88870',wall:'#FCE6CC',wall2:'#F9D9DE',wall3:'#D9E9F7',wall4:'#DDEFD8',
  stone:'#DED6CC',stoneD:'#C7BCAE',path:'#EFDDBA',soil:'#D9B48E',water:'#BEE0F2',waterD:'#9CCDE8',sand:'#F7E4B5',sandD:'#EBCF95',
  red:'#F4A3A3',redD:'#E57E83',yellow:'#FCE59A',orange:'#F8C08A',lav:'#DCCBF2',mint:'#C9EBDA',blue:'#B9D3F2',white:'#FFFFFF',glass:'#E4F2FA'};
let _n=0;const uid=()=>'pwa'+(++_n);
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
  return `${open}<defs>${R(k.defs.join(''))}${k.defs2.join('')}</defs>${R(pp.bg)}${k.sky.join('')}${R(k.out.join(''))}${k.top.length?`<g pointer-events="none">${R(k.top.join(''))}</g>`:''}${lights}${pp.tooth}</svg>`}
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
function frameScene(name,label,body,env){
  const big=name==='map',W=big?2400:1000,H=big?1500:600;
  const k=kit(hashS('pwa-'+name));k.env=env||DEF_ENV;k.rc=recolorFn(k.env,name==='shelter'||name==='house'||name==='kitchen'?'in':'out');const pp=paperDefs(k,W,H);
  body(k);
  const ex=k.env.def?'':` data-time="${k.env.time}" data-weather="${k.env.weather}"`;
  return assemble(k,pp,W,`<svg class="pa-wa-scene pa-wa-${name}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid ${big?'meet':'slice'}" role="img" aria-label="${label}${k.env.def?'':`, ${k.env.time}, ${k.env.weather}`}"${ex}>`,false);
}
function hot(k,attr,val,label,hitPts,inner){// clickable group with a transparent hit shape and a pink dashed hover outline
  const hit=smooth(dense(hitPts,true,30),true);
  k.add(`<g ${attr}="${val}" role="button" tabindex="0" aria-label="${label}"><path class="pa-wa-hit" d="${hit}" fill="#000" fill-opacity="0"/>${inner}<path class="pa-wa-hl" d="${hit}" fill="none" stroke="${C.pink}" stroke-width="4" stroke-dasharray="10 8" stroke-linecap="round"/></g>`);
}
function skyBand(k,W,yb,col=C.sky){k.add(`<rect x="0" y="0" width="${W}" height="${yb}" fill="${col}" fill-opacity=".75"/>`);let d='';for(let y=20;y<yb-10;y+=26){for(let x=0;x<W;x+=180){d+=`M${R1(x+k.r()*40)} ${R1(y+k.J(4))}h${R1(60+k.r()*70)}`}}k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="4" stroke-opacity=".32" stroke-linecap="round"/>`)}

function yard(k,o={}){
  k.skyD(()=>{skyBand(k,1000,360);O.sun(k,890,80,34);O.cloud(k,520,80,28);O.cloud(k,760,130,20);O.bird(k,640,70,9);O.bird(k,668,86,7)},
    {W:1000,H:380,sun:[890,80,34],low:[770,268,34],moon:[870,84,30],clouds:[[520,80,28],[760,140,20],[360,56,20]],rainC:[[150,46,26],[660,52,30],[980,170,24]],birds:[[640,70,9],[668,86,7]],stars:44});
  // far hills
  const hl=[[0,330],[120,292],[260,312],[420,282],[600,306],[780,276],[1000,300],[1000,380],[0,380]];k.fill(hl,'#DCEDC4');k.pen(hl.slice(0,7),false,{w:1.6,col:C.graph});
  // fence across the back
  O.fence(k,300,1000,312,412);
  // big tree on the right, behind the fence top
  O.tree(k,960,410,1.25,{fruit:'#F49090'});
  // lawn
  const lawn=[[0,404],[300,398],[600,402],[1000,396],[1000,600],[0,600]];k.fill(lawn,C.grass,{dx:0,dy:0});k.pen([[0,404],[300,398],[600,402],[1000,396]],false,{w:2});
  [[120,600,130,26],[470,585,110,20],[760,575,120,22],[980,450,70,18]].forEach(q=>k.fill(E(q[0],q[1],q[2],q[3],12),C.grass2,{op:.7}));
  let td='';for(let i=0;i<150;i++){const x=k.r()*1000,y=420+k.r()*175;if(x>600&&x<880&&y<525)continue;if(x>290&&x<570&&y>440&&y<520)continue;td+=`M${R1(x)} ${R1(y)}q1 -6 -1 -10M${R1(x+5)} ${R1(y)}q0 -7 3 -12`}
  k.add(`<path d="${td}" fill="none" stroke="${C.grassD}" stroke-width="1.5" stroke-linecap="round"/>`);
  k.fx(()=>{const zones=[[290,430,575,522],[600,320,880,526],[220,500,290,545]];
    if(k.env.rain){sheen(k,0,1000,412,598,70,zones);[[440,562,48,10],[742,556,40,9],[940,470,30,7],[266,468,16,5]].forEach(q=>puddle(k,...q))}
    if(k.env.snow)[[440,562,74,14],[742,560,62,12],[944,468,50,10],[262,462,28,8],[600,592,54,9],[334,592,44,8],[990,430,30,8],[160,600,60,8]].forEach(q=>snowPatch(k,...q))});
  // cottage (back left)
  const cx=40,cy=170;
  k.shape([[cx+170,cy+20],[cx+170,cy-30],[cx+196,cy-30],[cx+196,cy+30]],C.red,{w:2,hatch:{side:.4,gap:4,col:C.redD,op:.6}});
  [[0,-10],[8,-28],[18,-46]].forEach((q,i)=>k.line([[cx+183+q[0],cy-36+q[1]],[cx+176+q[0],cy-44+q[1]],[cx+186+q[0],cy-52+q[1]]],1.6,C.graph));
  const wall=RC(cx,cy+60,250,170);k.shape(wall,C.wall,{w:2.3,hatch:{side:.72,gap:5,col:'#D9B996',op:.5}});
  for(let y=cy+80;y<cy+225;y+=18)k.line([[cx+6,y+k.J(1)],[cx+244,y+k.J(1)]],1,'#E2C29E',{op:.8});
  const roof=[[cx-26,cy+66],[cx+125,cy-40],[cx+276,cy+66]];k.shape(roof,C.roof,{w:2.4,hatch:{side:.6,gap:5,col:C.roofD,op:.55}});
  for(let row=0;row<5;row++){const y=cy-14+row*17,half=(y-cy+40)*1.42;let d='';for(let x=cx+125-half+10;x<cx+125+half-12;x+=16)d+=`M${R1(x)} ${R1(y)}q8 9 16 0`;k.add(`<path d="${d}" fill="none" stroke="${C.roofD}" stroke-width="1.4" stroke-linecap="round"/>`)}
  k.fx(()=>{if(k.env.snow){capLine(k,[[cx-28,cy+66],[cx+125,cy-41],[cx+278,cy+66]],13);capLine(k,[[cx+168,cy-30],[cx+198,cy-30]],7)}
    if(k.env.rain){let d='';for(let i=0;i<9;i++){const t=.15+i*.08,x=cx+125+(i%2?1:-1)*t*140,y=cy-40+t*100;d+=`M${R1(x)} ${R1(y)}l${i%2?14:-14} 10`}k.add(`<path d="${d}" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>`)}});
  O.window(k,cx+150,cy+0,40,40,{curtain:'#FFC9D3'});
  O.window(k,cx+30,cy+100,62,56,{curtain:'#FFC9D3',box:1});O.window(k,cx+165,cy+100,58,52,{curtain:C.mint});
  const door=[[cx+108,cy+230],[cx+108,cy+132],[cx+122,cy+120],[cx+138,cy+120],[cx+152,cy+132],[cx+152,cy+230]];k.shape(door,'#B9D3F2',{w:2.2,hatch:{side:.6,gap:4,col:'#8FAFD6',op:.6}});
  k.add(`<circle cx="${cx+144}" cy="${cy+180}" r="3.2" fill="${C.ink}"/>`);O.heart(k,cx+130,cy+146,6);
  k.shape(RC(cx+100,cy+228,60,8),C.stone,{w:1.6});
  // stepping stones from the door
  [[cx+132,cy+258,22,8],[cx+150,cy+290,20,8],[cx+176,cy+322,22,9],[cx+206,cy+356,20,8]].forEach(q=>k.shape(E(q[0],q[1],q[2],q[3],10),C.stone,{w:1.6}));
  // clothesline from the cottage to a pole
  k.line([[588,190],[590,404]],4,C.ink);k.line([[574,196],[604,190]],3,C.ink);
  const cl=t=>[cx+250+(588-cx-250)*t,cy+92+Math.sin(Math.PI*t)*30];const L=[];for(let i=0;i<=16;i++)L.push(cl(i/16));k.line(L,1.4);
  const shirt=(t,col)=>{const p=cl(t),x=p[0],y=p[1];k.shape([[x-18,y],[x-6,y-1],[x,y+5],[x+6,y-1],[x+18,y],[x+26,y+12],[x+17,y+18],[x+14,y+12],[x+14,y+44],[x-14,y+44],[x-14,y+12],[x-17,y+18],[x-26,y+12]],col,{w:1.8});k.line([[x-6,y+3],[x-6,y-4]],2);k.line([[x+6,y+3],[x+6,y-4]],2)};
  const sock=(t,col)=>{const p=cl(t),x=p[0],y=p[1];k.shape([[x-6,y],[x+6,y],[x+6,y+26],[x+16,y+30],[x+14,y+38],[x-6,y+36]],col,{w:1.6});k.line([[x,y+2],[x,y-4]],2);k.line([[x-6,y+8],[x+6,y+8]],1.2,C.ink,{op:.6})};
  shirt(.18,C.blue);sock(.35,C.red);sock(.44,C.yellow);
  {const p=cl(.62),x=p[0],y=p[1];k.shape(RC(x-26,y,52,38),C.mint,{w:1.8});k.line([[x-18,y],[x-18,y-5]],2);k.line([[x+18,y],[x+18,y-5]],2);k.add(`<path d="M${x-14} ${y+16}h10M${x-12} ${y+13}v6M${x-6} ${y+13}v6M${x+4} ${y+26}h10M${x+6} ${y+23}v6M${x+12} ${y+23}v6" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>`)}
  shirt(.84,'#FFD8E0');
  // veggie patch, front left (bowl spot x≈250,y≈520 kept clear)
  const bed=[[20,450],[200,446],[208,580],[16,584]];k.shape(bed,C.soil,{w:2.1,hatch:{side:.6,gap:5,col:'#B98F68',op:.5}});
  k.shape([[12,442],[210,438],[212,452],[10,456]],C.woodD,{w:1.6,one:1});
  {const vg=k.cap(()=>{for(let row=0;row<3;row++){const y=482+row*36;k.line([[30,y+8],[196,y+6]],1.2,'#B98F68');const vv=k.cap(()=>{for(let i=0;i<5;i++){const x=44+i*34+k.J(3);
    if(row===1){k.shape(E(x,y,12,9,10),'#CFEAB0',{w:1.6});k.line([[x-6,y],[x+5,y-3]],1.1,C.leafD)}
    else{k.shape([[x-5,y+2],[x+5,y+2],[x,y+16]],C.orange,{w:1.5,one:1});k.line([[x,y+2],[x-6,y-10]],1.8,'#6FAE5C');k.line([[x,y+2],[x+1,y-12]],1.8,'#6FAE5C');k.line([[x,y+2],[x+7,y-9]],1.8,'#6FAE5C')}}});if(o.patch!=='empty')k.add(vv)}});
   k.add(vg);if(o.patch==='empty')k.side(()=>patchEmpty(k))}
  k.text('veggies!',110,436,24,{rot:-3});
  // little bushes and flowers (outside the overlay zones)
  O.bush(k,250,410,.7,C.leaf2,C.leafD,C.red);O.bush(k,900,600,1.2,C.leaf2,C.leafD,'#F49090');
  [[880,520,C.red],[920,540,C.yellow],[960,508,C.lav],[612,560,C.yellow],[640,580,C.red],[262,590,C.lav],[300,575,C.red],[575,585,'#FFB3C7']].forEach(f=>O.flower(k,f[0],f[1],5,f[2]));
  // mailbox by the fence
  k.line([[330,410],[330,356]],4,C.ink);k.shape([[312,336],[348,336],[348,360],[312,360]],C.red,{w:2});k.line([[350,340],[350,324],[360,324]],2.4,C.ink);
  k.fx(()=>{if(k.env.snow){capLine(k,[[310,336],[350,336]],6);capLine(k,[[10,442],[212,438]],6);capLine(k,[[572,196],[606,190]],4)}
    if(k.env.night&&!k.env.rain)[[150,420],[600,470],[470,566],[880,430],[905,566],[560,300]].forEach(f=>k.flies.push(f))});
  O.sparkle(k,470,250,9);O.sparkle(k,820,240,6);O.heart(k,360,150,6);O.note(k,700,180,12);
  O.tape(k,6,26,90,-24,'#F7B9C6');O.tape(k,930,560,80,-28,'#BDE7D2');
  // faint construction marks for the overlay spots
  k.line([[612,526],[870,526]],1,C.graph,{op:.45,dash:'2 7'});
  // v1.3 additions, appended so everything above stays exactly as before
  if(o.patch==='ready')k.side(()=>patchReady(k));
  k.side(()=>hotTag(k,'data-hot','garden','Garden',RC(10,430,205,160),176,462,-10));
}

function market(k){
  k.skyD(()=>{skyBand(k,1000,170,C.sky);O.bird(k,240,92,9);O.bird(k,262,104,7);O.bird(k,780,96,8)},
    {W:1000,H:452,sun:[170,104,24],low:[820,124,36],moon:[170,100,24],clouds:[[540,104,22],[880,96,20]],rainC:[[330,92,24],[720,90,26]],birds:[[240,92,9],[262,104,7],[780,96,8]],stars:34});
  O.bunting(k,20,980,24,26,[C.red,C.yellow,C.mint,C.lav,C.blue]);
  // sidewalk + cobbled street
  k.fill([[0,452],[1000,448],[1000,600],[0,600]],C.stone,{dx:0,dy:0});
  O.cobbles(k,0,488,1000,600);
  k.shape([[0,448],[1000,444],[1000,474],[0,478]],'#EDE6DC',{w:2});for(let x=40;x<1000;x+=90)k.line([[x,448],[x-6,476]],1.2,C.ink,{op:.6});
  k.fx(()=>{if(k.env.rain){sheen(k,0,1000,452,476,40);sheen(k,0,1000,490,598,60,[[400,522,600,575]]);[[210,548,54,10],[772,580,66,11],[640,506,36,7],[90,590,40,8]].forEach(q=>puddle(k,...q))}
    if(k.env.snow){[[120,522,62,12],[862,540,72,13],[300,590,62,10],[660,596,56,9],[960,586,40,8],[40,560,40,8]].forEach(q=>snowPatch(k,...q));capLine(k,[[0,449],[1000,445]],5)}});
  const shop=(x,key,label,col,cols,inner)=>{
    const g=k.cap(()=>{
      const w=290,top=150,base=446;
      k.shape(RC(x,top,w,base-top),col,{w:2.4,hatch:{side:.82,gap:5,col:'#B8A493',op:.35}});
      for(let y=top+28;y<base-10;y+=22){let d='';for(let bx=x+((y/22)%2?0:22);bx<x+w-10;bx+=44)d+=`M${R1(bx)} ${R1(y)}h40`;k.add(`<path d="${d}" stroke="#fff" stroke-opacity=".45" stroke-width="1.4"/>`)}
      k.shape(RC(x-8,top-14,w+16,18),C.wood,{w:2});k.fx(()=>{if(k.env.snow)capLine(k,[[x-10,top-14],[x+w+10,top-14]],9)});
      O.awning(k,x+10,top+86,w-20,30,cols[0],cols[1]);
      inner(k,x,w,top,base);
    });
    return g;
  };
  // Kibble Corner
  const g1=shop(40,'kibble','Kibble Corner',C.wall,[C.red,'#fff'],(k,x,w,top,base)=>{
    // sign with a bite taken out of the top-right corner
    const sp=[[x+30,top+10],[x+222,top+10],[x+230,top+16],[x+226,top+26],[x+236,top+32],[x+250,top+30],[x+260,top+34],[x+260,top+76],[x+30,top+76]];
    k.shape(sp,C.yellow,{w:2.4});k.add(`<path d="M${x+234} ${top+44}l3 3M${x+246} ${top+42}l2 4M${x+240} ${top+52}l3 2" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>`);
    k.text('Kibble Corner',x+138,top+56,34,{rot:-2});
    k.shape(E(x+48,top+44,9,6,8,.5),C.orange,{w:1.5,one:1});k.shape(E(x+60,top+56,7,5,8,-.3),C.orange,{w:1.5,one:1});
    // window display: kibble bags and a bowl pyramid
    k.shape(RC(x+24,top+140,150,140),C.glass,{w:2.2});if(k.env.lit)k.glows.push([x+24,top+140,150,140],[x+196,top+162,60,34]);k.add(`<path d="M${x+40} ${top+250}l40 -60M${x+70} ${top+258}l26 -36" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`);
    [[x+50,top+200],[x+100,top+190],[x+148,top+204]].forEach((q,i)=>{const bx=q[0],by=q[1];k.shape([[bx-20,by],[bx+20,by],[bx+22,by+76],[bx-22,by+76]],[C.orange,C.mint,C.lav][i],{w:1.8});k.shape(RC(bx-12,by+22,24,18),C.white,{w:1.2,one:1});k.text(['kibble','yum','crunch'][i],bx,by+36,13,{wt:700})});
    k.shape(RC(x+186,top+150,80,130),'#C79A72',{w:2.2});k.add(`<circle cx="${x+254}" cy="${top+214}" r="3" fill="${C.ink}"/>`);k.shape(RC(x+196,top+162,60,34),C.glass,{w:1.4,one:1});
    k.text('OPEN',x+226,top+184,18,{col:'#C2475B'});
  });
  hot(k,'data-shop','kibble','Kibble Corner',RC(32,130,306,320),g1);
  // Bow-Wow Boutique
  const g2=shop(355,'boutique','Bow-Wow Boutique',C.wall2,[C.lav,'#fff'],(k,x,w,top,base)=>{
    k.shape(E(x+145,top+44,132,30,18),'#FFFFFF',{w:2.4});k.text('Bow-Wow Boutique',x+145,top+55,30);
    k.shape([[x+145,top+12],[x+129,top+2],[x+129,top+22]],C.pink,{w:1.4,one:1});k.shape([[x+145,top+12],[x+161,top+2],[x+161,top+22]],C.pink,{w:1.4,one:1});k.add(`<circle cx="${x+145}" cy="${top+12}" r="4" fill="#E86A8A" stroke="${C.ink}" stroke-width="1.2"/>`);
    k.shape(RC(x+20,top+140,170,140),C.glass,{w:2.2});if(k.env.lit)k.glows.push([x+20,top+140,170,140]);
    // the mannequin is a stick wearing a tiny sweater and a hat
    const mx=x+70,my=top+270;k.line([[mx,my],[mx+2,top+170]],3.4,'#A97E5A');k.line([[mx+1,top+200],[mx-18,top+186]],2.2,'#A97E5A');k.line([[mx+1,top+204],[mx+20,top+192]],2.2,'#A97E5A');
    k.shape([[mx-14,top+196],[mx+16,top+196],[mx+18,top+232],[mx-16,top+232]],'#F7A9B8',{w:1.8});k.add(`<path d="M${mx-12} ${top+210}l6 4 6 -4 6 4 6 -4M${mx-12} ${top+222}l6 4 6 -4 6 4 6 -4" fill="none" stroke="#fff" stroke-width="1.6"/>`);
    k.shape([[mx-10,top+170],[mx+2,top+146],[mx+12,top+170]],C.yellow,{w:1.6});k.shape(E(mx-24,my-6,14,4,8),'#C9A07A',{w:1.4,one:1});
    k.text('(very fashion)',mx+50,top+164,15,{wt:500,rot:-4});
    // hanger rail with tiny outfits
    k.line([[x+110,top+190],[x+180,top+190]],2.2);[[x+124,C.red],[x+150,C.yellow],[x+172,C.mint]].forEach(([hx,cc])=>{k.line([[hx,top+190],[hx,top+198]],1.4);k.shape([[hx-10,top+198],[hx+10,top+198],[hx+12,top+226],[hx-12,top+226]],cc,{w:1.6,one:1})});
    k.shape(RC(x+204,top+150,70,130),'#E8A9B8',{w:2.2});k.add(`<circle cx="${x+214}" cy="${top+214}" r="3" fill="${C.ink}"/>`);O.heart(k,x+239,top+176,8);
  });
  hot(k,'data-shop','boutique','Bow-Wow Boutique',RC(347,130,306,320),g2);
  // Barkitecture
  const g3=shop(670,'builder','Barkitecture',C.wall3,[C.mint,'#fff'],(k,x,w,top,base)=>{
    k.shape(RC(x+24,top+12,242,62),C.wood,{w:2.4});for(let y=top+26;y<top+70;y+=14)k.line([[x+30,y],[x+260,y]],1,C.woodD);
    // misspelled, then corrected: "Barkitexture" with the x struck out and a c written above
    k.text('Barkitexture',x+152,top+58,34,{rot:-1});
    k.line([[x+176,top+38],[x+194,top+60]],2.6,'#D2475B',{amp:.3});k.line([[x+176,top+60],[x+194,top+38]],2.6,'#D2475B',{amp:.3});
    k.text('c',x+186,top+30,26,{col:'#D2475B'});k.line([[x+180,top+72],[x+186,top+64],[x+192,top+72]],2,'#D2475B',{amp:.2});
    const hx=x+46,hy=top+50;k.shape([[hx-14,hy+14],[hx-14,hy-2],[hx,hy-14],[hx+14,hy-2],[hx+14,hy+14]],C.red,{w:1.6});
    k.shape(RC(x+20,top+140,170,140),C.glass,{w:2.2});if(k.env.lit)k.glows.push([x+20,top+140,170,140]);
    // window: little doghouse models and a blueprint
    k.shape(RC(x+34,top+156,70,52),'#BFD9F5',{w:1.6});k.add(`<path d="M${x+44} ${top+196}v-18l14 -12 14 12v18M${x+80} ${top+170}h16M${x+80} ${top+182}h12" fill="none" stroke="#fff" stroke-width="1.6"/>`);
    [[x+130,top+250,1],[x+168,top+258,.75]].forEach(([dx,dy,s])=>{k.shape([[dx-22*s,dy],[dx-22*s,dy-26*s],[dx,dy-46*s],[dx+22*s,dy-26*s],[dx+22*s,dy]],C.wood,{w:1.8});k.shape([[dx-8*s,dy],[dx-8*s,dy-14*s],[dx,dy-20*s],[dx+8*s,dy-14*s],[dx+8*s,dy]],C.ink,{noline:1,dx:0,dy:0})});
    k.shape(RC(x+204,top+150,70,130),'#A9C7E8',{w:2.2});k.add(`<circle cx="${x+214}" cy="${top+214}" r="3" fill="${C.ink}"/>`);
    k.line([[x+226,top+170],[x+256,top+200]],3.4,'#A97E5A');k.shape([[x+250,top+160],[x+266,top+176],[x+258,top+182],[x+244,top+168]],'#9AA7B8',{w:1.6});
  });
  hot(k,'data-shop','builder','Barkitecture',RC(662,130,306,320),g3);
  // street furniture between the shops
  O.lamp(k,345,452,1);O.lamp(k,662,452,1);
  [[22,448],[978,448]].forEach(([x,y])=>{k.shape([[x-14,y],[x+14,y],[x+10,y-26],[x-10,y-26]],C.roof,{w:1.8});O.flower(k,x-5,y-34,4,C.red);O.flower(k,x+6,y-30,4,C.yellow)});
  O.sparkle(k,330,100,8);O.sparkle(k,690,110,6);O.heart(k,520,120,6);
  O.tape(k,8,20,90,-26,'#F9E19A');O.tape(k,920,568,80,-24,'#D3C6F1');
  k.shape(RC(410,530,180,40),'#FFFFFF',{w:2,one:1});k.text('Market Street',500,560,30,{rot:-1});
  k.fx(()=>{if(k.env.snow){capLine(k,[[408,530],[592,530]],6);[[22,448],[978,448]].forEach(([x,y])=>capLine(k,[[x-15,y-26],[x+15,y-26]],5))}});
  k.side(()=>sproutCart(k));// v1.3, appended
}

function shelter(k){
  // wallpaper with doodled paws and hearts
  k.add(`<rect width="1000" height="470" fill="#FBEFE0"/>`);
  let pd='';for(let y=30;y<450;y+=70)for(let x=(y/70)%2?20:55;x<1000;x+=70){if(k.r()<.5)pd+=`<path d="M${x} ${y+4}c-6 -6 -3 -12 3 -8c6 -4 9 2 3 8l-3 3z" fill="#F7C5CF"/>`;else pd+=`<g fill="#E8D3C0"><ellipse cx="${x}" cy="${y+3}" rx="5" ry="4"/><circle cx="${x-6}" cy="${y-4}" r="2"/><circle cx="${x-2}" cy="${y-8}" r="2"/><circle cx="${x+3}" cy="${y-8}" r="2"/><circle cx="${x+7}" cy="${y-4}" r="2"/></g>`}
  k.add(pd);
  k.shape(RC(0,380,1000,26),C.wood,{w:2});
  // floor planks
  k.fill([[0,470],[1000,470],[1000,600],[0,600]],'#EBCFA8',{dx:0,dy:0});
  for(let y=470;y<600;y+=26){k.line([[0,y],[1000,y]],1.3,C.woodD);for(let x=(y/26)%2?60:150;x<1000;x+=190)k.line([[x,y],[x,y+26]],1.2,C.woodD)}
  k.shape([[0,452],[1000,452],[1000,472],[0,472]],'#D8B48C',{w:2});
  // big window with curtains (top center)
  if(k.env.def){O.window(k,400,90,200,150,{curtain:'#FFC9D3',frame:'#FFFFFF'});
    k.add(`<g opacity=".9">`);O.cloud(k,470,140,14);k.add(`</g>`)}
  else{O.window(k,400,90,200,150,{curtain:'#FFC9D3',frame:'#FFFFFF',noLit:1,glass:skyGrad(k,90,240),inside:()=>k.side(()=>windowView(k,400,90,200,150))});
    k.cap(()=>{k.add(`<g opacity=".9">`);O.cloud(k,470,140,14);k.add(`</g>`)});k.fx(()=>{if(k.env.snow)capLine(k,[[391,243],[609,243]],6)})}
  // banner
  O.bunting(k,40,960,30,30,[C.red,C.yellow,C.mint,C.lav,C.blue,'#FFB3C7']);
  k.shape([[300,268],[700,268],[690,318],[310,318]],'#FFFFFF',{w:2.4});k.text('Paw Haven Shelter',500,306,42);O.heart(k,282,290,10);O.heart(k,718,290,10);
  // bulletin board with "adopt me" polaroids
  k.shape(RC(70,120,220,160),'#E1B987',{w:2.4,hatch:{side:.8,gap:5,col:'#BF9767',op:.4}});
  [[96,140,-6,C.orange],[168,136,5,C.blue],[110,206,4,C.yellow],[200,200,-5,C.pink]].forEach(([x,y,a,cc])=>{k.add(`<g transform="rotate(${a} ${x+28} ${y+30})">`);k.shape(RC(x,y,56,62),'#FFFFFF',{w:1.6,one:1});k.shape(RC(x+6,y+6,44,38),cc,{w:1.2,one:1});k.add(`<circle cx="${x+22}" cy="${y+22}" r="2" fill="${C.ink}"/><circle cx="${x+34}" cy="${y+22}" r="2" fill="${C.ink}"/><path d="M${x+24} ${y+30}q4 4 8 0" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);k.text('adopt me',x+28,y+58,12);k.add(`<circle cx="${x+28}" cy="${y+2}" r="3.4" fill="#E86A7C"/></g>`)});
  // treat shelf (right)
  k.shape(RC(730,170,220,12),C.woodD,{w:2});k.shape(RC(730,250,220,12),C.woodD,{w:2});
  [[760,170,C.orange,'treats'],[820,170,C.mint,'toys'],[890,170,C.lav,'bones']].forEach(([x,y,cc,t])=>{k.shape([[x-22,y],[x-24,y-56],[x+24,y-56],[x+22,y]],C.glass,{w:1.8});k.shape(RC(x-26,y-66,52,10),cc,{w:1.6});k.text(t,x,y-24,15)});
  [[748,250],[790,250],[836,250]].forEach(([x,y],i)=>{k.shape(RC(x-14,y-40,30,40),[C.yellow,C.red,C.blue][i],{w:1.6})});
  k.shape(E(905,232,24,18,10),'#F7E1A8',{w:1.8});k.line([[890,232],[920,232]],1.2,C.ink,{op:.6});
  // potted plants by the walls
  [[40,452,1],[960,452,1.1]].forEach(([x,y,s])=>{k.shape([[x-18*s,y],[x+18*s,y],[x+22*s,y-34*s],[x-22*s,y-34*s]],C.roof,{w:1.8});for(let i=0;i<5;i++){const a=-Math.PI/2+(i-2)*.5;k.shape(E(x+Math.cos(a)*24*s,y-50*s+Math.sin(a)*18*s,8*s,16*s,8,a+Math.PI/2),C.leaf,{w:1.5,one:1})}});
  k.fx(()=>{if(k.env.lit){// a cosy table lamp on the ledge
    const x=120,y=452;k.shape(E(x,y-4,18,5,10),C.woodD,{w:1.6});k.line([[x,y-6],[x+1,y-40]],3,C.ink);const sh=[[x-28,y-38],[x+28,y-38],[x+17,y-68],[x-17,y-68]];k.shape(sh,'#FCE59A',{w:2});
    k.lamps.push({x,y:y-52,s:1.05,glass:sh});k.line([[x+12,y-38],[x+14,y-26]],1.2);k.add(`<circle cx="${x+14}" cy="${y-24}" r="2.4" fill="${C.ink}"/>`)}});
  // string lights
  const sl=[];for(let i=0;i<=20;i++){const t=i/20;sl.push([20+960*t,70+Math.sin(Math.PI*t*3)*10])}k.line(sl,1.3);
  for(let i=1;i<20;i+=2){const p=sl[i];if(k.env.lit)k.bulbs.push([p[0],p[1]+7,[C.yellow,'#FFB3C7',C.mint][i%3]]);k.add(`<circle cx="${R1(p[0])}" cy="${R1(p[1]+7)}" r="5" fill="${[C.yellow,'#FFB3C7',C.mint][i%3]}" stroke="${C.ink}" stroke-width="1.2"/>`)}
  // rugs at the front (the game puts dogs on the floor between them)
  k.shape(E(160,560,110,22,16),'#F7C5CF',{w:2});k.add(`<ellipse cx="160" cy="560" rx="84" ry="14" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 6"/>`);
  k.shape(E(840,560,110,22,16),C.mint,{w:2});k.add(`<ellipse cx="840" cy="560" rx="84" ry="14" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 6"/>`);
  O.sparkle(k,640,60,8);O.sparkle(k,340,200,6);
  O.tape(k,8,18,90,-26,'#F7B9C6');O.tape(k,920,572,80,-24,'#B9D4F3');
}

/* ---------- town map (v1.6): "Paw Haven Town", viewBox 0 0 2400 1500, no time or weather ---------- */
const AREAS={yard:{label:'My Yard',bond:1},house:{label:'Cozy House',bond:1},market:{label:'Market Street',bond:1},shelter:{label:'Paw Haven Shelter',bond:1},
  square:{label:'Town Square',bond:1},park:{label:'Sunny Park',bond:1},river:{label:'Riverside Trail',bond:2},woods:{label:'Maple Woods',bond:5},beach:{label:'Seashell Beach',bond:8},
  cafe:{label:'Pupuccino Café',bond:1},dogpark:{label:'Dog Park',bond:2},vet:{label:'Vet Clinic',bond:1},salon:{label:'Grooming Salon',bond:3},hilltop:{label:'Hilltop Meadow',bond:4},pier:{label:'Lighthouse Pier',bond:6}};
// place centres (icon centre; the caption sits below)
const MAPC={yard:[290,640],house:[540,640],park:[360,1000],river:[1060,1320],shelter:[1200,405],salon:[1600,405],market:[1200,665],vet:[1600,665],
  square:[1200,925],cafe:[1600,925],dogpark:[1220,1180],woods:[2170,540],hilltop:[1500,140],beach:[1880,1290],pier:[2250,1190]};
PA.MAP_AREAS=Object.keys(MAPC).map(id=>({id,x:MAPC[id][0],y:MAPC[id][1]}));
const RIV=[[700,-20],[690,200],[740,400],[780,600],[760,800],[800,1000],[900,1180],[1050,1320],[1250,1420],[1420,1520]];
const COAST=[[1380,1520],[1600,1455],[1850,1405],[2050,1320],[2200,1220],[2320,1080],[2420,1000]];
const polyX=(P,y)=>{for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];if((y-a[1])*(y-b[1])<=0){const t=(y-a[1])/((b[1]-a[1])||1);return a[0]+(b[0]-a[0])*t}}return P[P.length-1][0]};
const polyY=(P,x)=>{for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];if((x-a[0])*(x-b[0])<=0){const t=(x-a[0])/((b[0]-a[0])||1);return a[1]+(b[1]-a[1])*t}}return 9999};
const STY=[540,800,1060],STX=[1000,1400,1800];
const mOut=(k,pts,col,w=1.5)=>{k.add(`<path d="M${pts.map(p=>R1(p[0]+k.J(.8))+' '+R1(p[1]+k.J(.8))).join('L')}Z" fill="${col}" stroke="${C.ink}" stroke-width="${w}" stroke-linejoin="round"/>`)};
function mHouse(k,x,y,s,wall,roof){mOut(k,RC(x-15*s,y-12*s,30*s,24*s),wall);mOut(k,[[x-19*s,y-11*s],[x,y-28*s],[x+19*s,y-11*s]],roof);k.add(`<rect x="${R1(x-4*s)}" y="${R1(y)}" width="${R1(7*s)}" height="${R1(12*s)}" fill="${C.ink}" opacity=".55"/>`)}
function mTree(k,x,y,s,col){k.add(`<path d="M${x} ${R1(y+10*s)}V${y}" stroke="${C.trunkD}" stroke-width="2"/><path d="${smooth(blobP(x,y-6*s,14*s,12*s,k.r,8,.18),true)}" fill="${col||C.leaf}" stroke="${C.ink}" stroke-width="1.4"/>`)}
function mPine(k,x,y,s,col){k.add(`<path d="M${x} ${y}v${R1(6*s)}" stroke="${C.trunkD}" stroke-width="2"/>`);mOut(k,[[x-14*s,y],[x+k.J(1),y-34*s],[x+14*s,y]],col||C.pine,1.4)}
const ICON={
 yard(k,x,y){O.fence(k,x-74,x+74,y+2,y+44,{bw:12,gap:3});k.shape([[x-40,y+30],[x-40,y-2],[x-14,y-24],[x+12,y-2],[x+12,y+30]],C.wood,{w:2,hatch:{side:.6,gap:4,col:C.woodD,op:.5}});k.shape([[x-48,y],[x-14,y-30],[x+20,y]],C.red,{w:2});k.shape([[x-24,y+30],[x-24,y+8],[x-14,y],[x-4,y+8],[x-4,y+30]],C.ink,{noline:1,dx:0,dy:0});
   O.tree(k,x+52,y+30,.42);k.add(`<path d="M${x+14} ${y+52}h18" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="${x+13}" cy="${y+50}" r="3.4" fill="#fff" stroke="${C.ink}"/><circle cx="${x+33}" cy="${y+50}" r="3.4" fill="#fff" stroke="${C.ink}"/>`)},
 house(k,x,y){k.shape([[x-50,y+44],[x-50,y-6],[x+50,y-6],[x+50,y+44]],C.wall,{w:2,hatch:{side:.65,gap:4,col:'#D9B996',op:.5}});k.shape([[x-62,y-2],[x,y-56],[x+62,y-2]],C.roof,{w:2,hatch:{side:.6,gap:4,col:C.roofD,op:.5}});
   k.shape(RC(x-8,y+12,20,32),'#B9D3F2',{w:1.6});O.window(k,x-38,y+6,20,18,{});O.window(k,x+22,y+6,20,18,{});O.heart(k,x,y-24,7);k.line([[x+30,y-36],[x+32,y-62]],1.4,C.graph);k.line([[x+38,y-44],[x+42,y-70]],1.4,C.graph)},
 market(k,x,y){[[x-78,C.wall,C.red],[x-24,C.wall2,C.lav],[x+30,C.wall3,C.mint]].forEach(([sx,c1,c2])=>{k.shape(RC(sx,y-40,50,82),c1,{w:1.9});O.awning(k,sx+3,y-12,44,12,c2,'#fff');k.shape(RC(sx+16,y+16,18,26),C.wood,{w:1.4,one:1})})},
 shelter(k,x,y){k.shape(RC(x-62,y-18,124,72),'#FBEFE0',{w:2,hatch:{side:.7,gap:5,col:'#D9B996',op:.4}});k.shape([[x-72,y-14],[x,y-62],[x+72,y-14]],C.red,{w:2});O.heart(k,x,y-32,10);k.shape(RC(x-12,y+20,24,34),'#E8A9B8',{w:1.6});O.window(k,x-48,y,22,18,{});O.window(k,x+26,y,22,18,{})},
 salon(k,x,y){k.shape(RC(x-56,y-36,112,90),'#FDE3EA',{w:2,hatch:{side:.75,gap:5,col:'#E6B5C2',op:.45}});O.awning(k,x-52,y-4,104,14,C.pink,'#fff');k.shape(RC(x-10,y+18,22,36),C.lav,{w:1.6});
   k.add(`<g fill="none" stroke="${C.ink}" stroke-width="2.4"><circle cx="${x-12}" cy="${y-20}" r="6"/><circle cx="${x+12}" cy="${y-20}" r="6"/><path d="M${x-8} ${y-24}l20 -18M${x+8} ${y-24}l-20 -18"/></g>`);[[x+40,y+30],[x+48,y+16],[x-44,y+28]].forEach(([bx,by])=>k.add(`<circle cx="${bx}" cy="${by}" r="5" fill="#fff" stroke="${C.blue}" stroke-width="1.4"/>`))},
 vet(k,x,y){k.shape(RC(x-56,y-34,112,88),'#FFFFFF',{w:2,hatch:{side:.75,gap:5,col:'#C9D3DD',op:.45}});k.shape([[x-64,y-30],[x,y-60],[x+64,y-30]],'#B9D3F2',{w:2});k.add(`<path d="M${x-7} ${y-28}h14v10h10v14h-10v10h-14v-10h-10v-14h10z" fill="${C.redD}" stroke="${C.ink}" stroke-width="1.4"/>`);k.shape(RC(x-11,y+20,22,34),C.mint,{w:1.6});O.window(k,x-46,y+10,20,16,{});O.window(k,x+26,y+10,20,16,{})},
 square(k,x,y){k.shape(E(x,y+10,84,46,18),'#EDE6DC',{w:2});k.add(`<ellipse cx="${x}" cy="${y+10}" rx="66" ry="34" fill="none" stroke="${C.stoneD}" stroke-width="1.4" stroke-dasharray="8 6"/>`);
   k.shape(E(x,y+14,36,14,14),C.stone,{w:2});k.shape(E(x,y+10,28,9,12),C.water,{w:1.4,one:1});k.line([[x,y+8],[x,y-24]],4,C.stoneD);k.add(`<path d="M${x} ${y-24}q-18 2 -22 24M${x} ${y-24}q18 2 22 24" fill="none" stroke="#86BDDE" stroke-width="2.4" stroke-linecap="round"/>`);
   k.line([[x+60,y+30],[x+60,y-10]],2.2);k.shape(RC(x+44,y-40,34,30),C.wood,{w:1.6});k.shape(RC(x+50,y-34,12,10),'#FFFFFF',{w:1,one:1});O.tree(k,x-66,y+12,.32)},
 cafe(k,x,y){k.shape(RC(x-54,y-34,108,86),'#FCE6CC',{w:2,hatch:{side:.75,gap:5,col:'#D9B996',op:.45}});O.awning(k,x-50,y-6,100,14,'#C9A07A','#fff');k.shape(RC(x-10,y+18,22,34),C.woodD,{w:1.6});
   k.shape(RC(x-24,y-56,48,20),'#FFFFFF',{w:1.6,one:1});k.add(`<path d="M${x-8} ${y-50}h14v8q-7 6 -14 0z" fill="#E8C49E" stroke="${C.ink}" stroke-width="1.3"/><path d="M${x+6} ${y-47}q6 1 0 6" fill="none" stroke="${C.ink}" stroke-width="1.3"/>`);
   k.line([[x+68,y+52],[x+68,y+14]],1.8);k.shape([[x+48,y+16],[x+68,y+2],[x+88,y+16]],C.mint,{w:1.5,one:1});k.shape(E(x+68,y+44,14,4,10),C.wood,{w:1.3,one:1})},
 park(k,x,y){O.tree(k,x-60,y+20,.5);O.tree(k,x+56,y+12,.46,{col:C.leaf2});k.shape(E(x,y+44,40,13,12),C.water,{w:1.8});O.bench(k,x,y+18,.42);O.flower(k,x-78,y+46,4,C.red);O.flower(k,x+80,y+46,4,C.yellow)},
 dogpark(k,x,y){k.shape(RC(x-84,y-34,168,86),'#CBE5A6',{w:1.6,one:1});k.add(`<rect x="${x-84}" y="${y-34}" width="168" height="86" fill="none" stroke="${C.ink}" stroke-width="2.2" stroke-dasharray="3 6"/>`);
   k.add(`<path d="M${x-66} ${y+30}a22 22 0 0 1 44 0" fill="${C.blue}" stroke="${C.ink}" stroke-width="2"/><path d="M${x-58} ${y+30}a14 14 0 0 1 28 0" fill="${C.ink}" opacity=".5"/>`);
   k.shape([[x-6,y+34],[x+30,y+4],[x+40,y+4],[x+40,y+34]],C.yellow,{w:1.6});k.add(`<circle cx="${x+64}" cy="${y+6}" r="15" fill="none" stroke="${C.redD}" stroke-width="4"/>`);k.line([[x+64,y+21],[x+64,y+36]],2)},
 river(k,x,y){const bp=[[x-60,y+4],[x-30,y-16],[x+30,y-16],[x+60,y+4],[x+50,y+14],[x+30,y-2],[x-30,y-2],[x-50,y+14]];k.shape(bp,C.wood,{w:2});for(let bx=x-28;bx<x+30;bx+=9)k.line([[bx,y-14],[bx,y-3]],1,C.woodD);
   k.shape(E(x-30,y+40,11,7,8),'#FCE59A',{w:1.4,one:1});k.add(`<path d="M${x-22} ${y+34}l7 2 -7 3z" fill="${C.orange}"/>`);for(let i=0;i<4;i++)k.line([[x+52+i*6,y+50],[x+50+i*6+k.J(3),y+22]],1.6,'#6FA05C')},
 woods(k,x,y){O.pine(k,x-40,y+40,.6);O.pine(k,x+16,y+24,.75,C.pineD,'#557F66');O.pine(k,x+66,y+44,.55);O.mushroom(k,x-6,y+52,.8);O.leafy(k,x+34,y+58,20,12,'#E9A86A','#CF8248')},
 hilltop(k,x,y){k.fill([[x-90,y+50],[x-40,y+6],[x+20,y-6],[x+90,y+44]],'#B9DD92',{dx:0,dy:0});k.pen([[x-90,y+50],[x-40,y+6],[x+20,y-6],[x+90,y+44]],false,{w:2});O.tree(k,x+30,y+4,.3);
   k.shape([[x-34,y-60],[x-18,y-40],[x-34,y-20],[x-50,y-40]],C.pink,{w:1.6});k.line([[x-34,y-20],[x-28,y],[x-36,y+20],[x-30,y+30]],1.2,C.ink,{op:.8});O.flower(k,x-56,y+40,3.6,C.yellow);O.flower(k,x+60,y+38,3.6,C.lav)},
 beach(k,x,y){k.fill(E(x,y+30,86,30,14),C.sand,{dx:0,dy:0});k.line([[x+6,y+40],[x+14,y-20]],2.6);k.shape([[x-30,y-14],[x+14,y-40],[x+58,y-12]],C.red,{w:1.8});k.shape([[x-56,y+34],[x-12,y+34],[x-16,y+46],[x-60,y+46]],C.mint,{w:1.5});
   k.shape(E(x+44,y+38,10,10,10),'#FFFFFF',{w:1.5});k.add(`<path d="M${x+34} ${y+38}q10 -7 20 0" fill="none" stroke="${C.red}" stroke-width="3"/>`);k.shape(E(x-30,y+60,8,6,8),'#FFC9B0',{w:1.3,one:1})},
 pier(k,x,y){const bd=[[x-90,y-30],[x+40,y+26],[x+30,y+40],[x-100,y-16]];k.shape(bd,C.wood,{w:2});for(let t=.1;t<1;t+=.1)k.line([[x-95+130*t,y-23+56*t],[x-90+130*t,y-30+56*t+12]],1,C.woodD);
   k.shape([[x+44,y+30],[x+52,y-50],[x+76,y-50],[x+84,y+30]],'#FFFFFF',{w:2});[[y-30],[y-6],[y+16]].forEach(([yy])=>k.fill([[x+50,yy],[x+80,yy],[x+81,yy+12],[x+49,yy+12]],C.redD,{op:.85,dx:0,dy:0}));k.pen([[x+44,y+30],[x+52,y-50],[x+76,y-50],[x+84,y+30]],true,{w:2});
   k.shape(RC(x+48,y-66,32,16),C.yellow,{w:1.6});k.shape([[x+44,y-66],[x+64,y-82],[x+84,y-66]],C.red,{w:1.6});k.add(`<path d="M${x+84} ${y-58}l36 -10M${x+84} ${y-58}l36 8" stroke="#FFE7A0" stroke-width="3" stroke-linecap="round"/>`);
   k.shape([[x-40,y+40],[x+4,y+40],[x-4,y+52],[x-34,y+52]],C.red,{w:1.5});k.line([[x-18,y+40],[x-18,y+12]],1.4);k.shape([[x-16,y+14],[x+2,y+38],[x-16,y+38]],'#FFFFFF',{w:1.3,one:1});O.bird(k,x-60,y-62,8)}
};
function bigMap(k,o){
  const locked=new Set(o.locked||[]),bonds=o.bonds||{};
  k.add(`<rect width="2400" height="1500" fill="#FDF3DF" fill-opacity=".55"/>`);
  // hills to the north
  const h1=[[0,170],[220,120],[460,160],[700,100],[960,150],[1250,90],[1500,60],[1760,110],[2000,80],[2240,130],[2400,100],[2400,300],[0,300]];k.fill(h1,'#DCEDC4',{dx:0,dy:0,sc:0});k.pen(h1.slice(0,11),false,{w:1.8,col:C.graph});
  const h2=[[0,250],[300,210],[620,250],[900,215],[1200,240],[1500,200],[1800,235],[2100,205],[2400,240],[2400,310],[0,310]];k.fill(h2,'#CFE6B4',{dx:0,dy:0,sc:0});k.pen(h2.slice(0,9),false,{w:1.6,col:C.graph});
  [[120,190],[380,165],[860,190],[1060,175],[1900,160],[2150,175],[2330,200],[640,215]].forEach(([x,y])=>mTree(k,x,y,1,C.leaf2));
  // sea and the sandy coast (south-east)
  const sea=COAST.concat([[2420,1520]]);k.fill(sea,C.water,{dx:0,dy:0,sc:0});
  const sand=COAST.map(p=>[p[0]-40,p[1]-70]).concat(COAST.slice().reverse());k.fill(sand,C.sand,{dx:0,dy:0,sc:0});k.pen(COAST,false,{w:2.2});
  let wv='';for(let i=0;i<40;i++){const x=1500+k.r()*900,y=1100+k.r()*400;if(y<polyY(COAST,x)+16)continue;wv+=`M${R1(x)} ${R1(y)}q8 -6 16 0t16 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.8" stroke-linecap="round"/>`);
  // the river, wide, with banks and ripples
  const rl=RIV.map(p=>[p[0]-34,p[1]]),rr=RIV.map(p=>[p[0]+34,p[1]]);k.fill(rl.concat(rr.slice().reverse()),C.water,{dx:0,dy:0,sc:0});k.pen(rl,false,{w:2.2});k.pen(rr,false,{w:2.2});
  let rw='';for(let i=1;i<RIV.length-1;i++)rw+=`M${RIV[i][0]-10} ${RIV[i][1]+20}q5 -5 10 0t10 0`;k.add(`<path d="${rw}" fill="none" stroke="#7FB6D8" stroke-width="1.8"/>`);
  // street grid (west streets stop at the river; bridges where they cross)
  const st=(pts,w)=>{k.add(`<path d="${smooth(pts,false)}" fill="none" stroke="#F3E6CC" stroke-width="${w}" stroke-linecap="round"/>`);k.add(`<path d="${smooth(pts,false)}" fill="none" stroke="#E2CFAA" stroke-width="1.6" stroke-dasharray="12 12"/>`)};
  STY.forEach((y,i)=>{st([[i<2?90:polyX(RIV,y)+60,y],[2000,y]],40)});STX.forEach(x=>st([[x,300],[x,1300]],40));st([[1800,1300],[1900,1200],[2100,1120]],34);st([[1000,300],[1200,240],[1500,200]],30);
  [540,800].forEach(y=>{const x0=polyX(RIV,y);k.shape(RC(x0-60,y-16,120,32),C.wood,{w:2});for(let bx=x0-52;bx<x0+56;bx+=10)k.line([[bx,y-14],[bx,y+14]],1,C.woodD);k.line([[x0-60,y-18],[x0+60,y-18]],2.2);k.line([[x0-60,y+18],[x0+60,y+18]],2.2)});
  {const y=1060,x0=polyX(RIV,y);k.shape(RC(x0-62,y-16,124,32),C.stone,{w:2});k.line([[x0-62,y-18],[x0+62,y-18]],2.2);k.line([[x0-62,y+18],[x0+62,y+18]],2.2)}
  // edges of the streets
  STY.forEach((y,i)=>{const x0=i<2?90:polyX(RIV,y)+60;k.line([[x0,y-20],[2000,y-20]],1.3,C.ink,{op:.55,step:30});k.line([[x0,y+20],[2000,y+20]],1.3,C.ink,{op:.55,step:30})});
  STX.forEach(x=>{k.line([[x-20,300],[x-20,1300]],1.3,C.ink,{op:.55,step:30});k.line([[x+20,300],[x+20,1300]],1.3,C.ink,{op:.55,step:30})});
  // filler: little houses and trees wherever no place, street, river, sea or forest is
  const free=(x,y,pad)=>{for(const id in MAPC){const c=MAPC[id];if(((x-c[0])/(150+pad))**2+((y-c[1]-14)/(120+pad))**2<1)return false}
    if(STY.some(sy=>Math.abs(y-sy)<44&&x>(sy<1000?60:polyX(RIV,sy))&&x<2030))return false;if(STX.some(sx=>Math.abs(x-sx)<44&&y>280&&y<1330))return false;
    if(Math.abs(x-polyX(RIV,y))<80)return false;if(y>polyY(COAST,x)-100)return false;if(x>1930&&y<960)return false;return true};
  const pal=[[C.wall,C.roof],[C.wall2,C.lav],[C.wall3,'#9AA7B8'],[C.wall4,C.redD],['#FFF3DC',C.orange]];
  for(let y=330;y<1460;y+=74)for(let x=90+((y/74)%2)*36;x<2000;x+=76){const jx=x+k.J(14),jy=y+k.J(10);if(!free(jx,jy,0)||k.r()<.4)continue;
    if(k.r()<.62){const c=pal[Math.floor(k.r()*pal.length)];mHouse(k,jx,jy,.95+k.r()*.25,c[0],c[1])}else mTree(k,jx,jy,.9+k.r()*.4,k.r()<.5?C.leaf:C.leaf2)}
  // the eastern forest around Maple Woods
  for(let y=330;y<940;y+=46)for(let x=1950+((y/46)%2)*22;x<2390;x+=44){const jx=x+k.J(10),jy=y+k.J(8);const c=MAPC.woods;if(((jx-c[0])/170)**2+((jy-c[1]-14)/140)**2<1||k.r()<.25)continue;k.r()<.7?mPine(k,jx,jy,.9+k.r()*.4,k.r()<.5?C.pine:C.pineD):mTree(k,jx,jy,1,'#E9B074')}
  // places
  for(const id of Object.keys(MAPC)){const [x,y]=MAPC[id],hp=E(x,y+12,104,84,12);
    const g=k.cap(()=>{ICON[id](k,x,y);
      const cap=()=>k.text(AREAS[id].label,x,y+108,36,{rot:k.J(2),halo:'#FFF8EC'});
      if(!locked.has(id))cap();
      else{k.add(`<path d="${smooth(dense(hp,true,30),true)}" fill="#EFE9E0" fill-opacity=".55"/>`);k.hatch(hp,{gap:7,col:C.graph,op:.55,w:1.4});const cx=x-28,cy=y-10;
        k.add(`<path d="M${cx-14} ${cy}v-12a14 14 0 0 1 28 0v12" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`);k.shape(RC(cx-22,cy-2,44,36),C.yellow,{w:2.4});k.add(`<circle cx="${cx}" cy="${cy+12}" r="4" fill="${C.ink}"/><path d="M${cx} ${cy+14}v9" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`);
        k.shape(RC(cx+28,cy+2,86,30),C.pink,{w:1.8,one:1});k.text(`Bond ${bonds[id]||AREAS[id].bond}`,cx+71,cy+25,26,{col:'#fff'});cap()}});
    hot(k,'data-area',id,AREAS[id].label+(locked.has(id)?' (locked)':''),hp,g);
    if(locked.has(id))k.out[k.out.length-1]=k.out[k.out.length-1].replace(`data-area="${id}"`,`data-area="${id}" data-locked="1"`)}
  // compass rose + title
  k.shape(E(2290,120,52,52,14),'#FFFFFF',{w:2});k.add(`<path d="M2290 68l10 42 -10 10 -10 -10zM2290 172l10 -42 -10 -10 -10 10z" fill="${C.pink}" stroke="${C.ink}" stroke-width="1.8" stroke-linejoin="round"/>`);k.text('N',2290,60,28);
  k.text('Paw Haven Town',330,96,72,{rot:-2,halo:'#FFF8EC'});k.line([[130,116],[540,108]],3,C.pink);
  O.sparkle(k,860,330,10);O.sparkle(k,1760,1180,8);O.heart(k,640,1300,8);O.note(k,2080,1000,14);
  O.tape(k,10,26,120,-26,'#F7B9C6');O.tape(k,2250,1450,120,-24,'#BDE7D2');O.tape(k,14,1460,100,24,'#F9E19A');
}

/* ---------- walk strips: seamless, light (no filter, no clips per object beyond hatching) ---------- */
function strip(area,draw,env){
  const k=kit(hashS('pwa-strip-'+area));k.env=env||DEF_ENV;k.rc=recolorFn(k.env,'strip');const pp=paperDefs(k,1200,400);
  // wrap(x, halfWidth, fn): draw once, and again shifted by 1200 if it crosses an edge
  k.wrap=(x,hw,fn)=>{const s=k.cap(fn);k.add(s);if(x-hw<0)k.add(`<g transform="translate(1200 0)">${s}</g>`);if(x+hw>1200)k.add(`<g transform="translate(-1200 0)">${s}</g>`)};
  // a long edge drawn as overlapping wrapped segments so it matches at x=0 and x=1200
  k.edge=(yf,w,col)=>{[[-40,430],[380,830],[780,1240]].forEach(([a,b])=>k.wrap((a+b)/2,(b-a)/2,()=>{const pts=[];for(let x=a;x<=b;x+=20)pts.push([x,yf(x)]);k.pen(pts,false,{w,col,amp:.6})}))};
  draw(k);
  const ex=k.env.def?'':` data-time="${k.env.time}" data-weather="${k.env.weather}"`;
  return assemble(k,pp,1200,`<svg class="pa-wa-strip pa-wa-strip-${area}" viewBox="0 0 1200 400" role="img" aria-label="${area} walking strip${k.env.def?'':`, ${k.env.time}, ${k.env.weather}`}"${ex}>`,true);
}
// ground treatment for strips (always wrapped so the seam stays clean)
function stripFx(k,o){const e=k.env;
  if(e.rain){sheen(k,0,1200,o.y0,o.y1,o.kind==='grass'?26:36,[],1200);
    if(o.np){for(let i=0;i<o.np;i++){const x=(i+.25+k.r()*.5)*1200/o.np,y=o.y0+16+k.r()*(o.y1-o.y0-26),rx=24+k.r()*16;k.wrap(x,rx+4,()=>puddle(k,x,y,rx,rx*.2))}}}
  if(e.snow){const n=o.ns||6;for(let i=0;i<n;i++){const x=(i+.2+k.r()*.6)*1200/n,y=o.y0+5+k.r()*(o.y1-o.y0-10),rx=(o.rx||34)+k.r()*28;k.wrap(x,rx*1.25,()=>snowPatch(k,x,y,rx,Math.max(4,rx*.17)))}}}
function waterGlints(k,x,y0,y1){const e=k.env;if(e.rain)return;
  if(e.night)k.glints.push([x,y0,y1,'#FFF2B8',e.sunny?1:.45]);else if(e.low)k.glints.push([x,y0,y1,e.time==='dawn'?'#FFE7C0':'#FFD49A',e.sunny?.9:.4])}
const SKYC={
  park:{W:1200,H:252,sun:[820,82,30],low:[820,236,30],moon:[820,74,24],clouds:[[220,70,24],[640,112,18],[1050,62,22]],rainC:[[430,52,26],[920,58,28]],birds:[[300,90,8],[326,102,6]]},
  river:{W:1200,H:212,sun:[900,70,28],low:[880,196,30],moon:[900,62,22],clouds:[[260,60,22],[640,48,18],[1080,90,20]],rainC:[[460,70,26],[860,44,28]],birds:[[560,80,8]]},
  woods:{W:1200,H:262,sun:[610,50,24],low:[606,232,28],moon:[610,46,20],clouds:[[180,40,20],[880,30,20]],rainC:[[420,34,24],[1060,44,22]],stars:40},
  beach:{W:1200,H:192,sun:[900,70,28],low:[900,180,32],moon:[900,62,22],clouds:[[260,54,22],[640,80,18],[1100,46,20]],rainC:[[460,40,26],[800,60,24]]}};
const per=(x,amps)=>amps.reduce((s,[a,n,ph])=>s+a*Math.sin(x/1200*Math.PI*2*n+ph),0);// periodic over 1200
const STRIPS={
 park(k){
  k.skyD(()=>k.add(`<rect width="1200" height="250" fill="${C.sky}" fill-opacity=".7"/>`),SKYC.park);
  const hill=x=>238+per(x,[[14,2,.3],[8,5,1.1]]);const hp=[];for(let x=0;x<=1200;x+=20)hp.push([x,hill(x)]);k.add(`<path d="${smooth(hp,false)}L1200 340L0 340Z" fill="#DCEDC4"/>`);
  k.add(`<rect y="250" width="1200" height="90" fill="${C.grass}"/>`);k.fx(()=>stripFx(k,{y0:258,y1:328,kind:'grass',ns:7}));
  [[90,1.05],[400,.95],[700,1.15],[1010,.9]].forEach(([x,s],i)=>k.wrap(x,80*s,()=>O.tree(k,x,300,s,{col:i%2?C.leaf2:C.leaf,fruit:i===2?'#F49090':null})));
  [[250,.9],[860,.9]].forEach(([x,s])=>k.wrap(x,60,()=>O.bench(k,x,318,s)));
  [[560,1],[1150,1]].forEach(([x,s])=>k.wrap(x,20,()=>O.lamp(k,x,322,s*.9)));
  [[180],[520],[640],[960]].forEach(([x])=>k.wrap(x,40,()=>O.bush(k,x,322,.7,C.leaf2,C.leafD,'#F49090')));
  // path
  k.add(`<rect y="330" width="1200" height="70" fill="${C.path}"/>`);k.edge(x=>330+per(x,[[1.5,7,.2]]),2.2);
  let pb='';for(let i=0;i<40;i++){const x=i*30+(i*37%13),y=352+(i*53%36);pb+=`<ellipse cx="${x}" cy="${y}" rx="${3+(i%3)}" ry="2" fill="#D9C39C"/>`}k.add(pb);
  k.fx(()=>{stripFx(k,{y0:338,y1:396,kind:'path',ns:5});if(k.env.night&&!k.env.rain)[[150,280],[420,250],[700,300],[980,262],[1120,300]].forEach(f=>k.flies.push(f))});
  [[60,C.red],[120,C.yellow],[330,C.lav],[470,C.red],[780,C.yellow],[930,'#FFB3C7'],[1090,C.lav]].forEach(([x,c])=>k.wrap(x,10,()=>O.flower(k,x,316,4.5,c)));
  let tf='';for(let x=10;x<1200;x+=46)tf+=`M${x} 330q1 -7 -1 -11M${x+5} 330q0 -8 3 -13`;k.add(`<path d="${tf}" fill="none" stroke="${C.grassD}" stroke-width="1.5" stroke-linecap="round"/>`);
  k.wrap(1190,30,()=>O.sparkle(k,1190,140,8));k.wrap(620,10,()=>O.heart(k,620,170,6));
 },
 river(k){
  k.skyD(()=>k.add(`<rect width="1200" height="210" fill="${C.sky}" fill-opacity=".7"/>`),SKYC.river);
  // far bank + water
  k.add(`<rect y="200" width="1200" height="30" fill="#D5EBC0"/><rect y="226" width="1200" height="96" fill="${C.water}"/>`);
  k.edge(x=>226+per(x,[[2,3,.5]]),1.8);
  let wv='';for(let i=0;i<34;i++){const x=(i*71)%1200,y=244+(i*29%66);wv+=`M${x} ${y}q6 -5 12 0t12 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`);
  k.fx(()=>{if(k.env.rain)ripples(k,0,1200,238,314,26,1200);if(k.env.snow)stripFx(k,{y0:201,y1:223,ns:6,rx:24});waterGlints(k,k.env.night?SKYC.river.moon[0]:SKYC.river.low[0],236,316)});
  [[180,1],[640,.85],[1000,1.1]].forEach(([x,s])=>k.wrap(x,70,()=>O.tree(k,x,214,s*.75,{col:C.leaf2})));
  // a wooden footbridge in the background water
  k.wrap(420,130,()=>{const bx=420;const arc=[];for(let i=0;i<=12;i++){const t=i/12;arc.push([bx-120+240*t,236-Math.sin(Math.PI*t)*34])}k.shape(arc.concat(arc.slice().reverse().map(p=>[p[0],p[1]+13])),C.wood,{w:2});for(let i=1;i<12;i+=2){const p=arc[i];k.line([[p[0]-3,p[1]+2],[p[0]+5,p[1]+11]],1,C.woodD)}k.line([[bx-112,250],[bx-104,268]],3,C.ink);k.line([[bx+112,250],[bx+104,268]],3,C.ink);for(let i=1;i<12;i++){const p=arc[i];k.line([[p[0],p[1]],[p[0],p[1]-22]],1.6)}const rail=arc.map(p=>[p[0],p[1]-22]);k.line(rail,2.2);if(k.env.snow)k.side(()=>{capLine(k,rail,4);capLine(k,arc.slice(1,-1),4)});for(let i=1;i<12;i++)k.line([[arc[i][0]-4,arc[i][1]+4],[arc[i][0]-4,arc[i][1]+14]],1,C.woodD)});
  // ducks and lily pads
  [[760,270],[812,284]].forEach(([x,y],i)=>k.wrap(x,20,()=>{k.shape(E(x,y,16-i*4,9-i*2,10),C.yellow,{w:1.6});k.shape(E(x+12-i*3,y-10+i*2,7-i,7-i,8),C.yellow,{w:1.5});k.add(`<path d="M${x+18-i*3} ${y-10+i*2}l7 2 -7 2z" fill="${C.orange}" stroke="${C.ink}" stroke-width="1"/><circle cx="${x+14-i*3}" cy="${y-12+i*2}" r="1.3" fill="${C.ink}"/>`)}));
  [[980,300],[1040,290],[120,296]].forEach(([x,y])=>k.wrap(x,16,()=>{k.shape(E(x,y,14,5,10),'#A9D08A',{w:1.4,one:1})}));
  // near bank path + reeds + stones
  k.add(`<rect y="318" width="1200" height="14" fill="#C9E4A4"/><rect y="330" width="1200" height="70" fill="${C.path}"/>`);k.edge(x=>320+per(x,[[2,4,1]]),1.8);k.edge(x=>331+per(x,[[1.5,6,.4]]),2.2);
  [[40],[300],[560],[880],[1160]].forEach(([x])=>k.wrap(x,22,()=>{for(let i=0;i<5;i++){const rx=x+i*7-14;k.line([[rx,330],[rx+k.J(3),300-k.r()*18]],1.8,'#6FA05C')}k.shape(E(x+4,296,3,8,8),'#A97E5A',{w:1.2,one:1})}));
  [[200,350],[690,362],[1080,352]].forEach(([x,y])=>k.wrap(x,20,()=>O.rock(k,x,y,.8)));
  k.fx(()=>stripFx(k,{y0:338,y1:396,kind:'path',ns:5}));
  k.wrap(600,12,()=>O.sparkle(k,600,120,7));
 },
 woods(k){
  k.skyD(()=>k.add(`<rect width="1200" height="330" fill="#E3EDDA" fill-opacity=".85"/>`),SKYC.woods);
  [[60,.9],[300,1.1],[520,.8],[760,1.2],[980,.95],[1150,.85]].forEach(([x,s],i)=>k.wrap(x,60*s,()=>O.pine(k,x,250,s*1.1,i%2?'#A9CDB0':'#BBD8BF','#86AE92')));
  k.add(`<rect y="250" width="1200" height="80" fill="#C5DDB0"/>`);k.fx(()=>stripFx(k,{y0:256,y1:328,kind:'grass',ns:7}));
  // decor kept BEHIND the walking line (v1.2.1): a small far log, mushrooms and ferns on the back of the ground band
  k.wrap(560,50,()=>{k.shape(RC(524,262,72,18),C.trunk,{w:1.8,hatch:{side:.4,gap:4,col:C.trunkD,op:.6}});k.shape(E(596,271,6,9,10),'#E7C79E',{w:1.6});for(let x=532;x<588;x+=14)k.line([[x,266],[x+10,266]],1,C.trunkD);if(k.env.snow)k.side(()=>capLine(k,[[522,262],[598,262]],5))});
  [[60,282,.75],[84,286,.5],[340,284,.7],[800,282,.8],[822,286,.5],[1120,284,.7]].forEach(([x,y,s])=>k.wrap(x,14,()=>O.mushroom(k,x,y,s)));
  [[240],[700],[1040]].forEach(([x])=>k.wrap(x,24,()=>{const gy=290;for(let i=-2;i<=2;i++){const a=-Math.PI/2+i*.38;const tip=[x+Math.cos(a)*26,gy+Math.sin(a)*25];k.line([[x,gy],[(x+tip[0])/2+i*2,(gy+tip[1])/2-3],tip],1.6,'#6FA05C');for(let j=1;j<4;j++){const t=j/4,px=x+(tip[0]-x)*t,py=gy+(tip[1]-gy)*t;k.line([[px,py],[px-5,py-2]],1.1,'#6FA05C');k.line([[px,py],[px+5,py-2]],1.1,'#6FA05C')}}}));
  [[160,1.15],[430,1.3],[690,1.1],[930,1.35]].forEach(([x,s],i)=>k.wrap(x,60*s,()=>i%2?O.pine(k,x,322,s,C.pineD,'#557F66'):O.tree(k,x,322,s*.95,{col:'#E9B074',colD:'#C98A4E'})));
  k.add(`<rect y="330" width="1200" height="70" fill="#D9C2A0"/>`);k.edge(x=>330+per(x,[[2,5,.7]]),2.3);
  let lv='';for(let i=0;i<36;i++){const x=(i*61)%1200+6,y=344+(i*37%50);lv+=`<path d="M${x} ${y}q5 -6 10 0q-5 6 -10 0z" fill="${['#E9A86A','#F2C46D','#D98B5F'][i%3]}" opacity=".85"/>`}k.add(lv);
  k.wrap(900,10,()=>O.sparkle(k,900,90,7));
  k.fx(()=>{stripFx(k,{y0:338,y1:396,kind:'path',ns:5});if(k.env.night&&!k.env.rain)[[120,290],[380,262],[620,240],[860,300],[1060,270],[250,220]].forEach(f=>k.flies.push(f))});
 },
 beach(k){
  k.skyD(()=>k.add(`<rect width="1200" height="190" fill="${C.sky}" fill-opacity=".75"/>`),SKYC.beach);k.add(`<rect y="186" width="1200" height="84" fill="${C.water}"/>`);
  k.edge(x=>188+per(x,[[1,4,0]]),1.6,C.graph);
  let wv='';for(let i=0;i<30;i++){const x=(i*83)%1200,y=206+(i*31%52);wv+=`M${x} ${y}q7 -6 14 0t14 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`);
  // foamy shoreline
  const sh=x=>268+per(x,[[6,3,.4],[3,8,1.3]]);const sp=[];for(let x=0;x<=1200;x+=20)sp.push([x,sh(x)]);
  k.add(`<path d="${smooth(sp,false)}L1200 400L0 400Z" fill="${C.sand}"/>`);k.edge(sh,2,C.ink);
  let fo='';for(let x=0;x<1200;x+=40)fo+=`M${x} ${R1(sh(x)-5)}q10 -6 20 0`;k.add(`<path d="${fo}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);
  k.fx(()=>{if(k.env.rain)ripples(k,0,1200,198,258,22,1200);waterGlints(k,k.env.night?SKYC.beach.moon[0]:SKYC.beach.low[0],194,262);stripFx(k,{y0:300,y1:396,kind:'path',ns:6})});
  {const bs=k.cap(()=>[[160,80],[420,60],[980,96]].forEach(([x,y])=>k.wrap(x,12,()=>O.bird(k,x,y,10))));if(!k.env.night&&!k.env.rain)k.add(bs)}
  // decor kept BEHIND the walking line (v1.2.1): umbrella + towel pushed up the beach, a sailboat and dune grass; no crab, castle, ball or shells on the path
  k.wrap(300,80,()=>{k.add('<g transform="translate(0 -40)">');k.line([[300,330],[318,210]],3,C.ink);const u=[];for(let i=0;i<=10;i++){const a=Math.PI+i/10*Math.PI;u.push([318+Math.cos(a)*84,222+Math.sin(a)*40])}u.push([402,222]);k.shape(u,C.red,{w:2});for(let i=1;i<5;i++)k.line([[318,184],[318-84+i*34,222]],1.2);k.shape([[230,334],[360,334],[350,352],[220,352]],C.mint,{w:1.8});k.line([[240,340],[350,340]],1.2,'#fff');if(k.env.snow)k.side(()=>capLine(k,u.slice(1,10),7));k.add('</g>')});
  k.wrap(600,40,()=>{k.shape([[572,224],[628,224],[620,234],[580,234]],C.red,{w:1.6});k.line([[600,224],[600,176]],1.6);k.shape([[602,180],[628,220],[602,220]],'#FFFFFF',{w:1.4,one:1});k.shape([[598,186],[578,220],[598,220]],'#FFD8E0',{w:1.4,one:1})});
  [[130],[700],[1060]].forEach(([x])=>k.wrap(x,22,()=>{for(let i=0;i<6;i++){const bx=x+i*6-15;k.line([[bx,294],[bx+k.J(6)+(i-2.5)*3,262-k.r()*12]],1.6,'#9BB86A')}if(k.env.snow)k.side(()=>capLine(k,[[x-16,290],[x+16,290]],4))}));
  let dt='';for(let i=0;i<50;i++){dt+=`<circle cx="${(i*47)%1200}" cy="${290+(i*29%100)}" r="1.2" fill="#D9BF84"/>`}k.add(dt);
  k.wrap(700,10,()=>O.sparkle(k,700,130,7));
 }
};

/* ---------- hangout hubs (v1.2.1): house, park, river, woods, beach ----------
   Shared overlay zones (kept clear): dog area x300-560 ground y~500, bowl spot x~250 y~520,
   right decor zone x620-860 y330-520 holds only the scene feature (dog bed, bench, ducks, log seat, umbrella). */
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

function hubPark(k){
  k.skyD(()=>{skyBand(k,1000,400);O.sun(k,860,86,34);O.cloud(k,300,70,26);O.cloud(k,600,120,20);O.bird(k,470,80,9);O.bird(k,494,94,7)},
    {W:1000,H:410,sun:[860,86,34],low:[800,318,34],moon:[850,86,30],clouds:[[300,70,26],[600,124,20],[140,160,18]],rainC:[[480,50,30],[860,170,24],[760,40,26]],birds:[[470,80,9],[494,94,7]],stars:46});
  const hl=[[0,336],[150,304],[330,326],[520,296],[700,320],[860,300],[1000,318],[1000,420],[0,420]];k.fill(hl,'#DCEDC4',{dx:0,dy:0,sc:0});k.pen(hl.slice(0,7),false,{w:1.6,col:C.graph});
  for(let x=24;x<1000;x+=62){const y=332+k.J(6);k.line([[x,y+8],[x,y+22]],1.4,C.trunkD);k.shape(E(x,y,17+k.r()*5,14+k.r()*3,10),'#C3DFA5',{w:1.3,lcol:C.graph,one:1})}
  const lawn=[[0,402],[1000,396],[1000,600],[0,600]];k.fill(lawn,C.grass,{dx:0,dy:0,sc:0});k.pen([[0,402],[500,400],[1000,396]],false,{w:2});
  [[460,590,120,20],[780,575,100,18],[960,470,60,14]].forEach(q=>k.fill(E(q[0],q[1],q[2],q[3],12),C.grass2,{op:.7}));
  const pth=[[0,416],[300,410],[700,412],[1000,406],[1000,438],[700,446],[300,444],[0,452]];k.fill(pth,C.path,{dx:0,dy:0,sc:0});k.pen(pth.slice(0,4),false,{w:1.8});k.pen(pth.slice(4),false,{w:1.8});
  let pb='';for(let i=0;i<46;i++){const x=k.r()*1000,y=420+k.r()*24;pb+=`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(2+k.r()*2.5)}" ry="1.6" fill="#D9C39C"/>`}k.add(pb);
  tufts(k,452,598,130);
  k.fx(()=>hubFx(k,{sheen:[456,598],puddles:[[440,576,46,9],[742,562,40,8],[330,430,30,6],[880,424,28,5]],patches:[[432,574,72,13],[742,566,60,11],[600,432,46,7],[150,436,54,8],[280,600,44,8],[940,560,40,8]],flies:[[200,470],[600,500],[880,560],[470,584],[150,380],[700,300]]}));
  O.tree(k,70,414,1.25);O.tree(k,440,406,1,{col:C.leaf2});O.tree(k,935,406,1.2,{fruit:'#F49090'});
  O.bush(k,250,412,.8,C.leaf2,C.leafD,'#FFB3C7');O.bush(k,560,410,.55,C.leaf2,C.leafD);
  O.lamp(k,590,448,1.05);
  // front-left flowerbed with a brick rim
  const bed=E(112,530,96,44,16);k.shape(bed,C.soil,{w:2,hatch:{side:.6,gap:5,col:'#B98F68',op:.5}});
  k.add(`<ellipse cx="112" cy="530" rx="96" ry="44" fill="none" stroke="#D9897A" stroke-width="5" stroke-dasharray="14 4" opacity=".75"/>`);
  const fc=[C.red,C.yellow,C.lav,'#FFB3C7',C.orange];for(let r=0;r<3;r++)for(let i=0;i<5-(r===1?0:1);i++){const x=50+i*30+(r===1?-8:7)+k.J(3),y=508+r*20;O.flower(k,x,y,4.6,fc[(i+r)%5])}
  if(k.env.snow)k.side(()=>capLine(k,E(112,530,98,46,16).slice(8,16).concat([[210,530]]),6));
  O.bench(k,740,512,1.3);
  signpost(k,930,586,'Sunny Park');
  [[600,566,C.red],[630,588,C.yellow],[884,520,C.lav],[275,592,C.red],[562,590,'#FFB3C7'],[990,600,C.yellow]].forEach(f=>O.flower(k,f[0],f[1],5,f[2]));
  O.sparkle(k,700,220,8);O.heart(k,380,160,6);O.note(k,640,190,12);
  O.tape(k,6,26,90,-24,'#F7B9C6');O.tape(k,930,560,80,-28,'#BDE7D2');
}

function hubRiver(k){
  k.skyD(()=>{skyBand(k,1000,330);O.sun(k,860,80,32);O.cloud(k,300,80,24);O.cloud(k,640,60,20);O.bird(k,440,90,8);O.bird(k,462,100,6)},
    {W:1000,H:340,sun:[860,80,32],low:[280,300,34],moon:[520,82,28],clouds:[[300,80,24],[640,60,20],[900,150,18]],rainC:[[120,50,26],[480,130,24],[760,46,28]],birds:[[440,90,8],[462,100,6]],stars:44});
  const fb=[[0,300],[180,286],[380,298],[560,284],[760,296],[1000,288],[1000,334],[0,334]];k.fill(fb,'#D5EBC0',{dx:0,dy:0,sc:0});k.pen(fb.slice(0,6),false,{w:1.6,col:C.graph});
  O.tree(k,90,316,.8);O.pine(k,210,320,.7);O.tree(k,770,314,.72,{col:C.leaf2});O.pine(k,880,318,.85);O.tree(k,975,316,.7);
  const wat=[[0,322],[1000,318],[1000,446],[0,450]];k.fill(wat,C.water,{dx:0,dy:0,sc:0});k.pen([[0,322],[500,320],[1000,318]],false,{w:1.8});
  let wv='';for(let i=0;i<36;i++){const x=k.r()*980,y=334+k.r()*104;wv+=`M${R1(x)} ${R1(y)}q6 -5 12 0t12 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`);
  k.fx(()=>{if(k.env.rain)ripples(k,0,1000,330,440,26);waterGlints(k,k.env.night?520:280,340,436)});
  // little footbridge in the back
  {const bx=500;const arc=[];for(let i=0;i<=12;i++){const t=i/12;arc.push([bx-120+240*t,334-Math.sin(Math.PI*t)*36])}
   k.shape(arc.concat(arc.slice().reverse().map(p=>[p[0],p[1]+13])),C.wood,{w:2});for(let i=1;i<12;i+=2){const p=arc[i];k.line([[p[0]-3,p[1]+2],[p[0]+5,p[1]+11]],1,C.woodD)}
   for(let i=1;i<12;i++){const p=arc[i];k.line([[p[0],p[1]],[p[0],p[1]-22]],1.6)}const rail=arc.map(p=>[p[0],p[1]-22]);k.line(rail,2.2);
   if(k.env.snow)k.side(()=>{capLine(k,rail,4);capLine(k,arc.slice(1,-1),4)})}
  // rowboat tied up on the left
  const hull=[[28,392],[196,390],[178,420],[46,422]];k.shape(hull,'#E8A07E',{w:2.2,hatch:{side:.6,gap:4,col:'#C97D5E',op:.5}});k.line([[40,398],[188,396]],1.4,C.ink,{op:.7});k.text('Puddle',112,415,18,{rot:-1});
  k.line([[150,392],[176,362]],3,C.trunkD);k.line([[196,394],[222,452]],1.4,C.ink,{op:.8});k.line([[222,476],[224,436]],4,C.ink);
  if(k.env.snow)k.side(()=>capLine(k,[[30,391],[196,389]],5));
  [[640,382],[846,404],[260,372],[420,428]].forEach(([x,y])=>{k.shape(E(x,y,15,5,10),'#A9D08A',{w:1.4,one:1});k.line([[x,y],[x+10,y-3]],1,C.leafD)});
  // near bank
  const nb=x=>442+per(x*1.2,[[3,3,.4],[2,7,1]]);const bank=[];for(let x=0;x<=1000;x+=25)bank.push([x,nb(x)]);
  k.fill(bank.concat([[1000,600],[0,600]]),C.grass,{dx:0,dy:0,sc:0});k.add(`<path d="${smooth(bank,false)}L1000 ${R1(nb(1000)+16)}L0 ${R1(nb(0)+16)}Z" fill="#E3D3A6"/>`);k.pen(bank,false,{w:2.2});
  tufts(k,470,598,110);
  // reeds and cattails at both ends
  [[30,452],[78,456],[118,452],[884,448],[930,452],[972,450]].forEach(([x,gy])=>{for(let i=0;i<5;i++){const rx=x+i*7-14;k.line([[rx,gy],[rx+k.J(4),gy-40-k.r()*26]],1.8,'#6FA05C')}k.shape(E(x+3,gy-58,3.4,10,8),'#A97E5A',{w:1.2,one:1});if(k.env.snow)k.side(()=>capLine(k,[[x-1,gy-68],[x+7,gy-68]],3))});
  // the decor zone: a white mama duck and two ducklings at the water's edge
  duck(k,700,426,1.8,'#FFF8EC');duck(k,772,436,1.05,C.yellow);duck(k,816,440,.95,C.yellow);
  k.fx(()=>hubFx(k,{sheen:[470,598],puddles:[[440,578,44,9],[744,568,38,8],[110,566,34,7]],patches:[[438,578,70,12],[742,570,60,11],[100,560,50,9],[930,540,46,9],[300,300,40,6],[700,296,46,6]],flies:[[150,500],[600,476],[880,560],[460,590]]}));
  O.rock(k,600,560,1);O.rock(k,84,560,.8);signpost(k,930,590,'Riverside');
  [[610,592,C.yellow],[280,596,C.lav],[560,594,C.red]].forEach(f=>O.flower(k,f[0],f[1],5,f[2]));
  O.sparkle(k,620,200,7);O.heart(k,330,170,6);
  O.tape(k,8,20,90,-26,'#F9E19A');O.tape(k,920,568,80,-24,'#D3C6F1');
}

function hubWoods(k){
  k.skyD(()=>{skyBand(k,1000,380);O.sun(k,520,64,28);O.cloud(k,300,60,20);O.cloud(k,720,40,22);O.bird(k,640,96,8)},
    {W:1000,H:390,sun:[520,62,28],low:[520,350,32],moon:[520,62,26],clouds:[[300,60,20],[720,40,22]],rainC:[[140,40,24],[880,60,24],[520,130,22]],birds:[[640,96,8]],stars:34});
  [[40,1.05],[150,.9],[250,1.15],[360,.95],[660,1.1],[760,.9],[860,1.2],[970,1]].forEach(([x,s],i)=>O.pine(k,x,388,s,i%2?'#BBD8BF':'#A9CDB0','#86AE92'));
  const fl=[[0,396],[1000,392],[1000,600],[0,600]];k.fill(fl,'#CFE3B4',{dx:0,dy:0,sc:0});k.pen([[0,396],[1000,392]],false,{w:1.8,col:C.graph});
  [[200,470,110,18],[820,580,140,20],[60,600,90,16]].forEach(q=>k.fill(E(q[0],q[1],q[2],q[3],12),'#BCD69E',{op:.8}));
  const trail=[[470,394],[530,394],[600,470],[650,600],[360,600],[420,470]];k.fill(trail,'#E6D3AE',{dx:0,dy:0,sc:0});k.line([[470,396],[420,470],[360,598]],1.4,C.graph,{op:.8});k.line([[530,396],[600,470],[650,598]],1.4,C.graph,{op:.8});
  O.tree(k,470,398,.9,{col:'#F2C46D',colD:'#D3A04A'});
  tufts(k,410,598,90,'#86AE6E');
  // dappled light through the canopy (not at night, softer when overcast)
  k.side(()=>{const e=k.env;if(e.night||e.rain)return;const op=e.sunny?1:.5,lc=e.time==='dusk'?'#FFD9A8':e.time==='dawn'?'#FFE6D0':'#FFF6C8';
    [[[400,0],[450,0],[566,476],[500,476]],[[540,0],[574,0],[700,468],[656,468]],[[290,0],[316,0],[380,460],[344,460]]].forEach(p=>k.add(`<path d="M${p.map(q=>q.join(' ')).join('L')}Z" fill="${lc}" opacity="${R1(.2*op)}"/>`));
    [[440,470,34,7],[520,500,26,6],[360,532,28,6],[600,484,18,5],[700,560,30,6],[300,580,22,5],[560,580,30,6]].forEach(q=>k.fill(blobP(q[0],q[1],q[2],q[3],k.r,9,.3),lc,{dx:0,dy:0,op:R1(.55*op)}))});
  k.fx(()=>hubFx(k,{sheen:[420,598],puddles:[[470,566,40,8],[520,420,26,5],[764,566,40,8]],patches:[[470,568,70,12],[760,566,62,11],[300,420,50,8],[700,420,54,8],[950,570,40,8],[200,600,50,8]],flies:[[250,440],[600,420],[880,380],[470,560],[160,330],[760,300]]}));
  O.tree(k,110,442,1.55,{col:'#E9A86A',colD:'#C98A4E'});
  O.pine(k,948,454,1.85,C.pineD,'#557F66');
  // stump, mushrooms, ferns, leaves
  k.shape([[106,560],[110,520],[176,520],[180,560]],C.trunk,{w:2,hatch:{side:.5,gap:4,col:C.trunkD,op:.6}});k.shape(E(143,520,37,11,14),'#E7C79E',{w:2});k.add(`<ellipse cx="143" cy="520" rx="24" ry="7" fill="none" stroke="${C.trunkD}" stroke-width="1.2"/><ellipse cx="143" cy="520" rx="11" ry="3.5" fill="none" stroke="${C.trunkD}" stroke-width="1.2"/>`);
  if(k.env.snow)k.side(()=>capLine(k,[[104,520],[182,520]],7));
  [[205,470,.8],[222,476,.55],[600,524,.9],[892,560,1.1],[920,568,.7],[40,580,.9]].forEach(([x,y,s])=>O.mushroom(k,x,y,s));
  [[30,600],[980,600],[590,450]].forEach(([x,gy])=>{for(let i=-2;i<=2;i++){const a=-Math.PI/2+i*.38;const tip=[x+Math.cos(a)*40,gy+Math.sin(a)*38];k.line([[x,gy],[(x+tip[0])/2+i*3,(gy+tip[1])/2-4],tip],1.8,'#6FA05C');for(let j=1;j<5;j++){const t=j/5,px=x+(tip[0]-x)*t,py=gy+(tip[1]-gy)*t;k.line([[px,py],[px-6,py-3]],1.2,'#6FA05C');k.line([[px,py],[px+6,py-3]],1.2,'#6FA05C')}}});
  let lv='';for(let i=0;i<34;i++){const x=k.r()*1000,y=420+k.r()*176;if(inHZ(x,y))continue;lv+=`<path d="M${R1(x)} ${R1(y)}q5 -6 10 0q-5 6 -10 0z" fill="${['#E9A86A','#F2C46D','#D98B5F'][i%3]}" opacity=".85"/>`}k.add(lv);
  // the decor zone: a mossy log seat
  k.shape(RC(650,470,192,38),C.trunk,{w:2.2,hatch:{side:.4,gap:4,col:C.trunkD,op:.6}});for(let x=664;x<830;x+=22)k.line([[x,478],[x+16,478+k.J(2)]],1,C.trunkD);
  k.shape(E(842,489,13,19,10),'#E7C79E',{w:2});k.add(`<ellipse cx="842" cy="489" rx="6" ry="10" fill="none" stroke="${C.trunkD}" stroke-width="1.2"/>`);
  k.fill([[664,472],[720,466],[770,470],[740,476],[690,477]],'#9CC67E',{op:.9});O.mushroom(k,800,470,.7);
  if(k.env.snow)k.side(()=>capLine(k,[[648,470],[844,470]],8));
  O.sparkle(k,260,200,7);O.heart(k,700,170,6);
  O.tape(k,6,18,90,-26,'#F7B9C6');O.tape(k,920,572,80,-24,'#B9D4F3');
}

function hubBeach(k){
  k.skyD(()=>{skyBand(k,1000,300);O.sun(k,850,76,32);O.cloud(k,260,70,24);O.cloud(k,600,110,18);O.bird(k,380,90,9);O.bird(k,404,104,7)},
    {W:1000,H:300,sun:[850,76,32],low:[520,292,38],moon:[520,80,28],clouds:[[260,70,24],[640,108,18],[940,170,16]],rainC:[[120,46,26],[460,40,28],[780,60,26]],birds:[[380,90,9],[404,104,7],[700,150,8]],stars:40});
  k.add(`<rect y="290" width="1000" height="120" fill="${C.water}"/><rect y="290" width="1000" height="28" fill="#A9D3EC" opacity=".7"/>`);k.pen([[0,291],[500,290],[1000,291]],false,{w:1.6,col:C.graph});
  let wv='';for(let i=0;i<40;i++){const x=k.r()*980,y=302+k.r()*84;wv+=`M${R1(x)} ${R1(y)}q7 -6 14 0t14 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`);
  k.fx(()=>{if(k.env.rain)ripples(k,0,1000,300,388,24);waterGlints(k,520,300,388)});
  // a sailboat on the horizon and a buoy
  k.shape([[752,298],[812,298],[804,308],[760,308]],C.red,{w:1.6});k.line([[782,298],[782,246]],1.6);k.shape([[784,250],[810,294],[784,294]],'#FFFFFF',{w:1.5,one:1});k.shape([[780,256],[760,294],[780,294]],'#FFD8E0',{w:1.5,one:1});
  k.shape(E(380,352,8,9,10),'#FFFFFF',{w:1.5});k.add(`<path d="M372 352h16" stroke="${C.redD}" stroke-width="5"/>`);
  // shoreline + sand
  const sh=x=>396+per(x*1.2,[[6,3,.4],[3,8,1.3]]);const sp=[];for(let x=0;x<=1000;x+=20)sp.push([x,sh(x)]);
  k.add(`<path d="${smooth(sp,false)}L1000 600L0 600Z" fill="${C.sand}"/><path d="${smooth(sp,false)}L1000 ${R1(sh(1000)+22)}L0 ${R1(sh(0)+22)}Z" fill="#EBD39C" opacity=".8"/>`);k.pen(sp,false,{w:2});
  let fo='';for(let x=0;x<1000;x+=40)fo+=`M${x} ${R1(sh(x)-5)}q10 -6 20 0`;k.add(`<path d="${fo}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);
  let dt='';for(let i=0;i<70;i++){const x=k.r()*1000,y=430+k.r()*168;if(inHZ(x,y))continue;dt+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="1.3" fill="#D9BF84"/>`}k.add(dt);
  k.fx(()=>hubFx(k,{sheen:[412,470],puddles:[[440,578,40,8],[600,452,30,6],[900,480,34,7]],patches:[[440,578,66,12],[600,456,46,8],[900,486,50,9],[90,600,50,8],[280,440,40,7],[960,560,40,8]]}));
  // lifeguard hut on stilts
  [[66,470,80,330],[184,470,170,330]].forEach(([a,b,c,d])=>k.line([[a,b],[c,d]],4,C.ink));k.line([[74,440],[178,360]],2,C.ink);k.line([[176,440],[72,360]],2,C.ink);
  k.shape(RC(40,320,172,12),C.wood,{w:2});k.shape(RC(56,252,140,70),'#FFFFFF',{w:2.2});for(let x=64;x<196;x+=28)k.fill(RC(x,254,13,66),'#F7B2B2',{op:.85,dx:0,dy:0});k.pen(RC(56,252,140,70),true,{w:2});
  O.window(k,104,266,44,32,{});k.shape([[38,256],[126,206],[214,256]],C.red,{w:2.2,hatch:{side:.6,gap:5,col:C.redD,op:.55}});
  k.line([[126,206],[126,180]],1.6);k.shape([[126,180],[148,186],[126,194]],C.yellow,{w:1.4,one:1});
  k.shape(RC(48,332,156,22),'#FFFFFF',{w:1.8,one:1});k.text('LIFEGUARD',126,350,19,{col:'#D2475B',ls:1});
  k.line([[200,332],[232,470]],2.6);k.line([[214,332],[246,470]],2.6);for(let t=.15;t<1;t+=.17)k.line([[200+32*t,332+138*t],[214+32*t,332+138*t]],2);
  if(k.env.snow)k.side(()=>{capLine(k,[[36,256],[126,205],[216,256]],10);capLine(k,[[40,320],[212,320]],5)});
  // the decor zone: beach umbrella and towel
  k.shape([[660,496],[832,492],[842,516],[650,520]],C.mint,{w:1.9});k.line([[668,502],[834,498]],1.6,'#fff');k.line([[656,512],[838,508]],1.6,'#fff');
  k.line([[762,512],[748,366]],3.2,C.ink);
  {const u=[];for(let i=0;i<=12;i++){const a=Math.PI+i/12*Math.PI;u.push([750+Math.cos(a)*92,374+Math.sin(a)*42])}k.shape(u,C.red,{w:2.2});
   for(let i=0;i<4;i++){const a0=Math.PI+(i*2+1)/8*Math.PI,a1=Math.PI+(i*2+2)/8*Math.PI;k.fill([[750,334],[750+Math.cos(a0)*92,374+Math.sin(a0)*42+2],[750+Math.cos(a1)*92,374+Math.sin(a1)*42+2]],'#FFFFFF',{dx:0,dy:0,op:.9})}
   k.pen(u,true,{w:2.2});if(k.env.snow)k.side(()=>capLine(k,u.slice(1,12),8))}
  k.add(`<path d="M700 508c4 -6 14 -6 18 0M722 508c4 -6 14 -6 18 0M718 505h4" fill="none" stroke="${C.ink}" stroke-width="2.2"/>`);
  // shells, starfish, bucket, a small sandcastle
  [[430,584],[620,574],[938,540]].forEach(([x,y],i)=>{if(i%2)k.shape([[x-9,y+5],[x,y-8],[x+9,y+5]],'#FFD2C2',{w:1.4,one:1});else{k.shape(E(x,y,9,7,10),'#FFC9B0',{w:1.4,one:1});k.line([[x,y-6],[x,y+6]],1)}});
  {let d='';for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,rr=j%2?6:15;d+=(j?'L':'M')+R1(84+Math.cos(a)*rr)+' '+R1(566+Math.sin(a)*rr)}k.add(`<path d="${d}Z" fill="${C.orange}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`)}
  k.shape([[876,560],[912,560],[908,596],[880,596]],C.blue,{w:1.8});k.add(`<path d="M876 562q18 -22 36 0" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);k.line([[924,596],[944,552]],2.6,C.trunkD);k.shape([[940,546],[952,540],[956,552],[946,556]],C.yellow,{w:1.4,one:1});
  k.shape([[150,560],[154,536],[206,536],[210,560]],C.sandD,{w:1.8,hatch:{side:.6,gap:4,col:'#CFAE70',op:.6}});for(let x=158;x<204;x+=12)k.shape(RC(x,528,7,9),C.sandD,{w:1.3,one:1});
  if(k.env.snow)k.side(()=>capLine(k,[[152,536],[208,536]],5));
  O.sparkle(k,640,210,7);O.heart(k,330,170,6);
  O.tape(k,8,20,90,-26,'#F9E19A');O.tape(k,920,568,80,-24,'#D3C6F1');
}

function hubHouse(k,o={}){
  // wallpaper with soft stripes and tiny doodled flowers
  k.add(`<rect width="1000" height="400" fill="#FBEBD8"/>`);
  let st='';for(let x=10;x<1000;x+=56)st+=`<rect x="${x}" width="24" height="392" fill="#F7DFC6" opacity=".75"/>`;k.add(st);
  let fd='';for(let y=40;y<380;y+=64)for(let x=50+((y/64)%2)*28;x<1000;x+=112){fd+=`<g fill="#F4BFC9" opacity=".6"><circle cx="${x}" cy="${y-3}" r="2.4"/><circle cx="${x+3}" cy="${y}" r="2.4"/><circle cx="${x}" cy="${y+3}" r="2.4"/><circle cx="${x-3}" cy="${y}" r="2.4"/></g>`}k.add(fd);
  // floor planks + baseboard
  k.fill([[0,400],[1000,400],[1000,600],[0,600]],'#EBCFA8',{dx:0,dy:0,sc:0});
  for(let y=400;y<600;y+=28){k.line([[0,y],[1000,y]],1.3,C.woodD);for(let x=(y/28)%2?70:160;x<1000;x+=200)k.line([[x,y],[x,y+28]],1.2,C.woodD)}
  k.shape(RC(0,386,1000,16),'#E3C49E',{w:2});
  // kitchen corner (right)
  k.line([[866,0],[866,392]],1.6,C.graph);k.add(`<rect x="868" width="132" height="392" fill="#F3EEE4"/>`);
  k.shape(RC(874,210,126,90),'#E6F0F2',{w:1.6,one:1});let tl='';for(let x=874;x<1000;x+=21)tl+=`M${x} 210v90`;for(let y=232;y<300;y+=22)tl+=`M874 ${y}h126`;k.add(`<path d="${tl}" stroke="#C7D7DC" stroke-width="1.2"/>`);
  k.shape(RC(878,64,122,124),C.mint,{w:2.2,hatch:{side:.8,gap:5,col:'#A6D2BD',op:.5}});k.line([[938,70],[938,182]],1.6);k.add(`<circle cx="928" cy="160" r="3" fill="${C.ink}"/><circle cx="948" cy="160" r="3" fill="${C.ink}"/>`);
  k.shape(RC(866,296,134,16),C.wood,{w:2});k.shape(RC(872,312,128,96),C.mint,{w:2.2,hatch:{side:.8,gap:5,col:'#A6D2BD',op:.5}});k.line([[936,318],[936,402]],1.6);k.add(`<circle cx="926" cy="340" r="3" fill="${C.ink}"/><circle cx="946" cy="340" r="3" fill="${C.ink}"/>`);
  k.shape([[892,296],[888,262],[926,262],[922,296]],C.red,{w:1.9});k.line([[888,272],[876,262]],2.4);k.add(`<path d="M896 262q11 -16 22 0" fill="none" stroke="${C.ink}" stroke-width="2.2"/>`);
  k.shape(RC(944,252,40,44),C.glass,{w:1.7});k.shape(RC(940,244,48,10),C.orange,{w:1.5});k.text('treats',964,282,15);
  // bookshelf (left)
  k.shape(RC(24,110,186,290),C.wood,{w:2.4,hatch:{side:.85,gap:5,col:C.woodD,op:.45}});k.shape(RC(36,120,162,270),'#D9B48E',{w:1.6,one:1});
  const bc=[C.red,C.blue,C.yellow,C.mint,C.lav,'#FFB3C7',C.orange,'#9AC8E8'];
  [180,250,320,390].forEach((sy,row)=>{k.shape(RC(30,sy-4,174,8),C.woodD,{w:1.6,one:1});if(row===3)return;let x=42;while(x<188){const w=10+k.r()*9,h=36+k.r()*20;if(row===1&&x>140){k.shape(E(170,sy-14,14,10,10),C.yellow,{w:1.6});k.add(`<path d="M160 ${sy-16}q10 6 20 0" fill="none" stroke="#fff" stroke-width="2"/>`);break}
    k.shape(RC(x,sy-4-h,w,h),bc[Math.floor(k.r()*bc.length)],{w:1.4,one:1});k.line([[x+2,sy-h+6],[x+w-2,sy-h+6]],1,C.ink,{op:.5});x+=w+2}});
  k.shape([[60,384],[64,344],[108,344],[112,384]],C.roof,{w:1.6});for(let i=0;i<5;i++)k.shape(E(70+i*8,336-k.r()*8,6,12,8,i*.5-1),C.leaf,{w:1.3,one:1});
  k.shape([[140,110],[144,86],[176,86],[180,110]],C.roof,{w:1.6});[[150,84],[170,82],[160,74]].forEach(([x,y])=>k.shape(E(x,y,7,10,8),C.leaf2,{w:1.3,one:1}));k.line([[178,96],[194,128],[188,160]],1.6,'#6FAE5C');
  // framed crayon portrait of the dog
  k.shape(RC(234,136,80,96),'#E1B987',{w:2.2});k.shape(RC(244,146,60,76),'#FFFFFF',{w:1.4,one:1});
  k.add(`<g stroke="#2a2420" stroke-width="2.6" fill="none" stroke-linecap="round"><path d="M256 196q16 -12 34 -2q4 12 -6 16q-16 4 -28 -4z" fill="#F5C26B"/><circle cx="288" cy="184" r="9" fill="#F5C26B"/><path d="M262 208v8M282 208v8"/></g><circle cx="290" cy="182" r="2" fill="#2a2420"/>`);
  // window over the sofa, showing the real sky
  O.window(k,350,80,220,170,{curtain:'#F7C5CF',frame:'#FFFFFF',noLit:1,glass:skyGrad(k,80,250),inside:()=>k.side(()=>windowView(k,350,80,220,170,{rainGlass:1,sillSnow:1}))});
  // sofa
  const sb='#B9D3F2',sd='#8FAFD6';
  k.shape(RC(306,286,268,74),sb,{w:2.3,hatch:{side:.8,gap:5,col:sd,op:.5}});[[372,316],[440,316],[508,316]].forEach(([x,y])=>k.add(`<circle cx="${x}" cy="${y}" r="2.6" fill="${C.ink}"/><path d="M${x-8} ${y-8}l6 6M${x+8} ${y-8}l-6 6" stroke="${sd}" stroke-width="1.4"/>`));
  k.shape(RC(300,350,280,40),sb,{w:2.2});k.line([[440,352],[440,388]],1.6);k.line([[306,358],[574,358]],1,'#fff',{op:.7,dash:'5 5'});
  [[286,304],[566,304]].forEach(([x,y])=>k.shape([[x,y+100],[x,y+12],[x+4,y],[x+24,y],[x+28,y+12],[x+28,y+100]],sb,{w:2.2,hatch:{side:.6,gap:5,col:sd,op:.5}}));
  k.shape(RC(290,388,300,22),sd,{w:2});[[300,410],[574,410]].forEach(([x,y])=>k.shape(RC(x,y,10,12),C.woodD,{w:1.4,one:1}));
  k.shape([[326,346],[330,312],[372,308],[380,344]],'#FFC9D3',{w:1.8});k.shape([[500,346],[506,312],[550,314],[552,346]],C.yellow,{w:1.8});O.heart(k,527,330,7);
  // floor lamp
  k.shape(E(612,424,22,6,10),C.woodD,{w:1.6});k.line([[612,424],[612,214]],3.4,C.ink);const shade=[[578,214],[646,214],[632,168],[592,168]];k.shape(shade,'#FCE59A',{w:2.2,hatch:{side:.7,gap:4,col:'#E8C96A',op:.6}});
  let fr='';for(let x=582;x<646;x+=6)fr+=`M${x} 214v6`;k.add(`<path d="${fr}" stroke="${C.ink}" stroke-width="1.2"/>`);
  if(k.env.lit)k.lamps.push({x:612,y:192,s:1.5,glass:shade,big:1});
  // "home sweet home" stitch sampler above the bed
  k.shape(RC(680,118,150,84),'#FFFFFF',{w:2.2});k.add(`<rect x="690" y="128" width="130" height="64" fill="none" stroke="${C.pink}" stroke-width="1.6" stroke-dasharray="4 3"/>`);k.text('home sweet',755,156,22);k.text('home',755,182,22);O.heart(k,810,178,5);O.tape(k,734,104,40,-6,'#BDE7D2');
  // plant by the sofa
  k.shape([[240,400],[236,364],[282,364],[278,400]],C.roof,{w:1.8,hatch:{side:.6,gap:4,col:C.roofD,op:.5}});[[-1.9,24],[-1.4,30],[-1.1,26],[-.7,22],[-2.3,20]].forEach(([a,l])=>{const x=259+Math.cos(a)*l*1.4,y=360+Math.sin(a)*l*1.6;k.shape(E(x,y,10,16,8,a+Math.PI/2),C.leaf2,{w:1.4,one:1});k.line([[259,362],[x,y]],1.2,C.leafD)});
  // rug (flat, under the dog area) and the dog bed in the decor zone
  k.shape(E(440,522,182,44,18),'#F7C5CF',{w:2});k.add(`<ellipse cx="440" cy="522" rx="150" ry="32" fill="none" stroke="#fff" stroke-width="2.4" stroke-dasharray="8 6"/><ellipse cx="440" cy="522" rx="96" ry="18" fill="none" stroke="#E8A0B0" stroke-width="2"/>`);
  {const bd=k.cap(()=>{// built-in dog bed (omitted with {bed:false}; drawn either way so nothing else shifts)
  k.shape(E(742,494,108,28,16),'#E8A9B8',{w:2.3,hatch:{side:.55,gap:4.5,col:'#C9839A',op:.5}});k.shape(E(742,486,82,17,14),'#FCE6CC',{w:1.8});k.add(`<ellipse cx="742" cy="494" rx="96" ry="22" fill="none" stroke="#fff" stroke-width="1.6" stroke-dasharray="5 4"/>`);
  k.shape([[756,480],[788,476],[792,470],[800,474],[796,482],[800,488],[792,490],[788,484],[758,488],[754,494],[746,490],[750,484],[746,478],[752,474]],'#FFFFFF',{w:1.6,one:1});
  k.add(`<g fill="${C.pink}" opacity=".85"><ellipse cx="742" cy="514" rx="5" ry="4"/><circle cx="736" cy="507" r="2"/><circle cx="741" cy="505" r="2"/><circle cx="747" cy="506" r="2"/></g>`);});if(o.bed!==false)k.add(bd)}
  O.sparkle(k,330,120,6);O.note(k,640,120,12);
  O.tape(k,6,18,90,-26,'#F7B9C6');O.tape(k,920,572,80,-24,'#B9D4F3');
  k.side(()=>hotTag(k,'data-hot','kitchen','Kitchen',RC(866,60,134,350),934,50,6));// v1.3, appended
}
/* ---------- v1.3: garden + kitchen scenes, hotspots, Pip's Sprout Cart ---------- */
// small paper label tag on a string (for hotspot groups)
function tagLabel(k,x,y,txt,rot=-8){return k.cap(()=>{const w=txt.length*8.6+22;k.add(`<g transform="rotate(${rot} ${x} ${y})">`);k.line([[x-w/2-12,y-14],[x-w/2+2,y]],1.2,C.ink,{op:.8});
  k.shape([[x-w/2,y-11],[x+w/2,y-11],[x+w/2,y+11],[x-w/2,y+11],[x-w/2-10,y]],'#FFD8E0',{w:1.6,one:1});k.add(`<circle cx="${R1(x-w/2-3)}" cy="${y}" r="2.2" fill="#FFFBF3" stroke="${C.ink}" stroke-width="1"/>`);k.text(txt,x+3,y+6,18);k.add('</g>')})}
// appended hotspot: transparent hit, hover outline, label tag (the base art is untouched)
function hotTag(k,attr,val,label,rc,tx,ty,rot){hot(k,attr,val,label,rc,tagLabel(k,tx,ty,label.toLowerCase(),rot))}
// yard patch states: the veggies are still drawn (and dropped for 'empty') so the rest of the yard never shifts
function patchEmpty(k){for(let row=0;row<3;row++){const y=482+row*36;let d='';for(let x=34;x<192;x+=12)d+=`M${x} ${y+4}q6 -7 12 0`;k.add(`<path d="${d}" fill="none" stroke="#A47C58" stroke-width="1.5" stroke-linecap="round"/>`);
  let dots='';for(let i=0;i<9;i++)dots+=`<circle cx="${R1(36+k.r()*156)}" cy="${R1(y+6+k.r()*8)}" r="1.4" fill="#A47C58"/>`;k.add(dots)}}
function patchReady(k){[[70,470,9],[142,512,11],[100,548,8]].forEach(([x,y,s])=>O.sparkle(k,x,y,s));}

function sproutCart(k){const g=k.cap(()=>{
  // Pip behind the cart: a retired gardener in an enormous straw hat
  const px=908;k.add(`<g transform="translate(${px} 494) scale(1.28) translate(${-px} -494)">`);k.shape([[px-26,492],[px-22,470],[px+22,470],[px+26,492]],'#9CC0E6',{w:1.8});k.line([[px-12,472],[px-10,490]],1.4);k.line([[px+12,472],[px+10,490]],1.4);
  k.shape(E(px,458,15,16,12),'#F6D3B5',{w:1.8});k.shape([[px-12,462],[px-6,476],[px,480],[px+6,476],[px+12,462],[px,468]],'#FFFFFF',{w:1.5,one:1});
  k.add(`<circle cx="${px-6}" cy="${R1(454)}" r="4.5" fill="none" stroke="${C.ink}" stroke-width="1.4"/><circle cx="${px+6}" cy="454" r="4.5" fill="none" stroke="${C.ink}" stroke-width="1.4"/><path d="M${px-1.5} 454h3" stroke="${C.ink}" stroke-width="1.2"/><circle cx="${px-6}" cy="454" r="1.3" fill="${C.ink}"/><circle cx="${px+6}" cy="454" r="1.3" fill="${C.ink}"/><ellipse cx="${px-12}" cy="461" rx="3.4" ry="2.2" fill="${C.pink}" opacity=".6"/><ellipse cx="${px+12}" cy="461" rx="3.4" ry="2.2" fill="${C.pink}" opacity=".6"/>`);
  k.shape(E(px,444,48,10,16),'#F3D58A',{w:2,hatch:{gap:4,col:'#CDA954',op:.55}});k.shape([[px-22,442],[px-18,424],[px,418],[px+18,424],[px+22,442]],'#F3D58A',{w:2,hatch:{gap:4,col:'#CDA954',op:.55}});k.fill(RC(px-21,434,42,6),'#8CC09A',{op:.9,dx:0,dy:0});
  O.flower(k,px+16,432,3.2,C.red);k.add('</g>');
  // cart: posts, awning, box, seed packets, sign, wheels
  k.line([[704,486],[704,440]],3,C.trunkD);k.line([[864,486],[864,440]],3,C.trunkD);O.awning(k,696,436,176,24,'#9ACD7C','#fff');
  k.shape(RC(698,484,252,64),C.wood,{w:2.4,hatch:{side:.8,gap:5,col:C.woodD,op:.45}});for(let y=500;y<546;y+=16)k.line([[704,y],[944,y+k.J(1)]],1,C.woodD);
  const pk=[C.orange,C.mint,C.lav,C.yellow,'#FFB3C7',C.blue];for(let i=0;i<6;i++){const x=714+i*25,y=468+(i%2)*3;k.shape(RC(x,y,20,18),pk[i],{w:1.3,one:1});k.add(`<path d="M${x+10} ${y+14}v-6m0 0q-5 -4 -7 0m7 0q5 -4 7 0" fill="none" stroke="#6FAE5C" stroke-width="1.4" stroke-linecap="round"/>`)}
  k.shape([[868,484],[872,470],[892,470],[896,484]],C.roof,{w:1.6});k.add(`<path d="M882 470v-10m0 4q-8 -8 -12 -2m12 2q8 -8 12 -2" fill="none" stroke="#6FAE5C" stroke-width="1.8" stroke-linecap="round"/>`);
  k.shape(RC(716,498,186,34),'#FFFBF3',{w:1.8,one:1});k.text("Pip's Sprout Cart",809,523,25,{rot:-1});
  [[736,560],[912,560]].forEach(([x,y])=>{k.shape(E(x,y,27,27,14),C.woodD,{w:2.2});k.add(`<circle cx="${x}" cy="${y}" r="17" fill="none" stroke="${C.ink}" stroke-width="1.4"/><circle cx="${x}" cy="${y}" r="4" fill="${C.ink}"/><path d="M${x-17} ${y}h34M${x} ${y-17}v34M${x-12} ${y-12}l24 24M${x+12} ${y-12}l-24 24" stroke="${C.ink}" stroke-width="1.2"/>`)});
  k.line([[946,500],[972,474]],3,C.trunkD);
  // little lantern on the left post (glows at dusk and night)
  k.line([[704,444],[690,444],[690,452]],1.6);const lg=[[684,454],[696,454],[698,472],[682,472]];k.shape(lg,C.yellow,{w:1.6});
  if(k.env.lit)k.lamps.push({x:690,y:463,s:.55,glass:lg});
});hot(k,'data-shop','sprout',"Pip's Sprout Cart",RC(690,430,270,160),g)}

const GARDEN_PLOTS=[[220,250],[420,250],[620,250],[220,390],[420,390],[620,390]];
function garden(k){
  k.skyD(()=>{skyBand(k,1000,250);O.sun(k,880,70,30);O.cloud(k,420,60,22);O.cloud(k,700,96,18);O.bird(k,560,60,8);O.bird(k,582,72,6)},
    {W:1000,H:260,sun:[880,70,30],low:[720,214,30],moon:[860,68,26],clouds:[[420,60,22],[700,96,18],[260,40,18]],rainC:[[560,40,26],[960,120,22]],birds:[[560,60,8],[582,72,6]],stars:36});
  O.fence(k,150,1000,112,252);
  // the back corner of the human house (left)
  k.shape([[-10,262],[-10,0],[176,0],[176,262]],C.wall,{w:2.3,hatch:{side:.75,gap:5,col:'#D9B996',op:.5}});for(let y=20;y<256;y+=18)k.line([[2,y+k.J(1)],[170,y+k.J(1)]],1,'#E2C29E',{op:.8});
  k.shape([[-12,30],[150,-14],[196,-14],[196,6],[-12,58]],C.roof,{w:2.3,hatch:{side:.5,gap:5,col:C.roofD,op:.55}});
  O.window(k,40,92,74,64,{curtain:'#FFC9D3'});k.line([[160,24],[160,256]],5,'#9AA7B8');k.line([[160,256],[176,264]],5,'#9AA7B8');
  // lawn, raised bed, plots (plain tilled soil)
  k.fill([[0,248],[1000,246],[1000,600],[0,600]],C.grass,{dx:0,dy:0,sc:0});k.pen([[0,250],[150,250],[1000,248]],false,{w:2});
  k.shape(RC(196,228,608,288),C.woodD,{w:2.3});k.shape(RC(208,240,584,264),C.soil,{w:1.8,one:1,hatch:{side:.85,gap:6,col:'#B98F68',op:.35}});
  for(let x=208;x<792;x+=48)k.line([[x,229],[x,239]],1,C.wood);for(let x=208;x<792;x+=48)k.line([[x,505],[x,515]],1,C.wood);
  GARDEN_PLOTS.forEach(([x,y])=>{k.fill(RC(x,y,160,110),'#C79E76',{dx:0,dy:0,sc:0,op:.9});k.line([[x,y],[x+160,y],[x+160,y+110],[x,y+110],[x,y]],1,'#A47C58',{op:.6,dash:'4 6',amp:.3})});
  // stepping boards in the gaps between plots (never inside a plot zone)
  [[384,268],[384,320],[584,268],[584,320],[384,408],[384,460],[584,408],[584,460]].forEach(([x,y])=>k.shape(RC(x,y,32,30),C.wood,{w:1.5,one:1}));
  [[236,365],[300,365],[436,365],[500,365],[636,365],[700,365]].forEach(([x,y])=>k.shape(RC(x,y,52,20),C.wood,{w:1.5,one:1}));
  // tool shelf + hose reel (right decor x 820-980)
  k.shape(RC(832,250,148,8),C.woodD,{w:1.6});[[836],[972]].forEach(([x])=>k.line([[x,250],[x,474]],4,C.trunkD));[318,392,466].forEach(y=>k.shape(RC(828,y,156,9),C.wood,{w:1.7}));
  k.shape([[846,318],[848,290],[890,290],[892,318]],C.blue,{w:1.8});k.line([[892,298],[912,284]],3,C.ink);k.add(`<path d="M856 290q12 -18 26 0" fill="none" stroke="${C.ink}" stroke-width="2.4"/>`);
  [[930,318],[950,318]].forEach(([x,y],i)=>k.shape([[x-12,y],[x-15,y-20],[x+15,y-20],[x+12,y]],C.roof,{w:1.5}));k.shape(RC(918,294,44,6),C.roofD,{w:1.2,one:1});
  k.shape(RC(846,362,48,30),C.lav,{w:1.6});k.text('seeds',870,383,15);k.shape([[912,392],[916,370],[930,368],[934,392]],'#F7E1A8',{w:1.5});k.shape([[940,392],[944,370],[958,368],[962,392]],'#F7E1A8',{w:1.5});
  k.line([[860,466],[870,410]],2.6,C.trunkD);k.shape([[866,412],[878,408],[880,396],[868,398]],'#9AA7B8',{w:1.4});k.line([[900,466],[904,414]],2.6,C.trunkD);k.add(`<path d="M898 414v-14M904 414v-16M910 414v-14" stroke="#9AA7B8" stroke-width="2"/>`);
  k.shape(RC(930,440,36,26),C.red,{w:1.5});
  k.line([[884,560],[900,520],[916,560]],3.4,C.ink);k.shape(E(900,520,34,34,16),'#8CC09A',{w:2.2});let hc='';for(let r=12;r<32;r+=5)hc+=`<circle cx="900" cy="520" r="${r}" fill="none" stroke="#5E9A6E" stroke-width="2"/>`;k.add(hc);
  k.add(`<circle cx="900" cy="520" r="6" fill="${C.trunkD}" stroke="${C.ink}" stroke-width="1.4"/><path d="M900 520l18 -16" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>`);
  k.line([[932,530],[960,560],[930,580],[868,584],[840,566]],3,'#6FAE5C');k.shape([[834,560],[846,556],[848,568],[836,572]],C.yellow,{w:1.3,one:1});
  // lawn details outside every zone
  let td='';for(let i=0;i<110;i++){const x=k.r()*1000,y=520+k.r()*78;if(x<210||x>820)continue;td+=`M${R1(x)} ${R1(y)}q1 -6 -1 -10M${R1(x+5)} ${R1(y)}q0 -7 3 -12`}k.add(`<path d="${td}" fill="none" stroke="${C.grassD}" stroke-width="1.5" stroke-linecap="round"/>`);
  [[250,560,C.red],[330,586,C.yellow],[470,556,C.lav],[560,590,'#FFB3C7'],[660,560,C.red],[760,588,C.yellow]].forEach(f=>O.flower(k,f[0],f[1],5,f[2]));
  k.fx(()=>{const e=k.env;
    if(e.rain){sheen(k,0,1000,522,598,40,[[30,380,210,560]]);[[398,376,14,4],[598,376,14,4],[420,566,40,8],[700,570,36,7]].forEach(q=>puddle(k,...q))}
    if(e.snow){capLine(k,[[194,228],[806,228]],8);capLine(k,[[194,516],[806,516]],8);capLine(k,[[194,228],[194,516]],5);capLine(k,[[806,228],[806,516]],5)}
    if(e.night&&!e.rain)[[600,200],[300,214],[860,214],[980,570],[700,572]].forEach(f=>k.flies.push(f))});
  O.sparkle(k,300,180,7);O.heart(k,640,170,6);O.note(k,500,200,11);
  O.tape(k,930,560,80,-28,'#BDE7D2');
}

function kitchen(k){
  k.add(`<rect width="1000" height="432" fill="#FDF0DC"/>`);let dd='';for(let y=24;y<200;y+=40)for(let x=20+((y/40)%2)*20;x<1000;x+=40)dd+=`<circle cx="${x}" cy="${y}" r="2" fill="#F2CFA0" opacity=".7"/>`;k.add(dd);
  // tiled backsplash
  k.add(`<rect x="200" y="210" width="668" height="124" fill="#EAF3F4"/>`);let tl='';for(let x=200;x<=868;x+=26)tl+=`M${x} 210v124`;for(let y=210;y<=334;y+=26)tl+=`M200 ${y}h668`;k.add(`<path d="${tl}" stroke="#C7D9DD" stroke-width="1.2"/>`);
  // floor tiles
  k.add(`<rect y="430" width="1000" height="170" fill="#F6E3CF"/>`);let ft='';for(let y=430,r=0;y<600;y+=34,r++)for(let x=(r%2)*50;x<1000;x+=100)ft+=`<rect x="${x}" y="${y}" width="50" height="34" fill="#F2C9C9" opacity=".55"/>`;k.add(ft);
  for(let y=430;y<600;y+=34)k.line([[0,y],[1000,y]],1,'#D9B8A0',{op:.7});
  k.shape(RC(0,424,1000,12),'#E3C49E',{w:2});
  // pantry shelves (left wall, boards at y 170 / 260 / 350)
  k.shape(RC(24,96,172,334),'#F3E2C8',{w:1.8,one:1});[36,184].forEach(x=>k.line([[x,100],[x,428]],3,C.woodD));
  [170,260,350].forEach(y=>{k.shape(RC(28,y,166,10),C.wood,{w:1.9});k.line([[44,y+10],[52,y+22]],2,C.woodD);k.line([[176,y+10],[168,y+22]],2,C.woodD)});
  k.shape([[44,180],[124,180],[124,198],[44,198],[38,189]],'#FFFFFF',{w:1.4,one:1});k.text('people food',84,194,15);
  k.shape([[52,428],[56,392],[132,392],[136,428]],'#E1B987',{w:1.8,hatch:{gap:5,col:'#BF9767',op:.5}});k.text('onions? nope',96,416,13,{wt:600});
  // range hood + stove (x 430-590, y 280-420; pot spot ~ (460,300) kept clear)
  k.line([[510,0],[510,120]],10,'#C9CED6');k.shape([[448,200],[572,200],[552,120],[468,120]],'#DDE2EA',{w:2.2,hatch:{side:.7,gap:5,col:'#AEB6C0',op:.5}});
  k.shape(RC(430,264,160,18),'#FFF3DC',{w:2});[452,476,544,568].forEach(x=>k.add(`<circle cx="${x}" cy="273" r="5" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.5"/><path d="M${x} 273v-4" stroke="${C.ink}" stroke-width="1.4"/>`));
  k.shape(RC(428,280,164,14),'#9AA7B8',{w:2});k.add(`<ellipse cx="470" cy="287" rx="26" ry="4.5" fill="none" stroke="${C.ink}" stroke-width="1.6"/><ellipse cx="552" cy="287" rx="22" ry="4" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);
  k.shape(RC(432,294,156,130),'#FFF3DC',{w:2.3,hatch:{side:.8,gap:5,col:'#E2CBA5',op:.5}});k.shape(RC(450,326,120,64),'#5E5A6A',{w:2});k.add(`<path d="M462 380l26 -40M478 382l16 -24" stroke="#fff" stroke-width="3" opacity=".35" stroke-linecap="round"/>`);k.line([[452,310],[568,310]],4,C.ink);
  // chopping table (front-left; board zone x 220-400, y 340-420 above the top)
  k.shape(RC(204,404,206,16),C.wood,{w:2.2});for(let x=214;x<404;x+=36)k.line([[x,407],[x+26,407]],1,C.woodD);[[216],[392]].forEach(([x])=>k.shape(RC(x-5,420,10,112),C.woodD,{w:1.8}));
  k.shape([[260,530],[266,494],[334,494],[340,530]],'#E1B987',{w:1.8,hatch:{gap:5,col:'#BF9767',op:.5}});k.add(`<path d="M262 494q38 -26 76 0" fill="none" stroke="${C.ink}" stroke-width="2"/>`);
  // sink counter under the window, the window itself (x 640-820, y 80-240)
  k.shape(RC(596,330,272,14),C.wood,{w:2});k.shape(RC(600,344,264,82),C.mint,{w:2.2,hatch:{side:.8,gap:5,col:'#A6D2BD',op:.5}});[666,732,798].forEach(x=>k.line([[x,348],[x,422]],1.5));[[656,384],[676,384],[788,384],[808,384]].forEach(([x,y])=>k.add(`<circle cx="${x}" cy="${y}" r="2.6" fill="${C.ink}"/>`));
  k.shape(RC(692,330,84,8),'#C9D3DD',{w:1.4,one:1});k.line([[734,330],[734,304],[748,304],[748,312]],3,'#9AA7B8');
  O.window(k,640,80,180,160,{frame:'#FFFFFF',noLit:1,glass:skyGrad(k,80,240),inside:()=>k.side(()=>windowView(k,640,80,180,160,{rainGlass:1,sillSnow:1}))});
  k.add(`<path d="M640 84h180" stroke="${C.ink}" stroke-width="2.4"/>`);[[640,1],[820,-1]].forEach(([x,sd])=>k.shape([[x,84],[x+sd*44,84],[x+sd*34,120],[x,124]],'#FFC9D3',{w:1.5,one:1}));
  [[668,250],[704,250],[780,250]].forEach(([x,y],i)=>{k.shape([[x-9,y],[x-11,y-16],[x+11,y-16],[x+9,y]],C.roof,{w:1.4});for(let j=-1;j<=1;j++)k.shape(E(x+j*5,y-22,3.6,7,8,j*.5),C.leaf,{w:1.1,one:1})});
  // fridge (x 870-990) with magnets and a dog-safety note
  k.shape(RC(872,96,118,334),'#EAF4F2',{w:2.4,hatch:{side:.82,gap:5,col:'#BFD6D2',op:.5}});k.line([[874,206],[988,206]],2);k.line([[882,120],[882,190]],4);k.line([[882,222],[882,300]],4);
  k.shape(RC(918,124,52,40),'#FFFFFF',{w:1.4,one:1});k.add(`<g stroke="#2a2420" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M926 150q10 -8 22 -1q3 8 -4 10q-10 3 -18 -2z" fill="#F5C26B"/><circle cx="950" cy="142" r="6" fill="#F5C26B"/></g>`);O.heart(k,944,118,5);
  k.shape(RC(906,236,72,46),'#FCE59A',{w:1.4,one:1});k.text('no choc',942,256,15);k.text('for pups!',942,274,15);O.sparkle(k,906,232,5,'#F7B9C6');
  // pendant lamp over the table
  k.line([[306,0],[306,108]],1.6);const shd=[[278,140],[334,140],[324,112],[288,112]];k.shape(shd,'#F7C5CF',{w:2});if(k.env.lit)k.lamps.push({x:306,y:150,s:1.2,glass:shd,big:1});
  // runner rug on the dog spot (flat)
  k.shape(RC(650,538,200,34),'#C9EBDA',{w:1.8});k.add(`<path d="M660 546h180M660 564h180" stroke="#fff" stroke-width="2" stroke-dasharray="6 5"/>`);
  O.note(k,620,60,11);O.sparkle(k,380,250,6);
  O.tape(k,6,18,90,-26,'#F7B9C6');O.tape(k,920,572,80,-24,'#B9D4F3');
}

/* ---------- API ---------- */
const SCENES={yard:['Your yard',yard],market:['Market Street',market],shelter:['Paw Haven Shelter',shelter],map:['Paw Haven Town map',bigMap],
  house:['Cozy House living room',hubHouse],garden:['Garden',garden],kitchen:['Kitchen',kitchen],park:['Sunny Park',hubPark],river:['Riverside',hubRiver],woods:['Maple Woods',hubWoods],beach:['Seashell Beach',hubBeach]};
// cache per (name, time, weather, locked, bonds); every call still gets fresh ids
const cache={};
const fresh=s=>{const suf='x'+(++_n);return s.replace(/pwa(\d+)/g,m=>m+suf)};
PA.scene=function(name,o){
  o=o||{};const s=SCENES[name]||SCENES.yard;name=SCENES[name]?name:'yard';const env=name==='map'?DEF_ENV:mkEnv(o);// the map never shows time or weather
  const lk=name==='map'?'|'+(Array.isArray(o.locked)?o.locked.slice().sort().join(','):'')+'|'+JSON.stringify(o.bonds||{}):'';
  const pt=(name==='yard'&&(o.patch==='empty'||o.patch==='ready')?'|'+o.patch:'')+(name==='house'&&o.bed===false?'|nobed':'');
  const key=name+'|'+env.time+'|'+env.weather+lk+pt;if(cache[key])return fresh(cache[key]);
  const svg=frameScene(name,s[0],k=>s[1](k,o),env);cache[key]=svg;return svg;
};
PA.walkStrip=function(area,o){
  const a=STRIPS[area]?area:'park',env=mkEnv(o),key='strip|'+a+'|'+env.time+'|'+env.weather;
  if(cache[key])return fresh(cache[key]);
  const svg=strip(a,STRIPS[a],env);cache[key]=svg;return svg;
};
PA.WORLD_TIMES=TIMES.slice();PA.WORLD_WEATHERS=WEATHERS.slice();
const css=`.pa-wa-scene [data-shop],.pa-wa-scene [data-area],.pa-wa-scene [data-hot]{cursor:pointer;outline:none}
.pa-wa-scene .pa-wa-hit{pointer-events:all}
.pa-wa-scene .pa-wa-hl{opacity:0;pointer-events:none;transition:opacity .15s}
.pa-wa-scene [data-shop]:hover .pa-wa-hl,.pa-wa-scene [data-area]:hover .pa-wa-hl,.pa-wa-scene [data-hot]:hover .pa-wa-hl,.pa-wa-scene [data-shop]:focus-visible .pa-wa-hl,.pa-wa-scene [data-area]:focus-visible .pa-wa-hl,.pa-wa-scene [data-hot]:focus-visible .pa-wa-hl{opacity:1}
.pa-wa-scene [data-locked="1"]{cursor:not-allowed}`;
if(typeof document!=='undefined'&&!document.getElementById('pawart-world-a-css')){const st=document.createElement('style');st.id='pawart-world-a-css';st.textContent=css;document.head.appendChild(st)}
})();
