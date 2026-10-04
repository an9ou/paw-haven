
/* =====================================================================
   STYLE G: Doodle sketch. Cute chibi dogs doodled in a pastel sketchbook.
   Layers, back to front:
     paper (dot grid + grain)  >  pencil line frames (3 seeded redraws, each
     shape knocks out the lines behind it)  >  ONE static coloured-pencil layer,
     multiplied over the lines, drifting off them, made patchy by a grain filter
     >  static blush scribbles  >  face frames  >  doodle extras  >  name + washi tape.
   The three line/face/extra frames flip at 8 fps ("boiling line").
   G2_DOGS holds one recipe per breed; drawG() renders any recipe.
   ===================================================================== */
const G2={ink:'#5B3D32',graph:'#A8968A',paper:'#FFFBF3',dot:'#E3D2BA',eye:'#2E201C',pink:'#F28FA5',shadow:'#EADDCB'};
const g2E=(cx,cy,rx,ry,n=16,rot=0)=>ellPts(cx,cy,rx,ry,n,rot);
function g2Samp(c,step,open){
  const P=[];
  c.segs.forEach(sg=>{const ch=Math.hypot(sg[1][0]-sg[0][0],sg[1][1]-sg[0][1])+Math.hypot(sg[2][0]-sg[1][0],sg[2][1]-sg[1][1])+Math.hypot(sg[3][0]-sg[2][0],sg[3][1]-sg[2][1]);
    const n=Math.max(2,Math.round(ch/step));for(let j=0;j<n;j++)P.push(bez(sg,j/n))});
  if(open&&c.segs.length){const l=c.segs[c.segs.length-1][3];P.push([l[0],l[1]])}
  return P;
}
// one pencil pass along dense points P, as a filled ribbon: soft wobble, tapered ends,
// heavier where the outline faces down (weight "under" forms). Closed loops are drawn as
// two overlapping strokes that sometimes leave a hairline gap.
function g2Pen(P,closed,r,o={}){
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
      const w=Math.max(.35,w0*(1+(closed?wk*Math.max(0,ny):0)+wn)*tp)/2,x=pts[i][0]+vx,y=pts[i][1]+vy;
      L.push([x+nx*w,y+ny*w]);Rt.push([x-nx*w,y-ny*w]);
    }
    d+=cr([...L,...Rt.reverse()],true,1/6).d;
  });
  return d;
}
const g2Open=(pts,step=3)=>g2Samp(cr(pts,false,1/6),step,true);
// head outline: chubby lower cheeks, slightly flat crown, optional fluffy cheek tufts
function g2Head(hx,hy,rx,ry,tuft=0){
  const p=[],N=72;
  for(let i=0;i<N;i++){const a=i/N*Math.PI*2,s=Math.sin(a),c=Math.cos(a);
    const z=tuft&&Math.abs(c)>.3&&Math.abs(c)<.9&&s>.15,b=z&&i%3===0?tuft:0;
    p.push([hx+c*(rx*(1+.06*Math.max(0,s))+b),hy+s*(ry*(1-.05*Math.max(0,-s))+b*.6)])}
  return p;
}
function g2Prick(hx,hy,rx,ry,sd,o={}){
  const h=o.h||30,tx=hx+sd*rx*(o.tx??.6),ty=hy-ry-h+(o.dy||0),ob=[hx+sd*rx*(o.ob??.9),hy-ry*(o.oby??.38)],ib=[hx+sd*rx*(o.ib??.14),hy-ry*.97];
  const pts=[ob,[(ob[0]+tx)/2+sd*(o.bul??4),(ob[1]+ty)/2],[tx+sd*2.4,ty+4.5],[tx-sd*2.6,ty+.6],[(ib[0]+tx)/2-sd*1.5,(ib[1]+ty)/2],ib,[(ob[0]+ib[0])/2,hy-ry*.55]];
  const cx=(ob[0]+ib[0])/2+(tx-(ob[0]+ib[0])/2)*.18,cy=(ob[1]+ib[1])/2+(ty-(ob[1]+ib[1])/2)*.18+4;
  const inner=pts.slice(0,6).map(q=>[cx+(q[0]-cx)*.56,cy+(q[1]-cy)*.6]);
  return {pts,inner};
}
function g2Flop(hx,hy,rx,ry,sd,o={}){
  const len=o.len??.85,out=o.out??0,top=o.top??.42;
  return [[hx+sd*rx*top,hy-ry*.93],[hx+sd*rx*.9,hy-ry*.7],[hx+sd*rx*(1.1+out),hy-ry*.1],[hx+sd*rx*(1.1+out),hy+ry*len*.62],[hx+sd*rx*(.95+out*.6),hy+ry*len],[hx+sd*rx*.74,hy+ry*len*.86],[hx+sd*rx*.68,hy+ry*.18],[hx+sd*rx*.6,hy-ry*.5]];
}
function g2Leg(x,y0,y1,w,fill,o={}){
  const pts=[[x-w/2,y0],[x+w/2,y0],[x+w/2,y1-w*.6],[x+w*.6,y1-w*.24],[x+w*.36,y1],[x-w*.36,y1],[x-w*.6,y1-w*.24],[x-w/2,y1-w*.6]];
  return {pts,fill,det:[[[x-3.4,y1-6.5],[x-3.1,y1-1.6]],[[x+3.4,y1-6.5],[x+3.1,y1-1.6]]],marks:o.sock?[{pts:[[x-w,y1-o.sock[1]],[x+w,y1-o.sock[1]-1.5],[x+w,y1+4],[x-w,y1+4]],fill:o.sock[0]}]:[]};
}
// shared sitting body (front-facing, slightly three-quarter). Returns body-group shapes.
function g2SitBody(c,o={}){
  const bx=o.bx??156,G=211,pw=c.paw||c.b;
  const body={pts:[[bx-30,132],[bx+30,132],[bx+47,154],[bx+56,184],[bx+50,205],[bx+24,G+.5],[bx-24,G+.5],[bx-50,205],[bx-56,184],[bx-47,150]],fill:c.b,sh:c.sh,marks:o.bodyMarks||[],
    det:[[[bx+27,G-3],[bx+28,G-22],[bx+38,G-36],[bx+50,G-34]],[[bx-26,G-3],[bx-28,G-20],[bx-38,G-32]]]};
  const hp=[[bx-50,G-5,12.5,7.5],[bx+52,G-5,14,8]].map(q=>({pts:g2E(q[0],q[1],q[2],q[3],14),fill:pw,sh:c.sh,det:[[[q[0]-3,q[1]-1],[q[0]-2.5,q[1]+4]],[[q[0]+3.5,q[1]-1],[q[0]+3,q[1]+4]]]}));
  const legs=[bx-15,bx+14].map(x=>g2Leg(x,146,G,22,c.b,{sock:c.sock}));
  legs.forEach(l=>l.sh=c.sh);
  return {shapes:[body,...hp,...legs],bx,G};
}
const G2_DOGS={
 shiba(){
  const c={b:'#F6B27D',l:'#FFF2E1',in:'#F8C2BC',sh:'#DE8A55',sock:['#FFF2E1',13]};
  const hx=146,hy=105,rx=58,ry=48,fx=hx-5;
  const sb=g2SitBody(c,{bodyMarks:[{pts:g2E(154,152,25,22),fill:c.l}]}),bx=sb.bx;
  const tc=[[bx+38,198],[bx+66,190],[bx+86,168],[bx+84,142],[bx+68,130],[bx+54,140],[bx+56,156],[bx+68,158]];
  const tail={c:ribbon(tc,[14,18,20,20,18,15,12,8]),fill:c.b,sh:c.sh,tail:1,marks:[{c:ribbon(tc.slice(3),[8,8,7,6,4]),fill:c.l,dx:-2,dy:2}]};
  const eL=g2Prick(hx,hy,rx,ry,-1,{h:26,tx:.62}),eR=g2Prick(hx,hy,rx,ry,1,{h:26,tx:.62});
  const mask=[[hx-rx-6,hy+2],[fx-42,hy+10],[fx-30,hy+21],[fx-15,hy+17],[fx,hy+5],[fx+15,hy+17],[fx+30,hy+21],[fx+42,hy+10],[hx+rx+6,hy+2],[hx+rx+6,hy+ry+12],[hx-rx-6,hy+ry+12]];
  return {pose:'sit',hx,hy,rx,ry,fx,tilt:-5,tailO:[bx+40,192],
   shapes:[tail,...sb.shapes,
    {pts:eL.pts,fill:c.b,sh:c.sh,head:1,marks:[{pts:eL.inner,fill:c.in}]},{pts:eR.pts,fill:c.b,sh:c.sh,head:1,marks:[{pts:eR.inner,fill:c.in}]},
    {pts:g2Head(hx,hy,rx,ry,5),fill:c.b,sh:c.sh,head:1,marks:[{pts:mask,fill:c.l},{pts:g2E(fx-22,hy-8,5.2,3.6,10),fill:c.l,nl:1},{pts:g2E(fx+22,hy-8,5.2,3.6,10),fill:c.l,nl:1}]}],
   mouth:'w',extras:[['spark',62,92,9],['spark',44,124,5.5],['heart',236,92,7],['dots',70,150]],tape:'#F7B9C6'};
 },
 husky(){
  const c={b:'#A7B9D3',l:'#FFFFFF',in:'#FFFFFF',sh:'#7C8FB0',sock:['#FFFFFF',22]};
  const hx=146,hy=105,rx=57,ry=48,fx=hx-5;
  const sb=g2SitBody(c,{bodyMarks:[{pts:[[110,128],[198,128],[192,176],[154,184],[116,176]],fill:c.l}]}),bx=sb.bx;
  const tc=[[bx+38,198],[bx+64,190],[bx+80,166],[bx+78,140],[bx+64,124]];
  const tail={c:ribbon(tc,[16,24,27,24,15]),fill:c.b,sh:c.sh,tail:1,marks:[{c:ribbon(tc.slice(2),[10,12,12]),fill:c.l,dx:5,dy:2}]};
  const eL=g2Prick(hx,hy,rx,ry,-1,{h:38,tx:.5,ob:.86,bul:2}),eR=g2Prick(hx,hy,rx,ry,1,{h:38,tx:.5,ob:.86,bul:2});
  const white=[[hx-rx-6,hy-8],[fx-40,hy-9],[fx-22,hy-4],[fx-9,hy-3],[fx-5,hy+12],[fx,hy+17],[fx+5,hy+12],[fx+9,hy-3],[fx+22,hy-4],[fx+40,hy-9],[hx+rx+6,hy-8],[hx+rx+6,hy+ry+12],[hx-rx-6,hy+ry+12]];
  return {pose:'sit',hx,hy,rx,ry,fx,tilt:-5,tailO:[bx+40,194],blue:1,
   shapes:[tail,...sb.shapes,
    {pts:eL.pts,fill:c.b,sh:c.sh,head:1,marks:[{pts:eL.inner,fill:c.in}]},{pts:eR.pts,fill:c.b,sh:c.sh,head:1,marks:[{pts:eR.inner,fill:c.in}]},
    {pts:g2Head(hx,hy,rx,ry,7),fill:c.b,sh:c.sh,head:1,marks:[{pts:white,fill:c.l},{pts:g2E(fx-23,hy-13,8.5,5.5,12,-.2),fill:c.l},{pts:g2E(fx+23,hy-13,8.5,5.5,12,.2),fill:c.l}]}],
   mouth:'w',tongue:0,extras:[['note',60,96,12],['note',38,128,9],['spark',238,96,7],['dots',236,74]],tape:'#B9D4F3'};
 },
 golden(){
  const c={b:'#F8D387',l:'#FDEFC8',ear:'#EDB766',sh:'#DDA548'};
  const hx=146,hy=105,rx=59,ry=49,fx=hx-5;
  const bib=[[124,140],[134,166],[142,154],[150,172],[158,156],[166,170],[174,152],[186,160],[188,128],[124,128]];
  const sb=g2SitBody(c,{bodyMarks:[{pts:bib,fill:c.l}]}),bx=sb.bx;
  const tp=[[bx+40,202],[bx+62,200],[bx+84,190],[bx+96,172],[bx+102,150],[bx+98,128],[bx+92,124],[bx+86,140],[bx+80,160],[bx+66,176],[bx+48,184]];
  const tail={pts:tp,fill:c.b,sh:c.sh,tail:1,det:[[[bx+88,150],[bx+82,164]],[[bx+76,178],[bx+70,184]]]};
  const fl=g2Flop(hx,hy,rx,ry,-1,{len:.62,out:.0,top:.5}),fr=g2Flop(hx,hy,rx,ry,1,{len:.62,out:.0,top:.5});
  return {pose:'sit',hx,hy,rx,ry,fx,tilt:-5,tailO:[bx+42,196],
   shapes:[tail,...sb.shapes,
    {pts:g2Head(hx,hy,rx,ry,3),fill:c.b,sh:c.sh,head:1,marks:[{pts:g2E(fx,hy+30,27,18,14),fill:c.l}],det:[[[hx-6,hy-ry+1],[hx-2,hy-ry-6],[hx+4,hy-ry-2]],[[hx+3,hy-ry+1],[hx+9,hy-ry-5]]]},
    {pts:fl,fill:c.ear,sh:c.sh,head:1},{pts:fr,fill:c.ear,sh:c.sh,head:1}],
   mouth:'w',tongue:1,extras:[['ball',58,182,11],['spark',56,96,8],['heart',240,100,6.5]],tape:'#F9E19A'};
 },
 mutt(){
  const c={b:'#FFFFFF',k:'#4E4A5A',in:'#F2B7B0',sh:'#B9B2C4'};
  const hx=146,hy=105,rx=57,ry=48,fx=hx-5;
  const sb=g2SitBody({...c,sock:null},{bodyMarks:[{pts:g2E(186,150,26,21,14,.3),fill:c.k},{pts:g2E(110,196,15,12,12),fill:c.k},{pts:g2E(140,182,7,6,10),fill:c.k}]}),bx=sb.bx;
  sb.shapes[1].fill=c.k;sb.shapes[1].dark=1;
  const tc=[[bx+38,198],[bx+60,190],[bx+74,170],[bx+76,148]];
  const tail={c:ribbon(tc,[12,12,11,10]),fill:c.k,sh:c.sh,tail:1,dark:1,marks:[{pts:g2E(bx+76.5,147,8,9,12),fill:'#FFFFFF'}]};
  const eR=g2Prick(hx,hy,rx,ry,1,{h:30,tx:.56});
  const fl=g2Flop(hx,hy,rx,ry,-1,{len:.62,out:.04,top:.36});
  return {pose:'sit',hx,hy,rx,ry,fx,tilt:-5,tailO:[bx+40,194],darkEye:[0,1],
   shapes:[tail,...sb.shapes,
    {pts:eR.pts,fill:c.k,sh:c.sh,head:1,dark:1,marks:[{pts:eR.inner,fill:c.in}]},
    {pts:g2Head(hx,hy,rx,ry,0),fill:c.b,sh:c.sh,head:1,marks:[{pts:[[fx+6,hy-4],[fx+12,hy-24],[fx+30,hy-36],[fx+54,hy-30],[fx+62,hy-6],[fx+52,hy+20],[fx+32,hy+24],[fx+14,hy+18]],fill:c.k},{pts:g2E(fx-24,hy-30,9,6,10,-.3),fill:c.k}]},
    {pts:fl,fill:c.k,sh:c.sh,head:1,dark:1}],
   mouth:'w',tongue:1,extras:[['heart',58,98,8],['heart',44,128,5],['spark',240,92,7]],tape:'#FFD0A8'};
 },
 corgi(){
  const c={b:'#F6BE80',l:'#FFFDF8',in:'#F8C2BC',sh:'#DC9050'};
  const hx=96,hy=108,rx=55,ry=47,fx=hx-4,G=211;
  const legs=[[104,c.l],[130,c.l],[214,c.l],[238,c.l]].map(q=>{const l=g2Leg(q[0],168,G,22,q[1]);l.sh='#C9BBA8';return l});
  const body={pts:[[110,122],[170,116],[226,118],[254,132],[262,156],[254,180],[232,190],[140,192],[106,184],[92,154]],fill:c.b,sh:c.sh,
   marks:[{pts:[[96,168],[150,176],[200,174],[262,166],[262,200],[96,200]],fill:c.l},{pts:g2E(112,164,26,24),fill:c.l,nl:1},{pts:g2E(252,168,16,20),fill:c.l,nl:1}],det:[[[214,186],[212,166],[222,150],[236,148]]]};
  const tail={pts:g2E(258,130,11,9,12,-.4),fill:c.b,sh:c.sh,tail:1};
  const eL=g2Prick(hx,hy,rx,ry,-1,{h:46,tx:.66,ob:.94,oby:.3,bul:6}),eR=g2Prick(hx,hy,rx,ry,1,{h:46,tx:.66,ob:.94,oby:.3,bul:6});
  const blaze=[[fx-5,hy-ry-2],[fx+5,hy-ry-2],[fx+6,hy-12],[fx+26,hy+12],[fx+50,hy+20],[fx+50,hy+60],[fx-50,hy+60],[fx-50,hy+20],[fx-26,hy+12],[fx-6,hy-12]];
  return {pose:'loaf',hx,hy,rx,ry,fx,tilt:4,tailO:[250,134],
   shapes:[tail,...legs,body,
    {pts:eL.pts,fill:c.b,sh:c.sh,head:1,marks:[{pts:eL.inner,fill:c.in}]},{pts:eR.pts,fill:c.b,sh:c.sh,head:1,marks:[{pts:eR.inner,fill:c.in}]},
    {pts:g2Head(hx,hy,rx,ry,2.5),fill:c.b,sh:c.sh,head:1,marks:[{pts:blaze,fill:c.l}]}],
   mouth:'3',tongue:0,extras:[['bone',210,74,12],['spark',176,52,6],['heart',30,150,6]],tape:'#BDE7D2'};
 },
 dachs(){
  const c={b:'#B98767',l:'#F1CD9E',ear:'#A07051',sh:'#8E5E40'};
  const hx=92,hy=110,rx=52,ry=45,fx=hx-3,G=211;
  const legs=[104,128,240,262].map(x=>g2Leg(x,172,G,18,c.b,{sock:[c.l,9]}));legs.forEach(l=>l.sh=c.sh);
  const body={pts:[[106,130],[180,124],[250,126],[278,136],[288,156],[280,178],[258,186],[130,188],[102,180],[90,154]],fill:c.b,sh:c.sh,
   marks:[{pts:g2E(114,168,24,18),fill:c.l}],det:[[[238,184],[238,166],[250,154],[264,152]]]};
  const tc=[[280,148],[290,138],[294,122],[290,104]];
  const tail={c:ribbon(tc,[9,7,5,3]),fill:c.b,sh:c.sh,tail:1};
  const fl=g2Flop(hx,hy,rx,ry,-1,{len:1.12,out:.02}),fr=g2Flop(hx,hy,rx,ry,1,{len:1.12,out:.02});
  return {pose:'loaf',hx,hy,rx,ry,fx,tilt:4,tailO:[280,148],
   shapes:[tail,...legs,body,
    {pts:g2Head(hx,hy,rx,ry,0),fill:c.b,sh:c.sh,head:1,marks:[{pts:g2E(fx,hy+29,25,16,14),fill:c.l},{pts:g2E(fx-20,hy-8,5,3.4,10),fill:c.l,nl:1},{pts:g2E(fx+20,hy-8,5,3.4,10),fill:c.l,nl:1}]},
    {pts:fl,fill:c.ear,sh:c.sh,head:1},{pts:fr,fill:c.ear,sh:c.sh,head:1}],
   mouth:'w',tongue:1,extras:[['heart',200,82,8],['heart',224,102,5],['spark',176,60,6],['swish',292,92,0]],tape:'#D3C6F1'};
 }
};
// doodle extras (redrawn per frame)
function g2Extra(e,r,ink){
  const [t,x,y,s]=e,j=()=>(r()-.5)*1.1,st=`fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"`;
  const g=(inner)=>`<g transform="translate(${R1(j())} ${R1(j())}) rotate(${R1((r()-.5)*7)} ${x} ${y})">${inner}</g>`;
  if(t==='spark'){const k=s*.16,q=()=>R1((r()-.5)*s*.12);return g(`<path d="M${x} ${y-s}Q${x+k+q()} ${y-k} ${x+s*.9} ${y}Q${x+k} ${y+k+q()} ${x} ${y+s}Q${x-k+q()} ${y+k} ${x-s*.9} ${y}Q${x-k} ${y-k+q()} ${x} ${y-s}Z" fill="#FFE59A" ${st.replace('fill="none" ','')}/>`)}
  if(t==='heart')return g(`<path d="M${x} ${y+s*.9}C${x-s*1.5} ${y-s*.05} ${x-s*.75} ${y-s*1.25} ${x} ${y-s*.38}C${x+s*.75} ${y-s*1.25} ${x+s*1.5} ${y-s*.05} ${x} ${y+s*.9}Z" fill="#F9B2C2" ${st.replace('fill="none" ','')}/>`);
  if(t==='note')return g(`<ellipse cx="${x}" cy="${y}" rx="${R1(s*.36)}" ry="${R1(s*.27)}" transform="rotate(-22 ${x} ${y})" fill="${ink}"/><path d="M${R1(x+s*.32)} ${R1(y-s*.08)}L${R1(x+s*.34)} ${R1(y-s*1.25)}Q${R1(x+s*.62)} ${R1(y-s*1.05)} ${R1(x+s*.8)} ${R1(y-s*.7)}" ${st}/>`);
  if(t==='dots')return g(`<circle cx="${x}" cy="${y}" r="1.6" fill="${ink}"/><circle cx="${x+9}" cy="${y-6}" r="1.1" fill="${ink}"/><circle cx="${x+4}" cy="${y+8}" r="1" fill="${ink}"/>`);
  if(t==='ball')return g(`<circle cx="${x}" cy="${y}" r="${s}" fill="#E4F08E" ${st.replace('fill="none" ','')}/><path d="M${R1(x-s*.75)} ${R1(y-s*.62)}Q${R1(x-s*.05)} ${y} ${R1(x-s*.7)} ${R1(y+s*.7)}M${R1(x+s*.75)} ${R1(y-s*.66)}Q${R1(x+s*.05)} ${y} ${R1(x+s*.72)} ${R1(y+s*.66)}" ${st} stroke-width="1.2"/>`);
  if(t==='bone'){const w=s,h=s*.34;return g(`<path d="M${x-w} ${y-h*.55}A${R1(h*.75)} ${R1(h*.75)} 0 1 1 ${R1(x-w*.84)} ${R1(y-h*1.4)}L${R1(x+w*.84)} ${R1(y-h*1.4)}A${R1(h*.75)} ${R1(h*.75)} 0 1 1 ${x+w} ${R1(y-h*.55)}A${R1(h*.75)} ${R1(h*.75)} 0 1 1 ${R1(x+w*.84)} ${R1(y+h*.3)}L${R1(x-w*.84)} ${R1(y+h*.3)}A${R1(h*.75)} ${R1(h*.75)} 0 1 1 ${x-w} ${R1(y-h*.55)}Z" fill="#FFF3D6" ${st.replace('fill="none" ','')}/>`)}
  if(t==='swish')return g(`<path d="M${x-14} ${y-6}q5 -6 4 -13M${x-6} ${y+6}q7 -4 9 -11" ${st} stroke-width="1.3"/>`);
  return '';
}
function g2Face(S,r,o){
  const {hx,hy,rx,ry,fx}=S,ey=hy+ry*.19,ex=rx*.44,ny=ey+10.5,ink=G2.ink,j=()=>(r()-.5)*.5;
  const eyeO=(x,dark)=>{const y=ey+j(),xx=x+j();
    if(S.blue)return `<ellipse cx="${R1(xx)}" cy="${R1(y)}" rx="6.4" ry="7.2" fill="#7CC6F4"/><ellipse cx="${R1(xx+.3)}" cy="${R1(y+.8)}" rx="3.4" ry="4" fill="${G2.eye}"/><ellipse cx="${R1(xx)}" cy="${R1(y)}" rx="6.6" ry="7.4" fill="none" stroke="${G2.eye}" stroke-width="1.5"/><circle cx="${R1(xx+2.2)}" cy="${R1(y-2.8)}" r="2.2" fill="#fff"/><circle cx="${R1(xx-2.2)}" cy="${R1(y+2.8)}" r="1" fill="#fff"/>`;
    return `<ellipse cx="${R1(xx)}" cy="${R1(y)}" rx="5.6" ry="6.6" fill="${G2.eye}"${dark?' stroke="#fff" stroke-width="2.4" paint-order="stroke"':''}/><circle cx="${R1(xx+2)}" cy="${R1(y-2.4)}" r="2.2" fill="#fff"/><circle cx="${R1(xx-1.9)}" cy="${R1(y+2.5)}" r="1" fill="#fff"/>`};
  const eyeC=x=>`<path d="M${R1(x-5.5)} ${R1(ey-.5)}Q${R1(x)} ${R1(ey+4.5)} ${R1(x+5.5)} ${R1(ey-.5)}" fill="none" stroke="${G2.eye}" stroke-width="2.2" stroke-linecap="round"${S.darkEye&&x>fx?' style="stroke:#fff"':''}/>`;
  const dk=S.darkEye||[0,0];
  let s=`<g class="g2eo">${eyeO(fx-ex,dk[0])}${eyeO(fx+ex,dk[1])}</g><g class="g2ec">${eyeC(fx-ex)}${eyeC(fx+ex)}</g>`;
  s+=`<path d="M${R1(fx-4.6+j())} ${R1(ny-2.4)}Q${R1(fx)} ${R1(ny-4.2+j())} ${R1(fx+4.6+j())} ${R1(ny-2.4)}Q${R1(fx+3.4)} ${R1(ny+2.6)} ${R1(fx)} ${R1(ny+3)}Q${R1(fx-3.4)} ${R1(ny+2.6)} ${R1(fx-4.6)} ${R1(ny-2.4)}Z" fill="${G2.eye}" stroke="${G2.eye}" stroke-width="1" stroke-linejoin="round"/><ellipse cx="${R1(fx-1.4)}" cy="${R1(ny-1.6)}" rx="1.4" ry=".8" fill="#fff" opacity=".85"/>`;
  const m0=ny+3,mw=o.small?5:5.6;
  if(S.tongue)s+=`<path d="M${R1(fx-3.4)} ${R1(m0+4.6)}Q${R1(fx-3.6+j())} ${R1(m0+11)} ${R1(fx)} ${R1(m0+11.2)}Q${R1(fx+3.6)} ${R1(m0+11)} ${R1(fx+3.4)} ${R1(m0+4.6)}Z" fill="#F58EA2" stroke="${ink}" stroke-width="1.1" stroke-linejoin="round"/><path d="M${fx} ${R1(m0+6)}v3" stroke="#D66A82" stroke-width=".9" stroke-linecap="round"/>`;
  const mouth=S.mouth==='3'?`M${R1(fx)} ${R1(m0)}v1.2M${R1(fx)} ${R1(m0+1.2)}q${R1(-mw*.15)} ${R1(4.4+j())} ${R1(-mw)} ${R1(2.4)}M${R1(fx)} ${R1(m0+1.2)}q${R1(mw*.15)} ${R1(4.4+j())} ${R1(mw)} ${R1(2.4)}`
    :`M${R1(fx)} ${R1(m0)}v1.6M${R1(fx-mw)} ${R1(m0+1.4)}q${R1(mw*.45)} ${R1(4.2+j())} ${R1(mw)} ${R1(.2)}q${R1(mw*.55)} ${R1(4.2+j())} ${R1(mw)} ${R1(-.2)}`;
  s+=`<path d="${mouth}" fill="none" stroke="${ink}" stroke-width="${o.small?2.2:1.7}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return s;
}
function drawG(key,o={}){
  const D=DOGS[key],S=G2_DOGS[key](),u=uid(),small=!!o.mini,nF=(o.still||small)?1:3,P=G2.paper;
  const defs=[],sd0=hashS('g2'+key);
  const shapes=S.shapes.map((s,i)=>{
    const c=s.c||cr(s.pts,true,1/6),Pd=g2Samp(c,4),bb=bbox(Pd),rs=rng(sd0+i*131);
    const dx=.8+rs()*1.8,dy=.4+rs()*1.6,cx=(bb[0]+bb[2])/2,cy=(bb[1]+bb[3])/2,sc=1+(rs()-.4)*.03;
    let vx=0,vy=0;const wp=[];for(let k=0;k<Pd.length;k+=2){vx=vx*.75+(rs()-.5)*1.3;vy=vy*.75+(rs()-.5)*1.3;wp.push([cx+(Pd[k][0]-cx)*sc+dx+vx,cy+(Pd[k][1]-cy)*sc+dy+vy])}
    const drift=cr(wp,true,1/6).d,cl=uid(),cf=uid(),mk=uid(),off=Math.max(3.5,Math.min(11,Math.min(bb[2]-bb[0],bb[3]-bb[1])*.2));
    defs.push(`<clipPath id="${cl}"><path d="${c.d}"/></clipPath><clipPath id="${cf}"><path d="${drift}"/></clipPath><mask id="${mk}" maskUnits="userSpaceOnUse" x="-40" y="-40" width="380" height="320"><rect x="-40" y="-40" width="380" height="320" fill="#fff"/><path d="${c.d}" fill="#000" transform="translate(${R1(-off*.8)} ${R1(-off)})"/></mask>`);
    const marks=(s.marks||[]).map(m=>{const mc=m.c||cr(m.pts,true,1/6);return {...m,c:mc,P:g2Samp(mc,4)}});
    return {...s,c,P:Pd,bb,drift,cl,cf,mk,marks,i};
  });
  // ---- static coloured-pencil layer ----
  const hatch=(bb,gap,r)=>{let d='';const h=bb[3]-bb[1];for(let x=bb[0]-h*.6;x<bb[2]+6;x+=gap){const x0=x+(r()-.5)*1.4,y0=bb[3]+4,x1=x+h*.6+(r()-.5)*1.4,y1=bb[1]-4;d+=`M${R1(x0)} ${R1(y0)}L${R1(x1)} ${R1(y1)}`}return d};
  const colorOf=s=>{
    const r=rng(sd0+s.i*17+3);
    let m='';s.marks.forEach(k=>{m+=`<path d="${k.c.d}" fill="${k.fill}"${k.dx?` transform="translate(${k.dx} ${k.dy||0})"`:''}/>`});
    const shade=s.dark?'#2E2B38':s.sh||'#C9B8A8';
    const hz=small?'':`<g mask="url(#${s.mk})"><path d="${hatch(s.bb,3.1,r)}" fill="none" stroke="${shade}" stroke-width="1.25" stroke-opacity="${s.fill==='#FFFFFF'||s.fill==='#FFFDF8'?.32:.42}" stroke-linecap="round"/></g>`;
    return `<path d="${s.drift}" fill="${s.fill}"/><g clip-path="url(#${s.cf})">${m}${hz}</g>`;
  };
  const tailWrap=(s,inner)=>s.tail?`<g class="g2tail" style="transform-origin:${S.tailO[0]}px ${S.tailO[1]}px">${inner}</g>`:inner;
  const tilt=inner=>`<g transform="rotate(${S.tilt} ${S.hx} ${R1(S.hy+S.ry*.85)})">${inner}</g>`;
  const split=fn=>{let b='',h='';shapes.forEach(s=>{const t=tailWrap(s,fn(s));if(s.head)h+=t;else b+=t});return b+tilt(h)};
  const G0=211,bxs=S.pose==='sit'?156:180,bw=S.pose==='sit'?66:102;
  const colour=`<ellipse cx="${bxs}" cy="${G0+1}" rx="${bw}" ry="7" fill="${G2.shadow}"/>`+split(colorOf);
  // ---- blush (static scribbles, normal blend so it shows on dark coats too) ----
  const br=rng(sd0+99),ey=S.hy+S.ry*.19,blX=S.rx*.44+11;
  const scrib=(x,y)=>{let d=`M${R1(x-7)} ${R1(y+1)}`;for(let k=0;k<7;k++){const t=k/6,xx=x-7+t*14;d+=`L${R1(xx+1.5+(br()-.5))} ${R1(y-3.4+Math.abs(t-.5)*3)}L${R1(xx+2.6)} ${R1(y+3.4-Math.abs(t-.5)*3)}`}return d};
  const blush=small?`<ellipse cx="${R1(S.fx-blX)}" cy="${R1(ey+9)}" rx="7" ry="4" fill="${G2.pink}" opacity=".5"/><ellipse cx="${R1(S.fx+blX)}" cy="${R1(ey+9)}" rx="7" ry="4" fill="${G2.pink}" opacity=".5"/>`
    :`<ellipse cx="${R1(S.fx-blX)}" cy="${R1(ey+9)}" rx="8" ry="4.6" fill="${G2.pink}" opacity=".22"/><ellipse cx="${R1(S.fx+blX)}" cy="${R1(ey+9)}" rx="8" ry="4.6" fill="${G2.pink}" opacity=".22"/><path d="${scrib(S.fx-blX,ey+9)}${scrib(S.fx+blX,ey+9)}" fill="none" stroke="${G2.pink}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round" opacity=".8"/>`;
  // ---- pencil frames ----
  const W=small?3.4:2.1;
  const lineFrame=k=>{
    const r=rng(sd0*3+k*7919+1);
    let pre='';
    if(!small){const hc=g2Samp(cr(g2E(S.hx+4,S.hy-3,S.rx*1.03,S.ry*1.04,14),true,1/6),5);pre+=tilt(`<path d="${g2Pen(hc,true,r,{w:.9,wk:0,amp:1.1,one:1})}" fill="${G2.graph}" opacity=".45"/>`);
      const gl=g2Open([[bxs-bw-14,G0+1.5],[bxs,G0+.5],[bxs+bw+16,G0+2]],5);pre+=`<path d="${g2Pen(gl,false,r,{w:1.1,amp:.8})}" fill="${G2.graph}" opacity=".7"/>`}
    const one=s=>{
      let t=`<path d="${s.c.d}" fill="${P}"/>`;
      s.marks.forEach(m=>{if(m.nl||small)return;t+=`<g clip-path="url(#${s.cl})"><path d="${g2Pen(m.P,true,r,{w:1.05,wk:.3,amp:.6,one:1})}" fill="${G2.ink}" opacity=".42"${m.dx?` transform="translate(${m.dx} ${m.dy||0})"`:''}/></g>`});
      t+=`<path d="${g2Pen(s.P,true,r,{w:W*(s.lw||1),amp:small?.25:.75})}" fill="${G2.ink}"/>`;
      (s.det||[]).forEach(dp=>{if(small&&dp.length<3)return;t+=`<path d="${g2Pen(g2Open(dp),false,r,{w:small?2.4:1.45,amp:.5,tap:.3})}" fill="${G2.ink}"/>`});
      return t;
    };
    let b='',h='';shapes.forEach(s=>{const t=tailWrap(s,one(s));if(s.head)h+=t;else b+=t});
    return pre+b+tilt(h);
  };
  const faceFrame=k=>tilt(g2Face(S,rng(sd0+k*313+7),{small}));
  const extraFrame=k=>{const r=rng(sd0+k*577+5);let s='';(S.extras||[]).forEach(e=>{s+=g2Extra(e,r,G2.ink)});
    if(S.tail){} return s};
  let lines='',faces='',extras='';
  for(let k=0;k<nF;k++){lines+=`<g class="g2b${k}">${lineFrame(k)}</g>`;faces+=`<g class="g2b${k}">${faceFrame(k)}</g>`;if(!small)extras+=`<g class="g2b${k}">${extraFrame(k)}</g>`}
  if(!small)defs.push(`<filter id="g2g${u}" x="-10%" y="-10%" width="120%" height="120%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="4"/><feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="f"/><feTurbulence type="fractalNoise" baseFrequency=".028" numOctaves="2" seed="11"/><feColorMatrix type="matrix" values="1 0 0 0 0  1 0 0 0 0  1 0 0 0 0  0 0 0 0 1" result="c"/><feColorMatrix in="SourceGraphic" type="matrix" values="-.3 -.59 -.11 0 1  0 0 0 0 0  0 0 0 0 0  0 0 0 0 1" result="k"/><feComposite in="f" in2="c" operator="arithmetic" k2=".4" k3=".8" k4="-.2" result="n"/><feComposite in="n" in2="k" operator="arithmetic" k2="1" k3="1.1" result="n2"/><feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.7 0 0 0 -.36" result="a"/><feComposite in="SourceGraphic" in2="a" operator="in"/></filter>`+
    `<filter id="g2p${u}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="2"/><feColorMatrix type="matrix" values="0 0 0 0 .45  0 0 0 0 .36  0 0 0 0 .25  0 0 0 -1.1 .62"/></filter>`);
  defs.push(`<pattern id="g2d${u}" width="15" height="15" patternUnits="userSpaceOnUse"><circle cx="7.5" cy="7.5" r="${small?1.4:.95}" fill="${G2.dot}"/></pattern>`);
  const paper=`<rect x="-10" y="-12" width="320" height="260" fill="${P}"/><rect x="-10" y="-12" width="320" height="260" fill="url(#g2d${u})"/>`+(small?'':`<rect x="-10" y="-12" width="320" height="260" filter="url(#g2p${u})" opacity=".5"/>`);
  const tape=small?'':`<g transform="rotate(-37 30 20)"><path d="M-6 11l3 2.2-3 2.2 3 2.2-3 2.2 3 2.2-3 2.2 3 2.2L68 27l-3-2.2 3-2.2-3-2.2 3-2.2-3-2.2 3-2.2-3-2.2Z" fill="${S.tape}" fill-opacity=".78"/><path d="M-2 15.5H64M-2 22.5H64" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-dasharray="5 4"/></g>`;
  const name=small?'':`<g transform="rotate(-4 250 34)"><text x="284" y="40" text-anchor="end" font-family="Caveat,'Gaegu','Gloria Hallelujah','Comic Sans MS',cursive" font-size="31" font-weight="700" fill="${G2.ink}">${D.name}</text><path d="M${284-D.name.length*12.5} 47q${D.name.length*6} 4 ${D.name.length*12.5} -1" fill="none" stroke="${G2.pink}" stroke-width="2.2" stroke-linecap="round"/></g>`;
  const vb=small?(S.pose==='sit'?'52 24 228 181':'22 2 270 214'):'0 -2 300 238';
  const blend=small?'':` style="mix-blend-mode:multiply" filter="url(#g2g${u})"`;
    const zs=S.pose==='sit'&&!small?' transform="translate(152 212) scale(1.07) translate(-152 -212)"':'';
return `<svg class="sd sdG ${(o.still||small)?'':'g2live '}${o.cls||''}" viewBox="${vb}" role="img" aria-label="${D.name} the ${D.breed}, doodle sketch style" ${o.attrs||''}><defs>${defs.join('')}</defs>${paper}<g${zs}><g>${lines}</g><g${blend}>${colour}</g><g>${tilt(blush)}</g>${faces}</g>${extras}${name}${tape}</svg>`;
}

