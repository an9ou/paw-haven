// The "9, 45 or 900 coins?" Winter Market price-tier Reel (owner's go-ahead 24 Nov 2026: "Good, render it"; script, shots, hook scores and facts:
// docs/marketing/TIER_REEL.md). English cut only, 1080 x 1920, 30 fps. The Winter Market is open in the game from 23 Nov to 31 Dec 2026.
// The picture is the game footage of capture_tier.js (three real places on 24 Nov 2026, captured on the frozen page clock: the frames already hold
// the scene and Noodle). This script lays the words over it, in one block under Noodle (y 1146..1440): a big crayon price tag on the left (the tier,
// one to three crayon coins, the price) that pops in with the game's coin chime, and a card on the right (the game's own drawing of the item, its
// name and the game's own words about it); the hook's tag runs 9, 45, 900 with the voice; then the ask and our standard end card for 2.5 s.
// Every name, price and line is checked against main below; the build stops if one changed. Every frame: centreCheck(), safeCheck(), apartCheck()
// (../centre_text.js); the tag, the card and Noodle inside x 60..850, y 270..1440 and 28 px apart; Noodle, his whole drawn box, and the block 28 px
// clear of every stall, stand, cart, board and prop of the place in the frame.
// Voice: Noodle, Kokoro af_bella 1.1x (vo_tier.json via ../friends_reel/vo_friends.py). Music: the game's own Winter Market music (mods/pawaudio.js,
// place fmarket with fest winter) about 11 dB under the voice, the game's coin chime (PawAudio stinger 'coin') on every price tag.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/tier_reel/capture_tier.js <main> <caps dir> <vo dir>
//   ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/tier_reel/build_tier.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills, TS=a,b,...). FRAMES=a-b: re-render only frames a..b, then encode again with the same sound.
//   CHECK=1: every frame's checks without screenshots. LOOSE=1 (stills only, for layout work): print a failed check and go on.
const path = require('path'), fs = require('fs'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles } = require('../../../kids/endcard.js');
const { checkFrames } = require('../frozen_clock.js');
const { plan, CAM, ITEMS } = require('./capture_tier.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'tier_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
const CAPS = path.resolve(process.env.CAPS || path.join(WORK, 'caps'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
const VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'vo_tier.json'), 'utf8'));
for (const k of Object.keys(VOJSON)) if (VOJ.text[k] !== VOJSON[k]) throw new Error('the vo dir is not made from vo_tier.json: ' + k);
const P = plan(VOD), { beats: PB, B, LOOP, T, NF, NCAP, HOOKPOP, HOOKQ } = P;

// ---- the facts, checked against main (the game's own words and numbers) ----
const EN = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
const SRC = (f) => fs.readFileSync(path.join(ART_ROOT, 'game', 'src', f), 'utf8');
const need = (ok, what) => { if (!ok) throw new Error('the game changed: ' + what); };
const CORE = SRC('00_core.js'), YARD = SRC('03_yard.js'), MKT = SRC('49_market.js');
// the market's dates (CHANGELOG v2.31.10 and v2.31.11): 23 Nov to 31 Dec in 2026
need(/id: 'winter', theme: 'winter', name: 'Winter Market', win: \(y\) => \(y === 2026 \? \['11-23', '12-31'\] : \['12-01', '12-31'\]\)/.test(MKT), 'the Winter Market dates');
const CL = fs.readFileSync(path.join(ART_ROOT, 'CHANGELOG.md'), 'utf8');
need(/v2\.31\.10 Winter Market from 23 Nov \| Owner, 18 Nov: the Winter Market opens on 23 Nov 2026 00:00 JST/.test(CL) && /v2\.31\.11 Winter Market to 31 Dec \| Owner, 18 Nov: the Winter Market stays open until 31 Dec/.test(CL), 'CHANGELOG v2.31.10 / v2.31.11');
need(EN['fm.m_winter'] === 'Winter Market' && EN['fm.sign'] === '{market} · open until {date}', 'the market sign words');
// the three things: on the Winter Market's own table (in the right stall), the game's names, exact prices, and the lines the cards quote
const WIN = /id: 'winter'[\s\S]*?\} \},\n/.exec(MKT)[0];
const row = (src, n) => { const m = new RegExp("\\{ n: '" + n + "',[^\\n]*").exec(src); if (!m) throw new Error('no row for ' + n); return m[0]; };
const ROWS = { t1: row(CORE, 'Frozen Yoghurt Snowballs'), t2: row(CORE, 'Snowball Ball'), t3: row(CORE, 'Gingerbread Kennel') };
const KEYS = { t1: 'data.food.frozen_yoghurt_snowballs.n', t2: 'data.toys.snowball_ball.n', t3: 'data.houses.gingerbread_kennel.n' };
const STALL = { t1: 'treats', t2: 'toys', t3: 'homes' };
const QUOTE = { t1: 'Plain unsweetened yoghurt only, never a sweetened or light pot, which can hide xylitol. Dairy is a treat for dogs, so two or three little snowballs are plenty.',
  t2: 'a snowball that never melts', t3: 'A look, not a snack: it is wood all the way through.' };
