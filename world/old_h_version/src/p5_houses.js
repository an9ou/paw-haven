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
