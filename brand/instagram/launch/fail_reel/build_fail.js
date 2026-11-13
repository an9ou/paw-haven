// "Your dog can't fail in this game. I tried 5 ways." Reel (13 Nov 2026; shot table, facts and captions: docs/marketing/FAIL_REEL.md).
// Noodle the dachshund (PawArt.dog 'dachs', main's art) is the star of every beat, big, in the game's own scenes (PawArt.scene, autumn, a different
// place each beat: Hilltop Meadow, the Whispering Woods, Sunny Park in the rain, the Cozy House on a rainy day, Town Square, the Home Yard, the
// Training Ground, the Sunflower Fields, the Dog Park). Five tries to make him fail, each with a red "fail #n" badge crossed out by a green one:
// a log on a walk (the game's own log obstacle and bump line), the rain (wet outdoors, dry indoors), the Dog Show Pose (a ribbon for every show),
// a week away (Gerald's welcome-back letter, captured from a main build by ../back_reel/capture_back.js), and a missed trick (the game's own miss
// line). Then "Nothing bad ever happens here", the ask "comment a way to fail", and our standard end card (brand/kids/endcard.js) for 2.5 s.
// Every fact is checked against main's game text and code (game/i18n/en.json, mods/walkrun.js, 13_more_dogs.js, 49_funfair.js, 49b_ff_games.js,
// 15b_trick_games.js, 53_welcome.js, CLAUDE.md) and the build stops if one changed.
// Every frame: centreCheck(), safeCheck(), apartCheck() (../centre_text.js) over Noodle, every card, pill, badge, chip, the log and the letter;
// standing things on the scene's floor and clear of the scene's props near the ground (keep-out boxes); words and key art inside x 60..850,
// y 270..1440. 1080 x 1920, 30 fps. Voice: Kokoro af_bella 1.1x (vo_fail.json via ../friends_reel/vo_friends.py). Music: the game's own music
// (mods/pawaudio.js) about 11 dB under the voice, the game's rain ambience in the rain beat, stingers on the ribbon, the coins and the payoff.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/back_reel/capture_back.js <main checkout> <caps dir>      (the letter)
//   VO_LINES=brand/instagram/launch/fail_reel/vo_fail.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
//   ART_ROOT=<main checkout> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/fail_reel/build_fail.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills, TS=a,b,... for chosen times). ONLY=cover: fail-cover.jpg. FRAMES=a-b: re-render only frames a..b, then encode
//   again. DEBUG=1 draws the floor line and the keep-out boxes on stills. CHECK=1 runs every frame's checks without rendering (SOFT=1: list, don't stop).
const path = require('path'), fs = require('fs'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles } = require('../../../kids/endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'fail_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
const CAPS = path.resolve(process.env.CAPS || path.join(WORK, 'caps'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C', GREEN = '#3E8A4F';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
const VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'vo_fail.json'), 'utf8'));
for (const k of Object.keys(VOJSON)) if (VOJ.text[k] !== VOJSON[k]) throw new Error('the vo dir is not made from vo_fail.json: ' + k);

