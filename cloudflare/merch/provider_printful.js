// The print provider (TRANSACTIONS.md 6.7, docs/design/merch/PART5.md): Printful's API v2, built against its published OpenAPI document
// (developers.printful.com/docs/v2-beta/openapi.json, 2.0.0-beta, read 25 Nov 2026) and the replies recorded in test/printful/.
// Why v2: signed webhooks, shipments that name their items by our external id and say "returned" and "delivered", placements with a technique.
// One v1 call stays: v2 cannot cancel a confirmed order, so `cancel` uses v1's DELETE /orders/{id} ("Cancels pending order or draft"), unless
// MERCH_PF_V1_CANCEL is "0" (then the owner cancels in the dashboard; the ledger emails).
// Every call answers
//   { ok: true, data } or { ok: false, kind: 'down' | 'timeout' | 'refused' (items: [item external ids]) | 'address' | 'billing' | 'not_found' | 'cannot' | 'not_set_up' }
// ('down' may carry retry_ms: Printful's Retry-After) and never throws. Nothing here logs the key, a recipient or a reply body.
import { fetcher, call, same, hex, enc } from './util.js';
import { PRODUCTS as CATP, PF_PRODUCTS, PF_VARIANT_IDS, SHIP_COSTS } from './catalog.js';

const BASE = 'https://api.printful.com';
// what each product prints with (v2 placements; mug: the catalog's only print file 'default', sublimation; tee: front_large, DTG, PRINT_FILES.md)
const PLACE = { mug: ['default', 'sublimation'], tee: ['front_large', 'dtg'], stickers: ['default', 'digital'] };
const SHIPPED = ['shipped', 'returned']; // shipment_status of a parcel that left (others: pending, onhold, canceled, packaged, outstock)
const NO_SHIPMENTS = ['draft', 'failed']; // order statuses that cannot have shipments: no second read
const TAKEN = ['pending', 'inprocess', 'onhold', 'partial', 'fulfilled']; // a confirm was taken (mapOrder already turned inreview into pending)
const REV = Object.fromEntries(Object.entries(PF_VARIANT_IDS).map(([k, v]) => [String(v), k]));
export const pfVariant = (pv) => PF_VARIANT_IDS[String(pv || '').replace(/^pf:/, '')] || null;

// The network: env.PROVIDER_FETCH (tests, a service binding), else, on Cloudflare's runtime only and with a key, the global fetch. Node never
// gets the global fetch, so a test without PROVIDER_FETCH has no printer at all (the gate stays shut) and nothing reaches the network.
const onWorkers = () => typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers';
function net(env) {
  const f = fetcher(env.PROVIDER_FETCH); if (f) return f;
  return env.MERCH_PROVIDER_KEY && onWorkers() && typeof fetch === 'function' ? (u, i) => fetch(u, i) : null;
}
// ready = a network and a key; the test Worker (MERCH_TEST=1) never runs live
export const providerReady = (env) => !!(net(env) && env.MERCH_PROVIDER_KEY) && !(env.MERCH_TEST === '1' && env.MERCH_PROVIDER_MODE === 'live');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const money = (c) => (Number(c || 0) / 100).toFixed(2);
const cents = (x) => (x == null || x === '' ? 0 : Math.round(Number(x) * 100));
const ts = (x) => { if (x == null || x === '') return null; const t = typeof x === 'number' ? (x < 1e11 ? x * 1000 : x) : Date.parse(x); return Number.isFinite(t) ? t : null; };

