// Doodle Doggo load-time measurement (v2.14 PERF lane, PERF.md).
//   NODE_PATH=$(npm root -g) node tools/perf_measure.js <folder with index.html> [--runs 3] [--lang en,ja] [--net fast,slow4g] [--json out.json]
// Serves the folder over local HTTP with gzip (like GitHub Pages, itch.io and the Worker), opens it in Chromium with the Playwright
// "Pixel 7" profile and 4x CPU throttling, and records per run: the time until the title's New game button (#tNew) exists, first
// contentful paint, DOMContentLoaded and the bytes transferred (encoded, i.e. gzipped). Every run is a fresh context (empty cache).
// Network: fast = no throttling; slow4g = 1.6 Mbps down, 750 kbps up, 150 ms latency (Chrome's "Slow 4G" preset numbers).
// Google Fonts is faked so runs are repeatable: the stylesheet answers after 100 ms (fast) or 600 ms (slow4g) with a tiny @font-face
// list, and the font files from fonts.gstatic.com are refused (the page then shows the fallback fonts, as on a failed font load).
// The language fonts load as for a player (prefs.i18nFonts, see 00b_i18n.js). Prints the median of the runs per (lang, net).
const http = require('http'), fs = require('fs'), path = require('path'), zlib = require('zlib');
const { chromium, devices } = require('playwright');
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const DIR = path.resolve(argv[0] || '_site'), RUNS = +opt('--runs', 3), LANGS = opt('--lang', 'en').split(','), NETS = opt('--net', 'fast,slow4g').split(','), JSON_OUT = opt('--json', '');
const TYPES = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', css: 'text/css', json: 'application/json', svg: 'image/svg+xml', png: 'image/png', woff2: 'font/woff2', webmanifest: 'application/manifest+json' };
const GZ = new Set(['html', 'js', 'css', 'json', 'svg', 'webmanifest']);
const cache = new Map();
const server = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(DIR, p); if (!f.startsWith(DIR) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('nf'); }
  const ext = f.split('.').pop();
  let body = cache.get(f); if (!body) { body = fs.readFileSync(f); if (GZ.has(ext)) body = zlib.gzipSync(body, { level: 9 }); cache.set(f, body); }
  res.writeHead(200, Object.assign({ 'content-type': TYPES[ext] || 'application/octet-stream', 'cache-control': 'no-store', 'content-length': body.length }, GZ.has(ext) ? { 'content-encoding': 'gzip' } : {}));
  res.end(body);
});
const NET = { fast: null, slow4g: { offline: false, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8, latency: 150 } };
const median = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ args: (process.env.PAW_ARGS || '').split(' ').filter(Boolean) });
  const out = [];
  for (const lang of LANGS) for (const net of NETS) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const ctx = await browser.newContext(Object.assign({}, devices['Pixel 7'], { defaultBrowserType: undefined, locale: lang === 'en' ? 'en-US' : lang }));
      await ctx.route(/fonts\.googleapis\.com/, async (route) => { await new Promise((r) => setTimeout(r, net === 'slow4g' ? 600 : 100)); route.fulfill({ status: 200, contentType: 'text/css', body: "@font-face{font-family:'Caveat';src:url(https://fonts.gstatic.com/x.woff2)}" }); });
      await ctx.route(/fonts\.gstatic\.com/, (route) => route.abort());
      const page = await ctx.newPage();
      await page.addInitScript(() => {
        // the game skips the language fonts under automation unless prefs.i18nFonts is set (00b_i18n.js): load them, as a player's browser does
        try { if (!localStorage.getItem('pawhaven_prefs_v1')) localStorage.setItem('pawhaven_prefs_v1', '{"i18nFonts":true}'); } catch (e) { /* no storage */ }
        new MutationObserver(function () { if (!window.__tNew && document.getElementById('tNew')) window.__tNew = performance.now(); }).observe(document, { childList: true, subtree: true });
      });
      const cdp = await ctx.newCDPSession(page);
      await cdp.send('Network.enable'); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      if (NET[net]) await cdp.send('Network.emulateNetworkConditions', NET[net]);
      let bytes = 0; const files = {};
      cdp.on('Network.responseReceived', (e) => { files[e.requestId] = e.response.url; });
      cdp.on('Network.loadingFinished', (e) => { if ((files[e.requestId] || '').startsWith(base)) bytes += e.encodedDataLength; });
      await page.goto(base, { waitUntil: 'commit', timeout: 120000 });
      await page.waitForFunction(() => window.__tNew, null, { timeout: 120000, polling: 100 });
      await page.waitForTimeout(1500); // late requests (the language font, lazy files) still count toward the bytes
      const m = await page.evaluate(() => ({ tNew: window.__tNew, fcp: (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0, dcl: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart, lang: document.documentElement.lang, title: (document.getElementById('tNew') || {}).textContent }));
      m.bytes = bytes; m.list = Object.values(files).filter((u) => u.startsWith(base)).map((u) => u.slice(base.length) || '/');
      runs.push(m); await ctx.close();
    }
    const r = { lang, net, tNew: Math.round(median(runs.map((x) => x.tNew))), fcp: Math.round(median(runs.map((x) => x.fcp))), dcl: Math.round(median(runs.map((x) => x.dcl))), kb: Math.round(median(runs.map((x) => x.bytes)) / 1024), htmlLang: runs[0].lang, button: runs[0].title, files: runs[0].list };
    out.push(r);
    console.log(`${lang.padEnd(7)} ${net.padEnd(7)} #tNew ${String(r.tNew).padStart(6)} ms  FCP ${String(r.fcp).padStart(6)} ms  DCL ${String(r.dcl).padStart(6)} ms  ${String(r.kb).padStart(5)} KB  (html lang=${r.htmlLang}, "${r.button}", ${r.files.length} files: ${r.files.join(' ')})  runs: ${runs.map((x) => Math.round(x.tNew)).join(' ')}`);
  }
  await browser.close(); server.close();
  if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(out, null, 1));
})().catch((e) => { console.error(e); process.exit(1); });
