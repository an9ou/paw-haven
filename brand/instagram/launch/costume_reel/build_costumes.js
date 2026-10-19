// "Stop the video to dress Noodle" Halloween Reel (1080 x 1920, about 18 s, loops): Noodle stands in the game's Halloween yard while
// every Halloween costume the game has flashes past, one every 0.2 s. Viewers pause or screenshot to "get" a costume and comment it.
// Real art only (PawArt.dog('dachs', { outfit }), PawArt.scene('yard')), no game UI. Music: the game's own engine (mods/pawaudio.js).
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/costume_reel/build_costumes.js <workdir>
//   (ONLY=frames renders the stills and the cover without the video)
// Output: doodle-doggo-costume-reel.mp4 and costume-reel-cover.jpg next to this file.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname, WORK = path.resolve(process.argv[2] || '/tmp/costume_reel');
fs.mkdirSync(path.join(WORK, 'f'), { recursive: true });
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const PA = win.PawArt;
const W = 1080, H = 1920, FPS = 30, INK = '#5B3D32', PINK = '#F28FA5', MUTED = '#8A7468', ORANGE = '#E8863A', PLUM = '#7A5C9E', PAPER = '#FFFBF2';
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const f1 = (n) => Math.round(n * 10) / 10;
const txt = (s, x, y, size, o = {}) => `<text x="${x}" y="${y}" font-family="${o.jp ? "'Zen Maru Gothic'" : 'Caveat'}" font-weight="${o.w || 700}" font-size="${size}" fill="${o.fill || INK}" text-anchor="middle"${o.rot ? ` transform="rotate(${o.rot} ${x} ${y})"` : ''}>${s}</text>`;
const card = (x, y, w, h, rot = 0, fill = PAPER) => `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"><rect x="${x + 6}" y="${y + 10}" width="${w}" height="${h}" rx="34" fill="${INK}" opacity=".18"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="${fill}" stroke="${INK}" stroke-width="5"/></g>`;
const tape = (x, y, w, rot) => `<rect x="${x}" y="${y}" width="${w}" height="40" fill="${PINK}" opacity=".55" transform="rotate(${rot} ${x + w / 2} ${y + 20})"/>`;

// ---- every Halloween costume in the game (CLOTHES with fest: 'halloween', game/src/00_core.js), then some fun combinations ----
const LOOKS = [
  ['Witch Hat', { head: 'Witch Hat' }], ['Vampire Cape', { body: 'Vampire Cape' }], ['Candy Corn Bandana', { neck: 'Candy Corn Bandana' }], ['Bat Wings', { body: 'Bat Wings' }],
  ['Pumpkin Patch Suit', { body: 'Pumpkin Patch Suit' }], ['Trick-or-Treat Ghost', { body: 'Trick-or-Treat Ghost' }], ['Little Bat Costume', { body: 'Little Bat Costume' }],
  ['Ghost Sheet', { body: 'Ghost Sheet' }], ['Pumpkin Suit', { body: 'Pumpkin Suit' }], ['Parade Rosette', { neck: 'Parade Rosette' }],
  ['Witch Hat + Vampire Cape', { head: 'Witch Hat', body: 'Vampire Cape' }], ['Witch Hat + Candy Corn Bandana', { head: 'Witch Hat', neck: 'Candy Corn Bandana' }],
  ['Witch Hat + Bat Wings', { head: 'Witch Hat', body: 'Bat Wings' }], ['Bat Wings + Candy Corn Bandana', { body: 'Bat Wings', neck: 'Candy Corn Bandana' }],
  ['Vampire Cape + Parade Rosette', { body: 'Vampire Cape', neck: 'Parade Rosette' }], ['Witch Hat + Pumpkin Suit', { head: 'Witch Hat', body: 'Pumpkin Suit' }],
  ['The Full Witch', { head: 'Witch Hat', neck: 'Candy Corn Bandana', body: 'Vampire Cape' }], ['No costume (he drew himself)', {}],
];

