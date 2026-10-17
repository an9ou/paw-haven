// Renders the Reel soundtrack with the game's own music engine (mods/pawaudio.js, PawAudio.render): original music, no licence worries.
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/reel_audio.js <out.wav>
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const out = path.resolve(process.argv[2] || 'reel-music.wav');
  const b = await chromium.launch({ executablePath: ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f)), args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.goto('about:blank'); await p.addScriptTag({ path: path.join(__dirname, '..', '..', '..', 'mods', 'pawaudio.js') });
  const r = await p.evaluate(async () => {
    const c = (place, time, weather) => ({ place, time: time || 'day', weather: weather || 'sunny' });
    const res = await window.PawAudio._render({ seconds: 30.5, wav: true, vols: { master: 0.85, music: 0.62, ambience: 0.12 },
      segments: [{ at: 0, ctx: c('title') }, { at: 3.0, ctx: c('yard', 'dusk') }, { at: 8.5, ctx: c('hilltop', 'dusk') }, { at: 14.5, ctx: c('walk') }, { at: 17.5, ctx: c('garden') }, { at: 19.5, ctx: c('house') }, { at: 20.5, ctx: c('square') }, { at: 25.5, ctx: c('title') }],
      stingers: [{ at: 1.0, name: 'sparkle' }, { at: 9.6, name: 'discover' }, { at: 16.0, name: 'treasure' }, { at: 20.6, name: 'levelup' }, { at: 25.7, name: 'adopt' }] });
    return { wav: res.wav, peakDb: res.peakDb, rmsDb: res.rmsDb, clipped: res.clippedSamples, variants: res.variants };
  });
  fs.writeFileSync(out, Buffer.from(r.wav, 'base64')); console.log('wrote', out, JSON.stringify({ peakDb: r.peakDb, rmsDb: r.rmsDb, clipped: r.clipped, variants: r.variants }).slice(0, 400));
  await b.close();
})();
