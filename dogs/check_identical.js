/* Byte-identical check for the dog art module.
   Loads dogs/pawart_dogs.js (working tree) and the same file from a git ref (default integration/v2.4)
   in node vm sandboxes and compares PawArt.dog / PawArt.dogHead for every breed x pose x existing outfit
   x age x sparkle, plus mixes, expecting, coats and facing left.
   Usage: node dogs/check_identical.js [ref]   (prints ALL OK on success, exits 1 on any difference)
   The breeds are split over one child process per CPU core (env SHARD=i/n runs one share). */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),cp=require('child_process'),os=require('os');
if(!process.env.SHARD){// parent: fan out, then sum up
  const n=Math.max(1,Math.min(10,os.cpus().length)),kids=[];let done=0,tot=0,bad=[],refName='';
  for(let i=0;i<n;i++){const c=cp.fork(__filename,process.argv.slice(2),{env:Object.assign({},process.env,{SHARD:i+'/'+n}),silent:true});let out='';c.stdout.on('data',d=>out+=d);c.stderr.on('data',d=>process.stderr.write(d));
    c.on('exit',code=>{const m=out.match(/vs (\S+): (\d+) renders compared, (\d+) differ/);if(!m){bad.push('shard '+i+' crashed (exit '+code+')')}else{refName=m[1];tot+=+m[2];if(+m[3])bad.push(...out.split('\n').filter(l=>l&&!/renders compared|ALL OK/.test(l)))}
      if(++done===n){console.log(`check_identical vs ${refName}: ${tot} renders compared over ${n} shards, ${bad.length} differ`);if(bad.length){console.log(bad.slice(0,30).join('\n'));process.exit(1)}console.log('ALL OK')}})}
  return;
}
const ref=process.argv[2]||(()=>{try{cp.execSync('git rev-parse --verify -q integration/v2.4',{cwd:path.join(__dirname,'..'),stdio:'ignore'});return'integration/v2.4'}catch(e){return'origin/integration/v2.4'}})();
const load=src=>{const sb={window:{}};vm.createContext(sb);vm.runInContext(src,sb);return sb.window.PawArt};
const NEW=load(fs.readFileSync(path.join(__dirname,'pawart_dogs.js'),'utf8'));
const OLD=load(cp.execSync(`git show ${ref}:dogs/pawart_dogs.js`,{cwd:path.join(__dirname,'..'),encoding:'utf8',maxBuffer:64<<20}));
const K=OLD.DOGS.map(d=>d.key);
const POSES=['idle','happy','pet','eat','sleep','walk','jump','sit','sad','dirty','crouch','shake','cold','hot','dig','beg','squat','leglift','paw','down','rollover','playdead','speak','dance','bow','scratch','sniff','yawn','howl'];
// the outfits that exist in the reference build (anything else is new and is not compared)
const OUTS=[['head','Party Hat'],['head','Flower Crown'],['head','Acorn Cap'],['head','Rain Hat'],['head','Pom-pom Beanie'],['eyes','Heart Sunglasses'],['eyes','Explorer Goggles'],
 ['neck','Red Bandana'],['neck','Bow Tie'],['neck','Seashell Necklace'],['neck','Clover Collar'],['neck','Rainbow Collar'],
 ['body','Yellow Raincoat'],['body','Knit Winter Sweater'],['body','Superhero Cape'],['body','Mossy Poncho'],['body','Frog Raincoat'],['body','Polka-dot Raincoat'],['body','Bubble Raincoat']];
// v2.4 outfits already merged into the reference and not under change (env CHANGING='Name,Name' leaves some out)
const CHG=(process.env.CHANGING||'Astronaut Helmet,Cozy Hoodie,Happi Coat,Tutu').split(',');
[['head','Chef Hat'],['head','Wizard Hat'],['head','Sun Hat'],['head','Cowboy Hat'],['head','Astronaut Helmet'],['neck','Sailor Collar'],['neck','Knit Scarf'],['body','Happi Coat'],['body','Bumblebee Suit'],['body','Cozy Hoodie'],['body','Tutu'],['body','Pyjamas']].forEach(o=>{if(!CHG.includes(o[1]))OUTS.push(o)});
const outfits=[null,...OUTS.map(([sl,n])=>({[sl]:n})),
 {head:'Party Hat',eyes:'Heart Sunglasses',neck:'Red Bandana',body:'Superhero Cape'},{head:'Rain Hat',body:'Frog Raincoat',neck:'Clover Collar',eyes:'Explorer Goggles'},
 {body:'Yellow Raincoat',sleepwear:true},{sleepwear:true},{body:'Pyjamas',sleepwear:true},{head:'Wizard Hat',neck:'Knit Scarf',body:'Bumblebee Suit'},{head:'Nope',body:'Banana Suit'}];
let n=0,bad=[];
const cmp=(lab,f)=>{n++;let a,b;try{a=f(OLD)}catch(e){a='ERR '+e.message}try{b=f(NEW)}catch(e){b='ERR '+e.message}if(a!==b&&bad.length<4000)bad.push(lab)};
const AGES=[null,'puppy','newborn'];
const [SI,SN]=process.env.SHARD.split('/').map(Number);
K.filter((k,i)=>i%SN===SI).forEach(k=>{
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
if(bad.length){console.log(bad.slice(0,30).join('\n'));process.exit(1)}
console.log('ALL OK');
