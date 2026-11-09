// "Pick a coat" Reel (docs/marketing/VIRAL_REEL_IDEAS.md, "Today's idea (9 Nov 2026)"; shot table and caption: docs/marketing/COAT_REEL.md).
// Hook at frame 1: "Stop picking the yellow Lab. / Pick 1 of these 4 dogs instead." over the game's yellow Labrador (its default coat); a red crayon
// cross, a kind aside ("sorry yellow Labs, you're great") and the Lab slides off. Four numbered dogs pop in at once, "pause now!" with a 3-2-1,
// then each pops big for its deadpan line in Noodle's voice: 1 Fox red Labrador (new in v2.23.1), 2 Dark golden Golden Retriever (new),
// 3 Red merle Border Collie with odd eyes (one blue, one brown), 4 Chocolate Labrador. Then the news (owner, 9 Nov 2026: say it is new): "New! Now you pick the coat when you adopt a new dog. Puppies inherit it!", with a NEW sticker from the countdown on; then
// "comment your number", and the yellow Lab slides back in: the last frame is the first one, so the Reel loops.
// No black or white dog is a pick (owner, 1 Nov 2026). Nothing typed from memory: the coats are the game's own starter presets
// (game/src/10_sex_age_genes.js STARTER_COATS, starterCoats / starterPick as the adoption colour picker uses them), the coat names and colours
// come from mods/genes.js phenotype(), and each dog is drawn as the game draws that dog (PawArt.dog(key, { coat: phenotype.coat, seed: hashId(id) }),
// game/src/13_more_dogs.js lookOpts); the collie's id is found the way starterIdFor() does, so its merle eye roll gives odd eyes.
// The coats are on main (v2.23.1): ART_ROOT=<a checkout of main> loads the art, the genes and the starter table from there.
// Every frame: centreCheck(), safeCheck() and apartCheck() (../centre_text.js); the build stops on the first miss. 1080 x 1920, 30 fps.
// Voice: Noodle (Kokoro af_bella 1.1x): VO_LINES=coat_reel/vo_coat.json python3 ../friends_reel/vo_friends.py <kokoro dir> <vo dir>.
// Music: the game's own cozy yard music (mods/pawaudio.js) about 11 dB under the voice (~30%), a crayon tick per pop, a scratch per stroke of
// the cross, the game's "adopt" sting on the real-coats line.
//
//   ART_ROOT=<main checkout> NODE_PATH=$(npm root -g) node brand/instagram/launch/coat_reel/build_coat.js <workdir> <vo dir>
//   ONLY=stills: key frames only (WORK/stills). Output next to this file: doodle-doggo-pick-a-coat.mp4
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'coat_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', YEL = '#FFE3A1', PINK = '#F28FA5', RED = '#D2473C', GREEN = '#4E9A54';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;

