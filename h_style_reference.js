/* =====================================================================
   STYLE H: Ugly hand-drawn. Drawn with a mouse in a paint program, on purpose.
   Flat bucket-fill colour that misses the lines, jaggy thick outlines that do not
   quite close, lopsided potatoes, wrong-sized eyes. Each dog gets ONE big joke:
   corgi ears, endless dachshund, dramatic husky, smug shiba with a giant curl,
   golden fluffball with a tongue, Pepper's huge black spots. Faces stay clean,
   simple shapes so they read. Three seeded redraws flip at 3 fps.
   ===================================================================== */
const H3={ink:'#1E1A18',red:'#E8322B',sun:'#FFC21A',grass:'#35B544'};
function h3Dense(pts,closed,step){
  const out=[],n=pts.length,m=closed?n:n-1;
  for(let i=0;i<m;i++){const a=pts[i],b=pts[(i+1)%n],k=Math.max(1,Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/step));
    for(let j=0;j<k;j++)out.push([a[0]+(b[0]-a[0])*j/k,a[1]+(b[1]-a[1])*j/k])}
  if(!closed)out.push(pts[n-1]);
  return out;
}
const h3Circ=(cx,cy,rx,ry,n=14,lop=0)=>{const p=[];for(let i=0;i<n;i++){const a=i/n*Math.PI*2;p.push([cx+Math.cos(a)*rx*(1+lop*Math.sin(a*2)),cy+Math.sin(a)*ry*(1+lop*Math.cos(a))])}return p};
const h3Spiral=(cx,cy,r0,r1,turns,n,a0)=>{const p=[];for(let i=0;i<=n;i++){const t=i/n,a=a0+t*turns*Math.PI*2,rr=r1+(r0-r1)*t;p.push([cx+Math.cos(a)*rr,cy+Math.sin(a)*rr])}return p};
function h3Kit(r,small){
  const J=a=>(r()-.5)*2*a,acc=[],LW=small?8:5.5;
  const pl=(P,amp)=>P.map((q,i)=>(i?'L':'M')+R1(q[0]+J(amp))+' '+R1(q[1]+J(amp))).join('');
  const st=(d,w,c,x='')=>`<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${x}/>`;
  const h={J,r,acc,LW,st,pl,
    // bucket fill that misses the outline, then a jaggy outline that may not close
    shape(pts,fill,o={}){
      const P=h3Dense(pts,true,o.step||12),n=P.length,c=P.reduce((a,q)=>[a[0]+q[0]/n,a[1]+q[1]/n],[0,0]);
      const ox=o.ox??3+J(1.2),oy=o.oy??-2+J(1.2),sc=o.sc??.97;
      if(fill)acc.push(`<path d="${pl(P.map(q=>[c[0]+(q[0]-c[0])*sc+ox,c[1]+(q[1]-c[1])*sc+oy]),o.famp??1.3)}Z" fill="${fill}"/>`);
      if(!o.noline){const s0=Math.floor(r()*n),cnt=n+(o.closed?1:(r()<.55?0:-1)),L=[];for(let i=0;i<=cnt;i++)L.push(P[(s0+i)%n]);acc.push(st(pl(L,o.amp??1.4),o.w||LW,H3.ink))}
    },
    // stick/tube limb: thick ink stroke with a narrower colour stroke slightly off
    tube(pts,w,fill,o={}){const P=h3Dense(pts,false,9);acc.push(st(pl(P,1.1),w+(o.ow??LW*1.5),H3.ink));if(fill)acc.push(st(pl(P,1),w,fill,`transform="translate(${o.ox??1.5} ${o.oy??-1})"`))},
    line(pts,w,col,amp=1.2){acc.push(st(pl(h3Dense(pts,false,8),amp),w,col||H3.ink))},
    dot(x,y,rx,ry,fill){acc.push(`<ellipse cx="${R1(x+J(.7))}" cy="${R1(y+J(.7))}" rx="${rx}" ry="${ry??rx}" fill="${fill||H3.ink}"/>`)},
    // readable eye: white circle, clean outline, big pupil. lid = coat colour covering the top (smug)
    eye(x,y,rad,o={}){
      h.shape(h3Circ(x,y,rad,rad*(o.sq||1.05),12),'#fff',{ox:0,oy:0,sc:1,w:small?4.5:3.4,amp:.6,closed:1,famp:.3});
      const px=x+(o.lx||0)*rad*.38,py=y+(o.ly||0)*rad*.38;
      if(o.iris){h.dot(px,py,rad*.68,rad*.72,o.iris);h.dot(px,py,rad*.34,rad*.36)}else h.dot(px,py,rad*.48,rad*.5);
      if(!small)h.dot(px-rad*.18,py-rad*.24,rad*.17,rad*.17,'#fff');
      if(o.lid!=null){const ly=y-rad+rad*2*o.lid;acc.push(`<path d="M${R1(x-rad-1.5)} ${R1(ly)}L${R1(x-rad-1.5)} ${R1(y-rad-3)}L${R1(x+rad+1.5)} ${R1(y-rad-3)}L${R1(x+rad+1.5)} ${R1(ly)}Z" fill="${o.lidc}"/>`);h.line([[x-rad-2,ly+J(.5)],[x+rad+2,ly+J(.8)]],small?4.5:3.6)}
    },
    text(s,x,y,size,col,rot=0){acc.push(`<text x="${R1(x+J(1.2))}" y="${R1(y+J(1))}" transform="rotate(${R1(rot+J(1.5))} ${x} ${y})" font-family="'Gloria Hallelujah','Comic Sans MS',cursive" font-size="${size}" fill="${col}" stroke="${col}" stroke-width=".8">${s}</text>`)}
  };
  return h;
}
const H3_DOGS={
 shiba(h){ // joke: a curly tail bigger than the dog, and a smug face
  const O='#FF8A1E',C='#FFE7B3';
  h.tube(h3Spiral(214,82,4,46,1.55,30,2.1).reverse().concat([[184,136]]).reverse(),15,O);
  [[[108,162],[106,196]],[[130,166],[132,197]],[[168,166],[166,197]],[[188,160],[194,196]]].forEach(l=>h.tube(l,9,O));
  h.shape([[96,134],[124,122],[170,124],[196,138],[198,160],[176,172],[120,174],[98,162]],O);
  h.shape([[52,82],[48,46],[78,70]],O);h.shape([[94,68],[112,40],[118,82]],O);
  h.shape(h3Circ(84,104,40,34,14,.04),O);
  h.shape([[54,112],[82,104],[112,112],[108,134],[84,140],[58,132]],C,{noline:1,ox:-2,oy:1});
  h.eye(70,98,8.5,{lid:.5,lidc:O,lx:1,ly:.6});h.eye(98,96,6.5,{lid:.5,lidc:O,lx:1,ly:.6});
  h.line([[60,84],[78,86]],4);h.line([[90,80],[106,76]],4);
  h.dot(84,114,4.5,3.4);h.line([[72,124],[86,127],[100,121],[105,115]],4);
  if(!h.small)h.text('heh.',128,112,17,H3.ink,-6);
 },
 corgi(h){ // joke: enormous ears, legs you can barely see
  const O='#FFA42E',W='#FFFFFF',P='#FF6F9A';
  [[100,184],[122,186],[200,186],[220,184]].forEach(q=>h.tube([[q[0],q[1]],[q[0]+1,q[1]+7]],11,W));
  h.tube([[236,152],[248,146]],9,O);
  h.shape([[96,148],[130,136],[200,136],[238,146],[242,170],[220,186],[120,188],[94,174]],O);
  h.shape([[110,174],[160,180],[226,174],[214,186],[122,188]],W,{noline:1,ox:-2,oy:2});
  h.shape([[52,106],[18,6],[84,90]],O);h.shape([[96,90],[128,2],[126,112]],O);
  h.shape([[42,86],[30,18],[66,84]],'#FFC2C2',{noline:1,ox:0,oy:0,sc:.9});h.shape([[104,86],[124,24],[118,100]],'#FFC2C2',{noline:1,ox:0,oy:0,sc:.9});
  h.shape(h3Circ(80,126,40,34,14,.05),O);
  h.shape([[74,94],[86,94],[96,138],[110,150],[52,152],[62,136]],W,{noline:1,ox:1,oy:0});
  h.eye(64,120,8.5,{lx:.3});h.eye(96,116,6,{lx:.3});
  h.dot(80,134,5,3.6);
  h.shape([[64,142],[96,140],[90,156],[72,157]],'#7A1F2E',{w:4,ox:0,oy:0,sc:1});h.shape([[72,151],[88,150],[84,158],[75,158]],P,{noline:1,ox:0,oy:0});
 },
 golden(h){ // joke: a big yellow fluffball, tongue out
  const Y='#FFD60A',E='#F0A800',P='#FF6F9A';
  [[118,182],[146,186],[176,186],[200,180]].forEach(x=>h.tube([[x[0],x[1]],[x[0]+1,198]],9,Y));
  h.line([[226,128],[240,116],[250,124],[262,106],[268,110],[278,92]],5);
  const fl=[],NB=13;for(let j=0;j<NB;j++)for(let t=0;t<1;t+=.2){const a=(j+t)/NB*Math.PI*2,rr=62+Math.sin(j*2.3)*3+11*Math.sin(Math.PI*t);fl.push([150+Math.cos(a)*rr*1.14,124+Math.sin(a)*rr*.86])}
  h.shape(fl,Y,{step:30,amp:.9});
  h.shape([[86,74],[62,98],[60,132],[78,138],[92,106]],E);h.shape([[178,72],[204,96],[204,128],[188,134],[176,104]],E);
  h.eye(118,100,5.4,{});h.eye(150,96,7,{});
  h.dot(134,114,5.5,4);
  h.line([[110,120],[124,130],[146,130],[160,118]],4.2);
  h.shape([[124,128],[146,128],[148,160],[136,170],[124,160]],P,{w:4,ox:0,oy:0,sc:1,closed:1});h.line([[135,134],[135,156]],2.6,'#C9406A');
 },
 dachs(h){ // joke: absurdly long (and an extra pair of legs)
  const B='#A2522A',T='#F5B26B',E='#6E3315';
  [36,74,112,150,188,226].forEach((x,i)=>h.tube([[x,168],[x+(i%2?2:-2),194]],8,B));
  h.line([[34,150],[20,138],[16,124],[8,118]],5);
  h.shape([[30,140],[90,136],[150,142],[210,136],[248,132],[258,152],[246,170],[150,172],[60,170],[28,164]],B,{step:14});
  h.shape([[150,164],[210,166],[246,160],[240,172],[150,174]],T,{noline:1,ox:-2,oy:1});
  h.shape(h3Circ(256,122,30,26,12,.05),B);
  h.shape([[238,104],[222,112],[218,146],[230,156],[240,130]],E);
  h.shape([[262,128],[296,124],[296,142],[266,146]],T,{w:5});
  h.eye(250,114,6.5,{lx:.6});h.eye(272,110,4.6,{lx:.6});
  h.dot(294,129,4.5,4);h.line([[272,140],[284,143],[292,139]],3.6);
  if(!h.small){h.line([[30,110],[200,108]],3.4,H3.red);h.line([[40,102],[30,110],[40,118]],3.4,H3.red);h.line([[190,100],[200,108],[190,116]],3.4,H3.red);h.text('sooo long',74,100,19,H3.red,-2)}
 },
 husky(h){ // joke: blue eyes and a VERY dramatic face
  const G='#6E9CEB',W='#FFFFFF',BL='#1EA8FF',CAP='#4A6FC0';
  h.tube([[226,138],[250,128],[262,104],[252,84]],16,G);h.tube([[258,98],[252,84]],16,W,{ow:0});
  [[[124,168],[122,198]],[[150,170],[152,198]],[[190,170],[188,198]],[[212,164],[218,197]]].forEach(l=>h.tube(l,10,G));
  h.shape([[110,138],[150,126],[210,128],[236,146],[230,170],[200,180],[130,180],[108,164]],G);
  h.shape([[120,166],[170,170],[220,166],[200,180],[130,180]],W,{noline:1,ox:-2,oy:2});
  h.shape([[50,90],[44,40],[80,74]],G);h.shape([[104,74],[122,32],[132,90]],G);
  h.shape(h3Circ(88,112,46,40,14,.04),G);
  h.shape([[48,108],[70,98],[88,118],[106,98],[128,108],[126,140],[88,154],[52,140]],W,{noline:1,ox:0,oy:1});
  h.eye(68,104,13,{iris:BL,lx:.2,ly:-.3});h.eye(108,102,10,{iris:BL,lx:-.2,ly:-.3});
  h.line([[50,86],[64,82],[80,90]],5);h.line([[96,88],[112,78],[126,82]],5);
  h.dot(88,124,5,3.8);
  h.shape(h3Circ(88,141,9,11,10),'#7A1F2E',{w:4,ox:0,oy:0,sc:1,closed:1});
  if(!h.small)h.text('AWOOO!!',140,76,22,H3.ink,-8);
 },
 mutt(h){ // joke: BIG bold black spots
  const W='#FFFFFF',K='#141218';
  [[[122,168],[120,198]],[[150,170],[152,198]],[[190,170],[188,198]],[[212,164],[218,197]]].forEach((l,i)=>h.tube(l,10,i===2?K:W));
  h.line([[228,138],[244,126],[240,112],[254,100],[262,86]],5);
  h.shape([[110,138],[150,126],[210,128],[234,146],[228,170],[200,180],[130,180],[108,164]],W,{ox:0,oy:0,sc:1});
  h.shape(h3Circ(150,146,17,15,10),K,{noline:1,ox:0,oy:0});h.shape(h3Circ(202,148,15,17,10),K,{noline:1,ox:0,oy:0});h.shape(h3Circ(172,174,9,6,8),K,{noline:1,ox:0,oy:-2});
  h.shape([[104,74],[120,34],[134,86]],K);
  h.shape(h3Circ(88,112,44,38,14,.04),W,{ox:0,oy:0,sc:1});
  h.shape(h3Circ(108,100,19,18,11),K,{noline:1,ox:0,oy:0});h.shape(h3Circ(62,136,8,7,8),K,{noline:1,ox:0,oy:0});
  h.shape([[56,80],[36,88],[30,124],[44,130],[60,100]],K);
  h.eye(72,106,8,{lx:.4});h.eye(108,100,6.4,{lx:.4});
  h.dot(88,122,5.4,4);h.line([[70,132],[84,141],[100,138],[110,128]],4.2);
  h.shape([[84,139],[96,138],[94,150],[86,150]],'#FF6F9A',{w:3.2,ox:0,oy:0,sc:1,closed:1});
 }
};
function drawH(key,o={}){
  const D=DOGS[key],small=!!o.mini,nF=(o.still||small)?1:3,GY=199;
  const frame=k=>{
    const h=h3Kit(rng(hashS('h3'+key)*5+k*7717+3),small);h.small=small;
    if(!small){
      const gp=[];for(let x=6;x<300;x+=11)gp.push([x,GY+(Math.round(x/11)%2?-8:3)]);h.line(gp,4,H3.grass,1.6);
      const sp=h3Spiral(266,32,2,13,1.6,18,.3);h.line(sp,4,H3.sun,.7);
      for(let i=0;i<8;i++){const a=i/8*6.283+.2;h.line([[266+Math.cos(a)*19,32+Math.sin(a)*19],[266+Math.cos(a)*28,32+Math.sin(a)*28]],4,H3.sun,1.2)}
    }
    H3_DOGS[key](h);
    if(!small){h.text(D.name.toUpperCase(),14,key==='corgi'?224:30,22,H3.red,-4)}
    return h.acc.join('');
  };
  let frames='';for(let k=0;k<nF;k++)frames+=`<g class="h3f${k}">${frame(k)}</g>`;
  const vb=small?{dachs:'0 60 300 238',corgi:'0 0 260 206',golden:'50 30 230 182'}[key]||'20 22 240 190':'0 0 300 238';
  return `<svg class="sd sdH ${(o.still||small)?'':'h3live '}${o.cls||''}" viewBox="${vb}" role="img" aria-label="${D.name} the ${D.breed}, ugly hand-drawn style" ${o.attrs||''}>${frames}</svg>`;
}
