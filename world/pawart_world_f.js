/* Doodle Doggo world art, module F (v2.15 "Around Town", V215.md sections 2, 3, 4 and 12). Loads AFTER worlds A to E.
   Wraps PawArt.scene: PawArt.scene('map', { v215: true, ... }) draws the v2.15 town map; every other call (and 'map' without v215) goes to the
   previous PawArt.scene unchanged, so the old map stays byte for byte.
   The v2.15 map (viewBox 0 0 2400 1500): hills and Mt. Fuji (jp) in the north-west, the meandering river from the north down to the sea, the sea
   and Seashell Beach in the south-east, the forest in the east, winding roads, lanes and trails (PawArt.MAP_ROADS) and 25 buildings, each a button:
     <g class="mb" data-area="key" role="button" tabindex="0" aria-label="name"> with four layers:
       .mb-shadow (ink ellipse under the base), .mb-glow (pink halo + dashed .mb-ring, opacity 0 until the game's CSS shows it),
       .mb-lift (the building, its caption <text class="mb-cap">, the lock veil .mb-lock, the sticker .mb-sticker; transform-box fill-box,
       transform-origin at the base), .mb-hit (a static transparent ellipse over building and caption).
     A checkered flag (.mb-flag) sits on every place where a run starts (PawArt.MAP215_RUNS).
   Options: names { key: text } (captions and aria-labels, the game passes translated names; English otherwise), labels { key: text } (aria-label
     only, e.g. "Go to X (locked, Bond 4)"), lock { key: 'Bond 4' } (hatched veil, padlock, pink chip), stickers { key: { kind: 'new'|'moved', text } },
     hide [keys] (e.g. 'station' with the trip off, 'fujihill' with Japan off: the building and its dead-end road are left out, the clearing stays),
     title (the map title text), season, halloween (or hw), lights (or lt), newyear (or ny), jp, snow (falling snow).
   Seasons: summer with jp off = the design colours. Spring blossom and petals, autumn crowns and leaves, winter snow caps on every roof and a cold
     wash; Halloween pumpkins, Winter Lights bulbs, New Year kadomatsu and kites, jp Mt. Fuji and the torii. Each extra runs on its own seeded stream
     (k.ss, k.hw, k.lt, k.ny, k.jp, as world A), so the base layout never moves.
   Exports: PawArt.MAP215_AREAS [{ id, x, y }] (building centres), PawArt.MAP_ROADS { nodes: { id: [x, y] }, edges: [{ a, b, t, pts, len }] }
     (the samples the art draws: every place's door is a node), PawArt.MAP215_RUNS, PawArt.MAP215_NAMES (English),
     PawArt.mapBuilding(id, env) (one building as a small standalone svg, viewBox -130 -130 260 230, for thumbnails).
   The pencil kit and the season recolour are copied from world A (ids prefixed mf-). No filters, no animation, no game state, no tt(). */
window.PawArt = window.PawArt || {};
(function(){
'use strict';
const PA=window.PawArt;
const C={ink:'#5B3D32',graph:'#A8968A',paper:'#FFFBF3',dot:'#E3D2BA',pink:'#F28FA5',
  sky:'#D3E9F6',grass:'#CBE5A6',grass2:'#B4D98E',grassD:'#93C276',leaf:'#B9DD92',leaf2:'#9ACD7C',leafD:'#7FB86A',pine:'#8CC09A',pineD:'#6FA483',
  trunk:'#C9A07A',trunkD:'#A97E5A',wood:'#EBCDA4',woodD:'#CFA77C',roof:'#EBA48C',roofD:'#D88870',wall:'#FCE6CC',wall2:'#F9D9DE',wall3:'#D9E9F7',wall4:'#DDEFD8',
  stone:'#DED6CC',stoneD:'#C7BCAE',path:'#EFDDBA',water:'#BEE0F2',waterD:'#9CCDE8',sand:'#F7E4B5',sandD:'#EBCF95',red:'#F4A3A3',redD:'#E57E83',
  yellow:'#FCE59A',orange:'#F8C08A',lav:'#DCCBF2',mint:'#C9EBDA',blue:'#B9D3F2',white:'#FFFFFF',glass:'#E4F2FA',teal:'#8FD6E1',halo:'#FFF8EC'};
let _n=0;const uid=()=>'mf-'+(++_n);
const R1=n=>Math.round(n*10)/10;
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const hashS=s=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const hashXY=(x,y)=>(Math.imul(Math.round(x)+977,73856093)^Math.imul(Math.round(y)+331,19349663))>>>0;
const E=(cx,cy,rx,ry,n=14)=>{const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;p.push([cx+Math.cos(a)*rx,cy+Math.sin(a)*ry])}return p};
const RC=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const blobP=(cx,cy,rx,ry,r,n=9,v=.22)=>{const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2,k=1-v/2+r()*v;p.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k])}return p};
function dense(pts,closed,step){const out=[],n=pts.length,m=closed?n:n-1;
  for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n],k=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/step));for(let j=0;j<k;j++)out.push([a[0]+(b[0]-a[0])*j/k,a[1]+(b[1]-a[1])*j/k])}
  if(!closed)out.push(pts[n-1]);return out}
function smooth(P,closed){const n=P.length;if(n<2)return'';
  if(!closed){let d=`M${R1(P[0][0])} ${R1(P[0][1])}`;for(let i=1;i<n-1;i++)d+=`Q${R1(P[i][0])} ${R1(P[i][1])} ${R1((P[i][0]+P[i+1][0])/2)} ${R1((P[i][1]+P[i+1][1])/2)}`;return d+`L${R1(P[n-1][0])} ${R1(P[n-1][1])}`}
  const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];let s=m(P[n-1],P[0]),d=`M${R1(s[0])} ${R1(s[1])}`;
  for(let i=0;i<n;i++){const q=m(P[i],P[(i+1)%n]);d+=`Q${R1(P[i][0])} ${R1(P[i][1])} ${R1(q[0])} ${R1(q[1])}`}return d+'Z'}
// Catmull-Rom samples through P (roads, the river, the coast): seg samples per span
function crs(P,seg){const o=[],n=P.length,g=i=>P[Math.max(0,Math.min(n-1,i))];for(let i=0;i<n-1;i++){const a=g(i-1),b=g(i),c=g(i+1),e=g(i+2);
  for(let t=0;t<seg;t++){const u=t/seg,u2=u*u,u3=u2*u;o.push([0,1].map(k=>R1(.5*(2*b[k]+(-a[k]+c[k])*u+(2*a[k]-5*b[k]+4*c[k]-e[k])*u2+(-a[k]+3*b[k]-3*c[k]+e[k])*u3))))}}
  o.push([P[n-1][0],P[n-1][1]]);return o}
const lp=P=>'M'+P.map(p=>R1(p[0])+' '+R1(p[1])).join('L');

/* ---------- the pencil kit (world A), with a bounding box and the season streams ---------- */
// 25 Oct 2026: a closed outline P pulled in by dd (each point along its corner's inward normal; small shapes are pulled in less, so they never turn inside out)
function fillIn(P,dd,G){const n=P.length;if(n<3)return P;let a=0,x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;P.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});
  G=G&&G.length>2?G:P;G.forEach((p,i)=>{const q=G[(i+1)%G.length];a+=p[0]*q[1]-q[0]*p[1]});const sg=a>0?1:-1;dd=Math.min(dd,Math.min(x1-x0,y1-y0)/4);// which way is in: from the drawn points G (a smooth curve can loop past a thin shape's ends)
  return P.map((p,i)=>{const A=P[(i+n-1)%n],C=P[(i+1)%n],l1=Math.hypot(p[0]-A[0],p[1]-A[1])||1,l2=Math.hypot(C[0]-p[0],C[1]-p[1])||1;
    const nx=-((p[1]-A[1])/l1+(C[1]-p[1])/l2)*sg,ny=((p[0]-A[0])/l1+(C[0]-p[0])/l2)*sg,m=Math.hypot(nx,ny)||1;return[p[0]+nx/m*dd,p[1]+ny/m*dd]})}
function kit(seed,env){
  let cur=rng(seed);const S=[0x5bd1e995,0x2f6b8d3c,0x6c8e9cf5,0x3c6ef372,0x1b873593,0x7f4a7c15].map(x=>rng((seed^x)>>>0));
  const r=()=>cur(),out=[],defs=[],J=a=>(r()-.5)*2*a,bb=[1e9,1e9,-1e9,-1e9];
  let xs=0;const run=(R,fn,x)=>{const sv=cur;cur=R;xs+=x?1:0;try{return fn()}finally{cur=sv;xs-=x?1:0}};
  // the box grows with the base drawing only, so the season and festival extras never move the lift origin or the hit ellipse
  const grow=P=>{if(xs)return;for(const p of P){if(p[0]<bb[0])bb[0]=p[0];if(p[1]<bb[1])bb[1]=p[1];if(p[0]>bb[2])bb[2]=p[0];if(p[1]>bb[3])bb[3]=p[1]}};
  const k={r,J,out,defs,env,so:env.ssn,bb,grow,
    side:fn=>run(S[0],fn),ss:fn=>env.ssn?run(S[1],fn,1):undefined,hw:fn=>env.hw?run(S[2],fn,1):undefined,
    lt:fn=>env.lt?run(S[3],fn,1):undefined,ny:fn=>env.ny?run(S[4],fn,1):undefined,jp:fn=>env.jp?run(S[5],fn,1):undefined,
    add(s){out.push(s)},
    // one pencil pass as a filled ribbon: wobble, tapered ends, heavier where the form faces down
    pen(pts,closed,o={}){const P=dense(pts,closed,o.step||7),n=P.length;if(n<2)return;grow(pts);
      const w0=o.w||2.2,wk=o.wk??.8,amp=o.amp??.8,col=o.col||C.ink;
      let sg=1;if(closed){let a=0;for(let i=0;i<n;i++){const q=P[(i+1)%n];a+=P[i][0]*q[1]-q[0]*P[i][1]}sg=a>0?1:-1}
      const runs=[];if(closed&&!o.one&&n>8){const s0=Math.floor(r()*n),sp=Math.floor(n*(.42+r()*.2)),gp=r()<.3?1:-1-Math.round(r());runs.push([s0,s0+sp],[s0+sp+gp,s0+n+Math.round(r()*2)])}else runs.push([0,closed?n:n-1]);
      let d='';runs.forEach(([a,b])=>{const p2=[];for(let i=a;i<=b;i++)p2.push(closed?P[((i%n)+n)%n]:P[Math.max(0,Math.min(n-1,i))]);const m=p2.length;if(m<2)return;
        let vx=J(amp*.5),vy=J(amp*.5),wn=0;const L=[],Rt=[];
        for(let i=0;i<m;i++){vx=vx*.85+J(amp*.25);vy=vy*.85+J(amp*.25);wn=wn*.8+J(.14);const p0=p2[Math.max(0,i-1)],p1=p2[Math.min(m-1,i+1)];let tx=p1[0]-p0[0],ty=p1[1]-p0[1];const tl=Math.hypot(tx,ty)||1;tx/=tl;ty/=tl;
          const nx=ty*sg,ny=-tx*sg,t=i/(m-1),e=Math.min(t,1-t)/(o.tap??.15),tp=e>=1?1:.2+.8*Math.sin(e*Math.PI/2),w=Math.max(.3,w0*(1+(closed?wk*Math.max(0,ny):0)+wn)*tp)/2,x=p2[i][0]+vx,y=p2[i][1]+vy;
          L.push([x+nx*w,y+ny*w]);Rt.push([x-nx*w,y-ny*w])}
        d+=smooth(L.concat(Rt.reverse()),true)});
      out.push(`<path d="${d}" fill="${col}"${o.op?` opacity="${o.op}"`:''}/>`)},
    // 25 Oct 2026 (owner): the fill stays inside its outline (no drift; under a pencil outline it is pulled in to the line's inner edge), as in world A
    fill(pts,col,o={},ins=0){const P=dense(pts,true,o.step||14);grow(pts);
      if(o.dx==null)r();if(o.dy==null)r();if(o.sc==null)r();const amp=o.amp??1.3,In=ins?fillIn(P,ins):null;let vx=0,vy=0;
      const W=P.map((q,i)=>{vx=vx*.7+J(amp*.6);vy=vy*.7+J(amp*.6);return In?In[i]:[q[0]+vx,q[1]+vy]});
      out.push(`<path d="${smooth(W,true)}" fill="${col}"${o.op!=null?` fill-opacity="${o.op}"`:''}/>`)},
    shape(pts,col,o={}){if(col)k.fill(pts,col,o,o.noline?0:(o.w||2.2)*.5);if(o.hatch)k.hatch(pts,o.hatch);if(!o.noline)k.pen(pts,true,{w:o.w,wk:o.wk,amp:o.pamp,col:o.lcol,one:o.one,op:o.lop})},
    line(pts,w=1.4,col=C.ink,o={}){grow(pts);const P=dense(pts,false,o.step||8).map((q,i,a)=>i===0||i===a.length-1?[q[0]+J(.4),q[1]+J(.4)]:[q[0]+J(o.amp??.7),q[1]+J(o.amp??.7)]);
      out.push(`<path d="${smooth(P,false)}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o.op?` opacity="${o.op}"`:''}${o.dash?` stroke-dasharray="${o.dash}"`:''}/>`)},
    // diagonal hatching clipped to a region, only in the lower-right part when o.side
    hatch(pts,o={}){const id=uid(),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys),h=y1-y0,gap=o.gap||4.5;
      defs.push(`<clipPath id="${id}"><path d="${smooth(dense(pts,true,20),true)}"/></clipPath>`);let d='';const sx=o.side?x0+(x1-x0)*o.side:x0-h*.6;
      for(let x=sx;x<x1+4;x+=gap)d+=`M${R1(x+J(1))} ${R1(y1+3)}L${R1(x+h*.6+J(1))} ${R1(y0-3)}`;
      out.push(`<path d="${d}" clip-path="url(#${id})" fill="none" stroke="${o.col||C.ink}" stroke-width="${o.w||1.1}" stroke-opacity="${o.op??.35}" stroke-linecap="round"/>`)},
    text(s,x,y,size,o={}){out.push(`<text x="${R1(x)}" y="${R1(y)}"${o.rot?` transform="rotate(${o.rot} ${R1(x)} ${R1(y)})"`:''} font-family="'Caveat',cursive" font-size="${size}" font-weight="700" fill="${o.col||C.ink}"${o.halo?` stroke="${o.halo}" stroke-width="6" stroke-linejoin="round" paint-order="stroke"`:''} text-anchor="middle">${esc(s)}</text>`)},
    cap(fn){const a=out.length;fn();return out.splice(a).join('')},
    chk(){if(!k._chk){k._chk=uid();defs.push(`<pattern id="${k._chk}" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#fff"/><path d="M0 0h4v4h-4zM4 4h4v4h-4z" fill="${C.ink}"/></pattern>`)}return k._chk}};
  return k}

