/* Doodle Doggo world art, module SHOP (v2.24 "Kind shop", docs/design/kind-shop.md): the kind shop's items. Drawn as a preview on 3 Nov 2026 (the owner
   approved the direction), in the build from v2.24 (game/build.js, tools/build.pl: after the other worlds, inline, as it wraps world B's lookups).
   Style G "Doodle sketch" like world B: coloured-pencil washes inside two-stroke tapered pencil outlines, light diagonal hatching, sparkles.
   The pencil kit (mk, serve, the shape generators, paw, ground, shingles, tuft, tinyFlower, tapeB) is copied from world B (pawart_world_b.js
   lines 32-224), ids prefixed pws. Every colour fill stays inside its own outline (the kit's fillIn / pinIn, owner's rule of 25 Oct 2026).
   The wearables (Golden Name Tag, the Tokyo Street set, the Little Sneakers' feet slot) are drawn by the dog renderer: dogs/pawart_dogs.js, v2.24 section.
   Through the world's own lookups (each falls through to the older modules for any other name):
   PawArt.house('Golden Paw Cottage')  the Supporter House, 240x200, ground y=190, door centred at x=120; at night its panes glow (.pa-wb-glow)
   PawArt.bed('Tea-Cosy Bed')          260x160, floor y=152, the front lip in <g class="pa-bed-front">, data-bed like every bed
   PawArt.prop(id, o)                  the Cozy Winter decor, by the game's HM_DECOR prop ids: ksrug 'Cable-Knit Rug' 240x80 (flat floor rug),
                                       kslamp 'Cocoa Mug Lamp' 100x140 {lit}, ksglobe 'Doggy Snow Globe' 120x140, ksfireplace 'Cardboard Fireplace' 160x160,
                                       ksarmchair 'Woolly Armchair' 160x150; ksrobo: the Robo Scoop rolling in the yard, 60x50, {k: 0..2} (wheels turn, antenna nods)
   PawArt.item(name)                   64 item cards: the 7 wearables, the 5 decorations, the Tea-Cosy Bed, the Golden Paw Cottage
   PawArt.SHOP.prop(name)    the shop sheet's pictures: 'Golden Name Tag' 120x120, 'Founding Friend Badge' 120x120, 'Thank-You Letter' 140x120,
                             'Robo Scoop' 120x120, 'Garden Sprinkler' 120x120, 'Auto Water Bowl' 120x120, and the decor and bed by name (or by prop id)
                             (PawArt.SHOP.VB[name] holds each viewBox)
   PawArt.SHOP.icon(name)    64x64 icons: perks 'walkcoins' (a coin with a paw and an up arrow), 'cropsfast' (a sprout and a little clock), 'giftplus' (a gift box);
                             coin packs 'coins1', 'coins3', 'coins8' (a growing pile for the 1,000 / 3,000 / 8,000 packs), 'coins' (= coins3)
   PawArt.SHOP.house(name), .robo(k), .item(name)   the same art as above; PawArt.SHOP.NAMES lists the sets, .PROPS the prop ids
   PawArt.SHOP.frame(w,h,wash,seed), .tag(w,h,col,seed)  a crayon card frame and a price tag (any pixel size) */
window.PawArt = window.PawArt || {};
(function(){
'use strict';
// 25 Oct 2026: a closed outline P pulled in by dd (each point along its corner's inward normal; small shapes are pulled in less, so they never turn inside out)
// keep q inside the closed outline P: a point outside moves to the nearest point of P (the middle of its pencil line)
function pinIn(q,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c}if(c)return q;
  let best=q,bd=1e18;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],ex=b[0]-a[0],ey=b[1]-a[1],L2=ex*ex+ey*ey||1,t=Math.max(0,Math.min(1,((q[0]-a[0])*ex+(q[1]-a[1])*ey)/L2)),x=a[0]+ex*t,y=a[1]+ey*t,d=(x-q[0])**2+(y-q[1])**2;if(d<bd){bd=d;best=[x,y]}}return best}
function fillIn(P,dd,G){const n=P.length;if(n<3)return P;let a=0,x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;P.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});
  G=G&&G.length>2?G:P;G.forEach((p,i)=>{const q=G[(i+1)%G.length];a+=p[0]*q[1]-q[0]*p[1]});const sg=a>0?1:-1;dd=Math.min(dd,Math.min(x1-x0,y1-y0)/4);// which way is in: from the drawn points G (a smooth curve can loop past a thin shape's ends)
  return P.map((p,i)=>{const A=P[(i+n-1)%n],C=P[(i+1)%n],l1=Math.hypot(p[0]-A[0],p[1]-A[1])||1,l2=Math.hypot(C[0]-p[0],C[1]-p[1])||1;
    const nx=-((p[1]-A[1])/l1+(C[1]-p[1])/l2)*sg,ny=((p[0]-A[0])/l1+(C[0]-p[0])/l2)*sg,m=Math.hypot(nx,ny)||1;return[p[0]+nx/m*dd,p[1]+ny/m*dd]})}
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
const IDT='@PWS@';
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
      // the coloured-pencil wash. 25 Oct 2026 (owner: every colour fill stays inside its outline): no longer nudged off the line (the nudge and the
      // warp are still drawn from the stream, so nothing else moves): under a pencil line it is pulled in to the line's inner edge, else it sits on the shape
      const dr=cfg.drift*(o.dr??1);r();r();r();const In=o.noline?P:fillIn(P,cfg.W*(o.lw||1)*.5,c.pts);
      for(let k=0;k<P.length;k+=2){jt(1);jt(1)}const wp=o.noline?null:In.map(q=>pinIn(q,P));// every point, as straight steps (a smoothed corner would cut across a notch); where a smooth corner loops, the point is put back inside
      s+=`<path d="${wp&&wp.length>2?'M'+wp.map(q=>R1(q[0])+' '+R1(q[1])).join('L')+'Z':c.d}" fill="${fill}"${o.op?` opacity="${o.op}"`:''}/>`;
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
  b.tx=(x,y,str,size,o={})=>{(o.under?U:o.mid?L:T).push(`<text x="${x}" y="${y}" text-anchor="${o.anchor||'middle'}" font-family="${o.font||FONT}" font-size="${size}" font-weight="700" fill="${o.col||INK}"${o.rot?` transform="rotate(${o.rot} ${x} ${y})"`:''}${o.op?` opacity="${o.op}"`:''}>${str}</text>`);return b};
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
  if(t.indexOf(IDT)<0)return t;const u='pws'+(++UID).toString(36);return t.split(IDT).join(u)}
function paw(b,x,y,s,fill,o={}){ // paw print, s = pad radius-ish
  b.sh(rot([[x-s*1.05,y+s*.55],[x-s*.8,y-s*.2],[x,y-s*.55],[x+s*.8,y-s*.2],[x+s*1.05,y+s*.55],[x,y+s*.85]],o.a||0,x,y),fill,{hatch:0,hl:0,lw:o.lw,noline:o.noline});
  [[-1.2,-1.05],[-.42,-1.6],[.42,-1.6],[1.2,-1.05]].forEach(([dx,dy])=>{const p=rot([[x+dx*s,y+dy*s]],o.a||0,x,y)[0];
    b.sh(E(p[0],p[1],s*.36,s*.44,10,(o.a||0)+dx*.25),fill,{hatch:0,hl:0,lw:o.lw?o.lw*.8:.8,noline:o.noline})});
}
function sparkles(b,list){list.forEach(([t,x,y,s,c])=>b.ex(t,x,y,s,c))}
function ground(b,w){b.shadow(120,191,w,7);b.guide([[16,190.5],[120,189.6],[226,190.6]],false)}
function shingles(b,A,B,rows,gap,spacing){ // scallop rows parallel to the A->B edge, stepping inward by gap
  const dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy),ux=dx/L,uy=dy/L;let nx=-uy,ny=ux;if(ny<0){nx=-nx;ny=-ny}
  let d='';for(let r=1;r<=rows;r++){const o=r*gap;for(let s=(r%2)*spacing/2;s<L-2;s+=spacing){
    const x0=A[0]+ux*s+nx*o,y0=A[1]+uy*s+ny*o,x1=x0+ux*spacing,y1=y0+uy*spacing,mx=(x0+x1)/2+nx*spacing*.42,my=(y0+y1)/2+ny*spacing*.42;
    d+=`M${R1(x0)} ${R1(y0)}Q${R1(mx+(b.r()-.5))} ${R1(my+(b.r()-.5))} ${R1(x1)} ${R1(y1)}`}}
  return d;
}
function tinyFlower(b,x,y,s,col){b.sh(flowerP(x,y,s,5,b.r()),col,{hatch:0,hl:0,lw:.5,dr:.3});b.dot(x,y,s*.3,'#FFC94D')}
function tuft(b,x,y,s){b.ln([[x-s,y],[x-s*1.3,y-s*1.3]],{w:1.1,col:'#7FA65E'});b.ln([[x,y],[x,y-s*1.8]],{w:1.1,col:'#7FA65E'});b.ln([[x+s,y],[x+s*1.4,y-s*1.2]],{w:1.1,col:'#7FA65E'})}
const DOOR_O={base:'#6E544A',hatch:0,hl:0,lw:1.05};
function tapeB(b,x,y,w,a,col){const h=7;
  b.raw(`<g transform="rotate(${a} ${x} ${y})"><path d="M${x-w/2} ${y-h}l3 2.4-3 2.4 3 2.4-3 2.4 3 2.4L${x+w/2} ${y+h}l-3-2.4 3-2.4-3-2.4 3-2.4-3-2.4Z" fill="${col}" fill-opacity=".82"/><path d="M${x-w/2+4} ${y-3}H${x+w/2-4}M${x-w/2+4} ${y+3}H${x+w/2-4}" stroke="#fff" stroke-opacity=".6" stroke-width="1.8" stroke-dasharray="5 4"/></g>`,'top')}

