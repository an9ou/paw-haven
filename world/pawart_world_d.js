/* Doodle Doggo world art, module D (v2.11 "Tokyo Trip", V211.md section 5.4). Loads AFTER worlds A, B and C.
   Wraps PawArt.scene (japanmap | shinkansen | shibuya | yoyogi | asakusa); every other name goes to the previous function (world C, B, A).
   The pencil kit, paper, palette, sky, time/weather/season helpers and the Japanese details are copied from world C (which copied world A),
   ids prefixed pwd, so every scene looks like one sketchbook. No filters. The town map's Station pin lives in world A (o.station). */
window.PawArt = window.PawArt || {};
(function(){
'use strict';
/* --- copied from world C (the kit, paper, doodle objects, seasons, Halloween, sky, recolour, lights, assemble, windowView, hot, skyBand) --- */
const PA=window.PawArt;
const C={ink:'#5B3D32',graph:'#A8968A',paper:'#FFFBF3',dot:'#E3D2BA',pink:'#F28FA5',
  sky:'#D3E9F6',sky2:'#E6F2F8',cloud:'#FFFFFF',sun:'#FDE49A',grass:'#CBE5A6',grass2:'#B4D98E',grassD:'#93C276',
  leaf:'#B9DD92',leaf2:'#9ACD7C',leafD:'#7FB86A',pine:'#8CC09A',pineD:'#6FA483',trunk:'#C9A07A',trunkD:'#A97E5A',
  wood:'#EBCDA4',woodD:'#CFA77C',roof:'#EBA48C',roofD:'#D88870',wall:'#FCE6CC',wall2:'#F9D9DE',wall3:'#D9E9F7',wall4:'#DDEFD8',
  stone:'#DED6CC',stoneD:'#C7BCAE',path:'#EFDDBA',soil:'#D9B48E',water:'#BEE0F2',waterD:'#9CCDE8',sand:'#F7E4B5',sandD:'#EBCF95',
  red:'#F4A3A3',redD:'#E57E83',yellow:'#FCE59A',orange:'#F8C08A',lav:'#DCCBF2',mint:'#C9EBDA',blue:'#B9D3F2',white:'#FFFFFF',glass:'#E4F2FA'};
let _n=0;const uid=()=>'pwd'+(++_n);
let _un=0;const unlitId=()=>'pwd0'+(++_un);// v2.6.1: its own counter, so the other scenes' ids do not shift (pwd0N never meets uid()'s pwdN: no leading zero there)
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
    text(s,x,y,size,o={}){out.push(`<text x="${R1(x)}" y="${R1(y)}"${o.rot?` transform="rotate(${o.rot} ${R1(x)} ${R1(y)})"`:''} font-family="'Caveat',cursive" font-size="${size}" font-weight="${o.wt||700}" fill="${o.col||C.ink}"${o.halo?` stroke="${o.halo}" stroke-width="${o.hw||6}" stroke-linejoin="round" paint-order="stroke"`:''} text-anchor="${o.anchor||'middle'}"${o.ls?` letter-spacing="${o.ls}"`:''}>${s}</text>`)},
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
  k.add(`<g ${attr}="${val}" role="button" tabindex="0" aria-label="${label}"><path class="pa-wd-hit" d="${hit}" fill="#000" fill-opacity="0"/>${inner}<path class="pa-wd-hl" d="${hit}" fill="none" stroke="${C.pink}" stroke-width="4" stroke-dasharray="10 8" stroke-linecap="round"/></g>`);
}
function skyBand(k,W,yb,col=C.sky){k.add(`<rect x="0" y="0" width="${W}" height="${yb}" fill="${col}" fill-opacity=".75"/>`);let d='';for(let y=20;y<yb-10;y+=26){for(let x=0;x<W;x+=180){d+=`M${R1(x+k.r()*40)} ${R1(y+k.J(4))}h${R1(60+k.r()*70)}`}}k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="4" stroke-opacity=".32" stroke-linecap="round"/>`)}
/* --- copied from world C (ground helpers) --- */
function waterGlints(k,x,y0,y1){const e=k.env;if(e.rain)return;
  if(e.night)k.glints.push([x,y0,y1,'#FFF2B8',e.sunny?1:.45]);else if(e.low)k.glints.push([x,y0,y1,e.time==='dawn'?'#FFE7C0':'#FFD49A',e.sunny?.9:.4])}
const per=(x,amps)=>amps.reduce((s,[a,n,ph])=>s+a*Math.sin(x/1200*Math.PI*2*n+ph),0);// periodic over 1200
let HZ=[];// set per scene (the boxes tufts and the rain sheen keep clear of)
const inHZ=(x,y,pad=0)=>HZ.some(z=>x>z[0]-pad&&x<z[2]+pad&&y>z[1]-pad&&y<z[3]+pad);
function tufts(k,y0,y1,n,col=C.grassD){let d='';for(let i=0;i<n;i++){const x=k.r()*1000,y=y0+k.r()*(y1-y0);if(inHZ(x,y))continue;d+=`M${R1(x)} ${R1(y)}q1 -6 -1 -10M${R1(x+5)} ${R1(y)}q0 -7 3 -12`}k.add(`<path d="${d}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round"/>`)}
function hubFx(k,o){const e=k.env;// o:{puddles,patches,sheen:[y0,y1],flies}
  if(e.rain){if(o.sheen)sheen(k,0,1000,o.sheen[0],o.sheen[1],60,HZ);(o.puddles||[]).forEach(q=>puddle(k,...q))}
  if(e.snow)(o.patches||[]).forEach(q=>snowPatch(k,...q));
  if(e.night&&!e.rain&&o.flies)o.flies.forEach(f=>k.flies.push(f))}
/* --- copied from world C (frame) --- */
const INDOOR={shinkansen:1};
const wnAttrs=e=>(e.lt?' data-lights="1"':'')+(e.ny?' data-newyear="1"':'')+(e.jp?' data-jp="1"':'');// v2.8
const wnKey=e=>(e.lt?'|lt':'')+(e.ny?'|ny':'')+(e.jp?'|jp':'');
// long outlines are resampled a little coarser (same wobble and taper), which keeps big scenes under ~300 KB
function lighten(k){const pen0=k.pen;k.pen=(pts,closed,o={})=>{if(!o.step){let L=0;const n=pts.length,m=closed?n:n-1;for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n];L+=Math.hypot(b[0]-a[0],b[1]-a[1])}if(L>260)o=Object.assign({},o,{step:L>1200?15:L>600?12:9})}return pen0(pts,closed,o)}}
function frameC(name,label,body,env,attrs=''){
  const k=kit(hashS('pwd-'+name));lighten(k);k.env=env||DEF_ENV;k.so=INDOOR[name]?'':k.env.ssn;k.xl=[];k.rc=recolorFn(k.env,INDOOR[name]?'in':'out');const pp=paperDefs(k,1000,600);
  body(k);
  const ex=(k.env.def?'':` data-time="${k.env.time}" data-weather="${k.env.weather}"${k.env.ssn?` data-season="${k.env.ssn}"`:''}`)+(k.env.hw?' data-halloween="1"':'')+wnAttrs(k.env)+attrs;
  return assemble(k,pp,1000,`<svg class="pa-wd-scene pa-wd-${name}" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}${k.env.def?'':`, ${k.env.time}, ${k.env.weather}${k.env.ssn?', '+k.env.ssn:''}`}"${ex}>`,false);
}
/* --- copied from world C (far lit windows) --- */
function tinyLit(k,x,y){if(k.env.lit)k.xl.push(`<rect x="${R1(x-1.8)}" y="${R1(y-1.6)}" width="3.6" height="3.2" fill="#FFE27A" opacity="${R1(.95*k.env.lit)}"/><circle cx="${R1(x)}" cy="${R1(y)}" r="6" fill="#FFD36E" opacity="${R1(.22*k.env.lit)}"/>`)}
/* --- copied from world C (lawn hatching) --- */
function hatchBand(k,y0,y1,col,op,gap=7){let d='';for(let x=-80;x<1080;x+=gap)d+=`M${R1(x+k.J(1))} ${y1}L${R1(x+(y1-y0)*.5+k.J(1))} ${y0}`;k.add(`<path d="${d}" stroke="${col}" stroke-width="1" stroke-opacity="${op}" fill="none"/>`)}
/* --- copied from world C (flowers) --- */
const fl=(k,list,s=5)=>list.forEach(f=>O.flower(k,f[0],f[1],s,f[2]));
/* --- copied from world C (Winter Lights, New Year and Japan helpers) --- */
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

/* --- copied from world C (Mt. Fuji) --- */
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

/* --- copied from world C (Japanese details) --- */
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
/* --- copied from world C (shrine) --- */
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
/* ======================= module D: the Tokyo Trip scenes ======================= */
const dk=c=>mixH(c,'#5B3D32',.22);
const rgbL='rgb(255,226,122)',rgbL2='rgb(255,244,200)';// lit windows written as rgb(), so the night recolour (hex only) leaves them bright
// the floor band (where the dogs' feet stand) and the tappable boxes [x, y, w, h] per scene, published as PA.WORLD_D_HOTS
const FLOOR=[420,590,60,940];
const HOTS={
  shibuya:{hachiko:[160,246,112,210],crossing:[350,262,58,192],stamp:[602,330,76,124],souvenir:[720,326,132,130]},
  yoyogi:{stamp:[260,316,76,122]},
  asakusa:{nakamise:[150,306,184,138],lantern:[444,236,112,138],stamp:[552,328,68,120],omikuji:[620,302,118,144],souvenir:[744,326,108,124]}};
function hotAt(k,scene,id,label,draw){const [x,y,w,h]=HOTS[scene][id];hot(k,'data-hot',id,label,RC(x,y,w,h),k.cap(draw))}

/* ---------- small pieces shared by the scenes ---------- */
// a grid of small windows on a facade (batched); which ones light up after dark is fixed by the main stream, so the layout never moves
function winGrid(k,x,y,w,h,rows,cols,o={}){const gx=w/cols,gy=h/rows,ww=gx*(o.f||.56),wh=gy*(o.fh||.56);let d='';const lit=[];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const wx=x+c*gx+(gx-ww)/2,wy=y+r*gy+(gy-wh)/2;d+=`M${R1(wx)} ${R1(wy)}h${R1(ww)}v${R1(wh)}h${R1(-ww)}Z`;if(k.r()<(o.litP??.45))lit.push([wx,wy,ww,wh])}
  k.add(`<path d="${d}" fill="${o.glass||'#DCEAF4'}" stroke="${C.ink}" stroke-width="${o.sw||.8}" stroke-opacity=".7"/>`);
  if(k.env.lit&&lit.length)k.add(`<path d="${lit.map(([a,b,c2,d2])=>`M${R1(a)} ${R1(b)}h${R1(c2)}v${R1(d2)}h${R1(-c2)}Z`).join('')}" fill="${rgbL}" opacity="${R1(.92*k.env.lit)}"/>`)}
// a lit window dot drawn in place (so anything in front still covers it), rgb so the night recolour keeps it bright
function litDot(k,x,y){k.add(`<circle cx="${R1(x)}" cy="${R1(y)}" r="5" fill="${rgbL}" opacity="${R1(.25*k.env.lit)}"/><rect x="${R1(x-1.8)}" y="${R1(y-1.6)}" width="3.6" height="3.2" fill="${rgbL}" opacity="${R1(.95*k.env.lit)}"/>`)}
// a city building: a hatched block, a cornice, a window grid; o.win = [inset x, inset top, inset bottom, rows, cols]
function bldg(k,x,gy,w,h,col,o={}){const t=gy-h;k.shape(RC(x,t,w,h),col,{w:o.w||1.7,one:1,hatch:{side:.76,gap:4.4,col:dk(col),op:.42}});
  if(o.roof)k.shape(RC(x-3,t-6,w+6,7),o.roof,{w:1.3,one:1});
  if(o.win)winGrid(k,x+o.win[0],t+o.win[1],w-o.win[0]*2,h-o.win[1]-o.win[2],o.win[3],o.win[4],o.wo||{});
  if(k.env.snow)k.side(()=>capLine(k,[[x-3,t-(o.roof?6:0)],[x+w+3,t-(o.roof?6:0)]],5))}
// far towers: pale shapes with a thin graphite line and window dashes
function farCity(k,list,gy,col,wcol){list.forEach(([x,w,h,top])=>{const t=gy-h,p=top==='step'?[[x,gy],[x,t+18],[x+w*.18,t+18],[x+w*.18,t],[x+w*.82,t],[x+w*.82,t+18],[x+w,t+18],[x+w,gy]]:RC(x,t,w,h);
  k.fill(p,col,{dx:0,dy:0,sc:0});k.pen(p,true,{w:1.1,col:C.graph,one:1,amp:.5});let d='';for(let yy=t+(top==='step'?26:9);yy<gy-6;yy+=11)for(let xx=x+5;xx<x+w-6;xx+=9)d+=`M${R1(xx)} ${R1(yy)}h3.4`;
  k.add(`<path d="${d}" stroke="${wcol}" stroke-width="2.2" opacity=".75"/>`);if(top==='spire')k.line([[x+w/2,t],[x+w/2,t-26]],1.6,C.graph);
  if(k.env.snow)k.side(()=>capLine(k,[[x,t],[x+w,t]],3))});
  k.fx(()=>{if(k.env.lit)list.forEach(([x,w,h])=>{for(let j=0;j<Math.round(w*h/900);j++)litDot(k,x+6+k.r()*(w-12),gy-h+10+k.r()*(h-16))})})}
// a paw print (four toes and a pad) as one path, centred on (x, y)
function pawD(x,y,s){return `M${R1(x-5.4*s)} ${R1(y+3*s)}a${R1(5.4*s)} ${R1(4.4*s)} 0 1 0 ${R1(10.8*s)} 0a${R1(5.4*s)} ${R1(4.4*s)} 0 1 0 ${R1(-10.8*s)} 0`+
  [[-6,-3],[-2,-6.6],[2.6,-6.6],[6.4,-3]].map(([dx,dy])=>`M${R1(x+dx*s-2.3*s)} ${R1(y+dy*s)}a${R1(2.3*s)} ${R1(2.3*s)} 0 1 0 ${R1(4.6*s)} 0a${R1(2.3*s)} ${R1(2.3*s)} 0 1 0 ${R1(-4.6*s)} 0`).join('')}