// ---- the game's art, genes and starter coats, loaded as the game loads them ----
const win = {}, ctx = { window: win, console, Intl, navigator: {} }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', 'mods/genes.js']) vm.runInContext(fs.readFileSync(path.join(ART_ROOT, f), 'utf8'), ctx);
{ let s = fs.readFileSync(path.join(ART_ROOT, 'game/src/10_sex_age_genes.js'), 'utf8'); const cut = s.indexOf('// Breeding rules'); if (cut < 0) throw new Error('10_sex_age_genes.js changed'); vm.runInContext(s.slice(0, cut), ctx); }
const PA = win.PawArt, G = win.PawGenes, inner = (s) => s.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const starterCoats = vm.runInContext('starterCoats', ctx), starterEyes = vm.runInContext('starterEyes', ctx);
const hashId = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }; // game/src/13_more_dogs.js
const EN = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
// a starter dog in the coat named `coat` (and eyes), as the adoption picker makes it; id: a fixed id whose eye roll fits (starterIdFor with a fixed list)
function starter(key, coat, eyes, tag) {
  const cs = starterCoats(key), i = cs.findIndex((c) => c.coat === coat); if (i < 0) throw new Error('no ' + coat + ' ' + key + ' in the game (is ART_ROOT a v2.23.1 checkout?)');
  const es = starterEyes(key, i), e = eyes ? es.find((x) => x.eyes === eyes) : null; if (eyes && !e) throw new Error('no ' + eyes + ' eyes for ' + coat + ' ' + key);
  const genes = Object.assign({}, cs[i].genes, e ? { Bl: e.Bl.slice() } : {});
  let id = null; for (let n = 0; n < 2000 && !id; n++) { const c = 'coatreel_' + tag + '_' + n, p = G.phenotype(genes, key, c); if (!eyes || p.eyes === eyes) id = c; }
  if (!id) throw new Error('no id gives ' + eyes + ' eyes');
  const ph = G.phenotype(genes, key, id); if (ph.coatName !== coat) throw new Error(key + ': ' + ph.coatName + ' is not ' + coat);
  return { key, id, genes, ph, breed: EN['data.breed_names.' + key], opts: { coat: ph.coat, seed: hashId(id) } };
}
const YLAB = starter('lab', 'Yellow', null, 'y');
if (!starterCoats('lab')[0].def || starterCoats('lab')[0].coat !== 'Yellow') throw new Error('the yellow Lab is no longer the game\'s default Lab');
const PICKS = [
  Object.assign(starter('lab', 'Fox red', null, 'f'), { word: 'Fox red', sub: 'Labrador', isNew: true }),
  Object.assign(starter('golden', 'Dark golden', null, 'g'), { word: 'Dark golden', sub: 'Golden Retriever', isNew: true }),
  Object.assign(starter('collie', 'Red merle', 'odd', 'c'), { word: 'Red merle', sub: 'Border Collie', extra: 'one blue eye, one brown' }),
  Object.assign(starter('lab', 'Chocolate', null, 'h'), { word: 'Chocolate', sub: 'Labrador' }),
];
// owner, 1 Nov 2026: no black or white dog as a pick
PICKS.forEach((p) => { if (/black|white/i.test(p.ph.coatName.replace(/ and white$/, '')) || /black|white/i.test(p.word)) throw new Error('a black or white pick: ' + p.word); });
if (PICKS[2].ph.eyes !== 'odd') throw new Error('the collie lost its odd eyes');
console.log(PICKS.map((p) => `${p.word} ${p.breed} (${p.ph.coatName}, eyes ${p.ph.eyes}, id ${p.id})`).join('; '));

// ---- the voice and the timeline (each part as long as its line) ----
const VOAT = []; let at = 0.1;
const say = (k, gap) => { VOAT.push({ k, at }); at += VOD[k] + (gap == null ? 0.12 : gap); return VOAT[VOAT.length - 1].at; };
const XAT = 0.42, SLIDE = 0.95, POP = 1.35; // the cross, the Lab sliding off, the four popping in
const HOOK_AT = say('hook', 0.12), PAUSE_AT = say('pause', 0.16);
const BEAT = PICKS.map((_, i) => say('d' + (i + 1), 0.12));
const REAL_AT = say('real', 0.1), ASK_AT = say('ask', 0.12);
const LOOP = at, T = LOOP + 0.5, NF = Math.round(T * FPS); // LOOP: the four leave and the yellow Lab slides back to where frame 0 has it
// the count: 3, 2, 1 on the spoken numbers in Noodle's "Pause now! Three, two, one." (Kokoro gives no word times): the words start after the
// quietest 30 ms dips of the line's loudness (after "Pause now!" and after "three"); "one" where "two" has faded
function wavEnv(f) { const b = fs.readFileSync(f); let o = 12, fmt = null, data = null;
  while (o + 8 <= b.length) { const id = b.toString('ascii', o, o + 4), n = b.readUInt32LE(o + 4); if (id === 'fmt ') fmt = { bits: b.readUInt16LE(o + 22), sr: b.readUInt32LE(o + 12), ch: b.readUInt16LE(o + 10), tag: b.readUInt16LE(o + 8) }; if (id === 'data') data = b.subarray(o + 8, o + 8 + n); o += 8 + n + (n & 1); }
  if (!fmt || !data || fmt.ch !== 1 || !(fmt.bits === 16 || (fmt.bits === 32 && fmt.tag === 3))) throw new Error('unexpected wav ' + f);
  const N = data.length / (fmt.bits / 8), get = fmt.bits === 16 ? (i) => data.readInt16LE(i * 2) / 32768 : (i) => data.readFloatLE(i * 4), win = Math.round(fmt.sr * 0.03), hop = Math.round(fmt.sr * 0.01), env = [];
  for (let i = 0; i + win <= N; i += hop) { let e = 0; for (let j = i; j < i + win; j++) e += get(j) ** 2; env.push(Math.sqrt(e / win)); }
  return { env, hop: 0.01, win: 0.03 }; }
