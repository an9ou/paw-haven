// Builds the ~90 s overview trailer in two shapes: 9:16 (1080 x 1920) and 16:9 (1920 x 1080), each with a "soon" and a "play" ending.
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/trailer90/build90.js <footage45Dir> <footage90Dir> <voDir> <workDir> [P|L|both] [soon|play|both]
// footage45Dir: clips from video45/footage45.js; footage90Dir: clips from trailer90/footage90.js; voDir: vo90.py output (vo.json + wavs).
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const [F45, F90, VOD, WORK, shapes = 'both', endings = 'both'] = process.argv.slice(2);
const FPS = 30, OUT = __dirname, LEAD = 0.12;
const vo = JSON.parse(fs.readFileSync(path.join(VOD, 'vo.json')));
// ---- the voice-over timeline ----
const ORDER = ['w1', 'w2', 'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8', 'c9', 'c10', 'h1', 'h2', 'h3', 'h4', 'h5', 'e1', 'e2'];
const GAP = { w2: 0.5, d6: 0.6, c10: 0.6, h5: 1.4 }; // extra pause after these lines
const ST = {}; let t = 0.5;
for (const k of ORDER) { ST[k] = +t.toFixed(3); const d = vo.dur[k === 'e2' ? 'e2soon' : k]; t += d + 0.4 + (GAP[k] || 0); }
const DUR = Math.ceil((ST.e2 + Math.max(vo.dur.e2soon, vo.dur.e2play) + 1.6) * 10) / 10, NF = Math.round(DUR * FPS);
const span = (k) => { const i = ORDER.indexOf(k); return [Math.max(0, ST[k] - LEAD), i + 1 < ORDER.length ? ST[ORDER[i + 1]] - LEAD : DUR]; };
// ---- clips ----
const dirOf = (c) => fs.existsSync(path.join(F90, c, 'info.json')) ? path.join(F90, c) : path.join(F45, c);
const info = (c) => JSON.parse(fs.readFileSync(path.join(dirOf(c), 'info.json')));
const mark = (dog) => info('meet').marks.find((m) => m[0] === dog)[1] / FPS;
const fujiOff = info('fuji').event / FPS - 0.3, bonk = info('bonk');
// what plays under each line: [clip, clip start (s), zoom?] (several = equal parts), and the chip / name card
const Z_WALK = [1.55, '30% 46%'], Z_FETCH = [1.45, '92% 30%'];
const PLAN = {
  d1: { segs: [['meet', mark('Dachshund') + 0.15]], name: ['Noodle', 'the dachshund · curious digger'] },
  d2: { segs: [['meet', mark('Corgi') + 0.15]], name: ['Biscuit', 'the corgi · snack inspector'] },
  d3: { segs: [['meet', mark('Shiba Inu') + 0.15]], name: ['Mochi', 'the shiba · proud and dramatic'] },
  d4: { segs: [['meet', mark('Husky') + 0.15]], name: ['Frost', 'the husky · very chatty'] },
  d5: { segs: [['meet', mark('Golden Retriever')]], chip: '14 dogs to meet' },
  d6: { segs: [['meet', mark('Shelter Mutt') + 0.15]], chip: 'Adopt for free' },
  c1: { segs: [['feed', 0.5], ['pet', 0.5], ['bath', 0.5], ['nap', 0.9]], chip: 'Care for your pup' },
  c2: { segs: [['halloween', 0.3], ['snow', 0.3]], chip: 'Dress up' },
  c3: { segs: [['fetch', 0.2, Z_FETCH]], chip: 'Play together' },
  c4: { segs: [['walk', 1.0, Z_WALK]], chip: 'Walks around town' },
  c5: { segs: [['fuji', fujiOff]], chip: 'Explore the town' },
  c6: { segs: [['garden', 0.3], ['kitchen', 0.3]], chip: 'Garden & kitchen' },
  c7: { segs: [['home', 0.2]], chip: 'Home & pack' },
  c8: { segs: [['puppies', 0.1]], chip: 'Puppy playdates' },
  c9: { segs: [['sweater', 0.1], ['snow', 1.0], ['newyear', 0.3]], chip: 'Seasons & festivals' },
  c10: { segs: [['photo', 0.3]], chip: 'Photo mode' },
  h1: { segs: [['start', 0.5]], chips: [[0, '1', 'Tap New game'], [0.42, '2', 'Pick a pup']] },
  h2: { segs: [['pet', 0.2]], chip: ['3', 'Feed · Play · Care · Walk'], barHi: true },
  h3: { segs: [['pet', 0.3]], chip: 'Rub to pet' },
  h4: { segs: [['walk', 0.6, Z_WALK]], chip: 'Tap · hold · swipe' },
  h5: { segs: [['bonk', null, Z_WALK]], chip: 'Nothing bad ever happens' },
  e1: { segs: [['packdusk', 0.3]], chip: 'Free · phone or computer' },
};
// the bump line ("I meant to do that.") pops up right after h5 is spoken
{ const [a, b] = span('h5'); PLAN.h5.segs[0][1] = Math.max(0, bonk.event / FPS - (ST.h5 + vo.dur.h5 + 0.25 - a)); }
// ---- subtitles: long lines split at the comma nearest the middle ----
const subs = [];
for (const k of ORDER) {
  const key = k === 'e2' ? null : k; if (!key) continue; const text = vo.text[key], d = vo.dur[key], st = ST[key], end = span(key)[1];
  let parts = [text];
  if (text.length > 46) { const mid = text.length / 2; let best = -1; for (let i = 0; i < text.length; i++) if (/[,.!?]/.test(text[i]) && i < text.length - 2 && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i; if (best > 0) parts = [text.slice(0, best + 1).trim(), text.slice(best + 1).trim()]; }
  const tot = parts.reduce((s, p) => s + p.length, 0); let tt = st;
  parts.forEach((p, j) => { const len = d * p.length / tot; subs.push([tt - 0.08, j === parts.length - 1 ? Math.min(end, st + d + 0.35) : tt + len, p]); tt += len; });
}
// ---- one frame's description ----
const playAt = span('d1')[0], endAt = span('e2')[0];
const cuts = []; for (const k of Object.keys(PLAN)) { const [a, b] = span(k), n = PLAN[k].segs.length; for (let i = 0; i < n; i++) cuts.push(a + (b - a) * i / n); } cuts.sort((x, y) => x - y);
function frameAt(t, soon) {
  const f = { t, section: t < playAt ? 'hook' : t < endAt ? 'play' : 'end', hook: { w1: [ST.w1, ST.w1 + vo.dur.w1], w2: [ST.w2, ST.w2 + vo.dur.w2] }, playAt, end: { at: endAt, soon } };
  const sb = subs.find((q) => t >= q[0] && t < q[1]); if (sb && f.section !== 'end') { f.sub = sb[2]; f.subAt = sb[0]; }
  if (f.section !== 'play') return f;
  const k = Object.keys(PLAN).find((key) => { const [a, b] = span(key); return t >= a && t < b; }); if (!k) return f;
  const P = PLAN[k], [a, b] = span(k), n = P.segs.length, i = Math.min(n - 1, Math.floor((t - a) / ((b - a) / n))), sa = a + (b - a) * i / n, sg = P.segs[i];
  const ci = info(sg[0]).frames, fi = Math.max(0, Math.min(ci - 1, Math.round((t - sa + sg[1]) * FPS)));
  f.src = 'file://' + path.join(dirOf(sg[0]), String(fi).padStart(5, '0') + '.jpg'); f.zoom = sg[2] || null;
  let cutIdx = 0; cuts.forEach((c, j) => { if (c <= t) cutIdx = j; }); f.cutAt = cuts[cutIdx]; f.cutIdx = cutIdx;
  if (P.name) f.name = { n: P.name[0], k: P.name[1], at: a };
  if (P.chip) f.chip = Array.isArray(P.chip) ? { n: P.chip[0], t: P.chip[1], at: a } : { t: P.chip, at: a };
  if (P.chips) { let c = P.chips[0]; for (const q of P.chips) if (t >= a + (b - a) * q[0]) c = q; f.chip = { n: c[1], t: c[2], at: a + (b - a) * c[0] }; }
  if (P.barHi) f.barHi = true;
  return f;
}
async function frames(shape, soon, from, to, dir) {
  const b = await chromium.launch({ executablePath: ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f)), args: ['--allow-file-access-from-files'] });
  const L = shape === 'L', p = await b.newPage({ viewport: { width: L ? 1920 : 1080, height: L ? 1080 : 1920 } });
  await p.goto('file://' + path.join(__dirname, 'trailer90.html') + (L ? '#L' : '#P')); await p.waitForFunction(() => window.READY === true);
  for (let i = from; i < to; i++) { await p.evaluate((f) => window.draw(f), frameAt(i / FPS, soon)); await p.screenshot({ path: path.join(dir, 'f_' + String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 }); }
  await b.close();
}
const sh = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
(async () => {
  fs.mkdirSync(WORK, { recursive: true });
  fs.writeFileSync(path.join(WORK, 'timeline.json'), JSON.stringify({ DUR, ST, subs, cuts }, null, 1));
  console.log('duration', DUR, 's; hook', playAt.toFixed(2), 'end card', endAt.toFixed(2));
  // music: the game's own, following the sections
  const music = path.join(WORK, 'music90.wav');
  if (!fs.existsSync(music)) {
    const c = (place, time) => ({ place, time: time || 'day', weather: 'sunny' });
    const plan = { seconds: DUR + 0.5, wav: true, vols: { master: 0.85, music: 0.62, ambience: 0.1 },
      segments: [{ at: 0, ctx: c('title') }, { at: span('d1')[0], ctx: c('shelter') }, { at: span('c1')[0], ctx: c('yard') }, { at: span('c3')[0], ctx: c('walk') }, { at: span('c5')[0], ctx: c('hilltop', 'dusk') }, { at: span('c6')[0], ctx: c('garden') }, { at: span('c7')[0], ctx: c('house') }, { at: span('c9')[0], ctx: c('square', 'dusk') }, { at: span('h1')[0], ctx: c('title') }, { at: span('e1')[0], ctx: c('yard', 'dusk') }],
      stingers: [{ at: ST.w2 + vo.dur.w2, name: 'sparkle' }, { at: span('d6')[0] + 0.3, name: 'adopt' }, { at: span('c5')[0], name: 'discover' }, { at: endAt, name: 'levelup' }] };
    fs.writeFileSync(path.join(WORK, 'music90.json'), JSON.stringify(plan));
    execFileSync('node', [path.join(__dirname, '..', 'reel_audio.js'), music, path.join(WORK, 'music90.json')], { stdio: 'inherit' });
  }
  const cutF = Math.round(endAt * FPS);
  for (const shape of shapes === 'both' ? ['P', 'L'] : [shapes]) {
    const ends = endings === 'both' ? ['soon', 'play'] : [endings];
    const shared = path.join(WORK, 'frames_' + shape), redraw = !process.env.SOUND_ONLY; // SOUND_ONLY=1: keep the drawn frames, redo only the sound
    if (redraw) fs.rmSync(shared, { recursive: true, force: true }); fs.mkdirSync(shared, { recursive: true });
    const parts = 4, step = Math.ceil(cutF / parts);
    if (redraw) await Promise.all(Array.from({ length: parts }, (_, k) => frames(shape, true, k * step, Math.min(cutF, (k + 1) * step), shared)));
    for (const m of ends) {
      const dir = path.join(WORK, `frames_${shape}_${m}`);
      if (redraw) {
        fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
        for (let i = 0; i < cutF; i++) { const n = 'f_' + String(i).padStart(5, '0') + '.jpg'; fs.symlinkSync(path.join(shared, n), path.join(dir, n)); }
        await frames(shape, m === 'soon', cutF, NF, dir);
      }
      const lines = ORDER.map((k) => [k === 'e2' ? 'e2' + m : k, ST[k]]), inputs = [], filt = [];
      lines.forEach(([k, st], i) => { inputs.push('-i', path.join(VOD, k + '.wav')); filt.push(`[${i + 1}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${Math.round(st * 1000)}|${Math.round(st * 1000)}[v${i}]`); });
      inputs.push('-i', music); const mi = lines.length + 1;
      filt.push(`${lines.map((_, i) => `[v${i}]`).join('')}amix=inputs=${lines.length}:normalize=0,apad=whole_dur=${DUR},atrim=0:${DUR}[vo]`, `[vo]asplit=2[vo1][vo2]`,
        `[${mi}:a]aresample=44100,atrim=0:${DUR},volume=0.55,afade=t=in:d=0.5,afade=t=out:st=${(DUR - 1.8).toFixed(2)}:d=1.8[mu]`, `[mu][vo1]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=350[duck]`,
        `[duck][vo2]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=9[a]`);
      const out = path.join(OUT, `doodle-doggo-trailer-${shape === 'L' ? '16x9' : '9x16'}-${m}.mp4`);
      sh(['-framerate', String(FPS), '-i', path.join(dir, 'f_%05d.jpg'), ...inputs, '-filter_complex', filt.join(';'), '-map', '0:v', '-map', '[a]',
        '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-movflags', '+faststart', '-t', String(DUR), out]);
      console.log('wrote', out);
    }
  }
})();
