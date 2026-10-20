// The screen insert for the "office POV" video: a small browser window with the real Noodle wagging in the game's yard; a cursor clicks
// the bone button, the bone flies to him, he munches, hearts float up. 1280 x 800 (16:10, a laptop screen corner), 60 fps, 8 s, no sound.
// It is made to be pinned onto the laptop screen of an AI-generated office shot (see docs/marketing/POV_OFFICE_VIDEO.md).
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/pov/build_screen.js <workdir>
// Output next to this file: noodle-browser-insert.mp4 (and noodle-browser-insert-still.png, the first frame, for checking the fit).
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname, WORK = path.resolve(process.argv[2] || '/tmp/pov_screen');
fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const PA = win.PawArt;
const W = 1280, H = 800, FPS = 60, T = 8, INK = '#5B3D32', PINK = '#F28FA5', PAPER = '#FFFBF2';
const URL = process.env.URL || 'an9ou.itch.io/doodle-doggo';
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const f1 = (n) => Math.round(n * 10) / 10;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), seg = (t, a, b) => clamp((t - a) / (b - a)), eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
const env = { time: 'day', weather: 'sunny', season: 'autumn', halloween: false, jp: true };
// the browser window: title bar with three dots, the address bar, then the page (the game's yard)
const VX = 0, VY = 64, VW = W, VH = H - 64; // page area
const chrome = `<rect width="${W}" height="${H}" rx="18" fill="#F3EFE8"/><rect x="0" y="0" width="${W}" height="64" rx="18" fill="#E7E1D7"/><rect x="0" y="40" width="${W}" height="24" fill="#E7E1D7"/>`
  + ['#F26B5E', '#F5BF4F', '#61C554'].map((c, i) => `<circle cx="${28 + i * 26}" cy="32" r="8" fill="${c}"/>`).join('')
  + `<rect x="120" y="14" width="${W - 240}" height="36" rx="18" fill="#FFFFFF"/><path d="M146 26v8a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-8z M149 26v-3a4 4 0 0 1 8 0v3" fill="none" stroke="#8A8A8A" stroke-width="2"/>`
  + `<text x="172" y="39" font-family="Helvetica, Arial, sans-serif" font-size="19" fill="#3A3A3A">${URL}</text>`;
const scene = `<svg x="${VX}" y="${VY}" width="${VW}" height="${VH}" viewBox="40 70 900 515" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('yard', env))}</svg>`;
const FEET = 700, NW = 520, NX = 560; // Noodle: feet line, width, centre x
// a two-frame dog (the art's own animation frames .pa-d-f0 / .pa-d-f1), we show one of them per video frame
const dogSvg = (pose, expr, fr, bb) => { const sv = PA.dog('dachs', { pose, expr, anim: true, facing: 'right' }).replace('<svg ', `<svg data-fr="${fr}" `), k = NW / bb[2], w = bb[2] * k, h = bb[3] * k;
  return `<svg x="${f1(NX - w / 2)}" y="${f1(FEET - h)}" width="${f1(w)}" height="${f1(h)}" viewBox="${bb.map(f1).join(' ')}" overflow="visible">${inner(sv).replace(fr ? /class="pa-d-f0"/ : /class="pa-d-f1"/, 'class="hide"')}</svg>`; };
