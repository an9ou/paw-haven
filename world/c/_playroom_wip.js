/* ======================= v2.7 "Home & Pack": the Shelter Playroom (scene 'playroom') + props 'adoptboard' and 'tosstoy' =======================
   A cozy dog-café playroom. The layout is SR_ROOM (game/src/30_shelter.js): sign [370,10,260,64]; board [350,84,300,220] stays plain wallpaper
   (the game draws PawArt.prop('adoptboard') there); window [70,90,230,180] with the real sky; toy shelf [716,96,236,264]; toy basket
   [800,360,140,84] in <g data-hot="toys">; low café tables [214,392,120,48] (two water bowls) and [610,392,120,48] (the vase of the season's
   flowers); floor cushions at (170,560), (500,576), (850,562); floor band feet x 40..960, y 450..596 with nothing upright in it.
   Indoor treatment like the café (time tints, the window shows the weather). Night: the two sconces glow. Halloween: a smiling pumpkin on the
   toy shelf and paper bats in the window, nothing else. Every variant keeps the same base layout (time, weather and season extras run on the
   side and season streams, Halloween on its own). */
const PRF=430;// the floor line: wall above, boards below
const PR_BOARD=[350,84,300,220];
// soft wallpaper: wide pale stripes and a scatter of tiny bones and hearts, kept off the board, the window, the shelf and the sign
function prWall(k){
  k.add(`<rect width="1000" height="${PRF}" fill="#FBE6D3"/>`);
  let st='';for(let x=0;x<1000;x+=64)st+=`M${x+30} 0h24v364h-24z`;k.add(`<path d="${st}" fill="#F6DAC2" opacity=".55"/>`);
  const B=PR_BOARD,skip=(x,y)=>(x>B[0]-20&&x<B[0]+B[2]+20&&y>B[1]-16&&y<B[1]+B[3]+16)||(x>50&&x<322&&y>62&&y<296)||(x>700&&x<968&&y>84&&y<366)||(x>352&&x<648&&y<90)||(x>80&&x<214&&y>276);
  let bn='',ht='';
  for(let y=40,r=0;y<350;y+=48,r++)for(let x=r%2?22:54;x<1000;x+=64){if(skip(x,y))continue;const jx=x+k.J(3),jy=y+k.J(3);
    if((r+Math.round(x/64))%3===0)ht+=`M${R1(jx)} ${R1(jy+4)}c-6 -6 -3 -12 3 -8c6 -4 9 2 3 8l-3 3z`;
    else{const a=k.J(.5),c=Math.cos(a)*6,s=Math.sin(a)*6;bn+=`M${R1(jx-c)} ${R1(jy-s)}L${R1(jx+c)} ${R1(jy+s)}`;
      [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(([u,v])=>{bn+=`M${R1(jx+u*c-v*s*.4+.01)} ${R1(jy+u*s+v*c*.4)}h.01`})}}
  k.add(`<path d="${ht}" fill="#F4C7CD" opacity=".75"/><path d="${bn}" fill="none" stroke="#EDCDB0" stroke-width="3.2" stroke-linecap="round"/>`);
  // painted beadboard below a chair rail, then the skirting
  k.add(`<rect y="366" width="1000" height="${PRF-366}" fill="#D9E8D2"/>`);let bd='';for(let x=10;x<1000;x+=18)bd+=`M${R1(x+k.J(.6))} 372V${PRF-12}`;
  k.add(`<path d="${bd}" stroke="#B8CFB2" stroke-width="1.4"/>`);k.add(`<rect y="368" width="1000" height="8" fill="#B8CFB2" opacity=".45"/>`);
  k.shape(RC(-4,358,1008,10),C.wood,{w:1.9,one:1});
}
// honey floorboards in gentle perspective, a soft shadow along the skirting
function prFloor(k){
  k.fill([[-6,PRF],[1006,PRF],[1006,606],[-6,606]],'#EED3AC',{dx:0,dy:0});
  const rows=[];let y=PRF+10,h=13;while(y<600){rows.push(y);y+=h;h*=1.14}
  let d='',f='',g='';rows.forEach(yy=>{d+=`M-4 ${R1(yy+k.J(.8))}L1004 ${R1(yy+k.J(.8))}`});
  for(let i=0;i<rows.length;i++){const ya=rows[i],yb=i+1<rows.length?rows[i+1]:600,sp=(yb-ya)*11,off=((i*37)%10)/10*sp;let px=null;
    for(let x=off-sp;x<1000+sp;x+=sp*(.8+k.r()*.45)){const xa=x,xb=x+(x-500)*.05;d+=`M${R1(xa)} ${R1(ya)}L${R1(xb)} ${R1(yb)}`;
      if(px!==null&&k.r()<.2)f+=`M${R1(px)} ${R1(ya+1)}L${R1(xa)} ${R1(ya+1)}L${R1(xb)} ${R1(yb-1)}L${R1(px+(px-500)*.05)} ${R1(yb-1)}Z`;
      if(k.r()<.35){const gx=xa+12+k.r()*Math.max(8,sp*.5),gy=ya+(yb-ya)*(.35+k.r()*.3);g+=`M${R1(gx)} ${R1(gy)}h${R1(10+k.r()*18)}`}px=xa}}
  k.add(`<path d="${f}" fill="#E4C193" opacity=".55"/><path d="${g}" stroke="#D9B48E" stroke-width="1.1" stroke-linecap="round" fill="none"/><path d="${d}" stroke="#C99F74" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".9"/>`);
  k.add(`<rect y="${PRF}" width="1000" height="9" fill="${C.ink}" opacity=".07"/>`);
  k.shape(RC(-4,PRF-13,1008,14),'#F3E2C8',{w:2,one:1});
}
// a flat floor cushion seen from a little above: puffy top, piping, a tuft button and corner tassels (a curled dog at 0.7 fits on it)
function prCushion(k,cx,cy,col){const cd=dk(col),lt=mixH(col,'#FFFFFF',.42);
  k.add(`<ellipse cx="${cx+4}" cy="${cy+9}" rx="84" ry="15" fill="${C.ink}" opacity=".1"/>`);
  k.shape(E(cx,cy,82,23,20),col,{w:2.2,hatch:{side:.5,gap:4.5,col:cd,op:.45}});
  k.fill(E(cx-3,cy-5,60,12,18),lt,{dx:0,dy:0,amp:.8});
  k.add(`<ellipse cx="${cx}" cy="${cy-1}" rx="71" ry="17" fill="none" stroke="#FFFFFF" stroke-width="1.8" stroke-dasharray="5 5" opacity=".95"/>`);
  k.add(`<path d="M${cx-16} ${cy-3}q16 5 32 0M${cx-5} ${cy-12}q5 9 10 0" fill="none" stroke="${cd}" stroke-width="1.3" stroke-linecap="round"/><circle cx="${cx}" cy="${cy-4}" r="3.3" fill="${lt}" stroke="${C.ink}" stroke-width="1.3"/>`);
  [-1,1].forEach(sd=>{const tx=cx+sd*81,ty=cy+3;k.add(`<path d="M${tx} ${ty}l${sd*8} -4M${tx} ${ty}l${sd*9} 1M${tx} ${ty}l${sd*7} 6" stroke="${cd}" stroke-width="1.7" stroke-linecap="round"/><circle cx="${tx}" cy="${ty}" r="2.4" fill="${col}" stroke="${C.ink}" stroke-width="1.1"/>`)})}
// a scalloped valance over the window
function prValance(k,x,y,w,h,col){const n=7,p=[[x,y],[x+w,y]];for(let i=n;i>=0;i--){p.push([x+i*w/n,y+h-5]);if(i)p.push([x+(i-.5)*w/n,y+h+6])}
  k.shape(p,col,{w:2,hatch:{side:.7,gap:4,col:dk(col),op:.35}});let dt='';for(let i=0;i<n;i++)dt+=`<circle cx="${R1(x+(i+.5)*w/n)}" cy="${R1(y+h*.45)}" r="2.6" fill="#F28FA5" opacity=".8"/>`;k.add(dt);
  k.shape(RC(x-8,y-6,w+16,7),C.woodD,{w:1.6,one:1});k.add(`<circle cx="${x-10}" cy="${y-3}" r="4.4" fill="${C.wood}" stroke="${C.ink}" stroke-width="1.4"/><circle cx="${x+w+10}" cy="${y-3}" r="4.4" fill="${C.wood}" stroke="${C.ink}" stroke-width="1.4"/>`)}
// the painted shelter sign: a wooden plank on two strings, a paw and a heart
function prSign(k,x,y,w,h){
  k.line([[x+34,-4],[x+38,y+7]],1.3,C.ink,{op:.8});k.line([[x+w-34,-4],[x+w-38,y+7]],1.3,C.ink,{op:.8});
  k.add(`<rect x="${x+5}" y="${y+5}" width="${w}" height="${h}" rx="7" fill="${C.ink}" opacity=".09"/>`);
  k.shape([[x+5,y],[x+w-5,y],[x+w,y+6],[x+w,y+h-6],[x+w-5,y+h],[x+5,y+h],[x,y+h-6],[x,y+6]],C.wood,{w:2.4,hatch:{side:.84,gap:4.5,col:C.woodD,op:.45}});
  k.line([[x+8,y+h*.5],[x+w*.3,y+h*.5+1],[x+w-8,y+h*.5-1]],1,C.woodD,{op:.55});
  k.add(`<rect x="${x+8}" y="${y+7}" width="${w-16}" height="${h-14}" rx="6" fill="none" stroke="#FFFBF3" stroke-width="2" stroke-dasharray="7 5" opacity=".9"/><circle cx="${x+38}" cy="${y+7}" r="2.4" fill="${C.ink}"/><circle cx="${x+w-38}" cy="${y+7}" r="2.4" fill="${C.ink}"/>`);
  k.text('Paw Haven Shelter',x+w/2+1,y+h*.66,31,{rot:-1.5});
  const px=x+20,py=y+h*.52;k.add(`<g fill="${C.pink}" stroke="${C.ink}" stroke-width="1.1"><ellipse cx="${px}" cy="${py+3}" rx="5.6" ry="4.6"/><circle cx="${px-6}" cy="${py-4}" r="2.3"/><circle cx="${px-2}" cy="${py-8}" r="2.3"/><circle cx="${px+3}" cy="${py-8}" r="2.3"/><circle cx="${px+7}" cy="${py-4}" r="2.3"/></g>`);
  O.heart(k,x+w-20,y+h*.5,7.5)}
// the chalk menu by the window: "today: belly rubs"
function prChalk(k,x,y,w,h){
  k.line([[x+w*.28,y+2],[x+w/2,y-13],[x+w*.72,y+2]],1.2,C.ink,{op:.8});k.add(`<circle cx="${x+w/2}" cy="${y-13}" r="2.3" fill="${C.ink}"/>`);
  k.shape(RC(x,y,w,h),C.woodD,{w:2.1});k.shape(RC(x+7,y+7,w-14,h-14),'#56655F',{w:1.4,one:1});const ck='#FFFBF3';
  let sm='';for(let i=0;i<6;i++)sm+=`M${R1(x+12+k.r()*(w-40))} ${R1(y+12+k.r()*(h-26))}l${R1(8+k.r()*12)} ${R1(-2+k.r()*2)}`;k.add(`<path d="${sm}" stroke="#7F8F88" stroke-width="3" stroke-linecap="round" opacity=".45"/>`);
  k.text('today:',x+16,y+26,17,{col:ck,anchor:'start'});k.text('belly rubs',x+w/2,y+48,23,{col:'#FCE59A',rot:-2});
  k.text('(and ear scratches)',x+w/2,y+63,12,{col:'#C9EBDA',wt:600});
  k.add(`<path d="M${x+w-24} ${y+19}c-5 -5 -2.5 -10 2.5 -6.6c5 -3.4 7.5 1.6 2.5 6.6l-2.5 2.5z" fill="none" stroke="#FFC9D3" stroke-width="1.5"/>`)}
// a peg rail with three leads hanging on it
function prLeads(k,x,y,w){
  k.shape(RC(x,y,w,10),C.wood,{w:1.8,one:1});const cols=['#E57E83','#7FA8D8','#F3BE55'];
  cols.forEach((c,i)=>{const px=x+20+i*(w-40)/2,len=34+((i*13)%3)*6;
    const loop=smooth(dense([[px-6,y+7],[px-9,y+22],[px,y+30],[px+9,y+22],[px+6,y+7]],false,5).map(q=>[q[0]+k.J(.5),q[1]+k.J(.5)]),false),
      lead=smooth(dense([[px,y+30],[px+k.J(2),y+30+len*.5],[px+k.J(3),y+30+len]],false,6),false);
    k.add(`<path d="${loop}${lead.replace('M','M')}" fill="none" stroke="${C.ink}" stroke-width="5.4" stroke-linecap="round"/><path d="${loop}${lead}" fill="none" stroke="${c}" stroke-width="3.1" stroke-linecap="round"/>`);
    k.add(`<rect x="${R1(px-3)}" y="${R1(y+28+len)}" width="6" height="9" rx="2" fill="#C9D3DD" stroke="${C.ink}" stroke-width="1.2"/><circle cx="${R1(px)}" cy="${y+5}" r="3.4" fill="${C.woodD}" stroke="${C.ink}" stroke-width="1.2"/>`)})}
// a little wall sconce (glows after dark)
function prSconce(k,x,y){k.shape(RC(x-6,y+4,12,22),C.woodD,{w:1.5,one:1});k.line([[x,y+14],[x+k.J(.5),y+1]],2.4,C.ink);
  const sh=[[x-8,y+2],[x+8,y+2],[x+15,y-20],[x-15,y-20]];k.shape(sh,'#FCE59A',{w:1.8,hatch:{side:.6,gap:3.5,col:dk('#FCE59A'),op:.4}});
  k.add(`<path d="M${x-12} ${y-14}h24" stroke="#F28FA5" stroke-width="1.6" stroke-dasharray="3 3"/>`);if(k.env.lit)k.lamps.push({x,y:y-9,s:.8,glass:sh})}
// a crude crayon dog (the joke: the photos are drawn by the dogs' new families)
function prCrayonDog(k,cx,cy,s,col,o={}){const f=o.flip?-1:1,X=v=>R1(cx+v*s*f),Y=v=>R1(cy+v*s);
  const body=`M${X(-14)} ${Y(2)}Q${X(-15)} ${Y(-9)} ${X(-2)} ${Y(-8)}Q${X(12)} ${Y(-10)} ${X(13)} ${Y(-1)}Q${X(13)} ${Y(8)} ${X(0)} ${Y(7)}Q${X(-14)} ${Y(9)} ${X(-14)} ${Y(2)}Z`;
  const sc=mixH(col,'#5B3D32',.25);let scr='';for(let i=0;i<5;i++)scr+=`M${X(-11+i*5)} ${Y(5)}L${X(-8+i*5)} ${Y(-6)}`;
  k.add(`<path d="${body}" fill="${col}" transform="translate(${R1(1.2*s)} ${R1(.8*s)})"/><path d="${scr}" stroke="${sc}" stroke-width="${R1(1.4*s)}" stroke-linecap="round" opacity=".6"/>`);
  k.add(`<g fill="none" stroke="#2a2420" stroke-width="${R1(Math.max(1.3,1.6*s))}" stroke-linecap="round" stroke-linejoin="round"><path d="${body}"/>`+
    `<path d="M${X(-10)} ${Y(6)}l${R1(-1*s*f)} ${R1(7*s)}M${X(-4)} ${Y(7)}l0 ${R1(7*s)}M${X(5)} ${Y(7)}l${R1(1*s*f)} ${R1(7*s)}M${X(10)} ${Y(5)}l${R1(2*s*f)} ${R1(7*s)}M${X(-14)} ${Y(-1)}q${R1(-5*s*f)} ${R1(-3*s)} ${R1(-6*s*f)} ${R1(-9*s)}"/>`+
    `<circle cx="${X(15)}" cy="${Y(-11)}" r="${R1(7*s)}" fill="${col}"/><path d="M${X(11)} ${Y(-16)}l${R1(-2*s*f)} ${R1(-7*s)}l${R1(5*s*f)} ${R1(4*s)}M${X(18)} ${Y(-17)}l${R1(3*s*f)} ${R1(-6*s)}l${R1(1*s*f)} ${R1(7*s)}"/>`+
    `<path d="M${X(14)} ${Y(-8)}q${R1(3*s*f)} ${R1(2.6*s)} ${R1(6*s*f)} 0"/></g><circle cx="${X(17)}" cy="${Y(-12)}" r="${R1(1.3*s)}" fill="#2a2420"/><circle cx="${X(22)}" cy="${Y(-10)}" r="${R1(1.6*s)}" fill="#2a2420"/>`)}
// a taped polaroid of an adopted dog, with a caption
function prPhoto(k,x,y,w,h,rot,bg,dog,cap,flip){k.add(`<g transform="rotate(${rot} ${R1(x+w/2)} ${R1(y+h/2)})">`);
  k.add(`<rect x="${x+3}" y="${y+4}" width="${w}" height="${h}" fill="${C.ink}" opacity=".1"/>`);k.shape(RC(x,y,w,h),'#FFFFFF',{w:1.6,one:1});
  k.add(`<rect x="${x+4}" y="${y+4}" width="${w-8}" height="${h-17}" fill="${bg}"/>`);k.pen(RC(x+4,y+4,w-8,h-17),true,{w:1,one:1,amp:.4});
  prCrayonDog(k,x+w/2-4,y+(h-13)/2+3,(w-8)/42,dog,{flip});
  if(cap)k.text(cap,x+w/2,y+h-4,11,{wt:700});k.add('</g>');
  k.add(`<g transform="rotate(${rot-4} ${R1(x+w/2)} ${y})"><rect x="${R1(x+w/2-10)}" y="${y-5}" width="20" height="9" fill="#F7B9C6" fill-opacity=".8"/></g>`)}
// a low café table: round top seen from a little above, two front legs and one at the back
function prTable(k,x,y,w,h){const cx=x+w/2;
  k.add(`<ellipse cx="${cx}" cy="${y+h-1}" rx="${w/2+6}" ry="4.5" fill="${C.ink}" opacity=".1"/>`);
  k.line([[cx+2,y+14],[cx+3,y+h-7]],2.6,C.ink,{op:.5});
  k.line([[x+16,y+13],[x+10,y+h]],3.2,C.ink);k.line([[x+w-16,y+13],[x+w-10,y+h]],3.2,C.ink);
  k.shape([[x,y+7],[x+w,y+7],[x+w-2,y+15],[x+2,y+15]],'#E9C9A2',{w:1.8,one:1});
  k.shape(E(cx,y+7,w/2,8,18),'#FFFBF3',{w:2})}
function prBowl(k,x,gy,col,lab){k.shape([[x-19,gy],[x+19,gy],[x+15,gy-13],[x-15,gy-13]],col,{w:1.7,one:1,hatch:{side:.6,gap:3.5,col:dk(col),op:.4}});
  k.shape(E(x,gy-13,15.5,3.6,12),C.water,{w:1.3,one:1});k.add(`<path d="M${x-8} ${gy-13.6}h6" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>`);
  if(lab)k.text(lab,x,gy-3,9.5);else k.add(`<g fill="#FFFFFF" opacity=".85"><ellipse cx="${x}" cy="${gy-4}" rx="3" ry="2.4"/><circle cx="${x-3.6}" cy="${gy-7.4}" r="1.3"/><circle cx="${x}" cy="${gy-8.8}" r="1.3"/><circle cx="${x+3.6}" cy="${gy-7.4}" r="1.3"/></g>`)}
// toys (shared by the shelf, the basket and the tosstoy prop)
function prBall(k,cx,cy,r,col,band){k.shape(E(cx,cy,r,r,14),col,{w:Math.min(2,r*.13+.6),hatch:{side:.55,gap:3.2,col:dk(col),op:.45}});
  if(band){const d=`M${R1(cx-r*.92)} ${R1(cy-r*.28)}Q${R1(cx)} ${R1(cy+r*.42)} ${R1(cx+r*.92)} ${R1(cy-r*.28)}`;k.add(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${R1(r*.42)}" stroke-linecap="round" opacity=".9"/><path d="${d}" fill="none" stroke="${band}" stroke-width="${R1(r*.3)}" stroke-linecap="round"/>`)}
  k.add(`<ellipse cx="${R1(cx-r*.38)}" cy="${R1(cy-r*.48)}" rx="${R1(r*.26)}" ry="${R1(r*.15)}" transform="rotate(-30 ${R1(cx-r*.38)} ${R1(cy-r*.48)})" fill="#FFFFFF" opacity=".75"/>`)}
function prTennis(k,cx,cy,r){k.shape(E(cx,cy,r,r,14),'#D9EA7A',{w:1.6,hatch:{side:.55,gap:3,col:'#A9BE4E',op:.5}});k.add(`<path d="M${R1(cx-r*.7)} ${R1(cy-r*.7)}Q${R1(cx+r*.1)} ${R1(cy)} ${R1(cx-r*.7)} ${R1(cy+r*.7)}M${R1(cx+r*.7)} ${R1(cy-r*.7)}Q${R1(cx-r*.1)} ${R1(cy)} ${R1(cx+r*.7)} ${R1(cy+r*.7)}" fill="none" stroke="#FFFFFF" stroke-width="${R1(r*.16)}" stroke-linecap="round"/>`)}
const BONEP=[[-30,-6],[30,-6],[36,-15],[46,-10],[42,0],[46,10],[36,15],[30,6],[-30,6],[-36,15],[-46,10],[-42,0],[-46,-10],[-36,-15]];
function prBone(k,cx,cy,len,rot,col){const s=len/92,c=Math.cos(rot),n=Math.sin(rot),P=BONEP.map(([u,v])=>[cx+(u*c-v*n)*s,cy+(u*n+v*c)*s]);
  k.shape(P,col,{w:Math.min(2,1+s),hatch:{side:.6,gap:3.5,col:dk(col),op:.45}});
  const st=[[-27,0],[27,0]].map(([u,v])=>[cx+(u*c-v*n)*s,cy+(u*n+v*c)*s]);k.add(`<path d="M${R1(st[0][0])} ${R1(st[0][1])}L${R1(st[1][0])} ${R1(st[1][1])}" stroke="${dk(col)}" stroke-width="${R1(Math.max(1,1.6*s))}" stroke-dasharray="${R1(4*s)} ${R1(3.5*s)}" stroke-linecap="round"/>`)}
function prRing(k,cx,cy,rx,ry,t,c1,c2){const d=smooth(E(cx,cy,rx,ry,16).map(q=>[q[0]+k.J(.4),q[1]+k.J(.4)]),true);
  k.add(`<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="${R1(t+3.2)}"/><path d="${d}" fill="none" stroke="${c1}" stroke-width="${R1(t)}"/><path d="${d}" fill="none" stroke="${c2}" stroke-width="${R1(t*.7)}" stroke-dasharray="${R1(t*.55)} ${R1(t*.55)}"/><path d="${d}" fill="none" stroke="${C.ink}" stroke-width=".8" stroke-dasharray="${R1(t*.55)} ${R1(t*.55)}" opacity=".35"/>`)}
function prDuck(k,x,gy,s){k.shape([[x-16*s,gy],[x-19*s,gy-12*s],[x-6*s,gy-16*s],[x+14*s,gy-14*s],[x+17*s,gy-4*s],[x+12*s,gy]],'#FCE59A',{w:1.7,hatch:{side:.6,gap:3.5,col:'#E2C46E',op:.5}});
  k.shape(E(x+7*s,gy-24*s,9*s,9*s,12),'#FCE59A',{w:1.6,one:1});k.add(`<path d="M${R1(x+15*s)} ${R1(gy-25*s)}l${R1(8*s)} ${R1(2*s)} ${R1(-7*s)} ${R1(4*s)}z" fill="${C.orange}" stroke="${C.ink}" stroke-width="1.2" stroke-linejoin="round"/><circle cx="${R1(x+9*s)}" cy="${R1(gy-27*s)}" r="${R1(1.5*s)}" fill="${C.ink}"/><path d="M${R1(x-8*s)} ${R1(gy-9*s)}q${R1(8*s)} ${R1(4*s)} ${R1(14*s)} ${R1(-3*s)}" fill="none" stroke="${C.ink}" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="${R1(x+3*s)}" cy="${R1(gy-21*s)}" rx="${R1(2.4*s)}" ry="${R1(1.5*s)}" fill="${C.pink}" opacity=".7"/>`)}
// the toy shelf against the right wall
function prShelf(k,x,y,w,h){const bx=x+8,bw=w-16,lv=[y+82,y+168,y+252];
  k.add(`<rect x="${x+5}" y="${y+6}" width="${w}" height="${h}" fill="${C.ink}" opacity=".08"/>`);
  k.shape(RC(bx,y+8,bw,h-16),'#F2D3B8',{w:1.2,one:1,lop:.6,hatch:{side:.7,gap:5,col:'#D9B396',op:.35}});
  k.shape(RC(x,y,10,h),C.wood,{w:1.9,one:1});k.shape(RC(x+w-10,y,10,h),C.wood,{w:1.9,one:1});
  k.shape(RC(x-6,y-6,w+12,13),C.woodD,{w:2,one:1});
  lv.forEach((ly,i)=>k.shape(RC(x+4,ly,w-8,i===2?12:10),i===2?C.woodD:C.wood,{w:1.8,one:1}));
  // top shelf: a jar of dog biscuits, two balls, a little spider plant
  {const jx=x+44,gy=lv[0];k.shape(RC(jx-22,gy-56,44,56),C.glass,{w:1.7});k.shape(RC(jx-25,gy-64,50,10),'#F8C08A',{w:1.5,one:1});
   [[-11,-12,.3],[6,-10,-.4],[-4,-24,.1],[11,-28,.5],[-12,-36,-.3]].forEach(([dx,dy,a])=>prBone(k,jx+dx,gy+dy,20,a,'#F3D9A8'));
   k.shape(RC(jx-17,gy-50,34,13),'#FFFBF3',{w:1.1,one:1});k.text('biscuits',jx,gy-40,11.5);
   k.add(`<path d="M${jx-16} ${gy-8}l6 -30" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`);
   prBall(k,x+100,gy-15,14,'#F28F8F','#FCE59A');prTennis(k,x+130,gy-11,11);
   plant(k,x+w-40,gy,.62,C.mint)}
  // middle shelf: a plush bone, a plush duck, two rope rings (a gap on the right for the Halloween pumpkin)
  {const gy=lv[1];prBone(k,x+52,gy-14,60,-.32,'#FFF3DA');prDuck(k,x+108,gy,.95);
   prRing(k,x+156,gy-6,20,6,6,'#E57E83','#FFFBF3');prRing(k,x+156,gy-14,18,5.4,6,'#7FA8D8','#FFFBF3')}
  // bottom shelf: folded blankets, a knotted tug rope, a frisbee on its edge
  {const gy=lv[2];[['#C9EBDA',0],['#FFC9D3',13],['#DCCBF2',26]].forEach(([c,dy])=>{k.shape(RC(x+22+(dy%2?2:0),gy-14-dy,62,13),c,{w:1.6,one:1,hatch:{side:.7,gap:3.5,col:dk(c),op:.4}});k.line([[x+30,gy-8-dy],[x+76,gy-8-dy]],1,dk(c),{op:.8})});
   const tr=[[x+98,gy-4],[x+110,gy-22],[x+128,gy-12],[x+146,gy-30]];k.add(`<path d="${smooth(tr,false)}" fill="none" stroke="${C.ink}" stroke-width="8.4" stroke-linecap="round"/><path d="${smooth(tr,false)}" fill="none" stroke="#F3D9A8" stroke-width="5.4" stroke-linecap="round"/><path d="${smooth(tr,false)}" fill="none" stroke="#E57E83" stroke-width="5.4" stroke-dasharray="4 4"/>`);
   [tr[0],tr[3]].forEach(q=>k.add(`<circle cx="${R1(q[0])}" cy="${R1(q[1])}" r="6.4" fill="#F3D9A8" stroke="${C.ink}" stroke-width="1.5"/><path d="M${R1(q[0]-3)} ${R1(q[1]-2)}l6 4" stroke="#C9A956" stroke-width="1.2"/>`));
   k.shape(E(x+w-42,gy-24,9,24,14),'#F7B6C8',{w:1.8,hatch:{side:.55,gap:3.5,col:'#D98FA6',op:.5}});k.add(`<ellipse cx="${x+w-42}" cy="${gy-24}" rx="4.4" ry="16" fill="none" stroke="#FFFFFF" stroke-width="1.6" opacity=".8"/>`)}
  // a paper tag on the side
  k.line([[x+w-6,y+30],[x+w+4,y+44]],1,C.ink,{op:.7});k.add(`<g transform="rotate(10 ${x+w+12} ${y+56})">`);k.shape([[x+w,y+46],[x+w+26,y+46],[x+w+26,y+66],[x+w,y+66],[x+w-6,y+56]],'#FFD8E0',{w:1.3,one:1});k.text('share!',x+w+13,y+60,10.5);k.add('</g>')}
// the toy basket on the floor by the shelf (the game binds it: tap = toss a toy)
function prBasket(k,x,y,w,h){const top=y+30,bot=y+h-1;
  return k.cap(()=>{k.add(`<ellipse cx="${x+w/2+4}" cy="${bot}" rx="${w/2+4}" ry="6" fill="${C.ink}" opacity=".12"/>`);
   prBall(k,x+30,top-8,15,'#B9D3F2','#FFFBF3');prBone(k,x+70,top-14,56,-.55,'#FFF3DA');prRing(k,x+108,top-10,16,13,5.4,'#F3BE55','#E57E83');prDuck(k,x+80,top+4,.7);
   const body=[[x+4,top],[x+w-4,top],[x+w-14,bot],[x+14,bot]];k.shape(body,'#E3BC86',{w:2.2,hatch:{side:.7,gap:4.5,col:'#C2925E',op:.45}});
   let wv='';for(let r=0;r<4;r++){const yy=top+8+r*(bot-top-10)/3.4,ins=(yy-top)/(bot-top)*10;let px=x+6+ins;wv+=`M${R1(px)} ${R1(yy)}`;for(let xx=px;xx<x+w-6-ins;xx+=12)wv+=`q3 ${r%2?-3:3} 6 0q3 ${r%2?3:-3} 6 0`}
   let sk='';for(let xx=x+18;xx<x+w-12;xx+=14){const t=(xx-x)/w;sk+=`M${R1(xx)} ${top+4}L${R1(xx+(t-.5)*12)} ${bot-3}`}
   k.add(`<path d="${sk}" stroke="#B88A58" stroke-width="1.2" opacity=".7"/><path d="${wv}" fill="none" stroke="#B88A58" stroke-width="1.6" stroke-linecap="round"/>`);
   k.shape(RC(x-1,top-5,w+2,10),'#D4A574',{w:2,one:1});k.add(`<path d="M${x+6} ${top}h${w-12}" stroke="#F3D9A8" stroke-width="1.6" stroke-dasharray="5 4"/>`);
   [x+2,x+w-2].forEach(hx=>k.add(`<path d="M${hx} ${top+2}q${hx<x+w/2?-9:9} 6 0 14" fill="none" stroke="${C.ink}" stroke-width="3.6" stroke-linecap="round"/><path d="M${hx} ${top+2}q${hx<x+w/2?-9:9} 6 0 14" fill="none" stroke="#D4A574" stroke-width="1.8" stroke-linecap="round"/>`));
   k.shape(RC(x+w/2-24,top+18,48,17),'#FFFBF3',{w:1.2,one:1});k.text('toys!',x+w/2,top+31,14)})}
// the season's flowers in the vase (sunflowers in summer; dog-safe picks: snapdragons, maple twigs and asters, camellias)
function prFlowers(k,x,y){const so=k.env.season;
  const stem=(x1,y1,col='#7DAE66')=>k.line([[x,y+2],[(x+x1)/2+k.J(2),(y+y1)/2],[x1,y1]],1.7,col);
  if(so==='spring'){[[-14,326,'#F7B6C8'],[2,316,'#FFF1F4'],[16,330,'#F8C08A']].forEach(([dx,ty,c])=>{stem(x+dx,ty+20);for(let i=0;i<6;i++){const py=ty+i*6;k.shape(E(x+dx+(i%2?3:-3),py,4.4,3.6,8),c,{w:1,one:1})}});
    k.shape(E(x-10,y-8,3,8,8,.6),'#9CCB80',{w:1.1,one:1});k.shape(E(x+11,y-10,3,8,8,-.6),'#9CCB80',{w:1.1,one:1})}
  else if(so==='autumn'){[[-18,330],[14,322]].forEach(([dx,ty],i)=>{stem(x+dx,ty,C.trunkD);mapleAt(k,x+dx,ty,7,i?.4:-.4,AU[i?3:1][0]);mapleAt(k,x+dx*.6,ty+16,5.5,i?.9:-.9,AU[i?0:2][0])});
    [[-4,318],[4,334]].forEach(([dx,ty])=>{stem(x+dx,ty);flowerDot(k,x+dx,ty,3.4,'#C7AEEC');k.add(`<circle cx="${x+dx}" cy="${ty}" r="1.8" fill="#F7C65E"/>`)})}
  else if(so==='winter'){[[-14,330,'#FFFFFF'],[3,318,'#F7B6C8'],[17,332,'#FFFFFF']].forEach(([dx,ty,c])=>{stem(x+dx,ty,'#5F8A62');k.shape(E(x+dx-7,ty+10,6,3,8,.5),'#6FA483',{w:1,one:1});
      for(let i=0;i<6;i++){const a=i/6*Math.PI*2;k.add(`<circle cx="${R1(x+dx+Math.cos(a)*4.6)}" cy="${R1(ty+Math.sin(a)*4.6)}" r="4" fill="${c}" stroke="${C.ink}" stroke-width=".9"/>`)}k.add(`<circle cx="${x+dx}" cy="${ty}" r="2.6" fill="#F7D24E" stroke="${C.ink}" stroke-width=".8"/>`)})}
  else{[[-16,334],[3,318],[19,338]].forEach(([dx,ty])=>{stem(x+dx,ty);k.shape(E(x+dx*.5-6,(y+ty)/2+6,7,3.4,8,.6),'#9CCB80',{w:1,one:1});
      for(let i=0;i<10;i++){const a=i/10*Math.PI*2;k.add(`<ellipse cx="${R1(x+dx+Math.cos(a)*8)}" cy="${R1(ty+Math.sin(a)*8)}" rx="4.6" ry="2.4" transform="rotate(${R1(a*180/Math.PI)} ${R1(x+dx+Math.cos(a)*8)} ${R1(ty+Math.sin(a)*8)})" fill="#F7D24E" stroke="${C.ink}" stroke-width=".9"/>`)}
      k.add(`<circle cx="${x+dx}" cy="${ty}" r="5.4" fill="#9A6B45" stroke="${C.ink}" stroke-width="1.1"/><circle cx="${x+dx-1.6}" cy="${ty-1.4}" r="1" fill="#5B3D32"/><circle cx="${x+dx+1.8}" cy="${ty+1}" r="1" fill="#5B3D32"/>`)})}}
function sqPlayroom(k){
  prWall(k);
  O.buntingL?0:0;
  buntingL(k,-6,372,6,22,[C.red,C.yellow,C.mint,C.lav,C.blue,'#FFB3C7']);buntingL(k,628,1006,6,22,['#FFB3C7',C.blue,C.lav,C.mint,C.yellow,C.red]);
  prSign(k,370,10,260,64);
  // the window with the real sky, a valance, a spider plant on the sill
  winIn(k,70,90,230,180,{curtain:'#F7C5CF'});prValance(k,62,78,246,20,'#FCE59A');plant(k,276,275,.4,C.mint);
  k.hw(()=>[[124,20,.7],[188,34,.6],[248,16,.66]].forEach(([x,len,s])=>{k.line([[x,100],[x+k.J(.6),100+len]],1,C.ink,{op:.75});hwBat(k,x,100+len+9*s,s,{col:HWP})}));// v2.7 Halloween: paper bats in the window
  prChalk(k,88,292,116,74);prLeads(k,224,298,104);
  prSconce(k,328,150);prSconce(k,684,150);
  prPhoto(k,660,190,46,54,-4,'#E9F3FB','#F3BE55','adopted!');prPhoto(k,664,256,44,52,3,'#FDE7EC','#C9A07A','adopted!',1);
  // the toy shelf, a smiling pumpkin on it at Halloween
  prShelf(k,716,96,236,264);k.hw(()=>hwJack(k,920,264,1.25));
  // potted plants in the corners, off the floor band
  plant(k,22,PRF+2,.8,C.roof);plant(k,980,PRF+2,.8,'#B9D3F2');
  // the low café tables: water bowls on one, the vase and a little framed photo on the other
  {const [t1,t2]=[[214,392,120,48],[610,392,120,48]];prTable(k,...t1);prBowl(k,t1[0]+36,t1[1]+11,'#B9D3F2','H2O');prBowl(k,t1[0]+84,t1[1]+11,'#F7C5CF');
   prTable(k,...t2);const vx=t2[0]+38,vy=t2[1]+11;k.side(()=>prFlowers(k,vx,vy-30));
   k.shape([[vx-10,vy],[vx+10,vy],[vx+13,vy-14],[vx+7,vy-26],[vx+8,vy-31],[vx-8,vy-31],[vx-7,vy-26],[vx-13,vy-14]],'#C9EBDA',{w:1.7,hatch:{side:.6,gap:3.5,col:'#9CC9B2',op:.5}});
   k.add(`<path d="M${vx-9} ${vy-12}q9 4 18 0" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-dasharray="3 3"/>`);
   const fx=t2[0]+86,fy=t2[1]-30;k.line([[fx+10,fy+30],[fx+16,fy+40]],1.6,C.ink);k.shape(RC(fx-2,fy,32,40),C.woodD,{w:1.7,one:1});k.add(`<rect x="${fx+3}" y="${fy+5}" width="22" height="30" fill="#FFF4D6"/>`);prCrayonDog(k,fx+11,fy+22,.5,'#EFEFEF');O.heart(k,fx+22,fy+10,3)}
  // the floor: boards, two flat rugs, three cushions (dogs nap on them)
  prFloor(k);
  k.shape(E(520,522,222,44,22),'#F7C5CF',{w:2,hatch:{side:.62,gap:5,col:'#E39AAE',op:.3}});k.add(`<ellipse cx="520" cy="522" rx="196" ry="34" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-dasharray="7 6"/><ellipse cx="520" cy="522" rx="150" ry="24" fill="none" stroke="#EFA9BB" stroke-width="1.6"/>`);
  k.shape(E(176,554,124,32,18),C.mint,{w:2,hatch:{side:.62,gap:5,col:'#A9D4BE',op:.35}});k.add(`<ellipse cx="176" cy="554" rx="104" ry="24" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-dasharray="6 6"/>`);
  prCushion(k,170,560,C.lav);prCushion(k,500,576,'#FCE59A');prCushion(k,850,562,C.blue);
  // the toy basket (tap: toss a toy)
  {const B=[800,360,140,84];hot(k,'data-hot','toys','Toy basket',RC(B[0]-6,B[1]-8,B[2]+12,B[3]+12),prBasket(k,...B))}
  O.sparkle(k,40,90,7);O.sparkle(k,968,74,6);O.note(k,330,250,10);
  O.tape(k,6,18,90,-26,'#F7B9C6');O.tape(k,920,576,80,-24,'#B9D4F3');
}
/* ---------- props: the "Adopt me!" board and the toy that gets tossed ---------- */
// poster portrait boxes in the board's viewBox (300 x 220), the same as SR_SLOTS in 30_shelter.js: [x, y, w, h] for slot 0..7 (2 rows of 4)
const PR_SLOTS=[0,1,2,3,4,5,6,7].map(i=>[20+(i%4)*70,58+Math.floor(i/4)*80,54,50]);
const PR_PAPER=['#FFFFFF','#FFF4D6','#FDE7EC','#E8F2FB'];
function prAdoptBoard(k,n,more){
  k.add(`<rect x="8" y="11" width="292" height="208" rx="5" fill="${C.ink}" opacity=".1"/>`);
  k.shape(RC(3,5,293,209),'#C9976A',{w:2.4,hatch:{side:.86,gap:4.5,col:'#A97E5A',op:.45}});
  k.shape(RC(13,15,273,189),'#E3BC8C',{w:1.4,one:1,lop:.8});
  let sp='';for(let i=0;i<110;i++){const x=16+k.r()*267,y=18+k.r()*183;sp+=`<circle cx="${R1(x)}" cy="${R1(y)}" r="${R1(.6+k.r()*1)}" fill="${k.r()<.6?'#C99A68':'#F2D5AE'}"/>`}k.add(`<g opacity=".8">${sp}</g>`);
  // the hand-lettered header on a paper banner
  k.add(`<g transform="rotate(-1.5 150 27)">`);k.shape([[52,7],[248,7],[240,27],[248,47],[52,47],[60,27]],'#FFFBF3',{w:1.9});
  k.text('Adopt me!',150,39,31);O.heart(k,80,26,6.5);O.heart(k,220,27,6.5,'#F7B6C8');k.add('</g>');
  for(let i=0;i<n;i++){const [sx,sy,sw,sh]=PR_SLOTS[i],px=sx-5,py=sy-6,pw=sw+10,ph=sh+23,cx=sx+sw/2;
    k.add(`<rect x="${px+2}" y="${py+3}" width="${pw}" height="${ph}" fill="${C.ink}" opacity=".12"/>`);
    k.shape(RC(px,py,pw,ph),PR_PAPER[i%4],{w:1.5,one:1});
    k.add(`<rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" fill="#FFFDF8"/>`);k.pen(RC(sx,sy,sw,sh),true,{w:1.2,one:1,amp:.35});
    k.line([[sx+5,sy+sh+8],[sx+sw-14,sy+sh+8]],1.3,C.graph,{amp:.4});k.line([[sx+5,sy+sh+14],[sx+sw-24,sy+sh+14]],1.1,C.graph,{amp:.4,op:.8});
    k.add(`<g fill="${C.pink}" opacity=".85"><ellipse cx="${sx+sw-5}" cy="${sy+sh+12}" rx="3" ry="2.5"/><circle cx="${sx+sw-8.4}" cy="${sy+sh+8.4}" r="1.2"/><circle cx="${sx+sw-5}" cy="${sy+sh+7.2}" r="1.2"/><circle cx="${sx+sw-1.6}" cy="${sy+sh+8.4}" r="1.2"/></g>`);
    O.heart(k,cx,py+1,4.4,'#E86A7C');k.add(`<circle cx="${cx-1.2}" cy="${py-.4}" r="1" fill="#FFFFFF" opacity=".8"/>`)}
  if(!n){k.text('everyone is home!',150,128,25,{rot:-3});O.heart(k,150,156,9)}
  if(more>0){const t='+'+more;k.line([[258,4],[268,14]],1.1,C.ink,{op:.8});k.add(`<g transform="rotate(8 272 30)">`);
    k.shape([[256,16],[292,16],[292,44],[256,44],[249,30]],'#FFD8E0',{w:1.5,one:1});k.add(`<circle cx="255" cy="30" r="2" fill="#FFFBF3" stroke="${C.ink}" stroke-width="1"/>`);k.text(t,274,37,t.length>2?17:20);k.add('</g>')}
}
function prTossToy(k,kind){
  if(kind==='bone')prBone(k,30,31,54,-.38,'#FFF3DA');
  else if(kind==='ring'){prRing(k,30,30,19,19,8,'#F3BE55','#E57E83');k.add(`<path d="M17 20q6 -8 15 -8" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" opacity=".7"/>`)}
  else{prBall(k,30,30,20,'#F28F8F','#FCE59A');k.add(`<circle cx="40" cy="20" r="2.2" fill="${C.ink}" opacity=".7"/>`)}
}
const cacheP={};
function propC(key,name,label,W,H,draw){if(!cacheP[key]){const k=kit(hashS('pwc-prop-'+name));k.env=DEF_ENV;draw(k);
    cacheP[key]=`<svg xmlns="http://www.w3.org/2000/svg" class="pa-wc-prop pa-wc-${name}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">${k.defs.length?`<defs>${k.defs.join('')}</defs>`:''}${k.out.join('')}</svg>`}
  return freshC(cacheP[key])}
