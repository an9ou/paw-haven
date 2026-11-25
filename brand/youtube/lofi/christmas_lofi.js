// A Christmas lo-fi track (owner, 25 Nov 2026: "Can u create Christmas vibe lofi music, something like all i want for christmas is you"):
// the joyful, sparkly, sleigh-bell feel of a big Christmas pop song, turned into cozy lo-fi, with an ORIGINAL tune and arrangement (nothing
// from that song: not its melody, its piano intro, its chord sequence, its words or any sample; docs/marketing/CHRISTMAS_LOFI.md says how
// it differs). Made from the game's own music engine (mods/pawaudio.js) in a copy for the marketing scripts only, the way
// ../../instagram/launch/spooky_lofi.js adds 'spooky' and ./cozy_lofi.js adds 'cozy': the game's music does not change.
// It adds one place, 'xmaslofi' (indoors, like 'house'):
//   - a 16-bar form in F major (the game's key) with rich 7th/9th chords and two bright secondary dominants (D9, G9: the "Christmas lift"),
//     A: Fmaj9 Bbmaj9 Am9 D9 | Gm9 C13 Fmaj9 C9sus   B: Bbmaj9 C13 Am9 Dm9 | G9 Gm9 C9sus C13
//   - an original, composed 16-bar celesta tune (MEL below), played with the engine's own celesta (the Winter Market voice); from the
//     second time round a soft music-box glock doubles its long notes an octave up, and a glittery bell chimes at the top of each half
//   - the engine's sleigh-bell voice as the hats layer (the Winter Market's EP.sleigh) on a swung 8ths pattern with 16th pickups, and a
//     sleigh-bell shake into every 8th bar
//   - the Rhodes comping, a warm bouncy bass with chromatic approach notes, swung lo-fi kick and ghosted snare, a slow pad, vinyl crackle,
//     tape wobble and the lowpass warmth: the engine's sound
//   - a soft fireplace (added here, from the engine's own noise buffers): a low flickering roar and small wood pops, inside the room
// The engine indexes its 8-bar progressions with `bar % 8`; the copy uses `bar % pr.length` (the same for every 8-bar progression).
// Math.random is seeded (mulberry32), so a render is the same every time.
//   Preview (60 s, fade in and out, -16 LUFS, MP3):
//     NODE_PATH=$(npm root -g) node brand/youtube/lofi/christmas_lofi.js brand/youtube/lofi/christmas-lofi-preview.mp3 [variant] [seconds]
//   ALL=1 renders every variant next to <out> as christmas-lofi-<variant>.mp3. WAV=1 keeps the mastered wav too. WORK=<dir> for the
//   intermediate wavs (default the system temp dir).
//   Engine: SRC=<repo root with mods/pawaudio.js> (default this repo). The celesta and sleigh voices are on main since the Winter Market
//   (v2.18.4); when SRC's copy has no EP.sleigh (marketing/launch before main is merged in) the script reads origin/main's with git.
const fs = require('fs'), path = require('path'), cp = require('child_process'), os = require('os');
const ROOT = path.join(__dirname, '..', '..', '..');
const PROG = ['Fmaj9', 'Bbmaj9', 'Am9', 'D9', 'Gm9', 'C13', 'Fmaj9', 'C9sus', 'Bbmaj9', 'C13', 'Am9', 'Dm9', 'G9', 'Gm9', 'C9sus', 'C13'];
// The tune: one row per bar, [step16, midi, lenSteps, vel]. F5 = 77, A5 = 81, C6 = 84, F6 = 89. Odd steps are swung by the engine.
const MEL = [
  [[0, 81, 2, 0.85], [2, 84, 2, 0.7], [4, 89, 3, 0.9], [7, 88, 1, 0.6], [8, 84, 4, 0.85], [12, 81, 2, 0.75], [14, 84, 2, 0.7]],   // Fmaj9
  [[0, 86, 6, 0.9], [6, 84, 2, 0.65], [8, 81, 4, 0.8], [12, 77, 4, 0.75]],                                                       // Bbmaj9
  [[0, 79, 2, 0.8], [2, 81, 2, 0.7], [4, 84, 4, 0.85], [8, 88, 6, 0.9], [14, 86, 2, 0.65]],                                      // Am9
  [[0, 84, 3, 0.85], [3, 81, 1, 0.6], [4, 78, 4, 0.85], [8, 81, 2, 0.7], [10, 84, 2, 0.75], [12, 88, 4, 0.85]],                  // D9
  [[0, 82, 2, 0.85], [2, 86, 2, 0.7], [4, 91, 3, 0.9], [7, 89, 1, 0.6], [8, 86, 4, 0.85], [12, 82, 2, 0.75], [14, 86, 2, 0.7]],   // Gm9
  [[0, 88, 6, 0.9], [6, 86, 2, 0.65], [8, 82, 4, 0.8], [12, 79, 4, 0.75]],                                                       // C13
  [[0, 81, 2, 0.85], [2, 84, 2, 0.7], [4, 89, 4, 0.9], [8, 88, 2, 0.7], [10, 84, 2, 0.7], [12, 81, 4, 0.8]],                     // Fmaj9
  [[0, 79, 8, 0.85], [10, 81, 2, 0.6], [12, 82, 2, 0.65], [14, 84, 2, 0.7]],                                                     // C9sus
  [[0, 86, 6, 0.9], [6, 89, 2, 0.7], [8, 86, 2, 0.7], [10, 84, 2, 0.7], [12, 81, 4, 0.8]],                                       // Bbmaj9
  [[0, 79, 4, 0.85], [4, 82, 2, 0.7], [6, 81, 2, 0.65], [8, 79, 4, 0.8], [12, 76, 2, 0.7], [14, 79, 2, 0.7]],                    // C13
  [[0, 84, 6, 0.9], [6, 88, 2, 0.7], [8, 86, 2, 0.7], [10, 84, 2, 0.7], [12, 81, 4, 0.8]],                                       // Am9
  [[0, 77, 6, 0.85], [6, 81, 2, 0.65], [8, 84, 4, 0.8], [12, 86, 4, 0.8]],                                                       // Dm9
  [[0, 83, 6, 0.9], [6, 86, 2, 0.7], [8, 89, 4, 0.85], [12, 86, 2, 0.7], [14, 83, 2, 0.7]],                                      // G9
  [[0, 82, 6, 0.85], [6, 81, 2, 0.65], [8, 79, 4, 0.8], [12, 86, 4, 0.8]],                                                       // Gm9
  [[0, 84, 4, 0.85], [4, 89, 4, 0.9], [8, 86, 4, 0.8], [12, 84, 2, 0.7], [14, 82, 2, 0.65]],                                     // C9sus
  [[0, 88, 4, 0.85], [4, 86, 2, 0.7], [6, 84, 2, 0.7], [8, 82, 2, 0.7], [10, 81, 2, 0.7], [12, 79, 4, 0.8]]                      // C13
];
// Three variants of the same tune and form (the chosen one is DEFAULT; the doc lists all three).
const VARIANTS = {
  cocoa: { seed: 20261125, bpm: 86, swing: 0.62, keys: 'comp', bass: 'xmas', kick: 'std', snare: 'ghost', brush: false, hats: 'jingle', top: 'celesta',
    dbl: true, roll: true, chime: true, cut: 7200, drumCut: 6500, fire: 0.85, wind: 0, weather: 'sunny',
    L: { keys: 0.8, pad: 0.3, bass: 0.8, kick: 0.75, snare: 0.5, hats: 1.4, top: 1.8, crackle: 1.2 } },
  sleigh: { seed: 20261226, bpm: 88, swing: 0.6, keys: 'bouncy', bass: 'bouncy', kick: 'bouncy', snare: 'ghost', brush: false, hats: 'jingle', top: 'celesta',
    dbl: true, roll: true, chime: true, cut: 7800, drumCut: 7000, fire: 0.7, wind: 0, weather: 'sunny',
    L: { keys: 0.75, pad: 0.2, bass: 0.75, kick: 0.8, snare: 0.55, hats: 1.5, top: 1.8, crackle: 1.1 } },
  musicbox: { seed: 20261201, bpm: 84, swing: 0.64, keys: 'comp', bass: 'full', kick: 'lazy', snare: 'std', brush: true, hats: 'sleigh', top: 'box',
    dbl: false, roll: false, chime: true, cut: 6400, drumCut: 6000, fire: 0.9, wind: 0.3, weather: 'snow',
    L: { keys: 0.85, pad: 0.4, bass: 0.8, kick: 0.75, snare: 0.5, hats: 1.3, top: 1.9, crackle: 1.3 } }
};
const DEFAULT = 'sleigh';   // the owner's preview: the most joyful and Christmassy of the three (docs/marketing/CHRISTMAS_LOFI.md)

