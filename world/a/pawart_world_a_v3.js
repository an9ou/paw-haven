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
    text(s,x,y,size,o={}){out.push(`<text x="${R1(x)}" y="${R1(y)}"${o.rot?` transform="rotate(${o.rot} ${R1(x)} ${R1(y)})"`:''} font-family="'Caveat',cursive" font-size="${size}" font-weight="${o.wt||700}" fill="${o.col||C.ink}" text-anchor="${o.anchor||'middle'}"${o.ls?` letter-spacing="${o.ls}"`:''}>${s}</text>`)},
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
      add(l.x,rr,`<circle cx="${R1(l.x)}" cy="${R1(l.y)}" r="${R1(rr)}" fill="url(#${wg})" opacity="${R1(L)}"/>${l.gy?`<ellipse cx="${R1(l.x)}" cy="${R1(l.gy+2)}" rx="${R1(46*l.s)}" ry="${R1(8*l.s)}" fill="#FFE08A" opacity="${R1(.35*L)}"/>`:''}<circle cx="${R1(l.x)}" cy="${R1(l.y)}" r="${R1(rr*.62)}" fill="none" stroke="#FFE7A0" stroke-width="1.6" stroke-dasharray="7 9" opacity="${R1(.75*L)}"/><path d="${rays}" stroke="#FFE7A0" stroke-width="2" stroke-linecap="round" opacity="${R1(.85*L)}"/><path d="${gd}" fill="#FFF2B0" stroke="#4A3A40" stroke-width="1.6" stroke-linejoin="round"/>`)});
    k.bulbs.forEach(([x,y,c])=>add(x,14,`<circle cx="${R1(x)}" cy="${R1(y)}" r="14" fill="url(#${wg})" opacity="${R1(L)}"/><circle cx="${R1(x)}" cy="${R1(y)}" r="4.5" fill="${c}"/>`))}
  k.glints.forEach(([x,y0,y1,col,st])=>{let d='';for(let y=y0;y<y1;y+=6){const t=(y-y0)/(y1-y0),wd=(8+t*34)*(.6+k.r()*.6),ox=k.J(8+t*10);d+=`M${R1(x+ox-wd/2)} ${R1(y)}h${R1(wd)}`}add(x,40,`<path d="${d}" stroke="${col}" stroke-width="2.4" stroke-linecap="round" opacity="${R1(.85*st)}"/>`)});
  k.flies.forEach(([x,y])=>{const g=glowGrad(k,'#E9FF9A','fly');add(x,12,`<circle cx="${R1(x)}" cy="${R1(y)}" r="11" fill="url(#${g})"/><circle cx="${R1(x)}" cy="${R1(y)}" r="2.4" fill="#F6FFB8"/><path d="M${R1(x-4)} ${R1(y-4)}q-3 -4 -6 -1M${R1(x+4)} ${R1(y-4)}q3 -4 6 -1" fill="none" stroke="#F6FFB8" stroke-width="1" opacity=".7"/>`)});
  });
  return s?`<g pointer-events="none">${s}</g>`:''}
function assemble(k,pp,W,open,wrap){
  const R=s=>k.R(s),lights=k.env.def?'':lightsLayer(k,W,wrap);
  return `${open}<defs>${R(k.defs.join(''))}${k.defs2.join('')}</defs>${R(pp.bg)}${k.sky.join('')}${R(k.out.join(''))}${k.top.length?`<g pointer-events="none">${R(k.top.join(''))}</g>`:''}${lights}${pp.tooth}</svg>`}
// the view through the shelter window: same sky, a little hill, sun or moon, clouds
function windowView(k,x,y,w,h){const env=k.env,cid=uid();k.defs.push(`<clipPath id="${cid}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`);
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
  k.add('</g>')}
