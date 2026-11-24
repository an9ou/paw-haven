// The Stripe seam (TRANSACTIONS.md 3, 3.2, 4). A real-shaped client (form-encoded, no SDK, Stripe-Version pinned) that only ever talks through
// env.STRIPE_FETCH. Part 3 never calls the global fetch: without STRIPE_FETCH (or without a key) stripeReady() is false and checkout is refused, so
// this Worker can never charge anyone by accident. Part 9 (the sandbox run) decides how the real fetch is wired, with the owner's approval.
import { form, fetcher, call, hmacHex, same, enc } from './util.js';

const BASE = 'https://api.stripe.com/v1';
export const STRIPE_VERSION = '2025-03-31.basil'; // pinned: adaptive_pricing, presentment_details, collected_information exist from here
export const SIG_TOL = 300; // seconds

export function stripeReady(env) {
  if (!fetcher(env.STRIPE_FETCH) || !env.MERCH_STRIPE_KEY || !env.MERCH_STRIPE_WEBHOOK_SECRET) return false;
  // the test Worker (doodle-doggo-merch-test) refuses live keys (TRANSACTIONS 3.3)
  if (env.MERCH_TEST === '1' && /^(sk|rk)_live/.test(String(env.MERCH_STRIPE_KEY))) return false;
  return true;
}
async function req(env, method, path, body, idem) {
  const f = fetcher(env.STRIPE_FETCH); if (!f || !env.MERCH_STRIPE_KEY) return { ok: false, status: 0, data: null, error: 'not_set_up' };
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
    success_url: site + '/merch/order/' + o.id + '?new=1', cancel_url: site + '/merch/?back=' + o.id };
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
