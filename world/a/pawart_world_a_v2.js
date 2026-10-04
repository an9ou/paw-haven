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
  const r=rng(seed),out=[],defs=[],J=a=>(r()-.5)*2*a;
  const k={r,J,out,defs,
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
 sun(k,x,y,rad){k.shape(E(x,y,rad,rad,14),C.sun,{w:2});for(let i=0;i<10;i++){const a=i/10*Math.PI*2+.15;k.line([[x+Math.cos(a)*(rad+7),y+Math.sin(a)*(rad+7)],[x+Math.cos(a)*(rad+17+(i%2)*6),y+Math.sin(a)*(rad+17+(i%2)*6)]],2,C.ink)}
   k.add(`<path d="M${x-rad*.35} ${y-rad*.1}q3 -4 6 0M${x+rad*.15} ${y-rad*.1}q3 -4 6 0M${x-rad*.2} ${y+rad*.25}q${rad*.2} ${rad*.2} ${rad*.4} 0" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>`);
   k.add(`<ellipse cx="${x-rad*.5}" cy="${y+rad*.2}" rx="5" ry="3" fill="${C.pink}" opacity=".6"/><ellipse cx="${x+rad*.5}" cy="${y+rad*.2}" rx="5" ry="3" fill="${C.pink}" opacity=".6"/>`)},
 bird(k,x,y,s){k.line([[x-s,y-s*.3],[x-s*.4,y-s*.5],[x,y]],1.6);k.line([[x,y],[x+s*.4,y-s*.5],[x+s,y-s*.3]],1.6)},
 tuft(k,x,y,s=1,col=C.grassD){k.add(`<path d="M${R1(x-6*s)} ${y}q${R1(1*s)} ${R1(-7*s)} ${R1(-1*s)} ${R1(-12*s)}M${R1(x)} ${y}q${R1(-1*s)} ${R1(-9*s)} ${R1(2*s)} ${R1(-15*s)}M${R1(x+6*s)} ${y}q${R1(1*s)} ${R1(-6*s)} ${R1(4*s)} ${R1(-10*s)}" fill="none" stroke="${col}" stroke-width="1.6" stroke-linecap="round"/>`)},
 flower(k,x,y,s,col){k.line([[x,y+s*2.6],[x+k.J(1),y]],1.4,'#7DAE66');for(let i=0;i<5;i++){const a=i/5*Math.PI*2;k.add(`<circle cx="${R1(x+Math.cos(a)*s)}" cy="${R1(y+Math.sin(a)*s)}" r="${R1(s*.62)}" fill="${col}" stroke="${C.ink}" stroke-width="1"/>`)}k.add(`<circle cx="${x}" cy="${y}" r="${R1(s*.5)}" fill="#F7C65E" stroke="${C.ink}" stroke-width="1"/>`)},
 leafy(k,cx,cy,rx,ry,col,colD){// a scribbled leaf cluster: lumpy canopy, little "c" leaf marks, hatched underside
   const p=[];const n=11;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,kk=i%2?1.06:.9+k.r()*.06;p.push([cx+Math.cos(a)*rx*kk,cy+Math.sin(a)*ry*kk])}
   k.fill(p,col);k.hatch(p,{side:.35,gap:5,col:colD,op:.55,w:1.3});k.pen(p,true,{w:2.1});
   let d='';for(let i=0;i<Math.round(rx*ry/260);i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r())*.75,x=cx+Math.cos(a)*rx*rr,y=cy+Math.sin(a)*ry*rr;d+=`M${R1(x)} ${R1(y)}q3 -4 7 -1`}
   k.add(`<path d="${d}" fill="none" stroke="${colD}" stroke-width="1.4" stroke-linecap="round"/>`)},
 tree(k,x,gy,s=1,o={}){const col=o.col||C.leaf,colD=o.colD||C.leafD;
   const tw=14*s,th=70*s;k.shape([[x-tw*.6,gy],[x-tw*.45,gy-th],[x+tw*.45,gy-th],[x+tw*.7,gy]],C.trunk,{hatch:{side:.5,gap:3.5,col:C.trunkD,op:.6}});
   k.line([[x-2*s,gy-10*s],[x-1*s,gy-30*s],[x-3*s,gy-50*s]],1.2,C.trunkD);k.line([[x+3*s,gy-20*s],[x+4*s,gy-40*s]],1.2,C.trunkD);
   O.leafy(k,x-26*s,gy-th-8*s,34*s,28*s,col,colD);O.leafy(k,x+26*s,gy-th-4*s,32*s,26*s,col,colD);O.leafy(k,x,gy-th-36*s,40*s,34*s,col,colD);
   if(o.fruit)for(let i=0;i<5;i++)k.add(`<circle cx="${R1(x+(k.r()-.5)*70*s)}" cy="${R1(gy-th-20*s+(k.r()-.5)*40*s)}" r="${R1(3.6*s)}" fill="${o.fruit}" stroke="${C.ink}" stroke-width="1.2"/>`)},
 pine(k,x,gy,s=1,col=C.pine,colD=C.pineD){k.shape([[x-6*s,gy],[x-5*s,gy-30*s],[x+5*s,gy-30*s],[x+6*s,gy]],C.trunkD,{w:1.8});
   [[0,1],[1,.78],[2,.56]].forEach(([i,f])=>{const yb=gy-24*s-i*34*s,w=46*s*f,h=54*s;const p=[[x-w,yb],[x-w*.4,yb-h*.35],[x-w*.66,yb-h*.38],[x,yb-h],[x+w*.66,yb-h*.38],[x+w*.4,yb-h*.35],[x+w,yb]];k.fill(p,col);k.hatch(p,{side:.5,gap:4.5,col:colD,op:.6,w:1.2});k.pen(p,true,{w:2})})},
 bush(k,x,gy,s=1,col=C.leaf2,colD=C.leafD,berries){const p=[];for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI;p.push([x+Math.cos(a)*40*s,gy+Math.sin(a)*(i%2?30:24)*s])}k.shape(p,col,{hatch:{side:.45,gap:4.5,col:colD,op:.5}});
   let d='';for(let i=0;i<6;i++)d+=`M${R1(x+(k.r()-.5)*56*s)} ${R1(gy-6*s-k.r()*18*s)}q3 -4 7 -1`;k.add(`<path d="${d}" fill="none" stroke="${colD}" stroke-width="1.3" stroke-linecap="round"/>`);
   if(berries)for(let i=0;i<4;i++)k.add(`<circle cx="${R1(x+(k.r()-.5)*50*s)}" cy="${R1(gy-8*s-k.r()*16*s)}" r="${R1(3*s)}" fill="${berries}" stroke="${C.ink}" stroke-width="1"/>`)},
 rock(k,x,y,s){k.shape(blobP(x,y,16*s,10*s,k.r,8,.25).map(p=>[p[0],Math.min(p[1],y+4*s)]),C.stone,{w:1.8,hatch:{side:.5,gap:4,col:C.stoneD,op:.6}})},
 board(k,x,y,w,h,col=C.wood,colD=C.woodD,pointy){// one fence board with grain and a knot
   const p=pointy?[[x,y+8],[x+w/2,y],[x+w,y+8],[x+w,y+h],[x,y+h]]:RC(x,y,w,h);k.shape(p,col,{w:1.9,wk:.5});
   const gx=x+w*(.3+k.r()*.4);k.line([[gx,y+12],[gx+k.J(2),y+h*.5],[gx+k.J(2),y+h-6]],1,colD);k.line([[x+w*.75,y+h*.3],[x+w*.72,y+h*.7]],1,colD);
   if(k.r()<.45){const ky=y+h*(.35+k.r()*.3);k.add(`<ellipse cx="${R1(x+w*.4)}" cy="${R1(ky)}" rx="2.6" ry="1.8" fill="none" stroke="${colD}" stroke-width="1.1"/>`)}},
 fence(k,x0,x1,yt,yb,o={}){const bw=o.bw||26,gap=o.gap||5;k.shape(RC(x0,yt+20,x1-x0,9),C.woodD,{w:1.7,one:1});k.shape(RC(x0,yb-30,x1-x0,9),C.woodD,{w:1.7,one:1});
   for(let x=x0;x<x1-bw*.5;x+=bw+gap){const h=yb-yt+k.J(3);O.board(k,x,yb-h,bw,h,C.wood,C.woodD,true)}},
 bench(k,x,gy,s=1){k.shape(RC(x-50*s,gy-36*s,100*s,8*s),C.woodD,{w:1.8});k.shape(RC(x-50*s,gy-58*s,100*s,8*s),C.wood,{w:1.8});k.shape(RC(x-50*s,gy-70*s,100*s,8*s),C.wood,{w:1.8});
   [-42,36].forEach(dx=>{k.line([[x+dx*s,gy-28*s],[x+dx*s,gy]],3.2,C.ink);k.line([[x+(dx+4)*s,gy-74*s],[x+(dx+4)*s,gy-36*s]],2.6,C.ink)})},
 lamp(k,x,gy,s=1){k.line([[x,gy],[x,gy-120*s]],4,C.ink);k.shape([[x-12*s,gy-120*s],[x+12*s,gy-120*s],[x+8*s,gy-140*s],[x-8*s,gy-140*s]],C.yellow,{w:1.8});k.shape([[x-14*s,gy-140*s],[x,gy-152*s],[x+14*s,gy-140*s]],'#9AA7B8',{w:1.8});
   k.add(`<circle cx="${x}" cy="${R1(gy-130*s)}" r="${R1(16*s)}" fill="${C.yellow}" opacity=".35"/>`)},
 mushroom(k,x,gy,s=1){k.shape([[x-5*s,gy],[x-4*s,gy-14*s],[x+4*s,gy-14*s],[x+5*s,gy]],'#FFF6E6',{w:1.6});const p=[];for(let i=0;i<=8;i++){const a=Math.PI+i/8*Math.PI;p.push([x+Math.cos(a)*15*s,gy-12*s+Math.sin(a)*12*s])}k.shape(p,'#F49090',{w:1.8});
   [[-6,-17],[3,-20],[8,-15]].forEach(q=>k.add(`<circle cx="${R1(x+q[0]*s)}" cy="${R1(gy+q[1]*s)}" r="${R1(2*s)}" fill="#fff"/>`))},
 cobbles(k,x0,y0,x1,y1){let d='',f='';for(let y=y0+8,row=0;y<y1;y+=16,row++){for(let x=x0+(row%2)*14;x<x1;x+=28){const rx=11+k.r()*2,ry=6+k.r()*1.5,cx=x+k.J(2),cy=y+k.J(1.5);
   f+=`<ellipse cx="${R1(cx+1)}" cy="${R1(cy+1)}" rx="${R1(rx)}" ry="${R1(ry)}" fill="${k.r()<.5?C.stone:'#E6DFD6'}"/>`;d+=`M${R1(cx-rx)} ${R1(cy)}a${R1(rx)} ${R1(ry)} 0 1 0 ${R1(rx*2)} 0a${R1(rx)} ${R1(ry)} 0 1 0 ${R1(-rx*2)} 0`}}
   k.add(f+`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="1.1" stroke-opacity=".7"/>`)},
 awning(k,x,y,w,h,c1,c2){const n=Math.round(w/34),sw=w/n;for(let i=0;i<n;i++){const p=[[x+i*sw,y],[x+(i+1)*sw,y],[x+(i+1)*sw+4,y+h],[x+(i+.5)*sw+2,y+h+10],[x+i*sw+4,y+h]];k.fill(p,i%2?c2:c1,{dx:.6,dy:.4})}
   const p=[[x,y]];for(let i=0;i<n;i++){p.push([x+i*sw+4,y+h],[x+(i+.5)*sw+2,y+h+10])}p.push([x+w+4,y+h],[x+w,y]);k.pen(p,true,{w:2});for(let i=1;i<n;i++)k.line([[x+i*sw,y],[x+i*sw+4,y+h]],1.1,C.ink,{op:.7})},
 bunting(k,x0,x1,y,sag,cols){const n=Math.round((x1-x0)/36);const pt=t=>[x0+(x1-x0)*t,y+Math.sin(Math.PI*t)*sag];const L=[];for(let i=0;i<=20;i++)L.push(pt(i/20));k.line(L,1.4);
   for(let i=0;i<n;i++){const a=pt((i+.2)/n),b=pt((i+.8)/n),m=pt((i+.5)/n);k.shape([a,b,[m[0],m[1]+24]],cols[i%cols.length],{w:1.5,one:1})}},
 window(k,x,y,w,h,o={}){// framed window with cross bars, curtains, sill and optional flower box
   k.shape(RC(x-5,y-5,w+10,h+10),o.frame||C.white,{w:2});k.shape(RC(x,y,w,h),C.glass,{w:1.6,one:1});
   k.add(`<path d="M${R1(x+w*.2)} ${R1(y+h*.75)}l${R1(w*.3)} ${R1(-h*.4)}M${R1(x+w*.45)} ${R1(y+h*.8)}l${R1(w*.2)} ${R1(-h*.25)}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);
   k.line([[x+w/2,y],[x+w/2,y+h]],2,C.ink);k.line([[x,y+h/2],[x+w,y+h/2]],2,C.ink);
   if(o.curtain){const cc=o.curtain;[[x,1],[x+w,-1]].forEach(([cx,sd])=>{const p=[[cx,y],[cx+sd*w*.32,y],[cx+sd*w*.18,y+h*.45],[cx+sd*w*.26,y+h*.9],[cx,y+h*.9]];k.shape(p,cc,{w:1.6,one:1});k.line([[cx+sd*w*.1,y+4],[cx+sd*w*.12,y+h*.8]],1,C.ink,{op:.6})});k.line([[x-6,y+2],[x+w+6,y+2]],2.4,C.ink)}
   k.shape(RC(x-9,y+h+3,w+18,7),o.frame||C.white,{w:1.8});
   if(o.box){k.shape(RC(x-4,y+h+10,w+8,16),C.woodD,{w:1.8});const cols=[C.red,C.yellow,C.lav,'#FFB3C7'];for(let i=0;i<5;i++){const fx=x+4+i*(w-8)/4;O.flower(k,fx,y+h+2-k.r()*6,4.2,cols[i%4])}}}
};
/* ---------- scenes ---------- */
function frameScene(name,label,body){
  const k=kit(hashS('pwa-'+name));const pp=paperDefs(k,1000,600);
  body(k);
  return `<svg class="pa-wa-scene pa-wa-${name}" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}"><defs>${k.defs.join('')}</defs>${pp.bg}${k.out.join('')}${pp.tooth}</svg>`;
}
function hot(k,attr,val,label,hitPts,inner){// clickable group with a transparent hit shape and a pink dashed hover outline
  const hit=smooth(dense(hitPts,true,30),true);
  k.add(`<g ${attr}="${val}" role="button" tabindex="0" aria-label="${label}"><path class="pa-wa-hit" d="${hit}" fill="#000" fill-opacity="0"/>${inner}<path class="pa-wa-hl" d="${hit}" fill="none" stroke="${C.pink}" stroke-width="4" stroke-dasharray="10 8" stroke-linecap="round"/></g>`);
}
function skyBand(k,W,yb,col=C.sky){k.add(`<rect x="0" y="0" width="${W}" height="${yb}" fill="${col}" fill-opacity=".75"/>`);let d='';for(let y=20;y<yb-10;y+=26){for(let x=0;x<W;x+=180){d+=`M${R1(x+k.r()*40)} ${R1(y+k.J(4))}h${R1(60+k.r()*70)}`}}k.add(`<path d="${d}" stroke="#FFFFFF" stroke-width="4" stroke-opacity=".32" stroke-linecap="round"/>`)}

