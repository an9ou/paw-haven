// The "Noodle's Winter Market shopping list" Reel (owner's go-ahead 18 Nov 2026; script, shot table and facts: docs/marketing/WINTER_LIST_REEL.md).
// English cut only, 1080 x 1920, 30 fps. To post when the Winter Market opens (Mon 23 Nov 2026 00:00 JST, open until 31 Dec).
// The picture is one continuous take of the game's own Winter Market place with Noodle the dachshund as the game's leader dog, captured on the
// frozen page clock by capture_winter.js (the frames already hold the scene and Noodle). This script lays the words over it: the hook card, Noodle's
// list (five real Winter Market items and "everything"), one list line per stop with the game's own item drawing, its exact price and a crayon tick,
// the ask, then our standard end card (brand/kids/endcard.js) for 2.5 s. Every name, price and line is checked against main below; the build stops
// if one changed. Every frame: centreCheck(), safeCheck(), apartCheck() (../centre_text.js), every card and Noodle inside x 60..850, y 270..1440,
// the cards 28 px clear of the market's bunting, Noodle's feet on the market floor and, whenever he stands, 28 px clear of every stall, stand, board
// and prop (while he walks to the Toys stall and back he passes in front of the Treats cart, as dogs do in the game's front row).
// Voice: Noodle, Kokoro af_bella 1.1x (vo_winter.json via ../friends_reel/vo_friends.py). Music: the game's own Winter Market music
// (mods/pawaudio.js, place fmarket with fest winter) about 11 dB under the voice, the game's coin chime on every tick.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/winter_list_reel/capture_winter.js <main> <caps dir> <vo dir>
//   ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/winter_list_reel/build_winter.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills, TS=a,b,...). FRAMES=a-b: re-render only frames a..b, then encode again with the same sound.
//   CHECK=1: every frame's checks without screenshots. LOOSE=1 (stills only, for layout work): print a failed check and go on.
//   VARIANT=open: the second hook, "The Winter Market is open!" (for a post after the opening night). Only the hook frames are rendered again
//   (WORK/f_open); the rest are the main cut's frames. Writes doodle-doggo-winter-list-open.mp4. Run the main cut first.
const path = require('path'), fs = require('fs'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles } = require('../../../kids/endcard.js');
const { checkFrames } = require('../frozen_clock.js');
const { plan, ITEMS, S, OY, FLOOR_Y } = require('./capture_winter.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'winter_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
const CAPS = path.resolve(process.env.CAPS || path.join(WORK, 'caps'));
const OPEN = process.env.VARIANT === 'open';
for (const d of ['f', 'stills', 'f_open']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C', GREEN = '#3E9B4F';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
const VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'vo_winter.json'), 'utf8'));
for (const k of Object.keys(VOJSON)) if (VOJ.text[k] !== VOJSON[k]) throw new Error('the vo dir is not made from vo_winter.json: ' + k);
const P = plan(VOD), { beats: PB, B, LOOP, T, NF, NCAP, TICK } = P;