/* ---------- seasons (world A's outdoor recolour, plus the season extras on k.ss) ---------- */
const HEXRE=/#(?:[0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})\b/g;
const h2c=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const c2h=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();
const mixH=(a,b,t)=>{const A=h2c(a),B=h2c(b);return c2h(A.map((v,i)=>v+(B[i]-v)*t))};
const SRC={spring:{g:'#D9F29C',ga:.3},autumn:{g:'#E6D08E',ga:.46,m:'#F6C27C',a:.04},
  winter:{g:'#E8EEE6',ga:.46,ds:.16,m:'#D9E2EC',a:.07,map:{'#BEE0F2':'#C5D2DB','#9CCDE8':'#AABCC9','#86BDDE':'#98AEBE','#7FB6D8':'#95ABBC'}}};
const hueOf=c=>{const [r,g,b]=c,mx=Math.max(r,g,b),mn=Math.min(r,g,b),d=mx-mn;if(!d||d/mx<.1)return -1;const h=mx===r?((g-b)/d)%6:mx===g?(b-r)/d+2:(r-g)/d+4;return (h*60+360)%360};
const isLeafy=c=>{const h=hueOf(c);return h>=66&&h<=128};
// keep: colours the season never touches (the caption ink and halo, the glow, the stickers and the lock chip)
const KEEP={'#5B3D32':1,'#FFF8EC':1,'#F28FA5':1,'#F3C969':1,'#FFE3EA':1,'#FBC9D5':1,'#FFFFFE':1};
function recolor(env){const St=SRC[env.ssn];if(!St)return null;const memo={};
  return m=>{let u=m.toUpperCase();if(u.length===4)u='#'+u[1]+u[1]+u[2]+u[2]+u[3]+u[3];if(KEEP[u])return m;if(memo[u])return memo[u];let c=h2c(u);
    const mp=St.map&&St.map[u];if(mp)c=h2c(mp);else if(isLeafy(c))c=c.map((v,i)=>v+(h2c(St.g)[i]-v)*St.ga);
    if(St.ds){const L=.3*c[0]+.59*c[1]+.11*c[2];c=c.map(v=>v+(L-v)*St.ds)}if(St.m){const t=h2c(St.m);c=c.map((v,i)=>v+(t[i]-v)*St.a)}return memo[u]=c2h(c)}}
const AU=[['#F2B25C','#C98336'],['#E8895A','#B9603E'],['#F3CB58','#C79C36'],['#DE6650','#AE463A']];
const PET=['#F9C6D4','#FFF1F4','#F7B6C8'];
// snow cap: a lumpy white ribbon on a top edge (pts left to right), outlined in cool grey pencil (world A capLine)
function capLine(k,pts,th){const P=dense(pts,false,9),n=P.length;if(n<2)return;
  const top=P.map((p,i)=>[p[0]+k.J(.5),p[1]-th*.38*Math.min(1,Math.sin(Math.PI*i/(n-1))*3+.2)+k.J(.5)]);
  const bot=[];for(let i=n-1;i>=0;i--){const t=i/(n-1),tp=Math.min(1,Math.sin(Math.PI*t)*2.2+.15),b=th*(.5+k.r()*.55)*(i%3===1?1.4:1)*tp;bot.push([P[i][0]+k.J(.6),P[i][1]+b])}
  k.fill(top.concat(bot),'#FFFFFE',{dx:0,dy:0,amp:.4});k.pen(top,false,{w:1.3,col:'#8EA2B8',amp:.4})}
const snow=(k,pts,th)=>{if(k.so==='winter')k.ss(()=>capLine(k,pts,th))};
// a leaf and a petal (world A), for the autumn and spring ground
function leafAt(k,x,y,s,rot,col,colD){const c=Math.cos(rot),n=Math.sin(rot),P=(u,v)=>`${R1(x+u*s*c-v*s*n)} ${R1(y+u*s*n+v*s*c)}`;
  return `<path d="M${P(-1,0)}Q${P(0,-.75)} ${P(1,0)}Q${P(0,.75)} ${P(-1,0)}Z" fill="${col}" stroke="${colD}" stroke-width=".9"/>`}
function petalAt(x,y,s,rot,col){const c=Math.cos(rot),n=Math.sin(rot),P=(u,v)=>`${R1(x+u*s*c-v*s*n)} ${R1(y+u*s*n+v*s*c)}`;
  return `<path d="M${P(-1,0)}Q${P(-.2,-.9)} ${P(.8,-.35)}L${P(.55,0)}L${P(.8,.35)}Q${P(-.2,.9)} ${P(-1,0)}Z" fill="${col}" stroke="#D68CA0" stroke-width=".7"/>`}

/* ---------- small doodles (map scale) ---------- */
const HT=(col,side=.6,gap=4.5,op=.5)=>({side,gap,col,op});
const dot=(k,x,y,r,col,sw)=>k.add(`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(r)}" fill="${col}"${sw?` stroke="${C.ink}" stroke-width="${sw}"`:''}/>`);
const circ=(k,x,y,r,col,w=1.5,o={})=>k.shape(E(x,y,r,r,Math.max(8,Math.round(r*1.1))),col,Object.assign({w,one:1},o));
const ell=(k,x,y,rx,ry,col,w=1.6,o={})=>k.shape(E(x,y,rx,ry,16),col,Object.assign({w},o));
function win(k,x,y,w,h,col=C.glass){k.shape(RC(x,y,w,h),col,{w:1.5,one:1});k.add(`<path d="M${R1(x+w/2)} ${R1(y)}v${R1(h)}M${R1(x)} ${R1(y+h/2)}h${R1(w)}" stroke="${C.ink}" stroke-width="1.2"/><path d="M${R1(x+w*.2)} ${R1(y+h*.4)}l${R1(w*.18)} ${R1(-h*.22)}" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`)}
function heart(k,x,y,r,col=C.pink){k.add(`<path d="M${R1(x)} ${R1(y+r)}C${R1(x-r*1.6)} ${R1(y-r*.2)} ${R1(x-r*.8)} ${R1(y-r*1.4)} ${R1(x)} ${R1(y-r*.5)}C${R1(x+r*.8)} ${R1(y-r*1.4)} ${R1(x+r*1.6)} ${R1(y-r*.2)} ${R1(x)} ${R1(y+r)}Z" fill="${col}" stroke="${C.ink}" stroke-width="1.4" stroke-linejoin="round"/>`)}
// a striped awning with a scalloped hem
function awn(k,x,y,w,h,c1,c2,n){const sw=w/n;let s='',sc=`M${R1(x)} ${R1(y+h)}`;for(let i=0;i<n;i++){s+=`<path d="M${R1(x+i*sw)} ${R1(y)}h${R1(sw+.4)}v${R1(h)}q${R1(-sw/2)} ${R1(h*.55)} ${R1(-sw-.4)} 0z" fill="${i%2?c2:c1}"/>`;sc+=`q${R1(sw/2)} ${R1(h*.55)} ${R1(sw)} 0`}
  k.add(s+`<path d="${sc}" fill="none" stroke="${C.ink}" stroke-width="1.7" stroke-linejoin="round"/>`);k.line([[x,y],[x+w,y]],2);k.line([[x,y],[x,y+h]],1.7);k.line([[x+w,y],[x+w,y+h]],1.7);
  snow(k,[[x-2,y],[x+w+2,y]],6)}
function duck(k,x,y,s=1){ell(k,x,y,9*s,6*s,C.yellow,1.2,{one:1});circ(k,x+7*s,y-6*s,4*s,C.yellow,1.1);k.add(`<path d="M${R1(x+10*s)} ${R1(y-6.5*s)}l${R1(5*s)} 1.5l${R1(-5*s)} 1.5z" fill="${C.orange}" stroke="${C.ink}" stroke-width=".8"/>`);dot(k,x+8*s,y-7*s,.9,C.ink)}
// the checkered flag: a run starts here
function flag(k,x,y,s=1){const w=24*s,h=15*s,c=w/6,top=y-38*s;let d='';for(let i=0;i<6;i++)for(let j=0;j<4;j++)if((i+j)%2===0)d+=`M${R1(x+i*c)} ${R1(top+j*h/4)}h${R1(c)}v${R1(h/4)}h${R1(-c)}z`;
  k.add('<g class="mb-flag">');k.line([[x,y],[x,y-40*s]],2.4);k.add(`<path d="M${R1(x)} ${R1(top)}h${R1(w)}v${R1(h)}h${R1(-w)}z" fill="#fff"/><path d="${d}" fill="${C.ink}"/>`);k.pen(RC(x,top,w,h),true,{w:1.4,one:1});k.add('</g>')}
// the checkered start arch on the run tracks
function arch(k,x,y,s=1){k.line([[x-30*s,y],[x-30*s,y-50*s]],4.5,C.woodD);k.line([[x+30*s,y],[x+30*s,y-50*s]],4.5,C.woodD);
  const band=[[x-38*s,y-46*s],[x-20*s,y-58*s],[x,y-62*s],[x+20*s,y-58*s],[x+38*s,y-46*s],[x+38*s,y-34*s],[x+20*s,y-45*s],[x,y-49*s],[x-20*s,y-45*s],[x-38*s,y-34*s]];
  k.shape(band,`url(#${k.chk()})`,{w:2,dx:0,dy:0,one:1});snow(k,band.slice(0,5),4*s);
  k.shape([[x-30*s,y-50*s],[x-30*s,y-66*s],[x-18*s,y-58*s]],C.pink,{w:1.2,one:1});k.shape([[x+30*s,y-50*s],[x+30*s,y-66*s],[x+42*s,y-58*s]],C.mint,{w:1.2,one:1})}
function bunt(k,P,cols){const S=crs(P,6);k.line(S,1.4);for(let i=1;i<S.length-1;i+=2){const [x,y]=S[i];k.shape([[x-6,y],[x+6,y],[x,y+12]],cols[i%cols.length],{w:1.1,one:1,dx:.4,dy:.3})}}
// map trees: kind 0/1 broadleaf (leaf, leaf2), 2 maple; crowns follow the season (autumn amber and rust, winter bare and snowy, spring blossom)
function mTree(k,x,y,s=1,kind=0){const p=blobP(x,y-14*s,17*s,15*s,k.r,9,.2),so=k.so;let col=kind===2?'#E9B074':kind?C.leaf2:C.leaf,colD=C.leafD;
  if(so==='autumn'){const a=AU[kind===2?3:hashXY(x,y)%3];col=a[0];colD=a[1]}else if(so==='winter'){col='#E3E8E1';colD='#B9C2BD'}else if(so==='spring'&&kind===2){col=C.leaf;}
  k.add(`<path d="M${R1(x)} ${R1(y+10*s)}V${R1(y-4*s)}" stroke="${C.trunkD}" stroke-width="${R1(3*s)}" stroke-linecap="round"/><path d="${smooth(p,true)}" fill="${col}" stroke="${C.ink}" stroke-width="1.5"/><path d="M${R1(x-5*s)} ${R1(y-12*s)}q3 -4 7 -1M${R1(x+4*s)} ${R1(y-19*s)}q3 -4 6 -1" fill="none" stroke="${colD}" stroke-width="1.2" stroke-linecap="round"/>`);
  k.ss(()=>{if(so==='winter')k.add(`<path d="M${R1(x-13*s)} ${R1(y-21*s)}q${R1(13*s)} ${R1(-14*s)} ${R1(26*s)} 0q${R1(-6*s)} ${R1(3*s)} ${R1(-13*s)} ${R1(2*s)}q${R1(-7*s)} ${R1(-1*s)} ${R1(-13*s)} ${R1(-2*s)}z" fill="#FFFFFE" stroke="#8EA2B8" stroke-width="1"/>`);
    else if(so==='spring'&&hashXY(y,x)%3!==0){let d='';for(let i=0;i<4;i++){const a=k.r()*6.28,rr=Math.sqrt(k.r())*.7;d+=`<circle cx="${R1(x+Math.cos(a)*13*s*rr)}" cy="${R1(y-14*s+Math.sin(a)*11*s*rr)}" r="${R1(2.6*s)}" fill="${PET[i%3]}" stroke="#D68CA0" stroke-width=".7"/>`}k.add(d)}})}
function mPine(k,x,y,s=1,col=C.pine){const t=[[x-15*s,y],[x+k.J(1),y-36*s],[x+15*s,y]];
  k.add(`<path d="M${R1(x)} ${R1(y)}v${R1(7*s)}" stroke="${C.trunkD}" stroke-width="2.6" stroke-linecap="round"/><path d="M${t.map(p=>R1(p[0]+k.J(.6))+' '+R1(p[1]+k.J(.6))).join('L')}Z" fill="${col}" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/><path d="M${R1(x+3*s)} ${R1(y-6*s)}l${R1(6*s)} ${R1(-10*s)}" stroke="${C.pineD}" stroke-width="1.2" stroke-linecap="round"/>`);
  k.ss(()=>{if(k.so==='winter')k.add(`<path d="M${R1(x-6*s)} ${R1(y-22*s)}L${R1(t[1][0])} ${R1(t[1][1]+1)}L${R1(x+6*s)} ${R1(y-22*s)}q${R1(-3*s)} ${R1(3*s)} ${R1(-6*s)} ${R1(1*s)}q${R1(-3*s)} ${R1(2*s)} ${R1(-6*s)} ${R1(-1*s)}z" fill="#FFFFFE" stroke="#8EA2B8" stroke-width="1"/>`)})}