/* ===================== the shop art ===================== */
CFG.bed={W:2.6,amp:.6,step:4.2,drift:1.6,hatch:1,hg:3.2,hw:1,ew:1.6,tw:1};
CFG.card={W:2.6,amp:.5,step:5,drift:1,hatch:0,hg:3,hw:1,ew:1.7};
const GLD='#F2C14E',GLDD='#C9962A',GLDL='#FFE9A8',GLDS='#FFDB75';
const FRONT0=b=>b.raw('<g class="pa-bed-front">'),FRONT1=b=>b.raw('</g>');
// knitted V stitches on a grid (clipped by the shape that carries them), from world B's wmKnit
function knit(x0,y0,x1,y1,dx,dy,s){let d='';for(let y=y0,j=0;y<=y1;y+=dy,j++)for(let x=x0+(j%2)*dx*.5;x<=x1;x+=dx){d+=`M${R1(x-s*.5)} ${R1(y-s*.45)}L${R1(x)} ${R1(y+s*.3)}L${R1(x+s*.5)} ${R1(y-s*.45)}`}return d}
// a paper flame: a teardrop with a wavy tip
const flameP=(x,yb,w,hh,lean)=>[[x-w*.5,yb],[x-w*.55,yb-hh*.35],[x-w*.25,yb-hh*.6],[x-w*.32,yb-hh*.82],[x+lean,yb-hh],[x+w*.3,yb-hh*.66],[x+w*.5,yb-hh*.4],[x+w*.48,yb]];
const HOUSE={},PROP={},ICON={},VB={};

