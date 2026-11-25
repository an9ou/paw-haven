// The print render (TRANSACTIONS.md 2 step 7, 6.6; RENDER_FREE.md 8; PART4.md). Two renderers, one answer shape:
//   screenshot(env, product, url[, via]) -> Cloudflare's browser (Browser Run) draws the static print page at the product's exact size
//   resvg(env, product, url)             -> the fallback ("option G"): resvg-wasm in the MerchRender Durable Object (resvg.js), from the line's recipe
//   -> { ok: true, png: Uint8Array, ms?, wall? } | { ok: false, kind: 'daily' | 'rate' | 'error' | 'not_set_up', why, ms?, wall? }    (never throws)
// ms: the billed browser time of that call (header X-Browser-Ms-Used), when Browser Run sends it. wall: how long the call took here, set whenever the
// browser was really asked (not for not_set_up or a gate refusal). The ledger books ms per UTC day, and wall when ms is missing or on our own
// timeout (review finding 4: an answer without the header is never free).
// Browser Run is called exactly as the test deploy measured it (RENDER_FREE 8):
//   env.BROWSER.quickAction('screenshot', { url, viewport, screenshotOptions: { omitBackground: true }, waitForSelector: { selector: '#o svg', timeout: 15000 } })
// (the one change since the measured call: a 15 s limit on the wait, review finding 10, so a page that shows ERR is not billed up to Browser Run's own
// 60 s; a good print page shows its svg in well under a second, RENDER_FREE 8)
// Two call paths, one switch (MERCH_RENDER_VIA): unset or "direct" = the ledger object calls env.BROWSER itself (the default; whether a Durable Object
// may call the binding is not verified until the cloud test); "worker" = the object asks the front Worker through the self service binding SELF
// (entrypoint RenderGate, never reachable from the internet), which calls env.BROWSER and streams the body back un-decoded (gate() below: no
// PawPrint, a few ms of CPU). The test seam env.RENDER_FETCH (a fetch) still speaks part 3's fake protocol and wins over both:
//   POST https://browser-run.internal/screenshot { url, viewport, screenshotOptions, waitForSelector }   POST https://browser-run.internal/resvg { url, product }
// 429s: the daily text is known from Cloudflare's limits page ("Browser time limit exceeded for today"); the per-10-s rate text is NOT verified. So
// an unknown 429 is 'rate' here (try again in 11 s); the ledger counts rate answers in a row and calls the day out after RATE_RUN of them (ledger.js).
// The status and the first 120 characters of any unknown answer are kept in why, for the cloud test to record (no secret is ever in it).
import { fetcher } from './util.js';

