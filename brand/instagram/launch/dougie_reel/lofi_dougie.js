// The holiday dance Reel with the owner's Christmas lo-fi as its soundtrack (owner, 25 Nov 2026, of the Christmas lo-fi: "Good use this in the
// reels"; docs/marketing/DOUGIE_REEL.md, "The lo-fi version"). The posting file without music (doodle-doggo-holiday-dance.mp4) stays as it is:
// this writes doodle-doggo-holiday-dance-lofi.mp4, the SAME picture (its video stream copied, not re-encoded) with the music.
// The music: brand/youtube/lofi/christmas_lofi.js, place 'xmaslofi', variant 'sleigh' (swung 16ths, sleigh-bell hats, celesta tune), rendered
// here at 85 BPM instead of its 88 so it sits on the Reel's beat grid. The script file is not changed: its VARIANTS table is read and the tempo
// set in this process only. Everything else (seed, swing 0.60, voices, levels, the fireplace) is the 'sleigh' preview's.
//   - The engine starts its first bar at 0.05 s (PawAudio._render: e.start(0.05)). The render runs 21 bars and a bit; the loop is bars 17 to 20
//     (the tune's opening on its second pass: Fmaj9 Bbmaj9 Am9 D9, with the glittery chime on beat 1 and the music-box glock doubling), cut on the
//     bar lines, so beat 1 of bar 17 is the loop's sample 0 = the Reel's frame 0.
//   - Seamless: the last 30 ms crossfade (equal power) into the audio just BEFORE bar 17, so the loop's last sample runs straight on into its first
//     (no click, no gap). The tails ringing over the bar line are the real ones of bar 16, which leads into bar 17 in the music.
//   - 4 bars at 85 BPM are 11.2941 s; the picture is 339 frames = 11.3000 s. The loop is fitted to the picture by a 0.05% resample (pitch
//     -0.009 semitones, tempo 84.956 BPM: both far below hearing), done on three copies end to end with the middle one kept, so it stays seamless.
//   - Master: gain to -16 LUFS integrated and a gentle limiter, again on three copies with the middle one kept; true peak at most -1 dBTP
//     (measured on the finished AAC).
//   - Checks: the seam (the sample step at the wrap against the loop's own sample steps, and the high-frequency energy round the seam against the
//     rest), loudness and true peak of the finished file, and where the music's beats land: kick onsets (below 150 Hz) and sleigh-bell onsets
//     (4 to 7.5 kHz) against the beat grid and the picture's outfit swaps.
//   ART_ROOT=<main checkout> NODE_PATH=$(npm root -g) node brand/instagram/launch/dougie_reel/lofi_dougie.js <workdir>
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { NF, CUT, BPM } = require('./build_dougie.js');
const XM = require('../../../youtube/lofi/christmas_lofi.js');
const ART_ROOT = path.resolve(process.env.ART_ROOT || path.join(__dirname, '..', '..', '..', '..'));
const WORK = path.resolve(process.argv[2] || 'dougie_lofi'); fs.mkdirSync(WORK, { recursive: true });
const SR = 48000, FPS = 30, SPB = 60 / BPM, BAR = 4 * SPB, T0 = 0.05, BAR_A = 16; // the loop starts on the render's bar index 16 (the 17th bar)
const LOOP_IN = 4 * BAR, T_VID = NF / FPS, XF = 0.03;
const NAME = 'sleigh', V = XM.VARIANTS[NAME];
if (!V || V.bpm !== 88 || V.swing !== 0.6 || V.hats !== 'jingle' || V.top !== 'celesta') throw new Error('the sleigh variant changed: ' + JSON.stringify(V));
V.bpm = BPM; // 85, in this process only
const OUT = path.join(__dirname, 'doodle-doggo-holiday-dance-lofi.mp4'), SILENT = path.join(__dirname, 'doodle-doggo-holiday-dance.mp4');
const ff = (a) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
const loud = (f, pre, post) => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', ...(pre || []), '-i', f, ...(post || []), '-af', 'loudnorm=I=-16:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; return JSON.parse(r.slice(r.lastIndexOf('{'))); };
// first arrival of each beat in a band: |band-passed signal| (causal filter) first reaching 30% of its peak within -30..+120 ms of the beat time.
// argv: f32 stereo file, beat times (s), loop (1: the file loops, so a window may wrap). Prints the seam numbers (for a loop) and per-beat onsets.
const ONSET_PY = `import numpy as np, json, sys
from scipy.signal import butter, sosfilt, sosfiltfilt
SR=${SR}; x=np.fromfile(sys.argv[1],dtype=np.float32).reshape(-1,2).mean(axis=1); n=len(x); B=json.loads(sys.argv[2]); loop=sys.argv[3]=='1'
y3=np.concatenate([x,x,x]) if loop else x
def band(sos):
  y=np.abs(sosfilt(sos,y3)); return y[n:2*n] if loop else y
bell=band(butter(4,[4000,7500],'bp',fs=SR,output='sos')); kick=band(butter(4,150,'lp',fs=SR,output='sos'))
def win(y,t,a,b):
  i=int(round((t+a)*SR)); m=int(round((b-a)*SR))
  return np.take(y,np.arange(i,i+m),mode='wrap') if loop else y[max(0,i):i+m]
k2=int(0.002*SR); sm=lambda y: np.convolve(y,np.ones(k2)/k2,'same')
def first(y,t,need):
  # the strongest rise near the beat: the envelope's peak in -15..+90 ms, then back from it to where it last stood at its floor + 30% of the rise
  seg=win(y,t,-0.06,0.09); e=sm(seg); o=int(0.045*SR); p=o+int(np.argmax(e[o:])); f0=max(0,p-int(0.04*SR)); fl=e[f0:p+1].min(); lv=fl+0.3*(e[p]-fl)
  if need and e[p]<need*max(fl,1e-9): return None
  j=p
  while j>f0 and e[j]>lv: j-=1
  return round((j/SR-0.06)*1000,1)
bo=[first(bell,t,0) for t in B]; ko=[first(kick,t,3) for t in B]
st=lambda v: (lambda a: {'n':len(a),'median':round(float(np.median(a)),1),'p10':round(float(np.percentile(a,10)),1),'p90':round(float(np.percentile(a,90)),1),'min':round(float(a.min()),1),'max':round(float(a.max()),1)})(np.array([q for q in v if q is not None]))
out={'bell':bo,'kick':ko,'bellStats':st(bo),'kickStats':st(ko) if any(q is not None for q in ko) else None}
if loop:
  d=np.abs(np.diff(np.concatenate([x,x[:1]]))); hp=sosfiltfilt(butter(4,6000,'hp',fs=SR,output='sos'),y3)[n:2*n]; w=int(0.02*SR)
  allE=[float(np.sqrt(np.mean(hp[i:i+2*w]**2))) for i in range(0,n-2*w,w)]
  out.update({'samples':n,'wrap_step':round(float(d[-1]),5),'step_p999':round(float(np.percentile(d,99.9)),5),'step_median':round(float(np.median(d)),6),
    'seam_hf':round(float(np.sqrt(np.mean(np.concatenate([hp[-w:],hp[:w]])**2))),5),'hf_median':round(float(np.median(allE)),5),'hf_max':round(float(np.max(allE)),5)})
print(json.dumps(out))`;
const f32 = (f) => { const b = fs.readFileSync(f); return new Float32Array(b.buffer, b.byteOffset, b.length / 4); };

