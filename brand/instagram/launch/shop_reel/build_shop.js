// v2.24 "Kind shop" launch Reel (PREPARED FOR LAUNCH: do not post before the owner's launch date; docs/marketing/KIND_SHOP_REEL.md).
// Told by Noodle the dachshund (Kokoro af_bella 1.1x, vo_shop.json), about 34 s (the last 2.5 s our end card), 1080 x 1920, 30 fps. Every word follows V224.md on the
// claude/kind-shop branch (the contract): the shop rule, the item names, "also for coins", made by one person. No prices anywhere in the video.
//   hook     "We opened a shop! You can't buy a dog in it."  card at frame 1, twelve of the shop's own item pictures, plain Noodle "not in the shop"
//   sup      the Supporter Pack: the REAL game yard with the Golden Paw Cottage (capture_shop.js), then the Golden Name Tag, the Founding Friend
//            badge and Gerald's thank-you letter as cards; "He means it."
//   tokyo    Noodle dressed piece by piece by the game's own dog renderer (dogs/pawart_dogs.js on the branch): Sukajan Jacket, Bucket Hat,
//            Round Shades, Paw Tote, then Little Sneakers on the new feet slot: "Yes. I have sneakers now."
//   cozy     the REAL game house with the Cozy Winter set placed, the camera panning to the Cardboard Fireplace: "The fireplace is cardboard."
//   tools    the Robo Scoop, the Garden Sprinkler and the Auto Water Bowl, each with its switch going off (V224.md 1: each can be switched off)
//   trust    the shop rule, line by line (V224.md 0 and 1)
//   end      "Made by one person. Free to play. Thank you for helping!" + the logo
//   card     our standard end card (owner, 9 Nov 2026; brand/kids/endcard.js: the logo, doodledoggo.app, Instagram, X and YouTube with icons
//            and handles), 2.5 s, the music fading out under it; nothing spoken
// The item art is the branch's own (world/pawart_shop.js PawArt.SHOP / PawArt.item, dogs/pawart_dogs.js wearables), loaded as the game loads it.
// Every frame: centreCheck(), safeCheck() (text and boxes inside x 60..850, y 270..1440) and apartCheck() (../centre_text.js); the build stops on a miss.
// Music: the game's cozy yard music (mods/pawaudio.js) about 11 dB under the voice (~30%), a crayon tick per pop.
//
//   VO_LINES=brand/instagram/launch/shop_reel/vo_shop.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir>
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/shop_reel/capture_shop.js <kind-shop checkout> <cap dir>
//   ART_ROOT=<kind-shop checkout> CAP=<cap dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/shop_reel/build_shop.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills); ONLY=cover: shop-cover.jpg. FRAMES=a-b: re-render only frames a..b (the rest of WORK/f stays), then
//   encode again. Output next to this file: doodle-doggo-kind-shop.mp4
const path = require('path'), fs = require('fs'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles } = require('../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = path.resolve(process.env.ART_ROOT || ROOT);
if (!fs.existsSync(path.join(ART_ROOT, 'world', 'pawart_shop.js'))) throw new Error('ART_ROOT must be a checkout of claude/kind-shop (world/pawart_shop.js)');
const WORK = path.resolve(process.argv[2] || 'shop_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo')), CAP = path.resolve(process.env.CAP || path.join(WORK, 'cap'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', YEL = '#FFE3A1', PINK = '#F28FA5', GREEN = '#4E9A54', BLUE = '#A9CBEA', MINT = '#CDEBD8';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
const VOX = JSON.parse(fs.readFileSync(path.join(__dirname, 'vo_shop.json'), 'utf8'));
for (const k of Object.keys(VOX)) if (VOJ.text[k] !== VOX[k]) throw new Error('the vo dir is not vo_shop.json (line ' + k + '): rerun vo_friends.py');

// ---- the facts, from the branch's own code (nothing typed from memory) ----
const KSRC = fs.readFileSync(path.join(ART_ROOT, 'game', 'src', '52_kindshop.js'), 'utf8');
const arr = (name) => { const m = new RegExp('const ' + name + " = \\[([^\\]]+)\\]").exec(KSRC); if (!m) throw new Error('no ' + name + ' in 52_kindshop.js'); return m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')); };
const TOKYO = arr('KS_TOKYO'), COZY = arr('KS_COZY_DECOR').concat(['Tea-Cosy Bed']);
if (!/KS_COZY_BED = 'Tea-Cosy Bed'/.test(KSRC) || !/KS_HOUSE = 'Golden Paw Cottage'/.test(KSRC) || !/KS_TAG = 'Golden Name Tag'/.test(KSRC)) throw new Error('kind shop names changed');
if (!/robo: \{[^}]*coins: 4000/.test(KSRC) || !/sprinkler: \{[^}]*coins: 2500/.test(KSRC) || !/bowl: \{[^}]*coins: 2500/.test(KSRC) || !/KS_LOOK_COINS = 600/.test(KSRC)) throw new Error('the coin prices changed: check the trust card');
if (/supporter: \{[^}]*coins:/.test(KSRC)) throw new Error('the Supporter Pack is for coins now: the trust line changes');
const WHY = /'ks\.why_text', '([^']+)'/.exec(KSRC); if (!WHY || !/made by one person/.test(WHY[1]) || !/complete without paying/.test(WHY[1]) || !/Dogs, Bond and chances are never in the shop/.test(WHY[1])) throw new Error('the "Why is there a shop?" line changed');
const V224 = fs.readFileSync(path.join(ART_ROOT, 'V224.md'), 'utf8');
const RULE = 'We sell coins and looks, never dogs, Bond, welfare or chances. No loot boxes or random paid rewards, and the game is complete without paying.';
if (!V224.includes(RULE)) throw new Error('the shop rule in V224.md changed');
console.log('Tokyo Street:', TOKYO.join(', '), '| Cozy Winter:', COZY.join(', '));

// ---- the voice and the timeline ----
const VOAT = {}; let at = 0.1; const ORDER = [];
const say = (k, gap) => { VOAT[k] = at; ORDER.push(k); at += VOD[k] + gap; return VOAT[k]; };
say('hook', 0.3); say('sup', 0.14); say('supb', 0.3); say('tokyo', 0.42); say('tokyob', 0.3); say('cozy', 0.18); say('cozyb', 0.3); say('tools', 0.3); say('trust', 0.3); say('end', 0.85);
const ENDC = at, T = ENDC + 2.5, NF = Math.round(T * FPS); // ENDC: the standard end card, 2.5 s (owner, 9 Nov 2026)
const BEATS = { hook: [0, VOAT.sup - 0.12], sup: [VOAT.sup - 0.12, VOAT.tokyo - 0.15], tokyo: [VOAT.tokyo - 0.15, VOAT.cozy - 0.12], cozy: [VOAT.cozy - 0.12, VOAT.tools - 0.15],
  tools: [VOAT.tools - 0.15, VOAT.trust - 0.15], trust: [VOAT.trust - 0.15, VOAT.end - 0.15], end: [VOAT.end - 0.15, ENDC], card: [ENDC, T + 1] };
// cue points inside a line (Kokoro gives no word times: fractions of the line, by its words)
const cue = (k, word) => { const tx = VOJ.text[k], i = tx.indexOf(word); if (i < 0) throw new Error('no "' + word + '" in ' + k); return VOAT[k] + VOD[k] * (i / tx.length); };
const CUE = {
  cottage: cue('sup', 'golden cottage'), tag: cue('sup', 'name tag'), letter: cue('sup', 'thank-you letter'),
  jacket: VOAT.tokyo + 0.05, hat: VOAT.tokyo + 0.42, shades: VOAT.tokyo + 0.8, tote: VOAT.tokyo + 1.18, sneakers: cue('tokyob', 'sneakers'),
  robo: cue('tools', 'Robo'), sprinkler: cue('tools', 'sprinkler'), bowl: cue('tools', 'water bowl'), off: cue('tools', 'Switch them off'), never: cue('trust', 'Never dogs'), earn: cue('trust', 'Everything'), complete: VOAT.trust + VOD.trust - 0.55,
  free: cue('end', 'Free to play'), thanks: cue('end', 'Thank you'),
};
// subtitles: the payoff lines (the rest is on the cards)
const SUBS_TX = { supb: ['He means it.'], tokyob: ['Yes. I have sneakers now.'], cozyb: ['The fireplace is cardboard.', "Don't tell anyone."] };
const SUBS = [];
for (const [k, parts] of Object.entries(SUBS_TX)) { if (parts.join(' ') !== VOJ.text[k]) throw new Error('subtitles differ from the voice: ' + k);
  const wt = parts.map((x) => x.length + 6), sum = wt.reduce((a, b) => a + b, 0); let t0 = VOAT[k]; parts.forEach((x, i) => { const d = VOD[k] * wt[i] / sum; SUBS.push({ a: t0, b: t0 + d + 0.3, s: x }); t0 += d; }); }
SUBS.forEach((u, i) => { const nx = SUBS[i + 1]; if (nx && nx.a < u.b) u.b = nx.a; });

// ---- the footage (capture_shop.js): the frames and their game times ----
const clipOf = (name) => { const dir = path.join(CAP, name), ts = JSON.parse(fs.readFileSync(path.join(dir, 'ts.json'), 'utf8')); return { dir, ts, n: ts.length }; };
const CLIP = { yard: clipOf('yard'), house: clipOf('house') };
const TX = {
  hook: ['We opened a shop.', "You can't buy a dog in it."], notDog: 'Noodle: not in the shop', sup: 'Supporter Pack', cottage: 'Golden Paw Cottage',
  supCards: [['Golden', 'Name Tag'], ['Founding', 'Friend badge'], ["Gerald's", 'thank-you letter']],
  tokyo: 'Tokyo Street', tokyoSub: '6 outfits', feetNew: 'NEW: a feet slot!', cozy: 'Cozy Winter', cozySub: '6 things for your house',
  cozyList: [COZY.slice(0, 3).join(' · '), COZY.slice(3).join(' · ')], tools: 'Comfort tools', toolNames: [['Robo', 'Scoop'], ['Garden', 'Sprinkler'], ['Auto', 'Water Bowl']],
  settings: 'switch them off any time', hand: 'the hand way always works', on: 'on', off: 'off',
  rule: 'Our shop rule', rules: [['No loot boxes.', 'No random paid rewards.'], ['Never dogs, Bond,', 'welfare or chances.'], ['Looks packs and tools:', 'also for coins, by playing.'], ['The game is complete', 'without paying.']],
  end: ['Made by one person.', 'Free to play.', 'Thank you for helping!'], cover: ['We opened a shop.', "You can't buy a dog in it."], coverTag: 'NEW: the Kind shop',
};
// the cozy list must be the branch's names, in its order (COZY is read from 52_kindshop.js)
const TOOLS = ['Robo Scoop', 'Garden Sprinkler', 'Auto Water Bowl'];
TX.toolNames.forEach((p, i) => { if (p.join(' ') !== TOOLS[i]) throw new Error('tool name ' + TOOLS[i]); });
const NOODLE = { body: 'Sukajan Jacket', head: 'Bucket Hat', eyes: 'Round Shades', neck: 'Paw Tote', feet: 'Little Sneakers' };
Object.values(NOODLE).forEach((n) => { if (!TOKYO.includes(n)) throw new Error(n + ' is not in Tokyo Street'); });
const LOGO_INNER = fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<title>[^<]*<\/title>/, '').trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');
const ARTS = ['dogs/pawart_dogs.js', ...fs.readdirSync(path.join(ART_ROOT, 'world')).filter((f) => /^pawart_world_[a-g]\.js$/.test(f)).sort().map((f) => 'world/' + f), 'world/pawart_shop.js'];

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
${ARTS.map((a) => `<script src="file://${path.join(ART_ROOT, a)}"></script>`).join('\n')}
<style>html,body{margin:0;background:${PAPER}}svg{display:block}#art .pa-d-f0,#art .pa-d-f1,#art .pa-d-f2{display:none}#art .k0 .pa-d-f0,#art .k1 .pa-d-f1,#art .k2 .pa-d-f2{display:inline}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>
<pattern id="hatch" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(-35)"><path d="M0 7H14" stroke="${PEN}" stroke-width="2.2" stroke-linecap="round" opacity=".12"/></pattern>
<clipPath id="win"><rect id="winR" x="0" y="0" width="10" height="10" rx="30"/></clipPath>
</defs><g id="bg"></g><g id="foot" opacity="0"><g id="footC"><svg id="footS" x="0" y="0" width="${W}" height="${H}" viewBox="0 0 1179 1977" preserveAspectRatio="xMidYMid slice"><image id="fimg" x="0" y="0" width="1179" height="1977" href=""/></svg></g><rect id="footB" fill="none" stroke="${PEN}" stroke-width="8" rx="30"/></g><g id="art"></g><g id="ov"></g></svg>
<span style="font:700 20px Caveat">a</span>
<script>
${CENTRE_JS}
${SAFE_JS}
SAFE.x1=850; // this Reel: inside x 60..850 (the brief), y 270..1440
const $=(i)=>document.getElementById(i), F='Caveat', CX=SAFE_CX, TX=${JSON.stringify(TX)}, SUBS=${JSON.stringify(SUBS)}, VOAT=${JSON.stringify(VOAT)}, VOD=${JSON.stringify(VOD)};
const B=${JSON.stringify(BEATS)}, CUE=${JSON.stringify(CUE)}, T=${T}, CLIP=${JSON.stringify({ yard: { dir: CLIP.yard.dir, ts: CLIP.yard.ts }, house: { dir: CLIP.house.dir, ts: CLIP.house.ts } })};
const TOOLS=${JSON.stringify(TOOLS)}, NOODLE=${JSON.stringify(NOODLE)}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())}, ENDC=${ENDC};
${ENDCARD_JS}
let ENDCARD=null;
const clamp=(x,a,b)=>Math.max(a==null?0:a,Math.min(b==null?1:b,x)), sm=(x)=>{ x=clamp(x); return x*x*(3-2*x); }, eo=(x)=>1-Math.pow(1-clamp(x),3);
const back=(x,c)=>{ x=clamp(x); c=c||1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const f2=(n)=>Math.round(n*100)/100, lerp=(a,b,u)=>a+(b-a)*u;
const inner=(s)=>s.trim().replace(/^<svg[^>]*>/,'').replace(/<\\/svg>\\s*$/,''), vbOf=(s)=>{ const m=/viewBox="([^"]+)"/.exec(s); return m?m[1].split(/[ ,]+/).map(Number):[0,0,100,100]; };
// ---- the drawings: the branch's own art ----
const A=window.PawArt, SH=A.SHOP, ART={}, VB={};
function put(id,svg){ if(!svg) throw new Error('no art for '+id); ART[id]=inner(svg); VB[id]=vbOf(svg); }
['Golden Name Tag','Founding Friend Badge','Thank-You Letter','Robo Scoop','Garden Sprinkler','Auto Water Bowl','Cable-Knit Rug','Cocoa Mug Lamp','Doggy Snow Globe','Cardboard Fireplace','Woolly Armchair','Tea-Cosy Bed'].forEach((n)=>put(n,SH.prop(n)));
put('Golden Paw Cottage',A.house('Golden Paw Cottage')); put('lampLit',A.prop('kslamp',{lit:1}));
['Sukajan Jacket','Bucket Hat','Little Sneakers','Paw Tote','Round Shades','Lucky Cat Charm'].forEach((n)=>put(n,A.item(n)));
const dress=(keys)=>{ const o={}; keys.forEach((k)=>{ o[k]=NOODLE[k]; }); return o; };
put('plainSit',A.dog('dachs',{pose:'sit'}));
const STEPS=[[],['body'],['body','head'],['body','head','eyes'],['body','head','eyes','neck'],['body','head','eyes','neck','feet']];
STEPS.forEach((ks,i)=>put('dress'+i,A.dog('dachs',{pose:'idle',outfit:dress(ks)})));
put('dressHappy',A.dog('dachs',{pose:'happy',outfit:NOODLE})); put('dressSit',A.dog('dachs',{pose:'sit',outfit:NOODLE}));
if(A.DOGS.find((d)=>d.key==='dachs').name!=='Noodle') throw new Error('the dachshund is not Noodle');
for(const id of Object.keys(ART)) if(/^(plain|dress)/.test(id)&&!ART[id].includes('pa-d-f2')) throw new Error('no line boil in '+id);
let BOX={};
const artG=(id)=>'<g transform="translate('+(-VB[id][0])+' '+(-VB[id][1])+')">'+ART[id]+'</g>';
function measure(){ const g=$('art'); for(const id of Object.keys(ART)){ g.innerHTML='<g class="k0">'+artG(id)+'</g>'; const b=g.firstChild.getBBox(); BOX[id]=[b.x,b.y,b.width,b.height]; } g.innerHTML=''; return Object.keys(BOX).length; }
// a drawing by its drawn box: centre x, bottom y, fitted into maxW x maxH, scaled by z around its bottom
function place(id,cx,bot,maxW,maxH,z,k,o){ o=o||{}; const b=BOX[id], s0=Math.min(maxW/b[2],maxH/b[3])*(z==null?1:z);
  return '<g'+(o.op!=null?' opacity="'+f2(o.op)+'"':'')+(o.apart?' data-apart="'+o.apart+'"':'')+' class="k'+(k||0)+'" transform="translate('+f2(cx)+' '+f2(bot)+')'+(o.rot?' rotate('+f2(o.rot)+')':'')+' scale('+s0.toFixed(4)+') translate('+f2(-(b[0]+b[2]/2))+' '+f2(-(b[1]+b[3]))+')">'+artG(id)+'</g>'; }