// tee at 2250x2700 x2 (byte-identical to 4500x5400 x1, RENDER_FREE 3 and 8), mug 2700x1050
export const VIEWPORT = { tee: { width: 2250, height: 2700, deviceScaleFactor: 2 }, mug: { width: 2700, height: 1050, deviceScaleFactor: 1 } };
export const DAILY_429 = /time limit exceeded for today/i;
export const TIMEOUT_MS = 75e3;      // our own limit on one browser call (Browser Run's own is 60 s; its timeout answer should come first)
export const RESVG_TIMEOUT_MS = 60e3; // one fallback render (a tee takes 1.2-1.7 s in the cloud, RENDER_FREE 8)
export const SELECTOR_MS = 15e3;      // the page's own wait for '#o svg' inside Browser Run (review finding 10)
// the print file check (review finding 1). Least byte sizes from the measured files (PART4.md "Review fixes"): the smallest real print of the 8
// sample dogs in 3 poses, with and without a name, was 181 KB (tee) and 112 KB (mug), both from resvg (Chromium's files are 2.5-4 times bigger);
// a blank print is 94.5 KB (tee, resvg; about 25 KB from other encoders) and 11-58 KB (mug, resvg and Chromium). So: tee 128 KiB, mug 64 KiB
export const PNG_MIN = { tee: 128 * 1024, mug: 64 * 1024 };
export const PNG_MAX = 7.5 * (1 << 20);
// how close the fallback must come to the browser (render_chromium.mjs and the cloud kit, tools/merch_rtest.mjs; review finding 2): the mean
// difference per channel over white and over black, and the pixels more than 32 apart in any channel over white or black (a missing body part is
// tens of thousands; the 8 sample dogs reach at most 1,687 on a tee and 1,042 on a mug)
export const MATCH = { mean: 0.2, far: 32, far_px: { tee: 5000, mug: 3000 } };
// two decoded RGBA pictures of one size (straight alpha) -> { mean_white, mean_black, far_px, equal_px }. For the tests and the cloud kit only;
// the Worker never decodes a picture
export function matchPx(A, B) {
  const a = A.data, b = B.data, n = a.length / 4; let sw = 0, sk = 0, far = 0, same = 0;
  for (let i = 0; i < a.length; i += 4) {
    const aa = a[i + 3] / 255, ba = b[i + 3] / 255; let f = false;
    if (a[i] === b[i] && a[i + 1] === b[i + 1] && a[i + 2] === b[i + 2] && a[i + 3] === b[i + 3]) same++;
    for (let c = 0; c < 3; c++) {
      const x = a[i + c], y = b[i + c], dk = Math.abs(x * aa - y * ba), dw = Math.abs(x * aa + 255 * (1 - aa) - (y * ba + 255 * (1 - ba)));
      sw += dw; sk += dk; if (dw > MATCH.far || dk > MATCH.far) f = true;
    }
    if (f) far++;
  }
  return { mean_white: sw / (3 * n), mean_black: sk / (3 * n), far_px: far, equal_px: same / n };
}
export const matchOk = (m, product) => m.mean_white < MATCH.mean && m.mean_black < MATCH.mean && m.far_px <= (MATCH.far_px[product] || 0);

const via = (env, v) => (v || env.MERCH_RENDER_VIA || 'direct') === 'worker' ? 'worker' : 'direct';
const hasBrowser = (env) => !!(env.BROWSER && typeof env.BROWSER.quickAction === 'function');
export const renderReady = (env) => !!fetcher(env.RENDER_FETCH) || (via(env) === 'worker' ? !!(env.SELF && typeof env.SELF.fetch === 'function') : hasBrowser(env));
export const shotOptions = (product, url) => ({ url, viewport: VIEWPORT[product], screenshotOptions: { omitBackground: true }, waitForSelector: { selector: '#o svg', timeout: SELECTOR_MS } });
// what is set up, for the report (review finding 7): the browser path, the self binding and the fallback object RENDER
export const renderParts = (env) => ({ via: via(env), browser: hasBrowser(env), self: !!(env.SELF && typeof env.SELF.fetch === 'function'), fallback: !!fetcher(env.RENDER_FETCH) || !!(env.RENDER && typeof env.RENDER.idFromName === 'function') });

