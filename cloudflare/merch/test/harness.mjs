// The merch_worker harness: one fresh "world" per test (its own ledger, prints, fakes and clock), the call helpers, time travel.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker, { MerchLedger, MerchPrints } from '../worker.js';
import { namespace, fakeStripe, fakePrintful, fakeRender, fakeMail, require } from './fakes.mjs';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const PP = require(path.join(ROOT, 'merch', 'dist', 'pawprint.js'));
const SAMPLES = require(path.join(ROOT, 'merch', 'sample_dogs.js'))(PP);
export const DOG = SAMPLES.map((d) => d.r);              // akita Mochi, dane Duke, dachs Noodle, golden, corgi D'Artagnan, newborn Bo, black lab, samoyed Zoë
export const R = DOG.map((r) => PP.merchEncode(r));       // one-dog recipes
export const MIN = 60e3, HOUR = 36e5, DAY = 864e5;
export const T0 = Date.parse('2026-12-01T10:00:00+09:00');

let passes = 0, fails = 0; const rows = new Map(); let only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
export const stats = () => ({ passes, fails, rows });
export function ok(c, m) { if (!c) throw new Error(m); }
export function eq(a, b, m) { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(m + ': got ' + JSON.stringify(a) + ', want ' + JSON.stringify(b)); }
export async function T(id, name, fn) {
  if (only && !only.test(id + ' ' + name)) return;
  try { await fn(); passes++; rows.set(id, 'pass'); console.log('  ok   ' + id + '  ' + name); }
  catch (e) { fails++; rows.set(id, 'FAIL'); console.log('  FAIL ' + id + '  ' + name + '\n       ' + String((e && e.stack) || e).split('\n').slice(0, 3).join('\n       ')); }
}

export const mug = (i, o) => Object.assign({ recipe: R[i || 0], product: 'mug', colour: 'white', pose: 'stand', name_on: false, qty: 1 }, o || {});
export const tee = (i, o) => Object.assign({ recipe: R[i || 0], product: 'tee', colour: 'navy', size: 'M', pose: 'sit', name_on: true, qty: 1 }, o || {});

