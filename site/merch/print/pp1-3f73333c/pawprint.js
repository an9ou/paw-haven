/* PawPrint (Doodle Doggo merch): dogs/pawart_dogs.js + mods/genes.js + merch/pawprint_font.js + merch/names.js + merch/pawprint_core.js, built by tools/merch_build.js. Art and font: see those files. */
(function (G) {
  'use strict';
  var shim = { Intl: G.Intl }; shim.window = shim;
  var art = function (window, document, module) {
/* Doodle Doggo dog art module, style H "Ugly hand-drawn".
   PawArt.dog(key, {pose, outfit, anim, facing}) -> SVG string (viewBox 0 0 240 200, feet on y=186)
   PawArt.dogHead(key) -> SVG string (viewBox 0 0 100 100)
   PawArt.DOGS -> [{key, name, breed, personality, joke}]
   Each dog is a tiny rig (body, head, ears, legs, tail, face) in local coordinates.
   A pose moves the rig; every part is then drawn with seeded mouse-in-paint jitter,
   three times, and the three redraws flip at 3 fps. No filters. */
window.PawArt = window.PawArt || {};
(function(){
'use strict';
const PA=window.PawArt;
const INK='#2E2320',PEN='#5B3D32',GY=186,W='#FFFFFF';
const mix=(a,b,t)=>{const A=[1,3,5].map(i=>parseInt(a.slice(i,i+2),16)),B=[1,3,5].map(i=>parseInt(b.slice(i,i+2),16));return'#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join('')};
let _n=0;const uid=()=>'pad'+(++_n);
const R1=n=>Math.round(n*10)/10;
function rng(seed){let a=seed>>>0;const f=()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};f.st=v=>v===undefined?a:(a=v);return f}// st: read or set the stream (v2.18.1: a costume hands the dog back its stream)
const hashS=s=>{let h=7;for(const c of s)h=(h*31+c.charCodeAt(0))>>>0;return h};
const D2R=Math.PI/180;
const rot=(p,a)=>{const c=Math.cos(a*D2R),s=Math.sin(a*D2R);return[p[0]*c-p[1]*s,p[0]*s+p[1]*c]};
const T=(t)=>p=>{const q=rot([p[0]*(t.sx||1),p[1]*(t.sy||1)],t.a||0);return[t.x+q[0],t.y+q[1]]};
const rotAbout=(pts,a,c)=>pts.map(p=>{const q=rot([p[0]-c[0],p[1]-c[1]],a);return[c[0]+q[0],c[1]+q[1]]});
function dense(pts,closed,step){
  const out=[],n=pts.length,m=closed?n:n-1;
  for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n],k=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/step));
    for(let j=0;j<k;j++)out.push([a[0]+(b[0]-a[0])*j/k,a[1]+(b[1]-a[1])*j/k])}
  if(!closed)out.push(pts[n-1]);
  return out;
}
const circ=(cx,cy,rx,ry,n=14,lop=0)=>{const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;p.push([cx+Math.cos(a)*rx*(1+lop*Math.sin(a*2)),cy+Math.sin(a)*ry*(1+lop*Math.cos(a))*(Math.sin(a)>0?.94:1)])}return p};
const scallop=(cx,cy,rx,ry,nb,amp)=>{const p=[];for(let j=0;j<nb;j++)for(let t=0;t<1;t+=.25){const a=(j+t)/nb*Math.PI*2,k=1+amp*Math.sin(Math.PI*t)+Math.sin(j*2.3)*.03;p.push([cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k])}return p};
// rain (preview, art/rain-wet): wet fur. The fluff lies flatter and gathers into nb pointed locks; a lock hangs down under its own weight
// (long under the belly and chin, nearly flat on the back). a0 turns the ring of locks so a point never sits where an ear or leg joins.
const wetPts=(cx,cy,rx,ry,nb,amp,a0=0)=>{const p=[],E=(a,k)=>[cx+Math.cos(a)*rx*k,cy+Math.sin(a)*ry*k],hw=Math.PI/nb*.4;
  for(let j=0;j<nb;j++){const b=(j+a0)/nb*Math.PI*2,a1=(j+a0+1)/nb*Math.PI*2,g=Math.max(0,Math.sin(b)+.3)/1.3,v=1+Math.sin(j*2.3)*.22;
    if(g>.15){const t=E(b,1+amp*g*v);p.push(E(b-hw,.95),[t[0],t[1]+amp*ry*g*v*.6],E(b+hw,.95))}else p.push(E(b,.95));
    for(let q=1;q<3;q++)p.push(E(b+(a1-b)*q/3,.96))}// the smooth flat wet fur between two locks
  return p};
// a round tuft of fur (a pom, a topknot, a mane): dry = scallops, wet = a few hanging locks
const furR=(wet,cx,cy,rx,ry,nb,amp)=>wet?wetPts(cx,cy,rx*.95,ry*.92,Math.max(5,nb-3),Math.max(.26,amp*1.5),.2):scallop(cx,cy,rx,ry,nb,amp);
const spiral=(cx,cy,r0,r1,turns,n,a0)=>{const p=[];for(let i=0;i<=n;i++){const t=i/n,a=a0+t*turns*Math.PI*2,rr=r1+(r0-r1)*t;p.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}return p};
// v2.5 helpers: corner rounding (closed polygon) and a convex hull (canvas points)
const chaikin=(p,it)=>{for(let k=0;k<it;k++){const o=[];p.forEach((a,i)=>{const b=p[(i+1)%p.length];o.push([a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25],[a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75])});p=o}return p};
function hull(P){const p=P.filter(q=>!isNaN(q[0])).slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]),x=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
  p.forEach(q=>{while(lo.length>1&&x(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)});
  for(let i=p.length-1;i>=0;i--){const q=p[i];while(up.length>1&&x(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q)}
  return lo.slice(0,-1).concat(up.slice(0,-1))}

/* ---------- the crude drawing kit: every point it draws is tracked for fitting ---------- */
function kit(r){
  let jm=1;const J=a=>(r()-.5)*2*a*jm,acc=[],bb=[1e9,1e9,-1e9,-1e9],texts=[],LW=3.7;
  const tr=(x,y)=>{if(x<bb[0])bb[0]=x;if(y<bb[1])bb[1]=y;if(x>bb[2])bb[2]=x;if(y>bb[3])bb[3]=y};
  const pl=(P,amp,out)=>{let d='';for(let i=0;i<P.length;i++){const x=P[i][0]+J(amp),y=Math.min(P[i][1]+J(amp),h.cy||1e9);tr(x,y);if(out)out.push([x,y]);d+=(i?'L':'M')+R1(x)+' '+R1(y)}return d};
  // 25 Oct 2026 (owner: every colour fill stays inside its outline). pd: a closed polygon's path data
  const pd=Q=>Q.map((q,i)=>(i?'L':'M')+R1(q[0])+' '+R1(q[1])).join('');
  let lastQ=null,lastW=LW,part=null;
  // the outline Q pulled in by half its line width (each point along its corner's inward normal), so a kept-in mark stops at the inside of the ink
  const inset=(Q,dd)=>{const n=Q.length;let a=0;Q.forEach((p,i)=>{const q=Q[(i+1)%n];a+=p[0]*q[1]-q[0]*p[1]});const sg=a>0?1:-1;
    return Q.map((p,i)=>{const A=Q[(i+n-1)%n],C=Q[(i+1)%n],e1=[p[0]-A[0],p[1]-A[1]],e2=[C[0]-p[0],C[1]-p[1]],l1=Math.hypot(e1[0],e1[1])||1,l2=Math.hypot(e2[0],e2[1])||1;
      let nx=-(e1[1]/l1+e2[1]/l2)*sg,ny=(e1[0]/l1+e2[0]/l2)*sg;const m=Math.hypot(nx,ny)||1;return[p[0]+nx/m*dd,p[1]+ny/m*dd]})};
  // keep a point inside the open part: a point outside moves to the nearest point of the part's (inset) outline. No clipPath: an SVG id would clash when the
  // game shows the same dog twice and one copy is hidden. A mark is first made dense (3 px), so the moved points follow the outline closely.
  const pin=(p,Q)=>{let c=false;for(let i=0,j=Q.length-1;i<Q.length;j=i++){const a=Q[i],b=Q[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c}if(c)return p;
    let best=p,bd=1e18;for(let i=0;i<Q.length;i++){const a=Q[i],b=Q[(i+1)%Q.length],ex=b[0]-a[0],ey=b[1]-a[1],L2=ex*ex+ey*ey||1,t=Math.max(0,Math.min(1,((p[0]-a[0])*ex+(p[1]-a[1])*ey)/L2)),x=a[0]+ex*t,y=a[1]+ey*t,d=(x-p[0])**2+(y-p[1])**2;if(d<bd){bd=d;best=[x,y]}}return best};
  const st=(d,w,c,x='')=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${x}/>`;
  const h={J,r,acc,bb,texts,LW,tr,setJ(v){jm=v},getJ(){return jm},
    // a jaggy outline that may not close, over a crayon fill laid on the outline's own wobbly points: the fill never pokes past the line
    // (25 Oct 2026, owner: every colour fill stays inside its outline; it used to drift off by ox, oy, sc). A fill with no line keeps its own wobble, undrifted.
    // While a part is open (h.part(), after the body or head outline), a fill with no line of its own (a coat mark, a patch) is kept inside that outline;
    // o.own marks a fill that hangs past the part on purpose (long hair, the schnauzer skirt) and has its own ink line.
    shape(pts,fill,o={}){
      if(!pts.length||isNaN(pts[0][0]))return;
      const P=dense(pts,true,o.step||11),n=P.length;let cx=0,cy=0;P.forEach(q=>{cx+=q[0]/n;cy+=q[1]/n});
      const ox=o.ox??2.4+J(1),oy=o.oy??-1.6+J(1),sc=o.sc??.97,fa=o.famp??1.1,fo=o.fop?` fill-opacity="${o.fop}"`:'';
      // the old drifted fill is still measured for the fit (not drawn), so every dog keeps its size and place; its wobble is the fill's own wobble
      const jw=fill?P.map(q=>{const j=[J(fa),J(fa)];tr(cx+(q[0]-cx)*sc+ox+j[0],Math.min(cy+(q[1]-cy)*sc+oy+j[1],h.cy||1e9));return j}):null;
      if(o.noline){if(fill){const Q=P.map((q,i)=>[q[0]+jw[i][0],Math.min(q[1]+jw[i][1],h.cy||1e9)]);acc.push(`<path d="${pd(part&&!o.own?dense(Q,true,3).map(q=>pin(q,part)):Q)}Z" fill="${fill}"${fo}/>`)}return}
      const s0=Math.floor(r()*n),cnt=n+(o.closed?1:(r()<.55?0:-1)),L=[],Q=[];for(let i=0;i<=cnt;i++)L.push(P[(s0+i)%n]);let d=pl(L,o.amp??1.2,Q);
      if(fill)acc.push(`<path d="${pd(Q.slice(0,n))}Z" fill="${fill}"${fo}/>`);
      // 24 Nov 2026 (owner's rule, found at print size: the Shiba's ear and cheek, the tricolour Corgi's chest): the crayon outline used to stop one step short of its
      // start, so the fill's last edge showed with no line on it. A filled shape's line now always ends back where it began: one more stroke from its last point to
      // its first, the same wobbly points, no new jitter (the random stream and every other point stay as they were). Written with commas (never used elsewhere),
      // so dogs/check_identical.js can leave exactly this stroke out and prove nothing else moved. A shape with no fill keeps its crayon gap.
      if(fill&&!o.closed){const a=Q[Q.length-1],b=Q[0];d+=`M${R1(a[0])},${R1(a[1])}L${R1(b[0])},${R1(b[1])}`}
      acc.push(st(d,o.w||LW,INK));lastQ=Q.slice(0,n);lastW=o.w||LW
    },
    // part(true): keep the marks that follow inside the outline just drawn; part(false): stop
    part(on){part=on&&lastQ?inset(lastQ,lastW*.5):null},
    tube(pts,w,fill,o={}){const P=dense(pts,false,8),d=pl(P,.9);acc.push(st(d,w+(o.ow??LW*1.45),INK));if(fill){pl(P,.8);acc.push(st(d,w,fill))}},// the fill runs down the middle of its own ink (it used to be nudged off it)
    line(pts,w,col,amp=1){if(!pts.length||isNaN(pts[0][0]))return;acc.push(st(pl(dense(pts,false,7),amp),w,col||INK))},
    dot(x,y,rx,ry,fill){if(isNaN(x))return;x+=J(.5);y+=J(.5);tr(x-rx,y-(ry??rx));tr(x+rx,y+(ry??rx));acc.push(`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(rx)}" ry="${R1(ry??rx)}" fill="${fill||INK}"/>`)},
    heart(x,y,s,fill){const p=[];for(let i=0;i<16;i++){const t=i/16*Math.PI*2;p.push([x+s*.062*16*Math.pow(Math.sin(t),3),y-s*.062*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))])}h.shape(p,fill||'#FF4F7B',{w:3.4,step:30,ox:1.5,oy:-1,amp:.8})},
    // waxy crayon streaks inside an ellipse (local rx,ry) mapped by M: a few seeded diagonal strokes, darker + lighter
    // (25 Oct 2026: both ends of every streak stay inside 80% of the ellipse, so a streak never crosses the outline: one that would is turned round, else cut short;
    // while a part is open, both ends are also kept inside its outline)
    crayon(rx,ry,M,col,n){if(isNaN(M([0,0])[0]))return;let d1='',d2='';for(let i=0;i<n;i++){const a=r()*Math.PI*2,rr=Math.sqrt(r())*.74,x=Math.cos(a)*rx*rr,y=Math.sin(a)*ry*rr,l=7+r()*10,ux=l*.55,uy=-l*.8,E=.64,
      ins=(t)=>((x+ux*t)/rx)**2+((y+uy*t)/ry)**2<=E,A=(ux/rx)**2+(uy/ry)**2,Bq=2*(x*ux/rx/rx+y*uy/ry/ry),Cq=(x/rx)**2+(y/ry)**2-E,
      t=ins(1)?1:ins(-1)?-1:(-Bq+Math.sqrt(Math.max(0,Bq*Bq-4*A*Cq)))/(2*A),p0=M([x,y]),q0=M([x+ux*t,y+uy*t]),p=part?pin(p0,part):p0,q=part?pin(q0,part):q0;(i%3?d1+=`M${R1(p[0])} ${R1(p[1])}L${R1(q[0])} ${R1(q[1])}`:d2+=`M${R1(p[0])} ${R1(p[1])}L${R1(q[0])} ${R1(q[1])}`)}
      acc.push(`<path d="${d1}" stroke="${mix(col,PEN,col===W?.12:.22)}" stroke-width="2.2" stroke-linecap="round" opacity=".42"/><path d="${d2}" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".32"/>`)},
    text(s,x,y,size,col,rt=0){texts.push({s,x:x+J(1.5),y:y+J(1.2),size,col,rt:rt+J(3)});tr(x-2,y-size);tr(x+size*.7*s.length,y+4)}
  };
  return h;
}

/* ---------- breed rigs (facing right; body-local and head-local coordinates in px) ---------- */
/* Tan points ("tan-points" branch, owner, 8 Nov 2026): the tricolour Border Collie and the Pembroke black-headed tricolour. s.tan is set by coated()
   only from coat.tan (mods/genes.js TAN_ART: genes that carry at_ on a dark coat), so every older collie and corgi takes none of these branches.
   The tan goes down first and the white over it, so it shows as a crayon band between the black and the white, as on the real dogs. */
function tanBrows(h,Hd,s,r){const hx=s.head.rx,hy=s.head.ry,f=s.face,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1];
  [e0,e1].forEach((e,i)=>h.dot(...Hd([hx*(e[0]+.04),hy*(e[1]-.4)]),r*(i?.9:1),r*.72,s.tan))}// a tan dot over each eye
function tanCollie(h,B,Hd,s){const b=s.body,hx=s.head.rx,hy=s.head.ry,T=s.tan,o={noline:1,ox:0,oy:0};
  h.shape([[b.rx*.4,-b.ry*.72],[b.rx*.6,-b.ry*.5],[b.rx*.54,b.ry*.06],[b.rx*.3,b.ry*.5],[b.rx*.1,b.ry*.98],[b.rx*.26,b.ry*.98],[b.rx*.4,b.ry*.6],[b.rx*.7,b.ry*.1],[b.rx*.6,-b.ry*.8]].map(B),T,o);// a tan edge behind the white chest, down to the forelegs
  h.shape(circ(-b.rx*.84,b.ry*.12,b.rx*.12,b.ry*.3,7).map(B),T,o);// under the tail
  h.shape(circ(hx*.4,hy*.3,hx*.36,hy*.17,9).map(Hd),T,o);h.shape(circ(-hx*.36,hy*.3,hx*.24,hy*.16,8).map(Hd),T,o)}// the cheeks and the sides of the muzzle (the white muzzle and chin go over the lower half)
function tanCorgi(h,B,Hd,s){const b=s.body,hx=s.head.rx,hy=s.head.ry,T=s.tan,o={noline:1,ox:0,oy:0};
  h.shape([[-b.rx*.96,b.ry*.12],[-b.rx*.3,b.ry*.3],[b.rx*.3,b.ry*.36],[b.rx*.76,-b.ry*.16],[b.rx*1.04,-b.ry*.3],[b.rx*1.04,b.ry*.3],[b.rx*.3,b.ry*.8],[-b.rx*.8,b.ry*.8]].map(B),T,o);// a tan band round the black saddle, over the chest and the sides
  h.shape(circ(-b.rx*.66,b.ry*.18,b.rx*.2,b.ry*.42,8).map(B),T,o);// the thigh
  h.shape(circ(-hx*.42,hy*.24,hx*.34,hy*.26,9).map(Hd),T,o);h.shape(circ(hx*.72,hy*.08,hx*.3,hy*.2,8).map(Hd),T,o)}// tan cheeks round the white face
const SP={
 shiba:{name:'Mochi',breed:'Shiba Inu',personality:'Proud, independent, dramatic',joke:'heh.',
  col:'#F7892E',hcol:'#F7892E',light:'#FFE7B3',body:{x:112,y:142,rx:42,ry:22,lop:.05},head:{x:164,y:106,rx:32,ry:28},
  legs:{h:-27,f:24,w:8.5},ears:'prick',tail:'spiral',eyes:[8,6.2],face:{eyes:'smug',mouth:'smirk'},
  marks:(h,B,Hd,s)=>{h.shape([[-s.body.rx*.55,s.body.ry*.5],[s.body.rx*.3,s.body.ry*.55],[s.body.rx*.95,s.body.ry*.05],[s.body.rx*.75,s.body.ry*.8],[-s.body.rx*.45,s.body.ry*.9]].map(B),s.light,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;h.shape([[-hx*.8,hy*.25],[hx*.05,hy*.12],[hx*.95,hy*.05],[hx*.9,hy*.7],[hx*.2,hy*.95],[-hx*.6,hy*.78]].map(Hd),s.light,{noline:1})}},
 corgi:{name:'Biscuit',breed:'Corgi',personality:'Cheerful, greedy for food',joke:'is that... a snack?',
  col:'#F8A23C',hcol:'#F8A23C',light:W,body:{x:110,y:153,rx:50,ry:21,lop:.04},head:{x:166,y:126,rx:31,ry:27},
  legs:{h:-34,f:30,w:10,col:W},ears:'giant',tail:'nub',eyes:[6.4,5.2],face:{eyes:'open',mouth:'grin',brow:'eager',drool:1,pupil:.74},
  marks:(h,B,Hd,s)=>{const b=s.body;if(s.tan)tanCorgi(h,B,Hd,s);h.shape([[-b.rx*.8,b.ry*.45],[b.rx*.2,b.ry*.62],[b.rx*1.0,b.ry*.1],[b.rx*.85,b.ry*.95],[-b.rx*.6,b.ry*1.0]].map(B),s.light,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;h.shape([[hx*.1,-hy*.95],[hx*.3,-hy*.95],[hx*.42,hy*.05],[hx*.95,hy*.25],[hx*.85,hy*.85],[-hx*.5,hy*.9],[-hx*.75,hy*.4],[-hx*.05,hy*.15]].map(Hd),s.light,{noline:1});if(s.tan)tanBrows(h,Hd,s,3)}},
 golden:{name:'Sunny',breed:'Golden Retriever',personality:'Friendly, loves fetch',joke:'BALL? BALL! BALL!!',
  col:'#F2B84A',hcol:'#F2B84A',ear:'#D98A22',fluff:1,body:{x:108,y:130,rx:52,ry:38},head:{x:160,y:96,rx:34,ry:30},
  legs:{h:-27,f:22,w:9},ears:'flop2',tail:'wiggle',eyes:[5.4,7.6],face:{eyes:'open',mouth:'tongue',e0:[-.18,-.08],e1:[.36,-.16],nose:[.12,.22],look:[[-.35,.2],[.3,-.15]],tside:1},marks:null},
 dachs:{name:'Noodle',breed:'Dachshund',personality:'Curious, loves digging',joke:'still loading... (I am long)',
  col:'#A65A34',hcol:'#A65A34',light:'#F5B26B',ear:'#6E3315',body:{x:110,y:154,rx:78,ry:17,lop:.02,long:1},head:{x:191,y:128,rx:24,ry:22},
  legs:{h:-56,f:50,w:8,sock:'#F5B26B'},ears:'dflop',earSwing:62,tail:'thin',eyes:[6.3,4.6],face:{eyes:'open',mouth:'smile',e0:[-.15,-.2],e1:[.4,-.3],nose:[1.48,.14],snout:1,brow:'curious',tilt:-8},
  marks:(h,B,Hd,s)=>{const b=s.body;h.shape([[b.rx*.55,b.ry*.35],[b.rx*1.0,b.ry*.05],[b.rx*.9,b.ry*.95],[b.rx*.5,b.ry*.9]].map(B),s.light,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;[[-.18,-.62],[.36,-.72]].forEach(e=>h.dot(...Hd([hx*e[0],hy*e[1]]),3.2,2.2,s.light))}},
 husky:{name:'Frost',breed:'Husky',personality:'Energetic, chatty (howls)',joke:'AWOOOOOO!!',
  col:'#78A2E2',hcol:'#78A2E2',light:W,body:{x:108,y:144,rx:44,ry:23,lop:.04},head:{x:162,y:104,rx:36,ry:32},
  legs:{h:-28,f:25,w:9,sock:W},ears:'tall',tail:'fluffy',eyes:[12,9.5],iris:'#1EA8FF',face:{eyes:'open',mouth:'o',e0:[-.3,-.06],e1:[.36,-.1],nose:[.06,.4],brow:'angry'},
  marks:(h,B,Hd,s)=>{const b=s.body;h.shape([[-b.rx*.7,b.ry*.5],[b.rx*.3,b.ry*.55],[b.rx*.95,b.ry*.1],[b.rx*.8,b.ry*.9],[-b.rx*.5,b.ry*.95]].map(B),s.light,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;h.shape([[-hx*.92,hy*.0],[-hx*.55,-hy*.42],[-hx*.08,-hy*.12],[hx*.08,-hy*.55],[hx*.25,-hy*.12],[hx*.7,-hy*.45],[hx*.95,hy*.05],[hx*.8,hy*.75],[hx*.05,hy*.98],[-hx*.75,hy*.72]].map(Hd),s.light,{noline:1,ox:0,oy:1})}},
 mutt:{name:'Pepper',breed:'Shelter Mutt',personality:'Loyal, gentle',joke:'I have zero matching spots.',
  col:W,hcol:W,dark:'#1D1A22',body:{x:110,y:144,rx:44,ry:23,lop:.04},head:{x:162,y:106,rx:33,ry:29},
  legs:{h:-28,f:25,w:9,cols:{NH:'#1D1A22'}},ears:'mixed',tail:'line',eyes:[7.6,6.2],face:{eyes:'open',mouth:'tongue',brow:'soft',sweet:1},
  marks:(h,B,Hd,s)=>{const b=s.body,K=s.dark;h.shape(circ(-b.rx*.28,-b.ry*.15,b.rx*.3,b.ry*.55,10).map(B),K,{noline:1,ox:0,oy:0});h.shape(circ(b.rx*.42,b.ry*.05,b.rx*.25,b.ry*.6,10).map(B),K,{noline:1,ox:0,oy:0});h.shape(circ(-b.rx*.8,b.ry*.45,b.rx*.12,b.ry*.3,8).map(B),K,{noline:1,ox:0,oy:0});
   const hx=s.head.rx,hy=s.head.ry;h.shape(circ(hx*.42,-hy*.18,hx*.42,hy*.46,11).map(Hd),K,{noline:1,ox:0,oy:0});h.shape(circ(-hx*.55,hy*.5,hx*.16,hy*.15,8).map(Hd),K,{noline:1,ox:0,oy:0})}}
};
SP.chihuahua={name:'Peanut',breed:'Chihuahua',personality:'Tiny, fearless, dramatic guard dog',joke:'I am the security system.',
  col:'#F0C48C',hcol:'#F0C48C',light:'#FFF1DC',body:{x:118,y:152,rx:29,ry:15,lop:.05},head:{x:158,y:120,rx:29,ry:26},
  legs:{h:-19,f:17,w:5.2},ears:'bat',tail:'sickle',tsc:.8,eyes:[9.6,8.6],shiver:1,face:{eyes:'open',mouth:'smile',e0:[-.2,0],e1:[.42,-.02],nose:[.72,.36],pupil:.62,brow:'angry'},
  marks:(h,B,Hd,s)=>{const b=s.body;h.shape([[b.rx*.2,b.ry*.4],[b.rx*1.0,b.ry*.05],[b.rx*.9,b.ry*.9],[b.rx*.1,b.ry*.95]].map(B),s.light,{noline:1});const hx=s.head.rx,hy=s.head.ry;h.shape(circ(hx*.5,hy*.5,hx*.42,hy*.32,9).map(Hd),s.light,{noline:1})}};
SP.pug={name:'Dumpling',breed:'Pug',personality:'Snorty, cuddly, lazy, food-loving',joke:'snort.',
  col:'#E8C08C',hcol:'#E8C08C',light:'#F6DDB6',dark:'#2B2430',ear:'#2B2430',body:{x:112,y:150,rx:40,ry:25,lop:.02},head:{x:162,y:114,rx:32,ry:28},
  legs:{h:-25,f:23,w:9.5},ears:'rose2',tail:'curl',eyes:[9.4,9.8],face:{eyes:'open',mouth:'tongue',e0:[-.26,-.08],e1:[.46,-.1],nose:[.14,.3],pupil:.6,brow:'soft'},
  marks:(h,B,Hd,s)=>{const hx=s.head.rx,hy=s.head.ry,K=s.dark;h.shape(circ(hx*.1,hy*.42,hx*.62,hy*.45,12).map(Hd),K,{noline:1,ox:0,oy:0});
   [[-.35,-.5],[-.1,-.62],[.18,-.5]].forEach(q=>h.line([[hx*(q[0]-.12),hy*q[1]],[hx*q[0],hy*(q[1]-.08)],[hx*(q[0]+.12),hy*q[1]]].map(Hd),2.2,PEN,.5));h.line([[hx*-.25,hy*.12],[hx*.1,hy*.02],[hx*.45,hy*.12]].map(Hd),2.4,PEN,.5)}};
SP.greyhound={name:'Rocket',breed:'Greyhound',personality:'Gentle couch potato who sprints in bursts',joke:'45 mph. Then a 20-hour nap.',
  col:'#8E9AB0',hcol:'#8E9AB0',light:W,ear:'#6E7A90',body:{x:108,y:104,rx:46,ry:17,deep:1},head:{x:172,y:76,rx:22,ry:15},neck:1,
  legs:{h:-34,f:31,w:5.8},ears:'roseG',tail:'whip',eyes:[5.6,4.6],face:{eyes:'open',mouth:'smile',e0:[-.05,-.25],e1:[.5,-.3],nose:[2.05,.12],snout:2,snoutL:2.1,brow:'soft'},
  marks:(h,B,Hd,s)=>{const b=s.body;h.shape([[b.rx*.45,b.ry*.1],[b.rx*1.0,-b.ry*.1],[b.rx*.85,b.ry*1.15],[b.rx*.4,b.ry*1.2]].map(B),s.light,{noline:1})}};
SP.beagle={name:'Bagel',breed:'Beagle',personality:'Nose-led, food-obsessed, bays loudly',joke:'Smelled that from three streets away.',
  col:'#CF8C4C',hcol:'#CF8C4C',light:W,dark:'#2B2430',ear:'#A8642E',body:{x:112,y:142,rx:44,ry:22,lop:.04},head:{x:164,y:106,rx:30,ry:27},
  legs:{h:-28,f:25,w:9,col:W},ears:'flopL',tail:'flag',eyes:[7.4,6.4],face:{eyes:'open',mouth:'smile',e0:[-.12,-.06],e1:[.44,-.1],look:[[.3,.1],[.3,.1]],brow:'soft'},
  marks:(h,B,Hd,s)=>{const b=s.body,K=s.dark;h.shape([[-b.rx*.85,-b.ry*.55],[-b.rx*.3,-b.ry*1.0],[b.rx*.45,-b.ry*.95],[b.rx*.55,-b.ry*.1],[-b.rx*.2,b.ry*.15],[-b.rx*.8,b.ry*.05]].map(B),K,{noline:1,ox:0,oy:-1});
   h.shape([[b.rx*.5,b.ry*.1],[b.rx*1.0,-b.ry*.1],[b.rx*.9,b.ry*1.0],[b.rx*.3,b.ry*1.0]].map(B),s.light,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;h.shape([[hx*.05,-hy*.95],[hx*.25,-hy*.95],[hx*.38,hy*.1],[hx*.95,hy*.3],[hx*.85,hy*.9],[-hx*.4,hy*.9],[-hx*.55,hy*.45],[0,hy*.15]].map(Hd),s.light,{noline:1})}};
/* v2.5 Autumn & New Pups: four more crude ones. Their extras (curlEar, topknot, earS, earRound, legs.pom, tail 'pom',
   ears 'semi', mouths 'sammy'/'grump', face.browCol) are new spec fields, so the ten older dogs never take these branches */
const lum=c=>{const v=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16)/255);return v[0]*.3+v[1]*.59+v[2]*.11};
const curlCol=c=>lum(c)<.32?mix(c,W,.32):mix(c,PEN,.38);
SP.poodle={name:'Pretzel',breed:'Miniature Poodle',personality:'Thinks it is the smartest one in the room. It is.',joke:'Haircut optional. Dignity not.',
  col:'#F2C48F',hcol:'#F2C48F',light:'#FBE2C0',fluff:1,hfluff:1,body:{x:110,y:136,rx:41,ry:26},head:{x:157,y:98,rx:26,ry:25},
  legs:{h:-26,f:23,w:6.2,pom:1},ears:'flopL',curlEar:1,topknot:1,tail:'pom',eyes:[5.8,5.2],
  face:{eyes:'smug',mouth:'smile',e0:[-.1,-.16],e1:[.34,-.2],nose:[1.6,.12],snout:2,snoutL:1.6,tilt:-10},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,c=curlCol(s.col),c2=curlCol(s.hcol);
   [[-.6,-.32],[.1,-.5],[.6,-.1],[-.3,.3],[.3,.42],[-.8,.05]].forEach((q,i)=>h.line(spiral(b.rx*q[0],b.ry*q[1],.8,5,1.1,8,i*1.3).map(B),2.6,c,.7));
   [[-.52,-.42],[-.08,-.66],[-.62,.12],[-.28,.42]].forEach((q,i)=>h.line(spiral(hx*q[0],hy*q[1],.5,3.8,1.25,8,i*1.7).map(Hd),2,c2,.3))}};
SP.collie={name:'Scout',breed:'Border Collie',personality:'Has counted the sheep. There are no sheep. Has counted you.',joke:'Will herd the puppies, the ducks and the furniture.',
  col:'#2A2628',hcol:'#2A2628',light:W,body:{x:110,y:144,rx:44,ry:23,lop:.04},head:{x:164,y:106,rx:30,ry:26},neck:1,neckCol:W,// 25 Oct 2026: the white chest between body and head is a white neck tube with its own line (the white bib used to spill off the body and head to join them)
  legs:{h:-28,f:25,w:8.6,sock:W},ears:'semi',tail:'fluffy',eyes:[7,6.6],
  face:{eyes:'open',mouth:'smile',e0:[-.14,-.16],e1:[.38,-.2],nose:[1.42,.1],snout:1,snoutL:1.4,brow:'curious',browCol:'#CFC6C0',look:[[-.3,.18],[-.3,.18]]},
  marks:(h,B,Hd,s)=>{const b=s.body,K=s.light;if(s.tan)tanCollie(h,B,Hd,s);h.shape([[b.rx*.5,-b.ry*.95],[b.rx*.82,-b.ry*.78],[b.rx*1.03,b.ry*.05],[b.rx*.88,b.ry*.95],[b.rx*.2,b.ry*1.0],[b.rx*.35,b.ry*.55],[b.rx*.62,b.ry*.1]].map(B),K,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;h.shape([[hx*.06,-hy*.98],[hx*.24,-hy*.98],[hx*.46,hy*.02],[hx*.04,-hy*.02]].map(Hd),K,{noline:1});
   h.shape([[hx*.0,hy*.42],[hx*.9,hy*.28],[hx*.82,hy*.92],[-hx*.38,hy*.96]].map(Hd),K,{noline:1});h.shape(circ(-hx*.5,hy*.62,hx*.42,hy*.36,9).map(Hd),K,{noline:1,ox:0,oy:0});if(s.tan)tanBrows(h,Hd,s,3)}};
SP.samoyed={name:'Cloud',breed:'Samoyed',personality:'Smiles so the snow does not stick. Also just smiles.',joke:'Sheds a second dog every spring.',
  col:'#FBF6EC',hcol:'#FBF6EC',light:W,dark:'#E8DECB',fluff:1,hfluff:1,body:{x:106,y:128,rx:55,ry:39},head:{x:162,y:93,rx:35,ry:31},
  legs:{h:-28,f:24,w:9.6},ears:'prick',earS:.8,earRound:2,tail:'spiral',tsc:.64,spS:.7,eyes:[6.4,6],
  face:{eyes:'open',mouth:'sammy',e0:[-.16,-.1],e1:[.36,-.14],nose:[.64,.24]},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=mix(s.dark,PEN,.3);h.crayon(b.rx,b.ry,B,mix(s.dark,PEN,.35),8);
   [[-.55,-.4],[-.1,-.62],[.4,-.38],[-.72,.32],[.1,.45],[.68,.38]].forEach(q=>{const x=q[0]*b.rx,y=q[1]*b.ry;h.line([[x-6,y-2],[x-3,y+3],[x,y-2],[x+3,y+3],[x+6,y-1]].map(B),2.2,K,.4)});
   h.line([[-hx*.78,hy*.12],[-hx*.66,hy*.48],[-hx*.4,hy*.72],[-hx*.08,hy*.84]].map(Hd),2.2,K,.4)}};
SP.frenchie={name:'Brioche',breed:'French Bulldog',personality:'Snores, snorts, sits on your foot. All three at once.',joke:'Breathes like a tiny engine. Shade and water, please.',
  col:'#D9B48A',hcol:'#D9B48A',light:'#F0DCC0',dark:'#3A2E2E',body:{x:112,y:150,rx:40,ry:25,lop:.02},head:{x:160,y:116,rx:31,ry:28},
  legs:{h:-24,f:23,w:10.6},ears:'bat',earS:.72,earW:1.3,earRound:3,tail:'nub',eyes:[8.6,9],
  face:{eyes:'open',mouth:'grump',e0:[-.26,-.1],e1:[.44,-.12],nose:[.2,.3],pupil:.62,brow:'soft',drool:1},
  marks:(h,B,Hd,s)=>{const b=s.body;h.shape([[b.rx*.48,-b.ry*.05],[b.rx*.82,-b.ry*.2],[b.rx*1.0,b.ry*.3],[b.rx*.86,b.ry*.95],[b.rx*.5,b.ry*.85],[b.rx*.38,b.ry*.4]].map(B),s.light,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;h.shape(circ(hx*.2,hy*.42,hx*.5,hy*.36,11).map(Hd),mix(s.dark,s.hcol,.3),{noline:1,ox:0,oy:0});
   h.line([[hx*-.02,-hy*.42],[hx*.1,-hy*.52],[hx*.22,-hy*.42]].map(Hd),2.2,PEN,.5);h.line([[hx*-.1,hy*.1],[hx*.2,hy*.02],[hx*.5,hy*.1]].map(Hd),2.2,PEN,.5)}};
/* v2.11 Tokyo Trip: three more crude ones (V211.md 5.2). Their extras (ruff, ruffK, tail 'plume', s.dark saddle strokes)
   are new spec fields, so the fourteen older dogs never take these branches */
SP.akita={name:'Kuma',breed:'Akita',personality:'Calm, loyal, quietly proud. Waits by the gate.',joke:'I will wait for you. I am very good at waiting.',
  col:'#D46E36',hcol:'#D46E36',light:'#FFF4E2',dark:'#A44E1E',body:{x:106,y:133,rx:55,ry:31,lop:.04},head:{x:168,y:95,rx:41,ry:32},
  legs:{h:-31,f:29,w:11.6,sock:'#FFF4E2'},ears:'prick',earS:.64,earTilt:14,earRound:1,tail:'spiral',tsc:1.08,eyes:[5,4.6],
  face:{eyes:'open',mouth:'smile',e0:[-.12,-.14],e1:[.38,-.18],nose:[.72,.26],pupil:.74,tilt:-5},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry;
   h.shape([[-b.rx*.62,b.ry*.48],[b.rx*.3,b.ry*.5],[b.rx*.98,-b.ry*.05],[b.rx*.82,b.ry*.88],[-b.rx*.5,b.ry*.95]].map(B),s.light,{noline:1});
   const ses=lum(s.col)-lum(s.dark)>.3;// sesame: black-tipped hairs, so more and longer saddle strokes when the dark is really dark
   (ses?[-.72,-.58,-.44,-.3,-.16,-.02,.12,.26,.4]:[-.6,-.42,-.2,0,.2]).forEach((x,i)=>h.line([[b.rx*x,-b.ry*(.9+(i%2)*.05)],[b.rx*(x+.05),-b.ry*(ses?.4+(i%3)*.08:.68)]].map(B),ses?2.6:2.2,mix(s.dark,s.col,.2),.4));
   h.shape([[-hx*.86,hy*.22],[-hx*.24,hy*.06],[hx*.28,-hy*.02],[hx*.98,hy*.02],[hx*.94,hy*.74],[hx*.2,hy*.98],[-hx*.66,hy*.8]].map(Hd),s.light,{noline:1});
   [[-.14,-.52],[.38,-.58]].forEach(e=>h.dot(...Hd([hx*e[0],hy*e[1]]),3.6,2.4,s.light));
   (lum(s.col)-lum(s.dark)>.3?[[-.3,-.84,-.22,-.66],[.06,-.9,.12,-.7],[-.56,-.66,-.46,-.5],[.3,-.84,.34,-.68]]:[[-.3,-.84,-.22,-.66],[.06,-.9,.12,-.7]]).forEach(q=>h.line([[hx*q[0],hy*q[1]],[hx*q[2],hy*q[3]]].map(Hd),2.4,s.dark,.4))}};
SP.spitz={name:'Daifuku',breed:'Japanese Spitz',personality:'A white fluffball, cheerful, a bit of a show-off.',joke:'Yes, I am this white on purpose. Look at me.',
  col:'#FCF8F0',hcol:'#FCF8F0',light:W,dark:'#E6DCCB',fluff:1,hfluff:1,body:{x:110,y:137,rx:44,ry:31},head:{x:160,y:99,rx:30,ry:27},
  legs:{h:-26,f:22,w:8},ears:'prick',earS:.84,tail:'plume',plumeUp:1,ruff:1.04,eyes:[6.6,6.2],
  face:{eyes:'open',mouth:'tongue',e0:[-.14,-.1],e1:[.38,-.14],nose:[.8,.22],pupil:.76},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,K=mix(s.dark,PEN,.3);h.crayon(b.rx,b.ry,B,mix(s.dark,PEN,.35),7);
   [[-.6,-.36],[-.05,-.6],[.5,-.3],[-.66,.36],[.2,.46]].forEach(q=>{const x=q[0]*b.rx,y=q[1]*b.ry;h.line([[x-5,y-2],[x-2,y+3],[x+1,y-2],[x+4,y+3]].map(B),2.2,K,.4)});
   h.line([[hx*.06,-s.head.ry*.62],[hx*.16,-s.head.ry*.5],[hx*.26,-s.head.ry*.62]].map(Hd),2,K,.3)}};
SP.pom={name:'Mikan',breed:'Pomeranian',personality:'A tiny fluffy loudspeaker. Spins when happy.',joke:'Yip! That was my indoor voice.',
  col:'#F59A3C',hcol:'#F59A3C',light:'#FFD9A6',dark:'#C9701E',fluff:1,hfluff:1,body:{x:116,y:150,rx:32,ry:24},head:{x:155,y:115,rx:26,ry:24},
  legs:{h:-18,f:16,w:5.4},ears:'prick',earS:.62,tail:'plume',tsc:.8,ruff:1.16,ruffK:'light',eyes:[6.8,6.4],
  face:{eyes:'open',mouth:'smile',e0:[-.18,-.14],e1:[.36,-.18],nose:[.84,.3],pupil:.72},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=curlCol(s.col);h.crayon(b.rx,b.ry,B,s.dark,6);
   [[-.55,-.4],[.05,-.62],[-.7,.3]].forEach(q=>{const x=q[0]*b.rx,y=q[1]*b.ry;h.line([[x-4,y-2],[x-1,y+3],[x+2,y-2],[x+5,y+2]].map(B),2,K,.4)});
   h.shape(circ(hx*.6,hy*.4,hx*.38,hy*.3,9).map(Hd),s.light,{noline:1,ox:0,oy:0});h.line([[-hx*.42,-hy*.62],[-hx*.3,-hy*.46],[-hx*.18,-hy*.62]].map(Hd),2,K,.3)}};
/* v2.11 four more (the owner's addition, V211.md 5.2 and 6). Their extras (body.sq, sqHead, ears 'curtain', topknot 2, legs.hair,
   tails 'ring' / 'brush' / 'low', face.snout 3 (the dark mask), snoutD, jowl, s.brindle, s.harl) are new spec fields, so no older dog takes these branches */
const maskCol=s=>mix(s.dark||INK,s.hcol,.46);
SP.afghan={name:'Saffron',breed:'Afghan Hound',personality:'Elegant and aloof. Not one hair out of place.',joke:'I do not fetch. I glide.',
  col:'#C9783E',hcol:'#C9783E',light:'#E6A86E',dark:'#3A2E2E',body:{x:104,y:116,rx:44,ry:20,lop:.04},head:{x:164,y:80,rx:25,ry:21},neck:1,
  legs:{h:-30,f:27,w:6.4,sock:'#E6A86E',hair:1},ears:'curtain',topknot:2,tail:'ring',eyes:[6.2,5.6],
  face:{eyes:'smug',mouth:'smile',e0:[.1,-.26],e1:[.55,-.3],nose:[1.86,.14],snout:2,snoutL:1.84,tilt:-12},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=curlCol(s.col);hangHair(h,B,s,b.ry*1.15);
   [[-.7,-.62],[-.25,-.8],[.2,-.72]].forEach(q=>h.line([[b.rx*q[0],b.ry*q[1]],[b.rx*(q[0]-.06),b.ry*(q[1]+.4)],[b.rx*(q[0]+.02),b.ry*(q[1]+.85)]].map(B),2.2,K,.4));
   h.line([[-hx*.55,-hy*.7],[-hx*.2,-hy*.95],[hx*.15,-hy*.88]].map(Hd),2,K,.3)}};
SP.dane={name:'Waffle',breed:'Great Dane',personality:'A gentle giant who follows you from room to room.',joke:'I am a lap dog. Your lap is just too small.',
  col:'#D9A562',hcol:'#D9A562',light:'#E6BA7E',dark:'#2B2430',ear:'#2B2430',body:{x:106,y:110,rx:47,ry:24,sq:1},head:{x:166,y:70,rx:25,ry:22},neck:1,sqHead:1,
  legs:{h:-31,f:30,w:8.6},ears:'flop2',earS:.9,tail:'whip',eyes:[5.4,5],
  face:{eyes:'open',mouth:'smile',e0:[-.1,-.28],e1:[.42,-.32],nose:[1.56,.12],snout:3,snoutL:1.55,snoutD:.78,brow:'soft'},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,M=maskCol(s);brindle(h,B,Hd,s);
   h.shape([[b.rx*.55,-b.ry*.15],[b.rx*1.0,-b.ry*.45],[b.rx*1.04,b.ry*.6],[b.rx*.62,b.ry*.95],[b.rx*.42,b.ry*.4]].map(B),s.light,{noline:1});
   h.shape([[-hx*.75,hy*.62],[hx*.2,hy*.66],[hx*.62,hy*.92],[-hx*.5,hy*1.0]].map(Hd),s.light,{noline:1,ox:0,oy:0});
   [[-.1,-.28],[.42,-.32]].forEach(e=>h.shape(circ(hx*e[0],hy*e[1],hx*.26,hy*.26,8).map(Hd),M,{noline:1,ox:0,oy:0}))}};
SP.mastiff={name:'Crumpet',breed:'English Mastiff',personality:'Huge, slow and sweet. Naps in the biggest patch of shade.',joke:'A little drool is how I say I love you.',
  col:'#D8AE72',hcol:'#D8AE72',light:'#E9C994',dark:'#2B2430',ear:'#2B2430',body:{x:108,y:134,rx:56,ry:33,sq:1},head:{x:166,y:98,rx:37,ry:32},sqHead:1,
  legs:{h:-34,f:32,w:13.4},ears:'flop2',earS:.72,tail:'low',eyes:[5,4.6],
  face:{eyes:'open',mouth:'smile',e0:[-.16,-.24],e1:[.36,-.28],nose:[1.18,.16],snout:3,snoutL:1.22,snoutD:.7,jowl:1,brow:'soft',pupil:.66},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,M=maskCol(s);brindle(h,B,Hd,s);
   h.shape([[b.rx*.5,b.ry*.1],[b.rx*.98,-b.ry*.2],[b.rx*.92,b.ry*.95],[b.rx*.42,b.ry*.9]].map(B),s.light,{noline:1});
   h.shape([[-hx*.4,-hy*.42],[hx*.12,-hy*.58],[hx*.7,-hy*.5],[hx*.82,hy*.2],[hx*.1,hy*.42],[-hx*.42,hy*.1]].map(Hd),M,{noline:1,ox:0,oy:0});
   [[-.42,-.72],[-.1,-.84],[.24,-.76]].forEach(q=>h.line([[hx*(q[0]-.12),hy*q[1]],[hx*q[0],hy*(q[1]-.07)],[hx*(q[0]+.12),hy*q[1]]].map(Hd),2.2,PEN,.5));
   h.line([[-hx*.62,hy*.3],[-hx*.5,hy*.55],[-hx*.28,hy*.66]].map(Hd),2.2,PEN,.4)}};
SP.gsd={name:'Strudel',breed:'German Shepherd',personality:'Clever and alert. Loves a job, any job.',joke:'Ears up. On duty. Was that a squirrel?',
  col:'#C98A4A',hcol:'#C98A4A',light:'#E2B278',dark:'#2B2430',ear:'#2B2430',body:{x:108,y:137,rx:50,ry:26,lop:.04},head:{x:166,y:98,rx:29,ry:25},neck:1,// v2.11.1: the neck tube in every pose (the head floated over the shoulders)
  legs:{h:-30,f:28,w:9.6},ears:'prick',earS:1.18,tail:'brush',tsc:.92,eyes:[5.8,5.4],
  face:{eyes:'open',mouth:'smile',e0:[-.14,-.2],e1:[.38,-.24],nose:[1.5,.14],snout:3,snoutL:1.5,brow:'curious'},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=s.dark;
   h.shape([[-b.rx*.92,-b.ry*.3],[-b.rx*.75,-b.ry*.95],[-b.rx*.05,-b.ry*1.08],[b.rx*.58,-b.ry*.92],[b.rx*.62,-b.ry*.25],[b.rx*.1,b.ry*.2],[-b.rx*.55,b.ry*.12]].map(B),K,{noline:1,ox:0,oy:-1});
   [-.5,-.1,.3].forEach(x=>h.line([[b.rx*x,b.ry*.12],[b.rx*(x+.04),b.ry*.34]].map(B),2.2,mix(K,s.col,.3),.4));
   h.shape([[-hx*.18,-hy*.98],[hx*.32,-hy*.98],[hx*.62,-hy*.12],[hx*.3,hy*.1],[-hx*.05,-hy*.45]].map(Hd),maskCol(s),{noline:1,ox:0,oy:0})}};
function brindle(h,B,Hd,s){if(!s.brindle)return;const b=s.body,hx=s.head.rx,hy=s.head.ry,c=mix(s.dark||INK,s.col,.28);// brindle look: wavy dark crayon stripes (coat.brindle)
  [-.82,-.6,-.38,-.16,.06,.28,.5].forEach((x,i)=>h.line([[b.rx*x,-b.ry*.92],[b.rx*(x+.07),-b.ry*.35],[b.rx*(x+.01),b.ry*.2],[b.rx*(x+.08),b.ry*(.7+(i%2)*.15)]].map(B),2.4,c,.6));
  [[-.6,-.5],[-.3,-.7],[-.7,.1]].forEach(q=>h.line([[hx*q[0],hy*q[1]],[hx*(q[0]+.08),hy*(q[1]+.3)],[hx*q[0],hy*(q[1]+.55)]].map(Hd),2.2,c,.4))}
function hangHair(h,B,s,len){// long silky hair hanging straight down from whichever side of the body is lowest, whatever the pose
  const b=s.body,c=B([0,0]);if(isNaN(c[0]))return;const top=[];
  for(let i=0;i<24;i++){const a=i/24*Math.PI*2,p=B([Math.cos(a)*b.rx*.9,Math.sin(a)*b.ry*.72]);if(p[1]>c[1]+b.ry*.12)top.push(p)}
  if(top.length<3)return;top.sort((p,q)=>p[0]-q[0]);
  const bot=top.map((p,i)=>s.wet?[p[0]+(i%3===1?.8:-.4),Math.min(GY-3,p[1]+len*(i%3===1?1.14:i%3===0?.42:.6))]:[p[0]+(i%2?1.6:-1.2),Math.min(GY-3,p[1]+len*(i%2?1:.8))]),K=curlCol(s.col);// wet: the hair sticks together in a few pointed strands
  h.shape(top.concat(bot.slice().reverse()),s.col,{noline:1,ox:0,oy:0,sc:1,own:1});
  h.line([top[0]].concat(bot,[top[top.length-1]]),h.LW*.9,INK,1);
  bot.forEach((p,i)=>{if(i%3===1&&i<bot.length-1){const t=top[i];h.line([[t[0],t[1]+3],[t[0]+(p[0]-t[0])*.5+1.5,t[1]+(p[1]-t[1])*.5],[p[0],p[1]-3]],2,K,.4)}})}
/* v2.12 Fourteen New Friends (V212.md): fourteen more crude ones, appended. Each ART lane (A to D) drew only its own block below.
   Their extras are new spec fields, so no older dog takes those branches */
/* v2.12 ART A: dobie, corso, pitbull, minpin */
/* Natural ears and tails (no cropping, no docking). Their extras (ears 'drop' in EARS_A, face.grinA, the tan points in tanA) are new
   spec fields or new values, so no older dog takes these branches */
const EARS_A={drop(pr,E){// a natural drop ear: it leaves the skull at the top corner, folds over at the crease and hangs flat by the cheek, the tip down
  E.push({pts:pr([[-.4,-.94],[-1.0,-.88],[-1.24,-.36],[-1.16,.32],[-.98,.42],[-.8,-.26]]),pivot:pr([[-.66,-.88]])[0],side:-1,flop:1,fold:[0,1]});
  E.push({pts:pr([[.04,-1.0],[.56,-1.02],[.8,-.72],[.74,-.4],[.58,-.42],[.3,-.74]]),pivot:pr([[.3,-.98]])[0],side:1,flop:1,fold:[0,1]})},
 rose(pr,E){// v2.12 pitbull: a half-up rose ear, the top folded over and out
  E.push({pts:pr([[-.86,-.42],[-.8,-1.0],[-1.12,-.9],[-.4,-1.18],[-.24,-.86]]),pivot:pr([[-.56,-.74]])[0],side:-1,fold:[1,3]});
  E.push({pts:pr([[.08,-.88],[.34,-1.18],[1.1,-.9],[.78,-1.0],[.8,-.4]]),pivot:pr([[.44,-.74]])[0],side:1,fold:[1,3]})}};
function tanA(h,B,Hd,s,o){// black-and-tan points (dobie, minpin): eyebrow dots, cheeks, chest, under the tail; the muzzle is the light snout, the socks are legs.sock
  const b=s.body,hx=s.head.rx,hy=s.head.ry,f=s.face,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],K=s.light;
  h.shape([[b.rx*.62,-b.ry*.1],[b.rx*.92,-b.ry*.2],[b.rx*1.02,b.ry*.35],[b.rx*.86,b.ry*.92],[b.rx*.66,b.ry*.62]].map(B),K,{noline:1,ox:0,oy:0});
  h.shape(circ(-b.rx*.86,-b.ry*.02,b.rx*.1,b.ry*.26,7).map(B),K,{noline:1,ox:0,oy:0});
  [e0,e1].forEach((e,i)=>h.dot(...Hd([hx*(e[0]+.04),hy*(e[1]-.36)]),o.dot*(i?.9:1),o.dot*.7,K));
  h.shape(circ(hx*.44,hy*.5,hx*.3,hy*.24,9).map(Hd),K,{noline:1,ox:0,oy:0})}
function grinA(h,M){// v2.12 pitbull: the big wide happy grin, mouth open, tongue out, the corners curled up into the cheeks
  h.shape([[-25,3],[6,2],[2,15],[-7,20],[-18,17]].map(M),'#7A1F2E',{w:3.4,ox:0,oy:0,sc:1});
  h.shape([[-16,13],[-3,12],[-4,22],[-9,25],[-15,21]].map(M),'#FF6F9A',{w:2.4,ox:0,oy:0,sc:1,amp:.4});// the tongue that hangs out of the mouth gets its own line (25 Oct 2026)h.line([[-9.5,14],[-9.5,21]].map(M),2,'#C9406A');
  h.line([[-29,-3],[-25,3]].map(M),2.6,INK,.4);h.line([[9,-3],[6,2]].map(M),2.4,INK,.3)}
function ringA(h,s,L,HT,w){// v2.12 art fix: a pale crayon crease under each open eye on a dark head, so the face reads even at chip size (corso, stdpoodle)
  const f=L.face,m=f.eyes;if(/^(happy|closed|x)$/.test(m))return;const hx=s.head.rx,hy=s.head.ry,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],c=mix(s.hcol,W,.55);
  [[e0,s.eyes[0]],[e1,s.eyes[1]]].forEach(([e,r])=>{const [x,y]=HT([hx*e[0],hy*e[1]]),R=r+2.6,A=[];for(let i=0;i<=6;i++){const t=(10+i*26.7)*D2R;A.push([x+Math.cos(t)*R,y+Math.sin(t)*R*1.05])}h.line(A,w||2.4,c,.35)})}
function corsoFace(h,s,L,HT){// v2.12 art fix: on a black or dark coat the corso gets the pale eye rings and a pale lip line, so its face shows
  if(lum(s.hcol)>=.32)return;ringA(h,s,L,HT,1.9);
  if(!/^(smile|tongue)$/.test(L.face.mouth))return;const N=noseLocal(s),sf=s.head.rx/33,M=p=>HT([N[0]+p[0]*sf,N[1]+p[1]*sf]);
  h.line([[-16,7.5],[-9,13.5],[0,11.5],[4,6.5]].map(M),1.8,mix(s.hcol,W,.42),.3)}
SP.dobie={name:'Espresso',breed:'Doberman',personality:'A big softie in a sleek coat. Keeps watch, then wants a cuddle.',joke:'I am on guard. Please guard me with a blanket.',
  col:'#2B2628',hcol:'#2B2628',light:'#C8743A',dark:'#1D1A22',body:{x:108,y:126,rx:47,ry:22,lop:.04},head:{x:166,y:85,rx:29,ry:25},neck:1,
  legs:{h:-31,f:29,w:8.4,sock:'#C8743A'},ears:'drop',earS:.9,earRound:1,tail:'thin',tsc:1.1,eyes:[5.6,5.2],
  face:{eyes:'open',mouth:'smile',e0:[-.12,-.22],e1:[.4,-.26],nose:[1.62,.12],snout:1,snoutL:1.62,brow:'soft',browCol:'#D9A27A'},
  marks:(h,B,Hd,s)=>tanA(h,B,Hd,s,{dot:3.4})};
SP.corso={name:'Cannoli',breed:'Cane Corso',personality:'A calm, gentle guardian. Keeps an eye on the whole family.',joke:'I am very serious. Except when you scratch my ears.',
  col:'#363133',hcol:'#363133',light:'#57504F',dark:'#1D1A22',body:{x:106,y:132,rx:54,ry:29,sq:1},head:{x:168,y:94,rx:36,ry:31},sqHead:1,
  legs:{h:-33,f:31,w:12.2},ears:'drop',earS:.74,earRound:1,tail:'low',tsc:1.08,eyes:[5,4.6],faceFn:corsoFace,
  face:{eyes:'open',mouth:'smile',e0:[-.16,-.24],e1:[.36,-.28],nose:[1.24,.14],snout:3,snoutL:1.26,snoutD:.66,jowl:1,brow:'soft',browCol:'#CFC6C0',pupil:.66},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,M=maskCol(s);brindle(h,B,Hd,s);
   h.shape([[b.rx*.56,b.ry*.05],[b.rx*.98,-b.ry*.15],[b.rx*.94,b.ry*.8],[b.rx*.6,b.ry*.7]].map(B),s.light,{noline:1});
   h.shape([[-hx*.36,-hy*.4],[hx*.1,-hy*.56],[hx*.64,-hy*.5],[hx*.78,hy*.16],[hx*.12,hy*.36],[-hx*.38,hy*.08]].map(Hd),M,{noline:1,ox:0,oy:0});
   [[-.3,-.78],[.02,-.86]].forEach(q=>h.line([[hx*(q[0]-.12),hy*q[1]],[hx*q[0],hy*(q[1]-.07)],[hx*(q[0]+.12),hy*q[1]]].map(Hd),2.2,lum(s.hcol)<.32?mix(s.hcol,W,.3):PEN,.5))}};
SP.pitbull={name:'Peaches',breed:'Pit Bull',personality:'A wiggly, people-loving goofball. Every stranger is a new best friend.',joke:'My whole back half wags. I cannot stop it.',
  col:'#7E8898',hcol:'#7E8898',light:'#F2EEE6',dark:'#4E5664',body:{x:110,y:142,rx:45,ry:25,lop:.04},head:{x:164,y:103,rx:36,ry:29},neck:1,
  legs:{h:-29,f:27,w:11},ears:'rose',earRound:1,tail:'whip',tsc:.72,eyes:[6.6,6.2],
  face:{eyes:'open',mouth:'grin',grinA:1,e0:[-.22,-.16],e1:[.34,-.2],nose:[1.1,.18],snout:2,snoutL:1.12,snoutD:.66,pupil:.66,brow:'soft'},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=curlCol(s.col);brindle(h,B,Hd,s);
   h.shape([[b.rx*.5,-b.ry*.05],[b.rx*.86,-b.ry*.3],[b.rx*1.02,b.ry*.3],[b.rx*.84,b.ry*.95],[b.rx*.45,b.ry*.85]].map(B),s.light,{noline:1});
   h.line([[b.rx*.3,-b.ry*.6],[b.rx*.44,-b.ry*.15],[b.rx*.34,b.ry*.3]].map(B),2.4,K,.4);h.line([[-b.rx*.46,-b.ry*.62],[-b.rx*.6,-b.ry*.12],[-b.rx*.48,b.ry*.32]].map(B),2.4,K,.4);
   h.shape([[hx*.1,-hy*.96],[hx*.24,-hy*.96],[hx*.32,-hy*.1],[hx*.06,-hy*.1]].map(Hd),s.light,{noline:1});
   h.line([[-hx*.12,-hy*.66],[hx*.02,-hy*.74],[hx*.16,-hy*.66]].map(Hd),2,K,.4)}};
SP.minpin={name:'Jellybean',breed:'Miniature Pinscher',personality:'A tiny, fearless bundle of energy. Prances everywhere.',joke:'I am not small. Everything else is big.',
  col:'#B5522C',hcol:'#B5522C',light:'#DC8A56',dark:'#7A3418',body:{x:117,y:146,rx:32,ry:15,lop:.04},head:{x:157,y:116,rx:24,ry:20},neck:1,
  legs:{h:-20,f:19,w:5.6,sock:'#DC8A56'},ears:'drop',earS:.92,earRound:1,tail:'thin',tsc:.82,eyes:[6.6,6.2],
  face:{eyes:'open',mouth:'smile',e0:[-.16,-.2],e1:[.42,-.24],nose:[1.44,.12],snout:1,snoutL:1.44,pupil:.66,brow:'eager',browCol:'#D9A27A'},
  marks:(h,B,Hd,s)=>tanA(h,B,Hd,s,{dot:2.8})};
/* end v2.12 ART A */
/* v2.12 ART B: lab, malamute, chow, stdpoodle */
/* Their extras (tailFn: the lab's otter tail and the chow's curl; ruffFn: the chow's lion mane; faceFn: the chow's deep-set eyes and blue-black
   tongue) are new spec fields, so no older dog takes those branches. The malamute uses the v2.11 plume, plumeUp and light ruff; the standard
   poodle the v2.5 curls, curly ears, topknot and pom tail on a tall, leggy frame with the v2.11 neck */
function taperB(C,w0,w1,lump){// a tapered tail outline along the centre line C (tail-local px): w0 at the root, w1 at the tip, lump = a fluffy edge
  const n=C.length,lt=[],rt=[];C.forEach((p,i)=>{const t=i/(n-1),a=C[Math.max(0,i-1)],b=C[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],m=Math.hypot(dx,dy)||1,w=(w0+(w1-w0)*t)*(lump===2?(i%3===1?1.34:.78):lump?(i%2?1.16:.92):1);// lump 2: wet, a few pointed locks
   lt.push([p[0]-dy/m*w,p[1]+dx/m*w]);rt.push([p[0]+dy/m*w,p[1]-dx/m*w])});return lt.concat(rt.reverse())}
function otterTail(h,s,L,map,col){// lab: the otter tail, thick and round at the root, tapering to a blunt point, carried level
  const C=dense([[0,0],[-12,-5],[-24,-7],[-35,-6],[-43,-2]],false,4);
  h.shape(map(taperB(C,9.6,2.6)),col,{step:30,amp:.7,w:3.6});h.line(map([[-8,-1],[-19,-4],[-29,-4]]),2,curlCol(col),.3)}
function chowTail(h,s,L,map,col){// chow: a short fat curl lying on the back, a lumpy fluffy edge, two fur strokes
  const C=dense([[0,0],[-5,-16],[0,-30],[13,-37],[26,-34],[30,-24],[23,-18],[16,-22]],false,3.5);
  h.shape(map(s.wet?taperB(C,7.4,3.2,2):taperB(C,9.5,4.2,1)),col,{step:30,amp:.8,w:3.6});
  const K=curlCol(col);h.line(map([[-3,-8],[-3,-20],[5,-31]]),2.2,K,.4);h.line(map([[13,-31],[22,-29],[25,-23]]),2,K,.3)}
function chowRuff(h,s,L,HT){// chow: the lion mane, a big scalloped ring of fur round the whole head and under the chin, fur ticks on the rim
  const hx=s.head.rx,hy=s.head.ry,col=s.hcol,cl=q=>[q[0],Math.min(q[1],GY-1)],cx=-hx*.16,cy=hy*.24,rx=hx*1.4,ry=hy*1.36;
  h.shape((s.wet?wetPts(cx,cy,rx*1.06,ry*1.04,9,.26,.2):scallop(cx,cy,rx,ry,12,.16)).map(HT).map(cl),col,{step:30,amp:.8,w:3.6});h.crayon(rx*.9,ry*.9,q=>HT([cx+q[0],cy+q[1]]),col,5);
  const K=curlCol(col);[200,232,128,150,96].forEach(a=>{const t=a*D2R,x=cx+Math.cos(t)*rx*.86,y=cy+Math.sin(t)*ry*.86,u=[Math.cos(t),Math.sin(t)];
   h.line([[x-u[1]*3-u[0]*4,y+u[0]*3-u[1]*4],[x,y],[x+u[1]*3-u[0]*4,y-u[0]*3-u[1]*4]].map(HT).map(cl),2,K,.3)})}
const CHOW_TG='#4A4E8A',CHOW_TK='#26254A',CHOW_TGD='#7076C4',CHOW_TKD='#3A3C7C';// v2.12 art fix: the D pair is the same blue-black tongue a step lighter, for a black muzzle
function chowFace(h,s,L,HT,a0){// chow: the blue-black tongue (every coat, every mouth), then heavy fur lids over small deep-set eyes
  const bk=lum(s.hcol)<.32,dk=lum(s.hcol)<.52,TG=bk?CHOW_TGD:CHOW_TG,TK=bk?CHOW_TKD:CHOW_TK;// dark: black and blue coats
  for(let i=a0;i<h.acc.length;i++)if(h.acc[i].indexOf('#FF6F9A')>=0||h.acc[i].indexOf('#C9406A')>=0)h.acc[i]=h.acc[i].split('#FF6F9A').join(TG).split('#C9406A').join(TK);
  const f=L.face,m=f.eyes;if(/^(happy|closed|x)$/.test(m))return;
  const hx=s.head.rx,hy=s.head.ry,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],er=s.eyes,K=curlCol(s.hcol),lo=(m==='hope'?.5:m==='down'||m==='sad'?.05:.2)+(dk?.42:0);// a dark coat: the lids sit higher, so more eye shows
  [[e0,er[0]],[e1,er[1]]].forEach(([e,r])=>{const [x,y]=HT([hx*e[0],hy*e[1]]),ly=y-r*lo;
   h.acc.push(`<path d="M${R1(x-r-1.8)} ${R1(ly)}L${R1(x-r-1.8)} ${R1(y-r-3.2)}L${R1(x+r+1.8)} ${R1(y-r-3.2)}L${R1(x+r+1.8)} ${R1(ly)}Z" fill="${s.hcol}"/>`);
   h.line([[x-r-2.4,ly+.6],[x,ly-1],[x+r+2.4,ly+.6]],dk?2.6:3.2,bk?'#EDE6DE':dk?mix(s.hcol,W,.62):INK);h.line([[x-r*1.5,y-r*1.25],[x,y-r*1.9],[x+r*1.5,y-r*1.3]],2.2,K,.4);
   if(dk)h.line([[x-r-1.6,y+r*.7],[x,y+r+1.8],[x+r+1.6,y+r*.7]],1.8,mix(s.hcol,W,bk?.5:.6),.3)})}// and a pale under-eye crease
function spFace(h,s,L,HT,a0){// v2.12 art fix, stdpoodle on a dark coat (the Black starter): the smug half-lids hid the eyes, so the face is drawn again
  if(lum(s.hcol)>=.32)return;const f=L.face;// with open eyes and a raised light brow, then the pale eye rings: it reads in every pose and as a chip
  if(f.eyes==='smug'){h.acc.length=a0;drawFace(h,s,Object.assign({},L,{face:Object.assign({},f,{eyes:'open',brow:'curious'})}),HT)}
  ringA(h,s,L,HT)}
SP.lab={name:'Butter',breed:'Labrador Retriever',personality:'Friendly, food-loving and always ready for a swim.',joke:'Is it dinner? It feels like dinner.',
  col:'#F0CC84',hcol:'#F0CC84',light:'#F9E6B6',dark:'#D9A458',ear:'#D9A458',body:{x:108,y:140,rx:50,ry:27,lop:.03},head:{x:163,y:102,rx:31,ry:28},neck:1,
  legs:{h:-31,f:28,w:10.6},ears:'flop2',earS:.9,tail:'otter',tailFn:otterTail,eyes:[6,5.6],
  face:{eyes:'open',mouth:'tongue',e0:[-.14,-.18],e1:[.36,-.22],nose:[1.42,.12],snout:1,snoutL:1.42,brow:'soft',browCol:'#CFC6C0',look:[[.25,.1],[.25,.1]]},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=curlCol(s.col);
   h.shape([[b.rx*.52,-b.ry*.1],[b.rx*.88,-b.ry*.36],[b.rx*.93,b.ry*.5],[b.rx*.6,b.ry*.84],[b.rx*.4,b.ry*.42]].map(B),mix(s.light,s.col,.35),{noline:1,ox:0,oy:0});
   [[-.62,-.55],[-.2,-.7],[.22,-.62]].forEach(q=>h.line([[b.rx*q[0],b.ry*q[1]],[b.rx*(q[0]+.07),b.ry*(q[1]+.18)]].map(B),2,K,.3));
   h.line([[hx*.02,-hy*.62],[hx*.14,-hy*.52],[hx*.26,-hy*.62]].map(Hd),2,K,.3)}};
SP.malamute={name:'Maple',breed:'Alaskan Malamute',personality:'A big fluffy sled dog who talks back. Loves snow and digging.',joke:'Woo-woo. That means I disagree.',
  col:'#9C9AA4',hcol:'#9C9AA4',light:W,dark:'#5E5A68',body:{x:104,y:134,rx:56,ry:31,lop:.04},head:{x:164,y:96,rx:36,ry:31},
  legs:{h:-33,f:30,w:12.6,sock:W},ears:'prick',earS:.6,earRound:2,tail:'plume',plumeUp:1,tsc:1.14,ruff:1.12,ruffK:'light',eyes:[5.6,5.2],
  face:{eyes:'open',mouth:'tongue',e0:[-.16,-.14],e1:[.38,-.18],nose:[1.3,.12],snout:1,snoutL:1.3,brow:'soft',pupil:.74},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=s.dark;
   h.shape([[-b.rx*.92,-b.ry*.25],[-b.rx*.62,-b.ry*.98],[b.rx*.1,-b.ry*1.04],[b.rx*.66,-b.ry*.82],[b.rx*.5,-b.ry*.3],[-b.rx*.2,-b.ry*.4],[-b.rx*.7,-b.ry*.1]].map(B),mix(K,s.col,.45),{noline:1,ox:0,oy:-1});
   h.shape([[-b.rx*.75,b.ry*.42],[b.rx*.2,b.ry*.5],[b.rx*.82,b.ry*.05],[b.rx*1.02,b.ry*.3],[b.rx*.85,b.ry*.95],[-b.rx*.55,b.ry*.98]].map(B),s.light,{noline:1});
   [-.7,-.42,-.14,.14,.4].forEach((x,i)=>h.line([[b.rx*x,-b.ry*(.95-(i%2)*.04)],[b.rx*(x+.05),-b.ry*.62]].map(B),2.2,mix(K,s.col,.2),.4));
   h.shape([[-hx*.82,-hy*.42],[-hx*.42,-hy*.88],[hx*.12,-hy*1.0],[hx*.66,-hy*.78],[hx*.82,-hy*.36],[hx*.2,-hy*.5],[-hx*.4,-hy*.38]].map(Hd),mix(K,s.hcol,.4),{noline:1,ox:0,oy:0});
   h.shape([[-hx*.94,hy*.12],[-hx*.52,hy*.06],[-hx*.32,hy*.2],[hx*.0,hy*.06],[hx*.04,-hy*.32],[hx*.08,-hy*.9],[hx*.2,-hy*.9],[hx*.24,-hy*.32],[hx*.3,hy*.02],[hx*.6,hy*.06],[hx*.94,hy*.0],[hx*.96,hy*.5],[hx*.75,hy*.86],[hx*.1,hy*.98],[-hx*.62,hy*.82],[-hx*.9,hy*.5]].map(Hd),s.light,{noline:1,ox:0,oy:0})}};
SP.chow={name:'Bao',breed:'Chow Chow',personality:'A dignified fluffy lion with a blue tongue. Picks friends carefully.',joke:'I am not grumpy. This is just my face.',
  col:'#D2894A',hcol:'#D2894A',light:'#EBB477',dark:'#A9652E',fluff:1,hfluff:1,body:{x:110,y:146,rx:43,ry:27},head:{x:160,y:106,rx:30,ry:27},
  legs:{h:-27,f:25,w:11.8},ears:'prick',earS:.72,earRound:2,tail:'chowcurl',tailFn:chowTail,ruff:1,ruffFn:chowRuff,faceFn:chowFace,eyes:[4.4,4.2],
  face:{eyes:'open',mouth:'tongue',e0:[-.12,-.14],e1:[.38,-.18],nose:[1.2,.22],snout:2,snoutL:1.22,snoutD:.66,pupil:.8},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=curlCol(s.col);h.crayon(b.rx,b.ry,B,s.dark,7);
   [[-.6,-.42],[-.08,-.64],[.4,-.4],[-.7,.3],[.12,.45]].forEach(q=>{const x=q[0]*b.rx,y=q[1]*b.ry;h.line([[x-5,y-2],[x-2,y+3],[x+1,y-2],[x+4,y+3]].map(B),2.2,K,.4)});
   h.shape(circ(hx*.8,hy*.36,hx*.36,hy*.26,9).map(Hd),mix(s.light,s.hcol,.3),{noline:1,ox:0,oy:0})}};
SP.stdpoodle={name:'Madeleine',breed:'Standard Poodle',personality:'A tall, clever, curly athlete. Learns tricks before you teach them.',joke:'I am the big poodle. The small one is my cousin.',
  col:'#2B2430',hcol:'#2B2430',light:'#4A3F4E',dark:'#1D1A22',fluff:1,hfluff:1,body:{x:106,y:118,rx:44,ry:24},head:{x:160,y:74,rx:25,ry:24},neck:1,
  legs:{h:-28,f:25,w:7,pom:1},ears:'flopL',curlEar:1,topknot:1,tail:'pom',tsc:1.25,eyes:[5.6,5],faceFn:spFace,
  face:{eyes:'smug',mouth:'smile',e0:[-.1,-.16],e1:[.34,-.2],nose:[1.72,.12],snout:1,snoutL:1.72,tilt:-10,browCol:'#CFC6C0'},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,c=curlCol(s.col),c2=curlCol(s.hcol);
   [[-.66,-.34],[-.1,-.56],[.45,-.42],[.7,.05],[-.36,.28],[.24,.36],[-.84,.02],[.0,-.06]].forEach((q,i)=>h.line(spiral(b.rx*q[0],b.ry*q[1],.8,5,1.1,8,i*1.3).map(B),2.6,c,.7));
   [[-.52,-.42],[-.08,-.66],[-.62,.12],[-.28,.42]].forEach((q,i)=>h.line(spiral(hx*q[0],hy*q[1],.5,3.8,1.25,8,i*1.7).map(Hd),2,c2,.3))}};
/* end v2.12 ART B */
/* v2.12 ART C: schnauzer, westie, yorkie */
/* Their extras: tail 'carrot' (westie) and tanHead (yorkie: head and ears in the coat's tan, see coated) are new spec fields;
   the beard, the bushy brows, the fringe skirt, the chrysanthemum face and the topknot bow are drawn by their own marks */
const ccl=q=>[q[0],Math.min(q[1],GY-1)];// keep hanging hair off the ground (NaN stays NaN)
function ccFringe(h,P,col,n,amp){// a fringe of hair: P = closed outline (canvas px), filled, inked, a few strands inside
  h.shape(P,col,{step:30,amp:amp||.9,w:3.2});const K=curlCol(col),c=P.reduce((a,q)=>[a[0]+q[0]/P.length,a[1]+q[1]/P.length],[0,0]);
  for(let i=0;i<n;i++){const q=P[1+Math.floor(i*(P.length-2)/n)];if(q)h.line([[c[0]+(q[0]-c[0])*.2,c[1]+(q[1]-c[1])*.2],[c[0]+(q[0]-c[0])*.72,c[1]+(q[1]-c[1])*.72]],1.8,K,.3)}}
SP.schnauzer={name:'Muesli',breed:'Miniature Schnauzer',personality:'Bearded, bossy and very alert. Reports every leaf.',joke:'The beard is for wisdom. And soup.',
  col:'#9A9AA3',hcol:'#9A9AA3',light:'#E6E4E0',dark:'#4A4652',ear:'#4A4652',body:{x:112,y:146,rx:37,ry:19,sq:1},head:{x:160,y:108,rx:26,ry:22},neck:1,sqHead:1,
  legs:{h:-25,f:24,w:7.2,col:'#E6E4E0'},ears:'semi',earS:.78,earRound:1,tail:'sickle',tsc:.85,eyes:[5,4.6],
  face:{eyes:'open',mouth:'smile',e0:[-.1,-.06],e1:[.36,-.1],nose:[1.5,.08],snout:1,snoutL:1.5,pupil:.72},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,f=s.face,sl=f.snoutL||1.5,K=s.dark;
   h.crayon(b.rx,b.ry,B,K,8);// salt and pepper: dark ticks on the back, a silver fringe skirt under the belly
   [[-.72,-.5],[-.46,-.78],[-.18,-.56],[.1,-.8],[.36,-.58],[-.6,-.12],[-.05,-.22]].forEach(q=>h.line([[b.rx*q[0],b.ry*q[1]],[b.rx*(q[0]+.05),b.ry*(q[1]+.24)]].map(B),2.2,K,.4));
   const sk=[[b.rx*1.02,-b.ry*.15],[b.rx*1.0,b.ry*.55]];for(let i=0;i<=10;i++)sk.push([b.rx*(.9-1.62*i/10),b.ry*(i%2?1.2:1.0)]);
   const P=sk.concat([[-b.rx*.74,b.ry*.5],[b.rx*.1,b.ry*.42],[b.rx*.62,b.ry*.12]]).map(B).map(ccl);
   if(!isNaN(P[0][0])){h.shape(P,s.light,{noline:1,ox:0,oy:0,sc:1,own:1});h.line(P.slice(1,13),h.LW*.85,INK,.8);[3,6,9].forEach(i=>h.line([[P[i][0],P[i][1]-7],P[i]],1.8,curlCol(s.light),.3))}
   // the beard under the long muzzle (the muzzle box is drawn over its top) and the bushy brows
   ccFringe(h,[[hx*.36,hy*.3],[hx*(sl+.04),hy*.24],[hx*(sl+.18),hy*.7],[hx*(sl+.08),hy*1.3],[hx*(sl-.08),hy*1.04],[hx*(sl-.24),hy*1.42],[hx*(sl-.42),hy*1.1],[hx*(sl-.6),hy*1.38],[hx*(sl-.78),hy*1.04],[hx*.42,hy*1.14],[hx*.22,hy*.66]].map(Hd).map(ccl),s.light,5);
   const er=s.eyes;[f.e0||[-.1,-.04],f.e1||[.42,-.1]].forEach((e,i)=>{const x=hx*e[0],y=hy*e[1],r=er[i]*1.15;
    ccFringe(h,[[x-r*1.5,y-r*1.0],[x-r*1.8,y-r*1.85],[x-r*.8,y-r*1.6],[x-r*.4,y-r*2.3],[x+r*.45,y-r*1.7],[x+r*1.2,y-r*2.2],[x+r*1.9,y-r*1.4],[x+r*3.0,y-r*1.1],[x+r*1.2,y-r*.9]].map(Hd),s.light,0,.6)})}};
SP.westie={name:'Shortbread',breed:'West Highland White Terrier',personality:'A cheerful little white terrier. Digs first, asks later.',joke:'I was white this morning. I promise.',
  col:'#FBF8F1',hcol:'#FBF8F1',light:W,dark:'#E3D9C8',fluff:1,hfluff:1,body:{x:114,y:147,rx:37,ry:23},head:{x:158,y:110,rx:31,ry:29},
  legs:{h:-24,f:22,w:7.8},ears:'prick',earS:.92,earRound:1,earIn:1,tail:'carrot',eyes:[5.4,5],
  face:{eyes:'open',mouth:'smile',e0:[-.12,-.12],e1:[.34,-.16],nose:[.68,.22],pupil:.8},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=mix(s.dark,PEN,.3);h.crayon(b.rx,b.ry,B,mix(s.dark,PEN,.35),7);
   [[-.6,-.36],[-.1,-.6],[.45,-.34],[-.7,.34],[.15,.46]].forEach(q=>{const x=q[0]*b.rx,y=q[1]*b.ry;h.line([[x-5,y-2],[x-2,y+3],[x+1,y-2],[x+4,y+3]].map(B),2.2,K,.4)});
   // the chrysanthemum: little tufts all round the face, pointing out from the middle
   [-150,-120,-90,-60,-30,0,150,120,90].forEach((a,i)=>{const c=Math.cos(a*D2R),n=Math.sin(a*D2R),r0=.62+(i%2)*.06;
    h.line([[hx*.12+c*hx*r0,hy*.05+n*hy*r0],[hx*.12+c*hx*(r0+.24)+n*2,hy*.05+n*hy*(r0+.24)-c*2],[hx*.12+c*hx*(r0+.3),hy*.05+n*hy*(r0+.3)]].map(Hd),2,K,.3)});
   h.line([[hx*.3,hy*.5],[hx*.5,hy*.66],[hx*.72,hy*.58]].map(Hd),2,K,.3)}};
SP.yorkie={name:'Toffee',breed:'Yorkshire Terrier',personality:'A tiny terrier with silky hair and a giant attitude.',joke:'I am in charge here. Please lift me onto the sofa.',
  col:'#617389',hcol:'#D9A35C',light:'#D9A35C',dark:'#3E4A5E',ear:'#D9A35C',tanHead:1,body:{x:118,y:151,rx:31,ry:16,lop:.04},head:{x:156,y:118,rx:24,ry:22},neck:1,// v2.12 neck fix (owner): the neck tube in every pose, the head floated over the body (pitbull, lab, schnauzer too, in their head-up poses)
  legs:{h:-20,f:19,w:5.4,col:'#D9A35C'},ears:'prick',earS:.84,earRound:1,tail:'sickle',tsc:.9,eyes:[5,4.6],// v2.12 art fix: smaller eyes and pupils (the head looked owl-like)
  face:{eyes:'open',mouth:'smile',e0:[-.2,-.12],e1:[.38,-.16],nose:[.88,.26],pupil:.6,brow:'curious'},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=mix(s.col,W,.32);
   hangHair(h,B,s,b.ry*1.4);// the long silky steel coat, parted along the back
   h.line([[-b.rx*.88,-b.ry*.5],[-b.rx*.35,-b.ry*.86],[b.rx*.25,-b.ry*.86],[b.rx*.6,-b.ry*.62]].map(B),2,K,.3);
   [[-.62,-.5],[-.22,-.62],[.2,-.56]].forEach(q=>h.line([[b.rx*q[0],b.ry*q[1]],[b.rx*(q[0]-.05),b.ry*(q[1]+.5)],[b.rx*(q[0]+.02),b.ry*(q[1]+.95)]].map(B),2,K,.4));
   // silky tan strands on the cheeks, the topknot and its little bow
   const T2=curlCol(s.hcol);[[-.5,.2,-.56,.7],[-.2,.5,-.2,.9],[.3,.62,.36,.98]].forEach(q=>h.line([[hx*q[0],hy*q[1]],[hx*(q[0]+q[2])/2+1.5,hy*(q[1]+q[3])/2],[hx*q[2],hy*q[3]]].map(Hd),2,T2,.3));
   h.shape(furR(s.wet,-hx*.1,-hy*.88,hx*.26,hy*.2,6,.22).map(Hd),s.hcol,{step:30,amp:.6,w:3});
   const k=[-hx*.1,-hy*1.06],BW='#E8325A';[-1,1].forEach(sd=>h.shape([k,[k[0]+sd*hx*.3,k[1]-hy*.17],[k[0]+sd*hx*.33,k[1]+hy*.13]].map(Hd),BW,{w:2.4,step:30,ox:0,oy:0,sc:1,amp:.4,closed:1}));
   {const c=Hd(k);h.dot(c[0],c[1],2.2,2,'#B81E44')}}};
/* end v2.12 ART C */
/* v2.12 ART D: bichon, maltese, shihtzu */
/* Their extras: topknot 3 (a gathered tuft with a little bow, drawn by knotD), the cotton puffs (puffD), the floor-length coat
   (hairD, in their own marks) and face hair. topknot 3 is a new value, so drawTopknot and dogHead take it for these three only */
function puffD(h,M,rx,ry,a0,a1,n,z,col,ink){// cotton bumps round an ellipse (local px, mapped by M): each a filled lump that covers the old outline, then its outer arc
  if(isNaN(M([0,0])[0]))return;
  for(let i=0;i<n;i++){const a=(a0+(a1-a0)*(n>1?i/(n-1):.5))*D2R,k=(h.wet?.95:1)+(i%2?.04:-.03),c=[Math.cos(a)*rx*k,Math.sin(a)*ry*k],zz=z*(i%3===1?1.12:.94)*(h.wet?.66:1);// wet: the cotton goes flat
   h.shape(circ(c[0],c[1],zz,zz,9).map(M),col,{noline:1,ox:0,oy:0,sc:1,own:1});
   const arc=[];for(let j=-3;j<=3;j++){const t=a+j*.42;arc.push([c[0]+Math.cos(t)*zz,c[1]+Math.sin(t)*zz])}h.line(arc.map(M),ink||3.3,INK,.7)}}
function hairD(h,B,s,col,o){// the floor-length coat, parted along the spine: silky hair falls from the sides of the body (o.up: how high it starts) to just above the ground (o.len: the longest it hangs, so a jump lifts it), a flared ragged hem
  const b=s.body,c=B([0,0]);if(isNaN(c[0]))return;const n=30,R=[],ok=[],e=B([10,0]),tilt=Math.max(0,-Math.atan2(e[1]-c[1],e[0]-c[0])/D2R-12)*.5;// sitting up: the hair also falls from the chest
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2,p=B([Math.cos(a)*b.rx*.93,Math.sin(a)*b.ry*.6]);R.push(p);ok.push(p[1]>c[1]-b.ry*o.up*.6-tilt)}
  const st=ok.findIndex((v,i)=>v&&!ok[(i+n-1)%n]);if(st<0)return;const top=[];for(let i=0;i<n&&ok[(st+i)%n];i++)top.push(R[(st+i)%n]);
  if(top.length<3)return;
  const fl=GY-(o.gap||4),cx=(top[0][0]+top[top.length-1][0])/2,span=Math.abs(top[top.length-1][0]-top[0][0])||1;
  const yb=Math.min(fl,Math.max(...top.map(p=>p[1]))+b.ry*o.len),wt=s.wet,bot=top.map((p,i)=>{let y=Math.max(p[1]+4,Math.min(GY-1,wt?(i%3===1?yb+2:p[1]+(yb-p[1])*(i%3===0?.5:.7)):yb+(i%3===1?2.5:i%3===2?-1:0)));// wet: stuck-together strands, notched up between them
   if(s.expecting){const d=(p[0]-cx)/(span*.34);if(Math.abs(d)<1)y=Math.min(GY-1,y+4*Math.sqrt(1-d*d))}
   const f=Math.min(1,(y-p[1])/(b.ry*1.5));return[p[0]+(p[0]-cx)*(wt?.06:.18)*f+(wt?(i%3===1?.6:-.3):(i%2?1.6:-1.2)),y]});
  h.shape(top.concat(bot.slice().reverse()),col,{noline:1,ox:0,oy:0,sc:1,own:1});
  h.line([top[0]].concat(bot,[top[top.length-1]]),h.LW*.9,INK,1);
  const K=curlCol(col);top.forEach((t,i)=>{if(i%3!==1||i>top.length-3)return;const p=bot[i];if(p[1]-t[1]<10)return;h.line([[t[0],t[1]+4],[t[0]+(p[0]-t[0])*.5+(i%2?1.5:-1.5),t[1]+(p[1]-t[1])*.5],[p[0],p[1]-4]],2,K,.35)});
  if(s.expecting){const y=Math.min(GY-8,c[1]+b.ry*.3),A=[];// the round tummy shows as a low curve through the coat
   for(let i=0;i<=10;i++){const t=Math.PI*(.12+i/10*.76);A.push([cx+Math.cos(t)*span*.3,Math.min(GY-2,y+Math.sin(t)*b.ry*.85)])}h.line(A,h.LW*.75,INK,1)}}
function knotD(h,s,HT){// a little tuft gathered on the crown with a pink bow, the hair fanning out above it and flopping back (behind the skull outline, so only the top shows)
  const hx=s.head.rx,hy=s.head.ry,k=s.knotK||1,c=s.hcol,bw=Math.max(5,hx*.26),Y=-hy*(s.hfluff?1.2:1.1);
  const F=[[-hx*.3,-hy*.6],[-hx*.13,Y],[-hx*.38,Y-hy*.16*k],[-hx*.58,Y-hy*.34*k],[-hx*.44,Y-hy*.5*k],[-hx*.24,Y-hy*.64*k],[-hx*.02,Y-hy*.68*k],[hx*.18,Y-hy*.58*k],[hx*.3,Y-hy*.38*k],[hx*.16,Y-hy*.14*k],[hx*.11,Y],[hx*.28,-hy*.6]];
  h.shape(F.map(HT),c,{step:30,amp:.8,w:3.6});
  const K=curlCol(c);[[-.04,-.3,-.42],[.04,-.06,-.56],[.08,.18,-.44]].forEach(q=>h.line([[hx*q[0],Y-2],[hx*(q[0]+q[1])/2,Y+hy*q[2]*k*.55],[hx*q[1],Y+hy*q[2]*k]].map(HT),2,K,.3));
  const m=[0,Y+1],lp=sd=>[[0,0],[sd*bw*.5,-bw*.6],[sd*bw*1.2,-bw*.62],[sd*bw*1.15,bw*.52],[sd*bw*.5,bw*.42]];
  [-1,1].forEach(sd=>h.shape(lp(sd).map(q=>HT([m[0]+q[0],m[1]+q[1]])),'#FF6FA8',{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4}));
  const kc=HT(m);h.shape(circ(kc[0],kc[1],bw*.36,bw*.4,7),'#E8407E',{w:2.2,ox:0,oy:0,sc:1,closed:1,amp:.3})}
SP.bichon={name:'Meringue',breed:'Bichon Frise',personality:'A happy cotton ball who bounces everywhere.',joke:'Is this a haircut or a cloud? Yes.',
  col:'#FDFBF6',hcol:'#FDFBF6',light:W,dark:'#E4DCCD',fluff:1,hfluff:1,body:{x:114,y:146,rx:35,ry:27},head:{x:157,y:108,rx:31,ry:29},
  legs:{h:-20,f:19,w:7.4},ears:'flop2',earS:.78,earRound:3,tail:'plume',plumeUp:1,tsc:.78,eyes:[6.6,6.2],
  face:{eyes:'open',mouth:'smile',e0:[-.1,-.02],e1:[.4,-.06],nose:[.74,.3],pupil:.84,sweet:1},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K2=mix(s.dark,s.col,.15);h.crayon(b.rx,b.ry,B,mix(s.dark,PEN,.35),7);
   puffD(h,B,b.rx*.98,b.ry*.98,-160,-20,6,b.ry*.3,s.col);
   [[-.6,-.3],[-.15,-.5],[.35,-.35],[-.55,.3],[.1,.38],[.6,.2]].forEach((q,i)=>h.line(spiral(b.rx*q[0],b.ry*q[1],.5,2.6,1.1,7,i*1.4).map(B),1.8,K2,.3));
   puffD(h,Hd,hx*.98,hy*.98,-205,-15,7,hx*.27,s.hcol);
   [[-.5,-.48],[-.12,-.7],[.3,-.6]].forEach((q,i)=>h.line(spiral(hx*q[0],hy*q[1],.5,2.4,1.1,7,i*2).map(Hd),1.6,K2,.3))}};
SP.maltese={name:'Marshmallow',breed:'Maltese',personality:'A gentle little lap dog in a long white coat.',joke:'I do not walk. I float, elegantly.',
  col:'#FFFDF8',hcol:'#FFFDF8',light:W,dark:'#E6DDCE',body:{x:114,y:146,rx:37,ry:19,lop:.03},head:{x:159,y:112,rx:27,ry:25},
  legs:{h:-25,f:23,w:5.6},ears:'curtain',earS:.76,earRound:1,earSwing:62,topknot:3,knotK:.7,tail:'plume',plumeUp:1,tsc:.74,eyes:[6.4,6],
  face:{eyes:'open',mouth:'smile',e0:[-.1,-.08],e1:[.42,-.12],nose:[.94,.26],pupil:.8},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=mix(s.dark,PEN,.35);h.crayon(b.rx,b.ry,B,mix(s.dark,PEN,.35),7);hairD(h,B,s,s.col,{up:.3,len:1.25});
   [[-.75,-.5],[-.35,-.72],[.05,-.74],[.45,-.6]].forEach(q=>h.line([[b.rx*q[0],b.ry*q[1]],[b.rx*(q[0]-.04),b.ry*(q[1]+.5)],[b.rx*(q[0]+.01),b.ry*(q[1]+1.0)]].map(B),2,K,.4));
   [[.62,.5,.5,.86],[.82,.42,.86,.8]].forEach(q=>h.line([[hx*q[0],hy*q[1]],[hx*(q[0]+q[2])/2-1,hy*(q[1]+q[3])/2+1],[hx*q[2],hy*q[3]]].map(Hd),1.8,K,.3));
   h.line([[-hx*.5,-hy*.66],[-hx*.2,-hy*.86],[hx*.12,-hy*.8]].map(Hd),1.8,K,.3)}};
SP.shihtzu={name:'Wonton',breed:'Shih Tzu',personality:'A relaxed lap dog with a top-knot and big opinions about naps.',joke:'Top-knot up. Nap time down.',
  col:'#E0A458',hcol:'#E0A458',light:'#FFFBF2',dark:'#9A6430',hfluff:1,body:{x:114,y:147,rx:37,ry:21,lop:.03},head:{x:159,y:110,rx:29,ry:27},
  legs:{h:-25,f:23,w:6.4},ears:'curtain',earS:.74,earRound:1,earSwing:62,topknot:3,tail:'plume',plumeUp:1,tsc:.8,eyes:[7.8,7.6],
  face:{eyes:'open',mouth:'smile',e0:[-.2,-.14],e1:[.38,-.18],nose:[.52,.22],pupil:.66,brow:'soft'},
  marks:(h,B,Hd,s)=>{const b=s.body,hx=s.head.rx,hy=s.head.ry,K=curlCol(s.col),KL=curlCol(s.light);brindle(h,B,Hd,s);
   h.shape([[b.rx*.38,-b.ry*.1],[b.rx*.88,-b.ry*.5],[b.rx*1.02,b.ry*.3],[b.rx*.7,b.ry*.95],[b.rx*.3,b.ry*.7]].map(B),s.light,{noline:1});
   hairD(h,B,s,s.light,{up:.02,len:1.2});
   [[-.7,-.62],[-.3,-.8],[.1,-.76]].forEach(q=>h.line([[b.rx*q[0],b.ry*q[1]],[b.rx*(q[0]-.05),b.ry*(q[1]+.45)],[b.rx*q[0],b.ry*(q[1]+.9)]].map(B),2.2,K,.4));
   h.shape([[hx*.02,-hy*.98],[hx*.24,-hy*.98],[hx*.3,-hy*.25],[hx*.06,-hy*.25]].map(Hd),s.light,{noline:1,ox:0,oy:0});
   h.shape([[-hx*.12,hy*.28],[hx*.1,-hy*.06],[hx*.6,-hy*.04],[hx*.98,hy*.2],[hx*.9,hy*.78],[hx*.62,hy*1.3],[hx*.3,hy*1.42],[0,hy*1.24],[-hx*.2,hy*.8]].map(Hd),s.light,{w:3.2,step:30,amp:.8});
   [[.18,.62,.12,1.2],[.42,.7,.4,1.32],[.66,.62,.7,1.12]].forEach(q=>h.line([[hx*q[0],hy*q[1]],[hx*(q[0]+q[2])/2-1,hy*(q[1]+q[3])/2],[hx*q[2],hy*q[3]]].map(Hd),1.8,KL,.3));
   [[-.42,-.62],[-.14,-.8]].forEach((q,i)=>h.line([[hx*q[0],hy*q[1]],[hx*(q[0]-.1),hy*(q[1]+.3)]].map(Hd),2,K,.3))}};
/* end v2.12 ART D */
/* v2.21 ART A: dalmatian, bernese, aussie */
/* Natural ears and tails (no cropping, no docking: the Aussie gets its full tail). Their extras are new spec fields, so no older dog takes these
   branches: coatFn (a breed's own coat pass at the end of coated(): the aussie's merle marbling and white trim), earFn (marks inside an ear: the
   dalmatian's spots), legFn (marks on a leg: the dalmatian's spots), legs.toe (white feet: the bernese, the aussie's trim), bib (the white of the chest:
   the bernese ruff and muzzle, through ART B's face.snoutK; the aussie's collar), EARS_A.tri and EARS_A.dropD (the bernese's broad triangle ear, the
   dalmatian's high drop ear; their pivots sit inside the skull), faceFn (the aussie's pale eye creases on a dark head without copper), tail 'dal' (drawn by
   its tailFn), headShut (art fix: the head outline drawn closed, no crayon gap; on the white dalmatian a gap left a loose stub over the muzzle). The dalmatian uses ART B's ownWhite (its white ground: coat.white lays no white patches over the spots). Every colour fill stays inside its own outline: the marks are laid while
   the body, head, ear or tail part is open (h.part), so a spot or patch that reaches the edge is pinned inside the line */
EARS_A.tri=function(pr,E){// v2.21 bernese: a broad, soft triangle set high on the skull, hanging flat by the cheek, the tip rounded
  E.push({pts:pr([[-.3,-.98],[-.96,-.84],[-1.16,-.3],[-1.04,.16],[-.84,.12],[-.62,-.5]]),pivot:pr([[-.52,-.72]])[0],side:-1,flop:1});
  E.push({pts:pr([[.1,-1.02],[.66,-.98],[.84,-.6],[.74,-.2],[.56,-.26],[.34,-.72]]),pivot:pr([[.32,-.8]])[0],side:1,flop:1})};// the pivots sit inside the skull, so a turned or shrunk ear (the Astronaut Helmet) keeps its root on the head
EARS_A.dropD=function(pr,E){// v2.21 dalmatian: the v2.12 drop ear set high, its pivots inside the skull (a puppy's ear lying flat under the Astronaut Helmet stays on the head)
  E.push({pts:pr([[-.4,-.94],[-1.0,-.88],[-1.24,-.36],[-1.16,.32],[-.98,.42],[-.8,-.26]]),pivot:pr([[-.5,-.62]])[0],side:-1,flop:1,fold:[0,1]});
  E.push({pts:pr([[.04,-1.0],[.56,-1.02],[.8,-.72],[.74,-.4],[.58,-.42],[.3,-.74]]),pivot:pr([[.28,-.8]])[0],side:1,flop:1,fold:[0,1]})};
EARS_A.roseA=function(pr,E){// v2.21 art fix, aussie: a high-set triangle ear lifted clear of the skull, the top third folded forward (half-folded rose), behind the head like the collie's
  E.push({pts:pr([[-.82,-.46],[-.72,-1.12],[-.54,-1.36],[-.12,-1.2],[-.34,-1.1],[-.1,-.84]]),pivot:pr([[-.44,-.72]])[0],side:-1,fold:[1,4]});
  E.push({pts:pr([[.04,-.9],[.16,-1.18],[.36,-1.4],[.82,-1.14],[.56,-1.1],[.74,-.42]]),pivot:pr([[.42,-.72]])[0],side:1,fold:[1,4]})};
function aussieEar(h,s,e,p,HT){// the ear's own pale crayon rim just inside its outline (up the back edge, over the fold), so a dark ear reads on a dark head even at chip size
  if(!e.fold)return;let cx=0,cy=0;p.forEach(q=>{cx+=q[0]/p.length;cy+=q[1]/p.length});const c=s.ear||s.hcol,in_=q=>{const dx=cx-q[0],dy=cy-q[1],m=Math.hypot(dx,dy)||1,d=Math.min(2.6,m*.4);return[q[0]+dx/m*d,q[1]+dy/m*d]};
  h.line([p[0],p[1],p[2],p[3]].map(in_).map(HT),1.9,mix(c,W,lum(c)<.32?.5:.4),.3)}
const spotA=(h,M,x,y,r,col)=>h.shape(circ(x,y,r,r*.9,8,.16).map(M),col,{noline:1,ox:0,oy:0,famp:.5});// one round crayon spot, kept inside the open part
// dalmatian spots: [x, y] of the body or head (x rx, y ry), r in rx. A puppy has the first few only, a newborn none (real: they are born white, the spots come in from two weeks)
const DAL_B=[[-.62,-.42,.1],[-.2,-.12,.13],[.28,-.5,.1],[-.5,.3,.12],[.2,.36,.11],[.58,-.08,.08],[-.86,.1,.08],[.02,-.7,.08],[-.34,-.74,.07],[.5,.62,.07],[-.1,.68,.08],[.78,.3,.07],[-.72,.66,.06],[.66,-.56,.06],[.04,.14,.06],[-.94,-.36,.05]];
const DAL_H=[[-.56,-.44,.13],[-.66,.24,.1],[.0,-.8,.08],[.1,.34,.085],[-.24,.6,.08],[.66,-.62,.07],[-.3,-.86,.06],[.18,-.6,.065]];// v2.21 art fix: a cheek spot (a puppy has it too) and a forehead spot, so the face is spotty, not only the back of the skull
function dalMarks(h,B,Hd,s){const b=s.body,hx=s.head.rx,hy=s.head.ry,K=s.dark,n=s.pup===2?0:s.pup?6:DAL_B.length,m=s.pup===2?0:s.pup?4:DAL_H.length,z=s.pup?.86:1;
  DAL_B.slice(0,n).forEach(q=>spotA(h,B,b.rx*q[0],b.ry*q[1],b.rx*q[2]*z,K));DAL_H.slice(0,m).forEach(q=>spotA(h,Hd,hx*q[0],hy*q[1],hx*q[2]*z,K))}
function dalEar(h,s,e,p,HT){if(s.pup===2)return;// v2.21 art fix: a big dark spot over the tip of each ear and a small one by the crease (a puppy: the tip spot), pinned inside the ear's own outline,
  // so the white ear reads on the white head even at chip size
  let cx=0,cy=0;p.forEach(q=>{cx+=q[0]/p.length;cy+=q[1]/p.length});const K=s.dark,hx=s.head.rx,lp=(a,t)=>[cx+(a[0]-cx)*t,cy+(a[1]-cy)*t],tip=[(p[3][0]+p[4][0])/2,(p[3][1]+p[4][1])/2];
  h.part(1);{const c=lp(tip,1.05);spotA(h,HT,c[0],c[1],hx*(s.pup?.4:.46),K)}if(!s.pup){const c=lp(p[1],.42);spotA(h,HT,c[0],c[1],hx*.1,K)}h.part(0)}
function dalTail(h,s,L,map,col){// dalmatian: a long tail, thick at the root and tapering to a fine point, curved a little up; a few spots
  const C=dense([[0,0],[-11,-8],[-18,-21],[-20,-35],[-15,-48]],false,4),M=map(C),n=M.length,on=q=>q[1]>=GY-2.01;let P=M;
  if(M.filter(on).length*3>=n){// the tail lies on the ground (sit, ...): map() flattens it onto the ground line, so lay it there with its own width, the lower edge on the ground
   const r=map([[0,0],[4,0],[0,-4]]),k=Math.max(Math.hypot(r[1][0]-r[0][0],r[1][1]-r[0][1]),Math.hypot(r[2][0]-r[0][0],r[2][1]-r[0][1]))/4||1;
   P=M.map((q,i)=>on(q)?[q[0],GY-2-(5.6+(1.7-5.6)*i/(n-1))*k]:q);h.shape(taperB(P,5.6*k,1.7*k).map(q=>[q[0],Math.min(q[1],GY-2)]),col,{step:30,amp:.6,w:3.4})}
  else h.shape(map(taperB(C,5.6,1.7)),col,{step:30,amp:.6,w:3.4});
  if(s.pup===2)return;h.part(1);[[.3,2.3],[.62,1.8]].slice(0,s.pup?1:2).forEach(([t,r])=>{const p=P[Math.round(t*(n-1))];h.shape(circ(p[0],p[1],r,r*.9,7),s.dark,{noline:1,ox:0,oy:0,famp:.3})});h.part(0)}
function dalLeg(h,s,L,l){if(s.pup===2||!l.foot||l.raised&&!l.mid)return;// a spot or two down the leg (a puppy: one), small enough to sit inside the leg's own fill
  const C=[l.hip,l.mid||[(l.hip[0]+l.foot[0])/2+1,(l.hip[1]+l.foot[1])/2],l.foot],at=t=>t<.5?[C[0][0]+(C[1][0]-C[0][0])*t*2,C[0][1]+(C[1][1]-C[0][1])*t*2]:[C[1][0]+(C[2][0]-C[1][0])*(t-.5)*2,C[1][1]+(C[2][1]-C[1][1])*(t-.5)*2],r=l.w*.3;
  [[.42,1],[.72,.8]].slice(0,s.pup?1:(l.i%2?1:2)).forEach(([t,k])=>{const p=at(t+(l.i%2)*.08);h.acc.push('<ellipse cx="'+R1(p[0]+h.J(.4))+'" cy="'+R1(p[1])+'" rx="'+R1(r*k)+'" ry="'+R1(r*k*1.15)+'" fill="'+(l.near?s.dark:mix(s.dark,PEN,.2))+'"/>')})}
SP.dalmatian={name:'Sprinkles',breed:'Dalmatian',personality:'A spotty athlete who loves a long run and a crowd to show off to.',joke:'Yes, I have counted my spots. I lost count. Twice.',
  col:'#FBF8F2',hcol:'#FBF8F2',light:'#FFFFFF',dark:'#1D1A22',ownWhite:()=>{},body:{x:108,y:127,rx:48,ry:24,lop:.05},head:{x:166,y:87,rx:28,ry:24},neck:1,
  legs:{h:-31,f:29,w:8.4},legFn:dalLeg,headShut:1,ears:'dropD',earS:1,earRound:1,earFn:dalEar,tail:'dal',tailFn:dalTail,tsc:1.08,eyes:[5.8,5.4],
  face:{eyes:'open',mouth:'tongue',e0:[-.12,-.22],e1:[.4,-.26],nose:[1.6,.12],snout:1,snoutL:1.6,brow:'soft'},
  marks:dalMarks};
function berneseMarks(h,B,Hd,s){// tricolour: rust (light) on the cheeks, over the eyes, the forelegs and under the tail; always white: the blaze, the chest cross (and the ruff, feet and tail tip)
  const b=s.body,hx=s.head.rx,hy=s.head.ry,f=s.face,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],K=s.light,Wb=s.bib||W,F=mix(s.col,W,.3);
  h.shape([[b.rx*.46,b.ry*.28],[b.rx*.72,b.ry*.36],[b.rx*.86,b.ry*.92],[b.rx*.44,b.ry*.95]].map(B),K,{noline:1,ox:0,oy:0});
  h.shape(circ(-b.rx*.86,b.ry*.12,b.rx*.1,b.ry*.28,7).map(B),K,{noline:1,ox:0,oy:0});
  h.shape([[b.rx*.62,-b.ry*.58],[b.rx*.88,-b.ry*.5],[b.rx*1.02,b.ry*.1],[b.rx*.9,b.ry*.7],[b.rx*.74,b.ry*.62],[b.rx*.7,b.ry*.12]].map(B),Wb,{noline:1,ox:0,oy:0});
  [[-.62,-.5],[-.14,-.66],[.3,-.46],[-.66,.32],[-.08,.36]].forEach(q=>{const x=q[0]*b.rx,y=q[1]*b.ry;h.line([[x-5,y-2],[x-2,y+3],[x+1,y-2],[x+4,y+3]].map(B),2.2,F,.4)});
  [e0,e1].forEach((e,i)=>h.dot(...Hd([hx*(e[0]+.04),hy*(e[1]-.4)]),3.6*(i?.9:1),2.6,K));
  h.shape(circ(hx*.5,hy*.46,hx*.36,hy*.3,9).map(Hd),K,{noline:1,ox:0,oy:0});h.shape(circ(-hx*.3,hy*.62,hx*.22,hy*.2,8).map(Hd),K,{noline:1,ox:0,oy:0});
  h.shape([[hx*.06,-hy*.98],[hx*.24,-hy*.98],[hx*.3,-hy*.3],[hx*.5,hy*.06],[hx*.02,hy*.08],[hx*.1,-hy*.3]].map(Hd),Wb,{noline:1,ox:0,oy:0})}
SP.bernese={name:'Fondue',breed:'Bernese Mountain Dog',personality:'A big, gentle, fluffy friend. Happiest leaning on the people it loves.',joke:'I am not lying on your feet. I am keeping them warm.',
  col:'#2B2628',hcol:'#2B2628',light:'#C8743A',dark:'#1D1A1C',bib:W,fluff:1,bellyFl:1,hfluff:0,body:{x:104,y:134,rx:56,ry:31},head:{x:163,y:97,rx:35,ry:30},
  legs:{h:-33,f:30,w:12.6,sock:'#C8743A',toe:W},ears:'tri',earS:.92,earRound:1,tail:'brush',tsc:1.06,tailTip:W,ruff:1.02,ruffK:'bib',eyes:[5.4,5],
  face:{eyes:'open',mouth:'tongue',e0:[-.16,-.16],e1:[.36,-.2],nose:[1.3,.14],snout:1,snoutL:1.3,snoutK:'bib',brow:'soft',browCol:'#D9A27A',pupil:.7},
  marks:berneseMarks};
// aussie: the coat pass. White trim (coat.white, capped at 0.25 by the genes): a white collar (neck tube and ruff), chest, blaze and feet; none = the coat colour.
// Merle: the aussie draws its own marbling under the copper and white (the shared smudges would lie over them): torn patches in dark, a few half-dark and pale ones.
function aussieCoat(s,coat,o){const R=o.R;s.wt=o.white>0?1:0;if(!s.mixHead)s.ear=!o.merle&&lum(s.hcol)<.2?mix(s.hcol,W,.2):s.dark;// v2.21 art fix: a lighter ear on a black head (merle and red keep the dark ear)
  s.bib=s.wt?W:undefined;s.neckCol=s.wt?W:undefined;s.legs.toe=s.wt?W:undefined;s.tailTip=undefined;
  if(!o.merle){s.mrl=null;if(s.pat)s.pat={body:()=>{},head:s.mixHead?s.pat.head:()=>{}};return}
  const P=[];for(let i=0;i<13;i++)P.push({b:i<9,x:(R()-.5)*(i<9?1.5:1.0),y:(R()-.5)*(i<9?1.2:.9),rx:.12+R()*.12,ry:.16+R()*.16,k:i%4===3?2:i%3===2?1:0,a:R()*180});
  s.mrl=P;if(s.pat)s.pat={body:()=>{},head:s.mixHead?s.pat.head:()=>{}}}
function aussieMarks(h,B,Hd,s){const b=s.body,hx=s.head.rx,hy=s.head.ry,f=s.face,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],K=s.light,dk=s.dark||INK;
  if(s.mrl){const C=[dk,mix(s.col,dk,.5),mix(s.col,W,.42)];// merle: a pale base marbled with torn dark patches
    s.mrl.forEach(q=>{const M=q.b?B:Hd,rx=q.b?b.rx:hx,ry=q.b?b.ry:hy,x=q.b?q.x:q.x*.8-.2,y=q.b?q.y:q.y*.8-.3;
      h.shape(rotAbout(circ(rx*x,ry*y,rx*q.rx,ry*q.ry,9,.34),q.a,[rx*x,ry*y]).map(M),C[q.k],{noline:1,ox:0,oy:0});
      if(!q.k)h.shape(circ(rx*(x+q.rx*.9),ry*(y-q.ry*.5),rx*q.rx*.45,ry*q.ry*.5,7,.3).map(M),C[0],{noline:1,ox:0,oy:0})});
    h.crayon(b.rx,b.ry,B,mix(s.col,dk,.3),6)}
  h.shape([[b.rx*.44,b.ry*.36],[b.rx*.72,b.ry*.42],[b.rx*.82,b.ry*.92],[b.rx*.42,b.ry*.95]].map(B),K,{noline:1,ox:0,oy:0});// copper behind the forelegs and under the tail
  h.shape(circ(-b.rx*.86,b.ry*.14,b.rx*.1,b.ry*.26,7).map(B),K,{noline:1,ox:0,oy:0});
  if(s.wt)h.shape([[b.rx*.56,-b.ry*.72],[b.rx*.86,-b.ry*.6],[b.rx*1.02,b.ry*.05],[b.rx*.88,b.ry*.6],[b.rx*.7,b.ry*.5],[b.rx*.64,-b.ry*.1]].map(B),W,{noline:1,ox:0,oy:0});
  [e0,e1].forEach((e,i)=>h.dot(...Hd([hx*(e[0]+.04),hy*(e[1]-.4)]),3.2*(i?.9:1),2.3,K));// copper eyebrow dots and cheeks
  h.shape(circ(hx*.48,hy*.44,hx*.34,hy*.28,9).map(Hd),K,{noline:1,ox:0,oy:0});
  if(s.wt)h.shape([[hx*.12,-hy*.68],[hx*.22,-hy*.7],[hx*.25,-hy*.22],[hx*.34,hy*.04],[hx*.12,hy*.04],[hx*.14,-hy*.26]].map(Hd),W,{noline:1,ox:0,oy:0})}// a short, thin blaze (the bernese's runs wide to the crown)
function aussieFace(h,s,L,HT){if(lum(s.hcol)<.32&&lum(s.light)<.32)ringA(h,s,L,HT,1.9)}// a dark head with no copper (Black, Black and white): pale eye creases, so the face reads
SP.aussie={name:'Pavlova',breed:'Australian Shepherd',personality:'A clever, busy herder with a lot of ideas. Needs a job, any job.',joke:'I have herded the cushions. They are in a circle now. You are next.',
  col:'#2B2430',hcol:'#2B2430',light:'#C8743A',dark:'#1D1A22',ear:'#55505A',wt:1,bib:W,neckCol:W,body:{x:110,y:143,rx:43,ry:23,lop:.04},head:{x:164,y:104,rx:29,ry:26},neck:1,
  legs:{h:-27,f:24,w:9,sock:'#C8743A',toe:W},ears:'roseA',earS:.9,earRound:1,earFn:aussieEar,tail:'brush',tsc:.86,ruff:.96,ruffK:'bib',coatFn:aussieCoat,faceFn:aussieFace,eyes:[6.2,5.8],
  face:{eyes:'open',mouth:'smile',e0:[-.14,-.18],e1:[.38,-.22],nose:[1.38,.12],snout:1,snoutL:1.38,brow:'curious',browCol:'#CFC6C0'},
  marks:aussieMarks};
/* end v2.21 ART A */
/* v2.21 ART B: cavalier, jrt */
/* Their extras are new spec fields, so no older dog takes these branches: ownWhite (coated() hands the coat's white to the breed's own function as
   s.parti, with no white socks, dots or blaze), face.snoutK (the muzzle takes that spec colour: the Blenheim's white muzzle is its white neckCol),
   ears 'button' (in EARS_A: the Jack Russell's small ears folded forward) and tailFn (the cavalier's feathered tail, the Jack Russell's natural tail
   held up). The cavalier's long feathered ears are the v2.11 curtain ear with the v2.12 earSwing: they swing out behind in jump and shake and stay
   on the skull (earOn) */
const whB=s=>s.neckCol||(s.wet?wetC(W):W);// the parti white (a spec colour, so a wet coat lays it a shade darker too)
const inEB=(b,P,k=.95)=>dense(P,true,3).map(q=>{const r=Math.hypot(q[0]/b.rx,q[1]/b.ry);return r>k?[q[0]*k/r,q[1]*k/r]:q});// a body mark kept inside the body even with no part open (the expecting belly closes it); k: the clamp
const warmB=c=>{const v=[1,3,5].map(i=>parseInt(c.slice(i,i+2),16));return v[0]-v[2]>80&&v[0]>=v[1]&&v[1]>=v[2]};// a red or cream coat (no tan points)
EARS_A.button=function(pr,E){// v2.21 jrt: a small V ear that lifts off the skull and folds forward at the crease, the tip pointing down toward the eye
  E.push({pts:pr([[-.66,-.8],[-.56,-1.06],[-.22,-1.1],[.02,-.78],[.0,-.44],[-.16,-.56],[-.42,-.76]]),pivot:pr([[-.38,-.92]])[0],side:-1,flop:1,fold:[1,3]});
  E.push({pts:pr([[.04,-.9],[.16,-1.1],[.52,-1.08],[.8,-.72],[.78,-.36],[.6,-.48],[.36,-.76]]),pivot:pr([[.3,-.94]])[0],side:1,flop:1,fold:[1,3]})};
function cavTail(h,s,L,map,col){// cavalier: carried happily, a little up, the long silky feathering hanging under it
  const c=(s.parti||0)>=.6?whB(s):col,wt=s.wet,C=dense([[0,0],[-10,-7],[-21,-11],[-32,-12],[-40,-9]],false,3.5),n=C.length,up=[],dn=[];
  C.forEach((p,i)=>{const t=i/(n-1),a=C[Math.max(0,i-1)],b=C[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],m=Math.hypot(dx,dy)||1,u=[-dy/m,dx/m],
   wu=4.6-t*2.4,wd=(wt?2.6+4.6*Math.sin(Math.PI*Math.min(1,t*1.08)):3+9.5*Math.sin(Math.PI*Math.min(1,t*1.08)))*(i%2?(wt?.8:1.1):(wt?1.2:.94));
   up.push([p[0]+u[0]*wu,p[1]+u[1]*wu]);dn.push([p[0]-u[0]*wd,p[1]-u[1]*wd])});
  h.shape(map(up.concat(dn.reverse())),c,{step:30,amp:.8,w:3.6});// the plume of silky feathering hanging under the tail
  const K=lum(c)<.32?mix(c,W,.32):mix(c,PEN,.3);h.line(map([[-12,-1],[-17,5]]),1.8,K,.3);h.line(map([[-23,-4],[-28,3]]),1.8,K,.3)}
function cavCoat(s,w){// cavalier: Blenheim and Tricolour are the parti coat (w 0.6: white with the colour in patches), Ruby and Black and tan the whole colours
  s.parti=w;s.tanPts=!warmB(s.col);s.face=Object.assign({},s.face);
  if(w>=.6){s.neckCol=W;s.legs.col=W;delete s.legs.sock;s.face.snoutK='neckCol';s.bellyK='neckCol';s.bodyShut=1}// art fix (new spec field bodyShut): the body outline closed, so no crayon gap shows the chestnut ground under the white
  else{delete s.bodyShut;delete s.neckCol;delete s.bellyK;delete s.legs.col;if(s.tanPts)s.legs.sock=s.light;else delete s.legs.sock;delete s.face.snoutK}}
function cavMarks(h,B,Hd,s){const b=s.body,hx=s.head.rx,hy=s.head.ry,f=s.face,pw=s.parti||0,Wc=whB(s),tan=s.tanPts,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1];
  const K=curlCol(s.col),KW=mix('#E3D9C8',PEN,.3),o={noline:1,ox:0,oy:0};
  if(pw>=.6){// white all over, the colour left as a saddle on the back and a patch over the rump (art fix: with the body part open the white runs out to the ink, pinned inside it, so no chestnut seam along the belly; expecting, the part is closed: clamped at .95)
   h.shape(inEB(b,[[b.rx*1.1,-b.ry*1.1],[b.rx*.4,-b.ry*1.1],[b.rx*.44,-b.ry*.56],[b.rx*.3,-b.ry*.16],[-b.rx*.04,-b.ry*.04],[-b.rx*.22,-b.ry*.42],[-b.rx*.26,-b.ry*1.1],[-b.rx*.5,-b.ry*1.1],
    [-b.rx*.46,-b.ry*.5],[-b.rx*.6,-b.ry*.02],[-b.rx*.86,b.ry*.2],[-b.rx*1.1,b.ry*.22],[-b.rx*1.1,b.ry*1.1],[b.rx*1.1,b.ry*1.1]],s.expecting?.95:1.1).map(B),Wc,o);
   [[.6,.3],[.1,.5],[-.4,.55]].forEach(q=>h.line([[b.rx*q[0],b.ry*q[1]],[b.rx*(q[0]-.03),b.ry*(q[1]+.26)]].map(B),1.8,KW,.3))}
  else if(pw>=.25)h.shape(circ(b.rx*.8,b.ry*.38,b.rx*.15,b.ry*.42,8).map(B),Wc,o);// a little white star on the chest
  if(tan){if(pw<.6)h.shape(inEB(b,[[b.rx*.6,-b.ry*.05],[b.rx*.94,-b.ry*.18],[b.rx*1.02,b.ry*.36],[b.rx*.84,b.ry*.9],[b.rx*.62,b.ry*.6]]).map(B),s.light,o);
   h.shape(circ(-b.rx*.86,b.ry*.02,b.rx*.1,b.ry*.24,7).map(B),s.light,o)}
  [[-.36,-.66],[.12,-.72]].forEach(q=>h.line([[b.rx*q[0],b.ry*q[1]],[b.rx*(q[0]+.04),b.ry*(q[1]+.16)],[b.rx*(q[0]+.01),b.ry*(q[1]+.3)]].map(B),2,K,.3));// the silky wave on the back
  // the head: the white blaze up between the eyes, the white muzzle, cheeks and chin, the chestnut "lozenge" on the crown
  if(pw>=.6){h.shape([[hx*.06,-hy*1.08],[hx*.22,-hy*1.08],[hx*.24,-hy*.5],[hx*.3,-hy*.02],[hx*.64,hy*.04],[hx*1.08,hy*.02],[hx*1.08,hy*1.08],[-hx*.34,hy*1.08],[-hx*.46,hy*.56],[-hx*.16,hy*.22],[hx*.02,-hy*.46]].map(Hd),Wc,o);
   h.shape(circ(hx*.14,-hy*.66,hx*.085,hy*.1,7).map(Hd),s.col,o)}
  if(tan){[e0,e1].forEach((e,i)=>h.shape(circ(hx*(e[0]+.03),hy*(e[1]-.42),hx*(i?.09:.1),hy*.07,7).map(Hd),s.light,o));
   h.shape(circ(-hx*.3,hy*.3,hx*.16,hy*.12,8).map(Hd),s.light,o)}}
SP.cavalier={name:'Scone',breed:'Cavalier King Charles Spaniel',personality:'A sweet little lap dog with soft feathered ears. Friends with everyone.',joke:'My ears are not hair. They are a gentle hug for my face.',
  col:'#C8642E',hcol:'#C8642E',light:'#E8A06A',dark:'#8A3E1C',neckCol:W,bellyK:'neckCol',bodyShut:1,parti:.6,ownWhite:cavCoat,body:{x:114,y:147,rx:37,ry:21,lop:.03},head:{x:160,y:109,rx:28,ry:26},
  legs:{h:-25,f:23,w:6.8,col:W},ears:'curtain',earS:.8,earRound:1,earSwing:62,tail:'feather',tailFn:cavTail,eyes:[7.6,7.2],
  face:{eyes:'open',mouth:'smile',e0:[-.16,-.12],e1:[.38,-.16],nose:[1.2,.2],snout:1,snoutL:1.2,snoutD:.58,snoutK:'neckCol',pupil:.8,brow:'soft',browCol:'#D9A27A',sweet:1},
  marks:cavMarks};
function jrtTail(h,s,L,map,col){// jack russell: a natural tail, carried straight up, thick at the root
  const C=dense([[0,0],[-3,-10],[-3,-21],[1,-31]],false,4);h.shape(map(taperB(C,s.wet?4.8:5.6,2.4)),col,{step:30,amp:.7,w:3.6});h.line(map([[-1,-6],[-2,-16]]),1.8,mix('#E3D9C8',PEN,.3),.3)}
function jrtFace(h,s,L,HT){// on black patches: a pale crayon crease round each open eye, so the face reads even at chip size
  if(lum(s.dark||W)>=.32)return;const f=L.face;if(/^(happy|closed|x)$/.test(f.eyes))return;const hx=s.head.rx,hy=s.head.ry,c=mix(s.dark,W,.55);
  [[f.e0||[-.1,-.04],s.eyes[0]],[f.e1||[.42,-.1],s.eyes[1]]].forEach(([e,r])=>{const [x,y]=HT([hx*e[0],hy*e[1]]),R=r+2.4,A=[];for(let i=0;i<=8;i++){const t=(15+i*18.75)*D2R;A.push([x+Math.cos(t)*R,y+Math.sin(t)*R*1.05])}h.line(A,1.9,c,.3)})}
function jrtCoat(s,w){s.parti=w}// always white with patches (the patches grow a little on a mix with less white)
function jrtMarks(h,B,Hd,s){const b=s.body,hx=s.head.rx,hy=s.head.ry,f=s.face,K=s.dark,pw=s.parti===undefined?.6:s.parti,big=pw<.6?1.3:1,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1];
  const o={noline:1,ox:0,oy:0},tan=lum(s.light)<.9,KW=mix('#E3D9C8',PEN,.3);
  // a patch over the back by the tail and a little one on the shoulder; short white coat ticks
  h.shape(inEB(b,circ(-b.rx*.5,-b.ry*.5,b.rx*.36*big,b.ry*.6*big,10,.12)).map(B),K,o);h.shape(inEB(b,circ(b.rx*.3,-b.ry*.74,b.rx*.14*big,b.ry*.26*big,8)).map(B),K,o);
  [[.55,.1],[.1,.35],[-.5,.45]].forEach(q=>{const x=q[0]*b.rx,y=q[1]*b.ry;h.line([[x-3,y-1],[x-1,y+2],[x+1,y-1],[x+3,y+2]].map(B),1.8,KW,.3)});
  // the head: the colour over the ears and both eyes, a white blaze up the middle, a white muzzle; tan eyebrow dots and cheeks on the tricolour
  h.shape([[-hx*1.08,-hy*1.08],[hx*.04,-hy*1.08],[hx*.06,-hy*.46],[-hx*.02,hy*.12],[-hx*.36,hy*.34],[-hx*1.08,hy*.36]].map(Hd),K,o);
  h.shape(circ(hx*(e1[0]+.06),hy*(e1[1]-.06),hx*.3,hy*.34,10).map(Hd),K,o);
  if(tan){[e0,e1].forEach((e,i)=>h.shape(circ(hx*(e[0]+.03),hy*(e[1]-.42),hx*(i?.1:.11),hy*.085,7).map(Hd),s.light,o));h.shape(circ(-hx*.34,hy*.16,hx*.14,hy*.12,8).map(Hd),s.light,o)}}
SP.jrt={name:'Pickle',breed:'Jack Russell Terrier',personality:'A small dog with an enormous amount of bounce. Digs, jumps and never stops.',joke:'I am not hyper. I am just ready. For everything. Right now.',
  col:'#FBF8F2',hcol:'#FBF8F2',light:'#E0A050',dark:'#C97A32',ear:'#C97A32',ownWhite:jrtCoat,body:{x:114,y:148,rx:35,ry:20,lop:.03},head:{x:157,y:113,rx:26,ry:23},
  legs:{h:-24,f:22,w:7},ears:'button',earRound:1,earSwing:40,tail:'jrt',tailFn:jrtTail,faceFn:jrtFace,eyes:[5.8,5.4],
  face:{eyes:'open',mouth:'tongue',e0:[-.12,-.16],e1:[.36,-.2],nose:[1.38,.12],snout:2,snoutL:1.38,snoutD:.56,pupil:.74,brow:'eager'},
  marks:jrtMarks};
/* end v2.21 ART B */
const KEYS=['shiba','corgi','golden','dachs','husky','mutt','chihuahua','pug','greyhound','beagle','poodle','collie','samoyed','frenchie','akita','spitz','pom','afghan','dane','mastiff','gsd',
  'dobie','corso','pitbull','minpin','lab','malamute','chow','stdpoodle','schnauzer','westie','yorkie','bichon','maltese','shihtzu',
  'dalmatian','bernese','aussie','cavalier','jrt'];// v2.12: fourteen appended (V212.md 2); v2.21 ART A and B: five more (V221.md 2)
const NEWK=/^(poodle|collie|samoyed|frenchie|akita|spitz|pom|afghan|dane|mastiff|gsd|dobie|corso|pitbull|minpin|lab|malamute|chow|stdpoodle|schnauzer|westie|yorkie|bichon|maltese|shihtzu|dalmatian|bernese|aussie|cavalier|jrt)$/;
/* v2.13 neck fix (owner: "Make sure the head is stick to the body"; V213.md 5): the old breeds whose head floated off the body in a few poses.
   Per breed, per pose: [dx, dy] moves the head (canvas px, before its tilt) and the pose draws the neck tube, as the neck:1 breeds do in every pose.
   Adults only (spec field nfix; puppies and newborns keep their big heads on the body as they were). Every other pose of these breeds is unchanged.
   game/v212_neck_check.js finds the list: a frame floats when the skull does not touch the body and most of the neck's place is empty paper. */
const NECKFIX={
  shiba:{yawn:[0,0],idle:[0,0],walk:[0,0],pet:[0,0],dirty:[0,0],happy:[0,0],speak:[0,0],howl:[0,0],leglift:[0,0],shake:[0,0]},
  husky:{walk:[0,0],dirty:[0,0],idle:[0,0],speak:[0,0],happy:[0,0],leglift:[0,0],howl:[0,0]},
  mutt:{happy:[0,0],dirty:[0,0],idle:[0,0],speak:[0,0],leglift:[0,0],walk:[0,0]},
  chihuahua:{pet:[0,0],beg:[0,0],squat:[0,0],dance:[0,0],idle:[0,0],walk:[0,0],dirty:[0,0],scratch:[0,0],happy:[0,0],speak:[0,0],howl:[-3,7],leglift:[0,0],yawn:[0,0],shake:[0,0],paw:[0,0]},
  pug:{howl:[0,0],speak:[0,0],happy:[0,0],shake:[0,0]},
  dachs:{shake:[0,0],scratch:[0,0]},
  beagle:{shake:[0,0],happy:[0,0],speak:[0,0],howl:[0,0]},
  collie:{howl:[-2,3]},
  westie:{howl:[0,0]},
  maltese:{scratch:[0,0],dance:[0,0],happy:[0,0],speak:[0,0],shake:[0,0]},
  cavalier:{shake:[0,0],dance:[0,0],dirty:[0,0],happy:[0,0],idle:[0,0],paw:[0,0],speak:[0,0]},// v2.21 ART B
  jrt:{idle:[0,0],happy:[0,0],pet:[0,0],walk:[0,0],dirty:[0,0],shake:[0,0],beg:[0,0],squat:[0,0],leglift:[0,0],paw:[0,0],speak:[0,0],dance:[0,0],scratch:[0,0],yawn:[0,0],howl:[0,0]}};
Object.keys(NECKFIX).forEach(k=>{SP[k].nfix=NECKFIX[k]});

/* ---------- pose -> rig layout ---------- */
function layout(s,pose,k,aOv){
  const b=s.body,hd=s.head,L={pose,k,face:{...s.face},ears:'norm',tailA:0,tailS:1,blush:0,hearts:0,zz:0,stink:0,mud:0,tear:0};
  L.bT={x:b.x,y:b.y,a:0};L.hT={x:hd.x,y:hd.y,a:0};
  const rel=[hd.x-b.x,hd.y-b.y];
  if(s.face.tilt&&(pose==='idle'||pose==='dirty'||pose==='walk'))L.hT.a=s.face.tilt;
  let legMode='stand',swing=null,kick=-1,lift=0;
  switch(pose){
   case 'happy':L.face.eyes='open';L.face.mouth=s.face.mouth==='grin'?'grin':'tongue';L.tailA=25;L.ears='perk';L.hearts=2;L.hT.a=-7;L.hT.y-=3;break;
   case 'pet':L.face.eyes='happy';L.face.mouth=s.face.mouth==='grin'?'grin':'tongue';L.blush=1;L.hearts=2;L.hT.a=-12+[0,5,-4][k];L.bT.a=[-2,2,-1][k];L.tailA=[18,34,8][k];kick=0;L.kick=[[-16,-18],[-6,-6],[-22,-26]][k];L.ears='perk';L.wiggle=1;break;
   case 'eat':{L.ears='eat';L.face.eyes='down';L.face.mouth='chew';L.tailA=8;L.bT.a=5;eatHead(s,L);break}
   case 'sleep':L.face.eyes='closed';L.face.mouth='sleep';L.ears='sleep';L.tailA=-100;L.zz=1;legMode='lie';
     L.bT.y=GY-b.ry*(s.fluff?1.02:.86);L.tailS=.75;L.bT.x=b.x-(b.long?4:8);L.hT.x=L.bT.x+b.rx*.92+hd.rx*.3;L.hT.y=GY-hd.ry*.8;L.hT.a=6;break;
   case 'walk':swing=[1,0,-1][k];L.lift=k===1;L.bT.y+=[0,-3,0][k];L.hT.y+=[0,-4,1][k];L.tailA=[14,26,-4][k];L.face.eyes=s.face.eyes==='smug'?'smug':'open';L.face.mouth=s.face.mouth==='o'?'smile':s.face.mouth;break;
   case 'jump':legMode='splay';{const lift=s.fluff?26:b.long?36:34;L.bT.y-=lift;L.hT.y-=lift+10;L.bT.x+=b.long?8:0;L.hT.x+=b.long?6:5}L.bT.a=b.long?-9:-12;L.hT.a=-14;L.speed=1;L.ears='fly';L.tailA=30;L.face.eyes='open';L.face.mouth='open';break;
   case 'sit':{legMode='sit';const a=aOv??(b.long?-30:b.deep?-52:-34);if(b.deep)L.gfold=1;L.bT.a=a;if(b.long){L.bT.sx=.58;L.scrunch=1}const rear=[-b.rx*.72,b.ry*.62],rq=rot(rear,a);const R=[b.x-b.rx*(b.long?.2:.45),GY-3];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
     {const BT=T(L.bT);let my=-1e9;bodyPts(s).forEach(p=>{const q=BT(p);if(q[1]>my)my=q[1]});if(my>GY-1)L.bT.y-=my-(GY-1)}
     const hq=rot([rel[0]*(L.bT.sx||1),rel[1]],a*.55);L.hT.x=L.bT.x+hq[0]+4-(b.long?14:0);L.hT.y=L.bT.y+hq[1]-2-(b.long?8:0);L.tailA=-70;L.face.mouth=s.face.mouth==='o'?'smile':s.face.mouth;if(L.gfold)gfoldHead(s,L,rel,a);break}
   case 'beg':{legMode='beg';L.face.eyes='hope';L.face.mouth=s.face.mouth==='o'||s.face.mouth==='smirk'?'smile':s.face.mouth==='grin'?'grin':'smile';L.ears='perk';L.hope=1;const a=b.long?-48:b.deep?-66:-58;if(b.deep)L.gfold=1;L.bT.a=a;if(b.long){L.bT.sx=.58;L.scrunch=1}const rear=[-b.rx*.72,b.ry*.62],rq=rot(rear,a);const R=[b.x-b.rx*(b.long?.2:.45),GY-3];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
     {const BT=T(L.bT);let my=-1e9;bodyPts(s).forEach(p=>{const q=BT(p);if(q[1]>my)my=q[1]});if(my>GY-1)L.bT.y-=my-(GY-1)}
     const hq=rot([rel[0]*(L.bT.sx||1),rel[1]],a*.55);L.hT.x=L.bT.x+hq[0]+4-(b.long?14:0);L.hT.y=L.bT.y+hq[1]-2-(b.long?8:0);L.tailA=-70;L.face.mouth=s.face.mouth==='o'?'smile':s.face.mouth;if(L.gfold)gfoldHead(s,L,rel,a);break}
   case 'sad':L.face.eyes='sad';L.face.mouth='frown';L.ears='droop';L.tear=1;L.tailA=-80;L.tailS=.85;L.hT.y+=11;L.hT.x-=2;L.hT.a=10;break;
   case 'dirty':L.mud=1;L.stink=1;break;
   case 'sniff':{legMode='sniff';L.face.eyes='down';L.face.mouth='smile';L.ears='perk';L.tailA=-8;L.tailS=1.05;L.bT.a=6;
     const N=noseLocal(s),q=rot(N,26);L.hT.a=26;L.hT.x=hd.x+6;L.hT.y=Math.min(176-q[1]+2,GY-3-hd.ry);L.sniffFx=1;break}
   case 'yawn':case 'howl':{legMode='sit';const a=aOv??(b.long?-30:-34);L.bT.a=a;if(b.long){L.bT.sx=.58;L.scrunch=1}const rear=[-b.rx*.72,b.ry*.62],rq=rot(rear,a);const R=[b.x-b.rx*(b.long?.2:.45),GY-3];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
     {const BT=T(L.bT);let my=-1e9;bodyPts(s).forEach(p=>{const q=BT(p);if(q[1]>my)my=q[1]});if(my>GY-1)L.bT.y-=my-(GY-1)}
     const hq=rot([rel[0]*(L.bT.sx||1),rel[1]],a*.55);L.hT.x=L.bT.x+hq[0]+4-(b.long?14:0);L.hT.y=L.bT.y+hq[1]-2-(b.long?8:0);L.tailA=-70;L.face.eyes='closed';
     if(pose==='yawn'){L.face.mouth='yawn';L.hT.a=-8+[0,-3,0][k];L.ears='norm';L.yawnFx=1}else{L.face.mouth='howl';L.hT.a=-50+[0,-3,2][k];L.hT.y-=8;L.hT.x-=4;L.ears='perk';L.howlFx=1}break}
   case 'paw':case 'scratch':{legMode=pose;const a=aOv??(b.long?-30:-34);L.bT.a=a;if(b.long){L.bT.sx=.58;L.scrunch=1}const rear=[-b.rx*.72,b.ry*.62],rq=rot(rear,a);const R=[b.x-b.rx*(b.long?.2:.45),GY-3];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
     {const BT=T(L.bT);let my=-1e9;bodyPts(s).forEach(p=>{const q=BT(p);if(q[1]>my)my=q[1]});if(my>GY-1)L.bT.y-=my-(GY-1)}
     const hq=rot([rel[0]*(L.bT.sx||1),rel[1]],a*.55);L.hT.x=L.bT.x+hq[0]+4-(b.long?14:0);L.hT.y=L.bT.y+hq[1]-2-(b.long?8:0);L.tailA=-70;
     if(pose==='paw'){L.face.eyes='open';L.face.mouth=s.face.mouth==='o'||s.face.mouth==='smirk'?'smile':s.face.mouth;L.ears='perk';L.hT.a=-6}
     else{L.face.eyes='happy';L.face.mouth=s.face.mouth==='grin'?'grin':'smile';L.blush=1;L.hT.a=14+[0,4,-2][k];L.hT.x-=3;L.itch=1}break}
   case 'down':legMode='down';L.face.eyes='open';L.face.mouth=s.face.mouth==='o'?'smile':s.face.mouth;L.ears='perk';L.tailA=-20;L.tailS=.85;
     L.bT.y=GY-b.ry*(s.fluff?.95:.8);L.bT.x=b.x-(b.long?2:6);L.hT.x=L.bT.x+b.rx*.8+hd.rx*.25;L.hT.y=L.bT.y-b.ry*.4-hd.ry*.75;break;
   case 'rollover':legMode='roll';L.face.eyes='happy';L.face.mouth=s.face.mouth==='grin'?'grin':'tongue';L.ears='flat';L.tailA=30+[0,12,-6][k];L.blush=1;
     L.bT.sy=-1;L.bT.y=GY-b.ry*(s.fluff?.95:.85)-2;L.bT.x=b.x-(b.long?0:6)+[0,2,-2][k];L.hT.a=150;L.hT.x=L.bT.x+b.rx*.85+hd.rx*.35;L.hT.y=GY-hd.ry*1.0-2;L.wig=1;break;
   case 'playdead':legMode='dead';L.face.eyes='x';L.face.mouth='dead';L.ears='flat';L.tailA=-100;L.tailS=.8;
     L.bT.y=GY-b.ry*(s.fluff?1.0:.86);L.bT.x=b.x-(b.long?10:14);L.hT.a=s.face.snoutL?14:60;L.hT.x=L.bT.x+b.rx*.9+hd.rx*.45;L.hT.y=s.face.snoutL?GY-hd.ry*1.1:GY-hd.rx*.95;L.dead=1;break;
   case 'speak':L.face.eyes='open';L.face.mouth='bark';L.ears='perk';L.hT.a=-12+[0,-4,2][k];L.hT.y-=4+[0,2,0][k];L.tailA=26;L.woof=1;break;
   case 'dance':{legMode='dance';L.face.eyes='happy';L.face.mouth=s.face.mouth==='grin'?'grin':'tongue';L.ears='perk';const a=(b.long?-52:-64)+[0,6,-6][k];L.bT.a=a;if(b.long){L.bT.sx=.62;L.scrunch=1}
     const rear=[-b.rx*.72,b.ry*.3],rq=rot([rear[0]*(L.bT.sx||1),rear[1]],a);const R=[b.x-b.rx*(b.long?.15:.35)+[0,4,-4][k],GY-(aOv??24)];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
     const hq=rot([rel[0]*(L.bT.sx||1),rel[1]],a*.6);L.hT.x=L.bT.x+hq[0]-(b.long?16:4);L.hT.y=L.bT.y+hq[1]-4;L.hT.a=[0,-10,10][k];L.tailA=-40;L.danceFx=1;break}
   case 'bow':legMode='bow';L.face.eyes='open';L.face.mouth=s.face.mouth==='grin'?'grin':'tongue';L.ears='perk';L.bT.a=b.long?9:16;L.bT.y+=2;L.tailA=34+[0,18,-10][k];L.hT.y=GY-hd.ry*1.05-6;L.hT.x+=6;L.hT.a=-10;L.wiggle=0;L.wagFx=1;break;
   case 'squat':legMode='squat';L.face.eyes='strain';L.face.mouth='tight';L.ears='norm';L.tailA=38;L.bT.a=s.pup===1&&b.long?-8:-14;L.bT.y+=b.long?3:6;L.bT.x+=2;L.hT.y+=2;L.hT.a=-4;L.sweat=1;L.blush=0;L.shy=1;break;
   case 'leglift':legMode='lift';L.face.eyes='whistle';L.face.mouth='whistle';L.tailA=12;L.bT.a=3;L.hT.a=-10;L.hT.y-=2;L.notes=1;break;
   case 'crouch':{legMode='crouch';L.ears='flat';L.face.eyes='open';L.face.mouth=s.face.mouth==='o'?'o':'smile';L.tailA=-60;L.tailS=.8;{const sy=s.fluff?.52:b.long?.62:.8;L.bT.sy=sy;L.bT.y=GY-6-b.ry*sy;}L.hT.y=GY-3-hd.ry*(s.fluff?.85:.95);L.hT.x=hd.x+8;L.hT.a=6;L.speed=0;L.duck=1;break}
   case 'shake':L.face.eyes='closed';L.face.mouth='smile';L.ears='fly';L.hT.a=[-16,14,-6][k];L.bT.a=[5,-5,2][k];L.hT.x+=[-3,3,0][k];L.tailA=[30,-20,10][k];L.spray=1;break;
   case 'cold':L.face.eyes='sad';L.face.mouth='frown';L.ears='droop';L.tailA=-90;L.tailS=.7;{const j=[-2,2,-1][k];L.bT.x+=j;L.hT.x+=j*1.5;L.bT.y+=3;L.hT.y+=8;L.hT.a=6}L.snow=1;L.blueNose=1;L.shiver=1;break;
   case 'hot':L.face.eyes='sad';L.face.mouth='pant';L.ears='droop';L.tailA=-60;L.tailS=.85;L.hT.y+=8;L.hT.a=8;L.heat=1;L.bT.y+=2;break;
   case 'dig':{legMode='dig';L.face.eyes='down';L.face.mouth='open';L.ears='perk';L.tailA=34;L.bT.a=b.long&&s.pup?7:12;
     const N=noseLocal(s),q=rot(N,28);L.hT.a=28;L.hT.x=hd.x+4;L.hT.y=Math.min(hd.y+30,GY-6-hd.ry);L.dirt=1;
     if(b.deep){L.gdig=1;L.bT.a=20;L.bT.y+=b.ry*1.1;L.bT.x-=4;L.hT.a=34;L.hT.x=hd.x-2;L.hT.y=GY-8-hd.ry*1.1}break}
  }
  if(s.nfix&&!s.pup&&s.nfix[pose]){const q=s.nfix[pose];L.hT.x+=q[0];L.hT.y+=q[1];L.neckT=1}// v2.13 neck fix (NECKFIX)
  if(s.mixHead&&s.pup!==2)L.neckT=1;// v2.13 mix neck: a mix (adult or puppy) always draws the neck tube. The head breed's skull sits where the body breed's
  // head was, and a smaller or shorter head (yorkie, greyhound, pug on a collie, husky or shih tzu body) floated by up to 6.5 px; the tube bridges that
  // gap with a short neck (the necked breeds bridge up to 20 px). Newborns keep no neck, as pupSpec drops it.
  // legs: exactly four. Far legs sit a little forward, higher, darker; front pair under the chest, hind pair under the hips
  const B=T(L.bT),lg=s.legs;L.legs=[];
  const FAR=s.pup===1?PUPLEG[2]:10;// a puppy's far legs stand further off, so the four short legs read as four, with a gap
  [['FH',0,0],['NH',0,1],['FF',1,0],['NF',1,1]].forEach(([id,front,near],i)=>{
    const x=(front?lg.f:lg.h)+(near?0:FAR),hip=B([x,b.ry*(near?.42:.22)]),base=(lg.cols&&lg.cols[id])||lg.col||s.col;
    const col=near?base:mix(base,PEN,.28),sock=lg.sock?(near?lg.sock:mix(lg.sock,PEN,.28)):null,w=lg.w*(near?1:.88),up=near?0:3.5;
    let foot;
    if(legMode==='stand'){foot=[hip[0],GY-up];
      if(swing!=null){const diagA=id==='NF'||id==='FH',sw=(diagA?swing:-swing)*(b.long?11:15)*(s.pup===1?PUPLEG[3]:1);foot=[hip[0]+sw,GY-up-(L.lift&&diagA?(s.pup===1?5:8):0)]}
      if(id==='NH'&&L.kick)foot=[hip[0]+L.kick[0],GY+L.kick[1]];}
    else if(legMode==='lie'){foot=front?[hip[0]+22+(near?0:5),GY-2-up]:[hip[0]+14,GY-1-up];}
    else if(legMode==='squat'){if(front)foot=[hip[0]+6,GY-up];else{const kn=[hip[0]+(near?14:12),GY-8-up*.5];L.legs.push({hip,mid:kn,foot:[hip[0]-4,GY-up],col,sock,w,i,id,near});return}}
    else if(legMode==='lift'){if(id==='NH'){L.legs.push({hip,mid:[hip[0]-14,hip[1]+2],foot:[hip[0]-26,hip[1]-20],col,sock,w,i,id,near,lifted:1,raised:1});L.paw=1;return}foot=[hip[0]+(id==='FH'?-4:0),GY-up];}
    else if(legMode==='sniff'){if(id==='NF'){const wv=[0,-2,1][L.k||0];L.legs.push({hip,mid:[hip[0]+6,GY-14+wv],foot:[hip[0]+12,GY-8+wv],col,sock,w,i,id,near});return}foot=[hip[0]+(front?2:-4),GY-up];}
    else if(legMode==='paw'){if(!front){L.legs.push({haunch:near?1:0,sitfoot:near?0:1,hip,col,w,i,id,near});return}
      if(near){const wv=[0,-3,2][L.k||0],sh=hip;L.legs.push({hip:sh,mid:[sh[0]+16,sh[1]-2],foot:[sh[0]+30,sh[1]-10+wv],col,sock,w,i,id,near,raised:1});L.paw=1;return}foot=[hip[0]+3,GY-up];}
    else if(legMode==='scratch'){if(!front){if(near){const ear=T(L.hT)([-s.head.rx*.55,-s.head.ry*.35]),wv=[0,-4,3][L.k||0];L.legs.push({hip,mid:[hip[0]+20,hip[1]-2],foot:[ear[0]-6,ear[1]+8+wv],col,sock,w,i,id,near,raised:1});L.paw=1;return}
        L.legs.push({haunch:0,sitfoot:1,hip,col,w,i,id,near});return}foot=[hip[0]+3,GY-up];}
    else if(legMode==='down'){foot=front?[hip[0]+30+(near?0:6),GY-2-up]:[hip[0]+16,GY-1-up];}
    else if(legMode==='roll'){const wv=[0,-3,3][L.k||0]*(near?1:-1);L.legs.push({hip,mid:[hip[0]+(front?10:-8),hip[1]-18],foot:[hip[0]+(front?18:-14)+wv,hip[1]-38+(near?0:5)],col,sock,w,i,id,near,raised:1});L.paw=1;return}
    else if(legMode==='dead'){const f=[hip[0]+(front?32:28)+(near?0:6),Math.min(GY-2,hip[1]+(near?2:-6))];L.legs.push({hip,foot:f,col,sock,w,i,id,near,raised:1});L.paw=1;return}
    else if(legMode==='dance'){if(!front){foot=[hip[0]+(near?6:-2),GY-up];}else{const wv=[0,-5,4][L.k||0],sh=B([b.rx*(near?.62:.5),-b.ry*.15]);L.legs.push({hip:sh,mid:[sh[0]+(near?14:10),sh[1]+10+wv*.3],foot:[sh[0]+(near?18:13),sh[1]-6+wv],col,sock,w,i,id,near,raised:1});L.paw=1;return}}
    else if(legMode==='bow'){foot=front?[hip[0]+22+(near?0:5),GY-1-up]:[hip[0]-2,GY-up];if(front){L.legs.push({hip,mid:[hip[0]+4,GY-6-up],foot,col,sock,w,i,id,near});return}}
    else if(legMode==='crouch'){foot=front?[hip[0]+12,GY-up*.5]:[hip[0]-10,GY-up*.5];}
    else if(legMode==='dig'){if(front){const pw=[[18,-14],[6,-2],[22,-6]][L.k]||[18,-14];foot=near?[hip[0]+pw[0],GY+pw[1]]:[hip[0]+10-pw[0]*.3,GY-up];
      if(L.gdig){foot=near?[hip[0]+pw[0]+6,GY+pw[1]*.7]:[hip[0]+14,GY-up];L.legs.push({hip,mid:[hip[0]-7+(near?0:2),hip[1]+(foot[1]-hip[1])*.55],foot,col,sock,w,i,id,near});return}}
      else foot=L.gdig?[hip[0]-10,GY-up]:[hip[0]-4,GY-up];}
    else if(legMode==='splay'){foot=front?[hip[0]+26+(near?0:4),hip[1]+12-(near?0:5)]:[hip[0]-28+(near?0:4),hip[1]+10-(near?0:5)];
      // v2.18.3: a short-legged dog (the dachshund, corgi, pug, a puppy) leaps with its own short legs, bent at the knee, never a long straight noodle
      {const st=GY-up-(b.y+b.ry*(near?.42:.22)),v=[foot[0]-hip[0],foot[1]-hip[1]],n=Math.hypot(v[0],v[1]);if(n>st){const q=st/n,f2=[hip[0]+v[0]*q,hip[1]+v[1]*q];L.legs.push({hip,mid:[hip[0]+v[0]*q*.55,hip[1]+v[1]*q*.55+w*.45],foot:f2,col,sock,w,i,id,near});return}}}
    else if(legMode==='beg'){if(!front){L.legs.push({haunch:near?1:0,sitfoot:near?0:1,hip,col,w,i,id,near});return}
      const wv=[0,-3,1][L.k||0],sh=B([b.rx*(near?.62:.5),-b.ry*.15]);L.legs.push({hip:sh,foot:[sh[0]+(near?20:15),sh[1]+(near?4:-1)+wv],mid:[sh[0]+(near?10:7),sh[1]+(near?16:11)],col,sock,w,i,id,near,raised:1});L.paw=1;return}
    else if(legMode==='sit'){if(!front){L.legs.push({haunch:near?1:0,sitfoot:near?0:1,hip,col,w,i,id,near});return}foot=[hip[0]+3,GY-up];}
    L.legs.push({hip,foot,col,sock,w,i,id,near});
  });
  L.legMode=legMode;
  // v2.18.3 "All in one piece" (owner, 29 Oct 2026: legs are proper legs, not noodles): sitting, a front leg that would reach down from a chest held
  // too high (the long dachshund and corgi, the short-legged puppies) has the body sit lower, its angle eased toward level until the leg is the breed's own
  // dancing, a short dog (a puppy) whose hind legs would stretch to hold its hips 24 px up holds them lower, at its own leg's height
  if(aOv===undefined&&legMode==='dance'&&legLong(s,L,2))return layout(s,pose,k,Math.min(24,GY-(b.y+b.ry*.42)));
  if(aOv===undefined&&/^(sit|paw|scratch)$/.test(legMode)&&!L.gfold&&legLong(s,L,1)){let a=L.bT.a,L2=L;while(a<-6&&legLong(s,L2,1)){a+=2;L2=layout(s,pose,k,a)}return L2}
  return legFit(s,L);
}
// v2.18.3: a leg's centre line (hip, knee, foot) outside the body outline (its hull: a wet coat's locks leave notches), and the breed's own leg standing (hip to ground, as idle draws it)
function legOut(l,Q){if(!l.foot)return 0;const C=[l.hip,l.mid||[(l.hip[0]+l.foot[0])/2,(l.hip[1]+l.foot[1])/2],l.foot];let n=0;
  for(let i=0;i<2;i++){const a=C[i],b=C[i+1],d=Math.hypot(b[0]-a[0],b[1]-a[1]),st=Math.max(1,Math.ceil(d));for(let j=0;j<st;j++){const t=(j+.5)/st;if(!inPoly([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t],Q))n+=d/st}}return n}
function inPoly(p,Q){let c=false;for(let i=0,j=Q.length-1;i<Q.length;j=i++){const a=Q[i],b=Q[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function legStand(s,l){return GY-(l.near?0:3.5)-(s.body.y+s.body.ry*(l.near?.42:.22))}
const sitGround=(L,l)=>/^(sit|paw|scratch)$/.test(L.legMode)&&!l.raised&&(l.id==='FF'||l.id==='NF');
// ground 1: only the front legs a sitting dog stands on; 2: the legs on the ground; else every leg
function legLong(s,L,ground){const Q=hull(bodyPts(s).map(T(L.bT)));return L.legs.some(l=>l.foot&&(!ground||(ground===2?!l.raised:sitGround(L,l)))&&legOut(l,Q)>1.35*legStand(s,l))}
// a free leg (jumping, rolling, lying, a raised paw) that sticks out longer than the breed's own leg is drawn in toward its hip; a foot on the ground stays on it
function legFit(s,L){const Q=hull(bodyPts(s).map(T(L.bT)));
  L.legs.forEach(l=>{if(!l.foot||sitGround(L,l))return;const st=legStand(s,l);if(legOut(l,Q)<=1.35*st)return;
    const h=l.hip,m0=l.mid,f0=l.foot,gd=f0[1]>=GY-7,sc=(p,k)=>[h[0]+(p[0]-h[0])*k,gd?p[1]:h[1]+(p[1]-h[1])*k];
    for(let k=.95;k>.1;k-=.05){l.foot=sc(f0,k);if(m0)l.mid=sc(m0,k);if(legOut(l,Q)<=1.25*st)break}});
  return L}
function gfoldHead(s,L,rel,a){// greyhound sit/beg: head carried up on the long neck, above the chest
  const b=s.body,hd=s.head,sh=T(L.bT)([b.rx*.78,-b.ry*.55]);L.hT.x=sh[0]+hd.rx*.55;L.hT.y=sh[1]-hd.ry*1.5;L.hT.a=L.pose==='beg'?-8:-4;L.bT.x-=2}
function noseLocal(s){const f=s.face,hx=s.head.rx,hy=s.head.ry;return f.nose?[hx*f.nose[0],hy*f.nose[1]]:[hx*.66,hy*.26]}
// v2.19 (owner, 2 Nov 2026: "the neck looks twisted when a dog eats or drinks"): eating and drinking, the dog lowers its head straight down and forward to the bowl,
// in profile like its body: the head hangs just in front of the chest, nose down, on the neck tube (no more head pulled back over the chest, the ears flapping up).
// L.eatNose is where the nose lands (in the 240 box, facing right): the game stands the dog so it meets the bowl (PA.eatNose).
var EAT_A=34,EAT_X=.35,EAT_E=.7,EAT_P=.3,EAT_N=.95;
function eatHead(s,L){const b=s.body,hd=s.head,N=noseLocal(s),B=T(L.bT),ch=B([b.rx*.94,b.ry*.05]),nb=B([b.rx*.62,-b.ry*.3]);
  let q=rot(N,EAT_A),y=Math.min(176-q[1],GY-3-hd.ry);const drop=y-nb[1],A=EAT_A+Math.max(0,Math.min(14,(drop-20)*.3));q=rot(N,A);y=Math.min(176-q[1],GY-3-hd.ry);
  L.hT.a=A;L.hT.x=Math.max(ch[0]+hd.rx*EAT_X,nb[0]+(y-nb[1])*EAT_N);L.hT.y=y;L.eatNose=[L.hT.x+q[0],L.hT.y+q[1]]}

/* ---------- parts ---------- */
function earList(s){// the ear shapes in head-local px, before any pose rotation
  const hx=s.head.rx,hy=s.head.ry,ty=s.ears;
  const E=[];// {pts,pivot,front,flop,inner,col}
  const pr=(p)=>p.map(q=>[q[0]*hx,q[1]*hy]);
  if(ty==='prick'||ty==='tall'||ty==='giant'||ty==='mixed'){
    const tall=ty==='tall'?1.75:ty==='giant'?2.95:1.58;
    const back=pr([[-.78,-.42],[ty==='giant'?-1.12:-.6,-tall],[-.06,-.86]]),fr=pr([[.08,-.88],[ty==='giant'?.62:.52,-tall],[.78,-.38]]);
    if(ty!=='mixed')E.push({pts:back,pivot:pr([[-.42,-.7]])[0],side:-1,inner:ty!=='prick'});
    E.push({pts:fr,pivot:pr([[.43,-.7]])[0],side:1,inner:ty!=='prick',col:ty==='mixed'?s.dark:null});
  }
  if(ty==='flop2'||ty==='mixed'){E.push({pts:pr([[-.42,-.86],[-.95,-.62],[-1.18,.15],[-.95,.42],[-.72,-.12]]),pivot:pr([[-.6,-.78]])[0],side:-1,flop:1,col:ty==='mixed'?s.dark:null});}
  if(ty==='flop2')E.push({pts:pr([[.4,-.88],[.92,-.6],[1.12,.12],[.92,.4],[.7,-.1]]),pivot:pr([[.6,-.8]])[0],side:1,flop:1});
  if(ty==='bat'){E.push({pts:pr([[-.82,-.32],[-1.85,-2.05],[-1.35,-2.2],[-.12,-.86]]),pivot:pr([[-.45,-.62]])[0],side:-1,inner:1});E.push({pts:pr([[0,-.92],[1.12,-2.25],[1.5,-1.98],[.86,-.3]]),pivot:pr([[.43,-.62]])[0],side:1,inner:1})}
  if(ty==='rose2'){E.push({pts:pr([[-.42,-.9],[-.98,-.82],[-.92,-.45],[-.62,-.6]]),pivot:pr([[-.6,-.8]])[0],side:-1,flop:1});E.push({pts:pr([[.38,-.92],[.96,-.85],[.92,-.48],[.6,-.62]]),pivot:pr([[.6,-.8]])[0],side:1,flop:1})}
  if(ty==='roseG')E.push({pts:pr([[-.1,-.88],[-.95,-1.15],[-.75,-.7],[-.35,-.55]]),pivot:pr([[-.3,-.8]])[0],side:-1,flop:1});
  if(ty==='flopL'){E.push({pts:pr([[-.42,-.86],[-.98,-.62],[-1.22,.42],[-.98,.88],[-.72,.05]]),pivot:pr([[-.6,-.78]])[0],side:-1,flop:1});E.push({pts:pr([[.4,-.88],[.95,-.6],[1.16,.4],[.95,.85],[.7,.0]]),pivot:pr([[.6,-.8]])[0],side:1,flop:1})}
  if(ty==='curtain')E.push({pts:pr([[-.2,-.92],[-.9,-.78],[-1.26,.4],[-1.2,1.5],[-.98,1.95],[-.7,1.75],[-.5,.6]]),pivot:pr([[-.55,-.82]])[0],side:-1,flop:1,hair:1});// v2.11 afghan: one long silky ear hanging past the jaw
  if(ty==='dflop')E.push({pts:pr([[-.25,-.85],[-.85,-.6],[-1.02,.7],[-.7,1.0],[-.42,.2]]),pivot:pr([[-.5,-.75]])[0],side:-1,flop:1});
  if(ty==='semi'){// upright to about two thirds, then the tip folds forward and down
    E.push({pts:pr([[-.78,-.44],[-.66,-1.18],[-.5,-1.4],[-.12,-1.2],[-.3,-1.12],[-.06,-.86]]),pivot:pr([[-.42,-.7]])[0],side:-1,fold:[1,4]});
    E.push({pts:pr([[.08,-.88],[.24,-1.3],[.42,-1.5],[.84,-1.24],[.6,-1.2],[.78,-.38]]),pivot:pr([[.43,-.7]])[0],side:1,fold:[1,4]})}
  if(EARS_A[ty])EARS_A[ty](pr,E);// v2.12 ART A: the natural drop ear (dobie, corso, minpin)
  if(s.earW)E.forEach(e=>{const c=e.pivot;e.pts=e.pts.map(q=>[c[0]+(q[0]-c[0])*s.earW,q[1]])});// Frenchie: wider, rounder bat ears
  if(s.earTilt)E.forEach(e=>{e.pts=rotAbout(e.pts,e.flop?0:s.earTilt,e.pivot)});// v2.11 akita: small ears tipped forward
  if(s.earS)E.forEach(e=>{const c=e.pivot,k=s.earS;e.pts=e.pts.map(q=>[c[0]+(q[0]-c[0])*k,c[1]+(q[1]-c[1])*k])});
  if(s.earIn)E.forEach(e=>{if(!e.flop)e.inner=1});// v2.12 westie: pink inside the prick ears (new spec field earIn), so they read above the fluffy head
  return E;
}
function earAngle(s,mode,e){
    let a=0;
    if(mode==='droop')a=e.flop?-e.side*8:-e.side*-68*(/^(giant|bat)$/.test(s.ears)?.9:1);
    if(mode==='sleep')a=e.flop?0:e.side*48;
    if(mode==='fly')a=e.flop?e.side*-150+(e.side<0?0:300):-35;
    if(mode==='fly'&&e.flop&&s.earSwing)a=-e.side*s.earSwing;// v2.12 maltese, shihtzu: the long ears swing out behind (new spec field earSwing), not up like a rabbit's
    if(mode==='perk')a=e.flop?e.side*-10:e.side*6;
    if(mode==='eat'&&e.flop)a=e.side*-30;
    if(mode==='flat')a=e.flop?e.side*-35:(/^(giant|bat)$/.test(s.ears)?-78:-62)+(e.side<0?-8:0);
    if(mode==='droop'&&!e.flop)a=e.side*(/^(giant|bat)$/.test(s.ears)?38:62);
    return a;
}
function earPose(s,L,e){// the ear after its pose rotation; L.earFit (Astronaut Helmet only) shrinks it toward its root to stay inside that radius
  const a=L.ears==='eat'?-L.hT.a*(e.flop?EAT_E:EAT_P):earAngle(s,L.ears,e);let p=a?rotAbout(e.pts,a,e.pivot):e.pts;
  if(a&&e.flop)p=earOn(s,p,e);
  if(L.earFit){const R=L.earFit,c=e.pivot,at=k=>p.map(q=>[c[0]+(q[0]-c[0])*k,c[1]+(q[1]-c[1])*k]);let k=1;while(k>.3&&!at(k).every(q=>Math.hypot(q[0],q[1])<=R))k-=.05;if(k<1)p=at(k)}
  return p}
// v2.18.3 "All in one piece": a hanging ear turned by its pose (flying back, lying flat, eating) keeps its root on the skull. Turned about its root, a drop ear could swing clear of the
// head (the doberman's and the miniature pinscher's): an ear that reaches less than 2.5 px (a puppy's: 3.5 px, its lines are thicker) inside the skull outline slides in toward the middle of the
// head until it sits 1 px deeper than that (the crayon wobble then still leaves its colour on the skull's). Ears that reach the skull do not move.
function earDepth(P,Q){let dm=-99;P.forEach(q=>{let d=1e9;for(let i=0;i<Q.length;i++){const a=Q[i],b=Q[(i+1)%Q.length],ex=b[0]-a[0],ey=b[1]-a[1],t=Math.max(0,Math.min(1,((q[0]-a[0])*ex+(q[1]-a[1])*ey)/(ex*ex+ey*ey||1)));d=Math.min(d,Math.hypot(a[0]+ex*t-q[0],a[1]+ey*t-q[1]))}dm=Math.max(dm,inPoly(q,Q)?d:-d)});return dm}
function earOn(s,p,e){const H=headPts(s),c=e.pivot,m=Math.hypot(c[0],c[1])||1,u=[-c[0]/m,-c[1]/m];let q=p;
  const d0=s.pup?3.5:2.5;if(earDepth(dense(p,true,1),H)>=d0)return p;for(let t=0;t<=14&&earDepth(dense(q,true,1),H)<d0+1;t+=.5)q=p.map(v=>[v[0]+u[0]*t,v[1]+u[1]*t]);return q}
function curlyEar(h,s,p,HT,col){// Poodle: a long drop ear with a lumpy outline and two curls in it
  const P=dense(p,true,5.5);let cx=0,cy=0;P.forEach(q=>{cx+=q[0]/P.length;cy+=q[1]/P.length});
  const Q=P.map((q,i)=>{const dx=q[0]-cx,dy=q[1]-cy,m=Math.hypot(dx,dy)||1,k=i%2?2.6:-.4;return[q[0]+dx/m*k,q[1]+dy/m*k]});
  h.shape(Q.map(HT),col,{w:3.6,step:30,amp:.9});const c=curlCol(col);
  [[.0,-.05],[.05,.38]].forEach((o,i)=>{const x=cx+o[0]*(cx-p[0][0]),y=cy+o[1]*Math.abs(p[2][1]-p[0][1]);h.line(spiral(x,y,.5,3.6,1.25,8,i*2.1).map(HT),2,c,.3)})}
function drawTopknot(h,s,HT){// Poodle: a round pom of hair on top of the head, behind the skull outline
  const hx=s.head.rx,hy=s.head.ry;
  if(s.topknot===3)return knotD(h,s,HT);// v2.12 maltese, shihtzu: a gathered tuft with a bow
  if(s.topknot===2){// v2.11 afghan: a silky topknot swept back over the skull, a few long strands
    h.shape([[-hx*.92,-hy*.2],[-hx*1.05,-hy*.95],[-hx*.55,-hy*1.5],[hx*.12,-hy*1.62],[hx*.62,-hy*1.25],[hx*.5,-hy*.6]].map(HT),s.hcol,{step:30,amp:.8});
    const K=curlCol(s.hcol);[[-.1,-1.45,-.75,-.9],[.3,-1.35,-.35,-.75]].forEach(q=>h.line([[hx*q[0],hy*q[1]],[hx*(q[0]+q[2])/2+1.5,hy*(q[1]+q[3])/2],[hx*q[2],hy*q[3]]].map(HT),2,K,.3));return}
  h.shape(furR(s.wet,-hx*.1,-hy*.86,hx*.56,hy*.44,8,.2).map(HT),s.hcol,{step:30,amp:.8});
  [[-.3,-1.0],[.12,-1.06]].forEach((q,i)=>h.line(spiral(hx*q[0],hy*q[1],.5,3.6,1.25,8,i*2.4).map(HT),2,curlCol(s.hcol),.3))}
// v2.18.1: under a market hood (L.hmHood) the ears tuck in, and the stream moves on as the plain dog's ears would leave it
function drawEars(h,s,L,HT,front){if(!L.hmHood)return drawEars0(h,s,L,HT,front);hmPlain(h,g=>drawEars0(g,s,L,HT,front),g=>{L.hood=0;drawEars0(g,s,L,HT,front);L.hood=1})}
function drawEars0(h,s,L,HT,front){
  const mode=L.ears,col=s.ear||s.hcol,ef=(s.mixHead?SP[s.mixHead]:s).earFn;const HTg=q=>{const c=HT(q);return[c[0],Math.min(c[1],GY-1)]};// v2.11 curtain ears stop at the ground
  earList(s).forEach(e=>{
    const isFront=!!e.flop;if(isFront!==front||L.hood)return;
    let p=earPose(s,L,e);
    if(s.curlEar&&e.flop){if(e.side>0){const c=e.pivot,hx=s.head.rx;p=p.map(q=>[c[0]+(q[0]-c[0])*.84-hx*.16,c[1]+(q[1]-c[1])*.9])}curlyEar(h,s,p,HT,mix(e.col||col,PEN,.16));return}
    h.shape((s.earRound?chaikin(p,s.earRound):p).map(e.hair?HTg:HT),e.col||col,{w:3.8});
    if(ef)ef(h,s,e,p,HT);// v2.21 ART A: marks inside the ear just drawn (new spec field earFn: the dalmatian's spots)
    if(e.inner){const c=[(p[0][0]+p[2][0])/2,(p[0][1]+p[2][1])/2];const ip=p.map(q=>[c[0]+(q[0]-c[0])*.55,c[1]+(q[1]-c[1])*.55]);ip[1]=[c[0]+(p[1][0]-c[0])*.7,c[1]+(p[1][1]-c[1])*.7];h.shape((s.earRound?chaikin(ip,s.earRound):ip).map(HT),s.ears==='tall'?W:'#FFB8C4',{noline:1,ox:0,oy:0});}
    if(e.hair){const K=curlCol(e.col||col),lp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];[.35,.7].forEach((t,i)=>{const a=lp(p[0],p[1],t),b=lp(p[6],p[4],t),m=lp(a,b,.5);h.line([a,[m[0]+(i?-2:2),m[1]],b].map(HTg),2,K,.4)})}
    if(e.fold){const a=p[e.fold[0]],b=p[e.fold[1]],c=e.col||col;h.line([a,[(a[0]+b[0])/2,(a[1]+b[1])/2+1.5],b].map(HT),2.4,lum(c)<.32?mix(c,W,.45):mix(c,PEN,.45),.4)}
  });
}
function drawTail(h,s,L,B){
  const b=s.body,a=L.tailA,sc=L.tailS*(s.tsc||1),col=s.col;
  const base=[-b.rx*(b.long?.96:.86),-b.ry*.25];
  let aa=a,ss=sc;if(s.tail==='spiral'){if(L.pose==='sleep'){aa=22;ss=.82}else if(L.pose==='sit'){aa=-22;ss=.85}else if(L.pose==='sad'){aa=-34;ss=.84}if(s.spS&&/^(sleep|sit|sad)$/.test(L.pose))ss*=s.spS}
  if(s.plumeUp&&/^(sit|beg|yawn|howl|paw|scratch|dance)$/.test(L.pose)){aa=-L.bT.a*.85;ss=sc*.92}// v2.11 spitz: the plume stays curled over the back when sitting
  const map=pts=>pts.map(p=>{const q=rot([p[0]*ss,p[1]*ss],aa),c=B([base[0]+q[0],base[1]+q[1]]);return[c[0],Math.min(c[1],GY-2)]});
  switch(s.tail){
   case 'spiral':h.tube(map(spiral(-18,-46,4,30,1.55,26,2.0).reverse().concat([[0,0]]).reverse()),13*Math.min(1,ss*1.1),col,{ow:ss<1?5.5:undefined});break;
   case 'nub':h.shape(map(circ(-6,-4,10,8,9)),col);break;
   case 'wiggle':h.line(map([[0,0],[-12,-8],[-8,-18],[-20,-24],[-16,-34],[-28,-42]]),4.8);break;
   case 'thin':h.tube(map([[0,0],[-12,-8],[-18,-22],[-17,-36]]),6,col);break;
   case 'fluffy':{const tw=s.wet?10:14;h.tube(map([[0,0],[-22,-6],[-32,-26],[-24,-46]]),tw,col);h.tube(map([[-30,-34],[-24,-46]]),tw,s.wet?wetC(W):W,{ow:0});break}
   case 'sickle':h.tube(map([[0,0],[-8,-10],[-7,-22],[3,-27]]),5,col);break;
   case 'curl':h.tube(map(spiral(-7,-13,2,10,1.85,24,1.4).reverse().concat([[0,0]]).reverse()),6.5,col,{ow:5});break;
   case 'whip':h.tube(map([[0,0],[-14,10],[-24,26],[-24,42],[-14,50]]),3.6,col,{ow:4.6});break;
   case 'flag':h.tube(map([[0,0],[-5,-14],[-7,-30],[-5,-42]]),7.5,col);{const t=map([[-5,-42]])[0];h.dot(t[0],t[1],5.2,5.2,W)}break;
   case 'carrot':{const C=[[0,0],[-3,-9],[-5,-19],[-4,-28],[-1,-35]],lt=[],rt=[];C.forEach((p,i)=>{const w=6.6*(1-i/4)+1.3;lt.push([p[0]-w,p[1]]);rt.push([p[0]+w,p[1]])});
     h.shape(map(lt.concat(rt.reverse())),col,{step:30,amp:.8,w:3.6});h.line(map([[-1,-5],[-2.5,-17],[-2.5,-26]]),2,curlCol(col),.3);break}// v2.12 westie: short, thick at the root, straight up
   case 'line':h.line(map([[0,0],[-14,-10],[-10,-22],[-22,-30],[-22,-44]]),4.8);break;
   case 'pom':{h.tube(map([[0,0],[-6,-10],[-8,-22]]),4.2,col,{ow:4.6});const t=map([[-9,-29]])[0],z=9.5*Math.max(.6,ss);h.shape(furR(s.wet,t[0],t[1],z,z*.92,7,.22),col,{step:30,amp:.8,w:3.6});h.line(spiral(t[0]-1,t[1]-1,.5,3.6,1.25,8,.6),2,curlCol(col),.3);break}
   case 'plume':drawPlume(h,s,L,map,col);break;// v2.11 spitz and pom
   case 'ring':h.tube(map([[0,0],[-6,-10],[-8.5,-19]].concat(spiral(-3,-27,4.6,7.2,.86,14,2.3))),4.4,col,{ow:4.6});break;// v2.11 afghan: thin, a ring curl at the end
   case 'brush':{h.tube(map([[0,0],[-12,10],[-21,25],[-24,40],[-19,52]]),s.wet?9.5:12.5,col);h.line(map([[-3,-3],[-14,6],[-24,20],[-28,34]]),3.2,s.dark?mix(s.dark,col,.25):curlCol(col),.6);
     h.line(map([[-16,30],[-19,40],[-16,47]]),2,curlCol(col),.3);break}// v2.11 gsd: long, bushy, carried low, darker on top
   case 'low':h.tube(map([[0,0],[-8,11],[-13,24],[-12,38]]),8.4,col);break;// v2.11 mastiff: thick and hanging
  }  if(s.tailTip){const E={ring:[-1,-33],brush:[-19,52],low:[-12,38],plume:PLUME_TIP,pom:[-9,-29],spiral:[-18,-46],nub:[-8,-6],wiggle:[-28,-42],thin:[-17,-36],fluffy:[-24,-46],line:[-22,-44],sickle:[3,-27],curl:[-7,-13],whip:[-14,50]}[s.tail];if(E&&s.tail!=='fluffy'){const t=map([E])[0];h.dot(t[0],t[1],s.tail==='spiral'?6:4.5,s.tail==='spiral'?6:4.5,W);
    if(/^(line|wiggle|whip|plume|ring)$/.test(s.tail)){const i=h.acc.length-1;h.acc[i]=h.acc[i].replace('/>',` stroke="${INK}" stroke-width="2.2"/>`)}}}// 24 Nov 2026: where the tail ends thinner than its white tip (a stick tail, the plume's point, the afghan's ring) the tip gets its own ink ring (no new jitter)
  if(s.tailFn)s.tailFn(h,s,L,map,col);// v2.12 ART B: a breed's own tail drawing (new spec field tailFn)
}
/* v2.11: the plumed tail (spitz, pom) and the neck ruff (spitz, pom, a little on the akita) */
const PLUME=[[0,0],[-5,-12],[-3,-25],[6,-35],[20,-39],[33,-34],[40,-25]],PLUME_TIP=[40,-25];
function drawPlume(h,s,L,map,col){// a fat fluffy plume up off the rump and curled forward over the back, lumpy edge, two fur strokes
  const C=dense(PLUME,false,4),n=C.length,lt=[],rt=[];
  C.forEach((p,i)=>{const t=i/(n-1),a=C[Math.max(0,i-1)],b=C[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],m=Math.hypot(dx,dy)||1,w=s.wet?(3+8*Math.sin(Math.PI*Math.min(1,t*1.15)))*(i%3===1?1.32:.8):(3.5+11*Math.sin(Math.PI*Math.min(1,t*1.15)))*(i%2?1.16:.94);
   lt.push([p[0]-dy/m*w,p[1]+dx/m*w]);rt.push([p[0]+dy/m*w*.9,p[1]-dx/m*w*.9])});
  h.shape(map(lt.concat(rt.reverse())),col,{step:30,amp:.8,w:3.6});
  const K=curlCol(col);[[.18,.62,-2],[.4,.92,3]].forEach(q=>{const a=Math.floor(q[0]*(n-1)),b=Math.floor(q[1]*(n-1));h.line(map(C.slice(a,b).map(p=>[p[0]+q[2],p[1]+q[2]*.5])),2.2,K,.4)})}
function drawRuff(h,s,L,HT){// a big scalloped mane round the neck, behind the head (the head is drawn over most of it)
  if(s.ruffFn)return s.ruffFn(h,s,L,HT);// v2.12 ART B: a breed's own mane (new spec field ruffFn)
  const hx=s.head.rx,hy=s.head.ry,k=s.ruff,col=s.ruffK&&s[s.ruffK]?s[s.ruffK]:s.hcol,cl=q=>[q[0],Math.min(q[1],GY-1)];
  h.shape((s.wet?wetPts(-hx*.16,hy*.6,hx*.9*k,hy*.6*k,7,.36,.2):scallop(-hx*.16,hy*.6,hx*.98*k,hy*.66*k,9,.2)).map(HT).map(cl),col,{step:30,amp:.8,w:3.6});
  const K=curlCol(col);[[-.7,.95],[-.2,1.12],[.3,1.02]].forEach(q=>{const x=hx*q[0]*k,y=hy*q[1]*k;h.line([[x-3,y-5],[x,y],[x+3,y-5]].map(HT).map(cl),2,K,.3)})}
// v2.21 ART A: legs.toe, a white foot: the last 14% of the leg (as the sock, along the leg's bend), the far legs a shade darker; none = null (every older dog)
const legTc=(s,l)=>s.legs.toe?(l.near?s.legs.toe:mix(s.legs.toe,PEN,.28)):null;
function legToe(h,l,c){const C=[l.hip,l.mid||[(l.hip[0]+l.foot[0])/2+1,(l.hip[1]+l.foot[1])/2],l.foot],d1=Math.hypot(C[1][0]-C[0][0],C[1][1]-C[0][1]),d2=Math.hypot(C[2][0]-C[1][0],C[2][1]-C[1][1]),g=(d1+d2)*.86,
  sp=g<=d1?[C[0][0]+(C[1][0]-C[0][0])*g/(d1||1),C[0][1]+(C[1][1]-C[0][1])*g/(d1||1)]:[C[1][0]+(C[2][0]-C[1][0])*(g-d1)/(d2||1),C[1][1]+(C[2][1]-C[1][1])*(g-d1)/(d2||1)],P=g<d1?[sp,C[1],C[2]]:[sp,C[2]];
  h.acc.push(`<path d="${P.map((q,i)=>(i?'L':'M')+R1(q[0])+' '+R1(q[1])).join('')}" fill="none" stroke="${c}" stroke-width="${R1(l.w)}" stroke-linecap="round" stroke-linejoin="round"/>`)}
function drawLegs(h,s,L){
  const one=l=>{
    const a=h.acc.length;
    if(l.sitfoot&&L.gfold){const hp=T(L.bT)([-s.body.rx*.45,s.body.ry*.25]),y=GY-3.5;hock(h,s,L,l,hp,[hp[0]-s.body.ry*.2+8,y-7],[[hp[0]-s.body.ry*.2+8,y-7]]);h.tube([[hp[0]-s.body.ry*.2+8,y-7],[hp[0]+s.body.ry*1.9+8,y]],l.w*.95,l.col);h.shape(circ(hp[0]+s.body.ry*1.9+11,y,l.w*.8,l.w*.55,7),l.col,{w:2.6,ox:0,oy:0,sc:1,closed:1})}
    else if(l.sitfoot){const hp=T(L.bT)([-s.body.rx*.45,s.body.ry*.25]);hock(h,s,L,l,hp,[hp[0]+s.body.ry*.9+7,GY-7],ovalTop(hp[0]+s.body.ry*.9+9,GY-6,s.body.ry*.5+3,4));h.shape(circ(hp[0]+s.body.ry*.9+9,GY-6,s.body.ry*.5+3,4,8),legTc(s,l)||l.col,{w:3.4})}
    else{h.tube([l.hip,l.mid||[(l.hip[0]+l.foot[0])/2+1,(l.hip[1]+l.foot[1])/2],l.foot],l.w,l.col);
      if(L.paw&&l.foot&&(l.id==='NF'||l.id==='FF'))h.shape(circ(l.foot[0]+2,l.foot[1],l.w*.75,l.w*.6,7),legTc(s,l)||l.sock||l.col,{w:2.8,ox:0,oy:0,sc:1,closed:1});
      if(l.sock&&!l.raised){// the sock: the last 38% of the leg, along the leg's own bend and down the middle of its ink (25 Oct 2026: it used to cut the knee corner and poke out)
        const C=[l.hip,l.mid||[(l.hip[0]+l.foot[0])/2+1,(l.hip[1]+l.foot[1])/2],l.foot],d1=Math.hypot(C[1][0]-C[0][0],C[1][1]-C[0][1]),d2=Math.hypot(C[2][0]-C[1][0],C[2][1]-C[1][1]),g=(d1+d2)*.62,
          sp=g<=d1?[C[0][0]+(C[1][0]-C[0][0])*g/(d1||1),C[0][1]+(C[1][1]-C[0][1])*g/(d1||1)]:[C[1][0]+(C[2][0]-C[1][0])*(g-d1)/(d2||1),C[1][1]+(C[2][1]-C[1][1])*(g-d1)/(d2||1)],SP=g<d1?[sp,C[1],C[2]]:[sp,C[2]];
        h.acc.push(`<path d="${SP.map((q,i)=>(i?'L':'M')+R1(q[0])+' '+R1(q[1])).join('')}" fill="none" stroke="${l.sock}" stroke-width="${R1(l.w)}" stroke-linecap="round" stroke-linejoin="round"/>`)}
      if(s.legFn)s.legFn(h,s,L,l);// v2.21 ART A: marks on the leg (new spec field legFn: the dalmatian's spots)
      if(s.legs.toe&&!l.raised)legToe(h,l,legTc(s,l));// v2.21 ART A: white feet (new spec field legs.toe: the bernese, the aussie's white trim)
      if(s.pup&&!(L.paw&&(l.id==='NF'||l.id==='FF')))h.shape(s.pup===1?circ(l.foot[0]+1.5,l.foot[1]-l.w*PUPLEG[5],l.w*PUPLEG[4],l.w*.5,8):circ(l.foot[0]+2.5,l.foot[1]-l.w*.42,l.w*1.0,l.w*.66,8),legTc(s,l)||l.sock||l.col,{w:3,ox:0,oy:0,sc:1,closed:1});
      if(s.legs.pom){const m=l.mid||l.hip,t=.7,x=m[0]+(l.foot[0]-m[0])*t,y=m[1]+(l.foot[1]-m[1])*t;h.shape(furR(s.wet,x,y,l.w*1.05,l.w*.9,6,.25),l.sock||l.col,{step:30,amp:.6,w:3,ox:0,oy:0,sc:1})}
      if(s.legs.hair)legHair(h,l,s.wet)}
    if(L.feet&&FEET2[L.feet])FEET2[L.feet](h,s,L,l);// v2.24: a shoe on this leg's foot (outfit.feet)
    h.acc.splice(a,0,`<g class="pa-d-leg pa-d-leg-${l.id}">`);h.acc.push('</g>');
  };
  const only=h._legPass||'ground';const ok=l=>(only==='raised'?l.raised:!l.raised)&&(!h._legSkip||l.id!==h._legSkip)&&(!h._legOnly||l.id===h._legOnly);
  L.legs.filter(l=>!l.near&&!l.haunch&&ok(l)).forEach(one);L.legs.filter(l=>l.near&&!l.haunch&&ok(l)).forEach(one);
}
// v2.18.3 "All in one piece": a sitting dog's hind foot flat on the ground must meet the body (or its own thigh, th = [cx, cy, rx, ry]). When the body sits
// high (a long dog begging, a puppy), a hock joins them: a short leg from the hip (inside the body) down to the foot, drawn first so the body, thigh and
// foot lie over its ends. Feet that already meet the body draw nothing new, so those dogs stay exactly as they were.
function ovalTop(cx,cy,rx,ry){const P=[];for(let i=0;i<=8;i++){const a=Math.PI*(1+i/8);P.push([cx+Math.cos(a)*(rx+2.2),cy+Math.sin(a)*(ry+2.2)])}return P}
function hock(h,s,L,l,hip,foot,top,th){const Q=bodyPts(s).map(T(L.bT)),inTh=p=>th&&((p[0]-th[0])/th[2])**2+((p[1]-th[1])/th[3])**2<=1;
  if(top.some(p=>inPoly(p,Q)||inTh(p)))return;// on its own crayon stream, so the rest of the dog wobbles exactly as before
  const g=kit(rng(hashS('hock'+l.id+R1(hip[0])+R1(hip[1]))));g.setJ(h.getJ());g.cy=h.cy;g.tube([hip,[(hip[0]+foot[0])/2-2,(hip[1]+foot[1])/2],foot],R1(l.w*1.05),l.col);
  g.acc.forEach(a=>h.acc.push(a));for(let i=0;i<2;i++){h.bb[i]=Math.min(h.bb[i],g.bb[i]);h.bb[i+2]=Math.max(h.bb[i+2],g.bb[i+2])}}
function legHair(h,l,wet){// v2.11 afghan: flared silky trousers from the knee down, covering the foot
  const m=l.mid||[(l.hip[0]+l.foot[0])/2,(l.hip[1]+l.foot[1])/2],a=[l.hip[0]+(m[0]-l.hip[0])*.7,l.hip[1]+(m[1]-l.hip[1])*.7],f=l.foot,dx=f[0]-a[0],dy=f[1]-a[1],d=Math.hypot(dx,dy)||1,u=[dx/d,dy/d],n=[-u[1],u[0]],w=l.w,cl=q=>[q[0],Math.min(q[1],GY+1)];
  const P=(t,k,e)=>cl([a[0]+dx*t+n[0]*w*k+u[0]*e,a[1]+dy*t+n[1]*w*k+u[1]*e]);
  h.shape(wet?[P(0,-.66,0),P(.55,-.86,0),P(1,-1.0,1),P(1,-.62,6.5),P(1,-.2,1.5),P(1,.25,7),P(1,.7,1.5),P(1,1.02,5.5),P(.55,.86,0),P(0,.66,0)]:[P(0,-.72,0),P(.55,-1.08,0),P(1,-1.5,2.5),P(1,-.5,5),P(1,.5,3.5),P(1,1.5,4.5),P(.55,1.08,0),P(0,.72,0)],l.sock||l.col,{w:3,step:30,amp:.7,ox:0,oy:0,sc:1});// wet: clinging, three dripping strands
  h.line([P(.15,.1,0),P(.6,-.2,0),P(1,.1,1)],1.8,curlCol(l.sock||l.col),.3)}
function drawHaunch(h,s,L,B){
  const b=s.body;L.legs.filter(l=>l.haunch).forEach(l=>{
    const a=h.acc.length,c=B([-b.rx*.45,b.ry*.25]);
    if(L.gfold){// long folded thigh, then the hock and long foot flat along the ground
      const th=rotAbout(circ(c[0]+3,c[1]-2,b.ry*1.45,b.ry*.95,11),-28,[c[0]+3,c[1]-2]);const y=GY-4,hl=[c[0]-b.ry*.9,Math.min(c[1]+b.ry*.7,y-4)];
      h.tube([hl,[hl[0]+4,y],[c[0]+b.ry*2.1,y]],l.w*1.05,l.col);h.shape(circ(c[0]+b.ry*2.1+3,y,l.w*.85,l.w*.6,7),l.col,{w:2.8,ox:0,oy:0,sc:1,closed:1});h.shape(th,s.col);
    }else{
    {const th=s.fluff?null:[c[0],c[1]+2,b.ry*.95,b.ry*.85];hock(h,s,L,l,c,[c[0]+b.ry*.75,GY-5],ovalTop(c[0]+b.ry*.9,GY-4,b.ry*.6+3,4.5),th)}
    if(!s.fluff)h.shape(circ(c[0],c[1]+2,b.ry*.95,b.ry*.85,10),s.col);
    h.shape(circ(c[0]+b.ry*.9,GY-4,b.ry*.6+3,4.5,8),legTc(s,l)||l.col,{w:3.6});}
    if(L.feet&&FEET2[L.feet])FEET2[L.feet](h,s,L,l,1);// v2.24: the sitting hind foot's shoe
    h.acc.splice(a,0,`<g class="pa-d-leg pa-d-leg-NH">`);h.acc.push('</g>');
  });
}
function bodyPts(s){const b=s.body;if(b.sq){const x=b.rx,y=b.ry;return chaikin([[x*1.02,-y*.86],[x*1.06,y*.5],[x*.8,y*1.0],[-x*.1,y*.9],[-x*.82,y*1.0],[-x*1.04,y*.45],[-x*1.0,-y*.78],[-x*.3,-y*1.04],[x*.5,-y*1.0]],1)}// v2.11 dane, mastiff: a squarer box
  if(b.deep){const x=b.rx,y=b.ry;return [[x*1.02,-y*.45],[x*.95,y*.35],[x*.75,y*1.25],[x*.35,y*1.35],[0,y*.7],[-x*.4,y*.25],[-x*.78,y*.45],[-x*1.0,y*.1],[-x*.98,-y*.55],[-x*.55,-y*.95],[x*.1,-y*.92],[x*.7,-y*1.0]]}return s.fluff?(s.wet?wetPts(0,0,b.rx,b.ry,9,.24,.3):scallop(0,0,b.rx,b.ry,13,.13)):circ(0,0,b.rx,b.ry,b.long?18:15,b.lop||0)}
function headPts(s){const hd=s.head;if(s.sqHead){const x=hd.rx,y=hd.ry;return chaikin([[-x*.96,-y*.88],[x*.2,-y*1.02],[x*.98,-y*.84],[x*1.04,y*.7],[x*.52,y*1.0],[-x*.6,y*.98],[-x*1.02,y*.6]],2)}// v2.11 dane, mastiff
  return(s.hfluff===undefined?s.fluff:s.hfluff)?(s.wet?wetPts(0,0,hd.rx,hd.ry,8,.16,.15):scallop(0,0,hd.rx,hd.ry,10,.12)):circ(0,0,hd.rx,hd.ry,13,.04)}
function drawFace(h,s,L,HT){
  const f=L.face,hx=s.head.rx,hy=s.head.ry,sf=hx/33;
  const e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],er=s.eyes;
  const eyes=[[hx*e0[0],hy*e0[1],er[0]],[hx*e1[0],hy*e1[1],er[1]]];
  if(s.face.snout){const sl=s.face.snoutL||1.5,sd=s.face.snoutD,sn=[[hx*.5,-hy*.02],[hx*sl,hy*.0],[hx*(sl+.05),hy*(sd||.5)],[hx*.6,hy*(sd?sd+.12:.62)]],mc=s.face.snout===3?maskCol(s):0;
    if(s.face.jowl){const jy=sd||.5;h.shape([[hx*(sl-.04),hy*(jy-.1)],[hx*(sl+.02),hy*(jy+.3)],[hx*(sl-.22),hy*(jy+.5)],[hx*(sl-.5),hy*(jy+.4)],[hx*.62,hy*(jy+.12)]].map(HT).map(q=>[q[0],Math.min(q[1],GY-1)]),mc||s.hcol,{w:3.8});// v2.11 mastiff: droopy jowls, a little drool
      if(/^(idle|happy|eat|walk|hot)$/.test(L.pose)){const p=HT([hx*(sl-.3),hy*(jy+.5)]);if(p[1]<GY-12)h.shape([[p[0],p[1]],[p[0]+2.6,p[1]+7],[p[0],p[1]+10],[p[0]-2.6,p[1]+7]],'#9EDCFF',{w:2,ox:0,oy:0,sc:1,closed:1})}}
    h.shape(sn.map(HT),mc?s.hcol:s.face.snout===2?s.hcol:(s.face.snoutK&&s[s.face.snoutK])||s.light,{w:4.4});
    if(mc){const a=.42,y1=sd||.5;h.shape([[hx*(.5+(sl-.5)*a),-hy*.01],[hx*sl,0],[hx*(sl+.05),hy*y1],[hx*(.6+(sl-.6)*a),hy*(y1+.12)]].map(HT),mc,{noline:1,ox:0,oy:0,sc:.93})}}// v2.11: the dark mask on the front of the muzzle
  const bc=f.browCol&&lum(s.hcol)<.32?f.browCol:undefined;// light lines on a dark head (v2.5 collie)
  eyes.forEach((e,i)=>{
    const [x,y]=HT([e[0],e[1]]),r=e[2],m=f.eyes;
    if(L.ex&&L.ex.eye&&L.ex.eye(h,s,L,x,y,r,i,bc))return;// v2.13: an expression may draw its own eye (true = drawn)
    if(m==='happy'){h.line([[x-r,y+r*.35],[x,y-r*.55],[x+r,y+r*.35]],4.2,bc);return}
    if(m==='x'){h.line([[x-r*.8,y-r*.8],[x+r*.8,y+r*.8]],3.6,bc);h.line([[x+r*.8,y-r*.8],[x-r*.8,y+r*.8]],3.6,bc);return}
    if(m==='closed'){h.line([[x-r,y],[x,y+r*.5],[x+r,y]],3.8,bc);return}
    h.shape(circ(x,y,r,r*1.05,12),W,{ox:0,oy:0,sc:1,w:2.3,amp:.45,closed:1,famp:.25});
    let lx=.06,ly=.1;const lk=s.face.look&&(L.pose==='idle'||L.pose==='walk'||L.pose==='dirty')?s.face.look[i]:null;if(lk){lx=lk[0];ly=lk[1]}if(m==='hope'){lx=.15;ly=-.45}if(m==='strain'){lx=.1;ly=.1}if(m==='whistle'){lx=-.4;ly=-.5}if(m==='down'||m==='sad')ly=.6;if(m==='smug'){lx=.12;ly=.5}if(L.pose==='jump'){lx=.4;ly=-.35}if(L.pose==='eat')lx=.35;
    const px=x+lx*r*.4,py=y+ly*r*.4;
    const ir=s.irises?s.irises[i]:s.iris;if(ir){h.dot(px,py,r*.68,r*.72,ir);h.dot(px,py,r*.34,r*.36)}else{const pr=s.face.pupil||.57;h.dot(px,py,r*pr,r*(pr+.03))}
    h.dot(px-r*.2,py-r*.26,r*.2,r*.2,W);h.dot(px+r*.2,py+r*.22,r*.09,r*.09,W);
    if(m==='smug'){const ly2=y-r*.05;h.acc.push(`<path d="M${R1(x-r-1.5)} ${R1(ly2)}L${R1(x-r-1.5)} ${R1(y-r-3)}L${R1(x+r+1.5)} ${R1(y-r-3)}L${R1(x+r+1.5)} ${R1(ly2)}Z" fill="${s.hcol}"/>`);h.line([[x-r-2,ly2],[x+r+2,ly2]],3.4,bc)}
    const inner=i===0?1:-1;// brow: inner end is toward the other eye
    if(m==='strain'){h.line([[x-r*1.1,y-r*1.3-(inner>0?4:0)],[x+r*1.1,y-r*1.3-(inner>0?0:4)]],3,bc);if(i===0){h.acc.push(`<path d="M${R1(x-r-1.5)} ${R1(y-r*.15)}L${R1(x-r-1.5)} ${R1(y-r-3)}L${R1(x+r+1.5)} ${R1(y-r-3)}L${R1(x+r+1.5)} ${R1(y-r*.15)}Z" fill="${s.hcol}"/>`);h.line([[x-r-2,y-r*.15],[x+r+2,y-r*.15]],2.6,bc)}}
    else if(m==='whistle'){h.line([[x-r*1.1,y-r*1.6],[x+r*1.1,y-r*1.75]],2.6,bc)}
    else if(m==='hope'){h.dot(px+r*.22,py+r*.05,r*.12,r*.12,W);h.line([[x-r*1.1,y-r*1.45-(inner<0?5:0)],[x+r*1.1,y-r*1.45-(inner>0?5:0)]],2.6,bc)}
    else if(m==='sad')h.line([[x-r*1.1,y-r*1.25-(inner<0?5:0)],[x+r*1.1,y-r*1.25-(inner>0?5:0)]],3.6,bc);
    else if(f.brow==='angry'&&L.pose!=='happy'&&L.pose!=='pet')h.line([[x-r*1.15,y-r*1.3-(inner>0?0:6)],[x+r*1.15,y-r*1.3-(inner>0?6:0)]],4.6,bc);
    else if(f.eyes==='smug'&&i===1)h.line([[x-r*1.1,y-r*1.6],[x+r*1.1,y-r*2.1]],3.4,bc);
    else if(f.brow==='eager'&&m!=='down')h.line([[x-r*.55,y-r*2.0-(inner>0?0:2)],[x+r*.55,y-r*2.0-(inner>0?2:0)]],2.8,bc);
    else if(f.brow==='curious'&&i===1&&m!=='down')h.line([[x-r*1.1,y-r*1.7],[x,y-r*2.4],[x+r*1.2,y-r*1.9]],2.8,bc);
    else if(f.brow==='soft'&&m!=='down')h.line([[x-r*1.1,y-r*1.45-(inner>0?0:3)],[x+r*1.1,y-r*1.45-(inner>0?3:0)]],2.6,bc);
  });
  const N=noseLocal(s),[nx,ny]=HT(N);
  h.dot(nx,ny,4.6*sf,3.5*sf);if(L.blueNose)h.dot(nx+1.5*sf,ny-.5,2.6*sf,2*sf,'#7CC8FF');
  const M=p=>HT([N[0]+p[0]*sf,N[1]+p[1]*sf]);
  const mo=L.ex&&L.ex.mouth&&L.ex.mouth(h,s,L,M,sf,N)?'':f.mouth;// v2.13: an expression may draw its own mouth (true = drawn, the pose's mouth is skipped)
  const tongue=(len)=>{h.shape([[-9,8],[1,8],[0,8+len],[-5,11+len],[-10,8+len]].map(M),'#FF6F9A',{w:3,ox:0,oy:0,sc:1,closed:1});h.line([[-4.5,10],[-4.5,6+len]].map(M),2.2,'#C9406A')};
  if(mo==='smile'||mo==='tongue'||mo==='sleep'){if(mo==='tongue'){if(s.face.tside&&L.pose!=='happy'){h.shape([[-12,8],[-3,9],[-6,24],[-13,27],[-17,21]].map(M),'#FF6F9A',{w:3,ox:0,oy:0,sc:1,closed:1});h.line([[-9,11],[-11,21]].map(M),2.2,'#C9406A')}else tongue(L.pose==='happy'?16:11)}h.line([[-17,5],[-9,11],[0,9],[5,3]].map(M),mo==='sleep'?3:3.8)}
  if(mo==='pant'){h.shape([[-17,5],[4,4],[1,14],[-14,15]].map(M),'#7A1F2E',{w:3,ox:0,oy:0,sc:1});h.shape([[-11,10],[-1,10],[-1,30],[-6,34],[-12,30]].map(M),'#FF6F9A',{w:3,ox:0,oy:0,sc:1,closed:1});h.line([[-6,13],[-6,28]].map(M),2.2,'#C9406A')}
  if(mo==='yawn'){h.shape([[-17,2],[5,1],[4,24],[-6,30],[-15,24]].map(M),'#7A1F2E',{w:3.2,ox:0,oy:0,sc:1});h.shape([[-12,20],[0,19],[1,25],[-5,29],[-11,25]].map(M),'#FF6F9A',{noline:1,ox:0,oy:0});h.line([[-11,19],[-5,15],[0,19]].map(M),2,'#C9406A');h.line([[-15,3],[-14,7]].map(M),2.2,W);h.line([[2,2],[1,6]].map(M),2.2,W)}
  if(mo==='howl'){h.shape(circ(0,0,6,8,10).map(q=>M([q[0]-3,q[1]+15])),'#7A1F2E',{w:3.2,ox:0,oy:0,sc:1,closed:1})}
  if(mo==='bark'){h.shape([[-18,3],[6,1],[3,22],[-13,24]].map(M),'#7A1F2E',{w:3.2,ox:0,oy:0,sc:1});h.shape([[-11,16],[0,15],[-2,23],[-10,23]].map(M),'#FF6F9A',{noline:1,ox:0,oy:0});h.line([[-15,5],[-13,9]].map(M),2.4,W)}
  if(mo==='dead'){h.line([[-15,7],[-6,9],[3,7]].map(M),3);h.shape([[-8,8],[0,8],[1,20],[-4,24],[-9,19]].map(M),'#FF6F9A',{w:2.8,ox:0,oy:0,sc:1,closed:1})}
  if(mo==='tight'){h.line([[-15,10],[-10,8],[-5,11],[0,8],[4,10]].map(M),3.2)}
  if(mo==='whistle'){h.shape(circ(0,0,3.6,3.6,8).map(q=>M([q[0]-4,q[1]+11])),'#7A1F2E',{w:2.6,ox:0,oy:0,sc:1,closed:1})}
  if(mo==='smirk')h.line([[-16,9],[-6,11],[3,6],[7,0]].map(M),3.8);
  if(mo==='frown')h.line([[-16,14],[-7,8],[2,13]].map(M),3.8);
  if(mo==='sammy'){h.line([[-21,1],[-17,9],[-9,12],[-2,9],[4,7],[6,-2]].map(M),3.8,INK,1.6);h.line([[-22,-2],[-19,2]].map(M),2.2,PEN,.3);h.line([[8,-3],[8,2]].map(M),2.2,PEN,.3)}
  if(mo==='grump'){h.line([[-17,13],[-11,9],[-5,11],[1,9],[5,12]].map(M),3.6);h.line([[-20,6],[-17,13]].map(M),2.2,PEN,.4)}
  if(mo==='o')h.shape(circ(0,0,5,6.5,9).map(q=>M([q[0]-1,q[1]+16])),'#7A1F2E',{w:3.2,ox:0,oy:0,sc:1,closed:1});
  if(s.face.grinA&&(mo==='grin'||mo==='open'))grinA(h,M);// v2.12 ART A: the pitbull's wide grin
  else if(mo==='grin'||mo==='open'){h.shape([[-17,5],[4,4],[0,16],[-12,18]].map(M),'#7A1F2E',{w:3.4,ox:0,oy:0,sc:1});h.shape([[-12,13],[-1,12],[-3,18],[-10,18]].map(M),'#FF6F9A',{noline:1,ox:0,oy:0})}
  if(mo==='chew'){h.shape(circ(0,0,5,3.5,8).map(q=>M([q[0]-6,q[1]+9])),'#7A1F2E',{w:3,ox:0,oy:0,sc:1,closed:1});[[6,16],[-16,18],[2,24]].forEach(c=>{const p=M(c);h.dot(p[0],p[1],2,1.6,'#C98A4E')});if(L.k===1)h.text('nom',HT([N[0]+16*sf,N[1]-6*sf])[0],HT([N[0]+16*sf,N[1]-6*sf])[1],14,INK,-8)}
  if(s.face.drool&&(L.pose==='idle'||L.pose==='happy'||L.pose==='eat'||L.pose==='walk')){const p=M([-15,12]);h.shape([[p[0],p[1]],[p[0]+3,p[1]+7],[p[0],p[1]+10],[p[0]-3,p[1]+7]],'#9EDCFF',{w:2,ox:0,oy:0,sc:1,closed:1})}
  if(s.face.sweet&&!L.blush&&L.pose!=='sad'){[[hx*(e0[0]-.1),hy*(e0[1]+.48)],[hx*(e1[0]+.2),hy*(e1[1]+.5)]].forEach(p=>{const [x,y]=HT(p);h.acc.push(`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(7*sf)}" ry="${R1(4*sf)}" fill="#FF8FAE" opacity=".5"/>`)})}
  if(L.blush){[[hx*(e0[0]-.12),hy*(e0[1]+.5)],[hx*(e1[0]+.2),hy*(e1[1]+.5)]].forEach(p=>{const [x,y]=HT(p);h.acc.push(`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(9*sf)}" ry="${R1(5*sf)}" fill="#FF5C8A" opacity=".55"/>`);h.line([[x-6*sf,y+2],[x-2*sf,y-2],[x+2*sf,y+2],[x+6*sf,y-2]],2,'#E8326A')})}
  if(L.tear){const [x,y]=HT([eyes[1][0],eyes[1][1]]);const r=eyes[1][2];h.shape([[x,y+r+2],[x+4,y+r+10],[x,y+r+14],[x-4,y+r+10]],'#5BC8FF',{w:2.6,ox:0,oy:0,sc:1,closed:1})}
}

/* ---------- outfits ---------- */
const OUT={head:['Party Hat','Flower Crown','Acorn Cap','Rain Hat','Pom-pom Beanie','Chef Hat','Wizard Hat','Sun Hat','Cowboy Hat','Astronaut Helmet','Leaf Beret','Witch Hat','Reindeer Antlers','Year of the Sheep Hood','Sailor Cap','Crayon Crown'],eyes:['Heart Sunglasses','Explorer Goggles'],neck:['Red Bandana','Bow Tie','Seashell Necklace','Clover Collar','Rainbow Collar','Sailor Collar','Knit Scarf','Autumn Scarf','Parade Rosette','Candy Corn Bandana','Snowflake Snood','Ugly Sweater Rosette','Shibuya Bandana','Asakusa Bandana','Tokyo Tower Bandana','Sunflower Collar','Golden Collar','Lion Mane','Jingle Bell Collar'],body:['Yellow Raincoat','Knit Winter Sweater','Superhero Cape','Mossy Poncho','Frog Raincoat','Polka-dot Raincoat','Bubble Raincoat','Happi Coat','Bumblebee Suit','Cozy Hoodie','Tutu','Pyjamas','Ghost Sheet','Pumpkin Suit','Vampire Cape','Bat Wings','Very Ugly Sweater','Pumpkin Patch Suit','Trick-or-Treat Ghost','Little Bat Costume','Doggy Life Vest',
  'Little Witch Hat & Cape','Scarecrow Overalls','Mummy Wraps','Skeleton Suit','Black Cat Ears & Bow','Pirate Hat & Sash','Dinosaur Hood','Little Owl Wings','Wizard Robe & Star Hat',
  'Father Christmas Suit','Little Elf Outfit','Gingerbread Pup Suit','Snowman Suit','Polar Bear Hood','Penguin Suit','Puffer Jacket','Nutcracker Jacket & Hat','Snowflake Wings']};// v2.17.1 Halloween Market costumes; Winter Market 2026 costumes
function coatPts(s){const b=s.body,p=[],f=s.fluff?1.12:1.08;for(let a=-108;a<=108;a+=12){const t=a*D2R;p.push([Math.cos(t)*b.rx*f,Math.sin(t)*b.ry*(f+.04)])}return p}
function drawCape(h,s,L,B){
  // billows up and back behind the body, so most of it shows above the back and past the rump
  const b=s.body,fl=L.pose==='jump'?1.25:1,w=h.J(3),cw=Math.min(b.rx,s.fluff?32:46),nx=b.rx*.5,sl=L.pose==='sleep',up=(sl?.55:1)*(s.fluff?.6:1);
  const p=[[nx,-b.ry*.9],[nx-.5*cw,-b.ry*(1.25+.5*up)+w],[nx-1.2*cw*fl,-b.ry*(1.3+.9*up)],[nx-1.85*cw*fl,-b.ry*(1.0+.8*up)-w],[nx-2.05*cw*fl,-b.ry*.2],[nx-1.9*cw*fl,b.ry*.55+w],[nx-1.4*cw,b.ry*.4],[nx-.6*cw,-b.ry*.2]];
  h.shape(p.map(B).map(q=>[q[0],Math.min(q[1],GY)]),'#E8322B',{w:4.4});
  const st=B([nx-1.35*cw*fl,-b.ry*(1.0+.7*up)]);h.shape(circ(st[0],st[1],6,6,5).map((q,i)=>i%1?q:q),'#FFC21A',{w:2.6,ox:0,oy:0,sc:1});
}
function drawCapeTie(h,s,L,B){const b=s.body,c=B([b.rx*.5,-b.ry*.82]);h.dot(c[0],c[1],4.5,4.5,'#FFC21A');}
function drawCoat(h,s,L,B,kind){
  const b=s.body,p=coatPts(s);
  if(BODY2[kind])return BODY2[kind](h,s,L,B,p);
  if(kind==='Frog Raincoat'||kind==='Polka-dot Raincoat'||kind==='Bubble Raincoat'){
    const hood=B([b.rx*.62,-b.ry*1.05]),bub=kind==='Bubble Raincoat',col=kind==='Frog Raincoat'?'#7BCB5A':kind==='Polka-dot Raincoat'?'#FF8FB8':'#CFEFFF';
    h.shape(circ(hood[0]-4,hood[1]-2,b.ry*.75,b.ry*.6,9),col,{w:3.6,fop:bub?.45:0});h.shape(p.map(B),col,{w:3.8,fop:bub?.42:0});
    if(kind==='Frog Raincoat'){[-1,1].forEach(sd=>{const e0=B([b.rx*(.18+sd*.16),-b.ry*1.12]),e=[e0[0],e0[1]];h.shape(circ(e[0],e[1],5.5,5.5,8),'#7BCB5A',{w:2.6,ox:0,oy:0,sc:1,closed:1});h.dot(e[0],e[1]-.5,3.4,3.4,W);h.dot(e[0]+.6,e[1],1.8,1.8,INK)});
      h.line([[b.rx*.05,b.ry*.35],[b.rx*.35,b.ry*.5],[b.rx*.65,b.ry*.35]].map(B),2.4,'#3E8A35');[[b.rx*.4,-b.ry*.1],[b.rx*.45,b.ry*.25]].forEach(q=>{const c=B(q);h.dot(c[0],c[1],2.8,2.8,'#3E8A35')})}
    if(kind==='Polka-dot Raincoat'){for(let i=0;i<9;i++){const a=-.9+i*.22,q=[Math.cos(a*2)*b.rx*(.2+(i%3)*.28),(i%3-1)*b.ry*.42],c=B(q);h.dot(c[0],c[1],3.6,3.6,W)}h.line(p.slice(-6).map(B),5.5,'#E04F86',.7)}
    if(kind==='Bubble Raincoat'){h.line([[-b.rx*.6,-b.ry*.55],[-b.rx*.2,-b.ry*.85]].map(B),3.6,W,.3);h.line([[b.rx*.55,-b.ry*.5],[b.rx*.7,-b.ry*.15]].map(B),3,W,.3);[[-b.rx*.3,b.ry*.2],[b.rx*.2,b.ry*.4]].forEach(q=>{const c=B(q);h.acc.push(`<circle cx="${R1(c[0])}" cy="${R1(c[1])}" r="3" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>`)});h.line(p.slice(-6).map(B),3.6,'#8CC8E8',.7)}
    return}
  if(kind==='Mossy Poncho'){const f=s.fluff?1.14:1.1,cw=Math.min(b.rx,58),top=[];for(let a=-172;a<=-8;a+=14){const t=a*D2R;top.push([b.rx*.5+Math.cos(t)*cw*f,Math.sin(t)*b.ry*f])}
    const fr=[];const x0=top[top.length-1][0],x1=top[0][0];for(let i=0;i<=10;i++){const x=x0+(x1-x0)*i/10;fr.push([x,b.ry*(.38+(i%2?.16:0))])}
    h.shape(top.concat(fr).map(B),'#86B46A',{w:3.8,step:9});
    for(let i=0;i<9;i++){const q=[b.rx*.5+(h.r()-.5)*cw*1.5,-b.ry*(.15+h.r()*.6)],c=B(q);h.dot(c[0],c[1],2.4,1.8,'#5E8F4E')}
    for(let i=1;i<10;i+=2){const x=x0+(x1-x0)*i/10;h.line([[x,b.ry*.5],[x+1,b.ry*.72]].map(B),2,'#5E8F4E')}
    const lf=B([b.rx*.2,-b.ry*.72]);h.shape([[lf[0]-7,lf[1]+2],[lf[0],lf[1]-7],[lf[0]+8,lf[1]+1],[lf[0],lf[1]+6]],'#B6D96B',{w:2.4,ox:0,oy:0,sc:1});h.line([[lf[0]-6,lf[1]+2],[lf[0]+7,lf[1]+1]],1.6,'#5E8F4E');return}
  if(kind==='Yellow Raincoat'){const hood=B([b.rx*.62,-b.ry*1.05]);h.shape(circ(hood[0]-4,hood[1]-2,b.ry*.75,b.ry*.6,9),'#FFF27A',{w:4.2});h.shape(p.map(B),'#FFF27A',{w:4.6});h.line(p.slice(-6).map(B),6.5,'#1FA6A0',.7);h.line(p.slice(0,5).map(B),6.5,'#1FA6A0',.7);h.line([[-b.rx*.15,b.ry*.62],[b.rx*.9,b.ry*.5]].map(B),4,W,.5);h.line([[b.rx*.25,-b.ry*.9],[b.rx*.55,-b.ry*.35],[b.rx*.85,-b.ry*.75]].map(B),3.6);
    [[b.rx*.35,b.ry*.05],[b.rx*.4,b.ry*.55]].forEach(q=>{const c=B(q);h.dot(c[0],c[1],3.2,3.2)});h.line([[-b.rx*.1,b.ry*.3],[b.rx*.1,b.ry*.32]].map(B),3);}
  else{h.shape(p.map(B),'#D7263D',{w:4.6});
    [-.32,.22].forEach(yy=>{const y=yy*b.ry*1.05,half=Math.sqrt(Math.max(0,1-yy*yy))*b.rx*1.02,x0=-b.rx*.24,pts=[];for(let x=x0,i=0;x<half-3;x+=7,i++)pts.push([x,y+(i%2?-3.5:3.5)]);if(pts.length>1)h.line(pts.map(B),3.2,W,.6)});
    const hm=[];for(let i=0;i<5;i++){const yy=-.95+i*.47;hm.push([-b.rx*.2,yy*b.ry],[-b.rx*.32,yy*b.ry])}
    h.line([[b.rx*.84,-b.ry*.72],[b.rx*1.02,-b.ry*.15]].map(B),6,'#9E1426',.6);}
}
function neckAnchor(s,HT){const hx=s.head.rx,hy=s.head.ry;return{c:HT([-hx*.12,hy*.86]),l:HT([-hx*.62,hy*.72]),r:HT([hx*.42,hy*.86]),tip:HT([-hx*.2,hy*1.5])}}
function clampG(p){return[p[0],Math.min(p[1],GY+5)]}
function drawNeck(h,s,L,HT,kind){
  if(NECK2[kind])return NECK2[kind](h,s,L,HT);
  if(kind==='Autumn Scarf')return drawAScarf(h,s,L,HT);if(kind==='Candy Corn Bandana')return drawCandyCorn(h,s,L,HT);if(kind==='Parade Rosette')return drawRosette(h,s,L,HT);
  if(kind==='Sailor Collar')return drawSailor(h,s,L,HT);if(kind==='Knit Scarf')return drawScarf(h,s,L,HT);
  const a=neckAnchor(s,HT);
  if(kind==='Red Bandana'){const t=clampG(a.tip);h.shape([a.l,a.r,t],'#E8322B',{w:4,step:9});
    [[.35,.3],[.55,.5],[.6,.25]].forEach(q=>{const x=a.l[0]+(a.r[0]-a.l[0])*q[0]+(t[0]-(a.l[0]+a.r[0])/2)*q[1],y=a.l[1]+(a.r[1]-a.l[1])*q[0]+(t[1]-(a.l[1]+a.r[1])/2)*q[1];h.dot(x,y,1.8,1.8,W)});}
  else if(kind==='Seashell Necklace'||kind==='Clover Collar'){
    const sag=t=>{const x=a.l[0]+(a.r[0]-a.l[0])*t,y=a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*8;return[x,Math.min(y,GY-18)]};
    const pts=[];for(let i=0;i<=8;i++)pts.push(sag(i/8));
    if(kind==='Clover Collar'){h.line(pts,6.5,INK);h.line(pts,4.2,'#3FA24A',.4);const c=sag(.55);
      [[0,-6],[6,0],[0,6],[-6,0]].forEach(o=>h.shape(circ(c[0]+o[0],c[1]+5+o[1],4.6,4.6,7),'#5CC461',{w:2.2,ox:0,oy:0,sc:1,closed:1}));h.dot(c[0],c[1]+5,2,2,'#FFD84A');h.line([[c[0]+2,c[1]+10],[c[0]+5,c[1]+16]],2,'#3FA24A');
      h.acc.push(`<path d="M${R1(c[0]+12)} ${R1(c[1]-6)}l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" fill="#FFD84A" stroke="${INK}" stroke-width="1"/>`)}
    else{h.line(pts,2.2,INK);[.2,.4,.6,.8].forEach((t,i)=>{const c=sag(t);if(i%2){h.dot(c[0],c[1]+2,2.6,2.6,'#FFF6EE')}else{const sh=[];for(let j=0;j<=6;j++){const an=Math.PI*(1.1+j/6*.8);sh.push([c[0]+Math.cos(an)*8.5,c[1]+10+Math.sin(an)*11])}sh.push([c[0],c[1]+10]);h.shape(sh,i?'#FFD2C2':'#FFE7B8',{w:2.2,step:6,ox:0,oy:0,sc:1,closed:1});h.line([[c[0],c[1]+9],[c[0]-3,c[1]+2]],1.2,INK);h.line([[c[0],c[1]+9],[c[0]+3,c[1]+2]],1.2,INK)}})}}
  else if(kind==='Rainbow Collar'){
    const sag=t=>{const x=a.l[0]+(a.r[0]-a.l[0])*t,y=a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*8;return[x,Math.min(y,GY-18)]};
    const cols=['#E5533D','#F29A38','#F2D04B','#6DBE5A','#4F8FD6','#8E63C7'];
    const pts=[];for(let i=0;i<=8;i++)pts.push(sag(i/8));
    cols.forEach((col,i)=>{const offset=i*1.8-4.5;const offsetPts=pts.map(p=>[p[0],p[1]+offset]);h.line(offsetPts,2.8,col)});
    const tipPt=sag(.55);const starX=R1(tipPt[0]+8),starY=R1(tipPt[1]+10);
    // v2.6.1: the tag is a 5-point star (it was a 4-point sparkle), same centre and size
    const sc=starY+4.2,sp=[];for(let i=0;i<10;i++){const an=-Math.PI/2+i*Math.PI/5,rr=i%2?2.1:5;sp.push(R1(starX+Math.cos(an)*rr)+' '+R1(sc+Math.sin(an)*rr))}
    h.acc.push(`<path d="M${sp.join('L')}Z" fill="#F2C14E" stroke="${INK}" stroke-width="0.8" stroke-linejoin="round"/>`);}
  else{const c=a.c,d=[a.r[0]-a.l[0],a.r[1]-a.l[1]],m=Math.hypot(d[0],d[1])||1,u=[d[0]/m,d[1]/m],v=[-u[1],u[0]],S=11;
    const P=(x,y)=>[c[0]+u[0]*x+v[0]*y,c[1]+u[1]*x+v[1]*y];
    h.shape([P(0,0),P(-S*1.2,-S*.7),P(-S*1.3,S*.75)],'#2D6CDF',{w:3.6,step:8});h.shape([P(0,0),P(S*1.2,-S*.75),P(S*1.2,S*.7)],'#2D6CDF',{w:3.6,step:8});h.shape(circ(...P(0,0),3.6,3.6,6),'#1B4AA8',{w:3,ox:0,oy:0,sc:1,closed:1});}
}
function drawHat(h,s,L,HT,kind){
  if(HAT2[kind])return HAT2[kind](h,s,L,HT);
  const hx=s.head.rx,hy=s.head.ry;
  if(kind==='Rain Hat'){const base=[hx*.06,-hy*.7],P=p=>{const q=rot(p,-6);return HT([base[0]+q[0],base[1]+q[1]])},W2=hx*.62,H=hy*.6,cap=[];
    for(let i=0;i<=10;i++){const an=Math.PI+i/10*Math.PI;cap.push([Math.cos(an)*W2*.78,Math.sin(an)*H])}
    h.shape([[-W2*1.35,4],[-W2*.9,-2],[W2*.9,-2],[W2*1.15,2],[W2*.9,8],[-W2,8]].map(P),'#FFD43B',{w:3.4,step:8});h.shape(cap.map(P),'#FFD43B',{w:3.6,step:8});
    h.line([[-W2*.7,-H*.35],[W2*.7,-H*.38]].map(P),1.6,'#C99A12');h.line([[-W2*.4,0],[-W2*.5,H*.9]].map(P),1.8);return}
  if(kind==='Pom-pom Beanie'){const base=[hx*.06,-hy*.72],P=p=>{const q=rot(p,-4);return HT([base[0]+q[0],base[1]+q[1]])},W2=hx*.66,H=hy*.66,cap=[];
    for(let i=0;i<=10;i++){const an=Math.PI+i/10*Math.PI;cap.push([Math.cos(an)*W2,Math.sin(an)*H])}h.shape(cap.map(P),'#E8506A',{w:3.6,step:8});
    for(let i=-2;i<=2;i++)h.line([[i*W2*.32,-2],[i*W2*.28,-H*.75]].map(P),1.5,'#B5304A');h.shape([[-W2*1.05,-6],[W2*1.05,-6],[W2*1.05,6],[-W2*1.05,6]].map(P),'#FFF1E8',{w:3,step:8});
    const t=P([0,-H-4]);h.shape(scallop(t[0],t[1],7,7,7,.22),'#FFF1E8',{w:2.6,step:30,ox:0,oy:0,sc:1});return}
  if(kind==='Acorn Cap'){const base=[hx*.08,-hy*.78],P=p=>{const q=rot(p,-6);return HT([base[0]+q[0],base[1]+q[1]])};const W2=hx*.58,H=hy*.55,cap=[];
    for(let i=0;i<=10;i++){const an=Math.PI+i/10*Math.PI;cap.push([Math.cos(an)*W2,Math.sin(an)*H])}h.shape(cap.map(P),'#B07A45',{w:3.6,step:8});
    for(let i=-2;i<=2;i++){h.line([[i*W2*.3-W2*.2,-H*.1],[i*W2*.3+W2*.2,-H*.8]].map(P),1.4,'#7A4E26');h.line([[i*W2*.3+W2*.2,-H*.1],[i*W2*.3-W2*.2,-H*.8]].map(P),1.4,'#7A4E26')}
    h.line([[-W2*1.02,0],[W2*1.02,0]].map(P),3.4);h.tube([[0,-H],[3,-H-8]].map(P),3,'#7A4E26',{ow:3});return}
  if(kind==='Party Hat'){const base=/^(giant|bat)$/.test(s.ears)?[hx*.0,-hy*.82]:[hx*.12,-hy*.86],t=8,P=p=>{const q=rot(p,t);return HT([base[0]+q[0],base[1]+q[1]])};
    const W2=hx*.42,H=hy*1.25;h.shape([[-W2,0],[0,-H],[W2,0]].map(P),'#FF5CA8',{w:4,step:9});
    h.line([[-W2*.6,-H*.3],[W2*.6,-H*.32]].map(P),3.6,'#FFE14D',.6);h.line([[-W2*.32,-H*.62],[W2*.3,-H*.6]].map(P),3.4,'#38C6F4',.6);
    const top=P([0,-H]);h.shape(circ(top[0],top[1],5.5,5.5,8),'#FFE14D',{w:3.2,ox:0,oy:0,sc:1,closed:1});}
  else{const pts=[];for(let i=0;i<=6;i++){const t=i/6,a=Math.PI*(1-t);pts.push([Math.cos(a)*hx*.86,-hy*.45-Math.sin(a)*hy*.55])}
    h.line(pts.map(HT),4,'#2E9E3E');const cols=['#FF6FA8','#FFE14D','#B98CFF','#FF8A3D','#FF6FA8'];
    [1,2,3,4,5].forEach((i,j)=>{const c=HT(pts[i]);for(let k=0;k<5;k++){const a=k/5*Math.PI*2;h.dot(c[0]+Math.cos(a)*4.2,c[1]+Math.sin(a)*4.2,3.4,3.4,cols[j])}h.dot(c[0],c[1],2.4,2.4,'#FF9E1A')});}
}
function drawGoggles(h,s,L,HT){
  const f=s.face,hx=s.head.rx,hy=s.head.ry,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],er=s.eyes;
  const a=HT([hx*e0[0],hy*e0[1]]),b=HT([hx*e1[0],hy*e1[1]]),s0=Math.max(er[0],7)+4.5,s1=Math.max(er[1],7)+4.5;
  h.line([HT([-hx*.98,-hy*.25]),[a[0]-s0,a[1]]],5.5,'#8A5A34',.5);
  h.line([[a[0]+s0*.8,a[1]],[b[0]-s1*.8,b[1]]],4,'#8A5A34',.5);
  [[a,s0],[b,s1]].forEach(([c,z])=>{h.shape(circ(c[0],c[1],z,z,12),'#BFE6F7',{w:4.6,ox:0,oy:0,sc:1,closed:1,famp:.3,fop:.55,amp:.5});h.acc.push(`<circle cx="${R1(c[0])}" cy="${R1(c[1])}" r="${R1(z-2.6)}" fill="none" stroke="#C9A06A" stroke-width="2.2"/>`);h.line([[c[0]-z*.45,c[1]-z*.15],[c[0]-z*.1,c[1]-z*.5]],2.2,W,.2)});
}
function drawGlasses(h,s,L,HT){
  const f=s.face,hx=s.head.rx,hy=s.head.ry,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],er=s.eyes;
  const a=HT([hx*e0[0],hy*e0[1]]),b=HT([hx*e1[0],hy*e1[1]]),s0=Math.max(er[0],7)+5,s1=Math.max(er[1],7)+5;
  h.line([a,[(a[0]+b[0])/2,Math.min(a[1],b[1])-4],b],3.2);h.line([a,HT([-hx*.85,-hy*.2])],3.2);
  [[a,s0],[b,s1]].forEach(([c,z])=>{const p=[];for(let i=0;i<14;i++){const t=i/14*Math.PI*2;p.push([c[0]+z*.06*16*Math.pow(Math.sin(t),3),c[1]+1-z*.06*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))])}h.shape(p,'#FF2E74',{w:3.2,step:30,ox:0,oy:0,sc:1,famp:.4,fop:.88,amp:.6});h.dot(c[0]-z*.35,c[1]-z*.3,z*.18,z*.12,W)});
}
/* ---------- v2.4 Shop Day outfits ---------- */
// hat-local space: x right (toward the nose), y up is negative; P maps it onto the head like the Party Hat base point
function hatP(s,L,HT,dy,t){const hx=s.head.rx,hy=s.head.ry,sq=L.pose==='rollover'?.55:1,base=/^(giant|bat)$/.test(s.ears)?[0,-hy*(.82+dy)]:[hx*.1,-hy*(.84+dy)];return p=>{const q=rot([p[0],p[1]*sq],t);return HT([base[0]+q[0],base[1]+q[1]])}}
function star5(h,c,z,fill,w){const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?z*.45:z;p.push([c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r])}h.shape(p,fill,{w:w||2,step:30,ox:.6,oy:-.4,sc:1,amp:.35,famp:.3,closed:1})}
const HAT2={
 'Chef Hat'(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,0,6),W2=hx*.44,H=hy*1.2;
  h.shape(scallop(0,-H*.74,W2*1.42,H*.34,6,.16).map(P),W,{w:3.8,step:30,amp:.8});
  [[-.62,-.6,-.4,-.98],[.05,-.56,.15,-1.02],[.7,-.62,.55,-.92]].forEach(q=>h.line([[W2*q[0],H*q[1]],[W2*q[2],H*q[3]]].map(P),1.8,'#C9BFB0',.6));
  h.shape([[-W2,3],[-W2*1.06,-H*.52],[W2*1.06,-H*.52],[W2,3]].map(P),W,{w:3.6,step:8});
  for(let i=-2;i<=2;i++)h.line([[i*W2*.4,0],[i*W2*.43,-H*.46]].map(P),1.6,'#C9BFB0',.4);
  h.crayon(W2,H*.3,q=>P([q[0],q[1]-H*.62]),'#E8E2D8',4)},
 'Wizard Hat'(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.02,4),W2=hx*.46,H=hy*1.4,PU='#7B4FC9';
  h.shape([[-W2,0],[-W2*.5,-H*.52],[-W2*.22,-H*.8],[-W2*.55,-H*.98],[-W2*1.1,-H*.92],[-W2*.75,-H*1.1],[-W2*.05,-H*1.04],[W2*.18,-H*.66],[W2,0]].map(P),PU,{w:3.8,step:8});
  h.line([[-W2*.9,-4],[W2*.9,-4]].map(P),4.2,'#FFD84A',.5);
  h.shape(circ(0,1,W2*1.8,5.5,14).map(P),'#6A3FB5',{w:3.6,step:8});
  [[-.25,-.32,6],[.32,-.2,4.5],[-.08,-.62,4.5]].forEach(q=>star5(h,P([W2*q[0],H*q[1]]),q[2],'#FFE14D',1.8));
  const tp=P([-W2*1.1,-H*.92]);h.dot(tp[0],tp[1],3,3,'#FFE14D')},
 'Sun Hat'(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,.1,-6),W2=hx*.52,H=hy*.56,SW='#F4D27A',DK='#C9A04E',PK='#FF7EB6';
  const k=P([-W2*.96,-6]);h.tube([k,P([-W2*1.75,-2]),P([-W2*2.25,7])],3.4,PK,{ow:3});h.tube([k,P([-W2*1.55,3]),P([-W2*1.85,13])],3.4,PK,{ow:3});
  const br=[];for(let i=0;i<18;i++){const a=i/18*Math.PI*2;br.push([Math.cos(a)*hx*1.3*(1+.04*Math.sin(a*6)),2+Math.sin(a)*8.5])}
  h.shape(br.map(P),SW,{w:3.8,step:9});
  for(let i=-5;i<=5;i++){if(Math.abs(i)<2)continue;h.line([[i*hx*.22,-3],[i*hx*.24,7]].map(P),1.4,DK,.4)}
  h.line(br.slice(1,8).map(q=>[q[0]*.86,q[1]*.7]).map(P),1.4,DK,.4);
  const cap=[];for(let i=0;i<=10;i++){const an=Math.PI+i/10*Math.PI;cap.push([Math.cos(an)*W2,Math.sin(an)*H*1.2-2])}h.shape(cap.map(P),SW,{w:3.6,step:8});
  [[-.55,-.45,-.2,-.95],[.05,-.35,.35,-.9]].forEach(q=>h.line([[W2*q[0],H*q[1]],[W2*q[2],H*q[3]]].map(P),1.4,DK,.4));
  h.line([[-W2*.98,-6],[W2*.98,-6]].map(P),5.5,PK,.5);h.shape(circ(k[0],k[1],4,3.4,7),'#FF5CA8',{w:2.4,ox:0,oy:0,sc:1,closed:1})},
 'Cowboy Hat'(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,.05,-4),W2=hx*.52,H=hy*.74,BR='#A8683A',DK='#6E3F1C';
  h.shape([[-W2*.82,0],[-W2*.92,-H*.78],[-W2*.55,-H*1.04],[-W2*.08,-H*.84],[W2*.3,-H*1.06],[W2*.84,-H*.86],[W2*.82,0]].map(P),BR,{w:3.8,step:8});
  h.line([[-W2*.08,-H*.84],[-W2*.02,-H*.5]].map(P),2,DK,.4);
  h.line([[-W2*.84,-H*.2],[W2*.84,-H*.22]].map(P),4.6,'#4A2A14',.4);const bk=P([W2*.3,-H*.21]);h.dot(bk[0],bk[1],2.6,2.2,'#FFD84A');
  h.shape([[-W2*1.9,-H*.5],[-W2*1.82,-H*.18],[-W2*1.45,1.5],[-W2*.6,5],[W2*.6,5],[W2*1.45,1.5],[W2*1.82,-H*.18],[W2*1.9,-H*.5],[W2*1.62,-H*.42],[W2*1.3,-H*.12],[W2*.6,-2],[-W2*.6,-2],[-W2*1.3,-H*.12],[-W2*1.62,-H*.42]].map(P),BR,{w:3.6,step:7});
  h.line([[-W2*1.35,1],[-W2*.5,3.2],[W2*.5,3.2],[W2*1.35,1]].map(P),1.6,DK,.4)},
 'Astronaut Helmet'(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,pts=circ(0,0,hx,hy,16),N=noseLocal(s);
  earList(s).forEach(e=>earPose(s,L,e).forEach(q=>pts.push(q)));
  pts.push([N[0]+hx*.16,N[1]],[N[0],N[1]+hy*.55],[N[0]-hx*.3,N[1]+hy*.5]);
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;pts.forEach(q=>{x0=Math.min(x0,q[0]);y0=Math.min(y0,q[1]);x1=Math.max(x1,q[0]);y1=Math.max(y1,q[1])});
  const cx=(x0+x1)/2,cy=(y0+y1)/2,a=(x1-x0)/2,b=(y1-y0)/2;let k=0;pts.forEach(q=>{k=Math.max(k,Math.hypot((q[0]-cx)/a,(q[1]-cy)/b))});
  const lie=/^(rollover|playdead)$/.test(L.pose),rx=Math.min(a*k+5,lie||!s.face.snout?hx*1.75:a*1.06+4),ry=Math.min(b*k+5,hy*1.7),E=(an,f)=>[cx+Math.cos(an*D2R)*rx*f,cy+Math.sin(an*D2R)*ry*f],cl=q=>[q[0],Math.min(q[1],GY+3)];
  const bub=[];for(let i=0;i<24;i++)bub.push(E(i*15,1));
  h.shape(bub.map(HT).map(cl),'#CFEFFF',{w:3.8,fop:.25});
  const hl=[];for(let an=200;an<=250;an+=10)hl.push(E(an,.84));h.line(hl.map(HT).map(cl),4,W,.3);const hd=HT(E(262,.84));h.dot(hd[0],hd[1],2.4,2.4,W);
  const ring=[];for(let an=48;an<=150;an+=17)ring.push(E(an,1));h.tube(ring.map(HT).map(cl),6.5,'#B4BCC8',{ow:4.2});
  [70,100,130].forEach(an=>{const q=cl(HT(E(an,1)));h.dot(q[0],q[1],1.6,1.6,'#6E7886')})},
 'Antennae'(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry*(L.pose==='rollover'?.6:1),g=/^(giant|bat)$/.test(s.ears)?-.08:0;
  [[-.12+g,-.92,-.42+g,-1.62],[.24+g,-.9,.4+g,-1.66]].forEach(q=>{const a=[hx*q[0],hy*q[1]],c=[hx*q[2],hy*q[3]],m=[(a[0]+c[0])/2+hx*.1,(a[1]+c[1])/2];h.line([a,m,c].map(HT),3,INK,.5);const t=HT(c);h.shape(circ(t[0],t[1],4.6,4.6,8),'#2B2430',{w:2.4,ox:0,oy:0,sc:1,closed:1});h.dot(t[0]-1.4,t[1]-1.6,1.2,1.2,W)})},
 'Nightcap'(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.1,-6),W2=hx*.64,H=hy*.75,BL='#5B8FD8';
  const cone=[[W2,0],[W2*.55,-H*.85],[-W2*.1,-H*1.18],[-W2*.9,-H*1.0],[-W2*1.42,-H*.4],[-W2*1.58,H*.05],[-W2*1.2,-H*.42],[-W2*.72,-H*.62],[-W2*.62,-H*.3],[-W2,0]];
  h.shape(cone.map(P),'#F2F6FF',{w:3.6,step:8});
  [[[W2*.62,-H*.3],[-W2*.62,-H*.42]],[[W2*.3,-H*.72],[-W2*.68,-H*.7]],[[-W2*.18,-H*1.02],[-W2*.86,-H*.78]],[[-W2*.95,-H*.95],[-W2*1.25,-H*.48]]].forEach(q=>h.line(q.map(P),4.2,BL,.5));
  h.shape([[-W2*1.05,-5],[W2*1.05,-5],[W2*1.05,5],[-W2*1.05,5]].map(P),BL,{w:3,step:8});
  const t=P([-W2*1.56,H*.08]);h.shape(scallop(t[0],t[1],6.5,6.5,7,.22),W,{w:2.6,step:30,ox:0,oy:0,sc:1})}
};
function drawHood(h,s,L,HT){// Cozy Hoodie, hood up: a soft crescent over the back of the head, face and ears out
  const hx=s.head.rx,hy=s.head.ry,o=[],n=[];
  for(let an=-38;an>=-232;an-=14)o.push([Math.cos(an*D2R)*hx*1.16,Math.sin(an*D2R)*hy*1.2]);
  for(let an=-232;an<=-38;an+=14)n.push([hx*.14+Math.cos(an*D2R)*hx*.82,hy*.08+Math.sin(an*D2R)*hy*.8]);
  h.shape(o.concat(n).map(HT),'#D6CCC0',{w:3.8,step:9});h.line(n.map(HT),3.4,'#EDE6DC',.5);h.line(n.slice(2,-2).map(q=>[q[0]*1.05,q[1]*1.05]).map(HT),1.6,'#7E6E5F',.5)}
const BODY2={
 'Happi Coat'(h,s,L,B,p){const b=s.body,f=s.fluff?1.12:1.08;
  h.shape(p.map(B),'#3A4FA8',{w:4.6});h.crayon(b.rx*.7,b.ry*.7,q=>B([q[0]+b.rx*.3,q[1]]),'#3A4FA8',6);
  const hem=[];for(let a=108;a>=30;a-=6)hem.push([Math.cos(a*D2R)*b.rx*f*.88,Math.sin(a*D2R)*b.ry*f*.8]);h.line(hem.map(B),7.5,INK,.5);h.line(hem.map(B),5.2,W,.5);
  const wave=(P0,P1,n)=>{const q=[];for(let i=0;i<=n*2;i++){const t=i/(n*2),x=P0[0]+(P1[0]-P0[0])*t,y=P0[1]+(P1[1]-P0[1])*t;q.push([x,y+(i%2?-2.2:2.2)])}return q};
  for(let i=0;i<hem.length-2;i+=2)h.line(wave(B(hem[i]),B(hem[i+2]),1),2,'#3A4FA8',.2);
  const sl=[[b.rx*.5,b.ry*.32],[b.rx*.82,b.ry*.62]];h.line(sl.map(B),7,INK,.5);h.line(sl.map(B),4.6,W,.5);h.line(wave(B(sl[0]),B(sl[1]),2),1.8,'#3A4FA8',.2);
  const ed=[];for(let a=-74;a<=58;a+=12)ed.push([Math.cos(a*D2R)*b.rx*f*.86,Math.sin(a*D2R)*b.ry*f*.86]);h.line(ed.map(B),6.5,INK,.5);h.line(ed.map(B),4.2,W,.5);
  const t=B([b.rx*.86,b.ry*.12]);h.line([[t[0],t[1]],[t[0]-5,t[1]+10]],3.2,'#E8322B',.5);h.line([[t[0],t[1]],[t[0]+3,t[1]+11]],3.2,'#E8322B',.5);h.shape(circ(t[0],t[1],4.2,3.4,7),'#E8322B',{w:2.4,ox:0,oy:0,sc:1,closed:1})},
 'Bumblebee Suit'(h,s,L,B,p){const b=s.body,f=s.fluff?1.12:1.08;
  h.shape(p.map(B),'#FFD23A',{w:4.6});
  [.66,.28,-.1].forEach(xx=>{const bw=b.rx*.09,y=x=>b.ry*(f+.02)*.94*Math.sqrt(Math.max(0,1-Math.pow(x/(b.rx*f),2)));
   const x0=b.rx*xx-bw,x1=b.rx*xx+bw;h.shape([[x0,-y(x0)],[x1,-y(x1)],[x1,y(x1)],[x0,y(x0)]].map(B),'#2B2430',{noline:1,ox:0,oy:0,step:7,famp:.9})});
  h.crayon(b.rx*.7,b.ry*.7,q=>B([q[0]+b.rx*.3,q[1]]),'#FFD23A',6);
  const wl=Math.min(20,b.ry*.95),wb=[b.rx*.02,-b.ry*(s.fluff?1.05:.92)];
  [[-38,1.05,0],[-10,.85,7]].forEach(([an,sz,dx])=>{const c=[wb[0]+dx,wb[1]],e=circ(0,-wl*sz*.5,wl*sz*.36,wl*sz*.55,10).map(q=>{const r2=rot(q,an);return[c[0]+r2[0],c[1]+r2[1]]});
   h.shape(e.map(B),'#E6F6FF',{w:2.6,step:7,fop:.6,ox:0,oy:0,sc:1});h.line([c,[c[0]+Math.sin(an*D2R)*wl*sz*.6,c[1]-Math.cos(an*D2R)*wl*sz*.6]].map(B),1.6,'#8CC8E8',.3)})},
 'Cozy Hoodie'(h,s,L,B,p){const b=s.body,G='#D6CCC0',DK='#7E6E5F';
  if(!/^(cold|sleep)$/.test(L.pose)){const hood=B([b.rx*.6,-b.ry*1.05]);h.shape(circ(hood[0]-4,hood[1]-1,b.ry*.82,b.ry*.62,9),G,{w:3.8});h.line([[hood[0]-b.ry*.5,hood[1]],[hood[0]-b.ry*.1,hood[1]-b.ry*.32],[hood[0]+b.ry*.3,hood[1]-b.ry*.05]],2.4,DK,.4)}
  h.shape(p.map(B),G,{w:4.6});h.crayon(b.rx*.7,b.ry*.7,q=>B([q[0]+b.rx*.3,q[1]]),G,7);
  for(let i=0;i<7;i++){const q=B([b.rx*(-.15+h.r()*1.0),b.ry*(h.r()-.5)*1.2]);h.dot(q[0],q[1],1.3,1.3,'#B1A493')}
  h.shape([[b.rx*.06,b.ry*.2],[b.rx*.62,b.ry*.14],[b.rx*.72,b.ry*.74],[-b.rx*.02,b.ry*.8]].map(B),'#C6BAAC',{w:2.6,step:8,ox:1.2,oy:-.8});
  h.line([[b.rx*.12,b.ry*.28],[b.rx*.02,b.ry*.7]].map(B),1.8,DK,.3);h.line([[b.rx*.58,b.ry*.22],[b.rx*.66,b.ry*.66]].map(B),1.8,DK,.3);
  h.line(p.slice(-6).map(B),5,DK,.7);h.line(p.slice(0,4).map(B),5,DK,.7);
  [[.8,-.55,.84,.05],[.7,-.6,.7,-.05]].forEach(q=>{h.line([[b.rx*q[0],b.ry*q[1]],[b.rx*q[2],b.ry*q[3]]].map(B),2.2,W,.4);const e=B([b.rx*q[2],b.ry*q[3]]);h.dot(e[0],e[1],2,2,DK)})},
 'Tutu'(h,s,L,B){// a flat flared skirt round the hips, seen from the side: three scalloped layers; the near hind leg is drawn over the body, under the skirt
  const b=s.body,lie=/^(sleep|down|crouch|playdead|rollover)$/.test(L.pose),sq=lie?.68:1,cx=-b.rx*(b.long?.5:.36),R0=s.fluff?b.rx*.55:Math.min(b.rx*.62,34)+6,H0=(b.ry*(s.fluff?.3:.4)+5)*sq,cl=q=>[q[0],Math.min(q[1],GY-1)];
  h._legOnly='NH';drawLegs(h,s,L);h._legOnly=0;
  [['#FF7AB2',1,.56],['#FF9EC8',.88,.4],['#FFC2DE',.76,.24]].forEach(([col,k,cy])=>{
   const pts=scallop(0,0,R0*k,H0*(.55+.45*k),14,.16).map(q=>[cx+q[0],b.ry*cy*sq+q[1]]);h.shape(pts.map(B).map(cl),col,{w:2.8,step:30,amp:.8})});
  const wb=[];for(let i=0;i<=6;i++){const t=-1+i/3;wb.push([cx+t*R0*.66,b.ry*(.24*sq-.16)+Math.abs(t)*-2])}h.line(wb.map(B).map(cl),4.2,'#E04F86',.5);
  [[-.5,.5],[.1,.7],[.55,.45]].forEach(q=>{const c=cl(B([cx+q[0]*R0,b.ry*q[1]*sq]));h.line([[c[0]-2.5,c[1]-2.5],[c[0]+2.5,c[1]+2.5]],1.4,'#E04F86',.2);h.line([[c[0]+2.5,c[1]-2.5],[c[0]-2.5,c[1]+2.5]],1.4,'#E04F86',.2)})},
 'Pyjamas'(h,s,L,B,p){const b=s.body,f=s.fluff?1.12:1.08,BL='#5B8FD8',DK='#3F6FB8';
  h.shape(p.map(B),'#EEF4FF',{w:4.6});
  const y=x=>b.ry*(f+.04)*.9*Math.sqrt(Math.max(0,1-Math.pow(x/(b.rx*f),2)));
  for(let x=-b.rx*.22;x<b.rx*f*.95;x+=9){if(Math.abs(x-b.rx*.7)<5)continue;h.line([[x,-y(x)],[x+1.5,y(x+1.5)]].map(B),3.8,BL,.6)}
  h.line(p.slice(-6).map(B),5,DK,.7);h.line(p.slice(0,4).map(B),5,DK,.7);
  h.line([[b.rx*.7,-b.ry*.62],[b.rx*.72,b.ry*.72]].map(B),2.4,DK,.4);
  [-.35,.05,.45].forEach(yy=>{const c=B([b.rx*.71,b.ry*yy]);h.shape(circ(c[0],c[1],3,3,7),W,{w:1.8,ox:0,oy:0,sc:1,closed:1});h.dot(c[0],c[1],.9,.9,DK)})}
};
function drawSailor(h,s,L,HT){
  const a=neckAnchor(s,HT),c=a.c,d=[a.r[0]-a.l[0],a.r[1]-a.l[1]],m=Math.hypot(d[0],d[1])||1,u=[d[0]/m,d[1]/m],v=[-u[1],u[0]],S=m*(/^(howl|rollover|playdead)$/.test(L.pose)?.36:.6);
  const P=(x,y)=>[c[0]+u[0]*x*S+v[0]*y*S,Math.min(GY-1,c[1]+u[1]*x*S+v[1]*y*S)],tl=q=>[q[0],Math.min(q[1],GY+1)];
  h.shape([P(-1.25,-.15),P(-1.95,.3),P(-1.8,1.42),P(-.5,1.36),P(.12,1.0),P(.6,1.5),P(1.08,.36),P(1.02,-.18),P(0,-.06)],W,{w:3.8,step:8});
  h.line([P(-1.72,.44),P(-1.6,1.2),P(-.55,1.14),P(.1,.8),P(.6,1.24),P(.86,.42)],3.2,'#23367A',.4);
  const k=P(.6,1.42);h.line([k,tl([k[0]-4,k[1]+10])],3.4,'#E8322B',.5);h.line([k,tl([k[0]+4,k[1]+10])],3.4,'#E8322B',.5);h.shape(circ(k[0],k[1],4.4,3.6,7),'#E8322B',{w:2.4,ox:0,oy:0,sc:1,closed:1})}
function drawScarf(h,s,L,HT){
  const a=neckAnchor(s,HT),hy=s.head.ry,RD='#D7263D',CR='#FFF1D6';
  const sag=t=>{const x=a.l[0]+(a.r[0]-a.l[0])*t,y=a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*7;return[x,Math.min(y,GY-3)]};
  const band=[];for(let i=0;i<=8;i++)band.push(sag(-.12+i/8*.9));h.tube(band,8,RD,{ow:4.6});
  const xs=(P0,P1,w)=>{const dx=P1[0]-P0[0],dy=P1[1]-P0[1],mm=Math.hypot(dx,dy)||1,nx=-dy/mm*w,ny=dx/mm*w,mx=(P0[0]+P1[0])/2,my=(P0[1]+P1[1])/2;h.line([[mx-nx,my-ny],[mx+nx,my+ny]],3,CR,.3)};
  for(let i=1;i<band.length-1;i+=2)xs(band[i-1],band[i+1],4.4);
  const k=sag(.62),dn=Math.max(hy*.95,16),e1=clampG([k[0]+3,Math.min(k[1]+dn*.5,GY-4)]),e2=[k[0]-1,Math.min(k[1]+dn,GY-3)],end=[e2[0]+(e2[1]>=GY-3?-dn*.5:0),e2[1]];
  const tail=[k,e1,end];h.tube(tail,8,RD,{ow:4.6});
  const T2=dense(tail,false,6);for(let i=2;i<T2.length-1;i+=2)xs(T2[i-1],T2[i+1],4.4);
  const z=T2[T2.length-1],zz=T2[T2.length-2],dx=z[0]-zz[0],dy=z[1]-zz[1],mm=Math.hypot(dx,dy)||1,ux=dx/mm,uy=dy/mm;
  for(let j=-1.5;j<=1.5;j++){const bx=z[0]-uy*j*2.6,by=z[1]+ux*j*2.6;h.line([[bx,by],[Math.max(4,bx+ux*6),Math.min(by+uy*6,GY+3)]],1.8,RD,.4)}
  h.shape(circ(k[0],k[1],5.5,4.6,8),RD,{w:2.6,ox:0,oy:0,sc:1,closed:1})}
/* ---------- v2.5 Autumn & New Pups outfits ---------- */
HAT2['Leaf Beret']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,.02,-10),W2=hx*.6,H=hy*.4,RU='#B5532A',DK='#7E3416';
  const cr=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2;cr.push([-W2*.28+Math.cos(a)*W2*1.28*(1+.05*Math.sin(a*3)),-H*.95+Math.sin(a)*H*.8])}
  h.shape(cr.map(P),RU,{w:3.8,step:8});h.crayon(W2,H*.45,q=>P([q[0]-W2*.3,q[1]-H*1.05]),RU,4);
  h.shape([[-W2*.84,2],[-W2*.9,-H*.32],[W2*.82,-H*.32],[W2*.78,2]].map(P),DK,{w:3.2,step:8});
  h.tube([[-W2*.3,-H*1.7],[-W2*.18,-H*2.15],[-W2*.02,-H*2.3]].map(P),2.4,DK,{ow:2.8});
  const c=P([W2*.5,-H*.2]),lf=[[0,-8],[3,-3],[8,-5],[5,1],[8,5],[2,4],[0,9],[-2,4],[-8,5],[-5,1],[-8,-5],[-3,-3]].map(q=>{const r2=rot(q,-25);return[c[0]+r2[0]*.95,c[1]+r2[1]*.95]});
  h.shape(lf,'#E8A030',{w:2.4,step:30,ox:.8,oy:-.6,sc:1,amp:.4,closed:1});h.line([c,[c[0]+3,c[1]+8]],1.6,'#9A5A1A',.2);h.line([[c[0]-4,c[1]-2],[c[0]+4,c[1]+2]],1.4,'#9A5A1A',.2)};
BODY2['Pumpkin Suit']=function(h,s,L,B){// round as a pumpkin, crayon ribs, a ring of green leaves at the neck; rounder still when sitting
  const b=s.body,f=s.fluff?1.1:1.06,sit=/^(sit|beg|yawn|howl|paw|scratch|dance)$/.test(L.pose),OR='#F08A24',DK='#C25E12',GR='#5E9E3A',GD='#3E6E22',cl=q=>[q[0],Math.min(q[1],GY-1)];
  const rx=b.rx*f,up=b.ry*(f+.12),dn=b.ry*(f+(sit?.42:.22)),E=a=>{const c=Math.cos(a),sn=Math.sin(a);return[c*rx*(1+.035*Math.cos(a*6)),sn*(sn>0?dn:up)]};
  const pts=[];for(let i=0;i<22;i++)pts.push(E(i/22*Math.PI*2));
  h.shape(pts.map(B).map(cl),OR,{w:4.6});h.crayon(rx*.8,b.ry*.85,B,OR,8);
  [-.64,-.24,.18,.58].forEach(xx=>{const x=xx*rx,yy=Math.sqrt(Math.max(0,1-xx*xx));h.line(dense([[x*.84,-up*yy*.86],[x*1.06,0],[x*.84,dn*yy*.86]],false,6).map(B).map(cl),2.6,DK,.5)});
  [[.56,-.98],[.8,-.74],[.97,-.36],[1.02,.06]].forEach(([x,y],i)=>{const c=B([rx*x,up*y]),an=Math.atan2(y*up,x*rx)/D2R+(L.bT.a||0)+(i%2?14:-10),lf=[[0,0],[6,-4],[12,-2],[16,2],[10,6],[4,5]].map(q=>{const r2=rot(q,an);return[c[0]+r2[0],c[1]+r2[1]]});
   h.shape(lf.map(cl),i%2?GR:'#74B04A',{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.5});h.line([lf[0],lf[3]].map(cl),1.6,GD,.2)});
  const v=B([rx*.42,-up*1.02]);h.line(spiral(v[0],v[1]-3,.5,4.5,1.1,9,1).map(cl),2,GD,.3)};
function drawAScarf(h,s,L,HT){// Autumn Scarf: long, mustard and rust stripes, one end hanging to the knees
  const a=neckAnchor(s,HT),hy=s.head.ry,MU='#E3A72F',RU='#B5532A';
  const sag=t=>{const x=a.l[0]+(a.r[0]-a.l[0])*t,y=a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*7;return[x,Math.min(y,GY-3)]};
  const band=[];for(let i=0;i<=8;i++)band.push(sag(-.14+i/8*.94));h.tube(band,9,MU,{ow:4.6});
  const xs=(P0,P1,w)=>{const dx=P1[0]-P0[0],dy=P1[1]-P0[1],mm=Math.hypot(dx,dy)||1,nx=-dy/mm*w,ny=dx/mm*w,mx=(P0[0]+P1[0])/2,my=(P0[1]+P1[1])/2;h.line([[mx-nx,my-ny],[mx+nx,my+ny]],3.8,RU,.3)};
  for(let i=1;i<band.length-1;i+=2)xs(band[i-1],band[i+1],4.6);
  const k=sag(.6),dn=Math.max(hy*1.35,22),e1=clampG([k[0]-3,Math.min(k[1]+dn*.5,GY-4)]),e2=[k[0]+2,Math.min(k[1]+dn,GY-3)],end=[e2[0]+(e2[1]>=GY-3?-dn*.55:0),e2[1]],lie=/^(sleep|down|crouch|playdead|rollover)$/.test(L.pose);
  const tail=lie?[k,[k[0]-dn*.45,Math.min(k[1]+6,GY-4)],[k[0]-dn*1.05,GY-4]]:[k,e1,end];h.tube(tail,9,MU,{ow:4.6});
  const T2=dense(tail,false,6);for(let i=2;i<T2.length-1;i+=2)xs(T2[i-1],T2[i+1],4.6);
  const z=T2[T2.length-1],zz=T2[T2.length-2],dx=z[0]-zz[0],dy=z[1]-zz[1],mm=Math.hypot(dx,dy)||1,ux=dx/mm,uy=dy/mm;
  for(let j=-1.5;j<=1.5;j++){const bx=z[0]-uy*j*2.8,by=z[1]+ux*j*2.8;h.line([[bx,by],[Math.max(4,bx+ux*7),Math.min(by+uy*7,GY+3)]],2,j%2?RU:MU,.4)}
  h.shape(circ(k[0],k[1],6,5,8),MU,{w:2.6,ox:0,oy:0,sc:1,closed:1});h.line([[k[0]-3,k[1]-3],[k[0]+3,k[1]+3]],2.6,RU,.3)}
function drawRosette(h,s,L,HT){// Parade Rosette: an orange crumpled rosette on a purple collar, two ribbons, a little bent
  const a=neckAnchor(s,HT),OR='#F08A24',DK='#C25E12',BK='#2B2430',cl=q=>[q[0],Math.min(q[1],GY-1)];
  const sag=t=>{const x=a.l[0]+(a.r[0]-a.l[0])*t,y=a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*8;return[x,Math.min(y,GY-18)]};
  const pts=[];for(let i=0;i<=8;i++)pts.push(sag(i/8));h.line(pts,6.4,INK);h.line(pts,4,'#6A4AA8',.4);
  const lie=/^(sleep|down|crouch|playdead|rollover)$/.test(L.pose),c=sag(lie?.15:.58),k=[c[0]+(lie?-4:2),Math.min(c[1]+(lie?0:7),GY-14)];
  h.shape([[k[0]-2,k[1]],[k[0]-11,k[1]+17],[k[0]-6,k[1]+14],[k[0]-4,k[1]+20],[k[0]+2,k[1]+3]].map(cl),OR,{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4});
  h.shape([[k[0]+1,k[1]],[k[0]+4,k[1]+16],[k[0]+8,k[1]+12],[k[0]+12,k[1]+17],[k[0]+6,k[1]+1]].map(cl),BK,{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4});
  const ro=scallop(0,0,10.5,9.5,9,.24).map(q=>{const r2=rot(q,14);return[k[0]+r2[0]+(r2[1]<0?r2[1]*.18:0),k[1]+r2[1]*.86]});
  h.shape(ro.map(cl),OR,{w:2.8,step:30,ox:.6,oy:-.4,sc:1,amp:.5});h.shape(circ(k[0]+.6,k[1],5,4.4,8).map(cl),'#FFD23A',{w:2.2,ox:0,oy:0,sc:1,closed:1,amp:.3});h.dot(k[0]+.6,k[1],1.8,1.8,BK);
  h.line([[k[0]-8,k[1]-2],[k[0]-4,k[1]-6],[k[0]-1,k[1]-4]].map(cl),1.6,DK,.3)}
function drawMedalCharm(h,s,L,HT,neck){// v2.20 Missions v2: the Crayon Medal charm (outfit.charm === 'Crayon Medal'; no other charm is drawn on the dog): a gold scalloped
  // medal with a crayon on it, hung on two short crayon straps (pink and blue, like the card's rainbow ribbon) from the collar line (its own little
  // two-stripe ribbon round the neck when no neck item is worn). Asleep or rolled over it is not drawn (it would land on the face); lying down it rests
  // on the chest by the throat. Under a bandana, scarf or snood it hangs lower, clear of the knot; with the Lion Mane it hangs from the mane's chin tuft.
  if(/^(sleep|rollover)$/.test(L.pose))return;
  const a=neckAnchor(s,HT),hx=s.head.rx,hy=s.head.ry,cl=q=>[q[0],Math.min(q[1],GY-1)],PK='#F28FA5',BL='#7FB7E0';
  const sag=t=>{const x=a.l[0]+(a.r[0]-a.l[0])*t,y=a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*8;return[x,Math.min(y,GY-18)]};
  if(!neck){const pts=[];for(let i=0;i<=8;i++)pts.push(sag(i/8));h.line(pts,5.2,INK);h.line(pts.map(q=>[q[0],q[1]-.85]),1.5,PK,.3);h.line(pts.map(q=>[q[0],q[1]+.85]),1.5,BL,.3)}
  const lie=/^(down|crouch|playdead)$/.test(L.pose),low=!!neck&&/Bandana|Scarf|Snood/.test(neck),mane=neck==='Lion Mane';
  let c,k;
  if(lie){c=HT([-hx*(L.pose==="crouch"?.85:.62),hy*1.02]);c=[c[0],Math.min(c[1],GY-18)];k=[c[0]-2,Math.min(c[1]+6,GY-11)]}
  else if(mane){const z=Math.max(5,hx*.24),mb=HT([-hx*.1,hy*1.5]);c=HT([-hx*.05,hy*.98+z*.6]);c=[c[0],Math.min(c[1],GY-18)];k=[c[0]-1,Math.min(Math.max(c[1]+11,mb[1]+4),GY-12)]}
  else{c=sag(.4);k=[c[0]-1,Math.min(c[1]+(low?(/Bandana/.test(neck)?16:14):10),GY-12)]}
  const t0=[c[0]-2.4,c[1]],t1=[c[0]+2.4,c[1]],m0=[k[0]-1.6,k[1]-5],m1=[k[0]+1.4,k[1]-5];
  h.line([t0,m0].map(cl),3.2,INK,.2);h.line([t1,m1].map(cl),3.2,INK,.2);h.line([t0,m0].map(cl),1.7,PK,.2);h.line([t1,m1].map(cl),1.7,BL,.2);
  h.shape(scallop(k[0],k[1],8.6,8.6,10,.16).map(cl),'#FFD152',{w:2.6,step:30,ox:0,oy:0,sc:1,amp:.35});
  h.shape(circ(k[0],k[1],4.8,4.8,8).map(cl),'#FFFBF3',{w:1.8,ox:0,oy:0,sc:1,closed:1,amp:.2});
  h.line([[k[0]-3,k[1]+2.5],[k[0]+2.7,k[1]-2.3]].map(cl),2.4,'#E8322B',.15);h.dot(k[0]+3.1,k[1]-2.7,.9,.9,INK)}
function drawGhost(h,s,L,B,HT){// Ghost Sheet: one white sheet over body and head, scalloped hem, ear bumps, eye holes, tail out the back
  const b=s.body,hx=s.head.rx,hy=s.head.ry,f=s.fluff?1.12:1.1,P=[],SH='#D9D2C8';
  circ(0,b.ry*.12,b.rx*f,b.ry*(f+.22),16).forEach(q=>P.push(B(q)));
  circ(0,0,hx*1.14,hy*1.16,14).forEach(q=>P.push(HT(q)));
  {const N=noseLocal(s);P.push(HT([N[0]-hx*.3,N[1]+hy*.95]),HT([N[0]+hx*.1,N[1]+hy*.6]))}
  if(s.face.snout){const N=noseLocal(s);P.push(HT([N[0]+hx*.14,N[1]-hy*.1]),HT([N[0]+hx*.06,N[1]+hy*.32]))}
  const H=chaikin(hull(P),2);let cx=0,cy=0,my=-1e9;H.forEach(q=>{cx+=q[0]/H.length;cy+=q[1]/H.length;my=Math.max(my,q[1])});
  // the hem: big soft scallops along the lowest edge only, fading in from the sides
  const D=dense(H,true,6),y0=cy+(my-cy)*.35,y1=cy+(my-cy)*.7,pts=D.map((q,i)=>{const wt=Math.max(0,Math.min(1,(q[1]-y0)/(y1-y0)));if(!wt)return q;const dx=q[0]-cx,dy=q[1]-cy,m=Math.hypot(dx,dy)||1,k=wt*(6*Math.abs(Math.sin(i*Math.PI/3))-2);return[q[0]+dx/m*k,Math.min(q[1]+dy/m*k,GY+1)]});
  h.shape(pts,W,{w:4.2,step:30,amp:.45,famp:.5});h.crayon(b.rx,b.ry,B,W,8);h.crayon(hx,hy*.6,q=>HT([q[0],q[1]-hy*.2]),W,4);
  [[[.6,-.4],[.42,1.25]],[[-.2,-.7],[-.36,1.25]]].forEach(q=>h.line(q.map(B).map(p=>[p[0],Math.min(p[1],GY-2)]),2,SH,.6));
  earList(s).forEach(e=>{if(e.flop)return;const p=earPose(s,L,e);let ex=0,ey=0;p.forEach(q=>{ex+=q[0]/p.length;ey+=q[1]/p.length});
   const m=Math.hypot(ex/hx,ey/hy)||1,dir=[ex/hx/m,ey/hy/m],z=hx*(/^(giant|bat|tall)$/.test(s.ears)?.36:.3),c=HT([dir[0]*hx*1.12,dir[1]*hy*1.14]),an=Math.atan2(c[1]-HT([0,0])[1],c[0]-HT([0,0])[0]);
   h.shape(circ(c[0],c[1],z,z,10),W,{noline:1,ox:0,oy:0,sc:1});const arc=[];for(let j=-4;j<=4;j++){const t=an+j*Math.PI/8.5;arc.push([c[0]+Math.cos(t)*z,c[1]+Math.sin(t)*z])}h.line(arc,4,INK,.8)});
  ghostEyes(h,s,L,HT)}
function ghostEyes(h,s,L,HT){const f=L.face,hx=s.head.rx,hy=s.head.ry,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],er=s.eyes,m=f.eyes,lc=lum(s.hcol)<.32?'#CFC6C0':INK;
  [[e0,er[0]],[e1,er[1]]].forEach(([e,r],i)=>{const [x,y]=HT([hx*e[0],hy*e[1]]),z=Math.max(r,5.5);
   if(m==='closed'||m==='happy'||m==='x'){h.line(m==='happy'?[[x-r,y+r*.35],[x,y-r*.55],[x+r,y+r*.35]]:[[x-r,y],[x,y+r*.5],[x+r,y]],3.8);return}
   h.shape(circ(x,y,z*1.08+2.4,z*1.22+2.4,10),mix(s.hcol,INK,.6),{w:3,ox:0,oy:0,sc:1,closed:1,amp:.5,famp:.3});
   if(m==='closed'||m==='happy'||m==='x'){h.line(m==='happy'?[[x-r,y+r*.35],[x,y-r*.55],[x+r,y+r*.35]]:[[x-r,y],[x,y+r*.5],[x+r,y]],3.6,lc);return}
   h.shape(circ(x,y,r,r*1.05,12),W,{ox:0,oy:0,sc:1,w:2.3,amp:.45,closed:1,famp:.25});
   const ir=s.irises?s.irises[i]:s.iris,ly=m==='down'||m==='sad'?.6:.1,px=x+.06*r*.4,py=y+ly*r*.4;if(ir){h.dot(px,py,r*.68,r*.72,ir);h.dot(px,py,r*.34,r*.36)}else h.dot(px,py,r*.57,r*.6);h.dot(px-r*.2,py-r*.26,r*.2,r*.2,W)})}
/* ---------- v2.6 Halloween 2026 outfits ---------- */
// cute-spooky: felt, crayon and smiles. BACK2 holds the body items that also have a part behind the dog (the cape layer, before the tail)
const HW_BK='#3B3346',HW_GR='#7D7488',HW_RD='#D7263D',BACK2={};
HAT2['Witch Hat']=function(h,s,L,HT){// a tall black cone, the tip crooked and flopping forward, a wide floppy brim, an orange band with a buckle
  const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.02,-3),W2=hx*.5,H=hy*1.72,OR='#F08A24';
  h.shape([[-W2*.95,-2],[-W2*.6,-H*.42],[-W2*.55,-H*.64],[-W2*.14,-H*.9],[W2*.42,-H*1.03],[W2*1.02,-H*.9],[W2*.62,-H*.8],[W2*.3,-H*.83],[W2*.06,-H*.66],[W2*.18,-H*.45],[W2*.58,-H*.22],[W2*.95,-2]].map(P),HW_BK,{w:3.8,step:8});
  h.line([[-W2*.62,-H*.2],[-W2*.4,-H*.48],[-W2*.34,-H*.68],[-W2*.04,-H*.88]].map(P),2.4,HW_GR,.5);
  h.line([[-W2*.9,-8],[W2*.9,-8]].map(P),5.5,OR,.5);
  const bk=P([W2*.12,-8]);h.shape([[-3.6,-3.4],[3.6,-3.4],[3.6,3.4],[-3.6,3.4]].map(q=>[bk[0]+q[0],bk[1]+q[1]]),'#FFD23A',{w:2,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2});h.dot(bk[0],bk[1],1.3,1.3,HW_BK);
  const br=[];for(let i=0;i<20;i++){const a=i/20*Math.PI*2,c=Math.cos(a);br.push([c*hx*1.12,1+Math.sin(a)*5.5+(c>.5?(c-.5)*12:0)+(c<-.7?(-.7-c)*7:0)])}
  h.shape(br.map(P),HW_BK,{w:3.6,step:8});h.line(br.slice(1,9).map(q=>[q[0]*.86,q[1]*.6+1.5]).map(P),1.6,HW_GR,.4)};
function drawCandyCorn(h,s,L,HT){// Candy Corn Bandana: a long triangle in yellow, orange and white stripes, the white tip hanging well below the chin, a heavy ink edge so it reads on yellow and orange coats
  const a=neckAnchor(s,HT),hx=s.head.rx,hy=s.head.ry,up=/^(howl|rollover|playdead)$/.test(L.pose),t=clampG(HT([-hx*.24,hy*(up?1.6:2.1)])),l=[a.l[0]-(a.r[0]-a.l[0])*.08,a.l[1]],r=[a.r[0]+(a.r[0]-a.l[0])*.06,a.r[1]];
  const lp=(p,q,u)=>[p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u],o={noline:1,ox:1,oy:-.6,sc:1,famp:.5};
  const l1=lp(l,t,.3),r1=lp(r,t,.3),l2=lp(l,t,.62),r2=lp(r,t,.62);
  h.shape([l,r,t],'#FFE14D',o);h.shape([l1,r1,r2,l2],'#FF7A12',o);h.shape([l2,r2,t],'#FFFDF6',o);
  const ins=(p,q,k)=>[p[0]+(t[0]-p[0])*k*.06+(q[0]-p[0])*k*.04,p[1]+(t[1]-p[1])*k*.06+(q[1]-p[1])*k*.04];// a step in from an edge, for the inner line
  h.line([ins(l,r,1),lp(ins(l,r,1),t,.92)],2,'#9A4A10',.4);h.line([ins(r,l,1),lp(ins(r,l,1),t,.92)],2,'#9A4A10',.4);
  h.line([l1,r1],2.8,INK,.5);h.line([l2,r2],2.8,INK,.5);h.shape([l,r,t],null,{w:5,step:9,closed:1});
  h.shape(circ(l[0],l[1],5,4.4,7),'#FFE14D',{w:3,ox:0,oy:0,sc:1,closed:1})}
function hwHem(a,b,n,dep){// a scalloped hem from a to b (local px): n soft arcs with little points between, dep = how far the points hang
  const o=[];for(let i=0;i<=n;i++){const t=i/n,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;o.push([x,y+dep]);if(i<n){const u=(i+.5)/n;o.push([a[0]+(b[0]-a[0])*u,a[1]+(b[1]-a[1])*u-dep*.2])}}return o}
BACK2['Vampire Cape']=function(h,s,L,B){// the far side of the cape: it flares out past the rump and swishes, black outside with the red lining showing
  const b=s.body,f=s.fluff?1.12:1.06,mv=L.pose==='walk'||L.pose==='happy'||L.pose==='jump'||L.pose==='dance',sw=[0,5,-3][L.k||0]*(mv?1:.4),cl=q=>[q[0],Math.min(q[1],GY)],lie=/^(sleep|down|crouch|playdead|rollover)$/.test(L.pose),dn=lie?.45:1,fx=(L.pose==='jump'?1.3:1)*(s.fluff?.8:1),e=Math.min(b.rx,40);// e: the flare past the rump, capped so long dogs keep a cape, not a train
  const top=[[b.rx*.5,-b.ry*f],[b.rx*.05,-b.ry*(f+.12)],[-b.rx*.55,-b.ry*(f+.06)],[-b.rx-e*.12*fx,-b.ry*.72],[-b.rx-e*(.2+.3*fx)-sw,-b.ry*.05]];
  const hem=hwHem([-b.rx-e*(.32+.42*fx)-sw*1.5,b.ry*(.3+.62*dn)],[b.rx*.32,b.ry*(.28+.42*dn)],6,b.ry*.17);
  h.shape(top.concat(hem).map(B).map(cl),HW_RD,{w:4.2,step:9});
  h.line(top.map(B).map(cl),5,HW_BK,.5);h.line([[-b.rx*.9,-b.ry*.45],[-b.rx-e*(.15+.32*fx)-sw*1.2,b.ry*(.2+.5*dn)]].map(B).map(cl),2,'#9E1426',.5);
  h.line([[-b.rx*.6,-b.ry*.75],[-b.rx*.9-e*.25*fx-sw,b.ry*(.25+.5*dn)]].map(B).map(cl),2,'#9E1426',.5)};
BODY2['Vampire Cape']=function(h,s,L,B){// the near side over the back, black with a red edge, a scalloped hem, and the tall stand-up collar behind the head
  const b=s.body,f=s.fluff?1.12:1.06,HT=T(L.hT),hx=s.head.rx,hy=s.head.ry,cl=q=>[q[0],Math.min(q[1],GY)],lie=/^(sleep|down|crouch|playdead|rollover)$/.test(L.pose),dn=lie?.5:1,mv=L.pose==='walk'||L.pose==='happy'||L.pose==='jump'||L.pose==='dance',sw=[0,3,-2][L.k||0]*(mv?1:.4);
  const hem=hwHem([-b.rx*1.1-sw,b.ry*(.05+.32*dn)],[b.rx*.52,b.ry*(-.05+.25*dn)],5,b.ry*.14);
  const p=[[b.rx*.62,-b.ry*f*.92],[b.rx*.15,-b.ry*(f+.04)],[-b.rx*.5,-b.ry*f*.96],[-b.rx*.98,-b.ry*.62],[-b.rx*1.14-sw,-b.ry*.2]].concat(hem).concat([[b.rx*.66,-b.ry*.35]]);
  h.shape(p.map(B).map(cl),HW_BK,{w:4.4,step:9});h.crayon(b.rx*.6,b.ry*.4,q=>B([q[0]-b.rx*.2,q[1]-b.ry*.35]),HW_BK,6);
  h.line([[b.rx*.62,-b.ry*.8],[b.rx*.68,-b.ry*.35],[b.rx*.54,b.ry*(-.05+.25*dn)]].map(B).map(cl),4.4,HW_RD,.5);
  h.line([[-b.rx*.15,-b.ry*.75],[-b.rx*.6,-b.ry*.55],[-b.rx*.86,-b.ry*.2]].map(B).map(cl),2,HW_GR,.5);
  // the collar: two tall points standing up behind the head, red inside
  const C=[[-hx*.05,hy*1.02],[-hx*.85,hy*.95],[-hx*1.38,hy*.45],[-hx*1.66,-hy*.5],[-hx*1.2,-hy*.2],[-hx*1.12,-hy*.98],[-hx*.55,-hy*.3],[-hx*.1,hy*.5]];
  h.shape(C.map(HT).map(cl),HW_BK,{w:3.8,step:8});
  h.shape([[-hx*.3,hy*.88],[-hx*.86,hy*.78],[-hx*1.24,hy*.38],[-hx*1.46,-hy*.3],[-hx*1.12,-hy*.04],[-hx*1.04,-hy*.72],[-hx*.62,-hy*.18],[-hx*.3,hy*.5]].map(HT).map(cl),HW_RD,{noline:1,ox:0,oy:0,sc:1,famp:.5});
  h.line([[-hx*.95,hy*.6],[-hx*1.3,-hy*.1]].map(HT).map(cl),1.6,'#9E1426',.4);
  const c=cl(HT([-hx*.14,hy*.98]));h.dot(c[0],c[1],3.8,3.8,'#FFD23A');h.dot(c[0],c[1],1.4,1.4,HW_BK)};
function hwWing(h,B,root,ang,z,cl,far,pal){// one felt bat wing: root on the back (body px), ang tilts it (deg, 0 = straight up), z = span; pal (v2.11.1): [far fill, near fill, vein], none = the v2.6 black felt
  pal=pal||['#2E2834',HW_BK,HW_GR];
  const scal=(p,q,k)=>{const o=[],dx=q[0]-p[0],dy=q[1]-p[1],m=Math.hypot(dx,dy)||1;for(let i=1;i<=4;i++){const t=i/5,s=Math.sin(Math.PI*t)*k;o.push([p[0]+dx*t+dy/m*s,p[1]+dy*t-dx/m*s])}return o};// the edge between two finger tips, sagging in toward the root
  const Wr=[z*.12,-z*.76],T1=[-z*.6,-z*.98],T2=[-z*1.02,-z*.56],T3=[-z*1.16,-z*.06],R0=[-z*.46,z*.06];
  const pts=[[0,0],[z*.18,-z*.38],Wr,[z*.16,-z*.9],[z*.04,-z*.84],[-z*.2,-z*.94]].concat([T1],scal(T1,T2,z*.21),[T2],scal(T2,T3,z*.2),[T3],scal(T3,R0,z*.16),[R0]);
  const M=q=>{const r2=rot(q,ang);return cl(B([root[0]+r2[0],root[1]+r2[1]]))};
  h.shape(pts.map(M),far?pal[0]:pal[1],{w:far?3.4:3.8,step:6,amp:.7});
  if(!far){[T2,T3].forEach(t=>h.line([Wr,[(Wr[0]+t[0])/2+z*.06,(Wr[1]+t[1])/2+z*.08],t].map(M),1.8,pal[2],.4));h.line([[z*.1,-z*.14],[z*.18,-z*.42],[z*.1,-z*.7]].map(M),2.8,pal[2],.4);h.line([[-z*.12,-z*.82],[-z*.42,-z*.86]].map(M),2.4,pal[2],.4)}}
function hwWingSet(s,L){const b=s.body,lie=/^(sleep|down|crouch|playdead)$/.test(L.pose),roll=L.pose==='rollover',fl=Math.max(-8,Math.min(8,(L.tailA||0)*.2)),z=Math.max(34,Math.min(52,b.ry*2))*(lie?.78:roll?.62:1);
  return{z,root:[b.rx*.1,-b.ry*(s.fluff?(s.wet?.84:.98):.84)],ang:roll?-112:lie?-22:4-fl,far:[b.rx*.26,-b.ry*(s.fluff?(s.wet?.86:1.0):.88)],fang:roll?-84:lie?6:34-fl*.6}}
BACK2['Bat Wings']=function(h,s,L,B){const w=hwWingSet(s,L);hwWing(h,B,w.far,w.fang,w.z*.94,q=>[q[0],Math.min(q[1],GY)],1)};
BODY2['Bat Wings']=function(h,s,L,B){// the harness strap round the chest, then the near wing over the back
  const b=s.body,w=hwWingSet(s,L),cl=q=>[q[0],Math.min(q[1],GY)];
  const st=[[b.rx*.4,-b.ry*.98],[b.rx*.47,0],[b.rx*.42,b.ry*.95]];h.line(st.map(B).map(cl),6.2,INK,.4);h.line(st.map(B).map(cl),3.8,'#8E63C7',.4);
  h.line([[b.rx*.4,-b.ry*.9],[w.root[0],w.root[1]+2]].map(B).map(cl),5,INK,.4);h.line([[b.rx*.4,-b.ry*.9],[w.root[0],w.root[1]+2]].map(B).map(cl),2.8,'#8E63C7',.4);
  hwWing(h,B,w.root,w.ang,w.z,cl,0);
  const bk=cl(B([b.rx*.46,b.ry*.12]));h.shape([[bk[0]-3.4,bk[1]-3.2],[bk[0]+3.4,bk[1]-3.2],[bk[0]+3.4,bk[1]+3.2],[bk[0]-3.4,bk[1]+3.2]],'#FFD23A',{w:2,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2})};
/* ---------- v2.8 Winter & New Year outfits ---------- */
// NECK2 holds the neck items from v2.8 on (drawNeck looks there first); older necks keep their own branches
const NECK2={},WN_GR='#3F8F3A',WN_GD='#28682A',WN_RD='#D7263D',WN_RK='#9E1426',WN_CR='#FFF1D6';
function wnFlake(h,c,z,col,w,wonky){// a crayon snowflake round c (canvas px): three crossing strokes, little V tips; wonky = uneven arms, one tip missing
  const A=wonky?[12,74,128]:[0,60,120],K=wonky?[[1,.7],[1.25,.85],[.8,1.1]]:[[1,1],[1,1],[1,1]];
  A.forEach((a,i)=>{const u=[Math.cos(a*D2R),Math.sin(a*D2R)],e0=[c[0]-u[0]*z*K[i][0],c[1]-u[1]*z*K[i][0]],e1=[c[0]+u[0]*z*K[i][1],c[1]+u[1]*z*K[i][1]];h.line([e0,e1],w,col,.35);
   [[e1,1],[e0,-1]].forEach(([e,sg],j)=>{if(wonky&&i===1&&j)return;const m=[e[0]-u[0]*sg*z*.32,e[1]-u[1]*sg*z*.32],v=[-u[1]*z*.24,u[0]*z*.24];h.line([[m[0]+v[0],m[1]+v[1]],[e[0]-u[0]*sg*z*.08,e[1]-u[1]*sg*z*.08],[m[0]-v[0],m[1]-v[1]]],w*.75,col,.25)})})}
function wnAlong(P,k){// the start of polyline P up to fraction k of its length
  let tot=0;for(let i=1;i<P.length;i++)tot+=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);const o=[P[0]];let acc=0;
  for(let i=1;i<P.length;i++){const d=Math.hypot(P[i][0]-P[i-1][0],P[i][1]-P[i-1][1]);if(acc+d>=tot*k){const t=d?(tot*k-acc)/d:0;o.push([P[i-1][0]+(P[i][0]-P[i-1][0])*t,P[i-1][1]+(P[i][1]-P[i-1][1])*t]);return o}acc+=d;o.push(P[i])}return o}
BODY2['Very Ugly Sweater']=function(h,s,L,B,p){// green with lumpy red stripes, a wonky crayon snowflake, red ribbing, one sleeve longer than the other, a loose thread
  const b=s.body,f=s.fluff?1.12:1.08,cl=q=>[q[0],Math.min(q[1],GY-1)];
  // the sleeves first, so the sweater covers their tops: the far one short, the near one long
  L.legs.filter(l=>(l.id==='FF'||l.id==='NF')&&l.foot&&!l.raised&&!l.haunch&&!l.sitfoot).sort((x,y)=>x.near-y.near).forEach(l=>{
   const P=dense([l.hip,l.mid||[(l.hip[0]+l.foot[0])/2+1,(l.hip[1]+l.foot[1])/2],l.foot],false,2),S=wnAlong(P,l.near?.66:.42),cw=Math.max(3.4,l.w*.42),
    e=S[S.length-1],q=S[Math.max(0,S.length-1-Math.round(cw*1.3))];
   h.tube(S.map(cl),l.w+3.6,l.near?WN_GR:mix(WN_GR,PEN,.28));h.tube([q,e].map(cl),l.w+5.4,l.near?WN_RD:mix(WN_RD,PEN,.28),{ow:3.6});
   const dx=e[0]-q[0],dy=e[1]-q[1],m=Math.hypot(dx,dy)||1,nx=-dy/m*(l.w*.5+2),ny=dx/m*(l.w*.5+2),c=[(q[0]+e[0])/2,(q[1]+e[1])/2];h.line([[c[0]-nx,c[1]-ny],[c[0]+nx,c[1]+ny]].map(cl),1.6,WN_RK,.2)});
  const lp=p.map((q,i)=>{const k=1+.035*Math.sin(i*2.7);return[q[0]*k,q[1]*k]});
  h.shape(lp.map(B).map(cl),WN_GR,{w:4.6});h.crayon(b.rx*.7,b.ry*.7,q=>B([q[0]+b.rx*.3,q[1]]),WN_GR,6);
  const yy=x=>b.ry*(f+.02)*.95*Math.sqrt(Math.max(0,1-Math.pow(x/(b.rx*f),2)));
  [[.74,.09],[.3,.1],[-.12,.09]].forEach(([cx,w],i)=>{const E=[],R=[];for(let j=0;j<=6;j++){const t=-1+j/3,wb=Math.sin(j*1.9+i*2.3)*b.rx*.035,xl=b.rx*(cx-w)+wb,xr=b.rx*(cx+w)+wb*.5+Math.cos(j*1.3+i)*b.rx*.03;E.push([xl,yy(xl)*t]);R.unshift([xr,yy(xr)*t])}
   h.shape(E.concat(R).map(B).map(cl),WN_RD,{noline:1,ox:0,oy:0,step:6,famp:1});h.line(E.map(B).map(cl),1.8,WN_RK,.5)});
  for(let i=0;i<6;i++){const q=B([b.rx*(-.25+h.r()*1.1),b.ry*(h.r()-.5)*1.3]);h.dot(q[0],q[1],1.4,1.4,'#FFF6E0')}
  h.line([[b.rx*.84,-b.ry*.74],[b.rx*.97,-b.ry*.45],[b.rx*1.03,-b.ry*.12]].map(B).map(cl),6.5,WN_RD,.7);
  [[.86,-.66],[.94,-.42],[1.0,-.2]].forEach(q=>{const c=B([b.rx*q[0],b.ry*q[1]]),d=B([b.rx*(q[0]-.07),b.ry*q[1]]);h.line([c,d].map(cl),1.6,WN_RK,.2)});
  h.line([lp[0],[lp[0][0]-1.5,-b.ry*.3],[lp[0][0]+1.5,b.ry*.3],lp[lp.length-1]].map(B).map(cl),5.5,WN_RD,.8);
  wnFlake(h,cl(B([b.rx*.5,-b.ry*.1])),Math.max(6.5,Math.min(b.ry*.5,11.5)),W,3.2,1);
  // the loose thread, from whichever back corner of the hem is lower
  const c0=B([lp[0][0]+3,lp[0][1]*.9]),c1=B([lp[lp.length-1][0]+3,lp[lp.length-1][1]*.9]),st=c0[1]>c1[1]?c0:c1,Lt=Math.max(12,Math.min(21,b.ry*.85));
  const th=[[0,0],[-2.5,Lt*.3],[1.5,Lt*.55],[-2.5,Lt*.8],[-.5,Lt]].map(q=>cl([st[0]+q[0],st[1]+q[1]]));h.line(th,2.2,WN_GD,.35);
  const e=th[th.length-1];h.line(spiral(e[0]+2.6,e[1]-1.2,.4,2.8,1,8,3.1).map(cl),1.8,WN_GD,.2)};
HAT2['Reindeer Antlers']=function(h,s,L,HT){// a red felt headband over the crown, two soft brown felt antlers between the ears, a tiny gold bell on each
  const hx=s.head.rx,hy=s.head.ry,sq=L.pose==='rollover'?.55:1,g=/^(giant|bat)$/.test(s.ears)?-.08:0,z=Math.max(hy,hx*.82)*(L.pose==='rollover'?.75:1.12),BR='#9C6234',BL='#C8925A',GD='#F2C14E',cl=q=>[q[0],Math.min(q[1],GY+3)];
  const P=q=>HT([q[0],-hy*.42+(q[1]+hy*.42)*sq]);
  const antler=(root,lean,far)=>{const col=far?mix(BR,PEN,.28):BR,M=q=>{const r2=rot([q[0]*z,q[1]*z],lean);return cl(P([root[0]+r2[0],root[1]+r2[1]]))};
   const beam=[[0,0],[-.06,-.4],[-.03,-.76],[.1,-1.04]],t1=[[-.04,-.44],[.2,-.58],[.3,-.78]],t2=[[-.03,-.74],[-.22,-.88],[-.27,-1.06]];
   h.tube(t1.map(M),z*.2,col,{ow:3.4});h.tube(t2.map(M),z*.2,col,{ow:3.4});h.tube(beam.map(M),z*.26,col,{ow:3.6});
   if(!far)h.line([[-.02,-.12],[-.03,-.6],[.04,-.92]].map(M),Math.max(1.6,z*.05),BL,.3);
   const k=M([.22,-.6]),bz=Math.max(3.2,z*.14),bc=[k[0],k[1]+bz*1.3];h.line([k,bc],1.4,INK,.1);
   h.shape(circ(bc[0],bc[1],bz,bz,8),far?mix(GD,PEN,.25):GD,{w:2,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.2});h.line([[bc[0]-bz*.6,bc[1]+bz*.25],[bc[0]+bz*.6,bc[1]+bz*.25]],1.2,INK,.1);h.dot(bc[0],bc[1]+bz*.62,bz*.28,bz*.28,INK)};
  antler([hx*(-.12+g),-hy*.95],-27,1);
  const band=[];for(let i=0;i<=8;i++){const a=Math.PI*(1-i/8);band.push([Math.cos(a)*hx*.84,-hy*.4-Math.sin(a)*hy*.6])}
  h.tube(band.map(P).map(cl),Math.max(4.6,z*.17),WN_RD,{ow:3.6});h.line(band.slice(2,6).map(q=>[q[0],q[1]-z*.03]).map(P).map(cl),1.4,'#F07080',.3);
  antler([hx*(.18+g),-hy*.96],24,0)};
HAT2['Year of the Sheep Hood']=function(h,s,L,HT){// a cream woolly hood, face open; prick ears poke out through two holes (flop ears stay inside, see frame), floppy sheep ears, two small curled horns
  const hx=s.head.rx,hy=s.head.ry,f=L.face,er=s.eyes,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],CR='#FBF3E2',CU='#D8C8A6',HN='#D9B77E',HD='#A8844C',PK='#F6B6C2',cl=q=>[q[0],Math.min(q[1],GY+3)];
  // the face opening: an ellipse that clears both eyes
  const ox=hx*.2,oy=hy*.12,ex=Math.min(hx*e0[0]-er[0],hx*e1[0]-er[1]),ey=Math.min(hy*e0[1]-er[0],hy*e1[1]-er[1]),rx=Math.max(hx*.8,ox-ex+4),ry=Math.max(hy*.8,oy-ey+3);
  const o=[],n=[];for(let an=-30,i=0;an>=-238;an-=13,i++){const k=1.15+(i%2?.06:0);o.push([Math.cos(an*D2R)*hx*k,Math.sin(an*D2R)*hy*(k+.03)])}
  for(let an=-238;an<=-30;an+=13)n.push([ox+Math.cos(an*D2R)*rx,oy+Math.sin(an*D2R)*ry]);
  h.shape(o.concat(n).map(HT).map(cl),CR,{w:3.8,step:7,amp:.9});
  h.line(n.slice(1,-1).map(q=>[ox+(q[0]-ox)*1.08,oy+(q[1]-oy)*1.08]).map(HT).map(cl),3,CU,.6);
  [-60,-100,-140,-175,-205,-80,-160].forEach((an,i)=>{const t=i<5?.5:.75,a=an*D2R,ri=[ox+Math.cos(a)*rx,oy+Math.sin(a)*ry],ro=[Math.cos(a)*hx*1.15,Math.sin(a)*hy*1.18],c=HT([ri[0]+(ro[0]-ri[0])*t,ri[1]+(ro[1]-ri[1])*t]);h.line(spiral(c[0],c[1],.4,Math.max(2.6,hx*.09),1.2,8,i*1.7).map(cl),1.8,CU,.3)});
  const ear=(root,ang,far)=>{const z=hx*.74,M=q=>{const r2=rot([q[0]*z,q[1]*z],ang);return HT([root[0]+r2[0],root[1]+r2[1]])},E=[[0,-.22],[-.5,-.32],[-.95,-.14],[-1.06,.08],[-.62,.26],[0,.22]];
   h.shape(E.map(M).map(cl),far?mix(CR,PEN,.22):CR,{w:3.2,step:6,ox:0,oy:0,sc:1,amp:.6});h.shape([[-.12,-.07],[-.56,-.15],[-.86,-.02],[-.56,.11],[-.12,.09]].map(M).map(cl),far?mix(PK,PEN,.2):PK,{noline:1,ox:0,oy:0,sc:1})};
  ear([-hx*.88,-hy*.66],-30,1);ear([-hx*1.0,-hy*.1],24,0);
  // the dog's own prick ears out through two holes (frame skips every ear under the hood): each ear from where it leaves the wool, a woolly rim at the hole
  if(!L.ghost)earList(s).forEach(e=>{if(e.flop)return;let p=earPose(s,L,e).slice();const n=p.length,out=q=>Math.hypot(q[0]/hx,q[1]/hy)>=1.1,cut=(q,t)=>{for(let k=0;k<.85;k+=.05){const r=[q[0]+(t[0]-q[0])*k,q[1]+(t[1]-q[1])*k];if(out(r))return r}return[q[0]+(t[0]-q[0])*.85,q[1]+(t[1]-q[1])*.85]};
   p[0]=cut(p[0],p[1]);p[n-1]=cut(p[n-1],p[n-2]);const col=e.col||s.ear||s.hcol;
   h.shape((s.earRound?chaikin(p,s.earRound):p).map(HT).map(cl),col,{w:3.8});
   if(e.inner){const c=[(p[0][0]+p[2][0])/2,(p[0][1]+p[2][1])/2],ip=p.map(q=>[c[0]+(q[0]-c[0])*.55,c[1]+(q[1]-c[1])*.55]);ip[1]=[c[0]+(p[1][0]-c[0])*.7,c[1]+(p[1][1]-c[1])*.7];h.shape((s.earRound?chaikin(ip,s.earRound):ip).map(HT).map(cl),s.ears==='tall'?W:'#FFB8C4',{noline:1,ox:0,oy:0})}
   if(e.fold){const a=p[e.fold[0]],b=p[e.fold[1]];h.line([a,[(a[0]+b[0])/2,(a[1]+b[1])/2+1.5],b].map(HT).map(cl),2.4,lum(col)<.32?mix(col,W,.45):mix(col,PEN,.45),.4)}
   const a=p[0],c=p[n-1],m=[(a[0]+c[0])/2,(a[1]+c[1])/2],k=-.14,ml=Math.hypot(m[0]/hx,m[1]/hy)||1;
   h.tube([[a[0]+(a[0]-m[0])*-k,a[1]+(a[1]-m[1])*-k],[m[0]*(1+.06/ml),m[1]*(1+.06/ml)],[c[0]+(c[0]-m[0])*-k,c[1]+(c[1]-m[1])*-k]].map(HT).map(cl),Math.max(4.4,hx*.16),CR,{ow:3.2})});
  // two small curled horns on top, after the ears: the far one peeks out behind the near one
  const horn=(c,a0,dir,far)=>{const r=Math.max(4.6,hx*.2),sp=spiral(0,0,r*.28,r,.95,16,a0).map(q=>HT([c[0]+q[0]*dir,c[1]+q[1]])).map(cl),col=far?mix(HN,PEN,.25):HN;
   h.tube(sp.slice(0,9),r*.5,col,{ow:3.2});h.tube(sp.slice(8),r*.34,col,{ow:3});h.line(sp.slice(2,14),1.4,HD,.2)};
  horn([-hx*.2,-hy*1.08],-2.4,-1,1);horn([hx*.12,-hy*1.04],-2.4,1,0)};
NECK2['Snowflake Snood']=function(h,s,L,HT){// a chunky knitted tube: blue with cream ribbed rims and white snowflakes, no ends
  const a=neckAnchor(s,HT),hy=s.head.ry,BL='#4F7FC9',BD='#2F5A9E',th=Math.max(13,hy*.6),cl=q=>[q[0],Math.min(q[1],GY-1)];
  const d=[a.r[0]-a.l[0],a.r[1]-a.l[1]],m=Math.hypot(d[0],d[1])||1,u=[d[0]/m,d[1]/m],v=[-u[1],u[0]];
  let lift=0;const sag=t=>{const x=a.l[0]+d[0]*t,y=a.l[1]+d[1]*t,k=Math.sin(Math.PI*Math.max(0,Math.min(1,t)))*6+th*.3;return[x+v[0]*k,y+v[1]*k-lift]};
  {let my=-1e9;for(let i=0;i<=8;i++){const c=sag(-.22+i/8*1.2);my=Math.max(my,c[1]+Math.max(0,v[1])*th*.6)}lift=Math.min(th*.7,Math.max(0,my-(GY-1)))}// lying down: ride up the chin instead of flattening on the ground
  const top=[],bot=[];for(let i=0;i<=8;i++){const t=-.22+i/8*1.2,c=sag(t),w=th*(.5+.08*Math.sin(i*2.2));top.push([c[0]-v[0]*th*.5,c[1]-v[1]*th*.5]);bot.unshift([c[0]+v[0]*w*1.1,c[1]+v[1]*w*1.1])}
  h.shape(chaikin(top.concat(bot),1).map(cl),BL,{w:4,step:7,amp:.9});
  const rim=(P,dd)=>P.map(q=>[q[0]+v[0]*dd,q[1]+v[1]*dd]);
  h.line(rim(top.slice(1,-1),th*.13).map(cl),th*.17,WN_CR,.4);h.line(rim(bot.slice(1,-1),-th*.15).map(cl),th*.17,WN_CR,.4);
  [rim(top.slice(1,-1),th*.13),rim(bot.slice(1,-1),-th*.15)].forEach(R=>R.forEach((q,i)=>{if(i%2)return;h.line([[q[0]-v[0]*th*.07,q[1]-v[1]*th*.07],[q[0]+v[0]*th*.07,q[1]+v[1]*th*.07]].map(cl),1.3,'#C9B48E',.15)}));
  [.06,.42,.78].forEach((t,i)=>{const c=sag(t);wnFlake(h,cl([c[0]+v[0]*th*.08,c[1]+v[1]*th*.08]),th*(i===1?.25:.2),W,1.9,0)});
  h.line([sag(-.16),sag(.4),sag(.94)].map(q=>[q[0]+v[0]*th*.42,q[1]+v[1]*th*.42]).map(cl),1.6,BD,.6)};
NECK2['Ugly Sweater Rosette']=function(h,s,L,HT){// the Parade Rosette's shape in red and green, lumpier, odd ribbons, a tiny knitted sweater badge in the middle
  const a=neckAnchor(s,HT),GO='#F2C14E',cl=q=>[q[0],Math.min(q[1],GY-1)];
  const sag=t=>{const x=a.l[0]+(a.r[0]-a.l[0])*t,y=a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*8;return[x,Math.min(y,GY-18)]};
  const pts=[];for(let i=0;i<=8;i++)pts.push(sag(i/8));h.line(pts,6.4,INK);h.line(pts,4,WN_GR,.4);
  for(let i=1;i<8;i+=2){const q=pts[i];h.line([[q[0]-2,q[1]-1.5],[q[0]+2,q[1]+1.5]],1.4,WN_RD,.1)}
  const lie=/^(sleep|down|crouch|playdead|rollover)$/.test(L.pose),c=sag(lie?.15:.58),k=[c[0]+(lie?-4:2),Math.min(c[1]+(lie?0:7),GY-14)];
  h.shape([[k[0]-2,k[1]],[k[0]-12,k[1]+19],[k[0]-8,k[1]+15],[k[0]-6,k[1]+21],[k[0]-3,k[1]+16],[k[0]+2,k[1]+3]].map(cl),WN_RD,{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4});
  h.shape([[k[0]+1,k[1]],[k[0]+5,k[1]+13],[k[0]+9,k[1]+10],[k[0]+11,k[1]+14],[k[0]+6,k[1]+1]].map(cl),WN_GR,{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4});
  const ro=scallop(0,0,12.5,11.5,10,.3).map((q,i)=>{const r2=rot(q,-10),j=1+.07*Math.sin(i*1.9);return[k[0]+r2[0]*j+(r2[1]<0?r2[1]*.16:0),k[1]+r2[1]*.86*j]});
  h.shape(ro.map(cl),'#EE3B35',{w:2.8,step:30,ox:.6,oy:-.4,sc:1,amp:.6});
  h.shape(scallop(k[0]+.5,k[1],8.4,7.6,8,.22).map(cl),'#55B24C',{noline:1,step:30,ox:0,oy:0,sc:1});h.line(scallop(k[0]+.5,k[1],8.4,7.6,8,.22).slice(4,26).map(cl),1.4,WN_GD,.3);
  [[-9.5,-5],[10,4]].forEach(o=>h.dot(k[0]+o[0],k[1]+o[1]*.86,1.6,1.6,GO));
  const sw=[[-3.2,-4],[-1.2,-5],[1.2,-5],[3.2,-4],[6.4,-.6],[5,1],[3.4,-.4],[3.4,4.6],[-3.4,4.6],[-3.4,-.4],[-5,1],[-6.4,-.6]].map(q=>cl([k[0]+.5+q[0]*1.05,k[1]+q[1]*1.05]));
  h.shape(sw,WN_CR,{w:1.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.2,famp:.15});
  h.line([[k[0]-2.6,k[1]+1],[k[0]-1,k[1]-.6],[k[0]+.5,k[1]+1],[k[0]+2,k[1]-.6],[k[0]+3.6,k[1]+1]].map(cl),1.3,WN_RD,.05);h.dot(k[0]+.5,k[1]+3,.9,.9,WN_GR)};
/* ---------- v2.11 Tokyo Trip bandanas (V211.md 5.2): a crude triangle under the chin like the Red Bandana, one picture each ---------- */
function tkBand(h,s,L,HT,col,deco){// fill, then the picture (Q(u,v): u across the top edge, v down toward the tip), then the ink edge and the knot
  const a=neckAnchor(s,HT),hx=s.head.rx,hy=s.head.ry,up=/^(howl|rollover|playdead)$/.test(L.pose),t=clampG(HT([-hx*.22,hy*(up?1.45:1.78)])),d=[a.r[0]-a.l[0],a.r[1]-a.l[1]],l=[a.l[0]-d[0]*.06,a.l[1]-d[1]*.06],r=[a.r[0]+d[0]*.05,a.r[1]+d[1]*.05];
  const lp=(p,q,u)=>[p[0]+(q[0]-p[0])*u,p[1]+(q[1]-p[1])*u],Q=(u,v)=>lp(lp(l,r,u),t,v),z=Math.max(4.2,Math.hypot(d[0],d[1])*.16);
  h.shape([l,r,t],col,{noline:1,ox:1,oy:-.6,sc:1,famp:.5});
  deco(Q,z);
  h.shape([l,r,t],null,{w:4,step:9,closed:1});h.shape(circ(l[0],l[1],4.6,4,7),col,{w:2.8,ox:0,oy:0,sc:1,closed:1})}
NECK2['Shibuya Bandana']=function(h,s,L,HT){// green, a little scramble crossing: one set of white zebra bars, a second set across it
  tkBand(h,s,L,HT,'#3FA45A',(Q,z)=>{const w=Math.max(2,z*.42);[.3,.42,.54,.66].forEach(u=>h.line([Q(u,.1),Q(u,.36)],w,W,.25));
   [.5,.64].forEach(v=>h.line([Q(.38,v),Q(.64,v)],w,W,.25));h.line([Q(.16,.14),Q(.8,.12)],1.6,'#22703A',.3)})};
NECK2['Asakusa Bandana']=function(h,s,L,HT){// red with a tiny Kaminarimon lantern: a fat orange-red paper lantern, black caps, a gold tassel
  tkBand(h,s,L,HT,'#D7263D',(Q,z)=>{const c=Q(.5,.36),rx=z*.78,ry=z*.98;
   [[.2,.18],[.8,.16],[.34,.66]].forEach(q=>{const p=Q(q[0],q[1]);h.dot(p[0],p[1],1.6,1.6,W)});
   h.shape(circ(c[0],c[1],rx,ry,10),'#FF7A45',{w:2.2,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2});
   h.line([[c[0]-rx*.62,c[1]-ry*.92],[c[0]+rx*.62,c[1]-ry*.92]],2.6,INK,.15);h.line([[c[0]-rx*.62,c[1]+ry*.92],[c[0]+rx*.62,c[1]+ry*.92]],2.6,INK,.15);
   h.line([[c[0]-rx*.5,c[1]],[c[0]+rx*.5,c[1]]],1.4,'#7A1020',.15);h.line([[c[0],c[1]+ry],[c[0],c[1]+ry+3.5]],1.6,'#F2C14E',.1)})};
NECK2['Tokyo Tower Bandana']=function(h,s,L,HT){// orange and white bands like the tower, a little lattice on the white band
  tkBand(h,s,L,HT,'#F25C1E',(Q,z)=>{h.shape([Q(0,.32),Q(1,.32),Q(1,.54),Q(0,.54)],'#FFFBF2',{noline:1,ox:0,oy:0,sc:1,famp:.3});h.shape([Q(0,.76),Q(1,.76),Q(.5,1)],'#FFFBF2',{noline:1,ox:0,oy:0,sc:1,famp:.3});
   [.25,.45,.65].forEach(u=>{h.line([Q(u,.34),Q(u+.14,.52)],1.3,'#F25C1E',.15);h.line([Q(u+.14,.34),Q(u,.52)],1.3,'#F25C1E',.15)});
   h.line([Q(.02,.32),Q(.98,.32)],1.8,INK,.3);h.line([Q(.02,.54),Q(.98,.54)],1.8,INK,.3);h.line([Q(.02,.76),Q(.98,.76)],1.8,INK,.3)})};
/* ---------- v2.15 Around Town (V215.md 6.2, 6.3): the Sunflower Collar, the Sailor Cap and the Doggy Life Vest (new names only: old renders never reach them) ---------- */
const V215_GR='#4FA845',V215_GD='#2F7A2C',V215_YE='#FFD23A',V215_NV='#25397A',V215_OR='#FF8A24',V215_OD='#D9621A',V215_BL='#2D6CDF';
NECK2['Sunflower Collar']=function(h,s,L,HT){// a green collar with two leaf nicks, one big crude sunflower under the chin on a leaf
  const a=neckAnchor(s,HT),sag=t=>{const x=a.l[0]+(a.r[0]-a.l[0])*t,y=a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*8;return[x,Math.min(y,GY-18)]};
  const pts=[];for(let i=0;i<=8;i++)pts.push(sag(i/8));h.line(pts,7,INK);h.line(pts,4.6,V215_GR,.4);
  [2,6].forEach(i=>{const q=pts[i];h.line([[q[0]-2.4,q[1]-1.4],[q[0]+1.6,q[1]+2]],1.5,V215_GD,.1)});
  const lie=/^(sleep|down|crouch|playdead|rollover)$/.test(L.pose),c0=sag(lie?.2:.56),R=Math.max(9,Math.min(13,s.head.rx*.4)),c=[c0[0]+(lie?-3:1),Math.min(c0[1]+(lie?2:R*.6),GY-R-1)];
  h.shape([[c[0]-2,c[1]+2],[c[0]-R*1.1,c[1]+R*1.05],[c[0]-R*1.6,c[1]+R*.45],[c[0]-R*.8,c[1]-.5]],'#5CC461',{w:2,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4});
  h.shape(scallop(c[0],c[1],R,R*.94,9,.34),V215_YE,{w:2,step:30,ox:.6,oy:-.4,sc:1,amp:.4});
  h.shape(circ(c[0]+.5,c[1],R*.44,R*.42,9),'#8A5426',{w:1.8,ox:0,oy:0,sc:1,closed:1,amp:.3});
  [[-.16,-.12],[.16,.04],[-.02,.2],[.2,-.2]].forEach(o=>h.dot(c[0]+.5+o[0]*R,c[1]+o[1]*R,1,1,'#5A3418'))};
HAT2['Sailor Cap']=function(h,s,L,HT){// a white sailor cap: a round crown, a navy band with a little gold anchor, two navy ribbon tails off the back
  const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.02,-5),W2=hx*.5,H=hy*.62;
  h.tube([[-W2*.9,-3],[-W2*1.45,4],[-W2*1.7,12]].map(P),3.2,V215_NV,{ow:2.8});h.tube([[-W2*.8,-2],[-W2*1.2,7],[-W2*1.25,15]].map(P),3.2,V215_NV,{ow:2.8});
  h.shape([[-W2,0],[-W2*1.08,-H*.55],[-W2*.75,-H*.95],[-W2*.1,-H*1.06],[W2*.6,-H*.98],[W2*1.06,-H*.6],[W2,0]].map(P),W,{w:3.8,step:8});
  h.crayon(W2*.9,H*.36,q=>P([q[0],q[1]-H*.55]),'#E8E2D8',4);h.line([[-W2*.55,-H*.9],[W2*.45,-H*.86]].map(P),1.6,'#C9BFB0',.5);
  h.shape([[-W2*1.12,4],[W2*1.12,4],[W2*1.1,-H*.32],[-W2*1.1,-H*.32]].map(P),V215_NV,{w:3.4,step:8});
  h.line([[-W2*1.02,-H*.16],[W2*1.02,-H*.17]].map(P),1.4,'#FFFFFF',.3);
  const an=P([W2*.42,-H*.14]),u=P([W2*.42,-H*.14-6]);h.line([u,an],1.8,V215_YE,.1);h.line([[an[0]-3.4,an[1]-1.6],[an[0],an[1]+1.6],[an[0]+3.4,an[1]-1.6]],1.8,V215_YE,.1);h.line([[u[0]-2.4,u[1]+1.4],[u[0]+2.4,u[1]+1.4]],1.6,V215_YE,.1)};
BODY2['Doggy Life Vest']=function(h,s,L,B,p){// a puffy bright orange float vest: yellow trim, a white stripe, two blue straps with buckles round the tummy, a grab handle on the back
  const b=s.body,f=s.fluff?1.12:1.08,cl=q=>[q[0],Math.min(q[1],GY-1)],vp=p.map(q=>[q[0]*1.04,q[1]*1.05]);
  const yy=x=>b.ry*(f+.06)*.97*Math.sqrt(Math.max(0,1-Math.pow(x/(b.rx*f*1.04),2))),hx=[.3,.56];
  {const t0=B([b.rx*hx[0],-yy(b.rx*hx[0])*.9]),t1=B([b.rx*(hx[0]+.04),-yy(b.rx*hx[0])-Math.max(9,b.ry*.48)]),t2=B([b.rx*(hx[1]-.04),-yy(b.rx*hx[1])-Math.max(9,b.ry*.48)]),t3=B([b.rx*hx[1],-yy(b.rx*hx[1])*.9]);h.tube([t0,t1,t2,t3].map(cl),3,V215_NV,{ow:3})}
  h.shape(vp.map(B).map(cl),V215_OR,{w:4.6});h.crayon(b.rx*.7,b.ry*.7,q=>B([q[0]+b.rx*.3,q[1]]),V215_OR,6);
  [.84,.4,-.04].forEach(xx=>{const x=b.rx*xx;h.line([[x,-yy(x)*.86],[x+b.rx*.03,0],[x,yy(x)*.86]].map(B).map(cl),1.8,V215_OD,.5)});
  [.62,.18].forEach(xx=>{const bw=b.rx*.045,x0=b.rx*xx-bw,x1=b.rx*xx+bw;h.shape([[x0,-yy(x0)],[x1,-yy(x1)],[x1,yy(x1)],[x0,yy(x0)]].map(B).map(cl),V215_NV,{noline:1,ox:0,oy:0,step:7,famp:.7});
   const k=B([b.rx*xx,yy(b.rx*xx)*.4]);h.shape([[k[0]-4.6,k[1]-3.4],[k[0]+4.6,k[1]-3.4],[k[0]+4.6,k[1]+3.4],[k[0]-4.6,k[1]+3.4]],V215_YE,{w:2.2,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3});h.line([[k[0],k[1]-2.2],[k[0],k[1]+2.2]],1.3,INK,.1)});
  h.line([[b.rx*.9,-b.ry*.5],[b.rx*.5,-b.ry*.62],[b.rx*.05,-b.ry*.6]].map(B).map(cl),3.4,W,.5);
  h.line(vp.slice(0,5).map(B).map(cl),6,V215_YE,.7);h.line(vp.slice(-6).map(B).map(cl),6,V215_YE,.7)};
/* ---------- v2.17 Dog Days (V217.md 2): the Bond 10 gifts, the Crayon Crown and the Golden Collar (new names only: old renders never reach them) ---------- */
HAT2['Crayon Crown']=function(h,s,L,HT){// a wobbly paper crown coloured in with crayons: five uneven points, a red band, three crayon-dot jewels, a pink blob on each tip
  const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.02,-4),W2=hx*.54,H=hy*.8;
  const pts=[[-W2,2],[-W2*1.05,-H*.4],[-W2*1.1,-H*1],[-W2*.62,-H*.5],[-W2*.32,-H*1.12],[0,-H*.54],[W2*.36,-H*1.06],[W2*.64,-H*.5],[W2*1.08,-H*.96],[W2*1.04,-H*.4],[W2,2]];
  h.shape(pts.map(P),'#FFD23A',{w:3.8,step:8});
  h.part(true);h.crayon(W2*.8,H*.34,q=>P([q[0],q[1]-H*.52]),'#F2A93B',5);h.part(false);
  h.shape([[-W2*1.01,2],[W2*1.01,2],[W2*1.03,-H*.3],[-W2*1.03,-H*.3]].map(P),'#E8473D',{w:3,step:8});
  [[-.56,'#4F8FD6'],[0,'#6DBE5A'],[.56,'#8E63C7']].forEach(([x,c])=>{const q=P([W2*x,-H*.14]);h.shape(circ(q[0],q[1],3.3,2.9,7),c,{w:1.8,ox:0,oy:0,sc:1,closed:1,amp:.3})});
  [[-1.1,-1],[-.32,-1.12],[.36,-1.06],[1.08,-.96]].forEach(([x,y])=>{const q=P([W2*x,H*y]);h.shape(circ(q[0],q[1],2.8,2.6,7),'#F28FA5',{w:1.6,ox:0,oy:0,sc:1,closed:1,amp:.25})});
  h.line([[-W2*.5,-H*.42],[-W2*.4,-H*.82]].map(P),1.4,'#FFF3B0',.3)};
/* v2.29 art fix (art review item 13, owner 12 Nov 2026): the Bond collars (the Golden Collar and the Star Collar) sit on the neck in every pose.
   Head up, the band hangs under the chin as before; where the tag would hang down among the front paws (a puppy, a short-legged dog), it sits up on the band, a little smaller.
   Head down or resting on the ground (eat, sleep, crouch, bow, sniff, dig, play dead, roll over, and any pose whose chin is near the ground),
   the band goes round the neck where it leaves the head, drawn behind the head (NECKB, before the ears and the head) so it never crosses the face,
   and the tag is tucked away. frame() hands the dog's random stream back after the tucked band, so the dog drawn over it is the plain dog. */
const NECKB={},BC_TUCK=/^(eat|sleep|crouch|bow|sniff|dig|playdead|rollover)$/;
function bcSag(s,HT){const a=neckAnchor(s,HT);return t=>[a.l[0]+(a.r[0]-a.l[0])*t,a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*8]}
function bcTuck(s,L,HT){if(BC_TUCK.test(L.pose))return true;const sg=bcSag(s,HT);for(let i=0;i<=8;i++)if(sg(i/8)[1]>GY-18)return true;return false}
// head up: the band under the chin, then tag(c,R); a tag that would hang down among the front paws (its foot within 16 px of the ground) sits up on the band instead
function bcFront(h,s,L,HT,col,shine,Rk,tag){if(bcTuck(s,L,HT))return;
  const sag=bcSag(s,HT),pts=[];for(let i=0;i<=8;i++)pts.push(sag(i/8));h.line(pts,7.4,INK);h.line(pts,5,col,.4);h.line(pts.slice(1,5).map(q=>[q[0],q[1]-1]),1.4,shine,.3);
  if(L.pose==='down')return;// lying down, head up: the tag is tucked under the chin (as before)
  const c0=sag(.56),R=Math.max(Rk[0],Math.min(Rk[1],s.head.rx*Rk[2])),c=[c0[0],Math.min(c0[1]+R+3,GY-R-1)];
  if(c[1]+R>GY-16){tag([c0[0],c0[1]+R*.36],R*.76);return}
  h.line([[c0[0],c0[1]+1],[c[0],c[1]-R+1]],1.8,INK,.1);tag(c,R)}
// head down: a short band across the neck just past the head's outline, square to the neck (the head end to the chest), bowed a little round it
function bcBehind(h,s,L,HT,col,shine){if(!bcTuck(s,L,HT))return;
  const b=s.body,hx=s.head.rx,hy=s.head.ry,ht=L.hT,an=-(ht.a||0)*D2R,ca=Math.cos(an),sa=Math.sin(an),
   loc=p=>{const dx=p[0]-ht.x,dy=p[1]-ht.y;return[(dx*ca-dy*sa)/(hx*(ht.sx||1)),(dx*sa+dy*ca)/(hy*(ht.sy||1))]},
   nh=HT([-hx*.2,hy*.35]),nb=T(L.bT)([b.rx*.62,-b.ry*.3]),dx=nb[0]-nh[0],dy=nb[1]-nh[1],ln=Math.hypot(dx,dy)||1,u=[dx/ln,dy/ln],nv=[-u[1],u[0]];
  let t=0;for(;t<1;t+=.04){const q=loc([nh[0]+dx*t,nh[1]+dy*t]);if(q[0]*q[0]+q[1]*q[1]>1)break}
  t=Math.min(t,1);const c=[nh[0]+dx*t+u[0]*4,nh[1]+dy*t+u[1]*4],hl=Math.max(8,Math.min(16,hx*.5)),pts=[];
  for(let i=0;i<=4;i++){const v=i/2-1,bw=(1-v*v)*2.6;pts.push([c[0]+nv[0]*hl*v-u[0]*bw,Math.min(c[1]+nv[1]*hl*v-u[1]*bw,GY-2)])}
  h.line(pts,7.4,INK);h.line(pts,5,col,.4);h.line(pts.slice(1,3).map(q=>[q[0]-u[0]*1.2,q[1]-u[1]*1.2]),1.4,shine,.3)}
NECK2['Golden Collar']=function(h,s,L,HT){// a shiny gold collar (a gold line in its own ink), a white shine, and a round gold tag with a pink crayon heart under the chin
  bcFront(h,s,L,HT,'#F2B83A','#FFF3B0',[6.5,9,.28],(c,R)=>{h.shape(circ(c[0],c[1],R,R*.96,10),'#F2B83A',{w:2.2,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3});h.heart(c[0],c[1]+.6,R*.62,'#F28FA5')})};
NECKB['Golden Collar']=(h,s,L,HT)=>bcBehind(h,s,L,HT,'#F2B83A','#FFF3B0');
/* v2.28 Stories and stars (V228.md 2): the Star Collar, the 10 Bond stars keepsake (a new name only: old renders never reach it).
   The Golden Collar's shape: a blue crayon collar (a blue line inside its own ink), a pale shine, and a gold star tag with a little ring */
NECK2['Star Collar']=function(h,s,L,HT){bcFront(h,s,L,HT,'#4F8FD6','#CFE3F7',[7,9.5,.3],(c,R)=>star5(h,c,R,'#FFD23A',2.2))};
NECKB['Star Collar']=(h,s,L,HT)=>bcBehind(h,s,L,HT,'#4F8FD6','#CFE3F7');
OUT.neck.push('Star Collar');
/* ---------- v2.11.1 Halloween 2026 costumes (V2111.md 3): body slot, each with its own head piece ----------
   TOP2 holds the costume's head piece, drawn after the neck item in place of the hat (frame drops the head-slot hat while one is worn).
   Neck items: the Pumpkin Patch Suit's leaf collar and the Little Bat Costume's ruffle sit over the neck item (it peeks out under them);
   the Trick-or-Treat Ghost's sheet hides it (and the dog's ears, ruff and topknot, like the Ghost Sheet). */
const TOP2={},HW2_PU='#6E4AA8',HW2_PD='#4A2F7E',HW2_PL='#B79BE0',HW2_OR='#F08A24',HW2_OD='#C25E12',HW2_GR='#5E9E3A',HW2_GD='#3E6E22';
function hw2Sag(a,t,k){return[a.l[0]+(a.r[0]-a.l[0])*t,a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*k]}
BODY2['Pumpkin Patch Suit']=function(h,s,L,B){// a fat round pumpkin over the body: deep crayon ribs, a pale shine, a little vine curling off the back
  const b=s.body,f=s.fluff?1.12:1.08,sit=/^(sit|beg|yawn|howl|paw|scratch|dance)$/.test(L.pose),cl=q=>[q[0],Math.min(q[1],GY-1)];
  const rx=b.rx*f*1.02,up=b.ry*(f+.16),dn=b.ry*(f+(sit?.38:.2)),E=a=>{const c=Math.cos(a),sn=Math.sin(a);return[c*rx*(1+.05*Math.cos(a*8)),sn*(sn>0?dn:up)*(1+.04*Math.cos(a*8))]};
  const pts=[];for(let i=0;i<26;i++)pts.push(E(i/26*Math.PI*2));
  h.shape(pts.map(B).map(cl),'#F7892E',{w:4.6,step:9});h.crayon(rx*.8,b.ry*.8,B,'#F7892E',9);
  [-.78,-.48,-.16,.16,.48,.78].forEach((xx,i)=>{const x=xx*rx,yy=Math.sqrt(Math.max(0,1-xx*xx)),w=i%2?2.4:3;
   h.line(dense([[x*.8,-up*yy*.9],[x*1.08+(i%2?1.5:-1.5),0],[x*.8,dn*yy*.9]],false,5).map(B).map(cl),w,HW2_OD,.6)});
  h.line([[-rx*.3,-up*.62],[-rx*.05,-up*.74]].map(B).map(cl),3.4,'#FFC27A',.4);h.line([[rx*.3,-up*.6],[rx*.42,-up*.48]].map(B).map(cl),2.6,'#FFC27A',.3);
  const v=B([-rx*.62,-up*.82]);h.line(spiral(v[0]-5,v[1]-4,.5,5.5,1.25,10,.6).map(cl),2.2,HW2_GD,.3);
  const lf=[[0,0],[5,-5],[11,-4],[13,0],[8,4],[3,3]].map(q=>{const r2=rot(q,-150+(L.bT.a||0));return cl([v[0]+r2[0],v[1]+r2[1]])});h.shape(lf,'#74B04A',{w:2.4,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4});h.line([lf[0],lf[3]],1.4,HW2_GD,.2)};
TOP2['Pumpkin Patch Suit']=function(h,s,L,HT){// the green leaf collar over the neck, then a stubby stem with a curly tendril on top of the head
  const hx=s.head.rx,hy=s.head.ry,a=neckAnchor(s,HT),cl=q=>[q[0],Math.min(q[1],GY-1)],z=Math.max(7,Math.min(12,hy*.42));
  const band=[];for(let i=0;i<=8;i++)band.push(cl(hw2Sag(a,-.08+i/8*1.14,7)));h.tube(band,6,HW2_GR,{ow:3.6});
  [-.04,.2,.44,.68,.92].forEach((t,i)=>{const c=cl(hw2Sag(a,t,7)),d=hw2Sag(a,t+.05,7),an=Math.atan2(d[1]-c[1],d[0]-c[0])/D2R+90+(i%2?16:-12);
   const lf=[[0,0],[z*.42,z*.38],[z*.28,z*.9],[0,z*1.3],[-z*.28,z*.9],[-z*.42,z*.38]].map(q=>{const r2=rot([q[1],-q[0]],an);return cl([c[0]+r2[0],c[1]+r2[1]])});
   h.shape(lf,i%2?HW2_GR:'#74B04A',{w:2.4,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4});h.line([lf[0],lf[3]],1.4,HW2_GD,.2)});
  const P=hatP(s,L,HT,-.04,-8),H=hy*.5,w=Math.max(4.6,hx*.2);
  h.tube([[0,4],[-w*.2,-H*.45],[w*.35,-H]].map(P),w,'#7A6A2E',{ow:3.4});h.line([[-w*.1,0],[-w*.15,-H*.5]].map(P),1.4,'#B6A35A',.2);
  h.line(spiral(0,0,.4,Math.max(4,hx*.17),1.3,12,2.4).map(q=>P([w*.6+q[0]+hx*.16,-H*.55+q[1]])),2.2,HW2_GD,.3);
  const k=P([-w*.6,-H*.3]),lf=[[0,0],[-5,-4],[-11,-3],[-13,1],[-7,4],[-2,3]].map(q=>{const r2=rot(q,-12);return[k[0]+r2[0],k[1]+r2[1]]});
  h.shape(lf.map(cl),'#74B04A',{w:2.4,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4})};
TOP2['Trick-or-Treat Ghost']=function(h,s,L,HT){// one big white sheet over everything, a ragged pointy hem, ear bumps, two eye holes, a jack-o'-lantern bucket held in the mouth
  const B=T(L.bT),b=s.body,hx=s.head.rx,hy=s.head.ry,f=s.fluff?1.12:1.1,P=[],N=noseLocal(s),SH='#FFFDF8';
  circ(0,b.ry*.12,b.rx*f,b.ry*(f+.26),16).forEach(q=>P.push(B(q)));
  circ(0,-hy*.04,hx*1.16,hy*1.2,14).forEach(q=>P.push(HT(q)));
  P.push(HT([N[0]-hx*.3,N[1]+hy*.95]),HT([N[0]+hx*.1,N[1]+hy*.6]));if(s.face.snout)P.push(HT([N[0]+hx*.14,N[1]-hy*.1]),HT([N[0]+hx*.06,N[1]+hy*.32]));
  const H=chaikin(hull(P),2);let cx=0,cy=0,my=-1e9;H.forEach(q=>{cx+=q[0]/H.length;cy+=q[1]/H.length;my=Math.max(my,q[1])});
  // the hem: ragged points along the lowest edge (a sheet cut with blunt scissors), not the Ghost Sheet's soft scallops
  const D=dense(H,true,5),y0=cy+(my-cy)*.3,y1=cy+(my-cy)*.65,pts=D.map((q,i)=>{const wt=Math.max(0,Math.min(1,(q[1]-y0)/(y1-y0)));if(!wt)return q;const dx=q[0]-cx,dy=q[1]-cy,m=Math.hypot(dx,dy)||1,k=wt*(i%3===0?7:i%3===1?-1:2);return[q[0]+dx/m*k,Math.min(q[1]+dy/m*k,GY+1)]});
  h.shape(pts,SH,{w:4.2,step:30,amp:.5,famp:.5});h.crayon(b.rx,b.ry,B,SH,7);h.crayon(hx,hy*.6,q=>HT([q[0],q[1]-hy*.2]),SH,4);
  [[[.45,-.55],[.3,1.2]],[[-.35,-.6],[-.5,1.25]],[[-.75,-.2],[-.85,1.1]]].forEach(q=>h.line(q.map(B).map(p=>[p[0],Math.min(p[1],GY-2)]),2,'#C9CED8',.7));
  const lie=/^(rollover|playdead)$/.test(L.pose);// lying on its side or rolled over: no ear bumps (they would float off the sheet), the bucket set down on the ground
  if(!lie)earList(s).forEach(e=>{if(e.flop)return;const p=earPose(s,L,e);let ex=0,ey=0;p.forEach(q=>{ex+=q[0]/p.length;ey+=q[1]/p.length});
   const m=Math.hypot(ex/hx,ey/hy)||1,dir=[ex/hx/m,ey/hy/m],z=hx*(/^(giant|bat|tall)$/.test(s.ears)?.34:.28),c=HT([dir[0]*hx*1.14,dir[1]*hy*1.18]),an=Math.atan2(c[1]-HT([0,0])[1],c[0]-HT([0,0])[0]);
   h.shape(circ(c[0],c[1],z,z,10),SH,{noline:1,ox:0,oy:0,sc:1});const arc=[];for(let j=-4;j<=4;j++){const t=an+j*Math.PI/8.5;arc.push([c[0]+Math.cos(t)*z,c[1]+Math.sin(t)*z])}h.line(arc,4,INK,.8)});
  ghostEyes(h,s,L,HT);
  // the treat bucket: a round orange pail with a carved face, hanging by its handle from the mouth (resting on the ground when the head is low);
  // lying down it stands on the ground just in front of the head, its handle up
  const m=HT([N[0]-hx*.12,N[1]+hy*.42]),z=Math.max(10,Math.min(16,hx*.46));let c;
  if(lie){let fx=-1e9;circ(0,0,hx*1.1,hy*1.1,12).forEach(q=>{fx=Math.max(fx,HT(q)[0])});c=[fx+z*.45,GY-z*.9]}
  else{c=[m[0]+2,m[1]+z*1.35];if(c[1]+z*.9>GY)c=[c[0]+z*.4,GY-z*.9]}
  const rim=[[c[0]-z*.92,c[1]-z*.62],[c[0]+z*.92,c[1]-z*.62]],ty=lie?c[1]-z*1.5:Math.min(m[1],c[1]-z*.9),tx=lie?c[0]-z*.15:m[0];
  h.line([rim[0],[c[0]-z*.5,ty-z*.25],[tx,ty-1],[c[0]+z*.5,ty-z*.25],rim[1]],2.4,INK,.4);
  const pail=[];for(let i=0;i<14;i++){const an=i/14*Math.PI*2,k=1+.05*Math.cos(an*5);pail.push([c[0]+Math.cos(an)*z*k,c[1]+Math.sin(an)*z*.9*k])}
  h.shape(pail,HW2_OR,{w:2.8,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4,famp:.3});
  h.line([[c[0]-z*.35,c[1]-z*.82],[c[0]-z*.42,c[1]+z*.82]],1.6,HW2_OD,.2);h.line([[c[0]+z*.35,c[1]-z*.82],[c[0]+z*.42,c[1]+z*.82]],1.6,HW2_OD,.2);
  h.shape(circ(c[0],c[1]-z*.66,z*.8,z*.2,10),HW_BK,{w:2,ox:0,oy:0,sc:1,closed:1,amp:.2,famp:.2});
  [-1,1].forEach(sd=>h.shape([[c[0]+sd*z*.42,c[1]-z*.3],[c[0]+sd*z*.18,c[1]+z*.02],[c[0]+sd*z*.62,c[1]+z*.04]],HW_BK,{noline:1,ox:0,oy:0,sc:1}));
  h.line([[c[0]-z*.55,c[1]+z*.3],[c[0]-z*.3,c[1]+z*.5],[c[0]-z*.1,c[1]+z*.32],[c[0]+z*.12,c[1]+z*.52],[c[0]+z*.32,c[1]+z*.32],[c[0]+z*.55,c[1]+z*.48]],2.2,HW_BK,.2);
  h.dot(c[0]-z*.2,c[1]-z*.78,2.2,1.6,'#FF5CA8');h.dot(c[0]+z*.25,c[1]-z*.8,2,1.6,'#FFE14D')};
BACK2['Little Bat Costume']=function(h,s,L,B){const w=hwWingSet(s,L);hwWing(h,B,w.far,w.fang,w.z*.66,q=>[q[0],Math.min(q[1],GY)],1,[HW2_PD,HW2_PU,HW2_PL])};
BODY2['Little Bat Costume']=function(h,s,L,B,p){// a soft purple suit, lighter tufts on the tummy, then a small felt wing over the back
  const b=s.body,w=hwWingSet(s,L),cl=q=>[q[0],Math.min(q[1],GY)];
  h.shape(p.map(B).map(cl),HW2_PU,{w:4.6});h.crayon(b.rx*.7,b.ry*.7,q=>B([q[0]+b.rx*.2,q[1]]),HW2_PU,6);
  [[-.4,.55],[0,.62],[.4,.5]].forEach(q=>{const c=B([b.rx*q[0],b.ry*q[1]]);h.line([[c[0]-4,c[1]-1],[c[0]-1.5,c[1]+2.5],[c[0]+1,c[1]-1],[c[0]+3.5,c[1]+2.5]].map(cl),2,HW2_PL,.3)});
  hwWing(h,B,w.root,w.ang,w.z*.7,cl,0,[HW2_PD,HW2_PU,HW2_PL])};
TOP2['Little Bat Costume']=function(h,s,L,HT){// the purple hood over the head (face open, the dog's own ears tucked inside), two big pointy bat ears, then the orange ruffle collar
  const hx=s.head.rx,hy=s.head.ry,f=L.face,er=s.eyes,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],cl=q=>[q[0],Math.min(q[1],GY+3)];
  const ear=(root,ang,far)=>{const z=Math.max(hx,hy)*.95,M=q=>{const r2=rot([q[0]*z,q[1]*z],ang);return HT([root[0]+r2[0],root[1]+r2[1]])};
   h.shape([[-.34,.1],[-.3,-.42],[-.1,-.98],[.08,-.5],[.3,-.3],[.36,.12]].map(M).map(cl),far?HW2_PD:HW2_PU,{w:3.4,step:7,ox:0,oy:0,sc:1,amp:.6});
   h.shape([[-.18,0],[-.15,-.38],[-.07,-.72],[.06,-.4],[.2,-.22],[.2,0]].map(M).map(cl),far?mix(HW2_PL,PEN,.25):HW2_PL,{noline:1,ox:0,oy:0,sc:1})};
  ear([-hx*.52,-hy*.72],-24,1);
  const ox=hx*.22,oy=hy*.14,ex=Math.min(hx*e0[0]-er[0],hx*e1[0]-er[1]),ey=Math.min(hy*e0[1]-er[0],hy*e1[1]-er[1]),rx=Math.max(hx*.78,ox-ex+4),ry=Math.max(hy*.78,oy-ey+3);
  const o=[],n=[];for(let an=-28;an>=-236;an-=13)o.push([Math.cos(an*D2R)*hx*1.15,Math.sin(an*D2R)*hy*1.18]);
  for(let an=-236;an<=-28;an+=13)n.push([ox+Math.cos(an*D2R)*rx,oy+Math.sin(an*D2R)*ry]);
  h.shape(o.concat(n).map(HT).map(cl),HW2_PU,{w:3.8,step:7,amp:.9});h.crayon(hx*.5,hy*.3,q=>HT([q[0]-hx*.45,q[1]-hy*.5]),HW2_PU,4);
  h.line(n.slice(1,-1).map(q=>[ox+(q[0]-ox)*1.08,oy+(q[1]-oy)*1.08]).map(HT).map(cl),2.6,HW2_PD,.6);
  ear([hx*.1,-hy*.9],14,0);
  // the ruffle: an orange frill round the neck, pleated, over whatever neck item is on
  const a=neckAnchor(s,HT),d=[a.r[0]-a.l[0],a.r[1]-a.l[1]],m=Math.hypot(d[0],d[1])||1,u=[d[0]/m,d[1]/m],v=[-u[1],u[0]],th=Math.max(8,Math.min(13,hy*.42));
  const top=[],bot=[];for(let i=0;i<=10;i++){const t=-.12+i/10*1.22,c=hw2Sag(a,t,6);top.push([c[0]-v[0]*th*.25,c[1]-v[1]*th*.25]);const k=th*(i%2?.7:1.15);bot.unshift([c[0]+v[0]*k,c[1]+v[1]*k])}
  h.shape(top.concat(bot).map(cl),HW2_OR,{w:3,step:6,amp:.6,ox:0,oy:0,sc:1});
  for(let i=1;i<10;i+=2){const q=top[i],r2=bot[10-i];h.line([q,[(q[0]+r2[0])/2,(q[1]+r2[1])/2]].map(cl),1.6,HW2_OD,.2)}
  h.line(top.slice(1,-1).map(cl),2,'#FFC27A',.3)};
/* ---------- fx ---------- */
function drawFx(h,s,L,B,HT){
  const hx=s.head.rx,hy=s.head.ry,b=s.body;
  if(L.hearts){const c=HT([0,0]),up=L.wiggle?[0,6,12][L.k]:0;h.heart(c[0]-hx*1.35,c[1]-hy*1.15+h.J(2)-up,7.5,'#FF4F7B');if(L.hearts>1)h.heart(c[0]+hx*1.05,c[1]-hy*1.55+h.J(2)-up*.6,5.5,'#FF8FB1');}
  if(L.wiggle){const t=B([-b.rx*1.05,-b.ry*.6]);[[0,0],[-6,10]].forEach(o=>h.line([[t[0]-10+o[0],t[1]-8+o[1]],[t[0]-15+o[0],t[1]-2+o[1]],[t[0]-10+o[0],t[1]+4+o[1]]],2.4,PEN))}
  if(L.speed){[[-1.25,-.3],[-1.35,.25],[-1.15,.75]].forEach((q,i)=>{const p=B([b.rx*q[0],b.ry*q[1]]);h.line([[p[0]-4,p[1]],[p[0]-22-i*4,p[1]+3]],2.6,PEN)})}
  if(L.zz){const c=HT([0,0]),dz=[0,4,8][L.k||0];h.text('z',c[0]-hx*1.5,c[1]-hy*1.45-dz,20,INK,-10);h.text('Z',c[0]-hx*1.1,c[1]-hy*2.15-dz,28,INK,-12);}
  if(L.spray){const c=T(L.bT)([0,0]);for(let i=0;i<14;i++){const a=h.r()*Math.PI*2,rr=Math.min(b.rx,52)*(1.15+h.r()*.5),x=Math.max(10,Math.min(230,c[0]+Math.cos(a)*(b.long?b.rx*.9+12:rr))),y=Math.min(GY-4,c[1]-8+Math.sin(a)*b.ry*2.2);h.shape([[x,y-4],[x+3,y+1],[x,y+4],[x-3,y+1]],'#8FD3FF',{w:1.8,ox:0,oy:0,sc:1,closed:1})}
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([sx,sy])=>{const x=Math.max(10,Math.min(230,c[0]+sx*(b.rx+16))),y=c[1]+sy*b.ry*.5-10;h.line([[x,y-8],[x+sx*6,y],[x,y+8]],2.6,PEN)});}
  if(L.snow){for(let i=0;i<7;i++){const x=30+h.r()*190,y=20+h.r()*110,r2=3+h.r()*2;h.line([[x-r2,y],[x+r2,y]],1.8,'#7FB3E0',.2);h.line([[x,y-r2],[x,y+r2]],1.8,'#7FB3E0',.2);h.line([[x-r2*.7,y-r2*.7],[x+r2*.7,y+r2*.7]],1.4,'#7FB3E0',.2)}
    [-1,1].forEach(sd=>{const c=T(L.bT)([sd*(b.rx+8),-b.ry*.2]);h.line([[c[0],c[1]-8],[c[0]+sd*3,c[1]-3],[c[0],c[1]+2],[c[0]+sd*3,c[1]+7]],2.2,'#7FB3E0')});}
  if(L.heat){[-.6,0,.6].forEach(xx=>{const c=B([b.rx*xx,-b.ry*1.2]);const p=[];for(let j=0;j<6;j++)p.push([c[0]+Math.sin(j*1.6)*4,c[1]-4-j*6]);h.line(p,2.6,'#FF9A3C',1)});const sw=HT([-hx*.9,-hy*.3]);h.shape([[sw[0],sw[1]],[sw[0]+3,sw[1]+6],[sw[0],sw[1]+9],[sw[0]-3,sw[1]+6]],'#9EDCFF',{w:2,ox:0,oy:0,sc:1,closed:1});}
  if(L.dirt){const t=B([-b.rx*.9,b.ry*.6]);for(let i=0;i<6;i++){const x=Math.max(8,t[0]-12-h.r()*44),y=GY-16-h.r()*46;h.shape(circ(x,y,3+h.r()*3,3+h.r()*2,6,.2),'#9A6A3E',{w:2,ox:0,oy:0,sc:1,closed:1})}
    h.line([[t[0]-6,t[1]-4],[Math.max(6,t[0]-26),t[1]-22]],2.2,PEN);h.line([[t[0]-4,t[1]+4],[Math.max(6,t[0]-30),t[1]-6]],2.2,PEN);
    const fp=L.legs.find(l=>l.id==='NF');if(fp&&fp.foot){h.shape([[fp.foot[0]-20,GY+1],[fp.foot[0]-8,GY-8],[fp.foot[0]+10,GY-9],[fp.foot[0]+24,GY+1]],'#9A6A3E',{w:2.6})}}
  if(L.sniffFx){const n=HT(noseLocal(s));[[8,-4],[14,-12],[20,-6]].forEach((o,j)=>{const up=[0,3,6][L.k||0];h.line([[n[0]+o[0],n[1]+o[1]-up],[n[0]+o[0]+3,n[1]+o[1]-5-up],[n[0]+o[0]+1,n[1]+o[1]-10-up]],2,PEN)});if(L.k===1)h.text('sniff',Math.min(n[0]+4,190),n[1]-24,13,INK,-6)}
  if(L.yawnFx){const c=HT([hx*.2,-hy*1.2]),up=[0,4,8][L.k||0];h.text('~',c[0]+hx*.6,c[1]-up,18,INK,-10);h.text('o',c[0]+hx*1.0,c[1]-12-up,12,INK,0)}
  if(L.howlFx){const n=HT(noseLocal(s));for(let j=0;j<3;j++){const r2=10+j*8+[0,3,1][L.k||0],a0=-1.9,a1=-.5,pts=[];for(let t=0;t<=6;t++){const a=a0+(a1-a0)*t/6;pts.push([n[0]+Math.cos(a)*r2+4,n[1]-6+Math.sin(a)*r2])}h.line(pts,2.4,PEN)}h.text('♪',Math.min(n[0]+30,200),n[1]-34,16,INK,-8)}
  if(s.shiver&&/^(idle|sit|cold|sad|beg|paw|walk|dirty)$/.test(L.pose)){const c=T(L.bT)([0,0]);[-1,1].forEach(sd=>{const x=c[0]+sd*(b.rx+9)+(L.k===1?sd*2:0);h.line([[x,c[1]-8],[x+sd*3,c[1]-3],[x,c[1]+2],[x+sd*3,c[1]+7]],2,PEN)})}
  if(L.woof){const c=HT([hx*1.2,-hy*.6]),up=[0,4,1][L.k||0];h.text('WOOF!',Math.min(c[0]+4,176),c[1]-6-up,20,INK,-12);[[0,0],[5,10],[2,-10]].forEach(o=>h.line([[c[0]-2+o[0],c[1]+8+o[1]],[c[0]+6+o[0],c[1]+5+o[1]]],2.2,PEN))}
  if(L.itch){const c=HT([-hx*.7,-hy*.7]);[[-8,-6],[-12,4]].forEach(o=>h.line([[c[0]+o[0],c[1]+o[1]],[c[0]+o[0]-6,c[1]+o[1]-4]],2.2,PEN));if(L.k===1)h.text('scritch',c[0]-46,c[1]-14,13,INK,-8)}
  if(L.danceFx){const c=T(L.bT)([0,0]);[-1,1].forEach(sd=>{const x=c[0]+sd*(b.rx*.6+18)+(L.k===1?sd*4:0),y=c[1]-10;h.line([[x,y-10],[x+sd*5,y],[x,y+10]],2.4,PEN)});h.text('♪',c[0]+30,c[1]-60-[0,6,3][L.k||0],18,INK,-8)}
  if(L.wagFx){const t=B([-b.rx*1.05,-b.ry*.9]);[[0,0],[-6,10]].forEach(o=>h.line([[t[0]-8+o[0],t[1]-10+o[1]],[t[0]-14+o[0],t[1]-4+o[1]],[t[0]-8+o[0],t[1]+2+o[1]]],2.4,PEN))}
  if(L.wig){const c=T(L.bT)([0,0]);[-1,1].forEach(sd=>h.line([[c[0]+sd*(b.rx+12),GY-6],[c[0]+sd*(b.rx+18),GY-14]],2.2,PEN))}
  if(L.dead){const c=HT([0,-hy*1.3]);h.shape(circ(c[0],c[1]-6,12,4,10),null,{w:2.4});}
  if(L.shy){const c=HT([0,0]);const sw=HT([-hx*.95,-hy*.55]);h.shape([[sw[0],sw[1]],[sw[0]+3,sw[1]+6],[sw[0],sw[1]+9],[sw[0]-3,sw[1]+6]],'#9EDCFF',{w:2,ox:0,oy:0,sc:1,closed:1});
    [[hx*.45,hy*.42],[-hx*.15,hy*.42]].forEach(p=>{const q=HT(p);h.acc.push(`<ellipse cx="${R1(q[0])}" cy="${R1(q[1])}" rx="6" ry="3.4" fill="#FF8FAE" opacity=".55"/>`)});
    [[0,-1.5],[.5,-1.75]].forEach((o,i)=>{const p=HT([hx*o[0],hy*o[1]]);h.line([[p[0]-3,p[1]-[0,3,1][L.k||0]],[p[0]+3,p[1]-4-[0,3,1][L.k||0]]],2.2,PEN)})}
  if(L.notes){const c=HT([hx*.9,-hy*.4]),up=[0,6,12][L.k||0];h.text('♪',c[0]+8,c[1]-4-up,20,INK,-10);if(L.k!==1)h.text('♫',c[0]+24,c[1]-20-up*.5,16,INK,8)}
  if(L.hope){const c=HT([0,0]);h.heart(c[0]+hx*1.2,c[1]-hy*1.3+h.J(2)-[0,3,6][L.k||0],5,'#FF8FB1')}
  if(L.duck){[-.35,.15].forEach((q,i)=>{const p=B([-b.rx*1.1,b.ry*q]);h.line([[p[0]-2,p[1]],[Math.max(6,p[0]-20-i*5),p[1]+1]],2.4,PEN)})}
  if(L.stink){[-.55,0,.5].forEach((xx,i)=>{const c=B([b.rx*xx,-b.ry*1.1]);const p=[];for(let j=0;j<5;j++)p.push([c[0]+(j%2?5:-5),c[1]-6-j*7]);h.line(p,3.4,'#4CBF3A',1.2)});}
}
function drawMud(h,s,L,B,HT){
  const b=s.body,hx=s.head.rx,hy=s.head.ry,M='#7A4A22';
  [[-.45,.15,.22,.38],[.35,-.35,.16,.3],[.1,.55,.2,.3]].forEach(q=>h.shape(circ(q[0]*b.rx,q[1]*b.ry,q[2]*b.rx,q[3]*b.ry,8,.15).map(B),M,{noline:1,ox:0,oy:0}));
  L.legs.filter(l=>l.near&&l.foot).forEach(l=>h.dot(l.foot[0],l.foot[1]-5,6,4,M));
}

/* ---------- v2 extras: newborn layout, expecting belly, sparkle ---------- */
/* ---------- v2.17.1 Halloween Market costumes (art/halloween-market): body slot items with their own head piece (TOP2), and the Lion Mane (neck slot) ----------
   Every fill has its own ink line (or sits inside one); every colour stays inside its outline. Nothing covers the eyes or the nose: hoods leave the face
   open (the opening is sized from the eyes, like the Little Bat Costume), hats sit on the crown, bands sit above the eyes.
   RUFF2[neck item]: drawn where the dog's own ruff goes (behind the head), so a mane can frame the face. NECK2 draws the part under the chin. */
const RUFF2={},HM_PU='#7B4FC9',HM_PUD='#55339A',HM_YE='#FFD84A',HM_NV='#34407E',HM_NVD='#232C5E',HM_GR='#6DBE5A',HM_GRD='#3F8A3A',HM_GRL='#B6E59A',
  HM_BK='#2E2832',HM_BKL='#4A4252',HM_CR='#F5EFE2',HM_CRD='#B3A58C',HM_DN='#6F8FCB',HM_DND='#4A69A6',HM_ST='#E8C46A',HM_STD='#B8913A',HM_RD='#E0483E',HM_BR='#9A6A44',HM_BRD='#6E4A2E',HM_BRL='#D6AE7E';
const hmCl=q=>[q[0],Math.min(q[1],GY-1)];
// the hood over the back of the head: the outer arc round the skull, the open face (sized from the eyes, so the eyes and nose always show)
function hmHood(s,L){const hx=s.head.rx,hy=s.head.ry,f=L.face,er=s.eyes,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1];
  const ox=hx*.22,oy=hy*.14,ex=Math.min(hx*e0[0]-er[0],hx*e1[0]-er[1]),ey=Math.min(hy*e0[1]-er[0],hy*e1[1]-er[1]),rx=Math.max(hx*.78,ox-ex+4),ry=Math.max(hy*.78,oy-ey+3);
  const o=[],n=[];for(let an=-28;an>=-236;an-=13)o.push([Math.cos(an*D2R)*hx*1.15,Math.sin(an*D2R)*hy*1.18]);
  for(let an=-236;an<=-28;an+=13)n.push([ox+Math.cos(an*D2R)*rx,oy+Math.sin(an*D2R)*ry]);return{o,n,ox,oy}}
// a cape billowing up and back behind the body (the Superhero Cape's sweep), fill col, a darker lining strip, and n little stars
function hmCape(h,s,L,B,col,dark,stars,starCol){const b=s.body,fl=L.pose==='jump'?1.2:1,cw=Math.min(b.rx,s.fluff?38:44),nx=b.rx*.5,sl=/^(sleep|down|crouch|playdead|rollover)$/.test(L.pose),up=(sl?.5:1)*(s.fluff?.85:1);
  const p=[[nx,-b.ry*.9],[nx-.5*cw,-b.ry*(1.18+.42*up)],[nx-1.15*cw*fl,-b.ry*(1.22+.8*up)],[nx-1.75*cw*fl,-b.ry*(.95+.7*up)],[nx-1.95*cw*fl,-b.ry*.2],[nx-1.8*cw*fl,b.ry*.5],[nx-1.3*cw,b.ry*.36],[nx-.55*cw,-b.ry*.2]].map(B).map(q=>[q[0],Math.min(q[1],GY)]);
  h.shape(p,col,{w:4.2,step:9});
  h.line([p[2],p[3],p[4]].map(q=>[q[0]+(p[0][0]-q[0])*.12,q[1]+(p[0][1]-q[1])*.12]),2.4,dark,.4);
  const c=p.reduce((a,q)=>[a[0]+q[0]/p.length,a[1]+q[1]/p.length],[0,0]);
  stars.forEach(([t,z])=>{const q=p[Math.min(p.length-1,Math.floor(t))],k=t%1;star5(h,[c[0]+(q[0]-c[0])*(.35+k*.3),c[1]+(q[1]-c[1])*(.35+k*.3)],z,starCol,1.7)})}
// a bow (two loops and a knot) at c, z = loop size, an = tilt (deg)
function hmBow(h,c,z,an,col,dk){[-1,1].forEach(sd=>{const lp=[[0,0],[sd*z*.5,-z*.62],[sd*z*1.2,-z*.6],[sd*z*1.15,z*.55],[sd*z*.5,z*.45]].map(q=>{const r2=rot(q,an);return hmCl([c[0]+r2[0],c[1]+r2[1]])});
  h.shape(lp,col,{w:2.4,step:30,ox:0,oy:0,sc:1,closed:1,amp:.35,famp:.3});h.line([lp[0],lp[2]].map(q=>[q[0]*.7+lp[0][0]*.3,q[1]*.7+lp[0][1]*.3]),1.3,dk,.2)});
  h.shape(circ(c[0],c[1],z*.38,z*.42,7).map(hmCl),dk,{w:2,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.2})}
// the body suit: the coat outline p (body px) in col, a few crayon streaks
function hmSuit(h,s,B,p,col){const b=s.body;h.shape(p.map(B).map(hmCl),col,{w:4.6});h.crayon(b.rx*.7,b.ry*.7,q=>B([q[0]+b.rx*.25,q[1]]),col,6)}
// a point inside the suit (x, y in -1..1 of the body ellipse, kept to 80%)
const hmIn=(s,x,y,lim=.8)=>{const b=s.body,m=Math.hypot(x,y),k=m>lim?lim/m:1;return[b.rx*x*k,b.ry*y*k]};

/* 1. Little Witch Hat & Cape: a short purple cape with yellow stars behind the body, a bow at the chest, a small crooked purple hat with a green band */
BACK2['Little Witch Hat & Cape']=function(h,s,L,B){hmCape(h,s,L,B,HM_PU,HM_PUD,[[2.4,4.6],[4.3,3.8],[5.6,3.4]],HM_YE)};
BODY2['Little Witch Hat & Cape']=function(h,s,L,B){const b=s.body,c=hmCl(B([b.rx*.56,-b.ry*.7]));hmBow(h,c,Math.max(5,b.ry*.26),-10,HM_GR,HM_GRD)};
TOP2['Little Witch Hat & Cape']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.02,-6),W2=hx*.4,H=hy*1.12;
  h.shape([[-W2,0],[-W2*.45,-H*.5],[-W2*.12,-H*.86],[W2*.35,-H*1.02],[W2*.62,-H*.86],[W2*.2,-H*.72],[W2*.3,-H*.4],[W2,0]].map(P),HM_PU,{w:3.6,step:8});
  h.part(true);h.crayon(W2*.6,H*.3,q=>P([q[0],q[1]-H*.4]),HM_PU,4);h.part(false);
  h.line([[-W2*.88,-4],[W2*.88,-4]].map(P),4.4,HM_GR,.4);
  h.shape(circ(0,1,W2*1.7,5,14).map(P),HM_PUD,{w:3.4,step:8});
  star5(h,P([-W2*.1,-H*.36]),Math.max(3.4,hx*.16),HM_YE,1.6)};

/* 2. Scarecrow Overalls (in place of a second vampire cape): patched denim dungarees with straw peeking out, a floppy straw hat */
BODY2['Scarecrow Overalls']=function(h,s,L,B,p){const b=s.body;hmSuit(h,s,B,p,HM_DN);
  const pc=hmIn(s,-.3,.05),q=[[-7,-6],[7,-6],[7,6],[-7,6]].map(d=>B([pc[0]+d[0],pc[1]+d[1]]));h.shape(q,'#F29150',{w:2.4,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2});
  [[-5,-6],[0,-6],[5,-6]].forEach(d=>{const a=B([pc[0]+d[0],pc[1]+d[1]+1]);h.line([[a[0],a[1]],[a[0],a[1]+3]],1.2,INK,.1)});
  const st=hmIn(s,.35,-.55),sd=hmIn(s,.62,.35);h.line([B(st),B(sd)],2.6,HM_DND,.3);h.dot(...B(sd),2.6,2.6,HM_YE);
  [-.6,-.2,.2].forEach((x,i)=>{const a=hmIn(s,x,.72);h.line([B(a),B([a[0]+(i%2?2:-2),a[1]+b.ry*.12])].map(hmCl),2,HM_STD,.3)});
  h.line(p.slice(-7).map(B).map(hmCl),3,HM_DND,.4)};
TOP2['Scarecrow Overalls']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.04,-5),W2=hx*.5,H=hy*.62;
  h.shape(circ(0,0,W2*2,H*.34,16).map(P),HM_ST,{w:3.4,step:8});
  h.shape([[-W2,-1],[-W2*.86,-H*.8],[-W2*.2,-H*1.04],[W2*.62,-H*.9],[W2,-1]].map(P),HM_ST,{w:3.6,step:8});
  h.line([[-W2*.96,-H*.18],[W2*.97,-H*.2]].map(P),4,HM_RD,.4);
  [[-.5,-.5,-.4,-.85],[.1,-.6,.2,-.95],[.55,-.45,.6,-.8]].forEach(q=>h.line([[W2*q[0],H*q[1]],[W2*q[2],H*q[3]]].map(P),1.4,HM_STD,.3));
  [[-1.9,.1,-2.25,.5],[-1.7,.2,-1.85,.7],[1.85,.1,2.2,.45]].forEach(q=>h.line([[W2*q[0],H*q[1]],[W2*q[2],H*q[3]]].map(P),2,HM_STD,.3))};

/* 3. Mummy Wraps: soft cream bandages wound round the body, one loose end, a wrapped band over the crown (above the eyes) */
BODY2['Mummy Wraps']=function(h,s,L,B,p){const b=s.body;hmSuit(h,s,B,p,HM_CR);
  [-.78,-.48,-.18,.12,.42,.72].forEach((x,i)=>{const a=hmIn(s,x-.12,-.78),c=hmIn(s,x+.12,.78);h.line([B(a),B([(a[0]+c[0])/2+(i%2?2:-2),(a[1]+c[1])/2]),B(c)].map(hmCl),2.2,HM_CRD,.5)});
  [-.6,0,.55].forEach(x=>{const a=hmIn(s,x,-.2),c=hmIn(s,x+.18,.15);h.line([B(a),B(c)],1.6,HM_CRD,.3)});
  const r=B([-b.rx*.9,b.ry*.1]),dn=/^(rollover)$/.test(L.pose)?-1:1,tl=[[0,-3],[-8,4*dn],[-14,14*dn],[-9,15*dn],[-4,6*dn],[3,3]].map(q=>hmCl([r[0]+q[0],r[1]+q[1]]));
  h.shape(tl,HM_CR,{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4,famp:.3});h.line([tl[1],tl[3]].map(q=>[q[0]*.8+tl[2][0]*.2,q[1]*.8+tl[2][1]*.2]),1.3,HM_CRD,.2)};
TOP2['Mummy Wraps']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,er=Math.max(...s.eyes),f=L.face,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],top=Math.min(hy*e0[1],hy*e1[1])-er-3;
  const inn=Math.max(.5,Math.min(.82,-top/hy)),o=[],n=[];for(let a=-195;a<=-15;a+=10)o.push([Math.cos(a*D2R)*hx*1.06,Math.sin(a*D2R)*hy*1.08]);
  for(let a=-15;a>=-195;a-=10)n.push([Math.cos(a*D2R)*hx*.9,Math.min(Math.sin(a*D2R)*hy*inn,top)]);
  const pts=o.concat(n).map(HT).map(hmCl);h.shape(pts,HM_CR,{w:3.2,step:7,amp:.7});
  for(let i=0;i<5;i++){const t=.12+i*.19,a=(-195+t*180)*D2R;h.line([[Math.cos(a)*hx*1.02,Math.sin(a)*hy*1.02],[Math.cos(a+.22)*hx*.92,Math.min(Math.sin(a+.22)*hy*inn,top)+1.5]].map(HT),1.6,HM_CRD,.3)}};

/* 4. Skeleton Suit: a soft black suit with white crayon bones (spine, ribs, hip), friendly rather than spooky */
BODY2['Skeleton Suit']=function(h,s,L,B,p){const b=s.body;hmSuit(h,s,B,p,HM_BK);
  const sp=[];for(let x=-.72;x<=.62;x+=.12)sp.push(hmIn(s,x,-.58+Math.abs(x)*.06));h.line(sp.map(B),3.2,W,.4);
  [.38,.2,.02,-.16].forEach((x,i)=>{const a=hmIn(s,x,-.56),m=hmIn(s,x+.08,-.05),c=hmIn(s,x+.02,.55-i*.04);h.line([a,m,c].map(B),2.8,W,.4)});
  const hp=hmIn(s,-.55,.05);h.shape(circ(hp[0],hp[1],b.rx*.13,b.ry*.22,9).map(B),HM_CR,{w:2.4,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2});
  [-.62,-.48].forEach(x=>{const a=hmIn(s,x,.3);h.line([B(a),B([a[0],a[1]+b.ry*.25])],2.4,W,.3)})};
TOP2['Skeleton Suit']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.06,-10),z=Math.max(4,hx*.2);// a little bone clip on the crown
  const bn=[[-z*1.6,-z*.3],[-z*1.15,-z*.55],[z*1.15,-z*.55],[z*1.6,-z*.3],[z*1.75,z*.15],[z*1.2,z*.4],[-z*1.2,z*.4],[-z*1.75,z*.15]];
  h.shape(bn.map(P),HM_CR,{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2});[-1,1].forEach(sd=>h.shape(circ(sd*z*1.6,-z*.55,z*.42,z*.42,8).map(P),HM_CR,{w:2.2,step:30,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.2}))};

/* 5. Black Cat Ears & Bow: two black felt cat ears with pink insides on a band, a big orange bow at the root of the tail */
BODY2['Black Cat Ears & Bow']=function(h,s,L,B){const b=s.body,c=hmCl(B([-b.rx*.84,-b.ry*.42]));hmBow(h,c,Math.max(5.5,b.ry*.3),20,'#F29150','#C25E12');
  const col=[[b.rx*.62,-b.ry*.62],[b.rx*.76,-b.ry*.12],[b.rx*.72,b.ry*.38]].map(B).map(hmCl);h.line(col,4.6,INK,.4);h.line(col,2.8,HM_BKL,.3)};
TOP2['Black Cat Ears & Bow']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,.08,-4),z=Math.max(hx,hy)*.5;
  h.line([[-hx*.72,6],[-hx*.3,-1],[hx*.3,-1],[hx*.72,6]].map(P),4.6,INK,.4);h.line([[-hx*.72,6],[-hx*.3,-1],[hx*.3,-1],[hx*.72,6]].map(P),2.6,HM_BKL,.3);
  [[-hx*.42,-12],[hx*.36,12]].forEach(([x,an])=>{const M=q=>{const r2=rot(q,an);return P([x+r2[0],r2[1]-1])};
   h.shape([[-z*.55,0],[-z*.25,-z*.7],[0,-z*1.05],[z*.2,-z*.65],[z*.55,0]].map(M),HM_BK,{w:3.2,step:7,ox:0,oy:0,sc:1,closed:1,amp:.5});
   h.shape([[-z*.28,-z*.08],[-z*.1,-z*.52],[z*.02,-z*.72],[z*.12,-z*.46],[z*.3,-z*.08]].map(M),'#F7A1B5',{noline:1,ox:0,oy:0,sc:1})})};

/* 6. Pirate Hat & Sash: a red sash with a knot at the hip, a black tricorn with gold trim and a white crayon paw (no eyepatch) */
BODY2['Pirate Hat & Sash']=function(h,s,L,B){const b=s.body,a0=hmIn(s,.42,-.95),a1=hmIn(s,.62,-.88),c1=hmIn(s,-.12,.95),c0=hmIn(s,-.34,.9);
  const band=[a0,a1,c1,c0].map(B).map(hmCl);h.shape(band,HM_RD,{w:3,step:8});h.line([B(a0),B(c0)].map(q=>q),1.4,'#FFC6A8',.2);
  const k=hmCl(B(hmIn(s,-.2,.78)));h.shape(circ(k[0],k[1],4.6,4,8).map(hmCl),HM_RD,{w:2.2,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2});
  [[-3,1],[2,1.2]].forEach(([dx,k2])=>h.shape([[k[0]-2+dx*.3,k[1]+2],[k[0]+dx,k[1]+12*k2],[k[0]+dx+4,k[1]+11*k2],[k[0]+2+dx*.3,k[1]+2]].map(hmCl),HM_RD,{w:2.2,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2}))};
TOP2['Pirate Hat & Sash']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.04,-4),W2=hx*.62,H=hy*.66;
  h.shape([[-W2*1.45,0],[-W2*1.1,-H*.62],[-W2*.5,-H*.9],[0,-H*1.05],[W2*.5,-H*.9],[W2*1.1,-H*.62],[W2*1.45,0],[W2*.7,-H*.16],[0,-H*.24],[-W2*.7,-H*.16]].map(P),HM_BK,{w:3.6,step:8});
  h.line([[-W2*1.38,-2],[-W2*.7,-H*.2],[0,-H*.28],[W2*.7,-H*.2],[W2*1.38,-2]].map(P),2,HM_YE,.3);
  const c=P([0,-H*.6]),z=Math.max(2.2,hx*.09);[[0,.6,1.1],[-1.3,-.6,.5],[-.45,-1.3,.5],[.45,-1.3,.5],[1.3,-.6,.5]].forEach(([dx,dy,k])=>h.dot(c[0]+dx*z,c[1]+dy*z,z*k,z*k*.9,W))};

/* 7. Dinosaur Hood: a green suit with soft spikes down the back, a green hood (face open) with spikes and a rim of felt teeth */
BODY2['Dinosaur Hood']=function(h,s,L,B,p){const b=s.body;hmSuit(h,s,B,p,HM_GR);
  h.shape([[b.rx*.15,b.ry*.35],[b.rx*.7,b.ry*.25],[b.rx*.6,b.ry*.75],[b.rx*.05,b.ry*.78]].map(B).map(hmCl),HM_GRL,{noline:1,ox:0,oy:0});
  [-.7,-.42,-.14,.14,.42].forEach((x,i)=>{const z=b.ry*(i%2?.3:.36),c=[b.rx*x,-b.ry*(s.fluff?1.08:1.02)*Math.sqrt(Math.max(0,1-x*x*.8))+2];
   h.shape([[c[0]-z*.6,c[1]+2],[c[0]-z*.05,c[1]-z],[c[0]+z*.6,c[1]+2]].map(B).map(hmCl),'#FFB04A',{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4,famp:.3})})};
TOP2['Dinosaur Hood']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,{o,n,ox,oy}=hmHood(s,L),z=Math.max(hx,hy)*.32;
  [-150,-115,-80].forEach((an,i)=>{const t=an*D2R,c=[Math.cos(t)*hx*1.1,Math.sin(t)*hy*1.12],u=[Math.cos(t),Math.sin(t)],v=[-u[1],u[0]],k=i===1?1.15:.9;
   h.shape([[c[0]-v[0]*z*.55,c[1]-v[1]*z*.55],[c[0]+u[0]*z*k,c[1]+u[1]*z*k],[c[0]+v[0]*z*.55,c[1]+v[1]*z*.55]].map(HT).map(hmCl),'#FFB04A',{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4,famp:.3})});
  h.shape(o.concat(n).map(HT).map(hmCl),HM_GR,{w:3.8,step:7,amp:.9});h.crayon(hx*.5,hy*.3,q=>HT([q[0]-hx*.45,q[1]-hy*.5]),HM_GR,4);
  for(let i=2;i<n.length-2;i+=2){const q=n[i],d=[(q[0]-ox),(q[1]-oy)],m=Math.hypot(d[0],d[1])||1,u=[d[0]/m,d[1]/m],v=[-u[1],u[0]],tz=Math.max(2.4,hx*.1);
   h.shape([[q[0]+u[0]*1.5-v[0]*tz*.6,q[1]+u[1]*1.5-v[1]*tz*.6],[q[0]-u[0]*tz*.9,q[1]-u[1]*tz*.9],[q[0]+u[0]*1.5+v[0]*tz*.6,q[1]+u[1]*1.5+v[1]*tz*.6]].map(HT).map(hmCl),W,{w:1.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.2,famp:.15})}
  [[-.62,-.35],[-.3,-.7]].forEach(q=>{const c=HT([hx*q[0],hy*q[1]]);h.dot(c[0],c[1],2.2,2,HM_GRD)})};

// a back costume's near wing; on a dog with a mane (chow, pom, spitz, malamute) frame() lays the same strokes again after the mane, so the mane never hides it
const WING_OVER={'Little Owl Wings':1,'Snowflake Wings':1};
function wmNearWing(h,s,draw){const a=h.acc.length;draw();if(s.ruff)h._wing=h.acc.slice(a)}
function wingOver(h){if(h._wing){h._wing.forEach(x=>h.acc.push(x));h._wing=null}}
/* 8. Little Owl Wings (in place of bumblebee wings: the Bumblebee Suit has them): soft brown feathered wings, a feather-tuft headband */
function hmOwlWing(h,B,root,ang,z,far){const pts=[[0,0],[-.18,-.32],[-.5,-.58],[-.92,-.66],[-1.02,-.48],[-.86,-.36],[-.98,-.2],[-.8,-.1],[-.88,.06],[-.6,.06],[-.3,.12]].map(q=>{const r2=rot([q[0]*z,q[1]*z],ang);return B([root[0]+r2[0],root[1]+r2[1]])}).map(q=>[q[0],Math.min(q[1],GY)]);
  h.shape(pts,far?HM_BRD:HM_BR,{w:3,step:30,ox:0,oy:0,sc:1,closed:1,amp:.5,famp:.4});
  [[2,7],[3,6],[4,8]].forEach(([a,c])=>h.line([pts[a].map((v,i)=>v*.7+pts[0][i]*.3),pts[c].map((v,i)=>v*.75+pts[0][i]*.25)],1.6,far?HM_BR:HM_BRL,.2));
  [[.3,-.12],[.48,-.2]].forEach(q=>{const c=pts[0].map((v,i)=>v+(pts[3][i]-v)*q[0]);h.dot(c[0],c[1]+q[1]*z*.3,1.6,1.4,far?HM_BR:HM_BRL)})}
BACK2['Little Owl Wings']=function(h,s,L,B){const b=s.body,lie=/^(sleep|down|crouch|playdead)$/.test(L.pose),z=Math.max(30,Math.min(48,b.ry*1.8))*(lie?.8:1);
  hmOwlWing(h,B,[b.rx*.3,-b.ry*(s.fluff?(s.wet?.84:.9):.8)],lie?-6:12,z*.92,1)};
BODY2['Little Owl Wings']=function(h,s,L,B){wmNearWing(h,s,()=>{const b=s.body,lie=/^(sleep|down|crouch|playdead)$/.test(L.pose),z=Math.max(30,Math.min(48,b.ry*1.8))*(lie?.8:1);
  hmOwlWing(h,B,[b.rx*.12,-b.ry*(s.fluff?.72:.6)],lie?-14:-4,z,0)})};
TOP2['Little Owl Wings']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,.06,-4),z=Math.max(hx,hy)*.36,band=[[-hx*.72,6],[-hx*.3,-1],[hx*.3,-1],[hx*.72,6]].map(P);
  h.line(band,4.6,INK,.4);h.line(band,2.6,HM_BRL,.3);
  [[-hx*.45,-18],[hx*.4,18]].forEach(([x,an])=>{const M=q=>{const r2=rot(q,an);return P([x+r2[0],r2[1]-1])};
   h.shape([[-z*.4,0],[-z*.35,-z*.6],[-z*.1,-z*1.1],[z*.08,-z*.7],[z*.3,-z*.95],[z*.42,-z*.4],[z*.4,0]].map(M),HM_BR,{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4,famp:.3});
   h.line([[0,-z*.05],[-z*.05,-z*.6]].map(M),1.4,HM_BRL,.2)})};

/* 9. Wizard Robe & Star Hat: a navy robe with yellow stars and a moon, gold hem; a tall navy cone hat with a star on the tip */
BODY2['Wizard Robe & Star Hat']=function(h,s,L,B,p){const b=s.body;hmSuit(h,s,B,p,HM_NV);
  h.line(p.slice(-7).map(B).map(hmCl),3.4,HM_YE,.4);h.line(p.slice(0,5).map(B).map(hmCl),3.4,HM_YE,.4);
  [[-.5,-.25,4.2],[.1,-.45,3.6],[.45,.2,3.4],[-.1,.35,3]].forEach(([x,y,z])=>star5(h,B(hmIn(s,x,y)),Math.max(2.6,z*b.ry/30),HM_YE,1.5));
  const m=B(hmIn(s,-.3,.45)),r=Math.max(4,b.ry*.2),cr2=[];for(let a=-120;a<=120;a+=20)cr2.push([m[0]+Math.cos(a*D2R)*r,m[1]+Math.sin(a*D2R)*r]);for(let a=100;a>=-100;a-=20)cr2.push([m[0]+r*.35+Math.cos(a*D2R)*r*.75,m[1]+Math.sin(a*D2R)*r*.8]);
  h.shape(cr2.map(hmCl),'#FFF3B0',{w:1.8,step:30,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.2})};
TOP2['Wizard Robe & Star Hat']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.02,8),W2=hx*.44,H=hy*1.55;
  h.shape([[-W2,0],[-W2*.4,-H*.55],[0,-H],[W2*.4,-H*.55],[W2,0]].map(P),HM_NV,{w:3.6,step:8});
  h.part(true);h.crayon(W2*.6,H*.3,q=>P([q[0],q[1]-H*.35]),HM_NV,4);h.part(false);
  h.shape(circ(0,1,W2*1.6,4.6,14).map(P),HM_NVD,{w:3.4,step:8});
  [[-.3,-.25,3],[.25,-.42,2.6]].forEach(q=>star5(h,P([W2*q[0],H*q[1]]),Math.max(2.4,q[2]*hx/28),HM_YE,1.4));
  star5(h,P([0,-H-2]),Math.max(4.2,hx*.2),HM_YE,1.8)};

/* 10. Lion Mane (neck slot): a big golden mane round the face (behind the head, so the face shows), a tuft under the chin */
RUFF2['Lion Mane']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,cx=-hx*.1,cy=hy*.12,rx=hx*1.42,ry=hy*1.4;
  h.shape(scallop(cx,cy,rx,ry,13,.18).map(HT).map(hmCl),'#E8A33A',{step:30,amp:.8,w:3.6});
  h.shape(scallop(cx,cy,rx*.82,ry*.82,11,.14).map(HT).map(hmCl),'#F6C25E',{noline:1,ox:0,oy:0,sc:1});
  [200,232,262,128,150,96,70,40].forEach(a=>{const t=a*D2R,x=cx+Math.cos(t)*rx*.9,y=cy+Math.sin(t)*ry*.9,u=[Math.cos(t),Math.sin(t)];
   h.line([[x-u[1]*3-u[0]*5,y+u[0]*3-u[1]*5],[x,y],[x+u[1]*3-u[0]*5,y-u[0]*3-u[1]*5]].map(HT).map(hmCl),2,'#B8751E',.3)})};
NECK2['Lion Mane']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,c=[-hx*.05,hy*.98],z=Math.max(5,hx*.24);
  const pts=[[c[0]-z,c[1]-z*.3],[c[0]-z*.7,c[1]+z*.5],[c[0]-z*.3,c[1]+z*.2],[c[0],c[1]+z*.75],[c[0]+z*.35,c[1]+z*.2],[c[0]+z*.75,c[1]+z*.5],[c[0]+z,c[1]-z*.3]];
  h.shape(pts.map(HT).map(hmCl),'#E8A33A',{w:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4,famp:.3})};
/* ---------- Winter Market 2026 costumes (art/winter-market part 2, docs/design/winter-market.md): sold at the Winter Market every December ----------
   The Halloween Market pattern: body slot costumes with their own head piece in TOP2 (the hat comes off while one is worn), the Jingle Bell Collar in the
   neck slot (NECK2). Each one hands the dog back its random stream (HM_OWN below), so the dog under it is the plain dog line for line. Nothing covers the
   eyes or the nose (the hoods use hmHood's open face; the snowman's carrot sits on its hat); every fill has its own ink line or sits inside one.
   Body only, so a hat can go on top: the Gingerbread Pup Suit, the Puffer Jacket and the Snowflake Wings. */
const WM_RD='#E2403A',WM_RDD='#A82A2A',WM_SN='#FFFDF8',WM_SND='#C9D2DE',WM_GR='#4FA548',WM_GRD='#2F7A35',WM_GRL='#A8DC8E',WM_GD='#F2C14E',WM_GDD='#B8862A',
  WM_GB='#B8733C',WM_GBD='#86502A',WM_BK='#2E2832',WM_BKL='#5A5262',WM_PU='#3DB5C6',WM_PUD='#1F8494',WM_PUL='#A6E3EA',WM_IC='#CFE8F7',WM_ICD='#7FB3E0',WM_OR='#F28A2E',WM_NC='#D23A48',WM_NV='#2F3F86';
// a fluffy band (Father Christmas trim) along the canvas polyline Q, w wide: lumpy edges, rounded ends, its own ink line
function wmFluff(h,Q,w,col){const D=dense(Q,false,Math.max(3,w*.55)),n=D.length,lf=[],rt=[];if(n<2)return;
  for(let i=0;i<n;i++){const a=D[Math.max(0,i-1)],c=D[Math.min(n-1,i+1)],dx=c[0]-a[0],dy=c[1]-a[1],m=Math.hypot(dx,dy)||1,v=[-dy/m,dx/m],k=w*.5*(i%2?1.2:.92),k2=w*.5*(i%2?.92:1.16);
   lf.push([D[i][0]+v[0]*k,D[i][1]+v[1]*k]);rt.unshift([D[i][0]-v[0]*k2,D[i][1]-v[1]*k2])}
  const u=(i,j)=>{const dx=D[j][0]-D[i][0],dy=D[j][1]-D[i][1],m=Math.hypot(dx,dy)||1;return[dx/m,dy/m]},u0=u(1,0),u1=u(n-2,n-1);
  h.shape([[D[0][0]+u0[0]*w*.55,D[0][1]+u0[1]*w*.55]].concat(lf,[[D[n-1][0]+u1[0]*w*.55,D[n-1][1]+u1[1]*w*.55]],rt).map(hmCl),col||WM_SN,{w:2.8,step:30,ox:0,oy:0,sc:1,closed:1,amp:.5,famp:.3})}
// a belt round the middle of the suit just drawn (kept inside its line), with a square buckle
function wmBelt(h,s,B,x,col,buck){const b=s.body,f=s.fluff?1.12:1.08,bw=b.rx*.065,yy=xx=>b.ry*(f+.06)*Math.sqrt(Math.max(0,1-Math.pow(xx/(b.rx*f),2)));
  h.part(true);h.shape([[x-bw,-yy(x-bw)],[x+bw,-yy(x+bw)],[x+bw,yy(x+bw)],[x-bw,yy(x-bw)]].map(B).map(hmCl),col,{noline:1,ox:0,oy:0,step:7,famp:.6});h.part(false);
  const k=hmCl(B([x,b.ry*.2])),z=Math.max(3.6,Math.min(6,b.ry*.22));h.shape([[k[0]-z,k[1]-z*1.1],[k[0]+z,k[1]-z*1.1],[k[0]+z,k[1]+z*1.1],[k[0]-z,k[1]+z*1.1]].map(hmCl),buck,{w:2.2,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2});
  h.line([[k[0]-z*.35,k[1]-z*.5],[k[0]-z*.35,k[1]+z*.5]].map(hmCl),1.3,INK,.1)}
// a little gold bell at c (canvas px), radius z: round, a slot, a clapper
function wmBell(h,c,z,far){h.shape(circ(c[0],c[1],z,z*.94,9).map(hmCl),far?mix(WM_GD,PEN,.25):WM_GD,{w:2,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.2});
  h.line([[c[0]-z*.62,c[1]+z*.2],[c[0]+z*.62,c[1]+z*.2]],1.2,INK,.1);h.dot(c[0],c[1]+z*.56,z*.26,z*.26,INK);h.line([[c[0]-z*.4,c[1]-z*.45],[c[0]-z*.1,c[1]-z*.65]],1.1,'#FFF3B0',.1)}
// a wavy icing line along the body-local polyline Q (the Gingerbread Pup Suit)
function wmIcing(h,B,Q,k){const D=dense(Q,false,4),o=[];D.forEach((q,i)=>{const a=D[Math.max(0,i-1)],c=D[Math.min(D.length-1,i+1)],dx=c[0]-a[0],dy=c[1]-a[1],m=Math.hypot(dx,dy)||1,sg=i%2?k:-k;o.push([q[0]-dy/m*sg,q[1]+dx/m*sg])});h.line(o.map(B).map(hmCl),2.4,W,.3)}
// a paper snowflake (6 arms, cut with blunt scissors) at c, radius z, a white crayon snowflake drawn on it
function wmPaperFlake(h,c,z,an,col,far){const R=[1,.8,.64,.8],p=[];for(let i=0;i<24;i++){const a=(an+i*15)*D2R,r=z*R[i%4]*(1+.05*Math.sin(i*2.1));p.push(hmCl([c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r]))}
  h.shape(p,far?mix(col,WM_ICD,.45):col,{w:far?2.4:2.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4,famp:.3});
  if(!far){wnFlake(h,hmCl(c),z*.56,W,1.8,0);h.dot(c[0],Math.min(c[1],GY-2),Math.max(1.6,z*.1),Math.max(1.6,z*.1),WM_ICD)}}

/* 1. Father Christmas Suit: a red coat, a black belt with a gold buckle, fluffy white trim at the hem; a floppy red hat with a white brim and a pompom */
BODY2['Father Christmas Suit']=function(h,s,L,B,p){const b=s.body;hmSuit(h,s,B,p,WM_RD);wmBelt(h,s,B,b.rx*.1,WM_BK,WM_GD);
  const a=p[p.length-1],c=p[0];wmFluff(h,[[a[0]+2,a[1]*.88],[(a[0]+c[0])/2+3,0],[c[0]+2,c[1]*.88]].map(B),Math.max(7,Math.min(12,b.ry*.42)))};
TOP2['Father Christmas Suit']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.04,-6),W2=hx*.54,H=hy*.95;
  const cone=[[-W2,0],[-W2*.72,-H*.48],[-W2*1.02,-H*.5],[-W2*1.38,-H*.46],[-W2*1.46,-H*.64],[-W2*.92,-H*.94],[-W2*.1,-H*1.08],[W2*.5,-H*.78],[W2*.9,-H*.32],[W2,0]];
  h.shape(cone.map(P),WM_RD,{w:3.6,step:8});h.part(true);h.crayon(W2*.6,H*.3,q=>P([q[0],q[1]-H*.45]),WM_RD,4);h.part(false);
  h.line([[-W2*.4,-H*.86],[W2*.3,-H*.82]].map(P),1.6,WM_RDD,.3);
  const t=P([-W2*1.5,-H*.56]),z=Math.max(4.4,Math.min(7.5,hx*.21));h.shape(scallop(t[0],t[1],z,z,7,.2).map(hmCl),WM_SN,{w:2.6,step:30,ox:0,oy:0,sc:1});
  wmFluff(h,[[-W2*1.06,-1],[0,-2.5],[W2*1.06,-1]].map(P),Math.max(7,Math.min(11,hy*.32)))};

/* 2. Little Elf Outfit: a green tunic with a pointy hem, a brown belt, a red pointy collar; a pointy green hat that bends back, a red band and a bell on the tip */
BODY2['Little Elf Outfit']=function(h,s,L,B,p){const b=s.body,a=p[p.length-1],c=p[0],zz=[];
  for(let i=1;i<6;i++){const t=i/6;zz.push([a[0]+(c[0]-a[0])*t-(i%2?b.rx*.14:0),a[1]+(c[1]-a[1])*t])}
  hmSuit(h,s,B,p.concat(zz),WM_GR);h.line([a].concat(zz,[c]).map(q=>[q[0]+4,q[1]*.94]).map(B).map(hmCl),2,WM_GRL,.3);wmBelt(h,s,B,b.rx*.12,'#7A4E2C',WM_GD)};
TOP2['Little Elf Outfit']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.02,-4),W2=hx*.46,H=hy*1.2;
  // the pointy collar first, over whatever neck item is on (it peeks out under the points)
  const a=neckAnchor(s,HT),d=[a.r[0]-a.l[0],a.r[1]-a.l[1]],m=Math.hypot(d[0],d[1])||1,u=[d[0]/m,d[1]/m],v=[-u[1],u[0]],th=Math.max(8,Math.min(13,hy*.42)),cl=q=>[q[0],Math.min(q[1],GY+3)];
  const top=[],bot=[];for(let i=0;i<=8;i++){const t=-.1+i/8*1.18,c=hw2Sag(a,t,6);top.push([c[0]-v[0]*th*.2,c[1]-v[1]*th*.2]);const k=th*(i%2?.35:1.15);bot.unshift([c[0]+v[0]*k,c[1]+v[1]*k])}
  h.shape(top.concat(bot).map(cl),WM_RD,{w:2.8,step:30,amp:.5,ox:0,oy:0,sc:1,closed:1,famp:.3});h.line(top.slice(1,-1).map(cl),1.8,'#FF9A90',.3);
  const hat=[[-W2,0],[-W2*.55,-H*.5],[-W2*.5,-H*.84],[-W2*.8,-H*1.06],[-W2*1.3,-H*1.04],[-W2*.92,-H*1.16],[-W2*.12,-H*.9],[W2*.45,-H*.44],[W2,0]];
  h.shape(hat.map(P),WM_GR,{w:3.6,step:8});h.part(true);h.crayon(W2*.6,H*.25,q=>P([q[0],q[1]-H*.35]),WM_GR,4);h.part(false);
  h.line([[-W2*.9,-4],[W2*.9,-4]].map(P),4.6,WM_RD,.4);h.line([[-W2*.5,-H*.5],[-W2*.62,-H*.8]].map(P),1.4,WM_GRL,.3);
  const bz=Math.max(4,Math.min(6.4,hx*.19)),t=P([-W2*1.3-bz*.5,-H*1.04+bz*.7]);wmBell(h,t,bz)};

/* 3. Gingerbread Pup Suit (a look, not food): a brown suit, white icing squiggles at the hems and on the back, two gumdrop buttons, a little icing heart */
BODY2['Gingerbread Pup Suit']=function(h,s,L,B,p){const b=s.body,a=p[p.length-1],c=p[0];hmSuit(h,s,B,p,WM_GB);
  wmIcing(h,B,[[a[0]+5,a[1]*.8],[(a[0]+c[0])/2+6,0],[c[0]+5,c[1]*.8]],1.8);
  wmIcing(h,B,p.slice(-7,-1).map(q=>[q[0]*.86,q[1]*.8]),1.6);wmIcing(h,B,p.slice(1,6).map(q=>[q[0]*.92,q[1]*.8]),1.6);
  [[.42,-.12,'#E8505B'],[.46,.34,'#6CC25A']].forEach(([x,y,col])=>{const q=hmCl(B(hmIn(s,x,y))),z=Math.max(3.4,Math.min(5.6,b.ry*.2));h.shape(circ(q[0],q[1],z,z*.9,8).map(hmCl),col,{w:2.2,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2});h.dot(q[0]-z*.3,q[1]-z*.3,z*.22,z*.2,W)});
  const hc=hmCl(B(hmIn(s,-.02,-.2)));h.line([[hc[0]-4,hc[1]-1],[hc[0]-2,hc[1]-4],[hc[0],hc[1]-1.5],[hc[0]+2,hc[1]-4],[hc[0]+4,hc[1]-1],[hc[0],hc[1]+4],[hc[0]-4,hc[1]-1]].map(hmCl),1.8,W,.2)};

/* 4. Snowman Suit: a white suit with three coal buttons and a few snowflakes; a little black top hat with a red band and the carrot tucked in the band
   (the carrot sits on the hat, never on the dog's nose) */
BODY2['Snowman Suit']=function(h,s,L,B,p){const b=s.body;hmSuit(h,s,B,p,WM_SN);
  h.line(p.slice(-7,-1).map(q=>[q[0]*.86,q[1]*.82]).map(B).map(hmCl),2.4,WM_SND,.4);
  [[.62,-.42],[.7,0],[.62,.42]].forEach(([x,y],i)=>{const q=hmCl(B(hmIn(s,x,y))),z=Math.max(2.6,Math.min(4.4,b.ry*.16));h.shape(circ(q[0],q[1],z,z*.92,7,.12).map(hmCl),'#3A3236',{w:1.8,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2})});
  [[-.45,-.35],[.1,.3],[-.2,.45]].forEach(([x,y])=>wnFlake(h,hmCl(B(hmIn(s,x,y))),Math.max(3,Math.min(5,b.ry*.2)),WM_ICD,1.4,0))};
TOP2['Snowman Suit']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.04,-6),W2=hx*.4,H=hy*.88;
  h.shape([[-W2,0],[-W2*.94,-H],[W2*.94,-H],[W2,0]].map(P),WM_BK,{w:3.4,step:8});h.line([[-W2*.6,-H*.85],[-W2*.62,-H*.4]].map(P),1.6,WM_BKL,.3);
  h.line([[-W2*.98,-H*.2],[W2*.98,-H*.2]].map(P),4,WM_RD,.3);
  h.shape(circ(0,1,W2*1.75,4.2,14).map(P),WM_BK,{w:3.2,step:8});
  // the carrot, tucked in the band and pointing up and back (away from the face), a green sprig at its root
  const r=[-W2*.45,-H*.24],z=Math.max(12,Math.min(20,hy*.72)),M=q=>{const r2=rot(q,-152);return P([r[0]+r2[0],r[1]+r2[1]])};
  h.shape([[0,-z*.2],[z*.55,-z*.1],[z,0],[z*.55,z*.1],[0,z*.2]].map(M),WM_OR,{w:2.2,step:30,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.2});
  [.35,.6].forEach(t=>h.line([[z*t,-z*.12*(1-t)],[z*t+1.6,z*.08*(1-t)]].map(M),1.2,'#B5561C',.1));
  [[-z*.22,-z*.2],[-z*.26,z*.06]].forEach(q=>h.line([[0,0],q].map(M),1.8,WM_GRD,.2))};

/* 5. Polar Bear Hood: a fluffy white suit and a white hood with two round ears (the face open, the dog's own ears tucked in) */
BODY2['Polar Bear Hood']=function(h,s,L,B,p){const b=s.body,a=p[p.length-1],c=p[0],zz=[];for(let i=1;i<5;i++){const t=i/5;zz.push([a[0]+(c[0]-a[0])*t-(i%2?b.rx*.06:b.rx*.02),a[1]+(c[1]-a[1])*t])}
  hmSuit(h,s,B,p.concat(zz),'#FBFAF4');
  [[-.35,-.5],[.15,-.62],[.5,-.3],[-.1,.1],[.3,.42],[-.4,.45]].forEach(([x,y])=>{const q=B(hmIn(s,x,y));h.line([[q[0]-3,q[1]-1],[q[0]-1,q[1]+1.5],[q[0]+1,q[1]-1],[q[0]+3,q[1]+1.5]].map(hmCl),1.5,WM_SND,.2)})};
TOP2['Polar Bear Hood']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,{o,n,ox,oy}=hmHood(s,L);
  h.shape(o.concat(n).map(HT).map(hmCl),'#FBFAF4',{w:3.8,step:7,amp:.9});h.crayon(hx*.5,hy*.3,q=>HT([q[0]-hx*.45,q[1]-hy*.5]),'#FBFAF4',4);
  h.line(n.slice(1,-1).map(q=>[ox+(q[0]-ox)*1.08,oy+(q[1]-oy)*1.08]).map(HT).map(hmCl),2,WM_SND,.5);
  const z=Math.max(hx,hy)*.27;[-138,-76].forEach(an=>{const t=an*D2R,c=HT([Math.cos(t)*hx*1.08,Math.sin(t)*hy*1.1]);
   h.shape(circ(c[0],c[1],z,z,10).map(hmCl),'#FBFAF4',{w:3,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4,famp:.25});const dr=Math.min(1,Math.max(.4,(GY-1-c[1]+z)/(z*2)));h.dot(c[0],Math.min(c[1]+z*.08,GY-3-z*.46*dr),z*.5*dr,z*.46*dr,'#E9D2CC')});// the inner ear stays inside an ear the ground flattens (akita roll-over)
  [[-.7,-.45],[-.35,-.85]].forEach(q=>{const c=HT([hx*q[0],hy*q[1]]);h.line([[c[0]-3,c[1]],[c[0]-1,c[1]+2],[c[0]+1,c[1]],[c[0]+3,c[1]+2]].map(hmCl),1.4,WM_SND,.2)})};

/* 6. Penguin Suit: a black suit with a white chest and tummy along the underside, two black flippers with white edges, two orange webbed feet at the hem;
   a black hood whose own penguin face sits on the crown: two big googly eyes and an orange beak sticking out over the brow like a cap's peak
   (all of it above the dog's eyes, so the dog's face stays open) */
function wmFlipper(h,B,root,ang,z,far){const pts=[[0,-z*.18],[z*.5,-z*.24],[z*.96,-z*.1],[z*1.08,z*.04],[z*.5,z*.22],[0,z*.18]].map(q=>{const r2=rot(q,ang);return hmCl(B([root[0]+r2[0],root[1]+r2[1]]))});
  h.shape(pts,far?'#24202A':'#4A4258',{w:2.8,step:30,ox:0,oy:0,sc:1,closed:1,amp:.4,famp:.25});if(!far)h.line([pts[0],pts[1],pts[2]].map(q=>[q[0]+(pts[4][0]-q[0])*.18,q[1]+(pts[4][1]-q[1])*.18]),2,W,.2)}
// an orange webbed foot (three toes) at the body-local point c, toes pointing forward
function wmPFoot(h,c,z,far){const pts=[[-z*.45,-z*.3],[z*.3,-z*.34],[z*.95,-z*.5],[z*.78,-z*.16],[z*1.2,-z*.06],[z*.86,z*.1],[z*1.1,z*.3],[z*.3,z*.3],[-z*.45,z*.24]].map(q=>hmCl([c[0]+q[0],c[1]+q[1]]));
  h.shape(pts,far?'#C96A1E':WM_OR,{w:2.4,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2});if(!far)h.line([pts[1],pts[3]].map(q=>[q[0]-1,q[1]]),1.2,'#B5561C',.1)}
const wmFlipAng=L=>/^(sleep|down|crouch|playdead)$/.test(L.pose)?168:L.pose==='rollover'?-60:L.pose==='jump'?140:118;
BACK2['Penguin Suit']=function(h,s,L,B){const b=s.body;wmFlipper(h,B,[b.rx*.62,b.ry*.1],wmFlipAng(L)-18,Math.max(14,Math.min(24,b.ry*1.05))*.85,1)};
BODY2['Penguin Suit']=function(h,s,L,B,p){const b=s.body,lie=/^(sleep|down|crouch|playdead)$/.test(L.pose);hmSuit(h,s,B,p,WM_BK);
  // the white chest and tummy: a band round the front and the underside of the suit, kept inside the suit's line
  h.part(true);h.shape([[-b.rx*.62,b.ry*1.5],[-b.rx*.56,b.ry*.72],[-b.rx*.1,b.ry*.46],[b.rx*.38,b.ry*.3],[b.rx*.66,b.ry*.02],[b.rx*.8,-b.ry*.4],[b.rx*.9,-b.ry*.9],[b.rx*1.6,-b.ry*.9],[b.rx*1.6,b.ry*1.5]].map(B).map(hmCl),W,{noline:1,ox:0,oy:0,step:9,famp:.6});h.part(false);
  h.line([[-b.rx*.5,b.ry*.76],[-b.rx*.1,b.ry*.5],[b.rx*.38,b.ry*.34],[b.rx*.66,b.ry*.06],[b.rx*.8,-b.ry*.36]].map(B).map(hmCl),1.6,WM_SND,.3);
  h.line([[b.rx*-.25,-b.ry*.55],[b.rx*.3,-b.ry*.72]].map(B).map(hmCl),2,WM_BKL,.3);
  // orange webbed feet over the two front paws, toes forward (on a very long-legged dog they sit a touch up the leg, never far below the suit)
  let by=-1e9;for(let an=0;an<360;an+=15){const q=B([b.rx*Math.cos(an*D2R),b.ry*Math.sin(an*D2R)]);by=Math.max(by,q[1])}const fz=l=>Math.max(7,Math.min(13,l.w*1.5)),lim=l=>by+b.ry*1.6+14-fz(l)*.3-6;
  (L.legs||[]).filter(l=>(l.id==='NF'||l.id==='FF')&&l.foot&&!l.raised&&!l.sitfoot).sort((a,c)=>(a.id==='FF'?0:1)-(c.id==='FF'?0:1)).forEach(l=>wmPFoot(h,[l.foot[0]+2,Math.min(l.foot[1]+1,GY-3,lim(l))],fz(l),l.id==='FF'));
  wmFlipper(h,B,[b.rx*.36,-b.ry*.34],wmFlipAng(L),Math.max(16,Math.min(28,b.ry*1.2)),0)};
TOP2['Penguin Suit']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,{o,n,ox,oy}=hmHood(s,L);
  h.shape(o.concat(n).map(HT).map(hmCl),WM_BK,{w:3.8,step:7,amp:.9});h.crayon(hx*.5,hy*.3,q=>HT([q[0]-hx*.45,q[1]-hy*.5]),WM_BK,4);
  h.line([[-hx*.8,-hy*.45],[-hx*.62,-hy*.8]].map(HT).map(hmCl),1.8,WM_BKL,.3);
  // the hood's own penguin face on the crown: two big googly eyes, the beak sticking out forward over the brow; all of it stays above the dog's eyes
  const f=L.face,er=s.eyes,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],top=Math.min(hy*e0[1]-er[0],hy*e1[1]-er[1])-3,z=Math.max(5,Math.min(9,hx*.27)),fy=Math.min(-hy*.98,top-z*1.25),fx=-hx*.16,P=q=>HT([fx+q[0],fy+q[1]]);
  [-1,1].forEach(sd=>{const c=P([sd*z*1.02,0]);h.shape(circ(c[0],c[1],z,z*1.06,10).map(hmCl),W,{w:2.2,step:30,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.15});h.dot(c[0]+z*.3,c[1]+z*.12,z*.46,z*.5,INK);h.dot(c[0]+z*.12,c[1]-z*.12,z*.14,z*.14,W)});
  h.shape([[z*1.6,-z*.5],[z*2.6,-z*.56],[z*4.3,z*.06],[z*2.6,z*.72],[z*1.6,z*.62]].map(P).map(hmCl),WM_OR,{w:2.4,step:30,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.15});
  h.line([[z*1.8,z*.1],[z*3.8,z*.1]].map(P).map(hmCl),1.4,'#B5561C',.1)};

/* 7. Puffer Jacket: a bright quilted puffer (lumpy edge, stitched channels, a shine on each puff), a zip pull and a pink trim; body only, so a hat goes on top */
BODY2['Puffer Jacket']=function(h,s,L,B,p){const b=s.body,f=s.fluff?1.12:1.08,lp=p.map((q,i)=>{const k=i%3===1?1.07:1.02;return[q[0]*k,q[1]*k]});
  h.shape(lp.map(B).map(hmCl),WM_PU,{w:4.6,step:9});h.crayon(b.rx*.7,b.ry*.7,q=>B([q[0]+b.rx*.25,q[1]]),WM_PU,6);
  const yy=x=>b.ry*(f+.04)*.9*Math.sqrt(Math.max(0,1-Math.pow(x/(b.rx*f),2)));
  [.74,.44,.14,-.14].forEach(xx=>{const x=b.rx*xx;h.line([[x,-yy(x)],[x+b.rx*.04,0],[x,yy(x)]].map(B).map(hmCl),2,WM_PUD,.4)});
  [.6,.29,0].forEach(xx=>{const x=b.rx*xx;h.line([[x-b.rx*.06,-yy(x)*.62],[x+b.rx*.04,-yy(x)*.7]].map(B).map(hmCl),2.4,WM_PUL,.3)});
  h.line(lp.slice(-6).map(B).map(hmCl),5.4,'#F0679A',.6);h.line(lp.slice(0,4).map(B).map(hmCl),5.4,'#F0679A',.6);
  const z=hmCl(B([b.rx*.78,-b.ry*.42]));h.shape([[z[0]-2.2,z[1]],[z[0]+2.2,z[1]],[z[0]+2.6,z[1]+7],[z[0]-2.6,z[1]+7]].map(hmCl),'#FFD84A',{w:1.8,step:30,ox:0,oy:0,sc:1,closed:1,amp:.2,famp:.15})};

/* 8. Nutcracker Jacket & Hat: a red soldier jacket, a white cross strap, gold buttons, a gold shoulder fringe, a navy hem; a tall black hat with gold trim and a red plume */
BODY2['Nutcracker Jacket & Hat']=function(h,s,L,B,p){const b=s.body;hmSuit(h,s,B,p,WM_NC);
  h.line(p.slice(-7).map(B).map(hmCl),4.4,WM_NV,.4);
  const a0=hmIn(s,.48,-.85),a1=hmIn(s,-.12,.84);h.tube([a0,[(a0[0]+a1[0])/2+2,(a0[1]+a1[1])/2],a1].map(B).map(hmCl),Math.max(3.4,b.ry*.17),W,{ow:3});
  [[.66,-.42],[.72,-.06],[.68,.32]].forEach(([x,y])=>{const q=hmCl(B(hmIn(s,x,y))),z=Math.max(2.6,Math.min(4,b.ry*.15));h.shape(circ(q[0],q[1],z,z,7).map(hmCl),WM_GD,{w:1.8,step:30,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.2})});
  const e=hmCl(B(hmIn(s,.42,-.78))),z=Math.max(6,Math.min(10,b.ry*.36));
  h.shape([[e[0]-z,e[1]+z*.2],[e[0]-z*.7,e[1]-z*.4],[e[0]+z*.7,e[1]-z*.4],[e[0]+z,e[1]+z*.2]].map(hmCl),WM_GD,{w:2.2,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2});
  [-.6,-.2,.2,.6].forEach(t=>h.line([[e[0]+z*t,e[1]+z*.25],[e[0]+z*t,e[1]+z*.62]].map(hmCl),1.6,WM_GDD,.15))};
TOP2['Nutcracker Jacket & Hat']=function(h,s,L,HT){const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,-.04,4),W2=hx*.4,H=hy*1.12;
  const pl=P([0,-H-2]),z=Math.max(4.2,Math.min(7,hx*.2));h.shape(scallop(pl[0],pl[1]-z*.4,z*.8,z*1.1,6,.18).map(hmCl),WM_RD,{w:2.4,step:30,ox:0,oy:0,sc:1});
  h.shape([[-W2,0],[-W2*1.1,-H],[W2*1.1,-H],[W2,0]].map(P),WM_BK,{w:3.6,step:8});h.line([[-W2*.6,-H*.9],[-W2*.55,-H*.3]].map(P),1.6,WM_BKL,.3);
  h.line([[-W2*1.02,-3],[W2*1.02,-3]].map(P),4.2,WM_GD,.3);h.line([[-W2*1.06,-H+2.5],[W2*1.06,-H+2.5]].map(P),3,WM_GD,.3);
  star5(h,P([W2*.05,-H*.52]),Math.max(3.4,hx*.15),WM_GD,1.6)};

/* 9. Snowflake Wings: two pale blue paper snowflakes on each side, on a soft strap round the chest; body only, so a hat goes on top */
function wmFlakeWing(h,B,root,ang,z,far){const M=q=>{const r2=rot(q,ang);return B([root[0]+r2[0],root[1]+r2[1]])},c1=M([-z*.14,-z*.62]),c2=M([-z*.72,-z*.28]);
  const tc=far?mix(WM_IC,WM_ICD,.45):WM_IC;h.tube([B(root),c1].map(hmCl),3,tc,{ow:2.6});h.tube([B(root),c2].map(hmCl),3,tc,{ow:2.6});
  wmPaperFlake(h,c2,z*.36,ang+8,WM_IC,far);wmPaperFlake(h,c1,z*.5,ang,WM_IC,far)}
BACK2['Snowflake Wings']=function(h,s,L,B){const w=hwWingSet(s,L);wmFlakeWing(h,B,w.far,w.fang,w.z*.9,1)};
BODY2['Snowflake Wings']=function(h,s,L,B){const b=s.body,w=hwWingSet(s,L);
  const st=[[b.rx*.4,-b.ry*.98],[b.rx*.47,0],[b.rx*.42,b.ry*.95]];h.line(st.map(B).map(hmCl),6,INK,.4);h.line(st.map(B).map(hmCl),3.6,WM_ICD,.4);
  h.line([[b.rx*.4,-b.ry*.9],[w.root[0],w.root[1]+2]].map(B).map(hmCl),5,INK,.4);h.line([[b.rx*.4,-b.ry*.9],[w.root[0],w.root[1]+2]].map(B).map(hmCl),2.8,WM_ICD,.4);
  wmNearWing(h,s,()=>wmFlakeWing(h,B,w.root,w.ang,w.z,0))};

/* 10. Jingle Bell Collar (neck slot): a soft red felt collar with three little gold bells (lying down, the bells rest on the collar) */
NECK2['Jingle Bell Collar']=function(h,s,L,HT){const a=neckAnchor(s,HT),sag=t=>{const x=a.l[0]+(a.r[0]-a.l[0])*t,y=a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*8;return[x,Math.min(y,GY-18)]};
  const pts=[];for(let i=0;i<=8;i++)pts.push(sag(i/8));h.line(pts,8,INK);h.line(pts,5.6,WM_RD,.4);h.line(pts.slice(1,6).map(q=>[q[0],q[1]-1.2]),1.4,'#FF9A90',.3);
  const lie=/^(sleep|down|crouch|playdead|rollover)$/.test(L.pose),R=Math.max(3.4,Math.min(5,s.head.rx*.15));
  [.18,.52,.86].forEach((t,i)=>{const c0=sag(t);if(lie){wmBell(h,[c0[0],Math.min(c0[1]+R*.5,GY-R-1)],R*.85);return}
   const c=[c0[0],Math.min(c0[1]+R+(i===1?4.5:2),GY-R-1)];h.line([[c0[0],c0[1]+1],[c[0],c[1]-R+1]],1.6,INK,.1);wmBell(h,c,R)})};
// v2.18.1 "Tidy costumes": a market costume draws on the dog's random stream and then hands it back where it found it, so the dog's own lines
// (head, face, muzzle, haunch, legs drawn after it) are exactly the plain dog's, byte for byte, and a costume can never push the dog's fills past its lines.
// The costume keeps its own jitter (it starts from the same point of the stream as before).
// Where a market costume changes the dog itself (the topknot stays under the hat, the ears tuck into the Dinosaur Hood), frame() and drawEars move the stream
// on as the plain dog would (hmPlain), so the head drawn after is the plain dog's too.
const HM_OWN=new Set(['Little Witch Hat & Cape','Scarecrow Overalls','Mummy Wraps','Skeleton Suit','Black Cat Ears & Bow','Pirate Hat & Sash','Dinosaur Hood','Little Owl Wings','Wizard Robe & Star Hat','Lion Mane',
  'Father Christmas Suit','Little Elf Outfit','Gingerbread Pup Suit','Snowman Suit','Polar Bear Hood','Penguin Suit','Puffer Jacket','Nutcracker Jacket & Hat','Snowflake Wings','Jingle Bell Collar']);// and the Winter Market 2026 costumes
HM_OWN.forEach(n=>[BACK2,BODY2,TOP2,RUFF2,NECK2].forEach(R=>{const fn=R[n];if(fn)R[n]=function(h,...a){const st=h.r.st();fn(h,...a);h.r.st(st)}}));

// draw(h) on the dog, then leave its random stream where plain(g) would have left it (plain draws on a throwaway kit that shares the stream)
function hmPlain(h,draw,plain){const st=h.r.st(),g=kit(h.r);g.setJ(h.getJ());g.cy=h.cy;if(h.wet)g.wet=1;plain(g);const e=h.r.st();h.r.st(st);draw(h);h.r.st(e)}

/* ---------- v2.24 "Kind shop" wearables (docs/design/kind-shop.md; the owner's approved preview of 3 Nov 2026, world/pawart_shop.js) ----------
   neck 'Golden Name Tag' (the Supporter Pack: a gold bone tag on a blue collar, not the Bond 10 Golden Collar), and the Tokyo Street set:
   body 'Sukajan Jacket', head 'Bucket Hat', neck 'Paw Tote', neck 'Lucky Cat Charm', eyes 'Round Shades' (EYES2, the eyes slot's own table from v2.24),
   feet 'Little Sneakers': a NEW slot, outfit.feet (FEET2). A shoe goes on every foot of every pose but sleep and playdead (the eyes slot's rule), on adults and puppies,
   never on a newborn; each foot's shoe is drawn inside its own leg (its pa-d-leg group), so the body still lies over the far feet.
   Every draw hands the dog back its random stream (the v2.18.1 rule), so a dog without them is byte for byte the plain dog, and with them its own
   lines are; under the Bucket Hat a topknot moves the stream on as if drawn (hmPlain), so the head is the plain dog's head too. */
const KS={jade:'#2F8F6E',jadeL:'#8FD3B4',rib:'#2B2430',ribS:'#F08A24',hat:'#B9A6E8',hatD:'#7E63C7',hatB:'#FFF1D6',canvas:'#F6EBD3',strap:'#C99A5E',shade:'#3B3346',
  sole:'#7FCBB0',pink:'#FF7EB6',red:'#D7263D',blue:'#4F8FD6',gold:'#F2C14E',goldD:'#C9962A'},EYES2={},FEET2={};
OUT.head.push('Bucket Hat');OUT.neck.push('Golden Name Tag','Paw Tote','Lucky Cat Charm');OUT.body.push('Sukajan Jacket');OUT.eyes.push('Round Shades');OUT.feet=['Little Sneakers'];
const KS_HAT=new Set(['Bucket Hat']);
function ksBone(cx,cy,len,th){const L=len/2-th*.42,kr=th*.44,k1=th*.4,t=th*.22,half=[];// a dog bone outline (from world B's boneP), level
  for(let i=0;i<=3;i++)half.push([-L*.5+i*L*.5/3*2,-t]);
  const arc=(ox,oy,a0,a1,n)=>{for(let i=0;i<=n;i++){const q=(a0+(a1-a0)*i/n)*D2R;half.push([ox+Math.cos(q)*kr,oy+Math.sin(q)*kr])}};
  arc(L,-k1,165,415,8);half.push([L+kr*.2,0]);arc(L,k1,-55,195,8);for(let i=3;i>=0;i--)half.push([-L*.5+i*L*.5/3*2,t]);
  const right=half.filter(p=>p[0]>=-0.001),left=right.map(p=>[-p[0],-p[1]]);return right.concat(left).map(p=>[cx+p[0],cy+p[1]])}
function ksSag(s,HT){const a=neckAnchor(s,HT);return t=>{const x=a.l[0]+(a.r[0]-a.l[0])*t,y=a.l[1]+(a.r[1]-a.l[1])*t+Math.sin(Math.PI*t)*8;return[x,Math.min(y,GY-18)]}}
NECK2['Golden Name Tag']=function(h,s,L,HT){// a soft blue leather collar and a big gold bone tag under the chin with an engraved paw
  const sag=ksSag(s,HT),pts=[];for(let i=0;i<=8;i++)pts.push(sag(i/8));h.line(pts,7.6,INK);h.line(pts,5.2,KS.blue,.4);
  const c0=sag(.56),R=Math.max(6,Math.min(8.5,s.head.rx*.26)),c=[c0[0],Math.min(c0[1]+R+4,GY-R-2)];
  h.line([[c0[0],c0[1]+1],[c[0],c[1]-R*.6]],1.6,INK,.1);
  h.shape(ksBone(c[0],c[1],R*3.1,R*1.35),KS.gold,{w:2.6,step:5,ox:0,oy:0,sc:1,closed:1,amp:.4,famp:.25});
  [[-.25,0],[.05,-.28],[.32,-.02],[.05,.22]].forEach(([dx,dy],i)=>h.dot(c[0]+dx*R*1.1,c[1]+dy*R*1.1,i===3?R*.24:R*.13,i===3?R*.2:R*.13,KS.goldD));
  h.line([[c[0]-R*.9,c[1]-R*.3],[c[0]-R*.55,c[1]-R*.45]],1.4,'#FFF6CC',.2)};
BODY2['Sukajan Jacket']=function(h,s,L,B,p){// a jade satin souvenir jacket: black and orange ribbed hem and collar, a pink blossom and a gold star stitched on the side
  const b=s.body,f=s.fluff?1.12:1.08;
  h.shape(p.map(B),KS.jade,{w:4.6});h.crayon(b.rx*.7,b.ry*.7,q=>B([q[0]+b.rx*.3,q[1]]),KS.jade,6);
  h.line([[b.rx*.05,-b.ry*.6],[b.rx*.35,-b.ry*.74],[b.rx*.62,-b.ry*.62]].map(B),3.2,KS.jadeL,.4);
  const hem=[];for(let a=104;a>=34;a-=7)hem.push([Math.cos(a*D2R)*b.rx*f*.9,Math.sin(a*D2R)*b.ry*f*.84]);h.line(hem.map(B),7.6,KS.rib,.5);h.line(hem.map(B),2.4,KS.ribS,.4);
  const ed=[];for(let a=-64;a<=-6;a+=8)ed.push([Math.cos(a*D2R)*b.rx*f*.88,Math.sin(a*D2R)*b.ry*f*.88]);h.line(ed.map(B),7,KS.rib,.5);h.line(ed.map(B),2.2,KS.ribS,.4);
  const fl=B([b.rx*.12,-b.ry*.08]),R=Math.max(3.4,b.ry*.17);for(let i=0;i<5;i++){const t=-Math.PI/2+i/5*Math.PI*2;h.dot(fl[0]+Math.cos(t)*R,fl[1]+Math.sin(t)*R,R*.72,R*.72,'#FFB3CF')}h.dot(fl[0],fl[1],R*.42,R*.42,'#FFD84A');
  const sc=B([b.rx*.5,b.ry*.05]),Z=Math.max(5,b.ry*.26),sp=[];for(let i=0;i<10;i++){const t=-Math.PI/2+i*Math.PI/5,r=i%2?Z*.45:Z;sp.push([sc[0]+Math.cos(t)*r,sc[1]+Math.sin(t)*r])}
  h.shape(sp,KS.gold,{w:2,step:30,ox:0,oy:0,sc:1,closed:1,amp:.3,famp:.2})};
HAT2['Bucket Hat']=function(h,s,L,HT){// a soft lilac bucket hat with crayon checks, a cream band and a drooping brim
  const hx=s.head.rx,hy=s.head.ry,P=hatP(s,L,HT,.1,-5),W2=hx*.62,H=hy*.46;
  h.shape([[-W2*1.7,12],[-W2*1.3,-1],[W2*1.3,-1],[W2*1.7,12],[W2*1.15,15],[-W2*1.15,15]].map(P),KS.hat,{w:3.6,step:8});
  h.shape([[-W2,1],[-W2*.94,-H*.7],[-W2*.62,-H],[W2*.62,-H],[W2*.94,-H*.7],[W2,1]].map(P),KS.hat,{w:3.8,step:8});
  for(let i=-2;i<=2;i++)h.line([[i*W2*.34,-2],[i*W2*.3,-H*.92]].map(P),1.8,KS.hatD,.4);
  [[.34,.92],[.68,.8]].forEach(([y,k])=>h.line([[-W2*k,-H*y],[W2*k,-H*y]].map(P),1.8,KS.hatD,.4));
  h.line([[-W2*.98,-3],[W2*.98,-3]].map(P),4.6,KS.hatB,.4);
  h.line([[-W2*1.4,9],[0,11],[W2*1.4,9]].map(P),1.4,KS.hatD,.5)};
NECK2['Paw Tote']=function(h,s,L,HT){// a little canvas tote on a strap round the neck, a blue stripe and a pink paw, resting on the chest
  const a=neckAnchor(s,HT),hx=s.head.rx,pk=s.pup?.78:1,bw=Math.max(14,hx*.78*pk),bh=Math.max(13,hx*.7*pk),cl=q=>[q[0],Math.min(q[1],GY-4)],c=[a.c[0]-hx*.06,Math.min(a.c[1]+bh*.95,GY-4-bh*.5)];// the whole bag stays above the ground (head down, it rests there)
  h.line([a.l,[(a.l[0]+a.r[0])/2,(a.l[1]+a.r[1])/2+5],a.r],2.6,KS.strap);
  // v2.24 art fix: only the strap when the bag would lie on the face: a newborn, a head tipped over (rollover, playdead: the neck no longer under
  // the head), or the bag over an eye (a head held low)
  const hc=HT([0,0]),dv=[a.c[0]-hc[0],a.c[1]-hc[1]],f=s.face,er=s.eyes,box=[c[0]-bw*.6,c[1]-bh*.55,c[0]+bw*.6,c[1]+bh*.55];
  const onEye=[[f.e0||[-.1,-.04],er[0]],[f.e1||[.42,-.1],er[1]]].some(([e,r])=>{const p=HT([hx*e[0],s.head.ry*e[1]]),z=Math.max(r,5)+1;return p[0]+z>box[0]&&p[0]-z<box[2]&&p[1]+z>box[1]&&p[1]-z<box[3]});
  if(s.pup===2||L.pose==='rollover'||L.pose==='playdead'||dv[1]<Math.hypot(dv[0],dv[1])*.6||onEye)return;
  h.line([a.l,[c[0]-bw*.3,c[1]-bh*.48]],2.6,KS.strap);h.line([a.r,[c[0]+bw*.3,c[1]-bh*.48]],2.6,KS.strap);
  h.shape([[c[0]-bw*.5,c[1]-bh*.5],[c[0]+bw*.5,c[1]-bh*.5],[c[0]+bw*.58,c[1]+bh*.5],[c[0]-bw*.58,c[1]+bh*.5]].map(cl),KS.canvas,{w:3,step:7,ox:0,oy:0,sc:1,closed:1,amp:.6,famp:.4});
  h.line([[c[0]-bw*.48,c[1]-bh*.22],[c[0]+bw*.48,c[1]-bh*.22]],2.6,KS.blue,.3);
  const q=[c[0],c[1]+bh*.14];h.dot(q[0],q[1]+1.5,3,2.4,KS.pink);[[-3.2,-2],[-1,-4],[1.4,-4],[3.4,-2]].forEach(([dx,dy])=>h.dot(q[0]+dx,q[1]+dy,1.1,1.2,KS.pink))};
NECK2['Lucky Cat Charm']=function(h,s,L,HT){// a red cord with a tiny white beckoning cat charm (a cat on a dog: the joke), one paw up, a gold bell
  const sag=ksSag(s,HT),pts=[];for(let i=0;i<=8;i++)pts.push(sag(i/8));h.line(pts,5.6,INK);h.line(pts,3.4,KS.red,.4);
  const c0=sag(.56),R=Math.max(8,Math.min(10.5,s.head.rx*.33)),c=[c0[0],Math.min(c0[1]+R+3,GY-R-2)];
  h.shape([[c[0]-R,c[1]-R*.2],[c[0]-R*.95,c[1]-R*1.5],[c[0]-R*.3,c[1]-R*.9],[c[0]+R*.3,c[1]-R*.9],[c[0]+R*.95,c[1]-R*1.5],[c[0]+R,c[1]-R*.2],[c[0]+R*.8,c[1]+R*.8],[c[0]-R*.8,c[1]+R*.8]],W,{w:2.4,step:5,ox:0,oy:0,sc:1,closed:1,amp:.35,famp:.2});
  h.line([[c[0]-R*.5,c[1]-R*.2],[c[0]-R*.2,c[1]-R*.3]],1.4,INK,.1);h.line([[c[0]+R*.2,c[1]-R*.3],[c[0]+R*.5,c[1]-R*.2]],1.4,INK,.1);
  h.dot(c[0]-R*.68,c[1]-R*.95,R*.14,R*.22,'#FF9EB8');h.dot(c[0]+R*.68,c[1]-R*.95,R*.14,R*.22,'#FF9EB8');h.dot(c[0],c[1]+R*.25,R*.24,R*.24,KS.gold);
  h.shape(circ(c[0]+R*1.15,c[1]-R*.75,R*.34,R*.42,7),W,{w:1.8,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.15})};
EYES2['Round Shades']=function(h,s,L,HT){// round tinted glasses in a thin gold frame, a white shine on each lens
  const f=s.face,hx=s.head.rx,hy=s.head.ry,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],er=s.eyes;
  const a=HT([hx*e0[0],hy*e0[1]]),b=HT([hx*e1[0],hy*e1[1]]),s0=Math.max(er[0],7)+4,s1=Math.max(er[1],7)+4;
  h.line([[a[0]+s0*.8,a[1]-1],[(a[0]+b[0])/2,Math.min(a[1],b[1])-5],[b[0]-s1*.8,b[1]-1]],2.6,KS.goldD);h.line([[a[0]-s0,a[1]],HT([-hx*.88,-hy*.22])],2.6,KS.goldD);
  [[a,s0],[b,s1]].forEach(([c,z])=>{h.shape(circ(c[0],c[1],z,z,12),KS.shade,{w:3,ox:0,oy:0,sc:1,closed:1,famp:.3,fop:.88,amp:.5});h.line([[c[0]-z*.5,c[1]-z*.1],[c[0]-z*.15,c[1]-z*.5]],2.2,W,.2)})};
// Little Sneakers: white with a mint sole, a pink dot on the side and two pink lace dots. The shoe in its own units (x toward the toe, y down; the sole at y .4):
const KS_SHOE=[[-.95,-1.15],[.45,-1.25],[1.05,-.65],[1.75,-.3],[1.8,.4],[-1.05,.4]],KS_SHF=mix(W,PEN,.2),KS_PKF=mix(KS.pink,PEN,.28);
// where the shoe sits on leg l: {x, y} its origin (the foot), kx, ky its size, a its turn. haunch: the sitting near hind foot (drawHaunch's oval)
function ksFoot(s,L,l,haunch){const b=s.body,far=!l.near,w=Math.max(5,l.w);
  const oval=(cx,cy,rx,ry,k)=>{const kx=(rx*2+3)/2.85,ky=Math.max(6,w*(k||.95));return{x:cx-rx-1.5+1.05*kx,y:cy+ry+1.6-.4*ky,kx,ky,a:0,far}};
  if(haunch){const c=T(L.bT)([-b.rx*.45,b.ry*.25]);if(L.gfold)return{x:c[0]+b.ry*2.1+1,y:GY-4+w*.15,kx:w*.95,ky:w*.85,a:0,far};return oval(c[0]+b.ry*.9,GY-4,b.ry*.6+3,4.5)}
  if(l.sitfoot){const hp=T(L.bT)([-b.rx*.45,b.ry*.25]);if(L.gfold)return{x:hp[0]+b.ry*1.9+9,y:GY-3.5+w*.15,kx:w*.9,ky:w*.8,a:0,far};return oval(hp[0]+b.ry*.9+9,GY-6,b.ry*.5+3,4,.85)}
  if(!l.foot)return null;const f=l.foot;
  if(l.raised){const m=l.mid||l.hip,dx=f[0]-m[0],dy=f[1]-m[1],d=Math.hypot(dx,dy)||1,ux=dx/d,uy=dy/d,k=s.pup?.8:1;
    // a leg held up: a leg pointing up or down wears the shoe on its end (the sole away from the knee); one held out level, the toe along it
    let a;if(Math.abs(uy)>=Math.abs(ux))a=Math.atan2(uy,ux)-Math.PI/2;else a=ux>0?Math.atan2(uy,ux):Math.atan2(uy,ux)+Math.PI;
    const o=Math.abs(uy)>=Math.abs(ux)?[0,w*.1]:[-w*.45,-w*.15],c=Math.cos(a),sn=Math.sin(a);return{x:f[0]+o[0]*c-o[1]*sn,y:f[1]+o[0]*sn+o[1]*c,kx:w*k,ky:w*k,a,far}}
  if(s.pup)return{x:f[0]+1.5-.3*w*.88,y:f[1]+w*.34+1.6-.4*w*.88,kx:w*.88,ky:w*.88,a:0,far};// over the puppy's round paw (drawLegs)
  return{x:f[0],y:Math.min(f[1],GY)+w*.15,kx:w,ky:w,a:0,far}}
function ksShoe(h,F){const c=Math.cos(F.a),sn=Math.sin(F.a),R=q=>{const x=q[0]*F.kx,y=q[1]*F.ky;return[F.x+x*c-y*sn,F.y+x*sn+y*c]};
  h.shape(KS_SHOE.map(R),F.far?KS_SHF:W,{w:2.8,step:5,ox:0,oy:0,sc:1,closed:1,amp:.4,famp:.25});
  h.line([[-1,.28],[1.75,.28]].map(R),3,KS.sole,.3);
  const pk=F.far?KS_PKF:KS.pink,p=R([-.2,-.35]);h.dot(p[0],p[1],F.kx*.32,F.ky*.3,pk);[[.35,-1],[.7,-.75]].forEach(q=>{const d=R(q);h.dot(d[0],d[1],F.kx*.14,F.kx*.14,pk)})}
FEET2['Little Sneakers']=function(h,s,L,l,haunch){const F=ksFoot(s,L,l,haunch);if(F)ksShoe(h,F)};
// the v2.18.1 rule: each draw hands the dog back its random stream
[HAT2,NECK2,BODY2,EYES2,FEET2].forEach(R=>['Bucket Hat','Golden Name Tag','Paw Tote','Lucky Cat Charm','Sukajan Jacket','Round Shades','Little Sneakers'].forEach(n=>{const fn=R[n];
  if(fn)R[n]=function(h,...a){const st=h.r.st();fn(h,...a);h.r.st(st)}}));
/* ---------- Promo-code looks (docs/design/promo-items.md): never sold or earned, a promotion code only. New names only: old renders never reach them ----------
   neck 'Follower Star Bandana': a sky-blue bandana under the chin (the Tokyo bandanas' crude triangle and knot), a darker blue hem band,
   two crayon stars (yellow, each in its own ink) and a tiny white paw print below them. Hands the dog back its random stream (the v2.18.1 rule). */
const PRM={sky:'#4FA8E6',skyD:'#2F78BE',star:'#FFD84A',paw:'#FFFBF2'};
function prmStar(c,R,a){const p=[];for(let i=0;i<10;i++){const t=-Math.PI/2+a+i*Math.PI/5,r=i%2?R*.46:R;p.push([c[0]+Math.cos(t)*r,c[1]+Math.sin(t)*r])}return p}
NECK2['Follower Star Bandana']=function(h,s,L,HT){
  tkBand(h,s,L,HT,PRM.sky,(Q,z)=>{
   h.shape([Q(0,0),Q(1,0),Q(1,.16),Q(0,.16)],PRM.skyD,{noline:1,ox:0,oy:0,sc:1,famp:.3});
   [[.29,.29,1.12,.2],[.71,.27,1,-.25]].forEach(([u,v,k,a])=>h.shape(prmStar(Q(u,v),Math.max(3.4,z*k),a),PRM.star,{w:1.7,step:30,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.15}));
   const p=Q(.5,.6),q=Math.max(1.1,z*.27);h.dot(p[0],p[1]+q*.9,q*1.45,q*1.15,PRM.paw);[[-1.55,-.6],[-.55,-1.45],[.55,-1.45],[1.55,-.6]].forEach(([dx,dy])=>h.dot(p[0]+dx*q,p[1]+dy*q,q*.5,q*.6,PRM.paw))})};
OUT.neck.push('Follower Star Bandana');
{const fn=NECK2['Follower Star Bandana'];NECK2['Follower Star Bandana']=function(h,...a){const st=h.r.st();fn(h,...a);h.r.st(st)}}
/* ---------- v2.30 "Better together" (V230.md 3): the friend invite gift, only from a friend's invite link ----------
   neck 'Friendship Bandana': a lavender bandana (the Tokyo bandanas' crude triangle and knot), a darker violet hem band with a cream dashed
   stitch, and two little hearts side by side, one pink and one yellow, touching like two friends holding paws, each in its own ink. */
const FSB={or:'#A98BE3',orD:'#7458BE',pink:'#F47C9C',yel:'#FFD84A',crm:'#FFF6E4'};
function fsbHeart(c,R){const p=[];for(let i=0;i<22;i++){const t=i/22*Math.PI*2;p.push([c[0]+16*Math.pow(Math.sin(t),3)*R/17,c[1]-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*R/17-R*.1])}return p}
NECK2['Friendship Bandana']=function(h,s,L,HT){
  tkBand(h,s,L,HT,FSB.or,(Q,z)=>{
   h.shape([Q(0,0),Q(1,0),Q(1,.16),Q(0,.16)],FSB.orD,{noline:1,ox:0,oy:0,sc:1,famp:.3});
   h.line([Q(.1,.12),Q(.9,.12)],Math.max(.9,z*.16),FSB.crm,.2);// art review 2: the stitch low on the hem band, clear of the knot's line
   const R=Math.max(2.5,z*.72);// art review 1: smaller hearts, further apart, so the pink and the yellow sit side by side (not one blob)
   [[.34,.33,FSB.pink],[.66,.33,FSB.yel]].forEach(([u,v,c])=>h.shape(fsbHeart(Q(u,v),R),c,{w:1.6,step:30,ox:0,oy:0,sc:1,closed:1,amp:.25,famp:.15}))})};
OUT.neck.push('Friendship Bandana');
{const fn=NECK2['Friendship Bandana'];NECK2['Friendship Bandana']=function(h,...a){const st=h.r.st();fn(h,...a);h.r.st(st)}}
function drawEyewear(h,s,L,HT,e){if(EYES2[e])return EYES2[e](h,s,L,HT);(e==='Explorer Goggles'?drawGoggles:drawGlasses)(h,s,L,HT)}

function newbornL(s,L){// eyes shut, ears folded, everything soft and curled
  L.face.eyes='closed';L.ears='sleep';L.face.mouth=L.pose==='sleep'?'sleep':'smile';L.blush=0;L.hearts=0;L.tear=0;L.tailS*=.8;
  if(L.pose==='sleep'){L.hT.x-=s.head.rx*.42;L.hT.y+=s.head.ry*.08;L.hT.a=16;L.tailA=-140}else{L.hT.y+=s.head.ry*.18;L.hT.a=8;L.tailA=-120}}
const BELLY=/^(idle|happy|pet|eat|sleep|walk|sit|sad|dirty|crouch|shake|cold|hot|dig|beg|squat|leglift|paw|down|speak|bow|scratch|sniff|yawn|howl)$/;
function drawBelly(h,s,L,B){// a rounder, lower belly: fill over the body's underline, then a new lower curve
  const b=s.body,lie=/^(sleep|down|crouch)$/.test(L.pose),fl=!!s.fluff&&!b.long&&!s.bellyFl,cy=b.ry*(lie?.36:.5)+(fl?b.ry*(lie?.1:.07):0),rx=b.rx*(b.long?.36:.5)*(fl?1.12:1),ry=b.ry*(lie?.6:.68)*(fl?1.1:1),cl=q=>[q[0],Math.min(q[1],GY-1)],E=[],A=[];
  for(let i=0;i<16;i++){const t=i/16*Math.PI*2;E.push([-b.rx*.04+Math.cos(t)*rx,cy+Math.sin(t)*ry])}
  if(fl){// fluffy coat: the bulge hangs low behind the ground, so show it by a lighter tummy and a tufty dome line over it
    const n=15;for(let i=0;i<=n;i++){const f=i/n,t=(1.02+f*.96)*Math.PI,k=1+(i%2?.06:-.02);A.push([-b.rx*.04+Math.cos(t)*rx*k,cy+Math.sin(t)*ry*k])}}
  else if(s.bellyFl){// v2.21 art fix (new spec field bellyFl: the bernese): a dark fluffy coat shows the bulge as a coat-coloured tummy under the body with a tufty ink line;
    // the fill is the tufty line closed over the top of the oval, so it never pokes past its line
    const n=14;for(let i=0;i<=n;i++){const t=(.17+i/n*.66)*Math.PI,k=1+(i%2?.07:-.02);A.push([-b.rx*.04+Math.cos(t)*rx*k,cy+Math.sin(t)*ry*k])}
    E.length=0;A.forEach(q=>E.push(q));for(let i=1;i<10;i++){const t=(.83+i/10*1.34)*Math.PI;E.push([-b.rx*.04+Math.cos(t)*rx,cy+Math.sin(t)*ry])}}
  else for(let i=0;i<=8;i++){const t=(.17+i/8*.66)*Math.PI;A.push([-b.rx*.04+Math.cos(t)*rx,cy+Math.sin(t)*ry])}
  h.shape(E.map(B).map(cl),fl?mix(s.col,'#FFFFFF',.22):(s.bellyK&&s[s.bellyK])||s.col,{noline:1,ox:0,oy:0,sc:1});h.line(A.map(B).map(cl),fl?h.LW*.75:h.LW,INK,fl?1.4:.9)
  if(s.bellyFl)[.3,.5,.7].forEach((f,i)=>{const t=f*Math.PI,x=-b.rx*.04+Math.cos(t)*rx*.72,y=cy+Math.sin(t)*ry*.72;h.line([[x-4,y-2],[x-1.5,y+2],[x+1,y-2],[x+3.5,y+2]].map(B).map(cl),2.2,mix(s.col,W,.3),.4)})}
function glitter(h,s,M,k,head){// glitter flecks on the coat: own rng, so nothing else moves
  const r=rng(hashS('glit'+(s.name||'')+head)+k*31),rx=head?s.head.rx:s.body.rx,ry=head?s.head.ry:s.body.ry,n=head?2:5;let d='',g='';
  for(let i=0;i<n;i++){const a=r()*Math.PI*2,rr=.25+r()*.5,p=M([Math.cos(a)*rx*rr,Math.sin(a)*ry*rr*(head?.6:1)-(head?ry*.35:0)]),z=2.2+r()*1.6;if(isNaN(p[0]))return;
    if(i%2)g+=`M${R1(p[0])} ${R1(p[1]-z)}L${R1(p[0]+z*.3)} ${R1(p[1]-z*.3)}L${R1(p[0]+z)} ${R1(p[1])}L${R1(p[0]+z*.3)} ${R1(p[1]+z*.3)}L${R1(p[0])} ${R1(p[1]+z)}L${R1(p[0]-z*.3)} ${R1(p[1]+z*.3)}L${R1(p[0]-z)} ${R1(p[1])}L${R1(p[0]-z*.3)} ${R1(p[1]-z*.3)}Z`;
    else d+=`M${R1(p[0]-z)} ${R1(p[1])}L${R1(p[0]+z)} ${R1(p[1])}M${R1(p[0])} ${R1(p[1]-z)}L${R1(p[0])} ${R1(p[1]+z)}`}
  h.acc.push(`<path class="pa-d-glit" d="${g}" fill="#FFE14D" stroke="#fff" stroke-width=".8"/><path class="pa-d-glit" d="${d}" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".9"/>`)}
// 3-5 crayon stars around the dog (canvas coords), twinkling by CSS
function stars(seed,bx,n0,sz){
  const r=rng(seed),w=bx[2]-bx[0],ht=bx[3]-bx[1],cl=(v,a,b)=>Math.max(a,Math.min(b,v));
  const spots=[[bx[0]-2,bx[1]+ht*.22],[bx[2]+2,bx[1]+ht*.12],[bx[0]+w*.42,bx[1]-6],[bx[2]+4,bx[1]+ht*.62],[bx[0]-4,bx[1]+ht*.7]];
  const n=n0||3+Math.floor(r()*3),cols=['#FFE14D','#FFF3A0','#FF9EC8','#FFE14D','#9EE6FF'];let o='';
  for(let i=0;i<n;i++){const sp=spots[i],x=cl(sp[0]+(r()-.5)*10,10,230),y=cl(sp[1]+(r()-.5)*8,10,176),z=(sz||8)+r()*4,P=[];
    for(let j=0;j<8;j++){const a=j/8*Math.PI*2-Math.PI/2,rr=(j%2?z*.36:z)*(1+(r()-.5)*.25);P.push([x+Math.cos(a)*rr+(r()-.5)*1.2,y+Math.sin(a)*rr+(r()-.5)*1.2])}
    const d='M'+P.map(p=>R1(p[0])+' '+R1(p[1])).join('L')+'Z';
    o+=`<g class="pa-d-tw" style="animation-delay:-${(r()*1.6).toFixed(2)}s"><path d="${d}" fill="${cols[i]}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/><path d="M${R1(x-z*.25)} ${R1(y-z*.2)}l${R1(z*.12)} ${R1(-z*.25)}" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g>`}
  return `<g class="pa-d-spk">${o}</g>`}

/* ---------- one complete redraw ---------- */
/* ---------- v2.13 face expressions (V213.md section 3) ----------
   PA.dog(key,{pose,expr}) / PA.dogHead(key,{expr}): expr is one of EXPR_LIST. No expr (or one not ok for the pose, or a newborn) = the old render, byte for byte.
   An entry: { ok: /pose regex/ (the poses it may show on; absent = every pose),
     pose(s,L,k)   optional: changes the frame's layout before anything is drawn (a small head tilt, chin up, ears); keep it small so the head stays on the neck,
     pre(s,LX,k)   optional: changes LX (a copy of L with its own LX.face) for the face pass only: LX.face.eyes / mouth / brow, LX.blush, LX.tear stays 0,
     eye(h,s,LX,x,y,r,i,bc)  optional: draws eye i (0 = far, 1 = near) itself at canvas (x,y), radius r, bc = light brow colour on dark heads; return true when drawn,
     mouth(h,s,LX,M,sf,N)    optional: draws the mouth itself (M maps nose-local px, sf = head scale); return true when drawn,
     face(h,s,LX,HT)          optional: extras over the face (cheeks, a puff, a drop of bath water), still under glasses, hats and the front ears,
     fx(h,s,L,B,HT)           optional: marks round the dog on the top layer (a ?, sparkles, speed lines); not drawn by dogHead }
   The face is drawn again on its own kit (exSub), so every other layer keeps its crayon wobble whether an expression is on or off. */
const EXPR_LIST=['sleepy','surprised','curious','hearts','proud','guilty','sneeze','blep','zoomies','pout','dreamy','wow','wink','yum'];
const EX_AWAKE=/^(idle|happy|pet|walk|jump|sit|crouch|shake|cold|hot|dig|beg|paw|down|dance|bow|scratch|sniff|dirty)$/;
const EXPR={};EXPR_LIST.forEach(n=>{EXPR[n]={ok:EX_AWAKE}});// placeholders until ART A / ART B fill them in
function exOk(n,pose,age){const X=typeof n==='string'&&Object.prototype.hasOwnProperty.call(EXPR,n)?EXPR[n]:null;return X&&age!=='newborn'&&(!X.ok||X.ok.test(pose))?n:null}
function exSub(h,sd,fn){const g=kit(rng(sd>>>0));g.setJ(h.getJ());g.cy=h.cy;fn(g);g.acc.forEach(a=>h.acc.push(a));g.texts.forEach(t=>h.texts.push(t));for(let i=0;i<2;i++){h.bb[i]=Math.min(h.bb[i],g.bb[i]);h.bb[i+2]=Math.max(h.bb[i+2],g.bb[i+2])}}
function exFace(h,s,L,HT,X,k,xa,seed){// drop the face just drawn (h's random stream has already moved past it), draw the expression's face on its own kit
  const pb=h.bb.slice();// the plain face's box: the fit stays where it was, so a dog never changes size when a face starts
  h.acc.length=xa[0];h.texts.length=xa[1];for(let i=0;i<4;i++)h.bb[i]=xa[2][i];
  const LX=Object.assign({},L,{face:{...L.face},ex:X}),ff=(s.mixHead?SP[s.mixHead]:s).faceFn;if(X.pre)X.pre(s,LX,k);
  exSub(h,seed*5+k*977+11,g=>{drawFace(g,s,LX,HT);if(ff)ff(g,s,LX,HT,0);if(X.face)X.face(g,s,LX,HT)});
  for(let i=0;i<4;i++)h.bb[i]=pb[i];
}
/* ---------- v2.13 expressions: ART A (sleepy, surprised, curious, hearts, proud, guilty, sneeze) ---------- */
// XA: ART A helpers. Lines on the face use the light brow colour on any dark head (bc, or a pale crayon when the breed has none).
// fx marks stay inside the canvas and leave the fit box alone (exSub would merge their bounds), so an expression never shrinks or moves the dog.
const XA={
  c:(s,bc)=>bc||(lum(s.hcol)<.32?'#CFC6C0':INK),
  eyes:(s,L)=>{const f=L.face,hx=s.head.rx,hy=s.head.ry,e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],HT=T(L.hT);return[HT([hx*e0[0],hy*e0[1]]),HT([hx*e1[0],hy*e1[1]])]},
  white:(h,x,y,rx,ry)=>h.shape(circ(x,y,rx,ry||rx*1.05,12),W,{ox:0,oy:0,sc:1,w:2.3,amp:.45,closed:1,famp:.25}),
  pupil:(h,s,i,x,y,p)=>{const ir=s.irises?s.irises[i]:s.iris;if(ir){h.dot(x,y,p*1.2,p*1.26,ir);h.dot(x,y,p*.6,p*.63)}else h.dot(x,y,p,p*1.05)},
  up:(L,a)=>a[L.k||0]||0,
  cl:(x,y,w,ht)=>[Math.max(6,Math.min(x,234-w)),Math.max(ht+5,y)],
  text:(h,t,x,y,z,rt,b)=>{const q=XA.cl(x,y,z*.7*t.length,z);if(!b)return h.text(t,q[0],q[1],z,INK,rt);// b: bold, the hand font laid down three times a hair apart (text stays readable when the dog faces left)
    const x0=q[0]+h.J(1.2),y0=q[1]+h.J(1),r0=rt+h.J(3),d=Math.max(.7,z*.035),e=Math.max(1.5,z*.085),P=(o,col)=>h.texts.push({s:t,x:x0+o[0],y:y0+o[1],size:z,col,rt:r0});
    [[-e,0],[e+d,0],[d*.5,-e],[d*.5,e+d],[-e*.7,-e*.7],[e*.7+d,-e*.7],[-e*.7,e*.7+d],[e*.7+d,e*.7+d]].forEach(o=>P(o,XA.paper));// a paper-coloured rim, so the word reads on any coat, ear or hat
    [[0,0],[d,0],[d*.5,d]].forEach(o=>P(o,INK));h.tr(x0-2,y0-z);h.tr(x0+z*.7*t.length,y0+4)},
  paper:'#FBF5E8',
  // where a word goes by the face, clear of the head, ears and hat brims: in front of the head front or the nose (whichever is further), at nose level (lv 0)
  // or above it (lv 1); when that runs off the canvas, under the nose instead. Returns the word's bottom left.
  say(s,HT,t,z,lv,u){const hx=s.head.rx,hy=s.head.ry,n=HT(noseLocal(s)),f=HT([hx*1.05,lv?-hy*.85:hy*.1]),w=z*.62*t.length,x=Math.max(f[0],n[0])+5;
    if(x+w<=236)return[x,(lv?Math.min(f[1],n[1]-16):n[1]+z*.45)-u];const ch=Math.max(HT([hx*.3,hy*1.02])[1],n[1]+hx*.85);
    if(ch+z*.8<=GY-4)return[n[0]-w*.5,ch+z*.8-u];return[236-w,Math.min(HT([hx*1.05,-hy*.85])[1],n[1]-16)-u]},// under the chin and the tongue; no room there (a bow): up over the muzzle
  star:(cx,cy,R)=>{const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?R*.45:R;p.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}return p},
  fr:(s,HT,dy)=>HT([s.head.rx*1.15,-s.head.ry*dy]),// a spot in front of the face, clear of the ears and hats
  // a crayon "!" drawn as thick marks (bolder than the hand font at game size, and it reads the same when the dog faces left); (x,y) = bottom left, z = height, kept inside the canvas
  bang(h,x,y,z,a){const q=XA.cl(x,y,z*.62,z),o=[q[0],q[1]],m=P=>P.map(p=>{const r2=rot([p[0]*z,p[1]*z],a||0);return[o[0]+r2[0],o[1]+r2[1]]}),w=Math.max(2.6,z*.13);
    h.shape(m([[.06,-1],[.3,-1],[.22,-.32],[.14,-.32]]),INK,{w:w*.6,ox:0,oy:0,sc:1,closed:1,amp:.4});const d=m([[.18,-.08]])[0];h.dot(d[0],d[1],z*.09,z*.09)},
  tilt:(s,L,da)=>{const q=[-s.head.rx*.2,s.head.ry*.35],p0=T(L.hT)(q);L.hT.a+=da;const p1=T(L.hT)(q);L.hT.x+=p0[0]-p1[0];L.hT.y+=p0[1]-p1[1];if(da>0)L.neckT=1},// turn the head about its neck join, so it stays on the body; a forward tip draws the neck tube too
  free:g=>{g.bb[0]=g.bb[1]=1e9;g.bb[2]=g.bb[3]=-1e9},// the fx marks do not count for the fit
  mouth:(s,keep)=>s.face.grinA||s.face.mouth==='sammy'||(keep&&s.face.mouth==='grin')
};
// sleepy: heavy half-lids over the lower half of each eye, a small yawn "o", a tiny "z" drifting up
EXPR.sleepy={ok:/^(idle|sit|down|walk|crouch|dirty)$/,
  pose(s,L){XA.tilt(s,L,4)},
  pre(s,LX){LX.face.eyes='down'},
  eye(h,s,L,x,y,r,i,bc){const c=XA.c(s,bc),o=i?1:-1,y0=y+r*.28,P=[];for(let j=0;j<=8;j++){const a=.28+j/8*(Math.PI-.56);P.push([x+Math.cos(a)*r,y+Math.sin(a)*r*1.05])}
    h.shape(P,W,{ox:0,oy:0,sc:1,w:2.3,amp:.45,closed:1,famp:.25});XA.pupil(h,s,i,x+r*.05,y+r*.66,r*.33);
    h.line([[x-o*r*1.2,y0+r*.05],[x+o*r*.1,y0-r*.2],[x+o*r*1.25,y0+r*.2]],4.6,c);h.line([[x-r*.7,y+r*1.45],[x,y+r*1.62],[x+r*.7,y+r*1.45]],1.8,c,.3);return true},
  mouth(h,s,L,M){const z=[1,1.2,1.1][L.k||0];h.shape(circ(-4,13,4.4*z,5.6*z,9).map(q=>M(q)),'#7A1F2E',{w:2.8,ox:0,oy:0,sc:1,closed:1});const p=M([-4,13+3.6*z]);h.dot(p[0],p[1]-1,2.4*z,1.5*z,'#FF6F9A');return true},
  fx(h,s,L,B,HT){const hx=s.head.rx,hy=s.head.ry,c=HT([hx*1.1,-hy*.6]),u=XA.up(L,[0,4,8]);XA.text(h,'z',c[0]+6,c[1]-u,17,-10,1);XA.text(h,'Z',c[0]+16,c[1]-14-u*.6,22,-14,1);XA.free(h)}};
// surprised: big round eyes with small pupils, brows up high, a small "o" mouth, a "!"
EXPR.surprised={ok:/^(idle|sit|walk|jump|sniff|dig|crouch|down|paw|beg|dirty|bow)$/,
  pose(s,L){if(L.ears==='norm')L.ears='perk'},
  pre(s,LX){LX.face.eyes='x'},// 'x': the breed's faceFn leaves the eyes alone (no chow lids, no eye rings) so the big eyes show
  eye(h,s,L,x,y,r,i,bc){const c=XA.c(s,bc),E=XA.eyes(s,L),d=Math.hypot(E[1][0]-E[0][0],E[1][1]-E[0][1]),g=Math.min(Math.max(r*.32,2.2),Math.max(.6,(d-s.eyes[0]-s.eyes[1])/2+1.4)),R=r+g,yc=y-g*.35;
    XA.white(h,x,yc,R,R*1.08);XA.pupil(h,s,i,x+r*.06,yc+r*.04,Math.max(1.5,r*.27));
    h.line([[x-R*.95,yc-R-2],[x,yc-R-5.5],[x+R*.95,yc-R-2]],3.2,c);return true},
  mouth(h,s,L,M){const z=[1,1.15,1.05][L.k||0];h.shape(circ(-3,13,4*z,5.4*z,9).map(q=>M(q)),'#7A1F2E',{w:3,ox:0,oy:0,sc:1,closed:1});return true},
  fx(h,s,L,B,HT){const c=XA.fr(s,HT,.45),u=XA.up(L,[0,3,1]);XA.bang(h,c[0]+4,c[1]-u,26,10);XA.bang(h,c[0]+15,c[1]-4-u,19,24);XA.free(h)}};
// curious: head tilted, the near brow up, the far eye a touch squinty, eyes up and forward, a small "hm", a crayon "?"
EXPR.curious={ok:/^(idle|sit|walk|sniff|down|crouch|beg|paw|dig|bow|dirty)$/,
  pose(s,L){if(/^(idle|sit|walk|down|paw|beg|dirty)$/.test(L.pose))XA.tilt(s,L,9);if(L.ears==='norm')L.ears='perk'},
  pre(s,LX){LX.face.eyes='x'},
  eye(h,s,L,x,y,r,i,bc){const c=XA.c(s,bc),R=r*(i?1.12:.95),pr=(s.face.pupil||.57)*r;XA.white(h,x,y,R);XA.pupil(h,s,i,x+R*.24,y-R*.2,pr);h.dot(x+R*.24-pr*.35,y-R*.2-pr*.45,pr*.35,pr*.35,W);
    if(i)h.line([[x-R*1.15,y-R*1.5],[x,y-R*2.3],[x+R*1.2,y-R*1.7]],3.2,c);else h.line([[x-R*1.2,y-R*1.15],[x+R*1.2,y-R*1.35]],3.4,c);return true},
  mouth(h,s,L,M){if(XA.mouth(s))return false;h.line([[-16,9],[-11,11],[-6,9],[-2,10.5]].map(M),3.4);return true},
  fx(h,s,L,B,HT){const c=XA.fr(s,HT,.5),u=XA.up(L,[0,3,1]);XA.text(h,'?',c[0]+4,c[1]-u,36,12,1);XA.free(h)}};
// hearts: pink heart eyes, blush, a happy open mouth, little hearts floating up
EXPR.hearts={ok:/^(idle|pet|sit|happy|down|beg|paw|walk|dance|bow|scratch)$/,
  pre(s,LX){LX.face.eyes='happy';LX.blush=1;if(!XA.mouth(s,1))LX.face.mouth='tongue'},
  eye(h,s,L,x,y,r){const z=Math.max(5.8,r*1.08,s.head.rx*.2),yc=y-z*.17;
    if(lum(s.hcol)<.32){const P=[];for(let j=0;j<16;j++){const t=j/16*Math.PI*2;P.push([x+z*1.3*Math.pow(Math.sin(t),3),yc-z*.081*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))])}h.shape(P,'#FFE3EC',{noline:1,ox:0,oy:0,sc:1})}// a pale rim on a dark head
    h.heart(x,yc,z,'#FF4F7B');h.dot(x-z*.42,y-z*.42,z*.16,z*.16,W);return true},
  fx(h,s,L,B,HT){if(L.hearts||L.hope)return;const hx=s.head.rx,hy=s.head.ry,c=HT([0,0]),u=XA.up(L,[0,5,10]),a=XA.cl(c[0]-hx*1.25,c[1]-hy*1.15-u,8,8),b=XA.cl(c[0]+hx*.95,c[1]-hy*1.5-u*.6,6,8);
    h.heart(a[0],a[1],7,'#FF4F7B');h.heart(b[0],b[1],5,'#FF8FB1');XA.free(h)}};
// proud: chin up, eyes shut in happy arcs, a smug smile, a little "ta-da" star
EXPR.proud={ok:/^(idle|sit|happy|paw|bow|dance|walk|beg|dirty|dig)$/,
  pose(s,L){if(/^(idle|sit|happy|paw|walk|beg|dirty)$/.test(L.pose))XA.tilt(s,L,-8);if(L.ears==='norm')L.ears='perk'},
  pre(s,LX){LX.face.eyes='happy';if(!XA.mouth(s,1))LX.face.mouth='smirk'},
  eye(h,s,L,x,y,r,i,bc){const c=XA.c(s,bc);h.line([[x-r*1.05,y+r*.3],[x,y-r*.6],[x+r*1.05,y+r*.3]],4.4,c);if(i)h.line([[x-r*.9,y-r*1.75],[x+r*1.1,y-r*2.15]],3,c);return true},
  fx(h,s,L,B,HT){const c=XA.fr(s,HT,.75),n=HT(noseLocal(s)),u=XA.up(L,[0,3,5]),x=Math.max(c[0],n[0]+2)+13,q=XA.cl(x,Math.min(c[1],n[1]-14)-u-Math.max(0,x-214)*1.1,20,14);// no room in front of a long muzzle: the star goes up over it
    h.shape(XA.star(q[0],q[1],12),'#FFD23F',{w:3,ox:0,oy:0,sc:1,closed:1,amp:.5,step:6});h.shape(XA.star(q[0]+17,q[1]+9,6),'#FFE57A',{w:2.4,ox:0,oy:0,sc:1,closed:1,amp:.4,step:5});
    [[15,-10,21,-15],[-15,-9,-21,-13],[3,-17,4,-23]].forEach(o=>h.line([[q[0]+o[0],q[1]+o[1]],[q[0]+o[2],q[1]+o[3]]],2.4,PEN));
    XA.text(h,'ta-da!',q[0]-8,q[1]-20,18,-8,1);XA.free(h)}};
// guilty: side-eyes under a low lid, soft worried brows, a sheepish wavy smile, a crumb of dirt on the nose, a small "oops"
EXPR.guilty={ok:/^(idle|sit|dig|down|crouch|dirty|walk|sniff)$/,
  pose(s,L){if(/^(norm|perk)$/.test(L.ears)&&/^(prick|tall|giant|bat|semi)$/.test(s.ears))L.ears='flat';if(/^(idle|sit|walk|dirty|down)$/.test(L.pose))XA.tilt(s,L,4)},// ears back (the standing ones; drop ears already hang)
  pre(s,LX){LX.face.eyes='x'},
  eye(h,s,L,x,y,r,i,bc){const c=XA.c(s,bc),pr=(s.face.pupil||.57)*r*.85,inner=i===0?1:-1,R=r*1.05;XA.white(h,x,y,R);XA.pupil(h,s,i,x-R*.42,y-R*.22,pr);h.dot(x-R*.42-pr*.3,y-R*.22-pr*.4,pr*.3,pr*.3,W);
    h.line([[x-R*1.15,y-R*1.3-(inner<0?R*.75:0)],[x+R*1.15,y-R*1.3-(inner>0?R*.75:0)]],3,c);return true},
  mouth(h,s,L,M){h.line([[-17,8],[-13,11],[-9,8.5],[-5,11],[-1,8.5],[3,5.5]].map(M),3.4);[[-2,-5,1.9],[3,-3,1.5],[-20,12,1.6]].forEach(q=>{const p=M([q[0],q[1]]),z=q[2]*s.head.rx/33;h.dot(p[0],p[1],z+.6,z,'#9A6A3E')});return true},
  fx(h,s,L,B,HT){const q=XA.say(s,HT,'oops',19,0,XA.up(L,[0,2,1]));XA.text(h,'oops',q[0],q[1],19,-6,1);XA.free(h)}};
// sneeze: eyes squeezed shut > <, a scrunched nose, an open "achoo" mouth, a puff with a flower and bubbles, "achoo!"
EXPR.sneeze={ok:/^(idle|sit|sniff|walk|down|dig|dirty|paw|crouch)$/,
  pose(s,L){if(/^(idle|sit|walk|down|paw|dirty)$/.test(L.pose))XA.tilt(s,L,5)},
  pre(s,LX){LX.face.eyes='closed'},
  eye(h,s,L,x,y,r,i,bc){const c=XA.c(s,bc),d=i?-1:1;h.line([[x-d*r*.95,y-r*.8],[x+d*r*.8,y],[x-d*r*.95,y+r*.8]],3.9,c);return true},
  mouth(h,s,L,M){const c=XA.c(s);[0,1,2].forEach(j=>h.line([[-7-j*5,-6],[-5-j*5,-9.5],[-3-j*5,-6]].map(M),2.2,c,.3));
    h.shape([[-16,5],[3,4],[0,15],[-12,16]].map(M),'#7A1F2E',{w:3.2,ox:0,oy:0,sc:1});h.shape([[-11,12],[-2,11.5],[-3,15],[-10,15]].map(M),'#FF6F9A',{noline:1,ox:0,oy:0});return true},
  fx(h,s,L,B,HT){const hx=s.head.rx,hy=s.head.ry,n=HT(noseLocal(s)),z=[.9,1.1,1][L.k||0],px=Math.min(Math.max(n[0]+8,HT([hx*.98,hy*.15])[0]+2),200),py=Math.max(30,Math.min(n[1]+2,GY-16));
    h.shape(scallop(px+11,py,14*z,10*z,6,.28),'#F2FAFF',{w:2.8,ox:0,oy:0,sc:1,closed:1,amp:.6,step:5});
    const f=[px+24,py-13];[0,1,2,3,4].forEach(j=>{const a=j*1.2566+.3;h.dot(f[0]+Math.cos(a)*4,f[1]+Math.sin(a)*4,3,3,'#FF8FB1')});h.dot(f[0],f[1],2.2,2.2,'#FFD23F');
    [[px+27,py+9,3.4],[px+5,py-14,2.6],[px+32,py-1,2]].forEach(b=>h.shape(circ(b[0],b[1],b[2]*z,b[2]*z,8),W,{w:1.8,ox:0,oy:0,sc:1,closed:1,amp:.3}));
    const t=HT([hx*.25,-hy*1.25]);XA.text(h,'achoo!',t[0]-30,t[1]-XA.up(L,[0,3,1]),18,-8,1);XA.free(h)}};
/* ---------- ART A end ---------- */
/* ---------- v2.13 expressions: ART B (blep, zoomies, pout, dreamy, wow, wink, yum) ---------- */
// Helpers are xb-prefixed. Tongues use the pose palette (#FF6F9A / #C9406A), so the chow's faceFn still turns them blue-black. An eye hook that draws
// the whole eye sets LX.face.eyes='x' in pre: drawFace skips its brow, and the chow lids and the dark-coat eye rings (faceFn) stay off that eye.
const XB_PK='#FF6F9A',XB_PKD='#C9406A',XB_MO='#7A1F2E',XB_DROP='#9EDCFF',XB_LIP='#F2849F',XB_YEL='#FFE14D';
function xbSurf(s){const f=s.face,c=f.snout===1?(f.snoutK&&s[f.snoutK])||s.light:f.snout===3?maskCol(s):s.hcol;return c||s.hcol}// the colour under the mouth
function xbLine(s){const c=xbSurf(s);return lum(c)<.3?mix(c,W,.62):INK}// the mouth line: ink, or a pale line on a dark muzzle
function xbEyeO(h,s,x,y,r,i,o){// an open eye drawn the way drawFace draws it, with its own size (k), pupil size (p) and look (lx, ly)
  const R=r*(o.k||1),pk=o.p||1,px=x+(o.lx||0)*R*.4,py=y+(o.ly||0)*R*.4,ir=s.irises?s.irises[i]:s.iris,pr=(s.face.pupil||.57)*pk;
  h.shape(circ(x,y,R,R*1.05,12),W,{ox:0,oy:0,sc:1,w:2.3,amp:.45,closed:1,famp:.25});
  if(ir){h.dot(px,py,R*.68*pk,R*.72*pk,ir);h.dot(px,py,R*.34*pk,R*.36*pk)}else h.dot(px,py,R*pr,R*(pr+.03));
  h.dot(px-R*.2*pk,py-R*.26*pk,R*.2*pk,R*.2*pk,W);h.dot(px+R*.2*pk,py+R*.22*pk,R*.09,R*.09,W)}
function xbEyeH(h,s,x,y,r,i,o){// a half-shut eye: the white under a thick lid line (o.up: lid height in r, o.lx: look, o.arc: a soft droopy lid, o.bc: line colour)
  const y0=y-r*(o.up||0),a0=Math.asin(Math.max(-.9,Math.min(.9,(y0-y)/r))),P=[];for(let j=0;j<=8;j++){const a=a0+(Math.PI-2*a0)*j/8;P.push([x+Math.cos(a)*r,y+Math.sin(a)*r*1.05])}
  h.shape(P,W,{ox:0,oy:0,sc:1,w:2.3,amp:.4,closed:1,famp:.2});
  const ir=s.irises?s.irises[i]:s.iris,pr=Math.min(r*.5,(y+r-y0)*.4),px=x+(o.lx||0)*r*.42,py=Math.min(y+r*.98-pr,(y0+y+r)/2+r*.08);
  if(ir){h.dot(px,py,pr*1.2,pr*1.15,ir);h.dot(px,py,pr*.6,pr*.6)}else h.dot(px,py,pr,pr*1.05);h.dot(px-pr*.4,py-pr*.3,pr*.34,pr*.34,W);
  if(o.arc)h.line([[x-r*1.2,y0+r*.32],[x-r*.55,y0-r*.08],[x+r*.55,y0-r*.08],[x+r*1.2,y0+r*.32]],3.8,o.bc);
  else h.line([[x-r*1.2,y0],[x+r*1.2,y0]],4,o.bc)}
function xbStar(h,x,y,z,n,fill,w){// a crude crayon star: n=5 a star, n=4 a sparkle
  const P=[];for(let j=0;j<n*2;j++){const a=j/(n*2)*Math.PI*2-Math.PI/2,rr=j%2?z*(n===4?.34:.46):z;P.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr])}
  h.shape(P,fill,{w:w||2.4,ox:0,oy:0,sc:1,closed:1,amp:.45,famp:.25,step:40})}
function xbBub(h,x,y,r){h.shape(circ(x,y,r,r,9),'#DDF3FF',{w:1.9,ox:0,oy:0,sc:1,closed:1,amp:.35,famp:.2});h.dot(x-r*.36,y-r*.36,r*.26,r*.22,W)}
const xbCl=(v,a,b)=>Math.max(a,Math.min(b,v));
const xbSay=(h,s,HT,w,up,k)=>{// a short crayon word by the face in the ART A bold hand: up = above the front of the head, else in front of the nose (XA.say)
  const q=XA.say(s,HT,w,18,up?1:0,[0,3,1][k||0]);XA.text(h,w,q[0],q[1],18,-8,1)};
// blep: a blank happy stare, the mouth shut and just the tip of the tongue poking out
EXPR.blep={ok:/^(idle|pet|walk|sit|down|paw|beg|bow|crouch|dirty)$/,
  pre(s,LX){LX.face.eyes=LX.face.eyes==='happy'?'happy':'open';LX.face.brow=0},
  mouth(h,s,L,M){h.shape([[-14,8],[1.6,8],[2.3,19],[-5.5,26],[-13.3,19]].map(M),XB_PK,{w:3.2,ox:0,oy:0,sc:1,closed:1});h.line([[-5.6,10],[-5.6,20]].map(M),2.4,XB_PKD);
    h.line([[-17,6],[-11,10],[-5.5,8.6],[0,10],[4.5,5.5]].map(M),3.8,xbLine(s));return true},
  fx(h,s,L,B,HT){xbSay(h,s,HT,'blep',0,L.k);XA.free(h)}};
// zoomies: huge eyes, the biggest open grin with the tongue flapping back, speed lines and dust behind
EXPR.zoomies={ok:/^(idle|happy|walk|jump|bow|dance)$/,
  pre(s,LX){LX.face.eyes='x'},
  eye(h,s,L,x,y,r,i,bc){bc=XA.c(s,bc);xbEyeO(h,s,x,y,r,i,{k:i?1.24:1.14,p:.66,lx:.6,ly:-.2});h.line([[x-r*.95,y-r*1.7],[x,y-r*2.15],[x+r*.95,y-r*1.8]],2.8,bc);return true},
  mouth(h,s,L,M){const w=[0,4,-3][L.k||0];
    h.shape([[-22,3],[-8,5.5],[7,1],[3,15],[-6,21],[-18,16]].map(M),XB_MO,{w:3.6,ox:0,oy:0,sc:1});
    const q=L.pose==='bow'?.5:1,T2=p=>M([p[0],12+(p[1]-12)*q]);// bowing: the head is near the ground, so the tongue flaps back, not down
    h.shape([[-16,12],[-7,15],[-15,26+w],[-28,29+w],[-33,22+w],[-24,16]].map(T2),XB_PK,{w:3,ox:0,oy:0,sc:1,closed:1});h.line([[-13,15],[-25,24+w]].map(T2),2.2,XB_PKD);
    h.line([[-19,4.5],[-18,9]].map(M),2.4,W);h.line([[3.5,2.5],[2.5,7]].map(M),2.4,W);return true},
  fx(h,s,L,B,HT){const b=s.body,k=L.k||0,o=[0,7,3][k],cl=v=>Math.max(6,v);
    [[-.6,24],[-.05,34],[.5,22]].forEach(q=>{const p=B([-b.rx*1.04,b.ry*q[0]]);h.line([[p[0]-6-o*.4,p[1]],[cl(p[0]-6-q[1]-o),p[1]+1]],3.2,PEN)});
    const ft=B([-b.rx*.75,b.ry]);[[0,0,6.5],[-12,-5,5],[-21,1,3.8]].forEach((c,j)=>{const x=cl(ft[0]-12+c[0]-o*.7),y=Math.min(GY-5,GY-6+c[1]);h.shape(circ(x,y,c[2]+(k===j?1.2:0),c[2]*.82,11,.12),'#F4ECDA',{w:2,ox:0,oy:0,sc:1,closed:1})});XA.free(h)}};
// pout: chin up, sulky half-lids glancing away, a puffed cheek, the lower lip pushed out, "hmph" (a comic sulk: the toy was taken)
EXPR.pout={ok:/^(idle|sit|down|crouch|dirty|beg)$/,
  pose(s,L){L.hT.a-=6},
  pre(s,LX){LX.face.eyes='x'},
  eye(h,s,L,x,y,r,i,bc){bc=XA.c(s,bc);xbEyeH(h,s,x,y,r,i,{up:.12,lx:-.65,bc});const o=i?-1:1;h.line([[x-o*r*1.15,y-r*1.4],[x+o*r*.2,y-r*1.6],[x+o*r*1.05,y-r*2.2]],2.8,bc);return true},// inner end up: a sulk
  mouth(h,s,L,M,sf){const S=xbSurf(s),c=M([-21,6]),R=9.5*sf,A=[];for(let j=0;j<=7;j++){const a=(70+j*25)*D2R;A.push([c[0]+Math.cos(a)*R,c[1]+Math.sin(a)*R*.9])}
    h.shape(circ(c[0],c[1],R,R*.9,12),mix(S,'#FF9EB5',.3),{noline:1,ox:0,oy:0,sc:1});h.line(A,3.2,INK,.5);h.line([[c[0]-R*.45,c[1]-R*.35],[c[0]-R*.1,c[1]-R*.55]],2.2,W,.2);
    h.shape([[-13,9.5],[-.5,9],[1.5,13.5],[-5,17.5],[-11.5,14.5]].map(M),XB_LIP,{w:3,ox:0,oy:0,sc:1,closed:1});
    h.line([[-17,13.5],[-13,9],[-6,7.5],[1,9]].map(M),3.6,xbLine(s));return true},
  fx(h,s,L,B,HT){const k=L.k||0,N=noseLocal(s),sf=s.head.rx/33,n=HT([N[0]+5*sf,N[1]]);
    [[-4,-3],[4,-1]].forEach(o=>h.line([[n[0]+4+k,n[1]+o[0]],[n[0]+11+k*2,n[1]+o[0]+o[1]]],2.2,PEN));xbSay(h,s,HT,'hmph',1,k);XA.free(h)}};
// dreamy: bath and brushing bliss, droopy content eyes, blush, a soft smile, bubbles floating up
EXPR.dreamy={ok:/^(idle|happy|pet|sit|down|shake|beg)$/,
  pre(s,LX){LX.face.eyes='x';LX.face.mouth='smile';LX.blush=1},
  eye(h,s,L,x,y,r,i,bc){bc=XA.c(s,bc);const R=Math.max(r,4.6);h.line([[x-R*1.15,y-R*.15],[x-R*.55,y+R*.42],[x+R*.55,y+R*.42],[x+R*1.15,y-R*.15]],4.2,bc);
    h.line([[x+R*1.05,y-R*.05],[x+R*1.6,y-R*.45]],2.4,bc,.3);h.line([[x+R*.75,y+R*.25],[x+R*1.25,y+R*.05]],2.2,bc,.3);return true},
  fx(h,s,L,B,HT){const k=L.k||0,hx=s.head.rx,hy=s.head.ry,c=HT([0,0]),up=[0,5,10][k],z=Math.max(.85,Math.min(1.25,hx/30));
    [[-1.3,-.95,8.5],[1.2,-1.25,7],[-.45,-1.75,5],[1.6,-.3,4.5],[-1.8,.2,5.5]].forEach((q,j)=>{const y=c[1]+q[1]*hy-up*(j%2?1:.6)-(j===k?3:0);xbBub(h,xbCl(c[0]+q[0]*hx,10,230),xbCl(y,10,GY-8),q[2]*z)});XA.free(h)}};
// wow: yellow star eyes, brows up, a big open "ooh" smile, chin up, sparkles round the head (a new place: Tokyo, Mt. Fuji)
EXPR.wow={ok:/^(idle|happy|walk|jump|sit|beg|paw|down)$/,
  pose(s,L){if(L.pose!=='jump')L.hT.a-=5},// chin up (not mid-jump: the head is at the top of the canvas there and would change the fit)
  pre(s,LX){LX.face.eyes='x'},
  eye(h,s,L,x,y,r,i,bc){bc=XA.c(s,bc);const z=Math.min(Math.max(r*1.5,7.5),s.head.rx*.38);xbStar(h,x,y,z,5,XB_YEL,2.6);h.line([[x-z*.42,y-z*.1],[x-z*.2,y-z*.4]],1.8,W,.2);
    h.line([[x-r*1.1,y-z-r*.9],[x,y-z-r*1.4],[x+r*1.1,y-z-r*.95]],2.8,bc);return true},
  mouth(h,s,L,M){h.shape([[-15,4],[-5,6],[4,3],[2,13],[-5,19],[-13,14.5]].map(M),XB_MO,{w:3.4,ox:0,oy:0,sc:1});h.shape([[-11,13.5],[-2,13.5],[-4,18],[-10,17.5]].map(M),XB_PK,{noline:1,ox:0,oy:0});return true},
  fx(h,s,L,B,HT){const k=L.k||0,hx=s.head.rx,hy=s.head.ry,c=HT([0,0]);
    [[-1.4,-.95,8],[1.3,-1.35,8.5],[0,-1.8,5.5],[1.65,.05,5.5]].forEach((q,j)=>{const z=q[2]*(j%3===k?1.25:.85);xbStar(h,xbCl(c[0]+q[0]*hx,12,228),xbCl(c[1]+q[1]*hy,12,GY-12),z,4,j%2?'#FFF3A0':XB_YEL,z<7?1.8:2.2)});XA.free(h)}};
// wink: the near eye shut in a squeezed arc with a lash, the far eye open under a raised brow, a cheeky grin, one glint by the wink
EXPR.wink={ok:/^(idle|sit|happy|paw|pet|walk|beg|bow|dance|down)$/,
  pre(s,LX){LX.face.eyes='x'},
  eye(h,s,L,x,y,r,i,bc){bc=XA.c(s,bc);
    if(i===1){const R=Math.max(r*1.1,5.6);h.line([[x-R*1.1,y+R*.2],[x-R*.3,y-R*.5],[x+R*.6,y-R*.3],[x+R*1.1,y+R*.25]],5.6,bc);h.line([[x+R*.95,y-R*.05],[x+R*1.6,y-R*.55]],2.6,bc,.3);
      h.line([[x-R*.8,y+R*.95],[x,y+R*1.15],[x+R*.8,y+R*.9]],2.4,bc,.3);return true}
    xbEyeO(h,s,x,y,r,i,{k:1.12,lx:.25,ly:-.05});h.line([[x-r*1.1,y-r*1.6],[x-r*.1,y-r*2.3],[x+r*1.1,y-r*1.9]],2.8,bc);return true},
  mouth(h,s,L,M){const c=xbLine(s);h.shape([[-16,5],[4,3.5],[1,12.5],[-5,15],[-12,12]].map(M),XB_MO,{w:3.2,ox:0,oy:0,sc:1});h.shape([[-10,11],[-1,10.5],[-2.5,14],[-8.5,14]].map(M),XB_PK,{noline:1,ox:0,oy:0});
    h.line([[-13.5,5],[-12.5,8.5]].map(M),2.4,W);h.line([[-20,1.5],[-16,5]].map(M),2.4,c,.3);h.line([[4,3.5],[8.5,-2.5]].map(M),3,c,.3);return true},
  fx(h,s,L,B,HT){const k=L.k||0,hx=s.head.rx,hy=s.head.ry,e=L.face.e1||[.42,-.1],r=s.eyes[1],p=HT([hx*e[0],hy*e[1]]),z=[12.5,15,11][k];
    xbStar(h,xbCl(p[0]+r*1.5+12,17,223),xbCl(p[1]-r*1.5-11,17,GY-17),z,4,XB_YEL,2.6);XA.free(h)}};
// yum: happy eyes, the tongue licking up round the front of the lip toward the nose, a drop of drool, "yum!"
EXPR.yum={ok:/^(idle|sit|beg|happy|paw|down|walk)$/,
  pre(s,LX){LX.face.eyes='happy'},
  mouth(h,s,L,M){const t=[0,2,-1.5][L.k||0];h.line([[-17,5],[-9,11],[0,9],[4,5]].map(M),3.8,xbLine(s));
    const Z=p=>M([2+(p[0]-2)*1.35,8+(p[1]-8)*1.35]),b0=h.bb.slice();h.shape([[-3,10],[5,8.5],[10.5,3.5+t],[12,-3+t],[8.5,-6.5+t],[5,-3+t*.5],[0,5]].map(Z),XB_PK,{w:3.2,ox:0,oy:0,sc:1,closed:1});h.line([[4,6.5],[8.5,-1.5+t]].map(Z),2.4,XB_PKD);b0.forEach((v,i)=>{h.bb[i]=v});// the curl stays out of the fit (a dog at the canvas edge keeps its size)
    if(!s.face.drool){const p=M([-14,12]);h.shape([[p[0],p[1]],[p[0]+3,p[1]+7],[p[0],p[1]+10],[p[0]-3,p[1]+7]],XB_DROP,{w:2,ox:0,oy:0,sc:1,closed:1})}return true},
  fx(h,s,L,B,HT){xbSay(h,s,HT,'yum!',1,L.k);XA.free(h)}};
/* ---------- ART B end ---------- */
/* ---------- rain (preview, art/rain-wet): PA.dog(key,{wet:true}) = the same dog, wet. No wet = the old render, byte for byte. ----------
   wetSpec: the coat a shade darker (every coat colour mixed a little toward a cool slate). bodyPts/headPts/drawRuff/drawPlume: fluff -> wetPts locks.
   wetFur: a few wet streaks down the fur and a pale shine on the back, inside the body or head outline. wetDrops: crayon raindrops sitting on the back
   and head, two falling off (they move down over the three frames and splash on the ground). dog(): a little puddle shine under the feet.
   Not wired yet. Wiring: dogOpts(d,o) (game/src/13_more_dogs.js) adds wet = outdoorsNow() && weatherNow()==='rain' && !hasRaincoat() (00_core.js);
   renderDog's cache key (03_yard.js) and the pack renders take it in; checkEnv (00_core.js) already redraws on a weather change. Preview shots: game/rain_yard_shot.js. */
const WET_C='#5A7A9A',WET_DROP='#9EDCFF',WET_RIM='#7FB3E0';
const wetC=c=>typeof c==='string'&&/^#[0-9a-fA-F]{6}$/.test(c)?mix(c,lum(c)<.3?'#161C26':WET_C,.13):c;// a shade darker (a dark coat toward ink, so it never turns paler)
// a kit that lays every colour a shade darker (white spotting and merle patches: their colours were fixed when the coat was made)
const wetH=h=>Object.assign({},h,{shape:(p,f,o)=>h.shape(p,f&&wetC(f),o),crayon:(rx,ry,M,c,n)=>h.crayon(rx,ry,M,wetC(c),n),line:(p,w,c,a)=>h.line(p,w,c&&c!==INK?wetC(c):c,a),dot:(x,y,rx,ry,f)=>h.dot(x,y,rx,ry,f&&wetC(f))});
function wetSpec(S0){const s=Object.assign({},S0),d=wetC;
  ['col','hcol','light','dark','ear','neckCol','tailTip','harl','bib','tan'].forEach(k=>{if(s[k])s[k]=d(s[k])});
  s.legs=Object.assign({},S0.legs);['col','sock','toe'].forEach(k=>{if(s.legs[k])s.legs[k]=d(s.legs[k])});
  if(S0.legs.cols){s.legs.cols={};Object.keys(S0.legs.cols).forEach(k=>{s.legs.cols[k]=d(S0.legs.cols[k])})}
  if(S0.pat)s.pat={body:(h,B,L)=>S0.pat.body(wetH(h),B,L),head:(h,HT,L)=>S0.pat.head(wetH(h),HT,L)};
  s.wet=1;return s}
function wetFur(h,s,M,head){// streaks that follow the fur down and back, and a wet shine; all well inside the outline (the part is open)
  const r=rng(hashS('wetf'+(s.name||'')+head)),rx=head?s.head.rx:s.body.rx,ry=head?s.head.ry:s.body.ry,c=head?s.hcol:s.col,lt=lum(c)>.45,
    K=lt?mix(c,'#35506E',.42):mix(c,W,.42),Sh=lt?W:mix(c,W,.62),y0=head?-.55:0,n=head?1:3;
  for(let i=0;i<n;i++){const x=head?-.42:-.5+i*.36+(r()-.5)*.08,y=head?-.5:-.6+(i%2)*.08,l=head?.3:.42+r()*.1,
    P=[[x,y],[x-.03,y+l*.35],[x+.02,y+l*.7],[x-.04,y+l]].map(q=>M([q[0]*rx,q[1]*ry]));h.line(P,head?1.9:2.2,K,.35)}
  const dk=lum(c)<.3,arc=(A,k,w)=>{const sp=[];for(let a=A[0];a<=A[1];a+=8){const t=a*D2R;sp.push(M([Math.cos(t)*rx*k,Math.sin(t)*ry*k*.94]))}h.line(sp,w,Sh,.3)};
  arc(head?[-150,-118]:[-128,-82],.66,(head?2:2.6)*(dk?1.3:1));// the wet shine; a dark coat gets a wider one and a second, so the wet reads on black
  if(dk)arc(head?[-160,-140]:[-150,-126],.44,head?1.8:2.2)}
function wetDrop(h,x,y,z,tilt){// one crayon raindrop: a round bottom and a point on top, inked, with a white glint inside
  const P=[];for(let i=0;i<=8;i++){const a=(-.12+i/8*1.24)*Math.PI;P.push([x+Math.cos(a)*z,y+Math.sin(a)*z])}P.push([x+(tilt||0)*z,y-z*1.95]);
  h.shape(P,WET_DROP,{w:2.1,step:30,ox:0,oy:0,sc:1,closed:1,amp:.35,famp:.2});h.dot(x-z*.32,y-z*.08,z*.26,z*.3,W)}
function wetDrops(h,s,L,B,HT,bp,hp,k,dryHead){
  const z=s.pup===2?4.4:s.pup?4.6:4.8,hc=HT([0,0]),hR=Math.max(s.head.rx,s.head.ry)*1.12,BP=dense(bp,true,3).map(B),HP=dense(hp,true,3).map(HT);
  const tops=(P,f,away)=>{const ys=P.map(p=>p[1]),y0=Math.min(...ys),y1=Math.max(...ys),c=P.filter(p=>p[1]<y0+(y1-y0)*f&&(!away||Math.hypot(p[0]-hc[0],p[1]-hc[1])>hR)).sort((a,b)=>a[0]-b[0]);return c};
  // sitting on the back (two, away from the head) and on the crown (one, toward the back of the skull)
  const bt=tops(BP,.24,1);[.18,.62].forEach((f,i)=>{const p=bt[Math.floor(f*(bt.length-1))];if(p)wetDrop(h,p[0],p[1]-z*.45,z*(i?.86:1),i?.15:-.1)});
  const ht=dryHead?[]:tops(HP,.16,0);{const p=ht[Math.floor(.5*(ht.length-1))];if(p)wetDrop(h,p[0],p[1]-z*.4,z*.82,.1)}
  // falling off: one from the chin (front, bottom of the head), one off the rump; frame k moves them down, the ground makes a little splash
  const chin=HP.reduce((a,p)=>p[0]+p[1]*1.4>a[0]+a[1]*1.4?p:a,HP[0]),rump=BP.reduce((a,p)=>p[0]-p[1]*.35<a[0]-a[1]*.35?p:a,BP[0]);
  [[chin,3,1],[rump,-4,0]].forEach(([p,dx,j])=>{if(!p)return;const kk=(k+j)%3,x=p[0]+dx*(1+kk*.5),y=p[1]+z*2.6+kk*9;
    if(y+z>GY-1){h.line([[x-7,GY-5],[x-3,GY-1]],1.9,WET_RIM,.2);h.line([[x+7,GY-5],[x+3,GY-1]],1.9,WET_RIM,.2);h.line([[x,GY-8],[x,GY-4]],1.9,WET_RIM,.2);return}
    wetDrop(h,x,y,z*.78,0);h.line([[x-1,y-z*2.6],[x-1,y-z*3.7]],1.7,WET_RIM,.2);h.line([[x+2.5,y-z*2.9],[x+2.5,y-z*3.6]],1.7,WET_RIM,.2)})}
function frame(key,s,pose,outfit,k,seed,ex){
  const h=kit(rng(seed+k*7717)),L=layout(s,pose,k);if(s.wet)h.wet=1;if(s.pup){h.setJ(s.pup===2?1.5:1.3);if(s.pup===2)newbornL(s,L)}const X=ex?EXPR[ex]:null;if(X&&X.pose)X.pose(s,L,k);if(pose==='rollover'||pose==='playdead')h.cy=GY+3;const _u=0,B=T(L.bT),HT=T(L.hT),hp=headPts(s),bp=bodyPts(s);
  const has=(slot)=>outfit&&outfit[slot]&&OUT[slot].includes(outfit[slot])?outfit[slot]:null;
  const body=has('body'),top=body&&TOP2[body]?body:null,neck=has('neck'),hat=top?null:has('head'),eyes=has('eyes'),feet=has('feet'),sheet=body==='Ghost Sheet'||body==='Trick-or-Treat Ghost';// v2.11.1: a costume with its own head piece (TOP2) drops the hat
  if(top==='Little Bat Costume'||top==='Dinosaur Hood'||top==='Polar Bear Hood'||top==='Penguin Suit')L.hood=1;// the dog's own ears stay inside the bat hood
  if(hat==='Astronaut Helmet'){if(L.ears!=='flat')L.ears=/^(giant|bat|tall)$/.test(s.ears)?'sleep':'norm';L.earFit=Math.max(s.head.rx,s.head.ry)*1.38}
  if(hat==='Year of the Sheep Hood'){L.hood=1;if(body==='Ghost Sheet')L.ghost=1}// v2.8: flop ears stay inside the hood, the hood draws the prick ears itself
  if(feet&&pose!=='sleep'&&pose!=='playdead'&&s.pup!==2)L.feet=feet;// v2.24: shoes (outfit.feet), drawn on each leg by drawLegs and drawHaunch; none asleep or playing dead (its legs lie tucked on the body), none on a newborn
  if(body==='Superhero Cape')drawCape(h,s,L,B);
  if(body&&BACK2[body])BACK2[body](h,s,L,B);
  drawTail(h,s,L,B);
  if(body==='Tutu'){h._legSkip='NH';drawLegs(h,s,L);h._legSkip=0}else drawLegs(h,s,L);
  // neck: a short tube from the chest to the head, behind the body
  {const nb=B([s.body.rx*.62,-s.body.ry*.3]),nh=HT([-s.head.rx*.2,s.head.ry*.35]);if(L.pose==='eat'||L.pose==='jump'||L.pose==='sit'||L.pose==='sad'||s.neck||L.neckT)h.tube([nb,nh],s.head.rx*.7,s.neckCol||s.col)}
  h.shape(bp.map(B),s.col,{step:s.body.long?14:11,closed:s.bodyShut});h.part(1);h.crayon(s.body.rx,s.body.ry,B,s.col,s.body.long?16:12);
  if(s.expecting&&BELLY.test(pose)){h.part(0);drawBelly(h,s,L,B)}// the belly bulges past the body on purpose; the marks still keep to the body
  if(s.marks)s.marks(h,B,HT,s);
  if(s.pat)s.pat.body(h,B,L);
  if(s.spk)glitter(h,s,B,k,0);
  if(s.wet)wetFur(h,s,B,0);
  h.part(0);
  if(L.scrunch)[-.45,-.1,.25].forEach(x=>h.line([[s.body.rx*x,-s.body.ry*.85],[s.body.rx*(x+.06),0],[s.body.rx*x,s.body.ry*.85]].map(B),2.6));
  if(L.mud)drawMud(h,s,L,B,HT);
  if(body&&body!=='Superhero Cape'&&body!=='Tutu'&&!sheet)drawCoat(h,s,L,B,body);
  if(body==='Superhero Cape')drawCapeTie(h,s,L,B);
  drawHaunch(h,s,L,B);
  if(body==='Tutu')drawCoat(h,s,L,B,body);
  if(L.paw){h._legPass='raised';drawLegs(h,s,L);h._legPass='ground'}
  if(s.ruff&&!sheet)drawRuff(h,s,L,HT);
  if(neck&&RUFF2[neck]&&!sheet&&top!=='Trick-or-Treat Ghost')RUFF2[neck](h,s,L,HT);// v2.17.1: a mane worn round the face (Lion Mane)
  if(neck&&NECKB[neck]&&top!=='Trick-or-Treat Ghost'){const st=h.r.st();NECKB[neck](h,s,L,HT);h.r.st(st)}// v2.29: a Bond collar tucks behind a lowered head (the dog's stream handed back)
  if(s.ruff&&body&&WING_OVER[body])wingOver(h);// a back costume's near wing sits over the mane
  const hmk=top&&HM_OWN.has(top);if(hmk&&L.hood)L.hmHood=1;// v2.18.1: drawEars hands the stream on as the plain dog's ears would
  if(!sheet)drawEars(h,s,L,HT,false);
  if(s.topknot&&!hat&&(!top||top==='Pumpkin Patch Suit')&&!(sheet&&s.topknot===3))drawTopknot(h,s,HT);// v2.12: the maltese and shihtzu tuft stays under the Ghost Sheet
  else if((hmk||KS_HAT.has(hat))&&s.topknot)hmPlain(h,()=>0,g=>drawTopknot(g,s,HT));// v2.24: and under the Bucket Hat// v2.18.1: the topknot stays under a market hat; the stream moves on as if it were drawn
  {const hf=s.hfluff===undefined?s.fluff:s.hfluff;h.shape(hp.map(HT),s.hcol,{step:hf?30:11,amp:hf?.8:1.2,closed:(s.mixHead?SP[s.mixHead]:s).headShut})};h.part(1);h.crayon(s.head.rx,s.head.ry*.6,p=>HT([p[0],p[1]-s.head.ry*.3]),s.hcol,6);
  if(s.headMarks)s.headMarks(h,HT,s);
  if(s.pat)s.pat.head(h,HT,L);
  if(s.spk)glitter(h,s,HT,k,1);
  if(s.wet)wetFur(h,s,HT,1);
  h.part(0);
  if(L.mud){const hx=s.head.rx,hy=s.head.ry;h.shape(circ(-hx*.45,-hy*.45,hx*.18,hy*.15,7,.2).map(HT),'#7A4A22',{noline:1,ox:0,oy:0})}
  const xa=X?[h.acc.length,h.texts.length,h.bb.slice()]:0;
  {const a0=h.acc.length;drawFace(h,s,L,HT);const ff=(s.mixHead?SP[s.mixHead]:s).faceFn;if(ff)ff(h,s,L,HT,a0)}// v2.12 ART B: the head breed's own face extras (new spec field faceFn)
  if(X)exFace(h,s,L,HT,X,k,xa,seed);
  if(eyes&&pose!=='sleep'&&!sheet)drawEyewear(h,s,L,HT,eyes);
  if(body==='Cozy Hoodie'&&/^(cold|sleep)$/.test(pose))drawHood(h,s,L,HT);
  if(!sheet)drawEars(h,s,L,HT,true);
  if(body==='Ghost Sheet'){drawGhost(h,s,L,B,HT);if(eyes&&pose!=='sleep')drawEyewear(h,s,L,HT,eyes)}
  if(neck&&top!=='Trick-or-Treat Ghost')drawNeck(h,s,L,HT,neck);
  if(hat)drawHat(h,s,L,HT,hat);
  else if(body==='Bumblebee Suit')HAT2.Antennae(h,s,L,HT);
  else if(body==='Pyjamas'&&outfit.sleepwear)HAT2.Nightcap(h,s,L,HT);
  if(top){TOP2[top](h,s,L,HT);if(top==='Trick-or-Treat Ghost'&&eyes&&pose!=='sleep')drawEyewear(h,s,L,HT,eyes)}
  if(outfit&&outfit.charm==='Crayon Medal'&&!sheet)drawMedalCharm(h,s,L,HT,neck);// v2.20: the only charm drawn on the dog
  if(s.wet)wetDrops(h,s,L,B,HT,bp,hp,k,hat==='Rain Hat'||hat==='Astronaut Helmet');
  drawFx(h,s,L,B,HT);
  if(X&&X.fx){h.acc.push('<g pointer-events="none">');exSub(h,seed*3+k*131+7,g=>X.fx(g,s,L,B,HT));h.acc.push('</g>')}// the marks round the dog never take a tap
  return {h,L};
}
// marks draw on both body and head; run them twice, once per layer (points mapped to NaN are skipped)
const NAN=()=>[NaN,NaN];
Object.keys(SP).forEach(k=>{const s=SP[k],m=s.marks;if(!m)return;s.marks=(h,B,HT,sp)=>m(h,B,NAN,sp);s.headMarks=(h,HT,sp)=>m(h,NAN,HT,sp)});

/* ---------- coat variants (v1.5A): recolour a breed spec; no coat = the original spec object ---------- */
const HEX=/^#[0-9a-fA-F]{6}$/,EYE={blue:'#3FA9F5',amber:'#E2A23A',brown:null};
function coated(key,coat,seed,S0){
  S0=S0||SP[key];if(!coat||typeof coat!=='object')return S0;
  if(S0.ownWhite&&!coat._own){const s1=coated(key,Object.assign({},coat,{white:0,_own:1}),seed,S0);S0.ownWhite(s1,+coat.white||0);return s1}// v2.21 ART B: the breed draws its own white (cavalier, jrt)
  const c=k=>HEX.test(coat[k]||'')?coat[k]:null,base=c('base'),light=c('light'),dark=c('dark'),white=+coat.white||0,merle=!!coat.merle;
  const s=Object.assign({},S0);s.legs=Object.assign({},S0.legs);
  if(key==='mutt'){// Pepper: white dog with base-coloured patches when piebald; otherwise a solid base dog
    const pc=base||S0.dark;if(white>=.6){s.dark=pc;s.legs.cols={NH:pc}}else{s.col=s.hcol=pc;s.dark=dark||pc;s.legs.cols=null;s.marks=null;s.headMarks=null}}
  else{if(base){s.col=s.hcol=base}
    if(light){s.light=light;if(S0.legs.col)s.legs.col=light;if(S0.legs.sock)s.legs.sock=light}
    if(dark&&S0.ear&&key!=='beagle')s.ear=dark;if(dark&&S0.dark)s.dark=dark;}
  if(coat.brindle)s.brindle=1;// v2.11 dane, mastiff: the brindle look (no other dog draws it)
  if(S0.tanHead&&light){if(S0.ear===S0.hcol)s.ear=light;s.hcol=light}// v2.12 yorkie: the head and ears are the coat's tan
  if(key==='dane'&&merle&&white>=.6){s.harl=base||'#2A2628';s.col=s.hcol='#FBF8F2';s.light=W}// v2.11 harlequin look: black merle patches on white
  const ey=coat.eyes;if(ey==='odd')s.irises=['#3FA9F5',null];else if(ey in EYE){s.iris=EYE[ey];s.irises=null}
  const R0=rng(hashS('coat'+key+String(seed==null?'':seed))),dots=[];
  const b=s.body,hd=s.head,Wt=W;
  // white spotting
  if(white>=.25&&!(key==='mutt'&&white>=.6)){if(!s.legs.sock&&!s.legs.col)s.legs.sock=Wt}
  if(white>=.6&&key!=='mutt'&&!s.harl){for(let i=0;i<3;i++)dots.push({w:1,b:1,x:(R0()-.5)*1.2,y:(R0()-.5)*.8,rx:.22+R0()*.18,ry:.45+R0()*.3});dots.push({w:1,h:1,x:-.4+R0()*.3,y:-.3+R0()*.2,rx:.38,ry:.42})}
  if(key==='mutt'&&white>=.6&&seed!=null){// reshuffle Pepper's patches per dog
    const sp=[];for(let i=0;i<3;i++)sp.push([(R0()-.5)*1.2,(R0()-.5)*.6,.2+R0()*.15,.45+R0()*.2]);const hp=[R0()>.5?.42:-.4,-.18,.42,.46];
    s.marks=(h,B,Hd,ss)=>{const K=ss.dark;sp.forEach(q=>h.shape(circ(b.rx*q[0],b.ry*q[1],b.rx*q[2],b.ry*q[3],10).map(B),K,{noline:1,ox:0,oy:0}));h.shape(circ(hd.rx*hp[0],hd.ry*hp[1],hd.rx*hp[2],hd.ry*hp[3],11).map(Hd),K,{noline:1,ox:0,oy:0})};
    s.headMarks=(h,HT,ss)=>s.marks(h,()=>[NaN,NaN],HT,ss)}
  // merle smudges: darker and lighter crayon patches over the base
  const sm=[];if(s.harl){for(let i=0;i<12;i++)sm.push({b:i<8,x:(R0()-.5)*1.4,y:(R0()-.5)*.9,rx:.12+R0()*.16,ry:.22+R0()*.3,col:i%4===3?mix(s.harl,W,.45):s.harl})}// torn black patches, a few grey
  else if(merle){const md=mix(s.col,'#2E2320',.45),ml=mix(s.col,'#FFFFFF',.5);for(let i=0;i<10;i++)sm.push({b:i<7,x:(R0()-.5)*1.3,y:(R0()-.5)*.9,rx:.13+R0()*.14,ry:.26+R0()*.28,col:i%2?ml:md})}
  if(white||merle){
    s.pat={
      body:(h,B,L)=>{
        if(white>=.25&&!(key==='mutt'&&white>=.6)){h.shape(circ(b.rx*.82,b.ry*.35,b.rx*.16,b.ry*.48,8).map(B),Wt,{noline:1,ox:0,oy:0});
          const tt=B([-b.rx*.86,-b.ry*.25]);}
        sm.filter(q=>q.b).forEach(q=>h.shape(circ(b.rx*q.x,b.ry*q.y,b.rx*q.rx,b.ry*q.ry,7,.25).map(B),q.col,{noline:1,ox:0,oy:0}));
        dots.filter(q=>q.b).forEach(q=>h.shape(circ(b.rx*q.x,b.ry*q.y,b.rx*q.rx,b.ry*q.ry,9,.2).map(B),Wt,{noline:1,ox:0,oy:0}));
        if(merle)h.crayon(b.rx,b.ry,B,mix(s.col,'#2E2320',.3),6)},
      head:(h,HT,L)=>{
        if(white>=.25&&!(key==='mutt'&&white>=.6))h.shape([[hd.rx*.12,-hd.ry*.98],[hd.rx*.3,-hd.ry*.98],[hd.rx*.34,hd.ry*.1],[hd.rx*.06,hd.ry*.1]].map(HT),Wt,{noline:1,ox:0,oy:0});
        sm.filter(q=>!q.b).forEach(q=>h.shape(circ(hd.rx*q.x*.7,hd.ry*q.y*.7-hd.ry*.2,hd.rx*q.rx*1.4,hd.ry*q.ry*.6,7,.25).map(HT),q.col,{noline:1,ox:0,oy:0}));
        dots.filter(q=>q.h).forEach(q=>h.shape(circ(hd.rx*q.x,hd.ry*q.y,hd.rx*q.rx,hd.ry*q.ry,9,.2).map(HT),Wt,{noline:1,ox:0,oy:0}))}
    };
    if(white>=.25)s.tailTip=Wt;
  }
  if(c('tan')&&(key==='collie'||key==='corgi')){s.tan=c('tan');if(key==='collie')s.legs.sock=s.tan;else s.legs.col=s.tan;s.legs.toe=Wt}// tan points (coat.tan, mods/genes.js TAN_ART): tan lower legs with white feet (the collie), tan legs with white feet (the corgi)
  if(S0.coatFn)S0.coatFn(s,coat,{white:+coat.white||0,merle,R:R0});// v2.21 ART A: a breed's own coat pass (new spec field coatFn: the aussie's merle and white trim)
  return s;
}
/* ---------- v2 looks: mixes, puppies, newborns (each returns a NEW spec; SP is never touched) ---------- */
function lookOf(o){const c=o&&o.coat&&typeof o.coat==='object'&&o.coat.look&&typeof o.coat.look==='object'?o.coat.look:{},m=o&&o.mix,cm=c.mix;
  const age=(o&&o.age)||c.age,head=(m&&typeof m==='object'?m.head:typeof m==='string'?m:null)||c.mixHead||(cm&&typeof cm==='object'?cm.head:null);
  return{age:age==='puppy'||age==='newborn'?age:null,head:head&&SP[head]?head:null,sparkle:!!((o&&o.sparkle)||c.sparkle),expecting:!!((o&&o.expecting)||c.expecting)}}
// head breed's skull, ears, muzzle and eyes on the body breed's body, legs and tail (coloured by the body palette)
function mixSpec(bk,hk){
  const B0=SP[bk],H0=SP[hk],s=Object.assign({},B0),hr=(B0.head.rx+H0.head.rx)/2/H0.head.rx,f=H0.face;
  s.head={x:B0.head.x-(f.snoutL?(f.snoutL-1)*H0.head.rx*hr*.35:f.snout?6:0)+(B0.face.snoutL?8:B0.face.snout?6:0),y:B0.head.y+(H0.ears==='giant'||H0.ears==='bat'?4:0),rx:H0.head.rx*hr,ry:H0.head.ry*hr};
  s.ears=H0.ears;s.eyes=H0.eyes.map(e=>e*Math.min(1.12,Math.max(.88,hr)));s.face=Object.assign({},f);
  if(f.snout&&!B0.face.snout){const sl=f.snoutL||1.5;s.face.snoutL=1+(sl-1)*.72;if(f.nose)s.face.nose=[1+(f.nose[0]-1)*.72,f.nose[1]]}// a mix blends the long muzzle a littles.iris=H0.iris;s.hfluff=!!H0.fluff;
  s.light=B0.light||H0.light;s.dark=B0.dark||H0.dark;s.hcol=B0.hcol;
  s.ear=H0.ear?(H0.ear===H0.dark?s.dark:mix(B0.col===W?'#E8D2B8':B0.col,PEN,.3)):undefined;
  s.marks=B0.marks;s.headMarks=H0.headMarks;s.mixHead=hk;
  if(NEWK.test(hk)||NEWK.test(bk)){// v2.5 keys only: the head breed brings its own head (fluff, iris, ear extras, topknot)
    s.hfluff=H0.hfluff===undefined?!!H0.fluff:!!H0.hfluff;s.iris=H0.iris;s.curlEar=H0.curlEar;s.topknot=H0.topknot;s.earS=H0.earS;s.earRound=H0.earRound;s.sqHead=H0.sqHead;
    if(H0.earIn||B0.earIn)s.earIn=H0.earIn;if(H0.earSwing||B0.earSwing)s.earSwing=H0.earSwing}// v2.12 art fix: the head breed's ear extras, never the body breed's
  return s;
}
// puppy (62%) and newborn (42%): drawn at adult scale with puppy proportions, then scaled down by pupScale in dog()
// PUPLEG: [share of the breed's own leg below the belly, + px, far-leg offset, walk swing, paw rx and lift (x leg width), least leg below the belly px]
var PUPLEG=[.38,2,16,.65,.62,.28,6.5];
function pupSpec(S0,age){
  const nb=age==='newborn',s=Object.assign({},S0),b=S0.body,hd=S0.head,lg=S0.legs,f=S0.face;
  const BK=b.long?(nb?.62:.72):(nb?.84:.9),HK=(nb?1.2:1.3)*(b.deep?1.18:1),legK=nb?.32:(b.deep?.56:.5),leg=GY-(b.y+b.ry*.42);
  s.body=Object.assign({},b,{rx:b.rx*BK,ry:b.ry*(b.deep?1.12:nb?1.08:1.04)});
  s.body.y=GY-s.body.ry*.42-leg*legK;s.body.x=b.x+(b.long?6:2);
  // puppy legs (owner, 7 Nov 2026: "the legs is bit weird"): legK of the hip height left 0-5 px of leg below the belly (none on the fluffy and
  // stocky breeds), so the paws sat in a pile under the body. A puppy (not a newborn) now shows a bit over half its breed's own leg below the belly.
  // Owner, 7 Nov 2026: stubby, but the paws never tuck back under a fluffy belly (golden, samoyed, chow): at least PUPLEG[6] px below its real outline.
  if(!nb){const lo=q=>Math.max(...bodyPts(q).map(p=>p[1])),bl=lo(s);s.body.y=Math.min(s.body.y,GY-bl-Math.max(PUPLEG[6],Math.min(s.body.ry,(GY-b.y-lo(S0))*PUPLEG[0]+PUPLEG[1])))}
  const rel=[hd.x-b.x,hd.y-b.y];
  s.head={rx:hd.rx*HK,ry:hd.ry*HK*(f.snoutL?1.12:1.04),x:s.body.x+rel[0]*(b.long?.62:.86)-(f.snout?hd.rx*.3:0),y:s.body.y+rel[1]*(b.deep?.62:.92)-hd.ry*(HK-1)*.55};
  s.legs=Object.assign({},lg,{h:lg.h*BK,f:lg.f*BK,w:lg.w*1.12});
  s.eyes=S0.eyes.map(e=>Math.min(e*HK*1.18,hd.rx*HK*.3));
  s.face=Object.assign({},f,{pupil:Math.min(.72,(f.pupil||.57)*1.12)});
  if(f.snout){const sl=f.snoutL||1.5;s.face.snoutL=1+(sl-1)*.45;if(f.nose)s.face.nose=[1+(f.nose[0]-1)*.45,f.nose[1]]}
  else if(f.nose)s.face.nose=[f.nose[0]*.92,f.nose[1]];
  s.tsc=(S0.tsc||1)*(nb?.5:.78);s.pup=nb?2:1;s.pupScale=nb?.5:.7;
  if(s.neck&&nb)s.neck=0;
  // centre the puppy on x=120 by its standing extents (tail root to nose)
  const l=s.body.x-s.body.rx-12,r=s.head.x+s.head.rx*(s.face.snoutL||1.05);s.pupDx=120-(l+r)/2;
  return s;
}
/* ---------- public API ---------- */
const POSES=['idle','happy','pet','eat','sleep','walk','jump','sit','sad','dirty','crouch','shake','cold','hot','dig','beg','squat','leglift','paw','down','rollover','playdead','speak','dance','bow','scratch','sniff','yawn','howl'];
const NBSLEEP=/^(sleep|sad|cold|hot|playdead|rollover|yawn|crouch|scratch|dirty|shake)$/;
function specFor(key,o){// the breed spec plus any v2 look; with no look this is exactly coated(key,coat,seed)
  const lk=lookOf(o),hk=lk.head&&lk.head!==key?lk.head:null,nu=!!(lk.age||hk||lk.sparkle||lk.expecting);
  if(!nu)return{s:coated(key,o&&o.coat,o&&o.seed),lk,nu};
  let S0=SP[key];if(hk)S0=mixSpec(key,hk);if(lk.age)S0=pupSpec(S0,lk.age);
  const s=Object.assign({},coated(key,o&&o.coat,o&&o.seed,S0));s.spk=lk.sparkle;s.expecting=lk.expecting&&lk.age!=='newborn';
  return{s,lk,nu};
}
function dog(key,o={}){
  key=SP[key]?key:'shiba';const SF=specFor(key,o),lk=SF.lk,s=o&&o.wet?wetSpec(SF.s):SF.s;
  let pose=POSES.includes(o.pose)?o.pose:'idle';const anim=o.anim!==false,nF=anim?3:1,left=o.facing==='left';
  if(lk.age==='newborn')pose=NBSLEEP.test(pose)?'sleep':'down';
  const ex=exOk(o.expr,pose,lk.age);// v2.13: a face expression over the pose (null = none: the render is exactly the old one)
  const seed=hashS('pa'+key+pose)*5+3;
  const fr=[];const bb=[1e9,1e9,-1e9,-1e9];
  for(let k=0;k<nF;k++){const f=frame(key,s,pose,o.outfit,k,seed,ex);fr.push(f);const b=f.h.bb;bb[0]=Math.min(bb[0],b[0]);bb[1]=Math.min(bb[1],b[1]);bb[2]=Math.max(bb[2],b[2]);bb[3]=Math.max(bb[3],b[3])}
  // keep everything inside the canvas: shrink around the feet anchor if anything pokes out (puppies: scale to size first)
  const ps=s.pupScale||1,pdr=ps===1?0:(s.pupDx||0)*ps,pdx=left?-pdr:pdr,bx=ps===1?bb:[120+(bb[0]-120)*ps+pdr,GY+(bb[1]-GY)*ps,120+(bb[2]-120)*ps+pdr,GY+(bb[3]-GY)*ps];
  const m=3,sc=Math.min(1,(GY-m)/(GY-bx[1]),(120-m)/(120-bx[0]),(240-m-120)/(bx[2]-120),bx[3]>GY?(199.5-GY)/(bx[3]-GY):1),tot=sc*ps;
  const fit=tot<.999?` transform="translate(${pdx?R1(120+pdx*sc):120} ${GY}) scale(${tot.toFixed(3)}) translate(-120 -${GY})"`:'';
  const L0=fr[0].L,shx=pose==='sleep'?L0.bT.x+12:L0.bT.x+8,shw=(s.body.rx*(pose==='jump'?.7:1.15)+(pose==='sleep'?20:0));
  const shy=pose==='jump'?3.5:6;let hd='';for(let x=-shw+3;x<shw-2;x+=5.5){const t=x/shw,half=shy*Math.sqrt(Math.max(0,1-t*t));if(half<1)continue;hd+=`M${R1(shx+x)} ${R1(GY+1.5+half*.9)}l4 ${R1(-half*1.8)}`}
  const shadow=(s.wet&&pose!=='jump'?wetPuddle(shx,shw):'')+`<ellipse cx="${R1(shx)}" cy="${GY+1.5}" rx="${R1(shw)}" ry="${shy}" fill="${PEN}" opacity="${pose==='jump'?.06:.1}"/><path d="${hd}" stroke="${PEN}" stroke-width="1.3" stroke-linecap="round" opacity="${pose==='jump'?.25:.4}" fill="none"/>`;
  let frames='';
  fr.forEach((f,k)=>{
    const tx=f.h.texts.map(t=>{const x=left?240-t.x-t.size*.6*t.s.length:t.x;return `<text x="${R1(x)}" y="${R1(t.y)}" transform="rotate(${R1(left?-t.rt:t.rt)} ${R1(x)} ${R1(t.y)})" font-family="'Gloria Hallelujah',cursive" font-size="${t.size}" fill="${t.col}">${t.s}</text>`}).join('');
    frames+=`<g class="pa-d-f${k}">${left?`<g transform="translate(240 0) scale(-1 1)">${f.h.acc.join('')}</g>`:f.h.acc.join('')}${tx}</g>`;
  });
  if(s.pup){const SW=s.pup===2?1.5:1.3;frames=frames.replace(/stroke-width="([\d.]+)"/g,(q,v)=>`stroke-width="${R1(v*SW)}"`).replace(/font-size="([\d.]+)"/g,(q,v)=>`font-size="${R1(v*1.35)}"`)}
  let spk='';if(s.spk){const f=[120+(bx[0]-120)*sc,GY+(bx[1]-GY)*sc,120+(bx[2]-120)*sc,GY+(bx[3]-GY)*sc],fb=left?[240-f[2],f[1],240-f[0],f[3]]:f;spk=stars(hashS('spk'+key+pose+String(o.seed==null?'':o.seed)),fb,0,s.pup===2?6:s.pup?7:8)}
  const AR=typeof o.aria==='string'&&o.aria?o.aria.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'):null;// v2.14: the game's own (translated) label; without o.aria the old label, byte for byte
  const lab=AR!==null?AR:`${s.name} the ${s.breed}, ${pose}`;
  if(!SF.nu)return `<svg class="pa-dog pa-pose-${pose}${anim?' pa-d-anim':''}${ex?' pa-ex-'+ex:''}${s.wet?' pa-d-wet':''}" viewBox="0 0 240 200" role="img" aria-label="${lab}"><g${fit}>${left?`<g transform="translate(240 0) scale(-1 1)">${shadow}</g>`:shadow}${frames}</g></svg>`;
  const cls=(lk.age?' pa-d-'+lk.age:'')+(s.mixHead?' pa-d-mix':'')+(s.spk?' pa-d-sparkle':'')+(s.expecting?' pa-d-expecting':'')+(s.wet?' pa-d-wet':'');
  return `<svg class="pa-dog pa-pose-${pose}${anim?' pa-d-anim':''}${cls}${ex?' pa-ex-'+ex:''}" viewBox="0 0 240 200" role="img" aria-label="${lab}${AR!==null?'':(lk.age?', '+lk.age:'')+(s.mixHead?' mix':'')}"><g${fit}>${left?`<g transform="translate(240 0) scale(-1 1)">${shadow}</g>`:shadow}${frames}</g>${spk}</svg>`;
}
function wetPuddle(x,w){// a flat crayon puddle under the feet (wider than the shadow), a blue rim, two white shine dashes
  const r=rng(hashS('pud'+R1(x)+R1(w))),pw=w*1.18+10,ph=6.5,P=[];for(let i=0;i<18;i++){const a=i/18*Math.PI*2;P.push([x+Math.cos(a)*pw*(1+(r()-.5)*.06),GY+2+Math.sin(a)*ph*(1+(r()-.5)*.2)])}
  const d=P.map((q,i)=>(i?'L':'M')+R1(q[0])+' '+R1(q[1])).join('')+'Z';
  return `<path d="${d}" fill="#D4EEFB" opacity=".85"/><path d="${d}" fill="none" stroke="${WET_RIM}" stroke-width="1.8" stroke-linejoin="round" opacity=".9"/><path d="M${R1(x-pw*.62)} ${GY+3.2}l${R1(pw*.2)} -1.6M${R1(x+pw*.42)} ${GY+4}l${R1(pw*.12)} -1" stroke="#fff" stroke-width="2.2" stroke-linecap="round" fill="none"/>`}
function dogHead(key,o={}){
  key=SP[key]?key:'shiba';const SF=specFor(key,o),s=SF.s,h=kit(rng(hashS('pahead'+key))),L=layout(s,'idle',0),HT=T(L.hT);
  if(s.ears!=='giant')L.face.eyes=s.face.eyes;if(s.pup===2){L.face.eyes='closed';L.ears='sleep';L.face.mouth='smile'}
  if(s.pup)h.setJ(s.pup===2?1.25:1.15);
  if(s.ruff)drawRuff(h,s,L,HT);drawEars(h,s,L,HT,false);if(s.topknot===2||s.topknot===3)drawTopknot(h,s,HT);h.shape(headPts(s).map(HT),s.hcol,{step:(s.hfluff===undefined?s.fluff:s.hfluff)?30:11,closed:(s.mixHead?SP[s.mixHead]:s).headShut});h.part(1);if(s.headMarks)s.headMarks(h,HT,s);if(s.pat)s.pat.head(h,HT,L);h.part(0);{const a0=h.acc.length,ff=(s.mixHead?SP[s.mixHead]:s).faceFn,X=s.pup===2?null:EXPR[exOk(o.expr,'idle',SF.lk.age)],xa=X?[h.acc.length,h.texts.length,h.bb.slice()]:0;drawFace(h,s,L,HT);if(ff)ff(h,s,L,HT,a0);if(X)exFace(h,s,L,HT,X,0,xa,hashS('pahead'+key))}drawEars(h,s,L,HT,true);
  let b=h.bb;if(NEWK.test(s.mixHead||key)){if(s.ears==='bat'){const hd=s.head,c=HT([0,0]);b=[c[0]-hd.rx*1.4,c[1]-hd.ry*1.8,c[0]+hd.rx*1.4,c[1]+hd.ry*1.08]}}// v2.5 heads fit by what was drawn (their ears and muzzles differ from the fixed boxes below)
  else if(/^(giant|bat)$/.test(s.ears)){const hd=s.head,c=HT([0,0]);b=[c[0]-hd.rx*1.25,c[1]-hd.ry*2.1,c[0]+hd.rx*1.25,c[1]+hd.ry*1.05]}else if(s.face.snoutL){const hd=s.head,c=HT([0,0]);b=[c[0]-hd.rx*1.25,c[1]-hd.ry*1.7,c[0]+hd.rx*1.75,c[1]+hd.ry*1.25]}
  const HL=typeof o.aria==='string'&&o.aria?o.aria.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;'):`${s.name} the ${s.breed}`;// v2.14: o.aria from the game
  const w=b[2]-b[0],ht=b[3]-b[1],sc=Math.min(86/w,86/ht),cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;
  if(!SF.nu)return `<svg class="pa-dog-head" viewBox="0 0 100 100" overflow="hidden" role="img" aria-label="${HL}"><g transform="translate(50 ${R1(50+ (ht*sc<80?4:0))}) scale(${sc.toFixed(3)}) translate(${R1(-cx)} ${R1(-cy)})">${h.acc.join('')}</g></svg>`;
  const spk=s.spk?stars(hashS('spkh'+key+String(o.seed==null?'':o.seed)),[12,10,88,64],3,5):'';
  return `<svg class="pa-dog-head${SF.lk.age?' pa-d-'+SF.lk.age:''}${s.mixHead?' pa-d-mix':''}${s.spk?' pa-d-sparkle':''}" viewBox="0 0 100 100" overflow="hidden" role="img" aria-label="${HL}"><g transform="translate(50 ${R1(50+ (ht*sc<80?4:0))}) scale(${sc.toFixed(3)}) translate(${R1(-cx)} ${R1(-cy)})">${h.acc.join('')}</g>${spk}</svg>`;
}
const css=`.pa-dog .pa-d-f1,.pa-dog .pa-d-f2{opacity:0}
.pa-dog.pa-d-anim .pa-d-f0{animation:pa-d-b0 1s steps(1,end) infinite}
.pa-dog.pa-d-anim .pa-d-f1{animation:pa-d-b1 1s steps(1,end) infinite}
.pa-dog.pa-d-anim .pa-d-f2{animation:pa-d-b2 1s steps(1,end) infinite}
@keyframes pa-d-b0{0%{opacity:1}33.333%{opacity:0}100%{opacity:0}}
@keyframes pa-d-b1{0%{opacity:0}33.333%{opacity:1}66.666%{opacity:0}100%{opacity:0}}
@keyframes pa-d-b2{0%{opacity:0}66.666%{opacity:1}100%{opacity:1}}
html[data-motion="off"] .pa-dog *,.pa-still .pa-dog *{animation-play-state:paused!important}
@media (prefers-reduced-motion: reduce){.pa-dog *{animation-play-state:paused!important}}
.pa-dog.pa-d-anim .pa-d-tw,.pa-dog-head .pa-d-tw{transform-box:fill-box;transform-origin:50% 50%;animation:pa-d-tw 1.6s ease-in-out infinite}
@keyframes pa-d-tw{0%,100%{transform:scale(.5) rotate(-10deg);opacity:.35}50%{transform:scale(1.1) rotate(12deg);opacity:1}}
[data-motion="off"] .pa-d-tw,.pa-still .pa-d-tw{animation:none!important;opacity:1}
@media (prefers-reduced-motion: reduce){.pa-d-tw{animation:none!important}}`;
if(typeof document!=='undefined'&&!document.getElementById('pawart-dogs-css')){const st=document.createElement('style');st.id='pawart-dogs-css';st.textContent=css;document.head.appendChild(st)}
// v2.19: PA.eatNose(key, o) = [x, y], where the nose lands in PA.dog(key, {...o, pose:'eat'}) facing right, in the 240 x 200 box (facing left: 240 - x).
// The game stands a dog at its bowl by it (the old eat pose put every nose at 170, 176 before the puppy scale).
function eatNose(key,o={}){
  key=SP[key]?key:'shiba';const SF=specFor(key,o),lk=SF.lk,s=o&&o.wet?wetSpec(SF.s):SF.s;if(lk.age==='newborn')return null;
  const ex=exOk(o.expr,'eat',lk.age),seed=hashS('pa'+key+'eat')*5+3,nF=o.anim!==false?3:1,bb=[1e9,1e9,-1e9,-1e9];let L0=null;
  for(let k=0;k<nF;k++){const f=frame(key,s,'eat',o.outfit,k,seed,ex),b=f.h.bb;if(!k)L0=f.L;bb[0]=Math.min(bb[0],b[0]);bb[1]=Math.min(bb[1],b[1]);bb[2]=Math.max(bb[2],b[2]);bb[3]=Math.max(bb[3],b[3])}
  const ps=s.pupScale||1,pdr=ps===1?0:(s.pupDx||0)*ps,bx=ps===1?bb:[120+(bb[0]-120)*ps+pdr,GY+(bb[1]-GY)*ps,120+(bb[2]-120)*ps+pdr,GY+(bb[3]-GY)*ps];
  const m=3,sc=Math.min(1,(GY-m)/(GY-bx[1]),(120-m)/(120-bx[0]),(240-m-120)/(bx[2]-120),bx[3]>GY?(199.5-GY)/(bx[3]-GY):1),tot=sc*ps,n=L0.eatNose;
  return tot<.999?[120+pdr*sc+(n[0]-120)*tot,GY+(n[1]-GY)*tot]:[n[0],n[1]]}
PA.dog=dog;PA.dogHead=dogHead;PA.eatNose=eatNose;PA.EXPR_LIST=EXPR_LIST.slice();PA.exprOk=(n,pose)=>!!exOk(n,pose||'idle',null);
PA.DOGS=KEYS.map(k=>({key:k,name:SP[k].name,breed:SP[k].breed,personality:SP[k].personality,joke:SP[k].joke}));
})();

  };
  art.call(shim, shim, undefined, undefined);
  var genes = function (window, globalThis, module) {
/* Doodle Doggo: PawGenes (v1.5A, breeds extended in v1.7 to 10, in v2.5 to 14, in v2.11 to 21 and in v2.12 to 35). Loosely real dog coat genetics for the crayon dogs.
   Plain IIFE, no DOM. Matches the v2 doc (Genetics section) and V2_GENES.md.
   API: LOCI, STARTER_GENES, SHADES, phenotype(genes, breedKey, seed?), pigment(genes),
        randomGenotype(breedKey, rng), inherit(mumGenes, dadGenes, rng),
        isDoubleMerle(a, b), related(dogA, dogB, allDogs).
   v2 (additive): BREED_NAMES, MIXES, mixKey(a, b), mixOf(damKey, sireKey, rng), predict(genesA, genesB, keyA, keyB, opts?),
        coatCatalog(breedKey), describe(genes).
   v2.1 (additive): ancestry(rec, lookup, depth = 6), grandMix(anc), sparkleOdds(o), coatCatalog(breedKey, { all: true }),
        fracText(x), GRAND_RECIPES. See the doc comments below. */
(function (root) {
  'use strict';

  /* ---------- v2.14 language service (V214.md 4.2): read-only, called at run time only, never at load ----------
     Everything the module RETURNS as data stays English (coat names, mix names, grandMix name and kind, carriers): the game stores them on
     dogs and uses them as journal keys (V214.md 4.3). Display goes through coatLabel(), mixLabel() and the label/how/summary/odds/text fields,
     which are looked up in the current language at the moment they are asked for. Keys: mod.genes.* for UI text, data.<table>.<path> for tables. */
  function fmtEn(en, vars) {
    const M = root.PawI18nMsg;
    if (M && typeof M.format === 'function') return M.format(en, vars || {}, 'en');
    return vars ? String(en).replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? String(vars[k]) : m)) : en;
  }
  let plain = false; // true while the canonical English text is built (coat names): L() then ignores the language
  function L(key, en, vars) { const P = root.PawI18n; return !plain && P && typeof P.tt === 'function' ? P.tt(key, en, vars) : fmtEn(en, vars); }
  const D = (path, en, vars) => L('data.' + path, en, vars);
  function lang() { const P = root.PawI18n; try { return P && typeof P.tlang === 'function' ? String(P.tlang() || 'en') : 'en'; } catch (e) { return 'en'; } }
  const isEn = () => lang() === 'en';
  const idOf = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  // a list in the current language: English keeps "a, b and c" exactly; others use Intl (conjunction or disjunction)
  function listOf(arr, type) {
    if (arr.length <= 1) return arr.join('');
    if (!isEn()) {
      try { const M = root.PawI18nMsg; return new root.Intl.ListFormat(M && M.intlOf ? M.intlOf(lang()) : lang(), { style: 'long', type: type || 'conjunction' }).format(arr); } catch (e) { /* fall back to English */ }
    }
    return arr.slice(0, -1).join(', ') + (type === 'disjunction' ? ' or ' : ' and ') + arr[arr.length - 1];
  }
  // a comma list with no "and" (sparkle parts, rest breeds): joined by a message so a language can use its own comma
  function commaJoin(arr) { return arr.reduce((a, b) => L('mod.genes.comma_join', '{a}, {b}', { a, b })); }

  const BREEDS = ['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle', 'poodle', 'collie', 'samoyed', 'frenchie', 'akita', 'spitz', 'pom', 'afghan', 'dane', 'mastiff', 'gsd',
    'dobie', 'corso', 'pitbull', 'minpin', 'lab', 'malamute', 'chow', 'stdpoodle', 'schnauzer', 'westie', 'yorkie', 'bichon', 'maltese', 'shihtzu',
    'dalmatian', 'bernese', 'aussie', 'cavalier', 'jrt']; // v2.12: fourteen appended (V212.md 2); v2.21: five more (V221.md 2), shown only while the game's switch is on (v221On)
  // Breed size for the v2 litter rules (small 1-3, medium 1-3, large 2-3 puppies).
  const SIZE = { shiba: 'medium', corgi: 'small', golden: 'large', dachs: 'small', husky: 'large', mutt: 'medium', chihuahua: 'small', pug: 'small', greyhound: 'large', beagle: 'medium',
    poodle: 'medium', collie: 'medium', samoyed: 'large', frenchie: 'small', akita: 'large', spitz: 'medium', pom: 'small', afghan: 'large', dane: 'large', mastiff: 'large', gsd: 'large',
    dobie: 'large', corso: 'large', pitbull: 'medium', minpin: 'small', lab: 'large', malamute: 'large', chow: 'medium', stdpoodle: 'large',
    schnauzer: 'small', westie: 'small', yorkie: 'small', bichon: 'small', maltese: 'small', shihtzu: 'small',
    dalmatian: 'large', bernese: 'large', aussie: 'medium', cavalier: 'small', jrt: 'small' };

  const LOCI = {
    B:  { name: 'Coat base (B locus, TYRP1)', alleles: ['B', 'b'], dominant: 'B', rule: 'B_ makes black pigment; b/b makes liver (chocolate) pigment, a liver nose and amber eyes.' }, // copy-ok: reference text, not shown in the game
    D:  { name: 'Dilution (D locus, MLPH)', alleles: ['D', 'd'], dominant: 'D', rule: 'd/d dilutes: black becomes blue, liver becomes lilac (isabella), red becomes cream.' },
    E:  { name: 'Red (E locus, MC1R)', alleles: ['E', 'e'], dominant: 'E', rule: 'e/e makes the coat grow only red pigment: red, gold or tan by breed (cream with d/d). It hides merle (cryptic merle).' },
    S:  { name: 'White spotting (S locus, MITF)', alleles: ['S', 'sp'], dominant: 'S', rule: 'S/sp gives small white markings; sp/sp gives extensive white piebald patches.' }, // copy-ok: reference text, not shown in the game
    M:  { name: 'Merle (M locus, PMEL)', alleles: ['M', 'm'], dominant: 'M', rule: 'M/m gives merle marbling on black or liver pigment (hidden on e/e). M/M (double merle) is never allowed.' },
    Bl: { name: 'Husky blue eyes (ALX4-type)', alleles: ['Bl', 'bl'], dominant: 'Bl', rule: 'Bl/Bl gives blue eyes; Bl/bl gives blue eyes with a 1 in 4 chance of odd eyes instead.' } // copy-ok: reference text, not shown in the game
  };
  const LOCUS_KEYS = ['B', 'D', 'E', 'S', 'M', 'Bl'];
  /* v2.21 (code review 2): the tan-point locus, kept apart from the six. Only a breed with copper points reads it (COPPER: the Aussie), only genes that
     carry it have it (no older dog ever does, so every older result, seeded draw and Dog Card is unchanged), and a missing pair counts as at/at.
     at is dominant (tan points: the Aussie's copper), a/a has none (a "bi" coat). It is independent of E, as the real A locus is. */
  const TAN = { key: 'A', name: 'Tan points (A locus, ASIP)', alleles: ['at', 'a'], dominant: 'at', rule: 'at_ gives tan (copper) points on a dark coat; a/a gives none.' }; // copy-ok: reference text, not shown
  const tanOk = (p) => Array.isArray(p) && p.length === 2 && p.every((x) => x === 'at' || x === 'a');
  const tanOf = (g) => (g && tanOk(g.A) ? g.A : ['at', 'at']);
  /* Tan points ("tan-points" branch, owner, 8 Nov 2026): the Border Collie and the Pembroke Corgi read the same A locus. Their art draws tan only when the
     genes carry it (TAN_ART): a missing pair is no tan here (every older collie and corgi, so all of them draw as before), at_ gives tan points on a dark
     coat (coat.tan), a/a none. Red and cream (e/e) hide it, as the real E locus does. Only a starter picked as a tricolour carries it (FREQ has no a). */
  const TAN_ART = { collie: true, corgi: true };
  const TAN_SHADE = { black: '#C8743A', liver: '#E2A86C', blue: '#D69C6A', lilac: '#E4BC92' }; // the tan on each dark pigment (lighter on the paler coats, so it shows)
  const tanShows = (g, breed, pig) => !!TAN_ART[breed] && tanOk(g.A) && !both(g.A, 'a') && pig !== 'red' && pig !== 'cream';
  /* Red intensity (owner, 8 Nov 2026: the fox red Lab): a seventh, optional locus like TAN. I (deep red) over i (today's red), incompletely dominant:
     I/I the deep shade, I/i in between, i/i (or no pair: every older dog) the red as before. Only the INTENSE breeds read it, only on a red (e/e, not
     dilute) coat: the Lab's "Fox red", the Golden's "Dark golden". Only a starter picked in that colour carries it (FREQ has no I). */
  const RED_I = { key: 'I', name: 'Red intensity', alleles: ['I', 'i'], dominant: 'I', rule: 'I/I gives a deep red (fox red), I/i a red in between, i/i the usual red.' }; // copy-ok: reference text, not shown
  const redOk = (p) => Array.isArray(p) && p.length === 2 && p.every((x) => x === 'I' || x === 'i');
  const redOf = (g) => (g && redOk(g.I) ? g.I : ['i', 'i']);
  const INTENSE = { lab: true, golden: true };

  // From V2_GENES.md (the v2 doc). Each must reproduce the starter dog's current art.
  const STARTER_GENES = {
    shiba:  { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],   M: ['m', 'm'], Bl: ['bl', 'bl'] },
    corgi:  { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'sp'],  M: ['m', 'm'], Bl: ['bl', 'bl'] },
    golden: { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],   M: ['m', 'm'], Bl: ['bl', 'bl'] },
    dachs:  { B: ['b', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'],   M: ['m', 'm'], Bl: ['bl', 'bl'] },
    husky:  { B: ['B', 'B'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'sp'],  M: ['m', 'm'], Bl: ['Bl', 'Bl'] },
    mutt:   { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] },
    // v1.7 breeds
    chihuahua: { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // fawn; carries chocolate + dilute
    pug:       { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // fawn with black mask; carries apricot (b)
    greyhound: { B: ['B', 'B'], D: ['d', 'd'], E: ['E', 'e'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, // blue with white chest; carries fawn + white
    beagle:    { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'e'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, // tricolour; carries chocolate, red, piebald
    // v2.5 breeds
    poodle:    { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // apricot; carries cream (b) and white (d)
    collie:    { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, // black and white; carries chocolate
    samoyed:   { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // white; carries cream (b)
    frenchie:  { B: ['B', 'B'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // fawn with a dark mask; carries blue fawn
    // v2.11 breeds
    akita:     { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // red; carries sesame (E), dilute (white)
    spitz:     { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // white; carries cream (b)
    pom:       { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // orange; carries chocolate and dilute
    afghan:    { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // red; carries chocolate and dilute (cream, silver)
    dane:      { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // fawn; carries chocolate (brindle look) and dilute (blue)
    mastiff:   { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // fawn with the black mask; carries apricot (b)
    gsd:       { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // black and tan; carries sable (e) and liver
    // v2.12 breeds (V212.md 3). None carries M.
    dobie:     { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'E'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // black and rust; carries red (b) and blue (d)
    corso:     { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // black; carries fawn (e), the brindle look (b) and grey (d)
    pitbull:   { B: ['B', 'b'], D: ['d', 'd'], E: ['E', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // blue; carries fawn (e) and the brindle look (b)
    minpin:    { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // red; carries chocolate (b)
    lab:       { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // yellow; carries chocolate (b)
    malamute:  { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // grey and white; carries red (b), sable (e) and white (e, d)
    chow:      { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // red; carries cinnamon (b) and cream (d)
    stdpoodle: { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // black; carries apricot (e), chocolate (b) and silver (d)
    schnauzer: { B: ['B', 'B'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // salt and pepper; carries white (e) and black and silver (d)
    westie:    { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // white, always
    yorkie:    { B: ['B', 'B'], D: ['d', 'd'], E: ['E', 'E'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // blue and tan
    bichon:    { B: ['B', 'b'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // white; carries cream (b)
    maltese:   { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['S', 'S'],  M: ['m', 'm'], Bl: ['bl', 'bl'] }, // white, always
    shihtzu:   { B: ['B', 'b'], D: ['D', 'd'], E: ['e', 'e'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, // gold and white; carries liver (b) and silver (d)
    // v2.21 breeds (V221.md 3). Only the Australian Shepherd carries M (never M/M: isDoubleMerle blocks every pair of two M carriers)
    dalmatian: { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, // black spotted; carries liver (b)
    bernese:   { B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'],   M: ['m', 'm'], Bl: ['bl', 'bl'] }, // tricolour, always
    aussie:    { B: ['B', 'b'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'sp'],  M: ['m', 'm'], Bl: ['bl', 'bl'], A: ['at', 'a'] }, // black tricolour (copper at_, white trim); carries red (b) and no-copper (a). Merle comes from rescues and playdates (FREQ M)
    cavalier:  { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }, // Blenheim
    jrt:       { B: ['B', 'B'], D: ['D', 'D'], E: ['e', 'e'], S: ['sp', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] }  // white and tan
  };

  /* Art palette per breed and pigment: [base, light, dark].
     The starter cells (marked *) equal the current fills in dogs/pawart_dogs.js exactly:
       shiba red*   col #F7892E, light #FFE7B3          (no dark in the art; dark is unused)
       corgi red*   col #F8A23C, light #FFFFFF (white markings)
       golden red*  col #F2B84A, ear #D98A22 = dark
       dachs liver* col #A65A34, light #F5B26B (tan points/socks), ear #6E3315 = dark
       husky black* col #78A2E2 (crayon wolf-grey), light #FFFFFF (mask)
       mutt black*  dark #1D1A22 patches on white: base = patch colour #1D1A22, white 0.6
     light = muzzle/chest/urajiro/tan points; for corgi, husky and mutt the breed's light areas are white. */
  const SHADES = {
    shiba: {
      red:   ['#F7892E', '#FFE7B3', '#C9621C'], // *
      cream: ['#F4D6A2', '#FFF6E6', '#D6AF74'],
      black: ['#2B2430', '#FFE7B3', '#1D1A22'], // black and tan, cream urajiro
      liver: ['#7A4A2E', '#FFE7B3', '#5A3420'],
      blue:  ['#6E7F96', '#FFE7B3', '#55657A'],
      lilac: ['#A8949A', '#FFF1E8', '#8A777E']
    },
    corgi: {
      red:   ['#F8A23C', '#FFFFFF', '#C97A22'], // *
      cream: ['#F6D7A0', '#FFFFFF', '#D6B27A'],
      black: ['#2B2430', '#FFFFFF', '#1D1A22'],
      liver: ['#7A4A2E', '#FFFFFF', '#5A3420'],
      blue:  ['#6E7F96', '#FFFFFF', '#55657A'],
      lilac: ['#A8949A', '#FFFFFF', '#8A777E']
    },
    golden: {
      red:   ['#F2B84A', '#FBE3A6', '#D98A22'], // *
      fox:   ['#D9892C', '#F4C47A', '#A85E16'], // dark golden (I/I, RED_I)
      fox1:  ['#E6A03A', '#F8D690', '#C27418'], // dark golden, in between (I/i)
      cream: ['#F6E0B0', '#FFF6E0', '#E0BE7A'],
      black: ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver: ['#7A4A2E', '#9A6A4A', '#5A3420'],
      blue:  ['#6E7F96', '#8C9BB0', '#55657A'],
      lilac: ['#A8949A', '#C2B2B7', '#8A777E']
    },
    dachs: {
      liver: ['#A65A34', '#F5B26B', '#6E3315'], // * chocolate and tan
      black: ['#2B2430', '#C98A4E', '#1D1A22'], // black and tan
      blue:  ['#6E7F96', '#D9B48A', '#55657A'],
      lilac: ['#B89A8A', '#F2D2B0', '#8F7466'], // isabella
      red:   ['#C8642E', '#E8945A', '#8A3E1C'],
      cream: ['#EBCB98', '#F7E3C0', '#C9A46E']
    },
    husky: {
      black: ['#78A2E2', '#FFFFFF', '#4F79B8'], // * wolf-grey crayon
      liver: ['#B4653A', '#FFFFFF', '#86452A'], // copper
      blue:  ['#A9BCD6', '#FFFFFF', '#7F93AE'],
      lilac: ['#C9B3B8', '#FFFFFF', '#A3898F'],
      red:   ['#E8A06A', '#FFFFFF', '#B8703F'],
      cream: ['#F3E2C2', '#FFFFFF', '#D9C29A']
    },
    /* v1.7 breeds. Starter cells (*) equal dogs/pawart_dogs.js:
       chihuahua fawn*  col #F0C48C, light #FFF1DC (no dark in the art; dark unused)
       pug fawn*        col #E8C08C, light #F6DDB6, dark #2B2430 = the black mask (and ears)
       greyhound blue*  col #8E9AB0, light #FFFFFF (chest), ear #6E7A90 = dark
       beagle tricolour* col #CF8C4C = tan base, light #FFFFFF, dark #2B2430 = the saddle (the art keeps its ear #A8642E)
       Breed folding: pug fawn is drawn as e/e with the black mask as a breed marking; greyhound brindle is NOT modelled
       (it needs the K locus); beagle "tricolour" = black pigment drawn as tan base + black saddle + white. */
    chihuahua: {
      red:   ['#F0C48C', '#FFF1DC', '#C99A5E'], // * fawn
      cream: ['#F6E2C0', '#FFF8EC', '#D9BF94'],
      black: ['#2B2430', '#D99A5A', '#1D1A22'], // black and tan
      liver: ['#7A4A2E', '#D9A06A', '#5A3420'], // chocolate and tan
      blue:  ['#6E7F96', '#D9B48A', '#55657A'], // blue and tan
      lilac: ['#A8949A', '#E8CDB0', '#8A777E']
    },
    pug: {
      red:     ['#E8C08C', '#F6DDB6', '#2B2430'], // * fawn, black mask
      apricot: ['#E0A060', '#F2C894', '#2B2430'], // rare: e/e with b/b
      cream:   ['#D9CDBE', '#ECE4D8', '#55657A'], // silver fawn, grey mask
      black:   ['#2B2430', '#3A3240', '#1D1A22'], // solid black (mask invisible)
      liver:   ['#7A4A2E', '#8E5E40', '#5A3420'],
      blue:    ['#6E7F96', '#8291A6', '#55657A'],
      lilac:   ['#A8949A', '#BBA9AF', '#8A777E']
    },
    greyhound: {
      blue:    ['#8E9AB0', '#FFFFFF', '#6E7A90'], // *
      black:   ['#2B2430', '#FFFFFF', '#1D1A22'],
      red:     ['#E0B07A', '#FFFFFF', '#B8875A'], // fawn
      redliver:['#C8743E', '#FFFFFF', '#94522A'], // red (e/e with b/b, liver nose)
      cream:   ['#D8C3A8', '#FFFFFF', '#B8A284'], // blue fawn
      liver:   ['#7A4A2E', '#FFFFFF', '#5A3420'],
      lilac:   ['#A8949A', '#FFFFFF', '#8A777E']
    },
    beagle: {
      black: ['#CF8C4C', '#FFFFFF', '#2B2430'], // * tricolour: tan base, black saddle
      liver: ['#D9A066', '#FFFFFF', '#7A4A2E'], // chocolate tricolour
      blue:  ['#D6A878', '#FFFFFF', '#6E7F96'], // blue tricolour
      lilac: ['#DDB48C', '#FFFFFF', '#A8949A'], // lilac tricolour
      red:   ['#C9783C', '#FFFFFF', '#C9783C'], // red and white (no saddle)
      cream: ['#F1D79A', '#FFFFFF', '#F1D79A']  // lemon and white
    },
    /* v2.5 breeds. Starter cells (*) equal dogs/pawart_dogs.js (DOG ART lane):
       poodle apricot*  col #F2C48F (curls are mix(col, PEN), so every shade recolours them)
       collie black*    col #2A2628, light #FFFFFF = the white collar, blaze, chest, socks and tail tip
       samoyed white*   col #FBF6EC, light #FFFFFF, dark #E8DECB (off-white on purpose: pure #FFFFFF is the art's white-spot colour)
       frenchie fawn*   col #D9B48A, dark = the mask
       Breed folding: poodle e/e d/d is "White", e/e b/b is "Cream"; collie S/S (no spotting gene) is the tricolour pattern;
       frenchie E_ is the brindle look ("Dark fawn", there is no K locus), e/e d/d is "Blue fawn", e/e b/b is "Cream";
       samoyed is always e/e: "White", with b/b "Cream". */
    poodle: {
      red:      ['#F2C48F', '#FBE2C0', '#D9A066'], // * apricot
      cream:    ['#F7F1E6', '#FFFFFF', '#E2D6C2'], // white (not #FFFFFF: the curls must still show)
      redliver: ['#EFD8B0', '#FAEEDA', '#D2B486'], // cream, liver nose
      black:    ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver:    ['#6E4430', '#8E5E40', '#4E2E1E'], // chocolate
      blue:     ['#A3AAB5', '#C6CBD2', '#7F8794'], // silver
      lilac:    ['#C4A486', '#DDC4AA', '#A2846A']  // silver beige
    },
    collie: {
      black: ['#2A2628', '#FFFFFF', '#1D1A22'], // * black and white
      liver: ['#7A4A2E', '#FFFFFF', '#5A3420'], // chocolate (the merle form is "Red merle")
      blue:  ['#6E7F96', '#FFFFFF', '#55657A'],
      lilac: ['#A8949A', '#FFFFFF', '#8A777E'],
      red:   ['#C8743E', '#FFFFFF', '#94522A'], // red (e/e)
      cream: ['#EED2A0', '#FFFFFF', '#CFAE76'],
      mblack: ['#8C96A6', '#FFFFFF', '#2A2628'], // blue merle: grey base, the art adds dark and light patches
      mliver: ['#C99A7E', '#FFFFFF', '#7A4A2E'], // red merle
      mblue:  ['#A9B4C4', '#FFFFFF', '#6E7F96'], // slate merle
      mlilac: ['#C9B8BC', '#FFFFFF', '#A8949A']  // lilac merle
    },
    samoyed: {
      red:      ['#FBF6EC', '#FFFFFF', '#E8DECB'], // * white
      redliver: ['#F2E2C4', '#FFF8EC', '#D9C29E'], // cream (biscuit)
      cream:    ['#F4E8D0', '#FFFAF0', '#DCCBA8'],
      black:    ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver:    ['#7A4A2E', '#9A6A4A', '#5A3420'],
      blue:     ['#6E7F96', '#8C9BB0', '#55657A'],
      lilac:    ['#A8949A', '#C2B2B7', '#8A777E']
    },
    frenchie: {
      red:      ['#D9B48A', '#F0DCC0', '#3A2E2E'], // * fawn, dark mask
      cream:    ['#D6C6AE', '#EADFCC', '#6E7F96'], // blue fawn, blue mask
      redliver: ['#EEDDC0', '#F8EFDE', '#9A7A5E'], // cream, soft liver mask
      black:    ['#7A5C44', '#A8865E', '#2B2430'], // dark fawn (the brindle look)
      liver:    ['#6E4430', '#8E5E40', '#4E2E1E'],
      blue:     ['#6E7F96', '#8291A6', '#55657A'],
      lilac:    ['#A8949A', '#BBA9AF', '#8A777E']
    },
    /* v2.11 breeds. Starter cells (*) equal dogs/pawart_dogs.js (BREED ART lane):
       akita red*      col #D46E36, light #FFF4E2 = the white urajiro (mask, chest, belly, socks), dark #A44E1E
       spitz white*    col #FCF8F0, light #FFFFFF, dark #E6DCCB (off-white on purpose, like the samoyed)
       pom orange*     col #F59A3C, light #FFD9A6, dark #C9701E
       Breed folding: akita E_ is a sesame (black-tipped red hairs; there is no K locus, so b/b E_ is "Dark sesame"), e/e d/d is "White";
       spitz is always e/e: "White", with b/b "Cream"; pom e/e is "Orange", e/e d/d "Cream", e/e b/b "White". */
    akita: {
      red:    ['#D46E36', '#FFF4E2', '#A44E1E'], // * red
      cream:  ['#FBF6EC', '#FFFFFF', '#E8DECB'], // white
      black:  ['#C9803F', '#FFFFFF', '#3A2A22'], // sesame: red hairs with black tips
      liver:  ['#8A5430', '#FFFFFF', '#2E2018'], // dark sesame
      blue:   ['#A89A92', '#FFFFFF', '#5E6F86'], // ash sesame
      lilac:  ['#C7B3A8', '#FFFFFF', '#8A777E']  // pale sesame
    },
    spitz: {
      red:      ['#FCF8F0', '#FFFFFF', '#E6DCCB'], // * white
      redliver: ['#F5E6CA', '#FFF9EE', '#DCC8A2'], // cream
      cream:    ['#F4E8D0', '#FFFAF0', '#DCCBA8'],
      black:    ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver:    ['#7A4A2E', '#9A6A4A', '#5A3420'],
      blue:     ['#6E7F96', '#8C9BB0', '#55657A'],
      lilac:    ['#A8949A', '#C2B2B7', '#8A777E']
    },
    pom: {
      red:      ['#F59A3C', '#FFD9A6', '#C9701E'], // * orange
      cream:    ['#F0D5A5', '#FFF3DC', '#CDAE78'],
      redliver: ['#FBF6EE', '#FFFFFF', '#E6DCCB'], // white
      black:    ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver:    ['#6E4430', '#8E5E40', '#4E2E1E'], // chocolate
      blue:     ['#6E7F96', '#8C9BB0', '#55657A'],
      lilac:    ['#A8949A', '#C2B2B7', '#8A777E']
    },
    /* v2.11 big breeds (BREEDS lane, second batch). The starter cells (*) are matched to dogs/pawart_dogs.js when the second artist's drawings land.
       afghan red*    silky long coat (col #C9783E, light #E6A86E, dark #3A2E2E). E/E black is the 'solid' shade (Black), E/e black is Black and tan, e/e d/d is Cream, E_ d/d is Silver.
       dane fawn*     the black mask is dark. E_ b/b is the brindle look (no K locus), merle names Merle / Blue merle, merle on white (sp/sp) is Harlequin.
       mastiff fawn*  the black mask is always dark; e/e b/b is Apricot (like the pug), E_ is the brindle look.
       gsd black and tan*  E/E is solid Black, e/e is Sable, e/e d/d is White. */
    afghan: {
      cream:  ['#EBD3A4', '#FAF0DC', '#C7AA78'],
      red:    ['#C9783E', '#E6A86E', '#3A2E2E'], // *
      black:  ['#2B2430', '#D49A5A', '#1D1A22'], // black and tan
      solid:  ['#2B2430', '#4A3F4E', '#1D1A22'], // black
      liver:  ['#6E4430', '#8E5E40', '#4E2E1E'], // chocolate
      blue:   ['#C9C6C2', '#E8E6E2', '#55545A'], // silver
      lilac:  ['#C9B8BC', '#E0D3D6', '#A8949A']
    },
    dane: {
      red:    ['#D9A562', '#E6BA7E', '#2B2430'], // * fawn, black mask
      cream:  ['#EAD6B0', '#F8EDD6', '#6E7F96'], // pale fawn
      black:  ['#2A2628', '#3A3438', '#1D1A22'],
      liver:  ['#C99A5E', '#D9AF77', '#2B2430'], // brindle look (coat.brindle)
      blue:   ['#7E8A9C', '#909CAE', '#4A5568'],
      lilac:  ['#C7B08C', '#D9C6A6', '#2B2430'], // pale brindle
      mblack: ['#8C96A6', '#9EA8B6', '#2A2628'], // merle: grey base, the art adds dark patches
      mliver: ['#C99A7E', '#E0C0A8', '#7A4A2E'],
      mblue:  ['#B3BCC8', '#D5DBE3', '#6E7F96'],
      mlilac: ['#C9B8BC', '#E0D3D6', '#A8949A']
    },
    mastiff: {
      red:     ['#D8AE72', '#E9C994', '#2B2430'], // * fawn, black mask
      apricot: ['#D98E4E', '#E9AE74', '#2B2430'],
      cream:   ['#E6D3B2', '#F4E8D2', '#55657A'],
      black:   ['#C99A5E', '#D9AF77', '#2B2430'], // brindle look (coat.brindle)
      liver:   ['#9A7040', '#B58A58', '#2B2430'], // dark brindle
      blue:    ['#A8A29A', '#C0BBB3', '#2B2430'], // silver brindle
      lilac:   ['#C7B08C', '#D9C6A6', '#2B2430']  // pale brindle
    },
    gsd: {
      black:  ['#C98A4A', '#E2B278', '#2B2430'], // * black and tan (the art draws the tan body, the dark = ears, mask and saddle)
      solid:  ['#2A2628', '#3A3438', '#1D1A22'], // black
      red:    ['#A88A5E', '#C8A878', '#3A3030'], // sable
      cream:  ['#FBF6EC', '#FFFFFF', '#E8DECB'], // white
      liver:  ['#B07A44', '#D9A872', '#5A3420'], // liver and tan
      blue:   ['#C9A06A', '#E2B88A', '#55657A'], // blue and tan
      lilac:  ['#C9A890', '#E0C8B0', '#8A777E']  // lilac and tan
    },
    /* v2.12 breeds (GENES lane, V212.md 3). The starter cells (*) are the colours the four ART lanes draw with (col, light, dark).
       Breed folding (no K or A locus, no merle in any of them):
       dobie      always E/E: black and rust, b/b Red and rust, d/d Blue and rust, b/b d/d Fawn and rust (light = the rust points)
       corso      E_ Black, E_ d/d Grey, e/e Fawn (dark = the mask), e/e b/b Red, e/e d/d Grey fawn; E_ b/b is the brindle look (Black brindle, Grey brindle)
       pitbull    E_ d/d Blue, E_ Black, e/e Fawn, e/e b/b Red, e/e d/d Blue fawn, E_ b/b the brindle look; sp/sp on a red coat is White, on a dark coat Pied
       minpin     e/e Red (stag red too), E_ Black and rust, E_ b/b Chocolate and rust
       lab        the classic E and B: e/e Yellow, B_ Black, b/b Chocolate
       malamute   E/e Grey, E/E Black (SOLID_E), E_ b/b Red, e/e Sable, e/e d/d White; the white mask and belly always (WHITE_MARKED)
       chow       e/e Red, E_ Black, d/d Blue, b/b Cinnamon, e/e d/d Cream
       stdpoodle  like the poodle, plus e/e B/B Red (a double dose of B, loosely the intensity genes) and E/E d/d Blue (E/e d/d is Silver)
       schnauzer  E/e Salt and pepper, E/E Black (SOLID_E), E_ d/d Black and silver, e/e White
       westie, maltese  always e/e: White.   bichon  always e/e: White, b/b Cream.
       yorkie     always E/E: D_ Black and tan, d/d Blue and tan (the adult steel and gold); sp/sp Parti
       shihtzu    e/e Gold, E/e Black, E/E the brindle look, E_ b/b Liver, E_ d/d Silver; any spotting gene says "and white" */
    dobie: {
      black:  ['#2B2628', '#C8743A', '#1D1A22'], // * black and rust
      liver:  ['#7A3A22', '#C8743A', '#4E2414'], // red and rust
      blue:   ['#6C7484', '#C88250', '#4A5262'], // blue and rust
      lilac:  ['#B08A6A', '#D49A62', '#7E6048'], // fawn and rust
      red:    ['#D9924E', '#F0C48A', '#A86A30'], // only from a mix parent
      cream:  ['#EBD3A8', '#F8EBD2', '#C9AE80']
    },
    corso: {
      black:    ['#363133', '#57504F', '#1D1A22'], // * black
      blue:     ['#7A7E86', '#8E929A', '#3E424A'], // grey
      red:      ['#D2AE7A', '#E4C898', '#2B2430'], // fawn, black mask
      redliver: ['#B8683A', '#CC8452', '#2B2430'], // red, black mask
      cream:    ['#C8B49A', '#DCCBB4', '#55657A'], // grey fawn, grey mask
      liver:    ['#6A5240', '#7E6450', '#1D1A22'], // black brindle (coat.brindle)
      lilac:    ['#8A8078', '#9E948A', '#3E424A']  // grey brindle (coat.brindle)
    },
    pitbull: {
      blue:     ['#7E8898', '#F2EEE6', '#4E5664'], // * blue
      black:    ['#2B2628', '#F2EEE6', '#1D1A22'],
      red:      ['#D7B07E', '#F4E6CE', '#9A7A52'], // fawn
      redliver: ['#B8683A', '#F2E2CC', '#7E4224'], // red (liver nose)
      cream:    ['#B8A08E', '#E8DCCE', '#7E7480'], // blue fawn
      liver:    ['#B08A5E', '#F2E6D2', '#3A2E2E'], // brindle (coat.brindle)
      lilac:    ['#8E8A90', '#EEEAE4', '#4A5060'], // blue brindle (coat.brindle)
      white:    ['#FBF6EC', '#FFFFFF', '#E8DECB']  // white (sp/sp on a red coat)
    },
    minpin: {
      red:    ['#B5522C', '#DC8A56', '#7A3418'], // * red
      black:  ['#2B2628', '#C8743A', '#1D1A22'], // black and rust
      liver:  ['#5E3424', '#C8743A', '#3E2216'], // chocolate and rust
      blue:   ['#5E6A7E', '#C98A5E', '#46505F'],
      lilac:  ['#B49A86', '#E0B88E', '#927866'],
      cream:  ['#EBCB98', '#F7E3C0', '#C9A46E']
    },
    lab: {
      red:    ['#F0CC84', '#F9E6B6', '#D9A458'], // * yellow
      fox:    ['#C8682E', '#E8A672', '#94461C'], // fox red (I/I, RED_I)
      fox1:   ['#DE9A52', '#F2C994', '#B26E34'], // fox red, in between (I/i)
      black:  ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver:  ['#6E4430', '#8E5E40', '#4E2E1E'], // chocolate
      cream:  ['#F4E6C8', '#FFF6E2', '#DCC8A0'], // champagne (only from a mix parent)
      blue:   ['#5E6470', '#7A808C', '#464B55'], // charcoal
      lilac:  ['#B0A49E', '#C8BEB8', '#8E827C']  // silver
    },
    malamute: {
      black:  ['#9C9AA4', '#FFFFFF', '#5E5A68'], // * grey and white (light = the white mask, chest and belly)
      solid:  ['#3A3440', '#FFFFFF', '#24202A'], // black and white
      liver:  ['#B8683A', '#FFFFFF', '#8A4A26'], // red and white
      red:    ['#9A7A58', '#FFFFFF', '#5E4632'], // sable and white
      cream:  ['#FBF6EC', '#FFFFFF', '#E8DECB'], // white
      blue:   ['#7E8CA2', '#FFFFFF', '#5A6680'],
      lilac:  ['#B8A8AA', '#FFFFFF', '#928286']  // silver
    },
    chow: {
      red:    ['#D2894A', '#EBB477', '#A9652E'], // * red
      black:  ['#2B2430', '#4A3F4E', '#1D1A22'],
      blue:   ['#6E7F96', '#8C9BB0', '#55657A'],
      liver:  ['#C8945E', '#E2B888', '#9A6A3E'], // cinnamon
      cream:  ['#F2E2C4', '#FFF8EC', '#D9C29E'],
      lilac:  ['#C4B0A0', '#DCCAB8', '#A08C7C']  // fawn
    },
    stdpoodle: {
      black:    ['#2B2430', '#4A3F4E', '#1D1A22'], // * black
      red:      ['#F2C48F', '#FBE2C0', '#D9A066'], // apricot (the poodle's)
      deep:     ['#B8582E', '#D47E52', '#8A3E1C'], // red (e/e B/B)
      cream:    ['#F7F1E6', '#FFFFFF', '#E2D6C2'], // white (off-white so the curls show)
      redliver: ['#EFD8B0', '#FAEEDA', '#D2B486'], // cream
      liver:    ['#6E4430', '#8E5E40', '#4E2E1E'], // chocolate
      blue:     ['#A3AAB5', '#C6CBD2', '#7F8794'], // silver
      dblue:    ['#6E7F96', '#8C9BB0', '#55657A'], // blue (E/E d/d)
      lilac:    ['#C4A486', '#DDC4AA', '#A2846A']  // silver beige
    },
    schnauzer: {
      black:  ['#9A9AA3', '#E6E4E0', '#4A4652'], // * salt and pepper (light = the beard and eyebrows)
      solid:  ['#2B2430', '#3A3240', '#1D1A22'], // black
      blue:   ['#2B2430', '#D8D6D2', '#1D1A22'], // black and silver
      red:    ['#FBF8F2', '#FFFFFF', '#E2D9CC'], // white
      cream:  ['#FBF8F2', '#FFFFFF', '#E2D9CC'], // white
      liver:  ['#6E4430', '#B89A80', '#4E2E1E'],
      lilac:  ['#A8949A', '#D0C4C6', '#8A777E']
    },
    westie: {
      red:    ['#FBF8F1', '#FFFFFF', '#E3D9C8'], // * white (off-white on purpose, like the samoyed)
      cream:  ['#F4EEDF', '#FFFFFF', '#DCCFB8'],
      black:  ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver:  ['#7A4A2E', '#9A6A4A', '#5A3420'],
      blue:   ['#6E7F96', '#8C9BB0', '#55657A'],
      lilac:  ['#A8949A', '#C2B2B7', '#8A777E']
    },
    yorkie: {
      blue:   ['#617389', '#D9A35C', '#3E4A5E'], // * blue and tan (base = the steel body, light = the tan head and legs)
      black:  ['#2B2430', '#C98A4E', '#1D1A22'], // black and tan
      liver:  ['#6E4430', '#D9A06A', '#4E2E1E'], // chocolate and tan
      lilac:  ['#A8949A', '#E8CDB0', '#8A777E'],
      red:    ['#D9A45E', '#F0CC94', '#A8783A'], // gold (only from a mix parent)
      cream:  ['#F0DCB4', '#FFF2DC', '#D0B88C']
    },
    bichon: {
      red:      ['#FDFBF6', '#FFFFFF', '#E4DCCD'], // * white
      redliver: ['#F3E2C2', '#FFF6E4', '#D6BE94'], // cream
      cream:    ['#F4E8D0', '#FFFAF0', '#DCCBA8'],
      black:    ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver:    ['#7A4A2E', '#9A6A4A', '#5A3420'],
      blue:     ['#6E7F96', '#8C9BB0', '#55657A'],
      lilac:    ['#A8949A', '#C2B2B7', '#8A777E']
    },
    maltese: {
      red:    ['#FFFDF8', '#FFFFFF', '#E6DDCE'], // * white
      cream:  ['#F4E8D0', '#FFFAF0', '#DCCBA8'],
      black:  ['#2B2430', '#4A3F4E', '#1D1A22'],
      liver:  ['#7A4A2E', '#9A6A4A', '#5A3420'],
      blue:   ['#6E7F96', '#8C9BB0', '#55657A'],
      lilac:  ['#A8949A', '#C2B2B7', '#8A777E']
    },
    shihtzu: { // light = the white (blaze, chest, coat skirt); the 4th value is the light of a solid coat (no spotting gene), so a "Black" Shih Tzu reads black
      red:     ['#E0A458', '#FFFBF2', '#9A6430', '#F2CA8E'], // * gold (and white: coat.white 0.6)
      black:   ['#2B2628', '#FFFBF2', '#1D1A1C', '#3A3436'],
      brindle: ['#B07A45', '#FFFBF2', '#3A2E2E', '#C8925E'], // brindle look (coat.brindle)
      liver:   ['#8A4F33', '#FFFBF2', '#5A2E1C', '#A0644A'],
      blue:    ['#B8B4B0', '#FFFBF2', '#6E6A68', '#CFCBC6'], // silver
      cream:   ['#F2E2C0', '#FFFBF2', '#D6C29A', '#FFF4DE'],
      lilac:   ['#C4B0A8', '#FFFBF2', '#A08C86', '#DCCAC2']
    },
    /* v2.21 breeds (V221.md 3 and 5). The starter cells (*) are the colours the ART lanes give SP (col, light, dark); a fix batch re-matches them to the final art.
       dalmatian  col = the white ground, dark = the spots (B_ black, b/b liver; mix only: d/d blue or lilac, e/e lemon), light = white
       bernese    col = black, light = the rust points; the white blaze, chest, feet and tail tip are drawn by the art on every coat
       aussie     'cu' = with copper points (E/e, the afghan's tan fold), 'm' = merle (a pale base, the art's merle smudges); light = the copper, else close to the base
       cavalier   red = Ruby (Blenheim with sp/sp: the white is coat.white), black = black and tan (light = the tan)
       jrt        col = the white ground, dark = the patches, light = the tan points: e/e White and tan, E/e Tricolour, E/E (solid) White and black */
    dalmatian: {
      black: ['#FBF8F2', '#FFFFFF', '#1D1A22'], // * black spots
      liver: ['#FBF8F2', '#FFFFFF', '#7A3E22'], // liver spots
      blue:  ['#FBF8F2', '#FFFFFF', '#6E7F96'],
      lilac: ['#FBF8F2', '#FFFFFF', '#A8949A'],
      red:   ['#FBF8F2', '#FFFFFF', '#E0A040'], // lemon
      cream: ['#FBF8F2', '#FFFFFF', '#EED7A6']
    },
    bernese: {
      black: ['#2B2628', '#C8743A', '#1D1A1C'], // * tricolour: black, rust, white
      liver: ['#6E4430', '#D08A4E', '#4E2E1E'],
      blue:  ['#6E7F96', '#D9A066', '#55657A'],
      lilac: ['#A8949A', '#E0B48C', '#8A777E'],
      red:   ['#C8743A', '#E9A066', '#8A4A22'],
      cream: ['#EED7A6', '#FFF1D6', '#D6B27A']
    },
    aussie: {
      black:    ['#2B2430', '#4A3F4E', '#1D1A22'], // black (no copper)
      blackcu:  ['#2B2430', '#C8743A', '#1D1A22'], // * black and copper (the starter is Black tricolour: copper and white trim)
      liver:    ['#9A4E2A', '#B5683E', '#6E3315'], // red
      livercu:  ['#9A4E2A', '#E0A060', '#6E3315'], // red and copper
      blue:     ['#6E7F96', '#8C9BB0', '#55657A'],
      bluecu:   ['#6E7F96', '#D9A066', '#55657A'],
      lilac:    ['#A8949A', '#C2B2B7', '#8A777E'],
      lilaccu:  ['#A8949A', '#E0B48C', '#8A777E'],
      red:      ['#E9C27A', '#F6DFA8', '#C99A4E'], // yellow
      cream:    ['#F2E2C0', '#FFF4DE', '#D6C29A'],
      mblack:   ['#9AA6B6', '#B8C2CE', '#2B2430'], // blue merle
      mblackcu: ['#9AA6B6', '#D8742C', '#2B2430'], // blue merle with copper (v2.21 art fix: the copper more orange on the merle base)
      mliver:   ['#D9A07A', '#E8BC9C', '#6A2E14'], // red merle (v2.21 art fix: darker liver patches)
      mlivercu: ['#D9A07A', '#E2701E', '#6A2E14'],
      mblue:    ['#B3BCC8', '#D5DBE3', '#6E7F96'],
      mbluecu:  ['#B3BCC8', '#DC843A', '#6E7F96'],
      mlilac:   ['#C9B8BC', '#E0D3D6', '#A8949A'],
      mlilaccu: ['#C9B8BC', '#E0945A', '#A8949A']
    },
    cavalier: {
      red:   ['#C8642E', '#E8A06A', '#8A3E1C'], // * Blenheim (chestnut on white) or Ruby
      black: ['#2B2430', '#C8743A', '#1D1A22'], // tricolour or black and tan
      liver: ['#6E4430', '#C8843E', '#4E2E1E'],
      blue:  ['#6E7F96', '#D9A066', '#55657A'],
      lilac: ['#A8949A', '#E0B48C', '#8A777E'],
      cream: ['#EAC48E', '#F6DDB4', '#C99A5E']
    },
    jrt: {
      red:   ['#FBF8F2', '#E0A050', '#C97A32'], // * white and tan
      cream: ['#FBF8F2', '#F2D49A', '#E0BC78'], // white and lemon
      black: ['#FBF8F2', '#D08A44', '#2B2430'], // tricolour: black patches, tan points
      solid: ['#FBF8F2', '#FFFFFF', '#2B2430'], // white and black
      liver: ['#FBF8F2', '#D08A44', '#7A4A2E'],
      blue:  ['#FBF8F2', '#D9A066', '#6E7F96'],
      lilac: ['#FBF8F2', '#E0B48C', '#A8949A']
    },
    mutt: {
      black: ['#1D1A22', '#FFFFFF', '#1D1A22'], // *
      liver: ['#6E3D22', '#FFFFFF', '#4E2A16'],
      blue:  ['#5E6F86', '#FFFFFF', '#46556A'],
      lilac: ['#9C8A92', '#FFFFFF', '#7E6D75'],
      red:   ['#D9822E', '#FFFFFF', '#A65E1E'],
      cream: ['#EED2A0', '#FFFFFF', '#CFAE76']
    }
  };

  // Plain-language colour words per breed and pigment.
  const WORDS = {
    shiba:  { red: 'Red', cream: 'Cream', black: 'Black and tan', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    corgi:  { red: 'Red', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    golden: { red: 'Golden', fox: 'Dark golden', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    dachs:  { red: 'Red', cream: 'Cream', black: 'Black and tan', liver: 'Chocolate and tan', blue: 'Blue and tan', lilac: 'Isabella' },
    husky:  { red: 'Red', cream: 'Cream', black: 'Grey', liver: 'Copper', blue: 'Blue', lilac: 'Lilac' },
    mutt:   { red: 'Red', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    chihuahua: { red: 'Fawn', cream: 'Cream', black: 'Black and tan', liver: 'Chocolate and tan', blue: 'Blue and tan', lilac: 'Lilac and tan' },
    pug:       { red: 'Fawn', apricot: 'Apricot', cream: 'Silver fawn', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    greyhound: { red: 'Fawn', redliver: 'Red', cream: 'Blue fawn', black: 'Black', liver: 'Liver', blue: 'Blue', lilac: 'Lilac' },
    beagle:    { red: 'Red', cream: 'Lemon', black: 'Tricolour', liver: 'Chocolate tricolour', blue: 'Blue tricolour', lilac: 'Lilac tricolour' },
    poodle:    { red: 'Apricot', cream: 'White', redliver: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Silver', lilac: 'Silver beige' },
    collie:    { red: 'Red', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    samoyed:   { red: 'White', redliver: 'Cream', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    frenchie:  { red: 'Fawn', cream: 'Blue fawn', redliver: 'Cream', black: 'Dark fawn', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    akita:     { red: 'Red', cream: 'White', black: 'Sesame', liver: 'Dark sesame', blue: 'Ash sesame', lilac: 'Pale sesame' },
    spitz:     { red: 'White', redliver: 'Cream', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    pom:       { red: 'Orange', cream: 'Cream', redliver: 'White', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    afghan:    { cream: 'Cream', red: 'Red', black: 'Black and tan', solid: 'Black', liver: 'Chocolate', blue: 'Silver', lilac: 'Lilac' },
    dane:      { red: 'Fawn', cream: 'Pale fawn', black: 'Black', liver: 'Brindle', blue: 'Blue', lilac: 'Pale brindle' },
    mastiff:   { red: 'Fawn', apricot: 'Apricot', cream: 'Pale fawn', black: 'Brindle', liver: 'Dark brindle', blue: 'Silver brindle', lilac: 'Pale brindle' },
    gsd:       { black: 'Black and tan', solid: 'Black', red: 'Sable', cream: 'White', liver: 'Liver and tan', blue: 'Blue and tan', lilac: 'Lilac and tan' },
    // v2.12 breeds
    dobie:     { black: 'Black and rust', liver: 'Red and rust', blue: 'Blue and rust', lilac: 'Fawn and rust', red: 'Golden', cream: 'Cream' },
    corso:     { black: 'Black', blue: 'Grey', red: 'Fawn', redliver: 'Red', cream: 'Grey fawn', liver: 'Black brindle', lilac: 'Grey brindle' },
    pitbull:   { blue: 'Blue', black: 'Black', red: 'Fawn', redliver: 'Red', cream: 'Blue fawn', liver: 'Brindle', lilac: 'Blue brindle', white: 'White' },
    minpin:    { red: 'Red', cream: 'Cream', black: 'Black and rust', liver: 'Chocolate and rust', blue: 'Blue and rust', lilac: 'Fawn and rust' },
    lab:       { red: 'Yellow', fox: 'Fox red', cream: 'Champagne', black: 'Black', liver: 'Chocolate', blue: 'Charcoal', lilac: 'Silver' },
    malamute:  { black: 'Grey', solid: 'Black', liver: 'Red', red: 'Sable', cream: 'White', blue: 'Blue', lilac: 'Silver' },
    chow:      { red: 'Red', cream: 'Cream', black: 'Black', liver: 'Cinnamon', blue: 'Blue', lilac: 'Fawn' },
    stdpoodle: { red: 'Apricot', deep: 'Red', cream: 'White', redliver: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Silver', dblue: 'Blue', lilac: 'Silver beige' },
    schnauzer: { black: 'Salt and pepper', solid: 'Black', blue: 'Black and silver', red: 'White', cream: 'White', liver: 'Chocolate', lilac: 'Lilac' },
    westie:    { red: 'White', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    yorkie:    { blue: 'Blue and tan', black: 'Black and tan', liver: 'Chocolate and tan', lilac: 'Lilac and tan', red: 'Gold', cream: 'Cream' },
    bichon:    { red: 'White', redliver: 'Cream', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    maltese:   { red: 'White', cream: 'Cream', black: 'Black', liver: 'Chocolate', blue: 'Blue', lilac: 'Lilac' },
    shihtzu:   { red: 'Gold', cream: 'Cream', black: 'Black', brindle: 'Brindle', liver: 'Liver', blue: 'Silver', lilac: 'Lilac' },
    // v2.21 breeds (V221.md 3): the Aussie's copper and white are words added by coatNameFor (COPPER), the Cavalier's parti names are PARTI_BY
    dalmatian: { black: 'Black spotted', liver: 'Liver spotted', blue: 'Blue spotted', lilac: 'Lilac spotted', red: 'Lemon spotted', cream: 'Pale lemon spotted' },
    bernese:   { black: 'Tricolour', liver: 'Chocolate tricolour', blue: 'Blue tricolour', lilac: 'Lilac tricolour', red: 'Red', cream: 'Cream' },
    aussie:    { black: 'Black', liver: 'Red', blue: 'Blue', lilac: 'Lilac', red: 'Yellow', cream: 'Cream' },
    cavalier:  { red: 'Ruby', black: 'Black and tan', liver: 'Chocolate and tan', blue: 'Blue and tan', lilac: 'Lilac and tan', cream: 'Cream' },
    jrt:       { red: 'White and tan', cream: 'White and lemon', black: 'Tricolour', solid: 'White and black', liver: 'Chocolate tricolour', blue: 'Blue tricolour', lilac: 'Lilac tricolour' }
  };
  // Merle names follow the doc: named after the base pigment (dachshund merle is called "dapple").
  const MERLE_WORDS = { black: 'Black merle', liver: 'Liver merle', blue: 'Slate merle', lilac: 'Lilac merle' };
  const DAPPLE_WORDS = { black: 'Black dapple', liver: 'Chocolate dapple', blue: 'Blue dapple', lilac: 'Isabella dapple' };
  // Border Collie merles go by their show names (v2.5).
  const MERLE_BY = { collie: { black: 'Blue merle', liver: 'Red merle', blue: 'Slate merle', lilac: 'Lilac merle' },
    dane: { black: 'Merle', liver: 'Brindle merle', blue: 'Blue merle', lilac: 'Pale merle' }, // v2.11
    aussie: { black: 'Blue merle', liver: 'Red merle', blue: 'Slate merle', lilac: 'Lilac merle' } }; // v2.21
  // Breeds whose art always shows white breed markings (corgi blaze/chest, husky mask/belly, collie collar and blaze).
  const WHITE_MARKED = { corgi: true, husky: true, beagle: true, collie: true, malamute: true, bernese: true }; // v2.21 bernese: the white blaze and chest
  // Beagle tricolours already say the white; no suffix.
  const TRI = { beagle: { black: 1, liver: 1, blue: 1, lilac: 1 }, bernese: { black: 1, liver: 1, blue: 1, lilac: 1 } }; // v2.21: the Bernese tricolour too
  // v2.5: a Border Collie with no spotting gene (S/S) shows the tricolour pattern (the tan comes through where the white would be).
  const TRI_SOLID = { collie: { black: 'Tricolour', liver: 'Chocolate tricolour', blue: 'Blue tricolour', lilac: 'Lilac tricolour' } };
  // v2.5: breeds with their own word for piebald (sp/sp). The black one is just the word, the others say the colour first.
  const PIED = { poodle: 'parti', frenchie: 'pied', pom: 'parti', dane: 'mantle', pitbull: 'pied', stdpoodle: 'parti', yorkie: 'parti' };
  // v2.11: merle on white is a Harlequin Great Dane; E/E black is a solid Black for these breeds (E/e is Black and tan)
  const HARLEQUIN = { dane: true }, SOLID_E = { afghan: true, gsd: true, malamute: true, schnauzer: true, jrt: true }; // v2.21 jrt: E/E White and black, E/e Tricolour
  // v2.11: the brindle look (no K locus): the art draws wavy stripes when coat.brindle is set (keyed by the shade key; v2.12 adds corso, pitbull, shihtzu)
  const BRINDLE = { dane: { liver: 1, lilac: 1 }, mastiff: { black: 1, liver: 1, blue: 1, lilac: 1 }, corso: { liver: 1, lilac: 1 }, pitbull: { liver: 1, lilac: 1 }, shihtzu: { brindle: 1 } };
  // Breed shade key for red pigment on b/b (liver nose): pug apricot, greyhound red, v2.5 cream.
  const RED_LIVER = { pug: 'apricot', greyhound: 'redliver', poodle: 'redliver', samoyed: 'redliver', frenchie: 'redliver', spitz: 'redliver', pom: 'redliver', mastiff: 'apricot',
    corso: 'redliver', pitbull: 'redliver', stdpoodle: 'redliver', bichon: 'redliver' };
  // v2.12: a shade that needs a double dose of a dominant allele (B/B or E/E) on one pigment, loosely the intensity genes: [locus, shade key]
  const DOUBLE = { stdpoodle: { red: ['B', 'deep'], blue: ['E', 'dblue'] }, shihtzu: { black: ['E', 'brindle'] } };
  // v2.12: sp/sp on a red or cream coat is all white (White Pit Bull); on a dark coat it stays pied
  const WHITE_SP = { pitbull: true };
  // v2.12: any white spotting gene says "and white" (Gold and white Shih Tzu); no spotting gene is the solid coat
  const AND_WHITE = { shihtzu: true };
  /* v2.21 (V221.md 3). WHITE_WORD: the coat word already says the white (a white dog with spots or patches), so no spotting gene adds a word.
     COPPER: copper points on a dark coat are at_ (the tan-point locus TAN, independent of E; shade key <pigment>'cu'), white trim is any spotting gene, and the name says
     "<coat> and copper", "<coat> and white" or "<coat> tricolour" (both). WHITE_TRIM caps the white to the trim (sp/sp draws like S/sp).
     PARTI_BY: sp/sp is the parti coat with its own name (Blenheim, Tricolour); S/S and S/sp are the whole colours (Ruby, Black and tan). */
  const WHITE_WORD = { dalmatian: true, jrt: true }, COPPER = { aussie: true }, WHITE_TRIM = { aussie: 0.25 };
  const PARTI_BY = { cavalier: { red: 'Blenheim', black: 'Tricolour', liver: 'Chocolate tricolour', blue: 'Blue tricolour', lilac: 'Lilac tricolour', cream: 'Lemon and white' } };

  /* ---------- helpers ---------- */
  const has = (pair, allele) => !!pair && (pair[0] === allele || pair[1] === allele);
  const both = (pair, allele) => !!pair && pair[0] === allele && pair[1] === allele;
  const breedOf = (k) => (BREEDS.indexOf(k) >= 0 ? k : 'mutt');
  function hashStr(s) { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mulberry(seed) { let a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const rngOf = (rng) => (typeof rng === 'function' ? rng : Math.random);
  function normGenes(g) {
    const d = STARTER_GENES.mutt, out = {};
    LOCUS_KEYS.forEach((k) => { const p = g && Array.isArray(g[k]) && g[k].length === 2 ? g[k] : d[k]; out[k] = [p[0], p[1]]; });
    if (g && tanOk(g.A)) out.A = [g.A[0], g.A[1]]; // v2.21: only when the genes carry the tan-point locus
    if (g && redOk(g.I)) out.I = [g.I[0], g.I[1]]; // tan-points branch: only when the genes carry the red-intensity locus
    return out;
  }
  const genesOf = (x) => (x && x.genes ? x.genes : x);
  const genesKey = (g) => LOCUS_KEYS.map((k) => g[k].join('')).join('|');

  function shadeKey(g, breed, pig) {
    if (pig === 'black' && SOLID_E[breed] && both(g.E, 'E')) return 'solid';
    if (COPPER[breed] && pig !== 'red' && pig !== 'cream' && !both(tanOf(g), 'a')) return pig + 'cu'; // v2.21 aussie: copper points (at_, the tan-point locus; independent of E)
    if (WHITE_SP[breed] && both(g.S, 'sp') && (pig === 'red' || pig === 'cream')) return 'white'; // v2.12
    if (INTENSE[breed] && pig === 'red' && has(redOf(g), 'I')) return 'fox'; // the deep red (RED_I; I/i draws the fox1 shade under the same name)
    const dd = DOUBLE[breed] && DOUBLE[breed][pig]; // v2.12
    if (dd && both(g[dd[0]], dd[0])) return dd[1];
    return pig === 'red' && both(g.B, 'b') && RED_LIVER[breed] ? RED_LIVER[breed] : pig;
  }

  /** Visible pigment class: 'red' | 'cream' | 'black' | 'liver' | 'blue' | 'lilac'. */
  function pigment(genes) {
    const g = normGenes(genesOf(genes)), dil = both(g.D, 'd');
    if (both(g.E, 'e')) return dil ? 'cream' : 'red';
    const liver = both(g.B, 'b');
    if (dil) return liver ? 'lilac' : 'blue';
    return liver ? 'liver' : 'black';
  }

  // Visible coat bits shared by phenotype() and the label builder.
  function coatBits(g, breed) {
    const pig = pigment(g), sk = shadeKey(g, breed, pig), merleAllele = has(g.M, 'M');
    const merle = merleAllele && pig !== 'red' && pig !== 'cream'; // cryptic merle hides on e/e
    const white = both(g.S, 'sp') ? 0.6 : has(g.S, 'sp') ? 0.25 : 0;
    return { pig, sk, merleAllele, merle, white };
  }
  /* The coat name. loc = false builds the canonical English text (what phenotype().coatName always was); loc = true builds the
     same coat from the same words in the current language (data.words.<breed>.<shade>, data.merle_by..., mod.genes.* sentences).
     The rules read the English base word, so they behave the same in every language. */
  function coatNameFor(g, breed, pig, sk, merle, white, loc) {
    const was = plain; plain = !loc;
    try {
      let en, name;
      if (merle) {
        if (breed === 'dachs') { en = DAPPLE_WORDS[pig]; name = D('dapple_words.' + pig, en); }
        else if (MERLE_BY[breed]) { en = MERLE_BY[breed][pig]; name = D('merle_by.' + breed + '.' + pig, en); }
        else if (WHITE_WORD[breed]) { const wk = WORDS[breed][sk] ? sk : pig; en = WORDS[breed][wk] + ' merle'; name = L('mod.genes.coat_merle', '{coat} merle', { coat: D('words.' + breed + '.' + wk, WORDS[breed][wk]) }); } // v2.21 code review 3: a merle Dalmatian or Jack Russell body (an Aussie mix) keeps its own word ("Black spotted merle")
        else { en = MERLE_WORDS[pig]; name = D('merle_words.' + pig, en); }
      } else {
        const wk = WORDS[breed][sk] ? sk : pig;
        en = WORDS[breed][wk]; name = D('words.' + breed + '.' + wk, en);
      }
      const allWhite = !merle && en === 'White'; // v2.5: a white coat needs no white markings or patches in its name
      const pw = PIED[breed];
      if (merle && white === 0.6 && HARLEQUIN[breed]) name = L('mod.genes.harlequin', 'Harlequin');
      else if (sk === 'white') { /* v2.12: an all-white coat (WHITE_SP): "White" already says it */ }
      else if (COPPER[breed] && !allWhite) { // v2.21 aussie: copper (shade key ...cu) and white trim (any spotting gene)
        const cu = /cu$/.test(sk);
        if (cu && white) name = L('mod.genes.coat_tricolour', '{coat} tricolour', { coat: name });
        else if (cu) name = L('mod.genes.coat_and_copper', '{coat} and copper', { coat: name });
        else if (white) name = L('mod.genes.coat_and_white', '{coat} and white', { coat: name });
      }
      else if (WHITE_WORD[breed]) { /* v2.21 dalmatian, jrt: "Black spotted", "White and tan" already say the white */ }
      else if (PARTI_BY[breed] && !merle) { if (white === 0.6) name = D('parti_by.' + breed + '.' + pig, PARTI_BY[breed][pig]); /* v2.21 cavalier: S/S and S/sp are the whole colours */ }
      else if (white === 0.6 && pw) {
        if ((pig === 'black' || allWhite) && !merle) name = pw === 'parti' ? L('mod.genes.pied_parti', 'Parti') : pw === 'pied' ? L('mod.genes.pied_pied', 'Pied') : L('mod.genes.pied_mantle', 'Mantle');
        else name = pw === 'parti' ? L('mod.genes.coat_parti', '{coat} parti', { coat: name }) : pw === 'pied' ? L('mod.genes.coat_pied', '{coat} pied', { coat: name }) : L('mod.genes.coat_mantle', '{coat} mantle', { coat: name });
      }
      else if (allWhite) { /* "White" already says it */ }
      else if (AND_WHITE[breed] && white) name = L('mod.genes.coat_and_white', '{coat} and white', { coat: name }); // v2.12
      else if (white < 0.6 && !merle && tanShows(g, breed, pig)) name = breed === 'corgi' && pig === 'black' ? L('mod.genes.coat_black_headed_tri', 'Black-headed tricolour') : D('tri_solid.collie.' + pig, TRI_SOLID.collie[pig]); // tan points: the collie's tricolours, the Pembroke's black-headed tricolour
      else if (white === 0.6) name = L('mod.genes.coat_piebald', '{coat} & white piebald', { coat: name });
      else if (TRI_SOLID[breed] && !merle && !white && TRI_SOLID[breed][pig]) name = D('tri_solid.' + breed + '.' + pig, TRI_SOLID[breed][pig]);
      else if (MERLE_BY[breed] && merle) { /* "Blue merle" already says the white */ }
      else if (TRI[breed] && TRI[breed][pig] && !merle) { /* "Tricolour" already includes white */ }
      else if (breed === 'shiba' && !merle) name = white ? L('mod.genes.coat_urajiro_white', '{coat} with cream urajiro and white markings', { coat: name }) : L('mod.genes.coat_urajiro', '{coat} with cream urajiro', { coat: name });
      else if (WHITE_MARKED[breed]) name = L('mod.genes.coat_and_white', '{coat} and white', { coat: name });
      else if (white === 0.25) name = L('mod.genes.coat_white_markings', '{coat} with white markings', { coat: name });
      return name;
    } finally { plain = was; }
  }

  /**
   * phenotype(genes, breedKey, seed?) -> { coatName, eyes, coat:{base, light, dark, white, merle, eyes}, pigment, merleHidden }
   * seed (optional, e.g. the dog's id) makes the per-dog eye rolls stable; without it the genotype itself is the seed.
   */
  function phenotype(genes, breedKey, seed) {
    const breed = breedOf(breedKey), g = normGenes(genesOf(genes)), pig = pigment(g);
    // breed-specific shade keys: pug apricot (e/e + b/b), greyhound red (e/e + b/b, liver nose), v2.5 cream
    const sk = shadeKey(g, breed, pig);
    const merleAllele = has(g.M, 'M');
    const merle = merleAllele && pig !== 'red' && pig !== 'cream'; // cryptic merle hides on e/e
    // v2.5: a breed may give its merles a lighter base (collie blue merle is grey under the dark patches); 'm' + pigment keys
    let shade = (merle && (SHADES[breed]['m' + sk] || SHADES[breed]['m' + pig])) || SHADES[breed][sk] || SHADES[breed][pig]; // v2.21: 'm' + shade key first (the Aussie's mblackcu); no older breed has one
    if (sk === 'fox' && !both(g.I, 'I') && SHADES[breed].fox1) shade = SHADES[breed].fox1; // RED_I: I/i is the shade in between
    const white = both(g.S, 'sp') ? 0.6 : has(g.S, 'sp') ? 0.25 : 0;

    // eyes: Bl first, then visible merle, then b/b, else brown
    const r = mulberry(hashStr((seed == null ? genesKey(g) : String(seed)) + '|eyes|' + breed));
    let eyes = 'brown';
    if (has(g.Bl, 'Bl')) eyes = both(g.Bl, 'Bl') ? 'blue' : (r() < 0.25 ? 'odd' : 'blue');
    else if (merle) { const x = r(); eyes = x < 0.15 ? 'odd' : x < 0.25 ? 'blue' : (both(g.B, 'b') ? 'amber' : 'brown'); }
    else if (both(g.B, 'b')) eyes = 'amber';

    // name (English: the stored, canonical text; coatLabel() gives the same coat in the current language)
    const name = coatNameFor(g, breed, pig, sk, merle, white, false);

    const coat = { base: shade[0], light: shade[1], dark: shade[2], white, merle, eyes };
    if (AND_WHITE[breed] && !white && shade[3]) coat.light = shade[3];
    if (WHITE_TRIM[breed] && coat.white > WHITE_TRIM[breed]) coat.white = WHITE_TRIM[breed]; // v2.21 aussie: white trim only // v2.12: a solid Shih Tzu (no spotting gene) has no white blaze, chest or skirt
    // v2.11: a Great Dane's light is its chest and collar, so white markings show it white (solid coats keep a light close to the base);
    // merle on white is the harlequin look: black patches (base and dark) on a white dog
    if (breed === 'dane' && white > 0) coat.light = '#FFFFFF';
    if (breed === 'dane' && merle && white >= 0.6) { coat.base = '#2A2628'; coat.dark = '#2A2628'; }
    if (tanShows(g, breed, pig)) coat.tan = TAN_SHADE[pig]; // tan points (TAN_ART): only a collie or corgi whose genes carry at_ has this key
    if (BRINDLE[breed] && BRINDLE[breed][sk] && !merle) coat.brindle = true; // only the BRINDLE breeds ever have this key (by shade key: the same as the pigment for dane and mastiff)
    return {
      coatName: name,
      eyes,
      coat,
      pigment: pig,
      merleHidden: merleAllele && !merle
    };
  }

  /* ---------- display labels (v2.14) ---------- */
  // English coat name -> the genotype bits that make it, per body breed (162 combinations, built once per breed, only when a non-English label is asked)
  const nameMaps = {};
  function nameMap(breed) {
    if (nameMaps[breed]) return nameMaps[breed];
    const m = {}, loci = ['B', 'D', 'E', 'S', 'M'];
    (function rec(i, g) {
      if (i === loci.length) {
        const gg = normGenes(Object.assign({ Bl: ['bl', 'bl'] }, g)), b = coatBits(gg, breed);
        const en = coatNameFor(gg, breed, b.pig, b.sk, b.merle, b.white, false);
        if (!m[en]) m[en] = { g: gg, pig: b.pig, sk: b.sk, merle: b.merle, white: b.white };
        return;
      }
      ALL_PAIRS[loci[i]].forEach((pr) => { g[loci[i]] = pr; rec(i + 1, g); });
    })(0, {});
    // the tan-point and red-intensity coats (TAN_ART, INTENSE) after every older one, so no older name changes its genes
    const extra = (TAN_ART[breed] ? [{ A: ['at', 'at'] }] : []).concat(INTENSE[breed] ? [{ I: ['I', 'I'] }] : []);
    extra.forEach((x) => (function rec(i, g) {
      if (i === loci.length) {
        const gg = normGenes(Object.assign({ Bl: ['bl', 'bl'] }, g, x)), b = coatBits(gg, breed);
        const en = coatNameFor(gg, breed, b.pig, b.sk, b.merle, b.white, false);
        if (!m[en]) m[en] = { g: gg, pig: b.pig, sk: b.sk, merle: b.merle, white: b.white };
        return;
      }
      ALL_PAIRS[loci[i]].forEach((pr) => { g[loci[i]] = pr; rec(i + 1, g); });
    })(0, {}));
    return (nameMaps[breed] = m);
  }
  /** coatLabel(coatName, breedKey?) -> the coat name in the current language. coatName is the English text phenotype() gives (and the game
      stores); breedKey is the body breed (d.key), which picks the right word table. Unknown text comes back unchanged; in English it is a no-op. */
  function coatLabel(name, breedKey) {
    name = String(name == null ? '' : name);
    if (!name || isEn()) return name;
    const one = (b) => { const e = nameMap(b)[name]; return e ? coatNameFor(e.g, b, e.pig, e.sk, e.merle, e.white, true) : null; };
    let r = breedKey != null ? one(breedOf(breedKey)) : null;
    if (r == null) for (let i = 0; i < BREEDS.length && r == null; i++) r = one(BREEDS[i]);
    return r == null ? name : r;
  }

  /* ---------- random rescue genotypes (breed-appropriate allele frequencies) ---------- */
  // frequency of the recessive / special allele per locus; M = chance of being M/m (never M/M)
  const FREQ = {
    shiba:  { b: 0.20, d: 0.15, e: 0.85, sp: 0.05, M: 0,    Bl: 0 },
    corgi:  { b: 0.10, d: 0.10, e: 0.75, sp: 0.40, M: 0.15, Bl: 0 },
    golden: { b: 0.15, d: 0.05, e: 1.00, sp: 0.02, M: 0,    Bl: 0 },
    dachs:  { b: 0.60, d: 0.25, e: 0.30, sp: 0.05, M: 0.15, Bl: 0 },
    husky:  { b: 0.15, d: 0.15, e: 0.30, sp: 0.40, M: 0,    Bl: 0.80 },
    mutt:   { b: 0.30, d: 0.25, e: 0.40, sp: 0.50, M: 0.15, Bl: 0.05 },
    chihuahua: { b: 0.25, d: 0.20, e: 0.55, sp: 0.30, M: 0.10, Bl: 0 },  // almost any colour; merle about 10%
    pug:       { b: 0.15, d: 0.08, e: 0.90, sp: 0,    M: 0,    Bl: 0 },  // mostly fawn, about 19% black, rare apricot/silver; no merle, no piebald
    greyhound: { b: 0.20, d: 0.35, e: 0.50, sp: 0.35, M: 0,    Bl: 0 },  // black, blue, fawn, red, white-spotted; no merle (brindle not modelled)
    beagle:    { b: 0.10, d: 0.05, e: 0.35, sp: 0.40, M: 0,    Bl: 0 },  // mostly tricolour, some red/lemon and white; no merle
    // v2.5 breeds
    poodle:    { b: 0.30, d: 0.25, e: 0.45, sp: 0.10, M: 0,    Bl: 0 },  // black, apricot, chocolate, silver, white, cream, parti; no merle
    collie:    { b: 0.25, d: 0.05, e: 0.10, sp: 0.50, M: 0.20, Bl: 0 },  // black and white, tricolour, chocolate, rare red; merle 20%
    samoyed:   { b: 0.15, d: 0,    e: 1.00, sp: 0,    M: 0,    Bl: 0 },  // always white, sometimes cream (b/b)
    frenchie:  { b: 0.10, d: 0.20, e: 0.72, sp: 0.35, M: 0,    Bl: 0 },  // fawn, dark fawn, pied, blue fawn, cream; no merle
    // v2.11 breeds
    akita:     { b: 0.20, d: 0.20, e: 0.62, sp: 0,    M: 0,    Bl: 0 },  // red, sesame, rare dark sesame and white; no merle, no piebald
    spitz:     { b: 0.15, d: 0,    e: 1.00, sp: 0,    M: 0,    Bl: 0 },  // always white, sometimes cream (b/b)
    pom:       { b: 0.20, d: 0.12, e: 0.50, sp: 0.15, M: 0,    Bl: 0 },  // orange, cream, black, chocolate, white, blue, parti; no merle
    afghan:    { b: 0.15, d: 0.25, e: 0.45, sp: 0,    M: 0,    Bl: 0 },  // cream, red, black, black and tan, silver; no merle, no piebald
    dane:      { b: 0.35, d: 0.25, e: 0.50, sp: 0.30, M: 0.20, Bl: 0 },  // fawn, brindle look, black, blue, mantle, merle, harlequin; merle 20% (never M/M)
    mastiff:   { b: 0.30, d: 0,    e: 0.80, sp: 0,    M: 0,    Bl: 0 },  // fawn, apricot, brindle look; no dilute, no merle
    gsd:       { b: 0.10, d: 0.15, e: 0.55, sp: 0,    M: 0,    Bl: 0 },  // black and tan, sable, black, white; no merle, no piebald
    // v2.12 breeds: no merle in any of them (M 0), so no double merle can arise
    dobie:     { b: 0.35, d: 0.25, e: 0,    sp: 0,    M: 0,    Bl: 0 },  // black, red, blue and fawn, always with rust points; no white
    corso:     { b: 0.30, d: 0.35, e: 0.50, sp: 0,    M: 0,    Bl: 0 },  // black, grey, fawn, red, the brindle looks
    pitbull:   { b: 0.30, d: 0.45, e: 0.50, sp: 0.35, M: 0,    Bl: 0 },  // blue, black, fawn, red, brindle, white, pied, blue fawn
    minpin:    { b: 0.25, d: 0,    e: 0.70, sp: 0,    M: 0,    Bl: 0 },  // red, black and rust, chocolate and rust
    lab:       { b: 0.35, d: 0,    e: 0.55, sp: 0,    M: 0,    Bl: 0 },  // yellow, black, chocolate
    malamute:  { b: 0.20, d: 0.20, e: 0.50, sp: 0,    M: 0,    Bl: 0 },  // grey, black, red, sable and white, white
    chow:      { b: 0.20, d: 0.25, e: 0.75, sp: 0,    M: 0,    Bl: 0 },  // red, black, blue, cinnamon, cream
    stdpoodle: { b: 0.30, d: 0.25, e: 0.45, sp: 0.10, M: 0,    Bl: 0 },  // the poodle's colours plus red and blue
    schnauzer: { b: 0,    d: 0.30, e: 0.45, sp: 0,    M: 0,    Bl: 0 },  // salt and pepper, black and silver, black, white
    westie:    { b: 0,    d: 0,    e: 1.00, sp: 0,    M: 0,    Bl: 0 },  // always white
    yorkie:    { b: 0,    d: 0.75, e: 0,    sp: 0.30, M: 0,    Bl: 0 },  // blue and tan, black and tan, parti
    bichon:    { b: 0.15, d: 0,    e: 1.00, sp: 0,    M: 0,    Bl: 0 },  // always white, sometimes cream (b/b)
    maltese:   { b: 0,    d: 0,    e: 1.00, sp: 0,    M: 0,    Bl: 0 },  // always white
    shihtzu:   { b: 0.20, d: 0.15, e: 0.75, sp: 0.70, M: 0,    Bl: 0 },  // gold, black, brindle, liver and silver, mostly with white
    // v2.21 breeds (V221.md 3): only the Aussie carries merle (M/m at most; isDoubleMerle blocks two carriers, hidden merle on yellow too)
    dalmatian: { b: 0.35, d: 0,    e: 0,    sp: 1.00, M: 0,    Bl: 0 },    // black or liver spots, always on white
    bernese:   { b: 0,    d: 0,    e: 0,    sp: 0,    M: 0,    Bl: 0 },    // tricolour, always
    aussie:    { b: 0.45, d: 0,    e: 0.10, sp: 0.70, M: 0.35, Bl: 0.10, a: 0.30 }, // black, red, blue merle, red merle, mostly tricolour (a: no-copper, TAN); rare yellow (1%); some blue eyes
    cavalier:  { b: 0,    d: 0,    e: 0.75, sp: 0.80, M: 0,    Bl: 0 },    // Blenheim, tricolour, ruby, black and tan
    jrt:       { b: 0,    d: 0,    e: 0.70, sp: 1.00, M: 0,    Bl: 0 }     // white with tan, white with black, tricolour
  };
  function randomGenotype(breedKey, rng) {
    const R = rngOf(rng), f = FREQ[breedOf(breedKey)];
    const pick = (rec, dom, p) => (R() < p ? rec : dom);
    const pair = (rec, dom, p) => { const a = pick(rec, dom, p), b = pick(rec, dom, p); return a === dom || b !== dom ? [a, b] : [b, a]; };
    return {
      B: pair('b', 'B', f.b),
      D: pair('d', 'D', f.d),
      E: pair('e', 'E', f.e),
      S: pair('sp', 'S', f.sp),
      M: R() < f.M ? ['M', 'm'] : ['m', 'm'],
      Bl: pair('bl', 'Bl', 1 - f.Bl),
      ...(f.a > 0 ? { A: pair('a', 'at', f.a) } : {}) // v2.21: the tan-point locus, drawn last and only for a breed that has it (no older draw moves)
    };
  }

  /* ---------- inheritance (Mendelian: one allele per locus from each parent) ---------- */
  function inherit(mumGenes, dadGenes, rng) {
    const R = rngOf(rng), m = normGenes(genesOf(mumGenes)), d = normGenes(genesOf(dadGenes)), out = {};
    LOCUS_KEYS.forEach((k) => { out[k] = [m[k][R() < 0.5 ? 0 : 1], d[k][R() < 0.5 ? 0 : 1]]; });
    if (m.A || d.A) { const ma = tanOf(m), da = tanOf(d); out.A = [ma[R() < 0.5 ? 0 : 1], da[R() < 0.5 ? 0 : 1]]; } // v2.21: only when a parent carries the tan-point locus (drawn last)
    if (m.I || d.I) { const mi = redOf(m), di = redOf(d); out.I = [mi[R() < 0.5 ? 0 : 1], di[R() < 0.5 ? 0 : 1]]; if (out.I[0] === 'i' && out.I[1] === 'I') out.I = ['I', 'i']; } // red intensity: only when a parent carries it (drawn after A, so no older draw moves)
    return out;
  }

  /** true when the pair could make a double-merle (M/M) puppy: both carry M, visible or hidden (cryptic merle on e/e). */
  function isDoubleMerle(a, b) {
    const ga = normGenes(genesOf(a)), gb = normGenes(genesOf(b));
    return has(ga.M, 'M') && has(gb.M, 'M');
  }

  /* ---------- relatives check ----------
     Blocks: same dog, parent/child, full or half siblings, grandparent/grandchild,
     aunt/uncle/niece/nephew, first cousins. (Second cousins and great-grandparents are allowed.)
     Implemented as: the two dogs share any ancestor within 2 generations (each dog counts as its own
     generation-0 ancestor). dog = { id, parents: [idA, idB] | null }; allDogs = array or { id: dog } map. */
  function related(dogA, dogB, allDogs) {
    if (!dogA || !dogB) return false;
    if (dogA.id != null && dogA.id === dogB.id) return true;
    const byId = {};
    if (Array.isArray(allDogs)) allDogs.forEach((d) => { if (d && d.id != null) byId[d.id] = d; });
    else if (allDogs && typeof allDogs === 'object') Object.keys(allDogs).forEach((k) => { byId[k] = allDogs[k]; });
    [dogA, dogB].forEach((d) => { if (d.id != null && !byId[d.id]) byId[d.id] = d; });
    const anc = (dog) => {
      const seen = new Set(); let gen = [dog.id];
      for (let depth = 0; depth <= 2; depth++) {
        const next = [];
        gen.forEach((id) => {
          if (id == null) return; seen.add(id);
          const d = byId[id] || (id === dog.id ? dog : null);
          if (d && Array.isArray(d.parents)) d.parents.forEach((p) => { if (p != null) next.push(p); });
        });
        gen = next;
      }
      return seen;
    };
    const a = anc(dogA), b = anc(dogB);
    for (const id of a) if (b.has(id)) return true;
    return false;
  }

  /* =====================================================================
     v2 additions (GENES lane). Additive: nothing above changed, phenotype() is untouched.
     MIXES, BREED_NAMES, mixKey, mixOf, predict, coatCatalog, describe.
     ===================================================================== */
  const BREED_NAMES = { shiba: 'Shiba', corgi: 'Corgi', golden: 'Golden', dachs: 'Dachshund', husky: 'Husky', mutt: 'Mutt', chihuahua: 'Chihuahua', pug: 'Pug', greyhound: 'Greyhound', beagle: 'Beagle',
    poodle: 'Miniature Poodle', collie: 'Border Collie', samoyed: 'Samoyed', frenchie: 'French Bulldog',
    akita: 'Akita', spitz: 'Japanese Spitz', pom: 'Pomeranian', afghan: 'Afghan Hound', dane: 'Great Dane', mastiff: 'English Mastiff', gsd: 'German Shepherd',
    dobie: 'Doberman', corso: 'Cane Corso', pitbull: 'Pit Bull', minpin: 'Miniature Pinscher', lab: 'Labrador', malamute: 'Alaskan Malamute', chow: 'Chow Chow',
    stdpoodle: 'Standard Poodle', schnauzer: 'Miniature Schnauzer', westie: 'Westie', yorkie: 'Yorkshire Terrier', bichon: 'Bichon Frise', maltese: 'Maltese', shihtzu: 'Shih Tzu',
    dalmatian: 'Dalmatian', bernese: 'Bernese', aussie: 'Aussie', cavalier: 'Cavalier', jrt: 'Jack Russell' }; // v2.21 (the short names, like Golden and Westie)

  /** Canonical table key for a pair: the two breed keys in BREEDS order joined by '|', e.g. 'corgi|husky'. */
  function mixKey(a, b) {
    const x = breedOf(a), y = breedOf(b);
    return BREEDS.indexOf(x) <= BREEDS.indexOf(y) ? x + '|' + y : y + '|' + x;
  }
  /* All 595 pairs of the 35 breeds (45 of the first 10, v2.5 added 46, v2.11 added 45 with akita, spitz and pom, then 74 with afghan, dane, mastiff and gsd: 70 named, 4 mutt;
     v2.12 added 385 with the fourteen: 371 named, 14 mutt) -> { name, head }. head = the breed with the more striking head.
     Real portmanteaus where they exist; invented cute ones otherwise. Mutt pairs: "Mutt mix", head = the other breed
     (mixOf() applies the 50% mutt-head rule on top). */
  const MIX_LIST = [
    ['shiba', 'corgi', 'Shorgi', 'shiba'],         ['shiba', 'golden', 'Goldiba', 'shiba'],
    ['shiba', 'dachs', 'Shibadox', 'shiba'],       ['shiba', 'husky', 'Shusky', 'husky'],
    ['shiba', 'chihuahua', 'Chiba', 'chihuahua'],  ['shiba', 'pug', 'Pugiba', 'pug'],
    ['shiba', 'greyhound', 'Shibahound', 'shiba'], ['shiba', 'beagle', 'Shibeagle', 'shiba'],
    ['corgi', 'golden', 'Gorgi', 'corgi'],         ['corgi', 'dachs', 'Dorgi', 'corgi'],
    ['corgi', 'husky', 'Horgi', 'husky'],          ['corgi', 'chihuahua', 'Chigi', 'corgi'],
    ['corgi', 'pug', 'Porgi', 'pug'],              ['corgi', 'greyhound', 'Greygi', 'corgi'],
    ['corgi', 'beagle', 'Beagi', 'corgi'],         ['golden', 'dachs', 'Goldendox', 'dachs'],
    ['golden', 'husky', 'Goberian', 'husky'],      ['golden', 'chihuahua', 'Goldenchi', 'chihuahua'],
    ['golden', 'pug', 'Pugolden', 'pug'],          ['golden', 'greyhound', 'Goldhound', 'golden'],
    ['golden', 'beagle', 'Beago', 'golden'],       ['dachs', 'husky', 'Dusky', 'husky'],
    ['dachs', 'chihuahua', 'Chiweenie', 'chihuahua'], ['dachs', 'pug', 'Daug', 'pug'],
    ['dachs', 'greyhound', 'Greydox', 'dachs'],    ['dachs', 'beagle', 'Doxle', 'beagle'],
    ['husky', 'chihuahua', 'Chusky', 'husky'],     ['husky', 'pug', 'Hug', 'husky'],
    ['husky', 'greyhound', 'Greysky', 'husky'],    ['husky', 'beagle', 'Beaski', 'husky'],
    ['chihuahua', 'pug', 'Chug', 'pug'],           ['chihuahua', 'greyhound', 'Greyhuahua', 'chihuahua'],
    ['chihuahua', 'beagle', 'Cheagle', 'chihuahua'], ['pug', 'greyhound', 'Greypug', 'pug'],
    ['pug', 'beagle', 'Puggle', 'pug'],            ['greyhound', 'beagle', 'Greagle', 'beagle'],
    // v2.5: the four new breeds with the nine old non-mutt breeds (36), then among themselves (6)
    ['shiba', 'poodle', 'Shiba-poo', 'poodle'],    ['corgi', 'poodle', 'Corgipoo', 'corgi'],
    ['golden', 'poodle', 'Goldendoodle', 'poodle'], ['dachs', 'poodle', 'Doxiepoo', 'poodle'],
    ['husky', 'poodle', 'Huskypoo', 'husky'],      ['chihuahua', 'poodle', 'Chipoo', 'chihuahua'],
    ['pug', 'poodle', 'Pugapoo', 'pug'],           ['greyhound', 'poodle', 'Greydoodle', 'poodle'],
    ['beagle', 'poodle', 'Poogle', 'poodle'],
    ['corgi', 'collie', 'Borgi', 'collie'],        ['shiba', 'collie', 'Border Shiba', 'shiba'],
    ['golden', 'collie', 'Golden Collie', 'collie'], ['dachs', 'collie', 'Border Doxie', 'collie'],
    ['husky', 'collie', 'Border Husky', 'husky'],  ['chihuahua', 'collie', 'Border Chi', 'chihuahua'],
    ['pug', 'collie', 'Border Pug', 'pug'],        ['greyhound', 'collie', 'Border Grey', 'collie'],
    ['beagle', 'collie', 'Border Beagle', 'beagle'],
    ['husky', 'samoyed', 'Samusky', 'samoyed'],    ['shiba', 'samoyed', 'Sammy Shiba', 'samoyed'],
    ['corgi', 'samoyed', 'Sammy Corgi', 'corgi'],  ['golden', 'samoyed', 'Golden Sammy', 'samoyed'],
    ['dachs', 'samoyed', 'Sammy Doxie', 'samoyed'], ['chihuahua', 'samoyed', 'Sammy Chi', 'chihuahua'],
    ['pug', 'samoyed', 'Sammy Pug', 'pug'],        ['greyhound', 'samoyed', 'Sammy Grey', 'samoyed'],
    ['beagle', 'samoyed', 'Sammy Beagle', 'samoyed'],
    ['pug', 'frenchie', 'Frug', 'frenchie'],       ['shiba', 'frenchie', 'French Shiba', 'frenchie'],
    ['corgi', 'frenchie', 'French Corgi', 'corgi'], ['golden', 'frenchie', 'French Golden', 'frenchie'],
    ['dachs', 'frenchie', 'French Doxie', 'frenchie'], ['husky', 'frenchie', 'French Husky', 'husky'],
    ['chihuahua', 'frenchie', 'French Chi', 'frenchie'], ['greyhound', 'frenchie', 'French Grey', 'frenchie'],
    ['beagle', 'frenchie', 'French Beagle', 'beagle'],
    ['poodle', 'collie', 'Bordoodle', 'poodle'],   ['poodle', 'samoyed', 'Samoodle', 'poodle'],
    ['poodle', 'frenchie', 'Froodle', 'frenchie'], ['collie', 'samoyed', 'Border Sammy', 'collie'],
    ['collie', 'frenchie', 'French Collie', 'frenchie'], ['samoyed', 'frenchie', 'French Sammy', 'frenchie'],
    // v2.11: the three new breeds with the 13 old non-mutt breeds (39), then among themselves (3)
    ['shiba', 'akita', 'Shibakita', 'akita'],      ['corgi', 'akita', 'Corgikita', 'corgi'],
    ['golden', 'akita', 'Goldkita', 'akita'],      ['dachs', 'akita', 'Doxkita', 'dachs'],
    ['husky', 'akita', 'Huskita', 'husky'],        ['chihuahua', 'akita', 'Chikita', 'chihuahua'],
    ['pug', 'akita', 'Pugkita', 'pug'],            ['greyhound', 'akita', 'Greykita', 'akita'],
    ['beagle', 'akita', 'Beakita', 'beagle'],      ['poodle', 'akita', 'Akipoo', 'poodle'],
    ['collie', 'akita', 'Border Akita', 'collie'], ['samoyed', 'akita', 'Sammy Kita', 'samoyed'],
    ['frenchie', 'akita', 'French Akita', 'frenchie'],
    ['shiba', 'spitz', 'Spitziba', 'spitz'],       ['corgi', 'spitz', 'Spitzgi', 'corgi'],
    ['golden', 'spitz', 'Goldspitz', 'spitz'],     ['dachs', 'spitz', 'Spitzdox', 'dachs'],
    ['husky', 'spitz', 'Spitzky', 'husky'],        ['chihuahua', 'spitz', 'Chispitz', 'chihuahua'],
    ['pug', 'spitz', 'Pugspitz', 'pug'],           ['greyhound', 'spitz', 'Greyspitz', 'spitz'],
    ['beagle', 'spitz', 'Spitzle', 'beagle'],      ['poodle', 'spitz', 'Spitzpoo', 'poodle'],
    ['collie', 'spitz', 'Border Spitz', 'collie'], ['samoyed', 'spitz', 'Sammy Spitz', 'samoyed'],
    ['frenchie', 'spitz', 'French Spitz', 'frenchie'],
    ['shiba', 'pom', 'Pomiba', 'shiba'],           ['corgi', 'pom', 'Pomgi', 'corgi'],
    ['golden', 'pom', 'Golden Pom', 'golden'],     ['dachs', 'pom', 'Pomdox', 'dachs'],
    ['husky', 'pom', 'Pomsky', 'husky'],           ['chihuahua', 'pom', 'Pomchi', 'pom'],
    ['pug', 'pom', 'Pugeranian', 'pug'],           ['greyhound', 'pom', 'Pomhound', 'greyhound'],
    ['beagle', 'pom', 'Pomagle', 'beagle'],        ['poodle', 'pom', 'Pomapoo', 'poodle'],
    ['collie', 'pom', 'Border Pom', 'collie'],     ['samoyed', 'pom', 'Sammy Pom', 'samoyed'],
    ['frenchie', 'pom', 'French Pom', 'frenchie'],
    ['akita', 'spitz', 'Spitzkita', 'akita'],      ['akita', 'pom', 'Pomkita', 'akita'],
    ['spitz', 'pom', 'Pomspitz', 'spitz'],
    // v2.11 (the owner's four more): the big breeds with the 16 older non-mutt breeds (64), then among themselves (6)
    ['shiba', 'afghan', 'Afghan Shiba', 'shiba'], ['corgi', 'afghan', 'Afghan Corgi', 'corgi'],
    ['golden', 'afghan', 'Golden Afghan', 'afghan'], ['dachs', 'afghan', 'Afghan Doxie', 'dachs'],
    ['husky', 'afghan', 'Afghusky', 'husky'], ['chihuahua', 'afghan', 'Afghan Chi', 'chihuahua'],
    ['pug', 'afghan', 'Afghan Pug', 'pug'], ['greyhound', 'afghan', 'Afghan Grey', 'afghan'],
    ['beagle', 'afghan', 'Afghan Beagle', 'beagle'], ['poodle', 'afghan', 'Afghandoodle', 'poodle'],
    ['collie', 'afghan', 'Afghan Collie', 'collie'], ['samoyed', 'afghan', 'Afghan Sammy', 'samoyed'],
    ['frenchie', 'afghan', 'French Afghan', 'frenchie'], ['akita', 'afghan', 'Afghan Akita', 'afghan'],
    ['spitz', 'afghan', 'Afghan Spitz', 'spitz'], ['pom', 'afghan', 'Afghan Pom', 'pom'],
    ['shiba', 'dane', 'Dane Shiba', 'shiba'], ['corgi', 'dane', 'Dane Corgi', 'corgi'],
    ['golden', 'dane', 'Golden Dane', 'dane'], ['dachs', 'dane', 'Dane Doxie', 'dachs'],
    ['husky', 'dane', 'Dane Husky', 'husky'], ['chihuahua', 'dane', 'Dane Chi', 'chihuahua'],
    ['pug', 'dane', 'Dane Pug', 'pug'], ['greyhound', 'dane', 'Dane Grey', 'dane'],
    ['beagle', 'dane', 'Dane Beagle', 'beagle'], ['poodle', 'dane', 'Daneoodle', 'poodle'],
    ['collie', 'dane', 'Border Dane', 'collie'], ['samoyed', 'dane', 'Sammy Dane', 'samoyed'],
    ['frenchie', 'dane', 'French Dane', 'frenchie'], ['akita', 'dane', 'Akita Dane', 'dane'],
    ['spitz', 'dane', 'Spitz Dane', 'spitz'], ['pom', 'dane', 'Pom Dane', 'pom'],
    ['shiba', 'mastiff', 'Mastiba', 'shiba'], ['corgi', 'mastiff', 'Mastigi', 'corgi'],
    ['golden', 'mastiff', 'Golden Mastiff', 'mastiff'], ['dachs', 'mastiff', 'Mastidox', 'dachs'],
    ['husky', 'mastiff', 'Mastusky', 'husky'], ['chihuahua', 'mastiff', 'Mastichi', 'chihuahua'],
    ['pug', 'mastiff', 'Mastipug', 'pug'], ['greyhound', 'mastiff', 'Greymastiff', 'mastiff'],
    ['beagle', 'mastiff', 'Mastigle', 'beagle'], ['poodle', 'mastiff', 'Mastipoo', 'poodle'],
    ['collie', 'mastiff', 'Border Mastiff', 'collie'], ['samoyed', 'mastiff', 'Sammy Mastiff', 'samoyed'],
    ['frenchie', 'mastiff', 'Frenchiff', 'frenchie'], ['akita', 'mastiff', 'Akita Mastiff', 'mastiff'],
    ['spitz', 'mastiff', 'Spitz Mastiff', 'spitz'], ['pom', 'mastiff', 'Pom Mastiff', 'pom'],
    ['shiba', 'gsd', 'Shepiba', 'shiba'], ['corgi', 'gsd', 'Shepgi', 'corgi'],
    ['golden', 'gsd', 'Golden Shepherd', 'gsd'], ['dachs', 'gsd', 'Shepdox', 'dachs'],
    ['husky', 'gsd', 'Shepsky', 'husky'], ['chihuahua', 'gsd', 'Shepchi', 'chihuahua'],
    ['pug', 'gsd', 'Pugshep', 'pug'], ['greyhound', 'gsd', 'Greyshep', 'gsd'],
    ['beagle', 'gsd', 'Sheagle', 'beagle'], ['poodle', 'gsd', 'Shepadoodle', 'poodle'],
    ['collie', 'gsd', 'Border Shepherd', 'collie'], ['samoyed', 'gsd', 'Sammy Shepherd', 'samoyed'],
    ['frenchie', 'gsd', 'French Shepherd', 'frenchie'], ['akita', 'gsd', 'Akita Shepherd', 'gsd'],
    ['spitz', 'gsd', 'Spitz Shepherd', 'spitz'], ['pom', 'gsd', 'Pom Shepherd', 'pom'],
    ['afghan', 'dane', 'Afghan Dane', 'afghan'], ['afghan', 'mastiff', 'Afghan Mastiff', 'mastiff'],
    ['afghan', 'gsd', 'Afghan Shepherd', 'afghan'], ['dane', 'mastiff', 'Daniff', 'mastiff'],
    ['dane', 'gsd', 'Shepdane', 'gsd'], ['mastiff', 'gsd', 'Mastishep', 'mastiff'],
    // v2.12: the fourteen new breeds with the 20 older non-mutt breeds (280, one block per new breed), then among themselves (91)
    ['shiba', 'dobie', 'Dobie Shiba', 'dobie'], ['corgi', 'dobie', 'Dobie Corgi', 'corgi'], ['golden', 'dobie', 'Golden Dobie', 'dobie'],
    ['dachs', 'dobie', 'Dobie Doxie', 'dachs'], ['husky', 'dobie', 'Dobsky', 'husky'], ['chihuahua', 'dobie', 'Dobie Chi', 'chihuahua'],
    ['pug', 'dobie', 'Dobie Pug', 'pug'], ['greyhound', 'dobie', 'Greyberman', 'dobie'], ['beagle', 'dobie', 'Dobie Beagle', 'dobie'],
    ['poodle', 'dobie', 'Dobiepoo', 'poodle'], ['collie', 'dobie', 'Border Dobie', 'collie'], ['samoyed', 'dobie', 'Sammy Dobie', 'samoyed'],
    ['frenchie', 'dobie', 'French Dobie', 'frenchie'], ['akita', 'dobie', 'Dobie Akita', 'akita'], ['spitz', 'dobie', 'Dobie Spitz', 'dobie'],
    ['pom', 'dobie', 'Dobie Pom', 'pom'], ['afghan', 'dobie', 'Dobie Afghan', 'afghan'], ['dane', 'dobie', 'Dobie Dane', 'dobie'],
    ['mastiff', 'dobie', 'Dobie Mastiff', 'mastiff'], ['gsd', 'dobie', 'Doberman Shepherd', 'dobie'],
    ['shiba', 'corso', 'Corso Shiba', 'corso'], ['corgi', 'corso', 'Corso Corgi', 'corgi'], ['golden', 'corso', 'Golden Corso', 'corso'],
    ['dachs', 'corso', 'Corso Doxie', 'corso'], ['husky', 'corso', 'Corsky', 'husky'], ['chihuahua', 'corso', 'Corso Chi', 'corso'],
    ['pug', 'corso', 'Corso Pug', 'pug'], ['greyhound', 'corso', 'Corso Grey', 'corso'], ['beagle', 'corso', 'Corso Beagle', 'corso'],
    ['poodle', 'corso', 'Corsopoo', 'poodle'], ['collie', 'corso', 'Border Corso', 'corso'], ['samoyed', 'corso', 'Sammy Corso', 'corso'],
    ['frenchie', 'corso', 'French Corso', 'frenchie'], ['akita', 'corso', 'Corso Akita', 'corso'], ['spitz', 'corso', 'Corso Spitz', 'corso'],
    ['pom', 'corso', 'Corso Pom', 'corso'], ['afghan', 'corso', 'Corso Afghan', 'corso'], ['dane', 'corso', 'Great Corso', 'corso'],
    ['mastiff', 'corso', 'Corso Mastiff', 'corso'], ['gsd', 'corso', 'Shepherd Corso', 'corso'],
    ['shiba', 'pitbull', 'Shiba Pittie', 'pitbull'], ['corgi', 'pitbull', 'Pitgi', 'corgi'], ['golden', 'pitbull', 'Golden Pittie', 'pitbull'],
    ['dachs', 'pitbull', 'Doxie Pit', 'pitbull'], ['husky', 'pitbull', 'Pitsky', 'husky'], ['chihuahua', 'pitbull', 'Chipit', 'pitbull'],
    ['pug', 'pitbull', 'Pugbull', 'pug'], ['greyhound', 'pitbull', 'Pittie Grey', 'pitbull'], ['beagle', 'pitbull', 'Pitbeagle', 'pitbull'],
    ['poodle', 'pitbull', 'Pitpoo', 'poodle'], ['collie', 'pitbull', 'Border Pittie', 'pitbull'], ['samoyed', 'pitbull', 'Sammy Pittie', 'pitbull'],
    ['frenchie', 'pitbull', 'French Pittie', 'frenchie'], ['akita', 'pitbull', 'Pitkita', 'pitbull'], ['spitz', 'pitbull', 'Pittie Spitz', 'pitbull'],
    ['pom', 'pitbull', 'Pittie Pom', 'pitbull'], ['afghan', 'pitbull', 'Pittie Afghan', 'pitbull'], ['dane', 'pitbull', 'Great Danebull', 'pitbull'],
    ['mastiff', 'pitbull', 'Mastibull', 'pitbull'], ['gsd', 'pitbull', 'Shepherd Pittie', 'pitbull'],
    ['shiba', 'minpin', 'Shiba Pin', 'minpin'], ['corgi', 'minpin', 'Corgi Pin', 'corgi'], ['golden', 'minpin', 'Golden Pinny', 'minpin'],
    ['dachs', 'minpin', 'Doxie Pin', 'dachs'], ['husky', 'minpin', 'Pinsky', 'husky'], ['chihuahua', 'minpin', 'Chipin', 'chihuahua'],
    ['pug', 'minpin', 'Mugin', 'pug'], ['greyhound', 'minpin', 'Grey Pin', 'minpin'], ['beagle', 'minpin', 'Meagle', 'minpin'],
    ['poodle', 'minpin', 'Pinny-poo', 'poodle'], ['collie', 'minpin', 'Border Pinny', 'collie'], ['samoyed', 'minpin', 'Sammy Pinny', 'samoyed'],
    ['frenchie', 'minpin', 'French Pinscher', 'frenchie'], ['akita', 'minpin', 'Pinny Akita', 'akita'], ['spitz', 'minpin', 'Pinny Spitz', 'minpin'],
    ['pom', 'minpin', 'Pom-a-Pin', 'pom'], ['afghan', 'minpin', 'Pinny Afghan', 'afghan'], ['dane', 'minpin', 'Pinny Dane', 'minpin'],
    ['mastiff', 'minpin', 'Pinny Mastiff', 'mastiff'], ['gsd', 'minpin', 'Pinny Shepherd', 'minpin'],
    ['shiba', 'lab', 'Shibador', 'shiba'], ['corgi', 'lab', 'Corgidor', 'corgi'], ['golden', 'lab', 'Goldador', 'lab'],
    ['dachs', 'lab', 'Dachsador', 'dachs'], ['husky', 'lab', 'Labsky', 'husky'], ['chihuahua', 'lab', 'Labrahuahua', 'chihuahua'],
    ['pug', 'lab', 'Pugador', 'pug'], ['greyhound', 'lab', 'Greyador', 'lab'], ['beagle', 'lab', 'Labbe', 'beagle'],
    ['poodle', 'lab', 'Mini Labradoodle', 'poodle'], ['collie', 'lab', 'Borador', 'collie'], ['samoyed', 'lab', 'Samoyador', 'samoyed'],
    ['frenchie', 'lab', 'French Lab', 'frenchie'], ['akita', 'lab', 'Labrakita', 'akita'], ['spitz', 'lab', 'Spitzador', 'spitz'],
    ['pom', 'lab', 'Pomador', 'pom'], ['afghan', 'lab', 'Afghan Lab', 'afghan'], ['dane', 'lab', 'Labradane', 'dane'],
    ['mastiff', 'lab', 'Mastador', 'mastiff'], ['gsd', 'lab', 'Shepador', 'gsd'],
    ['shiba', 'malamute', 'Shibamute', 'malamute'], ['corgi', 'malamute', 'Corgimute', 'malamute'], ['golden', 'malamute', 'Golden Malamute', 'malamute'],
    ['dachs', 'malamute', 'Doximute', 'malamute'], ['husky', 'malamute', 'Alusky', 'husky'], ['chihuahua', 'malamute', 'Chimute', 'malamute'],
    ['pug', 'malamute', 'Pugamute', 'pug'], ['greyhound', 'malamute', 'Greymute', 'malamute'], ['beagle', 'malamute', 'Beaglemute', 'malamute'],
    ['poodle', 'malamute', 'Malapoo', 'malamute'], ['collie', 'malamute', 'Border Malamute', 'malamute'], ['samoyed', 'malamute', 'Samamute', 'malamute'],
    ['frenchie', 'malamute', 'French Malamute', 'frenchie'], ['akita', 'malamute', 'Alaskan Akita', 'malamute'], ['spitz', 'malamute', 'Spitzamute', 'malamute'],
    ['pom', 'malamute', 'Pomamute', 'malamute'], ['afghan', 'malamute', 'Afghan Malamute', 'malamute'], ['dane', 'malamute', 'Great Malamute', 'malamute'],
    ['mastiff', 'malamute', 'Mastimute', 'malamute'], ['gsd', 'malamute', 'Alaskan Shepherd', 'malamute'],
    ['shiba', 'chow', 'Shiba Chow', 'chow'], ['corgi', 'chow', 'Chorgi', 'chow'], ['golden', 'chow', 'Golden Chow', 'chow'],
    ['dachs', 'chow', 'Chow Doxie', 'chow'], ['husky', 'chow', 'Chowsky', 'chow'], ['chihuahua', 'chow', 'Chi Chow', 'chow'],
    ['pug', 'chow', 'Pug Chow', 'pug'], ['greyhound', 'chow', 'Grey Chow', 'chow'], ['beagle', 'chow', 'Chabeagle', 'chow'],
    ['poodle', 'chow', 'Chow-poo', 'chow'], ['collie', 'chow', 'Border Chow', 'chow'], ['samoyed', 'chow', 'Sammy Chow', 'chow'],
    ['frenchie', 'chow', 'French Chow', 'frenchie'], ['akita', 'chow', 'Chakita', 'chow'], ['spitz', 'chow', 'Spitz Chow', 'chow'],
    ['pom', 'chow', 'Pomchow', 'chow'], ['afghan', 'chow', 'Afghan Chow', 'chow'], ['dane', 'chow', 'Dane Chow', 'chow'],
    ['mastiff', 'chow', 'Mastichow', 'chow'], ['gsd', 'chow', 'Chow Shepherd', 'chow'],
    ['shiba', 'stdpoodle', 'Shiba Doodle', 'stdpoodle'], ['corgi', 'stdpoodle', 'Corgidoodle', 'stdpoodle'], ['golden', 'stdpoodle', 'Big Goldendoodle', 'stdpoodle'],
    ['dachs', 'stdpoodle', 'Doxiedoodle', 'stdpoodle'], ['husky', 'stdpoodle', 'Huskydoodle', 'husky'], ['chihuahua', 'stdpoodle', 'Chidoodle', 'stdpoodle'],
    ['pug', 'stdpoodle', 'Pugadoodle', 'pug'], ['greyhound', 'stdpoodle', 'Big Greydoodle', 'stdpoodle'], ['beagle', 'stdpoodle', 'Beadoodle', 'stdpoodle'],
    ['poodle', 'stdpoodle', 'Medium Poodle', 'stdpoodle'], ['collie', 'stdpoodle', 'Big Bordoodle', 'stdpoodle'], ['samoyed', 'stdpoodle', 'Sammydoodle', 'stdpoodle'],
    ['frenchie', 'stdpoodle', 'Frenchdoodle', 'frenchie'], ['akita', 'stdpoodle', 'Akidoodle', 'stdpoodle'], ['spitz', 'stdpoodle', 'Spitzdoodle', 'stdpoodle'],
    ['pom', 'stdpoodle', 'Pomadoodle', 'stdpoodle'], ['afghan', 'stdpoodle', 'Big Afghandoodle', 'stdpoodle'], ['dane', 'stdpoodle', 'Great Danoodle', 'stdpoodle'],
    ['mastiff', 'stdpoodle', 'Mastidoodle', 'stdpoodle'], ['gsd', 'stdpoodle', 'Big Shepadoodle', 'stdpoodle'],
    ['shiba', 'schnauzer', 'Schnauzer Shiba', 'schnauzer'], ['corgi', 'schnauzer', 'Schnorgi', 'schnauzer'], ['golden', 'schnauzer', 'Golden Schnauzer', 'schnauzer'],
    ['dachs', 'schnauzer', 'Schnauzer Doxie', 'schnauzer'], ['husky', 'schnauzer', 'Schnusky', 'schnauzer'], ['chihuahua', 'schnauzer', 'Chizer', 'schnauzer'],
    ['pug', 'schnauzer', 'Schnug', 'pug'], ['greyhound', 'schnauzer', 'Schnauzer Grey', 'schnauzer'], ['beagle', 'schnauzer', 'Schneagle', 'schnauzer'],
    ['poodle', 'schnauzer', 'Schnoodle', 'schnauzer'], ['collie', 'schnauzer', 'Border Schnauzer', 'schnauzer'], ['samoyed', 'schnauzer', 'Sammy Schnauzer', 'schnauzer'],
    ['frenchie', 'schnauzer', 'French Schnauzer', 'frenchie'], ['akita', 'schnauzer', 'Schnauzer Akita', 'schnauzer'], ['spitz', 'schnauzer', 'Schnauzer Spitz', 'schnauzer'],
    ['pom', 'schnauzer', 'Pom Schnauzer', 'schnauzer'], ['afghan', 'schnauzer', 'Schnauzer Afghan', 'schnauzer'], ['dane', 'schnauzer', 'Schnauzer Dane', 'schnauzer'],
    ['mastiff', 'schnauzer', 'Schnauzer Mastiff', 'schnauzer'], ['gsd', 'schnauzer', 'Schnauzer Shepherd', 'schnauzer'],
    ['shiba', 'westie', 'Westie Shiba', 'westie'], ['corgi', 'westie', 'Corgi Westie', 'westie'], ['golden', 'westie', 'Golden Westie', 'westie'],
    ['dachs', 'westie', 'Westie Doxie', 'westie'], ['husky', 'westie', 'Westsky', 'husky'], ['chihuahua', 'westie', 'Chi Westie', 'westie'],
    ['pug', 'westie', 'Wug', 'pug'], ['greyhound', 'westie', 'Westie Grey', 'westie'], ['beagle', 'westie', 'Westeagle', 'westie'],
    ['poodle', 'westie', 'Westiepoo', 'westie'], ['collie', 'westie', 'Border Westie', 'westie'], ['samoyed', 'westie', 'Sammy Westie', 'westie'],
    ['frenchie', 'westie', 'French Westie', 'frenchie'], ['akita', 'westie', 'Westie Akita', 'westie'], ['spitz', 'westie', 'Westie Spitz', 'westie'],
    ['pom', 'westie', 'Westie Pom', 'westie'], ['afghan', 'westie', 'Westie Afghan', 'westie'], ['dane', 'westie', 'Westie Dane', 'westie'],
    ['mastiff', 'westie', 'Westie Mastiff', 'westie'], ['gsd', 'westie', 'Westie Shepherd', 'westie'],
    ['shiba', 'yorkie', 'Shiba Yorkie', 'yorkie'], ['corgi', 'yorkie', 'Corkie', 'yorkie'], ['golden', 'yorkie', 'Golden Yorkie', 'yorkie'],
    ['dachs', 'yorkie', 'Doxie Yorkie', 'yorkie'], ['husky', 'yorkie', 'Yorksky', 'husky'], ['chihuahua', 'yorkie', 'Chorkie', 'yorkie'],
    ['pug', 'yorkie', 'Pugshire', 'pug'], ['greyhound', 'yorkie', 'Yorkie Grey', 'yorkie'], ['beagle', 'yorkie', 'Borkie', 'yorkie'],
    ['poodle', 'yorkie', 'Yorkipoo', 'yorkie'], ['collie', 'yorkie', 'Border Yorkie', 'yorkie'], ['samoyed', 'yorkie', 'Sammy Yorkie', 'yorkie'],
    ['frenchie', 'yorkie', 'Frenchie Yorkie', 'frenchie'], ['akita', 'yorkie', 'Yorkie Akita', 'yorkie'], ['spitz', 'yorkie', 'Yorkie Spitz', 'yorkie'],
    ['pom', 'yorkie', 'Yoranian', 'yorkie'], ['afghan', 'yorkie', 'Yorkie Afghan', 'yorkie'], ['dane', 'yorkie', 'Yorkie Dane', 'yorkie'],
    ['mastiff', 'yorkie', 'Yorkie Mastiff', 'yorkie'], ['gsd', 'yorkie', 'Yorkie Shepherd', 'yorkie'],
    ['shiba', 'bichon', 'Bichon Shiba', 'bichon'], ['corgi', 'bichon', 'Corgi-chon', 'bichon'], ['golden', 'bichon', 'Golden Bichon', 'bichon'],
    ['dachs', 'bichon', 'Doxie-chon', 'bichon'], ['husky', 'bichon', 'Bichsky', 'husky'], ['chihuahua', 'bichon', 'Chi-chon', 'bichon'],
    ['pug', 'bichon', 'Pug-a-chon', 'pug'], ['greyhound', 'bichon', 'Bichon Grey', 'bichon'], ['beagle', 'bichon', 'Beachon', 'bichon'],
    ['poodle', 'bichon', 'Poochon', 'bichon'], ['collie', 'bichon', 'Border Bichon', 'bichon'], ['samoyed', 'bichon', 'Sammy Bichon', 'bichon'],
    ['frenchie', 'bichon', 'French Bichon', 'frenchie'], ['akita', 'bichon', 'Bichon Akita', 'bichon'], ['spitz', 'bichon', 'Spitz-chon', 'bichon'],
    ['pom', 'bichon', 'Bichonaranian', 'bichon'], ['afghan', 'bichon', 'Bichon Afghan', 'bichon'], ['dane', 'bichon', 'Bichon Dane', 'bichon'],
    ['mastiff', 'bichon', 'Bichon Mastiff', 'bichon'], ['gsd', 'bichon', 'Bichon Shepherd', 'bichon'],
    ['shiba', 'maltese', 'Malti Shiba', 'maltese'], ['corgi', 'maltese', 'Corgi Malti', 'corgi'], ['golden', 'maltese', 'Golden Malti', 'maltese'],
    ['dachs', 'maltese', 'Mauxie', 'maltese'], ['husky', 'maltese', 'Maltsky', 'husky'], ['chihuahua', 'maltese', 'Malchi', 'maltese'],
    ['pug', 'maltese', 'Malti Pug', 'pug'], ['greyhound', 'maltese', 'Malti Grey', 'maltese'], ['beagle', 'maltese', 'Malteagle', 'maltese'],
    ['poodle', 'maltese', 'Maltipoo', 'poodle'], ['collie', 'maltese', 'Border Malti', 'maltese'], ['samoyed', 'maltese', 'Sammy Malti', 'maltese'],
    ['frenchie', 'maltese', 'Frenchie Malti', 'frenchie'], ['akita', 'maltese', 'Malti Akita', 'maltese'], ['spitz', 'maltese', 'Malti Spitz', 'maltese'],
    ['pom', 'maltese', 'Maltipom', 'maltese'], ['afghan', 'maltese', 'Malti Afghan', 'maltese'], ['dane', 'maltese', 'Malti Dane', 'maltese'],
    ['mastiff', 'maltese', 'Malti Mastiff', 'maltese'], ['gsd', 'maltese', 'Malti Shepherd', 'maltese'],
    ['shiba', 'shihtzu', 'Shiba Tzu', 'shihtzu'], ['corgi', 'shihtzu', 'Corgi Tzu', 'shihtzu'], ['golden', 'shihtzu', 'Golden Tzu', 'shihtzu'],
    ['dachs', 'shihtzu', 'Shih Doxie', 'shihtzu'], ['husky', 'shihtzu', 'Shihsky', 'shihtzu'], ['chihuahua', 'shihtzu', 'Shichi', 'shihtzu'],
    ['pug', 'shihtzu', 'Pugzu', 'pug'], ['greyhound', 'shihtzu', 'Grey Tzu', 'shihtzu'], ['beagle', 'shihtzu', 'Beagle Tzu', 'shihtzu'],
    ['poodle', 'shihtzu', 'Shih-poo', 'shihtzu'], ['collie', 'shihtzu', 'Border Tzu', 'shihtzu'], ['samoyed', 'shihtzu', 'Sammy Tzu', 'shihtzu'],
    ['frenchie', 'shihtzu', 'French Tzu', 'frenchie'], ['akita', 'shihtzu', 'Akita Tzu', 'shihtzu'], ['spitz', 'shihtzu', 'Spitz Tzu', 'shihtzu'],
    ['pom', 'shihtzu', 'Shiranian', 'shihtzu'], ['afghan', 'shihtzu', 'Afghan Tzu', 'shihtzu'], ['dane', 'shihtzu', 'Dane Tzu', 'shihtzu'],
    ['mastiff', 'shihtzu', 'Mastiff Tzu', 'shihtzu'], ['gsd', 'shihtzu', 'Shepherd Tzu', 'shihtzu'],
    ['dobie', 'corso', 'Corsoberman', 'corso'], ['dobie', 'pitbull', 'Doberbull', 'pitbull'], ['dobie', 'minpin', 'Little Dobie', 'minpin'],
    ['dobie', 'lab', 'Doberdor', 'dobie'], ['dobie', 'malamute', 'Dobermute', 'malamute'], ['dobie', 'chow', 'Dobie Chow', 'chow'],
    ['dobie', 'stdpoodle', 'Doberdoodle', 'stdpoodle'], ['dobie', 'schnauzer', 'Dobie Schnauzer', 'schnauzer'], ['dobie', 'westie', 'Dobie Westie', 'westie'],
    ['dobie', 'yorkie', 'Dobie Yorkie', 'yorkie'], ['dobie', 'bichon', 'Dobie-chon', 'bichon'], ['dobie', 'maltese', 'Dobie Malti', 'maltese'],
    ['dobie', 'shihtzu', 'Dobie Tzu', 'shihtzu'], ['corso', 'pitbull', 'Corso Pittie', 'pitbull'], ['corso', 'minpin', 'Pin Corso', 'corso'],
    ['corso', 'lab', 'Corsador', 'corso'], ['corso', 'malamute', 'Corsomute', 'malamute'], ['corso', 'chow', 'Corso Chow', 'chow'],
    ['corso', 'stdpoodle', 'Corsodoodle', 'stdpoodle'], ['corso', 'schnauzer', 'Corso Schnauzer', 'schnauzer'], ['corso', 'westie', 'Corso Westie', 'westie'],
    ['corso', 'yorkie', 'Corso Yorkie', 'yorkie'], ['corso', 'bichon', 'Corso-chon', 'bichon'], ['corso', 'maltese', 'Corso Malti', 'maltese'],
    ['corso', 'shihtzu', 'Corso Tzu', 'shihtzu'], ['pitbull', 'minpin', 'Pinny Pittie', 'pitbull'], ['pitbull', 'lab', 'Labrabull', 'pitbull'],
    ['pitbull', 'malamute', 'Pitamute', 'malamute'], ['pitbull', 'chow', 'Chow Pittie', 'chow'], ['pitbull', 'stdpoodle', 'Pitdoodle', 'stdpoodle'],
    ['pitbull', 'schnauzer', 'Schnau-bull', 'schnauzer'], ['pitbull', 'westie', 'Westie Pittie', 'westie'], ['pitbull', 'yorkie', 'Yorkie Pittie', 'yorkie'],
    ['pitbull', 'bichon', 'Bichon Pittie', 'bichon'], ['pitbull', 'maltese', 'Malti Pittie', 'maltese'], ['pitbull', 'shihtzu', 'Pit Tzu', 'shihtzu'],
    ['minpin', 'lab', 'Labrapin', 'minpin'], ['minpin', 'malamute', 'Pinnymute', 'malamute'], ['minpin', 'chow', 'Chow Pin', 'chow'],
    ['minpin', 'stdpoodle', 'Pinny-doodle', 'stdpoodle'], ['minpin', 'schnauzer', 'Schnau-pin', 'schnauzer'], ['minpin', 'westie', 'Westie Pin', 'westie'],
    ['minpin', 'yorkie', 'Yorkie Pin', 'yorkie'], ['minpin', 'bichon', 'Pin-chon', 'bichon'], ['minpin', 'maltese', 'Malti-pin', 'maltese'],
    ['minpin', 'shihtzu', 'Pin Tzu', 'shihtzu'], ['lab', 'malamute', 'Labmute', 'malamute'], ['lab', 'chow', 'Chabrador', 'chow'],
    ['lab', 'stdpoodle', 'Labradoodle', 'stdpoodle'], ['lab', 'schnauzer', 'Schnauzador', 'schnauzer'], ['lab', 'westie', 'Westador', 'westie'],
    ['lab', 'yorkie', 'Yorkador', 'yorkie'], ['lab', 'bichon', 'Labrachon', 'bichon'], ['lab', 'maltese', 'Maltador', 'maltese'],
    ['lab', 'shihtzu', 'Labratzu', 'shihtzu'], ['malamute', 'chow', 'Chowmute', 'chow'], ['malamute', 'stdpoodle', 'Maladoodle', 'stdpoodle'],
    ['malamute', 'schnauzer', 'Schnaumute', 'schnauzer'], ['malamute', 'westie', 'Westiemute', 'westie'], ['malamute', 'yorkie', 'Yorkiemute', 'yorkie'],
    ['malamute', 'bichon', 'Bichomute', 'bichon'], ['malamute', 'maltese', 'Maltimute', 'malamute'], ['malamute', 'shihtzu', 'Mally Tzu', 'shihtzu'],
    ['chow', 'stdpoodle', 'Chowdoodle', 'chow'], ['chow', 'schnauzer', 'Schnau-chow', 'schnauzer'], ['chow', 'westie', 'Westie Chow', 'chow'],
    ['chow', 'yorkie', 'Yorkie Chow', 'chow'], ['chow', 'bichon', 'Chow-chon', 'chow'], ['chow', 'maltese', 'Malti Chow', 'chow'],
    ['chow', 'shihtzu', 'Chow Tzu', 'shihtzu'], ['stdpoodle', 'schnauzer', 'Big Schnoodle', 'schnauzer'], ['stdpoodle', 'westie', 'Westiedoodle', 'westie'],
    ['stdpoodle', 'yorkie', 'Yorkiedoodle', 'yorkie'], ['stdpoodle', 'bichon', 'Big Poochon', 'bichon'], ['stdpoodle', 'maltese', 'Maltidoodle', 'stdpoodle'],
    ['stdpoodle', 'shihtzu', 'Shih-doodle', 'shihtzu'], ['schnauzer', 'westie', 'Wauzer', 'schnauzer'], ['schnauzer', 'yorkie', 'Snorkie', 'schnauzer'],
    ['schnauzer', 'bichon', 'Schnau-chon', 'schnauzer'], ['schnauzer', 'maltese', 'Mauzer', 'schnauzer'], ['schnauzer', 'shihtzu', 'Schnau-Tzu', 'shihtzu'],
    ['westie', 'yorkie', 'Wee-Yorkie', 'yorkie'], ['westie', 'bichon', 'Wee-chon', 'bichon'], ['westie', 'maltese', 'Highland Malti', 'westie'],
    ['westie', 'shihtzu', 'Wee-Tzu', 'shihtzu'], ['yorkie', 'bichon', 'Yo-chon', 'bichon'], ['yorkie', 'maltese', 'Morkie', 'yorkie'],
    ['yorkie', 'shihtzu', 'Shorkie', 'shihtzu'], ['bichon', 'maltese', 'Maltichon', 'bichon'], ['bichon', 'shihtzu', 'Shichon', 'shihtzu'],
    ['maltese', 'shihtzu', 'Malshi', 'shihtzu'],
    // v2.21 (V221.md 3): each of the five with the 34 older non-mutt breeds (head: the older breed when it is the head in most of its older rows), then the ten among the five
    ['shiba', 'dalmatian', 'Shibamatian', 'dalmatian'], ['corgi', 'dalmatian', 'Corgimatian', 'corgi'], ['golden', 'dalmatian', 'Goldmatian', 'dalmatian'],
    ['dachs', 'dalmatian', 'Doxiematian', 'dalmatian'], ['husky', 'dalmatian', 'Dalusky', 'husky'], ['chihuahua', 'dalmatian', 'Chimatian', 'chihuahua'],
    ['pug', 'dalmatian', 'Pugmatian', 'pug'], ['greyhound', 'dalmatian', 'Greymatian', 'dalmatian'], ['beagle', 'dalmatian', 'Beaglematian', 'dalmatian'],
    ['poodle', 'dalmatian', 'Dalmapoo', 'poodle'], ['collie', 'dalmatian', 'Border Dal', 'dalmatian'], ['samoyed', 'dalmatian', 'Sammymatian', 'dalmatian'],
    ['frenchie', 'dalmatian', 'French Dal', 'frenchie'], ['akita', 'dalmatian', 'Akimatian', 'dalmatian'], ['spitz', 'dalmatian', 'Spitzmatian', 'dalmatian'],
    ['pom', 'dalmatian', 'Pomatian', 'dalmatian'], ['afghan', 'dalmatian', 'Afghan Dal', 'dalmatian'], ['dane', 'dalmatian', 'Great Dal', 'dalmatian'],
    ['mastiff', 'dalmatian', 'Mastimatian', 'dalmatian'], ['gsd', 'dalmatian', 'Shepmatian', 'dalmatian'], ['dobie', 'dalmatian', 'Dobiematian', 'dalmatian'],
    ['corso', 'dalmatian', 'Corsomatian', 'corso'], ['pitbull', 'dalmatian', 'Pitmatian', 'pitbull'], ['minpin', 'dalmatian', 'Pinmatian', 'dalmatian'],
    ['lab', 'dalmatian', 'Dalmador', 'dalmatian'], ['malamute', 'dalmatian', 'Malmatian', 'malamute'], ['chow', 'dalmatian', 'Chowmatian', 'chow'],
    ['stdpoodle', 'dalmatian', 'Dalmadoodle', 'stdpoodle'], ['schnauzer', 'dalmatian', 'Schnaumatian', 'schnauzer'], ['westie', 'dalmatian', 'Westiematian', 'westie'],
    ['yorkie', 'dalmatian', 'Yorkmatian', 'yorkie'], ['bichon', 'dalmatian', 'Bichomatian', 'bichon'], ['maltese', 'dalmatian', 'Maltmatian', 'maltese'],
    ['shihtzu', 'dalmatian', 'Dalma Tzu', 'shihtzu'],
    ['shiba', 'bernese', 'Shiba Berner', 'bernese'], ['corgi', 'bernese', 'Corgi Berner', 'corgi'], ['golden', 'bernese', 'Golden Mountain Dog', 'bernese'],
    ['dachs', 'bernese', 'Doxie Berner', 'bernese'], ['husky', 'bernese', 'Bernsky', 'husky'], ['chihuahua', 'bernese', 'Chi Berner', 'chihuahua'],
    ['pug', 'bernese', 'Pug Berner', 'pug'], ['greyhound', 'bernese', 'Grey Berner', 'bernese'], ['beagle', 'bernese', 'Beagle Berner', 'bernese'],
    ['poodle', 'bernese', 'Mini Bernedoodle', 'poodle'], ['collie', 'bernese', 'Border Berner', 'bernese'], ['samoyed', 'bernese', 'Sammy Berner', 'bernese'],
    ['frenchie', 'bernese', 'French Berner', 'frenchie'], ['akita', 'bernese', 'Akita Berner', 'bernese'], ['spitz', 'bernese', 'Spitz Berner', 'bernese'],
    ['pom', 'bernese', 'Pom Berner', 'bernese'], ['afghan', 'bernese', 'Afghan Berner', 'bernese'], ['dane', 'bernese', 'Great Berner', 'bernese'],
    ['mastiff', 'bernese', 'Mastiff Berner', 'bernese'], ['gsd', 'bernese', 'Bernese Shepherd', 'bernese'], ['dobie', 'bernese', 'Dobie Berner', 'bernese'],
    ['corso', 'bernese', 'Corso Berner', 'corso'], ['pitbull', 'bernese', 'Pit Berner', 'pitbull'], ['minpin', 'bernese', 'Pin Berner', 'bernese'],
    ['lab', 'bernese', 'Labernese', 'bernese'], ['malamute', 'bernese', 'Mala-Berner', 'malamute'], ['chow', 'bernese', 'Chow Berner', 'chow'],
    ['stdpoodle', 'bernese', 'Bernedoodle', 'stdpoodle'], ['schnauzer', 'bernese', 'Schnau-Berner', 'schnauzer'], ['westie', 'bernese', 'Westie Berner', 'westie'],
    ['yorkie', 'bernese', 'Yorkie Berner', 'yorkie'], ['bichon', 'bernese', 'Bichon Berner', 'bichon'], ['maltese', 'bernese', 'Malti Berner', 'maltese'],
    ['shihtzu', 'bernese', 'Berner Tzu', 'shihtzu'],
    ['shiba', 'aussie', 'Shiba Aussie', 'aussie'], ['corgi', 'aussie', 'Auggie', 'corgi'], ['golden', 'aussie', 'Golden Aussie', 'aussie'],
    ['dachs', 'aussie', 'Doxie Aussie', 'aussie'], ['husky', 'aussie', 'Aussiesky', 'husky'], ['chihuahua', 'aussie', 'Aussie Chi', 'chihuahua'],
    ['pug', 'aussie', 'Pug Aussie', 'pug'], ['greyhound', 'aussie', 'Grey Aussie', 'aussie'], ['beagle', 'aussie', 'Beagle Aussie', 'aussie'],
    ['poodle', 'aussie', 'Mini Aussiedoodle', 'poodle'], ['collie', 'aussie', 'Border Aussie', 'aussie'], ['samoyed', 'aussie', 'Sammy Aussie', 'aussie'],
    ['frenchie', 'aussie', 'French Aussie', 'frenchie'], ['akita', 'aussie', 'Akita Aussie', 'aussie'], ['spitz', 'aussie', 'Spitz Aussie', 'aussie'],
    ['pom', 'aussie', 'Aussie Pom', 'aussie'], ['afghan', 'aussie', 'Afghan Aussie', 'aussie'], ['dane', 'aussie', 'Great Aussie', 'aussie'],
    ['mastiff', 'aussie', 'Mastiff Aussie', 'aussie'], ['gsd', 'aussie', 'Shepherd Aussie', 'aussie'], ['dobie', 'aussie', 'Dobie Aussie', 'aussie'],
    ['corso', 'aussie', 'Corso Aussie', 'corso'], ['pitbull', 'aussie', 'Pit Aussie', 'pitbull'], ['minpin', 'aussie', 'Pin Aussie', 'aussie'],
    ['lab', 'aussie', 'Aussiedor', 'aussie'], ['malamute', 'aussie', 'Mala-Aussie', 'malamute'], ['chow', 'aussie', 'Chow Aussie', 'chow'],
    ['stdpoodle', 'aussie', 'Aussiedoodle', 'stdpoodle'], ['schnauzer', 'aussie', 'Schnaussie', 'schnauzer'], ['westie', 'aussie', 'Westie Aussie', 'westie'],
    ['yorkie', 'aussie', 'Yorkie Aussie', 'yorkie'], ['bichon', 'aussie', 'Bichon Aussie', 'bichon'], ['maltese', 'aussie', 'Malti Aussie', 'maltese'],
    ['shihtzu', 'aussie', 'Aussie Tzu', 'shihtzu'],
    ['shiba', 'cavalier', 'Shibalier', 'cavalier'], ['corgi', 'cavalier', 'Corgalier', 'corgi'], ['golden', 'cavalier', 'Golden Cavalier', 'cavalier'],
    ['dachs', 'cavalier', 'Doxalier', 'cavalier'], ['husky', 'cavalier', 'Huskalier', 'husky'], ['chihuahua', 'cavalier', 'Cava-Chi', 'chihuahua'],
    ['pug', 'cavalier', 'Pugalier', 'pug'], ['greyhound', 'cavalier', 'Greyalier', 'cavalier'], ['beagle', 'cavalier', 'Beaglier', 'cavalier'],
    ['poodle', 'cavalier', 'Cavapoo', 'poodle'], ['collie', 'cavalier', 'Border Cavalier', 'cavalier'], ['samoyed', 'cavalier', 'Sammalier', 'cavalier'],
    ['frenchie', 'cavalier', 'Frenchalier', 'frenchie'], ['akita', 'cavalier', 'Akitalier', 'cavalier'], ['spitz', 'cavalier', 'Spitzalier', 'cavalier'],
    ['pom', 'cavalier', 'Pomalier', 'cavalier'], ['afghan', 'cavalier', 'Afghalier', 'cavalier'], ['dane', 'cavalier', 'Danealier', 'cavalier'],
    ['mastiff', 'cavalier', 'Mastalier', 'cavalier'], ['gsd', 'cavalier', 'Shepalier', 'cavalier'], ['dobie', 'cavalier', 'Dobalier', 'cavalier'],
    ['corso', 'cavalier', 'Corsalier', 'corso'], ['pitbull', 'cavalier', 'Pitalier', 'pitbull'], ['minpin', 'cavalier', 'Pinalier', 'cavalier'],
    ['lab', 'cavalier', 'Cavador', 'cavalier'], ['malamute', 'cavalier', 'Malalier', 'malamute'], ['chow', 'cavalier', 'Chowalier', 'chow'],
    ['stdpoodle', 'cavalier', 'Cavadoodle', 'stdpoodle'], ['schnauzer', 'cavalier', 'Schnaulier', 'schnauzer'], ['westie', 'cavalier', 'Westalier', 'westie'],
    ['yorkie', 'cavalier', 'Yorkalier', 'yorkie'], ['bichon', 'cavalier', 'Cavachon', 'bichon'], ['maltese', 'cavalier', 'Cavamalt', 'maltese'],
    ['shihtzu', 'cavalier', 'Cava-Tzu', 'shihtzu'],
    ['shiba', 'jrt', 'Shiba Jack', 'jrt'], ['corgi', 'jrt', 'Cojack', 'corgi'], ['golden', 'jrt', 'Golden Jack', 'jrt'],
    ['dachs', 'jrt', 'Jackshund', 'jrt'], ['husky', 'jrt', 'Jusky', 'husky'], ['chihuahua', 'jrt', 'Jack Chi', 'chihuahua'],
    ['pug', 'jrt', 'Jug', 'pug'], ['greyhound', 'jrt', 'Grey Jack', 'jrt'], ['beagle', 'jrt', 'Jackabee', 'jrt'],
    ['poodle', 'jrt', 'Jackapoo', 'poodle'], ['collie', 'jrt', 'Border Jack', 'jrt'], ['samoyed', 'jrt', 'Sammy Jack', 'jrt'],
    ['frenchie', 'jrt', 'French Jack', 'frenchie'], ['akita', 'jrt', 'Akita Jack', 'jrt'], ['spitz', 'jrt', 'Spitz Jack', 'jrt'],
    ['pom', 'jrt', 'Jackaranian', 'jrt'], ['afghan', 'jrt', 'Afghan Jack', 'jrt'], ['dane', 'jrt', 'Great Jack', 'jrt'],
    ['mastiff', 'jrt', 'Mastiff Jack', 'jrt'], ['gsd', 'jrt', 'Shepherd Jack', 'jrt'], ['dobie', 'jrt', 'Dobie Jack', 'jrt'],
    ['corso', 'jrt', 'Corso Jack', 'corso'], ['pitbull', 'jrt', 'Jack Pittie', 'pitbull'], ['minpin', 'jrt', 'Jack Pin', 'jrt'],
    ['lab', 'jrt', 'Jackador', 'jrt'], ['malamute', 'jrt', 'Mala-Jack', 'malamute'], ['chow', 'jrt', 'Chow Jack', 'chow'],
    ['stdpoodle', 'jrt', 'Jackadoodle', 'stdpoodle'], ['schnauzer', 'jrt', 'Schnau-Jack', 'schnauzer'], ['westie', 'jrt', 'Westie Jack', 'westie'],
    ['yorkie', 'jrt', 'Yorkie Jack', 'yorkie'], ['bichon', 'jrt', 'Jack-a-Chon', 'bichon'], ['maltese', 'jrt', 'Jack-a-Malt', 'maltese'],
    ['shihtzu', 'jrt', 'Jack Tzu', 'shihtzu'],
    ['dalmatian', 'bernese', 'Bernmatian', 'bernese'], ['dalmatian', 'aussie', 'Aussiematian', 'aussie'], ['dalmatian', 'cavalier', 'Cavmatian', 'cavalier'],
    ['dalmatian', 'jrt', 'Jackmatian', 'dalmatian'], ['bernese', 'aussie', 'Bernaussie', 'aussie'], ['bernese', 'cavalier', 'Cavabern', 'cavalier'],
    ['bernese', 'jrt', 'Berner Jack', 'bernese'], ['aussie', 'cavalier', 'Cavaussie', 'cavalier'], ['aussie', 'jrt', 'Jack Aussie', 'aussie'],
    ['cavalier', 'jrt', 'Jackalier', 'cavalier']
  ];
  const MIXES = {};
  MIX_LIST.forEach((m) => { MIXES[mixKey(m[0], m[1])] = { name: m[2], head: m[3] }; });
  BREEDS.forEach((k) => { if (k !== 'mutt') MIXES[mixKey('mutt', k)] = { name: 'Mutt mix', head: k }; });

  /* ---------- breed and mix names for display (v2.14) ---------- */
  /** The breed name in the current language (data.breed_names.<key>). BREED_NAMES itself stays the English data. */
  function bn(k) { return D('breed_names.' + k, BREED_NAMES[k] || String(k)); }
  let mixRows = null, breedByName = null;
  const PUN_PATTERN_LANG = /^(ja|zh|yue|ko|th)/; // V214.md 4.3: these six build "A x B" for a pun that has no translated entry (yue: v2.20)
  /** mixName(mix) -> the display name of a stored mix { a, b, name } as a string (V214.md 4.3). The table name comes from mix.name, else from the
      pair a / b; the result goes through mixLabel(). Always a string ('' without a mix). */
  function mixName(mix) {
    if (mix == null) return '';
    if (typeof mix === 'string') return mixLabel(mix);
    let name = mix.name;
    if (!name && mix.a != null && mix.b != null) { const t = MIXES[mixKey(mix.a, mix.b)]; name = t && t.name; }
    return name ? String(mixLabel(name)) : '';
  }
  /** mixLabel(name) -> a mix name in the current language. name is the English text kept on the dog (mix.name): a table mix ("Horgi"),
      "Mutt mix", a grandMix name (the recipes, "The Everything Dog", "<Breed> family mix") or a breed name. The table entry
      (data.mix_list.<a>_<b>.2) wins; without one, ja / zh / yue / ko / th use the pattern mod.genes.mix_pattern and the other languages keep the pun. */
  function mixLabel(name) {
    name = String(name == null ? '' : name);
    if (!name || isEn()) return name;
    if (!mixRows) {
      mixRows = {}; breedByName = {};
      MIX_LIST.forEach((m) => { if (!mixRows[m[2]]) mixRows[m[2]] = m; });
      Object.keys(BREED_NAMES).forEach((k) => { breedByName[BREED_NAMES[k]] = k; });
    }
    if (name === 'Mutt mix') return L('mod.genes.mutt_mix', 'Mutt mix');
    if (name === 'The Everything Dog') return L('mod.genes.everything_dog', 'The Everything Dog');
    const row = mixRows[name];
    if (row) {
      const t = D('mix_list.' + row[0] + '_' + row[1] + '.2', name);
      if (t !== name || !PUN_PATTERN_LANG.test(lang())) return t;
      return L('mod.genes.mix_pattern', '{a} × {b}', { a: bn(row[0]), b: bn(row[1]) });
    }
    for (let i = 0; i < GRAND_RECIPES.length; i++) if (GRAND_RECIPES[i].name === name) return D('grand_recipes.' + idOf(name) + '.name', name);
    const fm = /^(.*) family mix$/.exec(name);
    if (fm && breedByName[fm[1]]) return L('mod.genes.family_mix', '{breed} family mix', { breed: bn(breedByName[fm[1]]) });
    if (breedByName[name]) return bn(breedByName[name]);
    return name;
  }

  /**
   * mixOf(damKey, sireKey, rng) -> { a: damKey, b: sireKey, body, head, name } | null
   * - Same breed (incl. mutt x mutt): returns null = purebred, no mix (puppy key = that breed).
   * - Mutt x anything: body 'mutt', name 'Mutt mix', head = the other breed when rng() < 0.5, else 'mutt'.
   * - Otherwise: body = dam's breed when rng() < 0.5, else sire's; head = MIXES head, or the other parent's
   *   breed when the body already is the head breed (so a mix always shows both parents).
   * rng is called exactly once (body or mutt head). Unknown keys count as 'mutt'.
   */
  function mixOf(damKey, sireKey, rng) {
    const R = rngOf(rng), a = breedOf(damKey), b = breedOf(sireKey);
    if (a === b) return null;
    const t = MIXES[mixKey(a, b)];
    if (a === 'mutt' || b === 'mutt') {
      const other = a === 'mutt' ? b : a;
      return { a, b, body: 'mutt', head: R() < 0.5 ? other : 'mutt', name: t.name };
    }
    const body = R() < 0.5 ? a : b;
    const head = body === t.head ? (body === a ? b : a) : t.head;
    return { a, b, body, head, name: t.name };
  }

  /* ---------- exact odds ---------- */
  // Eye outcome probabilities, mirroring phenotype(): Bl/Bl blue; Bl/bl blue 3/4, odd 1/4;
  // visible merle: odd 0.15, blue 0.10, else amber (b/b) or brown; b/b amber; else brown.
  function eyeDist(g) {
    if (has(g.Bl, 'Bl')) return both(g.Bl, 'Bl') ? { blue: 1 } : { blue: 0.75, odd: 0.25 };
    const pig = pigment(g), visMerle = has(g.M, 'M') && pig !== 'red' && pig !== 'cream';
    const base = both(g.B, 'b') ? 'amber' : 'brown';
    if (visMerle) { const o = { odd: 0.15, blue: 0.10 }; o[base] = 0.75; return o; }
    return { [base]: 1 };
  }
  function oddsText(p) {
    if (p >= 0.995) return L('mod.genes.odds_every', 'every puppy');
    const n = 1 / p, r = Math.round(n), v = String(Math.max(1, r));
    return Math.abs(n - r) < 0.02 * n ? L('mod.genes.odds_1_in', '1 in {n}', { n: v }) : L('mod.genes.odds_about_1_in', 'about 1 in {n}', { n: v });
  }
  // all unordered genotype classes of the 6 loci with their probability for a pair of parents
  function offspringDist(ga, gb) {
    let keys = ga.A || gb.A ? LOCUS_KEYS.concat('A') : LOCUS_KEYS; // v2.21: the tan-point locus only when a parent carries it
    if (keys !== LOCUS_KEYS) { ga = Object.assign({}, ga, { A: tanOf(ga) }); gb = Object.assign({}, gb, { A: tanOf(gb) }); }
    if (ga.I || gb.I) { keys = keys.concat('I'); ga = Object.assign({}, ga, { I: redOf(ga) }); gb = Object.assign({}, gb, { I: redOf(gb) }); } // red intensity, the same way
    const per = keys.map((k) => {
      const m = {};
      for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
        const pr = [ga[k][i], gb[k][j]], key = pr.join('/');
        m[key] = (m[key] || 0) + 0.25;
      }
      return Object.keys(m).map((key) => ({ pair: key.split('/'), p: m[key] }));
    });
    const out = [];
    (function rec(i, g, p) {
      if (i === keys.length) { out.push({ g: Object.assign({}, g), p }); return; }
      per[i].forEach((o) => { g[keys[i]] = o.pair; rec(i + 1, g, p * o.p); });
    })(0, {}, 1);
    return out; // covers the 4096 allele combinations exactly (merged by ordered pair)
  }

  /**
   * predict(genesA, genesB, keyA, keyB, opts?) -> [{ coat, eyes, pct, odds }] sorted by pct (desc), then coat, eyes.
   * - genesA = dam, genesB = sire (genes objects or dogs with .genes). Exact enumeration of all 4^6 = 4096
   *   allele combinations. M/M (double merle) outcomes are non-viable: removed, the rest renormalised.
   * - coat = phenotype().coatName for the BODY breed: keyA (the dam's breed), except 'mutt' when either parent
   *   is a mutt (mixOf always gives a mutt body then). opts.body overrides it.
   * - Rows are per (coat, eyes): eyes is a fixed label ('brown' | 'amber' | 'blue' | 'odd') and a coat with a
   *   chance of odd/blue eyes is split into separate rows (e.g. Bl/bl: 75% blue row, 25% odd row).
   *   opts.byCoat = true merges rows by coat only; eyes is then the most likely label for that coat.
   * - pct is an unrounded number (rows sum to 100 within float error); odds is plain text ('1 in 32').
   * - Returns [] when every outcome would be M/M.
   */
  function predict(genesA, genesB, keyA, keyB, opts) {
    opts = opts || {};
    const ga = normGenes(genesOf(genesA)), gb = normGenes(genesOf(genesB));
    const body = opts.body ? breedOf(opts.body) : (breedOf(keyA) === 'mutt' || (keyB != null && breedOf(keyB) === 'mutt')) ? 'mutt' : breedOf(keyA);
    const rows = {}, coatEyes = {};
    let viable = 0;
    offspringDist(ga, gb).forEach(({ g, p }) => {
      if (both(g.M, 'M')) return;
      viable += p;
      const coat = phenotype(g, body).coatName, ed = eyeDist(g);
      Object.keys(ed).forEach((e) => {
        const key = opts.byCoat ? coat : coat + '\u0000' + e;
        if (!rows[key]) rows[key] = { coat, eyes: e, p: 0 };
        rows[key].p += p * ed[e];
        const ce = coatEyes[coat] || (coatEyes[coat] = {});
        ce[e] = (ce[e] || 0) + p * ed[e];
      });
    });
    if (viable <= 0) return [];
    return Object.keys(rows).map((k) => {
      const r = rows[k];
      if (opts.byCoat) { const ce = coatEyes[r.coat]; r.eyes = Object.keys(ce).sort((x, y) => ce[y] - ce[x])[0]; }
      const q = r.p / viable;
      return { coat: r.coat, eyes: r.eyes, pct: q * 100, odds: oddsText(q) };
    }).sort((x, y) => y.pct - x.pct || (x.coat < y.coat ? -1 : x.coat > y.coat ? 1 : 0) || (x.eyes < y.eyes ? -1 : 1));
  }

  /* ---------- coat catalog ---------- */
  // unordered genotype classes allowed by a breed's FREQ (0 -> dominant only, 1 -> recessive only)
  function locusClasses(rec, dom, p) {
    const out = [];
    if (p < 1) out.push({ pair: [dom, dom], p: (1 - p) * (1 - p) });
    if (p > 0 && p < 1) out.push({ pair: [dom, rec], p: 2 * p * (1 - p) });
    if (p > 0) out.push({ pair: [rec, rec], p: p * p });
    return out;
  }
  function breedSpace(breed) {
    const f = FREQ[breed];
    const per = [
      ['B', locusClasses('b', 'B', f.b)], ['D', locusClasses('d', 'D', f.d)], ['E', locusClasses('e', 'E', f.e)],
      ['S', locusClasses('sp', 'S', f.sp)],
      ['M', f.M > 0 ? [{ pair: ['m', 'm'], p: 1 - f.M }, { pair: ['M', 'm'], p: f.M }] : [{ pair: ['m', 'm'], p: 1 }]],
      ['Bl', locusClasses('bl', 'Bl', 1 - f.Bl)]
    ].concat(f.a > 0 ? [['A', locusClasses('a', 'at', f.a)]] : []); // v2.21: the tan-point locus for a breed that has it
    const out = [];
    (function rec(i, g, p) {
      if (i === per.length) { out.push({ g: Object.assign({}, g), p }); return; }
      per[i][1].forEach((o) => { g[per[i][0]] = o.pair; rec(i + 1, g, p * o.p); });
    })(0, {}, 1);
    return out;
  }
  const PIG_NEED = {
    red: 'red genes from both parents',
    cream: 'red and dilute genes from both parents',
    black: 'a dark (non-red) gene from at least one parent',
    liver: 'chocolate genes from both parents',
    blue: 'dilute genes from both parents',
    lilac: 'chocolate and dilute genes from both parents',
    apricot: 'red and chocolate genes from both parents',
    redliver: 'red and chocolate genes from both parents',
    solid: 'dark-coat genes from both parents',
    // v2.12 shade keys
    white: 'red genes from both parents',
    deep: 'red genes and no chocolate gene from both parents',
    dblue: 'dilute and dark-coat genes from both parents',
    brindle: 'dark-coat genes from both parents',
  }; // v2.21: the Aussie's copper shade keys (...cu) take the hint of their pigment, and no copper is its own part (hintFor)
  // The "how" hint is built from short noun phrases and joined by a list in the current language; it is made when asked for (never cached),
  // so a language switch shows at once.
  function hintFor(breed, sk, merle, whiteLvl, p, defaultSk) {
    const f = FREQ[breed], parts = [], need = (k) => D('pig_need.' + k, PIG_NEED[k]);
    // a pigment that every dog of this breed has (golden: always e/e) needs no hint
    const fixedRed = f.e >= 1 && (sk === 'red');
    if (COPPER[breed] && /^(black|liver|blue|lilac)(cu)?$/.test(sk)) { // v2.21 aussie: copper (at_) is the classic look, no copper needs a/a from both parents
      const base = sk.replace(/cu$/, ''), dbase = String(defaultSk).replace(/cu$/, '');
      if (base !== dbase) parts.push(need(base));
      if (!/cu$/.test(sk)) parts.push(L('mod.genes.need_nocopper_both', 'no-copper genes from both parents'));
    } else if (sk !== defaultSk && !fixedRed) parts.push(need(f.e >= 1 && sk === 'cream' ? 'blue' : f.e >= 1 && sk === 'redliver' ? 'liver' : sk));
    if (merle) parts.push(breed === 'dachs' ? L('mod.genes.need_dapple', 'one dapple parent (never two)') : L('mod.genes.need_merle', 'one merle parent (never two)'));
    if (PARTI_BY[breed]) { if (whiteLvl < 2) parts.push(L('mod.genes.need_solid_one', 'a solid-coat gene from one parent')); } // v2.21 cavalier: the parti coat is the classic one
    else if (WHITE_TRIM[breed]) { if (!whiteLvl) parts.push(L('mod.genes.need_solid_both', 'solid-coat genes from both parents')); } // v2.21 aussie: the white trim is the classic look
    else if (whiteLvl === 2 && f.sp < 1) parts.push(L('mod.genes.need_spotting_both', 'spotting genes from both parents'));
    else if (whiteLvl === 1 && !WHITE_MARKED[breed]) parts.push(L('mod.genes.need_spotting_one', 'a spotting gene from one parent'));
    else if (whiteLvl === 0 && TRI_SOLID[breed] && TRI_SOLID[breed][sk] && !merle) parts.push(L('mod.genes.need_solid_both', 'solid-coat genes from both parents'));
    let s;
    if (!parts.length) s = L('mod.genes.how_classic', 'The classic {breed} look.', { breed: bn(breed) });
    else if (parts.length === 1 && sk === 'blue' && !merle) s = L('mod.genes.how_soft_blue', 'Two parents who carry dilute can make this soft blue.');
    else s = L('mod.genes.how_needs', 'Needs {list}.', { list: listOf(parts) });
    if (p < 0.005) s = L('mod.genes.how_very_rare', '{how} Very rare!', { how: s });
    return s;
  }
  const catalogCache = {};
  /**
   * coatCatalog(breedKey) -> [{ coat, rare, how }] sorted from most to least common.
   * Every coatName phenotype() can produce for the breed from the genotypes randomGenotype() can produce
   * (FREQ: a 0 frequency locks the dominant allele, 1 locks the recessive one; pug: no merle or piebald, ...).
   * rare = lilac, cream, apricot, greyhound red or any visible merle, or under 1% of random dogs of the breed.
   * Returns fresh copies (safe to mutate).
   */
  function coatCatalog(breedKey) {
    const breed = breedOf(breedKey);
    if (!catalogCache[breed]) {
      const byName = {}, pigP = {};
      breedSpace(breed).forEach(({ g, p }) => {
        const ph = phenotype(g, breed);
        const sk = shadeKey(g, breed, ph.pigment);
        pigP[sk] = (pigP[sk] || 0) + p;
        const e = byName[ph.coatName] || (byName[ph.coatName] = { coat: ph.coatName, p: 0, sk, merle: ph.coat.merle, white: both(g.S, 'sp') ? 2 : has(g.S, 'sp') ? 1 : 0 });
        e.p += p;
      });
      const defaultSk = Object.keys(pigP).sort((x, y) => pigP[y] - pigP[x])[0];
      catalogCache[breed] = Object.keys(byName).map((n) => byName[n])
        .sort((x, y) => y.p - x.p || (x.coat < y.coat ? -1 : 1))
        .map((e) => ({
          coat: e.coat,
          rare: e.merle || e.sk === 'lilac' || e.sk === 'cream' || e.sk === 'apricot' || e.sk === 'redliver' || e.p < 0.01,
          args: [breed, e.sk, e.merle, e.white, e.p, defaultSk],
          p: e.p
        }));
    }
    return catalogCache[breed].map((e) => ({ coat: e.coat, rare: e.rare, how: hintFor.apply(null, e.args) }));
  }

  /* ---------- gene test text ---------- */
  /**
   * describe(genes) -> { lines: [string x6], carriers: [string], summary: string }
   * lines: one per locus in B, D, E, S, M, Bl order, dominant allele first, e.g. 'B/b: black coat, carries liver'.
   * carriers: hidden genes this dog can pass on, from ['liver', 'dilute', 'red', 'piebald', 'merle'] in that order
   *   ('merle' only when it is hidden by a red coat). summary: one plain sentence for the vet card.
   */
  function describe(genes) {
    const g = normGenes(genesOf(genes)), red = both(g.E, 'e');
    const fmt = (k, dom) => { const p = g[k]; return (p[0] === dom || p[1] !== dom ? p[0] + '/' + p[1] : p[1] + '/' + p[0]); };
    // one whole sentence per line, so a language can order the words and punctuate (colon, brackets) its own way; {pair} is the allele pair ("B/b")
    const lines = [], carriers = [], pr = (k, dom) => ({ pair: fmt(k, dom) });
    // B
    if (both(g.B, 'b')) {
      if (red) lines.push(L('mod.genes.line_b_liver_hidden', '{pair}: liver (chocolate) pigment (hidden under the red coat), amber eyes', pr('B', 'B')));
      else lines.push(L('mod.genes.line_b_liver', '{pair}: liver (chocolate) pigment, amber eyes', pr('B', 'B')));
    } else if (has(g.B, 'b')) {
      if (red) lines.push(L('mod.genes.line_b_carry_red', '{pair}: black pigment (nose and eye rims), carries liver', pr('B', 'B')));
      else lines.push(L('mod.genes.line_b_carry', '{pair}: black coat, carries liver', pr('B', 'B')));
      carriers.push('liver');
    } else if (red) lines.push(L('mod.genes.line_b_black_red', '{pair}: black pigment (nose and eye rims)', pr('B', 'B')));
    else lines.push(L('mod.genes.line_b_black', '{pair}: black coat', pr('B', 'B')));
    // D
    if (both(g.D, 'd')) {
      if (red) lines.push(L('mod.genes.line_d_dilute_red', '{pair}: dilute, soft colour (red becomes cream)', pr('D', 'D')));
      else if (both(g.B, 'b')) lines.push(L('mod.genes.line_d_dilute_liver', '{pair}: dilute, soft colour (liver becomes lilac)', pr('D', 'D')));
      else lines.push(L('mod.genes.line_d_dilute_black', '{pair}: dilute, soft colour (black becomes blue)', pr('D', 'D')));
    }
    else if (has(g.D, 'd')) { lines.push(L('mod.genes.line_d_carry', '{pair}: full colour, carries dilute', pr('D', 'D'))); carriers.push('dilute'); }
    else lines.push(L('mod.genes.line_d_full', '{pair}: full colour', pr('D', 'D')));
    // E
    if (red) lines.push(L('mod.genes.line_e_red', '{pair}: red coat (red, gold or fawn by breed)', pr('E', 'E')));
    else if (has(g.E, 'e')) { lines.push(L('mod.genes.line_e_carry', '{pair}: dark coat, carries red', pr('E', 'E'))); carriers.push('red'); }
    else lines.push(L('mod.genes.line_e_dark', '{pair}: dark coat, no red gene', pr('E', 'E')));
    // S
    if (both(g.S, 'sp')) lines.push(L('mod.genes.line_s_pied', '{pair}: piebald, big white patches', pr('S', 'S')));
    else if (has(g.S, 'sp')) { lines.push(L('mod.genes.line_s_carry', '{pair}: small white markings, carries piebald', pr('S', 'S'))); carriers.push('piebald'); }
    else lines.push(L('mod.genes.line_s_none', '{pair}: no extra white', pr('S', 'S')));
    // M (M/M is never bred, but describe it honestly if handed one)
    if (both(g.M, 'M')) lines.push(L('mod.genes.line_m_double', 'M/M: double merle'));
    else if (has(g.M, 'M')) {
      if (red) { lines.push(L('mod.genes.line_m_hidden', '{pair}: hidden merle (the red coat hides the marbling)', pr('M', 'M'))); carriers.push('merle'); }
      else lines.push(L('mod.genes.line_m_merle', '{pair}: merle marbling (never pair with another merle)', pr('M', 'M')));
    } else lines.push(L('mod.genes.line_m_none', '{pair}: no merle', pr('M', 'M')));
    // Bl
    if (both(g.Bl, 'Bl')) lines.push(L('mod.genes.line_bl_blue', '{pair}: blue eyes', pr('Bl', 'Bl')));
    else if (has(g.Bl, 'Bl')) lines.push(L('mod.genes.line_bl_odd', '{pair}: blue eyes (sometimes one blue, one brown)', pr('Bl', 'Bl')));
    else lines.push(L('mod.genes.line_bl_none', '{pair}: no blue-eye gene', pr('Bl', 'Bl')));
    // v2.21: the tan-point locus, only for genes that carry it (the Aussie and its family; every older dog keeps its six lines)
    if (tanOk(g.A)) {
      if (both(g.A, 'a')) lines.push(L('mod.genes.line_a_none', '{pair}: no copper points', pr('A', 'at')));
      else if (has(g.A, 'a')) lines.push(L('mod.genes.line_a_carry', '{pair}: copper points, carries no copper', pr('A', 'at')));
      else lines.push(L('mod.genes.line_a_copper', '{pair}: copper points', pr('A', 'at')));
    }
    if (redOk(g.I)) { // red intensity (RED_I), only for genes that carry it
      if (both(g.I, 'I')) lines.push(L('mod.genes.line_i_deep', '{pair}: deep red (fox red on a red coat)', pr('I', 'I')));
      else if (has(g.I, 'I')) lines.push(L('mod.genes.line_i_half', '{pair}: a deeper red, in between', pr('I', 'I')));
      else lines.push(L('mod.genes.line_i_none', '{pair}: the usual red', pr('I', 'I')));
    }

    // the hidden genes (carriers keep their ids) and what a puppy could look like, as lists in the current language
    const CARRY = { liver: () => L('mod.genes.carry_liver', 'liver'), dilute: () => L('mod.genes.carry_dilute', 'dilute'), red: () => L('mod.genes.carry_red', 'red'),
      piebald: () => L('mod.genes.carry_piebald', 'piebald'), merle: () => L('mod.genes.carry_merle', 'merle') };
    const PUP = { liver: () => L('mod.genes.pup_liver', 'chocolate'), dilute: () => L('mod.genes.pup_dilute', 'blue'), red: () => L('mod.genes.pup_red', 'red'),
      piebald: () => L('mod.genes.pup_piebald', 'piebald'), merle: () => L('mod.genes.pup_merle', 'merle') };
    const word = (T, c) => T[c]();
    const summary = carriers.length
      ? L('mod.genes.summary_carries', 'Carries {list}. With the right partner, {pups} puppies are possible.',
        { list: listOf(carriers.map((c) => word(CARRY, c))), pups: listOf(carriers.map((c) => word(PUP, c)), 'disjunction') })
      : L('mod.genes.summary_none', 'No hidden surprises: this dog passes on what you see.');
    return { lines, carriers, summary };
  }

  /* =====================================================================
     v2.1 additions (GENES lane, V21.md section 3). Additive and pure: nothing above changed.
     ancestry, grandMix, sparkleOdds, coatCatalog(k, { all: true }), fracText.
     ===================================================================== */

  /* ---------- coat catalog over ANY genotype (mix puppies) ---------- */
  // Alleles a breed's FREQ never produces (0 locks the dominant allele, 1 locks the recessive one).
  // Bl is left out: it never changes the coat name.
  function foreignAlleles(breed) {
    const f = FREQ[breed], out = {};
    if (f.b <= 0) out.b = 1; if (f.b >= 1) out.B = 1;
    if (f.d <= 0) out.d = 1; if (f.d >= 1) out.D = 1;
    if (f.e <= 0) out.e = 1; if (f.e >= 1) out.E = 1;
    if (f.sp <= 0) out.sp = 1; if (f.sp >= 1) out.S = 1;
    if (f.M <= 0) out.M = 1;
    return out;
  }
  const FOREIGN_WORDS = { b: () => L('mod.genes.foreign_chocolate', 'chocolate'), B: () => L('mod.genes.foreign_black', 'black'), d: () => L('mod.genes.foreign_dilute', 'dilute'),
    D: () => L('mod.genes.foreign_full_colour', 'full-colour'), e: () => L('mod.genes.foreign_red', 'red'), E: () => L('mod.genes.foreign_dark_coat', 'dark-coat'),
    sp: () => L('mod.genes.foreign_spotting', 'spotting'), S: () => L('mod.genes.foreign_solid_coat', 'solid-coat'), M: () => L('mod.genes.foreign_merle', 'merle') };
  const FOREIGN_ORDER = ['E', 'e', 'B', 'b', 'D', 'd', 'S', 'sp', 'M'];
  const ALL_PAIRS = { B: [['B', 'B'], ['B', 'b'], ['b', 'b']], D: [['D', 'D'], ['D', 'd'], ['d', 'd']], E: [['E', 'E'], ['E', 'e'], ['e', 'e']], S: [['S', 'S'], ['S', 'sp'], ['sp', 'sp']], M: [['m', 'm'], ['M', 'm']] };
  const allCatalogCache = {};
  /** The coat names phenotype() can give a body breed from any viable genotype (M/M excluded), that the breed's own
      genotypes cannot: [{ coat, rare: true, how, extra: true }], fewest foreign genes first. */
  function extraCoats(breed) {
    if (allCatalogCache[breed]) return allCatalogCache[breed];
    const own = {}; coatCatalog(breed).forEach((c) => { own[c.coat] = 1; });
    const foreign = foreignAlleles(breed), best = {};
    const loci = ['B', 'D', 'E', 'S', 'M'];
    (function rec(i, g) {
      if (i === loci.length) {
        const name = phenotype(Object.assign({ Bl: ['bl', 'bl'] }, g), breed).coatName;
        if (own[name]) return;
        const need = {};
        loci.forEach((k) => { g[k].forEach((a) => { if (foreign[a]) need[a] = 1; }); });
        const list = FOREIGN_ORDER.filter((a) => need[a]);
        if (!best[name] || list.length < best[name].length) best[name] = list;
        return;
      }
      ALL_PAIRS[loci[i]].forEach((p) => { g[loci[i]] = p; rec(i + 1, g); });
    })(0, {});
    allCatalogCache[breed] = Object.keys(best)
      .sort((x, y) => best[x].length - best[y].length || (x < y ? -1 : 1))
      .map((name) => ({ coat: name, rare: true, need: best[name], extra: true })); // the hint text is made when asked for (hintExtra), in the current language
    return allCatalogCache[breed];
  }
  /**
   * coatCatalog(breedKey, { all: true }) -> the default catalog (unchanged, same order), followed by every other coat
   * phenotype() can give this body breed from ANY genotype (a mix puppy), flagged extra: true with a how hint
   * like 'Only from a mix parent with merle genes.'. Without { all: true } it is exactly the v2 coatCatalog.
   */
  function hintExtra(l) {
    const words = l.map((a) => FOREIGN_WORDS[a]());
    let how = l.length ? L('mod.genes.how_mix_with', 'Only from a mix parent with {genes} genes.', { genes: listOf(words) }) : L('mod.genes.how_mix_only', 'Only from a mix parent.');
    if (l.indexOf('M') >= 0) how = L('mod.genes.how_mix_merle', '{how} Never pair two merles.', { how });
    return how;
  }
  function coatCatalogV21(breedKey, opts) {
    const base = coatCatalog(breedKey);
    if (!opts || !opts.all) return base;
    const breed = breedOf(breedKey);
    return base.concat(extraCoats(breed).map((e) => ({ coat: e.coat, rare: e.rare, how: hintExtra(e.need), extra: true })));
  }

  /* ---------- ancestry ---------- */
  const ANC_UNITS = 64;
  function parentIds(rec) {
    const p = rec && rec.parents;
    if (!p) return null;
    if (Array.isArray(p)) return p.length >= 2 && p[0] != null && p[1] != null ? [p[0], p[1]] : null;
    if (typeof p === 'object' && p.dam != null && p.sire != null) return [p.dam, p.sire];
    return null;
  }
  function validAnc(a) {
    if (!a || typeof a !== 'object' || Array.isArray(a)) return false;
    return Object.keys(a).some((k) => typeof a[k] === 'number' && a[k] > 0);
  }
  // { key: share } with unknown keys folded into 'mutt' and non-positive shares dropped (unrounded)
  function foldAnc(a) {
    const out = {};
    Object.keys(a).forEach((k) => { const v = a[k]; if (typeof v === 'number' && v > 0 && isFinite(v)) { const b = breedOf(k); out[b] = (out[b] || 0) + v; } });
    return out;
  }
  function baseAnc(rec) {
    const m = rec && rec.mix, out = {};
    if (m && m.a != null && m.b != null) { out[breedOf(m.a)] = (out[breedOf(m.a)] || 0) + 0.5; out[breedOf(m.b)] = (out[breedOf(m.b)] || 0) + 0.5; return out; }
    out[breedOf(rec && rec.key)] = 1;
    return out;
  }
  // Round to multiples of 1/64 that still sum to exactly 1 (largest remainder, ties in BREEDS order).
  function roundAnc(a) {
    const keys = Object.keys(a).sort((x, y) => BREEDS.indexOf(x) - BREEDS.indexOf(y));
    const tot = keys.reduce((s, k) => s + a[k], 0) || 1;
    const units = keys.map((k) => { const u = a[k] / tot * ANC_UNITS; return { k, n: Math.floor(u + 1e-9), r: u - Math.floor(u + 1e-9) }; });
    let left = ANC_UNITS - units.reduce((s, u) => s + u.n, 0);
    units.slice().sort((x, y) => y.r - x.r || BREEDS.indexOf(x.k) - BREEDS.indexOf(y.k)).forEach((u) => { if (left > 0) { u.n++; left--; } });
    const out = {};
    units.forEach((u) => { if (u.n > 0) out[u.k] = u.n / ANC_UNITS; });
    return out;
  }
  /**
   * ancestry(rec, lookup, depth = 6) -> { breedKey: fraction } (multiples of 1/64, summing to 1), or null without a rec.
   * - rec / lookup(id) records: { id, key, mix, parents, anc? }. parents is [idA, idB] or { dam, sire }.
   * - rec.anc (a non-empty object) is returned unchanged. A parent's anc is used as that parent's share.
   * - Both parents resolve: the average of their ancestries (recursive, memoised by id for this call).
   *   Otherwise, or past `depth` generations: mix { a, b } -> { a: 1/2, b: 1/2 }, else { key: 1 }.
   * - Unknown breed keys count as 'mutt'. Pure: lookup is only read.
   */
  function ancestry(rec, lookup, depth) {
    if (!rec || typeof rec !== 'object') return null;
    if (validAnc(rec.anc)) return rec.anc;
    const D = depth == null ? 6 : Math.max(0, Math.floor(Number(depth) || 0));
    const look = typeof lookup === 'function' ? lookup : () => null;
    const memo = new Map(), busy = new Set();
    function raw(r, left) {
      if (validAnc(r.anc)) return foldAnc(r.anc);
      const id = r.id;
      const mk = id != null ? id + '\u0000' + left : null;
      if (mk != null && memo.has(mk)) return memo.get(mk);
      let out;
      const pids = left > 0 ? parentIds(r) : null;
      let pa = null, pb = null;
      if (pids && !(id != null && busy.has(id))) {
        try { pa = look(pids[0]); pb = look(pids[1]); } catch (e) { pa = pb = null; }
      }
      if (pa && pb && typeof pa === 'object' && typeof pb === 'object') {
        if (id != null) busy.add(id);
        const a = raw(pa, left - 1), b = raw(pb, left - 1);
        if (id != null) busy.delete(id);
        out = {};
        [a, b].forEach((x) => Object.keys(x).forEach((k) => { out[k] = (out[k] || 0) + x[k] / 2; }));
      } else out = baseAnc(r);
      if (mk != null) memo.set(mk, out);
      return out;
    }
    return roundAnc(raw(rec, D));
  }

  /* ---------- grand-mixes ---------- */
  function gcd(a, b) { while (b) { const t = a % b; a = b; b = t; } return a; }
  /** fracText(0.25) -> '1/4', fracText(0.375) -> '3/8', fracText(1) -> '1' (rounded to 1/64 first). */
  function fracText(x) {
    const n = Math.round(Number(x) * ANC_UNITS);
    if (n <= 0) return '0';
    if (n >= ANC_UNITS) return '1';
    const g = gcd(n, ANC_UNITS);
    return (n / g) + '/' + (ANC_UNITS / g);
  }
  const GRAND_RECIPES = [
    { name: 'Sled Noodle', breeds: ['corgi', 'husky', 'dachs'] },
    { name: 'Sunrise Loaf', breeds: ['shiba', 'corgi', 'golden'] },
    { name: 'Snowdrift', breeds: ['golden', 'husky', 'mutt'] }
  ];
  const AT = (x, t) => x >= t - 1e-9;
  /**
   * grandMix(anc) -> { kind, name, label, breeds: [[key, frac], ...] } (breeds sorted by share, ties in BREEDS order).
   * First matching rule wins:
   *  1. 4+ breeds at 1/8 or more: kind 'everything', 'The Everything Dog', label 'The Everything Dog: yes.'
   *  2. 3+ breeds at 1/4 or more: kind 'grand' for the 3 named recipes (label 'Sled Noodle: Corgi + Husky + Dachshund'),
   *     otherwise kind 'family', '<Top breed> family mix'.
   *  3. top breed 3/4 or more: kind 'breed', name = breed name, label 'Corgi, 1/4 Husky' (just 'Corgi' when pure).
   *  4. top two at 1/4 or more: kind 'mix', name = MIXES name, label 'Horgi: Corgi × Husky'.
   *  5. otherwise kind 'family', '<Top breed> family mix'.
   * Unknown keys count as 'mutt'. An empty or missing anc counts as { mutt: 1 }.
   */
  function grandMix(anc) {
    let a = validAnc(anc) ? foldAnc(anc) : { mutt: 1 };
    const breeds = Object.keys(a).map((k) => [k, a[k]]).sort((x, y) => y[1] - x[1] || BREEDS.indexOf(x[0]) - BREEDS.indexOf(y[0]));
    const nm = (k) => BREED_NAMES[k];
    const top = breeds[0], family = nm(top[0]) + ' family mix';
    // name, kind and breeds stay English (the game keeps them); label is the line shown to the player, in the current language
    const res = (kind, name, label) => ({ kind, name, label, breeds: breeds.map((b) => [b[0], b[1]]) });
    const familyLabel = () => L('mod.genes.label_family', '{breed} family mix', { breed: bn(top[0]) });
    if (breeds.filter((b) => AT(b[1], 0.125)).length >= 4) return res('everything', 'The Everything Dog', L('mod.genes.label_everything', 'The Everything Dog: yes.'));
    const big = breeds.filter((b) => AT(b[1], 0.25));
    if (big.length >= 3) {
      const three = big.slice(0, 3).map((b) => b[0]);
      const r = GRAND_RECIPES.find((g) => g.breeds.every((k) => three.indexOf(k) >= 0));
      if (r) return res('grand', r.name, L('mod.genes.label_grand', '{name}: {a} + {b} + {c}', { name: D('grand_recipes.' + idOf(r.name) + '.name', r.name), a: bn(r.breeds[0]), b: bn(r.breeds[1]), c: bn(r.breeds[2]) }));
      return res('family', family, familyLabel());
    }
    if (AT(top[1], 0.75)) {
      const rest = breeds.slice(1).filter((b) => fracText(b[1]) !== '0').map((b) => L('mod.genes.label_rest', '{frac} {breed}', { frac: fracText(b[1]), breed: bn(b[0]) }));
      return res('breed', nm(top[0]), commaJoin([bn(top[0])].concat(rest)));
    }
    if (big.length >= 2) {
      const m = MIXES[mixKey(big[0][0], big[1][0])];
      return res('mix', m.name, L('mod.genes.label_mix', '{name}: {a} × {b}', { name: mixLabel(m.name), a: bn(big[0][0]), b: bn(big[1][0]) }));
    }
    return res('family', family, familyLabel());
  }

  /* ---------- Sparkle odds ---------- */
  const multText = (x) => String(Math.round(x * 100) / 100);
  const bondLv = (b) => { const v = b && typeof b === 'object' ? b.level : b; return Number(v) || 0; };
  /**
   * sparkleOdds({ stone, sparkleParents: 0|1|2, bondA, bondB, base = 1/512 }) -> { p, mult, parts: [{ label, x }], text }
   * Boosts multiply: Sparkle Stone ×4; each Sparkle parent ×1.5 (one part, 'Sparkle parent' ×1.5 or
   * '2 Sparkle parents' ×2.25); both parents Bond 10 ×2, otherwise both Bond 8+ ×1.5.
   * bondA / bondB are levels (or { level }). text: '1 in 64 today: Sparkle Stone ×4, Bond 10 ×2', or '1 in 512'
   * with no boosts. Cosmetic only: these odds never change anything but the Sparkle roll.
   */
  function sparkleOdds(o) {
    o = o || {};
    const base = typeof o.base === 'number' && o.base > 0 ? o.base : 1 / 512;
    const parts = [];
    if (o.stone) parts.push({ label: L('mod.genes.sparkle_stone', 'Sparkle Stone'), x: 4 });
    const sp = Math.max(0, Math.min(2, Math.floor(Number(o.sparkleParents) || 0)));
    if (sp === 1) parts.push({ label: L('mod.genes.sparkle_parent', 'Sparkle parent'), x: 1.5 });
    else if (sp === 2) parts.push({ label: L('mod.genes.sparkle_parents_2', '2 Sparkle parents'), x: 2.25 });
    const ba = bondLv(o.bondA), bb = bondLv(o.bondB);
    if (ba >= 10 && bb >= 10) parts.push({ label: L('mod.genes.sparkle_bond_10', 'Bond 10'), x: 2 });
    else if (ba >= 8 && bb >= 8) parts.push({ label: L('mod.genes.sparkle_bond_8', 'Bond 8+'), x: 1.5 });
    const mult = parts.reduce((m, q) => m * q.x, 1);
    const p = Math.min(1, base * mult);
    const odds = p >= 1 ? L('mod.genes.sparkle_every', 'Every puppy') : L('mod.genes.sparkle_1_in', '1 in {n}', { n: String(Math.max(1, Math.round(1 / p))) });
    const text = parts.length
      ? L('mod.genes.sparkle_today', '{odds} today: {parts}', { odds, parts: commaJoin(parts.map((q) => L('mod.genes.sparkle_part', '{label} ×{x}', { label: q.label, x: multText(q.x) }))) })
      : odds;
    return { p, mult, parts, text };
  }

  const api = { LOCI, LOCUS_KEYS, TAN, RED_I, TAN_ART, INTENSE, BREEDS, SIZE, STARTER_GENES, SHADES, FREQ, WORDS, WHITE_MARKED, phenotype, pigment, randomGenotype, inherit, isDoubleMerle, related,
    BREED_NAMES, MIXES, mixKey, mixOf, predict, coatCatalog: coatCatalogV21, describe,
    ancestry, grandMix, sparkleOdds, fracText, GRAND_RECIPES,
    coatLabel, mixLabel, mixName, breedLabel: bn }; // v2.14: display helpers (the returned data stays English)
  root.PawGenes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);

  };
  genes.call(shim, shim, shim, undefined);
  var font = (function (module) {
/* generated by tools/merch_font.py: Caveat Bold (SIL OFL 1.1) as outlines, y down, baseline 0, units per em 1000. Do not edit. */
var PAWPRINT_FONT = {"upm":1000,"asc":960,"desc":-300,"cap":610,"g":{" ":[242,""],"!":[210,"M199 -161Q171 -156 155 -184Q139 -213 157 -285Q163 -297 167 -308Q171 -320 171 -327Q175 -340 182 -358Q188 -375 195 -390Q202 -406 205 -411Q209 -411 214 -418Q218 -425 218 -432Q218 -440 222 -450Q225 -460 229 -464Q229 -469 233 -475Q237 -481 237 -485Q237 -489 240 -492Q242 -495 242 -499Q251 -515 266 -546Q280 -578 294 -613Q309 -648 319 -675Q329 -702 329 -708Q331 -716 335 -723Q339 -730 347 -728Q351 -731 359 -732Q367 -732 371 -732Q371 -732 380 -728Q389 -724 396 -716Q404 -709 405 -697Q406 -685 406 -673Q405 -654 392 -630Q379 -606 363 -577Q353 -558 344 -541Q334 -524 334 -520Q334 -516 330 -508Q326 -500 321 -488Q315 -478 310 -464Q304 -450 300 -438Q296 -427 296 -424Q295 -420 294 -416Q292 -412 288 -408Q284 -408 284 -402Q283 -397 283 -397Q283 -393 278 -378Q274 -364 264 -344Q245 -291 237 -260Q229 -228 227 -206Q225 -182 216 -174Q207 -165 199 -161ZM146 -6Q125 2 111 1Q97 1 80 -12Q60 -32 66 -52Q73 -73 102 -92Q122 -105 132 -106Q141 -106 160 -98Q194 -77 190 -51Q186 -26 146 -6Z"],"\"":[237,"M200 -431Q184 -428 174 -430Q165 -433 158 -439Q156 -450 161 -462Q166 -473 171 -480Q183 -500 198 -528Q214 -555 219 -570Q221 -581 226 -598Q230 -616 230 -635Q230 -640 232 -651Q235 -662 240 -671Q244 -680 249 -677Q258 -673 272 -666Q286 -659 296 -650Q307 -641 305 -630Q303 -606 294 -578Q286 -550 280 -530Q274 -508 258 -484Q241 -461 224 -441Q225 -437 218 -436Q211 -435 200 -431ZM331 -431Q316 -428 306 -430Q297 -433 290 -439Q287 -450 292 -462Q297 -473 302 -480Q314 -500 330 -528Q345 -555 350 -570Q352 -581 356 -598Q361 -616 361 -635Q361 -640 364 -651Q366 -662 370 -671Q375 -680 380 -677Q389 -673 403 -666Q417 -659 428 -650Q438 -641 436 -630Q434 -606 426 -578Q417 -550 411 -530Q405 -508 388 -484Q372 -461 355 -441Q356 -437 349 -436Q342 -435 331 -431Z"],"#":[559,"M402 148Q383 153 368 138Q354 123 348 94Q342 65 350 28Q355 16 358 4Q361 -7 361 -14Q363 -22 371 -50Q379 -77 390 -113Q402 -149 414 -184Q425 -220 434 -244Q442 -269 444 -272Q448 -272 451 -279Q454 -286 454 -293Q454 -301 458 -311Q461 -321 465 -325Q465 -330 468 -336Q470 -343 470 -347Q470 -351 472 -355Q475 -359 475 -363Q481 -374 494 -404Q506 -435 522 -476Q539 -518 556 -562Q573 -607 588 -647Q603 -687 612 -713Q621 -739 621 -743Q621 -751 632 -760Q643 -768 651 -768Q654 -771 658 -772Q663 -773 667 -773Q667 -773 671 -769Q675 -765 683 -757Q691 -750 700 -736Q709 -723 709 -711Q709 -698 706 -688Q703 -678 694 -659Q685 -640 666 -600Q663 -592 654 -572Q645 -552 634 -527Q624 -502 614 -478Q603 -455 596 -439Q590 -423 590 -421Q590 -417 586 -409Q583 -401 579 -389Q575 -381 568 -366Q561 -350 554 -332Q546 -315 541 -302Q536 -290 536 -288Q536 -284 536 -280Q535 -276 531 -272Q527 -272 526 -266Q526 -261 526 -261Q526 -251 510 -208Q503 -186 493 -151Q483 -116 472 -77Q460 -37 450 0Q440 38 434 66Q427 94 427 105Q427 129 418 136Q410 144 402 148ZM140 -173Q134 -173 125 -174Q116 -174 105 -178Q90 -178 81 -184Q72 -190 68 -197Q57 -212 70 -220Q83 -227 120 -231Q131 -234 165 -236Q199 -238 246 -240Q292 -241 343 -242Q395 -243 442 -244Q490 -244 525 -244Q561 -245 574 -245Q600 -245 609 -241Q618 -237 629 -226Q644 -211 636 -195Q629 -179 606 -183Q599 -182 584 -181Q568 -180 550 -178Q546 -178 518 -178Q489 -177 446 -176Q402 -176 353 -176Q305 -175 260 -174Q214 -174 182 -174Q150 -173 140 -173ZM154 148Q135 153 120 138Q106 123 100 94Q94 65 102 28Q107 16 110 4Q113 -7 113 -14Q115 -22 123 -50Q131 -77 142 -113Q154 -149 166 -184Q177 -220 186 -244Q194 -269 196 -272Q200 -272 203 -279Q206 -286 206 -293Q206 -301 210 -311Q213 -321 217 -325Q217 -330 220 -336Q222 -343 222 -347Q222 -351 224 -355Q227 -359 227 -363Q233 -374 246 -404Q258 -435 274 -476Q291 -518 308 -562Q325 -607 340 -647Q355 -687 364 -713Q373 -739 373 -743Q373 -751 384 -760Q395 -768 403 -768Q406 -771 410 -772Q415 -773 419 -773Q419 -773 423 -769Q427 -765 435 -757Q443 -750 452 -736Q461 -723 461 -711Q461 -698 458 -688Q455 -678 446 -659Q437 -640 418 -600Q415 -592 406 -572Q397 -552 386 -527Q376 -502 366 -478Q355 -455 348 -439Q342 -423 342 -421Q342 -417 338 -409Q335 -401 331 -389Q327 -381 320 -366Q313 -350 306 -332Q298 -315 293 -302Q288 -290 288 -288Q288 -284 288 -280Q287 -276 283 -272Q279 -272 278 -266Q278 -261 278 -261Q278 -251 262 -208Q255 -186 245 -151Q235 -116 224 -77Q212 -37 202 0Q192 38 186 66Q179 94 179 105Q179 129 170 136Q162 144 154 148ZM201 -374Q195 -374 186 -374Q177 -375 166 -379Q151 -379 142 -384Q134 -390 130 -397Q119 -412 132 -420Q144 -428 181 -432Q192 -435 226 -437Q260 -439 307 -440Q354 -442 405 -443Q457 -444 504 -444Q552 -445 587 -446Q623 -446 636 -446Q662 -446 671 -442Q680 -438 691 -427Q706 -412 698 -396Q690 -380 667 -384Q660 -383 645 -382Q630 -381 612 -379Q608 -379 579 -378Q551 -378 507 -378Q464 -377 415 -376Q366 -376 321 -376Q275 -375 243 -374Q211 -374 201 -374Z"],"$":[450,"M170 124Q159 124 152 116Q146 108 146 93Q146 78 150 58Q154 37 161 11Q165 6 168 1Q170 -4 172 -9Q174 -14 175 -18Q176 -22 177 -26Q178 -30 178 -33Q181 -41 192 -67Q203 -93 218 -127Q233 -161 248 -194Q262 -228 273 -252Q284 -275 286 -278Q290 -278 295 -285Q300 -292 301 -299Q301 -306 302 -312Q304 -318 307 -323Q310 -328 313 -332Q316 -336 319 -340Q322 -344 324 -348Q325 -353 325 -357Q325 -352 338 -376Q351 -400 371 -440Q391 -481 414 -528Q436 -576 456 -620Q477 -665 490 -695Q503 -725 503 -730Q508 -743 518 -743Q519 -743 524 -744Q529 -745 533 -745Q533 -745 536 -744Q538 -743 546 -738Q548 -735 552 -729Q555 -723 558 -714Q560 -706 560 -696Q559 -687 557 -680Q555 -674 552 -668Q548 -661 542 -651Q536 -641 527 -626Q518 -610 505 -586Q495 -568 480 -542Q465 -515 450 -488Q435 -461 424 -440Q412 -418 408 -410Q407 -407 405 -404Q403 -400 402 -397Q400 -394 398 -390Q397 -387 395 -384Q386 -367 374 -346Q362 -324 353 -306Q344 -289 342 -283Q341 -279 340 -274Q338 -270 336 -268Q332 -268 331 -264Q330 -259 326 -248Q323 -236 308 -214Q299 -192 286 -158Q272 -125 257 -88Q242 -51 228 -16Q214 19 205 46Q196 72 194 83Q193 110 188 117Q184 124 170 124ZM164 -33Q148 -33 136 -35Q123 -37 120 -40Q107 -40 89 -54Q71 -67 58 -86Q45 -105 45 -122Q45 -139 57 -150Q69 -161 86 -163Q104 -165 122 -156Q106 -129 116 -116Q127 -102 179 -102Q193 -102 202 -102Q210 -103 221 -104Q234 -105 246 -106Q257 -108 267 -110Q316 -121 334 -138Q352 -155 356 -168Q356 -183 360 -188Q363 -192 363 -197Q363 -206 364 -214Q366 -223 362 -234Q359 -246 344 -264Q330 -281 299 -307Q292 -319 282 -334Q271 -348 258 -355Q254 -360 250 -368Q246 -377 243 -378Q245 -377 236 -388Q227 -399 227 -421Q227 -444 238 -469Q248 -494 272 -513Q280 -523 296 -536Q313 -548 328 -558Q344 -567 347 -567Q355 -567 370 -576Q386 -584 422 -587Q443 -592 453 -594Q463 -597 472 -597Q475 -597 484 -597Q492 -597 523 -585Q552 -574 562 -559Q572 -544 570 -530Q567 -517 558 -508Q550 -499 541 -499Q533 -499 521 -505Q509 -511 494 -517Q480 -523 462 -523Q428 -523 402 -518Q375 -513 354 -489Q328 -473 317 -456Q306 -439 306 -427Q308 -423 312 -412Q315 -402 323 -393Q354 -359 370 -342Q387 -326 394 -320Q400 -314 401 -312Q402 -311 402 -307Q403 -307 408 -302Q412 -296 417 -289Q423 -281 428 -274Q432 -266 432 -264Q432 -266 438 -254Q444 -243 450 -222Q455 -202 455 -176Q455 -168 446 -154Q437 -141 424 -128Q411 -114 400 -105Q386 -94 370 -84Q353 -73 334 -65Q316 -57 295 -51Q281 -47 266 -44Q250 -40 234 -38Q217 -35 200 -34Q182 -33 164 -33Z"],"%":[600,"M140 91Q121 89 110 76Q98 63 102 38Q106 14 132 -22Q140 -30 146 -38Q153 -46 155 -52Q160 -58 177 -78Q193 -98 216 -124Q238 -149 260 -174Q282 -199 297 -216Q313 -234 315 -237Q319 -236 324 -240Q329 -245 331 -252Q334 -260 340 -266Q347 -272 352 -273Q354 -278 358 -282Q363 -286 364 -290Q365 -293 368 -296Q372 -298 373 -302Q382 -309 404 -331Q425 -353 454 -384Q483 -414 514 -447Q544 -480 571 -509Q597 -538 614 -557Q631 -577 632 -580Q636 -593 652 -588Q659 -592 668 -588Q668 -588 676 -578Q685 -568 690 -559Q696 -550 696 -541Q697 -532 692 -524Q688 -513 682 -506Q675 -498 660 -485Q646 -472 616 -445Q609 -438 590 -419Q572 -400 551 -379Q530 -357 515 -340Q500 -324 500 -322Q497 -320 492 -314Q486 -309 479 -300Q471 -293 454 -276Q436 -260 422 -246Q408 -232 407 -230Q405 -227 403 -224Q401 -221 395 -219Q393 -220 391 -217Q388 -213 388 -213Q388 -209 379 -198Q370 -187 355 -173Q339 -154 312 -121Q285 -88 256 -53Q228 -18 207 10Q186 39 181 50Q174 69 161 79Q148 89 140 91ZM479 -36Q494 -53 504 -68Q513 -84 521 -109Q524 -120 524 -138Q524 -156 520 -159Q512 -163 501 -162Q489 -160 477 -148Q456 -132 442 -106Q427 -80 412 -48Q402 -25 408 -10Q413 4 432 0Q451 -5 479 -36ZM396 81Q386 81 379 77Q372 73 364 65Q348 49 338 30Q328 10 331 -4Q333 -11 332 -16Q332 -22 332 -22Q328 -27 330 -28Q332 -29 333 -32Q338 -32 336 -42Q335 -48 343 -70Q352 -93 364 -113Q369 -121 380 -140Q392 -159 406 -178Q419 -197 429 -205Q450 -223 468 -232Q486 -240 505 -244Q524 -249 531 -249Q538 -249 550 -235Q569 -228 586 -208Q604 -188 606 -165Q608 -140 602 -109Q596 -77 564 -30Q543 -1 525 17Q507 35 484 49Q467 60 441 70Q415 80 396 81ZM333 -408Q348 -425 358 -440Q368 -456 375 -481Q379 -492 379 -510Q379 -528 374 -531Q367 -535 355 -534Q344 -532 332 -520Q310 -504 295 -478Q281 -452 266 -420Q257 -397 262 -382Q268 -368 286 -372Q305 -377 333 -408ZM250 -292Q240 -292 233 -296Q226 -300 218 -308Q202 -324 192 -343Q182 -362 185 -376Q187 -383 186 -388Q186 -394 186 -394Q182 -399 184 -400Q186 -401 187 -404Q192 -404 190 -414Q189 -420 197 -442Q206 -465 218 -485Q223 -493 234 -512Q246 -532 260 -551Q273 -570 283 -578Q304 -596 322 -604Q340 -612 359 -616Q378 -621 385 -621Q392 -621 404 -607Q423 -600 440 -580Q458 -561 460 -538Q462 -513 456 -482Q450 -450 418 -403Q397 -374 379 -356Q361 -337 338 -323Q321 -312 295 -302Q269 -293 250 -292Z"],"&":[564,"M667 54Q668 66 654 70Q639 75 616 74Q594 72 571 66Q548 59 533 50Q514 45 485 13Q456 -19 417 -65Q377 -43 352 -30Q327 -16 306 -8Q286 1 258 9Q192 15 137 -4Q129 -7 114 -16Q99 -25 84 -35Q70 -45 65 -50Q60 -53 58 -68Q55 -84 54 -100Q54 -116 55 -119Q58 -128 72 -150Q87 -173 110 -203Q132 -233 158 -264Q185 -295 211 -321Q187 -356 178 -390Q169 -424 178 -463Q188 -503 216 -553Q226 -569 242 -588Q259 -607 276 -624Q294 -642 307 -652Q320 -662 321 -660Q325 -653 329 -655Q333 -657 337 -657Q341 -659 354 -658Q368 -658 385 -656Q402 -654 415 -649Q451 -645 466 -641Q480 -637 492 -623Q507 -612 520 -596Q533 -580 542 -564Q550 -549 550 -540Q550 -527 530 -500Q509 -473 475 -443Q462 -427 448 -414Q435 -402 435 -402Q435 -398 430 -391Q425 -384 417 -381Q406 -371 386 -353Q366 -335 350 -320Q334 -305 333 -302Q332 -300 340 -287Q348 -273 361 -255Q374 -237 388 -220Q401 -202 412 -190Q423 -179 427 -179Q460 -211 496 -242Q531 -272 568 -306Q593 -332 606 -340Q619 -348 627 -344Q635 -341 642 -334Q655 -332 656 -316Q657 -301 653 -287Q649 -272 648 -271Q635 -254 613 -233Q591 -212 567 -190Q543 -169 521 -149Q499 -129 484 -114Q484 -114 496 -100Q509 -85 521 -74Q554 -40 572 -26Q590 -13 613 -5Q644 5 655 18Q666 32 667 54ZM186 -77Q216 -68 238 -70Q259 -73 284 -87Q309 -101 347 -127L366 -141L341 -170Q334 -178 325 -192Q316 -206 302 -223Q287 -237 282 -245Q278 -253 278 -253Q275 -253 264 -243Q254 -233 242 -220Q231 -206 225 -196Q202 -178 190 -160Q178 -143 163 -120Q156 -104 158 -97Q160 -90 168 -87Q176 -84 186 -77ZM280 -377Q291 -389 312 -404Q332 -420 355 -438Q378 -455 398 -474Q418 -492 429 -510Q440 -529 435 -546Q433 -550 424 -555Q415 -560 403 -564Q391 -568 379 -567Q359 -569 342 -553Q325 -537 302 -504Q277 -467 268 -436Q260 -406 280 -377Z"],"'":[117,"M198 -431Q182 -428 172 -430Q163 -433 156 -439Q153 -450 158 -462Q163 -473 168 -480Q180 -500 196 -528Q211 -555 216 -570Q218 -581 222 -598Q227 -616 227 -635Q227 -640 230 -651Q232 -662 237 -671Q242 -680 247 -677Q256 -673 270 -666Q284 -659 294 -650Q305 -641 303 -630Q301 -606 292 -578Q283 -550 277 -530Q271 -508 255 -484Q239 -461 222 -441Q223 -437 216 -436Q209 -435 198 -431Z"],"(":[330,"M284 138Q236 131 203 96Q170 60 156 17Q137 -25 138 -92Q139 -160 158 -230Q163 -249 167 -269Q171 -289 172 -296Q175 -306 185 -329Q195 -352 208 -382Q221 -411 234 -440Q246 -470 255 -493Q266 -518 288 -552Q309 -586 332 -620Q356 -654 376 -679Q395 -704 403 -710Q408 -715 417 -723Q426 -731 433 -732Q437 -743 449 -750Q461 -757 470 -757Q493 -769 519 -764Q545 -759 553 -729Q556 -715 554 -711Q551 -707 531 -698Q521 -694 506 -686Q491 -679 484 -671Q475 -660 464 -649Q453 -638 447 -634Q429 -627 429 -618Q429 -618 420 -601Q412 -584 393 -560Q381 -541 365 -513Q349 -485 340 -471Q331 -455 326 -444Q320 -434 310 -423Q310 -420 307 -409Q304 -398 295 -384Q289 -362 271 -325Q264 -309 254 -283Q245 -257 238 -233Q232 -209 232 -199Q230 -199 228 -194Q227 -188 224 -170Q222 -151 216 -110Q215 -65 218 -36Q222 -7 233 14Q244 34 262 54Q273 64 284 69Q295 74 310 75L344 96Q338 119 320 130Q301 140 284 138Z"],")":[330,"M72 135Q53 130 35 114Q17 97 16 82Q17 79 17 70Q17 61 21 54Q21 54 28 57Q34 60 50 56Q70 57 80 52Q90 47 105 30Q116 15 130 -2Q145 -18 150 -31Q166 -42 173 -52Q180 -61 186 -71Q186 -76 189 -90Q192 -103 204 -122Q215 -147 225 -164Q235 -182 235 -187Q235 -187 238 -194Q241 -201 240 -211Q246 -214 250 -224Q255 -235 254 -246Q254 -249 263 -270Q272 -290 273 -311Q284 -347 290 -376Q295 -404 298 -438Q301 -472 304 -525Q306 -570 307 -592Q308 -615 306 -627Q305 -639 297 -651Q287 -683 280 -683Q277 -683 275 -695Q273 -707 277 -721Q276 -725 292 -730Q307 -735 316 -734Q323 -734 332 -728Q340 -723 343 -719Q347 -723 356 -706Q364 -689 374 -660Q380 -646 383 -636Q386 -627 387 -616Q388 -604 387 -584Q386 -563 384 -527Q384 -492 380 -450Q375 -409 369 -370Q363 -330 356 -298Q349 -272 337 -236Q325 -199 310 -162Q296 -125 284 -96Q271 -67 263 -55Q265 -55 258 -43Q250 -31 238 -12Q225 6 212 26Q199 45 190 59Q175 80 152 99Q129 118 108 128Q86 139 72 135Z"],"*":[363,"M414 -392Q404 -385 390 -398Q376 -411 366 -429Q363 -436 358 -450Q354 -463 348 -479Q347 -492 346 -504Q346 -516 346 -516Q345 -517 321 -496Q297 -475 252 -430Q224 -404 215 -399Q206 -394 200 -395Q193 -396 187 -400Q181 -405 181 -406Q180 -409 180 -427Q180 -445 183 -452Q188 -458 203 -474Q219 -491 237 -510Q256 -529 270 -544Q285 -559 289 -562Q297 -570 297 -573Q297 -576 289 -583Q285 -588 282 -590Q280 -593 284 -593Q284 -593 284 -596Q283 -599 279 -600Q276 -605 274 -610Q273 -615 273 -617Q273 -622 269 -632Q265 -642 265 -642Q261 -645 262 -654Q264 -662 268 -671Q272 -680 274 -682Q274 -682 276 -682Q279 -681 283 -677Q287 -677 299 -663Q311 -649 318 -638Q326 -622 329 -622Q332 -622 339 -622Q339 -622 346 -636Q354 -649 356 -667Q370 -686 376 -696Q382 -706 387 -713Q389 -719 393 -724Q397 -729 397 -729Q397 -729 399 -734Q401 -739 405 -740Q412 -748 422 -753Q432 -758 434 -756Q438 -751 442 -748Q447 -744 449 -736L467 -721L454 -704Q432 -671 418 -644Q405 -616 407 -616Q407 -616 416 -620Q426 -624 436 -626Q447 -631 453 -633Q459 -635 461 -636Q471 -636 485 -645Q500 -650 509 -645Q517 -638 523 -622Q529 -606 529 -601Q528 -600 510 -588Q493 -575 467 -567Q442 -560 423 -553Q404 -546 402 -541Q390 -541 402 -524Q404 -518 404 -513Q404 -508 405 -497Q410 -478 412 -466Q415 -453 416 -453Q420 -453 420 -459Q420 -463 429 -463Q432 -463 438 -456Q443 -450 448 -443Q452 -436 450 -434Q450 -434 450 -431Q450 -428 450 -428Q454 -427 446 -418Q437 -409 427 -400Q417 -392 414 -392Z"],"+":[446,"M170 -172Q164 -172 155 -172Q146 -173 135 -177Q120 -177 112 -184Q103 -190 99 -197Q88 -212 100 -220Q113 -229 150 -233Q167 -237 200 -240Q234 -242 273 -244Q312 -245 347 -246Q382 -247 402 -247Q428 -247 448 -242Q469 -237 480 -226Q495 -211 487 -194Q479 -178 456 -182Q451 -182 437 -181Q423 -180 407 -179Q390 -178 378 -177Q372 -177 345 -176Q318 -175 282 -174Q247 -173 216 -172Q184 -172 170 -172ZM304 -16Q289 -5 280 -18Q272 -30 268 -67Q264 -84 262 -118Q259 -151 258 -190Q256 -229 255 -264Q254 -299 254 -319Q254 -345 259 -366Q264 -386 274 -397Q289 -412 306 -404Q323 -396 319 -373Q320 -368 320 -354Q321 -340 322 -324Q323 -307 324 -295Q324 -289 325 -262Q326 -235 327 -200Q328 -164 328 -132Q329 -101 329 -87Q329 -81 328 -72Q328 -63 324 -52Q324 -37 318 -28Q311 -20 304 -16Z"],",":[198,"M55 86Q44 86 36 81Q29 76 25 69Q25 62 29 57Q33 52 40 45Q51 35 61 20Q71 6 79 -9Q88 -24 93 -33Q97 -44 101 -59Q105 -74 109 -92Q109 -100 109 -106Q110 -113 114 -117Q122 -124 134 -130Q145 -135 156 -126Q168 -116 174 -78Q178 -56 174 -38Q170 -20 157 6Q155 13 143 29Q130 45 118 58Q105 72 102 72Q98 72 95 74Q92 77 87 81Q83 85 75 86Q67 86 55 86Z"],"-":[326,"M170 -172Q164 -172 155 -172Q146 -173 135 -177Q120 -177 112 -184Q103 -190 99 -197Q88 -212 100 -220Q113 -229 150 -233Q184 -241 217 -244Q250 -247 290 -247Q316 -247 332 -242Q349 -237 360 -226Q375 -211 367 -194Q359 -178 336 -182Q329 -181 306 -180Q284 -179 266 -177Q255 -176 227 -174Q199 -172 170 -172Z"],".":[198,"M162 -52Q141 -45 127 -46Q113 -46 96 -58Q76 -78 82 -98Q89 -119 118 -139Q138 -151 148 -152Q157 -152 176 -144Q210 -123 206 -97Q202 -72 162 -52Z"],"/":[330,"M79 115Q49 116 36 84Q22 53 50 -14Q56 -25 61 -36Q67 -47 68 -54Q71 -61 81 -82Q91 -102 106 -131Q121 -160 137 -191Q154 -222 169 -249Q183 -277 193 -295Q203 -313 205 -316Q210 -315 214 -322Q218 -328 219 -335Q221 -344 226 -353Q231 -362 236 -364Q237 -369 240 -375Q243 -381 244 -385Q245 -389 248 -392Q251 -396 251 -400Q259 -410 276 -437Q292 -464 313 -500Q334 -537 356 -577Q378 -616 397 -651Q416 -686 428 -710Q440 -733 440 -737Q442 -752 460 -749Q467 -754 476 -752Q476 -752 486 -742Q497 -731 504 -721Q512 -713 512 -704Q511 -695 508 -684Q506 -671 501 -661Q497 -651 484 -634Q472 -617 447 -581Q441 -572 428 -551Q416 -530 402 -507Q389 -484 380 -467Q371 -450 371 -448Q370 -444 364 -436Q359 -429 354 -417Q348 -410 339 -395Q329 -381 319 -365Q309 -350 301 -338Q294 -327 294 -325Q293 -322 291 -318Q290 -314 285 -311Q282 -312 280 -306Q278 -301 278 -301Q280 -293 254 -251Q244 -230 227 -196Q210 -162 190 -123Q171 -84 153 -47Q135 -10 123 18Q111 46 109 57Q105 80 96 96Q87 112 79 115Z"],"0":[450,"M293 -3Q286 -3 268 -8Q249 -13 230 -20Q210 -28 199 -37Q165 -66 150 -102Q135 -137 132 -174Q130 -211 135 -244Q146 -308 181 -372Q216 -435 265 -477Q291 -500 317 -516Q343 -532 373 -539Q384 -542 404 -542Q425 -543 432 -543Q452 -543 476 -534Q501 -526 519 -514Q537 -503 537 -493Q537 -486 536 -479Q535 -472 527 -476H517L527 -446Q531 -438 534 -424Q537 -411 537 -400Q537 -390 534 -370Q532 -351 527 -329Q523 -307 518 -288Q514 -269 510 -260Q507 -254 506 -248Q506 -243 506 -239Q502 -231 493 -211Q484 -191 480 -183Q476 -179 474 -176Q471 -173 475 -169Q475 -166 470 -156Q465 -145 459 -136Q454 -127 451 -127Q451 -127 448 -126Q446 -126 446 -123Q446 -119 432 -102Q419 -85 401 -67Q391 -57 369 -42Q347 -26 326 -14Q304 -3 293 -3ZM291 -99Q302 -99 312 -102Q322 -106 329 -113Q347 -125 364 -145Q380 -165 391 -191Q402 -206 408 -222Q415 -239 429 -279Q437 -290 440 -306Q443 -322 443 -333Q443 -344 444 -363Q444 -382 448 -395Q448 -421 447 -426Q446 -430 439 -438Q435 -441 428 -444Q422 -447 415 -447Q408 -447 396 -444Q385 -440 377 -435Q370 -431 362 -434Q353 -437 353 -442Q353 -456 340 -440Q326 -425 304 -398Q286 -380 274 -362Q261 -343 261 -339Q261 -335 258 -329Q255 -323 252 -315Q247 -308 240 -292Q233 -276 226 -260Q220 -245 218 -237Q218 -233 218 -216Q218 -198 218 -183Q218 -166 219 -158Q220 -150 222 -145Q225 -140 230 -130Q234 -123 242 -114Q251 -104 254 -100Q265 -90 268 -92Q272 -95 291 -99Z"],"1":[450,"M363 18Q360 20 348 19Q337 18 324 14Q312 9 305 3Q301 -1 297 -6Q293 -12 294 -26Q294 -40 300 -71Q304 -91 310 -113Q316 -135 321 -151Q326 -167 326 -167Q331 -169 340 -197Q350 -225 362 -265Q366 -279 376 -312Q386 -345 396 -376Q405 -405 413 -421Q421 -437 421 -437Q421 -437 409 -430Q397 -423 378 -411Q359 -399 338 -383Q321 -373 300 -356Q278 -338 260 -327Q233 -306 224 -300Q214 -294 205 -299Q192 -310 180 -332Q169 -353 175 -363Q177 -364 188 -372Q200 -380 215 -391Q230 -402 242 -411Q255 -420 260 -423Q263 -423 271 -430Q279 -437 288 -443Q293 -449 323 -470Q353 -491 388 -517Q425 -540 454 -554Q483 -568 487 -567Q490 -567 502 -560Q513 -553 524 -544Q535 -535 536 -529Q542 -522 530 -497Q526 -488 517 -464Q508 -441 498 -410Q487 -380 478 -350Q468 -321 462 -300Q454 -269 448 -252Q441 -235 436 -220Q430 -204 423 -177Q416 -161 408 -136Q401 -112 395 -88Q389 -65 386 -50Q378 -28 373 -7Q368 14 363 18Z"],"2":[450,"M162 -8Q158 -10 148 -19Q139 -28 130 -40Q121 -51 118 -57Q115 -62 118 -75Q122 -88 126 -88Q129 -86 134 -95Q139 -104 144 -114Q149 -125 149 -127Q150 -131 154 -134Q159 -136 163 -139Q168 -147 176 -156Q185 -164 190 -170Q198 -180 219 -200Q240 -220 260 -241Q281 -264 297 -282Q313 -299 314 -306Q314 -306 318 -310Q321 -313 326 -316Q331 -319 340 -326Q348 -333 354 -339Q356 -347 364 -358Q371 -368 381 -378Q389 -390 396 -404Q403 -419 405 -426Q408 -437 403 -440Q398 -442 376 -449Q352 -457 331 -452Q310 -447 275 -422Q261 -419 250 -414Q238 -409 230 -410Q226 -412 221 -419Q216 -426 210 -432L200 -475L231 -492Q272 -518 310 -532Q347 -545 375 -536Q386 -536 395 -534Q404 -531 404 -531Q412 -532 428 -523Q443 -514 458 -500Q474 -486 480 -472Q496 -448 492 -414Q488 -380 463 -343Q458 -337 441 -318Q424 -299 402 -276Q381 -252 364 -234Q346 -216 341 -211Q334 -208 318 -192Q301 -176 282 -156Q264 -137 252 -122Q239 -108 241 -108Q240 -104 252 -108Q263 -113 272 -116Q287 -121 308 -126Q328 -130 349 -133Q370 -136 385 -137Q401 -138 404 -135Q406 -130 408 -132Q409 -133 409 -133Q411 -140 434 -137Q458 -134 477 -128Q488 -125 494 -120Q501 -115 501 -111Q501 -111 504 -106Q506 -102 512 -95Q528 -82 512 -67Q497 -52 457 -59Q431 -59 414 -56Q410 -54 397 -54Q384 -54 372 -53Q354 -55 336 -52Q318 -48 293 -40Q284 -37 265 -31Q246 -25 224 -19Q202 -13 184 -10Q167 -7 162 -8Z"],"3":[450,"M244 -1Q219 -1 196 -10Q172 -20 158 -33Q144 -46 145 -58Q146 -74 156 -83Q166 -92 188 -89Q222 -82 257 -84Q292 -87 322 -98Q353 -109 372 -128Q399 -154 400 -172Q401 -191 372 -210Q359 -219 340 -227Q321 -235 303 -240Q284 -244 270 -243Q261 -242 248 -246Q235 -251 222 -258Q216 -265 211 -281Q206 -297 204 -301Q203 -306 211 -313Q219 -320 243 -334Q267 -349 313 -374Q355 -397 378 -410Q400 -422 412 -430Q425 -437 434 -445Q446 -459 445 -466Q444 -473 418 -478Q393 -480 378 -478Q363 -477 363 -473Q363 -473 362 -473Q362 -473 359 -473Q354 -475 337 -472Q320 -469 304 -465Q289 -461 288 -458Q287 -456 274 -452Q262 -447 250 -444Q237 -441 234 -441Q229 -443 222 -455Q216 -467 212 -481Q208 -494 210 -499Q212 -503 224 -512Q237 -520 253 -530Q269 -539 280 -544Q294 -548 322 -552Q349 -555 376 -558Q404 -560 416 -559Q462 -554 490 -536Q518 -517 526 -477Q529 -463 526 -448Q523 -433 513 -418Q503 -403 483 -385Q458 -369 444 -358Q431 -348 408 -337Q401 -332 386 -326Q371 -320 358 -315Q345 -310 345 -308Q345 -308 354 -306Q364 -305 376 -302Q387 -300 392 -295Q421 -285 446 -260Q470 -236 480 -222Q494 -191 484 -154Q473 -118 446 -86Q420 -53 385 -32Q357 -16 316 -10Q276 -3 244 -1Z"],"4":[450,"M331 12Q327 12 312 -2Q296 -16 296 -44Q297 -75 306 -110Q316 -144 325 -171Q331 -189 336 -201Q340 -213 340 -216Q339 -216 330 -214Q320 -212 306 -209Q257 -199 232 -199Q206 -199 188 -229Q182 -235 172 -251Q162 -267 158 -286Q155 -305 168 -318Q178 -343 184 -354Q190 -365 192 -370Q195 -375 195 -380Q196 -382 198 -386Q200 -390 203 -394Q212 -409 228 -433Q245 -457 264 -482Q282 -506 297 -526Q312 -545 319 -551Q325 -554 340 -560Q356 -566 363 -566Q371 -566 378 -556Q386 -545 391 -534Q396 -523 396 -519Q396 -519 395 -517Q394 -515 391 -510Q387 -504 380 -494Q372 -484 358 -468Q346 -454 328 -428Q310 -401 292 -372Q275 -342 263 -319Q251 -296 251 -288Q251 -283 254 -280Q258 -278 268 -278Q281 -280 292 -282Q302 -284 311 -286Q322 -288 330 -290Q338 -293 345 -295Q353 -298 360 -300Q366 -303 371 -307Q383 -317 389 -334Q395 -351 408 -380Q416 -400 424 -416Q433 -433 440 -447Q465 -493 482 -514Q499 -536 501 -536Q504 -536 515 -528Q526 -520 536 -511Q544 -504 549 -498Q554 -493 554 -491Q554 -479 548 -466Q543 -454 533 -438Q523 -422 510 -397Q495 -368 482 -340Q469 -311 457 -284Q445 -256 435 -230Q425 -204 416 -181Q394 -122 386 -94Q378 -66 378 -56Q379 -45 382 -38Q382 -25 374 -14Q366 -2 354 5Q342 12 331 12Z"],"5":[434,"M171 -16Q153 -29 153 -38Q149 -44 144 -44Q141 -43 138 -54Q136 -65 134 -78Q133 -91 134 -95Q138 -103 150 -107Q161 -111 172 -110Q184 -110 185 -102Q187 -94 200 -89Q214 -84 236 -85Q264 -86 288 -94Q311 -102 330 -117Q350 -132 366 -153Q373 -167 379 -190Q385 -213 387 -231Q389 -249 384 -249Q384 -249 382 -256Q381 -263 378 -271Q373 -286 355 -302Q337 -317 320 -324Q313 -326 291 -324Q269 -322 254 -320Q238 -319 236 -320Q233 -322 233 -322Q228 -323 217 -332Q205 -341 196 -351Q186 -361 186 -366Q188 -373 197 -390Q206 -407 220 -427Q233 -447 247 -466Q261 -485 273 -497Q303 -530 345 -546Q387 -563 428 -561Q457 -560 472 -554Q486 -547 498 -531Q506 -517 504 -502Q502 -487 494 -479Q486 -471 474 -477Q460 -486 436 -484Q412 -482 385 -474Q364 -466 351 -460Q338 -455 333 -444Q329 -441 328 -438Q326 -435 322 -436Q322 -436 319 -432Q316 -429 316 -425Q311 -419 310 -416Q308 -414 304 -418Q304 -418 304 -415Q304 -412 303 -408Q302 -401 308 -398Q313 -396 332 -394Q357 -390 370 -386Q382 -383 407 -368Q435 -352 448 -320Q462 -289 464 -252Q467 -214 462 -180Q459 -158 456 -146Q453 -134 439 -113Q416 -81 380 -56Q344 -32 304 -18Q264 -4 228 -2Q193 -1 171 -16Z"],"6":[471,"M297 -16Q264 -7 234 -10Q205 -12 184 -32Q170 -43 156 -62Q141 -81 138 -101Q133 -116 132 -125Q131 -134 134 -147Q136 -160 141 -187Q149 -223 155 -244Q161 -264 179 -289Q187 -310 198 -332Q208 -353 213 -359Q218 -366 228 -380Q238 -394 249 -406Q259 -419 268 -430Q276 -442 276 -442Q281 -445 286 -448Q290 -451 295 -458Q303 -467 321 -480Q339 -494 362 -508Q385 -522 407 -532Q429 -541 445 -543Q477 -554 475 -542Q475 -542 486 -532Q496 -521 504 -519Q508 -518 510 -512Q513 -507 516 -502Q518 -494 508 -480Q498 -467 484 -454Q470 -444 464 -443Q459 -442 455 -446Q456 -450 451 -452Q446 -453 446 -453Q440 -455 424 -450Q407 -444 388 -432Q370 -421 355 -405Q346 -397 339 -389Q332 -381 330 -377Q317 -364 307 -352Q297 -339 297 -339Q300 -333 312 -336Q323 -339 324 -343Q324 -347 346 -354Q369 -360 392 -362Q401 -366 416 -363Q432 -360 442 -358Q464 -354 472 -350Q480 -346 492 -331Q512 -312 520 -290Q527 -268 526 -242Q526 -226 523 -214Q520 -202 509 -189Q501 -176 488 -156Q475 -137 462 -121Q450 -105 441 -99Q437 -97 434 -94Q430 -92 430 -92Q429 -86 414 -75Q400 -65 379 -52Q357 -40 335 -30Q313 -20 297 -16ZM237 -93Q253 -91 261 -90Q269 -90 291 -99Q299 -101 305 -103Q311 -105 314 -104Q314 -104 327 -113Q339 -121 355 -131Q402 -160 425 -194Q448 -229 443 -253Q444 -259 441 -266Q438 -274 438 -276Q436 -276 430 -278Q423 -280 414 -281Q404 -284 395 -284Q386 -284 368 -280Q349 -277 309 -267Q302 -266 294 -262Q287 -259 279 -257Q277 -254 269 -250Q261 -246 256 -244Q246 -243 239 -228Q232 -213 222 -169Q217 -138 216 -128Q214 -118 218 -111Q220 -101 225 -98Q230 -95 237 -93Z"],"7":[446,"M237 26Q225 24 209 9Q193 -6 187 -20Q183 -39 203 -86Q223 -134 257 -198Q279 -234 279 -240Q279 -246 259 -246Q250 -248 234 -252Q219 -255 216 -259Q200 -267 198 -276Q195 -286 204 -287Q214 -292 210 -300Q207 -309 209 -314Q214 -314 217 -314Q220 -313 228 -311Q242 -311 254 -310Q267 -309 278 -309Q283 -309 290 -309Q298 -309 304 -308Q318 -306 323 -310Q328 -315 342 -333Q350 -347 363 -364Q376 -380 389 -405Q424 -455 428 -472Q432 -489 412 -487Q396 -485 376 -480Q357 -474 319 -460Q291 -449 276 -446Q260 -444 249 -450Q243 -451 240 -462Q236 -473 236 -486Q235 -500 236 -507Q238 -518 277 -531Q316 -544 367 -557Q390 -561 419 -562Q448 -563 472 -560Q495 -557 499 -549Q499 -549 502 -546Q504 -544 505 -548Q509 -547 511 -540Q513 -534 519 -524Q529 -507 532 -499Q534 -491 531 -476Q528 -465 521 -454Q514 -443 510 -440Q505 -436 502 -431Q500 -426 500 -426Q499 -422 494 -418Q489 -415 484 -409Q483 -405 480 -400Q476 -395 475 -392Q474 -391 467 -380Q460 -370 451 -356Q442 -342 434 -330Q426 -318 423 -313Q409 -300 409 -294Q409 -288 422 -282Q439 -275 450 -266Q461 -256 465 -242Q466 -219 457 -215Q452 -208 440 -205Q429 -202 426 -206Q423 -212 412 -218Q402 -223 392 -226Q382 -229 379 -229Q375 -227 371 -222Q367 -216 362 -210Q355 -200 344 -180Q333 -159 322 -140Q311 -120 305 -110Q304 -105 300 -100Q295 -95 293 -88Q289 -81 286 -68Q283 -54 283 -44Q283 -33 286 -32Q294 -34 298 -30Q301 -27 303 -19Q308 -12 296 0Q283 11 266 20Q248 28 237 26Z"],"8":[450,"M182 47Q175 46 163 38Q151 30 139 20Q127 11 121 6Q114 -11 111 -20Q108 -29 111 -50Q111 -62 114 -78Q116 -94 123 -104Q130 -124 146 -151Q161 -178 180 -205Q198 -232 214 -254Q231 -277 239 -287Q250 -301 250 -310Q249 -320 229 -347Q225 -358 220 -364Q215 -369 219 -369Q219 -369 216 -372Q214 -376 211 -383Q196 -397 196 -426Q197 -455 211 -483Q227 -519 254 -545Q281 -571 311 -575Q322 -574 349 -569Q377 -564 406 -558Q436 -552 453 -544Q465 -539 484 -526Q504 -513 520 -500Q536 -487 537 -481Q537 -478 540 -474Q544 -471 545 -466Q551 -455 552 -436Q552 -417 549 -399Q546 -381 540 -372Q515 -344 505 -340Q500 -336 494 -330Q487 -324 479 -322Q474 -315 470 -310Q465 -305 461 -305Q457 -308 453 -308Q449 -309 449 -305Q449 -303 436 -296Q422 -289 408 -284Q394 -279 390 -281Q390 -281 387 -281Q384 -281 378 -277Q365 -279 393 -245Q416 -202 428 -162Q439 -123 424 -102Q405 -59 383 -32Q361 -4 348 -5Q348 -5 344 -2Q339 1 334 4Q332 11 326 14Q319 16 314 15Q305 11 283 25Q270 34 249 40Q228 46 208 48Q189 50 182 47ZM205 -29Q215 -28 231 -34Q248 -40 266 -50Q285 -60 300 -70Q332 -95 344 -120Q355 -145 345 -170Q339 -182 332 -196Q325 -210 320 -218Q314 -227 310 -231Q305 -235 300 -238Q300 -238 296 -232Q291 -225 286 -214Q275 -200 273 -197Q271 -194 267 -187Q260 -180 254 -174Q248 -168 245 -165Q245 -162 239 -148Q233 -133 225 -119Q203 -81 198 -56Q192 -31 205 -29ZM360 -355Q381 -374 393 -377Q405 -380 411 -369Q413 -365 430 -374Q448 -384 464 -401Q470 -412 468 -412Q465 -412 463 -428Q464 -438 463 -444Q462 -450 454 -456Q446 -462 425 -470Q363 -492 330 -484Q297 -477 284 -442Q278 -423 278 -411Q278 -399 286 -382Q295 -378 298 -372Q301 -365 301 -365Q301 -356 309 -356Q311 -351 323 -345Q335 -339 360 -355Z"],"9":[438,"M312 42Q307 41 298 36Q288 30 280 23Q272 16 272 14Q273 9 268 9Q268 9 266 2Q264 -4 265 -11Q265 -14 266 -26Q267 -38 267 -45Q269 -65 277 -98Q285 -131 296 -168Q307 -204 317 -233Q331 -269 330 -277Q328 -285 304 -283Q273 -278 247 -293Q221 -308 206 -336Q191 -363 193 -392Q194 -407 200 -420Q205 -432 218 -454Q239 -485 268 -513Q298 -541 330 -561Q362 -581 388 -586Q404 -589 426 -588Q448 -587 460 -582Q475 -576 493 -556Q511 -536 524 -514Q536 -492 533 -480Q526 -447 517 -430Q508 -413 495 -399Q479 -385 458 -348Q436 -311 414 -264Q393 -216 377 -170Q363 -128 360 -94Q356 -60 363 -59Q367 -59 377 -56Q387 -53 391 -53Q394 -49 394 -44Q394 -39 389 -28Q386 -21 376 -9Q365 3 352 14Q338 26 327 34Q316 42 312 42ZM283 -369Q298 -353 319 -356Q340 -358 363 -377Q386 -396 407 -429Q419 -443 422 -452Q426 -460 430 -463Q443 -477 448 -485Q453 -493 446 -500Q439 -511 431 -512Q423 -513 399 -504Q383 -501 374 -494Q366 -487 345 -473Q341 -469 337 -468Q333 -468 329 -469Q329 -469 327 -468Q325 -468 325 -464Q330 -455 313 -441Q287 -413 280 -396Q273 -380 283 -369Z"],":":[198,"M233 -262Q212 -255 198 -256Q184 -256 167 -268Q147 -288 154 -308Q161 -329 190 -349Q210 -361 220 -362Q229 -362 248 -354Q281 -333 278 -307Q274 -282 233 -262ZM163 -52Q142 -45 128 -46Q114 -46 97 -58Q77 -78 84 -98Q91 -119 120 -139Q140 -151 150 -152Q159 -152 178 -144Q211 -123 208 -97Q204 -72 163 -52Z"],";":[198,"M57 86Q46 86 38 81Q31 76 27 69Q27 62 31 57Q35 52 42 45Q53 35 63 20Q73 6 81 -9Q90 -24 95 -33Q99 -44 103 -59Q107 -74 111 -92Q111 -100 111 -106Q112 -113 116 -117Q124 -124 136 -130Q147 -135 158 -126Q170 -116 176 -78Q180 -56 176 -38Q172 -20 159 6Q157 13 144 29Q131 45 119 58Q106 72 103 72Q99 72 96 74Q93 77 89 81Q85 85 77 86Q69 86 57 86ZM233 -262Q212 -255 198 -256Q184 -256 167 -268Q147 -288 154 -308Q161 -329 190 -349Q210 -361 220 -362Q229 -362 248 -354Q281 -333 278 -307Q274 -282 233 -262Z"],"<":[446,"M348 -43Q317 -51 294 -58Q271 -64 243 -86Q209 -106 188 -118Q168 -131 149 -158L116 -198L105 -251Q113 -253 120 -256Q128 -260 129 -261Q141 -267 154 -276Q166 -284 187 -298Q208 -312 246 -333Q293 -357 326 -377Q360 -397 370 -407Q376 -414 384 -416Q392 -419 396 -419Q402 -421 415 -410Q428 -400 432 -397Q443 -390 448 -387Q453 -384 454 -376Q454 -376 452 -367Q449 -358 442 -352Q429 -341 406 -329Q384 -317 352 -300Q319 -284 275 -257Q248 -241 234 -234Q220 -228 216 -223Q212 -218 214 -205Q231 -185 270 -164Q308 -144 383 -121Q420 -110 438 -99Q457 -88 462 -77Q467 -66 465 -53Q460 -44 440 -38Q420 -33 394 -34Q369 -34 348 -43Z"],"=":[446,"M241 -267Q235 -267 226 -268Q216 -268 199 -272Q184 -272 175 -276Q166 -279 162 -286Q148 -301 159 -316Q170 -332 221 -331Q260 -339 304 -342Q348 -345 394 -345Q425 -345 438 -340Q452 -334 463 -323Q481 -308 476 -290Q471 -273 447 -277Q437 -276 412 -275Q386 -274 363 -272Q356 -272 336 -270Q315 -269 290 -268Q264 -267 241 -267ZM186 -124Q180 -124 170 -124Q161 -125 145 -129Q129 -129 120 -132Q112 -136 108 -143Q94 -158 105 -174Q116 -189 166 -188Q205 -196 249 -199Q293 -202 339 -202Q370 -202 384 -196Q398 -190 409 -179Q427 -164 422 -147Q416 -130 393 -134Q383 -133 356 -132Q329 -131 306 -129Q299 -129 279 -128Q259 -126 234 -125Q209 -124 186 -124Z"],">":[446,"M198 -20Q192 -18 180 -28Q167 -39 162 -42Q152 -50 147 -52Q142 -55 140 -63Q140 -63 142 -72Q145 -81 152 -87Q166 -99 188 -110Q211 -122 244 -139Q276 -156 319 -182Q346 -199 360 -205Q374 -211 378 -216Q382 -221 380 -234Q363 -254 324 -274Q286 -295 211 -318Q174 -330 156 -340Q138 -351 132 -362Q127 -373 129 -386Q134 -395 154 -400Q174 -406 200 -406Q225 -406 246 -396Q277 -388 300 -382Q323 -375 351 -353Q385 -334 406 -321Q426 -308 445 -281L478 -241L489 -188Q481 -187 474 -183Q467 -179 465 -178Q453 -172 440 -164Q428 -155 407 -142Q386 -128 348 -106Q302 -82 268 -62Q234 -42 224 -32Q218 -25 210 -22Q203 -20 198 -20Z"],"?":[374,"M247 -183Q231 -185 224 -196Q217 -208 217 -220Q217 -222 215 -232Q213 -242 215 -250Q215 -256 221 -269Q227 -282 234 -300Q245 -320 268 -345Q291 -370 307 -382Q316 -389 320 -392Q324 -394 324 -394Q324 -398 338 -410Q352 -421 362 -425Q362 -425 375 -434Q388 -443 395 -450Q418 -473 429 -492Q440 -512 446 -537Q452 -562 459 -599Q460 -634 456 -642Q452 -651 440 -660Q415 -665 392 -658Q368 -652 348 -634Q329 -615 314 -581Q308 -564 308 -558Q307 -552 310 -542Q310 -534 312 -523Q315 -512 315 -507Q311 -506 299 -502Q287 -499 274 -500Q260 -500 248 -511Q248 -511 240 -521Q232 -531 230 -535Q224 -543 224 -550Q225 -558 225 -573Q232 -593 244 -618Q256 -643 275 -666Q294 -689 319 -702Q340 -711 358 -722Q377 -732 377 -732Q377 -732 384 -732Q392 -733 410 -735Q416 -734 424 -735Q431 -736 431 -731Q434 -731 443 -731Q452 -731 460 -731Q472 -728 489 -718Q506 -709 521 -698Q536 -687 543 -679Q550 -657 549 -624Q548 -592 539 -556Q530 -520 516 -488Q501 -455 481 -433Q475 -427 459 -413Q443 -399 426 -382Q408 -366 397 -354Q363 -335 337 -297Q311 -259 298 -223Q287 -199 274 -191Q261 -183 247 -183ZM224 -6Q203 2 189 1Q175 1 158 -12Q138 -32 145 -52Q152 -73 180 -92Q200 -105 210 -106Q219 -106 239 -98Q272 -77 268 -51Q264 -26 224 -6Z"],"@":[643,"M307 140Q273 140 234 124Q194 108 162 83Q145 67 126 44Q107 21 95 0Q87 -11 82 -30Q76 -48 75 -67Q74 -84 77 -109Q80 -134 86 -158Q92 -182 99 -196Q99 -199 100 -202Q102 -206 103 -212Q103 -218 110 -232Q118 -247 126 -259Q160 -304 185 -337Q211 -370 238 -397Q266 -424 305 -452Q324 -467 353 -481Q381 -495 411 -505Q441 -516 464 -519Q468 -520 476 -520Q485 -520 507 -518Q538 -515 570 -503Q602 -491 623 -471Q663 -440 684 -402Q705 -363 711 -337Q715 -323 715 -297Q715 -271 712 -246Q709 -220 703 -207Q692 -183 672 -156Q653 -128 632 -102Q610 -77 591 -60Q572 -42 561 -39Q546 -39 522 -46Q497 -53 485 -63Q487 -63 466 -75Q466 -75 459 -68Q452 -60 441 -51Q427 -38 406 -28Q386 -17 368 -12Q350 -7 342 -9Q323 -14 312 -18Q301 -22 292 -30Q282 -39 268 -58Q264 -68 258 -86Q251 -105 251 -112Q251 -122 254 -134Q257 -146 261 -161Q267 -188 278 -208Q288 -228 305 -252Q321 -275 350 -300Q378 -324 407 -336Q419 -342 443 -342Q452 -342 461 -340Q470 -338 479 -332Q486 -331 498 -320Q510 -310 521 -296Q532 -283 536 -273Q539 -258 539 -251Q539 -244 536 -227Q535 -223 534 -217Q533 -211 531 -205Q530 -197 527 -184Q524 -170 522 -165Q519 -156 517 -153Q515 -150 518 -142Q517 -138 522 -134Q527 -131 534 -129Q541 -127 545 -127Q550 -127 558 -135Q567 -143 577 -155Q593 -172 602 -182Q611 -192 617 -202Q623 -212 629 -229Q630 -235 630 -244Q631 -253 631 -263Q631 -313 610 -354Q590 -396 537 -418Q526 -423 512 -424Q497 -426 482 -426Q460 -426 438 -422Q416 -419 395 -410Q382 -406 364 -394Q347 -382 328 -366Q310 -350 294 -333Q277 -316 265 -302Q222 -251 198 -198Q174 -146 167 -96Q163 -66 168 -51Q172 -36 175 -30Q186 -8 202 6Q218 19 240 33Q263 42 294 45Q326 48 364 46Q372 48 374 50Q377 53 376 62Q376 63 378 74Q379 85 384 96Q384 105 385 114Q386 123 378 127Q372 129 358 132Q345 136 330 138Q316 140 307 140ZM376 -99Q384 -104 395 -113Q405 -122 414 -131Q423 -141 425 -147Q425 -147 432 -160Q438 -171 444 -185Q450 -199 453 -213Q455 -215 456 -219Q457 -222 460 -231Q460 -236 459 -239Q458 -243 451 -247H452Q442 -249 428 -250Q414 -252 404 -247Q392 -242 379 -227Q366 -211 356 -190Q345 -169 339 -149Q333 -129 334 -115Q340 -103 351 -98Q363 -93 376 -99Z"],"A":[511,"M61 33Q43 23 42 11Q40 -1 55 -31Q70 -61 102 -124Q126 -169 134 -194Q143 -220 144 -231Q145 -242 145 -245Q143 -254 147 -260Q151 -265 160 -269Q165 -274 183 -287Q201 -300 211 -318Q220 -339 231 -361Q243 -383 262 -416Q281 -450 313 -504Q333 -539 360 -583Q388 -627 415 -663Q426 -677 438 -685Q450 -693 459 -693Q481 -693 503 -682Q525 -670 542 -653Q559 -636 565 -621Q570 -613 569 -587Q568 -561 565 -524Q562 -487 558 -445Q555 -404 549 -348Q543 -292 538 -231Q532 -170 529 -114Q526 -57 529 -15Q530 -6 529 2Q528 10 528 15Q522 21 502 20Q482 20 463 14Q444 8 442 -1Q439 -4 438 -6Q437 -8 438 -26Q439 -43 441 -90L446 -243L433 -242Q424 -242 400 -240Q377 -238 349 -234Q322 -231 299 -228Q276 -224 267 -221Q258 -221 246 -209Q233 -197 222 -178Q218 -164 208 -148Q197 -133 197 -128Q190 -123 186 -116Q181 -109 181 -109Q181 -103 172 -80Q164 -56 150 -28Q137 1 123 22L96 60ZM300 -311Q300 -311 311 -313Q322 -315 338 -318Q353 -320 365 -320Q388 -326 404 -329Q419 -332 429 -332Q439 -333 445 -330Q449 -325 452 -324Q456 -323 456 -323Q457 -325 460 -344Q463 -363 467 -391Q471 -419 475 -450Q479 -480 482 -506Q485 -533 486 -548Q487 -567 485 -582Q483 -598 483 -598Q477 -598 460 -576Q444 -555 422 -520Q401 -484 380 -443Q370 -424 361 -413Q353 -402 348 -402Q346 -400 338 -387Q329 -373 320 -356Q310 -340 304 -326Q297 -313 300 -311Z"],"B":[523,"M203 72Q160 44 152 16Q145 -12 172 -29Q178 -33 196 -30Q213 -27 222 -18Q242 0 268 4Q293 9 330 -1Q372 -14 394 -34Q417 -53 445 -87Q466 -114 474 -140Q483 -166 482 -188Q482 -209 472 -220Q447 -255 410 -268Q373 -282 313 -266Q306 -265 292 -262Q278 -259 267 -256Q256 -254 255 -254Q248 -252 244 -252Q240 -252 234 -242Q229 -233 218 -204Q207 -174 185 -113Q164 -52 150 -26Q135 -1 124 -4Q113 -6 99 -25Q91 -39 82 -56Q72 -73 82 -91Q87 -100 90 -108Q93 -115 98 -134Q103 -149 118 -186Q132 -224 152 -274Q172 -325 194 -379Q216 -433 236 -481Q257 -529 271 -562Q285 -593 288 -607Q291 -621 286 -622Q286 -627 283 -632Q280 -636 281 -640Q281 -644 298 -651Q316 -658 336 -664Q356 -670 365 -668Q370 -668 377 -668Q384 -669 384 -673Q387 -673 403 -675Q419 -677 438 -675Q505 -669 548 -636Q591 -604 590 -533Q589 -516 576 -489Q563 -462 544 -435Q524 -408 502 -388Q489 -377 474 -366Q460 -354 450 -346Q439 -339 439 -339Q439 -339 447 -336Q455 -333 464 -330Q510 -313 536 -287Q563 -261 574 -215Q578 -200 574 -178Q571 -156 565 -134Q559 -113 552 -98Q545 -91 541 -84Q537 -76 537 -76Q537 -74 529 -60Q521 -47 510 -31Q499 -15 489 -3Q479 5 460 20Q442 34 420 48Q399 62 380 69Q352 81 317 86Q283 90 252 86Q221 83 203 72ZM275 -343Q275 -343 292 -346Q308 -350 328 -354Q348 -359 358 -363Q363 -366 372 -371Q382 -376 392 -386Q406 -399 422 -416Q438 -432 453 -451Q469 -470 480 -492Q503 -528 505 -544Q507 -560 494 -573Q485 -584 469 -590Q453 -595 434 -596Q416 -596 399 -591Q386 -587 379 -582Q372 -576 372 -565Q372 -556 366 -547Q361 -537 356 -532Q355 -525 350 -518Q344 -512 344 -512Q344 -508 332 -488Q319 -467 305 -429Q287 -386 281 -367Q275 -348 275 -343Z"],"C":[477,"M221 66Q206 60 186 50Q166 39 148 22Q130 5 120 -19Q110 -48 106 -76Q103 -104 104 -141Q104 -193 112 -232Q119 -270 135 -310Q137 -313 142 -328Q148 -342 156 -359Q163 -376 167 -385Q175 -402 192 -430Q208 -459 227 -486Q256 -529 276 -556Q296 -584 314 -603Q333 -622 356 -640Q378 -658 412 -681Q434 -697 468 -701Q503 -705 536 -690Q569 -676 585 -636Q596 -615 595 -584Q594 -552 583 -516Q572 -481 555 -450Q538 -419 517 -400Q504 -388 482 -396Q461 -404 447 -417Q438 -434 438 -437Q437 -440 441 -441Q447 -448 457 -465Q467 -482 477 -502Q487 -521 491 -533Q499 -575 502 -588Q505 -602 496 -611Q492 -615 484 -614Q477 -613 460 -604Q437 -594 406 -564Q374 -533 343 -491Q303 -438 276 -397Q249 -356 235 -313Q233 -309 228 -298Q224 -287 224 -287Q225 -283 221 -268Q217 -252 212 -241Q201 -195 199 -152Q197 -110 204 -78Q212 -47 227 -32Q240 -23 260 -26Q280 -29 306 -40Q332 -51 362 -64Q386 -74 406 -86Q426 -98 436 -107Q444 -113 456 -120Q469 -126 478 -126Q492 -131 499 -118Q506 -105 506 -85Q506 -71 486 -51Q466 -31 442 -17Q434 -9 420 -2Q407 4 393 9Q372 25 341 40Q310 55 278 63Q247 71 221 66Z"],"D":[587,"M212 106Q193 109 166 106Q139 102 108 94Q92 89 86 82Q79 75 64 56Q54 41 52 22Q49 3 56 -12Q64 -27 82 -30Q90 -32 102 -26Q113 -21 126 -13Q147 -1 171 12Q195 24 215 21Q229 18 248 18Q268 17 286 14Q305 11 316 3Q369 -33 395 -54Q421 -76 421 -76Q423 -80 428 -83Q434 -85 442 -88Q448 -94 461 -107Q474 -121 487 -134Q499 -147 502 -149Q504 -158 506 -164Q508 -169 508 -175Q516 -183 530 -208Q543 -234 557 -266Q571 -297 577 -323Q590 -378 586 -423Q582 -468 563 -504Q544 -540 512 -567Q501 -576 482 -586Q463 -597 443 -606Q423 -616 408 -621Q392 -626 389 -625Q385 -624 374 -594Q362 -565 346 -519Q329 -473 310 -420Q292 -368 275 -321Q270 -302 263 -281Q255 -260 250 -244Q245 -229 245 -224Q234 -207 222 -172Q210 -137 202 -72Q193 -38 189 -16Q185 7 181 6Q181 6 180 16Q179 25 176 28Q176 34 164 36Q152 38 136 31Q120 24 106 4Q103 -7 102 -28Q100 -50 108 -79Q113 -98 122 -128Q131 -158 142 -190Q153 -222 162 -249Q172 -276 176 -289Q183 -306 196 -353Q204 -379 212 -405Q221 -431 229 -452Q237 -472 240 -478Q245 -491 252 -520Q260 -550 276 -588L283 -621L272 -626Q260 -622 254 -624Q247 -625 245 -626Q239 -624 229 -630Q220 -635 212 -644Q205 -653 203 -659Q201 -663 200 -670Q200 -676 200 -676Q201 -682 217 -688Q233 -695 258 -701Q284 -707 313 -710Q342 -713 367 -711Q393 -709 431 -699Q469 -689 496 -679Q528 -667 565 -638Q602 -609 632 -569Q663 -529 673 -485Q676 -473 679 -451Q682 -429 682 -408Q683 -388 678 -382Q676 -378 676 -372Q675 -367 679 -365Q678 -362 672 -342Q666 -323 661 -309Q659 -283 648 -249Q636 -215 622 -184Q609 -154 599 -137Q595 -137 592 -136Q588 -134 592 -133Q592 -128 581 -114Q577 -111 568 -100Q560 -88 555 -84Q554 -77 549 -72Q544 -68 540 -68Q540 -68 538 -68Q537 -68 537 -64Q529 -52 510 -33Q491 -14 467 6Q443 26 419 43Q395 60 375 68Q365 75 354 80Q343 84 333 89Q328 93 304 96Q280 99 254 101Q227 103 212 106Z"],"E":[534,"M239 39Q208 37 177 16Q146 -4 120 -22Q103 -39 94 -58Q85 -78 79 -110Q75 -129 79 -160Q83 -191 92 -222Q101 -254 109 -272Q121 -300 140 -332Q158 -365 176 -394Q195 -424 206 -442Q213 -449 212 -450Q212 -450 212 -450Q212 -455 222 -476Q233 -496 241 -512Q256 -528 258 -538Q260 -548 255 -554Q253 -558 264 -571Q274 -584 293 -600Q312 -617 335 -630Q359 -649 382 -650Q404 -652 408 -641Q408 -638 420 -640Q431 -641 446 -644Q462 -648 474 -650Q479 -656 498 -660Q516 -663 541 -666Q554 -665 570 -666Q586 -666 598 -667Q611 -668 611 -668Q618 -670 632 -660Q645 -649 653 -631Q660 -613 641 -600Q622 -587 581 -582Q551 -578 534 -576Q518 -573 499 -570Q481 -566 446 -558Q421 -553 404 -550Q387 -547 374 -538Q362 -529 347 -506Q340 -501 329 -480Q318 -459 307 -438Q279 -399 266 -380Q252 -362 256 -357Q256 -357 270 -354Q284 -351 288 -351Q298 -356 312 -358Q327 -360 336 -362Q398 -378 428 -386Q457 -393 470 -396Q482 -399 492 -400Q506 -411 520 -398Q535 -386 541 -369Q548 -349 541 -338Q534 -327 510 -320Q487 -313 444 -304Q401 -294 336 -276Q281 -260 247 -257Q213 -254 215 -274Q208 -278 200 -266Q191 -255 184 -235Q177 -215 172 -192Q166 -169 165 -149Q164 -129 168 -118Q176 -95 194 -78Q211 -62 245 -52Q265 -51 284 -49Q303 -47 327 -57Q386 -67 409 -78Q432 -89 437 -93Q445 -97 448 -101Q450 -105 455 -105Q452 -100 457 -105Q462 -110 473 -119Q494 -137 515 -141Q536 -145 550 -142Q564 -138 565 -133Q571 -123 559 -102Q547 -80 522 -56Q498 -32 465 -13Q412 15 350 26Q288 38 239 39Z"],"F":[466,"M520 -301Q514 -297 496 -292Q477 -286 433 -281Q420 -280 396 -279Q372 -278 345 -277Q317 -276 294 -276Q272 -277 263 -279Q263 -279 258 -274Q254 -269 254 -261Q247 -249 237 -226Q227 -202 216 -174Q204 -146 194 -118Q184 -91 178 -70Q171 -50 171 -42Q162 -18 160 -1Q158 16 153 19Q150 34 134 34Q119 34 111 25Q89 14 81 -4Q73 -21 80 -43Q83 -56 90 -82Q98 -107 108 -138Q117 -169 128 -198Q138 -228 148 -247Q159 -266 162 -282Q165 -297 170 -310Q169 -321 170 -324Q171 -328 178 -337Q183 -341 190 -352Q198 -362 208 -384Q211 -394 218 -412Q224 -429 230 -448Q236 -466 241 -479Q246 -492 246 -493Q248 -497 252 -508Q256 -520 258 -527Q262 -541 264 -550Q267 -559 263 -559Q255 -557 231 -556Q219 -554 214 -554Q208 -553 204 -552Q194 -551 186 -554Q178 -557 178 -566Q180 -582 190 -599Q199 -616 214 -617Q221 -619 230 -620Q238 -622 253 -626Q272 -630 286 -628Q301 -627 307 -625Q312 -628 316 -632Q319 -635 320 -639Q325 -657 338 -666Q351 -676 366 -676Q380 -677 389 -668Q398 -660 394 -641Q394 -638 396 -636Q398 -634 412 -636Q425 -639 459 -646Q477 -648 504 -650Q532 -652 548 -647Q565 -650 578 -650Q592 -649 597 -653Q618 -649 628 -648Q637 -646 643 -641Q647 -637 646 -634Q645 -630 645 -630Q641 -632 644 -630Q647 -629 652 -625Q659 -622 660 -612Q660 -603 658 -594Q657 -584 656 -581Q655 -572 646 -570Q637 -569 601 -570Q558 -576 522 -574Q485 -573 430 -565Q408 -564 392 -560Q377 -555 377 -555Q373 -555 363 -542Q353 -528 344 -502Q340 -495 330 -473Q321 -451 311 -426Q301 -400 293 -380Q285 -361 283 -359Q297 -355 326 -355Q356 -355 392 -358Q428 -360 460 -363Q475 -366 491 -368Q507 -370 513 -369Q525 -368 531 -354Q537 -339 535 -324Q533 -308 520 -301Z"],"G":[494,"M159 46Q132 26 118 -12Q103 -49 104 -81Q103 -143 114 -209Q126 -275 145 -332Q158 -368 173 -405Q188 -442 204 -476Q220 -509 235 -532Q266 -585 298 -617Q331 -649 348 -659Q376 -673 415 -680Q454 -688 491 -680Q517 -673 542 -660Q568 -647 587 -628Q598 -618 604 -607Q610 -596 610 -584Q610 -569 596 -555Q582 -541 565 -536Q548 -531 539 -542Q526 -562 514 -572Q502 -583 489 -588Q478 -595 460 -595Q441 -595 420 -588Q399 -582 380 -566Q373 -560 362 -549Q350 -538 338 -522Q325 -507 315 -489Q287 -443 268 -396Q248 -348 233 -292Q226 -269 218 -236Q210 -202 204 -169Q197 -136 195 -111Q192 -76 197 -56Q202 -36 218 -30Q234 -23 263 -30Q289 -36 316 -50Q342 -65 367 -88Q392 -110 412 -141Q430 -175 442 -203Q453 -231 454 -248Q454 -264 436 -263Q395 -262 370 -266Q346 -270 337 -286Q324 -289 324 -308Q323 -327 342 -339Q359 -348 389 -350Q419 -352 450 -348Q482 -345 501 -334Q523 -323 532 -302Q540 -280 540 -256Q541 -232 537 -211Q528 -176 512 -143Q497 -110 471 -76Q456 -55 430 -32Q404 -9 376 10Q347 28 322 39Q282 57 238 65Q195 73 159 46Z"],"H":[574,"M153 91Q153 91 143 88Q133 84 122 81Q110 78 104 78Q88 74 81 60Q74 47 78 31Q82 27 84 14Q86 1 86 -7Q90 -15 91 -18Q92 -22 96 -38Q99 -55 106 -86Q114 -116 124 -151Q133 -186 142 -218Q151 -250 158 -272Q166 -294 169 -297Q169 -297 169 -300Q169 -304 169 -308Q169 -308 170 -318Q172 -327 180 -339Q184 -350 187 -363Q190 -376 190 -380Q194 -385 202 -404Q209 -424 216 -443Q222 -459 230 -477Q237 -495 242 -508Q248 -521 248 -521Q248 -525 248 -526Q248 -526 248 -526Q252 -530 268 -566Q283 -603 310 -661Q314 -669 322 -686Q330 -704 330 -708Q345 -723 360 -718Q374 -714 386 -701Q397 -688 402 -677L412 -661L375 -589Q359 -561 348 -538Q336 -515 336 -511Q336 -511 332 -499Q327 -487 321 -468Q315 -450 309 -432Q298 -401 288 -381Q278 -360 278 -356Q278 -358 298 -359Q319 -360 350 -360Q381 -360 414 -360Q446 -361 472 -362Q498 -362 508 -364L560 -369L588 -458Q596 -486 609 -526Q622 -566 632 -594Q648 -640 666 -658Q684 -677 696 -677Q699 -677 708 -672Q716 -666 725 -659Q734 -652 736 -646Q748 -635 748 -621Q747 -607 731 -584Q715 -557 704 -526Q694 -494 686 -474Q686 -462 683 -454Q680 -447 676 -443Q674 -441 668 -428Q662 -415 657 -402Q652 -389 652 -386Q652 -379 649 -369Q646 -359 642 -355Q640 -349 633 -325Q626 -301 617 -268Q608 -236 598 -206Q588 -175 580 -155Q580 -148 575 -138Q570 -127 570 -119Q566 -107 560 -89Q554 -71 554 -66Q549 -43 544 -13Q538 17 534 40Q531 63 531 66Q505 69 492 59Q479 49 468 45Q449 34 446 18Q442 1 453 -22Q458 -30 466 -62Q473 -93 481 -124Q487 -139 494 -162Q501 -185 508 -208Q514 -230 519 -246Q524 -262 526 -264Q526 -268 526 -271Q526 -274 526 -274Q524 -276 506 -278Q488 -279 460 -278Q433 -278 401 -276Q369 -275 340 -271Q329 -271 308 -271Q288 -271 280 -271Q269 -271 262 -271Q254 -271 254 -271Q252 -268 247 -251Q241 -234 234 -210Q226 -186 219 -161Q211 -136 206 -115Q200 -95 198 -86Q194 -68 188 -41Q181 -14 174 14Q166 43 160 64Q155 85 153 91Z"],"I":[409,"M181 41Q174 30 157 27Q140 24 105 26Q91 28 76 24Q61 20 52 12Q43 4 45 -4Q46 -16 73 -30Q100 -44 143 -45L185 -46L195 -66Q199 -77 202 -90Q204 -103 211 -126Q215 -140 223 -165Q231 -190 240 -219Q249 -247 256 -270Q263 -293 265 -302Q269 -311 276 -332Q283 -354 290 -376Q296 -399 298 -409Q324 -488 332 -520Q340 -551 336 -552Q332 -552 317 -551Q302 -550 284 -548Q266 -547 252 -545Q238 -543 235 -541Q230 -534 218 -544Q206 -553 203 -563Q202 -572 203 -580Q204 -588 209 -591Q216 -597 238 -604Q260 -612 287 -618Q315 -624 338 -627Q355 -629 372 -634Q389 -640 399 -648Q408 -651 416 -653Q425 -655 434 -654Q442 -649 462 -649Q481 -649 503 -650Q559 -655 582 -646Q604 -638 611 -624Q616 -605 609 -592Q602 -580 585 -581Q576 -579 560 -578Q544 -576 518 -575Q452 -569 447 -561Q443 -557 440 -553Q438 -549 434 -544Q435 -540 430 -520Q424 -501 416 -479Q412 -466 404 -442Q396 -418 388 -392Q379 -367 372 -346Q365 -326 362 -319Q358 -310 356 -300Q353 -289 352 -284Q338 -235 328 -202Q319 -169 312 -145Q305 -120 299 -98Q293 -75 285 -47Q285 -47 302 -48Q319 -50 345 -52Q392 -57 409 -58Q426 -59 429 -56Q432 -52 435 -43Q455 -16 432 2Q410 20 354 19Q302 21 278 22Q253 24 246 27Q239 30 239 37Q240 53 220 56Q199 60 181 41Z"],"J":[315,"M92 204Q69 217 42 216Q15 215 -10 204Q-34 193 -50 176Q-57 168 -56 146Q-54 125 -50 112Q-45 94 -37 94Q-26 94 -12 113Q16 138 44 127Q71 116 102 68Q108 53 121 25Q134 -3 148 -35Q163 -67 175 -94Q187 -122 191 -134Q191 -134 192 -138Q192 -141 196 -145Q197 -149 201 -161Q205 -173 209 -189Q213 -200 220 -222Q228 -244 236 -268Q245 -292 251 -308Q256 -329 264 -354Q271 -378 276 -391Q280 -399 288 -424Q296 -448 306 -477Q318 -516 328 -545Q337 -574 342 -592Q346 -609 344 -612Q344 -612 326 -609Q309 -606 288 -602Q271 -595 254 -593Q236 -591 239 -604Q239 -608 239 -612Q239 -615 239 -615Q236 -613 231 -619Q226 -625 222 -634Q218 -644 218 -649Q218 -657 242 -668Q265 -678 296 -682Q316 -685 344 -688Q373 -690 386 -692Q390 -695 404 -690Q418 -685 433 -678Q448 -671 453 -665Q459 -657 460 -648Q462 -639 458 -623Q454 -607 444 -578Q433 -548 414 -497Q392 -435 375 -384Q358 -334 344 -301Q341 -290 334 -269Q326 -248 319 -226Q312 -205 308 -191Q300 -172 293 -150Q286 -128 282 -115Q282 -107 278 -97Q274 -87 269 -82Q269 -82 262 -64Q255 -47 245 -23Q237 -3 228 22Q218 46 210 59Q205 71 198 82Q191 92 191 96Q191 96 190 99Q190 102 186 102Q186 102 183 104Q180 107 180 112Q178 118 167 131Q156 144 142 160Q128 175 114 187Q100 199 92 204Z"],"K":[508,"M108 47Q95 39 84 28Q73 16 79 -4Q78 -17 80 -28Q83 -39 84 -43Q89 -43 90 -48Q91 -54 91 -58Q91 -66 97 -85Q103 -104 109 -125Q117 -142 124 -161Q132 -180 132 -184Q132 -192 136 -200Q140 -209 145 -217Q150 -229 152 -244Q155 -258 155 -266Q161 -279 168 -294Q175 -309 179 -325Q185 -342 197 -376Q209 -409 222 -443Q231 -462 240 -483Q248 -503 255 -518Q262 -532 265 -532Q265 -532 265 -536Q265 -539 265 -543Q265 -548 273 -562Q281 -577 288 -593Q298 -608 302 -622Q306 -635 306 -635Q306 -635 310 -641Q314 -648 318 -652Q344 -666 362 -666Q381 -666 388 -642Q396 -620 395 -612Q394 -603 388 -591Q380 -573 367 -546Q354 -518 340 -487Q326 -456 313 -427Q301 -399 294 -379Q286 -359 286 -354L244 -251Q240 -244 231 -216Q222 -187 210 -148Q198 -108 186 -68Q173 -27 161 6Q155 23 150 34Q145 46 140 52Q135 58 128 58Q124 58 119 55Q114 52 108 47ZM462 45Q453 46 438 36Q422 27 404 13Q387 -1 372 -16Q356 -31 347 -42Q331 -65 306 -104Q282 -143 270 -186Q263 -218 256 -238Q248 -257 248 -272L249 -334L322 -339Q327 -285 338 -250Q349 -214 364 -186Q376 -160 390 -135Q405 -110 423 -93Q446 -68 464 -56Q482 -44 491 -44Q510 -35 519 -27Q528 -19 531 -13Q534 -7 533 -2Q534 1 532 12Q530 22 526 32Q522 43 515 46Q508 53 497 54Q486 56 462 45ZM230 -337 303 -391Q306 -394 320 -408Q335 -421 377 -453L509 -560Q534 -573 555 -589Q576 -605 590 -614Q607 -626 625 -639Q643 -652 647 -651Q655 -655 666 -644Q677 -632 684 -616Q692 -601 691 -593Q693 -583 688 -576Q683 -569 662 -557Q637 -546 622 -536Q608 -526 606 -521Q606 -521 585 -505Q564 -489 535 -469Q495 -442 470 -422Q444 -401 436 -389Q432 -389 428 -386Q425 -383 421 -384Q421 -384 413 -378Q405 -373 401 -367Q399 -362 392 -354Q386 -346 377 -347Q370 -343 352 -330Q334 -318 314 -303Q295 -288 281 -276Q267 -264 266 -262Z"],"L":[426,"M194 61Q154 51 130 20Q105 -12 90 -56Q89 -69 90 -92Q90 -115 92 -135Q94 -155 96 -158Q99 -160 99 -170Q98 -174 100 -184Q103 -193 106 -203Q111 -215 111 -222Q111 -230 110 -234Q110 -234 113 -240Q116 -247 120 -251Q126 -257 126 -263Q125 -269 125 -269Q124 -273 127 -280Q130 -287 133 -291Q135 -293 138 -300Q142 -306 142 -306Q142 -309 146 -322Q151 -335 157 -350Q163 -366 168 -379Q174 -392 177 -396V-398Q181 -408 188 -419Q189 -424 193 -436Q197 -447 202 -458Q213 -482 230 -512Q246 -543 265 -574Q284 -604 302 -628Q319 -653 332 -665Q349 -684 366 -692Q384 -701 399 -686Q406 -679 411 -666Q416 -652 416 -640Q415 -629 407 -628Q400 -624 388 -606Q376 -587 362 -562Q347 -537 333 -510Q319 -484 307 -463Q294 -434 283 -412Q272 -391 272 -391Q271 -388 270 -386Q269 -384 268 -382Q253 -351 243 -326Q233 -300 223 -272Q217 -265 216 -258Q215 -251 215 -251Q213 -252 212 -246Q211 -241 208 -234Q203 -230 202 -222Q201 -213 201 -205Q194 -187 188 -162Q182 -136 180 -112Q177 -89 178 -76Q180 -59 188 -48Q195 -36 209 -29Q220 -24 229 -20Q238 -17 245 -17Q253 -16 266 -18Q278 -19 300 -23H299Q312 -25 326 -28Q341 -32 354 -35Q366 -37 377 -40Q388 -42 394 -44Q416 -50 430 -54Q443 -58 448 -54Q453 -50 459 -39Q465 -28 462 -19Q460 -14 442 2Q424 17 401 32Q378 48 359 54Q339 63 306 66Q272 70 241 68Q210 66 194 61Z"],"M":[729,"M675 48Q671 52 656 50Q641 49 632 36Q625 22 624 4Q623 -14 624 -46Q630 -81 644 -138Q658 -195 676 -266Q693 -336 711 -410Q720 -445 726 -469Q731 -493 734 -506Q736 -518 736 -518Q735 -516 734 -514Q732 -512 731 -510Q730 -508 729 -506Q729 -506 726 -499Q722 -492 711 -475Q703 -463 696 -447Q689 -431 672 -405Q656 -375 636 -336Q616 -297 602 -274Q595 -263 590 -255Q584 -247 582 -242Q578 -231 569 -215Q560 -199 548 -184Q542 -175 532 -163Q523 -151 516 -142Q509 -132 509 -132Q507 -126 496 -113Q485 -100 470 -84Q454 -69 438 -56Q403 -28 380 -21Q358 -14 329 -38Q316 -54 308 -70Q300 -87 300 -116Q300 -145 310 -197Q317 -230 326 -267Q334 -304 343 -338Q352 -373 360 -398Q367 -424 370 -434Q373 -459 371 -460Q369 -462 361 -449Q354 -438 335 -403Q316 -368 292 -321Q269 -274 247 -227Q206 -151 178 -100Q150 -49 132 -18Q114 12 104 28Q95 43 90 50Q86 56 84 58Q69 57 58 44Q47 31 40 13Q38 3 37 -8Q36 -19 40 -32Q43 -46 51 -62Q64 -88 76 -106Q88 -124 91 -128Q96 -135 99 -143Q102 -151 103 -158Q108 -164 118 -183Q129 -202 140 -224Q148 -237 162 -260Q176 -284 192 -312Q208 -339 220 -362Q264 -441 290 -488Q316 -536 327 -549Q334 -554 340 -568Q345 -583 349 -590Q363 -618 378 -636Q392 -655 403 -655Q411 -655 424 -649Q436 -643 448 -632Q459 -619 468 -598Q478 -576 472 -541Q471 -525 467 -502Q463 -480 459 -458Q455 -436 451 -421Q443 -376 434 -336Q424 -295 416 -261Q408 -227 403 -202Q398 -176 396 -160Q395 -144 400 -139Q403 -138 408 -142Q414 -145 417 -149Q423 -157 428 -165Q433 -173 441 -185Q457 -207 474 -234Q492 -260 516 -300Q541 -339 575 -398Q609 -456 658 -543Q681 -578 702 -613Q723 -648 740 -667Q755 -683 778 -678Q800 -673 819 -653Q838 -633 840 -604Q841 -590 834 -554Q828 -519 817 -475Q806 -431 792 -389Q789 -372 782 -344Q775 -316 767 -287Q759 -258 752 -235Q745 -201 740 -181Q736 -161 736 -135Q727 -119 724 -89Q721 -59 721 -27Q717 12 704 28Q692 44 688 43Q680 40 675 48Z"],"N":[619,"M110 85Q90 74 83 59Q76 44 78 26Q79 8 84 -11Q92 -43 102 -64Q111 -86 120 -110Q130 -133 137 -170Q153 -207 166 -240Q178 -273 185 -294Q192 -315 192 -315Q193 -319 200 -336Q208 -353 219 -378Q231 -402 242 -427Q259 -475 274 -508Q289 -542 304 -569Q320 -596 338 -623Q350 -644 372 -648Q394 -652 414 -644Q434 -635 440 -615Q445 -605 448 -592Q452 -579 456 -554Q459 -528 460 -480Q462 -423 462 -376Q463 -328 466 -288Q470 -248 479 -215Q482 -197 485 -172Q488 -146 491 -121Q495 -96 499 -80Q503 -63 507 -63Q512 -63 518 -72Q525 -80 536 -108Q547 -136 564 -194Q581 -252 605 -350Q610 -367 618 -405Q627 -443 631 -482Q638 -507 645 -537Q652 -567 658 -590Q663 -613 663 -616Q663 -623 664 -628Q664 -633 663 -638Q668 -638 672 -652Q676 -665 676 -675Q676 -692 680 -702Q685 -713 690 -718Q701 -738 718 -738Q736 -739 751 -728Q766 -718 769 -703Q771 -692 764 -654Q756 -615 741 -550Q741 -539 735 -514Q729 -489 722 -461Q716 -433 713 -413Q709 -387 704 -364Q699 -342 694 -343Q668 -230 640 -150Q611 -71 589 -21Q565 34 528 50Q490 65 458 24Q439 -2 426 -27Q413 -52 405 -86Q397 -120 391 -172Q385 -214 380 -254Q376 -295 374 -338Q372 -380 373 -428Q374 -485 368 -495Q363 -505 353 -484Q343 -463 330 -427Q323 -407 314 -382Q304 -356 294 -331Q284 -306 277 -288Q270 -270 268 -265Q262 -253 254 -234Q246 -214 241 -192Q205 -98 188 -30Q170 37 162 59Q152 87 144 93Q135 99 110 85Z"],"O":[505,"M187 35Q150 8 128 -16Q107 -39 105 -61Q103 -79 106 -110Q108 -141 112 -171Q116 -201 119 -216Q124 -221 124 -230Q123 -238 123 -238Q122 -243 130 -264Q138 -286 145 -320Q165 -380 184 -420Q202 -461 220 -490Q238 -519 256 -543Q297 -585 334 -610Q370 -635 401 -649Q421 -661 438 -668Q455 -675 466 -670Q522 -658 561 -621Q600 -584 613 -514Q620 -470 622 -434Q623 -399 616 -364Q609 -330 590 -289Q572 -248 539 -193Q498 -112 450 -58Q401 -3 352 25Q304 53 260 56Q217 58 187 35ZM267 -31Q290 -34 304 -40Q319 -46 335 -63Q351 -80 380 -113Q406 -143 424 -164Q441 -185 454 -207Q466 -229 478 -260Q489 -290 503 -338Q511 -368 514 -382Q518 -397 519 -407Q520 -417 520 -434Q519 -452 519 -488Q518 -505 512 -526Q506 -548 498 -557Q488 -568 468 -576Q448 -584 426 -574Q414 -569 396 -554Q378 -538 359 -517Q340 -496 323 -475Q306 -454 296 -437Q286 -420 286 -413Q286 -413 286 -408Q285 -403 281 -398Q268 -384 254 -352Q240 -320 228 -279Q216 -238 208 -197Q200 -156 198 -123Q198 -107 198 -96Q198 -85 200 -76Q203 -68 209 -58Q215 -48 234 -38Q252 -28 267 -31Z"],"P":[468,"M115 57Q103 57 95 44Q89 38 82 25Q75 12 78 -18Q80 -47 99 -104Q109 -142 115 -160Q121 -177 121 -185Q121 -196 124 -204Q126 -211 126 -218Q132 -218 138 -229Q144 -240 148 -259Q152 -276 156 -286Q159 -297 159 -301Q164 -309 170 -326Q175 -343 187 -367Q195 -397 205 -430Q215 -462 226 -490Q236 -519 243 -535Q254 -566 260 -578Q266 -591 260 -595Q253 -600 254 -620Q254 -641 272 -656Q283 -669 300 -674Q317 -680 339 -680Q361 -680 385 -678Q403 -677 424 -677Q444 -677 449 -677Q458 -673 471 -668Q484 -663 494 -659Q505 -654 505 -651Q505 -645 510 -644Q514 -642 519 -641Q526 -641 542 -628Q558 -616 574 -598Q591 -581 598 -564Q606 -547 612 -532Q617 -517 612 -489Q611 -474 608 -459Q604 -444 600 -439Q594 -435 589 -429Q584 -423 584 -418Q584 -414 576 -398Q568 -383 556 -364Q544 -344 530 -325Q516 -306 504 -295Q491 -279 474 -265Q456 -251 442 -242Q416 -230 382 -219Q349 -208 318 -202Q287 -195 268 -196Q239 -192 230 -188Q221 -185 217 -171Q212 -158 208 -144Q203 -130 203 -124Q201 -120 194 -102Q188 -84 180 -60Q171 -36 164 -12Q157 12 153 29Q149 43 136 50Q124 57 115 57ZM257 -277Q261 -273 283 -276Q305 -279 336 -291Q356 -298 376 -308Q397 -318 416 -330Q426 -337 437 -348Q448 -358 468 -383Q471 -388 478 -402Q486 -417 492 -430Q501 -444 510 -472Q519 -499 514 -517Q509 -543 494 -560Q479 -578 456 -586Q434 -590 420 -591Q405 -592 388 -589Q372 -584 366 -575Q359 -566 347 -537Q340 -523 327 -498Q314 -474 305 -449Q287 -383 274 -348Q260 -313 256 -302Q257 -291 255 -286Q253 -282 257 -277Z"],"Q":[492,"M235 86Q220 83 198 70Q176 57 158 40Q139 23 132 9Q107 -42 104 -100Q102 -157 119 -239Q124 -256 132 -285Q141 -314 151 -343Q161 -372 169 -392Q177 -412 179 -412Q182 -415 182 -429Q182 -434 190 -450Q199 -467 212 -488Q226 -509 240 -528Q255 -548 268 -559Q288 -585 314 -610Q339 -636 364 -649Q370 -653 386 -658Q401 -663 418 -667Q436 -671 447 -672Q497 -675 530 -656Q562 -638 581 -599Q601 -577 603 -554Q605 -530 609 -501Q609 -474 604 -438Q598 -401 589 -366Q580 -330 569 -306Q558 -283 548 -283Q548 -283 545 -282Q542 -282 542 -277Q544 -270 538 -246Q532 -221 517 -192Q485 -102 438 -38Q390 27 338 60Q285 92 235 86ZM441 126Q425 127 404 119Q383 111 379 98Q372 92 372 86Q372 81 370 79Q366 77 359 68Q352 60 349 49Q342 35 328 8Q315 -18 300 -46Q285 -75 274 -96Q262 -118 260 -121Q252 -129 262 -141Q267 -153 283 -164Q299 -174 318 -169Q341 -169 360 -121Q361 -116 369 -97Q377 -78 387 -60Q397 -41 403 -36Q408 -25 414 -11Q420 3 427 12Q430 23 440 36Q450 49 454 63Q477 99 472 113Q467 127 441 126ZM250 0Q292 -6 328 -44Q365 -83 398 -149Q431 -215 461 -300Q470 -325 484 -355Q497 -385 508 -422Q519 -458 519 -499Q525 -543 515 -560Q505 -576 481 -587Q449 -599 414 -584Q379 -569 346 -528Q312 -486 283 -416Q242 -329 220 -264Q199 -200 194 -150Q189 -100 199 -55Q201 -24 213 -8Q225 7 250 0Z"],"R":[544,"M160 60Q156 70 133 70Q110 70 93 57Q81 45 78 38Q74 32 81 16Q88 1 105 -38Q109 -62 119 -86Q129 -111 134 -121Q138 -135 150 -168Q163 -200 180 -240Q196 -280 211 -316Q226 -351 233 -369Q250 -409 268 -453Q286 -497 317 -564Q321 -574 314 -585Q307 -596 290 -596Q280 -607 279 -619Q278 -632 289 -637L381 -668Q428 -679 478 -674Q527 -670 571 -647Q619 -619 641 -585Q663 -551 666 -516Q668 -482 657 -454Q649 -433 626 -408Q604 -383 574 -358Q545 -333 514 -312Q482 -292 455 -281Q430 -269 399 -256Q368 -244 339 -235Q323 -231 301 -231Q279 -231 268 -235L251 -203Q241 -167 216 -96Q192 -25 160 60ZM557 79Q549 82 530 81Q512 80 489 65Q445 39 401 2Q357 -35 302 -98Q281 -123 270 -148Q260 -173 244 -211L230 -265L268 -290L312 -254Q328 -219 350 -187Q371 -155 393 -130Q411 -109 442 -80Q473 -50 508 -23Q543 4 571 18Q577 23 574 38Q572 52 566 65Q561 78 557 79ZM305 -313Q328 -315 356 -326Q383 -336 414 -349Q443 -363 472 -380Q500 -396 524 -416Q547 -436 560 -459Q574 -482 572 -508Q572 -521 564 -537Q556 -553 544 -566Q531 -579 518 -583Q478 -593 457 -595Q436 -597 426 -589Q417 -581 412 -561Q412 -558 404 -542Q396 -526 384 -501Q373 -477 362 -449Q333 -390 320 -362Q306 -335 304 -326Q301 -317 305 -313Z"],"S":[495,"M266 65Q248 60 237 56Q226 53 226 53Q228 48 224 44Q221 40 210 39Q195 29 179 11Q163 -7 151 -26Q139 -45 135 -54Q128 -69 136 -72Q144 -76 155 -81Q166 -89 178 -93Q191 -97 199 -80Q212 -57 240 -41Q267 -25 302 -22Q338 -19 374 -34Q398 -45 400 -64Q402 -84 385 -110Q382 -118 376 -123Q371 -128 360 -136Q350 -144 331 -162Q316 -169 304 -175Q291 -181 277 -188Q261 -196 241 -210Q221 -225 204 -242Q187 -260 178 -276Q162 -291 158 -318Q154 -344 160 -374Q165 -404 178 -428Q184 -442 200 -464Q216 -487 236 -511Q256 -535 274 -555Q293 -574 304 -581Q312 -589 321 -598Q330 -606 330 -606Q331 -611 334 -611Q336 -611 336 -611Q341 -614 358 -621Q375 -628 395 -647Q462 -679 509 -690Q556 -702 583 -702Q608 -701 632 -688Q656 -676 674 -657Q691 -638 694 -614Q701 -590 688 -556Q674 -523 650 -494Q627 -464 602 -450Q574 -438 554 -447Q535 -456 536 -475Q536 -483 542 -494Q547 -505 572 -533Q604 -580 606 -600Q608 -620 588 -623Q582 -625 565 -622Q548 -619 528 -614Q509 -610 494 -605Q480 -600 480 -598Q480 -598 480 -595Q480 -592 476 -593Q474 -593 463 -587Q451 -580 435 -570Q419 -560 404 -550Q388 -539 377 -531Q366 -523 365 -521Q363 -510 342 -501Q322 -489 307 -467Q292 -445 272 -411Q255 -388 248 -362Q241 -335 248 -319Q253 -303 276 -288Q298 -272 337 -249Q371 -230 401 -209Q431 -188 452 -168Q473 -149 479 -136Q491 -119 494 -97Q496 -75 494 -54Q491 -34 487 -21Q480 -5 466 13Q451 31 439 30Q428 33 422 37Q417 41 410 44Q403 48 377 54Q351 59 320 62Q289 66 266 65Z"],"T":[458,"M224 53Q206 54 194 36Q182 18 183 6Q184 -10 192 -40Q200 -70 210 -101Q220 -132 228 -150Q232 -166 236 -178Q239 -191 240 -195Q243 -199 250 -216Q256 -233 260 -249Q262 -257 268 -280Q275 -302 284 -332Q294 -362 304 -391Q313 -420 320 -442Q327 -464 329 -471Q337 -483 341 -494Q345 -505 346 -509Q352 -513 353 -520Q354 -526 354 -530Q354 -535 358 -538Q361 -541 361 -545Q365 -548 366 -546Q367 -544 372 -549L377 -583L466 -584Q464 -572 460 -554Q456 -537 441 -508Q436 -488 430 -472Q423 -456 424 -451Q422 -449 416 -431Q409 -413 400 -387Q392 -361 384 -335Q375 -309 368 -290Q362 -270 360 -265Q352 -249 342 -218Q332 -187 312 -134Q304 -118 292 -86Q281 -54 274 -28Q263 11 254 28Q246 45 239 48Q232 52 224 53ZM233 -535Q192 -531 178 -545Q163 -559 167 -575Q170 -587 182 -596Q193 -604 224 -610Q235 -612 252 -615Q270 -618 286 -621Q319 -625 340 -628Q362 -631 385 -633Q408 -635 443 -637Q472 -639 492 -640Q513 -642 513 -642Q516 -642 534 -640Q552 -638 573 -635Q594 -632 604 -628Q627 -623 641 -610Q655 -597 659 -580Q662 -568 659 -562Q656 -555 648 -551Q625 -544 610 -540Q596 -535 582 -540Q577 -545 570 -549Q564 -553 548 -556Q533 -558 500 -560Q472 -557 451 -557Q430 -557 430 -552L371 -549L322 -544Q312 -543 294 -542Q276 -540 259 -538Q242 -537 233 -535Z"],"U":[482,"M229 60Q177 46 150 7Q122 -32 120 -102Q117 -171 138 -275Q145 -310 158 -355Q171 -400 188 -448Q206 -495 226 -540Q245 -584 264 -618Q287 -659 304 -673Q321 -687 337 -685Q361 -681 374 -666Q386 -650 386 -632Q385 -615 368 -604Q357 -591 340 -556Q322 -522 304 -490Q284 -432 269 -388Q254 -343 244 -304Q234 -265 226 -222Q217 -180 212 -158Q207 -135 206 -124Q204 -112 204 -104Q203 -95 203 -81Q211 -68 216 -58Q221 -48 229 -46Q246 -38 264 -38Q281 -38 302 -50Q307 -60 315 -64Q323 -68 323 -68Q325 -63 328 -66Q330 -68 331 -72Q330 -76 333 -80Q336 -83 340 -87Q348 -90 360 -104Q373 -118 385 -136Q397 -153 406 -168Q414 -183 414 -187Q414 -192 418 -196Q422 -200 427 -206Q432 -211 448 -238Q463 -266 482 -303Q500 -340 515 -371Q518 -382 526 -406Q534 -431 544 -463Q553 -495 562 -528Q571 -560 578 -586Q586 -611 588 -623Q590 -636 594 -644Q598 -653 599 -657Q610 -666 624 -662Q638 -658 650 -650Q663 -643 669 -640Q675 -632 674 -620Q673 -608 668 -584Q662 -559 652 -513Q631 -431 602 -362Q572 -293 538 -216Q538 -216 538 -216Q538 -215 538 -210Q526 -203 519 -189Q514 -180 510 -174Q507 -167 502 -164Q499 -155 496 -148Q493 -141 493 -141Q492 -136 486 -132Q480 -128 474 -124Q469 -122 468 -116Q467 -110 464 -106Q442 -73 410 -40Q378 -6 344 19Q311 44 284 54Q266 61 254 62Q243 63 229 60Z"],"V":[490,"M264 60Q259 58 257 54Q255 50 253 38Q253 27 247 22Q241 17 224 13Q213 2 206 -12Q199 -27 195 -60Q191 -92 187 -156Q189 -191 190 -215Q192 -239 194 -260Q196 -281 198 -305Q201 -329 206 -365Q204 -388 208 -415Q213 -442 210 -458Q217 -480 219 -508Q221 -537 228 -559Q230 -576 232 -591Q235 -606 235 -616Q233 -636 240 -658Q246 -680 268 -690Q274 -692 284 -692Q295 -692 301 -690Q317 -683 320 -668Q322 -653 321 -642Q323 -631 324 -604Q324 -577 322 -544Q319 -512 312 -481Q304 -440 300 -398Q295 -355 293 -314Q289 -232 285 -178Q281 -124 284 -100Q284 -97 284 -92Q285 -86 287 -82Q289 -79 292 -79Q296 -80 298 -85Q301 -90 304 -100Q308 -110 314 -123Q327 -148 340 -178Q354 -207 364 -234Q382 -276 400 -306Q418 -336 434 -373Q440 -389 456 -420Q471 -450 485 -476Q502 -502 518 -526Q533 -550 554 -590Q583 -638 604 -660Q625 -683 641 -683Q652 -685 660 -684Q667 -682 674 -672Q682 -661 684 -647Q686 -633 678 -611Q669 -589 643 -552Q623 -522 598 -482Q574 -442 554 -406Q533 -371 524 -354Q519 -343 515 -331Q511 -319 503 -309Q493 -299 476 -266Q459 -233 443 -201Q425 -159 414 -136Q404 -112 398 -97Q391 -82 385 -68Q379 -54 370 -33Q365 -16 356 -4Q348 8 347 14Q340 25 322 37Q305 49 288 56Q271 63 264 60Z"],"W":[720,"M503 62Q490 63 480 56Q469 50 465 40Q461 35 452 18Q443 2 441 -10Q438 -42 438 -72Q437 -102 440 -156Q443 -200 452 -234Q461 -269 470 -294Q479 -318 484 -330Q489 -343 486 -343Q482 -343 478 -336Q473 -328 468 -316Q462 -304 456 -290Q449 -276 442 -263Q428 -232 410 -198Q391 -163 372 -131Q353 -99 339 -75Q330 -65 318 -46Q306 -28 292 -8Q278 12 263 25Q241 46 218 50Q195 55 175 45Q165 44 154 34Q143 25 136 11Q130 -3 133 -15Q132 -29 134 -58Q135 -88 139 -124Q143 -159 148 -192Q152 -225 156 -247Q165 -311 180 -378Q196 -445 209 -513Q217 -533 224 -558Q230 -584 237 -606Q238 -628 253 -634Q268 -639 286 -635Q303 -631 310 -621Q320 -611 329 -590Q338 -569 324 -537Q304 -488 286 -418Q267 -347 252 -247Q248 -223 244 -194Q239 -164 236 -137Q232 -110 230 -92Q229 -75 231 -74Q239 -72 248 -83Q258 -94 269 -118Q310 -186 346 -253Q383 -320 420 -393Q437 -422 454 -456Q472 -491 488 -520Q505 -550 521 -578Q537 -606 549 -626Q561 -645 567 -647Q594 -647 608 -633Q621 -619 629 -599Q631 -594 632 -582Q632 -570 628 -561Q627 -554 620 -532Q612 -510 606 -483Q596 -456 588 -430Q581 -403 578 -386Q570 -343 558 -292Q546 -241 538 -191Q529 -140 528 -101Q527 -73 528 -64Q530 -56 534 -47Q536 -39 543 -43Q550 -47 557 -57Q571 -78 578 -93Q586 -108 594 -126Q602 -143 616 -170Q641 -216 668 -271Q694 -326 718 -380Q743 -434 761 -476Q780 -530 793 -564Q806 -597 817 -615Q828 -633 838 -639Q843 -643 860 -643Q876 -643 885 -635Q889 -631 899 -622Q909 -613 908 -601Q903 -585 889 -549Q876 -513 858 -469Q841 -426 824 -386Q808 -347 797 -324Q786 -303 776 -288Q766 -273 766 -265Q766 -261 756 -240Q746 -220 730 -191Q715 -162 697 -131Q679 -100 663 -74Q647 -48 636 -34Q611 -3 582 18Q554 40 532 51Q510 62 503 62Z"],"X":[524,"M634 -650Q654 -649 662 -629Q671 -609 666 -578Q661 -548 637 -514Q614 -491 611 -475Q604 -466 590 -450Q575 -433 558 -414Q542 -396 530 -382Q517 -368 513 -365Q499 -353 482 -337Q464 -321 450 -308Q437 -294 433 -289Q426 -282 420 -274Q414 -267 409 -265Q408 -261 403 -256Q398 -250 396 -245Q394 -244 383 -234Q372 -224 358 -212Q345 -199 334 -189Q324 -179 323 -177Q312 -167 289 -142Q266 -118 238 -88Q210 -58 184 -30Q158 -1 140 20Q123 40 121 45Q117 53 108 56Q100 58 92 56Q88 58 74 57Q60 56 58 55Q58 55 56 50Q54 45 52 34Q46 24 52 2Q57 -19 61 -30Q68 -43 75 -52Q82 -61 99 -76Q116 -92 151 -125Q167 -141 184 -156Q200 -170 201 -173Q202 -177 209 -184Q216 -191 223 -201Q230 -206 246 -222Q263 -237 283 -256Q303 -276 322 -295Q342 -314 355 -326Q361 -334 370 -342Q378 -351 388 -363Q389 -365 402 -378Q414 -390 431 -408Q448 -425 464 -442Q479 -458 487 -467Q527 -514 560 -558Q592 -602 605 -630Q615 -651 620 -650Q626 -649 634 -650ZM493 31Q474 29 450 10Q425 -9 402 -50Q365 -101 337 -174Q309 -246 298 -330Q293 -365 287 -390Q281 -416 279 -418Q278 -422 280 -424Q283 -425 283 -425Q286 -428 284 -432Q282 -435 280 -440Q280 -440 275 -463Q270 -486 267 -520Q263 -556 260 -582Q258 -609 256 -617Q253 -619 253 -623Q253 -627 253 -627Q255 -633 264 -642Q274 -650 277 -653Q292 -664 310 -660Q328 -655 341 -638Q354 -622 354 -597Q354 -571 360 -565Q359 -563 360 -550Q360 -537 362 -520Q363 -504 365 -490Q367 -476 368 -471Q364 -459 368 -454Q369 -446 371 -432Q373 -419 372 -414Q371 -409 374 -396Q378 -384 381 -371L407 -281Q415 -249 422 -224Q429 -200 439 -176Q449 -153 463 -124Q474 -100 489 -80Q504 -59 516 -52Q518 -50 526 -50Q535 -49 537 -52Q548 -55 552 -45Q556 -35 556 -22Q557 -8 557 2Q559 9 549 16Q539 24 524 28Q508 33 493 31Z"],"Y":[504,"M314 -259 279 -303Q259 -333 247 -359Q235 -385 230 -423Q223 -447 221 -468Q219 -489 220 -516Q220 -544 221 -585Q222 -623 233 -648Q244 -672 248 -680Q269 -698 282 -687Q296 -676 302 -650Q309 -624 308 -595Q311 -488 322 -433Q332 -378 348 -365Q360 -362 369 -368Q378 -373 392 -390Q407 -406 433 -433Q461 -462 489 -494Q517 -527 542 -557Q568 -587 588 -609Q609 -631 621 -638Q625 -644 635 -648Q645 -653 654 -656Q664 -658 664 -658Q672 -656 673 -646Q674 -635 681 -625Q683 -621 690 -613Q697 -605 696 -600Q696 -597 687 -586Q678 -576 668 -566Q658 -556 653 -551Q640 -540 612 -512Q585 -485 556 -454Q527 -422 507 -397Q463 -346 428 -309Q394 -272 386 -265Q385 -263 373 -262Q361 -262 356 -254ZM258 76Q254 75 242 67Q229 59 219 52Q212 44 210 35Q209 26 213 11Q217 -4 224 -31Q225 -54 234 -87Q242 -120 254 -142Q254 -153 259 -172Q264 -191 272 -212Q279 -232 285 -247L303 -299L343 -333L395 -297Q391 -291 388 -283Q385 -275 380 -256Q375 -237 365 -197Q357 -170 348 -139Q338 -108 330 -81Q322 -54 316 -37Q304 8 294 34Q285 60 276 70Q268 79 258 76Z"],"Z":[522,"M118 57Q97 55 78 51Q59 47 51 28Q42 7 51 -18Q60 -43 70 -53Q87 -71 106 -92Q125 -113 152 -139Q178 -166 217 -204Q256 -241 314 -292Q354 -326 378 -348Q402 -371 421 -390Q440 -409 463 -433Q498 -469 522 -496Q546 -522 551 -542Q557 -562 554 -570Q552 -579 536 -582Q520 -586 485 -588Q423 -593 372 -588Q320 -582 276 -574Q269 -572 260 -581Q250 -590 250 -594Q254 -599 254 -608Q254 -617 246 -623Q242 -633 246 -642Q250 -652 254 -656Q262 -660 284 -663Q306 -666 329 -670Q344 -673 374 -674Q403 -675 434 -675Q464 -675 482 -673Q518 -670 556 -664Q595 -659 624 -648Q654 -636 663 -614Q674 -591 668 -573Q661 -555 650 -525Q638 -503 610 -466Q581 -430 544 -390Q508 -351 470 -316Q414 -264 370 -224Q325 -183 281 -145Q253 -121 229 -100Q205 -78 177 -52Q167 -39 174 -31Q180 -23 221 -25Q244 -26 257 -29Q270 -32 285 -35Q300 -38 327 -39Q379 -42 414 -44Q448 -46 476 -46Q484 -46 490 -44Q495 -42 505 -28Q514 -25 515 -14Q516 -2 511 10Q506 23 497 30Q490 30 472 34Q455 37 434 40Q414 42 398 41Q385 40 348 42Q312 45 270 50Q233 56 189 57Q145 58 118 57Z"],"[":[330,"M66 144Q49 136 45 116Q41 96 53 79Q58 76 62 68Q66 60 66 53Q66 46 72 22Q77 -2 86 -34Q94 -66 103 -97Q112 -128 120 -150Q127 -173 130 -177Q130 -182 137 -199Q144 -216 161 -242Q177 -293 198 -352Q220 -412 243 -468Q266 -524 286 -568Q305 -611 317 -629Q320 -642 322 -654Q325 -667 325 -671Q325 -691 335 -702Q345 -712 374 -712Q403 -716 427 -717Q451 -718 477 -722Q502 -727 536 -738Q551 -741 570 -752Q588 -762 592 -762Q604 -765 610 -758Q616 -751 624 -738Q638 -722 636 -712Q635 -701 613 -692Q596 -687 568 -678Q539 -669 508 -661Q478 -653 455 -650Q436 -645 422 -641Q409 -637 406 -633Q404 -630 398 -618Q393 -606 386 -592Q380 -577 375 -565Q370 -554 370 -552Q368 -550 360 -534Q352 -519 342 -498Q332 -478 324 -460Q316 -441 314 -432Q312 -426 304 -406Q295 -385 286 -363Q277 -341 273 -329Q269 -319 264 -302Q258 -284 252 -268Q247 -251 243 -242Q243 -239 240 -227Q238 -215 233 -207Q229 -200 224 -186Q218 -173 215 -162Q211 -155 207 -148Q203 -142 203 -138Q203 -135 202 -129Q202 -123 198 -112Q195 -108 194 -103Q194 -98 194 -98Q190 -94 186 -76Q182 -58 173 -36Q165 -11 158 7Q152 25 152 33L147 61L177 55Q195 52 225 48Q254 45 282 42Q310 40 325 40Q343 36 350 39Q358 42 363 49Q368 56 376 65Q380 73 382 78Q384 84 381 87Q379 90 356 96Q333 102 304 108Q276 114 255 117Q239 117 228 117Q218 117 218 117Q218 126 185 126Q174 132 156 136Q138 140 131 144Q109 153 93 153Q77 153 66 144Z"],"\\":[330,"M333 121Q329 121 325 119Q321 117 319 114Q301 111 305 95Q305 91 300 68Q296 45 289 10Q282 -24 273 -63Q264 -102 255 -139Q246 -176 239 -204Q232 -232 228 -243Q229 -247 227 -251Q225 -255 226 -259Q226 -264 224 -272Q223 -279 224 -283Q220 -287 218 -296Q217 -306 218 -314Q219 -322 217 -330Q215 -337 210 -337Q209 -340 205 -358Q201 -375 196 -400Q191 -425 185 -454Q179 -482 174 -509Q169 -536 166 -556Q162 -575 162 -582Q164 -590 162 -601Q160 -612 158 -625Q154 -674 163 -702Q172 -729 190 -738Q207 -747 225 -739Q231 -734 235 -716Q239 -697 235 -674Q234 -663 237 -638Q240 -612 245 -578Q250 -545 256 -508Q262 -472 268 -440Q273 -407 276 -384Q283 -362 284 -348Q286 -333 284 -329Q284 -329 284 -324Q284 -318 288 -318Q292 -314 292 -310Q292 -305 293 -301Q292 -299 295 -286Q298 -273 303 -255Q308 -237 313 -220Q318 -204 321 -196Q322 -183 324 -174Q327 -165 326 -161Q326 -159 330 -144Q333 -130 339 -110Q345 -89 350 -70Q355 -52 358 -41Q370 -4 376 14Q383 33 385 43Q387 53 384 66Q384 77 382 86Q379 94 369 101Q359 108 346 114Q333 121 333 121Z"],"]":[330,"M120 126Q116 126 106 126Q97 126 87 124Q80 125 64 126Q47 126 30 123Q15 124 -3 118Q-21 111 -26 112Q-26 112 -31 105Q-36 98 -41 92L-55 82L-43 77Q-39 72 -21 66Q-3 60 20 55Q42 50 61 47Q80 44 85 46Q88 46 98 48Q108 49 119 48L146 45L156 18Q158 6 160 -6Q161 -19 161 -23Q167 -28 170 -36Q174 -44 173 -50Q176 -58 182 -73Q187 -88 193 -107Q195 -123 205 -150Q215 -178 219 -203Q225 -223 234 -246Q242 -270 244 -282Q246 -297 253 -313Q260 -329 261 -344Q270 -372 285 -417Q300 -461 317 -512Q334 -563 348 -609Q359 -631 364 -652Q370 -672 370 -672Q370 -672 350 -670Q331 -669 302 -667Q239 -663 212 -662Q186 -660 181 -660Q176 -661 175 -663Q172 -666 172 -670Q171 -675 168 -675Q164 -674 160 -682Q156 -690 155 -697Q155 -706 174 -715Q192 -724 222 -732Q253 -739 289 -743Q333 -748 346 -746Q358 -745 361 -745Q372 -748 394 -751Q415 -754 436 -755Q457 -756 464 -751Q467 -751 474 -738Q480 -725 480 -715Q488 -701 488 -698Q488 -694 482 -686Q478 -680 470 -664Q461 -649 452 -631Q444 -613 438 -599Q433 -585 434 -582Q434 -579 433 -576Q432 -574 427 -573Q427 -573 424 -572Q422 -571 422 -566Q424 -558 419 -544Q414 -529 410 -529Q410 -529 408 -528Q405 -527 405 -522Q405 -518 402 -508Q400 -498 395 -484Q385 -449 375 -426Q365 -403 365 -400Q365 -400 362 -393Q359 -386 357 -379Q353 -371 349 -352Q345 -334 343 -318Q334 -305 327 -286Q320 -268 318 -262Q315 -252 314 -243Q312 -234 312 -234Q312 -231 308 -212Q303 -194 296 -174Q290 -154 285 -144Q285 -140 280 -120Q275 -100 267 -74Q263 -51 258 -30Q253 -9 251 -4Q251 -1 246 2Q242 6 242 11Q242 15 242 22Q242 28 237 32Q234 37 234 42Q234 48 234 48Q237 48 236 50Q235 52 235 52Q232 52 232 59Q231 66 231 72Q231 93 223 106Q215 119 198 124Q182 128 155 126Q131 123 125 124Q119 124 121 126Q123 127 125 128Q127 128 120 126Z"],"^":[446,"M134 -287Q129 -291 122 -298Q116 -305 116 -322Q116 -340 129 -374Q146 -408 154 -424Q161 -440 172 -453Q181 -469 200 -489Q218 -509 240 -527Q263 -545 284 -556Q306 -568 321 -566Q330 -565 344 -546Q358 -527 374 -498Q390 -468 406 -436Q422 -403 435 -374Q448 -346 455 -329Q460 -317 454 -301Q447 -285 434 -274Q421 -262 408 -264Q394 -267 386 -293Q381 -308 378 -319Q374 -330 366 -350Q357 -370 338 -411Q322 -438 315 -452Q308 -465 303 -469Q298 -473 288 -470Q275 -466 262 -455Q250 -444 236 -420Q221 -395 200 -349Q189 -316 169 -298Q149 -279 134 -287Z"],"_":[446,"M114 14Q108 14 99 14Q90 13 79 9Q64 9 56 2Q47 -4 43 -11Q32 -26 44 -33Q57 -40 94 -44Q111 -48 144 -50Q178 -53 218 -54Q258 -56 293 -57Q329 -58 349 -58Q375 -58 388 -54Q401 -51 412 -40Q427 -25 419 -8Q411 8 388 4Q383 4 369 5Q355 6 339 7Q322 8 310 9Q304 9 279 10Q254 11 221 12Q188 13 158 14Q128 14 114 14Z"],"`":[353,"M340 -426Q327 -416 320 -419Q313 -422 308 -446Q304 -461 293 -480Q282 -498 271 -517Q260 -536 256 -552Q251 -568 259 -578Q264 -586 277 -597Q290 -608 305 -604Q314 -601 324 -586Q335 -571 344 -550Q354 -528 362 -506Q369 -483 374 -465Q375 -462 368 -454Q362 -445 354 -437Q346 -429 340 -426Z"],"a":[446,"M124 -21Q120 -29 106 -37Q93 -45 93 -49Q93 -53 88 -62Q84 -70 80 -74Q75 -80 83 -104Q91 -127 107 -161Q123 -195 142 -230Q150 -238 158 -251Q166 -264 170 -268Q170 -272 173 -276Q176 -279 180 -279L188 -295Q190 -299 200 -311Q211 -323 226 -338Q241 -352 256 -365Q272 -378 282 -384Q303 -398 326 -397Q348 -396 364 -383Q367 -380 378 -371Q388 -362 402 -351Q415 -340 425 -331L462 -298L445 -248Q432 -208 438 -178Q444 -148 457 -126Q462 -115 470 -109Q479 -103 493 -101Q501 -100 508 -95Q515 -90 515 -79Q515 -55 506 -44Q498 -34 488 -32Q455 -28 425 -39Q395 -50 371 -96Q367 -102 360 -118Q354 -135 353 -140Q349 -135 342 -128Q336 -120 330 -114Q259 -42 208 -20Q158 1 124 -21ZM179 -104Q186 -103 201 -112Q216 -120 241 -140Q275 -169 297 -188Q319 -207 340 -237L362 -273Q352 -296 344 -303Q336 -310 328 -310Q315 -310 297 -294Q279 -277 256 -246Q234 -214 206 -167Q193 -145 186 -124Q179 -104 179 -104Z"],"b":[444,"M229 -6Q209 -8 198 -16Q186 -25 180 -38Q172 -47 170 -52Q169 -57 170 -61Q175 -61 179 -62Q183 -62 184 -65Q184 -68 188 -69Q191 -70 195 -69Q214 -68 242 -82Q269 -96 302 -122Q335 -147 368 -177Q394 -211 404 -227Q415 -243 416 -252Q416 -260 411 -269Q407 -277 392 -277Q377 -277 346 -257Q303 -230 277 -207Q251 -184 229 -155Q221 -145 211 -134Q202 -122 195 -114Q189 -106 189 -106Q189 -102 178 -96Q166 -90 158 -90Q154 -92 148 -98Q141 -103 139 -112Q130 -119 124 -124Q118 -130 118 -143Q118 -151 120 -163Q123 -175 128 -194Q134 -220 141 -249Q148 -277 155 -297Q161 -318 164 -320Q164 -320 168 -329Q172 -338 172 -350Q174 -362 178 -371Q183 -380 183 -384Q187 -387 195 -408Q203 -429 215 -463Q215 -466 222 -482Q229 -499 239 -522Q249 -544 260 -568Q270 -593 277 -612Q289 -629 298 -646Q306 -664 313 -667Q318 -668 330 -663Q343 -658 356 -650Q369 -642 374 -634Q377 -629 378 -624Q378 -619 373 -608Q368 -596 356 -570Q344 -545 322 -499Q294 -439 278 -399Q263 -359 254 -330Q244 -301 234 -275L229 -253L255 -282Q265 -292 276 -301Q287 -310 300 -319Q308 -325 322 -332Q335 -338 348 -343Q361 -348 367 -349Q370 -350 388 -354Q405 -357 422 -357Q444 -357 460 -342Q477 -326 490 -304Q501 -283 498 -250Q495 -218 481 -195Q476 -191 471 -184Q466 -178 466 -174Q465 -167 448 -146Q431 -124 414 -105Q396 -86 370 -68Q344 -49 318 -34Q293 -20 275 -14Q267 -13 252 -10Q237 -8 229 -6Z"],"c":[364,"M221 4Q192 9 164 -1Q135 -11 116 -34Q98 -56 98 -88Q95 -118 104 -160Q112 -201 130 -243Q147 -285 170 -314Q190 -338 210 -358Q230 -378 246 -385Q260 -391 280 -394Q301 -398 309 -398Q325 -394 344 -385Q364 -376 364 -364Q364 -364 366 -362Q369 -359 369 -359Q375 -359 382 -344Q390 -330 394 -312Q398 -293 392 -282Q388 -263 376 -245Q365 -227 357 -227Q353 -227 350 -226Q346 -226 346 -221Q346 -216 336 -216Q325 -216 314 -220Q303 -224 300 -232Q300 -237 302 -245Q304 -253 308 -272Q314 -300 309 -310Q304 -319 284 -311Q259 -297 243 -278Q227 -260 214 -227Q202 -194 187 -135Q181 -112 186 -99Q190 -86 193 -85Q207 -81 224 -84Q240 -86 251 -92Q267 -100 280 -110Q292 -119 307 -130Q312 -133 316 -142Q320 -150 328 -154Q336 -166 348 -166Q361 -167 373 -167Q381 -165 390 -157Q399 -149 404 -142Q408 -134 402 -131Q398 -131 398 -128Q397 -126 397 -126Q399 -122 388 -108Q378 -94 362 -78Q346 -62 332 -50Q317 -39 311 -39Q301 -39 301 -33Q301 -31 286 -23Q272 -15 254 -7Q235 1 221 4Z"],"d":[402,"M374 19Q361 22 348 12Q336 3 331 -8Q325 -24 324 -38Q322 -53 321 -72L320 -106L279 -69Q245 -37 216 -24Q186 -10 162 -10Q151 -12 136 -24Q120 -37 108 -52Q95 -68 90 -78Q84 -92 86 -117Q89 -142 98 -172Q108 -202 122 -231Q137 -260 156 -281Q189 -331 238 -344Q287 -356 325 -335Q343 -326 351 -328Q359 -330 361 -341Q365 -357 370 -371Q375 -385 384 -413Q409 -489 428 -532Q446 -575 461 -607Q472 -630 483 -639Q494 -648 502 -647Q513 -647 530 -639Q546 -631 551 -617Q555 -608 554 -598Q554 -588 548 -577Q535 -553 518 -514Q500 -474 482 -427Q465 -380 450 -334Q435 -288 425 -253Q419 -231 416 -197Q412 -163 410 -128Q409 -92 410 -64Q411 -37 413 -29Q419 -9 413 1Q407 11 396 14Q385 18 374 19ZM209 -102Q223 -107 234 -114Q245 -121 260 -132Q290 -155 304 -172Q317 -189 325 -214Q330 -229 326 -240Q321 -251 310 -261Q299 -270 282 -268Q265 -267 243 -247Q219 -225 202 -196Q185 -167 174 -113Q172 -103 181 -99Q190 -95 209 -102Z"],"e":[334,"M293 -20Q263 -3 230 0Q196 2 167 -10Q138 -21 120 -44Q110 -57 101 -86Q92 -114 98 -163Q104 -209 126 -256Q149 -303 182 -339Q215 -375 254 -388Q268 -393 282 -396Q297 -398 321 -396Q344 -393 362 -384Q380 -376 388 -366Q404 -350 409 -335Q414 -320 413 -306Q408 -274 384 -237Q361 -200 319 -182Q302 -175 279 -173Q256 -171 216 -179Q192 -184 184 -174Q177 -164 178 -135Q180 -117 186 -104Q193 -90 211 -85Q234 -81 244 -84Q254 -88 269 -95Q277 -100 284 -106Q292 -112 300 -118Q307 -124 312 -127Q317 -131 322 -132Q327 -133 332 -133Q343 -132 353 -121Q363 -110 366 -100Q366 -92 356 -78Q346 -63 330 -48Q313 -32 293 -20ZM280 -243Q287 -246 300 -257Q314 -268 325 -280Q336 -293 336 -300Q336 -311 322 -319Q307 -327 284 -322Q276 -320 265 -311Q254 -302 243 -290Q232 -279 224 -268Q216 -258 213 -252Q217 -247 229 -244Q241 -241 256 -241Q270 -241 280 -243Z"],"f":[300,"M146 121Q140 125 119 112Q98 98 84 82Q77 74 75 65Q73 56 76 31Q80 20 80 10Q81 0 81 -4Q81 -10 84 -32Q88 -54 92 -78Q96 -103 99 -116Q99 -117 100 -123Q102 -129 103 -132Q105 -141 108 -154Q111 -167 114 -189Q122 -214 128 -238Q133 -263 133 -272Q133 -290 147 -298Q148 -303 153 -314Q158 -324 162 -331Q182 -388 195 -422Q208 -456 222 -481Q228 -498 236 -516Q243 -534 251 -544Q258 -558 276 -578Q293 -599 313 -618Q333 -637 345 -646Q367 -657 386 -664Q405 -671 426 -671Q445 -671 460 -662Q474 -654 503 -628Q513 -615 513 -603Q513 -591 508 -583Q501 -567 487 -544Q473 -520 460 -502Q447 -483 441 -482Q429 -475 416 -478Q403 -481 403 -496Q403 -503 404 -509Q404 -515 404 -515Q407 -528 412 -538Q416 -548 420 -555Q428 -568 424 -580Q421 -592 399 -590Q396 -588 388 -580Q379 -573 370 -563Q360 -554 353 -545Q346 -537 346 -534Q346 -534 340 -524Q335 -513 324 -500Q317 -490 312 -481Q307 -472 307 -467Q307 -463 306 -460Q305 -457 301 -457Q301 -457 298 -447Q294 -437 286 -423Q282 -413 278 -404Q273 -396 269 -392L268 -390Q268 -390 264 -379Q259 -367 254 -355Q249 -343 249 -341Q249 -337 261 -337Q273 -337 290 -340Q307 -344 323 -348Q337 -352 343 -352Q349 -352 362 -348Q370 -343 375 -330Q380 -318 382 -306Q385 -293 383 -287Q382 -283 361 -276Q339 -269 318 -265Q300 -261 278 -256Q255 -252 238 -248Q221 -243 220 -239Q216 -239 214 -234Q211 -228 211 -225Q211 -212 206 -204Q204 -198 200 -179Q195 -161 190 -140Q186 -118 182 -100Q179 -81 179 -75Q173 -68 172 -58Q171 -47 171 -39Q167 -31 166 -24Q165 -18 165 -14Q165 -13 165 -10Q165 -7 164 -4Q163 6 161 22Q160 39 160 55L157 84Q156 97 153 106Q151 116 146 121Z"],"g":[364,"M214 200Q186 211 156 196Q125 182 103 151Q99 145 91 130Q83 114 76 96Q68 78 64 65Q61 52 64 50Q68 39 82 37Q96 35 110 38Q124 42 126 48Q129 55 132 62Q135 70 140 76Q144 83 148 88Q159 105 172 112Q185 118 192 113Q209 100 218 82Q226 65 240 21Q251 -16 259 -43Q267 -70 276 -93Q279 -105 284 -114Q288 -122 292 -126H298Q276 -112 261 -98Q246 -84 220 -73Q214 -66 190 -64Q167 -63 145 -70Q131 -78 122 -86Q114 -95 108 -106Q103 -117 97 -132Q90 -147 95 -181Q100 -215 113 -249Q125 -274 148 -303Q171 -332 197 -356Q223 -379 244 -385Q252 -389 272 -394Q292 -400 310 -395Q327 -393 336 -388Q345 -382 365 -365Q378 -352 397 -332Q416 -311 421 -297Q428 -282 424 -264Q420 -247 410 -234Q401 -221 391 -208Q381 -195 376 -172Q371 -142 357 -104Q343 -67 335 -35L319 27Q294 112 264 150Q234 189 214 200ZM193 -144Q213 -145 228 -148Q242 -152 255 -164Q268 -177 285 -203Q302 -227 309 -247Q316 -267 314 -292Q313 -308 305 -313Q297 -318 284 -316Q265 -313 250 -300Q235 -288 215 -262Q200 -242 190 -214Q180 -184 182 -166Q183 -148 193 -144Z"],"h":[473,"M139 -38Q132 -37 124 -44Q115 -50 108 -55Q98 -67 94 -76Q90 -85 90 -96Q90 -107 92 -122Q97 -138 104 -165Q111 -192 121 -223Q123 -235 128 -252Q134 -268 140 -284Q146 -299 149 -307Q156 -332 164 -355Q171 -378 182 -408Q193 -438 209 -484Q231 -544 242 -574Q253 -604 258 -617Q263 -630 265 -638Q265 -646 276 -654Q288 -661 297 -661Q311 -660 324 -644Q337 -629 342 -608Q347 -586 335 -566Q319 -530 304 -486Q288 -441 273 -397Q258 -353 243 -316Q242 -311 236 -299Q231 -287 227 -279Q223 -271 220 -264Q216 -257 216 -257Q215 -251 212 -240Q209 -229 206 -221Q205 -216 203 -208Q201 -200 200 -192Q205 -198 214 -206Q223 -215 237 -228Q253 -242 265 -252Q277 -262 289 -270Q300 -278 310 -285Q319 -292 319 -292Q321 -295 324 -299Q326 -303 329 -304Q331 -306 336 -310Q341 -313 346 -317Q355 -323 365 -327Q375 -331 386 -333Q397 -335 407 -335Q419 -335 432 -326Q445 -316 456 -299Q466 -286 468 -268Q471 -251 469 -222Q469 -214 464 -192Q460 -170 458 -159L449 -125H457Q468 -129 478 -126Q489 -123 489 -123Q494 -120 498 -116Q503 -112 507 -110Q513 -102 505 -87Q497 -72 487 -66Q463 -50 444 -46Q426 -42 406 -53Q387 -66 380 -84Q374 -102 375 -133Q379 -177 380 -196Q381 -216 370 -216Q358 -216 338 -204Q317 -193 292 -174Q267 -154 242 -130Q218 -107 199 -83Q187 -68 173 -54Q159 -39 139 -38Z"],"i":[196,"M103 -17Q95 -25 92 -41Q88 -57 89 -72Q90 -88 94 -96Q94 -104 96 -108Q99 -113 98 -117Q97 -121 100 -131Q103 -141 106 -150Q113 -166 122 -192Q131 -217 140 -244Q149 -270 155 -290Q161 -309 162 -313Q162 -325 178 -326Q190 -330 207 -316Q224 -302 234 -286Q242 -278 240 -265Q238 -252 227 -228Q223 -220 218 -202Q212 -183 210 -171Q206 -163 200 -148Q195 -134 191 -121Q189 -116 187 -102Q185 -89 182 -75Q179 -61 174 -53Q165 -12 142 -5Q120 2 103 -17ZM211 -418Q200 -426 194 -438Q189 -449 188 -458Q188 -467 190 -469Q200 -480 208 -498Q215 -516 224 -531Q226 -534 230 -540Q233 -545 237 -546Q249 -554 270 -545Q292 -536 302 -520Q311 -501 308 -481Q304 -461 286 -439Q271 -419 248 -414Q225 -408 211 -418Z"],"j":[213,"M65 209Q43 231 8 230Q-26 230 -50 205Q-73 173 -82 144Q-90 114 -85 95Q-80 76 -64 76Q-59 76 -50 80Q-40 84 -32 90Q-24 96 -24 104Q-24 119 -21 130Q-18 141 -5 143Q6 147 18 140Q29 134 40 116Q50 103 62 75Q74 47 86 16Q98 -14 105 -33Q117 -74 124 -116Q131 -159 141 -208Q145 -235 150 -254Q156 -274 156 -278Q156 -282 157 -294Q158 -307 163 -317Q163 -332 168 -351Q172 -370 172 -374Q175 -377 184 -374Q194 -372 204 -367Q215 -362 220 -357Q228 -349 234 -340Q240 -330 242 -310Q245 -289 240 -247Q240 -241 237 -222Q234 -204 229 -181Q224 -158 219 -136Q214 -115 211 -101Q207 -86 202 -68Q197 -50 196 -43Q195 -37 189 -20Q183 -2 176 15Q170 32 169 39Q168 43 164 58Q159 73 145 104Q140 116 124 138Q108 161 91 182Q74 202 65 209ZM213 -476Q202 -489 206 -518Q211 -547 227 -568Q240 -583 262 -585Q285 -587 298 -576Q309 -559 312 -542Q315 -525 304 -509Q279 -481 252 -473Q226 -465 213 -476Z"],"k":[374,"M128 3Q120 0 107 -14Q94 -27 84 -44Q74 -60 74 -71Q79 -82 88 -110Q96 -138 107 -173Q115 -184 120 -198Q124 -213 128 -225Q136 -243 146 -266Q156 -289 166 -313Q175 -337 183 -355Q197 -385 206 -408Q216 -430 226 -452Q235 -474 246 -501Q261 -532 274 -562Q286 -593 296 -617Q305 -641 307 -651Q306 -659 309 -662Q312 -666 317 -667Q322 -670 333 -671Q344 -672 348 -672Q360 -670 372 -652Q385 -635 385 -623Q385 -607 370 -564Q354 -520 325 -461Q290 -386 272 -345Q255 -304 249 -287Q243 -270 244 -265Q244 -265 252 -268Q260 -271 276 -282Q287 -289 301 -300Q315 -311 328 -320Q342 -329 350 -331Q355 -335 364 -341Q373 -347 381 -352Q400 -366 411 -361Q422 -356 431 -344Q442 -331 440 -316Q437 -302 408 -279Q386 -263 361 -248Q336 -234 316 -223Q295 -212 286 -205Q286 -205 295 -192Q304 -179 312 -167Q320 -151 332 -126Q344 -102 350 -92Q361 -76 372 -71Q384 -66 407 -74Q422 -78 432 -74Q443 -69 450 -59Q454 -51 454 -43Q454 -35 441 -24Q413 -5 386 8Q360 22 336 6Q315 -10 296 -30Q278 -51 255 -81Q255 -85 249 -98Q243 -111 241 -113Q237 -121 232 -128Q228 -134 228 -134Q225 -145 220 -152Q216 -159 209 -160Q205 -157 200 -150Q195 -143 190 -133Q184 -118 178 -104Q172 -89 168 -72Q164 -56 163 -33Q164 -22 154 -10Q144 3 128 3Z"],"l":[178,"M142 11Q123 16 108 0Q93 -15 87 -45Q81 -75 89 -112Q94 -124 97 -136Q100 -147 100 -154Q102 -164 108 -184Q114 -203 121 -224Q128 -245 134 -262Q141 -278 143 -282Q147 -282 150 -289Q153 -296 153 -303Q153 -311 156 -321Q160 -331 164 -335Q164 -340 166 -346Q169 -353 169 -357Q169 -361 172 -365Q174 -369 174 -373Q181 -386 192 -414Q204 -443 218 -478Q231 -513 243 -547Q255 -581 262 -604Q270 -628 270 -633Q270 -641 276 -648Q282 -655 290 -655Q293 -658 304 -660Q315 -661 319 -661Q319 -661 323 -657Q327 -653 335 -645Q343 -638 350 -629Q358 -620 358 -608Q358 -595 354 -583Q351 -571 342 -550Q333 -530 314 -490Q306 -470 297 -452Q288 -435 288 -431Q288 -427 284 -419Q281 -411 277 -399Q273 -391 266 -376Q259 -360 252 -342Q244 -325 239 -312Q234 -300 234 -298Q234 -294 234 -290Q233 -286 229 -282Q225 -282 224 -276Q224 -271 224 -271Q224 -261 208 -218Q192 -163 178 -117Q165 -71 165 -43Q165 -19 158 -6Q150 7 142 11Z"],"m":[569,"M566 -24Q559 -26 544 -37Q529 -48 518 -70Q506 -92 507 -127Q508 -157 512 -170Q515 -182 508 -183Q503 -184 488 -174Q473 -164 449 -142Q425 -120 391 -84Q379 -74 364 -60Q350 -45 336 -38Q321 -31 310 -41L300 -50Q293 -56 288 -66Q283 -76 285 -83L313 -161Q325 -187 330 -199Q334 -211 334 -214Q333 -217 328 -216Q322 -215 311 -206Q300 -196 296 -190Q292 -190 286 -182Q279 -174 273 -168Q267 -162 252 -146Q237 -129 220 -111Q207 -99 190 -79Q173 -59 160 -43Q147 -27 144 -27Q126 -28 112 -39Q97 -50 92 -66Q86 -77 91 -106Q96 -136 110 -201Q114 -216 118 -227Q121 -238 125 -249Q129 -260 134 -274Q140 -288 149 -308Q154 -322 153 -334Q152 -347 151 -355Q151 -370 160 -379Q170 -388 182 -392Q194 -395 201 -393Q229 -390 239 -373Q249 -356 250 -340Q251 -325 246 -313Q241 -301 238 -293L227 -266Q217 -243 212 -232Q208 -222 208 -218Q207 -215 207 -212Q208 -209 216 -215Q224 -221 236 -232Q247 -242 257 -250Q275 -265 296 -280Q316 -296 336 -308Q356 -320 369 -324Q386 -321 400 -307Q415 -293 419 -283Q424 -268 420 -256Q417 -244 415 -234Q414 -230 411 -219Q408 -208 405 -198Q402 -189 402 -189Q402 -189 408 -195Q414 -201 424 -210Q434 -218 444 -225Q494 -263 524 -274Q553 -284 574 -256Q586 -245 590 -226Q593 -207 593 -175Q594 -162 596 -146Q597 -130 600 -118Q602 -106 604 -103Q607 -99 615 -96Q623 -92 630 -90Q644 -83 646 -64Q647 -46 631 -36Q616 -27 600 -25Q583 -23 566 -24Z"],"n":[459,"M443 -24Q421 -26 406 -34Q392 -41 383 -64Q379 -80 380 -98Q380 -115 382 -132Q384 -148 384 -160Q384 -162 384 -168Q384 -174 384 -179Q382 -194 376 -198Q371 -201 358 -196Q337 -186 312 -170Q288 -153 262 -132Q235 -110 207 -86Q185 -62 174 -47Q164 -32 153 -32Q145 -28 136 -34Q127 -40 117 -48Q110 -56 100 -68Q91 -81 89 -85Q89 -101 92 -114Q94 -127 100 -141Q105 -155 113 -173Q117 -180 120 -188Q124 -195 129 -204Q133 -218 140 -236Q148 -254 155 -270Q166 -296 172 -315Q178 -334 182 -356Q181 -358 183 -362Q185 -366 189 -367H190H191Q198 -372 218 -368Q237 -365 247 -357Q268 -339 267 -310Q266 -281 237 -234Q230 -218 222 -204Q215 -191 215 -186Q215 -186 223 -192Q231 -198 242 -206Q253 -215 261 -220Q266 -225 283 -238Q300 -252 320 -267Q340 -282 352 -290Q363 -298 380 -306Q397 -315 401 -315Q411 -315 426 -308Q440 -301 452 -292Q465 -282 467 -274Q467 -270 466 -264Q465 -257 465 -252Q464 -236 464 -214Q465 -191 465 -168Q465 -146 461 -128Q461 -128 462 -126Q463 -125 464 -122Q463 -121 464 -118Q464 -116 464 -116Q466 -109 468 -102Q471 -95 475 -86Q479 -78 484 -65Q483 -52 470 -40Q456 -27 443 -24Z"],"o":[362,"M168 -7Q155 -7 148 -12Q140 -17 129 -26Q110 -46 98 -69Q87 -92 90 -109Q93 -117 92 -124Q92 -132 92 -132Q87 -137 89 -138Q91 -140 93 -144Q99 -144 97 -155Q95 -163 104 -190Q112 -216 127 -240Q133 -250 145 -266Q157 -283 172 -300Q186 -316 198 -326Q223 -347 244 -360Q266 -373 288 -378Q310 -383 334 -383Q357 -383 372 -367Q395 -357 404 -340Q414 -323 417 -296Q420 -266 411 -222Q402 -179 362 -122Q337 -86 313 -66Q289 -46 260 -29Q239 -15 215 -12Q191 -9 168 -7ZM270 -129Q292 -148 302 -171Q311 -194 322 -225Q326 -231 328 -245Q329 -259 328 -272Q327 -286 321 -288Q312 -295 303 -292Q294 -288 280 -278Q250 -253 224 -220Q199 -188 189 -141Q186 -116 194 -104Q203 -91 222 -96Q242 -102 270 -129Z"],"p":[378,"M61 233Q57 233 50 234Q42 234 37 225Q33 220 25 206Q17 191 22 165Q27 148 30 132Q33 115 33 107Q33 103 36 92Q38 80 38 75Q43 67 46 53Q49 39 49 28Q49 16 61 6Q61 -2 64 -14Q68 -26 68 -30Q71 -44 82 -80Q92 -115 108 -160Q123 -205 138 -248Q153 -291 165 -321Q177 -349 185 -373Q193 -397 193 -407Q193 -411 195 -414Q197 -416 204 -424Q214 -434 230 -432Q247 -429 258 -421Q266 -408 270 -398Q273 -387 269 -365Q269 -350 262 -338Q255 -325 250 -318Q244 -310 246 -311Q290 -338 326 -340Q361 -343 386 -328Q410 -314 423 -289Q436 -264 436 -235Q436 -223 428 -203Q420 -183 410 -166Q400 -148 394 -142Q390 -142 386 -136Q382 -129 378 -121Q370 -111 352 -98Q333 -86 314 -78Q295 -71 287 -74Q287 -74 284 -72Q282 -70 282 -65Q282 -63 268 -57Q254 -51 235 -46Q216 -41 200 -41Q179 -41 170 -49Q168 -47 166 -43Q163 -39 163 -36Q163 -30 158 -17Q154 -4 148 6Q142 17 137 17Q137 17 135 20Q133 23 137 28Q137 28 136 40Q136 51 131 59Q131 67 128 83Q125 99 121 107Q121 119 118 130Q114 142 110 142Q106 143 105 154Q104 166 104 171Q103 196 88 214Q73 233 61 233ZM189 -117Q197 -117 218 -124Q239 -131 262 -142Q285 -152 298 -163Q324 -186 338 -208Q353 -230 336 -257Q328 -271 310 -268Q293 -266 272 -252Q251 -238 229 -217Q217 -204 207 -187Q197 -170 190 -154Q184 -138 183 -128Q182 -117 189 -117Z"],"q":[377,"M246 231Q234 223 222 213Q210 203 205 183Q200 156 204 115Q208 74 220 24Q233 -26 251 -79Q256 -87 262 -101Q268 -115 267 -119Q221 -95 198 -84Q175 -72 158 -72Q145 -72 129 -88Q113 -103 102 -124Q90 -145 90 -161Q90 -177 106 -210Q121 -242 141 -270Q149 -284 171 -304Q193 -323 218 -341Q242 -359 255 -367Q263 -372 271 -376Q279 -379 287 -383Q295 -388 302 -391Q309 -394 313 -394Q329 -398 350 -396Q372 -395 384 -391Q396 -383 414 -360Q431 -337 435 -317Q435 -307 434 -298Q433 -290 428 -276Q422 -262 408 -232Q392 -208 382 -185Q371 -162 371 -158Q366 -145 356 -124Q347 -103 339 -86Q331 -68 328 -62Q326 -52 319 -26Q312 -1 304 30Q297 60 291 87Q283 131 283 164Q283 197 291 209Q295 221 278 230Q262 239 246 231ZM170 -151Q202 -147 231 -166Q260 -186 291 -216Q308 -232 322 -252Q336 -273 343 -290Q350 -308 347 -316Q343 -324 322 -314Q302 -305 270 -281Q234 -253 214 -230Q193 -208 181 -180Z"],"r":[360,"M119 -27Q110 -34 100 -45Q89 -56 92 -76Q95 -104 100 -126Q105 -147 112 -175Q114 -187 122 -216Q131 -245 143 -279Q155 -313 168 -344Q181 -374 191 -389Q202 -399 224 -399Q245 -399 253 -391Q264 -382 260 -360Q256 -337 232 -290Q227 -278 220 -264Q212 -251 209 -242Q206 -234 211 -235Q217 -246 233 -260Q249 -275 267 -289Q285 -303 301 -314Q317 -325 323 -328Q331 -333 342 -336Q352 -340 356 -342Q379 -353 406 -350Q434 -348 440 -333Q441 -325 446 -321Q452 -317 452 -317Q456 -317 456 -314Q457 -311 457 -311Q457 -304 444 -291Q430 -278 414 -277Q401 -276 391 -272Q381 -268 367 -262Q329 -240 298 -223Q268 -206 236 -171Q229 -163 221 -156Q213 -149 205 -136Q200 -131 195 -114Q190 -97 186 -82Q183 -66 183 -63Q183 -63 180 -54Q177 -44 170 -35Q158 -19 146 -15Q135 -11 119 -27Z"],"s":[350,"M153 6Q119 -8 104 -24Q88 -39 91 -51Q93 -57 98 -62Q103 -67 120 -66Q138 -66 175 -57Q186 -57 197 -58Q208 -59 218 -61Q227 -63 233 -66Q238 -68 236 -72Q234 -75 229 -79Q225 -84 220 -86Q215 -87 211 -87Q209 -92 202 -97Q196 -102 187 -108Q165 -126 147 -140Q129 -154 133 -161Q133 -165 133 -166Q133 -166 133 -166Q126 -166 120 -186Q114 -205 114 -221Q114 -241 122 -261Q131 -281 144 -299Q158 -317 172 -331Q191 -349 212 -366Q234 -384 260 -398Q285 -412 316 -420Q330 -423 348 -423Q366 -423 374 -418Q382 -423 394 -416Q406 -408 418 -395Q430 -382 436 -369Q436 -357 436 -340Q435 -322 433 -309Q431 -296 424 -296Q424 -296 422 -296Q419 -295 419 -290Q419 -280 404 -267Q385 -254 368 -246Q351 -238 342 -245Q336 -249 331 -253Q326 -257 322 -263Q322 -263 320 -268Q317 -272 317 -276Q317 -280 320 -284Q323 -287 323 -287Q337 -300 344 -311Q352 -322 355 -330Q358 -339 358 -344Q358 -350 356 -352Q353 -353 345 -353Q340 -353 324 -345Q307 -337 289 -326Q271 -314 261 -305Q257 -298 256 -296Q254 -294 250 -294Q250 -298 245 -293Q240 -288 233 -279Q226 -270 219 -260Q212 -250 208 -244Q207 -235 204 -228Q200 -220 201 -212Q202 -202 211 -193Q220 -184 237 -170Q272 -144 290 -129Q307 -114 314 -105Q321 -96 323 -87Q340 -56 327 -34Q314 -11 287 1Q277 6 252 10Q227 15 200 14Q172 14 153 6Z"],"t":[331,"M171 1Q160 -1 147 -12Q134 -24 124 -38Q113 -53 110 -63Q110 -65 108 -68Q105 -71 105 -71Q101 -74 100 -98Q100 -121 103 -150Q106 -179 110 -196Q115 -212 125 -240Q135 -267 142 -289L169 -347L129 -358Q122 -360 118 -366Q113 -372 113 -376Q113 -384 122 -399Q131 -414 135 -414Q140 -413 154 -413Q167 -413 180 -414Q193 -415 196 -416Q200 -418 204 -422Q208 -425 210 -432Q215 -443 219 -449Q223 -455 230 -467Q237 -480 242 -489Q246 -498 256 -514Q261 -521 267 -531Q273 -541 282 -548Q291 -556 312 -560Q332 -563 347 -550Q355 -540 356 -531Q357 -522 348 -508Q340 -491 330 -478Q319 -464 310 -447Q294 -425 304 -422Q314 -419 360 -426Q389 -431 402 -420Q415 -409 417 -392Q420 -368 412 -363Q404 -358 366 -358Q342 -354 325 -354Q308 -353 300 -353Q287 -352 283 -352Q279 -352 271 -350Q263 -348 260 -344Q256 -339 252 -331Q248 -327 240 -310Q232 -293 220 -273Q206 -231 196 -192Q187 -154 180 -116Q177 -97 182 -88Q186 -80 207 -78Q218 -77 239 -78Q260 -80 274 -84Q285 -89 297 -94Q309 -100 319 -106Q328 -111 337 -116Q346 -122 346 -122Q351 -130 360 -120Q370 -109 374 -97Q374 -85 369 -68Q364 -52 332 -34Q287 -6 242 0Q197 6 171 1Z"],"u":[370,"M336 -2Q326 -12 320 -30Q314 -47 308 -70Q306 -78 306 -88Q307 -98 306 -104Q303 -97 296 -86Q290 -75 284 -70Q280 -66 266 -54Q252 -43 238 -36Q205 -15 180 -16Q154 -18 135 -42Q119 -55 109 -75Q99 -95 105 -123Q107 -158 115 -192Q123 -225 148 -281Q169 -322 180 -345Q191 -368 194 -372Q209 -377 231 -372Q253 -366 255 -352Q261 -342 255 -314Q249 -287 231 -252Q217 -218 204 -186Q192 -154 190 -132Q187 -110 201 -105Q210 -100 228 -106Q245 -112 269 -142Q293 -172 320 -237Q328 -257 332 -272Q336 -288 337 -307Q335 -319 344 -332Q352 -345 364 -352Q368 -357 375 -362Q382 -366 384 -361L400 -362Q404 -363 409 -354Q414 -345 419 -341Q430 -332 429 -302Q428 -272 405 -218Q386 -177 380 -156Q373 -135 372 -115Q372 -97 375 -84Q378 -72 393 -59Q404 -52 406 -36Q407 -19 406 -7Q404 2 390 6Q377 9 362 7Q346 5 336 -2Z"],"v":[331,"M179 -53Q172 -59 160 -89Q149 -119 138 -159Q128 -199 122 -233Q118 -253 114 -267Q109 -281 106 -290Q101 -308 110 -328Q118 -348 130 -355Q135 -358 148 -360Q162 -361 166 -360Q178 -356 188 -324Q198 -291 206 -238Q210 -207 212 -192Q215 -178 215 -174Q219 -166 220 -154Q222 -143 230 -151Q234 -155 242 -165Q251 -175 263 -191Q284 -219 296 -238Q309 -256 325 -276Q332 -286 344 -298Q356 -310 368 -320Q380 -331 388 -333Q412 -337 418 -316Q423 -294 403 -266Q395 -254 390 -244Q386 -233 382 -229Q374 -213 357 -188Q340 -164 324 -144Q308 -123 302 -117Q298 -113 284 -102Q271 -91 259 -74Q235 -51 213 -46Q191 -41 179 -53Z"],"w":[517,"M170 -30Q155 -30 140 -52Q125 -75 116 -108Q108 -141 110 -173Q110 -205 114 -224Q117 -244 121 -263Q124 -269 124 -273Q125 -277 126 -286Q128 -295 133 -316Q137 -333 142 -344Q146 -355 149 -359Q161 -375 176 -378Q191 -382 204 -375Q216 -368 218 -354Q224 -349 224 -332Q225 -314 222 -296Q219 -277 213 -269Q211 -264 208 -243Q206 -222 204 -199Q201 -176 198 -162Q195 -144 200 -140Q206 -135 220 -148Q235 -162 259 -197Q279 -227 288 -244Q298 -261 304 -275Q309 -289 316 -308Q321 -324 326 -334Q330 -344 334 -348Q345 -364 364 -362Q382 -359 394 -351Q406 -339 408 -318Q411 -298 399 -274Q391 -258 384 -236Q376 -214 372 -192Q367 -170 367 -154Q367 -134 372 -130Q378 -127 386 -127Q398 -127 409 -136Q420 -144 441 -166Q450 -175 463 -193Q476 -211 488 -231Q501 -251 510 -266Q518 -282 518 -286Q518 -292 527 -303Q533 -311 536 -316Q540 -320 550 -325Q558 -329 568 -326Q578 -324 585 -316Q590 -312 592 -296Q595 -281 595 -269Q592 -258 586 -238Q580 -219 574 -201Q567 -184 562 -178Q558 -174 548 -164Q538 -153 530 -141Q505 -111 494 -102Q483 -93 475 -85Q454 -64 427 -52Q400 -39 376 -38Q352 -36 338 -46Q307 -62 307 -100Q307 -108 304 -114Q302 -121 302 -121Q298 -121 292 -119Q285 -117 278 -105Q269 -88 248 -70Q226 -53 204 -42Q182 -30 170 -30Z"],"x":[343,"M391 12Q387 12 380 11Q374 10 370 6Q366 6 356 3Q346 0 338 -4Q328 -8 311 -20Q294 -33 277 -48Q260 -63 248 -76Q237 -89 237 -95Q237 -100 232 -100Q232 -100 229 -104Q226 -107 226 -111Q226 -121 216 -121Q216 -121 202 -107Q189 -93 169 -73Q141 -45 128 -32Q114 -20 106 -20Q98 -20 86 -28Q73 -35 64 -48Q54 -61 54 -79Q54 -79 74 -102Q95 -125 123 -149L174 -201L163 -239Q156 -255 148 -272Q141 -290 137 -302Q125 -319 124 -324Q124 -328 132 -340Q140 -348 158 -356Q177 -365 189 -357Q195 -357 205 -340Q215 -324 224 -304Q232 -285 232 -277Q232 -261 238 -260Q245 -259 269 -275Q281 -286 288 -294Q295 -301 295 -301Q298 -304 313 -316Q328 -328 344 -341Q360 -354 365 -356Q373 -362 385 -356Q397 -351 406 -340Q416 -330 416 -319Q416 -307 409 -292Q402 -278 382 -267Q364 -254 355 -246Q345 -238 335 -228Q325 -219 303 -200L277 -179L293 -152Q297 -145 304 -136Q312 -127 319 -123Q325 -115 340 -102Q355 -90 369 -80Q383 -70 385 -70Q389 -70 394 -67Q399 -64 406 -60Q414 -52 413 -34Q412 -17 406 -2Q399 12 391 12Z"],"y":[341,"M86 208Q50 215 17 210Q-16 206 -38 193Q-61 180 -66 164Q-72 141 -60 130Q-48 119 -32 117Q-15 115 -10 121Q-2 126 16 136Q33 146 59 141Q82 136 100 119Q118 102 132 83Q140 71 159 40Q178 9 198 -28Q219 -66 233 -98Q236 -106 240 -117Q244 -128 250 -135Q256 -147 260 -158Q265 -168 266 -172Q267 -177 275 -192Q283 -207 290 -222Q295 -237 305 -266Q315 -295 325 -313Q337 -336 344 -350Q352 -365 361 -368Q370 -375 378 -375Q386 -375 397 -369Q409 -357 416 -346Q424 -334 422 -318Q421 -301 406 -273Q398 -249 388 -230Q379 -210 374 -204Q369 -192 362 -178Q356 -163 351 -151Q333 -111 320 -86Q307 -61 297 -40Q287 -19 276 9Q253 46 232 80Q210 113 186 142Q176 151 158 166Q139 180 120 192Q100 205 86 208ZM211 -18Q196 -20 178 -38Q161 -56 150 -76Q138 -96 140 -104Q140 -109 140 -112Q140 -115 140 -115Q134 -115 130 -132Q127 -150 126 -177Q124 -204 124 -233Q125 -262 127 -286Q131 -303 131 -324Q131 -344 132 -356Q131 -372 138 -382Q146 -392 150 -395Q187 -411 204 -378Q221 -345 216 -273Q214 -233 214 -196Q214 -160 221 -134Q228 -108 245 -97Q252 -93 250 -80Q248 -67 241 -52Q234 -38 226 -28Q217 -17 211 -18Z"],"z":[315,"M140 -11Q102 -6 82 -6Q63 -6 53 -10Q43 -14 34 -21Q24 -28 23 -50Q22 -71 53 -103Q72 -126 92 -146Q112 -167 128 -180Q135 -186 142 -191Q150 -196 168 -208Q186 -221 225 -247Q244 -262 252 -268Q260 -274 265 -278Q270 -281 278 -287Q271 -288 252 -290Q232 -293 212 -291Q184 -291 180 -292Q176 -292 168 -294H153Q148 -294 136 -301Q123 -308 112 -318Q102 -327 101 -334Q101 -334 107 -341Q113 -348 117 -352Q125 -357 130 -360Q134 -363 138 -359Q138 -359 163 -360Q188 -362 212 -363Q270 -362 298 -360Q325 -357 338 -351Q352 -345 365 -333Q381 -317 386 -297Q391 -277 380 -265Q376 -261 372 -256Q369 -252 366 -252Q366 -252 352 -243Q338 -234 318 -221Q299 -208 280 -197Q262 -186 258 -181Q251 -177 241 -170Q231 -164 227 -160Q224 -156 214 -146Q203 -136 191 -128Q182 -120 172 -110Q161 -100 154 -92Q146 -85 146 -85Q146 -85 161 -88Q176 -90 201 -92Q226 -95 255 -93Q302 -94 330 -96Q357 -97 372 -96Q386 -96 394 -92Q401 -90 404 -78Q408 -66 409 -54Q410 -42 408 -39Q404 -39 377 -36Q350 -34 315 -32Q269 -28 226 -22Q183 -16 140 -11Z"],"{":[330,"M176 142Q167 128 167 134Q167 134 156 124Q145 113 140 106Q132 95 130 84Q129 74 130 58Q130 48 130 39Q130 30 130 30Q135 25 136 18Q137 11 138 4Q140 -4 148 -29Q157 -54 167 -82Q177 -111 185 -127Q196 -148 202 -170Q209 -191 209 -201Q209 -217 196 -228Q182 -239 159 -243Q129 -243 139 -272Q143 -284 156 -291Q168 -298 181 -294Q196 -294 216 -309Q235 -324 252 -349Q270 -374 279 -404Q291 -436 297 -466Q303 -497 307 -546Q310 -585 319 -613Q328 -641 344 -664Q360 -688 384 -711Q398 -729 417 -737Q436 -745 447 -751Q467 -759 490 -759Q514 -759 521 -754Q526 -752 532 -739Q537 -726 540 -714Q544 -701 541 -699Q536 -699 524 -696Q513 -694 498 -694Q479 -690 466 -681Q453 -672 433 -655Q417 -634 412 -625Q407 -616 405 -597Q398 -579 395 -568Q392 -557 390 -542Q388 -527 385 -498Q382 -468 380 -451Q378 -434 374 -419Q370 -404 360 -381Q347 -344 330 -317Q314 -290 291 -270Q274 -260 272 -256Q271 -252 280 -241Q280 -237 285 -228Q290 -218 290 -208Q297 -192 291 -168Q285 -145 261 -92Q254 -77 248 -61Q242 -45 242 -37Q237 -30 232 -13Q227 4 223 18Q219 39 216 50Q213 60 213 63Q213 82 258 75Q275 70 281 74Q287 79 294 88Q305 98 300 114Q296 129 274 136Q259 144 238 147Q218 150 201 148Q184 147 176 142Z"],"|":[330,"M150 148Q131 153 116 138Q101 123 95 94Q89 65 97 28Q102 16 105 4Q108 -7 108 -14Q110 -22 118 -50Q126 -77 138 -113Q149 -149 160 -184Q172 -220 180 -244Q189 -269 191 -272Q195 -272 198 -279Q201 -286 201 -293Q201 -301 204 -311Q208 -321 212 -325Q212 -330 214 -336Q217 -343 217 -347Q217 -351 220 -355Q222 -359 222 -363Q228 -374 240 -404Q253 -435 270 -476Q286 -518 303 -562Q320 -607 335 -647Q350 -687 359 -713Q368 -739 368 -743Q368 -751 380 -760Q391 -768 399 -768Q402 -771 406 -772Q411 -773 415 -773Q415 -773 419 -769Q423 -765 431 -757Q439 -750 448 -736Q457 -723 457 -711Q457 -698 454 -688Q451 -678 442 -659Q433 -640 414 -600Q411 -592 402 -572Q393 -552 382 -527Q372 -502 362 -478Q351 -455 344 -439Q338 -423 338 -421Q338 -417 334 -409Q331 -401 327 -389Q323 -381 316 -366Q309 -350 302 -332Q294 -315 289 -302Q284 -290 284 -288Q284 -284 284 -280Q283 -276 279 -272Q275 -272 274 -266Q274 -261 274 -261Q274 -251 258 -208Q251 -186 241 -151Q231 -116 220 -77Q208 -37 198 0Q188 38 182 66Q175 94 175 105Q175 129 166 136Q158 144 150 148Z"],"}":[330,"M141 126Q114 127 92 112Q70 98 70 87Q70 82 73 79Q76 76 76 76Q81 80 86 80Q91 80 91 76Q91 76 101 70Q111 63 128 56Q157 51 170 46Q182 40 186 28Q191 16 196 -9Q199 -21 202 -32Q204 -42 204 -46Q204 -49 206 -78Q207 -108 205 -147Q203 -191 202 -212Q202 -232 204 -242Q207 -251 212 -261Q220 -269 222 -276Q223 -284 221 -294Q213 -314 215 -330Q217 -347 225 -353Q242 -372 252 -383Q262 -394 270 -406Q277 -417 286 -435Q312 -476 331 -516Q350 -557 357 -587Q357 -591 357 -594Q357 -597 357 -597Q361 -606 360 -616Q359 -625 348 -640Q340 -656 328 -664Q316 -672 290 -679Q274 -682 272 -697Q270 -712 279 -722Q283 -730 296 -736Q308 -741 320 -742Q333 -744 337 -739Q345 -731 352 -731Q355 -731 370 -720Q384 -708 400 -693Q416 -678 421 -668Q425 -665 428 -648Q432 -631 433 -619Q436 -607 436 -598Q437 -590 434 -580Q432 -569 425 -549Q411 -503 400 -472Q388 -442 383 -437Q379 -434 376 -433Q372 -432 372 -428Q372 -424 363 -408Q354 -391 342 -374Q331 -356 322 -347Q318 -343 314 -336Q311 -328 311 -328Q311 -328 310 -328Q309 -327 304 -324Q297 -320 297 -312Q297 -305 304 -289Q306 -280 310 -273Q314 -266 318 -258Q318 -244 313 -244Q300 -237 294 -224Q287 -211 286 -188Q285 -165 286 -127Q287 -106 286 -82Q285 -58 284 -40Q282 -21 279 -15Q272 15 266 35Q261 55 256 55Q256 55 254 56Q252 56 253 59Q253 73 236 88Q218 103 192 114Q166 125 141 126Z"],"~":[446,"M361 -187Q336 -187 318 -195Q300 -203 279 -216Q262 -227 245 -240Q228 -253 214 -253Q200 -253 192 -244Q183 -236 174 -227Q166 -218 153 -216Q152 -212 147 -206Q142 -199 138 -199Q118 -199 108 -212Q97 -226 97 -236Q97 -241 106 -256Q114 -271 134 -289Q153 -307 185 -320Q216 -325 236 -322Q256 -319 269 -309Q292 -292 312 -280Q333 -268 351 -268Q362 -268 376 -274Q389 -279 404 -286L430 -297Q435 -299 440 -300Q444 -301 448 -302Q459 -305 468 -305Q479 -305 490 -294Q500 -284 500 -271Q500 -265 497 -258Q494 -250 483 -239L462 -227Q437 -217 420 -209Q402 -201 391 -196Q370 -187 361 -187Z"]," ":[242,""],"¡":[210,"M26 234Q26 234 17 230Q8 226 1 218Q-6 210 -8 198Q-9 186 -9 174Q-7 154 6 130Q18 106 34 78Q44 59 54 42Q63 25 63 21Q63 17 67 9Q71 1 76 -11Q82 -21 88 -35Q94 -49 98 -61Q101 -73 101 -75Q103 -79 104 -83Q105 -87 109 -91Q113 -91 114 -96Q114 -102 114 -102Q114 -106 118 -120Q123 -135 133 -155Q152 -208 160 -240Q169 -271 170 -293Q172 -317 182 -326Q191 -334 198 -338Q227 -343 242 -314Q258 -285 240 -214Q234 -202 230 -191Q226 -180 226 -172Q223 -159 216 -142Q209 -124 202 -109Q195 -94 192 -88Q188 -88 184 -82Q179 -75 179 -67Q179 -59 176 -49Q173 -39 168 -35Q168 -31 164 -25Q160 -19 160 -14Q160 -10 158 -8Q155 -5 155 0Q146 16 132 48Q117 79 102 114Q88 149 78 176Q68 203 68 209Q67 217 62 224Q58 231 50 230Q46 233 38 234Q30 234 26 234ZM236 -400Q203 -421 207 -447Q211 -472 251 -492Q272 -500 286 -500Q301 -499 317 -487Q337 -467 330 -446Q324 -426 295 -406Q275 -394 266 -394Q256 -393 236 -400Z"],"¢":[450,"M214 54Q186 60 184 28Q181 -4 197 -59Q206 -72 210 -84Q213 -96 214 -103Q217 -113 230 -140Q243 -166 258 -196Q274 -227 286 -250Q299 -274 302 -278Q306 -278 311 -285Q316 -292 317 -299Q317 -307 320 -317Q324 -327 329 -330Q329 -335 334 -341Q338 -347 338 -351Q339 -354 342 -356Q344 -359 344 -363Q351 -374 364 -400Q378 -426 396 -460Q413 -495 431 -532Q449 -568 464 -600Q480 -633 490 -654Q499 -676 499 -680Q505 -696 519 -693Q525 -699 535 -695Q535 -695 538 -692Q542 -688 549 -681Q554 -672 556 -662Q557 -653 556 -642Q554 -629 549 -620Q544 -610 533 -592Q522 -574 501 -536Q496 -527 484 -508Q472 -489 459 -468Q446 -447 436 -432Q427 -417 427 -415Q427 -410 411 -384Q407 -376 398 -361Q390 -346 382 -330Q373 -314 366 -302Q360 -290 360 -288Q360 -281 351 -272Q347 -272 346 -266Q345 -261 345 -261Q345 -257 340 -244Q335 -231 324 -214Q313 -186 298 -152Q283 -119 268 -86Q253 -53 242 -27Q232 -1 230 13Q229 37 226 44Q223 52 214 54ZM328 -174Q315 -168 298 -169Q281 -170 252 -180Q250 -180 238 -189Q226 -198 214 -210Q202 -222 198 -230Q182 -253 188 -298Q195 -343 220 -406Q227 -421 242 -444Q256 -467 270 -486Q285 -506 291 -509Q291 -509 302 -513Q313 -517 330 -526Q335 -528 348 -532Q360 -535 374 -538Q387 -540 392 -539Q412 -538 434 -524Q455 -511 469 -494Q483 -476 478 -463Q478 -461 473 -450Q468 -440 462 -429Q456 -418 452 -413Q447 -407 434 -408Q422 -409 412 -416Q402 -423 401 -435Q399 -443 386 -450Q374 -457 374 -457Q366 -457 353 -441Q340 -425 326 -405Q308 -387 300 -366Q292 -346 290 -328Q287 -311 284 -302Q280 -292 284 -277Q288 -262 294 -260Q303 -259 318 -262Q334 -264 352 -268Q369 -273 387 -278Q405 -284 419 -290Q438 -302 452 -300Q466 -297 473 -295Q484 -291 484 -278Q484 -265 475 -250Q466 -236 449 -227Q433 -219 420 -210Q408 -200 408 -195Q404 -195 400 -192Q395 -190 392 -191Q390 -191 376 -188Q362 -185 348 -181Q333 -177 328 -174Z"],"£":[450,"M439 61Q409 76 368 72Q328 69 296 48Q293 45 284 40Q275 36 267 36Q260 31 244 30Q227 29 216 26Q194 21 184 21Q175 21 160 26Q133 35 101 30Q69 25 46 12Q24 -1 24 -16Q24 -33 34 -42Q45 -51 73 -54Q105 -57 116 -59Q128 -61 130 -64Q132 -68 136 -75Q142 -95 148 -124Q155 -152 164 -208Q167 -234 177 -277Q187 -320 202 -368Q218 -417 238 -459Q264 -512 292 -557Q320 -602 348 -632Q376 -661 403 -665Q430 -673 462 -663Q495 -653 512 -636Q513 -643 522 -633Q532 -623 542 -608Q551 -592 552 -581Q555 -571 558 -563Q562 -555 562 -555Q566 -552 566 -546Q565 -540 565 -536Q564 -528 558 -516Q553 -503 539 -492Q525 -485 508 -486Q491 -487 480 -497Q468 -507 470 -528Q472 -545 467 -562Q462 -580 448 -584Q437 -589 430 -589Q422 -589 401 -572Q392 -557 385 -550Q378 -544 378 -544Q378 -544 370 -530Q362 -516 351 -496Q340 -474 326 -436Q311 -398 296 -357Q282 -316 270 -281Q259 -246 254 -229Q253 -219 248 -194Q244 -169 239 -140Q234 -111 232 -88L234 -63L270 -51Q281 -47 290 -39Q298 -31 314 -29Q328 -20 344 -16Q361 -12 374 -12Q399 -12 418 -22Q437 -32 439 -39Q443 -39 446 -44Q450 -48 450 -53Q455 -53 464 -56Q473 -60 480 -60Q497 -60 507 -48Q517 -36 515 -17Q513 2 495 22Q477 43 439 61ZM345 -278Q341 -278 321 -278Q301 -278 274 -278Q246 -278 217 -279Q188 -279 164 -280Q140 -280 129 -280Q123 -280 114 -281Q105 -282 94 -286Q79 -286 71 -292Q63 -299 59 -306Q48 -322 61 -330Q74 -338 111 -341Q128 -344 162 -346Q197 -347 238 -348Q278 -348 314 -348Q351 -347 371 -347Q397 -347 417 -342Q437 -336 447 -325Q462 -309 454 -293Q446 -277 423 -281Q416 -280 390 -280Q363 -279 345 -278Z"],"¤":[450,"M133 -18Q128 -14 122 -21Q116 -28 114 -38Q111 -48 115 -52Q111 -57 115 -56Q119 -56 121 -56Q116 -62 120 -72Q125 -83 132 -94Q140 -104 145 -108Q144 -112 148 -114Q151 -117 152 -125Q163 -132 175 -132Q175 -146 180 -149Q185 -152 191 -156Q196 -161 197 -167Q198 -173 193 -171Q192 -173 186 -182Q181 -191 176 -194Q174 -214 174 -238Q173 -261 178 -277Q181 -277 182 -290Q184 -303 190 -309Q189 -313 194 -318Q198 -324 201 -325Q202 -327 204 -328Q206 -330 206 -335Q206 -335 209 -341Q212 -347 219 -357Q225 -373 228 -378Q231 -384 231 -387Q231 -390 228 -398Q209 -413 194 -435Q178 -457 182 -468Q181 -470 179 -472Q177 -475 175 -479Q166 -493 170 -508Q175 -522 184 -530Q194 -539 198 -534Q197 -534 206 -532Q215 -529 220 -518Q224 -512 228 -507Q233 -502 237 -496Q242 -497 246 -486Q251 -474 258 -468Q271 -450 280 -447Q290 -444 290 -442Q292 -440 294 -444Q295 -447 305 -453Q314 -458 318 -458Q323 -457 329 -456Q335 -454 347 -455L375 -453L409 -499Q441 -540 460 -550Q478 -560 485 -546Q493 -544 498 -529Q504 -514 501 -509Q500 -511 496 -503Q493 -495 489 -490Q484 -480 476 -467Q469 -454 466 -447Q454 -444 453 -438Q452 -432 449 -427Q449 -427 452 -422Q456 -417 464 -410Q470 -408 474 -400Q478 -392 480 -374Q486 -370 490 -358Q493 -347 494 -337Q495 -327 493 -325Q492 -324 492 -322Q491 -321 489 -314Q491 -310 483 -290Q475 -271 462 -247Q448 -223 431 -204L414 -184L427 -170Q432 -162 443 -150Q454 -137 466 -128Q477 -119 482 -119Q486 -119 487 -106Q488 -94 488 -81Q487 -68 484 -63Q478 -55 462 -53Q445 -51 429 -69Q408 -85 392 -110Q375 -134 371 -141Q373 -150 366 -148Q359 -146 353 -141Q326 -129 310 -124Q293 -119 276 -122Q265 -127 262 -126Q258 -125 248 -115Q247 -111 240 -103Q233 -94 224 -86Q216 -78 210 -72Q203 -55 195 -47Q187 -39 189 -33Q187 -31 174 -26Q161 -20 148 -16Q135 -13 133 -18ZM315 -202Q341 -216 367 -238Q393 -259 406 -289Q414 -306 416 -327Q418 -348 410 -358Q397 -374 370 -377Q353 -379 345 -376Q337 -374 323 -368Q303 -359 294 -347Q285 -334 271 -308Q250 -279 244 -252Q239 -225 254 -217Q260 -208 277 -204Q294 -201 315 -202Z"],"¥":[450,"M229 -680Q250 -698 264 -687Q277 -676 284 -650Q290 -624 289 -595Q292 -488 302 -433Q313 -378 329 -365Q341 -362 350 -368Q359 -373 374 -390Q388 -406 414 -433Q442 -462 470 -494Q498 -527 524 -557Q549 -587 570 -609Q590 -631 602 -638Q606 -644 616 -648Q626 -653 636 -656Q645 -658 645 -658Q653 -656 654 -646Q655 -635 662 -625Q664 -621 671 -613Q678 -605 677 -600Q677 -597 668 -586Q659 -576 649 -566Q639 -556 634 -551Q621 -540 594 -512Q566 -485 537 -454Q508 -422 488 -397Q444 -346 410 -309Q375 -272 367 -265Q366 -263 354 -262Q342 -262 337 -254L295 -259L260 -303Q240 -333 228 -359Q216 -385 211 -423Q204 -447 202 -468Q200 -489 200 -516Q201 -544 202 -585Q203 -623 214 -648Q225 -672 229 -680ZM239 76Q235 75 222 67Q210 59 200 52Q193 44 192 35Q190 26 194 11Q198 -4 205 -31Q206 -54 214 -87Q223 -120 235 -142Q235 -153 240 -172Q245 -191 252 -212Q260 -232 266 -247L284 -299L324 -333L376 -297Q372 -291 369 -283Q366 -275 361 -256Q356 -237 346 -197Q338 -170 328 -139Q319 -108 311 -81Q303 -54 297 -37Q285 8 276 34Q266 60 258 70Q249 79 239 76ZM144 -107Q138 -107 129 -108Q120 -108 109 -112Q94 -112 85 -118Q76 -125 72 -132Q61 -147 74 -156Q87 -164 124 -168Q141 -172 178 -174Q216 -176 260 -177Q305 -178 344 -178Q383 -179 403 -179Q429 -179 450 -174Q470 -170 481 -159Q496 -144 488 -127Q480 -110 457 -114Q453 -114 440 -114Q427 -113 410 -113Q394 -113 378 -113Q363 -113 354 -112Q348 -112 320 -111Q293 -110 257 -109Q222 -108 190 -108Q158 -107 144 -107ZM524 -299Q539 -284 532 -268Q524 -251 501 -255Q496 -255 482 -254Q468 -253 452 -252Q435 -251 423 -250Q418 -250 396 -250Q375 -249 344 -248Q314 -248 282 -248Q250 -247 224 -247Q198 -247 187 -247Q181 -247 172 -248Q163 -248 152 -252Q137 -252 128 -258Q120 -265 116 -272Q105 -287 118 -296Q130 -304 167 -308Q184 -312 222 -314Q259 -316 304 -318Q348 -319 388 -320Q427 -320 447 -320Q473 -320 493 -315Q513 -310 524 -299Z"],"¦":[330,"M312 -355Q309 -345 294 -346Q280 -346 263 -352Q246 -359 236 -368Q226 -378 232 -385Q243 -411 261 -454Q279 -497 298 -547Q318 -596 335 -641Q353 -686 364 -716Q375 -747 375 -751Q375 -767 391 -767Q394 -770 398 -771Q403 -772 407 -772Q407 -772 411 -768Q415 -764 423 -756Q431 -749 444 -736Q457 -722 457 -710Q457 -697 454 -687Q451 -677 442 -658Q433 -639 414 -599Q411 -591 402 -571Q393 -551 382 -526Q372 -501 362 -478Q351 -454 344 -438Q338 -422 338 -420Q338 -416 334 -408Q331 -400 327 -388Q324 -383 320 -374Q317 -366 312 -355ZM147 148Q119 155 104 120Q88 84 100 28Q105 16 108 4Q111 -7 111 -14Q113 -22 121 -50Q129 -77 140 -113Q152 -149 164 -184Q175 -219 183 -242Q184 -250 197 -249Q209 -248 225 -242Q240 -236 250 -228Q260 -219 256 -213L254 -208Q247 -186 237 -152Q227 -118 216 -80Q204 -41 194 -5Q184 31 178 58Q171 86 171 97Q171 121 163 132Q155 144 147 148Z"],"§":[385,"M351 -181Q313 -171 278 -182Q243 -193 228 -216Q221 -230 221 -243Q221 -256 228 -260Q236 -261 242 -260Q249 -258 260 -254Q275 -241 293 -240Q311 -240 325 -249Q339 -258 341 -271Q335 -273 331 -282Q327 -292 323 -303Q255 -380 255 -432Q251 -444 256 -462Q261 -480 270 -498Q279 -516 288 -528Q314 -557 350 -580Q385 -602 412 -615Q423 -615 445 -614Q467 -612 474 -610Q481 -608 490 -596Q498 -583 504 -568Q511 -553 513 -542Q513 -535 508 -520Q502 -505 498 -488Q494 -477 489 -468Q484 -458 484 -454Q483 -443 472 -442Q460 -441 448 -448Q436 -454 431 -465Q427 -480 426 -490Q424 -499 428 -510Q439 -523 439 -527Q439 -531 428 -529Q421 -529 408 -522Q396 -515 383 -503Q370 -491 358 -474Q346 -460 342 -452Q339 -443 340 -436Q340 -429 340 -418Q340 -409 345 -396Q350 -383 356 -374Q363 -364 368 -363Q368 -363 376 -350Q384 -336 400 -321Q435 -263 422 -229Q410 -195 351 -181ZM247 -1Q209 8 174 -2Q140 -11 125 -37Q118 -50 118 -63Q118 -76 125 -81Q133 -82 143 -78Q153 -73 164 -69Q179 -59 198 -60Q217 -61 232 -70Q248 -78 250 -90Q249 -94 242 -104Q236 -114 232 -125Q199 -157 183 -194Q167 -230 167 -254Q161 -272 174 -296Q186 -320 201 -334Q218 -360 240 -374Q261 -389 280 -405L320 -346Q303 -337 286 -320Q269 -302 255 -287Q241 -269 242 -259Q244 -249 244 -232Q244 -218 254 -201Q265 -184 272 -177Q272 -177 281 -164Q290 -151 304 -140Q339 -79 322 -46Q306 -12 247 -1Z"],"¨":[353,"M235 -429Q225 -437 220 -454Q214 -470 216 -476Q218 -483 226 -502Q233 -520 248 -533Q252 -536 256 -542Q261 -547 266 -548Q280 -559 294 -552Q309 -544 320 -524Q331 -501 326 -486Q322 -471 300 -445Q281 -420 266 -418Q250 -415 235 -429ZM390 -429Q380 -437 374 -454Q369 -470 371 -476Q373 -483 380 -502Q388 -520 403 -533Q407 -536 412 -542Q416 -547 421 -548Q435 -559 450 -552Q464 -544 475 -524Q486 -501 482 -486Q477 -471 455 -445Q436 -420 420 -418Q405 -415 390 -429Z"],"©":[496,"M353 -73Q283 -72 236 -100Q189 -127 169 -182Q157 -203 154 -220Q152 -237 147 -254Q146 -256 146 -260Q146 -264 144 -265Q143 -269 143 -281Q143 -292 144 -304Q145 -315 145 -317Q150 -321 148 -324Q147 -328 147 -328Q143 -339 150 -364Q156 -389 168 -418Q180 -446 192 -467Q203 -488 207 -491Q209 -491 208 -494Q208 -497 210 -498Q214 -504 233 -516Q251 -529 274 -542Q298 -556 314 -564Q383 -598 441 -576Q499 -555 547 -487Q551 -472 560 -459Q570 -446 570 -439Q580 -424 586 -405Q592 -386 594 -371Q597 -356 594 -353Q596 -350 595 -345Q594 -341 595 -339Q598 -335 598 -320Q598 -305 596 -287Q594 -269 591 -256Q588 -242 586 -242Q586 -242 584 -241Q581 -240 584 -238Q586 -237 580 -229Q575 -222 566 -215Q558 -208 552 -207Q552 -207 552 -206Q551 -204 555 -203Q558 -202 548 -190Q537 -177 519 -160Q501 -143 481 -128Q460 -113 442 -107Q439 -104 438 -102Q436 -100 434 -98Q427 -88 400 -80Q373 -72 353 -73ZM288 -153Q304 -140 338 -146Q372 -151 413 -174Q429 -181 450 -196Q470 -211 486 -227Q501 -243 500 -252Q499 -257 500 -263Q502 -269 506 -270Q515 -278 520 -302Q526 -325 526 -350Q526 -376 519 -389Q518 -391 514 -398Q509 -405 510 -409Q510 -414 508 -418Q506 -423 498 -435Q491 -447 472 -473Q440 -498 414 -503Q387 -508 370 -504Q352 -501 346 -498Q302 -485 277 -461Q252 -437 240 -410Q228 -383 222 -360Q213 -331 210 -315Q206 -299 208 -288Q210 -276 219 -262Q218 -249 222 -236Q227 -224 225 -221Q226 -216 236 -200Q247 -185 262 -170Q276 -156 288 -153ZM354 -203Q346 -199 332 -204Q319 -209 296 -216Q294 -216 288 -222Q281 -228 275 -235Q264 -252 260 -286Q257 -320 276 -358Q279 -369 289 -384Q299 -400 311 -415Q323 -430 332 -441Q342 -452 343 -454Q343 -454 348 -456Q354 -459 371 -465Q378 -467 385 -468Q392 -470 392 -470Q405 -469 420 -459Q435 -449 448 -435Q462 -421 470 -408Q477 -395 475 -388Q474 -386 468 -380Q463 -374 460 -368Q457 -362 446 -362Q436 -363 426 -368Q417 -374 416 -382Q402 -402 390 -401Q379 -400 371 -389Q363 -378 359 -366Q346 -351 342 -333Q339 -315 337 -306Q335 -296 336 -285Q338 -274 341 -272Q353 -268 362 -268Q370 -269 384 -278Q397 -286 422 -305Q430 -311 438 -302Q445 -294 452 -284Q458 -273 463 -272Q462 -254 445 -238Q428 -222 415 -217Q411 -217 406 -216Q402 -214 399 -214Q395 -214 378 -210Q362 -206 354 -203Z"],"ª":[350,"M222 -313Q204 -313 186 -326Q169 -339 164 -347L162 -349L158 -358Q157 -359 157 -360Q157 -361 156 -362Q155 -364 154 -366Q153 -367 151 -368H152Q148 -374 154 -396Q161 -417 174 -448Q188 -478 205 -509Q210 -514 215 -522Q220 -530 224 -536L229 -543V-545Q231 -547 234 -549Q237 -551 239 -552L245 -566Q248 -571 264 -587Q279 -603 298 -620Q317 -638 329 -645Q347 -658 368 -656Q388 -655 401 -644L455 -598L488 -569L473 -525Q470 -515 468 -506Q466 -498 465 -490Q464 -468 469 -450Q474 -431 483 -417Q493 -398 515 -395Q523 -394 529 -389Q535 -384 535 -375Q535 -354 528 -345Q520 -336 512 -334Q482 -330 456 -340Q429 -350 407 -390Q403 -395 398 -410Q392 -425 391 -429Q388 -425 382 -418Q376 -411 371 -406Q324 -358 287 -336Q250 -313 222 -313ZM238 -397Q243 -397 256 -404Q270 -411 292 -429Q322 -455 342 -472Q361 -489 380 -515L400 -547Q390 -568 383 -574Q376 -579 369 -579Q357 -579 341 -564Q325 -550 306 -522Q286 -494 261 -453Q250 -434 244 -416Q238 -397 238 -397Z"],"«":[646,"M406 6Q398 7 379 6Q360 6 328 -8Q292 -27 274 -36Q257 -46 242 -64Q208 -84 190 -106Q171 -127 154 -157L122 -199L115 -236Q123 -239 130 -252Q138 -266 139 -267Q148 -278 162 -290Q176 -302 198 -320Q221 -339 256 -369Q293 -396 306 -410Q320 -424 330 -434Q336 -441 344 -448Q352 -456 356 -456Q362 -458 370 -454Q378 -451 382 -448Q393 -441 403 -438Q413 -435 414 -427Q414 -427 412 -412Q409 -396 402 -390Q389 -379 374 -368Q359 -356 336 -338Q314 -319 275 -284Q251 -263 240 -250Q228 -237 225 -228Q222 -218 224 -205Q230 -192 242 -175Q255 -158 281 -138Q307 -117 353 -91Q378 -79 396 -58Q413 -36 418 -17Q422 2 406 6ZM616 6Q608 7 589 6Q570 6 538 -8Q502 -27 484 -36Q467 -46 452 -64Q418 -84 400 -106Q381 -127 364 -157L333 -199L326 -236Q334 -239 341 -252Q348 -266 349 -267Q358 -278 372 -290Q386 -302 409 -320Q432 -339 467 -369Q504 -396 518 -410Q531 -424 541 -434Q547 -441 555 -448Q563 -456 567 -456Q573 -458 581 -454Q589 -451 593 -448Q604 -441 614 -438Q623 -435 624 -427Q624 -427 622 -412Q619 -396 612 -390Q599 -379 584 -368Q569 -356 546 -338Q524 -319 485 -284Q462 -263 450 -250Q439 -237 436 -228Q433 -218 435 -205Q441 -192 453 -175Q465 -158 491 -138Q517 -117 563 -91Q588 -79 606 -58Q623 -36 628 -17Q632 2 616 6Z"],"¬":[465,"M478 -129Q468 -119 454 -118Q441 -116 432 -123Q423 -130 425 -145L420 -201L417 -240L388 -238Q382 -238 357 -237Q333 -236 300 -235Q268 -234 238 -234Q209 -233 195 -233Q189 -233 180 -234Q171 -234 160 -238Q145 -238 140 -249Q135 -260 131 -267Q120 -282 129 -288Q138 -295 175 -299Q192 -303 226 -306Q259 -308 298 -310Q337 -311 372 -312Q407 -313 427 -313Q453 -313 466 -310Q478 -307 489 -296Q509 -275 497 -263Q499 -247 500 -230Q500 -213 500 -192Q500 -167 494 -154Q489 -140 478 -129Z"],"®":[496,"M353 -73Q283 -72 236 -100Q189 -127 169 -182Q157 -203 154 -220Q152 -237 147 -254Q146 -256 146 -260Q146 -264 144 -265Q143 -269 143 -281Q143 -292 144 -304Q145 -315 145 -317Q150 -321 148 -324Q147 -328 147 -328Q143 -339 150 -364Q156 -389 168 -418Q180 -446 192 -467Q203 -488 207 -491Q209 -491 208 -494Q208 -497 210 -498Q214 -504 233 -516Q251 -529 274 -542Q298 -556 314 -564Q383 -598 441 -576Q499 -555 547 -487Q551 -472 560 -459Q570 -446 570 -439Q580 -424 586 -405Q592 -386 594 -371Q597 -356 594 -353Q596 -350 595 -345Q594 -341 595 -339Q598 -335 598 -320Q598 -305 596 -287Q594 -269 591 -256Q588 -242 586 -242Q586 -242 584 -241Q581 -240 584 -238Q586 -237 580 -229Q575 -222 566 -215Q558 -208 552 -207Q552 -207 552 -206Q551 -204 555 -203Q558 -202 548 -190Q537 -177 519 -160Q501 -143 481 -128Q460 -113 442 -107Q439 -104 438 -102Q436 -100 434 -98Q427 -88 400 -80Q373 -72 353 -73ZM317 -211Q311 -194 300 -192Q288 -191 277 -200Q266 -208 259 -220Q252 -233 254 -242Q256 -253 261 -268Q266 -282 272 -298Q272 -306 273 -313Q274 -320 276 -320Q278 -329 284 -350Q289 -371 311 -401Q311 -413 312 -418Q314 -423 308 -429Q305 -434 306 -438Q306 -443 316 -450Q316 -456 334 -463Q351 -470 373 -468Q385 -467 391 -466Q397 -465 401 -461Q415 -460 432 -450Q449 -440 449 -437Q457 -430 462 -413Q466 -396 467 -388Q467 -376 466 -369Q464 -362 453 -348Q446 -335 437 -324Q428 -314 411 -302L399 -289Q400 -285 407 -279Q415 -273 423 -268Q432 -262 437 -260Q445 -262 450 -260Q454 -258 451 -240Q444 -226 431 -215Q418 -204 404 -214Q392 -216 387 -220Q382 -224 375 -231Q368 -237 364 -244Q360 -250 345 -263Q345 -263 344 -264Q342 -264 331 -265L323 -244Q323 -240 322 -231Q320 -222 317 -211ZM288 -153Q304 -140 338 -146Q372 -151 413 -174Q429 -181 450 -196Q470 -211 486 -227Q501 -243 500 -252Q499 -257 500 -263Q502 -269 506 -270Q515 -278 520 -302Q526 -325 526 -350Q526 -376 519 -389Q518 -391 514 -398Q509 -405 510 -409Q510 -414 508 -418Q506 -423 498 -435Q491 -447 472 -473Q440 -498 414 -503Q387 -508 370 -504Q352 -501 346 -498Q302 -485 277 -461Q252 -437 240 -410Q228 -383 222 -360Q213 -331 210 -315Q206 -299 208 -288Q210 -276 219 -262Q218 -249 222 -236Q227 -224 225 -221Q226 -216 236 -200Q247 -185 262 -170Q276 -156 288 -153ZM350 -315Q367 -320 370 -331Q374 -342 378 -351Q381 -353 385 -357Q389 -361 398 -373Q400 -377 401 -376Q402 -374 402 -387Q406 -395 399 -400Q395 -404 394 -406Q393 -408 382 -412Q381 -411 378 -409Q376 -407 369 -400Q368 -396 369 -392Q370 -387 363 -384Q361 -378 356 -362Q352 -345 349 -330Q346 -316 350 -315Z"],"¯":[353,"M298 -453Q292 -453 283 -454Q274 -454 263 -458Q248 -458 240 -464Q231 -470 227 -477Q217 -492 229 -500Q241 -509 278 -513Q312 -521 337 -524Q362 -527 402 -527Q427 -527 444 -522Q460 -517 471 -507Q486 -492 478 -476Q471 -459 448 -462Q441 -461 418 -460Q396 -459 378 -458Q368 -457 347 -455Q326 -453 298 -453Z"],"°":[283,"M336 -406Q298 -406 273 -417Q248 -428 233 -446Q218 -464 210 -486Q202 -501 198 -524Q194 -547 192 -557Q192 -567 198 -587Q203 -607 212 -628Q221 -649 229 -661Q242 -685 264 -700Q286 -714 300 -726Q315 -733 324 -736Q334 -740 343 -740Q379 -740 414 -723Q448 -706 470 -675Q493 -644 493 -602Q493 -568 486 -546Q478 -524 465 -507Q452 -490 434 -470Q429 -464 413 -448Q397 -433 376 -420Q356 -406 336 -406ZM325 -490Q338 -490 358 -501Q377 -512 393 -535Q409 -558 408 -592Q407 -634 391 -648Q375 -663 358 -664Q324 -666 302 -636Q281 -605 281 -552Q281 -538 286 -525Q290 -512 300 -503Q309 -494 325 -490Z"],"±":[446,"M170 -242Q164 -242 155 -242Q146 -243 135 -247Q120 -247 112 -254Q103 -260 99 -267Q88 -282 100 -290Q113 -299 150 -303Q167 -307 200 -310Q234 -312 273 -314Q312 -315 347 -316Q382 -317 402 -317Q428 -317 448 -312Q469 -307 480 -296Q495 -281 487 -264Q479 -248 456 -252Q451 -252 437 -251Q423 -250 407 -249Q390 -248 378 -247Q372 -247 345 -246Q318 -245 282 -244Q247 -243 216 -242Q184 -242 170 -242ZM170 -7Q164 -7 155 -8Q146 -8 135 -12Q120 -12 112 -18Q103 -25 99 -32Q88 -47 100 -56Q113 -64 150 -68Q167 -72 200 -74Q234 -77 273 -78Q312 -80 347 -81Q382 -82 402 -82Q428 -82 448 -78Q469 -73 480 -62Q495 -47 487 -30Q479 -13 456 -17Q451 -17 437 -16Q423 -15 407 -14Q390 -13 378 -12Q372 -12 345 -11Q318 -10 282 -9Q247 -8 216 -8Q184 -7 170 -7ZM304 -126Q289 -116 280 -128Q272 -141 268 -175Q264 -191 262 -214Q259 -238 258 -264Q256 -291 255 -316Q254 -342 254 -361Q254 -385 259 -405Q264 -425 274 -435Q289 -449 306 -442Q323 -434 319 -413Q320 -406 322 -380Q323 -355 324 -338Q324 -333 325 -315Q326 -297 327 -274Q328 -251 328 -230Q329 -208 329 -194Q329 -189 328 -181Q328 -172 324 -161Q324 -147 318 -138Q311 -130 304 -126Z"],"²":[320,"M210 -336Q205 -338 194 -351Q182 -364 178 -371Q178 -375 182 -386Q187 -398 193 -408Q199 -419 201 -419Q202 -419 207 -426Q212 -432 217 -440Q222 -447 222 -449L232 -457L236 -459H234L245 -470L255 -480H254L267 -499Q272 -504 272 -508Q273 -511 281 -521Q298 -538 311 -553Q324 -568 325 -572Q325 -572 329 -576Q333 -581 337 -583L356 -600Q359 -607 366 -613Q373 -619 379 -626L390 -652Q392 -659 394 -660Q395 -660 382 -664H383Q370 -667 356 -667Q344 -667 335 -665Q326 -663 309 -652Q305 -651 301 -650Q297 -649 292 -646Q286 -643 281 -640Q276 -638 267 -640Q267 -640 267 -640Q267 -640 261 -647L243 -671L231 -699L268 -715Q296 -732 327 -744Q358 -755 377 -747Q385 -746 392 -744Q399 -743 399 -743Q407 -742 420 -734Q433 -726 445 -714Q457 -703 461 -693V-694Q466 -687 471 -670Q476 -654 476 -646Q476 -633 468 -616Q460 -600 447 -582Q444 -577 432 -562Q419 -548 403 -530Q388 -513 375 -499Q362 -485 357 -481Q352 -478 342 -470Q333 -461 323 -450Q313 -440 306 -433Q300 -426 301 -426L304 -424Q304 -424 310 -426Q325 -432 342 -436Q359 -439 374 -440Q388 -442 394 -440Q402 -442 420 -440Q438 -439 451 -434Q452 -434 454 -433Q455 -432 456 -432Q457 -431 460 -431Q468 -428 471 -423Q474 -417 477 -414Q485 -407 492 -398Q499 -388 499 -380Q499 -371 485 -368Q471 -365 437 -369Q431 -369 422 -368Q413 -368 408 -366Q405 -365 400 -364Q394 -364 386 -364Q385 -364 383 -364Q381 -363 379 -363H373Q361 -365 347 -362Q333 -359 317 -354Q308 -351 284 -346Q261 -340 239 -337Q216 -334 210 -336Z"],"³":[320,"M294 -298Q244 -298 223 -315Q202 -332 203 -349Q204 -364 215 -376Q226 -387 247 -385Q272 -379 295 -378Q318 -378 337 -384Q356 -391 369 -406Q386 -425 386 -446Q386 -456 386 -461Q386 -466 375 -473Q363 -484 337 -494Q311 -504 294 -505Q287 -503 281 -506Q275 -510 264 -517Q260 -522 256 -532Q253 -543 251 -546L247 -552Q246 -560 264 -575Q283 -590 327 -617L332 -619H331L337 -623Q365 -641 379 -649Q393 -657 400 -662Q406 -667 413 -673H412Q422 -687 422 -686Q423 -685 411 -689Q394 -691 388 -692Q382 -692 378 -687Q374 -689 362 -687Q349 -685 338 -682Q327 -679 326 -677Q325 -675 314 -672Q302 -670 290 -669Q278 -668 276 -668Q272 -669 266 -680Q261 -691 257 -704Q253 -716 253 -721Q256 -725 266 -734Q277 -742 290 -750Q303 -759 311 -763Q322 -766 342 -768Q363 -769 383 -770Q403 -771 412 -770H413Q448 -766 476 -745Q503 -724 507 -697Q510 -681 504 -666Q497 -650 475 -627L471 -623L461 -616Q453 -610 448 -608Q442 -606 430 -598L418 -590L411 -585L403 -578L396 -573L364 -559L414 -541Q434 -531 446 -512Q458 -493 466 -481Q471 -469 474 -458Q476 -448 476 -437Q476 -409 456 -381Q437 -353 407 -332Q387 -319 354 -310Q320 -300 294 -298Z"],"´":[353,"M343 -435Q334 -440 331 -456Q328 -472 330 -488Q331 -493 344 -508Q356 -524 374 -543Q393 -562 412 -578Q430 -593 442 -596Q456 -597 468 -582Q480 -568 481 -547Q481 -536 471 -525Q461 -514 446 -502Q431 -491 416 -478Q400 -466 390 -453Q380 -437 368 -432Q356 -427 343 -435Z"],"µ":[370,"M65 192Q53 192 44 180Q36 167 32 152Q27 138 27 133Q27 121 37 90Q47 58 60 16Q74 -27 88 -74Q101 -120 109 -162Q114 -185 122 -213Q131 -241 149 -281Q172 -325 183 -344Q194 -364 198 -368Q203 -374 210 -376Q217 -377 225 -377Q245 -377 253 -368Q261 -358 261 -344Q261 -326 252 -298Q243 -271 230 -242Q218 -212 208 -186Q199 -159 198 -142Q198 -132 200 -126Q203 -119 209 -116Q215 -112 225 -112Q235 -112 248 -120Q261 -129 278 -154Q296 -178 317 -226Q331 -258 334 -273Q338 -288 338 -301Q338 -308 346 -323Q353 -338 363 -350Q375 -366 387 -366Q389 -366 393 -364Q397 -363 407 -362Q413 -363 418 -358Q423 -354 429 -333Q430 -332 430 -330Q431 -329 432 -327Q433 -323 433 -320Q433 -316 433 -311Q433 -295 428 -271Q423 -247 410 -218Q391 -175 384 -155Q377 -135 377 -115Q377 -79 405 -57Q414 -50 416 -42Q418 -35 418 -24Q417 -21 410 -11Q402 -1 390 8Q379 16 363 16Q347 16 334 -4Q321 -23 313 -53Q311 -61 312 -74Q312 -88 311 -95Q310 -93 305 -86Q300 -80 292 -72Q274 -54 248 -35Q221 -16 198 -16Q188 -16 179 -20Q170 -25 161 -35Q159 -28 156 -20Q154 -13 152 -6Q133 56 120 92Q108 129 101 147Q94 165 91 172Q88 178 86 180Q79 187 74 190Q69 192 65 192Z"],"¶":[424,"M181 55Q169 44 155 29Q141 14 150 2Q150 -1 154 -10Q157 -20 161 -30Q167 -52 176 -78Q186 -103 196 -125Q205 -147 212 -158Q216 -168 218 -180Q221 -193 225 -200Q230 -211 236 -224Q243 -236 248 -243Q252 -262 258 -276Q263 -291 263 -291Q252 -293 242 -292Q233 -291 204 -296Q177 -306 160 -333Q144 -360 151 -409Q161 -441 173 -474Q185 -508 215 -530Q245 -552 268 -566Q290 -580 313 -591Q336 -602 367 -614Q375 -614 402 -616Q430 -617 456 -621Q500 -618 536 -612Q571 -605 591 -595Q611 -585 608 -569Q607 -562 606 -557Q606 -552 600 -544Q597 -539 590 -524Q584 -509 576 -492Q569 -476 562 -464Q558 -457 548 -432Q538 -408 527 -379Q514 -354 507 -334Q500 -315 500 -315Q500 -315 496 -308Q492 -300 487 -292Q486 -283 477 -260Q468 -237 456 -214Q446 -189 435 -162Q424 -134 422 -120Q415 -107 407 -84Q399 -62 388 -44L376 -2H330Q325 -5 318 -7Q311 -9 306 -16Q304 -24 304 -29Q304 -34 308 -55Q313 -65 318 -74Q322 -84 326 -88Q331 -91 332 -99Q333 -107 334 -109Q334 -117 340 -128Q346 -138 349 -142Q353 -154 355 -161Q357 -168 357 -168Q357 -174 366 -190Q370 -198 376 -210Q381 -222 384 -234Q387 -242 390 -253Q394 -264 398 -264Q398 -267 400 -275Q402 -283 403 -291Q408 -300 412 -312Q417 -323 420 -330Q425 -337 428 -342Q431 -346 431 -346Q428 -346 432 -358Q437 -369 445 -385Q449 -390 450 -400Q451 -411 455 -424Q462 -438 472 -460Q483 -483 493 -500Q498 -517 502 -530Q505 -544 505 -547Q503 -547 493 -549Q482 -551 472 -550Q462 -549 458 -538Q457 -534 452 -526Q447 -519 434 -497Q426 -475 414 -450Q402 -426 398 -412Q391 -397 384 -381Q376 -365 370 -349Q366 -342 359 -326Q352 -309 347 -292Q343 -283 335 -264Q327 -244 317 -220Q307 -196 298 -174Q288 -152 279 -138Q276 -128 274 -118Q272 -107 270 -102Q270 -97 261 -73Q252 -49 240 -18Q229 14 219 40Q212 50 205 55Q198 60 181 55Z"],"·":[187,"M146 -233Q141 -238 136 -252Q132 -265 130 -277Q128 -289 131 -289Q136 -290 145 -300Q154 -309 160 -321Q167 -333 166 -341Q166 -351 176 -353Q188 -361 207 -356Q226 -350 236 -334Q245 -315 241 -295Q237 -275 219 -253Q204 -233 182 -228Q160 -222 146 -233Z"],"¸":[353,"M160 193Q145 196 120 192Q95 187 74 181Q52 175 46 173Q34 169 28 158Q22 146 23 134Q24 122 34 116Q44 109 66 115Q82 119 100 126Q119 132 134 132Q149 132 156 118Q163 107 155 96Q147 84 136 72Q129 63 122 56Q116 50 105 40Q97 29 96 14Q94 0 111 -18Q128 -36 176 -60L232 -30Q207 -18 192 -7Q176 4 176 17Q190 37 207 56Q224 74 229 94Q235 118 226 139Q216 160 198 174Q180 189 160 193Z"],"¹":[320,"M326 -303Q324 -306 317 -310Q310 -315 306 -328Q303 -340 309 -367Q310 -372 311 -377Q312 -382 313 -386Q318 -414 322 -429Q327 -444 327 -444Q331 -446 338 -469Q345 -492 354 -524Q357 -535 360 -546Q363 -556 366 -566Q369 -579 378 -598Q386 -617 389 -630Q392 -638 394 -646Q397 -655 400 -663Q391 -657 381 -646Q371 -635 354 -621Q346 -616 337 -610Q328 -605 319 -597Q312 -591 304 -584Q297 -576 289 -571Q268 -552 258 -548Q247 -544 237 -551Q225 -562 216 -580Q207 -597 212 -607Q214 -608 222 -614Q231 -621 242 -630Q253 -638 260 -644Q268 -650 274 -655Q280 -660 283 -661Q285 -661 290 -666Q296 -671 303 -677Q306 -679 317 -689Q328 -699 346 -712Q350 -716 354 -720Q359 -723 363 -727Q367 -730 371 -733Q375 -736 379 -739Q407 -759 434 -771Q460 -783 465 -782Q466 -782 475 -774Q484 -767 493 -758Q502 -749 504 -743Q505 -739 504 -731Q502 -723 499 -716Q496 -707 490 -687Q483 -667 476 -642Q468 -617 460 -593Q453 -569 448 -552Q446 -545 444 -539Q443 -533 442 -527Q440 -521 438 -516Q437 -511 435 -507Q434 -506 434 -504Q433 -501 433 -500Q429 -490 426 -480Q423 -469 419 -449Q411 -429 404 -403Q397 -377 394 -360Q393 -355 391 -350Q389 -345 387 -340Q384 -330 381 -322Q378 -314 374 -310Q370 -294 358 -293Q346 -292 326 -303Z"],"º":[283,"M257 -298Q244 -298 226 -312Q208 -325 196 -337Q183 -353 180 -363Q177 -373 180 -391Q182 -396 181 -402Q180 -409 180 -409L182 -408Q178 -412 178 -414Q179 -415 181 -417L179 -416Q179 -417 180 -418Q181 -418 181 -419L187 -421Q187 -421 186 -424Q185 -427 184 -429Q185 -436 189 -452Q193 -468 200 -486Q206 -505 213 -518Q218 -527 229 -544Q240 -561 252 -578Q265 -595 275 -604Q295 -623 320 -637Q346 -651 365 -656H364Q384 -662 392 -662Q400 -661 413 -647Q430 -637 446 -613Q461 -589 463 -566Q465 -540 459 -506Q453 -471 421 -418Q401 -387 378 -366Q355 -346 332 -329H333Q317 -316 298 -308Q278 -300 257 -298ZM274 -379Q284 -379 296 -386Q309 -392 328 -415Q345 -436 356 -457Q366 -478 376 -509Q378 -515 380 -524Q381 -533 381 -541Q381 -551 380 -560Q378 -568 376 -569H377Q370 -574 358 -572Q347 -570 334 -557Q313 -537 298 -508Q283 -480 266 -439Q264 -429 262 -420Q259 -410 259 -404Q259 -379 274 -379Z"],"»":[708,"M457 15Q451 17 440 9Q430 1 425 -2Q415 -10 404 -10Q394 -11 392 -19Q392 -19 394 -27Q397 -35 404 -41Q418 -53 430 -64Q443 -75 464 -94Q486 -114 524 -148Q559 -180 580 -202Q600 -223 597 -242Q588 -262 560 -293Q531 -324 461 -363Q437 -375 417 -394Q397 -413 391 -430Q385 -446 400 -450Q408 -451 436 -452Q465 -452 496 -438Q532 -419 550 -410Q567 -400 582 -382Q616 -363 635 -341Q654 -319 670 -289L694 -247L701 -217Q696 -216 690 -208Q685 -199 682 -190Q678 -182 677 -181Q668 -170 654 -156Q639 -142 616 -122Q592 -102 557 -72Q520 -45 506 -31Q493 -17 483 -7Q477 0 470 8Q462 15 457 15ZM236 15Q230 17 220 9Q209 1 204 -2Q194 -10 184 -10Q173 -11 171 -19Q171 -19 174 -27Q176 -35 183 -41Q197 -53 210 -64Q222 -75 243 -94Q264 -114 302 -148Q337 -180 358 -202Q378 -223 375 -242Q366 -262 338 -293Q309 -324 239 -363Q215 -375 196 -394Q176 -413 170 -430Q164 -446 179 -450Q187 -451 215 -452Q243 -452 274 -438Q310 -419 328 -410Q345 -400 360 -382Q394 -363 413 -341Q432 -319 448 -289L472 -247L479 -217Q474 -216 468 -208Q463 -199 460 -190Q456 -182 455 -181Q446 -170 432 -156Q417 -142 394 -122Q371 -102 336 -72Q299 -45 286 -31Q272 -17 262 -7Q256 0 248 8Q241 15 236 15Z"],"¼":[800,"M268 21Q249 19 238 6Q226 -7 230 -32Q234 -56 260 -92Q268 -100 274 -108Q281 -116 283 -122Q288 -128 304 -148Q321 -168 343 -194Q366 -219 388 -244Q410 -269 426 -286Q441 -304 443 -307Q447 -306 452 -310Q457 -315 459 -322Q462 -330 468 -336Q475 -342 480 -343Q482 -348 486 -352Q491 -356 492 -360Q493 -363 496 -366Q500 -368 501 -372Q510 -379 534 -402Q558 -426 590 -458Q622 -491 657 -526Q691 -562 720 -593Q750 -624 770 -645Q789 -666 790 -669Q794 -682 810 -677Q817 -681 826 -677Q826 -677 834 -667Q843 -657 848 -648Q854 -639 854 -630Q855 -621 850 -613Q846 -602 840 -594Q833 -587 818 -574Q804 -561 774 -534Q768 -528 752 -512Q736 -497 715 -478Q694 -458 674 -439Q654 -420 641 -407Q628 -394 628 -392Q625 -390 620 -384Q614 -379 607 -370Q599 -363 582 -346Q564 -330 550 -316Q536 -302 535 -300Q533 -297 531 -294Q529 -291 523 -289Q521 -290 519 -287Q516 -283 516 -283Q516 -279 507 -268Q498 -257 483 -243Q467 -224 440 -191Q413 -158 384 -123Q356 -88 335 -60Q314 -31 309 -20Q302 -1 289 9Q276 19 268 21ZM248 -203Q246 -206 239 -210Q232 -215 228 -228Q225 -240 231 -267Q232 -272 233 -277Q234 -282 235 -286Q240 -314 244 -329Q249 -344 249 -344Q253 -346 260 -369Q267 -392 276 -424Q279 -435 282 -446Q285 -456 288 -466Q291 -479 300 -498Q308 -517 311 -530Q314 -538 316 -546Q319 -555 322 -563Q313 -557 303 -546Q293 -535 276 -521Q268 -516 259 -510Q250 -505 241 -497Q234 -491 226 -484Q219 -476 211 -471Q190 -452 180 -448Q169 -444 159 -451Q147 -462 138 -480Q129 -497 134 -507Q136 -508 144 -514Q153 -521 164 -530Q175 -538 182 -544Q190 -550 196 -555Q202 -560 205 -561Q207 -561 212 -566Q218 -571 225 -577Q228 -579 239 -589Q250 -599 268 -612Q275 -619 284 -626Q293 -632 301 -639Q329 -659 356 -671Q382 -683 387 -682Q388 -682 397 -674Q406 -667 415 -658Q424 -649 426 -643Q427 -639 426 -631Q424 -623 421 -616Q418 -607 412 -587Q405 -567 398 -542Q390 -517 382 -493Q375 -469 370 -452Q368 -445 366 -439Q365 -433 364 -427Q362 -421 360 -416Q359 -411 357 -407Q356 -406 356 -404Q355 -401 355 -400Q351 -390 348 -380Q345 -369 341 -349Q333 -329 326 -303Q319 -277 316 -260Q315 -255 313 -250Q311 -245 309 -240Q306 -230 303 -222Q300 -214 296 -210Q292 -194 280 -193Q268 -192 248 -203ZM714 51Q705 44 702 27Q699 10 704 -16Q707 -40 714 -69Q716 -78 717 -82Q718 -85 719 -92Q726 -108 729 -118Q732 -129 732 -129Q729 -128 724 -126Q719 -125 710 -121Q697 -118 692 -117Q688 -116 677 -116Q658 -116 640 -124Q623 -132 616 -145Q612 -150 608 -162Q603 -175 602 -188Q600 -200 604 -205V-204L610 -220L617 -239Q619 -245 621 -250Q623 -255 623 -254Q623 -254 624 -256Q624 -258 625 -259Q627 -263 627 -267Q630 -275 642 -294Q654 -314 669 -338Q684 -361 697 -380Q710 -400 716 -406L717 -407Q722 -410 732 -414Q743 -419 753 -421Q763 -423 766 -418Q777 -408 780 -392Q782 -375 780 -372Q779 -368 774 -359Q768 -350 763 -342L756 -336L753 -333H754Q738 -308 720 -278Q703 -248 689 -219Q684 -204 682 -198Q679 -192 680 -190H679Q685 -189 692 -190Q698 -191 717 -198Q731 -201 736 -201Q742 -201 749 -205Q753 -205 757 -206Q761 -208 761 -210H765Q765 -213 766 -218Q766 -224 766 -225L773 -244L785 -266Q789 -274 794 -284Q798 -295 805 -308L828 -370Q836 -390 844 -392Q852 -393 857 -393Q862 -393 869 -390Q876 -387 877 -374V-380Q882 -373 893 -361Q904 -349 900 -339Q898 -332 896 -326Q893 -319 891 -314L888 -305L882 -292Q878 -287 878 -284Q877 -281 875 -277Q864 -250 848 -212Q832 -173 818 -138Q805 -102 799 -82Q784 -33 780 -15Q776 3 782 14Q783 32 768 46Q753 59 736 62Q719 64 714 50Z"],"½":[800,"M238 21Q219 19 208 6Q196 -7 200 -32Q204 -56 230 -92Q238 -100 244 -108Q251 -116 253 -122Q258 -128 274 -148Q291 -168 314 -194Q336 -219 358 -244Q380 -269 396 -286Q411 -304 413 -307Q417 -306 422 -310Q427 -315 429 -322Q432 -330 438 -336Q445 -342 450 -343Q452 -348 456 -352Q461 -356 462 -360Q463 -363 466 -366Q470 -368 471 -372Q480 -379 504 -402Q528 -426 560 -458Q592 -491 626 -526Q661 -562 690 -593Q720 -624 740 -645Q759 -666 760 -669Q764 -682 780 -677Q787 -681 796 -677Q796 -677 804 -667Q813 -657 818 -648Q824 -639 824 -630Q825 -621 820 -613Q816 -602 810 -594Q803 -587 788 -574Q774 -561 744 -534Q738 -528 722 -512Q706 -497 685 -478Q664 -458 644 -439Q624 -420 611 -407Q598 -394 598 -392Q595 -390 590 -384Q584 -379 577 -370Q569 -363 552 -346Q534 -330 520 -316Q506 -302 505 -300Q503 -297 501 -294Q499 -291 493 -289Q491 -290 488 -286Q486 -283 486 -283Q486 -279 477 -268Q468 -257 453 -243Q437 -224 410 -191Q383 -158 354 -123Q326 -88 305 -60Q284 -31 279 -20Q272 -1 259 9Q246 19 238 21ZM248 -203Q246 -206 239 -210Q232 -215 228 -228Q225 -240 231 -267Q232 -272 233 -277Q234 -282 235 -286Q240 -314 244 -329Q249 -344 249 -344Q253 -346 260 -369Q267 -392 276 -424Q279 -435 282 -446Q285 -456 288 -466Q291 -479 300 -498Q308 -517 311 -530Q314 -538 316 -546Q319 -555 322 -563Q313 -557 303 -546Q293 -535 276 -521Q268 -516 259 -510Q250 -505 241 -497Q234 -491 226 -484Q219 -476 211 -471Q190 -452 180 -448Q169 -444 159 -451Q147 -462 138 -480Q129 -497 134 -507Q136 -508 144 -514Q153 -521 164 -530Q175 -538 182 -544Q190 -550 196 -555Q202 -560 205 -561Q207 -561 212 -566Q218 -571 225 -577Q228 -579 239 -589Q250 -599 268 -612Q275 -619 284 -626Q293 -632 301 -639Q329 -659 356 -671Q382 -683 387 -682Q388 -682 397 -674Q406 -667 415 -658Q424 -649 426 -643Q427 -639 426 -631Q424 -623 421 -616Q418 -607 412 -587Q405 -567 398 -542Q390 -517 382 -493Q375 -469 370 -452Q368 -445 366 -439Q365 -433 364 -427Q362 -421 360 -416Q359 -411 357 -407Q356 -406 356 -404Q355 -401 355 -400Q351 -390 348 -380Q345 -369 341 -349Q333 -329 326 -303Q319 -277 316 -260Q315 -255 313 -250Q311 -245 309 -240Q306 -230 303 -222Q300 -214 296 -210Q292 -194 280 -193Q268 -192 248 -203ZM554 14Q549 12 538 -1Q526 -14 522 -21Q522 -25 526 -36Q531 -48 537 -58Q543 -69 545 -69Q546 -69 551 -75Q556 -81 561 -89Q566 -97 566 -99L576 -107L580 -109H578L589 -120L599 -130H598L611 -149Q616 -154 616 -158Q617 -161 625 -171Q642 -188 655 -203Q668 -218 669 -222Q669 -222 673 -226Q677 -231 681 -233L700 -250Q703 -257 710 -263Q717 -269 723 -276L734 -302Q736 -309 738 -310Q739 -310 726 -314H727Q714 -317 700 -317Q688 -317 679 -315Q670 -313 653 -302Q649 -301 645 -300Q641 -299 636 -296Q630 -293 625 -290Q620 -288 611 -290Q611 -290 611 -290Q611 -290 605 -297L587 -321L575 -349L612 -365Q640 -382 671 -394Q702 -405 721 -397Q729 -396 736 -394Q743 -393 743 -393Q751 -392 764 -384Q777 -375 789 -364Q801 -353 805 -343V-344Q810 -337 815 -320Q820 -304 820 -296Q820 -283 812 -266Q804 -250 791 -232Q788 -227 776 -212Q763 -198 748 -180Q732 -163 719 -149Q706 -135 701 -131Q696 -128 686 -120Q677 -111 667 -100Q657 -90 650 -83Q644 -76 645 -76L648 -74Q648 -74 654 -76Q669 -82 686 -86Q703 -89 718 -90Q732 -92 738 -90Q746 -92 764 -90Q782 -89 795 -84Q796 -84 798 -83Q799 -82 800 -82Q801 -81 804 -81Q812 -78 815 -73Q818 -67 821 -64Q829 -57 836 -48Q843 -38 843 -30Q843 -21 829 -18Q815 -15 781 -19Q775 -19 766 -18Q757 -18 752 -16Q749 -15 744 -14Q738 -14 730 -14Q729 -14 727 -14Q725 -13 723 -13H717Q705 -15 691 -12Q677 -9 661 -4Q652 -1 628 4Q605 10 582 13Q560 16 554 14Z"],"¾":[800,"M278 21Q259 19 248 6Q236 -7 240 -32Q244 -56 270 -92Q278 -100 284 -108Q291 -116 293 -122Q298 -128 314 -148Q331 -168 353 -194Q376 -219 398 -244Q420 -269 436 -286Q451 -304 453 -307Q457 -306 462 -310Q467 -315 469 -322Q472 -330 478 -336Q485 -342 490 -343Q492 -348 496 -352Q501 -356 502 -360Q503 -363 506 -366Q510 -368 511 -372Q520 -379 544 -402Q568 -426 600 -458Q632 -491 667 -526Q701 -562 730 -593Q760 -624 780 -645Q799 -666 800 -669Q804 -682 820 -677Q827 -681 836 -677Q836 -677 844 -667Q853 -657 858 -648Q864 -639 864 -630Q865 -621 860 -613Q856 -602 850 -594Q843 -587 828 -574Q814 -561 784 -534Q778 -528 762 -512Q746 -497 725 -478Q704 -458 684 -439Q664 -420 651 -407Q638 -394 638 -392Q635 -390 630 -384Q624 -379 617 -370Q609 -363 592 -346Q574 -330 560 -316Q546 -302 545 -300Q543 -297 541 -294Q539 -291 533 -289Q531 -290 529 -287Q526 -283 526 -283Q526 -279 517 -268Q508 -257 493 -243Q477 -224 450 -191Q423 -158 394 -123Q366 -88 345 -60Q324 -31 319 -20Q312 -1 299 9Q286 19 278 21ZM213 -199Q163 -199 142 -216Q121 -233 122 -250Q123 -265 134 -276Q145 -288 166 -286Q191 -280 214 -280Q237 -279 256 -286Q275 -292 288 -307Q305 -326 305 -347Q305 -357 305 -362Q305 -367 294 -374Q282 -385 256 -395Q230 -405 213 -406Q206 -404 200 -408Q194 -411 183 -418Q179 -423 176 -434Q172 -444 170 -447L166 -453Q165 -461 184 -476Q202 -491 246 -518L251 -520H250L256 -524Q284 -542 298 -550Q312 -558 318 -563Q325 -568 332 -574H331Q341 -588 342 -587Q342 -586 330 -590Q313 -592 307 -592Q301 -593 297 -588Q293 -590 280 -588Q268 -586 257 -583Q246 -580 245 -578Q244 -576 232 -574Q221 -571 209 -570Q197 -569 195 -569Q191 -570 186 -581Q180 -592 176 -604Q172 -617 172 -622Q175 -626 186 -634Q196 -643 209 -652Q222 -660 230 -664Q241 -667 262 -668Q282 -670 302 -671Q322 -672 331 -671H332Q367 -667 394 -646Q422 -625 426 -598Q429 -582 422 -566Q416 -551 394 -528L390 -524L380 -517Q372 -511 366 -509Q361 -507 349 -499L337 -491L330 -486L322 -479L315 -474L283 -460L333 -442Q353 -432 365 -413Q377 -394 385 -382Q390 -370 392 -360Q395 -349 395 -338Q395 -310 376 -282Q356 -254 326 -233Q306 -220 272 -210Q239 -201 213 -199ZM684 51Q675 44 672 27Q669 10 674 -16Q677 -40 684 -69Q686 -78 687 -82Q688 -85 689 -92Q696 -108 699 -118Q702 -129 702 -129Q699 -128 694 -126Q689 -125 680 -121Q667 -118 662 -117Q658 -116 647 -116Q628 -116 610 -124Q593 -132 586 -145Q582 -150 578 -162Q573 -175 572 -188Q570 -200 574 -205V-204L580 -220L587 -239Q589 -245 591 -250Q593 -255 593 -254Q593 -254 594 -256Q594 -258 595 -259Q597 -263 597 -267Q600 -275 612 -294Q624 -314 639 -338Q654 -361 667 -380Q680 -400 686 -406L687 -407Q692 -410 702 -414Q713 -419 723 -421Q733 -423 736 -418Q747 -408 750 -392Q752 -375 750 -372Q749 -368 744 -359Q738 -350 733 -342L726 -336L723 -333H724Q708 -308 690 -278Q673 -248 659 -219Q654 -204 652 -198Q649 -192 650 -190H649Q655 -189 662 -190Q668 -191 687 -198Q701 -201 706 -201Q712 -201 719 -205Q723 -205 727 -206Q731 -208 731 -210H735Q735 -213 736 -218Q736 -224 736 -225L743 -244L755 -266Q759 -274 764 -284Q768 -295 775 -308L798 -370Q806 -390 814 -392Q822 -393 827 -393Q832 -393 839 -390Q846 -387 847 -374V-380Q852 -373 863 -361Q874 -349 870 -339Q868 -332 866 -326Q863 -319 861 -314L858 -305L852 -292Q848 -287 848 -284Q847 -281 845 -277Q834 -250 818 -212Q802 -173 788 -138Q775 -102 769 -82Q754 -33 750 -15Q746 3 752 14Q753 32 738 46Q723 59 706 62Q689 64 684 50Z"],"¿":[374,"M145 230Q139 229 132 230Q124 230 124 226Q121 226 112 226Q103 226 95 226Q83 222 66 213Q49 204 34 193Q19 182 12 174Q5 152 6 120Q7 87 16 51Q25 15 40 -18Q54 -50 74 -72Q80 -78 96 -92Q112 -107 130 -123Q148 -139 158 -151Q193 -170 218 -208Q244 -246 257 -282Q268 -306 281 -314Q294 -322 307 -322Q323 -321 330 -309Q337 -297 337 -285Q337 -284 339 -274Q341 -263 339 -255Q339 -249 333 -236Q327 -223 320 -205Q309 -186 286 -160Q264 -135 247 -123Q238 -116 234 -114Q230 -111 230 -111Q230 -107 216 -96Q202 -85 192 -80Q192 -80 180 -71Q167 -62 159 -55Q137 -32 126 -12Q115 7 109 32Q103 56 95 94Q94 128 98 137Q103 146 115 155Q140 159 163 153Q186 147 206 128Q225 109 240 76Q246 59 246 53Q247 47 244 37Q244 29 242 18Q239 7 239 2Q244 1 256 -2Q267 -6 281 -6Q295 -5 307 6Q307 6 314 16Q322 25 324 30Q330 38 330 46Q329 53 329 68Q323 88 310 113Q298 138 280 161Q261 184 235 197Q214 206 196 216Q178 227 178 227Q178 227 170 228Q163 228 145 230ZM316 -407Q282 -428 286 -454Q290 -479 330 -499Q351 -507 366 -506Q380 -506 396 -493Q416 -474 410 -454Q403 -433 374 -413Q355 -400 345 -400Q336 -399 316 -407Z"],"À":[502,"M57 33Q39 23 38 11Q36 -1 51 -31Q66 -61 98 -124Q122 -169 130 -194Q139 -220 140 -231Q141 -242 141 -245Q139 -254 143 -260Q147 -265 156 -269Q161 -274 179 -287Q197 -300 207 -318Q216 -339 227 -361Q239 -383 258 -416Q277 -450 309 -504Q329 -539 356 -583Q384 -627 411 -663Q422 -677 434 -685Q446 -693 455 -693Q477 -693 499 -682Q521 -670 538 -653Q555 -636 561 -621Q566 -613 565 -587Q564 -561 561 -524Q558 -487 554 -445Q551 -404 545 -348Q539 -292 534 -231Q528 -170 525 -114Q522 -57 525 -15Q526 -6 525 2Q524 10 524 15Q518 21 498 20Q478 20 459 14Q440 8 438 -1Q435 -4 434 -6Q433 -8 434 -26Q435 -43 437 -90L442 -243L429 -242Q420 -242 396 -240Q373 -238 345 -234Q318 -231 295 -228Q272 -224 263 -221Q254 -221 242 -209Q229 -197 218 -178Q214 -164 204 -148Q193 -133 193 -128Q186 -123 182 -116Q177 -109 177 -109Q177 -103 168 -80Q160 -56 146 -28Q133 1 119 22L92 60ZM296 -311Q296 -311 307 -313Q318 -315 334 -318Q349 -320 361 -320Q384 -326 400 -329Q415 -332 425 -332Q435 -333 441 -330Q445 -325 448 -324Q452 -323 452 -323Q453 -325 456 -344Q459 -363 463 -391Q467 -419 471 -450Q475 -480 478 -506Q481 -533 482 -548Q483 -567 481 -582Q479 -598 479 -598Q473 -598 456 -576Q440 -555 418 -520Q397 -484 376 -443Q366 -424 357 -413Q349 -402 344 -402Q342 -400 334 -387Q325 -373 316 -356Q306 -340 300 -326Q293 -313 296 -311ZM543 -704Q533 -699 530 -708Q526 -716 524 -730Q521 -743 514 -753Q504 -772 490 -793Q477 -814 471 -834Q465 -853 476 -865Q498 -888 510 -889Q521 -890 531 -879Q538 -875 548 -856Q557 -838 566 -815Q576 -792 582 -773Q589 -754 589 -748Q590 -744 575 -727Q560 -710 543 -704Z"],"Á":[502,"M57 33Q39 23 38 11Q36 -1 51 -31Q66 -61 98 -124Q122 -169 130 -194Q139 -220 140 -231Q141 -242 141 -245Q139 -254 143 -260Q147 -265 156 -269Q161 -274 179 -287Q197 -300 207 -318Q216 -339 227 -361Q239 -383 258 -416Q277 -450 309 -504Q329 -539 356 -583Q384 -627 411 -663Q422 -677 434 -685Q446 -693 455 -693Q477 -693 499 -682Q521 -670 538 -653Q555 -636 561 -621Q566 -613 565 -587Q564 -561 561 -524Q558 -487 554 -445Q551 -404 545 -348Q539 -292 534 -231Q528 -170 525 -114Q522 -57 525 -15Q526 -6 525 2Q524 10 524 15Q518 21 498 20Q478 20 459 14Q440 8 438 -1Q435 -4 434 -6Q433 -8 434 -26Q435 -43 437 -90L442 -243L429 -242Q420 -242 396 -240Q373 -238 345 -234Q318 -231 295 -228Q272 -224 263 -221Q254 -221 242 -209Q229 -197 218 -178Q214 -164 204 -148Q193 -133 193 -128Q186 -123 182 -116Q177 -109 177 -109Q177 -103 168 -80Q160 -56 146 -28Q133 1 119 22L92 60ZM296 -311Q296 -311 307 -313Q318 -315 334 -318Q349 -320 361 -320Q384 -326 400 -329Q415 -332 425 -332Q435 -333 441 -330Q445 -325 448 -324Q452 -323 452 -323Q453 -325 456 -344Q459 -363 463 -391Q467 -419 471 -450Q475 -480 478 -506Q481 -533 482 -548Q483 -567 481 -582Q479 -598 479 -598Q473 -598 456 -576Q440 -555 418 -520Q397 -484 376 -443Q366 -424 357 -413Q349 -402 344 -402Q342 -400 334 -387Q325 -373 316 -356Q306 -340 300 -326Q293 -313 296 -311ZM480 -714Q473 -721 470 -732Q466 -742 467 -767Q468 -772 480 -787Q493 -802 510 -821Q528 -840 546 -855Q564 -870 575 -874Q588 -879 602 -864Q617 -849 618 -826Q620 -818 609 -806Q598 -793 581 -780Q564 -766 548 -752Q532 -739 524 -728Q514 -712 502 -710Q491 -707 480 -714Z"],"Â":[502,"M57 33Q39 23 38 11Q36 -1 51 -31Q66 -61 98 -124Q122 -169 130 -194Q139 -220 140 -231Q141 -242 141 -245Q139 -254 143 -260Q147 -265 156 -269Q161 -274 179 -287Q197 -300 207 -318Q216 -339 227 -361Q239 -383 258 -416Q277 -450 309 -504Q329 -539 356 -583Q384 -627 411 -663Q422 -677 434 -685Q446 -693 455 -693Q477 -693 499 -682Q521 -670 538 -653Q555 -636 561 -621Q566 -613 565 -587Q564 -561 561 -524Q558 -487 554 -445Q551 -404 545 -348Q539 -292 534 -231Q528 -170 525 -114Q522 -57 525 -15Q526 -6 525 2Q524 10 524 15Q518 21 498 20Q478 20 459 14Q440 8 438 -1Q435 -4 434 -6Q433 -8 434 -26Q435 -43 437 -90L442 -243L429 -242Q420 -242 396 -240Q373 -238 345 -234Q318 -231 295 -228Q272 -224 263 -221Q254 -221 242 -209Q229 -197 218 -178Q214 -164 204 -148Q193 -133 193 -128Q186 -123 182 -116Q177 -109 177 -109Q177 -103 168 -80Q160 -56 146 -28Q133 1 119 22L92 60ZM296 -311Q296 -311 307 -313Q318 -315 334 -318Q349 -320 361 -320Q384 -326 400 -329Q415 -332 425 -332Q435 -333 441 -330Q445 -325 448 -324Q452 -323 452 -323Q453 -325 456 -344Q459 -363 463 -391Q467 -419 471 -450Q475 -480 478 -506Q481 -533 482 -548Q483 -567 481 -582Q479 -598 479 -598Q473 -598 456 -576Q440 -555 418 -520Q397 -484 376 -443Q366 -424 357 -413Q349 -402 344 -402Q342 -400 334 -387Q325 -373 316 -356Q306 -340 300 -326Q293 -313 296 -311ZM427 -727Q410 -710 396 -716Q382 -721 378 -738Q373 -754 382 -768Q385 -772 398 -784Q410 -795 427 -810Q444 -825 460 -838Q477 -850 487 -856Q500 -867 514 -864Q527 -862 533 -853Q545 -843 562 -826Q579 -810 595 -794Q611 -777 618 -767Q624 -755 620 -742Q617 -729 607 -721Q597 -713 584 -714Q571 -716 558 -733Q551 -739 536 -754Q521 -770 506 -783Q494 -776 478 -765Q462 -754 448 -744Q434 -733 427 -727Z"],"Ã":[502,"M57 33Q39 23 38 11Q36 -1 51 -31Q66 -61 98 -124Q122 -169 130 -194Q139 -220 140 -231Q141 -242 141 -245Q139 -254 143 -260Q147 -265 156 -269Q161 -274 179 -287Q197 -300 207 -318Q216 -339 227 -361Q239 -383 258 -416Q277 -450 309 -504Q329 -539 356 -583Q384 -627 411 -663Q422 -677 434 -685Q446 -693 455 -693Q477 -693 499 -682Q521 -670 538 -653Q555 -636 561 -621Q566 -613 565 -587Q564 -561 561 -524Q558 -487 554 -445Q551 -404 545 -348Q539 -292 534 -231Q528 -170 525 -114Q522 -57 525 -15Q526 -6 525 2Q524 10 524 15Q518 21 498 20Q478 20 459 14Q440 8 438 -1Q435 -4 434 -6Q433 -8 434 -26Q435 -43 437 -90L442 -243L429 -242Q420 -242 396 -240Q373 -238 345 -234Q318 -231 295 -228Q272 -224 263 -221Q254 -221 242 -209Q229 -197 218 -178Q214 -164 204 -148Q193 -133 193 -128Q186 -123 182 -116Q177 -109 177 -109Q177 -103 168 -80Q160 -56 146 -28Q133 1 119 22L92 60ZM296 -311Q296 -311 307 -313Q318 -315 334 -318Q349 -320 361 -320Q384 -326 400 -329Q415 -332 425 -332Q435 -333 441 -330Q445 -325 448 -324Q452 -323 452 -323Q453 -325 456 -344Q459 -363 463 -391Q467 -419 471 -450Q475 -480 478 -506Q481 -533 482 -548Q483 -567 481 -582Q479 -598 479 -598Q473 -598 456 -576Q440 -555 418 -520Q397 -484 376 -443Q366 -424 357 -413Q349 -402 344 -402Q342 -400 334 -387Q325 -373 316 -356Q306 -340 300 -326Q293 -313 296 -311ZM571 -726Q557 -726 541 -734Q525 -742 507 -757Q498 -762 484 -776Q471 -789 459 -789Q449 -789 442 -781Q436 -773 430 -765Q425 -757 414 -755Q411 -748 408 -742Q404 -735 396 -740Q386 -742 379 -750Q372 -758 369 -777Q377 -800 394 -820Q411 -841 436 -854Q468 -862 486 -854Q503 -846 519 -829Q543 -810 556 -807Q569 -804 588 -812Q603 -816 618 -825Q632 -834 653 -842Q660 -845 668 -838Q675 -831 680 -821Q684 -811 683 -805Q682 -793 673 -782Q664 -772 655 -767Q625 -750 608 -741Q591 -732 583 -729Q575 -726 571 -726Z"],"Ä":[502,"M57 33Q39 23 38 11Q36 -1 51 -31Q66 -61 98 -124Q122 -169 130 -194Q139 -220 140 -231Q141 -242 141 -245Q139 -254 143 -260Q147 -265 156 -269Q161 -274 179 -287Q197 -300 207 -318Q216 -339 227 -361Q239 -383 258 -416Q277 -450 309 -504Q329 -539 356 -583Q384 -627 411 -663Q422 -677 434 -685Q446 -693 455 -693Q477 -693 499 -682Q521 -670 538 -653Q555 -636 561 -621Q566 -613 565 -587Q564 -561 561 -524Q558 -487 554 -445Q551 -404 545 -348Q539 -292 534 -231Q528 -170 525 -114Q522 -57 525 -15Q526 -6 525 2Q524 10 524 15Q518 21 498 20Q478 20 459 14Q440 8 438 -1Q435 -4 434 -6Q433 -8 434 -26Q435 -43 437 -90L442 -243L429 -242Q420 -242 396 -240Q373 -238 345 -234Q318 -231 295 -228Q272 -224 263 -221Q254 -221 242 -209Q229 -197 218 -178Q214 -164 204 -148Q193 -133 193 -128Q186 -123 182 -116Q177 -109 177 -109Q177 -103 168 -80Q160 -56 146 -28Q133 1 119 22L92 60ZM296 -311Q296 -311 307 -313Q318 -315 334 -318Q349 -320 361 -320Q384 -326 400 -329Q415 -332 425 -332Q435 -333 441 -330Q445 -325 448 -324Q452 -323 452 -323Q453 -325 456 -344Q459 -363 463 -391Q467 -419 471 -450Q475 -480 478 -506Q481 -533 482 -548Q483 -567 481 -582Q479 -598 479 -598Q473 -598 456 -576Q440 -555 418 -520Q397 -484 376 -443Q366 -424 357 -413Q349 -402 344 -402Q342 -400 334 -387Q325 -373 316 -356Q306 -340 300 -326Q293 -313 296 -311ZM574 -746Q567 -753 562 -768Q557 -784 558 -788Q560 -793 566 -809Q572 -825 576 -829Q581 -836 592 -848Q603 -859 607 -860Q618 -872 634 -866Q650 -860 658 -844Q677 -821 670 -800Q663 -778 643 -758Q623 -727 606 -729Q588 -731 574 -746ZM430 -736Q416 -746 409 -763Q402 -780 404 -787Q406 -801 417 -821Q428 -841 435 -847Q438 -849 444 -854Q451 -859 456 -862Q469 -871 480 -866Q492 -860 500 -848Q509 -837 512 -826Q519 -813 514 -796Q508 -780 492 -763Q476 -742 462 -734Q447 -725 430 -736Z"],"Å":[502,"M57 33Q39 23 38 11Q36 -1 51 -31Q66 -61 98 -124Q122 -169 130 -194Q139 -220 140 -231Q141 -242 141 -245Q139 -254 143 -260Q147 -265 156 -269Q161 -274 179 -287Q197 -300 207 -318Q216 -339 227 -361Q239 -383 258 -416Q277 -450 309 -504Q329 -539 356 -583Q384 -627 411 -663Q422 -677 434 -685Q446 -693 455 -693Q477 -693 499 -682Q521 -670 538 -653Q555 -636 561 -621Q566 -613 565 -587Q564 -561 561 -524Q558 -487 554 -445Q551 -404 545 -348Q539 -292 534 -231Q528 -170 525 -114Q522 -57 525 -15Q526 -6 525 2Q524 10 524 15Q518 21 498 20Q478 20 459 14Q440 8 438 -1Q435 -4 434 -6Q433 -8 434 -26Q435 -43 437 -90L442 -243L429 -242Q420 -242 396 -240Q373 -238 345 -234Q318 -231 295 -228Q272 -224 263 -221Q254 -221 242 -209Q229 -197 218 -178Q214 -164 204 -148Q193 -133 193 -128Q186 -123 182 -116Q177 -109 177 -109Q177 -103 168 -80Q160 -56 146 -28Q133 1 119 22L92 60ZM296 -311Q296 -311 307 -313Q318 -315 334 -318Q349 -320 361 -320Q384 -326 400 -329Q415 -332 425 -332Q435 -333 441 -330Q445 -325 448 -324Q452 -323 452 -323Q453 -325 456 -344Q459 -363 463 -391Q467 -419 471 -450Q475 -480 478 -506Q481 -533 482 -548Q483 -567 481 -582Q479 -598 479 -598Q473 -598 456 -576Q440 -555 418 -520Q397 -484 376 -443Q366 -424 357 -413Q349 -402 344 -402Q342 -400 334 -387Q325 -373 316 -356Q306 -340 300 -326Q293 -313 296 -311ZM529 -685Q495 -685 479 -704Q463 -724 455 -759Q454 -791 465 -817Q476 -843 495 -858Q514 -874 536 -874Q580 -873 600 -854Q620 -835 620 -806Q618 -770 606 -742Q593 -715 574 -700Q554 -685 529 -685ZM531 -743Q549 -743 556 -755Q563 -767 564 -780Q564 -795 559 -805Q554 -815 539 -814Q508 -812 509 -774Q509 -764 516 -754Q523 -743 531 -743Z"],"Æ":[784,"M560 50Q520 50 498 44Q475 38 449 18Q429 3 418 -22Q408 -47 406 -75Q404 -103 409 -127Q412 -150 417 -170Q422 -191 426 -203H414Q393 -202 357 -204Q321 -206 271 -209L254 -188Q247 -179 236 -162Q225 -146 214 -125Q204 -106 187 -78Q170 -51 151 -28Q130 3 120 10Q109 18 104 18Q92 18 86 14Q79 11 71 4Q54 -6 55 -25Q56 -44 81 -73Q87 -80 92 -87Q96 -94 96 -94Q100 -102 110 -120Q121 -139 134 -159Q147 -179 158 -194Q169 -210 174 -212Q197 -233 178 -252Q171 -255 172 -269Q173 -283 184 -296Q195 -308 217 -306Q225 -309 232 -311Q238 -313 238 -316Q239 -321 245 -332Q251 -342 260 -356Q268 -369 278 -382Q287 -394 295 -403Q310 -431 316 -440Q321 -449 327 -458Q333 -463 346 -480Q359 -498 370 -514Q386 -528 398 -544Q410 -559 420 -570Q426 -581 436 -592Q445 -604 458 -618Q480 -639 498 -642Q517 -645 530 -645Q545 -645 571 -640Q597 -634 625 -624Q651 -635 688 -643Q725 -651 747 -652Q753 -656 774 -658Q795 -660 822 -660Q850 -660 873 -658Q895 -658 908 -652Q921 -645 934 -639Q956 -622 956 -610Q957 -599 950 -594Q944 -589 944 -589Q940 -588 930 -586Q920 -584 898 -583Q876 -582 835 -582Q821 -582 802 -579Q784 -576 768 -573Q751 -570 744 -570Q734 -566 716 -565Q697 -564 693 -564Q691 -564 684 -553Q677 -542 670 -527Q662 -512 656 -499Q650 -486 650 -483Q650 -473 642 -458Q633 -444 622 -428Q612 -415 610 -402Q608 -389 617 -385Q633 -388 651 -390Q669 -393 687 -395Q705 -397 720 -397Q746 -401 766 -402Q787 -402 793 -397Q806 -395 810 -384Q813 -373 808 -362Q804 -351 792 -346Q787 -342 766 -335Q746 -328 718 -320Q689 -313 660 -306Q631 -300 608 -296Q584 -291 574 -291Q566 -298 560 -289Q553 -280 542 -233Q531 -208 525 -194Q519 -179 516 -163Q512 -147 506 -116Q502 -101 508 -78Q515 -54 547 -39Q567 -35 590 -36Q614 -36 657 -47Q675 -58 692 -68Q709 -77 716 -81Q721 -81 732 -86Q742 -90 746 -90Q751 -95 756 -98Q761 -102 768 -102Q770 -102 780 -88Q790 -74 799 -59Q808 -44 807 -41Q807 -31 771 -14Q735 4 685 24Q660 35 644 41Q628 47 610 48Q592 50 560 50ZM332 -287Q332 -287 346 -290Q359 -292 387 -291Q406 -293 424 -293Q443 -293 456 -292Q458 -298 462 -304Q467 -309 469 -316Q472 -322 473 -332Q474 -341 475 -343Q475 -343 479 -350Q483 -358 487 -368Q491 -378 494 -386Q497 -393 500 -397Q505 -402 510 -413Q516 -424 521 -434Q541 -472 552 -490Q564 -509 571 -525Q558 -532 542 -533Q527 -534 506 -532Q502 -535 492 -526Q482 -517 469 -504Q456 -490 445 -476Q434 -462 429 -454Q425 -449 410 -426Q394 -403 377 -379Q351 -341 340 -322Q329 -304 328 -297Q327 -290 332 -287Z"],"Ç":[482,"M217 66Q202 60 182 50Q162 39 144 22Q126 5 116 -19Q106 -48 102 -76Q99 -104 100 -141Q100 -193 108 -232Q115 -270 131 -310Q133 -313 138 -328Q144 -342 152 -359Q159 -376 163 -385Q171 -402 188 -430Q204 -459 223 -486Q252 -529 272 -556Q292 -584 310 -603Q329 -622 352 -640Q374 -658 408 -681Q430 -697 464 -701Q499 -705 532 -690Q565 -676 581 -636Q592 -615 591 -584Q590 -552 579 -516Q568 -481 551 -450Q534 -419 513 -400Q500 -388 478 -396Q457 -404 443 -417Q434 -434 434 -437Q433 -440 437 -441Q443 -448 453 -465Q463 -482 473 -502Q483 -521 487 -533Q495 -575 498 -588Q501 -602 492 -611Q488 -615 480 -614Q473 -613 456 -604Q433 -594 402 -564Q370 -533 339 -491Q299 -438 272 -397Q245 -356 231 -313Q229 -309 224 -298Q220 -287 220 -287Q221 -283 217 -268Q213 -252 208 -241Q197 -195 195 -152Q193 -110 200 -78Q208 -47 223 -32Q236 -23 256 -26Q276 -29 302 -40Q328 -51 358 -64Q382 -74 402 -86Q422 -98 432 -107Q440 -113 452 -120Q465 -126 474 -126Q488 -131 495 -118Q502 -105 502 -85Q502 -71 482 -51Q462 -31 438 -17Q430 -9 416 -2Q403 4 389 9Q368 25 337 40Q306 55 274 63Q243 71 217 66ZM237 265Q222 268 197 264Q172 259 150 253Q129 247 123 245Q111 241 105 230Q99 218 100 206Q101 194 111 188Q121 181 143 187Q159 191 178 198Q196 204 211 204Q226 204 233 190Q240 179 232 168Q224 156 213 144Q206 135 200 128Q193 122 182 112Q174 101 172 86Q171 72 188 54Q205 36 253 12L309 42Q284 54 268 65Q253 76 253 89Q267 109 284 128Q301 146 306 166Q312 190 302 211Q293 232 275 246Q257 261 237 265Z"],"È":[548,"M235 39Q204 37 173 16Q142 -4 116 -22Q99 -39 90 -58Q81 -78 75 -110Q71 -129 75 -160Q79 -191 88 -222Q97 -254 105 -272Q117 -300 136 -332Q154 -365 172 -394Q191 -424 202 -442Q209 -449 208 -450Q208 -450 208 -450Q208 -455 218 -476Q229 -496 237 -512Q252 -528 254 -538Q256 -548 251 -554Q249 -558 260 -571Q270 -584 289 -600Q308 -617 331 -630Q355 -649 378 -650Q400 -652 404 -641Q404 -638 416 -640Q427 -641 442 -644Q458 -648 470 -650Q475 -656 494 -660Q512 -663 537 -666Q550 -665 566 -666Q582 -666 594 -667Q607 -668 607 -668Q614 -670 628 -660Q641 -649 649 -631Q656 -613 637 -600Q618 -587 577 -582Q547 -578 530 -576Q514 -573 495 -570Q477 -566 442 -558Q417 -553 400 -550Q383 -547 370 -538Q358 -529 343 -506Q336 -501 325 -480Q314 -459 303 -438Q275 -399 262 -380Q248 -362 252 -357Q252 -357 266 -354Q280 -351 284 -351Q294 -356 308 -358Q323 -360 332 -362Q394 -378 424 -386Q453 -393 466 -396Q478 -399 488 -400Q502 -411 516 -398Q531 -386 537 -369Q544 -349 537 -338Q530 -327 506 -320Q483 -313 440 -304Q397 -294 332 -276Q277 -260 243 -257Q209 -254 211 -274Q204 -278 196 -266Q187 -255 180 -235Q173 -215 168 -192Q162 -169 161 -149Q160 -129 164 -118Q172 -95 190 -78Q207 -62 241 -52Q261 -51 280 -49Q299 -47 323 -57Q382 -67 405 -78Q428 -89 433 -93Q441 -97 444 -101Q446 -105 451 -105Q448 -100 453 -105Q458 -110 469 -119Q490 -137 511 -141Q532 -145 546 -142Q560 -138 561 -133Q567 -123 555 -102Q543 -80 518 -56Q494 -32 461 -13Q408 15 346 26Q284 38 235 39ZM565 -704Q555 -699 552 -708Q548 -716 546 -730Q543 -743 536 -753Q526 -772 512 -793Q499 -814 493 -834Q487 -853 498 -865Q520 -888 532 -889Q543 -890 553 -879Q560 -875 570 -856Q579 -838 588 -815Q598 -792 604 -773Q611 -754 611 -748Q612 -744 597 -727Q582 -710 565 -704Z"],"É":[548,"M235 39Q204 37 173 16Q142 -4 116 -22Q99 -39 90 -58Q81 -78 75 -110Q71 -129 75 -160Q79 -191 88 -222Q97 -254 105 -272Q117 -300 136 -332Q154 -365 172 -394Q191 -424 202 -442Q209 -449 208 -450Q208 -450 208 -450Q208 -455 218 -476Q229 -496 237 -512Q252 -528 254 -538Q256 -548 251 -554Q249 -558 260 -571Q270 -584 289 -600Q308 -617 331 -630Q355 -649 378 -650Q400 -652 404 -641Q404 -638 416 -640Q427 -641 442 -644Q458 -648 470 -650Q475 -656 494 -660Q512 -663 537 -666Q550 -665 566 -666Q582 -666 594 -667Q607 -668 607 -668Q614 -670 628 -660Q641 -649 649 -631Q656 -613 637 -600Q618 -587 577 -582Q547 -578 530 -576Q514 -573 495 -570Q477 -566 442 -558Q417 -553 400 -550Q383 -547 370 -538Q358 -529 343 -506Q336 -501 325 -480Q314 -459 303 -438Q275 -399 262 -380Q248 -362 252 -357Q252 -357 266 -354Q280 -351 284 -351Q294 -356 308 -358Q323 -360 332 -362Q394 -378 424 -386Q453 -393 466 -396Q478 -399 488 -400Q502 -411 516 -398Q531 -386 537 -369Q544 -349 537 -338Q530 -327 506 -320Q483 -313 440 -304Q397 -294 332 -276Q277 -260 243 -257Q209 -254 211 -274Q204 -278 196 -266Q187 -255 180 -235Q173 -215 168 -192Q162 -169 161 -149Q160 -129 164 -118Q172 -95 190 -78Q207 -62 241 -52Q261 -51 280 -49Q299 -47 323 -57Q382 -67 405 -78Q428 -89 433 -93Q441 -97 444 -101Q446 -105 451 -105Q448 -100 453 -105Q458 -110 469 -119Q490 -137 511 -141Q532 -145 546 -142Q560 -138 561 -133Q567 -123 555 -102Q543 -80 518 -56Q494 -32 461 -13Q408 15 346 26Q284 38 235 39ZM502 -714Q495 -721 492 -732Q488 -742 489 -767Q490 -772 502 -787Q515 -802 532 -821Q550 -840 568 -855Q586 -870 597 -874Q610 -879 624 -864Q639 -849 640 -826Q642 -818 631 -806Q620 -793 603 -780Q586 -766 570 -752Q554 -739 546 -728Q536 -712 524 -710Q513 -707 502 -714Z"],"Ê":[548,"M235 39Q204 37 173 16Q142 -4 116 -22Q99 -39 90 -58Q81 -78 75 -110Q71 -129 75 -160Q79 -191 88 -222Q97 -254 105 -272Q117 -300 136 -332Q154 -365 172 -394Q191 -424 202 -442Q209 -449 208 -450Q208 -450 208 -450Q208 -455 218 -476Q229 -496 237 -512Q252 -528 254 -538Q256 -548 251 -554Q249 -558 260 -571Q270 -584 289 -600Q308 -617 331 -630Q355 -649 378 -650Q400 -652 404 -641Q404 -638 416 -640Q427 -641 442 -644Q458 -648 470 -650Q475 -656 494 -660Q512 -663 537 -666Q550 -665 566 -666Q582 -666 594 -667Q607 -668 607 -668Q614 -670 628 -660Q641 -649 649 -631Q656 -613 637 -600Q618 -587 577 -582Q547 -578 530 -576Q514 -573 495 -570Q477 -566 442 -558Q417 -553 400 -550Q383 -547 370 -538Q358 -529 343 -506Q336 -501 325 -480Q314 -459 303 -438Q275 -399 262 -380Q248 -362 252 -357Q252 -357 266 -354Q280 -351 284 -351Q294 -356 308 -358Q323 -360 332 -362Q394 -378 424 -386Q453 -393 466 -396Q478 -399 488 -400Q502 -411 516 -398Q531 -386 537 -369Q544 -349 537 -338Q530 -327 506 -320Q483 -313 440 -304Q397 -294 332 -276Q277 -260 243 -257Q209 -254 211 -274Q204 -278 196 -266Q187 -255 180 -235Q173 -215 168 -192Q162 -169 161 -149Q160 -129 164 -118Q172 -95 190 -78Q207 -62 241 -52Q261 -51 280 -49Q299 -47 323 -57Q382 -67 405 -78Q428 -89 433 -93Q441 -97 444 -101Q446 -105 451 -105Q448 -100 453 -105Q458 -110 469 -119Q490 -137 511 -141Q532 -145 546 -142Q560 -138 561 -133Q567 -123 555 -102Q543 -80 518 -56Q494 -32 461 -13Q408 15 346 26Q284 38 235 39ZM489 -727Q472 -710 458 -716Q444 -721 440 -738Q435 -754 444 -768Q447 -772 460 -784Q472 -795 489 -810Q506 -825 522 -838Q539 -850 549 -856Q562 -867 576 -864Q589 -862 595 -853Q607 -843 624 -826Q641 -810 657 -794Q673 -777 680 -767Q686 -755 682 -742Q679 -729 669 -721Q659 -713 646 -714Q633 -716 620 -733Q613 -739 598 -754Q583 -770 568 -783Q556 -776 540 -765Q524 -754 510 -744Q496 -733 489 -727Z"],"Ë":[548,"M235 39Q204 37 173 16Q142 -4 116 -22Q99 -39 90 -58Q81 -78 75 -110Q71 -129 75 -160Q79 -191 88 -222Q97 -254 105 -272Q117 -300 136 -332Q154 -365 172 -394Q191 -424 202 -442Q209 -449 208 -450Q208 -450 208 -450Q208 -455 218 -476Q229 -496 237 -512Q252 -528 254 -538Q256 -548 251 -554Q249 -558 260 -571Q270 -584 289 -600Q308 -617 331 -630Q355 -649 378 -650Q400 -652 404 -641Q404 -638 416 -640Q427 -641 442 -644Q458 -648 470 -650Q475 -656 494 -660Q512 -663 537 -666Q550 -665 566 -666Q582 -666 594 -667Q607 -668 607 -668Q614 -670 628 -660Q641 -649 649 -631Q656 -613 637 -600Q618 -587 577 -582Q547 -578 530 -576Q514 -573 495 -570Q477 -566 442 -558Q417 -553 400 -550Q383 -547 370 -538Q358 -529 343 -506Q336 -501 325 -480Q314 -459 303 -438Q275 -399 262 -380Q248 -362 252 -357Q252 -357 266 -354Q280 -351 284 -351Q294 -356 308 -358Q323 -360 332 -362Q394 -378 424 -386Q453 -393 466 -396Q478 -399 488 -400Q502 -411 516 -398Q531 -386 537 -369Q544 -349 537 -338Q530 -327 506 -320Q483 -313 440 -304Q397 -294 332 -276Q277 -260 243 -257Q209 -254 211 -274Q204 -278 196 -266Q187 -255 180 -235Q173 -215 168 -192Q162 -169 161 -149Q160 -129 164 -118Q172 -95 190 -78Q207 -62 241 -52Q261 -51 280 -49Q299 -47 323 -57Q382 -67 405 -78Q428 -89 433 -93Q441 -97 444 -101Q446 -105 451 -105Q448 -100 453 -105Q458 -110 469 -119Q490 -137 511 -141Q532 -145 546 -142Q560 -138 561 -133Q567 -123 555 -102Q543 -80 518 -56Q494 -32 461 -13Q408 15 346 26Q284 38 235 39ZM596 -746Q589 -753 584 -768Q579 -784 580 -788Q582 -793 588 -809Q594 -825 598 -829Q603 -836 614 -848Q625 -859 629 -860Q640 -872 656 -866Q672 -860 680 -844Q699 -821 692 -800Q685 -778 665 -758Q645 -727 628 -729Q610 -731 596 -746ZM452 -736Q438 -746 431 -763Q424 -780 426 -787Q428 -801 439 -821Q450 -841 457 -847Q460 -849 466 -854Q473 -859 478 -862Q491 -871 502 -866Q514 -860 522 -848Q531 -837 534 -826Q541 -813 536 -796Q530 -780 514 -763Q498 -742 484 -734Q469 -725 452 -736Z"],"Ì":[400,"M177 41Q170 30 153 27Q136 24 101 26Q87 28 72 24Q57 20 48 12Q39 4 41 -4Q42 -16 69 -30Q96 -44 139 -45L181 -46L191 -66Q195 -77 198 -90Q200 -103 207 -126Q211 -140 219 -165Q227 -190 236 -219Q245 -247 252 -270Q259 -293 261 -302Q265 -311 272 -332Q279 -354 286 -376Q292 -399 294 -409Q320 -488 328 -520Q336 -551 332 -552Q328 -552 313 -551Q298 -550 280 -548Q262 -547 248 -545Q234 -543 231 -541Q226 -534 214 -544Q202 -553 199 -563Q198 -572 199 -580Q200 -588 205 -591Q212 -597 234 -604Q256 -612 283 -618Q311 -624 334 -627Q351 -629 368 -634Q385 -640 395 -648Q404 -651 412 -653Q421 -655 430 -654Q438 -649 458 -649Q477 -649 499 -650Q555 -655 578 -646Q600 -638 607 -624Q612 -605 605 -592Q598 -580 581 -581Q572 -579 556 -578Q540 -576 514 -575Q448 -569 443 -561Q439 -557 436 -553Q434 -549 430 -544Q431 -540 426 -520Q420 -501 412 -479Q408 -466 400 -442Q392 -418 384 -392Q375 -367 368 -346Q361 -326 358 -319Q354 -310 352 -300Q349 -289 348 -284Q334 -235 324 -202Q315 -169 308 -145Q301 -120 295 -98Q289 -75 281 -47Q281 -47 298 -48Q315 -50 341 -52Q388 -57 405 -58Q422 -59 425 -56Q428 -52 431 -43Q451 -16 428 2Q406 20 350 19Q298 21 274 22Q249 24 242 27Q235 30 235 37Q236 53 216 56Q195 60 177 41ZM464 -704Q454 -699 450 -708Q447 -716 444 -730Q442 -743 435 -753Q425 -772 412 -793Q398 -814 392 -834Q386 -853 397 -865Q419 -888 430 -889Q442 -890 452 -879Q459 -875 468 -856Q478 -838 488 -815Q497 -792 504 -773Q510 -754 510 -748Q511 -744 496 -727Q481 -710 464 -704Z"],"Í":[400,"M177 41Q170 30 153 27Q136 24 101 26Q87 28 72 24Q57 20 48 12Q39 4 41 -4Q42 -16 69 -30Q96 -44 139 -45L181 -46L191 -66Q195 -77 198 -90Q200 -103 207 -126Q211 -140 219 -165Q227 -190 236 -219Q245 -247 252 -270Q259 -293 261 -302Q265 -311 272 -332Q279 -354 286 -376Q292 -399 294 -409Q320 -488 328 -520Q336 -551 332 -552Q328 -552 313 -551Q298 -550 280 -548Q262 -547 248 -545Q234 -543 231 -541Q226 -534 214 -544Q202 -553 199 -563Q198 -572 199 -580Q200 -588 205 -591Q212 -597 234 -604Q256 -612 283 -618Q311 -624 334 -627Q351 -629 368 -634Q385 -640 395 -648Q404 -651 412 -653Q421 -655 430 -654Q438 -649 458 -649Q477 -649 499 -650Q555 -655 578 -646Q600 -638 607 -624Q612 -605 605 -592Q598 -580 581 -581Q572 -579 556 -578Q540 -576 514 -575Q448 -569 443 -561Q439 -557 436 -553Q434 -549 430 -544Q431 -540 426 -520Q420 -501 412 -479Q408 -466 400 -442Q392 -418 384 -392Q375 -367 368 -346Q361 -326 358 -319Q354 -310 352 -300Q349 -289 348 -284Q334 -235 324 -202Q315 -169 308 -145Q301 -120 295 -98Q289 -75 281 -47Q281 -47 298 -48Q315 -50 341 -52Q388 -57 405 -58Q422 -59 425 -56Q428 -52 431 -43Q451 -16 428 2Q406 20 350 19Q298 21 274 22Q249 24 242 27Q235 30 235 37Q236 53 216 56Q195 60 177 41ZM401 -714Q394 -721 390 -732Q387 -742 388 -767Q389 -772 402 -787Q414 -802 432 -821Q449 -840 467 -855Q485 -870 496 -874Q509 -879 524 -864Q538 -849 539 -826Q541 -818 530 -806Q519 -793 502 -780Q485 -766 469 -752Q453 -739 445 -728Q435 -712 424 -710Q412 -707 401 -714Z"],"Î":[400,"M177 41Q170 30 153 27Q136 24 101 26Q87 28 72 24Q57 20 48 12Q39 4 41 -4Q42 -16 69 -30Q96 -44 139 -45L181 -46L191 -66Q195 -77 198 -90Q200 -103 207 -126Q211 -140 219 -165Q227 -190 236 -219Q245 -247 252 -270Q259 -293 261 -302Q265 -311 272 -332Q279 -354 286 -376Q292 -399 294 -409Q320 -488 328 -520Q336 -551 332 -552Q328 -552 313 -551Q298 -550 280 -548Q262 -547 248 -545Q234 -543 231 -541Q226 -534 214 -544Q202 -553 199 -563Q198 -572 199 -580Q200 -588 205 -591Q212 -597 234 -604Q256 -612 283 -618Q311 -624 334 -627Q351 -629 368 -634Q385 -640 395 -648Q404 -651 412 -653Q421 -655 430 -654Q438 -649 458 -649Q477 -649 499 -650Q555 -655 578 -646Q600 -638 607 -624Q612 -605 605 -592Q598 -580 581 -581Q572 -579 556 -578Q540 -576 514 -575Q448 -569 443 -561Q439 -557 436 -553Q434 -549 430 -544Q431 -540 426 -520Q420 -501 412 -479Q408 -466 400 -442Q392 -418 384 -392Q375 -367 368 -346Q361 -326 358 -319Q354 -310 352 -300Q349 -289 348 -284Q334 -235 324 -202Q315 -169 308 -145Q301 -120 295 -98Q289 -75 281 -47Q281 -47 298 -48Q315 -50 341 -52Q388 -57 405 -58Q422 -59 425 -56Q428 -52 431 -43Q451 -16 428 2Q406 20 350 19Q298 21 274 22Q249 24 242 27Q235 30 235 37Q236 53 216 56Q195 60 177 41ZM388 -727Q371 -710 357 -716Q343 -721 338 -738Q334 -754 343 -768Q346 -772 358 -784Q371 -795 388 -810Q405 -825 422 -838Q438 -850 448 -856Q461 -867 474 -864Q488 -862 494 -853Q506 -843 523 -826Q540 -810 556 -794Q572 -777 579 -767Q585 -755 582 -742Q578 -729 568 -721Q558 -713 545 -714Q532 -716 519 -733Q512 -739 497 -754Q482 -770 467 -783Q455 -776 439 -765Q423 -754 409 -744Q395 -733 388 -727Z"],"Ï":[409,"M181 41Q174 30 157 27Q140 24 105 26Q91 28 76 24Q61 20 52 12Q43 4 45 -4Q46 -16 73 -30Q100 -44 143 -45L185 -46L195 -66Q199 -77 202 -90Q204 -103 211 -126Q215 -140 223 -165Q231 -190 240 -219Q249 -247 256 -270Q263 -293 265 -302Q269 -311 276 -332Q283 -354 290 -376Q296 -399 298 -409Q324 -488 332 -520Q340 -551 336 -552Q332 -552 317 -551Q302 -550 284 -548Q266 -547 252 -545Q238 -543 235 -541Q230 -534 218 -544Q206 -553 203 -563Q202 -572 203 -580Q204 -588 209 -591Q216 -597 238 -604Q260 -612 287 -618Q315 -624 338 -627Q355 -629 372 -634Q389 -640 399 -648Q408 -651 416 -653Q425 -655 434 -654Q442 -649 462 -649Q481 -649 503 -650Q559 -655 582 -646Q604 -638 611 -624Q616 -605 609 -592Q602 -580 585 -581Q576 -579 560 -578Q544 -576 518 -575Q452 -569 447 -561Q443 -557 440 -553Q438 -549 434 -544Q435 -540 430 -520Q424 -501 416 -479Q412 -466 404 -442Q396 -418 388 -392Q379 -367 372 -346Q365 -326 362 -319Q358 -310 356 -300Q353 -289 352 -284Q338 -235 328 -202Q319 -169 312 -145Q305 -120 299 -98Q293 -75 285 -47Q285 -47 302 -48Q319 -50 345 -52Q392 -57 409 -58Q426 -59 429 -56Q432 -52 435 -43Q455 -16 432 2Q410 20 354 19Q302 21 278 22Q253 24 246 27Q239 30 239 37Q240 53 220 56Q199 60 181 41ZM495 -746Q488 -753 483 -768Q478 -784 479 -788Q481 -793 487 -809Q493 -825 497 -829Q502 -836 513 -848Q524 -859 528 -860Q539 -872 555 -866Q571 -860 579 -844Q598 -821 591 -800Q584 -778 564 -758Q544 -727 526 -729Q509 -731 495 -746ZM351 -736Q337 -746 330 -763Q323 -780 325 -787Q327 -801 338 -821Q349 -841 356 -847Q359 -849 366 -854Q372 -859 377 -862Q390 -871 402 -866Q413 -860 422 -848Q430 -837 433 -826Q440 -813 434 -796Q429 -780 413 -763Q397 -742 382 -734Q368 -725 351 -736Z"],"Ð":[578,"M224 104Q202 108 171 106Q140 104 95 91Q85 86 74 74Q63 61 55 45Q47 29 47 15Q47 -11 58 -20Q70 -29 81 -30Q100 -29 114 -18Q127 -6 133 2Q155 9 172 14Q189 20 206 21Q228 19 248 18Q268 16 284 14Q300 11 308 6Q361 -30 388 -52Q416 -75 416 -75Q418 -79 424 -82Q429 -84 437 -87Q443 -93 456 -107Q470 -121 482 -134Q495 -147 498 -149Q500 -158 502 -164Q504 -169 504 -175Q512 -183 526 -209Q540 -235 554 -267Q568 -299 574 -325Q587 -390 581 -435Q575 -480 554 -513Q532 -546 500 -573Q486 -584 468 -594Q449 -603 432 -610Q414 -618 400 -622Q387 -625 384 -624Q381 -623 372 -599Q362 -575 348 -537Q334 -499 318 -452Q302 -406 285 -360H289Q317 -357 328 -352Q340 -347 351 -339Q365 -324 358 -308Q351 -293 326 -295Q319 -294 304 -293Q288 -292 274 -291Q272 -291 268 -291Q265 -291 262 -291Q255 -269 248 -249Q241 -229 241 -224Q230 -207 218 -172Q206 -137 198 -72Q189 -38 185 -15Q181 8 177 7L176 14Q176 20 162 23Q148 26 132 24Q116 22 110 16Q107 5 100 -12Q93 -29 99 -54Q103 -77 112 -110Q122 -142 133 -176Q144 -210 154 -238Q164 -265 168 -278Q169 -280 170 -282Q170 -285 171 -286H165Q164 -286 158 -287Q151 -288 142 -291Q127 -291 118 -298Q109 -304 104 -313Q97 -328 110 -335Q124 -342 158 -346Q167 -348 176 -350Q185 -352 192 -353Q193 -355 193 -357Q193 -359 194 -360Q202 -384 210 -408Q217 -432 224 -451Q231 -470 236 -478Q241 -491 248 -521Q256 -551 272 -589L279 -621L268 -626Q261 -623 254 -624Q246 -624 241 -626Q236 -625 229 -628Q222 -632 215 -638Q208 -644 203 -650Q198 -659 197 -666Q196 -674 196 -674Q197 -682 217 -690Q237 -698 270 -704Q303 -711 343 -712Q383 -711 424 -700Q465 -688 492 -678Q527 -666 563 -637Q599 -608 627 -572Q655 -535 665 -497Q672 -474 675 -448Q678 -422 678 -402Q678 -382 673 -376Q671 -372 670 -366Q670 -361 674 -359Q673 -356 667 -336Q661 -317 656 -303Q653 -276 642 -244Q631 -212 618 -183Q605 -154 595 -137Q591 -137 588 -136Q584 -134 588 -133Q588 -126 582 -120Q576 -114 570 -106Q566 -103 561 -96Q556 -88 551 -84Q550 -77 545 -72Q540 -68 536 -68Q536 -68 534 -68Q533 -68 533 -64Q525 -52 506 -33Q488 -14 464 6Q440 26 416 43Q392 60 372 68Q362 75 351 80Q340 84 330 89Q325 93 306 96Q287 98 264 100Q241 101 224 104Z"],"Ñ":[566,"M106 85Q86 74 79 59Q72 44 74 26Q75 8 80 -11Q88 -43 98 -64Q107 -86 116 -110Q126 -133 133 -170Q149 -207 162 -240Q174 -273 181 -294Q188 -315 188 -315Q189 -319 196 -336Q204 -353 215 -378Q227 -402 238 -427Q255 -475 270 -508Q285 -542 300 -569Q316 -596 334 -623Q346 -644 368 -648Q390 -652 410 -644Q430 -635 436 -615Q441 -605 444 -592Q448 -579 452 -554Q455 -528 456 -480Q458 -423 458 -376Q459 -328 462 -288Q466 -248 475 -215Q478 -197 481 -172Q484 -146 487 -121Q491 -96 495 -80Q499 -63 503 -63Q508 -63 514 -72Q521 -80 532 -108Q543 -136 560 -194Q577 -252 601 -350Q606 -367 614 -405Q623 -443 627 -482Q634 -507 641 -537Q648 -567 654 -590Q659 -613 659 -616Q659 -623 660 -628Q660 -633 659 -638Q664 -638 668 -652Q672 -665 672 -675Q672 -692 676 -702Q681 -713 686 -718Q697 -738 714 -738Q732 -739 747 -728Q762 -718 765 -703Q767 -692 760 -654Q752 -615 737 -550Q737 -539 731 -514Q725 -489 718 -461Q712 -433 709 -413Q705 -387 700 -364Q695 -342 690 -343Q664 -230 636 -150Q607 -71 585 -21Q561 34 524 50Q486 65 454 24Q435 -2 422 -27Q409 -52 401 -86Q393 -120 387 -172Q381 -214 376 -254Q372 -295 370 -338Q368 -380 369 -428Q370 -485 364 -495Q359 -505 349 -484Q339 -463 326 -427Q319 -407 310 -382Q300 -356 290 -331Q280 -306 273 -288Q266 -270 264 -265Q258 -253 250 -234Q242 -214 237 -192Q201 -98 184 -30Q166 37 158 59Q148 87 140 93Q131 99 106 85ZM546 -726Q532 -726 516 -734Q500 -742 482 -757Q473 -762 460 -776Q446 -789 434 -789Q424 -789 418 -781Q411 -773 406 -765Q400 -757 389 -755Q386 -748 382 -742Q379 -735 371 -740Q361 -742 354 -750Q347 -758 344 -777Q352 -800 369 -820Q386 -841 411 -854Q443 -862 460 -854Q478 -846 494 -829Q518 -810 531 -807Q544 -804 563 -812Q578 -816 592 -825Q607 -834 628 -842Q635 -845 642 -838Q650 -831 654 -821Q659 -811 658 -805Q657 -793 648 -782Q639 -772 630 -767Q600 -750 583 -741Q566 -732 558 -729Q550 -726 546 -726Z"],"Ò":[496,"M183 35Q146 8 124 -16Q103 -39 101 -61Q99 -79 102 -110Q104 -141 108 -171Q112 -201 115 -216Q120 -221 120 -230Q119 -238 119 -238Q118 -243 126 -264Q134 -286 141 -320Q161 -380 180 -420Q198 -461 216 -490Q234 -519 252 -543Q293 -585 330 -610Q366 -635 397 -649Q417 -661 434 -668Q451 -675 462 -670Q518 -658 557 -621Q596 -584 609 -514Q616 -470 618 -434Q619 -399 612 -364Q605 -330 586 -289Q568 -248 535 -193Q494 -112 446 -58Q397 -3 348 25Q300 53 256 56Q213 58 183 35ZM263 -31Q286 -34 300 -40Q315 -46 331 -63Q347 -80 376 -113Q402 -143 420 -164Q437 -185 450 -207Q462 -229 474 -260Q485 -290 499 -338Q507 -368 510 -382Q514 -397 515 -407Q516 -417 516 -434Q515 -452 515 -488Q514 -505 508 -526Q502 -548 494 -557Q484 -568 464 -576Q444 -584 422 -574Q410 -569 392 -554Q374 -538 355 -517Q336 -496 319 -475Q302 -454 292 -437Q282 -420 282 -413Q282 -413 282 -408Q281 -403 277 -398Q264 -384 250 -352Q236 -320 224 -279Q212 -238 204 -197Q196 -156 194 -123Q194 -107 194 -96Q194 -85 196 -76Q199 -68 205 -58Q211 -48 230 -38Q248 -28 263 -31ZM538 -704Q528 -699 524 -708Q521 -716 518 -730Q516 -743 509 -753Q499 -772 486 -793Q472 -814 466 -834Q460 -853 471 -865Q493 -888 504 -889Q516 -890 526 -879Q533 -875 542 -856Q552 -838 562 -815Q571 -792 578 -773Q584 -754 584 -748Q585 -744 570 -727Q555 -710 538 -704Z"],"Ó":[496,"M183 35Q146 8 124 -16Q103 -39 101 -61Q99 -79 102 -110Q104 -141 108 -171Q112 -201 115 -216Q120 -221 120 -230Q119 -238 119 -238Q118 -243 126 -264Q134 -286 141 -320Q161 -380 180 -420Q198 -461 216 -490Q234 -519 252 -543Q293 -585 330 -610Q366 -635 397 -649Q417 -661 434 -668Q451 -675 462 -670Q518 -658 557 -621Q596 -584 609 -514Q616 -470 618 -434Q619 -399 612 -364Q605 -330 586 -289Q568 -248 535 -193Q494 -112 446 -58Q397 -3 348 25Q300 53 256 56Q213 58 183 35ZM263 -31Q286 -34 300 -40Q315 -46 331 -63Q347 -80 376 -113Q402 -143 420 -164Q437 -185 450 -207Q462 -229 474 -260Q485 -290 499 -338Q507 -368 510 -382Q514 -397 515 -407Q516 -417 516 -434Q515 -452 515 -488Q514 -505 508 -526Q502 -548 494 -557Q484 -568 464 -576Q444 -584 422 -574Q410 -569 392 -554Q374 -538 355 -517Q336 -496 319 -475Q302 -454 292 -437Q282 -420 282 -413Q282 -413 282 -408Q281 -403 277 -398Q264 -384 250 -352Q236 -320 224 -279Q212 -238 204 -197Q196 -156 194 -123Q194 -107 194 -96Q194 -85 196 -76Q199 -68 205 -58Q211 -48 230 -38Q248 -28 263 -31ZM475 -714Q468 -721 464 -732Q461 -742 462 -767Q463 -772 476 -787Q488 -802 506 -821Q523 -840 541 -855Q559 -870 570 -874Q583 -879 598 -864Q612 -849 613 -826Q615 -818 604 -806Q593 -793 576 -780Q559 -766 543 -752Q527 -739 519 -728Q509 -712 498 -710Q486 -707 475 -714Z"],"Ô":[496,"M183 35Q146 8 124 -16Q103 -39 101 -61Q99 -79 102 -110Q104 -141 108 -171Q112 -201 115 -216Q120 -221 120 -230Q119 -238 119 -238Q118 -243 126 -264Q134 -286 141 -320Q161 -380 180 -420Q198 -461 216 -490Q234 -519 252 -543Q293 -585 330 -610Q366 -635 397 -649Q417 -661 434 -668Q451 -675 462 -670Q518 -658 557 -621Q596 -584 609 -514Q616 -470 618 -434Q619 -399 612 -364Q605 -330 586 -289Q568 -248 535 -193Q494 -112 446 -58Q397 -3 348 25Q300 53 256 56Q213 58 183 35ZM263 -31Q286 -34 300 -40Q315 -46 331 -63Q347 -80 376 -113Q402 -143 420 -164Q437 -185 450 -207Q462 -229 474 -260Q485 -290 499 -338Q507 -368 510 -382Q514 -397 515 -407Q516 -417 516 -434Q515 -452 515 -488Q514 -505 508 -526Q502 -548 494 -557Q484 -568 464 -576Q444 -584 422 -574Q410 -569 392 -554Q374 -538 355 -517Q336 -496 319 -475Q302 -454 292 -437Q282 -420 282 -413Q282 -413 282 -408Q281 -403 277 -398Q264 -384 250 -352Q236 -320 224 -279Q212 -238 204 -197Q196 -156 194 -123Q194 -107 194 -96Q194 -85 196 -76Q199 -68 205 -58Q211 -48 230 -38Q248 -28 263 -31ZM462 -727Q445 -710 431 -716Q417 -721 412 -738Q408 -754 417 -768Q420 -772 432 -784Q445 -795 462 -810Q479 -825 496 -838Q512 -850 522 -856Q535 -867 548 -864Q562 -862 568 -853Q580 -843 597 -826Q614 -810 630 -794Q646 -777 653 -767Q659 -755 656 -742Q652 -729 642 -721Q632 -713 619 -714Q606 -716 593 -733Q586 -739 571 -754Q556 -770 541 -783Q529 -776 513 -765Q497 -754 483 -744Q469 -733 462 -727Z"],"Õ":[496,"M183 35Q146 8 124 -16Q103 -39 101 -61Q99 -79 102 -110Q104 -141 108 -171Q112 -201 115 -216Q120 -221 120 -230Q119 -238 119 -238Q118 -243 126 -264Q134 -286 141 -320Q161 -380 180 -420Q198 -461 216 -490Q234 -519 252 -543Q293 -585 330 -610Q366 -635 397 -649Q417 -661 434 -668Q451 -675 462 -670Q518 -658 557 -621Q596 -584 609 -514Q616 -470 618 -434Q619 -399 612 -364Q605 -330 586 -289Q568 -248 535 -193Q494 -112 446 -58Q397 -3 348 25Q300 53 256 56Q213 58 183 35ZM263 -31Q286 -34 300 -40Q315 -46 331 -63Q347 -80 376 -113Q402 -143 420 -164Q437 -185 450 -207Q462 -229 474 -260Q485 -290 499 -338Q507 -368 510 -382Q514 -397 515 -407Q516 -417 516 -434Q515 -452 515 -488Q514 -505 508 -526Q502 -548 494 -557Q484 -568 464 -576Q444 -584 422 -574Q410 -569 392 -554Q374 -538 355 -517Q336 -496 319 -475Q302 -454 292 -437Q282 -420 282 -413Q282 -413 282 -408Q281 -403 277 -398Q264 -384 250 -352Q236 -320 224 -279Q212 -238 204 -197Q196 -156 194 -123Q194 -107 194 -96Q194 -85 196 -76Q199 -68 205 -58Q211 -48 230 -38Q248 -28 263 -31ZM566 -726Q552 -726 536 -734Q520 -742 502 -757Q493 -762 480 -776Q466 -789 454 -789Q444 -789 438 -781Q431 -773 426 -765Q420 -757 409 -755Q406 -748 402 -742Q399 -735 391 -740Q381 -742 374 -750Q367 -758 364 -777Q372 -800 389 -820Q406 -841 431 -854Q463 -862 480 -854Q498 -846 514 -829Q538 -810 551 -807Q564 -804 583 -812Q598 -816 612 -825Q627 -834 648 -842Q655 -845 662 -838Q670 -831 674 -821Q679 -811 678 -805Q677 -793 668 -782Q659 -772 650 -767Q620 -750 603 -741Q586 -732 578 -729Q570 -726 566 -726Z"],"Ö":[496,"M183 35Q146 8 124 -16Q103 -39 101 -61Q99 -79 102 -110Q104 -141 108 -171Q112 -201 115 -216Q120 -221 120 -230Q119 -238 119 -238Q118 -243 126 -264Q134 -286 141 -320Q161 -380 180 -420Q198 -461 216 -490Q234 -519 252 -543Q293 -585 330 -610Q366 -635 397 -649Q417 -661 434 -668Q451 -675 462 -670Q518 -658 557 -621Q596 -584 609 -514Q616 -470 618 -434Q619 -399 612 -364Q605 -330 586 -289Q568 -248 535 -193Q494 -112 446 -58Q397 -3 348 25Q300 53 256 56Q213 58 183 35ZM263 -31Q286 -34 300 -40Q315 -46 331 -63Q347 -80 376 -113Q402 -143 420 -164Q437 -185 450 -207Q462 -229 474 -260Q485 -290 499 -338Q507 -368 510 -382Q514 -397 515 -407Q516 -417 516 -434Q515 -452 515 -488Q514 -505 508 -526Q502 -548 494 -557Q484 -568 464 -576Q444 -584 422 -574Q410 -569 392 -554Q374 -538 355 -517Q336 -496 319 -475Q302 -454 292 -437Q282 -420 282 -413Q282 -413 282 -408Q281 -403 277 -398Q264 -384 250 -352Q236 -320 224 -279Q212 -238 204 -197Q196 -156 194 -123Q194 -107 194 -96Q194 -85 196 -76Q199 -68 205 -58Q211 -48 230 -38Q248 -28 263 -31ZM569 -746Q562 -753 557 -768Q552 -784 553 -788Q555 -793 561 -809Q567 -825 571 -829Q576 -836 587 -848Q598 -859 602 -860Q613 -872 629 -866Q645 -860 653 -844Q672 -821 665 -800Q658 -778 638 -758Q618 -727 600 -729Q583 -731 569 -746ZM425 -736Q411 -746 404 -763Q397 -780 399 -787Q401 -801 412 -821Q423 -841 430 -847Q433 -849 440 -854Q446 -859 451 -862Q464 -871 476 -866Q487 -860 496 -848Q504 -837 507 -826Q514 -813 508 -796Q503 -780 487 -763Q471 -742 456 -734Q442 -725 425 -736Z"],"×":[446,"M440 -77Q438 -59 422 -62Q407 -65 378 -88Q367 -95 348 -112Q328 -128 304 -149Q281 -170 258 -192Q234 -214 214 -233Q195 -252 183 -263Q165 -281 154 -299Q144 -317 143 -333Q143 -354 160 -360Q178 -366 191 -348Q196 -343 216 -326Q236 -308 250 -296Q253 -293 268 -280Q282 -266 302 -246Q322 -227 343 -207Q364 -187 382 -170Q399 -153 407 -145Q412 -141 418 -134Q423 -128 428 -117Q439 -107 440 -96Q442 -85 440 -77ZM160 -61Q142 -63 145 -78Q148 -94 171 -122Q179 -134 195 -154Q211 -173 232 -196Q253 -220 275 -244Q297 -267 316 -286Q335 -306 346 -317Q364 -335 382 -346Q400 -357 416 -357Q437 -357 443 -340Q449 -323 431 -310Q426 -304 408 -284Q391 -264 379 -250Q376 -247 362 -232Q349 -218 330 -198Q310 -178 290 -157Q270 -136 253 -118Q236 -101 228 -93Q224 -89 218 -83Q211 -77 200 -72Q190 -61 179 -60Q168 -59 160 -61Z"],"Ø":[496,"M122 101Q102 100 90 86Q78 72 86 40Q93 8 130 -46Q138 -57 144 -66Q151 -76 153 -83Q157 -89 172 -113Q187 -137 209 -170Q231 -204 256 -240Q280 -277 301 -310Q323 -342 338 -364Q352 -385 354 -387Q358 -386 363 -392Q368 -397 370 -404Q373 -412 379 -420Q385 -429 390 -430Q392 -435 396 -440Q401 -446 402 -450Q403 -454 406 -457Q410 -460 411 -464Q421 -474 441 -499Q461 -523 484 -554Q507 -584 529 -613Q551 -643 566 -664Q580 -685 582 -690Q587 -705 603 -699Q606 -701 620 -701Q635 -701 639 -700Q639 -700 641 -696Q643 -691 649 -680Q655 -670 654 -656Q653 -643 648 -632Q644 -619 636 -610Q627 -601 610 -586Q593 -571 563 -539Q548 -522 535 -510Q522 -497 522 -493Q520 -489 519 -488Q518 -486 511 -475Q505 -469 493 -454Q481 -440 469 -424Q457 -408 448 -396Q439 -384 439 -382Q437 -379 436 -375Q434 -371 428 -369Q425 -371 422 -366Q420 -360 420 -360Q420 -356 412 -344Q403 -331 389 -314Q378 -298 357 -267Q336 -236 310 -196Q283 -156 255 -114Q227 -72 203 -34Q179 3 163 29Q147 55 144 64Q137 86 134 92Q130 99 122 101ZM177 35Q140 8 118 -16Q97 -39 95 -61Q93 -79 96 -110Q98 -141 102 -171Q106 -201 109 -216Q114 -221 114 -230Q113 -238 113 -238Q112 -243 120 -264Q128 -286 135 -320Q155 -380 174 -420Q192 -461 210 -490Q228 -519 246 -543Q287 -585 324 -610Q360 -635 391 -649Q411 -661 428 -668Q445 -675 456 -670Q512 -658 551 -621Q590 -584 603 -514Q610 -470 612 -434Q613 -399 606 -364Q599 -330 580 -289Q562 -248 529 -193Q488 -112 440 -58Q391 -3 342 25Q294 53 250 56Q207 58 177 35ZM257 -31Q280 -34 294 -40Q309 -46 325 -63Q341 -80 370 -113Q396 -143 414 -164Q431 -185 444 -207Q456 -229 468 -260Q479 -290 493 -338Q501 -368 504 -382Q508 -397 509 -407Q510 -417 510 -434Q509 -452 509 -488Q508 -505 502 -526Q496 -548 488 -557Q478 -568 458 -576Q438 -584 416 -574Q404 -569 386 -554Q368 -538 349 -517Q330 -496 313 -475Q296 -454 286 -437Q276 -420 276 -413Q276 -413 276 -408Q275 -403 271 -398Q258 -384 244 -352Q230 -320 218 -279Q206 -238 198 -197Q190 -156 188 -123Q188 -107 188 -96Q188 -85 190 -76Q193 -68 199 -58Q205 -48 224 -38Q242 -28 257 -31Z"],"Ù":[482,"M229 60Q177 46 150 7Q122 -32 120 -102Q117 -171 138 -275Q145 -310 158 -355Q171 -400 188 -448Q206 -495 226 -540Q245 -584 264 -618Q287 -659 304 -673Q321 -687 337 -685Q361 -681 374 -666Q386 -650 386 -632Q385 -615 368 -604Q357 -591 340 -556Q322 -522 304 -490Q284 -432 269 -388Q254 -343 244 -304Q234 -265 226 -222Q217 -180 212 -158Q207 -135 206 -124Q204 -112 204 -104Q203 -95 203 -81Q211 -68 216 -58Q221 -48 229 -46Q246 -38 264 -38Q281 -38 302 -50Q307 -60 315 -64Q323 -68 323 -68Q325 -63 328 -66Q330 -68 331 -72Q330 -76 333 -80Q336 -83 340 -87Q348 -90 360 -104Q373 -118 385 -136Q397 -153 406 -168Q414 -183 414 -187Q414 -192 418 -196Q422 -200 427 -206Q432 -211 448 -238Q463 -266 482 -303Q500 -340 515 -371Q518 -382 526 -406Q534 -431 544 -463Q553 -495 562 -528Q571 -560 578 -586Q586 -611 588 -623Q590 -636 594 -644Q598 -653 599 -657Q610 -666 624 -662Q638 -658 650 -650Q663 -643 669 -640Q675 -632 674 -620Q673 -608 668 -584Q662 -559 652 -513Q631 -431 602 -362Q572 -293 538 -216Q538 -216 538 -216Q538 -215 538 -210Q526 -203 519 -189Q514 -180 510 -174Q507 -167 502 -164Q499 -155 496 -148Q493 -141 493 -141Q492 -136 486 -132Q480 -128 474 -124Q469 -122 468 -116Q467 -110 464 -106Q442 -73 410 -40Q378 -6 344 19Q311 44 284 54Q266 61 254 62Q243 63 229 60ZM523 -704Q513 -699 510 -708Q506 -716 504 -730Q501 -743 494 -753Q484 -772 470 -793Q457 -814 451 -834Q445 -853 456 -865Q478 -888 490 -889Q501 -890 511 -879Q518 -875 528 -856Q537 -838 546 -815Q556 -792 562 -773Q569 -754 569 -748Q570 -744 555 -727Q540 -710 523 -704Z"],"Ú":[482,"M229 60Q177 46 150 7Q122 -32 120 -102Q117 -171 138 -275Q145 -310 158 -355Q171 -400 188 -448Q206 -495 226 -540Q245 -584 264 -618Q287 -659 304 -673Q321 -687 337 -685Q361 -681 374 -666Q386 -650 386 -632Q385 -615 368 -604Q357 -591 340 -556Q322 -522 304 -490Q284 -432 269 -388Q254 -343 244 -304Q234 -265 226 -222Q217 -180 212 -158Q207 -135 206 -124Q204 -112 204 -104Q203 -95 203 -81Q211 -68 216 -58Q221 -48 229 -46Q246 -38 264 -38Q281 -38 302 -50Q307 -60 315 -64Q323 -68 323 -68Q325 -63 328 -66Q330 -68 331 -72Q330 -76 333 -80Q336 -83 340 -87Q348 -90 360 -104Q373 -118 385 -136Q397 -153 406 -168Q414 -183 414 -187Q414 -192 418 -196Q422 -200 427 -206Q432 -211 448 -238Q463 -266 482 -303Q500 -340 515 -371Q518 -382 526 -406Q534 -431 544 -463Q553 -495 562 -528Q571 -560 578 -586Q586 -611 588 -623Q590 -636 594 -644Q598 -653 599 -657Q610 -666 624 -662Q638 -658 650 -650Q663 -643 669 -640Q675 -632 674 -620Q673 -608 668 -584Q662 -559 652 -513Q631 -431 602 -362Q572 -293 538 -216Q538 -216 538 -216Q538 -215 538 -210Q526 -203 519 -189Q514 -180 510 -174Q507 -167 502 -164Q499 -155 496 -148Q493 -141 493 -141Q492 -136 486 -132Q480 -128 474 -124Q469 -122 468 -116Q467 -110 464 -106Q442 -73 410 -40Q378 -6 344 19Q311 44 284 54Q266 61 254 62Q243 63 229 60ZM460 -714Q453 -721 450 -732Q446 -742 447 -767Q448 -772 460 -787Q473 -802 490 -821Q508 -840 526 -855Q544 -870 555 -874Q568 -879 582 -864Q597 -849 598 -826Q600 -818 589 -806Q578 -793 561 -780Q544 -766 528 -752Q512 -739 504 -728Q494 -712 482 -710Q471 -707 460 -714Z"],"Û":[482,"M229 60Q177 46 150 7Q122 -32 120 -102Q117 -171 138 -275Q145 -310 158 -355Q171 -400 188 -448Q206 -495 226 -540Q245 -584 264 -618Q287 -659 304 -673Q321 -687 337 -685Q361 -681 374 -666Q386 -650 386 -632Q385 -615 368 -604Q357 -591 340 -556Q322 -522 304 -490Q284 -432 269 -388Q254 -343 244 -304Q234 -265 226 -222Q217 -180 212 -158Q207 -135 206 -124Q204 -112 204 -104Q203 -95 203 -81Q211 -68 216 -58Q221 -48 229 -46Q246 -38 264 -38Q281 -38 302 -50Q307 -60 315 -64Q323 -68 323 -68Q325 -63 328 -66Q330 -68 331 -72Q330 -76 333 -80Q336 -83 340 -87Q348 -90 360 -104Q373 -118 385 -136Q397 -153 406 -168Q414 -183 414 -187Q414 -192 418 -196Q422 -200 427 -206Q432 -211 448 -238Q463 -266 482 -303Q500 -340 515 -371Q518 -382 526 -406Q534 -431 544 -463Q553 -495 562 -528Q571 -560 578 -586Q586 -611 588 -623Q590 -636 594 -644Q598 -653 599 -657Q610 -666 624 -662Q638 -658 650 -650Q663 -643 669 -640Q675 -632 674 -620Q673 -608 668 -584Q662 -559 652 -513Q631 -431 602 -362Q572 -293 538 -216Q538 -216 538 -216Q538 -215 538 -210Q526 -203 519 -189Q514 -180 510 -174Q507 -167 502 -164Q499 -155 496 -148Q493 -141 493 -141Q492 -136 486 -132Q480 -128 474 -124Q469 -122 468 -116Q467 -110 464 -106Q442 -73 410 -40Q378 -6 344 19Q311 44 284 54Q266 61 254 62Q243 63 229 60ZM447 -727Q430 -710 416 -716Q402 -721 398 -738Q393 -754 402 -768Q405 -772 418 -784Q430 -795 447 -810Q464 -825 480 -838Q497 -850 507 -856Q520 -867 534 -864Q547 -862 553 -853Q565 -843 582 -826Q599 -810 615 -794Q631 -777 638 -767Q644 -755 640 -742Q637 -729 627 -721Q617 -713 604 -714Q591 -716 578 -733Q571 -739 556 -754Q541 -770 526 -783Q514 -776 498 -765Q482 -754 468 -744Q454 -733 447 -727Z"],"Ü":[482,"M229 60Q177 46 150 7Q122 -32 120 -102Q117 -171 138 -275Q145 -310 158 -355Q171 -400 188 -448Q206 -495 226 -540Q245 -584 264 -618Q287 -659 304 -673Q321 -687 337 -685Q361 -681 374 -666Q386 -650 386 -632Q385 -615 368 -604Q357 -591 340 -556Q322 -522 304 -490Q284 -432 269 -388Q254 -343 244 -304Q234 -265 226 -222Q217 -180 212 -158Q207 -135 206 -124Q204 -112 204 -104Q203 -95 203 -81Q211 -68 216 -58Q221 -48 229 -46Q246 -38 264 -38Q281 -38 302 -50Q307 -60 315 -64Q323 -68 323 -68Q325 -63 328 -66Q330 -68 331 -72Q330 -76 333 -80Q336 -83 340 -87Q348 -90 360 -104Q373 -118 385 -136Q397 -153 406 -168Q414 -183 414 -187Q414 -192 418 -196Q422 -200 427 -206Q432 -211 448 -238Q463 -266 482 -303Q500 -340 515 -371Q518 -382 526 -406Q534 -431 544 -463Q553 -495 562 -528Q571 -560 578 -586Q586 -611 588 -623Q590 -636 594 -644Q598 -653 599 -657Q610 -666 624 -662Q638 -658 650 -650Q663 -643 669 -640Q675 -632 674 -620Q673 -608 668 -584Q662 -559 652 -513Q631 -431 602 -362Q572 -293 538 -216Q538 -216 538 -216Q538 -215 538 -210Q526 -203 519 -189Q514 -180 510 -174Q507 -167 502 -164Q499 -155 496 -148Q493 -141 493 -141Q492 -136 486 -132Q480 -128 474 -124Q469 -122 468 -116Q467 -110 464 -106Q442 -73 410 -40Q378 -6 344 19Q311 44 284 54Q266 61 254 62Q243 63 229 60ZM554 -746Q547 -753 542 -768Q537 -784 538 -788Q540 -793 546 -809Q552 -825 556 -829Q561 -836 572 -848Q583 -859 587 -860Q598 -872 614 -866Q630 -860 638 -844Q657 -821 650 -800Q643 -778 623 -758Q603 -727 586 -729Q568 -731 554 -746ZM410 -736Q396 -746 389 -763Q382 -780 384 -787Q386 -801 397 -821Q408 -841 415 -847Q418 -849 424 -854Q431 -859 436 -862Q449 -871 460 -866Q472 -860 480 -848Q489 -837 492 -826Q499 -813 494 -796Q488 -780 472 -763Q456 -742 442 -734Q427 -725 410 -736Z"],"Ý":[504,"M314 -259 279 -303Q259 -333 247 -359Q235 -385 230 -423Q223 -447 221 -468Q219 -489 220 -516Q220 -544 221 -585Q222 -623 233 -648Q244 -672 248 -680Q269 -698 282 -687Q296 -676 302 -650Q309 -624 308 -595Q311 -488 322 -433Q332 -378 348 -365Q360 -362 369 -368Q378 -373 392 -390Q407 -406 433 -433Q461 -462 489 -494Q517 -527 542 -557Q568 -587 588 -609Q609 -631 621 -638Q625 -644 635 -648Q645 -653 654 -656Q664 -658 664 -658Q672 -656 673 -646Q674 -635 681 -625Q683 -621 690 -613Q697 -605 696 -600Q696 -597 687 -586Q678 -576 668 -566Q658 -556 653 -551Q640 -540 612 -512Q585 -485 556 -454Q527 -422 507 -397Q463 -346 428 -309Q394 -272 386 -265Q385 -263 373 -262Q361 -262 356 -254ZM258 76Q254 75 242 67Q229 59 219 52Q212 44 210 35Q209 26 213 11Q217 -4 224 -31Q225 -54 234 -87Q242 -120 254 -142Q254 -153 259 -172Q264 -191 272 -212Q279 -232 285 -247L303 -299L343 -333L395 -297Q391 -291 388 -283Q385 -275 380 -256Q375 -237 365 -197Q357 -170 348 -139Q338 -108 330 -81Q322 -54 316 -37Q304 8 294 34Q285 60 276 70Q268 79 258 76ZM457 -715Q450 -722 446 -732Q443 -743 444 -768Q445 -773 458 -788Q470 -803 488 -822Q505 -841 523 -856Q541 -871 552 -875Q565 -880 580 -865Q594 -850 595 -827Q597 -819 586 -806Q575 -794 558 -780Q541 -767 525 -754Q509 -740 501 -729Q491 -713 480 -710Q468 -708 457 -715Z"],"Þ":[472,"M123 87Q118 84 107 80Q96 75 87 68Q78 61 77 52Q76 49 76 43Q75 37 78 23Q81 9 87 -15Q88 -18 94 -40Q101 -62 110 -92Q119 -123 128 -152Q137 -181 144 -200Q150 -219 151 -216Q152 -221 158 -237Q163 -253 167 -257Q168 -266 172 -280Q177 -295 184 -308Q190 -322 196 -327Q196 -333 201 -347Q206 -361 213 -376Q220 -392 226 -403Q232 -414 233 -414Q233 -414 234 -420Q236 -426 246 -439Q246 -439 248 -449Q249 -459 257 -465Q261 -480 262 -486Q263 -491 259 -493Q250 -519 275 -520Q281 -520 289 -537Q291 -541 293 -542Q306 -576 318 -609Q330 -642 338 -665Q345 -688 345 -693Q345 -701 360 -705Q375 -709 383 -709Q386 -712 390 -713Q395 -714 399 -714L415 -698Q423 -691 424 -682Q426 -673 426 -661Q426 -649 424 -642Q423 -635 416 -620Q410 -606 393 -571Q407 -573 416 -575Q426 -577 426 -577Q440 -577 462 -575Q485 -573 498 -570Q534 -553 556 -521Q578 -489 581 -466Q583 -454 577 -428Q571 -403 562 -374Q552 -345 541 -322Q530 -299 521 -292Q526 -293 517 -281Q508 -269 494 -256Q481 -244 474 -242Q474 -242 467 -230Q460 -217 447 -210Q435 -203 422 -194Q408 -184 400 -172Q400 -180 395 -178Q390 -175 384 -170Q378 -164 374 -162Q329 -135 287 -127Q282 -123 272 -122Q261 -121 251 -121L217 -126L201 -84Q194 -53 186 -28Q178 -3 171 27Q168 45 158 60Q149 75 138 83Q128 91 123 87ZM252 -209Q301 -208 332 -225Q363 -242 390 -268Q397 -275 409 -289Q422 -303 435 -320Q449 -336 458 -349Q472 -369 479 -393Q485 -417 486 -438Q486 -459 481 -468Q470 -485 450 -488Q429 -491 406 -486Q384 -481 367 -471Q362 -469 351 -450Q341 -432 327 -404Q314 -376 300 -344Q286 -313 275 -284Q263 -255 257 -234Q251 -214 252 -209Z"],"ß":[398,"M79 229Q63 225 44 209Q25 193 22 176Q24 174 23 158Q22 143 22 139Q27 130 28 114Q28 98 27 76Q33 61 34 49Q36 37 36 32Q36 32 40 15Q44 -2 50 -26Q56 -50 62 -73Q69 -96 73 -109Q76 -123 80 -140Q84 -156 88 -162Q93 -176 98 -192Q103 -208 114 -237Q113 -245 118 -263Q123 -281 132 -302Q141 -323 151 -338Q156 -369 166 -392Q177 -414 177 -414Q181 -410 181 -410Q181 -410 177 -414Q174 -418 174 -425Q175 -432 176 -439Q188 -446 190 -454Q193 -461 193 -461Q193 -463 204 -478Q215 -493 230 -514Q246 -535 262 -555Q278 -575 287 -586Q307 -605 332 -625Q357 -645 377 -650Q390 -653 406 -654Q422 -655 434 -656Q447 -656 448 -656Q453 -657 468 -649Q483 -641 498 -630Q514 -618 519 -606Q533 -570 527 -524Q521 -478 489 -436Q477 -417 465 -407Q453 -397 452 -397Q452 -397 444 -389Q435 -381 430 -367Q420 -358 414 -350Q408 -341 405 -341Q402 -341 396 -333Q391 -325 388 -316Q384 -306 387 -300Q387 -300 384 -297Q382 -294 382 -294Q375 -294 378 -282Q382 -270 390 -256Q397 -241 401 -232Q408 -231 415 -218Q422 -205 430 -183Q432 -156 434 -144Q436 -132 437 -114Q434 -85 417 -62Q400 -39 376 -25Q352 -11 326 -9Q300 -5 287 -8Q274 -12 251 -19Q223 -30 208 -54Q194 -78 204 -97Q206 -101 210 -102Q213 -103 213 -102Q221 -102 222 -102Q224 -103 224 -103Q224 -103 232 -103Q241 -103 254 -102Q269 -101 276 -98Q282 -95 286 -95Q290 -95 296 -104Q307 -106 314 -106Q322 -107 322 -107Q323 -107 323 -116Q322 -117 323 -117Q323 -117 334 -122Q344 -127 341 -137Q340 -151 338 -162Q336 -173 322 -190Q314 -213 302 -232Q290 -252 280 -264Q271 -277 269 -278Q264 -284 267 -294Q270 -304 272 -310Q274 -316 276 -318Q278 -321 278 -321Q278 -322 290 -337Q302 -352 318 -372Q335 -391 348 -408Q362 -425 365 -430Q382 -441 398 -456Q414 -471 414 -475Q409 -489 428 -513Q442 -536 446 -546Q450 -557 444 -570Q428 -580 406 -574Q385 -568 360 -539Q353 -531 341 -517Q329 -503 327 -502Q313 -484 294 -450Q274 -417 256 -378Q237 -339 225 -303Q229 -296 223 -281Q217 -266 207 -258Q209 -244 208 -232Q207 -221 207 -221Q207 -214 204 -209Q201 -204 201 -204Q196 -204 195 -204Q194 -204 194 -203Q194 -203 191 -189Q188 -175 180 -155Q170 -127 165 -112Q160 -98 158 -83Q155 -68 151 -38Q138 2 132 29Q125 56 121 79Q120 83 120 92Q120 102 122 108Q120 115 118 131Q115 146 113 164Q111 181 111 193Q111 212 104 221Q96 230 79 229Z"],"à":[437,"M120 -21Q116 -29 102 -37Q89 -45 89 -49Q89 -53 84 -62Q80 -70 76 -74Q71 -80 79 -104Q87 -127 103 -161Q119 -195 138 -230Q146 -238 154 -251Q162 -264 166 -268Q166 -272 169 -276Q172 -279 176 -279L184 -295Q186 -299 196 -311Q207 -323 222 -338Q237 -352 252 -365Q268 -378 278 -384Q299 -398 322 -397Q344 -396 360 -383Q363 -380 374 -371Q384 -362 398 -351Q411 -340 421 -331L458 -298L441 -248Q428 -208 434 -178Q440 -148 453 -126Q458 -115 466 -109Q475 -103 489 -101Q497 -100 504 -95Q511 -90 511 -79Q511 -55 502 -44Q494 -34 484 -32Q451 -28 421 -39Q391 -50 367 -96Q363 -102 356 -118Q350 -135 349 -140Q345 -135 338 -128Q332 -120 326 -114Q255 -42 204 -20Q154 1 120 -21ZM175 -104Q182 -103 197 -112Q212 -120 237 -140Q271 -169 293 -188Q315 -207 336 -237L358 -273Q348 -296 340 -303Q332 -310 324 -310Q311 -310 293 -294Q275 -277 252 -246Q230 -214 202 -167Q189 -145 182 -124Q175 -104 175 -104ZM384 -426Q371 -416 364 -419Q357 -422 352 -446Q348 -461 337 -480Q326 -498 315 -517Q304 -536 300 -552Q295 -568 303 -578Q308 -586 321 -597Q334 -608 349 -604Q358 -601 368 -586Q379 -571 388 -550Q398 -528 406 -506Q413 -483 418 -465Q419 -462 412 -454Q406 -445 398 -437Q390 -429 384 -426Z"],"á":[437,"M120 -21Q116 -29 102 -37Q89 -45 89 -49Q89 -53 84 -62Q80 -70 76 -74Q71 -80 79 -104Q87 -127 103 -161Q119 -195 138 -230Q146 -238 154 -251Q162 -264 166 -268Q166 -272 169 -276Q172 -279 176 -279L184 -295Q186 -299 196 -311Q207 -323 222 -338Q237 -352 252 -365Q268 -378 278 -384Q299 -398 322 -397Q344 -396 360 -383Q363 -380 374 -371Q384 -362 398 -351Q411 -340 421 -331L458 -298L441 -248Q428 -208 434 -178Q440 -148 453 -126Q458 -115 466 -109Q475 -103 489 -101Q497 -100 504 -95Q511 -90 511 -79Q511 -55 502 -44Q494 -34 484 -32Q451 -28 421 -39Q391 -50 367 -96Q363 -102 356 -118Q350 -135 349 -140Q345 -135 338 -128Q332 -120 326 -114Q255 -42 204 -20Q154 1 120 -21ZM175 -104Q182 -103 197 -112Q212 -120 237 -140Q271 -169 293 -188Q315 -207 336 -237L358 -273Q348 -296 340 -303Q332 -310 324 -310Q311 -310 293 -294Q275 -277 252 -246Q230 -214 202 -167Q189 -145 182 -124Q175 -104 175 -104ZM385 -435Q376 -440 373 -456Q370 -472 372 -488Q373 -493 386 -508Q398 -524 416 -543Q435 -562 454 -578Q472 -593 484 -596Q498 -597 510 -582Q522 -568 523 -547Q523 -536 513 -525Q503 -514 488 -502Q473 -491 458 -478Q442 -466 432 -453Q422 -437 410 -432Q398 -427 385 -435Z"],"â":[437,"M120 -21Q116 -29 102 -37Q89 -45 89 -49Q89 -53 84 -62Q80 -70 76 -74Q71 -80 79 -104Q87 -127 103 -161Q119 -195 138 -230Q146 -238 154 -251Q162 -264 166 -268Q166 -272 169 -276Q172 -279 176 -279L184 -295Q186 -299 196 -311Q207 -323 222 -338Q237 -352 252 -365Q268 -378 278 -384Q299 -398 322 -397Q344 -396 360 -383Q363 -380 374 -371Q384 -362 398 -351Q411 -340 421 -331L458 -298L441 -248Q428 -208 434 -178Q440 -148 453 -126Q458 -115 466 -109Q475 -103 489 -101Q497 -100 504 -95Q511 -90 511 -79Q511 -55 502 -44Q494 -34 484 -32Q451 -28 421 -39Q391 -50 367 -96Q363 -102 356 -118Q350 -135 349 -140Q345 -135 338 -128Q332 -120 326 -114Q255 -42 204 -20Q154 1 120 -21ZM175 -104Q182 -103 197 -112Q212 -120 237 -140Q271 -169 293 -188Q315 -207 336 -237L358 -273Q348 -296 340 -303Q332 -310 324 -310Q311 -310 293 -294Q275 -277 252 -246Q230 -214 202 -167Q189 -145 182 -124Q175 -104 175 -104ZM301 -441Q284 -424 270 -430Q256 -436 252 -452Q247 -469 258 -483Q261 -487 273 -498Q285 -510 301 -524Q317 -538 333 -550Q349 -562 359 -568Q376 -581 390 -578Q403 -575 409 -566Q421 -556 438 -538Q456 -521 471 -506Q486 -491 488 -488Q499 -476 498 -462Q496 -448 486 -438Q476 -428 462 -428Q449 -428 435 -444Q428 -453 412 -468Q396 -484 381 -497Q369 -490 352 -479Q336 -468 322 -458Q308 -447 301 -441Z"],"ã":[437,"M120 -21Q116 -29 102 -37Q89 -45 89 -49Q89 -53 84 -62Q80 -70 76 -74Q71 -80 79 -104Q87 -127 103 -161Q119 -195 138 -230Q146 -238 154 -251Q162 -264 166 -268Q166 -272 169 -276Q172 -279 176 -279L184 -295Q186 -299 196 -311Q207 -323 222 -338Q237 -352 252 -365Q268 -378 278 -384Q299 -398 322 -397Q344 -396 360 -383Q363 -380 374 -371Q384 -362 398 -351Q411 -340 421 -331L458 -298L441 -248Q428 -208 434 -178Q440 -148 453 -126Q458 -115 466 -109Q475 -103 489 -101Q497 -100 504 -95Q511 -90 511 -79Q511 -55 502 -44Q494 -34 484 -32Q451 -28 421 -39Q391 -50 367 -96Q363 -102 356 -118Q350 -135 349 -140Q345 -135 338 -128Q332 -120 326 -114Q255 -42 204 -20Q154 1 120 -21ZM175 -104Q182 -103 197 -112Q212 -120 237 -140Q271 -169 293 -188Q315 -207 336 -237L358 -273Q348 -296 340 -303Q332 -310 324 -310Q311 -310 293 -294Q275 -277 252 -246Q230 -214 202 -167Q189 -145 182 -124Q175 -104 175 -104ZM431 -416Q411 -416 398 -424Q386 -431 367 -444Q358 -449 343 -464Q328 -479 316 -479Q306 -479 300 -471Q293 -463 287 -454Q281 -446 270 -444Q269 -439 264 -432Q259 -424 257 -429Q242 -431 234 -442Q227 -452 227 -464Q227 -473 242 -500Q258 -526 292 -543Q304 -548 326 -547Q347 -546 363 -531Q386 -510 402 -500Q419 -491 438 -499Q453 -503 472 -514Q490 -524 511 -532Q518 -535 525 -528Q532 -522 536 -512Q540 -502 539 -496Q539 -492 534 -480Q530 -467 511 -457Q481 -440 465 -431Q449 -422 442 -419Q435 -416 431 -416Z"],"ä":[437,"M120 -21Q116 -29 102 -37Q89 -45 89 -49Q89 -53 84 -62Q80 -70 76 -74Q71 -80 79 -104Q87 -127 103 -161Q119 -195 138 -230Q146 -238 154 -251Q162 -264 166 -268Q166 -272 169 -276Q172 -279 176 -279L184 -295Q186 -299 196 -311Q207 -323 222 -338Q237 -352 252 -365Q268 -378 278 -384Q299 -398 322 -397Q344 -396 360 -383Q363 -380 374 -371Q384 -362 398 -351Q411 -340 421 -331L458 -298L441 -248Q428 -208 434 -178Q440 -148 453 -126Q458 -115 466 -109Q475 -103 489 -101Q497 -100 504 -95Q511 -90 511 -79Q511 -55 502 -44Q494 -34 484 -32Q451 -28 421 -39Q391 -50 367 -96Q363 -102 356 -118Q350 -135 349 -140Q345 -135 338 -128Q332 -120 326 -114Q255 -42 204 -20Q154 1 120 -21ZM175 -104Q182 -103 197 -112Q212 -120 237 -140Q271 -169 293 -188Q315 -207 336 -237L358 -273Q348 -296 340 -303Q332 -310 324 -310Q311 -310 293 -294Q275 -277 252 -246Q230 -214 202 -167Q189 -145 182 -124Q175 -104 175 -104ZM279 -429Q269 -437 264 -454Q258 -470 260 -476Q262 -483 270 -502Q277 -520 292 -533Q296 -536 300 -542Q305 -547 310 -548Q324 -559 338 -552Q353 -544 364 -524Q375 -501 370 -486Q366 -471 344 -445Q325 -420 310 -418Q294 -415 279 -429ZM434 -429Q424 -437 418 -454Q413 -470 415 -476Q417 -483 424 -502Q432 -520 447 -533Q451 -536 456 -542Q460 -547 465 -548Q479 -559 494 -552Q508 -544 519 -524Q530 -501 526 -486Q521 -471 499 -445Q480 -420 464 -418Q449 -415 434 -429Z"],"å":[437,"M120 -21Q116 -29 102 -37Q89 -45 89 -49Q89 -53 84 -62Q80 -70 76 -74Q71 -80 79 -104Q87 -127 103 -161Q119 -195 138 -230Q146 -238 154 -251Q162 -264 166 -268Q166 -272 169 -276Q172 -279 176 -279L184 -295Q186 -299 196 -311Q207 -323 222 -338Q237 -352 252 -365Q268 -378 278 -384Q299 -398 322 -397Q344 -396 360 -383Q363 -380 374 -371Q384 -362 398 -351Q411 -340 421 -331L458 -298L441 -248Q428 -208 434 -178Q440 -148 453 -126Q458 -115 466 -109Q475 -103 489 -101Q497 -100 504 -95Q511 -90 511 -79Q511 -55 502 -44Q494 -34 484 -32Q451 -28 421 -39Q391 -50 367 -96Q363 -102 356 -118Q350 -135 349 -140Q345 -135 338 -128Q332 -120 326 -114Q255 -42 204 -20Q154 1 120 -21ZM175 -104Q182 -103 197 -112Q212 -120 237 -140Q271 -169 293 -188Q315 -207 336 -237L358 -273Q348 -296 340 -303Q332 -310 324 -310Q311 -310 293 -294Q275 -277 252 -246Q230 -214 202 -167Q189 -145 182 -124Q175 -104 175 -104ZM405 -400Q366 -400 349 -423Q332 -446 328 -479Q328 -501 338 -526Q347 -552 365 -570Q383 -589 407 -589Q444 -589 469 -572Q494 -556 494 -522Q494 -494 483 -466Q472 -438 453 -419Q433 -400 405 -400ZM404 -458Q420 -458 429 -468Q438 -478 438 -498Q437 -509 434 -519Q430 -529 416 -529Q383 -529 383 -487Q383 -478 390 -468Q398 -458 404 -458Z"],"æ":[574,"M118 -19Q110 -29 96 -38Q82 -46 83 -50Q83 -54 80 -60Q76 -67 71 -75Q67 -82 73 -102Q79 -123 95 -157Q111 -191 138 -236Q149 -246 156 -263Q163 -280 170 -279Q171 -281 172 -284Q174 -286 175 -288L176 -290Q179 -300 188 -312Q198 -323 210 -334Q223 -346 236 -356Q249 -366 259 -372Q286 -389 300 -394Q315 -399 326 -396Q337 -393 351 -385Q357 -381 370 -370Q383 -359 398 -346Q413 -333 423 -324L452 -298L435 -244Q436 -222 428 -204Q420 -187 404 -156L363 -91L352 -115Q350 -120 347 -128Q344 -135 343 -140Q339 -135 328 -122Q317 -110 311 -104Q262 -56 226 -34Q189 -13 162 -11Q136 -9 118 -19ZM169 -105Q172 -103 184 -108Q196 -112 216 -126Q236 -145 260 -164Q285 -184 307 -206Q329 -228 339 -252L352 -273Q342 -296 334 -303Q326 -310 318 -310Q305 -310 284 -290Q263 -271 240 -238Q218 -206 198 -166Q188 -146 178 -126Q169 -105 169 -105ZM531 -16Q497 1 464 0Q431 -1 405 -14Q379 -26 365 -45Q343 -76 342 -107Q342 -138 344 -176Q348 -218 370 -260Q392 -301 422 -334Q453 -367 481 -380Q504 -392 525 -395Q546 -398 563 -396Q589 -394 608 -384Q628 -375 635 -365Q651 -348 655 -334Q659 -319 658 -308Q656 -297 656 -287Q646 -257 620 -225Q593 -193 558 -181Q536 -174 516 -172Q497 -171 466 -178Q443 -183 433 -177Q423 -171 423 -147Q423 -118 432 -102Q442 -87 459 -84Q469 -82 481 -84Q493 -85 504 -88Q518 -93 528 -100Q537 -107 544 -114Q551 -121 556 -125Q561 -129 566 -131Q572 -133 577 -133Q584 -133 596 -123Q607 -113 611 -99Q609 -87 596 -70Q583 -53 566 -38Q548 -23 531 -16ZM520 -242Q528 -243 543 -255Q558 -267 570 -280Q582 -294 582 -299Q582 -310 570 -318Q557 -326 536 -324Q523 -321 510 -311Q498 -301 486 -289Q475 -277 468 -267Q460 -257 458 -253Q460 -248 472 -245Q483 -242 497 -242Q511 -241 520 -242Z"],"ç":[355,"M217 4Q188 9 160 -1Q131 -11 112 -34Q94 -56 94 -88Q91 -118 100 -160Q108 -201 126 -243Q143 -285 166 -314Q186 -338 206 -358Q226 -378 242 -385Q256 -391 276 -394Q297 -398 305 -398Q321 -394 340 -385Q360 -376 360 -364Q360 -364 362 -362Q365 -359 365 -359Q371 -359 378 -344Q386 -330 390 -312Q394 -293 388 -282Q384 -263 372 -245Q361 -227 353 -227Q349 -227 346 -226Q342 -226 342 -221Q342 -216 332 -216Q321 -216 310 -220Q299 -224 296 -232Q296 -237 298 -245Q300 -253 304 -272Q310 -300 305 -310Q300 -319 280 -311Q255 -297 239 -278Q223 -260 210 -227Q198 -194 183 -135Q177 -112 182 -99Q186 -86 189 -85Q203 -81 220 -84Q236 -86 247 -92Q263 -100 276 -110Q288 -119 303 -130Q308 -133 312 -142Q316 -150 324 -154Q332 -166 344 -166Q357 -167 369 -167Q377 -165 386 -157Q395 -149 400 -142Q404 -134 398 -131Q394 -131 394 -128Q393 -126 393 -126Q395 -122 384 -108Q374 -94 358 -78Q342 -62 328 -50Q313 -39 307 -39Q297 -39 297 -33Q297 -31 282 -23Q268 -15 250 -7Q231 1 217 4ZM193 193Q178 196 153 192Q128 187 106 181Q85 175 79 173Q67 169 61 158Q55 146 56 134Q57 122 67 116Q77 109 99 115Q115 119 134 126Q152 132 167 132Q182 132 189 118Q196 107 188 96Q180 84 169 72Q162 63 156 56Q149 50 138 40Q130 29 128 14Q127 0 144 -18Q161 -36 209 -60L265 -30Q240 -18 224 -7Q209 4 209 17Q223 37 240 56Q257 74 262 94Q268 118 258 139Q249 160 231 174Q213 189 193 193Z"],"è":[325,"M289 -20Q259 -3 226 0Q192 2 163 -10Q134 -21 116 -44Q106 -57 97 -86Q88 -114 94 -163Q100 -209 122 -256Q145 -303 178 -339Q211 -375 250 -388Q264 -393 278 -396Q293 -398 317 -396Q340 -393 358 -384Q376 -376 384 -366Q400 -350 405 -335Q410 -320 409 -306Q404 -274 380 -237Q357 -200 315 -182Q298 -175 275 -173Q252 -171 212 -179Q188 -184 180 -174Q173 -164 174 -135Q176 -117 182 -104Q189 -90 207 -85Q230 -81 240 -84Q250 -88 265 -95Q273 -100 280 -106Q288 -112 296 -118Q303 -124 308 -127Q313 -131 318 -132Q323 -133 328 -133Q339 -132 349 -121Q359 -110 362 -100Q362 -92 352 -78Q342 -63 326 -48Q309 -32 289 -20ZM276 -243Q283 -246 296 -257Q310 -268 321 -280Q332 -293 332 -300Q332 -311 318 -319Q303 -327 280 -322Q272 -320 261 -311Q250 -302 239 -290Q228 -279 220 -268Q212 -258 209 -252Q213 -247 225 -244Q237 -241 252 -241Q266 -241 276 -243ZM326 -426Q313 -416 306 -419Q299 -422 294 -446Q290 -461 279 -480Q268 -498 257 -517Q246 -536 242 -552Q237 -568 245 -578Q250 -586 263 -597Q276 -608 291 -604Q300 -601 310 -586Q321 -571 330 -550Q340 -528 348 -506Q355 -483 360 -465Q361 -462 354 -454Q348 -445 340 -437Q332 -429 326 -426Z"],"é":[325,"M289 -20Q259 -3 226 0Q192 2 163 -10Q134 -21 116 -44Q106 -57 97 -86Q88 -114 94 -163Q100 -209 122 -256Q145 -303 178 -339Q211 -375 250 -388Q264 -393 278 -396Q293 -398 317 -396Q340 -393 358 -384Q376 -376 384 -366Q400 -350 405 -335Q410 -320 409 -306Q404 -274 380 -237Q357 -200 315 -182Q298 -175 275 -173Q252 -171 212 -179Q188 -184 180 -174Q173 -164 174 -135Q176 -117 182 -104Q189 -90 207 -85Q230 -81 240 -84Q250 -88 265 -95Q273 -100 280 -106Q288 -112 296 -118Q303 -124 308 -127Q313 -131 318 -132Q323 -133 328 -133Q339 -132 349 -121Q359 -110 362 -100Q362 -92 352 -78Q342 -63 326 -48Q309 -32 289 -20ZM276 -243Q283 -246 296 -257Q310 -268 321 -280Q332 -293 332 -300Q332 -311 318 -319Q303 -327 280 -322Q272 -320 261 -311Q250 -302 239 -290Q228 -279 220 -268Q212 -258 209 -252Q213 -247 225 -244Q237 -241 252 -241Q266 -241 276 -243ZM327 -435Q318 -440 315 -456Q312 -472 314 -488Q315 -493 328 -508Q340 -524 358 -543Q377 -562 396 -578Q414 -593 426 -596Q440 -597 452 -582Q464 -568 465 -547Q465 -536 455 -525Q445 -514 430 -502Q415 -491 400 -478Q384 -466 374 -453Q364 -437 352 -432Q340 -427 327 -435Z"],"ê":[325,"M289 -20Q259 -3 226 0Q192 2 163 -10Q134 -21 116 -44Q106 -57 97 -86Q88 -114 94 -163Q100 -209 122 -256Q145 -303 178 -339Q211 -375 250 -388Q264 -393 278 -396Q293 -398 317 -396Q340 -393 358 -384Q376 -376 384 -366Q400 -350 405 -335Q410 -320 409 -306Q404 -274 380 -237Q357 -200 315 -182Q298 -175 275 -173Q252 -171 212 -179Q188 -184 180 -174Q173 -164 174 -135Q176 -117 182 -104Q189 -90 207 -85Q230 -81 240 -84Q250 -88 265 -95Q273 -100 280 -106Q288 -112 296 -118Q303 -124 308 -127Q313 -131 318 -132Q323 -133 328 -133Q339 -132 349 -121Q359 -110 362 -100Q362 -92 352 -78Q342 -63 326 -48Q309 -32 289 -20ZM276 -243Q283 -246 296 -257Q310 -268 321 -280Q332 -293 332 -300Q332 -311 318 -319Q303 -327 280 -322Q272 -320 261 -311Q250 -302 239 -290Q228 -279 220 -268Q212 -258 209 -252Q213 -247 225 -244Q237 -241 252 -241Q266 -241 276 -243ZM243 -441Q226 -424 212 -430Q198 -436 194 -452Q189 -469 200 -483Q203 -487 215 -498Q227 -510 243 -524Q259 -538 275 -550Q291 -562 301 -568Q318 -581 332 -578Q345 -575 351 -566Q363 -556 380 -538Q398 -521 413 -506Q428 -491 430 -488Q441 -476 440 -462Q438 -448 428 -438Q418 -428 404 -428Q391 -428 377 -444Q370 -453 354 -468Q338 -484 323 -497Q311 -490 294 -479Q278 -468 264 -458Q250 -447 243 -441Z"],"ë":[325,"M289 -20Q259 -3 226 0Q192 2 163 -10Q134 -21 116 -44Q106 -57 97 -86Q88 -114 94 -163Q100 -209 122 -256Q145 -303 178 -339Q211 -375 250 -388Q264 -393 278 -396Q293 -398 317 -396Q340 -393 358 -384Q376 -376 384 -366Q400 -350 405 -335Q410 -320 409 -306Q404 -274 380 -237Q357 -200 315 -182Q298 -175 275 -173Q252 -171 212 -179Q188 -184 180 -174Q173 -164 174 -135Q176 -117 182 -104Q189 -90 207 -85Q230 -81 240 -84Q250 -88 265 -95Q273 -100 280 -106Q288 -112 296 -118Q303 -124 308 -127Q313 -131 318 -132Q323 -133 328 -133Q339 -132 349 -121Q359 -110 362 -100Q362 -92 352 -78Q342 -63 326 -48Q309 -32 289 -20ZM276 -243Q283 -246 296 -257Q310 -268 321 -280Q332 -293 332 -300Q332 -311 318 -319Q303 -327 280 -322Q272 -320 261 -311Q250 -302 239 -290Q228 -279 220 -268Q212 -258 209 -252Q213 -247 225 -244Q237 -241 252 -241Q266 -241 276 -243ZM221 -429Q211 -437 206 -454Q200 -470 202 -476Q204 -483 212 -502Q219 -520 234 -533Q238 -536 242 -542Q247 -547 252 -548Q266 -559 280 -552Q295 -544 306 -524Q317 -501 312 -486Q308 -471 286 -445Q267 -420 252 -418Q236 -415 221 -429ZM376 -429Q366 -437 360 -454Q355 -470 357 -476Q359 -483 366 -502Q374 -520 389 -533Q393 -536 398 -542Q402 -547 407 -548Q421 -559 436 -552Q450 -544 461 -524Q472 -501 468 -486Q463 -471 441 -445Q422 -420 406 -418Q391 -415 376 -429Z"],"ì":[187,"M100 -17Q92 -25 88 -41Q85 -56 86 -72Q87 -88 91 -96Q91 -104 94 -108Q96 -113 95 -117Q94 -121 97 -131Q100 -141 103 -150Q110 -166 119 -192Q128 -217 137 -244Q146 -270 152 -290Q158 -309 159 -313Q159 -325 175 -326Q187 -330 204 -316Q221 -302 231 -286Q239 -278 237 -265Q235 -252 224 -228Q220 -220 214 -202Q209 -183 207 -171Q203 -163 198 -148Q192 -134 188 -121Q186 -116 184 -102Q182 -89 179 -75Q176 -61 171 -53Q162 -12 140 -5Q117 2 100 -17ZM245 -426Q232 -416 225 -419Q218 -422 213 -446Q209 -461 198 -480Q187 -498 176 -517Q165 -536 160 -552Q156 -568 164 -578Q169 -586 182 -597Q195 -608 210 -604Q219 -601 230 -586Q240 -571 250 -550Q259 -528 266 -506Q274 -483 279 -465Q280 -462 274 -454Q267 -445 259 -437Q251 -429 245 -426Z"],"í":[187,"M100 -17Q92 -25 88 -41Q85 -56 86 -72Q87 -88 91 -96Q91 -104 94 -108Q96 -113 95 -117Q94 -121 97 -131Q100 -141 103 -150Q110 -166 119 -192Q128 -217 137 -244Q146 -270 152 -290Q158 -309 159 -313Q159 -325 175 -326Q187 -330 204 -316Q221 -302 231 -286Q239 -278 237 -265Q235 -252 224 -228Q220 -220 214 -202Q209 -183 207 -171Q203 -163 198 -148Q192 -134 188 -121Q186 -116 184 -102Q182 -89 179 -75Q176 -61 171 -53Q162 -12 140 -5Q117 2 100 -17ZM236 -435Q227 -440 224 -456Q221 -472 223 -488Q224 -493 236 -508Q249 -524 268 -543Q286 -562 304 -578Q323 -593 335 -596Q349 -597 361 -582Q373 -568 374 -547Q374 -536 364 -525Q354 -514 339 -502Q324 -491 308 -478Q293 -466 283 -453Q273 -437 261 -432Q249 -427 236 -435Z"],"î":[187,"M100 -17Q92 -25 88 -41Q85 -56 86 -72Q87 -88 91 -96Q91 -104 94 -108Q96 -113 95 -117Q94 -121 97 -131Q100 -141 103 -150Q110 -166 119 -192Q128 -217 137 -244Q146 -270 152 -290Q158 -309 159 -313Q159 -325 175 -326Q187 -330 204 -316Q221 -302 231 -286Q239 -278 237 -265Q235 -252 224 -228Q220 -220 214 -202Q209 -183 207 -171Q203 -163 198 -148Q192 -134 188 -121Q186 -116 184 -102Q182 -89 179 -75Q176 -61 171 -53Q162 -12 140 -5Q117 2 100 -17ZM172 -441Q155 -424 141 -430Q127 -436 122 -452Q118 -469 129 -483Q132 -487 144 -498Q156 -510 172 -524Q188 -538 204 -550Q220 -562 230 -568Q247 -581 260 -578Q274 -575 280 -566Q292 -556 310 -538Q327 -521 342 -506Q357 -491 359 -488Q370 -476 368 -462Q367 -448 357 -438Q347 -428 334 -428Q320 -428 306 -444Q299 -453 283 -468Q267 -484 252 -497Q240 -490 223 -479Q207 -468 193 -458Q179 -447 172 -441Z"],"ï":[187,"M100 -17Q92 -25 88 -41Q85 -56 86 -72Q87 -88 91 -96Q91 -104 94 -108Q96 -113 95 -117Q94 -121 97 -131Q100 -141 103 -150Q110 -166 119 -192Q128 -217 137 -244Q146 -270 152 -290Q158 -309 159 -313Q159 -325 175 -326Q187 -330 204 -316Q221 -302 231 -286Q239 -278 237 -265Q235 -252 224 -228Q220 -220 214 -202Q209 -183 207 -171Q203 -163 198 -148Q192 -134 188 -121Q186 -116 184 -102Q182 -89 179 -75Q176 -61 171 -53Q162 -12 140 -5Q117 2 100 -17ZM140 -429Q130 -437 124 -454Q119 -470 121 -476Q123 -483 130 -502Q138 -520 153 -533Q157 -536 162 -542Q166 -547 171 -548Q185 -559 200 -552Q214 -544 225 -524Q236 -501 232 -486Q227 -471 205 -445Q186 -420 170 -418Q155 -415 140 -429ZM295 -429Q285 -437 280 -454Q274 -470 276 -476Q278 -483 286 -502Q293 -520 308 -533Q312 -536 316 -542Q321 -547 326 -548Q340 -559 354 -552Q369 -544 380 -524Q391 -501 386 -486Q382 -471 360 -445Q341 -420 326 -418Q310 -415 295 -429Z"],"ð":[349,"M180 8Q167 10 160 6Q152 1 141 -8Q128 -21 114 -38Q101 -54 92 -71Q84 -88 86 -99Q89 -108 87 -115Q85 -122 85 -122Q80 -127 82 -128Q84 -130 86 -134Q92 -135 90 -146Q89 -151 92 -166Q95 -182 102 -202Q110 -222 120 -238Q125 -248 136 -265Q146 -282 160 -300Q173 -317 185 -327Q208 -350 234 -365Q259 -380 281 -387Q303 -392 308 -392Q314 -391 329 -377Q331 -375 333 -375Q328 -422 316 -464Q303 -505 266 -556Q251 -572 240 -582Q229 -591 221 -604Q221 -607 230 -616Q240 -626 252 -636Q264 -645 270 -645Q275 -648 284 -644Q294 -639 303 -632Q312 -626 314 -623Q318 -627 328 -614Q337 -602 356 -577Q388 -536 404 -480Q420 -425 421 -364Q422 -303 408 -244Q395 -186 368 -138Q346 -100 320 -77Q295 -54 268 -34Q247 -19 225 -6Q203 6 180 8ZM256 -124Q271 -144 282 -157Q294 -170 304 -186Q314 -201 323 -226Q325 -237 328 -254Q330 -270 330 -284Q330 -299 324 -301Q312 -308 294 -305Q276 -302 258 -283Q227 -255 211 -220Q195 -186 175 -136Q165 -108 174 -94Q183 -80 205 -86Q227 -93 256 -124ZM252 -449Q237 -445 227 -450Q217 -455 212 -460Q199 -473 210 -484Q220 -495 255 -506Q286 -521 318 -531Q349 -541 389 -549Q405 -553 418 -554Q431 -554 442 -552Q453 -549 462 -543Q479 -532 474 -514Q470 -497 447 -496Q440 -494 418 -488Q397 -481 380 -476Q370 -473 342 -465Q315 -457 287 -451Q281 -450 272 -449Q263 -448 252 -449Z"],"ñ":[450,"M439 -24Q417 -26 402 -34Q388 -41 379 -64Q375 -80 376 -98Q376 -115 378 -132Q380 -148 380 -160Q380 -162 380 -168Q380 -174 380 -179Q378 -194 372 -198Q367 -201 354 -196Q333 -186 308 -170Q284 -153 258 -132Q231 -110 203 -86Q181 -62 170 -47Q160 -32 149 -32Q141 -28 132 -34Q123 -40 113 -48Q106 -56 96 -68Q87 -81 85 -85Q85 -101 88 -114Q90 -127 96 -141Q101 -155 109 -173Q113 -180 116 -188Q120 -195 125 -204Q129 -218 136 -236Q144 -254 151 -270Q162 -296 168 -315Q174 -334 178 -356Q177 -358 179 -362Q181 -366 185 -367H186H187Q194 -372 214 -368Q233 -365 243 -357Q264 -339 263 -310Q262 -281 233 -234Q226 -218 218 -204Q211 -191 211 -186Q211 -186 219 -192Q227 -198 238 -206Q249 -215 257 -220Q262 -225 279 -238Q296 -252 316 -267Q336 -282 348 -290Q359 -298 376 -306Q393 -315 397 -315Q407 -315 422 -308Q436 -301 448 -292Q461 -282 463 -274Q463 -270 462 -264Q461 -257 461 -252Q460 -236 460 -214Q461 -191 461 -168Q461 -146 457 -128Q457 -128 458 -126Q459 -125 460 -122Q459 -121 460 -118Q460 -116 460 -116Q462 -109 464 -102Q467 -95 471 -86Q475 -78 480 -65Q479 -52 466 -40Q452 -27 439 -24ZM437 -416Q417 -416 404 -424Q392 -431 373 -444Q364 -449 349 -464Q334 -479 322 -479Q312 -479 306 -471Q299 -463 293 -454Q287 -446 276 -444Q275 -439 270 -432Q265 -424 263 -429Q248 -431 240 -442Q233 -452 233 -464Q233 -473 248 -500Q264 -526 298 -543Q310 -548 332 -547Q353 -546 369 -531Q392 -510 408 -500Q425 -491 444 -499Q459 -503 478 -514Q496 -524 517 -532Q524 -535 531 -528Q538 -522 542 -512Q546 -502 545 -496Q545 -492 540 -480Q536 -467 517 -457Q487 -440 471 -431Q455 -422 448 -419Q441 -416 437 -416Z"],"ò":[353,"M164 -7Q151 -7 144 -12Q136 -17 125 -26Q106 -46 94 -69Q83 -92 86 -109Q89 -117 88 -124Q88 -132 88 -132Q83 -137 85 -138Q87 -140 89 -144Q95 -144 93 -155Q91 -163 100 -190Q108 -216 123 -240Q129 -250 141 -266Q153 -283 168 -300Q182 -316 194 -326Q219 -347 240 -360Q262 -373 284 -378Q306 -383 330 -383Q353 -383 368 -367Q391 -357 400 -340Q410 -323 413 -296Q416 -266 407 -222Q398 -179 358 -122Q333 -86 309 -66Q285 -46 256 -29Q235 -15 211 -12Q187 -9 164 -7ZM266 -129Q288 -148 298 -171Q307 -194 318 -225Q322 -231 324 -245Q325 -259 324 -272Q323 -286 317 -288Q308 -295 299 -292Q290 -288 276 -278Q246 -253 220 -220Q195 -188 185 -141Q182 -116 190 -104Q199 -91 218 -96Q238 -102 266 -129ZM341 -426Q328 -416 321 -419Q314 -422 309 -446Q305 -461 294 -480Q283 -498 272 -517Q261 -536 256 -552Q252 -568 260 -578Q265 -586 278 -597Q291 -608 306 -604Q315 -601 326 -586Q336 -571 346 -550Q355 -528 362 -506Q370 -483 375 -465Q376 -462 370 -454Q363 -445 355 -437Q347 -429 341 -426Z"],"ó":[353,"M164 -7Q151 -7 144 -12Q136 -17 125 -26Q106 -46 94 -69Q83 -92 86 -109Q89 -117 88 -124Q88 -132 88 -132Q83 -137 85 -138Q87 -140 89 -144Q95 -144 93 -155Q91 -163 100 -190Q108 -216 123 -240Q129 -250 141 -266Q153 -283 168 -300Q182 -316 194 -326Q219 -347 240 -360Q262 -373 284 -378Q306 -383 330 -383Q353 -383 368 -367Q391 -357 400 -340Q410 -323 413 -296Q416 -266 407 -222Q398 -179 358 -122Q333 -86 309 -66Q285 -46 256 -29Q235 -15 211 -12Q187 -9 164 -7ZM266 -129Q288 -148 298 -171Q307 -194 318 -225Q322 -231 324 -245Q325 -259 324 -272Q323 -286 317 -288Q308 -295 299 -292Q290 -288 276 -278Q246 -253 220 -220Q195 -188 185 -141Q182 -116 190 -104Q199 -91 218 -96Q238 -102 266 -129ZM342 -435Q333 -440 330 -456Q327 -472 329 -488Q330 -493 342 -508Q355 -524 374 -543Q392 -562 410 -578Q429 -593 441 -596Q455 -597 467 -582Q479 -568 480 -547Q480 -536 470 -525Q460 -514 445 -502Q430 -491 414 -478Q399 -466 389 -453Q379 -437 367 -432Q355 -427 342 -435Z"],"ô":[353,"M164 -7Q151 -7 144 -12Q136 -17 125 -26Q106 -46 94 -69Q83 -92 86 -109Q89 -117 88 -124Q88 -132 88 -132Q83 -137 85 -138Q87 -140 89 -144Q95 -144 93 -155Q91 -163 100 -190Q108 -216 123 -240Q129 -250 141 -266Q153 -283 168 -300Q182 -316 194 -326Q219 -347 240 -360Q262 -373 284 -378Q306 -383 330 -383Q353 -383 368 -367Q391 -357 400 -340Q410 -323 413 -296Q416 -266 407 -222Q398 -179 358 -122Q333 -86 309 -66Q285 -46 256 -29Q235 -15 211 -12Q187 -9 164 -7ZM266 -129Q288 -148 298 -171Q307 -194 318 -225Q322 -231 324 -245Q325 -259 324 -272Q323 -286 317 -288Q308 -295 299 -292Q290 -288 276 -278Q246 -253 220 -220Q195 -188 185 -141Q182 -116 190 -104Q199 -91 218 -96Q238 -102 266 -129ZM258 -441Q241 -424 227 -430Q213 -436 208 -452Q204 -469 215 -483Q218 -487 230 -498Q242 -510 258 -524Q274 -538 290 -550Q306 -562 316 -568Q333 -581 346 -578Q360 -575 366 -566Q378 -556 396 -538Q413 -521 428 -506Q443 -491 445 -488Q456 -476 454 -462Q453 -448 443 -438Q433 -428 420 -428Q406 -428 392 -444Q385 -453 369 -468Q353 -484 338 -497Q326 -490 309 -479Q293 -468 279 -458Q265 -447 258 -441Z"],"õ":[353,"M164 -7Q151 -7 144 -12Q136 -17 125 -26Q106 -46 94 -69Q83 -92 86 -109Q89 -117 88 -124Q88 -132 88 -132Q83 -137 85 -138Q87 -140 89 -144Q95 -144 93 -155Q91 -163 100 -190Q108 -216 123 -240Q129 -250 141 -266Q153 -283 168 -300Q182 -316 194 -326Q219 -347 240 -360Q262 -373 284 -378Q306 -383 330 -383Q353 -383 368 -367Q391 -357 400 -340Q410 -323 413 -296Q416 -266 407 -222Q398 -179 358 -122Q333 -86 309 -66Q285 -46 256 -29Q235 -15 211 -12Q187 -9 164 -7ZM266 -129Q288 -148 298 -171Q307 -194 318 -225Q322 -231 324 -245Q325 -259 324 -272Q323 -286 317 -288Q308 -295 299 -292Q290 -288 276 -278Q246 -253 220 -220Q195 -188 185 -141Q182 -116 190 -104Q199 -91 218 -96Q238 -102 266 -129ZM388 -416Q368 -416 356 -424Q343 -431 324 -444Q315 -449 300 -464Q285 -479 273 -479Q263 -479 256 -471Q250 -463 244 -454Q238 -446 227 -444Q226 -439 221 -432Q216 -424 214 -429Q199 -431 192 -442Q184 -452 184 -464Q184 -473 200 -500Q215 -526 249 -543Q261 -548 282 -547Q304 -546 320 -531Q343 -510 360 -500Q376 -491 395 -499Q410 -503 428 -514Q447 -524 468 -532Q475 -535 482 -528Q489 -522 493 -512Q497 -502 496 -496Q496 -492 492 -480Q487 -467 468 -457Q438 -440 422 -431Q406 -422 399 -419Q392 -416 388 -416Z"],"ö":[353,"M164 -7Q151 -7 144 -12Q136 -17 125 -26Q106 -46 94 -69Q83 -92 86 -109Q89 -117 88 -124Q88 -132 88 -132Q83 -137 85 -138Q87 -140 89 -144Q95 -144 93 -155Q91 -163 100 -190Q108 -216 123 -240Q129 -250 141 -266Q153 -283 168 -300Q182 -316 194 -326Q219 -347 240 -360Q262 -373 284 -378Q306 -383 330 -383Q353 -383 368 -367Q391 -357 400 -340Q410 -323 413 -296Q416 -266 407 -222Q398 -179 358 -122Q333 -86 309 -66Q285 -46 256 -29Q235 -15 211 -12Q187 -9 164 -7ZM266 -129Q288 -148 298 -171Q307 -194 318 -225Q322 -231 324 -245Q325 -259 324 -272Q323 -286 317 -288Q308 -295 299 -292Q290 -288 276 -278Q246 -253 220 -220Q195 -188 185 -141Q182 -116 190 -104Q199 -91 218 -96Q238 -102 266 -129ZM236 -429Q226 -437 220 -454Q215 -470 217 -476Q219 -483 226 -502Q234 -520 249 -533Q253 -536 258 -542Q262 -547 267 -548Q281 -559 296 -552Q310 -544 321 -524Q332 -501 328 -486Q323 -471 301 -445Q282 -420 266 -418Q251 -415 236 -429ZM391 -429Q381 -437 376 -454Q370 -470 372 -476Q374 -483 382 -502Q389 -520 404 -533Q408 -536 412 -542Q417 -547 422 -548Q436 -559 450 -552Q465 -544 476 -524Q487 -501 482 -486Q478 -471 456 -445Q437 -420 422 -418Q406 -415 391 -429Z"],"÷":[446,"M170 -172Q164 -172 155 -172Q146 -173 135 -177Q120 -177 112 -184Q103 -190 99 -197Q88 -212 100 -220Q113 -229 150 -233Q167 -237 200 -240Q234 -242 273 -244Q312 -245 347 -246Q382 -247 402 -247Q428 -247 448 -242Q469 -237 480 -226Q495 -211 487 -194Q479 -178 456 -182Q451 -182 437 -181Q423 -180 407 -179Q390 -178 378 -177Q372 -177 345 -176Q318 -175 282 -174Q247 -173 216 -172Q184 -172 170 -172ZM212 13Q201 5 196 -6Q190 -17 190 -26Q189 -36 191 -38Q201 -49 208 -68Q216 -86 225 -100Q227 -104 230 -109Q234 -114 238 -115Q250 -123 272 -114Q293 -105 303 -89Q312 -70 308 -50Q305 -30 287 -8Q272 12 249 18Q226 23 212 13ZM304 -316Q293 -324 288 -335Q282 -346 281 -356Q280 -365 282 -366Q293 -378 300 -396Q308 -414 316 -429Q318 -432 322 -438Q325 -443 329 -444Q341 -452 362 -442Q384 -433 394 -417Q403 -398 400 -378Q396 -358 378 -336Q363 -316 340 -311Q318 -306 304 -316Z"],"ø":[353,"M69 15Q50 10 54 -10Q58 -31 83 -56Q139 -110 192 -168Q246 -225 313 -272Q322 -277 342 -292Q363 -308 385 -326Q407 -345 424 -360Q441 -375 443 -378Q448 -391 458 -384Q467 -378 471 -367Q474 -356 463 -345Q460 -338 456 -334Q451 -329 440 -322Q430 -314 408 -298Q371 -273 338 -246Q305 -219 268 -187Q255 -176 234 -156Q213 -136 188 -112Q164 -89 142 -66Q119 -44 104 -28Q88 -11 85 -6Q78 7 76 11Q73 15 69 15ZM283 -134Q300 -153 311 -170Q322 -188 334 -220Q338 -231 341 -248Q344 -266 344 -281Q345 -296 339 -299Q326 -307 310 -304Q294 -301 271 -281Q251 -264 238 -248Q225 -232 214 -210Q203 -187 188 -150Q177 -123 178 -103Q178 -83 190 -76Q202 -70 225 -82Q248 -95 283 -134ZM198 9Q185 10 177 6Q169 3 157 -4Q135 -21 120 -46Q106 -71 107 -88Q109 -97 108 -104Q106 -111 106 -111Q100 -116 102 -118Q104 -119 105 -123Q113 -125 107 -134Q104 -142 110 -170Q117 -199 128 -224Q133 -235 142 -253Q152 -271 164 -290Q176 -308 186 -319Q208 -344 226 -360Q243 -376 265 -384Q285 -392 306 -391Q326 -390 342 -377Q366 -370 385 -356Q404 -341 411 -315Q419 -286 416 -246Q414 -207 382 -145Q363 -106 344 -82Q326 -58 300 -36Q281 -20 251 -8Q221 4 198 9Z"],"ù":[370,"M336 -2Q326 -12 320 -30Q314 -47 308 -70Q306 -78 306 -88Q307 -98 306 -104Q303 -97 296 -86Q290 -75 284 -70Q280 -66 266 -54Q252 -43 238 -36Q205 -15 180 -16Q154 -18 135 -42Q119 -55 109 -75Q99 -95 105 -123Q107 -158 115 -192Q123 -225 148 -281Q169 -322 180 -345Q191 -368 194 -372Q209 -377 231 -372Q253 -366 255 -352Q261 -342 255 -314Q249 -287 231 -252Q217 -218 204 -186Q192 -154 190 -132Q187 -110 201 -105Q210 -100 228 -106Q245 -112 269 -142Q293 -172 320 -237Q328 -257 332 -272Q336 -288 337 -307Q335 -319 344 -332Q352 -345 364 -352Q368 -357 375 -362Q382 -366 384 -361L400 -362Q404 -363 409 -354Q414 -345 419 -341Q430 -332 429 -302Q428 -272 405 -218Q386 -177 380 -156Q373 -135 372 -115Q372 -97 375 -84Q378 -72 393 -59Q404 -52 406 -36Q407 -19 406 -7Q404 2 390 6Q377 9 362 7Q346 5 336 -2ZM330 -428Q317 -418 310 -421Q303 -424 298 -448Q294 -463 283 -482Q272 -500 261 -519Q250 -538 246 -554Q241 -570 249 -580Q254 -588 267 -599Q280 -610 295 -606Q304 -603 314 -588Q325 -573 334 -552Q344 -530 352 -508Q359 -485 364 -467Q365 -464 358 -456Q352 -447 344 -439Q336 -431 330 -428Z"],"ú":[370,"M336 -2Q326 -12 320 -30Q314 -47 308 -70Q306 -78 306 -88Q307 -98 306 -104Q303 -97 296 -86Q290 -75 284 -70Q280 -66 266 -54Q252 -43 238 -36Q205 -15 180 -16Q154 -18 135 -42Q119 -55 109 -75Q99 -95 105 -123Q107 -158 115 -192Q123 -225 148 -281Q169 -322 180 -345Q191 -368 194 -372Q209 -377 231 -372Q253 -366 255 -352Q261 -342 255 -314Q249 -287 231 -252Q217 -218 204 -186Q192 -154 190 -132Q187 -110 201 -105Q210 -100 228 -106Q245 -112 269 -142Q293 -172 320 -237Q328 -257 332 -272Q336 -288 337 -307Q335 -319 344 -332Q352 -345 364 -352Q368 -357 375 -362Q382 -366 384 -361L400 -362Q404 -363 409 -354Q414 -345 419 -341Q430 -332 429 -302Q428 -272 405 -218Q386 -177 380 -156Q373 -135 372 -115Q372 -97 375 -84Q378 -72 393 -59Q404 -52 406 -36Q407 -19 406 -7Q404 2 390 6Q377 9 362 7Q346 5 336 -2ZM307 -432Q298 -437 295 -453Q292 -469 294 -485Q295 -490 308 -506Q320 -521 338 -540Q357 -559 376 -574Q394 -590 406 -593Q420 -594 432 -580Q444 -565 445 -544Q445 -533 435 -522Q425 -511 410 -500Q395 -488 380 -476Q364 -463 354 -450Q344 -434 332 -429Q320 -424 307 -432Z"],"û":[370,"M336 -2Q326 -12 320 -30Q314 -47 308 -70Q306 -78 306 -88Q307 -98 306 -104Q303 -97 296 -86Q290 -75 284 -70Q280 -66 266 -54Q252 -43 238 -36Q205 -15 180 -16Q154 -18 135 -42Q119 -55 109 -75Q99 -95 105 -123Q107 -158 115 -192Q123 -225 148 -281Q169 -322 180 -345Q191 -368 194 -372Q209 -377 231 -372Q253 -366 255 -352Q261 -342 255 -314Q249 -287 231 -252Q217 -218 204 -186Q192 -154 190 -132Q187 -110 201 -105Q210 -100 228 -106Q245 -112 269 -142Q293 -172 320 -237Q328 -257 332 -272Q336 -288 337 -307Q335 -319 344 -332Q352 -345 364 -352Q368 -357 375 -362Q382 -366 384 -361L400 -362Q404 -363 409 -354Q414 -345 419 -341Q430 -332 429 -302Q428 -272 405 -218Q386 -177 380 -156Q373 -135 372 -115Q372 -97 375 -84Q378 -72 393 -59Q404 -52 406 -36Q407 -19 406 -7Q404 2 390 6Q377 9 362 7Q346 5 336 -2ZM268 -441Q251 -424 237 -430Q223 -436 218 -452Q214 -469 225 -483Q228 -487 240 -498Q252 -510 268 -524Q284 -538 300 -550Q316 -562 326 -568Q343 -581 356 -578Q370 -575 376 -566Q388 -556 406 -538Q423 -521 438 -506Q453 -491 455 -488Q466 -476 464 -462Q463 -448 453 -438Q443 -428 430 -428Q416 -428 402 -444Q395 -453 379 -468Q363 -484 348 -497Q336 -490 319 -479Q303 -468 289 -458Q275 -447 268 -441Z"],"ü":[370,"M336 -2Q326 -12 320 -30Q314 -47 308 -70Q306 -78 306 -88Q307 -98 306 -104Q303 -97 296 -86Q290 -75 284 -70Q280 -66 266 -54Q252 -43 238 -36Q205 -15 180 -16Q154 -18 135 -42Q119 -55 109 -75Q99 -95 105 -123Q107 -158 115 -192Q123 -225 148 -281Q169 -322 180 -345Q191 -368 194 -372Q209 -377 231 -372Q253 -366 255 -352Q261 -342 255 -314Q249 -287 231 -252Q217 -218 204 -186Q192 -154 190 -132Q187 -110 201 -105Q210 -100 228 -106Q245 -112 269 -142Q293 -172 320 -237Q328 -257 332 -272Q336 -288 337 -307Q335 -319 344 -332Q352 -345 364 -352Q368 -357 375 -362Q382 -366 384 -361L400 -362Q404 -363 409 -354Q414 -345 419 -341Q430 -332 429 -302Q428 -272 405 -218Q386 -177 380 -156Q373 -135 372 -115Q372 -97 375 -84Q378 -72 393 -59Q404 -52 406 -36Q407 -19 406 -7Q404 2 390 6Q377 9 362 7Q346 5 336 -2ZM246 -429Q236 -437 230 -454Q225 -470 227 -476Q229 -483 236 -502Q244 -520 259 -533Q263 -536 268 -542Q272 -547 277 -548Q291 -559 306 -552Q320 -544 331 -524Q342 -501 338 -486Q333 -471 311 -445Q292 -420 276 -418Q261 -415 246 -429ZM401 -429Q391 -437 386 -454Q380 -470 382 -476Q384 -483 392 -502Q399 -520 414 -533Q418 -536 422 -542Q427 -547 432 -548Q446 -559 460 -552Q475 -544 486 -524Q497 -501 492 -486Q488 -471 466 -445Q447 -420 432 -418Q416 -415 401 -429Z"],"ý":[341,"M86 208Q50 215 17 210Q-16 206 -38 193Q-61 180 -66 164Q-72 141 -60 130Q-48 119 -32 117Q-15 115 -10 121Q-2 126 16 136Q33 146 59 141Q82 136 100 119Q118 102 132 83Q140 71 159 40Q178 9 198 -28Q219 -66 233 -98Q236 -106 240 -117Q244 -128 250 -135Q256 -147 260 -158Q265 -168 266 -172Q267 -177 275 -192Q283 -207 290 -222Q295 -237 305 -266Q315 -295 325 -313Q337 -336 344 -350Q352 -365 361 -368Q370 -375 378 -375Q386 -375 397 -369Q409 -357 416 -346Q424 -334 422 -318Q421 -301 406 -273Q398 -249 388 -230Q379 -210 374 -204Q369 -192 362 -178Q356 -163 351 -151Q333 -111 320 -86Q307 -61 297 -40Q287 -19 276 9Q253 46 232 80Q210 113 186 142Q176 151 158 166Q139 180 120 192Q100 205 86 208ZM211 -18Q196 -20 178 -38Q161 -56 150 -76Q138 -96 140 -104Q140 -109 140 -112Q140 -115 140 -115Q134 -115 130 -132Q127 -150 126 -177Q124 -204 124 -233Q125 -262 127 -286Q131 -303 131 -324Q131 -344 132 -356Q131 -372 138 -382Q146 -392 150 -395Q187 -411 204 -378Q221 -345 216 -273Q214 -233 214 -196Q214 -160 221 -134Q228 -108 245 -97Q252 -93 250 -80Q248 -67 241 -52Q234 -38 226 -28Q217 -17 211 -18ZM301 -435Q292 -440 289 -456Q286 -472 288 -488Q289 -493 302 -508Q314 -524 332 -543Q351 -562 370 -578Q388 -593 400 -596Q414 -597 426 -582Q438 -568 439 -547Q439 -536 429 -525Q419 -514 404 -502Q389 -491 374 -478Q358 -466 348 -453Q338 -437 326 -432Q314 -427 301 -435Z"],"þ":[378,"M69 233Q65 233 58 233Q50 233 45 223Q41 218 34 201Q27 184 32 165Q36 148 40 134Q43 119 43 110Q43 100 46 90Q48 81 48 76Q53 68 56 54Q59 39 59 27Q59 22 63 16Q67 10 71 6Q71 -2 74 -14Q78 -27 78 -32Q81 -44 90 -73Q100 -102 112 -140Q125 -177 138 -214Q150 -252 160 -281Q171 -310 175 -322L179 -332L251 -308Q300 -338 337 -340Q374 -343 398 -326Q423 -310 435 -284Q447 -258 446 -232Q446 -222 438 -202Q430 -183 420 -165Q409 -147 403 -141Q399 -141 395 -134Q391 -127 387 -119Q378 -109 360 -97Q342 -85 324 -78Q306 -71 298 -74Q298 -74 296 -74Q293 -73 293 -68Q293 -62 278 -56Q264 -50 244 -46Q225 -41 209 -41Q197 -41 191 -42Q185 -44 180 -48Q177 -46 175 -42Q173 -38 173 -33Q172 -26 168 -14Q163 -2 157 8Q151 17 147 17Q147 17 145 20Q143 23 147 28Q147 28 146 40Q146 52 141 59Q141 67 138 83Q136 99 131 107Q131 120 128 131Q124 142 119 142Q114 143 114 158Q113 172 113 177Q109 200 96 216Q84 233 69 233ZM199 -116Q203 -116 224 -122Q244 -129 268 -140Q292 -150 305 -161Q336 -187 350 -210Q363 -233 347 -255Q339 -267 326 -268Q312 -269 291 -257Q270 -245 239 -218Q227 -205 217 -188Q207 -171 200 -154Q194 -138 193 -127Q192 -116 199 -116ZM170 -310Q177 -325 190 -359Q204 -393 220 -434Q235 -476 249 -516Q263 -555 272 -582Q282 -609 283 -613Q284 -618 286 -624Q287 -631 299 -641Q302 -644 309 -646Q316 -647 320 -647Q320 -647 332 -646Q343 -644 350 -636Q359 -623 362 -608Q365 -594 361 -577Q359 -567 352 -546Q345 -526 330 -488Q314 -450 286 -386L248 -292Z"],"ÿ":[341,"M86 208Q50 215 17 210Q-16 206 -38 193Q-61 180 -66 164Q-72 141 -60 130Q-48 119 -32 117Q-15 115 -10 121Q-2 126 16 136Q33 146 59 141Q82 136 100 119Q118 102 132 83Q140 71 159 40Q178 9 198 -28Q219 -66 233 -98Q236 -106 240 -117Q244 -128 250 -135Q256 -147 260 -158Q265 -168 266 -172Q267 -177 275 -192Q283 -207 290 -222Q295 -237 305 -266Q315 -295 325 -313Q337 -336 344 -350Q352 -365 361 -368Q370 -375 378 -375Q386 -375 397 -369Q409 -357 416 -346Q424 -334 422 -318Q421 -301 406 -273Q398 -249 388 -230Q379 -210 374 -204Q369 -192 362 -178Q356 -163 351 -151Q333 -111 320 -86Q307 -61 297 -40Q287 -19 276 9Q253 46 232 80Q210 113 186 142Q176 151 158 166Q139 180 120 192Q100 205 86 208ZM211 -18Q196 -20 178 -38Q161 -56 150 -76Q138 -96 140 -104Q140 -109 140 -112Q140 -115 140 -115Q134 -115 130 -132Q127 -150 126 -177Q124 -204 124 -233Q125 -262 127 -286Q131 -303 131 -324Q131 -344 132 -356Q131 -372 138 -382Q146 -392 150 -395Q187 -411 204 -378Q221 -345 216 -273Q214 -233 214 -196Q214 -160 221 -134Q228 -108 245 -97Q252 -93 250 -80Q248 -67 241 -52Q234 -38 226 -28Q217 -17 211 -18ZM195 -429Q185 -437 180 -454Q174 -470 176 -476Q178 -483 186 -502Q193 -520 208 -533Q212 -536 216 -542Q221 -547 226 -548Q240 -559 254 -552Q269 -544 280 -524Q291 -501 286 -486Q282 -471 260 -445Q241 -420 226 -418Q210 -415 195 -429ZM350 -429Q340 -437 334 -454Q329 -470 331 -476Q333 -483 340 -502Q348 -520 363 -533Q367 -536 372 -542Q376 -547 381 -548Q395 -559 410 -552Q424 -544 435 -524Q446 -501 442 -486Q437 -471 415 -445Q396 -420 380 -418Q365 -415 350 -429Z"],"Ă":[502,"M57 33Q39 23 38 11Q36 -1 51 -31Q66 -61 98 -124Q122 -169 130 -194Q139 -220 140 -231Q141 -242 141 -245Q139 -254 143 -260Q147 -265 156 -269Q161 -274 179 -287Q197 -300 207 -318Q216 -339 227 -361Q239 -383 258 -416Q277 -450 309 -504Q329 -539 356 -583Q384 -627 411 -663Q422 -677 434 -685Q446 -693 455 -693Q477 -693 499 -682Q521 -670 538 -653Q555 -636 561 -621Q566 -613 565 -587Q564 -561 561 -524Q558 -487 554 -445Q551 -404 545 -348Q539 -292 534 -231Q528 -170 525 -114Q522 -57 525 -15Q526 -6 525 2Q524 10 524 15Q518 21 498 20Q478 20 459 14Q440 8 438 -1Q435 -4 434 -6Q433 -8 434 -26Q435 -43 437 -90L442 -243L429 -242Q420 -242 396 -240Q373 -238 345 -234Q318 -231 295 -228Q272 -224 263 -221Q254 -221 242 -209Q229 -197 218 -178Q214 -164 204 -148Q193 -133 193 -128Q186 -123 182 -116Q177 -109 177 -109Q177 -103 168 -80Q160 -56 146 -28Q133 1 119 22L92 60ZM296 -311Q296 -311 307 -313Q318 -315 334 -318Q349 -320 361 -320Q384 -326 400 -329Q415 -332 425 -332Q435 -333 441 -330Q445 -325 448 -324Q452 -323 452 -323Q453 -325 456 -344Q459 -363 463 -391Q467 -419 471 -450Q475 -480 478 -506Q481 -533 482 -548Q483 -567 481 -582Q479 -598 479 -598Q473 -598 456 -576Q440 -555 418 -520Q397 -484 376 -443Q366 -424 357 -413Q349 -402 344 -402Q342 -400 334 -387Q325 -373 316 -356Q306 -340 300 -326Q293 -313 296 -311ZM519 -701Q487 -704 460 -717Q432 -730 420 -756Q407 -781 416 -819Q422 -846 435 -856Q448 -867 461 -866Q474 -864 482 -853Q489 -842 484 -825Q481 -814 482 -801Q482 -788 493 -779Q504 -770 534 -771Q547 -772 558 -780Q569 -789 578 -801Q586 -813 592 -823Q609 -853 622 -860Q636 -868 646 -862Q655 -855 658 -841Q662 -827 659 -813Q655 -794 642 -773Q630 -752 612 -735Q593 -718 570 -708Q546 -699 519 -701Z"],"ı":[187,"M100 -17Q92 -25 88 -41Q85 -56 86 -72Q87 -88 91 -96Q91 -104 94 -108Q96 -113 95 -117Q94 -121 97 -131Q100 -141 103 -150Q110 -166 119 -192Q128 -217 137 -244Q146 -270 152 -290Q158 -309 159 -313Q159 -325 175 -326Q187 -330 204 -316Q221 -302 231 -286Q239 -278 237 -265Q235 -252 224 -228Q220 -220 214 -202Q209 -183 207 -171Q203 -163 198 -148Q192 -134 188 -121Q186 -116 184 -102Q182 -89 179 -75Q176 -61 171 -53Q162 -12 140 -5Q117 2 100 -17Z"],"Œ":[784,"M603 50Q557 49 534 45Q510 41 497 32Q484 23 466 9Q459 4 450 -14Q442 -32 438 -39Q433 -37 423 -28Q413 -19 408 -15Q402 -6 384 2Q366 10 343 16Q320 21 298 24Q277 28 263 28Q224 20 190 3Q157 -14 133 -40Q111 -64 107 -96Q103 -127 110 -162Q117 -197 125 -230Q135 -246 140 -258Q146 -270 149 -281Q152 -292 154 -305Q168 -319 177 -329Q186 -339 194 -354Q202 -368 214 -392Q225 -416 244 -458Q269 -499 299 -532Q329 -565 358 -590Q387 -615 409 -631Q422 -643 437 -648Q452 -653 466 -654Q480 -655 490 -653Q516 -650 538 -640Q561 -631 579 -614Q597 -597 611 -571L614 -565L624 -589Q625 -597 632 -608Q640 -619 650 -623Q674 -632 710 -640Q747 -649 784 -655Q822 -661 847 -660Q887 -662 909 -658Q931 -655 944 -648Q957 -641 969 -630Q980 -622 982 -613Q984 -604 984 -604Q983 -589 960 -586Q938 -583 905 -583Q868 -583 829 -578Q790 -573 761 -569Q747 -565 736 -564Q726 -563 726 -563Q722 -563 715 -555Q708 -547 700 -534Q693 -522 687 -508Q681 -493 679 -480Q679 -470 664 -451Q650 -432 644 -417Q639 -409 638 -399Q636 -389 645 -385Q661 -388 688 -392Q716 -395 743 -398Q770 -400 785 -400Q800 -402 810 -400Q820 -397 825 -394Q837 -392 839 -382Q841 -372 836 -362Q832 -352 824 -348Q818 -342 796 -334Q773 -327 742 -319Q711 -311 680 -304Q650 -298 628 -294Q606 -291 602 -292Q594 -303 587 -291Q580 -279 570 -234Q554 -203 547 -174Q540 -145 532 -98Q533 -72 550 -57Q566 -42 582 -36Q604 -35 628 -36Q651 -38 684 -46Q702 -57 720 -67Q738 -77 745 -81Q750 -81 760 -85Q770 -89 774 -89Q778 -94 782 -98Q786 -101 793 -101Q798 -101 808 -91Q818 -81 826 -67Q834 -53 833 -39Q833 -29 811 -18Q789 -7 739 13Q714 24 695 32Q676 41 656 46Q635 50 603 50ZM477 -554Q463 -559 436 -546Q408 -534 374 -489Q370 -474 360 -463Q350 -452 338 -439Q326 -426 315 -404Q290 -363 270 -318Q251 -273 238 -236Q224 -199 216 -180Q212 -162 208 -150Q204 -139 203 -124Q204 -103 216 -91Q227 -79 237 -69Q240 -67 249 -66Q258 -64 269 -64Q280 -63 286 -64Q302 -63 317 -64Q332 -65 351 -71Q351 -71 360 -75Q368 -79 376 -81Q381 -84 388 -94Q395 -105 405 -109Q410 -113 420 -128Q431 -144 444 -165Q447 -177 450 -190Q454 -202 458 -206L467 -225Q472 -249 477 -272Q482 -294 488 -300Q491 -302 494 -312Q498 -321 499 -323Q499 -323 500 -332Q502 -342 506 -352Q514 -366 516 -370Q519 -375 519 -379Q521 -383 526 -390Q531 -396 533 -402L547 -432Q547 -436 549 -452Q551 -469 543 -479Q537 -507 528 -525Q520 -543 508 -550Q495 -558 477 -554Z"],"œ":[541,"M166 7Q152 7 144 2Q137 -2 125 -9Q105 -26 92 -50Q80 -73 80 -91Q81 -100 80 -106Q79 -112 77 -113Q73 -115 74 -118Q74 -120 78 -124Q82 -128 79 -139Q77 -146 83 -175Q89 -204 100 -230Q107 -246 116 -262Q124 -277 136 -292Q147 -308 159 -320Q179 -345 196 -361Q214 -377 239 -387Q268 -394 281 -393Q294 -392 314 -380Q339 -373 358 -357Q376 -341 383 -315Q388 -297 389 -276Q390 -255 382 -226Q375 -196 354 -150Q325 -92 302 -68Q279 -45 265 -34Q242 -18 218 -8Q195 2 166 7ZM249 -130Q263 -150 275 -176Q287 -201 293 -232Q295 -242 295 -256Q295 -271 293 -283Q291 -295 286 -298Q276 -302 261 -298Q246 -294 229 -276Q210 -254 194 -217Q179 -180 165 -126Q163 -102 170 -88Q177 -75 196 -83Q216 -91 249 -130ZM520 -25Q493 -7 460 -2Q428 2 398 -6Q368 -15 347 -34Q323 -62 318 -90Q312 -119 316 -166Q320 -206 340 -250Q361 -295 392 -332Q422 -368 456 -382Q471 -390 486 -396Q502 -401 535 -397Q561 -395 580 -384Q600 -374 611 -362Q629 -341 630 -324Q632 -307 628 -288Q624 -272 610 -250Q597 -229 578 -210Q558 -192 536 -183Q516 -174 491 -172Q466 -170 429 -180Q409 -187 402 -175Q395 -163 396 -148Q397 -114 408 -100Q418 -86 437 -83Q457 -82 469 -87Q481 -92 495 -101Q503 -109 512 -115Q521 -121 531 -128Q539 -134 548 -134Q558 -134 562 -130Q569 -126 574 -120Q580 -114 584 -106Q587 -101 580 -86Q572 -72 556 -55Q541 -38 520 -25ZM499 -244Q507 -248 520 -259Q533 -270 544 -282Q554 -294 554 -300Q555 -314 537 -322Q519 -329 504 -322Q491 -317 478 -306Q465 -296 454 -284Q444 -272 438 -263Q431 -254 431 -252Q439 -245 453 -243Q467 -241 480 -242Q494 -242 499 -244Z"],"ʼ":[353,"M329 -436Q319 -436 316 -438Q314 -439 310 -446Q310 -453 314 -462Q317 -472 324 -478Q334 -488 346 -502Q359 -517 368 -532Q378 -547 377 -557Q376 -579 388 -596Q400 -614 417 -620Q434 -627 449 -612Q453 -591 453 -566Q453 -542 442 -517Q440 -510 430 -496Q419 -483 408 -472Q398 -460 395 -460Q391 -460 385 -453Q379 -446 375 -442Q371 -438 356 -437Q340 -436 329 -436Z"],"ˆ":[353,"M259 -441Q242 -424 228 -430Q214 -436 210 -452Q205 -469 216 -483Q219 -487 231 -498Q243 -510 259 -524Q275 -538 291 -550Q307 -562 317 -568Q334 -581 348 -578Q361 -575 367 -566Q379 -556 396 -538Q414 -521 429 -506Q444 -491 446 -488Q457 -476 456 -462Q454 -448 444 -438Q434 -428 420 -428Q407 -428 393 -444Q386 -453 370 -468Q354 -484 339 -497Q327 -490 310 -479Q294 -468 280 -458Q266 -447 259 -441Z"],"˚":[353,"M360 -400Q321 -400 304 -423Q287 -446 283 -479Q283 -501 293 -526Q302 -552 320 -570Q338 -589 362 -589Q399 -589 424 -572Q449 -556 449 -522Q449 -494 438 -466Q427 -438 408 -419Q388 -400 360 -400ZM359 -458Q375 -458 384 -468Q393 -478 393 -498Q392 -509 389 -519Q385 -529 371 -529Q338 -529 338 -487Q338 -478 346 -468Q353 -458 359 -458Z"],"˜":[353,"M387 -416Q367 -416 354 -424Q342 -431 323 -444Q314 -449 299 -464Q284 -479 272 -479Q262 -479 256 -471Q249 -463 243 -454Q237 -446 226 -444Q225 -439 220 -432Q215 -424 213 -429Q198 -431 190 -442Q183 -452 183 -464Q183 -473 198 -500Q214 -526 248 -543Q260 -548 282 -547Q303 -546 319 -531Q342 -510 358 -500Q375 -491 394 -499Q409 -503 428 -514Q446 -524 467 -532Q474 -535 481 -528Q488 -522 492 -512Q496 -502 495 -496Q495 -492 490 -480Q486 -467 467 -457Q437 -440 421 -431Q405 -422 398 -419Q391 -416 387 -416Z"],"̀":[0,"M340 -426Q327 -416 320 -419Q313 -422 308 -446Q304 -461 293 -480Q282 -498 271 -517Q260 -536 256 -552Q251 -568 259 -578Q264 -586 277 -597Q290 -608 305 -604Q314 -601 324 -586Q335 -571 344 -550Q354 -528 362 -506Q369 -483 374 -465Q375 -462 368 -454Q362 -445 354 -437Q346 -429 340 -426Z"],"́":[0,"M343 -435Q334 -440 331 -456Q328 -472 330 -488Q331 -493 344 -508Q356 -524 374 -543Q393 -562 412 -578Q430 -593 442 -596Q456 -597 468 -582Q480 -568 481 -547Q481 -536 471 -525Q461 -514 446 -502Q431 -491 416 -478Q400 -466 390 -453Q380 -437 368 -432Q356 -427 343 -435Z"],"̃":[0,"M387 -416Q367 -416 354 -424Q342 -431 323 -444Q314 -449 299 -464Q284 -479 272 -479Q262 -479 256 -471Q249 -463 243 -454Q237 -446 226 -444Q225 -439 220 -432Q215 -424 213 -429Q198 -431 190 -442Q183 -452 183 -464Q183 -473 198 -500Q214 -526 248 -543Q260 -548 282 -547Q303 -546 319 -531Q342 -510 358 -500Q375 -491 394 -499Q409 -503 428 -514Q446 -524 467 -532Q474 -535 481 -528Q488 -522 492 -512Q496 -502 495 -496Q495 -492 490 -480Q486 -467 467 -457Q437 -440 421 -431Q405 -422 398 -419Q391 -416 387 -416Z"],"̄":[0,"M298 -453Q292 -453 283 -454Q274 -454 263 -458Q248 -458 240 -464Q231 -470 227 -477Q217 -492 229 -500Q241 -509 278 -513Q312 -521 337 -524Q362 -527 402 -527Q427 -527 444 -522Q460 -517 471 -507Q486 -492 478 -476Q471 -459 448 -462Q441 -461 418 -460Q396 -459 378 -458Q368 -457 347 -455Q326 -453 298 -453Z"],"̈":[0,"M235 -429Q225 -437 220 -454Q214 -470 216 -476Q218 -483 226 -502Q233 -520 248 -533Q252 -536 256 -542Q261 -547 266 -548Q280 -559 294 -552Q309 -544 320 -524Q331 -501 326 -486Q322 -471 300 -445Q281 -420 266 -418Q250 -415 235 -429ZM390 -429Q380 -437 374 -454Q369 -470 371 -476Q373 -483 380 -502Q388 -520 403 -533Q407 -536 412 -542Q416 -547 421 -548Q435 -559 450 -552Q464 -544 475 -524Q486 -501 482 -486Q477 -471 455 -445Q436 -420 420 -418Q405 -415 390 -429Z"],"̣":[0,"M93 157Q81 144 78 134Q74 124 75 117Q80 102 89 86Q98 69 105 64Q112 58 117 56Q122 53 126 52Q138 44 152 49Q166 54 177 68Q191 90 188 103Q186 116 170 134Q141 163 126 166Q110 170 93 157Z"],"–":[446,"M170 -172Q164 -172 155 -172Q146 -173 135 -177Q120 -177 112 -184Q103 -190 99 -197Q88 -212 100 -220Q113 -229 150 -233Q167 -237 200 -240Q234 -242 273 -244Q312 -245 347 -246Q382 -247 402 -247Q428 -247 448 -242Q469 -237 480 -226Q495 -211 487 -194Q479 -178 456 -182Q451 -182 437 -181Q423 -180 407 -179Q390 -178 378 -177Q372 -177 345 -176Q318 -175 282 -174Q247 -173 216 -172Q184 -172 170 -172Z"],"—":[566,"M170 -173Q164 -173 155 -174Q146 -174 135 -178Q120 -178 112 -184Q103 -190 99 -197Q88 -212 100 -220Q113 -227 150 -231Q164 -234 202 -236Q241 -239 292 -240Q344 -242 396 -243Q448 -244 488 -244Q529 -245 545 -245Q571 -245 580 -241Q589 -237 600 -226Q615 -211 607 -195Q599 -179 576 -183Q569 -182 554 -181Q539 -180 521 -178Q517 -178 493 -178Q469 -177 432 -176Q395 -176 354 -176Q313 -175 274 -174Q236 -174 208 -174Q180 -173 170 -173Z"],"‘":[117,"M194 -439Q178 -450 167 -470Q156 -489 160 -502Q163 -525 170 -545Q178 -565 184 -584Q190 -607 208 -632Q227 -657 244 -676Q243 -680 250 -681Q257 -682 268 -686Q279 -687 293 -686Q307 -685 311 -667Q313 -660 310 -654Q306 -649 301 -641Q289 -622 274 -598Q258 -573 253 -558Q253 -554 252 -551Q269 -554 287 -539Q306 -521 297 -492Q288 -462 262 -444Q244 -433 228 -432Q212 -432 194 -439Z"],"’":[117,"M218 -434Q208 -433 194 -434Q179 -435 176 -453Q175 -460 178 -466Q181 -472 186 -479Q198 -499 214 -523Q229 -547 234 -562Q234 -566 235 -569Q218 -566 200 -581Q181 -599 190 -628Q198 -658 224 -676Q242 -687 258 -688Q274 -689 292 -681Q309 -671 320 -650Q331 -630 326 -617Q323 -594 316 -574Q308 -554 302 -535Q296 -513 278 -488Q259 -464 242 -444Q243 -440 236 -439Q229 -438 218 -434Z"],"‚":[117,"M45 112Q35 113 20 112Q6 112 3 93Q2 86 5 80Q8 74 13 67Q25 47 40 24Q56 0 61 -15Q61 -19 62 -22Q45 -19 27 -34Q8 -52 16 -82Q25 -112 51 -130Q69 -141 85 -142Q101 -143 119 -135Q136 -125 147 -104Q158 -84 153 -71Q150 -48 142 -28Q135 -8 129 11Q123 33 104 58Q86 82 69 102Q70 106 63 107Q56 108 45 112Z"],"“":[267,"M371 -440Q355 -451 344 -471Q333 -491 337 -504Q340 -527 348 -547Q355 -567 361 -586Q367 -609 386 -634Q404 -658 421 -677Q420 -681 427 -682Q434 -683 445 -687Q456 -688 470 -688Q484 -687 488 -668Q490 -661 486 -656Q483 -650 478 -642Q466 -623 450 -599Q435 -575 430 -560Q430 -556 429 -553Q446 -556 464 -541Q483 -523 474 -493Q465 -463 439 -445Q421 -434 405 -434Q389 -433 371 -440ZM193 -440Q177 -451 166 -471Q155 -491 159 -504Q162 -527 170 -547Q177 -567 183 -586Q189 -609 208 -634Q226 -658 243 -677Q242 -681 249 -682Q256 -683 267 -687Q278 -688 292 -688Q306 -687 309 -668Q311 -661 308 -656Q304 -650 299 -642Q287 -623 272 -599Q256 -575 251 -560Q251 -556 250 -553Q267 -556 285 -541Q304 -523 296 -493Q287 -463 261 -445Q243 -434 227 -434Q211 -433 193 -440Z"],"”":[267,"M205 -424Q195 -423 180 -424Q166 -424 162 -443Q161 -450 164 -456Q167 -462 172 -469Q184 -489 200 -512Q215 -536 220 -551Q220 -555 221 -558Q204 -555 186 -570Q167 -588 176 -618Q185 -648 211 -666Q229 -677 245 -678Q261 -679 279 -671Q296 -661 307 -640Q318 -620 313 -607Q310 -584 302 -564Q295 -544 289 -525Q283 -503 264 -478Q246 -454 229 -434Q230 -430 223 -429Q216 -428 205 -424ZM383 -424Q373 -423 358 -424Q344 -424 341 -443Q340 -450 343 -456Q346 -462 351 -469Q363 -489 378 -512Q394 -536 399 -551Q399 -555 400 -558Q383 -555 365 -570Q346 -588 354 -618Q363 -648 389 -666Q407 -677 423 -678Q439 -679 457 -671Q474 -661 485 -640Q496 -620 491 -607Q488 -584 480 -564Q473 -544 467 -525Q461 -503 442 -478Q424 -454 407 -434Q408 -430 401 -429Q394 -428 383 -424Z"],"„":[267,"M48 112Q38 113 24 112Q9 112 5 93Q4 86 7 80Q10 74 15 67Q27 47 42 24Q58 0 63 -15Q63 -19 64 -22Q47 -19 29 -34Q10 -52 19 -82Q28 -112 54 -130Q72 -141 88 -142Q104 -143 122 -135Q139 -125 150 -104Q161 -84 156 -71Q153 -48 146 -28Q138 -8 132 11Q126 33 108 58Q89 82 72 102Q73 106 66 107Q59 108 48 112ZM226 112Q216 113 202 112Q187 112 184 93Q183 86 186 80Q189 74 194 67Q206 47 222 24Q237 0 242 -15Q242 -19 243 -22Q226 -19 208 -34Q189 -52 198 -82Q206 -112 232 -130Q250 -141 266 -142Q282 -143 300 -135Q317 -125 328 -104Q339 -84 334 -71Q331 -48 324 -28Q316 -8 310 11Q304 33 286 58Q267 82 250 102Q251 106 244 107Q237 108 226 112Z"],"•":[187,"M143 -220Q137 -226 135 -240Q133 -255 134 -270Q134 -284 135 -288Q142 -309 158 -336Q173 -363 192 -376Q209 -384 236 -378Q264 -371 276 -354Q284 -320 277 -290Q270 -261 239 -227Q224 -208 199 -206Q174 -204 143 -220Z"],"…":[594,"M153 -52Q134 -45 122 -46Q109 -46 94 -57Q75 -75 82 -94Q88 -112 114 -130Q132 -141 140 -142Q149 -143 167 -135Q197 -116 194 -93Q190 -70 153 -52ZM351 -52Q332 -45 320 -46Q307 -46 292 -57Q273 -75 280 -94Q286 -112 312 -130Q330 -141 338 -142Q347 -143 365 -135Q395 -116 392 -93Q388 -70 351 -52ZM549 -52Q530 -45 518 -46Q505 -46 490 -57Q471 -75 478 -94Q484 -112 510 -130Q528 -141 536 -142Q545 -143 563 -135Q593 -116 590 -93Q586 -70 549 -52Z"],"′":[117,"M148 -480Q160 -500 176 -526Q191 -552 196 -567Q205 -595 208 -606Q211 -617 218 -636Q220 -645 224 -652Q228 -659 232 -663Q245 -675 269 -666Q277 -663 292 -655Q306 -647 303 -630Q302 -614 297 -604Q292 -593 282 -578Q273 -562 257 -530Q244 -508 232 -484Q219 -461 202 -441Q195 -437 192 -436Q189 -435 178 -431Q162 -428 152 -430Q143 -433 136 -439Q133 -450 138 -462Q143 -473 148 -480Z"],"″":[267,"M148 -480Q160 -500 176 -526Q191 -552 196 -567Q205 -595 208 -606Q211 -617 218 -636Q220 -645 224 -652Q228 -659 232 -663Q245 -675 269 -666Q277 -663 292 -655Q306 -647 303 -630Q302 -614 297 -604Q292 -593 282 -578Q273 -562 257 -530Q244 -508 232 -484Q219 -461 202 -441Q195 -437 192 -436Q189 -435 178 -431Q162 -428 152 -430Q143 -433 136 -439Q133 -450 138 -462Q143 -473 148 -480ZM298 -480Q310 -500 326 -526Q341 -552 346 -567Q355 -595 358 -606Q361 -617 368 -636Q370 -645 374 -652Q378 -659 382 -663Q395 -675 419 -666Q427 -663 442 -655Q456 -647 453 -630Q452 -614 447 -604Q442 -593 432 -578Q423 -562 407 -530Q394 -508 382 -484Q369 -461 352 -441Q345 -437 342 -436Q339 -435 328 -431Q312 -428 302 -430Q293 -433 286 -439Q283 -450 288 -462Q293 -473 298 -480Z"],"‹":[446,"M406 6Q398 7 379 6Q360 6 328 -8Q292 -27 274 -36Q257 -46 242 -64Q208 -84 190 -106Q171 -127 154 -157L122 -199L115 -236Q123 -239 130 -252Q138 -266 139 -267Q148 -278 162 -290Q176 -302 198 -320Q221 -339 256 -369Q293 -396 306 -410Q320 -424 330 -434Q336 -441 344 -448Q352 -456 356 -456Q362 -458 370 -454Q378 -451 382 -448Q393 -441 403 -438Q413 -435 414 -427Q414 -427 412 -412Q409 -396 402 -390Q389 -379 374 -368Q359 -356 336 -338Q314 -319 275 -284Q251 -263 240 -250Q228 -237 225 -228Q222 -218 224 -205Q230 -192 242 -175Q255 -158 281 -138Q307 -117 353 -91Q378 -79 396 -58Q413 -36 418 -17Q422 2 406 6Z"],"›":[446,"M243 15Q237 17 226 9Q216 1 211 -2Q201 -10 190 -10Q180 -11 178 -19Q178 -19 180 -27Q183 -35 190 -41Q204 -53 216 -64Q229 -75 250 -94Q272 -114 310 -148Q345 -180 366 -202Q386 -223 383 -242Q374 -262 346 -293Q317 -324 247 -363Q223 -375 203 -394Q183 -413 177 -430Q171 -446 186 -450Q194 -451 222 -452Q250 -452 281 -438Q317 -419 334 -410Q352 -400 367 -382Q401 -363 420 -341Q439 -319 455 -289L479 -247L486 -217Q481 -216 476 -208Q471 -199 468 -190Q464 -182 463 -181Q454 -170 440 -156Q425 -142 402 -122Q378 -102 343 -72Q306 -45 292 -31Q279 -17 269 -7Q263 0 256 8Q248 15 243 15Z"],"⁄":[193,"M-31 85Q-51 83 -62 68Q-74 53 -70 24Q-67 -5 -42 -47Q-34 -58 -28 -68Q-21 -77 -19 -84Q-15 -91 2 -114Q18 -138 40 -168Q62 -199 84 -229Q106 -259 122 -280Q137 -301 140 -304Q144 -303 149 -308Q154 -314 156 -321Q159 -329 165 -338Q171 -346 176 -347Q178 -352 182 -358Q187 -363 188 -367Q189 -371 192 -374Q196 -377 197 -381Q206 -390 228 -416Q249 -442 278 -478Q306 -514 336 -553Q366 -592 392 -627Q419 -662 436 -685Q453 -708 454 -712Q458 -727 475 -722Q482 -726 491 -722Q491 -722 500 -710Q508 -699 514 -688Q520 -678 519 -670Q518 -661 513 -650Q509 -637 503 -628Q497 -619 482 -604Q468 -589 438 -557Q432 -550 419 -534Q405 -517 389 -497Q372 -477 357 -458Q342 -439 332 -426Q322 -413 322 -411Q320 -407 314 -400Q308 -394 301 -383Q295 -377 283 -364Q271 -351 259 -337Q247 -323 238 -312Q229 -302 229 -300Q227 -297 226 -293Q224 -289 218 -287Q215 -288 212 -283Q210 -278 210 -278Q210 -274 202 -262Q193 -249 179 -232Q166 -213 146 -184Q126 -155 103 -122Q80 -89 60 -58Q39 -26 24 -2Q10 22 6 32Q-1 54 -12 68Q-23 83 -31 85Z"],"€":[450,"M267 35Q247 40 220 34Q193 28 166 15Q140 2 120 -13Q116 -19 109 -33Q102 -47 94 -63Q87 -79 83 -91Q79 -104 80 -106Q84 -111 84 -118Q85 -124 84 -127Q79 -141 88 -178Q98 -214 120 -266Q141 -319 171 -379Q189 -417 220 -458Q251 -500 286 -538Q320 -575 352 -602Q385 -629 406 -638Q423 -644 441 -648Q459 -652 474 -650Q502 -646 526 -632Q549 -617 564 -598Q573 -582 580 -554Q587 -525 589 -496Q591 -468 584 -452Q577 -436 574 -432Q571 -427 557 -425Q553 -424 536 -430Q520 -436 509 -443Q505 -448 499 -452Q493 -455 493 -455Q493 -455 494 -465Q495 -475 499 -486Q513 -522 510 -546Q508 -570 485 -576Q463 -577 432 -562Q400 -547 365 -506Q321 -456 284 -404Q248 -351 224 -295Q201 -236 188 -188Q176 -139 173 -114Q175 -102 176 -94Q176 -86 172 -86Q174 -76 178 -64Q183 -52 193 -43Q202 -34 223 -37Q235 -36 258 -40Q280 -43 301 -49Q322 -55 328 -59Q328 -59 338 -62Q348 -65 357 -65Q366 -70 382 -77Q399 -84 411 -92Q438 -103 462 -108Q485 -114 492 -112Q492 -112 497 -110Q502 -107 503 -98Q504 -89 490 -70Q485 -64 470 -52Q454 -40 440 -30Q426 -21 423 -21Q418 -20 406 -16Q395 -11 383 -3Q355 13 324 24Q293 34 267 35ZM270 -178Q264 -178 242 -178Q221 -177 193 -177Q165 -177 139 -178Q113 -178 99 -179Q93 -179 84 -180Q75 -181 64 -185Q49 -185 40 -192Q31 -198 28 -205Q22 -213 22 -219Q23 -225 30 -229Q37 -233 50 -236Q62 -239 80 -240Q97 -243 128 -244Q160 -246 197 -246Q234 -246 268 -246Q301 -245 321 -245Q347 -244 367 -238Q387 -233 398 -222Q405 -214 406 -206Q408 -197 404 -190Q400 -183 392 -180Q384 -176 373 -178Q368 -178 348 -178Q327 -178 304 -178Q282 -179 270 -178ZM343 -320Q337 -320 312 -320Q287 -320 254 -321Q221 -321 191 -322Q161 -323 147 -323Q141 -323 132 -324Q123 -325 112 -329Q97 -330 88 -336Q79 -343 76 -350Q65 -365 78 -374Q91 -382 128 -384Q145 -387 176 -388Q208 -390 245 -390Q282 -390 316 -389Q349 -389 369 -389Q395 -388 415 -382Q435 -377 446 -366Q460 -351 452 -334Q444 -318 421 -322Q416 -322 402 -322Q388 -321 372 -321Q355 -321 343 -320Z"],"™":[660,"M399 -259Q388 -259 370 -272Q352 -284 346 -291Q343 -298 345 -305Q347 -312 357 -336Q362 -348 370 -361Q378 -374 385 -380Q386 -383 387 -388Q388 -393 389 -398Q394 -400 400 -412Q406 -425 413 -439Q421 -450 432 -471Q442 -492 452 -511Q485 -573 500 -597Q516 -621 526 -631Q528 -633 530 -638Q532 -642 532 -647Q532 -656 539 -666Q546 -677 555 -684Q564 -692 569 -692Q577 -692 584 -690Q591 -689 598 -679Q603 -672 610 -658Q617 -644 615 -627Q614 -607 612 -600Q610 -593 609 -589Q608 -585 608 -574Q600 -550 594 -527Q588 -504 584 -484Q579 -463 577 -446Q575 -429 575 -417Q583 -427 587 -441Q591 -455 600 -465Q603 -470 608 -479Q614 -488 618 -495Q629 -512 636 -524Q644 -537 656 -558Q668 -580 692 -623Q713 -657 724 -672Q736 -686 754 -699Q765 -708 783 -702Q801 -696 816 -681Q831 -666 832 -647Q833 -634 826 -599Q820 -564 809 -529Q805 -513 798 -488Q792 -462 786 -445Q784 -429 780 -409Q776 -389 776 -382Q772 -374 770 -356Q769 -339 769 -319Q768 -290 760 -281Q753 -272 732 -264Q731 -257 714 -259Q696 -261 688 -274Q686 -282 685 -298Q684 -313 685 -324Q685 -326 685 -328Q685 -329 685 -330Q688 -350 696 -382Q703 -415 712 -452Q721 -489 729 -524Q737 -559 742 -585Q739 -582 730 -562Q720 -542 704 -516Q689 -489 680 -472Q671 -456 661 -436Q657 -429 650 -417Q642 -405 626 -383Q626 -379 614 -360Q601 -342 590 -330Q567 -305 553 -302Q539 -298 522 -315Q505 -333 505 -363Q505 -373 506 -385Q507 -397 509 -413Q512 -426 514 -438Q516 -451 518 -463Q518 -465 519 -471Q520 -477 523 -504Q514 -482 508 -470Q501 -458 490 -435Q479 -410 468 -385Q456 -360 445 -335Q437 -320 432 -310Q428 -301 425 -295Q421 -286 413 -276Q405 -265 399 -259ZM223 -262Q216 -264 204 -274Q191 -284 192 -291Q192 -301 196 -322Q201 -343 207 -364Q213 -386 217 -396Q221 -412 222 -416Q224 -421 224 -422Q226 -426 230 -436Q235 -445 236 -454Q237 -460 242 -478Q248 -497 255 -520Q262 -542 268 -560Q274 -578 275 -582Q280 -590 282 -596Q284 -603 285 -606Q289 -608 290 -612Q290 -615 290 -618Q290 -618 296 -627Q302 -636 303 -652L380 -647Q379 -640 376 -628Q373 -615 366 -600Q364 -590 360 -579Q356 -568 353 -564Q355 -561 350 -546Q344 -531 338 -513Q336 -506 333 -498Q330 -490 328 -484Q326 -476 322 -466Q318 -457 309 -431Q305 -420 301 -409Q297 -398 294 -387Q289 -377 280 -346Q271 -316 262 -281Q257 -266 244 -264Q231 -261 223 -262ZM218 -613Q199 -612 190 -621Q181 -630 182 -640Q184 -648 190 -660Q197 -672 210 -673Q221 -675 238 -678Q255 -680 295 -684Q306 -686 319 -688Q332 -689 349 -690Q366 -691 377 -692Q388 -692 388 -692Q390 -692 402 -691Q413 -690 426 -688Q438 -687 444 -684Q481 -675 486 -653Q487 -648 484 -634Q482 -621 477 -618Q460 -613 446 -613Q433 -613 422 -617Q418 -621 410 -624Q403 -626 382 -628Q373 -627 362 -626Q350 -626 350 -624Q316 -622 302 -622Q287 -623 284 -622Q282 -622 283 -618Q283 -617 268 -616Q254 -616 238 -616Q223 -615 218 -613Z"],"−":[446,"M170 -172Q164 -172 155 -172Q146 -173 135 -177Q120 -177 112 -184Q103 -190 99 -197Q88 -212 100 -220Q113 -229 150 -233Q167 -237 200 -240Q234 -242 273 -244Q312 -245 347 -246Q382 -247 402 -247Q428 -247 448 -242Q469 -237 480 -226Q495 -211 487 -194Q479 -178 456 -182Q451 -182 437 -181Q423 -180 407 -179Q390 -178 378 -177Q372 -177 345 -176Q318 -175 282 -174Q247 -173 216 -172Q184 -172 170 -172Z"],"∕":[193,"M-31 85Q-51 83 -62 68Q-74 53 -70 24Q-67 -5 -42 -47Q-34 -58 -28 -68Q-21 -77 -19 -84Q-15 -91 2 -114Q18 -138 40 -168Q62 -199 84 -229Q106 -259 122 -280Q137 -301 140 -304Q144 -303 149 -308Q154 -314 156 -321Q159 -329 165 -338Q171 -346 176 -347Q178 -352 182 -358Q187 -363 188 -367Q189 -371 192 -374Q196 -377 197 -381Q206 -390 228 -416Q249 -442 278 -478Q306 -514 336 -553Q366 -592 392 -627Q419 -662 436 -685Q453 -708 454 -712Q458 -727 475 -722Q482 -726 491 -722Q491 -722 500 -710Q508 -699 514 -688Q520 -678 519 -670Q518 -661 513 -650Q509 -637 503 -628Q497 -619 482 -604Q468 -589 438 -557Q432 -550 419 -534Q405 -517 389 -497Q372 -477 357 -458Q342 -439 332 -426Q322 -413 322 -411Q320 -407 314 -400Q308 -394 301 -383Q295 -377 283 -364Q271 -351 259 -337Q247 -323 238 -312Q229 -302 229 -300Q227 -297 226 -293Q224 -289 218 -287Q215 -288 212 -283Q210 -278 210 -278Q210 -274 202 -262Q193 -249 179 -232Q166 -213 146 -184Q126 -155 103 -122Q80 -89 60 -58Q39 -26 24 -2Q10 22 6 32Q-1 54 -12 68Q-23 83 -31 85Z"],"Ō":[496,"M183 35Q146 8 124 -16Q103 -39 101 -61Q99 -79 102 -110Q104 -141 108 -171Q112 -201 115 -216Q120 -221 120 -230Q119 -238 119 -238Q118 -243 126 -264Q134 -286 141 -320Q161 -380 180 -420Q198 -461 216 -490Q234 -519 252 -543Q293 -585 330 -610Q366 -635 397 -649Q417 -661 434 -668Q451 -675 462 -670Q518 -658 557 -621Q596 -584 609 -514Q616 -470 618 -434Q619 -399 612 -364Q605 -330 586 -289Q568 -248 535 -193Q494 -112 446 -58Q397 -3 348 25Q300 53 256 56Q213 58 183 35ZM263 -31Q286 -34 300 -40Q315 -46 331 -63Q347 -80 376 -113Q402 -143 420 -164Q437 -185 450 -207Q462 -229 474 -260Q485 -290 499 -338Q507 -368 510 -382Q514 -397 515 -407Q516 -417 516 -434Q515 -452 515 -488Q514 -505 508 -526Q502 -548 494 -557Q484 -568 464 -576Q444 -584 422 -574Q410 -569 392 -554Q374 -538 355 -517Q336 -496 319 -475Q302 -454 292 -437Q282 -420 282 -413Q282 -413 282 -408Q281 -403 277 -398Q264 -384 250 -352Q236 -320 224 -279Q212 -238 204 -197Q196 -156 194 -123Q194 -107 194 -96Q194 -85 196 -76Q199 -68 205 -58Q211 -48 230 -38Q248 -28 263 -31ZM466 -760Q456 -759 446 -760Q435 -762 425 -765Q410 -767 403 -771Q396 -775 389 -786Q380 -801 394 -808Q407 -816 440 -820Q471 -826 498 -830Q524 -834 555 -834Q586 -834 604 -830Q622 -825 634 -813Q647 -802 643 -786Q639 -771 621 -769Q614 -769 599 -768Q584 -767 568 -766Q552 -766 540 -765Q532 -764 522 -763Q511 -762 498 -761Q484 -760 466 -760Z"],"ō":[353,"M164 -7Q151 -7 144 -12Q136 -17 125 -26Q106 -46 94 -69Q83 -92 86 -109Q89 -117 88 -124Q88 -132 88 -132Q83 -137 85 -138Q87 -140 89 -144Q95 -144 93 -155Q91 -163 100 -190Q108 -216 123 -240Q129 -250 141 -266Q153 -283 168 -300Q182 -316 194 -326Q219 -347 240 -360Q262 -373 284 -378Q306 -383 330 -383Q353 -383 368 -367Q391 -357 400 -340Q410 -323 413 -296Q416 -266 407 -222Q398 -179 358 -122Q333 -86 309 -66Q285 -46 256 -29Q235 -15 211 -12Q187 -9 164 -7ZM266 -129Q288 -148 298 -171Q307 -194 318 -225Q322 -231 324 -245Q325 -259 324 -272Q323 -286 317 -288Q308 -295 299 -292Q290 -288 276 -278Q246 -253 220 -220Q195 -188 185 -141Q182 -116 190 -104Q199 -91 218 -96Q238 -102 266 -129ZM299 -453Q293 -453 284 -454Q275 -454 264 -458Q249 -458 240 -464Q232 -470 228 -477Q218 -492 230 -500Q242 -509 279 -513Q313 -521 338 -524Q363 -527 403 -527Q428 -527 444 -522Q461 -517 472 -507Q487 -492 480 -476Q472 -459 449 -462Q442 -461 420 -460Q397 -459 379 -458Q369 -457 348 -455Q327 -453 299 -453Z"],"Ū":[482,"M229 60Q177 46 150 7Q122 -32 120 -102Q117 -171 138 -275Q145 -310 158 -355Q171 -400 188 -448Q206 -495 226 -540Q245 -584 264 -618Q287 -659 304 -673Q321 -687 337 -685Q361 -681 374 -666Q386 -650 386 -632Q385 -615 368 -604Q357 -591 340 -556Q322 -522 304 -490Q284 -432 269 -388Q254 -343 244 -304Q234 -265 226 -222Q217 -180 212 -158Q207 -135 206 -124Q204 -112 204 -104Q203 -95 203 -81Q211 -68 216 -58Q221 -48 229 -46Q246 -38 264 -38Q281 -38 302 -50Q307 -60 315 -64Q323 -68 323 -68Q325 -63 328 -66Q330 -68 331 -72Q330 -76 333 -80Q336 -83 340 -87Q348 -90 360 -104Q373 -118 385 -136Q397 -153 406 -168Q414 -183 414 -187Q414 -192 418 -196Q422 -200 427 -206Q432 -211 448 -238Q463 -266 482 -303Q500 -340 515 -371Q518 -382 526 -406Q534 -431 544 -463Q553 -495 562 -528Q571 -560 578 -586Q586 -611 588 -623Q590 -636 594 -644Q598 -653 599 -657Q610 -666 624 -662Q638 -658 650 -650Q663 -643 669 -640Q675 -632 674 -620Q673 -608 668 -584Q662 -559 652 -513Q631 -431 602 -362Q572 -293 538 -216Q538 -216 538 -216Q538 -215 538 -210Q526 -203 519 -189Q514 -180 510 -174Q507 -167 502 -164Q499 -155 496 -148Q493 -141 493 -141Q492 -136 486 -132Q480 -128 474 -124Q469 -122 468 -116Q467 -110 464 -106Q442 -73 410 -40Q378 -6 344 19Q311 44 284 54Q266 61 254 62Q243 63 229 60ZM451 -760Q441 -759 430 -760Q420 -762 410 -765Q395 -767 388 -771Q381 -775 374 -786Q365 -801 378 -808Q392 -816 425 -820Q456 -826 482 -830Q509 -834 540 -834Q571 -834 589 -830Q607 -825 619 -813Q632 -802 628 -786Q624 -771 606 -769Q599 -769 584 -768Q569 -767 553 -766Q537 -766 525 -765Q517 -764 506 -763Q496 -762 482 -761Q469 -760 451 -760Z"],"ū":[370,"M336 -2Q326 -12 320 -30Q314 -47 308 -70Q306 -78 306 -88Q307 -98 306 -104Q303 -97 296 -86Q290 -75 284 -70Q280 -66 266 -54Q252 -43 238 -36Q205 -15 180 -16Q154 -18 135 -42Q119 -55 109 -75Q99 -95 105 -123Q107 -158 115 -192Q123 -225 148 -281Q169 -322 180 -345Q191 -368 194 -372Q209 -377 231 -372Q253 -366 255 -352Q261 -342 255 -314Q249 -287 231 -252Q217 -218 204 -186Q192 -154 190 -132Q187 -110 201 -105Q210 -100 228 -106Q245 -112 269 -142Q293 -172 320 -237Q328 -257 332 -272Q336 -288 337 -307Q335 -319 344 -332Q352 -345 364 -352Q368 -357 375 -362Q382 -366 384 -361L400 -362Q404 -363 409 -354Q414 -345 419 -341Q430 -332 429 -302Q428 -272 405 -218Q386 -177 380 -156Q373 -135 372 -115Q372 -97 375 -84Q378 -72 393 -59Q404 -52 406 -36Q407 -19 406 -7Q404 2 390 6Q377 9 362 7Q346 5 336 -2ZM309 -453Q303 -453 294 -454Q285 -454 274 -458Q259 -458 250 -464Q242 -470 238 -477Q228 -492 240 -500Q252 -509 289 -513Q323 -521 348 -524Q373 -527 413 -527Q438 -527 454 -522Q471 -517 482 -507Q497 -492 490 -476Q482 -459 459 -462Q452 -461 430 -460Q407 -459 389 -458Q379 -457 358 -455Q337 -453 309 -453Z"]}};
if (typeof module !== 'undefined' && module.exports) module.exports = PAWPRINT_FONT;

  return PAWPRINT_FONT; })(undefined);
  var names = (function (module, self) {
/* Doodle Doggo merch: the dog's name on a print. No dependencies, no DOM, no storage: the same file runs in the browser (<script> -> self.PawNames),
   in Node (require) and in a Worker (bundled or imported). tools/merch_build.js also puts it inside PawPrint (PawPrint.nameOk / nameClean).
     nameClean(s) -> the name as it will print, or null when it cannot print (the save reader and the link checker use this; a long name is cut at 20)
     nameOk(s)    -> { ok: true, name } or { ok: false, why: 'empty' | 'long' | 'letters' | 'word', name, say: "Let's try another name" }. Never throws.
                     (PawPrint.nameOk(s, { product }) also says 'long' when the name cannot be printed big enough on that product: PART1.md.)
   The rules: at most 20 characters, only the letters the print font draws (Latin with accents, digits, space and ' - . & !), trimmed, one line. */
(function (root) {
  'use strict';
  var MAX = 20;
  // the Latin letters Caveat Bold (merch/pawprint_font.js) has outlines for, in both cases where the font has both (test_pawprint.js checks each
  // one is in the font, and that a letter's other case is allowed too: so no capital A-breve (the font has no small one) and no y-diaeresis (no capital one). Dotless i pairs with I, sharp s with SS)
  var LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    + '\u00C0\u00C1\u00C2\u00C3\u00C4\u00C5\u00C6\u00C7\u00C8\u00C9\u00CA\u00CB\u00CC\u00CD\u00CE\u00CF\u00D0\u00D1\u00D2\u00D3\u00D4\u00D5\u00D6\u00D8\u00D9\u00DA\u00DB\u00DC\u00DD\u00DE\u00DF'
    + '\u00E0\u00E1\u00E2\u00E3\u00E4\u00E5\u00E6\u00E7\u00E8\u00E9\u00EA\u00EB\u00EC\u00ED\u00EE\u00EF\u00F0\u00F1\u00F2\u00F3\u00F4\u00F5\u00F6\u00F8\u00F9\u00FA\u00FB\u00FC\u00FD\u00FE'
    + '\u0131\u0152\u0153\u014C\u014D\u016A\u016B';
  var CHARS = LETTERS + '0123456789' + " !&'-.";
  var OK = {}; for (var i = 0; i < CHARS.length; i++) OK[CHARS[i]] = 1;
  // look-alikes typed on phones, turned into the plain mark the font draws
  var SWAP = { '\u2019': "'", '\u2018': "'", '\u02BC': "'", '\u00B4': "'", '`': "'", '\u2010': '-', '\u2011': '-', '\u2012': '-', '\u2013': '-', '\u2014': '-', '\u2212': '-' };
  var SAY = "Let's try another name";

  /* The kind-word list: short on purpose, kept only here. ROT13, so the file does not read as a list of rude words. English, then a few words from the
     game's other Latin-script languages (es, pt-BR, fr, de, id).
     SUB: refused inside any single word of the name. WORD: refused as a whole word. Words that are also everyday romaji or names (the "shi"+"t" of
     Toshitaka, Yoshito, Ashita; Thai "Porn") are WORDs, not SUBs.
     Matching is on a normalised copy: accents off, lower case, digits and ! read as letters (0 o, 1 i, 3 e, 4 a, 5 s, 7 t, 8 b, 9 g, ! i), marks
     read as spaces. Each word is tried as typed, with runs of 2+ letters squeezed to 1 ("Fuuck", "Sshhiitt"), with runs of 3+ squeezed to 2, and
     said aloud (ph -> f, v -> u: "Phuck", "Fvck"). Names spelt as single letters with spaces or dots ("f u c k", "A.S.S") are joined first.
     ALLOW: ordinary words that hold a SUB ("Scunthorpe"), masked out before the SUB check; ALLOW_NAMES: whole names (spaces out) that are fine. */
  var SUB = 'shpx phag ovgpu juber fyhg gjng obyybpx cravf intvan qvyqb anmv uvgyre encvfg ergneq nffubyr nefrubyr avttre avttn snttbg chffl qhzonff ohyyfuvg qvcfuvg fuvgurnq ubefrfuvg pbpxfhpxre qvpxurnq zbgures cbeauho'
    + ' zvreqn craqrwb znevpba puvatnq uvwhrchg pnenyub ohprgn cvebpn neebzonq chgnva fnybcr pbaaneq pbaanff pbhvyyr raphyr fpurvff sbgmr nefpuybpu jvpufre fpuynzcr fpujhpugry uherafbua svpxra xbagby zrzrx atragbg onatfng wnaphx crcrx onwvatna ybagr';
  var WORD = 'nff nefr qvpx qvpxf pbpx pbpxf gvg gvgf gvggl gvggvrf obbo obbof phz wvmm frk encr cvff snt sntf fcvp puvax xvxr genaal jnax jnaxre kkk fuvg fuvgf fuvgr fuvggl fuvggre cbea cbeab shx spx sphx cuhx cevpx onfgneq'
    + ' chgn chgb pnoeba wbqre iretn phyreb cbeen zreqn sbqn ivnqb zreqr chgr uher nefpu svpx artre gvggra crerx';
  var ALLOW = ['scunthorpe', 'penistone', 'atwater', 'therapist', 'pussycat', 'pussywillow', 'nazira', 'nazir'];
  var ALLOW_NAMES = { mobydick: 1 };
  function rot(s) { return s.replace(/[a-z]/g, function (c) { return String.fromCharCode((c.charCodeAt(0) - 84) % 26 + 97); }); }
  var SUBL = rot(SUB).split(' '), WORDS = {}; rot(WORD).split(' ').forEach(function (w) { WORDS[w] = 1; });
  var LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '9': 'g', '!': 'i' };

  function norm(s) { // -> lower-case letters, everything else a space
    var t = s.normalize('NFD').replace(/[\u0300-\u036F]/g, '').toLowerCase().replace(/\u00DF/g, 'ss').replace(/\u00E6/g, 'ae').replace(/\u0153/g, 'oe').replace(/\u0131/g, 'i').replace(/\u00F8/g, 'o').replace(/[\u00F0\u00FE]/g, 'd');
    var o = ''; for (var k = 0; k < t.length; k++) { var c = LEET[t[k]] || t[k]; o += /[a-z]/.test(c) ? c : ' '; }
    return o;
  }
  var sq1 = function (s) { return s.replace(/([a-z])\1+/g, '$1'); }, sq2 = function (s) { return s.replace(/([a-z])\1{2,}/g, '$1$1'); };
  var phon = function (s) { return s.replace(/ph/g, 'f').replace(/v/g, 'u'); };
  function forms(w) { var f = [w, sq1(w), sq2(w), phon(w), sq1(phon(w))], out = []; for (var k = 0; k < f.length; k++) if (out.indexOf(f[k]) < 0) out.push(f[k]); return out; }
  function rudeWord(w) {
    var f = forms(w);
    for (var a = 0; a < f.length; a++) {
      if (WORDS[f[a]]) return true;
      var m = f[a]; for (var c = 0; c < ALLOW.length; c++) m = m.split(ALLOW[c]).join('_'); // an allowed word is masked out, so "Scunthorpe" passes and "Scunthorpecunt" does not
      for (var b = 0; b < SUBL.length; b++) if (m.indexOf(SUBL[b]) >= 0) return true;
    }
    return false;
  }
  function rude(name) {
    var words = norm(name).split(/\s+/).filter(Boolean);
    if (ALLOW_NAMES[words.join('')]) return false;
    // single letters in a row ("f u c k", "A.S.S") are read as one word, as well as one letter each
    var list = words.slice(), run = '';
    for (var k = 0; k <= words.length; k++) { if (k < words.length && words[k].length === 1) { run += words[k]; continue; } if (run.length > 1) list.push(run); run = ''; }
    for (var w = 0; w < list.length; w++) if (rudeWord(list[w])) return true;
    return false;
  }

  // the tidy form: NFC, look-alikes swapped, invisible and control characters out, spaces collapsed, trimmed
  function tidy(s) {
    if (typeof s !== 'string') return '';
    if (s.length > 400) s = s.slice(0, 400);
    var t = s.normalize('NFC').replace(/[\u0000-\u001F\u007F-\u009F\u00AD\u200B-\u200F\u2028-\u202E\u2060-\u206F\uFEFF]/g, '');
    t = t.replace(/[\u2019\u2018\u02BC\u00B4`\u2010-\u2014\u2212]/g, function (c) { return SWAP[c]; });
    return t.replace(/\s+/g, ' ').trim();
  }
  function nameOk(s, o) {
    try {
      var t = tidy(s), cps = Array.from(t);
      if (!cps.length) return { ok: false, why: 'empty', name: '', say: SAY };
      if (cps.length > MAX) { if (!(o && o.cut)) return { ok: false, why: 'long', name: t, say: SAY }; t = cps.slice(0, MAX).join('').trim(); cps = Array.from(t); }
      for (var k = 0; k < cps.length; k++) if (!OK[cps[k]]) return { ok: false, why: 'letters', name: t, say: SAY };
      if (!/[A-Za-z0-9\u00C0-\u016B]/.test(t)) return { ok: false, why: 'letters', name: t, say: SAY }; // only marks ("...", "!!") is not a name
      if (rude(t)) return { ok: false, why: 'word', name: t, say: SAY };
      return { ok: true, name: t };
    } catch (e) { return { ok: false, why: 'letters', name: '', say: SAY }; }
  }
  function nameClean(s) { var r = nameOk(s, { cut: true }); return r.ok ? r.name : null; }

  var api = { MAX: MAX, CHARS: CHARS, LETTERS: LETTERS, SAY: SAY, nameOk: nameOk, nameClean: nameClean };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else if (root) root.PawNames = api;
})(typeof self !== 'undefined' ? self : typeof globalThis !== 'undefined' ? globalThis : this);

  return self.PawNames; })(undefined, {});
  var make = (function (module) {
/* Doodle Doggo merch spike: PawPrint core (no game state, no storage, no DOM).
   PawPrintMake(PA, PG, FONT) -> the PawPrint API, given the game's own dog art (window.PawArt from dogs/pawart_dogs.js), PawGenes (mods/genes.js)
   and the Caveat Bold outlines (merch/pawprint_font.js). tools/merch_build.js wraps the three and this file into one script, merch/dist/pawprint.js.

   The recipe (merchRecipe): the smallest JSON from which the game redraws a dog exactly (PawArt.dog is a pure function of its options):
     { v: 1, b: PawGenes BREEDS index, g: genes code | null, e: eyes index (EYES), p: art seed (uint32), a: AGES index, s: 'f' | 'm',
       sp: 1 (sparkle, only when set), h: mix head BREEDS index (only for a mix), o: [WEAR indexes] (only what it wears), n: name (optional, <= 20 chars) }
     genes code: one digit per locus B D E S M Bl = how many dominant alleles (0-2), then 'a<0-2>' / 'i<0-2>' only when the dog's genes carry the
     tan-point (A: at) / red-intensity (I) locus (their presence changes the coat, so "absent" is its own state).
   What the Dog Card recipe (40_dogcards.js dcDogOf) lacks and this adds: all six wear slots (a card keeps one outfit), the Crayon Medal charm and the
   wearables a card list never had (WEAR below: DC_OUTFITS first, in their order, then the rest of the art's table; append only), the mix head,
   the newborn stage, the eyes always (a card sends them only when the id roll decides them) and the exact art seed always.
   Left out on purpose: wet fur, the pool's life vest, the nap pyjamas and an expecting belly (moments, not the dog), the pose (a print option),
   the dog's id (the seed and the eyes are what the id decides).

   Wire format (merchEncode / merchDecode, base64url in #p=...): 1 version byte, 1 count byte, per dog: breed, genes (2 bytes), flags
   (eyes 2 bits, age 2, sex 1, sparkle 1, mix 1, name 1), seed (4), [mix head], wear count + indexes, [name: byte length + UTF-8], then a
   2-byte check (FNV-1a of everything before it) so a cut or mistyped link fails instead of drawing the wrong dog. */
function PawPrintMake(PA, PG, FONT, NAMES, BUILD) {
  'use strict';
  const VERSION = 1, MAX_DOGS = 8, NAME_MAX = 20, HASH_MAX = 1024, SAVE_MAX = 8 * 1024 * 1024, SAVE_DOGS = 64;
  const BREEDS = PG.BREEDS.slice();
  const EYES = ['brown', 'amber', 'blue', 'odd']; // = DC_EYES (append only)
  const AGES = ['adult', 'puppy', 'newborn'];
  const LOCI = [['B', 'B', 'b'], ['D', 'D', 'd'], ['E', 'E', 'e'], ['S', 'S', 'sp'], ['M', 'M', 'm'], ['Bl', 'Bl', 'bl']];
  const XLOCI = [['A', 'at', 'a', 'a'], ['I', 'I', 'i', 'i']]; // [locus, dominant, recessive, code letter]
  const SLOTS = { h: 'head', e: 'eyes', n: 'neck', b: 'body', f: 'feet', c: 'charm' };
  // append only. 0-58 = DC_OUTFITS (40_dogcards.js) in its order, so a Dog Card outfit index is a WEAR index; then the art's other wearables (dogs/pawart_dogs.js OUT)
  const WEAR = ['nRed Bandana', 'hParty Hat', 'nBow Tie', 'hFlower Crown', 'eHeart Sunglasses', 'bYellow Raincoat', 'bPolka-dot Raincoat', 'bFrog Raincoat', 'bBubble Raincoat', 'hRain Hat',
    'hPom-pom Beanie', 'bKnit Winter Sweater', 'bSuperhero Cape', 'nSailor Collar', 'hChef Hat', 'bTutu', 'hCowboy Hat', 'bPyjamas', 'bBumblebee Suit', 'hWizard Hat',
    'bHappi Coat', 'bCozy Hoodie', 'nKnit Scarf', 'hLeaf Beret', 'nAutumn Scarf', 'bGhost Sheet', 'bPumpkin Suit', 'nParade Rosette', 'hWitch Hat', 'bVampire Cape',
    'nCandy Corn Bandana', 'bBat Wings', 'bVery Ugly Sweater', 'hReindeer Antlers', 'nSnowflake Snood', 'nUgly Sweater Rosette', 'hYear of the Sheep Hood', 'hAstronaut Helmet',
    'hAcorn Cap', 'eExplorer Goggles', 'nSeashell Necklace', 'bMossy Poncho', 'nClover Collar', 'hSun Hat', 'nShibuya Bandana', 'nAsakusa Bandana', 'nTokyo Tower Bandana',
    'bPumpkin Patch Suit', 'bTrick-or-Treat Ghost', 'bLittle Bat Costume', 'nGolden Name Tag', 'bSukajan Jacket', 'hBucket Hat', 'fLittle Sneakers', 'nPaw Tote', 'eRound Shades',
    'nLucky Cat Charm', 'nFollower Star Bandana', 'nFriendship Bandana',
    'hSailor Cap', 'hCrayon Crown', 'nRainbow Collar', 'nSunflower Collar', 'nGolden Collar', 'nLion Mane', 'nJingle Bell Collar', 'nStar Collar', 'bLittle Witch Hat & Cape',
    'bScarecrow Overalls', 'bMummy Wraps', 'bSkeleton Suit', 'bBlack Cat Ears & Bow', 'bPirate Hat & Sash', 'bDinosaur Hood', 'bLittle Owl Wings', 'bWizard Robe & Star Hat',
    'bFather Christmas Suit', 'bLittle Elf Outfit', 'bGingerbread Pup Suit', 'bSnowman Suit', 'bPolar Bear Hood', 'bPenguin Suit', 'bPuffer Jacket', 'bNutcracker Jacket & Hat',
    'bSnowflake Wings', 'cCrayon Medal'].map((s) => ({ slot: SLOTS[s[0]], n: s.slice(1) }));
  const POSE_FB = { crouch: 'sit', shake: 'happy', cold: 'sad', hot: 'happy', dig: 'eat', squat: 'sit', leglift: 'sit' }; // = 03_yard.js dogArtSafe
  const POSES = { stand: 'idle', idle: 'idle', sit: 'sit', happy: 'happy', walk: 'walk', jump: 'jump', down: 'down', sniff: 'sniff', paw: 'paw', bow: 'bow', beg: 'beg', dance: 'dance' };
  const INK = '#5B3D32', PAPER = '#FFFBF3';

  /* ---------------- small helpers ---------------- */
  const hashId = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }; // = 13_more_dogs.js hashId
  const fnv16 = (u8, n) => { let h = 2166136261; for (let i = 0; i < n; i++) { h ^= u8[i]; h = Math.imul(h, 16777619); } return (h ^ (h >>> 16)) & 0xFFFF; };
  const isInt = (x, lo, hi) => Number.isInteger(x) && x >= lo && x <= hi;
  const f1 = (n) => Math.round(n * 10) / 10;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const artKnows = (() => { const k = new Set((PA.DOGS || []).map((d) => d.key)); return (key) => k.has(key); })();
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------------- names: only what the print font can draw (merch/names.js: the rules and the kind-word list) ---------------- */
  // NFC, no control or format characters, spaces collapsed, cut at NAME_MAX characters, only letters the font draws, no rude word; else null
  function cleanName(s) { const t = NAMES.nameClean(s); return t && Array.from(t).every((c) => FONT.g[c]) ? t : null; }
  // o.product ('tee' | 'mug'): also refuse ('long', with max: how many of its letters fit) a name that cannot print at least NAME_MIN_PX tall there
  function nameOk(s, o) {
    const r = NAMES.nameOk(s, o); if (!r.ok) return r;
    if (!Array.from(r.name).every((c) => FONT.g[c] && FONT.g[c][0] > 0)) return { ok: false, why: 'letters', name: r.name, say: NAMES.SAY };
    if (o && o.product != null) { const P = own(PRODUCTS, o.product); if (!P) throw new Error('product'); const f = nameFit(r.name, P); if (!f.ok) return { ok: false, why: 'long', name: r.name, say: SAY_SHORTER, max: f.max }; }
    return r;
  }
  const nameChars = () => NAMES.CHARS;
  const own = (T, k) => (typeof k === 'string' && Object.prototype.hasOwnProperty.call(T, k) ? T[k] : null);

  /* ---------------- genes ---------------- */
  const cnt = (pair, dom) => (pair[0] === dom ? 1 : 0) + (pair[1] === dom ? 1 : 0);
  const okPair = (p, a, b) => Array.isArray(p) && p.length === 2 && p.every((x) => x === a || x === b);
  function geneCode(g) {
    if (!g || typeof g !== 'object') return null;
    const mutt = PG.STARTER_GENES.mutt; let s = '';
    for (const [k, d, r] of LOCI) s += cnt(okPair(g[k], d, r) ? g[k] : mutt[k], d); // PawGenes normGenes: a missing or odd locus is the mutt's
    for (const [k, d, r, c] of XLOCI) if (okPair(g[k], d, r)) s += c + cnt(g[k], d);
    return s;
  }
  function genesFrom(code) {
    if (code == null) return null;
    const m = /^([0-2]{6})(?:a([0-2]))?(?:i([0-2]))?$/.exec(String(code)); if (!m) return undefined;
    const g = {}, pair = (n, d, r) => (n === 2 ? [d, d] : n === 1 ? [d, r] : [r, r]);
    LOCI.forEach(([k, d, r], i) => { g[k] = pair(+m[1][i], d, r); });
    if (m[2] != null) g.A = pair(+m[2], 'at', 'a'); if (m[3] != null) g.I = pair(+m[3], 'I', 'i');
    return g;
  }

  /* ---------------- the recipe from a dog of the save ---------------- */
  // d: a dog of S.dogs as saved (key, genes, id, artSeed, born, mix, sparkle, outfit, name). o.today: a Date (the age is counted as ageMonths in 10_sex_age_genes.js)
  function ageStage(d, today) {
    if (!d.born) return 0; const t = new Date(today ? today.getTime() : Date.now()); t.setHours(0, 0, 0, 0);
    const b = new Date(d.born + 'T00:00:00'); if (isNaN(b)) return 0;
    const m = Math.max(0, Math.round((t - b) / 864e5)); return m < 1 ? 2 : m < 6 ? 1 : 0;
  }
  function merchRecipe(d, o) {
    o = o || {}; if (!d || typeof d !== 'object' || typeof d.key !== 'string') return null;
    const b = BREEDS.indexOf(d.key); if (b < 0) return null;
    const g = geneCode(d.genes), id = d.id != null ? d.id : '';
    let e = 0; if (g) { try { e = Math.max(0, EYES.indexOf(PG.phenotype(d.genes, d.key, id).eyes)); } catch (x) { e = 0; } }
    const r = { v: VERSION, b, g, e, p: (Number.isInteger(d.artSeed) && d.artSeed >= 0 && d.artSeed <= 0xFFFFFFFF ? d.artSeed : hashId(id)) >>> 0, a: ageStage(d, o.today), s: d.sex === 'female' ? 'f' : 'm' };
    if (d.sparkle) r.sp = 1;
    const mh = d.mix && typeof d.mix.head === 'string' && d.mix.head !== d.key ? BREEDS.indexOf(d.mix.head) : -1; if (mh >= 0) r.h = mh;
    const fit = d.outfit && typeof d.outfit === 'object' ? d.outfit : {}, wear = [];
    for (const slot of ['head', 'eyes', 'neck', 'body', 'feet', 'charm']) { const i = WEAR.findIndex((w) => w.slot === slot && w.n === fit[slot]); if (i >= 0) wear.push(i); }
    if (wear.length) r.o = wear;
    const n = o.name === false ? null : cleanName(o.name != null ? o.name : d.name); if (n) r.n = n;
    return r;
  }

  /* ---------------- checking a recipe (from a link, a cart, a server request) ---------------- */
  function check(r) {
    if (!r || typeof r !== 'object' || Array.isArray(r)) return { ok: false, err: 'not an object' };
    const allowed = new Set(['v', 'b', 'g', 'e', 'p', 'a', 's', 'sp', 'h', 'o', 'n']);
    for (const k of Object.keys(r)) if (!allowed.has(k)) return { ok: false, err: 'unknown field ' + String(k).slice(0, 12) };
    if (r.v !== VERSION) return { ok: false, err: 'version' };
    if (!isInt(r.b, 0, BREEDS.length - 1) || !artKnows(BREEDS[r.b])) return { ok: false, err: 'breed' };
    if (r.g !== null && (typeof r.g !== 'string' || !genesFrom(r.g))) return { ok: false, err: 'genes' };
    if (!isInt(r.e, 0, EYES.length - 1)) return { ok: false, err: 'eyes' };
    if (!isInt(r.p, 0, 0xFFFFFFFF)) return { ok: false, err: 'seed' };
    if (!isInt(r.a, 0, AGES.length - 1)) return { ok: false, err: 'age' };
    if (r.s !== 'f' && r.s !== 'm') return { ok: false, err: 'sex' };
    if (r.sp !== undefined && r.sp !== 1) return { ok: false, err: 'sparkle' };
    if (r.h !== undefined && (!isInt(r.h, 0, BREEDS.length - 1) || r.h === r.b || !artKnows(BREEDS[r.h]))) return { ok: false, err: 'mix' };
    if (r.o !== undefined) {
      if (!Array.isArray(r.o) || !r.o.length || r.o.length > 6) return { ok: false, err: 'wear' };
      const seen = new Set(); for (const i of r.o) { if (!isInt(i, 0, WEAR.length - 1) || seen.has(WEAR[i].slot)) return { ok: false, err: 'wear' }; seen.add(WEAR[i].slot); }
    }
    if (r.n !== undefined && cleanName(r.n) !== r.n) return { ok: false, err: 'name' };
    return { ok: true };
  }

  /* ---------------- the art options: exactly what the game passes PawArt.dog (13_more_dogs.js dogOpts / lookOpts, 58_share.js shSVG) ---------------- */
  function artOpts(r, o) {
    o = o || {}; const key = BREEDS[r.b], genes = genesFrom(r.g);
    const outfit = { head: null, eyes: null, neck: null, body: null, feet: null, charm: null };
    (r.o || []).forEach((i) => { outfit[WEAR[i].slot] = WEAR[i].n; });
    const ex = { pose: o.pose || 'happy', outfit, facing: o.facing === 'left' ? 'left' : 'right', anim: false };
    if (o.expr) ex.expr = o.expr;
    const age = r.a === 2 ? 'newborn' : r.a === 1 ? 'puppy' : null, mixHead = r.h !== undefined ? BREEDS[r.h] : null, sparkle = r.sp === 1;
    const L = age || mixHead || sparkle ? { age, mixHead, sparkle, expecting: false } : null;
    if (genes) {
      const ph = PG.phenotype(genes, key, 'merch'); const coat = Object.assign({}, ph.coat, { eyes: EYES[r.e] }); // the id only decides the eyes: the recipe carries them
      ex.coat = L ? Object.assign({}, coat, { look: L }) : coat; ex.seed = r.p;
    }
    if (L) { if (age) ex.age = age; if (mixHead) ex.mix = { head: mixHead }; if (sparkle) ex.sparkle = true; }
    return { key, ex };
  }
  // the dog's own SVG, byte for byte what the game draws for the same dog, pose and outfit
  function dogSVG(r, o) {
    const c = check(r); if (!c.ok) throw new Error('bad recipe: ' + c.err);
    const pose = POSES[(o && o.pose) || 'happy'] || 'happy', A = artOpts(r, Object.assign({}, o, { pose }));
    let sv = PA.dog(A.key, A.ex);
    if (POSE_FB[pose] && !sv.includes('pa-pose-' + pose)) sv = PA.dog(A.key, Object.assign({}, A.ex, { pose: POSE_FB[pose] }));
    return sv;
  }

  /* ---------------- geometry: the drawn box of a dog SVG (svg, g, path M/L/l/H/V/C/Q/Z, ellipse, circle; translate/scale/matrix) ---------------- */
  const mul = (A, B) => [A[0] * B[0] + A[2] * B[1], A[1] * B[0] + A[3] * B[1], A[0] * B[2] + A[2] * B[3], A[1] * B[2] + A[3] * B[3], A[0] * B[4] + A[2] * B[5] + A[4], A[1] * B[4] + A[3] * B[5] + A[5]];
  function parseTf(s) {
    let M = [1, 0, 0, 1, 0, 0]; if (!s) return M;
    for (const m of s.matchAll(/(translate|scale|matrix|rotate)\(([^)]*)\)/g)) {
      const a = m[2].trim().split(/[\s,]+/).map(Number);
      const T = m[1] === 'translate' ? [1, 0, 0, 1, a[0], a[1] || 0] : m[1] === 'scale' ? [a[0], 0, 0, a.length > 1 ? a[1] : a[0], 0, 0] : m[1] === 'matrix' ? a
        : (() => { const t = a[0] * Math.PI / 180, c = Math.cos(t), s2 = Math.sin(t), R = [c, s2, -s2, c, 0, 0]; return a.length > 2 ? mul(mul([1, 0, 0, 1, a[1], a[2]], R), [1, 0, 0, 1, -a[1], -a[2]]) : R; })();
      M = mul(M, T);
    }
    return M;
  }
  // keep: also return every element's points ({ bb, els: [{ tag, attrs, pts: [[x, y]] }] }), for the sticker bridges
  function bbox(svg, keep) {
    const bb = [1e9, 1e9, -1e9, -1e9], stack = [[1, 0, 0, 1, 0, 0]], els = []; let cur = null;
    const add = (M, x, y, pad) => { const X = M[0] * x + M[2] * y + M[4], Y = M[1] * x + M[3] * y + M[5], p = pad * Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])); bb[0] = Math.min(bb[0], X - p); bb[1] = Math.min(bb[1], Y - p); bb[2] = Math.max(bb[2], X + p); bb[3] = Math.max(bb[3], Y + p); if (cur) cur.pts.push([X, Y]); };
    const at = (s, n) => { const m = new RegExp('\\s' + n + '="([^"]*)"').exec(s); return m ? m[1] : null; };
    let first = true;
    for (const m of svg.matchAll(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g)) {
      const [, close, tag, attrs, self] = m;
      if (close) { if (tag === 'g' || tag === 'svg') stack.pop(); continue; }
      const M = mul(stack[stack.length - 1], parseTf(at(attrs, 'transform')));
      if (keep) { cur = { tag, attrs, pts: [] }; els.push(cur); }
      if (tag === 'svg') { if (!first) { /* nested svg: not in the dog art */ } first = false; if (!self) stack.push(M); continue; }
      if (tag === 'g') { if (!self) stack.push(M); continue; }
      const st = at(attrs, 'stroke'), sw = st && st !== 'none' ? +(at(attrs, 'stroke-width') || 1) / 2 : 0;
      if (tag === 'rect') { const x = +(at(attrs, 'x') || 0), y = +(at(attrs, 'y') || 0), w = +(at(attrs, 'width') || 0), h = +(at(attrs, 'height') || 0); add(M, x, y, sw); add(M, x + w, y + h, sw); add(M, x, y + h, sw); add(M, x + w, y, sw); continue; }
      if (tag === 'ellipse' || tag === 'circle') {
        const cx = +at(attrs, 'cx'), cy = +at(attrs, 'cy'), rx = +(at(attrs, 'rx') || at(attrs, 'r')), ry = +(at(attrs, 'ry') || at(attrs, 'r'));
        add(M, cx - rx, cy - ry, sw); add(M, cx + rx, cy + ry, sw); add(M, cx - rx, cy + ry, sw); add(M, cx + rx, cy - ry, sw);
      } else if (tag === 'path') {
        const d = at(attrs, 'd') || ''; let x = 0, y = 0, sx = 0, sy = 0;
        for (const c of d.matchAll(/([MLHVCSQTZmlhvcsqtz])([^MLHVCSQTZmlhvcsqtz]*)/g)) {
          const k = c[1], n = (c[2].match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number), rel = k === k.toLowerCase(), K = k.toUpperCase();
          if (K === 'Z') { x = sx; y = sy; continue; }
          const step = { M: 2, L: 2, T: 2, H: 1, V: 1, C: 6, S: 4, Q: 4 }[K];
          for (let i = 0; i + step <= n.length; i += step) {
            const q = n.slice(i, i + step), ox = rel ? x : 0, oy = rel ? y : 0;
            if (K === 'H') { x = q[0] + (rel ? x : 0); add(M, x, y, sw); continue; }
            if (K === 'V') { y = q[0] + (rel ? y : 0); add(M, x, y, sw); continue; }
            for (let j = 0; j < step; j += 2) add(M, q[j] + ox, q[j + 1] + oy, sw);
            x = q[step - 2] + ox; y = q[step - 1] + oy;
            if (K === 'M' && i === 0) { sx = x; sy = y; }
          }
        }
      }
    }
    const out = bb[0] < bb[2] ? bb : [0, 0, 240, 200];
    return keep ? { bb: out, els } : out;
  }
  // the inside of a dog SVG (no root tag, no label): what PawPrint places
  const inner = (svg) => svg.replace(/^\s*<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');

  /* ---------------- print weight: no line thinner than minPx in the file ---------------- */
  // k: px per unit at the top of s. Follows transforms and nested <svg viewBox> down the tree, so a puppy's scale(0.7) or a head's own fit is counted
  const svgScale = (attrs) => { const vb = /\sviewBox="([^"]*)"/.exec(attrs), w = /\swidth="([\d.]+)"/.exec(attrs); if (!vb || !w) return 1; const v = vb[1].trim().split(/[\s,]+/).map(Number); return v[2] > 0 ? +w[1] / v[2] : 1; };
  function weight(s, k, minPx) {
    let n = 0; if (!(minPx > 0)) return { s, n };
    const stack = [{ sc: k, sw: 1, st: false }];
    s = s.replace(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g, (m, close, tag, attrs, self) => {
      if (close) { if (tag === 'g' || tag === 'svg' || tag === 'clipPath' || tag === 'defs') stack.pop(); return m; }
      const up = stack[stack.length - 1], tm = /\stransform="([^"]*)"/.exec(attrs), M = tm ? parseTf(tm[1]) : null;
      let sc = up.sc * (M ? Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])) : 1); if (tag === 'svg') sc *= svgScale(attrs);
      const swm = /\sstroke-width="([\d.]+)"/.exec(attrs), stm = /\sstroke="([^"]*)"/.exec(attrs);
      const sw = swm ? +swm[1] : up.sw, st = stm ? stm[1] !== 'none' : up.st;
      let a = attrs;
      if (st && tag !== 'g' && tag !== 'svg' && sw * sc < minPx - 1e-6) { n++; const v = Math.ceil(minPx / sc * 1000) / 1000; a = swm ? a.replace(/\sstroke-width="[\d.]+"/, ` stroke-width="${v}"`) : a + ` stroke-width="${v}"`; }
      if (!self && (tag === 'g' || tag === 'svg' || tag === 'clipPath' || tag === 'defs')) stack.push({ sc, sw, st });
      return '<' + tag + a + self + '>';
    });
    return { s, n };
  }
  // the sticker's kiss-cut margin: the same dog, every part in white with a fat white stroke, drawn under it
  function silhouette(s, b) {
    return '<g fill="#FFFFFF" stroke="#FFFFFF" stroke-linejoin="round" stroke-linecap="round" stroke-width="' + f1(b) + '">'
      + s.replace(/\s(?:fill|stroke|stroke-width|opacity|fill-opacity|stroke-opacity|stroke-linejoin|stroke-linecap|class|style)="[^"]*"/g, '') + '</g>';
  }

  /* ---------------- the name in Caveat Bold, as outlines ---------------- */
  function textW(t, size) { let w = 0; for (const c of Array.from(t)) w += (FONT.g[c] ? FONT.g[c][0] : 300); return w * size / FONT.upm; }
  function nameSVG(t, cx, base, size, col, rot) {
    const k = size / FONT.upm; let x = cx - textW(t, size) / 2, out = '';
    for (const c of Array.from(t)) { const g = FONT.g[c]; if (!g) continue; if (g[1]) out += `<path transform="translate(${f1(x)} ${f1(base)}) scale(${+k.toFixed(5)})" d="${g[1]}"/>`; x += g[0] * k; }
    return `<g class="pp-name" fill="${col || INK}"${rot ? ` transform="rotate(${rot} ${f1(cx)} ${f1(base)})"` : ''}>${out}</g>`;
  }

  /* ---------------- crayon bits for the backdrops (fills inside their outlines: one closed path is the fill and the line) ---------------- */
  function wobRect(x, y, w, h, r, seed, j) {
    const R = rng(seed), J = () => f1((R() - 0.5) * j);
    return `M${f1(x + r)} ${f1(y + J())} L${f1(x + w - r)} ${f1(y + J())} Q${f1(x + w)} ${f1(y)} ${f1(x + w + J())} ${f1(y + r)} L${f1(x + w + J())} ${f1(y + h - r)} Q${f1(x + w)} ${f1(y + h)} ${f1(x + w - r)} ${f1(y + h + J())} L${f1(x + r)} ${f1(y + h + J())} Q${f1(x)} ${f1(y + h)} ${f1(x + J())} ${f1(y + h - r)} L${f1(x + J())} ${f1(y + r)} Q${f1(x)} ${f1(y)} ${f1(x + r)} ${f1(y)} Z`;
  }
  function blob(cx, cy, rx, ry, n, seed, j) { const R = rng(seed); let d = ''; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, k = 1 + (R() - 0.5) * j; d += (i ? 'L' : 'M') + f1(cx + Math.cos(a) * rx * k) + ' ' + f1(cy + Math.sin(a) * ry * k); } return d + 'Z'; }
  const shape = (d, fill, sw, extra) => `<path d="${d}" fill="${fill}"${extra || ''}/><path d="${d}" fill="none" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"/>`;
  // a yard panel in a W x H box (panel units = px of the file): sky, sun, a cloud, a fence, grass with tufts, flowers. u = line unit
  function yardPanel(x, y, w, h, u, seed, o) {
    o = o || {}; const R = rng(seed), gy = y + h * (o.ground || 0.68), out = [];
    // no clipPath (resvg gives a clip a canvas-sized layer: 72 MB of wasm memory at tee size instead of 25 MB): the parts run past the frame and the
    // paper round the frame is painted over them afterwards (an even-odd ring), then the frame line
    const frame = wobRect(x, y, w, h, Math.min(w, h) * 0.05, seed + 1, u * 1.5), pad = Math.max(w, h) * 0.25;
    out.push(`<path d="${frame}" fill="#D3E9F6"/><g>`);
    // sun and a cloud
    const sr = h * 0.09, sx = x + w * 0.84, sy = y + h * 0.2;
    out.push(shape(blob(sx, sy, sr, sr, 18, seed + 2, 0.08), '#FFE27A', u));
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; out.push(`<path d="M${f1(sx + Math.cos(a) * sr * 1.3)} ${f1(sy + Math.sin(a) * sr * 1.3)}L${f1(sx + Math.cos(a) * sr * 1.65)} ${f1(sy + Math.sin(a) * sr * 1.65)}" stroke="#E8B53A" stroke-width="${f1(u * 0.9)}" stroke-linecap="round"/>`); }
    const cx0 = x + w * 0.2, cy0 = y + h * 0.18; let cd = ''; [[0, 0, 1], [0.9, -0.35, 0.8], [1.7, 0.05, 0.75]].forEach(([dx, dy, k], i) => { cd += blob(cx0 + dx * h * 0.07, cy0 + dy * h * 0.07, h * 0.07 * k * 1.25, h * 0.07 * k, 14, seed + 3 + i, 0.1); });
    out.push(`<path d="${cd}" fill="none" stroke="${INK}" stroke-width="${f1(u * 1.6)}" stroke-linejoin="round"/><path d="${cd}" fill="#FFFFFF"/>`); // one outline round the whole cloud
    // the fence
    const fh = h * 0.2, fw = Math.max(h * 0.07, w / 26), ft = gy - fh;
    out.push(shape(wobRect(x - u * 4, ft + fh * 0.3, w + u * 8, fh * 0.14, 2, seed + 5, u), '#F4E3C3', f1(u * 0.9)));
    for (let fx = x + fw * 0.3; fx < x + w; fx += fw * 1.35) { const jx = (R() - 0.5) * u, d = `M${f1(fx + jx)} ${f1(gy)} L${f1(fx + jx)} ${f1(ft + fw * 0.45)} L${f1(fx + fw / 2)} ${f1(ft + (R() - 0.5) * u)} L${f1(fx + fw - jx)} ${f1(ft + fw * 0.45)} L${f1(fx + fw - jx)} ${f1(gy)} Z`; out.push(shape(d, '#FFF4DF', f1(u))); }
    // the grass
    const gd = `M${f1(x - u * 4)} ${f1(gy)} ` + Array.from({ length: 13 }, (_, i) => `L${f1(x + w * i / 12)} ${f1(gy + (R() - 0.5) * u * 2)}`).join(' ') + ` L${f1(x + w + u * 4)} ${f1(y + h + u * 4)} L${f1(x - u * 4)} ${f1(y + h + u * 4)} Z`;
    out.push(shape(gd, '#B8DC94', f1(u)));
    let tufts = ''; for (let i = 0; i < Math.round(w / (h * 0.09)); i++) { const tx = x + R() * w, ty = gy + h * 0.06 + R() * (y + h - gy - h * 0.08); tufts += `M${f1(tx - u * 2)} ${f1(ty)}l${f1(u)} ${f1(-u * 3)}M${f1(tx)} ${f1(ty)}l${f1(u * 0.3)} ${f1(-u * 3.6)}M${f1(tx + u * 2)} ${f1(ty)}l${f1(-u * 0.6)} ${f1(-u * 3)}`; }
    out.push(`<path d="${tufts}" fill="none" stroke="#6FA552" stroke-width="${f1(u * 0.7)}" stroke-linecap="round"/>`);
    // flowers by the fence (never in front of the dog: the dog's box o.keep [x0, x1] stays clear)
    const keep = o.keep || [0, 0];
    for (let i = 0; i < 9; i++) {
      const fx = x + w * (0.04 + R() * 0.92); if (fx > keep[0] && fx < keep[1]) continue; const fy = gy + h * 0.02 + R() * h * 0.05, r0 = h * 0.018, col = ['#F7B2C4', '#FFE27A', '#FFFFFF', '#C9B6F2'][i % 4];
      out.push(`<path d="M${f1(fx)} ${f1(fy)}L${f1(fx)} ${f1(fy + h * 0.06)}" stroke="#6FA552" stroke-width="${f1(u * 0.7)}" stroke-linecap="round"/>`);
      let pd = ''; for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; pd += blob(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0, r0 * 0.75, r0 * 0.75, 8, seed + 40 + i * 5 + p, 0.12); }
      out.push(`<path d="${pd}" fill="${col}" stroke="${INK}" stroke-width="${f1(u * 0.55)}" stroke-linejoin="round"/><circle cx="${f1(fx)}" cy="${f1(fy)}" r="${f1(r0 * 0.5)}" fill="#E8B53A" stroke="${INK}" stroke-width="${f1(u * 0.45)}"/>`);
    }
    out.push('</g>' + `<path d="M${f1(x - pad)} ${f1(y - pad)}H${f1(x + w + pad)}V${f1(y + h + pad)}H${f1(x - pad)}Z${frame}" fill="${o.paper || PAPER}" fill-rule="evenodd"/><path d="${frame}" fill="none" stroke="${INK}" stroke-width="${f1(u * 1.6)}" stroke-linejoin="round"/>`);
    return { svg: out.join(''), ground: gy };
  }
  // a strip of grass, fence and flowers across the bottom of a mug wrap (no frame: it runs round the mug)
  function yardStrip(w, y0, h, u, seed, keep) {
    const R = rng(seed), out = [], fw = h * 0.42, ft = y0 + h * 0.05, gy = y0 + h * 0.62;
    out.push(shape(wobRect(-u * 4, ft + h * 0.16, w + u * 8, h * 0.11, 2, seed + 5, u), '#F4E3C3', f1(u * 0.9)));
    for (let fx = fw * 0.2; fx < w; fx += fw * 1.4) { const jx = (R() - 0.5) * u, d = `M${f1(fx + jx)} ${f1(gy)} L${f1(fx + jx)} ${f1(ft + fw * 0.45)} L${f1(fx + fw / 2)} ${f1(ft + (R() - 0.5) * u)} L${f1(fx + fw - jx)} ${f1(ft + fw * 0.45)} L${f1(fx + fw - jx)} ${f1(gy)} Z`; out.push(shape(d, '#FFF4DF', f1(u))); }
    const gd = `M${f1(-u * 4)} ${f1(gy)} ` + Array.from({ length: 25 }, (_, i) => `L${f1(w * i / 24)} ${f1(gy + (R() - 0.5) * u * 2)}`).join(' ') + ` L${f1(w + u * 4)} ${f1(y0 + h + u * 4)} L${f1(-u * 4)} ${f1(y0 + h + u * 4)} Z`;
    out.push(shape(gd, '#B8DC94', f1(u)));
    for (let i = 0; i < 16; i++) {
      const fx = w * (0.02 + R() * 0.96); if ((keep || []).some((k) => fx > k[0] && fx < k[1])) continue; const fy = gy + h * 0.1 + R() * h * 0.14, r0 = h * 0.05, col = ['#F7B2C4', '#FFE27A', '#FFFFFF', '#C9B6F2'][i % 4];
      let pd = ''; for (let p = 0; p < 5; p++) { const a = p / 5 * Math.PI * 2; pd += blob(fx + Math.cos(a) * r0, fy + Math.sin(a) * r0, r0 * 0.75, r0 * 0.75, 8, seed + 60 + i * 5 + p, 0.12); }
      out.push(`<path d="${pd}" fill="${col}" stroke="${INK}" stroke-width="${f1(u * 0.55)}" stroke-linejoin="round"/><circle cx="${f1(fx)}" cy="${f1(fy)}" r="${f1(r0 * 0.5)}" fill="#E8B53A" stroke="${INK}" stroke-width="${f1(u * 0.45)}"/>`);
    }
    return out.join('');
  }

  /* ---------------- PawPrint.svg: a complete print SVG ---------------- */
  // o: { pose, facing, expr, bg: 'none' | 'yard' | 'tile' | 'strip' (mug wrap), name: true | string, w, h, bleed (px of plain background past the trim,
  //      kept clear of the dog), border (px, the sticker's white kiss-cut margin; bg 'none' only), dpi (300), minLine (mm, 0.5) }
  function svg(r, o) {
    o = Object.assign({ pose: 'happy', bg: 'none', w: 1500, h: 1500, bleed: 0, dpi: 300, minLine: 0.5 }, o || {});
    const c = check(r); if (!c.ok) throw new Error('bad recipe: ' + c.err);
    const W = Math.round(o.w), H = Math.round(o.h), B = Math.max(0, o.bleed || 0); if (!(W > 0 && H > 0 && W <= 20000 && H <= 20000)) throw new Error('size');
    const name = o.name === true ? r.n || '' : typeof o.name === 'string' ? cleanName(o.name) || '' : '';
    const shadow = o.shadow != null ? !!o.shadow : o.bg !== 'none'; // a bare print (tee, sticker) drops the faint ground shadow: on fabric it reads as a stain
    let dog = dogSVG(r, o); if (!shadow) dog = dog.replace(/<ellipse cx="[\d.]+" cy="187.5" rx="[\d.]+" ry="[\d.]+" fill="#5B3D32" opacity="0?\.\d+"\/><path d="[^"]*" stroke="#5B3D32" stroke-width="1.3"[^>]*\/>/, '');
    const bb = bbox(dog), dw = bb[2] - bb[0], dh = bb[3] - bb[1];
    const minPx = (o.minLine || 0) / 25.4 * (o.dpi || 300), u = Math.max(minPx, Math.min(W, H) / 300); // backdrop line unit
    const out = []; let box, keep = null, stats = {};
    const S = Math.min(W, H);
    if (o.bg === 'strip') { // the mug wrap: a yard strip along the bottom, the dog on the left of the print side, its name beside it
      const sh = H * 0.2, side = [W * 0.04 + B, W * 0.5]; box = [side[0], B + H * 0.05, (side[1] - side[0]) * (name ? 0.62 : 1), H - sh * 0.22 - B - H * 0.05]; // feet on the grass line of the strip
      keep = [box[0], box[0] + box[2]];
      out.push(`<rect width="${W}" height="${H}" fill="${PAPER}"/>`, yardStrip(W, H - sh - B * 0, sh + B, u, (r.p ^ 0x5A5A) >>> 0, null));
    } else if (o.bg === 'yard') {
      const m = B + S * 0.03, P = yardPanel(m, m, W - 2 * m, H - 2 * m - (name ? H * 0.12 : 0), u, (r.p ^ 0x1234) >>> 0, {});
      const ph = H - 2 * m - (name ? H * 0.12 : 0); box = [m + (W - 2 * m) * 0.14, m + ph * 0.1, (W - 2 * m) * 0.72, ph * 0.86];
      out.push(`<rect width="${W}" height="${H}" fill="${PAPER}"/>`, P.svg);
    } else if (o.bg === 'tile') {
      const m = B + S * 0.03, frame = wobRect(m, m, W - 2 * m, H - 2 * m, S * 0.06, (r.p ^ 0x77) >>> 0, u * 1.5);
      out.push(`<rect width="${W}" height="${H}" fill="${PAPER}"/><defs><pattern id="pp-dots" width="${f1(S / 30)}" height="${f1(S / 30)}" patternUnits="userSpaceOnUse"><circle cx="${f1(S / 270)}" cy="${f1(S / 270)}" r="${f1(S / 600)}" fill="#E3D6C6"/></pattern></defs>`,
        `<path d="${frame}" fill="#FFF3B8"/><path d="${frame}" fill="url(#pp-dots)"/><path d="${frame}" fill="none" stroke="${INK}" stroke-width="${f1(u * 1.6)}" stroke-linejoin="round"/>`);
      box = [m + S * 0.08, m + S * 0.06, W - 2 * m - S * 0.16, H - 2 * m - S * 0.1 - (name ? H * 0.14 : 0)];
    } else { // dog only, transparent
      const m = B + S * 0.02 + (o.border || 0); box = [m, m, W - 2 * m, H - 2 * m - (name ? H * 0.14 : 0)];
    }
    const k = Math.min(box[2] / dw, box[3] / dh), ox = box[0] + (box[2] - dw * k) / 2 - bb[0] * k, oy = (o.bg === 'none' || o.bg === 'tile' ? box[1] + (box[3] - dh * k) / 2 : box[1] + box[3] - dh * k) - bb[1] * k;
    const wt = weight(inner(dog).replace(/\s(?:role|aria-label)="[^"]*"/g, ''), k, minPx); stats = { scale: +k.toFixed(3), thin: wt.n, line: +(3.7 * k / (o.dpi / 25.4)).toFixed(2) };
    const place = `translate(${f1(ox)} ${f1(oy)}) scale(${+k.toFixed(4)})`;
    if (o.border) out.push(`<g transform="${place}">${silhouette(wt.s, (o.border * 2) / k)}</g>`);
    out.push(`<g class="pp-dog" transform="${place}">${wt.s}</g>`);
    if (name) {
      let size = o.bg === 'strip' ? H * 0.2 : H * 0.1; const maxW = o.bg === 'strip' ? W * 0.44 - (box[0] + box[2]) - W * 0.03 : W * 0.8; // the mug: the name ends at 44% of the wrap, clear of the handle side
      size = Math.min(size, size * maxW / Math.max(1, textW(name, size)));
      const cx = o.bg === 'strip' ? box[0] + box[2] + W * 0.03 + maxW / 2 : W / 2, base = o.bg === 'strip' ? H * 0.46 : o.bg === 'yard' ? H - B - S * 0.03 - H * 0.03 : box[1] + box[3] + H * 0.1;
      if (o.border && o.bg === 'none') { // a sticker's name sits on the white too
        const tw = textW(name, size), pad = o.border; out.push(`<path d="${wobRect(cx - tw / 2 - pad, base - size * 0.8 - pad * 0.6, tw + 2 * pad, size * 1.05 + pad * 1.2, size * 0.4, r.p, 0)}" fill="#FFFFFF"/>`);
      }
      out.push(nameSVG(name, cx, base, size, INK, o.bg === 'strip' ? -3 : -1.5));
    }
    const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${out.join('')}</svg>`;
    svg.last = stats; return s;
  }

  /* ================ Part 1: the print files for the three launch products (docs/design/merch/PRINT_FILES.md, PART1.md) ================
     PRODUCTS is the one table the merch page preview, the print page (merch/print/v1/) and the tests read. print(recipe, o) -> the print SVG at
     exactly the product's pixel size. Every px below is a 300 dpi file pixel. */
  const ART_VER = 'pp1-' + (BUILD || 'dev'); // 'pp1': these layouts (change it by hand when a layout changes); then a hash of the art, genes, font, names and this file
  const DPI = 300, MM = DPI / 25.4, MIN_LINE_MM = 0.5, MIN_ART_MM = 80, MIN_PX = MIN_LINE_MM * MM;
  // the name is filled outlines, so its thinnest line is the font's: Caveat Bold's strokes are at least 0.068 em (the 2nd percentile of the local
  // stroke thickness over the ink of every allowed letter; test_pawprint.js measures it from the outlines). So letters are never under
  // 0.5 mm / 0.068 em = 87 px (0.29 in) at 300 dpi: a longer name is refused for that product ('long'), never printed thinner
  const FONT_THIN_EM = 0.068, NAME_MIN_PX = Math.ceil(MIN_PX / FONT_THIN_EM), SAY_SHORTER = 'A little shorter, please';
  const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
  const sizes = (a, b) => SIZES.slice(SIZES.indexOf(a), SIZES.indexOf(b) + 1);
  const colour = (id, name, hex, patch, us, uk) => ({ id, name, hex, patch, sizes: { us, uk, both: us.filter((x) => uk.includes(x)) } });
  // the tee colours made in both the US and the UK (Printful catalog, 24 Nov 2026; stock moves: re-read before launch). patch: the cream paper patch
  const TEE_COLOURS = [
    colour('white', 'White', '#FFFFFF', false, sizes('S', '5XL'), sizes('S', '4XL')), // US XS: supplier out of stock
    colour('soft-cream', 'Soft Cream', '#E7D4C0', true, sizes('XS', '4XL'), sizes('S', '2XL')),
    colour('athletic-heather', 'Athletic Heather', '#CECECC', true, sizes('XS', '5XL'), sizes('S', '2XL')),
    colour('pink', 'Pink', '#FDBFC7', true, sizes('XS', '4XL'), sizes('S', '2XL')),
    colour('ice-blue', 'Heather Prism Ice Blue', '#C3E2E3', true, sizes('XS', '4XL'), sizes('XS', '2XL')),
    colour('navy', 'Navy', '#212642', true, sizes('XS', '5XL'), sizes('XS', '2XL')),
    colour('black', 'Black', '#0C0C0C', true, sizes('XS', '5XL'), sizes('XS', '4XL'))];
  const WHITE = [{ id: 'white', name: 'White', hex: '#FFFFFF', patch: false }];
  const POSE3 = ['stand', 'sit', 'happy'], POSE_ART = { stand: 'idle', sit: 'sit', happy: 'happy' };
  const PRODUCTS = {
    tee: { id: 'tee', name: 'Tee, Bella+Canvas 3001', launch: true, w: 4500, h: 5400, dpi: DPI, inches: [15, 18], transparent: true,
      printful: { product: 71, placement: 'front_large', technique: 'dtg' }, // v1 catalog calls the front 'default'; XS-M are shrunk by Printful to 11.5 x 13.8 in
      // scale by the art box: 12.5 px a unit, so the 240 x 200 art box would print 10 x 8.33 in and a puppy prints puppy-sized; but no dog prints
      // narrower than minDogIn inches (it is scaled up to it; 0 = off; the owner chooses, see samples/puppy_size_choice.png). The drawing (its real
      // bounds, never cut at the art box) and the name under it are centred, from 1 in below the top of the print area (top), inside safe.
      unit: 12.5, minDogIn: 5, top: 300, cx: 2250, safe: [150, 150, 4350, 5250],
      name: { w: 2880, h: 500, max: 390, gap: 90, rot: -1.5 }, nameMin: NAME_MIN_PX, patchPad: 120,
      scale: 'artbox', poses: POSE3, colours: TEE_COLOURS },
    mug: { id: 'mug', name: 'Mug, 11 oz white', launch: true, w: 2700, h: 1050, dpi: DPI, inches: [9, 3.5], transparent: true,
      printful: { product: 19, placement: 'default', technique: 'sublimation' },
      // one face per side, centred at sides[]: the dog fills sideW x (height - name), the name a nameW-wide band above it, as tall as the name needs at nameMin and
      // at most nameH[1] (it takes what the dog leaves at 80 mm, never less than its own line)
      safe: { top: 75, bottom: 75, ends: 150 }, sides: [675, 2025], sideW: 1050, nameW: 1050, strip: 300, nameH: [100, 190], nameMin: NAME_MIN_PX,
      scale: 'fill', poses: POSE3, colours: WHITE },
    // no stickers at launch (owner, 24 Nov 2026): the sheet is kept and tested, but not offered (launch: false)
    stickers: { id: 'stickers', name: 'Kiss-cut sticker sheet, A5', launch: false, w: 1749, h: 2481, dpi: DPI, inches: [5.83, 8.27], transparent: true,
      printful: { product: 505, placement: 'default', technique: 'digital' },
      edge: 120, gap: 150, across: 225, backing: 18,
      cells: { stand: [120, 120, 679, 560], sit: [950, 120, 679, 560], happy: [120, 830, 679, 560], head: [950, 830, 679, 560],
        label: [120, 1540, 935, 380], head2: [1205, 1540, 424, 380], heart: [120, 2070, 403, 291], paw: [673, 2070, 403, 291], bone: [1226, 2070, 403, 291] },
      scale: 'fill', poses: POSE3, colours: WHITE }
  };

  const f2 = (n) => Math.round(n * 100) / 100;
  // the ground shadow (dogs/pawart_dogs.js: one faint ellipse at the ground line plus its hatching). Every print drops it, and checks it went:
  // exactly one shadow found and removed, and no faint ink ellipse left, or print() throws (if the art's shadow ever changes, we hear of it)
  const SHADOW = /<ellipse cx="[\d.]+" cy="187.5" rx="[\d.]+" ry="[\d.]+" fill="#5B3D32" opacity="0?\.\d+"\/><path d="[^"]*" stroke="#5B3D32" stroke-width="1.3"[^>]*\/>/g;
  const SHADOW_LEFT = /<ellipse\b[^>]*fill="#5B3D32"[^>]*\sopacity="0?\.\d+"/;
  function dropShadow(s) { let n = 0; const t = s.replace(SHADOW, () => { n++; return ''; }); if (n !== 1 || SHADOW_LEFT.test(t)) throw new Error('shadow: found ' + n); return t; }
  const SPARK = /<g class="pa-d-tw"[^>]*>(?:<path [^>]*\/>)*<\/g>/g;
  const tidyArt = (s) => s.replace(/\s(?:role|aria-label|class|style)="[^"]*"/g, '');
  // art placed with its viewBox vb at (x, y), k px per unit; the nested <svg> clips at vb, so vb is always the art's whole drawing plus a margin
  const nest = (s, vb, x, y, k) => `<svg x="${f2(x)}" y="${f2(y)}" width="${f2(vb[2] * k)}" height="${f2(vb[3] * k)}" viewBox="${vb.map(f2).join(' ')}">${s}</svg>`;
  const NEST_M = 4; // art units round the drawn box (which already holds half of each stroke): room for a mitred corner, never a cut

  // the dog for a print: the game's own drawing, no ground shadow (on fabric or a sticker it reads as a stain); sparkle stars off on request.
  // bb: its real drawn box in art units (strokes included; the game's 240 x 200 art box does not cut it: an Akita's sitting tail, a Witch Hat's tip
  // and sparkle stars may reach past it); box: the viewBox to nest it with (bb plus NEST_M)
  function printDog(r, pose, facing, noSpark) {
    let s = dropShadow(inner(dogSVG(r, { pose: POSE_ART[pose], facing })));
    if (noSpark) s = s.replace(SPARK, '').replace(/<g class="pa-d-spk"><\/g>/g, '');
    const vb = [0, 0, 240, 200], all = bbox(s, true), bb = all.bb;
    return { s: tidyArt(s), vb, bb, box: [bb[0] - NEST_M, bb[1] - NEST_M, bb[2] - bb[0] + 2 * NEST_M, bb[3] - bb[1] + 2 * NEST_M], els: all.els };
  }
  // for the tests: the real drawn box and the nest box of a print dog
  function printArt(r, pose, facing) { const d = printDog(r, pose || 'stand', facing || 'right', false); return { bb: d.bb, box: d.box }; }
  // the head (PawArt.dogHead, as the game's cards draw it), without sparkle stars
  function printHead(r) {
    const A = artOpts(r, { pose: 'idle' }), sv = PA.dogHead(A.key, A.ex), vb = [0, 0, 100, 100];
    const s = inner(sv).replace(SPARK, ''), all = bbox(s, true);
    return { s: tidyArt(s), vb, bb: all.bb, els: all.els };
  }

  // every shape of s in white with a stroke `px` wide in file pixels (whatever its own transforms): the sticker's backing
  function backing(s, k, px) { // px: the white past each side of the art, x 2 (a line keeps its own width plus that)
    const stack = [{ sc: k, sw: 1, on: false }];
    return '<g fill="#FFFFFF" stroke="#FFFFFF" stroke-linejoin="round" stroke-linecap="round">' + s.replace(/<(\/?)([a-zA-Z]+)\b([^>]*?)(\/?)>/g, (m, close, tag, attrs, self) => {
      if (close) { if (tag === 'g' || tag === 'svg') stack.pop(); return m; }
      const up = stack[stack.length - 1], tm = /\stransform="([^"]*)"/.exec(attrs), M = tm ? parseTf(tm[1]) : null;
      const sc = up.sc * (M ? Math.sqrt(Math.abs(M[0] * M[3] - M[1] * M[2])) : 1) * (tag === 'svg' ? svgScale(attrs) : 1);
      const swm = /\sstroke-width="([\d.]+)"/.exec(attrs), stm = /\sstroke="([^"]*)"/.exec(attrs), sw = swm ? +swm[1] : up.sw, on = stm ? stm[1] !== 'none' : up.on;
      const a = attrs.replace(/\s(?:fill|stroke|stroke-width|opacity|fill-opacity|stroke-opacity|stroke-linejoin|stroke-linecap|stroke-dasharray|class|style)="[^"]*"/g, '');
      if (tag === 'g' || tag === 'svg') { if (!self) stack.push({ sc, sw, on }); return '<' + tag + a + self + '>'; }
      return '<' + tag + a + (/\sfill="none"/.test(attrs) ? ' fill="none"' : '') + ` stroke-width="${f2((on ? sw : 0) + px / sc)}"` + self + '>'; // an open line stays a line
    }) + '</g>';
  }
  // happy-pose hearts float by the head: a white bridge from each heart to the nearest drawn point of the dog joins them into the one sticker
  const HEART_FILL = /\sfill="#FF4F7B"|\sfill="#FF8FB1"/;
  function bridges(els, w) {
    const hearts = els.filter((e) => e.tag === 'path' && HEART_FILL.test(e.attrs) && e.pts.length >= 14 && e.pts.length <= 20);
    let out = '';
    for (const h of hearts) {
      const c = h.pts.reduce((a, p) => [a[0] + p[0] / h.pts.length, a[1] + p[1] / h.pts.length], [0, 0]), rad = Math.max(...h.pts.map((p) => Math.hypot(p[0] - c[0], p[1] - c[1])));
      let best = null, bd = 1e9;
      for (const e of els) {
        if (e === h || !e.pts.length) continue; const ec = e.pts.reduce((a, p) => [a[0] + p[0] / e.pts.length, a[1] + p[1] / e.pts.length], [0, 0]);
        if (hearts.some((o) => Math.hypot(ec[0] - o.pts[0][0], ec[1] - o.pts[0][1]) < rad * 2.2 && Math.hypot(ec[0] - c[0], ec[1] - c[1]) < rad * 6 && e.pts.length <= 20)) continue; // the heart's own outline, the other heart
        for (const p of e.pts) { const d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d > rad * 1.3 && d < bd) { bd = d; best = p; } }
      }
      if (best) out += `<path d="M${f2(c[0])} ${f2(c[1])}L${f2(best[0])} ${f2(best[1])}" stroke-width="${f2(w)}"/>`;
    }
    return out;
  }
  // one sticker: the white backing (crisp edged: the kiss-cut follows a hard edge) and the art over it
  function sticker(a, x, y, k, bk) {
    const u = a.bb ? [Math.min(a.vb[0], a.bb[0]), Math.min(a.vb[1], a.bb[1]), Math.max(a.vb[0] + a.vb[2], a.bb[2]), Math.max(a.vb[1] + a.vb[3], a.bb[3])] : [a.vb[0], a.vb[1], a.vb[0] + a.vb[2], a.vb[1] + a.vb[3]]; // never cut the drawing (an Akita's sitting tail)
    const m = bk / k + 2, vb2 = [u[0] - m, u[1] - m, u[2] - u[0] + 2 * m, u[3] - u[1] + 2 * m];
    const back = backing(a.s, k, bk * 2).replace(/<\/g>$/, (a.els ? bridges(a.els, (bk * 2) / k) : '') + '</g>');
    return `<g shape-rendering="crispEdges">${nest(back, vb2, x + vb2[0] * k, y + vb2[1] * k, k)}</g>` + nest(weight(a.s, k, MIN_PX).s, vb2, x + vb2[0] * k, y + vb2[1] * k, k); // not clipped at the art box: a sticker shows the whole drawing
  }

  // the name as outlines, as big as fits in box [x, y, w, h] (letters at most maxSize px), centred, on one line; -> { svg, size, bb }, or null
  // when it would be smaller than minSize (never printed thinner). top: its ink starts at the top of the box (else it is centred in it)
  function fitName(t, box, maxSize, rot, minSize, top) {
    const s0 = 100, b0 = bbox(nameSVG(t, 0, 0, s0, INK, rot)), bw = Math.max(1, b0[2] - b0[0]), bh = Math.max(1, b0[3] - b0[1]);
    const f = Math.min(maxSize / s0, box[2] / bw, box[3] / bh), size = s0 * f;
    if (minSize && size < minSize - 1e-9) return null;
    const cx = box[0] + box[2] / 2 - (b0[0] + b0[2]) / 2 * f;
    let base = top ? box[1] - b0[1] * f : box[1] + box[3] / 2 + 0.3 * size;
    if (base + b0[1] * f < box[1]) base = box[1] - b0[1] * f;
    if (base + b0[3] * f > box[1] + box[3]) base = box[1] + box[3] - b0[3] * f;
    const svgN = nameSVG(t, cx, base, size, INK, rot);
    return { svg: svgN, size: f2(size), bb: [cx + b0[0] * f, base + b0[1] * f, cx + b0[2] * f, base + b0[3] * f].map(f2) };
  }
  // a cream card with a crayon edge, wobbling round [x, y, w, h]: the paper patch on coloured tees and the name label
  function crayonCard(x, y, w, h, seed, jit, rad) {
    const R = rng(seed), pts = [], per = 2 * (w + h), n = Math.max(24, Math.round(per / Math.max(40, jit * 3)));
    for (let i = 0; i < n; i++) {
      const t = i / n * per; let px, py, nx, ny;
      if (t < w) { px = x + t; py = y; nx = 0; ny = -1; } else if (t < w + h) { px = x + w; py = y + t - w; nx = 1; ny = 0; } else if (t < 2 * w + h) { px = x + w - (t - w - h); py = y + h; nx = 0; ny = 1; } else { px = x; py = y + h - (t - 2 * w - h); nx = -1; ny = 0; }
      // round the corners
      const cxr = Math.min(Math.max(px, x + rad), x + w - rad), cyr = Math.min(Math.max(py, y + rad), y + h - rad), dx = px - cxr, dy = py - cyr, dl = Math.hypot(dx, dy);
      if (dl > rad) { px = cxr + dx / dl * rad; py = cyr + dy / dl * rad; }
      const j = (R() - 0.5) * jit; pts.push([px + nx * j, py + ny * j]);
    }
    return 'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join('L') + 'Z';
  }
  // the name to print: name false = none; true (or left out) = the recipe's; a string must pass nameOk (a refused one is a caller's slip: throws)
  function nameOf(r, o) {
    if (o.name === false) return '';
    if (o.name === true || o.name == null) return r.n || '';
    if (typeof o.name !== 'string') throw new Error('name');
    const t = nameOk(o.name); if (!t.ok) throw new Error('name: ' + t.why); return t.name;
  }
  // the mug tilts each name 2 degrees (a long name less, so it keeps its height)
  const mugRot = (t, i) => (i ? 2 : -2) * Math.min(1, 10 / Math.max(1, Array.from(t).length));
  // can this name print at least P.nameMin tall on product P, whatever the dog? -> { ok, size } or { ok: false, max: letters of it that would fit }
  function nameFit(t, P) {
    const tryIt = (s) => (P.id === 'tee' ? fitName(s, [0, 0, P.name.w, P.name.h], P.name.max, P.name.rot, P.nameMin) : P.id === 'mug' ? fitName(s, [0, 0, P.nameW, 1e4], P.nameMin, mugRot(s, 0), P.nameMin) : { size: 1 });
    const N = tryIt(t); if (N) return { ok: true, size: N.size };
    const cps = Array.from(t); let max = cps.length - 1; while (max > 0 && !tryIt(cps.slice(0, max).join('').trim())) max--;
    return { ok: false, max };
  }

  // the tee: the dog at the tee's scale (or scaled up to minDogIn), its name under it, the pair centred from P.top; on colour, a patch that hugs both
  function teeBody(r, P, C, o, st) {
    const d = printDog(r, o.pose, 'right', false), name = nameOf(r, o), out = [], S = P.safe, pad = C.patch ? P.patchPad + 30 : 0; // 30: the patch's wobble and line
    const bw = d.bb[2] - d.bb[0], bh = d.bb[3] - d.bb[1];
    let k = P.unit, grown = 1;
    if (P.minDogIn > 0 && bw * k < P.minDogIn * P.dpi) { grown = P.minDogIn * P.dpi / (bw * k); k *= grown; }
    const N0 = name ? fitName(name, [0, 0, P.name.w, P.name.h], P.name.max, P.name.rot, P.nameMin, true) : null;
    if (name && !N0) throw new Error('name: long');
    const nh = N0 ? N0.bb[3] - N0.bb[1] : 0, gap = N0 ? P.name.gap : 0;
    // never past the safe area: move it first, and only if that is not enough shrink this dog just enough
    const sw = S[2] - S[0] - 2 * pad, sh = S[3] - S[1] - 2 * pad; let shrunk = 1;
    if (bw * k > sw) { shrunk = sw / (bw * k); k *= shrunk; }
    if (bh * k + gap + nh > sh) { const s2 = (sh - gap - nh) / (bh * k); shrunk *= s2; k *= s2; }
    const th = bh * k + gap + nh, y0 = Math.min(Math.max(P.top, S[1] + pad), S[3] - pad - th);
    const X = P.cx - (d.bb[0] + d.bb[2]) / 2 * k, Y = y0 - d.bb[1] * k; // where the art's (0, 0) lands
    const dogBox = [X + d.bb[0] * k, Y + d.bb[1] * k, X + d.bb[2] * k, Y + d.bb[3] * k].map(f2), nestBox = [X + d.box[0] * k, Y + d.box[1] * k, X + (d.box[0] + d.box[2]) * k, Y + (d.box[1] + d.box[3]) * k].map(f2);
    const N = name ? fitName(name, [P.cx - P.name.w / 2, dogBox[3] + gap, P.name.w, P.name.h], P.name.max, P.name.rot, P.nameMin, true) : null;
    const U = N ? [Math.min(dogBox[0], N.bb[0]), dogBox[1], Math.max(dogBox[2], N.bb[2]), Math.max(dogBox[3], N.bb[3])] : dogBox; // what is drawn
    if (C.patch) { // the paper patch: the only edge that touches the fabric, drawn without anti-aliasing so every edge pixel is fully opaque or fully clear
      const p = P.patchPad, w = U[2] - U[0] + 2 * p, h = U[3] - U[1] + 2 * p, card = crayonCard(U[0] - p, U[1] - p, w, h, (r.p ^ 0x7EE) >>> 0, 24, Math.min(140, w / 4, h / 4));
      out.push(`<g shape-rendering="crispEdges"><path d="${card}" fill="${PAPER}"/><path d="${card}" fill="none" stroke="${INK}" stroke-width="24" stroke-linejoin="round"/></g>`);
      st.patch = [U[0] - p - 30, U[1] - p - 30, U[2] + p + 30, U[3] + p + 30].map(f2); // [x0, y0, x1, y1], wobble and line included
      st.patchIn = [U[0] - p + 30, U[1] - p + 30, U[2] + p - 30, U[3] + p - 30].map(f2); // always cream inside this
    }
    const wt = weight(d.s, k, MIN_PX); out.push(nest(wt.s, d.box, nestBox[0], nestBox[1], k));
    Object.assign(st, { k: +k.toFixed(4), artMM: f2(240 * k / MM), dogIn: f2((dogBox[2] - dogBox[0]) / P.dpi), grown: f2(grown), shrunk: f2(shrunk), dogBox, nest: [nestBox], box: U.map(f2), thin: wt.n });
    if (N) { out.push(N.svg); st.name = { text: name, size: N.size, bb: N.bb }; }
    return out.join('');
  }

  function mugBody(r, P, C, o, st) {
    const S = P.safe, name = nameOf(r, o), top = S.top, bot = P.h - S.bottom, avail = bot - top, out = [];
    const dR = printDog(r, o.pose, 'right', false), dL = printDog(r, o.pose, 'left', false);
    const bw = Math.max(dR.bb[2] - dR.bb[0], dL.bb[2] - dL.bb[0]), bh = Math.max(dR.bb[3] - dR.bb[1], dL.bb[3] - dL.bb[1]);
    const kMin = MIN_ART_MM * MM / 240, need = name ? Math.max(...[0, 1].map((i) => { const N = fitName(name, [0, 0, P.nameW, 1e4], P.nameMin, mugRot(name, i), P.nameMin); if (!N) throw new Error('name: long'); return N.bb[3] - N.bb[1] + 2; })) : 0;
    const ns = name ? Math.min(P.nameH[1], Math.max(P.nameH[0], need, avail - bh * kMin)) : 0; // the name's band: its line at nameMin at least
    const k = Math.min(P.sideW / bw, (avail - ns) / bh), keep = [], dogs = [], boxes = [], nests = [], names = [];
    [dR, dL].forEach((d, i) => { // the left side's dog faces right (to the back of the mug), the right side's faces left; placed by its real drawn box
      const cx = P.sides[i], x = cx - (d.bb[0] + d.bb[2]) / 2 * k, y = bot - d.bb[3] * k, wt = weight(d.s, k, MIN_PX);
      dogs.push(nest(wt.s, d.box, x + d.box[0] * k, y + d.box[1] * k, k)); st.thin = (st.thin || 0) + wt.n;
      nests.push([x + d.box[0] * k, y + d.box[1] * k, x + (d.box[0] + d.box[2]) * k, y + (d.box[1] + d.box[3]) * k].map(f2));
      const box = [x + d.bb[0] * k, y + d.bb[1] * k, x + d.bb[2] * k, y + d.bb[3] * k].map(f2); boxes.push(box); keep.push([box[0] - 40, box[2] + 40]);
    });
    out.push(weight(yardStrip(P.w, P.h - P.strip, P.strip, MIN_PX * 1.6, (r.p ^ 0x5A5A) >>> 0, keep), 1, MIN_PX).s);
    out.push(...dogs);
    let size = 0;
    if (name) P.sides.forEach((cx, i) => { const N = fitName(name, [cx - P.nameW / 2, top, P.nameW, ns], Math.max(ns * 0.8, P.nameMin), mugRot(name, i), P.nameMin); if (!N) throw new Error('name: long'); out.push(N.svg); names.push(N.bb); size = N.size; });
    Object.assign(st, { k: f2(k), artMM: f2(240 * k / MM), dogBox: boxes, nest: nests, name: name ? { text: name, size, bb: names } : null });
    return out.join('');
  }

  // the doodles: crude crayon shapes in a 100 x 100 box, each one closed shape (fill under its own outline)
  function doodle(kind, seed) {
    const R = rng(seed), J = (a) => (R() - 0.5) * a, line = 4.2;
    const sh = (d, fill) => `<path d="${d}" fill="${fill}"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="${line}" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (kind === 'heart') {
      const p = []; for (let i = 0; i < 28; i++) { const t = i / 28 * Math.PI * 2, x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t); p.push([50 + x * 2.55 + J(1.6), 47 - y * 2.55 + J(1.6)]); }
      const d = 'M' + p.map((q) => f1(q[0]) + ' ' + f1(q[1])).join('L') + 'Z';
      return { s: sh(d, '#F28FA5') + `<path d="M31 34 Q34 27 41 27" fill="none" stroke="#FFFFFF" stroke-width="4.5" stroke-linecap="round"/>`, vb: [0, 0, 100, 100] };
    }
    if (kind === 'paw') {
      let s = sh(blob(50, 64, 21, 17, 16, seed + 1, 0.12), '#C9A27A');
      [[25, 42, 8, 10], [40, 27, 8.5, 10.5], [60, 27, 8.5, 10.5], [75, 42, 8, 10]].forEach((t, i) => { s += sh(blob(t[0], t[1], t[2], t[3], 12, seed + 2 + i, 0.14), '#C9A27A'); });
      return { s: s + `<path d="M40 60 Q45 55 51 56" fill="none" stroke="#E8CDAE" stroke-width="3.5" stroke-linecap="round"/>`, vb: [0, 0, 100, 100] };
    }
    // the bone: two knobs at each end of a bar, one outline, laid on the slant
    const q = (x, y) => f1(x + J(1.6)) + ' ' + f1(y + J(1.6));
    const d = `M${q(27, 42)} L${q(73, 42)} C${q(72, 29)} ${q(86, 23)} ${q(91, 33)} C${q(97, 38)} ${q(95, 48)} 88 50 C${q(95, 52)} ${q(97, 62)} ${q(91, 67)} C${q(86, 77)} ${q(72, 71)} ${q(73, 58)} L${q(27, 58)} C${q(28, 71)} ${q(14, 77)} ${q(9, 67)} C${q(3, 62)} ${q(5, 52)} 12 50 C${q(5, 48)} ${q(3, 38)} ${q(9, 33)} C${q(14, 23)} ${q(28, 29)} 27 42 Z`;
    return { s: `<g transform="rotate(-32 50 50)">` + sh(d, '#FFF4DF') + `<path d="M30 47 L64 47" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/></g>`, vb: [0, 0, 100, 100] };
  }
  const fitIn = (a, cell, bk) => { const bw = a.bb[2] - a.bb[0], bh = a.bb[3] - a.bb[1]; return Math.min((cell[2] - 2 * bk - 16) / bw, (cell[3] - 2 * bk - 16) / bh); }; // 8 px spare round each sticker
  const centreIn = (a, cell, k) => [cell[0] + (cell[2] - (a.bb[2] - a.bb[0]) * k) / 2 - a.bb[0] * k, cell[1] + (cell[3] - (a.bb[3] - a.bb[1]) * k) / 2 - a.bb[1] * k];

  function sheetBody(r, P, C, o, st) {
    const bk = P.backing, cells = P.cells, out = [], name = nameOf(r, o) || 'good dog!';
    // three poses at one scale (the same dog three times), each filling its sticker
    const dogs = [['stand', 'right'], ['sit', 'left'], ['happy', 'right']].map(([pose, face]) => ({ a: printDog(r, pose, face, true), cell: cells[pose] }));
    const k = Math.min(...dogs.map((d) => fitIn(d.a, d.cell, bk)));
    const box = (a, x, y, kk) => [x + a.bb[0] * kk - bk, y + a.bb[1] * kk - bk, x + a.bb[2] * kk + bk, y + a.bb[3] * kk + bk].map(f2); st.boxes = {}; // each sticker's outer box (art + backing)
    dogs.forEach((d, i) => { const [x, y] = centreIn(d.a, d.cell, k); out.push(sticker(d.a, x, y, k, bk)); st.boxes[POSE3[i]] = box(d.a, x, y, k); });
    st.k = f2(k); st.artMM = f2(240 * k / MM);
    // two heads, a big one and a small one
    const hd = printHead(r);
    { const kh = fitIn(hd, cells.head, bk), [x, y] = centreIn(hd, cells.head, kh); out.push(sticker(hd, x, y, kh, bk)); st.headK = f2(kh); st.boxes.head = box(hd, x, y, kh); }
    { // the small head on a round badge: round whatever the breed's ears, so it is always wide enough to cut and peel
      const disc = blob(50, 50, 47, 47, 30, (r.p ^ 0xBAD6E) >>> 0, 0.035);
      const badge = { s: `<path d="${disc}" fill="#D3E9F6"/><path d="${disc}" fill="none" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>` + nest(hd.s, hd.vb, 13, 13, 0.74), vb: [0, 0, 100, 100], bb: [0, 0, 100, 100], els: null };
      const kb = fitIn(badge, cells.head2, bk), [x, y] = centreIn(badge, cells.head2, kb); out.push(sticker(badge, x, y, kb, bk)); st.head2K = f2(kb * 0.74); st.boxes.head2 = box(badge, x, y, kb);
    }
    // the name label (or "good dog!"): the name on a crayon card
    const L = cells.label, pad = 46, N = fitName(name, [L[0] + bk + 16 + pad, L[1] + bk + 16 + pad, L[2] - 2 * (bk + 16 + pad), L[3] - 2 * (bk + 16 + pad)], 170, -2); // 16: the card's wobble and line
    const tw = Math.max(620, N.bb[2] - N.bb[0] + 2 * pad), th = Math.max(230, Math.min(L[3] - 2 * bk - 32, N.bb[3] - N.bb[1] + 2 * pad)), tx = L[0] + (L[2] - tw) / 2, ty = L[1] + (L[3] - th) / 2;
    const card = crayonCard(tx, ty, tw, th, (r.p ^ 0x1AB) >>> 0, 10, 46);
    const lab = { s: `<path d="${card}" fill="#FFF3B8"/><path d="${card}" fill="none" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>` + N.svg, vb: [0, 0, P.w, P.h], els: null };
    out.push(sticker(lab, 0, 0, 1, bk)); st.label = { text: name, size: N.size }; st.boxes.label = [tx - 10 - bk, ty - 10 - bk, tx + tw + 10 + bk, ty + th + 10 + bk].map(f2);
    // a heart, a paw and a bone
    for (const kind of ['heart', 'paw', 'bone']) { const a = doodle(kind, (r.p ^ kind.length * 977) >>> 0); a.bb = bbox(a.s); a.els = null; const kd = fitIn(a, cells[kind], bk), [x, y] = centreIn(a, cells[kind], kd); out.push(sticker(a, x, y, kd, bk)); st.boxes[kind] = box(a, x, y, kd); }
    return out.join('');
  }

  // PawPrint.print(recipe, { product: 'tee' | 'mug' | 'stickers', colour, pose: 'stand' | 'sit' | 'happy', name: true (the recipe's) | false | a string })
  // -> the complete print SVG. A bad recipe, product, colour or pose throws (a caller's slip), and so does a name string that nameOk refuses or that
  // cannot print NAME_MIN_PX tall ('name: ...'; check nameOk(s, { product }) first), and art whose ground shadow is not where it should be ('shadow')
  function print(r, o) {
    o = Object.assign({ pose: 'stand', name: true }, o || {});
    const c = check(r); if (!c.ok) throw new Error('bad recipe: ' + c.err);
    const P = own(PRODUCTS, o.product); if (!P) throw new Error('product');
    const C = P.colours.find((x) => x.id === (o.colour || P.colours[0].id)); if (!C) throw new Error('colour');
    if (!P.poses.includes(o.pose)) throw new Error('pose');
    const st = { product: P.id, colour: C.id, pose: o.pose, w: P.w, h: P.h, artVer: ART_VER };
    const body = P.id === 'tee' ? teeBody(r, P, C, o, st) : P.id === 'mug' ? mugBody(r, P, C, o, st) : sheetBody(r, P, C, o, st);
    print.last = st;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${P.w}" height="${P.h}" viewBox="0 0 ${P.w} ${P.h}" data-pawprint="${ART_VER}" data-product="${P.id}-${C.id}"><!-- PawPrint ${ART_VER} ${P.id} ${C.id} -->${body}</svg>`;
  }

  // the print page's link: #p=<one dog>&prod=tee|mug&col=<colour id>&pose=stand|sit|happy&n=0|1&av=<ART_VER>, every key required, in any order
  // -> { ok, svg, w, h, product, colour, pose, name, id: 'tee-navy-stand-n1', artVer, err }. Never throws; anything unknown, repeated, missing or
  // malformed is refused (the page then draws nothing), and so is a link made by another build (av), a product that is not on sale (launch: false;
  // o.testOnly lets the tests through), n=1 for a dog with no name, and a name that cannot print big enough
  const HASH_KEYS = ['p', 'prod', 'col', 'pose', 'n', 'av'];
  function printFromHash(hash, o) {
    const bad = (err) => ({ ok: false, err, svg: '', w: 0, h: 0 });
    try {
      if (typeof hash !== 'string' || hash.length > HASH_MAX + 120) return bad('size');
      const q = hash.charAt(0) === '#' ? hash.slice(1) : hash; if (!q) return bad('empty');
      const kv = {};
      for (const part of q.split('&')) { const m = /^([a-z]{1,4})=([A-Za-z0-9_-]{1,1024})$/.exec(part); if (!m || !HASH_KEYS.includes(m[1]) || kv[m[1]] !== undefined) return bad('param'); kv[m[1]] = m[2]; }
      for (const k of HASH_KEYS) if (kv[k] === undefined) return bad('missing ' + k);
      if (kv.av !== ART_VER) return bad('art version');
      const P = own(PRODUCTS, kv.prod); if (!P) return bad('product');
      if (!P.launch && !(o && o.testOnly)) return bad('product off');
      const d = merchDecode(kv.p); if (!d.ok) return bad('dog: ' + d.err); if (d.dogs.length !== 1) return bad('one dog');
      const col = kv.col; if (!P.colours.some((x) => x.id === col)) return bad('colour');
      const pose = kv.pose; if (!P.poses.includes(pose)) return bad('pose');
      const n = kv.n; if (n !== '0' && n !== '1') return bad('n');
      if (n === '1' && !d.dogs[0].n) return bad('name');
      let svg; try { svg = print(d.dogs[0], { product: P.id, colour: col, pose, name: n === '1' }); } catch (e) { return bad(/^name/.test(String(e && e.message)) ? 'name' : 'render'); }
      return { ok: true, svg, w: P.w, h: P.h, product: P.id, colour: col, pose, name: n === '1', id: `${P.id}-${col}-${pose}-n${n}`, artVer: ART_VER, err: null };
    } catch (e) { return bad('render'); }
  }
  // the link for one dog: what the order server hands the print page (name on only when the dog has one). Throws on a caller's slip, and for a
  // product not on sale unless o.testOnly
  function printHash(r, o) {
    o = o || {}; const P = own(PRODUCTS, o.product); if (!P) throw new Error('product'); if (!P.launch && !o.testOnly) throw new Error('product off');
    const col = o.colour || P.colours[0].id, pose = o.pose || 'stand'; if (!P.colours.some((x) => x.id === col)) throw new Error('colour'); if (!P.poses.includes(pose)) throw new Error('pose');
    return '#p=' + merchEncode(r) + '&prod=' + P.id + '&col=' + col + '&pose=' + pose + '&n=' + (o.name === false || !r.n ? 0 : 1) + '&av=' + ART_VER;
  }

  /* ---------------- the wire: base64url ---------------- */
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function b64(u8) { let s = ''; for (let i = 0; i < u8.length; i += 3) { const n = (u8[i] << 16) | ((u8[i + 1] || 0) << 8) | (u8[i + 2] || 0); s += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < u8.length ? B64[(n >> 6) & 63] : '') + (i + 2 < u8.length ? B64[n & 63] : ''); } return s; }
  function unb64(s) {
    if (!/^[A-Za-z0-9_-]*$/.test(s) || s.length % 4 === 1) return null; const out = []; let buf = 0, bits = 0;
    for (const ch of s) { buf = (buf << 6) | B64.indexOf(ch); bits += 6; if (bits >= 8) { bits -= 8; out.push((buf >> bits) & 255); } }
    return Uint8Array.from(out);
  }
  const utf8 = (s) => (typeof TextEncoder !== 'undefined' ? new TextEncoder().encode(s) : Uint8Array.from(Buffer.from(s, 'utf8')));
  const unutf8 = (u) => { try { return typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: true }).decode(u) : Buffer.from(u).toString('utf8'); } catch (e) { return null; } };
  function genes16(code) { if (code == null) return 0xFFFF; const m = /^([0-2]{6})(?:a([0-2]))?(?:i([0-2]))?$/.exec(code); let n = 0; for (const d of m[1]) n = n * 3 + +d; return n * 16 + (m[2] == null ? 0 : +m[2] + 1) * 4 + (m[3] == null ? 0 : +m[3] + 1); }
  function un16(n) { if (n === 0xFFFF) return null; const a = (n >> 2) & 3, i = n & 3; let x = n >> 4; if (x >= 729) return undefined; let s = ''; for (let k = 0; k < 6; k++) { s = (x % 3) + s; x = Math.floor(x / 3); } return s + (a ? 'a' + (a - 1) : '') + (i ? 'i' + (i - 1) : ''); }
  function merchEncode(list) {
    list = Array.isArray(list) ? list : [list]; if (!list.length || list.length > MAX_DOGS) throw new Error('1 to ' + MAX_DOGS + ' dogs');
    const out = [VERSION, list.length];
    for (const r of list) {
      const c = check(r); if (!c.ok) throw new Error('bad recipe: ' + c.err);
      const nm = r.n ? utf8(r.n) : null, g = genes16(r.g);
      out.push(r.b, g >> 8, g & 255, r.e | (r.a << 2) | ((r.s === 'f' ? 1 : 0) << 4) | ((r.sp ? 1 : 0) << 5) | ((r.h !== undefined ? 1 : 0) << 6) | ((nm ? 1 : 0) << 7), (r.p >>> 24) & 255, (r.p >>> 16) & 255, (r.p >>> 8) & 255, r.p & 255);
      if (r.h !== undefined) out.push(r.h);
      const o = r.o || []; out.push(o.length); o.forEach((i) => out.push(i));
      if (nm) { out.push(nm.length); nm.forEach((x) => out.push(x)); }
    }
    const u = Uint8Array.from(out.concat([0, 0])), h = fnv16(u, u.length - 2); u[u.length - 2] = h >> 8; u[u.length - 1] = h & 255;
    return b64(u);
  }
  // -> { ok, dogs: [recipe], err }. Never throws; refuses anything malformed, oversized or unknown
  function merchDecode(s) {
    try {
      if (typeof s !== 'string' || !s.length || s.length > HASH_MAX) return { ok: false, err: 'size' };
      const u = unb64(s); if (!u || u.length < 4) return { ok: false, err: 'base64' };
      if (fnv16(u, u.length - 2) !== ((u[u.length - 2] << 8) | u[u.length - 1])) return { ok: false, err: 'check' };
      if (u[0] !== VERSION) return { ok: false, err: 'version' };
      const n = u[1]; if (n < 1 || n > MAX_DOGS) return { ok: false, err: 'count' };
      let i = 2; const end = u.length - 2, need = (k) => { if (i + k > end) throw new Error('short'); }; const dogs = [];
      for (let d = 0; d < n; d++) {
        need(8); const b = u[i++], g = un16((u[i++] << 8) | u[i++]), f = u[i++], p = ((u[i++] << 24) | (u[i++] << 16) | (u[i++] << 8) | u[i++]) >>> 0;
        if (g === undefined) return { ok: false, err: 'genes' };
        const r = { v: VERSION, b, g, e: f & 3, p, a: (f >> 2) & 3, s: (f >> 4) & 1 ? 'f' : 'm' };
        if ((f >> 5) & 1) r.sp = 1;
        if ((f >> 6) & 1) { need(1); r.h = u[i++]; }
        need(1); const no = u[i++]; if (no > 6) return { ok: false, err: 'wear' }; need(no); if (no) { r.o = []; for (let k = 0; k < no; k++) r.o.push(u[i++]); }
        if ((f >> 7) & 1) { need(1); const L = u[i++]; if (!L || L > NAME_MAX * 4) return { ok: false, err: 'name' }; need(L); const t = unutf8(u.subarray(i, i + L)); i += L; if (t == null) return { ok: false, err: 'name' }; r.n = t; }
        const c = check(r); if (!c.ok) return { ok: false, err: c.err };
        dogs.push(r);
      }
      if (i !== end) return { ok: false, err: 'trailing' };
      return { ok: true, dogs };
    } catch (e) { return { ok: false, err: 'short' }; }
  }

  /* ---------------- the two readers ---------------- */
  // the merch page on doodledoggo.app (same origin as /play/): localStorage['pawhaven_proto_v1'], the game's save S as JSON (00_core.js saveNow)
  function merchFromSave(json, o) {
    o = o || {}; let s = json;
    if (typeof json === 'string') { if (json.length > SAVE_MAX) return { ok: false, err: 'size', dogs: [] }; try { s = JSON.parse(json); } catch (e) { return { ok: false, err: 'json', dogs: [] }; } }
    if (!s || typeof s !== 'object' || s.v !== 1) return { ok: false, err: 'not a save', dogs: [] };
    let list = Array.isArray(s.dogs) && s.dogs.length ? s.dogs : s.dog && typeof s.dog === 'object' ? [Object.assign({}, s.dog, s.outfit ? { outfit: s.outfit } : {})] : []; // a v1.0-v1.3 save: one dog, its outfit at the top (linkDogs)
    if (list.length > SAVE_DOGS) list = list.slice(0, SAVE_DOGS);
    const dogs = [];
    for (const d of list) { let r = null; try { r = merchRecipe(d, o); } catch (e) { r = null; } if (r && check(r).ok) dogs.push({ recipe: r, name: r.n || '', key: BREEDS[r.b], active: d.id != null && d.id === s.activeId }); }
    return { ok: dogs.length > 0, err: dogs.length ? null : 'no dogs', dogs };
  }
  // the merch page opened from the game in itch.io's frame: https://doodledoggo.app/merch/#p=<merchEncode(...)>
  function merchFromHash(hash) {
    if (typeof hash !== 'string' || hash.length > HASH_MAX + 8) return { ok: false, err: 'size', dogs: [] };
    const m = /^#?(?:.*&)?p=([A-Za-z0-9_-]+)(?:&.*)?$/.exec(hash); if (!m) return { ok: false, err: 'no p', dogs: [] };
    const r = merchDecode(m[1]); return { ok: r.ok, err: r.err || null, dogs: r.ok ? r.dogs.map((x) => ({ recipe: x, name: x.n || '', key: BREEDS[x.b] })) : [] };
  }

  return { VERSION, ART_VER, PRODUCTS, TEE_COLOURS, MIN_LINE_MM, MIN_ART_MM, FONT_THIN_EM, NAME_MIN_PX, printArt, nameFit: (t, p) => { const P = own(PRODUCTS, p); if (!P) throw new Error('product'); return nameFit(t, P); }, BREEDS, EYES, AGES, WEAR, NAME_MAX, MAX_DOGS, merchRecipe, check, artOpts, dogSVG, svg, print, printFromHash, printHash, bbox, nameSVG, textW, cleanName, nameClean: cleanName, nameOk, nameChars, geneCode, genesFrom, merchEncode, merchDecode, merchFromSave, merchFromHash, hashId };
}
if (typeof module !== 'undefined' && module.exports) module.exports = PawPrintMake;

  return PawPrintMake; })(undefined);
  var api = make(shim.PawArt, shim.PawGenes, font, names, '3f73333c');
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else G.PawPrint = api;
})(typeof self !== 'undefined' ? self : globalThis);
