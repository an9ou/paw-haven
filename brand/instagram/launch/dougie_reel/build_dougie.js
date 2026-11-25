// "Noodle is ready for the holidays" dance loop Reel (owner, 25 Nov 2026: "Lets make it", after a trending illustrated dachshund dance to
// "Teach Me How to Dougie"; docs/marketing/DOUGIE_REEL.md). English cut only, 1080 x 1920, 30 fps, 4 bars of 4 beats at 85 BPM (16 beats,
// 11.29 s, 339 frames), a SEAMLESS LOOP with no end card (owner, 16 Nov 2026: loop Reels have no end card; the website goes in the caption).
// OUR FILE HAS NO MUSIC: the song is copyrighted, so the posting MP4 carries a digitally silent audio track and the owner adds the trending sound in
// the Instagram app ("Use audio"). Every move and every outfit change sits on the song's beat grid (85 BPM: Music Gateway and AudioKeychain both list
// 85 BPM; see the doc). doodle-doggo-holiday-dance-beatcheck.mp4 is the same video with a soft click on every beat (louder on beat 1 of each bar),
// NOT for posting: it lets the owner check the sync.
// Noodle (PawArt.dog 'dachs', the game's 'dance' pose and its 'sit' and 'paw' poses, with the game's faces zoomies, wink, hearts, proud and blep)
// dances in the game's own Cozy House living room at night (captured from the game: capture_dougie.js), by the Cardboard Fireplace, with the Cocoa
// Mug Lamp and the Doggy Snow Globe on the floor (Cozy Winter decorations from the kind shop, placed as a player places them). Every beat: a new
// drawing of the game's art (no in-betweens, no distortion); the whole dog bounces, leans and sways on the beat, a hop on every downbeat. A holiday
// look lands every 2 beats with the game's own crayon sparkle doodle (world A O.sparkle) popping round him; the last beat brings back the first look,
// so the loop closes. Real game clothes only (checked against CLOTHES and en.json in the capture).
// Beat grid: beat b starts on frame round(b x 60/85 x 30) (the cut lands on the nearest frame); a frame's beat comes from its time n/30 with a
// half-frame tolerance. Smooth motion inside a beat runs on the beat's own frames (u = 0 on its first frame, 1 on the next beat's), so frame 339 is
// frame 0 again and the loop has no drift.
// Two small lines: "Get ready for the holidays" with the game's crayon Felt Fir Tree in bar 1, "Noodle's ready. / Is your dog?" in bar 4. Both fade,
// so frame 0 and the last frame show no words and the seam stays clean.
// ALL moving footage is stepped on the FROZEN PAGE CLOCK (../frozen_clock.js): freezeClock(), stepClock() to exactly t0 + (n + 0.0001) x 1000/30 ms
// before each screenshot (the 0.0001 frame-index nudge), releaseClock(). The room itself is still (the capture finds no animation in it).
// Every frame: centreCheck(), safeCheck() and apartCheck() (../centre_text.js), plus: words, cards, sparkles and Noodle inside x 60..850, y 270..1440;
// Noodle 28 px clear of the fireplace, the mug lamp, the snow globe and the cards; no sparkle over Noodle, a card or a prop.
//
//   1) captures: NODE_PATH=$(npm root -g) node brand/instagram/launch/dougie_reel/capture_dougie.js <main checkout> <caps>
//   2) ART_ROOT=<main checkout> CAPS=<caps> NODE_PATH=$(npm root -g) node brand/instagram/launch/dougie_reel/build_dougie.js <workdir>
//   ONLY=sprites: a sheet of every drawing used. ONLY=stills: key frames (WORK/stills; TS=a,b,... frame numbers). CHECK=1: every frame's checks
//   without rendering. FRAMES=a-b: re-render only frames a..b, then encode again. ENCODE=1: encode WORK/f again. DEBUG=1 outlines the boxes.
//   SHEETS=1 (after a render): the 12-still contact sheet and the seam strip into WORK.
// Output next to this file: doodle-doggo-holiday-dance.mp4 (to post) and doodle-doggo-holiday-dance-beatcheck.mp4 (sync check only).
const fs = require('fs'), path = require('path'), cp = require('child_process');

// ---------------- the plan (also read by capture_dougie.js) ----------------
const BPM = 85, SPB = 60 / BPM, FPS = 30, BEATS = 16, BAR = 4;
const NF = Math.round(BEATS * SPB * FPS); // 338.82 -> 339 frames (11.30 s); the 16 beats last 11.294 s
const CUT = [...Array(BEATS + 1).keys()].map((b) => Math.round(b * SPB * FPS)); // beat b's first frame (nearest frame); CUT[16] = NF
// the looks: one every 2 beats, real game clothes (slot: name), the first again on the last beat
const LOOKS = [
  { n: 'Pom-pom Beanie', o: { head: 'Pom-pom Beanie' } },
  { n: 'Reindeer Antlers', o: { head: 'Reindeer Antlers' } },
  { n: 'Reindeer Antlers + Jingle Bell Collar', o: { head: 'Reindeer Antlers', neck: 'Jingle Bell Collar' } },
  { n: 'Knit Winter Sweater + Pom-pom Beanie', o: { head: 'Pom-pom Beanie', body: 'Knit Winter Sweater' } },
  { n: 'Knit Winter Sweater + Pom-pom Beanie + Snowflake Snood', o: { head: 'Pom-pom Beanie', body: 'Knit Winter Sweater', neck: 'Snowflake Snood' } },
  { n: 'Father Christmas Suit', o: { body: 'Father Christmas Suit' } },
  { n: 'Father Christmas Suit + Jingle Bell Collar', o: { body: 'Father Christmas Suit', neck: 'Jingle Bell Collar' } },
];
const LOOK_AT = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 6, 0]; // per beat
// the moves, per beat of the bar: 1 a hop (dance pose, its first drawing, zoomies), 2 the dance leaning left (facing left, head-tilt drawing,
// wink), 3 the dance leaning right (facing right, the other head-tilt drawing, hearts), 4 the end-of-bar pose: a sit-and-wave ('paw', blep)
// in bars 1 and 3, a proud sit ('sit', proud: the game's own "ta-da!") in bars 2 and 4.
// (The play bow is 224 art units long: at Noodle's dance size it would be ~880 px, wider than the safe zone, so the bar ends on a sit instead.)
const MOVE_AT = (b) => { const i = b % BAR, bar = Math.floor(b / BAR);
  if (i === 0) return { pose: 'dance', facing: 'right', expr: 'zoomies', k: 0, hop: true };
  if (i === 1) return { pose: 'dance', facing: 'left', expr: 'wink', k: 1 };
  if (i === 2) return { pose: 'dance', facing: 'right', expr: 'hearts', k: 2 };
  return bar % 2 === 0 ? { pose: 'paw', facing: 'right', expr: 'blep', k: 0, rest: true } : { pose: 'sit', facing: 'right', expr: 'proud', k: 0, rest: true }; };
