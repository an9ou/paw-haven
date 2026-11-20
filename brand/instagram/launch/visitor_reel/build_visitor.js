// The 20 Nov 2026 "Guess who's at the door" Reel (v2.26 Yard visitors; shot table, facts, hook scores and rebuild: docs/marketing/VISITOR_REEL.md).
// English cut only. Three rounds at Noodle's yard gate: a crayon silhouette of a neighbour's dog walks up to the gate with ONE clue on screen and in
// the voice (the hint the game's own Visitors Book prints under that dog's silhouette before you meet it), a 2 s guess with a ticking crayon timer,
// then a pop: the real dog in colour greets Noodle and its Visitors Book card shows its name, breed and family. Round 3 is the trickiest shape.
// Then "How many did you get? 👇" and our standard end card for 2.5 s.
// The visitors are real ones of main (window.__paw.yv.dogs, game/src/54_visitors.js, V226.md), drawn as the game draws them in the yard (the
// capture checks that byte for byte), none black or white: Sir Waddles the Corgi (Lady Pemberton), Rapunzel the Afghan Hound (Madame Dubois),
// Momiji the Shiba (Mr Kimura). Three clearly different shapes: big ears on short legs, a long-haired skirt, a huge spiral tail.
// The silhouette is built from the real art: the dog's own SVG (the frame of the moment) through an SVG filter that recolours every fill to a mid
// ink-blue with a crayon grain and draws a pencil line round the outside (the game's own Visitors Book silhouette, yvSil, does the same in graphite).
// The background is the game's Home Yard as main draws it (svg.world, autumn, sunny, day; capture_visitor.js yard.svg), the gate in the middle.
// Every moving drawing is the game's own animation read off the FROZEN page clock (capture_visitor.js draw.json: 30 frames a loop at exactly 1000/30 ms);
// a run plays loop frame (n - its first frame) mod 30. Noodle and the visitors breathe and sway gently all the time, so no frame is ever frozen.
// Every fact is checked against main (game/i18n/en.json, game/src/54_visitors.js, V226.md, world/pawart_world_b.js) and the captures: the build stops if
// one changed. Every frame: centreCheck(), safeCheck(), apartCheck() (../centre_text.js), the dogs on the yard's floor and 28 px clear of its props
// (GROUND below), the cards and the timer 28 px clear of the props and the washing on the line (HANG), words and key art inside x 60..850, y 270..1440.
// 1080 x 1920, 30 fps. Voice: Noodle, Kokoro af_bella 1.1x (vo_visitor.json via ../friends_reel/vo_friends.py). Music: the game's own yard music
// (mods/pawaudio.js) about 11 dB under the voice; the game's own pop (SFX.pop) on each reveal and its click (SFX.click) as the timer's ticks.
//
//   git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/visitor_reel/capture_visitor.js <main> <caps dir>
//   VO_LINES=brand/instagram/launch/visitor_reel/vo_visitor.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
//   ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/visitor_reel/build_visitor.js <workdir> <vo dir>
//   ONLY=stills: key frames (WORK/stills, TS=a,b,...). FRAMES=a-b: re-render only frames a..b, then encode again with the same sound.
//   CHECK=1: every frame's checks without screenshots. LOOSE=1 (stills only, for layout work): print a failed check and go on.
const path = require('path'), fs = require('fs'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { ENDCARD_JS, handles } = require('../../../kids/endcard.js');
const { checkFrames } = require('../frozen_clock.js');
const ROOT = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname;
const ART_ROOT = process.env.ART_ROOT ? path.resolve(process.env.ART_ROOT) : ROOT;
const WORK = path.resolve(process.argv[2] || 'visitor_work'), VO = path.resolve(process.argv[3] || path.join(WORK, 'vo'));
const CAPS = path.resolve(process.env.CAPS || path.join(WORK, 'caps'));
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, PEN = '#5B3D32', PAPER = '#FFF8EC', CREAM = '#FFFDF7', RED = '#D2473C';
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
const VOJSON = JSON.parse(fs.readFileSync(path.join(__dirname, 'vo_visitor.json'), 'utf8'));
for (const k of Object.keys(VOJSON)) if (VOJ.text[k] !== VOJSON[k]) throw new Error('the vo dir is not made from vo_visitor.json: ' + k);

// ---- the rounds: three real visitors of main, each with the hint its Visitors Book page shows under its silhouette ----
const ROUNDS = [
  { id: 'waddles', name: 'Sir Waddles', key: 'corgi', breed: 'Corgi', fam: 'Lady Pemberton', hintKey: 'yv.hint_bubbles', hint: 'Comes for the bubbles.', clue: ['Comes for the bubbles.'], title: 'Round 1: who is it?',
    src: "['waddles', 'Sir Waddles', 'corgi', 0, 48, 'Lady Pemberton', 'Bubble Fountain', { toy: 'Bubble Fountain' }]", v226: '| waddles | Sir Waddles | corgi | Lady Pemberton | Bubble Fountain | Bubble Fountain out |' },
  { id: 'rapunzel', name: 'Rapunzel', key: 'afghan', breed: 'Afghan Hound', fam: 'Madame Dubois', hintKey: 'yv.hint_pool', hint: 'Comes after a paddle at the Splash Pool.', clue: ['Comes after a paddle', 'at the Splash Pool.'], title: 'Round 2: who is it?',
    src: "['rapunzel', 'Rapunzel', 'afghan', 0, 60, 'Madame Dubois', 'Bubble Fountain', { pool: 1 }]", v226: '| rapunzel | Rapunzel | afghan | Madame Dubois | Bubble Fountain | after a paddle at the Splash Pool (`S.pool.day` not empty) |' },
  { id: 'momiji', name: 'Momiji', key: 'shiba', breed: 'Shiba', fam: 'Mr Kimura', hintKey: 'yv.hint_autumn', hint: 'Comes when the leaves turn.', clue: ['Comes when the leaves turn.'], title: 'Round 3: the sneaky one',
    src: "['momiji', 'Momiji', 'shiba', 0, 26, 'Mr Kimura', 'Play Tunnel', { season: 'autumn' }]", v226: '| momiji | Momiji | shiba | Mr Kimura | Play Tunnel | autumn (season) |' },
];
// ---- the facts, checked against main (the game's own words, data and art) and the captures ----
const EN = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'en.json'), 'utf8'));
const SRC = (f) => fs.readFileSync(path.join(ART_ROOT, 'game', 'src', f), 'utf8');
const must = (k, s) => { if (EN[k] !== s) throw new Error('the game text changed: ' + k + ' is ' + JSON.stringify(EN[k]) + ', not ' + JSON.stringify(s)); };
must('yv.book', 'Visitors Book'); must('yv.book_title', 'Visitors Book'); must('yv.family', 'Lives with {family}.'); must('yv.aria', '{name} is visiting from {family}');
must('yv.book_intro', 'Neighbourhood dogs come by while you are out. Put toys in the yard and see who visits.');
must('nw.v226.title', 'Visitors in the yard!'); must('yv.pet', 'Pet');
const YV = SRC('54_visitors.js'), V226 = fs.readFileSync(path.join(ART_ROOT, 'V226.md'), 'utf8');
if (!/if \(!m\) return `<div class="yv-page unk"><span class="yv-dog yv-sil">\$\{yvSil\(v\.id, dogSVG\(d, \{ pose: 'sit' \}\)\)\}<\/span><b>\?\?\?<\/b><span class="small">\$\{esc\(yvHint\(v\)\)\}<\/span><\/div>`/.test(YV))
  throw new Error('the Visitors Book no longer shows a silhouette, "???" and the hint for a dog not met yet');
