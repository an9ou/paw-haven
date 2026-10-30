/* Byte-identical check for the dog art module.
   Loads dogs/pawart_dogs.js (working tree) and the same file from a git ref (default v2184-base = main at v2.18.3, else origin/v2184-base)
   in node vm sandboxes and compares PawArt.dog / PawArt.dogHead for every breed x pose x existing outfit
   x age x sparkle, plus mixes, expecting, coats and facing left.
   Then it sweeps the v2.8 outfits and the v2.11.1 costumes (NEW_OUTS) on the working tree: every breed x pose x age x facing x sparkle renders with no
   NaN/undefined, and each outfit's own strokes touch the dog and stay within a margin of its body and head.
   Usage: node dogs/check_identical.js [ref]   (env SWEEP_ONLY=1: the sweep alone, SWEEP_EXT=1: print the closest calls, SKIP=gsd: leave a redrawn breed out, SKIP=collie:howl: one breed's adult renders in one pose, SKIP_MIX=1: no mix body renders, SWEEP_WET=1: the sweep draws every dog wet (rainy days), INK=1: the ink only, see below)
     (prints ALL OK on success, exits 1 on any difference)
   The breeds are split over one child process per CPU core (env SHARD=i/n runs one share). */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process'),os=require('os');
if(!process.env.SHARD){// parent: fan out, then sum up
  const n=Math.max(1,Math.min(10,os.cpus().length)),kids=[];let done=0,tot=0,dif=0,sw=0,swBad=0,bad=[],refName='';
  for(let i=0;i<n;i++){const c=cp.fork(__filename,process.argv.slice(2),{env:Object.assign({},process.env,{SHARD:i+'/'+n}),silent:true});let out='';c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>process.stderr.write(d));
    c.on('exit',code=>{const m=out.match(/vs (\S+): (\d+) renders compared, (\d+) differ/),w=out.match(/sweep: (\d+) renders, (\d+) bad/);if(!m||!w){bad.push('shard '+i+' crashed (exit '+code+')')}else{refName=m[1];tot+=+m[2];dif+=+m[3];sw+=+w[1];swBad+=+w[2];if(+m[3]||+w[2])bad.push(...out.split('\n').filter(l=>l&&!/renders compared|sweep: |ALL OK/.test(l)))}
      if(++done===n){console.log(`check_identical vs ${refName}: ${tot} renders compared over ${n} shards, ${dif} differ`);console.log(`outfit sweep (v2.8, v2.11.1): ${sw} renders, ${swBad} bad`);if(bad.length||dif||swBad){console.log(bad.slice(0,30).join('\n'));process.exit(1)}console.log('ALL OK')}})}
  return;
}
const ref=process.argv[2]||(()=>{try{cp.execSync('git rev-parse --verify -q v2184-base',{cwd:path.join(__dirname,'..'),stdio:'ignore'});return'v2184-base'}catch(e){return'origin/v2184-base'}})();
const load=src=>{const sb={window:{}};vm.createContext(sb);vm.runInContext(src,sb);return sb.window.PawArt};
const SRC=fs.readFileSync(path.join(__dirname,'pawart_dogs.js'),'utf8'),NEW=load(SRC);
const OLD=load(cp.execSync(`git show ${ref}:dogs/pawart_dogs.js`,{cwd:path.join(__dirname,'..'),encoding:'utf8',maxBuffer:64<<20}));
const K=OLD.DOGS.map(d=>d.key);
const POSES=['idle','happy','pet','eat','sleep','walk','jump','sit','sad','dirty','crouch','shake','cold','hot','dig','beg','squat','leglift','paw','down','rollover','playdead','speak','dance','bow','scratch','sniff','yawn','howl'];
// the outfits that exist in the reference build (anything else is new and is not compared)
const OUTS=[['head','Party Hat'],['head','Flower Crown'],['head','Acorn Cap'],['head','Rain Hat'],['head','Pom-pom Beanie'],['eyes','Heart Sunglasses'],['eyes','Explorer Goggles'],
 ['neck','Red Bandana'],['neck','Bow Tie'],['neck','Seashell Necklace'],['neck','Clover Collar'],['neck','Rainbow Collar'],
 ['body','Yellow Raincoat'],['body','Knit Winter Sweater'],['body','Superhero Cape'],['body','Mossy Poncho'],['body','Frog Raincoat'],['body','Polka-dot Raincoat'],['body','Bubble Raincoat'],
 ['head','Leaf Beret'],['neck','Autumn Scarf'],['neck','Parade Rosette'],['body','Ghost Sheet'],['body','Pumpkin Suit'], // v2.5 outfits
 ['head','Witch Hat'],['body','Vampire Cape'],['neck','Candy Corn Bandana'],['body','Bat Wings']]; // v2.6 outfits (v2.7 added none; all in v28-base)
