// "Sketchbook world tour" ad Reel (1080 x 1920, 30 fps, about 16 s), after the AFK Journey world ad the owner shared (23 Oct 2026): a slow
// drifting camera over one place every 1.9 s, in unlock order, each in its own season, weather and time of day (spring petals, summer
// sparkle, rain, dusk, falling leaves, night lights, sunset), a small crayon dog trotting through each (a different random dog each time),
// the place's name and its real Bond unlock under it; then the end card. Real art only (PawArt.scene, PawArt.dog), no game UI, English.
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/world_tour/build_tour.js <workdir>
//   SEED=n picks another set of dogs (printed). ONLY=stills: key frames only (STRIP=t1,t2,.. picks them). FRAMES=a-b: re-render only those
//   frames over a workdir copied from an earlier full render (marketing rule: never re-render a whole video for a fix to one part).
// Output next to this file: doodle-doggo-world-tour.mp4, world-tour-cover.jpg.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname, WORK = path.resolve(process.argv[2] || '/tmp/world_tour');
fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js', 'world/pawart_world_d.js', 'world/pawart_world_e.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const PA = win.PawArt;
const W = 1080, H = 1920, FPS = 30, INK = '#5B3D32', MUTED = '#8A7468', PAPER = '#FFF8EC';
const inner = (svg) => svg.trim().replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const f1 = (n) => Math.round(n * 10) / 10, r3 = (n) => Math.round(n * 1000) / 1000;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a));
const eo3 = (x) => 1 - Math.pow(1 - clamp(x), 3), eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const eoB = (x) => { x = clamp(x); const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); };

// ---- the places, in unlock order (Bond from PLACES in game/src/00_core.js and TK_PLACES in game/src/39_tokyo.js) ----
// x0 -> x1: the camera drift across the 1000 x 600 scene; gy: where the dog trots (scene units); fx: the weather on top; mus: the music
const SHOTS = [
  { scene: 'yard', name: 'Home Yard', bond: 1, env: { time: 'day', weather: 'sunny', season: 'spring' }, x0: 130, x1: 300, gy: 478, fx: 'petals', mus: { place: 'yard', time: 'day', weather: 'sunny' } },
  { scene: 'river', name: 'Riverside', bond: 2, env: { time: 'day', weather: 'sunny', season: 'summer' }, x0: 300, x1: 470, gy: 520, fx: 'sparkle', mus: { place: 'river', time: 'day', weather: 'sunny' } },
  { scene: 'shibuya', name: 'Shibuya Crossing', bond: 3, env: { time: 'day', weather: 'rain', season: 'summer' }, x0: 90, x1: 260, gy: 505, fx: 'rain', mus: { place: 'market', time: 'day', weather: 'rain' } },
  { scene: 'asakusa', name: 'Asakusa', bond: 4, env: { time: 'dusk', weather: 'sunny', season: 'autumn' }, x0: 250, x1: 420, gy: 500, fx: 'glow', mus: { place: 'park', time: 'dusk', weather: 'sunny' } },
  { scene: 'woods', name: 'Maple Woods', bond: 5, env: { time: 'day', weather: 'sunny', season: 'autumn' }, x0: 140, x1: 330, gy: 478, fx: 'leaves', mus: { place: 'woods', time: 'day', weather: 'sunny' } },
  { scene: 'tokyotower', name: 'Tokyo Tower', bond: 5, env: { time: 'night', weather: 'sunny', season: 'autumn' }, x0: 380, x1: 520, gy: 520, fx: 'night', mus: { place: 'walk', time: 'night', weather: 'sunny' } },
  { scene: 'beach', name: 'Seashell Beach', bond: 8, env: { time: 'dusk', weather: 'sunny', season: 'summer' }, x0: 360, x1: 540, gy: 505, fx: 'sunset', mus: { place: 'beach', time: 'dusk', weather: 'sunny' } },
];
const STEP = 1.9, XF = 0.4, VH = 560, VY = 30, VW = VH * W / H;      // a shot every 1.9 s with a 0.4 s crossfade; the portrait window on the scene
const END0 = SHOTS.length * STEP, T = END0 + XF + 2.6;              // the end card fades in over the last place
const LOGO = END0 + 0.35, PILL = END0 + 0.8;

// ---- a different dog in each place (random, but fixed by SEED so a remake matches); the Chihuahua was the last ad's dog ----
let sd = +(process.env.SEED || 23); const rr = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
const pool = PA.DOGS.map((d) => d.key).filter((k) => k !== 'chihuahua');
for (const s of SHOTS) s.dog = pool.splice(Math.floor(rr() * pool.length), 1)[0];
console.log('dogs:', SHOTS.map((s) => s.dog).join(' '));