// ---- the facts, checked against main (the game's own words, numbers and rules) ----
const rd = (...p) => fs.readFileSync(path.join(ART_ROOT, ...p), 'utf8');
const EN = JSON.parse(rd('game', 'i18n', 'en.json'));
const must = (k, s) => { if (EN[k] !== s) throw new Error('the game text changed: ' + k + ' is now ' + JSON.stringify(EN[k])); };
const code = (file, re) => { if (!re.test(rd(...file.split('/')))) throw new Error(file + ' changed: ' + re); };
// 1. the log: a walk bump says one of the game's bump lines ("I meant to do that." is one), the walk goes on, no fail state
must('data.obs_label.log', 'Log'); must('mod.walk.pop_bonk', 'Bonk!'); must('data.walk_lines.bonk.2', 'I meant to do that.');
code('mods/walkrun.js', /no fail state/); code('mods/walkrun.js', /bonk: \['Bonk\. The log wins this round\.', 'Ow\. Dignity: minus one\.', 'I meant to do that\.'/);
code('mods/walkrun.js', /pickLine\('walk_lines\.bonk', WALK_LINES\.bonk\)/);
// 2. the rain: wet outdoors in the rain (no raincoat), dry indoors (the Cozy House is not outdoors); petting a wet dog says the line
must('yard.wet_dog_smell_intensifies', 'Wet dog smell intensifies.'); must('data.places.house.n', 'Cozy House');
code('game/src/13_more_dogs.js', /function wetScene\(\) \{ return !!S && \(cur\.mode === 'walk' \? !!\(W && W\.wx === 'rain'\) : weatherNow\(\) === 'rain' && outdoorView\(\)\); \}/);
code('game/src/13_more_dogs.js', /function wetDog\(d\) \{ return wetScene\(\) && !RAINCOATS\.includes/);
code('game/src/00_core.js', /house: \{ n: 'Cozy House', bond: 1, out: false \}/);
code('game/src/03_yard.js', /outdoorsNow\(\) && weatherNow\(\) === 'rain' && !hasRaincoat\(\) && !pet\.wet\) \{ pet\.wet = true; toast\(tt\('yard\.wet_dog_smell_intensifies'/);
// 3. the Dog Show Pose: a wrong trick shows the card again; every finished show ends with a ribbon (blue at the least) and Bond
must('ff.n_show', 'Dog Show Pose'); must('ff.h_show_peek', 'Mrs. Plum smiles and shows the card again.'); must('ff.r_ribbon', 'Mrs. Plum pins {ribbon} on {name}.');
must('ff.rib_b', 'a blue ribbon'); must('ff.r_title', 'Well played, {name}!');
code('game/src/49b_ff_games.js', /done\(G\) \{ const p = G\.data\.pts, R = S\.ff\.rib, k = p >= 9 \? 'g' : p >= 6 \? 'r' : 'b';/);
code('game/src/49b_ff_games.js', /D2\.L = \[2, 3, 3, 4, 5\]/); code('game/src/49b_ff_games.js', /const p = D2\.peeks \? 1 : 2; D2\.pts \+= p;/);
code('game/src/49b_ff_games.js', /a kind peek: the card turns up again and the round goes on/);
code('game/src/49_funfair.js', /const FF_BOND = 3, FF_HAPPY = 5;/);
// 4. a week away: back after 3+ days, Gerald's letter with a treat bag and 100 coins
must('wb.b_title', 'We kept your spot warm');
if (!/Welcome back!.*There is nothing to catch up on\..*Here is a treat bag and \{n\} coins/s.test(EN['wb.b_text'])) throw new Error('wb.b_text changed');
code('game/src/53_welcome.js', /WB_BACK_MS = 3 \* 864e5/); code('game/src/53_welcome.js', /WB_BACK_COINS = 100/);
const LETTER_TXT = fs.readFileSync(path.join(CAPS, 'gerald_letter.txt'), 'utf8');
if (!/We kept your spot warm/.test(LETTER_TXT) || !/Here is a treat bag and 100 coins/.test(LETTER_TXT)) throw new Error('the letter capture is not the welcome-back letter');
// 5. a missed trick: "Oops!" and a kind miss line, no progress lost, and the lesson goes on
must('tricks.oops', 'Oops! {line}'); must('data.tg_miss.2', 'Close! {n} invented a brand new trick. Nobody knows what it is.');
code('game/src/15b_trick_games.js', /const TG_GAIN = \{ Great: 0\.35, Good: 0\.2, Missed: 0 \};/);
code('game/src/15b_trick_games.js', /trainLine\(tt\('tricks\.oops', 'Oops! \{line\}', \{ line \}\), 'bad'\);/);
// the payoff: the design rule
code('CLAUDE.md', /\*\*Nothing bad ever happens\.\*\* No fail states, no sickness, death or running away\./);

// ---- the game's art (main), with the poses gliding between the game's drawings (the same patch as back_reel/build_back.js) ----
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of fs.readdirSync(path.join(ART_ROOT, 'world')).filter((f) => /^pawart_world_[a-z]\.js$/.test(f)).sort()) vm.runInContext(rd('world', f), ctx);
let src = rd('dogs', 'pawart_dogs.js');
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
let uid = 0; const uniq = (s) => { const p = 'u' + (uid++) + '_'; return s.replace(/id="([^"]+)"/g, `id="${p}$1"`).replace(/url\(#([^)]+)\)/g, `url(#${p}$1)`).replace(/href="#([^"]+)"/g, `href="#${p}$1"`); };
const sym = (s, id) => { if (!s || />\?<\/text>/.test(s)) throw new Error('no art for ' + id); return `<symbol id="${id}" viewBox="${vbOf(s)}" overflow="visible">${uniq(inner(s))}</symbol>`; };
const LOGSVG = PA.obstacle('log'); if (!/data-obstacle="log"/.test(LOGSVG)) throw new Error('no log obstacle art');
const SYMS = [sym(LOGSVG, 'obs_log'), sym(PA.item('Show Ribbon'), 'it_ribbon'), sym(fs.readFileSync(path.join(CAPS, 'treat_bag.svg'), 'utf8'), 'bag'), sym(PA.icon('coin'), 'ic_coin')].join('');
const png = (f) => { const b = fs.readFileSync(path.join(CAPS, f)); return { uri: 'data:image/png;base64,' + b.toString('base64'), w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };
const LETTER = png('gerald_letter.png');
const IMGS = `<symbol id="img_letter" viewBox="0 0 ${LETTER.w} ${LETTER.h}"><image href="${LETTER.uri}" width="${LETTER.w}" height="${LETTER.h}"/></symbol>`;
// Noodle's looks (never the game's sad or cold pose: a bump here is shown as a hop back and a proud face)
const LOOK = { walk: { pose: 'walk', facing: 'right' }, proud: { pose: 'idle', facing: 'right', expr: 'proud' }, sit: { pose: 'sit', facing: 'right' },
  wet: { pose: 'idle', facing: 'right', wet: true }, wetshake: { pose: 'shake', facing: 'right', wet: true }, nap: { pose: 'sleep', facing: 'right' },
  bow: { pose: 'bow', facing: 'right' }, yay: { pose: 'happy', facing: 'right', expr: 'hearts' }, scratch: { pose: 'scratch', facing: 'right' },
  curious: { pose: 'down', facing: 'right', expr: 'curious' } };
const dogSvg = (id, kf) => inner(PA.dog('dachs', Object.assign({ anim: false }, LOOK[id], { kf: ((kf % 3) + 3) % 3 })));
const dogSyms = Object.keys(LOOK).map((id) => `<symbol id="${id}_0" overflow="visible">${dogSvg(id, 0)}</symbol>`).join('');

// ---- the backgrounds: the game's own scenes from main (PawArt.scene, 1000 x 600, autumn), no game interface. Each beat shows the scene zoomed onto its
// open ground (SC[k].s, 3.7x to 5.2x): the bottom of the scene sits at the bottom of the frame and the back row of props (fences, trunks, poles, the
// sofa, the shops; FLOORS[name].back, scene y) ends above Noodle's head, so nothing that stands ever overlaps a prop (coordinator, 13 Nov 2026: "they
// reject any overlap"). x0 = the window's left edge in scene units, y0 = 600 - 1920 / s. Text never sits on the scene: every word is on a solid cream
// card, pill or badge. Every frame checks that Noodle, the log and every chip stand on the open ground: feet on the floor, top below the back row,
// clear of the keep-out boxes (props in front: benches, tunnels, the fountain, the garden plot...).
const AUT = { season: 'autumn', time: 'day' };
const SC = {
  hill: { name: 'hilltop', o: Object.assign({ weather: 'sunny' }, AUT), x0: 364, s: 5.2 },     // Hilltop Meadow: the river, the village, the meadow
  woods: { name: 'woods', o: Object.assign({ weather: 'sunny' }, AUT), x0: 222, s: 4.65 },      // the woods: the path and the pines (a walk)
  parkrain: { name: 'park', o: Object.assign({ weather: 'rain' }, AUT), x0: 290, s: 5.0, rain: true }, // Sunny Park on a rainy day
  houserain: { name: 'house', o: Object.assign({ weather: 'rain' }, AUT), x0: 357, s: 4.85 },   // the Cozy House: the sofa, the floorboards
  square: { name: 'square', o: Object.assign({ weather: 'sunny' }, AUT), x0: 262, s: 4.6 },    // Town Square: Paws & Pages, the plaza paving (the Dog Show Pose)
  door: { name: 'yard', o: Object.assign({ weather: 'sunny' }, AUT), x0: 280, s: 4.85 },       // the Home Yard: the fence and the grass
  training: { name: 'training', o: Object.assign({ weather: 'sunny' }, AUT), x0: 49, s: 4.8 }, // the Training Ground: the weave poles, the sand
  sunflower: { name: 'sunflower', o: Object.assign({ weather: 'sunny' }, AUT), x0: 352, s: 3.7 }, // the Sunflower Fields: the finish arch
  dogpark: { name: 'dogpark', o: Object.assign({ weather: 'sunny' }, AUT), x0: 296, s: 4.4 },  // the Dog Park: the fence and the grass
};
for (const sc of Object.values(SC)) sc.y0 = 600 - H / sc.s;
// scene floors (feet at y >= floor), the back row of props (a thing's top at y >= back) and keep-out boxes [x0, y0, x1, y1] in scene units
const FLOORS = {
  hilltop: { floor: 400, back: 400, keep: [[670, 505, 815, 575], [5, 395, 180, 600]] },
  woods: { floor: 400, back: 402, keep: [[95, 500, 190, 565], [640, 455, 865, 515], [930, 380, 970, 460]] },
  park: { floor: 405, back: 410, keep: [[5, 455, 215, 580], [670, 410, 812, 515], [570, 290, 610, 452]] },
  house: { floor: 405, back: 420, keep: [[5, 350, 215, 500], [600, 455, 860, 520]] },
  square: { floor: 395, back: 432, keep: [[5, 380, 245, 495], [620, 315, 860, 520]] },
  yard: { floor: 400, back: 420, keep: [[0, 425, 220, 600]] },
  training: { floor: 345, back: 395, keep: [[375, 440, 620, 522], [160, 540, 415, 600]] },
  sunflower: { floor: 360, back: 362, keep: [[100, 420, 210, 485], [825, 315, 930, 445]] },
  dogpark: { floor: 410, back: 412, keep: [[20, 380, 215, 480], [10, 390, 115, 600], [610, 410, 855, 515]] },
};
const LOGO_INNER = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8')).replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

// ---- the beats (each card carries the spoken words, so it works as the subtitles). vt: when the green badge comes (a share of the spoken line) ----
const BEATS = [
  { k: 'hook', bg: ['hill'], lines: ['My dog can’t fail', 'in this game.'], sub: 'I tried 5 ways.' },
  { k: 'log', bg: ['woods'], title: 'Way one:', lines: ['walk straight into a log.'], x: 'fail #1', v: 'he’s proud of it', vt: 0.6, bump: 0.47,
    quote: ['“I meant to do that.”'] },
  { k: 'rain', bg: ['parkrain', 'houserain'], split: 0.62, title: 'Way two:', lines: ['go out in the rain.'], x: 'fail #2', v: 'wet. then cosy.', vt: 0.62,
    quote: ['“Wet dog smell intensifies.”'], qa: 0.36 },
  { k: 'show', bg: ['square'], title: 'Way three:', lines: ['lose the dog show.'], x: 'fail #3', v: 'still a ribbon.', vt: 0.45,
    quote: ['“Mrs. Plum pins a blue ribbon', 'on Noodle.”'] },
  { k: 'away', bg: ['door'], title: 'Way four:', lines: ['forget about him for a week.'], x: 'fail #4', v: 'a welcome-back gift', vt: 0.42 },
  { k: 'trick', bg: ['training'], title: 'Way five:', lines: ['get every trick wrong.'], x: 'fail #5', v: 'a brand new trick.', vt: 0.4,
    quote: ['“Close! Noodle invented', 'a brand new trick.', 'Nobody knows what it is.”'] },
  { k: 'payoff', bg: ['sunflower'], lines: ['Nothing bad ever', 'happens here.'], small: 'That’s the point.', v: 'no fail states. ever.', vt: 0.25 },
  { k: 'ask', bg: ['dogpark'], lines: ['What should I', 'try next?'], ask: 'comment a way to fail' },
];
// the timeline (owner: fast): each card stays up for its spoken line + 0.4 s, then a 0.15 s pause before the next beat
const VOAT = []; let at = 0.1; const PAUSE = 0.15, B = {}, HOLD = {};
for (const b of BEATS) { HOLD[b.k] = VOD[b.k] + 0.4; B[b.k] = at; VOAT.push({ k: b.k, at }); b.at = at; b.hold = HOLD[b.k]; b.dur = VOD[b.k]; at += HOLD[b.k] + PAUSE; }
const LOOP = at - PAUSE + 0.2, T = LOOP + 2.5, NF = Math.round(T * FPS);
const COVER = { title: ['Your dog can’t fail', 'in this game'], pill: 'I tried 5 ways', x: 'fail', v: 'proud of it' };
const allText = BEATS.map((b) => [b.title || '', ...(b.lines || []), b.sub || '', b.small || '', b.x || '', b.v || '', b.ask || '', ...(b.quote || [])]).flat().join(' ')
  + ' Bonk! ' + COVER.title.join(' ') + COVER.pill + COVER.x + COVER.v + ' 0123456789';

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#fff}svg{display:block}[class$="-hl"]{display:none}.pa-dog *{animation:none!important}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${SYMS}${dogSyms}${IMGS}__BGSYMS__</defs>
<g id="bg"></g><g id="rain"></g><g id="dbg"></g>
<g id="fg"><g id="art"></g><g id="ov"></g></g><g id="ec"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), F='Caveat', CX=455, DEBUG=${!!process.env.DEBUG};
const BEATS=${JSON.stringify(BEATS)}, LOOP=${LOOP}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())}, COVER=${JSON.stringify(COVER)};
const LETTER_AR=${LETTER.h / LETTER.w}, SC=${JSON.stringify(SC)}, FLOORS=${JSON.stringify(FLOORS)};
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);}, lerp=(a,b,u)=>a+(b-a)*u;
const back=(x)=>{ x=cl(x); const c=1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
// which scene a beat shows at local time lt (the rain beat goes from the park in the rain to the Cozy House)
function sceneAt(b, lt){ return b.split&&lt>=b.dur*b.split-0.1 ? b.bg[1] : b.bg[0]; }
function bgLayers(i, lt, b){ const L=[], prev=i>0?BEATS[i-1].bg[BEATS[i-1].bg.length-1]:null, cur=b.bg[0], k=i===0?1:sm((lt+0.06)/0.35);
  if(prev&&prev!==cur&&k<1) L.push([prev,1]);
  L.push([cur,k]);
  if(b.split){ const q=sm((lt-(b.dur*b.split-0.25))/0.3); if(q>0) L.push([b.bg[1],q]); }
  return L; }
// something standing at screen x0..x1, top y0, feet fy: on the floor of the scene, clear of its keep-out boxes
function groundOk(key, x0, x1, y0, fy){ const s=SC[key], f=FLOORS[s.name], u0=s.x0+x0/s.s, u1=s.x0+x1/s.s, ut=s.y0+y0/s.s, uy=fy!=null?s.y0+fy/s.s:ut;
  if(fy!=null&&uy<f.floor) return 'stands above the floor ('+uy.toFixed(0)+' < '+f.floor+')';
  if(ut<f.back) return 'reaches up into the back row of props ('+ut.toFixed(0)+' < '+f.back+')';
  for(const k of f.keep) if(u1>k[0]&&u0<k[2]&&uy>k[1]&&ut<k[3]) return 'overlaps a scene prop ('+k.join(',')+')';
  return ''; }
const BOX={};
function box(id){ if(BOX[id]) return BOX[id]; const u=document.createElementNS(NSV,'use'); u.setAttribute('href','#'+id+'_0'); $('art').appendChild(u); const b=u.getBBox(); u.remove(); return BOX[id]=[b.x,b.y,b.width,b.height]; }
function dims(pose, hh, ww){ const b=box(pose), s=Math.min(hh/b[3], ww/b[2]); return { w:b[2]*s, h:b[3]*s }; }
// Noodle, standing on (cx, feet), at most hh tall and ww wide; flip: facing left
function noodle(pose, svg, cx, feet, hh, ww, dy, op, flip){ const b=box(pose), s=Math.min(hh/b[3], ww/b[2]), w=b[2]*s, h=b[3]*s;
  return '<g data-apart="Noodle" data-feet="'+f2(feet)+'" opacity="'+f2(op)+'"><ellipse cx="'+f2(cx)+'" cy="'+(feet-3)+'" rx="'+f2(w*0.36)+'" ry="13" fill="${PEN}" opacity=".18"/><g'+(flip?' transform="translate('+f2(2*cx)+' 0) scale(-1 1)"':'')+'><g transform="translate('+f2(cx-w/2)+' '+f2(feet-h+(dy||0))+') scale('+s.toFixed(4)+') translate('+f2(-b[0])+' '+f2(-b[1])+')">'+svg+'</g></g></g>'; }
// a cream round chip holding a piece of the game's art (an item never sits on a scene object: it floats in its own chip)
function chip(id, cx, cy, r, u, tag, op){ if(u<=0) return ''; const k=0.85+0.15*back(u*1.4), s=r*1.45;
  return '<g data-apart="'+(tag||id)+'" opacity="'+f2(sm(u*3)*(op==null?1:op))+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(k)+') translate('+f2(-cx)+' '+f2(-cy)+')"><circle cx="'+f2(cx)+'" cy="'+f2(cy)+'" r="'+r+'" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/><use href="#'+id+'" x="'+f2(cx-s/2)+'" y="'+f2(cy-s/2)+'" width="'+f2(s)+'" height="'+f2(s)+'"/></g>'; }
// a captured game screen, w wide, top at y, sliding up a little as it comes in
function shot(id, ar, x, y, w, u, op){ const h=w*ar, k=0.94+0.06*back(u); const ww=w*k, hh=h*k;
  return '<g data-apart="'+id+'" opacity="'+f2(sm(u*2.5)*op)+'"><use href="#'+id+'" x="'+f2(x+(w-ww)/2)+'" y="'+f2(y+(h-hh)/2+(1-sm(u))*30)+'" width="'+f2(ww)+'" height="'+f2(hh)+'"/></g>'; }
function fitS(s,max,w){ let z=max; while(z>20){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// a card: optional red title, lines, a small grey line, a red sub line; the text block centred in the card (centreCheck)
function card(b, top, op){ const W0=790, x0=CX-W0/2, L=[];
  if(b.title) L.push({s:b.title, size:fitS(b.title,70,W0-90), fill:'${RED}', pitch: 80});
  (b.lines||[]).forEach((s)=>L.push({s, size:fitS(s, b.k==='hook'?100:80, W0-80), pitch: b.k==='hook'?106:88}));
  if(b.small) L.push({s:b.small, size:fitS(b.small,52,W0-90), fill:'#8A7468', pitch: 58});
  if(b.sub) L.push({s:b.sub, size:fitS(b.sub,72,W0-90), fill:'${RED}', pitch: 80});
  const hh=L.reduce((a,l,i)=>a+(i<L.length-1?l.pitch:l.size*0.75),0)+(b.k==='hook'?120:92);
  const c=centred(L, CX, top+hh/2, F);
  return { h: hh, svg: '<g data-box data-apart="card" opacity="'+f2(op)+'"><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+f2(hh)+'" rx="38" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'+c.svg+'</g>' }; }
// a quote card: the game's own line, word for word
function quote(lines, top, op, tag){ const W0=720, x0=CX-W0/2, L=lines.map((s)=>({s, size:fitS(s,58,W0-70), pitch:64})), hh=L.reduce((a,l,i)=>a+(i<L.length-1?l.pitch:l.size*0.75),0)+70;
  return { h: hh, svg: '<g data-box data-apart="'+(tag||'quote')+'" opacity="'+f2(op)+'"><rect x="'+x0+'" y="'+f2(top)+'" width="'+W0+'" height="'+f2(hh)+'" rx="30" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/>'+centred(L, CX, top+hh/2, F).svg+'</g>' }; }
// the badges: a red cross "fail #n" (crossed out once the green tick comes) and a green tick; an icon disc and a cream pill, as one group
const BS=50, IR=33, IG=14;
function badgeW(s){ const k=inkOf(s,BS,F); return 2*IR+IG+k.L+k.R+56; }
function icon(kind, x, y, col){ const p=kind==='x'?'M-11 -11L11 11M11 -11L-11 11':kind==='v'?'M-13 1L-4 11L13 -11':'M0 -14V12M-10 3L0 13L10 3';
  return '<circle cx="'+f2(x)+'" cy="'+f2(y)+'" r="'+IR+'" fill="'+col+'" stroke="${PEN}" stroke-width="5"/><path transform="translate('+f2(x)+' '+f2(y)+')" d="'+p+'" fill="none" stroke="${PAPER}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>'; }
function badge(kind, s, x0, cy, op, strike, tag, scale){ const col=kind==='v'?'${GREEN}':'${RED}', w=badgeW(s), k=scale==null?1:scale, cx=x0+w/2;
  let g='<g data-apart="'+(tag||('badge-'+kind))+'" opacity="'+f2(op)+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(k)+') translate('+f2(-cx)+' '+f2(-cy)+')">'+icon(kind, x0+IR, cy, col);
  g+=pill(s, x0+2*IR+IG+(w-2*IR-IG)/2, cy, BS, F, { fill:'${CREAM}', color:col, padX:28 });
  if(strike>0){ const sx=x0-6, ex=x0+w+6, L=(ex-sx)*sm(strike); g+='<path d="M'+f2(sx)+' '+f2(cy+10)+' L'+f2(sx+L)+' '+f2(cy-8-18*(L/(ex-sx)))+'" stroke="${PEN}" stroke-width="8" stroke-linecap="round" opacity=".85"/>'; }
  return g+'</g>'; }
// the red-then-green pair: the red badge alone, centred; when the green comes the red slides left and is crossed out (a row, or two rows when too wide)
function pair(b, y, lt, op){ const vT=b.dur*b.vt, wx=badgeW(b.x), wv=badgeW(b.v), gap=40, row=wx+gap+wv<=790;
  const xu=sm((lt-0.25)/0.25), slide=row?sm((lt-vT)/0.18):0, vu=cl((lt-vT-(row?0.18:0))/0.3);
  const xFinal=row?CX-(wx+gap+wv)/2:CX-wx/2, x0=lerp(CX-wx/2, xFinal, slide);
  let s=badge('x', b.x, x0, y, op*xu, cl((lt-vT-0.1)/0.3), 'badge-x', 0.85+0.15*back(cl((lt-0.25)/0.3)));
  if(vu>0) s+=badge('v', b.v, row?xFinal+wx+gap:CX-wv/2, row?y:y+100, op*sm(vu*2), 0, 'badge-v', 0.85+0.15*back(vu));
  return { svg: s, bottom: (row?y:y+100)+40 }; }
// crayon rain over the park (the scene's own sky is grey on a rainy day; the game's rain falls over it)
function rainG(t, op){ if(op<=0.01) return ''; let s='<g opacity="'+f2(op*0.55)+'" stroke="#7E98B8" stroke-width="4" stroke-linecap="round">';
  for(let i=0;i<70;i++){ const x=(i*157.3)%1140-30, sp=900+(i%5)*90, y=((i*263.7+t*sp)%2100)-120; s+='<line x1="'+f2(x)+'" y1="'+f2(y)+'" x2="'+f2(x-10)+'" y2="'+f2(y+46)+'"/>'; }
  return s+'</g>'; }
const FEET=1425, CARD_TOP=300;
window.frame=function(t, D){
  let art_='', ov='';
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1;
  let i=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) i=j;
  const b=BEATS[i], lt=t-b.at;
  const u=i===0?1:cl((lt+0.06)/0.32); // the hook is there at frame 1
  const cop=fade*(i===0?1:sm(u*3));
  const L=bgLayers(i, lt, b).filter((l)=>l[1]>0.001);
  $('bg').innerHTML=L.map((l)=>'<use href="#bg_'+l[0]+'" opacity="'+f2(l[1])+'"/>').join('');
  $('rain').innerHTML=rainG(t, L.filter((l)=>SC[l[0]].rain).reduce((a,l)=>Math.max(a,l[1]),0)*fade);
  const scene=sceneAt(b, lt);
  if(fade>0){
    const c=card(b, CARD_TOP, cop); ov+=c.svg; let below=CARD_TOP+c.h;
    if(b.x){ const p=pair(b, below+72, lt, cop); ov+=p.svg; below=p.bottom; }
    else if(b.v){ const vu=cl((lt-b.dur*b.vt)/0.3); if(vu>0) ov+=badge('v', b.v, CX-badgeW(b.v)/2, below+72, fade*sm(vu*2), 0, 'badge-v', 0.85+0.15*back(vu)); below+=112; }
    else if(b.ask){ const au=cl((lt-0.5)/0.3); if(au>0) ov+=badge('d', b.ask, CX-badgeW(b.ask)/2, below+72, fade*sm(au*2), 0, 'badge-ask', 0.85+0.15*back(au)); below+=112; }
    const qa=b.quote?b.dur*(b.qa!=null?b.qa:b.vt):0, qz=b.split?b.dur*b.split-0.05:1e9;
    const qop=b.quote?fade*Math.min(sm((lt-qa)/0.25), 1-sm((lt-qz)/0.2)):0;
    let qb=below; if(b.quote){ const q=quote(b.quote, below+44, qop); if(qop>0.001) ov+=q.svg; qb=below+44+q.h; }
    const D0=D.n;
    if(b.k==='hook'){
      art_+=noodle('proud', D0.proud, CX, FEET, FEET-below-140, 740, 0, fade, false);
    } else if(b.k==='log'){
      // the game's log obstacle on the path: as in the game's walk, Noodle trots on the spot and the log comes to him; he bumps into it, hops back a
      // little and stands proud ("I meant to do that.")
      const lw=140, lh=lw*50/120, lx=659, bT=b.dur*b.bump, hh=FEET-qb-40, slide=35*(1-sm(cl(lt/bT)));
      art_+='<g data-apart="log" data-feet="'+FEET+'" opacity="'+f2(fade*sm((lt+0.06)/0.25))+'"><use href="#obs_log" x="'+f2(lx+slide)+'" y="'+f2(FEET-lh)+'" width="'+lw+'" height="'+f2(lh)+'"/></g>';
      const dw=dims('walk', hh, 510), dp=dims('proud', hh, 530), stopW=lx-55-dw.w/2, stopP=lx-55-dp.w/2-10;
      if(lt<bT){ art_+=noodle('walk', D0.walk, stopW, FEET, hh, 510, -Math.abs(Math.sin(t*9))*8, fade, false); }
      else { const r=cl((lt-bT)/0.3), x=lerp(Math.min(stopW,stopP+10), stopP, sm(r)); art_+=noodle('proud', D0.proud, x, FEET, hh, 530, -Math.sin(r*Math.PI)*26, fade, false); }
      const bo=fade*Math.min(sm((lt-bT)/0.08), 1-sm((lt-bT-0.95)/0.2)); if(bo>0.001) ov+=pill('Bonk!', 745, FEET-lh-110, 62, F, { fill:'${CREAM}', color:'${RED}', padX:26, op:f2(bo) }).replace('<g data-box','<g data-box data-apart="bonk"');
    } else if(b.k==='rain'){
      const sp=b.dur*b.split, hh=FEET-qb-40;
      if(lt<sp){ const o=fade*(1-sm((lt-(sp-0.2))/0.2)), shake=lt>b.dur*0.42&&lt<b.dur*0.56; art_+=noodle(shake?'wetshake':'wet', shake?D0.wetshake:D0.wet, CX, FEET, hh, 700, 0, o, false); }
      else { const o=fade*sm((lt-sp)/0.2); art_+=noodle('nap', D0.nap, CX, FEET, Math.min(hh, 420), 720, 0, o, false); }
    } else if(b.k==='show'){
      // the Dog Show Pose: Noodle bows; the blue Show Ribbon pops in its chip; Noodle cheers
      const vT=b.dur*b.vt, rb=cl((lt-vT-0.35)/0.4), hh=FEET-qb-40;
      art_+=noodle(rb>0.3?'yay':'bow', rb>0.3?D0.yay:D0.bow, 335, FEET, hh, 540, rb>0.3?-Math.abs(Math.sin(t*7))*12:0, fade, false);
      art_+=chip('it_ribbon', 752, FEET-150, 80, rb, 'ribbon', fade);
    } else if(b.k==='away'){
      // a week away: Noodle naps; then Gerald's letter (the game's own, captured), the treat bag, and Noodle up and happy
      // the letter on the left, the treat bag in its chip beside it, Noodle big below
      const vT=b.dur*b.vt, lu=cl((lt-vT+0.1)/0.35), lw=560, ly=below+40;
      if(lu>0) art_+=shot('img_letter', LETTER_AR, 64, ly, lw, lu, fade);
      const lb=ly+lw*LETTER_AR, hh=FEET-lb-50, up=lt>vT+0.25;
      art_+=chip('bag', 140, FEET-80, 64, cl((lt-vT-0.6)/0.4), 'bag', fade);
      art_+=noodle(up?'yay':'nap', up?D0.yay:D0.nap, 555, FEET, Math.min(hh, up?hh:360), 560, up?-Math.abs(Math.sin(t*7))*12:0, fade, true);
    } else if(b.k==='trick'){
      // a lesson: Noodle sits for the cue, then does something else entirely (the game's miss line), very pleased about it
      const hh=FEET-qb-40, ph=lt<b.dur*0.25?'sit':lt<b.dur*0.72?'scratch':'yay';
      art_+=noodle(ph, D0[ph], CX, FEET, hh, 660, ph==='yay'?-Math.abs(Math.sin(t*7))*12:0, fade, false);
    } else if(b.k==='payoff'){
      art_+=noodle('yay', D0.yay, CX, FEET, FEET-below-80, 740, -Math.abs(Math.sin(t*7))*14, fade, false);
    } else if(b.k==='ask'){
      art_+=noodle('curious', D0.curious, CX, FEET, FEET-below-80, 760, 0, fade, true);
    }
  }
  // the end card: paper and the card fade in once the scene has gone
  let ec=''; if(end){ ec='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+endCard('tall',HANDLES,LOGO_INNER)+'</g>'; }
  $('art').innerHTML=art_; $('ov').innerHTML=ov; $('ec').innerHTML=ec;
  if(DEBUG){ const s=SC[scene], f=FLOORS[s.name], Y=(y)=>(y-s.y0)*s.s; $('dbg').innerHTML='<line x1="0" x2="1080" y1="'+Y(f.floor)+'" y2="'+Y(f.floor)+'" stroke="red" stroke-width="3"/><line x1="0" x2="1080" y1="'+Y(f.back)+'" y2="'+Y(f.back)+'" stroke="blue" stroke-width="3"/>'+f.keep.map((k)=>'<rect x="'+(k[0]-s.x0)*s.s+'" y="'+Y(k[1])+'" width="'+(k[2]-k[0])*s.s+'" height="'+(k[3]-k[1])*s.s+'" fill="red" opacity=".25"/>').join(''); }
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; ');
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ')+' | '+[...$('st').querySelectorAll('[data-apart]')].map((e)=>{ const r=e.getBoundingClientRect(); return e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }).join('; ');
  // Noodle, the log and every chip stand on the open ground: feet on the floor, top below the back row of props, clear of the keep-out boxes
  if(fade>0) for(const e of $('art').querySelectorAll('[data-apart]')){ if(e.getAttribute('data-apart')==='img_letter'||+(e.getAttribute('opacity')||1)<=0.05) continue; const r=e.getBoundingClientRect(), why=groundOk(scene, r.left, r.right, r.top, e.hasAttribute('data-feet')?+e.getAttribute('data-feet'):null);
    if(why) return e.getAttribute('data-apart')+' '+why; }
  // the brief's safe area for words and key art: x 60..850, y 270..1440
  for(const e of $('st').querySelectorAll('[data-apart],[data-box]')){ const r=e.getBoundingClientRect(); if(!r.width||+(e.getAttribute('opacity')||1)<=0.05) continue;
    if(r.left<56||r.right>854||r.top<266||r.bottom>1444) return 'outside x 60..850, y 270..1440: '+(e.getAttribute('data-apart')||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  return ''; };
// the cover: its own design, hook-led; key content inside the 1:1 crop (y 420..1500), the logo inside 4:5 (y 285..1635)
window.cover=function(D){
  // the woods with the game's log: the title card on the sky, the red "fail" crossed out by the green "proud of it", Noodle big and proud by the log
  $('bg').innerHTML='<use href="#bg_woods"/>'; $('rain').innerHTML='';
  let s='', a='';
  s+='<g data-box data-apart="title"><rect x="70" y="430" width="940" height="300" rx="40" fill="${CREAM}" stroke="${PEN}" stroke-width="8"/>'
    +centred([{s:COVER.title[0],size:fitS(COVER.title[0],118,870),pitch:122},{s:COVER.title[1],size:fitS(COVER.title[1],118,870),fill:'${RED}'}],540,580,F).svg+'</g>';
  s+=pill(COVER.pill, 540, 812, 70, F, { fill:'#FFE3A1', padX:42 }).replace('<g data-box','<g data-box data-apart="pill"');
  const wx=badgeW(COVER.x)*1.15, wv=badgeW(COVER.v)*1.15, x0=540-(wx+40+wv)/2;
  s+=badge('x', COVER.x, x0+wx*0.065, 945, 1, 1, 'cx', 1.15)+badge('v', COVER.v, x0+wx+40+wv*0.065, 945, 1, 0, 'cv', 1.15);
  const lw=250, lh=lw*50/120; a+='<g data-apart="log"><use href="#obs_log" x="'+(1010-lw)+'" y="'+f2(1462-lh)+'" width="'+lw+'" height="'+f2(lh)+'"/></g>';
  const dp=dims('proud', 470, 640); a+=noodle('proud', D.n.proud, 1010-lw-70-dp.w/2, 1462, 470, 640, 0, 1, false);
  const LW=340, LH=LW*280/900; s+='<g data-apart="logo"><rect x="'+(540-LW/2-30)+'" y="1505" width="'+(LW+60)+'" height="'+f2(LH+14)+'" rx="30" fill="${CREAM}" stroke="${PEN}" stroke-width="6"/><svg x="'+(540-LW/2)+'" y="1512" width="'+LW+'" height="'+f2(LH)+'" viewBox="0 0 900 280">'+LOGO_INNER+'</svg></g>';
  $('art').innerHTML=a; $('ov').innerHTML=s; $('ec').innerHTML='';
  const bad=centreCheck($('st')); if(bad.length) return 'cover not centred: '+bad.join('; ');
  const near=apartCheck($('st'),24); if(near.length) return 'cover too close: '+near.join('; ');
  for(const e of $('st').querySelectorAll('[data-apart]')){ const r=e.getBoundingClientRect(), logo=e.getAttribute('data-apart')==='logo';
    if(logo?(r.top<285||r.bottom>1635):(r.top<420||r.bottom>1500||r.left<0||r.right>1080)) return 'cover: outside the '+(logo?'4:5':'1:1')+' crop: '+e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  for(const e of $('art').querySelectorAll('[data-apart]')){ const r=e.getBoundingClientRect(), why=groundOk('woods', r.left, r.right, r.top, 1462); if(why) return 'cover: '+e.getAttribute('data-apart')+' '+why; }
  return ''; };
</script>`;

const drawFor = (t) => ({ n: Object.fromEntries(Object.keys(LOOK).map((k) => [k, dogSvg(k, t * (k === 'walk' ? 4.5 : 1.8))])) });
(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  // the game's scenes, each window rendered once at 1080 x 1920 (3.2x) and kept as a JPEG
  let bgSyms = '';
  for (const [k, sc] of Object.entries(SC)) {
    const f = path.join(WORK, `bg_${k}.jpg`), svg = PA.scene(sc.name, sc.o);
    if (!svg || !new RegExp('pa-w[a-z]-' + sc.name + '\\b').test(svg)) throw new Error('no scene art for ' + sc.name);
    await p.setContent(`<html><style>[class$="-hl"],[class*="-hl "]{display:none!important}</style><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="${sc.x0} ${sc.y0} ${W / sc.s} ${H / sc.s}">${svg.replace('<svg', '<svg x="0" y="0" width="1000" height="600"')}</svg></body></html>`);
    await p.screenshot({ path: f, type: 'jpeg', quality: 92 });
    bgSyms += `<image id="bg_${k}" width="${W}" height="${H}" href="data:image/jpeg;base64,${fs.readFileSync(f).toString('base64')}"/>`;
  }
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html.replace('__BGSYMS__', bgSyms));
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const ht = Object.values(handles()).join('') + 'doodledoggo.app', latin = allText.replace(/[^\x20-\x7e‘-”]/g, '');
  await p.evaluate(([txt, ht]) => Promise.all([document.fonts.load('700 40px Caveat', txt + ht), document.fonts.load('700 40px Andika', ht)]), [latin, ht]);
  if (!(await p.evaluate(([txt, ht]) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', ht), [latin, ht]))) throw new Error('Caveat or Andika did not load');
  await p.evaluate(() => document.fonts.ready); fs.unlinkSync(pageFile);
  console.log('T =', T.toFixed(2), 's (', LOOP.toFixed(2), 's before the end card ),', NF, 'frames; beats at', VOAT.map((v) => v.k + ' ' + v.at.toFixed(2) + ' (' + HOLD[v.k].toFixed(2) + ')').join(', '));
  const render = async (t, file) => { const err = await p.evaluate(([t, D]) => window.frame(t, D), [t, drawFor(t)]); if (err) { if (process.env.SOFT) console.log('CHECK', t.toFixed(2), err.slice(0, 400)); else throw new Error(err + ' at ' + t.toFixed(2)); } if (!process.env.CHECK) await p.screenshot({ path: file }); };
  if (process.env.ONLY === 'cover') {
    const err = await p.evaluate((D) => window.cover(D), drawFor(0.6)); if (err) throw new Error(err);
    const f = path.join(OUT, 'fail-cover.jpg'); await p.screenshot({ path: f, type: 'jpeg', quality: 92 }); console.log('wrote', f); await b.close(); return; }
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, ...BEATS.flatMap((x) => [x.at + 0.9, x.at + x.hold * 0.85]).slice(1), LOOP + 0.15, LOOP + 1.2, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  for (const fi of fr) { await render(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close(); if (process.env.CHECK) { console.log('all', fr.length, 'frames checked'); return; }
  for (let fi = NF; fs.existsSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's music (the park, rain in the rain beat), stingers, pops and the bonk, Noodle's voice on top ----
  const by = (k) => BEATS.find((x) => x.k === k);
  const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async ([s, segs, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0.35 }, segments: segs, stingers: st })).wav,
    [T + 0.5, [{ at: 0, ctx: { place: 'park', time: 'day', weather: 'sunny' } }, { at: B.rain, ctx: { place: 'park', time: 'day', weather: 'rain' } }, { at: B.show, ctx: { place: 'park', time: 'day', weather: 'sunny' } }],
      [{ at: B.show + by('show').dur * by('show').vt + 0.35, name: 'discover' }, { at: B.away + by('away').dur * by('away').vt + 0.6, name: 'treasure' }, { at: B.payoff + 0.3, name: 'levelup' }]]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64')); await ab.close();
  const ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.35*sin(2*PI*(900+500*t)*t)*exp(-t*45)':s=44100:d=0.12", path.join(WORK, 'tick.wav')]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.6*sin(2*PI*(160-90*t)*t)*exp(-t*22)+0.25*sin(2*PI*330*t)*exp(-t*40)':s=44100:d=0.3", path.join(WORK, 'bonk.wav')]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.22*sin(2*PI*(260-120*t)*t)*exp(-t*14)':s=44100:d=0.25", path.join(WORK, 'cross.wav')]);
  ff(['-f', 'lavfi', '-i', "aevalsrc='0.3*(sin(2*PI*880*t)*exp(-t*20)+sin(2*PI*1320*t)*exp(-(t-0.08)*20)*gte(t,0.08))':s=44100:d=0.3", path.join(WORK, 'ding.wav')]);
  const EV = [];
  for (const x of BEATS) { EV.push(['tick', x.at + 0.05]); if (x.x) { EV.push(['tick', x.at + 0.3], ['cross', x.at + x.dur * x.vt + 0.12], ['ding', x.at + x.dur * x.vt + 0.2]); }
    else if (x.v) EV.push(['ding', x.at + x.dur * x.vt]); else if (x.ask) EV.push(['tick', x.at + 0.5]); }
  EV.push(['bonk', B.log + by('log').dur * by('log').bump], ['tick', LOOP + 0.15]);
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
  const mp4 = path.join(OUT, 'doodle-doggo-cant-fail.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