// Retry-After (seconds) -> ms, at most 10 minutes; else X-RateLimit-Reset; else a minute (Rate Limiting, v1 and v2 docs)
function retryMs(h) {
  const g = (k) => (h && typeof h.get === 'function' ? h.get(k) : null);
  const s = Number(g('retry-after')); if (Number.isFinite(s) && s >= 0) return Math.min(600, Math.max(1, s)) * 1000;
  const r = Number(g('x-ratelimit-reset')); if (Number.isFinite(r) && r >= 0) return Math.min(600, Math.max(1, r)) * 1000;
  return 60000;
}
// Printful's error replies -> our kinds. Orders, confirm and webhooks answer { code, result, error: { reason, message } }; some newer v2 routes
// (shipping rates, estimates, files, catalog availability) answer RFC 9457 problem details { type, status, title, detail }. Item problems name
// the item by its place in order_items: "Item 0: ..." (v1 docs) or a pointer "/order_items/0" (v2 docs); a recipient problem starts
// "Recipient: ..." (the estimate's failure_reasons example) or points at /recipient. [the reasons below are from the docs; the exact texts of a
// refused variant, a refused address and a failed charge are still to be recorded with the key: PART5.md]
export function errKind(r, sent) {
  const st = r.status, j = r.data && typeof r.data === 'object' ? r.data : {}, e = j.error && typeof j.error === 'object' ? j.error : {};
  const msg = String(e.message || (typeof j.result === 'string' ? j.result : '') || j.detail || j.details || (typeof j.data === 'string' ? j.data : '') || j.title || r.text || '').slice(0, 500);
  if (!st || st >= 500) return { ok: false, kind: 'down', status: st || 0 };
  if (st === 429) return { ok: false, kind: 'down', status: 429, retry_ms: retryMs(r.headers) };
  if (st === 409) return { ok: false, kind: 'down', status: 409, retry_ms: 5000 }; // "already being updated: try again after the previous update"
  if (st === 401 || st === 403) return { ok: false, kind: 'not_set_up', status: st }; // a wrong, expired or narrow key: like down, and the owner hears at 24 h
  if (st === 404) return { ok: false, kind: 'not_found', status: 404 };
  if (/external[_ ]?id/i.test(msg) && /(in use|already|exist|duplicate|unique)/i.test(msg)) return { ok: false, kind: 'duplicate', status: st }; // OR-13 EXTERNAL_ID_IN_USE
  if (st === 402 || /\b(billing|payment|charg(e|ed|ing)|credit card|insufficient|funds|wallet)\b/i.test(msg)) return { ok: false, kind: 'billing', status: st };
  if (/^\s*recipient\b|\/recipient\b/i.test(msg)) return { ok: false, kind: 'address', status: st };
  const idx = new Set(); for (const m of msg.matchAll(/(?:\bItem (\d+)\s*:|\/order_items\/(\d+))/gi)) idx.add(Number(m[1] != null ? m[1] : m[2]));
  if (idx.size && sent && sent.length) { const items = Array.from(idx).map((i) => sent[i]).filter(Boolean); if (items.length) return { ok: false, kind: 'refused', items, status: st }; }
  if (/\b(address|state code|zip|postal|country code|city)\b|shipping to this (country|region)/i.test(msg)) return { ok: false, kind: 'address', status: st };
  if (/no longer editable|can ?not be (deleted|canceled|cancelled|confirmed|updated)|can't be|not cancell?able|not allowed|OR-1\b/i.test(msg)) return { ok: false, kind: 'cannot', status: st };
  return { ok: false, kind: 'refused', items: [], status: st };
}

async function pf(env, method, path, body, sent) {
  const f = net(env); if (!f || !env.MERCH_PROVIDER_KEY) return { ok: false, kind: 'not_set_up' };
  const h = { Authorization: 'Bearer ' + env.MERCH_PROVIDER_KEY, Accept: 'application/json' };
  if (env.MERCH_PROVIDER_STORE) h['X-PF-Store-Id'] = String(env.MERCH_PROVIDER_STORE); // an account-level token names the store (v1 and v2 docs)
  if (body) h['Content-Type'] = 'application/json';
  const r = await call(f, BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined }, Number(env.MERCH_TIMEOUT_MS) || 25000);
  if (r.timeout) return { ok: false, kind: 'timeout' };
  if (r.ok) return { ok: true, json: r.data, status: r.status };
  return errKind(r, sent);
}
const pollMs = (env) => { const n = Number(env.MERCH_PF_POLL_MS); return Number.isFinite(n) && n >= 0 ? n : 1500; };
const polls = (env) => { const n = Number(env.MERCH_PF_POLLS); return Number.isFinite(n) && n >= 0 ? n : 2; };
const calcOf = (d) => (d && d.costs && d.costs.calculation_status) || 'done';
const CALCULATING = () => ({ ok: false, kind: 'down', why: 'calculating', retry_ms: 60000 }); // a draft whose costs Printful is still working out
const ordPath = (ref) => '/v2/orders/' + (/^\d+$/.test(String(ref)) ? ref : '@' + encodeURIComponent(ref));

