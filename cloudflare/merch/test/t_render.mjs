// Stage 5: part 4, the real print render (docs/design/merch/PART4.md). The Browser Run binding is a fake OBJECT (env.BROWSER.quickAction, not
// RENDER_FETCH), so render.js's real path runs; the resvg fallback is the REAL MerchRender object with the vendored resvg-wasm (no fake). Rows P4-*.
// Then the same Worker in workerd (Miniflare): the MerchRender Durable Object with the wasm module, the self service binding to RenderGate.
// Rows F4-*: the part 4 review fixes (docs/reviews/MERCH_PART4_review.md, PART4.md "Review fixes"), including the cloud kit in its fake-API mode.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { T, ok, eq, world, mug, tee, PP, ROOT, MIN, HOUR, DAY } from './harness.mjs';
import { namespace, fakeBrowser, fakeStripe, fakePrintful, fakeMail, png, require } from './fakes.mjs';
import { MerchRender, drawPng, newResvg, splitBands, flatOpacity } from '../resvg.js';
import * as render from '../render.js';
import { RenderGate } from '../worker.js';
import { pngSize, nextUtcMidnight, sha256hex } from '../util.js';

const readPNG = require(path.join(ROOT, 'merch', 'png_lite.js'));
const SAMPLES = require(path.join(ROOT, 'merch', 'sample_dogs.js'))(PP);
const WASM = new WebAssembly.Module(fs.readFileSync(path.join(ROOT, 'cloudflare', 'merch', 'vendor', 'resvg-wasm', 'index_bg.wasm')));
const utcDay = (t) => new Date(t).toISOString().slice(0, 10);
const BASE = 'https://merch-api.doodledoggo.app';
const linkOf = (i, product, o) => PP.printHash(SAMPLES[i].r, Object.assign({ product, colour: product === 'tee' ? 'navy' : 'white', pose: SAMPLES[i].pose }, o || {}));
const urlOf = (i, product, o) => BASE + '/merch/print/' + PP.ART_VER + '/' + linkOf(i, product, o);
const corners = (u8) => { const p = readPNG(Buffer.from(u8)), a = (x, y) => p.data[(y * p.w + x) * 4 + 3]; return [a(0, 0), a(p.w - 1, 0), a(0, p.h - 1), a(p.w - 1, p.h - 1)]; };

// a world with the real render path: no RENDER_FETCH, a fake BROWSER object, the real MerchRender (resvg-wasm) as RENDER
async function rworld(o) {
  o = o || {}; const br = fakeBrowser(); if (o.ms !== undefined) br.ms = o.ms;
  const w = await world({ t: o.t, env: Object.assign({ RENDER_FETCH: undefined, BROWSER: br, RESVG_WASM: WASM, MERCH_RENDER_TIMEOUT_MS: '10000' }, o.env || {}) });
  w.env.RENDER = namespace(MerchRender, w.env); w.br = br;
  w.meta = (k) => w.L().meta(k);
  w.l0 = (id) => w.lines(id)[0];
  return w;
}
let R0 = null; const resvgNow = async () => (R0 = R0 || await newResvg({ RESVG_WASM: WASM }));
// a Browser-Run-like answer with a REAL picture of the page asked for (drawn here with resvg: stands in for Chromium)
const realShot = (ms) => async (opts) => { const p = PP.printFromHash(opts.url.slice(opts.url.indexOf('#'))); const png = await drawPng(await resvgNow(), PP, p.svg, p.product === 'tee' ? 12 : 1); return new Response(png, { headers: { 'content-type': 'image/png', 'X-Browser-Ms-Used': String(ms || 1300) } }); };

