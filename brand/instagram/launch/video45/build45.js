// Builds the 45 s promo video (1080 x 1920, 30 fps) from real gameplay, the game's art and music, and an English voice-over.
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/video45/build45.js <footageDir> <voDir> <music.wav> <workDir> [soon|play|both]
// <voDir> holds the voice lines as l1a.wav ... l9soon.wav / l9play.wav and dur.json (see vo45.py). Output: brand/instagram/launch/video45/*.mp4
const path = require('path'), fs = require('fs'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const [footage, voDir, music, work, which = 'both'] = process.argv.slice(2);
const FPS = 30, DUR = 45, NF = DUR * FPS, OUT = __dirname;
const dur = JSON.parse(fs.readFileSync(path.join(voDir, 'dur.json')));

// ---- the voice-over: when each line starts (seconds) ----
const VO = [['l1a', 0.25], ['l1b', 3.25], ['l2', 5.3], ['l3', 8.35], ['l4', 13.5], ['l5a', 16.25], ['l5b', 19.85], ['l6', 23.75], ['l7', 29.5], ['l8a', 34.5], ['l8b', 38.85], ['l9', 40.6]];
// ---- subtitles: each line split into chunks, timed by length ----
const CHUNKS = { // must match the punctuation in vo45.py
  l1a: ['Everything in this town was drawn very carefully.'], l1b: ['Except me! I drew myself!'],
  l2: ["Hi, I'm Noodle! Welcome to Doodle Doggo!"],
  l3: ['Adopt a wobbly crayon pup!', 'There are fourteen of us.', 'We are all very proud!'],
  l4: ['Feed us! Pet us!', 'Bathe us, if you must.'],
  l5a: ['Take us on walks! Dig up treasure!', 'Visit Mount Fuji!'],
  l5b: ['Somebody should dig a tunnel through that mountain.', 'I volunteer!'],
  l6: ['Grow a garden! Cook dog-safe treats!', 'Have puppy playdates, with real coat genetics!'],
  l7: ['Dress up for every season!', 'The ugly sweater contest is judged by a duck!'],
  l8a: ['And nothing bad ever happens here.', 'Worst case? You walk into a log.'], l8b: ['I meant to do that!'],
};
const subs = [];
VO.forEach(([k, st], i) => {
  if (!CHUNKS[k]) return; const d = dur[k], parts = CHUNKS[k], tot = parts.reduce((a, s) => a + s.length, 0);
  const next = i + 1 < VO.length ? VO[i + 1][1] : st + d + 0.4; let t = st;
  parts.forEach((s, j) => { const len = d * s.length / tot, end = j === parts.length - 1 ? Math.min(next - 0.05, st + d + 0.35) : t + len; subs.push([+(t - 0.08).toFixed(3), +end.toFixed(3), s]); t += len; });
});
// ---- the picture: scenes, and which gameplay clip (and from which second of it) plays when ----
const info = (n) => JSON.parse(fs.readFileSync(path.join(footage, n, 'info.json')));
const bonk = info('bonk'), bonkOff = Math.max(0, Math.min((bonk.event != null ? bonk.event / FPS : 3) - (38.85 - 34.4), bonk.frames / FPS - 6.05));
const fuji = info('fuji'), FUJI_OFF = fuji.event != null ? fuji.event / FPS + 0.05 - 0.1 : 0.6; // Noodle's tunnel line appears 0.1 s into the Fuji shot
const PLAY = [ // [video start, video end, clip, clip start]
  [8.2, 13.4, 'adopt', 0.25], [13.4, 14.2, 'feed', 0.45], [14.2, 14.9, 'pet', 0.6], [14.9, 15.6, 'bath', 0.6], [15.6, 16.2, 'nap', 0.9],
  [16.2, 19.7, 'walk', 0.4, [1.55, '30% 46%']], [19.7, 23.6, 'fuji', FUJI_OFF], [23.6, 25.0, 'garden', 0.3], [25.0, 26.2, 'kitchen', 0.3], [26.2, 29.4, 'puppies', 0.1],
  [29.4, 31.0, 'halloween', 0.3], [31.0, 32.6, 'snow', 0.3], [32.6, 34.4, 'sweater', 0.3], [34.4, 40.4, 'bonk', bonkOff, [1.55, '34% 46%']],
];
const T = { title: [5.2, 8.2], play: [8.2, 40.4], end: [40.4, 45], subs, cuts: PLAY.map((q) => q[0]) };
const srcAt = (t) => { const q = PLAY.find((c) => t >= c[0] && t < c[1]); if (!q) return [null, null]; const n = info(q[2]).frames, fi = Math.max(0, Math.min(n - 1, Math.round((t - q[0] + q[3]) * FPS))); return ['file://' + path.join(footage, q[2], String(fi).padStart(5, '0') + '.jpg'), q[4] || null]; };

async function frames(mode, from, to, dir) {
  const b = await chromium.launch({ executablePath: ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f)), args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(__dirname, 'video45.html')); await p.waitForFunction(() => window.READY === true); await p.evaluate((T) => { window.T = T; }, T);
  for (let i = from; i < to; i++) { const t = i / FPS; const [src, zoom] = srcAt(t); await p.evaluate(([t, s, m, z]) => window.draw(t, s, m, z), [t, src, mode, zoom]); await p.screenshot({ path: path.join(dir, 'f_' + String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 }); }
  await b.close();
}
const sh = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
(async () => {
  fs.mkdirSync(work, { recursive: true }); fs.writeFileSync(path.join(work, 'timeline.json'), JSON.stringify({ T, PLAY, bonkOff }, null, 1));
  const modes = which === 'both' ? ['soon', 'play'] : [which];
  // 1) frames: the shared part once (0 to 40.4 s), then each ending
  const shared = path.join(work, 'frames_shared'); fs.rmSync(shared, { recursive: true, force: true }); fs.mkdirSync(shared, { recursive: true });
  const cutF = Math.round(T.end[0] * FPS), parts = 4, step = Math.ceil(cutF / parts);
  await Promise.all(Array.from({ length: parts }, (_, k) => frames(modes[0], k * step, Math.min(cutF, (k + 1) * step), shared)));
  for (const m of modes) {
    const dir = path.join(work, 'frames_' + m); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    for (let i = 0; i < cutF; i++) { const n = 'f_' + String(i).padStart(5, '0') + '.jpg'; fs.symlinkSync(path.join(shared, n), path.join(dir, n)); }
    await frames(m, cutF, NF, dir);
    // 2) sound: the voice lines placed on the timeline, the game's music under them (ducked while Noodle talks)
    const lines = VO.map(([k, st]) => [k === 'l9' ? 'l9' + m : k, st]);
    const inputs = [], filt = [];
    lines.forEach(([k, st], i) => { inputs.push('-i', path.join(voDir, k + '.wav')); filt.push(`[${i}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${Math.round(st * 1000)}|${Math.round(st * 1000)}[v${i}]`); });
    inputs.push('-i', music); const mi = lines.length;
    filt.push(`${lines.map((_, i) => `[v${i}]`).join('')}amix=inputs=${lines.length}:normalize=0,apad=whole_dur=${DUR},atrim=0:${DUR},volume=1.0[vo]`);
    filt.push(`[vo]asplit=2[vo1][vo2]`);
    filt.push(`[${mi}:a]aresample=44100,atrim=0:${DUR},volume=0.55,afade=t=in:d=0.4,afade=t=out:st=${DUR - 1.4}:d=1.4[mu]`);
    filt.push(`[mu][vo1]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=350[duck]`);
    filt.push(`[duck][vo2]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=9[a]`);
    const outFile = path.join(OUT, `doodle-doggo-promo-45s-${m}${process.env.VOICE_TAG ? '-' + process.env.VOICE_TAG : ''}.mp4`);
    sh(['-framerate', String(FPS), '-i', path.join(dir, 'f_%05d.jpg'), ...inputs, '-filter_complex', filt.join(';').replace(/\[(\d+):a\]/g, (s, n) => `[${+n + 1}:a]`), '-map', '0:v', '-map', '[a]',
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-movflags', '+faststart', '-t', String(DUR), outFile]);
    console.log('wrote', outFile);
  }
})();
