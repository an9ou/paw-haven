/* Doodle Doggo world art, module E (v2.11 "Tokyo Trip", V211.md section 5.4). Loads AFTER worlds A, B, C and D.
   Wraps PawArt.scene, PawArt.prop and PawArt.item: names this module owns are drawn here, every other name goes to the previous function.
   Scenes (1000 x 600, the world C options time, weather, season, halloween, lights, newyear, jp, plus snow: true = snowy weather):
     tokyotower  Tokyo Tower from Shiba Park, the temple gate, the plaza; the tower glows at dusk and night (more with the Winter Lights). data-hot stamp, souvenir
     ueno        Shinobazu pond with lotus, swan boats and the Benten hall, two big cherry trees (pink in spring, green, momiji red in autumn, bare in
                 winter), paper lanterns at hanami; the hanami spot is a little wooden deck over the pond (behind the floor band): a picnic with
                 the bento only on a spring day, a bench with a folded blanket otherwise. data-hot stamp, hanami
     odaiba      the sand beach (ball play), the Rainbow Bridge over the bay, the city with a tiny Tokyo Tower, palms; a warm dusk. data-hot stamp, sunset
     The floor band (where the dogs' feet stand) is y 424 to 590 (odaiba 428), x 60 to 940: data-floor="y0,y1,x0,x1" on the svg (the world D order),
     PawArt.TOKYO_E { floor: { name: [y0, y1, x0, x1] }, hot }. No dogs and no place names in the art. Tall things and the spots stay out of the band's
     middle and inside the phone crop (x 150 to 850); props a dog could stand on (planters, the sandcastle, driftwood) stay out of the band.
   Props: ekistamp { key, got } 0 0 120 120 (the seven keys PawArt.STAMP_KEYS, a dashed circle when !got), luckycat { indoor, time } 0 0 80 100,
     postcard { frame: 'tokyo', w, h, scene, caption, place, date, dogs, stamp } (the Tokyo frame, w x h, default 300 x 200; PawArt.postcard(w, h, { frame: 'tokyo' })
     draws the same; every other postcard call goes to world B unchanged).
   Items (0 0 64 64): Shibuya Bandana, Asakusa Bandana, Tokyo Tower Bandana, Shinkansen Plush, Lucky Cat, Sweet Potato Strip, Dog Senbei, Stamp Book, Train Ticket, Paw.
     v2.15 (PawArt.V215_ITEMS, not in WORLD_E_ITEMS): Doggy Life Vest, Sunflower Collar, Sailor Cap, Lucky Horseshoe, Bamboo Ring, Paper Lantern, Sea Glass
     (here and not in the lazy world G, so the wardrobe, the journal and ball play always have them).
   The pencil kit, paper, palette, sky and time/weather/season helpers are copied from world C (ids prefixed pwe), the icon kit from world B (ids pwei, pwep). No filters. */
window.PawArt = window.PawArt || {};
(function(){
'use strict';
/* ===== helpers copied from world C (pawart_world_c.js), ids prefixed pwe ===== */
const PA=window.PawArt;
const C={ink:'#5B3D32',graph:'#A8968A',paper:'#FFFBF3',dot:'#E3D2BA',pink:'#F28FA5',
  sky:'#D3E9F6',sky2:'#E6F2F8',cloud:'#FFFFFF',sun:'#FDE49A',grass:'#CBE5A6',grass2:'#B4D98E',grassD:'#93C276',
  leaf:'#B9DD92',leaf2:'#9ACD7C',leafD:'#7FB86A',pine:'#8CC09A',pineD:'#6FA483',trunk:'#C9A07A',trunkD:'#A97E5A',
  wood:'#EBCDA4',woodD:'#CFA77C',roof:'#EBA48C',roofD:'#D88870',wall:'#FCE6CC',wall2:'#F9D9DE',wall3:'#D9E9F7',wall4:'#DDEFD8',
  stone:'#DED6CC',stoneD:'#C7BCAE',path:'#EFDDBA',soil:'#D9B48E',water:'#BEE0F2',waterD:'#9CCDE8',sand:'#F7E4B5',sandD:'#EBCF95',
  red:'#F4A3A3',redD:'#E57E83',yellow:'#FCE59A',orange:'#F8C08A',lav:'#DCCBF2',mint:'#C9EBDA',blue:'#B9D3F2',white:'#FFFFFF',glass:'#E4F2FA'};
let _n=0;const uid=()=>'pwe'+(++_n);
let _un=0;const unlitId=()=>'pwe0'+(++_un);// v2.6.1: its own counter, so the other scenes' ids do not shift (pwe0N never meets uid()'s pweN: no leading zero there)
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
// 25 Oct 2026: a closed outline P pulled in by dd (each point along its corner's inward normal; small shapes are pulled in less, so they never turn inside out)
// keep q inside the closed outline P: a point outside moves to the nearest point of P (the middle of its pencil line)
function pinIn(q,P){let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c}if(c)return q;
  let best=q,bd=1e18;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],ex=b[0]-a[0],ey=b[1]-a[1],L2=ex*ex+ey*ey||1,t=Math.max(0,Math.min(1,((q[0]-a[0])*ex+(q[1]-a[1])*ey)/L2)),x=a[0]+ex*t,y=a[1]+ey*t,d=(x-q[0])**2+(y-q[1])**2;if(d<bd){bd=d;best=[x,y]}}return best}
function fillIn(P,dd,G){const n=P.length;if(n<3)return P;let a=0,x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;P.forEach(p=>{x0=Math.min(x0,p[0]);x1=Math.max(x1,p[0]);y0=Math.min(y0,p[1]);y1=Math.max(y1,p[1])});
  G=G&&G.length>2?G:P;G.forEach((p,i)=>{const q=G[(i+1)%G.length];a+=p[0]*q[1]-q[0]*p[1]});const sg=a>0?1:-1;dd=Math.min(dd,Math.min(x1-x0,y1-y0)/4);// which way is in: from the drawn points G (a smooth curve can loop past a thin shape's ends)
  return P.map((p,i)=>{const A=P[(i+n-1)%n],C=P[(i+1)%n],l1=Math.hypot(p[0]-A[0],p[1]-A[1])||1,l2=Math.hypot(C[0]-p[0],C[1]-p[1])||1;
    const nx=-((p[1]-A[1])/l1+(C[1]-p[1])/l2)*sg,ny=((p[0]-A[0])/l1+(C[0]-p[0])/l2)*sg,m=Math.hypot(nx,ny)||1;return[p[0]+nx/m*dd,p[1]+ny/m*dd]})}
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
    // coloured-pencil fill. 25 Oct 2026 (owner: every colour fill stays inside its outline): it no longer drifts off (dx, dy, sc are still drawn
    // from the stream, so nothing else moves). Under a pencil outline (ins: half the line width, from shape()) it is pulled in to the line's inner edge
    // and keeps still; a fill with no outline keeps its little wobble, on the spot.
    fill(pts,col,o={},ins=0){
      const P=dense(pts,true,o.step||14);if(o.dx==null)r();if(o.dy==null)r();if(o.sc==null)r();const amp=o.amp??1.3,In=ins?fillIn(P,ins):null;let vx=0,vy=0;
      const W=P.map((q,i)=>{vx=vx*.7+J(amp*.6);vy=vy*.7+J(amp*.6);return In?In[i]:[q[0]+vx,q[1]+vy]});
      const d=smooth(W,true);out.push(`<path d="${d}" fill="${col}"${o.op!=null?` fill-opacity="${o.op}"`:''}/>`);return d;
    },
    shape(pts,col,o={}){let d=null;if(col)d=k.fill(pts,col,o,o.noline?0:(o.w||2.2)*.5);if(o.hatch)k.hatch(pts,o.hatch);if(!o.noline)k.pen(pts,true,{w:o.w,wk:o.wk,amp:o.pamp,col:o.lcol,one:o.one,op:o.lop});return d},
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
/* ---------- more helpers copied from world C ---------- */
function waterGlints(k,x,y0,y1){const e=k.env;if(e.rain)return;
  if(e.night)k.glints.push([x,y0,y1,'#FFF2B8',e.sunny?1:.45]);else if(e.low)k.glints.push([x,y0,y1,e.time==='dawn'?'#FFE7C0':'#FFD49A',e.sunny?.9:.4])}
const per=(x,amps)=>amps.reduce((s,[a,n,ph])=>s+a*Math.sin(x/1200*Math.PI*2*n+ph),0);// periodic over 1200
function duck(k,x,y,s,col){k.add(`<ellipse cx="${x}" cy="${R1(y+3*s)}" rx="${R1(22*s)}" ry="${R1(4*s)}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>`);
  k.shape([[x-16*s,y-2*s],[x-21*s,y-11*s],[x-10*s,y-8*s],[x+4*s,y-10*s],[x+14*s,y-6*s],[x+14*s,y+2*s],[x-10*s,y+3*s]],col,{w:1.8});
  k.shape(E(x+12*s,y-16*s,7*s,7*s,10),col,{w:1.7});
  k.add(`<path d="M${R1(x+18*s)} ${R1(y-17*s)}l${R1(8*s)} ${R1(2*s)} ${R1(-8*s)} ${R1(3*s)}z" fill="${C.orange}" stroke="${C.ink}" stroke-width="1.1" stroke-linejoin="round"/><circle cx="${R1(x+14*s)}" cy="${R1(y-18*s)}" r="${R1(1.3*s+.4)}" fill="${C.ink}"/>`);
  k.line([[x-8*s,y-5*s],[x+2*s,y-3*s],[x+7*s,y-7*s]],1.3)}
const wnAttrs=e=>(e.lt?' data-lights="1"':'')+(e.ny?' data-newyear="1"':'')+(e.jp?' data-jp="1"':'');// v2.8
const wnKey=e=>(e.lt?'|lt':'')+(e.ny?'|ny':'')+(e.jp?'|jp':'');
function lighten(k){const pen0=k.pen;k.pen=(pts,closed,o={})=>{if(!o.step){let L=0;const n=pts.length,m=closed?n:n-1;for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n];L+=Math.hypot(b[0]-a[0],b[1]-a[1])}if(L>260)o=Object.assign({},o,{step:L>1200?15:L>600?12:9})}return pen0(pts,closed,o)}}
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
function beamGrad(k,x0,x1){const id=uid();k.defs2.push(`<linearGradient id="${id}" x1="${x0}" y1="0" x2="${x1}" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FFF0A8" stop-opacity=".75"/><stop offset=".5" stop-color="#FFE58A" stop-opacity=".3"/><stop offset="1" stop-color="#FFE58A" stop-opacity="0"/></linearGradient>`);return id}
const fl=(k,list,s=5)=>list.forEach(f=>O.flower(k,f[0],f[1],s,f[2]));
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
function jpGlow(k,x,y,r,f=1){const L=k.env.lit;if(!L||!k.wl)return;const g=glowGrad(k,'#FFD877','jpw');wlPush(k,x,`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(r)}" fill="url(#${g})" opacity="${R1(.9*L*f)}"/>`)}
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
function nyChochin(k,x,y,s=1){k.line([[x,y],[x,y+4*s]],1,C.ink,{op:.7,amp:.1});k.shape(RC(x-5*s,y+4*s,10*s,3*s),'#3E3533',{w:.9,one:1});
  k.shape(E(x,y+17*s,8.6*s,10.4*s,14),'#FFF4E6',{w:1.2,one:1});let d='';for(let i=-2;i<=2;i++){const dy=i*3.8*s,hw=8.2*s*Math.sqrt(Math.max(0,1-Math.pow(dy/(10.4*s),2)));d+=`M${R1(x-hw)} ${R1(y+17*s+dy)}h${R1(2*hw)}`}
  k.add(`<path d="${d}" stroke="#D9B48E" stroke-width=".8"/><path d="M${R1(x-8.2*s)} ${R1(y+14.6*s)}h${R1(16.4*s)}v${R1(5*s)}h${R1(-16.4*s)}Z" fill="#E0473A" opacity=".85"/>`);
  k.shape(RC(x-4.6*s,y+26.6*s,9.2*s,2.8*s),'#3E3533',{w:.9,one:1});k.line([[x,y+29.4*s],[x+k.J(.6),y+34*s]],1,'#E0473A',{amp:.1});jpGlow(k,x,y+17*s,20*s)}
function nyChochins(k,x0,y0,x1,y1,sag,n,s=1){const P=sagP(x0,y0,x1,y1,sag,14);k.line(P,1.1,C.ink,{op:.85,amp:.3});for(let i=1;i<=n;i++){const t=i/(n+1);nyChochin(k,x0+(x1-x0)*t,y0+(y1-y0)*t+Math.sin(Math.PI*t)*sag,s)}}
function jpToro(k,x,gy,s=1){const c='#CBC4BA',cd='#A39B90';k.shape([[x-16*s,gy],[x+16*s,gy],[x+12*s,gy-8*s],[x-12*s,gy-8*s]],c,{w:1.4,one:1,hatch:{side:.6,gap:3,col:cd,op:.5}});
  k.shape(RC(x-5*s,gy-37*s,10*s,29*s),c,{w:1.4,one:1,hatch:{side:.6,gap:3,col:cd,op:.5}});k.shape([[x-14*s,gy-37*s],[x+14*s,gy-37*s],[x+11*s,gy-43*s],[x-11*s,gy-43*s]],c,{w:1.3,one:1});
  k.shape(RC(x-11*s,gy-63*s,22*s,20*s),c,{w:1.4,one:1,hatch:{side:.7,gap:3,col:cd,op:.45}});const L=k.env.lit;
  k.shape(RC(x-5*s,gy-59*s,10*s,11*s),L?'#FFD25E':'#6E665E',{w:1,one:1});
  k.shape([[x-23*s,gy-62*s],[x-17*s,gy-69*s],[x-4*s,gy-77*s],[x+4*s,gy-77*s],[x+17*s,gy-69*s],[x+23*s,gy-62*s],[x+25*s,gy-66*s],[x+20*s,gy-64*s],[x-20*s,gy-64*s],[x-25*s,gy-66*s]],c,{w:1.5,one:1,hatch:{side:.62,gap:3,col:cd,op:.55}});
  k.shape(E(x,gy-81*s,4.2*s,4.6*s,10),c,{w:1.2,one:1});k.add(`<path d="M${R1(x)} ${R1(gy-85.6*s)}v${R1(-3*s)}" stroke="${C.ink}" stroke-width="1.2" stroke-linecap="round"/><circle cx="${R1(x-6*s)}" cy="${R1(gy-20*s)}" r="${R1(1.6*s)}" fill="#9CB87A" opacity=".8"/><circle cx="${R1(x+7*s)}" cy="${R1(gy-4*s)}" r="${R1(2*s)}" fill="#9CB87A" opacity=".7"/>`);
  if(L){wlPush(k,x,`<rect x="${R1(x-5*s)}" y="${R1(gy-59*s)}" width="${R1(10*s)}" height="${R1(11*s)}" fill="#FFE9A0" opacity="${R1(.9*L)}"/>`);jpGlow(k,x,gy-53*s,30*s)}
  if(k.env.snow)capLine(k,[[x-24*s,gy-64*s],[x-4*s,gy-77*s],[x+4*s,gy-77*s],[x+24*s,gy-64*s]],5*s)}
function skFlowerD(x,y,r,a){let d='';for(let i=0;i<5;i++){const b=a+i*Math.PI*.4,c=Math.cos(b),n=Math.sin(b),P=(u,v)=>`${R1(x+u*c-v*n)} ${R1(y+u*n+v*c)}`;d+=`M${P(r*.1,0)}Q${P(r*.42,-r*.56)} ${P(r,-r*.24)}L${P(r*.78,0)}L${P(r,r*.24)}Q${P(r*.42,r*.56)} ${P(r*.1,0)}Z`}return d}
function jpBlossom(k,cx,cy,rx,ry,n,s=1){let d1='',d2='',dc='';for(let i=0;i<n;i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r()),x=cx+Math.cos(a)*rx*rr,y=cy+Math.sin(a)*ry*rr,r=(3.3+k.r()*1.6)*s,d=skFlowerD(x,y,r,k.r()*1.3);if(i%3)d1+=d;else d2+=d;dc+=`M${R1(x)} ${R1(y)}h.1`}
  k.add(`<path d="${d1}" fill="#FFF3F6" stroke="#D68CA0" stroke-width=".7"/><path d="${d2}" fill="#F7B6C8" stroke="#C97A90" stroke-width=".7"/><path d="${dc}" stroke="#E0697F" stroke-width="${R1(1.9*s)}" stroke-linecap="round"/>`)}
function jpPuffs(k,cx,cy,rx,ry,col,colD,flowers){[[-.42,.14,.6,.6],[.44,.16,.6,.58],[0,-.28,.7,.64],[-.06,.3,.5,.44]].forEach(([dx,dy,fx,fy])=>{const p=blobP(cx+dx*rx,cy+dy*ry,rx*fx,ry*fy,k.r,10,.2);k.fill(p,col);k.hatch(p,{side:.45,gap:4.5,col:colD,op:.55,w:1.2});k.pen(p,true,{w:1.7})});
  if(flowers)jpBlossom(k,cx,cy,rx*.9,ry*.85,Math.max(5,Math.round(rx*ry/75)),Math.min(1.2,Math.max(.7,rx/60)))}
function jpSakuraTree(k,x,gy,s=1){k.shape([[x-4*s,gy],[x-3*s,gy-30*s],[x+3*s,gy-30*s],[x+4.4*s,gy]],'#8A6A5A',{w:1.4,one:1});k.line([[x,gy-24*s],[x-12*s,gy-40*s]],1.6,'#6E5246');k.line([[x+1*s,gy-26*s],[x+13*s,gy-42*s]],1.6,'#6E5246');
  jpPuffs(k,x,gy-48*s,32*s,22*s,'#F9D3DE','#E9A2B8',1)}
const MOMI=['#D9462F','#E8623A','#C93A2A','#F08A3A'];
const MJ_L=[[0,1],[.66,.9],[-.66,.9],[1.3,.7],[-1.3,.7],[2.02,.42],[-2.02,.42]].sort((a,b)=>a[0]-b[0]);
function momijiAt(k,x,y,s,rot,col){const P=(a,r)=>{const b=rot-Math.PI/2+a;return R1(x+Math.cos(b)*r*s)+' '+R1(y+Math.sin(b)*r*s)},hw=.28,pts=[];
  MJ_L.forEach(([a,L],i)=>{const w=hw*(.7+L*.3);pts.push(P(a-w*1.05,.3),P(a-w*.8,.3+(L-.3)*.4),P(a-w*.94,.3+(L-.3)*.48),P(a-w*.46,.3+(L-.3)*.76),P(a-w*.56,.3+(L-.3)*.82),P(a,L),P(a+w*.56,.3+(L-.3)*.82),P(a+w*.46,.3+(L-.3)*.76),P(a+w*.94,.3+(L-.3)*.48),P(a+w*.8,.3+(L-.3)*.4))});
  pts.push(P(Math.PI,.2));const st=rot+Math.PI/2;
  k.add(`<path d="M${pts.join('L')}Z" fill="${col}" stroke="${C.ink}" stroke-width=".6" stroke-linejoin="round"/><path d="M${R1(x)} ${R1(y)}L${R1(x+Math.cos(st)*.95*s)} ${R1(y+Math.sin(st)*.95*s)}" stroke="${C.ink}" stroke-width="1" stroke-linecap="round"/>`)}
function jpMomiji(k,cx,cy,rx,ry,n,s=1){for(let i=0;i<n;i++){const a=k.r()*Math.PI*2,rr=Math.sqrt(k.r());momijiAt(k,cx+Math.cos(a)*rx*rr,cy+Math.sin(a)*ry*rr,(5+k.r()*2.6)*s,k.J(.8),MOMI[i%4])}}
function kite(k,x,y,s,c1,c2,ang=0,strTo){k.add(`<g transform="rotate(${ang} ${x} ${y})">`);const p=[[x,y-30*s],[x+20*s,y-4*s],[x,y+34*s],[x-20*s,y-4*s]];
  k.fill([[x,y-30*s],[x+20*s,y-4*s],[x,y-4*s]],c2,{dx:.5,dy:.5});k.fill([[x,y-4*s],[x-20*s,y-4*s],[x,y+34*s]],c2,{dx:.5,dy:.5});k.fill([[x,y-30*s],[x-20*s,y-4*s],[x,y-4*s]],c1,{dx:.5,dy:.5});k.fill([[x,y-4*s],[x+20*s,y-4*s],[x,y+34*s]],c1,{dx:.5,dy:.5});
  k.pen(p,true,{w:1.9});k.line([[x,y-28*s],[x,y+32*s]],1.1);k.line([[x-18*s,y-4*s],[x+18*s,y-4*s]],1.1);
  const tl=[];for(let i=0;i<=8;i++)tl.push([x+Math.sin(i*.9)*7*s,y+34*s+i*8*s]);k.line(tl,1.3);[2,5,8].forEach((i,j)=>{const q=tl[i];k.add(`<path d="M${R1(q[0]-6*s)} ${R1(q[1]-4*s)}L${R1(q[0])} ${R1(q[1])}L${R1(q[0]-6*s)} ${R1(q[1]+4*s)}ZM${R1(q[0]+6*s)} ${R1(q[1]-4*s)}L${R1(q[0])} ${R1(q[1])}L${R1(q[0]+6*s)} ${R1(q[1]+4*s)}Z" fill="${[C.pink,C.yellow,C.mint][j]}" stroke="${C.ink}" stroke-width="1"/>`)});
  k.add('</g>');if(strTo)k.line([[x,y+4*s],[(x+strTo[0])/2,(y+strTo[1])/2+30],strTo],1,C.graph,{op:.9})}