export async function t_render() {
  console.log('--- stage 5: part 4, the real print render (fake BROWSER binding, real resvg-wasm)');

  await T('P4-shot', 'Browser Run binding: exactly the measured call (viewport, omitBackground, waitForSelector), a real PNG stored whole, X-Browser-Ms-Used booked per UTC day', async () => {
    const w = await rworld(); w.br.queue.push(realShot(1272)); const id = await w.paidOrder([mug(0)]); await w.advance(5 * MIN);
    const c = w.br.calls[0]; eq(c.kind, 'screenshot', 'quickAction kind');
    eq([c.opts.viewport, c.opts.screenshotOptions, c.opts.waitForSelector], [{ width: 2700, height: 1050, deviceScaleFactor: 1 }, { omitBackground: true }, { selector: '#o svg', timeout: 15000 }], 'the options as measured (RENDER_FREE 8), plus the 15 s wait limit (review finding 10)');
    ok(c.opts.url.startsWith(BASE + '/merch/print/' + PP.ART_VER + '/#p=') && c.opts.url.endsWith('&av=' + PP.ART_VER), 'the line’s own art folder: ' + c.opts.url.slice(0, 90));
    const l = w.l0(id); eq([l.status, l.renderer], ['drafted', 'browser'], 'rendered by the browser and drafted');
    eq(Number(w.meta('br_ms:' + utcDay(w.clock.t))), 1272, 'billed ms booked for the UTC day');
    const show = await w.admin('GET', 'order/' + id), got = await w.raw('GET', show.json.lines[0].file_url.replace(BASE, '')); const buf = new Uint8Array(await got.arrayBuffer());
    ok(got.status === 200 && buf.length === l.file_bytes && (await sha256hex(buf)) === l.file_sha, 'the stored PNG comes back byte for byte');
    const d = pngSize(buf); eq([d.w, d.h], [2700, 1050], 'exact size');
    const tw = await rworld(); tw.br.queue.push('ok'); await tw.paidOrder([tee(0)]); await tw.advance(1);
    eq(tw.br.calls[0].opts.viewport, { width: 2250, height: 2700, deviceScaleFactor: 2 }, 'the tee at 2250x2700 x2');
  });

  await T('P4-size', 'a picture of the wrong size from the browser: error, once more after 1 min, then the resvg fallback draws it (renderer resvg)', async () => {
    const w = await rworld(); w.br.queue.push('wrongsize', 'wrongsize'); const id = await w.paidOrder([mug(1)]); await w.advance(1);
    eq([w.l0(id).status, w.l0(id).tries, w.l0(id).last_error], ['queued', 1, 'png'], 'first answer refused (pngOk), retry in a minute');
    await w.advance(MIN); const l = w.l0(id); ok(['ready', 'drafted'].includes(l.status) && l.renderer === 'resvg', 'resvg made it: ' + l.status + ' ' + l.renderer);
    eq(w.br.calls.length, 2, 'the browser was asked twice');
    const f = await w.raw('GET', (await w.admin('GET', 'order/' + id)).json.lines[0].file_url.replace(BASE, '')); const buf = new Uint8Array(await f.arrayBuffer());
    ok((await w.L().pngOk('mug', buf)) && corners(buf)[2] === 255, 'a real resvg mug, exact size');
  });

  await T('P4-daily', '429 with the daily text: the resvg fallback at once; the browser is not asked again until 00:00 UTC; the owner told once', async () => {
    const w = await rworld(); w.br.queue.push('daily'); const a = await w.paidOrder([mug(0)]); await w.advance(1);
    eq([w.l0(a).renderer, w.br.calls.length], ['resvg', 1], 'renderer resvg after one browser call');
    const off = String(w.meta('br_off')).split(' '); eq([Number(off[0]), off[1]], [nextUtcMidnight(w.clock.t), 'daily'], 'out until 00:00 UTC');
    const b = await w.paidOrder([mug(2)]); await w.advance(MIN); eq([w.l0(b).renderer, w.br.calls.length], ['resvg', 1], 'the next order goes straight to resvg (no browser call)');
    await w.advance(2 * MIN); ok(w.owner(/browser_off/).length === 1 && /daily/.test(w.owner(/browser_off/)[0].text), 'the owner told once');
    w.clock.t = nextUtcMidnight(w.clock.t) + MIN; const c = await w.paidOrder([mug(3)]); await w.advance(1);
    eq([w.l0(c).renderer, w.br.calls.length], ['browser', 2], 'after 00:00 UTC the browser again');
    const t = await rworld(); t.br.queue.push('throwdaily'); const d = await t.paidOrder([mug(0)]); await t.advance(1); eq(t.l0(d).renderer, 'resvg', 'a thrown daily text counts the same');
  });

  await T('P4-rate', 'an unknown 429 is the rate limit: next try in 11 s, no hold, its text kept; 3 in a row (11 s apart) call the day out for an hour: resvg, owner told', async () => {
    const w = await rworld(); w.br.queue.push('rate'); const id = await w.paidOrder([mug(0)]); await w.advance(1);
    eq([w.l0(id).status, w.order(id).status, w.order(id).next_try_at - w.clock.t, Number(w.meta('br_rate_run'))], ['queued', 'paid', 11e3, 1], 'rate: 11 s, run 1');
    const r = await render.screenshot(Object.assign({}, w.env, { BROWSER: { quickAction: async () => new Response('Rate limit exceeded: try again in a few seconds', { status: 429 }) } }), 'mug', urlOf(0, 'mug'));
    eq([r.kind, r.why], ['rate', '429: Rate limit exceeded: try again in a few seconds'], 'the status and the text are kept for the cloud test');
    await w.advance(12e3); eq([w.l0(id).renderer, Number(w.meta('br_rate_run'))], ['browser', 0], 'then rendered, the run back to 0');
    const x = await rworld(); x.br.queue.push('rate', 'rate', 'rate'); const j = await x.paidOrder([mug(1)]);
    await x.advance(1); await x.advance(12e3); eq([x.l0(j).status, Number(x.meta('br_rate_run'))], ['queued', 2], 'two in a row');
    await x.advance(12e3); const l = x.l0(j); ok(['ready', 'drafted'].includes(l.status) && l.renderer === 'resvg', 'the third: the day is out, resvg drew it');
    const off = String(x.meta('br_off')).split(' '); eq([Number(off[0]) - x.clock.t <= HOUR, off[1]], [true, 'rate_run'], 'out for an hour at most');
    await x.advance(MIN); ok(x.owner(/browser_off/).length === 1 && /rate_run/.test(x.owner(/browser_off/)[0].text), 'owner told');
    x.clock.t += HOUR; const k = await x.paidOrder([mug(2)]); await x.advance(1); eq(x.l0(k).renderer, 'browser', 'an hour later the browser is asked again');
  });

  await T('P4-budget', 'our own budget: X-Browser-Ms-Used added up per UTC day; past MERCH_BROWSER_BUDGET_MS the day is out (resvg), the owner told once; report and nightly mail show it', async () => {
    const w = await rworld({ env: { MERCH_BROWSER_BUDGET_MS: '2000' } }); const a = await w.paidOrder([mug(0), mug(1)]); await w.advance(30e3);
    eq(w.lines(a).map((l) => l.renderer), ['browser', 'browser'], 'two browser renders'); eq(Number(w.meta('br_ms:' + utcDay(w.clock.t))), 2600, '2 x 1300 ms');
    const b = await w.paidOrder([mug(2)]); await w.advance(MIN); eq([w.l0(b).renderer, w.br.calls.length], ['resvg', 2], 'the third: over the budget, resvg, no browser call');
    await w.advance(MIN); ok(w.owner(/browser_off/).length === 1 && /budget/.test(w.owner(/browser_off/)[0].text), 'owner told once');
    const rep = await w.admin('GET', 'report'); eq([rep.json.browser.ms_today, rep.json.browser.budget_ms, rep.json.browser.off], [2600, 2000, 'budget'], 'admin report');
    await w.admin('POST', 'nightly'); ok(w.owner(/\[report\]/).some((m) => /Browser Run \(UTC day\): 3 s used of our 2 s budget/.test(m.text)), 'nightly mail line');
    const x = await rworld(); await x.init(); eq(x.L().budget(), 540e3, 'default budget 540 000 ms of the Free 600 000');
  });

  await T('P4-timeout', 'our own time limit on the browser call (MERCH_RENDER_TIMEOUT_MS; 75 s by default): an error, retried after 1 min; a binding that throws: an error with its message', async () => {
    const w = await rworld({ env: { MERCH_RENDER_TIMEOUT_MS: '120' } }); w.br.queue.push('hang'); const id = await w.paidOrder([mug(0)]); await w.advance(1);
    eq([w.l0(id).tries, w.l0(id).last_error, w.l0(id).status], [1, 'timeout', 'queued'], 'timeout: once more in a minute');
    await w.advance(MIN); eq(w.l0(id).renderer, 'browser', 'then fine');
    eq(render.TIMEOUT_MS, 75e3, 'default');
    const x = await rworld(); x.br.queue.push('throw'); const j = await x.paidOrder([mug(1)]); await x.advance(1);
    ok(x.l0(j).tries === 1 && /^threw: boom: browser went away/.test(x.l0(j).last_error), 'a throw is an error: ' + x.l0(j).last_error);
    const e = await render.screenshot(Object.assign({}, x.env, { BROWSER: { quickAction: async () => new Response('x'.repeat(500) + ' secret-looking tail', { status: 503 }) } }), 'mug', urlOf(0, 'mug'));
    ok(e.kind === 'error' && e.why.length <= 130 && /^http 503: x+$/.test(e.why), 'an unknown error keeps its status and the first 120 characters');
    const n = await render.screenshot(Object.assign({}, x.env, { BROWSER: undefined }), 'mug', urlOf(0, 'mug')); eq(n.kind, 'not_set_up', 'no binding');
  });

  await T('P4-via', 'MERCH_RENDER_VIA = "worker": the object asks the front Worker (self binding, RenderGate), which calls Browser Run and streams the answer back; the gate opens only this Worker’s print pages', async () => {
    const w = await rworld({ env: { MERCH_RENDER_VIA: 'worker' } }); w.env.SELF = { fetch: (u, i) => RenderGate.fetch(new Request(u, i), w.env) };
    w.br.queue.push(realShot(900)); const id = await w.paidOrder([mug(0)]); await w.advance(1);
    eq([w.l0(id).renderer, w.br.calls.length, Number(w.meta('br_ms:' + utcDay(w.clock.t)))], ['browser', 1, 900], 'rendered through the gate, the ms passed on');
    eq(w.br.calls[0].opts.waitForSelector, { selector: '#o svg', timeout: 15000 }, 'the same options');
    const g = (b, m) => RenderGate.fetch(new Request('https://merch-gate/shot', { method: m || 'POST', body: m === 'GET' ? undefined : JSON.stringify(b) }), w.env);
    eq((await g({ product: 'mug', url: 'https://evil.example/merch/print/' + PP.ART_VER + '/#p=x' })).status, 400, 'another origin: refused');
    eq((await g({ product: 'mug', url: BASE + '/merch/admin/report#p=x' })).status, 400, 'not a print page: refused');
    eq((await g({ product: 'mug', url: urlOf(0, 'mug') }, 'GET')).status, 404, 'GET: not found');
    w.br.queue.push('throw'); const t = await render.screenshot(w.env, 'mug', urlOf(0, 'mug')); ok(t.kind === 'error' && /^threw: boom/.test(t.why), 'a throw at the gate comes back as one: ' + t.why);
    w.br.queue.push('daily'); eq((await render.screenshot(w.env, 'mug', urlOf(0, 'mug'))).kind, 'daily', 'the daily 429 through the gate');
    w.br.queue.push('ok'); const d = await render.screenshot(w.env, 'mug', urlOf(0, 'mug'), 'direct'); ok(d.ok && w.br.calls.length === 4, 'the self-test can pick the path per call');
    ok(!render.renderReady(Object.assign({}, w.env, { SELF: undefined })) && render.renderReady(w.env), 'renderReady: the worker path needs SELF');
  });

  await T('P4-artver', 'T2.2-49 for the fallback: it has only the CURRENT PawPrint, so a line of another art_ver is refused (why art_ver), never drawn with the wrong art', async () => {
    const w = await rworld({ env: { MERCH_ART_VERS: 'pp1-0ldbuild' } }); w.br.queue.push('daily'); const id = await w.newOrder([mug(0)], 'US', { art_ver: 'pp1-0ldbuild' }); await w.pay(id); await w.advance(1);
    const l = w.l0(id); eq([l.status, l.renderer, l.last_error], ['queued', null, 'daily'], 'not drawn: waits for the browser (its own folder)');
    const r = await render.resvg(w.env, 'mug', BASE + '/merch/print/pp1-0ldbuild/' + linkOf(0, 'mug').replace(PP.ART_VER, 'pp1-0ldbuild'));
    eq([r.ok, r.kind, r.why], [false, 'error', 'art_ver'], 'resvg refuses another art_ver');
    eq((await render.resvg(w.env, 'mug', BASE + '/merch/print/pp1-0ldbuild/' + linkOf(0, 'mug'))).why, 'art_ver', 'a folder that is not the link’s av too');
    const ok2 = await render.resvg(w.env, 'mug', urlOf(0, 'mug')); ok(ok2.ok && (await w.L().pngOk('mug', ok2.png)), 'the current art_ver is drawn');
    const bad = await w.env.RENDER.get('resvg').fetch('https://merch-render/resvg', { method: 'POST', body: JSON.stringify({ hash: linkOf(0, 'mug').replace(/&av=[^&]+$/, '&av=pp1-other1'), product: 'mug' }) });
    eq([bad.status, (await bad.json()).error], [409, 'art_ver'], 'the object itself refuses it');
  });

  await T('P4-admin', 'render self-test (tools/merch.sh render-test): admin auth, one sample dog through the real path, no order; JSON with renderer, bytes, sha, size, ms, a 15-min link; 11 s apart; counts toward the budget', async () => {
    const w = await rworld(); w.br.queue.push(realShot(1300));
    eq((await w.admin('POST', 'render-test', { product: 'mug' }, 'wrong-key-0123456789')).status, 401, 'auth');
    eq((await w.admin('POST', 'render-test', { product: 'hat' })).status, 400, 'bad product');
    const a = await w.admin('POST', 'render-test', { product: 'mug', renderer: 'browser' }); const j = a.json;
    ok(a.status === 200 && j.ok && j.renderer === 'browser' && j.via === 'direct' && j.width === 2700 && j.height === 1050 && j.png_ok && /^[0-9a-f]{64}$/.test(j.sha256) && j.ms_used === 1300 && j.wall_ms >= 0 && j.art_ver === PP.ART_VER && j.dog === 'golden', JSON.stringify(j).slice(0, 300));
    eq(j.browser.ms_today, 1300, 'counts toward the day');
    const f = await w.raw('GET', j.file_url.replace(BASE, '')); const buf = new Uint8Array(await f.arrayBuffer()); ok(f.status === 200 && buf.length === j.bytes && (await sha256hex(buf)) === j.sha256, 'the signed link gives the file');
    ok(!w.q("select 1 from merch_orders").length, 'no order');
    const b = await w.admin('POST', 'render-test', { product: 'mug', renderer: 'resvg' }); ok(b.status === 429 && b.json.error === 'wait' && b.json.wait_ms > 0, '11 s apart');
    eq((await w.admin('POST', 'render-test', { product: 'mug', renderer: 'resvg', probe: true })).status, 429, 'probe is ignored without MERCH_RENDER_PROBE (never set on the real Worker)');
    w.env.MERCH_RENDER_PROBE = '1'; const pb = await w.admin('POST', 'render-test', { product: 'mug', probe: true }); ok(pb.status === 200 && pb.json.ok, 'the cloud test’s one rate probe may ask 1 s apart'); delete w.env.MERCH_RENDER_PROBE;
    const sh = (await import('node:child_process')).execFileSync('bash', [path.join(ROOT, 'tools', 'merch.sh'), 'render-test', 'tee', 'resvg'], { env: { PATH: process.env.PATH }, encoding: 'utf8' });
    ok(/DRY RUN.*POST .*\/merch\/admin\/render-test/.test(sh) && /"product": "tee", "renderer": "resvg"/.test(sh), 'tools/merch.sh render-test: ' + sh.split('\n')[1]);
    w.clock.t += 11e3; const c = await w.admin('POST', 'render-test', { product: 'tee', renderer: 'resvg', dog: 'akita' }); ok(c.json.ok && c.json.renderer === 'resvg' && c.json.width === 4500 && c.json.height === 5400 && c.json.ms_used === null, JSON.stringify(c.json).slice(0, 200));
    const tf = new Uint8Array(await (await w.raw('GET', c.json.file_url.replace(BASE, ''))).arrayBuffer()); eq(corners(tf), [0, 0, 0, 0], 'tee corners clear');
    w.clock.t += 11e3; w.br.queue.push('daily'); const d = await w.admin('POST', 'render-test', { product: 'mug', renderer: 'browser', via: 'direct' }); ok(d.json.ok === false && d.json.error.kind === 'daily' && /daily/.test(d.json.error.why), 'the classified error: ' + JSON.stringify(d.json.error));
    w.clock.t += 16 * MIN; eq((await w.raw('GET', j.file_url.replace(BASE, ''))).status, 403, 'the link ends after 15 minutes');
    await w.L().tidy(w.clock.t); ok(!w.q("select k from merch_meta where k glob 'rt:*'").length && !w.q("select 1 from merch_trash").length, 'the nightly tidy deletes the test files');
    const pr = w.env.PRINTS.get(j.key.split('~')[0]); eq((await pr.fetch('https://prints/get?key=' + encodeURIComponent(j.key))).status, 404, 'gone from MerchPrints');
  });

  await T('P4-resvg-real', 'the REAL fallback in Node: 3 sample dogs, a tee (12 bands) and a mug each, pass pngOk; tee corners clear; the mug’s name strip opaque; banded = one pass', async () => {
    const w = await rworld(); await w.init(); const times = [];
    for (const i of [0, 1, 2]) for (const product of ['tee', 'mug']) {
      const t0 = Date.now(), r = await render.resvg(w.env, product, urlOf(i, product)); times.push(product + ' ' + (Date.now() - t0) + ' ms');
      ok(r.ok && (await w.L().pngOk(product, r.png)), SAMPLES[i].id + ' ' + product + ': ' + (r.why || 'pngOk'));
      const c = corners(r.png); if (product === 'tee') eq(c, [0, 0, 0, 0], 'tee corners'); else eq([c[2], c[3]], [255, 255], 'mug bottom corners: the strip');
    }
    console.log('       resvg in Node: ' + times.join(', '));
    const p = PP.printFromHash(linkOf(3, 'tee')), R = await resvgNow(), A = readPNG(Buffer.from(await drawPng(R, PP, p.svg, 12))), B = readPNG(Buffer.from(await drawPng(R, PP, p.svg, 1)));
    let s = 0; for (let k = 0; k < A.data.length; k++) s += Math.abs(A.data[k] - B.data[k]); ok(s / A.data.length < 0.005, 'golden tee, 12 bands against one pass: mean ' + (s / A.data.length).toFixed(5));
    eq(flatOpacity('<path d="M1 2L3 4M5 6L7 8" stroke="#fff" stroke-width="2" opacity=".32"/>'), '<path d="M1 2L3 4M5 6L7 8" stroke="#fff" stroke-width="2" stroke-opacity="0.32"/>', 'opacity into the one paint');
    eq(splitBands(PP, p.svg, 12).bands.length, 12, '12 bands');
  });

  await T('P4-trap', 'a wasm trap breaks only that render: 500 from the object, the next render makes a fresh wasm instance', async () => {
    const w = await rworld(); const st = w.env.RENDER.get('resvg'); await st.fetch('https://merch-render/resvg', { method: 'POST', body: JSON.stringify({ hash: linkOf(0, 'mug'), product: 'mug' }) });
    const obj = st.obj, real = obj.R; obj.R = { Resvg: class { constructor() { throw new WebAssembly.RuntimeError('unreachable'); } } };
    const a = await st.fetch('https://merch-render/resvg', { method: 'POST', body: JSON.stringify({ hash: linkOf(0, 'mug'), product: 'mug' }) }); eq([a.status, (await a.json()).why], [500, 'unreachable'], 'the trap is an answer');
    ok(obj.R === null, 'the broken instance is dropped');
    const b = await st.fetch('https://merch-render/resvg', { method: 'POST', body: JSON.stringify({ hash: linkOf(0, 'mug'), product: 'mug' }) }); ok(b.status === 200 && obj.R && obj.R !== real, 'a fresh instance draws the next one');
    const r = await render.resvg(Object.assign({}, w.env, { MERCH_RESVG_TIMEOUT_MS: '1', RENDER: { idFromName: (n) => n, get: () => ({ fetch: () => new Promise(() => {}) }) } }), 'mug', urlOf(0, 'mug'));
    eq([r.kind, r.why], ['error', 'resvg timeout'], 'our own time limit on the fallback');
  });

  await T('P4-ready', 'renderReady: the Browser Run binding (or the test seam); the shop gate (M5) stays shut without it; nothing loads wasm at start-up', async () => {
    ok(render.renderReady({ BROWSER: { quickAction() {} } }) && render.renderReady({ RENDER_FETCH: () => {} }) && !render.renderReady({}) && !render.renderReady({ BROWSER: {} }), 'ready');
    const w = await rworld({ env: { BROWSER: undefined } }); eq((await w.call('GET', '/merch/catalog')).json.shut, true, 'no binding: the shop is shut');
    const inst = WebAssembly.instantiate, comp = WebAssembly.compile; let n = 0; WebAssembly.instantiate = (...a) => { n++; return inst(...a); }; WebAssembly.compile = (...a) => { n++; return comp(...a); };
    try {
      const m = await import('../resvg.js?startup=' + Date.now()); await import('../worker.js?startup=' + Date.now()); new m.MerchRender({ storage: {} }, {}); eq(n, 0, 'no wasm at module load or in the constructor');
      const x = await rworld(); await render.resvg(x.env, 'mug', urlOf(0, 'mug')); ok(n >= 1, 'instantiated on the first render');
    } finally { WebAssembly.instantiate = inst; WebAssembly.compile = comp; }
  });

  await fixes4();
  await miniflare4();
}

