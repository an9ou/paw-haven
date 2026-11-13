// "Stop feeling bad about a week off" Reel for v2.25 "Glad you're back" (live 12 Nov 2026; shot table, facts and captions: docs/marketing/BACK_REEL.md).
// Noodle the dachshund (PawArt.dog 'dachs', main's art) tells it, big in every beat, in the game's own scenes (owner, 13 Nov 2026: the Home Yard by
// day, dusk, night and dawn, the Cozy House living room; autumn; see SC below), checks as in turkey_reel/build_turkey.js. The game's own screens, captured clean from
// a main build by capture_back.js: the "While you were out" diary page (with today's gift) and Gerald's welcome-back letter ("We kept your spot
// warm": a treat bag and 100 coins). The game's own art: Noodle, Gerald (PawArt.prop 'gerald'), the treat bag (fwBagSVG, 47_firstweek.js),
// Carrot Sticks, Squeaky Duck, the coin icon and the Friends wrapped gift (PawArt.FRIENDS.wrap). Beats: hook, a week away (a crayon tear-off calendar flips day 1 to 7), the letter,
// the diary page, the daily gift, days played forever (a month with gaps, "N days played, ever"), Gerald's gifts at 7 / 30 / 100 / 365 days,
// "No streaks. No guilt. Just a happy dog." with "tag someone who needs a break", and our standard end card (brand/kids/endcard.js) for 3 s.
// Every fact is checked against main's game text (game/i18n/en.json, game/src/53_welcome.js) and the build stops if one changed.
// Every frame: centreCheck(), safeCheck(), apartCheck() (../centre_text.js), standing things on the scene's floor and off the garden plot, x 850
// for words and key art. 1080 x 1920, 30 fps. Voice: Noodle, Kokoro af_bella 1.0x (vo_back.json via ../friends_reel/vo_friends.py). Music: the game's own yard
// music (mods/pawaudio.js) about 11 dB under the voice, the treasure sting on the gift, the level-up sting on Gerald's gifts.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/back_reel/capture_back.js <main checkout> <caps dir>
//   VO_LINES=brand/instagram/launch/back_reel/vo_back.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.0
//   ART_ROOT=<main checkout> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/back_reel/build_back.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills). ONLY=cover: back-cover.jpg. FRAMES=a-b: re-render only frames a..b, then encode again.
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles } = require('../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'back_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
const CAPS = path.resolve(process.env.CAPS || path.join(WORK, 'caps'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C', GOLD = '#F2C744';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
const VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'vo_back.json'), 'utf8'));
for (const k of Object.keys(VOJSON)) if (VOJ.text[k] !== VOJSON[k]) throw new Error('the vo dir is not made from vo_back.json: ' + k);

// ---- the facts, checked against main (the game's own words and numbers) ----
const EN = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
const WBJS = fs.readFileSync(path.join(ART_ROOT, 'game', 'src', '53_welcome.js'), 'utf8');
const must = (k, re) => { if (!re.test(EN[k] || '')) throw new Error('the game text changed: ' + k + ' no longer says ' + re); };
must('wb.title', /^While you were out$/);
must('wb.b_title', /^We kept your spot warm$/);
must('wb.b_text', /Welcome back!.*Here is a treat bag and \{n\} coins/s);
must('wb.gift_h', /^A little gift from \{name\}$/);
must('wb.l1', /^\{name\} found a sock\. Nobody knows whose\. It belongs to \{name\} now\.$/);
must('wb.l14', /^\{name\} sat by the gate and listened for your footsteps\.$/);
must('wb.cal_life', /# days played, ever/);
must('nw.v225.days', /counts every day you play, forever\. A missed day costs nothing, and Gerald has gifts at 7, 30, 100 and 365 days/);
must('nw.v225.away', /once a day a small gift/);
must('wb.m_text', /Not in a row and never in a rush/);
for (const re of [/WB_AWAY_MS = 4 \* 3600e3/, /WB_BACK_MS = 3 \* 864e5/, /WB_COIN_CAP = 30/, /WB_BACK_COINS = 100/, /WB_DAYS = \[7, 30, 100, 365\]/,
  /if \(r < 12\) return \{ t: 'coins'/, /WB_TREATS = \['Bone-shaped Biscuit', 'Carrot Sticks', 'Blueberry Bites', 'Apple Slices'\]/])
  if (!re.test(WBJS)) throw new Error('53_welcome.js changed: ' + re);
// the captures (capture_back.js): the diary page must show the two quoted lines and a treat
const FACTS = JSON.parse(fs.readFileSync(path.join(CAPS, 'facts.json'), 'utf8'));
if (FACTS.lines[0] !== 'Noodle found a sock. Nobody knows whose. It belongs to Noodle now.' || !FACTS.lines.includes('Noodle sat by the gate and listened for your footsteps.'))
  throw new Error('the diary page capture has other lines: ' + FACTS.lines.join(' | '));
if (!/Carrot Sticks x2/.test(FACTS.gift)) throw new Error('the diary page gift is not Carrot Sticks x2: ' + FACTS.gift);

// ---- the game's art (main), with the poses gliding between the game's drawings (the same patch as turkey_reel/build_turkey.js) ----
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ART_ROOT, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(fs.readFileSync(path.join(ART_ROOT, 'world', f), 'utf8'), ctx);
let src = fs.readFileSync(path.join(ART_ROOT, 'dogs', 'pawart_dogs.js'), 'utf8');
for (const [a, b] of [['if(L.danceFx){', 'if(false){'], ["const shadow=(s.wet&&pose!=='jump'?wetPuddle(shx,shw):'')+`", "const shadow=''&&`"],
  ['const f=frame(key,s,pose,o.outfit,k,seed,ex)', 'const f=frame(key,s,pose,o.outfit,(o.kf!=null?o.kf:k),seed,ex)'], ['kit(rng(seed+k*7717))', 'kit(rng(seed))'],
  ['+k*31)', ')'], ['seed*5+k*977+11', 'seed*5+11'], ['seed*3+k*131+7', 'seed*3+7']]) { if (!src.includes(a)) throw new Error('art changed: ' + a); src = src.replace(a, b); }
src = src.replace(/\]\[k\]/g, '].LK(k)').replace(/\]\[L\.k\|\|0\]/g, '].LK(L.k||0)').replace(/\]\[L\.k\]/g, '].LK(L.k)');
vm.runInContext(`Array.prototype.LK=function(k){ if(Number.isInteger(k)) return this[k];
  const n=this.length, i=((Math.floor(k)%n)+n)%n, j=(i+1)%n, x=k-Math.floor(k), f=x*x*(3-2*x);
  const mix=(a,b)=>typeof a==='number'&&typeof b==='number' ? a+(b-a)*f : Array.isArray(a)&&Array.isArray(b) ? a.map((v,q)=>mix(v,b[q])) : (f<.5?a:b);
  return mix(this[i],this[j]); };`, ctx);