function engineSource(SRC) {
  let s = fs.readFileSync(path.join(SRC, 'mods', 'pawaudio.js'), 'utf8');
  if (!s.includes('EP.sleigh')) {
    try { s = cp.execFileSync('git', ['-C', SRC, 'show', 'origin/main:mods/pawaudio.js'], { encoding: 'utf8', maxBuffer: 1 << 26 }); }
    catch (e) { throw new Error('no celesta / sleigh voices in ' + SRC + '/mods/pawaudio.js and origin/main could not be read: set SRC to a main worktree'); }
    if (!s.includes('EP.sleigh')) throw new Error('origin/main pawaudio.js has no EP.sleigh');
  }
  return s;
}
function xmasSource(SRC, name) {
  const V = VARIANTS[name || DEFAULT]; if (!V) throw new Error('no variant ' + name);
  const PATCH = [
    ["var PLACES = ['title',", "var PLACES = ['xmaslofi', 'title',"],
    ['var INDOOR = { nursery: 1,', 'var INDOOR = { xmaslofi: 1, nursery: 1,'],
    ["'vet', 'snowmkt'];", "'vet', 'snowmkt', 'fire'];"],
    ['var INSIDE_AMB = { window: 1,', 'var INSIDE_AMB = { fire: 1, window: 1,'],
    ['var AMB_CONT = { rain: 1,', 'var AMB_CONT = { fire: 1, rain: 1,'],
    // two bright secondary dominants, rootless like the engine's own voicings: D9 = F# C E A, G9 = B D F A
    ['Bbm6: { r: 46, v: [56, 61, 65, 67] }', 'Bbm6: { r: 46, v: [56, 61, 65, 67] },\n    D9: { r: 38, v: [54, 60, 64, 69] },\n    G9: { r: 43, v: [59, 62, 65, 69] }'],
    ['E.pi = bar % 8; E.bar = bar;', 'E.pi = bar % pr.length; E.bar = bar;'],
    ['E.nextChord = CH[pr[(bar + 1) % 8]];', 'E.nextChord = CH[pr[(bar + 1) % pr.length]];'],
    ["if (P.hats === 'sleigh')", "if (P.hats === 'sleigh' || P.hats === 'jingle')"],
    ['salon: 0, vet: 0, snowmkt: 0 }', 'salon: 0, vet: 0, snowmkt: 0, fire: 0 }'],
    ["if (place === 'salon') a.salon = 0.7;", `if (place === 'salon') a.salon = 0.7;
    if (place === 'xmaslofi') { a.fire = ${V.fire}; a.wind = Math.min(a.wind, ${V.wind}); }`],
    // the fireplace bed: a low flickering roar and a breath of hiss
    ["} else if (name === 'market') {", `} else if (name === 'fire') {
      var fg = G(0.17); chain(noise(E.pink), F('lowpass', 360, 0.6), fg, out);
      var fl = G(0.06); osc(0.23).connect(fl); fl.connect(fg.gain); var fl2 = G(0.035); osc(0.61).connect(fl2); fl2.connect(fg.gain);
      chain(noise(E.white), F('bandpass', 1900, 0.6), G(0.004), out);
    } else if (name === 'market') {`],
    // the fireplace events: small wood pops (often in little clusters) and now and then a bigger snap with a soft thump
    ['EP.ambEvents = function', `EP.firePop = function (t) {
    var n = chance(0.3) ? 2 + ((Math.random() * 3) | 0) : 1, d = this.evDest('fire');
    for (var i = 0; i < n; i++) {
      var tt = t + i * rnd(0.012, 0.05);
      if (!this.alloc(tt, 0.06, 1, -1)) return;
      var s = this.ac.createBufferSource(), bp = this.F('bandpass', rnd(700, 2600), rnd(0.8, 1.6)), g = this.ac.createGain();
      s.buffer = this.white; g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(rnd(0.05, 0.16), tt + 0.0008); g.gain.setTargetAtTime(0, tt + 0.001, rnd(0.004, 0.012));
      s.connect(bp); bp.connect(g); g.connect(d); s.start(tt, Math.random() * 1.5); s.stop(tt + 0.07);
    }
  };
  EP.fireSnap = function (t) {
    if (!this.alloc(t, 0.2, 2, -1)) return;
    var ac = this.ac, d = this.evDest('fire'), s = ac.createBufferSource(), bp = this.F('bandpass', rnd(1000, 1600), 0.7), g = ac.createGain(), o = this.O('sine', 140), og = ac.createGain();
    s.buffer = this.white; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(rnd(0.16, 0.26), t + 0.001); g.gain.setTargetAtTime(0, t + 0.002, 0.018);
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.06);
    og.gain.setValueAtTime(0, t); og.gain.linearRampToValueAtTime(0.05, t + 0.003); og.gain.setTargetAtTime(0, t + 0.005, 0.03);
    s.connect(bp); bp.connect(g); g.connect(d); o.connect(og); og.connect(d); s.start(t, Math.random() * 1.5); s.stop(t + 0.15); o.start(t); o.stop(t + 0.2);
  };
  // two bars of the tune at a time; from the 2nd pass a soft glock doubles the long notes an octave up; a sleigh shake into bars 8 and 16
  EP.planMel = function (start) {
    var E = this, instr = E.top || 'celesta', bar0 = start >> 4;
    for (var k = 0; k < 2; k++) {
      var bar = bar0 + k, pi = bar % XMEL.length, pass = Math.floor(bar / XMEL.length), at = start + k * 16;
      XMEL[pi].forEach(function (n) {
        (E.topQ[at + n[0]] = E.topQ[at + n[0]] || []).push({ m: n[1], len: n[2], vel: n[3], instr: instr });
        if (${V.dbl} && pass >= 1 && n[2] >= 4) E.topQ[at + n[0]].push({ m: n[1] + 12, len: n[2], vel: n[3] * 0.32, instr: 'box' });
      });
      if (${V.chime} && (pi === 0 || pi === 8) && bar > 0) (E.topQ[at] = E.topQ[at] || []).push({ m: 93, len: 8, vel: 0.22, instr: 'chime' });
      if (${V.roll} && (pi === 7 || pi === 15)) for (var s = 8; s < 16; s++) (E.topQ[at + s] = E.topQ[at + s] || []).push({ m: 0, len: 1, vel: 0.35 + 0.07 * (s - 8), instr: 'jingle' });
    }
    E.topBusy = start + 32;
  };
  EP.ambEvents = function`],
    ['if (a.snowmkt > 0) times(0.35, this.crunch);', 'if (a.snowmkt > 0) times(0.35, this.crunch);\n    if (a.fire > 0) { times(5, this.firePop); times(0.22, this.fireSnap); }'],
    // the composed tune instead of the generative motifs (only for a variant with v.mel)
    ["if (instr !== 'bubble' && v.themeChance > 0", "if (v.mel) { E.planMel(start); return; }\n    if (instr !== 'bubble' && v.themeChance > 0"],
    ['var n = q[i], mm = fit(pentaMidi(n.i), ch);', 'var n = q[i], mm = n.m != null ? n.m : fit(pentaMidi(n.i), ch);'],
    ["if (instr === 'celesta') this.celesta(dest, t, m, dur, vel);",
      "if (instr === 'jingle') this.sleigh(t, vel);\n    else if (instr === 'chime') this.sbell(dest, t, m, vel, 'glit');\n    else if (instr === 'celesta') this.celesta(dest, t, m, dur, vel);"],
    ['var KEEP_PROG = {', `PROGS.xmas = ${JSON.stringify(PROG)};
  var XMEL = ${JSON.stringify(MEL)};
  HATS.jingle = [[0, 0.55], [2, 0.8], [3, 0.3], [4, 0.55], [6, 0.85], [8, 0.55], [10, 0.8], [11, 0.3], [12, 0.55], [14, 0.9], [15, 0.4]];
  BASS.xmas = [[0, 0, 5, 1], [6, 'f', 2, 0.7], [8, 0, 4, 0.85], [12, 'f', 2, 0.6], [14, 'A', 2, 0.7]];
  BASE.xmaslofi = V({ bpm: ${V.bpm}, swing: ${V.swing}, prog: 'xmas', keys: '${V.keys}', bass: '${V.bass}', kick: '${V.kick}', snare: '${V.snare}', hats: '${V.hats}',
    top: '${V.top}', dens: 0.5, themeChance: 0, cut: ${V.cut}, drumCut: ${V.drumCut}, brush: ${V.brush}, mel: 1, L: ${JSON.stringify(V.L)} });
  PLACE_BASE.xmaslofi = 'xmaslofi';
  var KEEP_PROG = { xmaslofi: 1,`]];
  let s = engineSource(SRC);
  for (const [a, b] of PATCH) { if (s.split(a).length !== 2) throw new Error('pawaudio.js changed: ' + a.slice(0, 40)); s = s.replace(a, () => b); }
  const seed = `(function(){var a=${V.seed}>>>0;Math.random=function(){a=(a+0x6D2B79F5)>>>0;var t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};})();\n`;
  return seed + s;
}

