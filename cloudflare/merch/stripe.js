// The Stripe client (TRANSACTIONS.md 3, 3.2, 4). Real-shaped (form-encoded, no SDK, Stripe-Version pinned, an Idempotency-Key on every POST
// that makes something). The network (util.js netOf): env.STRIPE_FETCH in the tests (never set in production), else, on Cloudflare's runtime
// only and only with MERCH_STRIPE_KEY, the global fetch to https://api.stripe.com. In Node there is never a global path, so a test without
// STRIPE_FETCH has no Stripe at all. Without a network, a key or the webhook secret, stripeReady() is false and checkout is refused. The test
// Worker (MERCH_TEST=1) refuses sk_live / rk_live keys: stripeReady() is false and no call is ever made with one (part 9, C1).
import { form, netOf, call, hmacHex, same, enc, orderLink } from './util.js';

const BASE = 'https://api.stripe.com/v1';
export const STRIPE_VERSION = '2025-03-31.basil'; // pinned: adaptive_pricing, presentment_details, collected_information exist from here
export const SIG_TOL = 300; // seconds

// the test Worker (doodle-doggo-merch-test) refuses live keys (TRANSACTIONS 3.3)
const liveOnTest = (env) => env.MERCH_TEST === '1' && /^(sk|rk)_live/.test(String(env.MERCH_STRIPE_KEY));
const net = (env) => (liveOnTest(env) ? null : netOf(env.STRIPE_FETCH, env.MERCH_STRIPE_KEY));
export function stripeReady(env) {
  return !!(net(env) && env.MERCH_STRIPE_KEY && env.MERCH_STRIPE_WEBHOOK_SECRET);
}
async function req(env, method, path, body, idem) {
  const f = net(env); if (!f || !env.MERCH_STRIPE_KEY) return { ok: false, status: 0, data: null, error: 'not_set_up' };
  const h = { Authorization: 'Bearer ' + env.MERCH_STRIPE_KEY, 'Stripe-Version': env.MERCH_STRIPE_VERSION || STRIPE_VERSION };
  if (body) h['Content-Type'] = 'application/x-www-form-urlencoded';
  if (idem) h['Idempotency-Key'] = idem;
  return call(f, BASE + path, { method, headers: h, body: body ? form(body) : undefined }, Number(env.MERCH_TIMEOUT_MS) || 20000);
}

