// "Peak momiji week" loop Reel (owner approved 21 Nov 2026; docs/marketing/MOMIJI_REEL.md). English cut only, 1080 x 1920, 30 fps, 15.0 s, a SEAMLESS LOOP
// with no end card (owner, 16 Nov 2026: loop Reels have no end card; the website goes in the caption).
// Noodle (PawArt.dog 'dachs', lying down, the game's 'dreamy' face) naps under one of the two big momiji trees of Ueno Park, Tokyo (the game's own
// Ueno scene, autumn, golden hour (time 'dusk'), sunny, the Japan scenery on), drawn at 4.6x so the red maple fills the top of the frame and its
// trunk runs down to the sand. The game's own falling momiji (Ueno's "Momiji walk", 39_tokyo.js tkPetals: the leaf drawing and its tkPetal fall,
// ease-in, a sideways drift and a fade) drift down all the time, slowed to 2x and given a gentle rock for calm. Noodle breathes, and looks up with
// the game's 'curious' face when one leaf drifts past his nose (8.17 to 10.17 s, swapped on a frame flip of the art's own 3-drawing wobble).
// One small soft line at the start: it fades in over the first second, stays about 3 s and fades out, so the loop has no seam.
// ALL moving footage is stepped on the FROZEN PAGE CLOCK (../frozen_clock.js): the page animates itself with requestAnimationFrame and
// performance.now() (the leaves, the breathing, the line, the face) and the dog art's CSS wobble runs as a CSS animation; freezeClock(), then
// stepClock() to exactly t0 + (n + 0.0001) x 1000/30 ms before each screenshot (the 0.0001 frame-index nudge), then releaseClock().
// Every frame: centreCheck(), safeCheck() and apartCheck() (../centre_text.js): the line centred in its card and inside x 60..850 / y 270..1440,
// Noodle inside it too and 28 px clear of the hanami deck and the maple's trunk, and no leaf over the line's card while it shows.
// Sound: the game's own music engine (mods/pawaudio.js) with the context the game sends at Ueno at golden hour (captured), rendered 2.2 s longer and
// crossfaded end into start (as costume_reel_xmas/build_xmas.js), -16 LUFS. No stings, no voice.
//
//   1) captures: NODE_PATH=$(npm root -g) node brand/instagram/launch/momiji_reel/capture_momiji.js <main checkout> <caps>
//   2) ART_ROOT=<main checkout> CAPS=<caps> NODE_PATH=$(npm root -g) node brand/instagram/launch/momiji_reel/build_momiji.js <workdir>
//   ONLY=stills: key frames (WORK/stills; TS=a,b,... frame numbers). FRAMES=a-b: re-render only frames a..b, then encode again with the same music.
// REDNOTE=1 (owner, 23 Nov 2026: "Create rednote version"): the RedNote cut, the same loop with the line in Simplified Chinese (LXGW WenKai), the
//   place named as the game names it in zh-Hans (上野公园, checked against game/i18n/zh-Hans.json on main), the full frame with a 50 px margin
//   instead of the safe zone (the centring, prop-clearance and leaf checks stay), no QR, link, domain, @, handles or platform names (the build
//   refuses RedNote's off-platform words). The same music (WORK's music.wav from the English build is used as is) and the same loop.
//   Output doodle-doggo-momiji-loop-rednote.mp4.
//   CHECK=1 runs every frame's checks without rendering. ENCODE=1 encodes WORK/f again (same music). DEBUG=1 outlines the boxes.
// Output next to this file: doodle-doggo-momiji-loop.mp4.
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { RN_FONT_CSS } = require('../../../kids/endcard.js');
const RN = !!process.env.REDNOTE;
const { freezeClock, stepClock, releaseClock, checkFrames } = require('../frozen_clock.js');
const OUT = __dirname;
const ART_ROOT = path.resolve(process.env.ART_ROOT || path.join(__dirname, '..', '..', '..', '..'));
const CAPS = path.resolve(process.env.CAPS || 'momiji_caps');
const WORK = path.resolve(process.argv[2] || 'momiji_work');
for (const d of ['f', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const FPS = 30, W = 1080, H = 1920, L = 15, NF = L * FPS, PEN = '#5B3D32', CREAM = '#FFFDF7', MUTED = '#8A7468';
const rj = (f) => JSON.parse(fs.readFileSync(path.join(CAPS, f), 'utf8'));
const facts = rj('facts.json'), props = rj('props.json'), leafCap = rj('leaf.json'), draw = rj('draw.json');
const SCENE = fs.readFileSync(path.join(CAPS, 'ueno.svg'), 'utf8');

// ---- what the captures must be ----
if (facts.date !== '2026-11-21') throw new Error('the captures are not from 21 Nov 2026: ' + facts.date);
const sd = facts.scene.data;
if (sd.season !== 'autumn' || sd.time !== 'dusk' || sd.weather !== 'sunny' || sd.jp !== '1' || facts.scene.name !== 'Ueno Park') throw new Error('not Ueno Park in autumn at golden hour: ' + JSON.stringify(facts.scene));
if (!/class="pa-we-sakura" data-bloom="autumn"/.test(SCENE)) throw new Error('the Ueno maples are not in their autumn red');
if (leafCap.anim.name !== 'tkPetal' || leafCap.anim.duration !== '3.4s' || leafCap.anim.timing !== 'ease-in' || !/translate\(var\(--dx,\s*0\),\s*340px\)/.test(leafCap.keyframes)) throw new Error('the game\'s momiji fall changed: ' + JSON.stringify(leafCap.anim) + leafCap.keyframes);
const LEAF = (() => { const m = /d="([^"]+)" fill="(#[0-9A-Fa-f]{6})" stroke="(#[0-9A-Fa-f]{6})" stroke-width="([\d.]+)"/.exec(leafCap.html[0]); if (!m) throw new Error('no leaf path'); return { d: m[1], fill: m[2], stroke: m[3], sw: +m[4] }; })();
if (!leafCap.html.every((h) => h.includes(LEAF.d) && h.includes(LEAF.fill))) throw new Error('the game drops more than one leaf drawing');
for (const k of ['dreamy', 'curious']) { const d = draw[k]; if (!d || JSON.stringify(d.vis.map((v) => v.indexOf(1))) !== JSON.stringify([...Array(30)].map((_, i) => Math.floor(i / 10)))) throw new Error('the ' + k + ' wobble is not 3 drawings x 10 frames: ' + (d && d.vis.map((v) => v.indexOf(1)).join(''))); }
if (!facts.music || facts.music.place !== 'ueno' || facts.music.time !== 'dusk') throw new Error('no Ueno golden-hour music context');

// ---- the stage: Ueno Park (1000 x 600 scene units), zoomed: screen = (scene - (X0, Y0)) x S ----
const S = 4.6, X0 = 765, Y0 = 600 - H / S; // the right-hand maple; the window ends at x 999.8 and at the scene's foot
if (X0 + W / S > 1000) throw new Error('the window runs off the scene');
const px = (b) => [(b[0] - X0) * S, (b[1] - Y0) * S, (b[2] - X0) * S, (b[3] - Y0) * S];
// the things Noodle keeps 28 px clear of (scene units, from props.json): the hanami deck (its tap box, its foot and its side rope) and the maple's trunk
const part = (i) => { const p = props.parts.find((q) => q.i === i); if (!p) throw new Error('scene part ' + i + ' is gone'); return p; };
const DECK = (() => { const h = props.hots.hanami.drawn, a = part(315), r = part(311); if (a.fill !== '#734F48' || r.box[2] > 870) throw new Error('the deck parts moved');
  return [Math.min(h[0], a.box[0]), h[1], Math.max(h[2], a.box[2], r.box[2]), Math.max(h[3], a.box[3], r.box[3])]; })();
const TRUNK = (() => { const t = part(379); if (t.fill !== '#734F48' || Math.abs(t.box[0] - 930) > 3) throw new Error('the trunk moved: ' + JSON.stringify(t)); return t.box; })();
const PROPS = { deck: px(DECK), trunk: px(TRUNK) };
console.log('deck', PROPS.deck.map(Math.round), 'trunk', PROPS.trunk.map(Math.round));

// ---- Noodle: lying down facing right, the art's 240 x 200 box at K px a unit, its left edge at DX, the shadow's foot (y 193) on FOOT ----
const K = 2.8, DX = 70, FOOT = 1430;
const DOGX = DX, DOGY = FOOT - 193 * K;
// ---- the line: one small soft card at the top of the safe zone ----
// RedNote: 红叶季 (RedNote's word for the season), true to the length, and the game's own zh-Hans name of the place, smaller under it
const ZH_PLACE = (() => { const z = JSON.parse(fs.readFileSync(path.join(ART_ROOT, 'game', 'i18n', 'zh-Hans.json'), 'utf8')); const n = z['data.tk_places.ueno.n'];
  if (n !== '上野公园' || z['tokyo.pin_ueno'] !== n) throw new Error('the game\'s zh-Hans name of Ueno Park changed: ' + n); return n; })();
const LINE = RN ? ['东京红叶季，给你15秒', ZH_PLACE] : ['Your 15 seconds of Tokyo autumn,', 'no rush'];
const HOOK = LINE.join(' ');
if (/itch|—|–/.test(HOOK)) throw new Error('no itch.io and no dashes on screen');
if (RN) { if (LINE.some((l) => [...l].length > 14)) throw new Error('a RedNote line over 14 characters');
  if (!/红叶/.test(HOOK)) throw new Error('the RedNote line needs 红叶 or 红叶季');
  if (/[A-Za-z@]|\.(app|com|io)|链接|网址|官网|二维码|扫码|下载|私信我|加我|主页链接|戳|发帖|快拍|帖子|微信|朋友圈|QQ|微博|抖音|小红书|Instagram|YouTube|TikTok/i.test(HOOK)) throw new Error('a RedNote no-go word on screen: ' + HOOK); }
const F_ = RN ? "'LXGW WenKai'" : 'Caveat', SIZES = RN ? [64, 44] : [58, 54], PITCH = RN ? 74 : 62;
const CARD = RN ? { cx: 540, cy: 372, w: 760, h: 170 } : { cx: 455, cy: 372, w: 690, h: 150 };
const LINE_ON = (t) => { const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }; return t < 1 ? sm(t) : t < 3.4 ? 1 : 1 - sm((t - 3.4) / 0.8); }; // in over the first second, out by 4.2 s
// ---- the face: 'curious' while the watched leaf drifts past his nose, on whole frame-flips of the wobble (every 10 frames) ----
// The art's wobble is set 5 frames into its 1 s cycle at frame 0 (PH), so its flips land on frames 5, 15, 25 ... and the loop point (449 -> 0) is a
// plain frame step, not a flip: the seam's change is then an ordinary frame's.
const PH = 5;
const CURIOUS = [245, 305]; // frames 245..304 (8.17 to 10.17 s)
if (CURIOUS.some((f) => (f + PH) % 10)) throw new Error('the face must change on a wobble flip');

// ---- the falling leaves: the game's leaf and its fall (tkPetal: translate(dx, 340) and opacity 1 -> 0 on ease-in), slowed 2x (6.8 s), with a
// gentle rock and sway, a 0.35 s fade-in where the leaf leaves the canopy; events repeat every L seconds, so they wrap round the loop point ----
const DUR = 3.4 * 2;
const EVENTS = (() => { let seed = 1121; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const ev = [], n = 26;
  for (let i = 0; i < n; i++) ev.push({ ts: (i + rnd() * 0.7) * L / n, x: X0 + 8 + rnd() * (W / S - 16), y: 150 + rnd() * 140, dx: Math.round(rnd() * 120 - 60), r: Math.round(rnd() * 360), sc: 0.55 + rnd() * 0.3, ph: rnd() * 6.283, ph2: rnd() * 6.283 });
  // the leaf Noodle watches: it leaves the canopy near the trunk and drifts down just past his nose around 9 s
  ev.push({ ts: 4.45, x: 929, y: 284, dx: 2, r: 200, sc: 0.65, ph: 1.2, ph2: 0.4, watch: true });
  return ev; })();
const LEAF_JS = `
function easeIn(u){ if(u<=0) return 0; if(u>=1) return 1; const x1=.42,x2=1; let a=0,b=1,s=u; for(let i=0;i<40;i++){ s=(a+b)/2; const x=3*(1-s)*(1-s)*s*x1+3*(1-s)*s*s*x2+s*s*s; if(x<u) a=s; else b=s; } return 3*(1-s)*s*s*1+s*s*s; }
const sm=(x)=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);};
function leafAt(e,t){ let a=((t-e.ts)%L+L)%L; if(a>=DUR) return null; const u=a/DUR, k=easeIn(u);
  const x=e.x+e.dx*k+6*Math.sin(6.2832*u*1.1+e.ph2), y=e.y+340*k, rot=e.r+16*Math.sin(6.2832*u*1.3+e.ph), op=(1-k)*sm(a/0.35);
  return {x:(x-X0)*S, y:(y-Y0)*S, rot, op, sc:e.sc*S}; }`;
// no leaf crosses the line's card while it shows (0 to 4.2 s): a leaf that would is moved to the right-hand edge, past the card, or left out
{ const vm = require('vm'), c = { L, DUR, X0, Y0, S, Math }; vm.createContext(c); vm.runInContext(LEAF_JS, c);
  const hits = (e) => { for (let n = 0; n <= 4.3 * FPS; n++) { const q = c.leafAt(e, n / FPS); if (!q || q.op < 0.003) continue; const rr = 11 * q.sc;
    if (q.x + rr > CARD.cx - CARD.w / 2 - 12 && q.x - rr < CARD.cx + CARD.w / 2 + 12 && q.y + rr > CARD.cy - CARD.h / 2 - 12 && q.y - rr < CARD.cy + CARD.h / 2 + 12) return true; } return false; };
  let moved = 0, dropped = 0;
  for (let i = EVENTS.length - 1; i >= 0; i--) { const e = EVENTS[i]; if (!hits(e)) continue; if (e.watch) throw new Error('the watched leaf crosses the line');
    e.x = X0 + (CARD.cx + CARD.w / 2 + 70) / S + (i % 3) * 6; e.dx = Math.abs(e.dx) % 25; moved++; if (hits(e)) { EVENTS.splice(i, 1); dropped++; } }
  console.log('leaves', EVENTS.length, '(moved clear of the line', moved, ', left out', dropped + ')'); }

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet">${RN ? `<link href="${RN_FONT_CSS}" rel="stylesheet">` : ''}
<style>html,body{margin:0;background:#fff;overflow:hidden}svg{display:block}${facts.dogCss}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g id="bg"></g><g id="dog"></g><g id="lv"></g><g id="ov"></g><g id="chk"></g><g id="dbg"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
const $=(i)=>document.getElementById(i), F=${JSON.stringify(F_)}, RN=${RN}, f2=(x)=>(+x).toFixed(2), DEBUG=${!!process.env.DEBUG};
const L=${L}, FPS=${FPS}, S=${S}, X0=${X0}, Y0=${Y0}, DUR=${DUR}, EV=${JSON.stringify(EVENTS)}, LEAF=${JSON.stringify(LEAF)}, PROPS=${JSON.stringify(PROPS)};
const CARD=${JSON.stringify(CARD)}, LINE=${JSON.stringify(LINE)}, CURIOUS=${JSON.stringify(CURIOUS)};
const LINE_ON=${LINE_ON.toString()};
${LEAF_JS}
const leafSvg=(p)=>'<g transform="translate('+f2(p.x)+' '+f2(p.y)+') scale('+f2(p.sc)+') rotate('+f2(p.rot)+')" opacity="'+p.op.toFixed(3)+'"><path d="'+LEAF.d+'" fill="'+LEAF.fill+'" stroke="'+LEAF.stroke+'" stroke-width="'+LEAF.sw+'" stroke-linejoin="round"/></g>';
let CARD_SVG='', T0=0, ERR=null, LAST=null;
function setup(d){
  $('bg').innerHTML='<image href="'+d.bg+'" x="0" y="0" width="${W}" height="${H}"/>';
  // Noodle: the two faces, both always in the page (the hidden one at opacity 0) so the art's CSS wobble never restarts
  $('dog').innerHTML='<g id="dogT"><g id="fDreamy">'+d.dreamy+'</g><g id="fCurious" opacity="0">'+d.curious+'</g></g>';
  for(const s of $('dog').querySelectorAll('svg.pa-dog')){ s.setAttribute('x','${DOGX}'); s.setAttribute('y','${DOGY.toFixed(2)}'); s.setAttribute('width','${240 * K}'); s.setAttribute('height','${200 * K}'); s.setAttribute('overflow','visible'); }
  CARD_SVG='<g data-apart="line"><g data-box><rect x="'+(CARD.cx-CARD.w/2)+'" y="'+(CARD.cy-CARD.h/2)+'" width="'+CARD.w+'" height="'+CARD.h+'" rx="40" fill="${CREAM}" fill-opacity=".92" stroke="${PEN}" stroke-width="4" stroke-opacity=".75"/>'
    +centred([{s:LINE[0],size:${SIZES[0]},pitch:${PITCH}},{s:LINE[1],size:${SIZES[1]},fill:'${MUTED}'}],CARD.cx,CARD.cy,F).svg+'</g></g>';
  // the props Noodle keeps clear of, as invisible boxes for apartCheck
  $('chk').innerHTML=Object.entries(PROPS).map(([k,b])=>'<rect data-apart="'+k+'" x="'+f2(b[0])+'" y="'+f2(b[1])+'" width="'+f2(b[2]-b[0])+'" height="'+f2(b[3]-b[1])+'" fill="none" stroke="'+(DEBUG?'red':'none')+'" stroke-width="3"/>').join('');
}
// the page's own animation, on its clock (requestAnimationFrame + performance.now(), frozen and stepped by the capture)
function tick(now){
  try {
    const t=(now-T0)/1000, n=Math.round(t*FPS-0.0001), lt=((t%L)+L)%L;
    // breathing: a slow 3 s breath, the art scaled about its feet (5 breaths a loop)
    const b=Math.sin(6.2832*lt/3), fx=${DOGX + 120 * K}, fy=${FOOT - 7 * K};
    $('dogT').setAttribute('transform','translate('+fx+' '+fy+') scale('+(1+0.004*b).toFixed(5)+' '+(1+0.014*b).toFixed(5)+') translate('+(-fx)+' '+(-fy)+')');
    const nn=((n%${NF})+${NF})%${NF}, cur=nn>=CURIOUS[0]&&nn<CURIOUS[1];
    $('fDreamy').setAttribute('opacity',cur?'0':'1'); $('fCurious').setAttribute('opacity',cur?'1':'0');
    $('fDreamy').toggleAttribute('data-noodle',!cur); $('fCurious').toggleAttribute('data-noodle',cur);
    let lv=''; const ls=[]; for(const e of EV){ const p=leafAt(e,lt); if(p&&p.op>0.003){ lv+=leafSvg(p); ls.push(p); } } $('lv').innerHTML=lv;
    const on=LINE_ON(lt); $('ov').innerHTML=on>0.002?'<g opacity="'+on.toFixed(4)+'">'+CARD_SVG+'</g>':'';
    LAST={t,lt,n,on,leaves:ls.length,cur};
  } catch(e){ ERR=String(e&&e.stack||e); }
  requestAnimationFrame(tick);
}
window.begin=(t0)=>{ T0=t0; requestAnimationFrame(tick); };
// every frame's checks: centring, the safe zone, Noodle 28 px clear of the deck and the trunk, no leaf over the card while it shows
window.checks=()=>{ if(ERR) return ERR; const st=$('st'), bad=[];
  if(RN){ // the full frame with a 50 px margin: every text and box inside 50..1030 x 50..1870
    st.querySelectorAll('#ov text,#ov [data-box]').forEach((e)=>{ const q=e.getBoundingClientRect(); if(q.left<50||q.right>1030||q.top<50||q.bottom>1870) bad.push('outside the 50 px margin: '+(e.textContent||'box').slice(0,20)); });
    bad.push(...centreCheck(st)); }
  else bad.push(...centreCheck(st), ...safeCheck(st));
  // Noodle's drawn box: the face on show, its shown wobble drawing's paths (strokes included), not the hidden ones
  const face=st.querySelector('[data-noodle] svg.pa-dog'); let l=1e9,t=1e9,r=-1e9,bt=-1e9;
  for(const g of face.querySelectorAll('.pa-d-f0,.pa-d-f1,.pa-d-f2')){ if(+getComputedStyle(g).opacity<0.5) continue; for(const e of g.querySelectorAll('path,ellipse,circle,text')){ const q=e.getBoundingClientRect(); if(!q.width&&!q.height) continue; l=Math.min(l,q.left);t=Math.min(t,q.top);r=Math.max(r,q.right);bt=Math.max(bt,q.bottom);} }
  for(const e of face.querySelectorAll(':scope>g>ellipse,:scope>g>path')){ const q=e.getBoundingClientRect(); if(!q.width) continue; l=Math.min(l,q.left);t=Math.min(t,q.top);r=Math.max(r,q.right);bt=Math.max(bt,q.bottom); } // the shadow
  if(!(r>l)) return 'no Noodle drawn';
  const nb=[l,t,r,bt]; window.NB=nb.map(Math.round);
  $('chk').querySelectorAll('[data-apart="noodle"]').forEach((e)=>e.remove());
  $('chk').insertAdjacentHTML('beforeend','<rect data-apart="noodle" x="'+f2(l)+'" y="'+f2(t)+'" width="'+f2(r-l)+'" height="'+f2(bt-t)+'" fill="none" stroke="'+(DEBUG?'blue':'none')+'" stroke-width="3"/>');
  bad.push(...apartCheck(st,28));
  if(r-l<550||r-l>700) bad.push('Noodle is '+Math.round(r-l)+' px wide');
  if(RN?(l<50||r>1030||t<50||bt>1870):(l<60||r>850||t<270||bt>1440)) bad.push('Noodle outside '+(RN?'the 50 px margin ':'the safe zone ')+nb.map(Math.round));
  const card=st.querySelector('#ov rect'); if(card){ const c=card.getBoundingClientRect(); st.querySelectorAll('#lv>g').forEach((g)=>{ const q=g.getBoundingClientRect(); if(q.right>c.left-6&&q.left<c.right+6&&q.bottom>c.top-6&&q.top<c.bottom+6) bad.push('a leaf over the line card at '+[q.left,q.top].map(Math.round)); }); }
  return bad.length?bad.join(' | '):null; };
</script>`;

(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: W, height: H } });
  // the background: the captured Ueno scene, its window cut out and drawn once (the tap-spot outlines hidden, as the game hides them)
  const bgPng = path.join(WORK, 'bg.png');
  if (!fs.existsSync(bgPng) || process.env.REBG) {
    // the game nests the scene in its world (x, y, width, height and a size style on the root): those go, the window's viewBox and size come in
    const sv = SCENE.replace(/^<svg x="0" y="0" width="1000" height="600" style="[^"]*"([^>]*?)\sviewBox="0 0 1000 600"/, `<svg$1 viewBox="${X0} ${Y0} ${W / S} ${H / S}" width="${W}" height="${H}"`);
    if (sv === SCENE) throw new Error('could not set the scene window');
    await p.setContent(`<!doctype html><style>html,body{margin:0}svg{display:block}.pa-wc-hl{opacity:0!important}</style>${sv}`);
    await p.screenshot({ path: bgPng }); }
  const bg = 'data:image/png;base64,' + fs.readFileSync(bgPng).toString('base64');
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(async () => { await document.fonts.load('700 58px Caveat'); await document.fonts.load('700 46px Caveat'); await document.fonts.ready; });
  if (RN) { await p.evaluate((txt) => document.fonts.load('700 40px "LXGW WenKai"', txt), HOOK);
    if (!(await p.evaluate((txt) => document.fonts.check('700 40px "LXGW WenKai"', txt), HOOK))) throw new Error('LXGW WenKai did not load'); }
  await p.evaluate((d) => window.setup(d), { bg, dreamy: draw.dreamy.svg, curious: draw.curious.svg });

  const t0 = await freezeClock(p);
  await p.evaluate((t) => window.begin(t), t0 + PH * 1000 / FPS); // the page's frame 0 is PH frames into the wobble's cycle
  await stepClock(p, t0); // the prime step: the art's CSS wobble is born at t0
  const at = (n) => t0 + (n + PH + 0.0001) * 1000 / FPS; // frame n, with the 0.0001 frame-index nudge
  const render = async (n, file) => { await stepClock(p, at(n)); const err = await p.evaluate(() => window.checks());
    if (err) { if (process.env.SOFT) console.log('CHECK', n, err.slice(0, 400)); else throw new Error(err + ' at frame ' + n); }
    if (file) await p.screenshot({ path: file, animations: 'allow' }); };
  // the loop: frame NF is frame 0 again (pixel for pixel), so the last frame flows into the first
  if (!process.env.CHECK && !process.env.ONLY) {
    await render(0, path.join(WORK, 'loop0.png')); await render(NF, path.join(WORK, 'loopN.png'));
    const same = fs.readFileSync(path.join(WORK, 'loop0.png')).equals(fs.readFileSync(path.join(WORK, 'loopN.png')));
    console.log('frame', NF, '=== frame 0:', same); if (!same) throw new Error('the loop does not close: frame ' + NF + ' differs from frame 0');
  }
  if (process.env.CHECK) { for (let n = 0; n <= NF; n++) await render(n); console.log('all', NF + 1, 'frames pass the checks; Noodle', await p.evaluate(() => window.NB)); await releaseClock(p); await b.close(); return; }
  if (process.env.ONLY === 'stills') {
    const ns = process.env.TS ? process.env.TS.split(',').map(Number) : [0, 15, 30, 90, 150, 255, 270, 330, 420, 449];
    for (const n of ns) await render(n, path.join(WORK, 'stills', `s${String(n).padStart(3, '0')}.png`));
    console.log('stills in', path.join(WORK, 'stills'), 'Noodle', await p.evaluate(() => window.NB)); await releaseClock(p); await b.close(); return; }
  let fr = process.env.ENCODE ? [] : [...Array(NF).keys()]; // ENCODE=1: encode the frames already in WORK/f again
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((i) => i >= a && i <= z); }
  const tm = Date.now();
  for (const n of fr) { await render(n, path.join(WORK, 'f', `f${String(n).padStart(5, '0')}.png`)); if (n % 50 === 0) console.log('frame', n, '/', NF, ((Date.now() - tm) / 1000).toFixed(0) + ' s', JSON.stringify(await p.evaluate(() => window.LAST))); }
  await releaseClock(p);
  await b.close();

  // ---- sound: the game's music at Ueno at golden hour, rendered 2.2 s longer and crossfaded end into start (as build_xmas.js) ----
  const ff = (a) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
  const raw = path.join(WORK, 'music.wav'), loopWav = path.join(WORK, 'music_loop.wav'), mixWav = path.join(WORK, 'mix.wav'), T = NF / FPS, Ts = T.toFixed(4);
  if (RN && !fs.existsSync(raw)) throw new Error('the RedNote cut uses the English cut\'s music: copy its WORK/music.wav into ' + WORK);
  if (!fs.existsSync(raw) || process.env.REMUSIC) {
    const ab = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
    const ap = await ab.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ART_ROOT, 'mods', 'pawaudio.js') });
    const r = await ap.evaluate(async ([s, c]) => { const o = await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0.1 }, segments: [{ at: 0, ctx: c }] }); return { wav: o.wav, variants: o.variants }; }, [T + 2.2, facts.music]);
    console.log('music', JSON.stringify(facts.music), JSON.stringify(r.variants));
    fs.writeFileSync(raw, Buffer.from(r.wav, 'base64')); await ab.close(); }
  ff(['-i', raw, '-i', raw, '-filter_complex', `[0]atrim=1:${(1 + T).toFixed(4)},asetpts=PTS-STARTPTS,afade=t=in:d=1:curve=qsin[a];[1]atrim=${(1 + T).toFixed(4)}:${(2 + T).toFixed(4)},asetpts=PTS-STARTPTS,afade=t=out:d=1:curve=qsin,apad=whole_dur=${Ts}[b];[a][b]amix=inputs=2:duration=first:normalize=0[o]`, '-map', '[o]', loopWav]);
  const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', loopWav, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
  ff(['-i', loopWav, '-af', `loudnorm=I=-16:TP=-1.5:LRA=11:measured_I=${ln.input_i}:measured_TP=${ln.input_tp}:measured_LRA=${ln.input_lra}:measured_thresh=${ln.input_thresh}:offset=${ln.target_offset}:linear=true,aresample=44100`, mixWav]);
  const mp4 = path.join(OUT, RN ? 'doodle-doggo-momiji-loop-rednote.mp4' : 'doodle-doggo-momiji-loop.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    // keyframes on the first AND the last frame (one GOP between), at CRF 16: the last frame is coded like the first, so the codec adds no more
    // change across the seam than across any other frame step (a P-frame against the opening I-frame doubled it)
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '16', '-x264-params', `keyint=${NF}:min-keyint=1`, '-force_key_frames', `0,${((NF - 1) / FPS).toFixed(4)}`, '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k',
    '-movflags', '+faststart', '-t', T.toFixed(3), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
  // the whole loop frame by frame (no doubled frames, no jumps: there are no cuts in a loop), and the seam (last frame -> first)
  const cf = checkFrames(mp4, 0, NF - 1);
  const seam = JSON.parse(cp.execFileSync('python3', ['-c', `import cv2,numpy as np,json,sys
c=cv2.VideoCapture(sys.argv[1]);fs=[]
while True:
  ok,f=c.read()
  if not ok: break
  fs.append(cv2.cvtColor(f,cv2.COLOR_BGR2GRAY).astype(np.float32))
print(json.dumps({'n':len(fs),'seam':round(float(np.abs(fs[0]-fs[-1]).mean()),2)}))`, mp4], { encoding: 'utf8' }));
  // the art's own wobble steps (a new crayon drawing of Noodle every 10 frames, on frames 5, 15, 25 ...) change more than a frame of drifting leaves;
  // they are reported apart. Every other frame step must be an ordinary one.
  const flip = (i) => (i + PH) % 10 === 0, plain = cf.diffs.filter((x) => !flip(x[0])).map((x) => x[1]), flips = cf.diffs.filter((x) => flip(x[0])).map((x) => x[1]);
  const pm = plain.slice().sort((a, b) => a - b)[plain.length >> 1];
  const res = { frames: seam.n, median: cf.median, min: Math.min(...cf.diffs.map((x) => x[1])), max: Math.max(...cf.diffs.map((x) => x[1])), doubled: cf.doubled, jumps: cf.jumps,
    jumpsOffWobble: cf.jumps.filter((i) => !flip(i)), plainMedian: pm, plainMin: Math.min(...plain), plainMax: Math.max(...plain), wobbleSteps: flips.length, wobbleMin: Math.min(...flips), wobbleMax: Math.max(...flips),
    seam: seam.seam, seamToMedian: +(seam.seam / cf.median).toFixed(2) };
  console.log('checkFrames 0..' + (NF - 1), JSON.stringify(res));
  fs.writeFileSync(path.join(WORK, 'checkframes.json'), JSON.stringify(res, null, 1));
  if (cf.doubled.length || res.jumpsOffWobble.length || seam.n !== NF || res.plainMax > 3 * pm || res.seam > res.plainMax || res.seamToMedian < 0.5) throw new Error('the frame check failed: ' + JSON.stringify(res));
})().catch((e) => { console.error(e); process.exit(1); });
