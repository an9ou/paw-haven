// Part 9, C1: the real network path for Stripe and Resend (docs/design/merch/SANDBOX.md part C). util.js netOf(seam, key): the injected seam
// when set, else the global fetch ONLY on Cloudflare's runtime and ONLY with the key. Node rows: there is never a global path here, so nothing
// is called without a seam. Miniflare rows (workerd, where the global path exists): Miniflare's outboundService answers every global fetch with
// the same fakes, so nothing leaves the machine; anything that is not api.stripe.com or api.resend.com is a failure.
import fs from 'node:fs';
import path from 'node:path';
import { T, ok, eq, world, mug, PP, ROOT, MIN, HOUR } from './harness.mjs';
import { fakeStripe, fakePrintful, fakeRender, fakeMail, require } from './fakes.mjs';
import { netOf, onWorkers, call } from '../util.js';
import * as stripe from '../stripe.js';
import * as mail from '../mail.js';
import { providerReady } from '../provider_printful.js';

// a global fetch that records every call: Node must never reach it
function spyGlobal() {
  const was = globalThis.fetch, calls = [];
  globalThis.fetch = async (u) => { calls.push(String(u && u.url ? u.url : u)); throw new Error('the global fetch was called in Node: ' + u); };
  return { calls, restore: () => { globalThis.fetch = was; } };
}
const NO_SEAMS = { STRIPE_FETCH: undefined, MAIL_FETCH: undefined };