/* ---------- 1. the Supporter Pack ---------- */
// The Supporter House 'Golden Paw Cottage': a round little cottage with a swooping blue bell roof (not a recolour of any kennel), gold trim along the
// eaves, a heart window in the gable, a golden paw weathervane, a chimney with a gold cap, a lantern by the door and a window box of flowers.
HOUSE['Golden Paw Cottage']=function(b){
  ground(b,110);
  // the chimney behind the roof
  b.sh(RR(150,44,22,40,2),'#E8A27A',{k:0,hatch:0,hl:0,lw:.9,base:'#F6CFB4',inner:b.st(b.jl(150,56,172,56,.3)+b.jl(150,68,172,68,.3)+b.jl(161,44,161,56,.3)+b.jl(156,56,156,68,.3)+b.jl(166,68,166,84,.3),'#B86B48',1,.5)});
  b.sh(RR(146,38,30,9,3),GLD,{k:0,hatch:0,hl:0,lw:.9,base:GLDL});
  // the walls: warm cream plaster, a soft bulge, pale timber lines, a stone foot
  b.sh([[50,190],[47,152],[52,116],[188,116],[193,152],[190,190]],'#FFF2DA',{k:.08,hl:0,sh:'#D9C29C',ho:.35,base:'#FFF8EC',
   inner:b.st(b.jl(52,128,188,128,.5)+b.jl(64,116,64,172,.5)+b.jl(176,116,176,172,.5),'#D9B98C',1.6,.55)});
  const st=[];[[58,181,9],[76,183,8],[94,180,7],[146,181,8],[163,183,9],[181,180,7]].forEach(([x,y,r])=>st.push({pts:E(x,y,r,5.4,12),fill:'#D8D2CC'}));
  b.sh([[48,190],[47,172],[193,172],[192,190]],C.stone,{k:.04,hatch:0,hl:0,lw:.9,base:'#F1ECE6',marks:st});
  b.raw('<g class="pa-wb-glow"><circle cx="120" cy="86" r="28" fill="#FFF3C2" opacity=".5"/><circle cx="70" cy="150" r="22" fill="#FFF3C2" opacity=".5"/><circle cx="165" cy="149" r="24" fill="#FFF3C2" opacity=".5"/><circle cx="88.5" cy="143" r="13" fill="#FFF3C2" opacity=".6"/></g>');
  // the roof: a swooping bell of blue scallop shingles
  b.sh([[18,128],[30,118],[52,100],[74,76],[96,50],[120,30],[144,50],[166,76],[188,100],[210,118],[222,128],[200,132],[160,128],[120,126],[80,128],[40,132]],'#7FA8DC',
   {k:.12,hl:0,sh:'#4E78AD',ho:.3,base:'#CADCF3',inner:b.st(shingles(b,[30,124],[118,36],3,10,16)+shingles(b,[122,36],[210,124],3,10,16),'#E9F1FB',1.6,.9)});
  // the gold trim along the eaves, with little gold beads
  b.sh(ribbon([[20,129],[50,131],[90,127],[120,125],[150,127],[190,131],[220,129]],[6,7,7,7,7,7,6]),GLD,{k:1/6,hatch:0,hl:0,lw:.85,base:GLDL});
  [[40,138],[62,135],[86,133],[154,133],[178,135],[200,138]].forEach(([x,y])=>b.sh(E(x,y,2.6,2.8,8),GLD,{k:0,hatch:0,hl:0,lw:.55,base:GLDL}));
  // the heart window in the gable, in a gold ring
  b.sh(E(120,84,19,19,24),GLD,{hatch:0,hl:0,lw:.9,base:GLDL});
  b.sh(heartP(120,86,22),'#FFE3A0',{hatch:0,hl:0,lw:.8,base:'#FFF4CC',marks:[{pts:E(113,80,4,3,8),fill:'#FFFFFF',op:.8}]});
  // the golden paw weathervane on the top
  b.ln([[120,32],[120.5,16]],{w:2.2,col:INK});b.ln([[108,25],[132,24]],{w:1.4,col:INK});
  paw(b,120,11,3.4,GLD,{lw:.6});
  // a round window on the left, a square one with a window box on the right
  b.sh(E(70,150,15,15,22),GLD,{hatch:0,hl:0,lw:.9,base:GLDL});
  b.sh(E(70,150,10.5,10.5,18),'#CFE8F8',{hatch:0,hl:0,lw:.8,base:'#EAF5FC',marks:[{pts:E(66,146,4,3,8),fill:'#FFFFFF',op:.8}],inner:b.st('M59 150H81M70 139V161',GLDD,1.6,.9)});
  b.sh(RR(150,136,30,26,3),GLD,{k:0,hatch:0,hl:0,lw:.9,base:GLDL});
  b.sh(RR(154,140,22,18,2),'#CFE8F8',{k:0,hatch:0,hl:0,lw:.8,base:'#EAF5FC',marks:[{pts:E(160,145,4,3,8),fill:'#FFFFFF',op:.8}],inner:b.st('M165 140V158M154 149H176',GLDD,1.6,.9)});
  b.sh(RR(146,161,38,9,2),C.woodD,{k:0,hatch:0,hl:0,lw:.85,base:C.wood});
  [[152,158,'#F28FA5'],[160,156,'#FFE08A'],[168,158,'#B9A6E8'],[176,156,'#F28FA5']].forEach(([x,y,c])=>{b.ln([[x,y+2],[x,y+5]],{w:1,col:'#7FA65E'});tinyFlower(b,x,y,4.2,c)});
  // at night the panes glow warm yellow (the yard shows .pa-wb-glow on #houseG.night only), each inside its own frame
  b.raw('<g class="pa-wb-glow">');
  b.sh(heartP(120,86,22),'#FFC94A',{hatch:0,hl:0,lw:.8,base:'#FFE27A',marks:[{pts:E(113,80,4,3,8),fill:'#FFF3C2',op:.9}]});
  b.sh(E(70,150,10.5,10.5,18),'#FFC94A',{hatch:0,hl:0,lw:.8,base:'#FFE27A',inner:b.st('M59 150H81M70 139V161',GLDD,1.6,.9)});
  b.sh(RR(154,140,22,18,2),'#FFC94A',{k:0,hatch:0,hl:0,lw:.8,base:'#FFE27A',inner:b.st('M165 140V158M154 149H176',GLDD,1.6,.9)});
  b.raw('</g>');
  // the door: a gold arch round a blue door, a gold paw on it and a round knob
  b.sh(arch(96,144,190,126),GLD,{hatch:0,hl:0,lw:.9,base:GLDL});
  b.sh(arch(103,137,190,134),'#5C84B8',Object.assign({},DOOR_O,{base:'#8FAFD8'}));
  paw(b,120,158,3.2,GLD,{lw:.6});b.dot(131,170,2.2,GLDD);
  // the lantern by the door
  b.ln([[91,126],[91,132],[89,132]],{w:1.4,col:INK});
  b.sh(RR(84,136,9,14,2),'#FFE59A',{k:0,hatch:0,hl:0,lw:.8,base:'#FFF6D0',inner:b.st('M84 143H93',GLDD,1.2,.8)});
  b.sh([[82,137],[88.5,131],[95,137]],GLD,{k:0,hatch:0,hl:0,lw:.7,base:GLDL});
  // stepping stones to the door, sparkles
  [[112,194],[128,195]].forEach(([x,y])=>b.sh(E(x,y,7,2.6,10),C.stone,{k:.1,hatch:0,hl:0,lw:.6}));
  b.ex('spark',22,70,6.4,'#FFE07A');b.ex('spark',214,56,5,'#FFE07A');b.ex('heart',196,160,4.6);b.ex('spark',36,168,3.6,'#FFE07A');tuft(b,40,190,3.4);tuft(b,200,190,3);
  b.ex('heart',178,28,4,'#F7B2C4');
};
VB['Golden Name Tag']='0 0 120 120';
PROP['Golden Name Tag']=function(b){b.shadow(60,108,34,4);
  // a gold bone tag on a little split ring; an engraved paw and a pink heart
  b.sh(boneP(60,72,94,46,-.1),GLD,{sh:GLDD,ho:.4,base:GLDL,marks:[{pts:boneP(60,72,74,30,-.1),fill:GLDS,op:.85}]});
  b.sh(E(60,58,4,4,10),'#FFF8E6',{k:0,hatch:0,hl:0,lw:.7,base:'#FFF8E6'});
  b.loop(E(60,47,10,10,18),{w:2.6,col:'#A88B4A'});b.loop(E(61,47,8,8,16),{w:1,col:'#E8D9A8'});
  paw(b,52,76,4.6,GLDD,{lw:.55});
  b.sh(heartP(74,78,13),'#F28FA5',{hatch:0,hl:0,lw:.6,base:'#FBD3DC'});
  b.ex('spark',96,46,6,'#FFE07A');b.ex('spark',20,52,4.4,'#FFE07A');b.ex('glint',36,64,6);
};
VB['Founding Friend Badge']='0 0 120 120';
PROP['Founding Friend Badge']=function(b){
  // two ribbon tails under a gold scalloped rosette: a cream middle with a crayon heart and a white paw
  b.sh([[50,70],[60,74],[50,114],[44,106],[36,112]],C.pinkD,{k:.02,hl:0,hatch:0,lw:.85,base:'#FBD3DC'});
  b.sh([[60,74],[70,70],[84,112],[76,106],[70,114]],'#7FB3E0',{k:.02,hl:0,hatch:0,lw:.85,base:'#D3E6F7'});
  b.sh(cloudP(60,50,40,40,14,.12,84),GLD,{sh:GLDD,ho:.4,base:GLDL});
  b.loop(E(60,50,31,31,26),{w:1.2,col:GLDD,op:.8});
  b.sh(E(60,50,27,27,26),'#FFF6E6',{hatch:0,hl:0,lw:.85,base:'#FFFFFF'});
  b.sh(heartP(60,52,34),'#F7A1B5',{hatch:0,hl:0,lw:.75,base:'#FBD3DC'});
  paw(b,60,55,4.2,'#FFFFFF',{lw:.55});
  b.ex('spark',100,22,6,'#FFE07A');b.ex('spark',16,26,4.4,'#FFE07A');b.ex('glint',40,30,6);
};
VB['Thank-You Letter']='0 0 140 120';
PROP['Thank-You Letter']=function(b){b.shadow(70,112,56,4);
  // the inside of the opened kraft envelope, a postcard sliding out with a crude crayon Gerald (a yellow duck), a heart and scribbled lines
  b.sh([[14,50],[126,50],[126,108],[14,108]],'#D9B27C',{k:.02,hatch:0,hl:0,lw:.9,base:'#E7C79A'});
  b.sh([[14,50],[70,18],[126,50]],'#E2BE8A',{k:.02,hatch:0,hl:0,lw:.85,base:'#F0D4A8'});
  const PC=rot(RR(28,14,86,60,3,2),-.08,70,44);
  b.sh(PC,'#FFFDF5',{k:.04,hatch:0,hl:0,lw:.85,base:'#FFFFFF',inner:b.st(b.jl(72,30,104,28,.6)+b.jl(72,38,102,36,.6)+b.jl(72,46,98,44,.6),GRAPH,1.4,.8)});
  b.sh(E(42,50,13,7,14),'#B98A5E',{k:.1,hatch:0,hl:0,lw:.75,base:'#D9B48E'});
  b.sh(E(48,36,9,8.4,14),'#5FA05A',{k:.1,hatch:0,hl:0,lw:.8,base:'#A9D6A0'});b.ln([[42,43],[54,43]],{w:1.8,col:'#FFFFFF'});
  b.sh([[55,35],[65,37],[55,40]],'#F9A23C',{k:0,hatch:0,hl:0,lw:.6});b.dot(50,33,1.4,INK);
  b.ex('heart',100,56,4.4,'#F28FA5');
  // the front pocket of the envelope and its red heart seal
  b.sh([[14,58],[70,86],[126,58],[126,108],[14,108]],'#E8C597',{k:.02,hl:0,sh:'#C09A68',ho:.35,base:'#F3DDB0',det:[[[14,108],[60,82]],[[126,108],[80,82]]],dcol:'#C09A68',dw:1.1});
  b.sh(E(70,86,10,9,14),'#D7263D',{k:.15,hatch:0,hl:0,lw:.8,base:'#F08A86'});
  b.sh(heartP(70,87,10),'#F7A1B5',{hatch:0,hl:0,lw:.5,base:'#FBD3DC'});
  b.ex('spark',130,22,5,'#FFE07A');b.ex('dots',8,30,5);
};
// the perk icons (64 box, bold icon lines)
ICON.walkcoins=function(b){
  b.sh(E(26,38,19,19,22),GLD,{hatch:0,hl:0,base:GLDL,marks:[{pts:E(26,38,13,13,18),fill:GLDS,op:.9}]});
  paw(b,26,40,3.4,GLDD,{lw:.5});
  b.sh([[44,58],[44,30],[37,30],[50,10],[63,30],[56,30],[56,58]],'#7FB86A',{k:0,hatch:0,hl:0,base:'#C9E6B4'});
};
ICON.cropsfast=function(b){
  b.sh(E(26,54,22,7,18),'#B98A5E',{k:.1,hatch:0,hl:0,base:'#D9B48E'});
  b.ln([[26,52],[26,34]],{w:2.6,col:'#5E9E3A'});
  b.sh(leafP(26,38,18,11,-2.5),'#7FB86A',{k:.2,hatch:0,hl:0,base:'#C9E6B4'});b.sh(leafP(26,34,17,10,-.6),'#9CCB86',{k:.2,hatch:0,hl:0,base:'#D6EEC8'});
  b.sh(E(47,22,13,13,18),'#FFFDF5',{hatch:0,hl:0,base:'#FFFFFF'});
  b.ln([[47,22],[47,14]],{w:2,col:INK});b.ln([[47,22],[53,25]],{w:2,col:INK});
  b.ln([[30,10],[38,10]],{w:1.6,col:GRAPH});b.ln([[28,16],[34,16]],{w:1.6,col:GRAPH});
};
ICON.giftplus=function(b){
  b.sh(RR(14,30,36,26,2),'#F7A1B5',{k:0,hatch:0,hl:0,base:'#FBD3DC',marks:[{pts:[[29,30],[35,30],[35,56],[29,56]],fill:'#7FB3E0',k:0}]});
  b.sh(RR(11,23,42,10,2),'#F28FA5',{k:0,hatch:0,hl:0,base:'#FBD3DC',marks:[{pts:[[29,23],[35,23],[35,33],[29,33]],fill:'#7FB3E0',k:0}]});
  [-1,1].forEach(d=>b.sh([[32,23],[32+d*13,12],[32+d*14,22]],'#7FB3E0',{k:.1,hatch:0,hl:0,base:'#D3E6F7'}));
  b.ex('spark',54,14,5,'#FFE07A');
};

