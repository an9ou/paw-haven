// doodle-doggo-merch: the merch order Worker (docs/design/merch/TRANSACTIONS.md, PART3.md). Never touches cloudflare/worker.js.
// This front Worker stays small (Free: 10 ms of CPU a request): CORS, the signed file route and the print pages; every order route goes to the
// ledger Durable Object, which holds the tables and loads PawPrint. Webhooks and files send no CORS headers.
export { MerchLedger } from './ledger.js';
export { MerchPrints } from './prints.js';
export { MerchRender } from './resvg.js'; // part 4: the resvg fallback object (nothing loads until its first render)
import { json, fail, hmacHex, same, nowOf } from './util.js';
import { gate } from './render.js';
// part 4, MERCH_RENDER_VIA = "worker": the self service binding SELF points at this entrypoint (never routed from the internet); it calls Browser Run
// and streams the answer back un-decoded (render.js gate)
export const RenderGate = { fetch: (req, env) => gate(req, env) };

const LIVE_ORIGINS = ['https://doodledoggo.app', 'https://www.doodledoggo.app'];
const TEST_ORIGIN = 'https://test.doodledoggo.app';
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;
export function corsFor(origin, env) {
  if (!origin) return null;
  const ok = env.MERCH_TEST === '1' ? origin === TEST_ORIGIN : LIVE_ORIGINS.includes(origin) || LOCAL.test(origin);
  if (!ok) return null;
  // fourth review (R4-m4): the test copy also sends the shared test token (X-Merch-Test-Token); the live Worker never asks for it
  return { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': env.MERCH_TEST === '1' ? 'Content-Type, X-Merch-Test-Token' : 'Content-Type', 'Access-Control-Max-Age': '86400' };
}
const ledger = (env) => env.LEDGER.get(env.LEDGER.idFromName('ledger'));

export default {
  async fetch(req, env, ctx) {
    const u = new URL(req.url), p = u.pathname, origin = req.headers.get('Origin');
    const noCors = p.startsWith('/merch/webhook/') || p.startsWith('/merch/file/') || p.startsWith('/merch/print/');
    const cors = noCors ? null : corsFor(origin, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: cors ? 204 : 403, headers: cors || {} });
    let res;
    try {
      if (p.startsWith('/merch/print/')) res = env.ASSETS ? await env.ASSETS.fetch(req) : fail('not_found', 404); // static print pages, one folder per ART_VER
      else if (p.startsWith('/merch/file/')) res = await fileRoute(p, env);
      else if (p.startsWith('/merch/') && !p.startsWith('/merch/internal')) {
        const h = new Headers();
        for (const k of ['content-type', 'stripe-signature', 'x-pf-webhook-signature', 'x-pf-signature', 'authorization'].concat(env.MERCH_TEST === '1' ? ['x-merch-test-token'] : [])) { const v = req.headers.get(k); if (v) h.set(k, v); }
        h.set('x-merch-ip', req.headers.get('CF-Connecting-IP') || 'local'); // the client cannot set these: only the ones above are copied
        if (origin) h.set('x-merch-origin', origin);
        const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await req.arrayBuffer();
        res = await ledger(env).fetch(new Request('https://ledger' + p + u.search, { method: req.method, headers: h, body }));
        if (p === '/merch/catalog' && res.status === 200) { res = new Response(res.body, res); res.headers.set('cache-control', 'public, max-age=60'); }
      } else res = fail('not_found', 404);
    } catch (e) { console.error('merch error', String((e && e.message) || e).slice(0, 120)); res = fail('busy', 503); }
    if (cors) { res = new Response(res.body, res); for (const k in cors) res.headers.set(k, cors[k]); }
    return res;
  },
  // one cron (*/10): wakes the ledger (a backstop if an alarm is lost) and, once a JST day after 04:00, the nightly job
  async scheduled(event, env, ctx) {
    const p = ledger(env).fetch('https://ledger/internal/cron', { method: 'POST' }).then((r) => r.text()).catch(() => '');
    if (ctx && ctx.waitUntil) ctx.waitUntil(p);
    return p;
  }
};

// GET /merch/file/<key>/<exp>/<sig>.png: HMAC (MERCH_FILE_KEY) over key + '/' + exp, valid until exp (unix seconds)
async function fileRoute(p, env) {
  const m = /^\/merch\/file\/([A-Za-z0-9_.~-]{1,120})\/(\d{1,12})\/([0-9a-f]{64})\.png$/.exec(p);
  if (!m || !env.MERCH_FILE_KEY) return fail('forbidden', 403);
  const [, key, exp, sig] = m;
  if (!same(sig, await hmacHex(env.MERCH_FILE_KEY, key + '/' + exp))) return fail('forbidden', 403);
  if (Number(exp) * 1000 < nowOf(env)) return fail('expired', 403);
  const shard = key.split('~')[0];
  const r = await env.PRINTS.get(env.PRINTS.idFromName(shard)).fetch('https://prints/get?key=' + encodeURIComponent(key));
  return r.status === 200 ? new Response(r.body, { headers: { 'content-type': 'image/png', 'cache-control': 'private, max-age=3600' } }) : fail('not_found', 404);
}
export { json };