const clean = (t) => String(t == null ? '' : t).replace(/\s+/g, ' ').trim().slice(0, 120);
// one answer that is not a picture -> its kind. thrown: the binding threw instead of answering (its message is the text)
export function classify(status, text, thrown) {
  const t = clean(text), s = thrown ? 'threw' : String(status);
  if (DAILY_429.test(t)) return { ok: false, kind: 'daily', why: s + ' daily' };
  if (status === 429 || (thrown && /\b429\b|rate limit|too many requests/i.test(t))) return { ok: false, kind: 'rate', why: s + ': ' + t };
  return { ok: false, kind: 'error', why: (thrown ? 'threw' : 'http ' + status) + ': ' + t };
}
const msOf = (h) => { const v = h && typeof h.get === 'function' ? h.get('x-browser-ms-used') : null; const n = v == null || v === '' ? NaN : Number(v); return Number.isFinite(n) && n >= 0 ? n : undefined; };
// whatever the binding gave back -> the answer. A Response (or anything with status, headers and a body), or the bytes themselves
async function fromAnswer(res) {
  if (res instanceof Uint8Array || res instanceof ArrayBuffer) return { ok: true, png: new Uint8Array(res) };
  if (!res || typeof res !== 'object') return { ok: false, kind: 'error', why: 'answer: ' + typeof res };
  if (typeof res.arrayBuffer !== 'function' && res.body) res = new Response(res.body, { status: res.status || 200, headers: res.headers || {} });
  if (typeof res.arrayBuffer !== 'function') return { ok: false, kind: 'error', why: 'answer: no body' };
  const status = Number(res.status || 200), ms = msOf(res.headers), threw = res.headers && typeof res.headers.get === 'function' && res.headers.get('x-merch-threw') === '1';
  if (status < 200 || status > 299 || threw) { const t = await res.text().catch(() => ''); const c = classify(status, t, threw); if (ms !== undefined) c.ms = ms; return c; }
  const png = new Uint8Array(await res.arrayBuffer());
  return ms === undefined ? { ok: true, png } : { ok: true, png, ms };
}
// a promise with our own time limit: 'timeout' is its own answer
function limit(p, ms) {
  let timer; const t = new Promise((r) => { timer = setTimeout(() => r({ timeout: true }), ms); });
  return Promise.race([p, t]).finally(() => clearTimeout(timer));
}
const msLimit = (env, k, d) => Number(env[k]) > 0 ? Number(env[k]) : d;

// the binding call itself (used by the object, direct, and by the front Worker's gate)
async function browserCall(env, product, url) {
  if (!hasBrowser(env)) return { ok: false, kind: 'not_set_up', why: 'no BROWSER binding' };
  if (!VIEWPORT[product]) return { ok: false, kind: 'error', why: 'product' };
  try { return await fromAnswer(await env.BROWSER.quickAction('screenshot', shotOptions(product, url))); }
  catch (e) { return classify(0, (e && e.message) || e, true); }
}
async function viaWorker(env, product, url) {
  if (!env.SELF || typeof env.SELF.fetch !== 'function') return { ok: false, kind: 'not_set_up', why: 'no SELF binding' };
  let res; try { res = await env.SELF.fetch('https://merch-gate/shot', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ product, url }) }); }
  catch (e) { return { ok: false, kind: 'error', why: 'self: ' + clean((e && e.message) || e) }; }
  if (res.status === 400 || res.status === 404) return { ok: false, kind: 'error', why: 'gate ' + res.status + ': ' + clean(await res.text().catch(() => '')), nocall: true }; // the browser was never asked
  return fromAnswer(res);
}