/* ---------- 2. the paid tools (comfort only) ---------- */
VB['Robo Scoop']='0 0 120 120';
PROP['Robo Scoop']=function(b){b.shadow(58,106,46,5);
  // a round mint robot on two little wheels: a dark screen with happy eyes, pink cheeks, an antenna with a heart, a tiny scoop in its hand, sparkles (a clean yard)
  [[34,100],[82,100]].forEach(([x,y])=>b.sh(E(x,y,8,7,12),'#6E6470',{k:.1,hatch:0,hl:0,lw:.8,base:'#9A90A0'}));
  b.ln([[60,42],[63,24]],{w:2,col:INK});
  b.sh(E(63,19,6,6,12),'#FFE59A',{k:.1,hatch:0,hl:0,lw:.7,base:'#FFF6D0'});b.ex('heart',63,19.5,3,'#F28FA5');
  b.sh([[16,98],[16,82],[22,62],[38,46],[58,40],[78,46],[94,62],[100,82],[100,98]],C.mint,{k:.14,sh:'#7FBFA4',ho:.4,base:'#E6F6EE'});
  b.sh(ribbon([[14,90],[58,92],[102,90]],[11,11,11]),'#6FBFB0',{k:.2,hatch:0,hl:0,lw:.8,base:'#A9DCD3'});
  b.sh(RR(32,54,52,26,10),'#3B4A6B',{k:.05,hatch:0,hl:0,lw:.85,base:'#5A6B8E'});
  b.raw(b.st('M42 70q5 -8 10 0M64 70q5 -8 10 0','#9EF0E8',2.6,1));
  b.raw(b.st('M52 74q6 4 12 0','#9EF0E8',2,1));
  [[26,72],[90,72]].forEach(([x,y])=>b.dot(x,y,3.4,'#F7A1B5'));
  // the arm and the little scoop
  b.ln([[96,72],[103,66],[106,76]],{w:2.6,col:INK});
  b.sh(rot(E(107,86,6.4,9,14),-.25,107,86),'#FFE08A',{k:.1,hatch:0,hl:0,lw:.75,base:'#FFF2C2',marks:[{pts:rot(E(108,89,4,5,10),-.25,107,86),fill:'#F2C14E',op:.8}]});
  b.ex('spark',112,62,5.6,'#BFE0F7');b.ex('spark',10,44,4.6,'#BFE0F7');b.ex('spark',106,108,3.4,'#FFE07A');b.ex('glint',30,58,7);
};
VB['Garden Sprinkler']='0 0 120 120';
PROP['Garden Sprinkler']=function(b){b.shadow(60,110,48,4);
  // a sunflower sprinkler on a green stake in the veggie soil: arcs of water and drops, a hose curling away, two sprouts
  const WT='#7FB7E0';
  b.raw(b.st('M50 42Q26 28 10 62M70 42Q94 28 110 62M56 36Q50 14 34 10M64 36Q70 14 86 10',WT,2.4,.9));
  [[10,70],[16,80],[110,70],[104,80],[30,16],[90,16],[22,50],[98,50]].forEach(([x,y],i)=>b.sh([[x,y-4],[x+2.4,y],[x,y+2.4],[x-2.4,y]],'#BFE0F7',{k:.3,hatch:0,hl:0,lw:.55,base:'#E3F2FC'}));
  b.sh(E(60,104,46,9,22),'#B98A5E',{k:.1,hatch:0,hl:0,lw:.85,base:'#D9B48E',marks:[{pts:E(46,102,10,2.4,8),fill:'#A07448',op:.6},{pts:E(76,106,9,2,8),fill:'#A07448',op:.6}]});
  [[28,100],[92,100]].forEach(([x,y],i)=>{b.ln([[x,y],[x,y-10]],{w:1.6,col:'#5E9E3A'});b.sh(leafP(x,y-8,9,6,i?-.5:-2.6),'#7FB86A',{k:.2,hatch:0,hl:0,lw:.6,base:'#C9E6B4'})});
  b.raw(b.st('M62 100C74 110 96 110 104 98C110 90 102 84 96 90',INK,6,1)+b.st('M62 100C74 110 96 110 104 98C110 90 102 84 96 90','#7FB86A',3.6,1));
  b.ln([[60,102],[60,56]],{w:4.4,col:'#5E9E3A'});
  b.sh(flowerP(60,46,20,7,.2),'#FFD84A',{hatch:0,hl:0,lw:.8,base:'#FFEFA8'});
  b.sh(E(60,46,8,8,14),'#F9A23C',{k:.1,hatch:0,hl:0,lw:.7,base:'#FBC98A'});
  [[57,44],[63,44],[60,49]].forEach(([x,y])=>b.dot(x,y,1.1,'#8A5A34'));
  b.ex('spark',108,30,4.4,'#BFE0F7');
};
VB['Auto Water Bowl']='0 0 120 120';
PROP['Auto Water Bowl']=function(b){b.shadow(60,110,48,4);
  // an upside-down water bottle on a little stand keeps the blue bowl topped up: water low in the bottle, bubbles, a pink paw sticker
  b.sh(RR(38,6,44,60,14),'#E6F3FC',{k:.05,hl:0,sh:'#9CC4E2',ho:.3,base:'#F4FAFE',marks:[{pts:[[30,30],[90,28],[90,70],[30,70]],fill:'#9CCBEB',op:.8,k:0}]});
  [[52,40,2.6],[64,34,2],[58,50,2.2]].forEach(([x,y,r])=>b.sh(E(x,y,r,r,8),'#FFFFFF',{k:.1,hatch:0,hl:0,lw:.5,base:'#FFFFFF'}));
  paw(b,68,50,3.4,'#F7A1B5',{lw:.5});b.ex('glint',44,18,6);
  b.sh(RR(52,64,16,12,2),'#CFE8F8',{k:0,hatch:0,hl:0,lw:.8,base:'#EAF5FC'});
  b.sh([[30,74],[90,74],[96,92],[24,92]],'#FFF6E6',{k:.04,hatch:0,hl:0,lw:.85,base:'#FFFFFF'});
  b.sh([[10,90],[110,90],[100,110],[20,110]],'#7FA8DC',{k:.12,hl:0,sh:'#4E78AD',ho:.3,base:'#CADCF3',inner:b.st(b.jl(26,100,94,100,.5),'#E9F1FB',1.6,.8)});
  b.sh(E(60,90,50,8,24),'#5C84B8',{k:.1,hatch:0,hl:0,lw:.85,base:'#8FAFD8'});
  b.sh(E(60,90,43,5,22),'#9CCBEB',{k:.1,hatch:0,hl:0,lw:.6,base:'#CFE8F8',marks:[{pts:E(50,89,10,1.6,8),fill:'#FFFFFF',op:.9}]});
  b.ex('spark',102,20,5,'#BFE0F7');b.ex('spark',16,62,3.6,'#BFE0F7');
};