const bone = (x, y, s, rot) => `<g transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(rot)})"><svg x="${-s / 2}" y="${-s / 2}" width="${s}" height="${s}" viewBox="0 0 64 64" overflow="visible">${inner(PA.item('Bone-shaped Biscuit'))}</svg></g>`;
const heart = (x, y, s, o) => `<path transform="translate(${f1(x)} ${f1(y)}) scale(${f1(s * 100) / 100})" d="M0 8C-14 -2 -12 -16 -3 -14C0 -13 0 -10 0 -9C0 -10 0 -13 3 -14C12 -16 14 -2 0 8Z" fill="${PINK}" stroke="${INK}" stroke-width="2.4" opacity="${f1(o * 100) / 100}"/>`;
const cursor = (x, y, press) => `<g transform="translate(${f1(x)} ${f1(y)}) scale(${press ? 0.88 : 1})"><path d="M0 0L0 30L8 23L13 35L18 33L13 21L24 21Z" fill="#FFFFFF" stroke="#111" stroke-width="2" stroke-linejoin="round"/></g>`;
const BTN = [86, 690]; // the bone button, bottom-left of the page
const button = (glow) => `<g><circle cx="${BTN[0]}" cy="${BTN[1]}" r="48" fill="${PAPER}" stroke="${INK}" stroke-width="4"/>${glow ? `<circle cx="${BTN[0]}" cy="${BTN[1]}" r="${f1(48 + 22 * glow)}" fill="none" stroke="#FFD66B" stroke-width="6" opacity="${f1((1 - glow) * 100) / 100}"/>` : ''}${bone(BTN[0], BTN[1] + 2, 70, -20)}</g>`;

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe }), p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(`<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:transparent}svg{display:block}.hide{display:none}</style><div id="s"></div>`);
  const bboxOf = (sv) => p.evaluate((sv) => { const d = document.createElement('div'); d.innerHTML = sv; document.body.appendChild(d); const e = d.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const r = e.getBBox(); d.remove(); return [r.x, r.y, r.width, r.height]; }, sv);
  const BB = await bboxOf(PA.dog('dachs', { pose: 'happy', anim: false, facing: 'right' }));
  // where the bone lands: his mouth in the happy pose (canvas point ~220,132 of the 240 x 200 art, facing right), mapped like dogSvg does
  const K = NW / BB[2], MOUTH = [NX - NW / 2 + (219 - BB[0]) * K, FEET - BB[3] * K + (133 - BB[1]) * K];
  const NF = T * FPS;
  for (let fi = 0; fi < NF; fi++) {
    const t = fi / FPS, wag = Math.floor(t / 0.18) % 2;
    // 0-2.4 wag and the cursor glides to the button; 2.4 click; 2.45-3.2 the bone flies; 3.2-6.4 munching + hearts; 6.4-8 heart eyes, wagging
    let pose = 'happy', expr = undefined, fr = wag;
    // he eats it with his head up (the eat pose is made for a bowl in front of him, and there is no bowl here): his yum face, bone in his mouth
    if (t >= 3.2 && t < 6.4) { pose = 'happy'; expr = 'yum'; }
    if (t >= 6.4) { pose = 'happy'; expr = 'hearts'; }
    let g = chrome + scene + dogSvg(pose, expr, fr, BB);
    const click = t >= 2.4 && t < 2.6, glow = t >= 2.4 && t < 2.9 ? seg(t, 2.4, 2.9) : 0;
    g += button(glow);
    if (t >= 2.45 && t < 3.25) { const q = eio(seg(t, 2.45, 3.2)), x = BTN[0] + (MOUTH[0] - BTN[0]) * q, y = BTN[1] + (MOUTH[1] - BTN[1]) * q - Math.sin(Math.PI * q) * 260; g += bone(x, y, 76, -20 + 380 * q); }
    if (t >= 3.2 && t < 5.2) { const chew = Math.floor(t / 0.16) % 2; g += bone(MOUTH[0] + 4, MOUTH[1] - 8 + (chew ? 5 : 0), 78 * (1 - seg(t, 3.2, 5.2) * 0.75), chew ? -4 : 6); } // it gets smaller as he eats it
    // hearts: a new one every 0.45 s from 3.4 s on, each rises and fades over 1.6 s
    for (let k = 0; k < 10; k++) { const t0 = 3.4 + k * 0.45, q = seg(t, t0, t0 + 1.6); if (t < t0 || q >= 1) continue;
      g += heart(NX + NW * 0.30 + Math.sin(k * 2.1) * 60 + Math.sin(q * 6 + k) * 10, FEET - 330 - q * 220, 1.6 + (k % 3) * 0.3, q < 0.15 ? q / 0.15 : 1 - Math.max(0, q - 0.6) / 0.4); }
    // the cursor: in from the right, to the button, click, then drifts away
    const cx = t < 0.4 ? W + 40 : t < 2.3 ? (W - 160) + (BTN[0] + 10 - (W - 160)) * eio(seg(t, 0.4, 2.3)) : t < 3.2 ? BTN[0] + 10 : BTN[0] + 10 + 220 * eio(seg(t, 3.2, 4.4));
    const cy = t < 0.4 ? 560 : t < 2.3 ? 560 + (BTN[1] + 4 - 560) * eio(seg(t, 0.4, 2.3)) : t < 3.2 ? BTN[1] + 4 : BTN[1] + 4 + 70 * eio(seg(t, 3.2, 4.4));
    g += cursor(cx, cy, click);
    await p.evaluate((sv) => { document.getElementById('s').innerHTML = sv; }, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`);
    await p.screenshot({ path: path.join(WORK, 'f', `f${String(fi).padStart(4, '0')}.png`), omitBackground: true });
    if (fi === 0) fs.copyFileSync(path.join(WORK, 'f', 'f0000.png'), path.join(OUT, 'noodle-browser-insert-still.png'));
    if (fi % 120 === 0) console.log('frame', fi, '/', NF);
  }
  await b.close();
  const mp4 = path.join(OUT, 'noodle-browser-insert.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', String(FPS), '-i', path.join(WORK, 'f', 'f%04d.png'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4]);
  console.log('wrote', mp4);
})().catch((e) => { console.error(e); process.exit(1); });
