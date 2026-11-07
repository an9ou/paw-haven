// A cozy rainy-evening lo-fi loop for the YouTube "lofi" videos (owner, 7 Nov 2026: "a looped lofi music video for posting on YouTube"),
// made from the game's own music engine (mods/pawaudio.js) in a copy for the video scripts only, the way ../../instagram/launch/spooky_lofi.js
// adds 'spooky': the game's music does not change. It adds one place, 'cozy': a warm major-7 progression of TEN bars (Fmaj9 Am9 Bbmaj9 C9sus
// Fmaj9 Dm9 Gm9 C13 Bbmaj9 C9sus, so 10 bars at 80 bpm = exactly 30 s, one loop), a lazy swung beat (swing 0.62, brushed snare), soft comped keys,
// the warm full bass, a kalimba topline, a slow pad, extra vinyl crackle, and the engine's own indoor rain: the rain bed muffled through the
// wall and soft taps on the window glass (place 'cozy' counts as indoors, like 'house').
// The engine indexes its 8-bar progressions with `bar % 8`; the copy uses `bar % pr.length` (the same for every 8-bar progression).
// Math.random is seeded (mulberry32), so a render is the same every time.
//
// Seamless loop (cozyLoop): render 3 loops and a bit (bars 0..30), cut bars 10..19 (30.05 s .. 60.05 s: the engine starts at 0.05 s), and lay
// the first bar after the cut (60.05 .. 61.55 s, the true continuation of the last bar) over the start of the cut with a 1.5 s linear cross-fade:
// the join is then the engine's own bar 19 -> bar 20, sample for sample. The level is set on three copies end to end (gain to -16 LUFS integrated,
// a gentle limiter for true peak -1.5 dBTP) and the middle copy is kept, so the limiter's memory at the start matches the end too.
//   const { cozyLoop } = require('./cozy_lofi.js'); const wav = await cozyLoop({ browser, SRC, work });
//   Preview: NODE_PATH=$(npm root -g) node brand/youtube/lofi/cozy_lofi.js <out.wav>   (SRC=<repo root with mods/pawaudio.js>, default this repo)
const fs = require('fs'), path = require('path'), cp = require('child_process');
const BPM = 80, BAR = 240 / BPM, BARS = 10, LOOP = BARS * BAR, T0 = 0.05, XF = 1.5, SR = 44100, SEED = 20261107;
const PROG = ['Fmaj9', 'Am9', 'Bbmaj9', 'C9sus', 'Fmaj9', 'Dm9', 'Gm9', 'C13', 'Bbmaj9', 'C9sus'];
const PATCH = [
  ["var PLACES = ['title',", "var PLACES = ['cozy', 'title',"],
  ['var INDOOR = { nursery: 1,', 'var INDOOR = { cozy: 1, nursery: 1,'],
  ["if ((place === 'house' || place === 'kitchen') && weather === 'rain') a.window = place === 'house' ? 0.8 : 0.5;",
    "if ((place === 'house' || place === 'cozy' || place === 'kitchen') && weather === 'rain') a.window = place === 'kitchen' ? 0.5 : 0.8;"],
  ['E.pi = bar % 8; E.bar = bar;', 'E.pi = bar % pr.length; E.bar = bar;'],
  ['E.nextChord = CH[pr[(bar + 1) % 8]];', 'E.nextChord = CH[pr[(bar + 1) % pr.length]];'],
  ['var KEEP_PROG = {', `PROGS.cozy = ${JSON.stringify(PROG)};
  BASE.cozy = V({ bpm: ${BPM}, swing: 0.62, prog: 'cozy', keys: 'comp', bass: 'full', kick: 'lazy', snare: 'std', hats: 'std', top: 'kalimba', dens: 0.45,
    themeChance: 0, cut: 4600, brush: true, L: { keys: 0.9, pad: 0.35, bass: 0.85, kick: 0.8, snare: 0.5, hats: 0.45, top: 0.75, crackle: 1.3 } });
  PLACE_BASE.cozy = 'cozy';
  var KEEP_PROG = { cozy: 1,`]];
function cozySource(SRC) {
  let s = fs.readFileSync(path.join(SRC, 'mods', 'pawaudio.js'), 'utf8');
  for (const [a, b] of PATCH) { if (s.split(a).length !== 2) throw new Error('pawaudio.js changed: ' + a.slice(0, 40)); s = s.replace(a, () => b); }
  const seed = `(function(){var a=${SEED}>>>0;Math.random=function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};})();\n`;
  return seed + s;
}