// ---- the facts, checked against main (the game's own words and numbers) ----
const EN = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
const SRC = (f) => fs.readFileSync(path.join(ART_ROOT, 'game', 'src', f), 'utf8');
const need = (ok, what) => { if (!ok) throw new Error('the game changed: ' + what); };
const CORE = SRC('00_core.js'), YARD = SRC('03_yard.js'), MKT = SRC('49_market.js'), FAIR = SRC('49_funfair.js');
// the market's dates (CHANGELOG v2.31.10 and v2.31.11): 23 Nov to 31 Dec in 2026; the 5 Harvest items until 30 Nov; the 2 New Year items from 27 Dec
need(/id: 'winter', theme: 'winter', name: 'Winter Market', win: \(y\) => \(y === 2026 \? \['11-23', '12-31'\] : \['12-01', '12-31'\]\)/.test(MKT), 'the Winter Market dates');
need(/id: 'harvest'[^\n]*win: \(\) => \['10-01', '11-30'\],\s*items: \{ clothes: \['Leaf Beret', 'Autumn Scarf'\], treats: \['Baked Pumpkin Wedges', 'Sweet Potato Coins', 'Warm Bone Broth'\] \}/.test(MKT), 'the Harvest Market items and dates');
need(/id: 'newyear'[^\n]*win: \(\) => \['12-27', '01-07'\], tent: '01-01'/.test(MKT) && /items: \{ decor: \['Kadomatsu Pair'\], treats: \['Pup Kinton'\] \}/.test(MKT), 'the New Year items and dates');
const CL = fs.readFileSync(path.join(ART_ROOT, 'CHANGELOG.md'), 'utf8');
need(/v2\.31\.10 Winter Market from 23 Nov \| Owner, 18 Nov: the Winter Market opens on 23 Nov 2026 00:00 JST/.test(CL) && /v2\.31\.11 Winter Market to 31 Dec \| Owner, 18 Nov: the Winter Market stays open until 31 Dec/.test(CL), 'CHANGELOG v2.31.10 / v2.31.11');
need(EN['fm.m_winter'] === 'Winter Market' && EN['fm.sign'] === '{market} · open until {date}', 'the market sign words');
// the five things on the list: on the Winter Market's own table, the game's names, exact prices, and the lines the cards quote
const WIN = /id: 'winter'[\s\S]*?\} \},\n/.exec(MKT)[0];
const row = (src, n) => { const m = new RegExp("\\{ n: '" + n + "',[^\\n]*").exec(src) || new RegExp("'" + n + "': \\{[^\\n]*").exec(src); if (!m) throw new Error('no row for ' + n); return m[0]; };
const ROWS = { k1: row(CORE, 'Gingerbread Kennel'), k2: row(CORE, 'Polar Bear Hood'), k3: row(CORE, 'Snowball Ball'), k4: row(CORE, 'Frozen Yoghurt Snowballs'), k5: row(YARD, 'Star Lantern') };
const KEYS = { k1: 'data.houses.gingerbread_kennel.n', k2: 'data.clothes.polar_bear_hood.n', k3: 'data.toys.snowball_ball.n', k4: 'data.food.frozen_yoghurt_snowballs.n', k5: 'data.hm_decor.star_lantern.n' };
const QUOTE = { k1: 'A look, not a snack: it is wood all the way through.', k2: 'Warm: no shivering in the snow.', k3: 'a snowball that never melts',
  k4: 'Plain unsweetened yoghurt only, never a sweetened or light pot, which can hide xylitol. Dairy is a treat for dogs, so two or three little snowballs are plenty.',
  k5: 'After dark it glows and puts stars on the snow.' };