let ipN = 0, nonceN = 0;
export async function world(o) {
  o = o || {};
  const clock = { t: o.t || T0 };
  const stripe = fakeStripe(), pf = fakePrintful(), rd = fakeRender(), mail = fakeMail();
  const env = Object.assign({ NOW: () => clock.t, MERCH_FROM: '2026-11-25T00:00:00+09:00', MERCH_COUNTRIES: 'all,-uk_eu,-BR,-KR', MERCH_PRODUCTS: 'mug,tee', MERCH_DAY_CAP: '10',
    MERCH_PROVIDER_MODE: 'live', MERCH_STRIPE_KEY: 'sk_test_fake', MERCH_STRIPE_WEBHOOK_SECRET: stripe.secret, MERCH_HASH_KEY: 'hash-key-for-tests', MERCH_FILE_KEY: 'file-key-for-tests',
    MERCH_ADMIN_KEY: 'admin-key-for-tests-0123', MERCH_PROVIDER_KEY: 'pf-test-key', RESEND_API_KEY: 're_test', MERCH_OWNER_TO: 'owner@example.test',
    STRIPE_FETCH: stripe.fetch, PROVIDER_FETCH: pf.fetch, RENDER_FETCH: rd.fetch, MAIL_FETCH: mail.fetch, MERCH_TIMEOUT_MS: '150', PAWPRINT: PP }, o.env || {});
  for (const k of Object.keys(env)) if (env[k] === undefined) delete env[k];
  env.LEDGER = namespace(MerchLedger, env); env.PRINTS = namespace(MerchPrints, env);
  env.ASSETS = { fetch: async (r) => new Response('<!doctype html>print page ' + new URL(r.url).pathname, { headers: { 'content-type': 'text/html' } }) };
  const stub = () => env.LEDGER.get('ledger');
  const w = { env, clock, stripe, pf, rd, mail }; stripe.now = () => clock.t;
  w.L = () => stub().obj;
  w.state = () => stub().state;
  w.init = async () => { await w.L().init(); return w.L(); };
  w.q = (s, ...a) => w.L().q(s, ...a);
  w.one = (s, ...a) => w.L().one(s, ...a);
  w.order = (id) => w.L().order(id);
  w.lines = (id) => w.L().lines(id);
  w.raw = async (method, p, body, headers) => {
    const h = Object.assign({ 'CF-Connecting-IP': '10.9.' + ((++ipN >> 8) & 255) + '.' + (ipN & 255) }, headers || {});
    let b; if (body !== undefined && body !== null) { b = typeof body === 'string' ? body : JSON.stringify(body); if (!h['content-type']) h['content-type'] = 'application/json'; }
    return worker.fetch(new Request('https://merch-api.test' + p, { method, headers: h, body: method === 'GET' || method === 'OPTIONS' ? undefined : b }), env, { waitUntil() {} });
  };
  w.call = async (method, p, body, headers) => { const res = await w.raw(method, p, body, headers); const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch (e) { json = null; } return { status: res.status, json, text, headers: res.headers }; };
  w.admin = (method, p, body, key) => w.call(method, '/merch/admin/' + p, body, { authorization: 'Bearer ' + (key || env.MERCH_ADMIN_KEY) });
  w.hook = async (type, object, opt) => { const e = await stripe.event(type, object, Object.assign({ now: clock.t }, opt || {})); const r = await w.call('POST', '/merch/webhook/stripe', e.raw, { 'stripe-signature': e.sig, 'content-type': 'application/json' }); r.eventId = e.id; r.raw = e.raw; r.sig = e.sig; return r; };
  w.phook = async (body, headers) => w.call('POST', '/merch/webhook/provider', body, Object.assign({ 'content-type': 'application/json' }, headers || {}));
  // time travel: fire the ledger's alarms in order up to now + ms
  w.advance = async (ms) => {
    await w.init(); const target = clock.t + (ms || 0), st = w.state();
    for (let i = 0; i < 2000; i++) { const a = st.alarmAt; if (a == null || a > target) break; clock.t = Math.max(clock.t, a); st.alarmAt = null; await w.L().alarm(); }
    clock.t = target;
  };
  w.basket = (lines, country) => ({ country: country || 'US', lines });
  w.quote = (lines, country) => w.call('POST', '/merch/quote', w.basket(lines, country));
  w.checkout = async (lines, country, extra) => {
    const q = await w.quote(lines, country); if (q.status !== 200) return q;
    return w.call('POST', '/merch/checkout', Object.assign({ country: country || 'US', lines, expect_total: q.json.total, art_ver: PP.ART_VER, nonce: 'nonce-' + (++nonceN) + '-abcdef', agree: true, lang: 'en' }, extra || {}));
  };
  w.sid = (id) => w.order(id).stripe_session;
  w.newOrder = async (lines, country, extra) => { const r = await w.checkout(lines || [mug(0)], country, extra); ok(r.status === 200, 'checkout: ' + r.status + ' ' + r.text); return r.json.order; };
  w.pay = async (id, po, type) => { const cs = stripe.pay(w.sid(id), po); return w.hook(type || 'checkout.session.completed', { id: cs.id, object: 'checkout.session', payment_status: cs.payment_status, metadata: cs.metadata }); };
  w.paidOrder = async (lines, country, po) => { const id = await w.newOrder(lines, country); const r = await w.pay(id, po); ok(r.status === 200, 'pay webhook ' + r.status + ' ' + r.text); return id; };
  // paid, every line rendered and drafted (inside the hour)
  w.drafted = async (lines, country) => { const id = await w.paidOrder(lines, country); await w.advance(5 * MIN); ok(w.order(id).provider_order, 'drafted: ' + JSON.stringify(w.order(id).status) + ' ' + w.lines(id).map((l) => l.status)); return id; };
  w.confirmedOrder = async (lines, country) => { const id = await w.drafted(lines, country); await w.advance(60 * MIN); ok(w.order(id).status === 'confirmed', 'confirmed: ' + w.order(id).status + ' ' + w.order(id).hold); return id; };
  w.pfOrder = (id) => w.pf.orders.get(w.order(id).provider_order);
  w.mails = (re) => mail.sent.filter((m) => re.test(m.key) || re.test(m.subject));
  w.owner = (re) => mail.sent.filter((m) => m.to === env.MERCH_OWNER_TO && (!re || re.test(m.subject)));
  w.refundsAt = () => stripe.refunds;
  return w;
}