function recipientOut(rc) {
  const o = {}; for (const k of ['name', 'company', 'address1', 'address2', 'city', 'state_code', 'country_code', 'zip', 'phone', 'email', 'tax_number']) if (rc && rc[k]) o[k] = String(rc[k]);
  return o;
}
function itemOut(l, ext, url) {
  const p = PLACE[l.product] || PLACE.mug, P = CATP[l.product];
  return { source: 'catalog', catalog_variant_id: pfVariant(l.provider_variant), external_id: ext + '_' + l.line, quantity: l.qty - (l.refunded_qty || 0),
    retail_price: money(l.unit), name: (P && P.label) || l.product, placements: [{ placement: p[0], technique: p[1], layers: [{ type: 'file', url }] }] };
}

// a draft (not charged): our order id as external_id (<order>, <order>-d<n> after a deleted draft, <order>-r<n> for a reprint), each item
// <ext>_<line>, the print file as a signed URL, retail costs from our prices (Printful's US tax uses them: PROVIDERS.md 1.1)
export async function createDraft(env, o, lines, recipient, fileUrls, extId) {
  const ext = String(extId || o.id);
  if (ext.length > 32) return { ok: false, kind: 'refused', items: [] }; // "External ID can be up to 32 characters" (v1 docs, Orders API)
  const unknown = lines.filter((l) => !pfVariant(l.provider_variant)).map((l) => ext + '_' + l.line);
  if (unknown.length) return { ok: false, kind: 'refused', items: unknown }; // never a placeholder variant at Printful
  const items = lines.map((l) => itemOut(l, ext, fileUrls[l.line]));
  const body = { external_id: ext, shipping: 'STANDARD', recipient: recipientOut(recipient), order_items: items,
    retail_costs: { currency: 'USD', discount: '0.00', shipping: money(o.ship_fee), tax: money(o.tax) } };
  const r = await pf(env, 'POST', '/v2/orders', body, items.map((i) => i.external_id));
  if (!r.ok) {
    if (r.kind !== 'duplicate') return r;
    // that external id exists already: it is this order's own (ids are ours and unique), made by a call we never heard back from
    const g = await get(env, ext);
    if (g.ok && g.data && !['canceled', 'failed'].includes(g.data.status)) return g;
    return g.ok ? { ok: false, kind: 'down', why: 'duplicate' } : g;
  }
  let d = r.json && r.json.data; if (!d || d.id == null) return { ok: false, kind: 'down', why: 'empty' };
  for (let i = 0; calcOf(d) === 'calculating' && i < polls(env); i++) { await sleep(pollMs(env)); const g = await pf(env, 'GET', '/v2/orders/' + d.id); if (g.ok && g.json && g.json.data) d = g.json.data; }
  if (calcOf(d) === 'calculating') return CALCULATING(); // the draft exists: the ledger's next try finds it by external id (GET before create)
  return { ok: true, data: mapOrder(d, []) };
}
// GET by Printful id or by external id ('@<id>'), with its shipments (a second read, v2 keeps them apart)
export async function get(env, ref) {
  const r = await pf(env, 'GET', ordPath(ref)); if (!r.ok) return r;
  const d = r.json && r.json.data; if (!d || d.id == null) return { ok: false, kind: 'down', why: 'empty' };
  if (d.status === 'draft' && calcOf(d) === 'calculating') return CALCULATING();
  let ships = [];
  if (!NO_SHIPMENTS.includes(d.status)) {
    const s = await pf(env, 'GET', '/v2/orders/' + d.id + '/shipments?limit=100');
    if (!s.ok) return s.kind === 'not_found' ? { ok: false, kind: 'down', why: 'shipments' } : s;
    ships = (s.json && Array.isArray(s.json.data) && s.json.data) || [];
  }
  return { ok: true, data: mapOrder(d, ships) };
}
// the recipient of a draft (v2: PATCH; only a draft or a failed order can change)
export const update = (env, id, recipient) => pf(env, 'PATCH', '/v2/orders/' + id, { recipient: recipientOut(recipient) }).then((r) => (r.ok ? { ok: true, data: mapOrder(r.json && r.json.data, []) } : r));
// the wholesale charge. Belt and braces: the adapter itself refuses unless MERCH_PROVIDER_MODE is live, and always on the test Worker.
export async function confirm(env, id) {
  if (env.MERCH_PROVIDER_MODE !== 'live') return { ok: false, kind: 'cannot', why: 'draft_mode' };
  if (env.MERCH_TEST === '1') return { ok: false, kind: 'cannot', why: 'test' };
  const r = await pf(env, 'POST', '/v2/orders/' + id + '/confirmation');
  if (!r.ok) {
    // review finding 2: Printful may have taken the confirm and the answer was lost (a dropped connection, a 5xx, a timeout), or this is a
    // second confirm of an order it already took (it refuses that). Its order says which: past the draft, the confirm was taken. A billing
    // refusal is never re-read (it is the wallet hold's answer: nothing is charged), and only a confirmed status turns a refusal into ok.
    if (r.kind === 'billing') return r;
    const g = await get(env, id);
    if (g.ok && g.data && TAKEN.includes(g.data.status)) return { ok: true, data: g.data, reread: r.kind };
    return r;
  }
  const d = mapOrder(r.json && r.json.data, []); if (!d) return { ok: false, kind: 'down', why: 'empty' };
  // "failed: submitted for fulfillment but not accepted (address, print files, charging...)": not confirmed; the owner looks (held review)
  if (d.status === 'failed') return { ok: false, kind: 'refused', items: [], why: 'failed' };
  return { ok: true, data: d };
}
// v2 DELETE removes a draft (also a failed or canceled order) not yet charged; 204 and no body. A draft already gone (404, a retry after a
// crash) counts as deleted; so does an order Printful shows as canceled.
export async function deleteDraft(env, id) {
  const r = await pf(env, 'DELETE', '/v2/orders/' + id);
  if (r.ok || r.kind === 'not_found') return { ok: true };
  if (r.kind === 'cannot' || r.kind === 'refused') { const g = await get(env, id); if (g.ok && g.data && g.data.status === 'canceled') return { ok: true }; }
  return r;
}
// the late part (T2.1-31): a draft or failed order is deleted (v2); a confirmed one not yet in production is cancelled through v1 (refunds the
// wholesale charge to the card); anything further on answers 'cannot' (the ledger emails the owner).
export async function cancel(env, id) {
  const g = await get(env, id); if (!g.ok) return g;
  const st = g.data.status;
  if (st === 'canceled') return { ok: true, data: g.data };
  if (st === 'draft' || st === 'failed') { const d = await pf(env, 'DELETE', '/v2/orders/' + id); return d.ok || d.kind === 'not_found' ? { ok: true } : d; }
  if (env.MERCH_PF_V1_CANCEL === '0') return { ok: false, kind: 'cannot', why: 'no_v2_cancel' };
  if (!['pending', 'onhold'].includes(st)) return { ok: false, kind: 'cannot', why: st }; // inprocess: "no longer cancellable"
  const r = await pf(env, 'DELETE', '/orders/' + id);
  if (r.ok) return { ok: true };
  if (r.kind === 'cannot' || r.kind === 'refused') { const g2 = await get(env, id); if (g2.ok && g2.data && g2.data.status === 'canceled') return { ok: true, data: g2.data }; return { ok: false, kind: 'cannot', why: 'refused' }; }
  return r;
}
// Printful's own estimate (v2 order-estimation-tasks: a task, then its result). Not used by the ledger today (the margin guard uses the nightly
// costs); kept for merch.sh and the key-day check. -> { items, shipping, tax, total } in cents
export async function quoteCost(env, o, lines, recipient, fileUrls) {
  const unknown = lines.filter((l) => !pfVariant(l.provider_variant)); if (unknown.length) return { ok: false, kind: 'refused', items: unknown.map((l) => String(l.line)) };
  const items = lines.map((l) => { const it = itemOut(l, 'q', (fileUrls && fileUrls[l.line]) || ''); delete it.external_id; if (!fileUrls || !fileUrls[l.line]) delete it.placements; return it; });
  const r = await pf(env, 'POST', '/v2/order-estimation-tasks', { recipient: recipientOut(recipient), order_items: items });
  if (!r.ok) return r;
  let t = r.json && r.json.data;
  for (let i = 0; t && t.status === 'pending' && i <= polls(env); i++) { await sleep(pollMs(env)); const g = await pf(env, 'GET', '/v2/order-estimation-tasks?id=' + encodeURIComponent(t.id)); if (!g.ok) return g; t = g.json && g.json.data; }
  if (!t || t.status === 'pending') return { ok: false, kind: 'down', why: 'estimating' };
  if (t.status === 'failed') { const why = (t.failure_reasons || []).join(' '); return /recipient/i.test(why) ? { ok: false, kind: 'address' } : { ok: false, kind: 'refused', items: [] }; }
  const c = t.costs || {};
  if (c.currency && c.currency !== 'USD') return { ok: false, kind: 'cannot', why: 'currency' };
  return { ok: true, data: { items: cents(c.subtotal) - cents(c.discount) + cents(c.digitization) + cents(c.additional_fee) + cents(c.fulfillment_fee), shipping: cents(c.shipping), tax: cents(c.tax) + cents(c.vat) + cents(c.retail_delivery_fee), total: cents(c.total) } };
}