function fitS(s,size,maxW){ while(size>20){ const k=inkOf(s,size,F); if(k.L+k.R<=maxW) return size; size-=2; } return size; }
const card=(x,y,w,h,lines,o)=>{ o=o||{}; return '<g data-box'+(o.op!=null?' opacity="'+f2(o.op)+'"':'')+'><rect x="'+f2(x)+'" y="'+f2(y)+'" width="'+f2(w)+'" height="'+f2(h)+'" rx="'+(o.rx||30)+'" fill="'+(o.fill||'${CREAM}')+'" stroke="'+(o.stroke||'${PEN}')+'" stroke-width="'+(o.sw||6)+'"/>'+(lines&&lines.length?centred(lines,x+w/2,y+h/2,F).svg:'')+'</g>'; };
// a pop: scale 0 -> 1 with a little overshoot around (cx, cy)
const pop=(t0,t,cx,cy,s)=>{ const u=0.5+0.5*back((t-t0)/0.28,1.2), o=sm((t-t0)/0.12); return o<=0?null:'<g opacity="'+f2(o)+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(Math.max(0.01,u))+') translate('+f2(-cx)+' '+f2(-cy)+')">'+s+'</g>'; };
const popS=(t0,t,cx,cy,s)=>pop(t0,t,cx,cy,s)||'';
function header(s,cy,fill,t0,t,sub){ let o=popS(t0,t,CX,cy,'<g transform="rotate(-2 '+CX+' '+cy+')">'+pill(s,CX,cy,fitS(s,72,600),F,{fill:fill||'${YEL}',padX:36})+'</g>');
  if(sub) o+=popS(t0+0.15,t,CX,cy+82,pill(sub,CX,cy+82,fitS(sub,44,560),F,{fill:'${CREAM}',padX:24})); return o; }