// the eki stamp print: a red ring with a paw (the stamp book's look)
function stampMark(k,x,y,r,col='#D9473A',rot=-8){k.add(`<g transform="rotate(${rot} ${R1(x)} ${R1(y)})"><circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(r)}" fill="none" stroke="${col}" stroke-width="${R1(Math.max(1.4,r*.16))}"/><circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(r*.78)}" fill="none" stroke="${col}" stroke-width=".9" stroke-dasharray="2 2"/><path d="${pawD(x,y+r*.08,r*.06)}" fill="${col}"/></g>`)}
// the station stamp stand: a little roofed desk with the round stamp, its ink pad, a pad of paper and a sample print on the board
function ekiStand(k,x,gy,s=1,col='#E8664F'){[-20,16].forEach(dx=>k.shape(RC(x+dx*s,gy-52*s,5*s,52*s),C.woodD,{w:1.3,one:1}));k.line([[x-18*s,gy-18*s],[x+19*s,gy-18*s]],1.6,C.woodD);
  k.shape(RC(x-24*s,gy-100*s,48*s,40*s),'#FFF6E6',{w:1.5,one:1});stampMark(k,x,gy-80*s,13*s);
  const rf=[[x-33*s,gy-97*s],[x,gy-116*s],[x+33*s,gy-97*s],[x+29*s,gy-94*s],[x-29*s,gy-94*s]];k.shape(rf,col,{w:1.5,one:1,hatch:{side:.6,gap:3,col:dk(col),op:.5}});
  k.shape(RC(x-30*s,gy-62*s,60*s,12*s),C.wood,{w:1.6,one:1,hatch:{side:.7,gap:3.4,col:C.woodD,op:.45}});
  k.shape(RC(x-24*s,gy-67*s,15*s,5*s),'#3E3533',{w:1,one:1});k.shape(RC(x-6*s,gy-68*s,13*s,6*s),'#FFFFFF',{w:1,one:1});
  k.shape(RC(x+11*s,gy-80*s,7*s,13*s),'#C49A6C',{w:1.1,one:1});k.shape(E(x+14.5*s,gy-81*s,5.4*s,3*s,10),'#9C7550',{w:1,one:1});k.shape(RC(x+9*s,gy-68*s,11*s,5*s),'#D9473A',{w:1,one:1});
  if(k.env.snow)k.side(()=>capLine(k,rf.slice(0,3),4*s))}
// a folded souvenir bandana hanging from a line: a triangle with its pattern (stripes, a lantern, or plain)
function bandana(k,x,y,s,col,kind){const p=[[x-12*s,y],[x+12*s,y],[x+1*s,y+20*s]];k.shape(p,col,{w:1.2,one:1});
  if(kind==='stripe')k.add(`<path d="M${R1(x-7*s)} ${R1(y+3*s)}l${R1(3*s)} ${R1(8*s)}M${R1(x-2*s)} ${R1(y+3*s)}l${R1(3*s)} ${R1(10*s)}M${R1(x+3*s)} ${R1(y+3*s)}l${R1(2.4*s)} ${R1(8*s)}" stroke="#FFFFFF" stroke-width="${R1(1.8*s)}" stroke-linecap="round"/>`);
  else if(kind==='lantern')k.add(`<ellipse cx="${R1(x+.5*s)}" cy="${R1(y+7*s)}" rx="${R1(3.2*s)}" ry="${R1(4*s)}" fill="#FFF4E6" stroke="${C.ink}" stroke-width=".7"/>`);
  else if(kind==='tower')k.add(`<path d="M${R1(x+.5*s)} ${R1(y+2*s)}l${R1(-3*s)} ${R1(11*s)}h${R1(6*s)}z" fill="#FFFFFF" stroke="${C.ink}" stroke-width=".7"/>`);
  k.add(`<path d="M${R1(x-3*s)} ${R1(y)}l${R1(-2*s)} ${R1(-3*s)}M${R1(x+3*s)} ${R1(y)}l${R1(2*s)} ${R1(-3*s)}" stroke="${C.ink}" stroke-width="1"/>`)}
// a little lucky cat on a counter (one paw up), the shop's mascot
function luckyCat(k,x,gy,s=1){k.shape(E(x,gy-9*s,9*s,9*s,12),'#FFFBF3',{w:1.2,one:1});k.shape(E(x,gy-22*s,8*s,7*s,12),'#FFFBF3',{w:1.2,one:1});
  k.add(`<path d="M${R1(x-7*s)} ${R1(gy-26*s)}l${R1(1*s)} ${R1(-6*s)} ${R1(4*s)} ${R1(3*s)}zM${R1(x+7*s)} ${R1(gy-26*s)}l${R1(-1*s)} ${R1(-6*s)} ${R1(-4*s)} ${R1(3*s)}z" fill="#FFFBF3" stroke="${C.ink}" stroke-width="1" stroke-linejoin="round"/>`);
  k.shape(E(x+8*s,gy-26*s,3*s,4.6*s,8),'#FFFBF3',{w:1,one:1});k.add(`<path d="M${R1(x-6*s)} ${R1(gy-15*s)}q${R1(6*s)} ${R1(4*s)} ${R1(12*s)} 0" fill="none" stroke="#E04A3C" stroke-width="${R1(2*s)}"/><circle cx="${R1(x)}" cy="${R1(gy-12*s)}" r="${R1(1.8*s)}" fill="#F7D24E" stroke="${C.ink}" stroke-width=".6"/><path d="M${R1(x-4*s)} ${R1(gy-23*s)}q${R1(1.2*s)} ${R1(-1.4*s)} ${R1(2.4*s)} 0M${R1(x+1.6*s)} ${R1(gy-23*s)}q${R1(1.2*s)} ${R1(-1.4*s)} ${R1(2.4*s)} 0" fill="none" stroke="${C.ink}" stroke-width=".9" stroke-linecap="round"/>`)}
// a souvenir stall: posts, an awning, a back board with a line of bandanas, a counter with a lucky cat and a plush train
function kiosk(k,x0,x1,gy,awn,band,o={}){const w=x1-x0,top=gy-120;[x0+4,x1-10].forEach(x=>k.shape(RC(x,top+20,6,100),C.woodD,{w:1.3,one:1}));
  k.shape(RC(x0+8,top+28,w-16,58),'#FFF6E6',{w:1.4,one:1,hatch:{side:.8,gap:4,col:'#E3D2BA',op:.5}});if(k.env.lit)k.add(`<rect x="${x0+9}" y="${top+29}" width="${w-18}" height="56" fill="${rgbL2}" opacity="${R1(.7*k.env.lit)}"/>`);
  const L=sagP(x0+12,top+36,x1-12,top+36,5,10);k.line(L,1.1,C.ink,{op:.8});const n=Math.max(3,Math.round((w-30)/26));
  for(let i=0;i<n;i++){const t=(i+.5)/n,p=L[Math.round(t*(L.length-1))];bandana(k,p[0],p[1],.95,band[i%band.length][0],band[i%band.length][1])}
  k.shape(RC(x0,gy-44,w,44),C.wood,{w:1.7,one:1,hatch:{side:.72,gap:4,col:C.woodD,op:.45}});k.shape(RC(x0-3,gy-48,w+6,6),C.woodD,{w:1.3,one:1});
  O.awning(k,x0-6,top,w+12,20,awn[0],awn[1]);
  if(o.cat)luckyCat(k,x0+20,gy-48,.9);
  {const px=x1-34,py=gy-48;k.shape([[px-14,py],[px-14,py-12],[px+6,py-12],[px+16,py-4],[px+16,py]],'#FFFFFF',{w:1.2,one:1});k.add(`<path d="M${px-14} ${py-5}h28" stroke="#4E7FC4" stroke-width="2.4"/><circle cx="${px-8}" cy="${py-8}" r="1.4" fill="${C.ink}"/><circle cx="${px-2}" cy="${py-8}" r="1.4" fill="${C.ink}"/>`)}
}
// a pedestrian signal: a grey pole, the red standing figure (dark) over the green walking figure (lit), a push-button box
function pedSignal(k,x,gy,s=1){k.shape(RC(x-3*s,gy-150*s,6*s,150*s),'#B9B1A7',{w:1.4,one:1,hatch:{side:.5,gap:3,col:'#8E867C',op:.5}});
  const bx=x+4*s;[[gy-152*s,'#E05A4A',0],[gy-124*s,'#7FD39A',1]].forEach(([y,col,go])=>{k.shape(RC(bx,y,28*s,26*s),'#4A4F57',{w:1.4,one:1});k.shape(RC(bx-2*s,y-3*s,32*s,4*s),'#5E636B',{w:1,one:1});
    const cx=bx+14*s,cy=y+13*s,c=go?col:'#7A5A58';if(go)k.add(`<circle cx="${R1(cx-1*s)}" cy="${R1(cy-7*s)}" r="${R1(2.4*s)}" fill="${c}"/><path d="M${R1(cx-1*s)} ${R1(cy-4*s)}l${R1(1*s)} ${R1(6*s)}l${R1(-4*s)} ${R1(6*s)}M${R1(cx)} ${R1(cy+2*s)}l${R1(4*s)} ${R1(6*s)}M${R1(cx-1*s)} ${R1(cy-3*s)}l${R1(-4*s)} ${R1(4*s)}M${R1(cx-1*s)} ${R1(cy-3*s)}l${R1(5*s)} ${R1(3*s)}" stroke="${c}" stroke-width="${R1(2.2*s)}" stroke-linecap="round" fill="none"/>`);
    else k.add(`<circle cx="${R1(cx)}" cy="${R1(cy-7*s)}" r="${R1(2.4*s)}" fill="${c}"/><path d="M${R1(cx)} ${R1(cy-4*s)}v${R1(8*s)}M${R1(cx-2*s)} ${R1(cy+4*s)}v${R1(6*s)}M${R1(cx+2*s)} ${R1(cy+4*s)}v${R1(6*s)}M${R1(cx-4*s)} ${R1(cy-3*s)}v${R1(6*s)}M${R1(cx+4*s)} ${R1(cy-3*s)}v${R1(6*s)}" stroke="${c}" stroke-width="${R1(2*s)}" stroke-linecap="round"/>`)});
  if(k.env.lit){const g=glowGrad(k,'#8FF0B0','pwdgo');wlPush(k,bx+14*s,`<circle cx="${R1(bx+14*s)}" cy="${R1(gy-111*s)}" r="${R1(26*s)}" fill="url(#${g})" opacity="${R1(.9*k.env.lit)}"/><circle cx="${R1(bx+13*s)}" cy="${R1(gy-118*s)}" r="${R1(2.4*s)}" fill="#C8FFD6"/>`)}
  k.shape(RC(x-9*s,gy-84*s,12*s,18*s),'#F7D24E',{w:1.2,one:1});k.add(`<circle cx="${R1(x-3*s)}" cy="${R1(gy-73*s)}" r="${R1(2.6*s)}" fill="#E04A3C" stroke="${C.ink}" stroke-width=".7"/>`);
  // the blue crossing sign on top
  k.shape(RC(x-14*s,gy-186*s,28*s,28*s),'#5B86C9',{w:1.4,one:1});k.add(`<path d="M${R1(x-9*s)} ${R1(gy-162*s)}l${R1(9*s)} ${R1(-19*s)} ${R1(9*s)} ${R1(19*s)}z" fill="#FFFFFF" stroke="${C.ink}" stroke-width=".8"/><circle cx="${R1(x)}" cy="${R1(gy-172*s)}" r="${R1(2*s)}" fill="${C.ink}"/><path d="M${R1(x)} ${R1(gy-170*s)}v${R1(5*s)}l${R1(-2.4*s)} ${R1(3.6*s)}M${R1(x)} ${R1(gy-165*s)}l${R1(2.4*s)} ${R1(3.6*s)}" stroke="${C.ink}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`);
  if(k.env.snow)k.side(()=>{capLine(k,[[x-15*s,gy-186*s],[x+15*s,gy-186*s]],4*s);capLine(k,[[bx-2*s,gy-155*s],[bx+30*s,gy-155*s]],3.5*s)})}

/* ---------- Hachikō: a pencil-sketched bronze Akita sitting on a granite plinth, facing left ---------- */
const BZ={b:'#A07B52',d:'#77583A',h:'#C9A67A',p:'#86977F',n:'#4E3A2A'};// bronze, shadow, highlight, a little green patina, nose
function hachiko(k,x,gy,s=1){const pw=80*s,ph=76*s,top=gy-10*s-ph;
  k.shape(RC(x-pw/2-9*s,gy-11*s,pw+18*s,11*s),'#C9C2B8',{w:1.5,one:1,hatch:{side:.6,gap:3.4,col:'#A39B90',op:.5}});
  k.shape(RC(x-pw/2,top,pw,ph),'#D9D3C9',{w:1.7,one:1,hatch:{side:.68,gap:3.6,col:'#A9A196',op:.5}});
  k.shape(RC(x-pw/2-5*s,top-6*s,pw+10*s,7*s),'#CBC4BA',{w:1.4,one:1});
  // the bronze plaque (blank, a few engraved lines)
  k.shape(RC(x-20*s,top+20*s,40*s,26*s),'#B58E5E',{w:1.2,one:1,hatch:{side:.6,gap:2.6,col:'#8E6C44',op:.5}});k.add(`<path d="M${R1(x-14*s)} ${R1(top+28*s)}h${R1(28*s)}M${R1(x-14*s)} ${R1(top+34*s)}h${R1(24*s)}M${R1(x-14*s)} ${R1(top+40*s)}h${R1(18*s)}" stroke="#6E5238" stroke-width="1" opacity=".8"/>`);
  const y0=top-6*s,P=(u,v)=>[x+u*s,y0+v*s],sh=(pts,col,o={})=>k.shape(pts.map(q=>P(q[0],q[1])),col,Object.assign({w:1.5,one:1},o)),hb={side:.55,gap:2.8,col:BZ.d,op:.55,w:1};
  // the curled tail on the back, behind
  k.add(`<circle cx="${R1(x+21*s)}" cy="${R1(y0-50*s)}" r="${R1(8.6*s)}" fill="none" stroke="${C.ink}" stroke-width="${R1(9.6*s)}"/><circle cx="${R1(x+21*s)}" cy="${R1(y0-50*s)}" r="${R1(8.6*s)}" fill="none" stroke="${BZ.b}" stroke-width="${R1(6.6*s)}"/><path d="M${R1(x+16*s)} ${R1(y0-52*s)}q${R1(5*s)} ${R1(-6*s)} ${R1(9*s)} ${R1(1*s)}" fill="none" stroke="${BZ.d}" stroke-width="1.2"/>`);
  // body, haunch, hind paw
  sh([[-20,-4],[-23,-30],[-18,-48],[-8,-58],[8,-54],[24,-44],[33,-26],[32,-4]],BZ.b,{hatch:hb});
  sh(blobP(14,-21,21,20,k.r,10,.08),BZ.b,{hatch:{side:.5,gap:2.8,col:BZ.d,op:.6,w:1}});
  sh(E(16,-3,17,4.4,12),BZ.b,{w:1.3});
  // front legs (the far one darker) and paws
  sh(RC(-25,-38,8,36),BZ.d,{w:1.3});sh(E(-24,-2.4,7.4,3.4,10),BZ.d,{w:1.1});
  sh(RC(-15,-40,8.6,38),BZ.b,{w:1.4,hatch:{side:.6,gap:2.6,col:BZ.d,op:.45,w:1}});sh(E(-13.5,-2.4,7.6,3.6,10),BZ.b,{w:1.2});
  // neck, head, muzzle, ears
  sh([[-6,-56],[-19,-54],[-27,-70],[-12,-78]],BZ.b,{hatch:hb});
  sh([[-12,-90],[-9,-103],[-4,-88]],BZ.b,{w:1.3});sh([[-22,-89],[-28,-97],[-30,-88]],BZ.b,{w:1.3});// one ear upright, one a little droopy (the real Hachikō's left ear)
  sh(E(-18,-79,13,11.4,14),BZ.b,{hatch:{side:.62,gap:2.6,col:BZ.d,op:.5,w:1}});
  sh([[-27,-84],[-41,-80],[-43,-73],[-30,-70]],BZ.b,{w:1.3});
  k.add(`<ellipse cx="${R1(x-42*s)}" cy="${R1(y0-78*s)}" rx="${R1(3*s)}" ry="${R1(2.4*s)}" fill="${BZ.n}"/><path d="M${R1(x-27*s)} ${R1(y0-83*s)}q${R1(2*s)} ${R1(-2*s)} ${R1(4*s)} 0" fill="none" stroke="${BZ.n}" stroke-width="${R1(1.6*s)}" stroke-linecap="round"/><path d="M${R1(x-41*s)} ${R1(y0-73.6*s)}q${R1(5*s)} ${R1(2*s)} ${R1(9*s)} ${R1(-1*s)}" fill="none" stroke="${BZ.n}" stroke-width="1"/><path d="M${R1(x-8*s)} ${R1(y0-59*s)}q${R1(-8*s)} ${R1(4*s)} ${R1(-15*s)} ${R1(2*s)}" fill="none" stroke="${BZ.d}" stroke-width="${R1(2*s)}" stroke-linecap="round"/>`);
  // highlights where the light catches the bronze, and a little green patina
  k.add(`<path d="M${R1(x-6*s)} ${R1(y0-60*s)}q${R1(12*s)} ${R1(2*s)} ${R1(26*s)} ${R1(12*s)}M${R1(x-26*s)} ${R1(y0-88*s)}q${R1(6*s)} ${R1(-3*s)} ${R1(12*s)} ${R1(-1*s)}M${R1(x+2*s)} ${R1(y0-36*s)}q${R1(8*s)} ${R1(-4*s)} ${R1(16*s)} ${R1(2*s)}" fill="none" stroke="${BZ.h}" stroke-width="${R1(1.8*s)}" stroke-linecap="round" opacity=".9"/><g fill="${BZ.p}" opacity=".55"><ellipse cx="${R1(x+22*s)}" cy="${R1(y0-24*s)}" rx="${R1(4*s)}" ry="${R1(2.4*s)}"/><ellipse cx="${R1(x-12*s)}" cy="${R1(y0-70*s)}" rx="${R1(3*s)}" ry="${R1(1.8*s)}"/><ellipse cx="${R1(x-12*s)}" cy="${R1(y0-12*s)}" rx="${R1(2*s)}" ry="${R1(3*s)}"/></g>`);
  // flowers left at his feet
  [[-30,'#F28FA5'],[-22,'#F7D24E'],[-14,'#FFFFFF']].forEach(([dx,c],i)=>{k.line([[x+dx*s,gy-1*s],[x+(dx+3)*s,gy-14*s]],1.2,'#6FAE5C');k.add(`<circle cx="${R1(x+(dx+3)*s)}" cy="${R1(gy-15*s)}" r="${R1(3.2*s)}" fill="${c}" stroke="${C.ink}" stroke-width=".8"/>`)});
  if(k.env.snow)k.side(()=>{capLine(k,[[x-pw/2-6*s,top-6*s],[x+pw/2+6*s,top-6*s]],5*s);capLine(k,[P(-8,-58),P(8,-54),P(24,-44)],4*s);capLine(k,[P(-30,-86),P(-18,-91),P(-6,-88)],3.5*s)})}

