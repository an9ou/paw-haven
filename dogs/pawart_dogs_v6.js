/* Paw Haven dog art module, style H "Ugly hand-drawn".
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

/* ---------- the crude drawing kit: every point it draws is tracked for fitting ---------- */
function kit(r){
  const J=a=>(r()-.5)*2*a,acc=[],bb=[1e9,1e9,-1e9,-1e9],texts=[],LW=3.7;
  const tr=(x,y)=>{if(x<bb[0])bb[0]=x;if(y<bb[1])bb[1]=y;if(x>bb[2])bb[2]=x;if(y>bb[3])bb[3]=y};
  const pl=(P,amp)=>{let d='';for(let i=0;i<P.length;i++){const x=P[i][0]+J(amp),y=P[i][1]+J(amp);tr(x,y);d+=(i?'L':'M')+R1(x)+' '+R1(y)}return d};
  const st=(d,w,c,x='')=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${x}/>`;
  const h={J,r,acc,bb,texts,LW,tr,
    // bucket fill that misses the outline, plus a jaggy outline that may not close
    shape(pts,fill,o={}){
      if(!pts.length||isNaN(pts[0][0]))return;
      const P=dense(pts,true,o.step||11),n=P.length;let cx=0,cy=0;P.forEach(q=>{cx+=q[0]/n;cy+=q[1]/n});
      const ox=o.ox??2.4+J(1),oy=o.oy??-1.6+J(1),sc=o.sc??.97;
      if(fill)acc.push(`<path d="${pl(P.map(q=>[cx+(q[0]-cx)*sc+ox,cy+(q[1]-cy)*sc+oy]),o.famp??1.1)}Z" fill="${fill}"${o.fop?` fill-opacity="${o.fop}"`:''}/>`);
      if(!o.noline){const s0=Math.floor(r()*n),cnt=n+(o.closed?1:(r()<.55?0:-1)),L=[];for(let i=0;i<=cnt;i++)L.push(P[(s0+i)%n]);acc.push(st(pl(L,o.amp??1.2),o.w||LW,INK))}
    },
    tube(pts,w,fill,o={}){const P=dense(pts,false,8);acc.push(st(pl(P,.9),w+(o.ow??LW*1.45),INK));if(fill)acc.push(st(pl(P,.8),w,fill,` transform="translate(${o.ox??1.2} ${o.oy??-.8})"`))},
    line(pts,w,col,amp=1){acc.push(st(pl(dense(pts,false,7),amp),w,col||INK))},
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
  marks:(h,B,Hd,s)=>{const b=s.body;h.shape([[-b.rx*.8,b.ry*.45],[b.rx*.2,b.ry*.62],[b.rx*1.0,b.ry*.1],[b.rx*.85,b.ry*.95],[-b.rx*.6,b.ry*1.0]].map(B),W,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;h.shape([[hx*.1,-hy*.95],[hx*.3,-hy*.95],[hx*.42,hy*.05],[hx*.95,hy*.25],[hx*.85,hy*.85],[-hx*.5,hy*.9],[-hx*.75,hy*.4],[-hx*.05,hy*.15]].map(Hd),W,{noline:1})}},
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
  marks:(h,B,Hd,s)=>{const b=s.body;h.shape([[-b.rx*.7,b.ry*.5],[b.rx*.3,b.ry*.55],[b.rx*.95,b.ry*.1],[b.rx*.8,b.ry*.9],[-b.rx*.5,b.ry*.95]].map(B),W,{noline:1});
   const hx=s.head.rx,hy=s.head.ry;h.shape([[-hx*.92,hy*.0],[-hx*.55,-hy*.42],[-hx*.08,-hy*.12],[hx*.08,-hy*.55],[hx*.25,-hy*.12],[hx*.7,-hy*.45],[hx*.95,hy*.05],[hx*.8,hy*.75],[hx*.05,hy*.98],[-hx*.75,hy*.72]].map(Hd),W,{noline:1,ox:0,oy:1})}},
 mutt:{name:'Pepper',breed:'Shelter Mutt',personality:'Loyal, gentle',joke:'I have zero matching spots.',
  col:W,hcol:W,dark:'#1D1A22',body:{x:110,y:144,rx:44,ry:23,lop:.04},head:{x:162,y:106,rx:33,ry:29},
  legs:{h:-28,f:25,w:9,cols:{NH:'#1D1A22'}},ears:'mixed',tail:'line',eyes:[7.6,6.2],face:{eyes:'open',mouth:'tongue',brow:'soft',sweet:1},
  marks:(h,B,Hd,s)=>{const b=s.body,K=s.dark;h.shape(circ(-b.rx*.28,-b.ry*.15,b.rx*.3,b.ry*.55,10).map(B),K,{noline:1,ox:0,oy:0});h.shape(circ(b.rx*.42,b.ry*.05,b.rx*.25,b.ry*.6,10).map(B),K,{noline:1,ox:0,oy:0});h.shape(circ(-b.rx*.8,b.ry*.45,b.rx*.12,b.ry*.3,8).map(B),K,{noline:1,ox:0,oy:0});
   const hx=s.head.rx,hy=s.head.ry;h.shape(circ(hx*.42,-hy*.18,hx*.42,hy*.46,11).map(Hd),K,{noline:1,ox:0,oy:0});h.shape(circ(-hx*.55,hy*.5,hx*.16,hy*.15,8).map(Hd),K,{noline:1,ox:0,oy:0})}}
};
const KEYS=['shiba','corgi','golden','dachs','husky','mutt'];

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
   case 'sit':{legMode='sit';const a=b.long?-30:-34;L.bT.a=a;if(b.long){L.bT.sx=.58;L.scrunch=1}const rear=[-b.rx*.72,b.ry*.62],rq=rot(rear,a);const R=[b.x-b.rx*(b.long?.2:.45),GY-3];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
     {const BT=T(L.bT);let my=-1e9;bodyPts(s).forEach(p=>{const q=BT(p);if(q[1]>my)my=q[1]});if(my>GY-1)L.bT.y-=my-(GY-1)}
     const hq=rot([rel[0]*(L.bT.sx||1),rel[1]],a*.55);L.hT.x=L.bT.x+hq[0]+4-(b.long?14:0);L.hT.y=L.bT.y+hq[1]-2-(b.long?8:0);L.tailA=-70;L.face.mouth=s.face.mouth==='o'?'smile':s.face.mouth;break}
   case 'beg':{legMode='beg';L.face.eyes='hope';L.face.mouth=s.face.mouth==='o'||s.face.mouth==='smirk'?'smile':s.face.mouth==='grin'?'grin':'smile';L.ears='perk';L.hope=1;const a=b.long?-48:-58;L.bT.a=a;if(b.long){L.bT.sx=.58;L.scrunch=1}const rear=[-b.rx*.72,b.ry*.62],rq=rot(rear,a);const R=[b.x-b.rx*(b.long?.2:.45),GY-3];L.bT.x=R[0]-rq[0];L.bT.y=R[1]-rq[1];
     {const BT=T(L.bT);let my=-1e9;bodyPts(s).forEach(p=>{const q=BT(p);if(q[1]>my)my=q[1]});if(my>GY-1)L.bT.y-=my-(GY-1)}
     const hq=rot([rel[0]*(L.bT.sx||1),rel[1]],a*.55);L.hT.x=L.bT.x+hq[0]+4-(b.long?14:0);L.hT.y=L.bT.y+hq[1]-2-(b.long?8:0);L.tailA=-70;L.face.mouth=s.face.mouth==='o'?'smile':s.face.mouth;break}
   case 'sad':L.face.eyes='sad';L.face.mouth='frown';L.ears='droop';L.tear=1;L.tailA=-80;L.tailS=.85;L.hT.y+=11;L.hT.x-=2;L.hT.a=10;break;
   case 'dirty':L.mud=1;L.stink=1;break;
   case 'squat':legMode='squat';L.face.eyes='strain';L.face.mouth='tight';L.ears='norm';L.tailA=38;L.bT.a=-14;L.bT.y+=b.long?3:6;L.bT.x+=2;L.hT.y+=2;L.hT.a=-4;L.sweat=1;L.blush=0;L.shy=1;break;
   case 'leglift':legMode='lift';L.face.eyes='whistle';L.face.mouth='whistle';L.tailA=12;L.bT.a=3;L.hT.a=-10;L.hT.y-=2;L.notes=1;break;
   case 'crouch':{legMode='crouch';L.ears='flat';L.face.eyes='open';L.face.mouth=s.face.mouth==='o'?'o':'smile';L.tailA=-60;L.tailS=.8;{const sy=s.fluff?.52:b.long?.62:.8;L.bT.sy=sy;L.bT.y=GY-6-b.ry*sy;}L.hT.y=GY-3-hd.ry*(s.fluff?.85:.95);L.hT.x=hd.x+8;L.hT.a=6;L.speed=0;L.duck=1;break}
   case 'shake':L.face.eyes='closed';L.face.mouth='smile';L.ears='fly';L.hT.a=[-16,14,-6][k];L.bT.a=[5,-5,2][k];L.hT.x+=[-3,3,0][k];L.tailA=[30,-20,10][k];L.spray=1;break;
   case 'cold':L.face.eyes='sad';L.face.mouth='frown';L.ears='droop';L.tailA=-90;L.tailS=.7;{const j=[-2,2,-1][k];L.bT.x+=j;L.hT.x+=j*1.5;L.bT.y+=3;L.hT.y+=8;L.hT.a=6}L.snow=1;L.blueNose=1;L.shiver=1;break;
   case 'hot':L.face.eyes='sad';L.face.mouth='pant';L.ears='droop';L.tailA=-60;L.tailS=.85;L.hT.y+=8;L.hT.a=8;L.heat=1;L.bT.y+=2;break;
   case 'dig':{legMode='dig';L.face.eyes='down';L.face.mouth='open';L.ears='perk';L.tailA=34;L.bT.a=12;
     const N=noseLocal(s),q=rot(N,28);L.hT.a=28;L.hT.x=hd.x+4;L.hT.y=Math.min(hd.y+30,GY-6-hd.ry);L.dirt=1;break}
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
    else if(legMode==='crouch'){foot=front?[hip[0]+12,GY-up*.5]:[hip[0]-10,GY-up*.5];}
    else if(legMode==='dig'){if(front){const pw=[[18,-14],[6,-2],[22,-6]][L.k]||[18,-14];foot=near?[hip[0]+pw[0],GY+pw[1]]:[hip[0]+10-pw[0]*.3,GY-up]}else foot=[hip[0]-4,GY-up];}
    else if(legMode==='splay'){foot=front?[hip[0]+26+(near?0:4),hip[1]+12-(near?0:5)]:[hip[0]-28+(near?0:4),hip[1]+10-(near?0:5)];}
    else if(legMode==='beg'){if(!front){L.legs.push({haunch:near?1:0,sitfoot:near?0:1,hip,col,w,i,id,near});return}
      const wv=[0,-3,1][L.k||0],sh=B([b.rx*(near?.62:.5),-b.ry*.15]);L.legs.push({hip:sh,foot:[sh[0]+(near?20:15),sh[1]+(near?4:-1)+wv],mid:[sh[0]+(near?10:7),sh[1]+(near?16:11)],col,sock,w,i,id,near,raised:1});L.paw=1;return}
    else if(legMode==='sit'){if(!front){L.legs.push({haunch:near?1:0,sitfoot:near?0:1,hip,col,w,i,id,near});return}foot=[hip[0]+3,GY-up];}
    L.legs.push({hip,foot,col,sock,w,i,id,near});
  });
  return L;
}
function noseLocal(s){const f=s.face,hx=s.head.rx,hy=s.head.ry;return f.nose?[hx*f.nose[0],hy*f.nose[1]]:[hx*.66,hy*.26]}

/* ---------- parts ---------- */
function drawEars(h,s,L,HT,front){
  const hx=s.head.rx,hy=s.head.ry,mode=L.ears,col=s.ear||s.hcol,ty=s.ears;
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
  if(ty==='dflop')E.push({pts:pr([[-.25,-.85],[-.85,-.6],[-1.02,.7],[-.7,1.0],[-.42,.2]]),pivot:pr([[-.5,-.75]])[0],side:-1,flop:1});
  E.forEach(e=>{
    const isFront=!!e.flop;if(isFront!==front)return;
    let a=0;
    if(mode==='droop')a=e.flop?-e.side*8:-e.side*-68*(s.ears==='giant'?.9:1);
    if(mode==='sleep')a=e.flop?0:e.side*48;
    if(mode==='fly')a=e.flop?e.side*-150+(e.side<0?0:300):-35;
    if(mode==='perk')a=e.flop?e.side*-10:e.side*6;
    if(mode==='eat'&&e.flop)a=e.side*-30;
    if(mode==='flat')a=e.flop?e.side*-35:(s.ears==='giant'?-78:-62)+(e.side<0?-8:0);
    if(mode==='droop'&&!e.flop)a=e.side*(s.ears==='giant'?38:62);
    let p=a?rotAbout(e.pts,a,e.pivot):e.pts;
    h.shape(p.map(HT),e.col||col,{w:3.8});
    if(e.inner){const c=[(p[0][0]+p[2][0])/2,(p[0][1]+p[2][1])/2];const ip=p.map(q=>[c[0]+(q[0]-c[0])*.55,c[1]+(q[1]-c[1])*.55]);ip[1]=[c[0]+(p[1][0]-c[0])*.7,c[1]+(p[1][1]-c[1])*.7];h.shape(ip.map(HT),s.ears==='tall'?W:'#FFB8C4',{noline:1,ox:0,oy:0});}
  });
}
function drawTail(h,s,L,B){
  const b=s.body,a=L.tailA,sc=L.tailS,col=s.col;
  const base=[-b.rx*(b.long?.96:.86),-b.ry*.25];
  let aa=a,ss=sc;if(s.tail==='spiral'){if(L.pose==='sleep'){aa=22;ss=.82}else if(L.pose==='sit'){aa=-22;ss=.85}else if(L.pose==='sad'){aa=-34;ss=.84}}
  const map=pts=>pts.map(p=>{const q=rot([p[0]*ss,p[1]*ss],aa),c=B([base[0]+q[0],base[1]+q[1]]);return[c[0],Math.min(c[1],GY-2)]});
  switch(s.tail){
   case 'spiral':h.tube(map(spiral(-18,-46,4,30,1.55,26,2.0).reverse().concat([[0,0]]).reverse()),13*Math.min(1,ss*1.1),col,{ow:ss<1?5.5:undefined});break;
   case 'nub':h.shape(map(circ(-6,-4,10,8,9)),col);break;
   case 'wiggle':h.line(map([[0,0],[-12,-8],[-8,-18],[-20,-24],[-16,-34],[-28,-42]]),4.8);break;
   case 'thin':h.tube(map([[0,0],[-12,-8],[-18,-22],[-17,-36]]),6,col);break;
   case 'fluffy':h.tube(map([[0,0],[-22,-6],[-32,-26],[-24,-46]]),14,col);h.tube(map([[-30,-34],[-24,-46]]),14,W,{ow:0});break;
   case 'line':h.line(map([[0,0],[-14,-10],[-10,-22],[-22,-30],[-22,-44]]),4.8);break;
  }
}
function drawLegs(h,s,L){
  const one=l=>{
    const a=h.acc.length;
    if(l.sitfoot){const hp=T(L.bT)([-s.body.rx*.45,s.body.ry*.25]);h.shape(circ(hp[0]+s.body.ry*.9+9,GY-6,s.body.ry*.5+3,4,8),l.col,{w:3.4})}
    else{h.tube([l.hip,l.mid||[(l.hip[0]+l.foot[0])/2+1,(l.hip[1]+l.foot[1])/2],l.foot],l.w,l.col);
      if(L.paw&&l.foot&&(l.id==='NF'||l.id==='FF'))h.shape(circ(l.foot[0]+2,l.foot[1],l.w*.75,l.w*.6,7),l.sock||l.col,{w:2.8,ox:0,oy:0,sc:1,closed:1});
      if(l.sock&&!l.raised){const t=.62,sx=l.hip[0]+(l.foot[0]-l.hip[0])*t,sy=l.hip[1]+(l.foot[1]-l.hip[1])*t;h.acc.push(`<path d="M${R1(sx+1)} ${R1(sy)}L${R1(l.foot[0]+1)} ${R1(l.foot[1]-1)}" stroke="${l.sock}" stroke-width="${R1(l.w)}" stroke-linecap="round"/>`)}}
    h.acc.splice(a,0,`<g class="pa-d-leg pa-d-leg-${l.id}">`);h.acc.push('</g>');
  };
  const only=h._legPass||'ground';const ok=l=>only==='raised'?l.raised:!l.raised;
  L.legs.filter(l=>!l.near&&!l.haunch&&ok(l)).forEach(one);L.legs.filter(l=>l.near&&!l.haunch&&ok(l)).forEach(one);
}
function drawHaunch(h,s,L,B){
  const b=s.body;L.legs.filter(l=>l.haunch).forEach(l=>{
    const a=h.acc.length,c=B([-b.rx*.45,b.ry*.25]);if(!s.fluff)h.shape(circ(c[0],c[1]+2,b.ry*.95,b.ry*.85,10),s.col);
    h.shape(circ(c[0]+b.ry*.9,GY-4,b.ry*.6+3,4.5,8),l.col,{w:3.6});
    h.acc.splice(a,0,`<g class="pa-d-leg pa-d-leg-NH">`);h.acc.push('</g>');
  });
}
function bodyPts(s){const b=s.body;return s.fluff?scallop(0,0,b.rx,b.ry,13,.13):circ(0,0,b.rx,b.ry,b.long?18:15,b.lop||0)}
function headPts(s){const hd=s.head;return s.fluff?scallop(0,0,hd.rx,hd.ry,10,.12):circ(0,0,hd.rx,hd.ry,13,.04)}
function drawFace(h,s,L,HT){
  const f=L.face,hx=s.head.rx,hy=s.head.ry,sf=hx/33;
  const e0=f.e0||[-.1,-.04],e1=f.e1||[.42,-.1],er=s.eyes;
  const eyes=[[hx*e0[0],hy*e0[1],er[0]],[hx*e1[0],hy*e1[1],er[1]]];
  if(s.face.snout){const sn=[[hx*.5,-hy*.02],[hx*1.5,hy*.0],[hx*1.55,hy*.5],[hx*.6,hy*.62]];h.shape(sn.map(HT),s.light,{w:4.4})}
  eyes.forEach((e,i)=>{
    const [x,y]=HT([e[0],e[1]]),r=e[2],m=f.eyes;
    if(m==='happy'){h.line([[x-r,y+r*.35],[x,y-r*.55],[x+r,y+r*.35]],4.2);return}
    if(m==='closed'){h.line([[x-r,y],[x,y+r*.5],[x+r,y]],3.8);return}
    h.shape(circ(x,y,r,r*1.05,12),W,{ox:0,oy:0,sc:1,w:2.3,amp:.45,closed:1,famp:.25});
    let lx=.06,ly=.1;const lk=s.face.look&&(L.pose==='idle'||L.pose==='walk'||L.pose==='dirty')?s.face.look[i]:null;if(lk){lx=lk[0];ly=lk[1]}if(m==='hope'){lx=.15;ly=-.45}if(m==='strain'){lx=.1;ly=.1}if(m==='whistle'){lx=-.4;ly=-.5}if(m==='down'||m==='sad')ly=.6;if(m==='smug'){lx=.12;ly=.5}if(L.pose==='jump'){lx=.4;ly=-.35}if(L.pose==='eat')lx=.35;
    const px=x+lx*r*.4,py=y+ly*r*.4;
    if(s.iris){h.dot(px,py,r*.68,r*.72,s.iris);h.dot(px,py,r*.34,r*.36)}else{const pr=s.face.pupil||.57;h.dot(px,py,r*pr,r*(pr+.03))}
    h.dot(px-r*.2,py-r*.26,r*.2,r*.2,W);h.dot(px+r*.2,py+r*.22,r*.09,r*.09,W);
    if(m==='smug'){const ly2=y-r*.05;h.acc.push(`<path d="M${R1(x-r-1.5)} ${R1(ly2)}L${R1(x-r-1.5)} ${R1(y-r-3)}L${R1(x+r+1.5)} ${R1(y-r-3)}L${R1(x+r+1.5)} ${R1(ly2)}Z" fill="${s.hcol}"/>`);h.line([[x-r-2,ly2],[x+r+2,ly2]],3.4)}
    const inner=i===0?1:-1;// brow: inner end is toward the other eye
    if(m==='strain'){h.line([[x-r*1.1,y-r*1.3-(inner>0?4:0)],[x+r*1.1,y-r*1.3-(inner>0?0:4)]],3);if(i===0){h.acc.push(`<path d="M${R1(x-r-1.5)} ${R1(y-r*.15)}L${R1(x-r-1.5)} ${R1(y-r-3)}L${R1(x+r+1.5)} ${R1(y-r-3)}L${R1(x+r+1.5)} ${R1(y-r*.15)}Z" fill="${s.hcol}"/>`);h.line([[x-r-2,y-r*.15],[x+r+2,y-r*.15]],2.6)}}
    else if(m==='whistle'){h.line([[x-r*1.1,y-r*1.6],[x+r*1.1,y-r*1.75]],2.6)}
    else if(m==='hope'){h.dot(px+r*.22,py+r*.05,r*.12,r*.12,W);h.line([[x-r*1.1,y-r*1.45-(inner<0?5:0)],[x+r*1.1,y-r*1.45-(inner>0?5:0)]],2.6)}
    else if(m==='sad')h.line([[x-r*1.1,y-r*1.25-(inner<0?5:0)],[x+r*1.1,y-r*1.25-(inner>0?5:0)]],3.6);
    else if(f.brow==='angry'&&L.pose!=='happy'&&L.pose!=='pet')h.line([[x-r*1.15,y-r*1.3-(inner>0?0:6)],[x+r*1.15,y-r*1.3-(inner>0?6:0)]],4.6);
    else if(f.eyes==='smug'&&i===1)h.line([[x-r*1.1,y-r*1.6],[x+r*1.1,y-r*2.1]],3.4);
    else if(f.brow==='eager'&&m!=='down')h.line([[x-r*.55,y-r*2.0-(inner>0?0:2)],[x+r*.55,y-r*2.0-(inner>0?2:0)]],2.8);
    else if(f.brow==='curious'&&i===1&&m!=='down')h.line([[x-r*1.1,y-r*1.7],[x,y-r*2.4],[x+r*1.2,y-r*1.9]],2.8);
    else if(f.brow==='soft'&&m!=='down')h.line([[x-r*1.1,y-r*1.45-(inner>0?0:3)],[x+r*1.1,y-r*1.45-(inner>0?3:0)]],2.6);
  });
  const N=noseLocal(s),[nx,ny]=HT(N);
  h.dot(nx,ny,4.6*sf,3.5*sf);if(L.blueNose)h.dot(nx+1.5*sf,ny-.5,2.6*sf,2*sf,'#7CC8FF');
  const M=p=>HT([N[0]+p[0]*sf,N[1]+p[1]*sf]);
  const mo=f.mouth;
  const tongue=(len)=>{h.shape([[-9,8],[1,8],[0,8+len],[-5,11+len],[-10,8+len]].map(M),'#FF6F9A',{w:3,ox:0,oy:0,sc:1,closed:1});h.line([[-4.5,10],[-4.5,6+len]].map(M),2.2,'#C9406A')};
  if(mo==='smile'||mo==='tongue'||mo==='sleep'){if(mo==='tongue'){if(s.face.tside&&L.pose!=='happy'){h.shape([[-12,8],[-3,9],[-6,24],[-13,27],[-17,21]].map(M),'#FF6F9A',{w:3,ox:0,oy:0,sc:1,closed:1});h.line([[-9,11],[-11,21]].map(M),2.2,'#C9406A')}else tongue(L.pose==='happy'?16:11)}h.line([[-17,5],[-9,11],[0,9],[5,3]].map(M),mo==='sleep'?3:3.8)}
  if(mo==='pant'){h.shape([[-17,5],[4,4],[1,14],[-14,15]].map(M),'#7A1F2E',{w:3,ox:0,oy:0,sc:1});h.shape([[-11,10],[-1,10],[-1,30],[-6,34],[-12,30]].map(M),'#FF6F9A',{w:3,ox:0,oy:0,sc:1,closed:1});h.line([[-6,13],[-6,28]].map(M),2.2,'#C9406A')}
  if(mo==='tight'){h.line([[-15,10],[-10,8],[-5,11],[0,8],[4,10]].map(M),3.2)}
  if(mo==='whistle'){h.shape(circ(0,0,3.6,3.6,8).map(q=>M([q[0]-4,q[1]+11])),'#7A1F2E',{w:2.6,ox:0,oy:0,sc:1,closed:1})}
  if(mo==='smirk')h.line([[-16,9],[-6,11],[3,6],[7,0]].map(M),3.8);
  if(mo==='frown')h.line([[-16,14],[-7,8],[2,13]].map(M),3.8);
  if(mo==='o')h.shape(circ(0,0,5,6.5,9).map(q=>M([q[0]-1,q[1]+16])),'#7A1F2E',{w:3.2,ox:0,oy:0,sc:1,closed:1});
  if(mo==='grin'||mo==='open'){h.shape([[-17,5],[4,4],[0,16],[-12,18]].map(M),'#7A1F2E',{w:3.4,ox:0,oy:0,sc:1});h.shape([[-12,13],[-1,12],[-3,18],[-10,18]].map(M),'#FF6F9A',{noline:1,ox:0,oy:0})}
  if(mo==='chew'){h.shape(circ(0,0,5,3.5,8).map(q=>M([q[0]-6,q[1]+9])),'#7A1F2E',{w:3,ox:0,oy:0,sc:1,closed:1});[[6,16],[-16,18],[2,24]].forEach(c=>{const p=M(c);h.dot(p[0],p[1],2,1.6,'#C98A4E')});if(L.k===1)h.text('nom',HT([N[0]+16*sf,N[1]-6*sf])[0],HT([N[0]+16*sf,N[1]-6*sf])[1],14,INK,-8)}
  if(s.face.drool&&(L.pose==='idle'||L.pose==='happy'||L.pose==='eat'||L.pose==='walk')){const p=M([-15,12]);h.shape([[p[0],p[1]],[p[0]+3,p[1]+7],[p[0],p[1]+10],[p[0]-3,p[1]+7]],'#9EDCFF',{w:2,ox:0,oy:0,sc:1,closed:1})}
  if(s.face.sweet&&!L.blush&&L.pose!=='sad'){[[hx*(e0[0]-.1),hy*(e0[1]+.48)],[hx*(e1[0]+.2),hy*(e1[1]+.5)]].forEach(p=>{const [x,y]=HT(p);h.acc.push(`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(7*sf)}" ry="${R1(4*sf)}" fill="#FF8FAE" opacity=".5"/>`)})}
  if(L.blush){[[hx*(e0[0]-.12),hy*(e0[1]+.5)],[hx*(e1[0]+.2),hy*(e1[1]+.5)]].forEach(p=>{const [x,y]=HT(p);h.acc.push(`<ellipse cx="${R1(x)}" cy="${R1(y)}" rx="${R1(9*sf)}" ry="${R1(5*sf)}" fill="#FF5C8A" opacity=".55"/>`);h.line([[x-6*sf,y+2],[x-2*sf,y-2],[x+2*sf,y+2],[x+6*sf,y-2]],2,'#E8326A')})}
  if(L.tear){const [x,y]=HT([eyes[1][0],eyes[1][1]]);const r=eyes[1][2];h.shape([[x,y+r+2],[x+4,y+r+10],[x,y+r+14],[x-4,y+r+10]],'#5BC8FF',{w:2.6,ox:0,oy:0,sc:1,closed:1})}
}