// the v2.4 outfits, all compared (env CHANGING='Name,Name' leaves some out while they are being redrawn)
const CHG=(process.env.CHANGING||'').split(',');
[['head','Chef Hat'],['head','Wizard Hat'],['head','Sun Hat'],['head','Cowboy Hat'],['head','Astronaut Helmet'],['neck','Sailor Collar'],['neck','Knit Scarf'],['body','Happi Coat'],['body','Bumblebee Suit'],['body','Cozy Hoodie'],['body','Tutu'],['body','Pyjamas']].forEach(o=>{if(!CHG.includes(o[1]))OUTS.push(o)});
const outfits=[null,...OUTS.map(([sl,n])=>({[sl]:n})),
 {head:'Party Hat',eyes:'Heart Sunglasses',neck:'Red Bandana',body:'Superhero Cape'},{head:'Rain Hat',body:'Frog Raincoat',neck:'Clover Collar',eyes:'Explorer Goggles'},
 {body:'Yellow Raincoat',sleepwear:true},{sleepwear:true},{body:'Pyjamas',sleepwear:true},{head:'Wizard Hat',neck:'Knit Scarf',body:'Bumblebee Suit'},{head:'Nope',body:'Banana Suit'}];
let n=0,bad=[];
// env SKIP='gsd': leave out every render whose label names a breed being redrawn on purpose.
// v2.13: SKIP='collie:howl,shiba:happy' (breed:pose) leaves out the adult renders of that breed in that pose, the ones the v2.13 neck fix
// (NECKFIX in pawart_dogs.js) redraws: every outfit, sparkle, expecting, coat, facing, anim:false, and the mixes with that BODY breed.
// Puppies, newborns, the head chips and the mixes with that head breed are still compared (they do not change).
const SKIP=(process.env.SKIP||'').split(',').filter(Boolean),SKIPB=SKIP.filter(k=>!k.includes(':')),SKIPP=SKIP.filter(k=>k.includes(':')).map(k=>k.split(':'));
// v2.13 mix neck (V213.md 5.1): SKIP_MIX=1 leaves out every mix body render (the labels "<body> mix <head> <pose>" and "... pup", adult and puppy,
// every head breed), because a mix now draws the neck tube in every pose. The mix head chips ("head <body> mix <head>", dogHead) are still compared.
const SKIPMIX=!!process.env.SKIP_MIX;
const skipped=lab=>{const t=lab.split(/[ |,/]/);if(SKIPMIX&&t[0]!=='head'&&t[1]==='mix')return true;if(SKIPB.some(k=>t.includes(k)))return true;
  if(!SKIPP.length||t[0]==='head'||t.includes('puppy')||t.includes('newborn')||t.includes('pup'))return false;
  const pose=t[1]==='mix'?t[3]:t[1];return SKIPP.some(([b,p])=>t[0]===b&&pose===p)};
