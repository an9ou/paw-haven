// Renders the 30 s Reel frame by frame (30 fps, 1080 x 1920) from reel/reel.html, real gameplay clips and screenshots.
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/reel_render.js <footageDir> <shotsDir> <framesDir> <variant: play|soon> [from] [to]
const path = require('path'), fs = require('fs');
const { chromium } = require('playwright');
const [footage, shots, framesDir, variant = 'play', from = '0', to = '900'] = process.argv.slice(2);
const FPS = 30;
const load = (n) => { const d = path.join(footage, n); const ts = JSON.parse(fs.readFileSync(path.join(d, 'ts.json'))); return { d, ts: ts.map((x) => x - ts[0]) }; };
const clips = { yard: load('yard'), fuji: load('fuji'), walk: load('walk'), house: load('house') };
const pick = (name, ct) => { const c = clips[name]; let lo = 0, hi = c.ts.length - 1; ct = Math.max(0, Math.min(c.ts[hi], ct)); while (lo < hi) { const m = (lo + hi + 1) >> 1; if (c.ts[m] <= ct) lo = m; else hi = m - 1; } return 'file://' + path.join(c.d, String(lo).padStart(5, '0') + '.jpg'); };
const still = (n) => 'file://' + path.join(shots, n + '.png');
function sceneFor(t) {
  if (t >= 3.0 && t < 8.5) return [pick('yard', t - 3.0 + 1.2), null];
  if (t >= 8.5 && t < 14.5) return [pick('fuji', t - 8.5 + 0.8), null];
  if (t >= 14.5 && t < 17.5) return [pick('walk', t - 14.5 + 1.0), null];
  if (t >= 17.5 && t < 18.5) return [still('garden'), [0.0, 0.07]];
  if (t >= 18.5 && t < 19.5) return [still('kitchen'), [0.0, 0.07]];
  if (t >= 19.5 && t < 20.5) return [pick('house', t - 19.5 + 1.0), null];
  return [null, null];
}
(async () => {
  fs.mkdirSync(framesDir, { recursive: true });
  const b = await chromium.launch({ executablePath: ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f)), args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto('file://' + path.join(__dirname, 'reel', 'reel.html')); await p.waitForFunction(() => window.READY === true); await p.waitForTimeout(500);
  const t0 = Date.now();
  for (let i = +from; i < +to; i++) {
    const t = i / FPS, [src, kb] = sceneFor(t);
    await p.evaluate(([t, src, kb, mode]) => window.draw(t, src, kb, mode), [t, src, kb, variant]);
    await p.screenshot({ path: path.join(framesDir, 'f_' + String(i).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 92 });
    if (i % 60 === 0) console.log('frame', i, Math.round((Date.now() - t0) / 1000) + 's');
  }
  await b.close(); console.log('done', from, to);
})();