(async () => {
  // ---- 1) render ----
  const raw = path.join(WORK, 'raw.wav');
  if (!fs.existsSync(raw) || process.env.REMUSIC) {
    const { chromium } = require('playwright');
    const b = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
    const p = await b.newPage(); await p.goto('about:blank'); await p.addScriptTag({ content: XM.xmasSource(ART_ROOT, NAME) });
    const sec = T0 + (BAR_A + 5) * BAR + 1;
    const r = await p.evaluate(async ([sec, w, sr]) => { const x = await window.PawAudio._render({ seconds: sec, sampleRate: sr, wav: true, vols: { master: 0.7, music: 0.85, ambience: 0.4 },
      segments: [{ at: 0, ctx: { place: 'xmaslofi', time: 'day', weather: w } }] });
      return { wav: x.wav, d: window.PawAudio.describe({ place: 'xmaslofi', time: 'day', weather: w }), dropped: x.dropped, variants: x.variants }; }, [sec, V.weather, SR]);
    await b.close();
    if (r.d.bpm !== BPM || r.d.prog !== 'xmas' || r.d.top !== 'celesta') throw new Error('not the xmaslofi sleigh variant at 85 BPM: ' + JSON.stringify(r.d));
    if (r.variants.some((x) => x.bpm !== BPM)) throw new Error('the tempo changed during the render: ' + JSON.stringify(r.variants));
    console.log('render', r.d.label, r.d.bpm, 'bpm, swing', V.swing, '| dropped voices', r.dropped);
    fs.writeFileSync(raw, Buffer.from(r.wav, 'base64'));
  }
  ff(['-i', raw, '-ar', String(SR), '-ac', '2', '-f', 'f32le', path.join(WORK, 'raw.f32')]);
  const A = f32(path.join(WORK, 'raw.f32')), N = A.length / 2;

  // ---- 2) the 4-bar loop, cut on the bar lines, its end crossfaded into the audio just before its start ----
  // where the music's beats really sound: the engine schedules bar 1 at 0.05 s, but everything passes the tape-wobble delay (25 ms) and the
  // voices take a moment to speak (the tape wobble sways the delay and each sleigh shake jingles a little loose, so single beats spread over
  // about 15 ms); the median sleigh-bell onset on the beats of bars 3 to 21 gives the true lag, and the cut moves by it
  const rb = []; for (let k = 8; k < (BAR_A + 5) * 4; k++) rb.push(T0 + k * SPB);
  const lag = JSON.parse(cp.execFileSync('python3', ['-c', ONSET_PY, path.join(WORK, 'raw.f32'), JSON.stringify(rb), '0'], { encoding: 'utf8' }));
  const LAG = lag.bellStats.median / 1000;
  if (!(LAG > 0.02 && LAG < 0.06) || lag.bellStats.p90 - lag.bellStats.p10 > 20) throw new Error('the music\'s beat lag is not steady: ' + JSON.stringify(lag.bellStats));
  console.log('the music sounds', (LAG * 1000).toFixed(1), 'ms after the engine\'s grid (sleigh bells on', lag.bellStats.n, 'beats, 10-90%', lag.bellStats.p10, '..', lag.bellStats.p90, 'ms); the cut moves by that');
  const a = Math.round((T0 + BAR_A * BAR + LAG) * SR), L = Math.round(LOOP_IN * SR), D = Math.round(XF * SR);
  if (a + L > N || a - D < 0) throw new Error('the render is too short');
  const loop = new Float32Array(L * 2);
  for (let i = 0; i < L; i++) for (let c = 0; c < 2; c++) {
    let v = A[(a + i) * 2 + c];
    if (i >= L - D) { const w = (i - (L - D) + 0.5) / D; v = Math.cos(w * Math.PI / 2) * v + Math.sin(w * Math.PI / 2) * A[(a - (L - i)) * 2 + c]; }
    loop[i * 2 + c] = v; }
  const x3 = (src, file) => { const o = new Float32Array(src.length * 3); o.set(src, 0); o.set(src, src.length); o.set(src, src.length * 2); fs.writeFileSync(file, Buffer.from(o.buffer)); };
  x3(loop, path.join(WORK, 'loop3.f32'));
  // ---- 3) fitted to the picture's 11.300 s: the L samples played at the rate that makes them last 11.300 s, resampled to 48 kHz (middle copy) ----
  const rate = Math.round(L / T_VID), M = Math.round(T_VID * SR);
  ff(['-f', 'f32le', '-ar', String(rate), '-ac', '2', '-i', path.join(WORK, 'loop3.f32'), '-af', `aresample=${SR}:filter_size=64:phase_shift=10:cutoff=0.97`, '-f', 'f32le', path.join(WORK, 'fit3.f32')]);
  const F3 = f32(path.join(WORK, 'fit3.f32')), off = Math.round(F3.length / 2 / 3);
  const fit = F3.slice(off * 2, (off + M) * 2);
  if (fit.length !== M * 2) throw new Error('the fitted loop is ' + fit.length / 2 + ' samples, not ' + M);
  console.log('loop', L, 'samples at 85 BPM (' + (L / SR).toFixed(4) + ' s) played at', rate, 'Hz ->', M, 'samples (' + (M / SR).toFixed(4) + ' s) = 339 frames; tempo', (BPM * LOOP_IN / T_VID).toFixed(3), 'BPM');
  // ---- 4) master on three copies: gain to -16 LUFS, a gentle limiter at -2 dBFS; the middle copy is the loop ----
  x3(fit, path.join(WORK, 'fit3b.f32'));
  const fin = ['-f', 'f32le', '-ar', String(SR), '-ac', '2'];
  const m0 = loud(path.join(WORK, 'fit3b.f32'), fin), gain = -16 - +m0.input_i;
  ff([...fin, '-i', path.join(WORK, 'fit3b.f32'), '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=${Math.pow(10, -2.0 / 20).toFixed(4)}:attack=5:release=80:level=false`, '-f', 'f32le', path.join(WORK, 'mast3.f32')]);
  const M3 = f32(path.join(WORK, 'mast3.f32')), mast = M3.slice(M * 2, M * 4);
  fs.writeFileSync(path.join(WORK, 'music.f32'), Buffer.from(mast.buffer.slice(mast.byteOffset, mast.byteOffset + mast.byteLength)));
  ff([...fin, '-i', path.join(WORK, 'music.f32'), '-c:a', 'pcm_s16le', path.join(WORK, 'music.wav')]);

  // ---- 5) the Reel: the silent cut's picture (copied as it is) with the music ----
  ff(['-i', SILENT, '-i', path.join(WORK, 'music.wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', String(SR), '-ac', '2', '-movflags', '+faststart', '-t', T_VID.toFixed(3), OUT]);
  // ---- 6) checks ----
  const probe = cp.execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=index,codec_name,width,height,r_frame_rate,nb_frames,sample_rate,channels,duration,bit_rate', '-show_entries', 'format=duration,size', '-of', 'compact', OUT]).toString().trim();
  console.log(probe);
  // the picture is the silent cut's, bit for bit
  const vh = (f) => cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-i', f, '-map', '0:v', '-c', 'copy', '-f', 'md5', '-']).toString().trim();
  if (vh(OUT) !== vh(SILENT)) throw new Error('the picture is not the silent cut\'s');
  // loudness and true peak of the finished file: once, and three times end to end (as it plays looping)
  const lf = loud(OUT, [], ['-vn']), lf3b = loud(OUT, ['-stream_loop', '2'], ['-vn']);
  console.log('loudness: once I', lf.input_i, 'LUFS TP', lf.input_tp, 'dBTP LRA', lf.input_lra, '| looped x3 I', lf3b.input_i, 'TP', lf3b.input_tp);
  if (Math.abs(+lf.input_i + 16) > 0.5 || +lf.input_tp > -1) throw new Error('loudness off: ' + JSON.stringify(lf));
  // decode the finished audio and analyse: the seam, the beats
  // (the AAC stream ends on whole 1024-sample frames: the decoder hands back 320 padding samples past the file's 11.300 s, which the mp4's edit
  // list cuts off in a player; they are cut off here too, and the decoded loop must line up with the master sample for sample)
  ff(['-i', OUT, '-vn', '-t', T_VID.toFixed(4), '-ar', String(SR), '-ac', '2', '-f', 'f32le', path.join(WORK, 'final.f32')]);
  { const fin2 = f32(path.join(WORK, 'final.f32')); if (fin2.length / 2 !== M) throw new Error('the decoded loop is ' + fin2.length / 2 + ' samples, not ' + M);
    let e = 0, p0 = 0; for (let i = 0; i < M * 2; i++) { e += (fin2[i] - mast[i]) ** 2; p0 += mast[i] ** 2; } const snr = 10 * Math.log10(p0 / e);
    console.log('the decoded AAC against the master: aligned, ' + snr.toFixed(1) + ' dB signal to difference'); if (snr < 25) throw new Error('the AAC does not line up with the master'); }
  const an = JSON.parse(cp.execFileSync('python3', ['-c', ONSET_PY, path.join(WORK, 'final.f32'), JSON.stringify([...Array(16).keys()].map((b) => b * T_VID / 16)), '1'], { encoding: 'utf8' }));
  // the seam and the picture's outfit swaps (frames where a look lands: beats 1, 3, 5, 7, 9, 11, 13 and 16) against the music's own beat onsets
  const SW = [0, 2, 4, 6, 8, 10, 12, 15];
  an.swaps = SW.map((b) => ({ beat: b + 1, frame: CUT[b], frame_s: +(CUT[b] / FPS).toFixed(4), bell_ms: an.bell[b] == null ? null : +(an.bell[b] + (b * T_VID / 16 - CUT[b] / FPS) * 1000).toFixed(1),
    kick_ms: an.kick[b] == null ? null : +(an.kick[b] + (b * T_VID / 16 - CUT[b] / FPS) * 1000).toFixed(1) }));
  fs.writeFileSync(path.join(WORK, 'lofi_check.json'), JSON.stringify({ probe, loudness: { once: lf, looped: lf3b }, gain, an }, null, 1));
  console.log('seam: wrap step', an.wrap_step, '(loop steps: median', an.step_median, ', 99.9%', an.step_p999 + ') | >6 kHz energy at the seam', an.seam_hf, '(median', an.hf_median, ', max', an.hf_max + ')');
  console.log('music beat onsets vs the beat grid (ms): sleigh bells', JSON.stringify(an.bellStats), 'kicks', JSON.stringify(an.kickStats));
  console.log('outfit swaps (picture frame) vs the music onset on that beat (ms, + = the sound comes after the frame):', JSON.stringify(an.swaps));
  if (an.wrap_step > an.step_p999 || an.seam_hf > an.hf_max) throw new Error('a click at the seam');
})().catch((e) => { console.error(e); process.exit(1); });
