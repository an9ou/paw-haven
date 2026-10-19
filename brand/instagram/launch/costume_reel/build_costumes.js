// "Stop the video to dress Noodle" Halloween Reels (1080 x 1920, about 36 s, seamless loops, no end card): two styles for an A/B test.
//   A "flash": Noodle stands in the game's Halloween yard and his costume changes every 0.5 s.
//   B "fall-through": each costume falls straight down, fast, right through Noodle and fits him for one frame only (pause on it,
//              or miss). One costume every 0.9 s. Like the owner's reference Reel (19 Oct 2026).
// Same background, header, labels and music for both, so the test compares only the motion. Real art only, no game UI.
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/costume_reel/build_costumes.js <workdir> [a|b|both]
//   (ONLY=frames renders the A stills and the cover without the videos)
// Output next to this file: doodle-doggo-costume-reel-a.mp4, doodle-doggo-costume-reel-b.mp4, costume-reel-cover.jpg.
const fs = require('fs'), path = require('path'), vm = require('vm'), cp = require('child_process');
const { chromium } = require('playwright');
const root = path.join(__dirname, '..', '..', '..', '..'), OUT = __dirname, WORK = path.resolve(process.argv[2] || '/tmp/costume_reel'), WHICH = process.argv[3] || 'b'; // owner, 19 Oct 2026: only style B is made (a and both still work)
fs.mkdirSync(path.join(WORK, 'a'), { recursive: true }); fs.mkdirSync(path.join(WORK, 'b'), { recursive: true });
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

// ---- the stage: the game's yard at dusk, Halloween on, Japan scenery on; a small header that stays the whole time ----
const env = { time: 'dusk', weather: 'sunny', season: 'autumn', halloween: true, jp: true };
const scene = `<svg x="0" y="380" width="${W}" height="${H - 380}" viewBox="262 30 430 560" preserveAspectRatio="xMidYMid slice">${inner(PA.scene('yard', env))}</svg>`;
const paperTop = `<rect width="${W}" height="${H}" fill="#FFF8EC"/><defs><pattern id="dots" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="2" fill="#E3D2BA"/></pattern></defs><rect width="${W}" height="440" fill="url(#dots)"/>`;
const header = card(90, 200, 900, 220, -1) + tape(470, 182, 140, 2)
  + txt('Stop the video to dress Noodle 🎃', W / 2, 310, 76, { rot: -1 }) + txt('止めてヌードルに仮装させよう！', W / 2, 382, 40, { jp: true, rot: -1, fill: MUTED });
const stage = `${paperTop}${scene}<rect x="0" y="1340" width="${W}" height="${H - 1340}" fill="#2E2235" opacity=".18"/>${header}`;
const pill = (s2, size = 50, w = 640) => `<g transform="rotate(-1 ${W / 2} 1585)"><rect x="${W / 2 - w / 2}" y="1546" width="${w}" height="80" rx="40" fill="${PLUM}" stroke="${INK}" stroke-width="4"/>${txt(s2, W / 2, 1600, size, { fill: '#FFF8EC' })}</g>`;
const label = (s) => card(110, 1390, 860, 120, -1.2) + tape(470, 1370, 140, 3) + txt(s, W / 2, 1472, s.length > 24 ? 54 : 66, { rot: -1.2 }) + pill('comment what Noodle got 👇');
let NB = null; // Noodle's drawn outline in his 240 x 200 canvas, measured once (plain), so every costume keeps the same size and place
const FEET = 1330, NW = 860;
const noodle = (outfit, sx = 1, sy = 1) => { const sv = PA.dog('dachs', { pose: 'happy', facing: 'right', anim: false, outfit }); const [bx, by, bw, bh] = NB, k = NW / bw, w = bw * k, h = bh * k, x = W / 2 - w / 2 - 10, y = FEET - h;
  return `<ellipse cx="${W / 2}" cy="${FEET - 4}" rx="${f1(380 * sx)}" ry="26" fill="${INK}" opacity=".22"/><g transform="translate(${W / 2} ${FEET}) scale(${f1(sx * 1000) / 1000} ${f1(sy * 1000) / 1000}) translate(${-W / 2} ${-FEET})"><svg x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" viewBox="${[bx, by, bw, bh].map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg></g>`; };
