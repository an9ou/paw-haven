// YouTube lo-fi loop "rainy evening" (owner, 7 Nov 2026: "a looped lofi music video for posting on YouTube. You can choose the dog/dogs, place,
// movements, in around 30 s first"). A 30 s 16:9 loop (1920 x 1080, 30 fps) that repeats seamlessly, to be tiled into a long "lofi beats to relax"
// video later: frame 900 would be frame 0 again (checked), and the music is a seamless 10-bar loop (./cozy_lofi.js).
// The shot: the game's Cozy House living room at night in the rain (PawArt.scene('house', night, rain), the built-in bed left out, no game UI).
// Pickle the Jack Russell sits up on the back of the sofa in front of the rainy window (dogs do), Scone the Cavalier sleeps in the Cloud Bed
// (PawArt.bed) on the bed rug. Real game art only: the dogs are PawArt.dog with the game's own 3-frame line boil (one frame each 1/3 s); the
// little moves are the game's own pose parts set per frame through a hook in frame() (the head turned about its neck join with the game's own
// XA.tilt, the ears 'perk', the eyes 'closed', the 'yawn' mouth, the tail angle, the 'curious' face), so every dog stays in one piece and every
// fill stays inside its line. Nothing is redrawn.
// What moves, all periodic in 30 s (every period divides 30 s):
//   Pickle: blinks (one double), ear twitches, one slow yawn (8.0-10.6 s), and at 19.6 s a big raindrop lands on the glass by his nose: he tilts his
//   head ('curious', 20.2-22.4 s). Scone: slow breathing (3.75 s a breath), two ear flicks, two tail thumps, the game's sleep z's floating up
//   (Gloria Hallelujah, the face the game draws its z's in).
//   Rain behind the glass at three depths (falls a whole number of times per loop), drops on the glass that sit and then run down, the floor
//   lamp's glow breathing slowly (three slow sines), steam from the kettle in the kitchen, warm dust motes at three depths (depth of field), a
//   soft night vignette, a very slow camera drift and push that returns to its start (period 30 s).
// The dogs never touch: each dog's group is data-apart and apartCheck() (../../instagram/launch/centre_text.js) runs on every frame.
// No words on screen; the Doodle Doggo logo small in the bottom-left corner. No end card (it is a loop).
//   SRC=<repo root with the art and mods/pawaudio.js> (the Cavalier and the Jack Russell are v2.21 breeds: until main is merged into
//   marketing/launch, point SRC at a worktree of main), default this repo.
//   NODE_PATH=$(npm root -g) SRC=... node brand/youtube/lofi/build_lofi.js <workdir>
//   ONLY=stills: key frames + contact sheet (WORK/stills). ONLY=frames: frames only. FRAMES=a-b: re-render only those frames over an earlier
//   workdir and encode again with the same sound (marketing rule). PAR=n: n child processes over slices of the frames.
//   THUMB=1: (re)write the 1280 x 720 thumbnail lofi-rainy-evening-thumb.jpg (written anyway when missing).
//   LONG=<minutes>: after the encode, also tile the loop into a long test file WORK/rainy-evening-<n>min.mp4 (video stream copied, the audio
//   re-encoded from the tiled loop wav so no AAC padding sits at the joins).
// Output next to this file: rainy-evening-loop-30s.mp4 (H.264 + AAC 192k, -16 LUFS, TP -1.5), lofi-rainy-evening-thumb.jpg.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../../instagram/launch/centre_text.js');
const { cozyLoop } = require('./cozy_lofi.js');
const ROOT = path.join(__dirname, '..', '..', '..'), OUT = __dirname, SRC = path.resolve(process.env.SRC || ROOT);
const WORK = path.resolve(process.argv[2] || '/tmp/lofi_rainy');
const W = 1920, H = 1080, FPS = 30, T = 30, NF = T * FPS, TAU = Math.PI * 2;
for (const d of ['f', 'bg', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });

// ---- the game's art, loaded like the game loads it, with one hook in the dog's frame(): the pose parts this video sets per frame ----
const win = {}, ctx = { window: win, console, Intl }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', ...'abcdefg'.split('').map((c) => `world/pawart_world_${c}.js`)]) { const p = path.join(SRC, f); if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf8');
  if (f.startsWith('dogs/')) { const A = 'L=layout(s,pose,k);'; if (s.split(A).length !== 2) throw new Error('pawart_dogs.js changed: no single ' + A);
    s = s.replace(A, A + 'if(globalThis.__DDOV)globalThis.__DDOV(L,pose,k,s,key,{XA});'); }
  vm.runInContext(s, ctx); }