const drawKey = (li, m) => li + '|' + m.pose + '|' + m.facing + '|' + (m.expr || '');
const PLAN = { looks: LOOKS, strict: true, drawKey, movesFor: (li) => [...Array(BEATS).keys()].filter((b) => LOOK_AT[b] === li).map(MOVE_AT) };
// the room, as the player arranges it (scene units, top-left of each thing's catalogue box): the fireplace against the kitchen counter, the mug
// lamp and the snow globe on the floor at the front, the dog bed moved to the middle of the room (out of the shot)
const ROOM = { decor: { 'Cardboard Fireplace': [836, 304], 'Cocoa Mug Lamp': [762, 496], 'Doggy Snow Globe': [648, 500] }, bed: [300, 430] };
module.exports = { PLAN, ROOM, BPM, NF, CUT };
if (require.main !== module) return;

// ---------------- the build ----------------
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js');
const { freezeClock, stepClock, releaseClock, checkFrames } = require('../frozen_clock.js');
const OUT = __dirname;
const CAPS = path.resolve(process.env.CAPS || 'dougie_caps');
const WORK = path.resolve(process.argv[2] || 'dougie_work');
for (const d of ['f', 'stills', 'sheet']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
// REDNOTE=1 (owner via the coordinator, 25 Nov 2026): the RedNote cut. The same picture timing, the same loop, the lines in Simplified Chinese
// (LXGW WenKai), the full frame with a 50 px margin instead of the safe zone (the centring, spacing and sparkle checks stay), bigger cards, and the
// Christmas lo-fi of the lo-fi cut as its soundtrack (MUSIC=<lofi_dougie.js workdir>/music.wav, used as it is). No QR, link, domain, @, handles,
// app or platform names: the build refuses RedNote's off-platform words on screen. Output doodle-doggo-holiday-dance-rednote.mp4.
const RN = !!process.env.REDNOTE;
const { RN_FONT_CSS } = require('../../../kids/endcard.js');
const RN_BAN = /[A-Za-z@]|\.(app|com|io|cn|net)|链接|网址|官网|二维码|扫码|下载|私信我|加我|主页链接|戳|发帖|快拍|帖子|微信|朋友圈|QQ|微博|抖音|小红书|Instagram|YouTube|TikTok|itch/i;
const W = 1080, H = 1920, PEN = '#5B3D32', CREAM = '#FFFDF7', MUTED = '#8A7468', RED = '#D2473C';
const rj = (f) => JSON.parse(fs.readFileSync(path.join(CAPS, f), 'utf8'));
const facts = rj('facts.json'), draw = rj('draw.json');
const ROOM_SVG = fs.readFileSync(path.join(CAPS, 'house.svg'), 'utf8');

// ---- what the captures must be ----
if (facts.date !== '2026-11-25') throw new Error('the captures are not from 25 Nov 2026: ' + facts.date);
if (facts.scene.place !== 'house' || !/Cozy House living room, night, [a-z]+, autumn/.test(ROOM_SVG)) throw new Error('not the Cozy House living room at night in autumn');
if (facts.scene.anims.length) throw new Error('the room has its own animation now: ' + facts.scene.anims.join(', ') + ' (capture it on the frozen clock)');
if (!facts.fest || facts.fest.lights || facts.fest.snow) throw new Error('Christmas lights or snow are on in the game on the capture date');
for (const [b, li] of LOOK_AT.entries()) { const k = drawKey(li, MOVE_AT(b)); if (!draw[k]) throw new Error('no drawing ' + k); }
if (LOOK_AT[BEATS - 1] !== LOOK_AT[0]) throw new Error('the last beat must bring back the first look');
for (const L of LOOKS) for (const n of Object.values(L.o)) if (!facts.clothes[n]) throw new Error(n + ' was not checked in the capture');
if (CUT[BEATS] !== NF) throw new Error('the loop is not the 16 beats');

// ---- the stage: the Cozy House (1000 x 600 scene units), zoomed: screen = (scene - (X0, Y0)) x S; the window ends at the scene's foot ----
const S = 4, X0 = 640, Y0 = 600 - H / S;
// ---- Noodle: the art's 240 x 200 box at K px a unit, the shadow's foot (art y 193) on FOOT, the box centred on CX ----
const K = 3.95, FOOT = 1430, CX = 420;
const DOGX = CX - 120 * K, DOGY = FOOT - 193 * K;
// ---- the lines ----
const LINE1 = RN ? ['准备过节啦'] : ['Get ready', 'for the holidays'], LINE2 = RN ? ['面条准备好了，', '你的狗狗呢？'] : ["Noodle's ready.", 'Is your dog?'];
if (RN) { if (LINE1.concat(LINE2).some((l) => [...l].length > 14)) throw new Error('a RedNote line over 14 characters');
  for (const l of LINE1.concat(LINE2)) if (RN_BAN.test(l)) throw new Error('a RedNote no-go word on screen: ' + l); }
const F_ = RN ? "'LXGW WenKai'" : 'Caveat', SZ1 = RN ? 100 : 76, SZ2 = RN ? 84 : 76, PITCH = RN ? 100 : 78;
for (const s of LINE1.concat(LINE2)) if (/itch|—|–|breed/i.test(s)) throw new Error('a no-go word on screen: ' + s);
// card 1 (bar 1) with the crayon tree beside it, card 2 (bar 4); centred as a group on the safe zone's middle (x 455)
// (the cards sit low enough to stay off the floor lamp's glow rays, which reach y 320 at the top left)
const C1 = RN ? { cx: 398, cy: 430, w: 600, h: 180 } : { cx: 400, cy: 424, w: 520, h: 196 }, TREE = RN ? { x: 758, y: 330, w: 140, h: 200 } : { x: 708, y: 322, w: 140, h: 200 },
  C2 = RN ? { cx: 520, cy: 440, w: 690, h: 236 } : { cx: 455, cy: 424, w: 560, h: 196 };
const sm = (x) => { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); };
// opacity by time (s): card 1 in over 0.5 s from 0, out 2.3..2.75 s (bar 1 ends 2.82 s); card 2 in 8.47..8.97 s (bar 4 starts 8.47 s), out 10.7..11.15 s.
// (A fade much faster than half a second changes the frame as much as a beat cut does, and checkFrames would call it a jump.)
const T1 = [0, 0.5, 2.3, 2.75], T2 = [CUT[12] / FPS, CUT[12] / FPS + 0.5, 10.7, 11.15];
const ON = (t, q) => (t < q[0] || t > q[3] ? 0 : t < q[1] ? sm((t - q[0]) / (q[1] - q[0])) : t <= q[2] ? 1 : 1 - sm((t - q[2]) / (q[3] - q[2])));
// pops: a look lands (and beat 1 at 0.0 s): sparkle stars round Noodle for 12 frames
const POPS = [...Array(BEATS).keys()].filter((b) => b === 0 || LOOK_AT[b] !== LOOK_AT[b - 1]);

