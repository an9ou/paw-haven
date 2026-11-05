// Kids' episode "Noodle's Bedtime Walk" (docs/marketing/KIDS_SERIES.md, Pilot 2; Build kit there): a wind-down walk through the sketchbook
// town as day turns to night, told by Noodle. Faster since the owner's notes of 4 Nov 2026 (2:23 instead of 3:34) and again on 5 Nov 2026 (about
// 1:59, "end in 2 mins"): voice Kokoro af_bella at 1.0x (vo_bedtime_walk.py, lines "kids"), pauses of about 0.5 s, shorter holds, quicker pans, 0.8 s cross-fades; still calm
// (no flashing, no shake). The yard at dusk (the day render cross-fades into the dusk render), a walk through Maple Woods (walk pose, the
// three-frame line boil), the ducks on the Sunny Park pond, the Lighthouse Pier from dusk to night (its light comes on), five stars over
// the Hilltop Meadow counted one by one with big Caveat numbers, the moon, home: the yard at night with warm windows, a yawn, the Cloud Bed,
// a sleeping Noodle, little z's; then the scene fades to paper (#FFF8EC) and the shared end card (../endcard.js: logo, doodledoggo.app,
// Instagram, X, YouTube) fades in and holds about 4.6 s while the music fades out softly under it.
// The 9:16 cut is a FAST cut for teenagers (about 29 s, Reel pace, voice 1.1x, vo lines "teen" in their own vo dir, 0.5 s cross-fades):
// the hook "POV: your dog's bedtime walk" (Caveat, inside SAFE) from the first frame, dusk, ducks, the stars 1-5 counted fast, bed,
// goodnight, then the tall end card (about 3 s).
// Real art only (PawArt.scene with v2.15 ground art, PawArt.dog, PawArt.bed; the game's own star), no game UI (hotspot tags, run gates and
// hover outlines are taken out of the scenes), no Japanese, no selling words, the logo only on the end card.
//   python3 vo_bedtime_walk.py <kokoro dir> <vo dir> af_bella 1.0 kids      (wide)  /  ... <vo teen dir> af_bella 1.1 teen   (tall)
//   NODE_PATH=$(npm root -g) node brand/kids/bedtime_walk/build_bedtime_walk.js <workdir> <vo dir>
//   FORMAT=wide (16:9, 1920 x 1080, default) or FORMAT=tall (9:16, 1080 x 1920, with the teen vo dir).
//   ONLY=stills: key frames only (WORK/stills; STRIP=t1,t2,... picks the times). ONLY=frames: frames only, no cover, sound or encode.
//   FRAMES=a-b: re-render only those frames over a copy of an earlier full workdir and encode again with the same sound (marketing rule:
//   never re-render a whole video for a fix to one part). The end card is in the last frames: the run prints "end card frames a-b"
//   (wide 3360-3574, tall 595-724 at 25 fps); to change the handles, set IG_HANDLE / X_HANDLE / YT_HANDLE and re-render just those.
//   PAR=n: render the frames in n child processes (each its own browser over a slice), then mix and encode as usual.
//   The thumbnail (wide) and the tall cover are written only when missing or with COVER=1.
// Read-along subtitles: Andika Bold, ink on a cream pill, one short line at a time, centreCheck() on every frame (and safeCheck() in tall).
// Sound: the game's own music and ambience (mods/pawaudio.js _render, a segment per place and time, the lullaby 'sleep' music at the bed)
// about 14 dB under the voice, fade in 2 s, a soft fade out under the end card, the whole mix loudnorm I=-18 TP=-2.
// Output next to this file: doodle-doggo-kids-bedtime-walk[-tall].mp4, bedtime-walk-thumb.jpg (wide), bedtime-walk-cover-tall.jpg (tall).
// REDNOTE=1 (with FORMAT=tall; owner, 5 Nov 2026: "can create reels version for rednote"): the 9:16 cut in Mandarin for RedNote. The voice from
// vo_bedtime_walk_zh.py (zf_073 at 1.1x, the same keys as the teen set), Chinese hook and subtitles in LXGW WenKai, the stars counted a little
// slower (the Chinese numbers are longer), and the RedNote end card endCardRN() from ../endcard.js (logo, 治愈系蜡笔狗狗游戏, 浏览器搜 Doodle Doggo App
// 就能玩: no link, no domain, no handles). Writes doodle-doggo-kids-bedtime-walk-rednote.mp4 and the 3:4 cover brand/rednote/rednote-09-bedtime.jpg.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../../instagram/launch/centre_text.js');
const { ENDCARD_JS, handles, RN_FONT_CSS } = require('../endcard.js');
const ROOT = path.join(__dirname, '..', '..', '..'), OUT = __dirname;
const WORK = path.resolve(process.argv[2] || '/tmp/bedtime_walk'), VO = path.resolve(process.argv[3] || 'vo');
const FORMAT = process.env.FORMAT || 'wide'; if (!['wide', 'tall'].includes(FORMAT)) throw new Error('FORMAT is wide or tall');
const RN = !!process.env.REDNOTE; if (RN && FORMAT !== 'tall') throw new Error('REDNOTE=1 needs FORMAT=tall');
const ZHF = "'LXGW WenKai'";
const TALL = FORMAT === 'tall', W = TALL ? 1080 : 1920, H = TALL ? 1920 : 1080, FPS = 25;
for (const d of ['f', 'bg', 'stills']) fs.mkdirSync(path.join(WORK, d), { recursive: true });
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), VOD = VOJ.dur;
if (RN !== (VOJ.lang === 'zh')) throw new Error(RN ? 'REDNOTE=1 needs the Mandarin vo dir (vo_bedtime_walk_zh.py)' : 'a Mandarin vo dir needs REDNOTE=1');

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