for (const r of ROUNDS) {
  if (!YV.includes(r.src)) throw new Error('the visitor changed in 54_visitors.js: ' + r.id);
  if (!V226.includes(r.v226)) throw new Error('the visitor changed in V226.md: ' + r.id);
  must(r.hintKey, r.hint); must('data.yv_dogs.' + r.id + '.5', r.fam);
  if (EN['data.breed_names.' + r.key] !== undefined && EN['data.breed_names.' + r.key] !== r.breed) throw new Error('the breed name changed: ' + r.key);
}
if (!/if \(r\.season === 'autumn'\) return tt\('yv\.hint_autumn'/.test(YV) || !/if \(r\.pool\) return tt\('yv\.hint_pool'/.test(YV) || !/return tt\('yv\.hint_bubbles', 'Comes for the bubbles\.'\);\n\}/.test(YV)) throw new Error('yvHint changed');
if (!/const NEWS_V226 = \{[^\n]*\n\s*id: '2\.26', date: '2026-11-18'/.test(SRC('49c_news.js'))) throw new Error('the v2.26 launch date changed (the Reel says the visitors are in the game now)');
if (!/PA\.YARD_VISITORS=\{props:Object\.keys\(YV_LBL\),items:Object\.values\(YV_LBL\),book:\(\)=>serve\('yv:book',yvBook\)\}/.test(fs.readFileSync(path.join(ART_ROOT, 'world', 'pawart_world_b.js'), 'utf8'))) throw new Error('PawArt.YARD_VISITORS changed');
const CORE = SRC('00_core.js');
if (!CORE.includes("pop() { tone('sine', 600, 1300, 0.08, 0.5); }") || !CORE.includes("click() { tone('triangle', 700, 900, 0.06, 0.35); }")
  || !CORE.includes('function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }')) throw new Error('the game\'s pop or click sound changed');
// the captures (capture_visitor.js)
const FACTS = JSON.parse(fs.readFileSync(path.join(CAPS, 'facts.json'), 'utf8'));
if (FACTS.date !== '2026-11-20' || !FACTS.yvOn || FACTS.yard.name !== 'Home Yard' || FACTS.yard.vb !== '0 0 1000 600') throw new Error('the captures: ' + JSON.stringify([FACTS.date, FACTS.yvOn, FACTS.yard]));
for (const r of ROUNDS) {
  const f = FACTS.rounds[r.id], d = FACTS.dogs.find((x) => x.id === r.id);
  if (!f || !d || d.name !== r.name || d.key !== r.key || d.fam !== r.fam || !d.rare) throw new Error('the game data for ' + r.id + ': ' + JSON.stringify(d));
  if (!f.sameAsYard || f.tag !== r.name || f.cardTitle !== r.name + ' is visiting!' || !f.card.startsWith(r.name + ' · ' + r.breed + ' ★ Lives with ' + r.fam + '.')) throw new Error('the visit of ' + r.id + ': ' + JSON.stringify(f));
  if (!f.page.includes(r.hint) || !f.page.includes('Lives with ' + r.fam + '.')) throw new Error('the Visitors Book page of ' + r.id + ': ' + f.page);
  if (!FACTS.bookUnknown.some((u) => u.sil && u.txt === '??? ' + r.hint)) throw new Error('no silhouette page with "??? ' + r.hint + '"');
  // no black or white dog as a subject (owner, 1 Nov 2026): the coat's main colour is neither
  const c = f.coat.colours.base, rgb = [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255), L = 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  if (L < 0.15 || L > 0.85 || /^(black|white)/i.test(f.coat.name)) throw new Error(r.id + ' is a black or white dog: ' + f.coat.name + ' ' + c);
  r.coat = f.coat.name;
}
const DRAW = JSON.parse(fs.readFileSync(path.join(CAPS, 'draw.json'), 'utf8'));
for (const [k, d] of Object.entries(DRAW)) {
  if (d.vis.length !== 30 || d.step !== '1000/30 ms, frozen clock') throw new Error('the drawing ' + k + ' is not a 30-frame loop off the frozen clock');
  d.idx = d.vis.map((v) => { if (v.filter((x) => x === 1).length !== 1 || v.filter((x) => x === 0).length !== v.length - 1) throw new Error('the frame animation of ' + k + ' is not a step: ' + JSON.stringify(v)); return v.indexOf(1); });
}
const LOGO_INNER = fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<title>[^<]*<\/title>/g, '').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');
const BOOK = fs.readFileSync(path.join(CAPS, 'book.svg'), 'utf8');
if (!/viewBox="0 0 64 64"/.test(BOOK) || !/aria-label="Visitors Book"/.test(BOOK)) throw new Error('the Visitors Book art changed');

// ---- the yard: a 303.75 x 540-unit window of the game's Home Yard at 3.5556x (1920 / 540), the gate in the middle ----
// GROUND: the yard's own props in scene units (x0 y0 x1 y1), read off a unit grid of the grab: the dogs stand on the floor and 28 px clear of them.
// HANG: the washing line's pole and the washing on the line; the cards and the timer keep 28 px clear of it. The fence, the gate, the washing line (its pole and washing) and the far hills
// are the backdrop: a visitor at the gate stands in front of it, and walks in past the pole, as the game's own yard visitor stands in front of the fence.
const SX0 = 272, SY0 = 60, SCALE = H / 540, FLOOR = 340;
const GROUND = { dig: [470, 413, 569, 456], stone: [255, 408, 276, 428], house: [15, 100, 275, 345] };
const HANG = { pole: [572, 145, 605, 341], shirtBlue: [285, 226, 335, 275], sockRed: [361, 236, 383, 279], sockYellow: [392, 238, 415, 282], towel: [433, 241, 486, 280], shirtPink: [509, 224, 559, 275] };

// ---- the beats (each card carries the spoken words, so it works as the subtitles) ----
// the timeline (owner, 13 Nov 2026: fast): a card stays up for its spoken line + 0.4 s, then a 0.15 s pause; a clue card stays for its line, then
// the 2 s guess with the timer, and the reveal pops straight after
const GUESS = 2.0, PAUSE = 0.15;
const BEATS = []; let at = 0.1;
const beat = (o, hold, pause) => { o.at = at; o.hold = hold; BEATS.push(o); at += hold + pause; return o; };
beat({ k: 'hook', kind: 'hook', lines: ['3 shadows at the gate.', 'Bet you can\'t name all 3!'] }, VOD.hook + 0.4, PAUSE);
ROUNDS.forEach((r, i) => {
  const c = beat({ k: 'c' + (i + 1), kind: 'clue', ri: i, title: r.title, lines: r.clue }, VOD['c' + (i + 1)] + 0.05 + GUESS, 0);
  c.guessAt = c.at + VOD['c' + (i + 1)] + 0.05; r.clueAt = c.at; r.guessAt = c.guessAt;
  const v = beat({ k: 'r' + (i + 1), kind: 'reveal', ri: i }, VOD['r' + (i + 1)] + 0.4, PAUSE); r.revealAt = v.at;
});
const ASK = beat({ k: 'ask', kind: 'ask', lines: ['How many did', 'you get? 👇'] }, VOD.ask + 0.4, 0);
const LOOP = at + 0.1, T = LOOP + 2.5, NF = Math.round(T * FPS);
const VOAT = BEATS.map((b) => ({ k: b.k, at: b.at }));
const allText = BEATS.map((b) => [b.title || '', ...(b.lines || [])].join(' ')).join(' ') + ROUNDS.map((r) => r.name + ' ★ ' + r.breed + ' Lives with ' + r.fam + '.').join(' ') + ' 0123456789';
// house words (README): no em dash, no "breed" as a verb, no "sell", no itch.io; no made-up numbers
if (/—|\bbreed(s|ing)?\b|\bsell|itch|%/i.test(allText + JSON.stringify(VOJSON))) throw new Error('a word the house rules ban: ' + allText);
if (T < 22 || T > 32) throw new Error('the Reel is ' + T.toFixed(2) + ' s, not 22..32');

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#fff}svg{display:block}[class$="-hl"]{display:none}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs id="defs">
<symbol id="book" viewBox="0 0 64 64" overflow="visible">${BOOK.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '')}</symbol>
<filter id="sil" x="-12%" y="-12%" width="124%" height="124%" color-interpolation-filters="sRGB">
 <feFlood flood-color="#5A7397" result="base"/>
 <feTurbulence type="fractalNoise" baseFrequency="0.03 0.42" numOctaves="2" seed="11" result="n"/>
 <feColorMatrix in="n" type="matrix" values="0 0 0 0 0.56  0 0 0 0 0.65  0 0 0 0 0.79  0 0 0 -1.5 1.05" result="streak"/>
 <feComposite in="streak" in2="base" operator="over" result="col"/>
 <feComposite in="col" in2="SourceAlpha" operator="in" result="fill"/>
 <feMorphology in="SourceAlpha" operator="dilate" radius="2.4" result="d"/>
 <feComposite in="d" in2="SourceAlpha" operator="out" result="ring"/>
 <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="1" seed="3" result="n2"/>
 <feColorMatrix in="n2" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.4 1.85" result="nm"/>
 <feComposite in="ring" in2="nm" operator="in" result="rr"/>
 <feFlood flood-color="#34405A"/>
 <feComposite in2="rr" operator="in" result="line"/>
 <feMerge><feMergeNode in="fill"/><feMergeNode in="line"/></feMerge>