// v2.15.2 (owner, 25 Oct 2026: every colour fill stays inside its outline): env INK=1 compares the ink only, without the colour fills (fill paths
// with no stroke), the crayon streaks and the coloured strokes (tube fills, socks, fur strokes), so it proves the fill change moved nothing else.
const INKONLY=!!process.env.INK,ink=s=>s.replace(/<path d="[^"]*"( fill="[^"]*")( fill-opacity="[^"]*")?\/>/g,'').replace(/<path d="[^"]*" stroke="[^"]*" stroke-width="[\d.]+" stroke-linecap="round" opacity="\.(42|32)"\/>/g,'')
  .replace(/<path d="[^"]*"( fill="none")? stroke="(?!#2E2320)#[0-9A-Fa-f]{6}" stroke-width="[\d.]+" stroke-linecap="round"( stroke-linejoin="round")?( transform="[^"]*")?\/>/g,'');
const cmp=(lab,f)=>{if(skipped(lab))return;n++;let a,b;try{a=f(OLD)}catch(e){a='ERR '+e.message}try{b=f(NEW)}catch(e){b='ERR '+e.message}if(INKONLY){a=ink(a);b=ink(b)}if(a!==b&&bad.length<4000)bad.push(lab)};
const AGES=[null,'puppy','newborn'];
const [SI,SN]=process.env.SHARD.split('/').map(Number);
(process.env.SWEEP_ONLY?[]:K).filter((k,i)=>i%SN===SI).forEach(k=>{
  cmp(`head ${k}`,P=>P.dogHead(k));
  AGES.forEach(age=>[false,true].forEach(sp=>{const o={};if(age)o.age=age;if(sp)o.sparkle=true;cmp(`head ${k} ${age} ${sp}`,P=>P.dogHead(k,o))}));
  POSES.forEach(p=>outfits.forEach((of,oi)=>AGES.forEach(age=>[false,true].forEach(sp=>{
    const o={pose:p};if(of)o.outfit=of;if(age)o.age=age;if(sp)o.sparkle=true;
    cmp(`${k} ${p} outfit#${oi} ${age||'adult'} spk=${sp}`,P=>P.dog(k,o));
  }))));
  // mixes, expecting, coats, facing left, anim:false (a lighter sweep)
  K.forEach((hk,hi)=>{if(hk===k)return;POSES.forEach((p,pi)=>{const of=outfits[(pi+hi)%outfits.length];
    cmp(`${k} mix ${hk} ${p}`,P=>P.dog(k,{pose:p,mix:{head:hk},outfit:of}));
    if(pi%5===0){cmp(`${k} mix ${hk} ${p} pup`,P=>P.dog(k,{pose:p,mix:{head:hk},age:'puppy',outfit:of}));cmp(`head ${k} mix ${hk}`,P=>P.dogHead(k,{mix:{head:hk}}))}})});
  POSES.forEach((p,pi)=>outfits.forEach((of,oi)=>{
    cmp(`${k} ${p} exp outfit#${oi}`,P=>P.dog(k,{pose:p,expecting:true,sparkle:pi%2===0,outfit:of}));
    if(oi%3===pi%3)cmp(`${k} ${p} left coat outfit#${oi}`,P=>P.dog(k,{pose:p,facing:'left',seed:'s'+pi,coat:{base:'#2B2430',light:'#FFE7B3',dark:'#1D1A22',white:.6,merle:true,eyes:'odd'},outfit:of}));
    if(oi%4===pi%4)cmp(`${k} ${p} noanim outfit#${oi}`,P=>P.dog(k,{pose:p,anim:false,outfit:of}));
  }));
});
console.log(`check_identical vs ${ref}: ${n} renders compared, ${bad.length} differ`);
if(bad.length)console.log(bad.slice(0,30).join('\n'));
/* ---- v2.8 outfit sweep: the same file with its outfit tables exposed, each new outfit's strokes measured as it draws ---- */
const NEW_OUTS=[['body','Very Ugly Sweater'],['head','Reindeer Antlers'],['neck','Snowflake Snood'],['neck','Ugly Sweater Rosette'],['head','Year of the Sheep Hood'],
  ['body','Pumpkin Patch Suit'],['body','Trick-or-Treat Ghost'],['body','Little Bat Costume'],['neck','Sunflower Collar'],['head','Sailor Cap'],['body','Doggy Life Vest'],['head','Crayon Crown'],['neck','Golden Collar'],
  // v2.17.1 Halloween Market costumes (the Lion Mane's mane is RUFF2, measured as a neck piece)
  ['body','Little Witch Hat & Cape'],['body','Scarecrow Overalls'],['body','Mummy Wraps'],['body','Skeleton Suit'],['body','Black Cat Ears & Bow'],['body','Pirate Hat & Sash'],['body','Dinosaur Hood'],['body','Little Owl Wings'],['body','Wizard Robe & Star Hat'],['neck','Lion Mane'],
  // Winter Market 2026 costumes (docs/design/winter-market.md part 2)
  ['body','Father Christmas Suit'],['body','Little Elf Outfit'],['body','Gingerbread Pup Suit'],['body','Snowman Suit'],['body','Polar Bear Hood'],['body','Penguin Suit'],['body','Puffer Jacket'],['body','Nutcracker Jacket & Hat'],['body','Snowflake Wings'],['neck','Jingle Bell Collar']];// v2.11.1 Halloween 2026 costumes: their head pieces (TOP2) are measured against the whole dog
const ISRC=SRC.replace('PA.dog=dog;','PA.dog=dog;PA._sw={HAT2,BODY2,BACK2,NECK2,TOP2,RUFF2:typeof RUFF2==="object"?RUFF2:{},bodyPts,headPts,T,earList,earPose};');
if(ISRC.split('PA._sw').length!==2)throw new Error('sweep: the hook point moved, update ISRC');
const IP=load(ISRC),SW=IP._sw;let probe=null;
const box=(acc,from)=>{const b=[1e9,1e9,-1e9,-1e9],P=b.pts=[],add=(x,y)=>{P.push([x,y]);b[0]=Math.min(b[0],x);b[1]=Math.min(b[1],y);b[2]=Math.max(b[2],x);b[3]=Math.max(b[3],y)};
  acc.slice(from).forEach(e=>{const d=e.match(/ d="([^"]*)"/);if(d){const v=d[1].match(/-?[\d.]+(?:e-?\d+)?/g)||[];for(let i=0;i+1<v.length;i+=2)add(+v[i],+v[i+1])}
    const c=e.match(/cx="([^"]+)" cy="([^"]+)" rx="([^"]+)" ry="([^"]+)"/);if(c){add(c[1]-c[3],c[2]-c[4]);add(+c[1]+ +c[3],+c[2]+ +c[4])}});return b};
