// The 21 Nov 2026 "Help the town" Reel (v2.30 "Better together": the shared town goal; shot table, facts, hook scores and rebuild:
// docs/marketing/TOWN_GOAL_REEL.md). English cut only. Owner's approval, 21 Nov 2026: "Help the town: 2,000 belly rubs by 30 Nov".
// Six beats, each a real place of main (autumn, sunny, day; capture_town.js), Noodle big in front on open ground in every beat but the board's:
//   hook   Hilltop Meadow, the town below in the distance: "Only until 30 November: your town needs 2,000 belly rubs!"
//   rub    Maple Woods: Noodle petted (the game's pet pose and its floating hearts, fxText '♥'): "Give your dog a belly rub. It counts for the whole town!"
//   walk   Riverside: Noodle on a walk (the game's walk drawing, the camera going along): "Every pet counts 1. Every walk counts 3!"
//   board  the Town Square: the camera moves in on the notice board and Gerald's paper; its crayon meter fills as the game draws it
//          (glMiniDraw: the rect's width = data-w x the fill), from a PATCHED state: it shows how the board works, never a live count
//   gift   Lighthouse Pier: Gerald's treat bag, the game's own art (Gerald the duck, a Pupcake, Bone-shaped Biscuits): "When the town gets there,
//          everyone who helped gets a treat bag from Gerald!"
//   ask    Hilltop Meadow again, Noodle petted: "Give your dog a belly rub for the town 🐾", then our standard end card for 2.5 s.
// Every fact is checked against main (game/i18n/en.json, game/src/58b_goal.js, 49c_news.js, cloudflare/worker.js, V230.md, CHANGELOG.md) and the
// captures: the build stops if one changed. Every moving drawing is the game's own animation read off the FROZEN page clock (capture_town.js draw.json:
// 30 frames a loop at exactly 1000/30 ms); a run plays loop frame (n - its first frame) mod 30. Noodle breathes and sways and every camera moves a little
// all the time, so no frame is ever frozen. Every frame: centreCheck(), safeCheck(), apartCheck() (../centre_text.js), Noodle on the scene's floor and 28 px
// clear of its props (PROPS below, in scene units), the cards and the hearts 28 px clear of the props, words and key art inside x 60..850, y 270..1440.
// 1080 x 1920, 30 fps. Voice: Noodle, Kokoro af_bella 1.1x (vo_town.json via ../friends_reel/vo_friends.py). Music: the game's own Town Square music
// (mods/pawaudio.js) about 11 dB under the voice; the game's own squeak and boop (SFX.squeak, SFX.boop) with each heart, its pop (SFX.pop) on the treat bag.
//
//   git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/town_goal_reel/capture_town.js <main> <caps dir>
//   VO_LINES=brand/instagram/launch/town_goal_reel/vo_town.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
//   ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/town_goal_reel/build_town.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills, TS=a,b,...). FRAMES=a-b: re-render only frames a..b, then encode again with the same sound.
//   CHECK=1: every frame's checks without screenshots. LOOSE=1 (stills only, for layout work): print a failed check and go on.
const path = require('path'), fs = require('fs'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles } = require('../../../kids/endcard.js');
const { checkFrames } = require('../frozen_clock.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'town_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
const CAPS = path.resolve(process.env.CAPS || path.join(WORK, 'caps'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
const VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'vo_town.json'), 'utf8'));
for (const k of Object.keys(VOJSON)) if (VOJ.text[k] !== VOJSON[k]) throw new Error('the vo dir is not made from vo_town.json: ' + k);

// ---- the facts, checked against main (the game's own words, numbers and art) and the captures ----
const EN = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
const SRC = (f) => fs.readFileSync(path.join(ART_ROOT, 'game', 'src', f), 'utf8');
const must = (k, s) => { if (EN[k] !== s) throw new Error('the game text changed: ' + k + ' is ' + JSON.stringify(EN[k]) + ', not ' + JSON.stringify(s)); };
must('gl.title', 'Town goal');
must('gl.intro', 'One goal for the whole town. Every pet counts 1 and every walk counts 3. No names, no ranks: just the town together.');
must('gl.goal_line', '{goal} belly rubs in {month}');
must('gl.gift', 'When the town gets there, everyone who helped gets a treat bag from Gerald: {gift}. If the town is not there by the end of the month, nothing is lost: a new goal simply starts.');
must('nw.v230.goal', 'A town goal every month: every belly rub and walk in town adds up on the board in the Town Square');
must('nw.v230.gift', 'When the town reaches the goal, everyone who helped gets a treat bag from Gerald');
must('data.food.pupcake.n', 'Pupcake'); must('data.food.bone_shaped_biscuit.n', 'Bone-shaped Biscuit');
const GLS = SRC('58b_goal.js');
if (!GLS.includes('GL_PET = 1, GL_WALK = 3') || !GLS.includes("on('act:pet', (d) => { glAdd(") || !GLS.includes("on('act:walk', () => { glAdd(GL_WALK); });")) throw new Error('a pet no longer counts 1 or a walk 3');
if (!GLS.includes("const GL_TREATS = [['Pupcake', 1], ['Bone-shaped Biscuit', 3]];")) throw new Error('the treat bag changed');
if (!GLS.includes("m === '2026-11' ? 2000 : 10000")) throw new Error('the November 2026 goal changed in the game');
if (!GLS.includes("k.raw(`<rect class=\"gl-note-fill\" x=\"${mx + 1.2}\" y=\"${my + 1.2}\" width=\"${praR1((mw - 2.4) * f)}\" height=\"${mh - 2.4}\" rx=\"1.8\" fill=\"${PRA_C.pinkD}\" data-w=\"${mw - 2.4}\"/>`);")
  || !GLS.includes("document.querySelectorAll('#glG .gl-note-fill').forEach((r) => r.setAttribute('width', String(praR1((+r.dataset.w || 0) * f))));")) throw new Error('the board\'s meter is drawn another way now');