// ---- the timeline: shots that overlap by a cross-fade (0.8 s wide, 0.5 s tall); times inside a shot are relative to its start ----
// cam: keyframes [t, x, y, w] of the view on the scene (its height follows the frame's shape), eased between keyframes
// bgs: the scene's time-of-day renders, a later one fading in over the one before (op(u))
// dogs(u): Noodle as [{ pose, expr, x, y (the feet, scene units), D (scene units per dog-canvas unit), facing, op, walk }]
// say() returns the end of the line, so the next one follows after a short pause (P, about 0.5 s)
const XF = TALL ? 0.5 : 0.8, P = 0.5, SHOTS = [], VOAT = []; let AT = 0;
const shot = (o) => { o.a = AT; o.b = AT + o.len; SHOTS.push(o); AT = o.b - XF; return o; };
const say = (s, k, u) => { if (VOD[k] == null) throw new Error('no voice line ' + k); if (u + VOD[k] > s.len - XF) throw new Error('line ' + k + ' runs past shot ' + s.id); VOAT.push({ k, at: s.a + u }); return u + VOD[k]; };
const at = (s, u) => s.a + u;
const sit = (x, y, D, facing, expr) => ({ pose: 'sit', expr, x, y, D, facing });
const dis = (u, u0, d, A, B) => { const q = sm(seg(u, u0, u0 + d)); return q <= 0 ? [A] : q >= 1 ? [B] : [{ ...A, op: 1 - q }, { ...B, op: q }]; }; // a pose change: a soft dissolve
const walkX = (u, u0, u1, x0, x1) => x0 + (x1 - x0) * seg(u, u0, u1);
const STAR = 'M198.9 110.2L200.6 114.6L205 114.9L201.7 117.9L202.9 122.4L198.9 120.1L195 122.3L195.7 118L192.7 114.9L197 114.3Z'; // the game's night-sky star
const BED = { name: 'Cloud Bed' };
let STARS = null, ZZZ = null, END = null, TITLE = null, e;
// END: paper [a, b] (the scene fades to paper), card [a, b] (the end card fades in, then holds to T). The end card's frames are the last ones,
// from round(END.paper[0] * FPS) to NF - 1: re-render only them with FRAMES=a-b (e.g. new handles) over a copy of the full workdir.