// P: { tilt (deg, the game's XA.tilt: + tips the nose down, - lifts it), ears, eyes, mouth, tailD (deg), noZ (the sleep pose's own static z's off) }
ctx.__DDOV = (L, pose, k, s, key, X) => { const P = ctx.__DDP; if (!P) return; if (P.tilt) X.XA.tilt(s, L, P.tilt); if (P.ears) L.ears = P.ears;
  if (P.eyes) L.face.eyes = P.eyes; if (P.mouth) L.face.mouth = P.mouth; if (P.tailD) L.tailA += P.tailD; if (P.noZ) L.zz = 0; };
const PA = win.PawArt;
if (!PA.dog('cavalier', {}).includes('Scone') || !PA.dog('jrt', {}).includes('Pickle')) throw new Error('no Cavalier / Jack Russell in ' + SRC + ' (set SRC to a main worktree)');
const INK = '#5B3D32', CREAM = '#FFFDF7', PAPER = '#FFF8EC';
const inner = (svg) => svg.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const f1 = (n) => Math.round(n * 10) / 10, f2 = (n) => Math.round(n * 100) / 100, r3 = (n) => Math.round(n * 1000) / 1000;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const md = (x, m) => ((x % m) + m) % m;
const S = (t, n, ph = 0) => Math.sin(TAU * n * t / T + ph); // a sine with n whole periods in the loop
// cut whole elements out of an SVG string: every <g> whose open tag matches re, with all it holds (balanced)
function dropG(svg, re) { let out = '', i = 0; for (;;) { const m = re.exec(svg.slice(i)); if (!m) return out + svg.slice(i);
  const j = i + m.index; out += svg.slice(i, j); const tg = /<g[\s>]|<\/g>/g; tg.lastIndex = j; let d = 0, e;
  while ((e = tg.exec(svg))) { d += e[0] === '</g>' ? -1 : 1; if (!d) break; } i = e ? e.index + 4 : svg.length; } }
const clean = (svg) => dropG(svg, /<g data-(?:hot|shop|area)=/).replace(/<path class="pa-wa-hl"[^>]*\/>/g, '');
const SCENE = { time: 'night', weather: 'rain', season: 'autumn', halloween: false, jp: false, v215: true, bed: false };

// ---- the room (scene units = the 1000 x 600 scene; the room's wall art is drawn at matrix(.86 0 0 .86 70 0) inside the scene) ----
const RM = (x, y) => [f2(0.86 * x + 70), f2(0.86 * y)];
const GLASS = { x0: RM(350, 0)[0], x1: RM(570, 0)[0], y0: RM(0, 80)[1], y1: RM(0, 250)[1] }; // the window glass
// what shows of the glass between the curtains (their inner edges from the game's O.window, inset 3 for the crayon line), and the bars to skip
const curtL = [RM(420.4, 81), RM(389.6, 156.5), RM(407.2, 233)].map(([x, y]) => [x + 3.2, y]), curtR = [RM(499.6, 81), RM(530.4, 156.5), RM(512.8, 233)].map(([x, y]) => [x - 3.2, y]);
const GLASS_PATH = `M${curtL[0]}L${curtL[1]}L${curtL[2][0]} ${f2(curtL[2][1] + 3)}L${f2(GLASS.x0 + 2.5)} ${f2(curtL[2][1] + 3)}L${f2(GLASS.x0 + 2.5)} ${f2(GLASS.y1 - 2.5)}`
  + `L${f2(GLASS.x1 - 2.5)} ${f2(GLASS.y1 - 2.5)}L${f2(GLASS.x1 - 2.5)} ${f2(curtR[2][1] + 3)}L${curtR[2][0]} ${f2(curtR[2][1] + 3)}L${curtR[1]}L${curtR[0]}Z`;
const BARX = RM(460, 0)[0], BARY = RM(0, 165)[1], ROD = RM(0, 82)[1];
const LAMP = { x: 620, y: f2(368 - 232 * 0.92), floor: [620, 368] }; // the v2.15 floor lamp (a floor prop, unscaled)
const SOFA_TOP = RM(0, 286)[1];       // the top of the sofa's back
const KETTLE = [874, 199];            // the kettle's spout in the kitchen corner (drawn unscaled, 62 up)
const BED = { name: 'Cloud Bed', x: 742, y: 514, B: 0.86 };   // on the bed rug, where the game puts the dog bed
const PICKLE = { key: 'jrt', x: 502, y: SOFA_TOP + 2.5, D: 0.8, facing: 'left' };
const SCONE = { key: 'cavalier', facing: 'left' };

// ---- the camera: a 16:9 view (scene units), a very slow drift and push that comes back to its start every 30 s ----
const CAM0 = { x: 90, y: 40, w: 880 };
const camAt = (t) => { const push = 10 * (1 - Math.cos(TAU * t / T)) / 2, w = CAM0.w - push;
  const v = { x: CAM0.x + push * 0.55 + 7 * S(t, 1), y: CAM0.y + push * 0.3 + 3 * S(t, 2, 0.6), w }; v.h = v.w * H / W; v.k = W / v.w; return v; };
