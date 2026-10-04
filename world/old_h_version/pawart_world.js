/* =====================================================================
   PawArt world module: style H "Ugly hand-drawn" (icons, items, houses, scenes,
   map, walk strips, collectibles, props). Plain script, no imports.
   Everything is deterministic (seeded). Bucket fills miss their outlines on purpose.
   ===================================================================== */
(function(){
'use strict';
window.PawArt=window.PawArt||{};
const PA=window.PawArt;
const INK='#2a2420',RED='#E8322B',SUN='#FFC21A',GRASS='#35B544',PINK='#FF6F9A',BLUE='#3AA0FF',SKY='#8FD3FF',
      PAPER='#FFF8E7',ORANGE='#FF8A1E',BROWN='#A2522A',DBROWN='#6E3315',CREAM='#FFF1C9',PURPLE='#A55EEA',WOOD='#D9A05B';
const FONT="'Gloria Hallelujah','Comic Sans MS',cursive";
const R1=v=>Math.round(v*10)/10;
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');
function hashS(s){let h=2166136261>>>0;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
let UID=0; // own counter for any ids (clip paths etc.)
const uid=p=>'paw'+(p||'')+(++UID);

/* ---------- geometry helpers ---------- */
function dense(pts,closed,step){
  const out=[],n=pts.length,m=closed?n:n-1;
  for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n],k=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/step));
    for(let j=0;j<k;j++)out.push([a[0]+(b[0]-a[0])*j/k,a[1]+(b[1]-a[1])*j/k])}
  if(!closed)out.push(pts[n-1]);
  return out;
}
const circPts=(cx,cy,rx,ry,n,lop)=>{n=n||Math.max(8,Math.min(18,Math.round(Math.max(rx,ry)/3.2)));lop=lop||0;const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;p.push([cx+Math.cos(a)*rx*(1+lop*Math.sin(a*2)),cy+Math.sin(a)*ry*(1+lop*Math.cos(a))])}return p};
const spiral=(cx,cy,r0,r1,turns,n,a0)=>{const p=[];for(let i=0;i<=n;i++){const t=i/n,a=a0+t*turns*Math.PI*2,rr=r1+(r0-r1)*t;p.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}return p};
const heartPts=(cx,cy,s)=>{const p=[];for(let i=0;i<22;i++){const t=i/22*Math.PI*2;p.push([cx+16*Math.pow(Math.sin(t),3)*s/16,cy-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t))*s/16])}return p};
const starPts=(cx,cy,r1,r2,n,rot)=>{const p=[];for(let i=0;i<n*2;i++){const a=(rot||-Math.PI/2)+i/(n*2)*Math.PI*2,r=i%2?r2:r1;p.push([cx+Math.cos(a)*r,cy+Math.sin(a)*r])}return p};
const mv=(pts,dx,dy,s)=>pts.map(q=>[q[0]*(s||1)+dx,q[1]*(s||1)+dy]);
const BONE=[[10,20],[18,18],[24,24],[40,24],[46,18],[54,20],[60,26],[56,31],[60,37],[54,43],[46,41],[40,36],[24,36],[18,41],[10,43],[4,37],[8,31],[4,26]];

