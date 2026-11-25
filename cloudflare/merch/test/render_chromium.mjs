// Part 4's Chromium truth test (docs/design/merch/PART4.md), run on its own because it needs Playwright's Chromium:
//   NODE_PATH=$(npm root -g) node cloudflare/merch/test/render_chromium.mjs        (DOGS=akita,dane,golden to pick the sample dogs)
// A fake BROWSER binding backed by local headless Chromium opens the REAL released print page (site/merch/print/<ART_VER>/, served on localhost)
// with exactly the options render.js sends (viewport, deviceScaleFactor, omitBackground, waitForSelector '#o svg' and its timeout), through
// render.screenshot(), for each sample dog's navy tee, white tee and mug. Checks: exact pixel size, the page's READY title for that file, tee corners
// clear, every tee alpha 0 or 255 from both renderers (part 9 m6), the mug's name strip opaque, and every
// file from both renderers passes the print file check (render.pngCheck; part 4 review finding 1); then the resvg fallback (the real MerchRender
// object, render.resvg()) against Chromium: mean difference per channel over white and over black under 0.2 (RENDER_FREE.md 3 measured
// 0.025-0.11) AND at most MATCH.far_px pixels more than 32 apart (render.js MATCH; review finding 2: the mean alone cannot see a missing body part).
// Self-checks: the first tee's fallback with one real shape left out fails the match; a tee shot without omitBackground fails the file check.
// Nothing reaches the network (127.0.0.1 only). Exit 1 on any failure.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import * as render from '../render.js';
import { MerchRender, drawPng, newResvg } from '../resvg.js';
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
const titles = []; let NO_OMIT = false; // self-check 2: as if Browser Run dropped omitBackground
// the fake binding: Browser Run's quickAction('screenshot') on local Chromium, answering like Cloudflare (a Response, X-Browser-Ms-Used)
const BROWSER = {
  async quickAction(kind, o) {
    if (kind !== 'screenshot') throw new Error('kind ' + kind);
    const t0 = Date.now(), ctx = await browser.newContext({ viewport: { width: o.viewport.width, height: o.viewport.height }, deviceScaleFactor: o.viewport.deviceScaleFactor });
    try {
      const pg = await ctx.newPage(); await pg.goto(o.url); await pg.waitForSelector(o.waitForSelector.selector, { timeout: o.waitForSelector.timeout || 30e3 });
      titles.push(await pg.title());
      const png = await pg.screenshot({ type: 'png', omitBackground: !!(o.screenshotOptions && o.screenshotOptions.omitBackground) && !NO_OMIT });
      return new Response(png, { headers: { 'content-type': 'image/png', 'X-Browser-Ms-Used': String(Date.now() - t0) } });
    } finally { await ctx.close(); }
  }
};
const env = { BROWSER, MERCH_PUBLIC_URL: BASE, PAWPRINT: PP, RESVG_WASM: new WebAssembly.Module(fs.readFileSync(path.join(ROOT, 'cloudflare', 'merch', 'vendor', 'resvg-wasm', 'index_bg.wasm'))) };
env.RENDER = namespace(MerchRender, env);
const corner = (X) => [[0, 0], [X.w - 1, 0], [0, X.h - 1], [X.w - 1, X.h - 1]].map(([x, y]) => X.data[(y * X.w + x) * 4 + 3]);
const SIZE = { tee: [4500, 5400], mug: [2700, 1050] }, WANT = { tee: { w: 4500, h: 5400 }, mug: { w: 2700, h: 1050 } };
const both = (m) => m.mean_white < render.MATCH.mean && m.mean_black < render.MATCH.mean;
const fmt = (m, product) => 'mean ' + m.mean_white.toFixed(3) + ' over white, ' + m.mean_black.toFixed(3) + ' over black (< ' + render.MATCH.mean + '), ' + m.far_px + ' px more than ' + render.MATCH.far + ' apart (<= ' + render.MATCH.far_px[product] + ')';
let tee0 = null; // the first tee: self-check 1