/* ---------- trees ---------- */
// a ginkgo: a tall rounded crown of fan leaves (fresh green, deep green, bright yellow in autumn, bare in winter)
function ginkgoLeaf(k,x,y,s,rot,col){const c=Math.cos(rot),n=Math.sin(rot),P=(u,v)=>`${R1(x+u*s*c-v*s*n)} ${R1(y+u*s*n+v*s*c)}`;
  return `<path d="M${P(0,0)}L${P(-4,-6)}Q${P(-2,-9)} ${P(0,-8)}L${P(0,-6.4)}L${P(.6,-8)}Q${P(3,-9)} ${P(4,-6)}Z" fill="${col}" stroke="${C.ink}" stroke-width=".6"/><path d="M${P(0,0)}l${R1(3*s*n)} ${R1(3*s*c)}" stroke="${C.ink}" stroke-width=".7"/>`}
function ginkgo(k,x,gy,s=1){const so=k.env.season,th=[[x-7*s,gy],[x-5*s,gy-80*s],[x+5*s,gy-80*s],[x+8*s,gy]];k.shape(th,'#9C8070',{w:1.5,hatch:{side:.6,gap:3,col:'#7A6052',op:.5}});
  const br=[[[x,gy-60*s],[x-26*s,gy-96*s]],[[x,gy-70*s],[x+24*s,gy-112*s]],[[x,gy-80*s],[x-4*s,gy-150*s]]];br.forEach(b=>k.line(b,2.6*s,'#7A6052',{amp:.4}));
  const cr=[[x-18*s,gy-92*s,30*s,30*s],[x+18*s,gy-104*s,30*s,32*s],[x,gy-136*s,28*s,34*s],[x-2*s,gy-104*s,26*s,30*s]];
  if(so==='winter'){br.forEach(b=>k.line([b[1],[b[1][0]+k.J(10),b[1][1]-12*s]],1.2,'#7A6052'));if(k.env.snow)br.forEach(b=>capLine(k,b,3))}
  else{const [c1,c2]=so==='autumn'?['#F7D24E','#E0A93A']:so==='spring'?['#CDEB9E','#9CCB80']:['#A6D27E','#7FB86A'];cr.forEach(([cx,cy,rx,ry])=>jpPuffs(k,cx,cy,rx,ry,c1,c2));
    let d='';for(let i=0;i<10;i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r());d+=ginkgoLeaf(k,x+Math.cos(a)*30*s*rr,gy-112*s+Math.sin(a)*44*s*rr,1.4*s,k.J(1),c1)}k.add(d);
    if(k.env.snow)k.side(()=>capLine(k,[[x-40*s,gy-104*s],[x-10*s,gy-168*s],[x+20*s,gy-170*s],[x+46*s,gy-118*s]],5))}}
// a cherry (sakura) tree in the season's dress: blossom in spring, green in summer, gold and red in autumn, bare in winter
function sakura(k,x,gy,s=1){const so=k.env.season;k.shape([[x-7*s,gy],[x-5*s,gy-56*s],[x+4*s,gy-56*s],[x+8*s,gy]],'#8A6A5A',{w:1.5,hatch:{side:.6,gap:3,col:'#6E5246',op:.5}});
  const br=[[[x,gy-46*s],[x-34*s,gy-80*s]],[[x,gy-52*s],[x+36*s,gy-88*s]],[[x,gy-56*s],[x+2*s,gy-102*s]]];br.forEach(b=>k.line(b,2.8*s,'#6E5246',{amp:.4}));
  const cr=[[x-34*s,gy-86*s,34*s,24*s],[x+34*s,gy-92*s,36*s,24*s],[x,gy-110*s,40*s,26*s]];
  if(so==='winter'){if(k.env.snow)br.forEach(b=>capLine(k,b,3))}
  else cr.forEach(([cx,cy,rx,ry])=>{if(so==='spring')jpPuffs(k,cx,cy,rx,ry,'#F9D3DE','#E9A2B8',1);else if(so==='autumn'){jpPuffs(k,cx,cy,rx,ry,'#EE8A4E','#C6603A');jpMomiji(k,cx,cy,rx*.8,ry*.7,4,.8)}else jpPuffs(k,cx,cy,rx,ry,C.leaf2,C.leafD)})}

/* ---------- Shibuya Crossing: the scramble on the floor, Hachikō on the left, the big screens, a green train on the viaduct ---------- */
function tkShibuya(k){const e=k.env;HZ=Object.values(HOTS.shibuya).map(([x,y,w,h])=>[x,y,x+w,y+h]);
  k.skyD(()=>{skyBand(k,1000,420);O.sun(k,620,64,24);O.cloud(k,190,56,20);O.cloud(k,880,40,16);O.bird(k,700,104,7);O.bird(k,718,114,5)},
    {W:1000,H:420,sun:[620,64,24],low:[640,150,28],moon:[630,62,22],clouds:[[190,56,20],[880,40,16],[400,30,14]],rainC:[[520,30,26],[760,60,22],[80,90,22]],birds:[[700,104,7],[718,114,5]],stars:40});
  // far towers (pale), the tall one with its stepped crown
  farCity(k,[[-10,80,190],[78,64,140],[150,58,220,'spire'],[560,92,330,'step'],[656,60,250],[720,70,200],[930,80,240]],330,'#E6E2EE','#C9C3D8');
  // the station building with the elevated tracks and a green-striped train
  bldg(k,-12,424,320,128,'#EFE3CF',{roof:'#D8C6AA',win:[16,58,18,2,9],wo:{f:.7,fh:.5}});
  k.shape(RC(-12,286,350,16),'#CFC6BA',{w:1.6,one:1,hatch:{side:.6,gap:4,col:'#A79F94',op:.5}});
  {const ty=246;let wd='';[[-6,140],[140,140]].forEach(([x,w])=>{k.shape([[x+6,ty],[x+w-8,ty],[x+w-2,ty+8],[x+w-2,ty+40],[x+2,ty+40],[x+2,ty+8]],'#E4E7EA',{w:1.5,one:1,hatch:{side:.85,gap:3.6,col:'#B5BCC4',op:.45}});
    k.add(`<rect x="${x+2}" y="${ty+28}" width="${w-4}" height="6" fill="#86C24E"/>`);for(let wx=x+12;wx<x+w-16;wx+=22)wd+=`M${wx} ${ty+8}h14v13h-14Z`});
    k.add(`<path d="${wd}" fill="#CFE2EE" stroke="${C.ink}" stroke-width=".9"/>`);if(e.lit){let lw='';for(let wx=6;wx<270;wx+=22)lw+=`M${wx+2} ${ty+8}h14v13h-14Z`;k.add(`<path d="${lw}" fill="${rgbL2}" opacity="${R1(.85*e.lit)}"/>`)}
    k.line([[-12,ty-6],[338,ty-6]],1.2,C.ink,{op:.6});[30,130,230,330].forEach(x=>k.line([[x,ty-6],[x,ty+40]],1.4,'#8E867C'))}
  // the building with the big screen (centre left), and the one with neon strips
  bldg(k,300,424,226,304,'#E9E4DA',{roof:'#C9C1B5',win:[14,152,64,4,8]});
  {const sx=318,sy=138,sw=190,sh=104;k.shape(RC(sx-6,sy-6,sw+12,sh+12),'#5A6170',{w:1.8,one:1});k.fill(RC(sx,sy,sw,sh),'#BFE3F7',{dx:0,dy:0,sc:0});
    O.heart(k,sx+70,sy+52,22);k.add(`<path d="${pawD(sx+142,sy+56,2.6)}" fill="#F7D24E" stroke="${C.ink}" stroke-width="1.2"/>`);O.sparkle(k,sx+28,sy+22,8,'#FFFFFF');O.sparkle(k,sx+168,sy+20,7,'#FFFFFF');
    k.add(`<path d="M${sx+8} ${sy+sh-12}h${sw-16}" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="10 6" opacity=".8"/>`);
    if(e.lit)wlPush(k,sx+sw/2,`<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#CFF0FF" opacity="${R1(.45*e.lit)}"/>`),jpGlow(k,sx+sw/2,sy+sh/2,120,.8)}
  bldg(k,538,424,150,250,'#F2E2E6',{roof:'#D9BFC6',win:[44,20,70,7,4]});
  [[548,'#F28FA5'],[668,'#8FC1E8']].forEach(([x,c])=>{k.shape(RC(x,196,14,140),c,{w:1.4,one:1});k.add(`<path d="M${x+3} ${210}h8M${x+3} ${232}h8M${x+3} ${254}h8M${x+3} ${276}h8M${x+3} ${298}h8" stroke="#FFFFFF" stroke-width="2.4"/>`);if(e.lit)wlPush(k,x+7,`<rect x="${x}" y="196" width="14" height="140" fill="${c}" opacity="${R1(.55*e.lit)}"/>`)});
  // right: a building with a second screen and the silver cylinder tower
  bldg(k,694,424,140,214,'#E1E8EF',{roof:'#BFC9D3',win:[12,100,60,3,5]});
  {const sx=708,sy=226,sw=112,sh=62;k.shape(RC(sx-5,sy-5,sw+10,sh+10),'#5A6170',{w:1.6,one:1});k.fill(RC(sx,sy,sw,sh),'#FCE59A',{dx:0,dy:0,sc:0});
    k.add(`<circle cx="${sx+34}" cy="${sy+32}" r="15" fill="#E9F59B" stroke="${C.ink}" stroke-width="1.6"/><path d="M${sx+24} ${sy+28}q10 7 20 0" fill="none" stroke="#FFFFFF" stroke-width="1.8"/><path d="M${sx+58} ${sy+40}q14 -22 34 -8" fill="none" stroke="${C.ink}" stroke-width="1.6" stroke-dasharray="4 4"/>`);
    if(e.lit)wlPush(k,sx+sw/2,`<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#FFF6C8" opacity="${R1(.45*e.lit)}"/>`)}
  {const x=842,w=124,t=96;k.shape([[x,424],[x,t+14],[x+w*.5,t],[x+w,t+14],[x+w,424]],'#DCDFE4',{w:1.8,one:1,hatch:{side:.62,gap:4,col:'#A9B0BA',op:.5}});
    let d='';for(let xx=x+12;xx<x+w-8;xx+=14)d+=`M${xx} ${t+40}V412`;k.add(`<path d="${d}" stroke="#A9B0BA" stroke-width="1.6"/>`);k.shape(RC(x,t+20,w,18),'#F28FA5',{w:1.4,one:1});
    if(e.lit)wlPush(k,x+w/2,`<rect x="${x}" y="${t+20}" width="${w}" height="18" fill="#FFC3D2" opacity="${R1(.7*e.lit)}"/>`);if(e.snow)k.side(()=>capLine(k,[[x,t+14],[x+w*.5,t],[x+w,t+14]],5))}
  // shop fronts along the bottom of the buildings
  O.awning(k,312,364,200,16,'#F7C5CF','#FFFFFF');O.awning(k,700,368,128,14,C.mint,'#FFFFFF');
  // the back pavement and the road
  k.fill(RC(-10,416,1020,40),'#E6E0D6',{dx:0,dy:0,sc:0});{let d='';for(let x=0;x<1000;x+=46)d+=`M${x+k.J(2)} 418l-6 36`;k.add(`<path d="${d}M0 436h1000" stroke="#C7BCAE" stroke-width="1.2"/>`)}
  k.fill(RC(-10,454,1020,150),'#D6D2CC',{dx:0,dy:0,sc:0});k.add(`<rect x="0" y="454" width="1000" height="146" fill="url(#${hatchPat(k,100,'#B9B3AB',22,1.3,.5)})"/>`);
  k.line([[-10,454],[1010,454]],2.2,C.ink);k.line([[-10,459],[1010,459]],1.2,C.graph,{op:.8});
  // the scramble: the long crossing (bars side by side), the two diagonals, the stop lines
  {let d='';for(let x=40;x<960;x+=48){const sp=(x-500)*.06;d+=`M${R1(x-sp)} 474h28l${R1(sp*2+2)} 62h-30Z`}
    k.add(`<path d="${d}" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.1" stroke-opacity=".75"/>`);
    // the crossings at both ends, running toward us (bars stacked), and a decorated manhole cover with a paw in the middle of the road
    let g='';[[24,150],[850,976]].forEach(([a,b])=>{for(let y=544,i=0;y<600;i++){const h=7+i*1.6,sp=(y-470)*.08;g+=`M${R1(a-sp*(a<500?1:-.4))} ${R1(y)}H${R1(b+sp*(a<500?.4:1))}v${R1(h)}H${R1(a-sp*(a<500?1:-.4))}Z`;y+=h+6+i}});
    k.add(`<path d="${g}" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1" stroke-opacity=".7"/>`);
    k.shape(E(500,568,34,11,16),'#B9B1A7',{w:1.6,one:1,hatch:{side:.6,gap:3,col:'#8E867C',op:.5}});k.add(`<ellipse cx="500" cy="568" rx="26" ry="8" fill="none" stroke="#8E867C" stroke-width="1.2"/><g transform="translate(500 568) scale(1 .32)"><path d="${pawD(0,1,1.7)}" fill="#8E867C"/></g>`);
    k.add(`<path d="M30 466H970" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".85"/>`)}
  // the trees in their planters behind Hachikō, the lamp, the vending machine
  {const tr=(x,gy,s)=>{k.shape([[x-26*s,gy],[x+26*s,gy],[x+22*s,gy-22*s],[x-22*s,gy-22*s]],'#CFC6BA',{w:1.5,one:1,hatch:{side:.6,gap:3.4,col:'#A79F94',op:.5}});O.tree(k,x,gy-22*s,s*.8)};tr(60,438,.9);tr(118,430,.7)}
  O.lamp(k,292,446,.9);jpVend(k,960,446,.9);
  k.fx(()=>hubFx(k,{sheen:[456,598],puddles:[[300,570,44,8],[700,586,40,7],[900,500,34,6]],patches:[[120,598,60,10],[860,596,56,10],[480,452,60,6],[40,450,40,6]]}));
  k.ss(()=>seasonGround(k,[0,420,1000,598],70,HZ.concat([[0,470,1000,540]]),0,1));
  // the tappable things: Hachikō, the crossing signal, the stamp stand, the souvenir stall
  hotAt(k,'shibuya','hachiko','Hachikō statue',()=>hachiko(k,216,452,1.05));
  hotAt(k,'shibuya','crossing','Scramble crossing',()=>pedSignal(k,368,452,1));
  hotAt(k,'shibuya','stamp','Station stamp',()=>ekiStand(k,640,452,1,'#86C24E'));
  hotAt(k,'shibuya','souvenir','Souvenir stand',()=>kiosk(k,730,838,452,['#86C24E','#FFFFFF'],[['#86C24E','stripe'],['#7FB86A','stripe'],['#86C24E','stripe']],{cat:0}));
  k.ss(()=>{seasonDrift(k,[[560,360,1],[480,300,.85],[860,330,.9]]);if(k.so==='spring'&&!e.night)[[150,440,.4],[520,446,1.9],[800,440,.9]].forEach(([x,y,r],i)=>petalAt(k,x,y,4,r,PET[i%3]))});
  k.hw(()=>{hwJack(k,156,452,.7);hwJack(k,278,456,.6);hwGhost(k,96,330,.7,14);hwBatString(k,312,512,360,12,5,.7)});
  k.lt(()=>{ltString(k,sagP(20,360,140,356,10,10),18);ltString(k,sagP(312,358,512,358,14,12),22);ltString(k,sagP(700,364,830,364,10,10),20)});
  k.ny(()=>{nyKado(k,26,452,.8,1);nyShime(k,216,370,.8);nyChochins(k,700,380,830,380,8,4,.7)});
  O.tape(k,6,24,90,-24,'#F7B9C6');O.tape(k,930,568,80,-26,'#BDE7D2')}

