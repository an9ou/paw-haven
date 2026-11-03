// Kids' episode "How to say hello to a dog" (Dog manners, ep. 1): docs/marketing/KIDS_SERIES.md, Pilot 1 (the FINAL script table, checked against
// Dogs Trust, the Royal Kennel Club, the AVMA and HSE Ireland) and its Build kit. Told by Noodle (vo_dog_manners.py: Kokoro af_bella at 0.9x).
// The friendly dog is Bagel the Beagle; the child is "you": the game's own crayon hand (the trick-signal hands, as in the cuddle Reel) coming in
// from the bottom edge, gentle and slow; the dog's grown-up is a lead from Bagel's collar running up out of the frame and a speech bubble from the top.
// Real art only (PawArt.dog with the v2.13 faces, PawArt.scene, .prop, .bed), no game UI, no Japanese, nothing sold inside the episode (the small
// logo only on the last card). Calm: slow camera, 1 s cross-fades, no hard cuts, no flashing, no shake; depth as in munch_reel/build_munch.js (a soft
// scene behind, contact shadows, slow light motes, layers that move at their own speeds).
//
//   NODE_PATH=$(npm root -g) node brand/kids/dog_manners/build_dog_manners.js <workdir> <vo dir>
//   FORMAT=wide (16:9 1920 x 1080, default, the whole episode, ~2.5 min) | tall (9:16 1080 x 1920, the 45-60 s cut: the same voice clips, fewer of them)
//   ONLY=stills: key frames only (STRIP=t1,t2,.. picks the times); ONLY=covers: the thumbnail (wide) or the tall cover only
//   FRAMES=a-b: re-render only those frames over a workdir copied from an earlier full render, then encode again (marketing rule)
//   PAR=n: frames rendered on n pages at once (default 3)
// Outputs next to this file: doodle-doggo-kids-dog-manners.mp4, doodle-doggo-kids-dog-manners-tall.mp4, dog-manners-thumb.jpg, dog-manners-cover-tall.jpg.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../../instagram/launch/centre_text.js');
const ROOT = path.join(__dirname, '..', '..', '..'), OUT = __dirname;
const TALL = (process.env.FORMAT || 'wide') === 'tall';
const WORK = path.resolve(process.argv[2] || '/tmp/dog_manners') + (TALL ? '/tall' : '/wide'); fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const VO = path.resolve(process.argv[3] || 'vo');
const VOJ = JSON.parse(fs.readFileSync(path.join(VO, 'vo.json'), 'utf8')), D = VOJ.dur;
const W = TALL ? 1080 : 1920, H = TALL ? 1920 : 1080, FPS = 25;
const INK = '#5B3D32', MUTED = '#8A7468', PAPER = '#FFF8EC', CREAM = '#FFFDF7', PINK = '#F28FA5';
const AND = 'Andika', CAV = 'Caveat';

// ---- the game's art ----
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', ...'abcdefg'.split('').map((c) => `world/pawart_world_${c}.js`)]) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
const PA = win.PawArt;
const inner = (svg) => svg.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const f1 = (n) => Math.round(n * 10) / 10, r3 = (n) => Math.round(n * 1000) / 1000;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const eo3 = (x) => 1 - Math.pow(1 - clamp(x), 3), eio = (x) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const ss = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const lerp = (a, b, q) => a + (b - a) * q;
const pop = (x) => { x = clamp(x); const c1 = 1.2, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); }; // a soft overshoot, not a bounce
const env = { time: 'day', weather: 'sunny', season: 'autumn', halloween: false, jp: false };
const BAGEL = 'beagle', NOODLE = 'dachs', COLLAR = { neck: 'Jingle Bell Collar' };
const env_env = env;

// ---- layout per format ----
const LY = TALL ? {
  G: 1260, K: 3.8, KN: 3.4, BX: 600, NX: 475, subY: 1385, subCX: 475, subSize: 58, subMax: 790,
  label: { x: 250, y: 318, size: 60, big: { x: 475, y: 560, sc: 1.45 } }, nums: [[145, 470], [315, 470], [485, 470]], numR: 76, numSize: 112,
  child: { x: 318, y: 640, tail: [125, 790], size: 54 }, adult: { x: 330, y: 455, tail: [420, 345], size: 64 }, leadTop: [1000, -80],
  title: { x: 475, y: 600 }, cards: { x: 475, y0: 390, dy: 165, w: 720, h: 140, size: 84 }, recapN: { x: 475, g: 1330, k: 2.7 },
  logo: { x: 475, y: 470, w: 520 },
  views: { hello: '120 160 260 462', yard: '470 160 260 462', house: '250 120 300 533' },
} : {
  G: 845, K: 3.3, KN: 3.2, BX: 1200, NX: 960, subY: 975, subCX: 960, subSize: 60, subMax: 1500,
  label: { x: 330, y: 105, size: 68, big: { x: 960, y: 330, sc: 1.6 } }, nums: [[430, 330], [640, 330], [850, 330]], numR: 88, numSize: 130,
  child: { x: 520, y: 560, tail: [610, 760], size: 60 }, adult: { x: 1500, y: 190, tail: [1330, -10], size: 66 }, leadTop: [1330, -80],
  title: { x: 960, y: 290 }, cards: { x: 650, y0: 215, dy: 165, w: 800, h: 140, size: 92 }, recapN: { x: 1480, g: 845, k: 3.0 },
  logo: { x: 960, y: 180, w: 620 },
  views: { hello: '20 100 880 495', yard: '250 160 700 394', house: '120 110 760 428' },
};

// ---- the timeline: beats (each with its place) and Noodle's lines; the tall cut keeps fewer lines (same clips, same words) ----
const TALL_SET = new Set(['hi1', 'hi2', 'ask1', 'still1', 'still2', 'pet1', 'one', 'two', 'three', 'stop', 'go1', 'go2', 'rc1', 'rc2', 'rc3', 'rc4', 'bye1', 'bye2']);
const has = (k) => !TALL || TALL_SET.has(k);
const GAP = TALL ? 0.45 : 0.7, HS = TALL ? 0.6 : 1; // the pause between lines; holds are shorter in the tall cut
const BEATS = [], AT = {}, M = {}; let at = 0;
const beat = (id, place) => { BEATS.push({ id, place, a: at }); };
const say = (k, gap = GAP) => { if (!has(k)) return; AT[k] = at; at += D[k] + gap; };
const hold = (s) => { at += s; }, mark = (n) => { M[n] = at; };
beat('hello', 'hello'); hold(TALL ? 0.3 : 1.0); mark('nIn0'); hold(TALL ? 0 : 3.4); mark('nIn1'); hold(TALL ? 0.2 : 0.4);
say('hi1', TALL ? GAP : 0.9); say('hi2', TALL ? GAP : 0.9); say('hi3', 0.6); mark('title0'); hold(TALL ? 0.2 : 4.6);
const LAB = TALL ? 0.9 : 3.2;
beat('ask', 'yard'); hold(0.5); mark('lab'); hold(LAB);
say('ask1', 0.2); mark('yes'); hold(TALL ? 1.0 : 2.0); say('ask2', 0.9); mark('wave0'); say('ask3', 0); hold(TALL ? 1.6 : 3.2); mark('askEnd');
beat('still', 'yard'); hold(0.5); mark('lab2'); hold(LAB);
mark('handIn'); say('still1', TALL ? 0.35 : 1.4); mark('walk0'); say('still2', 0); hold(Math.max(GAP, (TALL ? 3.0 : 4.4) - D.still2)); mark('sniff');
say('still3', 1.4); mark('sitDown'); say('still4', 0); hold(TALL ? 1.1 : 2.6);
beat('pet', 'yard'); hold(0.5); mark('lab3'); hold(LAB);
mark('reach0'); say('pet1', TALL ? 0.6 : 1.0); say('pet2', 1.2);
const SP = TALL ? 1.75 : 2.4; mark('s0'); { const s0 = at; at = s0 + 0.55; say('one', 0); at = s0 + SP + 0.55; say('two', 0); at = s0 + 2 * SP + 0.55; say('three', 0); at = s0 + 3 * SP + 0.2; }
mark('s1'); say('stop', TALL ? 0.6 : 1.0); mark('ask2b'); say('pet3', 0.6); mark('lean'); say('pet4', 0.35); say('pet5', 0); hold(TALL ? 1.5 : 3.0); mark('petEnd');
beat('go', 'yard'); hold(0.5); mark('lab4'); hold(LAB);
mark('go0'); say('go1', TALL ? 0.5 : 1.0); say('go2', TALL ? 0.4 : 1.4); say('go3', 0); hold(TALL ? 0.9 : 3.0);
if (!TALL) { beat('bed', 'house'); hold(2.0); say('also1', 0); hold(1.8); beat('bowl', 'yard'); hold(1.0); say('also2', 0); hold(3.2); }
beat('recap', 'hello'); hold(TALL ? 0.7 : 1.0); say('rc0', 1.0); for (const i of [1, 2, 3, 4]) { mark('rc' + i); say('rc' + i, TALL ? 0.5 : 1.4); } hold(TALL ? 0.6 : 2.0);
beat('bye', 'hello'); hold(0.8); say('bye1', TALL ? 0.6 : 1.0); hold(TALL ? 0.4 : 1.2);
beat('night', 'house'); hold(TALL ? 0.9 : 1.4); say('bye2', TALL ? 0.6 : 0.9); mark('logo'); hold(TALL ? 2.3 : 5.5);
const T = at, N = Math.round(T * FPS);
BEATS.forEach((b, i) => { b.b = i + 1 < BEATS.length ? BEATS[i + 1].a : T; });
console.log(TALL ? 'tall' : 'wide', 'T =', T.toFixed(2), 's,', N, 'frames;', BEATS.map((b) => b.id + ' ' + b.a.toFixed(1)).join(', '));