/* ---------- 4. Cozy Winter decor ---------- */
VB['Cable-Knit Rug']='0 0 240 80';
PROP['Cable-Knit Rug']=function(b){b.shadow(120,74,110,5);
  // an oval cream rug knitted in three cables (twisted ropes), a red rib border, little tassels at the ends
  [[6,36],[6,46],[234,36],[234,46]].forEach(([x,y])=>b.ln([[x+(x<100?8:-8),y],[x,y+(y<40?-3:3)]],{w:1.6,col:'#C8323C'}));
  b.sh(E(120,42,110,31,40),'#E46F6B',{k:.15,hl:0,sh:'#B5404A',ho:.3,base:'#F7C4C0',inner:b.st(knit(10,14,232,74,7,6,4),'#B5404A',1,.45)});
  let cab='';[30,42,54].forEach(y=>{for(let x=40;x<200;x+=16){cab+=`M${x} ${y-4}C${x+5} ${y-4} ${x+11} ${y+4} ${x+16} ${y+4}M${x} ${y+4}C${x+5} ${y+4} ${x+11} ${y-4} ${x+16} ${y-4}`}});
  b.sh(E(120,42,96,23,36),'#FFF2DA',{k:.15,hl:0,sh:'#D9C29C',ho:.3,base:'#FFF8EC',inner:b.st(cab,'#D9B98C',2.2,.9)+b.st(knit(20,20,222,68,7,6,3.4),'#E8D6B4',.9,.6)});
  b.ex('heart',120,8,3.6,'#F7B2C4');b.ex('spark',226,12,3.6,'#FFE07A');
};
VB['Cocoa Mug Lamp']='0 0 100 140';
PROP['Cocoa Mug Lamp']=function(b,o){const lit=!!(o&&o.lit);b.shadow(48,131,32,4);
  // a big red cocoa mug with a white heart; out of it rises the lamp: a marshmallow cloud that glows after dark (o.lit; the glow sits in .pa-wb-glow
  // so the night tint keeps its colour); the cord and plug like the Moon Lamp's. Lit and unlit share the jitter (the glow is drawn without it)
  if(lit)b.raw('<g class="pa-wb-glow"><circle cx="48" cy="46" r="44" fill="#FFF3C2" opacity=".6"/><ellipse cx="48" cy="131" rx="44" ry="5" fill="#FFE38A" opacity=".35"/></g>','under');
  b.ln([[76,124],[86,128],[90,132]],{w:1.4,col:GRAPH});b.sh(RR(88,128,7,6,1),'#FFFFFF',{k:0,hatch:0,hl:0,lw:.6});
  b.sh(ribbon([[70,86],[84,90],[88,102],[82,114],[70,116]],[7,7,7,7,7]),'#E46F6B',{k:1/6,hatch:0,hl:0,lw:.85,base:'#F7C4C0'});
  if(lit)b.raw('<g class="pa-wb-glow">');
  b.sh(cloudP(48,48,32,26,7,.16,48),lit?'#FFE59A':'#F6EEDC',{k:1/6,hl:0,hatch:0,base:lit?'#FFF6D0':'#FFFBF2',marks:[{pts:E(40,40,12,7,12),fill:'#FFFFFF',op:.85}]});
  if(lit)b.raw('</g>');
  [[36,24],[58,22]].forEach(([x,y],i)=>b.sh(rot(RR(x-6,y-5,12,10,3),i?.3:-.2,x,y),'#FFFFFF',{k:.05,hatch:0,hl:0,lw:.7,base:'#FFFFFF',marks:[{pts:[[x-6,y+2],[x+6,y+2],[x+6,y+5],[x-6,y+5]],fill:'#FBD3DC',k:0}]}));
  b.sh([[20,74],[76,74],[74,120],[66,128],[30,128],[22,120]],'#E46F6B',{k:.08,sh:'#B5404A',ho:.35,base:'#F7C4C0'});
  b.sh(E(48,74,28,5,20),'#8A5A3C',{k:.1,hatch:0,hl:0,lw:.8,base:'#B98A5E'});
  b.sh(heartP(48,100,20),'#FFFFFF',{hatch:0,hl:0,lw:.7,base:'#FFFFFF'});
  b.ex('spark',88,30,4.4,'#FFE07A');b.ex('spark',8,60,3.4,'#FFE07A');
};
VB['Doggy Snow Globe']='0 0 120 140';
PROP['Doggy Snow Globe']=function(b){b.shadow(60,134,46,4);
  // a glass globe on a wooden stand, a tiny red dog house, a pine and snow inside, a gold paw plaque on the stand
  const G=E(60,62,44,46,36);
  b.sh(G,'#DCEFFC',{noline:1,hatch:0,hl:0,base:'#F0F8FE'});
  const snow=[[22,84],[34,77],[60,75],[86,78],[98,84]];for(let a=30;a<=150;a+=8){const t=a*Math.PI/180;snow.push([60+Math.cos(t)*41.5,62+Math.sin(t)*43.5])}
  b.sh(snow,'#FFFFFF',{k:.1,hatch:0,hl:0,lw:.7,base:'#FFFFFF',sh:'#C9D7E8'});
  b.sh([[30,80],[24,80],[31,68],[27,68],[33,58],[39,68],[35,68],[42,80],[36,80]],'#5E9E3A',{k:0,hatch:0,hl:0,lw:.7,base:'#9CCB86'});
  b.sh(RR(50,58,26,22,1),'#E46F6B',{k:0,hatch:0,hl:0,lw:.8,base:'#F7C4C0'});
  b.sh([[46,60],[63,46],[80,60]],'#FFFFFF',{k:0,hatch:0,hl:0,lw:.8,base:'#FFFFFF'});
  b.sh(arch(58,68,80,66),C.door,{hatch:0,hl:0,lw:.6,base:'#6E544A'});
  [[30,40],[48,30],[72,26],[88,40],[40,54],[92,58],[64,40],[24,62],[82,52]].forEach(([x,y])=>b.dot(x,y,1.6,'#FFFFFF'));
  b.sh(G,null,{});
  b.ex('glint',34,34,12);
  b.sh(RR(30,104,60,12,3),C.woodD,{k:0,hatch:0,hl:0,lw:.85,base:C.wood});
  b.sh([[24,116],[96,116],[104,132],[16,132]],C.wood,{k:.04,hl:0,sh:C.woodD,ho:.35,base:'#F1D2B0'});
  b.sh(RR(48,119,24,10,2),GLD,{k:0,hatch:0,hl:0,lw:.7,base:GLDL});paw(b,60,124.6,1.6,GLDD,{noline:1});
  b.ex('spark',108,24,4.4,'#BFE0F7');
};
VB['Tea-Cosy Bed']='0 0 260 160';
PROP['Tea-Cosy Bed']=function(b){b.shadow(130,151,110,3.5);
  // a giant knitted tea cosy: a striped dome with a round opening at the front for the dog, a red pompom on the top, a cream cushion inside, a ribbed band
  const st=[];[40,62,84].forEach(y=>st.push({pts:[[10,y],[250,y],[250,y+10],[10,y+10]],fill:'#6FAFB8',k:0}));
  b.sh([[26,140],[28,100],[42,64],[76,36],[130,24],[184,36],[218,64],[232,100],[234,140]],'#F2C14E',{k:.14,hl:0,sh:'#C9962A',ho:.3,base:'#FFE9A8',marks:st,inner:b.st(knit(30,24,232,140,12,10,5.4),'#C9962A',1.2,.5)});
  b.sh(cloudP(130,22,16,14,8,.2,30),'#E46F6B',{k:.12,hl:0,lw:.85,base:'#F7C4C0',sh:'#B5404A'});
  b.sh(arch(50,210,140,46),'#8A5A3C',{hatch:0,hl:0,lw:.95,base:'#A87A5C',dr:.3});// v2.24 art fix: a wider, taller opening, so a curled-up dog's back and tail stay inside it
  b.sh(cloudP(130,124,70,14,9,.08,50),'#FFF2DA',{hl:0,sh:'#D9B98C',ho:.3,base:'#FFF8EC',marks:[{pts:E(118,120,24,5,14),fill:'#FFFFFF',op:.85}]});
  FRONT0(b);
  let rb='';for(let x=30;x<232;x+=8)rb+=b.jl(x,130,x,150,.4);
  b.sh([[22,128],[238,128],[240,152],[20,152]],'#6FAFB8',{k:.04,hl:0,sh:'#3E7E88',ho:.3,base:'#BFE0E4',inner:b.st(rb,'#3E7E88',1.4,.6)});
  FRONT1(b);b.ex('spark',20,40,4,'#FFE07A');b.ex('heart',244,60,3.8,'#F7B2C4');
};
VB['Cardboard Fireplace']='0 0 160 160';
PROP['Cardboard Fireplace']=function(b){b.shadow(80,152,70,4);
  // a pretend fireplace made from a big cardboard box: crayon bricks, a mantel shelf, tissue-paper flames on two rolled-paper logs, washi tape
  b.sh(rot([[112,46],[136,46],[140,20],[118,24]],.08,124,40),'#D9B27C',{k:.03,hatch:0,hl:0,lw:.8,base:'#EBCB9C'});
  let br='';for(let y=62,r=0;y<148;y+=11,r++){br+=b.jl(20,y,140,y,.5);for(let x=20+(r%2?11:0);x<140;x+=22)br+=b.jl(x,y-11,x,y,.4)}
  b.sh([[18,150],[18,50],[142,50],[142,150]],C.card,{k:.02,hl:0,sh:'#B08550',ho:.35,base:'#EBCB9C',inner:b.st(br,'#C0504A',1.3,.55)});
  b.sh(arch(46,114,150,82),'#5E463D',{hatch:0,hl:0,lw:1,base:'#6E544A'});
  b.sh(RR(52,136,30,8,4),'#B07A45',{k:0,hatch:0,hl:0,lw:.8,base:'#D9A274'});b.sh(RR(76,138,32,8,4),'#C58F5E',{k:0,hatch:0,hl:0,lw:.8,base:'#E2B07E'});
  // the paper flames sit in .pa-wb-glow (like the Cocoa Mug Lamp's marshmallow), so the night tint leaves them warm: they glow after dark
  b.raw('<g class="pa-wb-glow">');
  b.sh(flameP(80,138,34,46,-3),'#F9A23C',{k:.2,hatch:0,hl:0,lw:.8,base:'#FBC98A'});
  b.sh(flameP(68,138,18,30,-4),'#F28FA5',{k:.2,hatch:0,hl:0,lw:.7,base:'#FBD3DC'});
  b.sh(flameP(92,138,18,32,3),'#FFD84A',{k:.2,hatch:0,hl:0,lw:.7,base:'#FFEFA8'});
  b.sh(flameP(80,136,14,24,1),'#FFE9A8',{k:.2,hatch:0,hl:0,lw:.6,base:'#FFF6D0'});
  b.raw('</g>');
  b.sh(RR(8,40,144,13,3),'#C99A72',{k:0,hatch:0,hl:0,lw:.9,base:'#E2BC94'});
  b.sh(RR(26,18,22,22,2),'#FFF6E6',{k:0,hatch:0,hl:0,lw:.8,base:'#FFFFFF'});b.ex('heart',37,29,5,'#F28FA5');
  b.sh(E(104,32,7,9,12),'#A0703F',{k:.1,hatch:0,hl:0,lw:.75,base:'#C99A6A',inner:b.st('M98 28L110 28M97 33L111 33M99 38L109 38','#6E4A24',1,.7)});
  tapeB(b,24,60,24,-40,'#F7B9C6');tapeB(b,136,62,24,40,'#BDE7D2');tapeB(b,24,142,22,35,'#FFE08A');
  b.raw(b.st(b.jl(30,150,30,56,.4)+b.jl(130,150,130,56,.4),'#B08550',1.2,.55));
  b.ex('spark',150,24,4,'#FFE07A');
};
VB['Woolly Armchair']='0 0 160 150';
PROP['Woolly Armchair']=function(b){b.shadow(80,142,66,4);
  // a squat dog-size armchair in chunky teal knit, a tartan cushion, a cream blanket over one arm with pompoms
  [[40,138],[120,138]].forEach(([x,y])=>b.sh(RR(x-5,y-8,10,10,2),C.woodD,{k:0,hatch:0,hl:0,lw:.8,base:C.wood}));
  const kn=b.st(knit(10,10,152,140,11,9,5),'#3E7E88',1.2,.5);
  b.sh([[34,100],[30,56],[44,28],[80,18],[116,28],[130,56],[126,100]],'#6FAFB8',{k:.16,hl:0,sh:'#3E7E88',ho:.3,base:'#BFE0E4',inner:kn});
  const tt=[];[54,80,106].forEach(x=>tt.push({pts:[[x-4,80],[x+4,80],[x+4,112],[x-4,112]],fill:'#2F6E3E',op:.6,k:0}));tt.push({pts:[[30,92],[130,92],[130,97],[30,97]],fill:'#FFE08A',op:.8,k:0});
  b.sh(RR(36,84,88,24,10),'#E46F6B',{k:.1,hatch:0,hl:0,lw:.85,base:'#F7C4C0',marks:tt});
  b.sh(RR(24,104,112,32,10),'#6FAFB8',{k:.1,hl:0,sh:'#3E7E88',ho:.3,base:'#BFE0E4',inner:kn});
  b.sh(E(26,94,16,26,18),'#6FAFB8',{hl:0,sh:'#3E7E88',ho:.3,base:'#BFE0E4',inner:kn});
  b.sh(E(134,94,16,26,18),'#6FAFB8',{hl:0,sh:'#3E7E88',ho:.3,base:'#BFE0E4',inner:kn});
  b.sh([[118,70],[150,74],[152,116],[136,120],[124,104]],'#FFF2DA',{k:.12,hatch:0,hl:0,lw:.85,base:'#FFF8EC',inner:b.st('M128 82L148 84M126 94L150 96',C.redD,2,.8)});
  [[138,124],[148,122]].forEach(([x,y])=>b.sh(E(x,y,4,4,10),C.redD,{k:.1,hatch:0,hl:0,lw:.6,base:'#F7C4C0'}));
  b.ex('heart',80,10,4.4,'#F7B2C4');b.ex('spark',150,30,4,'#FFE07A');
};

