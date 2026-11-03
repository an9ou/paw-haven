// Kids' episode "Noodle's Bedtime Walk" (docs/marketing/KIDS_SERIES.md, Pilot 2; Build kit there): a slow wind-down walk through the
// sketchbook town as day turns to night, told by Noodle (vo_bedtime_walk.py: Kokoro af_bella at 0.85x). The yard at dusk (the sun going
// down: the day render cross-fades into the dusk render), a slow walk through Maple Woods (walk pose, the three-frame line boil), the ducks
// on the Sunny Park pond, the Lighthouse Pier from dusk to night (its light comes on), five stars over the Hilltop Meadow counted one by one
// with big Caveat numbers, the moon, home: the yard at night with warm windows, a yawn, the Cloud Bed, a sleeping Noodle, little z's, and a
// slow fade to dark with only the small logo. Calm above all: slow camera moves, 1.5 s cross-fades, no flashing, nothing scary.
// Real art only (PawArt.scene with v2.15 ground art, PawArt.dog, PawArt.bed; the game's own star), no game UI (hotspot tags, run gates and
// hover outlines are taken out of the scenes), no Japanese, no selling words, the logo only at the very end.
//   NODE_PATH=$(npm root -g) node brand/kids/bedtime_walk/build_bedtime_walk.js <workdir> <vo dir>
//   FORMAT=wide (16:9, 1920 x 1080, default, about 3.5 min) or FORMAT=tall (the 9:16 cut, 1080 x 1920, about 55 s: dusk, ducks, stars, bed).
//   ONLY=stills: key frames only (WORK/stills), plus the thumbnail (wide) or the tall cover. FRAMES=a-b: re-render only those frames over a
//   copy of an earlier full workdir and encode again with the same sound (marketing rule: never re-render a whole video for a fix to one part).
// Read-along subtitles: Andika Bold, ink on a cream pill, one short line at a time, centreCheck() on every frame (and safeCheck() in tall).
// Sound: the game's own music and ambience (mods/pawaudio.js _render, a segment per place and time, the lullaby 'sleep' music at the bed)
// about 14 dB under the voice, fade in 2 s, fade out 3 s, the whole mix loudnorm I=-18 TP=-2.
// Output next to this file: doodle-doggo-kids-bedtime-walk[-tall].mp4, bedtime-walk-thumb.jpg (wide), bedtime-walk-cover-tall.jpg (tall).
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../../instagram/launch/centre_text.js');
const ROOT = path.join(__dirname, '..', '..', '..'), OUT = __dirname;
const WORK = path.resolve(process.argv[2] || '/tmp/bedtime_walk'), VO = path.resolve(process.argv[3] || 'vo');
const FORMAT = process.env.FORMAT || 'wide'; if (!['wide', 'tall'].includes(FORMAT)) throw new Error('FORMAT is wide or tall');
const TALL = FORMAT === 'tall', W = TALL ? 1080 : 1920, H = TALL ? 1920 : 1080, FPS = 25;
for (const d of ['f', 'bg', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;

// ---- the game's art, loaded like the game loads it ----
const win = {}, ctx = { window: win, console, Intl }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', ...'abcdefg'.split('').map((c) => `world/pawart_world_${c}.js`)]) { const p = path.join(ROOT, f); if (fs.existsSync(p)) vm.runInContext(fs.readFileSync(p, 'utf8'), ctx); }
const PA = win.PawArt;
const INK = '#5B3D32', CREAM = '#FFFDF7', PAPER = '#FFF8EC', DARK = '#1D2138';
const inner = (svg) => svg.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');
const f1 = (n) => Math.round(n * 10) / 10, f2 = (n) => Math.round(n * 100) / 100, r3 = (n) => Math.round(n * 1000) / 1000;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const eo3 = (x) => 1 - Math.pow(1 - clamp(x), 3), eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const sm = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
// cut whole elements out of an SVG string: every <g> whose open tag matches re, with all it holds (balanced)
function dropG(svg, re) { let out = '', i = 0; for (;;) { const m = re.exec(svg.slice(i)); if (!m) return out + svg.slice(i);
  const j = i + m.index; out += svg.slice(i, j); const tg = /<g[\s>]|<\/g>/g; tg.lastIndex = j; let d = 0, e;
  while ((e = tg.exec(svg))) { d += e[0] === '</g>' ? -1 : 1; if (!d) break; } i = e ? e.index + 4 : svg.length; } }
// the scene without game UI: hotspot groups (their label tags, the run-track start gates) and the hover outlines
const clean = (svg) => dropG(svg, /<g data-(?:hot|shop|area)=/).replace(/<path class="pa-wa-hl"[^>]*\/>/g, '');
const env = (time) => ({ time, weather: 'sunny', season: 'autumn', halloween: false, jp: true, v215: true });

// ---- the timeline: shots that overlap by a 1.5 s cross-fade; times inside a shot are relative to its start ----
// cam: keyframes [t, x, y, w] of the view on the scene (its height follows the frame's shape), eased between keyframes
// bgs: the scene's time-of-day renders, a later one fading in over the one before (op(u))
// dogs(u): Noodle as [{ pose, expr, x, y (the feet, scene units), D (scene units per dog-canvas unit), facing, op, walk }]
const XF = 1.5, SHOTS = [], VOAT = []; let AT = 0;
const shot = (o) => { o.a = AT; o.b = AT + o.len; SHOTS.push(o); AT = o.b - XF; return o; };
const say = (s, k, u) => { if (VOD[k] == null) throw new Error('no voice line ' + k); VOAT.push({ k, at: s.a + u }); return u + VOD[k]; };
const at = (s, u) => s.a + u;
const sit = (x, y, D, facing, expr) => ({ pose: 'sit', expr, x, y, D, facing });
const dis = (u, u0, d, A, B) => { const q = sm(seg(u, u0, u0 + d)); return q <= 0 ? [A] : q >= 1 ? [B] : [{ ...A, op: 1 - q }, { ...B, op: q }]; }; // a pose change: a soft dissolve
const walkX = (u, u0, u1, x0, x1) => x0 + (x1 - x0) * seg(u, u0, u1);
const STAR = 'M198.9 110.2L200.6 114.6L205 114.9L201.7 117.9L202.9 122.4L198.9 120.1L195 122.3L195.7 118L192.7 114.9L197 114.3Z'; // the game's night-sky star
const BED = { name: 'Cloud Bed' };
let STARS = null, ZZZ = null, END = null, TITLE = null;

if (!TALL) {
  const s1 = shot({ id: 'yard', len: 33, mus: { place: 'yard', time: 'dusk' }, fx: 'dusk',
    bgs: [{ scene: 'yard', time: 'day' }, { scene: 'yard', time: 'dusk', op: (u) => sm(seg(u, 10.5, 19.5)) }],
    cam: [[0, 120, 135, 820], [33, 160, 148, 770]],
    dogs: (u) => { const A = sit(620, 498, 1, 'right'), B = { pose: 'idle', x: 620, y: 498, D: 1, facing: 'right' };
      if (u < 27) return dis(u, 24.4, 0.7, A, B); return [{ pose: 'walk', walk: 1, x: walkX(u, 27, 34, 620, 860), y: 498, D: 1, facing: 'right' }]; } });
  TITLE = { a: at(s1, 0.8), b: at(s1, 8.2) };
  say(s1, 'hello', 8.6); say(s1, 'sun', 12.6); say(s1, 'walk', 19.6);
  const s2 = shot({ id: 'woods', len: 35, mus: { place: 'woods', time: 'dusk' }, fx: 'leaves', bgs: [{ scene: 'woods', time: 'dusk' }],
    cam: [[0, 0, 94, 900], [35, 640, 94, 900]], camLinear: true,
    dogs: (u) => [{ pose: 'walk', walk: 1, x: 430 + 640 * u / 35, y: 478, D: 1, facing: 'right' }] });
  say(s2, 'step', 4.2); say(s2, 'leaves', 7.8); say(s2, 'step', 20.5);
  const s3 = shot({ id: 'pond', len: 25, mus: { place: 'park', time: 'dusk' }, fx: 'dusk', bgs: [{ scene: 'park', time: 'dusk' }],
    cam: [[0, 160, 140, 800], [25, 110, 140, 800]],
    dogs: (u) => { const A = { pose: 'walk', walk: 1, x: walkX(u, 0, 5.4, 900, 700), y: 480, D: 1, facing: 'left' }; return dis(u, 5.4, 0.7, A, sit(700, 480, 1, 'left', u > 7 && u < 16 ? 'curious' : undefined)); } });
  say(s3, 'ducks0', 7.8); say(s3, 'ducks', 11.6);
  const s4 = shot({ id: 'pier', len: 28, mus: { place: 'pier', time: 'dusk' }, mus2: { u: 9, place: 'pier', time: 'night' }, fx: 'dusknight', nightAt: [4, 12],
    bgs: [{ scene: 'pier', time: 'dusk' }, { scene: 'pier', time: 'night', op: (u) => sm(seg(u, 4, 12)) }],
    cam: [[0, 0, 20, 960], [28, 70, 20, 960]],
    dogs: (u) => [sit(600, 432, 1, 'left', u > 5 && u < 13 ? 'wow' : undefined)] });
  say(s4, 'light', 4.6); say(s4, 'sea', 15.6);
  const s5 = shot({ id: 'hill', len: 42, mus: { place: 'hilltop', time: 'night' }, fx: 'night', bgs: [{ scene: 'hilltop', time: 'night' }],
    cam: [[0, 100, 0, 1000], [23, 100, 0, 1000], [31, 600, 0, 1000], [42, 600, 0, 1000]],
    dogs: (u) => { const A = { pose: 'down', expr: u > 5.5 && u < 22 ? 'wow' : u > 33 ? 'sleepy' : undefined, x: 800, y: 455, D: 1, facing: 'right' };
      return dis(u, 37.2, 0.7, A, { pose: 'idle', expr: 'sleepy', x: 800, y: 455, D: 1, facing: 'right' }); } });
  say(s5, 'count', 3.4);
  STARS = { s: s5, u0: 6.0, gap: 3.0, numsOut: [20.5, 22.0], size: 4.4,
    at: [[255, 62], [405, 168], [600, 58], [800, 150], [960, 40]] }; // scene units (kept clear of the two kites and the moon)
  STARS.at.forEach((_, i) => say(s5, 'n' + (i + 1), STARS.u0 + i * STARS.gap + 0.3));
  say(s5, 'moon', 30.2); say(s5, 'home0', 33.4);
  const s6 = shot({ id: 'home', len: 58, mus: { place: 'yard', time: 'night' }, mus2: { u: 13.5, place: 'sleep', time: 'night' }, fx: 'night', bgs: [{ scene: 'yard', time: 'night' }],
    bed: { x: 700, y: 520, B: 0.9 },
    cam: [[0, 150, 150, 800], [15, 150, 150, 800], [50, 420, 250, 560]],
    dogs: (u) => { const st = { pose: 'idle', x: 360, y: 520, D: 1, facing: 'right' }, sl = { ...st, expr: 'sleepy' }, yw = { pose: 'yawn', x: 360, y: 520, D: 1, facing: 'right' };
      if (u < 6.2) return dis(u, 5.6, 0.6, { pose: 'walk', walk: 1, x: walkX(u, 0, 5.6, 170, 360), y: 520, D: 1, facing: 'right' }, st);
      if (u < 8.4) return dis(u, 7.0, 0.6, st, sl);
      if (u < 12.8) return dis(u, 8.4, 0.6, sl, yw);
      return dis(u, 12.8, 1.2, yw, { pose: 'sleep', inBed: 1, facing: 'right' }); } });
  say(s6, 'back', 6.2); say(s6, 'yawn', 9.0); say(s6, 'bed', 15.0); say(s6, 'night', 21.6); say(s6, 'dreams', 25.0);
  ZZZ = { s: s6, u0: 16.5 }; END = { dark: [at(s6, 40), at(s6, 48)], logo: [at(s6, 48.6), at(s6, 50.4)], T: s6.b };
} else {
  // the 9:16 cut (45-60 s): dusk, ducks, stars 1-5, bed, goodnight. Noodle's feet stay above y 1240 (the subtitles sit at y 1360) and the
  // views stay inside each scene (a tall view of a 600-high scene is narrow, so Noodle stands further back than in the wide cut)
  const t1 = shot({ id: 'yard', len: 9.5, mus: { place: 'yard', time: 'dusk' }, fx: 'dusk',
    bgs: [{ scene: 'yard', time: 'day' }, { scene: 'yard', time: 'dusk', op: (u) => sm(seg(u, 0.6, 6.6)) }],
    cam: [[0, 352, 40, 315], [9.5, 368, 48, 300]], dogs: () => [sit(520, 400, 1, 'right')] });
  TITLE = { a: at(t1, 0.4), b: at(t1, 4.6) };
  say(t1, 'sun', 1.0); say(t1, 'walk', 3.4);
  const t2 = shot({ id: 'ducks', len: 9.5, mus: { place: 'river', time: 'dusk' }, fx: 'dusk', bgs: [{ scene: 'river', time: 'dusk' }],
    cam: [[0, 975, 56, 300], [9.5, 975, 60, 296]], dogs: (u) => [sit(1049, 400, 0.85, 'right', u > 1 && u < 7 ? 'curious' : undefined)] });
  say(t2, 'ducks0', 1.2); say(t2, 'ducks', 3.6);
  const t3 = shot({ id: 'hill', len: 16.5, mus: { place: 'hilltop', time: 'night' }, fx: 'night', bgs: [{ scene: 'hilltop', time: 'night' }],
    cam: [[0, 600, 4, 330], [16.5, 606, 8, 324]], dogs: (u) => [{ pose: 'down', expr: u > 2.6 ? 'wow' : undefined, x: 762, y: 376, D: 1, facing: 'right' }] });
  say(t3, 'count', 1.0);
  STARS = { s: t3, u0: 3.0, gap: 2.4, numsOut: [99, 100], size: 3.4, at: [[661, 105], [759, 96], [701, 175], [814, 163], [747, 236]] };
  STARS.at.forEach((_, i) => say(t3, 'n' + (i + 1), STARS.u0 + i * STARS.gap + 0.3));
  const t4 = shot({ id: 'home', len: 24, mus: { place: 'yard', time: 'night' }, mus2: { u: 5, place: 'sleep', time: 'night' }, fx: 'night', bgs: [{ scene: 'yard', time: 'night' }],
    bed: { x: 640, y: 389, B: 0.72 },
    cam: [[0, 404, 12, 330], [6, 404, 12, 330], [22, 512, 70, 250]],
    dogs: (u) => dis(u, 4.4, 1.2, { pose: 'yawn', x: 452, y: 389, D: 1, facing: 'right' }, { pose: 'sleep', inBed: 1, facing: 'right' }) });
  say(t4, 'yawn', 1.0); say(t4, 'bed', 6.0); say(t4, 'night', 9.0); say(t4, 'dreams', 11.6);
  ZZZ = { s: t4, u0: 7.5 }; END = { dark: [at(t4, 14), at(t4, 19)], logo: [at(t4, 19.5), at(t4, 21)], T: t4.b };
}
const T = END.T, NF = Math.round(T * FPS);

// ---- read-along subtitles: each line in short chunks (at most ~30 letters), timed by each chunk's share of the line ----
const SUBS_TX = { hello: ['Hello, friends.', "It's me, Noodle."], sun: ['The sun is going down.'], walk: ["Let's take one last", 'little walk before bed.'],
  step: ['Step, step, step.'], leaves: ['Can you hear the leaves?'], ducks0: ['The ducks are sleepy too.'], ducks: ['Goodnight, ducks.', 'Sleep tight.'],
  light: ['Look, the lighthouse', 'is turning on its light.'], sea: ['Goodnight, sea.'], count: ["Let's count the stars."],
  n1: ['1.'], n2: ['2.'], n3: ['3.'], n4: ['4.'], n5: ['5.'], moon: ["There's the moon."], home0: ["It's time to go home."],
  back: ['Back home.'], yawn: ['A big yawn.'], bed: ['A soft bed.'], night: ['Goodnight, friends.'], dreams: ['Sweet dreams.'] };
const SUBS = [];
VOAT.slice().sort((a, b) => a.at - b.at).forEach((v) => { const parts = SUBS_TX[v.k];
  if (parts.join(' ').replace(/[^a-z]/gi, '').toLowerCase() !== VOJ.text[v.k].replace(/[^a-z]/gi, '').toLowerCase() && !/^n\d$/.test(v.k)) throw new Error('subtitles differ from the voice: ' + v.k);
  const wt = parts.map((x) => x.length + (/[.!?]$/.test(x) ? 6 : 2)), sum = wt.reduce((a, b) => a + b, 0); let t0 = v.at;
  parts.forEach((x, i) => { const d = VOD[v.k] * wt[i] / sum; SUBS.push({ a: t0, b: t0 + d, s: x }); t0 += d; }); });
SUBS.forEach((u, i) => { const nx = SUBS[i + 1]; u.b = nx ? Math.min(nx.a, u.b + 0.7) : u.b + 0.7; if (u.b - u.a < 1.1 && (!nx || nx.a - u.a >= 1.1)) u.b = u.a + 1.1; });
for (const u of SUBS) if (u.s.length > 30) throw new Error('subtitle too long: ' + u.s);

// ---- the camera ----
const camAt = (s, u) => { const K = s.cam; let i = 1; while (i < K.length - 1 && u > K[i][0]) i++; const a = K[i - 1], z = K[i], q = s.camLinear ? seg(u, a[0], z[0]) : eio(seg(u, a[0], z[0]));
  const v = { x: a[1] + (z[1] - a[1]) * q, y: a[2] + (z[2] - a[2]) * q, w: a[3] + (z[3] - a[3]) * q }; v.h = v.w * H / W; v.k = W / v.w; return v; };
// each shot's renders are made at the sharpest zoom it reaches, so the image is never scaled up and barely down
for (const s of SHOTS) { s.R = Math.ceil(Math.max(...s.cam.map((c) => W / c[3])) * 10) / 10;
  for (const c of s.cam) { const sw = s.bgs[0].scene === 'yard' ? 1000 : 1600; if (c[1] < -0.5 || c[2] < -0.5 || c[1] + c[3] > sw + 0.5 || c[2] + c[3] * H / W > 600.5) throw new Error('view off the scene in ' + s.id + ': ' + c); } }

// ---- depth: soft light motes at three depths (far, mid, near), warm at dusk, a few pale fireflies at night; leaves falling in the woods ----
let sd = 23; const rr = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
const MOTES = Array.from({ length: 16 }, (_, i) => { const d = i % 3; return { d, x: rr() * W, y: rr() * H, r: [4, 8, 18][d] + rr() * [2, 4, 8][d], sp: [10, 16, 26][d] * (0.7 + rr() * 0.6), ph: rr() * 6.3, op: [0.45, 0.35, 0.22][d] }; });
const LEAVES = Array.from({ length: 9 }, (_, i) => ({ d: [0, 1, 0, 2, 1, 0, 2, 1, 0][i], x: (0.08 + 0.105 * i) * W, t0: i * 3.6 - 4, dur: 11 + (i % 3) * 2, s: [0.8, 1.2, 0.8, 1.9, 1.2, 0.8, 1.9, 1.2, 0.8][i], c: ['#F2B33D', '#E8863A', '#D9693A'][i % 3] }));
const leaf = (x, y, s, rot, c) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${r3(s)})"><path d="M0 -22C13 -12 14 10 0 22C-14 10 -13 -12 0 -22Z" fill="${c}" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/><path d="M0 -16L0 26" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/></g>`;
const FXDEFS = `<defs>${[1.4, 3, 8].map((s, d) => `<filter id="dof${d}" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="${s}"/></filter>`).join('')}`
  + `<radialGradient id="sglow"><stop offset="0" stop-color="#FFF3B0" stop-opacity=".75"/><stop offset=".45" stop-color="#FFE58A" stop-opacity=".25"/><stop offset="1" stop-color="#FFE58A" stop-opacity="0"/></radialGradient></defs>`;
const fxLayer = (s, u, t) => { let g = ''; const kind = s.fx, night = kind === 'night' || (kind === 'dusknight' && u > s.nightAt[0] + 4);
  const col = night ? '#FFF6C8' : '#FFE2C8', sc = W / 1920;
  for (const d of [0, 1, 2]) { let l = '';
    for (const m of MOTES) if (m.d === d) { if (night && m.d !== 1 && MOTES.indexOf(m) % 2) continue;
      const y = ((m.y - m.sp * t) % (H + 80) + H + 80) % (H + 80) - 40, x = m.x + Math.sin(t * 0.35 + m.ph) * 26;
      l += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(m.r * sc * (night ? 0.7 : 1))}" fill="${col}" opacity="${r3(m.op * (night ? 0.8 : 1) * (0.8 + 0.2 * Math.sin(t * 0.8 + m.ph)))}"/>`; }
    if (kind === 'leaves') for (const lf of LEAVES) if (lf.d === d) { const q = (u - lf.t0) / lf.dur; if (q < 0 || q > 1) continue;
      l += leaf(lf.x + Math.sin(q * 6) * 60 * sc, -80 + q * (H + 160), lf.s * sc * 1.2, Math.sin(q * 5) * 40 + q * 120, lf.c); }
    if (l) g += `<g filter="url(#dof${d})">${l}</g>`; }
  return g; };

// ---- the counted stars (the game's star, big, with a soft glow; it fades in and then twinkles very gently) and their numbers ----
const starOn = (i) => STARS.s.a + STARS.u0 + i * STARS.gap;
const starsLayer = (t) => { if (!STARS || t < starOn(0) - 0.1 || t > STARS.s.b) return ''; let g = '';
  STARS.at.forEach(([x, y], i) => { const q = eo3(seg(t, starOn(i), starOn(i) + 1.1)); if (q <= 0) return;
    const tw = 1 + 0.05 * Math.sin((t - starOn(i)) * 2 * Math.PI / 3.6 + i), s = STARS.size * (0.6 + 0.4 * q) * tw;
    g += `<circle cx="${x}" cy="${y}" r="${f1(30 * STARS.size / 4.4 * (0.9 + 0.1 * tw))}" fill="url(#sglow)" opacity="${r3(q * 0.9)}"/>`
      + `<g transform="translate(${x} ${y}) scale(${r3(s)}) translate(-198.9 -116.4)" opacity="${r3(q)}"><path d="${STAR}" fill="#FFF0A8" stroke="#E2C46E" stroke-width="${r3(1.3 * 4.4 / STARS.size)}" stroke-linejoin="round"/></g>`; });
  return g; };

// ---- per frame: what each visible shot shows (its renders and its SVG: Noodle, the bed, the stars, the motes), and the overlay ----
const bgFile = (s, b) => path.join(WORK, 'bg', `${b.scene}_${b.time}_${s.R}.png`);
let M = null; // measured in the page: each pose's box on the 240 x 200 dog canvas, the bed's front lip
const dogCache = {};
const dogSVG = (pose, expr, fr, facing) => { const k = [pose, expr, fr, facing].join('|');
  return dogCache[k] || (dogCache[k] = inner(PA.dog('dachs', { pose, expr, anim: true, facing })).replace(/class="pa-d-f(\d)"/g, (m0, d) => (+d === fr ? m0 : 'class="hide"'))); };
const BED_SVG = inner(PA.bed(BED.name)), BED_FRONT = (() => { const s = PA.bed(BED.name), j = s.indexOf('<g class="pa-bed-front"'); // the lip drawn over the sleeping dog, as the game does
  const tg = /<g[\s>]|<\/g>/g; tg.lastIndex = j; let d = 0, e; while ((e = tg.exec(s))) { d += e[0] === '</g>' ? -1 : 1; if (!d) break; } return s.slice(j, e.index + 4); })();
const boxOf = (pose, facing) => { const b = M.box[pose]; return facing === 'left' ? [240 - b[0] - b[2], b[1], b[2], b[3]] : b; };
// where a dog is drawn (scene units): its svg box, and its head (for the z's)
function place(s, d) {
  if (d.inBed) { const bd = s.bed, L = M.lip, b = boxOf('sleep', d.facing), k = Math.min(1, 0.78 * L[2] / b[2]), sc = bd.B * k;
    const bx0 = bd.x - 130 * bd.B, by0 = bd.y - 152 * bd.B, bottom = by0 + (L[1] + 0.14 * b[3] * k) * bd.B;
    const x = bx0 + (L[0] + L[2] / 2) * bd.B - (b[0] + b[2] / 2) * sc, y = bottom - (b[1] + b[3]) * sc;
    return { x, y, sc, head: [x + (b[0] + b[2] * 0.85) * sc, y + (b[1] + b[3] * 0.4) * sc] }; }
  const b = boxOf(d.pose, d.facing), sc = d.D, lift = d.walk ? Math.abs(Math.sin(d.ph * Math.PI * 2)) * 2.2 : 0;
  return { x: d.x - (b[0] + b[2] / 2) * sc, y: d.y - 188 * sc - lift, sc, head: [d.x + (d.facing === 'left' ? -0.35 : 0.35) * b[2] * sc, d.y - (188 - b[1]) * sc] };
}
function shotFrame(s, t, oy = 0) {
  const u = t - s.a, v = camAt(s, u), op = s === SHOTS[0] || s.id === 'cover' ? 1 : sm(seg(u, 0, XF));
  const imgs = s.bgs.map((b) => ({ src: bgFile(s, b), op: b.op ? b.op(u) : 1, x: -v.x * v.k, y: -v.y * v.k + oy, s: v.k / s.R })).filter((m) => m.op > 0.002);
  let g = '', head = null;
  if (s.bed) { const bd = s.bed; g += `<svg x="${f2(bd.x - 130 * bd.B)}" y="${f2(bd.y - 152 * bd.B)}" width="${f2(260 * bd.B)}" height="${f2(160 * bd.B)}" viewBox="0 0 260 160" overflow="visible">${BED_SVG}</svg>`; }
  let front = '';
  for (const d of s.dogs(u)) { d.ph = u * 1.6; const fr = Math.floor(u * (d.walk ? 4 : 3)) % 3, p = place(s, d), o = d.op == null ? 1 : d.op;
    const svg = `<g opacity="${r3(o)}"><svg x="${f2(p.x)}" y="${f2(p.y)}" width="${f2(240 * p.sc)}" height="${f2(200 * p.sc)}" viewBox="0 0 240 200" overflow="visible">${dogSVG(d.pose, d.expr, fr, d.facing)}</svg></g>`;
    if (d.inBed) { g += svg; head = p.head; } else front += svg; }
  if (s.bed) { const bd = s.bed; g += `<svg x="${f2(bd.x - 130 * bd.B)}" y="${f2(bd.y - 152 * bd.B)}" width="${f2(260 * bd.B)}" height="${f2(160 * bd.B)}" viewBox="0 0 260 160" overflow="visible">${BED_FRONT}</svg>`; }
  g += front;
  if (STARS && STARS.s === s) g += starsLayer(t);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${FXDEFS}<g transform="translate(${f2(-v.x * v.k)} ${f2(-v.y * v.k + oy)}) scale(${r3(v.k)})">${g}</g>${fxLayer(s, u, t)}</svg>`;
  return { id: Math.max(0, SHOTS.indexOf(s)), op, imgs, svg, v, head };
}
// the overlay (screen units): the title, the big star numbers, the z's, the fade to dark, the logo, the subtitle
const SUB = TALL ? { cx: 475, y: 1360, size: 58, maxW: 800 } : { cx: 960, y: 975, size: 60, maxW: 1500 };
const LOGO_SVG = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<title>[^<]*<\/title>/, ''));
function overlay(t, frames) {
  const o = { title: null, nums: [], zzz: [], dark: 0, logo: 0, sub: null, paper: r3(1 - sm(seg(t, 0, 2.2))) };
  if (TITLE && t > TITLE.a && t < TITLE.b) o.title = { s: "Noodle's Bedtime Walk", op: r3(Math.min(sm(seg(t, TITLE.a, TITLE.a + 1.2)), 1 - sm(seg(t, TITLE.b - 1.2, TITLE.b)))) };
  const fs5 = frames.find((f) => STARS && SHOTS[f.id] === STARS.s);
  if (fs5) { const v = fs5.v, out = 1 - sm(seg(t - STARS.s.a, STARS.numsOut[0], STARS.numsOut[1]));
    STARS.at.forEach(([x, y], i) => { const q = eo3(seg(t, starOn(i) + 0.15, starOn(i) + 1.0)) * out; if (q <= 0) return;
      const sx = (x - v.x) * v.k, sy = (y - v.y) * v.k, r = 30 * STARS.size / 4.4 * v.k;
      o.nums.push({ s: (i + 1) + '.', x: f1(sx + r * 1.15), y: f1(sy + r * 0.95), op: r3(q), size: TALL ? 112 : 120 }); }); }
  const fz = frames.find((f) => f.head && ZZZ && SHOTS[f.id] === ZZZ.s);
  if (fz) { const v = fz.v, hx = (fz.head[0] - v.x) * v.k, hy = (fz.head[1] - v.y) * v.k, u = t - ZZZ.s.a;
    for (let j = 0; j < 4; j++) { const t0 = ZZZ.u0 + j * 1.9, period = 7.6; let q = (u - t0) / 5.2; if (u < t0) continue; q = ((u - t0) % period) / 5.2; if (q > 1) continue;
      const fade = 1 - sm(seg(t, END.dark[0] - 1, END.dark[0] + 3));
      o.zzz.push({ x: f1(TALL ? hx - 70 - q * 90 + Math.sin(q * 5 + j) * 14 : hx + 20 + q * 120 + Math.sin(q * 5 + j) * 14), y: f1(hy - 70 - q * 200), size: Math.round((TALL ? 80 : 74) * (0.7 + 0.6 * q)), op: r3(Math.min(sm(q * 4), 1 - sm(seg(q, 0.6, 1))) * fade) }); } }
  o.dark = r3(sm(seg(t, END.dark[0], END.dark[1])));
  o.logo = r3(sm(seg(t, END.logo[0], END.logo[1])));
  const u = SUBS.find((x) => t >= x.a && t < x.b);
  if (u && o.dark < 0.5) o.sub = { s: u.s, op: r3(Math.min(sm((t - u.a) / 0.25), sm((u.b - t) / 0.3))) };
  return o;
}

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:${PAPER}}#st{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${PAPER}}.slot{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
.slot img{position:absolute;left:0;top:0;transform-origin:0 0;display:none}.slot .sv{position:absolute;left:0;top:0}svg{display:block}.hide{display:none}#ov{position:absolute;left:0;top:0;z-index:100}</style>
<div id="st"><div class="slot" id="s0"><img><img><div class="sv"></div></div><div class="slot" id="s1"><img><img><div class="sv"></div></div>
<svg id="ov" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg></div><span style="font:700 20px Andika">a</span><span style="font:700 20px Caveat">a</span>
<script>
${CENTRE_JS}
${SAFE_JS}
const LOGO=${JSON.stringify(LOGO_SVG)}, SUB=${JSON.stringify(SUB)}, TALL=${TALL}, W=${W}, H=${H};
function fitSize(s,size,fam,maxW){ while(size>20){ const k=inkOf(s,size,fam); if(k.L+k.R<=maxW) return size; size-=2; } return size; }
window.frame=async function(frames,o){
  for(const n of [0,1]){ const el=document.getElementById('s'+n), f=frames[n];
    if(!f){ el.style.display='none'; continue; } el.style.display=''; el.style.opacity=f.op; el.style.zIndex=f.id;
    const im=el.querySelectorAll('img');
    for(let i=0;i<2;i++){ const m=f.imgs[i], e=im[i]; if(!m){ e.style.display='none'; continue; }
      if(e.dataset.src!==m.src){ e.dataset.src=m.src; e.src='file://'+m.src; await e.decode(); }
      e.style.display='block'; e.style.opacity=m.op; e.style.transform='translate('+m.x+'px,'+m.y+'px) scale('+m.s+')'; }
    const sv=el.querySelector('.sv'); if(sv._s!==f.svg){ sv.innerHTML=f.svg; sv._s=f.svg; } }
  let g=o.paper>0?'<rect width="'+W+'" height="'+H+'" fill="${PAPER}" opacity="'+o.paper+'"/>':'';
  if(o.pre) g+=o.pre;
  if(o.title){ const size=fitSize(o.title.s,TALL?84:100,'Caveat',TALL?690:1300); g+='<g opacity="'+o.title.op+'"><g transform="rotate(-1.5 '+(TALL?475:960)+' '+(TALL?400:150)+')">'+pill(o.title.s,TALL?475:960,TALL?400:150,size,'Caveat',{fill:'#FFFDF7',padX:46})+'</g></g>'; }
  for(const n of o.nums) g+='<g opacity="'+n.op+'" stroke="#5B3D32" stroke-width="9" stroke-linejoin="round" paint-order="stroke">'+centred([{s:n.s,size:n.size,fill:'#FFF3C4'}],n.x,n.y,'Caveat').svg+'</g>';
  for(const z of o.zzz) g+='<text x="'+z.x+'" y="'+z.y+'" font-family="Caveat" font-weight="700" font-size="'+z.size+'" fill="#FFF8EC" stroke="#5B3D32" stroke-width="5" paint-order="stroke" stroke-linejoin="round" opacity="'+z.op+'">Z</text>';
  if(o.dark>0) g+='<rect width="'+W+'" height="'+H+'" fill="${DARK}" opacity="'+o.dark+'"/>';
  if(o.logo>0){ const lw=TALL?520:440, lh=lw*280/900, cx=TALL?475:960, cy=TALL?860:540;
    g+='<g opacity="'+o.logo+'" data-safe><defs><clipPath id="lclip"><rect x="'+(cx-lw/2)+'" y="'+(cy-lh/2)+'" width="'+lw+'" height="'+lh+'" rx="'+(lh*0.22)+'"/></clipPath></defs>'
      +'<rect x="'+(cx-lw/2-10)+'" y="'+(cy-lh/2-10)+'" width="'+(lw+20)+'" height="'+(lh+20)+'" rx="'+(lh*0.26)+'" fill="#FFF8EC" opacity=".12"/>'
      +'<g clip-path="url(#lclip)"><svg x="'+(cx-lw/2)+'" y="'+(cy-lh/2)+'" width="'+lw+'" height="'+lh+'" viewBox="0 0 900 280">'+LOGO+'</svg></g></g>'; }
  if(o.sub){ const size=fitSize(o.sub.s,SUB.size,'Andika',SUB.maxW); g+=pill(o.sub.s,SUB.cx,SUB.y,size,'Andika',{fill:'#FFFDF7',stroke:'#5B3D32',color:'#5B3D32',padX:34,op:(0.97*o.sub.op).toFixed(3)}); }
  if(o.extra) g+=o.extra;
  document.getElementById('ov').innerHTML=g;
  const bad=centreCheck(document.getElementById('ov')); if(bad.length) return 'not centred: '+bad.join('; ');
  if(TALL){ const out=safeCheck(document.getElementById('ov')); if(out.length) return 'outside SAFE: '+out.join('; '); }
  return '';
};
</script>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required', '--allow-file-access-from-files'] });
  // the backgrounds, once per scene, time and zoom (kept in WORK/bg, so a FRAMES re-render uses the same images)
  for (const s of SHOTS) for (const bg of s.bgs) { const f = bgFile(s, bg); if (fs.existsSync(f)) continue;
    const svg = clean(PA.scene(bg.scene, env(bg.time))), vb = svg.match(/viewBox="0 0 (\d+) (\d+)"/), sw = +vb[1], sh = +vb[2];
    const c = await b.newContext({ viewport: { width: sw, height: sh }, deviceScaleFactor: s.R }), q = await c.newPage();
    await q.setContent(`<style>html,body{margin:0}svg{display:block;width:${sw}px;height:${sh}px}</style>${svg}`); await q.waitForTimeout(150);
    await q.screenshot({ path: f, clip: { x: 0, y: 0, width: sw, height: sh } }); await c.close(); console.log('bg', path.basename(f)); }

  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(WORK, `page_${FORMAT}.html`), html);
  await p.goto('file://' + path.join(WORK, `page_${FORMAT}.html`)); await p.waitForLoadState('networkidle');
  await p.evaluate(() => Promise.all(['700 40px Andika', '700 40px Caveat'].map((f) => document.fonts.load(f, "Noodle's 12345. z"))));
  await p.evaluate(() => document.fonts.ready);
  // measure each pose's drawn box on the 240 x 200 canvas, and the Cloud Bed's front lip on its 260 x 160 canvas
  M = await p.evaluate(([dogs, bed]) => { const box = {}; const d = document.createElement('div'); document.body.appendChild(d);
    for (const [k, sv] of Object.entries(dogs)) { d.innerHTML = sv; const e = d.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200);
      e.querySelectorAll('.pa-d-f1,.pa-d-f2').forEach((x) => x.remove()); const r = e.getBBox(); box[k] = [r.x, r.y, r.width, r.height]; }
    d.innerHTML = bed; const e = d.querySelector('svg'); e.setAttribute('width', 260); e.setAttribute('height', 160); const r = e.querySelector('.pa-bed-front').getBBox(); d.remove();
    return { box, lip: [r.x, r.y, r.width, r.height] }; }, [Object.fromEntries(['sit', 'idle', 'walk', 'down', 'yawn', 'sleep'].map((k) => [k, PA.dog('dachs', { pose: k, anim: false, facing: 'right' })])), PA.bed(BED.name)]);
  console.log('measured', JSON.stringify(M));

  const render = async (t, file, extra) => {
    const fr = SHOTS.filter((s) => t >= s.a && t < s.b + 1e-6).slice(-2).map((s) => shotFrame(s, t));
    const o = overlay(t, fr); if (extra) o.extra = extra;
    const err = await p.evaluate(([f, o]) => window.frame(f, o), [fr, o]); if (err) throw new Error(err + ' at ' + t.toFixed(2));
    await p.screenshot({ path: file, type: file.endsWith('.jpg') ? 'jpeg' : 'png', ...(file.endsWith('.jpg') ? { quality: 92 } : {}) }); };

  // ---- the thumbnail (wide) or the tall cover: Noodle under the moon and stars, a big short title, the logo small ----
  const coverPage = async (file) => {
    // wide: the meadow at night around the moon, Noodle big, looking up. tall: the same, the scene's full height laid over the middle
    // 1080 x 1440 (y 240..1680, what the profile grid shows) so the moon sits inside SAFE; above and below, more night sky and grass
    const s = { id: 'cover', len: 1, a: 0, b: 1, fx: 'night', bgs: [{ scene: 'hilltop', time: 'night' }], cam: TALL ? [[0, 1100, 0, 450], [1, 1100, 0, 450]] : [[0, 600, 0, 1000], [1, 600, 0, 1000]],
      dogs: () => [TALL ? sit(1298, 483, 1.2, 'right', 'wow') : sit(1130, 520, 1.6, 'right', 'wow')] };
    s.R = Math.ceil(W / s.cam[0][3] * 10) / 10; const keep = STARS;
    STARS = { s, u0: -9, gap: 0, numsOut: [-2, -1], size: TALL ? 3.4 : 3.6, at: TALL ? [[1154, 133], [1237, 96], [1454, 25], [1475, 150], [1333, 154]] : [[1194, 55], [1267, 156], [1465, 156], [1558, 63], [1439, 21]] };
    const bf = bgFile(s, s.bgs[0]); if (!fs.existsSync(bf)) { const svg = clean(PA.scene('hilltop', env('night')));
      const c = await b.newContext({ viewport: { width: 1600, height: 600 }, deviceScaleFactor: s.R }), q = await c.newPage();
      await q.setContent(`<style>html,body{margin:0}svg{display:block;width:1600px;height:600px}</style>${svg}`); await q.waitForTimeout(150); await q.screenshot({ path: bf }); await c.close(); }
    const fr = [shotFrame(s, 0.5, TALL ? 240 : 0)]; STARS = keep;
    const o = { title: null, nums: [], zzz: [], dark: 0, logo: 0, sub: null, paper: 0 };
    if (TALL) o.pre = '<defs><linearGradient id="skyb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262B4A"/><stop offset=".86" stop-color="#3A4472"/><stop offset="1" stop-color="#3A4472" stop-opacity="0"/></linearGradient>'
      + '<linearGradient id="grb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6F7B6A" stop-opacity="0"/><stop offset=".16" stop-color="#6F7B6A"/><stop offset="1" stop-color="#4E5A4C"/></linearGradient></defs>'
      + '<rect x="0" y="0" width="1080" height="288" fill="url(#skyb)"/><rect x="0" y="1640" width="1080" height="280" fill="url(#grb)"/>';
    o.extra = await p.evaluate((tall) => { const cx = tall ? 475 : 560, y = tall ? 800 : 250, size = tall ? 140 : 190;
      const t = '<g transform="rotate(-3 ' + cx + ' ' + y + ')">' + pill('Bedtime Walk', cx, y, size, 'Caveat', { fill: '#FFFDF7', padX: 52 }) + '</g>';
      const lw = tall ? 300 : 400, lh = lw * 280 / 900, lx = tall ? 230 - lw / 2 : 1920 - lw - 56, ly = tall ? 330 - lh / 2 : 1080 - lh - 48;
      return t + '<g data-safe><defs><clipPath id="cl2"><rect x="' + lx + '" y="' + ly + '" width="' + lw + '" height="' + lh + '" rx="' + lh * 0.22 + '"/></clipPath></defs>'
        + '<g clip-path="url(#cl2)"><svg x="' + lx + '" y="' + ly + '" width="' + lw + '" height="' + lh + '" viewBox="0 0 900 280">' + LOGO + '</svg></g><rect x="' + lx + '" y="' + ly + '" width="' + lw + '" height="' + lh + '" rx="' + lh * 0.22 + '" fill="none" stroke="#5B3D32" stroke-width="5"/></g>'; }, TALL);
    const err = await p.evaluate(([f, o]) => window.frame(f, o), [fr, o]); if (err) throw new Error('cover: ' + err);
    await p.screenshot({ path: file, type: 'jpeg', quality: 92 }); console.log('wrote', file); };
  await coverPage(path.join(OUT, TALL ? 'bedtime-walk-cover-tall.jpg' : 'bedtime-walk-thumb.jpg'));

  if (process.env.ONLY === 'stills') {
    const ts = process.env.STRIP ? process.env.STRIP.split(',').map(Number) : SHOTS.flatMap((s) => [s.a + 2.2, (s.a + s.b) / 2, s.b - XF - 0.6]).concat(STARS ? [starOn(4) + 1.5] : [], [END.logo[1] + 1]).sort((a, b) => a - b);
    for (const [j, t] of ts.entries()) { await render(t, path.join(WORK, 'stills', `${FORMAT}_${String(j).padStart(2, '0')}_${t.toFixed(1)}.png`)); }
    console.log(ts.length, 'stills, T =', T.toFixed(2)); await b.close(); return;
  }
  const [FA, FB] = process.env.FRAMES ? process.env.FRAMES.split('-').map(Number) : [0, NF];
  const t0 = Date.now();
  for (let fi = FA; fi < Math.min(FB, NF); fi++) { await render(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));
    if (fi % 250 === 0) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await p.close();

  // ---- sound: the game's music and ambience per place (very soft), Noodle's voice on top; kept in WORK so a FRAMES fix reuses it ----
  const mixWav = path.join(WORK, `mix_${FORMAT}.wav`);
  if (!process.env.FRAMES || !fs.existsSync(mixWav)) {
    const segs = []; for (const s of SHOTS) { segs.push({ at: Math.max(0, s.a), ctx: { place: s.mus.place, time: s.mus.time, weather: 'sunny' } }); if (s.mus2) segs.push({ at: s.a + s.mus2.u, ctx: { place: s.mus2.place, time: s.mus2.time, weather: 'sunny' } }); }
    const ap = await b.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
    const wav = await ap.evaluate(async ([sec, segs]) => (await window.PawAudio._render({ seconds: sec, wav: true, vols: { master: 0.8, music: 0.5, ambience: 0.4 }, segments: segs })).wav, [T + 0.5, segs]);
    fs.writeFileSync(path.join(WORK, `music_${FORMAT}.wav`), Buffer.from(wav, 'base64')); await ap.close();
    // the voice stem: every line at its time
    const inputs = [], chains = [];
    VOAT.forEach((v, i) => { inputs.push('-i', path.join(VO, v.k + '.wav')); const d = Math.round(v.at * 1000); chains.push(`[${i}:a]aresample=44100,aformat=channel_layouts=mono,adelay=${d}|${d}[v${i}]`); });
    const voWav = path.join(WORK, `voice_${FORMAT}.wav`);
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...inputs, '-filter_complex', chains.join(';') + ';' + VOAT.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${VOAT.length}:normalize=0,apad=whole_dur=${T.toFixed(2)},atrim=0:${T.toFixed(2)}[a]`, '-map', '[a]', '-ac', '1', voWav]);
    const lufs = (f, pre = '') => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', pre + 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return +JSON.parse(r.slice(r.lastIndexOf('{'))).input_i; };
    const vI = lufs(voWav), mI = lufs(path.join(WORK, `music_${FORMAT}.wav`), `atrim=0:${T.toFixed(2)},`);
    const vG = -18 - vI, mG = -18 - 14 - mI; console.log('voice', vI.toFixed(1), 'LUFS, music', mI.toFixed(1), 'LUFS: gains', vG.toFixed(1), mG.toFixed(1), 'dB');
    const pre = path.join(WORK, `premix_${FORMAT}.wav`);
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', voWav, '-i', path.join(WORK, `music_${FORMAT}.wav`), '-filter_complex',
      `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},volume=${mG.toFixed(2)}dB,afade=t=in:d=2,afade=t=out:st=${(T - 3).toFixed(2)}:d=3[m];[m][v]amix=inputs=2:duration=first:normalize=0[a]`,
      '-map', '[a]', '-ar', '44100', pre]);
    // the whole mix to -18 LUFS, true peak -2 (measured, then applied linearly)
    const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-18:TP=-2:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, m = JSON.parse(r.slice(r.lastIndexOf('{')));
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', pre, '-af', `loudnorm=I=-18:TP=-2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=44100`, mixWav]);
  }
  await b.close();
  const mp4 = path.join(OUT, `doodle-doggo-kids-bedtime-walk${TALL ? '-tall' : ''}.mp4`);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '22', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k',
    '-movflags', '+faststart', '-t', T.toFixed(2), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
