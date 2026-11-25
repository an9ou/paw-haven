// Stage 5: part 4, the real print render (docs/design/merch/PART4.md). The Browser Run binding is a fake OBJECT (env.BROWSER.quickAction, not
// RENDER_FETCH), so render.js's real path runs; the resvg fallback is the REAL MerchRender object with the vendored resvg-wasm (no fake). Rows P4-*.
// Then the same Worker in workerd (Miniflare): the MerchRender Durable Object with the wasm module, the self service binding to RenderGate.
import fs from 'node:fs';
import path from 'node:path';
import { T, ok, eq, world, mug, tee, PP, ROOT, MIN, HOUR, DAY } from './harness.mjs';
import { namespace, fakeBrowser, fakeStripe, fakePrintful, fakeMail, require } from './fakes.mjs';
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
    eq([c.opts.viewport, c.opts.screenshotOptions, c.opts.waitForSelector], [{ width: 2700, height: 1050, deviceScaleFactor: 1 }, { omitBackground: true }, { selector: '#o svg' }], 'the options as measured (RENDER_FREE 8)');
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
    ok(w.L().pngOk('mug', buf) && corners(buf)[2] === 255, 'a real resvg mug, exact size');
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
    eq(w.br.calls[0].opts.waitForSelector, { selector: '#o svg' }, 'the same options');
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
    const ok2 = await render.resvg(w.env, 'mug', urlOf(0, 'mug')); ok(ok2.ok && w.L().pngOk('mug', ok2.png), 'the current art_ver is drawn');
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
      ok(r.ok && w.L().pngOk(product, r.png), SAMPLES[i].id + ' ' + product + ': ' + (r.why || 'pngOk'));
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

  await miniflare4();
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