const TK={jade:'#2F8F6E',jadeL:'#8FD3B4',rib:'#2B2430',ribS:'#F08A24',hat:'#B9A6E8',hatD:'#7E63C7',hatB:'#FFF1D6',canvas:'#F6EBD3',strap:'#C99A5E',shade:'#3B3346',sole:'#7FCBB0',pink:'#FF7EB6',red:'#D7263D',blue:'#4F8FD6'};
/* ---------- the crayon card frame and the price tag (any pixel size), for the shop sheet ---------- */
function frame(w,h,wash,seed){const b=mk('card','frame'+(seed||0)+':'+w+'x'+h);
  b.sh(RR(5,6,w-11,h-12,Math.min(18,h*.12),3),wash||'#FFFDF8',{k:.04,hatch:0,hl:0,base:wash||'#FFFDF8',dr:0});
  return b.svg(`0 0 ${w} ${h}`,` width="${w}" height="${h}" preserveAspectRatio="none"`,'')}
function tag(w,h,col,seed){const b=mk('card','tag'+(seed||0)+':'+w+'x'+h);
  b.sh([[h*.42,4],[w-6,5],[w-5,h-5],[h*.42,h-4],[5,h/2]],col||'#FFE08A',{k:.06,hatch:0,hl:0,base:col||'#FFE08A',dr:0});
  b.sh(E(h*.48,h/2,3.4,3.4,10),'#FFFBF3',{k:0,hatch:0,hl:0,lw:.6,base:'#FFFBF3'});
  return b.svg(`0 0 ${w} ${h}`,` width="${w}" height="${h}"`,'')}

/* ---------- 5. the coin packs' icons (64): a little crayon pile of gold coins that grows with the pack ---------- */
// one coin seen a little from above: the gold face over a darker rim band, a paw stamped on the face (light lines, so a small pile stays gold, not ink)
function coin(b,x,y,r){const t=r*.3;
  b.sh([[x-r,y],[x-r,y+t],[x-r*.72,y+t+r*.3],[x,y+t+r*.42],[x+r*.72,y+t+r*.3],[x+r,y+t],[x+r,y],[x,y+r*.42]],'#E2A93A',{k:.15,hatch:0,hl:0,lw:.5,step:6,base:'#F2C76A'});
  b.sh(E(x,y,r,r*.42,14),GLD,{k:.15,hatch:0,hl:0,lw:.5,step:6,base:GLDL});b.raw(`<ellipse cx="${R1(x-r*.08)}" cy="${R1(y-r*.04)}" rx="${R1(r*.6)}" ry="${R1(r*.2)}" fill="${GLDS}" opacity=".9"/>`);// the shine sits well inside the face
  if(r>12)paw(b,x,y+r*.02,r*.12,GLDD,{noline:1});else b.dot(x,y+r*.02,r*.12,GLDD)}