const MINE={},PROPS={},ITEMS={};
/* ===== the icon kit copied from world B (pawart_world_b.js), in its own scope, ids prefixed pwei ===== */
const WB=(function(){
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
const IDT='@PWE@';
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
  if(t.indexOf(IDT)<0)return t;const u='pwei'+(++UID).toString(36);return t.split(IDT).join(u)}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function fallback(kind,name,vb){const b=mk(kind==='house'?'house':'item','?'+name),[,,w,h]=vb.split(' ').map(Number);
  b.sh(RR(w*.2,h*.2,w*.6,h*.6,w*.08),C.grey,{hatch:0});b.tx(w/2,h*.58,'?',h*.3,{});return b.svg(vb,'',kind+' '+esc(name))}
function paw(b,x,y,s,fill,o={}){ // paw print, s = pad radius-ish
  b.sh(rot([[x-s*1.05,y+s*.55],[x-s*.8,y-s*.2],[x,y-s*.55],[x+s*.8,y-s*.2],[x+s*1.05,y+s*.55],[x,y+s*.85]],o.a||0,x,y),fill,{hatch:0,hl:0,lw:o.lw,noline:o.noline});
  [[-1.2,-1.05],[-.42,-1.6],[.42,-1.6],[1.2,-1.05]].forEach(([dx,dy])=>{const p=rot([[x+dx*s,y+dy*s]],o.a||0,x,y)[0];
    b.sh(E(p[0],p[1],s*.36,s*.44,10,(o.a||0)+dx*.25),fill,{hatch:0,hl:0,lw:o.lw?o.lw*.8:.8,noline:o.noline})});
}
/* ======================= world E items, the eki stamps, the lucky cat and the Tokyo postcard frame (world B's icon kit) ======================= */
const ST_KEYS=['shibuya','hachiko','yoyogi','asakusa','tokyotower','ueno','odaiba'];
const ST_COL={shibuya:'#3F8F6A',hachiko:'#8A5A9E',yoyogi:'#C2922A',asakusa:'#D2463A',tokyotower:'#E0713A',ueno:'#D45A8A',odaiba:'#3F78B8'};
const ST_LBL={shibuya:'Shibuya',hachiko:'Hachikō',yoyogi:'Yoyogi Park',asakusa:'Asakusa',tokyotower:'Tokyo Tower',ueno:'Ueno Park',odaiba:'Odaiba'};
// one eki stamp impression centred on (cx, cy), radius r, turned by a (radians): a double ring with two little stars, the picture, ink speckle
function stampArt(b,key,cx,cy,r,a=0){const col=ST_COL[key],c=Math.cos(a),s=Math.sin(a),U=(x,y)=>[cx+(x*c-y*s)*r,cy+(x*s+y*c)*r],UP=P=>P.map(p=>U(p[0],p[1])),w=v=>R1(Math.max(.5,v*r));
  const fillS=(P,o={})=>b.sh(UP(P),col,Object.assign({ink:col,hatch:0,hl:0,lw:Math.max(.35,r/90),base:col,dr:.3},o)),line=(P,wd=.05)=>b.ln(UP(P),{w:w(wd),col}),loop=(P,wd=.04)=>b.loop(UP(P),{w:w(wd),col});
  const circ=(x,y,rr,n=14)=>E(x,y,rr,rr,n);
  b.raw(`<circle cx="${R1(cx)}" cy="${R1(cy)}" r="${R1(r*.95)}" fill="${col}" opacity=".07"/>`,'under');
  loop(circ(0,0,.95,40),.075);loop(circ(0,0,.8,36),.03);
  [[-.875,0],[.875,0]].forEach(([x,y])=>fillS(starP(x,y,.075,.032,5,-Math.PI/2)));
  let dt='';for(let i=0;i<24;i++){const t=i/24*Math.PI*2;if(Math.abs(Math.cos(t))>.93)continue;const p=U(Math.cos(t)*.875,Math.sin(t)*.875);dt+=`<circle cx="${R1(p[0])}" cy="${R1(p[1])}" r="${R1(Math.max(.35,r*.014))}" fill="${col}"/>`}b.raw(dt);
  const raw=(P,f=col)=>b.raw(`<path d="M${UP(P).map(q=>R1(q[0])+' '+R1(q[1])).join('L')}Z" fill="${f}"/>`),bar=(x,y,l,w2,a2)=>{const c2=Math.cos(a2),s2=Math.sin(a2);raw([[x-c2*l-s2*w2,y-s2*l+c2*w2],[x+c2*l-s2*w2,y+s2*l+c2*w2],[x+c2*l+s2*w2,y+s2*l-c2*w2],[x-c2*l+s2*w2,y-s2*l-c2*w2]])};
  if(key==='shibuya'){// the scramble crossing from above (two diagonal zebras and a straight one), the station's buildings behind
    [[-.44,-.5,.18,.2],[-.22,-.64,.2,.34],[.02,-.56,.17,.26],[.22,-.48,.2,.18]].forEach(([x,y,w2,h])=>{raw([[x,y],[x+w2,y],[x+w2,y+h],[x,y+h]]);let d='';for(let yy=y+.06;yy<y+h-.03;yy+=.07)for(let xx=x+.04;xx<x+w2-.02;xx+=.06){const q=U(xx,yy);d+=`<rect x="${R1(q[0]-r*.012)}" y="${R1(q[1]-r*.012)}" width="${R1(r*.024)}" height="${R1(r*.024)}" fill="#FFFBF3"/>`}b.raw(d)});
    line([[-.62,-.29],[.62,-.29]],.03);
    for(let i=-3;i<=3;i++){const t=i*.105;bar(t*Math.SQRT1_2*1.4,.1+t*Math.SQRT1_2*1.4,.08,.022,-Math.PI/4);bar(-t*Math.SQRT1_2*1.4,.1+t*Math.SQRT1_2*1.4,.08,.022,Math.PI/4)}
    for(let i=-4;i<=4;i++)bar(i*.1,.58,.022,.07,0)}
  else if(key==='hachiko'){// the statue (like the one in the Shibuya scene): a sitting Akita on its plinth, facing left, a broad head with two
    // pricked triangle ears, a short muzzle, a deep chest, the round haunch, and the thick curled tail lying over the back; the plinth in outline
    loop([[-.44,.39],[-.4,.39],[0,.39],[.38,.39],[.42,.39],[.43,.43],[.46,.56],[.46,.6],[.42,.6],[0,.6],[-.44,.6],[-.48,.6],[-.48,.56],[-.45,.43]],.045);line([[-.36,.48],[.34,.48]],.025);
    fillS([[-.34,.37],[-.35,.14],[-.33,-.02],[-.24,-.12],[-.06,-.15],[.1,-.11],[.22,-.02],[.31,.13],[.33,.29],[.29,.37]]);
    fillS([[-.1,-.16],[-.07,-.28],[-.13,-.37],[-.24,-.41],[-.34,-.39],[-.42,-.33],[-.52,-.29],[-.56,-.22],[-.52,-.15],[-.4,-.12],[-.28,-.09],[-.16,-.1]]);
    fillS([[-.4,-.35],[-.36,-.53],[-.25,-.4]]);fillS([[-.21,-.41],[-.13,-.55],[-.08,-.34]]);
    loop(E(.13,-.21,.11,.095,14),.09);fillS([[.04,-.13],[.1,-.21],[.2,-.13],[.14,-.08]]);
    b.ln(UP([[-.2,.36],[-.21,.12]]),{w:w(.025),col:'#FFFBF3'});b.ln(UP([[.04,.36],[.06,.2],[.15,.08],[.26,.1]]),{w:w(.022),col:'#FFFBF3'});
    b.ln(UP([[-.33,-.1],[-.2,-.15]]),{w:w(.03),col:'#FFFBF3'});b.ln(UP([[-.55,-.2],[-.46,-.19]]),{w:w(.018),col:'#FFFBF3'});
    b.dot(...U(-.38,-.29),Math.max(.6,r*.024),'#FFFBF3','top');
    line([[-.64,.22],[-.54,.26]],.02);line([[.52,.2],[.64,.24]],.02)}
  else if(key==='yoyogi'){// a big ginkgo leaf, a ball, the dog run's fence
    const fan=[[0,.14]];for(let i=0;i<=12;i++){const t=Math.PI*(1.08+i/12*.84),rr=i===6?.42:.6;fan.push([Math.cos(t)*rr,.14+Math.sin(t)*rr])}fillS(fan);
    let vn=[];for(let i=1;i<6;i++){const t=Math.PI*(1.1+i/6*.8);vn.push([[0,.12],[Math.cos(t)*.5,.14+Math.sin(t)*.5]])}vn.forEach(v=>b.ln(UP(v),{w:w(.02),col:'#FFFBF3'}));
    line([[0,.12],[.04,.36]],.06);
    // a solid tennis ball with its two curved seams in paper (not a ring with a bar, which read as a "no" sign)
    fillS(circ(.42,.32,.12,16));b.ln(UP([[.33,.23],[.38,.28],[.39,.35],[.34,.41]]),{w:w(.022),col:'#FFFBF3'});b.ln(UP([[.51,.23],[.46,.28],[.45,.35],[.5,.41]]),{w:w(.022),col:'#FFFBF3'});
    let fx=[];for(let x=-.6;x<=.0;x+=.12)fx.push([[x,.36],[x,.56]]);fx.forEach(v=>line(v,.04));line([[-.64,.42],[.06,.42]],.03);line([[-.64,.52],[.06,.52]],.03)}
  else if(key==='asakusa'){// the great lantern under the gate roof
    fillS([[-.62,-.38],[-.48,-.5],[.48,-.5],[.62,-.38],[.5,-.42],[-.5,-.42]]);line([[-.56,-.36],[.56,-.36]],.04);
    const ln=E(0,.06,.36,.36,20).map(([x,y])=>[x,y]);loop(ln,.06);fillS([[-.22,-.36],[.22,-.36],[.2,-.28],[-.2,-.28]]);fillS([[-.22,.42],[.22,.42],[.2,.5],[-.2,.5]]);
    [-.2,-.08,.04,.16,.28].forEach(y=>{const hw=Math.sqrt(Math.max(0,.13-Math.pow(y-.06,2)));line([[-hw,y],[hw,y]],.02)});
    fillS([[-.24,0],[.24,0],[.25,.1],[-.25,.1]]);line([[-.66,-.36],[-.66,.5]],.05);line([[.66,-.36],[.66,.5]],.05)}
  else if(key==='tokyotower'){// the tower: the legs, the lattice, two decks, the antenna, two stars
    line([[-.34,.6],[-.12,.0],[-.05,-.3],[-.02,-.5],[0,-.7]],.05);line([[.34,.6],[.12,.0],[.05,-.3],[.02,-.5],[0,-.7]],.05);
    let lt='';[[.6,.34],[.34,.26],[.18,.19],[0,.12]].forEach(([y,hw],i,A)=>{if(i<A.length-1){const n=A[i+1];const P1=U(-hw,y),P2=U(n[1],n[0]),P3=U(hw,y),P4=U(-n[1],n[0]);lt+=`M${R1(P1[0])} ${R1(P1[1])}L${R1(P2[0])} ${R1(P2[1])}M${R1(P3[0])} ${R1(P3[1])}L${R1(P4[0])} ${R1(P4[1])}M${R1(P4[0])} ${R1(P4[1])}L${R1(P2[0])} ${R1(P2[1])}`}});
    b.raw(`<path d="${lt}" fill="none" stroke="${col}" stroke-width="${w(.022)}" stroke-linecap="round"/>`);
    fillS([[-.2,-.02],[.2,-.02],[.2,.06],[-.2,.06]]);fillS([[-.09,-.36],[.09,-.36],[.09,-.3],[-.09,-.3]]);line([[-.5,.6],[.5,.6]],.04);
    [[-.44,-.42],[.46,-.3],[.36,-.58]].forEach(([x,y],i)=>fillS(starP(x,y,i?.06:.08,i?.026:.034,5)))}
  else if(key==='ueno'){// a sakura flower, a little panda peeking, pond waves
    const fl=[];for(let i=0;i<40;i++){const t=i/40*Math.PI*2,k=.62+.38*Math.abs(Math.cos(t*2.5)),nt=Math.abs(Math.cos(t*2.5))>.96?.84:1;fl.push([-.24+Math.cos(t-Math.PI/2)*.34*k*nt,-.2+Math.sin(t-Math.PI/2)*.34*k*nt])}loop(fl,.045);
    b.dot(...U(-.24,-.2),Math.max(.8,r*.05),col);for(let i=0;i<5;i++){const t=i/5*Math.PI*2-Math.PI/2;line([[-.24,-.2],[-.24+Math.cos(t)*.14,-.2+Math.sin(t)*.14]],.02)}
    loop(circ(.3,.12,.22,16),.045);fillS(circ(.15,-.06,.08,10));fillS(circ(.45,-.06,.08,10));fillS(E(.22,.1,.06,.045,10,.5));fillS(E(.38,.1,.06,.045,10,-.5));b.dot(...U(.3,.2),Math.max(.6,r*.025),col);
    line([[-.6,.44],[-.44,.38],[-.28,.44],[-.12,.38],[.04,.44],[.2,.38],[.36,.44],[.52,.38],[.62,.42]],.035);line([[-.44,.56],[-.28,.5],[-.12,.56],[.04,.5],[.2,.56],[.36,.5]],.03)}
  else{// odaiba: the bridge over the bay, the setting sun
    const sun=[];for(let i=0;i<=14;i++){const t=Math.PI+i/14*Math.PI;sun.push([Math.cos(t)*.24,.06+Math.sin(t)*.24])}fillS(sun.concat([[.24,.06],[-.24,.06]]),{base:mix(col,'#FFFFFF',.55)});
    [-.34,.34].forEach(x=>{line([[x-.05,.2],[x-.04,-.42]],.05);line([[x+.05,.2],[x+.04,-.42]],.05);line([[x-.07,-.36],[x+.07,-.36]],.03);line([[x-.07,-.1],[x+.07,-.1]],.03)});
    const cb=[];for(let i=0;i<=16;i++){const x=-.34+i/16*.68;cb.push([x,-.4+Math.sin(Math.PI*i/16)*.34])}line(cb,.03);line([[-.72,.06],[-.34,-.4]],.03);line([[.72,.06],[.34,-.4]],.03);
    fillS([[-.76,.14],[.76,.14],[.76,.2],[-.76,.2]]);let hg='';cb.forEach(([x,y],i)=>{if(i%2===0&&i&&i<16){const p=U(x,y),q=U(x,.14);hg+=`M${R1(p[0])} ${R1(p[1])}L${R1(q[0])} ${R1(q[1])}`}});b.raw(`<path d="${hg}" stroke="${col}" stroke-width="${w(.016)}"/>`);
    line([[-.6,.36],[-.44,.3],[-.28,.36],[-.12,.3],[.04,.36],[.2,.3],[.36,.36],[.52,.3],[.64,.34]],.035);line([[-.46,.5],[-.3,.44],[-.14,.5],[.02,.44],[.18,.5],[.34,.44]],.03)}
  // ink speckle: the paper shows through here and there, like a real rubber stamp
  let sp='';const rr=rng(hashS('spk'+key+R1(r)));for(let i=0;i<Math.round(r*.9);i++){const t=rr()*Math.PI*2,d=Math.sqrt(rr())*.96;sp+=`<circle cx="${R1(cx+Math.cos(t)*d*r)}" cy="${R1(cy+Math.sin(t)*d*r)}" r="${R1(Math.max(.3,r*(.008+rr()*.012)))}" fill="#FFFBF3" opacity=".8"/>`}b.raw(sp,'top')}
function stampEmpty(b,cx,cy,r){b.raw(`<circle cx="${cx}" cy="${cy}" r="${R1(r*.95)}" fill="none" stroke="${GRAPH}" stroke-width="2.2" stroke-dasharray="7 6" stroke-linecap="round" opacity=".55"/><circle cx="${cx}" cy="${cy}" r="${R1(r*.8)}" fill="none" stroke="${GRAPH}" stroke-width="1" stroke-dasharray="3 5" stroke-linecap="round" opacity=".4"/>`);
  paw(b,cx,cy+r*.06,r*.13,'#EFE6DA',{lw:.5,noline:1})}
// the maneki-neko on a red cushion: white, calico patches, the raised left paw, a red collar with a gold bell and a gold coin
function luckyCat(b,o){
  b.shadow(40,94,30,4);
  // the cushion (zabuton) with gold tassels
  b.sh([[8,84],[14,74],[66,74],[72,84],[66,94],[14,94]],'#E04A3C',{k:.2,sh:'#B5322A',base:'#F28A80'});b.ln([[16,84],[64,84]],{w:.8,col:'#B5322A',op:.7});
  [[10,75],[70,75],[10,93],[70,93]].forEach(([x,y])=>b.sh(E(x,y,3,3,8),C.gold,{hatch:0,hl:0,lw:.6}));
  // the body, the right paw holding the coin, the tail
  b.sh([[18,80],[17,62],[22,48],[40,44],[58,48],[63,62],[62,80],[40,84]],'#FFFFFF',{base:'#FFFDF8',sh:'#C9C2BA',marks:[{pts:E(55,58,7,9,12,.3),fill:'#F2B27A',op:.9},{pts:E(24,72,5,4,10),fill:'#5E5A66',op:.8}]});
  b.sh(E(48,70,10,7,14),C.gold,{hatch:0,base:'#FFF0B0',sh:C.goldD,det:[[[42,68],[54,68]],[[42,72],[54,72]]],dw:.6});
  b.sh(E(52,64,6,5,10),'#FFFFFF',{hatch:0,hl:0,lw:.8});
  b.sh([[62,78],[70,74],[72,66],[68,64],[66,72],[61,74]],'#FFFFFF',{hatch:0,hl:0,lw:.8});
  // the raised left paw (beckoning)
  // the head with ears, face and whiskers
  b.sh([[18,30],[22,14],[28,20],[40,18],[52,20],[58,14],[62,30],[60,40],[40,46],[20,40]],'#FFFFFF',{base:'#FFFDF8',sh:'#C9C2BA',marks:[{pts:[[48,20],[58,14],[60,26],[52,24]],fill:'#5E5A66',op:.85}]});
  b.sh([[24,22],[23,17],[27,21]],'#F7B2C4',{hatch:0,hl:0,lw:.4});b.sh([[56,22],[57,17],[53,21]],'#F7B2C4',{hatch:0,hl:0,lw:.4});
  b.raw(b.st('M30 30q3 -3 6 0M44 30q3 -3 6 0',INK,1.4),'top');
  b.sh([[38,34],[42,34],[40,36.4]],'#F28FA5',{hatch:0,hl:0,lw:.4});b.raw(b.st('M40 36.4q-2 3 -5 2M40 36.4q2 3 5 2',INK,1),'top');
  b.raw(`<ellipse cx="29" cy="36" rx="3" ry="1.8" fill="${PINK}" opacity=".55"/><ellipse cx="51" cy="36" rx="3" ry="1.8" fill="${PINK}" opacity=".55"/>`,'top');
  [[28,35,18,33],[28,37,18,38],[52,35,62,33],[52,37,62,38]].forEach(q=>b.ln([[q[0],q[1]],[q[2],q[3]]],{w:.6,col:GRAPH}));
  b.sh([[22,54],[12,44],[6,30],[6,16],[12,12],[17,16],[17,30],[24,44]],'#FFFFFF',{hatch:0,base:'#FFFDF8',sh:'#C9C2BA'});
  b.sh(E(11,14,6,5.4,10),'#FFFFFF',{hatch:0,hl:0,lw:.8});[[8,10.4],[11,9.4],[14,10.4]].forEach(([x,y])=>b.ln([[x,y],[x,y+3]],{w:.6}));b.sh(E(11,16,2.2,1.7,8),'#F7B2C4',{hatch:0,hl:0,lw:.3});
  // the collar and the bell
  b.sh([[22,44],[40,48],[58,44],[58,49],[40,53],[22,49]],'#E04A3C',{hatch:0,hl:0,lw:.7});
  b.sh(E(40,54,4.4,4.4,12),C.gold,{hatch:0,hl:0,lw:.7,det:[[[37,54],[43,54]]],dw:.5});
  if(o.indoor)b.ex('spark',70,20,4,'#FFF3B8');else b.ex('spark',8,58,3.4,'#FFF3B8');
  b.ex('spark',66,40,3,'#FFF3B8')}

const ITEMS_E={
 'Shibuya Bandana'(b){const G='#7FB86A',GD='#5E9446';
  b.sh([[3,12],[8,16],[3,19]],GD,{k:0,hatch:0,hl:0,lw:.7});b.sh([[61,12],[56,16],[61,19]],GD,{k:0,hatch:0,hl:0,lw:.7});
  let st='';for(let i=0;i<5;i++){st+=`<path d="M${14+i*4.2} ${22+i*4.6}l3 -2.4l3.6 4l-3 2.4z" fill="#fff"/><path d="M${50-i*4.2} ${22+i*4.6}l-3 -2.4l-3.6 4l3 2.4z" fill="#fff"/>`}
  b.sh([[6,15],[58,15],[32,57]],G,{k:.05,sh:GD,marks:[{pts:[[0,10],[64,10],[64,21],[0,21]],fill:GD,k:0,op:.55}],inner:st+`<path d="M9 19.5H55" stroke="#fff" stroke-width="1" stroke-dasharray="2.4 2"/>`});
  b.ex('spark',54,40,3.4)},
 'Asakusa Bandana'(b){const R='#E8584E',RD='#C23F38';
  b.sh([[3,12],[8,16],[3,19]],RD,{k:0,hatch:0,hl:0,lw:.7});b.sh([[61,12],[56,16],[61,19]],RD,{k:0,hatch:0,hl:0,lw:.7});
  b.sh([[6,15],[58,15],[32,57]],R,{k:.05,sh:RD,marks:[{pts:[[0,10],[64,10],[64,21],[0,21]],fill:RD,k:0,op:.55}],inner:`<path d="M9 19.5H55" stroke="#fff" stroke-width="1" stroke-dasharray="2.4 2"/>`+[[16,26],[48,26]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.6" fill="#FFE08A"/>`).join('')});
  // the tiny lantern
  b.sh([[27,27.5],[37,27.5],[36,29.5],[28,29.5]],'#3E3533',{k:0,hatch:0,hl:0,lw:.5});
  b.sh(E(32,36,7.4,7,14),'#FFF4E6',{hatch:0,hl:0,lw:.75});b.raw(b.st('M25.6 33.4h12.8M25 36h14M25.6 38.6h12.8',RD,.7),'top');b.sh([[27,42.5],[37,42.5],[36,44.5],[28,44.5]],'#3E3533',{k:0,hatch:0,hl:0,lw:.5})},
 'Tokyo Tower Bandana'(b){const O1='#F59A5E',OD='#D9773E';
  b.sh([[3,12],[8,16],[3,19]],OD,{k:0,hatch:0,hl:0,lw:.7});b.sh([[61,12],[56,16],[61,19]],OD,{k:0,hatch:0,hl:0,lw:.7});
  b.sh([[6,15],[58,15],[32,57]],O1,{k:.05,sh:OD,marks:[{pts:[[0,26],[64,26],[64,33],[0,33]],fill:'#FFFFFF',k:0},{pts:[[0,40],[64,40],[64,46],[0,46]],fill:'#FFFFFF',k:0},{pts:[[0,10],[64,10],[64,21],[0,21]],fill:OD,k:0,op:.55}],
   inner:`<path d="M9 19.5H55" stroke="#fff" stroke-width="1" stroke-dasharray="2.4 2"/><path d="M28 36.5q2.6 -5 3 -9.5M36 36.5q-2.6 -5 -3 -9.5M32 24.6v-4" fill="none" stroke="${OD}" stroke-width="1.2" stroke-linecap="round"/><rect x="29.4" y="26.4" width="5.2" height="1.8" fill="#FFF" stroke="${OD}" stroke-width=".8"/>`});
  b.ex('spark',52,40,3)},
 'Shinkansen Plush'(b){
  b.shadow(31,55,26,3.4);
  b.sh([[5,50],[5,30],[10,24],[30,22],[44,24],[56,32],[62,44],[60,50]],'#FFFFFF',{base:'#FFFDF8',sh:'#B9C6D4',marks:[{pts:[[0,40],[64,40],[64,45],[0,45]],fill:'#5C8FD6',k:0}],
   post:`<path d="${cr([[8,48],[8,31],[12,27],[30,25.5],[43,27],[53,34],[58,45]],false).d}" fill="none" stroke="${INK}" stroke-width=".8" stroke-dasharray="2 2" stroke-opacity=".6"/>`});
  b.sh([[40,27],[50,31],[54,37],[44,36]],'#9CC7EE',{hatch:0,hl:0,lw:.7});
  [[12,30],[21,30],[30,30]].forEach(([x,y])=>b.sh(RR(x,y,6,5,1.4),'#BFE6FA',{hatch:0,hl:0,lw:.55}));
  b.dot(46,40.6,1.4);b.raw(b.st('M49.5 43q2 1.6 4 0',INK,1),'top');b.raw(`<ellipse cx="54" cy="40" rx="2.2" ry="1.3" fill="${PINK}" opacity=".6"/>`,'top');
  [[14,52],[44,52]].forEach(([x,y])=>b.sh(E(x,y,4,4,10),'#8E96A3',{hatch:0,hl:0,lw:.7}));
  b.ex('heart',55,14,3)},
 'Lucky Cat'(b){
  b.shadow(32,58,18,2.6);
  b.sh([[14,56],[13,40],[18,32],[32,30],[46,32],[51,40],[50,56],[32,59]],'#FFFFFF',{base:'#FFFDF8',sh:'#C9C2BA',marks:[{pts:E(44,44,5,6,10),fill:'#F2B27A',op:.9}]});
  b.sh(E(37,49,7,5,12),C.gold,{hatch:0,hl:0,lw:.7,base:'#FFF0B0',det:[[[33,48],[41,48]]],dw:.5});
  b.sh([[13,18],[16,6],[21,12],[32,10],[43,12],[48,6],[51,18],[50,26],[32,31],[14,26]],'#FFFFFF',{base:'#FFFDF8',sh:'#C9C2BA',marks:[{pts:[[40,12],[48,6],[50,16],[44,15]],fill:'#5E5A66',op:.85}]});
  b.raw(b.st('M22 18.5q2.4 -2.4 4.8 0M37.2 18.5q2.4 -2.4 4.8 0M32 23q-1.6 2.2 -3.6 1.4M32 23q1.6 2.2 3.6 1.4',INK,1.2),'top');
  b.sh([[15,34],[7,26],[4,16],[5,8],[10,5],[14,9],[14,18],[18,28]],'#FFFFFF',{hatch:0,hl:0,lw:.85});b.sh(E(9,8,4.4,4,10),'#FFFFFF',{hatch:0,hl:0,lw:.7});b.sh(E(9,9.4,1.6,1.3,8),'#F7B2C4',{hatch:0,hl:0,lw:.3});
  b.raw(`<ellipse cx="22" cy="23" rx="2.4" ry="1.4" fill="${PINK}" opacity=".55"/><ellipse cx="42" cy="23" rx="2.4" ry="1.4" fill="${PINK}" opacity=".55"/>`,'top');
  b.sh([[15,29],[32,33],[49,29],[49,33],[32,37],[15,33]],'#E04A3C',{hatch:0,hl:0,lw:.6});b.sh(E(32,37.5,3.2,3.2,10),C.gold,{hatch:0,hl:0,lw:.6});
  b.ex('spark',56,16,3.6,'#FFF3B8')},
 'Sweet Potato Strip'(b){
  [[18,14,-.5],[30,10,-.2],[42,14,.25]].forEach(([x,y,a],i)=>{const P=rot([[x-5,y],[x+5,y],[x+6,y+40],[x-6,y+40]],a,x,y+20);
   b.sh(P,'#F7C65E',{k:.25,sh:'#D9A03A',base:'#FCE29A',marks:[{pts:rot([[x-6.5,y-1],[x-3.6,y-1],[x-4.4,y+41],[x-7.4,y+41]],a,x,y+20),fill:'#9B5B86',k:0}],
    inner:b.st(b.jl(x-1,y+8,x+1,y+30,.6)+b.jl(x+2,y+12,x+2.4,y+24,.4),'#E3A84A',.9,.8)})});
  b.ex('spark',54,50,3.6);b.ex('heart',9,52,2.6)},
 'Dog Senbei'(b){
  b.shadow(32,56,22,3);
  b.sh(E(32,33,23,22,24),'#F3D9A4',{sh:'#D9B06E',base:'#FBEBC6',inner:b.st(b.jl(16,26,48,22,.6)+b.jl(14,36,50,32,.6)+b.jl(18,45,46,42,.6),'#D9B06E',1.6,.8)});
  b.loop(E(32,33,19,18,20),{w:.8,op:.6});
  paw(b,32,35,4.6,'#C99A5E',{lw:.5});
  [[20,22],[45,26],[42,46],[22,44],[30,18]].forEach(([x,y])=>b.dot(x,y,.9,'#C99A5E'));
  b.ex('spark',55,12,3.6)},
 'Stamp Book'(b){
  b.shadow(32,58,22,3);
  b.sh([[13,9],[49,7],[52,55],[16,57]],'#7FA9D8',{k:.05,sh:'#5E86B8',base:'#B9D4F3'});
  b.sh([[12,9],[17,9],[20,57],[15,57]],'#5E86B8',{k:0,hatch:0,hl:0,lw:.7});
  b.sh([[45,7],[49,7],[50,26],[47.4,23],[45,27]],'#E04A3C',{k:0,hatch:0,hl:0,lw:.6});
  b.sh(E(34,30,11,11,20),'#FFFBF3',{hatch:0,hl:0,lw:.6});stampArt(b,'tokyotower',34,30,10.4,-.12);
  [[22,46,'#3F8F6A'],[30,47,'#D2463A'],[38,46,'#D45A8A']].forEach(([x,y,c])=>b.raw(`<circle cx="${x}" cy="${y}" r="3.2" fill="none" stroke="${c}" stroke-width="1.3"/>`,'top'));
  b.ex('spark',56,14,3.4)},
 'Train Ticket'(b){
  b.sh(rot(RR(6,18,52,30,3),-.12,32,33),'#CFEBD9',{k:.05,sh:'#8FC4A6',base:'#E8F6EE'});
  b.raw(b.st(rot([[10,26],[54,26]],-.12,32,33).map((p,i)=>(i?'L':'M')+R1(p[0])+' '+R1(p[1])).join(''),'#8FC4A6',1,.9),'top');
  // a tiny Shinkansen nose and a dashed track
  const nose=rot([[14,38],[14,31],[26,30],[36,33],[40,38]],-.12,32,33);b.sh(nose,'#FFFFFF',{hatch:0,hl:0,lw:.6,marks:[{pts:rot([[0,35.5],[64,35.5],[64,37.4],[0,37.4]],-.12,32,33),fill:'#5C8FD6',k:0}]});
  b.raw(b.st(rot([[12,42],[50,42]],-.12,32,33).map((p,i)=>(i?'L':'M')+R1(p[0])+' '+R1(p[1])).join(''),INK,1,.7).replace('/>',' stroke-dasharray="3 2.4"/>'),'top');
  const h=rot([[50,30]],-.12,32,33)[0];b.raw(`<circle cx="${R1(h[0])}" cy="${R1(h[1])}" r="2.6" fill="#FFFBF3" stroke="${INK}" stroke-width=".8"/>`,'top');
  const st=rot([[47,40]],-.12,32,33)[0];b.raw(`<circle cx="${R1(st[0])}" cy="${R1(st[1])}" r="4.6" fill="none" stroke="#D2463A" stroke-width="1.2" opacity=".85"/>`,'top');
  b.ex('spark',56,12,3.4)},
 'Paw'(b){paw(b,32,36,11,'#F7A1B5',{lw:1});b.ex('heart',52,14,4,'#F9B2C2');b.ex('spark',12,14,3.6)}
};
/* v2.15 Around Town (V215.md 6.2, 6.3): the Doggy Life Vest and the six run-track treasures. They live here, in an art world that loads with
   the game, because world G (the new places) is a lazy chunk and the wardrobe and the journal show these at any time. Kept out of ITEMS_E and
   WORLD_E_ITEMS (the Tokyo list stays as it was); the treasures wear world B's golden sparkles, the Sunflower Collar the Clover Collar's gold ink. */
const GINK215='#A5741F',NAVY215='#3E5A9A',gold215=(b,list)=>list.forEach(([x,y,s])=>b.ex('spark',x,y,s,'#FFE07A'));
const ringD=(cx,cy,rx,ry,n,rev)=>{const p=E(cx,cy,rx,ry,n);return cr(rev?p.reverse():p,true).d};
const ITEMS_V215={
 'Doggy Life Vest'(b){const OR='#F8A95E',OD='#D9772E';
  b.sh(ribbon([[25,11],[27,4],[37,4],[39,11]],[3.4,3.4,3.4,3.4]),NAVY215,{k:.2,hatch:0,hl:0,lw:.7});
  b.sh([[17,9],[26,8],[32,23],[38,8],[47,9],[51,17],[54,31],[54,55],[32,59],[10,55],[10,31],[13,17]],OR,{k:.08,sh:OD,
   marks:[{pts:[[0,51],[64,51],[64,62],[0,62]],fill:'#FFE07A',k:0}],
   inner:b.st(b.jl(20,14,19,50,.4)+b.jl(44,14,45,50,.4),OD,1,.7),det:[[[32,24],[32,58]]],dw:.9});
  b.sh([[19,10],[26,9],[32,23]],'#FFFBF3',{k:0,hatch:0,hl:0,lw:.6});b.sh([[45,10],[38,9],[32,23]],'#FFFBF3',{k:0,hatch:0,hl:0,lw:.6});
  [[14,25],[39,25]].forEach(([x,y])=>b.sh(RR(x,y,11,3.2,1.4),'#FFFFFF',{hatch:0,hl:0,lw:.5}));
  [35,44].forEach(y=>{b.sh(RR(9.5,y,45,5,1.6),NAVY215,{k:.05,hatch:0,hl:0,lw:.7});b.sh(RR(27.5,y-1.6,9,8.2,1.4),'#FFE07A',{hatch:0,hl:0,lw:.7,det:[[[32,y],[32,y+5]]],dw:.5})});
  b.ex('spark',57,10,3.4);b.ex('dots',6,12,4)},
 'Sunflower Collar'(b){
  b.sh(ribbon([[7,22],[18,14],[32,12],[46,14],[57,22]],[4.5,4.5,4.5,4.5,4.5]),'#6FB06A',{hatch:0,hl:0,lw:.8,ink:GINK215});
  b.sh(ribbon([[6,21],[13,31],[32,37],[51,31],[58,21]],[8.5,8.5,8.5,8.5,8.5]),'#94D58E',{ink:GINK215,sh:'#5E9A58'});
  [[15,32],[49,32]].forEach(([x,y],i)=>b.sh(leafP(x,y,6.5,3.6,i?-.5:Math.PI+.5),'#6FB06A',{hatch:0,hl:0,lw:.5,ink:GINK215,dr:.1}));
  b.sh(leafP(31,49,15,7,2.5),C.leafD,{hatch:0,hl:0,lw:.6,det:[[[30,50],[19,55]]],dw:.45});
  b.sh(flowerP(33,46,13.5,11,.2),'#FFD84D',{sh:'#E9B44C',hl:0,lw:.8,dr:.3});
  b.sh(E(33,46,5.4,5.2,14),'#A8683A',{hatch:0,hl:0,lw:.6,dr:.1});[[31.4,44.6],[34.6,45],[32.6,47.8],[35,47.6],[31,47.4]].forEach(([x,y])=>b.dot(x,y,.7,'#6E3F1C'));
  gold215(b,[[55,46,4.6],[9,46,3.8],[48,6,3.2]]);b.ex('glint',27,41,3)},
 'Sailor Cap'(b){
  b.sh(ribbon([[15,40],[10,49],[12,58]],[5,5,4.4]),NAVY215,{k:1/6,hatch:0,hl:0,lw:.7});b.sh(ribbon([[19,41],[18,50],[22,59]],[5,5,4.4]),NAVY215,{k:1/6,hatch:0,hl:0,lw:.7});
  b.sh([[11,40],[10,27],[16,17],[32,12],[48,17],[54,27],[53,40]],'#FFFFFF',{k:.16,base:'#fff',sh:'#B9C3D6',ho:.4,hlo:.6,
   inner:b.st('M18 33q3 -9 9 -15M30 33q1 -10 2 -18',GRAPH,1,.55)});
  b.sh([[9,35],[55,35],[55,46],[9,46]],NAVY215,{k:.05,hatch:0,hl:0,lw:.8,det:[[[11,43],[53,43]]],dw:.55,dcol:'#FFFFFF'});
  b.raw(b.st('M36 36.6v6.2M33.2 38.8h5.6M33 41q3 3 6 0',C.gold,1.4),'top');
  b.sh(E(32,12.5,3.4,2.2,10),NAVY215,{hatch:0,hl:0,lw:.6});
  gold215(b,[[57,14,4.4],[6,16,3.4]]);b.ex('glint',22,24,3.4)},
 'Lucky Horseshoe'(b){const ST='#C9CFD8',SD='#8E97A6',arc=[];for(let i=0;i<=10;i++){const a=(-18+i*21.6)*Math.PI/180;arc.push([32+Math.cos(a)*18,30+Math.sin(a)*19])}
  b.shadow(32,57,18,2.6);
  b.sh(ribbon(arc,arc.map(()=>9.5)),ST,{k:1/6,sh:SD,base:'#EEF1F5',ho:.5});
  arc.forEach((p,i)=>{if(i%2===0&&i>0&&i<10&&i!==4&&i!==6)b.sh(RR(p[0]-1.6,p[1]-1.1,3.2,2.2,.6),'#6E7886',{hatch:0,hl:0,lw:.35,dr:.05})});
  b.loop(arc.map(([x,y])=>[32+(x-32)*.82,30+(y-30)*.84]).slice(1,10),{w:.7,op:.45});
  for(let k=0;k<3;k++)b.sh(rot(heartP(51,12.4,7,16),k*Math.PI*2/3,51,16),k%2?'#86CF7F':'#7AC373',{lw:.55,hatch:0,hl:0,dr:.2});b.ln([[51,16],[53,23]],{w:1,col:'#5E9A58'});
  gold215(b,[[9,10,4.6],[58,40,3.6],[7,44,3]]);b.ex('glint',18,40,3.4)},
 'Bamboo Ring'(b){const G='#B8DE9A',GD='#7FB86A',cx=32,cy=34,ox=24,oy=21.5,ix=14.5,iy=12;
  b.shadow(32,58,22,2.6);
  b.raw(`<path d="${ringD(cx+1,cy+.8,ox,oy,28)}${ringD(cx+1,cy+.8,ix,iy,24,1)}" fill="${G}" fill-rule="evenodd"/>`);
  let hs='';for(let i=0;i<14;i++){const a=(20+i*7)*Math.PI/180;hs+=b.jl(cx+Math.cos(a)*(ix+1.5),cy+Math.sin(a)*(iy+1.5),cx+Math.cos(a)*(ox-1.2),cy+Math.sin(a)*(oy-1.2),.4)}
  b.raw(b.st(hs,GD,.9,.5));
  b.raw(`<path d="M${R1(cx-ox*.82)} ${R1(cy-oy*.36)}Q${R1(cx-ox*.6)} ${R1(cy-oy*.86)} ${R1(cx-ox*.1)} ${R1(cy-oy*.92)}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/>`);
  b.loop(E(cx,cy,ox,oy,28),{w:2});b.loop(E(cx,cy,ix,iy,22),{w:1.6});
  [-70,-10,50,110,170,230].forEach(d=>{const a=d*Math.PI/180,c=Math.cos(a),s=Math.sin(a);b.ln([[cx+c*(ix-.6),cy+s*(iy-.6)],[cx+c*(ox+.8),cy+s*(oy+.8)]],{w:1.3,col:'#5E8F4E'});
   b.ln([[cx+c*(ix+1)+s*1.6,cy+s*(iy+1)-c*1.6],[cx+c*(ox-.8)+s*1.6,cy+s*(oy-.8)-c*1.6]],{w:.7,col:'#FFFFFF',op:.7})});
  {const a=-70*Math.PI/180,x=cx+Math.cos(a)*ox,y=cy+Math.sin(a)*oy;b.ln([[x,y],[x+5,y-6]],{w:1.1,col:'#5E8F4E'});
   b.sh(leafP(x+4,y-5,13,5.4,-.35),C.leaf,{hatch:0,hl:0,lw:.6,det:[[[x+5,y-5.4],[x+15,y-9.6]]],dw:.4});b.sh(leafP(x+4,y-5,10,4.4,-1.35),C.leafD,{hatch:0,hl:0,lw:.6})}
  {const a=172*Math.PI/180,x=cx+Math.cos(a)*(ox+ix)/2,y=cy+Math.sin(a)*(oy+iy)/2;b.sh(RR(x-6.4,y-3.4,12.8,6.8,2),'#E8C597',{hatch:0,hl:0,lw:.6,det:[[[x-3,y-3],[x-3,y+3]],[[x,y-3],[x,y+3]],[[x+3,y-3],[x+3,y+3]]],dw:.45})}
  gold215(b,[[57,52,4],[7,12,3.4]]);b.ex('spark',58,14,3,'#FFFFFF')},
 'Paper Lantern'(b){const RD='#E8584E';
  b.raw('<ellipse cx="32" cy="33" rx="29" ry="27" fill="#FFF1B8" opacity=".5"/><ellipse cx="32" cy="33" rx="21" ry="21" fill="#FFE9A0" opacity=".45"/>','under');
  b.ln([[32,1.5],[32,9]],{w:1.1});
  b.sh(RR(23.5,8,17,5,1.6),'#3E3533',{hatch:0,hl:0,lw:.6});
  let rb='';for(let i=-3;i<=3;i++){const y=33+i*5,hw=17.4*Math.sqrt(Math.max(0,1-Math.pow((y-33)/20,2)));rb+=`M${R1(32-hw)} ${y}Q32 ${R1(y+2)} ${R1(32+hw)} ${y}`}
  b.sh(E(32,33,17.5,20,26),'#FFF0D2',{base:'#FFFBF0',sh:'#E9B44C',ho:.35,hlo:.55,
   marks:[{pts:[[0,28.5],[64,28.5],[64,38],[0,38]],fill:RD,k:0,op:.9}],inner:b.st(rb,'#D9B48E',.8,.85)});
  b.raw(b.st('M27 33.6q5 -3.4 10 0',`#FFF6E0`,1.3,.9),'top');
  b.sh(RR(23.5,52,17,5,1.6),'#3E3533',{hatch:0,hl:0,lw:.6});
  b.ln([[32,57],[32,61]],{w:1.2,col:RD});b.sh([[29.6,60],[34.4,60],[35.2,63.4],[28.8,63.4]],RD,{k:.1,hatch:0,hl:0,lw:.5,dr:.1});
  gold215(b,[[56,12,4.4],[8,50,3.4],[56,52,3]]);b.ex('glint',22,22,3.6)},
 'Sea Glass'(b){
  b.shadow(32,55,24,3);
  [[14,58,1],[22,60,.8],[46,60,.9],[52,57,.7]].forEach(([x,y,r])=>b.dot(x,y,r,'#D9C29A'));
  b.sh([[8,44],[10,36],[17,33],[23,37],[22,46],[14,49]],'#E9C27E',{k:.3,hl:0,hatch:0,lw:.7,base:'#F7E3BC',op:.92,dr:.3});
  b.sh([[18,26],[26,15],[40,12],[50,19],[51,33],[44,45],[29,47],[19,40]],'#9FD8C4',{k:.32,sh:'#5FA88E',base:'#DDF3EA',ho:.4,hlo:.6,
   marks:[{pts:[[22,22],[30,16],[34,20],[24,27]],fill:'#E7F7F0',op:.85}]});
  b.sh([[40,44],[46,38],[55,39],[58,47],[53,53],[43,52]],'#9CC7EE',{k:.3,hl:0,lw:.75,sh:'#6E97C4',base:'#D6E8FA'});
  let fr='';[[28,30],[36,26],[42,34],[33,38],[25,36],[44,24],[30,22],[38,42]].forEach(([x,y])=>{fr+=`<circle cx="${x}" cy="${y}" r=".7" fill="#FFFFFF" opacity=".75"/>`});
  [[48,46],[52,44],[15,41]].forEach(([x,y])=>{fr+=`<circle cx="${x}" cy="${y}" r=".6" fill="#FFFFFF" opacity=".7"/>`});b.raw(fr,'top');
  b.ex('glint',27,21,4);b.ex('glint',47,43,2.6);
  gold215(b,[[56,12,4.6],[8,16,3.4],[60,30,2.6]])}
};
/* v2.17 Dog Days (V217.md 2): the Bond 10 gifts, the Crayon Crown and the Golden Collar (wardrobe and journal icons; kept out of the lists above) */
const ITEMS_V217={
 'Crayon Crown'(b){
  b.shadow(32,57,22,2.6);
  b.sh([[10,50],[8,34],[6,14],[19,28],[24,8],[32,26],[41,9],[46,28],[58,15],[56,34],[54,50]],'#FFD23A',{k:.12,sh:'#E9A93B',base:'#FFF0A8',
   inner:b.st(b.jl(14,40,22,32,.5)+b.jl(26,42,34,34,.5)+b.jl(40,42,48,34,.5),'#F2A93B',1.4,.7)});
  b.sh([[9,52],[55,52],[55,42],[9,42]],'#E8473D',{k:.06,hatch:0,hl:0,lw:.8});
  [[18,47,'#4F8FD6'],[32,47,'#6DBE5A'],[46,47,'#8E63C7']].forEach(([x,y,c])=>b.sh(E(x,y,3.4,3,10),c,{hatch:0,hl:0,lw:.6}));
  [[6,14],[24,8],[41,9],[58,15]].forEach(([x,y])=>b.sh(E(x,y,3,2.8,10),'#F28FA5',{hatch:0,hl:0,lw:.55}));
  b.ex('spark',58,40,3.6);b.ex('glint',20,24,3)},
 'Golden Collar'(b){
  b.sh(ribbon([[7,20],[18,12],[32,10],[46,12],[57,20]],[4.4,4.4,4.4,4.4,4.4]),'#E9A93B',{hatch:0,hl:0,lw:.8,ink:GINK215});
  b.sh(ribbon([[6,19],[13,29],[32,35],[51,29],[58,19]],[8,8,8,8,8]),'#FFD23A',{ink:GINK215,sh:'#E9A93B'});
  b.raw(b.st('M15 27q8 5 15 6',  '#FFF6C8',1.6,.8));
  b.sh(E(32,49,9,9,14),'#FFD23A',{ink:GINK215,sh:'#E9A93B',hl:0});
  b.ex('heart',32,49,4,'#F28FA5');
  gold215(b,[[56,44,4.2],[8,44,3.4],[48,6,3]]);b.ex('glint',25,45,2.6)}
};
const PC_M=14,PC_SH=60,PC_FONT_R="'Patrick Hand',cursive",TK_C={c:'#F4B183',d:'#D98A5A'};let PC_UID=0;
// the Tokyo photo frame: world B's postcard with a torii-orange frame and the seven stamps round the edge (same window, so the photo fits)
function tokyoPostcard(w,h,o){o=o||{};const s=Math.max(w,h)/450,lw=w/s,lh=h/s,col=TK_C;
  const b=mk('prop','postcard:tokyo:'+w+'x'+h),x0=PC_M,y0=PC_M,x1=lw-PC_M,y1=lh-PC_SH,bd=7,SPK='#FFF3B8';
  b.loop(RR(3,3,lw-6,lh-6,7),{w:1.5,col:GRAPH,op:.9});
  [[[x0-bd,y0-bd],[x1+bd,y0-bd],[x1,y0],[x0,y0]],[[x1+bd,y0-bd],[x1+bd,y1+bd],[x1,y1],[x1,y0]],
   [[x0-bd,y1+bd],[x1+bd,y1+bd],[x1,y1],[x0,y1]],[[x0-bd,y0-bd],[x0,y0],[x0,y1],[x0-bd,y1+bd]]].forEach(q=>b.sh(q,col.c,{k:0,hl:0,lw:.7,sh:col.d,base:mix(col.c,'#FFFFFF',.5),dr:.5}));
  b.loop([[x0,y0],[x1,y0],[x1,y1],[x0,y1]],{k:0,w:1.6,col:INK});
  const tape=(cx,cy,a)=>b.sh(rot([[cx-17,cy-5.5],[cx+17,cy-5.5],[cx+17,cy+5.5],[cx-17,cy+5.5]],a,cx,cy),col.d,{k:0,hatch:0,hl:0,lw:.55,op:.85,base:mix(col.d,'#FFFFFF',.35),
    post:`<g transform="rotate(${R1(a*180/Math.PI)} ${cx} ${cy})" stroke="#fff" stroke-opacity=".6" stroke-width="1.2">${[-12,-6,0,6,12].map(d=>`<path d="M${cx+d-2} ${cy+5.5}l4 -11"/>`).join('')}</g>`});
  tape(x0+6,y0+3,-.62);tape(x1-6,y0+3,.62);
  // the seven stamps round the frame: three along the top, two down each side (paper discs under them, slightly turned)
  const ww=x1-x0,hh=y1-y0,R=Math.min(13,Math.max(9,hh*.075)),spots=[[x0+ww*.3,y0,-.2],[x0+ww*.5,y0,.12],[x0+ww*.7,y0,-.08],[x0,y0+hh*.36,.2],[x0,y0+hh*.72,-.14],[x1,y0+hh*.36,-.18],[x1,y0+hh*.72,.1]];
  ST_KEYS.forEach((key,i)=>{const [cx,cy,a]=spots[i];b.raw(`<circle cx="${R1(cx)}" cy="${R1(cy)}" r="${R1(R*1.04)}" fill="#FFFBF3" opacity=".92"/>`);stampArt(b,key,cx,cy,R,a)});
  // the postage stamp (bottom right): a tiny Tokyo Tower in place of the paw
  const sw=32,sh=40,sx=lw-PC_M-sw-1,sy=y1+bd+4,pts=[];
  for(let i=0;i<=8;i++)pts.push([sx+i*sw/8,sy+(i%2?1.3:0)]);for(let i=1;i<=10;i++)pts.push([sx+sw+(i%2?-1.3:0),sy+i*sh/10]);
  for(let i=7;i>=0;i--)pts.push([sx+i*sw/8,sy+sh+(i%2?-1.3:0)]);for(let i=9;i>=1;i--)pts.push([sx+(i%2?1.3:0),sy+i*sh/10]);
  b.sh(rot(pts,.07,sx+sw/2,sy+sh/2),'#FFF6DC',{k:0,hatch:0,hl:0,lw:.55,base:'#FFFBF3'});
  b.sh(rot(RR(sx+3.5,sy+3.5,sw-7,sh-12,1.5),.07,sx+sw/2,sy+sh/2),col.c,{k:0,hatch:0,hl:0,lw:.45,base:mix(col.c,'#FFFFFF',.4)});
  {const tx=sx+sw/2+.6,ty=sy+5;b.raw(`<g transform="rotate(4 ${R1(tx)} ${R1(ty+10)})"><path d="M${R1(tx-6.4)} ${R1(ty+21)}Q${R1(tx-2.6)} ${R1(ty+14)} ${R1(tx-2)} ${R1(ty+9)}L${R1(tx-1)} ${R1(ty+3)}M${R1(tx+6.4)} ${R1(ty+21)}Q${R1(tx+2.6)} ${R1(ty+14)} ${R1(tx+2)} ${R1(ty+9)}L${R1(tx+1)} ${R1(ty+3)}M${R1(tx)} ${R1(ty+3)}V${R1(ty-3)}" fill="none" stroke="#C24F2E" stroke-width="1.3" stroke-linecap="round"/><rect x="${R1(tx-3.6)}" y="${R1(ty+8.4)}" width="7.2" height="2.4" fill="#FFFBF3" stroke="#C24F2E" stroke-width="1"/><rect x="${R1(tx-1.8)}" y="${R1(ty+2.4)}" width="3.6" height="1.6" fill="#C24F2E"/></g>`,'top')}
  if(o.stamp)b.raw(`<text x="${R1(sx+sw/2+1.2)}" y="${R1(sy+sh-3.4)}" text-anchor="middle" font-family="${FONT}" font-size="8.6" font-weight="700" fill="${INK}" transform="rotate(4 ${R1(sx+sw/2)} ${R1(sy+sh/2)})">${esc(o.stamp)}</text>`,'top');
  b.ex('heart',x0+4,y1+bd+8,2.6,'#F7B2C4');b.ex('spark',x1-sw-10,y1+bd+10,3,SPK);
  const tw=lw-2*PC_M-sw-12,tx=PC_M+2,ty=y1+bd,fit=(t,sz,k)=>R1(Math.min(sz,tw/Math.max(1,String(t).length*k)));
  if(o.caption){const sz=fit(o.caption,25,.44);b.raw(`<text x="${tx}" y="${R1(ty+19)}" style="font-family:${FONT}" font-size="${sz}" font-weight="700" fill="${INK}" transform="rotate(-1.2 ${tx} ${R1(ty+19)})">${esc(o.caption)}</text>`,'top')}
  const l2=[o.place,o.date].filter(Boolean).join(' · ');
  if(l2){const sz=fit(l2,12,.5);b.raw(`<text x="${tx}" y="${R1(ty+34)}" font-size="${sz}" fill="${INK}" style="font-family:${PC_FONT_R}">${esc(l2)}</text>`,'top')}
  if(o.dogs){const sz=fit(o.dogs,11.5,.5);b.raw(`<text x="${tx}" y="${R1(ty+47)}" font-size="${sz}" fill="#7A6358" style="font-family:${PC_FONT_R}">${esc(o.dogs)}</text>`,'top')}
  const front=b.svg('0 0 '+R1(lw)+' '+R1(lh),` width="${w}" height="${h}" x="0" y="0" aria-hidden="true"`,'Tokyo postcard frame').split(IDT).join('pwep'+(++PC_UID).toString(36));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="Postcard with the Tokyo stamps" data-frame="tokyo"><rect width="${w}" height="${h}" fill="#FFFBF3"/>${o.scene||''}${front}</svg>`}
/* v2.18 Fun Fair (V218.md 9): the minigame props (PawArt.ffArt(name, o)) and the sticker items (ITEMS_V218). The crayon kit above: every fill
   sits inside its own pencil outline (b.sh pulls the wash in to the line's inner edge), details are clipped to their shape. No text in the art. */
const FF_COLS=[['#F08A86','#E46F6B'],['#B9D4F3','#8FB3E0'],['#FFE08A','#E9B44C'],['#BDE7D2','#86C9A8'],['#D3C6F1','#B9A6E8']];
const FF_LEAF={spring:['#F7C6D4','#F28FA5'],summer:['#9CCB86','#7FB86A'],autumn:['#F7B267','#E9883B'],winter:['#E6EEF3','#B9C9D6']};
function ffBiscuit(b,s,cx,cy,k,col){
  col=col||'#E9C08A';const sh={hatch:0,hl:0,base:'#F8E3C0',lw:.8};
  if(s==='bone')b.sh(boneFF(cx,cy,40*k,15*k),col,sh);
  else if(s==='heart')b.sh(heartFF(cx,cy+2*k,36*k),col,sh);
  else if(s==='star')b.sh(starFF(cx,cy+1*k,20*k,9.5*k),col,sh);
  else b.sh(E(cx,cy,17*k,17*k,18),col,sh);
  [[-6,-3],[5,2],[-1,5],[7,-5]].forEach(([dx,dy])=>b.dot(cx+dx*k,cy+dy*k,1.1*k,'#C99A62'));
}
const boneFF=(cx,cy,len,th)=>boneP(cx,cy,len,th);
function heartFF(cx,cy,s){const p=[];for(let i=0;i<24;i++){const t=i/24*Math.PI*2;p.push([cx+16*Math.pow(Math.sin(t),3)*s/32,cy-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*s/32])}return p}
function starFF(cx,cy,R,r){const p=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,q=i%2?r:R;p.push([cx+Math.cos(a)*q,cy+Math.sin(a)*q])}return p}
function cloudFF(cx,cy,rx,ry){const p=[];for(let i=0;i<40;i++){const a=i/40*Math.PI*2,f=1+.14*(Math.abs(Math.sin(a*3.5))-.6);p.push([cx+Math.cos(a)*rx*f,cy+Math.sin(a)*ry*f])}return p}
function ffRosette(b,cx,cy,R,c,d){
  b.sh([[cx-R*.55,cy+R*.5],[cx-R*.85,cy+R*2.2],[cx-R*.45,cy+R*1.9],[cx-R*.2,cy+R*2.3],[cx,cy+R*.7]],d,{k:0,hatch:0,hl:0,lw:.8});
  b.sh([[cx+R*.55,cy+R*.5],[cx+R*.85,cy+R*2.2],[cx+R*.45,cy+R*1.9],[cx+R*.2,cy+R*2.3],[cx,cy+R*.7]],c,{k:0,hatch:0,hl:0,lw:.8});
  const pet=[];for(let i=0;i<32;i++){const a=i/32*Math.PI*2,f=1+.13*Math.cos(a*8);pet.push([cx+Math.cos(a)*R*f,cy+Math.sin(a)*R*f])}
  b.sh(pet,c,{hatch:0,sh:d,hl:0,lw:.9});b.sh(E(cx,cy,R*.55,R*.55,16),'#FFF6DC',{hatch:0,hl:0,lw:.7});
}
const FF_ART={
 canopy:[ '0 0 1000 300','prop',(b,o)=>{const L=FF_LEAF[o.season]||FF_LEAF.summer;
  [[60,300,96,120],[940,300,904,120]].forEach(([x0,y0,x1,y1])=>b.sh([[x0-22,y0],[x0-14,y1+60],[x1-12,y1],[x1+14,y1+6],[x0+16,y1+70],[x0+22,y0]],'#C9A07A',{k:.15,sh:'#A97E5A',hl:0}));
  const blobs=[[90,120,120,80],[250,90,140,80],[420,70,150,72],[590,74,150,74],[760,92,140,80],[910,122,110,80],[170,180,110,52],[500,150,170,52],[830,178,120,52]];
  blobs.forEach(([x,y,rx,ry],i)=>b.sh(cloudFF(x,y,rx,ry),i%2?L[0]:mix(L[0],L[1],.35),{sh:L[1],hlo:.3}));
  if(o.season==='spring')[[200,150],[380,120],[640,130],[880,150]].forEach(([x,y])=>b.ex('heart',x,y,5,'#F7B2C4'));
  if(o.season==='winter')[[240,52],[430,30],[600,36],[780,58]].forEach(([x,y])=>b.sh(E(x,y,46,12,14),'#FFFFFF',{hatch:0,hl:0,lw:.7}));
 }],
 trunk:['0 0 90 520','prop',(b)=>{b.sh([[18,0],[16,180],[12,400],[6,516],[84,516],[76,400],[72,180],[70,0]],'#C9A07A',{k:.1,sh:'#A97E5A',hl:0,inner:b.st(b.jl(34,60,30,160)+b.jl(52,240,56,330)+b.jl(36,400,32,480),'#A97E5A',1.4,.8)})}],
 pinecone:['0 0 64 64','item',(b)=>{b.sh(E(32,34,15,22,18),'#B9875A',{sh:'#8A5E3B',hl:0,inner:b.st(b.jl(20,24,44,24)+b.jl(18,32,46,32)+b.jl(19,40,45,40)+b.jl(22,48,42,48)+b.jl(26,16,38,16),'#7A5136',1.3,.8)});
  b.sh([[30,13],[31,5],[35,6],[34,13]],'#7FB86A',{k:.1,hatch:0,hl:0,lw:.6})}],
 bubble:['0 0 80 80','item',(b,o)=>{const g=!!o.gold;b.sh(E(40,40,30,30,24),g?'#FFE08A':'#DDF1FB',{hatch:0,base:g?'#FFF3C4':'#F2FAFE',op:g?.95:.75,hl:0,lw:.8,
   marks:[{pts:E(34,34,19,19,16),fill:g?'#FFF6D6':'#FFFFFF',op:.45},{pts:E(52,54,8,5,10,.6),fill:g?'#F7C548':'#C5E6F5',op:.6}]});
  b.sh(E(28,26,7,4,10,-.7),'#FFFFFF',{hatch:0,hl:0,lw:.5});if(g){b.ex('spark',60,18,5);b.ex('spark',16,62,3.4)}}],
 kite:['0 0 120 170','prop',(b,o)=>{const c=FF_COLS[(o.c||0)%5];b.sh([[60,6],[100,52],[60,110],[20,52]],c[0],{k:0,sh:c[1],marks:[{pts:[[60,6],[100,52],[60,52]],fill:'#FFFFFF',op:.35,k:0},{pts:[[20,52],[60,52],[60,110]],fill:'#FFFFFF',op:.35,k:0}]});
  b.ln([[60,10],[60,106]],{w:1.4});b.ln([[24,52],[96,52]],{w:1.4});b.ln([[60,110],[52,124],[66,138],[54,152],[62,166]],{w:1.2});
  [[52,124],[66,138],[54,152]].forEach(([x,y],i)=>{const cc=FF_COLS[(i+1+(o.c||0))%5][0];b.sh([[x,y],[x-9,y-6],[x-9,y+6]],cc,{k:0,hatch:0,hl:0,lw:.6});b.sh([[x,y],[x+9,y-6],[x+9,y+6]],cc,{k:0,hatch:0,hl:0,lw:.6})})}],
 box:['0 0 160 150','prop',(b,o)=>{const c=FF_COLS[(o.c||0)%5];b.shadow(80,142,66,6);
  b.sh([[18,44],[142,44],[136,140],[24,140]],c[0],{k:0,sh:c[1],marks:[{pts:[[30,70],[130,70],[128,108],[32,108]],fill:'#FFF6DC',op:.95,k:0}]});
  b.sh([[14,30],[146,30],[142,48],[18,48]],mix(c[0],'#FFFFFF',.2),{k:0,hatch:0,hl:0});
  [[46,'#E46F6B'],[66,'#6DBE5A'],[86,'#4F8FD6'],[106,'#F9B97A']].forEach(([x,col])=>{b.sh([[x-5,104],[x-5,80],[x,72],[x+5,80],[x+5,104]],col,{k:0,hatch:0,hl:0,lw:.6})});
  b.ln([[36,58],[124,58]],{w:1,op:.5})}],
 judgecard:['0 0 320 220','prop',(b)=>{b.shadow(160,212,140,7);b.sh(RR(10,10,300,196,14),'#FFF6DC',{k:0,sh:'#E8C597',hl:0});
  b.loop(RR(24,24,272,168,10),{w:1.2,col:'#C99A72',op:.7});ffRosette(b,280,40,18,'#8FB3E0','#5E86C0')}],
 stall:['0 0 640 420','prop',(b)=>{b.shadow(320,410,290,10);
  [[60,402],[580,402]].forEach(([x,y])=>b.sh([[x-9,y],[x-9,110],[x+9,110],[x+9,y]],'#E2B07E',{k:0,sh:'#C58F5E',hl:0}));
  b.sh([[40,250],[600,250],[590,404],[50,404]],'#E2B07E',{k:0,sh:'#C58F5E',marks:[{pts:[[40,250],[600,250],[600,290],[40,290]],fill:'#FFF2DA',k:0}]});
  b.sh([[30,236],[610,236],[610,262],[30,262]],'#F7E3BC',{k:0,hatch:0,hl:0});
  for(let i=0;i<10;i++){const x0=20+i*60,x1=x0+60,col=i%2?'#FFF6DC':'#F28FA5';b.sh([[x0,40],[x1,40],[x1,110],[x1-8,128],[(x0+x1)/2,136],[x0+8,128],[x0,110]],col,{k:.05,hatch:i%2?0:1,hl:0,sh:'#E46F6B',lw:.9})}
  b.sh([[14,20],[626,20],[626,44],[14,44]],'#E46F6B',{k:0,hatch:0,hl:0});
  b.sh([[230,150],[410,150],[404,214],[236,214]],'#FFF6DC',{k:0,hatch:0,hl:0})}],
 paper:['0 0 64 64','item',(b)=>{b.sh(rot(RR(10,22,44,20,9),-.3,32,32),'#F4F1EA',{hatch:0,sh:'#C9C2BA',inner:b.st(b.jl(16,30,44,22)+b.jl(18,36,48,28),'#A8968A',1,.8)});
  b.sh(rot([[28,20],[34,20],[34,44],[28,44]],-.3,32,32),'#F08A86',{k:0,hatch:0,hl:0,lw:.6})}],
 door:['0 0 200 280','prop',(b,o)=>{const c=FF_COLS[(o.c||0)%5];b.shadow(100,274,92,6);
  b.sh([[8,60],[192,60],[192,270],[8,270]],'#FCE6CC',{k:0,sh:'#E8C597'});b.sh([[0,66],[100,8],[200,66]],'#EBA48C',{k:0,sh:'#D88870',hl:0});
  b.sh(RR(64,128,72,142,10),c[0],{k:0,sh:c[1]});b.dot(122,204,3.2,'#5B3D32');
  b.sh(RR(80,146,40,8,2),'#FFF6DC',{k:0,hatch:0,hl:0,lw:.6});
  b.sh(RR(20,98,34,34,4),'#BFE6FA',{k:0,hatch:0,lw:.8});b.sh(RR(146,98,34,34,4),'#BFE6FA',{k:0,hatch:0,lw:.8});
  b.sh([[56,262],[144,262],[150,276],[50,276]],'#E3DCD3',{k:0,hatch:0,hl:0})}],
 biscuit:['0 0 64 64','item',(b,o)=>ffBiscuit(b,o.s,32,32,1)],
 tin:['0 0 150 120','prop',(b,o)=>{const c=FF_COLS[{bone:0,heart:2,star:1,round:3}[o.s]||0];b.shadow(75,114,64,5);
  b.sh([[12,30],[138,30],[132,112],[18,112]],c[0],{k:0,sh:c[1],marks:[{pts:E(75,72,30,26,18),fill:'#FFF6DC',op:.95}]});
  b.sh(E(75,30,64,10,22),mix(c[1],'#5B3D32',.25),{hatch:0,hl:0});ffBiscuit(b,o.s,75,72,.9)}],
 cloud:['0 0 120 70','item',(b)=>{b.sh(cloudFF(60,36,52,26),'#FFFFFF',{hatch:0,base:'#FFFFFF',sh:'#C9D9E6',hlo:.2})}],
 leaf:['0 0 48 48','item',(b,o)=>{const s=o.season||'summer';
  if(s==='spring')b.sh(heartFF(24,26,28),'#F7C6D4',{hatch:0,hl:0,sh:'#F28FA5'});
  else if(s==='winter'){[0,1,2].forEach(i=>{const a=i*Math.PI/3;b.ln([[24-Math.cos(a)*16,24-Math.sin(a)*16],[24+Math.cos(a)*16,24+Math.sin(a)*16]],{w:2,col:'#7FA6C6'})});b.sh(E(24,24,4,4,10),'#FFFFFF',{hatch:0,hl:0,lw:.6})}
  else if(s==='autumn')b.sh(starFF(24,25,18,9),'#F2A65A',{hatch:0,hl:0,sh:'#E9883B'});
  else b.sh(rot([[8,24],[18,14],[32,12],[42,24],[32,36],[18,34]],-.4,24,24),'#9CCB86',{hatch:0,hl:0,sh:'#7FB86A',inner:b.st(b.jl(10,28,40,20),'#6FA05A',1,.8)})}],
 sponge:['0 0 64 64','item',(b)=>{b.sh(rot(RR(12,20,40,26,7),-.2,32,32),'#FFE08A',{sh:'#E9B44C',inner:'<circle cx="24" cy="30" r="2" fill="#E9B44C"/><circle cx="36" cy="27" r="1.6" fill="#E9B44C"/><circle cx="40" cy="38" r="2" fill="#E9B44C"/>'})}],
 jug:['0 0 64 64','item',(b)=>{b.sh([[16,22],[44,22],[46,54],[14,54]],'#B9D4F3',{k:.1,sh:'#8FB3E0'});b.sh([[44,28],[56,20],[58,24],[46,34]],'#B9D4F3',{k:.1,hatch:0,hl:0,lw:.7});
  b.sh(E(30,22,14,4,14),'#DDF1FB',{hatch:0,hl:0,lw:.6})}],
 towel:['0 0 64 64','item',(b)=>{b.sh([[10,14],[54,14],[52,52],[12,52]],'#F7B2C4',{k:.1,sh:'#F28FA5',marks:[{pts:[[10,40],[54,40],[54,45],[10,45]],fill:'#FFFFFF',op:.8,k:0}]})}]
};
const ITEMS_V218={
 'Show Ribbon'(b){ffRosette(b,32,24,15,'#8FB3E0','#5E86C0')},
 'Red Show Ribbon'(b){ffRosette(b,32,24,15,'#F08A86','#E46F6B')},
 'Gold Show Rosette'(b){ffRosette(b,32,24,15,'#FFD56B','#E9B44C');b.ex('spark',56,12,4)},
 'Photo Contest Ribbon'(b){ffRosette(b,32,24,15,'#D3C6F1','#B9A6E8');b.ex('heart',54,48,3.6)},
 'Treat Jar'(b){b.shadow(32,58,20,3);b.sh([[16,22],[48,22],[50,56],[14,56]],'#DDF1FB',{k:.15,op:.85,sh:'#9CCDE8'});b.sh(RR(14,12,36,10,3),'#F08A86',{k:0,hatch:0,hl:0});
  ffBiscuit(b,'bone',32,44,.5);ffBiscuit(b,'heart',24,34,.38);ffBiscuit(b,'star',40,32,.38)},
 'Golden Bubble'(b){b.sh(E(32,32,22,22,22),'#FFE08A',{hatch:0,base:'#FFF3C4',hl:0,lw:.8});b.sh(E(24,24,5,3,10,-.7),'#FFFFFF',{hatch:0,hl:0,lw:.5});b.ex('spark',54,12,4.4)},
 'Paper Kite'(b){b.sh([[32,6],[52,26],[32,50],[12,26]],'#F08A86',{k:0,sh:'#E46F6B'});b.ln([[32,8],[32,48]],{w:1});b.ln([[14,26],[50,26]],{w:1});b.ln([[32,50],[28,56],[36,62]],{w:1})},
 'Crayon Box'(b){b.sh([[10,22],[54,22],[52,58],[12,58]],'#B9D4F3',{k:0,sh:'#8FB3E0'});[[20,'#E46F6B'],[29,'#6DBE5A'],[38,'#FFD23A'],[47,'#8E63C7']].forEach(([x,c])=>b.sh([[x-3,24],[x-3,10],[x,5],[x+3,10],[x+3,24]],c,{k:0,hatch:0,hl:0,lw:.55}))},
 'Market Basket'(b){b.sh([[8,30],[56,30],[50,56],[14,56]],'#E2B07E',{k:.1,sh:'#C58F5E',inner:b.st(b.jl(12,40,52,40)+b.jl(14,48,50,48),'#C58F5E',1,.8)});
  b.sh(E(22,28,7,6,12),'#F9B97A',{hatch:0,hl:0,lw:.6});b.sh(E(36,26,8,7,12),'#9CCB86',{hatch:0,hl:0,lw:.6});b.ln([[12,30],[20,10],[44,10],[52,30]],{w:1.4})},
 'Rolled Newspaper'(b){FF_ART.paper[2](b,{})},
 'Biscuit Tin'(b){b.sh([[10,24],[54,24],[52,56],[12,56]],'#F08A86',{k:0,sh:'#E46F6B',marks:[{pts:E(32,40,12,10,14),fill:'#FFF6DC'}]});b.sh(E(32,24,22,5,16),'#E46F6B',{hatch:0,hl:0,lw:.6});ffBiscuit(b,'bone',32,40,.42)},
 'Wash Sponge'(b){FF_ART.sponge[2](b,{})}
};
return {
  item(name){const f=ITEMS_E[name]||ITEMS_V215[name]||ITEMS_V217[name]||ITEMS_V218[name];if(!f)return null;return serve('t:'+name,()=>{const b=mk('item',name);f(b);return b.svg('0 0 64 64','',esc(name))})},
  ITEMS215:Object.keys(ITEMS_V215),ITEMS217:Object.keys(ITEMS_V217),ITEMS218:Object.keys(ITEMS_V218),FF_NAMES:Object.keys(FF_ART),
  ff(name,o){const A=FF_ART[name];if(!A)return null;o=o||{};const key=['c','s','season','gold'].map(k=>o[k]==null?'':String(o[k])).join(',');
    return serve('ff:'+name+':'+key,()=>{const b=mk(A[1],'ff-'+name+':'+key);A[2](b,o);return b.svg(A[0],' data-ff="'+name+'"','')})},
  ekistamp(o){const key=ST_KEYS.includes(o&&o.key)?o.key:'shibuya',got=!!(o&&o.got);
    return serve('p:ekistamp:'+key+':'+(got?1:0),()=>{const b=mk('prop','ekistamp:'+key);if(got)stampArt(b,key,60,60,54,hashS(key)%7*.03-.09);else stampEmpty(b,60,60,54);
      return b.svg('0 0 120 120',` data-key="${key}" data-got="${got?1:0}"`,ST_LBL[key]+' station stamp'+(got?'':', not collected yet'))})},
  luckycat(o){const indoor=!!(o&&o.indoor),sv=serve('p:luckycat:'+(indoor?1:0),()=>{const b=mk('prop','luckycat');luckyCat(b,{indoor});return b.svg('0 0 80 100',indoor?' data-indoor="1"':'','Lucky Cat')});
    return o&&o.time&&PA.tint?PA.tint(sv,{time:o.time,indoor}):sv},
  postcard:tokyoPostcard,
  ITEMS:Object.keys(ITEMS_E),KEYS:ST_KEYS.slice()};

})();
/* ======================= world E: the Tokyo scenes (V211.md section 5.4) =======================
   1000 x 600 like world C. The floor band (where the dogs' feet stand) is y 420 to 590, x 60 to 940 in all three (odaiba: the sand, y 424 to 590).
   Tall things stand behind the band or at its ends, the tappable spots sit at the back corners, inside the phone crop (x 150 to 850). */
// grass tufts in a box, skipping boxes in avoid
function tuftsE(k,x0,x1,y0,y1,n,avoid=[],col=C.grassD){let d='';for(let i=0;i<n;i++){const x=x0+k.r()*(x1-x0),y=y0+k.r()*(y1-y0);if(avoid.some(z=>x>z[0]&&x<z[2]&&y>z[1]&&y<z[3]))continue;d+=`M${R1(x)} ${R1(y)}q1 -6 -1 -10M${R1(x+5)} ${R1(y)}q0 -7 3 -12`}k.add(`<path d="${d}" fill="none" stroke="${col}" stroke-width="1.5" stroke-linecap="round"/>`)}
// rain sheen and puddles, snow patches, fireflies (like world C's hubFx, with its own keep-clear boxes)
function fxE(k,o){const e=k.env;
  if(e.rain){if(o.sheen)sheen(k,0,1000,o.sheen[0],o.sheen[1],60,o.avoid||[]);(o.puddles||[]).forEach(q=>puddle(k,...q))}
  if(e.snow)(o.patches||[]).forEach(q=>snowPatch(k,...q));
  if(e.night&&!e.rain&&o.flies)o.flies.forEach(f=>k.flies.push(f))}
// the round eki-stamp emblem on a stand's sign (a tiny version of the stamp ring)
function stampDisc(k,x,y,r,col){k.shape(E(x,y,r,r,16),'#FFF8EC',{w:1.5,one:1});k.add(`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(r*.72)}" fill="none" stroke="${col}" stroke-width="${R1(r*.16)}"/><circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(r*.5)}" fill="none" stroke="${col}" stroke-width="1" stroke-dasharray="2 2"/>`);
  const s=r*.2;k.add(`<g fill="${col}"><ellipse cx="${R1(x)}" cy="${R1(y+s*.9)}" rx="${R1(s*1.15)}" ry="${R1(s*.95)}"/><circle cx="${R1(x-s*1.2)}" cy="${R1(y-s*.4)}" r="${R1(s*.45)}"/><circle cx="${R1(x-s*.42)}" cy="${R1(y-s*1.1)}" r="${R1(s*.45)}"/><circle cx="${R1(x+s*.42)}" cy="${R1(y-s*1.1)}" r="${R1(s*.45)}"/><circle cx="${R1(x+s*1.2)}" cy="${R1(y-s*.4)}" r="${R1(s*.45)}"/></g>`)}
// the station-stamp stand: a little wooden desk with a roof in the stamp's colour, the stamp, its ink pad and the round sign
function stampStand(k,x,gy,s,col,colD){
  k.add(`<ellipse cx="${x}" cy="${R1(gy+2*s)}" rx="${R1(42*s)}" ry="${R1(6*s)}" fill="${C.ink}" opacity=".12"/>`);
  [-1,1].forEach(d=>k.shape(RC(x+d*27*s-3*s,gy-150*s,6*s,150*s),C.woodD,{w:1.5,one:1}));
  k.shape([[x-32*s,gy-74*s],[x+32*s,gy-74*s],[x+28*s,gy],[x-28*s,gy]],C.wood,{w:1.9,hatch:{side:.62,gap:4,col:C.woodD,op:.5}});
  k.line([[x-26*s,gy-40*s],[x+26*s,gy-40*s]],1.1,C.woodD);k.line([[x-26*s,gy-20*s],[x+26*s,gy-20*s]],1.1,C.woodD);
  k.shape([[x-38*s,gy-74*s],[x+38*s,gy-74*s],[x+34*s,gy-84*s],[x-34*s,gy-84*s]],'#E7C29A',{w:1.7,one:1});
  // the ink pad, the stamp on its block, a few practice prints on a paper slip
  k.shape(RC(x-28*s,gy-92*s,22*s,8*s),'#5E5A66',{w:1.2,one:1});k.shape(RC(x-26*s,gy-91*s,18*s,4*s),col,{w:.8,one:1,noline:1});
  k.shape(RC(x+2*s,gy-90*s,24*s,6*s),'#FFF8EC',{w:1,one:1});k.add(`<circle cx="${R1(x+8*s)}" cy="${R1(gy-87*s)}" r="${R1(2.4*s)}" fill="none" stroke="${col}" stroke-width="1"/><circle cx="${R1(x+19*s)}" cy="${R1(gy-87*s)}" r="${R1(2.4*s)}" fill="none" stroke="${col}" stroke-width="1" opacity=".7"/>`);
  k.shape(RC(x-2*s,gy-104*s,10*s,12*s),'#C9A07A',{w:1.2,one:1});k.shape(E(x+3*s,gy-106*s,7*s,5*s,10),col,{w:1.2,one:1});
  // the roof, and the round sign hanging under it
  const rf=[[x-44*s,gy-148*s],[x,gy-172*s],[x+44*s,gy-148*s],[x+38*s,gy-144*s],[x-38*s,gy-144*s]];k.shape(rf,col,{w:1.8,one:1,hatch:{side:.6,gap:3.4,col:colD,op:.55}});
  k.line([[x-6*s,gy-144*s],[x-4*s,gy-138*s]],1.1);k.line([[x+6*s,gy-144*s],[x+4*s,gy-138*s]],1.1);stampDisc(k,x,gy-124*s,13*s,col);
  if(k.env.snow)k.side(()=>{capLine(k,[[x-45*s,gy-148*s],[x,gy-173*s],[x+45*s,gy-148*s]],5*s);capLine(k,[[x-38*s,gy-84*s],[x+38*s,gy-84*s]],4*s)})}
// a low hedge: a row of rounded bush lumps along a back edge
function hedge(k,x0,x1,gy,h,col=C.leaf2,colD=C.leafD){if(k.so==='autumn'){col='#C9C27A';colD='#9F9A54'}else if(k.so==='winter'){col='#A3B293';colD='#7F8F74'}
  const p=[[x0,gy]];for(let x=x0;x<=x1;x+=34)p.push([x+17,gy-h-k.r()*8],[Math.min(x1,x+34),gy-h*.72]);p.push([x1,gy]);
  k.shape(p,col,{w:1.8,hatch:{side:.4,gap:4.5,col:colD,op:.5}});let d='';for(let i=0;i<(x1-x0)/30;i++)d+=`M${R1(x0+k.r()*(x1-x0))} ${R1(gy-4-k.r()*(h-6))}q3 -4 7 -1`;k.add(`<path d="${d}" fill="none" stroke="${colD}" stroke-width="1.3" stroke-linecap="round"/>`);
  if(k.so==='spring')k.ss(()=>{for(let i=0;i<(x1-x0)/40;i++)flowerDot(k,x0+k.r()*(x1-x0),gy-6-k.r()*(h-8),2,i%2?'#FFFFFF':'#F9C6D4')});
  if(k.env.snow)k.side(()=>capLine(k,p.slice(1,-1),5))}
// far city blocks: a row of boxy towers with window ticks; lit windows at dusk and night
function skyline(k,list,col,colD){list.forEach(([x,w,top,base,kind])=>{const p=kind===1?[[x,base],[x,top+10],[x+w/2,top],[x+w,top+10],[x+w,base]]:kind===2?[[x,base],[x,top],[x+w*.7,top],[x+w,top+14],[x+w,base]]:RC(x,top,w,base-top);
  k.add(`<path d="M${p.map(q=>R1(q[0]+k.J(.6))+' '+R1(q[1]+k.J(.6))).join('L')}Z" fill="${col}" stroke="${colD}" stroke-width="1.2" stroke-linejoin="round"/>`);
  let d='';for(let y=top+8;y<base-6;y+=9)for(let xx=x+4;xx<x+w-4;xx+=7){if(k.r()<.55)d+=`M${R1(xx)} ${R1(y)}h3`;if(k.r()<.07)tinyLit(k,xx+1.5,y)}k.add(`<path d="${d}" stroke="${colD}" stroke-width="1.4" opacity=".55"/>`)})}
// a lamp post's light pool on paving (lit only)
function signLamp(k,x,gy,s=1){O.lamp(k,x,gy,s)}

/* ---------------- Tokyo Tower (from Shiba Park) ---------------- */
const TT={cx:600,base:394,kw:.8,k:.7,y0:404};// drawn in its own coordinates (base y 394), shown scaled into the scene (base y 404, the tip near y 140: whole on the desktop crop)
const TTF=`matrix(${TT.kw} 0 0 ${TT.k} ${R1(TT.cx*(1-TT.kw))} ${R1(TT.y0-TT.base*TT.k)})`,ttP=(x,y)=>[TT.cx+(x-TT.cx)*TT.kw,TT.y0+(y-TT.base)*TT.k];
const ttHW=y=>y>=210?22+70*Math.pow((y-210)/(TT.base-210),1.8):y>=118?8+7*(y-118)/78:3;
const ttLS=y=>Math.max(3.4,ttHW(y)*.3);
function ttTower(k){k.wlT=TTF;const cx=TT.cx,RD='#EC6B42',RDD='#C24F2E',WH='#FFF4EA',WHD='#D9C6B8';
  const bands=[[394,346,RD],[346,304,WH],[304,268,RD],[268,238,WH],[238,212,RD]],up=[[196,177,WH],[177,158,RD],[158,138,WH],[138,118,RD]];
  const ys=(a,b)=>{const L=[];for(let y=a;y>=b-.01;y-=6)L.push(y);if(L[L.length-1]!==b)L.push(b);return L};
  // the two legs, band by band: an outer and an inner edge
  bands.forEach(([a,b,col])=>{[-1,1].forEach(sg=>{const Y=ys(a,b),o=Y.map(y=>[cx+sg*ttHW(y),y]),i=Y.map(y=>[cx+sg*(ttHW(y)-ttLS(y)),y]).reverse();
    k.fill(o.concat(i),col,{dx:0,dy:0,amp:.4});if(col===RD)k.hatch(o.concat(i),{side:sg>0?.2:.6,gap:3,col:RDD,op:.5,w:1})})});
  // lattice: crosses in each band between the legs, a girder at each band edge, little zigzags inside the legs
  let lat='',zz='';bands.forEach(([a,b])=>{const al=cx-ttHW(a)+ttLS(a),ar=cx+ttHW(a)-ttLS(a),bl=cx-ttHW(b)+ttLS(b),br=cx+ttHW(b)-ttLS(b);
    lat+=`M${R1(al)} ${a}L${R1(br)} ${b}M${R1(ar)} ${a}L${R1(bl)} ${b}M${R1(bl)} ${b}H${R1(br)}`;
    [-1,1].forEach(sg=>{let t=0;for(let y=a;y>b+3;y-=7,t++){const y2=Math.max(b,y-7),xo=cx+sg*ttHW(y),xi=cx+sg*(ttHW(y)-ttLS(y)),xo2=cx+sg*ttHW(y2),xi2=cx+sg*(ttHW(y2)-ttLS(y2));zz+=t%2?`M${R1(xo)} ${R1(y)}L${R1(xi2)} ${R1(y2)}`:`M${R1(xi)} ${R1(y)}L${R1(xo2)} ${R1(y2)}`}})});
  k.add(`<path d="${zz}" fill="none" stroke="${C.ink}" stroke-width="1.05" opacity=".55"/><path d="${lat}" fill="none" stroke="${C.ink}" stroke-width="1.5" stroke-linecap="round" opacity=".8"/>`);
  // the arch between the feet
  k.line([[cx-ttHW(392)+ttLS(392),392],[cx-40,360],[cx,350],[cx+40,360],[cx+ttHW(392)-ttLS(392),392]],1.4,C.ink,{op:.8});
  [-1,1].forEach(sg=>{const Y=ys(394,212);k.pen(Y.map(y=>[cx+sg*ttHW(y),y]),false,{w:2.7,amp:.5});k.pen(Y.map(y=>[cx+sg*(ttHW(y)-ttLS(y)),y]),false,{w:1.6,amp:.4})});
  // the shaft above the main deck
  up.forEach(([a,b,col])=>{const Y=ys(a,b),p=Y.map(y=>[cx-ttHW(y),y]).concat(Y.slice().reverse().map(y=>[cx+ttHW(y),y]));k.fill(p,col,{dx:0,dy:0,amp:.3});
    let d='';for(let y=a;y>b+2;y-=8){const y2=Math.max(b,y-8);d+=`M${R1(cx-ttHW(y))} ${R1(y)}L${R1(cx+ttHW(y2))} ${R1(y2)}M${R1(cx+ttHW(y))} ${R1(y)}L${R1(cx-ttHW(y2))} ${R1(y2)}`}
    k.add(`<path d="${d}" fill="none" stroke="${col===RD?RDD:WHD}" stroke-width=".9"/><path d="M${R1(cx-ttHW(b))} ${b}H${R1(cx+ttHW(b))}" stroke="${C.ink}" stroke-width="1" opacity=".7"/>`)});
  k.pen([[cx-15,196],[cx-8,118]],false,{w:2.1,amp:.3});k.pen([[cx+15,196],[cx+8,118]],false,{w:2.1,amp:.3});
  // the main deck (two storeys of windows) and the top deck
  const deck=(x,y,w,h,rows)=>{k.shape(RC(x-w/2,y,w,h),'#F4EEE6',{w:2.2,one:1,hatch:{side:.7,gap:3,col:WHD,op:.5}});
    for(let i=0;i<rows;i++){const wy=y+3+i*(h-4)/rows,wh=(h-4)/rows-3;k.shape(RC(x-w/2+3,wy,w-6,wh),'#CFE6F4',{w:.9,one:1,noline:1});let d='';for(let xx=x-w/2+3+w/9;xx<x+w/2-3;xx+=w/9)d+=`M${R1(xx)} ${R1(wy)}v${R1(wh)}`;k.add(`<path d="${d}" stroke="${C.ink}" stroke-width=".8" opacity=".7"/>`);
      if(k.env.lit){const a=ttP(x-w/2+3,wy),b2=ttP(x+w/2-3,wy+wh);k.glows.push([a[0],a[1],b2[0]-a[0],b2[1]-a[1]])}}
    k.shape(RC(x-w/2-3,y-3,w+6,4),RD,{w:1.2,one:1});k.shape(RC(x-w/2+2,y+h,w-4,3),'#BFB2A6',{w:1,one:1})};
  deck(cx,190,72,22,2);deck(cx,105,30,13,1);
  // the antenna
  const an=[[104,84,WH],[84,64,RD],[64,46,WH],[46,30,RD]];an.forEach(([a,b,col])=>{const wa=3.4-(104-a)*.03,wb=3.4-(104-b)*.03;k.shape([[cx-wa,a],[cx+wa,a],[cx+wb,b],[cx-wb,b]],col,{w:1,one:1})});
  k.line([[cx,30],[cx,16]],1.6);k.add(`<circle cx="${cx}" cy="15" r="2.2" fill="${RD}" stroke="${C.ink}" stroke-width="1"/>`);
  if(k.env.snow)k.side(()=>{capLine(k,[[cx-40,187],[cx+40,187]],5);capLine(k,[[cx-18,102],[cx+18,102]],3.5);[[346,0],[304,0],[268,0]].forEach(([y])=>{capLine(k,[[cx-ttHW(y),y],[cx-ttHW(y)+ttLS(y),y]],2.6);capLine(k,[[cx+ttHW(y)-ttLS(y),y],[cx+ttHW(y),y]],2.6)})});
  // it glows after dark (the landmark light: warm orange up the legs and the shaft), more with the Winter Lights
  const L=k.env.lit;if(L){const g=glowGrad(k,'#FFB866','tt'),Y=ys(394,118),lp=Y.map(y=>[cx-ttHW(y)+1,y]),rp=Y.map(y=>[cx+ttHW(y)-1,y]),P=a=>'M'+a.map(q=>R1(q[0])+' '+R1(q[1])).join('L');
    k.wl.push(`<g transform="${TTF}"><ellipse cx="${cx}" cy="250" rx="140" ry="190" fill="url(#${g})" opacity="${R1(.55*L)}"/><path d="${P(lp)}M${P(rp).slice(1)}M${cx-3} 104L${cx} 20L${cx+3} 104" fill="none" stroke="#FFB45A" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" opacity="${R1(.38*L)}"/><path d="${P(lp)}M${P(rp).slice(1)}" fill="none" stroke="#FFE2A8" stroke-width="1.8" opacity="${R1(.9*L)}"/><path d="${lat}" fill="none" stroke="#FFC77A" stroke-width="1.6" stroke-linecap="round" opacity="${R1(.7*L)}"/></g>`);
    jpGlow(k,cx,200,60);jpGlow(k,cx,110,30)}
  k.lt(()=>{if(!L)return;let s='';const r=rng(77);for(let i=0;i<90;i++){const y=118+r()*272,sg=r()<.5?-1:1,x=cx+sg*(ttHW(y)-r()*ttLS(y)),c=LTC[i%5];s+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(1.6+r()*1.2)}" fill="${mixH(c,'#FFFFFF',.35)}" opacity="${R1(.95*L)}"/>`}
    for(let y=196;y>118;y-=9)s+=`<circle cx="${R1(cx+(r()-.5)*ttHW(y)*2)}" cy="${y}" r="1.8" fill="#FFF3C2" opacity="${R1(.95*L)}"/>`;k.wl.push(`<g transform="${TTF}">${s}</g>`)});k.wlT=null}
// Zōjō-ji's great gate (the roof and the red pillars behind the hedge, on the left)
function ttGate(k,x,gy,s=1){const V='#E2563D',VD='#B83E2C',T='#6E7782',TD='#555D68';
  k.shape(RC(x-86*s,gy-58*s,172*s,58*s),'#F1E6D6',{w:1.6,one:1,hatch:{side:.7,gap:3.6,col:'#D2C2AE',op:.45}});
  [-70,-34,0,34,70].forEach(dx=>k.shape(RC(x+dx*s-4*s,gy-58*s,8*s,58*s),V,{w:1.3,one:1,hatch:{side:.6,gap:2.6,col:VD,op:.5}}));
  [-52,52].forEach(dx=>k.shape(RC(x+dx*s-12*s,gy-40*s,24*s,40*s),'#5E463D',{w:1.2,one:1}));
  k.shape(RC(x-94*s,gy-70*s,188*s,12*s),V,{w:1.4,one:1});
  const r1=[[x-128*s,gy-66*s],[x-96*s,gy-86*s],[x+96*s,gy-86*s],[x+128*s,gy-66*s],[x+118*s,gy-72*s],[x-118*s,gy-72*s]];k.shape(r1,T,{w:1.7,one:1,hatch:{side:.55,gap:3.2,col:TD,op:.6}});
  k.shape(RC(x-74*s,gy-108*s,148*s,22*s),'#F1E6D6',{w:1.4,one:1});[-52,-18,18,52].forEach(dx=>k.shape(RC(x+dx*s-3*s,gy-108*s,6*s,22*s),V,{w:1,one:1}));
  const r2=[[x-118*s,gy-104*s],[x-80*s,gy-132*s],[x-30*s,gy-140*s],[x+30*s,gy-140*s],[x+80*s,gy-132*s],[x+118*s,gy-104*s],[x+104*s,gy-110*s],[x-104*s,gy-110*s]];k.shape(r2,T,{w:1.8,one:1,hatch:{side:.55,gap:3.2,col:TD,op:.6}});
  let d='';for(let i=-9;i<=9;i++)d+=`M${R1(x+i*11*s)} ${R1(gy-139*s+Math.abs(i)*1.6*s)}l${R1(i*1.4*s)} ${R1(26*s)}`;k.add(`<path d="${d}" stroke="${TD}" stroke-width="1" opacity=".55"/>`);
  if(k.env.snow)k.side(()=>{capLine(k,r2.slice(0,6),7*s);capLine(k,r1.slice(0,4),5*s)})}
// the souvenir kiosk: a striped awning, bandanas on a line, a Shinkansen plush and a lucky cat on the counter
function ttKiosk(k,x,gy){
  k.add(`<ellipse cx="${x}" cy="${gy+3}" rx="88" ry="8" fill="${C.ink}" opacity=".12"/>`);
  [-74,74].forEach(dx=>k.shape(RC(x+dx-3,gy-124,6,124),C.woodD,{w:1.5,one:1}));
  k.shape(RC(x-80,gy-62,160,62),'#F6D6A8',{w:2,hatch:{side:.7,gap:4,col:'#D9B07C',op:.5}});k.shape(RC(x-86,gy-70,172,10),C.woodD,{w:1.7,one:1});
  k.line([[x-76,gy-30],[x+76,gy-30]],1.1,'#D9B07C');
  O.awning(k,x-88,gy-138,176,18,'#EC6B42','#FFF4EA');
  // the bandana line
  k.line([[x-72,gy-112],[x,gy-106],[x+72,gy-112]],1.1,C.ink,{op:.85});
  [[-56,'#EC6B42','#FFF4EA'],[-28,'#7FB86A','#FFFFFF'],[0,'#E2563D','#FCE59A'],[28,'#EC6B42','#FFF4EA'],[56,'#8FC1E8','#FFFFFF']].forEach(([dx,c1,c2],i)=>{const bx=x+dx,by=gy-110+Math.abs(dx)*-.08+(i===2?2:0);
    k.shape([[bx-11,by],[bx+11,by],[bx,by+20]],c1,{w:1.2,one:1});k.add(`<path d="M${R1(bx-7)} ${R1(by+5)}h14M${R1(bx-4)} ${R1(by+11)}h8" stroke="${c2}" stroke-width="2.4" stroke-linecap="round"/>`);k.add(`<circle cx="${R1(bx-8)}" cy="${R1(by)}" r="1.6" fill="${C.ink}"/><circle cx="${R1(bx+8)}" cy="${R1(by)}" r="1.6" fill="${C.ink}"/>`)});
  // a Shinkansen plush (white, a blue stripe, the long nose) and a little lucky cat
  {const px=x-30,py=gy-72;k.shape([[px-30,py],[px-30,py-16],[px+4,py-18],[px+22,py-12],[px+34,py-2],[px+34,py]],'#FFFFFF',{w:1.6,one:1});k.shape([[px-30,py-6],[px+30,py-6],[px+33,py-2],[px-30,py-2]],'#5C8FD6',{w:.9,one:1,noline:1});
    k.shape([[px+6,py-15],[px+20,py-11],[px+16,py-8],[px+6,py-9]],'#9CC7EE',{w:1,one:1});k.add(`<circle cx="${px-18}" cy="${py-11}" r="1.6" fill="${C.ink}"/><circle cx="${px-8}" cy="${py-11}" r="1.6" fill="${C.ink}"/><path d="M${px-15} ${py-8}q2 2 4 0" fill="none" stroke="${C.ink}" stroke-width="1"/>`)}
  {const cx=x+40,cy=gy-72;k.shape(E(cx,cy-12,11,12,12),'#FFFFFF',{w:1.4,one:1});k.shape(E(cx,cy-28,10,9,12),'#FFFFFF',{w:1.4,one:1});k.shape([[cx-9,cy-33],[cx-8,cy-42],[cx-3,cy-36]],'#FFFFFF',{w:1,one:1});k.shape([[cx+9,cy-33],[cx+8,cy-42],[cx+3,cy-36]],'#FFFFFF',{w:1,one:1});
    k.shape([[cx+8,cy-22],[cx+14,cy-32],[cx+18,cy-28],[cx+12,cy-18]],'#FFFFFF',{w:1.2,one:1});k.add(`<path d="M${cx-4} ${cy-29}q1.4 -1.4 2.8 0M${cx+1.4} ${cy-29}q1.4 -1.4 2.8 0" fill="none" stroke="${C.ink}" stroke-width="1"/><path d="M${cx-8} ${cy-21}h16" stroke="#E2563D" stroke-width="2"/><circle cx="${cx}" cy="${cy-18}" r="2.2" fill="#F7D24E" stroke="${C.ink}" stroke-width=".8"/><circle cx="${cx}" cy="${cy-9}" r="4" fill="#F7D24E" stroke="${C.ink}" stroke-width=".9"/>`)}
  // a little postcard with a heart
  k.shape(RC(x+56,gy-90,16,18),'#FFF8EC',{w:1.1,one:1});O.heart(k,x+64,gy-81,3.4);
  if(k.env.lit)k.lamps.push({x,y:gy-124,s:.7,glass:[[x-6,gy-128],[x+6,gy-128],[x+4,gy-120],[x-4,gy-120]]});
  k.shape([[x-6,gy-128],[x+6,gy-128],[x+4,gy-120],[x-4,gy-120]],C.yellow,{w:1,one:1});
  if(k.env.snow)k.side(()=>capLine(k,[[x-90,gy-138],[x+90,gy-138]],7))}
function sqTokyoTower(k){const e=k.env;
  k.skyD(()=>{skyBand(k,1000,350);O.sun(k,150,84,28);O.cloud(k,330,96,22);O.cloud(k,880,150,16);O.bird(k,420,128,8);O.bird(k,442,138,6)},
    {W:1000,H:360,sun:[150,84,28],low:[880,300,32],moon:[160,88,24],clouds:[[330,96,22],[880,150,16],[90,200,14]],rainC:[[260,60,26],[760,50,28],[960,120,22]],birds:[[420,128,8],[442,138,6]],stars:52});
  // far city across the park
  k.fill([[0,330],[1000,326],[1000,400],[0,400]],'#E3EAF0',{dx:0,dy:0,sc:0});
  skyline(k,[[0,52,300,400,0],[48,40,276,400,2],[86,60,312,400,0],[150,34,262,400,1],[690,44,268,400,0],[730,60,300,400,2],[788,38,250,400,1],[824,64,290,400,0],[886,48,272,400,2],[930,70,306,400,0]],'#D6E0EA','#A8B6C4');
  // Tokyo Tower
  k.add(`<g class="pa-tk-tower" transform="${TTF}">`);ttTower(k);k.add('</g>');
  // the temple gate on the left, behind the hedge
  ttGate(k,232,404,1);
  // park trees in front of the tower's feet and round the plaza
  O.tree(k,438,412,1.05);O.tree(k,770,414,1.12,{col:C.leaf2});O.tree(k,330,418,.8,{col:'#A9D58A'});O.tree(k,880,420,.9);
  hedge(k,0,1000,426,22);
  // the paved plaza (where the dogs stand), the tiles in perspective
  {const pl=[[0,424],[1000,424],[1000,600],[0,600]];k.fill(pl,'#ECE2D2',{dx:0,dy:0,sc:0});
   const rows=[];let y=424,h=12;while(y<600){rows.push(y);y+=h;h*=1.16}let d='';
   rows.forEach(yy=>{d+=`M0 ${R1(yy+k.J(.6))}L1000 ${R1(yy+k.J(.6))}`});for(let i=-16;i<=16;i++){const xb=500+i*90,xt=500+i*28;d+=`M${R1(xt)} 424L${R1(xb)} 600`}
   let f='';rows.forEach((yy,i)=>{const nh=(rows[i+1]||600)-yy;if(i%2)f+=`<rect x="0" y="${R1(yy)}" width="1000" height="${R1(nh)}" fill="#E2D6C2" opacity=".5"/>`});
   k.add(f+`<path d="${d}" stroke="#C9B9A2" stroke-width="1.2" fill="none"/>`);k.pen([[0,425],[500,424],[1000,425]],false,{w:2})}
  // a manhole cover with a little tower on it (flat: dogs may walk over it), planters at the front corners, out past the floor band's ends
  {const mx=520,my=548;k.shape(E(mx,my,40,11,20),'#B9B1A7',{w:1.6,one:1});k.add(`<ellipse cx="${mx}" cy="${my}" rx="31" ry="8" fill="none" stroke="#8E867C" stroke-width="1.2"/>${[0,1,2,3,4].map(i=>{const t=i/5*Math.PI*2-Math.PI/2;return `<ellipse cx="${R1(mx+Math.cos(t)*6)}" cy="${R1(my+Math.sin(t)*2.2)}" rx="4" ry="1.8" fill="#F7B6C8" stroke="#8E867C" stroke-width=".8"/>`}).join("")}<circle cx="${mx}" cy="${my}" r="1.6" fill="#E0697F"/><path d="M${mx-24} ${my-2}h6M${mx+18} ${my+2}h6M${mx-18} ${my+4}h5M${mx+14} ${my-4}h5" stroke="#8E867C" stroke-width="1"/>`)}
  [[8,588,1],[994,588,.95]].forEach(([x,gy,s])=>{k.shape([[x-40*s,gy],[x+40*s,gy],[x+44*s,gy-34*s],[x-44*s,gy-34*s]],'#D8CFC2',{w:1.8,hatch:{side:.6,gap:4,col:'#B5AC9F',op:.5}});k.shape(RC(x-48*s,gy-40*s,96*s,8*s),'#C9C0B3',{w:1.5,one:1});O.bush(k,x,gy-38*s,.95*s);if(k.env.snow)k.side(()=>capLine(k,[[x-48*s,gy-40*s],[x+48*s,gy-40*s]],4))});
  O.sparkle(k,470,212,7);O.heart(k,764,236,6);
  // flower beds against the hedge, lamps at the ends
  fl(k,[[40,440,C.red],[66,446,C.yellow],[930,440,C.lav],[960,446,'#FFB3C7'],[300,436,C.yellow],[690,436,C.red]],4.6);
  O.lamp(k,34,448,.95);O.lamp(k,968,448,.95);
  k.ss(()=>{const so=k.so;seasonGround(k,[0,430,1000,598],so==='autumn'?60:30,[[150,320,262,450],[730,320,890,460]],0,1);
    if(so==='autumn')[[120,520,.4],[260,560,1.9],[700,540,.9],[860,580,2.4],[540,470,1.2]].forEach(([x,y,r],i)=>leafAt(k,x,y,6,r,AU[i%4][0],AU[i%4][1]));
    seasonDrift(k,[[300,200,1],[760,240,.9],[860,330,.85],[200,300,.8]]);if(so==='winter'&&!e.night)robin(k,96,428,1,1)});
  fxE(k,{sheen:[430,598],avoid:[[150,320,262,450],[730,320,890,460]],puddles:[[300,560,46,9],[720,580,40,8],[120,500,30,6]],patches:[[300,562,72,12],[720,582,62,11],[110,500,46,8],[500,440,60,7],[900,470,44,8]],flies:[[90,400],[930,402],[400,360],[820,380]]});
  // pigeons on the plaza edge
  if(!e.rain){[[110,470,1],[132,476,-1],[884,486,1]].forEach(([x,y,f])=>{const X=v=>R1(x+v*f);k.shape(E(x,y-6,9,6,12),'#B9BEC8',{w:1.3,one:1});k.shape(E(x+7*f,y-12,4.6,4.2,10),'#A2A8B4',{w:1.2,one:1});k.add(`<path d="M${X(11)} ${y-12}l${R1(3*f)} 1 ${R1(-3*f)} 1z" fill="${C.ink}"/><circle cx="${X(8)}" cy="${y-13}" r=".9" fill="${C.ink}"/><path d="M${X(-1)} ${y}v3M${X(2)} ${y}v3" stroke="#E8945A" stroke-width="1.3"/><path d="M${X(-4)} ${y-6}q4 -3 8 0" fill="none" stroke="#8C93A0" stroke-width="1"/>`)})}
  // the tappable spots: the stamp stand (left), the souvenir kiosk (right)
  {const g=k.cap(()=>stampStand(k,206,446,.95,'#E0713A','#B9572A'));hot(k,'data-hot','stamp','Station stamp',RC(160,278,92,176),g)}
  {const g=k.cap(()=>ttKiosk(k,756,452));hot(k,'data-hot','souvenir','Souvenir stand',RC(664,306,184,152),g)}
  k.hw(()=>{hwJack(k,256,452,.72);hwJack(k,708,458,.8);hwJack(k,690,466,.6);hwLanternString(k,724,330,900,330,10,4,.8)});
  k.lt(()=>{ltString(k,sagP(392,330,488,326,12,10),18);ltString(k,sagP(718,322,830,318,14,10),18);ltString(k,sagP(724,312,900,312,6,10),20)});
  k.ny(()=>{nyKado(k,148,450,.8,-1);nyShime(k,812,322,.9);nyKites(k,[[300,170,.9,0,260,420],[900,90,.8,1,880,420]])});
  O.tape(k,6,26,90,-24,'#F7B9C6');O.tape(k,920,568,80,-28,'#BDE7D2')}

/* ---------------- Ueno Park (Shinobazu pond) ---------------- */
// a big cherry tree leaning in from the edge: limbs, and the crown by season (pink blossom, green, momiji red, bare)
function unTree(k,x,gy,s,f){const so=k.env.season,X=v=>x+v*s*f;
  const th=[[X(-14),gy],[X(-10),gy-80*s],[X(0),gy-150*s],[X(10),gy-150*s],[X(14),gy-80*s],[X(20),gy]];k.shape(th,'#8A6A5A',{w:2,hatch:{side:f>0?.6:.3,gap:3.4,col:'#6E5246',op:.55}});
  k.line([[X(2),gy-20*s],[X(-2),gy-70*s],[X(4),gy-120*s]],1.2,'#6E5246');
  const br=[[[X(4),gy-130*s],[X(60),gy-200*s],[X(150),gy-232*s],[X(230),gy-224*s]],[[X(6),gy-150*s],[X(30),gy-250*s],[X(80),gy-320*s]],[[X(8),gy-110*s],[X(90),gy-150*s],[X(180),gy-150*s]],[[X(0),gy-150*s],[X(-30),gy-250*s],[X(-50),gy-310*s]]];
  br.forEach((b,i)=>k.line(b,(i===0?5:3.6)*s,'#6E5246',{amp:.5}));
    const cr=[[X(10),gy-296*s,96*s,48*s],[X(150),gy-244*s,96*s,44*s],[X(232),gy-214*s,58*s,30*s],[X(96),gy-176*s,82*s,34*s],[X(-14),gy-214*s,58*s,40*s]];
  k.add(`<g class="pa-we-sakura" data-bloom="${so}">`);
  if(so==='winter'){br.forEach(b=>{for(let i=1;i<b.length;i++)k.line([b[i],[b[i][0]+k.J(18),b[i][1]-16*s]],1.4,'#6E5246')});if(k.env.snow)br.forEach(b=>capLine(k,b.slice(0,3),3.4))}
  else cr.forEach(([cx,cy,rx,ry])=>{if(so==='spring'){jpPuffs(k,cx,cy,rx,ry,'#F9D3DE','#E9A2B8');jpBlossom(k,cx,cy,rx*.85,ry*.8,Math.round(rx*ry/420),1.2)}else if(so==='autumn'){jpPuffs(k,cx,cy,rx,ry,'#E2583E','#B83E2C');jpMomiji(k,cx,cy,rx*.85,ry*.7,6)}else jpPuffs(k,cx,cy,rx,ry,C.leaf2,C.leafD)});
  k.add('</g>');return br}
// lotus on the pond: big round pads with a notch, flowers in summer, seed pods in autumn, dry bent stalks in winter
function lotus(k,x,y,r,kind){const so=k.env.season;
  if(so==='winter'){k.line([[x,y],[x+k.J(2),y-r*1.4],[x+r*.6,y-r*1.1]],1.3,'#9C8A6A');k.add(`<ellipse cx="${R1(x)}" cy="${R1(y+1)}" rx="${R1(r*.6)}" ry="${R1(r*.16)}" fill="none" stroke="#FFFFFF" stroke-width="1.1" opacity=".7"/>`);return}
  const col=so==='autumn'?'#BFB26A':so==='spring'?'#B8DC8E':'#8FC27A',cd=so==='autumn'?'#9A8A4A':'#6FA45E',rr=so==='spring'?r*.7:r;
  k.add(`<path d="M${R1(x)} ${R1(y)}L${R1(x+rr)} ${R1(y-rr*.1)}A${R1(rr)} ${R1(rr*.36)} 0 1 1 ${R1(x+rr*.7)} ${R1(y-rr*.32)}Z" fill="${col}" stroke="${C.ink}" stroke-width="1"/><path d="M${R1(x-rr*.5)} ${R1(y)}q${R1(rr*.5)} ${R1(-rr*.1)} ${R1(rr)} 0" fill="none" stroke="${cd}" stroke-width=".9"/>`);
  if(kind===1&&so==='summer'){const fx=x+rr*.3,fy=y-rr*1.6;k.line([[fx,y-rr*.1],[fx+k.J(1),fy]],1.4,'#6FA45E');[[-1,0],[1,0],[0,-1]].forEach(([dx,dy])=>k.add(`<path d="M${R1(fx)} ${R1(fy)}q${R1(dx*7-3)} ${R1(dy*6-8)} ${R1(dx*4)} ${R1(-12+dy*2)}q${R1(dx*2+3)} ${R1(6)} ${R1(-dx*4)} ${R1(12-dy*2)}z" fill="#F7B6C8" stroke="${C.ink}" stroke-width=".9"/>`));k.add(`<circle cx="${R1(fx)}" cy="${R1(fy-4)}" r="2.4" fill="#F7D24E" stroke="${C.ink}" stroke-width=".7"/>`)}
  if(kind===1&&so==='autumn'){const fx=x+rr*.3,fy=y-rr*1.5;k.line([[fx,y-rr*.1],[fx+k.J(1),fy]],1.4,'#9A8A4A');k.shape([[fx-6,fy],[fx+6,fy],[fx+4,fy+6],[fx-4,fy+6]],'#A99060',{w:1,one:1});k.add(`<circle cx="${fx-2.4}" cy="${fy+2}" r=".9" fill="${C.ink}"/><circle cx="${fx+2.4}" cy="${fy+2}" r=".9" fill="${C.ink}"/>`)}}
// a swan pedal boat (white, a long neck, pink cheeks)
function swanBoat(k,x,y,s=1,f=1){const X=v=>x+v*s*f;k.add(`<ellipse cx="${x}" cy="${R1(y+4*s)}" rx="${R1(44*s)}" ry="${R1(6*s)}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".8"/>`);
  k.shape([[X(-38),y-10*s],[X(-30),y-26*s],[X(-6),y-28*s],[X(26),y-22*s],[X(34),y-8*s],[X(28),y+2*s],[X(-32),y+2*s]],'#FFFFFF',{w:1.9,hatch:{side:f>0?.62:.3,gap:3.6,col:'#C9D2DC',op:.55}});
  k.shape([[X(-24),y-28*s],[X(-22),y-40*s],[X(6),y-42*s],[X(8),y-28*s]],'#F6D3DC',{w:1.4,one:1});k.shape(RC(Math.min(X(-20),X(4)),y-40*s,24*s,4*s),'#E9A2B8',{w:1,one:1});
  k.line([[X(22),y-22*s],[X(30),y-42*s],[X(26),y-58*s],[X(34),y-66*s]],5.2*s,C.ink);k.line([[X(22),y-22*s],[X(30),y-42*s],[X(26),y-58*s],[X(34),y-66*s]],3.4*s,'#FFFFFF');
  k.shape(E(X(36),y-66*s,7*s,6*s,10),'#FFFFFF',{w:1.4,one:1});k.add(`<path d="M${R1(X(42))} ${R1(y-68*s)}l${R1(8*s*f)} ${R1(2*s)} ${R1(-8*s*f)} ${R1(3*s)}z" fill="${C.orange}" stroke="${C.ink}" stroke-width="1" stroke-linejoin="round"/><circle cx="${R1(X(37))}" cy="${R1(y-68*s)}" r="1.3" fill="${C.ink}"/><ellipse cx="${R1(X(34))}" cy="${R1(y-64*s)}" rx="2.4" ry="1.4" fill="${C.pink}" opacity=".7"/>`);
  k.line([[X(-14),y-14*s],[X(4),y-10*s],[X(14),y-16*s]],1.2,'#C9D2DC');if(k.env.snow)k.side(()=>capLine(k,[[X(-24),y-40*s],[X(6),y-42*s]],3))}
// the Benten hall on its island: an eight-sided red hall, a grey roof with a jewel on top, the causeway from the left
function unBenten(k,x,gy){const V='#E2563D',VD='#B83E2C',T='#6E7782',TD='#555D68';
  k.shape(blobP(x,gy+2,100,12,k.r,10,.18),'#C9D7A8',{w:1.4,one:1});
  k.shape([[x-260,gy+2],[x-96,gy-4],[x-96,gy+4],[x-260,gy+10]],C.stone,{w:1.3,one:1,hatch:{side:.6,gap:4,col:C.stoneD,op:.5}});
  k.shape(RC(x-48,gy-36,96,36),V,{w:1.6,one:1,hatch:{side:.66,gap:3,col:VD,op:.5}});[-30,-10,10,30].forEach(dx=>k.shape(RC(x+dx-6,gy-30,12,24),'#F3D9B8',{w:1,one:1}));
  k.shape(RC(x-56,gy-6,112,8),C.stone,{w:1.2,one:1});
  const rf=[[x-76,gy-34],[x-46,gy-56],[x-14,gy-64],[x+14,gy-64],[x+46,gy-56],[x+76,gy-34],[x+64,gy-40],[x-64,gy-40]];k.shape(rf,T,{w:1.7,one:1,hatch:{side:.55,gap:3,col:TD,op:.6}});
  k.line([[x,gy-64],[x,gy-74]],1.6);k.shape(E(x,gy-78,4,5,10),'#F7D24E',{w:1.1,one:1});
  [-90,90].forEach(dx=>{k.shape(RC(x+dx-2,gy-44,4,44),C.woodD,{w:1,one:1});mTree(k,x+dx*1.15,gy-6,.9,C.leaf2)});
  tinyLit(k,x-20,gy-18);tinyLit(k,x+20,gy-18);if(k.env.lit)k.glows.push([x-36,gy-30,72,10]);
  if(k.env.snow)k.side(()=>capLine(k,rf.slice(0,6),6))}
// the hanami spot: a blue picnic sheet with a bento box, a thermos, a water bowl for the dogs; petals or leaves on it by season
// the hanami spot: a little wooden deck out over the pond, behind the path's back line (x: its middle, y: its front edge on the path).
// On a spring day (no rain or snow) a picnic blanket is spread on it with the bento, the thermos, two cups and the dogs' water bowl; every other
// time it holds a bench with a folded blanket, so people food never sits where the dogs walk. The deck is drawn on the main stream (the same in
// every variant), what is on it on a stream of its own.
function unDeck(k,x,y){const e=k.env,so=e.season,bx0=x-84,bx1=x+84,by=y-56,fx0=x-102,fx1=x+102,lerp=(a,b,t)=>a+(b-a)*t;
  // two pilings down into the water at the front corners, and the deck's shadow on the water by the sides
  [fx0+8,fx1-8].forEach(px=>k.shape(RC(px-4,y-2,8,8),C.woodD,{w:1.2,one:1}));
  k.add(`<path d="M${bx0-4} ${by+4}L${fx0-6} ${y-4}M${bx1+4} ${by+4}L${fx1+6} ${y-4}" stroke="#86BDDE" stroke-width="3" opacity=".6"/>`);
  // the deck: boards across, a darker front board on the path's edge
  const top=[[bx0,by],[bx1,by],[fx1,y-4],[fx0,y-4]];k.shape(top,C.wood,{w:1.8,one:1,hatch:{side:.72,gap:4,col:C.woodD,op:.45}});
  let d='';for(let i=1;i<6;i++){const t=i/6,yy=lerp(by,y-4,t);d+=`M${R1(lerp(bx0,fx0,t)+2)} ${R1(yy)}L${R1(lerp(bx1,fx1,t)-2)} ${R1(yy)}`}k.add(`<path d="${d}" stroke="${C.woodD}" stroke-width="1.2" opacity=".8"/>`);
  k.shape(RC(fx0,y-5,fx1-fx0,7),C.woodD,{w:1.4,one:1});
  // the low rail round the back and the sides (open to the path), bamboo green like the pond rail
  const posts=[[bx0,by],[x-28,by],[x+28,by],[bx1,by],[lerp(bx0,fx0,.55),lerp(by,y-4,.55)],[lerp(bx1,fx1,.55),lerp(by,y-4,.55)]];
  let pd='';posts.forEach(([px,py])=>{pd+=`M${R1(px)} ${R1(py)}V${R1(py-26)}`});k.add(`<path d="${pd}" stroke="${C.woodD}" stroke-width="4" stroke-linecap="round"/>`);
  const rl=[[lerp(bx0,fx0,.55),lerp(by,y-4,.55)-22],[bx0,by-22],[bx1,by-22],[lerp(bx1,fx1,.55),lerp(by,y-4,.55)-22]];k.line(rl,2.6,'#B7C98A');k.line(rl,1,C.ink,{op:.6});
  if(e.snow)k.side(()=>capLine(k,[[bx0,by-22],[bx1,by-22]],4));
  k.own(rng(0x554e4452),()=>{const pic=so==='spring'&&e.time==='day'&&!e.rain&&!e.snow,cy=y-28;k.add(`<g data-hanami="${pic?'picnic':'bench'}">`);
    if(pic){// the picnic: a blue blanket, the bento (two tiers), the thermos, two cups, the dogs' water bowl
      const P=[[x-70,cy-16],[x+64,cy-20],[x+78,cy+16],[x-82,cy+20]];k.shape(P,'#8FB8E8',{w:1.6,one:1,hatch:{gap:9,col:'#6E98CC',op:.5,w:1.3}});
      let s='';for(let i=1;i<5;i++){const t=i/5;s+=`M${R1(lerp(P[0][0],P[1][0],t))} ${R1(lerp(P[0][1],P[1][1],t))}L${R1(lerp(P[3][0],P[2][0],t))} ${R1(lerp(P[3][1],P[2][1],t))}`}k.add(`<path d="${s}" stroke="#FFFFFF" stroke-width="1.5" opacity=".55"/>`);
      k.shape(RC(x-52,cy-6,32,11),'#E04A3C',{w:1.4,one:1});k.shape(RC(x-52,cy-14,32,8),'#3E3533',{w:1.3,one:1});k.add(`<path d="M${x-36} ${cy-14}v19" stroke="#F7D24E" stroke-width="2"/>`);
      k.shape(RC(x-4,cy-22,12,24),'#9CCB80',{w:1.3,one:1,hatch:{side:.6,gap:3,col:'#6FA45E',op:.5}});k.shape(RC(x-5,cy-26,14,5),'#FFFFFF',{w:1.1,one:1});
      [[x+20,cy+2],[x+32,cy+6]].forEach(([qx,qy])=>k.shape([[qx-4.5,qy-9],[qx+4.5,qy-9],[qx+3.6,qy],[qx-3.6,qy]],'#FFF8EC',{w:1,one:1}));
      k.shape(E(x+56,cy+10,13,4.4,14),'#B9D3F2',{w:1.4,one:1});k.add(`<ellipse cx="${x+56}" cy="${cy+9}" rx="8.6" ry="2.2" fill="#DCEFFC" stroke="#8FB0D6" stroke-width=".8"/>`)}
    else{// the bench, its back to us (facing the pond), with a folded blanket on it (not in the rain)
      const gy=y-14,s=.82,X=v=>x+v*s,Y=v=>gy+v*s;
      k.shape(RC(X(-56),Y(-46),112*s,8*s),C.wood,{w:1.6});k.shape(RC(X(-56),Y(-60),112*s,8*s),C.wood,{w:1.6});k.shape(RC(X(-56),Y(-30),112*s,7*s),C.woodD,{w:1.5});
      [-48,44].forEach(dx=>{k.line([[X(dx),Y(-24)],[X(dx),Y(-10)]],2.8,C.ink);k.line([[X(dx+2),Y(-64)],[X(dx+2),Y(-30)]],2.4,C.ink)});
      if(!e.rain){k.shape([[X(-40),Y(-38)],[X(-8),Y(-38)],[X(-10),Y(-30)],[X(-38),Y(-30)]],so==='spring'?'#8FB8E8':'#E9B9C4',{w:1.1,one:1});k.add(`<path d="M${R1(X(-36))} ${R1(Y(-34))}h${R1(24*s)}" stroke="#FFFFFF" stroke-width="1.5"/>`)}
      if(e.snow)k.side(()=>capLine(k,[[X(-58),Y(-60)],[X(58),Y(-60)]],4))}
    k.add('</g>');
    if(so==='spring'&&!e.rain)[[x-66,y-12,.4],[x-20,y-8,1.9],[x+30,y-40,.9],[x+70,y-14,2.4],[x-50,y-44,1.2]].forEach(([px,py,r],i)=>petalAt(k,px,py,4,r,PET[i%3]));
    else if(so==='autumn')[[x-66,y-12,.4],[x+10,y-10,1.9],[x+72,y-30,.9]].forEach(([px,py,r],i)=>momijiAt(k,px,py,5.4,r,MOMI[i%4]))})}
function sqUeno(k){const e=k.env,so=k.env.season;
  k.skyD(()=>{skyBand(k,1000,300);O.sun(k,860,74,28);O.cloud(k,520,70,22);O.cloud(k,300,120,16);O.bird(k,640,110,8);O.bird(k,662,120,6)},
    {W:1000,H:310,sun:[860,74,28],low:[330,236,34],moon:[860,78,24],clouds:[[520,70,22],[300,120,16],[760,160,14]],rainC:[[180,40,26],[620,30,28],[900,90,22]],birds:[[640,110,8],[662,120,6]],stars:46});
  // the far shore: city roofs and the park's trees
  k.fill([[0,250],[1000,246],[1000,300],[0,300]],'#E3EAF0',{dx:0,dy:0,sc:0});
  skyline(k,[[260,50,214,292,0],[310,36,232,292,2],[600,44,206,292,1],[648,60,226,292,0],[714,40,236,292,2]],'#D6E0EA','#A8B6C4');
  {const tl=[];for(let x=-10;x<=1010;x+=30)tl.push([x,274-k.r()*20]);k.shape(tl.concat([[1010,300],[-10,300]]),'#A9CC8E',{w:1.4,one:1,lcol:C.graph,hatch:{side:.4,gap:5,col:'#86B06E',op:.45}})}
  // the pond
  k.add(`<rect y="296" width="1000" height="120" fill="${C.water}"/><rect y="296" width="1000" height="16" fill="#A9D3EC" opacity=".6"/>`);k.pen([[0,297],[500,296],[1000,297]],false,{w:1.5,col:C.graph});
  let wv='';for(let i=0;i<30;i++){const x=k.r()*980,y=318+k.r()*90;wv+=`M${R1(x)} ${R1(y)}q6 -4 12 0t12 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.4" stroke-linecap="round"/>`);
  k.fx(()=>{if(e.rain)ripples(k,0,1000,306,410,26);waterGlints(k,e.night?860:330,304,404)});
  if(so==='winter')k.ss(()=>iceEdge(k,0,1000,()=>404,-1));
  unBenten(k,560,300);
  // lotus beds on both sides of the pond, clear of the boats and the hanami deck
  [[30,330,15,1],[70,350,18,0],[110,326,13,0],[58,384,20,1],[120,372,16,0],[160,396,14,1],[200,360,13,0],[872,352,18,1],[930,334,15,0],[960,380,20,1],[900,392,16,0],[852,400,13,1]].forEach(([x,y,r,f])=>lotus(k,x,y,r,f));
  swanBoat(k,330,366,.95,1);swanBoat(k,462,380,.7,-1);duck(k,526,396,.7,'#FFFFFF');duck(k,556,402,.55,'#E3C48F');
  // the low stone kerb and the bamboo rail along the water
  k.shape(RC(0,408,1000,12),C.stone,{w:1.7,one:1,hatch:{side:.6,gap:4,col:C.stoneD,op:.5}});
  {let d='';for(let x=24;x<1000;x+=64)d+=`M${x} 420V394`;k.add(`<path d="${d}" stroke="${C.woodD}" stroke-width="4" stroke-linecap="round"/>`);k.line([[0,398],[1000,398]],2.6,'#B7C98A');k.line([[0,398],[1000,398]],1,C.ink,{op:.6})}
  if(e.snow)k.side(()=>capLine(k,[[0,408],[1000,408]],6));
  // the path round the pond (the floor band)
  {const fp=[[0,420],[1000,420],[1000,600],[0,600]];k.fill(fp,'#EFDDBA',{dx:0,dy:0,sc:0});k.pen([[0,421],[500,420],[1000,421]],false,{w:2.1});
   [[150,540,140,16],[600,580,180,14],[860,560,120,14]].forEach(q=>k.fill(E(q[0],q[1],q[2],q[3],12),'#E5CFA6',{op:.6}));
   let gr='';for(let i=0;i<70;i++){const x=k.r()*1000,y=430+k.r()*166;gr+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(.8+k.r()*1.2)}" fill="#C9AE84" opacity=".7"/>`}k.add(gr);
   k.fill([[0,420],[1000,420],[1000,436],[0,438]],'#E2CB9C',{dx:0,dy:0,op:.65});
   [[290,448,22,7],[350,452,18,6],[410,446,20,6],[470,452,16,5],[530,447,19,6],[590,451,17,5]].forEach(([x,y,rx,ry])=>k.shape(blobP(x,y,rx,ry,k.r,9,.22),'#DCD3C6',{w:1.3,one:1,hatch:{side:.6,gap:3.4,col:'#B5AC9F',op:.45}}));
   [[[0,532],[90,546],[190,574],[240,600],[0,600]],[[1000,540],[900,550],[800,578],[760,600],[1000,600]]].forEach(p=>{k.shape(p,C.grass,{w:1.8,one:1,hatch:{side:.5,gap:5,col:C.grass2,op:.5}})});
   tuftsE(k,0,240,546,598,22,[]);tuftsE(k,770,1000,552,598,22,[])}
  // the hanami deck over the pond, behind the path (its hit shape is added with the other spots below)
  unDeck(k,730,422);
  fl(k,[[40,566,C.red],[96,584,C.yellow],[150,590,C.lav],[860,580,'#FFB3C7'],[930,566,C.yellow],[960,592,C.red]],4.6);
  // the two big cherry trees lean in from the edges and roof the top of the scene
  k.own(rng(0x55454e4f),()=>{unTree(k,52,446,1,1);unTree(k,950,446,.96,-1)});
  // paper lanterns strung between the trees for hanami (spring), lit after dark
  if(so==='spring')k.ss(()=>{nyChochins(k,120,232,470,250,22,5,.85);nyChochins(k,530,250,890,236,22,5,.85)});
  k.ss(()=>{seasonGround(k,[0,428,1000,598],so==='spring'?50:so==='autumn'?50:30,[[610,320,850,430],[150,320,262,450]],0,1);
    if(so==='spring')[[100,470,.4],[260,520,1.9],[420,560,.9],[560,480,2.4],[600,540,1.2],[330,580,.2],[880,560,2.9],[760,590,1.4],[480,440,2]].forEach(([x,y,r],i)=>petalAt(k,x,y,4.4,r,PET[i%3]));
    else if(so==='autumn')[[90,470,.4],[200,530,1.9],[460,560,.9],[620,500,2.4],[900,540,1.2],[330,590,.2]].forEach(([x,y,r],i)=>momijiAt(k,x,y,5.6,r,MOMI[i%4]));
    seasonDrift(k,[[400,160,1],[620,200,.9],[260,330,.85],[780,300,.8]]);if(so==='winter'&&!e.night)robin(k,560,396,1,-1);if(so==='spring'&&!e.night&&!e.rain)butterfly(k,600,440,1,'#F9C6D4')});
  fxE(k,{sheen:[428,598],avoid:[[610,320,850,430]],puddles:[[420,560,46,9],[260,590,40,8],[900,600,30,6]],patches:[[420,562,72,12],[250,590,60,11],[900,590,46,8],[520,440,60,7],[80,470,44,8]],flies:[[160,330],[860,320],[400,340],[620,380]]});
  jpToro(k,300,422,.62);jpToro(k,600,422,.62);
  O.sparkle(k,430,180,7);O.note(k,600,150,11);
  // the tappable spots: the stamp stand (left), the hanami deck (back right, drawn above)
  {const g=k.cap(()=>stampStand(k,206,444,.95,'#D45A8A','#A8406A'));hot(k,'data-hot','stamp','Station stamp',RC(160,276,92,176),g)}
  hot(k,'data-hot','hanami','Hanami spot',RC(...HOT_E.ueno.hanami),'');
  k.hw(()=>{hwJack(k,250,452,.72);hwJack(k,640,420,.6);hwGhost(k,300,170,.75,22)});
  k.lt(()=>{ltString(k,sagP(120,250,470,262,20,14),22);ltString(k,sagP(530,262,890,250,20,14),22)});
  k.ny(()=>{nyKado(k,146,448,.8,-1);nyKites(k,[[420,90,.9,0,400,420],[720,120,.8,1,760,420]])});
  O.tape(k,6,26,90,-24,'#F7B9C6');O.tape(k,920,568,80,-28,'#BDE7D2')}

/* ---------------- Odaiba seaside ---------------- */
// the Rainbow Bridge: two white towers, the main cable, the hangers, a double deck; lights along the cable after dark
const RB={t1:380,t2:700,top:146,deck:282};
function rbCable(t){// the main cable, left anchorage (x 70) to right (x 1000): a sag in each span
  const pts=[];const seg=(x0,y0,x1,y1,sag)=>{for(let i=0;i<=16;i++){const u=i/16;pts.push([x0+(x1-x0)*u,y0+(y1-y0)*u+Math.sin(Math.PI*u)*sag])}};
  seg(60,RB.deck-2,RB.t1,RB.top+6,22);pts.pop();seg(RB.t1,RB.top+6,RB.t2,RB.top+6,112);pts.pop();seg(RB.t2,RB.top+6,1010,RB.deck-2,22);return pts}
function rbBridge(k){const W='#F4F2EE',WD='#C9CCD2',dk=RB.deck;
  // the deck: two levels, a dark gap between, the railing ticks
  k.shape([[-10,dk],[1010,dk],[1010,dk+10],[-10,dk+10]],W,{w:1.5,one:1,hatch:{gap:4,col:WD,op:.5}});k.shape([[-10,dk+16],[1010,dk+16],[1010,dk+24],[-10,dk+24]],W,{w:1.3,one:1});
  k.add(`<rect x="-10" y="${dk+10}" width="1020" height="6" fill="#8E96A3" opacity=".55"/>`);let d='';for(let x=0;x<1000;x+=14)d+=`M${x} ${dk}v-4`;k.add(`<path d="${d}" stroke="${C.ink}" stroke-width=".8" opacity=".55"/>`);
  // piers into the water
  [[RB.t1,dk+24],[RB.t2,dk+24]].forEach(([x,y])=>k.shape(RC(x-26,y,52,20),C.stone,{w:1.4,one:1,hatch:{side:.6,gap:3.6,col:C.stoneD,op:.5}}));
  // hangers then the cable
  const cb=rbCable();let h='';cb.forEach(([x,y])=>{if(x>RB.t1+6&&x<RB.t2-6||x<RB.t1-6||x>RB.t2+6)h+=`M${R1(x)} ${R1(y)}V${dk}`});k.add(`<path d="${h}" stroke="${C.ink}" stroke-width=".8" opacity=".6"/>`);
  k.line(cb,2.2,C.ink,{amp:.3,step:14});
  // the towers: two legs, three cross beams, a cap
  [RB.t1,RB.t2].forEach(x=>{[-1,1].forEach(sg=>k.shape([[x+sg*20-5,dk+24],[x+sg*14-4,RB.top],[x+sg*14+4,RB.top],[x+sg*20+5,dk+24]],W,{w:1.7,one:1,hatch:{side:sg>0?.3:.62,gap:3,col:WD,op:.55}}));
    [[RB.top+4,10],[RB.top+52,9],[dk-30,8]].forEach(([y,h])=>{const hw=14+(y-RB.top)*.06+6;k.shape(RC(x-hw,y,hw*2,h),W,{w:1.4,one:1});k.add(`<path d="M${R1(x-hw+4)} ${R1(y+h/2)}h${R1(hw*2-8)}" stroke="${WD}" stroke-width="1.4"/>`)});
    k.shape(RC(x-22,RB.top-6,44,8),'#E7E3DC',{w:1.3,one:1});
    if(k.env.snow)k.side(()=>capLine(k,[[x-23,RB.top-6],[x+23,RB.top-6]],3))});
  // lights: along the cable and on the tower tops after dark (white, a rainbow hint with the Winter Lights)
  const L=k.env.lit;if(L){let s='';cb.forEach(([x,y],i)=>{if(i%2)return;const c=k.env.lt?LTC[i%5]:'#FFF6D8';s+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="2.2" fill="${c}" opacity="${R1(.95*L)}"/>`});
    for(let x=0;x<1000;x+=22)s+=`<circle cx="${x}" cy="${dk+4}" r="1.5" fill="#FFE7A0" opacity="${R1(.9*L)}"/>`;
    k.wl.push(s+`<path d="M${cb.map(q=>R1(q[0])+' '+R1(q[1])).join('L')}" fill="none" stroke="#FFF2C4" stroke-width="5" opacity="${R1(.22*L)}"/>`);
    [RB.t1,RB.t2].forEach(x=>{jpGlow(k,x,RB.top+40,40);jpGlow(k,x,RB.top-2,22)})}}
// a palm tree at the edge of the sand
function palm(k,x,gy,s=1,f=1){const X=v=>x+v*s*f,top=[X(26),gy-210*s];
  const tr=[];for(let i=0;i<=10;i++){const t=i/10;tr.push([x+(top[0]-x)*t+Math.sin(t*Math.PI)*-10*s*f,gy+(top[1]-gy)*t])}
  k.shape(tr.map(p=>[p[0]-7*s,p[1]]).concat(tr.slice().reverse().map(p=>[p[0]+7*s,p[1]])),C.trunk,{w:1.7,hatch:{side:.55,gap:3.6,col:C.trunkD,op:.55}});
  let d='';tr.forEach((p,i)=>{if(i&&i<10)d+=`M${R1(p[0]-7*s)} ${R1(p[1])}q${R1(7*s)} ${R1(4*s)} ${R1(14*s)} 0`});k.add(`<path d="${d}" fill="none" stroke="${C.trunkD}" stroke-width="1.2"/>`);
  const so=k.so,lc=so==='autumn'?'#B9C27A':so==='winter'?'#8FA88A':'#8CC07A',ld='#5E8F4E';
  [[-2.6,1],[-2,1.1],[-1.2,1],[-.5,.9],[.3,.8],[.9,1],[-3.1,.8]].forEach(([a,l])=>{const ex=top[0]+Math.cos(a)*90*s*l,ey=top[1]+Math.sin(a)*60*s*l+30*s,mx=top[0]+Math.cos(a)*50*s*l,my=top[1]+Math.sin(a)*44*s*l-6*s;
    const P=[top,[mx,my-8*s],[ex,ey],[mx+4*s,my+8*s]];k.shape(P,lc,{w:1.4,one:1,hatch:{side:.5,gap:3.4,col:ld,op:.55}});k.line([top,[mx,my],[ex,ey]],1,ld,{op:.8})});
  [[-6,8],[6,10],[0,14]].forEach(([dx,dy])=>k.add(`<circle cx="${R1(top[0]+dx*s)}" cy="${R1(top[1]+dy*s)}" r="${R1(5*s)}" fill="#A97E5A" stroke="${C.ink}" stroke-width="1"/>`));
  if(k.env.snow)k.side(()=>capLine(k,[[top[0]-40*s,top[1]+10*s],[top[0],top[1]-6*s],[top[0]+40*s,top[1]+10*s]],4))}
// a yakatabune (a lantern houseboat) out on the bay, its lanterns lit after dark
function yakata(k,x,y,s=1){k.add(`<ellipse cx="${x}" cy="${R1(y+5*s)}" rx="${R1(74*s)}" ry="${R1(5*s)}" fill="none" stroke="#fff" stroke-width="1.5" opacity=".8"/>`);
  k.shape([[x-70*s,y-10*s],[x+56*s,y-10*s],[x+78*s,y-22*s],[x+66*s,y+2*s],[x-62*s,y+3*s]],'#C9A07A',{w:1.8,one:1,hatch:{side:.6,gap:3.4,col:C.trunkD,op:.5}});
  k.line([[x-64*s,y-4*s],[x+64*s,y-4*s]],1.1,C.trunkD);
  k.shape(RC(x-56*s,y-32*s,104*s,22*s),'#FFF1D6',{w:1.5,one:1});let d='';for(let xx=x-46*s;xx<x+48*s;xx+=12*s)d+=`M${R1(xx)} ${R1(y-28*s)}v${R1(15*s)}`;k.add(`<path d="${d}" stroke="${C.woodD}" stroke-width="1.1"/>`);
  if(k.env.lit)for(let xx=x-50*s;xx<x+46*s;xx+=12*s)k.glows.push([xx,y-28*s,8*s,15*s]);
  const rf=[[x-66*s,y-30*s],[x-58*s,y-40*s],[x-20*s,y-44*s],[x+20*s,y-44*s],[x+58*s,y-40*s],[x+66*s,y-30*s]];k.shape(rf,'#6E7782',{w:1.5,one:1,hatch:{side:.55,gap:3,col:'#555D68',op:.55}});
  for(let i=0;i<8;i++){const lx=x-52*s+i*14.6*s,ly=y-29*s;k.line([[lx,ly],[lx,ly+2*s]],.8);k.add(`<ellipse cx="${R1(lx)}" cy="${R1(ly+6*s)}" rx="${R1(3.6*s)}" ry="${R1(4.4*s)}" fill="#E0473A" stroke="${C.ink}" stroke-width=".8"/>`);jpGlow(k,lx,ly+6*s,13*s)}
  k.line([[x+40*s,y-44*s],[x+40*s,y-58*s]],1.1);k.shape([[x+40*s,y-58*s],[x+52*s,y-55*s],[x+40*s,y-51*s]],'#F7D24E',{w:.9,one:1});
  if(k.env.snow)k.side(()=>capLine(k,rf.slice(0,6),3))}
// the sunset bench: a low boardwalk deck on the sand with a bench facing the bay and a little lamp
function obDeck(k,x,gy){k.add(`<ellipse cx="${x}" cy="${gy+6}" rx="86" ry="8" fill="${C.ink}" opacity=".1"/>`);
  k.shape([[x-80,gy-14],[x+80,gy-14],[x+86,gy+2],[x-86,gy+2]],C.wood,{w:1.8,one:1,hatch:{side:.7,gap:4,col:C.woodD,op:.5}});let d='';for(let i=-3;i<=3;i++)d+=`M${x+i*22} ${gy-14}l${i*1.2} 16`;k.add(`<path d="${d}" stroke="${C.woodD}" stroke-width="1.2"/>`);
  // the bench (its back to us, facing the water)
  k.shape(RC(x-56,gy-46,112,8),C.wood,{w:1.7});k.shape(RC(x-56,gy-60,112,8),C.wood,{w:1.7});k.shape(RC(x-56,gy-30,112,7),C.woodD,{w:1.6});
  [-48,44].forEach(dx=>{k.line([[x+dx,gy-24],[x+dx,gy-14]],3,C.ink);k.line([[x+dx+2,gy-64],[x+dx+2,gy-30]],2.6,C.ink)});
  // a folded beach towel on the bench and the lamp
  k.shape([[x-40,gy-38],[x-10,gy-38],[x-12,gy-30],[x-38,gy-30]],'#F7B9C6',{w:1.2,one:1});k.add(`<path d="M${x-36} ${gy-34}h22" stroke="#FFFFFF" stroke-width="1.6"/>`);
  k.line([[x+72,gy-14],[x+72,gy-92]],3,C.ink);k.shape([[x+64,gy-92],[x+80,gy-92],[x+77,gy-104],[x+67,gy-104]],C.yellow,{w:1.4,one:1});k.shape([[x+62,gy-104],[x+72,gy-112],[x+82,gy-104]],'#9AA7B8',{w:1.3,one:1});
  if(k.env.lit)k.lamps.push({x:x+72,y:gy-98,s:.7,gy:gy-14,glass:[[x+64,gy-92],[x+80,gy-92],[x+77,gy-104],[x+67,gy-104]]});
  if(k.env.snow)k.side(()=>{capLine(k,[[x-58,gy-60],[x+58,gy-60]],5);capLine(k,[[x-82,gy-14],[x+82,gy-14]],4)})}
// a sandcastle with a little flag
function sandcastle(k,x,gy,s=1){k.shape([[x-26*s,gy],[x-22*s,gy-16*s],[x+22*s,gy-16*s],[x+26*s,gy]],'#EBCF95',{w:1.5,one:1,hatch:{side:.6,gap:3.4,col:'#D2B070',op:.5}});
  [[-14,10],[0,16],[14,10]].forEach(([dx,h])=>{k.shape(RC(x+dx*s-6*s,gy-16*s-h*s,12*s,h*s),'#F2DCA6',{w:1.3,one:1});let d='';for(let i=0;i<3;i++)d+=`M${R1(x+dx*s-6*s+i*4*s)} ${R1(gy-16*s-h*s)}h${R1(2*s)}v${R1(-3*s)}h${R1(-2*s)}z`;k.add(`<path d="${d}" fill="#F2DCA6" stroke="${C.ink}" stroke-width=".8"/>`)});
  k.line([[x,gy-35*s],[x,gy-48*s]],1.1);k.shape([[x,gy-48*s],[x+10*s,gy-45*s],[x,gy-42*s]],C.red,{w:.9,one:1});k.add(`<path d="M${R1(x-3*s)} ${R1(gy-6*s)}q3 -6 6 0" fill="${C.ink}" opacity=".6"/>`)}
function shell(k,x,y,s=1,col='#F9D3DE'){k.add(`<path d="M${R1(x-6*s)} ${R1(y)}q${R1(6*s)} ${R1(-12*s)} ${R1(12*s)} 0z" fill="${col}" stroke="${C.ink}" stroke-width="1"/><path d="M${x} ${R1(y)}v${R1(-7*s)}M${R1(x-3*s)} ${R1(y)}l${R1(1.4*s)} ${R1(-5.6*s)}M${R1(x+3*s)} ${R1(y)}l${R1(-1.4*s)} ${R1(-5.6*s)}" stroke="${C.ink}" stroke-width=".7" opacity=".7"/>`)}
function starfish(k,x,y,s=1,rot=0){let d='';for(let j=0;j<10;j++){const a=rot-Math.PI/2+j*Math.PI/5,rr=(j%2?3.4:9)*s;d+=(j?'L':'M')+R1(x+Math.cos(a)*rr)+' '+R1(y+Math.sin(a)*rr*.6)}k.add(`<path d="${d}Z" fill="#F8A95E" stroke="${C.ink}" stroke-width="1" stroke-linejoin="round"/>`)}
function sqOdaiba(k){const e=k.env,so=k.env.season;
  k.skyD(()=>{skyBand(k,1000,300);O.sun(k,170,86,30);O.cloud(k,560,70,22);O.cloud(k,860,120,18);O.bird(k,300,140,8);O.bird(k,322,150,6)},
    {W:1000,H:310,sun:[170,86,30],low:[226,236,40],moon:[840,84,24],clouds:[[560,70,22],[860,120,18],[420,150,14]],rainC:[[200,40,28],[640,30,26],[930,60,24]],birds:[[300,140,8],[322,150,6]],stars:50});
  // a lovely dusk: long warm streaks behind the city and a sun-path on the water (drawn in the side stream, so the base stays the same)
  if(e.time==='dusk'&&!e.rain)k.side(()=>{k.sky.push(k.cap(()=>{const g=glowGrad(k,'#FFB27A','odd');k.add(`<ellipse cx="226" cy="250" rx="420" ry="140" fill="url(#${g})" opacity=".8"/>`);let d='';for(let i=0;i<10;i++){const y=170+i*12+k.J(3),x=40+k.r()*200,l=200+k.r()*360;d+=`M${R1(x)} ${R1(y)}h${R1(l)}`}k.add(`<path d="${d}" stroke="#FFD6A8" stroke-width="3.4" stroke-opacity=".55" stroke-linecap="round"/>`)}))});
  // the city across the bay, with a tiny Tokyo Tower among the towers
  k.fill([[0,252],[1000,248],[1000,300],[0,300]],'#E3EAF0',{dx:0,dy:0,sc:0});
  skyline(k,[[0,40,214,296,0],[36,52,236,296,2],[84,34,198,296,1],[118,46,226,296,0],[206,44,206,296,2],[250,60,232,296,0],[310,38,190,296,1],[438,54,222,296,0],[492,36,200,296,2],[528,64,238,296,0],[600,40,212,296,1],[760,56,228,296,0],[816,40,204,296,2],[856,60,236,296,0],[918,46,214,296,1],[960,50,240,296,0]],'#D6E0EA','#A8B6C4');
  {const x=168,b=296;k.add(`<path d="M${x-12} ${b}L${x-3} ${b-60}L${x-1} ${b-82}L${x+1} ${b-82}L${x+3} ${b-60}L${x+12} ${b}" fill="none" stroke="#E87C52" stroke-width="2.2" stroke-linejoin="round"/><path d="M${x-8} ${b-22}h16M${x-5} ${b-44}h10" stroke="#E87C52" stroke-width="1.6"/><rect x="${x-6}" y="${b-62}" width="12" height="5" fill="#F4EEE6" stroke="#E87C52" stroke-width="1"/>`);
   if(e.lit)k.wl.push(`<path d="M${x-12} ${b}L${x-3} ${b-60}L${x-1} ${b-82}L${x+1} ${b-82}L${x+3} ${b-60}L${x+12} ${b}" fill="none" stroke="#FFB45A" stroke-width="3" opacity="${R1(.9*e.lit)}"/>`)}
  // the bay
  k.add(`<rect y="296" width="1000" height="124" fill="${C.water}"/><rect y="296" width="1000" height="20" fill="#A9D3EC" opacity=".7"/>`);k.pen([[0,297],[500,296],[1000,297]],false,{w:1.6,col:C.graph});
  let wv='';for(let i=0;i<40;i++){const x=k.r()*980,y=322+k.r()*84;wv+=`M${R1(x)} ${R1(y)}q7 -6 14 0t14 0`}k.add(`<path d="${wv}" fill="none" stroke="#86BDDE" stroke-width="1.6" stroke-linecap="round"/>`);
  k.fx(()=>{if(e.rain)ripples(k,0,1000,312,410,26);waterGlints(k,e.night?840:226,306,408)});
  rbBridge(k);
  yakata(k,560,350,.9);
  {const bx=880,by=336;k.shape([[bx-26,by],[bx+26,by],[bx+20,by+10],[bx-20,by+10]],C.red,{w:1.6});k.line([[bx,by],[bx,by-46]],1.5);k.shape([[bx+2,by-44],[bx+24,by-4],[bx+2,by-4]],'#FFFFFF',{w:1.3,one:1});k.shape([[bx-2,by-36],[bx-20,by-4],[bx-2,by-4]],'#FFD8E0',{w:1.3,one:1})}
  // the shore: foam lines, wet sand, then the dry sand (the floor band)
  {const sh=x=>412+per(x*1.2,[[5,2,.6],[3,5,1.4]]),top=[];for(let x=0;x<=1000;x+=20)top.push([x,sh(x)]);
   k.add(`<path d="${smooth(top,false)}L1000 600L0 600Z" fill="${C.sand}"/>`);k.add(`<path d="${smooth(top.map(([x,y])=>[x,y+10]),false)}L1000 ${R1(sh(1000)+30)}L0 ${R1(sh(0)+30)}Z" fill="${C.sandD}" opacity=".55"/>`);
   k.line(top,2.4,'#FFFFFF',{amp:.6});k.line(top,1.3,C.ink,{op:.7,amp:.5});k.line(top.map(([x,y])=>[x,y-7]),1.4,'#FFFFFF',{op:.75,amp:.8,dash:'18 10'});
   let rp='';for(let i=0;i<46;i++){const x=k.r()*980,y=450+k.r()*140;rp+=`M${R1(x)} ${R1(y)}q8 -3 16 0`}k.add(`<path d="${rp}" fill="none" stroke="${C.sandD}" stroke-width="1.6" stroke-linecap="round"/>`);
   let dt='';for(let i=0;i<60;i++)dt+=`<circle cx="${R1(k.r()*1000)}" cy="${R1(440+k.r()*158)}" r="${R1(.7+k.r()*1.1)}" fill="#D2B070" opacity=".75"/>`;k.add(dt);
   // paw prints wandering along the sand
   let pw='';[[300,560],[326,548],[352,540],[380,528],[408,520],[436,506],[464,498]].forEach(([x,y],i)=>{const o=i%2?6:-6;pw+=`<ellipse cx="${x}" cy="${y+o}" rx="3.4" ry="2.6" fill="#D9BC82"/><circle cx="${x-3}" cy="${y+o-4}" r="1.2" fill="#D9BC82"/><circle cx="${x}" cy="${y+o-5}" r="1.2" fill="#D9BC82"/><circle cx="${x+3}" cy="${y+o-4}" r="1.2" fill="#D9BC82"/>`});k.add(pw)}
  shell(k,140,500,1);shell(k,620,566,.9,'#FFF1D6');starfish(k,860,560,1,.3);shell(k,540,470,.8,'#F7B6C8');
  {let sw='';[[260,440],[600,446],[780,486],[380,452]].forEach(([x,y])=>{sw+=`M${x} ${y}q8 -6 16 -2t14 4M${x+4} ${y+3}q10 -4 20 0`});k.add(`<path d="${sw}" fill="none" stroke="#7FA86A" stroke-width="2" stroke-linecap="round" opacity=".85"/>`)}
  // driftwood washed up on the wet sand at the water's edge (behind the floor band's back line)
  {const x=884,y=421,s=.8,P=[[-56,0],[-50,-10],[40,-14],[58,-6],[52,4],[-48,6]].map(([u,v])=>[x+u*s,y+v*s]);k.shape(P,'#CDB79A',{w:1.5,one:1,hatch:{side:.6,gap:3.6,col:'#A99478',op:.5}});k.line([[x-32,y-3],[x+24,y-6]],1,'#A99478');k.add(`<ellipse cx="${x+8}" cy="${y-3}" rx="4" ry="2" fill="none" stroke="#A99478" stroke-width="1"/>`)}
  shell(k,330,590,.9,'#F9D3DE');shell(k,700,520,.7,'#FFFFFF');starfish(k,60,590,.8,1.2);
  // the palms at the two ends, a beach umbrella (summer, left) or a windbreak (winter, right), thrift on the dune (spring); the sandcastle sits
  // at the water's edge: all of them on the band's back line or past its ends, so no dog stands on them
  palm(k,40,470,1,1);palm(k,964,474,.95,-1);
  sandcastle(k,126,427,.8);
  k.ss(()=>{if(so==='winter')windbreak(k,846,428,84,40);else if(so==='spring')[[30,440],[70,430],[930,438],[960,446]].forEach(([x,y])=>thrift(k,x,y,1));
    else if(so==='autumn')seasonGround(k,[0,440,1000,598],30,[[700,360,880,470],[150,300,262,452]],0,1);seasonDrift(k,[[420,200,1],[640,240,.9],[300,330,.85],[880,330,.8]])});
  if(so==='summer'){const x=96,gy=428;k.line([[x,gy],[x+6,gy-120]],3,C.ink);const cn=[[x-58,gy-100],[x+6,gy-136],[x+70,gy-100]];k.shape(cn.concat([[x+50,gy-96],[x+28,gy-100],[x+6,gy-94],[x-16,gy-100],[x-38,gy-96]]),C.red,{w:1.8,one:1});
    k.add(`<path d="M${x+6} ${gy-136}L${x-16} ${gy-100}M${x+6} ${gy-136}L${x+28} ${gy-100}" stroke="#FFFFFF" stroke-width="5" opacity=".85"/>`);
    if(e.snow)k.side(()=>capLine(k,cn,4))}
  fxE(k,{sheen:[440,598],avoid:[[700,360,880,470]],puddles:[[420,560,46,9],[700,590,40,8]],patches:[[420,562,72,12],[700,590,62,11],[260,470,46,8],[860,470,44,8]],flies:[]});
  O.sparkle(k,640,190,7);O.heart(k,250,150,6);
  if(!e.night&&!e.rain){gull(k,610,452,.8,1);[[420,120,9],[452,104,7]].forEach(([x,y,s])=>O.bird(k,x,y,s))}
  // the tappable spots: the stamp stand (left), the sunset bench (back right)
  {const g=k.cap(()=>stampStand(k,206,450,.95,'#3F78B8','#2E5C92'));hot(k,'data-hot','stamp','Station stamp',RC(160,282,92,176),g)}
  {const g=k.cap(()=>obDeck(k,750,454));hot(k,'data-hot','sunset','Sunset bench',RC(662,336,176,128),g)}
  k.hw(()=>{hwJack(k,252,458,.72);hwJack(k,690,462,.7);hwJack(k,712,468,.55)});
  k.lt(()=>{ltString(k,sagP(10,300,90,280,6,8),18);ltString(k,sagP(700,410,860,410,10,12),18)});
  k.ny(()=>{nyKado(k,146,454,.8,-1);nyKites(k,[[520,120,.9,0,480,440],[760,90,.8,1,720,440]])});
  O.tape(k,6,26,90,-24,'#F7B9C6');O.tape(k,920,568,80,-28,'#BDE7D2')}

/* ---------------- the scene API ---------------- */
// the hot-spot boxes and floor band per scene (also published as PA.TOKYO_E for the TRAVEL lane)
const HOT_E={tokyotower:{stamp:[160,278,92,176],souvenir:[664,306,184,152]},ueno:{stamp:[160,276,92,176],hanami:[624,326,212,98]},odaiba:{stamp:[160,282,92,176],sunset:[662,336,176,128]}};
// [y0, y1, x0, x1], the same order as world D's data-floor
const FLOOR_E={tokyotower:[424,590,60,940],ueno:[424,590,60,940],odaiba:[428,590,60,940]};
const MINE_E={tokyotower:['Tokyo Tower',sqTokyoTower],ueno:['Ueno Park',sqUeno],odaiba:['Odaiba Seaside',sqOdaiba]};
function frameE(name,label,body,env){
  const k=kit(hashS('pwe-'+name));lighten(k);k.env=env||DEF_ENV;k.so=k.env.ssn;k.xl=[];k.rc=recolorFn(k.env,'out');const pp=paperDefs(k,1000,600);
  body(k);
  const fb=FLOOR_E[name],ex=(k.env.def?'':` data-time="${k.env.time}" data-weather="${k.env.weather}"${k.env.ssn?` data-season="${k.env.ssn}"`:''}`)+(k.env.hw?' data-halloween="1"':'')+wnAttrs(k.env)+` data-floor="${fb.join(',')}"`;
  return assemble(k,pp,1000,`<svg class="pa-wc-scene pa-we-scene pa-we-${name}" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${label}${k.env.def?'':`, ${k.env.time}, ${k.env.weather}${k.env.ssn?', '+k.env.ssn:''}`}"${ex}>`,false);
}
const cacheE={};
const freshE=s=>{const suf='x'+(++_n);return s.replace(/pwe(\d+)/g,m=>m+suf)};
function renderSceneE(name,o){o=o||{};if(o.snow===true&&!WEATHERS.includes(o.weather))o=Object.assign({},o,{weather:'snow'});// o.snow: the Snow Days flag reads as snowy weather
  const env=mkEnv(o),key=name+'|'+env.time+'|'+env.weather+'|'+env.season+(env.hw?'|hw':'')+wnKey(env);if(cacheE[key])return freshE(cacheE[key]);
  const s=frameE(name,MINE_E[name][0],k=>MINE_E[name][1](k,o),env);cacheE[key]=s;return s}
PA.TOKYO_E={floor:FLOOR_E,hot:HOT_E};

/* ======================= API (wraps worlds A to D) ======================= */
Object.keys(MINE_E).forEach(n=>{MINE[n]=o=>renderSceneE(n,o)});
PROPS.ekistamp=o=>WB.ekistamp(o);PROPS.luckycat=o=>WB.luckycat(o);
WB.ITEMS.forEach(n=>{ITEMS[n]=()=>WB.item(n)});
const prevScene=PA.scene,prevProp=PA.prop,prevItem=PA.item,prevPostcard=PA.postcard;
PA.scene=function(name,o){return MINE[name]?MINE[name](o||{}):(prevScene?prevScene.apply(this,arguments):'')};
// postcard: only the tokyo frame is drawn here ({ frame: 'tokyo', w, h, scene, caption, place, date, dogs, stamp }, default 300 x 200); every other call goes to world B unchanged
PA.prop=function(name,o){if(name==='postcard'){if(o&&o.frame==='tokyo')return WB.postcard(Math.max(60,+o.w||300),Math.max(40,+o.h||200),o);return prevProp?prevProp.apply(this,arguments):''}
  return PROPS[name]?PROPS[name](o||{}):(prevProp?prevProp.apply(this,arguments):'')};
PA.item=function(name,o){return ITEMS[name]?ITEMS[name](o||{}):(prevItem?prevItem.apply(this,arguments):'')};
// the photo mode's PawArt.postcard(w, h, o) takes the same frame: o.frame === 'tokyo'; every other call goes to world B unchanged
if(prevPostcard)PA.postcard=function(w,h,o){return o&&o.frame==='tokyo'?WB.postcard(w,h,o):prevPostcard.apply(this,arguments)};
PA.STAMP_KEYS=WB.KEYS.slice();
PA.WORLD_E_SCENES=Object.keys(MINE);PA.WORLD_E_PROPS=['ekistamp','luckycat','postcard'];PA.WORLD_E_ITEMS=Object.keys(ITEMS);
// v2.15: the Doggy Life Vest and the six run-track treasures (ITEMS_V215 above); every other name goes on to the previous PawArt.item unchanged
{const prevItem215=PA.item,V215I=WB.ITEMS215;PA.item=function(name,o){return V215I.includes(name)?WB.item(name):prevItem215.apply(this,arguments)};PA.V215_ITEMS=V215I.slice()}
// v2.17: the Crayon Crown and the Golden Collar (ITEMS_V217); every other name goes on unchanged
{const prevItem217=PA.item,V217I=WB.ITEMS217;PA.item=function(name,o){return V217I.includes(name)?WB.item(name):prevItem217.apply(this,arguments)};PA.V217_ITEMS=V217I.slice()}
// v2.18 Fun Fair (V218.md 9): the sticker items (ITEMS_V218) and the minigame props, PawArt.ffArt(name, o) (names in PawArt.FF_NAMES; o.c colour index, o.s shape, o.season, o.gold)
{const prevItem218=PA.item,V218I=WB.ITEMS218;PA.item=function(name,o){return V218I.includes(name)?WB.item(name):prevItem218.apply(this,arguments)};PA.V218_ITEMS=V218I.slice();PA.FF_NAMES=WB.FF_NAMES.slice();PA.ffArt=function(name,o){return WB.ff(name,o)||''}}
/* v2.14: the last layer on every world render. The game may pass { aria: 'label' } (the root svg's aria-label, translated) and/or
   { ariaMap: { 'English label': 'translated label' } } (any other aria-label inside the render: hotspots, parts) in the options object
   of any call (scene, walkStrip, prop, item, icon, bed, house, obstacle, collectible, postcard). Without them the result is returned
   untouched, so every old render stays byte-identical. The caches hold the English; only the returned string is changed. */
(function(){
  const ea=t=>String(t).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  const over=(svg,o)=>{
    if(typeof svg!=='string')return svg;
    if(typeof o.aria==='string'&&o.aria)svg=svg.replace(/^(\s*<svg\b[^>]*?\baria-label=")[^"]*(")/,(m,x,y)=>x+ea(o.aria)+y);
    const M=o.ariaMap;
    if(M&&typeof M==='object')svg=svg.replace(/(\baria-label=")([^"]*)(")/g,(m,x,v,y)=>Object.prototype.hasOwnProperty.call(M,v)&&typeof M[v]==='string'&&M[v]?x+ea(M[v])+y:m);
    return svg;
  };
  ['scene','walkStrip','prop','item','icon','bed','house','obstacle','collectible','postcard'].forEach(n=>{
    const f=PA[n];if(typeof f!=='function')return;
    PA[n]=function(){
      const r=f.apply(this,arguments);let o=null;
      for(let i=arguments.length-1;i>0;i--){const a=arguments[i];if(a&&typeof a==='object'&&(a.aria!==undefined||a.ariaMap!==undefined)){o=a;break}}
      return o?over(r,o):r;
    };
  });
})();
})();
