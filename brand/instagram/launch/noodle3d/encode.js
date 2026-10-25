// Encodes the 3D Noodle frames (noodle3d.py anim) into a 1080 x 1920 Reel clip with the game's own "play" music.
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/noodle3d/encode.js <framesdir> <out.mp4>
const path = require('path'), fs = require('fs'), cp = require('child_process');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const DIR = path.resolve(process.argv[2]), OUT = path.resolve(process.argv[3] || 'noodle-3d-dance.mp4'), T = 5;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.goto('about:blank'); await p.addScriptTag({ path: path.join(ROOT, 'mods', 'pawaudio.js') });
  const wav = await p.evaluate(async (secs) => (await window.PawAudio._render({ seconds: secs, wav: true, vols: { master: 0.9, music: 0.8, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'play', time: 'day', weather: 'sunny' } }], stingers: [{ at: 3.0, name: 'sparkle' }] })).wav, T + 0.5);
  await b.close();
  const mw = path.join(DIR, 'music.wav'); fs.writeFileSync(mw, Buffer.from(wav, 'base64'));
  cp.execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-framerate', '30', '-start_number', '1', '-i', path.join(DIR, 'f_%04d.png'), '-i', mw,
    '-vf', 'scale=1080:1920:flags=lanczos', '-af', `afade=t=in:d=0.15,afade=t=out:st=${T - 0.5}:d=0.5`, '-t', String(T),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-r', '30', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', OUT], { stdio: 'inherit' });
  console.log('wrote', OUT);
})().catch((e) => { console.error(e); process.exit(1); });