function sub(t,y){ const u=SUBS.find((x)=>t>=x.a&&t<x.b); if(!u) return ''; const o=Math.min(sm((t-u.a)/0.08),sm((u.b-t)/0.08));
  return pill(u.s,CX,y,fitS(u.s,58,700),F,{fill:'${PEN}',stroke:'${PEN}',color:'${PAPER}',padX:30,op:(0.95*o).toFixed(3)}); }
function blob(cx,cy,r,col,seed,op,sy){ let p=''; const n=26, rnd=(i)=>{ const x=Math.sin(seed*91.7+i*12.9898)*43758.5453; return x-Math.floor(x); };
  for(let i=0;i<n;i++){ const a=i/n*Math.PI*2, rr=r*(0.93+rnd(i)*0.1); p+=(i?'L':'M')+f2(cx+Math.cos(a)*rr)+' '+f2(cy+Math.sin(a)*rr*(sy||0.96)); }
  p+='Z'; return '<g opacity="'+op+'"><path d="'+p+'" fill="'+col+'"/><path d="'+p+'" fill="url(#hatch)"/></g>'; }
// an item card: a cream card with the art and its name (two lines) under it
function itemCard(id,x,y,w,h,name,k,o){ o=o||{}; const nh=name?86:0; let s='<g data-safe><rect x="'+f2(x)+'" y="'+f2(y)+'" width="'+f2(w)+'" height="'+f2(h)+'" rx="26" fill="'+(o.fill||'${CREAM}')+'" stroke="${PEN}" stroke-width="5"/></g>';
  s+=place(id,x+w/2,y+h-nh-14,w-36,h-nh-34,1,k);
  if(name) s+='<g data-box><rect x="'+f2(x+12)+'" y="'+f2(y+h-nh-6)+'" width="'+f2(w-24)+'" height="'+(nh-8)+'" rx="18" fill="none" stroke="none"/>'+centred(name.map((n)=>({s:n,size:fitS(n,34,w-40),pitch:36})),x+w/2,y+h-nh-6+(nh-8)/2,F).svg+'</g>';
  return s; }