const WK = fs.readFileSync(path.join(ART_ROOT, 'cloudflare', 'worker.js'), 'utf8');
if (!WK.includes("const GL_MONTH_GOAL = { '2026-11': 2000 };") || !/const GL_GOAL = 10000,/.test(WK)) throw new Error('the Worker\'s goals changed (2,000 for Nov 2026, 10,000 a month)');
if (!/const NEWS_V230 = \{[^\n]*\n\s*id: '2\.30', date: '2026-11-20'/.test(SRC('49c_news.js'))) throw new Error('the v2.30 launch date changed (the Reel says the goal is on now)');
const V230 = fs.readFileSync(path.join(ART_ROOT, 'V230.md'), 'utf8'), CHL = fs.readFileSync(path.join(ART_ROOT, 'CHANGELOG.md'), 'utf8');
if (!V230.includes('**November 2026: 2,000**') || !V230.includes('each pet of a dog counts 1, each walk counts 3') || !V230.includes('1 Pupcake and 3 Bone-shaped Biscuits') || !V230.includes('**No names, no leaderboard,'))
  throw new Error('V230.md changed');
if (!CHL.includes('| 2026-11-20 | v2.30 Better together |') || !CHL.includes('Town goal 2,000 belly rubs for November 2026, 10,000 a month from December') || !CHL.includes('(1 Pupcake, 3 Bone-shaped Biscuits)')) throw new Error('the v2.30 CHANGELOG row changed');
if (new Date(2026, 10, 30).getDay() !== 1) throw new Error('30 Nov 2026 is not a Monday?');
// the captures (capture_town.js)
const FACTS = JSON.parse(fs.readFileSync(path.join(CAPS, 'facts.json'), 'utf8'));
if (FACTS.date !== '2026-11-21' || !FACTS.glOn || FACTS.glMonth !== '2026-11' || JSON.stringify(FACTS.treats) !== '[["Pupcake",1],["Bone-shaped Biscuit",3]]') throw new Error('the captures: ' + JSON.stringify(FACTS));
const NAMES = { hilltop: 'Hilltop Meadow', woods: 'Maple Woods', river: 'Riverside', square: 'Town Square', pier: 'Lighthouse Pier' };
for (const [k, n] of Object.entries(NAMES)) { if (!FACTS.scenes[k] || FACTS.scenes[k].name !== n) throw new Error('no capture of ' + n);
  if (!/data-time="day" data-weather="sunny" data-season="autumn"/.test(fs.readFileSync(path.join(CAPS, k + '.svg'), 'utf8'))) throw new Error(n + ' is not an autumn, sunny day'); }
const GLF = FACTS.scenes.square.gl;
if (!GLF || GLF.aria !== 'Town goal' || GLF.dataW !== '35.6' || GLF.w !== '0' || GLF.tf !== 'matrix(.8 0 0 .8 153 -17.6)') throw new Error('Gerald\'s paper on the board: ' + JSON.stringify(GLF));
const DRAW = JSON.parse(fs.readFileSync(path.join(CAPS, 'draw.json'), 'utf8'));
for (const [k, d] of Object.entries(DRAW)) {
  if (d.vis.length !== 30 || d.step !== '1000/30 ms, frozen clock') throw new Error('the drawing ' + k + ' is not a 30-frame loop off the frozen clock');
  d.idx = d.vis.map((v) => { if (v.filter((x) => x === 1).length !== 1 || v.filter((x) => x === 0).length !== v.length - 1) throw new Error('the frame animation of ' + k + ' is not a step: ' + JSON.stringify(v)); return v.indexOf(1); });
}
const ART = JSON.parse(fs.readFileSync(path.join(CAPS, 'art.json'), 'utf8'));
if (!/aria-label="Gerald the duck" data-pose="cheer"/.test(ART.gerald_cheer) || !/aria-label="Pupcake"/.test(ART.pupcake) || !/aria-label="Bone-shaped Biscuit"/.test(ART.biscuit)) throw new Error('the game\'s art changed');
const inner = (s) => s.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const vbOf = (s) => /viewBox="([^"]*)"/.exec(s)[1];
const LOGO_INNER = fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/g, '').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