function mHouse(k,x,y,s,wall,roof){const w=[[x-15*s,y-12*s],[x+15*s,y-12*s],[x+15*s,y+12*s],[x-15*s,y+12*s]],rf=[[x-19*s,y-11*s],[x,y-28*s],[x+19*s,y-11*s]],o=P=>`M${P.map(p=>R1(p[0]+k.J(.7))+' '+R1(p[1]+k.J(.7))).join('L')}Z`;
  k.add(`<path d="${o(w)}" fill="${wall}" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/><path d="${o(rf)}" fill="${roof}" stroke="${C.ink}" stroke-width="1.5" stroke-linejoin="round"/><rect x="${R1(x-4*s)}" y="${R1(y)}" width="${R1(7*s)}" height="${R1(12*s)}" fill="${C.ink}" opacity=".5"/>`);
  k.ss(()=>{if(k.so==='winter')k.add(`<path d="M${R1(x-18*s)} ${R1(y-12*s)}L${R1(x)} ${R1(y-28*s)}L${R1(x+18*s)} ${R1(y-12*s)}L${R1(x+11*s)} ${R1(y-15*s)}L${R1(x)} ${R1(y-22*s)}L${R1(x-11*s)} ${R1(y-15*s)}Z" fill="#FFFFFE" stroke="#8EA2B8" stroke-width=".9" stroke-linejoin="round"/>`)})}
// festival dressing (worlds A, C, D): a pumpkin (with a smile), a bulb string, a kadomatsu, a shimekazari, a paper kite, a felt bat
function pumpkin(k,x,gy,s=1){k.shape(E(x,gy-9*s,13*s,9.5*s,12),'#F2A04E',{w:1.5,one:1,hatch:{side:.55,gap:3.5,col:'#D27C34',op:.5}});
  k.add(`<path d="M${R1(x-5*s)} ${R1(gy-17*s)}q${R1(-3*s)} ${R1(8*s)} 0 ${R1(16*s)}M${R1(x+5*s)} ${R1(gy-17*s)}q${R1(3*s)} ${R1(8*s)} 0 ${R1(16*s)}" fill="none" stroke="#C9762F" stroke-width="1.2"/><path d="M${R1(x-6*s)} ${R1(gy-11*s)}l${R1(2.5*s)} ${R1(-4*s)} ${R1(2.5*s)} ${R1(4*s)}zM${R1(x+1*s)} ${R1(gy-11*s)}l${R1(2.5*s)} ${R1(-4*s)} ${R1(2.5*s)} ${R1(4*s)}zM${R1(x-6*s)} ${R1(gy-7*s)}q${R1(6*s)} ${R1(6*s)} ${R1(12*s)} 0z" fill="#7A4630"/>`);
  k.line([[x,gy-18*s],[x+2*s,gy-23*s]],2.2,'#7D9A55')}
const LTC=['#F7D24E','#F28FA5','#9CCB80','#8FC1E8','#F8A95E'];
function bulbs(k,P,gap=16){k.line(P,1.1,C.ink,{op:.85,amp:.3});let t=gap*.5,i=0,s='';
  for(let j=1;j<P.length;j++){const a=P[j-1],b=P[j],L=Math.hypot(b[0]-a[0],b[1]-a[1])||1;while(t<L){const x=a[0]+(b[0]-a[0])*t/L,y=a[1]+(b[1]-a[1])*t/L;s+=`<ellipse cx="${R1(x)}" cy="${R1(y+4)}" rx="2.6" ry="3.6" fill="${LTC[i%5]}" stroke="${C.ink}" stroke-width=".8"/>`;i++;t+=gap}t-=L}
  k.add(`<g class="mf-bulbs">${s}</g>`)}
const sag=(x0,y0,x1,y1,s,n=10)=>{const L=[];for(let i=0;i<=n;i++){const t=i/n;L.push([x0+(x1-x0)*t,y0+(y1-y0)*t+Math.sin(Math.PI*t)*s])}return L};
function kado(k,x,gy,s=1,f=1){[[-8,56],[0,74],[8,46]].forEach(([dx,h])=>{const sx=x+dx*s*f,top=gy-h*s,bw=7*s;k.shape([[sx-bw/2,gy-20*s],[sx-bw/2,top+4*s*f],[sx+bw/2,top-4*s*f],[sx+bw/2,gy-20*s]],'#A2C77F',{w:1.2,one:1});
    k.add(`<ellipse cx="${R1(sx)}" cy="${R1(top)}" rx="${R1(bw*.42)}" ry="${R1(4*s)}" transform="rotate(${-56*f} ${R1(sx)} ${R1(top)})" fill="#F1EAC2" stroke="#9C8B4E" stroke-width=".9"/>`)});
  let d='';[[-14,-34],[14,-32],[-8,-44],[9,-46]].forEach(([dx,dy])=>{const px=x+dx*s,py=gy+dy*s;for(const a of[-.6,0,.6])d+=`M${R1(px)} ${R1(py)}l${R1(Math.cos(a-1.57+dx/20)*7*s)} ${R1(Math.sin(a-1.57)*7*s)}`});k.add(`<path d="${d}" stroke="#4F8A5A" stroke-width="${R1(1.6*s)}" stroke-linecap="round"/>`);
  k.shape([[x-15*s,gy],[x+15*s,gy],[x+12*s,gy-24*s],[x-12*s,gy-24*s]],'#E8CF92',{w:1.3,one:1});k.line([[x-13*s,gy-18*s],[x+13*s,gy-18*s]],2,'#6E5034',{amp:.2})}
function shime(k,x,y,s=1){k.shape([[x-15*s,y-3*s],[x+15*s,y-3*s],[x+13*s,y+3*s],[x-13*s,y+3*s]],'#E8CF92',{w:1.2,one:1});
  let t='';for(let i=-2;i<=2;i++)t+=`M${R1(x+i*2*s)} ${R1(y+3*s)}l${R1(i*.8*s)} ${R1(10*s)}`;k.add(`<path d="${t}" stroke="#C9A55E" stroke-width="${R1(1.3*s)}" stroke-linecap="round"/>`);
  [-10,10].forEach(dx=>k.add(`<path d="M${R1(x+dx*s)} ${R1(y+3*s)}v${R1(4*s)}h${R1(3*s)}v${R1(4*s)}h${R1(-3*s)}v${R1(4*s)}" fill="none" stroke="#fff" stroke-width="${R1(2.2*s)}"/>`));circ(k,x,y+1*s,4.6*s,'#F59A3A',1)}
function kite(k,x,y,s,col,lx,ly){k.line([[x,y+16*s],[(x+lx)/2+12,(y+ly)/2+20],[lx,ly]],1,C.ink,{op:.55,step:18,amp:.4});
  k.shape([[x,y-20*s],[x+14*s,y],[x,y+19*s],[x-14*s,y]],col,{w:1.5,one:1,hatch:{gap:3.6,col:'#F28FA5',op:.7,w:1.4}});k.line([[x,y+19*s],[x+6*s,y+30*s],[x-3*s,y+40*s],[x+4*s,y+50*s]],1,C.ink,{op:.8,amp:.3})}
function bat(k,x,y,s=1){const W=d=>[[x+d*3*s,y-2.4*s],[x+d*9*s,y-8*s],[x+d*15*s,y-9.4*s],[x+d*20*s,y-5*s],[x+d*16.4*s,y-1.6*s],[x+d*13*s,y-3.2*s],[x+d*10.6*s,y+1.6*s],[x+d*7.2*s,y-.4*s],[x+d*3.6*s,y+3.2*s]];
  k.shape(W(-1),'#7A6698',{w:1.1,one:1});k.shape(W(1),'#7A6698',{w:1.1,one:1});k.shape(E(x,y,4.6*s,5.6*s,10),'#7A6698',{w:1.1,one:1});dot(k,x-1.8*s,y-1.2*s,1.1*s,'#fff');dot(k,x+1.8*s,y-1.2*s,1.1*s,'#fff')}
function torii(k,x,y,s=1){k.line([[x-14*s,y],[x-14*s,y-34*s]],3.2*s,'#D9573F');k.line([[x+14*s,y],[x+14*s,y-34*s]],3.2*s,'#D9573F');
  k.shape([[x-24*s,y-38*s],[x+24*s,y-38*s],[x+21*s,y-32*s],[x-21*s,y-32*s]],'#E8664F',{w:1.5,one:1});k.line([[x-18*s,y-25*s],[x+18*s,y-25*s]],2.4*s,'#D9573F');snow(k,[[x-24*s,y-38*s],[x+24*s,y-38*s]],4*s)}

/* ---------- the places (V215 section 2): key, centre, English name, a run starts here ---------- */
const B=[['yard',270,690,'My Yard'],['house',440,550,'Cozy House'],['market',600,790,'Kibble Corner'],['shelter',1030,440,'Doodle Doggo Shelter'],
  ['square',1240,780,'Town Square',1],['cafe',1470,630,'Pupuccino Café'],['boutique',1650,440,'Bow-Wow Boutique'],['salon',1850,640,'Grooming Salon'],
  ['vet',1130,1000,'Vet Clinic'],['builder',650,1170,'Barkitecture'],['sprout',1400,320,"Pip's Sprout Cart"],['park',400,1000,'Sunny Park',1],
  ['dogpark',1420,1010,'Dog Park'],['training',1720,890,'Training Ground'],['pool',1630,1200,'Splash Pool'],['river',955,1180,'Riverside Trail',1],
  ['woods',2150,550,'Maple Woods',1],['hilltop',1160,140,'Hilltop Meadow',1],['beach',1890,1350,'Seashell Beach',1],['pier',2170,1330,'Lighthouse Pier',1],
  ['station',250,1290,'Station'],['fujihill',300,370,'Mt. Fuji Lookout'],['sunflower',610,300,'Sunflower Lanes',1],['bamboo',1910,250,'Bamboo Grove Trail',1],
  ['cliffs',2290,1040,'Seaside Cliffs Run',1]];
const BI={};B.forEach(b=>{BI[b[0]]={id:b[0],x:b[1],y:b[2],n:b[3],run:!!b[4]}});