const COUNT = (() => { const { env, hop } = wavEnv(path.join(VO, 'pause.wav')), d = VOD.pause, at = (x) => Math.round(x / hop);
  const dip = (a, b) => { let k = at(a); for (let i = at(a); i <= Math.min(at(b), env.length - 1); i++) if (env[i] < env[k]) k = i; return k * hop + 0.015; };
  const g1 = dip(d * 0.25, d * 0.6), g2 = dip(g1 + 0.12, g1 + (d - g1) * 0.55), pk = (() => { let k = at(g2); for (let i = at(g2); i <= at(g2 + 0.25); i++) if (env[i] > env[k]) k = i; return k; })(),
    g3 = (() => { for (let i = pk; i < env.length; i++) if (env[i] < env[pk] * 0.3) return i * hop; return d - 0.3; })(); // "one" is soft: it starts where "two" has faded to 30 %
  return [g1, g2, g3].map((x) => PAUSE_AT + x); })();
console.log('count at', COUNT.map((x) => (x - PAUSE_AT).toFixed(2)).join(', '), 's into the pause line');
// subtitles: the payoffs and the real-coats line (the hook, the pause and the ask are on the card already)
const SUBS_TX = { d1: ['Fox red. Not a fox.', 'We checked.'], d2: ['Dark golden.', 'Like toast, but a dog.'], d3: ['Odd eyes.', 'Both judging you.'],
  d4: ['Chocolate.', 'The dog-safe kind.'], real: ['New! Now you pick the coat', 'when you adopt a new dog.', 'Puppies inherit it!'] };
for (const [k, parts] of Object.entries(SUBS_TX)) if (parts.join(' ') !== VOJ.text[k]) throw new Error('subtitles differ from the voice: ' + k);
const SUBS = [];
VOAT.forEach((v) => { const parts = SUBS_TX[v.k]; if (!parts) return; const wt = parts.map((x) => x.length + (/[.!?]$/.test(x) ? 6 : 2)), sum = wt.reduce((a, b) => a + b, 0); let t0 = v.at;
  parts.forEach((x, i) => { const d = VOD[v.k] * wt[i] / sum; SUBS.push({ a: t0, b: t0 + d, s: x, k: v.k }); t0 += d; }); });
SUBS.forEach((u, i) => { const nx = SUBS[i + 1]; u.b = nx ? Math.min(nx.a, u.b + 0.3) : u.b + 0.3; });

// ---- the drawings: all three line-boil frames in each (one shown at a time) ----
const ART = {};
ART.ylab = inner(PA.dog('lab', Object.assign({ pose: 'sit', facing: 'right' }, YLAB.opts)));
PICKS.forEach((p, i) => { const f = 'right'; // the art faces right; the right column is mirrored on the page (place(..., { flip }), as the game flips with CSS) so the dogs face each other
  ART['s' + i] = inner(PA.dog(p.key, Object.assign({ pose: 'sit', facing: f }, p.opts)));
  ART['h' + i] = inner(PA.dog(p.key, Object.assign({ pose: 'happy', facing: f }, p.opts))); });
ART.zoom = ART.s2; // the collie's face for the eye loupe
for (const [id, s] of Object.entries(ART)) if (!s.includes('pa-d-f2')) throw new Error('no line boil in ' + id);

const TX = { hook: ['Stop picking the yellow Lab.', 'Pick 1 of these 4 dogs instead.'], aside: "sorry yellow Labs, you're great", pick: 'PICK 1 · 2 · 3 · 4', pause: 'pause now!',
  real: ['new: pick the coat', 'when you adopt'], newSticker: "NEW! pick your dog's coat", ask: ['Comment', 'your number!'], newTag: 'NEW!' };