</filter></defs>
<image id="bgimg" width="${W}" height="${H}" href="__BG__"/><g id="art"></g><g id="ov"></g><g id="ec"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const NSV='http://www.w3.org/2000/svg', $=(i)=>document.getElementById(i), F='Caveat', CX=455;
const BEATS=${JSON.stringify(BEATS)}, ROUNDS=${JSON.stringify(ROUNDS)}, LOOP=${LOOP}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())};
const GROUND=${JSON.stringify(GROUND)}, HANG=${JSON.stringify(HANG)}, SX0=${SX0}, SY0=${SY0}, SCALE=${SCALE}, FLOOR=${FLOOR}, GUESS=${GUESS};
const IDX=${JSON.stringify(Object.fromEntries(Object.entries(DRAW).map(([k, d]) => [k, d.idx])))};
const f2=(x)=>(+x).toFixed(2), cl=(x)=>Math.max(0,Math.min(1,x)), sm=(x)=>{x=cl(x);return x*x*(3-2*x);};
const back=(x)=>{ x=cl(x); const c=1.7; return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2); };
const box=(b)=>({l:(b[0]-SX0)*SCALE, t:(b[1]-SY0)*SCALE, r:(b[2]-SX0)*SCALE, b:(b[3]-SY0)*SCALE});
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
    // the drawing's box (all three keyframes), in the art's 240 x 200 units
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9; for(let i=0;i<3;i++){ const u=document.createElementNS(NSV,'use'); u.setAttribute('href','#fr_'+k+'_'+i); $('art').appendChild(u); const b=u.getBBox(); u.remove(); x0=Math.min(x0,b.x); y0=Math.min(y0,b.y); x1=Math.max(x1,b.x+b.width); y1=Math.max(y1,b.y+b.height); }
    DR[k]={x0,y0,x1,y1}; }
  return Object.fromEntries(Object.entries(DR).map(([k,b])=>[k,[b.x0,b.y0,b.x1,b.y1].map(Math.round).join(',')])); }
