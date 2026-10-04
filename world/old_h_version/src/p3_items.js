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