if (!TALL) {
  // owner, 5 Nov 2026: "increase the speed, end in 2 mins": voice 1.0x (was 0.95x), every shot shorter (147 s of shots -> 123 s), the same story
  const s1 = shot({ id: 'yard', len: 19, mus: { place: 'yard', time: 'dusk' }, fx: 'dusk',
    bgs: [{ scene: 'yard', time: 'day' }, { scene: 'yard', time: 'dusk', op: (u) => sm(seg(u, 5.5, 10.5)) }],
    cam: [[0, 120, 135, 820], [19, 160, 148, 770]],
    dogs: (u) => { const A = sit(620, 498, 1, 'right'), B = { pose: 'idle', x: 620, y: 498, D: 1, facing: 'right' };
      if (u < 13.8) return dis(u, 12.8, 0.7, A, B); return [{ pose: 'walk', walk: 1, x: walkX(u, 13.8, 19.8, 620, 820), y: 498, D: 1, facing: 'right' }]; } });
  TITLE = { a: at(s1, 0.6), b: at(s1, 4.4), lines: [{ s: "Noodle's Bedtime Walk", size: 100, maxW: 1300 }], cx: 960, cy: 150 };
  e = say(s1, 'hello', 4.0); e = say(s1, 'sun', e + P); say(s1, 'walk', 10.4);
  const s2 = shot({ id: 'woods', len: 20, mus: { place: 'woods', time: 'dusk' }, fx: 'leaves', bgs: [{ scene: 'woods', time: 'dusk' }],
    cam: [[0, 0, 94, 900], [20, 600, 94, 900]], camLinear: true,
    dogs: (u) => [{ pose: 'walk', walk: 1, x: 430 + 600 * u / 20, y: 478, D: 1, facing: 'right' }] });
  e = say(s2, 'step', 2.0); say(s2, 'leaves', e + P); say(s2, 'step', 11.0);
  const s3 = shot({ id: 'pond', len: 15, mus: { place: 'park', time: 'dusk' }, fx: 'dusk', bgs: [{ scene: 'park', time: 'dusk' }],
    cam: [[0, 160, 140, 800], [15, 110, 140, 800]],
    dogs: (u) => { const A = { pose: 'walk', walk: 1, x: walkX(u, 0, 3.4, 900, 700), y: 480, D: 1, facing: 'left' }; return dis(u, 3.4, 0.7, A, sit(700, 480, 1, 'left', u > 4.2 && u < 9.5 ? 'curious' : undefined)); } });
  e = say(s3, 'ducks0', 4.4); say(s3, 'ducks', e + P);
  const s4 = shot({ id: 'pier', len: 16, mus: { place: 'pier', time: 'dusk' }, mus2: { u: 5, place: 'pier', time: 'night' }, fx: 'dusknight', nightAt: [2.0, 7.5],
    bgs: [{ scene: 'pier', time: 'dusk' }, { scene: 'pier', time: 'night', op: (u) => sm(seg(u, 2.0, 7.5)) }],
    cam: [[0, 0, 20, 960], [16, 70, 20, 960]],
    dogs: (u) => [sit(600, 432, 1, 'left', u > 2.5 && u < 8 ? 'wow' : undefined)] });
  say(s4, 'light', 2.5); say(s4, 'sea', 9.0);
  const s5 = shot({ id: 'hill', len: 26, mus: { place: 'hilltop', time: 'night' }, fx: 'night', bgs: [{ scene: 'hilltop', time: 'night' }],
    cam: [[0, 100, 0, 1000], [13, 100, 0, 1000], [18, 600, 0, 1000], [26, 600, 0, 1000]],
    dogs: (u) => { const A = { pose: 'down', expr: u > 3 && u < 12.5 ? 'wow' : u > 20 ? 'sleepy' : undefined, x: 800, y: 455, D: 1, facing: 'right' };
      return dis(u, 22.2, 0.7, A, { pose: 'idle', expr: 'sleepy', x: 800, y: 455, D: 1, facing: 'right' }); } });
  say(s5, 'count', 1.6);
  STARS = { s: s5, u0: 3.2, gap: 1.9, numsOut: [12.4, 13.4], size: 4.4,
    at: [[255, 62], [405, 168], [600, 58], [800, 150], [960, 40]] }; // scene units (kept clear of the two kites and the moon)
  STARS.at.forEach((_, i) => say(s5, 'n' + (i + 1), STARS.u0 + i * STARS.gap + 0.3));
  e = say(s5, 'moon', 18.6); say(s5, 'home0', e + P);
  const s6 = shot({ id: 'home', len: 27, mus: { place: 'yard', time: 'night' }, mus2: { u: 8, place: 'sleep', time: 'night' }, fx: 'night', bgs: [{ scene: 'yard', time: 'night' }],
    bed: { x: 700, y: 520, B: 0.9 },
    cam: [[0, 150, 150, 800], [7.5, 150, 150, 800], [22, 420, 250, 560]],
    dogs: (u) => { const st = { pose: 'idle', x: 360, y: 520, D: 1, facing: 'right' }, sl = { ...st, expr: 'sleepy' }, yw = { pose: 'yawn', x: 360, y: 520, D: 1, facing: 'right' };
      if (u < 4.2) return dis(u, 3.6, 0.6, { pose: 'walk', walk: 1, x: walkX(u, 0, 3.6, 170, 360), y: 520, D: 1, facing: 'right' }, st);
      if (u < 6.0) return dis(u, 5.0, 0.6, st, sl);
      if (u < 8.3) return dis(u, 6.0, 0.6, sl, yw);
      return dis(u, 8.3, 1.2, yw, { pose: 'sleep', inBed: 1, facing: 'right' }); } });
  say(s6, 'back', 4.0); say(s6, 'yawn', 6.4); say(s6, 'bed', 9.6); e = say(s6, 'night', 12.2); say(s6, 'dreams', e + P);
  ZZZ = { s: s6, u0: 10.6 }; END = { paper: [at(s6, 19.0), at(s6, 21.4)], card: [at(s6, 21.6), at(s6, 22.6)], T: s6.b };
} else {
  // the fast 9:16 cut for teenagers (about 30 s, Reel pace, vo set "teen" at 1.1x): a hook in the first second, dusk, ducks, stars 1-5, bed,
  // goodnight, the end card. Noodle's feet stay above y 1240 (the subtitles sit at y 1360) and the views stay inside each scene (a tall view
  // of a 600-high scene is narrow, so Noodle stands further back than in the wide cut)
  const t1 = shot({ id: 'yard', len: 6, mus: { place: 'yard', time: 'dusk' }, fx: 'dusk',
    bgs: [{ scene: 'yard', time: 'day' }, { scene: 'yard', time: 'dusk', op: (u) => sm(seg(u, 0.2, 4.2)) }],
    cam: [[0, 352, 40, 315], [6, 368, 48, 300]], dogs: () => [sit(520, 400, 1, 'right')] });
  TITLE = { a: -1, b: at(t1, 3.6), lines: [{ s: 'POV:', size: 70, maxW: 690 }, RN ? { s: '狗狗的睡前散步', size: 84, maxW: 690, fam: ZHF } : { s: "your dog's bedtime walk", size: 84, maxW: 690 }], cx: 475, cy: 400 };
  e = say(t1, 'sun', 0.3); say(t1, 'walk', e + 0.3);
  const t2 = shot({ id: 'ducks', len: 4.5, mus: { place: 'river', time: 'dusk' }, fx: 'dusk', bgs: [{ scene: 'river', time: 'dusk' }],
    cam: [[0, 975, 56, 300], [4.5, 975, 60, 296]], dogs: (u) => [sit(1049, 400, 0.85, 'right', u > 0.3 ? 'curious' : undefined)] });
  say(t2, 'ducks', 0.6);
  const t3 = shot({ id: 'hill', len: RN ? 8.6 : 8, mus: { place: 'hilltop', time: 'night' }, fx: 'night', bgs: [{ scene: 'hilltop', time: 'night' }],
    cam: [[0, 600, 4, 330], [8, 606, 8, 324]], dogs: (u) => [{ pose: 'down', expr: u > 1.8 ? 'wow' : undefined, x: 762, y: 376, D: 1, facing: 'right' }] });
  say(t3, 'count', 0.4);
  STARS = { s: t3, u0: 1.9, gap: RN ? 1.15 : 1.0, numsOut: [99, 100], size: 3.4, at: [[661, 105], [759, 96], [701, 175], [814, 163], [747, 236]] };
  STARS.at.forEach((_, i) => say(t3, 'n' + (i + 1), STARS.u0 + i * STARS.gap + 0.2));
  const t4 = shot({ id: 'home', len: RN ? 12.6 : 12, mus: { place: 'yard', time: 'night' }, mus2: { u: 1.5, place: 'sleep', time: 'night' }, fx: 'night', bgs: [{ scene: 'yard', time: 'night' }],
    bed: { x: 640, y: 389, B: 0.72 },
    cam: [[0, 404, 12, 330], [2, 404, 12, 330], [8.5, 512, 70, 250]],
    dogs: (u) => dis(u, 1.4, 0.9, { pose: 'yawn', x: 452, y: 389, D: 1, facing: 'right' }, { pose: 'sleep', inBed: 1, facing: 'right' }) });
  e = say(t4, 'yawn', 0.3); e = say(t4, 'bed', e + 0.3); e = say(t4, 'night', e + 0.4); say(t4, 'dreams', e + 0.3);
  ZZZ = { s: t4, u0: 3.0 }; END = RN ? { paper: [at(t4, 7.4), at(t4, 8.4)], card: [at(t4, 8.5), at(t4, 9.2)], T: t4.b } : { paper: [at(t4, 6.8), at(t4, 8.0)], card: [at(t4, 8.1), at(t4, 8.8)], T: t4.b };
}
const T = END.T, NF = Math.round(T * FPS);