export async function net() {
  console.log('--- part 9 C1: the network of Stripe and Resend (util.js netOf)');
  await T('C1-node', 'in Node, with every key and no seam, nothing is called: no global path (Stripe, Resend, Printful), checkout refused, emails not_set_up', async () => {
    const g = spyGlobal();
    try {
      ok(onWorkers() === false, 'Node is not the Workers runtime');
      ok(netOf(null, 'rk_test_dummy') === null && netOf(undefined, 're_test_dummy') === null, 'netOf: no seam in Node = no network, key or not');
      const seam = async () => new Response('{}'); ok(netOf(seam, null) === seam, 'netOf: the seam when set (as before)');
      const env = { MERCH_STRIPE_KEY: 'rk_test_dummy', MERCH_STRIPE_WEBHOOK_SECRET: 'whsec_dummy', RESEND_API_KEY: 're_test_dummy', MERCH_OWNER_TO: 'owner@example.test', MERCH_PROVIDER_KEY: 'pf_dummy' };
      ok(!stripe.stripeReady(env) && !providerReady(env), 'Stripe and the printer are not ready');
      eq((await stripe.getSession(env, 'cs_test_x')).error, 'not_set_up', 'a Stripe read answers not_set_up');
      eq((await stripe.refund(env, 'pi_x', 100, 'mr_x', 'mo_x')).error, 'not_set_up', 'a refund answers not_set_up');
      eq((await mail.send(env, 'buyer@example.test', 'thanks', { id: 'mo_x', lines: [], totals: {} }, 'k1')).why, 'not_set_up', 'a buyer email: not_set_up');
      eq((await mail.owner(env, 'mo_x', 'review', 'n', 'k2')).why, 'not_set_up', 'an owner email: not_set_up');
      const w = await world({ env: NO_SEAMS });
      ok((await w.call('GET', '/merch/catalog')).json.shut === true, 'the catalog is shut');
      const q = await w.quote([mug(0)]);
      const c = await w.call('POST', '/merch/checkout', { country: 'US', lines: [mug(0)], expect_total: q.json.total, art_ver: PP.ART_VER, nonce: 'c1-node-nonce-01', agree: true });
      eq([c.status, c.json.error], [503, 'merch_closed'], 'checkout refused');
      ok(w.stripe.calls.length === 0 && w.mail.calls === 0, 'the fakes were not called either');
      eq(g.calls, [], 'the global fetch was never called');
    } finally { g.restore(); }
  });
  await T('C1-live-key', 'the test Worker (MERCH_TEST=1) refuses sk_live / rk_live: not ready, and no Stripe call is ever made with one, even through the seam; the live Worker is unchanged', async () => {
    for (const key of ['sk_live_dummy', 'rk_live_dummy']) {
      const w = await world({ env: { MERCH_TEST: '1', MERCH_PROVIDER_MODE: 'draft', MERCH_STRIPE_KEY: key } });
      ok(!stripe.stripeReady(w.env), key + ': not ready');
      ok((await w.call('GET', '/merch/catalog')).json.shut === true, key + ': the catalog is shut');
      eq((await stripe.getSession(w.env, 'cs_test_x')).error, 'not_set_up', key + ': a read is refused');
      eq((await stripe.refund(w.env, 'pi_x', 100, 'mr_x', 'mo_x')).error, 'not_set_up', key + ': a refund is refused');
      eq(w.stripe.calls.length, 0, key + ': no call reached Stripe');
    }
    const t = await world({ env: { MERCH_TEST: '1', MERCH_PROVIDER_MODE: 'draft', MERCH_STRIPE_KEY: 'rk_test_dummy' } });
    ok(stripe.stripeReady(t.env) && (await t.call('GET', '/merch/catalog')).json.shut === false, 'a test key on the test Worker: open');
    const l = await world({ env: { MERCH_STRIPE_KEY: 'rk_live_dummy' } });
    ok(stripe.stripeReady(l.env), 'the live Worker takes a live key (its rules are unchanged)');
  });
  await T('C1-throw', 'a thrown network error (fetch rejects) is handled like a 5xx: checkout says it could not reach the payment page and keeps nothing; a refund and an email are tried again, once each', async () => {
    const r = await call(async () => { throw new TypeError('Network connection lost.'); }, 'https://api.stripe.com/v1/x', {}, 1000);
    ok(r.ok === false && r.status === 0 && !r.timeout && /Network connection lost/.test(r.error), 'call(): status 0, not ok, never a throw ' + JSON.stringify(r));
    ok(stripe.refusedForGood(r) === null, 'never "refused for good" (a 5xx is not either)');
    // checkout: the same answer as a 500 from Stripe
    const ans = [];
    for (const how of ['throw', '500']) {
      const w = await world(), real = w.env.STRIPE_FETCH; let n = 1;
      w.env.STRIPE_FETCH = async (u, i) => { if (n > 0 && /\/v1\/checkout\/sessions$/.test(u) && i.method === 'POST') { n--; if (how === 'throw') throw new TypeError('Network connection lost.'); w.stripe.fail.create = 1; } return real(u, i); };
      const c = await w.checkout([mug(0)]);
      ans.push([c.status, c.json.error, c.json.say, w.q('select id from merch_orders').length]);
    }
    eq(ans[0], [503, 'busy', "We couldn't reach the payment page. Nothing was paid.", 0], 'a thrown create: busy, nothing kept');
    eq(ans[0], ans[1], 'the same as a 500');
    // a refund: retried with the same key, done once
    const x = await world(), xr = x.env.STRIPE_FETCH; const j = await x.paidOrder([mug(0)]); let k = 1;
    x.env.STRIPE_FETCH = async (u, i) => { if (k > 0 && /\/v1\/refunds$/.test(u) && i.method === 'POST') { k--; throw new TypeError('Network connection lost.'); } return xr(u, i); };
    const cn = await x.call('POST', '/merch/order/' + j + '/cancel', {}); ok(cn.status === 200 && x.order(j).status === 'cancelled', 'the cancel is written ' + cn.text);
    ok(x.one('select status from merch_refunds where order_id = ?', j).status !== 'done', 'the refund is not done yet');
    await x.advance(10 * MIN); ok(x.stripe.refunds.length === 1 && x.one('select status from merch_refunds where order_id = ?', j).status === 'done', 'the refund was retried: one refund');
    // an email: the row stays queued (not failed, no "mail failed" owner email) and goes on a later try
    const m = await world(), mr = m.env.MAIL_FETCH; let e = 1;
    m.env.MAIL_FETCH = async (u, i) => { if (e > 0) { e--; throw new TypeError('Network connection lost.'); } return mr(u, i); };
    const id = await m.paidOrder([mug(0)]), row = () => m.one('select status, tries, last_error from merch_outbox where id = ?', 'me_' + id + '_thanks');
    eq([row().status, row().tries, row().last_error], ['queued', 1, 'error'], 'the thanks email: queued for a retry (like a 500)');
    await m.advance(2 * HOUR); ok(row().status === 'sent' && m.mails(/_thanks$/).length === 1 && !m.owner(/mail_failed/).length, 'sent on the next try, once');
  });
  await T('C1-timeout', 'a call that never answers: "timeout" at the limit, and the request is aborted (no hung subrequest); an answer that came is read as before', async () => {
    let sig = null;
    const r = await call((u, i) => { sig = i.signal; return new Promise(() => {}); }, 'https://api.resend.com/emails', { method: 'POST' }, 50);
    ok(r.timeout === true && r.status === 0 && sig && sig.aborted === true, 'timed out and aborted ' + JSON.stringify(r));
    const s = await call(async (u, i) => { sig = i.signal; return new Response('{"id":"x"}'); }, 'https://api.resend.com/emails', { method: 'POST' }, 50);
    await new Promise((res) => setTimeout(res, 80));
    ok(s.ok && s.data.id === 'x' && sig.aborted === false, 'an answer: never aborted');
  });
  await miniflareNet();
}

