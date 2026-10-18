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
function rng(seed){let a=seed>>>0;return()=>{a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
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
  const pl=(P,amp)=>{let d='';for(let i=0;i<P.length;i++){const x=P[i][0]+J(amp),y=Math.min(P[i][1]+J(amp),h.cy||1e9);tr(x,y);d+=(i?'L':'M')+R1(x)+' '+R1(y)}return d};
  const st=(d,w,c,x='')=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${x}/>`;
  const h={J,r,acc,bb,texts,LW,tr,setJ(v){jm=v},
    // bucket fill that misses the outline, plus a jaggy outline that may not close
    shape(pts,fill,o={}){
      if(!pts.length||isNaN(pts[0][0]))return;
      const P=dense(pts,true,o.step||11),n=P.length;let cx=0,cy=0;P.forEach(q=>{cx+=q[0]/n;cy+=q[1]/n});
      const ox=o.ox??2.4+J(1),oy=o.oy??-1.6+J(1),sc=o.sc??.97;
      if(fill)acc.push(`<path d="${pl(P.map(q=>[cx+(q[0]-cx)*sc+ox,cy+(q[1]-cy)*sc+oy]),o.famp??1.1)}Z" fill="${fill}"${o.fop?` fill-opacity="${o.fop}"`:''}/>`);
      if(!o.noline){const s0=Math.floor(r()*n),cnt=n+(o.closed?1:(r()<.55?0:-1)),L=[];for(let i=0;i<=cnt;i++)L.push(P[(s0+i)%n]);acc.push(st(pl(L,o.amp??1.2),o.w||LW,INK))}
    },
    tube(pts,w,fill,o={}){const P=dense(pts,false,8);acc.push(st(pl(P,.9),w+(o.ow??LW*1.45),INK));if(fill)acc.push(st(pl(P,.8),w,fill,` transform="translate(${o.ox??1.2} ${o.oy??-.8})"`))},
    line(pts,w,col,amp=1){if(!pts.length||isNaN(pts[0][0]))return;acc.push(st(pl(dense(pts,false,7),amp),w,col||INK))},
    dot(x,y,rx,ry,fill){if(isNaN(x))return;x+=J(.5);y+=J(.5);tr(x-rx,y-(ry??rx));tr(x+rx,y+(ry??rx));acc.push(`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(rx)}" ry="${R1(ry??rx)}" fill="${fill||INK}"/>`)},
    heart(x,y,s,fill){const p=[];for(let i=0;i<16;i++){const t=i/16*Math.PI*2;p.push([x+s*.062*16*Math.pow(Math.sin(t),3),y-s*.062*(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))])}h.shape(p,fill||'#FF4F7B',{w:3.4,step:30,ox:1.5,oy:-1,amp:.8})},
    // waxy crayon streaks inside an ellipse (local rx,ry) mapped by M: a few seeded diagonal strokes, darker + lighter
    crayon(rx,ry,M,col,n){if(isNaN(M([0,0])[0]))return;let d1='',d2='';for(let i=0;i<n;i++){const a=r()*Math.PI*2,rr=Math.sqrt(r())*.74,x=Math.cos(a)*rx*rr,y=Math.sin(a)*ry*rr,l=7+r()*10,p=M([x,y]),q=M([x+l*.55,y-l*.8]);(i%3?d1+=`M${R1(p[0])} ${R1(p[1])}L${R1(q[0])} ${R1(q[1])}`:d2+=`M${R1(p[0])} ${R1(p[1])}L${R1(q[0])} ${R1(q[1])}`)}
      acc.push(`<path d="${d1}" stroke="${mix(col,PEN,col===W?.12:.22)}" stroke-width="2.2" stroke-linecap="round" opacity=".42"/><path d="${d2}" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".32"/>`)},
    text(s,x,y,size,col,rt=0){texts.push({s,x:x+J(1.5),y:y+J(1.2),size,col,rt:rt+J(3)});tr(x-2,y-size);tr(x+size*.7*s.length,y+4)}
  };
  return h;
}