function yard(k){
  skyBand(k,1000,360);O.sun(k,890,80,34);O.cloud(k,520,80,28);O.cloud(k,760,130,20);O.bird(k,640,70,9);O.bird(k,668,86,7);
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
  // cottage (back left)
  const cx=40,cy=170;
  k.shape([[cx+170,cy+20],[cx+170,cy-30],[cx+196,cy-30],[cx+196,cy+30]],C.red,{w:2,hatch:{side:.4,gap:4,col:C.redD,op:.6}});
  [[0,-10],[8,-28],[18,-46]].forEach((q,i)=>k.line([[cx+183+q[0],cy-36+q[1]],[cx+176+q[0],cy-44+q[1]],[cx+186+q[0],cy-52+q[1]]],1.6,C.graph));
  const wall=RC(cx,cy+60,250,170);k.shape(wall,C.wall,{w:2.3,hatch:{side:.72,gap:5,col:'#D9B996',op:.5}});
  for(let y=cy+80;y<cy+225;y+=18)k.line([[cx+6,y+k.J(1)],[cx+244,y+k.J(1)]],1,'#E2C29E',{op:.8});
  const roof=[[cx-26,cy+66],[cx+125,cy-40],[cx+276,cy+66]];k.shape(roof,C.roof,{w:2.4,hatch:{side:.6,gap:5,col:C.roofD,op:.55}});
  for(let row=0;row<5;row++){const y=cy-14+row*17,half=(y-cy+40)*1.42;let d='';for(let x=cx+125-half+10;x<cx+125+half-12;x+=16)d+=`M${R1(x)} ${R1(y)}q8 9 16 0`;k.add(`<path d="${d}" fill="none" stroke="${C.roofD}" stroke-width="1.4" stroke-linecap="round"/>`)}
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
  O.sparkle(k,470,250,9);O.sparkle(k,820,240,6);O.heart(k,360,150,6);O.note(k,700,180,12);
  O.tape(k,6,26,90,-24,'#F7B9C6');O.tape(k,930,560,80,-28,'#BDE7D2');
  // faint construction marks for the overlay spots
  k.line([[612,526],[870,526]],1,C.graph,{op:.45,dash:'2 7'});
}