// ---- read-along subtitles: each line in short chunks (at most ~30 letters), timed by each chunk's share of the line ----
const SUBS_TX = { hello: ['Hello, friends.', "It's me, Noodle."], sun: ['The sun is going down.'], walk: ["Let's take one last", 'little walk before bed.'],
  step: ['Step, step, step.'], leaves: ['Can you hear the leaves?'], ducks0: ['The ducks are sleepy too.'], ducks: ['Goodnight, ducks.', 'Sleep tight.'],
  light: ['Look, the lighthouse', 'is turning on its light.'], sea: ['Goodnight, sea.'], count: ["Let's count the stars."],
  n1: ['1.'], n2: ['2.'], n3: ['3.'], n4: ['4.'], n5: ['5.'], moon: ["There's the moon."], home0: ["It's time to go home."],
  back: ['Back home.'], yawn: ['A big yawn.'], bed: ['A soft bed.'], night: ['Goodnight, friends.'], dreams: ['Sweet dreams.'] };
if (RN) Object.assign(SUBS_TX, { sun: ['太阳要下山啦。'], walk: ['最后再散一次步。'], ducks: ['鸭鸭们，晚安。'], count: ['来，数星星。'], yawn: ['打个大哈欠。'],
  bed: ['然后，睡觉。'], night: ['朋友们，晚安。'], dreams: ['做个好梦。'] }); // vo_bedtime_walk_zh.py, line by line