/* ---------- Yoyogi Park dog run: a big lawn inside a low fence, ginkgo and zelkova trees, the city far away ---------- */
function tkYoyogi(k){const e=k.env;HZ=Object.values(HOTS.yoyogi).map(([x,y,w,h])=>[x,y,x+w,y+h]);
  k.skyD(()=>{skyBand(k,1000,400);O.sun(k,150,82,28);O.cloud(k,420,70,22);O.cloud(k,820,104,18);O.bird(k,560,90,8);O.bird(k,582,100,6)},
    {W:1000,H:400,sun:[150,82,28],low:[170,260,32],moon:[160,84,24],clouds:[[420,70,22],[820,104,18],[640,50,15]],rainC:[[260,40,26],[700,36,26],[940,80,20]],birds:[[560,90,8],[582,100,6]],stars:48});
  // the city skyline far away, with the clock tower and its spire
  farCity(k,[[30,60,70],[96,46,96],[520,56,84],[580,40,60],[880,70,90],[952,50,70]],300,'#E3E6EE','#C9CEDB');
  {const x=744,gy=300;const p=[[x,gy],[x,gy-150],[x+8,gy-150],[x+8,gy-176],[x+16,gy-176],[x+16,gy-196],[x+26,gy-196],[x+26,gy-176],[x+34,gy-176],[x+34,gy-150],[x+42,gy-150],[x+42,gy]];
    k.fill(p,'#E3E6EE',{dx:0,dy:0,sc:0});k.pen(p,true,{w:1.1,col:C.graph,one:1,amp:.4});k.line([[x+21,gy-196],[x+21,gy-236]],1.6,C.graph);k.add(`<circle cx="${x+21}" cy="${gy-162}" r="5" fill="#FFFFFF" stroke="${C.graph}" stroke-width="1"/>`);
    let d='';for(let yy=gy-140;yy<gy-6;yy+=11)for(let xx=x+5;xx<x+38;xx+=9)d+=`M${xx} ${yy}h3.4`;k.add(`<path d="${d}" stroke="#C9CEDB" stroke-width="2.2" opacity=".75"/>`);if(e.lit)k.fx(()=>{litDot(k,x+21,gy-162);for(let j=0;j<8;j++)litDot(k,x+6+k.r()*30,gy-130+k.r()*120)})}
  // the wood: a band of round crowns, then the big trees behind the fence
  const hl=[[0,318],[200,300],[420,312],[640,296],[860,310],[1000,300],[1000,420],[0,420]];k.fill(hl,'#D3E8BC',{dx:0,dy:0,sc:0});k.pen(hl.slice(0,6),false,{w:1.5,col:C.graph});
  for(let x=20;x<1000;x+=56){const y=318+k.J(6);k.shape(E(x,y,22+k.r()*6,16+k.r()*4,10),k.so==='autumn'?(x%112?'#EBC983':'#E8A86A'):k.so==='winter'?'#C9C2B4':k.so==='spring'?(x%168?'#C8E79E':'#F7C6D3'):'#BEDC9E',{w:1.2,lcol:C.graph,one:1})}
  ginkgo(k,86,410,1.15);O.tree(k,440,404,1,{col:C.leaf2});sakura(k,580,404,.8);ginkgo(k,668,404,1);O.tree(k,900,408,1.2,{col:C.leaf});
  // the lawn: mowed stripes, darker patches
  const lawn=[[0,414],[1000,410],[1000,600],[0,600]];k.fill(lawn,C.grass,{dx:0,dy:0,sc:0});
  [[470,588,150,20],[800,520,100,16],[160,500,110,16]].forEach(q=>k.fill(E(q[0],q[1],q[2],q[3],12),C.grass2,{op:.7}));
  hatchBand(k,414,600,'#B4D98E',.35,22);
  // the low fence across the back: posts and a mesh, the double gate on the left
  {const yb=424,yt=384,gx0=150,gx1=236;k.shape(RC(-10,yt,gx0+10,6),'#B9B1A7',{w:1.3,one:1});k.shape(RC(gx1,yt,1010-gx1,6),'#B9B1A7',{w:1.3,one:1});
    let m='';for(let x=-10;x<1010;x+=10){if(x>gx0&&x<gx1)continue;m+=`M${x} ${yt+6}l10 ${yb-yt-6}M${x+10} ${yt+6}l-10 ${yb-yt-6}`}k.add(`<path d="${m}" stroke="#9AA3AE" stroke-width=".9" opacity=".7"/>`);
    for(let x=-6;x<1010;x+=64){if(x>gx0-20&&x<gx1+10)continue;k.shape(RC(x-3,yt-4,6,yb-yt+4),'#8E867C',{w:1.2,one:1})}
    k.line([[-10,yb],[gx0,yb]],1.6,C.ink,{op:.7});k.line([[gx1,yb],[1010,yb]],1.6,C.ink,{op:.7});
    [gx0,gx1].forEach(x=>k.shape(RC(x-5,yt-24,10,yb-yt+24),C.woodD,{w:1.6,one:1}));
    [[gx0+5,gx0+42],[gx0+44,gx1-5]].forEach(([a,b])=>{k.shape(RC(a,yt-10,b-a,yb-yt+6),null,{w:1.6,one:1});let g='';for(let x=a+6;x<b-2;x+=7)g+=`M${x} ${yt-8}V${yb-6}`;k.add(`<path d="${g}" stroke="#9AA3AE" stroke-width="1.2"/>`)});
    k.shape(RC(gx0+38,yt+10,10,8),'#F7D24E',{w:1,one:1});// the latch
    // a little paw sign on the gate post
    k.shape(RC(gx1-2,yt-50,34,26),'#FFFFFF',{w:1.4,one:1});k.add(`<path d="${pawD(gx1+15,yt-37,1)}" fill="${C.pink}"/>`);
    if(k.so==='winter')k.ss(()=>frostLine(k,[[gx1,yt],[1000,yt]]));if(e.snow)k.side(()=>{capLine(k,[[-10,yt],[gx0,yt]],4);capLine(k,[[gx1,yt],[1010,yt]],4)})}
  // outside the fence: a bench, the dogs' drinking tap
  O.bench(k,520,406,.62);
  {const x=800,gy=420;k.shape([[x-9,gy],[x-7,gy-50],[x+7,gy-50],[x+9,gy]],'#B9D3F2',{w:1.7,hatch:{side:.6,gap:3.6,col:'#8FAFD6',op:.6}});k.shape(E(x,gy-52,20,6,12),'#9AA7B8',{w:1.6});k.add(`<path d="M${x+3} ${gy-58}q8 -10 14 -2" fill="none" stroke="#9CCDE8" stroke-width="2.4" stroke-linecap="round"/>`);
    k.shape([[x+8,gy],[x+40,gy],[x+36,gy-10],[x+12,gy-10]],'#9AA7B8',{w:1.6});k.fill(E(x+24,gy-9,11,2.4,10),C.water,{dx:0,dy:0})}
  tufts(k,424,598,100);
  k.ss(()=>{seasonGround(k,[0,424,1000,598],110,HZ);if(k.so==='autumn'){let d='';for(let i=0;i<36;i++)d+=ginkgoLeaf(k,20+k.r()*960,430+k.r()*160,1.5,k.r()*6,i%3?'#F7D24E':'#F2C23E');k.add(d)}});
  k.fx(()=>hubFx(k,{sheen:[426,598],puddles:[[300,580,46,9],[720,560,40,8],[120,470,34,7]],patches:[[300,580,72,13],[720,560,60,11],[120,470,50,8],[900,460,46,8],[520,440,56,7]],flies:[[200,470],[600,480],[880,560],[470,584],[760,330]]}));
  // the tappable stamp stand by the gate (no ball painted on the lawn: the only ball here is the one the dogs play with)
  hotAt(k,'yoyogi','stamp','Station stamp',()=>ekiStand(k,298,436,1,'#7FB86A'));
  k.ss(()=>{seasonDrift(k,[[700,220,1],[620,260,.9],[820,300,.85],[420,240,.8]]);if(k.so==='winter'&&!e.night)robin(k,520,424,1,-1);if(k.so==='spring'&&!e.night&&!e.rain)butterfly(k,700,400,1,'#F9C6D4')});
  k.hw(()=>{hwJack(k,120,428,.7);hwJack(k,270,428,.55);hwGhost(k,880,262,.7,14);hwSkyBats(k,[[560,120,.8],[620,96,.6]])});
  k.lt(()=>{ltString(k,scallop([[-10,380],[54,380],[118,380],[150,374]],7),20);ltString(k,scallop([[236,374],[314,380],[378,380],[442,380],[506,380],[570,380],[634,380],[698,380],[762,380],[826,380],[890,380],[954,380],[1010,380]],7),22)});
  k.ny(()=>{nyKado(k,128,424,.75,-1);nyKado(k,258,424,.75,1);nyShime(k,193,358,.75);nyKites(k,[[520,150,.85,0,470,380],[700,190,.8,1,660,380]])});
  O.tape(k,6,24,90,-24,'#F7B9C6');O.tape(k,930,568,80,-26,'#BDE7D2')}

/* ---------- Asakusa: Kaminarimon with the giant red lantern, the Nakamise stalls, the omikuji stand, Sensō-ji's pagoda behind ---------- */
const VERM='#D9473A',VERMD='#A9352B',TILE='#6E7480',TILED='#4E535C';
// a temple roof: a wide sweep with turned-up corners, tile lines, a ridge
function templeRoof(k,cx,y,hw,h,o={}){const p=[[cx-hw,y+h*.2],[cx-hw*.86,y+h*.42],[cx-hw*.56,y+h*.36],[cx-hw*.4,y],[cx+hw*.4,y],[cx+hw*.56,y+h*.36],[cx+hw*.86,y+h*.42],[cx+hw,y+h*.2],[cx+hw*.94,y+h*.62],[cx-hw*.94,y+h*.62]];
  k.shape(p,o.col||TILE,{w:o.w||1.8,one:1,hatch:{side:.5,gap:3,col:o.colD||TILED,op:.55}});let d='';for(let x=cx-hw*.84;x<cx+hw*.84;x+=Math.max(7,hw/14)){const t=Math.abs(x-cx)/hw;d+=`M${R1(x)} ${R1(y+(t>.4?h*(t-.4)*.9:0)+2)}L${R1(x+(x-cx)*.04)} ${R1(y+h*.6)}`}k.add(`<path d="${d}" stroke="${o.colD||TILED}" stroke-width="1" opacity=".55"/>`);
  k.shape(RC(cx-hw*.42,y-h*.1,hw*.84,h*.12),o.colD||TILED,{w:1.4,one:1});[[-1],[1]].forEach(([sg])=>k.add(`<path d="M${R1(cx+sg*hw*.42)} ${R1(y-h*.1)}q${R1(sg*6)} ${R1(-8)} ${R1(sg*12)} ${R1(-4)}" fill="none" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>`));
  if(k.env.snow)k.side(()=>capLine(k,p.slice(0,8),Math.max(4,h*.12)))}