for (const it of ITEMS) {
  need(new RegExp(STALL[it.k] + ": \\[[^\\]]*'" + it.n + "'").test(WIN), it.n + ' is not in the Winter Market\'s ' + STALL[it.k] + ' stall');
  need(EN[KEYS[it.k]] === it.n, 'the name ' + it.n);
  need(new RegExp('price: ' + it.price + '[,} ]').test(ROWS[it.k]) && /fest: 'winter', fm: true/.test(ROWS[it.k]), 'the price of ' + it.n + ' is not ' + it.price + ': ' + ROWS[it.k].slice(0, 160));
  need(ROWS[it.k].replace(/\\'/g, "'").includes(QUOTE[it.k]), 'the line of ' + it.n);
}
need(/snack: true/.test(ROWS.t1) && /tip: 'Plain unsweetened yoghurt only/.test(ROWS.t1), 'Frozen Yoghurt Snowballs is a snack with its dog-safe lesson');
need(/'Gingerbread Kennel', price: 900, bond: 3, comfort: 0\.25/.test(ROWS.t3), 'the Gingerbread Kennel row');
// the kennel in the yard: the game draws S.house in the yard, the dog house tap target is named after it
need(YARD.includes("<g id=\"houseG\" class=\"hot${isNight() ? ' night' : ''}\" tabindex=\"0\" role=\"button\" aria-label=\"${esc(tt('yard.label_dog_house', 'Dog house: {house}', { house: homeName(S.house) }))}\">${place(art('house', S.house), 620, 330, 240, 200)}</g>"), 'the yard draws S.house');
// the set (PawArt.WINTER_MARKET): the three are in it
{ const vm = require('vm'), win = {}, ctx = { window: win, console }; vm.createContext(ctx);
  for (const f of fs.readdirSync(path.join(ART_ROOT, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(ART_ROOT, 'world', f), 'utf8'), ctx);
  const WM = win.PawArt.WINTER_MARKET;
  need(WM.house === 'Gingerbread Kennel' && WM.toys.includes('Snowball Ball') && WM.treats.includes('Frozen Yoghurt Snowballs') && WM.toys.length === 5 && WM.treats.length === 3, 'PawArt.WINTER_MARKET: ' + JSON.stringify(WM)); }
// the game's coin chime (the price tags' sound)
need(/coin/.test(fs.readFileSync(path.join(ART_ROOT, 'mods', 'pawaudio.js'), 'utf8')), 'the PawAudio coin stinger');
// the capture (capture_tier.js): the game on 24 Nov 2026, the Winter Market the open market, the three items on sale, the kennel in the yard, the frozen clock
const FACTS = JSON.parse(fs.readFileSync(path.join(CAPS, 'facts.json'), 'utf8')), FR = FACTS.frames;
need(FACTS.date === '2026-11-24' && FACTS.jst === '2026-11-24' && FACTS.main === 'winter' && FACTS.place.fmarket.name === 'Winter Market' && FACTS.place.yard.name === 'Home Yard', 'the capture is not the Winter Market on 24 Nov 2026');
need(FACTS.items.every((i) => i.onSale) && FACTS.open.some((o) => o.id === 'winter' && o.from === '2026-11-23' && o.to === '2026-12-31'), 'the capture: what is on sale');
need(FACTS.place.yard.house === 'Dog house: Gingerbread Kennel' && /autumn/.test(FACTS.place.yard.scene), 'the capture: the kennel in the yard');
need(/frozen page clock/.test(FACTS.clock) && FACTS.n === NCAP && FR.length === NCAP && FR.every((f, i) => f.n === i), 'the capture is not this timeline (' + FACTS.n + ' frames, want ' + NCAP + '): capture again');
for (const k of Object.keys(VOD)) need(FACTS.vo[k] === VOD[k], 'the capture was timed to another voice take: ' + k);
for (const [pl, a, z, nd] of FACTS.draws) need(nd === 1, 'the game drew ' + pl + ' again during its take (frames ' + a + '..' + z + ')');
need(JSON.stringify(FACTS.CAM) === JSON.stringify(CAM), 'the capture was made with other cameras');

// ---- the places' things (world units, viewBox 0 0 1000 600): Noodle and the block keep 28 px clear of every one in the frame ----
// The market: read off the scene (path boxes and the ink of a 4x render; as winter_list_reel/build_winter.js KEEP), plus its floor props and our
// foreground things (capture: their visible shapes). The yard: its floor props and our foreground things (capture), plus the scene's own drawn
// things (sceneG paths: the house, the garden bed, the dig patch with its bone, the stepping stones, the washing line pole, the tree).
const KEEP = {
  fmarket: { driftL: [91, 460, 209, 482], driftR: [854, 464, 956, 484], decorStall: [25, 160, 303, 424], clothesStall: [352, 160, 648, 424], toysStall: [700, 160, 975, 424], homesBoard: [299.5, 414, 371, 458], homesStand: [295, 477.5, 375.5, 562.2],
    treatsBoard: [631, 414, 703, 458], treatsCart: [631, 466.5, 703, 568.5], sled: [0, 533, 127, 580], starLantern: [209, 396, 289, 486], firTree: [-21, 350, 81, 445], presents: [925, 398, 1002, 456] },
  yard: { house: [10, 95, 282, 350], gardenBed: [10, 437, 212, 587], digPatch: [470, 419, 569, 451], stones: [132, 343, 275, 429], washingPole: [572, 145, 605, 341], tree: [913, 160, 1069, 450] },
};
const propsOf = (cam) => Object.assign({}, KEEP[CAM[cam].place], FACTS.props[cam] || {});
for (const c of Object.keys(CAM)) need(Object.keys(FACTS.props[c] || {}).filter((k) => k.startsWith('fg:' + c + ':')).length === 3, 'the capture has no foreground things for ' + c);
need(FACTS.props.C3.house, 'the capture has no kennel box');
// the block under Noodle (frame px): the tag on the left, the card on the right; the ask's card is the whole block
// the tag at rest is 236 x 270 inside its 260 x 294 room: its pop overshoots by 8.5 % at most, from its left middle, and stays in the room
const BY = 1146, BH = 294, TAG = [60, BY + 12, 296, BY + BH - 12], TAGROOM = [60, BY, 320, BY + BH], CARD = [348, BY, 850, BY + BH], WHOLE = [60, BY, 850, BY + BH];
const gapPx = (a, b) => Math.max(b[0] - a[2], a[0] - b[2], b[1] - a[3], a[1] - b[3]);
// on a frame: a world box in frame px
const fbox = (f, q) => [(q[0] - f.x0) * f.S, (q[1] - f.y0) * f.S, (q[2] - f.x0) * f.S, (q[3] - f.y0) * f.S];
const inFrame = (b) => b[2] > 0 && b[0] < W && b[3] > 0 && b[1] < H;
function sceneCheck(n) { const f = FR[Math.min(n, NCAP - 1)], [l, t, r, b] = f.box, props = propsOf(f.cam);
  if (f.cam !== P.camAt(n / FPS + 1e-4).name) return 'the frame is not from the camera of its beat';
  if (l < 60 || r > 850 || t < 270 || b > 1440) return 'Noodle outside x 60..850, y 270..1440: ' + f.box + ' ' + f.pose + ' ' + f.expr;
  // Noodle on the floor: his feet on the open ground in front of the place (the drawing's floor or the floor going on in front of it)
  if (f.feet[1] < 560) return 'Noodle is not on the floor in front: ' + f.feet;
  const blockNow = P.beatAt(n / FPS + 1e-4).k === 'ask' ? [WHOLE] : [TAGROOM, CARD];
  for (const [k, q] of Object.entries(props)) { const pb = fbox(f, q); if (!inFrame(pb)) continue;
    const g = gapPx(f.box, pb); if (g < 28) return 'Noodle too close to ' + k + ' (' + Math.round(g) + ' px) ' + f.pose + ' ' + f.expr;
    for (const bl of blockNow) { const g2 = gapPx(bl, pb); if (g2 < 28) return 'the block too close to ' + k + ' (' + Math.round(g2) + ' px)'; } }
  return ''; }

// ---- the words ----
const price = (p) => String(p);
const TAGS = ITEMS.map((i) => ({ k: i.k, tier: 'Tier ' + i.tier, coins: i.tier, num: price(i.price), unit: 'coins' }));
const NAME = { t1: ['Frozen Yoghurt', 'Snowballs'], t2: ['Snowball Ball'], t3: ['Gingerbread', 'Kennel'] };
const CAP = { t1: ['Plain unsweetened yoghurt only.', 'Two or three are plenty.'], t2: ['A snowball that', 'never melts.'], t3: ['A look, not a snack.', 'Wood all the way through.'] };
const HOOK = { lines: ['What should your dog', 'get first?'], head: '9, 45 or 900 coins.' };
const ASK = { lines: ['Which tier', 'are you?'] };
const PLAY = 'Play free!';
for (const it of ITEMS) need(NAME[it.k].join(' ') === it.n, 'the card name of ' + it.n);
const allText = [HOOK.lines, HOOK.head, Object.values(NAME), Object.values(CAP), ASK.lines, PLAY, TAGS.map((x) => [x.tier, x.num, x.unit]), ' 0123456789'].flat(3).join(' ');
// house words (README): no em dash, no "breed" as a verb, no "sell", no itch.io, only our website
if (/—|\bbreed(s|ing)?\b|\bsell|itch/i.test(allText + JSON.stringify(VOJSON))) throw new Error('a word the house rules ban: ' + allText);
if (T < 20 || T > 30) throw new Error('the Reel is ' + T.toFixed(2) + ' s, not 20..30');
const inner = (s) => s.trim().replace(/^<\?xml[^>]*>/, '').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/g, '');
const LOGO_INNER = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8')).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');
// the game's own item drawings (PawArt.item of main, saved by the capture), 64 x 64
const itemSyms = ITEMS.map((it) => { const s = fs.readFileSync(path.join(CAPS, 'items', it.k + '.svg'), 'utf8'); if (!/viewBox="0 0 64 64"/.test(s) || />\?<\/text>/.test(s)) throw new Error('no item drawing for ' + it.n);
  return `<symbol id="it_${it.k}" viewBox="0 0 64 64">${inner(s)}</symbol>`; }).join('');
const BEATS = PB.map((b) => Object.assign({}, b));

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#fff}svg{display:block}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${itemSyms}</defs>
<image id="bg" x="0" y="0" width="${W}" height="${H}"/><g id="ov"></g><g id="ec"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const $=(i)=>document.getElementById(i), F='Caveat', CX=455, PLAY=${JSON.stringify(PLAY)};
const BEATS=${JSON.stringify(BEATS)}, LOOP=${LOOP}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())}, HOOK=${JSON.stringify(HOOK)}, ASK=${JSON.stringify(ASK)};
const TAGS=${JSON.stringify(TAGS)}, NAME=${JSON.stringify(NAME)}, CAP=${JSON.stringify(CAP)}, HOOKPOP=${JSON.stringify(HOOKPOP)}, TAG=${JSON.stringify(TAG)}, TAGROOM=${JSON.stringify(TAGROOM)}, CARD=${JSON.stringify(CARD)}, WHOLE=${JSON.stringify(WHOLE)};
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);};
const back=(x)=>{ x=cl(x); const c=1.9; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
function fitS(s,max,w){ let z=max; while(z>20){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// text centred in its own (unseen) box
function tbox(x, y, w, h, L){ return '<g data-box><rect x="'+f2(x)+'" y="'+f2(y)+'" width="'+f2(w)+'" height="'+f2(h)+'" fill="none"/>'+centred(L, x+w/2, y+h/2, F).svg+'</g>'; }
// a crayon coin: a gold disc with a darker rim, an inner ring and a little paw (drawn, no emoji)
function coin(cx, cy, r){ const p=(dx,dy,rr)=>'<ellipse cx="'+f2(cx+dx*r)+'" cy="'+f2(cy+dy*r)+'" rx="'+f2(rr*r)+'" ry="'+f2(rr*r*1.15)+'" fill="#C98A1E"/>';
  return '<circle cx="'+f2(cx)+'" cy="'+f2(cy)+'" r="'+f2(r)+'" fill="#F6C945" stroke="${PEN}" stroke-width="4"/>'
    +'<circle cx="'+f2(cx)+'" cy="'+f2(cy)+'" r="'+f2(r*0.72)+'" fill="none" stroke="#D9A42B" stroke-width="2.5"/>'
    +'<path d="M'+f2(cx-r*0.55)+' '+f2(cy-r*0.62)+'q'+f2(r*0.2)+' '+f2(-r*0.12)+' '+f2(r*0.42)+' '+f2(-r*0.02)+'" fill="none" stroke="#FFF3C4" stroke-width="3" stroke-linecap="round"/>'
    +p(0,0.22,0.24)+p(-0.3,-0.12,0.1)+p(-0.1,-0.3,0.1)+p(0.1,-0.3,0.1)+p(0.3,-0.12,0.1); }
// the price tag: a crayon shop tag (cut top corners, a hole), the tier, n crayon coins, the price; pops in from u = 0 (a bounce and a little swing)
function tagG(tg, u, op){ const [x0,y0,x1,y1]=TAG, w=x1-x0, cx=(x0+x1)/2, ch=40, k=u>=1?1:1-0.4*Math.exp(-u*10)*Math.cos(u*20);
  if(u<0) return '';
  const body='M'+(x0+ch)+' '+y0+'H'+(x1-ch)+'L'+x1+' '+(y0+ch)+'V'+(y1-18)+'Q'+x1+' '+y1+' '+(x1-18)+' '+y1+'H'+(x0+18)+'Q'+x0+' '+y1+' '+x0+' '+(y1-18)+'V'+(y0+ch)+'Z';
  let m='<path data-apart="tag" d="'+body+'" fill="#FFE7A3" stroke="${PEN}" stroke-width="7" stroke-linejoin="round"/>';
  m+='<path d="M'+(x0+ch+10)+' '+(y0+12)+'H'+(x1-ch-10)+'" stroke="#F3CF73" stroke-width="5" stroke-linecap="round"/>';
  m+='<circle cx="'+cx+'" cy="'+(y0+27)+'" r="10" fill="${CREAM}" stroke="${PEN}" stroke-width="4"/>';
  m+=tbox(x0+16, y0+42, w-32, 46, [{s:tg.tier,size:fitS(tg.tier,44,w-40),fill:'${RED}'}]);
  const r=20, gp=48, cx0=cx-(tg.coins-1)*gp/2; for(let i=0;i<tg.coins;i++) m+=coin(cx0+i*gp, y0+116, r);
  m+=tbox(x0+12, y0+138, w-24, 88, [{s:tg.num,size:fitS('900',112,w-36)}]);
  m+=tbox(x0+16, y0+226, w-32, 36, [{s:tg.unit,size:40,fill:'#8A5A3C'}]);
  const pcx=x0, pcy=(y0+y1)/2;
  return '<g opacity="'+f2(op*sm(u/0.08+0.4))+'"><g transform="translate('+f2(pcx)+' '+f2(pcy)+') scale('+k.toFixed(4)+') translate('+f2(-pcx)+' '+f2(-pcy)+')">'+m+'</g></g>'; }
// the card: the game's own drawing of the item, its name, the game's own words about it
function cardG(k, op, u){ const [x0,y0,x1,y1]=CARD, w=x1-x0, s=0.95+0.05*sm(u/0.22), cx=(x0+x1)/2, cy=(y0+y1)/2;
  let m='<rect data-apart="card" x="'+x0+'" y="'+y0+'" width="'+w+'" height="'+(y1-y0)+'" rx="34" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>';
  m+='<rect x="'+(x0+20)+'" y="'+(y0+20)+'" width="134" height="134" rx="22" fill="#FFF3CF" stroke="${PEN}" stroke-width="4"/><use href="#it_'+k+'" x="'+(x0+31)+'" y="'+(y0+31)+'" width="112" height="112"/>';
  const nm=NAME[k], nz=Math.min.apply(null, nm.map((s)=>fitS(s, nm.length>1?54:60, 300)));
  m+=tbox(x0+168, y0+20, w-188, 134, nm.map((s)=>({s,size:nz,fill:'${RED}',pitch:nz*1.02})));
  const c=CAP[k], cz=Math.min.apply(null, c.map((s)=>fitS(s,46,w-48)));
  m+=tbox(x0+20, y0+166, w-40, 110, c.map((s)=>({s,size:cz,pitch:cz*1.12})));
  return '<g opacity="'+f2(op)+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(s)+') translate('+f2(-cx)+' '+f2(-cy)+')">'+m+'</g>'; }
// a card of lines (the hook's question on the right; the ask over the whole block, with a crayon arrow down to the comments)
function linesCard(box, op, L, arrow){ const [x0,y0,x1,y1]=box, w=x1-x0;
  let m='<rect data-apart="card" x="'+x0+'" y="'+y0+'" width="'+w+'" height="'+(y1-y0)+'" rx="34" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>';
  const tw=arrow?w-150:w; m+=tbox(x0+20, y0+20, tw-40, y1-y0-40, L);
  if(arrow){ const ax=x1-92, ay0=y0+70, ay1=y1-70; m+='<path d="M'+ax+' '+ay0+'C'+(ax+14)+' '+(ay0+50)+' '+(ax-12)+' '+(ay1-60)+' '+ax+' '+ay1+'M'+(ax-34)+' '+(ay1-38)+'L'+ax+' '+ay1+'L'+(ax+32)+' '+(ay1-40)+'" fill="none" stroke="${RED}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>'; }
  return '<g opacity="'+f2(op)+'">'+m+'</g>'; }
window.frame=function(t, N){
  let ov='';
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1;
  let i=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) i=j;
  const b=BEATS[i], lt=t-b.at, cop=fade*(i===0?1:sm((lt+0.06)/0.14));
  if(fade>0){
    if(b.k==='hook'){
      // the tag runs Tier 1 (on screen from the first frame), Tier 2, Tier 3 with the voice; the question card stays
      let j=0; for(let q=0;q<HOOKPOP.length;q++) if(lt>=HOOKPOP[q]-0.0001) j=q;
      ov+=tagG(TAGS[j], j===0?1:lt-HOOKPOP[j], fade);
      ov+=linesCard(CARD, fade, [{s:HOOK.head,size:fitS(HOOK.head,54,440),fill:'${RED}',pitch:66}].concat(HOOK.lines.map((s)=>({s,size:fitS(s,58,440),pitch:62}))));
    } else if(b.k==='ask'){ ov+=linesCard(WHOLE, cop, ASK.lines.map((s)=>({s,size:fitS(s,96,560),pitch:96})), true);
    } else { const tg=TAGS.find((x)=>x.k===b.k); ov+=tagG(tg, lt+0.06, cop); ov+=cardG(b.k, fade*sm((lt-0.06)/0.14), lt-0.06); }
    // Noodle's drawn box on this frame of the take (from the capture), so the checks see him
    ov+='<rect data-apart="Noodle" x="'+N.box[0]+'" y="'+N.box[1]+'" width="'+f2(N.box[2]-N.box[0])+'" height="'+f2(N.box[3]-N.box[1])+'" fill="none"/>';
  }
  // the end card (brand/kids/endcard.js) 70 px lower, with "Play free!" over the logo (as winter_list_reel)
  let ec=''; if(end){ ec='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/><g transform="translate(0 70)">'+endCard('tall',HANDLES,LOGO_INNER)+'</g>'
    +centred([{s:PLAY,size:76,fill:'${RED}'}],CX,412,F).svg+'</g>'; }
  $('ov').innerHTML=ov; $('ec').innerHTML=ec;
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; ');
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ');
  // the tag, the card and Noodle: inside x 60..850, y 270..1440 (the tag's bounce included)
  for(const e of $('ov').querySelectorAll('[data-apart]')){ const r=e.getBoundingClientRect(); if(!r.width) continue; let o=1; for(let p=e;p&&p.id!=='ov';p=p.parentNode) if(p.getAttribute('opacity')!=null) o*=+p.getAttribute('opacity'); if(o<=0.05) continue;
    if(r.right>854||r.left<56||r.top<266||r.bottom>1444) return 'outside x 60..850, y 270..1440: '+e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  if(end){ const lg=$('ec').querySelector('.endcard svg').getBoundingClientRect(), tx=[...$('ec').querySelectorAll(':scope>g>text')].find((e)=>e.textContent===PLAY);
    const r=tx.getBoundingClientRect(); if(lg.top-r.bottom<20) return 'end card: "'+PLAY+'" too close to the logo ('+Math.round(lg.top-r.bottom)+' px)'; }
  return ''; };
window.bg=async function(src){ const im=$('bg'); if(im.getAttribute('href')===src) return; const pre=new Image(); pre.src=src; await pre.decode(); im.setAttribute('href',src); await new Promise((r)=>requestAnimationFrame(()=>requestAnimationFrame(r))); };
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html);
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const ht = Object.values(handles()).join('') + 'doodledoggo.app', latin = allText.replace(/[^\x20-\x7e]/g, '');
  await p.evaluate(([txt, ht]) => Promise.all([document.fonts.load('700 40px Caveat', txt + ht), document.fonts.load('700 40px Andika', ht)]), [latin, ht]);
  if (!(await p.evaluate(([txt, ht]) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', ht), [latin, ht]))) throw new Error('Caveat or Andika did not load');
  await p.evaluate(() => document.fonts.ready); fs.unlinkSync(pageFile);
  console.log('T =', T.toFixed(2), 's (', LOOP.toFixed(2), 's before the end card ),', NF, 'frames,', NCAP, 'of the take; beats at', BEATS.map((v) => v.k + ' ' + v.at.toFixed(2) + ' (' + v.hold.toFixed(2) + ') ' + v.cam).join(', '));
  const seq = (n) => 'file://' + path.join(CAPS, 'seq', 'f' + String(Math.min(n, NCAP - 1)).padStart(5, '0') + '.png');
  const one = async (fi, shot, file) => { const t = fi / FPS + 1e-4, N = FR[Math.min(fi, NCAP - 1)];   // +1e-4: the frame-index nudge (fi/FPS can land a hair under a beat start)
    let err = t < LOOP + 0.22 ? sceneCheck(fi) : '';
    if (shot) await p.evaluate((s) => window.bg(s), seq(fi));
    err = err || (await p.evaluate(([t, N]) => window.frame(t, N), [t, { box: N.box }]));
    if (err) { if (process.env.LOOSE) console.log('CHECK', t.toFixed(2), err.slice(0, 300)); else throw new Error(err + ' at ' + t.toFixed(2) + ' (frame ' + fi + ')'); }
    if (shot) await p.screenshot({ path: file }); };
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, 0.8, 1.9, 3.5, ...BEATS.slice(1).flatMap((x) => [x.at + 0.12, x.at + 0.5, x.at + x.hold * 0.8]), LOOP + 1.2, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await one(Math.round(t * FPS), true, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  if (process.env.CHECK) { for (let fi = 0; fi < NF; fi++) await one(fi, false); console.log('all', NF, 'frames pass the checks'); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  const FD = path.join(WORK, 'f');
  for (const fi of fr) { await one(fi, true, path.join(FD, `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close();
  for (let fi = NF; fs.existsSync(path.join(FD, `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(FD, `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's Winter Market music, its coin chime on every price tag, Noodle on top (kept from the last full render when FRAMES is set) ----
  const mixWav = path.join(WORK, 'mix.wav');
  if (!process.env.FRAMES || !fs.existsSync(mixWav)) {
    const pops = HOOKPOP.map((a) => B.hook + a).concat(ITEMS.map((it) => B[it.k]));
    const coins = pops.map((at, i) => ({ at: Math.max(0.02, at), name: 'coin', amount: [9, 45, 900, 9, 45, 900][i] }));
    const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
    const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
    const r = await ap.evaluate(async ([s, st]) => { const o = await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
      segments: [{ at: 0, ctx: { place: 'fmarket', fest: 'winter', time: 'day', weather: 'sunny' } }], stingers: st }); return { wav: o.wav }; }, [T + 0.5, coins]);
    fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(r.wav, 'base64')); await ab.close(); console.log('music: the Winter Market (fmarket, fest winter), coin chimes at', pops.map((x) => x.toFixed(2)).join(', '));
    const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
    ff(['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
    const EV = [['tick', B.hook + HOOKQ]]; for (const k of ['t1', 't2', 't3', 'ask']) EV.push(['tick', B[k] + 0.06]); EV.push(['tick', LOOP + 0.15]);
    const fx = path.join(WORK, 'fx.wav');
    ff([...EV.flatMap(([n]) => ['-i', path.join(WORK, n + '.wav')]), '-filter_complex', EV.map(([, a], i) => { const d = Math.round(a * 1000); return `[${i}:a]aformat=channel_layouts=mono,adelay=${d}|${d}[e${i}]`; }).join(';') + ';'
      + EV.map((_, i) => `[e${i}]`).join('') + `amix=inputs=${EV.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ar', '44100', '-ac', '1', fx]);
    const voWav = path.join(WORK, 'voice.wav'), VOAT = BEATS.map((v) => ({ k: v.k, at: v.at }));
    ff([...VOAT.flatMap((v) => ['-i', path.join(VO, v.k + '.wav')]), '-filter_complex', VOAT.map((v, i) => { const d = Math.round(v.at * 1000); return `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`; }).join(';') + ';'
      + VOAT.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${VOAT.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
    const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
    const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
    const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
    const pre = path.join(WORK, 'premix.wav');
    ff(['-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', fx, '-filter_complex',
      `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${LOOP.toFixed(2)}:d=${(T - LOOP).toFixed(2)}[m];[2:a]volume=-12dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
      '-map', '[a]', '-ar', '44100', pre]);
    const r2 = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r2.slice(r2.lastIndexOf('{')));
    ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  }
  const mp4 = path.join(OUT, 'doodle-doggo-winter-tiers.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(FD, 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
  // ---- frame by frame (../frozen_clock.js checkFrames): every run of game footage between two beat cuts (the camera drifting, Noodle's own pose
  // animation). A run starts 3 frames after its beat's first frame (the cut and the card's pop) and ends 2 frames before the next. Doubled = a frame that
  // barely changes; jumps (over 3x the run's median) are listed with what they are: the price tag's pop, a face coming on, a step of the game's crayon
  // pose animation (drawn about three times a second) ----
  const fN = (t) => Math.round(t * FPS + 1e-4);
  const events = []; HOOKPOP.forEach((a) => events.push([fN(B.hook + a), 'tag pop'])); PB.slice(1).forEach((b) => events.push([fN(b.at - 0.06), 'tag pop, card']));
  for (const c of P.cues) if (c.expr || c.pose) events.push([fN(c.t), 'pose/face ' + (c.pose || '') + ' ' + (c.expr || '')]);
  let bad = 0; const report = [];
  for (let i = 0; i < BEATS.length; i++) { const a = fN(BEATS[i].at - 0.06) + 3, z = (i + 1 < BEATS.length ? fN(BEATS[i + 1].at - 0.06) : fN(LOOP)) - 2;
    const c = checkFrames(mp4, a, z); bad += c.doubled.length;
    const lab = c.jumps.map((j) => { const e = events.filter(([f]) => j >= f && j <= f + 12).map(([, s]) => s); return j + (e.length ? ' (' + e.join(', ') + ')' : ' (pose step)'); });
    const lo = Math.min(...c.diffs.map((x) => x[1]));
    report.push([BEATS[i].k, a + '..' + z, c.median, lo, c.doubled, lab]);
    console.log('checkFrames', BEATS[i].k, BEATS[i].cam, a + '..' + z, 'median', c.median, 'smallest', lo, 'doubled', JSON.stringify(c.doubled), 'jumps', JSON.stringify(lab)); }
  fs.writeFileSync(path.join(WORK, 'checkframes.json'), JSON.stringify(report));
  console.log('runs:', bad ? bad + ' doubled frames to look at' : 'no doubled frames');
})().catch((e) => { console.error(e); process.exit(1); });