// part 3's fake protocol (tests only)
async function go(env, path, body) {
  const f = fetcher(env.RENDER_FETCH); if (!f) return { ok: false, kind: 'not_set_up' };
  let r; try { r = await f('https://browser-run.internal/' + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
  catch (e) { return { ok: false, kind: 'error', why: 'network' }; }
  if (r.status === 429) { const t = await r.text().catch(() => ''); const c = classify(429, t); return { ok: false, kind: c.kind, why: c.why }; }
  if (!r.ok) return { ok: false, kind: 'error', why: 'http ' + r.status };
  const png = new Uint8Array(await r.arrayBuffer());
  return { ok: true, png };
}

export async function screenshot(env, product, url, v) {
  const t0 = Date.now(), timed = (r) => { if (r.kind !== 'not_set_up' && !r.nocall) r.wall = Date.now() - t0; delete r.nocall; return r; };
  if (fetcher(env.RENDER_FETCH)) return timed(await go(env, 'screenshot', shotOptions(product, url)));
  try {
    const r = await limit(via(env, v) === 'worker' ? viaWorker(env, product, url) : browserCall(env, product, url), msLimit(env, 'MERCH_RENDER_TIMEOUT_MS', TIMEOUT_MS));
    return timed(r && r.timeout ? { ok: false, kind: 'error', why: 'timeout' } : r);
  } catch (e) { return timed({ ok: false, kind: 'error', why: 'threw: ' + clean((e && e.message) || e) }); }
}

/* ---------------- the print file check (review finding 1) ---------------- */
// -> null when the file may go to the printer, else a short why. Cheap on purpose (it runs in the ledger object): the header, the chunk list up
// to IEND (a cut-off file never ends in IEND), and for the tee only the FIRST scanline inflated, whose alpha must be 0 everywhere (the tee's top
// row is clear by design; an opaque RGB rectangle or a missing omitBackground fails here). The mug's top corners are clear and its name strip
// opaque (PART4 decision 9), so it has no alpha check. want: { w, h } of the product
const be = (u, o) => ((u[o] << 24) | (u[o + 1] << 16) | (u[o + 2] << 8) | u[o + 3]) >>> 0;
const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
export async function pngCheck(product, png, want) {
  if (!(png instanceof Uint8Array) || png.length < 57) return 'short';
  for (let i = 0; i < 8; i++) if (png[i] !== SIG[i]) return 'not_png';
  if (be(png, 8) !== 13 || String.fromCharCode(png[12], png[13], png[14], png[15]) !== 'IHDR') return 'not_png';
  const w = be(png, 16), h = be(png, 20);
  if (!want || w !== want.w || h !== want.h) return 'size';
  if (png[24] !== 8 || png[25] !== 6 || png[28] !== 0) return 'type ' + png[24] + '/' + png[25]; // 8-bit RGBA, not interlaced
  if (png.length < (PNG_MIN[product] || 0)) return 'small';
  if (png.length > PNG_MAX) return 'big';
  const idat = []; let o = 8, end = false;
  while (o + 12 <= png.length) {
    const len = be(png, o), t = String.fromCharCode(png[o + 4], png[o + 5], png[o + 6], png[o + 7]);
    if (o + 12 + len > png.length) return 'cut';
    if (t === 'IDAT') idat.push(png.subarray(o + 8, o + 8 + len));
    o += 12 + len; if (t === 'IEND') { end = true; break; }
  }
  if (!end || o !== png.length) return 'cut';
  if (!idat.length) return 'cut';
  if (product !== 'tee') return null;
  const stride = w * 4, row = await inflateHead(idat, stride + 1);
  if (!row) return 'idat';
  const f = row[0], px = row.subarray(1);
  if (f > 4) return 'idat';
  // the first row has no row above: filters 2 (up) and 0 are the bytes, 1 (sub) and 4 (paeth, which is then "left") add the byte to the left,
  // 3 (average) adds half of it
  for (let i = 0; i < stride; i++) { const a = i >= 4 ? px[i - 4] : 0; px[i] = (px[i] + (f === 1 || f === 4 ? a : f === 3 ? a >> 1 : 0)) & 255; }
  for (let i = 3; i < stride; i += 4) if (px[i] !== 0) return 'tee_top';
  return null;
}
// the first n bytes of the zlib stream in parts, inflated with the runtime's DecompressionStream; it stops as soon as it has them (the rest of
// the picture is never inflated). -> Uint8Array(n) | null (too short or broken)
async function inflateHead(parts, n) {
  const ds = new DecompressionStream('deflate'), wr = ds.writable.getWriter(), rd = ds.readable.getReader(), out = new Uint8Array(n);
  let stop = false, got = 0;
  const feed = (async () => { for (const p of parts) for (let o = 0; o < p.length && !stop; o += 16384) await wr.write(p.subarray(o, Math.min(p.length, o + 16384))); if (!stop) await wr.close(); })();
  feed.catch(() => {});
  try {
    while (got < n) { const { done, value } = await rd.read(); if (done) break; const k = Math.min(n - got, value.length); out.set(value.subarray(0, k), got); got += k; }
  } catch (e) { got = -1; }
  stop = true; rd.cancel().catch(() => {}); wr.abort().catch(() => {});
  return got === n ? out : null;
}

// the fallback: the line's own link goes to the MerchRender object, which draws it with the bundled PawPrint and resvg-wasm. A link of another
// art version (T2.2-49) is refused there and here: { ok: false, kind: 'error', why: 'art_ver' } (never drawn with the wrong art). why 'layer': the
// art has a layer the bands cannot draw (resvg.js splitBands, review finding 5). Both mean "the fallback cannot draw this line": it waits for the browser
export async function resvg(env, product, url) {
  if (fetcher(env.RENDER_FETCH)) return go(env, 'resvg', { url, product });
  if (!env.RENDER || typeof env.RENDER.idFromName !== 'function') return { ok: false, kind: 'not_set_up', why: 'no RENDER binding' };
  const u = String(url || ''), i = u.indexOf('#'), folder = /\/merch\/print\/([A-Za-z0-9_-]{1,40})\/(?:index\.html)?#/.exec(u), av = /[#&]av=([A-Za-z0-9_-]+)/.exec(u);
  if (i < 0 || !av) return { ok: false, kind: 'error', why: 'link' };
  if (folder && folder[1] !== av[1]) return { ok: false, kind: 'error', why: 'art_ver' };
  try {
    const stub = env.RENDER.get(env.RENDER.idFromName('resvg'));
    const r = await limit((async () => {
      const res = await stub.fetch('https://merch-render/resvg', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ hash: u.slice(i), product }) });
      if (!res.ok) { let j = {}; try { j = await res.json(); } catch (e) { j = {}; } return { ok: false, kind: 'error', why: j.error === 'art_ver' || j.error === 'layer' ? j.error : 'resvg ' + res.status + ': ' + clean(j.why || j.error || '') }; }
      return { ok: true, png: new Uint8Array(await res.arrayBuffer()) };
    })(), msLimit(env, 'MERCH_RESVG_TIMEOUT_MS', RESVG_TIMEOUT_MS));
    return r && r.timeout ? { ok: false, kind: 'error', why: 'resvg timeout' } : r;
  } catch (e) { return { ok: false, kind: 'error', why: 'resvg threw: ' + clean((e && e.message) || e) }; }
}