/* ---------- outfits ---------- */
const OUT={head:['Party Hat','Flower Crown','Acorn Cap','Rain Hat','Pom-pom Beanie'],eyes:['Heart Sunglasses','Explorer Goggles'],neck:['Red Bandana','Bow Tie','Seashell Necklace','Clover Collar'],body:['Yellow Raincoat','Knit Winter Sweater','Superhero Cape','Mossy Poncho','Frog Raincoat','Polka-dot Raincoat','Bubble Raincoat']};
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
  else{const c=a.c,d=[a.r[0]-a.l[0],a.r[1]-a.l[1]],m=Math.hypot(d[0],d[1])||1,u=[d[0]/m,d[1]/m],v=[-u[1],u[0]],S=11;
    const P=(x,y)=>[c[0]+u[0]*x+v[0]*y,c[1]+u[1]*x+v[1]*y];
    h.shape([P(0,0),P(-S*1.2,-S*.7),P(-S*1.3,S*.75)],'#2D6CDF',{w:3.6,step:8});h.shape([P(0,0),P(S*1.2,-S*.75),P(S*1.2,S*.7)],'#2D6CDF',{w:3.6,step:8});h.shape(circ(...P(0,0),3.6,3.6,6),'#1B4AA8',{w:3,ox:0,oy:0,sc:1,closed:1});}
}
function drawHat(h,s,L,HT,kind){
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
  if(kind==='Party Hat'){const base=s.ears==='giant'?[hx*.0,-hy*.82]:[hx*.12,-hy*.86],t=8,P=p=>{const q=rot(p,t);return HT([base[0]+q[0],base[1]+q[1]])};
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

/* ---------- one complete redraw ---------- */
function frame(key,s,pose,outfit,k,seed){
  const h=kit(rng(seed+k*7717)),L=layout(s,pose,k),B=T(L.bT),HT=T(L.hT),hp=headPts(s),bp=bodyPts(s);
  const has=(slot)=>outfit&&outfit[slot]&&OUT[slot].includes(outfit[slot])?outfit[slot]:null;
  const body=has('body'),neck=has('neck'),hat=has('head'),eyes=has('eyes');
  if(body==='Superhero Cape')drawCape(h,s,L,B);
  drawTail(h,s,L,B);
  drawLegs(h,s,L);
  // neck: a short tube from the chest to the head, behind the body
  {const nb=B([s.body.rx*.62,-s.body.ry*.3]),nh=HT([-s.head.rx*.2,s.head.ry*.35]);if(L.pose==='eat'||L.pose==='jump'||L.pose==='sit'||L.pose==='sad')h.tube([nb,nh],s.head.rx*.7,s.col)}
  h.shape(bp.map(B),s.col,{step:s.body.long?14:11});h.crayon(s.body.rx,s.body.ry,B,s.col,s.body.long?16:12);
  if(s.marks)s.marks(h,B,HT,s);
  if(L.scrunch)[-.45,-.1,.25].forEach(x=>h.line([[s.body.rx*x,-s.body.ry*.85],[s.body.rx*(x+.06),0],[s.body.rx*x,s.body.ry*.85]].map(B),2.6));
  if(L.mud)drawMud(h,s,L,B,HT);
  if(body&&body!=='Superhero Cape')drawCoat(h,s,L,B,body);
  if(body==='Superhero Cape')drawCapeTie(h,s,L,B);
  drawHaunch(h,s,L,B);
  if(L.paw){h._legPass='raised';drawLegs(h,s,L);h._legPass='ground'}
  drawEars(h,s,L,HT,false);
  h.shape(hp.map(HT),s.hcol,{step:s.fluff?30:11,amp:s.fluff?.8:1.2});h.crayon(s.head.rx,s.head.ry*.6,p=>HT([p[0],p[1]-s.head.ry*.3]),s.hcol,6);
  if(s.headMarks)s.headMarks(h,HT,s);
  if(L.mud){const hx=s.head.rx,hy=s.head.ry;h.shape(circ(-hx*.45,-hy*.45,hx*.18,hy*.15,7,.2).map(HT),'#7A4A22',{noline:1,ox:0,oy:0})}
  drawFace(h,s,L,HT);
  if(eyes&&pose!=='sleep')(eyes==='Explorer Goggles'?drawGoggles:drawGlasses)(h,s,L,HT);
  drawEars(h,s,L,HT,true);
  if(neck)drawNeck(h,s,L,HT,neck);
  if(hat)drawHat(h,s,L,HT,hat);
  drawFx(h,s,L,B,HT);
  return {h,L};
}
// marks draw on both body and head; run them twice, once per layer (points mapped to NaN are skipped)
const NAN=()=>[NaN,NaN];
Object.keys(SP).forEach(k=>{const s=SP[k],m=s.marks;if(!m)return;s.marks=(h,B,HT,sp)=>m(h,B,NAN,sp);s.headMarks=(h,HT,sp)=>m(h,NAN,HT,sp)});

/* ---------- public API ---------- */
const POSES=['idle','happy','pet','eat','sleep','walk','jump','sit','sad','dirty','crouch','shake','cold','hot','dig','beg','squat','leglift'];
function dog(key,o={}){
  const s=SP[key]||SP.shiba;key=SP[key]?key:'shiba';
  const pose=POSES.includes(o.pose)?o.pose:'idle',anim=o.anim!==false,nF=anim?3:1,left=o.facing==='left';
  const seed=hashS('pa'+key+pose)*5+3;
  const fr=[];const bb=[1e9,1e9,-1e9,-1e9];
  for(let k=0;k<nF;k++){const f=frame(key,s,pose,o.outfit,k,seed);fr.push(f);const b=f.h.bb;bb[0]=Math.min(bb[0],b[0]);bb[1]=Math.min(bb[1],b[1]);bb[2]=Math.max(bb[2],b[2]);bb[3]=Math.max(bb[3],b[3])}
  // keep everything inside the canvas: shrink around the feet anchor if anything pokes out
  const m=3,sc=Math.min(1,(GY-m)/(GY-bb[1]),(120-m)/(120-bb[0]),(240-m-120)/(bb[2]-120),bb[3]>GY?(199.5-GY)/(bb[3]-GY):1);
  const fit=sc<.999?` transform="translate(120 ${GY}) scale(${sc.toFixed(3)}) translate(-120 -${GY})"`:'';
  const L0=fr[0].L,shx=pose==='sleep'?L0.bT.x+12:L0.bT.x+8,shw=(s.body.rx*(pose==='jump'?.7:1.15)+(pose==='sleep'?20:0));
  const shy=pose==='jump'?3.5:6;let hd='';for(let x=-shw+3;x<shw-2;x+=5.5){const t=x/shw,half=shy*Math.sqrt(Math.max(0,1-t*t));if(half<1)continue;hd+=`M${R1(shx+x)} ${R1(GY+1.5+half*.9)}l4 ${R1(-half*1.8)}`}
  const shadow=`<ellipse cx="${R1(shx)}" cy="${GY+1.5}" rx="${R1(shw)}" ry="${shy}" fill="${PEN}" opacity="${pose==='jump'?.06:.1}"/><path d="${hd}" stroke="${PEN}" stroke-width="1.3" stroke-linecap="round" opacity="${pose==='jump'?.25:.4}" fill="none"/>`;
  let frames='';
  fr.forEach((f,k)=>{
    const tx=f.h.texts.map(t=>{const x=left?240-t.x-t.size*.6*t.s.length:t.x;return `<text x="${R1(x)}" y="${R1(t.y)}" transform="rotate(${R1(left?-t.rt:t.rt)} ${R1(x)} ${R1(t.y)})" font-family="'Gloria Hallelujah',cursive" font-size="${t.size}" fill="${t.col}">${t.s}</text>`}).join('');
    frames+=`<g class="pa-d-f${k}">${left?`<g transform="translate(240 0) scale(-1 1)">${f.h.acc.join('')}</g>`:f.h.acc.join('')}${tx}</g>`;
  });
  const lab=`${s.name} the ${s.breed}, ${pose}`;
  return `<svg class="pa-dog pa-pose-${pose}${anim?' pa-d-anim':''}" viewBox="0 0 240 200" role="img" aria-label="${lab}"><g${fit}>${left?`<g transform="translate(240 0) scale(-1 1)">${shadow}</g>`:shadow}${frames}</g></svg>`;
}
function dogHead(key){
  const s=SP[key]||SP.shiba,h=kit(rng(hashS('pahead'+key))),L=layout(s,'idle',0),HT=T(L.hT);
  if(s.ears!=='giant')L.face.eyes=s.face.eyes;
  drawEars(h,s,L,HT,false);h.shape(headPts(s).map(HT),s.hcol,{step:s.fluff?30:11});if(s.headMarks)s.headMarks(h,HT,s);drawFace(h,s,L,HT);drawEars(h,s,L,HT,true);
  let b=h.bb;if(s.ears==='giant'){const hd=s.head,c=HT([0,0]);b=[c[0]-hd.rx*1.25,c[1]-hd.ry*2.1,c[0]+hd.rx*1.25,c[1]+hd.ry*1.05]}
  const w=b[2]-b[0],ht=b[3]-b[1],sc=Math.min(86/w,86/ht),cx=(b[0]+b[2])/2,cy=(b[1]+b[3])/2;
  return `<svg class="pa-dog-head" viewBox="0 0 100 100" overflow="hidden" role="img" aria-label="${s.name} the ${s.breed}"><g transform="translate(50 ${R1(50+ (ht*sc<80?4:0))}) scale(${sc.toFixed(3)}) translate(${R1(-cx)} ${R1(-cy)})">${h.acc.join('')}</g></svg>`;
}
const css=`.pa-dog .pa-d-f1,.pa-dog .pa-d-f2{opacity:0}
.pa-dog.pa-d-anim .pa-d-f0{animation:pa-d-b0 1s steps(1,end) infinite}
.pa-dog.pa-d-anim .pa-d-f1{animation:pa-d-b1 1s steps(1,end) infinite}
.pa-dog.pa-d-anim .pa-d-f2{animation:pa-d-b2 1s steps(1,end) infinite}
@keyframes pa-d-b0{0%{opacity:1}33.333%{opacity:0}100%{opacity:0}}
@keyframes pa-d-b1{0%{opacity:0}33.333%{opacity:1}66.666%{opacity:0}100%{opacity:0}}
@keyframes pa-d-b2{0%{opacity:0}66.666%{opacity:1}100%{opacity:1}}
html[data-motion="off"] .pa-dog *,.pa-still .pa-dog *{animation-play-state:paused!important}
@media (prefers-reduced-motion: reduce){.pa-dog *{animation-play-state:paused!important}}`;
if(typeof document!=='undefined'&&!document.getElementById('pawart-dogs-css')){const st=document.createElement('style');st.id='pawart-dogs-css';st.textContent=css;document.head.appendChild(st)}
PA.dog=dog;PA.dogHead=dogHead;
PA.DOGS=KEYS.map(k=>({key:k,name:SP[k].name,breed:SP[k].breed,personality:SP[k].personality,joke:SP[k].joke}));
})();