/* ---------- breed rigs (facing right; body-local and head-local coordinates in px) ---------- */
const SP={
 shiba:{name:'Mochi',breed:'Shiba Inu',personality:'Proud, independent, dramatic',joke:'heh.',
  col:'#F7892E',hcol:'#F7892E',light:'#FFE7B3',body:{x:112,y:142,rx:42,ry:22,lop:.05},head:{x:164,y:106,rx:32,ry:28},
  legs:{h:-27,f:24,w:8.5},ears:'prick',tail:'spiral',eyes:[8,6.2],face:{eyes:'smug',mouth:'smirk'},
  marks:(h,B,Hd,s)=>{h.shape([[-s.body.rx*.55,s.body.ry*.5],[s.body.rx*.3,s.body.ry*.55],[s.body.rx*.95,s.body.ry*.05],[s.body.rx*.75,s.body.ry*.8],[-s.body.rx*.45,s.body.ry*.9]].map(B),s.light,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;h.shape([[-hx*.8,hy*.25],[hx*.05,hy*.12],[hx*.95,hy*.05],[hx*.9,hy*.7],[hx*.2,hy*.95],[-hx*.6,hy*.78]].map(Hd),s.light,{noline:1})}},
 corgi:{name:'Biscuit',breed:'Corgi',personality:'Cheerful, greedy for food',joke:'is that... a snack?',
  col:'#F8A23C',hcol:'#F8A23C',light:W,body:{x:110,y:153,rx:50,ry:21,lop:.04},head:{x:166,y:126,rx:31,ry:27},
  legs:{h:-34,f:30,w:10,col:W},ears:'giant',tail:'nub',eyes:[6.4,5.2],face:{eyes:'open',mouth:'grin',brow:'eager',drool:1,pupil:.74},
  marks:(h,B,Hd,s)=>{const b=s.body;h.shape([[-b.rx*.8,b.ry*.45],[b.rx*.2,b.ry*.62],[b.rx*1.0,b.ry*.1],[b.rx*.85,b.ry*.95],[-b.rx*.6,b.ry*1.0]].map(B),s.light,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;h.shape([[hx*.1,-hy*.95],[hx*.3,-hy*.95],[hx*.42,hy*.05],[hx*.95,hy*.25],[hx*.85,hy*.85],[-hx*.5,hy*.9],[-hx*.75,hy*.4],[-hx*.05,hy*.15]].map(Hd),s.light,{noline:1})}},
 golden:{name:'Sunny',breed:'Golden Retriever',personality:'Friendly, loves fetch',joke:'BALL? BALL! BALL!!',
  col:'#F2B84A',hcol:'#F2B84A',ear:'#D98A22',fluff:1,body:{x:108,y:130,rx:52,ry:38},head:{x:160,y:96,rx:34,ry:30},
  legs:{h:-27,f:22,w:9},ears:'flop2',tail:'wiggle',eyes:[5.4,7.6],face:{eyes:'open',mouth:'tongue',e0:[-.18,-.08],e1:[.36,-.16],nose:[.12,.22],look:[[-.35,.2],[.3,-.15]],tside:1},marks:null},
 dachs:{name:'Noodle',breed:'Dachshund',personality:'Curious, loves digging',joke:'still loading... (I am long)',
  col:'#A65A34',hcol:'#A65A34',light:'#F5B26B',ear:'#6E3315',body:{x:110,y:154,rx:78,ry:17,lop:.02,long:1},head:{x:191,y:128,rx:24,ry:22},
  legs:{h:-56,f:50,w:8,sock:'#F5B26B'},ears:'dflop',tail:'thin',eyes:[6.3,4.6],face:{eyes:'open',mouth:'smile',e0:[-.15,-.2],e1:[.4,-.3],nose:[1.48,.14],snout:1,brow:'curious',tilt:-8},
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
  col:'#2A2628',hcol:'#2A2628',light:W,body:{x:110,y:144,rx:44,ry:23,lop:.04},head:{x:164,y:106,rx:30,ry:26},
  legs:{h:-28,f:25,w:8.6,sock:W},ears:'semi',tail:'fluffy',eyes:[7,6.6],
  face:{eyes:'open',mouth:'smile',e0:[-.14,-.16],e1:[.38,-.2],nose:[1.42,.1],snout:1,snoutL:1.4,brow:'curious',browCol:'#CFC6C0',look:[[-.3,.18],[-.3,.18]]},
  marks:(h,B,Hd,s)=>{const b=s.body,K=s.light;h.shape([[b.rx*.5,-b.ry*.95],[b.rx*.82,-b.ry*.78],[b.rx*1.03,b.ry*.05],[b.rx*.88,b.ry*.95],[b.rx*.2,b.ry*1.0],[b.rx*.35,b.ry*.55],[b.rx*.62,b.ry*.1]].map(B),K,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;h.shape([[hx*.06,-hy*.98],[hx*.24,-hy*.98],[hx*.46,hy*.02],[hx*.04,-hy*.02]].map(Hd),K,{noline:1});
   h.shape([[hx*.0,hy*.42],[hx*.9,hy*.28],[hx*.82,hy*.92],[-hx*.38,hy*.96]].map(Hd),K,{noline:1});h.shape(circ(-hx*.5,hy*.62,hx*.42,hy*.36,9).map(Hd),K,{noline:1,ox:0,oy:0})}};
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
  const bot=top.map((p,i)=>[p[0]+(i%2?1.6:-1.2),Math.min(GY-3,p[1]+len*(i%2?1:.8))]),K=curlCol(s.col);
  h.shape(top.concat(bot.slice().reverse()),s.col,{noline:1,ox:0,oy:0,sc:1});
  h.line([top[0]].concat(bot,[top[top.length-1]]),h.LW*.9,INK,1);
  bot.forEach((p,i)=>{if(i%3===1&&i<bot.length-1){const t=top[i];h.line([[t[0],t[1]+3],[t[0]+(p[0]-t[0])*.5+1.5,t[1]+(p[1]-t[1])*.5],[p[0],p[1]-3]],2,K,.4)}})}
/* v2.12 Fourteen New Friends (V212.md): fourteen more crude ones, appended. Each ART lane replaces only its own block below; the
   PLACEHOLDER rows borrow an old dog's drawing until that lane lands. Their extras are new spec fields, so no older dog takes those branches */
/* v2.12 ART A: dobie, corso, pitbull, minpin */
SP.dobie={...SP.golden,name:'Espresso',breed:'Doberman',personality:'A big softie in a sleek coat. Keeps watch, then wants a cuddle.',joke:'I am on guard. Please guard me with a blanket.'};// PLACEHOLDER (ART A)
SP.corso={...SP.mastiff,name:'Cannoli',breed:'Cane Corso',personality:'A calm, gentle guardian. Keeps an eye on the whole family.',joke:'I am very serious. Except when you scratch my ears.'};// PLACEHOLDER (ART A)
SP.pitbull={...SP.frenchie,name:'Peaches',breed:'Pit Bull',personality:'A wiggly, people-loving goofball. Every stranger is a new best friend.',joke:'My whole back half wags. I cannot stop it.'};// PLACEHOLDER (ART A)
SP.minpin={...SP.chihuahua,name:'Jellybean',breed:'Miniature Pinscher',personality:'A tiny, fearless bundle of energy. Prances everywhere.',joke:'I am not small. Everything else is big.'};// PLACEHOLDER (ART A)
/* end v2.12 ART A */
/* v2.12 ART B: lab, malamute, chow, stdpoodle */
SP.lab={...SP.golden,name:'Butter',breed:'Labrador Retriever',personality:'Friendly, food-loving and always ready for a swim.',joke:'Is it dinner? It feels like dinner.'};// PLACEHOLDER (ART B)
SP.malamute={...SP.husky,name:'Maple',breed:'Alaskan Malamute',personality:'A big fluffy sled dog who talks back. Loves snow and digging.',joke:'Woo-woo. That means I disagree.'};// PLACEHOLDER (ART B)
SP.chow={...SP.samoyed,name:'Bao',breed:'Chow Chow',personality:'A dignified fluffy lion with a blue tongue. Picks friends carefully.',joke:'I am not grumpy. This is just my face.'};// PLACEHOLDER (ART B)
SP.stdpoodle={...SP.poodle,name:'Madeleine',breed:'Standard Poodle',personality:'A tall, clever, curly athlete. Learns tricks before you teach them.',joke:'I am the big poodle. The small one is my cousin.'};// PLACEHOLDER (ART B)
/* end v2.12 ART B */
/* v2.12 ART C: schnauzer, westie, yorkie */
SP.schnauzer={...SP.mutt,name:'Muesli',breed:'Miniature Schnauzer',personality:'Bearded, bossy and very alert. Reports every leaf.',joke:'The beard is for wisdom. And soup.'};// PLACEHOLDER (ART C)
SP.westie={...SP.mutt,name:'Shortbread',breed:'West Highland White Terrier',personality:'A cheerful little white terrier. Digs first, asks later.',joke:'I was white this morning. I promise.'};// PLACEHOLDER (ART C)
SP.yorkie={...SP.chihuahua,name:'Toffee',breed:'Yorkshire Terrier',personality:'A tiny terrier with silky hair and a giant attitude.',joke:'I am in charge here. Please lift me onto the sofa.'};// PLACEHOLDER (ART C)
/* end v2.12 ART C */
/* v2.12 ART D: bichon, maltese, shihtzu */
SP.bichon={...SP.samoyed,name:'Meringue',breed:'Bichon Frise',personality:'A happy cotton ball who bounces everywhere.',joke:'Is this a haircut or a cloud? Yes.'};// PLACEHOLDER (ART D)
SP.maltese={...SP.spitz,name:'Marshmallow',breed:'Maltese',personality:'A gentle little lap dog in a long white coat.',joke:'I do not walk. I float, elegantly.'};// PLACEHOLDER (ART D)
SP.shihtzu={...SP.pug,name:'Wonton',breed:'Shih Tzu',personality:'A relaxed lap dog with a top-knot and big opinions about naps.',joke:'Top-knot up. Nap time down.'};// PLACEHOLDER (ART D)
/* end v2.12 ART D */
const KEYS=['shiba','corgi','golden','dachs','husky','mutt','chihuahua','pug','greyhound','beagle','poodle','collie','samoyed','frenchie','akita','spitz','pom','afghan','dane','mastiff','gsd',
  'dobie','corso','pitbull','minpin','lab','malamute','chow','stdpoodle','schnauzer','westie','yorkie','bichon','maltese','shihtzu'];// v2.12: fourteen appended (V212.md 2)
const NEWK=/^(poodle|collie|samoyed|frenchie|akita|spitz|pom|afghan|dane|mastiff|gsd|dobie|corso|pitbull|minpin|lab|malamute|chow|stdpoodle|schnauzer|westie|yorkie|bichon|maltese|shihtzu)$/;

/* ---------- pose -> rig layout ---------- */
function layout(s,pose,k){
  const b=s.body,hd=s.head,L={pose,k,face:{...s.face},ears:'norm',tailA:0,tailS:1,blush:0,hearts:0,zz:0,stink:0,mud:0,tear:0};
  L.bT={x:b.x,y:b.y,a:0};L.hT={x:hd.x,y:hd.y,a:0};
  const rel=[hd.x-b.x,hd.y-b.y];
  if(s.face.tilt&&(pose==='idle'||pose==='dirty'||pose==='walk'))L.hT.a=s.face.tilt;
  let legMode='stand',swing=null,kick=-1,lift=0;
  switch(pose){
   case 'happy':L.face.eyes='open';L.face.mouth=s.face.mouth==='grin'?'grin':'tongue';L.tailA=25;L.ears='perk';L.hearts=2;L.hT.a=-7;L.hT.y-=3;break;
   case 'pet':L.face.eyes='happy';L.face.mouth=s.face.mouth==='grin'?'grin':'tongue';L.blush=1;L.hearts=2;L.hT.a=-12+[0,5,-4][k];L.bT.a=[-2,2,-1][k];L.tailA=[18,34,8][k];kick=0;L.kick=[[-16,-18],[-6,-6],[-22,-26]][k];L.ears='perk';L.wiggle=1;break;
   case 'eat':{L.ears='eat';L.face.eyes='down';L.face.mouth='chew';L.tailA=8;L.bT.a=5;L.hT.a=22;
     const N=noseLocal(s),q=rot(N,22);L.hT.x=170-q[0];L.hT.y=Math.min(176-q[1],GY-3-hd.ry);break}
   case 'sleep':L.face.eyes='closed';L.face.mouth='sleep';L.ears='sleep';L.tailA=-100;L.zz=1;legMode='lie';
     L.bT.y=GY-b.ry*(s.fluff?1.02:.86);L.tailS=.75;L.bT.x=b.x-(b.long?4:8);L.hT.x=L.bT.x+b.rx*.92+hd.rx*.3;L.hT.y=GY-hd.ry*.8;L.hT.a=6;break;
   case 'walk':swing=[1,0,-1][k];L.lift=k===1;L.bT.y+=[0,-3,0][k];L.hT.y+=[0,-4,1][k];L.tailA=[14,26,-4][k];L.face.eyes=s.face.eyes==='smug'?'smug':'open';L.face.mouth=s.face.mouth==='o'?'smile':s.face.mouth;break;
   case 'jump':legMode='splay';{const lift=s.fluff?26:b.long?36:34;L.bT.y-=lift;L.hT.y-=lift+10;L.bT.x+=b.long?8:0;L.hT.x+=b.long?6:5}L.bT.a=b.long?-9:-12;L.hT.a=-14;L.speed=1;L.ears='fly';L.tailA=30;L.face.eyes='open';L.face.mouth='open';break;
   case 'sit':{legMode='sit';const a=b.long?-30:b.deep?-52:-34;if(b.deep)L.gfold=1;L.bT.a=a;if(b.long){L.bT.sx=.58;L.scrunch=1}const rear=[-b.rx*.72,b.ry*.62],rq=rot(rear,a);const R=[b.x-b.rx*(b.long?.2:.45),GY-3];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
     {const BT=T(L.bT);let my=-1e9;bodyPts(s).forEach(p=>{const q=BT(p);if(q[1]>my)my=q[1]});if(my>GY-1)L.bT.y-=my-(GY-1)}
     const hq=rot([rel[0]*(L.bT.sx||1),rel[1]],a*.55);L.hT.x=L.bT.x+hq[0]+4-(b.long?14:0);L.hT.y=L.bT.y+hq[1]-2-(b.long?8:0);L.tailA=-70;L.face.mouth=s.face.mouth==='o'?'smile':s.face.mouth;if(L.gfold)gfoldHead(s,L,rel,a);break}
   case 'beg':{legMode='beg';L.face.eyes='hope';L.face.mouth=s.face.mouth==='o'||s.face.mouth==='smirk'?'smile':s.face.mouth==='grin'?'grin':'smile';L.ears='perk';L.hope=1;const a=b.long?-48:b.deep?-66:-58;if(b.deep)L.gfold=1;L.bT.a=a;if(b.long){L.bT.sx=.58;L.scrunch=1}const rear=[-b.rx*.72,b.ry*.62],rq=rot(rear,a);const R=[b.x-b.rx*(b.long?.2:.45),GY-3];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
     {const BT=T(L.bT);let my=-1e9;bodyPts(s).forEach(p=>{const q=BT(p);if(q[1]>my)my=q[1]});if(my>GY-1)L.bT.y-=my-(GY-1)}
     const hq=rot([rel[0]*(L.bT.sx||1),rel[1]],a*.55);L.hT.x=L.bT.x+hq[0]+4-(b.long?14:0);L.hT.y=L.bT.y+hq[1]-2-(b.long?8:0);L.tailA=-70;L.face.mouth=s.face.mouth==='o'?'smile':s.face.mouth;if(L.gfold)gfoldHead(s,L,rel,a);break}
   case 'sad':L.face.eyes='sad';L.face.mouth='frown';L.ears='droop';L.tear=1;L.tailA=-80;L.tailS=.85;L.hT.y+=11;L.hT.x-=2;L.hT.a=10;break;
   case 'dirty':L.mud=1;L.stink=1;break;
   case 'sniff':{legMode='sniff';L.face.eyes='down';L.face.mouth='smile';L.ears='perk';L.tailA=-8;L.tailS=1.05;L.bT.a=6;
     const N=noseLocal(s),q=rot(N,26);L.hT.a=26;L.hT.x=hd.x+6;L.hT.y=Math.min(176-q[1]+2,GY-3-hd.ry);L.sniffFx=1;break}
   case 'yawn':case 'howl':{legMode='sit';const a=b.long?-30:-34;L.bT.a=a;if(b.long){L.bT.sx=.58;L.scrunch=1}const rear=[-b.rx*.72,b.ry*.62],rq=rot(rear,a);const R=[b.x-b.rx*(b.long?.2:.45),GY-3];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
     {const BT=T(L.bT);let my=-1e9;bodyPts(s).forEach(p=>{const q=BT(p);if(q[1]>my)my=q[1]});if(my>GY-1)L.bT.y-=my-(GY-1)}
     const hq=rot([rel[0]*(L.bT.sx||1),rel[1]],a*.55);L.hT.x=L.bT.x+hq[0]+4-(b.long?14:0);L.hT.y=L.bT.y+hq[1]-2-(b.long?8:0);L.tailA=-70;L.face.eyes='closed';
     if(pose==='yawn'){L.face.mouth='yawn';L.hT.a=-8+[0,-3,0][k];L.ears='norm';L.yawnFx=1}else{L.face.mouth='howl';L.hT.a=-50+[0,-3,2][k];L.hT.y-=8;L.hT.x-=4;L.ears='perk';L.howlFx=1}break}
   case 'paw':case 'scratch':{legMode=pose;const a=b.long?-30:-34;L.bT.a=a;if(b.long){L.bT.sx=.58;L.scrunch=1}const rear=[-b.rx*.72,b.ry*.62],rq=rot(rear,a);const R=[b.x-b.rx*(b.long?.2:.45),GY-3];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
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
     const rear=[-b.rx*.72,b.ry*.3],rq=rot([rear[0]*(L.bT.sx||1),rear[1]],a);const R=[b.x-b.rx*(b.long?.15:.35)+[0,4,-4][k],GY-24];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
     const hq=rot([rel[0]*(L.bT.sx||1),rel[1]],a*.6);L.hT.x=L.bT.x+hq[0]-(b.long?16:4);L.hT.y=L.bT.y+hq[1]-4;L.hT.a=[0,-10,10][k];L.tailA=-40;L.danceFx=1;break}
   case 'bow':legMode='bow';L.face.eyes='open';L.face.mouth=s.face.mouth==='grin'?'grin':'tongue';L.ears='perk';L.bT.a=16;L.bT.y+=2;L.tailA=34+[0,18,-10][k];L.hT.y=GY-hd.ry*1.05-6;L.hT.x+=6;L.hT.a=-10;L.wiggle=0;L.wagFx=1;break;
   case 'squat':legMode='squat';L.face.eyes='strain';L.face.mouth='tight';L.ears='norm';L.tailA=38;L.bT.a=-14;L.bT.y+=b.long?3:6;L.bT.x+=2;L.hT.y+=2;L.hT.a=-4;L.sweat=1;L.blush=0;L.shy=1;break;
   case 'leglift':legMode='lift';L.face.eyes='whistle';L.face.mouth='whistle';L.tailA=12;L.bT.a=3;L.hT.a=-10;L.hT.y-=2;L.notes=1;break;
   case 'crouch':{legMode='crouch';L.ears='flat';L.face.eyes='open';L.face.mouth=s.face.mouth==='o'?'o':'smile';L.tailA=-60;L.tailS=.8;{const sy=s.fluff?.52:b.long?.62:.8;L.bT.sy=sy;L.bT.y=GY-6-b.ry*sy;}L.hT.y=GY-3-hd.ry*(s.fluff?.85:.95);L.hT.x=hd.x+8;L.hT.a=6;L.speed=0;L.duck=1;break}
   case 'shake':L.face.eyes='closed';L.face.mouth='smile';L.ears='fly';L.hT.a=[-16,14,-6][k];L.bT.a=[5,-5,2][k];L.hT.x+=[-3,3,0][k];L.tailA=[30,-20,10][k];L.spray=1;break;
   case 'cold':L.face.eyes='sad';L.face.mouth='frown';L.ears='droop';L.tailA=-90;L.tailS=.7;{const j=[-2,2,-1][k];L.bT.x+=j;L.hT.x+=j*1.5;L.bT.y+=3;L.hT.y+=8;L.hT.a=6}L.snow=1;L.blueNose=1;L.shiver=1;break;
   case 'hot':L.face.eyes='sad';L.face.mouth='pant';L.ears='droop';L.tailA=-60;L.tailS=.85;L.hT.y+=8;L.hT.a=8;L.heat=1;L.bT.y+=2;break;
   case 'dig':{legMode='dig';L.face.eyes='down';L.face.mouth='open';L.ears='perk';L.tailA=34;L.bT.a=12;
     const N=noseLocal(s),q=rot(N,28);L.hT.a=28;L.hT.x=hd.x+4;L.hT.y=Math.min(hd.y+30,GY-6-hd.ry);L.dirt=1;
     if(b.deep){L.gdig=1;L.bT.a=20;L.bT.y+=b.ry*1.1;L.bT.x-=4;L.hT.a=34;L.hT.x=hd.x-2;L.hT.y=GY-8-hd.ry*1.1}break}
  }
  // legs: exactly four. Far legs sit a little forward, higher, darker; front pair under the chest, hind pair under the hips
  const B=T(L.bT),lg=s.legs;L.legs=[];
  const FAR=10;
  [['FH',0,0],['NH',0,1],['FF',1,0],['NF',1,1]].forEach(([id,front,near],i)=>{
    const x=(front?lg.f:lg.h)+(near?0:FAR),hip=B([x,b.ry*(near?.42:.22)]),base=(lg.cols&&lg.cols[id])||lg.col||s.col;
    const col=near?base:mix(base,PEN,.28),sock=lg.sock?(near?lg.sock:mix(lg.sock,PEN,.28)):null,w=lg.w*(near?1:.88),up=near?0:3.5;
    let foot;
    if(legMode==='stand'){foot=[hip[0],GY-up];
      if(swing!=null){const diagA=id==='NF'||id==='FH',sw=(diagA?swing:-swing)*(b.long?11:15);foot=[hip[0]+sw,GY-up-(L.lift&&diagA?8:0)]}
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
    else if(legMode==='splay'){foot=front?[hip[0]+26+(near?0:4),hip[1]+12-(near?0:5)]:[hip[0]-28+(near?0:4),hip[1]+10-(near?0:5)];}
    else if(legMode==='beg'){if(!front){L.legs.push({haunch:near?1:0,sitfoot:near?0:1,hip,col,w,i,id,near});return}
      const wv=[0,-3,1][L.k||0],sh=B([b.rx*(near?.62:.5),-b.ry*.15]);L.legs.push({hip:sh,foot:[sh[0]+(near?20:15),sh[1]+(near?4:-1)+wv],mid:[sh[0]+(near?10:7),sh[1]+(near?16:11)],col,sock,w,i,id,near,raised:1});L.paw=1;return}
    else if(legMode==='sit'){if(!front){L.legs.push({haunch:near?1:0,sitfoot:near?0:1,hip,col,w,i,id,near});return}foot=[hip[0]+3,GY-up];}
    L.legs.push({hip,foot,col,sock,w,i,id,near});
  });
  return L;
}
function gfoldHead(s,L,rel,a){// greyhound sit/beg: head carried up on the long neck, above the chest
  const b=s.body,hd=s.head,sh=T(L.bT)([b.rx*.78,-b.ry*.55]);L.hT.x=sh[0]+hd.rx*.55;L.hT.y=sh[1]-hd.ry*1.5;L.hT.a=L.pose==='beg'?-8:-4;L.bT.x-=2}
function noseLocal(s){const f=s.face,hx=s.head.rx,hy=s.head.ry;return f.nose?[hx*f.nose[0],hy*f.nose[1]]:[hx*.66,hy*.26]}

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
  if(s.earW)E.forEach(e=>{const c=e.pivot;e.pts=e.pts.map(q=>[c[0]+(q[0]-c[0])*s.earW,q[1]])});// Frenchie: wider, rounder bat ears
  if(s.earTilt)E.forEach(e=>{e.pts=rotAbout(e.pts,e.flop?0:s.earTilt,e.pivot)});// v2.11 akita: small ears tipped forward
  if(s.earS)E.forEach(e=>{const c=e.pivot,k=s.earS;e.pts=e.pts.map(q=>[c[0]+(q[0]-c[0])*k,c[1]+(q[1]-c[1])*k])});
  return E;
}
function earAngle(s,mode,e){
    let a=0;
    if(mode==='droop')a=e.flop?-e.side*8:-e.side*-68*(/^(giant|bat)$/.test(s.ears)?.9:1);
    if(mode==='sleep')a=e.flop?0:e.side*48;
    if(mode==='fly')a=e.flop?e.side*-150+(e.side<0?0:300):-35;
    if(mode==='perk')a=e.flop?e.side*-10:e.side*6;
    if(mode==='eat'&&e.flop)a=e.side*-30;
    if(mode==='flat')a=e.flop?e.side*-35:(/^(giant|bat)$/.test(s.ears)?-78:-62)+(e.side<0?-8:0);
    if(mode==='droop'&&!e.flop)a=e.side*(/^(giant|bat)$/.test(s.ears)?38:62);
    return a;
}
function earPose(s,L,e){// the ear after its pose rotation; L.earFit (Astronaut Helmet only) shrinks it toward its root to stay inside that radius
  const a=earAngle(s,L.ears,e);let p=a?rotAbout(e.pts,a,e.pivot):e.pts;
  if(L.earFit){const R=L.earFit,c=e.pivot,at=k=>p.map(q=>[c[0]+(q[0]-c[0])*k,c[1]+(q[1]-c[1])*k]);let k=1;while(k>.3&&!at(k).every(q=>Math.hypot(q[0],q[1])<=R))k-=.05;if(k<1)p=at(k)}
  return p}
function curlyEar(h,s,p,HT,col){// Poodle: a long drop ear with a lumpy outline and two curls in it
  const P=dense(p,true,5.5);let cx=0,cy=0;P.forEach(q=>{cx+=q[0]/P.length;cy+=q[1]/P.length});
  const Q=P.map((q,i)=>{const dx=q[0]-cx,dy=q[1]-cy,m=Math.hypot(dx,dy)||1,k=i%2?2.6:-.4;return[q[0]+dx/m*k,q[1]+dy/m*k]});
  h.shape(Q.map(HT),col,{w:3.6,step:30,amp:.9});const c=curlCol(col);
  [[.0,-.05],[.05,.38]].forEach((o,i)=>{const x=cx+o[0]*(cx-p[0][0]),y=cy+o[1]*Math.abs(p[2][1]-p[0][1]);h.line(spiral(x,y,.5,3.6,1.25,8,i*2.1).map(HT),2,c,.3)})}
function drawTopknot(h,s,HT){// Poodle: a round pom of hair on top of the head, behind the skull outline
  const hx=s.head.rx,hy=s.head.ry;
  if(s.topknot===2){// v2.11 afghan: a silky topknot swept back over the skull, a few long strands
    h.shape([[-hx*.92,-hy*.2],[-hx*1.05,-hy*.95],[-hx*.55,-hy*1.5],[hx*.12,-hy*1.62],[hx*.62,-hy*1.25],[hx*.5,-hy*.6]].map(HT),s.hcol,{step:30,amp:.8});
    const K=curlCol(s.hcol);[[-.1,-1.45,-.75,-.9],[.3,-1.35,-.35,-.75]].forEach(q=>h.line([[hx*q[0],hy*q[1]],[hx*(q[0]+q[2])/2+1.5,hy*(q[1]+q[3])/2],[hx*q[2],hy*q[3]]].map(HT),2,K,.3));return}
  h.shape(scallop(-hx*.1,-hy*.86,hx*.56,hy*.44,8,.2).map(HT),s.hcol,{step:30,amp:.8});
  [[-.3,-1.0],[.12,-1.06]].forEach((q,i)=>h.line(spiral(hx*q[0],hy*q[1],.5,3.6,1.25,8,i*2.4).map(HT),2,curlCol(s.hcol),.3))}
function drawEars(h,s,L,HT,front){
  const mode=L.ears,col=s.ear||s.hcol;const HTg=q=>{const c=HT(q);return[c[0],Math.min(c[1],GY-1)]};// v2.11 curtain ears stop at the ground
  earList(s).forEach(e=>{
    const isFront=!!e.flop;if(isFront!==front||L.hood)return;
    let p=earPose(s,L,e);
    if(s.curlEar&&e.flop){if(e.side>0){const c=e.pivot,hx=s.head.rx;p=p.map(q=>[c[0]+(q[0]-c[0])*.84-hx*.16,c[1]+(q[1]-c[1])*.9])}curlyEar(h,s,p,HT,mix(e.col||col,PEN,.16));return}
    h.shape((s.earRound?chaikin(p,s.earRound):p).map(e.hair?HTg:HT),e.col||col,{w:3.8});
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
   case 'fluffy':h.tube(map([[0,0],[-22,-6],[-32,-26],[-24,-46]]),14,col);h.tube(map([[-30,-34],[-24,-46]]),14,W,{ow:0});break;
   case 'sickle':h.tube(map([[0,0],[-8,-10],[-7,-22],[3,-27]]),5,col);break;
   case 'curl':h.tube(map(spiral(-7,-13,2,10,1.85,24,1.4).reverse().concat([[0,0]]).reverse()),6.5,col,{ow:5});break;
   case 'whip':h.tube(map([[0,0],[-14,10],[-24,26],[-24,42],[-14,50]]),3.6,col,{ow:4.6});break;
   case 'flag':h.tube(map([[0,0],[-5,-14],[-7,-30],[-5,-42]]),7.5,col);{const t=map([[-5,-42]])[0];h.dot(t[0],t[1],5.2,5.2,W)}break;
   case 'line':h.line(map([[0,0],[-14,-10],[-10,-22],[-22,-30],[-22,-44]]),4.8);break;
   case 'pom':{h.tube(map([[0,0],[-6,-10],[-8,-22]]),4.2,col,{ow:4.6});const t=map([[-9,-29]])[0],z=9.5*Math.max(.6,ss);h.shape(scallop(t[0],t[1],z,z*.92,7,.22),col,{step:30,amp:.8,w:3.6});h.line(spiral(t[0]-1,t[1]-1,.5,3.6,1.25,8,.6),2,curlCol(col),.3);break}
   case 'plume':drawPlume(h,s,L,map,col);break;// v2.11 spitz and pom
   case 'ring':h.tube(map([[0,0],[-6,-10],[-8.5,-19]].concat(spiral(-3,-27,4.6,7.2,.86,14,2.3))),4.4,col,{ow:4.6});break;// v2.11 afghan: thin, a ring curl at the end
   case 'brush':{h.tube(map([[0,0],[-12,10],[-21,25],[-24,40],[-19,52]]),12.5,col);h.line(map([[-3,-3],[-14,6],[-24,20],[-28,34]]),3.2,s.dark?mix(s.dark,col,.25):curlCol(col),.6);
     h.line(map([[-16,30],[-19,40],[-16,47]]),2,curlCol(col),.3);break}// v2.11 gsd: long, bushy, carried low, darker on top
   case 'low':h.tube(map([[0,0],[-8,11],[-13,24],[-12,38]]),8.4,col);break;// v2.11 mastiff: thick and hanging
  }  if(s.tailTip){const E={ring:[-1,-33],brush:[-19,52],low:[-12,38],plume:PLUME_TIP,pom:[-9,-29],spiral:[-18,-46],nub:[-8,-6],wiggle:[-28,-42],thin:[-17,-36],fluffy:[-24,-46],line:[-22,-44],sickle:[3,-27],curl:[-7,-13],whip:[-14,50]}[s.tail];if(E&&s.tail!=='fluffy'){const t=map([E])[0];h.dot(t[0],t[1],s.tail==='spiral'?6:4.5,s.tail==='spiral'?6:4.5,W)}}

}
/* v2.11: the plumed tail (spitz, pom) and the neck ruff (spitz, pom, a little on the akita) */
const PLUME=[[0,0],[-5,-12],[-3,-25],[6,-35],[20,-39],[33,-34],[40,-25]],PLUME_TIP=[40,-25];
function drawPlume(h,s,L,map,col){// a fat fluffy plume up off the rump and curled forward over the back, lumpy edge, two fur strokes
  const C=dense(PLUME,false,4),n=C.length,lt=[],rt=[];
  C.forEach((p,i)=>{const t=i/(n-1),a=C[Math.max(0,i-1)],b=C[Math.min(n-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],m=Math.hypot(dx,dy)||1,w=(3.5+11*Math.sin(Math.PI*Math.min(1,t*1.15)))*(i%2?1.16:.94);
   lt.push([p[0]-dy/m*w,p[1]+dx/m*w]);rt.push([p[0]+dy/m*w*.9,p[1]-dx/m*w*.9])});
  h.shape(map(lt.concat(rt.reverse())),col,{step:30,amp:.8,w:3.6});
  const K=curlCol(col);[[.18,.62,-2],[.4,.92,3]].forEach(q=>{const a=Math.floor(q[0]*(n-1)),b=Math.floor(q[1]*(n-1));h.line(map(C.slice(a,b).map(p=>[p[0]+q[2],p[1]+q[2]*.5])),2.2,K,.4)})}
function drawRuff(h,s,L,HT){// a big scalloped mane round the neck, behind the head (the head is drawn over most of it)
  const hx=s.head.rx,hy=s.head.ry,k=s.ruff,col=s.ruffK&&s[s.ruffK]?s[s.ruffK]:s.hcol,cl=q=>[q[0],Math.min(q[1],GY-1)];
  h.shape(scallop(-hx*.16,hy*.6,hx*.98*k,hy*.66*k,9,.2).map(HT).map(cl),col,{step:30,amp:.8,w:3.6});
  const K=curlCol(col);[[-.7,.95],[-.2,1.12],[.3,1.02]].forEach(q=>{const x=hx*q[0]*k,y=hy*q[1]*k;h.line([[x-3,y-5],[x,y],[x+3,y-5]].map(HT).map(cl),2,K,.3)})}
function drawLegs(h,s,L){
  const one=l=>{
    const a=h.acc.length;
    if(l.sitfoot&&L.gfold){const hp=T(L.bT)([-s.body.rx*.45,s.body.ry*.25]),y=GY-3.5;h.tube([[hp[0]-s.body.ry*.2+8,y-7],[hp[0]+s.body.ry*1.9+8,y]],l.w*.95,l.col);h.shape(circ(hp[0]+s.body.ry*1.9+11,y,l.w*.8,l.w*.55,7),l.col,{w:2.6,ox:0,oy:0,sc:1,closed:1})}
    else if(l.sitfoot){const hp=T(L.bT)([-s.body.rx*.45,s.body.ry*.25]);h.shape(circ(hp[0]+s.body.ry*.9+9,GY-6,s.body.ry*.5+3,4,8),l.col,{w:3.4})}
    else{h.tube([l.hip,l.mid||[(l.hip[0]+l.foot[0])/2+1,(l.hip[1]+l.foot[1])/2],l.foot],l.w,l.col);
      if(L.paw&&l.foot&&(l.id==='NF'||l.id==='FF'))h.shape(circ(l.foot[0]+2,l.foot[1],l.w*.75,l.w*.6,7),l.sock||l.col,{w:2.8,ox:0,oy:0,sc:1,closed:1});
      if(l.sock&&!l.raised){const t=.62,sx=l.hip[0]+(l.foot[0]-l.hip[0])*t,sy=l.hip[1]+(l.foot[1]-l.hip[1])*t;h.acc.push(`<path d="M${R1(sx+1)} ${R1(sy)}L${R1(l.foot[0]+1)} ${R1(l.foot[1]-1)}" stroke="${l.sock}" stroke-width="${R1(l.w)}" stroke-linecap="round"/>`)}
      if(s.pup&&!(L.paw&&(l.id==='NF'||l.id==='FF')))h.shape(circ(l.foot[0]+2.5,l.foot[1]-l.w*.42,l.w*1.0,l.w*.66,8),l.sock||l.col,{w:3,ox:0,oy:0,sc:1,closed:1});
      if(s.legs.pom){const m=l.mid||l.hip,t=.7,x=m[0]+(l.foot[0]-m[0])*t,y=m[1]+(l.foot[1]-m[1])*t;h.shape(scallop(x,y,l.w*1.05,l.w*.9,6,.25),l.sock||l.col,{step:30,amp:.6,w:3,ox:0,oy:0,sc:1})}
      if(s.legs.hair)legHair(h,l)}
    h.acc.splice(a,0,`<g class="pa-d-leg pa-d-leg-${l.id}">`);h.acc.push('</g>');
  };
  const only=h._legPass||'ground';const ok=l=>(only==='raised'?l.raised:!l.raised)&&(!h._legSkip||l.id!==h._legSkip)&&(!h._legOnly||l.id===h._legOnly);
  L.legs.filter(l=>!l.near&&!l.haunch&&ok(l)).forEach(one);L.legs.filter(l=>l.near&&!l.haunch&&ok(l)).forEach(one);
}
function legHair(h,l){// v2.11 afghan: flared silky trousers from the knee down, covering the foot
  const m=l.mid||[(l.hip[0]+l.foot[0])/2,(l.hip[1]+l.foot[1])/2],a=[l.hip[0]+(m[0]-l.hip[0])*.7,l.hip[1]+(m[1]-l.hip[1])*.7],f=l.foot,dx=f[0]-a[0],dy=f[1]-a[1],d=Math.hypot(dx,dy)||1,u=[dx/d,dy/d],n=[-u[1],u[0]],w=l.w,cl=q=>[q[0],Math.min(q[1],GY+1)];
  const P=(t,k,e)=>cl([a[0]+dx*t+n[0]*w*k+u[0]*e,a[1]+dy*t+n[1]*w*k+u[1]*e]);
  h.shape([P(0,-.72,0),P(.55,-1.08,0),P(1,-1.5,2.5),P(1,-.5,5),P(1,.5,3.5),P(1,1.5,4.5),P(.55,1.08,0),P(0,.72,0)],l.sock||l.col,{w:3,step:30,amp:.7,ox:0,oy:0,sc:1});
  h.line([P(.15,.1,0),P(.6,-.2,0),P(1,.1,1)],1.8,curlCol(l.sock||l.col),.3)}
function drawHaunch(h,s,L,B){
  const b=s.body;L.legs.filter(l=>l.haunch).forEach(l=>{
    const a=h.acc.length,c=B([-b.rx*.45,b.ry*.25]);
    if(L.gfold){// long folded thigh, then the hock and long foot flat along the ground
      const th=rotAbout(circ(c[0]+3,c[1]-2,b.ry*1.45,b.ry*.95,11),-28,[c[0]+3,c[1]-2]);const y=GY-4,hl=[c[0]-b.ry*.9,Math.min(c[1]+b.ry*.7,y-4)];
      h.tube([hl,[hl[0]+4,y],[c[0]+b.ry*2.1,y]],l.w*1.05,l.col);h.shape(circ(c[0]+b.ry*2.1+3,y,l.w*.85,l.w*.6,7),l.col,{w:2.8,ox:0,oy:0,sc:1,closed:1});h.shape(th,s.col);
    }else{
    if(!s.fluff)h.shape(circ(c[0],c[1]+2,b.ry*.95,b.ry*.85,10),s.col);
    h.shape(circ(c[0]+b.ry*.9,GY-4,b.ry*.6+3,4.5,8),l.col,{w:3.6});}
    h.acc.splice(a,0,`<g class="pa-d-leg pa-d-leg-NH">`);h.acc.push('</g>');
  });
}
function bodyPts(s){const b=s.body;if(b.sq){const x=b.rx,y=b.ry;return chaikin([[x*1.02,-y*.86],[x*1.06,y*.5],[x*.8,y*1.0],[-x*.1,y*.9],[-x*.82,y*1.0],[-x*1.04,y*.45],[-x*1.0,-y*.78],[-x*.3,-y*1.04],[x*.5,-y*1.0]],1)}// v2.11 dane, mastiff: a squarer box
  if(b.deep){const x=b.rx,y=b.ry;return [[x*1.02,-y*.45],[x*.95,y*.35],[x*.75,y*1.25],[x*.35,y*1.35],[0,y*.7],[-x*.4,y*.25],[-x*.78,y*.45],[-x*1.0,y*.1],[-x*.98,-y*.55],[-x*.55,-y*.95],[x*.1,-y*.92],[x*.7,-y*1.0]]}return s.fluff?scallop(0,0,b.rx,b.ry,13,.13):circ(0,0,b.rx,b.ry,b.long?18:15,b.lop||0)}
function headPts(s){const hd=s.head;if(s.sqHead){const x=hd.rx,y=hd.ry;return chaikin([[-x*.96,-y*.88],[x*.2,-y*1.02],[x*.98,-y*.84],[x*1.04,y*.7],[x*.52,y*1.0],[-x*.6,y*.98],[-x*1.02,y*.6]],2)}// v2.11 dane, mastiff
  return(s.hfluff===undefined?s.fluff:s.hfluff)?scallop(0,0,hd.rx,hd.ry,10,.12):circ(0,0,hd.rx,hd.ry,13,.04)}
function drawFace(h,s,L,HT){
  const f=L.face,hx=s.head.rx,hy=s.head.ry,sf=hx/33;
  const e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],er=s.eyes;
  const eyes=[[hx*e0[0],hy*e0[1],er[0]],[hx*e1[0],hy*e1[1],er[1]]];
  if(s.face.snout){const sl=s.face.snoutL||1.5,sd=s.face.snoutD,sn=[[hx*.5,-hy*.02],[hx*sl,hy*.0],[hx*(sl+.05),hy*(sd||.5)],[hx*.6,hy*(sd?sd+.12:.62)]],mc=s.face.snout===3?maskCol(s):0;
    if(s.face.jowl){const jy=sd||.5;h.shape([[hx*(sl-.04),hy*(jy-.1)],[hx*(sl+.02),hy*(jy+.3)],[hx*(sl-.22),hy*(jy+.5)],[hx*(sl-.5),hy*(jy+.4)],[hx*.62,hy*(jy+.12)]].map(HT).map(q=>[q[0],Math.min(q[1],GY-1)]),mc||s.hcol,{w:3.8});// v2.11 mastiff: droopy jowls, a little drool
      if(/^(idle|happy|eat|walk|hot)$/.test(L.pose)){const p=HT([hx*(sl-.3),hy*(jy+.5)]);if(p[1]<GY-12)h.shape([[p[0],p[1]],[p[0]+2.6,p[1]+7],[p[0],p[1]+10],[p[0]-2.6,p[1]+7]],'#9EDCFF',{w:2,ox:0,oy:0,sc:1,closed:1})}}
    h.shape(sn.map(HT),mc?s.hcol:s.face.snout===2?s.hcol:s.light,{w:4.4});
    if(mc){const a=.42,y1=sd||.5;h.shape([[hx*(.5+(sl-.5)*a),-hy*.01],[hx*sl,0],[hx*(sl+.05),hy*y1],[hx*(.6+(sl-.6)*a),hy*(y1+.12)]].map(HT),mc,{noline:1,ox:0,oy:0,sc:.93})}}// v2.11: the dark mask on the front of the muzzle
  const bc=f.browCol&&lum(s.hcol)<.32?f.browCol:undefined;// light lines on a dark head (v2.5 collie)
  eyes.forEach((e,i)=>{
    const [x,y]=HT([e[0],e[1]]),r=e[2],m=f.eyes;
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
  const mo=f.mouth;
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
  if(mo==='grin'||mo==='open'){h.shape([[-17,5],[4,4],[0,16],[-12,18]].map(M),'#7A1F2E',{w:3.4,ox:0,oy:0,sc:1});h.shape([[-12,13],[-1,12],[-3,18],[-10,18]].map(M),'#FF6F9A',{noline:1,ox:0,oy:0})}
  if(mo==='chew'){h.shape(circ(0,0,5,3.5,8).map(q=>M([q[0]-6,q[1]+9])),'#7A1F2E',{w:3,ox:0,oy:0,sc:1,closed:1});[[6,16],[-16,18],[2,24]].forEach(c=>{const p=M(c);h.dot(p[0],p[1],2,1.6,'#C98A4E')});if(L.k===1)h.text('nom',HT([N[0]+16*sf,N[1]-6*sf])[0],HT([N[0]+16*sf,N[1]-6*sf])[1],14,INK,-8)}
  if(s.face.drool&&(L.pose==='idle'||L.pose==='happy'||L.pose==='eat'||L.pose==='walk')){const p=M([-15,12]);h.shape([[p[0],p[1]],[p[0]+3,p[1]+7],[p[0],p[1]+10],[p[0]-3,p[1]+7]],'#9EDCFF',{w:2,ox:0,oy:0,sc:1,closed:1})}
  if(s.face.sweet&&!L.blush&&L.pose!=='sad'){[[hx*(e0[0]-.1),hy*(e0[1]+.48)],[hx*(e1[0]+.2),hy*(e1[1]+.5)]].forEach(p=>{const [x,y]=HT(p);h.acc.push(`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(7*sf)}" ry="${R1(4*sf)}" fill="#FF8FAE" opacity=".5"/>`)})}
  if(L.blush){[[hx*(e0[0]-.12),hy*(e0[1]+.5)],[hx*(e1[0]+.2),hy*(e1[1]+.5)]].forEach(p=>{const [x,y]=HT(p);h.acc.push(`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(9*sf)}" ry="${R1(5*sf)}" fill="#FF5C8A" opacity=".55"/>`);h.line([[x-6*sf,y+2],[x-2*sf,y-2],[x+2*sf,y+2],[x+6*sf,y-2]],2,'#E8326A')})}
  if(L.tear){const [x,y]=HT([eyes[1][0],eyes[1][1]]);const r=eyes[1][2];h.shape([[x,y+r+2],[x+4,y+r+10],[x,y+r+14],[x-4,y+r+10]],'#5BC8FF',{w:2.6,ox:0,oy:0,sc:1,closed:1})}
}

/* ---------- outfits ---------- */
const OUT={head:['Party Hat','Flower Crown','Acorn Cap','Rain Hat','Pom-pom Beanie','Chef Hat','Wizard Hat','Sun Hat','Cowboy Hat','Astronaut Helmet','Leaf Beret','Witch Hat','Reindeer Antlers','Year of the Sheep Hood'],eyes:['Heart Sunglasses','Explorer Goggles'],neck:['Red Bandana','Bow Tie','Seashell Necklace','Clover Collar','Rainbow Collar','Sailor Collar','Knit Scarf','Autumn Scarf','Parade Rosette','Candy Corn Bandana','Snowflake Snood','Ugly Sweater Rosette','Shibuya Bandana','Asakusa Bandana','Tokyo Tower Bandana'],body:['Yellow Raincoat','Knit Winter Sweater','Superhero Cape','Mossy Poncho','Frog Raincoat','Polka-dot Raincoat','Bubble Raincoat','Happi Coat','Bumblebee Suit','Cozy Hoodie','Tutu','Pyjamas','Ghost Sheet','Pumpkin Suit','Vampire Cape','Bat Wings','Very Ugly Sweater','Pumpkin Patch Suit','Trick-or-Treat Ghost','Little Bat Costume']};
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
  return{z,root:[b.rx*.1,-b.ry*(s.fluff?.98:.84)],ang:roll?-112:lie?-22:4-fl,far:[b.rx*.26,-b.ry*(s.fluff?1.0:.88)],fang:roll?-84:lie?6:34-fl*.6}}
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
function newbornL(s,L){// eyes shut, ears folded, everything soft and curled
  L.face.eyes='closed';L.ears='sleep';L.face.mouth=L.pose==='sleep'?'sleep':'smile';L.blush=0;L.hearts=0;L.tear=0;L.tailS*=.8;
  if(L.pose==='sleep'){L.hT.x-=s.head.rx*.42;L.hT.y+=s.head.ry*.08;L.hT.a=16;L.tailA=-140}else{L.hT.y+=s.head.ry*.18;L.hT.a=8;L.tailA=-120}}
const BELLY=/^(idle|happy|pet|eat|sleep|walk|sit|sad|dirty|crouch|shake|cold|hot|dig|beg|squat|leglift|paw|down|speak|bow|scratch|sniff|yawn|howl)$/;
function drawBelly(h,s,L,B){// a rounder, lower belly: fill over the body's underline, then a new lower curve
  const b=s.body,lie=/^(sleep|down|crouch)$/.test(L.pose),fl=!!s.fluff&&!b.long,cy=b.ry*(lie?.36:.5)+(fl?b.ry*(lie?.1:.07):0),rx=b.rx*(b.long?.36:.5)*(fl?1.12:1),ry=b.ry*(lie?.6:.68)*(fl?1.1:1),cl=q=>[q[0],Math.min(q[1],GY-1)],E=[],A=[];
  for(let i=0;i<16;i++){const t=i/16*Math.PI*2;E.push([-b.rx*.04+Math.cos(t)*rx,cy+Math.sin(t)*ry])}
  if(fl){// fluffy coat: the bulge hangs low behind the ground, so show it by a lighter tummy and a tufty dome line over it
    const n=15;for(let i=0;i<=n;i++){const f=i/n,t=(1.02+f*.96)*Math.PI,k=1+(i%2?.06:-.02);A.push([-b.rx*.04+Math.cos(t)*rx*k,cy+Math.sin(t)*ry*k])}}
  else for(let i=0;i<=8;i++){const t=(.17+i/8*.66)*Math.PI;A.push([-b.rx*.04+Math.cos(t)*rx,cy+Math.sin(t)*ry])}
  h.shape(E.map(B).map(cl),fl?mix(s.col,'#FFFFFF',.22):s.col,{noline:1,ox:0,oy:0,sc:1});h.line(A.map(B).map(cl),fl?h.LW*.75:h.LW,INK,fl?1.4:.9)}
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
function frame(key,s,pose,outfit,k,seed){
  const h=kit(rng(seed+k*7717)),L=layout(s,pose,k);if(s.pup){h.setJ(s.pup===2?1.5:1.3);if(s.pup===2)newbornL(s,L)}if(pose==='rollover'||pose==='playdead')h.cy=GY+3;const _u=0,B=T(L.bT),HT=T(L.hT),hp=headPts(s),bp=bodyPts(s);
  const has=(slot)=>outfit&&outfit[slot]&&OUT[slot].includes(outfit[slot])?outfit[slot]:null;
  const body=has('body'),top=body&&TOP2[body]?body:null,neck=has('neck'),hat=top?null:has('head'),eyes=has('eyes'),sheet=body==='Ghost Sheet'||body==='Trick-or-Treat Ghost';// v2.11.1: a costume with its own head piece (TOP2) drops the hat
  if(top==='Little Bat Costume')L.hood=1;// the dog's own ears stay inside the bat hood
  if(hat==='Astronaut Helmet'){if(L.ears!=='flat')L.ears=/^(giant|bat|tall)$/.test(s.ears)?'sleep':'norm';L.earFit=Math.max(s.head.rx,s.head.ry)*1.38}
  if(hat==='Year of the Sheep Hood'){L.hood=1;if(body==='Ghost Sheet')L.ghost=1}// v2.8: flop ears stay inside the hood, the hood draws the prick ears itself
  if(body==='Superhero Cape')drawCape(h,s,L,B);
  if(body&&BACK2[body])BACK2[body](h,s,L,B);
  drawTail(h,s,L,B);
  if(body==='Tutu'){h._legSkip='NH';drawLegs(h,s,L);h._legSkip=0}else drawLegs(h,s,L);
  // neck: a short tube from the chest to the head, behind the body
  {const nb=B([s.body.rx*.62,-s.body.ry*.3]),nh=HT([-s.head.rx*.2,s.head.ry*.35]);if(L.pose==='eat'||L.pose==='jump'||L.pose==='sit'||L.pose==='sad'||s.neck)h.tube([nb,nh],s.head.rx*.7,s.col)}
  h.shape(bp.map(B),s.col,{step:s.body.long?14:11});h.crayon(s.body.rx,s.body.ry,B,s.col,s.body.long?16:12);
  if(s.expecting&&BELLY.test(pose))drawBelly(h,s,L,B);
  if(s.marks)s.marks(h,B,HT,s);
  if(s.pat)s.pat.body(h,B,L);
  if(s.spk)glitter(h,s,B,k,0);
  if(L.scrunch)[-.45,-.1,.25].forEach(x=>h.line([[s.body.rx*x,-s.body.ry*.85],[s.body.rx*(x+.06),0],[s.body.rx*x,s.body.ry*.85]].map(B),2.6));
  if(L.mud)drawMud(h,s,L,B,HT);
  if(body&&body!=='Superhero Cape'&&body!=='Tutu'&&!sheet)drawCoat(h,s,L,B,body);
  if(body==='Superhero Cape')drawCapeTie(h,s,L,B);
  drawHaunch(h,s,L,B);
  if(body==='Tutu')drawCoat(h,s,L,B,body);
  if(L.paw){h._legPass='raised';drawLegs(h,s,L);h._legPass='ground'}
  if(s.ruff&&!sheet)drawRuff(h,s,L,HT);
  if(!sheet)drawEars(h,s,L,HT,false);
  if(s.topknot&&!hat&&(!top||top==='Pumpkin Patch Suit'))drawTopknot(h,s,HT);
  {const hf=s.hfluff===undefined?s.fluff:s.hfluff;h.shape(hp.map(HT),s.hcol,{step:hf?30:11,amp:hf?.8:1.2})};h.crayon(s.head.rx,s.head.ry*.6,p=>HT([p[0],p[1]-s.head.ry*.3]),s.hcol,6);
  if(s.headMarks)s.headMarks(h,HT,s);
  if(s.pat)s.pat.head(h,HT,L);
  if(s.spk)glitter(h,s,HT,k,1);
  if(L.mud){const hx=s.head.rx,hy=s.head.ry;h.shape(circ(-hx*.45,-hy*.45,hx*.18,hy*.15,7,.2).map(HT),'#7A4A22',{noline:1,ox:0,oy:0})}
  drawFace(h,s,L,HT);
  if(eyes&&pose!=='sleep'&&!sheet)(eyes==='Explorer Goggles'?drawGoggles:drawGlasses)(h,s,L,HT);
  if(body==='Cozy Hoodie'&&/^(cold|sleep)$/.test(pose))drawHood(h,s,L,HT);
  if(!sheet)drawEars(h,s,L,HT,true);
  if(body==='Ghost Sheet'){drawGhost(h,s,L,B,HT);if(eyes&&pose!=='sleep')(eyes==='Explorer Goggles'?drawGoggles:drawGlasses)(h,s,L,HT)}
  if(neck&&top!=='Trick-or-Treat Ghost')drawNeck(h,s,L,HT,neck);
  if(hat)drawHat(h,s,L,HT,hat);
  else if(body==='Bumblebee Suit')HAT2.Antennae(h,s,L,HT);
  else if(body==='Pyjamas'&&outfit.sleepwear)HAT2.Nightcap(h,s,L,HT);
  if(top){TOP2[top](h,s,L,HT);if(top==='Trick-or-Treat Ghost'&&eyes&&pose!=='sleep')(eyes==='Explorer Goggles'?drawGoggles:drawGlasses)(h,s,L,HT)}
  drawFx(h,s,L,B,HT);
  return {h,L};
}
// marks draw on both body and head; run them twice, once per layer (points mapped to NaN are skipped)
const NAN=()=>[NaN,NaN];
Object.keys(SP).forEach(k=>{const s=SP[k],m=s.marks;if(!m)return;s.marks=(h,B,HT,sp)=>m(h,B,NAN,sp);s.headMarks=(h,HT,sp)=>m(h,NAN,HT,sp)});

/* ---------- coat variants (v1.5A): recolour a breed spec; no coat = the original spec object ---------- */
const HEX=/^#[0-9a-fA-F]{6}$/,EYE={blue:'#3FA9F5',amber:'#E2A23A',brown:null};
function coated(key,coat,seed,S0){
  S0=S0||SP[key];if(!coat||typeof coat!=='object')return S0;
  const c=k=>HEX.test(coat[k]||'')?coat[k]:null,base=c('base'),light=c('light'),dark=c('dark'),white=+coat.white||0,merle=!!coat.merle;
  const s=Object.assign({},S0);s.legs=Object.assign({},S0.legs);
  if(key==='mutt'){// Pepper: white dog with base-coloured patches when piebald; otherwise a solid base dog
    const pc=base||S0.dark;if(white>=.6){s.dark=pc;s.legs.cols={NH:pc}}else{s.col=s.hcol=pc;s.dark=dark||pc;s.legs.cols=null;s.marks=null;s.headMarks=null}}
  else{if(base){s.col=s.hcol=base}
    if(light){s.light=light;if(S0.legs.col)s.legs.col=light;if(S0.legs.sock)s.legs.sock=light}
    if(dark&&S0.ear&&key!=='beagle')s.ear=dark;if(dark&&S0.dark)s.dark=dark;}
  if(coat.brindle)s.brindle=1;// v2.11 dane, mastiff: the brindle look (no other dog draws it)
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
    s.hfluff=H0.hfluff===undefined?!!H0.fluff:!!H0.hfluff;s.iris=H0.iris;s.curlEar=H0.curlEar;s.topknot=H0.topknot;s.earS=H0.earS;s.earRound=H0.earRound;s.sqHead=H0.sqHead}
  return s;
}
// puppy (62%) and newborn (42%): drawn at adult scale with puppy proportions, then scaled down by pupScale in dog()
function pupSpec(S0,age){
  const nb=age==='newborn',s=Object.assign({},S0),b=S0.body,hd=S0.head,lg=S0.legs,f=S0.face;
  const BK=b.long?(nb?.62:.72):(nb?.84:.9),HK=(nb?1.2:1.3)*(b.deep?1.18:1),legK=nb?.32:(b.deep?.56:.5),leg=GY-(b.y+b.ry*.42);
  s.body=Object.assign({},b,{rx:b.rx*BK,ry:b.ry*(b.deep?1.12:nb?1.08:1.04)});
  s.body.y=GY-s.body.ry*.42-leg*legK;s.body.x=b.x+(b.long?6:2);
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
  key=SP[key]?key:'shiba';const SF=specFor(key,o),s=SF.s,lk=SF.lk;
  let pose=POSES.includes(o.pose)?o.pose:'idle';const anim=o.anim!==false,nF=anim?3:1,left=o.facing==='left';
  if(lk.age==='newborn')pose=NBSLEEP.test(pose)?'sleep':'down';
  const seed=hashS('pa'+key+pose)*5+3;
  const fr=[];const bb=[1e9,1e9,-1e9,-1e9];
  for(let k=0;k<nF;k++){const f=frame(key,s,pose,o.outfit,k,seed);fr.push(f);const b=f.h.bb;bb[0]=Math.min(bb[0],b[0]);bb[1]=Math.min(bb[1],b[1]);bb[2]=Math.max(bb[2],b[2]);bb[3]=Math.max(bb[3],b[3])}
  // keep everything inside the canvas: shrink around the feet anchor if anything pokes out (puppies: scale to size first)
  const ps=s.pupScale||1,pdr=ps===1?0:(s.pupDx||0)*ps,pdx=left?-pdr:pdr,bx=ps===1?bb:[120+(bb[0]-120)*ps+pdr,GY+(bb[1]-GY)*ps,120+(bb[2]-120)*ps+pdr,GY+(bb[3]-GY)*ps];
  const m=3,sc=Math.min(1,(GY-m)/(GY-bx[1]),(120-m)/(120-bx[0]),(240-m-120)/(bx[2]-120),bx[3]>GY?(199.5-GY)/(bx[3]-GY):1),tot=sc*ps;
  const fit=tot<.999?` transform="translate(${pdx?R1(120+pdx*sc):120} ${GY}) scale(${tot.toFixed(3)}) translate(-120 -${GY})"`:'';
  const L0=fr[0].L,shx=pose==='sleep'?L0.bT.x+12:L0.bT.x+8,shw=(s.body.rx*(pose==='jump'?.7:1.15)+(pose==='sleep'?20:0));
  const shy=pose==='jump'?3.5:6;let hd='';for(let x=-shw+3;x<shw-2;x+=5.5){const t=x/shw,half=shy*Math.sqrt(Math.max(0,1-t*t));if(half<1)continue;hd+=`M${R1(shx+x)} ${R1(GY+1.5+half*.9)}l4 ${R1(-half*1.8)}`}
  const shadow=`<ellipse cx="${R1(shx)}" cy="${GY+1.5}" rx="${R1(shw)}" ry="${shy}" fill="${PEN}" opacity="${pose==='jump'?.06:.1}"/><path d="${hd}" stroke="${PEN}" stroke-width="1.3" stroke-linecap="round" opacity="${pose==='jump'?.25:.4}" fill="none"/>`;
  let frames='';
  fr.forEach((f,k)=>{
    const tx=f.h.texts.map(t=>{const x=left?240-t.x-t.size*.6*t.s.length:t.x;return `<text x="${R1(x)}" y="${R1(t.y)}" transform="rotate(${R1(left?-t.rt:t.rt)} ${R1(x)} ${R1(t.y)})" font-family="'Gloria Hallelujah',cursive" font-size="${t.size}" fill="${t.col}">${t.s}</text>`}).join('');
    frames+=`<g class="pa-d-f${k}">${left?`<g transform="translate(240 0) scale(-1 1)">${f.h.acc.join('')}</g>`:f.h.acc.join('')}${tx}</g>`;
  });
  if(s.pup){const SW=s.pup===2?1.5:1.3;frames=frames.replace(/stroke-width="([\d.]+)"/g,(q,v)=>`stroke-width="${R1(v*SW)}"`).replace(/font-size="([\d.]+)"/g,(q,v)=>`font-size="${R1(v*1.35)}"`)}
  let spk='';if(s.spk){const f=[120+(bx[0]-120)*sc,GY+(bx[1]-GY)*sc,120+(bx[2]-120)*sc,GY+(bx[3]-GY)*sc],fb=left?[240-f[2],f[1],240-f[0],f[3]]:f;spk=stars(hashS('spk'+key+pose+String(o.seed==null?'':o.seed)),fb,0,s.pup===2?6:s.pup?7:8)}
  const lab=`${s.name} the ${s.breed}, ${pose}`;
  if(!SF.nu)return `<svg class="pa-dog pa-pose-${pose}${anim?' pa-d-anim':''}" viewBox="0 0 240 200" role="img" aria-label="${lab}"><g${fit}>${left?`<g transform="translate(240 0) scale(-1 1)">${shadow}</g>`:shadow}${frames}</g></svg>`;
  const cls=(lk.age?' pa-d-'+lk.age:'')+(s.mixHead?' pa-d-mix':'')+(s.spk?' pa-d-sparkle':'')+(s.expecting?' pa-d-expecting':'');
  return `<svg class="pa-dog pa-pose-${pose}${anim?' pa-d-anim':''}${cls}" viewBox="0 0 240 200" role="img" aria-label="${lab}${lk.age?', '+lk.age:''}${s.mixHead?' mix':''}"><g${fit}>${left?`<g transform="translate(240 0) scale(-1 1)">${shadow}</g>`:shadow}${frames}</g>${spk}</svg>`;
}
function dogHead(key,o={}){
  key=SP[key]?key:'shiba';const SF=specFor(key,o),s=SF.s,h=kit(rng(hashS('pahead'+key))),L=layout(s,'idle',0),HT=T(L.hT);
  if(s.ears!=='giant')L.face.eyes=s.face.eyes;if(s.pup===2){L.face.eyes='closed';L.ears='sleep';L.face.mouth='smile'}
  if(s.pup)h.setJ(s.pup===2?1.25:1.15);
  if(s.ruff)drawRuff(h,s,L,HT);drawEars(h,s,L,HT,false);if(s.topknot===2)drawTopknot(h,s,HT);h.shape(headPts(s).map(HT),s.hcol,{step:(s.hfluff===undefined?s.fluff:s.hfluff)?30:11});if(s.headMarks)s.headMarks(h,HT,s);if(s.pat)s.pat.head(h,HT,L);drawFace(h,s,L,HT);drawEars(h,s,L,HT,true);
  let b=h.bb;if(NEWK.test(s.mixHead||key)){if(s.ears==='bat'){const hd=s.head,c=HT([0,0]);b=[c[0]-hd.rx*1.4,c[1]-hd.ry*1.8,c[0]+hd.rx*1.4,c[1]+hd.ry*1.08]}}// v2.5 heads fit by what was drawn (their ears and muzzles differ from the fixed boxes below)
  else if(/^(giant|bat)$/.test(s.ears)){const hd=s.head,c=HT([0,0]);b=[c[0]-hd.rx*1.25,c[1]-hd.ry*2.1,c[0]+hd.rx*1.25,c[1]+hd.ry*1.05]}else if(s.face.snoutL){const hd=s.head,c=HT([0,0]);b=[c[0]-hd.rx*1.25,c[1]-hd.ry*1.7,c[0]+hd.rx*1.75,c[1]+hd.ry*1.25]}
  const w=b[2]-b[0],ht=b[3]-b[1],sc=Math.min(86/w,86/ht),cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;
  if(!SF.nu)return `<svg class="pa-dog-head" viewBox="0 0 100 100" overflow="hidden" role="img" aria-label="${s.name} the ${s.breed}"><g transform="translate(50 ${R1(50+ (ht*sc<80?4:0))}) scale(${sc.toFixed(3)}) translate(${R1(-cx)} ${R1(-cy)})">${h.acc.join('')}</g></svg>`;
  const spk=s.spk?stars(hashS('spkh'+key+String(o.seed==null?'':o.seed)),[12,10,88,64],3,5):'';
  return `<svg class="pa-dog-head${SF.lk.age?' pa-d-'+SF.lk.age:''}${s.mixHead?' pa-d-mix':''}${s.spk?' pa-d-sparkle':''}" viewBox="0 0 100 100" overflow="hidden" role="img" aria-label="${s.name} the ${s.breed}"><g transform="translate(50 ${R1(50+ (ht*sc<80?4:0))}) scale(${sc.toFixed(3)}) translate(${R1(-cx)} ${R1(-cy)})">${h.acc.join('')}</g>${spk}</svg>`;
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
PA.dog=dog;PA.dogHead=dogHead;
PA.DOGS=KEYS.map(k=>({key:k,name:SP[k].name,breed:SP[k].breed,personality:SP[k].personality,joke:SP[k].joke}));
})();