/* ---------- the crude-drawing kit ---------- */
// o: {lw outline width, amp jitter, step densify, mis fill misregistration}
function mk(seed,o,acc){
  acc=acc||[];
  const r=rng(seed),J=a=>(r()-.5)*2*a,lw=o.lw,amp=o.amp,step=o.step,mis=o.mis,gp=o.gap==null?.5:o.gap;
  const pl=(P,a)=>P.map((q,i)=>(i?'L':'M')+R1(q[0]+J(a))+' '+R1(q[1]+J(a))).join('');
  const st=(d,w,c,x)=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${x||''}/>`;
  const h={acc,r,J,lw,o,
    raw(s){acc.push(s)},
    open(attrs){acc.push(`<g ${attrs}>`)},
    close(){acc.push('</g>')},
    sub(seed2){return mk(seed2,o,acc)},
    // bucket fill that misses the outline, then a jaggy outline that may not close
    shape(pts,fill,op){
      op=op||{};
      const P=dense(pts,true,op.step||step),n=P.length;
      let cx=0,cy=0,x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
      for(let i=0;i<n;i++){const q=P[i];cx+=q[0];cy+=q[1];if(q[0]<x0)x0=q[0];if(q[0]>x1)x1=q[0];if(q[1]<y0)y0=q[1];if(q[1]>y1)y1=q[1]}
      cx/=n;cy/=n;
      const md=Math.max(x1-x0,y1-y0)/2||1,ms=op.mis==null?mis:op.mis;
      const sc=Math.max(.75,1-1.5*ms/md),ox=op.ox!=null?op.ox:2.4*ms+J(.6*ms),oy=op.oy!=null?op.oy:-1.8*ms+J(.6*ms);
      if(fill)acc.push(`<path d="${pl(P.map(q=>[cx+(q[0]-cx)*sc+ox,cy+(q[1]-cy)*sc+oy]),amp*.8)}Z" fill="${fill}"/>`);
      if(!op.noline){
        const s0=Math.floor(r()*n),L=[],closed=op.closed!=null?op.closed:r()>=gp,cnt=n+(closed?1:-1);
        for(let i=0;i<=cnt;i++)L.push(P[(s0+i)%n]);
        acc.push(st(pl(L,op.amp==null?amp:op.amp),op.w||lw,op.ink||INK));
      }
      return h;
    },
    rect(x,y,w,hh,fill,op){return h.shape([[x,y],[x+w,y],[x+w,y+hh],[x,y+hh]],fill,op)},
    circ(cx,cy,rad,fill,op){return h.shape(circPts(cx,cy,rad,rad*1.04,op&&op.n,op&&op.lop),fill,op)},
    ell(cx,cy,rx,ry,fill,op){return h.shape(circPts(cx,cy,rx,ry,op&&op.n,op&&op.lop),fill,op)},
    heart(cx,cy,s,fill,op){return h.shape(heartPts(cx,cy,s),fill,op)},
    star(cx,cy,r1,r2,n,fill,op){return h.shape(starPts(cx,cy,r1,r2,n),fill,op)},
    // plain flat fill with no outline (backgrounds)
    bg(x,y,w,hh,fill){acc.push(`<rect x="${x}" y="${y}" width="${w}" height="${hh}" fill="${fill}"/>`);return h},
    // stick / tube limb: ink stroke with a narrower colour stroke slightly off
    tube(pts,w,fill,op){op=op||{};const P=dense(pts,false,op.step||step);
      acc.push(st(pl(P,op.amp==null?amp*.8:op.amp),w+(op.ow==null?lw*1.4:op.ow),INK));
      if(fill)acc.push(st(pl(P,amp*.6),w,fill,` transform="translate(${op.ox==null?1*mis+.4:op.ox} ${op.oy==null?-.8*mis:op.oy})"`));
      return h},
    line(pts,w,col,a){acc.push(st(pl(dense(pts,false,step*.8),a==null?amp*.8:a),w==null?lw:w,col||INK));return h},
    // closed ink ring / outline only
    ring(cx,cy,rx,ry,w,col){return h.line(circPts(cx,cy,rx,ry,null,0).concat([circPts(cx,cy,rx,ry,null,0)[0]]),w,col)},
    dot(x,y,rx,ry,fill){acc.push(`<ellipse cx="${R1(x+J(.5*mis))}" cy="${R1(y+J(.5*mis))}" rx="${rx}" ry="${ry==null?rx:ry}" fill="${fill||INK}"/>`);return h},
    // readable eye: white circle, clean outline, big pupil
    eye(x,y,rad,lx,ly,w){
      h.shape(circPts(x,y,rad,rad*1.05,12),'#fff',{ox:0,oy:0,sc:1,w:w||Math.max(2.2,lw*.7),amp:amp*.4,closed:true,mis:0});
      const px=x+(lx||0)*rad*.38,py=y+(ly||0)*rad*.38;
      h.dot(px,py,rad*.5,rad*.52);
      if(rad>4)h.dot(px-rad*.18,py-rad*.24,rad*.17,rad*.17,'#fff');
      return h;
    },
    paw(cx,cy,s,col){const c=col||INK;
      h.dot(cx,cy+3*s,7*s,5.6*s,c);h.dot(cx-9*s,cy-3.5*s,3.3*s,4*s,c);h.dot(cx-3.4*s,cy-9.5*s,3.4*s,4.2*s,c);h.dot(cx+3.4*s,cy-9.5*s,3.4*s,4.2*s,c);h.dot(cx+9*s,cy-3.5*s,3.3*s,4*s,c);return h},
    zig(x0,x1,y,a,stp,col,w){const p=[];let k=0;for(let x=x0;x<=x1;x+=stp,k++)p.push([x,y+(k%2?-a:a*.4)]);return h.line(p,w,col,a*.2)},
    // crayon scribble fill inside a box
    scrib(x,y,w,hh,col,n,wd){const p=[];n=n||Math.max(3,Math.round(hh/6));for(let i=0;i<=n;i++){const yy=y+hh*i/n;p.push(i%2?[x+w,yy]:[x,yy])}return h.line(p,wd||lw*1.2,col,2)},
    text(s,x,y,size,col,rot,anchor,extra){
      acc.push(`<text x="${R1(x+J(1))}" y="${R1(y+J(1))}" transform="rotate(${R1((rot||0)+J(1))} ${R1(x)} ${R1(y)})" font-family="${FONT}" font-size="${size}" fill="${col||INK}" stroke="${col||INK}" stroke-width="${R1(size/28)}" text-anchor="${anchor||'start'}"${extra||''}>${esc(s)}</text>`);
      return h},
    // a repeated feature drawn at x, x-1200, x+1200 where it crosses the tile edge (seamless strips)
    wrapx(cx,hw,seed2,fn){
      for(const dx of [-1200,0,1200]){
        if(cx+dx+hw<0||cx+dx-hw>1200)continue;
        acc.push(`<g transform="translate(${dx} 0)">`);fn(mk(seed2,o,acc));acc.push('</g>');
      }
      return h}
  };
  return h;
}
const K_ICON={lw:4,amp:.6,step:6,mis:.9,gap:.25};
const K_PROP={lw:4.2,amp:.9,step:9,mis:.9,gap:.4};
const K_HOUSE={lw:4.6,amp:1.2,step:11,mis:.9,gap:.45};
const K_SCENE={lw:5,amp:1.8,step:14,mis:1.1,gap:.5};
const K_STRIP={lw:5,amp:1.6,step:14,mis:1,gap:.5};

function svgWrap(vb,cls,label,inner,extra){
  return `<svg xmlns="http://www.w3.org/2000/svg" class="pa-w pa-w-${cls}" viewBox="${vb}" role="img" aria-label="${esc(label)}"${extra||''}>${inner}</svg>`;
}
const memo=new Map();
function cached(key,fn){let v=memo.get(key);if(v===undefined){v=fn();if(memo.size>400)memo.clear();memo.set(key,v)}return v}
function fallback(kind,name,vb){ // unknown name: a crude question mark so the game never breaks
  const h=mk(hashS('fb'+name),K_ICON);h.shape(circPts(32,32,26,26,14),'#EEE');h.text('?',32,46,40,RED,0,'middle');
  return svgWrap(vb||'0 0 64 64',kind,'unknown '+kind+' '+name,h.acc.join(''));
}

/* ---------- global css, injected once ---------- */
(function(){
  if(typeof document==='undefined'||document.getElementById('pawart-world-css'))return;
  const s=document.createElement('style');s.id='pawart-world-css';
  s.textContent=
`.pa-w text{font-family:${FONT};}
.pa-w-scene [data-shop],.pa-w-scene [data-area]{cursor:pointer;-webkit-tap-highlight-color:transparent}
.pa-w-scene [data-shop]:hover,.pa-w-scene [data-area]:hover,.pa-w-scene [data-shop]:focus-visible,.pa-w-scene [data-area]:focus-visible{filter:brightness(1.1) saturate(1.1);outline:none}
.pa-w-scene [data-area] .pa-w-hit,.pa-w-scene [data-shop] .pa-w-hit{pointer-events:all}
.pa-w-scene.pa-w-map [data-area][data-locked="1"]{cursor:not-allowed}`;
  document.head.appendChild(s);
})();
/* ===================== ICONS (64x64) ===================== */
const ICONS={
 hunger(h){
  h.shape([[10,32],[12,20],[22,12],[34,10],[46,14],[54,24],[54,32]],BROWN);
  [[22,22],[32,17],[42,21],[28,28],[40,29]].forEach(q=>h.dot(q[0],q[1],3.4,3,DBROWN));
  h.shape([[5,31],[59,31],[52,55],[12,55]],RED);
  h.line([[16,42],[48,42]],3.4,'#fff');
 },
 happy(h){
  h.circ(32,32,26,'#FFD60A',{n:14});
  h.dot(22,26,3.6,5);h.dot(41,25,4.4,5.6);
  h.line([[15,37],[23,49],[41,50],[50,36]],4.4);
  h.dot(12,38,4.5,3,'#FF8FB0');h.dot(53,38,4.5,3,'#FF8FB0');
 },
 energy(h){
  h.shape([[38,3],[11,35],[28,35],[19,61],[53,25],[35,25],[47,3]],'#FFD60A',{closed:true});
  h.line([[6,14],[12,20]],3.4,ORANGE);h.line([[58,42],[52,48]],3.4,ORANGE);
 },
 clean(h){
  h.circ(26,40,19,'#8FD8FF');h.circ(47,20,12,'#B5E8FF');h.circ(48,50,8,'#8FD8FF');h.circ(18,12,6.5,'#B5E8FF');
  h.line([[16,36],[18,30],[24,27]],3.4,'#fff');h.line([[43,16],[46,13]],2.8,'#fff');
 },
 bond(h){
  h.heart(32,34,30,'#FF4F87',{closed:true});
  h.dot(32,40,7,5.4,'#fff');h.dot(22.5,32,3.2,4,'#fff');h.dot(28.5,26.5,3.3,4.2,'#fff');h.dot(36,26.5,3.3,4.2,'#fff');h.dot(42,32,3.2,4,'#fff');
 },
 coin(h){
  h.circ(32,32,26,'#FFC21A',{n:14,closed:true});
  h.line(circPts(32,32,18.5,18.5,12,0).concat([circPts(32,32,18.5,18.5,12,0)[0]]),2.6,'#C98A00');
  h.paw(32,33,1.15,DBROWN);
 },
 feed(h){ // a drumstick
  h.tube([[34,36],[52,54]],7,CREAM);h.circ(51,58,5,CREAM,{w:3.2});h.circ(58,51,5,CREAM,{w:3.2});
  h.shape(circPts(24,26,19,17,13,.06),'#D9772B',{closed:true});
  h.line([[14,20],[20,14],[28,12]],3.2,'#F2A55E');
  h.line([[48,6],[52,12]],3.4,SUN);h.line([[56,14],[61,16]],3.4,SUN);
 },
 play(h){ // a ball
  h.circ(32,32,26,'#C8E63C',{n:14,closed:true});
  h.line([[11,20],[21,29],[22,42],[14,53]],4,'#fff');h.line([[53,20],[43,29],[42,42],[50,53]],4,'#fff');
 },
 walk(h){ // two paw prints
  h.paw(21,45,1.7,DBROWN);h.paw(43,21,1.7,DBROWN);
 },
 shop(h){
  h.rect(10,28,44,28,'#FFE29A');
  h.rect(25,38,13,18,'#7A4A2A');h.dot(35,48,1.8,1.8,SUN);
  h.rect(13,34,9,9,'#8FD8FF',{w:3});
  h.shape([[5,14],[59,14],[63,29],[1,29]],RED);
  [[18,15,16,28],[32,15,32,28],[46,15,48,28]].forEach(l=>h.line([[l[0],l[1]],[l[2],l[3]]],6,'#fff',.4));
 },
 wardrobe(h){
  h.shape([[22,8],[42,8],[48,14],[61,22],[55,35],[47,30],[47,57],[17,57],[17,30],[9,35],[3,22],[16,14]],'#FF9F2E',{closed:true});
  h.line([[24,9],[32,19],[40,9]],4);
  h.line([[18,42],[46,42]],3.4,'#fff');
  h.star(32,50,3.6,1.6,5,'#fff',{noline:1});
 },
 house(h){ // doghouse
  h.rect(11,30,42,26,WOOD);
  h.shape([[3,32],[32,6],[61,32]],'#C43A2B',{closed:true});
  h.shape([[23,56],[23,44],[27,37],[37,37],[41,44],[41,56]],INK,{noline:1,mis:0});
  h.line([[30,24],[34,20]],3,'#fff');
 },
 home(h){ // human house
  h.rect(41,9,9,17,'#B5543A',{closed:true});
  h.rect(10,30,44,26,CREAM);
  h.shape([[3,32],[32,7],[61,32]],BLUE,{closed:true});
  h.rect(27,38,11,18,RED,{w:3.4});h.dot(35,48,1.6,1.6,SUN);
  h.rect(14,37,9,9,'#8FD8FF',{w:3});
 },
 map(h){
  h.shape([[4,13],[22,8],[41,14],[60,8],[60,52],[41,57],[22,51],[4,56]],'#F3DDA0',{closed:true});
  h.line([[22,9],[22,51]],2.8);h.line([[41,14],[41,57]],2.8);
  h.line([[44,18],[55,30]],5,RED);h.line([[55,18],[44,30]],5,RED);
  [[8,44],[12,40],[16,42],[20,36],[25,38],[30,32],[34,34]].forEach(q=>h.dot(q[0],q[1],1.7,1.7));
 },
 back(h){
  h.shape([[4,32],[28,8],[28,23],[60,23],[60,41],[28,41],[28,56]],'#FF9F2E',{closed:true});
 },
 close(h){
  h.tube([[13,13],[51,51]],10,RED);h.tube([[51,13],[13,51]],10,RED);
 },
 bath(h){
  h.circ(15,22,8,'#fff');h.circ(30,14,10,'#EAF8FF');h.circ(45,22,7,'#fff');h.circ(54,13,4.5,'#EAF8FF',{w:3});
  h.tube([[13,51],[12,59]],6,SUN);h.tube([[51,51],[52,59]],6,SUN);
  h.shape([[3,30],[61,30],[54,53],[11,53]],'#8FD8FF',{closed:true});
  h.line([[12,40],[36,40]],3.2,'#fff');
 },
 sleep(h){
  const m=[[46,6],[32,8],[18,18],[12,32],[16,48],[28,58],[44,58],[56,50],[44,50],[34,42],[30,30],[34,18],[46,6]];
  h.shape(mv(m,-4,-2,.85),'#FFD60A',{closed:true});
  h.line([[43,28],[56,28],[43,44],[57,44]],5);
  h.line([[46,6],[55,6],[46,17],[56,17]],4);
 },
 pet(h){
  [[[20,34],[18,17]],[[29,32],[29,10]],[[38,32],[40,12]],[[46,36],[51,22]],[[15,46],[5,38]]].forEach(f=>h.tube(f,8,'#FFC9A0'));
  h.shape([[15,35],[47,33],[50,46],[44,58],[22,58],[14,50]],'#FFC9A0',{closed:true});
  h.heart(52,9,12,RED,{w:3});
 },
 'sound-on'(h){
  h.shape([[5,24],[17,24],[34,9],[34,55],[17,40],[5,40]],SUN,{closed:true});
  h.line([[42,23],[48,32],[42,41]],4.2);h.line([[49,14],[59,32],[49,50]],4.2);
 },
 'sound-off'(h){
  h.shape([[5,24],[17,24],[34,9],[34,55],[17,40],[5,40]],'#C9C2B0',{closed:true});
  h.line([[42,23],[58,41]],5.5,RED);h.line([[58,23],[42,41]],5.5,RED);
 },
 lock(h){
  h.tube([[20,29],[20,18],[26,8],[38,8],[44,18],[44,29]],5,'#9BA3AD',{ow:5});
  h.rect(11,28,42,29,SUN,{closed:true});
  h.dot(32,40,4.6,4.6);h.line([[32,42],[32,51]],4.5);
 },
 star(h){h.star(32,34,29,12.5,5,'#FFD60A',{closed:true})},
 heart(h){h.heart(32,34,30,RED,{closed:true});h.line([[14,24],[17,18],[22,16]],3.4,'#fff')},
 check(h){h.tube([[9,34],[24,50],[55,13]],10,GRASS)},
 speed(h){
  h.shape([[4,12],[25,32],[4,52],[16,52],[37,32],[16,12]],'#FFB02E',{closed:true});
  h.shape([[28,12],[49,32],[28,52],[40,52],[61,32],[40,12]],'#FF5A2E',{closed:true});
 }
};
PA.icon=function(name){
  return cached('i:'+name,()=>{const f=ICONS[name];if(!f)return fallback('icon',name);
    const h=mk(hashS('icon'+name),K_ICON);f(h);return svgWrap('0 0 64 64','icon','icon '+name,h.acc.join(''))});
};
/* ===================== ITEMS (64x64) ===================== */
const rot=(h,a,x,y,fn)=>{h.raw(`<g transform="rotate(${a} ${x} ${y})">`);fn();h.raw('</g>')};
const flowerDraw=(h,x,y,rr,pet,cen)=>{for(let i=0;i<5;i++){const a=i/5*6.283+.5;h.circ(x+Math.cos(a)*rr*.62,y+Math.sin(a)*rr*.62,rr*.5,pet,{w:2.2,mis:.3,closed:true,n:8})}h.circ(x,y,rr*.38,cen,{w:2,mis:0,closed:true,n:8})};
const ITEMS={
 'Basic Kibble'(h){
  h.shape([[15,16],[49,16],[55,57],[9,57]],'#D9A05B');
  h.shape([[15,16],[19,6],[45,6],[49,16]],'#BE8744');
  h.line([[19,11],[24,15],[30,10],[36,15],[42,10]],2.6);
  h.ell(32,38,13,10,'#FFF8E7',{w:3});
  h.line([[25,38],[39,38]],4,RED);[[24,36],[24,40.5],[40,36],[40,40.5]].forEach(q=>h.dot(q[0],q[1],2.6,2.6,RED));
  [[4,58],[60,54],[58,61],[9,61],[2,52]].forEach(q=>h.dot(q[0],q[1],3.4,3,DBROWN));
 },
 'Chicken & Rice Bowl'(h){
  h.tube([[48,14],[57,6]],4,CREAM,{ow:4});h.circ(59,4.5,3.4,CREAM,{w:2.6,mis:.2});
  h.shape(circPts(43,19,9.5,8.5,10),'#D9772B',{closed:true});
  h.shape([[9,34],[12,22],[24,13],[38,12],[50,20],[55,34]],'#fff');
  [[20,26],[30,20],[34,28],[44,30],[24,31]].forEach(q=>h.line([[q[0],q[1]],[q[0]+3,q[1]+2]],2.4,'#B9B2A0',.2));
  h.shape([[5,33],[59,33],[51,56],[13,56]],BLUE);
  h.line([[15,44],[49,44]],3.2,'#fff');
 },
 'Salmon Pâté'(h){
  h.rect(11,24,42,33,'#C9CED4');
  h.rect(11,32,42,17,'#FF8F7A',{noline:1,mis:0});
  h.ell(32,24,21,7,'#FFA08C',{w:3.4});
  h.line([[18,23],[28,21],[38,24],[46,22]],2.6,'#fff');
  h.ell(29,41,9,5,'#fff',{w:2.6,mis:.3,closed:true});h.shape([[37,41],[47,34],[47,48]],'#fff',{w:2.6,mis:.3,closed:true});
  h.dot(24,40,1.6,1.6);
  h.line([[11,57],[53,57]],3.4,'#8B939C');
 },
 'Bone-shaped Biscuit'(h){
  rot(h,-30,32,32,()=>{
    h.shape(BONE,'#F2C27B',{closed:true,mis:.9});
    [[22,29],[30,33],[38,29],[14,30],[48,32]].forEach(q=>h.dot(q[0],q[1],1.9,1.9,'#B77A33'));
  });
 },
 'Pupcake'(h){
  h.shape([[13,38],[51,38],[45,59],[19,59]],'#4EC5C1');
  [[22,40,25,57],[32,40,32,57],[42,40,39,57]].forEach(l=>h.line([[l[0],l[1]],[l[2],l[3]]],2.6,'#fff',.3));
  h.shape([[9,39],[13,30],[21,26],[25,17],[39,17],[43,26],[51,30],[55,39]],'#FFB3D9');
  h.line([[18,32],[32,27],[46,32]],3,'#fff',.4);
  h.circ(33,11,5.2,RED,{w:3,mis:.4});h.line([[34,7],[38,2]],3);
  [[20,35,22,37],[40,34,43,36],[30,24,32,22]].forEach(l=>h.line([[l[0],l[1]],[l[2],l[3]]],2.6,'#4EA0FF',.2));
 },
 'Fresh Water'(h){
  h.shape([[32,3],[41,17],[44,27],[38,36],[26,36],[20,27],[23,17]],'#58C1FF',{closed:true});
  h.line([[26,26],[28,20]],3,'#fff');
  h.shape([[6,43],[58,43],[49,58],[15,58]],'#B8C2CC');
  h.ell(32,43,26,6,'#58C1FF',{w:3.6});
  h.line([[20,43],[26,41],[32,43],[38,41]],2.4,'#fff',.2);
 },
 'Tennis Ball'(h){ITEMS_ball(h)},
 'Rope Tug'(h){
  const P=[[12,52],[22,39],[38,27],[52,13]];
  h.tube(P,11,'#E3C98A');
  [[18,43],[25,36],[31,31],[38,26],[45,19]].forEach(q=>h.line([[q[0]-2,q[1]-4],[q[0]+3,q[1]+3]],2.6,DBROWN,.2));
  h.circ(9,55,7,'#D9B067',{w:3.4});h.circ(55,9,7,'#D9B067',{w:3.4});
 },
 'Squeaky Duck'(h){
  h.shape([[3,40],[8,30],[14,36],[30,28],[46,32],[54,28],[57,41],[48,55],[26,59],[11,53]],'#FFD60A');
  h.shape(circPts(40,20,13,12,11),'#FFD60A');
  h.shape([[50,17],[62,21],[52,27]],ORANGE,{w:3});
  h.eye(37,16,4.3,.5,.2,2.6);
  h.shape([[20,40],[34,41],[27,51]],'#F0A800',{w:3});
 },
 'Frisbee'(h){
  h.ell(32,41,28,12,'#B5271F');
  h.ell(32,34,28,13,RED);
  h.ell(32,33,17,6.5,null,{w:3.4,ink:'#fff',closed:true});
  h.line([[2,16],[11,19]],3,'#8FA2B0');h.line([[3,24],[9,25]],3,'#8FA2B0');
 },
 'Plush Bone'(h){
  rot(h,28,32,32,()=>{
    h.shape(BONE.map(q=>[q[0],32+(q[1]-32)*1.25]),'#FF8FC4',{closed:true,mis:.9});
    h.line([[8,24],[10,29]],2.4,'#fff',.3);h.line([[54,24],[52,29]],2.4,'#fff',.3);
    h.eye(27,32,3.8,.3,.3,2.2);h.eye(38,32,3.8,.3,.3,2.2);
    h.line([[29,40],[33,43],[37,40]],2.6);
  });
 },
 'Puzzle Feeder'(h){
  h.circ(32,32,28,'#9B6BE8',{n:16,closed:true});
  for(let i=0;i<5;i++){const a=-1.57+i/5*6.283,x=32+Math.cos(a)*18,y=32+Math.sin(a)*18;h.circ(x,y,5.6,'#4B2E83',{w:2.4,mis:.2,closed:true,n:8});if(i%2===0)h.dot(x,y+1,3,2.6,'#D9772B')}
  h.circ(32,32,7,SUN,{w:3,closed:true});
 },
 'Red Bandana'(h){
  h.shape([[3,10],[61,10],[34,60]],RED,{closed:true});
  h.line([[3,10],[61,10]],7);
  [[16,20],[32,20],[48,20],[24,32],[40,32],[32,45]].forEach(q=>h.dot(q[0],q[1],3,3,'#fff'));
 },
 'Yellow Raincoat'(h){
  h.shape([[20,3],[44,3],[48,14],[32,22],[16,14]],'#E5A800');
  h.shape([[22,10],[42,10],[50,17],[61,41],[53,45],[47,33],[47,59],[17,59],[17,33],[11,45],[3,41],[14,17]],'#FFD60A');
  h.line([[32,22],[32,58]],3);
  [[28,32],[28,42],[28,52]].forEach(q=>h.dot(q[0]+7,q[1],2.2,2.2));
  h.shape([[56,4],[59,9],[56,12],[53,9]],'#58C1FF',{w:2.4,mis:.2,closed:true});h.shape([[6,3],[9,8],[6,11],[3,8]],'#58C1FF',{w:2.4,mis:.2,closed:true});
 },
 'Knit Winter Sweater'(h){
  h.shape([[21,6],[43,6],[48,13],[61,23],[55,36],[47,31],[47,58],[17,58],[17,31],[9,36],[3,23],[16,13]],'#3AA0FF',{closed:true});
  h.line([[19,24],[45,24]],3.6,'#fff');h.line([[18,38],[46,38]],3.6,'#fff');
  h.zig(17,47,54,3,5,INK,3);
  h.rect(23,3,18,8,'#2E7FD0',{w:3.2});
 },
 'Party Hat'(h){
  h.shape([[32,5],[55,57],[9,57]],PURPLE,{closed:true});
  h.line([[25,22],[44,38]],4.4,SUN);h.line([[18,40],[49,52]],4.4,SUN);
  h.circ(32,6,6,SUN,{w:3.4,closed:true});
  h.shape([[6,18],[11,17],[10,23]],RED,{w:2.2,mis:.2,closed:true});h.shape([[55,26],[60,29],[54,32]],GRASS,{w:2.2,mis:.2,closed:true});h.shape([[50,8],[55,7],[54,13]],BLUE,{w:2.2,mis:.2,closed:true});
 },
 'Heart Sunglasses'(h){
  h.line([[26,28],[38,28]],5);h.line([[6,24],[2,16]],4.2);h.line([[58,24],[62,16]],4.2);
  h.heart(17,34,13,'#FF3B6B',{closed:true,w:4.6});h.heart(47,34,13,'#FF3B6B',{closed:true,w:4.6});
  h.line([[8,31],[10,27],[14,26]],2.8,'#fff');h.line([[40,31],[42,27],[46,26]],2.8,'#fff');
 },
 'Superhero Cape'(h){
  h.shape([[12,5],[52,5],[59,38],[63,59],[50,53],[40,60],[30,53],[19,60],[8,53],[1,59],[5,38]],RED,{closed:true});
  h.shape([[12,5],[52,5],[48,15],[32,20],[16,15]],'#B5271F');
  h.circ(32,36,11,SUN,{w:3.4,closed:true});h.line([[26,36],[32,30],[38,36],[32,43],[26,36]],3,RED,.2);
 },
 'Flower Crown'(h){
  const ring=circPts(32,38,27,14,18,0);
  h.tube(ring.concat([ring[0],ring[1]]),5,'#35B544');
  [[10,30,'#FF8FB0'],[24,22,'#fff'],[40,22,SUN],[54,30,'#C9A0FF'],[8,44,SUN],[32,53,'#FF8FB0'],[56,45,'#fff']].forEach((f,i)=>flowerDraw(h,f[0],f[1],i%2?7:8.5,f[2],i%2?'#FFC21A':'#FF6F9A'));
 },
 'Bow Tie'(h){
  h.shape([[31,32],[5,14],[4,50]],'#8E4BD9',{closed:true});h.shape([[33,32],[59,14],[60,50]],'#8E4BD9',{closed:true});
  [[16,24],[14,40],[48,24],[50,40]].forEach(q=>h.dot(q[0],q[1],2.8,2.8,'#fff'));
  h.rect(26,23,12,18,'#6A2DB0',{closed:true});
 }
};
function ITEMS_ball(h){
  h.circ(32,32,28,'#C8E63C',{n:16,closed:true});
  h.line([[11,18],[22,28],[23,42],[13,54]],4.2,'#fff');h.line([[53,18],[42,28],[41,42],[51,54]],4.2,'#fff');
  h.line([[22,12],[28,10]],2.6,'#fff');
}
PA.item=function(name){
  return cached('t:'+name,()=>{const f=ITEMS[name];if(!f)return fallback('item',name);
    const h=mk(hashS('item'+name),K_ICON);f(h);return svgWrap('0 0 64 64','item','item '+name,h.acc.join(''))});
};
/* ===================== COLLECTIBLES (60x60) ===================== */
const COLL={
 coin(h){h.circ(30,30,25,'#FFC21A',{n:13,closed:true});h.paw(30,31,1.05,DBROWN);h.line([[12,18],[16,13],[22,11]],3,'#FFF3A0')},
 shell(h){
  h.shape([[30,54],[6,36],[8,22],[18,12],[30,10],[42,12],[52,22],[54,36]],'#FFB3C8',{closed:true});
  [[30,52,30,13],[30,52,17,18],[30,52,43,18],[30,52,9,30],[30,52,51,30]].forEach(l=>h.line([[l[0],l[1]],[l[2],l[3]]],2.6,'#E06A8E',.5));
  h.rect(24,50,12,6,'#FFB3C8',{w:3.4});
 },
 leaf(h){
  h.shape([[30,4],[40,14],[52,12],[46,24],[56,32],[44,36],[46,48],[34,44],[30,56],[26,44],[14,48],[16,36],[4,32],[14,24],[8,12],[20,14]],'#FF7A1F',{closed:true});
  h.line([[30,56],[30,22]],3.4,'#B33A12');h.line([[30,40],[40,32]],2.6,'#B33A12');h.line([[30,34],[20,28]],2.6,'#B33A12');
 },
 bone(h){
  rot(h,-35,32,32,()=>{h.shape(mv(BONE,-2,1.5,1.0),'#FFFDF2',{closed:true});h.line([[18,28],[24,27]],2.4,'#D8D2BC',.2)});
 },
 flower(h){
  h.tube([[30,34],[28,56]],3,GRASS,{ow:3.6});h.shape([[28,50],[40,44],[38,54]],GRASS,{w:3,mis:.3,closed:true});
  for(let i=0;i<6;i++){const a=i/6*6.283+.3;h.circ(30+Math.cos(a)*13,21+Math.sin(a)*13,7.6,'#FF8FB0',{w:3,mis:.5,closed:true,n:9})}
  h.circ(30,21,7.4,SUN,{w:3,mis:.3,closed:true,n:9});
 },
 acorn(h){
  h.shape([[14,26],[46,26],[44,42],[30,56],[18,42]],'#C98A3B',{closed:true});
  h.shape([[10,28],[12,16],[30,10],[48,16],[50,28]],'#7A4A2A',{closed:true});
  h.line([[18,18],[22,24]],2.4,'#A87245',.2);h.line([[30,15],[30,22]],2.4,'#A87245',.2);h.line([[41,18],[38,24]],2.4,'#A87245',.2);
  h.line([[30,10],[32,3]],4);
 },
 sniff(h){ // a smelly puff
  h.shape(circPts(30,32,22,16,14,.18),'#C8DE8A',{closed:true});
  h.circ(14,22,8,'#C8DE8A',{n:9,w:3.4});h.circ(46,20,9,'#C8DE8A',{n:9,w:3.4});h.circ(24,45,8,'#C8DE8A',{n:9,w:3.4});
  h.shape(circPts(30,32,17,11,13,.18),'#C8DE8A',{noline:1,mis:0,ox:0,oy:0});
  h.line([[22,28],[27,24],[32,30],[38,24]],3,'#6E8F2E',.3);h.line([[20,38],[26,34],[33,40],[40,34]],3,'#6E8F2E',.3);
  h.line([[8,8],[11,4],[15,8],[18,4]],2.6,'#6E8F2E',.2);h.line([[44,50],[48,46],[52,50],[56,46]],2.6,'#6E8F2E',.2);
 },
 puddle(h){
  h.shape([[4,36],[8,26],[22,20],[40,22],[54,28],[57,40],[44,48],[22,50],[8,46]],'#5CB8FF',{closed:true});
  h.line([[14,34],[22,30]],3,'#fff');
  h.ell(36,36,9,3.6,null,{w:2.4,ink:'#fff',closed:true,mis:0});
  h.ell(36,36,4,1.6,null,{w:2,ink:'#fff',closed:true,mis:0});
 },
 dig(h){
  h.shape([[3,50],[8,38],[18,28],[30,24],[42,28],[52,38],[57,50]],'#9B6A3C',{closed:true});
  [[16,42],[28,36],[40,42],[22,32],[36,31]].forEach(q=>h.dot(q[0],q[1],2.6,2.2,'#6E4524'));
  h.line([[18,38],[34,52]],6,RED);h.line([[34,38],[18,52]],6,RED);
 }
};
PA.collectible=function(name){
  return cached('c:'+name,()=>{const f=COLL[name];if(!f)return fallback('collectible',name,'0 0 60 60');
    const h=mk(hashS('coll'+name),{lw:3.8,amp:.6,step:6,mis:.9,gap:.2});f(h);return svgWrap('0 0 60 60','collectible','collectible '+name,h.acc.join(''))});
};

/* ===================== PROPS (120x120; speech 200x120) ===================== */
const bowlBase=(h,col,rim)=>{
  h.ell(60,104,44,8,'#00000022',{noline:1,mis:0,ox:0,oy:0});
  h.shape([[14,62],[106,62],[94,100],[26,100]],col);
  h.line([[26,76],[92,76]],5,'#fff',.8);
};
const PROPS={
 'bowl-empty'(h){
  bowlBase(h,RED);
  h.ell(60,62,46,11,'#6B1810',{w:5});
  h.ell(60,64,32,6,'#3D0D09',{noline:1,mis:0,ox:0,oy:0});
  h.line([[44,84],[76,84]],4,'#fff',.6);
 },
 'bowl-full'(h){
  bowlBase(h,RED);
  h.shape([[18,62],[24,44],[40,28],[62,24],[84,30],[98,46],[102,62]],'#A2522A');
  [[36,48],[50,38],[68,36],[84,46],[58,52],[74,54],[44,58],[92,57]].forEach(q=>h.dot(q[0],q[1],5.5,4.6,DBROWN));
  h.line([[14,62],[106,62]],5.6);
 },
 'water-bowl'(h){
  h.ell(60,104,44,8,'#00000022',{noline:1,mis:0,ox:0,oy:0});
  h.shape([[14,62],[106,62],[94,100],[26,100]],'#7FA8E0');
  h.line([[26,76],[92,76]],5,'#fff',.8);
  h.ell(60,62,46,11,'#58C1FF',{w:5});
  h.ell(60,62,30,6,null,{w:3,ink:'#fff',closed:true,mis:0});h.ell(60,62,13,2.6,null,{w:2.6,ink:'#fff',closed:true,mis:0});
  h.circ(94,34,6,'#58C1FF',{w:3,closed:true,n:8});h.circ(108,24,3.6,'#58C1FF',{w:2.6,closed:true,n:8});
 },
 tub(h){
  h.circ(28,38,18,'#fff',{w:4.4});h.circ(52,26,22,'#EAF8FF',{w:4.4});h.circ(82,36,18,'#fff',{w:4.4});h.circ(96,22,10,'#EAF8FF',{w:3.6});h.circ(66,14,9,'#fff',{w:3.6});
  h.line([[64,22],[70,16]],3,'#8FD8FF',.3);h.line([[42,20],[48,14]],3,'#8FD8FF',.3);
  h.tube([[22,98],[20,112]],10,SUN);h.tube([[98,98],[100,112]],10,SUN);
  h.shape([[4,54],[116,54],[104,100],[16,100]],'#8FD8FF',{closed:true});
  h.shape([[2,50],[118,50],[118,58],[2,58]],'#D8F1FF',{w:4.6});
  h.line([[22,74],[70,74]],5,'#fff',.8);
 },
 bubbles(h){
  h.circ(40,76,28,'#B5E8FF',{w:4});h.circ(82,48,20,'#8FD8FF',{w:4});h.circ(86,92,13,'#B5E8FF',{w:3.6});h.circ(32,26,12,'#8FD8FF',{w:3.6});h.circ(62,18,7,'#B5E8FF',{w:3});
  h.line([[26,66],[30,58],[38,54]],4,'#fff');h.line([[76,42],[80,37]],3.4,'#fff');h.line([[28,22],[31,19]],3,'#fff');
 },
 zzz(h){
  h.line([[16,74],[46,74],[16,106],[46,106]],8,INK,.8);
  h.line([[50,40],[78,40],[50,70],[78,70]],10,INK,.8);
  h.line([[80,6],[112,6],[80,38],[112,38]],12,INK,.8);
 },
 hearts(h){
  h.heart(60,74,56,'#FF4F87',{closed:true});h.heart(26,30,28,'#FF8FB0',{closed:true,w:3.8});h.heart(96,28,34,'#FF6F9A',{closed:true,w:3.8});
  h.line([[40,62],[44,54],[52,50]],4,'#fff');
 },
 'poop-joke'(h){ // a scribbled stink cloud
  const sp=spiral(56,66,4,34,3,36,.5);h.line(sp,6,'#7FAE2E',2.4);
  h.line(spiral(70,60,3,18,2,18,1),5,'#4F7A12',1.4);
  h.line([[16,14],[8,28],[18,40],[10,54]],5,'#4F7A12',1);h.line([[58,6],[50,18],[60,28]],5,'#4F7A12',1);h.line([[100,12],[92,26],[104,38],[96,52]],5,'#4F7A12',1);
  h.dot(98,86,5,4);h.dot(106,92,4,3);h.line([[92,82],[98,80]],2.6,'#fff');
  h.text('pew',60,112,18,RED,-4,'middle');
 },
 ball(h){
  h.ell(60,106,34,6,'#00000022',{noline:1,mis:0,ox:0,oy:0});
  h.circ(60,58,46,'#C8E63C',{n:16,closed:true,w:5});
  h.line([[26,32],[42,50],[42,74],[28,92]],7,'#fff');h.line([[96,28],[78,48],[78,72],[92,90]],7,'#fff');
 },
 frisbee(h){
  h.ell(60,72,52,22,'#B5271F',{w:5});
  h.ell(60,62,52,23,RED,{w:5});
  h.ell(60,60,31,11,null,{w:6,ink:'#fff',closed:true});
  h.line([[6,26],[26,30]],4,'#8FA2B0');h.line([[2,40],[18,41]],4,'#8FA2B0');
 },
 speech(h){
  h.shape([[14,10],[62,6],[130,8],[186,12],[194,40],[190,80],[176,96],[120,98],[64,99],[44,98],[28,116],[30,96],[12,88],[6,50]],'#fff',{closed:true,w:4,step:14,amp:1.6,mis:1});
 }
};
PA.prop=function(name){
  return cached('p:'+name,()=>{const f=PROPS[name];if(!f)return fallback('prop',name,'0 0 120 120');
    const sp=name==='speech';
    const h=mk(hashS('prop'+name),K_PROP);f(h);
    return svgWrap(sp?'0 0 200 120':'0 0 120 120','prop','prop '+name,h.acc.join(''),sp?' preserveAspectRatio="none"':'')});
};
/* ===================== HOUSES (240x200, ground y=190, door centred at x=120) ===================== */
const shadow=(h,w)=>h.ell(120,191,w||104,8,'#00000024',{noline:1,mis:0,ox:0,oy:0});
const DOORHOLE=(h,w,top,fill)=>h.shape([[120-w,190],[120-w,top+22],[120-w+9,top+6],[120,top],[120+w-9,top+6],[120+w,top+22],[120+w,190]],fill||'#2E2018',{closed:true});
const HOUSES={
 'Cardboard Box'(h){
  shadow(h);
  h.shape([[40,92],[16,60],[78,48],[112,92]],'#E3BC84');
  h.shape([[200,90],[226,58],[166,46],[130,90]],'#E3BC84');
  h.shape([[38,90],[202,88],[206,189],[34,190]],'#C99A5B',{amp:1.8});
  h.line([[60,100],[60,180]],2.6,'#A87A3E',1);h.line([[184,100],[184,182]],2.6,'#A87A3E',1);
  DOORHOLE(h,38,114,'#33241A');
  h.rect(96,86,48,20,'#EFE2A8',{w:3.4,mis:.5,closed:true});
  h.text('HOME',186,150,17,RED,-7,'middle');
  h.heart(58,142,11,'#FF6F9A',{w:3.6,closed:true});
  h.text('this way up',52,176,10,'#8B6A3A',-3,'middle');h.line([[52,164],[52,156],[48,160],[52,156],[56,160]],2.6,'#8B6A3A',.3);
  h.rect(30,164,26,12,'#EFE2A8',{w:3,mis:.4,closed:true});
 },
 'Classic Wooden Doghouse'(h){
  shadow(h);
  h.shape([[50,190],[50,98],[120,44],[190,98],[190,190]],WOOD,{amp:1.6});
  [72,94,146,168].forEach((x,i)=>h.line([[x,i%2?112:104],[x+1,189]],2.6,'#A87A3E',.9));
  DOORHOLE(h,28,118,'#2E2018');
  h.tube([[36,104],[120,32],[204,104]],12,'#B5403A',{ow:5.5});
  h.line([[60,90],[74,80]],3,'#E26A5A',.3);
  h.rect(100,80,40,20,'#FFE9B8',{w:3.4,closed:true,mis:.6});
  h.text('WOOF',120,95,14,RED,-3,'middle');
  [[103,83],[137,98]].forEach(q=>h.dot(q[0],q[1],1.8,1.8));
  h.bone&&0;
 },
 'Cozy Cottage'(h){
  shadow(h,112);
  h.rect(38,102,164,88,'#FFE7B8',{amp:1.6});
  [[50,150],[80,178],[160,118],[186,168],[60,112],[196,138]].forEach(q=>h.line([[q[0],q[1]],[q[0]+10,q[1]]],2.4,'#E0C48A',.3));
  h.rect(160,38,24,44,'#9C5A44',{w:4.4});
  h.line([[170,30],[180,22],[168,14],[178,6]],4,'#B8B2A4',1);h.line([[184,26],[192,18],[182,10]],3.4,'#B8B2A4',1);
  h.shape([[14,112],[98,42],[142,42],[226,112]],'#C8503A',{amp:1.8});
  [[56,92],[84,64],[160,60],[180,86]].forEach(q=>h.line([[q[0],q[1]],[q[0]+14,q[1]]],3,'#8E2E1E',.3));
  h.line([[40,100],[200,100]],4.6);
  DOORHOLE(h,20,124,'#2E2018');
  h.shape([[98,190],[96,140],[102,130],[106,140],[106,190]],'#B5543A',{w:3.6,closed:true,mis:.5});
  [[50,124],[158,124]].forEach(q=>{h.rect(q[0],q[1],32,30,'#8FD8FF',{w:3.8,closed:true});h.line([[q[0]+16,q[1]],[q[0]+16,q[1]+30]],2.6);h.line([[q[0],q[1]+15],[q[0]+32,q[1]+15]],2.6);
    h.rect(q[0]-4,q[1]+32,40,12,'#8B5A2B',{w:3.6,closed:true});
    ['#FF6F9A','#FFC21A','#fff','#FF6F9A','#C9A0FF'].forEach((c,i)=>{h.line([[q[0]+3+i*7.5,q[1]+31],[q[0]+3+i*7.5,q[1]+26]],2.4,GRASS,.2);h.circ(q[0]+3+i*7.5,q[1]+23,3.4,c,{w:2.2,mis:.2,closed:true,n:7})})});
 },
 'Snow Igloo'(h){
  shadow(h,112);
  const dome=[];for(let i=0;i<=14;i++){const a=Math.PI+i/14*Math.PI;dome.push([120+Math.cos(a)*82,190+Math.sin(a)*92])}
  h.shape(dome,'#EAF6FF',{amp:1.6});
  [[44,160],[70,128],[100,106],[140,106],[170,128],[196,160]].forEach((q,i)=>h.line([[q[0]-14,q[1]],[q[0]+14,q[1]+(i%2?3:-2)]],2.8,'#9FC4DC',.8));
  [[60,172,60,152],[170,172,170,152],[88,120,84,104],[150,118,154,102],[120,100,120,86]].forEach(l=>h.line([[l[0],l[1]],[l[2],l[3]]],2.8,'#9FC4DC',.4));
  h.shape([[76,190],[76,150],[90,126],[150,126],[164,150],[164,190]],'#DDEEFA');
  DOORHOLE(h,26,140,'#26344F');
  [[96,132],[110,130],[130,130],[144,132]].forEach(q=>h.shape([[q[0]-3,q[1]],[q[0]+3,q[1]],[q[0],q[1]+9]],'#fff',{w:2.4,mis:.2,closed:true}));
  h.ell(120,192,108,9,'#fff',{w:3.6,closed:false});
  h.circ(222,176,12,'#fff',{w:3.8,n:10});h.circ(222,154,9,'#fff',{w:3.8,n:9});h.shape([[222,152],[236,155],[222,157]],ORANGE,{w:2.6,mis:.2,closed:true});h.dot(219,150,1.6,1.6);
  h.line([[210,162],[196,152]],3);h.line([[234,162],[240,150]],3);
  h.text('brrr',46,70,18,BLUE,-8,'middle');
 },
 'Treehouse Den'(h){
  shadow(h,96);
  h.shape([[82,190],[92,122],[88,62],[152,62],[148,122],[158,190]],'#9B6A3C',{amp:1.6});
  [[100,90,106,110],[132,80,130,104],[118,124,122,140]].forEach(l=>h.line([[l[0],l[1]],[l[2],l[3]]],3,'#6E4524',.8));
  const cp=[[30,64,34],[70,34,36],[120,24,40],[170,36,36],[208,66,32],[120,64,40]];
  cp.forEach((c,i)=>h.circ(c[0],c[1],c[2],i%2?'#35B544':'#2E9F3E',{n:11,lop:.04}));
  h.shape(circPts(120,50,70,34,14,.05),'#35B544',{noline:1,mis:0,ox:0,oy:0});
  DOORHOLE(h,18,142,'#2E2018');
  h.rect(28,98,100,9,'#B8793A',{w:4,closed:true});
  h.rect(40,56,62,42,WOOD,{amp:1.4});
  h.shape([[34,58],[71,30],[108,58]],'#B5403A',{closed:true});
  h.rect(60,70,20,20,'#8FD8FF',{w:3.4,closed:true});h.line([[70,70],[70,90]],2.4);
  h.line([[48,107],[44,189]],3,'#E8D8A8',1);h.line([[78,107],[80,189]],3,'#E8D8A8',1);
  for(let y=118;y<188;y+=14)h.line([[46+(y-107)*.02,y],[79,y+1]],3,'#C9A870',.6);
  h.line([[71,30],[71,12]],3);h.shape([[71,12],[92,17],[71,24]],RED,{w:2.6,mis:.2,closed:true});
  h.line([[188,108],[190,150]],2.6);h.line([[204,108],[202,150]],2.6);h.rect(186,148,18,6,'#B8793A',{w:3,closed:true,mis:.3});
 },
 'Royal Castle Kennel'(h){
  shadow(h,112);
  // cardboard box castle, crayon towers, paper crown
  h.rect(70,94,100,96,'#C99A5B',{amp:1.7});
  h.rect(28,62,50,128,'#D4A468',{amp:1.7});h.rect(162,62,50,128,'#D4A468',{amp:1.7});
  h.scrib(34,92,38,52,'#4A78E0',9,6);h.scrib(168,100,38,60,'#E8322B',10,6);
  [[28,62],[44,62],[62,62]].forEach(q=>h.rect(q[0],q[1]-14,14,14,'#D4A468',{w:4.2,closed:true,mis:.5}));
  [[162,62],[180,62],[198,62]].forEach(q=>h.rect(q[0],q[1]-14,14,14,'#D4A468',{w:4.2,closed:true,mis:.5}));
  [[78,94],[100,94],[142,94],[158,94]].forEach(q=>h.rect(q[0],q[1]-12,13,12,'#C99A5B',{w:4,closed:true,mis:.4}));
  h.rect(42,134,22,26,'#2E2018',{w:3.4,closed:true});h.rect(176,138,22,26,'#2E2018',{w:3.4,closed:true});
  DOORHOLE(h,24,128,'#2E2018');
  [[104,134,104,190],[112,134,112,190],[128,134,128,190],[136,134,136,190]].forEach(l=>h.line([[l[0],l[1]],[l[2],l[3]]],2.4,'#E8C98A',.5));
  h.line([[96,148],[144,148]],2.4,'#E8C98A',.5);
  h.rect(94,104,52,13,'#EFE2A8',{w:3,mis:.4,closed:true});
  h.text('this side up',120,114,9,'#8B6A3A',0,'middle');
  h.text('ROYAL',120,134,15,'#E8322B',-2,'middle');
  h.line([[34,64],[34,22]],3);h.shape([[34,22],[60,30],[34,40]],RED,{w:3,mis:.3,closed:true});
  h.line([[206,64],[206,22]],3);h.shape([[206,22],[180,30],[206,40]],'#4A78E0',{w:3,mis:.3,closed:true});
  // paper crown, taped on
  h.shape([[88,92],[84,52],[100,70],[112,42],[124,70],[136,42],[148,70],[158,52],[154,92]],'#FFD60A',{closed:true,amp:1.4});
  [[100,80],[120,80],[140,80]].forEach((q,i)=>h.circ(q[0],q[1],5,['#E8322B','#4A78E0','#35B544'][i],{w:2.8,mis:.3,closed:true,n:8}));
  h.rect(84,92,10,10,'#EFE2A8',{w:2.4,mis:.2,closed:true});h.rect(146,92,10,10,'#EFE2A8',{w:2.4,mis:.2,closed:true});
 }
};
PA.house=function(name){
  return cached('h:'+name,()=>{const f=HOUSES[name];if(!f)return fallback('house',name,'0 0 240 200');
    const h=mk(hashS('house'+name),K_HOUSE);f(h);return svgWrap('0 0 240 200','house','house '+name,h.acc.join(''))});
};
})();