// ---- weather and light on top of each place, in screen space, fixed so remakes match ----
const P = Array.from({ length: 40 }, () => ({ x: rr(), y: rr(), s: rr(), ph: rr() * 6.28 }));
const petal = (x, y, s, a, c) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)}) scale(${r3(s)})"><path d="M0 -10C7 -6 7 6 0 10C-7 6 -7 -6 0 -10Z" fill="${c}" stroke="${INK}" stroke-width="1.6" opacity=".9"/></g>`;
const leafS = (x, y, s, a, c) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(a)}) scale(${r3(s)})"><path d="M0 -14C9 -8 9 7 0 14C-9 7 -9 -8 0 -14Z" fill="${c}" stroke="${INK}" stroke-width="2"/><path d="M0 -10L0 17" stroke="${INK}" stroke-width="1.6"/></g>`;
const star4 = (x, y, r, o) => `<path transform="translate(${f1(x)} ${f1(y)})" d="M0 ${-r}Q${r * 0.18} ${-r * 0.18} ${r} 0Q${r * 0.18} ${r * 0.18} 0 ${r}Q${-r * 0.18} ${r * 0.18} ${-r} 0Q${-r * 0.18} ${-r * 0.18} 0 ${-r}Z" fill="#FFF7D6" opacity="${r3(o)}"/>`;
const weather = (fx, u) => { let g = '';
  if (fx === 'petals') P.slice(0, 22).forEach((p, i) => { const y = ((p.y * H + u * (120 + 80 * p.s)) % (H + 80)) - 40, x = ((p.x * W - u * (90 + 50 * p.s) + Math.sin(u * 2 + p.ph) * 30) % W + W) % W;
    g += petal(x, y, 1.6 + 1.6 * p.s, p.ph * 50 + u * 90, i % 3 ? '#F9C3D1' : '#F4A7BC'); });
  if (fx === 'sparkle') P.slice(0, 18).forEach((p) => { const o = Math.max(0, Math.sin(u * 4 + p.ph * 3)); g += star4(p.x * W, 1050 + p.y * 330, 10 + 14 * p.s, o * 0.95); });
  if (fx === 'rain') P.forEach((p) => { const y = ((p.y * H + u * 2600) % (H + 200)) - 100, x = p.x * W - (y / H) * 120; g += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${f1(x - 14)}" y2="${f1(y + 70)}" stroke="#DCE8F2" stroke-width="${f1(2 + 2 * p.s)}" stroke-linecap="round" opacity=".55"/>`; });
  if (fx === 'glow' || fx === 'night' || fx === 'sunset') P.slice(0, fx === 'night' ? 26 : 16).forEach((p) => { const y = ((p.y * H - u * (25 + 30 * p.s)) % H + H) % H, x = p.x * W + Math.sin(u + p.ph) * 25;
    g += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(4 + 10 * p.s)}" fill="${fx === 'night' ? '#FFE9A8' : '#FFD9A0'}" opacity="${r3((0.35 + 0.35 * Math.sin(u * 3 + p.ph)) * (fx === 'night' ? 1 : 0.7))}"/>`; });
  if (fx === 'night') P.slice(26, 40).forEach((p) => { g += star4(p.x * W, p.y * 700, 8 + 10 * p.s, Math.max(0, Math.sin(u * 3 + p.ph * 2))); });
  if (fx === 'leaves') P.slice(0, 16).forEach((p, i) => { const y = ((p.y * H + u * (150 + 90 * p.s)) % (H + 100)) - 50, x = p.x * W + Math.sin(u * 1.6 + p.ph) * 60;
    g += leafS(x, y, 1.6 + 1.8 * p.s, Math.sin(u * 2 + p.ph) * 60 + u * 40, ['#E8863A', '#F2B33D', '#D9693A'][i % 3]); });
  return g; };

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

  // each place drawn once into a sharp 3800 x 2280 picture (the window shows about 3.6 px per scene unit), handed to the page once as a
  // blob URL, so each frame's drift is a cheap pan over it
  for (const [i, s] of SHOTS.entries()) {
    const file = path.join(WORK, `place${i}.png`);
    if (!fs.existsSync(file)) {
      const p2 = await b.newPage({ viewport: { width: 1000, height: 600 }, deviceScaleFactor: 3.8 });
      await p2.setContent(`<style>body{margin:0}svg{display:block}[class$="-hl"]{display:none}</style>${PA.scene(s.scene, Object.assign({ jp: true, halloween: false }, s.env)).replace('<svg', '<svg width="1000" height="600"')}`);
      await p2.screenshot({ path: file }); await p2.close();
    }
    s.img = await p.evaluate(async (b64) => URL.createObjectURL(await (await fetch('data:image/png;base64,' + b64)).blob()), fs.readFileSync(file).toString('base64'));
  }
  await p.evaluate(async (urls) => { await Promise.all(urls.map((u) => { const im = new Image(); im.src = u; return im.decode(); })); }, SHOTS.map((s) => s.img));
  const LOGO_SVG = inner(fs.readFileSync(path.join(root, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<title>[^<]*<\/title>/, '').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, ''));
  const dogCache = {};
  const dog = (key, fr) => dogCache[key + fr] || (dogCache[key + fr] = inner(PA.dog(key, { pose: 'walk', anim: true, facing: 'right' })).replace(/class="pa-d-f(\d)"/g, (m0, d) => (+d === fr ? m0 : 'class="hide"')));

  // one place at local time u (0..STEP+XF): the camera drifts (x0 -> x1, a slight zoom), the dog trots through, the title rises in
  const place = (i, u) => {
    const s = SHOTS[i], q = u / (STEP + XF), z = 1 + 0.05 * q, vw = VW / z, vh = VH / z;
    const vx = s.x0 + (s.x1 - s.x0) * q + (VW - vw) / 2, vy = VY + (VH - vh) * 0.6;
    const k = W / vw;                                       // screen px per scene unit
    let g = `<image href="${s.img}" x="${f1(-vx * k)}" y="${f1(-vy * k)}" width="${f1(1000 * k)}" height="${f1(600 * k)}"/>`;
    // the dog: trots right a little faster than the camera drifts, a small bounce in its step
    const fr = Math.floor(u * 6) % 3, dx = s.x0 + VW * 0.18 + (s.x1 - s.x0 + 70) * q, bob = Math.abs(Math.sin(u * Math.PI * 4.2)) * 3.2, DW = 92;
    const sx = (dx - vx) * k, sy = (s.gy - vy) * k, dw = DW * k;
    g += `<ellipse cx="${f1(sx)}" cy="${f1(sy)}" rx="${f1(dw * 0.3)}" ry="${f1(dw * 0.045)}" fill="#3A2A22" opacity=".18"/>`;
    g += `<svg x="${f1(sx - dw / 2)}" y="${f1(sy - dw * 200 / 240 * 0.94 - bob * k)}" width="${f1(dw)}" height="${f1(dw * 200 / 240)}" viewBox="0 0 240 200" overflow="visible">${dog(s.dog, fr)}</svg>`;
    g += weather(s.fx, u + i * 3);
    g += `<rect width="${W}" height="${H}" fill="url(#shade)"/>`;
    // the title: the place's name and its Bond, rising in after the cut, gone before the next one (a soft dark glow behind it, for light places)
    const o = eo3(seg(u, 0.25, 0.6)) * (1 - seg(u, STEP - 0.05, STEP + 0.25)), rise = (1 - eo3(seg(u, 0.25, 0.7))) * 24;
    g += `<g opacity="${r3(o)}" transform="translate(0 ${f1(rise)})" filter="url(#ts)" fill="#FFFBF2" font-family="Caveat" font-weight="700" text-anchor="middle">`
      + `<ellipse cx="540" cy="955" rx="470" ry="115" fill="#2A1E18" opacity=".3" filter="url(#glow)"/>`
      + `<text x="540" y="930" font-size="124">${s.name}</text><text x="540" y="1004" font-size="58" opacity=".95">unlocks at Bond ${s.bond}</text></g>`;
    return g;
  };
  const DEFS = `<defs><linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset=".35" stop-color="#000" stop-opacity="0"/>`
    + `<stop offset=".65" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>`
    + `<filter id="glow" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="45"/></filter>`
    + `<filter id="ts" x="-20%" y="-50%" width="140%" height="200%"><feDropShadow dx="0" dy="4" stdDeviation="7" flood-color="#2A1E18" flood-opacity=".6"/></filter></defs>`;
  const endCard = (t) => {
    const lq = eoB(seg(t, LOGO, LOGO + 0.5)), pq = eoB(seg(t, PILL, PILL + 0.45));
    return `<g opacity="${r3(eo3(seg(t, LOGO, LOGO + 0.35)))}" transform="translate(540 820) scale(${r3(0.85 + 0.15 * lq)}) translate(-540 -820)"><svg x="40" y="664" width="1000" height="311" viewBox="0 0 900 280">${LOGO_SVG}</svg></g>`
      + `<g opacity="${r3(eo3(seg(t, PILL, PILL + 0.3)))}" transform="translate(540 1330) scale(${r3(0.85 + 0.15 * pq)}) translate(-540 -1330)">`
      + `<text x="540" y="1060" font-family="Caveat" font-weight="700" font-size="66" fill="${MUTED}" text-anchor="middle">a whole sketchbook world to explore</text>`
      + `<rect x="130" y="1258" width="820" height="150" rx="75" fill="#FFE3A1"/><rect x="130" y="1258" width="820" height="150" rx="75" fill="none" stroke="${INK}" stroke-width="5"/>`
      + `<text x="540" y="1358" font-family="Caveat" font-weight="700" font-size="92" fill="${INK}" text-anchor="middle"><tspan font-size="66" fill="${MUTED}">play free at </tspan>doodledoggo.app</text></g>`;
  };
  const frameAt = (t) => {
    let g = DEFS;
    if (t < END0 + XF) { const i = Math.min(SHOTS.length - 1, Math.floor(t / STEP)), u = t - i * STEP;
      g += place(i, u);
      if (u > STEP && i + 1 < SHOTS.length) g += `<g opacity="${r3(eio(seg(u, STEP, STEP + XF)))}">${place(i + 1, u - STEP)}</g>`; }
    if (t >= END0) { const q = eio(seg(t, END0, END0 + XF)), last = SHOTS.length - 1;
      g += `<defs><filter id="end" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="${f1(14 * q)}"/></filter></defs>`
        + `<g filter="url(#end)">${place(last, Math.min(t - last * STEP, STEP + XF))}</g><rect width="${W}" height="${H}" fill="${PAPER}" opacity="${r3(0.8 * q)}"/>` + endCard(t); }
    return g;
  };

  // the cover: Tokyo Tower at night with its title, the logo above (the profile grid shows the middle 1080 x 1440)
  await shot(page(DEFS + place(5, 1.0) + `<svg x="140" y="250" width="800" height="249" viewBox="0 0 900 280" filter="url(#ts)">${LOGO_SVG}</svg>`), path.join(OUT, 'world-tour-cover.jpg'), 'jpeg');
  if (process.env.ONLY === 'stills') {
    const ts = process.env.STRIP ? process.env.STRIP.split(',').map(Number) : SHOTS.map((_, i) => i * STEP + 1.0).concat([STEP * 2 + 2.05, END0 + 1.5]);
    for (const [j, t] of ts.entries()) await shot(page(frameAt(t)), path.join(WORK, `still${String(j).padStart(2, '0')}.png`));
    await b.close(); console.log('stills done'); return;
  }
  const NF = Math.round(T * FPS);
  const [FA, FB] = process.env.FRAMES ? process.env.FRAMES.split('-').map(Number) : [0, NF];
  for (let fi = FA; fi < Math.min(FB, NF); fi++) { await shot(page(frameAt(fi / FPS)), path.join(WORK, 'f', `f${String(fi).padStart(4, '0')}.png`)); if (fi % 120 === 0) console.log('frame', fi, '/', NF); }

  // sound: the game's own music, changing with each place (its place, time and weather), and a sparkle at the logo
  await p.goto('about:blank'); await p.addScriptTag({ path: path.join(root, 'mods', 'pawaudio.js') });
  const r = await p.evaluate(async ([T, segs, LOGO]) => { const res = await window.PawAudio._render({ seconds: T + 0.3, wav: true, vols: { master: 0.85, music: 0.7, ambience: 0.2 },
    segments: segs, stingers: [{ at: LOGO, name: 'sparkle' }] }); return { wav: res.wav }; }, [T, SHOTS.map((s, i) => ({ at: i * STEP + (i ? XF / 2 : 0), ctx: s.mus })), LOGO]);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(r.wav, 'base64'));
  await b.close();
  const md = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path.join(WORK, 'music.wav')]).toString();
  if (!(md > T - 0.5)) throw new Error('music too short: ' + md);
  const mp4 = path.join(OUT, 'doodle-doggo-world-tour.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-i', path.join(WORK, 'music.wav'),
    '-filter_complex', `[1:a]atrim=0:${T},afade=t=in:d=0.5,afade=t=out:st=${f1(T - 0.8)}:d=0.8,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=44100[a]`,
    '-map', '0:v', '-map', '[a]', '-t', String(T), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4]).toString(); console.log('wrote', mp4, d + ' s');
})().catch((e) => { console.error(e); process.exit(1); });