/* ---------- building art, local units: 0 0 = the building's centre, its base at about y 46. Each its own silhouette, colour and roof sign ---------- */
const ART={
 yard(k){ell(k,0,32,96,24,C.grass,0,{noline:1,dx:0,dy:0});
  for(let i=-86;i<=86;i+=14){const yy=-2+Math.abs(i)*.05;k.shape([[i-5,yy+14],[i-5,yy-8],[i,yy-14],[i+5,yy-8],[i+5,yy+14]],'#FFFFFF',{w:1.2,one:1,dx:.4,dy:.3})}
  k.line([[-92,-2],[92,-2]],1.6);k.line([[-92,8],[92,8]],1.6);
  k.lt(()=>bulbs(k,sag(-92,-6,-28,-6,5).concat(sag(-28,-6,40,-6,5).slice(1),sag(40,-6,92,-6,5).slice(1)),13));
  k.shape([[-62,44],[-62,8],[-30,-16],[2,8],[2,44]],C.wood,{w:2,hatch:HT(C.woodD)});k.shape([[-74,12],[-30,-28],[14,12]],C.redD,{w:2.2,hatch:HT('#B9545C',.55)});snow(k,[[-72,11],[-30,-27],[12,11]],7);
  k.add(`<path d="M-42 44v-16a12 12 0 0 1 24 0v16z" fill="${C.ink}" opacity=".8"/>`);k.add(`<path d="M-38 -5h16" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`);dot(k,-39,-5,3,'#fff',1);dot(k,-21,-5,3,'#fff',1);
  mTree(k,64,16,.95);ell(k,30,42,13,5,C.redD,1.5,{one:1});dot(k,26,38,2.6,'#C98F5A');dot(k,32,37,2.6,'#C98F5A');circ(k,58,46,6,'#E3F07A',1.3);
  k.hw(()=>{pumpkin(k,-84,46,1.1);pumpkin(k,82,48,.9);pumpkin(k,8,50,.75)})},
 house(k){k.shape(RC(22,-62,14,32),C.roofD,{w:1.8,one:1});k.shape(RC(-48,-12,96,58),C.wall,{w:2.2,hatch:HT('#D9B996',.7)});
  k.shape([[-60,-8],[0,-64],[60,-8]],C.roof,{w:2.2,hatch:HT(C.roofD)});snow(k,[[-58,-9],[0,-63],[58,-9]],8);
  k.add(`<g class="mf-smoke">${[0,1,2,3].map(i=>`<path d="${smooth(blobP(30+i*6+i*i*1.6,-72-i*13,4+i*2.2,(4+i*2.2)*.8,k.r,8,.3),true)}" fill="#F7F4F1" fill-opacity="${R1(.92-i*.12)}" stroke="${C.graph}" stroke-width="1.1" stroke-opacity="${R1(.85-i*.12)}"/>`).join('')}</g>`);
  circ(k,0,-30,10,C.glass,1.7);heart(k,0,-29,4.5);k.shape(RC(-10,14,20,32),'#9FD3B5',{w:1.8,one:1});dot(k,5,30,1.8,C.ink);win(k,-40,2,20,17);win(k,20,2,20,17);
  k.shape(RC(-43,20,26,6),C.woodD,{w:1.1,one:1});k.shape(RC(17,20,26,6),C.woodD,{w:1.1,one:1});[-37,-29,-21,23,31,39].forEach((x,i)=>dot(k,x,18,2.6,i%2?C.yellow:C.pink,.9));
  [[-6,54],[4,60],[-2,68]].forEach(([x,y])=>ell(k,x,y,7,3,C.stone,1,{one:1}));k.ny(()=>shime(k,0,10,.7))},
 market(k){k.shape(RC(-58,-18,116,64),C.yellow,{w:2.2,hatch:HT('#E2C25E',.7)});k.shape(RC(-62,-28,124,11),C.woodD,{w:2,one:1});
  const bowl=[[-42,-62],[42,-62],[30,-30],[-30,-30]];k.shape(bowl,C.redD,{w:2.2,hatch:HT('#B9545C',.55)});k.line([[-44,-62],[44,-62]],3.2);
  for(let r=0;r<3;r++)for(let i=0;i<7-r*2;i++)circ(k,-24+r*8+i*8+k.J(1),-66-r*6,4.6,'#C98F5A',1.1);snow(k,[[-30,-70],[0,-82],[30,-70]],6);
  dot(k,0,-45,4,'#fff',1);[[-6,-51],[0,-53],[6,-51]].forEach(([x,y])=>dot(k,x,y,1.8,'#fff'));
  awn(k,-58,-16,116,13,C.red,'#FFFFFF',9);k.shape(RC(-48,8,44,30),C.glass,{w:1.8,one:1});ell(k,-36,32,7,6,'#E9D3AE',1,{one:1});ell(k,-22,32,7,6,'#E9D3AE',1,{one:1});
  k.shape(RC(12,6,24,40),C.woodD,{w:1.8,one:1});dot(k,31,26,1.8,C.ink);
  const sack=(x,y)=>{k.shape([[x-12,y+10],[x-14,y-6],[x-8,y-14],[x+8,y-14],[x+14,y-6],[x+12,y+10]],'#E9D3AE',{w:1.5,one:1});k.line([[x-6,y-12],[x+6,y-12]],1.5);dot(k,x,y-1,3,'#C98F5A',.8)};
  sack(-74,34);sack(-56,38);sack(74,36)},
 shelter(k){const barn=[[-68,46],[-68,-8],[-46,-34],[0,-50],[46,-34],[68,-8],[68,46]];k.shape(barn,'#EE9A92',{w:2.4,hatch:HT('#CF7A72',.66)});
  k.line([[-64,-8],[-45,-31],[0,-46],[45,-31],[64,-8]],4.5,'#FFFFFF');k.line([[-68,-8],[-46,-34],[0,-50],[46,-34],[68,-8]],2.2);snow(k,[[-66,-9],[-46,-35],[0,-51],[46,-35],[66,-9]],8);
  k.shape(RC(-20,6,40,40),'#FFFFFF',{w:2,one:1});k.line([[-18,8],[18,44]],2.4,C.redD);k.line([[18,8],[-18,44]],2.4,C.redD);k.line([[0,6],[0,46]],1.5);heart(k,0,-24,9);
  const pup=(x,y)=>{circ(k,x,y,12,C.glass,1.8);ell(k,x-7,y-3,3,6,'#C9A07A',1,{one:1});ell(k,x+7,y-3,3,6,'#C9A07A',1,{one:1});circ(k,x,y+1,6.5,'#F1D7B5',1.2);dot(k,x-2.4,y,1.1,C.ink);dot(k,x+2.4,y,1.1,C.ink);dot(k,x,y+3,1.4,C.ink)};
  pup(-44,6);pup(44,6);k.line([[0,-50],[0,-78]],2);k.line([[-12,-70],[12,-70]],2);k.add(`<path d="M12 -70l-6 -4v8z" fill="${C.ink}"/>`);dot(k,0,-84,4.5,C.ink);[[-5,-90],[0,-92],[5,-90]].forEach(([x,y])=>dot(k,x,y,2,C.ink));
  k.shape(RC(-92,24,22,20),'#F3D98B',{w:1.5,one:1,hatch:HT('#D9B65E',.4)});k.ny(()=>{kado(k,-30,46,.5,-1);kado(k,30,46,.5,1)})},
 square(k){ell(k,4,26,96,40,'#EDE6DC',2.2);k.add(`<ellipse cx="4" cy="26" rx="76" ry="31" fill="none" stroke="${C.stoneD}" stroke-width="1.5" stroke-dasharray="8 7"/>`);
  let cb='';for(let i=0;i<26;i++){const a=k.r()*6.28,rr=40+k.r()*45;cb+=`<ellipse cx="${R1(4+Math.cos(a)*rr)}" cy="${R1(26+Math.sin(a)*rr*.4)}" rx="5" ry="2.6" fill="none" stroke="${C.stoneD}" stroke-width="1"/>`}k.add(cb);
  ell(k,12,30,30,12,C.stone,2);ell(k,12,28,23,8,C.water,1.2,{noline:1});k.line([[12,26],[12,-4]],4,C.stoneD);k.add(`<path d="M12 -4q-16 2 -20 24M12 -4q16 2 20 24" fill="none" stroke="#86BDDE" stroke-width="2.4" stroke-linecap="round"/>`);
  k.shape(RC(-74,-78,28,104),'#E6DDD0',{w:2.2,hatch:HT(C.stoneD,.6)});k.shape([[-80,-76],[-60,-106],[-40,-76]],C.redD,{w:2,one:1});snow(k,[[-78,-77],[-60,-104],[-42,-77]],6);circ(k,-60,-56,9,'#FFFFFF',1.7);
  k.add(`<path d="M-60 -56v-6M-60 -56l5 2" stroke="${C.ink}" stroke-width="1.6" stroke-linecap="round"/>`);k.shape(RC(-66,6,12,20),C.woodD,{w:1.3,one:1});
  bunt(k,[[-46,-62],[20,-40],[84,-30]],[C.pink,C.yellow,C.mint,C.lav]);k.lt(()=>bulbs(k,crs([[-46,-58],[20,-36],[84,-26]],6),11));
  k.line([[84,40],[84,-30]],2.2);circ(k,84,-34,5,C.yellow,1.3);mTree(k,-96,30,.6,1);flag(k,62,42);
  k.hw(()=>{pumpkin(k,-36,54,1.05);pumpkin(k,46,56,.9);pumpkin(k,-14,58,.7)})},
 cafe(k){k.shape(RC(-52,-12,104,58),C.wall,{w:2.2,hatch:HT('#D9B996',.72)});k.shape(RC(-56,-20,112,10),C.woodD,{w:2,one:1});
  ell(k,0,-21,36,5,'#FFFFFF',1.7,{one:1});const cup=[[-26,-60],[26,-60],[20,-24],[-20,-24]];k.shape(cup,'#FFFFFF',{w:2.2,hatch:HT('#D7CFC6',.6)});k.shape([[-24,-50],[24,-50],[22,-42],[-22,-42]],'#C9A07A',{w:1.1,one:1});
  ell(k,0,-60,26,5,'#F3E1C7',1.5,{one:1});k.line([[24,-52],[38,-48],[36,-34],[21,-31]],3);snow(k,[[-27,-62],[0,-66],[27,-62]],5);
  k.add(`<g class="mf-steam">${[-10,2,14].map(x=>`<path d="${smooth([[x,-68],[x-5,-78],[x+3,-88],[x-3,-98]],false)}" fill="none" stroke="${C.graph}" stroke-width="2" stroke-linecap="round"/>`).join('')}</g>`);
  awn(k,-52,-8,104,12,'#C9A07A','#FFFFFF',8);k.shape(RC(-44,10,32,26),C.glass,{w:1.8,one:1});k.shape(RC(4,8,20,38),C.woodD,{w:1.8,one:1});k.shape(RC(30,10,16,24),C.glass,{w:1.5,one:1});
  const tb=(x,c)=>{k.line([[x,10],[x,44]],2);k.shape([[x-18,12],[x,-2],[x+18,12]],c,{w:1.5,one:1});ell(k,x,42,12,4,C.wood,1.2,{one:1})};tb(-74,C.mint);tb(76,C.pink);
  k.lt(()=>bulbs(k,sag(-52,-6,52,-6,7,12),12));k.hw(()=>{pumpkin(k,-62,48,.85);pumpkin(k,34,52,1)})},
 boutique(k){k.shape(RC(-40,-46,80,92),C.lav,{w:2.2,hatch:HT('#B9A3DE',.7)});const rf=[[-48,-44],[-36,-70],[36,-70],[48,-44]];k.shape(rf,C.pink,{w:2.2,hatch:HT('#D9708A',.6)});
  let sc='M-48 -44';for(let i=0;i<8;i++)sc+='q6 7 12 0';k.add(`<path d="${sc}" fill="none" stroke="${C.ink}" stroke-width="1.6"/>`);snow(k,[[-38,-70],[38,-70]],7);
  k.shape([[-2,-80],[-30,-98],[-34,-66]],C.redD,{w:2,one:1});k.shape([[2,-80],[30,-98],[34,-66]],C.redD,{w:2,one:1});circ(k,0,-80,6.5,C.redD,1.7);
  k.line([[-3,-76],[-12,-60]],3,C.redD);k.line([[3,-76],[12,-60]],3,C.redD);
  [-24,8].forEach(x=>k.shape([[x,-20],[x,-34],[x+8,-40],[x+16,-34],[x+16,-20]],C.glass,{w:1.4,one:1}));
  awn(k,-36,-16,72,10,C.pink,'#FFFFFF',7);k.shape(RC(-32,-4,64,42),C.glass,{w:2,one:1});
  k.line([[0,36],[0,26]],1.5);k.shape([[-13,26],[13,26],[0,4]],C.pink,{w:1.4,one:1});circ(k,0,2,6,'#FFFFFF',1.2);ell(k,-5,-3,2.4,4,'#FFFFFF',1,{one:1});ell(k,5,-3,2.4,4,'#FFFFFF',1,{one:1});
  k.line([[40,-30],[58,-30]],2);k.line([[56,-30],[56,-24]],1.4);circ(k,56,-14,10,'#FFFFFF',1.7);k.add(`<path d="M56 -14l-7 -5v10zM56 -14l7 -5v10z" fill="${C.pink}" stroke="${C.ink}" stroke-width="1"/>`);
  k.lt(()=>bulbs(k,sag(-48,-44,48,-44,6,12),12));k.hw(()=>{pumpkin(k,-54,48,1);pumpkin(k,52,48,.8);bat(k,64,-62,1)})},
 salon(k){k.shape(RC(-50,-16,100,62),'#FDE3EA',{w:2.2,hatch:HT('#E6B5C2',.72)});
  [[-40,-22,13],[-17,-31,16],[8,-29,15],[31,-30,13],[48,-20,10]].forEach(([x,y,r])=>circ(k,x,y,r,'#FFFFFF',1.7,{lcol:'#5C8FB8'}));snow(k,[[-26,-44],[-17,-47],[8,-45],[20,-43]],4);
  k.shape(RC(-70,-8,11,54),'#FFFFFF',{w:1.5,one:1});[-2,10,22,34].forEach(y=>k.line([[-70,y+6],[-59,y-2]],3,C.pink));circ(k,-64.5,-11,6,C.pink,1.3);
  k.add(`<g fill="none" stroke="${C.ink}" stroke-width="2.4"><circle cx="-8" cy="4" r="5.5"/><circle cx="8" cy="4" r="5.5"/><path d="M-4 0l18 -18M4 0l-18 -18"/></g>`);
  k.shape(RC(-10,16,22,30),C.lav,{w:1.8,one:1});win(k,22,2,22,18);win(k,-42,2,22,18);
  [[60,-44,6],[72,-58,4.5],[58,-68,3.5]].forEach(([x,y,r])=>circ(k,x,y,r,'#FFFFFF',1.1,{lcol:'#5C8FB8'}));
  k.shape([[52,30],[90,30],[86,44],[56,44]],'#FFFFFF',{w:1.7,one:1});k.line([[58,44],[56,50]],2);k.line([[84,44],[86,50]],2);[[62,26,4],[72,24,5],[82,27,3.5]].forEach(([x,y,r])=>circ(k,x,y,r,'#FFFFFF',1,{lcol:'#5C8FB8'}))},
 vet(k){k.shape(RC(-56,-14,112,60),'#FFFFFF',{w:2.2,hatch:HT('#C9D3DD',.72)});const rf=[[-64,-10],[0,-46],[64,-10]];k.shape(rf,C.blue,{w:2.2,hatch:HT('#8FAFD6',.6)});snow(k,[[-62,-11],[0,-45],[62,-11]],7);
  circ(k,0,-24,11,'#FFFFFF',1.5);k.add(`<path d="M-3.5 -32h7v5h5v7h-5v5h-7v-5h-5v-7h5z" fill="${C.redD}" stroke="${C.ink}" stroke-width="1.2"/>`);
  k.shape(RC(-11,14,22,32),C.mint,{w:1.8,one:1});win(k,-46,0,22,18);win(k,24,0,22,18);k.line([[-14,10],[-6,20],[6,20],[14,10]],2);circ(k,14,8,3,C.stoneD,1.1);
  k.line([[78,46],[78,8]],2.2);k.shape([[62,-4],[94,-4],[94,10],[62,10]],'#FFFFFF',{w:1.5,one:1});k.line([[64,3],[72,3],[75,-1],[79,8],[82,3],[92,3]],1.6,C.redD,{amp:.1})},
 builder(k){k.shape(RC(-64,-12,128,58),C.wood,{w:2.2,hatch:HT(C.woodD,.74)});for(let x=-54;x<64;x+=12)k.line([[x,-10],[x,44]],1,C.woodD,{amp:.3});
  const rf=[[-68,-10],[-68,-46],[-4,-10],[-4,-46],[66,-10]];k.shape(rf,'#9AA7B8',{w:2.2,hatch:HT('#76849A',.5)});snow(k,[[-68,-46],[-6,-12]],5);snow(k,[[-4,-46],[64,-11]],5);
  k.line([[20,-74],[52,-34]],7.5);k.line([[20,-74],[52,-34]],4.5,C.woodD);k.shape([[4,-86],[36,-66],[29,-56],[-3,-76]],C.stoneD,{w:2,one:1,hatch:HT('#9D9284',.5)});
  k.shape(RC(-36,4,46,42),'#8A6B5A',{w:2,one:1});k.line([[-36,16],[10,16]],1,'#6E5446');
  k.line([[56,46],[56,22]],3,C.woodD);k.line([[86,46],[86,22]],3,C.woodD);k.line([[52,24],[71,8],[90,24]],3,C.woodD);k.line([[56,34],[86,34]],2,C.woodD);
  [0,1,2].forEach(i=>k.shape(RC(-98,28+i*6,34,6),i%2?C.wood:C.woodD,{w:1.2,one:1}));[[-30,50],[-20,52],[0,50],[14,53]].forEach(([x,y])=>dot(k,x,y,1.6,C.woodD))},
 sprout(k){k.line([[-48,-24],[-48,-2]],2.6);k.line([[48,-24],[48,-2]],2.6);
  awn(k,-56,-44,112,16,'#9ACD7C','#FFFFFF',8);k.shape(RC(-50,-6,100,32),'#BFE3C9',{w:2.2,hatch:HT('#8FC4A0',.7)});k.line([[-50,-6],[50,-6]],3,C.woodD);
  ['#F28FA5','#FCE59A','#B9D3F2','#F8C08A','#DCCBF2'].forEach((c,i)=>{k.shape(RC(-42+i*17,0,13,17),c,{w:1.1,one:1});k.line([[-35.5+i*17,10],[-35.5+i*17,5]],1.3,C.leafD)});
  const wh=x=>{circ(k,x,32,15,C.wood,2);k.add(`<path d="M${x-13} 32h26M${x} 19v26M${x-9} 23l18 18M${x+9} 23l-18 18" stroke="${C.ink}" stroke-width="1.2"/>`);circ(k,x,32,3,C.woodD,1)};
  wh(-28);wh(28);k.line([[-50,4],[-76,-8]],3.2,C.woodD);
  k.shape([[62,30],[80,30],[76,46],[66,46]],C.roofD,{w:1.5,one:1});k.line([[71,30],[71,4]],2,C.leafD);circ(k,71,-4,11,C.yellow,1.5);circ(k,71,-4,4.5,'#A97E5A',1);
  k.shape([[-90,34],[-70,34],[-72,50],[-88,50]],C.blue,{w:1.5,one:1});k.line([[-70,38],[-60,30]],2.4);
  [-60,-44,-28,28,44,60].forEach(x=>k.line([[x-4,58],[x,52],[x+4,58]],1.7,C.leafD,{amp:.2}))},
 park(k){ell(k,0,26,98,34,C.grass,0,{noline:1,dx:0,dy:0});ell(k,18,30,44,15,C.water,2);circ(k,4,34,4,'#9ACD7C',1);circ(k,36,26,3.4,'#9ACD7C',1);duck(k,24,26);
  ell(k,-54,26,30,8,C.stone,1.8);[-78,-64,-44,-30].forEach(x=>k.line([[x,24],[x,-10]],2.4,C.woodD));
  const rf=[[-88,-8],[-70,-28],[-54,-36],[-38,-28],[-20,-8]];k.shape(rf,C.mint,{w:2,hatch:HT('#8FC4A0',.6)});snow(k,rf,6);k.line([[-54,-36],[-54,-48]],1.8);circ(k,-54,-50,3.2,C.pink,1);
  mTree(k,62,-8,1.25);mTree(k,-98,16,.7,1);[[-20,48,C.red],[70,44,C.yellow],[-84,44,C.lav]].forEach(([x,y,c])=>dot(k,x,y,3.6,c,1));flag(k,90,40)},
 dogpark(k){[[-62,6],[-62,38],[62,6],[62,38]].forEach(([x,y])=>circ(k,x,y,20,C.grass,2.2));k.shape(RC(-64,4,128,36),C.grass,{noline:1,dx:0,dy:0});
  k.line([[-62,-14],[62,-14]],2.2);k.line([[-62,58],[62,58]],2.2);k.add(`<path d="M-56 -8H56M-56 52H56" stroke="${C.ink}" stroke-width="2" stroke-dasharray="3 6" fill="none" opacity=".45"/>`);
  k.shape([[-40,32],[-40,6],[-36,-2],[-26,-2],[-22,6],[-22,32]],C.redD,{w:2,one:1});ell(k,-31,-4,8,4,C.redD,1.5,{one:1});k.shape(RC(-46,12,30,6),C.redD,{w:1.3,one:1});snow(k,[[-38,-5],[-24,-5]],4);
  k.shape([[20,36],[36,8],[52,36]],C.yellow,{w:1.8,one:1});k.line([[28,22],[44,22]],2,C.redD);circ(k,4,30,5,'#E3F07A',1.2);circ(k,70,22,5,'#E3F07A',1.2);
  k.line([[0,-14],[0,-40]],2.4,C.woodD);k.shape(RC(-20,-58,40,22),C.wood,{w:1.8,one:1});snow(k,[[-21,-58],[21,-58]],4);dot(k,0,-45,4.2,C.ink);[[-5,-52],[0,-54],[5,-52]].forEach(([x,y])=>dot(k,x,y,2,C.ink))},
 training(k){ell(k,0,22,100,42,C.sand,2.2,{hatch:HT(C.sandD,.6,5,.4)});
  for(let a=Math.PI*1.05;a<Math.PI*1.96;a+=Math.PI/8){const x=Math.cos(a)*100,y=22+Math.sin(a)*42;k.line([[x,y],[x,y-14]],2.4,C.woodD)}
  k.line(crs([[-98,6],[-70,-12],[-30,-20],[30,-20],[70,-12],[98,6]],4),1.4,C.woodD,{amp:.3});bunt(k,[[-80,-30],[0,-44],[80,-30]],['#7FA6D9','#FFFFFF']);
  for(let i=0;i<6;i++){const x=-74+i*10,y=8+i*3.5;k.add(`<path d="M${x} ${R1(y)}V${R1(y-26)}" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/><path d="M${x} ${R1(y)}V${R1(y-26)}" stroke="${C.redD}" stroke-width="4.5" stroke-dasharray="5 5"/><path d="M${x+2.4} ${R1(y)}V${R1(y-26)}" stroke="${C.ink}" stroke-width="1" opacity=".5"/>`)}
  k.line([[10,30],[10,2]],2.4);k.line([[40,30],[40,2]],2.4);k.add(`<path d="M8 10H42" stroke="#7FA6D9" stroke-width="5"/><path d="M8 10H42" stroke="#FFFFFF" stroke-width="5" stroke-dasharray="6 6"/>`);
  k.line([[58,34],[58,-10]],2.4);k.line([[86,34],[86,-10]],2.4);k.line([[56,-10],[88,-10]],2.4);circ(k,72,10,11,C.orange,2);circ(k,72,10,5,C.sand,1.3);
  k.add(`<path d="M-42 50Q-42 28 -8 28Q26 28 26 50Z" fill="${C.blue}" stroke="${C.ink}" stroke-width="2"/>`+[-30,-18,-6,6,16].map(x=>`<path d="M${x} 31V50" stroke="#7FA6D9" stroke-width="1.2"/>`).join(''));snow(k,[[-38,36],[-8,28],[22,36]],4);
  k.line([[-86,-34],[-86,-16]],2.2);k.line([[-58,-34],[-58,-16]],2.2);k.shape(RC(-96,-62,48,28),C.pineD,{w:2,one:1});snow(k,[[-97,-62],[-47,-62]],5);circ(k,-72,-48,7,C.yellow,1.3);k.line([[-72,-42],[-76,-34]],2,C.yellow);k.line([[-72,-42],[-68,-34]],2,C.yellow);
  k.line([[90,-18],[90,-64]],2.2);circ(k,90,-66,8,'#7FA6D9',1.5);circ(k,90,-66,3.4,C.yellow,1);k.shape([[86,-60],[84,-48],[89,-52]],'#7FA6D9',{w:1,one:1});k.shape([[94,-60],[96,-48],[91,-52]],'#7FA6D9',{w:1,one:1})},
 pool(k){k.shape(RC(-92,-16,184,66),'#EEF6F8',{w:2.2});let g='';for(let x=-76;x<92;x+=16)g+=`M${x} -15V49`;for(let y=0;y<50;y+=16)g+=`M-91 ${y}H91`;k.add(`<path d="${g}" stroke="${C.stoneD}" stroke-width=".8" opacity=".75"/>`);
  k.shape([[-72,6],[-44,-6],[-4,0],[40,-8],[74,6],[72,30],[34,40],[-8,32],[-48,40],[-76,28]],C.teal,{w:2.2,lcol:'#3F7F8C'});
  k.add(`<path d="M-50 14q7 -3 14 -2t14 4M10 22q7 -4 14 -3t16 4M-30 28h14" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round"/>`);
  k.shape([[50,40],[78,46],[70,22],[44,18]],C.wood,{w:1.7,one:1});[0,1,2].forEach(i=>k.line([[48+i*8,22+i],[54+i*8,42+i*1.5]],1,C.woodD,{amp:.2}));
  circ(k,-22,14,10,'#FFFFFF',1.7);k.add(`<path d="M-22 4a10 10 0 0 1 10 10M-32 14a10 10 0 0 1 10 -10M-22 24a10 10 0 0 1 -10 -10M-12 14a10 10 0 0 1 -10 10" fill="none" stroke="${C.redD}" stroke-width="5"/>`);circ(k,-22,14,4,C.teal,1.1);
  duck(k,22,10,.8);k.line([[-88,26],[-82,-24]],2.4);k.line([[-66,26],[-72,-24]],2.4);[0,12].forEach(y=>k.line([[-86,y],[-68,y]],1.6));
  k.shape(RC(-94,-38,32,12),C.red,{w:1.7,one:1});k.add(`<path d="M-86 -38v12M-74 -38v12" stroke="#fff" stroke-width="3"/>`);snow(k,[[-95,-38],[-61,-38]],4);
  k.line([[44,-14],[44,-54]],2);k.line([[92,-10],[92,-40]],2);k.shape([[44,-54],[94,-42],[64,-28]],C.yellow,{w:1.7,one:1});snow(k,[[44,-54],[94,-42]],4);
  k.line([[86,10],[86,-6]],2.2);k.shape([[78,-4],[94,-4],[96,14],[76,14]],'#F8A55E',{w:1.7,one:1});k.line([[80,4],[92,4]],1.5,'#fff')},
 river(k){const deck=[[-68,16],[-40,0],[0,-10],[40,0],[68,16],[68,26],[40,10],[0,2],[-40,10],[-68,26]];k.shape(deck,C.wood,{w:2.2,hatch:HT(C.woodD,.5)});
  for(let x=-56;x<60;x+=10){const y=Math.abs(x)*.2;k.line([[x,y-2],[x,y+10]],1,C.woodD,{amp:.2})}
  const rail=crs([[-66,4],[-40,-12],[0,-22],[40,-12],[66,4]],4);k.line(rail,2.2);[-56,-28,0,28,56].forEach(x=>k.line([[x,Math.abs(x)*.22-18],[x,Math.abs(x)*.22-4]],1.8));snow(k,rail,4);
  duck(k,-34,44);duck(k,-12,52,.8);for(let i=0;i<5;i++)k.line([[56+i*6,58],[54+i*6+k.J(2),26]],1.8,'#6FA05C');[0,2,4].forEach(i=>ell(k,55+i*6,30+k.J(2),2.6,6,'#A97E5A',1,{one:1}));flag(k,-84,6)},
 woods(k){mPine(k,-62,34,1.1);mPine(k,56,26,1.25,C.pineD);mTree(k,84,40,.85,2);mTree(k,-90,44,.7,2);
  [-24,24].forEach(x=>{k.line([[x,44],[x,-26]],6.5);k.line([[x,44],[x,-26]],4,C.woodD)});k.shape(RC(-36,-38,72,14),C.wood,{w:2,one:1,hatch:HT(C.woodD,.5)});snow(k,[[-37,-38],[37,-38]],5);
  circ(k,0,-46,7.5,'#C98F5A',1.5);k.shape([[-9,-50],[9,-50],[6,-56],[-6,-56]],'#A97E5A',{w:1.3,one:1});k.line([[0,-56],[0,-60]],1.5);
  ell(k,-36,54,8,5,C.redD,1.3,{one:1});k.line([[-36,54],[-36,62]],2.4,'#F3E1C7');dot(k,-38,52,1.4,'#fff');flag(k,40,58)},
 hilltop(k){const hill=[[-100,52],[-56,10],[0,-6],[54,6],[100,52]];k.fill(hill,'#B9DD92',{dx:0,dy:0});k.pen(hill.slice(0,5),false,{w:2.2});snow(k,[[-56,10],[0,-6],[54,6]],7);
  mTree(k,34,-8,1.35);k.line([[18,-24],[18,12]],1.3);k.line([[30,-24],[30,12]],1.3);k.line([[15,12],[33,12]],2.6,C.woodD);
  k.shape([[-52,-76],[-38,-60],[-52,-42],[-66,-60]],C.pink,{w:1.7,one:1});k.add(`<path d="M-52 -76V-42M-66 -60H-38" stroke="${C.ink}" stroke-width="1"/>`);
  k.line([[-52,-42],[-46,-24],[-56,-8],[-48,8],[-30,22]],1.2,C.ink,{op:.8});k.shape([[-50,-28],[-44,-26],[-48,-22]],C.yellow,{w:1,one:1});
  k.shape([[-66,30],[-28,30],[-36,44],[-74,44]],C.redD,{w:1.5,one:1});[[-60,33],[-48,33],[-36,33],[-64,39],[-52,39],[-40,39]].forEach(([x,y])=>k.add(`<rect x="${x}" y="${y}" width="5" height="4" fill="#fff" opacity=".85"/>`));flag(k,74,42)},
 beach(k){ell(k,0,30,96,30,C.sand,0,{noline:1,dx:0,dy:0});k.line([[8,42],[16,-20]],2.6);const um=[[-32,-12],[-10,-34],[14,-44],[38,-34],[60,-10]];k.shape(um,C.redD,{w:2,one:1});
  k.add(`<path d="M-6 -26L14 -44M36 -24L14 -44" stroke="#fff" stroke-width="4"/>`);snow(k,um,5);
  k.shape(RC(-64,18,30,22),C.sandD,{w:1.7,one:1});k.shape([[-66,18],[-66,8],[-60,8],[-60,13],[-54,13],[-54,8],[-48,8],[-48,13],[-42,13],[-42,8],[-36,8],[-36,18]],C.sandD,{w:1.3,one:1});k.line([[-50,8],[-50,-6]],1.4);k.shape([[-50,-6],[-40,-3],[-50,0]],C.pink,{w:1,one:1});
  k.shape([[-20,42],[24,42],[20,54],[-24,54]],C.mint,{w:1.5,one:1});k.add(`<path d="M-10 42l-4 12M6 42l-4 12" stroke="#fff" stroke-width="2.4"/>`);
  circ(k,44,30,8.5,'#FFFFFF',1.5);k.add(`<path d="M35.5 30h17M44 21.5v17" stroke="${C.redD}" stroke-width="3"/><path d="M62 52l3 -7l3 7l7 1l-6 4l2 7l-6 -4l-6 4l2 -7l-6 -4z" fill="${C.orange}" stroke="${C.ink}" stroke-width="1.1"/>`);flag(k,-86,26)},
 pier(k){k.shape([[-96,-26],[40,30],[30,44],[-104,-12]],C.wood,{w:2.2});for(let t=.08;t<1;t+=.09)k.line([[-100+136*t,-19+56*t],[-96+136*t,-12+56*t]],1,C.woodD,{amp:.2});
  [[-70,0],[-30,18],[10,34]].forEach(([x,y])=>k.line([[x,y],[x,y+14]],3,C.woodD));
  const lh=[[46,34],[54,-46],[74,-46],[82,34]];k.fill(lh,'#FFFFFF');[-30,-6,16].forEach(y=>k.fill([[51,y],[78,y],[79,y+12],[50,y+12]],C.redD,{dx:0,dy:0}));k.pen(lh,true,{w:2.2});
  k.shape(RC(50,-62,28,16),C.yellow,{w:1.7,one:1});k.shape([[46,-62],[64,-80],[82,-62]],C.redD,{w:1.7,one:1});snow(k,[[46,-62],[64,-80],[82,-62]],5);
  k.add(`<path d="M82 -56l38 -12M82 -56l38 8" stroke="#FFE7A0" stroke-width="3.5" stroke-linecap="round"/><path d="M-80 -62q6 -6 12 0q6 -6 12 0" fill="none" stroke="${C.ink}" stroke-width="2"/>`);
  k.shape([[-60,44],[-20,44],[-28,54],[-54,54]],C.redD,{w:1.5,one:1});k.line([[-40,44],[-40,14]],1.5);k.shape([[-38,16],[-22,42],[-38,42]],'#FFFFFF',{w:1.2,one:1});flag(k,-100,-24)},
 station(k){k.shape(RC(-92,30,184,16),C.stone,{w:2,hatch:HT(C.stoneD,.6)});
  k.shape(RC(-54,-24,64,54),C.wall3,{w:2.2,hatch:HT('#A9C3DE',.66)});const rf=[[-64,-20],[-22,-50],[20,-20]];k.shape(rf,C.roof,{w:2.2,hatch:HT(C.roofD)});snow(k,rf,6);
  circ(k,-22,-28,7,'#FFFFFF',1.3);k.add(`<path d="M-22 -28v-5M-22 -28h4" stroke="${C.ink}" stroke-width="1.3" stroke-linecap="round"/>`);
  k.shape(RC(-30,4,16,26),C.woodD,{w:1.5,one:1});win(k,-48,-10,13,12);win(k,-6,-10,13,12);k.line([[24,30],[24,-14]],2.2);k.line([[82,30],[82,-14]],2.2);
  const can=[[16,-14],[90,-14],[94,-22],[12,-22]];k.shape(can,C.mint,{w:1.7,one:1});snow(k,[[12,-22],[94,-22]],4);
  k.shape([[-98,28],[44,28],[76,24],[94,14],[70,6],[44,4],[-98,4]],'#FFFFFF',{w:2,one:1});k.add(`<path d="M-98 20H66" stroke="#4E7FC4" stroke-width="3.4"/>`);
  let wd='';for(let wx=-88;wx<30;wx+=20)wd+=`M${wx} 9h11v6h-11Z`;k.add(`<path d="${wd}M46 9l14 1l-4 6h-12z" fill="#B9D3F2" stroke="${C.ink}" stroke-width="1"/>`);
  k.ny(()=>{kado(k,-76,46,.45,-1);kado(k,-40,46,.45,1)})},
 fujihill(k){const hill=[[-90,48],[-52,4],[4,-12],[54,-2],[92,46]];k.fill(hill,'#B9DD92',{dx:0,dy:0});k.pen(hill,false,{w:2.2});snow(k,[[-52,4],[4,-12],[54,-2]],6);
  torii(k,-44,16,1.15);k.line([[24,10],[60,10]],4,C.woodD);k.line([[28,10],[28,22]],2.4);k.line([[56,10],[56,22]],2.4);k.line([[26,0],[58,0]],3,C.woodD);
  [[-8,30],[8,40],[-4,52]].forEach(([x,y])=>ell(k,x,y,8,4,C.stone,1.2,{one:1}));dot(k,-74,44,3.6,C.red,1);dot(k,72,40,3.6,C.yellow,1)},
 sunflower(k){k.shape([[-98,-6],[64,-14],[96,46],[-86,52]],'#EADFA2',{w:2,hatch:HT('#C9B56E',.6,5,.4)});for(let r=0;r<4;r++)k.line([[-92+r*4,6+r*12],[74+r*6,-4+r*13]],1,'#C9B56E',{amp:.3});
  for(let r=0;r<3;r++)for(let i=0;i<6;i++){const x=-70+i*22+r*8+k.J(2),y=-4+r*16;k.line([[x,y+16],[x,y]],1.8,C.leafD,{amp:.2});
    if(k.so==='winter'){dot(k,x,y-1,3.4,'#A8875E',.8)}else{k.add(`<circle cx="${R1(x)}" cy="${R1(y-2)}" r="6.5" fill="${k.so==='autumn'?'#E9B04E':C.yellow}" stroke="${C.ink}" stroke-width="1.2"/>`);dot(k,x,y-2,2.6,'#A97E5A')}}
  k.line([[-78,30],[-78,-30]],3,C.woodD);k.line([[-94,-14],[-62,-14]],3,C.woodD);k.shape(RC(-88,-18,20,22),C.blue,{w:1.5,one:1});circ(k,-78,-26,6.5,'#F1D7B5',1.3);
  k.shape([[-92,-30],[-64,-30],[-72,-38],[-84,-38]],C.yellow,{w:1.3,one:1});snow(k,[[-92,-30],[-78,-38],[-64,-30]],3);
  const hb=(x,y)=>{k.shape(RC(x-14,y-10,28,20),'#E9C97A',{w:1.5,one:1,hatch:HT('#B9964E',.5,4)});snow(k,[[x-14,y-10],[x+14,y-10]],4)};hb(78,38);hb(60,46);arch(k,4,50,.9);flag(k,38,8,.8)},
 bamboo(k){ell(k,0,40,92,16,C.grass,0,{noline:1,dx:0,dy:0});
  for(let i=0;i<8;i++){const x=-84+i*20+k.J(4),top=-74+k.J(10)+(i%2)*12;k.add(`<path d="M${R1(x)} 46L${R1(x)} ${R1(top)}" stroke="${C.ink}" stroke-width="6.4" stroke-linecap="round"/><path d="M${R1(x)} 46L${R1(x)} ${R1(top)}" stroke="#9BCB8C" stroke-width="4" stroke-linecap="round"/>`);
    let d='';for(let y=40;y>top+8;y-=17)d+=`M${R1(x-3)} ${y}h6`;k.add(`<path d="${d}" stroke="${C.ink}" stroke-width="1.5"/>`);
    k.shape([[x,top+6],[x+16,top-2],[x+4,top+10]],'#7FB86A',{w:1,one:1});k.shape([[x,top+16],[x-14,top+8],[x-4,top+20]],'#7FB86A',{w:1,one:1});snow(k,[[x-3,top],[x+3,top]],3)}
  k.shape(RC(-54,30,24,8),C.stoneD,{w:1.5,one:1});k.shape(RC(-48,6,12,24),C.stone,{w:1.5,one:1});k.shape(RC(-54,-6,24,14),'#FFF3C4',{w:1.5,one:1});k.shape([[-60,-6],[-42,-18],[-24,-6]],C.stoneD,{w:1.5,one:1});snow(k,[[-60,-6],[-42,-18],[-24,-6]],4);
  [[-6,56],[10,60],[26,56]].forEach(([x,y])=>ell(k,x,y,7,3.4,C.stone,1,{one:1}));arch(k,40,52,.85);flag(k,72,14,.8)},
 cliffs(k){k.shape([[0,40],[100,30],[100,60],[-10,60]],C.water,{noline:1,dx:0,dy:0});k.add(`<path d="M10 50q8 -6 16 0t16 0M50 44q8 -6 16 0t16 0" fill="none" stroke="#86BDDE" stroke-width="2"/>`);
  k.shape([[-100,-2],[30,-8],[52,8],[46,30],[28,58],[-100,58]],'#CFC3B5',{w:2.2,hatch:HT('#A99B8B',.5)});k.shape([[-100,-2],[30,-8],[40,-2],[-100,8]],'#B9DD92',{w:1.5,one:1});snow(k,[[-100,-3],[30,-9],[40,-3]],5);
  k.line([[30,8],[36,22],[28,34]],1.4,C.ink,{op:.6});k.line([[0,20],[8,34],[2,48]],1.4,C.ink,{op:.6});
  for(let x=-86;x<30;x+=20)k.line([[x,-2],[x,-18]],2.4,C.woodD);k.line(crs([[-86,-14],[-76,-10],[-66,-14],[-56,-10],[-46,-14],[-36,-10],[-26,-14],[-16,-10],[-6,-14],[4,-10],[14,-14]],2),1.3,C.woodD,{amp:.2});
  [[-90,4,C.pink],[-60,2,C.yellow],[-20,4,C.lav],[10,0,C.pink]].forEach(([x,y,c])=>dot(k,x,y,3,c,.9));k.add(`<path d="M54 -52q7 -7 14 0q7 -7 14 0" fill="none" stroke="${C.ink}" stroke-width="2"/>`);arch(k,-46,-4,.8);flag(k,-14,-6,.8)}
};