// ---- the stage: the game's yard at dusk, Halloween on, Japan scenery on ----
const env = { time: 'dusk', weather: 'sunny', season: 'autumn', halloween: true, jp: true };
const scene = `<svg x="0" y="380" width="${W}" height="${H - 380}" viewBox="${process.env.VB || '262 30 430 560'}" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('yard', env))}</svg>`;
const paperTop = `<rect width="${W}" height="${H}" fill="#FFF8EC"/><defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="2" fill="#E3D2BA"/></pattern></defs><rect width="${W}" height="440" fill="url(#dots)"/>`;
let NB = null; // Noodle's drawn outline in his 240 x 200 canvas, measured once (plain), so every costume keeps the same size and place
const noodle = (outfit) => { const sv = PA.dog('dachs', { pose: 'happy', facing: 'right', anim: false, outfit }); const [bx, by, bw, bh] = NB, k = 860 / bw, w = bw * k, h = bh * k, x = W / 2 - w / 2 - 10, y = 1330 - h;
  return `<ellipse cx="${W / 2}" cy="1326" rx="380" ry="26" fill="${INK}" opacity=".22"/><svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" viewBox="${[bx, by, bw, bh].map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>`; };
const label = (s) => { const fs2 = s.length > 24 ? 54 : 66; return card(110, 1390, 860, 120, -1.2) + tape(470, 1370, 140, 3) + txt(s, W / 2, 1472, fs2, { rot: -1.2 }); };
const pill = (s2, size = 50, w = 640) => `<g transform="rotate(-1 ${W / 2} 1585)"><rect x="${W / 2 - w / 2}" y="1546" width="${w}" height="80" rx="40" fill="${PLUM}" stroke="${INK}" stroke-width="4"/>${txt(s2, W / 2, 1600, size, { fill: '#FFF8EC' })}</g>`;
const comment = pill('comment what Noodle got 👇');
const page = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${paperTop}${scene}<rect x="0" y="1340" width="${W}" height="${H - 1340}" fill="#2E2235" opacity=".18"/>${body}</svg>`;

const hookHead = () => card(70, 190, 940, 330, -1.5) + tape(470, 172, 140, -3)
  + txt('STOP the video', W / 2, 330, 128, { rot: -1.5 }) + txt('to dress Noodle 🎃', W / 2, 432, 92, { rot: -1.5, fill: ORANGE })
  + txt('止めてヌードルに仮装させよう！', W / 2, 494, 40, { jp: true, rot: -1.5, fill: MUTED });
const cycleHead = () => card(90, 200, 900, 230, -1) + tape(470, 182, 140, 2)
  + txt('pause = his costume 🎃', W / 2, 318, 96, { rot: -1 }) + txt('止めたらその衣装に決定！', W / 2, 392, 40, { jp: true, rot: -1, fill: MUTED });
const endHead = () => card(70, 190, 940, 330, -1.5, '#FFE3A1') + tape(470, 172, 140, 3)
  + txt('Play free on itch.io', W / 2, 322, 112, { rot: -1.5 }) + txt('@doodledoggo.app', W / 2, 410, 64, { rot: -1.5, fill: PLUM })
  + txt('無料で遊べます・itch.io', W / 2, 478, 40, { jp: true, rot: -1.5, fill: MUTED });

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  await p.setContent(`<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Zen+Maru+Gothic:wght@700&display=swap" rel="stylesheet"><style>html,body{margin:0;background:#fff}svg{display:block}</style><div id="s"></div><span style="font-family:Caveat">a</span><span style="font-family:'Zen Maru Gothic'">あ</span>`);
  await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready);
  NB = await p.evaluate((sv) => { const d = document.createElement('div'); d.innerHTML = sv; document.body.appendChild(d); const e = d.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const r = e.getBBox(); d.remove(); return [r.x, r.y, r.width, r.height]; }, PA.dog('dachs', { pose: 'happy', facing: 'right', anim: false }));
  const shot = async (svg, file, type = 'png') => { await p.evaluate((sv) => { document.getElementById('s').innerHTML = sv; }, svg); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(60);
    await p.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 90 } : {}), clip: { x: 0, y: 0, width: W, height: H } }); };
  // stills: the hook, one per look, the end card
  await shot(page(hookHead() + noodle({}) + label('ready? 3, 2, 1...')), path.join(WORK, 'f', 'hook.png'));
  for (let i = 0; i < LOOKS.length; i++) await shot(page(cycleHead() + noodle(LOOKS[i][1]) + label(LOOKS[i][0]) + comment), path.join(WORK, 'f', `look${i}.png`));
  await shot(page(endHead() + noodle({ head: 'Witch Hat', neck: 'Candy Corn Bandana' }) + label('which one did you get?') + pill('costumes: Pumpkin Patch Pop-up, until 2 Nov', 42, 860)), path.join(WORK, 'f', 'end.png'));

  // the cover (the profile grid shows the middle 1080 x 1440, y 240..1680): six costumes around the title
  {
    const pick = [4, 6, 5, 16, 1, 7], cells = pick.map((li, j) => { const cx = 200 + (j % 3) * 340, cy = 860 + Math.floor(j / 3) * 420, sv = PA.dog('dachs', { pose: 'happy', facing: 'right', anim: false, outfit: LOOKS[li][1] }), [bx, by, bw, bh] = NB, k = 300 / bw;
      return card(cx - 160, cy - 190, 320, 380, j % 2 ? 2 : -2) + `<svg x="${f1(cx - bw * k / 2)}" y="${f1(cy + 90 - bh * k)}" width="${f1(bw * k)}" height="${f1(bh * k)}" viewBox="${[bx, by, bw, bh].map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>` + txt('?', cx + 120, cy - 120, 64, { fill: ORANGE, rot: 12 }); }).join('');
    const cov = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${paperTop}<rect y="440" width="${W}" height="${H - 440}" fill="url(#dots)"/>`
      + txt('Pick Noodle’s', W / 2, 420, 120, { rot: -2 }) + txt('Halloween costume', W / 2, 545, 110, { rot: -2, fill: ORANGE }) + txt('stop the video to choose 🎃', W / 2, 630, 58, { fill: MUTED, rot: -1 })
      + cells + txt('ヌードルの仮装、どれにする？', W / 2, 1640, 44, { jp: true, fill: MUTED }) + `</svg>`;
    await shot(cov, path.join(OUT, 'costume-reel-cover.jpg'), 'jpeg');
  }
  console.log('stills done:', LOOKS.length, 'looks');
  if (process.env.ONLY === 'frames') { await b.close(); return; }

  // the timeline: hook 1.6 s, then a look every 0.2 s (shuffled each round, never the same twice in a row), then the end card 2.0 s
  let seed = 7; const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const HOOK = 1.6, STEP = 0.2, END = 2.0, CYCLE = 14.4, seq = [];
  while (seq.length < CYCLE / STEP) { const r = LOOKS.map((_, i) => i).sort(() => rnd() - 0.5); if (seq.length && r[0] === seq[seq.length - 1]) r.push(r.shift()); seq.push(...r); }
  seq.length = Math.round(CYCLE / STEP);
  const list = [`file '${path.join(WORK, 'f', 'hook.png')}'`, `duration ${HOOK}`];
  for (const i of seq) list.push(`file '${path.join(WORK, 'f', `look${i}.png`)}'`, `duration ${STEP}`);
  list.push(`file '${path.join(WORK, 'f', 'end.png')}'`, `duration ${END}`, `file '${path.join(WORK, 'f', 'end.png')}'`);
  fs.writeFileSync(path.join(WORK, 'list.txt'), list.join('\n'));
  const TOTAL = HOOK + CYCLE + END;

  // music: the game's own engine, the Town Square at dusk, a sparkle when the costumes start and a "discover" on the end card
  await p.goto('about:blank'); await p.addScriptTag({ path: path.join(root, 'mods', 'pawaudio.js') });
  const r = await p.evaluate(async (T) => { const res = await window.PawAudio._render({ seconds: T + 0.3, wav: true, vols: { master: 0.85, music: 0.66, ambience: 0.08 },
    segments: [{ at: 0, ctx: { place: 'square', time: 'dusk', weather: 'sunny' } }], stingers: [{ at: 1.55, name: 'sparkle' }, { at: 15.95, name: 'discover' }] }); return { wav: res.wav, peakDb: res.peakDb }; }, TOTAL);
  fs.writeFileSync(path.join(WORK, 'music.wav'), Buffer.from(r.wav, 'base64'));
  await b.close();
  const mp4 = path.join(OUT, 'doodle-doggo-costume-reel.mp4');
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(WORK, 'list.txt'), '-i', path.join(WORK, 'music.wav'),
    '-vf', `fps=${FPS},format=yuv420p`, '-af', `afade=t=in:d=0.08,afade=t=out:st=${TOTAL - 0.25}:d=0.25`, '-t', String(TOTAL),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
  console.log('wrote', mp4, Math.round(fs.statSync(mp4).size / 1024) + ' KB', TOTAL + ' s', 'peak', r.peakDb);
})().catch((e) => { console.error(e); process.exit(1); });