// ---- read-along subtitles: one short line at a time, each timed by its share of its clip (letters, plus a breath at a stop) ----
const SUBS_TX = {
  hi1: ['Hi, friends!', "I'm Noodle."], hi2: ["Today I'll show you", 'how to say hello to a dog.'], hi3: ['Gently!'],
  ask1: ['Before you pet a dog,', "ask the dog's grown-up:", 'may I say hello?'], ask2: ['If they say no,', "that's okay."], ask3: ['We can wave instead!'],
  still1: ['Stand still,', 'with your hands down.'], still2: ['Let the dog come to you', 'and sniff.'], still3: ['Sniffing is how', 'dogs say hello!'],
  still4: ["If the dog doesn't come,", "that's okay too."],
  pet1: ['Pet softly,', 'on the shoulder or the side.'], pet2: ['Not the face.'], one: ['One,'], two: ['One, two,'], three: ['One, two, three...'], stop: ['then stop.'],
  pet3: ['Does the dog want more?'], pet4: ['It leans in.'], pet5: ['Yes, please!'],
  go1: ['If the dog walks away,', 'it means:', "that's enough for now."], go2: ['Let it go.'], go3: ["That's being a good friend."],
  also1: ['And when a dog is sleeping,'], also2: ['or eating, we let it be.'],
  rc0: ["Let's say it together!"], rc1: ['One: ask first.'], rc2: ['Two: stand still.'], rc3: ['Three: pet softly.'], rc4: ['Four: let it go.'],
  bye1: ['Bye-bye, friends!'], bye2: ['See you next time.'],
};
// the subtitles say exactly what Noodle says (the script's words): checked against the voice text
for (const [k, parts] of Object.entries(SUBS_TX)) { const said = VOJ.text[k].replace(/\s+/g, ' ').trim(), shown = (['two', 'three'].includes(k) ? [parts[0].split(', ').pop()] : parts).join(' ');
  if (said !== shown) throw new Error('subtitle for ' + k + ' is not the line: "' + shown + '" vs "' + said + '"'); }
const SUBS = [];
Object.keys(AT).sort((a, b) => AT[a] - AT[b]).forEach((k) => { const parts = SUBS_TX[k];
  const wt = parts.map((x) => x.length + (/[.!?:,]$/.test(x) ? 5 : 2)), sum = wt.reduce((a, b) => a + b, 0); let t0 = AT[k];
  parts.forEach((x, i) => { const d = D[k] * wt[i] / sum; SUBS.push({ a: t0, b: t0 + d, s: x, k, i }); t0 += d; }); });
SUBS.forEach((u, i) => { const nx = SUBS[i + 1]; u.b = nx ? Math.min(nx.a, u.b + 0.45) : Math.min(T, u.b + 0.8); });
const subAt = (k, i) => (SUBS.find((u) => u.k === k && u.i === i) || {}).a;

// ---- art pieces ----
const HEART = (x, y, sc, rot, op) => `<path transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${r3(sc)})" d="M0 12 C-14 0 -26 -6 -26 -18 C-26 -30 -12 -34 0 -22 C12 -34 26 -30 26 -18 C26 -6 14 0 0 12 Z" fill="${PINK}" stroke="${INK}" stroke-width="${r3(3.2 / sc)}" stroke-linejoin="round" opacity="${r3(op)}"/>`;
// the player's crayon hands: the open hand (the "dance" trick signal, its wavy lines and note clipped off) and the flat hand (the "down" signal, its
// arrow and motion ticks taken off); pc = the palm centre, cuff = the two ends of the cuff line on the 120 x 120 prop (the sleeve runs from there)
const HANDS = {
  open: { g: `<defs><clipPath id="hcO"><rect x="18" y="0" width="74" height="120"/></clipPath></defs><g clip-path="url(#hcO)">${inner(PA.prop('hand-signal', { trick: 'dance' }))}</g>`, pc: [58.8, 74.4], cuff: [[55.2, 111.5], [86.8, 100]] },
  flat: { g: inner(PA.prop('hand-signal', { trick: 'down' })).replace(/<path[^>]*fill="#(?:F28FA5|A8968A)"[^>]*\/>/g, ''), pc: [58, 62], cuff: [[18, 40], [18, 77]] },
};
const HU = TALL ? 3.3 : 2.75; // the hand's scale on screen: a child's hand, near the camera
// h = { kind, x, y (the palm centre on screen), r (degrees), mir, s }: the sleeve runs from the cuff down past the bottom edge (the child stands in front)
const handSVG = (h) => { if (!h) return ''; const A = HANDS[h.kind], s = (h.s || 1) * HU, c = Math.cos(h.r * Math.PI / 180), sn = Math.sin(h.r * Math.PI / 180), mx = h.mir ? -1 : 1;
  const P = ([px, py]) => { const dx = (px - A.pc[0]) * s * mx, dy = (py - A.pc[1]) * s; return [h.x + dx * c - dy * sn, h.y + dx * sn + dy * c]; };
  let [c1, c2] = A.cuff.map(P); const m = [(c1[0] + c2[0]) / 2, (c1[1] + c2[1]) / 2], lean = h.lean == null ? 0.12 : h.lean, dl = Math.hypot(lean, 1), d = [lean / dl, 1 / dl], p = [d[1], -d[0]];
  if ((c1[0] - m[0]) * p[0] + (c1[1] - m[1]) * p[1] < 0) [c1, c2] = [c2, c1];
  const len = (H + 260 - m[1]) / d[1], mb = [m[0] + d[0] * len, m[1] + d[1] * len], hw = Math.hypot(c1[0] - c2[0], c1[1] - c2[1]) / 2 * 1.45;
  const b1 = [mb[0] + p[0] * hw, mb[1] + p[1] * hw], b2 = [mb[0] - p[0] * hw, mb[1] - p[1] * hw];
  const q = (v) => f1(v[0]) + ',' + f1(v[1]), fold = [lerp(m[0], mb[0], 0.18) + p[0] * hw * 0.25, lerp(m[1], mb[1], 0.18) + p[1] * hw * 0.25];
  return `<g filter="url(#handsoft)"><polygon points="${q(c1)} ${q(b1)} ${q(b2)} ${q(c2)}" fill="#B9D4F3" stroke="#4A332B" stroke-width="${f1(2.4 * s)}" stroke-linejoin="round"/>`
    + `<path d="M${q(fold)} l${f1(-p[0] * hw * 0.5 + d[0] * 40)} ${f1(-p[1] * hw * 0.5 + d[1] * 40)}" stroke="#4A332B" stroke-width="${f1(1.6 * s)}" opacity=".3" stroke-linecap="round"/>`
    + `<g transform="translate(${f1(h.x)} ${f1(h.y)}) rotate(${f1(h.r)}) scale(${r3(s * mx)} ${r3(s)}) translate(${-A.pc[0]} ${-A.pc[1]})">${A.g}</g></g>`; };