// One sample address per cost region (catalog.js regionOf; invented, not a person): the nightly shipping-rate read
export const SHIP_SAMPLES = {
  us: { country_code: 'US', state_code: 'NY', city: 'New York', zip: '10001' }, ca: { country_code: 'CA', state_code: 'ON', city: 'Toronto', zip: 'M5V 2T6' },
  uk: { country_code: 'GB', city: 'London', zip: 'EC1A 1BB' }, eu: { country_code: 'DE', city: 'Berlin', zip: '10115' },
  au: { country_code: 'AU', state_code: 'NSW', city: 'Sydney', zip: '2000' }, jp: { country_code: 'JP', city: 'Tokyo', zip: '100-0001' },
  efta: { country_code: 'CH', city: 'Zurich', zip: '8001' }, row: { country_code: 'HK', city: 'Hong Kong' }
};
// a sample variant per product group (shipping is per group: one parcel per product type, SHIPPING.md 6)
const GROUP_SAMPLE = { mug: 'mug:white', tee: 'tee:white:M' };
async function rate(env, region, variant, qty) {
  const a = SHIP_SAMPLES[region];
  const r = await pf(env, 'POST', '/v2/shipping-rates', { recipient: Object.assign({ address1: '1 Example Street' }, a), order_items: [{ source: 'catalog', catalog_variant_id: PF_VARIANT_IDS[variant], quantity: qty }], currency: 'USD' });
  if (!r.ok) return null;
  const list = (r.json && Array.isArray(r.json.data) && r.json.data) || [];
  const s = list.find((x) => x.shipping === 'STANDARD') || list[0];
  return s && (!s.currency || s.currency === 'USD') && s.rate != null ? cents(s.rate) : null;
}
// The nightly cost read (TRANSACTIONS 3.3): Printful's catalog prices (v2 /catalog-products/{id}/prices in USD; with no production currency
// Printful answers the highest price, the safe side for the margin guard) and its Standard rates for one and two items in each region.
// -> { variants: { <our variant id>: cents }, ship: { '<region>:<group>': [first, extra] } }, as much as could be read; nothing read: the error.
export async function catalogCosts(env, opt) {
  const region = (opt && opt.priceRegion) || env.MERCH_PF_PRICE_REGION || 'worldwide';
  const regions = (opt && opt.regions) || String(env.MERCH_PF_SHIP_REGIONS || Object.keys(SHIP_SAMPLES).join(',')).split(',').map((s) => s.trim()).filter((s) => SHIP_SAMPLES[s]);
  const groups = (opt && opt.groups) || Object.keys(GROUP_SAMPLE);
  const variants = {}, ship = {}; let first = null, any = false;
  for (const [prod, pid] of Object.entries(PF_PRODUCTS)) {
    const tech = (PLACE[prod] || [])[1];
    for (let offset = 0, page = 0; page < 10; page++) {
      const r = await pf(env, 'GET', '/v2/catalog-products/' + pid + '/prices?selling_region_name=' + encodeURIComponent(region) + '&currency=USD&limit=100&offset=' + offset);
      if (!r.ok) { first = first || r; break; }
      const d = (r.json && r.json.data) || {};
      if (d.currency && d.currency !== 'USD') { first = first || { ok: false, kind: 'cannot', why: 'currency' }; break; }
      any = true;
      for (const v of d.variants || []) {
        const ours = REV[String(v.id)]; if (!ours) continue;
        const t = (v.techniques || []).find((x) => x.technique_key === tech) || (v.techniques || [])[0]; if (!t) continue;
        const p = t.discounted_price != null && t.discounted_price !== '' ? t.discounted_price : t.price; if (p == null) continue;
        variants[ours] = cents(p);
      }
      const pg = (r.json && r.json.paging) || {}; offset = Number(pg.offset || 0) + Number(pg.limit || 100);
      if (!(Number(pg.total) > offset)) break;
    }
  }
  for (const reg of regions) for (const g of groups) {
    if (!SHIP_COSTS[reg] || !SHIP_COSTS[reg][g]) continue;
    const one = await rate(env, reg, GROUP_SAMPLE[g], 1); if (one == null) continue;
    const two = await rate(env, reg, GROUP_SAMPLE[g], 2); if (two == null) continue;
    ship[reg + ':' + g] = [one, Math.max(0, two - one)]; any = true;
  }
  if (!any) return first || { ok: false, kind: 'down' };
  return { ok: true, data: { variants, ship } };
}