function lightningLantern(k,cx,y0,w,h){const t=y0,b=y0+h,body=[];for(let i=0;i<=16;i++){const a=i/16,yy=t+10+a*(h-20),bulge=Math.sin(a*Math.PI);body.push([cx-w/2*(.88+.12*bulge),yy])}for(let i=16;i>=0;i--){const a=i/16,yy=t+10+a*(h-20),bulge=Math.sin(a*Math.PI);body.push([cx+w/2*(.88+.12*bulge),yy])}
  k.shape(body,VERM,{w:2,one:1,hatch:{side:.6,gap:3.4,col:VERMD,op:.55}});
  // the paper's bamboo ribs: curved bands all the way down, a little darker every other one
  let r='',r2='';for(let i=1;i<10;i++){const yy=t+10+i*(h-20)/10,bulge=Math.sin(i/10*Math.PI),hw=w/2*(.88+.12*bulge)-3,s=`M${R1(cx-hw)} ${R1(yy)}Q${R1(cx)} ${R1(yy+4)} ${R1(cx+hw)} ${R1(yy)}`;if(i%2)r+=s;else r2+=s}
  k.add(`<path d="${r}" fill="none" stroke="${VERMD}" stroke-width="1.5" opacity=".75"/><path d="${r2}" fill="none" stroke="${VERMD}" stroke-width="1" opacity=".5"/>`);
  // a small soft mark for the thunder gate, rounded like a crayon squiggle
  {const my=t+h*.5;k.add(`<path d="M${R1(cx+3)} ${R1(my-15)}L${R1(cx-6)} ${R1(my+1)}L${R1(cx+1)} ${R1(my)}L${R1(cx-3)} ${R1(my+15)}L${R1(cx+7)} ${R1(my-3)}L${R1(cx)} ${R1(my-2)}L${R1(cx+5)} ${R1(my-15)}Z" fill="#4A3A36" stroke="#4A3A36" stroke-width="2.6" stroke-linejoin="round" opacity=".85"/>`)}
  // the black top and bottom rings, a gold band round each
  [[t-2,15],[b-13,15]].forEach(([yy,hh])=>{k.shape(RC(cx-w*.47,yy,w*.94,hh),'#3E3533',{w:1.5,one:1});k.add(`<path d="M${R1(cx-w*.43)} ${R1(yy+hh*.3)}h${R1(w*.86)}M${R1(cx-w*.43)} ${R1(yy+hh*.72)}h${R1(w*.86)}" stroke="#C9A55E" stroke-width="1.4" opacity=".9"/><path d="M${R1(cx-w*.4)} ${R1(yy+hh/2)}h${R1(w*.8)}" stroke="#5E4E46" stroke-width="2.4" stroke-dasharray="2 5"/>`)});
  k.add(`<path d="M${R1(cx-w*.2)} ${R1(b)}q${R1(w*.2)} 9 ${R1(w*.4)} 0" fill="#3E3533" stroke="${C.ink}" stroke-width="1"/>`);
  if(k.env.lit)jpGlow(k,cx,y0+h/2,w*1.1,.7)}
function kaminarimon(k,cx,gy){const W=VERM;
  // through the gate: the Nakamise street running back to the far gate
  {const vy=gy-118;k.fill([[cx-64,gy],[cx-64,gy-190],[cx+64,gy-190],[cx+64,gy]],'#EFE6D8',{dx:0,dy:0,sc:0});
    templeRoof(k,cx,vy-46,40,20,{w:1.2});k.shape(RC(cx-28,vy-30,56,30),W,{w:1.2,one:1});k.shape(RC(cx-10,vy-20,20,20),'#3E3533',{w:1,one:1});
    [-1,1].forEach(sg=>{for(let i=0;i<3;i++){const x0=cx+sg*(18+i*14),x1=cx+sg*(32+i*14),y=vy+i*22,h=18+i*6;k.shape([[x0,y],[x1,y+6],[x1,y+h+12],[x0,y+h]],i%2?'#F6E3C6':'#F3D7B8',{w:1,one:1});k.shape([[x0,y-6],[x1+sg*3,y],[x1,y+6],[x0,y]],VERM,{w:1,one:1})}});
    k.fill([[cx-30,gy],[cx-6,vy],[cx+6,vy],[cx+30,gy]],'#DCD3C6',{dx:0,dy:0,sc:0})}
  // the side bays (the wind and thunder guardians behind wooden grilles)
  [-1,1].forEach(sg=>{const x0=sg<0?cx-120:cx+64,w=56;k.shape(RC(x0,gy-170,w,170),'#4A3A36',{w:1.5,one:1});k.shape(E(x0+w/2,gy-112,14,18,10),sg<0?'#8FB8D8':'#E8664F',{w:1,one:1,op:.75});
    let g='';for(let x=x0+6;x<x0+w;x+=8)g+=`M${x} ${gy-166}V${gy-60}`;k.add(`<path d="${g}" stroke="#C49A6C" stroke-width="2.2"/>`);k.shape(RC(x0,gy-60,w,60),'#6E5246',{w:1.2,one:1})});
  // the pillars, the tie beam, the bracket band
  [cx-126,cx-70,cx+58,cx+114].forEach(x=>k.shape(RC(x,gy-196,12,196),W,{w:1.6,one:1,hatch:{side:.6,gap:3,col:VERMD,op:.5}}));
  [cx-132,cx-76,cx+52,cx+108].forEach(x=>k.shape(RC(x,gy-12,24,12),'#9A9188',{w:1.2,one:1}));
  k.shape(RC(cx-140,gy-208,280,16),W,{w:1.7,one:1,hatch:{side:.7,gap:3,col:VERMD,op:.5}});
  k.shape(RC(cx-150,gy-226,300,18),'#5E4E46',{w:1.5,one:1});let bk='';for(let x=cx-144;x<cx+146;x+=14)bk+=`M${x} ${gy-224}h7v13h-7Z`;k.add(`<path d="${bk}" fill="#C9A55E" opacity=".75"/>`);
  templeRoof(k,cx,gy-276,184,62);
  lightningLantern(k,cx,gy-186,96,120)}
// the Nakamise stall: a tiled roof, an indigo noren, trays of sweet potato chews and rice crackers, a red paper lantern
function nakamiseStall(k,x0,x1,gy,o={}){const w=x1-x0,top=gy-130;k.shape(RC(x0+4,top+30,w-8,gy-top-30),'#F6E3C6',{w:1.6,one:1,hatch:{side:.8,gap:4,col:'#E0C49C',op:.5}});
  k.shape(RC(x0+10,top+50,w-20,46),'#5E4E46',{w:1.2,one:1});if(k.env.lit)k.add(`<rect x="${x0+11}" y="${top+51}" width="${w-22}" height="44" fill="${rgbL}" opacity="${R1(.75*k.env.lit)}"/>`);
  {const p=[[x0-8,top+34],[x0+6,top+6],[x1-6,top+6],[x1+8,top+34]];k.shape(p,TILE,{w:1.6,one:1,hatch:{side:.55,gap:3,col:TILED,op:.55}});k.shape(RC(x0-8,top+32,w+16,6),VERM,{w:1.2,one:1});if(k.env.snow)k.side(()=>capLine(k,p.slice(0,4),5))}
  jpNoren(k,x0+12,x1-12,top+40,24,o.n||3);
  k.shape(RC(x0,gy-46,w,46),C.wood,{w:1.7,one:1,hatch:{side:.72,gap:4,col:C.woodD,op:.45}});
  // trays: sweet potato chews on the left, rice crackers on the right
  const ty=gy-50;k.shape(RC(x0+10,ty-6,w*.42,7),'#E0C49C',{w:1.1,one:1});k.shape(RC(x0+w*.52,ty-6,w*.42,7),'#E0C49C',{w:1.1,one:1});
  let sp='';for(let i=0;i<5;i++){const x=x0+18+i*(w*.38/5);sp+=`<path d="M${R1(x-5)} ${R1(ty-6)}q5 -9 12 -2q-5 5 -12 2z" fill="#E9C46A" stroke="#8C3F5A" stroke-width="1.6"/>`}k.add(sp);
  let cr='';for(let i=0;i<5;i++){const x=x0+w*.56+i*(w*.36/5)+4;cr+=`<ellipse cx="${R1(x)}" cy="${R1(ty-9)}" rx="6.4" ry="3.6" fill="#E7C08A" stroke="${C.ink}" stroke-width=".9"/><path d="M${R1(x-3)} ${R1(ty-10)}l1 1M${R1(x+2)} ${R1(ty-9)}l1 1" stroke="#B9874E" stroke-width="1"/>`}k.add(cr);
  nyChochin(k,x1-8,top+38,.9)}
// the omikuji stand: a cabinet of little drawers, the shaker on top, a rack of tied paper fortunes beside it, a small roof
function omikuji(k,x,gy){const w=56,h=78,t=gy-h-6;k.shape(RC(x-w/2,t,w,h),'#C49A6C',{w:1.6,one:1,hatch:{side:.7,gap:3.2,col:'#9C7550',op:.45}});
  let d='',kn='';for(let r=0;r<5;r++)for(let c=0;c<4;c++){const dx=x-w/2+4+c*12.4,dy=t+4+r*14;d+=`M${R1(dx)} ${R1(dy)}h10.4v12h-10.4Z`;kn+=`M${R1(dx+5.2)} ${R1(dy+6)}h.1`}k.add(`<path d="${d}" fill="#E0BF94" stroke="${C.ink}" stroke-width=".7"/><path d="${kn}" stroke="${C.ink}" stroke-width="2.2" stroke-linecap="round"/>`);
  k.shape(RC(x-w/2-3,gy-6,w+6,6),'#9C7550',{w:1.2,one:1});
  // the six-sided shaker with a stick poking out
  k.shape([[x-8,t-2],[x-10,t-26],[x-4,t-32],[x+4,t-32],[x+10,t-26],[x+8,t-2]],'#E04A3C',{w:1.3,one:1,hatch:{side:.6,gap:2.6,col:'#B5322A',op:.5}});k.line([[x+1,t-32],[x+3,t-44]],2,'#E7C08A');
  const rf=[[x-w/2-12,t-34],[x,t-52],[x+w/2+12,t-34],[x+w/2+8,t-30],[x-w/2-8,t-30]];k.shape(rf,TILE,{w:1.4,one:1,hatch:{side:.6,gap:3,col:TILED,op:.5}});[x-w/2-4,x+w/2-2].forEach(px=>k.shape(RC(px,t-32,6,32),VERM,{w:1.1,one:1}));
  // the rack of tied fortunes
  const rx=x+w/2+10;[rx,rx+30].forEach(px=>k.shape(RC(px,gy-70,4,70),C.woodD,{w:1.1,one:1}));let kt='';[gy-62,gy-48,gy-34].forEach(y=>{k.line([[rx,y],[rx+34,y]],1.1,C.ink,{op:.8});for(let px=rx+5;px<rx+32;px+=6)kt+=`<path d="M${R1(px-2.4)} ${R1(y-3)}h4.8l-1 6h-2.8z" fill="#FFFFFF" stroke="${C.ink}" stroke-width=".7"/>`});k.add(kt);
  if(k.env.snow)k.side(()=>capLine(k,rf.slice(0,3),4))}
// the five-storey pagoda far behind on the right
function pagoda(k,x,gy,s=1){for(let i=0;i<5;i++){const y=gy-i*34*s,hw=(46-i*4.6)*s;k.shape(RC(x-hw*.42,y-20*s,hw*.84,20*s),VERM,{w:1.3,one:1,hatch:{side:.6,gap:3,col:VERMD,op:.45}});
    k.add(`<path d="M${R1(x-hw*.2)} ${R1(y-16*s)}v${R1(12*s)}M${R1(x)} ${R1(y-16*s)}v${R1(12*s)}M${R1(x+hw*.2)} ${R1(y-16*s)}v${R1(12*s)}" stroke="#FFFBF3" stroke-width="${R1(1.6*s)}" opacity=".7"/>`);templeRoof(k,x,y-33*s,hw,22*s,{w:1.3})}
  k.line([[x,gy-170*s],[x,gy-226*s]],2.4,'#C9A55E');let r='';for(let y=gy-180*s;y>gy-222*s;y-=6*s)r+=`M${R1(x-4*s)} ${R1(y)}h${R1(8*s)}`;k.add(`<path d="${r}" stroke="#C9A55E" stroke-width="2"/>`)}
// a city pigeon pecking about (grey with a green-violet neck), facing left (f 1) or right (f -1)
function pigeon(k,x,gy,s=1,f=1){const X=v=>x+v*s*f;k.shape([[X(12),gy-8*s],[X(-4),gy-16*s],[X(-12),gy-12*s],[X(-10),gy-6*s],[X(4),gy-4*s],[X(18),gy-6*s]],'#B9BEC8',{w:1.2,one:1,hatch:{side:.6,gap:2.6,col:'#8E95A3',op:.5}});
  k.shape(E(X(-11),gy-18*s,4.6*s,4.4*s,10),'#A8AEBA',{w:1.1,one:1});k.add(`<path d="M${R1(X(-8))} ${R1(gy-15*s)}q${R1(3*s*f)} ${R1(3*s)} ${R1(6*s*f)} ${R1(3*s)}" stroke="#8FB59A" stroke-width="${R1(2.4*s)}" fill="none" opacity=".8"/><path d="M${R1(X(-15))} ${R1(gy-18.6*s)}l${R1(-3.4*s*f)} ${R1(1.2*s)} ${R1(3.4*s*f)} ${R1(1*s)}z" fill="#E8B48A"/><circle cx="${R1(X(-12))}" cy="${R1(gy-19.4*s)}" r="${R1(.9*s)}" fill="${C.ink}"/><path d="M${R1(X(-1))} ${R1(gy-4*s)}v${R1(4*s)}M${R1(X(3))} ${R1(gy-4*s)}v${R1(4*s)}" stroke="#E8908A" stroke-width="${R1(1.4*s)}" stroke-linecap="round"/><path d="M${R1(X(2))} ${R1(gy-11*s)}q${R1(6*s*f)} ${R1(-2*s)} ${R1(12*s*f)} ${R1(2*s)}" stroke="#8E95A3" stroke-width="1" fill="none"/>`)}