/* ---------------- workerd: the global path ---------------- */
function findMiniflare() {
  const roots = [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean));
  for (const r of roots) for (const sub of ['miniflare', 'wrangler/node_modules/miniflare']) { try { return require(path.join(r, sub)); } catch (e) { /* next */ } }
  try { return require('miniflare'); } catch (e) { return null; }
}
// a Request -> the init the fakes read (header names as the code writes them)
const NAMES = { 'idempotency-key': 'Idempotency-Key', authorization: 'Authorization', 'stripe-version': 'Stripe-Version', 'content-type': 'Content-Type' };
async function seen(req) { const h = {}; for (const [k, v] of req.headers) h[NAMES[k] || k] = v; return { url: req.url, method: req.method, headers: h, body: req.method === 'GET' ? '' : await req.text() }; }
function modules() {
  const dir = path.join(ROOT, 'cloudflare', 'merch');
  const m = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => ({ type: 'ESModule', path: path.join(dir, f), contents: fs.readFileSync(path.join(dir, f), 'utf8') }));
  m.sort((a, b) => (a.path.endsWith('worker.js') ? -1 : b.path.endsWith('worker.js') ? 1 : 0));
  m.push({ type: 'CommonJS', path: path.join(ROOT, 'merch', 'dist', 'pawprint.js'), contents: fs.readFileSync(path.join(ROOT, 'merch', 'dist', 'pawprint.js'), 'utf8') });
  return m;
}
// one workerd Worker: every seam but Stripe's and Resend's is a service binding to a fake (the printer and the renderer are not what C1 is
// about); `out` sees every global fetch. bind: extra bindings (undefined removes one)
async function mfWorld(MF, bind, outbound) {
  const stripe = fakeStripe(), pf = fakePrintful(), rd = fakeRender(), mailF = fakeMail(), out = [];
  const svc = (f) => async (req) => { const s = await seen(req); return f(s.url, { method: s.method, headers: s.headers, body: s.method === 'GET' ? undefined : s.body }); };
  const bindings = Object.assign({ MERCH_FROM: '2026-01-01T00:00:00+09:00', MERCH_COUNTRIES: 'all,-uk_eu', MERCH_PROVIDER_MODE: 'draft', MERCH_STRIPE_KEY: 'rk_test_dummy', MERCH_STRIPE_WEBHOOK_SECRET: stripe.secret,
    MERCH_HASH_KEY: 'hash-key-for-tests', MERCH_FILE_KEY: 'file-key-for-tests', MERCH_ADMIN_KEY: 'admin-key-for-tests-0123', MERCH_PROVIDER_KEY: 'pf_dummy', RESEND_API_KEY: 're_test_dummy',
    MERCH_OWNER_TO: 'owner@example.test', MERCH_PUBLIC_URL: 'https://merch-api.test' }, bind || {});
  for (const k of Object.keys(bindings)) if (bindings[k] === undefined) delete bindings[k];
  const mf = new MF.Miniflare({ modulesRoot: ROOT, modules: modules(), compatibilityDate: '2026-03-24',
    durableObjects: { LEDGER: { className: 'MerchLedger', useSQLite: true }, PRINTS: { className: 'MerchPrints', useSQLite: true } },
    bindings, serviceBindings: { PROVIDER_FETCH: svc(pf.fetch), RENDER_FETCH: svc(rd.fetch) },
    // the global fetch of the Worker and its Durable Objects: answered here, nothing leaves the machine
    outboundService: async (req) => {
      const s = await seen(req); out.push(s); const host = new URL(s.url).host, init = { method: s.method, headers: s.headers, body: s.method === 'GET' ? undefined : s.body };
      if (outbound) { const r = await outbound(s, host); if (r) return r; }
      if (host === 'api.stripe.com') return stripe.fetch(s.url, init);
      if (host === 'api.resend.com') return mailF.fetch(s.url, init);
      return new Response('{"error":"not a host this Worker calls"}', { status: 599 });
    } });
  const call = async (m, p, body, headers) => { const r = await mf.dispatchFetch('https://merch-api.test' + p, { method: m, headers: Object.assign({ 'content-type': 'application/json', 'CF-Connecting-IP': '10.71.0.1' }, headers || {}), body: body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { j = null; } return { status: r.status, json: j, text: t }; };
  let nn = 0; const checkout = async () => { const q = await call('POST', '/merch/quote', { country: 'US', lines: [mug(0)] }); return call('POST', '/merch/checkout', { country: 'US', lines: [mug(0)], expect_total: q.json && q.json.total, art_ver: PP.ART_VER, nonce: 'c1-mf-nonce-' + (++nn) + '-abc', agree: true }); };
  return { mf, stripe, pf, mail: mailF, out, call, checkout };
}
const until = async (f, ms) => { for (let i = 0; i < (ms || 6000) / 100; i++) { if (await f()) return true; await new Promise((r) => setTimeout(r, 100)); } return false; };

async function miniflareNet() {
  const MF = findMiniflare();
  if (!MF) { console.log('  SKIP C1 workerd rows: Miniflare is not installed here (NODE_PATH=$(npm root -g))'); return; }
  await T('C1-mf-global', 'workerd, a key and no seam: Stripe and Resend calls reach the global fetch with the right URL, method, headers and body (Miniflare answers them)', async () => {
    let fail = null; // 'throw' | '502': how the next Stripe create fails
    const w = await mfWorld(MF, {}, async (s, host) => {
      if (host === 'api.stripe.com' && fail && s.method === 'POST' && /\/v1\/checkout\/sessions$/.test(s.url)) { const f = fail; fail = null; if (f === 'throw') throw new Error('network down'); return new Response('{"error":{"message":"bad gateway"}}', { status: 502 }); }
      return null;
    });
    try {
      const cat = await w.call('GET', '/merch/catalog'); ok(cat.status === 200 && cat.json.shut === false, 'the catalog is open: Stripe is ready through the global path ' + cat.text.slice(0, 120));
      // a thrown network error and a 502: the same kind answer, nothing kept
      for (const f of ['throw', '502']) { fail = f; const c = await w.checkout(); eq([c.status, c.json && c.json.error, c.json && c.json.say], [503, 'busy', "We couldn't reach the payment page. Nothing was paid."], 'Stripe ' + f + ': ' + c.text); }
      const c = await w.checkout(); ok(c.status === 200 && /^mo_/.test(c.json.order) && /^https:\/\/checkout\.stripe\.test\/c\/pay\/cs_test_/.test(c.json.url), 'checkout through the global path ' + c.text);
      const id = c.json.order, cr = w.out.filter((x) => /\/v1\/checkout\/sessions$/.test(x.url) && x.method === 'POST').pop();
      eq([cr.url, cr.headers.Authorization, cr.headers['Stripe-Version'], cr.headers['Content-Type'], cr.headers['Idempotency-Key']],
        ['https://api.stripe.com/v1/checkout/sessions', 'Bearer rk_test_dummy', stripe.STRIPE_VERSION, 'application/x-www-form-urlencoded', 'mc_' + id], 'the create: URL, key, version, form, idempotency key');
      const form = new URLSearchParams(cr.body);
      ok(form.get('client_reference_id') === id && form.get('mode') === 'payment' && form.get('line_items[0][price_data][unit_amount]') === '1999' && form.get('shipping_address_collection[allowed_countries][0]') === 'US' && /\/merch\/\?new=1#\/order\/mo_/.test(form.get('success_url')), 'the body is form-encoded: ' + cr.body.slice(0, 160));
      // paid: the webhook re-reads the session (a GET) and the thanks email goes to Resend
      const cs = w.stripe.pay(Array.from(w.stripe.sessions.keys()).pop());
      const e = await w.stripe.event('checkout.session.completed', { id: cs.id, payment_status: 'paid', metadata: cs.metadata });
      const h = await w.call('POST', '/merch/webhook/stripe', e.raw, { 'stripe-signature': e.sig }); ok(h.status === 200, 'webhook ' + h.text);
      const get = w.out.find((x) => x.method === 'GET' && x.url.startsWith('https://api.stripe.com/v1/checkout/sessions/' + cs.id));
      ok(get && get.headers.Authorization === 'Bearer rk_test_dummy' && get.headers['Stripe-Version'] === stripe.STRIPE_VERSION && !get.headers['Content-Type'] && !get.headers['Idempotency-Key'] && get.body === '', 'the re-read: a plain GET with the key and the version ' + JSON.stringify(get));
      ok(await until(() => w.mail.sent.length > 0), 'an email was sent through the global path');
      const m = w.out.find((x) => x.url === 'https://api.resend.com/emails'), b = JSON.parse(m.body);
      eq([m.method, m.headers.Authorization, m.headers['Content-Type'], m.headers['Idempotency-Key']], ['POST', 'Bearer re_test_dummy', 'application/json', 'me_' + id + '_thanks'], 'Resend: method, key, JSON, idempotency key');
      ok(b.to.length === 1 && b.to[0] === 'buyer@example.test' && b.from === 'orders@doodledoggo.app' && b.reply_to === mail.CONTACT && typeof b.subject === 'string' && b.subject && /mo_/.test(b.text) && typeof b.html === 'string' && b.html.length > 100, 'Resend: the JSON body ' + m.body.slice(0, 160));
      const hosts = new Set(w.out.map((x) => new URL(x.url).host));
      eq(Array.from(hosts).sort(), ['api.resend.com', 'api.stripe.com'], 'no other host was called (the printer and the renderer go through their seams)');
      ok(!w.out.some((x) => /sk_live|rk_live/.test(JSON.stringify(x.headers))), 'never a live key');
    } finally { await w.mf.dispose(); }
  });
  await T('C1-mf-refused', 'workerd: with no key nothing is called; on the test Worker an sk_live or rk_live key is refused (shut, and even a signed webhook makes no Stripe call); a test key opens it', async () => {
    const rows = [['no keys', { MERCH_STRIPE_KEY: undefined, RESEND_API_KEY: undefined }, true], ['sk_live on MERCH_TEST=1', { MERCH_TEST: '1', MERCH_STRIPE_KEY: 'sk_live_dummy' }, true],
      ['rk_live on MERCH_TEST=1', { MERCH_TEST: '1', MERCH_STRIPE_KEY: 'rk_live_dummy' }, true], ['rk_test on MERCH_TEST=1', { MERCH_TEST: '1', MERCH_STRIPE_KEY: 'rk_test_dummy' }, false]];
    for (const [name, bind, shut] of rows) {
      const w = await mfWorld(MF, bind);
      try {
        const cat = await w.call('GET', '/merch/catalog'); eq(cat.json && cat.json.shut, shut, name + ': shut');
        if (!shut) { ok(w.out.length === 0, name + ': the catalog calls nobody'); continue; }
        const c = await w.checkout(); eq([c.status, c.json && c.json.error], [503, 'merch_closed'], name + ': checkout refused');
        const e = await w.stripe.event('checkout.session.completed', { id: 'cs_test_nobody', payment_status: 'paid', metadata: { merch: 'mo_' + 'A'.repeat(22) } });
        await w.call('POST', '/merch/webhook/stripe', e.raw, { 'stripe-signature': e.sig });
        await w.mf.getWorker().then((x) => x.scheduled({ cron: '*/10 * * * *' })).catch(() => null);
        // (the cron's nightly job may email the owner where a Resend key is set: that is Resend, not Stripe)
        eq(w.out.filter((x) => name === 'no keys' || new URL(x.url).host === 'api.stripe.com').map((x) => x.method + ' ' + x.url), [], name + (name === 'no keys' ? ': no outside call at all' : ': no Stripe call at all'));
      } finally { await w.mf.dispose(); }
    }
  });
}