// Printful's order (+ its shipments) -> ours: { id, external_id, status, costs: { items, shipping, tax } (cents, null until known),
// items: [{ external_id, id }], shipments: [{ id, carrier, tracking_url, items: [item external ids], shipped_at, delivered_at, returned }] }
export function mapOrder(d, ships) {
  if (!d || typeof d !== 'object') return null;
  const c = d.costs || {};
  // costs count only when worked out ('done'; v1 answers have no calculation_status) and in US dollars: else null, and the ledger holds it
  const known = (!c.calculation_status || c.calculation_status === 'done') && (!c.currency || c.currency === 'USD') && c.subtotal != null && c.subtotal !== '';
  const items = (d.order_items || d.items || []).filter((i) => !i.type || i.type === 'order_item');
  const byId = new Map(items.map((i) => [String(i.id), String(i.external_id || '')]));
  return { id: String(d.id), external_id: d.external_id || null,
    status: d.status === 'inreview' ? 'pending' : String(d.status || ''), // inreview: confirmed and "still cancellable": the same as pending for us
    costs: known ? { items: cents(c.subtotal) - cents(c.discount) + cents(c.digitization) + cents(c.additional_fee) + cents(c.fulfillment_fee), shipping: cents(c.shipping), tax: cents(c.tax) + cents(c.vat) + cents(c.retail_delivery_fee) }
      : { items: null, shipping: null, tax: null },
    items: items.map((i) => ({ external_id: String(i.external_id || ''), id: i.id != null ? String(i.id) : null, status: null })),
    shipments: (ships || []).filter((s) => s && SHIPPED.includes(s.shipment_status)).map((s) => ({
      id: String(s.id), carrier: s.carrier || null, tracking_url: s.tracking_url || null,
      items: (s.shipment_items || []).map((x) => String(x.order_item_external_id || byId.get(String(x.order_item_id)) || '')).filter(Boolean),
      shipped_at: ts(s.shipped_at), delivered_at: s.delivery_status === 'delivered' ? ts(s.delivered_at) : null, returned: s.shipment_status === 'returned' })) };
}