/* ---------- roads (V215 section 3): a graph of winding Catmull-Rom edges, drawn and walked ---------- */
const NODE={jHome:[400,700],jE:[1650,720]};B.forEach(([id,x,y])=>{NODE[id]=[x,y+(id==='river'?24:id==='square'?50:52)]});NODE.pier=[2110,1350];NODE.cliffs=[2270,1090];
const EDGES=[
 ['yard','jHome',[[330,735]],'road'],['house','jHome',[[452,652]],'lane'],['jHome','market',[[470,760],[540,830]],'road'],
 ['market','square',[[700,850],[800,805],[920,800],[1060,850],[1150,860]],'road'],['square','cafe',[[1330,790],[1400,720]],'road'],['cafe','jE',[[1530,726],[1600,700]],'road'],
 ['jE','salon',[[1750,740]],'road'],['salon','woods',[[1960,690],[2060,630]],'road'],['cafe','boutique',[[1530,600],[1600,540]],'lane'],
 ['square','shelter',[[1180,730],[1100,640],[1050,560]],'lane'],['shelter','sprout',[[1100,430],[1200,465],[1300,415]],'trail'],['sprout','hilltop',[[1330,300],[1240,240]],'trail'],
 ['house','sunflower',[[470,540],[500,440],[560,390]],'lane'],['jHome','fujihill',[[330,620],[270,520]],'trail'],['sunflower','shelter',[[690,400],[790,410],[900,470],[970,470]],'lane'],
 ['market','park',[[580,930],[500,960],[440,1010]],'lane'],['park','station',[[330,1150],[260,1250]],'lane'],['park','builder',[[500,1120],[580,1190]],'lane'],
 ['builder','river',[[760,1250],[870,1222]],'trail'],['river','vet',[[1030,1150],[1090,1110]],'trail'],['square','vet',[[1220,920],[1150,990]],'lane'],
 ['square','dogpark',[[1290,900],[1370,940],[1400,1010]],'lane'],['dogpark','pool',[[1500,1140],[1560,1220]],'lane'],['pool','beach',[[1720,1320],[1800,1400]],'lane'],
 ['beach','pier',[[1990,1400]],'trail'],['pier','cliffs',[[2190,1270],[2250,1180]],'trail'],['cliffs','woods',[[2320,960],[2260,780],[2190,660]],'trail'],
 ['dogpark','training',[[1510,1040],[1580,980],[1660,970]],'lane'],['training','jE',[[1730,860],[1680,790]],'lane'],['woods','bamboo',[[2100,480],[2010,380]],'trail'],
 ['bamboo','sprout',[[1770,330],[1600,300],[1480,350]],'trail']
].map(([a,b,via,t])=>{const pts=crs([NODE[a],...via,NODE[b]],8);let len=0;for(let i=1;i<pts.length;i++)len+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return {a,b,t,pts,len:R1(len)}});
const RIV=crs([[820,-20],[790,140],[860,300],[770,460],[700,620],[780,780],[900,900],[870,1040],[950,1180],[1110,1300],[1280,1420],[1360,1520]],10);
const COAST=crs([[1150,1600],[1250,1520],[1500,1470],[1760,1440],[1980,1400],[2150,1330],[2260,1220],[2330,1080],[2420,1000],[2520,940]],8);// both ends run off the map
const atY=(P,y)=>{for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i];if((y-a[1])*(y-b[1])<=0){const t=(y-a[1])/((b[1]-a[1])||1);return a[0]+(b[0]-a[0])*t}}return -999};
const atX=(P,x)=>{for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i];if((x-a[0])*(x-b[0])<=0){const t=(x-a[0])/((b[0]-a[0])||1);return a[1]+(b[1]-a[1])*t}}return x<1250?9999:900};
const ROADPTS=[].concat(...EDGES.map(e=>e.pts));
const near=(x,y,d,P=ROADPTS)=>{for(let i=0;i<P.length;i+=2){const p=P[i];if(Math.abs(p[0]-x)<d&&Math.abs(p[1]-y)<d&&Math.hypot(p[0]-x,p[1]-y)<d)return true}return false};
const nearB=(x,y,f,skip)=>B.some(([id,bx,by])=>!(skip&&skip.has(id))&&((x-bx)/(135*f))**2+((y-by-26)/(118*f))**2<1);
// filler goes only where no road, river, building, caption, field, forest, sea, Fuji or the compass is (skip: hidden buildings)
function free(x,y,skip,P){if(y<150||(x<640&&y<130))return false;if(nearB(x,y,1.02,skip)||near(x,y,40,P))return false;if(Math.abs(x-atY(RIV,y))<82)return false;if(y>atX(COAST,x)-110)return false;
  if(x>1980&&y>300&&y<990)return false;if(x>420&&x<820&&y>270&&y<450)return false;if(Math.hypot(x-2290,y-110)<80)return false;if(y<300&&Math.abs(x-400)<170)return false;return true}