for (const it of ITEMS) {
  need(WIN.includes("'" + it.n + "'"), it.n + ' is not on the Winter Market table');
  need(EN[KEYS[it.k]] === it.n, 'the name ' + it.n);
  need(new RegExp('price: ' + it.price + '[,} ]').test(ROWS[it.k]) && /fest: 'winter', fm: true/.test(ROWS[it.k]), 'the price of ' + it.n + ' is not ' + it.price + ': ' + ROWS[it.k].slice(0, 160));
  need(ROWS[it.k].replace(/\\'/g, "'").includes(QUOTE[it.k]), 'the line of ' + it.n);
}
need(/snack: true/.test(ROWS.k4), 'Frozen Yoghurt Snowballs is a snack');
need(/const WARM_WEAR = \[[^\]]*'Puffer Jacket', 'Polar Bear Hood'\]/.test(CORE), 'the Puffer Jacket and the Polar Bear Hood are warm wear');
need(/toys: \{ day: 30 \}/.test(FAIR), 'FF_CAPS.toys');
// the set (PawArt.WINTER_MARKET): 5 yard decorations, 10 costumes, 5 toys, the Gingerbread Kennel and 4 beds, 3 treats
{ const vm = require('vm'), win = {}, ctx = { window: win, console }; vm.createContext(ctx);
  for (const f of fs.readdirSync(path.join(ART_ROOT, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(ART_ROOT, 'world', f), 'utf8'), ctx);
  const WM = win.PawArt.WINTER_MARKET;
  need(Object.keys(WM.decor).length === 5 && WM.costumes.length === 10 && WM.toys.length === 5 && WM.house === 'Gingerbread Kennel' && WM.beds.length === 4 && WM.treats.length === 3, 'the Winter Market set: ' + JSON.stringify(WM));
  need(Object.values(WM.decor).includes('Star Lantern') && WM.costumes.includes('Polar Bear Hood') && WM.toys.includes('Snowball Ball') && WM.treats.includes('Frozen Yoghurt Snowballs'), 'the list items are in PawArt.WINTER_MARKET'); }
// the capture (capture_winter.js): the game on 23 Nov 2026, the Winter Market the open market, the five items on sale, the frozen clock
const FACTS = JSON.parse(fs.readFileSync(path.join(CAPS, 'facts.json'), 'utf8')), FR = FACTS.frames;
need(FACTS.date === '2026-11-23' && FACTS.jst === '2026-11-23' && FACTS.main === 'winter' && FACTS.place.name === 'Winter Market', 'the capture is not the Winter Market on 23 Nov 2026');
need(FACTS.items.every((i) => i.onSale) && FACTS.open.some((o) => o.id === 'harvest' && o.to === '2026-11-30') && FACTS.open.some((o) => o.id === 'winter' && o.from === '2026-11-23' && o.to === '2026-12-31'), 'the capture: what is on sale');
need(/frozen page clock/.test(FACTS.clock) && FACTS.n === NCAP && FR.length === NCAP && Math.abs(FACTS.S - S) < 1e-9, 'the capture is not this timeline (' + FACTS.n + ' frames, want ' + NCAP + '): capture again');
for (const k of Object.keys(VOD)) need(FACTS.vo[k] === VOD[k], 'the capture was timed to another voice take: ' + k);
need(new Set(FR.map((f) => f.dressed)).size === 1, 'the game drew the scene again during the take');

// ---- the market's own things in world units (viewBox 0 0 1000 600; read off the scene: path boxes and the ink of a 4x render) ----
const KEEP = { decorStall: [25, 160, 303, 424], clothesStall: [352, 160, 648, 424], toysStall: [700, 160, 975, 424], homesBoard: [299.5, 414, 371, 458], homesStand: [295, 477.5, 375.5, 562.2],
  treatsBoard: [631, 414, 703, 458], treatsCart: [631, 466.5, 703, 568.5], sled: [0, 533, 127, 580], starLantern: [209, 396, 289, 486], firTree: [-21, 350, 81, 445], presents: [925, 398, 1002, 456] };
// the top of the bunting, roofs and lanterns per 25 units of x (the highest ink of the scene): the cards stay 28 px above it
const SKYTOP = [150, 153, 155, 160, 162, 164, 167, 168, 169, 160, 160, 165, 160, 158, 154, 149, 144, 137, 134, 128, 128, 133, 136, 144, 149, 154, 158, 161, 164, 160, 160, 169, 168, 166, 165, 162, 160, 155, 153, 150];
const ZONE = FACTS.place.zone;   // the game's own floor for dogs at the market (37_roam.js): feet y 424..588, x 60..940
// Noodle on a frame: feet on the floor; standing: 28 px clear of everything; walking: the Treats cart may be behind him
let passCart = 0;
function noodleCheck(n) { const f = FR[Math.min(n, NCAP - 1)], [l, t, r, b] = f.box, wx = (x) => x / S + f.x0, wy = (y) => (y - OY) / S;
  if (f.feet[1] < ZONE.y0 || f.feet[1] > ZONE.y1 || f.feet[0] < ZONE.x0 || f.feet[0] > ZONE.x1 || Math.abs(f.feet[1] - FLOOR_Y) > 0.01) return 'Noodle off the market floor: ' + f.feet;
  if (l < 60 || r > 850 || t < 270 || b > 1440) return 'Noodle outside x 60..850, y 270..1440: ' + f.box;
  for (const [k, q] of Object.entries(KEEP)) { const g = Math.max(q[0] - wx(r), wx(l) - q[2], q[1] - wy(b), wy(t) - q[3]) * S;
    if (g < 28) { if (f.walk && k === 'treatsCart') { passCart++; continue; } return 'Noodle ' + (f.walk ? '(walking) ' : '') + 'too close to the market\'s ' + k + ' (' + Math.round(g) + ' px) ' + f.pose + ' ' + f.expr; } }
  return ''; }

// ---- the words ----
const HOOK = { tonight: { lines: ['Only 6 things on', "your dog's list"], sub: 'The Winter Market opens tonight' }, open: { lines: ['Only 6 things on', "your dog's list"], sub: 'The Winter Market is open!' } }[OPEN ? 'open' : 'tonight'];
const CAP = { k1: ['A look, not a snack.', 'Wood all the way through.'], k2: ['Warm: no shivering', 'in the snow.'], k3: ['A snowball that', 'never melts.'],
  k4: ['Plain unsweetened yoghurt only.', 'Two or three are plenty.'], k5: ['After dark it glows and', 'puts stars on the snow.'] };
const LIST = ITEMS.map((i) => i.n).concat(['everything']);
const ASK = { lines: ["What's first", 'on your list?'], sub: 'Winter Market: open until 31 Dec' };
const PLAY = 'Play free!', TITLE = "Noodle's list";
const price = (p) => p.toLocaleString('en-US') + ' coins';
const allText = [HOOK.lines, HOOK.sub, 'The Winter Market opens tonight', 'The Winter Market is open!', Object.values(CAP), LIST, ASK.lines, ASK.sub, PLAY, TITLE, '???', ITEMS.map((i) => price(i.price)), ' 0123456789'].flat(3).join(' ');
// house words (README): no em dash, no "breed" as a verb, no "sell", no itch.io, only our website
if (/—|\bbreed(s|ing)?\b|\bsell|itch/i.test(allText + JSON.stringify(VOJSON))) throw new Error('a word the house rules ban: ' + allText);
const inner = (s) => s.trim().replace(/^<\?xml[^>]*>/, '').replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/g, '');
const LOGO_INNER = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8')).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');
// the game's own item drawings (PawArt.item of main, saved by the capture), 64 x 64
const itemSyms = ITEMS.map((it) => { const s = fs.readFileSync(path.join(CAPS, 'items', it.k + '.svg'), 'utf8'); if (!/viewBox="0 0 64 64"/.test(s) || />\?<\/text>/.test(s)) throw new Error('no item drawing for ' + it.n);
  return `<symbol id="it_${it.k}" viewBox="0 0 64 64">${inner(s)}</symbol>`; }).join('');
