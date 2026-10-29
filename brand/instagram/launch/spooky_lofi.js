// A Halloween lo-fi mood for the Reels (owner, 30 Oct 2026: "Halloween type lofi beat"), made from the game's own music engine
// (mods/pawaudio.js) in a copy for the Reel scripts only; the game's music does not change. It adds one place, 'spooky': the engine's
// dark D minor changes (Dm9, Bbmaj9, Gm9, A7b13, Bbm6) that the game only plays at night without drums, here with a lazy swung lo-fi
// beat, a warm full bass, a music-box topline, a slow pad and extra vinyl crackle, 80 bpm.
//   const { spookySource } = require('../spooky_lofi.js'); await page.addScriptTag({ content: spookySource(ROOT) });
//   then PawAudio._render({ segments: [{ at: 0, ctx: { place: 'spooky', time: 'day' } }], ... })  (time 'day': the engine's night mode would drop the drums)
//   Preview: NODE_PATH=$(npm root -g) node brand/instagram/launch/spooky_lofi.js <out.wav> [seconds]
const fs = require('fs'), path = require('path');
const ANCHOR = 'var KEEP_PROG = {';
function spookySource(ROOT) {
  let s = fs.readFileSync(path.join(ROOT, 'mods', 'pawaudio.js'), 'utf8');
  if (!s.includes(ANCHOR) || !s.includes("var PLACES = ['title',")) throw new Error('pawaudio.js changed');
  s = s.replace("var PLACES = ['title',", "var PLACES = ['spooky', 'title',");
  return s.replace(ANCHOR, `BASE.spooky = V({ bpm: 80, swing: 0.62, prog: 'dark', keys: 'comp', bass: 'full', kick: 'lazy', snare: 'std', hats: 'std', top: 'box',
    dens: 0.5, themeChance: 0, cut: 4300, brush: false, L: { keys: 0.85, pad: 0.4, bass: 0.85, kick: 0.8, snare: 0.6, hats: 0.5, top: 0.8, crackle: 1.3 } });
  PLACE_BASE.spooky = 'spooky';
  ` + ANCHOR + 'spooky: 1, ');
}
module.exports = { spookySource };

if (require.main === module) (async () => {
  const { chromium } = require('playwright');
  const ROOT = path.join(__dirname, '..', '..', '..'), out = path.resolve(process.argv[2] || 'spooky.wav'), sec = +process.argv[3] || 20;
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--autoplay-policy=no-user-gesture-required'] });
  const p = await b.newPage(); await p.goto('about:blank'); await p.addScriptTag({ content: spookySource(ROOT) });
  const r = await p.evaluate(async (s) => { const x = await window.PawAudio._render({ seconds: s, wav: true, vols: { master: 0.9, music: 0.85, ambience: 0 },
    segments: [{ at: 0, ctx: { place: 'spooky', time: 'day', weather: 'sunny' } }] }); return { wav: x.wav, variants: x.variants, peak: x.peak, rms: x.rms }; }, sec);
  fs.writeFileSync(out, Buffer.from(r.wav, 'base64')); console.log('wrote', out, JSON.stringify(r.variants), 'peak', r.peak, 'rms', r.rms); await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