vm.runInContext(src, ctx);
const PA = win.PawArt, inner = (s) => s.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/g, '');
const vbOf = (s) => /viewBox="([^"]+)"/.exec(s)[1];
const sym = (s, id) => { if (!s || />\?<\/text>/.test(s)) throw new Error('no art for ' + id); return `<symbol id="${id}" viewBox="${vbOf(s)}" overflow="visible">${uniq(inner(s))}</symbol>`; };
// ids inside each drawing are made unique (the game's art reuses gradient and clip ids from drawing to drawing)
let uid = 0; const uniq = (s) => { const p = 'u' + (uid++) + '_'; return s.replace(/id="([^"]+)"/g, `id="${p}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`).replace(/href="#([^"]+)"/g, `href="#${p}$1"`); };
const SYMS = [sym(PA.item('Carrot Sticks'), 'it_carrot'), sym(PA.item('Squeaky Duck'), 'it_duck'), sym(PA.icon('coin'), 'ic_coin'), sym(PA.FRIENDS.wrap(0), 'ic_gift'),
  sym(PA.prop('gerald', { pose: 'wave' }), 'ger_wave'), sym(PA.prop('gerald', { pose: 'cheer' }), 'ger_cheer'),
  sym(fs.readFileSync(path.join(CAPS, 'treat_bag.svg'), 'utf8'), 'bag')].join('');
// the captured game screens, as images (3x)
const png = (f) => { const b = fs.readFileSync(path.join(CAPS, f)); return { uri: 'data:image/png;base64,' + b.toString('base64'), w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const PAGE = png('diary_page.png'), LETTER = png('gerald_letter.png');
const IMGS = `<symbol id="img_page" viewBox="0 0 ${PAGE.w} ${PAGE.h}"><image href="${PAGE.uri}" width="${PAGE.w}" height="${PAGE.h}"/></symbol>`
  + `<symbol id="img_letter" viewBox="0 0 ${LETTER.w} ${LETTER.h}"><image href="${LETTER.uri}" width="${LETTER.w}" height="${LETTER.h}"/></symbol>`;
const LOOK = { beg: { pose: 'beg', facing: 'right' }, sit: { pose: 'sit', facing: 'right' }, yay: { pose: 'happy', facing: 'right', expr: 'hearts' },
  nap: { pose: 'sleep', facing: 'right' }, paw: { pose: 'paw', facing: 'right' }, idle: { pose: 'idle', facing: 'right' } };
const dogSvg = (id, kf) => inner(PA.dog('dachs', Object.assign({ anim: false }, LOOK[id], { kf: ((kf % 3) + 3) % 3 })));
const dogSyms = Object.keys(LOOK).map((id) => `<symbol id="${id}_0" overflow="visible">${dogSvg(id, 0)}</symbol>`).join('');

// the backgrounds (owner, 13 Nov 2026: "change the background, coz last reels already using this, we can use the gaming assets"): the game's own
// scenes from main (PawArt.scene, 1000 x 600, autumn), no game interface. Each is drawn at 3.2x so its full height fills the frame (1920 px) and a
// 337-unit window of it shows: SC[k].x0 is the window's left edge in scene units. Our feet line (y 1425) is scene y 445: the grass in the yard (the
// fence base is at ~y 400) and the floorboards in the living room (the floor starts at ~y 400, the sofa's front). Pre-rendered once per build to a
// JPEG (WORK/bg_<key>.jpg) and shown as an image, so a frame stays cheap. Text never sits on the scene: every word is on a solid cream card, pill or
// badge. Things that stand (Noodle, Gerald, the gift) are checked on every frame to stand on the scene's floor and off its keep-out boxes (the garden plot).
const SCALE = 3.2, AUT = { season: 'autumn', weather: 'sunny' };
const SC = {
  yard: { name: 'yard', o: Object.assign({ time: 'day' }, AUT), x0: 600 },      // the yard by day: the fence and the hills (past the washing line)
  dusk: { name: 'yard', o: Object.assign({ time: 'dusk' }, AUT), x0: 600 },     // the same view, evening
  night: { name: 'yard', o: Object.assign({ time: 'night' }, AUT), x0: 600 },   // and night (the days pass)
  door: { name: 'yard', o: Object.assign({ time: 'day' }, AUT), x0: 225 },      // the house corner and the mailbox, for Gerald's letter (the garden plot left out)
  room: { name: 'house', o: Object.assign({ time: 'day' }, AUT), x0: 545 },     // the Cozy House living room: the lamp, the striped wall, Noodle's bed
  sofa: { name: 'house', o: Object.assign({ time: 'day' }, AUT), x0: 300 },     // the living room's sofa and window
  tree: { name: 'yard', o: Object.assign({ time: 'dawn' }, AUT), x0: 640 },     // the yard on a sunny morning, towards the autumn tree
};
// scene floors and keep-out boxes, in scene units: feet must be on the floor (y >= floor) and outside every keep-out box
const FLOORS = { yard: { floor: 400, keep: [[0, 425, 220, 600]] }, house: { floor: 405, keep: [] } }; // the yard's garden plot (x 5..215, y 430..590)
const LOGO_INNER = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8')).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

// ---- the beats (each card carries the spoken words, so it works as the subtitles) ----
// read: the words a slow reader reads in a game screen (image beats): the pill and the lines that matter
const BEATS = [
  { k: 'hook', kind: 'hook', lines: ['Stop feeling bad', 'about a week off.'], sub: 'Your dog saved you a gift.' },
  { k: 'away', kind: 'away', lines: ['You took a week off.', 'Noodle waited.'], small: 'and napped. mostly napped.' },
  { k: 'letter', kind: 'letter', pillTop: 'Back after 3+ days?', read: 'Welcome back! Here is a treat bag and 100 coins From Gerald' },
  { k: 'diary', kind: 'diary', pillTop: 'Away 4+ hours?', title: 'While you were out', lines: ['“Noodle found a sock. Nobody knows whose.', 'It belongs to Noodle now.”', '“Noodle sat by the gate and', 'listened for your footsteps.”'] },
  { k: 'gift', kind: 'gift', title: 'A little gift, once a day', lines: ['a dog-safe treat or a toy,', 'sometimes a few coins'] },
  { k: 'days', kind: 'days', title: 'Days played, ever', lines: ['a count that never resets.', 'Miss a day? Nothing lost.'] },
  { k: 'mile', kind: 'mile', title: 'Gifts from Gerald', lines: ['at 7, 30, 100 and 365', 'days played'] },
  { k: 'end', kind: 'end', lines: ['No streaks. No guilt.', 'Just a happy dog.'], pill: 'tag someone who needs a break' },
];
// the timeline (owner, 11 Nov 2026: "let the audience read it"): each card stays up until a slow reader is done, at least 1.2 s + 0.35 s a word
// of its text and never less than its spoken line + 1 s, then a short pause before the next beat
const VOAT = []; let at = 0.1; const PAUSE = 0.3, B = {}, HOLD = {};
for (const b of BEATS) { const txt = [b.title || '', ...(b.lines || []), b.small || '', b.sub || '', b.pill || '', b.pillTop || '', b.read || ''].join(' ');
  const words = txt.split(/\s+/).filter(Boolean).length;
  HOLD[b.k] = Math.max(1.2 + 0.35 * words, VOD[b.k] + 1.0); B[b.k] = at; VOAT.push({ k: b.k, at }); b.at = at; b.hold = HOLD[b.k]; at += HOLD[b.k] + PAUSE; }
const LOOP = at - PAUSE + 0.2, T = LOOP + 3.0, NF = Math.round(T * FPS);
const DAYS_ON = [1, 2, 4, 5, 8, 9, 10, 13, 16, 17, 20, 22]; // the days played this month: gaps in between, nothing lost
const allText = BEATS.map((b) => [b.title || '', ...(b.lines || []), b.sub || '', b.small || '', b.pill || '', b.pillTop || '']).flat().join(' ')
  + ' days played, ever 0123456789 day Day Stop feeling bad about a week off. Your dog saved you a gift.';

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#fff}svg{display:block}[class$="-hl"]{display:none}.pa-dog *{animation:none!important}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${SYMS}${dogSyms}${IMGS}__BGSYMS__</defs>
<g id="bg"></g>
<g id="art"></g><g id="ov"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), F='Caveat', CX=455;
const BEATS=${JSON.stringify(BEATS)}, LOOP=${LOOP}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())}, DAYS_ON=${JSON.stringify(DAYS_ON)};
const PAGE_AR=${PAGE.h / PAGE.w}, LETTER_AR=${LETTER.h / LETTER.w}, SC=${JSON.stringify(SC)}, FLOORS=${JSON.stringify(FLOORS)}, SCALE=${SCALE};
// which scene each beat shows; the away beat goes from day to evening to night as the days pass (cross-fades), each beat cross-fades in
const BG={hook:'yard', away:'yard', letter:'door', diary:'room', gift:'sofa', days:'tree', mile:'tree', end:'tree'};
function bgLayers(i, lt, b){ const L=[], prev=i>0?(BEATS[i-1].k==='away'?'night':BG[BEATS[i-1].k]):null, cur=BG[b.k], k=i===0?1:sm((lt+0.06)/0.4);
  if(b.k==='away'){ const q=cl((lt-0.4)/(b.hold*0.75)); L.push(['yard',1]); L.push(['dusk',sm((q-0.3)/0.15)]); L.push(['night',sm((q-0.6)/0.15)]); return L; }
  if(prev&&prev!==cur&&k<1) L.push([prev,1]);
  L.push([cur,prev===cur?1:k]); return L; }
// something standing at screen x0..x1 with its feet at screen y: on the floor of the beat's scene, off its keep-out boxes
function groundOk(key, x0, x1, fy){ const s=SC[key], f=FLOORS[s.name], u0=s.x0+x0/SCALE, u1=s.x0+x1/SCALE, uy=fy/SCALE;
  if(uy<f.floor) return 'stands above the floor ('+uy.toFixed(0)+' < '+f.floor+')';
  for(const k of f.keep) if(uy>=k[1]&&uy<=k[3]&&u1>k[0]&&u0<k[2]) return 'stands on a keep-out box ('+k.join(',')+')';
  return ''; }
// a cream round chip holding a piece of the game's art (an item never sits on a scene object: it floats in its own chip)
function chip(id, cx, cy, r, u, tag, op){ if(u<=0) return ''; const k=0.85+0.15*back(u*1.4), s=r*1.45;
  return '<g data-apart="'+(tag||id)+'" opacity="'+f2(sm(u*3)*(op==null?1:op))+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(k)+') translate('+f2(-cx)+' '+f2(-cy)+')"><circle cx="'+f2(cx)+'" cy="'+f2(cy)+'" r="'+r+'" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/><use href="#'+id+'" x="'+f2(cx-s/2)+'" y="'+f2(cy-s/2)+'" width="'+f2(s)+'" height="'+f2(s)+'"/></g>'; }
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);};
const back=(x)=>{ x=cl(x); const c=1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const BOX={};
function box(id){ if(BOX[id]) return BOX[id]; const u=document.createElementNS(NSV,'use'); u.setAttribute('href','#'+id+'_0'); $('art').appendChild(u); const b=u.getBBox(); u.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }
// Noodle, standing on (cx, feet), at most hh tall and ww wide; flip: facing left
function noodle(pose, svg, cx, feet, hh, ww, dy, op, flip){ const b=box(pose), s=Math.min(hh/b[3], ww/b[2]), w=b[2]*s, h=b[3]*s;
  return '<g data-apart="Noodle" data-feet="'+f2(feet)+'" opacity="'+f2(op)+'"><ellipse cx="'+f2(cx)+'" cy="'+(feet-3)+'" rx="'+f2(w*0.36)+'" ry="14" fill="${PEN}" opacity=".18"/><g'+(flip?' transform="translate('+f2(2*cx)+' 0) scale(-1 1)"':'')+'><g transform="translate('+f2(cx-w/2)+' '+f2(feet-h+(dy||0))+') scale('+s.toFixed(4)+') translate('+f2(-b[0])+' '+f2(-b[1])+')">'+svg+'</g></g></g>'; }
// a piece of the game's art (a symbol), centred on (cx, cy), size px, popping in
function art(id, cx, cy, size, u, tag, op){ const s=size*(0.82+0.18*back(u)); return '<g data-apart="'+(tag||id)+'" opacity="'+f2(sm(u*2.5)*(op==null?1:op))+'"><use href="#'+id+'" x="'+f2(cx-s/2)+'" y="'+f2(cy-s/2)+'" width="'+f2(s)+'" height="'+f2(s)+'"/></g>'; }
// a captured game screen, w wide, top at y, sliding up a little as it comes in
function shot(id, ar, x, y, w, u, op){ const h=w*ar, k=0.94+0.06*back(u); const ww=w*k, hh=h*k;
  return '<g data-apart="'+id+'" opacity="'+f2(sm(u*2.5)*op)+'"><use href="#'+id+'" x="'+f2(x+(w-ww)/2)+'" y="'+f2(y+(h-hh)/2+(1-sm(u))*30)+'" width="'+f2(ww)+'" height="'+f2(hh)+'"/></g>'; }
// the largest size up to max at which s is no wider than w
function fitS(s,max,w){ let z=max; while(z>20){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// a card: optional title, lines, a small line, a red sub line; the text block centred in the card (centreCheck)
function card(b, top, op){ const W0=790, x0=CX-W0/2, L=[];
  if(b.title) L.push({s:b.title, size:fitS(b.title,80,W0-90), fill:'${RED}', pitch: 80});
  (b.lines||[]).forEach((s)=>L.push({s, size:fitS(s, b.kind==='hook'?96:b.title?66:78, W0-80), pitch: b.kind==='hook'?104:b.title?72:86}));
  if(b.small) L.push({s:b.small, size:fitS(b.small,50,W0-90), fill:'#8A7468', pitch: 56});
  if(b.sub) L.push({s:b.sub, size:fitS(b.sub,66,W0-90), fill:'${RED}', pitch: 74});
  const hh=L.reduce((a,l,i)=>a+(i<L.length-1?l.pitch:l.size*0.75),0)+(b.kind==='hook'?120:96);
  const c=centred(L, CX, top+hh/2, F);
  return { h: hh, svg: '<g data-box data-apart="card" opacity="'+f2(op)+'"><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+f2(hh)+'" rx="38" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'+c.svg+'</g>' }; }
function pillA(s, cx, cy, size, o, tag){ return pill(s, cx, cy, size, F, o).replace('<g data-box','<g data-box data-apart="'+(tag||'pill')+'"'); }
// the tear-off calendar of the week away: the day flips from 1 to 7 (the old page lifts off the rings)
function calendar(cx, cy, day, flip, op){ const w=300, h=330, x=cx-w/2, y=cy-h/2;
  let g='<g data-apart="calendar" opacity="'+f2(op)+'">';
  g+='<rect x="'+f2(x+8)+'" y="'+f2(y+12)+'" width="'+w+'" height="'+h+'" rx="26" fill="#E9D3BF" stroke="${PEN}" stroke-width="6"/>';
  g+='<g data-box><rect x="'+f2(x)+'" y="'+f2(y+70)+'" width="'+w+'" height="'+(h-70)+'" rx="0" fill="${CREAM}" stroke="none"/>'+centred([{s:'day',size:56,fill:'#8A7468',pitch:120},{s:String(day),size:150,fill:'${PEN}'}],cx,y+70+(h-70)/2,F).svg+'</g>';
  g+='<path d="M'+f2(x+26)+' '+f2(y)+' H'+f2(x+w-26)+' Q'+f2(x+w)+' '+f2(y)+' '+f2(x+w)+' '+f2(y+26)+' V'+f2(y+h-26)+' Q'+f2(x+w)+' '+f2(y+h)+' '+f2(x+w-26)+' '+f2(y+h)+' H'+f2(x+26)+' Q'+f2(x)+' '+f2(y+h)+' '+f2(x)+' '+f2(y+h-26)+' V'+f2(y+26)+' Q'+f2(x)+' '+f2(y)+' '+f2(x+26)+' '+f2(y)+' Z" fill="none" stroke="${PEN}" stroke-width="6"/>';
  g+='<path d="M'+f2(x+3)+' '+f2(y+70)+' V'+f2(y+26)+' Q'+f2(x+3)+' '+f2(y+3)+' '+f2(x+26)+' '+f2(y+3)+' H'+f2(x+w-26)+' Q'+f2(x+w-3)+' '+f2(y+3)+' '+f2(x+w-3)+' '+f2(y+26)+' V'+f2(y+70)+' Z" fill="#E8665A" stroke="${PEN}" stroke-width="5"/>';
  [x+80, x+w-80].forEach((rx)=>{ g+='<rect x="'+f2(rx-9)+'" y="'+f2(y-22)+'" width="18" height="44" rx="9" fill="#C9C2BB" stroke="${PEN}" stroke-width="4"/>'; });
  // the page being torn off: it swings up from the rings and fades (no words on it)
  if(flip>0&&flip<1){ const k=1-sm(flip); g+='<g opacity="'+f2(1-sm(flip*1.3))+'" transform="translate(0 '+f2(y+70)+') scale(1 '+f2(Math.max(0.02,k))+') translate(0 '+f2(-(y+70))+')"><rect x="'+f2(x+3)+'" y="'+f2(y+70)+'" width="'+(w-6)+'" height="'+(h-73)+'" fill="#FFF3DA" stroke="${PEN}" stroke-width="5"/></g>'; }
  return g+'</g>'; }
// a month page: paws on the days played, plain gaps on the days missed (nothing lost); n paws shown
function month(x0, y0, n, op, c, gp){ let g='<g data-apart="month" opacity="'+f2(op)+'"><rect x="'+(x0-14)+'" y="'+(y0-14)+'" width="'+(7*c+6*gp+28)+'" height="'+(4*c+3*gp+28)+'" rx="22" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/>';
  for(let d=1; d<=28; d++){ const i=d-1, cx=x0+(i%7)*(c+gp)+c/2, cy=y0+Math.floor(i/7)*(c+gp)+c/2, k=DAYS_ON.indexOf(d), on=k>=0&&k<n;
    g+='<rect x="'+f2(cx-c/2+3)+'" y="'+f2(cy-c/2+3)+'" width="'+(c-6)+'" height="'+(c-6)+'" rx="10" fill="'+(on?'#FFE3A1':'#FFF8EC')+'" stroke="#D9C4B0" stroke-width="2.5"/>';
    if(on){ const age=n-k, s=(0.8+0.2*back(cl(age)))*c/50; g+='<g transform="translate('+f2(cx)+' '+f2(cy+1)+') scale('+f2(s)+')" fill="#E8665A" stroke="${PEN}" stroke-width="2.6"><ellipse cx="0" cy="5" rx="9" ry="7.5"/><circle cx="-10" cy="-6" r="4.2"/><circle cx="-3.5" cy="-12" r="4.2"/><circle cx="4" cy="-12" r="4.2"/><circle cx="10.5" cy="-5.5" r="4.2"/></g>'; } }
  return g+'</g>'; }
// a Gerald's-gift badge: the number of days played in a gold crayon medal
function medal(cx, cy, r, n, u){ if(u<=0) return ''; const k=0.85+0.15*back(u*1.4);
  return '<g data-apart="medal'+n+'" opacity="'+f2(sm(u*3))+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(k)+') translate('+f2(-cx)+' '+f2(-cy)+')">'
    +'<path d="M'+f2(cx-30)+' '+f2(cy+r-14)+' L'+f2(cx-44)+' '+f2(cy+r+46)+' L'+f2(cx-14)+' '+f2(cy+r+30)+' L'+f2(cx-2)+' '+f2(cy+r+8)+' Z" fill="#E8665A" stroke="${PEN}" stroke-width="5" stroke-linejoin="round"/>'
    +'<path d="M'+f2(cx+30)+' '+f2(cy+r-14)+' L'+f2(cx+44)+' '+f2(cy+r+46)+' L'+f2(cx+14)+' '+f2(cy+r+30)+' L'+f2(cx+2)+' '+f2(cy+r+8)+' Z" fill="#7BC6B5" stroke="${PEN}" stroke-width="5" stroke-linejoin="round"/>'
    +'<g data-box><circle cx="'+f2(cx)+'" cy="'+f2(cy)+'" r="'+r+'" fill="${GOLD}" stroke="${PEN}" stroke-width="7"/>'+centred([{s:String(n),size:n>99?64:74,pitch:n>99?52:58},{s:'days',size:32,fill:'#7A5A2A'}],cx,cy,F).svg+'</g>'
    +'<circle cx="'+f2(cx)+'" cy="'+f2(cy)+'" r="'+(r-12)+'" fill="none" stroke="#FFF3C4" stroke-width="4" opacity=".8" stroke-dasharray="10 12"/></g>'; }
const CARD_TOP=300, FEET=1425;
window.frame=function(t, D){
  let art_='', ov='';
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1;
  let i=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) i=j;
  const b=BEATS[i], lt=t-b.at, p=cl(lt/b.hold);
  const u=i===0?1:cl((lt+0.06)/0.32); // the hook is there at frame 1
  const cop=fade*(i===0?1:sm(u*3));
  $('bg').innerHTML=bgLayers(i, lt, b).filter((l)=>l[1]>0.001).map((l)=>'<use href="#bg_'+l[0]+'" opacity="'+f2(l[1])+'"/>').join('');
  if(fade>0){
    let below=CARD_TOP;
    if(b.pillTop) ov+=pillA(b.pillTop, CX, 345, 58, { fill:'#FFE3A1', padX:36, op: cop }, 'pilltop');
    if(b.lines){ const top=b.pillTop?415:CARD_TOP, c=card(b, top, cop); ov+=c.svg; below=top+c.h; }
    if(b.pill){ const py=below+80; ov+=pillA(b.pill, CX, py, 56, { fill:'${RED}', color:'${PAPER}', padX:34, op: fade*sm((lt-0.5)/0.25) }); below=py+40; }
    if(b.kind==='hook'){
      art_+=noodle('beg', D.n.beg, 650, FEET, 690, 400, 0, fade, true);
      art_+=art('ic_gift', 225, 1300, 280, 1, 'gift', fade).replace('<g data-apart="gift"','<g data-apart="gift" data-feet="1418"');
    } else if(b.kind==='away'){
      // seven days pass: the calendar flips once each 1/9 of the beat; Noodle sits and waits, then naps
      const d=Math.min(7, 1+Math.floor(cl((lt-0.4)/(b.hold*0.75))*7)), fl=((lt-0.4)/(b.hold*0.75)*7)%1;
      art_+=calendar(225, below+270, d, d<7&&lt>0.4?fl*2.2-1.2:0, fade*sm(u*2.5));
      const napping=lt>b.hold*0.45; art_+=napping?noodle('nap', D.n.nap, 450, FEET, 300, 760, 0, fade, true):noodle('sit', D.n.sit, 640, FEET, 640, 420, 0, fade, true);
    } else if(b.kind==='letter'){
      art_+=shot('img_letter', LETTER_AR, 60, 425, 790, u, fade);
      const ly=425+790*LETTER_AR;
      ov+=pillA('a treat bag and 100 coins', 530, ly+108, 58, { fill:'#FFE3A1', padX:36, op: fade*sm((lt-0.6)/0.3) }, 'gift line');
      art_+=chip('bag', 135, ly+108, 66, cl((lt-0.8)/0.4), 'bag', fade);
      art_+=art('ger_wave', 175, FEET-0.44*240, 240, cl((lt-0.2)/0.4), 'Gerald', fade).replace('<g data-apart="Gerald"','<g data-apart="Gerald" data-feet="'+FEET+'"');
      art_+=noodle('yay', D.n.yay, 600, FEET, FEET-(ly+130)-40, 490, -Math.abs(Math.sin(t*7))*12, fade, true);
    } else if(b.kind==='diary'){
      // the game's own page, smaller, beside Noodle: the card above quotes its lines word for word
      const pw=380, py=below+70; art_+=shot('img_page', PAGE_AR, 466, py, pw, cl((lt-0.4)/0.35), fade);
      art_+=noodle('sit', D.n.sit, 235, FEET, FEET-below-60, 390, 0, fade, false);
    } else if(b.kind==='gift'){
      const y=below+190;
      art_+=chip('it_duck', 160, y, 82, cl((lt-0.6)/0.4), 'duck', fade);
      art_+=chip('it_carrot', 440, y-6, 118, cl((lt-0.15)/0.4), 'carrot', fade);
      art_+=chip('ic_coin', 725, y, 82, cl((lt-1.0)/0.4), 'coin', fade);
      art_+=noodle('paw', D.n.paw, CX, FEET, FEET-(y+125)-50, 700, 0, fade, false);
    } else if(b.kind==='days'){
      const n=Math.min(DAYS_ON.length, Math.floor(cl((lt-0.3)/(b.hold*0.55))*DAYS_ON.length+0.0001)), C=66, G=8, mw=7*C+6*G, x0=CX-mw/2, y0=below+64;
      art_+=month(x0, y0, n, fade*sm(u*2.5), C, G);
      const py=y0+4*C+3*G+14+74;
      if(n>0) ov+=pillA(n+(n===1?' day played, ever':' days played, ever'), CX, py, 52, { fill:'#FFE3A1', padX:30, op: fade }, 'count');
      art_+=noodle('idle', D.n.idle, CX, FEET, FEET-py-80, 720, 0, fade, true);
    } else if(b.kind==='mile'){
      const y=below+120; [7,30,100,365].forEach((n,j)=>{ art_+=medal(150+j*200, y, 74, n, cl((lt-0.3-j*0.45)/0.4)*fade); });
      art_+=art('ger_cheer', 180, FEET-0.44*280, 280, cl((lt-0.2)/0.4), 'Gerald', fade).replace('<g data-apart="Gerald"','<g data-apart="Gerald" data-feet="'+FEET+'"');
      art_+=noodle('yay', D.n.yay, 595, FEET, FEET-(y+74+60)-60, 500, -Math.abs(Math.sin(t*7))*12, fade, true);
    } else if(b.kind==='end'){
      art_+=noodle('yay', D.n.yay, CX, FEET, FEET-below-90, 720, -Math.abs(Math.sin(t*7))*14, fade, false);
    }
  }
  // the end card: paper and the card fade in once the scene has gone
  if(end){ ov+='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+endCard('tall',HANDLES,LOGO_INNER)+'</g>'; }
  $('art').innerHTML=art_; $('ov').innerHTML=ov;
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; ');
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ')+' | '+[...$('st').querySelectorAll('[data-apart]')].map((e)=>{ const r=e.getBoundingClientRect(); return e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }).join('; ');
  // standing things stand on the scene's floor (Noodle, Gerald, the gift): never above the fence base or the sofa's front, never on the garden plot
  if(fade>0) for(const e of $('art').querySelectorAll('[data-feet]')){ if(+(e.getAttribute('opacity')||1)<=0.05) continue; const r=e.getBoundingClientRect(), why=groundOk(BG[b.k], r.left, r.right, +e.getAttribute('data-feet'));
    if(why) return e.getAttribute('data-apart')+' '+why; }
  // the brief's tighter right edge for words and key art (x 850): every card, pill, image, item and Noodle
  for(const e of $('st').querySelectorAll('[data-apart],[data-box]')){ const r=e.getBoundingClientRect(); if(!r.width||+(e.getAttribute('opacity')||1)<=0.05) continue;
    if(r.right>854) return 'past x 850: '+(e.getAttribute('data-apart')||'box')+' '+Math.round(r.right); }
  return ''; };
// the cover: its own design, hook-led; key content inside the 1:1 crop (y 420..1500), the logo inside 4:5 (y 285..1635)
window.cover=function(D){
  // the game's own yard by day (autumn) behind it all: the title card on the sky, Noodle and the wrapped gift on the grass, the logo on its own cream card
  $('bg').innerHTML='<use href="#bg_yard"/>';
  let s='';
  s+='<g data-box data-apart="title"><rect x="70" y="430" width="940" height="300" rx="40" fill="${CREAM}" stroke="${PEN}" stroke-width="8"/>'
    +centred([{s:'Stop feeling bad',size:fitS('Stop feeling bad',112,860),pitch:120},{s:'about a week off',size:fitS('about a week off',112,860),fill:'${RED}'}],540,580,F).svg+'</g>';
  s+=pillA('your dog saved you a gift', 540, 815, 66, { fill:'#FFE3A1', padX:40 }, 'pill');
  s+=art('ic_gift', 250, 1330, 280, 1, 'gift');
  s+=noodle('beg', D.n.beg, 720, 1462, 560, 470, 0, 1, true);
  const lw=340, lh=lw*280/900; s+='<g data-apart="logo"><rect x="'+(540-lw/2-30)+'" y="1505" width="'+(lw+60)+'" height="'+f2(lh+14)+'" rx="30" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/><svg x="'+(540-lw/2)+'" y="1512" width="'+lw+'" height="'+f2(lh)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg></g>';
  $('art').innerHTML=''; $('ov').innerHTML=s;
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  const near=apartCheck($('st'),24); if(near.length) return 'cover too close: '+near.join('; ');
  for(const e of $('ov').querySelectorAll('[data-apart],[data-box]')){ const r=e.getBoundingClientRect(), logo=e.getAttribute('data-apart')==='logo';
    if(logo?(r.top<285||r.bottom>1635):(r.top<420||r.bottom>1500||r.left<0||r.right>1080)) return 'cover: outside the '+(logo?'4:5':'1:1')+' crop: '+e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  return ''; };
</script>`;