// the keyframe a run shows at time t: the captured loop, frame (t - the run's start) x 30 mod 30
const kf=(k,t,s)=>IDX[k][((Math.floor((t-s)*30+1e-3)%30)+30)%30];
// a dog drawn from the game's drawings: layers [{k, i, sil, op}] (drawing k at keyframe i, sil: through the silhouette filter), the art's x = ax on
// x = cx, its feet (y 186) on y = feet, scale z; it breathes and sways a little all the time (the sway at half the breath's rate, pi/8 out of step,
// so no two frames are alike); pop: the reveal's bounce
function dogG(tag, layers, cx, feet, z, o){ o=o||{}; const tx=cx-o.ax*z, ty=feet-186*z, NT=o.nt||0;
  const br=1+0.02*Math.sin(NT*5.2), sw=1.6*Math.sin(NT*2.6+Math.PI/8), pop=o.pop||1;
  const lean='translate('+f2(cx)+' '+f2(feet)+') rotate('+f2(sw)+') scale('+f2((2-br)*pop)+' '+(br*pop).toFixed(4)+') translate('+f2(-cx)+' '+f2(-feet)+')';
  const at='translate('+f2(tx)+' '+f2(ty+(o.dy||0))+') scale('+z.toFixed(4)+')';
  const lay=(L)=> L.op<=0.001?'':'<g opacity="'+f2(L.op)+'"><g transform="'+at+'"><use href="#sh_'+L.k+'"/><use href="#fr_'+L.k+'_'+L.i+'"'+(L.sil?' filter="url(#sil)"':'')+'/></g></g>';
  return '<g data-apart="'+tag+'" data-feet="'+f2(feet)+'"'+(o.entering?' data-entering="1"':'')+' opacity="'+f2(o.op==null?1:o.op)+'"><g transform="'+lean+'">'+layers.map(lay).join('')+'</g></g>'; }