// 16-bit PCM WAV <-> Float32 channels
function readWav(buf) { const ch = buf.readUInt16LE(22), sr = buf.readUInt32LE(24); let o = 12, data = null, len = 0;
  while (o < buf.length) { const id = buf.toString('ascii', o, o + 4), sz = buf.readUInt32LE(o + 4); if (id === 'data') { data = o + 8; len = sz; break; } o += 8 + sz; }
  const n = len / (2 * ch), out = Array.from({ length: ch }, () => new Float32Array(n));
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) out[c][i] = buf.readInt16LE(data + (i * ch + c) * 2) / 32768;
  return { sr, ch: out }; }
function writeWav(file, sr, ch) { const n = ch[0].length, b = Buffer.alloc(44 + n * ch.length * 2);
  b.write('RIFF', 0); b.writeUInt32LE(b.length - 8, 4); b.write('WAVE', 8); b.write('fmt ', 12); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(ch.length, 22);
  b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * ch.length * 2, 28); b.writeUInt16LE(ch.length * 2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * ch.length * 2, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < ch.length; c++) { const x = Math.max(-1, Math.min(1, ch[c][i])); b.writeInt16LE(Math.round(x < 0 ? x * 32768 : x * 32767), 44 + (i * ch.length + c) * 2); }
  fs.writeFileSync(file, b); }
const loud = (f) => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  return JSON.parse(r.slice(r.lastIndexOf('{'))); };

async function cozyLoop({ browser, SRC, work, ambience = 0.4 }) {
  fs.mkdirSync(work, { recursive: true });
  const raw = path.join(work, 'cozy_raw.wav');
  const p = await browser.newPage(); await p.goto('about:blank'); await p.addScriptTag({ content: cozySource(SRC) });
  const r = await p.evaluate(async ([sec, amb]) => { const x = await window.PawAudio._render({ seconds: sec, wav: true, vols: { master: 0.7, music: 0.85, ambience: amb },
    segments: [{ at: 0, ctx: { place: 'cozy', time: 'day', weather: 'rain' } }] }); return { wav: x.wav, variants: x.variants, peak: x.peak, rms: x.rms }; }, [T0 + 2 * LOOP + XF + 1, ambience]);
  await p.close(); fs.writeFileSync(raw, Buffer.from(r.wav, 'base64'));
  console.log('cozy lofi:', JSON.stringify(r.variants.map((v) => v.variant + ' ' + v.bpm)), 'peak', r.peak);
  if (r.variants.some((v) => v.bpm !== BPM)) throw new Error('bpm is not ' + BPM);
  const W = readWav(fs.readFileSync(raw)); if (W.sr !== SR) throw new Error('sample rate ' + W.sr);
  const a = Math.round((T0 + LOOP) * SR), n = Math.round(LOOP * SR), xn = Math.round(XF * SR);
  const loop = W.ch.map((c) => { const o = c.slice(a, a + n); for (let i = 0; i < xn; i++) { const g = i / xn; o[i] = o[i] * g + c[a + n + i] * (1 - g); } return o; });
  // three copies end to end -> gain + limiter -> keep the middle one
  const tri = path.join(work, 'cozy_x3.wav'), triM = path.join(work, 'cozy_x3_master.wav');
  writeWav(tri, SR, loop.map((c) => { const o = new Float32Array(3 * n); for (let k = 0; k < 3; k++) o.set(c, k * n); return o; }));
  const m = loud(tri), gain = -16 - +m.input_i;
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', tri, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=${Math.pow(10, -2.0 / 20).toFixed(4)}:attack=5:release=80:level=false`, '-c:a', 'pcm_s16le', triM]);
  const M = readWav(fs.readFileSync(triM)), out = path.join(work, 'cozy_loop.wav');
  writeWav(out, SR, M.ch.map((c) => c.slice(n, 2 * n)));
  const f = loud(out); console.log('loop', (n / SR).toFixed(3), 's: I', f.input_i, 'LUFS, TP', f.input_tp, 'dBTP, LRA', f.input_lra, '(before: I', m.input_i, 'TP', m.input_tp + ')');
  return { wav: out, I: +f.input_i, TP: +f.input_tp, LOOP };
}
module.exports = { cozySource, cozyLoop, readWav, writeWav, BPM, LOOP, PROG };

if (require.main === module) (async () => {
  const { chromium } = require('playwright');
  const SRC = path.resolve(process.env.SRC || path.join(__dirname, '..', '..', '..')), out = path.resolve(process.argv[2] || 'cozy_loop.wav');
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const r = await cozyLoop({ browser: b, SRC, work: path.join(path.dirname(out), 'cozy_work') }); fs.copyFileSync(r.wav, out); console.log('wrote', out); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
