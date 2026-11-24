// The render seam (TRANSACTIONS.md 2 step 7, 6.6; RENDER_FREE.md 8). Part 4 writes the real one (Browser Run's quickAction('screenshot') from the
// Worker or the object, resvg-wasm in MerchPrints as the fallback). Part 3: a Browser-Run-shaped request through env.RENDER_FETCH only:
//   POST https://browser-run.internal/screenshot { url, viewport, screenshotOptions: { omitBackground: true }, waitForSelector: { selector: '#o svg' } }
//   POST https://browser-run.internal/resvg      { url } (the fallback)
// -> { ok: true, png: Uint8Array } | { ok: false, kind: 'daily' | 'rate' | 'error' | 'not_set_up', why }
import { fetcher } from './util.js';

export const renderReady = (env) => !!fetcher(env.RENDER_FETCH);
// tee at 2250x2700 x2, mug 2700x1050 (RENDER_FREE 8)
export const VIEWPORT = { tee: { width: 2250, height: 2700, deviceScaleFactor: 2 }, mug: { width: 2700, height: 1050, deviceScaleFactor: 1 } };

async function go(env, path, body) {
  const f = fetcher(env.RENDER_FETCH); if (!f) return { ok: false, kind: 'not_set_up' };
  let r; try { r = await f('https://browser-run.internal/' + path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }); }
  catch (e) { return { ok: false, kind: 'error', why: 'network' }; }
  if (r.status === 429) { const t = await r.text().catch(() => ''); return { ok: false, kind: /time limit exceeded for today/i.test(t) ? 'daily' : 'rate' }; }
  if (!r.ok) return { ok: false, kind: 'error', why: 'http ' + r.status };
  const png = new Uint8Array(await r.arrayBuffer());
  return { ok: true, png };
}
export const screenshot = (env, product, url) => go(env, 'screenshot', { url, viewport: VIEWPORT[product], screenshotOptions: { omitBackground: true }, waitForSelector: { selector: '#o svg' } });
export const resvg = (env, product, url) => go(env, 'resvg', { url, product });
