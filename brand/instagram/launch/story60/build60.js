// "Hi, I'm Noodle": the 1-minute storybook video (9:16), from story60.html + Bella's lines (vo60.py) + the game's own music.
//   node build60.js <voDir> <workDir>    -> brand/instagram/launch/story60/doodle-doggo-noodle-story-60s.mp4
//   CUT=short (voice from CUT=short vo60.py) -> doodle-doggo-noodle-story-15s.mp4, the ad cut
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('playwright');
const [VOD, WORK] = process.argv.slice(2), FPS = 30, OUT = __dirname;
const vo = JSON.parse(fs.readFileSync(path.join(VOD, 'vo.json'), 'utf8'));
// END=play (with CUT=short): the launch ending, "Play free now" + itch.io, from the n10ap / n10bp lines
const PLAY = process.env.END === 'play', said = (k) => (PLAY && /^n10[ab]$/.test(k) ? k + 'p' : k);
if (PLAY) for (const k of ['n10a', 'n10b']) { vo.dur[k] = vo.dur[k + 'p']; vo.text[k] = vo.text[k + 'p']; }
const SHORT = process.env.CUT === 'short';
const ORDER = SHORT ? ['n1a', 'n1b', 'n3a', 'n3b', 'n5a', 'n9', 'n10a', 'n10b'] : ['n1a', 'n1b', 'n2a', 'n2b', 'n3a', 'n3b', 'n4a', 'n4b', 'n5a', 'n5b', 'n6a', 'n6b', 'n7', 'n8a', 'n8b', 'n9', 'n10a', 'n10b'];
// the pause before each line: a beat inside a scene, a little more on a cut
const GAP = { n1b: 0.45, n2a: 0.95, n2b: 0.45, n3a: 0.65, n3b: 0.55, n4a: 1.5, n4b: 0.45, n5a: 0.65, n5b: 0.45, n6a: 0.55, n6b: 0.4, n7: 0.6, n8a: 0.65, n8b: 0.4, n9: 0.65, n10a: 0.55, n10b: 0.35 };
const GAP15 = { n1b: 0.25, n3a: 0.6, n3b: 0.35, n5a: 1.2, n9: 2.3, n10a: 0.3, n10b: 0.2 };
const ST = {}; let t = SHORT ? 0.3 : 0.5;
for (const k of ORDER) { t += (SHORT ? GAP15 : GAP)[k] || 0; ST[k] = +t.toFixed(3); t += vo.dur[k]; }
const DUR = +(t + (SHORT ? 1.0 : 2.4)).toFixed(2), NF = Math.round(DUR * FPS);
const endAt = +(SHORT ? ST.n10a - 0.1 : ST.n10a + vo.dur.n10a * 0.5).toFixed(2); // the end card comes in on "Doodle Doggo is coming soon!"
const TL = { ST, D: vo.dur, endAt, hillEnd: endAt, cut: SHORT ? 'short' : 'full', ending: PLAY ? 'play' : 'soon' };
// subtitles (none on the end card, which says it in big letters)
const subs = [];
for (const k of ORDER) {
  const text = vo.text[k], d = vo.dur[k], st = ST[k]; if (st >= endAt) continue;
  let parts = [text];
  if (text.length > 46) { const mid = text.length / 2; let best = -1; for (let i = 0; i < text.length; i++) if (/[,.!?]/.test(text[i]) && i < text.length - 2 && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i; if (best > 0) parts = [text.slice(0, best + 1).trim(), text.slice(best + 1).trim()]; }
  const tot = parts.reduce((s, p) => s + p.length, 0); let tt = st;
  parts.forEach((p, j) => { const len = d * p.length / tot; subs.push([tt - 0.08, j === parts.length - 1 ? Math.min(st + d + 0.35, endAt) : tt + len, p.replace('cafe', 'café')]); tt += len; });
}
const frameAt = (t) => { const f = { t }; const s = subs.find((q) => t >= q[0] && t < q[1]); if (s) { f.sub = s[2]; f.subAt = s[0]; } return f; };
async function frames(from, to, dir) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } }); p.on('pageerror', (e) => console.log('page error', e.message));
  await p.goto('file://' + path.join(__dirname, 'story60.html')); await p.waitForFunction(() => window.READY === true);
  await p.evaluate((tl) => window.setTL(tl), TL);
  for (let i = from; i < to; i++) { await p.evaluate((f) => window.draw(f), frameAt(i / FPS)); await p.screenshot({ path: path.join(dir, 'f_' + String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 }); }
  await b.close();
}
const sh = (args) => execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
(async () => {
  fs.mkdirSync(WORK, { recursive: true });
  fs.writeFileSync(path.join(WORK, 'timeline.json'), JSON.stringify({ DUR, TL, subs }, null, 1));
  console.log('duration', DUR, 's; end card', endAt);
  if (process.env.ONLY) { // quick look: ONLY=3,12.5 renders just those seconds
    const dir = path.join(WORK, 'peek'); fs.mkdirSync(dir, { recursive: true });
    for (const s of process.env.ONLY.split(',').map(Number)) await frames(Math.round(s * FPS), Math.round(s * FPS) + 1, dir);
    return;
  }
  // music: the game's own, following the places
  const music = path.join(WORK, (SHORT ? 'music15' : 'music60') + (PLAY ? '-play' : '') + '.wav');
  if (!fs.existsSync(music)) {
    const c = (place, time) => ({ place, time: time || 'day', weather: 'sunny' });
    const plan = { seconds: DUR + 0.5, wav: true, vols: { master: 0.85, music: 0.62, ambience: 0.12 },
      segments: [{ at: 0, ctx: c('title') }, ...[['n2a', c('yard')], ['n3a', c('walk')], ['n4a', c('square')], ['n5a', c('dogpark')], ['n8a', c('river')], ['n9', c('hilltop', 'dusk')]].filter(([k]) => k in ST).map(([k, ctx]) => ({ at: ST[k] - 0.35, ctx })), { at: endAt, ctx: c('title') }],
      stingers: [{ at: ST.n1b + vo.dur.n1b, name: 'sparkle' }, { at: ST.n9, name: 'discover' }, { at: endAt, name: 'levelup' }] };
    fs.writeFileSync(path.join(WORK, (SHORT ? 'music15' : 'music60') + (PLAY ? '-play' : '') + '.json'), JSON.stringify(plan));
    execFileSync('node', [path.join(__dirname, '..', 'reel_audio.js'), music, path.join(WORK, (SHORT ? 'music15' : 'music60') + (PLAY ? '-play' : '') + '.json')], { stdio: 'inherit' });
  }
  const dir = path.join(WORK, PLAY ? 'frames-play' : 'frames'), redraw = !process.env.SOUND_ONLY; // SOUND_ONLY=1: keep the drawn frames, redo only the sound
  if (redraw) fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const parts = 4, step = Math.ceil(NF / parts);
  if (redraw) await Promise.all(Array.from({ length: parts }, (_, k) => frames(k * step, Math.min(NF, (k + 1) * step), dir)));
  const inputs = [], filt = [];
  ORDER.forEach((k, i) => { inputs.push('-i', path.join(VOD, said(k) + '.wav')); filt.push(`[${i + 1}:a]aresample=44100,aformat=channel_layouts=stereo,adelay=${Math.round(ST[k] * 1000)}|${Math.round(ST[k] * 1000)}[v${i}]`); });
  inputs.push('-i', music); const mi = ORDER.length + 1;
  filt.push(`${ORDER.map((_, i) => `[v${i}]`).join('')}amix=inputs=${ORDER.length}:normalize=0,apad=whole_dur=${DUR},atrim=0:${DUR}[vo]`, `[vo]asplit=2[vo1][vo2]`,
    `[${mi}:a]aresample=44100,atrim=0:${DUR},volume=0.55,afade=t=in:d=0.5,afade=t=out:st=${(DUR - 1.8).toFixed(2)}:d=1.8[mu]`, `[mu][vo1]sidechaincompress=threshold=0.02:ratio=6:attack=15:release=350[duck]`,
    `[duck][vo2]amix=inputs=2:normalize=0,loudnorm=I=-15:TP=-1.5:LRA=9[a]`);
  const out = path.join(OUT, (SHORT ? 'doodle-doggo-noodle-story-15s' : 'doodle-doggo-noodle-story-60s') + (PLAY ? '-play' : '') + '.mp4');
  sh(['-framerate', String(FPS), '-i', path.join(dir, 'f_%05d.jpg'), ...inputs, '-filter_complex', filt.join(';'), '-map', '0:v', '-map', '[a]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(FPS), '-c:a', 'aac', '-b:a', '192k', '-ar', '44100', '-movflags', '+faststart', '-t', String(DUR), out]);
  console.log('wrote', out);
})();