// a crayon switch: a rounded track, the knob left (off) or right (on)
function toggle(cx,cy,u){ const w=96,h=48, x=cx-w/2, col=u>0.5?'${GREEN}':'#C9BFB4', kx=lerp(x+h/2,x+w-h/2,u);
  return '<g data-safe><rect x="'+x+'" y="'+(cy-h/2)+'" width="'+w+'" height="'+h+'" rx="'+(h/2)+'" fill="'+col+'" stroke="${PEN}" stroke-width="4"/><circle cx="'+f2(kx)+'" cy="'+cy+'" r="'+(h/2-7)+'" fill="${CREAM}" stroke="${PEN}" stroke-width="4"/></g>'; }
function check(cx,cy,o){ return '<g opacity="'+f2(o)+'"><circle cx="'+cx+'" cy="'+cy+'" r="26" fill="${MINT}" stroke="${PEN}" stroke-width="4"/><path d="M'+(cx-12)+' '+(cy+1)+' L'+(cx-3)+' '+(cy+11)+' L'+(cx+14)+' '+(cy-10)+'" fill="none" stroke="${GREEN}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>'; }
// ---- the footage: a frame of a clip at clip time u, shown through a window (viewBox in the 1179 x 1977 capture: iPhone 15, 393 x 659 at 3x) ----
let curHref='';
function foot(name,u,vb,win){ const c=CLIP[name]; let i=0; while(i<c.ts.length-1&&c.ts[i+1]<=u) i++; const href='file://'+c.dir+'/'+String(i).padStart(5,'0')+'.jpg';
  const S=$('footS'); S.setAttribute('viewBox',vb.join(' ')); S.setAttribute('x',win[0]); S.setAttribute('y',win[1]); S.setAttribute('width',win[2]); S.setAttribute('height',win[3]);
  const R=$('winR'); ['x','y','width','height'].forEach((a,j)=>R.setAttribute(a,win[j])); R.setAttribute('rx',win[4]||0); $('footC').setAttribute('clip-path','url(#win)');
  const Bd=$('footB'); ['x','y','width','height'].forEach((a,j)=>Bd.setAttribute(a,win[j])); Bd.setAttribute('rx',win[4]||0); Bd.setAttribute('stroke-width',win[4]?8:0);
  $('foot').setAttribute('opacity',1);
  if(href===curHref) return null; curHref=href; const im=$('fimg');
  return new Promise((ok,no)=>{ const tm=setTimeout(()=>no(new Error('footage frame did not load '+href)),8000); im.onload=()=>{ clearTimeout(tm); ok(); }; im.onerror=()=>{ clearTimeout(tm); no(new Error('footage '+href)); }; im.setAttribute('href',href); }); }