const cache = {};
// the art draws each pose three times (.pa-d-f0/1/2, the game's line boil, three times a second): keep exactly one
const dogArt = (key, pose, expr, facing, outfit, fr) => { const ck = [key, pose, expr, facing, outfit ? 1 : 0, fr].join('|');
  return cache[ck] || (cache[ck] = inner(PA.dog(key, { pose, expr, anim: true, facing, outfit })).replace(/class="pa-d-f(\d)"/g, (m0, dd) => (+dd === fr ? m0 : 'class="hide"'))); };
const MEAS = {}; // per pose/facing/outfit: the drawn box and the collar on the 240 x 200 canvas (filled in the page, below)
const mkey = (key, pose, facing, outfit) => [key, pose, facing, outfit ? 1 : 0].join('|');
const GY = 188;
// d = { key, pose, expr, facing, x (canvas centre on screen), g (feet y), k, lean (deg), dx, bob, outfit }
const dogSVG = (d, fr, shadow = true) => { const k = d.k, x0 = d.x - 120 * k, y0 = d.g - GY * k - (d.bob || 0), mm = MEAS[mkey(d.key, d.pose, d.facing, d.outfit)];
  const bw = mm ? mm.box[2] : 150, bcx = mm ? mm.box[0] + mm.box[2] / 2 : 120, scx = d.x + (bcx - 120) * k;
  let s = shadow ? `<ellipse cx="${f1(scx + (d.dx || 0))}" cy="${f1(d.g + 5)}" rx="${f1(bw * 0.5 * k)}" ry="${f1(10 + 3.2 * k)}" fill="#3A2A22" opacity="${r3((d.sop == null ? 1 : d.sop) * 0.28)}" filter="url(#shadow)"/>` : '';
  s += `<g transform="translate(${f1(d.dx || 0)} 0) rotate(${f1(d.lean || 0)} ${f1(d.x)} ${f1(d.g)})"><svg x="${f1(x0)}" y="${f1(y0)}" width="${f1(240 * k)}" height="${f1(200 * k)}" viewBox="0 0 240 200" overflow="visible">${dogArt(d.key, d.pose, d.expr, d.facing, d.outfit, fr)}</svg></g>`;
  return s; };
const onDog = (d, [u, v]) => { const a = (d.lean || 0) * Math.PI / 180, x = d.x + (u - 120) * d.k + (d.dx || 0), y = d.g - (GY - v) * d.k - (d.bob || 0); // a canvas point on screen, with the lean
  const ox = x - d.x - (d.dx || 0), oy = y - d.g; return [d.x + (d.dx || 0) + ox * Math.cos(a) - oy * Math.sin(a), d.g + ox * Math.sin(a) + oy * Math.cos(a)]; };
// the lead: from the collar ring up out of the top of the frame (the grown-up holds it); a slack crayon line in the collar's red
const leadSVG = (d, top, part) => { const mm = MEAS[mkey(d.key, d.pose, d.facing, d.outfit)]; if (!mm || !mm.collar) return '';
  const P = onDog(d, mm.collar), Q = top, C = [lerp(P[0], Q[0], 0.25) + 40, lerp(P[1], Q[1], 0.55)];
  const path_ = `M${f1(P[0])} ${f1(P[1])} Q${f1(C[0])} ${f1(C[1])} ${f1(Q[0])} ${f1(Q[1])}`;
  if (part === 'line') return `<path d="${path_}" fill="none" stroke="${INK}" stroke-width="${f1(3.3 * d.k)}" stroke-linecap="round"/><path d="${path_}" fill="none" stroke="#E2403A" stroke-width="${f1(1.8 * d.k)}" stroke-linecap="round"/>`;
  return `<circle cx="${f1(P[0])}" cy="${f1(P[1])}" r="${f1(2.6 * d.k)}" fill="#D8D2C8" stroke="${INK}" stroke-width="${f1(1.1 * d.k)}"/>`; };
const BEDS = { bagel: 'Plaid Pillow', noodle: 'Fluffy Donut Bed' };
const BED_ART = {}; for (const b of Object.values(BEDS)) BED_ART[b] = inner(PA.bed(b));
const bedSVG = (name, x, floor, kb, front) => { const s = `<svg x="${f1(x - 130 * kb)}" y="${f1(floor - 152 * kb)}" width="${f1(260 * kb)}" height="${f1(160 * kb)}" viewBox="0 0 260 160" overflow="visible">${BED_ART[name]}</svg>`;
  return front ? `<g class="bedfront">${s}</g>` : `<ellipse cx="${f1(x)}" cy="${f1(floor - 2)}" rx="${f1(120 * kb)}" ry="${f1(7 * kb)}" fill="#3A2A22" opacity=".22" filter="url(#shadow)"/>` + s; };
const BOWL = inner(PA.prop('bowl', { food: 'Basic Kibble' }));
const bowlSVG = (x, floor, kb) => `<ellipse cx="${f1(x)}" cy="${f1(floor - 4)}" rx="${f1(48 * kb)}" ry="${f1(7 * kb)}" fill="#3A2A22" opacity=".22" filter="url(#shadow)"/><svg x="${f1(x - 60 * kb)}" y="${f1(floor - 104 * kb)}" width="${f1(120 * kb)}" height="${f1(120 * kb)}" viewBox="0 0 120 120" overflow="visible">${BOWL}</svg>`;
const LOGO_SVG = inner(fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<title>[^<]*<\/title>/, '').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, ''));
const logoSVG = (x, y, w, op) => `<g opacity="${r3(op)}" data-safe><svg x="${f1(x - w / 2)}" y="${f1(y - w * 140 / 900)}" width="${f1(w)}" height="${f1(w * 280 / 900)}" viewBox="0 0 900 280">${LOGO_SVG}</svg></g>`;

// slow light motes at three depths (0 far, 1 mid, 2 near), fixed so remakes match
let sd = 23; const rr = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
const MOTES = Array.from({ length: 16 }, (_, i) => { const dd = i % 3; return { d: dd, x: rr() * W, y: rr() * H, r: [5, 9, 20][dd] + rr() * [3, 4, 8][dd], sp: [8, 14, 22][dd] * (0.7 + rr() * 0.6), ph: rr() * 6.3, op: [0.5, 0.4, 0.26][dd] }; });
const motes = (t, dd) => { let g = ''; for (const m of MOTES) if (m.d === dd) { const y = ((m.y - m.sp * t) % (H + 100) + H + 100) % (H + 100) - 50, x = m.x + Math.sin(t * 0.3 + m.ph) * 26;
  g += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(m.r)}" fill="#FFF6D8" opacity="${r3(m.op * (0.8 + 0.2 * Math.sin(t * 0.7 + m.ph)))}"/>`; }
  return g ? `<g filter="url(#dof${dd})">${g}</g>` : ''; };