/* ---------- scenes ---------- */
function frameScene(name,label,body,env){
  const k=kit(hashS('pwa-'+name));k.env=env||DEF_ENV;k.rc=recolorFn(k.env,name==='shelter'?'in':name==='map'?'map':'out');const pp=paperDefs(k,1000,600);
  body(k);
  const ex=k.env.def?'':` data-time="${k.env.time}" data-weather="${k.env.weather}"`;
  return assemble(k,pp,1000,`<svg class="pa-wa-scene pa-wa-${name}" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}${k.env.def?'':`, ${k.env.time}, ${k.env.weather}`}"${ex}>`,false);
}
function hot(k,attr,val,label,hitPts,inner){// clickable group with a transparent hit shape and a pink dashed hover outline
  const hit=smooth(dense(hitPts,true,30),true);
  k.add(`<g ${attr}="${val}" role="button" tabindex="0" aria-label="${label}"><path class="pa-wa-hit" d="${hit}" fill="#000" fill-opacity="0"/>${inner}<path class="pa-wa-hl" d="${hit}" fill="none" stroke="${C.pink}" stroke-width="4" stroke-dasharray="10 8" stroke-linecap="round"/></g>`);
}
function skyBand(k,W,yb,col=C.sky){k.add(`<rect x="0" y="0" width="${W}" height="${yb}" fill="${col}" fill-opacity=".75"/>`);let d='';for(let y=20;y<yb-10;y+=26){for(let x=0;x<W;x+=180){d+=`M${R1(x+k.r()*40)} ${R1(y+k.J(4))}h${R1(60+k.r()*70)}`}}k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="4" stroke-opacity=".32" stroke-linecap="round"/>`)}

function yard(k){
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
  for(let row=0;row<3;row++){const y=482+row*36;k.line([[30,y+8],[196,y+6]],1.2,'#B98F68');for(let i=0;i<5;i++){const x=44+i*34+k.J(3);
    if(row===1){k.shape(E(x,y,12,9,10),'#CFEAB0',{w:1.6});k.line([[x-6,y],[x+5,y-3]],1.1,C.leafD)}
    else{k.shape([[x-5,y+2],[x+5,y+2],[x,y+16]],C.orange,{w:1.5,one:1});k.line([[x,y+2],[x-6,y-10]],1.8,'#6FAE5C');k.line([[x,y+2],[x+1,y-12]],1.8,'#6FAE5C');k.line([[x,y+2],[x+7,y-9]],1.8,'#6FAE5C')}}}
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

// map: the parchment takes a lighter version of the sky (wash, night hatching, stars, moon or sun, clouds)
function mapSky(k){const env=k.env;k.side(()=>{k.sky.push(k.cap(()=>{
  k.add(k.R(`<rect width="1000" height="600" fill="#FDF3DF" fill-opacity=".55"/>`));
  const [a,b]=skyCols(env),gid=uid();k.defs2.push(`<linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="600" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="${a}" stop-opacity="${env.night?.55:.5}"/><stop offset=".55" stop-color="${b}" stop-opacity="${env.night?.28:.16}"/><stop offset="1" stop-color="${b}" stop-opacity="${env.night?.18:0}"/></linearGradient>`);
  k.add(`<rect width="1000" height="600" fill="url(#${gid})"/>`);
  if(env.night){const p=hatchPat(k,75,'#5D70AE',10,1.4,.3);k.add(`<rect width="1000" height="600" fill="url(#${p})"/>`);if(!env.rain)stars(k,1000,10,590,env.sunny?60:18,false)}
  const cc=cloudCols(env),show=env.sunny?'full':env.rain?'none':'peek',X=440,Y=50;
  if(show!=='none'){if(env.night)moon(k,X,Y,22,show==='peek');else O.sun(k,X,Y,22,env.time==='dawn'?'#FDD68E':env.time==='dusk'?'#F9AE6E':C.sun)}
  const cl=env.sunny?[]:env.rain?[[450,56,24],[640,300,18],[330,520,18],[980,262,16],[90,560,16]]:[[640,300,16],[330,520,16]];
  if(show==='peek')cl.push([X+12,Y+14,20]);cl.forEach(([x,y,s])=>cloudV(k,x,y,s,cc));
}))})}
const AREAS={yard:{label:'My Yard',bond:1},market:{label:'Market Street',bond:1},shelter:{label:'Paw Haven Shelter',bond:1},park:{label:'Sunny Park',bond:1},river:{label:'Riverside Trail',bond:2},woods:{label:'Maple Woods',bond:5},beach:{label:'Seashell Beach',bond:8}};
function map(k,o){
  const locked=new Set(o.locked||[]),bonds=o.bonds||{};
  if(k.env.def)k.add(`<rect width="1000" height="600" fill="#FDF3DF" fill-opacity=".55"/>`);else mapSky(k);
  // river winding across, sea at the bottom right
  const riv=[[300,0],[340,80],[300,170],[360,250],[470,300],[560,360],[620,440],[700,520],[760,600]];
  const rl=riv.map(p=>[p[0]-22,p[1]]),rr=riv.map(p=>[p[0]+22,p[1]]).reverse();k.fill(rl.concat(rr),C.water,{dx:0,dy:0});k.pen(rl,false,{w:2});k.pen(rr,false,{w:2});
  let wv='';for(let i=1;i<riv.length-1;i++)wv+=`M${riv[i][0]-8} ${riv[i][1]}q4 -4 8 0t8 0`;k.add(`<path d="${wv}" fill="none" stroke="#7FB6D8" stroke-width="1.6"/>`);
  const sea=[[690,600],[740,500],[860,440],[1000,430],[1000,600]];k.fill(sea,C.water,{dx:0,dy:0});k.pen(sea.slice(0,4),false,{w:2});
  // dotted paths between places
  const P={yard:[200,250],market:[520,140],shelter:[810,150],park:[160,440],river:[470,410],woods:[850,350],beach:[900,520]};
  [['yard','market'],['market','shelter'],['yard','park'],['yard','river'],['river','beach'],['shelter','woods'],['woods','beach'],['market','river']].forEach(([a,b])=>{const A=P[a],B=P[b],m=[(A[0]+B[0])/2+(k.r()-.5)*60,(A[1]+B[1])/2+(k.r()-.5)*60];k.line([A,m,B],2.4,C.ink,{dash:'2 9',op:.75})});
  const area=(key,hitPts,draw,lx,ly)=>{
    const LB=k.env.def?'#FFFFFF':'#FFFFFE',LI=k.env.def?C.ink:'#5B3D33';
    const lab=()=>{k.shape(RC(lx-82,ly-26,164,36),LB,{w:1.8,one:1,dx:1,dy:1,lcol:k.env.def?undefined:LI});k.text(AREAS[key].label,lx,ly,28,{rot:k.J(2),col:LI})};
    const g=k.cap(()=>{draw(k);if(!locked.has(key))lab();
      if(locked.has(key)){const xs=hitPts.map(p=>p[0]),ys=hitPts.map(p=>p[1]);k.add(`<path d="${smooth(dense(hitPts,true,30),true)}" fill="#EFE9E0" fill-opacity=".55"/>`);k.hatch(hitPts,{gap:7,col:C.graph,op:.55,w:1.4});
        const cx=(Math.min(...xs)+Math.max(...xs))/2-30,cy=(Math.min(...ys)+Math.max(...ys))/2-18;
        k.add(`<path d="M${cx-14} ${cy}v-12a14 14 0 0 1 28 0v12" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`);k.shape(RC(cx-22,cy-2,44,36),C.yellow,{w:2.4});k.add(`<circle cx="${cx}" cy="${cy+12}" r="4" fill="${C.ink}"/><path d="M${cx} ${cy+14}v9" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`);
        k.shape(RC(cx+28,cy+2,86,30),C.pink,{w:1.8,one:1});k.text(`Bond ${bonds[key]||AREAS[key].bond}`,cx+71,cy+25,26,{col:'#fff'});lab()}
    });
    hot(k,'data-area',key,AREAS[key].label+(locked.has(key)?' (locked)':''),hitPts,g);
    if(locked.has(key))k.out[k.out.length-1]=k.out[k.out.length-1].replace(`data-area="${key}"`,`data-area="${key}" data-locked="1"`);
  };
  k.fx(()=>{const e=k.env;
    if(e.snow)[[420,262,46,12],[660,318,40,10],[300,470,50,12],[580,560,44,10],[70,330,40,10],[990,250,30,8],[120,560,36,8],[700,40,40,9]].forEach(q=>snowPatch(k,...q));
    if(e.rain)[[372,330,22,6],[606,262,20,5],[624,486,24,6],[250,400,18,5],[760,390,20,5]].forEach(q=>puddle(k,...q))});
  area('yard',E(200,236,130,96,12),k=>{k.shape([[150,230],[150,190],[190,160],[230,190],[230,230]],C.wall,{w:2,hatch:{side:.6,gap:4,col:'#D9B996',op:.5}});k.shape([[140,194],[190,152],[240,194]],C.roof,{w:2});k.shape(RC(180,206,20,24),'#B9D3F2',{w:1.6});O.window(k,206,198,14,12,{});O.fence(k,96,300,236,272,{bw:14,gap:4});O.heart(k,262,170,8)},200,318);
  area('market',E(530,130,150,92,12),k=>{[[420,C.wall,C.red],[500,C.wall2,C.lav],[580,C.wall3,C.mint]].forEach(([x,c1,c2])=>{k.shape(RC(x,80,70,90),c1,{w:2});O.awning(k,x+4,112,62,14,c2,'#fff');k.shape(RC(x+24,140,22,30),C.wood,{w:1.4,one:1})})},530,212);
  area('shelter',E(810,140,120,86,12),k=>{k.shape(RC(730,110,140,90),'#FBEFE0',{w:2,hatch:{side:.7,gap:5,col:'#D9B996',op:.4}});k.shape([[720,114],[800,62],[880,114]],C.red,{w:2});O.heart(k,800,94,12);k.shape(RC(786,160,28,40),'#E8A9B8',{w:1.6});O.window(k,746,130,26,22,{});O.window(k,828,130,26,22,{})},800,226);
  area('park',E(170,450,140,90,12),k=>{O.tree(k,110,470,.55);O.tree(k,230,460,.5,{col:C.leaf2});k.shape(E(170,500,40,14,12),C.water,{w:1.8});O.bench(k,170,470,.45);O.flower(k,90,500,4,C.red);O.flower(k,250,500,4,C.yellow)},170,548);
  area('river',E(470,400,110,80,12),k=>{const bp=[[410,404],[440,384],[500,384],[530,404],[520,414],[500,398],[440,398],[420,414]];k.shape(bp,C.wood,{w:2});for(let x=438;x<510;x+=10)k.line([[x,386],[x,398]],1,C.woodD);k.add(`<path d="M430 440l6 -8 6 8z" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.4"/>`);k.shape(E(420,440,10,6,8),'#FCE59A',{w:1.4,one:1})},470,488);
  area('woods',E(855,362,105,84,12),k=>{k.add('<g transform="translate(-14 -4)">');O.pine(k,830,380,.6);O.pine(k,880,360,.75,C.pineD,'#557F66');O.pine(k,935,385,.6);O.mushroom(k,860,392,.8);O.leafy(k,900,400,22,14,'#E9A86A','#CF8248');k.add('</g>')},856,440);
  area('beach',E(890,498,112,62,12),k=>{k.add('<g transform="translate(0 -40)">');k.fill([[780,560],[860,500],[1000,490],[1000,650],[770,650]],C.sand,{dx:0,dy:0});k.line([[900,520],[910,560]],2.6);k.shape([[870,524],[910,500],[950,526]],C.red,{w:1.8});k.add(`<path d="M820 560c10 -8 20 -8 30 0" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);k.shape(E(950,568,9,7,8),'#FFC9B0',{w:1.4,one:1});k.add('</g>')},905,560);
  k.fx(()=>{const e=k.env;
    if(e.snow)k.top.push(k.cap(()=>{capLine(k,[[138,195],[190,151],[242,195]],8);capLine(k,[[718,115],[800,61],[882,115]],9);[420,500,580].forEach(x=>capLine(k,[[x-1,80],[x+71,80]],6))}));
    if(e.lit)[420,500,580].forEach(x=>k.glows.push([x+24,140,22,30]))});
  // compass rose + title
  k.shape(E(80,80,40,40,14),'#FFFFFF',{w:1.8});k.add(`<path d="M80 40l8 32 -8 8 -8 -8zM80 120l8 -32 -8 -8 -8 8z" fill="${C.pink}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`);k.text('N',80,34,22);
  k.text('Paw Haven Town',640,44,40,{rot:-2});k.line([[540,56],[740,52]],2.4,C.pink);
  O.sparkle(k,700,250,8);O.sparkle(k,330,560,6);O.heart(k,620,560,6);
  O.tape(k,6,18,90,-26,'#F7B9C6');O.tape(k,912,6,90,24,'#BDE7D2');O.tape(k,10,582,80,24,'#F9E19A');
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
  k.fx(()=>{stripFx(k,{y0:338,y1:396,kind:'path',np:3,ns:5});if(k.env.night&&!k.env.rain)[[150,280],[420,250],[700,300],[980,262],[1120,300]].forEach(f=>k.flies.push(f))});
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
  k.fx(()=>stripFx(k,{y0:338,y1:396,kind:'path',np:3,ns:5}));
  k.wrap(600,12,()=>O.sparkle(k,600,120,7));
 },
 woods(k){
  k.skyD(()=>k.add(`<rect width="1200" height="330" fill="#E3EDDA" fill-opacity=".85"/>`),SKYC.woods);
  [[60,.9],[300,1.1],[520,.8],[760,1.2],[980,.95],[1150,.85]].forEach(([x,s],i)=>k.wrap(x,60*s,()=>O.pine(k,x,250,s*1.1,i%2?'#A9CDB0':'#BBD8BF','#86AE92')));
  k.add(`<rect y="250" width="1200" height="80" fill="#C5DDB0"/>`);k.fx(()=>stripFx(k,{y0:256,y1:328,kind:'grass',ns:7}));
  [[160,1.15],[430,1.3],[690,1.1],[930,1.35]].forEach(([x,s],i)=>k.wrap(x,60*s,()=>i%2?O.pine(k,x,322,s,C.pineD,'#557F66'):O.tree(k,x,322,s*.95,{col:'#E9B074',colD:'#C98A4E'})));
  // fallen log, mushrooms, ferns, acorns
  k.wrap(560,70,()=>{k.shape(RC(500,296,120,30),C.trunk,{w:2.2,hatch:{side:.4,gap:4,col:C.trunkD,op:.6}});k.shape(E(620,311,10,15,10),'#E7C79E',{w:2});k.add(`<path d="M620 304a6 7 0 1 0 1 0" fill="none" stroke="${C.trunkD}" stroke-width="1.3"/>`);for(let x=512;x<604;x+=18)k.line([[x,302],[x+14,302]],1,C.trunkD);if(k.env.snow)k.side(()=>capLine(k,[[500,296],[621,296]],7))});
  [[60,1],[86,.7],[340,.9],[800,1.1],[828,.7],[1120,.9]].forEach(([x,s])=>k.wrap(x,16,()=>O.mushroom(k,x,330,s)));
  [[240],[700],[1040]].forEach(([x])=>k.wrap(x,30,()=>{for(let i=-2;i<=2;i++){const a=-Math.PI/2+i*.38;const tip=[x+Math.cos(a)*36,330+Math.sin(a)*34];k.line([[x,330],[(x+tip[0])/2+i*3,(330+tip[1])/2-4],tip],1.8,'#6FA05C');for(let j=1;j<5;j++){const t=j/5,px=x+(tip[0]-x)*t,py=330+(tip[1]-330)*t;k.line([[px,py],[px-6,py-3]],1.2,'#6FA05C');k.line([[px,py],[px+6,py-3]],1.2,'#6FA05C')}}}));
  k.add(`<rect y="330" width="1200" height="70" fill="#D9C2A0"/>`);k.edge(x=>330+per(x,[[2,5,.7]]),2.3);
  let lv='';for(let i=0;i<36;i++){const x=(i*61)%1200+6,y=344+(i*37%50);lv+=`<path d="M${x} ${y}q5 -6 10 0q-5 6 -10 0z" fill="${['#E9A86A','#F2C46D','#D98B5F'][i%3]}" opacity=".85"/>`}k.add(lv);
  k.wrap(900,10,()=>O.sparkle(k,900,90,7));
  k.fx(()=>{stripFx(k,{y0:338,y1:396,kind:'path',np:3,ns:5});if(k.env.night&&!k.env.rain)[[120,290],[380,262],[620,240],[860,300],[1060,270],[250,220]].forEach(f=>k.flies.push(f))});
 },
 beach(k){
  k.skyD(()=>k.add(`<rect width="1200" height="190" fill="${C.sky}" fill-opacity=".75"/>`),SKYC.beach);k.add(`<rect y="186" width="1200" height="84" fill="${C.water}"/>`);
  k.edge(x=>188+per(x,[[1,4,0]]),1.6,C.graph);
  let wv='';for(let i=0;i<30;i++){const x=(i*83)%1200,y=206+(i*31%52);wv+=`M${x} ${y}q7 -6 14 0t14 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`);
  // foamy shoreline
  const sh=x=>268+per(x,[[6,3,.4],[3,8,1.3]]);const sp=[];for(let x=0;x<=1200;x+=20)sp.push([x,sh(x)]);
  k.add(`<path d="${smooth(sp,false)}L1200 400L0 400Z" fill="${C.sand}"/>`);k.edge(sh,2,C.ink);
  let fo='';for(let x=0;x<1200;x+=40)fo+=`M${x} ${R1(sh(x)-5)}q10 -6 20 0`;k.add(`<path d="${fo}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);
  k.fx(()=>{if(k.env.rain)ripples(k,0,1200,198,258,22,1200);waterGlints(k,k.env.night?SKYC.beach.moon[0]:SKYC.beach.low[0],194,262);stripFx(k,{y0:300,y1:396,kind:'path',np:2,ns:6})});
  {const bs=k.cap(()=>[[160,80],[420,60],[980,96]].forEach(([x,y])=>k.wrap(x,12,()=>O.bird(k,x,y,10))));if(!k.env.night&&!k.env.rain)k.add(bs)}
  // umbrella + towel, beach ball, sandcastle, shells, crab
  k.wrap(300,80,()=>{k.line([[300,330],[318,210]],3,C.ink);const u=[];for(let i=0;i<=10;i++){const a=Math.PI+i/10*Math.PI;u.push([318+Math.cos(a)*84,222+Math.sin(a)*40])}u.push([402,222]);k.shape(u,C.red,{w:2});for(let i=1;i<5;i++)k.line([[318,184],[318-84+i*34,222]],1.2);k.shape([[230,334],[360,334],[350,352],[220,352]],C.mint,{w:1.8});k.line([[240,340],[350,340]],1.2,'#fff');if(k.env.snow)k.side(()=>capLine(k,u.slice(1,10),7))});
  k.wrap(560,30,()=>{k.shape(E(560,312,22,22,14),'#FFFFFF',{w:2});k.add(`<path d="M538 312q22 -14 44 0" fill="none" stroke="${C.red}" stroke-width="7"/><path d="M560 290q10 22 0 44" fill="none" stroke="${C.blue}" stroke-width="7"/><path d="M546 296q-6 16 4 34" fill="none" stroke="${C.yellow}" stroke-width="7"/>`);k.pen(E(560,312,22,22,14),true,{w:2})});
  k.wrap(820,50,()=>{k.shape([[780,330],[784,290],[860,290],[864,330]],C.sandD,{w:2,hatch:{side:.6,gap:4,col:'#CFAE70',op:.6}});k.shape([[800,290],[800,262],[844,262],[844,290]],C.sandD,{w:2});for(let x=800;x<846;x+=11)k.shape(RC(x,254,7,9),C.sandD,{w:1.4,one:1});k.line([[822,262],[822,236]],1.6);k.shape([[822,236],[840,242],[822,248]],C.pink,{w:1.4,one:1});if(k.env.snow)k.side(()=>{capLine(k,[[782,290],[862,290]],6);capLine(k,[[798,254],[848,254]],5)})});
  [[120,352],[460,366],[700,348],[1080,360]].forEach(([x,y],i)=>k.wrap(x,12,()=>{if(i%2)k.shape([[x-9,y+5],[x,y-8],[x+9,y+5]],'#FFD2C2',{w:1.4,one:1});else{k.shape(E(x,y,9,7,10),'#FFC9B0',{w:1.4,one:1});k.line([[x,y-6],[x,y+6]],1)}}));
  k.wrap(1000,30,()=>{k.shape(E(1000,334,16,10,10),'#F49090',{w:1.8});k.line([[988,328],[980,316]],1.6);k.line([[1012,328],[1020,316]],1.6);k.add(`<circle cx="994" cy="330" r="1.8" fill="${C.ink}"/><circle cx="1006" cy="330" r="1.8" fill="${C.ink}"/>`)});
  let dt='';for(let i=0;i<50;i++){dt+=`<circle cx="${(i*47)%1200}" cy="${290+(i*29%100)}" r="1.2" fill="#D9BF84"/>`}k.add(dt);
  k.wrap(700,10,()=>O.sparkle(k,700,130,7));
 }
};

/* ---------- API ---------- */
const SCENES={yard:['Your yard',yard],market:['Market Street',market],shelter:['Paw Haven Shelter',shelter],map:['Town map',map]};
// cache per (name, time, weather, locked, bonds); every call still gets fresh ids
const cache={};
const fresh=s=>{const suf='x'+(++_n);return s.replace(/pwa(\d+)/g,m=>m+suf)};
PA.scene=function(name,o){
  o=o||{};const s=SCENES[name]||SCENES.yard;name=SCENES[name]?name:'yard';const env=mkEnv(o);
  const lk=name==='map'?'|'+(Array.isArray(o.locked)?o.locked.slice().sort().join(','):'')+'|'+JSON.stringify(o.bonds||{}):'';
  const key=name+'|'+env.time+'|'+env.weather+lk;if(cache[key])return fresh(cache[key]);
  const svg=frameScene(name,s[0],k=>s[1](k,o),env);cache[key]=svg;return svg;
};
PA.walkStrip=function(area,o){
  const a=STRIPS[area]?area:'park',env=mkEnv(o),key='strip|'+a+'|'+env.time+'|'+env.weather;
  if(cache[key])return fresh(cache[key]);
  const svg=strip(a,STRIPS[a],env);cache[key]=svg;return svg;
};
PA.WORLD_TIMES=TIMES.slice();PA.WORLD_WEATHERS=WEATHERS.slice();
const css=`.pa-wa-scene [data-shop],.pa-wa-scene [data-area]{cursor:pointer;outline:none}
.pa-wa-scene .pa-wa-hit{pointer-events:all}
.pa-wa-scene .pa-wa-hl{opacity:0;pointer-events:none;transition:opacity .15s}
.pa-wa-scene [data-shop]:hover .pa-wa-hl,.pa-wa-scene [data-area]:hover .pa-wa-hl,.pa-wa-scene [data-shop]:focus-visible .pa-wa-hl,.pa-wa-scene [data-area]:focus-visible .pa-wa-hl{opacity:1}
.pa-wa-scene [data-locked="1"]{cursor:not-allowed}`;
if(typeof document!=='undefined'&&!document.getElementById('pawart-world-a-css')){const st=document.createElement('style');st.id='pawart-world-a-css';st.textContent=css;document.head.appendChild(st)}
})();