// a coin standing on its edge, leaning
function coinUp(b,x,y,r,a){b.sh(rot(E(x,y,r*.46,r,16),a,x,y),'#E2A93A',{k:.15,hatch:0,hl:0,lw:.5,step:6,base:'#F2C76A'});
  b.sh(rot(E(x+r*.14,y,r*.36,r*.86,16),a,x,y),GLD,{k:.15,hatch:0,hl:0,lw:.45,step:6,base:GLDL})}
const COINS={
  coins1(b){[[32,50],[33.5,43],[31,36]].forEach(([x,y])=>coin(b,x,y,15));b.ex('spark',54,16,4.6,'#FFE07A')},
  coins3(b){[[22,52],[23.4,45.5],[21.6,39],[22.8,32.5]].forEach(([x,y])=>coin(b,x,y,13));[[46,52],[44.8,45.5]].forEach(([x,y])=>coin(b,x,y,12));
    coinUp(b,50,30,9,.32);b.ex('spark',58,12,4.4,'#FFE07A');b.ex('spark',8,16,3.4,'#FFE07A')},
  coins8(b){// a heap: a tall stack behind, a wide bottom row, a coin rolling off the side
    [[47,38],[48,32],[46.5,26],[47.5,20],[46.6,14]].forEach(([x,y])=>coin(b,x,y,10));
    [[12,54],[26,56],[40,56],[53,54]].forEach(([x,y])=>coin(b,x,y,10));[[19,48],[33,49],[46,48]].forEach(([x,y])=>coin(b,x,y,10));[[25,41],[38,42]].forEach(([x,y])=>coin(b,x,y,10));coin(b,31,34,10);
    coinUp(b,10,38,8,-.35);b.ex('spark',20,14,4.8,'#FFE07A');b.ex('spark',60,46,3.4,'#FFE07A');b.ex('glint',26,30,5)}
};
Object.assign(ICON,COINS,{coins:COINS.coins3});

/* ---------- 6. the Robo Scoop in the yard (ksrobo 60x50): the little round robot rolling about with its scoop ---------- */
// o.k 0..2: the wheels' spokes turn and the antenna nods, for the game to flip through while it rolls (facing right; the game mirrors it)
function roboYard(b,k){const G=46;b.shadow(29,G+1,22,2.4);
  [[16,G-5],[42,G-5]].forEach(([x,y])=>{b.sh(E(x,y,5,5,12),'#6E6470',{k:.1,hatch:0,hl:0,lw:.7,base:'#9A90A0'});
    const a=k*Math.PI/3;b.raw(b.st(`M${R1(x-Math.cos(a)*3.4)} ${R1(y-Math.sin(a)*3.4)}L${R1(x+Math.cos(a)*3.4)} ${R1(y+Math.sin(a)*3.4)}`,'#D8D2CC',1.1),'top')});
  const nod=[0,2,-2][k];b.ln([[29,15],[30+nod,6]],{w:1.4,col:INK});b.sh(E(30+nod,4.6,3,3,10),'#FFE59A',{k:.1,hatch:0,hl:0,lw:.55,base:'#FFF6D0'});
  b.sh([[8,G-4],[8,G-12],[11,G-22],[19,G-30],[29,G-33],[39,G-30],[47,G-22],[50,G-12],[50,G-4]],C.mint,{k:.14,sh:'#7FBFA4',ho:.4,base:'#E6F6EE',hatch:0});
  b.sh(ribbon([[7,G-8],[29,G-7],[51,G-8]],[6,6,6]),'#6FBFB0',{k:.2,hatch:0,hl:0,lw:.6,base:'#A9DCD3'});
  b.sh(RR(17,G-27,26,13,5),'#3B4A6B',{k:.05,hatch:0,hl:0,lw:.6,base:'#5A6B8E'});
  b.raw(b.st(`M22 ${G-19}q2.5 -4 5 0M33 ${G-19}q2.5 -4 5 0M27 ${G-17}q3 2 6 0`,'#9EF0E8',1.6,1));
  b.dot(13,G-17,1.8,'#F7A1B5');b.dot(45,G-17,1.8,'#F7A1B5');
  // the arm out front and the little yellow scoop, low to the grass
  b.ln([[49,G-15],[54,G-17],[55,G-10]],{w:1.6,col:INK});
  b.sh(rot(E(55.5,G-6,3.6,4.8,12),-.6,55.5,G-6),'#FFE08A',{k:.1,hatch:0,hl:0,lw:.55,base:'#FFF2C2',marks:[{pts:rot(E(56,G-5,2.2,2.8,10),-.6,55.5,G-6),fill:GLD,op:.8}]});
  b.ex('glint',16,G-24,4)}

/* ---------- 7. item cards (64), like every other item: the wearables drawn on their own, the decor, bed and house fitted into the box ---------- */
const ITEM={};
ITEM['Golden Name Tag']=function(b){b.sh(ribbon([[6,22],[20,30],[32,33],[44,30],[58,22]],[6,6,6,6,6]),'#4F8FD6',{k:1/6,hatch:0,hl:0,lw:.85,base:'#B9D4F3'});
  b.ln([[32,35],[32,40]],{w:1.4,col:INK});b.sh(boneP(32,48,34,15,-.08),GLD,{hatch:0,hl:0,base:GLDL,marks:[{pts:boneP(32,48,26,9,-.08),fill:GLDS,op:.85}]});
  paw(b,32,49,2.2,GLDD,{noline:1});b.ex('spark',54,44,4,'#FFE07A');b.ex('glint',20,44,4)};
ITEM['Sukajan Jacket']=function(b){// the jacket laid flat: jade satin, ribbed black and orange collar, cuffs and hem, a pink blossom and a gold star
  b.sh([[18,12],[8,22],[4,40],[12,42],[16,30],[17,56],[47,56],[48,30],[52,42],[60,40],[56,22],[46,12],[39,12],[32,20],[25,12]],TK.jade,{k:.06,sh:'#1F6A50',base:TK.jadeL});
  b.sh(ribbon([[16,54],[32,55.5],[48,54]],[5,5,5]),TK.rib,{k:1/6,hatch:0,hl:0,lw:.8,inner:b.st('M14 54.2H50',TK.ribS,1.4)});
  b.sh(ribbon([[24,11],[32,19],[40,11]],[4.4,4.4,4.4]),TK.rib,{k:1/6,hatch:0,hl:0,lw:.75});
  [[8,41],[56,41]].forEach(([x,y])=>b.sh(E(x,y,4.4,2.4,10,x<30?-.2:.2),TK.rib,{k:.1,hatch:0,hl:0,lw:.6,top:1}));
  b.ln([[32,21],[32,52]],{w:1,col:'#1F6A50'});
  for(let i=0;i<5;i++){const t=-Math.PI/2+i/5*Math.PI*2;b.dot(23+Math.cos(t)*3.2,36+Math.sin(t)*3.2,2.4,'#FFB3CF','top')}b.dot(23,36,1.4,'#FFD84A','top');
  b.sh(starP(42,38,5,2.2),GLD,{k:0,hatch:0,hl:0,lw:.6,top:1});b.ex('spark',58,8,3.4,'#FFE07A')};
ITEM['Bucket Hat']=function(b){const ck=b.st('M17 36L19 18M25 36L26 15M33 36L33 14M41 36L40 15M47 36L45 18M14 24H50M12 31H52',TK.hatD,1.2,.7);
  b.sh([[4,46],[10,36],[54,36],[60,46],[48,50],[16,50]],TK.hat,{k:.12,hatch:0,hl:0,lw:.9,base:'#E4DBF7',inner:b.st('M10 46Q32 52 54 46',TK.hatD,1,.6)});
  b.sh([[14,37],[15,22],[22,14],[42,14],[49,22],[50,37]],TK.hat,{k:.1,hl:0,sh:TK.hatD,ho:.3,base:'#E4DBF7',inner:ck});
  b.sh(RR(13,32,38,6,2.4),TK.hatB,{k:0,hatch:0,hl:0,lw:.7,base:'#FFFFFF'});b.ex('spark',56,12,3.4,'#FFE07A')};
