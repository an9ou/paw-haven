/* Paw Haven world art, module B: icons, shop items, dog houses, collectibles, props + UI chrome.
   Style G "Doodle sketch": coloured-pencil washes that drift off two-stroke tapered pencil outlines,
   light diagonal hatching on shadow sides, Caveat labels, washi tape, sparkles.
   PawArt.icon(name)        viewBox 0 0 64 64
   PawArt.item(name)        viewBox 0 0 64 64   (20 shop names + 17 treasure names)
   PawArt.obstacle(name)    runner obstacles, fixed viewBoxes per V12.md (bottom = ground; high ones: lowest point at the bottom)
   PawArt.bed(name)         viewBox 0 0 260 160, floor y=152, sleep area ~(130,95); front lip in <g class="pa-bed-front">
   PawArt.house(name)       viewBox 0 0 240 200 (ground y=190, door opening centred near x=120)
   PawArt.collectible(name) viewBox 0 0 60 60
   PawArt.prop(name, o)     viewBox 0 0 120 120; crop {crop,stage,dry} + plot {water} 0 0 160 120 (cached per option set); torn-map 0 0 240 160 with o.pieces (cached per combination); speech 0 0 200 120, panel 0 0 300 200 (both preserveAspectRatio="none"), tape 0 0 120 30;
                            v2: nursery 320x170, mailbox {flag,count} 120x160, postcard 300x200, playboard 300x220, familytree 600x380, coatframe {found} 120x140, ultrasound 240x160 (overlay hooks documented at each prop)
                            v2.1: sparklejar {fill 0-24} 120x160, crayonbox 200x160, photoframe 160x140, doggyramp 200x120, rockingchair 160x160, album {found[12]} 600x380, easel 160x200, sniffer 200x140; new items Rainbow Collar, Gene Sniffer, Giant Crayon Box, Family Photo Frame, Doggy Ramp, Rocking Chair; icons title, album, decor, sniff, meter
                            v2.4: missioncard {items,stamps,day} 200x260, stampcard {stamps} 240x140, gerald {pose} 160x160; houses Little Tea House, Beach Hut, Camper Van, Pumpkin Cottage,
                                  Lighthouse Kennel, Rocket Ship; 32 new items (clothes, toys, foods, house cards); icons missions, guide, stamp
                            v2.5: leafpile {state,seed} 160x100, stall {kind} 240x220, paradebanner 400x90, jackolantern {lit} 80x80, leafdrift 120x40;
                                  6 festival foods, 5 festival clothes, icons festival, parade; the six house cards redrawn bold for 40 px
   Deterministic (seeded per asset name). Each asset is built once and cached as a template; every call
   gets fresh SVG ids. No filters on icons/items/props; houses use one grain filter. */
window.PawArt = window.PawArt || {};
(function(){
'use strict';
const PA=window.PawArt;
const INK='#5B3D32',GRAPH='#A8968A',PAPER='#FFFBF3',DOTC='#E3D2BA',PINK='#F28FA5',SHADOW='#EADDCB';
const C={pink:'#F7B2C4',pinkD:'#F28FA5',rose:'#F7A1B5',peach:'#FFD0A8',yel:'#FFE08A',gold:'#FFD56B',goldD:'#E9B44C',
  orange:'#F9B97A',mint:'#BDE7D2',teal:'#9ED8D2',blue:'#B9D4F3',sky:'#BFE6FA',lav:'#D3C6F1',lavD:'#B9A6E8',
  red:'#F08A86',redD:'#E46F6B',green:'#B8DE9A',leaf:'#9CCB86',leafD:'#7FB86A',tan:'#E8C597',brown:'#C99A72',
  cream:'#FFF2DA',wood:'#E2B07E',woodD:'#C58F5E',grey:'#D8D2CC',stone:'#E3DCD3',card:'#DDB57C',door:'#5E463D',white:'#FFFFFF',kib:'#D59A5E'};
const FONT="'Caveat',cursive";

/* ---------- tiny helpers (copied/adapted from the G reference) ---------- */
const R1=n=>Math.round(n*10)/10;
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hashS=s=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const hex2rgb=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16));
const rgb2hex=a=>'#'+a.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
const mix=(a,b,t)=>{const A=hex2rgb(a),B=hex2rgb(b);return rgb2hex(A.map((v,i)=>v+(B[i]-v)*t))};
function cr(pts,closed=true,k=1/6){
  const n=pts.length,get=i=>closed?pts[((i%n)+n)%n]:pts[Math.max(0,Math.min(n-1,i))];
  const segs=[],cnt=closed?n:n-1;
  for(let i=0;i<cnt;i++){const p0=get(i-1),p1=get(i),p2=get(i+1),p3=get(i+2);
    segs.push([p1,[p1[0]+(p2[0]-p0[0])*k,p1[1]+(p2[1]-p0[1])*k],[p2[0]-(p3[0]-p1[0])*k,p2[1]-(p3[1]-p1[1])*k],p2])}
  let d=`M${R1(pts[0][0])} ${R1(pts[0][1])}`;
  segs.forEach(s=>{d+=`C${R1(s[1][0])} ${R1(s[1][1])} ${R1(s[2][0])} ${R1(s[2][1])} ${R1(s[3][0])} ${R1(s[3][1])}`});
  return {d:d+(closed?'Z':''),segs,pts};
}
function ribbon(c,w,k=1/6){
  const L=[],Rr=[],n=c.length;
  for(let i=0;i<n;i++){const a=c[Math.max(0,i-1)],b=c[Math.min(n-1,i+1)];let tx=b[0]-a[0],ty=b[1]-a[1];const m=Math.hypot(tx,ty)||1;tx/=m;ty/=m;const h=w[i]/2;
    L.push([c[i][0]-ty*h,c[i][1]+tx*h]);Rr.push([c[i][0]+ty*h,c[i][1]-tx*h])}
  const dir=(a,b)=>{const m=Math.hypot(b[0]-a[0],b[1]-a[1])||1;return[(b[0]-a[0])/m,(b[1]-a[1])/m]};
  const d1=dir(c[0],c[1]),d2=dir(c[n-2],c[n-1]);
  return [...L,[c[n-1][0]+d2[0]*w[n-1]*.35,c[n-1][1]+d2[1]*w[n-1]*.35],...Rr.reverse(),[c[0][0]-d1[0]*w[0]*.35,c[0][1]-d1[1]*w[0]*.35]];
}
const E=(cx,cy,rx,ry,n=16,rot=0)=>{const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=Math.cos(a)*rx,y=Math.sin(a)*ry;p.push([cx+x*Math.cos(rot)-y*Math.sin(rot),cy+x*Math.sin(rot)+y*Math.cos(rot)])}return p};
const bbox=pts=>{let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;pts.forEach(p=>{x0=Math.min(x0,p[0]);y0=Math.min(y0,p[1]);x1=Math.max(x1,p[0]);y1=Math.max(y1,p[1])});return[x0,y0,x1,y1]};
const bez=(s,t)=>{const u=1-t;return[u*u*u*s[0][0]+3*u*u*t*s[1][0]+3*u*t*t*s[2][0]+t*t*t*s[3][0],u*u*u*s[0][1]+3*u*u*t*s[1][1]+3*u*t*t*s[2][1]+t*t*t*s[3][1]]};
function samp(c,step,open){
  const P=[];
  c.segs.forEach(sg=>{const ch=Math.hypot(sg[1][0]-sg[0][0],sg[1][1]-sg[0][1])+Math.hypot(sg[2][0]-sg[1][0],sg[2][1]-sg[1][1])+Math.hypot(sg[3][0]-sg[2][0],sg[3][1]-sg[2][1]);
    const n=Math.max(2,Math.round(ch/step));for(let j=0;j<n;j++)P.push(bez(sg,j/n))});
  if(open&&c.segs.length){const l=c.segs[c.segs.length-1][3];P.push([l[0],l[1]])}
  return P;
}
// closed smooth path through midpoints (4 numbers per point; cheaper than Catmull-Rom)
function qd(P){const n=P.length;let a=P[n-1],b=P[0],d=`M${R1((a[0]+b[0])/2)} ${R1((a[1]+b[1])/2)}`;
  for(let i=0;i<n;i++){const p=P[i],q=P[(i+1)%n];d+=`Q${R1(p[0])} ${R1(p[1])} ${R1((p[0]+q[0])/2)} ${R1((p[1]+q[1])/2)}`}return d+'Z'}
// one pencil pass as a filled ribbon (from g2Pen): wobble, tapered ends, heavier underside,
// closed loops drawn as two overlapping strokes that sometimes leave a hairline gap.
function pen(P,closed,r,o={}){
  const n=P.length,w0=o.w||2.2,wk=o.wk??.75,amp=o.amp??.75;
  let sg=1;if(closed){let a=0;for(let i=0;i<n;i++){const q=P[(i+1)%n];a+=P[i][0]*q[1]-q[0]*P[i][1]}sg=a>0?1:-1}
  const runs=[];
  if(closed&&!o.one){const s0=Math.floor(r()*n),sp=Math.floor(n*(.4+r()*.25)),gp=r()<.28?1+Math.round(r()):-1-Math.round(r()*2);runs.push([s0,s0+sp],[s0+sp+gp,s0+n+Math.round(r()*2)])}
  else runs.push([0,closed?n:n-1]);
  let d='';
  runs.forEach(([a,b])=>{
    const pts=[];for(let i=a;i<=b;i++)pts.push(closed?P[((i%n)+n)%n]:P[Math.max(0,Math.min(n-1,i))]);
    const m=pts.length;if(m<2)return;
    let vx=(r()-.5)*amp,vy=(r()-.5)*amp,wn=0;const L=[],Rt=[];
    for(let i=0;i<m;i++){
      vx=vx*.86+(r()-.5)*amp*.45;vy=vy*.86+(r()-.5)*amp*.45;wn=wn*.82+(r()-.5)*.28;
      const p0=pts[Math.max(0,i-1)],p1=pts[Math.min(m-1,i+1)];let tx=p1[0]-p0[0],ty=p1[1]-p0[1];const tl=Math.hypot(tx,ty)||1;tx/=tl;ty/=tl;
      const nx=ty*sg,ny=-tx*sg,t=i/(m-1),e=Math.min(t,1-t)/(o.tap??.16),tp=e>=1?1:.2+.8*Math.sin(e*Math.PI/2);
      const w=Math.max(.3,w0*(1+(closed?wk*Math.max(0,ny):0)+wn)*tp)/2,x=pts[i][0]+vx,y=pts[i][1]+vy;
      L.push([x+nx*w,y+ny*w]);Rt.push([x-nx*w,y-ny*w]);
    }
    d+=qd(L.concat(Rt.reverse()));
  });
  return d;
}

/* ---------- shape generators ---------- */
const rot=(pts,a,cx,cy)=>{const c=Math.cos(a),s=Math.sin(a);return pts.map(p=>[cx+(p[0]-cx)*c-(p[1]-cy)*s,cy+(p[0]-cx)*s+(p[1]-cy)*c])};
const mv=(pts,dx,dy,sx=1,sy=sx)=>pts.map(p=>[p[0]*sx+dx,p[1]*sy+dy]);
function RR(x,y,w,h,r,n=2){const p=[],cs=[[x+w-r,y+r,-90],[x+w-r,y+h-r,0],[x+r,y+h-r,90],[x+r,y+r,180]];
  cs.forEach(([cx,cy,a0])=>{for(let k=0;k<=n;k++){const a=(a0+k*90/n)*Math.PI/180;p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}});return p}
function heartP(cx,cy,s,n=26){const p=[];for(let i=0;i<n;i++){const t=i/n*Math.PI*2;p.push([cx+16*Math.pow(Math.sin(t),3)*s/32,cy-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*s/32-s*.06])}return p}
function starP(cx,cy,R,r,n=5,a0=-Math.PI/2){const p=[];for(let i=0;i<n*2;i++){const a=a0+i*Math.PI/n,q=i%2?r:R;p.push([cx+Math.cos(a)*q,cy+Math.sin(a)*q])}return p}
function boneP(cx,cy,len,th,a=0){
  const L=len/2-th*.42,kr=th*.44,k1=th*.4,t=th*.22,half=[];
  for(let i=0;i<=3;i++)half.push([-L*.5+i*L*.5/3*2-L*.0,-t]);
  const arc=(ox,oy,a0,a1,n)=>{for(let i=0;i<=n;i++){const q=(a0+(a1-a0)*i/n)*Math.PI/180;half.push([ox+Math.cos(q)*kr,oy+Math.sin(q)*kr])}};
  arc(L,-k1,165,415,8);half.push([L+kr*.2,0]);arc(L,k1,-55,195,8);
  for(let i=3;i>=0;i--)half.push([-L*.5+i*L*.5/3*2,t]);
  const right=half.filter(p=>p[0]>=-0.001),left=right.map(p=>[-p[0],-p[1]]);
  return rot([...right,...left].map(p=>[cx+p[0],cy+p[1]]),a,cx,cy);
}
function cloudP(cx,cy,rx,ry,b=8,amp=.16,n=64){const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,f=1+amp*(Math.abs(Math.sin(a*b/2))-.6);p.push([cx+Math.cos(a)*rx*f,cy+Math.sin(a)*ry*f])}return p}
function flowerP(cx,cy,R,petals=5,a0=0){const p=[],n=petals*8;for(let i=0;i<n;i++){const a=a0+i/n*Math.PI*2,f=.55+.45*Math.abs(Math.cos(a*petals/2-a0*petals/2));p.push([cx+Math.cos(a)*R*f,cy+Math.sin(a)*R*f])}return p}
function gearP(cx,cy,Ro,Ri,teeth){const p=[];for(let i=0;i<teeth;i++){const a=i/teeth*Math.PI*2,w=Math.PI/teeth;
  [[-w*.95,Ri],[-w*.5,Ro],[w*.15,Ro],[w*.55,Ri]].forEach(([da,r])=>p.push([cx+Math.cos(a+da)*r,cy+Math.sin(a+da)*r]))}return p}
function zP(x,y,s,a=0){return rot([[0,0],[1,0],[1,.24],[.4,.76],[1,.76],[1,1],[0,1],[0,.76],[.6,.24],[0,.24]].map(p=>[x+p[0]*s,y+p[1]*s]),a,x+s/2,y+s/2)}
const arch=(x0,x1,yb,yt)=>{const cx=(x0+x1)/2,w=(x1-x0)/2,s=yt+w;return [[x0,yb],[x0,s],[x0+w*.12,yt+w*.5],[x0+w*.42,yt+w*.1],[cx,yt],[x1-w*.42,yt+w*.1],[x1-w*.12,yt+w*.5],[x1,s],[x1,yb]]};
const leafP=(x,y,len,wid,a)=>rot([[x,y],[x+len*.3,y-wid*.5],[x+len*.7,y-wid*.42],[x+len,y],[x+len*.7,y+wid*.42],[x+len*.3,y+wid*.5]],a,x,y);

/* ---------- the builder ---------- */
const CFG={
  icon:{W:3.3,amp:.32,step:2.8,drift:1.1,hatch:0,hg:2.6,hw:.9,ew:2.2},
  item:{W:2.3,amp:.3,step:2.5,drift:.9,hatch:1,hg:2.3,hw:.75,ew:1.4},
  col:{W:2.4,amp:.3,step:2.5,drift:.9,hatch:1,hg:2.3,hw:.75,ew:1.4},
  prop:{W:2.8,amp:.5,step:3.8,drift:1.5,hatch:1,hg:3,hw:1,ew:1.7},
  house:{W:2.5,amp:.6,step:4.6,drift:1.8,hatch:1,hg:3.2,hw:1,ew:1.6}
};
const IDT='@PWB@';
function mk(kind,name){
  const cfg=CFG[kind],r=rng(hashS(kind+':'+name)),D=[],L=[],T=[],U=[];let nid=0;
  const id=()=>IDT+'x'+(nid++).toString(36);
  const b={r,cfg,D,L,T,U};
  const jt=s=>(r()-.5)*s;
  b.sh=(pts,fill,o={})=>{
    const c=o.c||cr(pts,true,o.k??1/6),P=samp(c,o.step||cfg.step),bb=bbox(P),w=bb[2]-bb[0],h=bb[3]-bb[1];
    let s='';
    if(fill&&!o.nofill){
      const base=o.base||mix(fill,'#FFFFFF',.55);
      if(!o.nobase)s+=`<path d="${c.d}" fill="${base}"${o.op?` opacity="${o.op}"`:''}/>`;
      // the coloured-pencil wash, nudged off the line and gently warped
      const dr=cfg.drift*(o.dr??1),dx=dr*(.45+r()*.7),dy=dr*(.25+r()*.6),cx=(bb[0]+bb[2])/2,cy=(bb[1]+bb[3])/2,sc=1+(r()-.45)*.03;
      let vx=0,vy=0;const wp=[];for(let k=0;k<P.length;k+=2){vx=vx*.72+jt(dr*.7);vy=vy*.72+jt(dr*.7);wp.push([cx+(P[k][0]-cx)*sc+dx+vx,cy+(P[k][1]-cy)*sc+dy+vy])}
      s+=`<path d="${wp.length>2?qd(wp):c.d}" fill="${fill}"${o.op?` opacity="${o.op}"`:''}/>`;
      let inner='';
      (o.marks||[]).forEach(m=>{const mc=m.c||cr(m.pts,true,m.k??1/6);inner+=`<path d="${mc.d}" fill="${m.fill}"${m.op?` opacity="${m.op}"`:''}/>`});
      if(o.inner)inner+=o.inner;
      if(cfg.hatch&&o.hatch!==0&&w>11&&h>11){
        const off=Math.max(2,Math.min(13,Math.min(w,h)*.24))*(o.hs||1),mk=id(),g=cfg.hg;let hd='';
        for(let x=bb[0]-h*.6;x<bb[2]+4;x+=g){hd+=`M${R1(x+jt(1))} ${R1(bb[3]+3)}L${R1(x+h*.6+jt(1))} ${R1(bb[1]-3)}`}
        D.push(`<mask id="${mk}" maskUnits="userSpaceOnUse" x="${R1(bb[0]-20)}" y="${R1(bb[1]-20)}" width="${R1(w+40)}" height="${R1(h+40)}"><rect x="${R1(bb[0]-20)}" y="${R1(bb[1]-20)}" width="${R1(w+40)}" height="${R1(h+40)}" fill="#fff"/><path d="${c.d}" fill="#000" transform="translate(${R1(-off*.75)} ${R1(-off)})"/></mask>`);
        inner+=`<path d="${hd}" mask="url(#${mk})" fill="none" stroke="${o.sh||mix(fill,INK,.32)}" stroke-width="${cfg.hw}" stroke-opacity="${o.ho||.45}" stroke-linecap="round"/>`;
      }
      if(o.hl!==0&&w>15&&h>13&&(o.hl||kind!=='house')){
        inner+=`<ellipse cx="${R1(bb[0]+w*.32)}" cy="${R1(bb[1]+h*.28)}" rx="${R1(w*.17)}" ry="${R1(h*.1)}" transform="rotate(-32 ${R1(bb[0]+w*.32)} ${R1(bb[1]+h*.28)})" fill="#fff" opacity="${o.hlo||.42}"/>`;
      }
      if(inner){const cl=id();D.push(`<clipPath id="${cl}"><path d="${c.d}"/></clipPath>`);s+=`<g clip-path="url(#${cl})">${inner}</g>`}
    }
    if(o.post)s+=o.post;
    if(!o.noline)s+=`<path d="${pen(P,true,r,{w:cfg.W*(o.lw||1),amp:cfg.amp*(o.amp||1),wk:o.wk})}" fill="${o.ink||INK}"${o.lo?` opacity="${o.lo}"`:''}/>`;
    (o.det||[]).forEach(dp=>{s+=b.lnS(dp,{w:o.dw,col:o.dcol})});
    (o.top?T:o.under?U:L).push(s);
    return b;
  };
  b.lnS=(pts,o={})=>{const P=samp(cr(pts,false,o.k??1/6),o.step||cfg.step,true);
    return `<path d="${pen(P,false,r,{w:o.w||cfg.W*.6,amp:cfg.amp*(o.amp||1),tap:o.tap??.3})}" fill="${o.col||INK}"${o.op?` opacity="${o.op}"`:''}/>`};
  b.ln=(pts,o={})=>{(o.top?T:o.under?U:L).push(b.lnS(pts,o));return b};
  b.loop=(pts,o={})=>{const P=samp(cr(pts,true,o.k??1/6),o.step||cfg.step);(o.top?T:o.under?U:L).push(`<path d="${pen(P,true,r,{w:o.w||cfg.W*.55,amp:cfg.amp*(o.amp||1),wk:0,one:o.one})}" fill="${o.col||INK}"${o.op?` opacity="${o.op}"`:''}/>`);return b};
  b.raw=(s,where)=>{(where==='top'?T:where==='under'?U:L).push(s);return b};
  // jittered hand strokes (cheap texture lines)
  b.jl=(x0,y0,x1,y1,j=.8)=>`M${R1(x0+jt(j))} ${R1(y0+jt(j))}Q${R1((x0+x1)/2+jt(j*1.6))} ${R1((y0+y1)/2+jt(j*1.6))} ${R1(x1+jt(j))} ${R1(y1+jt(j))}`;
  b.st=(d,col,w,op)=>`<path d="${d}" fill="none" stroke="${col||INK}" stroke-width="${w||1}" stroke-linecap="round" stroke-linejoin="round"${op?` stroke-opacity="${op}"`:''}/>`;
  b.tx=(x,y,str,size,o={})=>{(o.under?U:o.mid?L:T).push(`<text x="${x}" y="${y}" text-anchor="${o.anchor||'middle'}" font-family="${FONT}" font-size="${size}" font-weight="700" fill="${o.col||INK}"${o.rot?` transform="rotate(${o.rot} ${x} ${y})"`:''}${o.op?` opacity="${o.op}"`:''}>${str}</text>`);return b};
  b.dot=(x,y,rr,col,where)=>b.raw(`<circle cx="${R1(x+jt(.3))}" cy="${R1(y+jt(.3))}" r="${rr}" fill="${col||INK}"/>`,where);
  b.shadow=(cx,cy,rx,ry)=>b.raw(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${SHADOW}" opacity=".85"/>`,'under');
  b.guide=(pts,closed)=>{const P=samp(cr(pts,!!closed,1/6),cfg.step*1.5,!closed);U.push(`<path d="${pen(P,!!closed,r,{w:cfg.W*.38,amp:cfg.amp*1.4,wk:0,one:1})}" fill="${GRAPH}" opacity=".5"/>`);return b};
  // doodle extras (top layer)
  b.ex=(t,x,y,s,col)=>{
    const ew=cfg.ew,st=`stroke="${INK}" stroke-width="${ew}" stroke-linecap="round" stroke-linejoin="round"`,a=R1(jt(10));
    const g=inner=>T.push(`<g transform="rotate(${a} ${x} ${y})">${inner}</g>`);
    if(t==='spark'){const k=s*.16;g(`<path d="M${x} ${R1(y-s)}Q${R1(x+k)} ${R1(y-k)} ${R1(x+s*.9)} ${y}Q${R1(x+k)} ${R1(y+k)} ${x} ${R1(y+s)}Q${R1(x-k)} ${R1(y+k)} ${R1(x-s*.9)} ${y}Q${R1(x-k)} ${R1(y-k)} ${x} ${R1(y-s)}Z" fill="${col||'#FFE59A'}" ${st}/>`)}
    else if(t==='heart')g(`<path d="M${x} ${R1(y+s*.9)}C${R1(x-s*1.5)} ${R1(y-s*.05)} ${R1(x-s*.75)} ${R1(y-s*1.25)} ${x} ${R1(y-s*.38)}C${R1(x+s*.75)} ${R1(y-s*1.25)} ${R1(x+s*1.5)} ${R1(y-s*.05)} ${x} ${R1(y+s*.9)}Z" fill="${col||'#F9B2C2'}" ${st}/>`);
    else if(t==='note')g(`<ellipse cx="${x}" cy="${y}" rx="${R1(s*.36)}" ry="${R1(s*.27)}" transform="rotate(-22 ${x} ${y})" fill="${INK}"/><path d="M${R1(x+s*.32)} ${R1(y-s*.08)}L${R1(x+s*.34)} ${R1(y-s*1.25)}Q${R1(x+s*.62)} ${R1(y-s*1.05)} ${R1(x+s*.8)} ${R1(y-s*.7)}" fill="none" ${st}/>`);
    else if(t==='dots')g(`<circle cx="${x}" cy="${y}" r="${R1(s*.16)}" fill="${INK}"/><circle cx="${R1(x+s)}" cy="${R1(y-s*.6)}" r="${R1(s*.11)}" fill="${INK}"/><circle cx="${R1(x+s*.4)}" cy="${R1(y+s*.8)}" r="${R1(s*.1)}" fill="${INK}"/>`);
    else if(t==='plus')g(`<path d="M${x} ${R1(y-s)}V${R1(y+s)}M${R1(x-s)} ${y}H${R1(x+s)}" fill="none" ${st} stroke-width="${R1(ew*.8)}"/>`);
    else if(t==='glint')T.push(`<path d="${b.jl(x,y,x+s*.5,y-s*.7,.3)}M${R1(x+s*.85)} ${R1(y-s*1.05)}l.1 -.1" fill="none" stroke="#fff" stroke-width="${R1(ew*1.1)}" stroke-linecap="round"/>`);
    return b;
  };
  b.svg=(vb,extra,label,grain)=>{
    let L2=L.join('');
    if(grain){const g=id();D.push(`<filter id="${g}" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="5" result="t"/><feColorMatrix in="t" type="matrix" values="0 0 0 0 1  0 0 0 0 .99  0 0 0 0 .96  1.7 0 0 0 -.98" result="s"/><feComposite in="s" in2="SourceGraphic" operator="atop"/></filter>`);L2=`<g filter="url(#${g})">${L2}</g>`}
    return `<svg xmlns="http://www.w3.org/2000/svg" class="pa-wb pa-wb-${kind}" viewBox="${vb}" role="img" aria-label="${label}"${extra||''}>${D.length?`<defs>${D.join('')}</defs>`:''}${U.join('')}${L2}${T.join('')}</svg>`;
  };
  return b;
}

/* ---------- cache: build once, hand out with fresh ids ---------- */
let UID=0;const CACHE={};
function serve(key,build){let t=CACHE[key];if(t===undefined)t=CACHE[key]=build();
  if(t.indexOf(IDT)<0)return t;const u='pwb'+(++UID).toString(36);return t.split(IDT).join(u)}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function fallback(kind,name,vb){const b=mk(kind==='house'?'house':'item','?'+name),[,,w,h]=vb.split(' ').map(Number);
  b.sh(RR(w*.2,h*.2,w*.6,h*.6,w*.08),C.grey,{hatch:0});b.tx(w/2,h*.58,'?',h*.3,{});return b.svg(vb,'',kind+' '+esc(name))}

/* ---------- shared pieces ---------- */
function paw(b,x,y,s,fill,o={}){ // paw print, s = pad radius-ish
  b.sh(rot([[x-s*1.05,y+s*.55],[x-s*.8,y-s*.2],[x,y-s*.55],[x+s*.8,y-s*.2],[x+s*1.05,y+s*.55],[x,y+s*.85]],o.a||0,x,y),fill,{hatch:0,hl:0,lw:o.lw,noline:o.noline});
  [[-1.2,-1.05],[-.42,-1.6],[.42,-1.6],[1.2,-1.05]].forEach(([dx,dy])=>{const p=rot([[x+dx*s,y+dy*s]],o.a||0,x,y)[0];
    b.sh(E(p[0],p[1],s*.36,s*.44,10,(o.a||0)+dx*.25),fill,{hatch:0,hl:0,lw:o.lw?o.lw*.8:.8,noline:o.noline})});
}
function kibble(b,x,y,s,a){nugget(b,x,y,s,a)}
function bubble(b,x,y,rr,o={}){b.sh(E(x,y,rr,rr,Math.max(10,Math.round(rr*1.4))),o.fill||'#DCEFFC',{hatch:0,hl:0,base:'#F4FAFE',lw:o.lw||.7,
  marks:[{pts:E(x+rr*.25,y+rr*.3,rr*.7,rr*.5,12,-.5),fill:o.tint||'#EBDDF7',op:.7}]});b.ex('glint',x-rr*.45,y-rr*.15,rr*.7)}
function sparkles(b,list){list.forEach(([t,x,y,s,c])=>b.ex(t,x,y,s,c))}
// one bowl in 3/4 view, used by items (64) and props (120). u = scale unit
function bowl(b,cx,cy,rx,ry,depth,fill,inside,content){
  b.sh(E(cx,cy,rx,ry,24),inside,{hatch:0,hl:0,lw:.9});
  if(content)content();
  const lip=[];for(let i=0;i<=12;i++){const a=i/12*Math.PI;lip.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry])}
  const band=[...lip,[cx-rx*.9,cy+depth*.62],[cx-rx*.74,cy+depth*.96],[cx,cy+depth*1.12],[cx+rx*.74,cy+depth*.96],[cx+rx*.9,cy+depth*.62]];
  b.sh(band,fill,{k:.12,marks:[{pts:[...lip.map(p=>[p[0],p[1]-.5]),...lip.slice().reverse().map(p=>[p[0]*.985+cx*.015,p[1]+depth*.17])],fill:'#fff',op:.4}]});
}

/* ===================================== ICONS (64) ===================================== */
const ICONS={
 hunger(b){ // drumstick
  b.sh(E(52,45,5.6,5.6,12),C.cream,{hl:0});b.sh(E(46,52,5.6,5.6,12),C.cream,{hl:0});
  b.sh([[33,35],[40,29],[53,44],[45,52]],C.cream,{k:0,hl:0,lw:.9});
  b.sh(E(25,26,19,15,20,-.75),'#EFA36E',{marks:[{pts:E(20,21,8,5,12,-.75),fill:'#F8C79A'}],det:[[[28,35],[33,31]]]});
 },
 happy(b){ // happy puppy face
  b.sh(E(11,30,7,13,14,.35),'#DDA06D',{hl:0});b.sh(E(53,30,7,13,14,-.35),'#DDA06D',{hl:0});
  b.sh(E(32,35,21,19,24),'#FFE3B0',{marks:[{pts:E(15,41,4.6,3,10),fill:PINK,op:.55},{pts:E(49,41,4.6,3,10),fill:PINK,op:.55}],
   det:[[[19,31],[23,26],[27,31]],[[37,31],[41,26],[45,31]]]});
  b.sh(E(32,36,3.4,2.4,10),INK,{hatch:0,hl:0,lw:.6,base:INK});
  b.sh([[24,40],[40,40],[37,48],[32,51],[27,48]],'#F58EA2',{lw:.8,hl:0});
 },
 energy(b){b.sh([[37,4],[13,36],[29,35],[23,60],[51,25],[35,26],[44,4]],'#FFD95E',{k:0,lw:1});sparkles(b,[['spark',10,14,5]])},
 clean(b){bubble(b,25,36,17,{lw:1.2});bubble(b,47,19,10.5,{lw:1.1});bubble(b,49,45,7,{lw:1});sparkles(b,[['spark',10,12,5.5]])},
 bond(b){b.sh(heartP(41,26,27),C.peach,{lw:1});b.sh(heartP(25,38,31),C.rose,{lw:1})},
 coin(b){
  b.sh(E(32,34,24,24,24),C.goldD,{hl:0,hatch:0});
  b.sh(E(32,31,24,24,24),C.gold,{post:''});b.loop(E(32,31,17,17,18),{w:1.4,op:.7});
  paw(b,32,33,6.2,'#EDB84E',{noline:1});sparkles(b,[['spark',52,10,5.5]]);
 },
 feed(b){ // full bowl of kibble
  b.sh(E(32,33,25,6,18),'#E58FA5',{hl:0});
  b.sh([[10,34],[15,26],[24,21],[40,21],[49,26],[54,34]],'#A8682F',{lw:.9,hatch:0,hl:0});
  [[15,30,.3],[22,25,1.2],[30,22.5,.4],[38,23,1.6],[45,27,.8],[50,31,.2],[26,30,.9],[34,28.5,.1],[42,31,1.3],[19,32.5,2],[30,33,.6]].forEach(q=>nugget(b,q[0],q[1],4.3,q[2]));
  b.sh([[7,33],[57,33],[51,52],[13,52]],C.pink,{k:.12});
  b.sh(heartP(32,42,10),'#fff',{hl:0,lw:.6});
 },
 play(b){ // tennis ball + motion lines
  b.sh(E(37,33,21,21,22),'#DDEB7E',{});
  b.ln([[22,18],[31,29],[31,39],[23,49]],{w:3,col:'#fff'});b.ln([[52,18],[43,29],[43,39],[51,49]],{w:3,col:'#fff'});
  b.ln([[22,18],[31,29],[31,39],[23,49]],{w:1.3});b.ln([[52,18],[43,29],[43,39],[51,49]],{w:1.3});
  b.ln([[3,26],[12,26]],{w:2.6});b.ln([[1,34],[11,34]],{w:2.6});b.ln([[4,42],[12,42]],{w:2.6});
 },
 walk(b){paw(b,20,44,7.5,C.wood,{a:-.35,lw:.9});paw(b,44,20,7.5,C.wood,{a:.25,lw:.9})},
 shop(b){
  b.ln([[22,24],[22,15],[27,8],[37,8],[42,15],[42,24]],{w:3.2});
  b.sh([[11,22],[53,22],[56,58],[8,58]],C.pink,{k:0,marks:[{pts:[[10,22],[54,22],[54.5,28],[9.5,28]],fill:'#F28FA5',op:.6}]});
  b.dot(22,26,1.8);b.dot(42,26,1.8);
  b.sh(heartP(32,42,15),'#fff',{hl:0,lw:.7});
 },
 wardrobe(b){
  b.ln([[32,14],[32,8],[35,4.5],[39,6.5]],{w:2.6});
  b.sh([[20,15],[27,13],[32,17],[37,13],[44,15],[57,26],[51,35],[45,31],[45,57],[19,57],[19,31],[13,35],[7,26]],C.blue,{k:0,
   marks:[{pts:[[0,33],[64,33],[64,38],[0,38]],fill:'#8FB8E8',k:0},{pts:[[0,44],[64,44],[64,49],[0,49]],fill:'#8FB8E8',k:0}],det:[[[27,14],[32,21],[37,14]]]});
 },
 house(b){ // dog house
  b.sh([[13,30],[32,14],[51,30],[51,57],[13,57]],C.wood,{k:0,inner:b.st(b.jl(24,28,24,57)+b.jl(40,28,40,57),C.woodD,1.2,.8)});
  b.sh(arch(24,40,57,38),C.door,{base:'#7A5E52',hl:0,hatch:0,lw:.9});
  b.sh([[4,33],[32,6],[60,33],[54,38],[32,17],[10,38]],C.red,{k:0});
 },
 map(b){
  b.sh([[5,13],[22,7],[42,13],[59,7],[59,51],[42,57],[22,51],[5,57]],C.cream,{k:0,
   marks:[{pts:[[22,0],[42,6],[42,64],[22,64]],fill:'#F3E2C3',k:0}],det:[[[22,8],[22,51]],[[42,13],[42,56]]],
   inner:`<path d="M11 46Q18 34 27 38T41 28T47 23" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="3.2 2.8" stroke-linecap="round"/>`});
  b.ln([[46,17],[54,26]],{w:3,col:C.redD});b.ln([[54,17],[46,26]],{w:3,col:C.redD});
  b.sh(cloudP(14,22,5,4.5,6),C.green,{lw:.6,hl:0});
 },
 home(b){
  b.sh([[43,10],[50,10],[50,24],[43,24]],'#E7A58C',{k:0,hl:0});
  b.sh([[12,29],[52,29],[52,57],[12,57]],C.peach,{k:0});
  b.sh([[5,32],[32,7],[59,32]],'#A9C4EE',{k:.02});
  b.sh([[27,57],[27,42],[37,42],[37,57]],C.red,{k:0,hl:0,hatch:0,lw:.9});
  b.sh(heartP(32,37,8),C.pinkD,{lw:.5,hl:0});
 },
 back(b){
  b.sh(ribbon([[54,50],[51,34],[40,25],[24,24]],[10,10,10,10]),C.mint,{k:1/6});
  b.sh([[25,9],[6,25],[26,40]],C.mint,{k:.05});
 },
 close(b){
  const bar=a=>rot(RR(6,26.5,52,11,5.5),a,32,32);
  b.sh(bar(Math.PI/4),'#F59A96',{});b.sh(bar(-Math.PI/4),'#F59A96',{});
 },
 bath(b){
  [[17,25,7],[29,20,9],[43,23,8],[53,28,5]].forEach(q=>b.sh(E(q[0],q[1],q[2],q[2],12),'#EAF5FD',{hl:0,lw:.8}));
  b.ex('glint',25,18,5);
  b.sh([[8,33],[56,33],[53,46],[45,52],[19,52],[11,46]],'#CFE8FA',{k:.12});
  b.sh(RR(4,28,56,7,3),'#FFFFFF',{hl:0,lw:.9});
  b.sh(E(18,55,4.4,3.6,10),C.gold,{hl:0,lw:.7});b.sh(E(46,55,4.4,3.6,10),C.gold,{hl:0,lw:.7});
 },
 sleep(b){
  const cx=25,cy=36,p=[];
  for(let i=0;i<=16;i++){const a=(300-i*240/16)*Math.PI/180;p.push([cx+22*Math.cos(a),cy+22*Math.sin(a)])}
  for(let i=1;i<16;i++){const a=(96+i*168/16)*Math.PI/180;p.push([cx+13.1+19.1*Math.cos(a),cy+19.1*Math.sin(a)])}
  b.sh(p,'#FFE59A',{});
  b.ln([[42,7],[54,7],[42,19],[54,19]],{k:0,w:3});b.ln([[51,26],[58,26],[51,33],[58,33]],{k:0,w:2.4});
 },
 pet(b){
  const T=pts=>rot(pts,-.14,32,40);
  b.ln([[6,14],[3,20]],{w:2,col:GRAPH});b.ln([[9,8],[7,4]],{w:2,col:GRAPH});
  b.sh(T([[19,55],[42,55],[42,62],[19,62]]),C.blue,{k:0,hatch:0,hl:0,lw:.9});
  b.sh(T([[20,56],[17,49],[12,42],[7.5,35.5],[8.5,31],[13,30.5],[18.5,35.5],[21.5,37.5],[20.5,27],[19.5,16],[20.5,12],[23.5,10.5],[26.5,12.5],[27.6,23],
    [28.4,12.5],[29.5,8.4],[32.5,7],[35.5,8.6],[36.4,12.5],[36.6,23],[37.4,14],[38.6,10.6],[41.6,9.8],[44.2,11.8],[44.6,16],[44,27],
    [45.4,21],[47.4,19],[50.2,19.6],[51.4,22.6],[50.6,31],[48.6,42],[45,50],[41,56]]),'#FFD9B8',{k:.13,
    marks:[{pts:T(E(24,44,4.5,3,10)),fill:PINK,op:.35}],det:[T([[27.6,23],[27.9,29]]),T([[36.6,23],[36.6,29.5]]),T([[44,27],[43.6,32]]),T([[24,46],[31,49],[39,46.5]])],dw:1.3});
  b.sh(heartP(54,12,17),C.pinkD,{lw:.8,hl:0});
 },
 'sound-on'(b){
  b.sh([[7,24],[18,24],[32,11],[32,53],[18,40],[7,40]],C.lav,{k:0});
  b.ln([[39,24],[43,32],[39,40]],{w:3});b.ln([[46,16],[53,32],[46,48]],{w:3});
 },
 'sound-off'(b){
  b.sh([[7,24],[18,24],[32,11],[32,53],[18,40],[7,40]],C.lav,{k:0});
  b.ln([[41,24],[56,40]],{w:3.4,col:C.redD});b.ln([[56,24],[41,40]],{w:3.4,col:C.redD});
 },
 lock(b){
  b.sh(ribbon([[20,31],[20,18],[25,11],[32,9],[39,11],[44,18],[44,31]],[6,6,6,6,6,6,6]),'#CFC7C0',{hl:0,hatch:0});
  b.sh(RR(11,28,42,30,6),C.gold,{});
  b.sh([[30,49],[34,49],[33.6,43],[35.6,40],[34,36],[30,36],[28.4,40],[30.4,43]],C.door,{base:C.door,lw:.6,hl:0});
 },
 star(b){b.sh(starP(32,34,27,12.5),'#FFE07A',{k:.06});sparkles(b,[['spark',54,10,4.5]])},
 heart(b){b.sh(heartP(32,33,52),C.rose,{})},
 check(b){b.sh([[5,34],[14,25],[25,36],[50,9],[59,18],[25,54]],'#A8DCA0',{k:0})},
 speed(b){b.sh([[6,13],[31,32],[6,51]],C.orange,{k:.04});b.sh([[29,13],[56,32],[29,51]],C.orange,{k:.04})},
 settings(b){
  b.sh(gearP(32,32,27,20,8),'#C9D3E3',{k:.05});
  b.sh(E(32,32,9,9,14),'#FFFBF3',{base:'#FFFBF3',hl:0,hatch:0,lw:.9});
 }
};

/* ===================================== ITEMS (64) ===================================== */
const ITEMS={
 'Basic Kibble'(b){
  b.sh([[14,17],[50,17],[52,40],[53,56],[48,59],[16,59],[11,56],[12,40]],C.tan,{k:.12,det:[[[17,20],[15,56]],[[47,20],[49,56]]],dw:.9});
  const top=[[13,17],[13,9]];for(let x=13;x<50;x+=4.75)top.push([x+2.4,x%2?6.5:7],[x+4.75,9]);
  b.sh([...top.slice(1),[51,17]].concat([[13,17]]),'#D9A86A',{k:0,hatch:0,hl:0});
  b.sh(RR(17,25,30,25,4),'#FFF8EC',{hatch:0,hl:0,lw:.75});
  b.tx(32,35.5,'KIBBLE',9,{mid:1});
  b.sh(boneP(32,43,15,5.6,0),C.peach,{hatch:0,hl:0,lw:.55});
  b.ex('heart',50,22,2.4);
  kibble(b,54,59,3.3,.4);kibble(b,59,55,3,1.2);kibble(b,8,60,2.8,-.3);
 },
 'Chicken & Rice Bowl'(b){
  b.ln([[25,17],[23,13],[26,9],[24,4]],{col:GRAPH,w:1.3});b.ln([[38,16],[40,12],[37,8],[39,3]],{col:GRAPH,w:1.3});
  bowl(b,32,37,26,6.5,17,C.blue,'#9DBFE6',()=>{
   b.sh([[8,38],[13,29],[23,23],[41,23],[51,29],[56,38]],'#FFFDF6',{hatch:0,hl:0,
    inner:b.st([[16,33],[20,29],[26,32],[44,33],[47,30],[30,27],[22,35],[50,35]].map(p=>b.jl(p[0],p[1],p[0]+2,p[1]-.6,.3)).join(''),GRAPH,.9,.8)});
   b.sh([[20,26],[27,24],[29,29],[22,31]],'#F2C48A',{lw:.6,hl:0,hatch:0});
   b.sh([[35,22],[42,23],[42,28],[35,28]],'#EDB878',{lw:.6,hl:0,hatch:0});
   b.sh([[41,30],[48,30],[47,35],[41,35]],'#F2C48A',{lw:.6,hl:0,hatch:0});
   [[31,31],[16,35],[47,27],[36,34]].forEach(p=>b.sh(E(p[0],p[1],1.9,1.9,8),'#A9D98B',{lw:.45,hl:0,hatch:0,dr:.3}));
  });
 },
 'Salmon Pâté'(b){
  b.sh([[10,26],[54,26],[54,50],[48,55],[32,57],[16,55],[10,50]],'#DCDDE3',{k:.12,
   marks:[{pts:[[0,32],[64,32],[64,48],[0,48]],fill:'#F9C2AE',k:0}],
   inner:b.st(b.jl(10,32,54,32,.3)+b.jl(10,48,54,48,.3),INK,.8,.55)});
  b.sh(E(29,40,8.5,5,14),'#F28C6E',{hatch:0,hl:0,lw:.6,det:[[[25,37],[26.5,40],[25,43]]],dw:.7});
  b.sh([[37,40],[43,35.5],[42,40],[43,44.5]],'#F28C6E',{k:.05,hatch:0,hl:0,lw:.6});
  b.dot(32.5,39,1);b.ex('heart',49,40,2.2);b.ex('dots',14,38,4);
  b.sh(E(32,26,22,6.5,20),'#EEF0F4',{hatch:0,hl:0});
  b.loop(E(32,26,17.5,4.6,18),{w:.9,op:.7});
  b.loop(E(39,25.3,4.5,2.3,10),{w:1});b.dot(35,25.6,1.1);
  b.ex('glint',16,31,5);
 },
 'Bone-shaped Biscuit'(b){
  b.sh(boneP(32,32,52,20,-.4),'#E6B47C',{});
  [[24,34],[30,31],[36,28],[42,26],[28,37],[36,34]].forEach(p=>b.dot(p[0],p[1],1.15,'#9C6236'));
  b.sh(E(13,52,2,1.5,8),'#E6B47C',{lw:.5,hl:0});b.sh(E(18,56,1.4,1.1,8),'#E6B47C',{lw:.5,hl:0});
  sparkles(b,[['spark',54,52,4.2]]);
 },
 'Pupcake'(b){
  b.sh(RR(29.8,6.5,4.8,13,1.5),'#BFD9F5',{hatch:0,hl:0,lw:.7,inner:b.st('M29 9l6 -2M29 13l6 -2M29 17l6 -2','#fff',1.4)});
  b.sh([[32.2,-.2],[35,3.4],[34.8,6],[32.2,7.4],[29.6,6],[29.4,3.4]],'#FFD06B',{hatch:0,hl:0,lw:.7,marks:[{pts:E(32.2,4.8,1.3,2,8),fill:'#F9A35E'}]});
  b.sh([[11,38],[13,31],[19,27],[22,21],[30,17.5],[38,19],[43,24],[48,28],[52,33],[53,38]],'#FFE3EC',{
   det:[[[18,32],[26,29],[34,31],[42,28],[47,32]],[[24,24],[31,22],[38,24]]],dw:1});
  [[17,34,'#7FC7EE'],[23,26,'#FFC94D'],[28,31,'#9CD48A'],[36,27,'#F28FA5'],[41,33,'#7FC7EE'],[46,31,'#FFC94D'],[33,22,'#9CD48A'],[21,36,'#F28FA5']]
   .forEach(([x,y,c])=>b.raw(b.st(b.jl(x,y,x+2.6,y-1.4,.3),c,1.8),'top'));
  b.sh([[14,38],[50,38],[45,59],[19,59]],C.pink,{k:0,det:[[[21,40],[23,57]],[[27,40],[28,58]],[[33,40],[33,58]],[[39,40],[38,58]],[[45,40],[42,57]]],dw:.9});
  b.ex('spark',55,14,4);b.ex('heart',9,20,3);
 },
 'Fresh Water'(b){
  b.sh([[32,4],[39,16],[41,23],[38,29],[32,31],[26,29],[23,23],[25,16]],'#A9D6F5',{});
  b.ex('glint',28,22,4.5);
  bowl(b,32,43,25,6,14,C.mint,'#9ED0C8',()=>{
   b.sh(E(32,43.5,21,4.4,18),'#BFE6FA',{hatch:0,hl:0,lw:.7});
   b.ln([[24,43],[29,42.4],[33,43.4]],{w:.8,col:'#fff'});b.ln([[36,44.5],[40,44]],{w:.8,col:'#fff'});
  });
  b.ex('spark',54,14,4);b.ex('dots',10,22,5);
 },
 'Tennis Ball'(b){
  b.sh(E(32,32,25,25,26),'#DDEB7E',{inner:b.st([[14,22],[20,40],[44,14],[48,38],[30,50],[26,12],[38,30],[16,30],[50,26],[40,46],[24,44]].map(p=>b.jl(p[0],p[1],p[0]+1.2,p[1]+.8,.2)).join(''),'#A9B85A',1,.8)});
  const s1=[[14,13],[25,25],[26,40],[15,52]],s2=[[50,12],[39,24],[38,39],[50,52]];
  b.ln(s1,{w:3.6,col:'#fff'});b.ln(s2,{w:3.6,col:'#fff'});b.ln(s1,{w:.9});b.ln(s2,{w:.9});
 },
 'Rope Tug'(b){
  const path=[[15,46],[24,39.5],[34,32],[43,25],[50,19]];
  const rp=ribbon(path,[16,16,16,16,16]);let marks=[];
  for(let i=0;i<8;i++){const t=i/7,x=15+t*35,y=46-t*27;marks.push({pts:[[x-2,y-12],[x+5.4,y-8],[x+2,y+12],[x-5.4,y+8]],fill:i%2?C.red:'#9ED0C8',k:0})}
  b.sh(rp,'#F6E7CF',{k:1/6,marks,hatch:0,lw:1.15,inner:b.st(marks.map(m=>b.jl(m.pts[0][0],m.pts[0][1],m.pts[2][0],m.pts[2][1],.3)).join(''),INK,.8,.6)});
  b.sh(E(11,51,10,10,16),C.red,{lw:1.15,det:[[[7,44],[10,51],[7.5,58]],[[13,43],[16,51],[13.5,59]]],dw:1});
  b.sh(E(53,14,10,10,16),C.red,{lw:1.15,det:[[[49,7],[52,14],[49.5,21]],[[55,6],[58,14],[55.5,22]]],dw:1});
  [[4,57,1,62],[9,60,8,64],[14,59,15,63.5],[59,8,63,4],[55,4,56,0.5],[62,13,64,12]].forEach(q=>b.ln([[q[0],q[1]],[q[2],q[3]]],{w:1.5}));
 },
 'Squeaky Duck'(b){
  b.sh([[10,38],[16,31],[26,33],[38,31],[50,29],[57,25],[58,34],[55,46],[45,55],[22,55],[12,49]],'#FFE07A',{});
  b.sh([[32,40],[40,36],[48,39],[44,46],[35,46]],'#FFEFB0',{hatch:0,hl:0,lw:.75,det:[[[37,41],[42,42]]],dw:.7});
  b.sh(E(22,23,12,11,18),'#FFE07A',{hatch:0});
  b.sh([[12,22],[3,23],[4,27.5],[12,28]],'#F9A35E',{k:.1,hatch:0,hl:0,lw:.8,det:[[[4,25.3],[11,25.4]]],dw:.6});
  b.dot(19,20,1.9);b.dot(19.6,19.3,.6,'#fff','top');
  b.raw(`<ellipse cx="25" cy="27" rx="3" ry="1.8" fill="${PINK}" opacity=".5"/>`,'top');
  b.ln([[48,14],[52,9]],{w:1.2});b.ln([[53,18],[59,15]],{w:1.2});b.ln([[43,12],[44,6]],{w:1.2});
 },
 'Frisbee'(b){
  b.sh(E(32,37,27,13,22),'#A996DE',{hl:0,hatch:0});
  b.sh(E(32,33,27,13,22),C.lav,{});
  b.loop(E(32,33,18,8.4,18),{w:1,op:.75});
  b.sh(starP(32,33,6.5,3,5),'#FFE07A',{hatch:0,hl:0,lw:.7});
  b.ln([[3,18],[10,15]],{w:1.3,col:GRAPH});b.ln([[6,24],[12,22]],{w:1.3,col:GRAPH});
  b.ex('spark',54,13,4);
 },
 'Plush Bone'(b){
  const bp=boneP(32,33,54,22,.32);
  b.sh(bp,C.pink,{post:`<path d="${cr(bp.map(p=>[32+(p[0]-32)*.84,33+(p[1]-33)*.76]),true,1/6).d}" fill="none" stroke="${INK}" stroke-width=".9" stroke-dasharray="2 2" stroke-opacity=".75"/>`});
  b.dot(28,31,1.6);b.dot(37,34,1.6);
  b.raw(b.st('M30.5 36q2 2 4 .5',INK,1.1),'top');
  b.raw(`<ellipse cx="25" cy="34" rx="2.4" ry="1.4" fill="${PINK}" opacity=".7"/><ellipse cx="40" cy="38.5" rx="2.4" ry="1.4" fill="${PINK}" opacity=".7"/>`,'top');
  b.ex('heart',54,12,3);
 },
 'Puzzle Feeder'(b){
  b.sh(E(32,39,28,19,24),'#96CDB5',{hl:0,hatch:0});
  b.sh(E(32,35,28,19,24),C.mint,{});
  const holes=[[19,29],[32,25],[45,29],[19,41],[32,45],[45,41]];
  holes.forEach(([x,y],i)=>{b.sh(E(x,y,5.4,3.6,12),C.door,{base:'#7A5E52',hatch:0,hl:0,lw:.7,dr:.3});if(i===1||i===3){b.dot(x-1.5,y-.4,1.3,C.kib);b.dot(x+1.4,y+.4,1.3,'#C8874E')}});
  b.sh(E(46,29,5.8,4,12),C.peach,{hatch:0,hl:0,lw:.8,dr:.3});b.dot(48,28,1,INK);
  b.sh(E(32,35,4.4,3,12),'#FFE07A',{hatch:0,hl:0,lw:.8});
  b.ex('spark',57,12,4);
 },
 'Red Bandana'(b){
  b.sh([[3,12],[8,16],[3,19]],C.redD,{k:0,hatch:0,hl:0,lw:.7});b.sh([[61,12],[56,16],[61,19]],C.redD,{k:0,hatch:0,hl:0,lw:.7});
  b.sh([[6,15],[58,15],[32,57]],C.red,{k:.05,marks:[{pts:[[0,10],[64,10],[64,21],[0,21]],fill:C.redD,k:0,op:.55}],
   inner:[[18,27],[30,25],[42,27],[24,36],[36,36],[30,46],[46,21],[14,21]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="2.1" fill="#fff"/>`).join('')+
   `<path d="M9 19.5H55" stroke="#fff" stroke-width="1" stroke-dasharray="2.4 2"/>`});
 },
 'Yellow Raincoat'(b){
  b.sh([[19,16],[21,6],[32,2.5],[43,6],[45,16]],'#F3CB5E',{hatch:0,hl:0,marks:[{pts:E(32,11,8,5.5,12),fill:'#DDB04A'}]});
  b.sh([[16,20],[6,42],[11,46],[18,34]],'#FFE07A',{hl:0});b.sh([[48,20],[58,42],[53,46],[46,34]],'#FFE07A',{hl:0});
  b.sh([[20,15],[44,15],[50,24],[54,46],[52,59],[12,59],[10,46],[14,24]],'#FFE07A',{det:[[[32,16],[32.5,58]]],dw:1});
  b.sh([[24,15],[32,22],[40,15],[36,13],[28,13]],'#F3CB5E',{hatch:0,hl:0,lw:.8});
  [30,39,48].forEach(y=>{b.sh(E(36.5,y,2.6,2.6,10),'#9ED0E8',{hatch:0,hl:0,lw:.6,dr:.3});b.dot(35.8,y,.45);b.dot(37.2,y,.45)});
  b.sh([[17,44],[27,44],[26.5,51],[17.5,51]],'#F3CB5E',{k:0,hatch:0,hl:0,lw:.7,det:[[[17,46.5],[27,46.5]]],dw:.6});
 },
 'Knit Winter Sweater'(b){
  let v='';for(let y=19,row=0;y<52;y+=4.3,row++)for(let x=6+(row%2)*2;x<60;x+=4)v+=`M${R1(x-1.4)} ${R1(y-1.5)}L${x} ${y}L${R1(x+1.4)} ${R1(y-1.5)}`;
  b.sh([[22,9],[28,12],[36,12],[42,9],[54,17],[61,40],[52,43],[48,30],[48,57],[16,57],[16,30],[12,43],[3,40],[10,17]],'#F4A6A0',{k:.05,
   marks:[{pts:[[0,27],[64,27],[64,35],[0,35]],fill:'#FFF2DA',k:0},{pts:[[0,50],[64,50],[64,58],[0,58]],fill:'#E98C88',k:0}],
   inner:`<path d="${v}" fill="none" stroke="#B5605C" stroke-width=".75" stroke-opacity=".55" stroke-linecap="round"/>`+
     b.st([18,22,26,30,34,38,42,46].map(x=>b.jl(x,51,x,57,.2)).join(''),INK,.7,.5)});
  [[20,31],[32,31],[44,31]].forEach(([x,y])=>b.sh(heartP(x,y,6),C.pinkD,{lw:.45,hl:0,hatch:0,dr:.2}));
  b.sh([[3,40],[12,43],[11,47],[2,44]],'#E98C88',{k:0,hl:0,hatch:0,lw:.8});b.sh([[61,40],[52,43],[53,47],[62,44]],'#E98C88',{k:0,hl:0,hatch:0,lw:.8});
  b.sh([[22,9],[28,13],[36,13],[42,9],[39,7],[32,10],[25,7]],'#E98C88',{k:.05,hl:0,hatch:0,lw:.8});
 },
 'Party Hat'(b){
  const marks=[];for(let i=0;i<5;i++){const y=18+i*9;marks.push({pts:[[0,y],[64,y-9],[64,y-5],[0,y+4]],fill:'#FFE07A',k:0})}
  b.sh([[32,8],[51,54],[13,54]],C.lav,{k:.04,marks,inner:[[27,30],[38,37],[30,46],[40,24]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.6" fill="${PINK}"/>`).join('')});
  const ru=[];for(let i=0;i<=8;i++){ru.push([11+i*5.25,i%2?58:55])}
  b.sh([...ru,[53,52],[11,52]],'#FFFFFF',{k:.2,hatch:0,hl:0,lw:.8});
  b.sh(cloudP(32,7,6.5,6,7,.25,36),C.pinkD,{hatch:0,hl:0,lw:.9});
  b.ln([[14,57],[22,62],[32,63],[42,62],[50,57]],{w:.8,col:GRAPH});
  b.ex('spark',8,14,4);b.ex('spark',56,20,3);
 },
 'Heart Sunglasses'(b){
  b.ln([[4,25],[2,18]],{w:1.8});b.ln([[60,25],[62,18]],{w:1.8});
  b.ln([[26,27],[32,24],[38,27]],{w:2.2});
  [17,47].forEach(x=>{b.sh(heartP(x,32,30),C.rose,{hatch:0,hl:0,marks:[{pts:heartP(x,32.6,21),fill:'#E06A8D'}]});
   b.ex('glint',x-7,30,5)});
  b.ex('spark',32,48,3.5);
 },
 'Superhero Cape'(b){
  b.sh([[22,11],[42,11],[47,19],[54,42],[59,58],[47,54],[37,60],[27,54],[15,58],[9,46],[17,19]],C.red,{
   marks:[{pts:[[44,40],[54,42],[59,58],[47,54]],fill:'#F7C46B',op:.9}],det:[[[24,16],[19,40],[18,52]],[[40,16],[45,38],[46,50]]],dw:.9});
  b.sh(starP(32,34,10,4.6),'#FFE07A',{hatch:0,hl:0,lw:.9});
  b.sh([[19,6],[45,6],[46,13],[18,13]],C.redD,{k:.08,hatch:0,hl:0,lw:.9});
  b.ln([[18,10],[11,14]],{w:1.4});b.ln([[46,10],[53,14]],{w:1.4});
 },
 'Flower Crown'(b){
  const cx=32,cy=34,rx=25,ry=15;
  b.loop(E(cx,cy,rx,ry,20),{w:1.7,col:'#8C9B5A'});
  const leaf=(a,front)=>{const x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry,t=Math.atan2(Math.cos(a)*ry,-Math.sin(a)*rx);
    b.sh(leafP(x,y,11,7,t+(front?.35:-.35)),front?C.leaf:'#B4D9A0',{hatch:0,hl:0,lw:.75,dr:.3})};
  const fl=(a,s,col)=>{const x=cx+Math.cos(a)*rx,y=cy+Math.sin(a)*ry;b.sh(flowerP(x,y,s,5,a),col,{hatch:0,hl:0,lw:.85,dr:.3});b.sh(E(x,y,s*.32,s*.32,8),'#FFC94D',{hatch:0,hl:0,lw:.55,dr:.1})};
  [-2.5,-1.5,-.5].forEach(a=>leaf(a,0));fl(-1,5.6,'#FFE3EC');
  [.55,1.6,2.65].forEach(a=>leaf(a,1));
  fl(0,7.6,C.pink);fl(1.08,8.6,'#FFE07A');fl(2.15,7.6,C.lav);
  b.ex('spark',57,10,3.6);
 },
 'Bow Tie'(b){
  const dots=(x0,x1)=>[[x0,26],[x1,34],[(x0+x1)/2,40],[(x0+x1)/2,24]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.7" fill="#fff"/>`).join('');
  b.sh([[30,30],[9,16],[4,32],[9,48],[30,36]],'#8FC1E8',{k:.15,inner:dots(12,20),det:[[[26,30],[14,24]],[[26,35],[14,41]]],dw:.8});
  b.sh([[34,30],[55,16],[60,32],[55,48],[34,36]],'#8FC1E8',{k:.15,inner:dots(46,52),det:[[[38,30],[50,24]],[[38,35],[50,41]]],dw:.8});
  b.sh(RR(26,24,12,16,4),'#6FA9DA',{hatch:0,hl:0});
  b.ex('spark',57,10,3.6);
 }
};

/* ===================================== COLLECTIBLES (60) ===================================== */
const COLS={
 coin(b){b.sh(E(30,33,20,20,22),C.goldD,{hl:0,hatch:0});b.sh(E(30,30,20,20,22),C.gold,{});b.loop(E(30,30,14,14,16),{w:1.1,op:.7});
  b.sh(starP(30,31,8,3.8),'#EDB84E',{noline:1,hatch:0,hl:0});b.ex('spark',50,10,5);b.ex('glint',18,24,5)},
 shell(b){
  const p=[];for(let i=0;i<=40;i++){const a=(200+i*140/40)*Math.PI/180,f=1+.07*(Math.abs(Math.sin(i/40*Math.PI*7))-.5);p.push([30+Math.cos(a)*24*f,47+Math.sin(a)*27*f])}
  p.push([37,47],[39,53],[21,53],[23,47]);
  b.sh(p,'#F9C7B6',{k:.12,det:[-62,-77,-90,-103,-118].map(d=>{const a=d*Math.PI/180;return [[30+Math.cos(a)*4,47+Math.sin(a)*4],[30+Math.cos(a)*21,47+Math.sin(a)*24]]}),dw:1});
  b.ex('spark',51,14,4.5);b.ex('dots',8,14,5);
 },
 leaf(b){
  b.ln([[30,46],[31,52],[34,57]],{w:1.8});
  b.sh([[30,4],[36,13],[43,11],[43,21],[52,25],[45,33],[47,42],[35,40],[30,48],[25,40],[13,42],[15,33],[8,25],[17,21],[17,11],[24,13]],C.orange,{k:.08,
   marks:[{pts:[[30,4],[43,11],[52,25],[47,42],[30,48],[35,20]],fill:'#F6A06A',op:.7}],
   det:[[[30,10],[30,46]],[[30,30],[42,22]],[[30,30],[18,22]],[[30,38],[40,37]],[[30,38],[20,37]]],dw:.9});
 },
 bone(b){b.sh(boneP(30,30,46,17,-.45),C.cream,{});b.ex('spark',50,12,4.5);b.ex('spark',10,47,3)},
 flower(b){
  b.ln([[30,32],[29,44],[30,56]],{w:2,col:'#7FA65E'});
  b.sh(leafP(30,46,12,6,-.6),C.leaf,{hatch:0,hl:0,lw:.8,det:[[[31,45.5],[39,40]]],dw:.6});
  b.sh(flowerP(30,22,15,5,.3),C.pink,{});
  b.sh(E(30,22,5,5,12),'#FFD06B',{hatch:0,hl:0,lw:.8});b.ex('spark',50,10,4);
 },
 acorn(b){
  b.ln([[30,15],[31,9],[35,6]],{w:2});
  b.sh([[18,27],[42,27],[43,35],[39,45],[30,54],[21,45],[17,35]],'#E2A86E',{k:.15});
  let x='';for(let i=0;i<7;i++){x+=b.jl(12+i*5,14,22+i*5,30,.3)+b.jl(48-i*5,14,38-i*5,30,.3)}
  b.sh([[13,29],[15,20],[23,15],[37,15],[45,20],[47,29]],'#B58560',{k:.15,hatch:0,inner:b.st(x,INK,.8,.55)});
  b.ex('spark',51,14,4);
 },
 sniff(b){
  b.sh(cloudP(30,40,20,12,8,.22),'#E3D7F7',{});
  b.ln([[20,28],[17,22],[21,16],[18,9]],{w:1.7,col:'#B48AD8'});b.ln([[30,26],[33,19],[29,13],[32,5]],{w:1.7,col:'#B48AD8'});b.ln([[40,28],[44,22],[40,16],[43,10]],{w:1.7,col:'#B48AD8'});
  b.ex('spark',52,30,3.5);b.ex('heart',8,34,2.6);b.ex('dots',44,46,4);
 },
 puddle(b){
  b.sh([[6,40],[13,33],[25,32],[34,28],[46,30],[54,36],[52,45],[40,48],[30,50],[17,48],[9,46]],'#A9D6F5',{hs:.6});
  b.loop(E(29,40,8,2.4,14),{w:.9,col:'#fff'});b.loop(E(29,40,14,4.6,18),{w:.8,col:'#6F9FC4',op:.6});
  [[14,22],[44,20],[24,18]].forEach(([x,y])=>b.sh([[x,y-3],[x+2,y+.6],[x,y+2],[x-2,y+.6]],'#A9D6F5',{lw:.5,hatch:0,hl:0,dr:.2}));
  b.ex('spark',52,22,3.5);
 },
 dig(b){
  [[8,46,6,42],[11,47,12,41],[52,47,54,41],[49,47,48,42]].forEach(q=>b.ln([[q[0],q[1]],[q[2],q[3]]],{w:1.2,col:'#7FA65E'}));
  b.sh([[5,48],[13,38],[22,32],[38,32],[47,38],[55,48]],C.brown,{k:.15,inner:[[18,42],[30,44],[42,42],[24,38],[36,39]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.3" fill="${INK}" opacity=".45"/>`).join('')});
  b.sh(E(10,50,3,2,8),C.brown,{lw:.5,hl:0,hatch:0});b.sh(E(50,51,2.6,1.8,8),C.brown,{lw:.5,hl:0,hatch:0});
  b.ln([[24,19],[36,31]],{w:3.4,col:C.redD,top:1});b.ln([[36,19],[24,31]],{w:3.4,col:C.redD,top:1});
 }
};

/* ===================================== PROPS (120) ===================================== */
function bigBowl(b,content,deco){
  b.shadow(60,99,48,6);
  bowl(b,60,62,45,12,32,content==='water'?C.blue:C.pink,content==='water'?'#9DBFE6':'#E58FA5',()=>{
   if(content==='empty'){b.sh(E(60,65,34,7,20),'#F4B5C4',{noline:1,hatch:0,hl:0});[[52,64],[66,66],[60,62],[72,63]].forEach(p=>b.dot(p[0],p[1],1.3,'#B07848'))}
   if(content==='full'){b.sh([[18,64],[26,50],[42,41],[60,38],[78,41],[94,50],[102,64],[60,70]],'#A8682F',{hatch:0,hl:0,lw:.8});
     [[24,60,.7],[30,53,.2],[39,47,1],[49,43,.5],[60,41,1.4],[71,43,.3],[81,48,1],[90,54,.6],[96,61,1.9],[35,58,1.2],[45,52,.1],[56,49,.8],[67,50,1.6],[77,55,.4],[86,61,1.1],[42,63,.3],[53,58,1.1],[64,58,.9],[74,63,2.2],[58,65,.5],[31,64,1.7]].forEach(q=>nugget(b,q[0],q[1],5.6,q[2]));}
   if(content==='water'){b.sh(E(60,63,39,8.8,22),C.sky,{hatch:0,hl:0,lw:.7});
     b.ln([[38,62],[48,60.5],[56,62]],{w:1.1,col:'#fff'});b.ln([[64,65],[74,64],[80,65.5]],{w:1.1,col:'#fff'});}
  });
  deco();
}
const PROPS={
 'bowl-empty'(b){bigBowl(b,'empty',()=>{b.tx(60,90,'DOG',17,{mid:1});b.ex('dots',96,30,6);b.ex('plus',22,34,3)})},
 'bowl-full'(b){bigBowl(b,'full',()=>{b.tx(60,90,'DOG',17,{mid:1});b.ex('spark',100,30,6);b.ex('heart',20,30,4.5)})},
 'water-bowl'(b){
  b.sh([[60,8],[67,20],[69,27],[66,32],[60,34],[54,32],[51,27],[53,20]],'#A9D6F5',{});b.ex('glint',57,26,5);
  bigBowl(b,'water',()=>{b.raw(b.st('M44 86q4 -4 8 0t8 0t8 0t8 0','#fff',2.2),'top');b.ex('spark',100,26,6)});
 },
 tub(b){
  b.shadow(60,106,50,6);
  b.ln([[100,48],[100,30],[94,24],[86,26],[86,31]],{w:3.6});
  b.sh(E(100,29,3.5,2.4,8),C.gold,{lw:.6,hl:0,hatch:0});
  [[24,44,11],[38,36,13],[54,33,12],[70,35,13],[86,40,11],[30,30,7],[62,22,8],[47,22,6]].forEach(q=>b.sh(E(q[0],q[1],q[2],q[2]*.92,14),'#F1F8FE',{hl:0,lw:.8}));
  b.sh([[67,22],[71,16],[78,16],[80,21],[84,22],[80,28],[69,28]],'#FFE07A',{k:.15,hl:0,hatch:0,lw:.8});b.sh([[78,18],[82.5,18.5],[79,20.5]],'#F9A35E',{k:0,lw:.5,hl:0,hatch:0});b.dot(76,18.6,.8);
  b.sh([[24,94],[32,94],[33,101],[37,105],[22,105]],C.gold,{k:.1,hl:0,hatch:0,lw:.8});b.sh([[88,94],[96,94],[98,105],[83,105],[87,101]],C.gold,{k:.1,hl:0,hatch:0,lw:.8});
  b.sh([[10,52],[110,52],[107,74],[96,94],[24,94],[13,74]],'#E2EFFA',{k:.12});
  b.sh(RR(5,45,110,10,5),'#FFFFFF',{hl:0,hatch:0});
  b.ex('glint',22,68,8);
  [[16,14,5],[100,12,4],[34,10,3.5]].forEach(q=>bubble(b,q[0],q[1],q[2]));
 },
 bubbles(b){[[42,64,22],[80,40,15],[86,82,11],[30,24,9],[62,98,7],[100,60,6],[16,96,5]].forEach(q=>bubble(b,q[0],q[1],q[2],{lw:.9}));sparkles(b,[['spark',104,20,6],['spark',12,58,4]])},
 zzz(b){
  b.sh(zP(14,64,40,-.12),C.lav,{k:.03});b.sh(zP(58,36,26,-.2),C.blue,{k:.03});b.sh(zP(90,10,17,-.28),C.pink,{k:.03});
  sparkles(b,[['spark',98,48,5],['dots',22,40,6],['spark',62,88,4]]);
 },
 hearts(b){
  b.sh(heartP(50,70,62),C.rose,{});b.sh(heartP(90,38,34),C.peach,{});b.sh(heartP(26,30,24),'#FBC8D4',{});
  sparkles(b,[['spark',100,82,6],['spark',14,64,4.5],['dots',58,18,7]]);
 },
 ball(b){
  b.shadow(60,104,32,6);
  b.sh(E(60,58,38,38,30),'#DDEB7E',{inner:b.st([[30,40],[42,80],[84,32],[88,70],[56,90],[50,26],[70,56],[34,60],[92,50],[72,86],[44,72]].map(p=>b.jl(p[0],p[1],p[0]+2,p[1]+1.2,.3)).join(''),'#A9B85A',1.3,.8)});
  const s1=[[33,30],[48,46],[49,72],[34,88]],s2=[[87,30],[72,45],[71,71],[86,88]];
  b.ln(s1,{w:6,col:'#fff'});b.ln(s2,{w:6,col:'#fff'});b.ln(s1,{w:1.4});b.ln(s2,{w:1.4});
  b.ex('spark',104,18,6);
 },
 frisbee(b){
  b.shadow(62,100,40,6);
  b.sh(E(60,66,48,22,26),'#A996DE',{hl:0,hatch:0});b.sh(E(60,60,48,22,26),C.lav,{});
  b.loop(E(60,60,32,14.5,22),{w:1.4,op:.75});b.loop(E(60,60,20,9,18),{w:1,op:.5});
  b.sh(starP(60,60,11,5,5),'#FFE07A',{hatch:0,hl:0,lw:.8});
  b.ln([[4,34],[16,28]],{w:1.6,col:GRAPH});b.ln([[8,44],[18,40]],{w:1.6,col:GRAPH});b.ex('spark',104,24,6);
 },
 'poop-joke'(b){
  b.sh(cloudP(60,76,42,24,9,.2),'#D3E5BC',{base:'#EDF4E2'});
  b.raw(`<path d="M49 74q3 -3 6 0M65 74q3 -3 6 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/><path d="M53 85q7 -4 14 0" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`,'top');
  [[38,48],[60,44],[82,48]].forEach(([x,y],i)=>b.ln([[x,y],[x+(i%2?4:-4),y-8],[x,y-16],[x+(i%2?4:-4),y-24]],{w:2,col:'#8FAF7A'}));
  [[22,30],[98,26],[100,64]].forEach(([x,y],i)=>{
   b.raw(`<path d="M${x-12} ${y+8}c-6 -10 8 -16 10 -6s-10 10 -4 -4" fill="none" stroke="${GRAPH}" stroke-width="1" stroke-dasharray="2 2.4" stroke-linecap="round" transform="rotate(${i*60} ${x} ${y})"/>`,'top');
   b.sh(E(x-2,y-3.4,2.8,2,8,-.5),'#fff',{hatch:0,hl:0,lw:.5,base:'#fff',top:1});b.sh(E(x+2,y-3.4,2.8,2,8,.5),'#fff',{hatch:0,hl:0,lw:.5,base:'#fff',top:1});
   b.raw(`<ellipse cx="${x}" cy="${y}" rx="2.6" ry="2" fill="${INK}"/>`,'top');
  });
 },
 speech(b){ // stretch-friendly: non-scaling hand strokes instead of filled ribbons
  const body=RR(5,5,190,86,26),tail=[[34,84],[60,86],[14,116]];
  const P=samp(cr(body,true,1/6),4);
  const wob=(pts,a)=>pts.map(p=>[R1(p[0]+(b.r()-.5)*a),R1(p[1]+(b.r()-.5)*a*.6)]);
  const poly=(pts,closed)=>'M'+pts.map(p=>p.join(' ')).join('L')+(closed?'Z':'');
  const run=(pts,s,e)=>{const o=[];for(let i=s;i<=e;i++)o.push(pts[(i+pts.length)%pts.length]);return o};
  const n=P.length,s0=Math.floor(n*.3);
  const ns=`fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
  b.raw(`<path d="${cr(mv(body,3,4),true,1/6).d}" fill="${SHADOW}" opacity=".7"/><path d="${cr([[36,90],[60,90],[17,119]],true,1/6).d}" fill="${SHADOW}" opacity=".7"/>`);
  b.raw(`<path d="${cr(body,true,1/6).d}" fill="${PAPER}"/>`);
  b.raw(`<path d="${poly(wob(run(P,s0,s0+Math.floor(n*.58)),.8))}" ${ns} stroke-width="2.2"/><path d="${poly(wob(run(P,s0+Math.floor(n*.55),s0+n+2),.8))}" ${ns} stroke-width="2.2"/><path d="${poly(wob(run(P,s0+4,s0+n-6),1.6))}" ${ns} stroke-width="1" stroke-opacity=".45"/>`);
  // tail: its own shape, base tucked into the bubble so the joint reads clean
  b.raw(`<path d="M32 86L65 86L62.5 89Q40 104 14 116Q28 104 33.5 89Z" fill="${PAPER}"/><path d="M33.5 88.5Q28.5 103.5 14 116.2Q40.5 104 62.5 88.4" ${ns} stroke-width="2.2"/><path d="M36 90Q30 104 16 114" ${ns} stroke-width="1" stroke-opacity=".4"/>`);
 },
 panel(b){
  const card=[[8,14],[292,11],[294,190],[6,193]];
  const ns=`fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
  const edge=(a,c,j)=>{const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push([R1(a[0]+(c[0]-a[0])*t+(b.r()-.5)*j),R1(a[1]+(c[1]-a[1])*t+(b.r()-.5)*j)])}return 'M'+pts.map(p=>p.join(' ')).join('L')};
  b.raw(`<path d="M12 20L298 17L299 198L10 199Z" fill="${SHADOW}" opacity=".8"/>`);
  b.raw(`<path d="M8 14L292 11L294 190L6 193Z" fill="${PAPER}"/>`);
  let d='';for(let i=0;i<4;i++){const a=card[i],c=card[(i+1)%4],ex=6;const dx=(c[0]-a[0]),dy=(c[1]-a[1]),L=Math.hypot(dx,dy);
    d+=edge([a[0]-dx/L*ex*.6,a[1]-dy/L*ex*.6],[c[0]+dx/L*ex,c[1]+dy/L*ex],1.1)}
  b.raw(`<path d="${d}" ${ns} stroke-width="2"/><path d="${edge([10,16],[290,13],2)+edge([292,14],[293,188],2)}" ${ns} stroke-width="1" stroke-opacity=".4"/>`);
  const tape=(x,y,a,col)=>`<g transform="rotate(${a} ${x} ${y})"><path d="M${x-30} ${y-8}l3 2.6-3 2.6 3 2.6-3 2.6 3 2.6L${x+30} ${y+8}l-3-2.6 3-2.6-3-2.6 3-2.6-3-2.6Z" fill="${col}" fill-opacity=".8"/><path d="M${x-27} ${y-3}H${x+27}M${x-27} ${y+3}H${x+27}" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="5 4"/></g>`;
  b.raw(tape(28,16,-32,'#F7B9C6')+tape(272,14,30,'#BDE7D2'),'top');
 },
 tape(b){
  const top=[[4,6]],bot=[[116,24]];
  for(let i=1;i<=5;i++){top.push([i%2?7:4,6+i*3.6])}
  const right=[];for(let i=0;i<=5;i++)right.push([i%2?113:116,6+i*3.6]);
  b.raw(`<path d="M${top.map(p=>p.join(' ')).join('L')}L${right.slice().reverse().map(p=>p.join(' ')).join('L')}Z" fill="#F7B9C6" fill-opacity=".85"/>`);
  let dots='';for(let x=14;x<108;x+=12)dots+=`<circle cx="${x}" cy="15" r="2.2" fill="#fff" fill-opacity=".75"/><path d="M${x+5} 11l1 1.4 1.6.2-1.2 1 .3 1.6-1.4-.8-1.4.8.3-1.6-1.2-1 1.6-.2z" fill="#FFE59A"/>`;
  b.raw(dots+`<path d="M8 8.5H112M8 21.5H112" stroke="#fff" stroke-opacity=".6" stroke-width="1.6" stroke-dasharray="4 3.5"/><path d="M6 6.5H114" stroke="#E896A8" stroke-opacity=".5" stroke-width=".8"/>`);
 }
};

/* ===================================== HOUSES (240x200) ===================================== */
function ground(b,w){b.shadow(120,191,w,7);b.guide([[16,190.5],[120,189.6],[226,190.6]],false)}
function shingles(b,A,B,rows,gap,spacing){ // scallop rows parallel to the A->B edge, stepping inward by gap
  const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;let nx=-uy,ny=ux;if(ny<0){nx=-nx;ny=-ny}
  let d='';for(let r=1;r<=rows;r++){const o=r*gap;for(let s=(r%2)*spacing/2;s<L-2;s+=spacing){
    const x0=A[0]+ux*s+nx*o,y0=A[1]+uy*s+ny*o,x1=x0+ux*spacing,y1=y0+uy*spacing,mx=(x0+x1)/2+nx*spacing*.42,my=(y0+y1)/2+ny*spacing*.42;
    d+=`M${R1(x0)} ${R1(y0)}Q${R1(mx+(b.r()-.5))} ${R1(my+(b.r()-.5))} ${R1(x1)} ${R1(y1)}`}}
  return d;
}
function bricks(b,x0,y0,x1,y1,bw,bh,col,op){let d='';for(let y=y0+bh,r=0;y<y1;y+=bh,r++){d+=b.jl(x0,y,x1,y,.6);for(let x=x0+(r%2?bw/2:0);x<x1;x+=bw)d+=b.jl(x,y-bh,x,y,.4)}return b.st(d,col||INK,.9,op||.45)}
function tinyFlower(b,x,y,s,col){b.sh(flowerP(x,y,s,5,b.r()),col,{hatch:0,hl:0,lw:.5,dr:.3});b.dot(x,y,s*.3,'#FFC94D')}
function tuft(b,x,y,s){b.ln([[x-s,y],[x-s*1.3,y-s*1.3]],{w:1.1,col:'#7FA65E'});b.ln([[x,y],[x,y-s*1.8]],{w:1.1,col:'#7FA65E'});b.ln([[x+s,y],[x+s*1.4,y-s*1.2]],{w:1.1,col:'#7FA65E'})}
const DOOR_O={base:'#6E544A',hatch:0,hl:0,lw:1.05};
const HOUSES={
 'Cardboard Box'(b){
  ground(b,82);
  b.guide([[50,96],[192,96]]);
  b.sh([[64,104],[76,86],[164,86],[176,104]],'#B88A52',{k:0,hatch:0});
  b.sh([[58,104],[120,104],[104,80],[34,78]],C.card,{k:0,det:[[[38,80],[44,82],[50,80],[56,82],[62,80],[68,82],[74,80],[80,82],[86,80],[92,82],[100,81]]],dw:.8});
  b.sh([[120,104],[182,104],[206,78],[136,80]],C.card,{k:0,det:[[[140,82],[148,80],[156,82],[164,80],[172,82],[180,80],[188,82],[196,80],[203,81]]],dw:.8});
  b.sh([[56,102],[184,102],[187,190],[53,190]],'#D8AE72',{k:0,
   marks:[{pts:[[52,100],[188,100],[188,113],[52,113]],fill:'#EED6A6',k:0,op:.9},{pts:[[150,140],[184,138],[186,190],[150,190]],fill:'#C89C62',k:0,op:.35}],
   inner:b.st(b.jl(52,100.5,188,100.5,.4)+b.jl(52,113,188,113,.4),INK,.8,.5)});
  b.sh(arch(99,139,190,130),C.door,{...DOOR_O,amp:1.6});
  b.ln([[98,150],[94,146]],{w:1});b.ln([[140,160],[144,157]],{w:1});
  // blanket draped over the left flap and corner
  b.sh([[36,80],[62,74],[70,104],[68,128],[60,136],[54,128],[48,132],[46,104]],'#B9D4F3',{
   marks:[{pts:[[30,90],[80,84],[80,90],[30,96]],fill:'#F7B2C4',k:0,op:.8},{pts:[[30,112],[80,106],[80,111],[30,117]],fill:'#F7B2C4',k:0,op:.8},
     {pts:[[52,70],[57,70],[59,140],[54,140]],fill:'#F7B2C4',k:0,op:.6}],
   inner:b.st(b.jl(30,101,80,96,.3)+b.jl(30,124,80,118,.3)+b.jl(46,70,48,140,.3)+b.jl(64,70,66,140,.3),'#fff',1.2,.8)});
  [[50,131],[55,133],[61,136],[66,131]].forEach(([x,y])=>b.ln([[x,y],[x+.4,y+5]],{w:.9}));
  b.tx(161,146,'FRAGILE:',12,{rot:-7,col:'#D9534F'});b.tx(164,166,'DOG',21,{rot:-7,col:'#D9534F'});
  b.raw(b.st('M147 174q16 3 36 -5','#D9534F',1.6),'top');
  b.ln([[82,172],[82,155]],{w:1.4});b.ln([[78,159],[82,154],[86,159]],{w:1.4});
  b.ln([[71,172],[71,155]],{w:1.4});b.ln([[67,159],[71,154],[75,159]],{w:1.4});
  b.tx(76,183,'this way up',8.5,{col:INK,op:.8});
  b.ex('heart',196,60,6);b.ex('spark',28,54,6);b.ex('dots',190,120,6);
  tuft(b,48,190,3.5);tuft(b,194,190,3);
 },
 'Classic Wooden Doghouse'(b){
  ground(b,92);
  b.guide([[120,30],[120,190]]);
  const ytop=x=>96-(68-Math.abs(x-120))*50/68;
  let planks='',grain='';
  for(let x=72;x<188;x+=20){planks+=b.jl(x,ytop(x)+1,x+.6,190,.7)}
  for(let x=60;x<188;x+=20){for(let k=0;k<2;k++){const y=ytop(x+8)+20+b.r()*70;grain+=`M${R1(x+3)} ${R1(y)}q2 6 0 12t1 12`}}
  const knots=[[83,150],[146,170],[164,118],[66,120]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="3" ry="2" fill="none" stroke="${INK}" stroke-width=".8" stroke-opacity=".5"/><ellipse cx="${x}" cy="${y}" rx="5.6" ry="3.6" fill="none" stroke="${INK}" stroke-width=".6" stroke-opacity=".3"/>`).join('');
  b.sh([[52,96],[120,46],[188,96],[188,190],[52,190]],C.wood,{k:0,hl:0,inner:b.st(planks,INK,1.1,.6)+b.st(grain,C.woodD,.9,.8)+knots,
   marks:[{pts:[[52,96],[120,46],[120,60],[52,110]],fill:'#C9935F',k:0,op:.5}]});
  b.sh(arch(94,146,190,123),C.woodD,{hatch:0,hl:0,lw:.9});
  b.sh(arch(99,141,190,128),C.door,DOOR_O);
  b.sh([[120,30],[214,104],[204,115],[120,50],[36,115],[26,104]],C.red,{k:0,
   inner:b.st(shingles(b,[120,30],[214,104],2,6,9)+shingles(b,[120,30],[26,104],2,6,9),INK,.9,.55)});
  b.sh(E(120,32,6,4.5,10),C.redD,{hatch:0,hl:0,lw:.8});
  b.sh(RR(92,100,56,17,3),C.cream,{hatch:0,hl:0,lw:.9});
  b.tx(117,113,'Good Dog',13,{mid:1});b.ex('heart',140,108,2.6);
  b.dot(95,103,1);b.dot(145,103,1);
  b.sh(boneP(70,164,20,8,-.3),C.cream,{hatch:0,hl:0,lw:.7});
  b.ex('spark',212,62,7);b.ex('spark',30,72,5);b.ex('note',204,140,9);
  tuft(b,54,190,4);tuft(b,186,190,3.5);tuft(b,160,191,2.6);
 },
 'Cozy Cottage'(b){
  ground(b,104);
  b.ln([[160,36],[155,28],[163,20],[156,12],[148,14],[152,20]],{w:1.8,col:GRAPH});
  b.sh(cloudP(170,14,9,6,6,.25,30),'#F4F0EC',{lw:.6,hl:0,hatch:0,ink:GRAPH});b.sh(cloudP(186,8,6,4,6,.25,24),'#F4F0EC',{lw:.5,hl:0,hatch:0,ink:GRAPH});
  b.sh([[150,40],[170,40],[170,86],[150,86]],'#E7A58C',{k:0,hl:0,inner:bricks(b,150,40,170,86,10,6,INK,.45)});
  b.sh([[146,36],[174,36],[174,43],[146,43]],'#D88870',{k:0,hl:0,hatch:0,lw:.9});
  b.sh([[36,100],[204,100],[204,190],[36,190]],'#FFE3D3',{k:0,hl:0,
   marks:[{pts:[[30,170],[210,170],[210,195],[30,195]],fill:C.stone,k:0}],
   inner:b.st(b.jl(36,170,204,170,.5)+[44,62,80,150,168,186].map((x,i)=>b.jl(x,170,x+2,190,.5)+b.jl(x-8,180,x+10,180,.5)).join(''),INK,.9,.45)});
  b.sh(arch(96,144,190,118),'#E8DCCB',{hatch:0,hl:0,lw:.9,inner:b.st(b.jl(96,140,102,136,.3)+b.jl(144,140,138,136,.3)+b.jl(120,118,120,124,.3)+b.jl(104,124,108,129,.3)+b.jl(136,124,132,129,.3),INK,.9,.5)});
  b.sh(arch(102,138,190,125),C.door,DOOR_O);
  b.sh([[94,186],[146,186],[149,192],[91,192]],'#CFC7C0',{k:0,hatch:0,hl:0,lw:.8});
  b.sh(E(72,134,18,18,22),'#FFFFFF',{hatch:0,hl:0});
  b.sh(E(72,134,13.5,13.5,20),'#CFE8FA',{hatch:0,hl:0,lw:.8,marks:[{pts:[[58,120],[66,120],[63,134],[58,146]],fill:'#F7B2C4',op:.85},{pts:[[86,120],[78,120],[81,134],[86,146]],fill:'#F7B2C4',op:.85}],
   det:[[[72,120.5],[72,147.5]],[[58.5,134],[85.5,134]]],dw:1.2});
  b.ex('glint',65,131,6);
  b.sh([[50,156],[94,156],[92,170],[52,170]],C.wood,{k:0,hl:0,inner:b.st(b.jl(52,163,92,163,.3),INK,.8,.5)});
  [[56,152,'#F7B2C4'],[64,149,'#FFE07A'],[72,152,C.lav],[80,149,'#F7B2C4'],[88,152,'#FFE07A']].forEach(([x,y,c],i)=>{b.sh(leafP(x,y+5,6,3.4,i%2?-.6:-2.5),C.leaf,{hatch:0,hl:0,lw:.5,dr:.2});tinyFlower(b,x,y,4.2,c)});
  b.sh([[160,126],[190,126],[190,154],[160,154]],'#CFE8FA',{k:0,hl:0,hatch:0,det:[[[175,126],[175,154]],[[160,140],[190,140]]],dw:1});
  b.sh([[150,124],[159,126],[159,154],[150,156]],C.mint,{k:0,hl:0,hatch:0,lw:.8,post:''});b.sh([[200,124],[191,126],[191,154],[200,156]],C.mint,{k:0,hl:0,hatch:0,lw:.8});
  b.sh(heartP(154.5,140,6),'#FFFBF3',{lw:.4,hl:0,hatch:0,dr:.1});b.sh(heartP(195.5,140,6),'#FFFBF3',{lw:.4,hl:0,hatch:0,dr:.1});
  b.sh([[18,102],[120,30],[222,102],[214,110],[26,110]],'#9ED0C8',{k:.03,
   inner:b.st(shingles(b,[120,30],[222,102],4,7,10)+shingles(b,[120,30],[18,102],4,7,10),INK,.9,.5)});
  b.sh(E(120,50,9,9,14),'#FFF2DA',{hatch:0,hl:0,lw:.9,det:[[[120,41.5],[120,58.5]],[[111.5,50],[128.5,50]]],dw:.9});
  [[200,104],[204,118],[198,132],[205,146],[199,160]].forEach(([x,y],i)=>b.sh(leafP(x,y,8,5,i%2?.3:2.8),C.leaf,{hatch:0,hl:0,lw:.5,dr:.2}));
  b.ln([[203,100],[200,118],[204,136],[200,164]],{w:1,col:'#7FA65E'});
  b.sh(heartP(120,111,10),C.pinkD,{lw:.6,hl:0,hatch:0});
  b.ex('spark',22,60,6);b.ex('note',214,58,9);
  tuft(b,32,190,4);tuft(b,210,190,3.5);
 },
 'Snow Igloo'(b){
  ground(b,106);
  const dome=[];for(let i=0;i<=24;i++){const a=Math.PI+i/24*Math.PI;dome.push([120+Math.cos(a)*96,190+Math.sin(a)*108])}
  let rows='';const ys=[176,160,143,125,106,86];
  ys.forEach((y,ri)=>{const hw=96*Math.sqrt(Math.max(0,1-Math.pow((190-y)/108,2)));rows+=b.jl(120-hw,y,120+hw,y,.8);
    const yb=ri?ys[ri-1]:190,hwb=96*Math.sqrt(Math.max(0,1-Math.pow((190-yb)/108,2))),bw=26-ri*2.4;
    for(let x=120-hwb+(ri%2?bw/2:bw*.8);x<120+hwb-6;x+=bw)rows+=b.jl(x,yb,x+(x-120)*.06,y,.4)});
  b.sh(dome,'#E6F1FA',{k:1/6,sh:'#8FB4D4',ho:.5,hl:0,inner:b.st(rows,'#7E9DBA',1,.6)+`<path d="M60 120Q80 96 108 88" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" opacity=".8"/>`});
  b.sh([[82,190],[82,152],[90,134],[104,124],[120,121],[136,124],[150,134],[158,152],[158,190]],'#F2F8FD',{k:.12,hl:0,sh:'#8FB4D4',
   inner:b.st(b.jl(84,160,98,160,.4)+b.jl(142,160,156,160,.4)+b.jl(88,140,100,148,.4)+b.jl(152,140,140,148,.4)+b.jl(120,121,120,132,.4)+b.jl(104,125,108,136,.4)+b.jl(136,125,132,136,.4)+b.jl(92,175,98,175,.3)+b.jl(142,175,148,175,.3),'#7E9DBA',1,.6)});
  b.sh(arch(98,142,190,134),'#4F4A5C',{...DOOR_O,base:'#625B70'});
  b.sh([[104,137.5],[136,137.5],[133,134.6],[120,133.2],[107,134.6]],'#F2F8FD',{k:.2,hatch:0,hl:0,lw:.8,base:'#F2F8FD'});
  [[108,136.5,13],[114,135,17],[126,135,15],[132,136.5,11],[120,134.6,8]].forEach(([x,y,l])=>b.sh([[x-3.2,y],[x+3.2,y],[x+.6,y+l*.6],[x+.2,y+l]],'#9FD3F0',{k:.12,hatch:0,hl:0,lw:1,dr:.2,base:'#DDF1FC',marks:[{pts:[[x-1.6,y+1],[x-.4,y+1],[x,y+l*.6],[x-.6,y+l*.55]],fill:'#fff',k:0}]}));
  b.sh([[12,192],[22,182],[42,184],[58,178],[74,184],[78,192]],'#FFFFFF',{k:.2,hatch:0,hl:0,lw:.8});
  b.sh([[162,192],[170,183],[188,180],[206,184],[220,182],[230,192]],'#FFFFFF',{k:.2,hatch:0,hl:0,lw:.8});
  b.ln([[166,84],[166,60]],{w:1.4});b.sh([[166,60],[184,64],[166,69]],'#F7B2C4',{k:.05,hatch:0,hl:0,lw:.8});
  const flake=(x,y,s)=>{let d='';for(let i=0;i<3;i++){const a=i*Math.PI/3;d+=`M${R1(x-Math.cos(a)*s)} ${R1(y-Math.sin(a)*s)}L${R1(x+Math.cos(a)*s)} ${R1(y+Math.sin(a)*s)}`}b.raw(b.st(d,'#8FB4D4',1.4),'top')};
  flake(30,52,6);flake(212,40,7);flake(54,24,4);flake(196,118,4.5);flake(222,152,3.5);
  b.ex('spark',36,92,6,'#E3F2FC');b.ex('spark',200,90,4.5,'#E3F2FC');
 },
 'Treehouse Den'(b){
  ground(b,96);
  const crown=[[78,66,46,32,C.leaf],[156,60,50,34,C.leaf],[118,40,44,30,'#B4D9A0'],[192,88,28,22,C.leafD],[44,92,28,20,C.leafD]];
  crown.forEach(([x,y,rx,ry,c])=>b.sh(cloudP(x,y,rx,ry,9,.18,54),c,{hl:0,ho:.4,
    inner:b.st([0,1,2,3].map(()=>{const px=x+(b.r()-.5)*rx*1.2,py=y+(b.r()-.5)*ry;return `M${R1(px)} ${R1(py)}q3 -3 6 0`}).join(''),INK,.9,.5)}));
  [[58,50],[96,36],[150,40],[180,62],[130,64],[70,82],[200,80]].forEach(([x,y],i)=>tinyFlower(b,x,y,3.6,i%2?'#FFE3EC':'#F7B2C4'));
  b.sh(ribbon([[146,108],[176,99],[214,95]],[11,8,5]),'#B88C66',{k:1/6,hl:0,hatch:0});
  b.sh([[76,190],[88,174],[92,124],[86,100],[154,100],[148,124],[152,174],[166,190]],'#C69A72',{k:.1,hl:0,
   inner:b.st([96,108,132,144].map(x=>`M${x} 110q-3 20 0 40t-2 36`).join(''),'#8E6446',1,.6)});
  b.sh(arch(95,145,190,134),'#E2BE94',{hatch:0,hl:0,lw:.9});
  b.sh(arch(101,139,190,141),C.door,DOOR_O);
  b.sh(heartP(146,118,8),C.pinkD,{lw:.5,hl:0,hatch:0});
  b.sh([[56,98],[184,98],[184,107],[56,107]],C.wood,{k:0,hl:0,hatch:0,inner:b.st(b.jl(86,98,86,107,.2)+b.jl(120,98,120,107,.2)+b.jl(154,98,154,107,.2),INK,.9,.5)});
  b.sh([[92,99],[92,70],[148,70],[148,99]],'#F2C99E',{k:0,hl:0,inner:b.st(b.jl(92,80,148,80,.4)+b.jl(92,90,148,90,.4),C.woodD,1,.8)});
  b.sh(heartP(120,86,15),'#FFF2DA',{lw:.8,hl:0,hatch:0});
  b.sh([[84,73],[120,46],[156,73],[150,77],[120,56],[90,77]],C.red,{k:0,hl:0});
  b.ln([[120,46],[120,30]],{w:1.2});b.sh([[120,30],[134,34],[120,38]],'#FFE07A',{k:.05,hatch:0,hl:0,lw:.7});
  // ladder
  b.sh(ribbon([[44,190],[66,100]],[4.5,4.5]),C.woodD,{k:0,hl:0,hatch:0,lw:.9});
  b.sh(ribbon([[60,190],[82,100]],[4.5,4.5]),C.woodD,{k:0,hl:0,hatch:0,lw:.9});
  for(let i=1;i<8;i++){const t=i/8,y=190-t*90;b.ln([[44+t*22,y],[60+t*22,y]],{w:2.2})}
  // rope swing
  b.ln([[196,98],[195,160]],{w:1.3,col:'#9C7A50'});b.ln([[212,96],[213,160]],{w:1.3,col:'#9C7A50'});
  b.sh([[188,158],[220,158],[220,165],[188,165]],C.wood,{k:0,hl:0,hatch:0,lw:.9});
  b.ex('spark',224,40,6);b.ex('heart',18,60,5);
  tuft(b,30,190,4);tuft(b,176,190,3.5);
 },
 'Royal Castle Kennel'(b){
  ground(b,112);
  const tower=(x0,x1,col,flag)=>{const cx=(x0+x1)/2;
   b.ln([[cx,22],[cx,5]],{w:1.4});b.sh([[cx,5],[cx+17,9],[cx,13.5]],flag,{k:.08,hatch:0,hl:0,lw:.8});
   b.sh([[x0,84],[x1,84],[x1,190],[x0,190]],C.stone,{k:0,hl:0,inner:bricks(b,x0,84,x1,190,13,10,INK,.4)});
   b.sh(arch(cx-4,cx+4,138,116),C.door,{...DOOR_O,lw:.7});
   b.sh([[x0-7,86],[cx,20],[x1+7,86]],col,{k:.03,inner:b.st(shingles(b,[cx,20],[x0-7,86],5,7,9)+shingles(b,[cx,20],[x1+7,86],5,7,9),INK,.8,.45)});
   b.sh(RR(x0-8,82,x1-x0+16,8,3),'#E58FA5',{hatch:0,hl:0,lw:.8});
  };
  tower(16,62,C.pink,C.teal);tower(178,224,C.pink,'#FFE07A');
  const wall=[[54,190],[54,104]];for(let i=0;i<7;i++){const x=54+i*22;wall.push([x,92],[x+11,92],[x+11,104],[x+22,104])}
  wall.length-=1;wall.push([186,104],[186,92],[186,190]);
  b.sh(wall,C.stone,{k:0,hl:0,inner:bricks(b,54,92,186,190,16,11,INK,.4)});
  b.sh(arch(90,150,190,114),'#D2C8BC',{hatch:0,hl:0,inner:b.st(b.jl(90,150,98,146,.3)+b.jl(150,150,142,146,.3)+b.jl(94,130,102,134,.3)+b.jl(146,130,138,134,.3)+b.jl(108,118,111,126,.3)+b.jl(132,118,129,126,.3),INK,.9,.5)});
  b.sh(arch(98,142,190,124),C.door,DOOR_O);
  [[[89,124],[87,195]],[[151,124],[153,195]]].forEach(([a,c])=>{for(let i=0;i<10;i++){const t=(i+.5)/10,x=a[0]+(c[0]-a[0])*t,y=a[1]+(c[1]-a[1])*t;
    if(i%2)b.ln([[x,y-3.6],[x,y+3.6]],{w:2.2,col:'#6E6E7A'});else b.sh(E(x,y,2.8,4.4,10),'#C9C9D2',{hatch:0,hl:0,lw:.75,dr:.2,base:'#C9C9D2',post:`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="1" ry="2.4" fill="#5E463D"/>`})}});
  b.sh([[96,186],[144,186],[156,199],[84,199]],C.wood,{k:0,hl:0,hatch:0,lw:.9,inner:b.st(b.jl(108,186,103,199,.2)+b.jl(120,186,120,199,.2)+b.jl(132,186,137,199,.2)+b.jl(90,193,150,193,.2),INK,.9,.5)});
  b.sh([[106,114],[103,100],[112,106],[120,96],[128,106],[137,100],[134,114]],C.gold,{k:.04,hatch:0,hl:0,lw:.9});
  b.dot(112,110,1.4,C.pinkD);b.dot(120,109,1.6,'#7FC7EE');b.dot(128,110,1.4,C.pinkD);
  [[64,'#F7B2C4'],[162,'#B9D4F3']].forEach(([x,c])=>{b.sh([[x,106],[x+14,106],[x+14,142],[x+7,135],[x,142]],c,{k:0,hl:0,hatch:0});b.sh(heartP(x+7,121,8),'#fff',{lw:.4,hl:0,hatch:0,dr:.2})});
  b.sh(heartP(76,160,10),'#5E463D',{lw:.6,hl:0,hatch:0,base:'#6E544A'});b.sh(heartP(164,160,10),'#5E463D',{lw:.6,hl:0,hatch:0,base:'#6E544A'});
  b.sh(cloudP(26,184,14,9,7,.2,36),C.leaf,{hl:0,ho:.35});b.sh(cloudP(214,184,14,9,7,.2,36),C.leaf,{hl:0,ho:.35});
  b.ex('spark',120,78,6);b.ex('spark',86,30,5);b.ex('heart',156,36,5);
 }
};

/* ===================================== TREASURE HUNT (v1.1) ===================================== */
const GINK='#A5741F',PARCH='#F4E1B5';
const golden=(b,list)=>list.forEach(([x,y,s])=>b.ex('spark',x,y,s,'#FFE07A'));
// torn map quarters. Shared torn edges are generated in a canonical direction from a per-edge seed,
// so neighbouring quarters fit together on the full map.
const MAPQ={park:{r:0,c:0,tr:['right','bottom']},river:{r:0,c:1,tr:['left','bottom']},woods:{r:1,c:0,tr:['top','right']},beach:{r:1,c:1,tr:['top','left']}};
function tearPts(a,c,seed,amp,step){const r=rng(seed),L=Math.hypot(c[0]-a[0],c[1]-a[1]),n=Math.max(3,Math.round(L/step)),nx=-(c[1]-a[1])/L,ny=(c[0]-a[0])/L,p=[];
  let w=0;for(let i=0;i<n;i++){w=i?w*.25+(r()-.5)*2*amp*(i%2?1:.55):0;p.push([a[0]+(c[0]-a[0])*i/n+nx*w,a[1]+(c[1]-a[1])*i/n+ny*w])}return p}
function quarterPts(q,X0,Y0,X1,Y1,amp,step){
  const Q=MAPQ[q],P=[],torn=[];
  const side=(name,a,c)=>{if(!Q.tr.includes(name)){P.push(a);return}
    const isV=name==='left'||name==='right',rev=name==='left'||name==='bottom',seed=hashS((isV?'v'+Q.r:'h'+Q.c)+':'+R1(isV?Math.abs(c[1]-a[1]):Math.abs(c[0]-a[0])));
    let t=rev?tearPts(c,a,seed,amp,step).concat([a]):tearPts(a,c,seed,amp,step).concat([c]);if(rev)t=t.reverse();
    torn.push(t);t.pop();t.forEach(p=>P.push(p))};
  side('top',[X0,Y0],[X1,Y0]);side('right',[X1,Y0],[X1,Y1]);side('bottom',[X1,Y1],[X0,Y1]);side('left',[X0,Y1],[X0,Y0]);
  return {P,torn};
}
const polyD=(pts,closed)=>'M'+pts.map(p=>R1(p[0])+' '+R1(p[1])).join('L')+(closed?'Z':'');
function pine(b,x,y,s){b.ln([[x,y+s*.9],[x,y+s*1.35]],{w:s*.3,col:'#8E6446'});
  b.sh([[x,y-s*.2],[x+s*.85,y+s*.95],[x-s*.85,y+s*.95]],'#7FB38E',{k:.05,hatch:0,hl:0,lw:.6,dr:.3});
  b.sh([[x,y-s*1.05],[x+s*.65,y+s*.25],[x-s*.65,y+s*.25]],'#8CC09A',{k:.05,hatch:0,hl:0,lw:.6,dr:.3})}
function tree(b,x,y,s){b.ln([[x,y+s*.5],[x+s*.05,y+s*1.35]],{w:s*.32,col:'#8E6446'});b.sh(cloudP(x,y,s,s*.85,6,.22,30),C.leaf,{hatch:0,hl:0,lw:.6,dr:.3})}
// draws one quarter of the old map inside the box; s = content scale (1 for the 64px item)
function drawQuarter(b,q,X0,Y0,X1,Y1,s,o={}){
  const {P,torn}=quarterPts(q,X0,Y0,X1,Y1,o.amp||2.6*s,o.step||2.5*s),W=X1-X0,H=Y1-Y0,X=u=>X0+u*W,Y=v=>Y0+v*H;
  const marks=[],inner=[];
  if(q==='river'){const rp=ribbon([[X(.18),Y(-.1)],[X(.34),Y(.32)],[X(.62),Y(.56)],[X(1.1),Y(.62)]],[8*s,8.5*s,9*s,9*s]);
    marks.push({pts:rp,fill:'#BFE3F5'});
    inner.push(b.st([[.3,.2],[.45,.45],[.7,.56],[.86,.6]].map(([u,v])=>`M${R1(X(u)-2.4*s)} ${R1(Y(v))}q${R1(1.2*s)} ${R1(-1.4*s)} ${R1(2.4*s)} 0t${R1(2.4*s)} 0`).join(''),'#6FA3C8',.9*Math.min(1.4,s),.9))}
  if(q==='beach'){marks.push({pts:[[X(.5),Y(1.1)],[X(.66),Y(.78)],[X(.86),Y(.6)],[X(1.1),Y(.48)],[X(1.1),Y(1.1)]],fill:'#BFE3F5'});
    marks.push({pts:[[X(.42),Y(1.1)],[X(.58),Y(.74)],[X(.82),Y(.52)],[X(1.1),Y(.4)],[X(1.1),Y(.5)],[X(.86),Y(.62)],[X(.66),Y(.8)],[X(.5),Y(1.1)]],fill:'#F7E3A0',op:.9});
    inner.push(b.st(`M${R1(X(.6))} ${R1(Y(.92))}q${R1(3*s)} ${R1(-3*s)} ${R1(6*s)} ${R1(-3.6*s)}M${R1(X(.78))} ${R1(Y(.8))}q${R1(3*s)} ${R1(-2.6*s)} ${R1(6*s)} ${R1(-3*s)}`,'#fff',1.2*Math.min(1.4,s)));
    inner.push([[.2,.35],[.3,.6],[.14,.78],[.45,.3],[.36,.82],[.55,.5]].map(([u,v])=>`<circle cx="${R1(X(u))}" cy="${R1(Y(v))}" r="${R1(.7*s)}" fill="#C9A36A"/>`).join(''))}
  inner.push(b.st(torn.map(t=>polyD(t)).join(''),'#D3AE72',3.4*s,.7));
  inner.push(`<circle cx="${R1(X(q==='woods'||q==='park'?.72:.3))}" cy="${R1(Y(q==='park'||q==='river'?.72:.3))}" r="${R1(6*s)}" fill="none" stroke="#D7B97E" stroke-width="${R1(1.2*s)}" stroke-opacity=".3"/>`);
  b.sh(P,PARCH,{k:0,marks,inner:inner.join(''),hl:0,base:'#FBEFD2',sh:'#C9A46A',ho:.35,lw:o.lw||1});
  if(q==='park'){tree(b,X(.3),Y(.32),6.5*s);tree(b,X(.56),Y(.22),5*s);tree(b,X(.1),Y(.84),4.2*s);
    b.sh(E(X(.8),Y(.34),6*s,3.4*s,12),'#BFE3F5',{hatch:0,hl:0,lw:.6,dr:.3})}
  if(q==='river'){const bx=X(.48),by=Y(.44),ang=Math.atan2(.24*H,.28*W)+Math.PI/2,L=8*s,T2=2.4*s,R=pp=>rot(pp,ang,bx,by);
    b.sh(R([[bx-L,by-T2],[bx+L,by-T2],[bx+L,by+T2],[bx-L,by+T2]]),'#EBC795',{k:0,hatch:0,hl:0,lw:.55,dr:.15,inner:b.st([-.5,0,.5].map(f=>{const a=R([[bx+L*f,by-T2],[bx+L*f,by+T2]]);return polyD(a)}).join(''),INK,.6*Math.min(1.5,s),.6)});
    b.ln(R([[bx-L-1*s,by-T2-.9*s],[bx+L+1*s,by-T2-.9*s]]),{w:1.1*Math.min(1.5,s)});b.ln(R([[bx-L-1*s,by+T2+.9*s],[bx+L+1*s,by+T2+.9*s]]),{w:1.1*Math.min(1.5,s)});
    const cx=X(.8),cy=Y(.24);b.sh(starP(cx,cy,5*s,1.6*s,4),'#FFFBF3',{k:0,hatch:0,hl:0,lw:.55,dr:.1});if(o.label)b.tx(R1(cx),R1(cy-6.6*s),'N',R1(5*s),{mid:1})}
  if(q==='woods'){pine(b,X(.17),Y(.34),6*s);pine(b,X(.36),Y(.22),4.6*s);pine(b,X(.3),Y(.62),5.2*s);pine(b,X(.13),Y(.8),4.6*s);
    b.ln([[X(.55),Y(.9)],[X(.55),Y(.84)]],{w:1.4*Math.min(1.5,s),col:'#E9D7BE'});b.sh([[X(.55)-3.2*s,Y(.85)],[X(.55),Y(.85)-3.2*s],[X(.55)+3.2*s,Y(.85)]],'#F08A86',{k:.3,hatch:0,hl:0,lw:.5,dr:.1})}
  if(q==='beach'){b.sh(starP(X(.86),Y(.22),4.2*s,1.9*s),'#F9B97A',{k:.15,hatch:0,hl:0,lw:.55,dr:.2});
    b.sh(shellP(X(.6),Y(.2),3.4*s),'#F9C7B6',{k:.12,hatch:0,hl:0,lw:.5,dr:.1})}
  if(o.label){const lp={park:[.74,.9],river:[.25,.85],woods:[.84,.48],beach:[.72,.44]}[q];b.tx(R1(X(lp[0])),R1(Y(lp[1])),q[0].toUpperCase()+q.slice(1),R1(6.5*s),{mid:1,op:.85})}
  return P;
}
function mapItem(b,q){const box={park:[6,7,56,57],river:[8,7,58,57],woods:[6,7,56,57],beach:[8,7,58,57]}[q];drawQuarter(b,q,box[0],box[1],box[2],box[3],1);
  const sp={park:[10,60],river:[54,60],woods:[59,8],beach:[5,8]}[q];b.ex('spark',sp[0]>32?sp[0]-2:sp[0]+1,sp[1]>32?sp[1]-1:sp[1]+1,3.6,'#FFE07A')}
function shellP(cx,cy,R){const p=[];for(let i=0;i<=30;i++){const a=(200+i*140/30)*Math.PI/180,f=1+.07*(Math.abs(Math.sin(i/30*Math.PI*7))-.5);p.push([cx+Math.cos(a)*R*f,cy+Math.sin(a)*R*1.1*f])}
  p.push([cx+R*.28,cy],[cx+R*.36,cy+R*.22],[cx-R*.36,cy+R*.22],[cx-R*.28,cy]);return p}
function nugget(b,x,y,s,a){const pts=[];for(let i=0;i<7;i++){const t=a+i/7*Math.PI*2,f=.82+b.r()*.32;pts.push([x+Math.cos(t)*s*f,y+Math.sin(t)*s*.8*f])}
  const col=['#B9773F','#A8682F','#C6854A'][Math.floor(b.r()*3)];
  b.sh(pts,col,{base:col,hatch:0,hl:0,lw:.5,dr:.12,ink:'#6A3E20',marks:[{pts:E(x-s*.28,y-s*.3,s*.36,s*.2,8,a),fill:'#E7AD74',op:.9}]})}
const TREASURE={
 'Acorn Cap'(b){
  b.ln([[10,46],[18,56],[32,60],[46,56],[54,46]],{w:1,col:GRAPH});
  b.ln([[32,17],[33,10],[38,6]],{w:2.4,col:'#7A5A3A'});
  b.sh(leafP(36,10,14,7.5,-.45),C.leaf,{hatch:0,hl:0,lw:.7,det:[[[37,9.6],[48,4.8]]],dw:.6});
  let x='';for(let i=0;i<10;i++){x+=b.jl(2+i*6,14,14+i*6,44,.3)+b.jl(62-i*6,14,50-i*6,44,.3)}
  b.sh([[8,42],[10,30],[19,20],[32,16],[45,20],[54,30],[56,42]],'#B58560',{k:.15,inner:b.st(x,INK,.8,.5)});
  b.sh(RR(5,39,54,9,4.5),'#9C6E4C',{hatch:0,hl:0});
  golden(b,[[9,14,4.5],[57,56,3.5]]);
 },
 'Explorer Goggles'(b){
  b.sh(ribbon([[1,31],[16,26],[32,27],[48,26],[63,31]],[7,7,7,7,7]),'#B07A52',{hatch:0,hl:0,lw:.8,post:'<path d="M3 31.5Q17 26.5 32 27.5T61 31.5" fill="none" stroke="#F4DCC2" stroke-width=".9" stroke-dasharray="2 2"/>'});
  b.sh(RR(28,28,8,6,2),'#E3B65A',{hatch:0,hl:0,lw:.7});
  [18,46].forEach(x=>{b.sh(E(x,32,13,13,20),'#EBC46A',{hl:0,ink:'#6B4A2A'});
   b.sh(E(x,32,8.6,8.6,16),'#9ED8D2',{hatch:0,hl:0,lw:.7,marks:[{pts:[[x-9,30],[x+3,22],[x+9,22],[x-6,36]],fill:'#D7F1EE',op:.8}]});
   [[-10.5,-3],[10.5,-3],[0,-10.8],[0,10.8]].forEach(([dx,dy])=>b.dot(x+dx,32+dy,.9,'#8A6328'));b.ex('glint',x-4,31,4.5)});
  golden(b,[[56,12,4],[8,52,3.2]]);
 },
 'Seashell Necklace'(b){
  b.ln([[8,5],[9,21],[16,35],[24,43],[32,45],[40,43],[48,35],[55,21],[56,5]],{w:1.3,col:'#9C7A50'});
  [[10,19],[14,30],[20,39],[44,39],[50,30],[54,19]].forEach(([x,y])=>b.sh(E(x,y,2.8,2.8,10),'#FFFDF8',{hatch:0,hl:0,lw:.55,dr:.2,base:'#FFFDF8'}));
  [[12,25,'#9ED8D2'],[17,35,'#F9B5A0'],[47,35,'#F9B5A0'],[52,25,'#9ED8D2'],[26,43.5,'#FFE07A'],[38,43.5,'#FFE07A']].forEach(([x,y,c])=>b.sh(E(x,y,1.9,1.9,8),c,{hatch:0,hl:0,lw:.45,dr:.1}));
  b.loop(E(32,47,2.4,2.4,10),{w:1.1});
  b.sh(shellP(32,61,12),'#F9C7B6',{k:.12,det:[-62,-76,-90,-104,-118].map(d=>{const a=d*Math.PI/180;return [[32+Math.cos(a)*3,61+Math.sin(a)*3],[32+Math.cos(a)*10.5,61+Math.sin(a)*11.5]]}),dw:.8});
  golden(b,[[52,48,3.6],[11,48,3]]);
 },
 'Mossy Poncho'(b){
  b.sh([[22,12],[42,12],[50,24],[59,44],[54,50],[46,47],[38,53],[26,53],[18,47],[10,50],[5,44],[14,24]],'#A9CF8A',{k:.1,
   marks:[{pts:cloudP(20,36,7,5,6,.3,24),fill:'#8DBE72'},{pts:cloudP(44,28,6,4.5,6,.3,24),fill:'#8DBE72'},{pts:cloudP(36,45,6,4,6,.3,24),fill:'#8DBE72'},{pts:cloudP(13,46,4,3,5,.3,20),fill:'#C3E0A8'}],
   det:[[[25,16],[19,40]],[[39,16],[45,40]]],dw:.8});
  b.sh(E(32,13,9,4.2,14),'#7FA65E',{hatch:0,hl:0,lw:.8});
  [[9,50],[13,49],[17,47.5],[21,49.5],[25,52.5],[30,53.2],[35,53.2],[39,52],[43,48.6],[47,47.5],[51,49],[55,50]].forEach(([x,y])=>b.ln([[x,y],[x+.4,y+5]],{w:.9,col:'#6E8E4A'}));
  b.ln([[46,40],[46,36]],{w:1.1,col:'#E9D7BE'});b.sh([[42.6,37],[46,33],[49.4,37]],'#F08A86',{k:.3,hatch:0,hl:0,lw:.55,dr:.1});
  b.sh(leafP(20,24,7,4,-1),C.leaf,{hatch:0,hl:0,lw:.5,dr:.1});
  golden(b,[[56,14,4],[7,22,3]]);
 },
 'Clover Collar'(b){
  b.sh(ribbon([[7,22],[18,14],[32,12],[46,14],[57,22]],[4.5,4.5,4.5,4.5,4.5]),'#6FB06A',{hatch:0,hl:0,lw:.8,ink:GINK});
  b.sh(ribbon([[6,21],[13,31],[32,37],[51,31],[58,21]],[8.5,8.5,8.5,8.5,8.5]),'#94D58E',{ink:GINK,sh:'#5E9A58'});
  [[14,31],[22.5,35],[41.5,35],[50,31]].forEach(([x,y])=>b.sh(E(x,y,1.9,1.9,8),C.gold,{ink:GINK,lw:.5,hatch:0,hl:0,dr:.1}));
  b.loop(E(32,42,2.8,2.8,10),{w:1.3,col:GINK});
  b.ln([[32,53],[35,58],[39,61]],{w:1.4,col:'#6FB06A'});
  for(let k=0;k<4;k++)b.sh(rot(heartP(32,47.2,10.5,18),k*Math.PI/2,32,52.5),k%2?'#86CF7F':'#7AC373',{ink:GINK,lw:.7,hatch:0,hl:0,dr:.25});
  b.dot(32,52.5,1.2,C.gold);
  golden(b,[[54,46,5],[9,46,4],[48,6,3.5],[20,58,3]]);b.ex('glint',27,46,3.5);
 },
 'Wild Berries'(b){
  b.ln([[44,6],[38,16],[30,26]],{w:1.8,col:'#7A6A3A'});b.ln([[38,16],[48,22]],{w:1.4,col:'#7A6A3A'});
  b.sh(leafP(41,12,13,7,-.2),C.leaf,{hatch:0,hl:0,lw:.7,det:[[[42,11.8],[53,10]]],dw:.55});
  b.sh(leafP(32,22,12,6.5,2.6),C.leafD,{hatch:0,hl:0,lw:.7});
  [[22,38,9.5,'#EF7B86'],[38,40,9,'#8E8FD8'],[29,52,8.5,'#8E8FD8'],[46,27,7,'#EF7B86'],[14,52,6.5,'#B26BB8']].forEach(([x,y,r,c])=>{
   b.sh(E(x,y,r,r,16),c,{hl:0});b.ex('glint',x-r*.45,y-r*.1,r*.55);
   if(c==='#EF7B86')[[.3,.3],[-.3,.4],[0,-.3],[.4,-.2]].forEach(([dx,dy])=>b.dot(x+dx*r,y+dy*r,.7,'#FFF2DA'));
   else b.raw(b.st(`M${x-1.6} ${R1(y-r*.6)}l3.2 2M${x+1.6} ${R1(y-r*.6)}l-3.2 2`,INK,.9),'top')});
  golden(b,[[56,46,4],[8,24,3.2]]);
 },
 "Duck's Picnic Sandwich"(b){
  b.sh(RR(8,44,48,10,5),'#EBC283',{hatch:0,marks:[{pts:[[0,50],[64,50],[64,56],[0,56]],fill:'#D9A867',k:0}]});
  const lw=[[6,44]];for(let i=0;i<9;i++)lw.push([9+i*6,i%2?47:41.5]);lw.push([58,43],[57,47],[7,47]);
  b.sh(lw,'#A9D98B',{k:.2,hatch:0,hl:0,lw:.8});
  b.sh(RR(10,35.5,44,6,3),'#F08A86',{hatch:0,hl:0,lw:.8,det:[[[22,38.5],[26,38.5]],[[38,38.5],[42,38.5]]],dw:.6});
  b.sh([[9,31],[55,31],[55,36.5],[45,36.5],[42,42],[39,36.5],[9,36.5]],'#FFD95E',{k:.05,hatch:0,hl:0,lw:.8});
  b.sh([[7,32],[8,22],[16,15],[32,13],[40,13.6],[42,17.5],[46.5,16.6],[48.5,20.6],[53,20.6],[57,25],[57,32]],'#F6D7A0',{k:.12});
  [[18,22],[26,18],[32,24],[22,28],[40,22],[46,27]].forEach(([x,y])=>b.raw(`<ellipse cx="${x}" cy="${y}" rx="1.3" ry=".8" fill="#FFF8EA" stroke="${INK}" stroke-width=".4"/>`,'top'));
  b.ln([[26,24],[26,4]],{w:1.4,col:'#B58560'});b.sh([[26,3],[37,6],[26,9]],'#FFE07A',{k:.05,hatch:0,hl:0,lw:.6,dr:.2});
  b.sh(leafP(50,42,12,4.6,-.9),'#FFFFFF',{hatch:0,hl:0,lw:.6,base:'#FFFFFF',det:[[[50.5,41.3],[57,32]]],dw:.45});
  golden(b,[[58,10,3.6]]);
 },
 'Golden Bone'(b){
  b.raw('<ellipse cx="32" cy="33" rx="30" ry="22" fill="#FFF1B8" opacity=".55"/><ellipse cx="32" cy="33" rx="22" ry="15" fill="#FFE9A0" opacity=".45"/>','under');
  const bp=boneP(32,33,52,20,-.4);
  b.sh(bp,'#FFD56B',{ink:'#8E5F1C',sh:'#C98E22',ho:.55,hlo:.65,marks:[{pts:rot([[14,27],[50,27],[50,29.5],[14,29.5]],-.4,32,33),fill:'#FFF3C4',k:0,op:.9}]});
  b.ln(rot([[20,36],[44,36]],-.4,32,33),{w:.9,col:'#C98E22',op:.8});
  golden(b,[[54,10,6],[10,54,4.5],[58,46,3.4],[8,14,3.2]]);b.ex('glint',18,28,4);b.ex('glint',47,22,3.4);
 },
 'Driftwood Stick'(b){
  b.sh(ribbon([[30,36],[35,45],[34,52]],[5,4,2.5]),'#D9C7AE',{k:1/6,hatch:0,hl:0,lw:.8});
  const main=ribbon([[6,50],[22,41],[38,30],[57,17]],[7.5,8.5,7.5,5]);
  b.sh(main,'#DCCBB2',{k:1/6,sh:'#9E8B72',inner:b.st(b.jl(8,49,55,18,.5)+b.jl(10,51.5,52,21,.5)+b.jl(12,46.5,50,17,.5),'#A08C70',.8,.8)+
   '<ellipse cx="26" cy="38.5" rx="2.6" ry="1.6" transform="rotate(-33 26 38.5)" fill="none" stroke="#7A6A52" stroke-width=".8"/>'});
  [[44,25],[46.5,24],[45,27.5]].forEach(([x,y])=>b.sh(E(x,y,1.3,1.3,8),'#FFFFFF',{hatch:0,hl:0,lw:.4,dr:.1}));
  b.ln([[14,47],[11,54],[15,59],[12,63]],{w:1.4,col:'#7FA65E'});
  golden(b,[[56,52,4],[10,16,3.2]]);
 },
 'Rubber Chicken'(b){
  b.ln([[37,48],[35,58]],{w:1.4,col:'#E58C4A'});b.ln([[32,59],[35,58],[37,61]],{w:1.2,col:'#E58C4A'});
  b.ln([[45,48],[47,57]],{w:1.4,col:'#E58C4A'});b.ln([[44,59],[47,57],[49,60]],{w:1.2,col:'#E58C4A'});
  b.sh([[54,33],[61,26],[61,34],[56,40]],'#FFE58A',{k:.1,hatch:0,hl:0,lw:.8});
  b.sh(cloudP(14,11,5.5,3.6,5,.45,24),'#F08A86',{hatch:0,hl:0,lw:.7});
  b.sh(ribbon([[30,38],[22,31],[16,21]],[8,7,6]),'#FFE58A',{k:1/6,hatch:0,hl:0});
  b.sh(E(41,40,16,10,20,-.2),'#FFE58A',{det:[[[34,38],[42,35],[49,38]]],dw:.8});
  b.sh(E(15,18,7.4,6.6,14),'#FFE58A',{hatch:0,hl:0});
  b.sh([[9,16],[1,16.5],[8.6,18.6]],'#F9A35E',{k:0,hatch:0,hl:0,lw:.6,dr:.1});b.sh([[9,19.6],[2,22],[8.4,21.8]],'#F9A35E',{k:0,hatch:0,hl:0,lw:.6,dr:.1});
  b.sh(E(10.5,25,1.8,2.8,8),'#F08A86',{hatch:0,hl:0,lw:.5,dr:.1});
  b.raw(b.st('M14 14.6l3 3M17 14.6l-3 3',INK,1.1),'top');
  b.tx(46,14,'HONK!',10,{rot:-10});b.ln([[33,8],[36,4]],{w:1});b.ln([[37,11],[41,9]],{w:1});
  golden(b,[[58,52,3.6]]);
 },
 'Glow Ball'(b){
  b.raw('<circle cx="32" cy="32" r="30" fill="#FFF6B8" opacity=".35"/><circle cx="32" cy="32" r="24" fill="#FFF1A0" opacity=".4"/><circle cx="32" cy="32" r="19.5" fill="#FDEB8A" opacity=".45"/>','under');
  let rays='';for(let i=0;i<12;i++){const a=i/12*Math.PI*2+.13,r0=21+(i%2)*2,r1=r0+4+(i%3);rays+=b.jl(32+Math.cos(a)*r0,32+Math.sin(a)*r0,32+Math.cos(a)*r1,32+Math.sin(a)*r1,.2)}
  b.raw(b.st(rays,'#E8B84A',1.3,.85),'under');
  b.sh(E(32,32,15,15,20),'#E2F590',{base:'#FBFFE0',sh:'#A9C85A',ho:.35,marks:[{pts:ribbon([[18,26],[28,31],[38,30],[47,36]],[4,4.5,4.5,4]),fill:'#C3E66A'}]});
  b.ex('glint',25,27,6);golden(b,[[54,10,4.5],[10,54,3.6],[8,12,3]]);
 },
 'Lucky Penny'(b){
  b.sh(E(32,35,22,22,24),'#BE6C40',{hl:0,hatch:0});
  b.sh(E(32,32,22,22,24),'#E8A273',{sh:'#B5653B'});
  b.loop(E(32,32,16.5,16.5,18),{w:1.2,op:.6});
  for(let k=0;k<4;k++)b.sh(rot(heartP(32,27.6,8.4,16),k*Math.PI/2,32,32),'#D4895A',{noline:1,hatch:0,hl:0,dr:.1});
  b.dot(32,32,1.2,'#B5653B');
  b.ex('glint',18,24,5);golden(b,[[52,10,5],[10,54,3.4]]);
 },
 'Sparkle Stone'(b){
  b.raw('<circle cx="32" cy="34" r="30" fill="#EDE3FC" opacity=".55"/><circle cx="32" cy="34" r="23" fill="#E2D5FA" opacity=".55"/><circle cx="32" cy="34" r="17" fill="#D9C9F7" opacity=".5"/>','under');
  b.raw(`<ellipse cx="32" cy="34" rx="28" ry="9" transform="rotate(-18 32 34)" fill="none" stroke="#B9A6E8" stroke-width="1.1" stroke-dasharray="1.5 3" stroke-linecap="round"/>`,'under');
  b.sh([[20,27],[27,16],[39,15],[47,25],[44,43],[32,52],[21,44]],'#C6B2EE',{k:.04,sh:'#8E78D0',
   marks:[{pts:[[27,16],[39,15],[42,24],[25,25]],fill:'#E6DCFC',k:0},{pts:[[42,24],[47,25],[44,43],[32,52],[34,32]],fill:'#A893DE',k:0,op:.8}],
   det:[[[25,25],[42,24]],[[25,25],[34,32],[42,24]],[[34,32],[32,51]],[[20,27],[25,25]],[[47,25],[42,24]]],dw:.8});
  b.ex('glint',27,21,4);
  b.ex('spark',53,13,5,'#F3EDFF');b.ex('spark',10,48,4,'#FFE07A');b.ex('spark',56,52,3,'#F9C7D6');b.ex('plus',11,14,2.2);b.ex('dots',50,40,4);
 },
 'Coat Collector Ribbon'(b){ // neck-charm rosette: scalloped pastel rosette, stitched edge, two tails, paw swatch
  const scal=(cx,cy,R,r,n)=>{const p=[];for(let i=0;i<n*4;i++){const a=i/(n*4)*Math.PI*2-Math.PI/2,q=Math.abs(Math.sin(i/(n*4)*Math.PI*n)),rr=r+(R-r)*Math.pow(q,.6);p.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}return p};
  b.raw('<circle cx="32" cy="29" r="30" fill="#FDE3EC" opacity=".5"/><circle cx="32" cy="29" r="24" fill="#F9D3E3" opacity=".45"/>','under');
  b.sh([[24,36],[14,60],[21,56.5],[26,62],[33,40]],'#C6B2EE',{k:.06,sh:'#8E78D0',hatch:1,det:[[[25,41],[20,54]]],dw:.7});
  b.sh([[40,36],[50,60],[43,56.5],[38,62],[31,40]],'#F7A1B5',{k:.06,sh:'#D9708E',det:[[[39,41],[44,54]]],dw:.7});
  b.sh(scal(32,28,22,19,12),'#F9B8CF',{k:.05,sh:'#E58AA8'});
  b.sh(E(32,28,15.5,15.5,22),'#FFE3EA',{hatch:0,hl:0,lw:.8,base:'#FFF3F6',marks:[{pts:E(26.5,22.5,7,5,10,-.6),fill:'#FFFFFF',op:.6}]});
  b.raw('<circle cx="32" cy="28" r="13" fill="none" stroke="#C9627F" stroke-width="1" stroke-dasharray="2 2.6" stroke-linecap="round" opacity=".8"/>','top');
  b.raw('<circle cx="32" cy="28" r="20.2" fill="none" stroke="#B94E6F" stroke-width=".9" stroke-dasharray="1.6 2.8" stroke-linecap="round" opacity=".6"/>','top');
  b.sh(E(32,28,9,9,18),'#FFF6E6',{hatch:0,hl:0,lw:.9,base:'#FFFDF6'});
  paw(b,32,29.5,3.1,'#C98A6B',{lw:.5,noline:0});
  b.ex('glint',24.5,19,4);golden(b,[[56,12,4.2],[8,50,3.4]]);b.ex('spark',55,36,3,'#F9C7D6');
 },
 'Old Map Piece (Park)'(b){mapItem(b,'park')},
 'Old Map Piece (River)'(b){mapItem(b,'river')},
 'Old Map Piece (Woods)'(b){mapItem(b,'woods')},
 'Old Map Piece (Beach)'(b){mapItem(b,'beach')}
};
Object.assign(ITEMS,TREASURE);
Object.assign(ICONS,{
 journal(b){
  b.sh(RR(15,9,40,50,4),'#FFFFFF',{hatch:0,hl:0,lw:.8,det:[[[52,13],[52,56]]],dw:.6});
  b.sh(RR(10,6,40,52,5),'#E9B98A',{marks:[{pts:[[38,0],[43.5,0],[43.5,64],[38,64]],fill:'#F28FA5',k:0}]});
  for(let y=12;y<=52;y+=8)b.ln([[13,y-2.4],[8,y-1.6],[7,y+.8],[13,y+1.6]],{w:2});
  paw(b,25,33,5.6,'#FFF2DA',{lw:.7});
  b.sh([[28,56],[34,56],[34,63],[31,60.5],[28,63]],'#F28FA5',{k:0,hatch:0,hl:0,lw:.7});
 },
 bag(b){
  b.sh([[22,18],[42,18],[52,30],[56,46],[49,58],[15,58],[8,46],[12,30]],'#D8B48A',{k:.15,sh:'#A87E52'});
  b.sh([[22,18],[17,9],[24,12],[32,7.5],[40,12],[47,9],[42,18]],'#E6C79F',{k:.1,hatch:0,hl:0});
  b.ln([[19,19],[32,21.5],[45,19]],{w:2.6,col:C.redD});
  b.ln([[31,22],[27,27],[28,31]],{w:1.8,col:C.redD});b.ln([[33,22],[38,26],[39,30]],{w:1.8,col:C.redD});b.dot(32,21.6,2.2,C.redD);
  b.sh(starP(32,40,9.5,4.4),'#FFE07A',{k:.06,hatch:0,hl:0,lw:.8});
 },
 nose(b){
  [[[10,20],[5,30],[10,40]],[[54,20],[59,30],[54,40]],[[4,14],[-1,30],[4,46]],[[60,14],[65,30],[60,46]]].forEach((p,i)=>b.ln(p,{w:i<2?2.6:2,col:'#7FB7E0'}));
  b.sh([[14,26],[20,17],[32,15],[44,17],[50,26],[46,37],[37,43],[32,49],[27,43],[18,37]],'#5E463D',{base:'#7A5E52',hlo:.5,
   marks:[{pts:E(24.5,32,4.6,3,10,.35),fill:'#2E201C'},{pts:E(39.5,32,4.6,3,10,-.35),fill:'#2E201C'}]});
  b.ln([[32,41],[32,48]],{w:1.4,col:'#2E201C'});
 },
 charm(b){
  b.loop(E(32,8,4.6,4.6,12),{w:2.4,col:'#B8892E'});
  b.sh([[32,12],[44,28],[46,38],[40,49],[32,52],[24,49],[18,38],[20,28]],C.gold,{k:.15,ink:'#7A5420'});
  b.sh([[32,18],[40,30],[41.5,38],[37,45],[32,47],[27,45],[22.5,38],[24,30]],'#C6B2EE',{k:.15,hatch:0,hl:0,lw:.8,marks:[{pts:[[24,30],[32,18],[34,30],[28,40]],fill:'#E6DCFC'}]});
  b.ex('glint',28,32,5);sparkles(b,[['spark',53,14,5]]);
 },
 chest(b){
  b.sh([[8,32],[56,32],[56,57],[8,57]],'#C68B57',{k:0,marks:[{pts:[[14,0],[19,0],[19,64],[14,64]],fill:C.gold,k:0},{pts:[[45,0],[50,0],[50,64],[45,64]],fill:C.gold,k:0}],
   inner:b.st(b.jl(8,44,56,44,.3),INK,1,.5)});
  b.sh([[6,32],[7,21],[15,13],[49,13],[57,21],[58,32]],'#D99A63',{k:.1,marks:[{pts:[[14,0],[19,0],[19,64],[14,64]],fill:C.gold,k:0},{pts:[[45,0],[50,0],[50,64],[45,64]],fill:C.gold,k:0}]});
  b.sh(RR(26.5,27,11,13,2.5),C.gold,{hatch:0,hl:0,lw:.8});b.dot(32,32.5,1.6,C.door);b.raw(`<path d="M31.3 33l-.6 3.4h2.6l-.6-3.4z" fill="${C.door}"/>`,'top');
  sparkles(b,[['spark',56,8,5]]);
 }
});
Object.assign(COLS,{
 chest(b){
  b.raw(`<path d="M12 31L0 20L0 34ZM13 26L0 8L5 5ZM49 29L60 14L60 28ZM49 33L60 34L60 40Z" fill="#FFF1A8" opacity=".8"/>`);
  b.sh([[10,33],[50,33],[51,27],[11,19]],'#FFE7A0',{k:0,hatch:0,hl:0,lw:.7,base:'#FFF4CC'});
  [[17,28],[25,28.5],[33,29],[41,28.5],[21,31.5],[37,31.5]].forEach(([x,y])=>b.sh(E(x,y,3.4,2,8),C.gold,{hatch:0,hl:0,lw:.45,dr:.1}));
  b.sh(rot([[9,27],[10,18],[17,11],[44,11],[51,18],[52,27]],.3,52,27).map(p=>[p[0],p[1]+1]),'#D99A63',{k:.1,marks:[{pts:rot([[15,0],[19,0],[19,30],[15,30]],.3,52,27),fill:C.gold,k:0},{pts:rot([[40,0],[44,0],[44,30],[40,30]],.3,52,27),fill:C.gold,k:0}]});
  b.sh([[10,32],[50,32],[50,53],[10,53]],'#C68B57',{k:0,marks:[{pts:[[15,0],[19,0],[19,60],[15,60]],fill:C.gold,k:0},{pts:[[41,0],[45,0],[45,60],[41,60]],fill:C.gold,k:0}]});
  b.sh(RR(26,32,8,9,2),C.gold,{hatch:0,hl:0,lw:.7});b.dot(30,36,1.1,C.door);
  golden(b,[[55,30,4],[5,44,3.4]]);
 },
 'map-piece'(b){
  const P=quarterPts('beach',12,10,50,46,1.5,3).P;
  b.sh(rot(P,-.18,30,28),PARCH,{k:0,hl:0,base:'#FBEFD2',inner:b.st('M16 40Q24 30 30 34T40 24',C.redD,1.6,.9).replace('stroke-linecap','stroke-dasharray="1 3.4" stroke-linecap')});
  b.ln([[37,17],[45,25]],{w:2.6,col:C.redD});b.ln([[45,17],[37,25]],{w:2.6,col:C.redD});
  b.shadow(30,52,18,3.5);golden(b,[[52,8,4.5],[8,50,3]]);
 },
 'sparkle-spot'(b){
  b.raw('<ellipse cx="30" cy="44" rx="20" ry="6" fill="#FFF3C2" opacity=".55"/><ellipse cx="30" cy="44" rx="11" ry="3.2" fill="#FFEDA8" opacity=".5"/>','under');
  [[30,30,9,'#FFF5CC'],[44,38,5,'#FFF8DD'],[17,36,4,'#FFF8DD'],[38,18,3,'#FFFFFF']].forEach(([x,y,s,c])=>{const k=s*.16;
   b.raw(`<path d="M${x} ${R1(y-s)}Q${R1(x+k)} ${R1(y-k)} ${R1(x+s*.9)} ${y}Q${R1(x+k)} ${R1(y+k)} ${x} ${R1(y+s)}Q${R1(x-k)} ${R1(y+k)} ${R1(x-s*.9)} ${y}Q${R1(x-k)} ${R1(y-k)} ${x} ${R1(y-s)}Z" fill="${c}" stroke="${GRAPH}" stroke-width="1" stroke-linejoin="round" opacity=".8"/>`,'top')});
  b.raw(`<circle cx="24" cy="22" r="1" fill="${GRAPH}" opacity=".6"/><circle cx="48" cy="28" r=".8" fill="${GRAPH}" opacity=".6"/>`,'top');
 },
 'junk-sock'(b){
  b.ln([[46,12],[50,6],[47,1]],{w:1.2,col:'#8FAF7A'});b.ln([[52,16],[57,11],[55,5]],{w:1.2,col:'#8FAF7A'});
  b.sh([[18,6],[34,6],[34,32],[47,38],[53,46],[47,54],[30,53],[19,45]],'#F4EFE6',{k:.12,
   marks:[{pts:[[0,10],[60,10],[60,14],[0,14]],fill:'#F08A86',k:0},{pts:[[0,17],[60,17],[60,21],[0,21]],fill:'#9ED0C8',k:0},{pts:E(49,47,7,7,12),fill:'#D8D2CC'},{pts:E(22,46,6,6,12),fill:'#D8D2CC'}]});
  b.sh(cloudP(37,45,3.4,2.4,5,.4,20),C.door,{hatch:0,hl:0,lw:.6,base:C.door});
  b.ln([[18,8],[34,8]],{w:1,op:.6});
 },
 'junk-rock'(b){
  b.shadow(30,48,22,4);
  b.sh([[8,44],[10,32],[18,22],[30,18],[42,21],[50,30],[52,42],[44,48],[22,49]],'#C9C3BC',{k:.15,sh:'#8E8780',
   marks:[{pts:cloudP(22,24,6,3.4,5,.3,20),fill:'#A9CF8A'}],det:[[[34,24],[31,32],[35,38]]],dw:.8,
   inner:[[18,36],[40,34],[28,42],[44,28]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1" fill="${INK}" opacity=".35"/>`).join('')});
  b.sh(E(53,48,3.4,2.6,10),'#C9C3BC',{hatch:0,hl:0,lw:.6});
 }
});
PROPS['torn-map']=function(b,o){
  const have=new Set((o&&o.pieces)||[]),all=['park','river','woods','beach'].every(q=>have.has(q));
  const boxes={park:[14,10,120,80],river:[120,10,226,80],woods:[14,80,120,150],beach:[120,80,226,150]};
  const nudge={park:[-1,-1,-1.2],river:[1,-1,1],woods:[-1,1,.8],beach:[1,1,-1]},gap=all?.8:2.8;
  ['park','river','woods','beach'].forEach(q=>{const [x0,y0,x1,y1]=boxes[q];
    if(!have.has(q)){const {P}=quarterPts(q,x0,y0,x1,y1,3.4,4);
      b.raw(`<path d="${polyD(P,true)}" fill="#FBF3E2" fill-opacity=".6" stroke="${GRAPH}" stroke-width="1.3" stroke-dasharray="4 3.5" stroke-linejoin="round"/>`);
      b.tx((x0+x1)/2,(y0+y1)/2+8,'?',26,{col:GRAPH,mid:1,op:.8});return}
    const [nx,ny,a]=nudge[q],tx=nx*gap,ty=ny*gap,cx=(x0+x1)/2,cy=(y0+y1)/2;
    const {P}=quarterPts(q,x0,y0,x1,y1,3.4,4);
    b.raw(`<path d="${polyD(P,true)}" fill="${SHADOW}" transform="translate(${R1(tx+2.2)} ${R1(ty+3)}) rotate(${a} ${cx} ${cy})"/>`);
    b.raw(`<g transform="translate(${R1(tx)} ${R1(ty)}) rotate(${a} ${cx} ${cy})">`);
    drawQuarter(b,q,x0,y0,x1,y1,1.55,{amp:3.4,step:4,label:1,lw:.62});
    b.raw('</g>');
  });
  if(all){
    b.raw(`<path d="M42 54C82 72 128 30 176 44C210 54 150 94 100 96C58 100 66 132 110 130C136 129 146 120 156 110" fill="none" stroke="#C0504D" stroke-width="2.4" stroke-dasharray=".1 5.2" stroke-linecap="round"/>`,'top');
    paw(b,38,57,3.4,'#F7B2C4',{lw:.5});
    b.ln([[150,102],[166,118]],{w:5,col:'#D9534F',top:1});b.ln([[166,102],[150,118]],{w:5,col:'#D9534F',top:1});
    b.ex('spark',176,100,5,'#FFE07A');b.ex('spark',142,124,3.6,'#FFE07A');
  }
};

/* ===================================== v1.2: bowls, weather/sound, raincoats, props, obstacles ===================================== */
CFG.obs={W:2.7,amp:.42,step:3,drift:1.1,hatch:1,hg:2.8,hw:.85,ew:1.5};
// embed a cached item drawing inside another asset (ids re-suffixed so copies never clash)
let EMB=0;
function embedItem(b,name,x,y,w,a){if(CACHE['t:'+name]===undefined)PA.item(name);
  const t=CACHE['t:'+name].split(IDT).join(IDT+'e'+(EMB++).toString(36)).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
  const g=`<g transform="translate(${x} ${y}) scale(${R1(w/64*1000)/1000})">${t}</g>`;b.raw(a?`<g transform="rotate(${a} ${x+w/2} ${y+w/2})">${g}</g>`:g)}
const puff=(cx,cy,w,h)=>[[cx-w*.5,cy+h*.5],[cx-w*.56,cy+h*.12],[cx-w*.4,cy-h*.14],[cx-w*.26,cy-h*.46],[cx-w*.02,cy-h*.58],[cx+w*.2,cy-h*.38],[cx+w*.38,cy-h*.36],[cx+w*.56,cy+h*.04],[cx+w*.5,cy+h*.5]];
const drop=(x,y,s)=>[[x,y-s],[x+s*.62,y+s*.15],[x+s*.5,y+s*.62],[x,y+s*.85],[x-s*.5,y+s*.62],[x-s*.62,y+s*.15]];
function crescent(cx,cy,R){const p=[];for(let i=0;i<=16;i++){const a=(300-i*240/16)*Math.PI/180;p.push([cx+R*Math.cos(a),cy+R*Math.sin(a)])}
  const k=R/22;for(let i=1;i<16;i++){const a=(96+i*168/16)*Math.PI/180;p.push([cx+13.1*k+19.1*k*Math.cos(a),cy+19.1*k*Math.sin(a)])}return p}
function flake(b,x,y,s,col,w){let d='';for(let i=0;i<3;i++){const a=i*Math.PI/3+.2;d+=`M${R1(x-Math.cos(a)*s)} ${R1(y-Math.sin(a)*s)}L${R1(x+Math.cos(a)*s)} ${R1(y+Math.sin(a)*s)}`}b.raw(b.st(d,col||'#7FB7E0',w||2.4),'top')}
function crenel(x0,x1,yt,yb,n,h){const p=[[x0,yb],[x0,yt]],w=(x1-x0)/(2*n-1);for(let i=0;i<2*n-1;i++){const xa=x0+i*w,xb=xa+w;if(i%2){p.push([xa,yt+h],[xb,yt+h])}else{p.push([xa,yt],[xb,yt])}}p.push([x1,yt],[x1,yb]);return p}

Object.assign(ICONS,{
 'w-sunny'(b){
  for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.2;b.sh([[32+Math.cos(a-.2)*19,32+Math.sin(a-.2)*19],[32+Math.cos(a)*30,32+Math.sin(a)*30],[32+Math.cos(a+.2)*19,32+Math.sin(a+.2)*19]],'#FFC46B',{k:.12,hatch:0,hl:0,lw:.8})}
  b.sh(E(32,32,16,16,20),'#FFE07A',{marks:[{pts:E(23,36,3.4,2.2,8),fill:PINK,op:.5},{pts:E(41,36,3.4,2.2,8),fill:PINK,op:.5}],det:[[[27,36],[32,39.5],[37,36]]],dw:1.6});
  b.dot(27,30,1.7);b.dot(37,30,1.7);
 },
 'w-cloudy'(b){b.sh(puff(42,24,30,20),'#D6DCE8',{hl:0,hatch:0});b.sh(puff(27,40,44,28),'#F4F8FD',{base:'#FFFFFF'})},
 'w-rain'(b){
  [[18,49,6],[32,55,6.4],[46,49,6]].forEach(([x,y,s])=>b.sh(drop(x,y,s),'#8EC5EE',{hl:0,hatch:0,lw:.8}));
  b.sh(puff(32,24,50,28),'#DCE3EE',{base:'#F4F7FB'});
 },
 'w-snow'(b){
  b.sh(puff(32,22,50,26),'#E8EEF6',{base:'#FFFFFF'});
  flake(b,17,48,6.5);flake(b,33,55,6.5);flake(b,48,47,6.5);
 },
 'w-night'(b){b.sh(crescent(26,34,24),'#FFE59A',{});b.sh(starP(50,14,8.5,3.8),'#FFE07A',{k:.06,hatch:0,hl:0,lw:.8});b.sh(starP(54,38,5.5,2.5),'#FFF0B8',{k:.06,hatch:0,hl:0,lw:.7});b.dot(44,28,1.6)},
 'w-dawn'(b){
  const half=[];for(let i=0;i<=14;i++){const a=Math.PI+i/14*Math.PI;half.push([32+Math.cos(a)*17,47+Math.sin(a)*17])}
  for(let i=0;i<5;i++){const a=Math.PI+(i+.5)/5*Math.PI;b.ln([[32+Math.cos(a)*21,47+Math.sin(a)*21],[32+Math.cos(a)*27,47+Math.sin(a)*27]],{w:2.6,col:'#F28FA5'})}
  b.sh(half,'#FFC9A8',{k:.1,hl:0});
  b.ln([[4,48],[60,48]],{w:3.2});b.ln([[14,55],[50,55]],{w:2,col:GRAPH});
  b.ln([[25,10],[32,4],[39,10]],{w:2.8,col:C.pinkD,k:0});
 },
 'w-dusk'(b){
  const half=[];for(let i=0;i<=14;i++){const a=Math.PI+i/14*Math.PI;half.push([32+Math.cos(a)*17,50+Math.sin(a)*15])}
  b.sh(half,'#F9A35E',{k:.1,hl:0,marks:[{pts:[[0,40],[64,40],[64,43],[0,43]],fill:'#C9B6EE',k:0},{pts:[[0,46],[64,46],[64,48.5],[0,48.5]],fill:'#C9B6EE',k:0}]});
  b.ln([[4,50],[60,50]],{w:3.2});b.ln([[14,57],[50,57]],{w:2,col:GRAPH});
  b.ln([[25,24],[32,30],[39,24]],{w:2.8,col:'#9C86D8',k:0});
  b.sh(starP(12,12,6,2.6),'#FFE07A',{k:.06,hatch:0,hl:0,lw:.7});b.dot(52,10,1.6);
 },
 music(b){
  b.ln([[25,47],[25,15]],{w:3.4});b.ln([[51,41],[51,9]],{w:3.4});
  b.sh([[23,12],[53,5],[53,14],[23,21]],C.lav,{k:0,hl:0,hatch:0});
  b.sh(E(17,48,9,6.6,14,-.35),C.lav,{hl:0});b.sh(E(43,42,9,6.6,14,-.35),C.lav,{hl:0});
 },
 sfx(b){b.sh(starP(32,32,28,17,10,-Math.PI/2+.15),'#FFC48A',{k:.05});b.ln([[32,17],[32,35]],{w:5.4});b.sh(E(32,44,3.4,3.4,10),INK,{base:INK,hatch:0,hl:0,lw:.5})},
 ambience(b){
  b.ln([[8,58],[16,48]],{w:2.6,col:'#7FA65E'});
  b.sh(leafP(14,50,46,26,-.85),C.leaf,{det:[[[15,49],[44,18]],[[24,39],[22,30]],[[30,32],[38,34]],[[33,28],[31,20]]],dw:1.2});
  b.ln([[40,46],[50,44],[56,48],[52,53]],{w:2.2,col:'#7FB7E0'});b.ln([[46,56],[56,55],[60,60]],{w:2.2,col:'#7FB7E0'});
 },
 volume(b){[[6,14],[20,24],[34,34],[48,44]].forEach(([x,h],i)=>b.sh(RR(x,56-h,11,h,3),i<3?'#9FD9C0':'#D6F0E4',{k:1/6,hl:0,hatch:0}))}
});

function rcoat(b,f,d,o={}){
  b.sh([[19,16],[21,6],[32,2.5],[43,6],[45,16]],d,{hatch:0,hl:0,marks:[{pts:E(32,11,8,5.5,12),fill:mix(d,INK,.18)}]});
  if(o.hood)o.hood();
  b.sh([[16,20],[6,42],[11,46],[18,34]],f,{hl:0,inner:o.inner});b.sh([[48,20],[58,42],[53,46],[46,34]],f,{hl:0,inner:o.inner});
  b.sh([[20,15],[44,15],[50,24],[54,46],[52,59],[12,59],[10,46],[14,24]],f,{det:[[[32,16],[32.5,58]]],dw:1,inner:o.inner,marks:o.marks,base:o.base,op:o.op});
  b.sh([[24,15],[32,22],[40,15],[36,13],[28,13]],d,{hatch:0,hl:0,lw:.8});
  [30,39,48].forEach(y=>{b.sh(E(36.5,y,2.6,2.6,10),o.btn||'#9ED0E8',{hatch:0,hl:0,lw:.6,dr:.3});b.dot(35.8,y,.45);b.dot(37.2,y,.45)});
  b.sh([[17,44],[27,44],[26.5,51],[17.5,51]],d,{k:0,hatch:0,hl:0,lw:.7,det:[[[17,46.5],[27,46.5]]],dw:.6});
}
const dotsIn=(list,r,col)=>list.map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${col}"/>`).join('');
Object.assign(ITEMS,{
 'Frog Raincoat'(b){
  rcoat(b,'#A8DC8C','#8CC873',{btn:'#FFE07A',marks:[{pts:E(25,40,7,11,14),fill:'#D3EEB8'}],hood:()=>{
   [24,40].forEach(x=>{b.sh(E(x,6.4,5,5,12),'#8CC873',{hatch:0,hl:0,lw:.8});b.sh(E(x,6,3.2,3.4,10),'#FFFFFF',{hatch:0,hl:0,lw:.5,base:'#fff'});b.dot(x+.5,6.4,1.5)});
   b.raw(`<ellipse cx="26" cy="12.5" rx="2" ry="1.2" fill="${PINK}" opacity=".7"/><ellipse cx="38" cy="12.5" rx="2" ry="1.2" fill="${PINK}" opacity=".7"/>`,'top')}});
  b.raw(b.st('M28.5 11.5q3.5 2.6 7 0',INK,1.1),'top');
 },
 'Polka-dot Raincoat'(b){
  rcoat(b,'#F7A1B5','#E98AA2',{btn:'#FFFFFF',inner:dotsIn([[14,28],[22,22],[18,38],[26,32],[24,50],[42,24],[46,36],[40,46],[48,52],[16,52],[9,40],[55,40],[30,42]],1.9,'#FFFFFF')});
  b.ex('heart',56,10,3);
 },
 'Bubble Raincoat'(b){
  const bub=[[16,28,3.4],[24,40,4.2],[44,30,3.6],[46,48,4.4],[20,52,2.6],[40,20,2.4],[9,40,2.2],[55,40,2.2]].map(([x,y,r])=>`<circle cx="${x}" cy="${y}" r="${r}" fill="#F4FAFF" stroke="#8EBEE6" stroke-width=".8"/><path d="M${R1(x-r*.5)} ${R1(y-r*.1)}q${R1(r*.2)} ${R1(-r*.5)} ${R1(r*.6)} ${R1(-r*.55)}" fill="none" stroke="#fff" stroke-width="1" stroke-linecap="round"/>`).join('');
  rcoat(b,'#CFE8FA','#A9D2F0',{btn:'#D3C6F1',inner:bub,base:'#F2F9FF'});
  b.ex('glint',16,22,6);b.ex('spark',56,10,3.6,'#E3F2FC');
 },
 'Rain Hat'(b){
  b.sh(E(32,44,29,10.5,22),'#F3CB5E',{hl:0,marks:[{pts:E(32,40,20,6,18),fill:'#DDB04A'}]});
  b.sh([[13,43],[15,27],[23,16],[32,13.5],[41,16],[49,27],[51,43]],'#FFE07A',{k:.15});
  b.raw('<path d="M17 33Q32 26 47 33M15 47Q32 55 49 47" fill="none" stroke="#B8892E" stroke-width=".9" stroke-dasharray="2 2"/>','top');
  b.ln([[9,47],[16,56],[32,60],[48,56],[55,47]],{w:1.1,col:GRAPH});
  b.sh(drop(50,9,5),'#8EC5EE',{hatch:0,hl:0,lw:.6});b.ex('spark',10,14,3.6);
 },
 'Pom-pom Beanie'(b){
  let v='';for(let y=20,row=0;y<42;y+=4.2,row++)for(let x=10+(row%2)*2;x<56;x+=4)v+=`M${R1(x-1.4)} ${R1(y-1.5)}L${x} ${y}L${R1(x+1.4)} ${R1(y-1.5)}`;
  b.sh([[10,44],[12,28],[20,17],[32,13],[44,17],[52,28],[54,44]],'#F4A6A0',{k:.15,marks:[{pts:[[0,27],[64,27],[64,33],[0,33]],fill:'#FFF2DA',k:0}],
   inner:`<path d="${v}" fill="none" stroke="#B5605C" stroke-width=".75" stroke-opacity=".55" stroke-linecap="round"/>`});
  b.sh(RR(7,40,50,14,6),'#E98C88',{hl:0,inner:b.st([13,18,23,28,33,38,43,48,53].map(x=>b.jl(x,41.5,x,52.5,.2)).join(''),INK,.8,.5)});
  b.sh(cloudP(32,9.5,8.5,7.5,9,.3,36),'#FFF2DA',{hatch:0,base:'#FFFDF6'});
  b.ex('spark',57,16,3.4);
 }
});

const BOWL_FOODS=['Basic Kibble','Chicken & Rice Bowl','Salmon Pâté','Bone-shaped Biscuit','Pupcake','Fresh Water','Wild Berries',"Duck's Picnic Sandwich",'Golden Bone','Puppy Kibble'];
function bowlFood(b,food){
  const water=food==='Fresh Water';
  b.shadow(60,99,48,6);
  if(water){b.sh(drop(60,18,9),'#A9D6F5',{});b.ex('glint',57,19,4.5)}
  if(food==='Chicken & Rice Bowl'){b.ln([[48,34],[45,28],[49,22],[46,15]],{w:1.4,col:GRAPH});b.ln([[70,32],[73,26],[69,20],[72,13]],{w:1.4,col:GRAPH})}
  bowl(b,60,62,45,12,32,water?C.blue:C.pink,water?'#9DBFE6':'#E58FA5',()=>{
   if(!food){b.sh(E(60,65,34,7,20),'#F4B5C4',{noline:1,hatch:0,hl:0});[[52,64],[66,66],[60,62],[72,63]].forEach(p=>b.dot(p[0],p[1],1.3,'#B07848'))}
   else if(food==='Basic Kibble'){b.sh([[18,64],[26,50],[42,41],[60,38],[78,41],[94,50],[102,64],[60,70]],'#A8682F',{hatch:0,hl:0,lw:.8});
     [[24,60,.7],[30,53,.2],[39,47,1],[49,43,.5],[60,41,1.4],[71,43,.3],[81,48,1],[90,54,.6],[96,61,1.9],[35,58,1.2],[45,52,.1],[56,49,.8],[67,50,1.6],[77,55,.4],[86,61,1.1],[42,63,.3],[53,58,1.1],[64,58,.9],[74,63,2.2],[58,65,.5],[31,64,1.7]].forEach(q=>nugget(b,q[0],q[1],5.6,q[2]))}
   else if(food==='Puppy Kibble'){b.sh([[18,64],[26,50],[42,41],[60,38],[78,41],[94,50],[102,64],[60,70]],'#F4C9A0',{hatch:0,hl:0,lw:.8});
     [[24,60],[30,53],[39,47],[49,43],[60,41],[71,43],[81,48],[90,54],[96,61],[35,58],[45,52],[56,49],[67,50],[77,55],[86,61],[42,63],[53,58],[64,58],[74,63],[58,65],[31,64]].forEach((q,i)=>b.sh(E(q[0],q[1],3.6,3,8,i),['#F9D5A8','#F4C28C','#FBE2C0','#F7B9C6'][i%4],{hatch:0,hl:0,lw:.5,dr:.1}))}
   else if(food==='Chicken & Rice Bowl'){
     let g='';for(let i=0;i<46;i++){const x=24+b.r()*72,y=48+b.r()*18;g+=b.jl(x,y,x+2.4,y-.8,.2)}
     b.sh([[18,64],[24,54],[36,46],[52,42],[68,42],[84,46],[96,54],[102,64],[60,70]],'#FFFDF6',{hatch:0,hl:0,lw:.8,base:'#FFFFFF',inner:b.st(g,GRAPH,.9,.85)});
     [[36,52,.2],[54,46,1],[70,50,-.4],[84,57,.6],[48,60,1.4]].forEach(([x,y,a])=>b.sh(rot([[x-6,y-3],[x+5,y-4.5],[x+7,y+2],[x-1,y+4.5],[x-7,y+2]],a,x,y),'#EDB878',{k:.15,hatch:0,hl:0,lw:.7,dr:.3,det:[[[x-3,y-1],[x+3,y-2]]],dcol:'#B9773F',dw:1}));
     [[28,60],[62,56],[76,46],[44,50],[92,62],[66,64]].forEach(([x,y])=>b.sh(E(x,y,2.6,2.6,10),'#A9D98B',{hatch:0,hl:0,lw:.55,dr:.2}));
     b.sh(leafP(58,40,9,5,-1.9),C.leaf,{hatch:0,hl:0,lw:.6});b.sh(leafP(58,40,8,4.6,-.9),C.leafD,{hatch:0,hl:0,lw:.6})}
   else if(food==='Salmon Pâté'){
     b.sh([[20,64],[28,52],[42,44],[60,41],[78,44],[92,52],[100,64],[60,70]],'#F7A99A',{base:'#FBC9BE',sh:'#D9786A',hlo:.5,
      inner:b.st('M30 58q8 -8 16 -2t16 -4t16 2t12 6M40 50q8 -6 16 -2t14 -2',  '#E07F70',1.3,.85)});
     b.sh(leafP(60,42,10,5.5,-2.2),C.leaf,{hatch:0,hl:0,lw:.6});b.sh(leafP(60,42,10,5.5,-1),C.leafD,{hatch:0,hl:0,lw:.6});b.sh(E(70,47,3,2,8),'#FFF2DA',{hatch:0,hl:0,lw:.5})}
   else if(food==='Bone-shaped Biscuit'){embedItem(b,'Bone-shaped Biscuit',18,22,54,-18);embedItem(b,'Bone-shaped Biscuit',46,18,54,40);embedItem(b,'Bone-shaped Biscuit',30,30,50,8)}
   else if(food==='Pupcake'){b.sh(E(60,64,34,7,20),'#F4B5C4',{noline:1,hatch:0,hl:0});embedItem(b,'Pupcake',28,6,64,0)}
   else if(water){b.sh(E(60,63,39,8.8,22),C.sky,{hatch:0,hl:0,lw:.7});
     b.loop(E(60,63,14,3,14),{w:.9,col:'#fff'});b.loop(E(60,63,26,5.6,18),{w:.8,col:'#6FA3C8',op:.6});
     b.ln([[30,62],[38,61]],{w:1.1,col:'#fff'});b.ln([[82,65],[90,64.5]],{w:1.1,col:'#fff'})}
   else if(food==='Wild Berries'){
     [[30,60,8,'#EF7B86'],[46,58,8.5,'#8E8FD8'],[62,58,8.5,'#EF7B86'],[78,58,8,'#8E8FD8'],[92,62,7,'#B26BB8'],[38,50,8,'#8E8FD8'],[54,48,8.5,'#B26BB8'],[70,48,8.5,'#8E8FD8'],[86,52,7.5,'#EF7B86'],[46,40,7.5,'#EF7B86'],[62,38,8,'#8E8FD8'],[76,41,7,'#EF7B86']].forEach(([x,y,r,c])=>{
      b.sh(E(x,y,r,r,14),c,{hl:0,hatch:0,lw:.85});b.ex('glint',x-r*.45,y-r*.15,r*.5);
      if(c==='#EF7B86')[[.3,.3],[-.3,.4],[.4,-.2]].forEach(([dx,dy])=>b.dot(x+dx*r,y+dy*r,.7,'#FFF2DA'))});
     b.sh(leafP(62,32,15,8,-.6),C.leaf,{hatch:0,hl:0,lw:.75,det:[[[63,31.4],[76,23]]],dw:.7});b.sh(leafP(60,33,13,7,-2.5),C.leafD,{hatch:0,hl:0,lw:.75})}
   else if(food==="Duck's Picnic Sandwich"){b.sh(E(60,64,34,7,20),'#F4B5C4',{noline:1,hatch:0,hl:0});embedItem(b,"Duck's Picnic Sandwich",24,6,72,-8)}
   else if(food==='Golden Bone'){b.sh(E(60,64,34,7,20),'#F4B5C4',{noline:1,hatch:0,hl:0});embedItem(b,'Golden Bone',22,14,76,4)}
  });
  if(water)b.raw(b.st('M44 86q4 -4 8 0t8 0t8 0t8 0','#fff',2.2),'top');else b.tx(60,90,'DOG',17,{mid:1});
  if(food==='Golden Bone'){b.ex('spark',104,24,7,'#FFE07A');b.ex('spark',14,34,5,'#FFE07A')}
}
PROPS.bowl=function(b,o){bowlFood(b,o.food||'')};
PROPS.umbrella=function(b){
  b.shadow(60,112,34,4);
  const tip=[60,14],top=[];for(let i=0;i<=16;i++){const a=Math.PI+i/16*Math.PI;top.push([60+Math.cos(a)*52,58+Math.sin(a)*44])}
  const xs=[8,29,50,70,91,112],bot=[];for(let i=5;i>0;i--){bot.push([xs[i],58],[(xs[i]+xs[i-1])/2,52.5])}
  const marks=[];for(let i=0;i<5;i++)if(i%2===0)marks.push({pts:[tip,[xs[i]-2,62],[xs[i+1]+2,62]],fill:'#FFF2DA',k:0});
  b.ln([[60,58],[60,104]],{w:5});b.ln([[60,58],[60,104]],{w:2.6,col:'#C99A72'});
  b.ln([[60,102],[60,108],[65,114],[71,112],[73,106]],{w:5.6});b.ln([[60,102],[60,108],[65,114],[71,112],[73,106]],{w:3,col:C.redD});
  b.sh(top.concat(bot),C.pink,{k:.08,marks,det:xs.slice(1,5).map(x=>[tip,[x*0.6+60*.4,40],[x,58]])});
  b.ln([[60,14],[60,5]],{w:2.6});
  [[14,80,5],[104,78,5],[22,100,4],[96,98,4]].forEach(([x,y,s])=>b.sh(drop(x,y,s),'#A9D6F5',{hatch:0,hl:0,lw:.6}));
  b.ex('heart',100,18,4);
};
PROPS.snowman=function(b){
  b.shadow(60,110,40,5);
  b.sh([[14,111],[22,100],[40,96],[80,96],[98,100],[106,111]],'#FFFFFF',{k:.2,hatch:0,hl:0,lw:.8,base:'#fff'});
  b.ln([[42,56],[24,44],[18,36]],{w:2.2,col:'#8E6446'});b.ln([[24,44],[16,46]],{w:1.8,col:'#8E6446'});
  b.ln([[78,56],[96,44],[100,34]],{w:2.2,col:'#8E6446'});b.ln([[96,44],[104,44]],{w:1.8,col:'#8E6446'});
  b.sh(E(60,86,28,22,24),'#F6FAFE',{base:'#FFFFFF',sh:'#8FB4D4'});
  b.sh(E(60,56,20,16,22),'#F6FAFE',{base:'#FFFFFF',sh:'#8FB4D4'});
  [[60,50],[60,58],[60,66],[60,80],[60,90]].forEach(([x,y])=>b.dot(x,y,1.9));
  b.sh(E(60,30,14,13,20),'#F6FAFE',{base:'#FFFFFF',sh:'#8FB4D4',marks:[{pts:E(51,34,3,1.8,8),fill:PINK,op:.6},{pts:E(69,34,3,1.8,8),fill:PINK,op:.6}]});
  b.dot(55,27,1.7);b.dot(65,27,1.7);[[54,35],[57,37],[60,37.6],[63,37],[66,35]].forEach(([x,y])=>b.dot(x,y,.9));
  b.sh([[60,30],[75,32],[60,33.6]],'#F9A35E',{k:.05,hatch:0,hl:0,lw:.7});
  b.sh([[45,41],[75,41],[77,47],[43,47]],C.redD,{k:.1,hatch:0,hl:0,marks:[{pts:[[52,40],[56,40],[56,48],[52,48]],fill:'#FFF2DA',k:0},{pts:[[64,40],[68,40],[68,48],[64,48]],fill:'#FFF2DA',k:0}]});
  b.sh([[64,45],[72,45],[74,62],[66,60]],C.redD,{k:.05,hatch:0,hl:0,marks:[{pts:[[60,51],[80,51],[80,54],[60,54]],fill:'#FFF2DA',k:0}]});
  b.sh([[46,21],[49,12],[60,8],[71,12],[74,21]],C.mint,{k:.15,hatch:0,hl:0});b.sh(RR(44,18,32,6,3),'#96CDB5',{hatch:0,hl:0,lw:.8});
  b.sh(cloudP(60,7,5,4.5,7,.3,24),'#FFF2DA',{hatch:0,hl:0,lw:.7});
  flake(b,16,20,4.5,'#8FB4D4',1.4);flake(b,104,22,5,'#8FB4D4',1.4);b.ex('spark',102,70,4.5,'#E3F2FC');
};
PROPS['puzzle-board']=function(b){
  b.shadow(120,152,108,6);
  b.sh(RR(10,22,220,128,26,5),'#96CDB5',{hl:0,hatch:0,k:.1});
  b.sh(RR(10,13,220,128,26,5),C.mint,{k:.1});
  b.sh(RR(26,52,188,56,26,5),'#A8DCC4',{hatch:0,hl:0,lw:.7,k:.1});
  [60,120,180].forEach((x,i)=>{b.sh(E(x,80,19,19,22),C.door,{base:'#6E544A',hatch:0,hl:0,marks:[{pts:E(x+3,84,12,10,16),fill:'#7A5E52'}]});
    nugget(b,x-4,84,5.4,i);nugget(b,x+5,81,4.6,i+1.5)});
  paw(b,34,32,5,'#DDF2E8',{noline:1});paw(b,206,126,5,'#DDF2E8',{noline:1,a:.4});
  b.sh(boneP(196,30,26,9,.1),'#FFF2DA',{hatch:0,hl:0,lw:.6});
  b.tx(120,132,'sniff &amp; slide',15,{mid:1,op:.8});
};
PROPS['puzzle-lid']=function(b){
  b.sh(E(30,33,26,24,22),'#E8A273',{hl:0,hatch:0});
  b.sh(E(30,29,26,24,22),C.peach,{});
  b.loop(E(30,29,19,17.5,18),{w:1,op:.55});
  b.sh(E(30,29,8,7.5,14),'#FFE07A',{hatch:0,hl:0,det:[[[27,26],[27,32]],[[30,25],[30,33]],[[33,26],[33,32]]],dw:.8});
};
PROPS['tug-rope-long']=function(b){
  const path=[[36,30],[100,28],[150,31],[200,29],[264,30]],rp=ribbon(path,[18,18,18,18,18]),marks=[];
  for(let i=0;i<20;i++){const x=40+i*11.4,y=30;marks.push({pts:[[x-2.5,y-14],[x+6.5,y-14],[x+2.5,y+14],[x-6.5,y+14]],fill:i%2?C.red:'#9ED0C8',k:0})}
  b.sh(rp,'#F6E7CF',{k:1/6,marks,hatch:0,inner:b.st(marks.map(m=>b.jl(m.pts[0][0],m.pts[0][1],m.pts[3][0],m.pts[3][1],.3)).join(''),INK,.9,.6)});
  [[24,30],[276,30]].forEach(([x,y],j)=>{const s=j?1:-1;
    [-8,-3,2,7].forEach(dy=>b.ln([[x+s*14,y+dy],[x+s*21,y+dy*1.3+(dy>0?1:-1)]],{w:1.6}));
    b.sh(E(x,y,15,17,18),C.red,{det:[[[x-5,y-15],[x-1,y],[x-5,y+15]],[[x+3,y-16],[x+7,y],[x+3,y+16]]],dw:1})});
};

const OBS_VB={log:'0 0 120 50',rock:'0 0 80 50',puddle:'0 0 220 24',mud:'0 0 180 24',sprinkler:'0 0 70 70',snowdrift:'0 0 140 60',crab:'0 0 70 44',sandcastle:'0 0 90 70',
  branch:'0 0 240 80',bird:'0 0 80 50',sign:'0 0 140 80',kite:'0 0 160 90',bunting:'0 0 260 60'};
function flatBlob(cx,cy,rx,ry,seed,n=26){const r=rng(seed),p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,f=.9+r()*.16;p.push([cx+Math.cos(a)*rx*f,cy+Math.sin(a)*ry*(.85+r()*.2)])}return p}
const OBS={
 log(b){
  b.shadow(56,48.4,50,1.6);
  b.sh(ribbon([[42,16],[37,7],[30,3]],[7,5,3]),'#B88C66',{k:1/6,hatch:0,hl:0,lw:.8});
  b.sh(leafP(31,4,10,5.5,-2.8),C.leaf,{hatch:0,hl:0,lw:.6});
  b.sh(RR(5,14,100,34,15),'#C69A72',{lw:1.1,sh:'#8E6446',inner:b.st(b.jl(14,23,96,22,.8)+b.jl(10,31,98,32,.8)+b.jl(14,40,94,39,.8)+b.jl(30,18,52,19,.4)+b.jl(60,44,84,44,.4),'#8E6446',1.1,.7)});
  b.sh(E(104,31,12.5,16.5,18),'#EBC795',{hatch:0,hl:0,lw:1.1});b.loop(E(104,31,8.5,11.5,14),{w:1,col:'#B88C66'});b.loop(E(104,31,4,5.5,10),{w:.9,col:'#B88C66'});
  b.ln([[66,15],[66,10]],{w:2,col:'#E9D7BE'});b.sh([[60.5,12],[66,6],[71.5,12]],'#F08A86',{k:.3,hatch:0,hl:0,lw:.7,dr:.2});b.dot(64,9.6,.8,'#fff');b.dot(68,10.4,.7,'#fff');
 },
 rock(b){
  b.shadow(40,48.4,36,1.6);
  b.sh([[5,47.5],[7,34],[15,22],[29,14],[46,12],[61,18],[71,30],[75,47.5]],'#C9C3BC',{k:.15,lw:1.1,sh:'#8E8780',
   marks:[{pts:cloudP(26,20,9,4.6,6,.3,24),fill:'#A9CF8A'}],det:[[[44,18],[40,28],[45,36]]],dw:.9,
   inner:[[20,34],[54,32],[34,40],[60,40],[30,26]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.2" fill="${INK}" opacity=".35"/>`).join('')});
 },
 puddle(b){
  b.sh(flatBlob(110,14.5,104,7.8,11),'#A9D6F5',{lw:.9,hs:.5,hlo:.5});
  b.loop(E(84,14.5,16,2.6,14),{w:.9,col:'#fff'});b.loop(E(84,14.5,28,4.6,18),{w:.8,col:'#6F9FC4',op:.6});b.loop(E(150,14,12,2.2,12),{w:.8,col:'#fff'});
  b.ln([[30,12],[44,11]],{w:1.2,col:'#fff'});b.ln([[176,16],[190,15]],{w:1.2,col:'#fff'});
  [[12,4],[208,4.5]].forEach(([x,y])=>b.sh(drop(x,y,2.6),'#A9D6F5',{hatch:0,hl:0,lw:.5,dr:.1}));
 },
 mud(b){
  b.sh(flatBlob(90,14.5,84,8,23),'#A87A52',{lw:.9,base:'#C49C76',hs:.5,marks:[{pts:flatBlob(60,15,18,4,5,12),fill:'#8E6240'},{pts:flatBlob(124,14,22,4,9,12),fill:'#8E6240'}]});
  [[40,12,2.2],[100,11,1.8],[146,15,2.4],[76,17,1.5]].forEach(([x,y,r])=>b.loop(E(x,y,r,r*.8,10),{w:.8,col:'#5E463D'}));
  b.sh(E(6,18,3.4,2.4,10),'#A87A52',{hatch:0,hl:0,lw:.6,dr:.2});b.sh(E(174,17,3,2.2,10),'#A87A52',{hatch:0,hl:0,lw:.6,dr:.2});
  b.sh(E(112,8,3,2,10),'#C9C3BC',{hatch:0,hl:0,lw:.6,dr:.2});
 },
 sprinkler(b){
  b.raw(`<path d="M35 47Q14 4 3 46M35 47Q56 4 67 46M35 47Q31 0 20 22M35 47Q39 0 50 22" fill="none" stroke="#7FC7EE" stroke-width="2.2" stroke-dasharray="4 3" stroke-linecap="round"/>`);
  [[4,50,3],[66,50,3],[20,25,2.4],[50,25,2.4],[10,30,2],[60,30,2]].forEach(([x,y,s])=>b.sh(drop(x,y,s),'#A9D6F5',{hatch:0,hl:0,lw:.5,dr:.1}));
  [[22,68.6],[48,68.6]].forEach(([x,y])=>{b.ln([[x-3,y],[x-4,y-5]],{w:1.1,col:'#7FA65E'});b.ln([[x,y],[x,y-6]],{w:1.1,col:'#7FA65E'});b.ln([[x+3,y],[x+4,y-5]],{w:1.1,col:'#7FA65E'})});
  b.sh(E(35,66.4,13,2.8,14),'#96CDB5',{hatch:0,hl:0,lw:.9});
  b.sh([[28,66],[29,57],[32.5,51],[37.5,51],[41,57],[42,66]],'#F9B97A',{k:.1,lw:1.05});
  b.sh(E(35,50,4.6,2.6,10),'#FFE07A',{hatch:0,hl:0,lw:.8});
 },
 snowdrift(b){
  b.ln([[88,22],[93,8],[98,4]],{w:1.6,col:'#8E6446'});b.ln([[92,12],[86,6]],{w:1.3,col:'#8E6446'});
  b.sh([[3,58.5],[9,46],[22,38],[38,32],[56,22],[76,19],[96,25],[112,35],[126,43],[137,58.5]],'#F2F8FD',{k:.15,lw:1.1,base:'#FFFFFF',sh:'#8FB4D4',ho:.5,det:[[[30,46],[44,40],[54,42]],[[86,34],[100,36]]],dcol:'#8FB4D4',dw:1.1});
  flake(b,24,16,4.5,'#8FB4D4',1.4);flake(b,120,16,5,'#8FB4D4',1.4);b.ex('spark',64,10,4,'#E3F2FC');
 },
 crab(b){
  [[24,34,9,42.6],[22,30,5,38],[46,34,61,42.6],[48,30,65,38]].forEach(([x,y,x2,y2])=>b.ln([[x,y],[(x+x2)/2,y2-6],[x2,y2]],{w:2,col:'#C95F4E'}));
  b.ln([[22,26],[14,20],[11,16]],{w:2.4,col:'#C95F4E'});b.ln([[48,26],[56,20],[59,16]],{w:2.4,col:'#C95F4E'});
  [[10,12],[60,12]].forEach(([x,y],j)=>b.sh(E(x,y,7,6.4,14,j?.4:-.4),'#F4846E',{hatch:0,lw:1,det:[[[x-(j?-3:3),y-6.5],[x,y-1],[x+(j?-3:3),y-6.4]]],dw:1}));
  b.ln([[30,22],[29,13]],{w:1.6});b.ln([[40,22],[41,13]],{w:1.6});
  b.sh(E(35,31,19,11,20),'#F4846E',{lw:1.1,marks:[{pts:E(27,33,2.8,1.8,8),fill:PINK,op:.7},{pts:E(43,33,2.8,1.8,8),fill:PINK,op:.7}],det:[[[31,33],[35,35.6],[39,33]]],dw:1.1});
  [[29,11],[41,11]].forEach(([x,y])=>{b.sh(E(x,y,3.4,3.4,10),'#FFFFFF',{hatch:0,hl:0,lw:.7,base:'#fff'});b.dot(x+.6,y+.3,1.5)});
 },
 sandcastle(b){
  b.ln([[45,40],[45,12]],{w:1.5});b.sh([[45,12],[60,16],[45,20.5]],C.pinkD,{k:.08,hatch:0,hl:0,lw:.8});
  b.sh(crenel(9,33,30,60,3,4.5),'#F2D49A',{k:0,lw:1,sh:'#C9A46A'});b.sh(crenel(57,81,30,60,3,4.5),'#F2D49A',{k:0,lw:1,sh:'#C9A46A'});
  b.sh(crenel(28,62,40,60,4,4),'#F6DCA8',{k:0,lw:1,sh:'#C9A46A'});
  b.sh(arch(40,50,60,48),C.door,{base:'#6E544A',hatch:0,hl:0,lw:.8});
  b.sh([[4,68.5],[6,58],[84,58],[86,68.5]],'#EAC78A',{k:.1,lw:1.05,inner:[[14,64],[30,62],[56,65],[72,62],[46,63]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1" fill="${INK}" opacity=".35"/>`).join('')});
  b.sh(shellP(21,47,4.2),'#F9C7B6',{k:.12,hatch:0,hl:0,lw:.55,dr:.1});b.sh(starP(69,47,4,1.8),'#F9B97A',{k:.15,hatch:0,hl:0,lw:.55,dr:.1});
  [[12,40],[66,40]].forEach(([x,y])=>b.sh(arch(x+3,x+9,y+7,y),C.door,{base:'#6E544A',hatch:0,hl:0,lw:.6}));
 },
 branch(b){
  b.sh(ribbon([[3,8],[60,12],[120,9],[180,13],[237,8]],[9,8,8,7,6]),'#A97E5A',{k:1/6,hl:0,inner:b.st(b.jl(10,8,110,9,.4)+b.jl(130,10,230,9,.4),'#7A5A3A',.9,.6)});
  const clus=[[34,13,36],[80,14,52],[122,12,66],[164,15,52],[206,12,38]];
  clus.forEach(([x,y,L])=>{b.ln([[x,y],[x+2,y+L*.35]],{w:1.8,col:'#8E6446'})});
  clus.forEach(([x,y,L],ci)=>{const yb=y+L*.32,ls=[[-.95,L*.4],[.95,L*.4],[-.45,L*.55],[.45,L*.55],[0,0]];
    ls.forEach(([da,len],k)=>{const ll=k===4?(ci===2?78.6-yb:L*.7):len;b.sh(leafP(x+2,yb,ll,Math.max(6,ll*.42),Math.PI/2+da),[C.leaf,C.leafD,'#B4D9A0'][(k+ci)%3],{hatch:0,hl:0,lw:.8,dr:.3,det:[[[x+2,yb+1],[x+2+Math.cos(Math.PI/2+da)*ll*.7,yb+Math.sin(Math.PI/2+da)*ll*.7]]],dw:.6})})});
  [[58,30],[146,30],[188,34]].forEach(([x,y])=>tinyFlower(b,x,y,4,'#F7B2C4'));
 },
 bird(b){
  b.ln([[4,22],[14,24]],{w:1.2,col:GRAPH});b.ln([[2,30],[12,30]],{w:1.2,col:GRAPH});
  b.ln([[37,40],[35,48.6]],{w:1.4,col:'#E58C4A'});b.ln([[44,40],[44,48.6]],{w:1.4,col:'#E58C4A'});
  b.sh([[34,22],[24,6],[30,3],[44,16]],'#7FAED8',{k:.2,hatch:0,hl:0,lw:.9});
  b.sh([[24,27],[12,21],[14,32],[25,34]],'#7FAED8',{k:.1,hatch:0,hl:0,lw:.9});
  b.sh(E(40,30,17,12,20),'#9FC7E8',{lw:1.05,marks:[{pts:E(44,36,11,6,14),fill:'#E3F0FA'}]});
  b.sh(E(56,22,9.5,9,16),'#9FC7E8',{hatch:0,hl:0,lw:1.05});
  b.sh([[64,20],[74,23],[64,26]],'#F9A35E',{k:.05,hatch:0,hl:0,lw:.7});
  b.dot(59,20,1.6);b.raw(`<ellipse cx="58" cy="26" rx="2.4" ry="1.4" fill="${PINK}" opacity=".7"/>`,'top');
  b.sh([[33,27],[37,9],[45,2],[49,10],[45,26]],'#B9D8F2',{k:.2,hatch:0,hl:0,lw:.9});
 },
 sign(b){
  b.sh(RR(2,2,134,7,3),'#B88C66',{hatch:0,hl:0,lw:1});b.sh(ribbon([[6,8],[18,22]],[4,4]),'#B88C66',{k:0,hatch:0,hl:0,lw:.8});
  b.ln([[36,8],[38,34]],{w:1.4});b.ln([[104,8],[102,34]],{w:1.4});
  b.sh(RR(16,32,108,46,6),'#F2D49A',{lw:1.1,sh:'#C9A46A',inner:b.st(b.jl(16,47,124,47,.3)+b.jl(16,62,124,62,.3),'#B88C66',.9,.7)});
  b.dot(38,36,1.4);b.dot(102,36,1.4);
  b.tx(70,52,'MIND YOUR',15,{mid:1,col:INK});b.tx(70,72,'HEAD!',20,{mid:1,col:'#D9534F'});
  b.ex('spark',130,26,4);
 },
 kite(b){
  b.raw(`<path d="M126 34Q96 88.5 1 88.4" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`);
  b.ln([[132,52],[138,62],[134,70],[142,80]],{w:1.2});
  [[137,61],[136,71],[141,79]].forEach(([x,y],i)=>{b.sh([[x,y],[x-5,y-3],[x-5,y+3]],i%2?'#FFE07A':C.mint,{k:.05,hatch:0,hl:0,lw:.6});b.sh([[x,y],[x+5,y-3],[x+5,y+3]],i%2?'#FFE07A':C.mint,{k:.05,hatch:0,hl:0,lw:.6})});
  b.sh([[132,2],[155,25],[132,52],[109,25]],C.pink,{k:.04,lw:1.05,marks:[{pts:[[132,2],[155,25],[132,25]],fill:'#FFE07A',k:0},{pts:[[132,52],[109,25],[132,25]],fill:'#FFE07A',k:0}],det:[[[132,4],[132,50]],[[111,25],[153,25]]],dw:.8});
  b.dot(126,20,1.3);b.dot(138,20,1.3);b.raw(b.st('M127 30q5 4 10 0',INK,1.2),'top');
  b.ex('spark',100,16,4);
 },
 bunting(b){
  const P=t=>{const u=1-t;return [u*u*3+2*u*t*130+t*t*257,u*u*4+2*u*t*30+t*t*4]};
  b.raw(`<path d="M3 4Q130 30 257 4" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`);
  const cols=[C.pink,'#FFE07A',C.mint,C.lav,C.blue];
  for(let i=0;i<9;i++){const t=(i+.5)/9,a=P(t-.04),c=P(t+.04),m=P(t),L=58.4-17-(Math.abs(t-.5)<.06?0:0);
    const tipY=Math.min(58.4,m[1]+40);
    b.sh([[a[0],a[1]],[c[0],c[1]],[m[0],tipY]],cols[i%5],{k:.04,hatch:0,lw:.95,inner:i%2?`<circle cx="${R1(m[0])}" cy="${R1((m[1]*2+tipY)/3)}" r="2.6" fill="#fff" opacity=".85"/>`:''});
    if(i%2===0)b.sh(heartP(m[0],(m[1]*2+tipY)/3,6),'#FFFFFF',{noline:1,hatch:0,hl:0,dr:.1})}
 }
};
PA.obstacle=function(name){return serve('o:'+name,()=>{const f=OBS[name],vb=OBS_VB[name];if(!f)return fallback('obstacle',name,'0 0 80 50');
  const b=mk('obs',name);f(b);return b.svg(vb,` data-obstacle="${esc(name)}"`,lab(name)+' obstacle')})};

/* ===================================== v1.3: garden + kitchen ===================================== */
const LEAF='#9CCB86',LEAFD='#7FB86A',SOIL='#A87A52',ORNG='#F59E52',PUMP='#F9A35E',SWP='#C97E68',BLUEB='#7F8FD6';
const SL=(pts,cx,cy,s,a)=>rot(pts.map(p=>[cx+p[0]*s,cy+p[1]*s]),a||0,cx,cy);
const lwS=s=>Math.max(.55,Math.min(1.1,s));
function carrotV(b,cx,cy,s,a,o={}){
  const base=SL([[0,-19]],cx,cy,s,a)[0],up=a-Math.PI/2;
  if(!o.notop)[-.45,0,.45].forEach((d,i)=>{const L=(i===1?20:16)*s;b.sh(leafP(base[0],base[1],L,6.5*s,up+d),i===1?LEAFD:LEAF,{hatch:0,hl:0,lw:lwS(s)*.75,dr:.2,det:[[[base[0],base[1]],[base[0]+Math.cos(up+d)*L*.8,base[1]+Math.sin(up+d)*L*.8]]],dw:.6*lwS(s)})});
  b.sh(SL([[-8,-19],[8,-19],[7.5,-6],[4.5,9],[1.2,22],[-1.2,22],[-4.5,9],[-7.5,-6]],cx,cy,s,a),ORNG,{k:.15,lw:lwS(s),hatch:s>.6?1:0,hl:s>.5?undefined:0,
   det:[[[-7,-9],[-3,-8.4]],[[3,-2],[6.4,-1.6]],[[-5,5],[-2,5.4]],[[1,12],[3.4,12.2]]].map(l=>SL(l,cx,cy,s,a)),dw:.8*lwS(s)});
}
function podV(b,cx,cy,s,a){
  b.sh(SL([[-23,0],[-15,-7],[0,-9],[15,-7.5],[23,-2.5],[25,1.5],[15,5.5],[0,7],[-15,5.5]],cx,cy,s,a),'#9CD48A',{k:.15,lw:lwS(s),hl:0,hatch:0});
  [-12,-4,4,12].forEach(x=>{const p=SL([[x,-.6]],cx,cy,s,a)[0];b.sh(E(p[0],p[1],4.3*s,4.3*s,10),'#BDE6A2',{hatch:0,hl:0,lw:lwS(s)*.6,dr:.15});b.ex('glint',p[0]-1.6*s,p[1]-.6*s,2.4*s)});
  b.ln(SL([[-15,-6.4],[0,-8.6],[15,-7]],cx,cy,s,a),{w:1.3*lwS(s),col:'#6FA35A'});
  b.ln(SL([[-23,0],[-28,-4],[-26,-9]],cx,cy,s,a),{w:1.4*lwS(s),col:'#6FA35A'});
}
function spinachV(b,x,y,s,a,col){b.sh(leafP(x,y,30*s,17*s,a),col||'#5FA05A',{lw:lwS(s),hatch:s>.6?1:0,hl:0,dr:.3,det:[[[x,y],[x+Math.cos(a)*27*s,y+Math.sin(a)*27*s]],
  [[x+Math.cos(a)*10*s,y+Math.sin(a)*10*s],[x+Math.cos(a+.5)*17*s,y+Math.sin(a+.5)*17*s]],[[x+Math.cos(a)*10*s,y+Math.sin(a)*10*s],[x+Math.cos(a-.5)*17*s,y+Math.sin(a-.5)*17*s]]],dcol:'#3E7A3E',dw:.7*lwS(s)})}
function berryV(b,x,y,r,col){b.sh(E(x,y,r,r,Math.max(10,Math.round(r*1.6))),col||BLUEB,{hl:0,hatch:0,lw:Math.max(.5,Math.min(1,r/8)),dr:.2,marks:[{pts:E(x-r*.2,y+r*.25,r*.6,r*.45,10),fill:'#A9B4EA',op:.6}]});
  b.raw(b.st(`M${R1(x-r*.32)} ${R1(y-r*.55)}l${R1(r*.64)} ${R1(r*.3)}M${R1(x+r*.32)} ${R1(y-r*.55)}l${R1(-r*.64)} ${R1(r*.3)}`,INK,Math.max(.6,r*.13)),'top');b.ex('glint',x-r*.45,y-r*.05,r*.5)}
function sweetV(b,cx,cy,s,a){
  b.ln(SL([[24,1],[31,0],[35,3]],cx,cy,s,a),{w:1.2*lwS(s),col:'#8E5A44'});b.ln(SL([[-24,0],[-30,2]],cx,cy,s,a),{w:1.2*lwS(s),col:'#8E5A44'});
  b.sh(SL([[-25,0],[-18,-8],[-4,-11],[12,-9.5],[22,-4.5],[26,1],[20,7],[4,10],[-12,9],[-22,5]],cx,cy,s,a),SWP,{k:.15,lw:lwS(s),hatch:s>.6?1:0,
   det:[[[-12,-4],[-8,-3]],[[4,2],[8,2.6]],[[14,-3],[17,-2]],[[-4,5],[-1,5.6]]].map(l=>SL(l,cx,cy,s,a)),dw:.8*lwS(s),dcol:'#8E5A44'});
}
function pumpkinV(b,cx,cy,s,o={}){
  if(!o.noleaf){b.ln([[cx+3*s,cy-15*s],[cx+12*s,cy-20*s],[cx+16*s,cy-16*s],[cx+13*s,cy-13*s]],{w:1.2*lwS(s),col:'#6FA35A'});
    b.sh(cloudP(cx-15*s,cy-17*s,8*s,6*s,5,.35,24),LEAF,{hatch:0,hl:0,lw:lwS(s)*.75,dr:.2})}
  b.sh(E(cx-12*s,cy,13*s,15.5*s,16),'#F29150',{lw:lwS(s),hl:0});b.sh(E(cx+12*s,cy,13*s,15.5*s,16),'#F29150',{lw:lwS(s),hl:0});
  b.sh(E(cx,cy,12.5*s,16.5*s,16),PUMP,{lw:lwS(s),hlo:.5});
  b.sh(ribbon([[cx,cy-14*s],[cx+1.5*s,cy-20*s],[cx+4.5*s,cy-23*s]],[4.4*s,3.6*s,2.6*s]),'#8E8A4A',{k:1/6,hatch:0,hl:0,lw:lwS(s)*.8,dr:.1});
}
const CROP_FN={carrot:(b,x,y,s)=>carrotV(b,x,y,s,-.5),peas:(b,x,y,s)=>podV(b,x,y,s,-.35),spinach:(b,x,y,s)=>{spinachV(b,x-3*s,y+12*s,s*.8,-2.1,LEAFD);spinachV(b,x+3*s,y+12*s,s*.8,-1.05,LEAFD);spinachV(b,x,y+13*s,s*.85,-1.57)},
  blueberries:(b,x,y,s)=>{[[-6,-6],[6,-5],[0,4],[-10,5],[10,6]].forEach(([dx,dy])=>berryV(b,x+dx*s,y+dy*s,6.4*s))},'sweet-potato':(b,x,y,s)=>sweetV(b,x,y,s,-.3),pumpkin:(b,x,y,s)=>pumpkinV(b,x,y+3*s,s*.95,{noleaf:s<.6})};
const CROP_LABEL={carrot:'Carrot',peas:'Peas',spinach:'Spinach',blueberries:'Blueberry','sweet-potato':'Sweet Potato',pumpkin:'Pumpkin'};
const CROP_COL={carrot:'#FFD0A8',peas:'#C9EBB4',spinach:'#B8DE9A',blueberries:'#C9CFF2','sweet-potato':'#F2C2B4',pumpkin:'#FFD9A0'};
function seedPacket(b,crop){
  const col=CROP_COL[crop];
  b.sh(RR(12,10,40,50,3),col,{k:.1,marks:[{pts:[[0,10],[64,10],[64,15],[0,15]],fill:mix(col,INK,.12),k:0}],inner:b.st(b.jl(12,15,52,15,.3),INK,.8,.5)});
  b.sh(RR(17,19,30,24,5),'#FFFBF3',{hatch:0,hl:0,lw:.7,base:'#FFFBF3'});
  CROP_FN[crop](b,32,31,.42);
  b.tx(32,54,CROP_LABEL[crop],crop==='sweet-potato'?7.6:10,{});
  [[50,60],[55,57],[58,61]].forEach(([x,y],i)=>b.sh(E(x,y,1.9,1.4,8,i),crop==='peas'?'#BDE6A2':crop==='pumpkin'?'#FFF2DA':'#C9A27A',{hatch:0,hl:0,lw:.45,dr:.1}));
  b.ex('spark',8,12,3.2);
}
// dish toppings, reused by the dish items (64) and the dog bowl (120)
function riceVeg(b,cx,cy,w,h,s){
  let g='';for(let i=0;i<Math.round(28*s+10);i++){const x=cx-w*.36+b.r()*w*.72,y=cy-h*.7+b.r()*h*.7;g+=b.jl(x,y,x+2.2*s,y-.7*s,.15)}
  b.sh([[cx-w*.5,cy],[cx-w*.38,cy-h*.55],[cx-w*.15,cy-h*.92],[cx+w*.15,cy-h*.95],[cx+w*.38,cy-h*.6],[cx+w*.5,cy],[cx,cy+h*.2]],'#FFFDF6',{hatch:0,hl:0,lw:lwS(s)*.85,base:'#FFFFFF',inner:b.st(g,GRAPH,.8*s+.2,.8)});
  [[-.22,-.45,.3],[.12,-.7,1.1],[.25,-.3,-.5]].forEach(([dx,dy,a])=>{const x=cx+dx*w,y=cy+dy*h;b.sh(rot([[x-5*s,y-3*s],[x+4.5*s,y-4*s],[x+6*s,y+2*s],[x-1*s,y+4*s],[x-6*s,y+2*s]],a,x,y),'#EDB878',{k:.15,hatch:0,hl:0,lw:lwS(s)*.7,dr:.2})});
  [[-.05,-.4,.4],[-.32,-.15,1],[.34,-.55,.2],[.1,-.85,.8],[-.25,-.65,1.4],[.42,-.12,.6]].forEach(([dx,dy,a])=>{const x=cx+dx*w,y=cy+dy*h;b.sh(rot([[x-3*s,y-3*s],[x+3*s,y-3*s],[x+3*s,y+3*s],[x-3*s,y+3*s]],a,x,y),ORNG,{k:.1,hatch:0,hl:0,lw:lwS(s)*.6,dr:.15})});
  [[-.14,-.75],[.02,-.15],[.4,-.2],[-.38,-.4],[.22,-.82],[-.02,-.6],[.3,-.4],[-.42,-.08],[.12,-.3]].forEach(([dx,dy])=>b.sh(E(cx+dx*w,cy+dy*h,2.3*s+.3,2.3*s+.3,8),'#A9D98B',{hatch:0,hl:0,lw:lwS(s)*.5,dr:.1}));
}
function stewTop(b,cx,cy,rx,ry,s){
  b.sh(E(cx,cy,rx,ry,22),'#F2B84E',{hatch:0,hl:0,lw:lwS(s)*.75,base:'#F8D27E',inner:b.st(`M${R1(cx-rx*.6)} ${R1(cy)}q${R1(rx*.3)} ${R1(-ry*.5)} ${R1(rx*.6)} 0t${R1(rx*.6)} 0`,'#D9962E',1*s+.2,.7)});
  [[-.55,0,'#F29150'],[-.15,-.35,'#EED3AE'],[.3,.1,PUMP],[.6,-.2,'#F29150'],[.05,.4,'#EED3AE'],[-.35,.45,PUMP]].forEach(([dx,dy,c],i)=>{const x=cx+dx*rx,y=cy+dy*ry;
    b.sh(rot([[x-3.2*s,y-2.6*s],[x+3.2*s,y-2.8*s],[x+3.4*s,y+2.4*s],[x-3*s,y+2.6*s]],i*.7,x,y),c,{k:.15,hatch:0,hl:0,lw:lwS(s)*.6,dr:.15})});
  [[.2,-.5],[-.6,-.35],[.45,.5]].forEach(([dx,dy])=>b.dot(cx+dx*rx,cy+dy*ry,1.1*s+.2,'#FFFDF6'));
  b.sh(leafP(cx+rx*.1,cy-ry*.05,7*s,3.6*s,-.6),LEAFD,{hatch:0,hl:0,lw:lwS(s)*.5,dr:.1});
}
function scrambleTop(b,cx,cy,w,h,s){
  [[-.28,-.2,.3],[.22,-.25,.32],[0,-.55,.3],[-.05,-.05,.34],[.32,.05,.24],[-.35,.08,.22]].forEach(([dx,dy,r])=>b.sh(cloudP(cx+dx*w,cy+dy*h,r*w,r*w*.7,7,.22,28),'#FFE07A',{hatch:0,hl:0,lw:lwS(s)*.8,dr:.2,base:'#FFF0B0'}));
  [[-.2,-.35,.4],[.15,-.5,2.2],[.3,-.1,1.2],[-.3,0,-.4],[.05,-.15,2.8],[0,-.7,1]].forEach(([dx,dy,a])=>b.sh(leafP(cx+dx*w,cy+dy*h,7*s,3.8*s,a),'#5E9A58',{hatch:0,hl:0,lw:lwS(s)*.5,dr:.1}));
}
function mushTop(b,cx,cy,rx,ry,s){
  b.sh(E(cx,cy,rx,ry,22),'#B5AA7C',{hatch:0,hl:0,lw:lwS(s)*.75,base:'#C9C09A',marks:[{pts:cloudP(cx-rx*.3,cy,rx*.35,ry*.5,5,.3,20),fill:'#9C8F64'},{pts:cloudP(cx+rx*.35,cy+ry*.1,rx*.25,ry*.4,5,.3,20),fill:'#A7B585'}]});
  [[-.4,-.1,2.6],[.2,-.3,1.8],[.5,.15,2.2]].forEach(([dx,dy,r])=>b.loop(E(cx+dx*rx,cy+dy*ry,r*s+.4,r*s*.8+.3,10),{w:.8*s+.2,col:'#6E6440'}));
}
function crunchie(b,x,y,r,a){b.sh(E(x,y,r,r*.8,14,a),'#F4A35A',{hatch:0,hl:0,lw:Math.max(.55,r/9),dr:.2,base:'#F7BE85',
  inner:b.st(`M${R1(x-r*.5)} ${R1(y-r*.3)}l${R1(r)} ${R1(r*.6)}M${R1(x+r*.5)} ${R1(y-r*.3)}l${R1(-r)} ${R1(r*.6)}`,'#C46F2E',Math.max(.6,r/8),.7)});
  [[-.4,.2],[.3,-.35],[.1,.45]].forEach(([dx,dy])=>b.dot(x+dx*r,y+dy*r,Math.max(.5,r*.1),'#FFF2DA'))}
function plateV(b,cx,cy,rx,ry,rim,inn){b.sh(E(cx,cy+2,rx,ry,22),mix(rim,INK,.15),{hatch:0,hl:0,lw:.9});b.sh(E(cx,cy,rx,ry,22),rim,{hatch:0,hl:0});b.sh(E(cx,cy-.5,rx*.76,ry*.7,20),inn,{hatch:0,hl:0,lw:.6,base:inn})}
function canV(b,s,ox,oy){const S=pts=>pts.map(p=>[ox+p[0]*s,oy+p[1]*s]);
  b.ln(S([[18,28],[19,16],[28,11],[38,16],[40,28]]),{w:3.2*s});
  b.sh(S([[40,45],[50,33],[56,24],[58.5,26],[53,36],[43,50]]),'#7CC3B8',{k:.1,hatch:0,hl:0,lw:.8*s+.2});
  b.sh(rot(S([[54,18],[61,22],[59,28],[52,24]]),0,0,0),'#7CC3B8',{k:.2,hatch:0,hl:0,lw:.8*s+.2});
  b.sh(S([[13,27],[44,27],[46,54],[11,54]]),'#9ED8D2',{k:.06,marks:[{pts:S([[0,33],[64,33],[64,37],[0,37]]),fill:'#7CC3B8',k:0}]});
}
const DISH_NAMES=['Carrot Crunchies','Chicken & Veggie Rice','Blueberry Pupsicle','Pumpkin Pupcake','Golden Harvest Stew','Spinach Scramble','Mystery Mush'];
const PEOPLE_DRAW={
 'Onion'(b){b.ln([[24,56],[22,61]],{w:1});b.ln([[30,57],[30,62]],{w:1});b.ln([[36,56],[38,61]],{w:1});
  b.sh([[32,5],[35,15],[47,24],[53,38],[46,52],[32,57],[18,52],[11,38],[17,24],[29,15]],'#E9B98A',{k:.15,det:[[[32,14],[24,30],[24,46],[29,55]],[[32,14],[40,30],[40,46],[35,55]],[[30,16],[18,32],[18,46]]],dcol:'#B07A4E',dw:.8})},
 'Garlic'(b){b.ln([[30,10],[32,4],[35,2]],{w:1.4,col:'#B8A88A'});
  b.sh(E(21,39,10.5,15,14,-.25),'#F6EFE2',{hl:0});b.sh(E(43,39,10.5,15,14,.25),'#F6EFE2',{hl:0});
  b.sh([[32,12],[40,24],[43,40],[38,54],[32,57],[26,54],[21,40],[24,24]],'#FBF7EE',{k:.15,marks:[{pts:[[29,20],[32,14],[33,40],[30,50]],fill:'#D9C2E8',op:.7}],det:[[[32,16],[32,54]]],dw:.7});
  [[26,58],[32,60],[38,58]].forEach(([x,y])=>b.ln([[x,y-3],[x+(x-32)*.2,y+2]],{w:.9}))},
 'Grapes'(b){b.ln([[34,4],[33,12]],{w:2,col:'#7A6A3A'});b.sh(leafP(34,8,16,9,-.3),LEAF,{hatch:0,hl:0,lw:.7});
  [[24,18],[34,17],[44,19],[19,28],[29,27],[39,27],[49,29],[24,37],[34,37],[44,38],[29,46],[39,46],[34,55]].forEach(([x,y])=>{b.sh(E(x,y,6,6,12),'#A07CC9',{hatch:0,hl:0,lw:.7,dr:.2});b.ex('glint',x-2.4,y-.6,3)})},
 'Chocolate'(b){const A=-.25;
  b.sh(rot(RR(12,10,40,44,3),A,32,32),'#8B5A3C',{k:.08,inner:''});
  let g='';for(let i=1;i<3;i++){g+=polyD(rot([[12+i*40/3,10],[12+i*40/3,30]],A,32,32))}for(let j=1;j<2;j++)g+=polyD(rot([[12,10+j*10],[52,10+j*10]],A,32,32));
  b.raw(b.st(g,'#5E3A26',1,.8));
  b.sh(rot([[11,30],[53,30],[53,55],[11,55]],A,32,32),'#E46F6B',{k:0,marks:[{pts:rot([[11,30],[53,30],[53,34],[11,34]],A,32,32),fill:'#DCDDE3',k:0}]});
  b.tx(32,47,'CHOC',11,{rot:-14})},
 'Raisins'(b){b.sh([[14,14],[44,10],[48,50],[18,54]],'#E46F6B',{k:0,marks:[{pts:[[14,22],[46,18],[47,34],[16,38]],fill:'#FFF2DA',k:0}]});b.tx(31,31,'RAISINS',8.5,{rot:-7});
  b.sh(E(31,46,6,4,10),'#FFE07A',{hatch:0,hl:0,lw:.6});
  [[50,56,0],[56,52,1],[44,59,2],[57,59,.5]].forEach(([x,y,a])=>b.sh(cloudP(x,y,3.4,2.6,5,.3,16),'#5E3A3E',{hatch:0,hl:0,lw:.5,base:'#7A4A50',dr:.1}))},
 'Coffee'(b){b.ln([[24,19],[22,14],[25,9],[23,3]],{w:1.4,col:GRAPH});b.ln([[34,19],[36,14],[33,9],[35,3]],{w:1.4,col:GRAPH});
  b.ln([[44,30],[52,31],[53,40],[45,44]],{w:3.6});b.ln([[44,30],[52,31],[53,40],[45,44]],{w:1.8,col:'#FFF2DA'});
  b.sh([[12,24],[46,24],[44,54],[38,58],[20,58],[14,54]],'#FFF2DA',{k:.1,marks:[{pts:[[0,36],[64,36],[64,40],[0,40]],fill:'#F7B2C4',k:0}]});
  b.sh(E(29,24,17,4.4,16),'#7A4A2E',{hatch:0,hl:0,lw:.8});
  [[54,54,.5],[58,59,-.3]].forEach(([x,y,a])=>b.sh(E(x,y,3.6,2.6,10,a),'#7A4A2E',{hatch:0,hl:0,lw:.55,det:[[[x-2.4,y],[x+2.4,y]]],dcol:'#C99A72',dw:.5}))},
 'Sugar-free Gum'(b){
  b.sh(rot([[36,10],[46,10],[46,40],[36,40]],.2,41,25),'#DCDDE3',{k:0,hatch:0});
  b.sh([[10,24],[50,24],[52,54],[12,56]],'#9FD9C0',{k:.05,marks:[{pts:[[0,34],[64,34],[64,44],[0,44]],fill:'#FFFFFF',k:0}]});b.tx(31,43,'GUM',10,{});
  b.ex('spark',56,16,3.4)},
 'Macadamia Nuts'(b){
  [[20,40,13],[44,44,12]].forEach(([x,y,r])=>b.sh(E(x,y,r,r,16),'#8E5F3E',{det:[[[x-r*.6,y-r*.5],[x,y-r*.1],[x+r*.5,y+r*.6]]],dcol:'#5E3A26',dw:.8}));
  b.sh(E(38,22,10,9.5,14),'#F2E3C4',{hatch:0});b.sh(E(18,18,7,6.6,12),'#F2E3C4',{hatch:0,hl:0})},
 'Avocado'(b){
  b.sh([[44,10],[52,20],[56,40],[50,54],[40,58],[34,48],[32,30],[36,16]],'#4E7A3E',{k:.2,hl:0});
  b.sh([[22,14],[30,20],[34,36],[32,52],[22,58],[12,52],[8,36],[14,20]],'#5E8A48',{k:.2,hl:0});
  b.sh([[22,18],[28,23],[31,36],[29,50],[22,54],[14,50],[11,36],[16,23]],'#D9E8A0',{k:.2,hatch:0,hl:0,lw:.6});
  b.sh(E(21,39,7,7.5,14),'#A0683E',{hatch:0,lw:.8})}
};
const DISH_DRAW={
 'Carrot Crunchies'(b){
  b.sh(rot(RR(8,22,48,34,3),-.1,32,39),'#FFFFFF',{k:0,hatch:0,hl:0,marks:[0,1,2,3,4].map(i=>({pts:rot([[8+i*10,20],[13+i*10,20],[13+i*10,58],[8+i*10,58]],-.1,32,39),fill:'#F9C7C2',k:0,op:.7}))});
  [[20,40,8,.2],[36,44,8.5,1],[46,34,7.5,.5],[28,30,7.5,1.6],[16,50,6.5,.8]].forEach(([x,y,r,a])=>crunchie(b,x,y,r,a));
  b.sh(leafP(44,22,10,4,-1.2),LEAF,{hatch:0,hl:0,lw:.6});b.sh(leafP(44,22,9,3.6,-.5),LEAFD,{hatch:0,hl:0,lw:.6});b.ex('spark',56,12,3.6)},
 'Chicken & Veggie Rice'(b){b.ln([[26,18],[24,14],[27,10],[25,5]],{w:1.3,col:GRAPH});b.ln([[38,17],[40,13],[37,9],[39,4]],{w:1.3,col:GRAPH});
  plateV(b,32,44,29,12,'#BDE7D2','#FFFDF6');riceVeg(b,32,46,42,26,.62)},
 'Blueberry Pupsicle'(b){
  b.sh(RR(29,44,6,18,3),'#E9C9A0',{hatch:0,hl:0,lw:.8});
  b.sh(RR(17,6,30,42,13),'#A6A2E6',{marks:[{pts:RR(19,8,10,36,5),fill:'#C9C6F4',op:.8}]});
  paw(b,32,24,4.2,'#C9C6F4',{noline:1});
  [[22,38],[38,40],[42,16],[24,12],[31,42]].forEach(([x,y])=>berryV(b,x,y,3.2,'#5E6FC0'));
  b.sh(drop(40,52,2.6),'#A6A2E6',{hatch:0,hl:0,lw:.5,dr:.1});b.ex('spark',54,10,4,'#E3F2FC');b.ex('spark',10,30,3,'#E3F2FC')},
 'Pumpkin Pupcake'(b){
  b.sh([[11,38],[13,31],[19,27],[22,21],[30,17.5],[38,19],[43,24],[48,28],[52,33],[53,38]],'#FBBF7A',{det:[[[18,32],[26,29],[34,31],[42,28],[47,32]],[[24,24],[31,22],[38,24]]],dw:1,dcol:'#D98A3E'});
  [[20,33],[28,27],[38,31],[44,34],[32,24]].forEach(([x,y])=>b.dot(x,y,.9,'#FFF2DA'));
  pumpkinV(b,33,13,.36,{noleaf:1});b.sh(leafP(36,6,8,4,-.4),LEAF,{hatch:0,hl:0,lw:.5});
  b.sh([[14,38],[50,38],[45,59],[19,59]],'#D9A86A',{k:0,det:[[[21,40],[23,57]],[[27,40],[28,58]],[[33,40],[33,58]],[[39,40],[38,58]],[[45,40],[42,57]]],dw:.9});
  b.ex('heart',9,22,3);b.ex('spark',56,16,3.6)},
 'Golden Harvest Stew'(b){b.ln([[24,18],[22,14],[25,10],[23,5]],{w:1.3,col:GRAPH});b.ln([[40,17],[42,13],[39,9],[41,4]],{w:1.3,col:GRAPH});
  bowl(b,32,36,26,7,18,'#D99A6A','#B9774A',()=>stewTop(b,32,36.5,22,5.4,.62));golden(b,[[56,12,4],[8,26,3.2]])},
 'Spinach Scramble'(b){plateV(b,32,42,29,13,'#B9D4F3','#FFFFFF');scrambleTop(b,32,44,38,20,.62);b.ex('spark',56,14,3.6)},
 'Mystery Mush'(b){b.tx(48,16,'?',18,{rot:12});b.ln([[22,20],[20,15],[23,11],[21,6]],{w:1.3,col:'#8FAF7A'});
  bowl(b,32,38,26,7,18,'#C9C3BC','#A8A29A',()=>mushTop(b,32,38.5,22,5.4,.62))}
};
Object.assign(ITEMS,{
 'Carrot Seeds'(b){seedPacket(b,'carrot')},'Pea Seeds'(b){seedPacket(b,'peas')},'Spinach Seeds'(b){seedPacket(b,'spinach')},
 'Blueberry Seeds'(b){seedPacket(b,'blueberries')},'Sweet Potato Seeds'(b){seedPacket(b,'sweet-potato')},'Pumpkin Seeds'(b){seedPacket(b,'pumpkin')},
 'Carrot'(b){carrotV(b,40,36,.8,.55);carrotV(b,26,38,1.05,-.45);b.ex('spark',56,54,3.6)},
 'Peas'(b){podV(b,32,30,1.1,-.35);[[16,50],[26,54],[44,52]].forEach(([x,y])=>{b.sh(E(x,y,4.4,4.4,10),'#BDE6A2',{hatch:0,hl:0,lw:.7});b.ex('glint',x-1.6,y-.6,2.4)});b.ex('spark',56,10,3.4)},
 'Spinach'(b){spinachV(b,28,54,1.0,-2.5,LEAFD);spinachV(b,36,54,1.0,-.64,LEAFD);spinachV(b,30,55,1.05,-1.95);spinachV(b,34,55,1.05,-1.2,'#6FB06A');
  b.sh(RR(25,49,14,6,2),'#E2C49A',{hatch:0,hl:0,lw:.7});b.ex('spark',56,12,3.4)},
 'Blueberries'(b){b.ln([[38,8],[34,16]],{w:1.6,col:'#7A6A3A'});b.sh(leafP(37,10,14,7.5,-.3),LEAF,{hatch:0,hl:0,lw:.7});b.sh(leafP(35,13,12,6.5,2.8),LEAFD,{hatch:0,hl:0,lw:.7});
  [[24,30,8],[40,30,8],[32,44,8.5],[16,44,7],[48,45,7],[24,56,6.5],[40,56,6.5]].forEach(([x,y,r])=>berryV(b,x,y,r))},
 'Sweet Potato'(b){sweetV(b,26,24,.7,.3);sweetV(b,32,42,1.05,-.25);b.ex('spark',56,10,3.4)},
 'Pumpkin'(b){pumpkinV(b,32,38,1.15);b.ex('spark',56,14,3.6)},
 'Oats'(b){
  b.sh(RR(14,17,36,42,8),'#EEF5FA',{hl:0,base:'#F8FBFD',marks:[{pts:[[0,30],[64,30],[64,64],[0,64]],fill:'#EED9A8',k:0}],
   inner:[[20,36],[28,40],[36,35],[44,40],[22,48],[32,50],[42,47],[26,55],[38,55]].map(([x,y])=>`<ellipse cx="${x}" cy="${y}" rx="2.6" ry="1.6" fill="#F8EACB" stroke="#C9A46A" stroke-width=".6"/>`).join('')});
  b.sh(RR(12,9,40,10,3),'#F08A86',{hatch:0,hl:0,marks:[0,1,2,3].map(i=>({pts:[[14+i*10,0],[19+i*10,0],[19+i*10,20],[14+i*10,20]],fill:'#FFF2DA',k:0,op:.8}))});
  b.sh(RR(20,22,24,10,2),'#FFFBF3',{hatch:0,hl:0,lw:.6});b.tx(32,30.5,'oats',9,{});b.ex('glint',18,40,5)},
 'Rice'(b){
  b.sh([[18,18],[46,18],[52,32],[54,50],[48,59],[16,59],[10,50],[12,32]],'#F3EBDD',{k:.15,sh:'#C9B89A'});
  b.sh([[20,18],[16,9],[24,12],[32,7],[40,12],[48,9],[44,18]],'#F8F2E8',{k:.1,hatch:0,hl:0});b.ln([[18,19],[32,21],[46,19]],{w:2.4,col:'#C99A72'});
  b.sh(E(32,40,12,8,14),'#FFFBF3',{hatch:0,hl:0,lw:.7});b.tx(32,43.5,'RICE',9,{col:'#C46F2E'});
  [[54,58,.3],[58,55,1],[50,61,2],[59,60,1.6]].forEach(([x,y,a])=>b.raw(`<ellipse cx="${x}" cy="${y}" rx="2" ry="1" transform="rotate(${R1(a*57)} ${x} ${y})" fill="#fff" stroke="${INK}" stroke-width=".5"/>`,'top'))},
 'Egg'(b){b.ln([[10,56],[20,52]],{w:1.2,col:'#D9B77E'});b.ln([[44,58],[56,54]],{w:1.2,col:'#D9B77E'});b.ln([[16,59],[50,59]],{w:1.2,col:'#D9B77E'});
  b.sh([[40,10],[49,18],[53,32],[49,46],[40,50],[31,46],[27,32],[31,18]],'#EFD2B0',{k:.2});
  b.sh([[25,18],[34,26],[38,40],[34,54],[25,58],[16,54],[12,40],[16,26]],'#FFF8EE',{k:.2,base:'#FFFFFF'});b.ex('glint',19,34,5);b.ex('spark',56,10,3.4)},
 'Chicken'(b){
  b.sh(rot(RR(6,14,52,40,3),-.12,32,34),'#FFFDF6',{k:0,hatch:0,hl:0,lw:.8,marks:[{pts:[[0,46],[64,40],[64,64],[0,64]],fill:'#F4EFE6',k:0}]});
  b.sh([[11,36],[18,26],[33,22],[49,25],[56,33],[51,42],[35,46],[19,45]],'#F7C3B0',{k:.2,base:'#FBDCD0',sh:'#D9907A',
   inner:b.st(b.jl(18,32,46,29,.4)+b.jl(16,38,48,36,.4)+b.jl(24,43,44,41,.4),'#E39A86',.9,.7)});
  b.sh(leafP(46,22,9,4.6,-.8),LEAF,{hatch:0,hl:0,lw:.6});b.sh(leafP(46,22,8,4,-.1),LEAFD,{hatch:0,hl:0,lw:.6})},
 'Watering Can'(b){canV(b,1,0,0);[[60,32],[57,37],[62,38]].forEach(([x,y])=>b.sh(drop(x,y,2.4),'#8EC5EE',{hatch:0,hl:0,lw:.5,dr:.1}));
  [[16,30],[16,50],[42,30],[42,50]].forEach(([x,y])=>b.dot(x,y,.8,'#5E9A98'));b.ex('glint',18,40,6)},
 ...DISH_DRAW,...PEOPLE_DRAW
});
Object.assign(ICONS,{
 garden(b){b.sh([[5,58],[11,47],[24,41],[40,41],[53,47],[59,58]],SOIL,{k:.15,hl:0});b.ln([[32,45],[32,26]],{w:3.4,col:'#6FA35A'});
  b.sh(leafP(32,30,20,12,-Math.PI/2-.95),LEAF,{hl:0});b.sh(leafP(32,27,18,11,-Math.PI/2+.85),LEAFD,{hl:0})},
 kitchen(b){[[22,19],[32,17],[42,19]].forEach(([x,y])=>b.ln([[x,y],[x-2.5,y-5],[x+1,y-10],[x-1.5,y-15]],{w:2.4,col:GRAPH}));
  b.ln([[8,32],[4,34]],{w:3.2});b.ln([[56,32],[60,34]],{w:3.2});
  b.sh([[11,30],[53,30],[50,52],[44,57],[20,57],[14,52]],'#F08A86',{k:.08});b.sh(RR(7,25,50,8,3),'#E46F6B',{hatch:0,hl:0})},
 seeds(b){b.sh(RR(13,6,38,52,3),'#FFD0A8',{marks:[{pts:[[0,6],[64,6],[64,12],[0,12]],fill:'#F2B48A',k:0}]});b.sh(RR(19,18,26,22,5),'#FFFBF3',{hatch:0,hl:0,lw:.7,base:'#FFFBF3'});
  b.ln([[32,36],[32,27]],{w:2.2,col:'#6FA35A'});b.sh(leafP(32,29,9,6,-2.4),LEAF,{hatch:0,hl:0,lw:.7});b.sh(leafP(32,28,9,6,-.7),LEAFD,{hatch:0,hl:0,lw:.7});
  [[24,49],[32,51],[40,49]].forEach(([x,y])=>b.sh(E(x,y,2.6,1.8,8),'#C9A27A',{hatch:0,hl:0,lw:.6}))},
 'water-can'(b){canV(b,1,0,2)},
 basket(b){carrotV(b,22,24,.55,-.5);b.sh(leafP(36,30,16,9,-1.9),LEAFD,{hatch:0,hl:0,lw:.8});b.sh(leafP(38,30,15,8,-1.0),LEAF,{hatch:0,hl:0,lw:.8});
  b.sh(E(44,28,7,6.4,12),PUMP,{hatch:0,hl:0,lw:.8});
  b.ln([[12,34],[16,12],[32,6],[48,12],[52,34]],{w:3});
  b.sh([[6,32],[58,32],[51,57],[13,57]],'#E2B07E',{k:.05,inner:b.st(b.jl(8,40,56,40,.3)+b.jl(10,48,54,48,.3)+[16,24,32,40,48].map(x=>b.jl(x,33,x-(x-32)*.12,56,.3)).join(''),'#9C6E4C',1.2,.7)})},
 recipe(b){
  b.sh([[4,20],[32,24],[60,20],[60,54],[32,58],[4,54]],'#C58F5E',{k:0,hatch:0,hl:0});
  b.sh([[6,15],[31,19],[31,53],[6,49]],'#FFFBF3',{k:.05,hl:0,base:'#FFFBF3',inner:b.st(b.jl(10,26,27,28,.3)+b.jl(10,33,27,35,.3)+b.jl(10,40,24,42,.3),GRAPH,1.4,.9)});
  b.sh([[33,19],[58,15],[58,49],[33,53]],'#FFFBF3',{k:.05,hl:0,base:'#FFFBF3'});paw(b,46,35,5,'#F28FA5',{lw:.6})},
 drop(b){b.sh(drop(32,30,25),'#8EC5EE',{});b.ex('glint',24,36,7)},
 'paw-stop'(b){const oct=r=>{const p=[];for(let i=0;i<8;i++){const a=(i+.5)/8*Math.PI*2;p.push([32+Math.cos(a)*r,32+Math.sin(a)*r])}return p};
  b.sh(oct(29),'#E2463F',{k:.03,hl:0,hatch:0});b.sh(oct(23),'#FFFFFF',{k:.03,hl:0,hatch:0,lw:.6,base:'#fff'});paw(b,32,36,7.6,'#E0453F',{noline:1})},
 'season-spring'(b){b.sh(leafP(32,46,18,9,.5),LEAF,{hatch:0,hl:0,lw:.8});b.sh(flowerP(30,28,24,5,.3),C.pink,{});b.sh(E(30,28,7,7,12),'#FFD06B',{hatch:0,hl:0})},
 'season-summer'(b){let d='';for(let i=0;i<10;i++){const a=i/10*Math.PI*2;d+=b.jl(32+Math.cos(a)*21,32+Math.sin(a)*21,32+Math.cos(a)*29,32+Math.sin(a)*29,.3)}b.raw(b.st(d,'#F2A33C',4));b.sh(E(32,32,16,16,20),'#FFD04D',{})},
 'season-autumn'(b){b.ln([[32,46],[33,52],[37,58]],{w:2.4});
  b.sh([[32,4],[38,14],[46,12],[46,22],[56,26],[47,34],[49,44],[36,41],[32,50],[28,41],[15,44],[17,34],[8,26],[18,22],[18,12],[26,14]],'#F28A4E',{k:.08,det:[[[32,12],[32,46]],[[32,30],[44,22]],[[32,30],[20,22]]],dw:1.2})},
 'season-winter'(b){let d='';for(let i=0;i<6;i++){const a=i/6*Math.PI*2-Math.PI/2,c=Math.cos(a),s=Math.sin(a);d+=`M32 32L${R1(32+c*27)} ${R1(32+s*27)}`;
   [14,21].forEach(r=>{const x=32+c*r,y=32+s*r;d+=`M${R1(x+Math.cos(a+2.3)*6)} ${R1(y+Math.sin(a+2.3)*6)}L${R1(x)} ${R1(y)}L${R1(x+Math.cos(a-2.3)*6)} ${R1(y+Math.sin(a-2.3)*6)}`})}
  b.raw(b.st(d,INK,5.2));b.raw(b.st(d,'#9FD3F0',2.6));b.dot(32,32,3,'#9FD3F0','top')},
 fridge(b){b.sh(RR(14,4,36,54,6),'#E6F1FA',{});b.ln([[14.5,24],[49.5,24]],{w:2});b.ln([[43,10],[43,19]],{w:3});b.ln([[43,29],[43,42]],{w:3});
  b.sh(heartP(24,36,9),C.pinkD,{hatch:0,hl:0,lw:.6});b.sh(E(26,14,3,3,8),'#FFE07A',{hatch:0,hl:0,lw:.6});b.ln([[18,58],[18,61]],{w:2.4});b.ln([[46,58],[46,61]],{w:2.4})}
});
// crop growth prop ------------------------------------------------------
function cropProp(b,crop,stage,dry){
  const G=110,X=80,lc=dry?'#CACF92':LEAF,ld=dry?'#B5BC7E':LEAFD,dark=dry?'#A9B272':'#5FA05A';
  const D=a=>dry?a+(Math.cos(a)>=0?.55:-.55):a;            // droop: tip leaves toward the ground
  const lf=(x,y,len,wid,a,c,o={})=>b.sh(leafP(x,y,len*(dry?.9:1),wid,D(a)),c||lc,{hatch:o.h?1:0,hl:0,lw:o.lw||.75,dr:.3,det:o.vein?[[[x,y],[x+Math.cos(D(a))*len*.8,y+Math.sin(D(a))*len*.8]]]:undefined,dw:.7});
  const mound=(w)=>b.sh([[X-w,G],[X-w*.6,G-6],[X,G-8],[X+w*.6,G-6],[X+w,G]],SOIL,{k:.2,hatch:0,hl:0,lw:.9});
  if(stage===0){
    b.ln([[112,G],[112,74]],{w:2.6,col:'#9C6E4C'});
    b.sh(RR(92,60,44,18,3),CROP_COL[crop]||'#FFF2DA',{hatch:0,hl:0,lw:.8});b.tx(114,73,CROP_LABEL[crop]||'Seeds',crop==='sweet-potato'?9:11,{mid:1});b.dot(112,63,1,'#9C6E4C');
    mound(22);[[72,105],[80,103],[88,105]].forEach(([x,y])=>b.sh(E(x,y,2,1.4,8),'#E9D7BE',{hatch:0,hl:0,lw:.45,dr:.1}));return}
  if(stage===1){
    mound(18);
    if(crop==='carrot'){[-.5,0,.5].forEach(d=>lf(X,G-6,20,4.5,-Math.PI/2+d))}
    else{b.ln([[X,G-6],[X,G-24]],{w:2,col:'#6FA35A'});const big=crop==='pumpkin'||crop==='sweet-potato'?1.35:1;
      lf(X,G-22,13*big,8*big,-Math.PI/2-1);lf(X,G-22,13*big,8*big,-Math.PI/2+1,ld);
      if(crop==='peas')b.ln([[X,G-24],[X+3,G-32],[X+8,G-31],[X+6,G-27]],{w:1,col:'#6FA35A'})}
    return}
  const ready=stage>=3;
  if(crop==='carrot'){
    const tops=ready?[[58,1.25],[80,1.4],[102,1.25]]:[[68,1.15],[92,1.15]];
    tops.forEach(([x,s])=>{[-.75,-.35,0,.35,.75].forEach((d,i)=>{const L=(i===2?40:i%2?34:26)*s;lf(x,G-(ready?8:2),L,6.5*s,-Math.PI/2+d,i%2?ld:lc,{vein:1})})});
    if(ready)tops.forEach(([x])=>b.sh([[x-9,G+1],[x-8,G-7],[x,G-10],[x+8,G-7],[x+9,G+1]],ORNG,{k:.2,hatch:0,lw:.95,hl:0,det:[[[x-4,G-4],[x-1,G-3.6]]],dw:.7}));
    else mound(24);
  } else if(crop==='peas'){
    b.ln([[64,G],[64,ready?16:34]],{w:2.4,col:'#C9A97E'});b.ln([[96,G],[96,ready?16:34]],{w:2.4,col:'#C9A97E'});b.ln([[60,ready?30:46],[100,ready?30:46]],{w:2,col:'#C9A97E'});
    const top=ready?20:40;b.ln([[80,G],[74,G-20],[86,G-40],[74,G-60],[84,top+8],[80,top]],{w:1.8,col:'#6FA35A'});
    for(let y=G-12;y>top;y-=14){const s=(y/14|0)%2?1:-1;lf(80+s*4,y,16,10,s>0?-.5:Math.PI+.5,s>0?lc:ld);lf(80-s*2,y-6,13,8,s>0?Math.PI+.4:-.4,lc)}
    b.ln([[86,G-40],[94,G-46],[92,G-52],[88,G-50]],{w:1,col:'#6FA35A'});b.ln([[74,G-60],[66,G-64],[67,G-70],[71,G-68]],{w:1,col:'#6FA35A'});
    if(ready){[[70,52,1.4],[92,64,1.75],[70,82,1.3],[92,90,1.8],[84,40,1.6]].forEach(([x,y,a])=>podV(b,x,y,.55,a))}
    else [[88,62],[72,74]].forEach(([x,y])=>b.sh(flowerP(x,y,4.4,5,.2),'#FFFFFF',{hatch:0,hl:0,lw:.6,base:'#fff'}));
  } else if(crop==='spinach'){
    const s=ready?1.55:1.05,angs=[-2.6,-2.1,-1.57,-1.05,-.55,-1.85,-1.3];
    angs.forEach((a,i)=>{const x=X+(i-3)*2;b.sh(leafP(x,G-2,30*s*(dry?.9:1),17*s,D(a)),dry?(i%2?'#B5BC7E':'#C3C98C'):(i%2?'#5FA05A':'#6FB06A'),{hatch:ready?1:0,hl:0,lw:.85,dr:.3,
      det:[[[x,G-2],[x+Math.cos(D(a))*26*s,G-2+Math.sin(D(a))*26*s]]],dcol:dry?'#8E9460':'#3E7A3E',dw:.7})});
    if(ready&&!dry)b.ex('spark',118,30,5);
  } else if(crop==='blueberries'){
    b.ln([[80,G],[78,G-24]],{w:3,col:'#8E6446'});b.ln([[79,G-14],[66,G-32]],{w:2.2,col:'#8E6446'});b.ln([[79,G-12],[94,G-34]],{w:2.2,col:'#8E6446'});
    [[80,56,30,20,lc],[60,68,20,15,ld],[100,66,20,15,ld],[80,74,26,14,lc]].forEach(([x,y,rx,ry,c])=>b.sh(cloudP(x,y-(ready?6:0),rx*(ready?1.15:1),ry*(dry?.85:1),9,.22,40),c,{hl:0,ho:.35}));
    if(ready){[[64,58],[70,64],[86,46],[92,52],[98,64],[104,58],[76,74],[84,72],[60,72],[90,78]].forEach(([x,y])=>berryV(b,x,y,4.6))}
    else [[70,60],[88,52],[96,68],[76,72]].forEach(([x,y])=>b.sh(E(x,y,3.4,3.4,10),'#C8E3A0',{hatch:0,hl:0,lw:.6}));
  } else if(crop==='sweet-potato'){
    if(ready){sweetV(b,64,G-3,.8,.15);sweetV(b,98,G-2,.7,-.2);b.sh([[40,G+.5],[50,G-3],[110,G-3],[124,G+.5]],SOIL,{k:.2,hatch:0,hl:0,lw:.8})}
    b.ln([[80,G-4],[54,G-10],[30,G-6]],{w:1.6,col:'#7A5A6A'});b.ln([[80,G-4],[106,G-12],[132,G-6]],{w:1.6,col:'#7A5A6A'});b.ln([[80,G-4],[80,G-30]],{w:1.6,col:'#7A5A6A'});
    [[36,G-8,-2.1],[56,G-12,-1.9],[80,G-30,-1.57],[104,G-14,-1.25],[124,G-8,-1.05],[68,G-22,-1.85],[92,G-24,-1.35]].forEach(([x,y,a],i)=>{
      const L=ready?26:20;b.sh(rot(heartP(x+Math.cos(D(a))*L*.5,y+Math.sin(D(a))*L*.5,L),D(a)+Math.PI/2+Math.PI,x+Math.cos(D(a))*L*.5,y+Math.sin(D(a))*L*.5),i%2?ld:lc,{hatch:0,hl:0,lw:.75,dr:.3})});
  } else if(crop==='pumpkin'){
    b.ln([[80,G-2],[50,G-6],[30,G-4],[22,G-12],[28,G-18],[32,G-14]],{w:1.8,col:'#6FA35A'});b.ln([[80,G-2],[116,G-6],[136,G-3]],{w:1.8,col:'#6FA35A'});
    [[46,G-14,22],[108,G-16,24],[ready?120:80,ready?G-34:G-24,ready?18:26]].forEach(([x,y,r],i)=>b.sh(cloudP(x,y,r,r*(dry?.62:.78),5,.3,40),i%2?ld:lc,{hl:0,ho:.35,det:[[[x,y+r*.5],[x,y-r*.3]],[[x,y+r*.2],[x-r*.4,y-r*.2]],[[x,y+r*.2],[x+r*.4,y-r*.2]]],dcol:'#5E8E4A',dw:.7}));
    if(ready)pumpkinV(b,74,G-22,1.35,{noleaf:1});
    else{b.sh(starP(126,G-12,6,3,5),'#FFE07A',{k:.25,hatch:0,hl:0,lw:.6});b.sh(E(60,G-6,5,4.4,10),'#B8D88A',{hatch:0,hl:0,lw:.6})}
  } else {mound(18);lf(X,G-6,26,14,-2.2);lf(X,G-6,26,14,-.95,ld);lf(X,G-6,30,15,-1.57)}
  if(dry){b.ln([[50,24],[48,30]],{w:1.2,col:'#8EC5EE'});b.sh(drop(48,34,3),'#A9D6F5',{hatch:0,hl:0,lw:.5})}
}
function plotProp(b,w){
  const top=['#E2C49A','#BE946A','#9E744F','#82593B'][w],front=mix(top,INK,.22);
  b.sh([[10,96],[150,96],[147,116],[13,116]],front,{k:.05,hl:0,inner:b.st(b.jl(16,106,40,107,.4)+b.jl(70,104,96,105,.4)+b.jl(120,108,142,107,.4),mix(front,INK,.3),1,.6)});
  const rows=[72,84,96].map(y=>b.jl(18,y,142,y,.8)).join(''),hi=[69,81,93].map(y=>b.jl(20,y,140,y,.8)).join('');
  let cr='';if(w===0)[[30,74,8],[64,86,10],[104,72,9],[124,90,7],[48,92,7]].forEach(([x,y,s])=>{cr+=`M${x} ${y}l${s*.4} ${s*.3}l-${s*.2} ${s*.4}l${s*.5} ${s*.2}M${R1(x+s*.4)} ${R1(y+s*.3)}l${s*.6} -${s*.2}`});
  b.sh([[10,98],[13,68],[22,60],[138,60],[147,68],[150,98]],top,{k:.08,hl:0,sh:mix(top,INK,.35),
   inner:b.st(rows,mix(top,INK,.35),1.6,.7)+b.st(hi,mix(top,'#FFFFFF',.35),1.4,.7)+(cr?b.st(cr,mix(top,INK,.45),1.1,.8):'')+
    (w>=2?[[40,78,10,2.2],[96,88,14,2.6],[120,74,8,1.8]].map(([x,y,rx,ry])=>`<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#CFE6F5" opacity="${w===3?.7:.45}"/>`).join(''):'')});
  [[26,78],[58,70],[90,80],[118,92],[132,70],[70,94]].forEach(([x,y])=>b.sh(E(x,y,2,1.5,8),'#CFC7C0',{hatch:0,hl:0,lw:.45,dr:.1}));
  tuft(b,8,116,3.4);tuft(b,152,116,3);
}
PROPS.crop=function(b,o){cropProp(b,o.crop,o.stage,o.dry)};
PROPS.plot=function(b,o){plotProp(b,o.water)};
PROPS.pot=function(b){
  b.shadow(60,107,46,5);
  [[40,30],[60,26],[80,30]].forEach(([x,y])=>b.ln([[x,y],[x-4,y-8],[x+1,y-15],[x-2,y-22]],{w:1.8,col:GRAPH}));
  b.sh(ribbon([[22,58],[10,56],[8,64]],[6,5,4]),'#5E6470',{k:1/6,hatch:0,hl:0,lw:.8});b.sh(ribbon([[98,58],[110,56],[112,64]],[6,5,4]),'#5E6470',{k:1/6,hatch:0,hl:0,lw:.8});
  b.sh([[18,50],[102,50],[99,92],[90,104],[30,104],[21,92]],'#F08A86',{k:.1,marks:[{pts:[[0,68],[120,68],[120,76],[0,76]],fill:'#FFF2DA',k:0}]});
  b.sh(heartP(60,88,12),'#FFF2DA',{hatch:0,hl:0,lw:.6});
  b.sh([[14,52],[20,43],[40,37],[80,37],[100,43],[106,52]],'#E46F6B',{k:.12});b.sh(E(60,35,7,4.6,12),'#5E6470',{hatch:0,hl:0});
};
PROPS.board=function(b){
  b.shadow(96,108,88,5);
  b.sh([[10,40],[16,30],[170,30],[178,40],[178,94],[170,102],[16,102],[10,94]],'#E2B07E',{k:.08,inner:b.st(b.jl(20,46,150,44,.6)+b.jl(24,62,160,64,.6)+b.jl(18,82,140,80,.6),'#C58F5E',1.1,.8)});
  b.sh(RR(172,54,24,22,9),'#E2B07E',{hatch:0,hl:0});b.sh(E(183,65,5,5,10),'#FFFBF3',{hatch:0,hl:0,lw:.7,base:'#FFFBF3'});
  carrotV(b,52,62,1.15,Math.PI/2+.12);
  [[96,52],[110,58],[100,66],[118,48]].forEach(([x,y])=>{b.sh(E(x,y,6,5,12),ORNG,{hatch:0,hl:0,lw:.7,dr:.2});b.loop(E(x,y,2.6,2.2,8),{w:.7,col:'#C46F2E'})});
  b.sh([[86,84],[140,78],[148,82],[140,90],[86,92]],'#DCDDE3',{k:.08,hatch:0,marks:[{pts:[[86,84],[140,78],[142,81],[86,87]],fill:'#F4F6FA',k:0}]});
  b.sh(RR(52,82,36,11,4),'#9C6E4C',{hatch:0,hl:0});b.dot(62,87.5,1.2,'#E9D7BE');b.dot(76,87.5,1.2,'#E9D7BE');
};
PROPS.oven=function(b){
  b.sh(RR(12,150,14,8,2),'#5E6470',{hatch:0,hl:0,lw:.8});b.sh(RR(134,150,14,8,2),'#5E6470',{hatch:0,hl:0,lw:.8});
  b.sh(RR(10,10,140,142,10),'#FFF2DA',{});
  b.sh(RR(14,14,132,28,7),C.mint,{hatch:0,hl:0,lw:.8});
  [34,58,102,126].forEach((x,i)=>{b.sh(E(x,28,7,7,12),'#FFFFFF',{hatch:0,hl:0,lw:.8,base:'#fff'});b.ln([[x,28],[x+Math.cos(i)*5,28-Math.abs(Math.sin(i))*5]],{w:1.4})});
  b.sh(RR(70,21,20,14,3),'#5E6470',{hatch:0,hl:0,lw:.7});b.tx(80,32,'12:00',8,{mid:1,col:'#BDE7D2'});
  b.ln([[38,58],[122,58]],{w:5});b.ln([[38,58],[122,58]],{w:2.6,col:'#DCDDE3'});
  b.sh(RR(22,66,116,76,8),'#F7E3C4',{hatch:0,hl:0});
  b.sh(RR(34,76,92,54,8),'#FFC96B',{hatch:0,hl:0,base:'#FFE3A0',marks:[{pts:E(80,104,40,22,16),fill:'#FFE7A0',op:.8}]});
  b.ln([[38,118],[122,118]],{w:1.4,col:'#9C6E4C'});[[52,112],[68,110],[84,112],[100,110],[114,112]].forEach(([x,y],i)=>crunchie(b,x,y,5.4,i));
  b.ex('glint',44,86,7);
};
PROPS.dial=function(b){
  b.sh(E(80,80,76,76,32),'#FFE3C8',{hl:0,hatch:0});b.sh(E(80,80,70,70,32),'#FFFBF3',{hl:0,hatch:0,base:'#FFFBF3',lw:.8});
  const pt=(deg,r)=>[80+Math.cos(deg*Math.PI/180)*r,80-Math.sin(deg*Math.PI/180)*r];
  const arc=[];for(let d=210;d>=-30;d-=10)arc.push(pt(d,64));b.ln(arc,{w:1.6});
  for(let d=210;d>=-30;d-=10){const major=(210-d)%30===0;b.ln([pt(d,major?51:57),pt(d,63.5)],{w:major?2.4:1.3,tap:.15})}
  paw(b,80,128,4.2,'#F7B2C4',{noline:1});
};
PROPS['recipe-card']=function(b){
  const ns=`fill="none" stroke="${INK}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"`;
  const card=[[8,14],[192,11],[194,250],[6,253]];
  const edge=(a,c,j)=>{const pts=[];for(let i=0;i<=12;i++){const t=i/12;pts.push([R1(a[0]+(c[0]-a[0])*t+(b.r()-.5)*j),R1(a[1]+(c[1]-a[1])*t+(b.r()-.5)*j)])}return 'M'+pts.map(p=>p.join(' ')).join('L')};
  b.raw(`<path d="M12 20L198 17L199 258L10 259Z" fill="${SHADOW}" opacity=".8"/><path d="${polyD(card,true)}" fill="${PAPER}"/>`);
  let rl='';for(let y=70;y<240;y+=22)rl+=`M20 ${y}L182 ${y-1}`;
  b.raw(`<path d="${rl}" fill="none" stroke="#B9D4F3" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".7"/><path d="M34 40L34 244" fill="none" stroke="#F7B2C4" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".7"/>`);
  let d='';for(let i=0;i<4;i++){const a=card[i],c=card[(i+1)%4],dx=c[0]-a[0],dy=c[1]-a[1],L=Math.hypot(dx,dy);d+=edge([a[0]-dx/L*3.6,a[1]-dy/L*3.6],[c[0]+dx/L*6,c[1]+dy/L*6],1.1)}
  b.raw(`<path d="${d}" ${ns} stroke-width="2"/>`);
  b.raw(`<g transform="rotate(-4 100 12)"><path d="M70 4l3 2.6-3 2.6 3 2.6-3 2.6 3 2.6L130 20l-3-2.6 3-2.6-3-2.6 3-2.6-3-2.6Z" fill="#F9E19A" fill-opacity=".85"/><path d="M73 9H127M73 15H127" stroke="#fff" stroke-opacity=".6" stroke-width="2" stroke-dasharray="5 4"/></g>`,'top');
};
PROPS.squirrel=function(b){
  b.shadow(60,110,40,4);
  b.ln([[8,96],[18,96]],{w:1.4,col:GRAPH});b.ln([[4,86],[14,86]],{w:1.4,col:GRAPH});b.sh(cloudP(16,104,7,4,5,.3,20),'#F4F0EC',{hatch:0,hl:0,lw:.6,ink:GRAPH});
  b.sh(ribbon([[38,74],[22,64],[14,44],[20,24],[36,16],[46,24]],[16,24,28,26,20,12]),'#D9925C',{k:1/6,sh:'#A86A3E',marks:[{pts:ribbon([[22,58],[18,42],[24,28],[34,22]],[8,10,10,6]),fill:'#ECB383',op:.85}]});
  b.sh(ribbon([[50,82],[38,96],[24,102]],[11,8,6]),'#D9925C',{k:1/6,hatch:0,hl:0});
  b.sh(E(58,72,22,14,20,-.25),'#E3A06A',{marks:[{pts:E(64,80,13,7,14,-.25),fill:'#FFF2DA'}]});
  b.sh(ribbon([[74,80],[88,90],[98,94]],[8,6,5]),'#E3A06A',{k:1/6,hatch:0,hl:0});
  b.sh([[74,44],[78,32],[84,42]],'#D9925C',{k:.1,hatch:0,hl:0,lw:.8});
  b.sh(E(84,56,15,13.5,18),'#E3A06A',{hatch:0,marks:[{pts:E(91,62,8,6,12),fill:'#FFF2DA'},{pts:E(84,62,3.4,2.2,8),fill:PINK,op:.6}]});
  b.dot(88,52,2);b.dot(88.8,51.2,.7,'#fff','top');b.sh(E(98,57,2.6,2,8),'#5E463D',{hatch:0,hl:0,lw:.4,base:'#5E463D'});
  b.sh([[70,44],[80,36],[94,40],[92,46],[72,48]],'#5B6FA8',{k:.15,hatch:0,hl:0,lw:.9,marks:[{pts:[[70,44],[94,42],[93,45],[71,47]],fill:'#FFD56B',k:0}]});
  b.sh(starP(82,41,2.6,1.1),'#FFE07A',{k:0,hatch:0,hl:0,lw:.4,dr:.05});
  b.sh([[94,66],[106,66],[106,70],[104,76],[100,79],[96,76],[94,70]],'#E2A86E',{k:.15,hatch:0,hl:0,lw:.8});b.sh([[92,67],[93,62],[100,60],[107,62],[108,67]],'#B58560',{k:.15,hatch:0,hl:0,lw:.8});
  b.ex('spark',110,30,4.5);
};
PROPS.iou=function(b){
  b.shadow(52,74,40,3.5);
  b.sh(rot(RR(34,6,56,44,3),-.16,62,28),'#FFFBF3',{k:0,hl:0,base:'#FFFBF3',sh:'#C9B89A'});
  b.tx(62,36,'IOU',26,{mid:1,rot:-9});b.tx(76,48,'- C.F.',9,{mid:1,rot:-9,op:.8});
  b.sh([[12,58],[18,48],[34,42],[56,42],[72,48],[80,58],[70,70],[46,74],[22,70]],'#B58560',{k:.18,sh:'#7A5A3A',
   inner:b.st(b.jl(22,56,40,50,.5)+b.jl(44,52,66,58,.5)+b.jl(30,64,56,66,.5),'#7A5A3A',1,.7)});
  b.ex('heart',104,16,4);
};
PROPS.pip=function(b){
  b.raw('<ellipse cx="80" cy="112" rx="72" ry="84" fill="#E8F4EA" opacity=".9"/>','under');
  b.sh([[18,201],[24,166],[46,150],[114,150],[136,166],[142,201]],'#F4A6A0',{k:.12,marks:[0,1,2,3,4,5,6].map(i=>({pts:[[10+i*20,140],[18+i*20,140],[18+i*20,204],[10+i*20,204]],fill:'#FFF2DA',k:0,op:.75}))});
  b.sh([[52,201],[54,164],[106,164],[108,201]],'#9ED0C8',{k:.05,sh:'#6FA9A0'});b.ln([[56,166],[52,150]],{w:3,col:'#7CB8AE'});b.ln([[104,166],[108,150]],{w:3,col:'#7CB8AE'});
  b.sh(RR(68,174,24,18,3),'#8CC4BA',{hatch:0,hl:0,lw:.8});carrotV(b,86,170,.5,.3);
  b.sh(E(80,146,10,8,12),'#F6D3B5',{hatch:0,hl:0,lw:.8});
  b.sh(E(49,116,6.5,9,12),'#F6D3B5',{hatch:0,hl:0});b.sh(E(111,116,6.5,9,12),'#F6D3B5',{hatch:0,hl:0});
  b.sh(E(80,114,31,33,24),'#F6D3B5',{hl:0,marks:[{pts:E(64,124,5.6,3.4,10),fill:PINK,op:.6},{pts:E(96,124,5.6,3.4,10),fill:PINK,op:.6}]});
  b.sh(cloudP(52,104,7,9,5,.35,20),'#FFFFFF',{hatch:0,hl:0,lw:.7,base:'#fff'});b.sh(cloudP(108,104,7,9,5,.35,20),'#FFFFFF',{hatch:0,hl:0,lw:.7,base:'#fff'});
  b.loop(E(68,111,8,7,14),{w:1.5});b.loop(E(92,111,8,7,14),{w:1.5});b.ln([[76,110],[84,110]],{w:1.4});
  b.raw(b.st('M64 112q4 -3 8 0M88 112q4 -3 8 0',INK,1.8),'top');
  b.sh(E(80,121,5,4.4,10),'#F2B49A',{hatch:0,hl:0,lw:.8});
  b.sh([[64,130],[70,126],[80,128],[90,126],[96,130],[90,134],[80,132],[70,134]],'#FFFFFF',{k:.2,hatch:0,hl:0,lw:.8,base:'#fff'});
  b.raw(b.st('M74 138q6 4 12 0',INK,1.6),'top');
  let bw='';for(let i=0;i<20;i++){const a=Math.PI+i/19*Math.PI;bw+=b.jl(80+Math.cos(a)*30,86+Math.sin(a)*6,80+Math.cos(a)*74,86+Math.sin(a)*12,.5)}
  b.sh(E(80,86,76,13,32),'#F6DCA8',{hl:0,sh:'#C9A46A',inner:b.st(bw,'#C9A46A',.8,.6)});
  let st='';for(let i=0;i<14;i++){st+=b.jl(40+i*6,46,52+i*6,86,.4)+b.jl(124-i*6,46,112-i*6,86,.4)}
  b.sh([[46,86],[50,60],[60,46],[100,46],[110,60],[114,86]],'#F2D49A',{k:.12,inner:b.st(st,'#C9A46A',.8,.6)});
  b.sh([[48,75],[112,75],[113,85],[47,85]],'#7FB86A',{k:.05,hatch:0,hl:0});tinyFlower(b,100,80,5,'#F7B2C4');podV(b,62,80,.35,-.2);
};
DISH_NAMES.forEach(n=>BOWL_FOODS.push(n));
const _bowlFood=bowlFood;
bowlFood=function(b,food){
  if(!DISH_NAMES.includes(food))return _bowlFood(b,food);
  b.shadow(60,99,48,6);
  if(food==='Golden Harvest Stew'||food==='Chicken & Veggie Rice'){b.ln([[48,34],[45,28],[49,22],[46,15]],{w:1.4,col:GRAPH});b.ln([[70,32],[73,26],[69,20],[72,13]],{w:1.4,col:GRAPH})}
  if(food==='Mystery Mush'){b.tx(88,30,'?',24,{rot:12});b.ln([[40,38],[37,32],[41,26],[38,19]],{w:1.4,col:'#8FAF7A'})}
  bowl(b,60,62,45,12,32,C.pink,'#E58FA5',()=>{
   if(food==='Carrot Crunchies'){b.sh([[20,64],[30,54],[60,46],[90,54],[100,64],[60,70]],'#E58FA5',{noline:1,hatch:0,hl:0});
     [[30,62,9,.2],[46,60,9.5,1],[62,61,9.5,.4],[78,60,9,1.4],[92,63,8,.8],[38,51,9,1.7],[54,49,9.5,.6],[70,50,9,1.2],[85,53,8.5,.3],[48,41,8.5,1],[64,40,8.5,.5],[76,43,7.5,2]].forEach(([x,y,r,a])=>crunchie(b,x,y,r,a))}
   else if(food==='Chicken & Veggie Rice')riceVeg(b,60,66,84,28,1);
   else if(food==='Blueberry Pupsicle'){b.sh(E(60,64,34,7,20),'#D9D6F7',{noline:1,hatch:0,hl:0});embedItem(b,'Blueberry Pupsicle',26,0,64,-28)}
   else if(food==='Pumpkin Pupcake'){b.sh(E(60,64,34,7,20),'#F4B5C4',{noline:1,hatch:0,hl:0});embedItem(b,'Pumpkin Pupcake',28,6,64,0)}
   else if(food==='Golden Harvest Stew')stewTop(b,60,63,39,8.8,1);
   else if(food==='Spinach Scramble')scrambleTop(b,60,66,74,30,1);
   else if(food==='Mystery Mush')mushTop(b,60,63,39,8.8,1);
  });
  b.tx(60,90,'DOG',17,{mid:1});
  if(food==='Golden Harvest Stew')b.ex('spark',102,30,6,'#FFE07A');
};

/* ===================================== v1.3.1: pet beds + potty props ===================================== */
CFG.bed={W:2.6,amp:.6,step:4.2,drift:1.6,hatch:1,hg:3.2,hw:1,ew:1.6,tw:1};
CFG.bedi={W:5.4,amp:1,step:7,drift:3,hatch:0,hg:9,hw:2.6,ew:4,tw:2.2};
const sw=(b,w)=>R1(w*(b.cfg.tw||1));
const FRONT0=b=>b.raw('<g class="pa-bed-front">'),FRONT1=b=>b.raw('</g>');
// bilinear point in a quad tl,tr,br,bl
const quadPt=(Q,u,v)=>{const [a,c,d,e]=Q;const top=[a[0]+(c[0]-a[0])*u,a[1]+(c[1]-a[1])*u],bot=[e[0]+(d[0]-e[0])*u,e[1]+(d[1]-e[1])*u];return [top[0]+(bot[0]-top[0])*v,top[1]+(bot[1]-top[1])*v]};
function patches(Q,cols,rows,palette,seed){const r=rng(seed),m=[];for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
  m.push({pts:[quadPt(Q,i/cols,j/rows),quadPt(Q,(i+1)/cols,j/rows),quadPt(Q,(i+1)/cols,(j+1)/rows),quadPt(Q,i/cols,(j+1)/rows)],fill:palette[Math.floor(r()*palette.length)],k:0})}return m}
function gridLines(Q,cols,rows){let d='';for(let i=1;i<cols;i++){const a=quadPt(Q,i/cols,0),c=quadPt(Q,i/cols,1);d+=`M${R1(a[0])} ${R1(a[1])}L${R1(c[0])} ${R1(c[1])}`}
  for(let j=1;j<rows;j++){const a=quadPt(Q,0,j/rows),c=quadPt(Q,1,j/rows);d+=`M${R1(a[0])} ${R1(a[1])}L${R1(c[0])} ${R1(c[1])}`}return d}
const dash=(b,d,col,w,op)=>`<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw(b,w)}" stroke-dasharray="${sw(b,3)} ${sw(b,2.6)}" stroke-linecap="round"${op?` stroke-opacity="${op}"`:''}/>`;
const PATCH=['#F7B2C4','#BDE7D2','#FFE08A','#B9D4F3','#D3C6F1','#FFD0A8'];
const BEDS={
 'Old Blanket'(b){
  b.shadow(130,151,110,3.5);
  const Q=[[52,104],[212,102],[236,124],[28,125]];
  b.sh([[28,125],[52,104],[212,102],[236,124]],'#F4D9C0',{k:.06,marks:patches(Q,6,2,PATCH,7),inner:dash(b,gridLines(Q,6,2),'#FFFFFF',1.2,.9)});
  b.sh([[196,102],[212,102],[222,111],[200,113]],'#FFF2DA',{k:.05,hatch:0,hl:0,lw:.8});
  FRONT0(b);
  const F1=[[28,124],[236,123],[234,137],[30,138]],F2=[[30,137],[234,136],[232,150],[32,151]];
  b.sh(F2,'#E9C9A8',{k:.06,marks:patches(F2,8,1,PATCH,11),inner:dash(b,gridLines(F2,8,1),'#FFFFFF',1.1,.85)});
  b.sh(F1,'#F4D9C0',{k:.06,marks:patches(F1,6,1,PATCH,3),inner:dash(b,gridLines(F1,6,1),'#FFFFFF',1.1,.85)});
  b.ln([[30,137],[24,143],[32,150]],{w:1.4});
  FRONT1(b);
 },
 'Plaid Pillow'(b){
  b.shadow(130,151,112,3.5);
  const Q=[[50,80],[210,80],[238,110],[22,111]];let pl='';
  for(let i=1;i<8;i++){const a=quadPt(Q,i/8,0),c=quadPt(Q,i/8,1);pl+=`M${R1(a[0])} ${R1(a[1])}L${R1(c[0])} ${R1(c[1])}`}
  const bands=[.2,.5,.8].map(v=>({pts:[quadPt(Q,0,v-.06),quadPt(Q,1,v-.06),quadPt(Q,1,v+.06),quadPt(Q,0,v+.06)],fill:'#E98C88',k:0,op:.55}));
  const vb=[.12,.37,.62,.87].map(u=>({pts:[quadPt(Q,u-.03,0),quadPt(Q,u+.03,0),quadPt(Q,u+.03,1),quadPt(Q,u-.03,1)],fill:'#FFF2DA',k:0,op:.6}));
  b.sh([[22,111],[34,92],[50,80],[210,80],[226,92],[238,110],[230,120],[30,121]],'#F4A6A0',{k:.15,marks:bands.concat(vb),inner:b.st(pl,'#B5605C',sw(b,.8),.5)});
  let cz='';[[-1,-.4],[1,-.4],[-1,.6],[1,.6],[0,-1],[0,1]].forEach(([dx,dy])=>{cz+=b.jl(130+dx*8,97+dy*5,130+dx*34,97+dy*14,.5)});b.raw(b.st(cz,'#B5605C',sw(b,1.2),.7));
  b.sh(E(130,97,6,4.2,12),'#E98C88',{hatch:0,hl:0,lw:.8,dr:.2});b.dot(128.5,96.6,sw(b,.8),'#FFF2DA');b.dot(131.5,97.4,sw(b,.8),'#FFF2DA');
  FRONT0(b);
  const F=[[28,118],[232,118],[230,147],[32,148]];
  b.sh(F,'#E98C88',{k:.12,marks:[.15,.4,.65,.9].map(u=>({pts:[quadPt(F,u-.03,0),quadPt(F,u+.03,0),quadPt(F,u+.03,1),quadPt(F,u-.03,1)],fill:'#FFF2DA',k:0,op:.55})).concat([{pts:[quadPt(F,0,.4),quadPt(F,1,.4),quadPt(F,1,.6),quadPt(F,0,.6)],fill:'#C96E6A',k:0,op:.5}])});
  [[30,146],[230,146]].forEach(([x,y])=>{b.sh([[x-3,y-2],[x+3,y-2],[x+4,y+5],[x-4,y+5]],'#FFD56B',{k:.1,hatch:0,hl:0,lw:.6,dr:.2})});
  FRONT1(b);
 },
 'Fluffy Donut Bed'(b){
  b.shadow(130,151,112,3);
  const fluff=(n,cx,cy,rx,ry)=>{let d='';for(let i=0;i<n;i++){const a=b.r()*Math.PI*2,x=cx+Math.cos(a)*rx*(.5+b.r()*.45),y=cy+Math.sin(a)*ry*(.5+b.r()*.45);d+=`M${R1(x)} ${R1(y)}q${sw(b,2.4)} ${sw(b,-2.6)} ${sw(b,4.6)} 0`}return d};
  b.sh(cloudP(130,113,118,38,16,.1,96),'#F7B2C4',{hl:0,inner:b.st(fluff(26,130,113,118,38),'#FFFFFF',sw(b,1.4),.85)});
  b.sh(E(130,104,80,22,28),'#FFE3EC',{hl:0,sh:'#E58FA5',ho:.35,marks:[{pts:E(120,100,40,8,16),fill:'#FFF3F7',op:.9}]});
  FRONT0(b);
  const fr=[];for(let i=0;i<=40;i++){const a=i/40*Math.PI,f=1+.1*(Math.abs(Math.sin(a*8))-.6);fr.push([130+Math.cos(a)*118*f,113+Math.sin(a)*38*f])}
  for(let i=40;i>=0;i--){const a=i/40*Math.PI;fr.push([130+Math.cos(a)*80,104+Math.sin(a)*22])}
  b.sh(fr,'#F7B2C4',{k:.12,hl:0,inner:b.st(fluff(18,130,136,100,12),'#FFFFFF',sw(b,1.4),.85)});
  b.ex('heart',214,92,5);
  FRONT1(b);
 },
 'Banana Bed'(b){
  b.shadow(130,151,104,3);
  b.sh([[244,74],[250,66],[256,68],[252,76],[246,80]],'#8E8A4A',{k:.1,hatch:0,hl:0,lw:.8});
  b.sh([[46,112],[54,82],[92,64],[130,60],[168,64],[206,80],[214,110],[130,118]],'#FFE07A',{k:.15,marks:[{pts:[[58,104],[66,84],[98,72],[130,68],[162,72],[194,84],[202,104],[130,110]],fill:'#FFF1B4'}],
   det:[[[92,68],[96,100]],[[168,68],[164,100]]],dcol:'#D9B84A',dw:1.1});
  b.sh([[10,84],[16,78],[40,102],[130,116],[220,100],[244,72],[250,78],[242,108],[214,136],[130,152],[46,138],[18,112]],'#FFD95E',{k:.12,sh:'#C9A23A',
   marks:[{pts:[[4,70],[22,76],[24,92],[8,94]],fill:'#7A5A3A',k:.2}],inner:[[60,128],[90,140],[176,138],[206,124]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${sw(b,1.6)}" fill="#A07A3A" opacity=".6"/>`).join('')});
  b.sh([[40,108],[130,100],[220,104],[214,120],[130,130],[46,122]],'#FFF3C4',{k:.15,hl:0,hatch:0,base:'#FFFBEA',inner:[[80,112],[110,110],[150,110],[180,112],[130,118]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${sw(b,1.1)}" fill="#C9A86A" opacity=".55"/>`).join('')});
  FRONT0(b);
  b.sh([[42,118],[88,124],[130,127],[172,124],[218,116],[220,128],[198,144],[130,151],[62,144],[40,130]],'#FFE07A',{k:.15,sh:'#C9A23A',
   marks:[{pts:[[40,116],[130,125],[220,114],[220,120],[130,131],[40,122]],fill:'#FFF6CC',k:.15}],inner:[[70,134],[112,142],[150,140],[196,132],[94,138]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${sw(b,1.5)}" fill="#A07A3A" opacity=".6"/>`).join('')});
  b.sh(E(164,138,15,7.5,14,-.1),'#8EC5EE',{hatch:0,hl:0,lw:.8});b.tx(164,141,'Top Dog',sw(b,8),{mid:1,rot:-6,col:'#FFFFFF'});
  FRONT1(b);
 },
 'Hammock Cot'(b){
  b.shadow(130,151,112,3.5);
  b.ln([[40,86],[30,150]],{w:4.4,col:'#B88C66'});b.ln([[220,86],[230,150]],{w:4.4,col:'#B88C66'});
  b.sh([[18,78],[242,78],[242,87],[18,87]],C.wood,{k:0,hatch:0,hl:0,inner:b.st(b.jl(24,82,236,82,.4),C.woodD,sw(b,1),.8)});
  const can=[[24,84],[236,84],[234,114],[130,122],[26,114]],stripes=[];for(let i=0;i<14;i++)if(i%2===0)stripes.push({pts:[[16+i*16.5,80],[32.5+i*16.5,80],[32.5+i*16.5,126],[16+i*16.5,126]],fill:i%4?'#9ED0C8':'#F4A6A0',k:0});
  b.sh(can,'#FFF2DA',{k:.15,marks:stripes});
  FRONT0(b);
  [[20,60],[240,200]].forEach(([x0,x1])=>{b.ln([[x0+(x0<130?6:-6),120],[x0+(x0<130?30:-30),151]],{w:4.6,col:C.woodD});b.ln([[x0+(x0<130?30:-30),120],[x0+(x0<130?6:-6),151]],{w:4.6,col:'#B88C66'})});
  b.sh([[14,113],[246,113],[246,124],[14,124]],C.wood,{k:0,hl:0,inner:b.st(b.jl(20,118,240,118,.4),C.woodD,sw(b,1),.8)});
  [50,90,130,170,210].forEach(x=>b.sh([[x-5,110],[x+5,110],[x+5,126],[x-5,126]],'#F4A6A0',{k:0,hatch:0,hl:0,lw:.7,dr:.2}));
  b.sh(E(14,118.5,5,6.5,10),C.woodD,{hatch:0,hl:0,lw:.8});b.sh(E(246,118.5,5,6.5,10),C.woodD,{hatch:0,hl:0,lw:.8});
  FRONT1(b);
 },
 'Cloud Bed'(b){
  b.raw(`<ellipse cx="130" cy="151" rx="104" ry="3.5" fill="${SHADOW}" opacity=".85"/>`,'under');
  b.sh([[20,132],[18,110],[34,92],[58,86],[72,70],[100,62],[130,68],[158,58],[190,64],[210,82],[232,92],[243,114],[238,134]],'#F2F4FE',{k:1/6,base:'#FFFFFF',sh:'#AFB8E6',ho:.4});
  b.sh(E(134,106,84,16,24),'#E6E9FA',{hatch:0,hl:0,lw:.6,noline:1});
  const rb=[[34,108],[36,90],[50,78],[70,78],[84,90],[86,108]];
  b.sh(rb,'#F7B2C4',{k:.2,hatch:0,hl:0,marks:[['#FFD0A8',30],['#FFE08A',24],['#BDE7D2',18],['#B9D4F3',12],['#D3C6F1',6]].map(([c,r])=>({pts:E(60,110,r+2,r+2,20),fill:c}))});
  [[200,76,4],[176,60,3],[96,56,3.4]].forEach(([x,y,s])=>b.ex('spark',x,y,s*(b.cfg.tw>1?2.2:1),'#FFE59A'));
  FRONT0(b);
  b.sh([[22,124],[40,115],[64,120],[86,113],[110,119],[134,113],[158,119],[182,113],[206,119],[228,115],[243,126],[237,146],[210,152],[130,152],[50,152],[23,146]],'#FFFFFF',{k:1/6,base:'#FFFFFF',sh:'#AFB8E6',ho:.45});
  [[70,138],[140,140],[200,136]].forEach(([x,y])=>b.sh(starP(x,y,4,1.8),'#FFE59A',{k:.1,hatch:0,hl:0,lw:.5,dr:.1}));
  FRONT1(b);
 },
 'Royal Canopy Bed'(b){
  const VEL='#C2607F',VELD='#9E4A68',GOLD='#F2C760',GI='#9A6B1F';
  b.shadow(130,151,112,3.5);
  [36,224].forEach(x=>{b.sh(ribbon([[x,140],[x,28]],[6,6]),GOLD,{k:0,hatch:0,hl:0,lw:.9,ink:GI});b.sh(E(x,26,5,5,10),GOLD,{hatch:0,hl:0,lw:.8,ink:GI})});
  b.sh([[60,110],[62,78],[90,62],[130,56],[170,62],[198,78],[200,110]],'#F6DCA8',{k:.12,ink:GI,inner:[[90,80],[110,74],[130,72],[150,74],[170,80],[100,94],[120,90],[140,90],[160,94]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="${sw(b,1.5)}" fill="#C9A46A"/>`).join('')});
  b.sh(heartP(130,82,14),VEL,{hatch:0,hl:0,lw:.6});
  const curtain=s=>{const X=x=>130+s*(x-130);b.sh([[X(22),30],[X(64),30],[X(56),58],[X(46),84],[X(52),118],[X(32),128],[X(24),92]],VEL,{k:.18,hl:0,sh:VELD,det:[[[X(36),36],[X(36),82]],[[X(48),36],[X(42),82]],[[X(40),90],[X(38),122]]],dcol:VELD,dw:1});
    b.sh(RR(X(s>0?36:44)-(s>0?0:0),82,8,7,2).map(p=>p),GOLD,{hatch:0,hl:0,lw:.7,ink:GI,c:cr(RR(Math.min(X(36),X(48))-1,81,14,7,3),true,1/6)})};
  curtain(1);curtain(-1);
  const val=[[16,20],[244,20],[244,34]];for(let i=0;i<=8;i++){const x=244-i*28.5;val.push([x,34]);if(i<8)val.push([x-14.2,44])}val.push([16,20]);
  b.sh(val.slice(0,-1),VEL,{k:.1,hl:0,sh:VELD,marks:[{pts:[[10,28],[250,28],[250,33],[10,33]],fill:GOLD,k:0}]});
  for(let i=0;i<8;i++){const x=244-i*28.5-14.2;b.sh(E(x,46.5,2.4,3,8),GOLD,{hatch:0,hl:0,lw:.5,ink:GI,dr:.1})}
  b.sh([[112,21],[108,7],[118,13],[130,2],[142,13],[152,7],[148,21]],GOLD,{k:.04,hatch:0,hl:0,ink:GI});
  b.dot(118,17,sw(b,1.4),'#8EC5EE');b.dot(130,16,sw(b,1.7),C.pinkD);b.dot(142,17,sw(b,1.4),'#8EC5EE');
  b.sh([[40,113],[60,99],[200,99],[220,113],[214,124],[46,124]],VEL,{k:.15,sh:VELD,marks:[{pts:[[70,104],[150,102],[148,106],[72,108]],fill:'#E28DA8',op:.8}]});
  b.sh(RR(64,94,34,14,6),GOLD,{hatch:0,hl:0,lw:.8,ink:GI});b.sh(RR(162,94,34,14,6),'#F6DCA8',{hatch:0,hl:0,lw:.8,ink:GI});
  FRONT0(b);
  b.sh([[30,120],[230,120],[228,144],[32,145]],VELD,{k:.08,ink:'#5E2F40',marks:[{pts:[[20,120],[240,120],[240,125],[20,125]],fill:GOLD,k:0},{pts:[[20,140],[240,140],[240,145],[20,145]],fill:GOLD,k:0}]});
  b.sh([[122,124],[120,130],[124,128],[130,123],[136,128],[140,130],[138,124]].map(p=>[p[0],p[1]+3]),GOLD,{k:.04,hatch:0,hl:0,lw:.6,ink:GI});
  [[34,145],[130,145],[226,145]].forEach(([x,y])=>{b.ln([[x,y-3],[x,y+1]],{w:1.2,col:GI});b.sh([[x-3,y+1],[x+3,y+1],[x+4,y+6],[x-4,y+6]],GOLD,{k:.1,hatch:0,hl:0,lw:.5,ink:GI,dr:.1})});
  [44,216].forEach(x=>b.sh(E(x,148.5,6,3.5,10),GOLD,{hatch:0,hl:0,lw:.7,ink:GI}));
  FRONT1(b);
  b.ex('spark',250,60,4.5,'#FFE07A');b.ex('spark',10,70,3.6,'#FFE07A');
 }
};
const BED_CROP={'Old Blanket':[14,94,236,62],'Plaid Pillow':[12,74,240,82],'Fluffy Donut Bed':[8,70,244,88],'Banana Bed':[2,54,256,102],'Hammock Cot':[8,72,244,84],'Cloud Bed':[12,50,236,106],'Royal Canopy Bed':[6,0,248,156]};
function bedTpl(name,icon){const key=(icon?'bi:':'b:')+name;let t=CACHE[key];if(t===undefined){const b=mk(icon?'bedi':'bed',name);BEDS[name](b);t=CACHE[key]=b.svg('0 0 260 160',` data-bed="${esc(name)}"`,lab(name))}return t}
let BEDN=0;const BED_ICON_H={'Old Blanket':28,'Plaid Pillow':34,'Fluffy Donut Bed':36,'Banana Bed':40,'Hammock Cot':34,'Cloud Bed':42,'Royal Canopy Bed':56};
Object.keys(BEDS).forEach(name=>{ITEMS[name]=function(b){
  const [x,y,w,h]=BED_CROP[name],W=62,H=BED_ICON_H[name];
  const t=bedTpl(name,true).split(IDT).join(IDT+'n'+(BEDN++).toString(36)).replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
  b.raw(`<g transform="translate(${R1(32-W/2)} ${R1(35-H/2)}) scale(${R1(W/w*1000)/1000} ${R1(H/h*1000)/1000}) translate(${-x} ${-y})">${t}</g>`);b.ex('spark',name==='Royal Canopy Bed'?57:56,name==='Royal Canopy Bed'?52:12,3.4,'#FFE07A')}});
PA.bed=function(name){if(!BEDS[name])return serve('b?:'+name,()=>fallback('house',name,'0 0 260 160'));
  const t=bedTpl(name,false);const u='pwb'+(++UID).toString(36);return t.split(IDT).join(u)};
// potty props -----------------------------------------------------------
PROPS.poop=function(b,o){
  if(o.fresh){b.ln([[22,15],[20,11],[23,7],[21,2.5]],{w:1.1,col:GRAPH,op:.8});b.ln([[37,14],[39,10],[36,6],[38,2]],{w:1.1,col:GRAPH,op:.8})}
  else{[[12,22],[30,10],[48,22]].forEach(([x,y])=>b.ln([[x,y],[x-2.5,y-4],[x+1,y-8],[x-1.5,y-12]].map(p=>[p[0],Math.max(1.5,p[1])]),{w:1.4,col:'#9FBF7E'}))}
  b.shadow(30,47.5,22,2);
  b.sh(E(30,40,20,7,18),'#B88A64',{hatch:0,hl:0,lw:.9,sh:'#8E6446'});
  b.sh(E(30,32,15,6.4,16),'#C49770',{hatch:0,hl:0,lw:.9});
  b.sh(E(30,24.5,10,5.4,14),'#CFA37C',{hatch:0,hl:0,lw:.9});
  b.sh([[27,21],[30,14.5],[34,13],[33,17],[35,21]],'#CFA37C',{k:.3,hatch:0,hl:0,lw:.8,dr:.2});
  b.ex('glint',22,38,4);b.ex('glint',25,30,3);
  if(o.fresh)b.ex('spark',50,30,3.4,'#FFF2C2');
};
PROPS.pee=function(b){
  b.sh(flatBlob(50,17,45,9.5,31),'#FBEBA0',{lw:.75,base:'#FDF5CC',hatch:0,hlo:.6});
  b.loop(E(44,17,12,2.6,14),{w:.8,col:'#FFFFFF'});b.ln([[18,14],[30,12.6]],{w:1.1,col:'#FFFFFF'});b.ln([[66,20],[76,19]],{w:1,col:'#FFFFFF'});
  b.ex('spark',90,7,3,'#FFF6D0');
};
PROPS.flies=function(b){
  [[18,22,0],[44,14,1]].forEach(([x,y,i])=>{
   b.raw(`<path d="M${x-14} ${y+10}c-6 -10 8 -16 10 -6s-10 10 -4 -4" fill="none" stroke="${GRAPH}" stroke-width="1" stroke-dasharray="1.6 2.4" stroke-linecap="round" transform="rotate(${i*150} ${x} ${y})"/>`,'top');
   b.sh(E(x-2.4,y-3.6,3.2,2.2,8,-.5),'#FFFFFF',{hatch:0,hl:0,lw:.5,base:'#fff',top:1});b.sh(E(x+2.4,y-3.6,3.2,2.2,8,.5),'#FFFFFF',{hatch:0,hl:0,lw:.5,base:'#fff',top:1});
   b.raw(`<ellipse cx="${x}" cy="${y}" rx="3" ry="2.3" fill="${INK}"/><circle cx="${x+1.2}" cy="${y-.6}" r=".6" fill="#fff"/>`,'top')});
};
Object.assign(ICONS,{
 'poop-bag'(b){
  b.sh([[20,22],[16,10],[25,14],[32,9],[39,14],[48,10],[44,22]],'#8FD08A',{k:.12,hatch:0,hl:0});
  b.sh([[20,22],[44,22],[52,34],[54,50],[47,58],[17,58],[10,50],[12,34]],'#A8DCA0',{k:.15,sh:'#6FA868'});
  b.ln([[19,23],[32,25],[45,23]],{w:2.4,col:'#5E9A58'});
  paw(b,32,42,6,'#FFFFFF',{noline:1});
 },
 'water-spray'(b){
  [[50,18],[56,14],[58,22],[62,17],[55,26]].forEach(([x,y],i)=>b.sh(drop(x,y,i%2?2.6:3.2),'#8EC5EE',{hatch:0,hl:0,lw:.6,dr:.1}));
  b.raw(`<path d="M42 19L60 10M42 20L62 20M42 21L59 29" fill="none" stroke="#8EC5EE" stroke-width="1.6" stroke-dasharray="2 3" stroke-linecap="round"/>`);
  b.sh([[14,16],[30,14],[42,17],[42,23],[32,24],[32,30],[18,30]],'#7CC3B8',{k:.08,hatch:0,hl:0});
  b.ln([[22,30],[20,38],[24,40]],{w:2.6});
  b.sh(RR(12,30,24,30,6),'#D9EEF8',{base:'#F2F9FD',marks:[{pts:[[0,42],[64,42],[64,64],[0,64]],fill:'#9FD3F0',k:0}]});
  b.ex('glint',17,42,5);
 }
});

/* ===================================== v1.6: trick signals, town obstacles, café + places ===================================== */
const SKIN='#FFD9B8',SKIN_D='#E9B48E';
const HANDS={
 open:{body:[[20,56],[17,49],[12,42],[7.5,35.5],[8.5,31],[13,30.5],[18.5,35.5],[21.5,37.5],[20.5,27],[19.5,16],[20.5,12],[23.5,10.5],[26.5,12.5],[27.6,23],[28.4,12.5],[29.5,8.4],[32.5,7],[35.5,8.6],[36.4,12.5],[36.6,23],[37.4,14],[38.6,10.6],[41.6,9.8],[44.2,11.8],[44.6,16],[44,27],[45.4,21],[47.4,19],[50.2,19.6],[51.4,22.6],[50.6,31],[48.6,42],[45,50],[41,56]].map(p=>[p[0]-30,p[1]-34]),
  det:[[[27.6,23],[27.9,29]],[[36.6,23],[36.6,29.5]],[[44,27],[43.6,32]]].map(l=>l.map(p=>[p[0]-30,p[1]-34])),cuff:[[-11,21],[12,21],[12,28],[-11,28]]},
 point:{finger:RR(-10,-36,8.4,32,4.2),body:[[-13,-8],[-2,-9.5],[4,-10],[10,-8],[14,-2],[14,12],[9,20],[-8,21],[-14,12],[-15,0]],
  det:[[[1,-4],[13,-3]],[[1,4],[13,5]],[[1,12],[11,13]],[[-13,3],[-5,1],[2,5]]],cuff:[[-12,19],[11,19],[11,27],[-12,27]]},
 beak:{back:[[-28,-11],[-17,-13],[-15,15],[-27,17]],top:[[-20,-12],[-5,-17],[14,-15],[24,-9],[24,-3.5],[6,-4],[-18,-1]],thumb:[[-18,6],[0,5.5],[15,7.5],[16.5,12],[0,14.5],[-18,14]],
  det:[[[-2,-12],[18,-10]],[[-4,-8],[16,-6.5]]],cuff:[[-34,-11],[-26,-12],[-25,17],[-33,17]]}
};
function handDraw(b,type,cx,cy,s,a,o={}){
  const fx=o.flip?-1:1,T=pts=>rot(pts.map(p=>[cx+fx*p[0]*s,cy+p[1]*s]),a||0,cx,cy),lw=o.lw||1,H=HANDS[type==='gun'?'point':type];
  const cuffC=o.cuff||'#B9D4F3';
  if(type==='open'){b.sh(T(H.cuff),cuffC,{k:0,hatch:0,hl:0,lw:lw*.85});b.sh(T(H.body),SKIN,{k:.13,lw,hl:0,sh:SKIN_D,det:H.det.map(T),dw:1.1*lw*s})}
  if(type==='point'||type==='gun'){b.sh(T(H.cuff),cuffC,{k:0,hatch:0,hl:0,lw:lw*.85});b.sh(T(H.finger),SKIN,{lw,hatch:0,hl:0});
    if(type==='gun')b.sh(T(RR(-31,-10,19,8.4,4.2)),SKIN,{lw,hatch:0,hl:0});
    b.sh(T(H.body),SKIN,{k:.2,lw,hl:0,sh:SKIN_D,det:H.det.map(T),dw:1*lw*s})}
  if(type==='beak'){b.sh(T(H.cuff),cuffC,{k:0,hatch:0,hl:0,lw:lw*.85});b.sh(T(H.back),SKIN,{k:.2,lw,hatch:0,hl:0});b.sh(T(H.thumb),SKIN,{k:.2,lw,hatch:0,hl:0});b.sh(T(H.top),SKIN,{k:.2,lw,hl:0,sh:SKIN_D,det:H.det.map(T),dw:1*lw*s})}
}
const TRICKS=['sit','paw','down','rollover','spin','playdead','speak','dance','bow','signature'];
// one composition per trick in 64-space; S scales it (1 for the icon, 1.875 for the 120 prop)
function sigDraw(b,trick,S){
  const P=pts=>pts.map(p=>[p[0]*S,p[1]*S]),W=w=>w*(S>1?S*.62:1),L=(pts,w,col,k)=>b.ln(P(pts),{w:W(w),col:col||INK,k}),hs=.78*S;
  const arrowHead=(x,y,a,col)=>L([[x+Math.cos(a+2.5)*6,y+Math.sin(a+2.5)*6],[x,y],[x+Math.cos(a-2.5)*6,y+Math.sin(a-2.5)*6]],2.8,col,0);
  if(trick==='sit'){handDraw(b,'open',30*S,44*S,hs,Math.PI/2);L([[34,30],[34,8]],3,C.pinkD);arrowHead(34,7,-Math.PI/2,C.pinkD)}
  else if(trick==='down'){handDraw(b,'open',30*S,30*S,hs,Math.PI/2);L([[34,44],[34,60]],3,C.pinkD);arrowHead(34,61,Math.PI/2,C.pinkD);L([[12,46],[12,54]],1.6,GRAPH);L([[56,46],[56,54]],1.6,GRAPH)}
  else if(trick==='paw'){handDraw(b,'open',28*S,36*S,hs,.28);paw(b,48*S,18*S,4.6*S,'#F7B2C4',{lw:.7,a:.3})}
  else if(trick==='rollover'){handDraw(b,'point',26*S,38*S,hs*.9,Math.PI/2);const c=[];for(let i=0;i<=14;i++){const a=-.6+i/14*Math.PI*1.7;c.push([50+Math.cos(a)*9,34+Math.sin(a)*9])}L(c,2.6,C.pinkD);const e=c[c.length-1];arrowHead(e[0],e[1],-.6+Math.PI*1.7+Math.PI/2,C.pinkD)}
  else if(trick==='spin'){handDraw(b,'point',32*S,44*S,hs*.9,0);const c=[];for(let i=0;i<=16;i++){const a=Math.PI*.15+i/16*Math.PI*1.75;c.push([27+Math.cos(a)*16,11+Math.sin(a)*5])}L(c,2.6,C.pinkD);const e=c[c.length-1];arrowHead(e[0],e[1],Math.PI*.15+Math.PI*1.75+Math.PI/2,C.pinkD)}
  else if(trick==='playdead'){handDraw(b,'gun',24*S,38*S,hs*.9,Math.PI/2);b.sh(P(starP(53,22,9,4.6,8)),'#FFE07A',{k:.06,hatch:0,hl:0,lw:.8});b.tx(R1(53*S),R1(25*S),'BANG',R1(5.4*S),{mid:1})}
  else if(trick==='speak'){handDraw(b,'beak',30*S,34*S,hs*.95,0);L([[52,20],[56,26],[52,32]],2.2,C.pinkD);L([[56,14],[62,26],[56,38]],2.2,C.pinkD)}
  else if(trick==='dance'){handDraw(b,'open',30*S,36*S,hs,-.35);L([[8,22],[4,28],[8,34],[4,40]],2,C.pinkD);L([[54,26],[58,32],[54,38],[58,44]],2,C.pinkD);b.ex('note',52*S,14*S,9*S)}
  else if(trick==='bow'){handDraw(b,'open',34*S,40*S,hs,Math.PI/2+.6);const c=[];for(let i=0;i<=12;i++){const a=Math.PI*1.05+i/12*Math.PI*.6;c.push([34+Math.cos(a)*24,34+Math.sin(a)*24])}L(c.map(p=>[p[0],p[1]-6]),2.6,C.pinkD);const e=c[c.length-1];arrowHead(e[0],e[1]-6,Math.PI*1.65+Math.PI/2,C.pinkD);b.ex('heart',54*S,52*S,3.6*S)}
  else {b.sh(P(starP(34,32,28,13)),'#FFF1B8',{k:.06,hatch:0,hl:0,lw:.6});handDraw(b,'open',32*S,38*S,hs*.9,.2);b.ex('spark',10*S,12*S,5*S,'#FFE07A');b.ex('spark',56*S,10*S,4*S,'#FFE07A');b.ex('spark',56*S,52*S,3.6*S,'#FFE07A')}
}
TRICKS.forEach(t=>{ICONS['sig-'+t]=b=>sigDraw(b,t,1)});
PROPS['hand-signal']=function(b,o){sigDraw(b,o.trick,120/64)};
PROPS['treat-bit']=function(b){b.sh(boneP(10,10,17,7,-.45),'#E6B47C',{lw:.42,hatch:0,hlo:.5,dr:.3});b.dot(8.4,10.6,.6,'#9C6236');b.dot(11.6,9.2,.6,'#9C6236')};
Object.assign(ICONS,{
 clicker(b){
  b.ln([[42,14],[48,7],[55,9],[54,16],[48,18]],{w:2.2,col:'#9C9CA8'});
  b.sh([[18,20],[44,14],[52,24],[50,46],[34,58],[16,52],[10,36]],'#F9A35E',{k:.25});
  b.sh(E(31,36,10,9,14),'#DCDDE3',{hatch:0,hl:0,marks:[{pts:E(28,33,5,3,10),fill:'#FFFFFF'}]});
  b.ln([[54,34],[61,32]],{w:2,col:C.pinkD});b.ln([[53,42],[60,44]],{w:2,col:C.pinkD});b.ln([[50,50],[55,55]],{w:2,col:C.pinkD});
 },
 focus(b){b.sh(E(32,32,27,27,24),'#F7B2C4',{hl:0});b.sh(E(32,32,19,19,20),'#FFFFFF',{hatch:0,hl:0,lw:.8,base:'#fff'});b.sh(E(32,32,11,11,16),'#F7B2C4',{hatch:0,hl:0,lw:.8});paw(b,32,33.5,3.6,'#FFFFFF',{noline:1})},
 lure(b){handDraw(b,'point',30,44,.72,.12);b.sh(boneP(26,9,17,7,-.35),'#E6B47C',{hatch:0,hl:0,lw:.8});
  b.ln([[42,10],[47,6],[51,10],[56,6]],{w:1.8,col:'#9FBF7E'});b.ln([[42,18],[47,14],[51,18],[56,14]],{w:1.8,col:'#9FBF7E'})},
 vet(b){b.sh([[10,30],[32,10],[54,30],[54,57],[10,57]],C.mint,{k:0});b.sh([[4,32],[32,6],[60,32],[55,36],[32,15],[9,36]],'#9ED0C8',{k:0,hl:0});
  b.sh([[27,30],[37,30],[37,37],[44,37],[44,47],[37,47],[37,54],[27,54],[27,47],[20,47],[20,37],[27,37]],'#FFFFFF',{k:0,hatch:0,hl:0,base:'#fff',lw:.9});paw(b,32,43,3,'#F28FA5',{noline:1})},
 salon(b){
  b.ln([[6,20],[0,18]],{w:2,col:'#9FD3F0'});b.ln([[6,28],[0,30]],{w:2,col:'#9FD3F0'});b.ln([[7,24],[1,24]],{w:2,col:'#9FD3F0'});
  b.sh(RR(30,32,11,26,4),'#E98AA2',{hatch:0,hl:0});
  b.sh([[10,16],[34,12],[50,14],[58,24],[50,34],[34,36],[10,32]],'#F7B2C4',{k:.2});b.sh(E(10,24,4,8,10),'#DCDDE3',{hatch:0,hl:0,lw:.8});
  b.ex('spark',52,48,4,'#FFE07A');
 },
 cafe(b){[[24,16],[34,14]].forEach(([x,y])=>b.ln([[x,y],[x-2.5,y-4],[x+1,y-8],[x-1.5,y-12]],{w:2.2,col:GRAPH}));
  b.ln([[46,28],[55,29],[56,39],[47,44]],{w:4.4});b.ln([[46,28],[55,29],[56,39],[47,44]],{w:2,col:'#FFF2DA'});
  b.sh([[10,22],[48,22],[46,50],[38,56],[20,56],[12,50]],'#FFF2DA',{k:.1,marks:[{pts:[[0,26],[64,26],[64,30],[0,30]],fill:'#F7B2C4',k:0}]});
  b.sh(cloudP(29,20,18,6,7,.3,28),'#FFFFFF',{hatch:0,hl:0,lw:.8,base:'#fff'});paw(b,29,42,4.2,'#C9A27A',{noline:1});
  b.sh(E(29,58,24,4,16),'#E9D7BE',{hatch:0,hl:0,lw:.8})},
 square(b){
  b.sh(E(32,52,27,8,20),'#B9D4F3',{hl:0,marks:[{pts:E(32,50,20,4.4,16),fill:'#DDEFFB'}]});
  b.sh(RR(28,26,8,26,3),'#DCD6CC',{hatch:0,hl:0});b.sh(E(32,26,13,4.6,14),'#DCD6CC',{hatch:0,hl:0});
  b.raw(b.st('M32 22Q22 6 14 22M32 22Q42 6 50 22M32 22V8','#7FC7EE',2.6),'top');
  [[14,26],[50,26],[32,6]].forEach(([x,y])=>b.sh(drop(x,y,2.6),'#A9D6F5',{hatch:0,hl:0,lw:.5,dr:.1}))},
 dogpark(b){
  b.ln([[18,40],[18,26]],{w:3,col:'#8E6446'});b.sh(cloudP(18,20,12,10,7,.25,28),C.leaf,{hl:0});
  [8,20,32,44,56].forEach(x=>b.sh([[x-3,58],[x-3,40],[x,36],[x+3,40],[x+3,58]],'#EBD7B8',{k:0,hatch:0,hl:0,lw:.8}));
  b.ln([[4,44],[60,44]],{w:2,col:'#C9A97E'});b.ln([[4,52],[60,52]],{w:2,col:'#C9A97E'});
  b.sh(E(46,22,8,8,12),'#DDEB7E',{hatch:0,hl:0,det:[[[40,17],[44,22],[40,27]]],dw:1})},
 hilltop(b){b.sh([[2,58],[14,40],[28,30],[40,34],[50,24],[62,40],[62,58]],C.green,{k:.15,hl:0,marks:[{pts:[[2,58],[20,48],[40,52],[62,46],[62,60],[2,60]],fill:LEAF}]});
  b.ln([[50,24],[50,6]],{w:2.2});b.sh([[50,6],[62,10],[50,15]],C.pinkD,{k:.06,hatch:0,hl:0,lw:.8});b.ex('spark',14,14,4,'#FFE07A')},
 pier(b){
  [10,24,40,54].forEach(x=>b.sh([[x-2.5,34],[x+2.5,34],[x+2.5,54],[x-2.5,54]],'#B88C66',{k:0,hatch:0,hl:0,lw:.8}));
  b.sh([[2,28],[62,28],[62,36],[2,36]],C.wood,{k:0,hl:0,inner:b.st(b.jl(16,28,16,36,.2)+b.jl(32,28,32,36,.2)+b.jl(48,28,48,36,.2),C.woodD,1.2,.8)});
  b.raw(b.st('M2 48q5 -4 10 0t10 0t10 0t10 0t10 0t10 0M6 56q5 -4 10 0t10 0t10 0t10 0t10 0','#7FC7EE',2.4),'top');
  b.ln([[16,14],[22,10],[28,14]],{w:2});b.ln([[34,18],[40,14],[46,18]],{w:2})},
 notice(b){b.sh(rot(RR(12,10,40,46,3),.08,32,33),'#FFFBF3',{k:0,base:'#FFFBF3',inner:b.st(b.jl(18,24,44,25,.3)+b.jl(18,32,44,33,.3)+b.jl(18,40,36,41,.3),GRAPH,1.8,.9)});
  b.sh(E(33,11,4.6,4.6,10),C.pinkD,{hatch:0,hl:0,lw:.8});b.ln([[33,15],[33,19]],{w:1.4});b.ex('heart',44,48,3.4)},
 stethoscope(b){
  b.ln([[18,8],[16,22],[22,34],[32,38],[42,34],[48,22],[46,8]],{w:3.2,col:'#7CC3B8'});b.ln([[32,38],[32,46],[38,54],[46,54]],{w:3.2,col:'#7CC3B8'});
  b.sh(E(18,8,3,2.4,8),'#5E6470',{hatch:0,hl:0,lw:.7});b.sh(E(46,8,3,2.4,8),'#5E6470',{hatch:0,hl:0,lw:.7});
  b.sh(E(50,52,9,9,14),'#DCDDE3',{hatch:0,hl:0,marks:[{pts:E(50,52,5,5,10),fill:'#F4F6FA'}]})},
 scissors(b){
  b.sh([[30,30],[56,8],[59,11],[36,36]],'#DCDDE3',{k:.05,hatch:0,hl:0});b.sh([[30,34],[56,56],[59,53],[36,28]],'#DCDDE3',{k:.05,hatch:0,hl:0});
  b.sh(E(18,22,10,8,14,.4),'#F28FA5',{hatch:0,hl:0});b.sh(E(18,22,5.4,3.6,10,.4),'#FFFBF3',{hatch:0,hl:0,lw:.7,base:'#FFFBF3'});
  b.sh(E(18,44,10,8,14,-.4),'#F28FA5',{hatch:0,hl:0});b.sh(E(18,44,5.4,3.6,10,-.4),'#FFFBF3',{hatch:0,hl:0,lw:.7,base:'#FFFBF3'});
  b.dot(33,32,1.8,'#5E6470')}
});
// café items ---------------------------------------------------------------
function whip(b,cx,cy,w,s){b.sh([[cx-w*.5,cy],[cx-w*.46,cy-6*s],[cx-w*.3,cy-10*s],[cx-w*.2,cy-16*s],[cx,cy-19*s],[cx+w*.16,cy-15*s],[cx+w*.32,cy-11*s],[cx+w*.46,cy-6*s],[cx+w*.5,cy]],'#FFFFFF',{k:.2,hl:0,base:'#fff',sh:'#C9D3E3',ho:.35,det:[[[cx-w*.38,cy-5*s],[cx,cy-2*s],[cx+w*.38,cy-5*s]],[[cx-w*.22,cy-11*s],[cx+w*.2,cy-10*s]]],dcol:'#C9D3E3',dw:.9*s+.2});
  b.sh([[cx+1*s,cy-19*s],[cx+3*s,cy-24*s],[cx+5*s,cy-19*s]],'#FFFFFF',{k:.2,hatch:0,hl:0,lw:.7,base:'#fff'})}
function donutTop(b,cx,cy,rx,ry,s){
  b.sh(E(cx,cy+3*s,rx,ry,24),'#D9A06A',{hl:0,lw:lwS(s)});
  const ice=[];for(let i=0;i<28;i++){const a=i/28*Math.PI*2,dr=(Math.sin(a)>0&&i%4===1)?1.16:.94;ice.push([cx+Math.cos(a)*rx*dr*.96,cy+Math.sin(a)*ry*(Math.sin(a)>0?dr:.92)])}
  b.sh(ice,'#FFE6EE',{k:.15,hl:0,lw:lwS(s)*.8,base:'#FFF4F8',sh:'#E9A7BC',ho:.35});
  b.sh(E(cx,cy-.5*s,rx*.32,ry*.34,14),'#C98A55',{hatch:0,hl:0,lw:lwS(s)*.8});
  const cols=['#EF7B86','#7F8FD6','#B26BB8','#F7A1B5'];let k=0;
  for(let i=0;i<14;i++){const a=i/14*Math.PI*2+.3,r=.62+(i%3)*.08,x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;b.raw(b.st(b.jl(x,y,x+2.6*s*Math.cos(a+1.4),y+2.6*s*Math.sin(a+1.4),.1),cols[k++%4],2*s+.2),'top')}
  b.ex('glint',cx-rx*.55,cy-ry*.2,4*s);
}
Object.assign(ITEMS,{
 'Pupuccino'(b){
  b.sh(E(32,56,26,5.5,18),'#E9D7BE',{hatch:0,hl:0});
  b.ln([[46,34],[54,35],[54,44],[46,47]],{w:3.6});b.ln([[46,34],[54,35],[54,44],[46,47]],{w:1.8,col:'#FFF2DA'});
  b.sh([[14,30],[48,30],[46,50],[40,55],[22,55],[16,50]],'#FFF2DA',{k:.1,marks:[{pts:[[0,35],[64,35],[64,39],[0,39]],fill:'#F7B2C4',k:0}]});
  paw(b,31,46,3.6,'#C9A27A',{noline:1});
  whip(b,31,31,36,1);b.sh(boneP(42,14,14,5.4,-.9),'#E6B47C',{hatch:0,hl:0,lw:.6});
  b.ex('spark',8,14,3.6);b.ex('heart',56,20,3);
 },
 'Doggy Donut'(b){donutTop(b,32,34,26,15,1);b.ex('spark',56,10,3.6);b.ex('heart',8,56,3)}
});
['Pupuccino','Doggy Donut'].forEach(n=>BOWL_FOODS.push(n));
const _bowlFood2=bowlFood;
bowlFood=function(b,food){
  if(food!=='Pupuccino'&&food!=='Doggy Donut')return _bowlFood2(b,food);
  b.shadow(60,99,48,6);
  bowl(b,60,62,45,12,32,C.pink,'#E58FA5',()=>{
   if(food==='Pupuccino'){whip(b,60,68,76,1.9);b.sh(boneP(76,34,22,8,-1),'#E6B47C',{hatch:0,hl:0,lw:.8})}
   else{b.sh(E(60,64,34,7,20),'#F4B5C4',{noline:1,hatch:0,hl:0});embedItem(b,'Doggy Donut',26,14,68,-8)}
  });
  b.tx(60,90,'DOG',17,{mid:1});b.ex('spark',102,30,5,'#FFE07A');
};
PROPS.bulletin=function(b){
  b.shadow(80,138.5,64,2);
  b.ln([[30,96],[28,138]],{w:4.6,col:C.woodD});b.ln([[130,96],[132,138]],{w:4.6,col:C.woodD});
  b.sh(RR(10,8,140,94,6),C.wood,{hl:0,hatch:0});
  b.sh(RR(18,24,124,72,3),'#D9A877',{hl:0,inner:[[30,40],[60,86],[120,34],[100,90],[134,64],[40,70]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.1" fill="#9C6E4C" opacity=".5"/>`).join('')});
  b.sh(RR(30,2,100,16,4),'#FFF2DA',{hatch:0,hl:0,lw:.9});b.tx(80,14,'TOWN NOTICE',12,{mid:1});
  b.sh(rot(RR(24,30,30,26,2),-.12,39,43),'#B9D4F3',{k:0,hatch:0,hl:0,lw:.7,inner:b.st('M28 40h20M28 46h16',INK,1,.5)});
  b.sh(rot(RR(108,30,28,32,2),.1,122,46),'#FFE3EC',{k:0,hatch:0,hl:0,lw:.7});paw(b,122,44,4,'#F28FA5',{noline:1});b.tx(122,58,'LOST BALL',5.6,{mid:1,rot:6});
  b.sh(rot(RR(26,64,30,26,2),.08,41,77),'#FFF6CC',{k:0,hatch:0,hl:0,lw:.7,inner:b.st('M31 72h20M31 78h14M31 84h18',INK,1,.5)});
  b.sh(rot(RR(110,66,26,24,2),-.1,123,78),'#FFFFFF',{k:0,hatch:0,hl:0,lw:.7});b.sh(E(123,78,6,5,10),'#F6BE80',{hatch:0,hl:0,lw:.5});
  b.sh(RR(58,34,46,56,2),'#FFFBF3',{k:0,hatch:0,hl:0,lw:.8,base:'#FFFBF3'});
  [[39,31],[122,31],[41,65],[123,67],[81,35]].forEach(([x,y],i)=>b.sh(E(x,y,2.6,2.6,8),[C.pinkD,'#7FC7EE','#FFD56B','#9CCB86','#E46F6B'][i],{hatch:0,hl:0,lw:.5,dr:.1}));
};
// v1.6 obstacles ----------------------------------------------------------
Object.assign(OBS_VB,{cat:'0 0 70 50',trashcan:'0 0 60 70',hydrant:'0 0 50 60',bicycle:'0 0 200 80',awning:'0 0 240 80',molehill:'0 0 80 36',crate:'0 0 80 70',ropecoil:'0 0 80 40',seagull:'0 0 90 50',fishingline:'0 0 220 70'});
Object.assign(OBS,{
 cat(b){
  b.shadow(36,48.6,28,1.4);
  b.ln([[56,40],[64,30],[62,18],[66,12]],{w:5.5});b.ln([[56,40],[64,30],[62,18],[66,12]],{w:3.4,col:'#F4B26E'});
  b.sh([[12,48.5],[14,36],[26,28],[48,28],[60,36],[62,48.5]],'#F4B26E',{k:.25,lw:1.05,sh:'#C98A4A',marks:[{pts:[[30,26],[34,26],[32,40],[28,40]],fill:'#E09450'},{pts:[[42,26],[46,26],[45,40],[41,40]],fill:'#E09450'}]});
  b.sh([[8,20],[10,8],[16,14],[24,14],[30,7],[31,20]],'#F4B26E',{k:.1,hatch:0,hl:0,lw:1});
  b.sh(E(19.5,24,12,10.5,16),'#F4B26E',{hl:0,lw:1.05,marks:[{pts:E(19,29,6,4,10),fill:'#FFF2DA'}]});
  b.raw(b.st('M12 22h5M22 22h5M19 27.5l-1.6 1.6M19 27.5l1.6 1.6M5 26h6M5 29h6M28 26h6M28 29h6',INK,1.2),'top');
  b.sh(E(19,26.6,1.6,1.1,8),C.pinkD,{hatch:0,hl:0,lw:.4,base:C.pinkD});
 },
 trashcan(b){
  b.sh([[30,4],[36,4],[36,8],[30,8]],'#AEB2BC',{k:0,hatch:0,hl:0,lw:.8});
  b.sh([[18,16],[22,8],[26,4]],'#FFE07A',{k:.2,hatch:0,hl:0,lw:.7});
  b.sh([[9,14],[51,14],[48,68.5],[12,68.5]],'#C3C8D2',{k:.04,lw:1.05,sh:'#8E94A2',inner:b.st([18,26,34,42].map(x=>b.jl(x+(x-30)*.02,18,x,66,.3)).join(''),'#8E94A2',1.6,.7)});
  b.sh(RR(5,8,50,9,4),'#AEB2BC',{hatch:0,hl:0,lw:1});
  b.sh(rot([[38,20],[46,20],[46,24],[38,24]],.3,42,22),'#FFFFFF',{k:0,hatch:0,hl:0,lw:.5,top:1});
 },
 hydrant(b){
  b.sh(RR(10,52,30,7.5,2),'#D9534F',{hatch:0,hl:0,lw:1});
  b.sh(RR(4,26,8,9,2),'#E46F6B',{hatch:0,hl:0,lw:.8});b.sh(RR(38,26,8,9,2),'#E46F6B',{hatch:0,hl:0,lw:.8});
  b.sh([[13,52],[13,22],[37,22],[37,52]],'#F08A86',{k:.04,lw:1.05,sh:'#C04A46'});
  b.sh([[11,22],[13,12],[25,7],[37,12],[39,22]],'#E46F6B',{k:.2,hatch:0,lw:1});b.sh(RR(22,3,6,5,1.5),'#D9534F',{hatch:0,hl:0,lw:.7});
  b.sh(E(25,30,4.4,4.4,10),'#FFE07A',{hatch:0,hl:0,lw:.7});b.ex('glint',17,40,5);
 },
 bicycle(b){
  b.shadow(100,78.8,90,1.4);
  const wheel=(x)=>{let sp='';for(let i=0;i<8;i++){const a=i/8*Math.PI;sp+=`M${R1(x+Math.cos(a)*25)} ${R1(51+Math.sin(a)*25)}L${R1(x-Math.cos(a)*25)} ${R1(51-Math.sin(a)*25)}`}
    b.raw(b.st(sp,'#9C9CA8',.9));b.loop(E(x,51,27,27,28),{w:4.4,col:'#5E6470'});b.loop(E(x,51,22,22,24),{w:1.2,col:'#AEB2BC'});b.dot(x,51,2.4,'#5E6470')};
  wheel(40);wheel(160);
  const fr=C.mint;[[[40,51],[86,51],[118,22]],[[86,51],[72,20]],[[40,51],[72,20],[124,22]],[[124,22],[160,51]]].forEach(l=>{b.ln(l,{w:4.6,k:0});b.ln(l,{w:2.6,col:'#7CC3B8',k:0})});
  b.ln([[72,20],[70,12]],{w:2.4});b.sh([[60,8],[80,8],[78,13],[62,13]],'#9C6E4C',{k:.2,hatch:0,hl:0,lw:.8});
  b.ln([[124,22],[122,10],[134,8]],{w:2.6});
  b.sh([[128,16],[156,16],[154,32],[130,32]],'#E2B07E',{k:.05,hatch:0,hl:0,lw:.9,inner:b.st(b.jl(128,24,156,24,.2)+b.jl(140,16,140,32,.2),'#9C6E4C',1,.7)});
  tinyFlower(b,134,13,4,'#F7B2C4');tinyFlower(b,146,12,4.4,'#FFE07A');b.sh(leafP(140,15,7,3.6,-1),LEAF,{hatch:0,hl:0,lw:.5});
 },
 awning(b){
  b.sh([[4,0],[236,0],[236,6],[4,6]],'#B88C66',{k:0,hatch:0,hl:0,lw:.9});
  const scal=[];for(let i=0;i<=12;i++){const x=232-i*19;scal.push([x,62]);if(i<12)scal.push([x-9.5,78.6])}
  const top=[[8,4],[232,4]],stripes=[];for(let i=0;i<12;i++)if(i%2===0)stripes.push({pts:[[8+i*18.7,0],[26.7+i*18.7,0],[26.7+i*18.7,80],[8+i*18.7,80]],fill:'#FFF2DA',k:0});
  b.sh([[8,4],[232,4],[232,62]].concat(scal.slice(1)).concat([[8,62]]),'#F4A6A0',{k:.06,lw:1.05,marks:stripes,sh:'#C96E6A'});
  b.ln([[12,4],[8,40]],{w:1.8,col:'#9C9CA8'});b.ln([[228,4],[232,40]],{w:1.8,col:'#9C9CA8'});
 },
 molehill(b){
  b.sh([[3,35.5],[10,24],[24,16],[40,13],[56,16],[70,24],[77,35.5]],SOIL,{k:.2,lw:1.05,inner:[[20,28],[34,24],[52,26],[62,30],[42,32]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.2" fill="${INK}" opacity=".35"/>`).join('')});
  b.sh(E(40,16,9,7.6,14),'#8E7A8E',{hatch:0,hl:0,lw:.9});b.sh(E(40,19.5,3,2.2,8),'#F7A1B5',{hatch:0,hl:0,lw:.6});
  b.raw(b.st('M35 14.5h3M42 14.5h3',INK,1.3),'top');
  [[31,22],[49,22]].forEach(([x,y])=>b.sh(E(x,y,3.4,2.4,8),'#F7C8D0',{hatch:0,hl:0,lw:.6}));
  b.sh(E(8,33,3,2,8),SOIL,{hatch:0,hl:0,lw:.6});b.sh(E(72,32,2.6,1.8,8),SOIL,{hatch:0,hl:0,lw:.6});
 },
 crate(b){
  b.sh([[6,10],[74,10],[74,69],[6,69]],C.wood,{k:0,lw:1.1,sh:C.woodD,inner:b.st(b.jl(6,30,74,30,.3)+b.jl(6,50,74,50,.3),C.woodD,1.2,.8)});
  b.sh([[6,10],[14,10],[74,62],[74,69],[66,69],[6,17]],'#D9A06A',{k:0,hatch:0,hl:0,lw:.8});
  [[6,10,12],[62,10,12]].forEach(([x,y,w])=>{});
  b.sh(RR(4,8,72,6,2),'#C58F5E',{hatch:0,hl:0,lw:.8});b.sh(RR(4,64,72,6,2),'#C58F5E',{hatch:0,hl:0,lw:.8});
  b.tx(54,32,'FISH',12,{mid:1,col:'#5E6FA8',op:.85,rot:-4});
  [[10,11],[70,11],[10,67],[70,67]].forEach(([x,y])=>b.dot(x,y,.9));
 },
 ropecoil(b){
  b.shadow(40,38.8,34,1.2);
  [[40,30,32,8.5],[40,24,26,7],[40,18.5,19,5.5],[40,14,11,3.6]].forEach(([x,y,rx,ry],i)=>b.sh(E(x,y,rx,ry,24),i%2?'#E6CFA4':'#DDBF8E',{hatch:i?0:1,hl:0,lw:.95,
   inner:b.st(Array.from({length:14},(_,k)=>{const a=k/14*Math.PI*2;return b.jl(x+Math.cos(a)*rx*.8,y+Math.sin(a)*ry*.6,x+Math.cos(a+.2)*rx*.98,y+Math.sin(a+.2)*ry*.98,.2)}).join(''),'#9C7A50',.9,.7)}));
  b.ln([[70,32],[76,36],[78,30]],{w:3.4,col:'#DDBF8E'});
 },
 seagull(b){
  b.ln([[4,28],[12,29]],{w:1.2,col:GRAPH});b.ln([[2,35],[10,35]],{w:1.2,col:GRAPH});
  b.ln([[40,41],[38,48.6]],{w:1.3,col:'#F2A33C'});b.ln([[47,41],[47,48.6]],{w:1.3,col:'#F2A33C'});
  b.sh([[36,26],[24,8],[32,4],[46,20]],'#AEB6C4',{k:.2,hatch:0,hl:0,lw:.9,marks:[{pts:[[20,2],[30,2],[30,8],[22,10]],fill:'#5E6470'}]});
  b.sh([[26,32],[12,26],[14,36],[27,38]],'#FFFFFF',{k:.1,hatch:0,hl:0,lw:.9,base:'#fff',marks:[{pts:[[8,24],[16,24],[16,40],[8,40]],fill:'#5E6470',k:0}]});
  b.sh(E(44,33,19,10.5,20,-.06),'#FFFFFF',{lw:1.05,base:'#fff',sh:'#AFB8C8'});
  b.sh(E(63,25,9.5,8.8,14),'#FFFFFF',{hatch:0,hl:0,lw:1.05,base:'#fff'});
  b.sh([[71,23],[84,26],[80,28.5],[71,28.5]],'#FFD04D',{k:.08,hatch:0,hl:0,lw:.7});b.dot(80,27,.8,'#E46F6B');b.dot(65.5,22.6,1.5);
  b.sh([[36,30],[42,10],[54,0.8],[60,4],[52,26]],'#C9CFD8',{k:.2,hatch:0,hl:0,lw:.9,marks:[{pts:[[48,0],[62,0],[62,7],[50,7]],fill:'#5E6470',k:0}]});
 },
 fishingline(b){
  b.sh(ribbon([[217,4],[206,8],[196,11]],[4.4,3.4,2.4]),'#9C6E4C',{k:1/6,hatch:0,hl:0,lw:.9});
  b.sh(E(212,7,3.4,3.4,8),'#AEB2BC',{hatch:0,hl:0,lw:.6});
  b.raw(`<path d="M196 10Q184 66 140 66.4L0 66.4" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`);
  b.sh([[70,60],[76,60],[77,66],[76,68.4],[70,68.4],[69,66]],'#FFFFFF',{k:.2,hatch:0,hl:0,lw:.8,base:'#fff'});b.sh([[69.4,60],[76.6,60],[76,56],[70,56]],'#E46F6B',{k:.2,hatch:0,hl:0,lw:.8});
  b.ln([[73,56],[73,52]],{w:1.2});
  b.raw(b.st('M50 69c3 -2 6 -2 9 0M88 69c3 -2 6 -2 9 0','#7FC7EE',1.2),'top');
  b.ex('spark',110,50,4);
 }
});

/* ===================================== v2: family / mailbox / nursery art ===================================== */
/* Props added for V2 (viewBoxes per V2.md). Coordinates for game overlays (all in viewBox units):
   nursery 320x170     <ellipse data-spot="inner" cx160 cy92 rx112 ry26>  free floor; data-spot="mum" point (126,100) = mum's feet line, data-spot="pups" point (214,100);
                       the basket's front wall + quilt flap are inside <g class="pa-bed-front"> (same convention as beds: re-layer it above the dogs)
   mailbox 120x160     o.flag raises the flag, o.count draws a badge (top-left, centre 18,30); data-mail-slot point (60,58)
   postcard 300x200    <rect data-photo x16 y36 w170 h130> clear photo window; stamp at (226..284, 18..76)
   playboard 300x220   <rect data-card="0..3"> photo frames (0,1 top row, 2,3 bottom row), each rotated about +-2 deg (the rect carries the same transform):
                       0: 20,50,112x46  1: 168,52,112x46  2: 20,128,112x46  3: 168,128,112x46  (heading banner y 6..40)
   familytree 600x380  <circle data-node="0..6" cx cy r=40> node centres: 0 (90,62) 1 (230,62) 2 (370,62) 3 (510,62) grandparents (0,1 -> parent 4; 2,3 -> parent 5),
                       4 (160,172) 5 (440,172) parents, 6 (300,288) the dog. Children: <circle data-leaf="0..5" r=13> at (62,292) (112,306) (170,296) (430,296) (488,306) (538,292) (raised in v2.1 so the child cards clear the bottom edge).
   coatframe 120x140   o.found (default true). Window for a mini dogHead: <rect data-window x20 y16 w80 h80>; label strip x20..100, y108..126
   ultrasound 240x160  <rect data-screen x34 y16 w172 h92> the dark screen (fan outline only, no pups drawn) */
function tapeB(b,x,y,w,a,col){const h=7;
  b.raw(`<g transform="rotate(${a} ${x} ${y})"><path d="M${x-w/2} ${y-h}l3 2.4-3 2.4 3 2.4-3 2.4 3 2.4L${x+w/2} ${y+h}l-3-2.4 3-2.4-3-2.4 3-2.4-3-2.4Z" fill="${col}" fill-opacity=".82"/><path d="M${x-w/2+4} ${y-3}H${x+w/2-4}M${x-w/2+4} ${y+3}H${x+w/2-4}" stroke="#fff" stroke-opacity=".6" stroke-width="1.8" stroke-dasharray="5 4"/></g>`,'top')}
const WK='#E2BC84',WKD='#C08E52',WKL='#F3DDB0';
const pushpin=(b,x,y,col)=>{b.sh(E(x,y,3.4,3.4,9),col,{hatch:0,hl:0,lw:.6,dr:.15,top:1});b.raw(`<ellipse cx="${R1(x-1)}" cy="${R1(y-1)}" rx="1" ry=".8" fill="#fff" opacity=".8"/>`,'top')};
const ptsD=pts=>'M'+pts.map(p=>R1(p[0])+' '+R1(p[1])).join('L');

PROPS.nursery=function(b){
  const OX=160,OY=84,ORX=148,ORY=46,IX=160,IY=90,IRX=128,IRY=34;
  b.shadow(160,160,152,6);
  // back wall of the basket (outer rim) with wicker weave
  let wv='';for(let x=22;x<=298;x+=9){const t=(x-OX)/ORX,yt=OY-ORY*Math.sqrt(Math.max(0,1-t*t));wv+=b.jl(x,yt+2,x,yt+24,.5)}
  [.9,.8].forEach(f=>{wv+=`M${R1(OX-ORX*f)} ${OY}A${R1(ORX*f)} ${R1(ORY*f)} 0 0 1 ${R1(OX+ORX*f)} ${OY}`});
  b.sh(E(OX,OY,ORX,ORY,44),WK,{hatch:0,hl:0,lw:1.15,base:WKL,inner:b.st(wv,WKD,1.1,.6)});
  // braided rope on the rim: slanted ticks along the upper arc
  let tk='';for(let a=185;a<=355;a+=7){const r=a*Math.PI/180,x=OX+Math.cos(r)*ORX*.965,y=OY+Math.sin(r)*ORY*.965;tk+=`M${R1(x-2.2)} ${R1(y+2.4)}l4.4 -4.8`}
  b.raw(b.st(tk,WKD,1.1,.75));
  // inside of the basket
  b.sh(E(IX,IY,IRX,IRY,40),'#D8AE74',{hatch:0,hl:0,lw:.9,base:'#E8CA9A'});
  // padded quilt on the floor, patchwork + stitching
  let pt='';const cs=['#FAC8D6','#FFE3A8','#CFE9F5','#E6D8F5','#CDEBD9'];
  for(let i=0;i<10;i++)for(let j=0;j<4;j++){pt+=`<rect x="${48+i*26}" y="${70+j*20}" width="26" height="20" fill="${cs[(i*2+j*3)%5]}" fill-opacity="${(i+j)%2?.85:.55}"/>`}
  let st='';for(let i=0;i<=10;i++)st+=`M${48+i*26} 70V150`;for(let j=0;j<=4;j++)st+=`M48 ${70+j*20}H308`;
  const qin=`<g transform="translate(160 97) scale(1 .27) translate(-160 -110)">${pt}<path d="${st}" stroke="#C48A95" stroke-width="2.6" stroke-dasharray="6 5" fill="none" stroke-opacity=".8"/></g>`;
  b.sh(E(160,98,112,27,36),'#FAC8D6',{hatch:0,hl:0,lw:.85,base:'#FFF0F3',inner:qin,dr:.6});
  // tiny pillow at the back right
  b.sh(rot(RR(236,64,46,22,9),-.12,259,75),'#FFFBF3',{hatch:0,hl:0,lw:.85,base:'#FFFFFF',det:[[[243,72],[272,70]],[[244,80],[274,78]]],dcol:'#C48A95',dw:.7});
  b.sh(heartP(259,75,10),'#F7B2C4',{hatch:0,hl:0,lw:.6});
  // little toy bone and a ball tucked at the back left
  b.sh(boneP(66,76,26,9,.1),'#FFE9CF',{hatch:0,hl:0,lw:.7});
  b.sh(E(98,80,6,5,12),'#B9D4F3',{hatch:0,hl:0,lw:.7});
  // spots for the game (invisible)
  b.raw(`<g fill="none" stroke="none" pointer-events="none"><ellipse data-spot="inner" cx="160" cy="92" rx="112" ry="26"/><circle data-spot="mum" cx="126" cy="100" r="2"/><circle data-spot="pups" cx="214" cy="100" r="2"/></g>`,'top');
  // ---- front group: low wicker front wall (dips on the left = the open side) and the quilt flap
  FRONT0(b);
  const dip=x=>20*Math.exp(-Math.pow((x-82)/30,2));
  const yTop=x=>{const t=Math.max(-1,Math.min(1,(x-OX)/ORX));return OY+ORY*Math.sqrt(1-t*t)+dip(x)};
  const yBot=x=>{const u=Math.max(-1,Math.min(1,(x-160)/122));return 134+24*Math.sqrt(1-u*u)};
  const topE=[],lowE=[];
  for(let a=0;a<=180;a+=6){const r=a*Math.PI/180,x=OX-Math.cos(r)*ORX;topE.push([x,OY+Math.sin(r)*ORY+((a>0&&a<180)?dip(x):0)])}
  for(let a=0;a<=180;a+=12){const r=a*Math.PI/180;lowE.push([160+Math.cos(r)*122,134+Math.sin(r)*24])}
  let fw='';
  for(let x=24;x<=298;x+=11)fw+=b.jl(x,yTop(x)+3,x+(x<160?4:-4),yBot(x),.5);
  for(let k=1;k<=3;k++){const pp=[];for(let x=14;x<=306;x+=14){const yt=yTop(x),yb=yBot(x);pp.push([x,yt+(yb-yt)*k/4+(((x/14)|0)%2?1.4:-1.4)])}fw+=ptsD(pp)}
  b.sh(topE.concat(lowE),WK,{k:.05,hatch:1,hl:0,lw:1.2,base:WKL,sh:WKD,inner:b.st(fw,WKD,1.1,.7)});
  // rope along the top edge of the front wall
  b.ln(topE,{w:5,col:WKD,k:.1});
  let tk2='';for(let i=1;i<topE.length-1;i++){const p=topE[i];tk2+=`M${R1(p[0]-2)} ${R1(p[1]+2.4)}l4 -4.8`}
  b.raw(b.st(tk2,'#F6E4BE',1.2,.9));
  // quilt flap hanging over the low side
  b.sh([[50,117],[84,121],[112,119],[116,137],[104,150],[84,145],[68,151],[54,141]],'#FAC8D6',{k:.16,hatch:0,hl:0,lw:1,base:'#FFF0F3',
    inner:`<path d="M52 126H116M52 136H112M70 118V150M92 118V150" stroke="#C48A95" stroke-width="1.5" stroke-dasharray="4 4" fill="none" opacity=".8"/><rect x="70" y="126" width="22" height="10" fill="#FFE3A8" opacity=".8"/><rect x="92" y="136" width="22" height="14" fill="#CFE9F5" opacity=".8"/><rect x="48" y="136" width="22" height="14" fill="#E6D8F5" opacity=".8"/>`});
  // pink bow on the front
  b.sh([[232,120],[216,112],[214,128]],C.pinkD,{k:.1,hatch:0,hl:0,lw:.8});b.sh([[232,120],[248,112],[250,128]],C.pinkD,{k:.1,hatch:0,hl:0,lw:.8});
  b.ln([[232,122],[225,138]],{w:2,col:C.pinkD});b.ln([[232,122],[240,138]],{w:2,col:C.pinkD});
  b.sh(E(232,120,4.4,4,10),'#F7B2C4',{hatch:0,hl:0,lw:.8});
  FRONT1(b);
  b.ex('heart',292,22,5,'#F7B2C4');b.ex('spark',22,40,5);b.ex('spark',300,120,3.4,'#FFE07A');
  b.tx(268,40,'z',16,{rot:-8,col:'#8E9BB8'});b.tx(280,26,'Z',20,{rot:-6,col:'#8E9BB8'});
};

PROPS.mailbox=function(b,o){
  const flag=!!o.flag,cnt=Math.max(0,Math.min(99,o.count|0));
  b.shadow(60,153,34,3);
  // post with grain, a little brace
  b.sh(RR(52,84,15,66,3),'#E2B07E',{hl:0,sh:WKD,det:[[[58,92],[57,146]],[[63,96],[62,140]]],dw:.7});
  b.sh([[67,100],[82,86],[67,86]],'#D9A877',{k:0,hatch:0,hl:0,lw:.9});
  b.sh(E(59,151,34,6,18),'#B8DE9A',{hatch:0,hl:0,lw:.8,dr:.4});
  tuft(b,38,152,3);tuft(b,82,152,3.2);tinyFlower(b,28,150,3,'#F7B2C4');tinyFlower(b,92,152,3,'#FFE07A');
  // the box, side view: arched top, door end on the right
  b.sh([[8,88],[8,56],[16,40],[34,32],[78,32],[96,40],[104,56],[104,88]],C.blue,{k:.13,sh:'#7FA3D8',lw:1.1,base:'#EAF3FC'});
  b.sh(RR(6,84,100,8,3),'#9FBFE6',{hatch:0,hl:0,lw:.9});
  // door end
  b.sh(E(104,62,9,26,16),'#FFD0A8',{hatch:0,hl:0,lw:1,base:'#FFE9D6'});
  b.sh(E(104,62,5,20,12),'#F7B2C4',{hatch:0,hl:0,lw:.6,dr:.2});
  b.dot(105,66,2,INK);
  // body details: paw decal, rivets, label, number plate
  paw(b,52,60,6,'#FFF2DA',{lw:.7});
  b.tx(48,79,'MAIL',11,{mid:1,col:'#4C6A9A'});
  [[14,50],[14,76],[94,50]].forEach(([x,y])=>b.dot(x,y,1.5,'#7FA3D8'));
  b.ln([[18,38],[34,34]],{w:1.4,col:'#fff',op:.9});
  b.sh(RR(66,52,16,12,3),'#FFFBF3',{hatch:0,hl:0,lw:.7,base:'#fff'});b.tx(74,62,'1',11,{mid:1});
  // the flag, pivoting on the door side
  if(flag){
    b.sh(RR(83,16,5,44,2),'#D9534F',{hatch:0,hl:0,lw:.8,top:1});
    b.sh(RR(88,4,26,15,2),C.redD,{k:0,hatch:0,hl:0,lw:.9,base:C.redD,top:1});
    b.sh(E(85.5,60,4.4,4.4,10),'#FFD56B',{hatch:0,hl:0,lw:.7,top:1});
    b.raw(b.st('M96 24l5 -2M80 22l-5 -3',INK,1.3),'top');
    b.ex('heart',24,12,3.4,'#F7B2C4');
  }else{
    b.sh(RR(83,58,5,26,2),'#D9534F',{hatch:0,hl:0,lw:.8,top:1});
    b.sh(RR(68,76,19,10,2),C.redD,{k:0,hatch:0,hl:0,lw:.9,base:C.redD,top:1});
    b.sh(E(85.5,60,4.2,4.2,10),'#FFD56B',{hatch:0,hl:0,lw:.7,top:1});
  }
  if(cnt>0){
    b.sh(E(18,30,12,12,16),C.pinkD,{hatch:0,hl:0,lw:1,base:C.pinkD,top:1,dr:.3});
    b.tx(18,cnt>9?34.5:35.5,String(cnt),cnt>9?15:18,{col:'#fff',rot:-4});
  }
  b.raw(`<circle data-mail-slot cx="60" cy="58" r="1" fill="none" pointer-events="none"/>`,'top');
  if(!flag)b.ex('spark',112,30,3.4);
};

PROPS.postcard=function(b){
  const card=[[10,14],[290,10],[292,188],[8,190]];
  b.raw(`<path d="M14 20L296 16L297 195L12 197Z" fill="${SHADOW}" opacity=".8"/>`,'under');
  b.sh(card,'#FFF2DA',{k:0,hatch:0,hl:0,lw:1.1,base:'#FFFBF3',dr:.5,inner:`<path d="M210 100h72M210 114h72M210 128h72M210 142h56" stroke="${GRAPH}" stroke-width="1.2" stroke-linecap="round" opacity=".8" fill="none"/><path d="M200 24V176" stroke="${GRAPH}" stroke-width="1.1" stroke-dasharray="3 4" opacity=".6" fill="none"/>`});
  // photo window: white mat around a clear 170x130 area
  b.sh(RR(10,30,182,142,3),'#FFFFFF',{k:0,hatch:0,hl:0,lw:.9,base:'#fff',dr:.2});
  b.sh(RR(15,35,172,132,2),'#FDF3DE',{k:0,hatch:0,hl:0,lw:.8,base:'#FDF3DE',dr:0});
  b.raw(`<rect data-photo x="16" y="36" width="170" height="130" fill="none" stroke="none" pointer-events="none"/>`,'top');
  // stamp with perforated edge
  let d='M226 18';const px=(x0,y0,x1,y1)=>{const n=Math.round(Math.hypot(x1-x0,y1-y0)/6);for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,xm=x0+(x1-x0)*(t0+t1)/2,ym=y0+(y1-y0)*(t0+t1)/2,nx=-(y1-y0),ny=(x1-x0),l=Math.hypot(nx,ny);d+=`L${R1(x0+(x1-x0)*t0)} ${R1(y0+(y1-y0)*t0)}Q${R1(xm+nx/l*2.2)} ${R1(ym+ny/l*2.2)} ${R1(x0+(x1-x0)*t1)} ${R1(y0+(y1-y0)*t1)}`}};
  px(226,18,284,18);px(284,18,284,76);px(284,76,226,76);px(226,76,226,18);
  b.raw(`<path d="${d}Z" fill="#CDEBD9" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`);
  b.sh(RR(232,24,46,46,2),'#FFF2DA',{k:0,hatch:0,hl:0,lw:.8,base:'#FFF9EC'});
  paw(b,255,51,7,'#F28FA5',{lw:.6});b.ex('heart',270,32,3.6);
  b.tx(255,66,'POST',8,{mid:1,col:'#8A6A5C'});
  // postmark: wavy cancel lines + a ring
  b.raw(`<path d="M196 56q6 -5 12 0t12 0t12 0t12 0t12 0M198 63q6 -5 12 0t12 0t12 0t12 0t12 0M200 70q6 -5 12 0t12 0t12 0t12 0" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" opacity=".6"/><circle cx="210" cy="50" r="17" fill="none" stroke="${INK}" stroke-width="1.5" stroke-dasharray="3 2" opacity=".65"/><circle cx="210" cy="50" r="12" fill="none" stroke="${INK}" stroke-width="1" opacity=".5"/><path d="M200 50h20" stroke="${INK}" stroke-width="1" opacity=".5"/>`,'top');
  b.tx(210,48,'WOOF',6.5,{mid:1,op:.7,col:'#6E4F43'});b.tx(210,58,'TOWN',6.5,{mid:1,op:.7,col:'#6E4F43'});
  // hand-written bits
  b.tx(244,95,'Dear you,',13,{rot:-3,col:'#8A6A5C'});
  b.tx(244,163,'xoxo',18,{rot:-4,col:C.pinkD});
  tapeB(b,36,16,64,-28,'#F7B9C6');tapeB(b,274,184,60,-26,'#BDE7D2');
  b.ex('spark',196,186,4,'#FFE59A');
};

PROPS.playboard=function(b){
  b.shadow(150,217,120,3);
  // two short posts
  b.sh(RR(40,190,16,26,2),'#C58F5E',{hatch:0,hl:0,lw:1,under:1});b.sh(RR(244,190,16,26,2),'#C58F5E',{hatch:0,hl:0,lw:1,under:1});
  // wooden frame + cork
  b.sh(RR(4,4,292,192,7),C.wood,{hatch:0,hl:0,lw:1.2,base:'#F3DDB4'});
  let sp='';for(let i=0;i<46;i++){const x=14+b.r()*272,y=14+b.r()*172;sp+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(.7+b.r()*1.1)}" fill="#9C6E4C" opacity="${R1(.28+b.r()*.3)}"/>`}
  b.sh(RR(14,14,272,172,3),'#DDB07F',{hatch:1,hl:0,lw:.9,base:'#EACB9F',inner:sp});
  // heading banner
  b.sh(rot(RR(62,6,176,34,5),-.02,150,23),'#FFFBF3',{k:0,hatch:0,hl:0,lw:1,base:'#fff'});
  b.tx(150,32,'Playdates!',28,{rot:-2,col:'#B8536F'});
  b.ex('heart',68,22,4.2);b.ex('heart',236,18,4.2,'#FFE59A');
  tapeB(b,64,10,50,-24,'#F7B9C6');tapeB(b,240,10,50,24,'#BDE7D2');
  // four empty photo cards, pinned
  const cards=[[20,50,-.03,'#B9D4F3'],[168,52,.025,'#FFE08A'],[20,128,.02,'#D3C6F1'],[168,128,-.025,'#BDE7D2']];
  cards.forEach(([x,y,a,col],i)=>{
    const cx=x+56,cy=y+37;
    b.sh(rot(RR(x-6,y-4,124,76,2),a,cx,cy),'#FFFFFF',{k:0,hatch:0,hl:0,lw:.9,base:'#fff',dr:.5});
    b.sh(rot(RR(x,y,112,46,1),a,cx,cy),'#FDF3DE',{k:0,hatch:0,hl:0,lw:.7,base:'#FDF3DE',dr:0});
    b.raw(`<rect data-card="${i}" x="${x}" y="${y}" width="112" height="46" transform="rotate(${R1(a*180/Math.PI)} ${cx} ${cy})" fill="none" stroke="none" pointer-events="none"/>`,'top');
    b.raw(b.st(`M${x+4} ${y+60}h${44+i*6}`,GRAPH,1.1,.8),'top');
    pushpin(b,x+50,y-2,['#E46F6B','#7FC7EE','#FFD56B','#9CCDA0'][i]);
    paw(b,x+104,y+62,3.4,col,{noline:1});
  });
  b.ex('spark',292,100,4);b.ex('spark',10,124,3.4,'#FFE59A');
};

PROPS.familytree=function(b){
  const GD='#7FB86A',N=[[90,62],[230,62],[370,62],[510,62],[160,172],[440,172],[300,288]];
  b.raw(`<ellipse cx="300" cy="366" rx="270" ry="10" fill="${SHADOW}" opacity=".85"/>`,'under');
  for(let i=0;i<10;i++){tuft(b,24+i*58+((i*13)%17),372-(i%3)*2,3.4)}
  tinyFlower(b,38,368,4,'#F7B2C4');tinyFlower(b,572,368,4,'#FFE07A');tinyFlower(b,206,372,3.4,'#D3C6F1');tinyFlower(b,396,372,3.4,'#F7B2C4');
  // trunk + roots
  b.sh(ribbon([[300,376],[298,336],[300,300]],[44,32,22]),'#C99A72',{k:.1,hl:0,sh:'#8E6446',det:[[[290,372],[292,330]],[[306,370],[304,326]],[[298,352],[299,310]]],dw:.8});
  b.ln([[274,372],[258,364],[246,366]],{w:5,col:'#B98258'});b.ln([[326,372],[342,364],[356,366]],{w:5,col:'#B98258'});
  // branches (dog -> parents -> grandparents), then low branches for the children
  const br=(pts,w0,w1)=>b.sh(ribbon(pts,pts.map((_,i)=>w0+(w1-w0)*i/(pts.length-1))),'#C99A72',{k:.18,hatch:0,hl:0,lw:.9});
  br([[300,300],[262,262],[196,214],[160,172]],18,8);
  br([[300,300],[338,262],[404,214],[440,172]],18,8);
  br([[160,172],[138,130],[104,96],[90,62]],10,5);br([[160,172],[176,128],[212,96],[230,62]],10,5);
  br([[440,172],[424,128],[388,96],[370,62]],10,5);br([[440,172],[462,130],[498,96],[510,62]],10,5);
  br([[298,310],[264,304],[210,302],[170,296]],10,4);br([[298,314],[246,318],[160,320],[112,306]],8,3);br([[296,320],[190,326],[100,306],[62,292]],7,3);
  br([[302,310],[338,304],[392,302],[430,296]],10,4);br([[302,314],[354,318],[440,320],[488,306]],8,3);br([[304,320],[410,326],[500,306],[538,292]],7,3);
  // node clusters: pale leafy blobs, clear in the middle so the game can drop a dog head + name there
  const cols=[['#E4F3D4','#BFE2A4'],['#DDF0C8','#A9D68E'],['#FDEAEF','#F7B2C4']];
  N.forEach(([x,y],i)=>{
    const g=i===6?2:i>=4?1:0,[base,fill]=cols[g],rx=i===6?62:56,ry=i===6?44:38;
    b.sh(cloudP(x,y,rx,ry,9,.14,54),fill,{hatch:1,hl:0,lw:1.1,base,sh:g===2?'#D9788F':GD,dr:.8,ho:.5});
    b.raw(`<ellipse cx="${x}" cy="${y}" rx="${rx-14}" ry="${ry-12}" fill="#FFFBF3" fill-opacity=".78"/>`);
    b.loop(E(x,y,rx-14,ry-12,22),{w:1.1,col:GD,op:.55});
    let lf='';for(let a=0;a<12;a++){const t=a/12*Math.PI*2+i,px=x+Math.cos(t)*(rx-6),py=y+Math.sin(t)*(ry-5);lf+=`M${R1(px)} ${R1(py)}q${R1(Math.cos(t)*7)} ${R1(Math.sin(t)*7-3)} ${R1(Math.cos(t)*12)} ${R1(Math.sin(t)*10)}`}
    b.raw(b.st(lf,g===2?'#D9788F':GD,1.4,.75));
    b.raw(`<circle data-node="${i}" cx="${x}" cy="${y}" r="40" fill="none" stroke="none" pointer-events="none"/>`,'top');
  });
  // small leaves for the children (empty sprigs the game may fill with mini heads)
  [[62,292],[112,306],[170,296],[430,296],[488,306],[538,292]].forEach(([x,y],i)=>{
    b.sh(leafP(x-2,y+6,24,16,-.9+(i%2)*.4),i<3?'#B8DE9A':'#C8E8A8',{hatch:0,hl:0,lw:.9,det:[[[x-2,y+6],[x+17,y-6]]],dw:.6});
    b.sh(leafP(x+2,y+6,20,13,-2.2-(i%2)*.4),'#9CCB86',{hatch:0,hl:0,lw:.9});
    b.raw(`<circle data-leaf="${i}" cx="${x}" cy="${y}" r="13" fill="none" stroke="none" pointer-events="none"/>`,'top');
  });
  b.sh(boneP(376,336,26,9,.5),'#FFE9CF',{hatch:0,hl:0,lw:.8});
  b.ex('heart',300,226,5,'#F7B2C4');b.ex('spark',20,20,6);b.ex('spark',580,22,5,'#FFE07A');b.ex('spark',570,200,3.6);b.ex('heart',32,232,4,'#F7B2C4');
  tapeB(b,26,10,70,-28,'#F7B9C6');tapeB(b,574,10,70,26,'#BDE7D2');
};

PROPS.coatframe=function(b,o){
  const found=o.found!==false;
  const X0=8,Y0=6,X1=112,Y1=134;let d=`M${X0} ${Y0}`;
  const side=(x0,y0,x1,y1)=>{const n=Math.round(Math.hypot(x1-x0,y1-y0)/8);for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n,tm=(t0+t1)/2,nx=-(y1-y0),ny=(x1-x0),l=Math.hypot(nx,ny);
    d+=`L${R1(x0+(x1-x0)*t0)} ${R1(y0+(y1-y0)*t0)}Q${R1(x0+(x1-x0)*tm+nx/l*3)} ${R1(y0+(y1-y0)*tm+ny/l*3)} ${R1(x0+(x1-x0)*t1)} ${R1(y0+(y1-y0)*t1)}`}};
  side(X0,Y0,X1,Y0);side(X1,Y0,X1,Y1);side(X1,Y1,X0,Y1);side(X0,Y1,X0,Y0);d+='Z';
  b.raw(`<path d="${d}" fill="${SHADOW}" opacity=".8" transform="translate(2.5 3)"/>`,'under');
  if(found){
    b.raw(`<path d="${d}" fill="#FFFBF3" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>`);
    b.sh(RR(16,13,88,92,3),'#FDE9C9',{k:0,hatch:0,hl:0,lw:1,base:'#FFF6E4',dr:.6});
    b.sh(RR(20,17,80,84,2),'#FFF9EC',{k:0,hatch:0,hl:0,lw:.7,base:'#FFF9EC',dr:0});
    b.raw(`<rect data-window x="20" y="16" width="80" height="80" fill="none" stroke="none" pointer-events="none"/>`,'top');
    b.sh(RR(20,108,80,18,2),'#FFFFFF',{k:0,hatch:0,hl:0,lw:.7,base:'#fff',dr:.3});
    b.raw(b.st('M27 118h46',GRAPH,1.2,.9),'top');paw(b,88,117,3.4,C.pinkD,{noline:1});
    b.ex('spark',104,18,4.4);
    tapeB(b,22,8,32,-30,'#F7B9C6');
  }else{
    b.raw(`<path d="${d}" fill="#F5EFE6" stroke="${INK}" stroke-width="1.5" stroke-linejoin="round" stroke-dasharray="5 3.5" opacity=".95"/>`);
    b.raw(`<rect x="18" y="15" width="84" height="88" rx="4" fill="#EFE7DC" stroke="${GRAPH}" stroke-width="1.6" stroke-dasharray="4 4"/>`);
    b.tx(60,76,'?',60,{col:'#B9A99B'});
    b.raw(b.st('M27 118h46',GRAPH,1.2,.7),'top');
    b.raw(`<rect data-window x="20" y="16" width="80" height="80" fill="none" stroke="none" pointer-events="none"/>`,'top');
  }
};

PROPS.ultrasound=function(b){
  b.shadow(120,155,92,4);
  b.sh(RR(60,142,120,12,5),'#C9D3E3',{hatch:0,hl:0,lw:1.1});
  b.sh(RR(106,112,28,32,3),'#B5C1D6',{hatch:0,hl:0,lw:1});
  b.sh(RR(14,4,212,112,16),'#E9F0F8',{k:.1,sh:'#8FA3C2',lw:1.4,base:'#F6FAFD',hl:0});
  let sp='';for(let i=0;i<34;i++){const x=40+b.r()*160,y=22+b.r()*80;sp+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(.5+b.r()*.8)}" fill="#B6E3DC" opacity="${R1(.18+b.r()*.3)}"/>`}
  b.sh(RR(34,16,172,92,8),'#2E5961',{k:0,hatch:0,hl:0,lw:1.2,base:'#2E5961',dr:0,inner:sp+`<path d="M120 26L58 100A88 88 0 0 0 182 100Z" fill="#3C7078" opacity=".5"/><path d="M58 100A88 88 0 0 0 182 100M72 88A68 68 0 0 0 168 88M88 72A44 44 0 0 0 152 72" fill="none" stroke="#9ADBD2" stroke-width="1.2" opacity=".45"/><path d="M120 26L58 100M120 26L182 100" fill="none" stroke="#9ADBD2" stroke-width="1.2" opacity=".6"/>`});
  b.raw(`<rect data-screen x="34" y="16" width="172" height="92" fill="none" stroke="none" pointer-events="none"/>`,'top');
  b.raw(`<path d="M40 24l10 -2" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".55"/><path d="M40 96h14l4 -8 6 14 4 -6h10" fill="none" stroke="#FF9DB4" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`,'top');
  b.tx(198,28,'PUPS',9,{anchor:'end',col:'#9ADBD2',op:.85});
  b.sh(RR(70,121,100,15,7),'#CBD6E8',{k:.1,hatch:0,hl:0,lw:.9});
  [86,104,122].forEach((x,i)=>b.sh(E(x,128.5,4,4,10),[C.pinkD,'#FFD56B','#9ED8D2'][i],{hatch:0,hl:0,lw:.7}));
  b.sh(heartP(152,128,10),C.pinkD,{hatch:0,hl:0,lw:.6});
  paw(b,24,60,4.4,'#F7B2C4',{lw:.6});b.dot(214,100,2.4,'#7FD1B0');
  // probe on a curly cable
  b.raw(`<path d="M206 118q22 4 12 18t-8 14" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`);
  b.sh(rot(RR(220,128,14,28,5),-.25,227,142),'#F7B2C4',{hatch:0,hl:0,lw:1});
  b.sh(rot(E(231,156,6,4,10),-.25,231,156),'#BFE6FA',{hatch:0,hl:0,lw:.7});
  b.ex('spark',228,14,3.8);b.ex('heart',10,126,3.6,'#F7B2C4');
};

/* ---------- v2 icons ---------- */
Object.assign(ICONS,{
 family(b){ // pedigree: two parents above, pup below, joined by branches
  b.ln([[18,19],[24,36],[32,45]],{w:3,col:'#8E6446'});b.ln([[46,19],[40,36],[32,45]],{w:3,col:'#8E6446'});b.ln([[32,45],[32,59]],{w:4,col:'#8E6446'});
  b.sh(E(17,16,11,10,14),'#B8DE9A',{lw:1.1,hl:0});b.sh(E(47,16,11,10,14),'#B8DE9A',{lw:1.1,hl:0});
  b.sh(E(32,44,12,10,14),'#F7B2C4',{lw:1.1,hl:0});
  b.sh(heartP(32,43,10),'#FFFBF3',{lw:.6,hl:0,hatch:0});
  paw(b,17,16,3,'#FFF2DA',{noline:1});paw(b,47,16,3,'#FFF2DA',{noline:1});
 },
 coats(b){ // paint palette with coat colours
  b.sh([[8,34],[12,18],[28,8],[46,10],[58,22],[58,38],[46,50],[30,55],[22,50],[27,43],[18,41],[10,43]],'#F3DDB0',{k:.2,sh:'#C08E52',lw:1.1});
  [[22,22,'#D59A5E'],[36,17,'#FFFFFF'],[48,26,'#7A5136'],[46,40,'#B9B4AE'],[30,34,'#F4C28C']].forEach(([x,y,c])=>b.sh(E(x,y,5.2,5,10),c,{hatch:0,hl:0,lw:.9,dr:.2}));
  b.sh(E(21,45,3.4,3,8),'#FFFBF3',{hatch:0,hl:0,lw:.8,base:'#fff'});
  b.ln([[40,60],[56,38]],{w:3.4,col:'#8E6446'});b.sh([[56,38],[61,29],[52,32]],'#F28FA5',{k:0,hatch:0,hl:0,lw:.8});
 },
 mail(b){ // envelope with heart seal
  b.sh([[6,16],[58,16],[58,52],[6,52]],'#FFF2DA',{k:0,sh:'#C9AE8E',lw:1.2,base:'#FFFBF3'});
  b.ln([[7,17],[32,36],[57,17]],{w:2.8});b.ln([[7,51],[24,33]],{w:1.8,col:GRAPH});b.ln([[57,51],[40,33]],{w:1.8,col:GRAPH});
  b.sh(heartP(32,36,13),C.pinkD,{lw:.9,hl:0,hatch:0});
  b.ex('spark',56,10,4);
 },
 dna(b){ // double helix
  const A=[],B=[];for(let i=0;i<=8;i++){const y=6+i*6,x=32+Math.sin(i*.9)*14;A.push([x,y]);B.push([64-x,y])}
  for(let i=1;i<8;i+=2){const y=6+i*6,x=32+Math.sin(i*.9)*14;b.ln([[x,y],[64-x,y]],{w:2.2,col:INK})}
  b.ln(A,{w:4.2,col:'#F28FA5'});b.ln(B,{w:4.2,col:'#7FB7E0'});
  b.ex('spark',56,10,3.6);
 },
 playdate(b){ // two hearts with paw prints
  b.sh(heartP(22,34,34),'#F7B2C4',{lw:1.1});b.sh(heartP(43,29,38),'#FFD0A8',{lw:1.1});
  paw(b,22,34,3.8,'#FFFBF3',{lw:.5});paw(b,43,30,4.2,'#FFFBF3',{lw:.5});
  b.ex('spark',54,8,3.8);b.ex('spark',8,12,3);
 },
 nursery(b){ // whelping basket with a puppy head peeking out
  b.sh(E(18,28,7,8,10,.3),'#DDA06D',{hl:0,hatch:0,lw:.9});b.sh(E(46,28,7,8,10,-.3),'#DDA06D',{hl:0,hatch:0,lw:.9});
  b.sh(E(32,28,11,10,14),'#FFE3B0',{lw:1,hl:0,hatch:0});b.dot(28,27,1.3);b.dot(36,27,1.3);b.sh(E(32,32,2.4,1.8,8),INK,{hatch:0,hl:0,lw:.4,base:INK});
  b.sh([[6,40],[58,40],[54,56],[42,60],[22,60],[10,56]],WK,{k:.12,sh:WKD,lw:1.2,hl:0});
  b.ln([[9,48],[55,48]],{w:1.4,col:WKD});b.ln([[12,54],[52,54]],{w:1.2,col:WKD});
  b.sh(heartP(32,50,9),'#F7B2C4',{lw:.6,hl:0,hatch:0});
  b.ex('spark',56,14,3.4);
 },
 spots(b){ // four paw slots, one filled
  [[6,6,true],[35,6,false],[6,35,false],[35,35,false]].forEach(([x,y,on])=>{
   if(on){b.sh(RR(x,y,23,23,6),'#F7B2C4',{lw:1.1,hl:0});paw(b,x+11.5,y+13,4.6,'#FFFBF3',{lw:.5})}
   else{b.raw(`<rect x="${x}" y="${y}" width="23" height="23" rx="6" fill="#FFF8EC" stroke="${INK}" stroke-width="2.2" stroke-dasharray="4 3.4" stroke-linecap="round"/>`);paw(b,x+11.5,y+13,4.2,'#E3D2BA',{noline:1})}
  });
 }
});

Object.assign(ITEMS,{
 'Puppy Kibble'(b){ // small soft-bites bag in pastel pink with a paw-print label
  b.sh([[15,19],[49,19],[51,40],[52,56],[47,59],[17,59],[12,56],[13,40]],'#F7C6D6',{k:.12,sh:'#D98BA6',det:[[[18,22],[16,56]],[[46,22],[48,56]]],dw:.9});
  const top=[[14,19],[14,11]];for(let x=14;x<49;x+=4.4)top.push([x+2.2,x%2?8.5:9],[x+4.4,11]);
  b.sh([...top.slice(1),[50,19]].concat([[14,19]]),'#F3A9C0',{k:0,hatch:0,hl:0});
  b.sh(RR(18,26,28,27,5),'#FFFBF3',{hatch:0,hl:0,lw:.8});
  paw(b,32,43,5,'#F28FA5',{lw:.6});
  b.tx(32,35,'PUPPY',8.5,{mid:1,col:'#B8536F'});
  b.sh(heartP(41,31,6),'#FFE59A',{hatch:0,hl:0,lw:.5});
  [[53,59,3.2],[58,55,2.8],[9,60,2.6]].forEach(([x,y,s],i)=>b.sh(E(x,y,s,s*.85,8),['#F4C28C','#F9D5A8','#EDB878'][i],{hatch:0,hl:0,lw:.55,dr:.1}));
  b.ex('spark',52,15,3.2);
 }
});

/* ===================================== v2.1 "Sparkle & Family" art ===================================== */
/* Overlay hooks (all viewBox units):
   sparklejar 120x160  o.fill 0..24 (clamped). Notch n (1..24) sits at y = 148 - 4.4*n (tick marks on the right of the glass); glitter fills from the floor (y 148) up to
                       y = 148 - 4.4*fill. <rect data-glass x24 y40 w72 h108> = the glass interior. Fill is cached per value; specks are seeded so they only ever add.
   photoframe 160x140  <rect data-photo x20 y15 w120 h84> clear photo area (wooden frame around it, little stand behind)
   album 600x380       <rect data-slot="0..11" w78 h104>: slots 0-5 on the left page, 6-11 on the right (row-major, 3 columns x 2 rows).
                       Columns x = 30,118,206 (left) and 316,404,492 (right), rows y = 64 and 200. Caption line under each slot at y+114.
                       o.found = array of 12 booleans (default all false). Found slots get a pastel mount + paw stamp, empty slots are dashed.
   crayonbox 200x160, doggyramp 200x120, rockingchair 160x160, easel 160x200, sniffer 200x140: pure art, no hooks. */
const RAIN=['#E46F6B','#F9B97A','#FFE08A','#9CCB86','#7FB7E0','#B9A6E8'];
const crayonStar=(b,x,y,s,col)=>b.sh(starP(x,y,s,s*.45),col||'#FFD56B',{hatch:0,hl:0,lw:.7,dr:.15});
const waveD=(x,y,len,amp,n)=>{let d=`M${x} ${y}`;const sx=len/n;for(let i=0;i<n;i++)d+=`q${R1(sx/2)} ${i%2?amp:-amp} ${R1(sx)} 0`;return d};
// a standing crayon: body x..x+w from yb up to yt+tip, pointed tip, paper wrapper band
function crayon(b,x,yt,yb,w,col,wrap,o={}){
  const tip=w*.9,yo=yt+tip;
  b.sh([[x,yb],[x,yo],[x+w*.12,yo-tip*.55],[x+w/2,yt],[x+w*.88,yo-tip*.55],[x+w,yo],[x+w,yb]],col,{k:.06,hatch:o.hatch??1,hl:0,lw:o.lw||.9,dr:.3});
  const wy0=yo+(yb-yo)*.22,wy1=yo+(yb-yo)*.78;
  b.sh([[x,wy0],[x+w,wy0-.6],[x+w,wy1],[x,wy1+.6]],wrap||mix(col,'#FFFFFF',.55),{k:0,hatch:0,hl:0,lw:.6,dr:.1});
  if(w>10){b.ln([[x+w*.18,wy0+(wy1-wy0)*.3],[x+w*.82,wy0+(wy1-wy0)*.3]],{w:.8,col:mix(col,INK,.35),op:.8});b.ln([[x+w*.18,wy0+(wy1-wy0)*.62],[x+w*.82,wy0+(wy1-wy0)*.62]],{w:.8,col:mix(col,INK,.35),op:.8})}
}
function crayonBoxIcon(b){ // shared by item (64) and icon (64)
  const cs=['#E46F6B','#FFD56B','#7FB7E0','#9CCB86','#B9A6E8'];
  cs.forEach((c,i)=>crayon(b,10+i*9,7+(i%2)*3+(i===2?-1:0),44,8,c,null,{hatch:0,lw:.7}));
  b.sh([[6,36],[58,36],[56,58],[8,58]],'#FFE08A',{k:0,sh:'#C9A24A',lw:1,dr:.4,base:'#FFF4C2'});
  b.sh(RR(10,41,44,10,2),'#FFFBF3',{hatch:0,hl:0,lw:.6,base:'#fff'});
  b.tx(32,49.2,'CRAYONS',8,{mid:1,col:'#B8536F'});
  b.ln([[7,37],[57,37]],{w:1.2,col:'#C9A24A'});
}
function miniJar(b,fill){ // 64 box: mini sparkle jar
  b.sh(RR(20,6,24,9,3),C.pinkD,{hatch:0,hl:0,lw:1});
  b.sh(RR(16,13,32,6,2),'#EAF4FA',{hatch:0,hl:0,lw:.9});
  b.sh(RR(11,18,42,42,9),'#E8F4FB',{hatch:0,hl:0,lw:1.1,base:'#F7FBFE'});
  b.sh([[12,34],[36,32],[52,35],[52,50],[47,59],[17,59],[12,50]],'#F9C6D6',{k:.1,hatch:0,hl:0,noline:1,lw:.5,base:'#FCE0E8',dr:.2});
  [[20,50,'#FFE08A'],[30,54,'#fff'],[40,48,'#B9D4F3'],[26,42,'#fff'],[44,40,'#FFE08A'],[19,38,'#B9A6E8']].forEach(([x,y,c])=>b.dot(x,y,1.5,c));
  b.ln([[45,25],[50,25]],{w:1.2,col:INK});b.ln([[46,33],[50,33]],{w:1.2,col:INK});b.ln([[46,41],[50,41]],{w:1.2,col:INK});
  b.ex('spark',50,10,4);b.ex('spark',8,30,2.6,'#fff');
}
function noseP(cx,cy,s){return [[cx-s,cy-s*.35],[cx-s*.5,cy-s*.7],[cx+s*.5,cy-s*.7],[cx+s,cy-s*.35],[cx+s*.6,cy+s*.35],[cx,cy+s*.75],[cx-s*.6,cy+s*.35]]}

Object.assign(ICONS,{
 title(b){ // rosette ribbon
  b.sh([[20,34],[12,60],[22,54],[28,62],[32,40]],'#7FB7E0',{k:.05,hatch:0,hl:0,lw:1});
  b.sh([[44,34],[52,60],[42,54],[36,62],[32,40]],'#E46F6B',{k:.05,hatch:0,hl:0,lw:1});
  b.sh(cloudP(32,26,22,22,12,.14,48),C.pinkD,{lw:1.1,hl:0,hatch:0});
  b.sh(E(32,26,14,14,18),'#FFE08A',{hatch:0,hl:0,lw:1,base:'#FFF4C2'});
  crayonStar(b,32,26,9,'#FFFBF3');
  b.ex('spark',55,8,3.4);
 },
 album(b){ // open postcard album
  b.sh([[4,16],[32,22],[60,16],[60,52],[32,58],[4,52]],'#C99A72',{k:0,hatch:0,hl:0,lw:1.1});
  b.sh([[7,14],[31,19],[31,54],[7,49]],'#FFFBF3',{k:0,hatch:0,hl:0,lw:1,base:'#fff'});
  b.sh([[33,19],[57,14],[57,49],[33,54]],'#FFFBF3',{k:0,hatch:0,hl:0,lw:1,base:'#fff'});
  b.sh([[11,22],[26,26],[26,34],[11,30]],'#F7B2C4',{k:0,hatch:0,hl:0,lw:.8});
  b.sh([[11,35],[26,39],[26,45],[11,41]],'#BFE6FA',{k:0,hatch:0,hl:0,lw:.8});
  b.raw(`<path d="M38 24L53 20V28L38 32ZM38 38L53 34V43L38 47Z" fill="none" stroke="${INK}" stroke-width="1.6" stroke-dasharray="3 2.6" stroke-linecap="round"/>`);
  b.ex('heart',32,10,3.4);
 },
 decor(b){crayonBoxIcon(b)},
 sniff(b){ // a nose with squiggles
  b.sh(noseP(36,36,20),'#6E4F43',{k:.2,lw:1.2,hl:0,hatch:0,base:'#6E4F43'});
  b.sh(E(28,38,4,5.6,10,.5),'#2E221E',{hatch:0,hl:0,lw:.5,base:'#2E221E'});b.sh(E(44,38,4,5.6,10,-.5),'#2E221E',{hatch:0,hl:0,lw:.5,base:'#2E221E'});
  b.ex('glint',27,26,8);
  b.raw(b.st('M6 14q5 -5 0 -10M14 20q5 -5 0 -10M6 28q5 -5 0 -10','#7FB7E0',2.4),'top');
  b.raw(b.st('M58 14q-5 -5 0 -10M60 26q-5 -5 0 -10','#B9A6E8',2.4),'top');
 },
 meter(b){miniJar(b)}
});

Object.assign(ITEMS,{
 'Rainbow Collar'(b){
  const c=[];for(let i=0;i<=8;i++){const t=i/8;c.push([6+52*t,16+22*Math.sin(Math.PI*t)])}
  b.sh(ribbon(c,c.map(()=>17)),'#FFFFFF',{k:.1,hatch:0,hl:0,lw:1,base:'#fff',dr:.2});
  RAIN.forEach((col,k)=>{const d=(k-2.5)*2.6;b.sh(ribbon(c.map(p=>[p[0],p[1]+d]),c.map(()=>2.9)),col,{k:.1,hatch:0,hl:0,noline:1,nobase:1,dr:.05})});
  b.ln(c.map(p=>[p[0],p[1]-8.5]),{w:1.3});b.ln(c.map(p=>[p[0],p[1]+8.5]),{w:1.3});
  b.sh(E(32,49,2.6,2.6,8),'#E9B44C',{hatch:0,hl:0,lw:.8,dr:.1});
  b.sh(starP(32,55,9,4.2),'#FFD56B',{hatch:0,hl:0,lw:1,dr:.2,base:'#FFEFA8'});
  b.ex('spark',57,10,3.4);b.ex('glint',14,22,5);
 },
 'Gene Sniffer'(b){
  b.sh(RR(20,48,12,12,3),'#E2B07E',{hatch:0,hl:0,lw:.9}); // grip
  b.ln([[48,22],[53,9]],{w:1.8,col:INK});b.dot(53,8,2.4,'#F28FA5');
  b.sh([[3,35],[20,22],[22,48]],'#F7B2C4',{k:.2,hatch:0,hl:0,lw:1.1});
  b.sh(RR(18,20,38,30,8),'#BDE7D2',{lw:1.2,sh:'#6FB59A'});
  b.sh(E(5,35,3.8,3.6,9),'#6E4F43',{hatch:0,hl:0,lw:.7,base:'#6E4F43'});
  b.sh(RR(23,25,20,13,3),'#2E5961',{k:0,hatch:0,hl:0,lw:.8,base:'#2E5961',dr:0});
  b.raw(`<path d="M25 29q4 -4 7 0t7 0M25 34q4 4 7 0t7 0" fill="none" stroke="#FF9DB4" stroke-width="1.3" stroke-linecap="round"/>`,'top');
  b.sh(E(48,38,5.4,5.4,12),'#FFFBF3',{hatch:0,hl:0,lw:.9,base:'#fff'});
  b.ln([[48,38],[51,34]],{w:1.1,col:'#E46F6B'});
  [[26,45,'#E46F6B'],[32,45,'#FFD56B']].forEach(([x,y,c])=>b.dot(x,y,1.8,c));
  b.raw(b.st('M3 20q-3 -3 0 -6M8 15q-3 -3 0 -6','#7FB7E0',1.5),'top');
 },
 'Giant Crayon Box'(b){crayonBoxIcon(b);b.ex('spark',57,10,3.2)},
 'Family Photo Frame'(b){
  b.sh([[32,40],[19,60],[45,60]],'#C58F5E',{k:0,hatch:0,hl:0,lw:.9,under:1});
  b.sh(RR(7,8,50,42,4),C.wood,{hatch:0,hl:0,lw:1.2,base:'#F3DDB4',det:[[[10,12],[10,46]],[[54,12],[54,46]]],dw:.6});
  b.sh(RR(13,14,38,30,2),'#FDF3DE',{k:0,hatch:0,hl:0,lw:.8,base:'#FDF3DE',dr:0});
  b.sh(E(24,32,5.6,5,10),'#DDA06D',{hatch:0,hl:0,lw:.8});b.sh(E(39,31,5,4.6,10),'#F4C28C',{hatch:0,hl:0,lw:.8});
  b.sh(E(24,27,3,3.4,8,.4),'#C8895B',{hatch:0,hl:0,lw:.6});b.sh(E(40,26,3,3.4,8,-.4),'#C8895B',{hatch:0,hl:0,lw:.6});
  b.ex('heart',32,20,3,'#F7B2C4');
  b.ex('spark',57,8,3);
 },
 'Doggy Ramp'(b){
  b.sh([[5,54],[59,54],[59,24],[5,50]],'#E2B07E',{k:0,sh:WKD,lw:1.1,base:'#F3DDB4'});
  b.sh([[3,46],[60,18],[60,26],[3,53]],'#D3C6F1',{k:0,hatch:0,hl:0,lw:1,base:'#EAE2FA',dr:.3});
  [[16,45,-.4],[32,38,-.4],[48,30,-.4]].forEach(([x,y,a])=>paw(b,x,y,2.5,'#FFFBF3',{a,noline:1}));
  b.ln([[8,54],[8,50]],{w:1.2});b.ln([[56,54],[56,26]],{w:1.2,col:WKD});
  b.ex('spark',56,12,3);
 },
 'Rocking Chair'(b){
  b.sh([[14,36],[11,10],[19,8],[24,36]],C.wood,{k:.05,hatch:0,hl:0,lw:1,base:'#F3DDB4',det:[[[15,30],[14,16]]],dw:.7});
  b.sh([[46,36],[48,18],[54,18],[53,36]],C.wood,{k:.05,hatch:0,hl:0,lw:.9});
  b.sh(RR(12,34,42,6,2),C.wood,{hatch:0,hl:0,lw:1,base:'#F3DDB4'});
  b.ln([[18,40],[16,52]],{w:3,col:WKD});b.ln([[48,40],[50,52]],{w:3,col:WKD});
  b.sh(ribbon([[4,53],[18,59],[34,60],[48,59],[60,53]],[4,5,5,5,3.4]),'#C58F5E',{k:.2,hatch:0,hl:0,lw:1});
  b.sh([[18,34],[40,32],[52,34],[50,41],[44,39],[38,43],[32,40],[26,44],[20,40],[16,43]],'#F7B2C4',{k:.05,hatch:0,hl:0,lw:1,base:'#FDE0E8'});
  b.raw(b.st('M20 36H48M18 39H49','#fff',1.1,.8),'top');
  b.ex('heart',44,24,3,'#F7B2C4');
 }
});

PROPS.sparklejar=function(b,o){
  const f=Math.max(0,Math.min(24,o.fill|0)),yf=148-4.4*f,sr=rng(hashS('sparklejar:specks'));
  b.shadow(60,153,46,4);
  b.sh(RR(16,32,88,120,16),'#E8F4FB',{hatch:0,hl:0,lw:1.3,base:'#F7FBFE'});
  b.sh(RR(28,22,64,16,4),'#EAF4FA',{hatch:0,hl:0,lw:1.1,base:'#F7FBFE'});
  if(f>0){
    b.sh([[22,yf+1],[44,yf-1.2],[70,yf+.8],[99,yf-.6],[100,138],[94,148],[26,148],[20,138]],'#F9C6D6',{k:.08,hatch:0,hl:0,noline:1,lw:.5,base:'#FCE0E8',dr:.2});
    const cols=['#FFE08A','#FFFFFF','#B9D4F3','#F28FA5','#B9A6E8','#9ED8D2','#FFD56B'];let sp='';
    for(let i=0;i<150;i++){const x=24+sr()*72,y=42+sr()*104,rr=.8+sr()*1.5,c=cols[i%7];
      if(y>=yf){if(i%9===0)b.ex('spark',R1(x),R1(y),R1(rr*1.5+1),c);else sp+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(rr)}" fill="${c}"/>`}}
    b.raw(sp);
  }
  // notches (right side): every 6th is long
  let nt='';for(let n=1;n<=24;n++){const y=R1(148-4.4*n);nt+=`M${n%6===0?78:88} ${y}H98`}
  b.raw(b.st(nt,INK,1.3,.85));
  [6,12,18,24].forEach(n=>b.tx(70,R1(148-4.4*n+3),String(n),9,{col:'#8A6A5C',op:.8}));
  b.ln([[24,50],[24,100]],{w:2.6,col:'#fff',op:.9});b.ln([[24,108],[24,122]],{w:2.6,col:'#fff',op:.9});
  b.raw(`<rect data-glass="" x="24" y="40" width="72" height="108" fill="none" stroke="none" pointer-events="none"/>`,'top');
  // lid + tag
  b.sh(RR(24,6,72,20,6),C.pinkD,{hatch:1,hl:0,lw:1.2,base:'#F9C6D6'});
  let rg='';for(let x=30;x<=90;x+=6)rg+=`M${x} 9V23`;b.raw(b.st(rg,'#C95F7A',1,.45));
  crayonStar(b,60,16,6,'#FFE08A');
  b.ln([[30,36],[16,48],[14,58]],{w:1.1,col:'#C95F7A'});b.sh(heartP(14,62,11),'#FFE08A',{hatch:0,hl:0,lw:.8,top:1});
  b.ex('spark',104,34,4);b.ex('spark',112,142,3,'#FFE07A');
};

PROPS.crayonbox=function(b){
  b.shadow(100,154,92,4);
  b.sh(RR(8,86,184,22,3),'#E3A93E',{hatch:0,hl:0,lw:1.2,base:'#F1C86E'});
  const cs=['#E46F6B','#F9B97A','#FFD56B','#9CCB86','#7FB7E0','#B9A6E8','#F28FA5','#8E6446'];
  cs.forEach((c,i)=>crayon(b,17+i*21,6+((i*7)%4)*8,112,18,c,null,{lw:1}));
  b.sh([[6,100],[194,100],[190,152],[10,152]],'#FFE08A',{k:0,sh:'#C9A24A',lw:1.3,dr:.5,base:'#FFF4C2'});
  b.sh([[6,100],[194,100],[194,108],[6,108]],'#E3A93E',{k:0,hatch:0,hl:0,lw:1,dr:.2});
  b.sh(RR(40,114,120,30,4),'#FFFBF3',{hatch:0,hl:0,lw:.9,base:'#fff'});
  b.tx(100,138,'CRAYONS',24,{mid:1,col:'#B8536F'});
  paw(b,22,128,6,'#F28FA5',{lw:.6});paw(b,178,128,6,'#7FB7E0',{lw:.6});
  b.ex('spark',186,12,5);b.ex('spark',10,20,3.6,'#FFE59A');
};

PROPS.photoframe=function(b){
  b.shadow(80,134,56,3);
  b.sh([[80,98],[50,134],[110,134]],'#C58F5E',{k:0,sh:WKD,lw:1,under:1});
  b.sh(RR(10,6,140,102,6),C.wood,{hatch:1,hl:0,lw:1.4,base:'#F3DDB4',sh:WKD,det:[[[13,10],[13,102]],[[147,10],[147,102]],[[16,8],[144,8]]],dw:.7});
  b.sh(RR(17,12,126,90,3),'#C58F5E',{hatch:0,hl:0,lw:.9,dr:.2,base:'#D9A877'});
  b.sh(RR(20,15,120,84,2),'#FDF3DE',{k:0,hatch:0,hl:0,lw:.8,base:'#FDF3DE',dr:0});
  b.raw(`<rect data-photo="" x="20" y="15" width="120" height="84" fill="none" stroke="none" pointer-events="none"/>`,'top');
  [[16,11],[144,11],[16,103],[144,103]].forEach(([x,y],i)=>b.sh(heartP(x,y,9),i%2?'#FFE08A':'#F7B2C4',{hatch:0,hl:0,lw:.7,top:1}));
  paw(b,80,108,4,'#F28FA5',{lw:.6});
  b.ex('spark',152,8,4);
};

PROPS.doggyramp=function(b){
  b.shadow(100,112,96,4);
  b.sh([[8,110],[192,110],[192,46],[8,98]],'#E2B07E',{k:0,sh:WKD,lw:1.3,base:'#F3DDB4',dr:.5});
  b.sh([[24,110],[24,92],[34,91],[34,110]],'#C58F5E',{k:0,hatch:0,hl:0,lw:.9});b.sh([[160,110],[160,56],[170,54],[170,110]],'#C58F5E',{k:0,hatch:0,hl:0,lw:.9});
  // the carpeted slope
  b.sh([[2,92],[196,28],[198,44],[4,106]],'#D3C6F1',{k:0,hatch:1,hl:0,lw:1.3,base:'#EAE2FA',dr:.4,sh:'#9C8CCF'});
  let pl='';for(let i=0;i<30;i++){const t=i/30;pl+=`M${R1(10+t*180)} ${R1(100-t*64)}l1 -3`}
  b.raw(b.st(pl,'#fff',1,.7));
  // paw-print treads
  [[28,92],[56,83],[84,74],[112,64],[140,54],[168,45]].forEach(([x,y],i)=>paw(b,x,y,5,i%2?'#FFFBF3':'#FFE08A',{a:-.31,lw:.5}));
  // little rail posts + bolts
  [[8,98,92],[192,46,32]].forEach(([x,y,yt])=>{b.sh(RR(x-6,yt-6,12,y-yt+10,3),'#C58F5E',{hatch:0,hl:0,lw:1,top:1})});
  [[100,106],[60,106],[140,106]].forEach(([x,y])=>b.dot(x,y,1.6,WKD));
  b.ex('spark',188,16,4.4);b.ex('heart',14,70,3.4,'#F7B2C4');
};

PROPS.rockingchair=function(b){
  b.shadow(80,153,64,4);
  // back posts + slats
  b.sh([[44,98],[34,16],[48,12],[58,98]],C.wood,{k:.05,hatch:0,hl:0,lw:1.2,base:'#F3DDB4',det:[[[40,86],[38,30]]],dw:.8});
  b.sh([[104,98],[104,40],[118,40],[116,98]],C.wood,{k:.05,hatch:0,hl:0,lw:1.1});
  for(let i=0;i<3;i++){const y=28+i*18;b.sh([[36+i*.6,y],[56+i*.6,y-2],[57,y+8],[37,y+10]],C.wood,{k:0,hatch:0,hl:0,lw:.9,dr:.2})}
  b.sh(RR(34,6,28,9,3),C.woodD,{hatch:0,hl:0,lw:1.1});
  // seat, arm and legs
  b.sh(RR(34,94,92,14,4),C.wood,{hatch:1,hl:0,lw:1.3,base:'#F3DDB4',sh:WKD});
  b.sh(RR(96,66,24,8,3),C.wood,{hatch:0,hl:0,lw:1});b.ln([[108,74],[108,96]],{w:4,col:WKD});
  b.ln([[48,108],[44,136]],{w:5,col:WKD});b.ln([[112,108],[116,134]],{w:5,col:WKD});
  // rocker
  b.sh(ribbon([[8,136],[30,148],[80,152],[130,148],[154,134]],[6,8,9,8,5]),'#C58F5E',{k:.2,hatch:1,hl:0,lw:1.3});
  // knitted blanket draped over the seat and hanging off the front edge
  const bl=[[56,92],[84,86],[120,90],[130,104],[128,128],[118,120],[108,130],[98,121],[86,130],[76,121],[66,128],[58,112]];
  b.sh(bl,'#F7B2C4',{k:.07,hatch:1,hl:0,lw:1.3,base:'#FDE0E8',sh:'#D9788F'});
  let kn='';for(let r=0;r<4;r++)kn+=waveD(62+r%2*3,96+r*8,56,2,8);
  b.raw(b.st(kn,'#fff',1.1,.75));
  b.raw(b.st('M60 104H124M62 114H122','#FFD56B',3,.9));
  b.sh(heartP(88,98,10),'#FFE08A',{hatch:0,hl:0,lw:.7,top:1});
  b.ex('spark',144,66,4);b.ex('heart',22,100,3.6,'#F7B2C4');
};

PROPS.album=function(b,o){
  const found=Array.isArray(o.found)?o.found:[],X=[30,118,206,316,404,492],Y=[64,200];
  b.shadow(300,372,270,6);
  // cover, pages, spine
  b.sh([[6,22],[594,22],[596,360],[4,360]],'#C99A72',{k:0,hatch:0,hl:0,lw:1.6,base:'#DDB78F',dr:.6});
  b.sh([[14,12],[298,20],[298,350],[14,346]],'#FFFBF3',{k:0,hatch:0,hl:0,lw:1.2,base:'#fff',dr:.4});
  b.sh([[302,20],[586,12],[586,346],[302,350]],'#FFFBF3',{k:0,hatch:0,hl:0,lw:1.2,base:'#fff',dr:.4});
  b.raw(`<path d="M298 20V350M302 20V350" stroke="${INK}" stroke-width="1.2" opacity=".45"/>`);
  let pg='';for(let i=0;i<6;i++){pg+=`M588 ${28+i*56}h5M7 ${28+i*56}h5`}b.raw(b.st(pg,'#8A6A5C',1.1,.5));
  // heading banner
  b.sh(rot(RR(190,2,220,36,6),-.015,300,20),'#FFE59A',{k:0,hatch:0,hl:0,lw:1.2,base:'#FFF3C4'});
  b.tx(300,29,'Postcard Album',26,{rot:-1,col:'#B8536F'});
  b.ex('heart',204,20,4.6);b.ex('heart',398,20,4.6,'#F7B2C4');
  const cols=['#F7B2C4','#BFE6FA','#FFE08A','#BDE7D2','#D3C6F1','#FFD0A8'];
  for(let i=0;i<12;i++){
    const x=X[i%3+(i>=6?3:0)],y=Y[((i%6)/3)|0],ok=!!found[i];
    b.raw(`<rect data-slot="${i}" x="${x}" y="${y}" width="78" height="104" fill="none" stroke="none" pointer-events="none"/>`,'top');
    if(ok){
      b.sh(RR(x-4,y-4,86,112,3),'#FFFFFF',{k:0,hatch:0,hl:0,lw:.9,base:'#fff',dr:.4});
      b.sh(RR(x,y,78,104,2),'#FDF3DE',{k:0,hatch:0,hl:0,lw:.7,base:'#FDF3DE',dr:0});
      b.raw(`<path d="M${x-4} ${y+8}l8 -8M${x+74} ${y-4}l8 8M${x-4} ${y+100}l8 8M${x+82} ${y+100}l-8 8" stroke="${cols[i%6]}" stroke-width="5" stroke-linecap="round"/>`,'top');
    }else{
      b.raw(`<rect x="${x}" y="${y}" width="78" height="104" rx="3" fill="#FBF3E4" fill-opacity=".55" stroke="${GRAPH}" stroke-width="1.6" stroke-dasharray="6 5" stroke-linecap="round"/>`);
      paw(b,x+39,y+54,11,'#E3D2BA',{noline:1});
    }
    b.raw(b.st(`M${x+6} ${y+120}h${50+(i*7)%20}`,GRAPH,1.1,ok?.9:.5),'top');
  }
  b.raw(b.st('M4 360H596','#8E6446',3,.35));
  b.ex('spark',590,30,5);b.ex('spark',10,366,4,'#FFE59A');
  tapeB(b,24,16,60,-28,'#F7B9C6');tapeB(b,576,16,60,26,'#BDE7D2');
};

PROPS.easel=function(b){
  b.shadow(80,194,62,4);
  const leg=(pts,w)=>b.sh(ribbon(pts,w),C.wood,{k:.05,hatch:0,hl:0,lw:1.1,base:'#F3DDB4'});
  leg([[84,28],[84,120],[84,194]],[7,7,7]);
  leg([[56,12],[44,100],[30,194]],[8,8,8]);leg([[104,12],[116,100],[130,194]],[8,8,8]);
  b.sh(RR(50,6,60,9,3),C.woodD,{hatch:0,hl:0,lw:1.1});
  b.sh(RR(36,148,88,10,3),C.woodD,{hatch:1,hl:0,lw:1.2});
  // canvas with a half-done crayon dog
  b.sh(RR(30,26,100,124,3),'#FFFFFF',{k:0,hatch:0,hl:0,lw:1.3,base:'#fff',dr:.5});
  b.sh(RR(36,32,88,112,2),'#FFF8E8',{k:0,hatch:0,hl:0,lw:.6,base:'#FFF8E8',dr:0,inner:`<path d="M40 40q20 -4 40 0M42 132q30 -6 74 0" stroke="#BFE6FA" stroke-width="10" stroke-linecap="round" fill="none" opacity=".7"/>`});
  b.sh(E(64,70,14,17,10,.3),'#DDA06D',{hatch:0,hl:0,lw:1.1,base:'#DDA06D'});b.sh(E(98,70,14,17,10,-.3),'#DDA06D',{hatch:0,hl:0,lw:1.1,base:'#DDA06D'});
  b.sh(E(81,86,26,24,16),'#F4C28C',{hatch:0,hl:0,lw:1.2,dr:.8,base:'#F8D9B4'});
  b.dot(72,82,2.6,INK);b.dot(91,82,2.6,INK);
  b.sh(E(81,95,5,3.6,8),INK,{hatch:0,hl:0,lw:.5,base:INK});
  b.ln([[76,102],[81,106],[86,102]],{w:1.4});
  b.ln([[58,112],[52,134],[110,134],[104,112]],{w:1.5,col:'#B8A08A',op:.8});
  b.raw(b.st('M60 118l8 4M96 118l-8 4M72 126h18','#B8A08A',1,.7),'top');
  // tray + crayon
  b.sh(rot(RR(52,141,34,8,3),-.03,69,145),'#E46F6B',{hatch:0,hl:0,lw:.9});b.sh([[86,141],[93,144.5],[86,148]],'#F3C9B8',{k:0,hatch:0,hl:0,lw:.7});
  b.ex('spark',142,30,4.6);b.ex('heart',14,44,3.8,'#F7B2C4');
  tapeB(b,36,28,36,-30,'#F7B9C6');
};

PROPS.sniffer=function(b){
  b.shadow(100,134,86,4);
  b.sh(RR(94,98,34,30,7),'#E2B07E',{hatch:1,hl:0,lw:1.2,base:'#F3DDB4'}); // grip
  b.ln([[96,106],[126,106]],{w:1.3,col:WKD});b.ln([[96,114],[126,114]],{w:1.3,col:WKD});
  b.ln([[150,34],[160,10]],{w:2.4});b.sh(E(162,8,6,6,10),'#F28FA5',{hatch:0,hl:0,lw:.9,top:1});
  b.sh([[18,52],[56,32],[58,92]],'#F7B2C4',{k:.2,hatch:0,hl:0,lw:1.4,base:'#FDE0E8'});
  b.sh(RR(52,28,128,74,18),'#BDE7D2',{hatch:1,lw:1.5,sh:'#6FB59A',base:'#E3F5EC'});
  b.sh(E(20,52,9,8.4,10),'#6E4F43',{hatch:0,hl:0,lw:.9,base:'#6E4F43'});b.ex('glint',16,48,5);
  b.sh(RR(66,40,60,34,5),'#2E5961',{k:0,hatch:0,hl:0,lw:1.2,base:'#2E5961',dr:0});
  b.raw(`<path d="M72 50q8 -8 14 0t14 0t14 0M72 62q8 8 14 0t14 0t14 0" fill="none" stroke="#FF9DB4" stroke-width="2" stroke-linecap="round"/><path d="M79 46V66M93 46V66M107 46V66M121 46V66" stroke="#9ADBD2" stroke-width="1" opacity=".7"/><path d="M69 44h12" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/>`,'top');
  b.sh(E(152,62,22,22,22),'#FFFBF3',{hatch:0,hl:0,lw:1.2,base:'#fff'});
  let tk='';for(let i=0;i<9;i++){const a=(200+i*17.5)*Math.PI/180;tk+=`M${R1(152+Math.cos(a)*17)} ${R1(62+Math.sin(a)*17)}L${R1(152+Math.cos(a)*21)} ${R1(62+Math.sin(a)*21)}`}
  b.raw(b.st(tk,INK,1.2,.8),'top');
  b.ln([[152,62],[166,46]],{w:2.2,col:'#E46F6B',top:1});b.dot(152,62,3,INK,'top');
  [[76,86,'#E46F6B'],[90,86,'#FFD56B'],[104,86,'#7FB7E0']].forEach(([x,y,c])=>b.sh(E(x,y,4.6,4.6,10),c,{hatch:0,hl:0,lw:.8}));
  // sniff squiggles in the air
  b.raw(b.st('M6 36q8 -7 0 -14M4 52q8 -7 0 -14M6 68q8 -7 0 -14M2 82q8 -7 0 -14','#7FB7E0',2.2),'top');
  b.raw(b.st('M30 18q6 -6 0 -12','#B9A6E8',2),'top');
  b.ex('spark',184,20,4.6);b.ex('spark',40,112,3.4,'#FFE59A');b.ex('heart',12,100,3.6,'#F7B2C4');
};

/* ===================================== v2.4 "Shop Day" art ===================================== */
/* 6 houses, 32 items (12 clothes, 6 toys, 8 foods, 6 house cards), props missioncard / stampcard / gerald, icons missions / guide / stamp.
   missioncard 200x260  o.items [{text (escaped by the caller), done, p, n}] (3 rows), o.stamps 0..7, o.day. The card is the same drawing for every
                        option set (fixed seed); only the row text, ticks, badge and stamp dots change. Cached per option set.
   stampcard 240x140    o.stamps 0..7 stamped in pink crayon (spot 7 is the surprise). Cached per value.
   gerald 160x160       o.pose point | wave | sit | cheer. A crayon duck in the dog style (three boiling redraws like the dogs, paused by
                        [data-motion="off"]). Feet on y=150.
   Lighthouse Kennel: the lamp glow sits in <g class="pa-wb-glow"> (static, no filter) so the yard can dim it by day if it wants. */
const IND='#7F8FD6',INDD=mix('#7F8FD6',INK,.3),STRAW='#F3DDB0',POOL='#8FB8E8';
// a little cube in 3/4 view (top, front, side faces)
function cubeV(b,x,y,s,top,front,side){
  b.sh([[x,y],[x+s,y-s*.42],[x+s*1.9,y],[x+s*.9,y+s*.42]],top,{k:0,hatch:0,hl:0,lw:.6,dr:.15});
  b.sh([[x,y],[x+s*.9,y+s*.42],[x+s*.9,y+s*1.32],[x,y+s*.9]],front,{k:0,hatch:0,hl:0,lw:.6,dr:.15});
  b.sh([[x+s*.9,y+s*.42],[x+s*1.9,y],[x+s*1.9,y+s*.9],[x+s*.9,y+s*1.32]],side,{k:0,hatch:0,hl:0,lw:.6,dr:.15});
}
// a sweater-like garment outline (shared by the hoodie, the bee suit and the pyjamas), dy shifts it down
const garment=(dy=0)=>[[22,9],[28,12],[36,12],[42,9],[54,17],[61,40],[52,43],[48,30],[48,57],[16,57],[16,30],[12,43],[3,40],[10,17]].map(p=>[p[0],p[1]+dy*(1-(p[1]-9)/48)]);
function cuffs(b,col){b.sh([[3,40],[12,43],[11,47],[2,44]],col,{k:0,hl:0,hatch:0,lw:.8});b.sh([[61,40],[52,43],[53,47],[62,44]],col,{k:0,hl:0,hatch:0,lw:.8})}
function scallopBottom(x0,x1,y,n,d){const p=[],w=(x1-x0)/n;for(let i=0;i<n;i++)for(let t=0;t<1;t+=.25)p.push([x1-(i+t)*w,y+d*Math.sin(Math.PI*t)]);p.push([x0,y]);return p}

/* ---------- clothes (64) ---------- */
Object.assign(ITEMS,{
 'Happi Coat'(b){
  const wv=(x,y,len)=>b.st(waveD(x,y,len,1.6,Math.round(len/3.2)),IND,.9,.9);
  b.sh([[20,9],[44,9],[60,17],[61,33],[48,35],[48,58],[16,58],[16,35],[3,33],[4,17]],IND,{k:.04,sh:INDD,
   marks:[{pts:[[0,51],[64,51],[64,60],[0,60]],fill:'#FFFFFF',k:0},{pts:[[0,27],[16,27],[16,36],[0,36]],fill:'#FFFFFF',k:0},{pts:[[48,27],[64,27],[64,36],[48,36]],fill:'#FFFFFF',k:0}],
   inner:wv(14,55,38)+wv(1,31.5,14)+wv(48,31.5,15)+b.st(b.jl(16,35,16,51,.3)+b.jl(48,35,48,51,.3),INDD,.8,.6)});
  b.sh([[23,8],[29,8],[33,25],[33,58],[28,58],[28,26]],'#FFFFFF',{k:.05,hatch:0,hl:0,lw:.8,base:'#fff',inner:b.st('M29 30q1.6 2 0 4t0 4t0 4t0 4t0 4t0 4',IND,.8,.8)});
  b.sh([[41,8],[35,8],[33,25],[36,27]],'#FFFFFF',{k:.05,hatch:0,hl:0,lw:.8,base:'#fff'});
  b.sh([[31,27],[25,24],[24,31],[31,30]],C.redD,{k:.1,hatch:0,hl:0,lw:.7});b.sh([[34,27],[40,24],[41,31],[34,30]],C.redD,{k:.1,hatch:0,hl:0,lw:.7});
  b.sh(E(32.5,28.5,2.6,2.4,8),C.red,{hatch:0,hl:0,lw:.7});
  b.ln([[31,30],[28,38]],{w:1.6,col:C.redD});b.ln([[34,30],[37,37]],{w:1.6,col:C.redD});
  b.ex('spark',57,7,3.4);
 },
 'Sailor Collar'(b){
  // laid flat from behind: the big square back flap, the two front points tied in a red knot
  const NAV=mix(IND,INK,.25);
  b.sh([[4,8],[60,8],[58,44],[6,44]],'#FFFFFF',{k:.05,base:'#fff',sh:'#9FB3D9',ho:.35,hl:0,
   inner:b.st(b.jl(9,13,55,13,.3)+b.jl(55,13,54,39,.3)+b.jl(54,39,10,39,.3)+b.jl(10,39,9,13,.3),NAV,1.8,.95)});
  b.sh(E(32,9,13,7,18),C.blue,{hatch:0,hl:0,lw:.9});
  b.sh([[19,10],[26,12],[32,40],[28,46]],'#FFFFFF',{k:.05,hatch:0,hl:0,lw:.8,base:'#fff'});b.sh([[45,10],[38,12],[32,40],[36,46]],'#FFFFFF',{k:.05,hatch:0,hl:0,lw:.8,base:'#fff'});
  b.sh([[30,47],[24,61],[29,59],[32,50]],C.redD,{k:.1,hatch:0,hl:0,lw:.7});b.sh([[34,47],[40,61],[35,59],[32,50]],C.redD,{k:.1,hatch:0,hl:0,lw:.7});
  b.sh(E(32,46,4.6,3.8,10),C.red,{hatch:0,hl:0,lw:.8});
  crayonStar(b,12,34,3,'#FFE07A');crayonStar(b,52,34,3,'#FFE07A');
  b.ex('spark',58,54,3.2);
 },
 'Chef Hat'(b){
  b.sh(cloudP(32,24,25,18,7,.24,48),'#FFFFFF',{base:'#fff',sh:'#B9C3D6',ho:.4,hlo:.6,
   inner:b.st('M14 30q4 -8 3 -14M24 34q2 -10 0 -18M40 34q-2 -10 0 -18M50 30q-4 -8 -3 -14',GRAPH,1,.6)});
  b.sh([[14,36],[50,36],[49,56],[15,56]],'#FFFFFF',{k:.06,base:'#fff',sh:'#B9C3D6',ho:.4,hl:0,
   inner:b.st([20,26,32,38,44].map(x=>b.jl(x,38,x,54,.4)).join(''),GRAPH,1.1,.75)});
  b.ln([[15,40],[49,40]],{w:1,col:GRAPH,op:.7});
  b.sh(heartP(32,48,8),C.pinkD,{hatch:0,hl:0,lw:.6});
  b.ex('spark',56,8,3.6);b.ex('dots',6,12,4);
 },
 'Wizard Hat'(b){
  b.sh(E(32,52,29,8,22),'#A894DE',{hl:0,sh:mix('#A894DE',INK,.35)});
  const cone=[[13,51],[20,36],[25,22],[30,13],[37,8],[46,6],[54,10],[58,17],[52,14],[45,13],[40,18],[41,32],[46,44],[51,51]];
  b.sh(cone,C.lavD,{k:.08,marks:[{pts:[[0,44],[64,44],[64,51],[0,51]],fill:'#FFE07A',k:0}]});
  b.sh(starP(58,18,4.6,2.1),'#FFE07A',{hatch:0,hl:0,lw:.7,dr:.15});
  crayonStar(b,27,32,4,'#FFE07A');crayonStar(b,37,24,2.8,'#FFF0B8');crayonStar(b,40,39,2.6,'#FFE07A');
  b.sh(crescent(21,43,4.4).map(p=>[p[0],p[1]-2]),'#FFF0B8',{hatch:0,hl:0,lw:.55,dr:.1});
  b.ex('spark',8,14,4);b.ex('spark',58,33,2.8,'#FFF0B8');
 },
 'Bumblebee Suit'(b){
  const BK=C.door;
  [[22,16,-2.45],[42,16,-.69]].forEach(([x,y,a])=>b.sh(leafP(x,y,20,13,a),'#EAF5FD',{hatch:0,hl:0,lw:.8,base:'#F7FBFE',op:.9,
   inner:b.st(b.jl(x,y,x+15*Math.cos(a),y+15*Math.sin(a),.2),'#9FC3E0',.9,.9)}));
  b.sh(garment(4),'#FFE07A',{k:.05,sh:'#C9A24A',
   marks:[{pts:[[0,29],[64,29],[64,35],[0,35]],fill:BK,k:0},{pts:[[0,42],[64,42],[64,48],[0,48]],fill:BK,k:0},{pts:[[0,38],[11,38],[13,44],[0,44]],fill:BK,k:0},{pts:[[53,38],[64,38],[64,44],[51,44]],fill:BK,k:0}]});
  b.ln([[28,14],[26,7],[22,3]],{w:1.6});b.ln([[36,14],[38,7],[42,3]],{w:1.6});
  b.sh(E(21.4,3.4,2.8,2.8,8),BK,{hatch:0,hl:0,lw:.6,base:BK});b.sh(E(42.6,3.4,2.8,2.8,8),BK,{hatch:0,hl:0,lw:.6,base:BK});
  b.sh([[29,57],[35,57],[32,62]],BK,{k:.1,hatch:0,hl:0,lw:.6,base:BK});
  b.ex('dots',56,6,4);
 },
 'Cozy Hoodie'(b){
  const G=C.grey,GD=mix(C.grey,INK,.2);
  b.sh([[19,15],[22,6],[32,2.5],[42,6],[45,15],[32,18]],GD,{k:.15,hatch:0,hl:0,marks:[{pts:E(32,10,7,4.4,12),fill:mix(GD,INK,.18)}]});
  b.sh(garment(0),G,{k:.05,sh:mix(G,INK,.4),
   marks:[{pts:[[0,52],[64,52],[64,58],[0,58]],fill:GD,k:0}],
   inner:b.st([18,22,26,30,34,38,42,46].map(x=>b.jl(x,52,x,57,.2)).join(''),INK,.7,.45)});
  cuffs(b,GD);
  b.sh([[20,38],[44,38],[47,50],[17,50]],GD,{k:.06,hatch:0,hl:0,lw:.8,det:[[[20,40],[18,48]],[[44,40],[46,48]]],dw:.7});
  b.ln([[28,13],[27,24]],{w:1.1});b.ln([[36,13],[37,24]],{w:1.1});b.dot(27,25,1.3,C.pinkD);b.dot(37,25,1.3,C.pinkD);
  b.sh(heartP(32,32,7),C.pink,{hatch:0,hl:0,lw:.5});
  b.ex('spark',57,8,3.4);
 },
 'Knit Scarf'(b){
  const RD=C.redD,CR='#FFF2DA';
  const knit=(x0,y0,x1,y1)=>{let v='';for(let y=y0;y<y1;y+=4)for(let x=x0;x<x1;x+=4)v+=`M${R1(x-1.3)} ${R1(y-1.4)}L${x} ${y}L${R1(x+1.3)} ${R1(y-1.4)}`;return `<path d="${v}" fill="none" stroke="#B5605C" stroke-width=".7" stroke-opacity=".5" stroke-linecap="round"/>`};
  const fringe=(pts)=>pts.forEach(([x,y,dx])=>b.ln([[x,y],[x+dx,y+6]],{w:1.1,col:RD}));
  b.sh(ribbon([[24,22],[19,34],[15,46]],[11,11,11]),RD,{k:.12,hl:0,marks:[{pts:[[0,30],[64,30],[64,35],[0,35]],fill:CR,k:0},{pts:[[0,40],[64,40],[64,45],[0,45]],fill:CR,k:0}],inner:knit(8,22,30,52)});
  fringe([[10,49,-1],[13,50,0],[16,51,0],[19,51,1]]);
  b.sh(ribbon([[6,20],[18,15],[32,16],[46,15],[58,20]],[13,13,13,13,13]),RD,{k:.15,marks:[8,20,32,44,56].map(x=>({pts:[[x,0],[x+5,0],[x+5,40],[x,40]],fill:CR,k:0})),inner:knit(2,12,62,28)});
  b.sh(ribbon([[40,20],[43,36],[45,52]],[12,12,12]),RD,{k:.12,marks:[{pts:[[0,27],[64,27],[64,32],[0,32]],fill:CR,k:0},{pts:[[0,38],[64,38],[64,43],[0,43]],fill:CR,k:0}],inner:knit(34,22,54,58)});
  fringe([[39,57,-1],[42,58,0],[45,58,0],[48,58,1],[51,57,1.5]]);
  b.ex('heart',8,8,3);b.ex('spark',58,8,3.4);
 },
 'Sun Hat'(b){
  let wv='';for(let i=0;i<3;i++)wv+=`<ellipse cx="32" cy="${41+i*.6}" rx="${R1(18+i*4.6)}" ry="${R1(6.4+i*1.8)}" fill="none" stroke="${WKD}" stroke-width=".7" stroke-dasharray="1.6 1.8" opacity=".75"/>`;
  b.sh(E(32,41,30,12,24),STRAW,{hl:0,sh:WKD,inner:wv});
  let cw='';for(let x=18;x<48;x+=3.4)cw+=b.jl(x,24,x+1,40,.3);
  b.sh([[16,41],[17,30],[23,21],[32,18.5],[41,21],[47,30],[48,41]],WK,{k:.15,sh:WKD,inner:b.st(cw,WKD,.7,.6)});
  b.sh([[16.5,33],[47.5,33],[48,39],[16,39]],C.pink,{k:.05,hatch:0,hl:0,lw:.8});
  b.sh([[44,36],[54,30],[55,40]],C.pinkD,{k:.1,hatch:0,hl:0,lw:.7});b.sh([[44,36],[52,46],[47,47]],C.pinkD,{k:.1,hatch:0,hl:0,lw:.7});
  b.sh(E(44,36,2.6,2.4,8),C.pink,{hatch:0,hl:0,lw:.7});
  tinyFlower(b,22,36,3.2,'#FFFFFF');
  b.ex('spark',8,12,4,'#FFE07A');b.ex('spark',57,12,3,'#FFE07A');
 },
 'Cowboy Hat'(b){
  const BR=C.brown,BD=mix(C.brown,INK,.25);
  b.sh([[2,30],[8,38],[20,43],[32,44],[44,43],[56,38],[62,30],[60,40],[50,49],[32,53],[14,49],[4,40]],BD,{k:.12,hl:0});
  b.sh([[15,41],[15,25],[19,13],[27,17],[32,13],[37,17],[45,13],[49,25],[49,41]],BR,{k:.15,sh:BD,det:[[[32,15],[32,24]]],dw:.8});
  b.sh([[15,34],[49,34],[49,41],[15,41]],mix(BR,INK,.5),{k:.04,hatch:0,hl:0,lw:.8});
  b.sh(starP(32,37.5,4.4,2),'#FFD56B',{hatch:0,hl:0,lw:.6,dr:.1});
  b.ln([[6,40],[20,46],[32,47],[44,46],[58,40]],{w:.8,col:INK,op:.5});
  b.ex('spark',58,12,3.6);b.ex('dots',6,14,4);
 },
 'Tutu'(b){
  // a flared tulle ring seen a little from above: back frill, the hole, front frills, satin waistband with a bow
  const ring=(rx,ry,cy,n,d)=>{const p=[];for(let i=0;i<n*4;i++){const a=i/(n*4)*Math.PI*2,f=1+d*Math.abs(Math.sin(a*n/2*2));p.push([32+Math.cos(a)*rx*f,cy+Math.sin(a)*ry*f])}return p};
  b.sh(ring(30,15,38,9,.07),C.rose,{k:.2,sh:mix(C.rose,INK,.3),hl:0});
  b.sh(ring(26,12,34,8,.07),C.pink,{k:.2,hatch:0,hl:0});
  b.sh(ring(21,9.6,31,7,.08),'#FFE3EC',{k:.2,hatch:0,inner:[[18,30],[26,37],[40,36],[46,30],[33,40]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1" fill="#fff"/>`).join('')});
  b.sh(E(32,28,12,5,16),C.pinkD,{hatch:0,hl:0,lw:.9});
  b.sh(E(32,27.4,9,3.4,14),'#FFF8EC',{hatch:0,hl:0,lw:.7,base:'#FFF8EC'});
  b.sh([[32,32],[24,27],[23,37]],C.pinkD,{k:.1,hatch:0,hl:0,lw:.7});b.sh([[32,32],[40,27],[41,37]],C.pinkD,{k:.1,hatch:0,hl:0,lw:.7});
  b.sh(E(32,32,2.6,2.4,8),C.pink,{hatch:0,hl:0,lw:.7});
  b.ex('spark',6,10,3.6);b.ex('spark',58,12,3,'#FFF0B8');
 },
 'Astronaut Helmet'(b){
  b.ln([[42,12],[46,3]],{w:1.3});b.sh(E(46.5,3,2.6,2.6,8),C.redD,{hatch:0,hl:0,lw:.6});
  b.sh(E(32,51,22,8,20),C.grey,{hl:0,sh:mix(C.grey,INK,.4),marks:[{pts:[[0,52],[64,52],[64,56],[0,56]],fill:mix(C.grey,INK,.15),k:0}]});
  b.sh(E(32,31,23,23,26),'#DCEFFC',{base:'#F2F9FE',op:.55,hatch:0,hl:0,lw:1.1,
   marks:[{pts:E(38,38,14,11,14),fill:'#EBDDF7',op:.6}]});
  b.sh(ribbon([[15,32],[17,22],[24,14],[33,11]],[3.4,3.4,3.4,2.6]),'#FFFFFF',{k:1/6,hatch:0,hl:0,noline:1,base:'#fff'});
  b.ex('glint',40,26,4);
  b.sh(RR(18,47,8,6,2),'#FFFBF3',{hatch:0,hl:0,lw:.6,base:'#fff'});crayonStar(b,22,50,2.2,C.redD);
  b.ex('spark',8,10,3.6);b.ex('spark',58,40,2.8,'#FFF0B8');b.dot(6,30,.9);b.dot(56,22,.8);
 },
 'Pyjamas'(b){
  const sh=garment(6);
  b.sh(sh,C.blue,{k:.05,sh:'#7F9FCB',marks:[14,22,30,38,46,54].map(x=>({pts:[[x,0],[x+3.4,0],[x+3.4,64],[x,64]],fill:'#FFFFFF',k:0,op:.9})),det:[[[32,22],[32.4,57]]],dw:.9});
  cuffs(b,'#9FBCE6');
  b.sh([[24,17],[32,24],[30,28],[21,22]],'#FFFFFF',{k:.05,hatch:0,hl:0,lw:.7,base:'#fff'});b.sh([[40,17],[32,24],[34,28],[43,22]],'#FFFFFF',{k:.05,hatch:0,hl:0,lw:.7,base:'#fff'});
  [31,39,47].forEach(y=>b.sh(E(34.6,y,1.7,1.7,8),'#FFE07A',{hatch:0,hl:0,lw:.5,dr:.1}));
  b.sh([[14,46],[24,46],[23.5,53],[14.5,53]],'#FFFFFF',{k:0,hatch:0,hl:0,lw:.6,base:'#fff'});
  b.sh([[36,12],[41,4],[49,1],[57,4],[61,12],[58,14],[55,8],[49,7],[46,13]],C.blue,{k:.15,hatch:0,hl:0,lw:.9,marks:[{pts:[[44,0],[48,0],[50,16],[46,16]],fill:'#FFFFFF',k:0},{pts:[[53,0],[57,0],[60,16],[56,16]],fill:'#FFFFFF',k:0}]});
  b.sh(RR(34,10,14,5,2.4),'#FFFFFF',{hatch:0,hl:0,lw:.7,base:'#fff'});
  b.sh(cloudP(59,17,3.4,3.4,6,.35,20),'#FFFFFF',{hatch:0,hl:0,lw:.6,base:'#fff'});
  b.tx(9,13,'z',9,{rot:-12});b.tx(15,7,'z',6.5,{rot:-12});
 }
});

/* ---------- toys (64) ---------- */
Object.assign(ITEMS,{
 'Snuffle Mat'(b){
  b.sh(rot(RR(4,18,56,40,10),-.06,32,38),'#96CDB5',{hl:0,hatch:0});
  b.sh(rot(RR(4,13,56,40,10),-.06,32,33),C.mint,{});
  const cols=['#B8DE9A','#B9D4F3','#FFE08A','#F7B2C4','#D3C6F1','#FFD0A8','#B9D4F3','#FFE08A','#B8DE9A'];
  [[16,22],[32,21],[48,20],[16,33],[32,32],[48,31],[16,44],[32,43],[48,42]].forEach(([x,y],i)=>{
   b.sh(cloudP(x,y,7.2,5.4,6,.32,26),cols[i],{hatch:0,hl:0,lw:.7,dr:.3,inner:b.st(b.jl(x-3,y+1,x,y-2,.2)+b.jl(x+1,y+2,x+3,y-1,.2),INK,.7,.5)});
   if(i===4||i===8){nugget(b,x-1,y-1.2,2.4,i);nugget(b,x+2.2,y+.6,2.1,i+1)}});
  b.raw(b.st('M50 6q4 -3 2 -6M56 9q4 -3 2 -6',C.lavD,1.4),'top');
  b.ex('spark',8,9,3.6);
 },
 'Treat Cone'(b){
  // a ribbed rubber chew cone, pumpkin smeared in the top, a kibble peeking out
  b.sh([[16,18],[48,18],[46,26],[49,30],[44,38],[46,44],[40,51],[41,56],[34,62],[30,62],[23,56],[24,51],[18,44],[20,38],[15,30],[18,26]],C.red,{k:.2,sh:C.redD,
   det:[[[19,29],[45,29]],[[21,42],[43,42]],[[25,53],[39,53]]],dw:.8,dcol:mix(C.redD,INK,.3)});
  b.sh(E(32,18,16,5.6,18),mix(C.redD,INK,.35),{hatch:0,hl:0,lw:.9});
  b.sh(cloudP(32,17,13,4.4,6,.3,30),PUMP,{hatch:0,hl:0,lw:.7,dr:.2,marks:[{pts:E(27,16,4,1.6,8),fill:'#FFC48A'}]});
  nugget(b,36,14,3.4,.6);
  paw(b,32,38,3,'#FFD0C8',{noline:1});
  b.raw(b.st('M6 14q-3 -3 0 -6M10 6q-3 -3 0 -6',C.pinkD,1.3),'top');
  b.ex('spark',57,10,3.6);b.ex('heart',55,50,3);
 },
 'Squeaky Hedgehog'(b){
  const spk=[];for(let i=0;i<=16;i++){const a=Math.PI*(1.02+i/16*.96),f=i%2?1.22:1;spk.push([30+Math.cos(a)*24*f,42+Math.sin(a)*20*f])}
  b.sh([[6,46],...spk,[54,44],[52,52],[40,55],[18,55],[8,52]],C.brown,{k:.05,sh:mix(C.brown,INK,.4),
   inner:b.st([[14,30],[22,24],[32,22],[40,26],[18,40],[28,34],[38,36]].map(([x,y])=>b.jl(x,y,x+2.4,y-3.6,.3)).join(''),mix(C.brown,INK,.45),1,.7)});
  b.sh([[38,34],[46,31],[54,34],[61,40],[60,44],[54,48],[44,50],[38,46]],'#FFE3C8',{k:.15,hatch:0,hl:0,lw:.9});
  b.sh(E(60.5,41.5,2.6,2.2,8),C.door,{hatch:0,hl:0,lw:.5,base:C.door});
  b.dot(48,38.5,1.6);b.dot(48.5,38,.5,'#fff','top');
  b.raw(`<ellipse cx="51" cy="44.5" rx="2.4" ry="1.4" fill="${PINK}" opacity=".6"/>`,'top');
  b.sh(E(18,55,4,2.4,8),'#FFE3C8',{hatch:0,hl:0,lw:.6});b.sh(E(36,55.5,4,2.4,8),'#FFE3C8',{hatch:0,hl:0,lw:.6});
  b.ln([[50,22],[54,16]],{w:1.2});b.ln([[56,26],[62,23]],{w:1.2});b.ln([[45,20],[46,13]],{w:1.2});
 },
 'Bubble Machine'(b){
  b.sh(RR(6,30,38,28,6),C.lav,{marks:[{pts:[[0,52],[64,52],[64,60],[0,60]],fill:C.lavD,k:0}]});
  b.sh(RR(11,37,28,11,2.4),'#FFFBF3',{hatch:0,hl:0,lw:.7,base:'#fff'});b.tx(25,45.6,'BUBBLES',7.4,{mid:1,col:'#B8536F'});
  b.sh(RR(32,22,9,10,2.6),C.pinkD,{hatch:0,hl:0,lw:.8});
  b.sh(E(36.5,19,7,6,14),'#FFFFFF',{hatch:0,hl:0,lw:.9,base:'#fff'});b.loop(E(36.5,19,4.4,3.6,12),{w:.8,op:.7});
  b.ln([[6,42],[2,36],[2,30]],{w:1.6});b.sh(E(2.6,28.5,2.4,3,8),C.redD,{hatch:0,hl:0,lw:.6});
  b.sh(E(14,58,3.4,2.6,8),C.door,{hatch:0,hl:0,lw:.5});b.sh(E(36,58,3.4,2.6,8),C.door,{hatch:0,hl:0,lw:.5});
  b.sh(RR(47,38,11,18,3),'#DCEFFC',{hatch:0,hl:0,lw:.8,base:'#F4FAFE',marks:[{pts:[[0,46],[64,46],[64,52],[0,52]],fill:C.pink,k:0}]});b.sh(RR(49,34,7,5,1.6),C.mint,{hatch:0,hl:0,lw:.6});
  bubble(b,50,15,6.4,{lw:.7});bubble(b,58,4.6,3.6,{lw:.6});bubble(b,44,6,3,{lw:.55});bubble(b,59,25,2.6,{lw:.5});
  b.ex('spark',12,14,3.4);
 },
 'Paddling Pool'(b){
  b.sh(E(32,44,29,13,24),POOL,{hl:0,hatch:0});
  b.sh(E(32,40,29,13,24),C.blue,{hl:0,marks:[{pts:E(32,41,22,8.4,20),fill:C.sky}],
   inner:b.st('M18 40q3 -2 6 0t6 0M34 43q3 -2 6 0t6 0M26 46q2 -1.4 4 0',`#fff`,1.2,.9)});
  b.loop(E(32,41,22,8.4,20),{w:.9,op:.75});
  b.sh([[38,36],[43,32.5],[48,34],[47,38],[42,39.5]],'#FFE07A',{k:.15,hatch:0,hl:0,lw:.7});b.sh(E(42,31,3,2.8,8),'#FFE07A',{hatch:0,hl:0,lw:.6});
  b.sh([[38.6,30.4],[35.6,31],[38.8,32]],'#F9A35E',{k:.1,hatch:0,hl:0,lw:.4});b.dot(41.6,30.2,.6);
  b.ln([[4,60],[5,54],[9,49],[14,45]],{w:4.4});b.ln([[4,60],[5,54],[9,49],[14,45]],{w:2.4,col:C.leafD});
  [[22,22,2.6],[28,16,2],[16,18,1.8],[34,20,1.6]].forEach(([x,y,s])=>b.sh(drop(x,y,s),'#8EC5EE',{hatch:0,hl:0,lw:.5,dr:.1}));
  b.ex('spark',56,14,4,'#E3F2FC');
 },
 'Agility Tunnel'(b){
  const path=[[14,40],[26,32],[41,30],[55,36]],tw=[25,23,21,19];
  const rp=ribbon(path,tw),marks=[];
  for(let i=0;i<7;i++){const x=12+i*7;marks.push({pts:[[x,0],[x+3.6,0],[x+3.6,64],[x,64]],fill:C.redD,k:0})}
  b.sh(rp,'#FFE07A',{k:1/6,marks,sh:'#B8892E',inner:b.st([15,22,29,36,43,50].map(x=>b.jl(x,20,x+1.4,50,.3)).join(''),INK,.8,.45)});
  b.sh(E(14,40.5,7,12.5,16,.1),'#FFE07A',{hatch:0,hl:0,lw:1});
  b.sh(E(15,40.5,4.6,9.6,14,.1),C.door,{hatch:0,hl:0,lw:.7,base:'#7A5E52'});
  b.sh(E(55,36.5,3,9,12,-.1),mix(C.redD,INK,.25),{hatch:0,hl:0,lw:.8});
  [[36,52,-.15],[46,55,-.1],[24,54,-.2]].forEach(([x,y,a])=>paw(b,x,y,1.7,'#C9B6A0',{a,noline:1}));
  b.ln([[2,22],[8,24]],{w:1.2,col:GRAPH});b.ln([[1,28],[6,29]],{w:1.2,col:GRAPH});
  b.ex('spark',58,14,3.6);
 }
});

/* ---------- foods (64) ---------- */
Object.assign(ITEMS,{
 'Carrot Sticks'(b){
  [[20,-.3,7],[27,-.12,3],[34,.05,5],[41,.22,8],[30,.32,10]].forEach(([x,a,yt])=>
   b.sh(rot(RR(x-3,yt,6,34,2.6),a,x,40),ORNG,{hatch:0,hl:0,lw:.75,base:'#F9BE86',det:[rot([[x-1.6,yt+8],[x+.8,yt+8.6]],a,x,40),rot([[x-1.6,yt+16],[x+1,yt+16.6]],a,x,40)],dw:.6,dcol:'#C96E2A'}));
  b.sh([[14,32],[50,32],[46,58],[18,58]],C.mint,{k:.06,marks:[{pts:[[0,32],[64,32],[64,37],[0,37]],fill:'#96CDB5',k:0}]});
  b.sh(heartP(32,47,9),'#FFFFFF',{hatch:0,hl:0,lw:.6});
  b.sh(leafP(48,24,9,4,-.9),LEAF,{hatch:0,hl:0,lw:.6});
  b.ex('spark',56,10,3.6);b.ex('dots',6,22,4);
 },
 'Apple Slices'(b){
  plateV(b,32,48,29,10,C.pink,'#FFFFFF');
  // three crescent wedges, red skin on the curved back, pale flesh, cored flat edge (no pips)
  const wedge=(cx,cy,R,a)=>{const out=[],inn=[];for(let i=0;i<=10;i++){const t=-Math.PI*.5+Math.PI*i/10;out.push([cx+Math.cos(t)*R,cy+Math.sin(t)*R])}
    for(let i=10;i>=0;i--){const t=-Math.PI*.5+Math.PI*i/10;inn.push([cx-R*.35+Math.cos(t)*R*.25,cy+Math.sin(t)*R*.96])}
    const skin=[];for(let i=10;i>=0;i--){const t=-Math.PI*.5+Math.PI*i/10;skin.push([cx+Math.cos(t)*R*.8,cy+Math.sin(t)*R*.86])}
    b.sh(rot(out.concat(inn),a,cx,cy),'#FFE9B0',{k:.15,hl:0,lw:.9,base:'#FFF4D6',sh:'#D9B77E',ho:.4,marks:[{pts:rot(out.concat(skin),a,cx,cy),fill:C.redD}]})};
  wedge(16,40,12,-.5);wedge(28,36,13,-.1);wedge(40,40,12,.35);
  b.ln([[48,14],[49,8]],{w:1.6,col:'#8E6446'});b.sh(leafP(49,10,10,5,-.5),LEAF,{hatch:0,hl:0,lw:.7,det:[[[49,10],[57,6]]],dw:.6});
  b.ex('spark',8,12,3.6);b.ex('heart',57,30,2.6);
 },
 'Blueberry Bites'(b){
  bowl(b,32,38,26,7,18,C.blue,'#8FB8E8',()=>{
   b.sh(cloudP(32,34,20,8,7,.3,40),'#C9CFF2',{noline:1,hatch:0,hl:0});
   [[17,36],[25,35],[33,36],[41,35],[48,37],[21,30],[29,29],[37,29],[45,31],[25,24],[33,23],[41,25],[33,17]].forEach(([x,y])=>berryV(b,x,y,4.2))});
  berryV(b,8,56,3.4);berryV(b,56,57,3);
  b.sh(leafP(38,14,10,5,-.6),LEAF,{hatch:0,hl:0,lw:.6});
  b.ex('spark',56,10,3.6);
 },
 'Seedless Watermelon Cubes'(b){
  plateV(b,32,46,29,11,C.mint,'#FFFFFF');
  const T='#FCC6D2',F=C.rose,S=mix(C.rose,C.redD,.5);
  [[10,40],[24,42],[38,40],[17,30],[31,31],[44,31],[24,20]].forEach(([x,y])=>cubeV(b,x,y,6.6,T,F,S));
  b.ln([[31,22],[36,4]],{w:1.3,col:'#C58F5E'});b.sh([[36,4],[45,6],[36,10]],C.mint,{k:.05,hatch:0,hl:0,lw:.6});
  b.ex('spark',56,14,3.6);b.ex('dots',6,14,4);
 },
 'Sweet Potato Chews'(b){
  [[20,-.35,'#C97E68'],[28,-.08,'#B96B52'],[36,.18,'#D98E6E'],[43,.4,'#C97E68']].forEach(([x,a,c])=>
   b.sh(rot([[x-3,8],[x+3,7],[x+3.6,30],[x-2.6,31]],a,x,30),c,{k:.2,hatch:0,hl:0,lw:.75,det:[rot([[x-1,12],[x+1,20]],a,x,30)],dw:.6,dcol:'#8E5A44'}));
  b.sh([[13,22],[51,22],[53,40],[54,56],[49,59],[15,59],[10,56],[11,40]],'#F2C2B4',{k:.12,sh:'#C9907E',det:[[[16,25],[14,56]],[[48,25],[50,56]]],dw:.9});
  b.sh([[12,22],[52,22],[52,27],[12,27]],'#E8A99A',{k:0,hatch:0,hl:0,lw:.8});
  b.sh(RR(16,32,32,22,4),'#FFF8EC',{hatch:0,hl:0,lw:.75});
  b.tx(32,42,'CHEWS',9,{mid:1});
  sweetV(b,32,48,.32,-.1);
  b.ex('heart',53,13,2.6);b.ex('spark',6,12,3.4);
 },
 'Pumpkin Purée'(b){
  b.sh(RR(12,18,34,40,9),'#E8F4FB',{hatch:0,hl:0,lw:1,base:'#F7FBFE'});
  b.sh([[13,30],[24,28],[36,30],[45,28],[45,48],[41,57],[17,57],[13,48]],PUMP,{k:.12,hatch:0,hl:0,noline:1,base:'#FBC28A'});
  b.sh(RR(14,10,30,10,3),C.leafD,{hatch:0,hl:0,lw:.9,inner:b.st([18,23,28,33,38].map(x=>`M${x} 11V19`).join(''),INK,.8,.4)});
  b.sh(RR(16,35,26,15,2),'#FFF8EC',{hatch:0,hl:0,lw:.7});
  pumpkinV(b,29,43,.3,{noleaf:1});
  b.ln([[15,26],[15,40]],{w:2.2,col:'#fff',op:.9});
  b.ln([[61,40],[52,56]],{w:2.6,col:C.grey});b.sh(E(50,58,7,4,12,-.4),C.grey,{hatch:0,hl:0,lw:.8});b.sh(E(50,57.4,4.6,2.4,10,-.4),PUMP,{hatch:0,hl:0,lw:.5,dr:.1});
  b.ex('spark',56,10,3.6);b.ex('heart',6,14,2.6);
 },
 'Turkey Meatballs'(b){
  b.ln([[24,16],[22,12],[25,8],[23,3]],{col:GRAPH,w:1.3});b.ln([[40,15],[42,11],[39,7],[41,2]],{col:GRAPH,w:1.3});
  bowl(b,32,37,26,6.5,17,C.lav,'#B9A6E8',()=>{
   b.sh(cloudP(32,33,20,8,7,.25,40),'#E8B48A',{noline:1,hatch:0,hl:0});
   [[16,35,5],[26,35.5,5.4],[37,35.5,5.4],[47,35,5],[21,28,5.2],[32,27.5,5.6],[43,28,5.2]].forEach(([x,y,r])=>{
    b.sh(E(x,y,r,r*.9,14),'#C9895B',{hatch:0,hl:0,lw:.75,base:'#D9A27A',marks:[{pts:E(x-r*.3,y-r*.35,r*.42,r*.26,8),fill:'#E6B48C'}]});
    b.dot(x+r*.25,y+r*.2,.6,'#8E5A44')});
  });
  b.ex('spark',57,12,3.6);b.ex('heart',7,24,2.6);
 },
 'Frozen Pupsicle'(b){
  b.sh(RR(29,44,6,18,3),'#E9C9A0',{hatch:0,hl:0,lw:.8});
  b.sh(E(32,35,15,13,20),'#FFF8EC',{base:'#FFFFFF',sh:'#B9C3D6',ho:.35,marks:[{pts:[[14,30],[50,26],[50,32],[14,36]],fill:'#F7B2C4',k:.3,op:.85},{pts:[[14,40],[50,37],[50,41],[14,44]],fill:'#F7B2C4',k:.3,op:.7}]});
  [[17,18,5.6],[27,12,6],[38,12,6],[48,18,5.6]].forEach(([x,y,r])=>b.sh(E(x,y,r,r*1.1,12),'#FFF8EC',{hatch:0,base:'#FFFFFF',lw:.9,marks:[{pts:E(x,y+r*.4,r*.8,r*.4,10),fill:'#F7B2C4',op:.7}]}));
  [[25,32],[38,30],[31,40],[40,40]].forEach(([x,y])=>berryV(b,x,y,2.2));
  b.sh(drop(43,49,2.4),'#FFF8EC',{hatch:0,hl:0,lw:.5,dr:.1});
  flake(b,7,32,3.4,'#8FB4D4',1.2);flake(b,57,34,3,'#8FB4D4',1.2);
  b.ex('spark',56,8,4,'#E3F2FC');b.ex('spark',8,52,2.8,'#E3F2FC');
 },
});

/* ---------- houses (240x200, ground y=190, door centred on x=120) ---------- */
Object.assign(HOUSES,{
 'Little Tea House'(b){
  ground(b,98);
  b.ln([[155,21],[160,13],[156,5]],{w:1.5,col:GRAPH});b.ln([[165,22],[170,15],[166,8],[169,2]],{w:1.3,col:GRAPH});
  b.sh([[52,100],[188,100],[188,190],[52,190]],'#FFF2DA',{k:0,hl:0,
   marks:[{pts:[[46,172],[194,172],[194,195],[46,195]],fill:C.wood,k:0}],
   inner:b.st([66,80,160,174].map(x=>b.jl(x,104,x,170,.6)).join('')+b.jl(52,172,188,172,.5)+[60,76,92,148,164,180].map(x=>b.jl(x,172,x,190,.3)).join(''),INK,.9,.4)});
  b.sh(arch(92,148,190,120),C.wood,{hatch:0,hl:0,lw:.9});
  b.sh(arch(99,141,190,128),C.door,DOOR_O);
  // split door curtain at the top of the doorway (never over the sleeping spot)
  [[104,'#F7B2C4'],[120,'#FFFBF3'],[136,'#F7B2C4']].forEach(([x,c],i)=>b.sh([[x-8,128-(i===1?2:0)],[x+8,128-(i===1?2:0)],[x+8,140],[x-8,141]],c,{k:.05,hatch:0,hl:0,lw:.8}));
  b.sh(heartP(120,134,7),C.pinkD,{hatch:0,hl:0,lw:.5});
  // round window + teacup shelf
  b.sh(E(74,136,14,14,20),'#FFFFFF',{hatch:0,hl:0});
  b.sh(E(74,136,10,10,18),'#CFE8FA',{hatch:0,hl:0,lw:.8,det:[[[74,126.5],[74,145.5]],[[64.5,136],[83.5,136]]],dw:1});
  b.ex('glint',69,133,5);
  b.sh([[154,150],[184,150],[184,155],[154,155]],C.woodD,{k:0,hatch:0,hl:0,lw:.8});
  [[162,C.mint],[177,C.pink]].forEach(([x,c])=>{b.sh([[x-6,140],[x+6,140],[x+4.6,150],[x-4.6,150]],c,{k:.1,hatch:0,hl:0,lw:.8});b.ln([[x+6,142],[x+9,144],[x+5,147]],{w:1})});
  b.ln([[162,137],[161,132],[163,128]],{w:1,col:GRAPH});
  // the roof: gently curved eaves
  b.sh([[18,104],[30,100],[66,84],[120,58],[174,84],[210,100],[222,104],[214,116],[198,113],[166,100],[120,80],[74,100],[42,113],[26,116]],C.teal,{k:.12,
   inner:b.st(shingles(b,[120,58],[218,103],4,6,9)+shingles(b,[120,58],[22,103],4,6,9),INK,.85,.5)});
  b.sh(E(22,112,5,5,10),C.pinkD,{hatch:0,hl:0,lw:.7});b.sh(E(218,112,5,5,10),C.pinkD,{hatch:0,hl:0,lw:.7});
  b.sh(RR(98,102,44,15,3),C.cream,{hatch:0,hl:0,lw:.9});b.tx(120,114,'Tea',13,{mid:1});
  // the teapot on the ridge
  b.raw('<g transform="translate(0 -9)">');
  b.ln([[100,48],[93,44],[92,54],[100,58]],{w:4.6});b.ln([[100,48],[93,44],[92,54],[100,58]],{w:2.4,col:C.pinkD});
  b.sh([[136,52],[150,38],[156,35],[157,39],[145,58]],C.pink,{k:.12,hatch:0,hl:0,lw:.9});
  b.sh(E(120,53,22,16,22),C.pink,{marks:[{pts:[[96,56],[144,56],[144,60],[96,60]],fill:'#FFFBF3',k:0,op:.8}]});
  b.sh(heartP(120,51,9),'#FFFBF3',{hatch:0,hl:0,lw:.5});
  b.sh(E(120,38,12,4,14),C.pinkD,{hatch:0,hl:0,lw:.8});b.sh(E(120,33,4,3.6,10),'#FFE07A',{hatch:0,hl:0,lw:.7});
  b.raw('</g>');
  // tea-bag bunting
  b.ln([[40,114],[48,124],[60,128]],{w:.9,col:GRAPH});b.ln([[180,128],[192,124],[200,114]],{w:.9,col:GRAPH});
  [[46,121],[57,127],[184,127],[195,121]].forEach(([x,y],i)=>{b.ln([[x,y],[x,y+8]],{w:.7,col:GRAPH});b.sh(RR(x-3.6,y+8,7.2,8,1.4),i%2?'#FFE07A':C.mint,{hatch:0,hl:0,lw:.6,dr:.2})});
  b.ex('spark',26,70,6);b.ex('heart',208,72,5);b.ex('note',30,140,8);
  tuft(b,48,190,3.6);tuft(b,194,190,3.2);
 },
 'Beach Hut'(b){
  ground(b,104);
  b.sh([[14,193],[30,182],[66,178],[120,180],[176,177],[212,182],[228,193]],'#F6DCA8',{k:.15,hl:0,sh:'#C9A46A',ho:.4,under:1,
   inner:[[40,186],[70,184],[180,184],[206,188],[150,187],[96,186]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1" fill="#B8935A" opacity=".6"/>`).join('')});
  const stripes=[];for(let x=70;x<176;x+=16)stripes.push({pts:[[x,40],[x+8,40],[x+8,200],[x,200]],fill:'#FFFFFF',k:0,op:.9});
  b.sh([[66,96],[174,96],[174,190],[66,190]],C.sky,{k:0,hl:0,marks:stripes});
  b.sh(arch(94,146,190,122),'#FFFFFF',{hatch:0,hl:0,lw:.9,base:'#fff'});
  b.sh(arch(100,140,190,128),C.door,DOOR_O);
  // the striped door, swung open
  b.sh([[70,124],[92,128],[92,190],[70,186]],C.pink,{k:0,hl:0,lw:.9,marks:[0,1,2,3,4].map(i=>({pts:[[60,130+i*12],[100,134+i*12],[100,140+i*12],[60,136+i*12]],fill:'#FFFFFF',k:0}))});
  b.dot(88,158,1.6,'#FFE07A');
  b.sh([[52,100],[120,40],[188,100],[180,106],[120,54],[60,106]],C.red,{k:0,inner:b.st(shingles(b,[120,40],[188,100],2,6,9)+shingles(b,[120,40],[52,100],2,6,9),INK,.85,.5)});
  b.sh([[60,104],[180,104],[180,110],[60,110]],'#FFFFFF',{k:0,hatch:0,hl:0,lw:.8,inner:b.st(waveD(62,107,116,1.4,20),C.sky,1.4,1)});
  b.sh(E(120,78,10,10,16),'#FFFFFF',{hatch:0,hl:0,lw:.9});b.sh(E(120,78,6.6,6.6,14),'#CFE8FA',{hatch:0,hl:0,lw:.7,det:[[[113.6,78],[126.4,78]]],dw:.8});
  b.ln([[120,40],[120,18]],{w:1.4});b.sh([[120,18],[138,22],[120,27]],'#FFE07A',{k:.05,hatch:0,hl:0,lw:.8});
  // surfboard
  b.sh(E(198,134,11,50,24,.16),C.teal,{marks:[{pts:rot([[193,80],[198,80],[198,190],[193,190]],.16,198,134),fill:'#FFE07A',k:0}],sh:'#5FA7A0'});
  b.sh(rot([[196,170],[204,176],[198,180]],.16,198,134),C.teal,{k:.1,hatch:0,hl:0,lw:.7});
  // starfish + shell
  b.sh(starP(38,184,8,3.8,5,-1.3),C.orange,{k:.15,hatch:0,hl:0,lw:.8,inner:[[38,184]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1" fill="#fff"/>`).join('')});
  b.sh(shellP(222,188,6).concat([[228,190],[216,190]]),C.pink,{k:.1,hatch:0,hl:0,lw:.7});
  b.ex('spark',28,64,6);b.ex('spark',214,40,5);b.ex('heart',34,110,4.6);
 },
 'Camper Van'(b){
  ground(b,112);
  b.sh([[62,72],[72,50],[170,50],[180,72]],C.peach,{k:.05,hl:0,det:[[[76,56],[166,56]]],dw:.7});
  b.sh(RR(80,38,30,14,3),'#E7A58C',{hatch:0,hl:0,lw:.9,det:[[[95,38],[95,52]]],dw:.7});
  b.sh(RR(14,70,212,120,24),C.mint,{hl:0,sh:'#5FA7A0',
   marks:[{pts:[[0,60],[240,60],[240,112],[0,112]],fill:'#FFF2DA',k:0},{pts:[[0,112],[240,112],[240,118],[0,118]],fill:C.teal,k:0}],
   inner:b.st(waveD(16,115,208,1.6,26),'#fff',1.3,.9)});
  // painted-on wheels (flat paint, little drips, no shadow under them)
  [[56,168],[184,168]].forEach(([x,y])=>{
   b.sh(E(x,y,18,18,22),C.door,{hatch:0,hl:0,lw:.9,base:'#6E544A',dr:.6,marks:[{pts:E(x,y,8,8,14),fill:C.grey}]});
   b.raw(b.st(`M${x-11} ${y-6}q6 -6 14 -4M${x-12} ${y+4}q9 7 20 2`,'#8A6A5C',2.2,.7));
   b.raw(b.st(`M${x-6} ${y+17}q1 5 0 8`,C.door,2.2),'top');b.dot(x-6,y+26,1.4,C.door,'top')});
  // windows
  b.sh(RR(26,82,40,28,7),'#CFE8FA',{hatch:0,hl:0,lw:1,marks:[{pts:[[24,80],[34,80],[33,112],[24,112]],fill:C.pink,op:.85},{pts:[[58,80],[68,80],[68,112],[59,112]],fill:C.pink,op:.85}]});
  b.sh([[180,80],[208,80],[218,96],[218,110],[180,110]],'#CFE8FA',{k:.08,hatch:0,hl:0,lw:1});b.ex('glint',196,94,7);
  b.sh(E(218,140,5,6,10),'#FFE07A',{hatch:0,hl:0,lw:.8});
  b.sh(RR(206,176,26,8,3),C.grey,{hatch:0,hl:0,lw:.8});
  // the door
  b.sh(arch(94,146,190,118),'#FFF2DA',{hatch:0,hl:0,lw:.9});
  b.sh(arch(100,140,190,124),C.door,DOOR_O);
  // stickers
  b.sh(E(158,92,9,9,14),C.yel,{hatch:0,hl:0,lw:.7});paw(b,158,93.5,2.6,C.orange,{noline:1});
  b.sh(heartP(78,136,12),C.pinkD,{hatch:0,hl:0,lw:.6});crayonStar(b,162,136,6,'#FFE07A');
  b.ex('spark',22,40,6);b.ex('note',212,52,8);b.ex('dots',196,134,6);
  // the paint pot that did the wheels
  b.ln([[12,172],[4,150]],{w:3.4,col:C.woodD});b.sh([[1,146],[7,144],[9,152],[3,154]],C.door,{k:.1,hatch:0,hl:0,lw:.6});
  b.sh(RR(2,170,22,22,3),C.grey,{hatch:0,hl:0,lw:.9,marks:[{pts:[[0,168],[26,168],[26,176],[18,177],[17,183],[14,177],[0,176]],fill:C.door,k:.1}]});
  tuft(b,226,190,3);
 },
 'Pumpkin Cottage'(b){
  ground(b,108);
  b.ln([[150,30],[146,22],[152,16],[147,8]],{w:1.4,col:GRAPH});b.ln([[160,36],[164,28],[159,22],[163,14]],{w:1.2,col:GRAPH});
  [[-78,30,'#F29150'],[78,30,'#F29150'],[-46,36,PUMP],[46,36,PUMP],[0,42,'#FBB06A']].forEach(([dx,rx,c])=>
   b.sh(E(120+dx,136,rx,55,24),c,{hl:0,sh:'#C96E2A',ho:.4,
    inner:b.st(b.jl(120+dx-rx*.45,98,120+dx-rx*.5,176,.6)+b.jl(120+dx+rx*.45,98,120+dx+rx*.5,176,.6),'#C96E2A',1,.45)}));
  // the leaf roof
  b.sh([[22,124],[26,104],[44,86],[78,74],[120,68],[162,72],[198,84],[216,100],[214,112],[202,104],[188,110],[172,100],[154,108],[136,100],[118,108],[100,100],[82,108],[66,100],[50,108],[38,104],[30,114]],C.leaf,{k:.14,sh:LEAFD,ho:.55,
   inner:b.st(b.jl(30,112,120,80,.6)+b.jl(120,80,210,100,.6)+[[52,98,46,84],[76,90,72,76],[100,84,98,72],[144,84,146,72],[168,90,172,78],[192,96,198,86]].map(([x,y,u,v])=>b.jl(x,y,u,v,.4)).join(''),LEAFD,1.3,.85)});
  b.ln([[204,96],[214,110],[208,122],[214,128]],{w:1.2,col:'#6FA35A'});
  b.sh(ribbon([[118,82],[120,66],[126,52],[136,42]],[13,11,9,8]),'#8E8A4A',{k:1/6,hl:0,sh:'#5E5A2A',det:[[[116,74],[121,58]]],dw:.8});
  b.sh(E(136.6,41.4,4.6,3.6,10,-.6),'#A8A464',{hatch:0,hl:0,lw:.8});
  b.ln([[128,64],[140,66],[146,60],[142,54],[137,58]],{w:1.4,col:'#6FA35A'});
  b.sh(arch(94,146,190,118),'#FFD9A0',{hatch:0,hl:0,lw:.9,inner:b.st(b.jl(96,140,102,136,.3)+b.jl(144,140,138,136,.3)+b.jl(120,118,120,124,.3),INK,.9,.5)});
  b.sh(arch(100,140,190,125),C.door,DOOR_O);
  [[62,138],[178,138]].forEach(([x,y])=>{b.sh(E(x,y,13,13,18),'#FFD9A0',{hatch:0,hl:0});b.sh(E(x,y,9,9,16),'#FFE59A',{hatch:0,hl:0,lw:.8,det:[[[x,y-8.5],[x,y+8.5]],[[x-8.5,y],[x+8.5,y]]],dw:.9})});
  b.sh([[96,186],[144,186],[148,192],[92,192]],C.green,{k:0,hatch:0,hl:0,lw:.8});
  pumpkinV(b,30,180,.42,{noleaf:1});pumpkinV(b,206,182,.34,{noleaf:1});
  b.sh(heartP(120,111,9),C.pinkD,{lw:.5,hl:0,hatch:0});
  b.ex('spark',24,60,6);b.ex('heart',206,54,5);
  tuft(b,52,190,3.4);tuft(b,188,190,3);
 },
 'Lighthouse Kennel'(b){
  ground(b,100);
  b.raw(`<g class="pa-wb-glow"><path d="M120 31Q70 24 22 24Q18 30 22 36Q70 36 120 37Z" fill="#FFF3C2" opacity=".45"/><path d="M120 31Q60 26 30 26Q28 30 30 34Q60 35 120 37Z" fill="#FFF3C2" opacity=".5"/><path d="M120 31Q170 24 218 24Q222 30 218 36Q170 36 120 37Z" fill="#FFF3C2" opacity=".45"/><path d="M120 31Q180 26 210 26Q212 30 210 34Q180 35 120 37Z" fill="#FFF3C2" opacity=".5"/><circle cx="120" cy="34" r="32" fill="#FFE59A" opacity=".14"/><circle cx="120" cy="34" r="24" fill="#FFE59A" opacity=".18"/><circle cx="120" cy="34" r="18" fill="#FFF3C2" opacity=".35"/></g>`,'under');
  const lx=y=>[78+(190-y)*16/136,162-(190-y)*16/136];
  const band=(y0,y1)=>{const [a0,b0]=lx(y0),[a1,b1]=lx(y1);return {pts:[[a0-4,y0],[b0+4,y0],[b1+4,y1],[a1-4,y1]],fill:C.red,k:0}};
  b.sh([[78,190],[94,54],[146,54],[162,190]],'#FFFBF3',{k:0,hl:0,base:'#FFFFFF',marks:[band(54,76),band(100,124),band(148,172)]});
  b.sh(arch(94,146,190,122),C.stone,{hatch:0,hl:0,lw:.9});
  b.sh(arch(100,140,190,129),C.door,DOOR_O);
  b.sh(E(120,88,8,8,14),'#FFFFFF',{hatch:0,hl:0,lw:.9});b.sh(E(120,88,5,5,12),'#CFE8FA',{hatch:0,hl:0,lw:.6});
  // life ring
  b.sh(E(148,160,9,9,16),'#FFFFFF',{hatch:0,hl:0,lw:.9,marks:[{pts:[[140,152],[148,152],[148,160],[140,160]],fill:C.redD,k:0},{pts:[[148,160],[158,160],[158,170],[148,170]],fill:C.redD,k:0}]});
  b.sh(E(148,160,4,4,10),C.red,{hatch:0,hl:0,lw:.7,base:'#F7E8E0'});
  // gallery, lamp room, roof
  b.sh(RR(82,48,76,8,2),C.grey,{hatch:0,hl:0,lw:.9});
  b.ln([[84,48],[84,40],[156,40],[156,48]],{w:1.3});[96,108,120,132,144].forEach(x=>b.ln([[x,48],[x,41]],{w:1}));
  b.sh([[98,48],[98,22],[142,22],[142,48]],'#CFE8FA',{k:0,hatch:0,hl:0,lw:1,det:[[[112,22],[112,48]],[[128,22],[128,48]]],dw:.9});
  b.sh(E(120,34,8,8,14),'#FFE07A',{hatch:0,hl:0,lw:.8,base:'#FFF3C2'});
  b.sh([[90,24],[120,8],[150,24]],C.red,{k:.04,hatch:0,hl:0});b.sh(E(120,8,3.6,3.6,10),C.gold,{hatch:0,hl:0,lw:.7});
  // rocks
  [[54,184,18,10],[72,188,10,6],[184,184,16,10],[200,188,10,6]].forEach(([x,y,rx,ry])=>b.sh(flatBlob(x,y,rx,ry,hashS('lr'+x)),C.stone,{hatch:0,hl:0,lw:.8,sh:GRAPH}));
  b.sh(cloudP(58,176,7,4,5,.3,20),C.leaf,{hatch:0,hl:0,lw:.6});
  b.ex('spark',32,96,6);b.ex('spark',212,98,5);b.ex('heart',200,140,4.6);
 },
 'Rocket Ship'(b){
  ground(b,100);
  b.raw('<path d="M30 30h.1M206 22h.1M214 120h.1M24 128h.1" stroke="#5B3D32" stroke-width="3" stroke-linecap="round"/>');
  b.sh(crescent(204,62,13),'#FFE59A',{hatch:0,hl:0,lw:.8});
  const body=[[120,8],[138,22],[154,46],[164,80],[168,120],[168,190],[72,190],[72,120],[76,80],[86,46],[102,22]];
  b.sh(body,'#EEF0F4',{k:.1,hl:0,sh:'#9FA8BC',marks:[{pts:[[60,0],[180,0],[180,46],[60,46]],fill:C.red,k:0},{pts:[[60,166],[180,166],[180,173],[60,173]],fill:C.red,k:0,op:.9}],
   inner:b.st(b.jl(78,100,162,100,.4),INK,.9,.45)+[[86,60],[154,60],[80,104],[160,104],[80,146],[160,146]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.2" fill="${INK}" opacity=".5"/>`).join('')});
  b.sh([[72,130],[44,166],[40,190],[72,190]],C.red,{k:.08,hl:0});b.sh([[168,130],[196,166],[200,190],[168,190]],C.red,{k:.08,hl:0});
  b.sh(E(120,74,17,17,22),C.grey,{hatch:0,hl:0});b.sh(E(120,74,12,12,18),'#CFE8FA',{hatch:0,hl:0,lw:.8});
  paw(b,120,76,3.4,'#FFFFFF',{noline:1});b.ex('glint',114,70,5);
  b.sh(arch(96,144,190,124),C.grey,{hatch:0,hl:0,lw:.9});
  b.sh(arch(101,139,190,131),C.door,DOOR_O);
  b.tx(87,118,'10 9 8 7 6 5 4 3 2 1',10,{rot:-90,col:C.redD,mid:1});
  b.sh(rot(RR(142,110,34,20,2),.08,159,120),'#FFFBF3',{k:0,hatch:0,hl:0,lw:.7,base:'#FFFBF3'});
  b.tx(159,125,'nap time',9.5,{rot:5,mid:1});
  tapeB(b,150,110,12,-30,'#F7B9C6');
  b.tx(196,40,'z',14,{rot:-10});b.tx(206,28,'z',10,{rot:-10});
  crayonStar(b,40,60,6,'#FFE07A');crayonStar(b,190,104,4,'#FFF0B8');
  b.ex('spark',34,100,5);b.ex('heart',212,150,4.6);
 }
});

/* ---------- house cards (64): the new houses as small taped cards ----------
   v2.5: each card is its own bold drawing (thick outline, big shapes, few details) so it reads at the 40 px shop scale. */
const HOUSES24=['Little Tea House','Beach Hut','Camper Van','Pumpkin Cottage','Lighthouse Kennel','Rocket Ship'];
const HB={lw:1.2,hatch:0,hl:0};
const hbo=o=>Object.assign({},HB,o);
const HDOOR=(b,x0,x1,yb,yt)=>{const c=(x0+x1)/2,h=(x1-x0)*.4;x0=c-h;x1=c+h;yt+=2;b.sh(arch(x0-2,x1+2,yb,yt-2),'#FFF2DA',hbo({lw:.9}));b.sh(arch(x0,x1,yb,yt),C.door,hbo({base:'#6E544A',lw:.9}))};
const HCARD={
 'Little Tea House'(b){
  b.sh([[15,31],[49,31],[49,53],[15,53]],'#FFF2DA',hbo({k:0,hatch:1,sh:'#C9A46A'}));
  HDOOR(b,27,37,53,39);
  b.sh(E(20.6,41,3.6,3.6,10),'#CFE8FA',hbo({lw:1.1}));
  b.sh([[7,35],[20,26],[32,20],[44,26],[57,35],[52,38],[32,27],[12,38]],C.teal,hbo({k:.14}));
  b.ln([[33,15],[29,13],[28,18],[31,20]],{w:2.2,col:C.pinkD});
  b.sh(E(36,17,6.6,5,14),C.pink,hbo({lw:1.3}));b.sh(E(36,11.6,2,1.6,8),'#FFE07A',hbo({lw:.9}));
  b.ln([[42,16],[46,12]],{w:2.6,col:C.pinkD});
 },
 'Beach Hut'(b){
  b.sh([[15,31],[49,31],[49,53],[15,53]],C.sky,hbo({k:0,marks:[[17,23],[41,47]].map(([a,c])=>({pts:[[a,28],[c,28],[c,56],[a,56]],fill:'#FFFFFF',k:0}))}));
  HDOOR(b,27,37,53,39);
  b.sh([[10,34],[32,15],[54,34],[50,37],[32,21],[14,37]],C.red,hbo({k:.02}));
  b.ln([[32,16],[32,9]],{w:1.6});b.sh([[32,8],[40,10.4],[32,13]],'#FFE07A',hbo({k:.05,lw:1}));
  b.sh(E(52,44,3.6,10,14,.15),C.teal,hbo({lw:1.2,marks:[{pts:rot([[50.6,30],[53.4,30],[53.4,58],[50.6,58]],.15,52,44),fill:'#FFE07A',k:0}]}));
 },
 'Camper Van'(b){
  b.sh(RR(8,24,48,25,8),C.mint,hbo({marks:[{pts:[[0,20],[64,20],[64,33],[0,33]],fill:'#FFF2DA',k:0}]}));
  b.sh(RR(12,27,13,8,3),'#CFE8FA',hbo({lw:1.1}));b.sh([[42,27],[50,27],[53,33],[42,33]],'#CFE8FA',hbo({k:.05,lw:1.1}));
  HDOOR(b,28,37,49,34);
  [[18,49],[46,49]].forEach(([x,y])=>{b.sh(E(x,y,5,5,12),C.door,hbo({base:'#6E544A',lw:.9,marks:[{pts:E(x,y,2.2,2.2,8),fill:C.grey}]}))});
  b.sh(heartP(46,40,6),C.pinkD,hbo({lw:.8}));
 },
 'Pumpkin Cottage'(b){
  [[-14,10,'#F29150'],[14,10,'#F29150'],[0,13,PUMP]].forEach(([dx,rx,c])=>b.sh(E(32+dx,40,rx,14,16),c,hbo({sh:'#C96E2A'})));
  b.sh([[9,34],[14,27],[24,22.6],[32,22],[40,22.6],[50,27],[55,34],[47,32],[40,34],[32,32],[24,34],[17,32]],C.leaf,hbo({k:.2}));
  b.sh(ribbon([[32,22],[33,15],[37,11]],[5.4,4.4,3.4]),'#8E8A4A',hbo({k:1/6,lw:1.1}));
  HDOOR(b,27,37,54,41);
  b.sh(E(18.6,43,3.4,3.4,10),'#FFE59A',hbo({lw:1.1}));b.sh(E(45.4,43,3.4,3.4,10),'#FFE59A',hbo({lw:1.1}));
 },
 'Lighthouse Kennel'(b){
  b.raw('<path d="M32 15L6 11V19ZM32 15L58 11V19Z" fill="#FFF3C2" opacity=".75"/>','under');
  const lx=y=>[22+(54-y)*5/32,42-(54-y)*5/32];
  const band=(y0,y1)=>{const [a0,b0]=lx(y0),[a1,b1]=lx(y1);return {pts:[[a0-3,y0],[b0+3,y0],[b1+3,y1],[a1-3,y1]],fill:C.red,k:0}};
  b.sh([[22,54],[27,22],[37,22],[42,54]],'#FFFBF3',hbo({k:0,base:'#FFFFFF',marks:[band(26,32),band(40,46)]}));
  HDOOR(b,28,36,54,44);
  b.sh([[25.6,22],[25.6,13],[38.4,13],[38.4,22]],'#FFE07A',hbo({k:0,base:'#FFF3C2',lw:1.3}));
  b.ln([[22.6,22.4],[41.4,22.4]],{w:2.6});
  b.sh([[23,13.4],[32,6.6],[41,13.4]],C.red,hbo({k:.03,lw:1.3}));
 },
 'Rocket Ship'(b){
  b.raw('<path d="M12 20h.1M52 16h.1M50 40h.1" stroke="#5B3D32" stroke-width="2.4" stroke-linecap="round"/>');
  b.sh([[19,40],[11,50],[11,55],[19,54]],C.red,hbo({k:.06}));b.sh([[45,40],[53,50],[53,55],[45,54]],C.red,hbo({k:.06}));
  b.sh([[32,8],[39,15],[44,26],[45,38],[45,54],[19,54],[19,38],[20,26],[25,15]],'#EEF0F4',hbo({k:.12,marks:[{pts:[[10,0],[54,0],[54,20],[10,20]],fill:C.red,k:0}],hatch:1,sh:'#9FA8BC'}));
  b.sh(E(32,30,5.6,5.6,12),'#CFE8FA',hbo({lw:1.3}));
  HDOOR(b,27.6,36.4,54,44);
 }
};
HOUSES24.forEach(name=>{ITEMS[name]=function(b){
  const card=rot(RR(4,6,56,54,4),-.05,32,33);
  b.sh(card,'#FFFBF3',{k:0,hl:0,hatch:0,base:'#FFFBF3',lw:.72});
  b.D.push(`<clipPath id="${IDT}hc"><path d="${cr(rot(RR(6,8,52,50,3),-.05,32,33),true,0).d}"/></clipPath>`);
  b.raw(`<g clip-path="url(#${IDT}hc)"><rect x="0" y="0" width="64" height="64" fill="${name==='Rocket Ship'?'#E8F1FA':'#F4F9EC'}" opacity=".7"/><path d="M6 ${name==='Camper Van'?55:54.6}H58" stroke="${GRAPH}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/></g>`);
  HCARD[name](b);
  tapeB(b,13,10,20,-38,name==='Rocket Ship'?'#BDE7D2':'#F7B9C6');
  b.ex('spark',57,8,3.6,'#FFE07A');
}});


/* ---------- icons (64) ---------- */
Object.assign(ICONS,{
 missions(b){
  b.sh(RR(10,8,44,54,6),C.wood,{hl:0,sh:WKD});
  b.sh(RR(15,14,34,43,2),'#FFFBF3',{k:0,hatch:0,hl:0,lw:.9,base:'#fff',inner:b.st(b.jl(30,26,44,26,.3)+b.jl(30,36,44,36,.3)+b.jl(30,46,40,46,.3),GRAPH,1.8,.9)});
  [26,36,46].forEach(y=>b.loop(RR(19,y-3.4,7,7,1.6),{w:1.2}));
  b.sh(RR(22,4,20,9,3),C.grey,{hatch:0,hl:0,lw:1});
  b.sh([[18,26],[23,21],[28,27],[44,8],[50,13],[28,37]],'#A8DCA0',{k:0,lw:1});
 },
 guide(b){
  b.sh(RR(34,4,27,19,7),'#FFFBF3',{hatch:0,hl:0,lw:1,base:'#fff'});b.sh([[40,21],[35,29],[47,22]],'#FFFBF3',{k:0,hatch:0,hl:0,lw:.8,base:'#fff'});
  [41.5,47.5,53.5].forEach(x=>b.dot(x,13.5,1.8));
  b.sh([[8,52],[6,40],[10,30],[18,25],[30,25],[38,32],[40,44],[36,54],[24,58],[12,57]],'#7FB86A',{k:.04,marks:[{pts:[[0,52],[64,52],[64,60],[0,60]],fill:'#FFFFFF',k:0}]});
  b.sh([[37,38],[52,36],[58,40],[56,46],[47,49],[37,47]],C.gold,{k:.06,lw:1,hl:0,det:[[[39,42.4],[53,41.6]]],dw:.8});
  b.dot(27,36,2.4);b.dot(27.8,35.2,.8,'#fff','top');b.loop(E(27,36,5.8,5.8,8),{w:1.3});b.ln([[22,39],[17,48]],{w:.8});
  b.ln([[18,26],[15,19],[20,16],[22,20]],{w:1.6});
  b.raw(`<ellipse cx="32" cy="46" rx="3.2" ry="1.9" fill="${PINK}" opacity=".6"/>`,'top');
 },
 stamp(b){
  b.loop(E(32,33,26,26,28),{w:3,col:C.pinkD});b.loop(E(32,33,20,20,24),{w:1.4,col:C.pinkD,op:.8});
  paw(b,32,37,7,C.pinkD,{noline:1});
  b.raw(b.st('M14 22l6 3M44 48l5 2M22 50l3 -4M46 18l-3 5','#fff',2.2,.7),'top');
  b.ex('spark',56,8,4);
 }
});

/* ---------- props: missions card, stamp card, Gerald ---------- */
const mcRows=[116,158,200];
// word wrap by visible characters (an escaped entity counts as one); Caveat bold is about 5.7 units a character at 16
function wrapTxt(s,max,n){const w=String(s).split(' '),L=[''];w.forEach(x=>{const c=L[L.length-1];if(c&&txLen(c+' '+x)>max)L.push(x);else L[L.length-1]=c?c+' '+x:x});return L.slice(0,n)}
const txLen=s=>String(s).replace(/&[a-z#0-9]+;/gi,'x').length;
PROPS.missioncard=function(b,o){
  b.shadow(100,256,86,4);
  b.sh(RR(10,14,180,238,12),C.wood,{hl:0,sh:WKD,inner:b.st('M22 40q30 -4 60 2M130 230q24 -6 50 -2M24 200q10 6 26 4',WKD,1.2,.7)});
  b.sh(rot(RR(22,40,156,202,3),-.012,100,141),'#FFFBF3',{k:0,hatch:0,hl:0,base:'#FFFBF3',lw:.9});
  b.raw(b.st([96,138,180,222].map(y=>`M34 ${y}H166`).join(''),'#BFE6FA',1.1,.8));
  b.sh(RR(64,4,72,30,7),C.grey,{hl:0,sh:'#8E8780',lw:1});b.sh(RR(86,10,28,9,4.5),'#8E8780',{hatch:0,hl:0,lw:.8,base:'#8E8780'});
  b.dot(72,26,1.8,'#8E8780');b.dot(128,26,1.8,'#8E8780');
  tapeB(b,164,48,34,30,'#BDE7D2');
  b.tx(100,66,'Missions',27,{col:'#B8536F'});
  mcRows.forEach(y=>b.loop(rot(RR(32,y-10,20,20,3),(b.r()-.5)*.12,42,y),{w:2.2}));
  // dynamic part (text, ticks, badge, stamps), drawn last so the card itself never changes
  const items=o.items||[];let done=0;
  b.tx(100,86,o.day||'',15,{op:.75});
  mcRows.forEach((y,i)=>{const it=items[i];
    if(!it){b.raw(b.st(`M60 ${y+2}H160`,GRAPH,1.4,.6).replace('stroke-linecap','stroke-dasharray="4 4" stroke-linecap'));return}
    // text stays left of x 146 (the paper ends near 176); p/n sits right-aligned at the row's end, between the rules
    let fs=16,lh=16,L=wrapTxt(it.text,14,9);if(L.length>2){fs=13;lh=13;L=wrapTxt(it.text,18,3)}
    const y0=y+6-(L.length-1)*lh/2;
    if(it.done){done++;L.forEach((ln,k)=>b.raw(`<path d="M60 ${R1(y0-5+k*lh)}H${R1(Math.min(144,62+txLen(ln)*fs*.37))}" stroke="#FFE59A" stroke-width="${fs*.75}" stroke-linecap="round" opacity=".7"/>`));
      b.raw(`<path d="M34 ${y-1}l6 7l14 -18" fill="none" stroke="${C.leafD}" stroke-width="4.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M34 ${y-1}l6 7l14 -18" fill="none" stroke="#fff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>`,'top')}
    L.forEach((ln,k)=>b.tx(60,R1(y0+k*lh),ln,fs,{anchor:'start'}));
    if(it.n>1)b.tx(172,y+5,Math.min(it.p,it.n)+'/'+it.n,13,{anchor:'end',op:.75});
  });
  const st=Math.max(0,Math.min(7,o.stamps|0));
  for(let i=0;i<7;i++){const x=40+i*13,y=234;if(i<st)paw(b,x,y+1,2.6,C.pinkD,{noline:1});else b.raw(`<circle cx="${x}" cy="${y}" r="4.6" fill="none" stroke="${GRAPH}" stroke-width="1" stroke-dasharray="2 2"/>`)}
  b.sh(E(158,229,17,15,18),done===3?C.green:C.yel,{hatch:0,hl:0,lw:1.1,dr:.3});
  b.tx(158,236,done+'/3',19,{});
  if(done===3)b.ex('spark',184,206,5);
};
const SC_SPOTS=[[48,66],[96,66],[144,66],[192,66],[72,108],[120,108],[168,108]];
PROPS.stampcard=function(b,o){
  b.shadow(120,136,108,3);
  b.sh(RR(8,6,224,126,12),C.cream,{hl:0,sh:'#C9A46A',ho:.35});
  b.raw(`<rect x="15" y="13" width="210" height="112" rx="8" fill="none" stroke="${C.pinkD}" stroke-width="1.6" stroke-dasharray="5 4" opacity=".75"/>`);
  b.tx(120,38,'Stamp card',24,{col:'#B8536F'});
  tapeB(b,22,14,36,-30,'#BDE7D2');tapeB(b,218,14,36,30,'#F7B9C6');
  SC_SPOTS.forEach(([x,y],i)=>{b.raw(`<circle cx="${x}" cy="${y}" r="16" fill="#FFFBF3" stroke="${GRAPH}" stroke-width="1.4" stroke-dasharray="4 3.4"/>`);
    if(i===6&&(o.stamps|0)<7){b.sh(RR(x-8,y-5,16,13,2),'#FFE59A',{hatch:0,hl:0,lw:.7,dr:.2,op:.7});b.sh(RR(x-9.4,y-9,18.8,5,1.6),C.pink,{hatch:0,hl:0,lw:.6,dr:.1,op:.7});b.raw(`<path d="M${x} ${y-9}V${y+8}" stroke="${C.pinkD}" stroke-width="2" opacity=".7"/>`)}
    else paw(b,x,y+2,5,'#EFE2CF',{noline:1});});
  const st=Math.max(0,Math.min(7,o.stamps|0));
  SC_SPOTS.slice(0,st).forEach(([x,y])=>{const a=(b.r()-.5)*.5;
    b.loop(E(x,y,15,15,22),{w:2.4,col:C.pinkD});
    paw(b,x,y+1,5.4,C.pinkD,{noline:1,a});
    b.raw(`<path d="M${x-9} ${y-6}l4 2M${x+4} ${y+8}l5 1M${x+7} ${y-9}l-2 4" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".6"/>`)});
  if(st>=7){b.ex('spark',212,104,6);b.ex('heart',28,108,5)}
};
// Gerald: a crude crayon duck drawn with the dogs' kit rules (bucket fill that misses the line, jaggy outline, waxy streaks)
const DINK='#2E2320'; // the crayon dogs' ink (dogs/pawart_dogs.js), so Gerald sits next to them
function crude(r){
  const J=a=>(r()-.5)*2*a,acc=[];
  const dense=(pts,closed,step)=>{const out=[],n=pts.length,m=closed?n:n-1;for(let i=0;i<m;i++){const a=pts[i],c=pts[(i+1)%n],k=Math.max(1,Math.round(Math.hypot(c[0]-a[0],c[1]-a[1])/step));for(let j=0;j<k;j++)out.push([a[0]+(c[0]-a[0])*j/k,a[1]+(c[1]-a[1])*j/k])}if(!closed)out.push(pts[n-1]);return out};
  const pl=(P,amp)=>P.map((p,i)=>(i?'L':'M')+R1(p[0]+J(amp))+' '+R1(p[1]+J(amp))).join('');
  const st=(d,w,c,x='')=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${x}/>`;
  const k={acc,
    shape(pts,fill,o={}){const P=dense(pts,true,o.step||9),n=P.length;let cx=0,cy=0;P.forEach(q=>{cx+=q[0]/n;cy+=q[1]/n});
      const ox=(o.ox??2)+J(.8),oy=(o.oy??-1.4)+J(.8),sc=o.sc??.97;
      if(fill)acc.push(`<path d="${pl(P.map(q=>[cx+(q[0]-cx)*sc+ox,cy+(q[1]-cy)*sc+oy]),o.famp??1)}Z" fill="${fill}"/>`);
      if(o.streak)k.streak(cx,cy,o.streak[0],o.streak[1],fill,o.streak[2]||6);
      if(!o.noline){const s0=Math.floor(r()*n),cnt=n+(o.closed?1:(r()<.55?0:-1)),L=[];for(let i=0;i<=cnt;i++)L.push(P[(s0+i)%n]);acc.push(st(pl(L,o.amp??1.1),o.w||3.3,DINK))}},
    line(pts,w,col,amp=.9){acc.push(st(pl(dense(pts,false,6),amp),w,col||DINK))},
    dot(x,y,rx,ry,fill){acc.push(`<ellipse cx="${R1(x+J(.4))}" cy="${R1(y+J(.4))}" rx="${R1(rx)}" ry="${R1(ry??rx)}" fill="${fill||DINK}"/>`)},
    streak(cx,cy,rx,ry,col,n){let d1='',d2='';for(let i=0;i<n;i++){const a=r()*Math.PI*2,rr=Math.sqrt(r())*.7,x=cx+Math.cos(a)*rx*rr,y=cy+Math.sin(a)*ry*rr,l=6+r()*8;
      if(i%3)d1+=`M${R1(x)} ${R1(y)}L${R1(x+l*.55)} ${R1(y-l*.8)}`;else d2+=`M${R1(x)} ${R1(y)}L${R1(x+l*.55)} ${R1(y-l*.8)}`}
      acc.push(`<path d="${d1}" stroke="${mix(col,INK,.22)}" stroke-width="2" stroke-linecap="round" opacity=".42"/><path d="${d2}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".32"/>`)}
  };
  return k;
}
const GER={body:C.wood,chest:C.woodD,head:'#7FB86A',bill:C.gold,feet:C.orange,wing:mix(C.wood,INK,.1),spec:'#7FB7E0'};
// a feathered wing from base [x,y] to tip [x,y], w wide at the root; the blue patch sits at 40% of its length
function gWing(k,b0,t0,w,col){const dx=t0[0]-b0[0],dy=t0[1]-b0[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L,vx=-uy,vy=ux;
  const P=(u,v)=>[b0[0]+ux*u*L+vx*v*w,b0[1]+uy*u*L+vy*v*w];
  k.shape([P(0,-.5),P(.5,-.56),P(.82,-.44),P(1,-.26),P(.86,-.08),P(.98,.06),P(.82,.18),P(.88,.32),P(.6,.48),P(.12,.5)],col,{streak:[L*.3,w*.3,4]});
  k.shape([P(.36,-.2),P(.52,-.24),P(.54,.12),P(.38,.16)],GER.spec,{w:2,step:5})}
function geraldFrame(pose,f){
  const k=crude(rng(hashS('gerald:'+pose+':'+f))),sit=pose==='sit',dy=sit?12:0,cheer=pose==='cheer',talk=pose==='wave'||cheer;
  const S=(pts)=>pts.map(p=>[p[0],p[1]+dy]);
  if(cheer)gWing(k,[66,96],[34,44],22,mix(GER.wing,INK,.18));
  if(!sit){
    [[70,128],[92,128]].forEach(([x,y])=>{k.line([[x,y],[x-1,148]],3.6,GER.feet,.6);k.line([[x,y],[x-1,148]],1.6,DINK,.4)});
    [[69,148],[91,148]].forEach(([x,y])=>k.shape([[x-8,y+2],[x-2,y-3],[x+3,y-3],[x+10,y+2],[x+4,y+3.5],[x+1,y+1.6],[x-3,y+3.5]],GER.feet,{w:2.6,step:6}));
  }else{
    [[64,151],[88,152]].forEach(([x,y])=>k.shape([[x-4,y],[x+2,y-4],[x+8,y-3.4],[x+14,y+.6],[x+6,y+2.2],[x+2,y+.4],[x-2,y+2]],GER.feet,{w:2.6,step:6}));
  }
  // tail curl + body
  k.line(S([[34,80],[30,72],[35,68],[38,73]]),2.6,DINK,.4);
  k.shape(S([[36,96],[30,80],[44,86],[62,78],[90,76],[110,82],[120,96],[118,116],[102,130],[72,134],[50,128],[38,114]]),GER.body,{streak:[40,22,8]});
  k.shape(S([[96,80],[112,82],[121,96],[118,114],[106,124],[98,110],[96,94]]),GER.chest,{w:2.6,noline:0});
  // neck + head
  k.shape([[92,84+dy*.6],[94,64],[100,58],[112,58],[116,66],[112,86+dy*.6]],GER.head,{w:3});
  k.line([[92,78+dy*.6],[104,82+dy*.6],[113,78+dy*.6]],3.6,'#FFFFFF',.5);
  const hy=dy*.5;
  k.shape([[86,48+hy],[92,32+hy],[106,26+hy],[120,30+hy],[126,44+hy],[122,58+hy],[106,64+hy],[92,60+hy]],GER.head,{streak:[16,14,5]});
  k.line([[100,28+hy],[96,20+hy],[102,16+hy],[105,21+hy]],2.4,DINK,.5);
  // bill (open when talking)
  if(talk){k.shape([[120,44+hy],[142,40+hy],[146,45+hy],[124,50+hy]],GER.bill,{w:2.8,step:6});k.shape([[122,52+hy],[140,54+hy],[138,59+hy],[122,57+hy]],GER.bill,{w:2.8,step:6});k.dot(124,51+hy,2.2,1.4,'#E46F6B')}
  else k.shape([[120,44+hy],[144,46+hy],[146,52+hy],[138,56+hy],[121,54+hy]],GER.bill,{w:2.8,step:6});
  // eye with a know-it-all monocle
  if(cheer)k.line([[104,42+hy],[108,38+hy],[112,42+hy]],2.6,DINK,.3);
  else{k.dot(108,41+hy,3,3.2,DINK);k.dot(109.2,39.8+hy,1,1,'#FFFFFF')}
  k.line([[101,41+hy],[102,35+hy],[108,33+hy],[114,35+hy],[115,41+hy],[113,47+hy],[107,49+hy],[102,47+hy],[101,41+hy]],2,DINK,.3);
  k.line([[102,46+hy],[96,56+hy],[94,66+hy]],1,DINK,.3);
  k.dot(114,50+hy,3.4,2,'#F28FA5');
  // near wing per pose
  const W=GER.wing;
  if(pose==='point')gWing(k,[84,100],[152,84],26,W);
  else if(pose==='wave'){gWing(k,[80,102],[44,40],24,W);k.line([[30,46],[24,42]],2,DINK,.3);k.line([[30,58],[22,58]],2,DINK,.3);k.line([[38,32],[34,24]],2,DINK,.3)}
  else if(cheer)gWing(k,[86,102],[76,26],24,W);
  else gWing(k,[102,98+dy],[42,106+dy],24,W);
  return k.acc.join('');
}
PROPS.gerald=function(b,o){
  const pose=o.pose;
  {const y=pose==='sit'?156:152;let d='';for(let x=40;x<126;x+=4.4)d+=`M${R1(x)} ${y+3}l3.4 -6`;b.raw(`<path d="${d}" stroke="#B8A99A" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>`,'under')}
  if(pose==='cheer'){b.ex('spark',22,30,6);b.ex('spark',140,14,5);b.ex('heart',146,96,4.6);b.ex('spark',30,110,3.6,'#FFE07A')}
  for(let f=0;f<3;f++)b.raw(`<g class="pa-wb-gf${f}">${geraldFrame(pose,f)}</g>`);
};

/* ---------- v2.5 "Autumn & New Pups": festival props, foods, clothes and icons ----------
   leafpile 160x100     o.state 'full' | 'scattered' (after a jump: flatter, leaves flung), o.seed (0..63, picks the leaf layout). Ground y=94.
   stall 240x220        o.kind 'leaf' | 'halloween'. Baker Bea's Harvest Stall: awning, counter, baskets of pumpkins and sweet potatoes;
                        halloween adds a lit jack-o-lantern, a paper ghost garland and a "Dog-safe treats" chalk sign. Ground y=214.
   paradebanner 400x90  a sagging string with "Costume Parade" on a cloth banner, paper ghosts, pumpkins and pennants.
   jackolantern 80x80   o.lit adds a candle glow (static, no filter) in <g class="pa-wb-glow">. Ground y=76.
   leafdrift 120x40     a loose handful of fallen leaves for decoration rows. */
const AUT=['#F29150','#F9A35E','#E46F6B','#FFD56B','#E9B44C','#C96E2A','#D9784A'];
const AUT_V=c=>mix(c,INK,.42);
// a five-lobed maple leaf pointing up (a=0), blade centred on (cx,cy), radius s
function mapleP(cx,cy,s,a){
  const T=[[-90,1],[-30,.9],[28,.64],[152,.64],[210,.9]],p=[],pol=(d,r)=>[cx+Math.cos(d*Math.PI/180)*r*s,cy+Math.sin(d*Math.PI/180)*r*s];
  for(let i=0;i<5;i++){const [a0,r0]=T[i],[a1r,r1]=T[(i+1)%5],a1=a1r<a0?a1r+360:a1r,sp=a1-a0;
    p.push(pol(a0,r0),pol(a0+sp*.14,r0*.6),pol(a0+sp*.22,r0*.7),pol(a0+sp*.5,i===2?.14:.36),pol(a1-sp*.22,r1*.7),pol(a1-sp*.14,r1*.6))}
  return rot(p,a,cx,cy);
}
// one autumn leaf: maple (kind 0) or a plain birch-type leaf (kind 1). sq squashes it flat (lying on the ground)
function leafA(b,x,y,s,a,col,kind,o={}){
  const sq=o.sq||1,F=pts=>sq===1?pts:pts.map(p=>[p[0],y+(p[1]-y)*sq]),lw=o.lw||Math.max(.3,Math.min(.55,s/26)),vc=AUT_V(col),ink=mix(INK,col,.18),dw=o.dw||Math.max(.5,s*.07);
  if(kind===0){
    const v=[-90,-30,210].map(d=>[x+Math.cos(d*Math.PI/180+a)*s*.78,y+Math.sin(d*Math.PI/180+a)*s*.78]),st=[x-Math.sin(a)*s*.62*-1,y+Math.cos(a)*s*.62];
    b.sh(F(mapleP(x,y,s,a)),col,{k:.04,hatch:0,hl:0,lw,ink,dr:.35,det:[F([[x,y],v[0]]),F([[x,y],v[1]]),F([[x,y],v[2]]),F([[x,y],st])],dw,dcol:vc,top:o.top,under:o.under});
  }else{
    const L=s*1.9,tx=x-Math.cos(a-Math.PI/2)*L*.5,ty=y-Math.sin(a-Math.PI/2)*L*.5,an=a-Math.PI/2;
    b.sh(F(leafP(tx,ty,L,s*.95,an)),col,{k:.18,hatch:0,hl:0,lw,ink,dr:.35,det:[F([[tx-Math.cos(an)*s*.3,ty-Math.sin(an)*s*.3],[tx+Math.cos(an)*L*.82,ty+Math.sin(an)*L*.82]])],dw,dcol:vc,top:o.top,under:o.under});
  }
}
// a paper ghost (garlands, the banner, the biscuits); h is the height, the hem has three soft points
function ghostP(cx,cy,w,h,lean=0){
  const p=[],top=cy-h/2,hy=cy+h/2;
  for(let i=0;i<=12;i++){const t=Math.PI+i/12*Math.PI;p.push([cx+Math.cos(t)*w/2,top+w/2+Math.sin(t)*w/2])}
  p.push([cx+w*.54,hy-h*.12]);
  for(let i=0;i<3;i++){const x0=cx+w/2-i*w/3;p.push([x0-w/6,hy-h*.16+(i===1?h*.04:0)]);p.push([x0-w/3,hy+(i===1?-h*.02:0)])}
  p.pop();p.push([cx-w*.54,hy+h*.02]);p.push([cx-w*.52,hy-h*.14]);
  return lean?rot(p,lean,cx,hy):p;
}
function ghostV(b,cx,cy,w,h,o={}){
  b.sh(ghostP(cx,cy,w,h,o.lean||0),'#FFFFFF',{k:.16,hatch:0,hl:0,lw:o.lw||Math.max(.55,Math.min(1.2,w/14)),base:'#FFFFFF',dr:.25,
   marks:[{pts:E(cx+w*.2,cy+h*.22,w*.4,h*.3,10),fill:'#E4ECF6',op:.85}],top:o.top});
  const ey=cy-h*.14,ex=w*.17,r=Math.max(.7,w*.075);
  b.dot(cx-ex+(o.lean||0)*h*.4,ey,r,INK,o.top?'top':undefined);b.dot(cx+ex+(o.lean||0)*h*.4,ey,r,INK,o.top?'top':undefined);
  if(!o.nomouth)b.raw(`<ellipse cx="${R1(cx+(o.lean||0)*h*.3)}" cy="${R1(cy+h*.06)}" rx="${R1(r*.7)}" ry="${R1(r*.9)}" fill="${INK}" opacity=".8"/>`,o.top?'top':undefined);
  if(w>12)b.raw(`<ellipse cx="${R1(cx-ex*1.7)}" cy="${R1(ey+r*2.4)}" rx="${R1(r*1.1)}" ry="${R1(r*.6)}" fill="${PINK}" opacity=".45"/>`,o.top?'top':undefined);
}
// a carved pumpkin: friendly triangle eyes, a nose and a two-tooth grin. lit fills the cuts with candlelight
function jackV(b,cx,cy,s,lit,o={}){
  const lw=o.lw||Math.max(.45,Math.min(.85,s*.62)),cut=lit?'#FFE59A':'#7A4A33',cutL=lit?'#FFF7D6':'#9A6A4E';
  b.ln([[cx+3*s,cy-19*s],[cx+11*s,cy-25*s],[cx+16*s,cy-22*s],[cx+14*s,cy-18*s]],{w:1.3*lw,col:'#6FA35A'});
  b.sh(leafP(cx-4*s,cy-21*s,13*s,7*s,-2.7),LEAF,{hatch:0,hl:0,lw:lw*.75,dr:.2,det:[[[cx-4*s,cy-21*s],[cx-14*s,cy-24*s]]],dw:lw*.6});
  [[-14,15,'#F29150'],[14,15,'#F29150']].forEach(([dx,rx,c])=>b.sh(E(cx+dx*s,cy+1*s,rx*s,19*s,18),c,{lw,hl:0,sh:'#C96E2A',ho:.4}));
  b.sh(E(cx,cy,15.5*s,20.5*s,18),PUMP,{lw,hlo:.45,sh:'#C96E2A',ho:.35,
   inner:b.st(b.jl(cx-6*s,cy-17*s,cx-7*s,cy+17*s,.4*s)+b.jl(cx+6*s,cy-17*s,cx+7*s,cy+17*s,.4*s),'#C96E2A',.9*lw,.5)});
  b.sh(ribbon([[cx,cy-17*s],[cx+1.6*s,cy-23*s],[cx+4.6*s,cy-26*s]],[5.4*s,4.4*s,3.2*s]),'#8E8A4A',{k:1/6,hatch:0,hl:0,lw:lw*.8,dr:.1});
  const face={k:.04,hatch:0,hl:0,lw:lw*.62,dr:.15,base:cut};
  [[-1,0],[1,0]].forEach(([d])=>b.sh([[cx+d*4*s,cy-3.6*s],[cx+d*13.6*s,cy-4.4*s],[cx+d*8.6*s,cy-12*s]],cut,Object.assign({marks:lit?[{pts:E(cx+d*8.6*s,cy-6*s,2.6*s,1.8*s,8),fill:cutL}]:undefined},face)));
  b.sh([[cx-2.6*s,cy+1.6*s],[cx+2.6*s,cy+1.6*s],[cx,cy-2.6*s]],cut,face);
  const m=[[cx-14*s,cy+4*s],[cx-6*s,cy+9.4*s],[cx-4.4*s,cy+6.6*s],[cx-1.8*s,cy+10.2*s],[cx+5*s,cy+9.6*s],[cx+6.4*s,cy+6.8*s],[cx+8.6*s,cy+9.2*s],[cx+14*s,cy+4*s],[cx+9*s,cy+14.4*s],[cx,cy+16*s],[cx-9*s,cy+14.4*s]];
  b.sh(m,cut,Object.assign({k:.12,marks:lit?[{pts:E(cx,cy+12.4*s,7*s,2.2*s,10),fill:cutL}]:undefined},face));
  if(!lit)b.raw(`<ellipse cx="${R1(cx-9*s)}" cy="${R1(cy+3*s)}" rx="${R1(3*s)}" ry="${R1(1.7*s)}" fill="${PINK}" opacity=".4"/>`,'top');
}
// a wicker basket in 3/4 view (rim ellipse at y), contents drawn by fill() between the back and the front
function basketV(b,cx,y,w,h,fill){
  b.sh(E(cx,y,w/2,h*.2,20),mix(WKD,INK,.25),{hatch:0,hl:0,lw:.9});
  fill();
  let wv='';for(let i=1;i<4;i++)wv+=b.jl(cx-w*.48+i*.02*w,y+h*.22*i,cx+w*.48-i*.02*w,y+h*.22*i,.5);
  for(let x=cx-w*.4;x<cx+w*.42;x+=w*.12)wv+=b.jl(x,y+1,x+(x-cx)*-.08,y+h*.92,.4);
  b.sh([[cx-w/2,y],[cx+w/2,y],[cx+w*.42,y+h*.9],[cx+w*.2,y+h],[cx-w*.2,y+h],[cx-w*.42,y+h*.9]],WK,{k:.1,sh:WKD,hl:0,inner:b.st(wv,WKD,1,.75)});
  b.sh(ribbon([[cx-w/2-1,y],[cx,y+h*.12],[cx+w/2+1,y]],[5,5,5]),WKL,{k:1/6,hatch:0,hl:0,lw:.9,inner:b.st(b.jl(cx-w*.4,y+1,cx+w*.4,y+1,.3),WKD,.9,.7)});
}
function steam(b,x,y,s,col){b.ln([[x,y],[x-2*s,y-4*s],[x+1*s,y-8*s],[x-1.4*s,y-12*s]],{w:1.2,col:col||GRAPH});}

PROPS.leafpile=function(b,o){
  const sc=o.state==='scattered',r=b.r,G=94,sd=o.seed|0,lean=((sd*7)%5-2)*3;
  b.shadow(80,G,sc?76:70,sc?5:6);
  b.guide([[4,G+.5],[80,G-.4],[156,G+.6]],false);
  // rake marks in the grass either side
  b.raw(b.st('M4 90q8 -3 16 -1M8 95q9 -3 18 -1M136 89q9 -3 17 0M132 95q10 -3 22 -1',GRAPH,1.1,.6),'under');
  const top=(sc?60:26)+(sd%4)*3,x0=(sc?6:12)+(sd%3)*4,x1=(sc?154:148)-((sd>>1)%3)*4,hw=y=>Math.max(0,(x1-x0)/2*Math.pow(Math.max(0,(y-top)/(G-top)),.45));
  const mound=[];for(let i=0;i<=20;i++){const t=i/20,x=x0+(x1-x0)*t,u=2*t-1-lean*.012*(1-Math.abs(2*t-1)),y=G-(G-top)*Math.pow(Math.max(0,1-u*u),sc?.9:.62)+(i%2?3.4:-1.2)*(1-u*u)+(r()-.5)*2.4;mound.push([x,y])}
  b.sh([...mound,[x1-2,G+1],[80,G+2],[x0+2,G+1]],'#F29150',{k:.12,hl:0,sh:'#C96E2A',ho:.45,base:'#F7B27A',lw:.75,
   inner:b.st([0,1,2,3,4,5].map(i=>{const x=x0+14+i*(x1-x0-28)/5;return b.jl(x,G-4,x+6,G-14,.6)}).join(''),'#C96E2A',1,.4)});
  // leaves along the top edge, so the outline is leafy, then the rows, back first
  mound.forEach(([x,y],i)=>{if(i%2||i<2||i>18)return;leafA(b,x+(r()-.5)*3,y+3+r()*2,9+r()*3,(r()-.5)*2.4,AUT[Math.floor(r()*AUT.length)],r()<.6?0:1)});
  const rows=sc?[66,76,86]:[34,44,54,64,74,84];
  rows.forEach((y,ri)=>{const w=hw(y)*.9,n=Math.max(1,Math.round(w*2/(sc?21:19)));
    for(let i=0;i<n;i++){const x=80-w+(n===1?w:i*2*w/(n-1))+(r()-.5)*7,yy=y+(r()-.5)*5,s=9.6+r()*3.6,a=(r()-.5)*2.6,k=r()<.62?0:1;
      leafA(b,x,yy,s,a,AUT[Math.floor(r()*AUT.length)],k,{sq:sc&&ri<2?.8:1})}});
  // a few loose ones on the ground at the foot
  const gl=sc?[[2,90],[22,93],[46,95],[116,95],[138,92],[156,90],[66,96],[96,96]]:[[6,91],[26,94],[132,94],[152,91]];
  gl.forEach(([x,y])=>leafA(b,x,y,8+r()*2,(r()-.5)*3,AUT[Math.floor(r()*AUT.length)],r()<.5?0:1,{sq:.5}));
  if(sc){
    // flung leaves in the air with little swoosh lines
    const fl=[[18,40],[34,18],[54,30],[72,8],[92,22],[110,10],[128,32],[146,20],[62,48],[100,44],[8,22],[150,46]];
    let sw='';
    fl.forEach(([x,y],i)=>{const a=(r()-.5)*5,s=7.4+r()*3;leafA(b,x,y,s,a,AUT[(i*3+Math.floor(r()*3))%AUT.length],i%3===1?1:0,{top:1});
      const dx=x<80?1:-1;sw+=`M${R1(x+dx*6)} ${R1(y+8)}q${R1(dx*5)} ${R1(4)} ${R1(dx*7)} ${R1(12)}`});
    b.raw(b.st(sw,GRAPH,1.1,.65),'under');
    b.ex('spark',80,4,4,'#FFE07A');b.ex('dots',140,6,4);
  }else{
    b.ex('spark',150,30,4,'#FFE07A');b.ex('heart',12,40,3.2);
  }
};

PROPS.jackolantern=function(b,o){
  if(o.lit)b.raw(`<g class="pa-wb-glow"><circle cx="40" cy="44" r="38" fill="#FFE59A" opacity=".24"/><circle cx="40" cy="44" r="30" fill="#FFE07A" opacity=".28"/><circle cx="40" cy="46" r="23" fill="#FFF3C2" opacity=".45"/><ellipse cx="40" cy="76" rx="34" ry="4" fill="#FFE59A" opacity=".35"/></g>`,'under');
  b.shadow(40,76,26,3.4);
  jackV(b,40,51,1.24,!!o.lit);
  if(o.lit){b.ex('spark',70,14,3.6,'#FFE59A');b.ex('spark',10,22,2.8,'#FFF3C2')}else b.ex('dots',8,14,4);
};

PROPS.leafdrift=function(b){
  const r=b.r;
  b.raw(`<ellipse cx="60" cy="33" rx="58" ry="6" fill="${SHADOW}" opacity=".85"/>`,'under');
  [[12,24,0],[30,27,1],[47,20,0],[62,28,0],[78,22,1],[94,27,0],[109,22,0],[40,32,1],[86,33,0]].forEach(([x,y,k],i)=>
    leafA(b,x,y,(k?8.6:11.6)+r()*2,(r()-.5)*3.4,AUT[(i*5)%AUT.length],k,{sq:.72+r()*.16}));
  b.ex('spark',58,8,3,'#FFE07A');
};

PROPS.paradebanner=function(b){
  const sy=x=>8+24*(1-Math.pow((x-200)/194,2));
  const str=[];for(let x=4;x<=396;x+=14)str.push([x,sy(x)]);str.push([396,sy(396)]);
  b.ln(str,{w:1.4,col:'#8E6446'});
  b.sh(E(5,8,3,3,8),C.woodD,{hatch:0,hl:0,lw:.7});b.sh(E(395,8,3,3,8),C.woodD,{hatch:0,hl:0,lw:.7});
  const hang=(x,len)=>{const y=sy(x);b.ln([[x,y],[x,y+len]],{w:.8,col:'#8E6446'});return y+len};
  const pen=(x,col)=>{const y=sy(x)-1;b.sh([[x-9,y],[x+9,y+.6],[x+.6,y+24]],col,{k:.05,hatch:0,hl:0,lw:.9,dr:.3,inner:b.st(b.jl(x-6,y+4,x+5,y+4.4,.3),'#fff',1.2,.7)})};
  const pumpkinC=(x)=>{const y=hang(x,5)+10;b.sh(cloudP(x,y,10.5,9,5,.14,30),'#F29150',{k:.2,hatch:0,hl:0,lw:.9,dr:.3,
     inner:b.st(b.jl(x-3.6,y-8,x-4.2,y+8,.3)+b.jl(x+3.6,y-8,x+4.2,y+8,.3),'#C96E2A',.9,.6)});
     b.sh([[x-1.4,y-8],[x+1.6,y-8.4],[x+2.4,y-12],[x-.4,y-12]],'#8E8A4A',{k:.1,hatch:0,hl:0,lw:.6,dr:.1});
     b.dot(x-3.4,y-1.6,1.1);b.dot(x+3.4,y-1.6,1.1);b.ln([[x-4,y+3],[x,y+5],[x+4,y+3]],{w:.9})};
  const ghostC=(x,lean)=>{const y=hang(x,3)+13;ghostV(b,x,y,17,24,{lean})};
  // left run and right run: pennant, ghost, pennant, pumpkin, ...
  [[14,'p',C.orange],[34,'g',-.1],[54,'p',C.lavD],[75,'k'],[95,'p','#FFE07A'],[306,'p','#FFE07A'],[326,'k'],[347,'p',C.lavD],[367,'g',.1],[387,'p',C.orange]].forEach(([x,t,v])=>
    t==='p'?pen(x,v):t==='g'?ghostC(x,v):pumpkinC(x));
  // the cloth banner in the middle, tied to the string at both ends
  const bn=[[112,26],[200,31],[288,26],[296,42],[289,62],[200,66],[111,62],[104,42]];
  b.ln([[118,sy(118)],[118,28]],{w:1,col:'#8E6446'});b.ln([[282,sy(282)],[282,28]],{w:1,col:'#8E6446'});
  b.sh(bn,'#FFF2DA',{k:.12,base:'#FFF8EC',sh:'#C9A46A',ho:.3,hl:0,
   marks:[{pts:[[100,24],[300,24],[300,32],[100,32]],fill:C.orange,k:0,op:.9},{pts:[[100,59],[300,59],[300,68],[100,68]],fill:C.orange,k:0,op:.9}]});
  b.sh(E(116,28,3,3,8),C.pinkD,{hatch:0,hl:0,lw:.6,top:1});b.sh(E(284,28,3,3,8),C.pinkD,{hatch:0,hl:0,lw:.6,top:1});
  b.tx(200,55,'Costume Parade',25,{rot:-1});
  b.raw(b.st('M136 60q32 -3 64 -1t62 -1',C.redD,1.6,.6),'top');
  b.ex('spark',106,74,3.6,'#FFE07A');b.ex('spark',296,76,3.2,'#FFE07A');b.ex('heart',200,82,3);
};

// Baker Bea's Harvest Stall
PROPS.stall=function(b,o){
  const hw=o.kind==='halloween',G=214;
  b.shadow(120,G,114,6);
  b.guide([[4,G+.5],[120,G-.5],[236,G+.6]],false);
  // posts
  [[22,0],[218,0]].forEach(([x])=>b.sh(ribbon([[x,40],[x,130],[x,G]],[9,9,9]),C.wood,{k:.05,hatch:0,hl:0,lw:1.1,base:'#F3DDB4',det:[[[x-1.6,60],[x-1.4,120]]],dw:.7,dcol:WKD}));
  // back wall and shelf
  b.sh([[28,66],[212,66],[212,142],[28,142]],'#FFF2DA',{k:0,hl:0,hatch:0,base:'#FFF8EC',lw:.9,inner:b.st([52,84,116,148,180].map(x=>b.jl(x,70,x,138,.5)).join(''),'#E2C9A2',1,.7)});
  b.sh(RR(34,96,172,7,2),C.woodD,{hatch:0,hl:0,lw:.9});
  // jars of treats and a stack of paper bags on the shelf
  [[48,C.mint],[70,C.pink],[170,C.lav],[192,C.mint]].forEach(([x,c])=>{b.sh(RR(x-8,78,16,18,4),'#E8F4FB',{hatch:0,hl:0,lw:.9,base:'#F7FBFE',marks:[{pts:[[x-8,84],[x+8,84],[x+8,96],[x-8,96]],fill:'#E8B48A',op:.8,k:0}]});
    b.sh(RR(x-9,74,18,5,2),c,{hatch:0,hl:0,lw:.8});b.sh(boneP(x,88,10,4.4,.1),'#FFFBF3',{hatch:0,hl:0,lw:.5,dr:.1})});
  [[0,'#E8C597'],[5,'#DDB57C'],[10,'#E8C597']].forEach(([dy,c])=>b.sh(rot(RR(104,86-dy,32,8,1.5),dy?.04:-.03,120,90-dy),c,{k:0,hatch:0,hl:0,lw:.8}));
  b.sh(heartP(120,80,7),C.pinkD,{hatch:0,hl:0,lw:.5});
  // the striped awning with a scalloped edge
  const stripes=[];for(let i=0;i<14;i++)if(i%2===0)stripes.push({pts:[[10+i*16.4,16],[26.4+i*16.4,16],[30+i*17.4,70],[12+i*17.4,70]],fill:'#FFF2DA',k:0});
  b.sh([[18,24],[222,24],[234,58],[6,58]],C.orange,{k:.02,hl:0,sh:'#C96E2A',ho:.35,marks:stripes});
  const sc=[];for(let i=0;i<=12;i++){const x=234-i*19;sc.push([x,58]);if(i<12)sc.push([x-9.5,70])}
  b.sh([[6,56],[234,56],...sc],C.orange,{k:.18,hatch:0,hl:0,lw:1,marks:Array.from({length:6},(_,i)=>({pts:[[6+i*38,50],[25+i*38,50],[25+i*38,74],[6+i*38,74]],fill:'#FFF2DA',k:0}))});
  // the sign on top
  b.ln([[78,24],[82,10]],{w:1.1,col:'#8E6446'});b.ln([[162,24],[158,10]],{w:1.1,col:'#8E6446'});
  b.sh(rot(RR(64,0,112,22,5),-.015,120,11),C.wood,{hatch:0,hl:0,lw:1.1,base:'#F3DDB4',sh:WKD});
  b.tx(120,16.5,'Harvest Stall',17,{rot:-1});
  leafA(b,58,10,6,-.5,'#E46F6B',0,{top:1});leafA(b,182,9,5.4,.6,'#FFD56B',0,{top:1});
  // garland under the awning: leaves, or ghosts and leaves at Halloween
  const gy=x=>72+7*(1-Math.pow((x-120)/96,2));
  const gs=[];for(let x=26;x<=214;x+=12)gs.push([x,gy(x)]);
  b.ln(gs,{w:1,col:'#8E6446'});
  [44,64,84,104,136,156,176,196].forEach((x,i)=>{const y=gy(x);
    if(hw&&i%2===0){b.ln([[x,y],[x,y+2]],{w:.7,col:'#8E6446'});ghostV(b,x,y+8,10,14,{lean:(i%4?-.1:.1)})}
    else leafA(b,x,y+5,5.6,Math.PI+(i%2?.3:-.3),AUT[(i*2)%AUT.length],0)});
  // the counter
  b.sh([[18,140],[222,140],[222,G],[18,G]],C.wood,{k:0,hl:0,sh:WKD,ho:.35,base:'#F3DDB4',inner:b.st([44,70,96,122,148,174,200].map(x=>b.jl(x,146,x,G-2,.6)).join(''),WKD,1,.6)});
  b.sh(RR(10,132,220,12,3),C.woodD,{hatch:0,hl:0,lw:1.2,base:'#DDB78F'});
  const cl=[[30,144],[210,144],[210,160]];for(let i=0;i<=9;i++){const x=210-i*20;cl.push([x,i%2?164:158])}cl.push([30,160]);
  b.sh(cl,'#FFFBF3',{k:.12,hatch:0,hl:0,lw:.9,base:'#fff',marks:[{pts:[[20,148],[220,148],[220,151],[20,151]],fill:C.orange,k:0,op:.8}]});
  // baskets on the counter
  basketV(b,60,112,62,22,()=>{pumpkinV(b,46,106,.44,{noleaf:1});pumpkinV(b,74,106,.4,{noleaf:1});pumpkinV(b,60,96,.4,{noleaf:1})});
  basketV(b,126,114,62,20,()=>{sweetV(b,112,110,.5,-.3);sweetV(b,140,109,.48,.25);sweetV(b,126,101,.46,-.05)});
  if(hw){
    b.raw(`<g class="pa-wb-glow"><circle cx="190" cy="108" r="28" fill="#FFE59A" opacity=".16"/><circle cx="190" cy="110" r="19" fill="#FFF3C2" opacity=".28"/></g>`);
    jackV(b,190,112,.86,true);
  }else{
    basketV(b,190,114,50,20,()=>{pumpkinV(b,180,106,.38,{noleaf:1});pumpkinV(b,200,107,.34,{noleaf:1})});
  }
  b.tx(hw?146:120,194,"Baker Bea's",18,{mid:1,col:'#B8536F'});
  if(!hw)paw(b,64,188,3.2,'#E2C9A2',{noline:1});paw(b,176,188,3.2,'#E2C9A2',{noline:1});
  // at the foot of the stall
  if(hw){
    // the chalk sign (A-frame)
    b.ln([[14,G],[22,150]],{w:4,col:C.woodD});b.ln([[66,G],[58,150]],{w:4,col:C.woodD});
    b.sh(rot([[12,156],[68,156],[66,204],[14,204]],-.03,40,180),'#556B5E',{k:.02,hatch:0,hl:0,lw:1.2,base:'#4A5E52',
     inner:b.st('M18 196q10 -2 20 0M44 168q8 -2 16 0','#fff',1.2,.25)});
    b.tx(40,175,'Dog-safe',15,{rot:-2,col:'#FFFBF3'});b.tx(40,191,'treats',15,{rot:-2,col:'#FFFBF3'});
    b.raw(b.st('M24 197q8 -2 14 0',C.orange,1.6,.9),'top');b.sh(boneP(52,197,12,4.6,-.08),'#FFFBF3',{hatch:0,hl:0,lw:.6,dr:.1,top:1});
    pumpkinV(b,222,206,.34,{noleaf:1});
    b.ex('spark',230,90,4,'#FFE59A');b.ex('dots',8,96,5);
  }else{
    pumpkinV(b,12,206,.38,{noleaf:1});pumpkinV(b,226,208,.3,{noleaf:1});
    [[40,212],[60,213],[196,212]].forEach(([x,y],i)=>leafA(b,x,y,6,(i-1)*.8,AUT[i*2],i%2,{sq:.5}));
    b.ex('spark',230,90,4,'#FFE07A');b.ex('heart',8,96,3.6);
  }
};

/* foods (64) */
Object.assign(ITEMS,{
 'Baked Pumpkin Wedges'(b){
  // a paper boat tray of plain baked wedges, standing up out of the tray
  // half-moon wedges: orange flesh, a darker skin band on the curved back
  const wedge=(x,y,a)=>{const out=[],inn=[];for(let i=0;i<=10;i++){const t=Math.PI*(1+i/10);out.push([x+Math.cos(t)*11,y+Math.sin(t)*10])}
    for(let i=10;i>=0;i--){const t=Math.PI*(1+i/10);inn.push([x+Math.cos(t)*8.4,y+Math.sin(t)*7.4])}
    b.sh(rot(out,a,x,y),PUMP,{k:.14,hatch:0,hl:0,lw:.8,base:'#FBC28A',marks:[{pts:rot(out.concat(inn),a,x,y),fill:'#E07B33'}],inner:b.st(b.jl(x-4,y-3,x+3,y-4.4,.3),'#FFE3C0',1.2,.9)})};
  wedge(18,34,-.5);wedge(46,34,.5);wedge(32,28,0);wedge(25,41,-.15);wedge(39,41,.18);
  b.sh([[6,43],[58,43],[52,58],[12,58]],'#FFF2DA',{k:.06,sh:'#C9A46A',hl:0,base:'#FFF8EC',
   marks:[{pts:[[0,46],[64,46],[64,49],[0,49]],fill:C.orange,k:0,op:.75}],inner:b.st(b.jl(16,46,15,55,.3)+b.jl(48,46,49,55,.3),'#C9A46A',.8,.6)});
  b.sh(rot(RR(24,50,16,6,1.6),-.03,32,53),'#FFFBF3',{hatch:0,hl:0,lw:.6,base:'#fff'});leafA(b,32,53,2.8,0,'#E46F6B',0,{lw:.3,dw:.4});
  steam(b,24,16,.9);steam(b,40,15,.9);
  b.ex('spark',57,10,3.6);b.ex('heart',6,24,2.6);
 },
 'Sweet Potato Coins'(b){
  plateV(b,32,47,28,10,C.lav,'#FFFFFF');
  const coin=(x,y,a)=>{b.sh(E(x,y+1.4,8.6,4.8,16,a),'#B96B52',{hatch:0,hl:0,lw:.6,dr:.2});
    b.sh(E(x,y,8.6,4.8,16,a),SWP,{hatch:0,hl:0,lw:.6,dr:.2,base:'#D99278',marks:[{pts:E(x,y-.2,7.4,3.9,14,a),fill:'#F9A35E'}],
     inner:b.st(`M${x-3} ${y-.6}l1.4 .6M${x+1} ${y+.8}l1.6 -.4M${x+2.4} ${y-1.6}l.8 .6`,'#C46F2E',.7,.6)})};
  sweetV(b,44,30,.36,-.3);
  [[18,46,.05],[32,48,-.04],[46,46,.08],[25,40,-.1],[39,41,.1],[22,33,-.15]].forEach(([x,y,a])=>coin(x,y,a));
  b.ex('spark',8,12,3.6);b.ex('dots',56,34,4);
 },
 'Warm Bone Broth'(b){
  // a big mug with a paw print, the broth gold and steaming
  b.ln([[48,28],[58,30],[58,42],[48,46]],{w:4.6});b.ln([[48,28],[58,30],[58,42],[48,46]],{w:2.4,col:C.blue});
  b.sh([[12,22],[50,22],[47,54],[42,58],[20,58],[15,54]],C.blue,{k:.12,sh:'#7F9FCB',marks:[{pts:[[0,50],[64,50],[64,54],[0,54]],fill:'#9FBCE6',k:0}]});
  b.sh(E(31,22,19,5,20),'#9FBCE6',{hatch:0,hl:0,lw:.9});
  b.sh(E(31,22.6,16,3.6,18),'#F2C96B',{hatch:0,hl:0,lw:.7,base:'#F8D98E',inner:b.st('M22 22q4 -1.6 8 0t8 0',`#fff`,1,.6)});
  paw(b,31,38,3.4,'#FFFFFF',{noline:1});
  steam(b,24,14,1,'#B9A69A');steam(b,32,13,1.1,'#B9A69A');steam(b,40,14,.9,'#B9A69A');
  b.sh(boneP(10,57,14,5,-.3),'#FFFBF3',{hatch:0,hl:0,lw:.6,dr:.1});
  b.ex('heart',56,12,2.8);b.ex('spark',6,12,3.4);
 },
 'Ghost Biscuits'(b){
  plateV(b,32,48,29,10,C.mint,'#FFFFFF');
  const bis=(x,y,s)=>{b.sh(E(x,y,11*s,9*s,16),'#E8C597',{hatch:0,hl:0,lw:.8,base:'#F3DDB4',sh:'#C99A72',
     inner:[[-.5,-.3],[.4,-.45],[.55,.3],[-.3,.45],[0,0]].map(([dx,dy])=>`<circle cx="${R1(x+dx*9*s)}" cy="${R1(y+dy*7*s)}" r=".8" fill="#C99A72" opacity=".8"/>`).join('')});
    ghostV(b,x,y-.4*s,10.6*s,11.4*s,{lw:.6,nomouth:s<.9})};
  bis(18,42,.9);bis(46,42,.9);bis(32,46,1);bis(32,27,1.05);
  b.ex('spark',57,12,3.6);b.ex('dots',6,14,4);
 },
 'Candy Corn Carrots'(b){
  // carrot points cut to look like candy corn, in a striped paper cup. Only carrot
  const pt=(x,y,a,s=1)=>{const P=[[x-7.6*s,y+8*s],[x-6.4*s,y+9.6*s],[x+6.4*s,y+9.6*s],[x+7.6*s,y+8*s],[x+1.8*s,y-9*s],[x-1.8*s,y-9*s]];
    b.sh(rot(P,a,x,y),'#F59E52',{k:.16,hatch:0,hl:0,lw:.75,dr:.15,base:'#F9BE86',
     marks:[{pts:rot([[x-10*s,y+3*s],[x+10*s,y+3*s],[x+10*s,y+11*s],[x-10*s,y+11*s]],a,x,y),fill:'#D9682A',k:0},{pts:rot([[x-6*s,y-3.6*s],[x+6*s,y-3.6*s],[x,y-12*s]],a,x,y),fill:'#FFD0A8',k:0}]})};
  [[21,23,-.4],[32,19,-.04],[43,23,.38],[27,30,.1],[38,30,-.2]].forEach(([x,y,a])=>pt(x,y,a,1.05));
  b.sh([[12,32],[52,32],[46,60],[18,60]],'#FFFBF3',{k:.06,sh:'#C9A46A',hl:0,base:'#fff',marks:[17,27,37,47].map(x=>({pts:[[x,30],[x+5,30],[x+3.4,62],[x-1.6,62]],fill:C.orange,k:0,op:.85}))});
  b.sh(RR(10,30,44,6,2),'#FFFBF3',{hatch:0,hl:0,lw:.8,base:'#fff'});
  pt(55,53,1.25,.8);
  b.ex('spark',56,10,3.6);b.ex('heart',8,14,2.6);b.ex('dots',6,48,4);
 },
 'Monster Meatball'(b){
  bowl(b,32,40,26,7,16,C.lav,'#B9A6E8',()=>{
   b.sh(cloudP(32,36,19,7,7,.25,40),'#E8B48A',{noline:1,hatch:0,hl:0});
   // one big friendly turkey meatball with a carrot-slice eye and a parsley tuft
   b.sh(cloudP(32,24,15,13.6,9,.08,40),'#C9895B',{k:.18,hl:0,lw:1,base:'#D9A27A',sh:'#8E5A44',ho:.35,marks:[{pts:E(26,19,5.6,3.4,10,-.4),fill:'#E6B48C'}]});
   b.sh(E(32,22,6.4,6,14),ORNG,{hatch:0,hl:0,lw:.8,base:'#F9BE86',marks:[{pts:E(32,22,4.4,4,12),fill:'#F9B97A'}],
    inner:b.st('M32 18v8M28 22h8M29.4 19.4l5.2 5.2M34.6 19.4l-5.2 5.2','#E07B33',.6,.6)});
   b.dot(32.6,22.4,2.2);b.dot(33.2,21.6,.7,'#fff','top');
   b.ln([[27,31],[32,33],[37,31]],{w:1});
   [[-.5,-1.9],[0,-2.2],[.5,-1.8]].forEach(([dx,a],i)=>b.sh(leafP(32+dx*6,12,6,3,a),i===1?LEAFD:LEAF,{hatch:0,hl:0,lw:.55,dr:.1}));
  });
  b.ex('spark',57,10,3.6);b.ex('heart',7,20,2.6);
 }
});

/* clothes (64) */
Object.assign(ITEMS,{
 'Leaf Beret'(b){
  const RU='#C96E2A',RD=mix('#C96E2A',INK,.3);
  b.sh(rot(E(32,40,26,9,22),-.16,32,40),RD,{hl:0,hatch:0,lw:1});
  b.sh(rot([[7,40],[9,30],[18,21],[32,17],[46,20],[56,28],[58,38],[46,42],[32,43],[18,43]],-.16,32,34),RU,{k:.18,sh:RD,ho:.5,
   inner:b.st(b.jl(14,30,30,22,.4)+b.jl(24,36,50,26,.4),mix(RU,INK,.2),.8,.5)});
  b.sh(rot(ribbon([[10,44],[32,47],[56,40]],[5,5,5]),-.16,32,44),RD,{k:1/6,hatch:0,hl:0,lw:.8});
  b.ln([[33,17],[34,11],[37,9]],{w:2.4,col:RD});
  leafA(b,44,26,9.6,.5,'#FFD56B',0,{lw:.5,dw:.6});
  b.ex('spark',8,14,3.6,'#FFE07A');b.ex('dots',54,54,4);
 },
 'Autumn Scarf'(b){
  const MU=C.goldD,RU='#C96E2A';
  const rows=(x0,x1,y0,y1,step)=>{const m=[];for(let y=y0,i=0;y<y1;y+=step,i++)if(i%2===0)m.push({pts:[[x0,y],[x1,y],[x1,y+step],[x0,y+step]],fill:RU,k:0});return m};
  const fringe=(pts,col)=>pts.forEach(([x,y,dx])=>b.ln([[x,y],[x+dx,y+5.4]],{w:1.1,col}));
  // a little peg, the scarf hung over it: a short tail behind, a long tail in front swinging right
  b.sh(E(32,8,4,4,10),C.woodD,{hatch:0,hl:0,lw:.8});b.ln([[32,4],[32,1]],{w:1.4,col:WKD});
  b.sh(ribbon([[25,10],[19,26],[15,44]],[14,14,14]),MU,{k:.12,hl:0,sh:mix(MU,INK,.35),marks:rows(0,64,10,50,7)});
  fringe([[9,47,-1],[12,48.4,-.5],[15,49,0],[18,48.6,.5],[21,47.6,1]],RU);
  b.sh(ribbon([[38,10],[42,24],[43,36],[46,46],[52,53]],[14,14,14,14,13]),MU,{k:.12,sh:mix(MU,INK,.35),marks:rows(0,64,10,64,7)});
  b.sh(E(32,11,11,5,14),MU,{hatch:0,hl:0,lw:.9,marks:[{pts:[[18,9],[46,9],[46,12],[18,12]],fill:RU,k:0}]});
  fringe([[48,58,-.5],[51,58.6,.4],[54,58.4,1.2],[57,57,1.8],[59,54.6,2.2]],RU);
  b.ex('spark',8,10,3.4);b.ex('heart',57,14,2.8);
  leafA(b,54,30,5.4,.4,'#E46F6B',0,{lw:.4,dw:.5});
 },
 'Ghost Sheet'(b){
  b.sh(ghostP(32,33,48,54),'#FFFFFF',{k:.16,base:'#FFFFFF',sh:'#9FB2CC',ho:.4,hl:0,lw:1.05,marks:[{pts:E(42,44,14,12,12),fill:'#E9EFF7',op:.9}],
   inner:b.st(b.jl(20,26,18,52,.4)+b.jl(42,30,46,54,.4),'#C9D4E4',1,.8)});
  [[-1],[1]].forEach(([d])=>b.sh(E(32+d*8.6,27,4.2,5.4,12,d*.12),C.door,{hatch:0,hl:0,lw:.75,base:'#6E544A'}));
  b.raw(`<ellipse cx="18" cy="34" rx="3" ry="1.7" fill="${PINK}" opacity=".45"/><ellipse cx="46" cy="34" rx="3" ry="1.7" fill="${PINK}" opacity=".45"/>`,'top');
  b.ln([[29,38],[32,40],[35,38]],{w:1});
  b.raw(b.st('M54 50q4 -2 6 -6M56 56q4 -1 7 -4',GRAPH,1.2,.8),'top');
  tapeB(b,32,6,18,-8,'#D3C6F1');
  b.ex('spark',7,12,3.4);
 },
 'Pumpkin Suit'(b){
  const P2='#F29150';
  [[-13,13],[13,13]].forEach(([dx,rx])=>b.sh(E(32+dx,36,rx,19,16),P2,{hl:0,sh:'#C96E2A',ho:.4}));
  b.sh(E(32,36,13,21,18),PUMP,{sh:'#C96E2A',ho:.35,hlo:.45,inner:b.st(b.jl(25,18,24,54,.3)+b.jl(39,18,40,54,.3),'#C96E2A',.9,.5)});
  // leg holes and arm holes
  [[22,53],[42,53]].forEach(([x,y])=>b.sh(E(x,y,6.4,3.4,12),'#8E5A44',{hatch:0,hl:0,lw:.8,base:'#7A4A33'}));
  [[7,33],[57,33]].forEach(([x,y])=>b.sh(E(x,y,3,5.4,10),'#8E5A44',{hatch:0,hl:0,lw:.8,base:'#7A4A33'}));
  b.sh(E(32,18,8,3,14),'#7A4A33',{hatch:0,hl:0,lw:.8,base:'#5E3A28'});
  // the leaf collar around the neck
  [[-2.5,LEAF],[-1.9,LEAFD],[-1.25,LEAF],[-.64,LEAFD]].forEach(([a,c])=>{const x=32+Math.cos(a)*8,y=18+Math.sin(a)*3;b.sh(leafP(x,y,11,6.4,a+(a<-1.57?-.2:.2)),c,{hatch:0,hl:0,lw:.7,dr:.2,det:[[[x,y],[x+Math.cos(a)*8,y+Math.sin(a)*8]]],dw:.55})});
  b.sh(E(32,18,8,3,14),'#8E8A4A',{hatch:0,hl:0,lw:.8,base:'#6E6A3A'});
  [[0,LEAFD],[3.14,LEAF],[.5,LEAF],[2.64,LEAFD]].forEach(([a,c])=>{const x=32+Math.cos(a)*7,y=19+Math.sin(a)*3;b.sh(leafP(x,y,9,5.4,a+.35*(Math.cos(a)>0?1:-1)),c,{hatch:0,hl:0,lw:.65,dr:.2})});
  b.ex('spark',57,8,3.6);b.ex('heart',7,10,2.6);
 },
 'Parade Rosette'(b){
  // two ribbon tails, a crumpled pleated ring, a cream centre with a little ghost. It is a little bent
  b.sh([[25,38],[31,40],[26,61],[22,56],[17,60]],'#F29150',{k:.05,hatch:0,hl:0,lw:.85,inner:b.st(b.jl(25,42,21,56,.3),'#C96E2A',.8,.6)});
  b.sh([[35,40],[42,37],[49,58],[44,55],[40,60]],C.lavD,{k:.05,hatch:0,hl:0,lw:.85,inner:b.st(b.jl(39,42,44,55,.3),mix(C.lavD,INK,.25),.8,.6)});
  const ring=[];for(let i=0;i<36;i++){const a=i/36*Math.PI*2,f=(i%2?.82:1)*(1+.06*Math.sin(a*3+1));ring.push([31+Math.cos(a)*21*f,27+Math.sin(a)*19*f+(Math.cos(a)>.5?1.6:0)])}
  b.sh(ring,'#F9A35E',{k:.05,sh:'#C96E2A',ho:.4,hl:0});
  const ring2=[];for(let i=0;i<28;i++){const a=i/28*Math.PI*2,f=i%2?.84:1;ring2.push([31.4+Math.cos(a)*14*f,26.6+Math.sin(a)*13*f])}
  b.sh(ring2,'#F29150',{k:.05,hatch:0,hl:0,lw:.8});
  b.sh(E(31.6,26.8,9,8.4,16,.1),'#FFF2DA',{hatch:0,hl:0,lw:.9,base:'#FFF8EC'});
  ghostV(b,31.6,27.4,8,10,{lw:.5,lean:.08,nomouth:1});
  b.ex('spark',57,10,3.6,'#FFE07A');b.ex('dots',6,12,4);
 }
});

/* icons (64) */
Object.assign(ICONS,{
 festival(b){ // a maple leaf behind a little pumpkin
  const lf=rot([[28,4],[33,13],[40,11],[40,20],[49,23],[41,30],[43,39],[31,36],[28,44],[25,36],[13,39],[15,30],[7,23],[16,20],[16,11],[23,13]],-.32,28,26);
  b.ln(rot([[28,40],[28.6,47],[31,52]],-.32,28,26),{w:2.2});
  b.sh(lf,'#F28A4E',{k:.08,det:[rot([[28,11],[28,40]],-.32,28,26),rot([[28,27],[38,20]],-.32,28,26),rot([[28,27],[18,20]],-.32,28,26)],dw:1.1});
  b.ln([[44,37],[45,31],[48,28]],{w:2.4,col:'#7A7636'});
  [[37,47,9],[51,47,9]].forEach(([x,y,rx])=>b.sh(E(x,y,rx,10.5,14),'#F29150',{lw:.75}));
  b.sh(E(44,47,8.6,11.6,14),PUMP,{lw:.75});
 },
 parade(b){ // a paper ghost waving a little pennant
  b.ln([[48,40],[52,8]],{w:2.2,col:C.woodD});
  b.sh([[52,8],[62,13],[51.6,18]],C.orange,{k:.04,hatch:0,hl:0,lw:1});
  b.sh(ghostP(28,36,34,42,-.06),'#FFFFFF',{k:.16,base:'#FFFFFF',hatch:0,hl:0,lw:1.1,marks:[{pts:E(36,46,10,9,10),fill:'#E4ECF6'}]});
  b.sh([[40,40],[47,36],[50,40],[44,44]],'#FFFFFF',{k:.2,hatch:0,hl:0,lw:.9,base:'#fff'});
  b.dot(22,30,2.4);b.dot(33,29.4,2.4);b.raw(`<ellipse cx="28" cy="37.6" rx="2" ry="2.6" fill="${INK}"/>`,'top');
 }
});


/* v2.5: the v2.4 and v2.5 foods drawn in the dog bowl (prop bowl {food}, 120x120), the food heaped in the bowl like the older bowl foods */
const BOWL25=['Carrot Sticks','Apple Slices','Blueberry Bites','Seedless Watermelon Cubes','Sweet Potato Chews','Pumpkin Purée','Turkey Meatballs','Frozen Pupsicle',
  'Baked Pumpkin Wedges','Sweet Potato Coins','Warm Bone Broth','Ghost Biscuits','Candy Corn Carrots','Monster Meatball'];
BOWL25.forEach(n=>BOWL_FOODS.push(n));
// spots on the heap, back rows first
const HEAP=[[60,40],[46,43],[74,43],[34,49],[60,47],[86,49],[26,57],[47,53],[72,54],[94,57],[36,61],[60,59],[84,62]];
const heapBase=(b,col)=>b.sh([[18,64],[26,50],[42,41],[60,38],[78,41],[94,50],[102,64],[60,70]],col,{hatch:0,hl:0,lw:.8});
const steamB=(b)=>{b.ln([[48,34],[45,28],[49,22],[46,15]],{w:1.4,col:GRAPH});b.ln([[70,32],[73,26],[69,20],[72,13]],{w:1.4,col:GRAPH})};
const _bowlFood25=bowlFood;
bowlFood=function(b,food){
  if(!BOWL25.includes(food))return _bowlFood25(b,food);
  const r=b.r;
  b.shadow(60,99,48,6);
  if(food==='Warm Bone Broth'||food==='Baked Pumpkin Wedges'||food==='Turkey Meatballs')steamB(b);
  if(food==='Frozen Pupsicle'){flake(b,14,34,5,'#8FB4D4',1.6);flake(b,104,30,4.4,'#8FB4D4',1.6)}
  bowl(b,60,62,45,12,32,C.pink,'#E58FA5',()=>{
   if(food==='Carrot Sticks'){heapBase(b,'#F9BE86');
     [[34,-.55],[44,-.3],[54,-.08],[64,.1],[74,.32],[84,.55],[49,-.2],[69,.22]].forEach(([x,a],i)=>{const yt=i>5?34:24+Math.abs(x-60)*.3;
      b.sh(rot(RR(x-4,yt,8,40,3.6),a,x,yt+36),ORNG,{hatch:0,hl:0,lw:.8,base:'#F9BE86',det:[rot([[x-2,yt+9],[x+1.2,yt+9.6]],a,x,yt+36),rot([[x-2,yt+19],[x+1.4,yt+19.6]],a,x,yt+36)],dw:.8,dcol:'#C96E2A'})});
     b.sh(leafP(58,30,12,6,-1.9),LEAF,{hatch:0,hl:0,lw:.6})}
   else if(food==='Apple Slices'){heapBase(b,'#E9C98E');
     HEAP.slice(0,10).forEach(([x,y],i)=>{const a=(i%3-1)*.5+(r()-.5)*.4,out=[],inn=[];for(let j=0;j<=10;j++){const t=Math.PI*(1+j/10);out.push([x+Math.cos(t)*11,y+4+Math.sin(t)*9])}
      for(let j=10;j>=0;j--){const t=Math.PI*(1+j/10);inn.push([x+Math.cos(t)*8.6,y+4+Math.sin(t)*6.8])}
      b.sh(rot(out,a,x,y),'#FFE9B0',{k:.15,hatch:0,hl:0,lw:.8,base:'#FFF4D6',marks:[{pts:rot(out.concat(inn),a,x,y),fill:C.redD}]})});
     b.ln([[60,32],[61,24]],{w:1.6,col:'#8E6446'});b.sh(leafP(61,26,11,5.6,-.5),LEAF,{hatch:0,hl:0,lw:.6})}
   else if(food==='Blueberry Bites'){heapBase(b,'#C9CFF2');
     [[30,60],[40,59],[50,60],[60,61],[70,60],[80,59],[90,61],[35,52],[45,51],[55,52],[65,52],[75,51],[85,53],[41,44],[51,43],[61,44],[71,43],[80,46],[48,36],[58,35],[68,36],[60,28]].forEach(([x,y])=>berryV(b,x,y,5.4));
     b.sh(leafP(64,24,11,5.6,-.6),LEAF,{hatch:0,hl:0,lw:.6})}
   else if(food==='Seedless Watermelon Cubes'){heapBase(b,'#FCC6D2');
     const F=C.rose,S=mix(C.rose,C.redD,.5);[[24,54],[40,56],[58,57],[76,55],[32,44],[50,46],[68,45],[84,48],[42,35],[60,36],[52,26]].forEach(([x,y])=>cubeV(b,x,y,9,'#FCC6D2',F,S))}
   else if(food==='Sweet Potato Chews'){heapBase(b,'#E8A99A');
     [[30,-.9],[40,-.5],[50,-.2],[60,.05],[70,.3],[80,.6],[90,.95],[45,-.35],[66,.2],[56,-.05]].forEach(([x,a],i)=>{const y=i>6?44:56-Math.max(0,12-Math.abs(x-60)*.35);
      b.sh(rot([[x-4,y-14],[x+3.6,y-15],[x+4.6,y+10],[x-3.4,y+11]],a+1.57*(i%2),x,y),['#C97E68','#B96B52','#D98E6E'][i%3],{k:.2,hatch:0,hl:0,lw:.8,det:[rot([[x-1,y-8],[x+1,y+2]],a+1.57*(i%2),x,y)],dw:.7,dcol:'#8E5A44'})})}
   else if(food==='Pumpkin Purée'){
     b.sh([[20,64],[28,52],[42,43],[60,40],[78,43],[92,52],[100,64],[60,70]],PUMP,{base:'#FBC28A',sh:'#C96E2A',hlo:.5,
      inner:b.st('M30 58q8 -8 16 -2t16 -4t16 2t12 6M40 50q8 -6 16 -2t14 -2','#E07B33',1.3,.85)});
     b.sh(cloudP(60,40,7,4,5,.3,20),'#FBC28A',{hatch:0,hl:0,lw:.7});b.sh(leafP(62,38,10,5.4,-2.2),LEAF,{hatch:0,hl:0,lw:.6});b.sh(leafP(62,38,10,5.4,-1),LEAFD,{hatch:0,hl:0,lw:.6})}
   else if(food==='Turkey Meatballs'||food==='Monster Meatball'){b.sh(cloudP(60,60,38,9,7,.25,40),'#E8B48A',{noline:1,hatch:0,hl:0});
     if(food==='Turkey Meatballs')[[30,58,9],[48,59,9.6],[68,59,9.6],[88,58,9],[38,46,9.2],[58,45,10],[78,46,9.2],[58,33,9]].forEach(([x,y,rr])=>{
      b.sh(E(x,y,rr,rr*.9,14),'#C9895B',{hatch:0,hl:0,lw:.8,base:'#D9A27A',marks:[{pts:E(x-rr*.3,y-rr*.35,rr*.42,rr*.26,8),fill:'#E6B48C'}]});b.dot(x+rr*.25,y+rr*.2,.8,'#8E5A44')});
     else{b.sh(cloudP(60,40,27,23,9,.08,44),'#C9895B',{k:.18,hl:0,lw:.95,base:'#D9A27A',sh:'#8E5A44',ho:.35,marks:[{pts:E(50,32,9,5.6,10,-.4),fill:'#E6B48C'}]});
      b.sh(E(60,37,11,10,16),ORNG,{hatch:0,hl:0,lw:.8,base:'#F9BE86',marks:[{pts:E(60,37,7.4,6.8,14),fill:'#F9B97A'}],inner:b.st('M60 30v14M53 37h14M55 32l10 10M65 32l-10 10','#E07B33',.8,.6)});
      b.dot(61,38,3.8);b.dot(62.2,36.6,1.2,'#fff');b.ln([[50,52],[60,55],[70,52]],{w:1.3});
      [[-.5,-1.9],[0,-2.2],[.5,-1.8]].forEach(([dx,a],i)=>b.sh(leafP(60+dx*10,20,9,4.6,a),i===1?LEAFD:LEAF,{hatch:0,hl:0,lw:.6}))}}
   else if(food==='Frozen Pupsicle'){heapBase(b,'#E3F2FC');
     // the pupsicle lying across the bowl, its stick over the rim
     const T=pts=>rot(pts,-.32,60,48);
     b.sh(T(RR(84,44,30,7,3.4)),'#E9C9A0',{hatch:0,hl:0,lw:.8});
     b.sh(T(RR(26,32,60,30,14)),'#FFF8EC',{base:'#FFFFFF',sh:'#B9C3D6',ho:.35,marks:[{pts:T([[38,28],[46,28],[46,66],[38,66]]),fill:'#F7B2C4',k:0,op:.85},{pts:T([[60,28],[67,28],[67,66],[60,66]]),fill:'#F7B2C4',k:0,op:.7}]});
     T([[34,40],[52,52],[56,40],[74,46]]).forEach(([x,y])=>berryV(b,x,y,3.2))}
   else if(food==='Baked Pumpkin Wedges'){heapBase(b,'#FBC28A');
     HEAP.slice(0,10).forEach(([x,y],i)=>{const a=(i%3-1)*.45+(r()-.5)*.3,out=[],inn=[];for(let j=0;j<=10;j++){const t=Math.PI*(1+j/10);out.push([x+Math.cos(t)*12,y+5+Math.sin(t)*11])}
      for(let j=10;j>=0;j--){const t=Math.PI*(1+j/10);inn.push([x+Math.cos(t)*9.4,y+5+Math.sin(t)*8.2])}
      b.sh(rot(out,a,x,y),PUMP,{k:.14,hatch:0,hl:0,lw:.8,base:'#FBC28A',marks:[{pts:rot(out.concat(inn),a,x,y),fill:'#E07B33'}],inner:b.st(b.jl(x-4,y-1,x+3,y-2.4,.3),'#FFE3C0',1.3,.9)})})}
   else if(food==='Sweet Potato Coins'){heapBase(b,'#D99278');
     HEAP.forEach(([x,y],i)=>{const a=(r()-.5)*.5;b.sh(E(x,y+2,10,5.6,16,a),'#B96B52',{hatch:0,hl:0,lw:.7,dr:.2});
      b.sh(E(x,y,10,5.6,16,a),SWP,{hatch:0,hl:0,lw:.7,dr:.2,base:'#D99278',marks:[{pts:E(x,y-.2,8.6,4.6,14,a),fill:'#F9A35E'}]})})}
   else if(food==='Warm Bone Broth'){b.sh(E(60,63,39,8.8,22),'#F2C96B',{hatch:0,hl:0,lw:.7,base:'#F8D98E'});
     b.loop(E(60,63,26,5.6,18),{w:.8,col:'#C9962E',op:.6});b.loop(E(60,63,13,2.8,14),{w:.9,col:'#fff',op:.8});
     [[38,62,1.6],[78,64,1.4],[56,60,1.1],[70,66,1.2]].forEach(([x,y,rr])=>b.raw(`<ellipse cx="${x}" cy="${y}" rx="${rr*1.6}" ry="${rr}" fill="#FFF3C2" opacity=".9"/>`));
     b.ln([[30,62],[38,61]],{w:1.1,col:'#fff'});b.ln([[82,65],[90,64.5]],{w:1.1,col:'#fff'})}
   else if(food==='Ghost Biscuits'){heapBase(b,'#F3DDB4');
     [[34,56,1],[60,58,1.05],[86,56,1],[46,44,1.05],[74,44,1.05],[60,32,1]].forEach(([x,y,s])=>{b.sh(E(x,y,15*s,11*s,16),'#E8C597',{hatch:0,hl:0,lw:.8,base:'#F3DDB4',sh:'#C99A72'});
      ghostV(b,x,y-1,13*s,14*s,{lw:.45})})}
   else if(food==='Candy Corn Carrots'){heapBase(b,'#F9BE86');
     HEAP.forEach(([x,y],i)=>{const a=(r()-.5)*1.4,s=1.25,P=[[x-7.6*s,y+8*s],[x-6.4*s,y+9.6*s],[x+6.4*s,y+9.6*s],[x+7.6*s,y+8*s],[x+1.8*s,y-9*s],[x-1.8*s,y-9*s]];
      b.sh(rot(P,a,x,y),'#F59E52',{k:.16,hatch:0,hl:0,lw:.8,dr:.15,base:'#F9BE86',
       marks:[{pts:rot([[x-10*s,y+3*s],[x+10*s,y+3*s],[x+10*s,y+11*s],[x-10*s,y+11*s]],a,x,y),fill:'#D9682A',k:0},{pts:rot([[x-6*s,y-3.6*s],[x+6*s,y-3.6*s],[x,y-12*s]],a,x,y),fill:'#FFD0A8',k:0}]})})}
  });
  b.tx(60,90,'DOG',17,{mid:1});
};

/* ---------- public API ---------- */
const lab=s=>esc(s);
PA.icon=function(name){return serve('i:'+name,()=>{const f=ICONS[name];if(!f)return fallback('icon',name,'0 0 64 64');const b=mk('icon',name);f(b);return b.svg('0 0 64 64','',lab(name)+' icon')})};
PA.item=function(name){return serve('t:'+name,()=>{const f=ITEMS[name];if(!f)return fallback('item',name,'0 0 64 64');const b=mk('item',name);f(b);return b.svg('0 0 64 64','',lab(name))})};
PA.collectible=function(name){return serve('c:'+name,()=>{const f=COLS[name];if(!f)return fallback('collectible',name,'0 0 60 60');const b=mk('col',name);f(b);return b.svg('0 0 60 60','',lab(name))})};
const PROP_VB={'treat-bit':'0 0 20 20',bulletin:'0 0 160 140',poop:'0 0 60 50',pee:'0 0 100 30',flies:'0 0 60 40',crop:'0 0 160 120',plot:'0 0 160 120',oven:'0 0 160 160',dial:'0 0 160 160',board:'0 0 200 120','recipe-card':'0 0 200 260',iou:'0 0 120 80',pip:'0 0 160 200',speech:'0 0 200 120',panel:'0 0 300 200',tape:'0 0 120 30','torn-map':'0 0 240 160','puzzle-board':'0 0 240 160','puzzle-lid':'0 0 60 60','tug-rope-long':'0 0 300 60',nursery:'0 0 320 170',mailbox:'0 0 120 160',postcard:'0 0 300 200',playboard:'0 0 300 220',familytree:'0 0 600 380',coatframe:'0 0 120 140',ultrasound:'0 0 240 160',sparklejar:'0 0 120 160',crayonbox:'0 0 200 160',photoframe:'0 0 160 140',doggyramp:'0 0 200 120',rockingchair:'0 0 160 160',album:'0 0 600 380',easel:'0 0 160 200',sniffer:'0 0 200 140'};
PA.prop=function(name,o){
  const opt=name==='torn-map'?{pieces:[...new Set(((o&&o.pieces)||[]).filter(q=>MAPQ[q]))].sort()}:name==='bowl'?{food:o&&BOWL_FOODS.includes(o.food)?o.food:''}
   :name==='crop'?{crop:o&&CROP_LABEL[o.crop]?o.crop:'',stage:Math.max(0,Math.min(3,(o&&o.stage|0)||0)),dry:!!(o&&o.dry)}
   :name==='hand-signal'?{trick:o&&TRICKS.includes(o.trick)?o.trick:'sit'}
   :name==='poop'?{fresh:!!(o&&o.fresh)}
   :name==='mailbox'?{flag:!!(o&&o.flag),count:Math.max(0,Math.min(99,(o&&o.count|0)||0))}:name==='coatframe'?{found:!(o&&o.found===false)}
   :name==='sparklejar'?{fill:Math.max(0,Math.min(24,(o&&o.fill|0)||0))}:name==='album'?{found:Array.from({length:12},(_,i)=>!!(o&&Array.isArray(o.found)&&o.found[i]))}
   :name==='plot'?{water:Math.max(0,Math.min(3,(o&&o.water|0)||0))}:null;
  const key=name+(opt?':'+Object.values(opt).map(v=>Array.isArray(v)?v.join(','):v).join(':'):'');
  return serve('p:'+key,()=>{const f=PROPS[name],vb=PROP_VB[name]||'0 0 120 120';
  if(!f)return fallback('prop',name,vb);const b=mk('prop',key);f(b,opt||{});return b.svg(vb,(name==='speech'||name==='panel'||name==='recipe-card')?' preserveAspectRatio="none"':'',lab(opt&&opt.food?opt.food+' bowl':opt&&opt.crop?opt.crop+' stage '+opt.stage:name))})};
PA.house=function(name){return serve('h:'+name,()=>{const f=HOUSES[name];if(!f)return fallback('house',name,'0 0 240 200');const b=mk('house',name);f(b);return b.svg('0 0 240 200','',lab(name),true)})};
// v2.4: the missions card, the stamp card and Gerald normalise their options and cache per option set
Object.assign(PROP_VB,{missioncard:'0 0 200 260',stampcard:'0 0 240 140',gerald:'0 0 160 160'});
const GER_POSES=['point','wave','sit','cheer'],_prop24=PA.prop;
PA.prop=function(name,o){
  let opt,lbl;
  if(name==='missioncard'){
    const it=(o&&Array.isArray(o.items)?o.items:[]).slice(0,3).map(t=>({text:String(t&&t.text!=null?t.text:''),done:!!(t&&t.done),p:Math.max(0,(t&&t.p|0)||0),n:Math.max(0,(t&&t.n|0)||0)}));
    opt={items:it,stamps:Math.max(0,Math.min(7,(o&&o.stamps|0)||0)),day:esc(o&&o.day!=null?o.day:'')};lbl='Missions card';
  }else if(name==='stampcard'){opt={stamps:Math.max(0,Math.min(7,(o&&o.stamps|0)||0))};lbl='Stamp card, '+opt.stamps+' of 7'}
  else if(name==='gerald'){opt={pose:o&&GER_POSES.includes(o.pose)?o.pose:'point'};lbl='Gerald the duck'}
  else return _prop24(name,o);
  return serve('p:'+name+':'+JSON.stringify(opt),()=>{const b=mk('prop',name);PROPS[name](b,opt);return b.svg(PROP_VB[name],name==='gerald'?` data-pose="${opt.pose}"`:'',lbl)});
};
Object.assign(PROP_VB,{leafpile:'0 0 160 100',stall:'0 0 240 220',paradebanner:'0 0 400 90',jackolantern:'0 0 80 80',leafdrift:'0 0 120 40'});
const _prop25=PA.prop;
PA.prop=function(name,o){
  let opt,lbl,seed=name;
  if(name==='leafpile'){opt={state:o&&o.state==='scattered'?'scattered':'full',seed:Math.abs((o&&o.seed)|0)%64};seed=name+':'+opt.seed;lbl=opt.state==='scattered'?'Scattered leaf pile':'Leaf pile'}
  else if(name==='stall'){opt={kind:o&&o.kind==='halloween'?'halloween':'leaf'};seed=name+':'+opt.kind;lbl='Harvest Stall'+(opt.kind==='halloween'?' at Halloween':'')}
  else if(name==='jackolantern'){opt={lit:!!(o&&o.lit)};lbl=opt.lit?'Lit jack-o-lantern':'Jack-o-lantern'}
  else if(name==='paradebanner'){opt={};lbl='Costume Parade banner'}
  else if(name==='leafdrift'){opt={};lbl='Fallen leaves'}
  else return _prop25(name,o);
  return serve('p:'+name+':'+JSON.stringify(opt),()=>{const b=mk('prop',seed);PROPS[name](b,opt);
    return b.svg(PROP_VB[name],name==='leafpile'?` data-state="${opt.state}"`:name==='stall'?` data-kind="${opt.kind}"`:name==='jackolantern'?` data-lit="${opt.lit?1:0}"`:'',lbl)});
};
if(typeof document!=='undefined'&&!document.getElementById('pawart-world-b-v24-css')){
  const st=document.createElement('style');st.id='pawart-world-b-v24-css';
  st.textContent='.pa-wb .pa-wb-gf1,.pa-wb .pa-wb-gf2{opacity:0}.pa-wb .pa-wb-gf0{animation:pa-wb-g0 1s steps(1,end) infinite}.pa-wb .pa-wb-gf1{animation:pa-wb-g1 1s steps(1,end) infinite}.pa-wb .pa-wb-gf2{animation:pa-wb-g2 1s steps(1,end) infinite}'+
    '@keyframes pa-wb-g0{0%{opacity:1}33.333%{opacity:0}100%{opacity:0}}@keyframes pa-wb-g1{0%{opacity:0}33.333%{opacity:1}66.666%{opacity:0}100%{opacity:0}}@keyframes pa-wb-g2{0%{opacity:0}66.666%{opacity:1}100%{opacity:1}}'+
    'html[data-motion="off"] .pa-wb [class^="pa-wb-gf"],.pa-still .pa-wb [class^="pa-wb-gf"]{animation:none!important}html[data-motion="off"] .pa-wb .pa-wb-gf0,.pa-still .pa-wb .pa-wb-gf0{opacity:1}'+
    '@media (prefers-reduced-motion: reduce){.pa-wb [class^="pa-wb-gf"]{animation:none!important}.pa-wb .pa-wb-gf0{opacity:1}}';
  document.head.appendChild(st);
}
PA._wbFlush=()=>{for(const k in CACHE)delete CACHE[k]};
PA.WORLD_B={beds:Object.keys(BEDS),obstacles:Object.keys(OBS),bowlFoods:BOWL_FOODS.slice(),icons:Object.keys(ICONS),items:Object.keys(ITEMS),houses:Object.keys(HOUSES),collectibles:Object.keys(COLS),props:Object.keys(PROPS)};

if(typeof document!=='undefined'&&!document.getElementById('pawart-world-b-css')){
  const st=document.createElement('style');st.id='pawart-world-b-css';
  st.textContent='.pa-wb{display:block;overflow:visible}.pa-wb text{font-family:'+FONT+';user-select:none}';
  document.head.appendChild(st);
}
})();
