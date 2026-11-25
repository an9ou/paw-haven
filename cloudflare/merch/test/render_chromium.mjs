// Part 4's Chromium truth test (docs/design/merch/PART4.md), run on its own because it needs Playwright's Chromium:
//   NODE_PATH=$(npm root -g) node cloudflare/merch/test/render_chromium.mjs        (DOGS=akita,dane,golden to pick the sample dogs)
// A fake BROWSER binding backed by local headless Chromium opens the REAL released print page (site/merch/print/<ART_VER>/, served on localhost)
// with exactly the options render.js sends (viewport, deviceScaleFactor, omitBackground, waitForSelector '#o svg'), through render.screenshot().
// Checks: exact pixel size, the page's READY title for that file, tee corners clear, the mug's name strip opaque; then the resvg fallback
// (the real MerchRender object, render.resvg()) against Chromium: mean difference per channel over white and over black under 0.2
// (RENDER_FREE.md 3 measured 0.025-0.11). Nothing reaches the network (127.0.0.1 only). Exit 1 on any failure.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as render from '../render.js';
import { MerchRender } from '../resvg.js';
import { namespace } from './fakes.mjs';
import { pngSize } from '../util.js';

const require = createRequire(import.meta.url);
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const reqG = (m) => { for (const r of (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)) { try { return require(path.join(r, m)); } catch (e) { /* next */ } } return require(m); };
const { chromium } = reqG('playwright');
const PP = require(path.join(ROOT, 'merch', 'dist', 'pawprint.js')), SAMPLES = require(path.join(ROOT, 'merch', 'sample_dogs.js'))(PP), readPNG = require(path.join(ROOT, 'merch', 'png_lite.js'));
const DIR = path.join(ROOT, 'site', 'merch', 'print', PP.ART_VER);
if (!fs.existsSync(path.join(DIR, 'index.html'))) { console.log('FAIL no released print page for ' + PP.ART_VER + ' in site/merch/print/'); process.exit(1); }

// the print folder as the Worker serves it: /merch/print/<ART_VER>/(index.html|pawprint.js|print.js)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
const srv = http.createServer((q, s) => {
  const m = /^\/merch\/print\/([A-Za-z0-9_-]+)\/([a-z0-9_.-]*)$/.exec(new URL(q.url, 'http://x').pathname);
  const f = m && m[1] === PP.ART_VER ? path.join(DIR, m[2] || 'index.html') : null;
  if (!f || !fs.existsSync(f)) { s.writeHead(404); s.end(); return; }
  s.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); s.end(fs.readFileSync(f));
});
await new Promise((r) => srv.listen(0, '127.0.0.1', r));
const BASE = 'http://127.0.0.1:' + srv.address().port;
const browser = await chromium.launch();
let fails = 0; const say = (good, m) => { if (!good) fails++; console.log((good ? '  ok   ' : '  FAIL ') + m); };
const titles = [];
// the fake binding: Browser Run's quickAction('screenshot') on local Chromium, answering like Cloudflare (a Response, X-Browser-Ms-Used)
const BROWSER = {
  async quickAction(kind, o) {
    if (kind !== 'screenshot') throw new Error('kind ' + kind);
    const t0 = Date.now(), ctx = await browser.newContext({ viewport: { width: o.viewport.width, height: o.viewport.height }, deviceScaleFactor: o.viewport.deviceScaleFactor });
    try {
      const pg = await ctx.newPage(); await pg.goto(o.url); await pg.waitForSelector(o.waitForSelector.selector, { timeout: 30e3 });
      titles.push(await pg.title());
      const png = await pg.screenshot({ type: 'png', omitBackground: !!(o.screenshotOptions && o.screenshotOptions.omitBackground) });
      return new Response(png, { headers: { 'content-type': 'image/png', 'X-Browser-Ms-Used': String(Date.now() - t0) } });
    } finally { await ctx.close(); }
  }
};
const env = { BROWSER, MERCH_PUBLIC_URL: BASE, PAWPRINT: PP, RESVG_WASM: new WebAssembly.Module(fs.readFileSync(path.join(ROOT, 'cloudflare', 'merch', 'vendor', 'resvg-wasm', 'index_bg.wasm'))) };
env.RENDER = namespace(MerchRender, env);
const over = (X, bg) => { const o = new Float32Array(X.data.length / 4 * 3); for (let i = 0, j = 0; i < X.data.length; i += 4, j += 3) { const a = X.data[i + 3] / 255; for (let c = 0; c < 3; c++) o[j + c] = X.data[i + c] * a + bg * (1 - a); } return o; };
const mean = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };
const corner = (X) => [[0, 0], [X.w - 1, 0], [0, X.h - 1], [X.w - 1, X.h - 1]].map(([x, y]) => X.data[(y * X.w + x) * 4 + 3]);
const SIZE = { tee: [4500, 5400], mug: [2700, 1050] };

console.log('--- part 4: Chromium truth (' + PP.ART_VER + ', print page from site/merch/print/)');
for (const id of (process.env.DOGS || 'akita,dane,golden').split(',')) for (const product of ['tee', 'mug']) {
  const d = SAMPLES.find((x) => x.id === id); if (!d) { say(false, 'no sample dog ' + id); continue; }
  const url = BASE + '/merch/print/' + PP.ART_VER + '/' + PP.printHash(d.r, { product, colour: product === 'tee' ? 'navy' : 'white', pose: d.pose });
  const t0 = Date.now(), shot = await render.screenshot(env, product, url), wall = Date.now() - t0;
  if (!shot.ok) { say(false, id + ' ' + product + ': ' + shot.kind + ' ' + shot.why); continue; }
  const sz = pngSize(shot.png), title = titles[titles.length - 1] || '';
  say(sz && sz.w === SIZE[product][0] && sz.h === SIZE[product][1] && title.startsWith('READY ' + product + '-') && title.includes(SIZE[product].join('x')), id + ' ' + product + ': Chromium ' + sz.w + 'x' + sz.h + ', "' + title + '", ' + shot.ms + ' ms browser, ' + Math.round(shot.png.length / 1024) + ' KB');
  const C = readPNG(Buffer.from(shot.png)), cc = corner(C);
  say(product === 'tee' ? cc.every((a) => a === 0) : cc[2] === 255 && cc[3] === 255, id + ' ' + product + ': corners alpha ' + cc.join(',') + (product === 'tee' ? ' (clear)' : ' (the name strip opaque at the bottom)'));
  const t1 = Date.now(), fb = await render.resvg(env, product, url), fwall = Date.now() - t1;
  if (!fb.ok) { say(false, id + ' ' + product + ' resvg: ' + fb.why); continue; }
  const B = readPNG(Buffer.from(fb.png)); if (B.w !== C.w || B.h !== C.h) { say(false, id + ' ' + product + ' resvg size ' + B.w + 'x' + B.h); continue; }
  const dw = mean(over(B, 255), over(C, 255)), dk = mean(over(B, 0), over(C, 0));
  say(dw < 0.2 && dk < 0.2, id + ' ' + product + ': resvg fallback (' + fwall + ' ms, ' + Math.round(fb.png.length / 1024) + ' KB) against Chromium: mean diff ' + dw.toFixed(3) + ' over white, ' + dk.toFixed(3) + ' over black (< 0.2); Chromium wall ' + wall + ' ms');
}
await browser.close(); srv.close();
console.log(fails ? fails + ' FAILED' : 'ALL OK');
process.exit(fails ? 1 : 0);
