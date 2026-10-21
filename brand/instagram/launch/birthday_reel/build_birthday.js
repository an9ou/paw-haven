// "Your birthday month = your dog" Reel (1080 x 1920, 30 fps, 32.8 s): a title card, then one 2.2 s scene per month (a game place in the
// right season, a dog in an outfit: it walks in, strikes a pose with one face, hops into a second pose and face), then a grid of all 12 and an end card (follow us, play at doodledoggo.app).
// Real art only (PawArt.dog with outfit and expr, PawArt.scene), no game UI. No Japanese text (owner, 21 Oct 2026). Music: the game's own engine (mods/pawaudio.js).
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/birthday_reel/build_birthday.js <workdir>   (ONLY=stills: key frames only; FRAMES=0-60 re-renders only the opening over a workdir copied from an earlier render)
// Output next to this file: doodle-doggo-birthday-dog-reel.mp4, birthday-reel-cover.jpg.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname, WORK = path.resolve(process.argv[2] || '/tmp/birthday_reel');
fs.mkdirSync(path.join(WORK, 'f'), { recursive: true }); fs.mkdirSync(path.join(WORK, 'bg'), { recursive: true });
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js', 'world/pawart_world_d.js', 'world/pawart_world_e.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const PA = win.PawArt;
const W = 1080, H = 1920, FPS = 30, INK = '#5B3D32', PINK = '#F28FA5', MUTED = '#8A7468', ORANGE = '#E8863A', PLUM = '#7A5C9E', PAPER = '#FFFBF2';
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const f1 = (n) => Math.round(n * 10) / 10;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const eo3 = (x) => 1 - Math.pow(1 - clamp(x), 3), eoB = (x) => { x = clamp(x); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const txt = (s, x, y, size, o = {}) => `<text x="${x}" y="${y}" font-family="${o.jp ? "'Zen Maru Gothic'" : 'Caveat'}" font-weight="${o.w || 700}" font-size="${size}" fill="${o.fill || INK}" text-anchor="${o.anchor || 'middle'}"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}${o.op !== undefined ? ` opacity="${o.op}"` : ''}>${s}</text>`;
const card = (x, y, w, h, rot = 0, fill = PAPER) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><rect x="${x + 6}" y="${y + 10}" width="${w}" height="${h}" rx="34" fill="${INK}" opacity=".18"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="${fill}" stroke="${INK}" stroke-width="5"/></g>`;
const tape = (x, y, w, rot, col = PINK) => `<rect x="${x}" y="${y}" width="${w}" height="40" fill="${col}" opacity=".55" transform="rotate(${rot} ${x + w / 2} ${y + 20})"/>`;
const paperBg = `<rect width="${W}" height="${H}" fill="#FFF8EC"/><defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="2" fill="#E3D2BA"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#dots)"/>`;

// ---- the 12 months: a dog that fits the season, a game place, an outfit, two poses with two faces, and a one-line "you are..." ----
const M = [
  { m: 'January', key: 'akita', place: 'fujihill', env: { season: 'winter', weather: 'snow', time: 'day' }, outfit: { neck: 'Knit Scarf' }, enter: 'walk', a: ['sit', 'dreamy'], b: ['sit', 'wow'], line: 'loyal and patient' },
  { m: 'February', key: 'frenchie', place: 'cafe', env: { season: 'winter', weather: 'sunny', time: 'day' }, outfit: { neck: 'Bow Tie' }, enter: 'walk', a: ['sit', 'wink'], b: ['happy', 'hearts'], line: 'a big softie' },
  { m: 'March', key: 'pom', place: 'park', env: { season: 'spring', weather: 'sunny', time: 'day' }, outfit: { head: 'Flower Crown' }, enter: 'walk', a: ['dance', 'proud'], b: ['happy', 'yum'], line: 'small but mighty' },
  { m: 'April', key: 'spitz', place: 'ueno', env: { season: 'spring', weather: 'sunny', time: 'day' }, outfit: { neck: 'Clover Collar' }, enter: 'walk', a: ['sit', 'curious'], b: ['sit', 'proud'], line: 'born to shine' },
  { m: 'May', key: 'golden', place: 'yard', env: { season: 'spring', weather: 'sunny', time: 'day' }, outfit: { head: 'Sun Hat' }, enter: 'walk', a: ['happy', 'wink'], b: ['happy', 'hearts'], line: "everyone's best friend" },
  { m: 'June', key: 'beagle', place: 'woods', env: { season: 'summer', weather: 'rain', time: 'day' }, outfit: { head: 'Rain Hat', body: 'Yellow Raincoat' }, enter: 'walk', a: ['sniff', null], b: ['sit', 'curious'], line: 'curious about everything' },
  { m: 'July', key: 'samoyed', place: 'beach', env: { season: 'summer', weather: 'sunny', time: 'day' }, outfit: { eyes: 'Heart Sunglasses' }, enter: 'walk', a: ['sit', 'proud'], b: ['happy', 'zoomies'], line: 'sunny and smiley' },
  { m: 'August', key: 'greyhound', place: 'odaiba', env: { season: 'summer', weather: 'sunny', time: 'dusk' }, outfit: { body: 'Superhero Cape' }, enter: 'walk', a: ['happy', 'zoomies'], b: ['sit', 'proud'], line: 'fast and fearless' },
  { m: 'September', key: 'collie', place: 'dogpark', env: { season: 'autumn', weather: 'sunny', time: 'day' }, outfit: { eyes: 'Explorer Goggles', neck: 'Red Bandana' }, enter: 'walk', a: ['sit', 'curious'], b: ['sit', 'proud'], line: 'smart and always busy' },
  { m: 'October', key: 'dachs', place: 'yard', env: { season: 'autumn', weather: 'sunny', time: 'dusk', halloween: true }, outfit: { head: 'Witch Hat', neck: 'Candy Corn Bandana', body: 'Vampire Cape' }, enter: 'walk', a: ['happy', 'proud'], b: ['happy', 'wink'], line: 'a little bit dramatic' },
  { m: 'November', key: 'mastiff', place: 'house', env: { season: 'autumn', weather: 'sunny', time: 'dusk' }, outfit: { body: 'Cozy Hoodie' }, enter: 'walk', a: ['sit', 'sleepy'], b: ['sit', 'dreamy'], line: 'cozy and calm' },
  { m: 'December', key: 'husky', place: 'hilltop', env: { season: 'winter', weather: 'snow', time: 'dusk' }, outfit: { head: 'Reindeer Antlers', neck: 'Red Bandana' }, enter: 'walk', a: ['howl', null], b: ['sit', 'wow'], line: 'loud and loving' },
];
const NAME = Object.fromEntries(PA.DOGS.map((d) => [d.key, d.name])), BREED = Object.fromEntries(PA.DOGS.map((d) => [d.key, d.breed]));
const INTRO = 2.0, STEP = 2.2, OUTRO = 1.6, END = 2.8, T = INTRO + M.length * STEP + OUTRO + END, SLIDE = 0.22; // 32.8 s
const T_OUT = INTRO + M.length * STEP, T_END = T_OUT + OUTRO; // the "which one are you?" grid, then the end card
const FEET = 1360, SCX = 540;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet"><style>html,body{margin:0;background:#fff}svg{display:block}.hide{display:none}</style>`;
  await p.setContent(`<!doctype html><meta charset="utf-8">${FONTS}<div id="s"></div><span style="font-family:Caveat">a</span>`);
  await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready);
  const shot = async (svg, file, type = 'png') => { await p.evaluate((sv) => { document.getElementById('s').innerHTML = sv; }, svg); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 90 } : {}), clip: { x: 0, y: 0, width: W, height: H } }); };
  const bbox = (sv) => p.evaluate((sv) => { const d = document.createElement('div'); d.innerHTML = sv; document.body.appendChild(d); const e = d.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const r = e.getBBox(); d.remove(); return [r.x, r.y, r.width, r.height]; }, sv);

  // ---- per month: the background (paper top + the place, full width below) and the dog drawings, measured once ----
  const S = [];
  for (let i = 0; i < M.length; i++) {
    const s = M[i], env = Object.assign({ jp: true, halloween: false }, s.env);
    const sceneSvg = `<svg x="0" y="380" width="${W}" height="${H - 380}" viewBox="${s.vb || '285 30 430 560'}" preserveAspectRatio="xMidYMid slice">${inner(PA.scene(s.place, env))}</svg>`;
    const bgFile = path.join(WORK, 'bg', `bg${i}.png`);
    await shot(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${paperBg}${sceneSvg}<rect y="1430" width="${W}" height="${H - 1430}" fill="#2E2235" opacity=".16"/></svg>`, bgFile);
    const bg = 'data:image/png;base64,' + fs.readFileSync(bgFile).toString('base64');
    const poses = [s.enter, s.a[0], s.b[0]], bbs = {};
    for (const ps of poses) if (!bbs[ps]) bbs[ps] = await bbox(PA.dog(s.key, { pose: ps, anim: false, facing: 'right', outfit: s.outfit }));
    const k = Math.min(...Object.values(bbs).map((bb) => Math.min(780 / bb[2], 560 / bb[3]))); // one scale for all of this dog's poses
    S.push({ ...s, bg, bbs, k });
  }
  // the end card's Noodle: no outfit, happy (S[12], drawn by dogAt like the months)
  { const bb = await bbox(PA.dog('dachs', { pose: 'happy', anim: false, facing: 'right' })); S.push({ key: 'dachs', bbs: { happy: bb }, k: Math.min(640 / bb[2], 460 / bb[3]) }); }
  const cache = {};
  // the art draws each pose three times (.pa-d-f0/1/2, the game's "line boil", shown one at a time three times a second): keep exactly one
  const dogAt = (i, pose, expr, fr, cx, lift = 0, sx = 1, sy = 1, rot = 0) => {
    const s = S[i], key = [i, pose, expr, fr].join('|');
    let inn = cache[key];
    if (!inn) { const sv = PA.dog(s.key, { pose, expr: expr || undefined, anim: true, facing: 'right', outfit: s.outfit });
      inn = cache[key] = inner(sv).replace(/class="pa-d-f(\d)"/g, (m0, d) => (+d === fr ? m0 : 'class="hide"')); }
    const bb = s.bbs[pose], w = bb[2] * s.k, h = bb[3] * s.k, x = cx - w / 2, y = FEET - h - lift, r3 = (v) => f1(v * 1000) / 1000;
    return `<ellipse cx="${f1(cx)}" cy="${FEET - 4}" rx="${f1(w * 0.42 * sx * (1 - Math.min(0.35, lift / 300)))}" ry="18" fill="${INK}" opacity="${f1((0.2 - Math.min(0.08, lift / 900)) * 100) / 100}"/>`
      + `<g transform="translate(${f1(cx)} ${f1(FEET - lift)}) rotate(${f1(rot)}) scale(${r3(sx)} ${r3(sy)}) translate(${f1(-cx)} ${f1(-(FEET - lift))})"><svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" viewBox="${bb.map(f1).join(' ')}" overflow="visible">${inn}</svg></g>`;
  };
  // squash and stretch round a pose change at time ts: a quick squash just before, then a springy settle after
  const squash = (u, ts) => { const dt = u - ts; if (dt < -0.07) return 0; if (dt < 0) return (dt + 0.07) / 0.07; return Math.exp(-8 * dt) * Math.cos(17 * dt); };
  const head = (key, expr, cx, cy, r) => { const sv = PA.dogHead(key, { expr }); return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${PAPER}" stroke="${INK}" stroke-width="4"/><svg x="${cx - r * 0.82}" y="${cy - r * 0.86}" width="${r * 1.64}" height="${r * 1.64}" viewBox="2 6 96 96" overflow="visible">${inner(sv)}</svg>`; };
  // the month card at the top, the name card at the bottom
  const topCard = (i, op = 1) => { const s = S[i]; return `<g opacity="${op}">${card(140, 200, 800, 250, -1.5)}${tape(470, 182, 140, 3)}${txt('born in', W / 2, 270, 56, { fill: MUTED, rot: -1.5 })}${txt(s.m, W / 2, 392, 132, { rot: -1.5, fill: i % 2 ? ORANGE : INK })}</g>`; };
  const nameCard = (i, op = 1) => { const s = S[i]; return `<g opacity="${op}">${card(110, 1474, 860, 170, 1)}${txt(`${NAME[s.key]} the ${BREED[s.key]}`, W / 2, 1549, 64, { rot: 1 })}${txt(`you are ${s.line}`, W / 2, 1614, 46, { fill: MUTED, w: 600, rot: 1 })}</g>`; };
  // a month scene at local time u (0..STEP), drawn at horizontal offset ox (for the slide between months)
  const scene = (i, u, ox) => {
    const s = S[i]; let g = `<g transform="translate(${f1(ox)} 0)"><image href="${s.bg}" x="0" y="0" width="${W}" height="${H}"/>`;
    const fr = Math.floor(u * 3) % 3; // line boil, as in the game
    const breath = 1 + 0.012 * Math.sin(u * 2 * Math.PI * 1.3), sway = Math.sin(u * 2 * Math.PI * 0.7) * 0.8;
    if (u < 0.8) { // trots in: a bouncy step rhythm and a little rock, easing into place
      const q = eo3(seg(u, 0.05, 0.72)), cx = -380 + (SCX + 380) * q, step = Math.sin(u * 2 * Math.PI * 3.4), damp = 1 - seg(u, 0.55, 0.78);
      const k = squash(u, 0.8);
      g += dogAt(i, s.enter, null, fr, cx, Math.abs(step) * 18 * damp, 1 + 0.05 * k, (1 - 0.08 * k) * breath, step * 3.2 * damp);
    } else { // first pose and face (springy landing, breathing), then a hop: the pose and face change at the top of it, a soft landing
      const T0 = 1.32, T1 = 1.68, q = seg(u, T0, T1), air = u > T0 && u < T1, lift = air ? Math.sin(Math.PI * q) * 70 : 0;
      const k = u < T0 ? squash(u, 0.8) + squash(u, T0) * (u < T0 ? 1 : 0) : air ? -0.6 * Math.sin(Math.PI * q) : squash(u, T1); // squash, stretch in the air, squash on landing
      const [pose, face] = u < (T0 + T1) / 2 ? s.a : s.b;
      g += dogAt(i, pose, face, fr, SCX, lift, 1 + 0.05 * k, (1 - 0.08 * k) * breath, air ? 0 : sway);
    }
    g += topCard(i) + nameCard(i, eo3(seg(u, 0.35, 0.6))) + `</g>`;
    return g;
  };
  // the grid of all 12 (intro and outro)
  const grid = (op, pick = -1, labels = true) => M.map((s, i) => { const c = i % 3, r = Math.floor(i / 3), cx = 230 + c * 310, cy = 720 + r * 290, on = pick < 0 || pick === i;
    return `<g opacity="${on ? op : op * 0.35}">${head(s.key, s.b[1] || s.a[1] || 'hearts', cx, cy, 108)}${labels ? txt(s.m.slice(0, 3), cx, cy + 160, 50, { fill: i % 2 ? ORANGE : INK }) : ''}</g>`; }).join('');
  const intro = (t) => { let g = paperBg + txt('Your birthday month', W / 2, 300, 108, { rot: -2 }) + txt('= your dog 🎂', W / 2, 430, 120, { rot: -2, fill: ORANGE })
    + txt('find your month, meet your dog', W / 2, 520, 52, { fill: MUTED, w: 600 }) + `<g transform="translate(540 620) scale(0.9) translate(-540 -620)">${grid(eo3(seg(t, 0.1, 0.6)), -1, false)}</g>`; // a little smaller, so the pill sits right under it
    g += `<g opacity="${eo3(seg(t, 0.6, 0.9))}" transform="rotate(-3 540 1690)"><rect x="300" y="1635" width="480" height="80" rx="40" fill="#FFE3A1"/><rect x="300" y="1635" width="480" height="80" rx="40" fill="none" stroke="${INK}" stroke-width="4"/>${txt('find your month 👆', W / 2, 1691, 52)}</g>`;
    return g; };
  const outro = (t) => paperBg + txt('Which one are you?', W / 2, 330, 112, { rot: -2 }) + txt('comment your month 👇', W / 2, 450, 70, { rot: -2, fill: ORANGE }) + grid(eo3(seg(t, 0, 0.35)));
  // the end card: follow us, Noodle wagging with heart eyes (one hop), and where to play; everything above the Reels caption area
  const popIn = (t, a, b) => { const q = seg(t, a, b); return q <= 0 ? 0 : eoB(q); };
  const endCard = (t) => {
    const fr = Math.floor(t * 3) % 3, breath = 1 + 0.012 * Math.sin(t * 2 * Math.PI * 1.3);
    const H0 = 1.1, H1 = 1.42, q = seg(t, H0, H1), air = t > H0 && t < H1, lift = air ? Math.sin(Math.PI * q) * 60 : 0;
    const k = air ? -0.6 * Math.sin(Math.PI * q) : squash(t, H1) + (t < H0 ? squash(t, H0) : 0);
    const sc = (v, x, y) => `transform="translate(${x} ${y}) scale(${f1(v * 1000) / 1000}) translate(${-x} ${-y})"`;
    let g = paperBg;
    g += `<g ${sc(popIn(t, 0.05, 0.4), 540, 330)}>${txt('follow us on Instagram &amp; X', W / 2, 330, 78, { rot: -2 })}</g>`;
    g += `<g ${sc(popIn(t, 0.18, 0.55), 540, 470)}>${txt('@doodledoggo.app', W / 2, 470, 124, { rot: -2, fill: ORANGE })}</g>`;
    for (let j = 0; j < 5; j++) { const ht = t - 0.5 - j * 0.38; if (ht < 0) continue; const y = 1010 - ht * 260, x = 540 + [-170, 150, -60, 210, -230][j] + Math.sin(ht * 5 + j) * 14;
      g += txt('♥', f1(x), f1(y), 54 + (j % 3) * 10, { fill: PINK, op: f1(clamp(1 - ht / 1.6) * 100) / 100 }); }
    g += `<g opacity="${eo3(seg(t, 0.1, 0.4))}" transform="translate(0 -230)">${dogAt(12, 'happy', 'hearts', fr, 540, lift, 1 + 0.05 * k, (1 - 0.08 * k) * breath)}</g>`;
    g += `<g ${sc(popIn(t, 0.45, 0.8), 540, 1290)}><g transform="rotate(-2 540 1290)"><rect x="120" y="1218" width="840" height="150" rx="75" fill="#FFE3A1"/><rect x="120" y="1218" width="840" height="150" rx="75" fill="none" stroke="${INK}" stroke-width="5"/>`
      + `${txt(`<tspan font-size="66" fill="${MUTED}">play at </tspan>doodledoggo.app`, W / 2, 1318, 92)}</g></g>`;
    return g;
  };

  const frameAt = (t) => {
    if (t < INTRO) { // the title, then the grid slides away left as January comes in
      if (t < INTRO - SLIDE) return intro(t);
      const q = eo3(seg(t, INTRO - SLIDE, INTRO)); return `<g transform="translate(${f1(-W * q)} 0)">${intro(t)}</g>` + scene(0, 0, W * (1 - q));
    }
    const tm = t - INTRO, i = Math.floor(tm / STEP);
    if (t >= T_END) return endCard(t - T_END);
    if (t > T_END - SLIDE) { const q = eo3(seg(t, T_END - SLIDE, T_END)); return `<g transform="translate(${f1(-W * q)} 0)">${outro(t - T_OUT)}</g><g transform="translate(${f1(W * (1 - q))} 0)">${endCard(0)}</g>`; }
    if (i >= M.length) { const to = tm - M.length * STEP; return outro(to); }
    const u = tm - i * STEP;
    if (u > STEP - SLIDE) { const q = eo3(seg(u, STEP - SLIDE, STEP)); const next = i + 1 < M.length ? scene(i + 1, 0, W * (1 - q)) : `<g transform="translate(${f1(W * (1 - q))} 0)">${outro(0)}</g>`; return scene(i, u, -W * q) + next; }
    return scene(i, u, 0);
  };
  const page = (g) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`;

  // the cover: the title and the grid (the profile grid shows the middle 1080 x 1440, y 240..1680)
  await shot(page(paperBg + txt('Your birthday month', W / 2, 370, 108, { rot: -2 }) + txt('= your dog 🎂', W / 2, 500, 120, { rot: -2, fill: ORANGE })
    + txt('find your month, meet your dog', W / 2, 590, 52, { fill: MUTED, w: 600 }) + `<g transform="translate(540 680) scale(0.8) translate(-540 -612)">${grid(1, -1, false)}</g>`), path.join(OUT, 'birthday-reel-cover.jpg'), 'jpeg');
  if (process.env.ONLY === 'stills') {
    const ts = process.env.STRIP ? process.env.STRIP.split(',').map(Number) : [1.0, INTRO + 0.5, INTRO + 1.0, INTRO + 1.9, INTRO + 2.1, ...M.map((_, i) => INTRO + i * STEP + 1.8), T_OUT + 1.0, T_END - 0.1, T_END + 0.3, T_END + 1.25, T - 0.3];
    for (const [j, t] of ts.entries()) await shot(page(frameAt(t)), path.join(WORK, `still${String(j).padStart(2, '0')}.png`));
    await b.close(); console.log('stills done'); return;
  }
  const NF = Math.round(T * FPS);
  // FRAMES=a-b re-renders only those frames (b excluded) over a workdir that already holds the other frames from an earlier full render
  const [FA, FB] = process.env.FRAMES ? process.env.FRAMES.split('-').map(Number) : [0, NF];
  for (let fi = FA; fi < Math.min(FB, NF); fi++) { await shot(page(frameAt(fi / FPS)), path.join(WORK, 'f', `f${String(fi).padStart(4, '0')}.png`)); if (fi % 150 === 0) console.log('frame', fi, '/', NF); }

  // music: the game's own engine, the Town Square by day, with a sparkle as the months begin; a soft pop on every month change
  await p.goto('about:blank'); await p.addScriptTag({ path: path.join(root, 'mods', 'pawaudio.js') });
  const r = await p.evaluate(async ([T, T_OUT, T_END]) => { const res = await window.PawAudio._render({ seconds: T + 0.3, wav: true, vols: { master: 0.85, music: 0.66, ambience: 0.08 },
    segments: [{ at: 0, ctx: { place: 'square', time: 'day', weather: 'sunny' } }], stingers: [{ at: 1.9, name: 'sparkle' }, { at: T_OUT, name: 'discover' }, { at: T_END + 0.1, name: 'sparkle' }] }); return { wav: res.wav }; }, [T, T_OUT, T_END]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(r.wav, 'base64'));
  await b.close();
  const SR = 44100, n = Math.ceil(T * SR), pop = new Float32Array(n);
  for (let i = 0; i <= M.length + 1; i++) { const t0 = (i > M.length ? T_END : INTRO + i * STEP) - 0.05; for (let j = 0; j < 0.09 * SR; j++) { const tt = j / SR, idx = Math.floor(t0 * SR) + j; if (idx < n) pop[idx] += 0.3 * Math.sin(2 * Math.PI * (700 - 3000 * tt) * tt) * Math.exp(-40 * tt); } }
  const pcm = Buffer.alloc(44 + n * 2); pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(pop[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(path.join(WORK, 'pop.wav'), pcm);
  const mp4 = path.join(OUT, 'doodle-doggo-birthday-dog-reel.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'), '-i', path.join(WORK, 'pop.wav'),
    '-filter_complex', `[1:a]atrim=0:${T},afade=t=out:st=${T - 0.6}:d=0.6[m];[m][2:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100[a]`,
    '-map', '0:v', '-map', '[a]', '-t', String(T), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString(); console.log('wrote', mp4, d + ' s');
})().catch((e) => { console.error(e); process.exit(1); });
