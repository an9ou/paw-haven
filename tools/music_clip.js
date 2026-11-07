// Render a listening clip of the PawAudio music (no game, no audio files): headless Chromium + OfflineAudioContext.
//   NODE_PATH=$(npm root -g) node tools/music_clip.js --out <file.wav> [--engine mods/pawaudio.js] [--seconds 36]
//     [--ctx '{"place":"market","time":"day","weather":"snow"}'] [--segments '[{"at":0,"ctx":{...}},{"at":20,"ctx":{...}}]']
//     [--seed 7] [--fade 2] [--mp3] [--json]
// --engine takes any copy of pawaudio.js, so a new place or seasonal variant can be prototyped in a scratch copy and heard
// before it touches the shipped file. The ctx object reaches resolve() as given, so extra keys (e.g. a festival id) pass through.
// Prints peak dBFS, RMS dB, the loudest 1 s, the quietest 1 s (silence check), NaN count, clipped samples, and LUFS when ffmpeg exists.
// --mp3 also writes an MP3 next to the WAV (ffmpeg, 192 kbps) when ffmpeg is on the PATH.
const fs = require('fs'); const path = require('path'); const { execFileSync, spawnSync } = require('child_process');
const { chromium } = require('playwright');

const argv = process.argv.slice(2), A = {};
for (let i = 0; i < argv.length; i++) { const k = argv[i]; if (!k.startsWith('--')) continue; const n = argv[i + 1]; if (n == null || n.startsWith('--')) A[k.slice(2)] = true; else { A[k.slice(2)] = n; i++; } }
if (!A.out) { console.error('usage: node tools/music_clip.js --out clip.wav [--engine path] [--seconds 36] [--ctx JSON | --segments JSON] [--seed N] [--fade S] [--mp3] [--json]'); process.exit(2); }
const ROOT = path.join(__dirname, '..');
const engine = fs.readFileSync(path.resolve(A.engine || path.join(ROOT, 'mods/pawaudio.js')), 'utf8');
const seconds = +A.seconds || 36, fade = A.fade != null ? +A.fade : 2, seed = A.seed != null ? +A.seed : null;
const segments = A.segments ? JSON.parse(A.segments) : [{ at: 0, ctx: A.ctx ? JSON.parse(A.ctx) : { place: 'yard', time: 'day', weather: 'sunny' } }];

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  await p.setContent('<!doctype html><meta charset="utf-8"><title>clip</title>');
  await p.evaluate((sd) => {
    if (sd != null) { let a = sd >>> 0; Math.random = () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
    const sr = OfflineAudioContext.prototype.startRendering;   // keep the rendered buffer for our own analysis
    OfflineAudioContext.prototype.startRendering = function () { return sr.call(this).then((buf) => { window.__buf = buf; return buf; }); };
  }, seed);
  await p.addScriptTag({ content: engine });
  const r = await p.evaluate(async ({ seconds, segments, fade }) => {
    const info = await window.PawAudio._render({ seconds, segments });
    const buf = window.__buf, ch = buf.numberOfChannels, n = buf.length, sr = buf.sampleRate, D = [];
    for (let c = 0; c < ch; c++) D.push(buf.getChannelData(c));
    const fl = Math.floor(fade * sr);
    let nan = 0, peak = 0, clipped = 0, sum = 0; const win = sr, wins = [];
    let ws = 0;
    for (let i = 0; i < n; i++) {
      const g = i > n - fl ? (n - i) / fl : 1;   // fade-out so the clip doesn't stop dead
      let fr = 0;
      for (let c = 0; c < ch; c++) {
        let x = D[c][i]; if (!Number.isFinite(x)) { nan++; x = 0; }
        x *= g; D[c][i] = x; const a = Math.abs(x); if (a > peak) peak = a; if (a >= 0.999) clipped++; fr += x * x;
      }
      fr /= ch; sum += fr; ws += fr;
      if ((i + 1) % win === 0) { wins.push(Math.sqrt(ws / win)); ws = 0; }
    }
    const db = (v) => Math.round(20 * Math.log10(Math.max(v, 1e-9)) * 10) / 10;
    const body = wins.slice(0, Math.max(1, wins.length - Math.ceil(fade)));   // the fade-out isn't a gap
    // 16-bit WAV
    const bytes = 44 + n * ch * 2, ab = new ArrayBuffer(bytes), dv = new DataView(ab); let o = 0;
    const s = (t) => { for (let i = 0; i < t.length; i++) dv.setUint8(o++, t.charCodeAt(i)); }, u32 = (v) => { dv.setUint32(o, v, true); o += 4; }, u16 = (v) => { dv.setUint16(o, v, true); o += 2; };
    s('RIFF'); u32(bytes - 8); s('WAVE'); s('fmt '); u32(16); u16(1); u16(ch); u32(sr); u32(sr * ch * 2); u16(ch * 2); u16(16); s('data'); u32(n * ch * 2);
    for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) { const x = Math.max(-1, Math.min(1, D[c][i])); dv.setInt16(o, x < 0 ? x * 0x8000 : x * 0x7fff, true); o += 2; }
    const u8 = new Uint8Array(ab); let bin = '';
    for (let k = 0; k < u8.length; k += 0x8000) bin += String.fromCharCode.apply(null, u8.subarray(k, k + 0x8000));
    return { wav: btoa(bin), seconds, start: window.PawAudio.describe(segments[0].ctx).label, peakDb: db(peak), rmsDb: db(Math.sqrt(sum / (n || 1))), loudest1sDb: db(Math.max(...body)), quietest1sDb: db(Math.min(...body)),
      nan, clipped, variants: info.variants.map((v) => v.at + 's ' + v.variant + ' (' + v.bpm + ' bpm)'), dropped: info.dropped, themes: info.themes };
  }, { seconds, segments, fade });
  await b.close();
  const out = path.resolve(A.out);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, Buffer.from(r.wav, 'base64')); delete r.wav;
  r.file = out; r.errors = errors;
  let ff = null; try { execFileSync('ffmpeg', ['-version'], { stdio: 'ignore' }); ff = 'ffmpeg'; } catch (e) { /* no ffmpeg */ }
  if (ff) {
    // ffmpeg writes the loudness summary to stderr
    const res = spawnSync(ff, ['-hide_banner', '-nostats', '-i', out, '-af', 'ebur128', '-f', 'null', '-'], { encoding: 'utf8' });
    const m = /Integrated loudness:\s*I:\s*(-?[\d.]+) LUFS/.exec(res.stderr || ''); if (m) r.lufs = +m[1];
    if (A.mp3) { const mp3 = out.replace(/\.wav$/i, '') + '.mp3'; execFileSync(ff, ['-y', '-loglevel', 'error', '-i', out, '-codec:a', 'libmp3lame', '-b:a', '192k', mp3]); r.mp3 = mp3; }
  }
  if (A.json) console.log(JSON.stringify(r, null, 2));
  else {
    console.log(`${path.basename(out)}  ${r.seconds} s  peak ${r.peakDb} dBFS  rms ${r.rmsDb} dB  loudest 1 s ${r.loudest1sDb}  quietest 1 s ${r.quietest1sDb}${r.lufs != null ? '  ' + r.lufs + ' LUFS' : ''}  NaN ${r.nan}  clipped ${r.clipped}  dropped ${r.dropped}  themes ${r.themes}`);
    console.log('  0s ' + r.start); r.variants.forEach((v) => console.log('  ' + v)); if (r.mp3) console.log('  mp3: ' + r.mp3); if (errors.length) console.log('  page errors: ' + errors.join(' | '));
  }
  const bad = r.nan > 0 || r.peakDb > -1 || errors.length;
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