const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:${PAPER}}svg{display:block}#art .pa-d-f0,#art .pa-d-f1,#art .pa-d-f2{display:none}#art .k0 .pa-d-f0,#art .k1 .pa-d-f1,#art .k2 .pa-d-f2{display:inline}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
<pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 7H14" stroke="#5B3D32" stroke-width="2.2" stroke-linecap="round" opacity=".12"/></pattern>
<clipPath id="loupe"><circle cx="0" cy="0" r="105"/></clipPath>
</defs><g id="bg"></g><g id="art"></g><g id="ov"></g></svg>
<span style="font:700 20px Caveat">a</span>
<script>
${CENTRE_JS}
${SAFE_JS}
const $=(i)=>document.getElementById(i), ART=${JSON.stringify(ART)}, SUBS=${JSON.stringify(SUBS)}, TX=${JSON.stringify(TX)}, F='Caveat', CX=SAFE_CX;
const P=${JSON.stringify(PICKS.map((p) => ({ word: p.word, sub: p.sub, isNew: !!p.isNew, extra: p.extra || '' })))};
const XAT=${XAT}, SLIDE=${SLIDE}, POP=${POP}, HOOK_AT=${HOOK_AT}, PAUSE_AT=${PAUSE_AT}, BEAT=${JSON.stringify(BEAT)}, REAL_AT=${REAL_AT}, ASK_AT=${ASK_AT}, LOOP=${LOOP}, T=${T}, COUNT=${JSON.stringify(COUNT)};
const clamp=(x,a,b)=>Math.max(a==null?0:a,Math.min(b==null?1:b,x)), sm=(x)=>{ x=clamp(x); return x*x*(3-2*x); }, eo=(x)=>1-Math.pow(1-clamp(x),3);
const back=(x)=>{ x=clamp(x); const c=1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const f2=(n)=>Math.round(n*100)/100, lerp=(a,b,u)=>a+(b-a)*u;
let BOX=null, EYE=null; // each drawing's drawn box (frame 0); EYE: the collie's two eyes in its own drawing
function measure(){ BOX={}; const g=$('art'); for(const [id,s] of Object.entries(ART)){ g.innerHTML='<g class="k0">'+s+'</g>'; const b=g.firstChild.getBBox(); BOX[id]=[b.x,b.y,b.width,b.height];
    if(id==='zoom'){ const bl=[...g.querySelectorAll('.pa-d-f0 [fill="#3FA9F5"]')].map((e)=>e.getBBox()); if(!bl.length) throw new Error('no blue iris in the collie');
      const e=bl[0]; EYE=[e.x+e.width/2,e.y+e.height/2]; } }
  g.innerHTML=''; return {BOX,EYE}; }
// a drawing by its drawn box: centre x, bottom y, fitted into maxW x maxH, scaled by z around its feet
function place(id,cx,bot,maxW,maxH,z,dy,k,o){ o=o||{}; const b=BOX[id], s0=Math.min(maxW/b[2],maxH/b[3])*z;
  return '<g'+(o.op!=null?' opacity="'+f2(o.op)+'"':'')+(o.safe===false?'':' data-safe')+(o.apart?' data-apart="'+o.apart+'"':'')+' class="k'+k+'" transform="translate('+f2(cx)+' '+f2(bot+(dy||0))+')'+(o.rot?' rotate('+f2(o.rot)+')':'')+' scale('+(o.flip?-1:1)*s0.toFixed(4)+' '+s0.toFixed(4)+') translate('+f2(-(b[0]+b[2]/2))+' '+f2(-(b[1]+b[3]))+')">'+ART[id]+'</g>'; }
function blob(cx,cy,r,col,seed,op){ let p='', n=26; const rnd=(i)=>{ const x=Math.sin(seed*91.7+i*12.9898)*43758.5453; return x-Math.floor(x); };
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, rr=r*(0.93+rnd(i)*0.1); p+=(i?'L':'M')+f2(cx+Math.cos(a)*rr)+' '+f2(cy+Math.sin(a)*rr*0.96); }
  p+='Z'; return '<g opacity="'+op+'"><path d="'+p+'" fill="'+col+'"/><path d="'+p+'" fill="url(#hatch)"/></g>'; }
const card=(x,y,w,h,lines,o)=>{ o=o||{}; return '<g data-box><rect x="'+f2(x)+'" y="'+f2(y)+'" width="'+f2(w)+'" height="'+f2(h)+'" rx="34" fill="'+(o.fill||'${CREAM}')+'" stroke="'+(o.stroke||'${PEN}')+'" stroke-width="'+(o.sw||6)+'"/>'+centred(lines,x+w/2,y+h/2,F).svg+'</g>'; };
const bubble=(cx,cy,r,s,size,fill,o)=>'<g data-box'+(o?' opacity="'+f2(o)+'"':'')+'><circle cx="'+f2(cx)+'" cy="'+f2(cy)+'" r="'+r+'" fill="'+(fill||'${YEL}')+'" stroke="${PEN}" stroke-width="6"/>'+centred([{s,size}],cx,cy,F).svg+'</g>';
function fitS(s,size,maxW){ while(size>20){ const k=inkOf(s,size,F); if(k.L+k.R<=maxW) return size; size-=2; } return size; }
function sub(t,y){ const u=SUBS.find((x)=>t>=x.a&&t<x.b); if(!u) return ''; const o=Math.min(sm((t-u.a)/0.08),sm((u.b-t)/0.08));
  return pill(u.s,CX,y,fitS(u.s,58,720),F,{fill:'${PEN}',stroke:'${PEN}',color:'${PAPER}',padX:30,op:(0.95*o).toFixed(3)}); }