const page = (body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${stage}${body}</svg>`;

// a shuffled order of n steps from the given looks: every look once per round, never the same look twice in a row (also across the loop point)
const order = (looks, n, seed) => { const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }, seq = [];
  while (seq.length < n) { const r = looks.slice().sort(() => rnd() - 0.5); if (seq.length && r[0] === seq[seq.length - 1]) r.push(r.shift()); seq.push(...r); }
  seq.length = n; if (seq[n - 1] === seq[0]) [seq[n - 1], seq[n - 2]] = [seq[n - 2], seq[n - 1]]; return seq; };

// music: the game's own engine, the Town Square at dusk; rendered 2 s long and crossfaded end-into-start so the loop has no seam
async function music(p, T, file) {
  await p.goto('about:blank'); await p.addScriptTag({ path: path.join(root, 'mods', 'pawaudio.js') });
  const r = await p.evaluate(async (S) => { const res = await window.PawAudio._render({ seconds: S, wav: true, vols: { master: 0.85, music: 0.66, ambience: 0.08 },
    segments: [{ at: 0, ctx: { place: 'square', time: 'dusk', weather: 'sunny' } }] }); return { wav: res.wav, peakDb: res.peakDb }; }, T + 2.2);
  const raw = path.join(WORK, 'music-raw.wav'); fs.writeFileSync(raw, Buffer.from(r.wav, 'base64'));
  // (two inputs, not asplit: with asplit + amix, ffmpeg 6.1 ended the mix after 0.02 s, and the first A/B renders went out silent)
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', raw, '-i', raw, '-filter_complex',
    `[0]atrim=1:${1 + T},asetpts=PTS-STARTPTS,afade=t=in:d=1:curve=qsin[a];[1]atrim=${1 + T}:${2 + T},asetpts=PTS-STARTPTS,afade=t=out:d=1:curve=qsin,apad=whole_dur=${T}[b];[a][b]amix=inputs=2:duration=first:normalize=0[o]`,
    '-map', '[o]', file]);
  const d = +cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString(); if (Math.abs(d - T) > 0.1) throw new Error(`music is ${d} s, expected ${T} s`);
}
// B's sounds: a quick crayon whoosh as each costume passes Noodle, made here (no samples), quiet under the music
function sfx(T, lands, file) {
  const SR = 44100, n = Math.ceil(T * SR), buf = new Float32Array(n); let seed = 3; const noise = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x3fffffff - 1; };
  for (const t0 of lands) {
    let lp = 0; for (let i = 0; i < 0.3 * SR; i++) { const t = i / SR, env2 = Math.sin(Math.PI * t / 0.3) ** 3; lp += 0.12 * (noise() - lp); const j = Math.floor((t0 - 0.15) * SR) + i; buf[((j % n) + n) % n] += 0.7 * env2 * lp; }
  }
  const pcm = Buffer.alloc(44 + n * 4); pcm.write('RIFF', 0); pcm.writeUInt32LE(36 + n * 4, 4); pcm.write('WAVEfmt ', 8); pcm.writeUInt32LE(16, 16); pcm.writeUInt16LE(1, 20); pcm.writeUInt16LE(2, 22);
  pcm.writeUInt32LE(SR, 24); pcm.writeUInt32LE(SR * 4, 28); pcm.writeUInt16LE(4, 32); pcm.writeUInt16LE(16, 34); pcm.write('data', 36); pcm.writeUInt32LE(n * 4, 40);
  for (let i = 0; i < n; i++) { const v = Math.max(-1, Math.min(1, buf[i])) * 32767; pcm.writeInt16LE(v | 0, 44 + i * 4); pcm.writeInt16LE(v | 0, 46 + i * 4); }
  fs.writeFileSync(file, pcm);
}
const mux = (video, audio, T, mp4, extra = []) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...video, '-i', audio, ...extra, '-t', String(T),
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', mp4], { stdio: 'inherit' });

(async () => {
  const exe = ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const b = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  const FONTS = `<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Zen+Maru+Gothic:wght@700&display=swap" rel="stylesheet"><style>html,body{margin:0;background:#fff}svg{display:block}</style>`;
  const ready = async () => { await p.setContent(`<!doctype html><meta charset="utf-8">${FONTS}<div id="s"></div><span style="font-family:Caveat">a</span><span style="font-family:'Zen Maru Gothic'">あ</span>`); await p.waitForLoadState('networkidle'); await p.evaluate(() => document.fonts.ready); };
  await ready();
  NB = await p.evaluate((sv) => { const d = document.createElement('div'); d.innerHTML = sv; document.body.appendChild(d); const e = d.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const r = e.getBBox(); d.remove(); return [r.x, r.y, r.width, r.height]; }, PA.dog('dachs', { pose: 'happy', facing: 'right', anim: false }));
  const shot = async (svg, file, type = 'png') => { await p.evaluate((sv) => { document.getElementById('s').innerHTML = sv; }, svg); await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 90 } : {}), clip: { x: 0, y: 0, width: W, height: H } }); };

  // ---- the cover (shared by A and B so the test compares the motion only; the grid shows the middle 1080 x 1440, y 240..1680) ----
  {
    const pick = [4, 6, 5, 16, 1, 7], cells = pick.map((li, j) => { const cx = 200 + (j % 3) * 340, cy = 860 + Math.floor(j / 3) * 420, sv = PA.dog('dachs', { pose: 'happy', facing: 'right', anim: false, outfit: LOOKS[li][1] }), [bx, by, bw, bh] = NB, k = 300 / bw;
      return card(cx - 160, cy - 190, 320, 380, j % 2 ? 2 : -2) + `<svg x="${f1(cx - bw * k / 2)}" y="${f1(cy + 90 - bh * k)}" width="${f1(bw * k)}" height="${f1(bh * k)}" viewBox="${[bx, by, bw, bh].map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>` + txt('?', cx + 120, cy - 120, 64, { fill: ORANGE, rot: 12 }); }).join('');
    await shot(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${paperTop}<rect y="440" width="${W}" height="${H - 440}" fill="url(#dots)"/>`
      + txt('Pick Noodle’s', W / 2, 420, 120, { rot: -2 }) + txt('Halloween costume', W / 2, 545, 110, { rot: -2, fill: ORANGE }) + txt('stop the video to choose 🎃', W / 2, 630, 58, { fill: MUTED, rot: -1 })
      + cells + txt('ヌードルの仮装、どれにする？', W / 2, 1640, 44, { jp: true, fill: MUTED }) + `</svg>`, path.join(OUT, 'costume-reel-cover.jpg'), 'jpeg');
  }

  // ---- A: a still per look, then the order at 0.5 s each (72 steps = 36 s) ----
  const A_STEP = 0.5, A_N = 72, A_T = A_STEP * A_N;
  if (WHICH !== 'b') {
    for (let i = 0; i < LOOKS.length; i++) await shot(page(noodle(LOOKS[i][1]) + label(LOOKS[i][0])), path.join(WORK, 'a', `look${i}.png`));
    console.log('A stills done:', LOOKS.length);
  }
  if (process.env.ONLY === 'frames') { await b.close(); return; }
  if (process.env.BFRAMES && WHICH === 'b') { /* preview: frames only */ }

  // ---- B "fall-through" (like the owner's reference): Noodle stands still; each costume falls straight down, fast, right through him,
  //      and lines up on him for one frame only. Pause on that frame and he wears it; a frame early or late and it misses. ----
  // The falling costume is cut out of the game's own drawing (Noodle wearing it minus plain Noodle, pixel by pixel), so it fits exactly.
  const B_STEP = 0.9, B_N = 40, B_T = +(B_STEP * B_N).toFixed(2), CROSS = 0.8; // one costume every 0.9 s, 0.8 s from the top edge to the bottom edge
  const B_LOOKS = LOOKS.map((_, i) => i).filter((i) => Object.keys(LOOKS[i][1]).length), bseq = order(B_LOOKS, B_N, 11);
  const align = bseq.map((_, k) => Math.round((k * B_STEP + B_STEP / 2) * FPS) / FPS); // the exact frame each costume fits
  const lands = align;
  if (WHICH !== 'a') {
    // the background with plain Noodle baked in, once
    await shot(page(noodle({})), path.join(WORK, 'b', 'bg.png'));
    const bg = 'data:image/png;base64,' + fs.readFileSync(path.join(WORK, 'b', 'bg.png')).toString('base64');
    // costume sprites: render Noodle with and without the costume on a transparent canvas, keep the pixels that differ
    const solo = (outfit) => `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${noodle(outfit)}</svg>`;
    const sprite = {};
    for (const li of B_LOOKS) sprite[li] = await p.evaluate(async ([s1, s0, W, H]) => {
      const load = (s) => new Promise((ok) => { const im = new Image(); im.onload = () => ok(im); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s); });
      const [a, b] = await Promise.all([load(s1), load(s0)]), c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
      x.drawImage(b, 0, 0); const d0 = x.getImageData(0, 0, W, H); x.clearRect(0, 0, W, H); x.drawImage(a, 0, 0); const d1 = x.getImageData(0, 0, W, H), o = d1.data, z = d0.data;
      // the crayon lines wobble a little differently when he wears something, so a plain difference also catches thin copies of his outline:
      // keep only the differing pixels near a solid differing area (an opening: erode by 8, grow by 14)
      const m = new Uint8Array(W * H);
      for (let i = 0, q = 0; i < o.length; i += 4, q++) m[q] = (Math.abs(o[i] - z[i]) + Math.abs(o[i + 1] - z[i + 1]) + Math.abs(o[i + 2] - z[i + 2]) + Math.abs(o[i + 3] - z[i + 3])) >= 40 ? 1 : 0;
      const pass = (src, r, minMode) => { const t = new Uint8Array(W * H), u = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) { let run = 0; const row = y * W; // horizontal
          for (let x = 0; x < W; x++) { let v = minMode ? 1 : 0; for (let k = -r; k <= r; k++) { const xx = x + k; const sv = xx < 0 || xx >= W ? 0 : src[row + xx]; if (minMode ? !sv : sv) { v = minMode ? 0 : 1; break; } } t[row + x] = v; } }
        for (let x = 0; x < W; x++) for (let y = 0; y < H; y++) { let v = minMode ? 1 : 0; for (let k = -r; k <= r; k++) { const yy = y + k; const sv = yy < 0 || yy >= H ? 0 : t[yy * W + x]; if (minMode ? !sv : sv) { v = minMode ? 0 : 1; break; } } u[y * W + x] = v; }
        return u; };
      const keep = pass(pass(m, 8, true), 14, false);
      let top = H, bot = 0;
      for (let i = 0, q = 0; i < o.length; i += 4, q++) { if (!(m[q] && keep[q])) o[i + 3] = 0; else { const y = (q / W) | 0; if (y < top) top = y; if (y > bot) bot = y; } }
      x.putImageData(d1, 0, 0); return { url: c.toDataURL('image/png'), top, bot };
    }, [solo(LOOKS[li][1]), solo({}), W, H]);
    if (process.env.SPRITES) { for (const li of B_LOOKS) { const sp = sprite[li]; await shot(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><image href="${bg}" width="${W}" height="${H}"/><image href="${sp.url}" width="${W}" height="${H}"/>${txt(LOOKS[li][0], W / 2, 1480, 60)}</svg>`, path.join(WORK, 'b', `sprite${li}.png`)); } await b.close(); return; }
    const sparkle = `<g transform="translate(830 840) rotate(-8)"><rect x="-150" y="-44" width="300" height="88" rx="44" fill="#FFD66B" stroke="${INK}" stroke-width="5"/>${txt('perfect fit!', 0, 18, 58)}</g>`;
    const NF = process.env.BFRAMES ? +process.env.BFRAMES : Math.round(B_T * FPS);
    for (let fi = 0; fi < NF; fi++) {
      const t = fi / FPS; let g = `<image href="${bg}" x="0" y="0" width="${W}" height="${H}"/>`, nowLook = null, perfect = false;
      for (let k = 0; k < B_N; k++) for (const wrap of [-B_T, 0, B_T]) {
        const li = bseq[k], sp = sprite[li], dt = t - (align[k] + wrap), v = (H + (sp.bot - sp.top)) / CROSS, dy = v * dt; // speed: from just above the top edge to just below the bottom edge in CROSS seconds
        if (nowLook === null || Math.abs(dt) < nowLook[1]) nowLook = [li, Math.abs(dt)]; // the label names the nearest costume, on screen or not
        if (sp.bot + dy < 0 || sp.top + dy > H) continue;
        g += `<image href="${sp.url}" x="0" y="${f1(dy)}" width="${W}" height="${H}"/>`;
        if (Math.abs(dt) < 1e-6) perfect = true;
      }
      g += header + label(LOOKS[nowLook[0]][0]) + (perfect ? sparkle : '');
      await shot(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${g}</svg>`, path.join(WORK, 'b', `f${String(fi).padStart(5, '0')}.png`));
      if (fi % 150 === 0) console.log('B frame', fi, '/', NF);
    }
  }

  // ---- music and the videos ----
  if (WHICH !== 'b') {
    await music(p, A_T, path.join(WORK, 'a', 'music.wav'));
    const seq = order(LOOKS.map((_, i) => i), A_N, 7), list = [];
    for (const i of seq) list.push(`file '${path.join(WORK, 'a', `look${i}.png`)}'`, `duration ${A_STEP}`);
    list.push(`file '${path.join(WORK, 'a', `look${seq[seq.length - 1]}.png`)}'`); fs.writeFileSync(path.join(WORK, 'a', 'list.txt'), list.join('\n'));
    const mp4 = path.join(OUT, 'doodle-doggo-costume-reel-a.mp4');
    mux(['-f', 'concat', '-safe', '0', '-i', path.join(WORK, 'a', 'list.txt')], path.join(WORK, 'a', 'music.wav'), A_T, mp4, ['-vf', `fps=${FPS}`]);
    console.log('wrote', mp4, A_T + ' s');
  }
  if (WHICH !== 'a') {
    await music(p, B_T, path.join(WORK, 'b', 'music.wav')); sfx(B_T, lands, path.join(WORK, 'b', 'sfx.wav'));
    cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', path.join(WORK, 'b', 'music.wav'), '-i', path.join(WORK, 'b', 'sfx.wav'), '-filter_complex', '[1]volume=0.7[s];[0][s]amix=inputs=2:duration=first:normalize=0', path.join(WORK, 'b', 'mix.wav')]);
    const mp4 = path.join(OUT, 'doodle-doggo-costume-reel-b.mp4');
    mux(['-framerate', String(FPS), '-i', path.join(WORK, 'b', 'f%05d.png')], path.join(WORK, 'b', 'mix.wav'), B_T, mp4);
    console.log('wrote', mp4, B_T + ' s');
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
