// The print provider seam (TRANSACTIONS.md 6.7). A Printful-shaped client (v1 orders API) that only talks through env.PROVIDER_FETCH; part 5
// writes the real adapter (and checks every [not verified] shape below with the owner's key). Every call answers
//   { ok: true, data } or { ok: false, kind: 'down' | 'timeout' | 'refused' (items: [item external ids]) | 'address' | 'billing' | 'not_found' | 'cannot' | 'not_set_up' }
// and never throws.
import { fetcher, call, hmacHex, same } from './util.js';

const BASE = 'https://api.printful.com';
export const providerReady = (env) => !!(fetcher(env.PROVIDER_FETCH) && env.MERCH_PROVIDER_KEY);

async function pf(env, method, path, body) {
  const f = fetcher(env.PROVIDER_FETCH); if (!f || !env.MERCH_PROVIDER_KEY) return { ok: false, kind: 'not_set_up' };
  const h = { Authorization: 'Bearer ' + env.MERCH_PROVIDER_KEY }; if (body) h['Content-Type'] = 'application/json';
  const r = await call(f, BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined }, Number(env.MERCH_TIMEOUT_MS) || 25000);
  if (r.timeout) return { ok: false, kind: 'timeout' };
  if (r.ok) return { ok: true, data: (r.data && r.data.result) || r.data };
  const e = (r.data && r.data.error) || {}, reason = String(e.reason || '');
  // [not verified] how Printful names these: part 5 maps the real answers (PROVIDERS.md 1.1)
  if (r.status === 404) return { ok: false, kind: 'not_found' };
  if (!r.status || r.status >= 500 || r.status === 429) return { ok: false, kind: 'down', status: r.status };
  if (r.status === 402 || reason === 'billing') return { ok: false, kind: 'billing' };
  if (reason === 'recipient') return { ok: false, kind: 'address' };
  if (reason === 'items' && Array.isArray(e.items)) return { ok: false, kind: 'refused', items: e.items.map(String) };
  if (reason === 'cannot_cancel') return { ok: false, kind: 'cannot' };
  return { ok: false, kind: 'refused', items: [], status: r.status };
}

const money = (c) => (c / 100).toFixed(2);
// a draft (not charged): our order id as external_id, each item <order>_<line>, the print file as a signed URL, retail costs from our prices
export function createDraft(env, o, lines, recipient, fileUrls, extId) {
  return pf(env, 'POST', '/orders', {
    external_id: extId || o.id, shipping: 'STANDARD', recipient,
    items: lines.map((l) => ({ external_id: (extId || o.id) + '_' + l.line, variant_id: l.provider_variant, quantity: l.qty - (l.refunded_qty || 0), retail_price: money(l.unit), name: l.product,
      files: [{ type: 'default', url: fileUrls[l.line] }] })),
    retail_costs: { currency: 'USD', subtotal: money(o.subtotal), shipping: money(o.ship_fee), tax: money(o.tax || 0) }
  }).then((r) => (r.ok ? { ok: true, data: mapOrder(r.data) } : r));
}
export const get = (env, idOrExternal) => pf(env, 'GET', '/orders/' + (/^\d+$/.test(String(idOrExternal)) ? idOrExternal : '@' + encodeURIComponent(idOrExternal))).then((r) => (r.ok ? { ok: true, data: mapOrder(r.data) } : r));
export const update = (env, id, recipient) => pf(env, 'PUT', '/orders/' + id, { recipient });
export const confirm = (env, id) => pf(env, 'POST', '/orders/' + id + '/confirm').then((r) => (r.ok ? { ok: true, data: mapOrder(r.data) } : r));
// a draft already gone (404, or Printful says it is canceled: a retry after a crash) counts as deleted [not verified: part 5]
export const deleteDraft = (env, id) => pf(env, 'DELETE', '/orders/' + id).then(async (r) => {
  if (r.ok || r.kind === 'not_found') return { ok: true };
  if (r.kind === 'cannot' || r.kind === 'refused') { const g = await get(env, id); if (g.ok && g.data && g.data.status === 'canceled') return { ok: true }; }
  return r;
});
// after confirm Printful may refuse: 'cannot' [not verified]. An order already canceled (a retry after a crash) counts as done.
export const cancel = (env, id) => pf(env, 'DELETE', '/orders/' + id).then(async (r) => {
  if (r.ok || !(r.kind === 'cannot' || r.kind === 'refused')) return r;
  const g = await get(env, id); return g.ok && g.data && g.data.status === 'canceled' ? { ok: true, data: g.data } : r;
});
export const quoteCost = (env, o, lines, recipient) => pf(env, 'POST', '/orders/estimate-costs', { recipient, items: lines.map((l) => ({ variant_id: l.provider_variant, quantity: l.qty })) });
// the nightly prices: { variants: { <our variant id>: cents }, ship: { '<region>:<group>': [first, extra] } } (part 5 reads Printful's catalog)
export const catalogCosts = (env) => pf(env, 'GET', '/merch/catalog-costs');

// Printful's order -> ours: { id, external_id, status, costs: { items, shipping }, items: [{ external_id, status }], shipments: [...] }
export function mapOrder(d) {
  if (!d || typeof d !== 'object') return null;
  const c = d.costs || {};
  const cents = (x) => (x == null ? null : Math.round(Number(x) * 100));
  return { id: String(d.id), external_id: d.external_id || null, status: String(d.status || ''),
    costs: { items: cents(c.subtotal), shipping: cents(c.shipping), tax: cents(c.tax) },
    items: (d.items || []).map((i) => ({ external_id: String(i.external_id || ''), status: i.status || null })),
    shipments: (d.shipments || []).map((s) => ({ id: String(s.id), carrier: s.carrier || null, tracking_url: s.tracking_url || null, items: (s.items || []).map((x) => String(x.order_item_external_id || x.external_id || x)),
      shipped_at: s.ship_date ? Date.parse(s.ship_date) : s.shipped_at || null, delivered_at: s.delivered_at || null, returned: !!s.returned })) };
}
// a webhook hint -> { id (event id or null), order (external id or Printful id), type } or { bad: true } (signature) or null (not ours)
export async function parseHook(env, raw, headers) {
  if (env.MERCH_PROVIDER_WEBHOOK_SECRET) {
    const sig = headers.get('x-pf-signature') || '';
    if (!/^[0-9a-f]{64}$/.test(sig) || !same(sig, await hmacHex(env.MERCH_PROVIDER_WEBHOOK_SECRET, raw))) return { bad: true };
  }
  let ev; try { ev = JSON.parse(raw); } catch (e) { return null; }
  const o = ev && ev.data && ev.data.order;
  if (!o) return { id: null, order: null, type: String((ev && ev.type) || '') };
  return { id: ev.id ? String(ev.id) : null, order: o.external_id ? String(o.external_id) : o.id != null ? String(o.id) : null, type: String(ev.type || '') };
}