function market(k){
  skyBand(k,1000,170,C.sky);O.bird(k,240,92,9);O.bird(k,262,104,7);O.bird(k,780,96,8);
  O.bunting(k,20,980,24,26,[C.red,C.yellow,C.mint,C.lav,C.blue]);
  // sidewalk + cobbled street
  k.fill([[0,452],[1000,448],[1000,600],[0,600]],C.stone,{dx:0,dy:0});
  O.cobbles(k,0,488,1000,600);
  k.shape([[0,448],[1000,444],[1000,474],[0,478]],'#EDE6DC',{w:2});for(let x=40;x<1000;x+=90)k.line([[x,448],[x-6,476]],1.2,C.ink,{op:.6});
  const shop=(x,key,label,col,cols,inner)=>{
    const g=k.cap(()=>{
      const w=290,top=150,base=446;
      k.shape(RC(x,top,w,base-top),col,{w:2.4,hatch:{side:.82,gap:5,col:'#B8A493',op:.35}});
      for(let y=top+28;y<base-10;y+=22){let d='';for(let bx=x+((y/22)%2?0:22);bx<x+w-10;bx+=44)d+=`M${R1(bx)} ${R1(y)}h40`;k.add(`<path d="${d}" stroke="#fff" stroke-opacity=".45" stroke-width="1.4"/>`)}
      k.shape(RC(x-8,top-14,w+16,18),C.wood,{w:2});
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
    k.shape(RC(x+24,top+140,150,140),C.glass,{w:2.2});k.add(`<path d="M${x+40} ${top+250}l40 -60M${x+70} ${top+258}l26 -36" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>`);
    [[x+50,top+200],[x+100,top+190],[x+148,top+204]].forEach((q,i)=>{const bx=q[0],by=q[1];k.shape([[bx-20,by],[bx+20,by],[bx+22,by+76],[bx-22,by+76]],[C.orange,C.mint,C.lav][i],{w:1.8});k.shape(RC(bx-12,by+22,24,18),C.white,{w:1.2,one:1});k.text(['kibble','yum','crunch'][i],bx,by+36,13,{wt:700})});
    k.shape(RC(x+186,top+150,80,130),'#C79A72',{w:2.2});k.add(`<circle cx="${x+254}" cy="${top+214}" r="3" fill="${C.ink}"/>`);k.shape(RC(x+196,top+162,60,34),C.glass,{w:1.4,one:1});
    k.text('OPEN',x+226,top+184,18,{col:'#C2475B'});
  });
  hot(k,'data-shop','kibble','Kibble Corner',RC(32,130,306,320),g1);
  // Bow-Wow Boutique
  const g2=shop(355,'boutique','Bow-Wow Boutique',C.wall2,[C.lav,'#fff'],(k,x,w,top,base)=>{
    k.shape(E(x+145,top+44,132,30,18),'#FFFFFF',{w:2.4});k.text('Bow-Wow Boutique',x+145,top+55,30);
    k.shape([[x+145,top+12],[x+129,top+2],[x+129,top+22]],C.pink,{w:1.4,one:1});k.shape([[x+145,top+12],[x+161,top+2],[x+161,top+22]],C.pink,{w:1.4,one:1});k.add(`<circle cx="${x+145}" cy="${top+12}" r="4" fill="#E86A8A" stroke="${C.ink}" stroke-width="1.2"/>`);
    k.shape(RC(x+20,top+140,170,140),C.glass,{w:2.2});
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
    k.shape(RC(x+20,top+140,170,140),C.glass,{w:2.2});
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
  O.window(k,400,90,200,150,{curtain:'#FFC9D3',frame:'#FFFFFF'});
  k.add(`<g opacity=".9">`);O.cloud(k,470,140,14);k.add(`</g>`);
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
  // string lights
  const sl=[];for(let i=0;i<=20;i++){const t=i/20;sl.push([20+960*t,70+Math.sin(Math.PI*t*3)*10])}k.line(sl,1.3);
  for(let i=1;i<20;i+=2){const p=sl[i];k.add(`<circle cx="${R1(p[0])}" cy="${R1(p[1]+7)}" r="5" fill="${[C.yellow,'#FFB3C7',C.mint][i%3]}" stroke="${C.ink}" stroke-width="1.2"/>`)}
  // rugs at the front (the game puts dogs on the floor between them)
  k.shape(E(160,560,110,22,16),'#F7C5CF',{w:2});k.add(`<ellipse cx="160" cy="560" rx="84" ry="14" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 6"/>`);
  k.shape(E(840,560,110,22,16),C.mint,{w:2});k.add(`<ellipse cx="840" cy="560" rx="84" ry="14" fill="none" stroke="#fff" stroke-width="2" stroke-dasharray="6 6"/>`);
  O.sparkle(k,640,60,8);O.sparkle(k,340,200,6);
  O.tape(k,8,18,90,-26,'#F7B9C6');O.tape(k,920,572,80,-24,'#B9D4F3');
}

const AREAS={yard:{label:'My Yard',bond:1},market:{label:'Market Street',bond:1},shelter:{label:'Paw Haven Shelter',bond:1},park:{label:'Sunny Park',bond:1},river:{label:'Riverside Trail',bond:2},woods:{label:'Maple Woods',bond:5},beach:{label:'Seashell Beach',bond:8}};
function map(k,o){
  const locked=new Set(o.locked||[]),bonds=o.bonds||{};
  k.add(`<rect width="1000" height="600" fill="#FDF3DF" fill-opacity=".55"/>`);
  // river winding across, sea at the bottom right
  const riv=[[300,0],[340,80],[300,170],[360,250],[470,300],[560,360],[620,440],[700,520],[760,600]];
  const rl=riv.map(p=>[p[0]-22,p[1]]),rr=riv.map(p=>[p[0]+22,p[1]]).reverse();k.fill(rl.concat(rr),C.water,{dx:0,dy:0});k.pen(rl,false,{w:2});k.pen(rr,false,{w:2});
  let wv='';for(let i=1;i<riv.length-1;i++)wv+=`M${riv[i][0]-8} ${riv[i][1]}q4 -4 8 0t8 0`;k.add(`<path d="${wv}" fill="none" stroke="#7FB6D8" stroke-width="1.6"/>`);
  const sea=[[690,600],[740,500],[860,440],[1000,430],[1000,600]];k.fill(sea,C.water,{dx:0,dy:0});k.pen(sea.slice(0,4),false,{w:2});
  // dotted paths between places
  const P={yard:[200,250],market:[520,140],shelter:[810,150],park:[160,440],river:[470,410],woods:[850,350],beach:[900,520]};
  [['yard','market'],['market','shelter'],['yard','park'],['yard','river'],['river','beach'],['shelter','woods'],['woods','beach'],['market','river']].forEach(([a,b])=>{const A=P[a],B=P[b],m=[(A[0]+B[0])/2+(k.r()-.5)*60,(A[1]+B[1])/2+(k.r()-.5)*60];k.line([A,m,B],2.4,C.ink,{dash:'2 9',op:.75})});
  const area=(key,hitPts,draw,lx,ly)=>{
    const lab=()=>{k.shape(RC(lx-82,ly-26,164,36),'#FFFFFF',{w:1.8,one:1,dx:1,dy:1});k.text(AREAS[key].label,lx,ly,28,{rot:k.J(2)})};
    const g=k.cap(()=>{draw(k);if(!locked.has(key))lab();
      if(locked.has(key)){const xs=hitPts.map(p=>p[0]),ys=hitPts.map(p=>p[1]);k.add(`<path d="${smooth(dense(hitPts,true,30),true)}" fill="#EFE9E0" fill-opacity=".55"/>`);k.hatch(hitPts,{gap:7,col:C.graph,op:.55,w:1.4});
        const cx=(Math.min(...xs)+Math.max(...xs))/2-30,cy=(Math.min(...ys)+Math.max(...ys))/2-18;
        k.add(`<path d="M${cx-14} ${cy}v-12a14 14 0 0 1 28 0v12" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`);k.shape(RC(cx-22,cy-2,44,36),C.yellow,{w:2.4});k.add(`<circle cx="${cx}" cy="${cy+12}" r="4" fill="${C.ink}"/><path d="M${cx} ${cy+14}v9" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`);
        k.shape(RC(cx+28,cy+2,86,30),C.pink,{w:1.8,one:1});k.text(`Bond ${bonds[key]||AREAS[key].bond}`,cx+71,cy+25,26,{col:'#fff'});lab()}
    });
    hot(k,'data-area',key,AREAS[key].label+(locked.has(key)?' (locked)':''),hitPts,g);
    if(locked.has(key))k.out[k.out.length-1]=k.out[k.out.length-1].replace(`data-area="${key}"`,`data-area="${key}" data-locked="1"`);
  };
  area('yard',E(200,236,130,96,12),k=>{k.shape([[150,230],[150,190],[190,160],[230,190],[230,230]],C.wall,{w:2,hatch:{side:.6,gap:4,col:'#D9B996',op:.5}});k.shape([[140,194],[190,152],[240,194]],C.roof,{w:2});k.shape(RC(180,206,20,24),'#B9D3F2',{w:1.6});O.window(k,206,198,14,12,{});O.fence(k,96,300,236,272,{bw:14,gap:4});O.heart(k,262,170,8)},200,318);
  area('market',E(530,130,150,92,12),k=>{[[420,C.wall,C.red],[500,C.wall2,C.lav],[580,C.wall3,C.mint]].forEach(([x,c1,c2])=>{k.shape(RC(x,80,70,90),c1,{w:2});O.awning(k,x+4,112,62,14,c2,'#fff');k.shape(RC(x+24,140,22,30),C.wood,{w:1.4,one:1})})},530,212);
  area('shelter',E(810,140,120,86,12),k=>{k.shape(RC(730,110,140,90),'#FBEFE0',{w:2,hatch:{side:.7,gap:5,col:'#D9B996',op:.4}});k.shape([[720,114],[800,62],[880,114]],C.red,{w:2});O.heart(k,800,94,12);k.shape(RC(786,160,28,40),'#E8A9B8',{w:1.6});O.window(k,746,130,26,22,{});O.window(k,828,130,26,22,{})},800,226);
  area('park',E(170,450,140,90,12),k=>{O.tree(k,110,470,.55);O.tree(k,230,460,.5,{col:C.leaf2});k.shape(E(170,500,40,14,12),C.water,{w:1.8});O.bench(k,170,470,.45);O.flower(k,90,500,4,C.red);O.flower(k,250,500,4,C.yellow)},170,548);
  area('river',E(470,400,110,80,12),k=>{const bp=[[410,404],[440,384],[500,384],[530,404],[520,414],[500,398],[440,398],[420,414]];k.shape(bp,C.wood,{w:2});for(let x=438;x<510;x+=10)k.line([[x,386],[x,398]],1,C.woodD);k.add(`<path d="M430 440l6 -8 6 8z" fill="#FFFFFF" stroke="${C.ink}" stroke-width="1.4"/>`);k.shape(E(420,440,10,6,8),'#FCE59A',{w:1.4,one:1})},470,488);
  area('woods',E(855,362,105,84,12),k=>{k.add('<g transform="translate(-14 -4)">');O.pine(k,830,380,.6);O.pine(k,880,360,.75,C.pineD,'#557F66');O.pine(k,935,385,.6);O.mushroom(k,860,392,.8);O.leafy(k,900,400,22,14,'#E9A86A','#CF8248');k.add('</g>')},856,440);
  area('beach',E(890,498,112,62,12),k=>{k.add('<g transform="translate(0 -40)">');k.fill([[780,560],[860,500],[1000,490],[1000,650],[770,650]],C.sand,{dx:0,dy:0});k.line([[900,520],[910,560]],2.6);k.shape([[870,524],[910,500],[950,526]],C.red,{w:1.8});k.add(`<path d="M820 560c10 -8 20 -8 30 0" fill="none" stroke="${C.ink}" stroke-width="1.4"/>`);k.shape(E(950,568,9,7,8),'#FFC9B0',{w:1.4,one:1});k.add('</g>')},905,560);
  // compass rose + title
  k.shape(E(80,80,40,40,14),'#FFFFFF',{w:1.8});k.add(`<path d="M80 40l8 32 -8 8 -8 -8zM80 120l8 -32 -8 -8 -8 8z" fill="${C.pink}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>`);k.text('N',80,34,22);
  k.text('Paw Haven Town',640,44,40,{rot:-2});k.line([[540,56],[740,52]],2.4,C.pink);
  O.sparkle(k,700,250,8);O.sparkle(k,330,560,6);O.heart(k,620,560,6);
  O.tape(k,6,18,90,-26,'#F7B9C6');O.tape(k,912,6,90,24,'#BDE7D2');O.tape(k,10,582,80,24,'#F9E19A');
}

/* ---------- walk strips: seamless, light (no filter, no clips per object beyond hatching) ---------- */
function strip(area,draw){
  const k=kit(hashS('pwa-strip-'+area));const pp=paperDefs(k,1200,400);
  // wrap(x, halfWidth, fn): draw once, and again shifted by 1200 if it crosses an edge
  k.wrap=(x,hw,fn)=>{const s=k.cap(fn);k.add(s);if(x-hw<0)k.add(`<g transform="translate(1200 0)">${s}</g>`);if(x+hw>1200)k.add(`<g transform="translate(-1200 0)">${s}</g>`)};
  // a long edge drawn as overlapping wrapped segments so it matches at x=0 and x=1200
  k.edge=(yf,w,col)=>{[[-40,430],[380,830],[780,1240]].forEach(([a,b])=>k.wrap((a+b)/2,(b-a)/2,()=>{const pts=[];for(let x=a;x<=b;x+=20)pts.push([x,yf(x)]);k.pen(pts,false,{w,col,amp:.6})}))};
  draw(k);
  return `<svg class="pa-wa-strip pa-wa-strip-${area}" viewBox="0 0 1200 400" role="img" aria-label="${area} walking strip"><defs>${k.defs.join('')}</defs>${pp.bg}${k.out.join('')}${pp.tooth}</svg>`;
}
const per=(x,amps)=>amps.reduce((s,[a,n,ph])=>s+a*Math.sin(x/1200*Math.PI*2*n+ph),0);// periodic over 1200
const STRIPS={
 park(k){
  k.add(`<rect width="1200" height="250" fill="${C.sky}" fill-opacity=".7"/>`);
  const hill=x=>238+per(x,[[14,2,.3],[8,5,1.1]]);const hp=[];for(let x=0;x<=1200;x+=20)hp.push([x,hill(x)]);k.add(`<path d="${smooth(hp,false)}L1200 340L0 340Z" fill="#DCEDC4"/>`);
  k.add(`<rect y="250" width="1200" height="90" fill="${C.grass}"/>`);
  [[90,1.05],[400,.95],[700,1.15],[1010,.9]].forEach(([x,s],i)=>k.wrap(x,80*s,()=>O.tree(k,x,300,s,{col:i%2?C.leaf2:C.leaf,fruit:i===2?'#F49090':null})));
  [[250,.9],[860,.9]].forEach(([x,s])=>k.wrap(x,60,()=>O.bench(k,x,318,s)));
  [[560,1],[1150,1]].forEach(([x,s])=>k.wrap(x,20,()=>O.lamp(k,x,322,s*.9)));
  [[180],[520],[640],[960]].forEach(([x])=>k.wrap(x,40,()=>O.bush(k,x,322,.7,C.leaf2,C.leafD,'#F49090')));
  // path
  k.add(`<rect y="330" width="1200" height="70" fill="${C.path}"/>`);k.edge(x=>330+per(x,[[1.5,7,.2]]),2.2);
  let pb='';for(let i=0;i<40;i++){const x=i*30+(i*37%13),y=352+(i*53%36);pb+=`<ellipse cx="${x}" cy="${y}" rx="${3+(i%3)}" ry="2" fill="#D9C39C"/>`}k.add(pb);
  [[60,C.red],[120,C.yellow],[330,C.lav],[470,C.red],[780,C.yellow],[930,'#FFB3C7'],[1090,C.lav]].forEach(([x,c])=>k.wrap(x,10,()=>O.flower(k,x,316,4.5,c)));
  let tf='';for(let x=10;x<1200;x+=46)tf+=`M${x} 330q1 -7 -1 -11M${x+5} 330q0 -8 3 -13`;k.add(`<path d="${tf}" fill="none" stroke="${C.grassD}" stroke-width="1.5" stroke-linecap="round"/>`);
  k.wrap(1190,30,()=>O.sparkle(k,1190,140,8));k.wrap(620,10,()=>O.heart(k,620,170,6));
 },
 river(k){
  k.add(`<rect width="1200" height="210" fill="${C.sky}" fill-opacity=".7"/>`);
  // far bank + water
  k.add(`<rect y="200" width="1200" height="30" fill="#D5EBC0"/><rect y="226" width="1200" height="96" fill="${C.water}"/>`);
  k.edge(x=>226+per(x,[[2,3,.5]]),1.8);
  let wv='';for(let i=0;i<34;i++){const x=(i*71)%1200,y=244+(i*29%66);wv+=`M${x} ${y}q6 -5 12 0t12 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`);
  [[180,1],[640,.85],[1000,1.1]].forEach(([x,s])=>k.wrap(x,70,()=>O.tree(k,x,214,s*.75,{col:C.leaf2})));
  // a wooden footbridge in the background water
  k.wrap(420,130,()=>{const bx=420;const arc=[];for(let i=0;i<=12;i++){const t=i/12;arc.push([bx-120+240*t,236-Math.sin(Math.PI*t)*34])}k.shape(arc.concat(arc.slice().reverse().map(p=>[p[0],p[1]+13])),C.wood,{w:2});for(let i=1;i<12;i+=2){const p=arc[i];k.line([[p[0]-3,p[1]+2],[p[0]+5,p[1]+11]],1,C.woodD)}k.line([[bx-112,250],[bx-104,268]],3,C.ink);k.line([[bx+112,250],[bx+104,268]],3,C.ink);for(let i=1;i<12;i++){const p=arc[i];k.line([[p[0],p[1]],[p[0],p[1]-22]],1.6)}const rail=arc.map(p=>[p[0],p[1]-22]);k.line(rail,2.2);for(let i=1;i<12;i++)k.line([[arc[i][0]-4,arc[i][1]+4],[arc[i][0]-4,arc[i][1]+14]],1,C.woodD)});
  // ducks and lily pads
  [[760,270],[812,284]].forEach(([x,y],i)=>k.wrap(x,20,()=>{k.shape(E(x,y,16-i*4,9-i*2,10),C.yellow,{w:1.6});k.shape(E(x+12-i*3,y-10+i*2,7-i,7-i,8),C.yellow,{w:1.5});k.add(`<path d="M${x+18-i*3} ${y-10+i*2}l7 2 -7 2z" fill="${C.orange}" stroke="${C.ink}" stroke-width="1"/><circle cx="${x+14-i*3}" cy="${y-12+i*2}" r="1.3" fill="${C.ink}"/>`)}));
  [[980,300],[1040,290],[120,296]].forEach(([x,y])=>k.wrap(x,16,()=>{k.shape(E(x,y,14,5,10),'#A9D08A',{w:1.4,one:1})}));
  // near bank path + reeds + stones
  k.add(`<rect y="318" width="1200" height="14" fill="#C9E4A4"/><rect y="330" width="1200" height="70" fill="${C.path}"/>`);k.edge(x=>320+per(x,[[2,4,1]]),1.8);k.edge(x=>331+per(x,[[1.5,6,.4]]),2.2);
  [[40],[300],[560],[880],[1160]].forEach(([x])=>k.wrap(x,22,()=>{for(let i=0;i<5;i++){const rx=x+i*7-14;k.line([[rx,330],[rx+k.J(3),300-k.r()*18]],1.8,'#6FA05C')}k.shape(E(x+4,296,3,8,8),'#A97E5A',{w:1.2,one:1})}));
  [[200,350],[690,362],[1080,352]].forEach(([x,y])=>k.wrap(x,20,()=>O.rock(k,x,y,.8)));
  k.wrap(600,12,()=>O.sparkle(k,600,120,7));
 },
 woods(k){
  k.add(`<rect width="1200" height="330" fill="#E3EDDA" fill-opacity=".85"/>`);
  [[60,.9],[300,1.1],[520,.8],[760,1.2],[980,.95],[1150,.85]].forEach(([x,s],i)=>k.wrap(x,60*s,()=>O.pine(k,x,250,s*1.1,i%2?'#A9CDB0':'#BBD8BF','#86AE92')));
  k.add(`<rect y="250" width="1200" height="80" fill="#C5DDB0"/>`);
  [[160,1.15],[430,1.3],[690,1.1],[930,1.35]].forEach(([x,s],i)=>k.wrap(x,60*s,()=>i%2?O.pine(k,x,322,s,C.pineD,'#557F66'):O.tree(k,x,322,s*.95,{col:'#E9B074',colD:'#C98A4E'})));
  // fallen log, mushrooms, ferns, acorns
  k.wrap(560,70,()=>{k.shape(RC(500,296,120,30),C.trunk,{w:2.2,hatch:{side:.4,gap:4,col:C.trunkD,op:.6}});k.shape(E(620,311,10,15,10),'#E7C79E',{w:2});k.add(`<path d="M620 304a6 7 0 1 0 1 0" fill="none" stroke="${C.trunkD}" stroke-width="1.3"/>`);for(let x=512;x<604;x+=18)k.line([[x,302],[x+14,302]],1,C.trunkD)});
  [[60,1],[86,.7],[340,.9],[800,1.1],[828,.7],[1120,.9]].forEach(([x,s])=>k.wrap(x,16,()=>O.mushroom(k,x,330,s)));
  [[240],[700],[1040]].forEach(([x])=>k.wrap(x,30,()=>{for(let i=-2;i<=2;i++){const a=-Math.PI/2+i*.38;const tip=[x+Math.cos(a)*36,330+Math.sin(a)*34];k.line([[x,330],[(x+tip[0])/2+i*3,(330+tip[1])/2-4],tip],1.8,'#6FA05C');for(let j=1;j<5;j++){const t=j/5,px=x+(tip[0]-x)*t,py=330+(tip[1]-330)*t;k.line([[px,py],[px-6,py-3]],1.2,'#6FA05C');k.line([[px,py],[px+6,py-3]],1.2,'#6FA05C')}}}));
  k.add(`<rect y="330" width="1200" height="70" fill="#D9C2A0"/>`);k.edge(x=>330+per(x,[[2,5,.7]]),2.3);
  let lv='';for(let i=0;i<36;i++){const x=(i*61)%1200+6,y=344+(i*37%50);lv+=`<path d="M${x} ${y}q5 -6 10 0q-5 6 -10 0z" fill="${['#E9A86A','#F2C46D','#D98B5F'][i%3]}" opacity=".85"/>`}k.add(lv);
  k.wrap(900,10,()=>O.sparkle(k,900,90,7));
 },
 beach(k){
  k.add(`<rect width="1200" height="190" fill="${C.sky}" fill-opacity=".75"/><rect y="186" width="1200" height="84" fill="${C.water}"/>`);
  k.edge(x=>188+per(x,[[1,4,0]]),1.6,C.graph);
  let wv='';for(let i=0;i<30;i++){const x=(i*83)%1200,y=206+(i*31%52);wv+=`M${x} ${y}q7 -6 14 0t14 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`);
  // foamy shoreline
  const sh=x=>268+per(x,[[6,3,.4],[3,8,1.3]]);const sp=[];for(let x=0;x<=1200;x+=20)sp.push([x,sh(x)]);
  k.add(`<path d="${smooth(sp,false)}L1200 400L0 400Z" fill="${C.sand}"/>`);k.edge(sh,2,C.ink);
  let fo='';for(let x=0;x<1200;x+=40)fo+=`M${x} ${R1(sh(x)-5)}q10 -6 20 0`;k.add(`<path d="${fo}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`);
  [[160,80],[420,60],[980,96]].forEach(([x,y])=>k.wrap(x,12,()=>O.bird(k,x,y,10)));
  // umbrella + towel, beach ball, sandcastle, shells, crab
  k.wrap(300,80,()=>{k.line([[300,330],[318,210]],3,C.ink);const u=[];for(let i=0;i<=10;i++){const a=Math.PI+i/10*Math.PI;u.push([318+Math.cos(a)*84,222+Math.sin(a)*40])}u.push([402,222]);k.shape(u,C.red,{w:2});for(let i=1;i<5;i++)k.line([[318,184],[318-84+i*34,222]],1.2);k.shape([[230,334],[360,334],[350,352],[220,352]],C.mint,{w:1.8});k.line([[240,340],[350,340]],1.2,'#fff')});
  k.wrap(560,30,()=>{k.shape(E(560,312,22,22,14),'#FFFFFF',{w:2});k.add(`<path d="M538 312q22 -14 44 0" fill="none" stroke="${C.red}" stroke-width="7"/><path d="M560 290q10 22 0 44" fill="none" stroke="${C.blue}" stroke-width="7"/><path d="M546 296q-6 16 4 34" fill="none" stroke="${C.yellow}" stroke-width="7"/>`);k.pen(E(560,312,22,22,14),true,{w:2})});
  k.wrap(820,50,()=>{k.shape([[780,330],[784,290],[860,290],[864,330]],C.sandD,{w:2,hatch:{side:.6,gap:4,col:'#CFAE70',op:.6}});k.shape([[800,290],[800,262],[844,262],[844,290]],C.sandD,{w:2});for(let x=800;x<846;x+=11)k.shape(RC(x,254,7,9),C.sandD,{w:1.4,one:1});k.line([[822,262],[822,236]],1.6);k.shape([[822,236],[840,242],[822,248]],C.pink,{w:1.4,one:1})});
  [[120,352],[460,366],[700,348],[1080,360]].forEach(([x,y],i)=>k.wrap(x,12,()=>{if(i%2)k.shape([[x-9,y+5],[x,y-8],[x+9,y+5]],'#FFD2C2',{w:1.4,one:1});else{k.shape(E(x,y,9,7,10),'#FFC9B0',{w:1.4,one:1});k.line([[x,y-6],[x,y+6]],1)}}));
  k.wrap(1000,30,()=>{k.shape(E(1000,334,16,10,10),'#F49090',{w:1.8});k.line([[988,328],[980,316]],1.6);k.line([[1012,328],[1020,316]],1.6);k.add(`<circle cx="994" cy="330" r="1.8" fill="${C.ink}"/><circle cx="1006" cy="330" r="1.8" fill="${C.ink}"/>`)});
  let dt='';for(let i=0;i<50;i++){dt+=`<circle cx="${(i*47)%1200}" cy="${290+(i*29%100)}" r="1.2" fill="#D9BF84"/>`}k.add(dt);
  k.wrap(700,10,()=>O.sparkle(k,700,130,7));
 }
};

/* ---------- API ---------- */
const SCENES={yard:['Your yard',yard],market:['Market Street',market],shelter:['Paw Haven Shelter',shelter],map:['Town map',map]};
const cache={};
PA.scene=function(name,o={}){
  const s=SCENES[name]||SCENES.yard;name=SCENES[name]?name:'yard';
  const key=name+JSON.stringify(o||{});if(cache[key]){const suf='x'+(++_n);return cache[key].replace(/pwa(\d+)/g,m=>m+suf)}
  const svg=frameScene(name,s[0],k=>s[1](k,o||{}));cache[key]=svg;return svg;
};
PA.walkStrip=function(area){
  const a=STRIPS[area]?area:'park';
  if(cache['strip'+a]){const suf='x'+(++_n);return cache['strip'+a].replace(/pwa(\d+)/g,m=>m+suf)}
  const svg=strip(a,STRIPS[a]);cache['strip'+a]=svg;return svg;
};
const css=`.pa-wa-scene [data-shop],.pa-wa-scene [data-area]{cursor:pointer;outline:none}
.pa-wa-scene .pa-wa-hit{pointer-events:all}
.pa-wa-scene .pa-wa-hl{opacity:0;pointer-events:none;transition:opacity .15s}
.pa-wa-scene [data-shop]:hover .pa-wa-hl,.pa-wa-scene [data-area]:hover .pa-wa-hl,.pa-wa-scene [data-shop]:focus-visible .pa-wa-hl,.pa-wa-scene [data-area]:focus-visible .pa-wa-hl{opacity:1}
.pa-wa-scene [data-locked="1"]{cursor:not-allowed}`;
if(typeof document!=='undefined'&&!document.getElementById('pawart-world-a-css')){const st=document.createElement('style');st.id='pawart-world-a-css';st.textContent=css;document.head.appendChild(st)}
})();