// The front Worker's side of MERCH_RENDER_VIA = "worker" (worker.js exports it as the RenderGate entrypoint; the self service binding SELF points
// at it, so only this Worker's own objects reach it). POST /shot { product, url } -> Browser Run's answer as it came: status, X-Browser-Ms-Used and
// the body streamed, never decoded. A throw becomes 502 with x-merch-threw: 1 and the message. Only a print page of this Worker is ever opened.
export async function gate(req, env) {
  const u = new URL(req.url);
  if (req.method !== 'POST' || u.pathname !== '/shot') return new Response('not found', { status: 404 });
  let b; try { b = await req.json(); } catch (e) { b = null; }
  const base = new URL(env.MERCH_PUBLIC_URL || 'https://merch-api.doodledoggo.app');
  let t = null; try { t = b && typeof b.url === 'string' ? new URL(b.url) : null; } catch (e) { t = null; }
  if (!b || !VIEWPORT[b.product] || !t || t.origin !== base.origin || !/^\/merch\/print\/[A-Za-z0-9_-]{1,40}\/(index\.html)?$/.test(t.pathname) || !/^#p=/.test(t.hash)) return new Response('bad request', { status: 400 });
  if (!hasBrowser(env)) return new Response('no BROWSER binding', { status: 404 });
  let res;
  try { res = await env.BROWSER.quickAction('screenshot', shotOptions(b.product, b.url)); }
  catch (e) { return new Response(clean((e && e.message) || e), { status: 502, headers: { 'x-merch-threw': '1' } }); }
  if (res instanceof Uint8Array || res instanceof ArrayBuffer) return new Response(res, { headers: { 'content-type': 'image/png' } });
  const h = new Headers({ 'content-type': (res && res.headers && res.headers.get && res.headers.get('content-type')) || 'image/png' });
  const ms = res && res.headers && res.headers.get && res.headers.get('x-browser-ms-used'); if (ms != null) h.set('x-browser-ms-used', ms);
  return new Response(res && res.body, { status: (res && res.status) || 200, headers: h });
}