// ---- the beats: each returns { place, z (camera zoom), focus, mid (the art), front (near layer), text (spec for the page) } at time t ----
const L = LY, fr3 = (t) => Math.floor(t * 3) % 3;
const breath = (t) => Math.sin(t * 2 * Math.PI * 0.5) * 1.5;
const bagelBase = (o) => Object.assign({ key: BAGEL, pose: 'idle', expr: null, facing: 'left', x: L.BX, g: L.G, k: L.K, outfit: COLLAR }, o);
const label = (n, s, t, t0) => { // the rule's card: pops in big, then glides to the top corner and stays
  if (t < t0) return null; const q = eio(seg(t, t0 + 1.3, t0 + 2.2)), a = L.label.big;
  return { s: n + '. ' + s, x: lerp(a.x, L.label.x, q), y: lerp(a.y, L.label.y, q), sc: lerp(a.sc, 1, q) * (0.85 + 0.15 * pop(seg(t, t0, t0 + 0.5))), op: ss(seg(t, t0, t0 + 0.35)) }; };
const camZ = (t, b, z0 = 1.0, z1 = 1.045) => lerp(z0, z1, eio(seg(t, b.a - 0.5, b.b + 0.5)));
// the hand's resting places
const HAND_LOW = TALL ? { kind: 'flat', x: 250, y: 1330, r: 52, lean: -0.05 } : { kind: 'flat', x: 640, y: 905, r: 52, lean: -0.05 };
const HAND_OFF = (h) => Object.assign({}, h, { y: H + 380 });
const handMix = (a, b, q) => Object.assign({}, b, { x: lerp(a.x, b.x, q), y: lerp(a.y, b.y, q), r: lerp(a.r, b.r, q) });