function tkAsakusa(k){const e=k.env;HZ=Object.values(HOTS.asakusa).map(([x,y,w,h])=>[x,y,x+w,y+h]);
  k.skyD(()=>{skyBand(k,1000,420);O.sun(k,820,70,26);O.cloud(k,250,64,20);O.cloud(k,640,40,16);O.bird(k,330,120,7);O.bird(k,350,130,5)},
    {W:1000,H:420,sun:[820,70,26],low:[770,170,28],moon:[820,70,22],clouds:[[250,64,20],[640,40,16],[100,120,14]],rainC:[[420,40,26],[760,60,24],[960,100,20]],birds:[[330,120,7],[350,130,5]],stars:44});
  // the tall thin tower far away on the left, and the city
  {const x=70,gy=330;k.shape([[x-14,gy],[x-4,gy-240],[x+4,gy-240],[x+14,gy]],'#E6EAF0',{w:1.2,lcol:C.graph,one:1});let d='';for(let y=gy-20;y>gy-230;y-=16)d+=`M${R1(x-12+(gy-y)*.04)} ${y}L${R1(x+12-(gy-y)*.04)} ${y-14}`;k.add(`<path d="${d}" stroke="${C.graph}" stroke-width=".8" opacity=".6"/>`);
    k.shape(E(x,gy-180,12,6,10),'#E6EAF0',{w:1,lcol:C.graph,one:1});k.shape(E(x,gy-130,14,7,10),'#E6EAF0',{w:1,lcol:C.graph,one:1});k.line([[x,gy-240],[x,gy-290]],1.6,C.graph);if(e.lit)k.fx(()=>{litDot(k,x,gy-180);litDot(k,x,gy-130);litDot(k,x,gy-288)})}
  farCity(k,[[110,70,90],[190,50,60],[880,60,80],[946,60,110]],330,'#E6E2EE','#C9C3D8');
  pagoda(k,900,320,.9);
  // the temple grounds' trees
  sakura(k,960,428,1);sakura(k,28,424,.85);
  // Nakamise stalls receding on the far left (decor), with paper lanterns
  [[-40,60,410],[52,140,416]].forEach(([a,b,gy])=>{const p=[[a-6,gy-104],[a+6,gy-128],[b-6,gy-128],[b+6,gy-104]];k.shape(RC(a,gy-104,b-a,104),'#F3D7B8',{w:1.4,one:1});k.shape(p,TILE,{w:1.4,one:1,hatch:{side:.55,gap:3,col:TILED,op:.5}});k.shape(RC(a+6,gy-80,b-a-12,36),'#5E4E46',{w:1.1,one:1});if(e.lit)k.add(`<rect x="${a+7}" y="${gy-79}" width="${b-a-14}" height="34" fill="${rgbL}" opacity="${R1(.7*e.lit)}"/>`);jpNoren(k,a+8,b-8,gy-98,18,2)});
  // the stone paving
  k.fill(RC(-10,422,1020,180),'#E3DDD3',{dx:0,dy:0,sc:0});{let d='';for(let y=440,r=0;y<600;y+=24+r*4,r++)d+=`M0 ${y}H1000`;for(let r=0,y=422;r<7;r++){const h=24+r*4;for(let x=(r%2)*40;x<1000;x+=80+r*8)d+=`M${R1(x)} ${y}v${h}`;y+=h}k.add(`<path d="${d}" stroke="#C7BCAE" stroke-width="1.3"/>`)}
  k.line([[-10,424],[1010,424]],1.8,C.ink,{op:.8});
  kaminarimon(k,500,428);
  // two stone lanterns at the gate
  jpToro(k,352,434,.7);
  pigeon(k,92,566,1,1);pigeon(k,128,580,.9,-1);pigeon(k,908,552,.9,-1);
  k.fx(()=>hubFx(k,{sheen:[430,598],puddles:[[320,570,46,9],[720,580,40,8],[100,520,34,7]],patches:[[320,570,72,12],[720,580,60,10],[100,520,50,8],[900,470,46,8],[520,440,56,7]]}));
  k.ss(()=>seasonGround(k,[0,430,1000,598],80,HZ,0,1));
  hotAt(k,'asakusa','nakamise','Nakamise snacks',()=>nakamiseStall(k,162,320,440,{n:3}));
  hot(k,'data-hot','lantern','Kaminarimon lantern',RC(...HOTS.asakusa.lantern),'');// the lantern is drawn with the gate: this is its hit shape and outline
  hotAt(k,'asakusa','stamp','Station stamp',()=>ekiStand(k,588,444,.95,VERM));
  hotAt(k,'asakusa','omikuji','Omikuji fortunes',()=>omikuji(k,662,444));
  hotAt(k,'asakusa','souvenir','Souvenir stand',()=>kiosk(k,756,840,446,[VERM,'#FFFFFF'],[[VERM,'lantern'],['#E8664F','lantern'],['#F7D24E','']],{cat:1}));
  k.ss(()=>{seasonDrift(k,[[260,300,1],[200,250,.85],[760,250,.9]]);if(k.so==='winter'&&!e.night)robin(k,214,442,1,1)});
  k.hw(()=>{hwJack(k,640,446,.65);hwJack(k,360,444,.6);hwGhost(k,960,300,.7,14);hwLanternString(k,170,300,316,300,10,4,.7)});
  k.lt(()=>{ltString(k,sagP(160,310,322,310,10,12),20);ltString(k,sagP(742,316,850,316,8,10),20);ltString(k,sagP(880,330,1000,320,12,10),20)});
  k.ny(()=>{nyKado(k,348,446,.9,-1);nyKado(k,652,446,.9,1);nyShime(k,500,232,1);nyChochins(k,-10,300,150,300,10,4,.8)});
  O.tape(k,6,24,90,-24,'#F7B9C6');O.tape(k,930,568,80,-26,'#BDE7D2')}

/* ---------- the Shinkansen ride: the white-and-blue car inside, six windows, the land running past ---------- */
const SK_WIN=(()=>{const w=104,h=150,y=148,gap=16,x0=500-(6*w+5*gap)/2;return Array.from({length:6},(_,i)=>{const x=x0+i*(w+gap);return {x,y,w,h,head:{x:R1(x+(w-90)/2),y:y+h-80,w:90,h:90}}})})();
const SK_NEAR=3000,SK_FAR=800;// how far the near and far layers travel in the ride
// rice paddies by season (flooded and shining in spring, green rows in summer, gold in autumn, straw stubble in winter)
function skField(k,x0,x1,y0,y1){const so=k.env.season,sn=k.env.snow,c=sn?['#FFFFFF','#DCE4EC']:so==='spring'?['#BFDDE6','#9CCB80']:so==='autumn'?['#F2D17A','#D9AE4E']:so==='winter'?['#D9C9A8','#B9A27A']:['#B8DC8E','#8EBF6A'];
  k.fill(RC(x0,y0,x1-x0,y1-y0),c[0],{dx:0,dy:0,sc:0});let d='';for(let y=y0+4;y<y1;y+=5)d+=`M${x0} ${R1(y)}H${x1}`;let b='';for(let x=x0+60+k.r()*40;x<x1;x+=90+k.r()*60)b+=`M${R1(x)} ${y0}l-10 ${y1-y0}`;
  k.add(`<path d="${d}" stroke="${c[1]}" stroke-width="1.6" stroke-dasharray="3 3" opacity=".8"/><path d="${b}" stroke="${C.ink}" stroke-width="1" opacity=".45"/>`)}
function skHouse(k,x,gy,s,col,roof){const p=RC(x-12*s,gy-16*s,24*s,16*s);k.fill(p,col,{dx:0,dy:0});k.pen(p,true,{w:1.1,one:1,amp:.3});const r=[[x-15*s,gy-15*s],[x,gy-26*s],[x+15*s,gy-15*s]];k.fill(r,roof,{dx:0,dy:0});k.pen(r,true,{w:1.1,one:1,amp:.3});
  if(k.env.snow)k.add(`<path d="M${R1(x-14*s)} ${R1(gy-16*s)}L${R1(x)} ${R1(gy-25*s)}L${R1(x+14*s)} ${R1(gy-16*s)}" stroke="#FFFFFF" stroke-width="${R1(3*s)}" fill="none" stroke-linecap="round"/>`);
  return [x-4*s,gy-12*s]}
function skTree(k,x,gy,s){const so=k.env.season,c=so==='autumn'?'#E8A86A':so==='winter'?'#C9BBA8':so==='spring'&&x%3<1?'#F7C6D3':'#9ACD7C';k.add(`<path d="M${R1(x)} ${R1(gy)}v${R1(-8*s)}" stroke="${C.trunkD}" stroke-width="2"/>`);
  k.shape(E(x,gy-14*s,9*s,8*s,9),c,{w:1.1,one:1})}
function tkShinkansen(k,o){const e=k.env,W=SK_WIN,wy=W[0].y,wh=W[0].h,hz=wy+96;
  // the car is lit inside at every hour: only the view through the windows takes the time and weather colouring
  const rc=k.rc;k.rc=null;
  // the car: ceiling, luggage racks, the wall, the blue stripe, the floor and seats
  k.fill(RC(0,0,1000,600),'#F4F1EA',{dx:0,dy:0,sc:0});
  k.fill(RC(0,0,1000,70),'#E6E3DC',{dx:0,dy:0,sc:0});k.line([[0,70],[1000,70]],1.6,C.graph);
  [200,500,800].forEach(x=>{const sh=[[x-70,24],[x+70,24],[x+66,38],[x-66,38]];k.shape(sh,'#FFFDF6',{w:1.4,one:1});if(e.lit)k.lamps.push({x,y:31,s:.7,glass:sh})});
  // the luggage rack with a bag and a little travel case
  k.shape(RC(0,92,1000,8),'#C9CED6',{w:1.4,one:1});let rk='';for(let x=10;x<1000;x+=22)rk+=`M${x} 100v-8`;k.add(`<path d="${rk}" stroke="#9AA3AE" stroke-width="1"/>`);
  k.shape([[150,92],[150,66],[164,58],[214,58],[226,66],[226,92]],'#F2B27A',{w:1.5,one:1,hatch:{side:.6,gap:3,col:'#D9894E',op:.5}});k.add(`<path d="M170 58q18 -16 36 0" fill="none" stroke="${C.ink}" stroke-width="2.4"/>`);
  k.shape(RC(640,60,70,32),'#B9D3F2',{w:1.5,one:1,hatch:{side:.7,gap:3,col:'#8FAFD6',op:.5}});k.shape(RC(666,54,18,6),C.ink,{noline:1,dx:0,dy:0});O.heart(k,676,76,6);
  // the window band: the land outside, clipped to the six windows
  const cid=uid();k.defs.push(`<clipPath id="${cid}">${W.map(w=>`<rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" rx="16"/>`).join('')}</clipPath>`);
  const wb0=k.out.length;k.add(`<g clip-path="url(#${cid})">`);
  k.add(`<rect x="0" y="${wy}" width="1000" height="${wh}" fill="${skyGrad(k,wy,wy+wh)}"/>`);
  if(e.night&&(e.sunny||e.weather==='cloudy'))k.fx(()=>{const st=k.cap(()=>stars(k,1000,0,90,e.sunny?40:12,false));k.add(`<g transform="translate(0 ${wy})">${st}</g>`)});
  else if(!e.night&&e.sunny)O.sun(k,820,wy+34,16,e.time==='dawn'?'#FDD68E':e.time==='dusk'?'#F9AE6E':C.sun);
  if(e.night&&!e.rain)moon(k,820,wy+30,13,!e.sunny);
  const dir=o.dir==='home'?'home':'out',still=o.still===true,an=n=>still?'':` class="pa-wd-run pa-wd-${n}${dir==='home'?' pa-wd-back':''}"`,mid=n=>still?` transform="translate(${n==='far'?-SK_FAR/2:-SK_NEAR/2} 0)"`:'';
  // the far layer: hills, Mt. Fuji (passing the middle windows halfway through), clouds
  k.add(`<g${an('far')}${mid('far')}>`);
  {const cc=cloudCols(e);[[120,wy+30,13],[520,wy+20,11],[1300,wy+26,12],[1640,wy+22,10]].forEach(([x,y,s])=>{if(!e.rain)cloudV(k,x,y,s,cc)});
    k.own(rng(0x46554a4a),()=>jpFujiDraw(k,{cx:SK_WIN[2].x+SK_WIN[2].w/2+SK_FAR/2,by:hz+4,w:250}));
    const hl=[];for(let x=-20;x<=1960;x+=40)hl.push([x,hz-8-12*Math.sin(x/170)-6*Math.sin(x/53)]);hl.push([1960,hz+10],[-20,hz+10]);
    k.fill(hl,e.ssn==='autumn'?'#D9D2A6':e.snow?'#EEF2F4':'#C6DBC4',{dx:0,dy:0,sc:0});k.pen(hl.slice(0,-2),false,{w:1.2,col:C.graph,step:20})}
  k.add('</g>');
  // the near layer: home town, fields, a river with a bridge, tea rows, then Tokyo's towers at the end
  k.add(`<g${an('near')}${mid('near')}>`);
  {const L=SK_NEAR+1000,y0=hz,lit=[];k.fill(RC(-10,y0,L+20,wy+wh-y0+4),e.snow?'#F4F6F8':k.env.season==='autumn'?'#E3CF8E':'#C3DFA5',{dx:0,dy:0,sc:0});
    // fields across the middle of the run
    skField(k,900,2100,y0+10,wy+wh);skField(k,2300,3050,y0+12,wy+wh);
    // the river and its bridge (around 2200)
    k.fill([[2120,y0],[2200,y0],[2260,wy+wh],[2160,wy+wh]],C.water,{dx:0,dy:0});let rp='';for(let i=0;i<6;i++)rp+=`M${2150+i*14} ${y0+8+i*8}q4 -3 8 0`;k.add(`<path d="${rp}" fill="none" stroke="#86BDDE" stroke-width="1.4"/>`);
    // tea rows by the hills (rounded green hedges)
    let tr='';for(let i=0;i<8;i++){const y=y0+14+i*6;tr+=`M${2310+i*4} ${y}q30 -6 60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0t60 0`}k.add(`<path d="${tr}" fill="none" stroke="${e.snow?'#DCE4EC':'#7FB86A'}" stroke-width="4" stroke-linecap="round" opacity=".7"/>`);
    // home town at the start and the small towns between
    const pal=[['#FCE6CC',C.roof],['#F9D9DE',C.lav],['#D9E9F7','#9AA7B8'],['#DDEFD8',C.redD],['#FFF3DC',C.orange]];
    [[20,880,1],[1300,1500,.85],[3100,3250,.9]].forEach(([a,b,s])=>{for(let x=a;x<b;x+=34+k.r()*20){const c=pal[Math.floor(k.r()*5)],gy=y0+16+k.r()*30;if(k.r()<.7)lit.push(skHouse(k,x,gy,s,c[0],c[1]));else skTree(k,x,gy,s)}});
    for(let x=950;x<2100;x+=110+k.r()*80)skTree(k,x,y0+8+k.r()*6,.8);
    // Tokyo at the end of the run: towers
    for(let x=3260;x<L;x+=46+k.r()*20){const h=40+k.r()*70,w=30+k.r()*16,col=['#E6E2EE','#E1E8EF','#EFE3CF','#F2E2E6'][Math.floor(k.r()*4)];k.fill(RC(x,y0+30-h,w,h),col,{dx:0,dy:0});k.pen(RC(x,y0+30-h,w,h),true,{w:1.1,one:1,amp:.4});
      let d='';for(let yy=y0+36-h;yy<y0+24;yy+=9)for(let xx=x+4;xx<x+w-5;xx+=8){d+=`M${R1(xx)} ${R1(yy)}h3.4`;if(k.r()<.4)lit.push([xx,yy-1])}k.add(`<path d="${d}" stroke="#AFC0D0" stroke-width="2.4" opacity=".8"/>`)}
    // the overhead line poles running past
    let pl='';for(let x=60;x<L;x+=240)pl+=`M${x} ${wy-4}V${wy+wh+4}M${x-18} ${wy+18}h36`;k.add(`<path d="${pl}" stroke="#8E867C" stroke-width="4"/><path d="M-10 ${wy+18}H${L+10}" stroke="${C.ink}" stroke-width="1" opacity=".55"/>`);
    // season touches: a line of cherry trees by the river in spring
    if(e.ssn==='spring')for(let x=2040;x<2320;x+=40)k.own(rng(x),()=>jpPuffs(k,x,y0+2,16,11,'#F9D3DE','#E9A2B8',1));
    if(e.lit){let d='';lit.forEach(([x,y])=>{d+=`<rect x="${R1(x)}" y="${R1(y)}" width="4" height="3.6" fill="${rgbL}"/>`});k.add(`<g opacity="${R1(.95*e.lit)}">${d}</g>`)}}
  k.add('</g>');
  // the light outside: dawn pink, dusk violet, night navy (over the land, under the glass)
  const tint=e.night?['#1E2954',.38]:e.time==='dusk'?['#8C6BB0',.16]:e.time==='dawn'?['#F2A6A6',.1]:null;if(tint)k.add(`<rect x="0" y="${wy}" width="1000" height="${wh}" fill="${tint[0]}" opacity="${tint[1]}"/>`);
  if(e.rain)k.fx(()=>{let d='';for(let i=0;i<70;i++){const x=W[i%6].x+k.r()*W[0].w,y=wy+k.r()*wh,l=10+k.r()*16;d+=`M${R1(x)} ${R1(y)}l${R1(-l)} ${R1(l*.3)}`}k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`)});
  if(e.snow)k.fx(()=>{let d='';for(let i=0;i<60;i++){const x=W[i%6].x+k.r()*W[0].w,y=wy+k.r()*wh;d+=`M${R1(x)} ${R1(y)}l-8 2`}k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".9"/>`)});
  // the dogs' heads, one per window (the game fills these in)
  W.forEach((w,i)=>k.add(`<!--pwd-head-${i}-->`));
  k.add('</g>');
  if(rc){const wb=k.out.splice(wb0).join('');k.add(wb.replace(HEXRE,rc))}
  // glass glare, the frames, the pull-down blinds, the sills
  W.forEach(w=>{k.add(`<path d="M${w.x+14} ${w.y+wh-26}l40 -60M${w.x+30} ${w.y+wh-18}l22 -32" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".35"/>`);
    k.add(`<rect x="${w.x}" y="${w.y}" width="${w.w}" height="${w.h}" rx="16" fill="none" stroke="#DCDFE4" stroke-width="9"/>`);k.pen(RC(w.x-5,w.y-5,w.w+10,w.h+10),true,{w:1.6,one:1});k.pen(RC(w.x+4,w.y+4,w.w-8,w.h-8),true,{w:1,one:1,col:C.graph});
    k.shape(RC(w.x+2,w.y-14,w.w-4,16),'#EDE6D6',{w:1.3,one:1});let b='';for(let x=w.x+8;x<w.x+w.w-4;x+=8)b+=`M${x} ${w.y-12}v12`;k.add(`<path d="${b}" stroke="#C9C0AE" stroke-width="1"/>`);
    k.shape(RC(w.x-8,w.y+w.h+2,w.w+16,10),'#E6E3DC',{w:1.4,one:1})});
  // the blue stripe under the windows, the wall below
  k.shape(RC(-10,332,1020,14),'#4E7FC4',{w:1.6,one:1});k.add(`<rect x="0" y="350" width="1000" height="4" fill="#4E7FC4"/>`);
  // the end of the car: the door with its little sign on the left, the coat hook on the right
  k.shape(RC(16,118,104,220),'#E6E3DC',{w:1.5,one:1});k.shape(RC(36,140,64,70),'#DCEAF4',{w:1.2,one:1});k.shape(RC(30,96,76,16),'#3E3533',{w:1.2,one:1});k.add(`<path d="M40 104h22" stroke="#F7D24E" stroke-width="3" stroke-dasharray="6 3"/><path d="M70 104h26" stroke="#9CCB80" stroke-width="3"/>`);
  k.line([[930,150],[930,170],[942,176]],2.4,C.graph);
  // seat backs in front (blue covers with white headrests)
  [[150,'#5B86C9'],[330,'#5B86C9'],[500,'#5B86C9'],[670,'#5B86C9'],[850,'#5B86C9']].forEach(([x])=>{const p=[[x-74,600],[x-80,470],[x-70,420],[x+70,420],[x+80,470],[x+74,600]];k.shape(p,'#5B86C9',{w:2,one:1,hatch:{side:.6,gap:4.2,col:'#3F679F',op:.5}});
    k.shape([[x-60,424],[x+60,424],[x+56,462],[x-56,462]],'#FFFFFF',{w:1.5,one:1});k.line([[x-40,500],[x+40,500]],1.2,'#3F679F',{op:.7})});
  // a window ticket on the back of a seat, the ride's little paw tag
  k.shape(RC(476,520,48,26),'#FFF6E6',{w:1.2,one:1});k.add(`<path d="${pawD(500,532,.8)}" fill="${C.pink}"/>`);
  O.tape(k,6,24,90,-24,'#F7B9C6');O.tape(k,930,568,80,-26,'#BDE7D2')}