const page = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet">${RN ? `<link href="${RN_FONT_CSS}" rel="stylesheet">` : ''}
<style>html,body{margin:0;background:#fff;overflow:hidden}svg{display:block}${facts.dogCss}
.pa-dog .pa-d-f0,.pa-dog .pa-d-f1,.pa-dog .pa-d-f2{animation:none!important;display:none}
.k0 .pa-d-f0,.k1 .pa-d-f1,.k2 .pa-d-f2{display:inline;opacity:1!important}.pa-d-tw{animation:none!important;opacity:1}
.noshadow svg.pa-dog>g>ellipse,.noshadow svg.pa-dog>g>path,.noshadow svg.pa-dog>g>g:not([class^="pa-d-f"]){display:none}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><g id="bg"></g><g id="shadow"></g><g id="dog"></g><g id="pop"></g><g id="ov"></g><g id="chk"></g><g id="dbg"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
const $=(i)=>document.getElementById(i), F=${JSON.stringify(F_)}, RN=${RN}, RN_BAN=${RN_BAN.toString()}, f2=(x)=>(+x).toFixed(2), DEBUG=${!!process.env.DEBUG};
const FPS=${FPS}, NF=${NF}, CUT=${JSON.stringify(CUT)}, SPB=${SPB}, BEATS=${BEATS}, K=${K}, DOGX=${DOGX}, DOGY=${DOGY}, FOOT=${FOOT}, CX=${CX};
const LOOK_AT=${JSON.stringify(LOOK_AT)}, MOVE_AT=${MOVE_AT.toString()}, BAR=${BAR}, drawKey=${drawKey.toString()}, POPS=${JSON.stringify(POPS)};
const T1=${JSON.stringify(T1)}, T2=${JSON.stringify(T2)}, C1=${JSON.stringify(C1)}, C2=${JSON.stringify(C2)}, TREE=${JSON.stringify(TREE)};
const sm=${sm.toString()}, ON=${ON.toString()};
const SPARK=${JSON.stringify(facts.spark)};
let D={}, PROPS={}, CARD1='', CARD2='', T0=0, ERR=null, LAST=null, curKey='', NB=null, ANCH={}, DX=0;
// the game's spark doodle (world A O.sparkle): a four-point crayon star
const spark=(x,y,s,col)=>{const q=s*.16;return '<path d="M'+x+' '+(y-s)+'Q'+(x+q)+' '+(y-q)+' '+(x+s*.9)+' '+y+'Q'+(x+q)+' '+(y+q)+' '+x+' '+(y+s)+'Q'+(x-q)+' '+(y+q)+' '+(x-s*.9)+' '+y+'Q'+(x-q)+' '+(y-q)+' '+x+' '+(y-s)+'Z" fill="'+col+'" stroke="'+SPARK.ink+'" stroke-width="1.5" stroke-linejoin="round"/>';};
// where the frame's beat is: the frame number from the clock (the 0.0001 nudge), its time n/30, the beat with a half-frame tolerance
function beatOf(n){ n=((n%NF)+NF)%NF; const t=n/FPS; let b=Math.floor(t/SPB+0.5/(SPB*FPS)); b=Math.min(BEATS-1,Math.max(0,b)); while(b>0&&CUT[b]>n) b--; while(b<BEATS-1&&CUT[b+1]<=n) b++;
  return {n,t,b,u:(n-CUT[b])/(CUT[b+1]-CUT[b])}; }
function setup(d){
  D=d.draw; PROPS=d.props;
  // every drawing's drawn box in art units (its shown crayon drawing and its floor shadow): each is placed with its box centred on CX, so Noodle stays on his spot
  // whatever the pose (the sit poses sit further right in the art's 240 x 200 box than the dance)
  const h=document.createElement('div'); h.style.cssText='position:fixed;left:0;top:0;width:240px;height:200px;visibility:hidden'; document.body.appendChild(h);
  for(let b=0;b<BEATS;b++){ const m=MOVE_AT(b), key=drawKey(LOOK_AT[b],m), id=key+'#'+m.k; if(ANCH[id]) continue;
    h.innerHTML='<div class="k'+m.k+'">'+D[key]+'</div>'; const s=h.querySelector('svg'); s.setAttribute('width',240); s.setAttribute('height',200);
    let l=1e9,r=-1e9; s.querySelectorAll('.pa-d-f'+m.k+' path,.pa-d-f'+m.k+' ellipse,.pa-d-f'+m.k+' circle,.pa-d-f'+m.k+' text,svg.pa-dog>g>ellipse,svg.pa-dog>g>path,svg.pa-dog>g>g:not([class^="pa-d-f"])>*').forEach((e)=>{ const q=e.getBoundingClientRect(); if(!q.width&&!q.height) return; l=Math.min(l,q.left); r=Math.max(r,q.right); });
    ANCH[id]={l,r,cx:(l+r)/2}; }
  h.remove();
  $('bg').innerHTML='<image href="'+d.bg+'" x="0" y="0" width="${W}" height="${H}"/>';
  const card=(c,lines,id)=>'<g id="'+id+'" data-apart="'+id+'"><g data-box><rect x="'+(c.cx-c.w/2)+'" y="'+(c.cy-c.h/2)+'" width="'+c.w+'" height="'+c.h+'" rx="44" fill="${CREAM}" fill-opacity=".95" stroke="${PEN}" stroke-width="5"/>'
    +centred(lines.map((l,i)=>({s:l,size:id==='card1'?${SZ1}:${SZ2},pitch:${PITCH},fill:id==='card1'&&i===lines.length-1?'${RED}':'${PEN}'})),c.cx,c.cy,F).svg+'</g></g>';
  CARD1=card(C1,${JSON.stringify(LINE1)},'card1')+'<g data-apart="tree" data-safe><svg x="'+TREE.x+'" y="'+TREE.y+'" width="'+TREE.w+'" height="'+TREE.h+'" viewBox="0 0 140 200" overflow="visible">'+d.tree+'</svg></g>';
  CARD2=card(C2,${JSON.stringify(LINE2)},'card2');
  $('chk').innerHTML=Object.entries(PROPS).map(([k,b])=>'<rect data-apart="'+k+'" x="'+f2(b[0])+'" y="'+f2(b[1])+'" width="'+f2(b[2]-b[0])+'" height="'+f2(b[3]-b[1])+'" fill="none" stroke="'+(DEBUG?'red':'none')+'" stroke-width="3"/>').join('');
}
function place(svg){ return svg.replace(/^<svg /,'<svg x="'+f2(DOGX)+'" y="'+f2(DOGY)+'" width="'+(240*K)+'" height="'+(200*K)+'" overflow="visible" '); }
// the page's own animation, on its clock (requestAnimationFrame + performance.now(), frozen and stepped by the capture)
function tick(now){
  try {
    const n=Math.round((now-T0)/1000*FPS-0.0001), q=beatOf(n), m=MOVE_AT(q.b), li=LOOK_AT[q.b], key=drawKey(li,m), B=q.b+q.u;
    if(key+m.k!==curKey){ curKey=key+m.k; const s=place(D[key]); DX=(120-ANCH[key+'#'+m.k].cx)*K;
      $('dog').innerHTML='<g id="dogT" class="noshadow k'+m.k+'">'+s+'</g>'; $('shadow').innerHTML='<g class="onlyshadow">'+s+'</g>'; }
    // the bounce: down on every beat; a hop (up and land) on beat 1 of the bar; a small settle on the end-of-bar sit
    const lift=(m.hop?60:m.rest?12:30)*Math.sin(Math.PI*q.u);
    // the lean and the sway: side to side over two beats (left on beat 2, right on beat 3 of each bar), the lean an eighth of a beat behind
    // (no side step: Noodle with his crayon floor shadow fills the room between the safe zone's left edge and the fireplace)
    const sway=0, lean=2.2*Math.sin(Math.PI*B-Math.PI/4)*(m.rest?0.5:1);
    const fx=CX+sway+DX, fy=FOOT-7*K;
    $('dogT').setAttribute('transform','translate('+f2(fx)+' '+f2(fy-lift)+') rotate('+lean.toFixed(3)+') translate('+f2(-CX)+' '+f2(-fy)+')');
    $('shadow').setAttribute('transform','translate('+f2(sway+DX)+' 0)');
    if(q.n===CUT[q.b]){ NB0=noodleBox(); NBS=sway; }
    window.ANCH=ANCH; // the sparkles' places come from the beat's first frame
    // the pop: the game's sparkle stars burst round Noodle's head when a look lands (and on beat 1 at 0.0 s), 12 frames
    let pop=''; const pb=POPS.includes(q.b)?q.b:-1, age=q.n-CUT[q.b];
    if(pb>=0&&age<12&&NB0){ const a=age/11, sc=Math.sin(Math.PI*Math.min(1,a*1.15)), op=a<.75?1:1-(a-.75)/.25;
      // above his head (his box spans the safe zone's width): five stars in an arc, moving with him (the bounce and the sway)
      const [l,t,r]=NB0, w=r-l, S0=[[l+w*.14,t-46,22,SPARK.pink],[l+w*.32,t-70,28,SPARK.yellow],[l+w*.5,t-50,20,SPARK.pink],[l+w*.68,t-74,30,SPARK.yellow],[l+w*.86,t-48,22,SPARK.yellow]];
      pop='<g opacity="'+op.toFixed(3)+'" transform="translate('+f2(sway-NBS)+' '+f2(-lift)+')">'+S0.map(([x,y,s,c],i)=>'<g data-spark transform="translate('+f2(x)+' '+f2(y)+') scale('+sc.toFixed(4)+') rotate('+(age*4+i*20)+')">'+spark(0,0,s,c)+'</g>').join('')+'</g>'; }
    $('pop').innerHTML=pop;
    const o1=ON(q.t,T1), o2=ON(q.t,T2);
    $('ov').innerHTML=(o1>0.002?'<g opacity="'+o1.toFixed(4)+'">'+CARD1+'</g>':'')+(o2>0.002?'<g opacity="'+o2.toFixed(4)+'">'+CARD2+'</g>':'');
    LAST={n:q.n,b:q.b,u:+q.u.toFixed(3),key,k:m.k,lift:+lift.toFixed(1),o1:+o1.toFixed(2),o2:+o2.toFixed(2),pop:pb>=0&&age<12};
  } catch(e){ ERR=String(e&&e.stack||e); }
  requestAnimationFrame(tick);
}
let NB0=null, NBS=0;
window.begin=(t0)=>{ T0=t0; requestAnimationFrame(tick); };
function drawW(){ let l=1e9,r=-1e9; const g=$('dogT'), k=/k(\\d)/.exec(g.getAttribute('class'))[1]; g.querySelectorAll('.pa-d-f'+k+' path,.pa-d-f'+k+' ellipse,.pa-d-f'+k+' circle,.pa-d-f'+k+' text').forEach((e)=>{ const q=e.getBoundingClientRect(); if(!q.width&&!q.height) return; l=Math.min(l,q.left); r=Math.max(r,q.right); }); return r-l; }
// Noodle's drawn box: the shown drawing's paths (strokes included) and the shadow, on screen
function noodleBox(){ let l=1e9,t=1e9,r=-1e9,bt=-1e9; const add=(e)=>{ const q=e.getBoundingClientRect(); if(!q.width&&!q.height) return; l=Math.min(l,q.left);t=Math.min(t,q.top);r=Math.max(r,q.right);bt=Math.max(bt,q.bottom); };
  const g=$('dogT'); const k=/k(\\d)/.exec(g.getAttribute('class'))[1]; g.querySelectorAll('.pa-d-f'+k+' path,.pa-d-f'+k+' ellipse,.pa-d-f'+k+' circle,.pa-d-f'+k+' text').forEach(add);
  $('shadow').querySelectorAll('svg.pa-dog>g>ellipse,svg.pa-dog>g>path,svg.pa-dog>g>g:not([class^="pa-d-f"])>*').forEach(add); return r>l?[l,t,r,bt]:null; }
// every frame's checks
window.checks=()=>{ if(ERR) return ERR; const st=$('st'), bad=[];
  if(RN){ // the full frame with a 50 px margin; and none of RedNote's off-platform words in our words
    st.querySelectorAll('#ov text,#ov [data-box],#ov [data-safe]').forEach((e)=>{ const q=e.getBoundingClientRect(); if(q.left<50||q.right>1030||q.top<50||q.bottom>1870) bad.push('outside the 50 px margin: '+(e.textContent||'box').slice(0,20)); });
    st.querySelectorAll('#ov text').forEach((e)=>{ if(RN_BAN.test(e.textContent)) bad.push('a RedNote no-go word on screen: '+e.textContent); });
    bad.push(...centreCheck(st)); }
  else bad.push(...centreCheck(st), ...safeCheck(st));
  const nb=noodleBox(); if(!nb) return 'no Noodle drawn'; NB=nb; window.NBR=nb.map(Math.round);
  $('chk').querySelectorAll('[data-apart="noodle"]').forEach((e)=>e.remove());
  $('chk').insertAdjacentHTML('beforeend','<rect data-apart="noodle" x="'+f2(nb[0])+'" y="'+f2(nb[1])+'" width="'+f2(nb[2]-nb[0])+'" height="'+f2(nb[3]-nb[1])+'" fill="none" stroke="'+(DEBUG?'blue':'none')+'" stroke-width="3"/>');
  bad.push(...apartCheck(st,28));
  const dw=drawW(); window.DW=Math.round(dw); if(dw<520||dw>700) bad.push('Noodle (the drawing, no shadow) is '+Math.round(dw)+' px wide');
  if(RN?(nb[0]<50||nb[2]>1030||nb[1]<50||nb[3]>1870):(nb[0]<60||nb[2]>850||nb[1]<270||nb[3]>1440)) bad.push('Noodle outside '+(RN?'the 50 px margin ':'the safe zone ')+nb.map(Math.round));
  // sparkles: inside the safe zone, clear of Noodle (6 px), the cards, the tree and the props (12 px)
  const near=(a,b,g)=>a.right>b.left-g&&a.left<b.right+g&&a.bottom>b.top-g&&a.top<b.bottom+g;
  const others=[...st.querySelectorAll('#chk [data-apart]:not([data-apart="noodle"]),#ov [data-apart]')].map((e)=>e.getBoundingClientRect());
  const nr={left:nb[0],top:nb[1],right:nb[2],bottom:nb[3]};
  st.querySelectorAll('#pop [data-spark]').forEach((e)=>{ const q=e.getBoundingClientRect(); if(!q.width) return;
    if(RN?(q.left<50||q.right>1030||q.top<50||q.bottom>1870):(q.left<60||q.right>850||q.top<270||q.bottom>1440)) bad.push('a sparkle outside the frame margin or safe zone at '+[q.left,q.top].map(Math.round));
    if(near(q,nr,6)) bad.push('a sparkle over Noodle at '+[q.left,q.top].map(Math.round));
    if(others.some((o)=>near(q,o,12))) bad.push('a sparkle over a card or a prop at '+[q.left,q.top].map(Math.round)); });
  return bad.length?bad.join(' | '):null; };
</script>`;

(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: W, height: H } });
  // the background: the captured room, its window cut out and drawn once (the scene's dashed tap outline hidden, as the game hides it)
  const bgPng = path.join(WORK, 'bg.png');
  await p.setContent(`<!doctype html><style>html,body{margin:0}svg{display:block}.pa-wa-hl,.pa-wc-hl{opacity:0!important}</style>${ROOM_SVG}`);
  const props = await p.evaluate(([X0, Y0, S, W, H]) => { const s = document.querySelector('svg.world'); s.removeAttribute('style'); s.setAttribute('viewBox', X0 + ' ' + Y0 + ' ' + W / S + ' ' + H / S); s.setAttribute('width', W); s.setAttribute('height', H); s.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    const box = (root) => { let l = 1e9, t = 1e9, r = -1e9, b = -1e9; root.querySelectorAll('path,ellipse,circle,rect,polygon,polyline,line,text').forEach((e) => { if (e.closest('defs,clipPath,mask,pattern,[clip-path]')) return; /* a crayon hatch is clipped to its shape: the shape's own outline counts */ const cs = getComputedStyle(e); if (cs.display === 'none' || +cs.opacity === 0) return; if (e.tagName === 'rect' && e.getAttribute('fill') === 'transparent') return; const q = e.getBoundingClientRect(); if (!q.width && !q.height) return; l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom); }); return [l, t, r, b].map((v) => Math.round(v * 10) / 10); };
    const out = {}; s.querySelectorAll('.hm-decor').forEach((g) => { const n = g.getAttribute('data-decor'); const sv = g.querySelector('svg'); if (n && sv) out[n] = box(sv); });
    return out; }, [X0, Y0, S, W, H]);
  // the props in the shot (screen px): only what shows in the frame
  const PROPS = {}; for (const [n, bx] of Object.entries(props)) { if (bx[2] < 0 || bx[0] > W || bx[3] < 0 || bx[1] > H) continue; PROPS[n.replace(/\W+/g, '_')] = bx.map((v, i) => Math.max(0, Math.min(i % 2 ? H : W, v))); }
  console.log('props in the shot', JSON.stringify(PROPS));
  for (const n of ['Cardboard_Fireplace', 'Cocoa_Mug_Lamp', 'Doggy_Snow_Globe']) if (!PROPS[n]) throw new Error(n + ' is not in the shot');
  if (!fs.existsSync(bgPng) || process.env.REBG) await p.screenshot({ path: bgPng });
  const bg = 'data:image/png;base64,' + fs.readFileSync(bgPng).toString('base64');
  const tree = facts.firTree.replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

  // ---- the covers (ONLY=cover; owner via the coordinator, 25 Nov 2026): their own design, not a frame of the Reel. The same Cozy House window by the
  // fireplace (the mug lamp and the snow globe taken off the floor to make room for the tiles), filled to the bottom; a big headline card with the
  // game's crayon Felt Fir Tree beside it; a small pill (true: the Reel has 7 looks); Noodle mid-dance in the Father Christmas Suit (the Reel's
  // beat 3.3 drawing, heart eyes); three of the game's sparkle doodles; a row of four of the looks' clothes in the game's own item art (the
  // wardrobe's art('item')), each in its own white bubble (RedNote: the game's zh-Hans names under them). Everything 28 px apart (apartCheck,
  // the fireplace too), text centred by its ink, every piece inside x 40..1040, y 250..1670 (the RedNote 3:4 crop keeps y 240..1680).
  // English: holiday-dance-cover.jpg (1080 x 1920). REDNOTE=1: brand/rednote/rednote-25-holiday-dance.jpg (that crop, 1080 x 1440).
  if (process.env.ONLY === 'cover') {
    const items = rj('items.json'), zh = JSON.parse(fs.readFileSync(path.join(path.resolve(process.env.ART_ROOT || path.join(__dirname, '..', '..', '..', '..')), 'game', 'i18n', 'zh-Hans.json'), 'utf8'));
    const TILES = ['Pom-pom Beanie', 'Reindeer Antlers', 'Knit Winter Sweater', 'Father Christmas Suit'].map((n) => { const k = facts.clothes[n] && facts.clothes[n].i18n; if (!k || !items[n] || !zh[k]) throw new Error('no art or zh-Hans name for ' + n); return { n, zh: zh[k], svg: items[n] }; });
    if (!LOOKS.some((L) => L.o.head === 'Pom-pom Beanie') || LOOKS.length !== 7) throw new Error('the pill says 7 looks');
    const CV = RN ? { head: [{ s: '准备过节啦', size: 120, fill: RED }], pill: '面条的圣诞换装', pillSize: 52 } : { head: [{ s: 'Ready for', size: 120, pitch: 112 }, { s: 'the holidays?', size: 120, fill: RED }], pill: "Noodle's 7 holiday looks", pillSize: 56 };
    const allText = CV.head.map((l) => l.s).concat(CV.pill, RN ? TILES.map((t) => t.zh) : []).join(' ');
    if (RN && RN_BAN.test(allText)) throw new Error('a RedNote no-go word on the cover: ' + allText);
    if (/itch|—|–/.test(allText)) throw new Error('no itch.io and no dashes on the cover');
    await p.evaluate(() => document.querySelectorAll('.hm-decor[data-decor="Doggy Snow Globe"],.hm-decor[data-decor="Cocoa Mug Lamp"]').forEach((e) => e.remove()));
    const cbg = path.join(WORK, 'cover_bg.png'); await p.screenshot({ path: cbg });
    const cbgUrl = 'data:image/png;base64,' + fs.readFileSync(cbg).toString('base64');
    const CK = 3.95, CFOOT = 1335, CCX = 415, DK = drawKey(5, MOVE_AT(10)), DKK = MOVE_AT(10).k;
    if (DK !== '5|dance|right|hearts') throw new Error('the cover drawing moved: ' + DK);
    const cpage = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap" rel="stylesheet">${RN ? `<link href="${RN_FONT_CSS}" rel="stylesheet">` : ''}
<style>html,body{margin:0;background:#fff;overflow:hidden}svg{display:block}${facts.dogCss}.pa-dog .pa-d-f0,.pa-dog .pa-d-f1,.pa-dog .pa-d-f2{animation:none!important;display:none}.k${DKK} .pa-d-f${DKK}{display:inline!important;opacity:1!important}.pa-d-tw{animation:none!important;opacity:1}</style>
<svg id="st" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><image href="${cbgUrl}" x="0" y="0" width="${W}" height="${H}"/><g id="art"></g><g id="ov"></g><g id="chk"></g></svg>
<script>${CENTRE_JS}
${SAFE_JS}
const $=(i)=>document.getElementById(i), F=${JSON.stringify(F_)}, f2=(x)=>(+x).toFixed(2), SPARK=${JSON.stringify(facts.spark)};
const spark=(x,y,s,col)=>{const q=s*.16;return '<path d="M'+x+' '+(y-s)+'Q'+(x+q)+' '+(y-q)+' '+(x+s*.9)+' '+y+'Q'+(x+q)+' '+(y+q)+' '+x+' '+(y+s)+'Q'+(x-q)+' '+(y+q)+' '+(x-s*.9)+' '+y+'Q'+(x-q)+' '+(y-q)+' '+x+' '+(y-s)+'Z" fill="'+col+'" stroke="'+SPARK.ink+'" stroke-width="1.5" stroke-linejoin="round"/>';};
window.cover=function(d){
  // the headline card, sized to its ink, with the tree beside it; the group centred on x 540
  const L=d.head; let top=1e9,bot=-1e9,b=0,wid=0; L.forEach((l)=>{ const k=inkOf(l.s,l.size,F); top=Math.min(top,b-k.A); bot=Math.max(bot,b+k.D); wid=Math.max(wid,k.L+k.R); b+=l.pitch||0; });
  const ch=bot-top+70, cw=wid+110, tw=150, th=214, gap=56, gx=540-(cw+gap+tw)/2, y0=262;
  let o='<g data-box data-apart="title"><rect x="'+f2(gx)+'" y="'+y0+'" width="'+f2(cw)+'" height="'+f2(ch)+'" rx="46" fill="${CREAM}" stroke="${PEN}" stroke-width="8"/>'+centred(L,gx+cw/2,y0+ch/2,F).svg+'</g>';
  o+='<g data-apart="tree"><svg x="'+f2(gx+cw+gap)+'" y="'+f2(y0+ch/2-th/2)+'" width="'+tw+'" height="'+th+'" viewBox="0 0 140 200" overflow="visible">'+d.tree+'</svg></g>';
  const py=y0+ch+74; o+='<g data-apart="pill">'+pill(d.pill,540,py,d.pillSize,F,{fill:'${CREAM}',padX:34,color:'${PEN}'})+'</g>';
  // the tiles: four white bubbles with the clothes' item art; RedNote: the game's zh-Hans name on a small pill under each
  const BS=${RN ? 180 : 190}, BG=${RN ? 64 : 48}, bx0=540-(4*BS+3*BG)/2, by=${RN ? 1392 : 1430};
  let t=''; d.tiles.forEach((it,i)=>{ const x=bx0+i*(BS+BG);
    // (the art is clipped to its square inside the bubble, so the bubble's own box is the tile's box)
    t+='<g><rect data-apart="tile'+i+'" x="'+f2(x)+'" y="'+by+'" width="'+BS+'" height="'+BS+'" rx="44" fill="#FFFFFF" stroke="${PEN}" stroke-width="6"/><svg x="'+f2(x+25)+'" y="'+(by+25)+'" width="140" height="140" viewBox="0 0 64 64" overflow="hidden">'+it.svg.replace(/^<svg[^>]*>/,'').replace(/<\\/svg>\\s*$/,'')+'</svg></g>';
    if(${RN}) t+='<g data-apart="label'+i+'">'+pill(it.zh,x+BS/2,by+BS+56,30,F,{fill:'${CREAM}',padX:14,color:'${PEN}'})+'</g>'; });
  // three sparkles in the pocket over the fireplace, right of Noodle
  const sp=[[858,706,26,SPARK.yellow],[948,652,18,SPARK.pink],[1004,724,15,SPARK.yellow]].map(([x,y,s,c],i)=>'<g data-apart="spark'+i+'" transform="translate('+x+' '+y+') rotate('+(i*18)+')">'+spark(0,0,s,c)+'</g>').join('');
  $('art').innerHTML='<g id="cdog" class="k${DKK}">'+d.dog+'</g>'+t+sp; $('ov').innerHTML=o;
  const s=$('cdog').querySelector('svg'); s.setAttribute('width',${240 * CK}); s.setAttribute('height',${200 * CK}); s.setAttribute('overflow','visible');
  // Noodle: the drawing (shown frame) and its shadow, his box centred on x ${CCX}, the shadow's foot on y ${CFOOT}
  s.setAttribute('x',0); s.setAttribute('y',f2(${CFOOT}-193*${CK}));
  const box=()=>{ let l=1e9,tp=1e9,r=-1e9,bt=-1e9; s.querySelectorAll('.pa-d-f${DKK} path,.pa-d-f${DKK} ellipse,.pa-d-f${DKK} circle,.pa-d-f${DKK} text,svg.pa-dog>g>ellipse,svg.pa-dog>g>path').forEach((e)=>{ const q=e.getBoundingClientRect(); if(!q.width&&!q.height) return; l=Math.min(l,q.left);tp=Math.min(tp,q.top);r=Math.max(r,q.right);bt=Math.max(bt,q.bottom); }); return [l,tp,r,bt]; };
  let nb=box(); s.setAttribute('x',f2(${CCX}-(nb[0]+nb[2])/2)); nb=box();
  let dl=1e9,dr=-1e9; s.querySelectorAll('.pa-d-f${DKK} path,.pa-d-f${DKK} ellipse,.pa-d-f${DKK} circle,.pa-d-f${DKK} text').forEach((e)=>{ const q=e.getBoundingClientRect(); if(!q.width&&!q.height) return; dl=Math.min(dl,q.left); dr=Math.max(dr,q.right); });
  $('chk').innerHTML='<rect data-apart="noodle" x="'+f2(nb[0])+'" y="'+f2(nb[1])+'" width="'+f2(nb[2]-nb[0])+'" height="'+f2(nb[3]-nb[1])+'" fill="none"/>'+Object.entries(d.props).filter(([k])=>k==='Cardboard_Fireplace').map(([k,b])=>'<rect data-apart="'+k+'" x="'+f2(b[0])+'" y="'+f2(b[1])+'" width="'+f2(b[2]-b[0])+'" height="'+f2(b[3]-b[1])+'" fill="none"/>').join('');
  const bad=[...centreCheck($('st')), ...apartCheck($('st'),28)];
  for(const e of $('st').querySelectorAll('#ov [data-apart],#art [data-apart],#chk [data-apart="noodle"]')){ const q=e.getBoundingClientRect(); if(q.left<40||q.right>1040||q.top<250||q.bottom>1670) bad.push('outside x 40..1040, y 250..1670: '+e.getAttribute('data-apart')+' '+[q.left,q.top,q.right,q.bottom].map(Math.round)); }
  return {bad, noodle:nb.map(Math.round), drawW:Math.round(dr-dl), title:[gx,y0,gx+cw,y0+ch].map(Math.round), pill:py}; };
</script>`;
    await p.setContent(cpage, { waitUntil: 'networkidle' });
    await p.evaluate(async () => { await document.fonts.load('700 120px Caveat'); await document.fonts.ready; });
    if (RN) { await p.evaluate((t) => document.fonts.load('700 60px "LXGW WenKai"', t), allText); if (!(await p.evaluate((t) => document.fonts.check('700 60px "LXGW WenKai"', t), allText))) throw new Error('LXGW WenKai did not load'); }
    const res = await p.evaluate((d) => window.cover(d), { head: CV.head, pill: CV.pill, pillSize: CV.pillSize, tiles: TILES, dog: draw[DK].svg, tree, props: PROPS });
    console.log('cover', JSON.stringify(res));
    if (res.bad.length) throw new Error('cover: ' + res.bad.join(' | '));
    const png = path.join(WORK, RN ? 'cover_rn.png' : 'cover.png'); await p.screenshot({ path: png });
    const f = RN ? path.join(__dirname, '..', '..', '..', 'rednote', 'rednote-25-holiday-dance.jpg') : path.join(OUT, 'holiday-dance-cover.jpg');
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, ...(RN ? ['-vf', 'crop=1080:1440:0:240'] : []), '-q:v', '2', f]);
    console.log('wrote', f, TILES.map((t) => t.n + ' = ' + t.zh).join(', ')); await b.close(); return; }

  if (process.env.ONLY === 'sprites') { // a sheet of every drawing used, at the Reel's drawing (k), on the room's floor colour
    const keys = [...new Set([...Array(BEATS).keys()].map((bb) => drawKey(LOOK_AT[bb], MOVE_AT(bb)) + '#' + MOVE_AT(bb).k))];
    await p.setContent(`<!doctype html><style>body{margin:0;background:#fff;display:grid;grid-template-columns:repeat(4,360px);font:14px sans-serif}${facts.dogCss}.pa-dog .pa-d-f0,.pa-dog .pa-d-f1,.pa-dog .pa-d-f2{animation:none!important;opacity:0!important}.k0 .pa-d-f0,.k1 .pa-d-f1,.k2 .pa-d-f2{opacity:1!important}.pa-dog{width:360px;height:300px}</style>`
      + keys.map((k) => { const [dk, kk] = k.split('#'); return `<div class="k${kk}" style="border:1px solid #ddd">${dk} k${kk}<br>${draw[dk].svg}</div>`; }).join(''));
    await p.screenshot({ path: path.join(WORK, 'sprites.png'), fullPage: true }); console.log('sprites', keys.length, path.join(WORK, 'sprites.png')); await b.close(); return; }

  await p.setContent(page, { waitUntil: 'networkidle' });
  await p.evaluate(async () => { await document.fonts.load('700 76px Caveat'); await document.fonts.ready; });
  if (RN) { const txt = LINE1.concat(LINE2).join(''); await p.evaluate((t) => document.fonts.load('700 80px "LXGW WenKai"', t), txt);
    if (!(await p.evaluate((t) => document.fonts.check('700 80px "LXGW WenKai"', t), txt))) throw new Error('LXGW WenKai did not load'); }
  const drawSvg = {}; for (const [k, v] of Object.entries(draw)) drawSvg[k] = v.svg;
  await p.evaluate((d) => window.setup(d), { bg, draw: drawSvg, props: PROPS, tree });

  const t0 = await freezeClock(p);
  await p.evaluate((t) => window.begin(t), t0);
  await stepClock(p, t0);
  const at = (n) => t0 + (n + 0.0001) * 1000 / FPS; // frame n, with the 0.0001 frame-index nudge
  const render = async (n, file) => { await stepClock(p, at(n));
    const err = await p.evaluate(() => window.checks());
    if (err) { if (process.env.SOFT) console.log('CHECK', n, err.slice(0, 400)); else throw new Error(err + ' at frame ' + n + ' ' + JSON.stringify(await p.evaluate(() => window.LAST))); }
    if (file) await p.screenshot({ path: file, animations: 'allow' }); };
  // the sparkles of a beat take their places on its first frame: a render that starts mid-beat steps through that frame first
  const primeTo = async (n) => { const nn = ((n % NF) + NF) % NF; let c = 0; for (let bb = 0; bb < BEATS; bb++) if (CUT[bb] <= nn) c = CUT[bb]; if (c !== nn) await stepClock(p, at(c)); };
  if (!process.env.CHECK && !process.env.ONLY && !process.env.ENCODE) {
    await render(0, path.join(WORK, 'loop0.png')); await primeTo(NF); await render(NF, path.join(WORK, 'loopN.png'));
    const same = fs.readFileSync(path.join(WORK, 'loop0.png')).equals(fs.readFileSync(path.join(WORK, 'loopN.png')));
    console.log('frame', NF, '=== frame 0:', same); if (!same) throw new Error('the loop does not close: frame ' + NF + ' differs from frame 0');
  }
  if (process.env.CHECK) { const ws = new Set(); for (let n = 0; n <= NF; n++) { await render(n); ws.add(await p.evaluate(() => window.DW)); }
    console.log('all', NF + 1, 'frames pass the checks; Noodle (the drawing) widths', Math.min(...ws), '..', Math.max(...ws), 'px'); await releaseClock(p); await b.close(); return; }
  if (process.env.ONLY === 'stills') {
    const ns = process.env.TS ? process.env.TS.split(',').map(Number) : CUT.slice(0, BEATS).map((c) => c + 4);
    for (const n of ns) { await primeTo(n); await render(n, path.join(WORK, 'stills', `s${String(n).padStart(3, '0')}.png`)); }
    console.log('stills in', path.join(WORK, 'stills')); await releaseClock(p); await b.close(); return; }
  let fr = process.env.ENCODE ? [] : [...Array(NF).keys()];
  if (process.env.FRAMES) { const [a, z] = process.env.FRAMES.split('-').map(Number); fr = fr.filter((i) => i >= a && i <= z); if (fr.length) await primeTo(fr[0]); }
  const tm = Date.now();
  for (const n of fr) { await render(n, path.join(WORK, 'f', `f${String(n).padStart(5, '0')}.png`)); if (n % 50 === 0) console.log('frame', n, '/', NF, ((Date.now() - tm) / 1000).toFixed(0) + ' s', JSON.stringify(await p.evaluate(() => window.LAST))); }
  await releaseClock(p);
  await b.close();

  // ---- sound: none of ours. The posting file gets a digitally silent stereo AAC track (so every editor and Instagram's "Use audio" see a normal
  // audio stream with nothing in it); the beat-check file gets a soft click on every beat at the exact 85 BPM times (louder on beat 1 of a bar) ----
  const T = NF / FPS, Ts = T.toFixed(4), SR = 48000;
  const silent = path.join(WORK, 'silent.wav'), clicks = path.join(WORK, 'clicks.wav');
  const wav = (file, samples) => { const n = samples.length, buf = Buffer.alloc(44 + n * 4); buf.write('RIFF', 0); buf.writeUInt32LE(36 + n * 4, 4); buf.write('WAVEfmt ', 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(2, 22); buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 4, 28); buf.writeUInt16LE(4, 32); buf.writeUInt16LE(16, 34); buf.write('data', 36); buf.writeUInt32LE(n * 4, 40);
    for (let i = 0; i < n; i++) { const v = Math.max(-32767, Math.min(32767, Math.round(samples[i] * 32767))); buf.writeInt16LE(v, 44 + i * 4); buf.writeInt16LE(v, 46 + i * 4); } fs.writeFileSync(file, buf); };
  const NS = Math.round(T * SR);
  wav(silent, new Float32Array(NS));
  const cl = new Float32Array(NS);
  for (let bb = 0; bb < BEATS; bb++) { const s0 = Math.round(bb * SPB * SR), down = bb % BAR === 0, f = down ? 1320 : 990, a = down ? 0.32 : 0.18;
    for (let i = 0; i < 0.06 * SR && s0 + i < NS; i++) { const tt = i / SR; cl[s0 + i] += a * Math.sin(2 * Math.PI * f * tt) * Math.exp(-tt / 0.012) * Math.min(1, i / 24); } }
  wav(clicks, cl);
  const enc = (audio, mp4, br) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', audio, '-map', '0:v', '-map', '1:a',
    // keyframes on the first AND the last frame (one GOP between), as momiji: the seam is coded like any other frame step
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '16', '-x264-params', `keyint=${NF}:min-keyint=1`, '-force_key_frames', `0,${((NF - 1) / FPS).toFixed(4)}`, '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', br || '128k', '-ar', String(SR), '-ac', '2', '-movflags', '+faststart', '-t', Ts, mp4], { stdio: 'inherit' });
  const mp4 = path.join(OUT, RN ? 'doodle-doggo-holiday-dance-rednote.mp4' : 'doodle-doggo-holiday-dance.mp4'), mp4b = path.join(OUT, 'doodle-doggo-holiday-dance-beatcheck.mp4');
  if (RN) { // the lo-fi cut's music, as it is (lofi_dougie.js: 4 bars at 85 BPM, beat 1 on frame 0, seamless, -16 LUFS)
    const MUSIC = path.resolve(process.env.MUSIC || ''); if (!process.env.MUSIC || !fs.existsSync(MUSIC)) throw new Error('MUSIC=<lofi_dougie.js workdir>/music.wav is needed for the RedNote cut');
    const ns = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=duration_ts,sample_rate', '-of', 'csv=p=0', MUSIC]).toString().split(',')[1];
    if (ns !== Math.round(T * SR)) throw new Error('the music is ' + ns + ' samples, not the loop\'s ' + Math.round(T * SR));
    enc(MUSIC, mp4, '192k');
    const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', mp4, '-vn', '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, ln = JSON.parse(r.slice(r.lastIndexOf('{')));
    console.log('RedNote cut audio: I', ln.input_i, 'LUFS, TP', ln.input_tp, 'dBTP'); if (Math.abs(+ln.input_i + 16) > 0.5 || +ln.input_tp > -1) throw new Error('loudness off');
  } else { enc(silent, mp4); enc(clicks, mp4b); }
  for (const f of RN ? [mp4] : [mp4, mp4b]) { const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString(); console.log('wrote', f, d.toFixed(3) + ' s', (fs.statSync(f).size / 1e6).toFixed(2) + ' MB'); }
  // the posting file's audio must be silent: its peak
  if (!RN) { const vd = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', mp4, '-af', 'volumedetect', '-vn', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; const mx = /max_volume: (-?[\d.]+|-inf) dB/.exec(vd);
  console.log('posting file audio max_volume', mx ? mx[1] : '?', 'dB'); if (!mx || (mx[1] !== '-inf' && +mx[1] > -90)) throw new Error('the posting file is not silent'); }

  // ---- checkFrames on the whole loop and the seam ----
  const cf = checkFrames(mp4, 0, NF - 1);
  const seam = JSON.parse(cp.execFileSync('python3', ['-c', `import cv2,numpy as np,json,sys
c=cv2.VideoCapture(sys.argv[1]);fs=[]
while True:
  ok,f=c.read()
  if not ok: break
  fs.append(cv2.cvtColor(f,cv2.COLOR_BGR2GRAY).astype(np.float32))
print(json.dumps({'n':len(fs),'seam':round(float(np.abs(fs[0]-fs[-1]).mean()),2)}))`, mp4], { encoding: 'utf8' }));
  // a jump is allowed only on a beat's first frame (a new drawing: pose, face or look). Every other frame is smooth motion.
  const cut = (i) => CUT.includes(i), plain = cf.diffs.filter((x) => !cut(x[0])).map((x) => x[1]), cuts = cf.diffs.filter((x) => cut(x[0])).map((x) => x[1]);
  const pm = plain.slice().sort((a, z) => a - z)[plain.length >> 1];
  const res = { frames: seam.n, median: cf.median, doubled: cf.doubled, jumps: cf.jumps, jumpsOffBeat: cf.jumps.filter((i) => !cut(i)), plainMedian: pm, plainMin: Math.min(...plain), plainMax: Math.max(...plain),
    beatCuts: cuts.length + 1, cutMin: Math.min(...cuts), cutMax: Math.max(...cuts), seam: seam.seam, seamToMedian: +(seam.seam / cf.median).toFixed(2), cutFrames: CUT };
  console.log('checkFrames 0..' + (NF - 1), JSON.stringify(res));
  fs.writeFileSync(path.join(WORK, 'checkframes.json'), JSON.stringify(res, null, 1));
  if (cf.doubled.length || res.jumpsOffBeat.length || seam.n !== NF || res.plainMin < 0.1 * pm) throw new Error('the frame check failed: ' + JSON.stringify(res));
  // the seam is beat 1's cut (beat 16 -> beat 1: a new pose): it must look like the other beat cuts, not bigger
  if (res.seam > res.cutMax * 1.05) throw new Error('the seam is bigger than every beat cut: ' + JSON.stringify(res));
})().catch((e) => { console.error(e); process.exit(1); });