else if (TALL) Object.assign(SUBS_TX, { sun: ["Sun's going down."], walk: ['One last walk.'], ducks: ['Night night, ducks.'], count: ['Okay. Stars.'], bed: ['And... bed.'] }); // vo set "teen"
const SUBS = [];
VOAT.slice().sort((a, b) => a.at - b.at).forEach((v) => { const parts = SUBS_TX[v.k];
  const norm = (x) => RN ? x.replace(/[^\u4e00-\u9fff]/g, '') : x.replace(/[^a-z]/gi, '').toLowerCase();
  if (norm(parts.join(' ')) !== norm(VOJ.text[v.k]) && !/^n\d$/.test(v.k)) throw new Error('subtitles differ from the voice: ' + v.k);
  const wt = parts.map((x) => (RN ? x.replace(/[，。！：、]/g, '').length * 2 : x.length) + (/[.!?。！]$/.test(x) ? 6 : 2)), sum = wt.reduce((a, b) => a + b, 0); let t0 = v.at;
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
// the overlay (screen units): the title, the big star numbers, the z's, the subtitle, the fade to paper and the shared end card (../endcard.js)
const SUB = TALL ? { cx: 475, y: 1360, size: 58, maxW: 800, fam: RN ? ZHF : 'Andika' } : { cx: 960, y: 975, size: 60, maxW: 1500 };
const LOGO_SVG = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<title>[^<]*<\/title>/, ''));
const LOGO_INNER = LOGO_SVG.replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, ''); // the end card's logo: no paper rect
function overlay(t, frames) {
  const o = { title: null, nums: [], zzz: [], endPaper: 0, card: 0, sub: null, paper: TALL ? 0 : r3(1 - sm(seg(t, 0, 1.6))) };
  if (TITLE && t > TITLE.a && t < TITLE.b) { const fi = TALL ? 0 : 1.0, fo = TALL ? 0.4 : 1.0; // tall: the hook is on screen from the first frame
    o.title = { ...TITLE, op: r3(Math.min(TALL ? 1 : sm(seg(t, TITLE.a, TITLE.a + fi)), 1 - sm(seg(t, TITLE.b - fo, TITLE.b)))) }; }
  const fs5 = frames.find((f) => STARS && SHOTS[f.id] === STARS.s);
  if (fs5) { const v = fs5.v, out = 1 - sm(seg(t - STARS.s.a, STARS.numsOut[0], STARS.numsOut[1]));
    STARS.at.forEach(([x, y], i) => { const q = eo3(seg(t, starOn(i) + 0.15, starOn(i) + 1.0)) * out; if (q <= 0) return;
      const sx = (x - v.x) * v.k, sy = (y - v.y) * v.k, r = 30 * STARS.size / 4.4 * v.k;
      o.nums.push({ s: (i + 1) + '.', x: f1(sx + r * 1.15), y: f1(sy + r * 0.95), op: r3(q), size: TALL ? 112 : 120 }); }); }
  const fz = frames.find((f) => f.head && ZZZ && SHOTS[f.id] === ZZZ.s);
  if (fz) { const v = fz.v, hx = (fz.head[0] - v.x) * v.k, hy = (fz.head[1] - v.y) * v.k, u = t - ZZZ.s.a;
    for (let j = 0; j < 4; j++) { const t0 = ZZZ.u0 + j * 1.9, period = 7.6; let q = (u - t0) / 5.2; if (u < t0) continue; q = ((u - t0) % period) / 5.2; if (q > 1) continue;
      const fade = 1 - sm(seg(t, END.paper[0] - 1.5, END.paper[0] + 0.5));
      o.zzz.push({ x: f1(TALL ? Math.min(800, hx - 70 - q * 90 + Math.sin(q * 5 + j) * 14) : hx + 20 + q * 120 + Math.sin(q * 5 + j) * 14), y: f1(hy - 70 - q * 200), size: Math.round((TALL ? 80 : 74) * (0.7 + 0.6 * q)), op: r3(Math.min(sm(q * 4), 1 - sm(seg(q, 0.6, 1))) * fade) }); } }
  o.endPaper = r3(sm(seg(t, END.paper[0], END.paper[1])));
  o.card = r3(sm(seg(t, END.card[0], END.card[1])));
  const u = SUBS.find((x) => t >= x.a && t < x.b);
  if (u && o.endPaper < 0.5) o.sub = { s: u.s, op: r3(Math.min(sm((t - u.a) / 0.25), sm((u.b - t) / 0.3))) };
  return o;
}

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">${RN ? `<link href="${RN_FONT_CSS}" rel="stylesheet">` : ''}
<style>html,body{margin:0;background:${PAPER}}#st{position:relative;width:${W}px;height:${H}px;overflow:hidden;background:${PAPER}}.slot{position:absolute;left:0;top:0;width:${W}px;height:${H}px}
.slot img{position:absolute;left:0;top:0;transform-origin:0 0;display:none}.slot .sv{position:absolute;left:0;top:0}svg{display:block}.hide{display:none}#ov{position:absolute;left:0;top:0;z-index:100}</style>
<div id="st"><div class="slot" id="s0"><img><img><div class="sv"></div></div><div class="slot" id="s1"><img><img><div class="sv"></div></div>
<svg id="ov" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg></div><span style="font:700 20px Andika">a</span><span style="font:700 20px Caveat">a</span>
<script>
${CENTRE_JS}
${SAFE_JS}
${ENDCARD_JS}
const LOGO=${JSON.stringify(LOGO_SVG)}, LOGO_INNER=${JSON.stringify(LOGO_INNER)}, HANDLES=${JSON.stringify(handles())}, SUB=${JSON.stringify(SUB)}, TALL=${TALL}, RN=${RN}, W=${W}, H=${H};
let CARD=null; // the end card (endCard() from ../endcard.js), made once the fonts are in
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
  if(o.title){ const T_=o.title, n=T_.lines.length, sz=T_.lines.map((l)=>fitSize(l.s,l.size,l.fam||'Caveat',l.maxW)), gap=10, hs=sz.map((z)=>Math.round(z*1.35));
    let y=T_.cy-(hs.reduce((a,b)=>a+b,0)+gap*(n-1))/2; g+='<g opacity="'+T_.op+'"><g transform="rotate('+(TALL?-2:-1.5)+' '+T_.cx+' '+T_.cy+')">';
    T_.lines.forEach((l,i)=>{ g+=pill(l.s,T_.cx,y+hs[i]/2,sz[i],l.fam||'Caveat',{fill:i===0&&n>1?'#FFE3A1':'#FFFDF7',padX:46}); y+=hs[i]+gap; }); g+='</g></g>'; }
  for(const n of o.nums) g+='<g opacity="'+n.op+'" stroke="#5B3D32" stroke-width="9" stroke-linejoin="round" paint-order="stroke">'+centred([{s:n.s,size:n.size,fill:'#FFF3C4'}],n.x,n.y,'Caveat').svg+'</g>';
  for(const z of o.zzz) g+='<text x="'+z.x+'" y="'+z.y+'" font-family="Caveat" font-weight="700" font-size="'+z.size+'" fill="#FFF8EC" stroke="#5B3D32" stroke-width="5" paint-order="stroke" stroke-linejoin="round" opacity="'+z.op+'">Z</text>';
  if(o.sub){ const fam=SUB.fam||'Andika', size=fitSize(o.sub.s,SUB.size,fam,SUB.maxW); g+=pill(o.sub.s,SUB.cx,SUB.y,size,fam,{fill:'#FFFDF7',stroke:'#5B3D32',color:'#5B3D32',padX:34,op:(0.97*o.sub.op).toFixed(3)}); }
  if(o.endPaper>0) g+='<rect width="'+W+'" height="'+H+'" fill="${PAPER}" opacity="'+o.endPaper+'"/>';
  if(o.card>0){ if(!CARD) CARD=RN?endCardRN('tall', LOGO_INNER):endCard(TALL?'tall':'wide', HANDLES, LOGO_INNER); g+='<g opacity="'+o.card+'">'+CARD+'</g>'; }
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
  if (RN) await p.evaluate((txt) => document.fonts.load('700 40px "LXGW WenKai"', txt), Object.values(SUBS_TX).flat().join('') + '狗狗的睡前散步治愈系蜡笔狗狗游戏浏览器搜 Doodle Doggo App 就能玩');
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
    const o = { title: null, nums: [], zzz: [], endPaper: 0, card: 0, sub: null, paper: 0 };
    if (TALL) o.pre = '<defs><linearGradient id="skyb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#262B4A"/><stop offset=".86" stop-color="#3A4472"/><stop offset="1" stop-color="#3A4472" stop-opacity="0"/></linearGradient>'
      + '<linearGradient id="grb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6F7B6A" stop-opacity="0"/><stop offset=".16" stop-color="#6F7B6A"/><stop offset="1" stop-color="#4E5A4C"/></linearGradient></defs>'
      + '<rect x="0" y="0" width="1080" height="288" fill="url(#skyb)"/><rect x="0" y="1640" width="1080" height="280" fill="url(#grb)"/>';
    o.extra = await p.evaluate((tall) => { const cx = tall ? 475 : 560, y = tall ? 800 : 250, size = tall ? (RN ? 120 : 140) : 190;
      const t = '<g transform="rotate(-3 ' + cx + ' ' + y + ')">' + pill(RN ? '睡前散步' : 'Bedtime Walk', cx, y, size, RN ? "'LXGW WenKai'" : 'Caveat', { fill: '#FFFDF7', padX: 52 }) + '</g>';
      const lw = tall ? 300 : 400, lh = lw * 280 / 900, lx = tall ? 230 - lw / 2 : 1920 - lw - 56, ly = tall ? 330 - lh / 2 : 1080 - lh - 48;
      return t + '<g data-safe><defs><clipPath id="cl2"><rect x="' + lx + '" y="' + ly + '" width="' + lw + '" height="' + lh + '" rx="' + lh * 0.22 + '"/></clipPath></defs>'
        + '<g clip-path="url(#cl2)"><svg x="' + lx + '" y="' + ly + '" width="' + lw + '" height="' + lh + '" viewBox="0 0 900 280">' + LOGO + '</svg></g><rect x="' + lx + '" y="' + ly + '" width="' + lw + '" height="' + lh + '" rx="' + lh * 0.22 + '" fill="none" stroke="#5B3D32" stroke-width="5"/></g>'; }, TALL);
    const err = await p.evaluate(([f, o]) => window.frame(f, o), [fr, o]); if (err) throw new Error('cover: ' + err);
    // RedNote: the 3:4 cover is the middle 1080 x 1440 of the tall cover (y 240..1680), where everything that matters already sits
    await p.screenshot({ path: file, type: 'jpeg', quality: 92, ...(RN ? { clip: { x: 0, y: 240, width: 1080, height: 1440 } } : {}) }); console.log('wrote', file); };
  const coverFile = RN ? path.join(ROOT, 'brand', 'rednote', 'rednote-09-bedtime.jpg') : path.join(OUT, TALL ? 'bedtime-walk-cover-tall.jpg' : 'bedtime-walk-thumb.jpg'); // kept as it is unless COVER=1 (or missing)
  if (process.env.ONLY !== 'frames' && (process.env.COVER === '1' || !fs.existsSync(coverFile))) await coverPage(coverFile);

  if (process.env.ONLY === 'stills') {
    const ts = process.env.STRIP ? process.env.STRIP.split(',').map(Number) : SHOTS.flatMap((s) => [s.a + 2.2, (s.a + s.b) / 2, s.b - XF - 0.6]).concat(STARS ? [starOn(4) + 1.5] : [], [END.paper[0] + 1.2, END.card[0] + 0.4, T - 0.1]).sort((a, b) => a - b);
    for (const [j, t] of ts.entries()) { await render(t, path.join(WORK, 'stills', `${FORMAT}_${String(j).padStart(2, '0')}_${t.toFixed(1)}.png`)); }
    console.log(ts.length, 'stills, T =', T.toFixed(2)); await b.close(); return;
  }
  const [FA, FB] = process.env.FRAMES ? process.env.FRAMES.split('-').map(Number) : [0, NF];
  const t0 = Date.now(), PAR = +process.env.PAR || 1;
  console.log('T =', T.toFixed(2), 's,', NF, 'frames; end card frames', Math.round(END.paper[0] * FPS) + '-' + (NF - 1));
  if (PAR > 1 && !process.env.FRAMES) { // PAR=n: n child processes, each its own browser over a slice of the frames (ONLY=frames: frames, no sound)
    const n = Math.ceil(NF / PAR); await Promise.all(Array.from({ length: PAR }, (_, i) => new Promise((ok, no) => {
      const c = cp.spawn(process.execPath, [__filename, WORK, VO], { env: { ...process.env, PAR: '', ONLY: 'frames', FRAMES: `${i * n}-${Math.min(NF, (i + 1) * n)}` }, stdio: 'inherit' });
      c.on('exit', (code) => code ? no(new Error('frames part ' + i + ' failed')) : ok()); })));
  } else for (let fi = FA; fi < Math.min(FB, NF); fi++) { await render(fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.png`));
    if (fi % 250 === 0 || fi === FA) console.log('frame', fi, '/', NF, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); }
  await p.close();
  if (process.env.ONLY === 'frames') { await b.close(); return; }

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
      `[0:a]aresample=44100,volume=${vG.toFixed(2)}dB,aformat=channel_layouts=stereo[v];[1:a]atrim=0:${T.toFixed(2)},volume=${mG.toFixed(2)}dB,afade=t=in:d=2,afade=t=out:st=${(END.card[0] - 0.6).toFixed(2)}:d=${(T - END.card[0] + 0.6).toFixed(2)}[m];[m][v]amix=inputs=2:duration=first:normalize=0[a]`,
      '-map', '[a]', '-ar', '44100', pre]);
    // the whole mix to -18 LUFS, true peak -2 (measured, then applied linearly)
    const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', pre, '-af', 'loudnorm=I=-18:TP=-2:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr, m = JSON.parse(r.slice(r.lastIndexOf('{')));
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', pre, '-af', `loudnorm=I=-18:TP=-2:LRA=11:measured_I=${m.input_i}:measured_TP=${m.input_tp}:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}:offset=${m.target_offset}:linear=true,aresample=44100`, mixWav]);
  }
  await b.close();
  const mp4 = path.join(OUT, `doodle-doggo-kids-bedtime-walk${RN ? '-rednote' : TALL ? '-tall' : ''}.mp4`);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.png'), '-i', mixWav, '-map', '0:v', '-map', '1:a',
    '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '22', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k',
    '-movflags', '+faststart', '-t', T.toFixed(2), mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString();
  console.log('wrote', mp4, d.toFixed(2) + ' s', (fs.statSync(mp4).size / 1e6).toFixed(1) + ' MB');
})().catch((e) => { console.error(e); process.exit(1); });