const R = Math.ceil(W / (CAM0.w - 10) * 10) / 10; // the background render's scale: never scaled up
for (let i = 0; i <= 60; i++) { const v = camAt(i / 2); if (v.x < 0 || v.y < 0 || v.x + v.w > 1000 || v.y + v.h > 600) throw new Error('view off the scene at ' + i / 2); }

// ---- Pickle's and Scone's little moves (times in s inside the 30 s loop) ----
const BLINKS = [1.6, 6.2, 12.4, 12.75, 17.0, 24.9, 28.3], BLINK = 0.14;
const PTWITCH = [4.3, 15.1, 27.0, 27.25], TWITCH = 0.17;
const YAWN = { a: 8.0, open: 8.4, close: 10.0, b: 10.6 };
const HIT = { t: 19.6, x: RM(406, 0)[0], y: RM(0, 196)[1] };         // the big drop on the glass by Pickle's nose
const TILT = { a: 19.85, on: 20.2, off: 22.4, b: 22.8 };
const STWITCH = [6.4, 6.62, 19.5], THUMPS = [[12.0, 2], [25.4, 1]], BREATH = 3.75;
const inAny = (t, list, d) => list.some((a) => t >= a && t < a + d);
function pickleP(t) { const P = {}; let expr;
  if (t >= YAWN.a && t < YAWN.b) { P.tilt = -11 * sm(seg(t, YAWN.a, YAWN.open + 0.2)) * (1 - sm(seg(t, YAWN.close, YAWN.b)));
    if (t >= YAWN.open && t < YAWN.close) { P.mouth = 'yawn'; P.eyes = 'closed'; } }
  if (t >= TILT.a && t < TILT.b) { const q = sm(seg(t, TILT.a, TILT.on)) * (1 - sm(seg(t, TILT.off, TILT.b)));
    if (t >= TILT.on && t < TILT.off) { expr = 'curious'; P.tilt = 9 * q - 9; } else P.tilt = 9 * q; } // 'curious' tilts the head 9 itself
  if (!expr && inAny(t, BLINKS, BLINK)) P.eyes = 'closed';
  if (!expr && inAny(t, PTWITCH, TWITCH)) P.ears = 'perk';
  if (P.tilt != null) P.tilt = Math.round(P.tilt * 4) / 4;
  return { pose: 'sit', expr, P }; }
function sconeP(t) { const P = { noZ: 1 };
  if (inAny(t, STWITCH, 0.12)) P.ears = 'perk';
  for (const [a, n] of THUMPS) if (t >= a && t < a + n * 0.45) P.tailD = Math.round(38 * Math.max(0, Math.sin(Math.PI * (t - a) / 0.45)));
  return { pose: 'sleep', P }; }
const breath = (t) => (1 - Math.cos(TAU * t / BREATH)) / 2;