const BEATS = PB.map((b) => Object.assign({}, b, { kind: b.k === 'hook' ? 'hook' : b.k === 'k6' ? 'all' : b.k === 'ask' ? 'ask' : 'stop' }));
const LISTAT = 1.9;   // the hook card gives way to the list here (seconds from the hook's start; "The Winter Market ..." is said from 2.2 s)

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#fff}svg{display:block}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${itemSyms}</defs>
<image id="bg" x="0" y="0" width="${W}" height="${H}"/><g id="ov"></g><g id="ec"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), F='Caveat', CX=455, X0=60, CW=790, Y0=270, CH=250, PLAY=${JSON.stringify(PLAY)}, TITLE=${JSON.stringify(TITLE)};
const BEATS=${JSON.stringify(BEATS)}, LOOP=${LOOP}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())}, HOOK=${JSON.stringify(HOOK)}, CAP=${JSON.stringify(CAP)}, LIST=${JSON.stringify(LIST)};
const ITEMS=${JSON.stringify(ITEMS.map((i) => ({ k: i.k, n: i.n, price: price(i.price) })))}, ASK=${JSON.stringify(ASK)}, TICK=${JSON.stringify(TICK)}, LISTAT=${LISTAT}, SKYTOP=${JSON.stringify(SKYTOP)}, S=${S}, OY=${OY};
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);};
function fitS(s,max,w){ let z=max; while(z>20){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// the card's paper: one cream sheet with a soft shadow, the same box for every card (x 60..850, y 270..520)
function sheet(op, body){ return '<g opacity="'+f2(op)+'"><g data-box><rect data-apart="card" x="'+X0+'" y="'+Y0+'" width="'+CW+'" height="'+CH+'" rx="36" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'+(body.direct||'')+'</g>'+(body.more||'')+'</g>'; }
// a block of lines centred in the whole card
function linesCard(op, L){ return sheet(op, { direct: centred(L, CX, Y0+CH/2, F).svg }); }
// text centred in its own (unseen or tinted) box
function tbox(x, y, w, h, L, fill){ return '<g data-box><rect x="'+f2(x)+'" y="'+f2(y)+'" width="'+f2(w)+'" height="'+f2(h)+'" rx="'+f2(Math.min(h/2,16))+'" fill="'+(fill||'none')+'"/>'+centred(L, x+w/2, y+h/2, F).svg+'</g>'; }
// a checkbox with its crayon tick drawn over 0.22 s from u = 0 (two strokes of one path; the tick stays inside its box)
function check(x, y, z, u){ const p='M'+f2(x+z*0.2)+' '+f2(y+z*0.52)+'L'+f2(x+z*0.42)+' '+f2(y+z*0.76)+'L'+f2(x+z*0.82)+' '+f2(y+z*0.22), len=z*1.05;
  return '<rect x="'+f2(x)+'" y="'+f2(y)+'" width="'+z+'" height="'+z+'" rx="'+f2(z*0.2)+'" fill="#FFFFFF" stroke="${PEN}" stroke-width="'+f2(Math.max(3.5,z*0.085))+'"/>'
    +(u>0?'<path d="'+p+'" fill="none" stroke="${GREEN}" stroke-width="'+f2(z*0.17)+'" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="'+f2(len)+'" stroke-dashoffset="'+f2(len*(1-sm(u)))+'"/>':''); }
// Noodle's whole list: the title and six lines in two columns; done[i] = how far line i's tick is drawn; all = how far "everything" is written (-1: still ???)
function listCard(op, done, all){ let m='';
  m+=tbox(250, Y0+10, 410, 54, [{s:TITLE,size:50,fill:'${RED}'}]);
  const COL=[{x:X0+22, w:262},{x:X0+346, w:372}], z=Math.min.apply(null, LIST.map((n,i)=>fitS(n,44,COL[i<3?0:1].w-12)));
  LIST.forEach((n,i)=>{ const col=COL[i<3?0:1], r=i%3, x=col.x, yc=Y0+92+r*56, last=i===5, s=last&&all<0?'???':n, hl=last&&all>=0;
    m+=check(x, yc-19, 38, done[i]||0);
    const bx=x+48, bw=col.w;
    if(last&&all>=0&&all<1){ m+='<clipPath id="wipe"><rect x="'+bx+'" y="'+(yc-26)+'" width="'+f2(bw*all)+'" height="52"/></clipPath>'; }
    m+='<g'+(last&&all>=0&&all<1?' clip-path="url(#wipe)"':'')+'>'+tbox(bx, yc-23, bw, 46, [{s:s,size:last?z+6:z,fill:last&&all>=0?'${RED}':'${PEN}'}], hl?'#FFE3A1':'none')+'</g>'; });
  return sheet(op, { more: m }); }
// one stop: the game's own drawing of the thing, its price in coins, the list line with its tick, the game's words about it
function stopCard(op, it, lt){ let m='';
  m+='<rect x="84" y="'+(Y0+14)+'" width="168" height="168" rx="24" fill="#FFF3CF" stroke="${PEN}" stroke-width="4"/><use href="#it_'+it.k+'" x="96" y="'+(Y0+26)+'" width="144" height="144"/>';
  m+=pill(it.price, 168, Y0+216, 34, F, { fill:'#FFE3A1', padX:22 });
  m+=check(282, Y0+26, 56, (lt-TICK[it.k])/0.22);
  m+=tbox(352, Y0+18, 480, 72, [{s:it.n,size:fitS(it.n,66,466),fill:'${RED}'}]);
  const c=CAP[it.k]; m+=tbox(282, Y0+102, 550, 134, c.map((s)=>({s,size:fitS(s,46,536),pitch:54})));
  return sheet(op, { more: m }); }
window.frame=function(t, N){
  let ov='';
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1;
  let i=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) i=j;
  const b=BEATS[i], lt=t-b.at, cop=fade*(i===0?1:sm((lt+0.06)/0.14));
  if(fade>0){
    if(b.kind==='hook'){
      if(lt<LISTAT) ov+=linesCard(fade*(1-sm((lt-LISTAT+0.12)/0.1)), HOOK.lines.map((s)=>({s,size:fitS(s,72,700),pitch:72})).concat([{s:HOOK.sub,size:fitS(HOOK.sub,56,700),fill:'${RED}',pitch:60}]));
      else ov+=listCard(fade*sm((lt-LISTAT)/0.14), [], -1);
    } else if(b.kind==='stop'){ ov+=stopCard(cop, ITEMS.find((x)=>x.k===b.k), lt);
    } else if(b.kind==='all'){ ov+=listCard(cop, [1,1,1,1,1,(lt-TICK.k6)/0.22], lt<0.3?-1:cl((lt-0.3)/0.6));
    } else if(b.kind==='ask'){ ov+=linesCard(cop, ASK.lines.map((s)=>({s,size:fitS(s,72,700),pitch:72})).concat([{s:ASK.sub,size:fitS(ASK.sub,48,700),fill:'${RED}',pitch:56}])); }
    // Noodle's drawn box on this frame of the take (from the capture), so the checks see him
    ov+='<rect data-apart="Noodle" x="'+N.box[0]+'" y="'+N.box[1]+'" width="'+f2(N.box[2]-N.box[0])+'" height="'+f2(N.box[3]-N.box[1])+'" fill="none"/>';
  }
  // the end card (brand/kids/endcard.js) 70 px lower, with "Play free!" over the logo, as in share_reel
  let ec=''; if(end){ ec='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/><g transform="translate(0 70)">'+endCard('tall',HANDLES,LOGO_INNER)+'</g>'
    +centred([{s:PLAY,size:76,fill:'${RED}'}],CX,412,F).svg+'</g>'; }
  $('ov').innerHTML=ov; $('ec').innerHTML=ec;
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; ');
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ');
  for(const e of $('ov').querySelectorAll('[data-apart],[data-box]>rect')){ const r=e.getBoundingClientRect(); if(!r.width) continue; let o=1; for(let p=e;p&&p.id!=='ov';p=p.parentNode) if(p.getAttribute('opacity')!=null) o*=+p.getAttribute('opacity'); if(o<=0.05) continue;
    if(r.right>854||r.left<56||r.top<266||r.bottom>1444) return 'outside x 60..850, y 270..1440: '+(e.getAttribute('data-apart')||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round);
    // the card stays in the open sky: 28 px above the bunting, the roofs and the lanterns behind it on this frame
    if(e.getAttribute('data-apart')==='card'){ let top=1e9; for(let x=Math.floor((r.left/S+N.x0)/25); x<=Math.floor((r.right/S+N.x0)/25); x++) top=Math.min(top, SKYTOP[Math.max(0,Math.min(39,x))]);
      if(top*S+OY-r.bottom<28) return 'the card is '+Math.round(top*S+OY-r.bottom)+' px from the market\\'s bunting'; } }
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
  console.log('T =', T.toFixed(2), 's (', LOOP.toFixed(2), 's before the end card ),', NF, 'frames,', NCAP, 'of the take; beats at', BEATS.map((v) => v.k + ' ' + v.at.toFixed(2) + ' (' + v.hold.toFixed(2) + ')').join(', '));
  const seq = (n) => 'file://' + path.join(CAPS, 'seq', 'f' + String(Math.min(n, NCAP - 1)).padStart(5, '0') + '.png');
  const one = async (fi, shot, file) => { const t = fi / FPS + 1e-4, N = FR[Math.min(fi, NCAP - 1)];
    let err = t < LOOP + 0.22 ? noodleCheck(fi) : '';
    if (shot) await p.evaluate((s) => window.bg(s), seq(fi));
    err = err || (await p.evaluate(([t, N]) => window.frame(t, N), [t, { box: N.box, x0: N.x0 }]));
    if (err) { if (process.env.LOOSE) console.log('CHECK', t.toFixed(2), err.slice(0, 300)); else throw new Error(err + ' at ' + t.toFixed(2) + ' (frame ' + fi + ')'); }
    if (shot) await p.screenshot({ path: file }); };
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, 1.2, ...BEATS.flatMap((x) => [x.at + 0.9, x.at + x.hold * 0.85]).slice(1), LOOP + 0.15, LOOP + 1.2, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await one(Math.round(t * FPS), true, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}${OPEN ? '_open' : ''}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  // CHECK=1: run every frame's checks without a screenshot (fast), then stop
  if (process.env.CHECK) { for (let fi = 0; fi < NF; fi++) await one(fi, false); console.log('all', NF, 'frames pass the checks;', passCart, 'walking frames pass in front of the Treats cart'); await b.close(); return; }
  const t0 = Date.now(), HOOKEND = Math.round(B.k1 * FPS) - 2;   // the open variant: frames 0..HOOKEND (the hook beat, up to the next card's first frame)
  let fr = [...Array(NF).keys()];
  if (OPEN) { if (!fs.existsSync(path.join(WORK, 'f', `f${String(NF - 1).padStart(5, '0')}.png`))) throw new Error('render the main cut first'); fr = fr.filter((f) => f <= HOOKEND); }
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  const FD = path.join(WORK, OPEN ? 'f_open' : 'f');
  // +1e-4 (in one()): fi/FPS can land a hair under a beat start (the gift Reel's doubled frame); every frame's checks run in one()
  for (const fi of fr) { await one(fi, true, path.join(FD, `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close();
  console.log(passCart, 'walking frames pass in front of the Treats cart');
  if (OPEN) for (let fi = HOOKEND + 1; fi < NF; fi++) { const n = `f${String(fi).padStart(5, '0')}.png`, d = path.join(FD, n); if (!fs.existsSync(d)) fs.symlinkSync(path.join(WORK, 'f', n), d); }
  for (let fi = NF; fs.existsSync(path.join(FD, `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(FD, `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's Winter Market music, its coin chime on the ticks, Noodle on top (kept from the last full render when FRAMES is set) ----
  const mixWav = path.join(WORK, OPEN ? 'mix_open.wav' : 'mix.wav');
  const VOAT = BEATS.map((v) => ({ k: v.k === 'hook' && OPEN ? 'hook_open' : v.k, at: v.at }));
  if (!process.env.FRAMES || !fs.existsSync(mixWav)) {
    const ticks = ITEMS.map((it) => ({ at: B[it.k] + TICK[it.k], name: 'coin', amount: it.price })).concat([{ at: B.k6 + TICK.k6, name: 'coin', amount: 1000 }]);
    if (!fs.existsSync(path.join(WORK, 'music.wav')) || !(OPEN || process.env.KEEP_MUSIC)) {   // the open variant keeps the main cut's music
      const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
      const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
      const r = await ap.evaluate(async ([s, st]) => { const o = await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
        segments: [{ at: 0, ctx: { place: 'fmarket', fest: 'winter', time: 'day', weather: 'sunny' } }], stingers: st }); return { wav: o.wav, ctx: JSON.stringify(window.PawAudio.contexts || []).slice(0, 300) }; }, [T + 0.5, [{ at: 0.05, name: 'discover' }].concat(ticks)]);
      fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(r.wav, 'base64')); await ab.close(); console.log('music: the Winter Market (fmarket, fest winter)', r.ctx); }
    const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
    ff(['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
    const EV = [['tick', B.hook + LISTAT]]; for (const k of ['k1', 'k2', 'k3', 'k4', 'k5', 'k6', 'ask']) EV.push(['tick', B[k]]); EV.push(['tick', LOOP + 0.15]);
    const fx = path.join(WORK, 'fx.wav');
    ff([...EV.flatMap(([n]) => ['-i', path.join(WORK, n + '.wav')]), '-filter_complex', EV.map(([, a], i) => { const d = Math.round(a * 1000); return `[${i}:a]aformat=channel_layouts=mono,adelay=${d}|${d}[e${i}]`; }).join(';') + ';'
      + EV.map((_, i) => `[e${i}]`).join('') + `amix=inputs=${EV.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ar', '44100', '-ac', '1', fx]);
    const voWav = path.join(WORK, OPEN ? 'voice_open.wav' : 'voice.wav');
    ff([...VOAT.flatMap((v) => ['-i', path.join(VO, v.k + '.wav')]), '-filter_complex', VOAT.map((v, i) => { const d = Math.round(v.at * 1000); return `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`; }).join(';') + ';'
      + VOAT.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${VOAT.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
    const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
    const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
    const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
    const pre = path.join(WORK, 'premix.wav');
    ff(['-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', fx, '-filter_complex',
      `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${LOOP.toFixed(2)}:d=${(T - LOOP).toFixed(2)}[m];[2:a]volume=-12dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
      '-map', '[a]', '-ar', '44100', pre]);
    const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
    ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  }
  const mp4 = path.join(OUT, OPEN ? 'doodle-doggo-winter-list-open.mp4' : 'doodle-doggo-winter-list.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(FD, 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
  // ---- frame by frame (../frozen_clock.js checkFrames): every moving run (the two walks, the four pans; a run starts after its beat cut and stops
  // before the pan has eased out), then every hold between them (the slow creep: no two frames alike; its jumps are the card's pop at the beat cut,
  // the tick being drawn and the steps of the game's own crayon poses, drawn about three times a second) ----
  const fN = (t) => Math.round(t * FPS), mv = (t0, secs) => [fN(t0) + 2, fN(t0 + secs) - 3];
  const runs = { 'pan to Homes': mv(B.k1, 0.6), 'pan to Clothes': mv(B.k2, 0.5), 'walk to Toys': mv(B.k3 + 0.1, P.walkSecs), 'walk back': mv(B.k4 + 0.1, P.walkSecs), 'pan to Decor': mv(B.k5, 0.7), 'pan to the middle': mv(B.k6, 0.6) };
  let bad = 0;
  for (const [k, [a, z]] of Object.entries(runs)) { const c = checkFrames(mp4, a, z); bad += c.doubled.length + c.jumps.length; console.log('checkFrames', k, a + '..' + z, 'median', c.median, 'doubled', JSON.stringify(c.doubled), 'jumps', JSON.stringify(c.jumps)); }
  const edges = [0, ...Object.values(runs).flatMap(([a, z]) => [a - 3, z + 4]), fN(LOOP) - 1]; let dbl = [], lo = 9;
  for (let i = 0; i < edges.length; i += 2) { const c = checkFrames(mp4, edges[i], edges[i + 1]); const d = c.diffs.filter((x) => x[1] < 0.03).map((x) => x[0]); dbl = dbl.concat(d); lo = Math.min(lo, ...c.diffs.map((x) => x[1]));
    console.log('checkFrames hold', edges[i] + '..' + edges[i + 1], 'median', c.median, 'frames that do not change', JSON.stringify(d), 'jumps (card pops, ticks, pose steps)', c.jumps.length); }
  console.log('moving runs:', bad ? bad + ' frames to look at' : 'no doubled frames, no jumps', '| holds:', dbl.length ? 'still frames ' + JSON.stringify(dbl) : 'no two frames alike (smallest change ' + lo + ')');
})().catch((e) => { console.error(e); process.exit(1); });
