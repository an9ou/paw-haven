const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e)));
  await p.goto('file://' + process.argv[2]); await p.waitForFunction(() => !!window.__econ, null, { timeout: 60000 });
  const d = await p.evaluate(() => window.__econ());
  require('fs').writeFileSync(process.argv[3], JSON.stringify(d, null, 1)); console.log('ok', Object.keys(d).length, errs.slice(0, 3));
  await b.close();
})();