// ---- dog markup: the game's dog with only the line-boil frame on screen ----
const dogCache = {};
function dogSVG(key, pose, expr, facing, P, fr) { const k = [key, pose, expr, facing, JSON.stringify(P), fr].join('|'); if (dogCache[k]) return dogCache[k];
  ctx.__DDP = P; let s; try { s = PA.dog(key, { pose, expr, anim: true, facing }); } finally { ctx.__DDP = null; }
  if (/<g transform="translate\(1\d\d(\.\d+)? 1\d\d\) scale/.test(s.slice(0, 600))) throw new Error('the dog was shrunk to fit its canvas: ' + k);
  return dogCache[k] = dropG(inner(s), new RegExp(`<g class="pa-d-f[${[0, 1, 2].filter((x) => x !== fr).join('')}]">`)); }
const BED_SVG = inner(PA.bed(BED.name)), BED_FRONT = (() => { const s = PA.bed(BED.name), j = s.indexOf('<g class="pa-bed-front"'); // the lip drawn over the sleeping dog, as the game does
  const tg = /<g[\s>]|<\/g>/g; tg.lastIndex = j; let d = 0, e; while ((e = tg.exec(s))) { d += e[0] === '</g>' ? -1 : 1; if (!d) break; } return s.slice(j, e.index + 4); })();
let M = null; // measured in the page: the sit and sleep boxes on the 240 x 200 dog canvas, the bed's front lip
const boxOf = (pose, facing) => { const b = M.box[pose]; return facing === 'left' ? [240 - b[0] - b[2], b[1], b[2], b[3]] : b; };
function placeBed(facing, bd = BED) { const L = M.lip, b = boxOf('sleep', facing), k = Math.min(1, 0.78 * L[2] / b[2]), sc = bd.B * k;
  const bx0 = bd.x - 130 * bd.B, by0 = bd.y - 152 * bd.B, bottom = by0 + (L[1] + 0.14 * b[3] * k) * bd.B;
  const x = bx0 + (L[0] + L[2] / 2) * bd.B - (b[0] + b[2] / 2) * sc, y = bottom - (b[1] + b[3]) * sc;
  return { x, y, sc, foot: [x + (b[0] + b[2] / 2) * sc, y + (b[1] + b[3]) * sc], head: [x + (b[0] + b[2] * (facing === 'left' ? 0.18 : 0.82)) * sc, y + (b[1] + b[3] * 0.35) * sc] }; }
function placeSit(d) { const b = boxOf('sit', d.facing), sc = d.D; return { x: d.x - (b[0] + b[2] / 2) * sc, y: d.y - 188 * sc, sc }; }

// ---- rain behind the glass (3 depths), drops on the glass, the big drop, steam, motes ----
let sd = 7; const rr = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
const RAIN_SPAN = GLASS.y1 - GLASS.y0 + 60;
const RAIN = [ // depth: n = whole falls per loop (speed), len, width, opacity, parallax lag
  { n: 70, len: 10, w: 1.0, op: 0.45, lag: 0.45, col: '#B4C2E2', count: 40 },
  { n: 105, len: 16, w: 1.4, op: 0.6, lag: 0.25, col: '#CCD8F0', count: 24 },
  { n: 150, len: 26, w: 2.0, op: 0.7, lag: 0.08, col: '#E2EAF8', count: 12 }].map((L) => ({ ...L,
  drops: Array.from({ length: L.count }, () => ({ x: GLASS.x0 - 20 + rr() * (GLASS.x1 - GLASS.x0 + 40), ph: rr() })) }));
const SLANT = 0.16;
function rainLayer(t, v) { let g = '';
  for (const L of RAIN) { let d = ''; const ox = (v.x - CAM0.x) * L.lag;
    for (const r of L.drops) { const q = md(r.ph + L.n * t / T, 1), y = GLASS.y0 - 40 + q * RAIN_SPAN, x = r.x + ox + (y - GLASS.y0) * SLANT;
      d += `M${f1(x)} ${f1(y)}l${f1(L.len * SLANT)} ${L.len}`; }
    g += `<path d="${d}" stroke="${L.col}" stroke-width="${L.w}" stroke-linecap="round" opacity="${L.op}" fill="none"/>`; }
  return g; }
// drops on the glass: each appears, sits, then runs down and fades; period P (divides 30)
const GD = Array.from({ length: 16 }, (_, i) => { const P = [7.5, 10, 15, 6, 30][i % 5], y0 = GLASS.y0 + 8 + rr() * 70;
  return { x: GLASS.x0 + 8 + rr() * (GLASS.x1 - GLASS.x0 - 16), y0, P, ph: rr() * P, sit: 1.2 + rr() * 2.4, run: 1.4 + rr() * 1.6, r: 1.7 + rr() * 1.6 }; });
GD.push({ x: HIT.x, y0: HIT.y, P: 30, ph: HIT.t, sit: 1.6, run: 2.6, r: 3.6, hit: 1 }); // the big one by Pickle's nose
const drop = (x, y, r, op) => `<g opacity="${r3(op)}"><ellipse cx="${f2(x)}" cy="${f2(y)}" rx="${f2(r)}" ry="${f2(r * 1.18)}" fill="#D8ECFA" stroke="#7F93BE" stroke-width="0.7"/>`
  + `<ellipse cx="${f2(x - r * 0.32)}" cy="${f2(y - r * 0.4)}" rx="${f2(r * 0.3)}" ry="${f2(r * 0.36)}" fill="#FFFFFF"/></g>`;
function glassDrops(t) { let g = '';
  for (const d of GD) { const u = md(t - d.ph, d.P), life = d.sit + d.run + 0.4; if (u > life) continue;
    const fin = sm(u / 0.25), ru = seg(u, d.sit, d.sit + d.run), y = d.y0 + 46 * (ru * ru * (3 - 2 * ru)) * (d.hit ? 0.9 : 1), fo = 1 - sm(seg(u, d.sit + d.run, life));
    if (ru > 0) g += `<path d="M${f2(d.x)} ${f2(d.y0 + 2)}L${f2(d.x + 0.6)} ${f2(y - d.r)}" stroke="#C9DDF2" stroke-width="${f2(d.r * 0.55)}" stroke-linecap="round" opacity="${r3(0.55 * fo)}"/>`;
    g += drop(d.x, y, d.r * (d.hit ? 0.75 + 0.25 * sm(u / 0.12) : 1), 0.9 * fin * fo);
    if (d.hit && u < 0.6) { const q = u / 0.6; g += `<ellipse cx="${f2(d.x)}" cy="${f2(d.y0)}" rx="${f2(4 + 12 * q)}" ry="${f2(3 + 9 * q)}" fill="none" stroke="#E6F2FC" stroke-width="${f2(1.6 * (1 - q) + 0.3)}" opacity="${r3(0.9 * (1 - q))}"/>`; } }
  return g; }
// steam from the kettle: three soft wisps, one every 2 s, each rising 6 s (period 6 s)
function steam(t) { let g = '';
  for (let j = 0; j < 3; j++) { const u = md(t - j * 2, 6) / 6, x = KETTLE[0] - 4 - 26 * u + 5 * Math.sin(u * 7 + j), y = KETTLE[1] - 4 - 70 * u, s = 0.6 + 1.1 * u;
    const op = 0.75 * sm(u / 0.08) * (1 - sm(seg(u, 0.5, 1)));
    g += `<path d="M${f1(x)} ${f1(y + 10 * s)}c${f1(-6 * s)} ${f1(-4 * s)} ${f1(6 * s)} ${f1(-8 * s)} 0 ${f1(-14 * s)}c${f1(-5 * s)} ${f1(-4 * s)} ${f1(4 * s)} ${f1(-7 * s)} ${f1(1 * s)} ${f1(-11 * s)}" fill="none" stroke="#FFFFFF" stroke-width="${f1(3.2 * s)}" stroke-linecap="round" opacity="${r3(op)}" filter="url(#soft)"/>`; }
  return g; }
// the lamp's glow, breathing slowly (three whole-period sines)
const lampK = (t) => 1 + 0.10 * S(t, 2) + 0.05 * S(t, 7, 1.1) + 0.03 * S(t, 13, 2.3);
// warm dust motes in the lamp light at three depths (screen units; far small and sharp, near big and soft), drifting on whole-period paths
const MOTES = Array.from({ length: 22 }, (_, i) => { const d = i % 3; return { d, x: 380 + rr() * 1100, y: 80 + rr() * 820, r: [2.6, 5, 13][d] * (0.8 + rr() * 0.5),
  ax: 20 + rr() * 40, ay: 30 + rr() * 50, nx: 1 + (i % 2), ny: 1 + ((i >> 1) % 2), ph: rr() * 6.3, op: [0.55, 0.4, 0.22][d], par: [1.15, 1.4, 1.9][d] }; });
function motes(t, v) { let g = ''; const cx = (v.x - CAM0.x) * v.k, cy = (v.y - CAM0.y) * v.k;
  for (const d of [0, 1, 2]) { let l = '';
    for (const m of MOTES) if (m.d === d) { const x = m.x + m.ax * S(t, m.nx, m.ph) - cx * (m.par - 1), y = m.y + m.ay * S(t, m.ny, m.ph * 1.7) - cy * (m.par - 1);
      l += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(m.r)}" fill="#FFE9B8" opacity="${r3(m.op * (0.75 + 0.25 * S(t, 3 + d, m.ph)))}"/>`; }
    g += `<g filter="url(#dof${d})">${l}</g>`; }
  return g; }
// the game's sleep z's, floating up from Scone's head: one every 2.5 s, each 5 s (period 7.5 s)
function zzz(t, head) { let g = '';
  for (let j = 0; j < 3; j++) { const q = md(t - j * 2.5, 7.5) / 5; if (q > 1) continue;
    const x = head[0] - 6 - q * 34 + Math.sin(q * 5 + j) * 4, y = head[1] - 14 - q * 70, sz = 15 + 12 * q, op = Math.min(sm(q * 4), 1 - sm(seg(q, 0.6, 1)));
    g += `<text x="${f1(x)}" y="${f1(y)}" transform="rotate(${f1(-10 - 6 * q)} ${f1(x)} ${f1(y)})" font-family="'Gloria Hallelujah',cursive" font-size="${f1(sz)}" fill="${INK}" opacity="${r3(op)}">${j % 2 ? 'z' : 'Z'}</text>`; }
  return g; }

const DEFS = `<defs>${[0.6, 2.2, 6].map((s, d) => `<filter id="dof${d}" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="${s}"/></filter>`).join('')}`
  + '<filter id="soft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="1.6"/></filter>'
  + `<mask id="glass" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="600"><path d="${GLASS_PATH}" fill="#fff"/>`
  + `<path d="M${BARX} ${GLASS.y0}V${GLASS.y1}M${GLASS.x0} ${BARY}H${GLASS.x1}M${GLASS.x0} ${ROD}H${GLASS.x1}" stroke="#000" stroke-width="5.5"/></mask>`
  + '<radialGradient id="lampg"><stop offset="0" stop-color="#FFDFA0" stop-opacity=".5"/><stop offset=".35" stop-color="#F6C27A" stop-opacity=".22"/><stop offset="1" stop-color="#F6C27A" stop-opacity="0"/></radialGradient>'
  + '<radialGradient id="vig" cx="0.5" cy="0.45" r="0.75"><stop offset="0.4" stop-color="#151830" stop-opacity="0"/><stop offset="1" stop-color="#151830" stop-opacity=".6"/></radialGradient>'
  + '<radialGradient id="cool" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#9FB4E8" stop-opacity=".16"/><stop offset="1" stop-color="#9FB4E8" stop-opacity="0"/></radialGradient></defs>';

function frameSVG(t, opt = {}) {
  const v = opt.cam || camAt(t), fr = Math.floor(t * 3 + 1e-9) % 3, L = lampK(t);
  // Scone in the Cloud Bed (bed, dog, the bed's front lip), breathing about his belly line
  const BD = opt.bed || BED, sp = placeBed(SCONE.facing, BD), sq = sconeP(t), bth = breath(t), bx = 1 + 0.006 * bth, by = 1 + 0.024 * bth;
  const scone = `<g data-apart="scone"><g transform="translate(${f2(sp.foot[0])} ${f2(sp.foot[1])}) scale(${r3(bx)} ${r3(by)}) translate(${f2(-sp.foot[0])} ${f2(-sp.foot[1])})">`
    + `<g transform="translate(${f2(sp.x)} ${f2(sp.y)}) scale(${r3(sp.sc)})">${dogSVG(SCONE.key, sq.pose, undefined, SCONE.facing, sq.P, fr)}</g></g></g>`;
  const bedAt = (s) => `<svg x="${f2(BD.x - 130 * BD.B)}" y="${f2(BD.y - 152 * BD.B)}" width="${f2(260 * BD.B)}" height="${f2(160 * BD.B)}" viewBox="0 0 260 160" overflow="visible">${s}</svg>`;
  const pq = pickleP(t), pp = placeSit(PICKLE);
  const pickle = `<g data-apart="pickle"><g transform="translate(${f2(pp.x)} ${f2(pp.y)}) scale(${r3(pp.sc)})">${dogSVG(PICKLE.key, pq.pose, pq.expr, PICKLE.facing, pq.P, fr)}</g></g>`;
  let g = `<g mask="url(#glass)"><rect x="${GLASS.x0}" y="${GLASS.y0}" width="${f2(GLASS.x1 - GLASS.x0)}" height="${f2(GLASS.y1 - GLASS.y0)}" fill="#1E2540" opacity=".18"/>${rainLayer(t, v)}${glassDrops(t)}</g>`;
  g += `<ellipse cx="${f2((GLASS.x0 + GLASS.x1) / 2)}" cy="${f2(GLASS.y1 + 60)}" rx="170" ry="90" fill="url(#cool)"/>`; // a little cool window light on the sofa
  g += bedAt(BED_SVG) + scone + bedAt(BED_FRONT) + pickle + zzz(t, sp.head) + steam(t);
  // the evening: a soft navy wash over the room, then the lamp's light on top of it (screen blend), the vignette
  const cam = `translate(${f2(-v.x * v.k)} ${f2(-v.y * v.k)}) scale(${r3(v.k)})`;
  const lamp = `<g transform="${cam}" style="mix-blend-mode:screen"><circle cx="${LAMP.x}" cy="${LAMP.y}" r="${f1(230 * (0.97 + 0.03 * L))}" fill="url(#lampg)" opacity="${r3(Math.min(1, 0.95 * L))}"/>`
    + `<ellipse cx="${LAMP.floor[0]}" cy="${f2(LAMP.floor[1] + 3)}" rx="95" ry="16" fill="url(#lampg)" opacity="${r3(0.7 * L)}"/></g>`;
  const wash = `<rect width="${W}" height="${H}" fill="#1E2340" opacity=".24"/>`, vig = `<rect width="${W}" height="${H}" fill="url(#vig)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${DEFS}<g transform="${cam}">${g}</g>${wash}${lamp}${vig}${motes(t, v)}${opt.extra || ''}</svg>`;
}
const LOGO_SVG = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<title>[^<]*<\/title>/, ''));
const logoAt = (lx, ly, lw, op = 0.92) => { const lh = lw * 280 / 900;
  return `<g opacity="${op}"><defs><clipPath id="lgc"><rect x="${lx}" y="${ly}" width="${lw}" height="${f1(lh)}" rx="${f1(lh * 0.22)}"/></clipPath></defs><g clip-path="url(#lgc)"><svg x="${lx}" y="${ly}" width="${lw}" height="${f1(lh)}" viewBox="0 0 900 280">${LOGO_SVG}</svg></g>`
    + `<rect x="${lx}" y="${ly}" width="${lw}" height="${f1(lh)}" rx="${f1(lh * 0.22)}" fill="none" stroke="${INK}" stroke-width="3"/></g>`; };