// Webhook v2 signing: HMAC-SHA256 of the raw body with the configuration's secret key, hex in x-pf-webhook-signature. Printful hands the
// secret as hex ("you need to decode it"); a secret that is not hex is used as text.
const keyBytes = (s) => (/^(?:[0-9a-f]{2})+$/i.test(s) ? Uint8Array.from(s.match(/../g), (b) => parseInt(b, 16)) : enc.encode(s));
export async function hookSign(secret, raw) {
  const k = await crypto.subtle.importKey('raw', keyBytes(String(secret)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', k, enc.encode(raw)));
}
// a webhook hint -> { id, order (external id or Printful id), type } or { bad: true } (signature) or null (not JSON). v2 events carry no event
// id: ours is type + order + shipment + occurred_at, so Printful's retries (only `retries` changes) count once. No occurred_at: null (the
// ledger then uses the body's sha256).
export async function parseHook(env, raw, headers) {
  if (env.MERCH_PROVIDER_WEBHOOK_SECRET) {
    // Printful sends x-pf-webhook-signature, and worker.js forwards it to the ledger (review finding 1). Only that name counts: the old
    // name x-pf-signature is never read, so a hint signed under it is refused like an unsigned one.
    const sig = String(headers.get('x-pf-webhook-signature') || '').toLowerCase();
    if (!/^[0-9a-f]{64}$/.test(sig) || !same(sig, await hookSign(env.MERCH_PROVIDER_WEBHOOK_SECRET, raw))) return { bad: true };
  }
  let ev; try { ev = JSON.parse(raw); } catch (e) { return null; }
  if (!ev || typeof ev !== 'object') return null;
  const type = String(ev.type || ''), dt = ev.data || {}, o = dt.order, s = dt.shipment;
  const ref = o && (o.external_id ? String(o.external_id) : o.id != null ? String(o.id) : null);
  const id = ev.id != null && ev.id !== '' ? String(ev.id).slice(0, 200) // not in v2's documented shape; taken if a sender gives one
    : ev.occurred_at && ref ? [type, ref, (s && s.id) || '', ev.occurred_at].join(':').slice(0, 200) : null;
  return { id, order: ref || null, type };
}