/* ---------- the Japan map: Tokyo in the middle, the bay, the Yamanote loop, Mt. Fuji far left ---------- */
const JM_AREAS={shibuya:{label:'Shibuya Crossing',bond:3,x:640,y:560},yoyogi:{label:'Yoyogi Park Dog Run',bond:3,x:540,y:300},asakusa:{label:'Asakusa and Sensō-ji',bond:4,x:1330,y:200},
  ueno:{label:'Ueno Park',bond:4,x:1050,y:170},tokyotower:{label:'Tokyo Tower',bond:5,x:900,y:690},odaiba:{label:'Odaiba Seaside',bond:6,x:1300,y:800},station:{label:'Tokyo Station',bond:1,x:1180,y:450}};
const JM_STAMP={shibuya:'shibuya',hachiko:'shibuya',yoyogi:'yoyogi',asakusa:'asakusa',ueno:'ueno',tokyotower:'tokyotower',odaiba:'odaiba'};
PA.JAPAN_AREAS=Object.keys(JM_AREAS).map(id=>({id,x:JM_AREAS[id].x,y:JM_AREAS[id].y}));
const JM_LOOP=(()=>{const P=[];for(let i=0;i<40;i++){const a=i/40*Math.PI*2;P.push([860+Math.cos(a)*320+Math.sin(a*2)*16,420+Math.sin(a)*230])}return P})();
const JM_COAST=[[700,1020],[760,940],[860,880],[980,860],[1090,800],[1180,740],[1290,700],[1400,690],[1500,720],[1620,700]];
const JM_RAIL=[[-20,906],[220,888],[460,862],[700,842],[900,830],[1030,800],[1100,690],[1140,580],[1176,500]];// the Shinkansen line from the west into Tokyo Station
// the Sumida river: east of Asakusa (Sensō-ji is on its west bank) and of Tokyo Station, down into the bay east of Odaiba's beach
const JM_RIVER=[[1424,-20],[1442,100],[1462,220],[1490,330],[1484,460],[1446,580],[1404,694]];
const JM_TITLE=[210,300];// the "Tokyo" title: clear of the place chip (top left) and of the phone's top bar
// a place pin or its label (a box round the text under the pin), or the title
const jmIn=(x,y,pad=0)=>Object.keys(JM_AREAS).some(id=>{const a=JM_AREAS[id];return((x-a.x)/(150+pad))**2+((y-a.y-14)/(124+pad))**2<1||(Math.abs(x-a.x)<160&&y>a.y+60&&y<a.y+140)})||(Math.abs(x-JM_TITLE[0])<150&&y>JM_TITLE[1]-80&&y<JM_TITLE[1]+40);
const JM_ICON={
  shibuya(k,x,y){k.shape(RC(x-70,y+8,140,44),'#D6D2CC',{w:1.6,one:1});let d='';for(let i=0;i<8;i++)d+=`M${x-62+i*17} ${y+14}h9v32h-9Z`;k.add(`<path d="${d}" fill="#FFFFFF" stroke="${C.ink}" stroke-width=".8"/>`);
    k.shape(RC(x-50,y-56,60,60),'#E9E4DA',{w:1.6,one:1});k.shape(RC(x-44,y-50,48,26),'#BFE3F7',{w:1.2,one:1});O.heart(k,x-20,y-38,7);k.shape(RC(x+18,y-30,34,34),'#D9D3C9',{w:1.4,one:1});
    k.shape([[x+22,y-30],[x+24,y-48],[x+30,y-56],[x+34,y-52],[x+38,y-42],[x+48,y-40],[x+48,y-30]],'#A07B52',{w:1.4,one:1})},
  yoyogi(k,x,y){k.shape(RC(x-78,y-20,156,70),'#CBE5A6',{w:1.6,one:1});k.add(`<rect x="${x-78}" y="${y-20}" width="156" height="70" fill="none" stroke="${C.ink}" stroke-width="2" stroke-dasharray="3 6"/>`);
    k.shape([[x-60,y-24],[x-58,y-76],[x-40,y-100],[x-22,y-76],[x-20,y-24]],'#F7D24E',{w:1.6,one:1,hatch:{side:.55,gap:3.6,col:'#E0A93A',op:.5}});O.tree(k,x+44,y-6,.36,{col:C.leaf2});k.shape(E(x+6,y+28,9,9,10),'#E9F59B',{w:1.4})},
  asakusa(k,x,y){k.shape([[x-80,y-30],[x-60,y-48],[x+60,y-48],[x+80,y-30],[x+70,y-24],[x-70,y-24]],TILE,{w:1.8,one:1,hatch:{side:.55,gap:3.4,col:TILED,op:.5}});
    [x-56,x-30,x+22,x+48].forEach(px=>k.shape(RC(px,y-24,8,72),VERM,{w:1.4,one:1}));k.shape(RC(x-60,y-22,120,8),VERM,{w:1.3,one:1});k.shape(E(x,y+12,15,22,12),VERM,{w:1.6,hatch:{side:.6,gap:3,col:VERMD,op:.5}});
    k.add(`<path d="M${x-13} ${y+4}q13 3 26 0M${x-14} ${y+12}q14 3 28 0M${x-13} ${y+20}q13 3 26 0" fill="none" stroke="${VERMD}" stroke-width="1.2" opacity=".7"/><rect x="${x-11}" y="${y-13}" width="22" height="6" rx="1.5" fill="#3E3533"/><rect x="${x-11}" y="${y+31}" width="22" height="6" rx="1.5" fill="#3E3533"/>`)},
  ueno(k,x,y){k.shape(E(x+14,y+30,64,20,14),C.water,{w:1.6});k.add(`<path d="M${x-20} ${y+28}q6 -4 12 0M${x+30} ${y+34}q6 -4 12 0" fill="none" stroke="#86BDDE" stroke-width="1.6"/>`);
    k.shape(E(x+40,y+26,8,4,10),'#8FC27A',{w:1,one:1});k.shape(RC(x-52,y-6,8,30),'#8A6A5A',{w:1.4,one:1});jpPuffs(k,x-48,y-26,40,26,'#F9D3DE','#E9A2B8',1)},
  tokyotower(k,x,y){const t=y-92;k.shape([[x-34,y+44],[x-6,t],[x+6,t],[x+34,y+44]],'#E8664F',{w:1.7,one:1});let d='';for(let i=1;i<9;i++){const yy=t+i*(y+44-t)/9,hw=6+28*i/9;d+=`M${R1(x-hw)} ${R1(yy)}L${R1(x+hw)} ${R1(yy+8)}M${R1(x+hw)} ${R1(yy)}L${R1(x-hw)} ${R1(yy+8)}`}k.add(`<path d="${d}" stroke="#B5322A" stroke-width="1"/>`);
    [[t+30,'#FFFFFF'],[y+4,'#FFFFFF']].forEach(([yy])=>{const hw=6+28*(yy-t)/(y+44-t);k.shape(RC(x-hw-4,yy,hw*2+8,10),'#FFFFFF',{w:1.3,one:1})});k.line([[x,t],[x,t-18]],2,C.ink)},
  odaiba(k,x,y){k.fill(E(x,y+30,86,24,14),C.sand,{dx:0,dy:0});k.pen(E(x,y+30,86,24,14).slice(8,14),false,{w:1.6});
    k.add(`<path d="M${x-90} ${y-6}Q${x} ${y-80} ${x+90} ${y-6}" fill="none" stroke="${C.ink}" stroke-width="5"/><path d="M${x-90} ${y-6}Q${x} ${y-80} ${x+90} ${y-6}" fill="none" stroke="#F4F6F8" stroke-width="3"/><path d="M${x-96} ${y-6}H${x+96}" stroke="${C.ink}" stroke-width="2"/>`);
    [x-40,x+40].forEach(px=>k.shape(RC(px-5,y-52,10,46),'#F4F6F8',{w:1.3,one:1}));k.line([[x+50,y+44],[x+54,y+4]],2);k.shape([[x+30,y+6],[x+54,y-8],[x+76,y+8]],C.red,{w:1.4,one:1})},
  station(k,x,y){k.shape(RC(x-80,y-24,160,66),'#E8A08A',{w:1.8,one:1,hatch:{side:.7,gap:4,col:'#C97A66',op:.45}});let d='';for(let i=0;i<6;i++)d+=`M${x-70+i*24} ${y-14}h12v16h-12Z`;k.add(`<path d="${d}" fill="#FFFFFF" stroke="${C.ink}" stroke-width=".9"/>`);
    [x-60,x+60].forEach(px=>{const dm=[];for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI;dm.push([px+Math.cos(a)*20,y-24+Math.sin(a)*18])}k.shape(dm,'#6E7480',{w:1.5,one:1})});
    k.shape(RC(x-12,y+12,24,30),'#5E4E46',{w:1.3,one:1});
    k.shape([[x-96,y+54],[x+40,y+54],[x+82,y+50],[x+96,y+42],[x+40,y+36],[x-96,y+36]],'#FFFFFF',{w:1.6,one:1});k.add(`<path d="M${x-96} ${y+48}H${x+70}" stroke="#4E7FC4" stroke-width="3"/>`)}
};
function jmFuji(k,x,by,w){const h=w/2.6,P=[[x-w/2,by],[x-w*.32,by-h*.28],[x-w*.18,by-h*.62],[x-w*.08,by-h*.97],[x-w*.03,by-h],[x+w*.02,by-h*.95],[x+w*.07,by-h*1.01],[x+w*.11,by-h*.93],[x+w*.21,by-h*.6],[x+w*.34,by-h*.26],[x+w/2,by]];
  k.shape(P,'#AFC3D6',{w:1.9,lcol:'#7D8FA6',hatch:{side:.05,gap:4.4,col:'#8EA2B8',op:.55}});
  const cap=[[x-w*.105,by-h*.86],[x-w*.08,by-h*.97],[x-w*.03,by-h],[x+w*.02,by-h*.95],[x+w*.07,by-h*1.01],[x+w*.11,by-h*.93],[x+w*.15,by-h*.8],[x+w*.12,by-h*.7],[x+w*.08,by-h*.78],[x+w*.05,by-h*.62],[x+w*.01,by-h*.74],[x-w*.03,by-h*.6],[x-w*.06,by-h*.76],[x-w*.1,by-h*.66]];
  k.shape(cap,'#FFFFFF',{w:1.4,lcol:'#7D8FA6',one:1})}
