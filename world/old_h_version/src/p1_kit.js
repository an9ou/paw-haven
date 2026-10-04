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