const loud = (f) => { const r = cp.spawnSync('ffmpeg', ['-hide_banner', '-i', f, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' }).stderr;
  return JSON.parse(r.slice(r.lastIndexOf('{'))); };

// render one variant, then master: fade in 2 s and out 5 s, gain to -16 LUFS integrated, a gentle limiter (-2 dBFS), MP3 256k
async function xmasPreview({ browser, SRC = ROOT, name = DEFAULT, seconds = 60, out, keepWav = false }) {
  const V = VARIANTS[name], work = path.join(process.env.WORK || os.tmpdir(), 'xmas_lofi_' + name); fs.mkdirSync(work, { recursive: true });
  const raw = path.join(work, 'raw.wav'), faded = path.join(work, 'faded.wav'), mast = path.join(work, 'master.wav');
  const p = await browser.newPage(); await p.goto('about:blank'); await p.addScriptTag({ content: xmasSource(SRC, name) });
  const r = await p.evaluate(async ([sec, w]) => { const x = await window.PawAudio._render({ seconds: sec, wav: true, vols: { master: 0.7, music: 0.85, ambience: 0.4 },
    segments: [{ at: 0, ctx: { place: 'xmaslofi', time: 'day', weather: w } }] });
    return { wav: x.wav, d: window.PawAudio.describe({ place: 'xmaslofi', time: 'day', weather: w }), peak: x.peak, dropped: x.dropped }; }, [seconds + 0.5, V.weather]);
  await p.close(); fs.writeFileSync(raw, Buffer.from(r.wav, 'base64'));
  if (r.d.bpm !== V.bpm || r.d.prog !== 'xmas' || r.d.top !== V.top) throw new Error('not the xmaslofi variant: ' + JSON.stringify(r.d));
  console.log(name + ':', r.d.label, '|', r.d.bpm, 'bpm, fire', r.d.ambience.fire, '| peak', r.peak, '| dropped voices', r.dropped);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', raw, '-af', `atrim=0:${seconds},afade=t=in:st=0:d=2,afade=t=out:st=${seconds - 5}:d=5`, '-c:a', 'pcm_s16le', faded]);
  const m = loud(faded), gain = -16 - +m.input_i;
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', faded, '-af', `volume=${gain.toFixed(2)}dB,alimiter=limit=${Math.pow(10, -2.0 / 20).toFixed(4)}:attack=5:release=80:level=false`, '-c:a', 'pcm_s16le', mast]);
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mast, '-c:a', 'libmp3lame', '-b:a', '256k', '-id3v2_version', '3',
    '-metadata', 'title=Doodle Doggo - Christmas lo-fi (preview, ' + name + ')', '-metadata', 'artist=Doodle Doggo', out]);
  const f = loud(out);
  console.log(name + ': wrote', out, '- I', f.input_i, 'LUFS, TP', f.input_tp, 'dBTP, LRA', f.input_lra, '(before: I', m.input_i, 'TP', m.input_tp + ')');
  if (keepWav) fs.copyFileSync(mast, out.replace(/\.mp3$/, '.wav'));
  return { out, I: +f.input_i, TP: +f.input_tp, LRA: +f.input_lra, work };
}
module.exports = { xmasSource, xmasPreview, PROG, MEL, VARIANTS, DEFAULT };

if (require.main === module) (async () => {
  const { chromium } = require('playwright');
  const SRC = path.resolve(process.env.SRC || ROOT), out = path.resolve(process.argv[2] || 'christmas-lofi-preview.mp3');
  const name = process.argv[3] || DEFAULT, sec = +process.argv[4] || 60;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  if (process.env.ALL) for (const n of Object.keys(VARIANTS)) await xmasPreview({ browser: b, SRC, name: n, seconds: sec, out: path.join(path.dirname(out), 'christmas-lofi-' + n + '.mp3'), keepWav: !!process.env.WAV });
  else await xmasPreview({ browser: b, SRC, name, seconds: sec, out, keepWav: !!process.env.WAV });
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