function vis(id, t) {
  const b = BEATS.find((x) => x.id === id), fr = fr3(t), z = camZ(t, b);
  const V = { place: b.place, z, focus: [W / 2, L.G - 200], mid: '', front: '', text: {} };
  if (id === 'hello' || id === 'bye' || id === 'recap') {
    let n = { key: NOODLE, pose: 'happy', expr: null, facing: 'right', x: L.NX, g: L.G, k: L.KN, bob: 0 };
    if (id === 'hello') {
      const q = eio(seg(t, M.nIn0, M.nIn1)); n.x = lerp(-600, L.NX, q); if (t < M.nIn1) { n.pose = 'walk'; n.bob = Math.abs(Math.sin(t * Math.PI * 2.2)) * 7; }
      if (AT.hi3 && t >= AT.hi3 - 0.1) n.expr = 'wink';
      if (t >= M.title0) V.text.title = { op: ss(seg(t, M.title0, M.title0 + 0.4)), sc: 0.88 + 0.12 * pop(seg(t, M.title0, M.title0 + 0.6)) };
    } else if (id === 'recap') { n = Object.assign(n, { pose: 'sit', x: L.recapN.x, g: L.recapN.g, k: L.recapN.k }); if (t > AT.rc4) n.pose = 'happy';
      V.text.cards = [1, 2, 3, 4].map((i) => { const t0 = AT['rc' + i]; if (t < t0) return null; return { i, op: ss(seg(t, t0, t0 + 0.3)), sc: 0.85 + 0.15 * pop(seg(t, t0, t0 + 0.5)), hi: t < (AT['rc' + (i + 1)] || T) }; }).filter(Boolean);
      V.pale = 0.42; V.z = 1.02;
    } else { n.pose = 'paw'; n.expr = null; }
    V.mid = motes(t, 1) + dogSVG(n, fr); V.front = motes(t, 2);
    return V;
  }
  if (id === 'ask') {
    const d = bagelBase({ bob: 0 }); const cb = subAt('ask1', 2) || AT.ask1 + D.ask1 * 0.6;
    if (t > cb) d.expr = 'curious';
    if (t > M.yes + 0.3) { d.pose = 'happy'; d.expr = null; }
    V.text.label = label(1, 'Ask first.', t, M.lab);
    if (t > cb - 0.1) V.text.child = { s: 'May I say hello?', op: ss(seg(t, cb - 0.1, cb + 0.25)), sc: 0.85 + 0.15 * pop(seg(t, cb - 0.1, cb + 0.45)) };
    if (t > M.yes + 0.1) V.text.adult = { s: 'Yes!', op: ss(seg(t, M.yes + 0.1, M.yes + 0.45)), sc: 0.85 + 0.15 * pop(seg(t, M.yes + 0.1, M.yes + 0.6)) };
    // the wave: the open hand comes up from the bottom and waves, slowly
    const w0 = has('ask3') ? M.wave0 - 0.4 : M.yes + 0.9, rest = TALL ? { kind: 'open', x: 250, y: 1150, r: -8, lean: 0.1 } : { kind: 'open', x: 560, y: 820, r: -8, lean: 0.12 };
    let h = null; if (t > w0) { const qi = eo3(seg(t, w0, w0 + 1.2)), qo = ss(seg(t, M.askEnd - 0.2, M.askEnd + 0.6)); h = handMix(HAND_OFF(rest), rest, qi * (1 - qo)); h.r += Math.sin((t - w0) * Math.PI * 2 * 0.75) * 11 * qi; }
    V.mid = motes(t, 1) + leadSVG(d, L.leadTop, 'line') + dogSVG(d, fr) + leadSVG(d, L.leadTop); V.front = handSVG(h) + motes(t, 2);
    return V;
  }
  if (id === 'still') {
    // Bagel waits further back (sitting), then walks up to the still, low hand and sniffs it
    const far = { x: L.BX + (TALL ? 120 : 360), g: L.G - (TALL ? 90 : 70), k: L.K * 0.8 }, near = TALL ? { x: L.BX - 40, g: L.G, k: L.K } : { x: L.BX - 160, g: L.G, k: L.K };
    const w0 = M.walk0 + 0.4, w1 = M.sniff - 0.1, q = ss(seg(t, w0, w1));
    const d = bagelBase({ x: lerp(far.x, near.x, q), g: lerp(far.g, near.g, q), k: lerp(far.k, near.k, q), pose: t < w0 ? 'sit' : t < w1 ? 'walk' : 'sniff' });
    if (d.pose === 'walk') d.bob = Math.abs(Math.sin((t - w0) * Math.PI * 2.4)) * 6;
    if (d.pose === 'sniff') { if (M.sitDown && t > M.sitDown - 0.4 && has('still4')) { d.pose = 'sit'; d.expr = null; } else if (t > M.sniff + 1.6) d.expr = null; }
    V.text.label = label(2, 'Stand still.', t, M.lab2);
    const hi = M.handIn - 0.2, h = handMix(HAND_OFF(HAND_LOW), HAND_LOW, eo3(seg(t, hi, hi + 1.6)));
    let puffs = ''; if (d.pose === 'sniff' && t < M.sniff + 2.6) { const mm = MEAS[mkey(BAGEL, 'sniff', 'left', COLLAR)]; const nose = onDog(d, mm.nose);
      for (let j = 0; j < 3; j++) { const ph = ((t - M.sniff) * 1.6 + j / 3) % 1, o = Math.sin(Math.PI * ph) * (1 - seg(t, M.sniff + 2.0, M.sniff + 2.6));
        puffs += `<path d="M${f1(nose[0] - 18 - 30 * ph)} ${f1(nose[1] - 24 - j * 18 - 10 * ph)} q-10 -8 -20 0" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" opacity="${r3(o * 0.7)}"/>`; } }
    V.mid = motes(t, 1) + leadSVG(d, [L.leadTop[0] + (d.x - L.BX) * 0.6, L.leadTop[1]], 'line') + dogSVG(d, fr) + leadSVG(d, [L.leadTop[0] + (d.x - L.BX) * 0.6, L.leadTop[1]]) + puffs; V.front = handSVG(h) + motes(t, 2);
    return V;
  }
  if (id === 'pet') {
    const d = bagelBase({});
    V.text.label = label(3, 'Pet softly.', t, M.lab3);
    // the flat hand rests on Bagel's side, behind the shoulder (never the head or the face), and strokes back along the side, three times, slowly
    const mm = MEAS[mkey(BAGEL, 'idle', 'left', COLLAR)];
    const s0 = M.s0, s1 = M.s1;
    let lean = 0; if (t > M.lean) lean = ss(seg(t, M.lean, M.lean + 0.8)); if (TALL && t > s1 + 1.0) lean = ss(seg(t, s1 + 1.0, s1 + 1.8));
    d.dx = -18 * lean; d.lean = -2.5 * lean;
    if (t >= s0 - 0.2 && t < s1 + 0.4) { d.pose = 'pet'; } else if (t >= M.ask2b && t < M.lean) { d.expr = 'curious'; }
    if (lean > 0.3) { d.pose = 'pet'; d.expr = 'hearts'; }
    const side = onDog(Object.assign({}, d, { lean: 0, dx: 0 }), mm.side);
    const REST = { kind: 'flat', x: side[0] - 10, y: side[1] + 6, r: TALL ? -40 : -38, lean: 0.1 }, LIFT = Object.assign({}, REST, { x: REST.x - 30, y: REST.y + 70, r: REST.r + 6 });
    const r0 = M.reach0 + 0.2; let h = handMix(HAND_OFF(REST), REST, eo3(seg(t, r0, r0 + 2.0)));
    const STROKE = mm.box[2] * L.K * 0.22;
    const strokeAt = (u) => { const w = 0.5 - 0.5 * Math.cos(u * 2 * Math.PI); return { x: REST.x + STROKE * w, y: REST.y - 6 * Math.sin(u * Math.PI * 2) * 0, r: REST.r + 4 * w }; };
    if (t >= s0 && t < s0 + 3 * SP) { const u = ((t - s0) / SP) % 1, st = strokeAt(u); h = Object.assign({}, REST, st); }
    else if (t >= s0 + 3 * SP) { h = handMix(REST, LIFT, ss(seg(t, s1, s1 + 0.8))); // then stop: the hand lifts off a little and waits
      const back = has('pet4') ? M.lean + 0.5 : s1 + 1.6; if (t > back) h = handMix(LIFT, REST, ss(seg(t, back, back + 0.8)));
      const again = has('pet5') ? AT.pet5 : s1 + 2.6; if (t > again + 0.2) { const u = clamp((t - again - 0.2) / (SP * 1.1)); h = Object.assign({}, REST, strokeAt(u)); } }
    h.x += d.dx;
    // the counted strokes: big numbers 1. 2. 3., one at each count
    V.text.nums = ['one', 'two', 'three'].map((k, i) => { const t0 = AT[k] - 0.15; if (!(t >= t0)) return null; const off = ss(seg(t, M.ask2b - 0.2, M.ask2b + 0.4));
      return { s: (i + 1) + '.', x: L.nums[i][0], y: L.nums[i][1], op: ss(seg(t, t0, t0 + 0.3)) * (1 - off), sc: 0.8 + 0.2 * pop(seg(t, t0, t0 + 0.5)) }; }).filter(Boolean);
    let hs = ''; const ht0 = TALL ? s1 + 1.2 : M.lean + 0.3; if (t > ht0) { const hd = onDog(d, [70, 70]);
      for (let i = 0; i < 9; i++) { const q = (t - ht0 - i * 0.42) / 2.2; if (q < 0 || q > 1) continue; hs += HEART(hd[0] - 60 + ((i * 97) % 260), hd[1] - 40 - 300 * q, (TALL ? 1.0 : 1.1) * (0.6 + 0.4 * eo3(q * 3)) * (1 + ((i * 37) % 5) / 10), 12 * Math.sin(q * 5 + i), 1 - seg(q, 0.6, 1)); } }
    V.mid = motes(t, 1) + leadSVG(d, L.leadTop, 'line') + dogSVG(d, fr) + leadSVG(d, L.leadTop); V.front = handSVG(h) + hs + motes(t, 2);
    return V;
  }
  if (id === 'go') {
    V.text.label = label(4, 'Let it go.', t, M.lab4);
    // Bagel turns and trots off happily, back across the grass, and sniffs about over there; the hand stays low and still
    const w0 = M.go0 + 0.4, w1 = w0 + (TALL ? 2.8 : 5.4), q = ss(seg(t, w0, w1));
    const far = TALL ? { x: L.BX + 140, g: L.G - 110, k: L.K * 0.72 } : { x: L.BX + 360, g: L.G - 90, k: L.K * 0.72 };
    const d = bagelBase({ x: lerp(L.BX - 60, far.x, q), g: lerp(L.G, far.g, q), k: lerp(L.K, far.k, q), facing: t < w0 ? 'left' : 'right', pose: t < w0 ? 'idle' : t < w1 ? 'walk' : TALL ? 'idle' : 'sniff', sop: 1 - 0.3 * q });
    if (d.pose === 'walk') { d.bob = Math.abs(Math.sin((t - w0) * Math.PI * 2.6)) * 6; }
    if (d.pose === 'sniff' && t > w1 + 1.4) d.pose = 'idle';
    const h = handMix(HAND_OFF(HAND_LOW), HAND_LOW, eo3(seg(t, b.a - 0.6, b.a + 0.8)));
    V.mid = motes(t, 1) + leadSVG(d, [L.leadTop[0] + (d.x - L.BX) * 0.9, L.leadTop[1]], 'line') + dogSVG(d, fr) + leadSVG(d, [L.leadTop[0] + (d.x - L.BX) * 0.9, L.leadTop[1]]); V.front = handSVG(h) + motes(t, 2);
    return V;
  }
  if (id === 'bed' || id === 'night') { // asleep in a bed indoors: Bagel (we let it be), then Noodle at the end
    const who = id === 'bed' ? BAGEL : NOODLE, kb = TALL ? 3.2 : 3.4, bx = TALL ? 475 : 960, floor = L.G + (TALL ? 0 : 20);
    const bed = id === 'bed' ? BEDS.bagel : BEDS.noodle, dk = kb * (who === NOODLE ? 0.74 : 1.0);
    const d = { key: who, pose: 'sleep', facing: who === NOODLE ? 'right' : 'left', x: bx + (who === NOODLE ? -6 * kb : 0), g: floor - (who === NOODLE ? 34 : 22) * kb, k: dk, outfit: who === BAGEL ? COLLAR : undefined, bob: breath(t) * 0.6 };
    V.mid = bedSVG(bed, bx, floor, kb, false) + dogSVG(d, fr, false) + bedSVG(bed, bx, floor, kb, true);
    if (id === 'night') { const l0 = M.logo; if (t > l0) V.text.logo = ss(seg(t, l0, l0 + 1.0)); V.endFade = ss(seg(t, T - 1.6, T)); }
    V.focus = [bx, floor - 120];
    return V;
  }
  if (id === 'bowl') { // eating: Bagel at his bowl, munching; we let him be
    const kb = TALL ? 2.2 : 2.4, d = bagelBase({ pose: 'eat', x: (TALL ? 560 : 1080), outfit: COLLAR });
    const mm = MEAS[mkey(BAGEL, 'eat', 'left', COLLAR)], nose = onDog(d, mm.nose);
    d.bob = Math.max(0, Math.sin(t * Math.PI * 2 * 1.1)) * 3;
    V.mid = motes(t, 1) + dogSVG(d, fr) + bowlSVG(nose[0] - 10, L.G + 8, kb); V.front = motes(t, 2);
    return V;
  }
  throw new Error('no beat ' + id);
}
// the frame at t: the beat's look, cross-faded over 1 s into the next one; the subtitle on top
function frameState(t) {
  let i = BEATS.findIndex((b) => t >= b.a && t < b.b); if (i < 0) i = BEATS.length - 1;
  const b = BEATS[i], layers = [];
  const prevQ = i > 0 ? 1 - ss(seg(t, b.a - 0.5, b.a + 0.5)) : 0, nextQ = i + 1 < BEATS.length ? ss(seg(t, b.b - 0.5, b.b + 0.5)) : 0;
  if (prevQ > 0) layers.push({ v: vis(BEATS[i - 1].id, t), op: 1 });
  layers.push({ v: vis(b.id, t), op: prevQ > 0 ? 1 - prevQ : 1 });
  if (nextQ > 0) layers.push({ v: vis(BEATS[i + 1].id, t), op: nextQ });
  // text: from the layer that is most visible (labels, bubbles and numbers fade with their scene)
  const u = SUBS.find((x) => t >= x.a && t < x.b);
  const sub = u ? { s: u.s, op: Math.min(ss((t - u.a) / 0.12), ss((u.b - t) / 0.12)) } : null;
  return { layers: layers.map((l) => ({ place: l.v.place, z: l.v.z, focus: l.v.focus, mid: l.v.mid, front: l.v.front, text: l.v.text, op: l.op, pale: l.v.pale || 0, endFade: l.v.endFade || 0 })), sub };
}