function fitS(s,max,w){ let z=max; while(z>20){ const k=inkOf(s,z,F); if(k.L+k.R<=w) return z; z-=2; } return z; }
// a card: optional red title, lines; the text block centred in the card
function card(b, top, op){ const W0=790, x0=CX-W0/2, L=[], big=b.kind==='hook'||b.kind==='ask';
  if(b.title) L.push({s:b.title, size:fitS(b.title,74,W0-90), fill:'${RED}', pitch:76});
  (b.lines||[]).forEach((s)=>L.push({s, size:fitS(s, big?96:64, W0-90), pitch: big?100:66}));
  const hh=L.reduce((a,l,i)=>a+(i<L.length-1?l.pitch:l.size*0.75),0)+(big?88:70);
  return { h: hh, svg: '<g data-box data-apart="card" data-over="1" opacity="'+f2(op)+'"><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+f2(hh)+'" rx="38" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'+centred(L, CX, top+hh/2, F).svg+'</g>' }; }
// the Visitors Book card: the game's book art, then the page (name and star, breed, family) in its own box
function bookCard(r, top, op, u){ const W0=790, x0=CX-W0/2, h=252, bx=x0+214, bw=W0-214-22, k=0.94+0.06*back(u*1.3);
  const L=[{s:r.name+' ★', size:fitS(r.name+' ★',80,bw-60), fill:'${RED}', pitch:72},{s:r.breed, size:56, pitch:60},{s:'Lives with '+r.fam+'.', size:fitS('Lives with '+r.fam+'.',50,bw-50), fill:'#8A7468', pitch:56}];
  const cx=x0+W0/2, cy=top+h/2;
  return '<g data-apart="card" data-over="1" data-safe opacity="'+f2(op)+'" transform="translate('+f2(cx)+' '+f2(cy)+') scale('+f2(k)+') translate('+f2(-cx)+' '+f2(-cy)+')"><rect x="'+x0+'" y="'+top+'" width="'+W0+'" height="'+h+'" rx="38" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'
    +'<use href="#book" x="'+(x0+24)+'" y="'+(top+(h-176)/2)+'" width="176" height="176"/>'
    +'<g data-box><rect x="'+bx+'" y="'+(top+20)+'" width="'+bw+'" height="'+(h-40)+'" rx="22" fill="#FFF3DA" stroke="#E2C9A0" stroke-width="3"/>'+centred(L, bx+bw/2, top+h/2, F).svg+'</g></g>'; }
// the ticking crayon timer: a cream clock face, a red crayon wedge running out, the seconds left in the middle
function timer(cx, cy, R, p, n, op){ const a=-Math.PI/2, e=a+2*Math.PI*cl(p), r=R-16, big=(e-a)>Math.PI?1:0;
  const wedge=p>0.999?'<circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="#F7A99B" stroke="${PEN}" stroke-width="3"/>'
    : p>0.003?'<path d="M'+cx+' '+cy+'L'+f2(cx+r*Math.cos(a))+' '+f2(cy+r*Math.sin(a))+'A'+r+' '+r+' 0 '+big+' 1 '+f2(cx+r*Math.cos(e))+' '+f2(cy+r*Math.sin(e))+'Z" fill="#F7A99B" stroke="${PEN}" stroke-width="3" stroke-linejoin="round"/>':'';
  let ticks=''; for(let j=0;j<12;j++){ const q=j/12*2*Math.PI; ticks+='<path d="M'+f2(cx+(R-3)*Math.cos(q))+' '+f2(cy+(R-3)*Math.sin(q))+'L'+f2(cx+(R-13)*Math.cos(q))+' '+f2(cy+(R-13)*Math.sin(q))+'" stroke="${PEN}" stroke-width="3" stroke-linecap="round"/>'; }
  return '<g data-box data-apart="timer" data-over="1" opacity="'+f2(op)+'"><circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="${CREAM}" stroke="${PEN}" stroke-width="7"/>'+wedge+ticks+centred([{s:String(n),size:108,fill:'${RED}'}],cx,cy,F).svg+'</g>'; }
// the reveal's pop: short crayon strokes bursting out above the visitor
function burst(cx, cy, R, u){ if(u<=0||u>=1) return ''; let s=''; const o=sm(1-u)*1.0, d=R+60*sm(u*1.4);
  for(let j=0;j<9;j++){ const q=Math.PI*(1.08+j*0.105); s+='<path d="M'+f2(cx+d*Math.cos(q))+' '+f2(cy+d*Math.sin(q))+'l'+f2(26*Math.cos(q))+' '+f2(26*Math.sin(q))+'" stroke="'+(j%2?'#F2B33D':'#E8735A')+'" stroke-width="9" stroke-linecap="round"/>'; }
  return '<g opacity="'+f2(o)+'">'+s+'</g>'; }
// ---- the layout ----
const CARD_TOP=284, NFEET=1414, NZ=2.6, NX=74, VFEET=1040, VCX=640, TX=232, TY=958, TR=104;
let VZ={}, AX={}, NCX=0;
function layout(){ // the anchors: Noodle's idle box starts at x NX; each visitor scaled to fit 384 x 345 and centred on VCX at rest
  const nb=DR.noodle_idle_right; AX.noodle=(nb.x0+nb.x1)/2; NCX=NX+(nb.x1-nb.x0)*NZ/2;
  for(const r of ROUNDS){ let x0=1e9,y0=1e9,x1=-1e9; for(const p of ['walk','idle','happy']){ const b=DR[r.id+'_'+p+'_left']; x0=Math.min(x0,b.x0); y0=Math.min(y0,b.y0); x1=Math.max(x1,b.x1); }
    VZ[r.id]=Math.min(2.4, 384/(x1-x0), 345/(186-y0)); AX[r.id]=(x0+x1)/2; } }
// Noodle's pose at t: idle for the hook, sitting through each clue and guess, happy (with a hop) from each reveal on
function noodleAt(t){ let s=0, pose='idle'; for(const r of ROUNDS){ if(t>=r.clueAt-0.06){ s=r.clueAt; pose='sit'; } if(t>=r.revealAt-0.06){ s=r.revealAt; pose='happy'; } } return {pose, s}; }
// the visitor of round i at t: walking in, waiting at the gate as a silhouette, revealed; the last one fades as the next walks in
function visitorG(t, i, fade){ const r=ROUNDS[i], z=VZ[r.id], ax=AX[r.id], walk0=i===0?0:r.clueAt+0.12, x0=i===0?880:1035, wd=i===0?1.15:1.3;
  if(t<walk0-0.001) return ''; const next=ROUNDS[i+1]; let op=fade; if(next&&t>=next.clueAt-0.06){ op*=1-sm((t-next.clueAt+0.06)/0.15); if(op<=0.001) return ''; }
  const w=cl((t-walk0)/wd), cx=x0+(VCX-x0)*(1-Math.pow(1-w,2.2)), walking=w<1, rev=t>=r.revealAt-0.06, ru=rev?(t-r.revealAt+0.06):0;
  const k=walking?r.id+'_walk_left':r.id+'_idle_left', s0=walking?walk0:walk0+wd, base={ax, nt:t*1.07+i*0.9, op, entering: cx>VCX+2};
  if(!rev) return dogG(r.id, [{k, i:kf(k,t,s0), sil:1, op:1}], cx, VFEET, z, base);
  // the pop: the silhouette (its idle drawing) gives way to the dog in colour (happy), with a bounce and a burst of crayon strokes
  const kh=r.id+'_happy_left', fd=sm(ru/0.18), pop=1+0.07*Math.sin(Math.PI*cl(ru/0.34));
  return dogG(r.id, [{k, i:kf(k,t,s0), sil:1, op:1-fd}, {k:kh, i:kf(kh,t,r.revealAt-0.06), sil:0, op:fd}], VCX, VFEET, z, Object.assign(base,{pop}))
    + burst(VCX, VFEET-150, 120, ru/0.45); }
window.init=function(DRAW){ const m=initDrawings(DRAW); layout(); return {boxes:m, VZ, AX}; };
window.frame=function(t){
  let art_='', ov='';
  const end=t>=LOOP, fade=end?1-sm((t-LOOP)/0.22):1;
  let i=0; for(let j=0;j<BEATS.length;j++) if(t>=BEATS[j].at-0.06) i=j;
  const b=BEATS[i], lt=t-b.at, u=i===0?1:cl((lt+0.06)/0.3), cop=fade*(i===0?1:sm(u*3));
  if(fade>0){
    // the visitors: the round of the moment (and the last one fading out as the next walks in)
    for(let j=0;j<ROUNDS.length;j++) art_+=visitorG(t,j,fade);
    // Noodle, big, in front on the open grass, facing the gate
    const n=noodleAt(t), k='noodle_'+n.pose+'_right', hop=n.pose==='happy'?-Math.abs(Math.sin((t-n.s)*7))*14:0;
    art_+=dogG('Noodle', [{k, i:kf(k,t,n.s), sil:0, op:1}], NCX, NFEET, NZ, {ax:AX.noodle, nt:t, dy:hop, op:fade});
    // the cards
    if(b.kind==='reveal'){ ov+=bookCard(ROUNDS[b.ri], CARD_TOP, cop, u); }
    else { const c=card(b, CARD_TOP, cop); ov+=c.svg; }
    if(b.kind==='clue'){ const g=t-b.guessAt; if(g>=-0.12&&g<GUESS){ const p=1-cl(g/GUESS), nleft=Math.max(1,Math.ceil(GUESS-Math.max(0,g)-1e-6)); ov+=timer(TX,TY,TR,p,nleft,fade*sm((g+0.12)/0.12)); } }
  }
  // the end card (brand/kids/endcard.js)
  let ec=''; if(end){ ec='<g opacity="'+f2(sm((t-LOOP-0.12)/0.3))+'"><rect width="${W}" height="${H}" fill="${PAPER}"/>'+endCard('tall',HANDLES,LOGO_INNER)+'</g>'; }
  $('art').innerHTML=art_; $('ov').innerHTML=ov; $('ec').innerHTML=ec;
  // ---- the checks ----
  const bad=centreCheck($('st')); if(bad.length) return 'not centred: '+bad.join('; ');
  const outS=safeCheck($('st')); if(outS.length) return 'outside SAFE: '+outS.join('; ');
  const near=apartCheck($('st'),28); if(near.length) return 'too close: '+near.join('; ')+' | '+[...$('st').querySelectorAll('[data-apart]')].map((e)=>{ const r=e.getBoundingClientRect(); return e.getAttribute('data-apart')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }).join('; ');
  if(fade>0) for(const e of $('art').querySelectorAll('[data-feet]')){ if(+(e.getAttribute('opacity')||1)<=0.05) continue; const r=e.getBoundingClientRect(), fy=+e.getAttribute('data-feet');
    if(fy/SCALE+SY0<FLOOR) return e.getAttribute('data-apart')+' stands above the floor';
    for(const [nm,bx] of Object.entries(GROUND)){ const g=gap(r,box(bx)); if(g<28) return e.getAttribute('data-apart')+' too close to the yard\\'s '+nm+' ('+Math.round(g)+' px)'; }
    if(e.getAttribute('data-apart')==='Noodle') for(const [nm,bx] of Object.entries(HANG)){ const g=gap(r,box(bx)); if(g<28) return 'Noodle on the '+nm; } }
  for(const e of $('ov').querySelectorAll('[data-over]')){ if(+(e.getAttribute('opacity')||1)<=0.05) continue; const r=e.getBoundingClientRect();
    for(const [nm,bx] of Object.entries(Object.assign({},GROUND,HANG))){ const g=gap(r,box(bx)); if(g<28) return e.getAttribute('data-apart')+' on the yard\\'s '+nm+' ('+Math.round(g)+' px)'; } }
  for(const e of $('st').querySelectorAll('[data-apart],[data-box],[data-safe]')){ const r=e.getBoundingClientRect(); if(!r.width||+(e.getAttribute('opacity')||1)<=0.05||e.closest('#ec')) continue;
    // a visitor walking in from the right may run past x 850 (above the buttons, which start at y 1163) until it reaches the gate
    if(e.hasAttribute('data-entering')&&r.left>=56&&r.top>=266&&r.bottom<=1150) continue;
    if(r.right>854||r.left<56||r.top<266||r.bottom>1444) return 'outside x 60..850, y 270..1440: '+(e.getAttribute('data-apart')||'box')+' '+[r.left,r.top,r.right,r.bottom].map(Math.round); }
  // Noodle 550..700 px wide standing (idle), the visitors never black: the silhouette is a filter on the real drawing
  return ''; };
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1243/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  // the yard: the window rendered once as a JPEG
  const bgf = path.join(WORK, 'bg_yard.jpg'); let svg = fs.readFileSync(path.join(CAPS, 'yard.svg'), 'utf8');
  if (!/class="world/.test(svg)) throw new Error('no yard grab');
  svg = svg.replace(/^<svg[^>]*>/, (m) => m.replace(/viewBox="[^"]*"/, `viewBox="${SX0} ${SY0} ${W / SCALE} ${H / SCALE}"`).replace(/ (width|height|style|preserveAspectRatio)="[^"]*"/g, '').replace('<svg', `<svg width="${W}" height="${H}"`));
  if (SX0 + W / SCALE > 1000 || SY0 + H / SCALE > 600.01) throw new Error('the window runs off the yard');
  await p.setContent(`<html><body style="margin:0"><style>[class$="-hl"]{display:none}</style>${svg}</body></html>`);
  await p.evaluate(() => document.querySelectorAll('.gr-game').forEach((e) => e.remove())); await p.waitForTimeout(300);
  await p.screenshot({ path: bgf, type: 'jpeg', quality: 93 });
  const pageFile = path.join(WORK, `page_${process.pid}.html`); fs.writeFileSync(pageFile, html.replace('__BG__', 'data:image/jpeg;base64,' + fs.readFileSync(bgf).toString('base64')));
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  const ht = Object.values(handles()).join('') + 'doodledoggo.app', latin = allText.replace(/[^\x20-\x7e]/g, '');
  await p.evaluate(([txt, ht]) => Promise.all([document.fonts.load('700 40px Caveat', txt + ht), document.fonts.load('700 40px Andika', ht)]), [latin, ht]);
  if (!(await p.evaluate(([txt, ht]) => document.fonts.check('700 40px Caveat', txt) && document.fonts.check('700 40px Andika', ht), [latin, ht]))) throw new Error('Caveat or Andika did not load');
  await p.evaluate(() => document.fonts.ready); fs.unlinkSync(pageFile);
  const lay = await p.evaluate((D) => window.init(D), DRAW);
  console.log('scales', JSON.stringify(lay.VZ), '| Noodle idle', ((DRAW && lay.boxes.noodle_idle_right) || ''));
  console.log('T =', T.toFixed(2), 's (', LOOP.toFixed(2), 's before the end card ),', NF, 'frames; beats at', BEATS.map((v) => v.k + ' ' + v.at.toFixed(2) + ' (' + v.hold.toFixed(2) + ')').join(', '));
  const render = async (t, file) => { const err = await p.evaluate((t) => window.frame(t), t); if (err) { if (process.env.LOOSE) console.log('CHECK', t.toFixed(2), err.slice(0, 300)); else throw new Error(err + ' at ' + t.toFixed(2)); } if (file) await p.screenshot({ path: file }); };
  // Noodle's size, standing (idle): 550..700 px wide (owner)
  { await render(1.0); const w = await p.evaluate(() => { const e = document.querySelector('[data-apart="Noodle"] use[href^="#fr_"]'); return e.getBoundingClientRect().width; }); console.log('Noodle standing', Math.round(w), 'px wide'); if (w < 550 || w > 700) throw new Error('Noodle is ' + Math.round(w) + ' px wide standing'); }
  if (process.env.ONLY === 'stills') {
    const ts = process.env.TS ? process.env.TS.split(',').map(Number) : [0, ...BEATS.flatMap((x) => [x.at + 0.5, x.at + x.hold * 0.9]).slice(1), ...ROUNDS.map((r) => r.guessAt + 1), LOOP + 0.15, (NF - 1) / FPS];
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

  // ---- sound: the game's yard music, its pop on each reveal and its click as the timer's ticks, Noodle on top (kept when FRAMES is set) ----
  const mixWav = path.join(WORK, 'mix.wav'), ff = (args) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...args]);
  if (!process.env.FRAMES || !fs.existsSync(mixWav)) {
    const ab = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
    const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
    const wav = await ap.evaluate(async ([s, st]) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
      segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: st })).wav, [T + 0.5, [{ at: 0.05, name: 'discover' }]]);
    fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
    // the game's own SFX (00_core.js): tone() and env() as the game plays them, on an OfflineAudioContext; pop on the reveals, click on the ticks
    const EV = []; for (const r of ROUNDS) { EV.push(['pop', r.revealAt]); for (let q = 0; q < 4; q++) EV.push(['click', r.guessAt + q * 0.5]); }
    const fxb = await ap.evaluate(async ([T, EV]) => { const sr = 44100, ctx = new OfflineAudioContext(1, Math.ceil(T * sr), sr), master = ctx.createGain(); master.gain.value = 1; master.connect(ctx.destination);
      function env(g, t, a, peak, dur) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); }
      function tone(at, type, f0, f1, dur, vol) { const t = at, osc = ctx.createOscillator(), g = ctx.createGain(); osc.type = type; osc.frequency.setValueAtTime(f0, t);
        if (f1 && f1 !== f0) osc.frequency.exponentialRampToValueAtTime(f1, t + dur); osc.connect(g); g.connect(master); env(g, t, 0.01, vol, dur); osc.start(t); osc.stop(t + dur + 0.05); }
      for (const [n, t] of EV) { if (n === 'pop') tone(t, 'sine', 600, 1300, 0.08, 0.5); else tone(t, 'triangle', 700, 900, 0.06, 0.35); }
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
      `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},afade=t=in:d=0.05,volume=${mG.toFixed(2)}dB,afade=t=out:st=${LOOP.toFixed(2)}:d=${(T - LOOP).toFixed(2)}[m];[2:a]volume=-10dB,aformat=channel_layouts=stereo[k];[m][k][v]amix=inputs=3:duration=first:normalize=0,alimiter=limit=0.5:level=false[a]`,
      '-map', '[a]', '-ar', '44100', pre]);
    const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
    ff(['-i', pre, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  }
  const mp4 = path.join(OUT, 'doodle-doggo-guess-the-visitor.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
  // ---- checkFrames on every run (../frozen_clock.js): no doubled frames; jumps only at the beat cuts ----
  const cuts = new Set(BEATS.flatMap((x) => { const f = Math.ceil((x.at - 0.06) * FPS); return [f, f + 1]; }).concat([Math.ceil(LOOP * FPS), Math.ceil(LOOP * FPS) + 1]));
  const runs = BEATS.map((x, j) => [Math.max(0, Math.ceil((x.at - 0.06) * FPS) - 1), Math.ceil(((BEATS[j + 1] ? BEATS[j + 1].at : LOOP) - 0.06) * FPS) + 1, x.k]).concat([[Math.ceil(LOOP * FPS) - 1, NF - 1, 'end']]);
  const rep = { runs: [] };
  for (const [a, z, k] of runs) { const c = checkFrames(mp4, a, z); rep.runs.push({ k, a, z, median: c.median, doubled: c.doubled, jumps: c.jumps, jumpsOffCut: c.jumps.filter((f) => !cuts.has(f)) }); }
  fs.writeFileSync(path.join(WORK, 'checkframes.json'), JSON.stringify(rep, null, 1));
  for (const x of rep.runs) console.log('checkFrames', x.k, x.a + '-' + x.z, 'median', x.median, 'doubled', JSON.stringify(x.doubled), 'jumps', JSON.stringify(x.jumps), 'off a cut', JSON.stringify(x.jumpsOffCut));
})().catch((e) => { console.error(e); process.exit(1); });