const ptsBox=P=>{const b=[1e9,1e9,-1e9,-1e9];P.forEach(q=>{b[0]=Math.min(b[0],q[0]);b[1]=Math.min(b[1],q[1]);b[2]=Math.max(b[2],q[0]);b[3]=Math.max(b[3],q[1])});return b};
const wrap=(fn,slot,name,part)=>function(h,s,L,a4,a5){const n0=h.acc.length,r=fn.apply(this,arguments);if(probe){
  const ob=box(h.acc,n0),hb=ptsBox(SW.headPts(s).map(SW.T(L.hT))),bb=ptsBox(SW.bodyPts(s).map(SW.T(L.bT))),db=[Math.min(hb[0],bb[0]),Math.min(hb[1],bb[1]),Math.max(hb[2],bb[2]),Math.max(hb[3],bb[3])];
  const hx=s.head.rx,hy=s.head.ry,ry=s.body.ry,M=slot==='head'?[hx*1.1+10,hy*2.6+12,hx*1.1+10,hy*.6+10]:slot==='neck'?[hx+10,hy+10,hx+10,hy*1.4+12]:[ry*2.2+16,ry*2.6+18,ry*2.2+16,ry*1.6+14],
   tgt=slot==='head'?hb:slot==='neck'?[hb[0],hb[1],hb[2],Math.max(hb[3],bb[3])]:slot==='top'?db:bb,ov=(a,b)=>a[0]<=b[2]&&b[0]<=a[2]&&a[1]<=b[3]&&b[1]<=a[3];
  probe.n++;const lab=`${probe.lab} ${part}`;
  if(!(ob[0]<1e9))probe.bad.push(lab+': drew nothing');
  else if(!ov(ob,tgt))probe.bad.push(lab+': does not touch the '+(slot==='head'?'head':'dog')+' '+ob.map(Math.round));
  else if(slot==='head'){const c=SW.T(L.hT)([0,0]),ear=Math.max(0,...SW.earList(s).filter(e=>!e.flop).map(e=>Math.max(...SW.earPose(s,L,e).map(q=>Math.hypot(q[0],q[1]))))),lim=Math.max(hx*1.5,hy*2.9,ear+6)+12,far=Math.max(...ob.pts.map(q=>Math.hypot(q[0]-c[0],q[1]-c[1])));if(far>lim)probe.bad.push(lab+': reaches '+far.toFixed(1)+' px from the head centre (limit '+lim.toFixed(1)+')');probe.hat=Math.max(probe.hat??-1e9,far-lim)}
  else if(ob[0]<db[0]-M[0]||ob[1]<db[1]-M[1]||ob[2]>db[2]+M[2]||ob[3]>db[3]+M[3])probe.bad.push(lab+': strays off the dog '+ob.map(Math.round)+' dog '+db.map(Math.round));
  if(slot!=='head')probe.ext.forEach((e,i)=>{const v=[db[0]-ob[0]-M[0],db[1]-ob[1]-M[1],ob[2]-db[2]-M[2],ob[3]-db[3]-M[3]][i];if(v>e[0])e.splice(0,2,v,lab)})}return r};
