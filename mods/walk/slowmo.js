// samples the time scale to confirm the first-of-type slow motion, and the hint lead time
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: { width: 1280, height: 760 } }); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + __dirname + '/test.html?area=beach&dur=40');
  await p.addScriptTag({ path: __dirname + '/bot.js' }); await p.evaluate(() => window.__runBot(0.3, true));
  const res = await p.evaluate(() => new Promise((done) => {
    const slow = []; const firstSeen = {}; let shot = false;
    const t0 = performance.now();
    (function tick() {
      const P = window.__ctl._peek(); const now = (performance.now() - t0) / 1000;
      if (P.ts < 0.75) slow.push(+now.toFixed(1));
      const vis = [...document.querySelectorAll('.pw-hint')].filter((h) => { const r = h.getBoundingClientRect(); return r.left < 1260 && r.right > 20; });
      vis.forEach((h) => { const t = h.textContent; if (!firstSeen[t]) firstSeen[t] = { at: +now.toFixed(2), px: Math.round(parseFloat(getComputedStyle(h).fontSize)) }; });
      if (now > 22) return done({ slowSamples: [...new Set(slow)], firstSeen });
      requestAnimationFrame(tick);
    })();
  }));
  console.log(JSON.stringify(res), 'errors:', errs.length);
  await b.close();
})();