const inB=(t,b)=>t>=B[b][0]&&t<B[b][1];
const PAPERBG='<rect width="${W}" height="${H}" fill="${PAPER}"/>';

function scene(t){ let bg=PAPERBG, art='', ov='', wait=null; const k=Math.floor(t/0.13)%3; $('foot').setAttribute('opacity',0);
  if(inB(t,'hook')){
    bg+=blob(CX,860,430,'#FFF0B8',3,0.55,1.1);
    // twelve of the shop's own pictures, popping in around the hook (the hook card is there from frame 1)
    const G=['Golden Paw Cottage','Golden Name Tag','Founding Friend Badge','Thank-You Letter','Sukajan Jacket','Bucket Hat','Little Sneakers','Round Shades','Cocoa Mug Lamp','Doggy Snow Globe','Woolly Armchair','Robo Scoop'];
    const cw=170,ch=150,gx=20,gy=18, x0=CX-(4*cw+3*gx)/2, y0=575;
    G.forEach((id,i)=>{ const x=x0+(i%4)*(cw+gx), y=y0+Math.floor(i/4)*(ch+gy);
      const s='<g data-safe><rect x="'+x+'" y="'+y+'" width="'+cw+'" height="'+ch+'" rx="22" fill="${CREAM}" stroke="${PEN}" stroke-width="4"/></g>'+place(id,x+cw/2,y+ch-14,cw-30,ch-28,1,k);
      art+=s; }); // all there at frame 1, with the hook
    art+=place('plainSit',CX,1338,330,300,1,k,{apart:'noodle'});
    ov+=popS(1.0,t,CX,1408,pill(TX.notDog,CX,1408,fitS(TX.notDog,42,520),F,{fill:'${PINK}',padX:24}));
    ov+='<g transform="rotate(-2 '+CX+' 400)">'+card(CX-360,290,720,220,[{s:TX.hook[0],size:fitS(TX.hook[0],80,660),pitch:96},{s:TX.hook[1],size:fitS(TX.hook[1],76,660)}],{sw:7})+'</g>';
  } else if(inB(t,'sup')){
    const t0=B.sup[0]; bg+=blob(CX,1120,460,'#FFE9B0',7,0.45,0.8);
    // the real game yard: the Golden Paw Cottage is Noodle's dog house (the clip at 0.75x, held on its last frame)
    const win=[115,420,720,470,30], vb=[150,1150,1000,1000*470/720];
    wait=foot('yard',(t-t0)*0.75,vb,win);
    ov+=header(TX.sup,330,'${YEL}',t0,t);
    ov+=popS(CUE.cottage,t,CX,890,pill(TX.cottage,CX,890,fitS(TX.cottage,46,520),F,{fill:'${CREAM}',padX:26}));
    const cw=225,gx=22,x0=CX-(3*cw+2*gx)/2, y0=975, chh=300, ids=['Golden Name Tag','Founding Friend Badge','Thank-You Letter'], at=[CUE.tag,CUE.tag+0.25,CUE.letter];
    ids.forEach((id,i)=>{ const x=x0+i*(cw+gx); let s=itemCard(id,x,y0,cw,chh,TX.supCards[i],k);
      if(i===2&&t>=VOAT.supb) s='<g transform="rotate('+f2(Math.sin((t-VOAT.supb)*14)*2.5*(1-sm((t-VOAT.supb)/0.9)))+' '+(x+cw/2)+' '+(y0+chh/2)+')">'+s+'</g>';
      art+=popS(at[i],t,x+cw/2,y0+chh/2,s); });
    ov+=sub(t,1375);
  } else if(inB(t,'tokyo')){
    const t0=B.tokyo[0]; bg+=blob(CX,800,420,'#DDF1E6',11,0.6,1.0);
    ov+=header(TX.tokyo,330,'${MINT}',t0,t,TX.tokyoSub);
    const step=t<CUE.jacket?0:t<CUE.hat?1:t<CUE.shades?2:t<CUE.tote?3:t<CUE.sneakers?4:5, id=step===5&&t>CUE.sneakers+0.35?'dressHappy':'dress'+step;
    const z=1+0.05*(1-sm((t-[0,CUE.jacket,CUE.hat,CUE.shades,CUE.tote,CUE.sneakers][step])/0.22))*(step?1:0);
    art+=place(id,CX,1050,720,560,z,k,{apart:'noodle'});
    // the names, two columns, each as its piece goes on (the Lucky Cat Charm with the tote: one neck item at a time)
    const N=[['Sukajan Jacket',CUE.jacket],['Bucket Hat',CUE.hat],['Round Shades',CUE.shades],['Paw Tote',CUE.tote],['Lucky Cat Charm',CUE.tote+0.2],['Little Sneakers',CUE.sneakers]];
    N.forEach(([n,a],i)=>{ const cx=i%2?665:285, cy=1135+Math.floor(i/2)*78; ov+=popS(a,t,cx,cy,pill(n,cx,cy,fitS(n,40,330),F,{fill:i===5?'${PINK}':'${CREAM}',padX:20})); });
    if(t>=CUE.sneakers) ov+=popS(CUE.sneakers+0.1,t,CX,1078,'<g transform="rotate(-3 '+CX+' 1078)">'+pill(TX.feetNew,CX,1078,fitS(TX.feetNew,40,300),F,{fill:'${YEL}',padX:18})+'</g>');
    ov+=sub(t,1390);
  } else if(inB(t,'cozy')){
    // the real game house, full screen: the capture's view (y 445..1977 of the 1179 x 1977 phone shot) fills the height; the crop drifts with the pan
    const t0=B.cozy[0], vh=1532, vw=vh*1080/1920, u=Math.max(0,t-t0)*1.15, last=CLIP.house.ts[CLIP.house.ts.length-1];
    wait=foot('house',u,[lerp(1179-vw,0,sm(u/last)),445,vw,vh],[0,0,1080,1920,0]);
    ov+=header(TX.cozy,330,'${PINK}',t0,t,TX.cozySub);
    ov+=popS(t0+0.5,t,CX,535,card(CX-360,480,720,110,TX.cozyList.map((l)=>({s:l,size:fitS(l,36,660),pitch:42})),{sw:5,rx:24}));
    ov+=sub(t,900); // above the Cardboard Fireplace, clear of it and of Noodle
  } else if(inB(t,'tools')){
    const t0=B.tools[0]; bg+=blob(CX,760,430,'#E3EEF8',5,0.7,1.0);
    ov+=header(TX.tools,330,'${BLUE}',t0,t);
    const cw=226,gx=20,x0=CX-(3*cw+2*gx)/2, y0=430, chh=360, at=[CUE.robo,CUE.sprinkler,CUE.bowl];
    TOOLS.forEach((id,i)=>{ const x=x0+i*(cw+gx); art+=popS(at[i],t,x+cw/2,y0+chh/2,itemCard(id,x,y0,cw,chh,TX.toolNames[i],k)); });
    // the switches: on, then off one by one as Noodle says it, then back on (each tool can be switched off in Settings; the hand way always works)
    const pt=t0+0.9; if(t>=pt){ let s=card(CX-360,860,720,260,[],{sw:5,rx:28});
      s+=centred([{s:TX.settings,size:fitS(TX.settings,44,660)}],CX,920,F).svg;
      TOOLS.forEach((n,i)=>{ const x=x0+i*(cw+gx)+cw/2, a=CUE.off+0.15+i*0.22, u=1-sm((t-a)/0.18)+sm((t-(B.tools[1]-0.75)-i*0.08)/0.18); s+=toggle(x,1040,clamp(u)); s+=centred([{s:clamp(u)>0.5?TX.on:TX.off,size:34}],x,1095,F).svg; });
      ov+=popS(pt,t,CX,990,s); }
    ov+=popS(CUE.off+0.9,t,CX,1250,'<g transform="rotate(-1.5 '+CX+' 1250)">'+pill(TX.hand,CX,1250,fitS(TX.hand,48,640),F,{fill:'${YEL}',padX:26})+'</g>');
  } else if(inB(t,'trust')){
    const t0=B.trust[0]; bg+=blob(CX,860,470,'#FFF0B8',9,0.5,1.15);
    ov+=header(TX.rule,330,'${YEL}',t0,t);
    const at=[VOAT.trust,CUE.never,CUE.earn,CUE.complete], ys=[530,750,970,1190];
    TX.rules.forEach((L,i)=>{ const cy=ys[i]; const s=card(CX-350,cy-90,700,180,L.map((l)=>({s:l,size:fitS(l,52,600),pitch:62})),{sw:5,rx:28,fill:i===1?'#FDE3E8':'${CREAM}'})+check(CX-350,cy-90,1);
      ov+=popS(at[i],t,CX,cy,s); });
  } else { if(t<ENDC+0.3){
    const t0=B.end[0]; bg+=blob(CX,760,430,'#FDE3E8',13,0.55,1.0);
    const at=[t0+0.1,CUE.free,CUE.thanks], ys=[350,450,550];
    TX.end.forEach((l,i)=>{ ov+=popS(at[i],t,CX,ys[i],pill(l,CX,ys[i],fitS(l,i===2?66:58,680),F,{fill:i===2?'${PINK}':'${CREAM}',padX:28})); });
    art+=place('dressSit',CX,1110,560,430,1,k,{apart:'noodle'});
    const lw=500, lh=lw*280/900; ov+=popS(t0+0.3,t,CX,1300,'<svg data-safe x="'+(CX-lw/2)+'" y="'+f2(1300-lh/2)+'" width="'+lw+'" height="'+f2(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg>'); }
    // the standard end card (owner, 9 Nov 2026): paper and the card fade in over the thank-you page
    if(t>=ENDC){ if(!ENDCARD) ENDCARD=endCard('tall',HANDLES,LOGO_INNER); ov+='<g opacity="'+f2(sm((t-ENDC)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+ENDCARD+'</g>'; }
  }
  $('bg').innerHTML=bg; $('art').innerHTML=art; $('ov').innerHTML=ov; return wait; }
function checks(where){ const bad=centreCheck($('st')); if(bad.length) return where+': not centred: '+bad.join('; ');
  const out=safeCheck($('st')); if(out.length) return where+': outside SAFE: '+out.join('; ');
  const ap=apartCheck($('st')); if(ap.length) return where+': dogs too close: '+ap.join('; '); return ''; }
window.frame=async function(t){ const w=scene(t); if(w) await w; return checks('t '+t.toFixed(2)); };

// ---- the cover: its own design (not a frame): the hook, Noodle in the Tokyo Street set, six item pictures, the logo; key content in the 1:1 crop y 420..1500
window.cover=function(){ let bg=PAPERBG+blob(CX,960,470,'#FFF0B8',21,0.6,1.05), art='', ov='';
  ov+='<g transform="rotate(-2 '+CX+' 557)">'+card(CX-375,452,750,210,[{s:TX.cover[0],size:fitS(TX.cover[0],84,680),pitch:98},{s:TX.cover[1],size:fitS(TX.cover[1],78,680)}],{sw:7})+'</g>';
  const ring=[['Golden Paw Cottage',210,890],['Cocoa Mug Lamp',740,880],['Little Sneakers',190,1120],['Robo Scoop',760,1110],['Doggy Snow Globe',205,1305],['Golden Name Tag',745,1305]];
  ring.forEach(([id,x,y],i)=>{ const cw=190,ch=170; art+='<g transform="rotate('+(i%2?4:-4)+' '+x+' '+y+')"><g data-safe><rect x="'+(x-cw/2)+'" y="'+(y-ch/2)+'" width="'+cw+'" height="'+ch+'" rx="24" fill="${CREAM}" stroke="${PEN}" stroke-width="5"/></g>'+place(id,x,y+ch/2-14,cw-30,ch-30,1,0)+'</g>'; });
  art+=place('dressHappy',CX,1250,320,320,1,0,{apart:'noodle'});
  ov+='<g transform="rotate(3 '+CX+' 735)">'+pill(TX.coverTag,CX,735,fitS(TX.coverTag,50,440),F,{fill:'${PINK}',padX:26})+'</g>';
  const lw=420, lh=lw*280/900; ov+='<svg data-safe x="'+(CX-lw/2)+'" y="'+f2(1435-lh/2)+'" width="'+lw+'" height="'+f2(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg>';
  $('bg').innerHTML=bg; $('art').innerHTML=art; $('ov').innerHTML=ov; $('foot').setAttribute('opacity',0);
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  for(const e of $('st').querySelectorAll('#ov > *, #art > *')){ const b=e.getBoundingClientRect(); if(b.top<420||b.bottom>1500||b.left<0||b.right>1080) return 'cover: outside the 1:1 crop: '+(e.textContent||e.tagName).slice(0,30)+' '+[b.left,b.top,b.right,b.bottom].map(Math.round); }
  return ''; };
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: W, height: H } }); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html);
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  if (errs.length) throw new Error('page: ' + errs.join(' | '));
  const allText = JSON.stringify(TX) + SUBS.map((s) => s.s).join(' ') + '0123456789' + Object.values(handles()).join('') + 'doodledoggo.app';
  await p.evaluate((txt) => Promise.all(['700 40px Caveat', '700 40px Andika'].map((f) => document.fonts.load(f, txt))), allText); await p.evaluate(() => document.fonts.ready);
  if (!(await p.evaluate((txt) => document.fonts.check('700 40px Andika', txt) && document.fonts.check('700 40px Caveat', txt), allText))) throw new Error('Andika or Caveat did not load');
  console.log('drawings', await p.evaluate(() => window.measure())); fs.unlinkSync(pageFile);
  console.log('T =', T.toFixed(2), 's,', NF, 'frames; voice at', ORDER.map((k) => k + ' ' + VOAT[k].toFixed(2)).join(', '));
  const render = async (t, file, o) => { const err = await p.evaluate((t) => window.frame(t), t); if (err) throw new Error(err); await p.screenshot(Object.assign({ path: file }, o || {})); };
  if (process.env.ONLY === 'cover') { const err = await p.evaluate(() => window.cover()); if (err) throw new Error(err);
    const f = path.join(OUT, 'shop-cover.jpg'); await p.screenshot({ path: f, type: 'jpeg', quality: 92 }); console.log('wrote', f); await b.close(); return; }
  if (process.env.ONLY === 'stills') {
    const ts = process.env.STRIP ? process.env.STRIP.split(',').map(Number) : [0, 1.6, CUE.letter + 0.4, VOAT.supb + 0.3, CUE.tote + 0.3, CUE.sneakers + 0.6, VOAT.cozy + 0.6, VOAT.cozyb + 1.6, CUE.off + 0.5, BEATS.tools[1] - 0.3, CUE.earn + 0.4, BEATS.trust[1] - 0.1, CUE.thanks + 0.5, T - 0.05];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  for (const fi of fr) { await render(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); if (fi % 150 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close();

  // ---- sound: the game's cozy yard music ~11 dB under Noodle, a crayon tick per pop ----
  const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: BEATS.end[0] + 0.05, name: 'discover' }]]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64')); await ab.close();
  const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.3*sin(2*PI*520*t)*exp(-t*30)':s=44100:d=0.15", path.join(WORK, 'click.wav')]);
  const EV = [...Object.values(BEATS).slice(1, 6).map((b) => ['tick', b[0] + 0.02]), ['tick', CUE.cottage], ['tick', CUE.tag], ['tick', CUE.letter],
    ...['jacket', 'hat', 'shades', 'tote', 'sneakers'].map((x) => ['tick', CUE[x]]), ...[0, 1, 2].map((i) => ['click', CUE.off + 0.15 + i * 0.22]),
    ['tick', CUE.never], ['tick', CUE.earn], ['tick', CUE.complete]].filter(([, a]) => a > 0 && a < T - 0.2);
  const fx = path.join(WORK, 'fx.wav');
  ff([...EV.flatMap(([n]) => ['-i', path.join(WORK, n + '.wav')]), '-filter_complex', EV.map(([, a], i) => { const d = Math.round(a * 1000); return `[${i}:a]aformat=channel_layouts=mono,adelay=${d}|${d}[e${i}]`; }).join(';') + ';'
    + EV.map((_, i) => `[e${i}]`).join('') + `amix=inputs=${EV.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ar', '44100', '-ac', '1', fx]);
  const voWav = path.join(WORK, 'voice.wav');
  ff([...ORDER.flatMap((k) => ['-i', path.join(VO, k + '.wav')]), '-filter_complex', ORDER.map((k, i) => { const d = Math.round(VOAT[k] * 1000); return `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`; }).join(';') + ';'
    + ORDER.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${ORDER.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
  const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
  const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
  const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
  const pre = path.join(WORK, 'premix.wav'), mixWav = path.join(WORK, 'mix.wav');
  ff(['-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', fx, '-filter_complex',
    `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${ENDC.toFixed(2)}:d=${(T - ENDC).toFixed(2)}[m];[2:a]volume=-9dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
    '-map', '[a]', '-ar', '44100', pre]);
  const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
  ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  const mp4 = path.join(OUT, 'doodle-doggo-kind-shop.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
