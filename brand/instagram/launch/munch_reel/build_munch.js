// "Noodle's snack" Reel (1080 x 1920, 30 fps, 16 s): a calm, no-text close-up in the style of the cozy-game ads (one animal, one small
// action, soft background), then an end card. Noodle wags in the autumn yard, a bone drops and he catches it, chews it bite by bite with
// a blissful face (crumbs, crunches), licks his lips, heart eyes and a happy hop; the scene goes soft and pale and the logo comes in with
// "play free at doodledoggo.app". Real art only (PawArt.dog with v2.13 faces, PawArt.scene, PawArt.item), no game UI, no Japanese.
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/munch_reel/build_munch.js <workdir>
//   ONLY=stills: key frames only (STRIP=t1,t2,.. picks them). FRAMES=a-b: re-render only those frames over a workdir copied from an
//   earlier full render (marketing rule: never re-render a whole video for a fix to one part).
// Output next to this file: doodle-doggo-noodle-snack-reel.mp4, noodle-snack-cover.jpg.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname, WORK = path.resolve(process.argv[2] || '/tmp/munch_reel');
fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js', 'world/pawart_world_d.js', 'world/pawart_world_e.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const PA = win.PawArt;
const W = 1080, H = 1920, FPS = 30, T = 16, INK = '#5B3D32', MUTED = '#8A7468', PAPER = '#FFF8EC';
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const f1 = (n) => Math.round(n * 10) / 10, r3 = (n) => Math.round(n * 1000) / 1000;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const eo3 = (x) => 1 - Math.pow(1 - clamp(x), 3), eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eoB = (x) => { x = clamp(x); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };
const env = { time: 'day', weather: 'sunny', season: 'autumn', halloween: false, jp: true };

// ---- Noodle, close up: drawn on the art's own 240 x 200 canvas at scale K, so the idle and happy poses line up and the mouth point is
// fixed; his head (canvas 195, 125) sits a little right of centre, so his front half fills the frame and his long back runs off the left edge ----
const K = 6.6, X0 = 650 - 195 * K, FEET = 1470, Y0 = FEET - 188 * K;
const cx = (x) => X0 + x * K, cy = (y) => Y0 + y * K;
const MOUTH = [cx(221), cy(135)];                                                // the front of his muzzle, idle and happy
const cache = {};
// the art draws each pose three times (.pa-d-f0/1/2, the game's line boil, one at a time three times a second): keep exactly one
const dog = (pose, expr, fr) => { const key = [pose, expr, fr].join('|');
  return cache[key] || (cache[key] = inner(PA.dog('dachs', { pose, expr, anim: true, facing: 'right' })).replace(/class="pa-d-f(\d)"/g, (m0, d) => (+d === fr ? m0 : 'class="hide"'))); };
const dogAt = (pose, expr, fr, lift, sx, sy) => `<g transform="translate(${f1(cx(150))} ${FEET}) scale(${r3(sx)} ${r3(sy)}) translate(${f1(-cx(150))} ${-FEET})">`
  + `<ellipse cx="${f1(cx(122))}" cy="${FEET + 4}" rx="${f1(102 * K * (1 - Math.min(0.3, lift / 300)))}" ry="34" fill="${INK}" opacity="${r3(0.16 - Math.min(0.06, lift / 1000))}"/>`
  + `<svg x="${f1(X0)}" y="${f1(Y0 - lift)}" width="${f1(240 * K)}" height="${f1(200 * K)}" viewBox="0 0 240 200" overflow="visible">${dog(pose, expr, fr)}</svg></g>`;
const BONE = inner(PA.item('Bone-shaped Biscuit'));
const bone = (x, y, s, rot, sx = 1, sy = 1) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)}) scale(${r3(sx)} ${r3(sy)})"><svg x="${f1(-s / 2)}" y="${f1(-s / 2)}" width="${f1(s)}" height="${f1(s)}" viewBox="0 0 64 64" overflow="visible">${BONE}</svg></g>`;
const squash = (t, ts) => { const dt = t - ts; if (dt < -0.07) return 0; if (dt < 0) return (dt + 0.07) / 0.07; return Math.exp(-7 * dt) * Math.cos(16 * dt); };