// POST /v1/checkout/sessions for an order (TRANSACTIONS 3: one shipping option, only the quoted country, Adaptive Pricing, automatic tax)
export function sessionForm(o, lines, zone, taxBeh, site) {
  const f = { mode: 'payment', locale: 'auto', customer_creation: 'if_required', billing_address_collection: 'auto',
    'shipping_address_collection[allowed_countries][0]': o.country, 'automatic_tax[enabled]': 'true', 'adaptive_pricing[enabled]': 'true',
    'phone_number_collection[enabled]': 'false', 'consent_collection[terms_of_service]': 'required',
    'custom_text[terms_of_service_acceptance][message]': "I'm 18 or over and agree to the Terms of sale. It's printed just for me, so it can't be returned if I change my mind.",
    'custom_text[submit][message]': 'You can cancel within 1 hour of paying, from your order page.',
    client_reference_id: o.id, 'metadata[merch]': o.id, 'payment_intent_data[metadata][merch]': o.id,
    expires_at: Math.floor(o.expires_at / 1000),
    success_url: orderLink(site, o.id, true), cancel_url: String(site).replace(/\/+$/, '') + '/merch/?back=' + o.id }; // the order page: one link form (util.js)
  lines.forEach((l, i) => {
    const k = 'line_items[' + i + ']';
    f[k + '[price_data][currency]'] = 'usd'; f[k + '[price_data][unit_amount]'] = l.unit; f[k + '[price_data][tax_behavior]'] = taxBeh;
    // a generic product name: no dog name, no recipe (TRANSACTIONS 5)
    f[k + '[price_data][product_data][name]'] = l.product === 'tee' ? 'Tee with your dog (' + l.colour_name + ', ' + l.size + ')' : 'Mug with your dog';
    f[k + '[price_data][product_data][tax_code]'] = l.tax_code; f[k + '[quantity]'] = l.qty;
  });
  const s = 'shipping_options[0][shipping_rate_data]';
  Object.assign(f, { [s + '[type]']: 'fixed_amount', [s + '[fixed_amount][amount]']: o.ship_fee, [s + '[fixed_amount][currency]']: 'usd',
    [s + '[display_name]']: o.ship_fee ? 'Standard shipping' : 'Free shipping', [s + '[tax_behavior]']: taxBeh, [s + '[tax_code]']: 'txcd_92010001',
    [s + '[delivery_estimate][minimum][unit]']: 'business_day', [s + '[delivery_estimate][minimum][value]']: zone.eta[0],
    [s + '[delivery_estimate][maximum][unit]']: 'business_day', [s + '[delivery_estimate][maximum][value]']: zone.eta[1] });
  return f;
}
export const createSession = (env, o, f) => req(env, 'POST', '/checkout/sessions', f, 'mc_' + o.id);
export const getSession = (env, sid) => req(env, 'GET', '/checkout/sessions/' + encodeURIComponent(sid) + '?expand[]=line_items', null);
export const expireSession = (env, sid) => req(env, 'POST', '/checkout/sessions/' + encodeURIComponent(sid) + '/expire', {}, null);
export const sessionByPI = (env, pi) => req(env, 'GET', '/checkout/sessions?payment_intent=' + encodeURIComponent(pi) + '&expand[]=data.line_items', null);
export const listRefunds = (env, pi) => req(env, 'GET', '/refunds?payment_intent=' + encodeURIComponent(pi) + '&limit=100', null);
// part 9 (review M2): the payment with its charge, to read what is left to refund (latest_charge.amount - latest_charge.amount_refunded)
export const chargeOf = (env, pi) => req(env, 'GET', '/payment_intents/' + encodeURIComponent(pi) + '?expand[]=latest_charge', null);
// a refund Stripe will never take (review M2): a 400, 402 or 404 (an amount over what is left, a charge already refunded or charged back, a
// payment intent that does not exist, a key sent again with other parameters). Not final: a lock or a key still in use, a rate limit, a 5xx,
// a timeout, a key problem (401/403: the owner hears after 24 hours like any stuck refund).
const AGAIN = ['lock_timeout', 'idempotency_key_in_use', 'rate_limit'];
export function refusedForGood(res) {
  if (!res || res.ok || ![400, 402, 404].includes(res.status)) return null;
  const e = (res.data && res.data.error) || {};
  if (AGAIN.includes(e.code)) return null;
  return { code: String(e.code || e.type || res.status).slice(0, 60), message: String(e.message || '').slice(0, 160) };
}
// a refund in USD cents; the row id is the Idempotency-Key and rides in metadata, so charge.refunded can tell our refunds from Dashboard ones
export const refund = (env, pi, amount, rowId, orderId) => req(env, 'POST', '/refunds', { payment_intent: pi, amount, 'metadata[merch]': orderId, 'metadata[merch_refund]': rowId }, rowId);

// Stripe-Signature: t=<unix s>,v1=<hex HMAC-SHA256 of `${t}.${raw}`>[,v1=...] -> true | 'stale' | false (the house check of cloudflare/worker.js)
export async function sigOk(env, raw, header, nowMs) {
  if (typeof header !== 'string' || header.length > 2000 || !env.MERCH_STRIPE_WEBHOOK_SECRET) return false;
  let t = null; const v1 = [];
  for (const part of header.split(',')) {
    const i = part.indexOf('='); if (i < 0) continue;
    const k = part.slice(0, i).trim(), v = part.slice(i + 1).trim();
    if (k === 't' && /^\d{1,12}$/.test(v)) t = v; else if (k === 'v1' && /^[0-9a-f]{64}$/.test(v)) v1.push(v);
  }
  if (!t || !v1.length) return false;
  const want = await hmacHex(env.MERCH_STRIPE_WEBHOOK_SECRET, t + '.' + raw);
  let good = false; for (const s of v1) if (same(s, want)) good = true;
  if (!good) return false;
  return Math.abs(nowMs / 1000 - Number(t)) <= SIG_TOL ? true : 'stale';
}
export async function signFor(secret, raw, tSec) { return 't=' + tSec + ',v1=' + (await hmacHex(secret, tSec + '.' + raw)); } // tests and tools only
export { enc };