// a crayon stroke drawn from a to b over u (0..1): a wobbly thick line, twice over
function stroke(x0,y0,x1,y1,u,col,w){ if(u<=0) return ''; const x=lerp(x0,x1,u), y=lerp(y0,y1,u), mx=lerp(x0,x,0.5)+8, my=lerp(y0,y,0.5)-6;
  return '<path d="M'+f2(x0)+' '+f2(y0)+' Q'+f2(mx)+' '+f2(my)+' '+f2(x)+' '+f2(y)+'" fill="none" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round" opacity=".92"/>'
    +'<path d="M'+f2(x0+6)+' '+f2(y0+5)+' Q'+f2(mx-6)+' '+f2(my+8)+' '+f2(x-4)+' '+f2(y+4)+'" fill="none" stroke="'+col+'" stroke-width="'+(w*0.45)+'" stroke-linecap="round" opacity=".55"/>'; }
// the grid: two by two, numbered, each dog with its coat in a pill under it
const GX=[268,682], GF=[890,1250], GW=360, GH=260; // row 1 starts under the NEW sticker
const cell=(i)=>({x:GX[i%2], feet:GF[i>>1]});
function hookCard(o,lt){ return '<g opacity="'+f2(o)+'" transform="rotate(-2 '+CX+' 395)">'+card(CX-405,288,810,214,[{s:TX.hook[0],size:fitS(TX.hook[0],74,730),pitch:92},{s:TX.hook[1],size:fitS(TX.hook[1],70,730)}])+'</g>'; }
window.frame=function(t){
  let bg='<rect width="${W}" height="${H}" fill="${PAPER}"/>', art='', ov='';
  const k=Math.floor(t/0.12)%3;
  // ---- the yellow Lab: on the paper at frame 0, crossed out, slides off; slides back in at the loop ----
  const labIn=t>=LOOP?eo((t-LOOP-0.06)/0.38):1, labOff=t<POP+0.2?sm((t-SLIDE)/0.4):1;
  if(t<POP+0.2||t>=LOOP){ const dx=t>=LOOP?(1-labIn)*900:-labOff*900, rot=t>=LOOP?0:-labOff*14;
    bg+=blob(CX+dx*0.6,930,330,'#FFF0B8',3,(0.7*(t>=LOOP?labIn:1-labOff)).toFixed(3));
    if(dx<560&&dx>-560) art+=place('ylab',CX+dx,1180,560,520,1,0,k,{rot,safe:Math.abs(dx)<0.5}); // sliding off or back in: out of SAFE on its way
    if(t<LOOP){ const u1=clamp((t-XAT)/0.14), u2=clamp((t-XAT-0.16)/0.14);
      ov+='<g transform="translate('+f2(dx)+' 0)">'+stroke(CX-230,700,CX+230,1150,u1,'${RED}',38)+stroke(CX+230,700,CX-230,1150,u2,'${RED}',38)+'</g>'; } }
  // the kind aside, under the hook while the Lab leaves
  { const o=Math.min(sm((t-XAT-0.25)/0.15),1-sm((t-HOOK_AT-VOD_HOOK+0.2)/0.2)); if(o>0&&t<LOOP) ov+='<g transform="rotate(2 '+CX+' 1385)">'+pill(TX.aside,CX,1385,50,F,{fill:'${YEL}',padX:30,op:o.toFixed(3)})+'</g>'; }
  // ---- the four ----
  const inGrid=t>=POP&&t<LOOP+0.3, gdx=t>=LOOP?-950*eo((t-LOOP)/0.3):0; // the loop: the four slide off to the left as the Lab comes back
  if(inGrid){ const lt=t-POP, popIn=back(lt/0.32), leave=1-sm((t-LOOP+0.12)/0.12); // the badges and pills fade just before the four slide off
    let big=-1, bigU=0; BEAT.forEach((b,i)=>{ if(t>=b && t<(BEAT[i+1]||REAL_AT+0.1)) big=i; });
    if(big>=0){ bigU=eo((t-BEAT[big])/0.32); if(big===3) bigU=Math.min(bigU,1-sm((t-REAL_AT+0.25)/0.3)); }
    // the other three: fade out as the first dog grows, stay away through the beats, come back as the fourth shrinks home
    const dimFor=(i)=>big<0?1:big===0?1-sm((t-BEAT[0])/0.1):big===3&&t>REAL_AT-0.02?sm((t-REAL_AT+0.02)/0.22):0;
    const prevU=big>0?1-sm((t-BEAT[big])/0.12):0; // the last big dog fades out where it stood, as the next one pops in
    // the soft blob behind the big dog
    if(big>=0) bg+=blob(CX,900,(0.9+0.1*bigU)*360,['#F6B98C','#F1CF62','#EE9CB6','#C9A27E'][big],big+5,(0.5*bigU).toFixed(3));
    P.forEach((p,i)=>{ const c=cell(i), isBig=i===big, dim=isBig?1:dimFor(i);
      const hop=t>=ASK_AT?-Math.abs(Math.sin(t*7+i*1.3))*18:0;
      if(isBig){ const u=bigU, cx=lerp(c.x,CX+(p.extra?45:0),u), feet=lerp(c.feet,1185,u), mw=lerp(GW,p.extra?690:720,u), // the collie a little right, clear of the eye loupe
          mh=lerp(GH,520,u), pz=0.9+0.1*back((t-BEAT[big])/0.3);
        art+=place(u>0.5?'h'+i:'s'+i,cx,feet,mw,mh,pz,-Math.abs(Math.sin(t*6))*10*u,k,u>0.999?{apart:'d'+i,flip:i%2===1}:{flip:i%2===1});
      } else if(i===big-1&&prevU>0.01){ const q=P[i];
        art+=place('h'+i,CX+(q.extra?45:0),1185,q.extra?690:720,520,0.8+0.2*prevU,0,k,{op:prevU,safe:prevU>=0.05,flip:i%2===1});
      } else if(dim>0.01){ const z=t<POP+0.4?Math.max(0.01,popIn):1, op=dim, pose=t>=ASK_AT?'h'+i:'s'+i, moving=gdx<-0.5, still=big<0&&!moving&&z===1;
        if(z>0.02&&c.x+gdx>-250) art+=place(pose,c.x+gdx,c.feet,GW,GH,z,hop,(k+i)%3,op<0.3||moving?{op,safe:false,flip:i%2===1}:still?{op,apart:'d'+i,flip:i%2===1}:{op,flip:i%2===1}); }
      // the number badge and the coat pill (grid only)
      const lo=dim*(isBig?(big===3&&t>REAL_AT-0.25?1-bigU:1-sm(bigU*3)):1)*(t<POP+0.15?0:sm((t-POP-0.15)/0.18))*leave;
      if(lo>0.02){ const bs=t<POP+0.6?back((t-POP-0.15)/0.3):1; ov+='<g opacity="'+f2(lo)+'">'+'<g transform="translate('+(c.x-150)+' '+(c.feet-GH+4)+') scale('+f2(bs)+') rotate(-8)">'+bubble(0,0,44,String(i+1),66)+'</g>'
          +pill(p.word,c.x,c.feet+44,44,F,{fill:'${CREAM}',padX:24})+'</g>'; } });
    // the big dog's card: number, coat, breed; NEW for the two new coats; the collie's eye loupe
    if(big>=0&&bigU>0){ const p=P[big], o=bigU, cs=0.92+0.08*back((t-BEAT[big])/0.3);
      ov+='<g opacity="'+f2(o)+'" transform="translate('+CX+' 400) scale('+f2(cs)+') rotate(-2) translate('+(-CX)+' -400)">'+card(CX-330,296,700,210,[{s:p.word,size:fitS(p.word,104,520),pitch:86},{s:p.sub,size:56,fill:'#8A7468'}])
        +'<g transform="translate('+(CX-336)+' 400) rotate(-10)">'+bubble(0,0,64,String(big+1),100)+'</g>'
        +(p.isNew?'<g transform="rotate(8 '+(CX+312)+' 326)">'+pill(TX.newTag,CX+312,326,50,F,{fill:'${PINK}',padX:20})+'</g>':'')+'</g>';
      if(p.extra){ const lu=eo((t-BEAT[big]-0.35)/0.3); if(lu>0){ const b=BOX['h'+big], s0=Math.min(720/b[2],520/b[3]), zb=BOX.zoom, zs=Math.min(GW/zb[2],GH/zb[3]);
          // the loupe: the collie's sitting drawing at 4x its grid size, centred on its eyes, in a crayon circle up and to the side
          const Z=zs*2.8, lx=190, ly=640; // up and to the left, clear of the card, the collie's tail and head
          ov+='<g opacity="'+f2(lu)+'" transform="translate('+lx+' '+ly+') scale('+f2(0.85+0.15*back(lu))+')"><circle r="105" fill="${CREAM}"/><g clip-path="url(#loupe)"><g class="k'+k+'" transform="scale('+Z.toFixed(4)+') translate('+f2(-EYE[0]-9)+' '+f2(-EYE[1])+')">'+ART.zoom+'</g></g><circle data-safe r="105" fill="none" stroke="${PEN}" stroke-width="8"/></g>';
          ov+='<g opacity="'+f2(lu)+'">'+pill(p.extra,CX,1262,50,F,{fill:'#D5E8F8',padX:28})+'</g>'; } } }
  }
  // ---- the card at the top ----
  if(t<POP+0.2||t>=LOOP) ov+=hookCard(t>=LOOP?sm((t-LOOP-0.08)/0.25):1);
  else if(t<PAUSE_AT){ ov+=hookCard(1); }
  else if(t<BEAT[0]){ const lt=t-PAUSE_AT, o=sm(lt/0.15), cs=0.92+0.08*back(lt/0.3);
    ov+='<g opacity="'+f2(o)+'" transform="translate('+CX+' 400) scale('+f2(cs)+') rotate(-2) translate('+(-CX)+' -400)">'+card(CX-380,292,760,216,[{s:TX.pause,size:90,pitch:98},{s:TX.pick,size:74,fill:'#C2567A'}])+'</g>';
    let n=0; COUNT.forEach((c,i)=>{ if(t>=c) n=3-i; });
    if(n){ const c=COUNT[3-n], ns=back((t-c)/0.22); ov+='<g transform="translate(800 372) scale('+f2(ns)+') rotate(8)">'+bubble(0,0,58,String(n),92,'${PINK}')+'</g>'; } }
  else if(t>=REAL_AT&&t<ASK_AT){ const lt=t-REAL_AT, o=sm(lt/0.2), cs=0.92+0.08*back(lt/0.3);
    ov+='<g opacity="'+f2(o)+'" transform="translate('+CX+' 400) scale('+f2(cs)+') rotate(-1.5) translate('+(-CX)+' -400)">'+card(CX-400,292,800,216,[{s:TX.real[0],size:fitS(TX.real[0],78,720),pitch:84},{s:TX.real[1],size:70}],{stroke:'${GREEN}',sw:7})+'</g>'; }
  if(t>=ASK_AT&&t<LOOP+0.12){ const lt=t-ASK_AT, o=Math.min(sm(lt/0.15),1-sm((t-LOOP+0.02)/0.14)), cs=0.9+0.1*back(lt/0.3);
    ov+='<g opacity="'+f2(o)+'" transform="translate('+CX+' 400) scale('+f2(cs)+') rotate(-2) translate('+(-CX)+' -400)">'+card(CX-380,292,760,216,[{s:TX.ask[0],size:92,pitch:98},{s:TX.ask[1],size:92,fill:'#C2567A'}])+'</g>'; }
  // owner, 9 Nov 2026: the news is explicit. A NEW sticker from the countdown on (between the card and the dogs), gone as the loop starts
  { const so=Math.min(sm((t-PAUSE_AT)/0.15),1-sm((t-LOOP+0.12)/0.12)); if(so>0.01){ const ss=0.85+0.15*back((t-PAUSE_AT)/0.3);
    ov+='<g opacity="'+f2(so)+'" transform="translate(492 556) scale('+f2(ss)+') rotate(-2) translate(-492 -556)">'+pill(TX.newSticker,492,556,38,F,{fill:'${PINK}',padX:22})+'</g>'; } }
  ov+=sub(t,1385);
  if(t>=REAL_AT+0.3&&t<ASK_AT){ } // (the real-coats line is in the subtitles)
  $('bg').innerHTML=bg; $('art').innerHTML=art; $('ov').innerHTML=ov;
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  const out=safeCheck($('st')); if(out.length) return 'outside SAFE: '+out.join('; ');
  const near=apartCheck($('st'),20); if(near.length) return 'dogs too close: '+near.join('; ');
  return '';
};
const VOD_HOOK=${VOD.hook};
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html);
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const allText = [Object.values(TX), PICKS.map((p) => [p.word, p.sub, p.extra || '']), Object.values(SUBS_TX), '0123456789'].flat(3).join(' ');
  await p.evaluate((txt) => document.fonts.load('700 40px Caveat', txt), allText); await p.evaluate(() => document.fonts.ready);
  const m = await p.evaluate(() => measure()); fs.unlinkSync(pageFile);
  console.log('T =', T.toFixed(2), 's,', NF, 'frames; voice at', VOAT.map((v) => v.k + ' ' + v.at.toFixed(2)).join(', '), '; collie eye at', m.EYE.map(Math.round));
  const render = async (t, file) => { const err = await p.evaluate((t) => window.frame(t), t); if (err) throw new Error(err + ' at ' + t.toFixed(2));
    await p.screenshot({ path: file }); };
  if (process.env.ONLY === 'stills') {
    const ts = process.env.STRIP ? process.env.STRIP.split(',').map(Number) : [0, XAT + 0.4, SLIDE + 0.3, POP + 0.5, PAUSE_AT + 0.3, COUNT[2] + 0.1, ...BEAT.map((x) => x + 0.9), REAL_AT + 1, ASK_AT + 0.4, LOOP + 0.2, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return;
  }
  const t0 = Date.now();
  for (let fi = 0; fi < NF; fi++) { await render(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close();
  // the loop: the last frame is the first one
  const same = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', path.join(WORK, 'f', 'f00000.png'), '-i', path.join(WORK, 'f', `f${String(NF - 1).padStart(5, '0')}.png`), '-lavfi', 'psnr', '-f', 'null', '-'], { encoding: 'utf8' }).stderr.match(/average:([0-9.inf]+)/);
  console.log('first vs last frame PSNR', same && same[1]);

  // ---- sound: the game's cozy yard music, ticks, scratches, Noodle on top ----
  const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: REAL_AT - 0.05, name: 'adopt' }]]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64')); await ab.close();
  const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.45*sin(2*PI*660*t)*exp(-t*28)':s=44100:d=0.25", path.join(WORK, 'count.wav')]);
  ff(['-f', 'lavfi', '-i', 'anoisesrc=d=0.16:c=pink:a=0.5:r=44100', '-af', 'bandpass=f=2400:w=1800,afade=t=in:d=0.02,afade=t=out:st=0.08:d=0.08', path.join(WORK, 'scratch.wav')]);
  const EV = [['scratch', XAT], ['scratch', XAT + 0.16], ['tick', POP], ...COUNT.map((c) => ['count', c]), ...BEAT.map((b) => ['tick', b]), ['tick', LOOP + 0.1]];
  const fx = path.join(WORK, 'fx.wav');
  ff([...EV.flatMap(([n]) => ['-i', path.join(WORK, n + '.wav')]), '-filter_complex', EV.map(([, a], i) => { const d = Math.round(a * 1000); return `[${i}:a]aformat=channel_layouts=mono,adelay=${d}|${d}[e${i}]`; }).join(';') + ';'
    + EV.map((_, i) => `[e${i}]`).join('') + `amix=inputs=${EV.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ar', '44100', '-ac', '1', fx]);
  const voWav = path.join(WORK, 'voice.wav');
  ff([...VOAT.flatMap((v) => ['-i', path.join(VO, v.k + '.wav')]), '-filter_complex', VOAT.map((v, i) => { const d = Math.round(v.at * 1000); return `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`; }).join(';') + ';'
    + VOAT.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${VOAT.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
  const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
  const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
  const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
  const pre = path.join(WORK, 'premix.wav'), mixWav = path.join(WORK, 'mix.wav');
  ff(['-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', fx, '-filter_complex',
    `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${(T - 0.6).toFixed(2)}:d=0.6[m];[2:a]volume=-9dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
    '-map', '[a]', '-ar', '44100', pre]);
  const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
  ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  const mp4 = path.join(OUT, 'doodle-doggo-pick-a-coat.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