console.log('--- part 4: Chromium truth (' + PP.ART_VER + ', print page from site/merch/print/)');
for (const id of (process.env.DOGS || 'akita,dane,golden').split(',')) for (const [product, col] of [['tee', 'navy'], ['tee', 'white'], ['mug', 'white']]) {
  const d = SAMPLES.find((x) => x.id === id); const tag = id + ' ' + product + (product === 'tee' ? ' ' + col : ''); if (!d) { say(false, 'no sample dog ' + id); continue; }
  const url = BASE + '/merch/print/' + PP.ART_VER + '/' + PP.printHash(d.r, { product, colour: col, pose: d.pose });
  const t0 = Date.now(), shot = await render.screenshot(env, product, url), wall = Date.now() - t0;
  if (!shot.ok) { say(false, tag + ': ' + shot.kind + ' ' + shot.why); continue; }
  const sz = pngSize(shot.png), title = titles[titles.length - 1] || '';
  say(sz && sz.w === SIZE[product][0] && sz.h === SIZE[product][1] && title.startsWith('READY ' + product + '-') && title.includes(SIZE[product].join('x')), tag + ': Chromium ' + sz.w + 'x' + sz.h + ', "' + title + '", ' + shot.ms + ' ms browser, ' + Math.round(shot.png.length / 1024) + ' KB');
  const C = readPNG(Buffer.from(shot.png)), cc = corner(C);
  say(product === 'tee' ? cc.every((a) => a === 0) : cc[2] === 255 && cc[3] === 255, tag + ': corners alpha ' + cc.join(',') + (product === 'tee' ? ' (clear)' : ' (the name strip opaque at the bottom)'));
  const cw = await render.pngCheck(product, shot.png, WANT[product]); say(!cw, tag + ': the Chromium file passes the print file check (colour type ' + shot.png[25] + ')' + (cw ? ': ' + cw : ''));
  const t1 = Date.now(), fb = await render.resvg(env, product, url), fwall = Date.now() - t1;
  if (!fb.ok) { say(false, tag + ' resvg: ' + fb.why); continue; }
  const rw = await render.pngCheck(product, fb.png, WANT[product]); say(!rw, tag + ': the resvg file passes the print file check' + (rw ? ': ' + rw : ''));
  const B = readPNG(Buffer.from(fb.png)); if (B.w !== C.w || B.h !== C.h) { say(false, tag + ' resvg size ' + B.w + 'x' + B.h); continue; }
  const m = render.matchPx(B, C);
  say(render.matchOk(m, product), tag + ': resvg fallback (' + fwall + ' ms, ' + Math.round(fb.png.length / 1024) + ' KB) against Chromium: ' + fmt(m, product) + '; Chromium wall ' + wall + ' ms');
  if (product === 'tee') { // part 9 art review m6: every tee file, white too, has only clear or opaque pixels, from both renderers
    const soft = (X) => { let n = 0; for (let k = 3; k < X.data.length; k += 4) if (X.data[k] && X.data[k] < 255) n++; return n; }, sc = soft(C), sb = soft(B);
    say(sc === 0 && sb === 0, tag + ': alpha only 0 or 255 (soft pixels: Chromium ' + sc + ', resvg ' + sb + ')');
  }
  if (product === 'tee' && !tee0) tee0 = { id, url, C };
}
// self-check 1 (review finding 2): the first tee's fallback with ONE shape of the dog left out. A quick 1/5-scale pass finds the shapes whose loss
// changes about 10,000 pixels or more; the 6 the mean sees least are drawn at full size, and each must fail the match against Chromium, at least
// one while the mean alone passes (measured on the akita: a crayon stroke of 38,252 pixels at mean 0.188). Smaller losses are not claimed (an
// eye dot is about 5,000 pixels, the limit itself)
if (tee0) {
  const R = await newResvg(env), p = PP.printFromHash(tee0.url.slice(tee0.url.indexOf('#')));
  const small = (svg) => { const r = new R.Resvg(svg, { fitTo: { mode: 'zoom', value: 0.2 }, font: { loadSystemFonts: false } }), img = r.render(), px = img.pixels.slice(); img.free(); r.free(); return px; };
  const base = small(p.svg), i = p.svg.indexOf('<svg x='), art = p.svg.slice(i, p.svg.indexOf('</svg>', i));
  const shapes = Array.from(art.matchAll(/<(path|ellipse|circle|rect|polygon|polyline|line)\b[^>]*\/>/g), (x) => x[0]), cand = [];
  for (const shape of shapes) {
    const q = small(p.svg.replace(shape, '')); let far = 0, sum = 0;
    for (let k = 0; k < q.length; k += 4) { let f = false; for (let c = 0; c < 4; c++) { const dd = Math.abs(q[k + c] - base[k + c]); sum += dd; if (dd > render.MATCH.far) f = true; } if (f) far++; }
    if (far * 25 >= 10000) cand.push({ shape, mean: sum / q.length });
  }
  cand.sort((a, b) => a.mean - b.mean);
  let caught = 0, meanMiss = 0, worst = null; const pick = cand.slice(0, 6);
  for (const c of pick) {
    const m = render.matchPx(readPNG(Buffer.from(await drawPng(R, PP, p.svg.replace(c.shape, ''), 12))), tee0.C);
    if (!render.matchOk(m, 'tee')) caught++; else say(false, tee0.id + ' tee without ' + c.shape.replace(/d="[^"]*"/, 'd=".."').slice(0, 80) + ': the match PASSES: ' + fmt(m, 'tee'));
    if (both(m)) { meanMiss++; if (!worst || m.far_px < worst.far_px) worst = m; }
  }
  say(pick.length === 6 && caught === pick.length && meanMiss > 0, tee0.id + ' tee, ' + shapes.length + ' shapes, ' + cand.length + ' whose loss changes about 10,000+ pixels: the ' + pick.length + ' the mean sees least each fail the match when left out, ' + meanMiss + ' of them while the mean alone passes' + (worst ? ' (closest: ' + fmt(worst, 'tee') + ')' : ''));
}
// self-check 2 (review finding 1): a tee shot without omitBackground (an opaque picture) fails the print file check
{
  const d = SAMPLES.find((x) => x.id === (process.env.DOGS || 'akita').split(',')[0]) || SAMPLES[0];
  NO_OMIT = true; const s = await render.screenshot(env, 'tee', BASE + '/merch/print/' + PP.ART_VER + '/' + PP.printHash(d.r, { product: 'tee', colour: 'navy', pose: d.pose })); NO_OMIT = false;
  const why = s.ok ? await render.pngCheck('tee', s.png, WANT.tee) : 'no shot: ' + s.why;
  say(why === 'tee_top' || /^type /.test(why || ''), d.id + ' tee without omitBackground (colour type ' + (s.png ? s.png[25] : '-') + '): the print file check refuses it: ' + why);
}
await browser.close(); srv.close();
console.log(fails ? fails + ' FAILED' : 'ALL OK');
process.exit(fails ? 1 : 0);
