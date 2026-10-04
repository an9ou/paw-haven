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