// ---- the page ----
const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Andika:wght@700&family=Caveat:wght@700&display=swap" rel="stylesheet">
<style>html,body{margin:0;background:${PAPER}}svg{display:block}.hide{display:none}.bedfront svg *{visibility:hidden}.bedfront svg .pa-bed-front,.bedfront svg .pa-bed-front *{visibility:visible}</style>
<svg id="root" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><filter id="shadow" x="-30%" y="-200%" width="160%" height="500%"><feGaussianBlur stdDeviation="10"/></filter>
<filter id="handsoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.1"/></filter>${[1.6, 3.5, 9].map((s, d) => `<filter id="dof${d}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${s}"/></filter>`).join('')}</defs>
<rect width="${W}" height="${H}" fill="${PAPER}"/><g id="L0"></g><g id="L1"></g><g id="L2"></g><rect id="fade" width="${W}" height="${H}" fill="${PAPER}" opacity="0"/><g id="tx"></g><g id="sub"></g></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
const LOGO=${JSON.stringify(LOGO_SVG)}, W=${W},H=${H},TALL=${TALL},LY=${JSON.stringify(LY)},INK='${INK}',MUTED='${MUTED}',CREAM='${CREAM}',AND='${AND}',CAV='${CAV}';
const $=(i)=>document.getElementById(i), sc=(x,y,s,g)=>'<g transform="translate('+x+' '+y+') scale('+s+') translate('+(-x)+' '+(-y)+')">'+g+'</g>';
const BG={};
const card=(x,y,w,h,lines,fam,o)=>{o=o||{};return '<g data-box><rect x="'+(x-w/2)+'" y="'+(y-h/2)+'" width="'+w+'" height="'+h+'" rx="'+(o.rx||34)+'" fill="'+(o.fill||CREAM)+'" stroke="'+INK+'" stroke-width="'+(o.sw||5)+'"/>'+centred(lines,x,y,fam).svg+'</g>';};
// a speech bubble: a rounded box sized to the words, its tail pointing at whoever speaks (the grown-up above, the child below)
function bubble(s,x,y,size,tail,o){ const k=inkOf(s,size,AND), w=k.L+k.R+2*34, h=Math.round(size*1.55), bx=x-w/2, by=y-h/2;
  const tx=Math.max(bx+40,Math.min(bx+w-40,x+(tail[0]-x)*0.35)), up=tail[1]<y, ey=up?by:by+h;
  const tl='<path d="M'+(tx-26)+' '+ey+' L'+tail[0]+' '+tail[1]+' L'+(tx+26)+' '+ey+'" fill="'+(o.fill||CREAM)+'" stroke="'+INK+'" stroke-width="5" stroke-linejoin="round"/>';
  const box='<g data-box><rect x="'+bx+'" y="'+by+'" width="'+w+'" height="'+h+'" rx="'+(h/2.4)+'" fill="'+(o.fill||CREAM)+'" stroke="'+INK+'" stroke-width="5"/>'+centred([{s,size}],x,y,AND).svg+'</g>';
  const seam='<path d="M'+(tx-21)+' '+(ey+(up?2:-2))+' L'+(tx+21)+' '+(ey+(up?2:-2))+'" stroke="'+(o.fill||CREAM)+'" stroke-width="7"/>';
  return tl+box+seam; }
function textSVG(T){ let g='';
  if(T.title){ const c=LY.title; const lines=[{s:'Dog manners',size:TALL?54:58,fill:MUTED,pitch:TALL?96:100},{s:'How to say hello',size:TALL?100:118,pitch:TALL?108:124},{s:'to a dog',size:TALL?100:118}];
    g+='<g opacity="'+T.title.op+'">'+sc(c.x,c.y,T.title.sc,'<g transform="rotate(-1.5 '+c.x+' '+c.y+')">'+card(c.x,c.y,TALL?780:960,TALL?390:420,lines,CAV,{sw:6,rx:44})+'</g>')+'</g>'; }
  if(T.label){ const l=T.label; const k=inkOf(l.s,LY.label.size,CAV), w=k.L+k.R+70, h=Math.round(LY.label.size*1.5);
    g+='<g opacity="'+l.op+'">'+sc(l.x,l.y,l.sc,'<g transform="rotate(-2 '+l.x+' '+l.y+')">'+card(l.x,l.y,w,h,[{s:l.s,size:LY.label.size}],CAV,{fill:'#FFE3A1',rx:h/2})+'</g>')+'</g>'; }
  if(T.child){ const c=LY.child; g+='<g opacity="'+T.child.op+'">'+sc(c.x,c.y,T.child.sc,bubble(T.child.s,c.x,c.y,c.size,c.tail,{}))+'</g>'; }
  if(T.adult){ const c=LY.adult; g+='<g opacity="'+T.adult.op+'">'+sc(c.x,c.y,T.adult.sc,bubble(T.adult.s,c.x,c.y,c.size,c.tail,{fill:'#E4F3D8'}))+'</g>'; }
  if(T.nums) for(const n of T.nums){ g+='<g opacity="'+n.op+'">'+sc(n.x,n.y,n.sc,'<g data-box><circle cx="'+n.x+'" cy="'+n.y+'" r="'+LY.numR+'" fill="#FFE3A1" stroke="'+INK+'" stroke-width="6"/>'+centred([{s:n.s,size:LY.numSize}],n.x,n.y,CAV).svg+'</g>')+'</g>'; }
  if(T.cards){ const C=LY.cards, words=['Ask first.','Stand still.','Pet softly.','Let it go.'];
    for(const c of T.cards){ const y=C.y0+(c.i-1)*C.dy, x=C.x; g+='<g opacity="'+c.op+'">'+sc(x,y,c.sc,'<g transform="rotate('+[-1.5,1,-1,1.5][c.i-1]+' '+x+' '+y+')">'+card(x,y,C.w,C.h,[{s:c.i+'. '+words[c.i-1],size:C.size}],CAV,{fill:c.hi?'#FFE3A1':CREAM,sw:c.hi?6:5})+'</g>')+'</g>'; } }
  if(T.logo){ const c=LY.logo, w=c.w*0.75; g+='<g opacity="'+T.logo+'" data-safe><svg x="'+(c.x-w/2)+'" y="'+(c.y-w*140/900)+'" width="'+w+'" height="'+(w*280/900)+'" viewBox="0 0 900 280">'+LOGO+'</svg></g>'; }
  return g; }