// ---- the story (seconds) ----
const DROP0 = 1.25, CATCH = 1.85;                       // the bone falls from above into his mouth
const BITES = [3.3, 4.9, 6.5, 7.9, 9.0];                // a crunch each; the bone gets smaller, gone after the last
const SIZES = [230, 190, 152, 116, 78, 0];
const LICK = 9.05, HOP0 = 10.0, HOP1 = 10.36;           // wink after the last bite, then a happy hop into heart eyes
const SOFT0 = 11.7, SOFT1 = 12.5, LOGO = 12.35, PILL = 12.8;
const crumbs = [];                                      // per bite: a little burst of biscuit crumbs that fall to the grass
for (const [b, tb] of BITES.entries()) for (let j = 0; j < 7; j++) { const a = -2.4 + j * 0.55 + Math.sin(b * 7 + j * 3) * 0.25, v = 380 + 160 * Math.abs(Math.sin(b * 3 + j));
  crumbs.push({ t0: tb, vx: Math.cos(a) * v * 0.55, vy: Math.sin(a) * v - 120, r: 10 + (j % 3) * 4, land: FEET - 6 + (j % 4) * 10 - 20 }); }

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet"><style>html,body{margin:0;background:#fff}svg{display:block}.hide{display:none}</style>`;
  await p.setContent(`<!doctype html><meta charset="utf-8">${FONTS}<div id="s"></div><span style="font-family:Caveat">a</span>`);
  await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready);
  const page = (g) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`;
  const shot = async (svg, file, type = 'png') => { await p.evaluate((sv) => { document.getElementById('s').innerHTML = sv; }, svg); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 90 } : {}), clip: { x: 0, y: 0, width: W, height: H } }); };
  const dataUri = (file) => 'data:image/png;base64,' + fs.readFileSync(file).toString('base64');

  // the background, once: the autumn yard (the fence, the clothesline and Mt. Fuji behind), soft like a shallow focus, warm light from the top
  const bgFile = path.join(WORK, 'bg.png');
  await shot(page(`<defs><filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="7"/></filter>`
    + `<radialGradient id="sun" cx="0.7" cy="0.12" r="0.8"><stop offset="0" stop-color="#FFF3C4" stop-opacity=".55"/><stop offset="1" stop-color="#FFF3C4" stop-opacity="0"/></radialGradient>`
    + `<radialGradient id="vig" cx="0.5" cy="0.55" r="0.75"><stop offset=".6" stop-color="#3A2A22" stop-opacity="0"/><stop offset="1" stop-color="#3A2A22" stop-opacity=".22"/></radialGradient></defs>`
    + `<g filter="url(#soft)"><svg x="-40" y="-40" width="${W + 80}" height="${H + 80}" viewBox="300 40 340 560" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('yard', env))}</svg></g>`
    + `<rect width="${W}" height="${H}" fill="url(#sun)"/><rect width="${W}" height="${H}" fill="url(#vig)"/>`), bgFile);
  const BG = `<image href="${dataUri(bgFile)}" x="0" y="0" width="${W}" height="${H}"/>`;
  // two more biscuits in the front grass, out of focus (like the seeds in front of the hamster in the cozy-game ads)
  const fgFile = path.join(WORK, 'fg.png');
  await p.evaluate(() => { document.body.style.background = 'transparent'; document.documentElement.style.background = 'transparent'; });
  await p.evaluate((sv) => { document.getElementById('s').innerHTML = sv; }, page(`<defs><filter id="fb" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs>`
    + `<g filter="url(#fb)" opacity=".95">${bone(150, 1790, 300, -24)}${bone(960, 1830, 260, 28)}</g>`));
  await p.screenshot({ path: fgFile, omitBackground: true, clip: { x: 0, y: 0, width: W, height: H } });
  await p.evaluate(() => { document.body.style.background = '#fff'; document.documentElement.style.background = '#fff'; });
  const FG = `<image href="${dataUri(fgFile)}" x="0" y="0" width="${W}" height="${H}"/>`;
  const LOGO_SVG = fs.readFileSync(path.join(root, 'brand', 'doodle-doggo-logo.svg'), 'utf8').trim().replace(/<title>[^<]*<\/title>/, '').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');

  const scene = (t) => {
    const fr = Math.floor(t * 3) % 3, breath = 1 + 0.01 * Math.sin(t * 2 * Math.PI * 1.2);
    let pose = 'idle', expr, lift = 0, k = 0;
    if (t >= DROP0 && t < CATCH) expr = 'curious';
    else if (t >= CATCH && t < LICK) expr = 'dreamy';
    else if (t >= LICK && t < (HOP0 + HOP1) / 2) expr = 'wink';
    else if (t >= (HOP0 + HOP1) / 2) { pose = 'happy'; expr = 'hearts'; }
    k = squash(t, CATCH) * 0.8 + squash(t, HOP1);
    for (const tb of BITES) k += squash(t, tb) * 0.35;
    if (t > HOP0 && t < HOP1) { const q = seg(t, HOP0, HOP1); lift = Math.sin(Math.PI * q) * 70; k = -0.6 * Math.sin(Math.PI * q); }
    else if (t > HOP0 - 0.07 && t <= HOP0) k = squash(t, HOP0);
    // chewing: a soft steady rhythm while the bone is in his mouth (a tiny nod of the whole dog and a bob of the bone)
    const chewing = t >= CATCH + 0.25 && t < BITES[BITES.length - 1], chew = chewing ? Math.sin((t - CATCH) * 2 * Math.PI * 2.6) : 0;
    let g = BG + dogAt(pose, expr, fr, lift, 1 + 0.04 * k, (1 - 0.07 * k) * breath * (1 - 0.006 * chew));
    // the bone: falls in, then sits in his mouth, smaller after each bite (a quick squish at each crunch)
    if (t >= DROP0 && t < CATCH) { const q = seg(t, DROP0, CATCH); g += bone(MOUTH[0] + 6, -160 + (MOUTH[1] - 4 + 160) * q * q, SIZES[0], -200 + 180 * q); }
    if (t >= CATCH) { let n = 0; while (n < BITES.length && t >= BITES[n]) n++;
      const s = SIZES[n]; if (s > 0) { const sq = Math.max(0, ...BITES.map((tb) => (t >= tb && t < tb + 0.12 ? 1 - (t - tb) / 0.12 : 0)));
        g += bone(MOUTH[0] + 4 + s * 0.12, MOUTH[1] - 4 + chew * 8 - squash(t, CATCH) * 16, s, -20 + chew * 4, 1 + 0.12 * sq, 1 - 0.18 * sq); } }
    // crumbs: fly out at each bite, fall with gravity, rest on the grass, then fade
    for (const c of crumbs) { const dt = t - c.t0; if (dt < 0 || dt > 2.2) continue;
      const fall = Math.min(dt, 0.75), x = MOUTH[0] + 20 + c.vx * fall, y = Math.min(c.land, MOUTH[1] + c.vy * fall + 900 * fall * fall);
      g += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${c.r}" ry="${f1(c.r * 0.8)}" fill="#E9B872" stroke="${INK}" stroke-width="3" opacity="${r3(1 - seg(dt, 1.4, 2.2))}"/>`; }
    return g + FG;
  };
  const endCard = (t) => { // over the softened, pale scene
    const lq = eoB(seg(t, LOGO, LOGO + 0.5)), pq = eoB(seg(t, PILL, PILL + 0.45));
    let g = `<g opacity="${r3(eo3(seg(t, LOGO, LOGO + 0.35)))}" transform="translate(540 820) scale(${r3(0.85 + 0.15 * lq)}) translate(-540 -820)"><svg x="40" y="664" width="1000" height="311" viewBox="0 0 900 280">${inner(LOGO_SVG)}</svg></g>`;
    g += `<g opacity="${r3(eo3(seg(t, PILL, PILL + 0.3)))}" transform="translate(540 1330) scale(${r3(0.85 + 0.15 * pq)}) translate(-540 -1330)">`
      + `<text x="540" y="1060" font-family="Caveat" font-weight="700" font-size="64" fill="${MUTED}" text-anchor="middle">a free cozy dog game</text>`
      + `<rect x="130" y="1258" width="820" height="150" rx="75" fill="#FFE3A1"/><rect x="130" y="1258" width="820" height="150" rx="75" fill="none" stroke="${INK}" stroke-width="5"/>`
      + `<text x="540" y="1358" font-family="Caveat" font-weight="700" font-size="92" fill="${INK}" text-anchor="middle"><tspan font-size="66" fill="${MUTED}">play free at </tspan>doodledoggo.app</text></g>`;
    return g; };
  const frameAt = (t) => {
    const z = 1 + 0.045 * eio(seg(t, 0, SOFT1)), push = `translate(650 1100) scale(${r3(z)}) translate(-650 -1100)`; // a slow push-in
    if (t < SOFT0) return `<g transform="${push}">${scene(t)}</g>`;
    const q = eio(seg(t, SOFT0, SOFT1));
    return `<defs><filter id="end" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${f1(14 * q)}"/></filter></defs>`
      + `<g filter="url(#end)" transform="${push}">${scene(Math.min(t, SOFT1))}</g><rect width="${W}" height="${H}" fill="${PAPER}" opacity="${r3(0.78 * q)}"/>` + endCard(t);
  };

  // the cover: Noodle mid-chew with his blissful face, the logo above (the profile grid shows the middle 1080 x 1440)
  await shot(page(`<g transform="translate(650 1100) scale(1.02) translate(-650 -1100)">${scene(5.6)}</g><svg x="140" y="250" width="800" height="249" viewBox="0 0 900 280">${inner(LOGO_SVG)}</svg>`), path.join(OUT, 'noodle-snack-cover.jpg'), 'jpeg');
  if (process.env.ONLY === 'stills') {
    const ts = process.env.STRIP ? process.env.STRIP.split(',').map(Number) : [0.5, 1.6, 2.2, 3.32, 5.6, 9.2, 10.2, 11.0, 12.1, 13.5];
    if (process.env.DUMP) fs.writeFileSync(path.join(WORK, 'dump.svg'), page(frameAt(+process.env.DUMP)));
    for (const [j, t] of ts.entries()) await shot(page(frameAt(t)), path.join(WORK, `still${String(j).padStart(2, '0')}.png`));
    await b.close(); console.log('stills done'); return;
  }
  const NF = Math.round(T * FPS);
  const [FA, FB] = process.env.FRAMES ? process.env.FRAMES.split('-').map(Number) : [0, NF];
  for (let fi = FA; fi < Math.min(FB, NF); fi++) { await shot(page(frameAt(fi / FPS)), path.join(WORK, 'f', `f${String(fi).padStart(4, '0')}.png`)); if (fi % 120 === 0) console.log('frame', fi, '/', NF); }

  // sound: the game's own yard music, quiet; a soft plop at the catch, a crunch at each bite, little chew clicks between, a sparkle at the logo
  await p.goto('about:blank'); await p.addScriptTag({ path: path.join(root, 'mods', 'pawaudio.js') });
  const r = await p.evaluate(async ([T, LOGO]) => { const res = await window.PawAudio._render({ seconds: T + 0.3, wav: true, vols: { master: 0.85, music: 0.6, ambience: 0.12 },
    segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: [{ at: LOGO, name: 'sparkle' }] }); return { wav: res.wav }; }, [T, LOGO]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(r.wav, 'base64'));
  await b.close();
  const SR = 44100, n = Math.ceil(T * SR), fx = new Float32Array(n);
  let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647 * 2 - 1; };
  const add = (t0, len, fn) => { for (let j = 0; j < len * SR; j++) { const i = Math.floor(t0 * SR) + j; if (i >= 0 && i < n) fx[i] += fn(j / SR); } };
  add(CATCH - 0.01, 0.12, (tt) => 0.35 * Math.sin(2 * Math.PI * (520 - 2400 * tt) * tt) * Math.exp(-30 * tt));               // plop
  for (const tb of BITES) { let lp = 0; add(tb - 0.01, 0.16, (tt) => { lp += 0.45 * (rnd() - lp); return 0.55 * lp * Math.exp(-26 * tt) * (1 + 0.6 * Math.sin(tt * 900)); }); } // crunch
  for (let tc = CATCH + 0.25; tc < BITES[BITES.length - 1]; tc += 1 / 2.6) if (!BITES.some((tb) => Math.abs(tb - tc) < 0.2)) { let lp = 0; add(tc, 0.05, (tt) => { lp += 0.3 * (rnd() - lp); return 0.16 * lp * Math.exp(-70 * tt); }); }
  const pcm = Buffer.alloc(44 + n * 2); pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 2, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(1, 22);
  pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 2, 28); pcm.writeUInt16LE(2, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) pcm.writeInt16LE(Math.max(-32767, Math.min(32767, Math.round(fx[i] * 32767))), 44 + i * 2);
  fs.writeFileSync(path.join(WORK, 'fx.wav'), pcm);
  const md = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(WORK, 'music.wav')]).toString();
  if (!(md > T - 0.5)) throw new Error('music too short: ' + md);
  const mp4 = path.join(OUT, 'doodle-doggo-noodle-snack-reel.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'), '-i', path.join(WORK, 'fx.wav'),
    '-filter_complex', `[1:a]atrim=0:${T},afade=t=in:d=0.6,afade=t=out:st=${T - 0.8}:d=0.8[m];[m][2:a]amix=inputs=2:duration=first:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100[a]`,
    '-map', '0:v', '-map', '[a]', '-t', String(T), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString(); console.log('wrote', mp4, d + ' s');
})().catch((e) => { console.error(e); process.exit(1); });