// ---- the places: each a window of the game's scene (scene units; px = (u - x0) x s), rendered once at RES px a unit (the region R) ----
// PROPS: the scene's props in scene units (x0 y0 x1 y1), read off a unit grid of the grab and the floor props' own boxes (props.json): Noodle, the cards and
// the hearts keep 28 px clear of every one that is in the frame. The far hills, the pine row, the river and the sea, the town in the distance, the
// buildings round the Square and the pier's rail are the backdrop (BACK: the town in the distance is only kept clear of the cards, so the hook
// shows it; the pet hearts may float over it). FLOOR: the back of the floor (Noodle's feet stand below it).
const SCN = {
  hilltop: { R: [520, 0, 960, 600], RES: 3.6, FLOOR: 356,
    PROPS: { run: [102, 205, 297, 366], bench: [356, 344, 444, 414], blanket: [620, 472, 902, 560], sign: [66, 465, 179, 585], tree: [1194, 244, 1441, 469], kite: [488, 70, 565, 248],
      kite2: [220, 168, 260, 282], bone: [990, 68, 1092, 128], town: [527, 238, 905, 322] }, BACK: ['town'] },
  woods: { R: [600, 60, 1000, 600], RES: 4, FLOOR: 345,
    PROPS: { arch: [466, 116, 654, 360], tree1: [103, 294, 288, 484], tree2: [878, 263, 1027, 416], stump: [374, 494, 489, 558], log: [1082, 471, 1296, 535], pine: [1421, 234, 1637, 505],
      run: [1202, 203, 1397, 364], sun: [848, 42, 948, 148], heart: [690, 160, 708, 180], mush1: [286, 400, 314, 426], acorns: [893, 402, 1004, 422], mush2: [1338, 402, 1396, 437] } },
  river: { R: [380, 40, 800, 600], RES: 3.5, FLOOR: 362,
    PROPS: { willow: [108, 288, 394, 552], reedsL: [65, 282, 168, 378], boat: [383, 278, 562, 352], bridge: [613, 230, 1024, 320], bench: [735, 353, 825, 426], stone1: [496, 465, 558, 496],
      stones2: [968, 529, 1079, 574], ducks: [1105, 295, 1260, 345], reedsR: [1070, 286, 1110, 378], sign: [1454, 473, 1571, 597], run: [1380, 211, 1579, 376] } },
  square: { R: [596, 20, 1000, 600], RES: 6, FLOOR: 346,
    PROPS: { board: [632, 224, 861, 402], lampR: [625, 276, 655, 406], lampL: [330, 276, 360, 406], bench: [702, 400, 818, 492], run: [404, 212, 580, 359], planter2: [901, 526, 997, 592], sun: [828, 25, 925, 122] } },
  pier: { R: [600, 40, 1000, 600], RES: 3.5, FLOOR: 360,
    PROPS: { lamp1: [601, 258, 639, 404], lamp2: [1203, 258, 1241, 404], bench: [853, 323, 947, 397], gull: [856, 260, 907, 297], crates: [1096, 366, 1260, 489], rod: [296, 273, 352, 442],
      buoy: [348, 286, 412, 347], pumpkins: [400, 533, 470, 572], post1: [8, 418, 74, 600], post2: [1523, 403, 1587, 600], run: [1404, 232, 1536, 372], sailboat: [1023, 226, 1102, 320], sun: [1322, 42, 1432, 148] } },
};
// Gerald's paper (capture: #glG, matrix(.8 0 0 .8 153 -17.6), the paper rotated 4 degrees round (792, 419) in its own units; the meter's fill rect
// x 774.2 y 423.2, 35.6 x 4.6, rx 1.8, PRA_C.pinkD #F28FA5); its centre in scene units, for the camera
if (JSON.stringify(FACTS.scenes.square.notice) !== '[634,226,859,400]') throw new Error('the notice board moved: ' + FACTS.scenes.square.notice);
const NOTE = { tf: 'matrix(.8 0 0 .8 153 -17.6)', rot: 'rotate(4 792 419)', x: 774.2, y: 423.2, w: 35.6, h: 4.6, fill: '#F28FA5', cx: 0.8 * 792 + 153, cy: 0.8 * 419 - 17.6 };
if (!fs.readFileSync(path.join(CAPS, 'square.svg'), 'utf8').includes('<rect class="gl-note-fill" x="774.2" y="423.2" width="0" height="4.6" rx="1.8" fill="#F28FA5" data-w="35.6"></rect>')) throw new Error('the note\'s meter moved: measure NOTE again');

// ---- the beats (each card carries the spoken words, so it works as the subtitles) ----
// the timeline (owner, 13 Nov 2026: fast): a card stays up for its spoken line + 0.4 s, then a 0.15 s pause; the board's beat 0.3 s more for its meter
const PAUSE = 0.15, BEATS = []; let at = 0.1;
const beat = (o, hold, pause) => { o.at = at; o.hold = hold; BEATS.push(o); at += hold + pause; return o; };
beat({ k: 'hook', sc: 'hilltop', pose: 'idle', big: true, size: 84, lines: ['Only until 30 November:', 'your town needs', '2,000 belly rubs!'], cam: { s: 3.5, y0: 51.4, x0: [572, 584] } }, VOD.hook + 0.4, PAUSE);
beat({ k: 'rub', sc: 'woods', pose: 'pet', hearts: true, lines: ['Give your dog a belly rub.', 'It counts for the whole town!'], cam: { s: 4, y0: 120, x0: [654, 662] } }, VOD.rub + 0.4, PAUSE);
beat({ k: 'walk', sc: 'river', pose: 'walk', feet: 1385, size: 84, lines: ['Every pet counts 1.', 'Every walk counts 3!'], cam: { s: 3.5, y0: 51.4, x0: [402, 466] } }, VOD.walk + 0.4, PAUSE);
beat({ k: 'board', sc: 'square', pose: null, title: 'How it works', lines: ['Watch Gerald\'s board in', 'the Town Square fill up!'], cam: 'board', fill: [0.03, 0.72] }, VOD.board + 0.7, PAUSE);
beat({ k: 'gift', sc: 'pier', pose: 'happy', gift: true, cam: { s: 3.5, y0: 51.4, x0: [636, 646] },
  lines: ['When the town gets there,', 'everyone who helped gets', 'a treat bag from Gerald!'], items: ['1 Pupcake', '3 Bone-shaped Biscuits'] }, VOD.gift + 0.4, PAUSE);