window.frame=async function(S){
  for(let i=0;i<3;i++){ const el=$('L'+i), l=S.layers[i]; if(!l){ el.innerHTML=''; el.removeAttribute('data-k'); continue; }
    const fx=l.focus[0], fy=l.focus[1], z=l.z, zb=1+(z-1)*0.45, zf=1+(z-1)*1.6;
    const t=(zz,dx)=>'translate('+(fx+(dx||0))+' '+fy+') scale('+zz+') translate('+(-fx)+' '+(-fy)+')';
    el.setAttribute('opacity',l.op);
    el.innerHTML='<g transform="'+t(zb,-12*(z-1)/0.045)+'"><image href="'+BG[l.place]+'" width="'+W+'" height="'+H+'"/>'+(l.pale?'<rect width="'+W+'" height="'+H+'" fill="#FFF8EC" opacity="'+l.pale+'"/>':'')+'</g>'
      +'<g transform="'+t(z)+'">'+l.mid+'</g><g transform="'+t(zf,10*(z-1)/0.045)+'">'+l.front+'</g>';
  }
  const top=S.layers.reduce((a,l)=>l.op>a.op?l:a,S.layers[0]);
  $('fade').setAttribute('opacity',top.endFade*0.85);
  let tx=''; for(const l of S.layers){ const g=textSVG(l.text); if(g) tx+='<g opacity="'+l.op+'">'+g+'</g>'; } $('tx').innerHTML=tx;
  let sub=''; if(S.sub){ let size=LY.subSize; const k=inkOf(S.sub.s,size,AND); if(k.L+k.R+60>LY.subMax) size=Math.floor(size*(LY.subMax-60)/(k.L+k.R));
    sub=pill(S.sub.s,LY.subCX,LY.subY,size,AND,{op:(S.sub.op).toFixed(3),padX:32}); } $('sub').innerHTML=sub;
  await Promise.all([...document.querySelectorAll('image')].map((im)=>im.href&&im.href.baseVal?new Promise((r)=>{ const i=new Image(); i.onload=i.onerror=r; i.src=im.href.baseVal; }):0));
  const bad=centreCheck($('root')); const out=TALL?safeCheck($('root')):[]; return {bad,out}; };