// where the road and lane edges cross the river: a wooden bridge each (the third crossing is the Riverside Trail footbridge, the river place itself)
const BRIDGES=[];EDGES.forEach(e=>{if(e.t==='trail')return;const P=e.pts;for(let i=1;i<P.length;i++){const s0=P[i-1][0]-atY(RIV,P[i-1][1]),s1=P[i][0]-atY(RIV,P[i][1]);
  if(s0*s1<0){const t=s0/(s0-s1),x=P[i-1][0]+(P[i][0]-P[i-1][0])*t,y=P[i-1][1]+(P[i][1]-P[i-1][1])*t,a=Math.atan2(P[Math.min(P.length-1,i+2)][1]-P[Math.max(0,i-3)][1],P[Math.min(P.length-1,i+2)][0]-P[Math.max(0,i-3)][0]);BRIDGES.push([R1(x),R1(y),R1(a*180/Math.PI),e.t])}}});

/* ---------- one building: its own kit (seeded by its key), so the map and the thumbnail draw the same art ---------- */
const RUNS=B.filter(b=>b[4]).map(b=>b[0]);
const wide=ch=>/[⺀-鿿가-힯豈-﫿＀-￯぀-ヿ]/.test(ch);
const units=s=>[...s].reduce((a,ch)=>a+(wide(ch)?2.3:1),0);
// the caption: 34 x 17 / length like the old map, never under 31 (17 px on a phone at the default zoom); long names go on two lines
function capLines(name){const u=units(name),fit=l=>Math.min(34,Math.max(31,Math.round(34*17/Math.max(17,units(l)))));
  if(u*31*.42<=270)return {lines:[name],fs:fit(name)};
  const sp=[...name.matchAll(/ /g)].map(m=>m.index);let a=null;
  if(sp.length){let best=sp[0];sp.forEach(i=>{if(Math.abs(units(name.slice(0,i))-u/2)<Math.abs(units(name.slice(0,best))-u/2))best=i});a=[name.slice(0,best),name.slice(best+1)]}
  else if([...name].some(wide)){const ch=[...name];let h=Math.ceil(ch.length/2);const dots=ch.map((c,i)=>/[・·]/.test(c)?i:-1).filter(i=>i>0);
    if(dots.length){const d=dots.reduce((a,b)=>Math.abs(b-h)<Math.abs(a-h)?b:a);a=[ch.slice(0,d).join(''),ch.slice(d+1).join('')]}else a=[ch.slice(0,h).join(''),ch.slice(h).join('')]}
  if(!a)return {lines:[name],fs:Math.max(22,Math.round(270/(u*.42)))};
  const lu=Math.max(units(a[0]),units(a[1]));return {lines:a,fs:lu*31*.42<=270?fit(a[0].length>a[1].length?a[0]:a[1]):Math.max(22,Math.round(270/(lu*.42)))}}