beat({ k: 'ask', sc: 'hilltop', pose: 'pet', hearts: true, big: true, lines: ['Give your dog a belly rub', 'for the town 🐾'], cam: { s: 3.5, y0: 51.4, x0: [586, 596] } }, VOD.ask + 0.4, 0);
const LOOP = at + 0.1, T = LOOP + 2.5, NF = Math.round(T * FPS);
const VOAT = BEATS.map((b) => ({ k: b.k, at: b.at }));
// the board's camera: from the whole board (s 3.5, the board in the middle) in to Gerald's paper (s 5.2); it never stops moving
const BOARD = { face: FACTS.scenes.square.notice, s0: 3.5, s1: 5.2, p0: [NOTE.cx, NOTE.cy], c0: null, c1: [455, 1150] };
BOARD.c0 = [455 + (NOTE.cx - (632 + 861) / 2) * 3.5, (NOTE.cy - 51.4) * 3.5];
// pet ticks: a heart (and the game's squeak or boop) every 0.3 s while Noodle is petted, from 0.25 s into the beat until 0.7 s before its end
const rnd = (() => { let s = 20261121; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; })();
const HEARTS = [];
for (const b of BEATS) if (b.hearts) for (let t = b.at + 0.25; t < b.at + b.hold - 0.7; t += 0.3) HEARTS.push({ t, b: b.k, dx: rnd() * 2 - 1, sq: rnd() < 0.7, f: 500 + rnd() * 300 });
// house words (README): no em dash, no "breed" as a verb, no "sell", no itch.io, no "Sunday", no "we're at"; no live numbers (only the goal and the weights)
const allText = BEATS.map((b) => [b.title || '', ...(b.lines || []), ...(b.items || [])].join(' ')).join(' ') + ' 0123456789';
if (/—|\bbreed(s|ing)?\b|\bsell|itch|%|sunday|we'?re at|so far/i.test(allText + JSON.stringify(VOJSON))) throw new Error('a word the house rules ban: ' + allText);
const nums = (allText.replace(' 0123456789', '').match(/\d[\d,]*/g) || []); if (nums.join(' ') !== '30 2,000 1 3 1 3') throw new Error('numbers on screen: ' + nums.join(' '));
if (T < 22 || T > 32) throw new Error('the Reel is ' + T.toFixed(2) + ' s, not 22..32');

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#fff}svg{display:block}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs id="defs">
<symbol id="ger" viewBox="${vbOf(ART.gerald_cheer)}" overflow="visible">${inner(ART.gerald_cheer)}</symbol>
<symbol id="cake" viewBox="${vbOf(ART.pupcake)}" overflow="visible">${inner(ART.pupcake)}</symbol>
<symbol id="bisc" viewBox="${vbOf(ART.biscuit)}" overflow="visible">${inner(ART.biscuit)}</symbol>
</defs>
<g id="bg"></g><g id="fg"><g id="art"></g><g id="ov"></g></g><g id="ec"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), F='Caveat', CX=455;
const BEATS=${JSON.stringify(BEATS)}, LOOP=${LOOP}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())};
const SCN=${JSON.stringify(SCN)}, NOTE=${JSON.stringify(NOTE)}, BOARD=${JSON.stringify(BOARD)}, HEARTS=${JSON.stringify(HEARTS)};
const IDX=${JSON.stringify(Object.fromEntries(Object.entries(DRAW).map(([k, d]) => [k, d.idx])))};
const BGS=__BGS__;
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);};
const back=(x)=>{ x=cl(x); const c=1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
// CSS ease-out, cubic-bezier(0, 0, .58, 1), as the game's floatUp hearts
function easeOut(x){ x=cl(x); let lo=0,hi=1; for(let i=0;i<30;i++){ const m=(lo+hi)/2, bx=3*(1-m)*m*m*0.58+m*m*m; if(bx<x) lo=m; else hi=m; } const u=(lo+hi)/2; return 3*(1-u)*u*u*1+u*u*u; }
const gap=(r,k)=>Math.max(k.l-r.right, r.left-k.r, k.t-r.bottom, r.top-k.b);
// ---- the game's drawings: each captured SVG split into its ground shadow and its three keyframes (a symbol each), measured once ----
const DR={};
function initDrawings(DRAW){ const defs=$('defs'), P=new DOMParser();
  for(const [k,d] of Object.entries(DRAW)){ const doc=P.parseFromString(d.svg,'image/svg+xml'), root=doc.documentElement, outer=root.firstElementChild;
    const frames=[...outer.children].filter((e)=>/\\bpa-d-f\\d\\b/.test(e.getAttribute('class')||'')), shadow=[...outer.children].filter((e)=>!frames.includes(e));
    if(frames.length!==3) throw new Error(k+' has '+frames.length+' keyframes');
    const tr=outer.getAttribute('transform'), wrap=(s)=>tr?'<g transform="'+tr+'">'+s+'</g>':s, ser=(e)=>new XMLSerializer().serializeToString(e);
    const mk=(id,s)=>{ const sy=document.createElementNS(NSV,'symbol'); sy.setAttribute('id',id); sy.setAttribute('overflow','visible'); sy.innerHTML=s; defs.appendChild(sy); };
    mk('sh_'+k, wrap(shadow.map(ser).join('')));
    frames.forEach((e,i)=>{ const c=e.cloneNode(true); c.removeAttribute('style'); c.setAttribute('class',(c.getAttribute('class')||'').replace(/\\bpa-d-f\\d\\b/,'')); mk('fr_'+k+'_'+i, wrap(ser(c))); });
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(let i=0;i<3;i++){ const u=document.createElementNS(NSV,'use'); u.setAttribute('href','#fr_'+k+'_'+i); $('art').appendChild(u); const b=u.getBBox(); u.remove(); x0=Math.min(x0,b.x); y0=Math.min(y0,b.y); x1=Math.max(x1,b.x+b.width); y1=Math.max(y1,b.y+b.height); }
    DR[k]={x0,y0,x1,y1}; }
  return Object.fromEntries(Object.entries(DR).map(([k,b])=>[k,[b.x0,b.y0,b.x1,b.y1].map(Math.round).join(',')])); }
const kf=(k,t,s)=>IDX[k][((Math.floor((t-s)*30+1e-3)%30)+30)%30];
// a dog drawn from the game's drawings, the art's x = ax on x = cx, its feet (y 186) on y = feet, scale z; it breathes and sways a little all the time
function dogG(tag, k, i, cx, feet, z, o){ o=o||{}; const tx=cx-o.ax*z, ty=feet-186*z, NT=o.nt||0;
  const br=1+0.02*Math.sin(NT*5.2), sw=1.6*Math.sin(NT*2.6+Math.PI/8);
  const lean='translate('+f2(cx)+' '+f2(feet)+') rotate('+f2(sw)+') scale('+f2(2-br)+' '+br.toFixed(4)+') translate('+f2(-cx)+' '+f2(-feet)+')';
  const at='translate('+f2(tx)+' '+f2(ty)+') scale('+z.toFixed(4)+')';
  return '<g data-apart="'+tag+'" data-feet="'+f2(feet)+'" opacity="'+f2(o.op==null?1:o.op)+'"><g transform="'+lean+'"><g transform="'+at+'"><use href="#sh_'+k+'"/><use href="#fr_'+k+'_'+i+'"/></g></g></g>'; }
function fitS(s,max,w){ let z=max; while(z>20){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// a card: optional red title, lines; the text block centred in the card
function card(b, top, op){ const W0=790, x0=CX-W0/2, L=[], big=!!b.big, sz=b.size||(big?96:64);
  if(b.title) L.push({s:b.title, size:fitS(b.title,70,W0-90), fill:'${RED}', pitch:76});
  (b.lines||[]).forEach((s)=>L.push({s, size:fitS(s, sz, W0-90), pitch: Math.round(sz*1.04)}));
  const hh=L.reduce((a,l,i)=>a+(i<L.length-1?l.pitch:l.size*0.75),0)+(big?88:70);
  return { h: hh, svg: '<g data-box data-apart="card" data-over="1" opacity="'+f2(op)+'"><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+f2(hh)+'" rx="38" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'+centred(L, CX, top+hh/2, F).svg+'</g>' }; }
// the treat bag card: Gerald (the game's art) beside the words in their own box; under them the bag's two items, each the game's own art over its label
function giftCard(b, top, op, u){ const W0=790, x0=CX-W0/2, h=420, k=0.94+0.06*back(u*1.3), cx=x0+W0/2, cy=top+h/2;
  const tb={x:x0+232, y:top+20, w:W0-232-20, h:200}, L=b.lines.map((s)=>({s, size:fitS(s,56,tb.w-40), pitch:60}));
  let s='<g data-apart="card" data-over="1" data-safe opacity="'+f2(op)+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(k)+') translate('+f2(-cx)+' '+f2(-cy)+')"><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+h+'" rx="38" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'
    +'<use href="#ger" x="'+(x0+18)+'" y="'+(top+14)+'" width="206" height="206"/>'
    +'<g data-box><rect x="'+tb.x+'" y="'+tb.y+'" width="'+tb.w+'" height="'+tb.h+'" rx="22" fill="#FFF3DA" stroke="#E2C9A0" stroke-width="3"/>'+centred(L, tb.x+tb.w/2, tb.y+tb.h/2, F).svg+'</g>';
  const cols=[x0+W0*0.25, x0+W0*0.68], ay=top+236, ly=top+374;
  s+='<use href="#cake" x="'+f2(cols[0]-50)+'" y="'+ay+'" width="100" height="100"/>';
  [-54,0,54].forEach((dx,j)=>{ s+='<g transform="rotate('+[-12,0,12][j]+' '+f2(cols[1]+dx)+' '+(ay+50)+')"><use href="#bisc" x="'+f2(cols[1]+dx-46)+'" y="'+(ay+4)+'" width="92" height="92"/></g>'; });
  b.items.forEach((it,j)=>{ s+=pill(it, cols[j], ly, fitS(it,46,j?340:260), F, { fill:'#FFF3DA', padX:24 }); });
  return s+'</g>'; }
// the game's pet heart (03_yard.js fxText('♥'): font-size 38 world units, #F28FA5, a 1.4 ink stroke under the fill; 04_view_scene.css floatUp: 1 s ease-out
// to translateY(-90) rotate(15deg) and opacity 0, round the glyph's own box corner), in the place's own scale
function heart(x, y, s, u){ const e=easeOut(u), fs=38*s, ty=-90*s*e, op=1-e;
  return '<g data-wash="heart" opacity="'+f2(op)+'"><text x="'+f2(x)+'" y="'+f2(y+ty)+'" font-family="Caveat" font-weight="700" font-size="'+f2(fs)+'" fill="#F28FA5" stroke="${PEN}" stroke-width="'+f2(1.4*s)+'" paint-order="stroke" text-anchor="middle" transform="rotate('+f2(15*e)+' '+f2(x-fs*0.3)+' '+f2(y+ty-fs*0.7)+')">♥</text></g>'; }
// ---- the camera of a beat at time t: s, x0, y0 (px = (u - x0) x s); every camera keeps moving (a slow drift, the board's push-in) ----
function camAt(b, t){ const u=Math.max(0,(t-b.at)/b.hold); // not clamped at 1: the camera keeps going through the pause after the line
  if(b.cam==='board'){ const e=0.18*u+0.82*sm(u), s=BOARD.s0+(BOARD.s1-BOARD.s0)*e, c=[BOARD.c0[0]+(BOARD.c1[0]-BOARD.c0[0])*e, BOARD.c0[1]+(BOARD.c1[1]-BOARD.c0[1])*e];
    return { s, x0: BOARD.p0[0]-c[0]/s, y0: BOARD.p0[1]-c[1]/s }; }
  const c=b.cam; return { s:c.s, y0:c.y0, x0:c.x0[0]+(c.x0[1]-c.x0[0])*u }; }
const NZ=2.6, NCXF=375, NFEET=1400;
let AX=0, NCX=0;
function layout(){ const nb=DR.noodle_idle_right; AX=(nb.x0+nb.x1)/2; NCX=NCXF; return { AX, NCX }; }
// each pose on the same middle (its own box's middle on NCX), so the wider pet pose stays inside the safe zone too
const axOf=(k)=>(DR[k].x0+DR[k].x1)/2;
window.init=function(DRAW){ const m=initDrawings(DRAW); return { boxes:m, lay:layout() }; };
window.frame=function(t){
  let bg='', art_='', ov='';
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1;
  let i=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) i=j;
  const b=BEATS[i], lt=t-b.at, u=i===0?1:cl((lt+0.06)/0.3), cop=fade*(i===0?1:sm(u*3));
  const c=camAt(b, Math.max(t, b.at)), S=SCN[b.sc], R=S.R, P=S.PROPS;
  const box=(q)=>({l:(q[0]-c.x0)*c.s, t:(q[1]-c.y0)*c.s, r:(q[2]-c.x0)*c.s, b:(q[3]-c.y0)*c.s});
  const inFrame=(k)=>{ const q={l:Math.max(0,k.l),t:Math.max(0,k.t),r:Math.min(${W},k.r),b:Math.min(${H},k.b)}; return q.r>q.l&&q.b>q.t?q:null; };
  if(c.x0<R[0]-1e-6||c.y0<R[1]-1e-6||c.x0+${W}/c.s>R[2]+1e-6||c.y0+${H}/c.s>R[3]+1e-6) return 'the window runs off the rendered region of '+b.sc+': '+[c.x0,c.y0,c.s].map(f2);
  // the place
  bg='<g transform="scale('+c.s.toFixed(5)+') translate('+(-c.x0).toFixed(4)+' '+(-c.y0).toFixed(4)+')"><image href="'+BGS[b.sc]+'" x="'+R[0]+'" y="'+R[1]+'" width="'+(R[2]-R[0])+'" height="'+(R[3]-R[1])+'" preserveAspectRatio="none"/>'
    +(b.cam==='board'?'<g transform="'+NOTE.tf+'"><g transform="'+NOTE.rot+'"><rect data-note x="'+NOTE.x+'" y="'+NOTE.y+'" width="'+(Math.round(NOTE.w*fillAt(b,t)*10)/10)+'" height="'+NOTE.h+'" rx="1.8" fill="'+NOTE.fill+'"/></g></g>':'')+'</g>';
  if(fade>0){
    // Noodle, big, in front on the open ground, facing right
    if(b.pose){ const k='noodle_'+b.pose+'_right'; art_+=dogG('Noodle', k, kf(k,t,b.at), NCX, b.feet||NFEET, NZ, {ax:axOf(k), nt:t, op:fade}); }
    // the pet hearts of this beat: from Noodle's back, as the game floats them off the rub
    for(const hq of HEARTS){ if(hq.b!==b.k) continue; const hu=t-hq.t; if(hu<0||hu>=1) continue; art_+=heart(NCX+hq.dx*150, (b.feet||NFEET)-290, c.s, hu); }
    // the cards
    if(b.gift) ov+=giftCard(b, 276, cop, u);
    else ov+=card(b, 276, cop).svg;
  }
  // the end card (brand/kids/endcard.js)
  let ec=''; if(end){ ec='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+endCard('tall',HANDLES,LOGO_INNER)+'</g>'; }
  $('bg').innerHTML=bg; $('art').innerHTML=art_; $('ov').innerHTML=ov; $('ec').innerHTML=ec;
  if(end&&fade<=0) return '';
  // ---- the checks ----
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; ');
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ');
  for(const e of $('art').querySelectorAll('[data-feet]')){ if(+(e.getAttribute('opacity')||1)<=0.05) continue; const r=e.getBoundingClientRect(), fy=+e.getAttribute('data-feet');
    if(fy/c.s+c.y0<S.FLOOR) return e.getAttribute('data-apart')+' stands above the floor of '+b.sc;
    for(const [nm,bx] of Object.entries(P)){ if((S.BACK||[]).includes(nm)) continue; const k=inFrame(box(bx)); if(!k) continue; const g=gap(r,k); if(g<28) return e.getAttribute('data-apart')+' too close to the '+b.sc+'\\'s '+nm+' ('+Math.round(g)+' px)'; } }
  for(const e of $('art').querySelectorAll('[data-wash]')){ if(+(e.getAttribute('opacity')||1)<=0.05) continue; const r=e.getBoundingClientRect(); if(!r.width) continue;
    for(const [nm,bx] of Object.entries(P)){ if((S.BACK||[]).includes(nm)) continue; const k=inFrame(box(bx)); if(!k) continue; const g=gap(r,k); if(g<28) return 'a heart on the '+b.sc+'\\'s '+nm+' ('+Math.round(g)+' px)'; }
    for(const o of $('ov').querySelectorAll('[data-over]')){ const g=gap(r,(q=>({l:q.left,t:q.top,r:q.right,b:q.bottom}))(o.getBoundingClientRect())); if(g<28) return 'a heart on the card ('+Math.round(g)+' px)'; } }
  for(const e of $('ov').querySelectorAll('[data-over]')){ if(+(e.getAttribute('opacity')||1)<=0.05) continue; const r=e.getBoundingClientRect();
    for(const [nm,bx] of Object.entries(P)){ const k=inFrame(box(bx)); if(!k) continue; const g=gap(r,k); if(g<28) return 'the card on the '+b.sc+'\\'s '+nm+' ('+Math.round(g)+' px)'; } }
  for(const e of $('st').querySelectorAll('[data-apart],[data-box],[data-safe]')){ const r=e.getBoundingClientRect(); if(!r.width||+(e.getAttribute('opacity')||1)<=0.05||e.closest('#ec')) continue;
    if(r.right>854||r.left<56||r.top<266||r.bottom>1444) return 'outside x 60..850, y 270..1440: '+(e.getAttribute('data-apart')||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  // the board's beat: Gerald's paper (the key art) inside the safe zone, the whole board in the frame and inside it at the start
  if(b.cam==='board'){ const nb={l:(NOTE.cx-21-c.x0)*c.s, r:(NOTE.cx+21-c.x0)*c.s, t:(NOTE.cy-32-c.y0)*c.s, b:(NOTE.cy+32-c.y0)*c.s};
    if(nb.l<60||nb.r>850||nb.t<270||nb.b>1440) return 'Gerald\\'s paper outside the safe zone: '+[nb.l,nb.t,nb.r,nb.b].map(Math.round);
    if(lt<0.05){ const bb=box(BOARD.face); if(bb.l<56||bb.r>854) return 'the board is not in the safe zone at the start: '+[bb.l,bb.r].map(Math.round); } }
  return ''; };
function fillAt(b,t){ const u=Math.max(0,(t-b.at-0.35)/(b.hold-0.6)); return b.fill[0]+(b.fill[1]-b.fill[0])*(0.15*u+0.85*sm(u)); }
window.fillAt=fillAt;
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
  // the places: each region rendered once as a JPEG at its RES px a unit (the floor props kept; the player's food bowl, the game's own tap target, left out)
  const BGS = {};
  for (const [k, S] of Object.entries(SCN)) {
    const f = path.join(WORK, 'bg_' + k + '.jpg'), [x0, y0, x1, y1] = S.R, pw = Math.round((x1 - x0) * S.RES), ph = Math.round((y1 - y0) * S.RES);
    if (!fs.existsSync(f) || process.env.BG) {
      let svg = fs.readFileSync(path.join(CAPS, k + '.svg'), 'utf8');
      if (!/class="world/.test(svg)) throw new Error('no grab of ' + k);
      svg = svg.replace(/^<svg[^>]*>/, (m) => m.replace(/viewBox="[^"]*"/, `viewBox="${x0} ${y0} ${x1 - x0} ${y1 - y0}"`).replace(/ (width|height|style|preserveAspectRatio)="[^"]*"/g, '').replace('<svg', `<svg width="${pw}" height="${ph}" preserveAspectRatio="none"`));
      const bp = await b.newPage({ viewport: { width: pw, height: ph } });
      await bp.setContent(`<html><body style="margin:0"><style>[class$="-hl"]{display:none}</style>${svg}</body></html>`);
      await bp.evaluate(() => document.querySelectorAll('.gr-game').forEach((e) => e.remove())); await bp.waitForTimeout(400);
      await bp.screenshot({ path: f, type: 'jpeg', quality: 93 }); await bp.close();
    }
    BGS[k] = 'data:image/jpeg;base64,' + fs.readFileSync(f).toString('base64');
  }
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html.replace('__BGS__', JSON.stringify(BGS)));
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const ht = Object.values(handles()).join('') + 'doodledoggo.app', latin = allText.replace(/[^\x20-\x7e]/g, '');
  await p.evaluate(([txt, ht]) => Promise.all([document.fonts.load('700 40px Caveat', txt + ht), document.fonts.load('700 40px Andika', ht)]), [latin, ht]);
  if (!(await p.evaluate(([txt, ht]) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', ht), [latin, ht]))) throw new Error('Caveat or Andika did not load');
  await p.evaluate(() => document.fonts.ready); fs.unlinkSync(pageFile);
  const lay = await p.evaluate((D) => window.init(D), DRAW);
  console.log('Noodle', JSON.stringify(lay.lay), JSON.stringify(Object.fromEntries(Object.entries(lay.boxes).filter(([k]) => k.endsWith('_right')))));
  console.log('T =', T.toFixed(2), 's (', LOOP.toFixed(2), 's before the end card ),', NF, 'frames; beats at', BEATS.map((v) => v.k + ' ' + v.at.toFixed(2) + ' (' + v.hold.toFixed(2) + ')').join(', '));
  const render = async (t, file) => { const err = await p.evaluate((t) => window.frame(t), t); if (err) { if (process.env.LOOSE) console.log('CHECK', t.toFixed(2), err.slice(0, 300)); else throw new Error(err + ' at ' + t.toFixed(2)); } if (file) await p.screenshot({ path: file }); };
  // Noodle's size, standing (idle): 550..700 px wide (owner)
  { await render(1.0); const w = await p.evaluate(() => { const e = document.querySelector('[data-apart="Noodle"] use[href^="#fr_"]'); return e.getBoundingClientRect().width; }); console.log('Noodle standing', Math.round(w), 'px wide'); if (w < 550 || w > 700) throw new Error('Noodle is ' + Math.round(w) + ' px wide standing'); }
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, ...BEATS.flatMap((x) => [x.at + 0.5, x.at + x.hold * 0.9]).slice(1), LOOP + 0.15, (NF - 1) / FPS];
    for (const [j, t] of ts.entries()) await render(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    console.log(ts.length, 'stills'); await b.close(); return; }
  if (process.env.CHECK) { for (let fi = 0; fi < NF; fi++) await render(fi / FPS + 1e-4); console.log('all', NF, 'frames pass the checks'); await b.close(); return; }
  const t0 = Date.now();
  let fr = [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((f) => f >= a && f <= z); }
  // +1e-4: fi/FPS can land a hair under a beat start (the gift Reel's doubled frame); every frame's checks run in render()
  for (const fi of fr) { await render(fi / FPS + 1e-4, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); if (fi % 100 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await b.close();
  for (let fi = NF; fs.existsSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`)); fi++) fs.unlinkSync(path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));

  // ---- sound: the game's Town Square music, its squeak or boop with each heart and its pop on the treat bag, Noodle on top (kept when FRAMES is set) ----
  const mixWav = path.join(WORK, 'mix.wav'), ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
  if (!process.env.FRAMES || !fs.existsSync(mixWav)) {
    const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
    const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
    const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
      segments: [{ at: 0, ctx: { place: 'square', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: 0.05, name: 'discover' }]]);
    fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
    // the game's own SFX (00_core.js tone() and env()), on an OfflineAudioContext: squeak (70 %) or boop with each pet heart, pop on the treat bag
    const EV = HEARTS.map((h) => (h.sq ? ['squeak', h.t] : ['boop', h.t, h.f])); const G = BEATS.find((x) => x.gift); EV.push(['pop', G.at + 0.05]);
    const fxb = await ap.evaluate(async ([T, EV]) => { const sr = 44100, ctx = new OfflineAudioContext(1, Math.ceil(T * sr), sr), master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
      function tone(at, type, f0, f1, dur, vol, delay) { const t = at + (delay || 0), osc = ctx.createOscillator(), g = ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(f0, t);
        if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur); osc.connect(g); g.connect(master); env(g, t, 0.01, vol, dur); osc.start(t); osc.stop(t + dur + 0.05); }
      for (const [n, t, f] of EV) { if (n === 'pop') tone(t, 'sine', 600, 1300, 0.08, 0.5); else if (n === 'squeak') { tone(t, 'sine', 900, 1700, 0.09, 0.45); tone(t, 'sine', 1700, 1150, 0.08, 0.4, 0.09); } else tone(t, 'sine', f, f * 1.25, 0.12, 0.5); }
      const buf = await ctx.startRendering(), d = buf.getChannelData(0), out = new Int16Array(d.length); for (let i = 0; i < d.length; i++) out[i] = Math.max(-1, Math.min(1, d[i])) * 32767;
      const u8 = new Uint8Array(out.buffer); let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); }, [T, EV]);
    await ab.close();
    const fxRaw = path.join(WORK, 'fx.s16'), fx = path.join(WORK, 'fx.wav'); fs.writeFileSync(fxRaw, Buffer.from(fxb, 'base64'));
    ff(['-f', 's16le', '-ar', '44100', '-ac', '1', '-i', fxRaw, fx]);
    const voWav = path.join(WORK, 'voice.wav');
    ff([...VOAT.flatMap((v) => ['-i', path.join(VO, v.k + '.wav')]), '-filter_complex', VOAT.map((v, i) => { const d = Math.round(v.at * 1000); return `[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`; }).join(';') + ';'
      + VOAT.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${VOAT.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
    const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
    const vI = lufs(voWav), mI = lufs(path.join(WORK, 'music.wav'), `atrim=0:${T.toFixed(2)},`);
    const vG = -16 - vI, mG = -16 - 11 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
    const pre = path.join(WORK, 'premix.wav');
    ff(['-i', voWav, '-i', path.join(WORK, 'music.wav'), '-i', fx, '-filter_complex',
      `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${LOOP.toFixed(2)}:d=${(T - LOOP).toFixed(2)}[m];[2:a]volume=-14dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
      '-map', '[a]', '-ar', '44100', pre]);
    const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
    ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  }
  const mp4 = path.join(OUT, 'doodle-doggo-town-goal.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
  // ---- checkFrames on every run (../frozen_clock.js): no doubled frames; jumps only at the beat cuts ----
  // a cut: the frame the place changes and the next 5 (each card's 0.1 s fade-in and the treat bag's pop come with the cut)
  const cuts = new Set(BEATS.flatMap((x) => { const f = Math.ceil((x.at - 0.06) * FPS); return [f, f + 1, f + 2, f + 3, f + 4, f + 5]; }).concat([Math.ceil(LOOP * FPS), Math.ceil(LOOP * FPS) + 1]));
  const runs = BEATS.map((x, j) => [Math.max(0, Math.ceil((x.at - 0.06) * FPS) - 1), Math.ceil(((BEATS[j + 1] ? BEATS[j + 1].at : LOOP) - 0.06) * FPS) + 1, x.k]).concat([[Math.ceil(LOOP * FPS) - 1, NF - 1, 'end']]);
  const rep = { runs: [] };
  for (const [a, z, k] of runs) { const c = checkFrames(mp4, a, z); rep.runs.push({ k, a, z, median: c.median, doubled: c.doubled, jumps: c.jumps, jumpsOffCut: c.jumps.filter((f) => !cuts.has(f)) }); }
  fs.writeFileSync(path.join(WORK, 'checkframes.json'), JSON.stringify(rep, null, 1));
  for (const x of rep.runs) console.log('checkFrames', x.k, x.a + '-' + x.z, 'median', x.median, 'doubled', JSON.stringify(x.doubled), 'jumps', JSON.stringify(x.jumps), 'off a cut', JSON.stringify(x.jumpsOffCut));
})().catch((e) => { console.error(e); process.exit(1); });