function jmHouse(k,x,y,s,wall,roof){k.add(`<path d="M${R1(x-13*s)} ${R1(y-10*s)}h${R1(26*s)}v${R1(20*s)}h${R1(-26*s)}Z" fill="${wall}" stroke="${C.ink}" stroke-width="1.4" stroke-linejoin="round"/><path d="M${R1(x-16*s)} ${R1(y-9*s)}L${R1(x)} ${R1(y-24*s)}L${R1(x+16*s)} ${R1(y-9*s)}Z" fill="${roof}" stroke="${C.ink}" stroke-width="1.4" stroke-linejoin="round"/>`)}
function jmTower(k,x,y,s,col){const h=(26+k.r()*24)*s;k.add(`<path d="M${R1(x-9*s)} ${R1(y+8*s)}V${R1(y+8*s-h)}h${R1(18*s)}V${R1(y+8*s)}Z" fill="${col}" stroke="${C.ink}" stroke-width="1.4" stroke-linejoin="round"/><path d="M${R1(x-4*s)} ${R1(y+8*s-h+6*s)}V${R1(y+2*s)}M${R1(x+4*s)} ${R1(y+8*s-h+6*s)}V${R1(y+2*s)}" stroke="#AFC0D0" stroke-width="2" stroke-dasharray="3 3"/>`)}
function tkJapanMap(k,o){const lk=o.locked,locked=new Set(Array.isArray(lk)?lk:[]),bonds=o.bonds&&typeof o.bonds==='object'?o.bonds:{},
    st=o.stamps,got=new Set(Array.isArray(st)?st:st&&typeof st==='object'?Object.keys(st).filter(s=>st[s]):[]);
  k.add(`<rect width="1600" height="1000" fill="#FDF3DF" fill-opacity=".55"/>`);
  // the mountains in the west and Mt. Fuji
  const h1=[[0,420],[120,380],[260,430],[380,470],[420,560],[380,700],[300,800],[180,860],[0,880]];k.fill(h1,'#DCEDC4',{dx:0,dy:0,sc:0});k.pen(h1.slice(1,8),false,{w:1.6,col:C.graph});
  jmFuji(k,190,620,300);
  [[60,700],[120,740],[300,690],[250,760],[80,800],[340,600]].forEach(([x,y])=>{k.add(`<path d="M${x} ${y+6}v6" stroke="${C.trunkD}" stroke-width="2"/>`);k.add(`<path d="M${x-12} ${y+6}L${x} ${y-22}L${x+12} ${y+6}Z" fill="${C.pine}" stroke="${C.ink}" stroke-width="1.3" stroke-linejoin="round"/>`)});
  // Tokyo Bay
  const sea=JM_COAST.concat([[1620,1020]]);k.fill(sea,C.water,{dx:0,dy:0,sc:0});const sand=JM_COAST.map(p=>[p[0]-24,p[1]-34]).concat(JM_COAST.slice().reverse());k.fill(sand,C.sand,{dx:0,dy:0,sc:0});k.pen(JM_COAST,false,{w:2.2});
  let wv='';for(let i=0;i<34;i++){const x=760+k.r()*840,y=760+k.r()*230;if(y<polyYd(JM_COAST,x)+18||((x-1300)/120)**2+((y-830)/70)**2<1)continue;wv+=`M${R1(x)} ${R1(y)}q8 -6 16 0t16 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.8" stroke-linecap="round"/>`);
  // the Sumida river down to the bay
  const rl=JM_RIVER.map(p=>[p[0]-14,p[1]]),rr=JM_RIVER.map(p=>[p[0]+14,p[1]]);k.fill(rl.concat(rr.slice().reverse()),C.water,{dx:0,dy:0,sc:0});k.pen(rl,false,{w:1.8});k.pen(rr,false,{w:1.8});
  // the island in the bay (Odaiba) with its beach
  k.fill(E(1300,830,130,60,16),'#F3E6C6',{dx:0,dy:0});k.pen(E(1300,830,130,60,16),true,{w:2,one:1});
  // the Shinkansen line from the west into Tokyo Station, and the Yamanote loop
  const rail=JM_RAIL;
  k.add(`<path d="${smooth(rail,false)}" fill="none" stroke="${C.ink}" stroke-width="7" stroke-linecap="round"/><path d="${smooth(rail,false)}" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="14 10"/>`);
  k.add(`<path d="${smooth(JM_LOOP,true)}" fill="none" stroke="${C.ink}" stroke-width="10"/><path d="${smooth(JM_LOOP,true)}" fill="none" stroke="#9CCB80" stroke-width="7"/><path d="${smooth(JM_LOOP,true)}" fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-dasharray="6 10"/>`);
  // the city: little houses and towers wherever no place, river, sea or mountain is
  const pal=[[C.wall,C.roof],[C.wall2,C.lav],[C.wall3,'#9AA7B8'],[C.wall4,C.redD],['#FFF3DC',C.orange]],tw=['#E6E2EE','#E1E8EF','#EFE3CF','#F2E2E6'];
  for(let y=140;y<960;y+=62)for(let x=440+((y/62)%2)*30;x<1580;x+=64){const jx=x+k.J(12),jy=y+k.J(9);if(k.r()<.35)continue;if(jmIn(jx,jy,0)||Math.abs(jy-polyYd(JM_RAIL,jx))<30||y>polyYd(JM_COAST,jx)-46||Math.abs(jx-polyXd(JM_RIVER,jy))<44||((jx-1300)/150)**2+((jy-830)/80)**2<1)continue;
    const near=((jx-860)/330)**2+((jy-420)/240)**2;if(Math.abs(near-1)<.12)continue;const c=k.r();if(near<1&&c<.55)jmTower(k,jx,jy,.9+k.r()*.3,tw[Math.floor(k.r()*4)]);else if(c<.75){const p=pal[Math.floor(k.r()*5)];jmHouse(k,jx,jy,.9,p[0],p[1])}else{k.add(`<path d="${smooth(blobP(jx,jy-6,13,11,k.r,8,.18),true)}" fill="${C.leaf}" stroke="${C.ink}" stroke-width="1.4"/>`)}}
  // the places
  for(const id of Object.keys(JM_AREAS)){const a=JM_AREAS[id],x=a.x,y=a.y,hp=E(x,y+12,104,84,12),isL=locked.has(id);
    const g=k.cap(()=>{k.add(`<path d="${smooth(dense(E(x,y+16,100,66,14),true,30),true)}" fill="#FDF3DF" fill-opacity=".9"/>`);JM_ICON[id](k,x,y);
      const cap=()=>{const L=a.label;k.text(L,x,y+108,L.length>17?Math.round(34*17/L.length):34,{rot:k.J(2),halo:'#FFF8EC',hw:12})};// a wide paper halo: the loop and the rail stop short of the letters
      if(!isL)cap();
      else{k.add(`<path d="${smooth(dense(hp,true,30),true)}" fill="#EFE9E0" fill-opacity=".55"/>`);k.hatch(hp,{gap:7,col:C.graph,op:.55,w:1.4});const cx=x-28,cy=y-10;
        k.add(`<path d="M${cx-14} ${cy}v-12a14 14 0 0 1 28 0v12" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`);k.shape(RC(cx-22,cy-2,44,36),C.yellow,{w:2.4});k.add(`<circle cx="${cx}" cy="${cy+12}" r="4" fill="${C.ink}"/><path d="M${cx} ${cy+14}v9" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`);
        k.shape(RC(cx+28,cy+2,86,30),C.pink,{w:1.8,one:1});k.text(`Bond ${Number.isFinite(+bonds[id])&&bonds[id]!==null?+bonds[id]:a.bond}`,cx+71,cy+25,26,{col:'#fff'});cap()}
      // stamp ticks: a little red eki stamp for each stamp collected here
      let n=0;Object.keys(JM_STAMP).forEach(sk=>{if(JM_STAMP[sk]!==id||!got.has(sk))return;k.add(`<g data-stamp="${sk}">`);stampMark(k,x+94,y-60+n*36,16,'#D9473A',-10+n*14);k.add('</g>');n++})});
    hot(k,'data-area',id,a.label+(isL?' (locked)':''),hp,g);
    if(isL)k.out[k.out.length-1]=k.out[k.out.length-1].replace(`data-area="${id}"`,`data-area="${id}" data-locked="1"`)}
  // compass, the title, doodles
  k.shape(E(1540,110,48,48,14),'#FFFFFF',{w:2});k.add(`<path d="M1540 62l10 40 -10 10 -10 -10zM1540 158l10 -40 -10 -10 -10 10z" fill="${C.pink}" stroke="${C.ink}" stroke-width="1.8" stroke-linejoin="round"/>`);k.text('N',1540,54,28);
  {const [tx,ty]=JM_TITLE;k.text('Tokyo',tx,ty,72,{rot:-3,halo:'#FFF8EC',hw:10});k.line([[tx-100,ty+18],[tx+110,ty+12]],3,C.pink)}
  O.sparkle(k,420,200,10);O.sparkle(k,1460,560,8);O.heart(k,700,920,8);O.note(k,1540,420,14);
  O.tape(k,10,26,120,-26,'#F7B9C6');O.tape(k,1460,960,120,-24,'#BDE7D2');O.tape(k,14,966,100,24,'#F9E19A')}
const polyXd=(P,y)=>{for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];if((y-a[1])*(y-b[1])<=0){const t=(y-a[1])/((b[1]-a[1])||1);return a[0]+(b[0]-a[0])*t}}return P[P.length-1][0]};
const polyYd=(P,x)=>{for(let i=0;i<P.length-1;i++){const a=P[i],b=P[i+1];if((x-a[0])*(x-b[0])<=0){const t=(x-a[0])/((b[0]-a[0])||1);return a[1]+(b[1]-a[1])*t}}return 9999};

/* ======================= API (wraps worlds A, B and C) ======================= */
const MINE={shibuya:['Shibuya Crossing',tkShibuya],yoyogi:['Yoyogi Park Dog Run',tkYoyogi],asakusa:['Asakusa and Sensō-ji',tkAsakusa],shinkansen:['Shinkansen ride',tkShinkansen],japanmap:['Japan map',tkJapanMap]};
const cacheD={};
const freshD=s=>{const suf='x'+(++_n);return s.replace(/pwd(\d+)/g,m=>m+suf)};
const floorAttr=` data-floor="${FLOOR.join(',')}"`;
function renderD(name,o){o=o||{};
  if(name==='japanmap'){const st=o.stamps,sk=Array.isArray(st)?st.slice().sort().join(','):st&&typeof st==='object'?Object.keys(st).filter(s=>st[s]).sort().join(','):'',
      key='japanmap|'+(Array.isArray(o.locked)?o.locked.slice().sort().join(','):'')+'|'+JSON.stringify(o.bonds||{})+'|'+sk;
    if(!cacheD[key]){const k=kit(hashS('pwd-japanmap'));lighten(k);k.env=DEF_ENV;k.xl=[];const pp=paperDefs(k,1600,1000);tkJapanMap(k,o);
      cacheD[key]=assemble(k,pp,1600,`<svg class="pa-wd-scene pa-wd-japanmap" viewBox="0 0 1600 1000" role="img" aria-label="Japan map">`,false)}
    return freshD(cacheD[key])}
  const env=mkEnv(o),ex=name==='shinkansen'?'|'+(o.dir==='home'?'home':'out')+(o.still===true?'|still':''):'',key=name+'|'+env.time+'|'+env.weather+'|'+env.season+(env.hw?'|hw':'')+wnKey(env)+ex;
  if(!cacheD[key])cacheD[key]=frameC(name,MINE[name][0],k=>MINE[name][1](k,o),env,name==='shinkansen'?` data-dir="${o.dir==='home'?'home':'out'}"${o.still===true?' data-still="1"':''}`:floorAttr);
  let s=freshD(cacheD[key]);
  if(name==='shinkansen'){const H=Array.isArray(o.heads)?o.heads:[];s=s.replace(/<!--pwd-head-(\d)-->/g,(m,i)=>{const h=H[+i],w=SK_WIN[+i].head;return typeof h==='string'&&h?`<svg class="pa-wd-head" x="${w.x}" y="${w.y}" width="90" height="90" viewBox="0 0 90 90" overflow="visible">${h}</svg>`:''})}
  return s}
const prevScene=PA.scene;
PA.scene=function(name,o){return MINE[name]?renderD(name,o):(prevScene?prevScene.apply(this,arguments):'')};
PA.WORLD_D_SCENES=Object.keys(MINE);PA.WORLD_D_PROPS=[];PA.WORLD_D_ITEMS=[];
PA.SHINKANSEN_WINDOWS=SK_WIN.map(w=>({x:w.x,y:w.y,w:w.w,h:w.h,head:Object.assign({},w.head)}));
PA.WORLD_D_HOTS=JSON.parse(JSON.stringify(HOTS));PA.WORLD_D_FLOOR=FLOOR.slice();
const cssD=`.pa-wd-scene [data-hot],.pa-wd-scene [data-area]{cursor:pointer;outline:none}
.pa-wd-scene .pa-wd-hit{pointer-events:all}
.pa-wd-scene .pa-wd-hl{opacity:0;pointer-events:none;transition:opacity .15s}
.pa-wd-scene [data-hot]:hover .pa-wd-hl,.pa-wd-scene [data-hot]:focus-visible .pa-wd-hl,.pa-wd-scene [data-area]:hover .pa-wd-hl,.pa-wd-scene [data-area]:focus-visible .pa-wd-hl{opacity:1}
.pa-wd-scene [data-locked="1"]{cursor:not-allowed}
.pa-wd-run{animation:4s linear both}.pa-wd-run.pa-wd-near{animation-name:pa-wd-near}.pa-wd-run.pa-wd-far{animation-name:pa-wd-far}.pa-wd-run.pa-wd-back{animation-direction:reverse}
@keyframes pa-wd-near{from{transform:translateX(0)}to{transform:translateX(-${SK_NEAR}px)}}
@keyframes pa-wd-far{from{transform:translateX(0)}to{transform:translateX(-${SK_FAR}px)}}
@media (prefers-reduced-motion:reduce){.pa-wd-run.pa-wd-near{animation:none;transform:translateX(-${SK_NEAR/2}px)}.pa-wd-run.pa-wd-far{animation:none;transform:translateX(-${SK_FAR/2}px)}}`;
if(typeof document!=='undefined'&&!document.getElementById('pawart-world-d-css')){const st=document.createElement('style');st.id='pawart-world-d-css';st.textContent=cssD;document.head.appendChild(st)}
// the stubs' other wrappers stay: props and items this module may own later go to the previous functions
const prevProp=PA.prop,prevItem=PA.item;
PA.prop=function(){return prevProp?prevProp.apply(this,arguments):''};
PA.item=function(){return prevItem?prevItem.apply(this,arguments):''};

})();