</script>`;

// ---- measuring the dogs (the drawn box, the collar, the nose) on the 240 x 200 canvas, in the page ----
const NEED = [['beagle', 'idle', 'left'], ['beagle', 'sit', 'left'], ['beagle', 'walk', 'left'], ['beagle', 'sniff', 'left'], ['beagle', 'happy', 'left'], ['beagle', 'pet', 'left'],
  ['beagle', 'walk', 'right'], ['beagle', 'sniff', 'right'], ['beagle', 'idle', 'right'], ['beagle', 'eat', 'left'], ['beagle', 'sleep', 'left'],
  ['dachs', 'happy', 'right'], ['dachs', 'walk', 'right'], ['dachs', 'sit', 'right'], ['dachs', 'paw', 'right'], ['dachs', 'sleep', 'right']];

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const br = await chromium.launch({ executablePath: exe });
  const mkPage = async () => { const p = await br.newPage({ viewport: { width: W, height: H } }); fs.writeFileSync(path.join(WORK, 'page.html'), html);
    await p.goto('file://' + path.join(WORK, 'page.html')); await p.waitForLoadState('networkidle');
    await p.evaluate(() => Promise.all(['700 40px Andika', '700 40px Caveat'].map((f) => document.fonts.load(f, 'aA1.?'))));
    return p; };
  const p = await mkPage();
  for (const [key, pose, facing] of NEED) { const outfit = key === BAGEL ? COLLAR : undefined;
    MEAS[mkey(key, pose, facing, outfit)] = await p.evaluate(async ([sv, facing]) => {
      const dv = document.createElement('div'); dv.innerHTML = sv; document.body.appendChild(dv); const e = dv.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200);
      const r = e.getBBox(); dv.remove();
      const src = sv.includes('xmlns=') ? sv : sv.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(src.replace('<svg', '<svg width="960" height="800"')); await img.decode();
      const c = document.createElement('canvas'); c.width = 960; c.height = 800; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 960, 800); const a = g.getImageData(0, 0, 960, 800).data;
      let sx = 0, sy = 0, n = 0, minX = 1e9, maxX = -1, nose = null;
      for (let y = 0; y < 800; y++) for (let x = 0; x < 960; x++) { const i = (y * 960 + x) * 4; if (a[i + 3] < 200) continue;
        if (Math.abs(a[i] - 226) < 30 && Math.abs(a[i + 1] - 64) < 34 && Math.abs(a[i + 2] - 58) < 34) { sx += x; sy += y; n++; } }
      // the nose: the furthest drawn point forward (left when facing left) in the head's half of the dog, below its top third
      const fwd = facing === 'left' ? 1 : -1; let best = null;
      for (let y = Math.round(4 * (r.y + r.height * 0.3)); y < Math.round(4 * 186); y++) for (let x0 = 0; x0 < 960; x0++) { const x = fwd > 0 ? x0 : 959 - x0, i = (y * 960 + x) * 4;
        if (a[i + 3] > 160) { if (!best || (fwd > 0 ? x < best[0] : x > best[0])) best = [x, y]; break; } }
      return { box: [r.x, r.y, r.width, r.height], collar: n ? [sx / n / 4, sy / n / 4 - 1] : null, nose: best ? [best[0] / 4, best[1] / 4] : null };
    }, [PA.dog(key, { pose, anim: false, facing, outfit }), facing]);
  }
  for (const k of Object.keys(MEAS)) { const m = MEAS[k]; if (m.box) m.side = [m.box[0] + m.box[2] * 0.6, m.box[1] + m.box[3] * 0.55]; }
  if (process.env.SIDE) MEAS[mkey(BAGEL, 'idle', 'left', COLLAR)].side = process.env.SIDE.split(',').map(Number);
  console.log('measured', JSON.stringify(Object.fromEntries(Object.entries(MEAS).map(([k, v]) => [k, { box: v.box.map(Math.round), collar: v.collar && v.collar.map(Math.round), nose: v.nose && v.nose.map(Math.round) }]))));

  // ---- the places, rendered once: the game's scene, soft (depth of field), a little haze, light from the sun, a vignette ----
  const BGF = {};
  for (const [place, view] of Object.entries(LY.views)) {
    const sceneName = place === 'house' ? 'house' : 'yard', file = path.join(WORK, 'bg_' + place + '.png'), m = 50;
    const g = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs><filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${TALL ? 6 : 5.5}"/></filter>`
      + `<radialGradient id="sun" cx="0.8" cy="0.05" r="0.9"><stop offset="0" stop-color="#FFF1BC" stop-opacity="${place === 'house' ? 0.3 : 0.5}"/><stop offset="1" stop-color="#FFF1BC" stop-opacity="0"/></radialGradient>`
      + `<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset=".3" stop-color="#FFF8EC" stop-opacity=".25"/><stop offset=".7" stop-color="#FFF8EC" stop-opacity="0"/></linearGradient>`
      + `<radialGradient id="vig" cx="0.5" cy="0.55" r="0.8"><stop offset=".62" stop-color="#3A2A22" stop-opacity="0"/><stop offset="1" stop-color="#3A2A22" stop-opacity=".2"/></radialGradient></defs>`
      + `<g filter="url(#soft)"><svg x="${-m}" y="${-m}" width="${W + 2 * m}" height="${H + 2 * m}" viewBox="${view}" preserveAspectRatio="xMidYMid slice">${inner(PA.scene(sceneName, env))}</svg></g>`
      + `<rect width="${W}" height="${H}" fill="url(#haze)"/><rect width="${W}" height="${H}" fill="url(#sun)"/><rect width="${W}" height="${H}" fill="url(#vig)"/></svg>`;
    const q = await br.newPage({ viewport: { width: W, height: H } }); await q.setContent(`<body style="margin:0">${g}</body>`); await q.screenshot({ path: file, clip: { x: 0, y: 0, width: W, height: H } }); await q.close();
    BGF[place] = 'file://' + file; }
  const pages = [p]; const PAR = Math.max(1, +(process.env.PAR || 3)); for (let i = 1; i < PAR; i++) pages.push(await mkPage());
  for (const q of pages) await q.evaluate((bg) => { Object.assign(BG, bg); }, BGF);
  const render = async (q, t, file, type) => { const r = await q.evaluate(async (S) => window.frame(S), frameState(t));
    if (r.bad.length) throw new Error('text not centred at ' + t.toFixed(2) + ': ' + r.bad.join('; '));
    if (r.out.length) throw new Error('outside SAFE at ' + t.toFixed(2) + ': ' + r.out.join('; '));
    await q.screenshot({ path: file, type: type || 'jpeg', ...(type === 'png' ? {} : { quality: 94 }), clip: { x: 0, y: 0, width: W, height: H } }); };

  // ---- the covers: the thumbnail (16:9) and the tall cover (9:16, what matters inside the middle 1080 x 1440 and SAFE) ----
  const cover = async () => {
    const t = M.lean + 0.9; const S = frameState(t); S.sub = null; S.layers.forEach((l) => { l.text = {}; });
    const v = S.layers[S.layers.length - 1]; const ti = TALL ? { x: 475, y: 458, w: 780 } : { x: 530, y: 360, w: 920 };
    // the cover's own framing: Bagel and the hand a little bigger, clear of the title (no camera zoom)
    const [cx, cy, k] = TALL ? [560, 1265, 1.22] : [1480, 905, 1.3], wrap = (g) => `<g transform="translate(${cx} ${cy}) scale(${k}) translate(${-L.BX} ${-L.G})">${g}</g>`;
    S.layers = [v]; v.op = 1; v.z = 1; v.mid = wrap(v.mid); v.front = wrap(v.front);
    v.front += logoSVG(TALL ? 690 : 300, TALL ? 1400 : 960, TALL ? 320 : 400, 1);
    await p.evaluate(async ([S, ti]) => { await window.frame(S); // the title: big and short, readable on a phone
      const lines = TALL ? [{ s: 'Saying hello', size: 124, pitch: 128 }, { s: 'to a dog', size: 124 }] : [{ s: 'Saying hello', size: 150, pitch: 154 }, { s: 'to a dog', size: 150 }];
      document.getElementById('tx').innerHTML = '<g transform="rotate(-2 ' + ti.x + ' ' + ti.y + ')">' + card(ti.x, ti.y, ti.w, TALL ? 340 : 400, lines, CAV, { sw: 7, rx: 46, fill: '#FFFDF7' }) + '</g>';
      const bad = centreCheck(document.getElementById('root')).concat(TALL ? safeCheck(document.getElementById('root')) : []); if (bad.length) throw new Error('cover: ' + bad.join('; ')); }, [S, ti]);
    const png = path.join(WORK, 'cover.png'); await p.screenshot({ path: png, clip: { x: 0, y: 0, width: W, height: H } });
    const jpg = path.join(OUT, TALL ? 'dog-manners-cover-tall.jpg' : 'dog-manners-thumb.jpg');
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', png, '-q:v', '2', jpg]); console.log('wrote', jpg); };
  if (process.env.ONLY === 'covers') { await cover(); await br.close(); return; }
  if (process.env.ONLY === 'stills') {
    const ts = process.env.STRIP ? process.env.STRIP.split(',').map(Number) : [M.nIn1 + 1, M.title0 + 1.5, M.yes + 0.8, (M.wave0 || M.yes + 2) + 1.2, M.lab2 + 0.6, M.walk0 + 2.0, M.sniff + 0.8,
      M.reach0 + 2.3, M.s0 + 0.5 * SP, M.s0 + 2.5 * SP, M.lean + 1.2, M.go0 + 3.0, M.go0 + 6, ...(TALL ? [] : [BEATS.find((b) => b.id === 'bed').a + 1.5, BEATS.find((b) => b.id === 'bowl').a + 1.5, BEATS.find((b) => b.id === 'bowl').a]),
      M.rc4 + 0.8, BEATS.find((b) => b.id === 'bye').a + 1.5, M.logo + 2];
    for (const [j, t] of ts.entries()) await render(p, t, path.join(WORK, `still${String(j).padStart(2, '0')}.png`), 'png');
    console.log('stills', ts.map((t) => t.toFixed(2)).join(' ')); await cover(); await br.close(); return; }
  const [FA, FB] = process.env.FRAMES ? process.env.FRAMES.split('-').map(Number) : [0, N];
  let next = FA, done = 0; const t0 = Date.now();
  await Promise.all(pages.map(async (q) => { while (next < Math.min(FB, N)) { const fi = next++; await render(q, fi / FPS, path.join(WORK, 'f', `f${String(fi).padStart(5, '0')}.jpg`));
    if (++done % 250 === 0) console.log('frame', done, '/', Math.min(FB, N) - FA, ((Date.now() - t0) / 1000).toFixed(0) + ' s'); } }));
  if (!process.env.FRAMES) await cover();

  // ---- sound: the game's own yard music, very soft (about 14 dB under the voice), fade in 2 s and out 3 s; Noodle's lines at their times ----
  const ap = await br.newPage(); await ap.goto('about:blank'); await ap.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const wav = await ap.evaluate(async (s) => (await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.85, music: 0.6, ambience: 0.12 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: [] })).wav, T + 0.5);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(wav, 'base64'));
  await br.close();
  const keys = Object.keys(AT).sort((a, b) => AT[a] - AT[b]), ins = [], ch = [];
  keys.forEach((k, i) => { ins.push('-i', path.join(VO, k + '.wav')); const ms = Math.round(AT[k] * 1000); ch.push(`[${i}:a]aresample=44100,adelay=${ms}|${ms}[v${i}]`); });
  const voice = path.join(WORK, 'voice.wav');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...ins, '-filter_complex', ch.join(';') + ';' + keys.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${keys.length}:normalize=0,apad,atrim=0:${T.toFixed(3)}[a]`, '-map', '[a]', '-ac', '1', voice]);
  const lufs = (f) => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }); return +JSON.parse(r.stderr.slice(r.stderr.lastIndexOf('{'))).input_i; };
  // the voice's loudness while it speaks (the silences left out), and the music's: the music sits 14 dB under
  const vI = lufs(voice) + 10 * Math.log10(T / keys.reduce((s, k) => s + D[k], 0)), mI = lufs(path.join(WORK, 'music.wav')), gain = (vI - 14) - mI;
  console.log('voice', vI.toFixed(1), 'LUFS (speech), music', mI.toFixed(1), 'LUFS: music gain', gain.toFixed(1), 'dB');
  const mp4 = path.join(OUT, TALL ? 'doodle-doggo-kids-dog-manners-tall.mp4' : 'doodle-doggo-kids-dog-manners.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%05d.jpg'), '-i', path.join(WORK, 'music.wav'), '-i', voice,
    '-filter_complex', `[1:a]atrim=0:${T.toFixed(3)},volume=${gain.toFixed(2)}dB,afade=t=in:d=2,afade=t=out:st=${(T - 3).toFixed(2)}:d=3,aresample=44100[m];[2:a]aresample=44100,pan=stereo|c0=c0|c1=c0[v];[m][v]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-18:TP=-2:LRA=11,aresample=44100,alimiter=limit=0.76:level=false:attack=2:release=60[a]`,
    '-map', '0:v', '-map', '[a]', '-t', T.toFixed(3), '-c:v', 'libx264', '-preset', 'slow', '-tune', 'animation', '-crf', process.env.CRF || '22', '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  const dur = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString(), mb = fs.statSync(mp4).size / 1e6;
  console.log('wrote', mp4, dur.toFixed(2) + ' s', mb.toFixed(1) + ' MB'); if (mb >= 50) throw new Error('over 50 MB: raise CRF');
})().catch((e) => { console.error(e); process.exit(1); });