function sneakerCard(b,x,y,s){const P=[[-.95,-1.15],[.45,-1.25],[1.05,-.65],[1.75,-.3],[1.8,.4],[-1.05,.4]].map(([u,v])=>[x+u*s,y+v*s]);
  b.sh(P,'#FFFFFF',{k:.08,hatch:0,hl:0,lw:.8,base:'#FFFFFF',marks:[{pts:[[x-1.2*s,y+.12*s],[x+2*s,y+.12*s],[x+2*s,y+.5*s],[x-1.2*s,y+.5*s]],fill:TK.sole,k:0}]});
  b.dot(x-.2*s,y-.35*s,s*.3,TK.pink);[[.35,-1],[.7,-.75]].forEach(([u,v])=>b.dot(x+u*s,y+v*s,s*.13,TK.pink))}
ITEM['Little Sneakers']=function(b){sneakerCard(b,14,30,9);sneakerCard(b,30,50,10);b.ex('spark',56,12,3.4,'#FFE07A')};
ITEM['Paw Tote']=function(b){b.raw(b.st('M20 30C18 10 46 10 44 30',TK.strap,3.4));
  b.sh([[14,28],[50,28],[54,58],[10,58]],TK.canvas,{k:.04,hl:0,sh:'#C9B48C',ho:.35,base:'#FFFBF0',marks:[{pts:[[0,34],[64,34],[64,38],[0,38]],fill:TK.blue,k:0}]});
  paw(b,32,48,3.4,TK.pink,{lw:.5});b.ex('spark',56,14,3.4,'#FFE07A')};
ITEM['Round Shades']=function(b){b.raw(b.st('M24 30Q32 24 40 30M6 28L2 24M58 28L62 24',GLDD,2.2));
  [[16,32],[48,32]].forEach(([x,y])=>{b.sh(E(x,y,11,11,20),TK.shade,{k:.06,hatch:0,hl:0,lw:.9,base:'#6A5E7E',ink:GLDD});b.raw(b.st(`M${x-6} ${y-1}L${x-2} ${y-6}`,'#FFFFFF',1.8,.9),'top')});
  b.ex('spark',56,12,3.4,'#FFE07A')};
ITEM['Lucky Cat Charm']=function(b){b.raw(b.st('M8 12Q32 34 56 12',TK.red,3));
  const x=32,y=42,R=13;b.ln([[x,24],[x,30]],{w:1.2,col:INK});
  b.sh([[x-R,y-R*.2],[x-R*.95,y-R*1.4],[x-R*.3,y-R*.85],[x+R*.3,y-R*.85],[x+R*.95,y-R*1.4],[x+R,y-R*.2],[x+R*.8,y+R*.8],[x-R*.8,y+R*.8]],'#FFFFFF',{k:.1,hatch:0,hl:0,lw:.85,base:'#FFFFFF'});
  b.raw(b.st(`M${x-7} ${y-3}l4 -1M${x+3} ${y-4}l4 1`,INK,1.2),'top');b.dot(x-9,y-12,1.4,'#FF9EB8','top');b.dot(x+9,y-12,1.4,'#FF9EB8','top');
  b.sh(E(x,y+5,3.2,3.2,10),GLD,{k:0,hatch:0,hl:0,lw:.6,top:1});b.sh(E(x+R+2,y-9,4,5,10),'#FFFFFF',{k:.1,hatch:0,hl:0,lw:.7,top:1});b.ex('spark',56,48,3.4,'#FFE07A')};
// the decor, the bed and the house: their own art fitted into the 64 box (crop [x, y, w, h] of the art)
function fitCard(b,svg,crop){const [x,y,w,h]=crop,k=Math.min(60/w,54/h),W=w*k,H=h*k,t=svg.replace(/^<svg[^>]*>/,'').replace(/<\/svg>$/,'');
  b.raw(`<svg x="${R1(32-W/2)}" y="${R1(34-H/2)}" width="${R1(W)}" height="${R1(H)}" viewBox="${crop.join(' ')}" overflow="hidden">${t}</svg>`)}
const CROP={'Cable-Knit Rug':[4,4,232,74],'Cocoa Mug Lamp':[4,14,92,122],'Doggy Snow Globe':[10,12,100,124],'Cardboard Fireplace':[4,14,152,142],'Woolly Armchair':[6,4,150,142],'Tea-Cosy Bed':[16,4,230,152],'Golden Paw Cottage':[10,0,220,198]};

/* ---------- the module API ---------- */
// the world's prop ids for the Cozy Winter decorations (the game's HM_DECOR `prop`), and the Robo Scoop in the yard
const PID={ksrug:'Cable-Knit Rug',kslamp:'Cocoa Mug Lamp',ksglobe:'Doggy Snow Globe',ksfireplace:'Cardboard Fireplace',ksarmchair:'Woolly Armchair'},LIT={kslamp:1};
VB.ksrobo='0 0 60 50';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;'),lab=s=>esc(s);
function propSvg(name,o){const kind=name==='Tea-Cosy Bed'?'bed':'prop',lt=!!(o&&o.lit);
  return serve('sp:'+name+(lt?':lit':''),()=>{const b=mk(kind,'shop:'+name);PROP[name](b,{lit:lt});return b.svg(VB[name],kind==='bed'?` data-bed="${esc(name)}"`:name==='Cocoa Mug Lamp'?` data-lit="${lt?1:0}"`:'',(lt?'Lit ':'')+lab(name))})}
const house=name=>serve('sh:'+name,()=>{const b=mk('house','shop:'+name);HOUSE[name](b);return b.svg('0 0 240 200','',lab(name),true)});
const robo=k=>{k=((k|0)%3+3)%3;return serve('sr:'+k,()=>{const b=mk('prop','shop:robo');roboYard(b,k);return b.svg(VB.ksrobo,'','Robo Scoop')})};
const item=name=>serve('st:'+name,()=>{const b=mk('item','shop:'+name);if(ITEM[name])ITEM[name](b);else if(HOUSE[name])fitCard(b,house(name),CROP[name]);else fitCard(b,propSvg(name),CROP[name]);return b.svg('0 0 64 64','',lab(name))});
// the world's own lookups learn the shop's art: PA.prop(id), PA.bed(name), PA.house(name), PA.item(name) (each falls through to the older modules)
{const _p=PA.prop,_b=PA.bed,_h=PA.house,_i=PA.item;
 PA.prop=function(name,o){if(PID[name])return propSvg(PID[name],LIT[name]?{lit:!!(o&&o.lit)}:null);if(name==='ksrobo')return robo(o&&o.k);return _p?_p.apply(this,arguments):''};
 PA.bed=function(name){if(name==='Tea-Cosy Bed')return propSvg(name);return _b?_b.apply(this,arguments):''};
 PA.house=function(name){if(HOUSE[name])return house(name);return _h?_h.apply(this,arguments):''};
 PA.item=function(name){if(ITEM[name]||CROP[name])return item(name);return _i?_i.apply(this,arguments):''}}
PA.SHOP={
  house,
  prop:(name,o)=>PID[name]?PA.prop(name,o):name==='ksrobo'?robo(o&&o.k):PROP[name]?propSvg(name,o):'',
  robo,item,
  icon:name=>ICON[name]?serve('si:'+name,()=>{const b=mk('icon','shop:'+name);ICON[name](b);return b.svg('0 0 64 64','',lab(name))}):'',
  frame,tag,VB:Object.assign({},VB),PROPS:Object.assign({},PID),
  NAMES:{supporter:['Golden Paw Cottage','Golden Name Tag','Founding Friend Badge','Thank-You Letter'],perks:['walkcoins','cropsfast','giftplus'],coins:['coins1','coins3','coins8'],
    tools:['Robo Scoop','Garden Sprinkler','Auto Water Bowl'],tokyo:['Sukajan Jacket','Bucket Hat','Little Sneakers','Paw Tote','Round Shades','Lucky Cat Charm'],
    winter:['Cable-Knit Rug','Cocoa Mug Lamp','Doggy Snow Globe','Tea-Cosy Bed','Cardboard Fireplace','Woolly Armchair']}
};
})();