const LOGO_CORNER = logoAt(44, H - 40 - 190 * 280 / 900, 190, 0.9);

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Gloria+Hallelujah&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:#2A2E44}#st{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:#2A2E44}#bg{position:absolute;left:0;top:0;transform-origin:0 0}#sv{position:absolute;left:0;top:0}svg{display:block}</style>
<div id="st"><img id="bg"><div id="sv"></div></div><span style="font:20px 'Gloria Hallelujah'">z</span><span style="font:700 20px Caveat">a</span>
<script>
${CENTRE_JS}
${SAFE_JS}
window.frame=async function(f){ const im=document.getElementById('bg');
  if(im.dataset.src!==f.bg){ im.dataset.src=f.bg; im.src='file://'+f.bg; await im.decode(); }
  im.style.transform='translate('+f.x+'px,'+f.y+'px) scale('+f.s+')';
  document.getElementById('sv').innerHTML=f.svg;
  const st=document.getElementById('st'); const bad=apartCheck(st); if(bad.length) return 'dogs too close: '+bad.join('; ');
  if(f.dogs!==st.querySelectorAll('[data-apart]').length) return 'a dog is missing';
  const c=centreCheck(st); if(c.length) return 'not centred: '+c.join('; ');
  return '';
};
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'] });
  // the room, once (kept in WORK/bg, so a FRAMES re-render uses the same image)
  const bgF = path.join(WORK, 'bg', `house_night_rain_${R}.png`);
  if (!fs.existsSync(bgF)) { const svg = clean(PA.scene('house', SCENE)), vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/), sw = +vb[1], sh = +vb[2];
    const c = await b.newContext({ viewport: { width: sw, height: sh }, deviceScaleFactor: R }), q = await c.newPage();
    await q.setContent(`<style>html,body{margin:0}svg{display:block;width:${sw}px;height:${sh}px}</style>${svg}`); await q.waitForTimeout(150);
    await q.screenshot({ path: bgF, clip: { x: 0, y: 0, width: sw, height: sh } }); await c.close(); console.log('bg', path.basename(bgF)); }

  const p = await b.newPage({ viewport: { width: W, height: H } });
  const pageFile = path.join(WORK, `page_${process.pid}.html`); // one per process: PAR children must not rewrite each other's page while it loads
  fs.writeFileSync(pageFile, html);
  await p.goto('file://' + pageFile); await p.waitForLoadState('networkidle');
  await p.evaluate(() => Promise.all(["20px 'Gloria Hallelujah'", '700 40px Caveat'].map((f) => document.fonts.load(f, 'Zz? rainy evening lofi'))));
  const fontsOk = await p.evaluate(() => document.fonts.check("20px 'Gloria Hallelujah'", 'Zz') && document.fonts.check('700 40px Caveat', 'a'));
  if (!fontsOk) throw new Error('fonts did not load (Gloria Hallelujah / Caveat)');
  M = await p.evaluate(([dogs, bed]) => { const box = {}; const d = document.createElement('div'); document.body.appendChild(d);
    for (const [k, sv] of Object.entries(dogs)) { d.innerHTML = sv; const e = d.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200);
      e.querySelectorAll('.pa-d-f1,.pa-d-f2,text').forEach((x) => x.remove()); const r = e.getBBox(); box[k] = [r.x, r.y, r.width, r.height]; }
    d.innerHTML = bed; const e = d.querySelector('svg'); e.setAttribute('width', 260); e.setAttribute('height', 160); const r = e.querySelector('.pa-bed-front').getBBox(); d.remove();
    return { box, lip: [r.x, r.y, r.width, r.height] }; }, [{ sit: PA.dog('jrt', { pose: 'sit', anim: false, facing: 'right' }), sleep: PA.dog('cavalier', { pose: 'sleep', anim: false, facing: 'right' }) }, PA.bed(BED.name)]);

  const render = async (t, file, opt = {}) => { const v = opt.cam || camAt(t);
    const err = await p.evaluate((f) => window.frame(f), { bg: bgF, x: f2(-v.x * v.k), y: f2(-v.y * v.k), s: r3(v.k / R), svg: frameSVG(t, opt), dogs: 2 });
    if (err) throw new Error(err + ' at ' + t.toFixed(3));
    await p.screenshot({ path: file, type: file.endsWith('.jpg') ? 'jpeg' : 'png', ...(file.endsWith('.jpg') ? { quality: 92 } : {}), ...(opt.clip ? { clip: opt.clip } : {}) }); };
  const renderLoopFrame = (t, file) => render(t, file, { extra: LOGO_CORNER });

  // ---- the thumbnail (1280 x 720): a little closer on the window and Pickle (his curious '?' after the raindrop), Scone's bed brought into the
  // view on the floor by the kitchen, the title big in Caveat on the left wall, the logo bottom left ----
  const thumb = path.join(OUT, 'lofi-rainy-evening-thumb.jpg');
  if (process.env.ONLY !== 'frames' && (process.env.THUMB === '1' || !fs.existsSync(thumb))) {
    const cam = { x: 150, y: 45, w: 760 }; cam.h = cam.w * H / W; cam.k = W / cam.w;
    const title = await p.evaluate(() => { const t1 = centred([{ s: 'rainy', size: 200, fill: '#FFF3C4' }], 330, 215, 'Caveat'), t2 = centred([{ s: 'evening', size: 200, fill: '#FFF3C4' }], 400, 420, 'Caveat'),
      t3 = centred([{ s: 'lofi', size: 250, fill: '#FFD98A' }], 330, 655, 'Caveat');
      return '<g stroke="#3B2A24" stroke-width="18" stroke-linejoin="round" paint-order="stroke" transform="rotate(-5 380 420)">' + t1.svg + t2.svg + t3.svg + '</g>'; });
    const tf = path.join(WORK, 'thumb_1920.png');
    await render(20.6, tf, { cam, bed: { x: 768, y: 452, B: 0.8 }, extra: title + logoAt(52, 1080 - 330 * 280 / 900 - 48, 330, 1) });
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', tf, '-vf', 'scale=1280:720:flags=lanczos', '-q:v', '2', thumb]); console.log('wrote', thumb);
  }

  if (process.env.ONLY === 'stills') {
    const ts = process.env.STRIP ? process.env.STRIP.split(',').map(Number) : [0, 1.65, 4.35, 6.45, 9.2, 12.3, 15, 19.65, 20.1, 21.2, 25.5, 29.966];
    for (const [j, t] of ts.entries()) await renderLoopFrame(t, path.join(WORK, 'stills', `s${String(j).padStart(2, '0')}_${t.toFixed(2)}.png`));
    await renderLoopFrame(T, path.join(WORK, 'stills', 'frame_900.png')); await renderLoopFrame(0, path.join(WORK, 'stills', 'frame_000.png'));
    console.log(ts.length, 'stills'); await b.close(); return;
  }
  const [FA, FB] = process.env.FRAMES ? process.env.FRAMES.split('-').map(Number) : [0, NF];
  const t0 = Date.now(), PAR = +process.env.PAR || 1;
  if (PAR > 1 && !process.env.FRAMES) { // PAR=n: n child processes, each its own browser over a slice of the frames
    const n = Math.ceil(NF / PAR); await Promise.all(Array.from({ length: PAR }, (_, i) => new Promise((ok, no) => {
      const c = cp.spawn(process.execPath, [__filename, WORK], { env: { ...process.env, PAR: '', ONLY: 'frames', THUMB: '', FRAMES: `${i * n}-${Math.min(NF, (i + 1) * n)}` }, stdio: 'inherit' });
      c.on('exit', (code) => code ? no(new Error('frames part ' + i + ' failed')) : ok()); })));
  } else for (let fi = FA; fi < Math.min(FB, NF); fi++) { await renderLoopFrame(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));
    if (fi % 150 === 0 || fi === FA) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  if (process.env.ONLY === 'frames') { await p.close(); await b.close(); return; }

  // ---- the loop check: frame 900 (t = 30 s) must be frame 0, pixel for pixel ----
  const f900 = path.join(WORK, 'frame_900.png'); await renderLoopFrame(T, f900);
  const same = fs.readFileSync(f900).equals(fs.readFileSync(path.join(WORK, 'f', 'f00000.png')));
  console.log('loop join: frame 900', same ? '== frame 0 (seamless)' : 'DIFFERS from frame 0'); if (!same) throw new Error('the loop does not close');
  // ---- the music: the seamless 30 s cozy loop (kept in WORK so a FRAMES fix reuses it) ----
  let wav = path.join(WORK, 'cozy_loop.wav');
  if (!process.env.FRAMES || !fs.existsSync(wav)) wav = (await cozyLoop({ browser: b, SRC, work: WORK })).wav;
  await p.close(); await b.close();
  const mp4 = path.join(OUT, 'rainy-evening-loop-30s.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', wav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '18', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', String(FPS * 2),
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(T), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(3) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
  if (process.env.LONG) { const n = Math.ceil(+process.env.LONG * 60 / T), long = path.join(WORK, `rainy-evening-${process.env.LONG}min.mp4`);
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-stream_loop', String(n - 1), '-i', mp4, '-stream_loop', String(n - 1), '-i', wav, '-map', '0:v', '-map', '1:a',
      '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', String(n * T), long], { stdio: 'inherit' });
    console.log('wrote', long); }
})().catch((e) => { console.error(e); process.exit(1); });