function buildingArt(id,env){const k=kit(hashS('mf-b-'+id),env);ART[id](k);return k}
function buildingSVG(id,env,o,glowId){const b=BI[id],k=buildingArt(id,env),bb=k.bb.slice(),name=String((o.names&&o.names[id])||b.n),aria=String((o.labels&&o.labels[id])||name);
  const L=capLines(name),rot=((hashS(id)%5)-2)*.8,y0c=104+(bb[3]>60?bb[3]-56:0),lh=L.fs*1.02,cw=Math.max(...L.lines.map(l=>units(l)))*L.fs*.42/2;
  const cx=R1(b.x+cw>2386?2386-b.x-cw:b.x-cw<14?14-b.x+cw:0),capB=[cx-cw,y0c-L.fs*.78,cx+cw,y0c+lh*(L.lines.length-1)+L.fs*.26];// the caption stays on the map
  const cap=`<text class="mb-cap" x="${cx}" y="${R1(y0c)}" transform="rotate(${R1(rot)} ${cx} ${R1(y0c)})" text-anchor="middle" font-family="'Caveat',cursive" font-weight="700" font-size="${L.fs}" fill="${C.ink}" stroke="${C.halo}" stroke-width="7" stroke-linejoin="round" paint-order="stroke">${L.lines.map((l,i)=>i?`<tspan x="${cx}" dy="${R1(lh)}">${esc(l)}</tspan>`:esc(l)).join('')}</text>`;
  // the lock: hatched grey veil, padlock and a pink chip ("Bond N" from the game)
  let lock='';const lk=o.lock&&o.lock[id];if(lk!=null&&lk!==false){const t=typeof lk==='number'?'Bond '+lk:String(lk===true?'':lk),cwid=Math.max(84,units(t)*11+24),q=kit(hashS('mf-lock-'+id),env);
    const veil=E(0,4,104,70,18);q.fill(veil,'#EFE9E0',{dx:0,dy:0,op:.62});q.hatch(veil,{gap:7,col:C.graph,op:.55,w:1.4});
    q.add(`<path d="M-42 -14v-12a14 14 0 0 1 28 0v12" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`);q.shape(RC(-50,-16,44,36),C.yellow,{w:2.4,one:1});q.add(`<circle cx="-28" cy="-2" r="4" fill="${C.ink}"/><path d="M-28 0v9" stroke="${C.ink}" stroke-width="3" stroke-linecap="round"/>`);
    if(t){q.shape(RC(0,-12,cwid,30),C.pink,{w:1.8,one:1});q.add(`<text x="${R1(cwid/2)}" y="11" text-anchor="middle" font-family="'Caveat',cursive" font-weight="700" font-size="24" fill="#fff">${esc(t)}</text>`)}
    k.defs.push(...q.defs);lock=`<g class="mb-lock" pointer-events="none">${q.out.join('')}</g>`}
  // the sticker: "new" (pink) or "moved" (gold), for the first days after the update
  let stk='';const st=o.stickers&&o.stickers[id];if(st){const kind=st.kind==='moved'?'moved':'new',t=String(st.text||kind),w=Math.max(68,units(t)*12+22);
    stk=`<g class="mb-sticker" data-kind="${kind}" pointer-events="none" transform="translate(${R1(Math.min(bb[2]-14,74))} ${R1(Math.max(bb[1]+8,-96))}) rotate(8)"><rect x="${R1(-w/2)}" y="-15" width="${R1(w)}" height="28" rx="8" fill="${kind==='moved'?'#F3C969':C.pink}" stroke="${C.ink}" stroke-width="2"/><text y="7" text-anchor="middle" font-family="'Caveat',cursive" font-weight="700" font-size="22" fill="${C.ink}">${esc(t)}</text></g>`}
  // the lift turns round the base. Its fill-box is pinned by an invisible frame (.mb-box) round everything it holds, symmetric about x 0,
  // so transform-origin 50% / oy% is exactly the base in every browser, whatever the caption
  const u=[Math.min(bb[0],capB[0]),Math.min(bb[1],capB[1]),Math.max(bb[2],capB[2]),Math.max(bb[3],capB[3])],base=Math.min(bb[3],56);
  const fh=R1(Math.max(160,-u[0]+12,u[2]+12)),fy0=-140,fy1=R1(u[3]+14),ox=50,oy=R1((base-fy0)/(fy1-fy0)*100);
  const frame=`<rect class="mb-box" x="${-fh}" y="${fy0}" width="${R1(fh*2)}" height="${R1(fy1-fy0)}" fill="none"/>`;
  const hrx=Math.max(112,R1(Math.max(-u[0],u[2])+8)),hcy=R1((u[1]+u[3])/2),hry=R1(Math.max(100,(u[3]-u[1])/2+6));
  const aw=Math.max(60,Math.min(96,(bb[2]-bb[0])*.45));
  const svg=`<g class="mb" data-area="${id}"${lk!=null&&lk!==false?' data-locked="1"':''}${b.run?' data-run="1"':''}${st?` data-sticker="${st.kind==='moved'?'moved':'new'}"`:''} role="button" tabindex="0" aria-label="${esc(aria)}" transform="translate(${b.x} ${b.y})">`
    +`<ellipse class="mb-shadow" cx="0" cy="${R1(base-2)}" rx="${R1(aw)}" ry="14" fill="${C.ink}" opacity=".13" style="transform-box:fill-box;transform-origin:50% 50%"/>`
    +`<g class="mb-glow" opacity="0" pointer-events="none"><ellipse cx="0" cy="${R1((bb[1]+bb[3])/2)}" rx="${R1(hrx+14)}" ry="${R1((bb[3]-bb[1])/2+34)}" fill="url(#${glowId})"/><ellipse class="mb-ring" cx="0" cy="${R1((bb[1]+bb[3])/2+2)}" rx="${R1(hrx)}" ry="${R1((bb[3]-bb[1])/2+18)}" fill="none" stroke="${C.pink}" stroke-width="4.5" stroke-dasharray="14 10" stroke-linecap="round"/></g>`
    +`<g class="mb-lift" style="transform-box:fill-box;transform-origin:${ox}% ${oy}%">${frame}${k.out.join('')}${lock}${cap}${stk}</g>`
    +`<ellipse class="mb-hit" cx="0" cy="${hcy}" rx="${hrx}" ry="${hry}" fill="transparent"/></g>`;
  return {svg,defs:k.defs.join(''),y:b.y}}
const glowDef=id=>`<radialGradient id="${id}"><stop offset="0" stop-color="#FFE3EA" stop-opacity=".95"/><stop offset=".6" stop-color="#FBC9D5" stop-opacity=".55"/><stop offset="1" stop-color="#F28FA5" stop-opacity="0"/></radialGradient>`;

/* ---------- the map ---------- */
function paper(W,H){const g=uid(),t=uid(),r=rng(99);let sp='';for(let i=0;i<70;i++){const x=r()*60,y=r()*60,rr=.35+r()*.9;sp+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(rr)}" fill="${r()<.72?'#FFFFFF':'#B9A58F'}" opacity="${R1(.25+r()*.45)}"/>`}
  return {defs:`<pattern id="${g}" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1.1" fill="${C.dot}"/></pattern><pattern id="${t}" width="60" height="60" patternUnits="userSpaceOnUse">${sp}</pattern>`,
    bg:`<rect width="${W}" height="${H}" fill="${C.paper}"/><rect width="${W}" height="${H}" fill="url(#${g})"/>`,tooth:`<rect width="${W}" height="${H}" fill="url(#${t})" pointer-events="none"/>`}}
function fuji(k,x,by,w){const h=w/2.4,P=[[x-w/2,by],[x-w*.3,by-h*.3],[x-w*.16,by-h*.66],[x-w*.06,by-h],[x+w*.06,by-h*.98],[x+w*.17,by-h*.64],[x+w*.32,by-h*.26],[x+w/2,by]];
  k.add('<g data-fuji="1">');k.shape(P,'#AFC3D6',{w:1.8,lcol:'#7D8FA6',hatch:{side:.05,gap:4,col:'#8EA2B8',op:.55}});
  k.shape([[x-w*.11,by-h*.84],[x-w*.06,by-h],[x+w*.06,by-h*.98],[x+w*.12,by-h*.82],[x+w*.06,by-h*.72],[x+w*.02,by-h*.8],[x-w*.03,by-h*.68],[x-w*.07,by-h*.78]],'#FFFFFE',{w:1.3,lcol:'#7D8FA6',one:1});k.add('</g>')}
