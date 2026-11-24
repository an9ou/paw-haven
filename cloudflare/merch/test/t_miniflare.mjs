// Stage 4b: the same Worker in workerd (Miniflare, the global install), with real SQLite Durable Objects, transactionSync, alarms and the
// chunked PNG store. The outside services are Miniflare service bindings to the same fakes (no network). Real time: the cooling-hour
// confirm (60 min + 120 s) is not waited for here; the node suite tests it with the clock.
import fs from 'node:fs';
import path from 'node:path';
import { T, ok, eq, mug, PP, ROOT } from './harness.mjs';
import { fakeStripe, fakePrintful, fakeRender, fakeMail, require } from './fakes.mjs';

function findMiniflare() {
  const roots = [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean));
  for (const r of roots) for (const sub of ['miniflare', 'wrangler/node_modules/miniflare']) { try { return require(path.join(r, sub)); } catch (e) { /* next */ } }
  try { return require('miniflare'); } catch (e) { return null; }
}
const asInit = async (req) => { const h = {}; for (const [k, v] of req.headers) h[k === 'idempotency-key' ? 'Idempotency-Key' : k === 'authorization' ? 'Authorization' : k === 'stripe-version' ? 'Stripe-Version' : k] = v; return { method: req.method, headers: h, body: req.method === 'GET' ? undefined : await req.text() }; };

export async function miniflare() {
  console.log('--- stage 4b: Miniflare (workerd, SQLite Durable Objects, alarms)');
  const MF = findMiniflare();
  if (!MF) { console.log('  SKIP Miniflare is not installed here (NODE_PATH=$(npm root -g)); the node suite covers the logic'); return; }
  await T('X-miniflare', 'workerd: catalog, quote, checkout, the signed webhook, a real alarm renders into MerchPrints (parts), the draft, the signed file, cancel with refund, the cron', async () => {
    const stripe = fakeStripe(), pf = fakePrintful(), rd = fakeRender(), mail = fakeMail();
    const dir = path.join(ROOT, 'cloudflare', 'merch');
    const modules = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => ({ type: 'ESModule', path: path.join(dir, f), contents: fs.readFileSync(path.join(dir, f), 'utf8') }));
    modules.sort((a, b) => (a.path.endsWith('worker.js') ? -1 : b.path.endsWith('worker.js') ? 1 : 0));
    modules.push({ type: 'CommonJS', path: path.join(ROOT, 'merch', 'dist', 'pawprint.js'), contents: fs.readFileSync(path.join(ROOT, 'merch', 'dist', 'pawprint.js'), 'utf8') });
    const svc = (f) => async (req) => { const r = await f(req.url, await asInit(req)); return r; };
    const mf = new MF.Miniflare({ modulesRoot: ROOT, modules, compatibilityDate: '2026-03-24',
      durableObjects: { LEDGER: { className: 'MerchLedger', useSQLite: true }, PRINTS: { className: 'MerchPrints', useSQLite: true } },
      bindings: { MERCH_FROM: '2026-01-01T00:00:00+09:00', MERCH_COUNTRIES: 'all,-uk_eu', MERCH_PROVIDER_MODE: 'live', MERCH_STRIPE_KEY: 'sk_test_fake', MERCH_STRIPE_WEBHOOK_SECRET: stripe.secret,
        MERCH_HASH_KEY: 'hash-key-for-tests', MERCH_FILE_KEY: 'file-key-for-tests', MERCH_ADMIN_KEY: 'admin-key-for-tests-0123', MERCH_PROVIDER_KEY: 'pf', RESEND_API_KEY: 're_test', MERCH_OWNER_TO: 'owner@example.test',
        MERCH_PUBLIC_URL: 'https://merch-api.test' },
      serviceBindings: { STRIPE_FETCH: svc(stripe.fetch), PROVIDER_FETCH: svc(pf.fetch), RENDER_FETCH: svc(rd.fetch), MAIL_FETCH: svc(mail.fetch) } });
    try {
      const call = async (m, p, body, headers) => { const r = await mf.dispatchFetch('https://merch-api.test' + p, { method: m, headers: Object.assign({ 'content-type': 'application/json', 'CF-Connecting-IP': '10.70.0.1' }, headers || {}), body: body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { j = null; } return { status: r.status, json: j, text: t, headers: r.headers }; };
      const cat = await call('GET', '/merch/catalog'); ok(cat.status === 200 && !cat.json.shut && cat.json.art_vers[0] === PP.ART_VER, 'catalog in workerd (PawPrint loaded lazily in the ledger): ' + cat.text.slice(0, 200));
      const q = await call('POST', '/merch/quote', { country: 'US', lines: [mug(0)] }); ok(q.status === 200 && q.json.total === 2498, 'quote');
      const c = await call('POST', '/merch/checkout', { country: 'US', lines: [mug(0)], expect_total: 2498, art_ver: PP.ART_VER, nonce: 'mf-nonce-0001', agree: true }); ok(c.status === 200, 'checkout ' + c.text);
      const id = c.json.order, cs = stripe.pay(Array.from(stripe.sessions.keys())[0]);
      const e = await stripe.event('checkout.session.completed', { id: cs.id, payment_status: 'paid', metadata: cs.metadata });
      const h = await call('POST', '/merch/webhook/stripe', e.raw, { 'stripe-signature': e.sig }); ok(h.status === 200, 'webhook ' + h.text);
      let page; for (let i = 0; i < 60; i++) { page = (await call('GET', '/merch/order/' + id)).json; if (page.lines[0].status === 'drafted') break; await new Promise((r) => setTimeout(r, 100)); }
      eq([page.status, page.lines[0].status, page.can_cancel], ['paid', 'drafted', true], 'a real alarm rendered and drafted it');
      const show = await call('GET', '/merch/admin/order/' + id, null, { authorization: 'Bearer admin-key-for-tests-0123' }); ok(show.status === 200, show.text.slice(0, 200));
      const f = await mf.dispatchFetch(show.json.lines[0].file_url); const buf = new Uint8Array(await f.arrayBuffer());
      ok(f.status === 200 && buf.length === show.json.lines[0].file_bytes && buf.length > 2 * (1 << 20), 'the PNG (over 2 MB, kept in 1 MB parts) comes back whole from a SQLite Durable Object: ' + buf.length);
      ok(pf.orders.size === 1 && Array.from(pf.orders.values())[0].status === 'draft', 'a Printful draft');
      const x = await call('POST', '/merch/order/' + id + '/cancel', {}); eq([x.status, x.json.status, x.json.refund], [200, 'cancelled', 'done'], 'cancel in the hour');
      ok(stripe.refunds.length === 1 && stripe.refunds[0].amount === 2498 && Array.from(pf.orders.values())[0].deleted, 'refunded, draft deleted');
      const w = await mf.getWorker(); if (w && typeof w.scheduled === 'function') { const s = await w.scheduled({ cron: '*/10 * * * *' }); ok(s && s.outcome === 'ok', 'the cron ran: ' + JSON.stringify(s)); }
    } finally { await mf.dispose(); }
  });
}