const drawFor = (t) => ({ n: Object.fromEntries(Object.keys(LOOK).map((k) => [k, dogSvg(k, t * 1.8)])) });
(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  // the game's scenes, each window rendered once at 1080 x 1920 (3.2x) and kept as a JPEG
  let bgSyms = '';
  for (const [k, sc] of Object.entries(SC)) {
    const f = path.join(WORK, `bg_${k}.jpg`), svg = PA.scene(sc.name, sc.o);
    if (!svg || !new RegExp('pa-wa-' + sc.name + '\\b').test(svg)) throw new Error('no scene art for ' + sc.name);
    await p.setContent(`<html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${sc.x0} 0 ${W / SCALE} ${H / SCALE}">${svg.replace('<svg', '<svg x="0" y="0" width="1000" height="600"')}</svg></body></html>`);
    await p.screenshot({ path: f, type: 'jpeg', quality: 92 });
    bgSyms += `<image id="bg_${k}" width="${W}" height="${H}" href="data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}"/>`;
  }
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html.replace('__BGSYMS__', bgSyms));
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const ht = Object.values(handles()).join('') + 'doodledoggo.app', latin = allText.replace(/[^\x20-\x7e]/g, '');
  await p.evaluate(([txt, ht]) => Promise.all([document.fonts.load('700 40px Caveat', txt + ht), document.fonts.load('700 40px Andika', ht)]), [latin, ht]);
  if (!(await p.evaluate(([txt, ht]) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', ht), [latin, ht]))) throw new Error('Caveat or Andika did not load');
  await p.evaluate(() => document.fonts.ready); fs.unlinkSync(pageFile);
  console.log('T =', T.toFixed(2), 's (', LOOP.toFixed(2), 's before the end card ),', NF, 'frames; beats at', VOAT.map((v) => v.k + ' ' + v.at.toFixed(2) + ' (' + HOLD[v.k].toFixed(2) + ')').join(', '));
  const render = async (t, file) => { const err = await p.evaluate(([t, D]) => window.frame(t, D), [t, drawFor(t)]); if (err) throw new Error(err + ' at ' + t.toFixed(2)); await p.screenshot({ path: file }); };
  if (process.env.ONLY === 'cover') {
    const err = await p.evaluate((D) => window.cover(D), drawFor(0.6)); if (err) throw new Error(err);
    const f = path.join(OUT, 'back-cover.jpg'); await p.screenshot({ path: f, type: 'jpeg', quality: 92 }); console.log('wrote', f); await b.close(); return; }
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, ...BEATS.flatMap((x) => [x.at + 0.9, x.at + x.hold * 0.85]).slice(1), LOOP + 0.15, LOOP + 1.2, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  for (const fi of fr) { await render(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close();
  for (let fi = NF; fs.existsSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's yard music, pops and ticks, Noodle on top ----
  const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: B.gift + 0.25, name: 'treasure' }, { at: B.mile + 0.4, name: 'levelup' }]]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64')); await ab.close();
  const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.3*sin(2*PI*(500-250*t)*t)*exp(-t*30)':s=44100:d=0.16", path.join(WORK, 'flip.wav')]);
  const EV = [];
  for (let d = 1; d < 7; d++) EV.push(['flip', B.away + 0.4 + HOLD.away * 0.75 * d / 7]);
  EV.push(['tick', B.letter + 0.1], ['tick', B.diary + 0.1], ['tick', B.gift + 0.2], ['tick', B.gift + 0.65], ['tick', B.gift + 1.05]);
  for (let j = 0; j < 12; j++) EV.push(['tick', B.days + 0.3 + HOLD.days * 0.55 * (j + 1) / 12]);
  [0, 1, 2, 3].forEach((j) => EV.push(['tick', B.mile + 0.35 + j * 0.45]));
  EV.push(['tick', LOOP + 0.15]);
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
    `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${LOOP.toFixed(2)}:d=${(T - LOOP).toFixed(2)}[m];[2:a]volume=-9dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
    '-map', '[a]', '-ar', '44100', pre]);
  const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
  ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  const mp4 = path.join(OUT, 'doodle-doggo-week-off.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