function bigMap(o,env){
  const k=kit(hashS('mf-map'),env),hide=new Set(Array.isArray(o.hide)?o.hide:[]),glowId=uid(),pp=paper(2400,1500);
  k.add(`<rect width="2400" height="1500" fill="#FDF3DF" fill-opacity=".55"/>`);
  // hills to the north, Mt. Fuji (jp) behind the second row, trees along the crest
  const h1=[[0,170],[240,130],[480,170],[720,110],[980,150],[1250,80],[1500,70],[1760,120],[2000,90],[2240,140],[2400,110]],h1s=crs(h1,6);
  k.add(`<path d="${lp(h1s)}L2400 0L0 0Z" fill="#EAF3DD"/>`);k.fill(h1s.concat([[2400,332],[1800,344],[1200,326],[600,340],[0,330]]),'#DCEDC4',{dx:0,dy:0,sc:0,amp:.6});k.pen(h1s,false,{w:1.8,col:C.graph});
  k.jp(()=>fuji(k,400,300,300));
  const h2s=crs([[0,270],[300,232],[620,268],[900,236],[1200,262],[1500,222],[1800,258],[2100,226],[2400,262]],6);
  k.fill(h2s.concat([[2400,346],[2100,352],[1700,338],[1300,354],[900,340],[500,352],[0,342]]),'#D3E9B9',{dx:0,dy:0,sc:0,amp:.6});k.pen(h2s,false,{w:1.6,col:C.graph});
  // fields north-west (Sunflower Lanes country)
  [[[440,300],[540,286],[560,350],[452,362]],[[700,286],[800,296],[790,356],[690,350]],[[420,380],[520,372],[530,430],[430,440]]].forEach((P,i)=>{k.shape(P,i===1?'#E9E3B0':'#DCEBB8',{w:1.5,one:1});
    for(let j=1;j<5;j++)k.line([[P[0][0]+(P[3][0]-P[0][0])*j/5,P[0][1]+(P[3][1]-P[0][1])*j/5],[P[1][0]+(P[2][0]-P[1][0])*j/5,P[1][1]+(P[2][1]-P[1][1])*j/5]],1,'#B9C98A',{amp:.4})});
  // the sea, the sand and the waves (south-east)
  k.add(`<path d="${lp(COAST)}" fill="none" stroke="${C.sand}" stroke-width="130" stroke-linecap="round" stroke-linejoin="round"/>`);
  k.fill(COAST.concat([[2420,1520]]),C.water,{dx:0,dy:0,sc:0,amp:.5});k.pen(COAST,false,{w:2.4});k.line(COAST.map(p=>[p[0]-46,p[1]-50]),1.2,C.sandD,{op:.8,dash:'2 9'});
  let wv='';for(let i=0;i<70;i++){const x=1300+k.r()*1100,y=1000+k.r()*520;if(y<atX(COAST,x)+22)continue;wv+=`M${R1(x)} ${R1(y)}q8 -6 16 0t16 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.8" stroke-linecap="round"/>`);
  // the river: a wide meandering band with pencil banks and ripples
  const nrm=i=>{const a=RIV[Math.max(0,i-1)],b=RIV[Math.min(RIV.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return [dy/l,-dx/l]};
  const rl=RIV.map((p,i)=>{const n=nrm(i);return [p[0]+n[0]*35,p[1]+n[1]*35]}),rr=RIV.map((p,i)=>{const n=nrm(i);return [p[0]-n[0]*35,p[1]-n[1]*35]});
  k.fill(rl.concat(rr.slice().reverse()),C.water,{dx:0,dy:0,sc:0,amp:.5});k.pen(rl,false,{w:2.2});k.pen(rr,false,{w:2.2});
  let rw='';for(let i=6;i<RIV.length-6;i+=7)rw+=`M${R1(RIV[i][0]-10)} ${R1(RIV[i][1]+6)}q5 -5 10 0t10 0`;k.add(`<path d="${rw}" fill="none" stroke="#7FB6D8" stroke-width="1.8"/>`);
  k.ss(()=>{if(k.so==='winter'){k.add(`<rect width="2400" height="1500" fill="#EEF4F7" opacity=".3" pointer-events="none"/>`);k.line(rl,3,'#FFFFFE',{op:.9});k.line(rr,3,'#FFFFFE',{op:.9})}});
  // the rail line from the Station off to the west
  if(!hide.has('station')){const rail=crs([[180,1340],[90,1330],[-20,1350]],6);k.add(`<path d="${lp(rail)}" fill="none" stroke="${C.ink}" stroke-width="9" stroke-linecap="round"/><path d="${lp(rail)}" fill="none" stroke="#fff" stroke-width="4.6" stroke-dasharray="14 10"/>`)}
  // roads: ink edges first, then the fill, then the dashes (junctions stay clean); trails are dotted footpaths
  const deg={};EDGES.forEach(e=>{deg[e.a]=(deg[e.a]||0)+1;deg[e.b]=(deg[e.b]||0)+1});
  const shown=EDGES.filter(e=>!((hide.has(e.a)&&deg[e.a]===1)||(hide.has(e.b)&&deg[e.b]===1)));
  const W={road:[40,34],lane:[28,23]};let ed='',fl='',da='',tr='';
  shown.forEach(e=>{const d=smooth(e.pts,false);if(W[e.t]){ed+=`<path d="${d}" stroke-width="${W[e.t][0]}"/>`;fl+=`<path d="${d}" stroke-width="${W[e.t][1]}"/>`;if(e.t==='road')da+=`<path d="${d}"/>`}else tr+=`<path d="${d}"/>`});
  k.add(`<g class="mf-roads" pointer-events="none"><g fill="none" stroke="${C.ink}" stroke-linecap="round" stroke-linejoin="round" opacity=".5">${ed}</g><g fill="none" stroke="#F4E8CF" stroke-linecap="round" stroke-linejoin="round">${fl}</g><g fill="none" stroke="#E2CFAA" stroke-width="1.8" stroke-dasharray="12 12">${da}</g><g fill="none" stroke="#C9A27A" stroke-width="7" stroke-linecap="round" stroke-dasharray="1 13">${tr}</g></g>`);
  // bridges where the road and the lane cross the river
  BRIDGES.forEach(([x,y,a,t])=>{const hw=t==='road'?24:18;k.add(`<g transform="translate(${x} ${y}) rotate(${a})">`);k.shape(RC(-60,-hw,120,hw*2),C.wood,{w:2.2,hatch:HT(C.woodD,.5)});
    let pl='';for(let bx=-48;bx<=48;bx+=12)pl+=`M${bx} ${-hw+2}V${hw-2}`;k.add(`<path d="${pl}" stroke="${C.woodD}" stroke-width="1"/>`);k.line([[-62,-hw-2],[62,-hw-2]],2.6);k.line([[-62,hw+2],[62,hw+2]],2.6);
    snow(k,[[-62,-hw-3],[62,-hw-3]],5);k.lt(()=>bulbs(k,sag(-60,-hw-4,60,-hw-4,5,12),14));k.add('</g>')});
  // the season on the ground: spring petals, autumn leaves, winter snow patches (under the props and the buildings)
  k.ss(()=>{const so=k.so;let s='';if(so==='spring')for(let i=0;i<130;i++)s+=petalAt(k.r()*2400,160+k.r()*1320,4+k.r()*1.5,k.r()*6.28,PET[i%3]);
    else if(so==='autumn')for(let i=0;i<150;i++){const a=AU[i%4];s+=leafAt(k,k.r()*2400,160+k.r()*1320,5+k.r()*2,k.r()*6.28,a[0],a[1])}
    else if(so==='winter')for(let i=0;i<160;i++)s+=`<path d="${smooth(blobP(k.r()*2400,170+k.r()*1300,8+k.r()*12,2.4+k.r()*2,k.r,8,.3),true)}" fill="#FFFFFE" fill-opacity=".8"/>`;
    k.add(`<g class="mf-season" pointer-events="none">${s}</g>`)});
  // the props layer, sorted by depth: the eastern forest, the filler houses and trees, the clearings of hidden places, the Japan details
  const items=[];const put=(y,s)=>{if(s)items.push([y,s])};
  for(let y=330;y<980;y+=44)for(let x=1990+((y/44)%2)*22;x<2390;x+=44){const jx=x+k.J(10),jy=y+k.J(8);if(jx<1990+50*Math.sin(jy/110))continue;if(near(jx,jy,60)||nearB(jx,jy,1.05)||k.r()<.22)continue;
    const pine=k.r()<.68,s=.85+k.r()*.35,c=k.r()<.5?C.pine:C.pineD;put(jy,k.cap(()=>pine?mPine(k,jx,jy,s,c):mTree(k,jx,jy+6,.9,2)))}
  const pal=[[C.wall,C.roof],[C.wall2,C.lav],[C.wall3,'#9AA7B8'],[C.wall4,C.redD],['#FFF3DC',C.orange]];
  for(let y=150;y<1480;y+=62)for(let x=40+((y/62)%2)*34;x<2380;x+=68){const jx=x+k.J(14),jy=y+k.J(10);if(!free(jx,jy)||k.r()<.5)continue;
    if(k.r()<.6){const c=pal[Math.floor(k.r()*pal.length)],s=.9+k.r()*.25;put(jy,k.cap(()=>mHouse(k,jx,jy,s,c[0],c[1])))}else{const s=.85+k.r()*.35,kd=k.r()<.5?0:1;put(jy,k.cap(()=>mTree(k,jx,jy,s,kd)))}}
  // jp: a small vermilion torii over three footpaths (up the hill, into the bamboo, along the cliffs)
  [['sprout','hilltop',.3],['woods','bamboo',.5],['cliffs','woods',.42]].forEach(([a,b,t])=>{const e=EDGES.find(q=>q.a===a&&q.b===b),p=e.pts[Math.round((e.pts.length-1)*t)];k.jp(()=>put(p[1],k.cap(()=>torii(k,p[0],p[1]+6,.85))))});
  // a hidden place (the Station with the trip off, the Fuji Lookout with Japan off): its spot gets the town filler, on the side stream
  const shownP=[].concat(...shown.map(e=>e.pts));
  hide.forEach(id=>{const b=BI[id];if(!b)return;k.side(()=>{for(let y=b.y-110;y<b.y+170;y+=62)for(let x=b.x-150;x<b.x+150;x+=68){const jx=x+k.J(14),jy=y+k.J(10);
    if(((jx-b.x)/138)**2+((jy-b.y-26)/120)**2>=1||!free(jx,jy,hide,shownP)||k.r()<.35)continue;
    if(k.r()<.6){const c=pal[Math.floor(k.r()*pal.length)],s=.9+k.r()*.25;put(jy,k.cap(()=>mHouse(k,jx,jy,s,c[0],c[1])))}else{const s=.85+k.r()*.35,kd=k.r()<.5?0:1;put(jy,k.cap(()=>mTree(k,jx,jy,s,kd)))}}})});
  items.sort((a,b)=>a[0]-b[0]).forEach(i=>k.add(i[1]));
  // the buildings, each a button, back to front
  const bs=B.filter(b=>!hide.has(b[0])).map(b=>buildingSVG(b[0],env,o,glowId)).sort((a,b)=>a.y-b.y);
  k.add(`<g class="mf-buildings">${bs.map(b=>b.svg).join('')}</g>`);k.defs.push(glowDef(glowId),...bs.map(b=>b.defs));
  // compass, title, tape, sparkles
  k.shape(E(2290,110,50,50,14),'#FFFFFF',{w:2});k.add(`<path d="M2290 62l10 40 -10 10 -10 -10zM2290 158l10 -40 -10 -10 -10 10z" fill="${C.pink}" stroke="${C.ink}" stroke-width="1.8" stroke-linejoin="round"/>`);k.text('N',2290,54,28);
  k.text(o.title||'Doodle Doggo Town',330,92,72,{rot:-2,halo:C.halo});k.line([[120,112],[540,104]],3,C.pink);
  k.add(`<g pointer-events="none"><rect x="10" y="14" width="120" height="26" fill="#F7B9C6" opacity=".7" transform="rotate(-8 70 27)"/><rect x="2260" y="1450" width="120" height="24" fill="#BDE7D2" opacity=".7" transform="rotate(-6 2320 1462)"/><rect x="14" y="1452" width="100" height="22" fill="#F9E19A" opacity=".7" transform="rotate(14 64 1463)"/></g>`);
  // the season over everything (pointer-events none): petals, leaves, snow; Halloween bats, New Year kites
  const top=[];
  if(env.snow){const r=rng(hashS('mf-snowfall'));let s='';for(let i=0;i<220;i++)s+=`<circle cx="${R1(r()*2400)}" cy="${R1(r()*1500)}" r="${R1(1.6+r()*2.2)}" fill="#fff" stroke="#C9D3DD" stroke-width=".6"/>`;top.push(s)}
  k.hw(()=>top.push(k.cap(()=>[[1040,70,1],[1090,40,.8],[1290,60,.9],[2050,190,.8],[2130,170,.7]].forEach(([x,y,s])=>bat(k,x,y,s)))));
  k.ny(()=>top.push(k.cap(()=>{kite(k,1060,50,1,'#BFD9F5',1130,150);kite(k,1290,40,.9,'#FCE59A',1200,140)})));
  if(top.length)k.add(`<g class="mf-top" pointer-events="none">${top.join('')}</g>`);
  return {k,pp}}
function mkEnv(o){const S=['spring','summer','autumn','winter'],season=S.includes(o.season)?o.season:'summer';
  return {season,ssn:season==='summer'?'':season,hw:o.halloween===true||o.hw===true,lt:o.lights===true||o.lt===true,ny:o.newyear===true||o.ny===true,jp:o.jp===true,snow:o.snow===true}}
const attrs=e=>(e.ssn?` data-season="${e.ssn}"`:'')+(e.hw?' data-halloween="1"':'')+(e.lt?' data-lights="1"':'')+(e.ny?' data-newyear="1"':'')+(e.jp?' data-jp="1"':'')+(e.snow?' data-snow="1"':'');
const cache={};
const fresh=s=>{const suf='x'+(++_n);return s.replace(/mf-(\d+)/g,m=>m+suf)};
function v215Map(o){const env=mkEnv(o),key=JSON.stringify([env,o.names||0,o.labels||0,o.lock||0,o.stickers||0,o.hide||0,o.title||0]);if(cache[key])return fresh(cache[key]);
  const {k,pp}=bigMap(o,env),rc=recolor(env),R=s=>rc?s.replace(HEXRE,rc):s,clip=uid();// the clip keeps the sea and the rail inside the map when the svg overflows
  const svg=`<svg class="pa-wa-scene pa-wf-map" viewBox="0 0 2400 1500" preserveAspectRatio="xMidYMid meet" role="group" aria-label="${esc(o.label||'Doodle Doggo Town map')}" data-v215="1"${attrs(env)}><defs><clipPath id="${clip}"><rect width="2400" height="1500"/></clipPath>${pp.defs}${R(k.defs.join(''))}</defs><g clip-path="url(#${clip})">${pp.bg}${R(k.out.join(''))}${pp.tooth}</g></svg>`;
  cache[key]=svg;return svg}

/* ---------- API ---------- */
PA.MAP215_AREAS=B.map(([id,x,y])=>({id,x,y}));
PA.MAP215_RUNS=RUNS.slice();
PA.MAP215_NAMES={};B.forEach(b=>{PA.MAP215_NAMES[b[0]]=b[3]});
PA.MAP_ROADS={nodes:JSON.parse(JSON.stringify(NODE)),edges:EDGES.map(e=>({a:e.a,b:e.b,t:e.t,pts:e.pts.map(p=>[p[0],p[1]]),len:e.len}))};
PA.mapBuilding=function(id,o){o=o||{};if(!ART[id])return '';const env=mkEnv(o),k=buildingArt(id,env),rc=recolor(env),R=s=>rc?s.replace(HEXRE,rc):s;
  return `<svg class="pa-wf-building" viewBox="-130 -130 260 230" role="img" aria-label="${esc((o.names&&o.names[id])||BI[id].n)}" data-area="${id}"${attrs(env)}><defs>${R(k.defs.join(''))}</defs><ellipse cx="0" cy="${R1(Math.min(k.bb[3],56)-2)}" rx="${R1(Math.max(60,Math.min(96,(k.bb[2]-k.bb[0])*.45)))}" ry="14" fill="${C.ink}" opacity=".13"/>${R(k.out.join(''))}</svg>`};
const prev=PA.scene;
PA.scene=function(name,o){if(name==='map'&&o&&o.v215===true)return v215Map(o);return prev.apply(this,arguments)};
const css=`.pa-wf-map .mb{cursor:pointer;outline:none}.pa-wf-map .mb[data-locked="1"]{cursor:not-allowed}.pa-wf-map .mb-lift,.pa-wf-map .mb-glow,.pa-wf-map .mb-shadow{pointer-events:none}.pa-wf-map .mb-hit{pointer-events:all}`;
if(typeof document!=='undefined'&&!document.getElementById('pawart-world-f-css')){const st=document.createElement('style');st.id='pawart-world-f-css';st.textContent=css;document.head.appendChild(st)}
})();