// the tables are looked up at draw time, so wrapping their entries is enough
NEW_OUTS.forEach(([sl,k])=>{if(sl==='head')SW.HAT2[k]=wrap(SW.HAT2[k],'head',k,'hat');else if(sl==='neck'){SW.NECK2[k]=wrap(SW.NECK2[k],'neck',k,'neck');if(SW.RUFF2[k])SW.RUFF2[k]=wrap(SW.RUFF2[k],'neck',k,'mane')}else{if(SW.BODY2[k])SW.BODY2[k]=wrap(SW.BODY2[k],'body',k,'front');if(SW.BACK2[k])SW.BACK2[k]=wrap(SW.BACK2[k],'body',k,'back');if(SW.TOP2[k])SW.TOP2[k]=wrap(SW.TOP2[k],'top',k,'top')}});
let swN=0,hatX=[-1e9,''];const swBad=[],ext=[[-1e9,''],[-1e9,''],[-1e9,''],[-1e9,'']];
const sweep=(lab,k,o)=>{swN++;if(process.env.SWEEP_WET)o=Object.assign({wet:true},o);/* rainy days: SWEEP_WET=1 sweeps the wet dogs */let out;probe={lab,n:0,bad:swBad,ext};try{out=IP.dog(k,o)}catch(e){swBad.push(lab+': ERR '+e.message);probe=null;return}if(probe.hat!==undefined&&probe.hat>hatX[0])hatX=[probe.hat,lab];probe=null;if(/NaN|undefined/.test(out))swBad.push(lab+': NaN/undefined in the SVG')};
const NK=NEW.DOGS.map(d=>d.key);
NK.filter((k,i)=>i%SN===SI).forEach((k,ki)=>{
  NEW_OUTS.forEach(([sl,nm])=>POSES.forEach((p,pi)=>AGES.forEach(age=>['right','left'].forEach(f=>[false,true].forEach(sp=>{
    const o={pose:p,outfit:{[sl]:nm},facing:f};if(age)o.age=age;if(sp)o.sparkle=true;sweep(`${k} ${p} ${nm} ${age||'adult'} ${f} spk=${sp}`,k,o)})))));
  // together, with older outfits, on mixes, expecting, a coat, anim:false
  const CMB=[{head:'Reindeer Antlers',neck:'Snowflake Snood',body:'Very Ugly Sweater'},{head:'Year of the Sheep Hood',neck:'Ugly Sweater Rosette',body:'Very Ugly Sweater',eyes:'Heart Sunglasses'},{head:'Year of the Sheep Hood',body:'Ghost Sheet',neck:'Snowflake Snood'},{head:'Reindeer Antlers',body:'Bat Wings',neck:'Ugly Sweater Rosette'},{head:'Pom-pom Beanie',body:'Very Ugly Sweater',neck:'Knit Scarf'},{head:'Year of the Sheep Hood',eyes:'Explorer Goggles',body:'Vampire Cape'},{head:'Reindeer Antlers',body:'Tutu',neck:'Snowflake Snood'},{head:'Year of the Sheep Hood',body:'Pyjamas',sleepwear:true},
   {head:'Witch Hat',neck:'Candy Corn Bandana',body:'Pumpkin Patch Suit',eyes:'Heart Sunglasses'},{head:'Year of the Sheep Hood',neck:'Snowflake Snood',body:'Trick-or-Treat Ghost',eyes:'Explorer Goggles'},{head:'Astronaut Helmet',neck:'Shibuya Bandana',body:'Little Bat Costume',eyes:'Heart Sunglasses'},{head:'Party Hat',neck:'Autumn Scarf',body:'Little Bat Costume',sleepwear:true},{head:'Sailor Cap',neck:'Sunflower Collar',body:'Doggy Life Vest',eyes:'Heart Sunglasses'},{head:'Sailor Cap',body:'Ghost Sheet',neck:'Sunflower Collar'},{head:'Crayon Crown',neck:'Golden Collar',body:'Superhero Cape',eyes:'Heart Sunglasses'},{head:'Crayon Crown',neck:'Golden Collar',body:'Pumpkin Patch Suit'}];// v2.17: the Bond 10 crown and collar
  NK.forEach((hk,hi)=>POSES.forEach((p,pi)=>{const of=CMB[(pi+hi)%CMB.length];
    sweep(`${k} mix ${hk} ${p} combo#${(pi+hi)%CMB.length}`,k,{pose:p,outfit:of,mix:hk===k?undefined:{head:hk},age:pi%4===1?'puppy':undefined,expecting:pi%3===0,sparkle:pi%2===0,facing:pi%2?'left':'right',anim:pi%5!==0,coat:pi%6===0?{base:'#2B2430',light:'#FFE7B3',dark:'#1D1A22',white:.6,merle:true,eyes:'odd'}:undefined})}));
});
console.log(`sweep: ${swN} renders, ${swBad.length} bad`);
if(process.env.SWEEP_EXT)console.log('closest to the margin (left, top, right, bottom): '+ext.map(e=>e[0].toFixed(1)+' '+e[1]).join(' | ')+' | hat '+hatX[0].toFixed(1)+' '+hatX[1]);
if(swBad.length)console.log(swBad.slice(0,30).join('\n'));
if(bad.length||swBad.length)process.exit(1);
console.log('ALL OK');