// ---------------- the part 4 review fixes (F4-*) ----------------
const WANT = { tee: { w: 4500, h: 5400 }, mug: { w: 2700, h: 1050 } };
const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));
const blank = (p) => '<svg xmlns="http://www.w3.org/2000/svg" width="' + WANT[p].w + '" height="' + WANT[p].h + '" viewBox="0 0 ' + WANT[p].w + ' ' + WANT[p].h + '"></svg>';
// RENDER that counts its calls (and can answer for the object)
const countRender = (w, answer) => { const real = w.env.RENDER, c = { n: 0 }; w.env.RENDER = { idFromName: (n) => n, get: (id) => ({ fetch: async (u, i) => { c.n++; return answer ? answer() : real.get(id).fetch(u, i); } }) }; return c; };
const layer422 = () => new Response(JSON.stringify({ error: 'layer', why: 'layer: <path> opacity crosses the band 402-948' }), { status: 422, headers: { 'content-type': 'application/json' } });
const KIT = path.join(ROOT, 'tools', 'merch_rtest.mjs');
function kitEnv(cases, extra) { const e = Object.assign({}, process.env); for (const k of ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_API_TOKEN', 'DRY_RUN', 'RTEST_GO']) delete e[k]; return Object.assign(e, { RTEST_FAKE: cases, RTEST_OUT: fs.mkdtempSync(path.join(os.tmpdir(), 'merch-rtest-t-')) }, extra || {}); }
function kit(cases, extra) { const env = kitEnv(cases, extra), r = spawnSync(process.execPath, [KIT], { env, encoding: 'utf8', timeout: 60e3 }); const rep = path.join(env.RTEST_OUT, 'rtest-report.json'); return { code: r.status, out: (r.stdout || '') + (r.stderr || ''), report: fs.existsSync(rep) ? JSON.parse(fs.readFileSync(rep, 'utf8')) : null }; }

async function fixes4() {
  console.log('--- the part 4 review fixes (F4-*)');
  const R = await resvgNow();
  const realTee = await drawPng(R, PP, PP.printFromHash(linkOf(0, 'tee')).svg, 12), realMug = await drawPng(R, PP, PP.printFromHash(linkOf(0, 'mug')).svg, 1);

  await T('F4-png', 'finding 1: the print file check: 8-bit RGBA, least size, whole to IEND, the tee’s first row clear; real files pass; an opaque RGB tee, a blank tee, a cut file fail', async () => {
    eq([await render.pngCheck('tee', realTee, WANT.tee), await render.pngCheck('mug', realMug, WANT.mug)], [null, null], 'real resvg tee and mug pass');
    eq(await render.pngCheck('tee', png(4500, 5400, 300 * 1024, { type: 2 }), WANT.tee), 'type 8/2', 'an opaque RGB tee');
    eq(await render.pngCheck('tee', png(4500, 5400, 300 * 1024, { top: 255 }), WANT.tee), 'tee_top', 'an RGBA tee whose first row is opaque (no omitBackground)');
    eq(await render.pngCheck('tee', png(4500, 5400, 300 * 1024), WANT.tee), null, 'the fake: a clear first row of the right size passes');
    const bt = await drawPng(R, PP, blank('tee'), 12), bm = await drawPng(R, PP, blank('mug'), 1);
    eq([await render.pngCheck('tee', bt, WANT.tee), await render.pngCheck('mug', bm, WANT.mug)], ['small', 'small'], 'blank prints: tee ' + bt.length + ' B, mug ' + bm.length + ' B (least ' + render.PNG_MIN.tee + ' / ' + render.PNG_MIN.mug + ')');
    eq([await render.pngCheck('tee', realTee.subarray(0, realTee.length - 1000), WANT.tee), await render.pngCheck('tee', realTee.subarray(0, realTee.length - 12), WANT.tee), await render.pngCheck('mug', realMug.subarray(0, realMug.length - 5), WANT.mug)], ['cut', 'cut', 'cut'], 'cut files (inside an IDAT, the IEND gone, half an IEND)');
    eq([await render.pngCheck('mug', realTee, WANT.mug), await render.pngCheck('mug', png(2700, 1050, 300 * 1024, { type: 2 }), WANT.mug), await render.pngCheck('tee', png(4500, 5400, 8 << 20), WANT.tee)], ['size', 'type 8/2', 'big'], 'wrong size, an RGB mug, over 7.5 MB');
    const bad = new Uint8Array(realTee); bad[33 + 8 + 2] ^= 0xff; ok((await render.pngCheck('tee', bad, WANT.tee)) !== null, 'a broken deflate stream in the first row is refused');
    // in the ledger: an opaque RGB tee from the browser is never stored; once more after a minute, then the fallback draws it
    const w = await rworld(); const rgb = async () => new Response(png(4500, 5400, 300 * 1024, { type: 2 }), { headers: { 'X-Browser-Ms-Used': '1300' } }); w.br.queue.push(rgb, rgb);
    const id = await w.paidOrder([tee(0)]); await w.advance(1); eq([w.l0(id).status, w.l0(id).last_error], ['queued', 'png'], 'refused, not stored');
    await w.advance(MIN); const l = w.l0(id); ok(['ready', 'drafted'].includes(l.status) && l.renderer === 'resvg' && l.file_bytes > render.PNG_MIN.tee, 'the fallback drew it: ' + l.status + ' ' + l.renderer);
    const t = await rworld(); t.br.queue.push(rgb); const a = await t.admin('POST', 'render-test', { product: 'tee' }); ok(a.json.ok === false && a.json.png_ok === false && a.json.png_why === 'type 8/2' && a.json.colour_type === 2, 'the self-test reports the colour type and why: ' + JSON.stringify(a.json).slice(0, 240));
  });

  await T('F4-match', 'finding 2: the fallback match counts pixels more than 32 apart (tee 5,000, mug 3,000) next to the mean: a tee with one real shape left out fails it while its mean passes', async () => {
    eq(render.MATCH, { mean: 0.2, far: 32, far_px: { tee: 5000, mug: 3000 } }, 'the limits');
    const p = PP.printFromHash(linkOf(0, 'tee')), full = readPNG(Buffer.from(realTee));
    ok(render.matchOk(render.matchPx(full, full), 'tee') && render.matchPx(full, full).equal_px === 1, 'a picture matches itself');
    const stroke = Array.from(p.svg.matchAll(/<path\b[^>]*stroke="#FFF4E2"[^>]*\/>/g), (x) => x[0])[0]; ok(stroke, 'the akita’s cream crayon stroke');
    const m = render.matchPx(readPNG(Buffer.from(await drawPng(R, PP, p.svg.replace(stroke, ''), 12))), full);
    ok(m.mean_white < render.MATCH.mean && m.mean_black < render.MATCH.mean && m.far_px > render.MATCH.far_px.tee && !render.matchOk(m, 'tee'), 'without it: mean ' + m.mean_white.toFixed(3) + ' (the mean alone passes), ' + m.far_px + ' px more than 32 apart: refused');
  });

  await T('F4-time', 'finding 4: browser time is booked from X-Browser-Ms-Used, else the wall time (no header, our own timeout, a throw); a gate refusal books nothing', async () => {
    const w = await rworld({ ms: null }); w.br.queue.push(async (o) => { await sleepMs(40); return new Response(png(2700, 1050, 300 * 1024)); });
    await w.paidOrder([mug(0)]); await w.advance(1); const b = Number(w.meta('br_ms:' + utcDay(w.clock.t))); ok(b >= 40 && b < 5000, 'no header: the wall time booked (' + b + ' ms)');
    const x = await rworld({ env: { MERCH_RENDER_TIMEOUT_MS: '150' } }); x.br.queue.push('hang'); await x.paidOrder([mug(0)]); await x.advance(1); const bx = Number(x.meta('br_ms:' + utcDay(x.clock.t))); ok(bx >= 140, 'our own timeout (150 ms): ' + bx + ' ms booked');
    const y = await rworld(); y.br.queue.push('throw'); await y.paidOrder([mug(0)]); await y.advance(1); ok(Number(y.meta('br_ms:' + utcDay(y.clock.t))) >= 0 && y.l0((y.q('select id from merch_orders')[0] || {}).id).last_error.startsWith('threw'), 'a throw: booked as its wall time');
    const z = await rworld({ env: { MERCH_RENDER_VIA: 'worker' } }); const noB = Object.assign({}, z.env, { BROWSER: undefined }); z.env.SELF = { fetch: (u, i) => RenderGate.fetch(new Request(u, i), noB) };
    const r = await render.screenshot(z.env, 'mug', urlOf(0, 'mug')); ok(r.kind === 'error' && /^gate 404/.test(r.why) && r.wall === undefined, 'a gate refusal is no call: ' + r.why);
    const h = await rworld(); h.br.queue.push(async () => new Response(realMug, { headers: { 'X-Browser-Ms-Used': '0' } })); const a = await h.admin('POST', 'render-test', { product: 'mug' }); eq([a.json.ms_used, a.json.ms_booked], [0, 0], 'a header of 0 is 0');
    const n = await rworld({ ms: null }); n.br.queue.push('err'); const e = await n.admin('POST', 'render-test', { product: 'mug' }); ok(e.json.ms_used === null && e.json.ms_booked >= 0 && e.json.error.kind === 'error', 'the self-test says whether the header came with an error: ' + JSON.stringify([e.json.ms_used, e.json.ms_booked]));
  });

  await T('F4-errors', 'finding 4: 3 browser errors in a row put the browser off for an hour (browser_off, errors, the owner told once): the fallback draws at once, no browser calls; a good answer resets the run', async () => {
    const w = await rworld(); w.br.queue.push('err', 'err', 'err');
    const a = await w.paidOrder([mug(0)]); await w.advance(1); await w.advance(MIN); eq([w.l0(a).renderer, Number(w.meta('br_err_run'))], ['resvg', 2], 'line 1: two errors, then the fallback (T2.2-28)');
    const b = await w.paidOrder([mug(1)]); await w.advance(12e3); const lb = w.l0(b);
    ok(['ready', 'drafted'].includes(lb.status) && lb.renderer === 'resvg' && lb.tries === 0, 'line 2: the third error turns the browser off and the fallback draws it at once (no minute): ' + lb.status + ' ' + lb.renderer + ' ' + lb.tries);
    const off = String(w.meta('br_off')).split(' '); eq([Number(off[0]) - w.clock.t <= HOUR, off[1], Number(w.meta('br_err_run'))], [true, 'errors', 0], 'off for an hour, why errors');
    const c = await w.paidOrder([mug(2)]); await w.advance(12e3); eq([w.l0(c).renderer, w.br.calls.length], ['resvg', 3], 'line 3: no browser call at all');
    await w.advance(2 * MIN); ok(w.owner(/browser_off/).length === 1 && /errors/.test(w.owner(/browser_off/)[0].text), 'the owner told once');
    const rep = await w.admin('GET', 'report'); eq([rep.json.browser.off, rep.json.browser.error_run], ['errors', 0], 'the report');
    const s0 = await w.admin('POST', 'render-test', { product: 'mug' }); ok(s0.json.ok === false && s0.json.error.skipped && s0.json.error.why === 'errors' && w.br.calls.length === 3, 'the self-test is not sent to the browser either');
    w.clock.t += HOUR; const s1 = await w.admin('POST', 'render-test', { product: 'mug' }); eq([s1.json.ok, s1.json.renderer, w.br.calls.length], [true, 'browser', 4], 'an hour later the browser again (a 4th order of one buyer a day waits for review, T2.2-52: the self-test asks)');
    const x = await rworld(); x.br.queue.push('err', 'ok', 'err'); const e = await x.paidOrder([mug(0)]); await x.advance(1); await x.advance(MIN); eq([x.l0(e).renderer, Number(x.meta('br_err_run'))], ['browser', 0], 'a good answer resets the run');
    const f = await x.paidOrder([mug(1)]); await x.advance(12e3); eq([x.l0(f).tries, Number(x.meta('br_err_run')), x.meta('br_off')], [1, 1, null], 'then one error is a run of 1, the browser stays on');
  });

  await T('F4-layer', 'finding 5: splitBands refuses a kept opacity, group or clip layer that crosses a band edge (made-up SVG); the object answers 422 layer; the line then waits for the browser, never rejected and refunded', async () => {
    const S = (body) => '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="1200" viewBox="0 0 100 1200">' + body + '</svg>';
    const both = '<path d="M10 40L90 40L90 160L10 160Z" fill="#c33" stroke="#222" stroke-width="2" opacity=".5"/>'; // fill AND stroke: flatOpacity keeps it
    let e = null; try { splitBands(PP, S(both), 12); } catch (x) { e = x; } ok(e && /^layer: <path> opacity crosses the band/.test(e.message), 'an opacity shape across rows 100/148: ' + (e && e.message));
    ok(splitBands(PP, S('<path d="M10 300L90 300L90 340L10 340Z" fill="#c33" stroke="#222" stroke-width="2" opacity=".5"/>'), 12).bands.length === 12, 'the same shape inside one band: fine');
    ok(splitBands(PP, S('<path d="M10 40L90 40L90 160L10 160Z" fill="#c33" opacity=".5"/>'), 12).bands.length === 12, 'one paint only: its opacity moves into fill-opacity, fine (as today)');
    e = null; try { splitBands(PP, S('<g opacity=".5"><path d="M10 40L90 40L90 160L10 160Z" fill="#c33"/></g>'), 12); } catch (x) { e = x; } ok(e && /^layer: <g> opacity/.test(e.message), 'a group with opacity: ' + (e && e.message));
    e = null; try { splitBands(PP, S('<svg x="0" y="0" width="100" height="300" viewBox="0 0 100 300"><path d="M10 40L90 40L90 400L10 400Z" fill="#c33"/></svg>'), 12); } catch (x) { e = x; } ok(e && /^layer: a clipping <svg>/.test(e.message), 'a nested svg that clips (a shape outside its viewport): ' + (e && e.message));
    ok(splitBands(PP, S('<svg x="0" y="0" width="100" height="300" viewBox="0 0 100 300"><path d="M10 40L90 40L90 200L10 200Z" fill="#c33"/></svg>'), 12).bands.length === 12, 'a nested svg that cuts nothing is drawn as a <g> (as today)');
    // the object: 422 layer, its instance kept
    const bad = S(both).replace('width="100" height="1200" viewBox="0 0 100 1200"', 'width="4500" height="5400" viewBox="0 0 4500 5400"').replace('M10 40L90 40L90 160L10 160Z', 'M100 400L900 400L900 600L100 600Z');
    const env = { RESVG_WASM: WASM, PAWPRINT: Object.assign({}, PP, { printFromHash: () => ({ ok: true, product: 'tee', svg: bad }) }) }; const ns = namespace(MerchRender, env);
    const o = await ns.get('resvg').fetch('https://merch-render/resvg', { method: 'POST', body: JSON.stringify({ hash: linkOf(0, 'tee'), product: 'tee' }) });
    eq([o.status, (await o.json()).error], [422, 'layer'], 'MerchRender: 422 layer');
    eq((await render.resvg(Object.assign({}, env, { RENDER: ns }), 'tee', urlOf(0, 'tee'))).why, 'layer', 'render.resvg: why layer');
    // the ledger: two browser errors, then a fallback that cannot draw it: the line waits (an hour), no refund; held after the cancel hour
    const w = await rworld(); w.br.queue.push('err', 'err'); countRender(w, layer422); const id = await w.paidOrder([mug(0)]); await w.advance(1); await w.advance(MIN);
    const l = w.l0(id); eq([l.status, l.last_error, w.order(id).status], ['queued', 'wait: layer', 'paid'], 'waits for the browser, not rejected');
    ok(!w.q('select 1 from merch_refunds').length && w.order(id).next_try_at - w.clock.t <= HOUR, 'no refund; looks again within the hour');
    await w.advance(HOUR + 2 * MIN); const l2 = w.l0(id); ok(!['queued', 'rejected'].includes(l2.status) && l2.renderer === 'browser' && w.order(id).status !== 'refunded', 'the browser drew it later: ' + l2.status + ' ' + l2.renderer);
    // the browser out for the day and a layer: waits for 00:00 UTC, held after the cancel hour (T2.2-29), never drawn wrong
    const d = await rworld(); d.br.queue.push(...Array(5).fill('daily')); countRender(d, layer422); const j = await d.paidOrder([mug(0)]); await d.advance(1);
    eq([d.l0(j).status, d.l0(j).last_error], ['queued', 'daily'], 'out for the day: waits'); await d.advance(HOUR + 5 * MIN); eq([d.order(j).status, d.order(j).hold], ['held', 'render'], 'held render after the hour');
  });

  await T('F4-tidy', 'finding 6: the self-test file row and its trash row are written in ONE transaction: a crash between them leaves the row, so the next tidy still deletes the file', async () => {
    const w = await rworld(); w.br.queue.push(realShot(900)); const a = await w.admin('POST', 'render-test', { product: 'mug' }); ok(a.json.ok, 'a self-test file');
    w.clock.t += 16 * MIN; const L = w.L(), run = L.run.bind(L); L.run = (s, ...x) => { if (/insert or ignore into merch_trash/.test(s)) throw new Error('crash between the two writes'); return run(s, ...x); };
    let e = null; try { await L.tidy(w.clock.t); } catch (x) { e = x; } L.run = run;
    ok(e && w.q("select k from merch_meta where k glob 'rt:*'").length === 1 && !w.q('select 1 from merch_trash').length, 'the crash rolled back both: the row is still there');
    await L.tidy(w.clock.t); ok(!w.q("select k from merch_meta where k glob 'rt:*'").length && !w.q('select 1 from merch_trash').length, 'the next tidy deletes it');
    eq((await w.env.PRINTS.get(a.json.key.split('~')[0]).fetch('https://prints/get?key=' + encodeURIComponent(a.json.key))).status, 404, 'gone from MerchPrints');
  });

  await T('F4-ready', 'finding 7: the report and the nightly line list what is set up (RENDER included); a browser that is not set up has the fallback draw the line', async () => {
    const w = await rworld(); await w.init(); eq(w.L().report().browser.parts, { via: 'direct', browser: true, self: false, fallback: true }, 'report: parts');
    await w.admin('POST', 'nightly'); ok(w.owner(/\[report\]/).some((m) => /set up: browser yes, fallback RENDER yes/.test(m.text)), 'the nightly line');
    const x = await rworld(); x.env.RENDER = undefined; await x.admin('POST', 'nightly'); ok(x.owner(/\[report\]/).some((m) => /fallback RENDER MISSING/.test(m.text)), 'RENDER missing is said');
    const y = await rworld(); const id = await y.paidOrder([mug(0)]); y.L().env.BROWSER = undefined; await y.advance(1); const l = y.l0(id); ok(['ready', 'drafted'].includes(l.status) && l.renderer === 'resvg', 'browser not_set_up: resvg drew it: ' + l.status + ' ' + l.renderer);
  });

  await T('F4-selector', 'finding 10: waitForSelector has a 15 s limit (the rest of the measured call unchanged), sent the same through the gate', async () => {
    eq(render.shotOptions('tee', 'u'), { url: 'u', viewport: { width: 2250, height: 2700, deviceScaleFactor: 2 }, screenshotOptions: { omitBackground: true }, waitForSelector: { selector: '#o svg', timeout: 15000 } }, 'the call');
    const w = await rworld({ env: { MERCH_RENDER_VIA: 'worker' } }); w.env.SELF = { fetch: (u, i) => RenderGate.fetch(new Request(u, i), w.env) }; await render.screenshot(w.env, 'mug', urlOf(0, 'mug'));
    eq(w.br.calls[0].opts.waitForSelector, { selector: '#o svg', timeout: 15000 }, 'through RenderGate');
  });

  await T('F4-reread', 'finding 11: a cancel that comes in during the browser call: the fallback is not asked, nothing is stored', async () => {
    const w = await rworld(); const c = countRender(w); let id = null;
    w.br.queue.push(async () => { await w.call('POST', '/merch/order/' + id + '/cancel', {}); return new Response('Browser time limit exceeded for today', { status: 429 }); });
    id = await w.paidOrder([mug(0)]); await w.advance(1);
    eq([w.order(id).status, c.n, w.l0(id).file_key], ['cancelled', 0, null], 'cancelled, no fallback render, no file');
  });

  await T('F4-oldart72', 'an old-art line on days the browser is out: the fallback never draws it; held, the owner told at 2 h, refunded at 72 h (review: the last step was not tested for this case)', async () => {
    const w = await rworld({ env: { MERCH_ART_VERS: 'pp1-0ldbuild' } }); w.br.queue.push(...Array(60).fill('daily'));
    const id = await w.newOrder([mug(0)], 'US', { art_ver: 'pp1-0ldbuild' }); await w.pay(id); await w.advance(HOUR + 5 * MIN);
    eq([w.order(id).status, w.order(id).hold, w.l0(id).renderer], ['held', 'render', null], 'held, not drawn');
    await w.advance(3 * HOUR); ok(w.owner(/render_held/).length >= 1, 'the owner told after 2 h');
    await w.advance(72 * HOUR); eq([w.order(id).status, w.l0(id).file_key], ['refunded', null], 'refunded at 72 h, never drawn'); ok(w.mails(/refund_all/).length === 1, 'and the apology');
  });

  await T('F4-kit', 'findings 3, 4, 9: the cloud kit against a fake Cloudflare API (nothing sent): the delete on every way out, a 404 is done, a failed delete prints the hand line and exits non-zero, accounts, the browser stops after 2 failures', async () => {
    const del = /FAKE: DELETE \/accounts\/<acc>\/workers\/scripts\/doodle-doggo-merch-rtest\?force=true/;
    const okRun = kit('ok'); ok(okRun.code === 0 && del.test(okRun.out) && /account as before/.test(okRun.out) && okRun.report.deleted === true && okRun.report.startup_ms.length === 2 && okRun.report.cpu, 'a good run: deleted, the account as before, start-up and CPU recorded');
    ok(!/curl|api\.cloudflare\.com/.test(okRun.out.replace(/no network call/, '')), 'nothing reaches the network');
    const to = kit('upload_timeout'); ok(to.code === 1 && /upload: .*no answer/.test(to.out) && del.test(to.out) && /account as before/.test(to.out) && to.report.deleted === true, 'the first upload times out after the Worker was made: still deleted');
    const df = kit('delete_fails'), HANDLINE = 'CLEAN UP BY HAND: the test Worker doodle-doggo-merch-rtest may still exist. In the Cloudflare dashboard open Workers & Pages, select doodle-doggo-merch-rtest, Settings, Delete (its Durable Objects go with it).';
    ok(df.code === 3 && df.out.includes(HANDLINE) && /CHECK THE ACCOUNT/.test(df.out) && /report: /.test(df.out) && df.report.deleted === false && df.report.after.workers === 3, 'the delete fails: the hand line, the counts, the report, exit 3');
    ok(fs.readFileSync(path.join(ROOT, 'docs', 'design', 'merch', 'PART4.md'), 'utf8').includes(HANDLINE), 'the same line in PART4.md’s run book');
    const nf = kit('delete_404'); ok(nf.code === 0 && /is not there \(404\)/.test(nf.out) && !nf.out.includes('CLEAN UP BY HAND'), 'a 404 on delete is done');
    const ac = kit('accounts2'); ok(ac.code === 1 && /2 Cloudflare accounts are visible: set CLOUDFLARE_ACCOUNT_ID/.test(ac.out) && !/FAKE: PUT/.test(ac.out) && !del.test(ac.out), 'two accounts and no CLOUDFLARE_ACCOUNT_ID: refused before anything is made');
    const one = kit('accounts2', { CLOUDFLARE_ACCOUNT_ID: 'acc-2' }); ok(one.code === 0 && !/FAKE: GET \/accounts$/m.test(one.out), 'with CLOUDFLARE_ACCOUNT_ID it goes on');
    const bf = kit('browser_fails'), rows = bf.report.renders;
    ok(bf.code === 1 && rows.filter((r) => r.renderer === 'browser' && r.ok === false).length === 2 && rows.filter((r) => r.skipped).length === 6 && rows.filter((r) => r.renderer === 'resvg' && r.ok).length === 6 && bf.report.probe[0].skipped && /after 2 failures/.test(bf.report.browser_stopped), 'the browser fails twice: the other 6 browser jobs and the probe skipped, the resvg jobs run, reported');
    eq(bf.report.ms_used_on_errors, [null, null], 'X-Browser-Ms-Used on errors recorded (none here)');
    // SIGTERM while the kit waits: it deletes the Worker, writes the report and exits 143
    const env = kitEnv('hang'), ch = spawn(process.execPath, [KIT], { env }); let out = '';
    ch.stdout.on('data', (d) => { out += d; if (/ ok {3}akita tee browser/.test(out) && !ch.killed) ch.kill('SIGTERM'); }); ch.stderr.on('data', (d) => { out += d; });
    const code = await new Promise((r) => ch.on('exit', (c, s) => r(c == null ? s : c)));
    ok(code === 143 && /stopping \(SIGTERM\)/.test(out) && del.test(out) && fs.existsSync(path.join(env.RTEST_OUT, 'rtest-report.json')), 'SIGTERM: cleaned up first (' + code + ')');
  });
}

// ---------------- workerd: the MerchRender Durable Object with the real wasm module, the self binding, the admin self-test ----------------
function findMiniflare() {
  for (const r of (process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean)) for (const sub of ['miniflare', 'wrangler/node_modules/miniflare']) { try { return require(path.join(r, sub)); } catch (e) { /* next */ } }
  try { return require('miniflare'); } catch (e) { return null; }
}
// Miniflare cannot emulate Browser Run's binding, so a test entry wraps the real Worker and hands every object a BROWSER whose quickAction goes
// to the fake in Node through a service binding (the real binding's own shape is what the node tests above check)
const ENTRY = `import * as W from './worker.js';
import { gate } from './render.js';
const withB = (env) => Object.assign({}, env, { BROWSER: { quickAction: async (kind, o) => env.BROWSER_SVC.fetch('https://browser/', { method: 'POST', body: JSON.stringify({ kind, o }) }) } });
export class MerchLedger extends W.MerchLedger { constructor(s, e) { super(s, withB(e)); } }
export { MerchPrints, MerchRender } from './worker.js';
export const RenderGate = { fetch: (req, env) => gate(req, withB(env)) };
export default { fetch: (req, env, ctx) => W.default.fetch(req, withB(env), ctx), scheduled: (ev, env, ctx) => W.default.scheduled(ev, withB(env), ctx) };`;
async function miniflare4() {
  const MF = findMiniflare();
  if (!MF) { console.log('  SKIP Miniflare is not installed here (NODE_PATH=$(npm root -g))'); return; }
  const dir = path.join(ROOT, 'cloudflare', 'merch'), read = (p) => fs.readFileSync(path.join(ROOT, p));
  const modules = [{ type: 'ESModule', path: path.join(dir, 'test_entry.js'), contents: ENTRY }]
    .concat(fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => ({ type: 'ESModule', path: path.join(dir, f), contents: fs.readFileSync(path.join(dir, f), 'utf8') })))
    .concat([{ type: 'ESModule', path: path.join(dir, 'vendor/resvg-wasm/resvg_glue.js'), contents: read('cloudflare/merch/vendor/resvg-wasm/resvg_glue.js').toString('utf8') },
      { type: 'CompiledWasm', path: path.join(dir, 'vendor/resvg-wasm/index_bg.wasm'), contents: read('cloudflare/merch/vendor/resvg-wasm/index_bg.wasm') },
      { type: 'CommonJS', path: path.join(ROOT, 'merch/dist/pawprint.js'), contents: read('merch/dist/pawprint.js').toString('utf8') },
      { type: 'CommonJS', path: path.join(ROOT, 'merch/sample_dogs.js'), contents: read('merch/sample_dogs.js').toString('utf8') }]);
  const start = (br, more) => {
    const stripe = fakeStripe(), pf = fakePrintful(), mail = fakeMail();
    const asInit = async (req) => { const h = {}; for (const [k, v] of req.headers) h[k === 'idempotency-key' ? 'Idempotency-Key' : k === 'authorization' ? 'Authorization' : k === 'stripe-version' ? 'Stripe-Version' : k] = v; return { method: req.method, headers: h, body: req.method === 'GET' ? undefined : await req.text() }; };
    const svc = (f) => async (req) => f(req.url, await asInit(req));
    const mf = new MF.Miniflare({ modulesRoot: ROOT, modules, compatibilityDate: '2026-03-24',
      durableObjects: { LEDGER: { className: 'MerchLedger', useSQLite: true }, PRINTS: { className: 'MerchPrints', useSQLite: true }, RENDER: { className: 'MerchRender', useSQLite: true } },
      bindings: Object.assign({ MERCH_FROM: '2026-01-01T00:00:00+09:00', MERCH_COUNTRIES: 'all,-uk_eu', MERCH_PROVIDER_MODE: 'live', MERCH_STRIPE_KEY: 'sk_test_fake', MERCH_STRIPE_WEBHOOK_SECRET: stripe.secret,
        MERCH_HASH_KEY: 'hash-key-for-tests', MERCH_FILE_KEY: 'file-key-for-tests', MERCH_ADMIN_KEY: 'admin-key-for-tests-0123', MERCH_PROVIDER_KEY: 'pf', RESEND_API_KEY: 're_test', MERCH_OWNER_TO: 'owner@example.test',
        MERCH_PUBLIC_URL: 'https://merch-api.test', MERCH_PROVIDER_WEBHOOK_SECRET: 'pf-hook-secret-test' }, more || {}),
      serviceBindings: { STRIPE_FETCH: svc(stripe.fetch), PROVIDER_FETCH: svc(pf.fetch), MAIL_FETCH: svc(mail.fetch), SELF: { name: MF.kCurrentWorker, entrypoint: 'RenderGate' },
        BROWSER_SVC: async (req) => { const { kind, o } = await req.json(); return br.quickAction(kind, o); } } });
    const call = async (m, p, body, headers) => { const r = await mf.dispatchFetch('https://merch-api.test' + p, { method: m, headers: Object.assign({ 'content-type': 'application/json', 'CF-Connecting-IP': '10.71.0.1' }, headers || {}), body: body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { j = null; } return { status: r.status, json: j, text: t }; };
    const admin = (p, body) => call('POST', '/merch/admin/' + p, body, { authorization: 'Bearer admin-key-for-tests-0123' });
    const file = async (u) => new Uint8Array(await (await mf.dispatchFetch(u)).arrayBuffer());
    return { mf, stripe, call, admin, file };
  };
  await T('P4-miniflare', 'workerd: a daily 429 in a real alarm -> the MerchRender object (CompiledWasm, lazy) draws the mug; self-test tee by resvg (12 bands in workerd) and mug by the browser through SELF/RenderGate', async () => {
    let br = fakeBrowser(); br.queue.push('daily'); let s = start(br);
    try {
      const c = await s.call('POST', '/merch/checkout', { country: 'US', lines: [mug(0)], expect_total: 2498, art_ver: PP.ART_VER, nonce: 'mf4-nonce-0001', agree: true }); ok(c.status === 200, 'checkout ' + c.text);
      const id = c.json.order, cs = s.stripe.pay(Array.from(s.stripe.sessions.keys())[0]), e = await s.stripe.event('checkout.session.completed', { id: cs.id, payment_status: 'paid', metadata: cs.metadata });
      ok((await s.call('POST', '/merch/webhook/stripe', e.raw, { 'stripe-signature': e.sig })).status === 200, 'paid');
      let show; for (let i = 0; i < 100; i++) { show = (await s.call('GET', '/merch/admin/order/' + id, null, { authorization: 'Bearer admin-key-for-tests-0123' })).json; if (show.lines[0].file_url) break; await new Promise((r) => setTimeout(r, 100)); }
      eq([show.lines[0].renderer, br.calls.length], ['resvg', 1], 'drawn by the fallback object in workerd');
      const png = await s.file(show.lines[0].file_url); const d = pngSize(png); ok(d.w === 2700 && d.h === 1050 && corners(png)[3] === 255, 'a real 2700x1050 mug through MerchPrints and the signed route');
    } finally { await s.mf.dispose(); }
    br = fakeBrowser(); s = start(br, { MERCH_RENDER_VIA: 'worker' });
    try {
      const t = await s.admin('render-test', { product: 'tee', renderer: 'resvg', dog: 'dane' }); ok(t.json && t.json.ok && t.json.width === 4500 && t.json.height === 5400, 'tee in workerd: ' + t.text.slice(0, 300));
      const png = await s.file(t.json.file_url); eq(corners(png), [0, 0, 0, 0], 'tee corners clear'); console.log('       workerd resvg tee (12 bands): ' + t.json.wall_ms + ' ms, ' + t.json.bytes + ' bytes');
    } finally { await s.mf.dispose(); }
    br = fakeBrowser(); br.queue.push(realShot(777)); s = start(br, { MERCH_RENDER_VIA: 'worker' });
    try {
      const m = await s.admin('render-test', { product: 'mug', renderer: 'browser' }); ok(m.json && m.json.ok && m.json.via === 'worker' && m.json.ms_used === 777 && m.json.width === 2700, 'mug via SELF -> RenderGate -> Browser Run: ' + m.text.slice(0, 300));
      eq(br.calls[0].opts.viewport, { width: 2700, height: 1050, deviceScaleFactor: 1 }, 'the gate sent the measured options');
    } finally { await s.mf.dispose(); }
  });
}
