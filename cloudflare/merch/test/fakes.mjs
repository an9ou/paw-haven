// Fakes for the merch_worker suite: Durable Object storage over node:sqlite (as cloudflare/d1_node.js fakes D1), DO namespaces, and stateful
// stand-ins for Stripe, Printful, the renderer and Resend. Nothing here reaches the network.
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';
import { SHIP_COSTS, regionOf, PRODUCTS, unitCost, PF_PRODUCTS, PF_VARIANT_IDS } from '../catalog.js';
import { signFor } from '../stripe.js';

const require = createRequire(import.meta.url);

// ---------------- Durable Object state: storage.sql.exec / transactionSync / alarms ----------------
// One FakeState is the object's storage (it outlives an instance); each instance gets its own ctx. evict() kills an instance: every storage
// call it makes after that throws { evicted: true }, which is how a crash between an outside call and the write is tested (nothing is written).
const evicted = () => Object.assign(new Error('evicted: this object instance was replaced'), { evicted: true });
export class FakeState {
  constructor() { this.db = new DatabaseSync(':memory:'); this.alarmAt = null; this.inTx = false; this.view = this.ctx(); this.storage = this.view.storage; }
  ctx() {
    const self = this, c = { dead: false };
    const live = () => { if (c.dead) throw evicted(); };
    c.storage = {
      sql: { exec(q, ...b) { live(); return self.exec(q, b); }, get databaseSize() { return self.db.prepare('select page_count * page_size as n from pragma_page_count(), pragma_page_size()').get().n; } },
      transactionSync(fn) {
        live();
        if (self.inTx) throw new Error('nested transactionSync'); // the real one would not nest either: catch it here
        self.inTx = true; self.db.exec('begin');
        try { const r = fn(); if (r && typeof r.then === 'function') throw new Error('transactionSync got an async function'); live(); self.db.exec('commit'); return r; }
        catch (e) { self.db.exec('rollback'); throw e; } finally { self.inTx = false; }
      },
      async setAlarm(t) { live(); self.alarmAt = Number(t); }, async getAlarm() { return self.alarmAt; }, async deleteAlarm() { live(); self.alarmAt = null; },
      async deleteAll() { live(); const t = self.db.prepare("select name from sqlite_master where type = 'table'").all(); for (const r of t) self.db.exec('drop table if exists "' + r.name + '"'); self.alarmAt = null; }
    };
    return c;
  }
  exec(q, b) {
    if (!b.length && /;\s*\S/.test(q.trim().replace(/;\s*$/, ''))) { this.db.exec(q); return cursor([], 0); }
    const st = this.db.prepare(q);
    const vals = b.map((v) => (v === undefined ? null : typeof v === 'boolean' ? (v ? 1 : 0) : v));
    if (/^\s*(select|with|pragma)\b/i.test(q) || /\breturning\b/i.test(q)) { const rows = st.all(...vals).map((r) => Object.assign({}, r)); return cursor(rows, /returning/i.test(q) ? rows.length : 0); }
    const r = st.run(...vals); return cursor([], Number(r.changes));
  }
}
function cursor(rows, written) { return { toArray: () => rows, one: () => { if (rows.length !== 1) throw new Error('one(): ' + rows.length + ' rows'); return rows[0]; }, rowsWritten: written, [Symbol.iterator]: () => rows[Symbol.iterator]() }; }

// a namespace: idFromName(name) -> name; get(id).fetch(...) -> the CURRENT instance's fetch; evict(id): a new instance on the same storage
export function namespace(Cls, env) {
  const inst = new Map();
  const make = (st) => { const ctx = st.instances ? st.ctx() : st.view; st.instances = (st.instances || 0) + 1; return { st, ctx, obj: new Cls(ctx, env) }; };
  const ns = {
    instances: inst,
    idFromName: (n) => n,
    get(id) {
      if (!inst.has(id)) inst.set(id, make(new FakeState()));
      const it = () => inst.get(id);
      return { fetch: (input, init) => it().obj.fetch(input instanceof Request ? input : new Request(input, init)), get obj() { return it().obj; }, get state() { return it().st; } };
    },
    evict(id) { const it = inst.get(id); if (!it) return; it.ctx.dead = true; inst.set(id, make(it.st)); }
  };
  return ns;
}

const formParse = (s) => { const o = {}; for (const kv of String(s || '').split('&').filter(Boolean)) { const i = kv.indexOf('='); o[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1)); } return o; };
const J = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json' } });

// ---------------- Stripe ----------------
export function fakeStripe() {
  const S = { now: () => Date.now(), sessions: new Map(), byKey: new Map(), refunds: [], refundKeys: new Map(), calls: [], n: 0, fail: {}, hang: null, secret: 'whsec_test_merch', after: {}, slowCreate: 0 };
  // Stripe keeps an idempotency key for 24 hours, then forgets it (a retry after that makes a NEW object): S5
  const keyGet = (m, k) => { const e = k && m.get(k); if (!e) return null; if (S.now() - e.at > 864e5) { m.delete(k); return null; } return e.v; };
  const keySet = (m, k, v) => { if (k) m.set(k, { at: S.now(), v }); };
  const lineItems = (f) => { const out = []; for (let i = 0; f['line_items[' + i + '][quantity]'] !== undefined; i++) { const q = Number(f['line_items[' + i + '][quantity]']), u = Number(f['line_items[' + i + '][price_data][unit_amount]']); out.push({ quantity: q, amount_subtotal: u * q, amount_tax: 0, amount_total: u * q, description: f['line_items[' + i + '][price_data][product_data][name]'] }); } return out; };
  S.fetch = async (url, init) => {
    const u = new URL(url), m = (init && init.method) || 'GET', h = (init && init.headers) || {}, key = h['Idempotency-Key'] || null, body = formParse(init && init.body);
    S.calls.push({ m, path: u.pathname + u.search, key, body, auth: h.Authorization, version: h['Stripe-Version'] });
    const p = u.pathname;
    const take = (k) => { if (S.fail[k] > 0) { S.fail[k]--; return true; } return false; };
    if (p === '/v1/checkout/sessions' && m === 'POST') {
      if (S.hang) await S.hang;
      if (take('create')) return J({ error: { message: 'boom' } }, 500);
      const was = keyGet(S.byKey, key); if (was) return J(S.sessions.get(was));
      const id = 'cs_test_' + (++S.n) + 'x'.repeat(8), li = lineItems(body), sub = li.reduce((a, x) => a + x.amount_subtotal, 0), fee = Number(body['shipping_options[0][shipping_rate_data][fixed_amount][amount]']);
      const cs = { id, object: 'checkout.session', url: 'https://checkout.stripe.test/c/pay/' + id, status: 'open', payment_status: 'unpaid', currency: 'usd', client_reference_id: body.client_reference_id,
        metadata: { merch: body['metadata[merch]'] }, amount_subtotal: sub, amount_total: sub + fee, shipping_cost: { amount_subtotal: fee, amount_total: fee }, total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: fee },
        line_items: { data: li }, expires_at: Number(body.expires_at), payment_intent: null, form: body, country: body['shipping_address_collection[allowed_countries][0]'] };
      S.sessions.set(id, cs); keySet(S.byKey, key, id);
      if (S.after.create) await S.after.create(cs);
      if (S.slowCreate > 0) { S.slowCreate--; await new Promise((r) => setTimeout(r, 400)); } // made, but the answer comes too late (a timeout)
      return J(cs);
    }
    let mm = /^\/v1\/checkout\/sessions\/([^/]+)(\/expire)?$/.exec(p);
    if (mm && mm[2] && m === 'POST') { const cs = S.sessions.get(mm[1]); if (take('expire')) return J({ error: {} }, 500); if (!cs || cs.status !== 'open') return J({ error: { message: 'not open' } }, 400); cs.status = 'expired'; return J(cs); }
    if (mm && m === 'GET') { if (take('get')) return J({ error: { message: 'rate' } }, 429); if (S.after.get) await S.after.get(mm[1]); const cs = S.sessions.get(mm[1]); if (cs && cs.status === 'open' && S.now() / 1000 > cs.expires_at) cs.status = 'expired'; // Stripe expires it at expires_at
      return cs ? J(cs) : J({ error: {} }, 404); }
    if (p === '/v1/checkout/sessions' && m === 'GET') { if (take('list')) return J({ error: {} }, 500); const pi = u.searchParams.get('payment_intent'); return J({ data: Array.from(S.sessions.values()).filter((c) => c.payment_intent === pi) }); }
    if (p === '/v1/refunds' && m === 'POST') {
      if (take('refund')) return J({ error: { message: 'no' } }, 500);
      const was = keyGet(S.refundKeys, key); if (was) return J(was);
      const re = { id: 're_' + (++S.n), object: 'refund', amount: Number(body.amount), payment_intent: body.payment_intent, status: 'succeeded', metadata: { merch: body['metadata[merch]'], merch_refund: body['metadata[merch_refund]'] } };
      S.refunds.push(re); keySet(S.refundKeys, key, re);
      if (S.after.refund) await S.after.refund(re);
      return J(re);
    }
    if (p === '/v1/refunds' && m === 'GET') { if (take('listRefunds')) return J({ error: {} }, 500); const pi = u.searchParams.get('payment_intent'); return J({ data: S.refunds.filter((r) => r.payment_intent === pi) }); }
    return J({ error: { message: 'unknown ' + m + ' ' + p } }, 404);
  };
  // the buyer pays on Stripe's page: status complete, a payment intent, the email and address Stripe keeps (we never store them)
  S.pay = (sid, o) => {
    o = o || {}; const cs = S.sessions.get(sid);
    cs.status = 'complete'; cs.payment_status = o.unpaid ? 'unpaid' : 'paid'; cs.payment_intent = cs.payment_intent || 'pi_test_' + (++S.n);
    cs.customer_details = { email: o.email || 'buyer@example.test' };
    const country = o.country || cs.country;
    cs.collected_information = { shipping_details: { name: 'Pat Example', address: { line1: '1 Example Street', city: 'Exampleton', postal_code: 'PC-4242', state: 'CA', country } } };
    if (o.tax) { cs.total_details.amount_tax = o.tax; cs.amount_total += o.tax; cs.line_items.data[0].amount_tax = o.tax; }
    if (o.amount) cs.amount_total = o.amount;
    if (o.currency) cs.currency = o.currency;
    if (o.pres) cs.presentment_details = o.pres;
    return cs;
  };
  S.dashRefund = (pi, amount) => { const re = { id: 're_dash_' + (++S.n), amount, payment_intent: pi, status: 'succeeded', metadata: {} }; S.refunds.push(re); return re; };
  S.event = async (type, object, o) => {
    o = o || {}; const ev = { id: o.id || 'evt_' + (++S.n), type, data: { object } }, raw = JSON.stringify(ev);
    const t = o.t != null ? o.t : Math.floor((o.now || Date.now()) / 1000);
    return { raw, sig: o.badSig ? 't=' + t + ',v1=' + '0'.repeat(64) : await signFor(o.secret || S.secret, raw, t), id: ev.id };
  };
  return S;
}

// ---------------- Printful (API v2, as documented: PART5.md; the shapes match test/printful/*.json) ----------------
// The fake keeps its own simple model of each order (tests read and change it: status, items, recipient, shipments; deleted = cancelled or deleted at Printful, gone = deleted through v2, so GET answers 404) and answers in
// Printful's v2 shapes: { data: Order }, shipments on their own route, old-style errors { code, result, error: { reason, message } } on the
// order routes. `calls[].path` is the path inside the API version (no '/v2' prefix; `v` says which): '/orders', '/orders/@<ext>', ...
// One v1 route is kept, the cancel of a confirmed order (DELETE /orders/{id}, v: 1). The catalog and rate routes answer only when `costs` is
// set (else 404, so the nightly job writes nothing, as before part 5).
const PF_REV = Object.fromEntries(Object.entries(PF_VARIANT_IDS).map(([k, v]) => [v, k]));
const pfErr = (status, message, reason) => J({ code: status, result: message, error: { reason: reason || (status === 404 ? 'NotFound' : 'BadRequest'), message } }, status);
const pfProblem = (status, title) => J({ type: 'https://developers.printful.com/docs/v2-beta/#errors/internal-server-error', status, title, details: title }, status);
const iso = (t) => (t == null ? null : new Date(typeof t === 'number' ? t : Date.parse(t)).toISOString());
// Printful's webhook v2 signature: HMAC-SHA256 of the raw body, keyed with the hex-decoded secret (a secret that is not hex: its text)
export async function pfSign(secret, raw) {
  const s = String(secret), key = /^(?:[0-9a-f]{2})+$/i.test(s) ? Uint8Array.from(s.match(/../g), (b) => parseInt(b, 16)) : new TextEncoder().encode(s);
  const k = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(raw))), (b) => b.toString(16).padStart(2, '0')).join('');
}
export function fakePrintful() {
  const P = { orders: new Map(), byExt: new Map(), calls: [], n: 9000, fail: {}, refuse: {}, costMul: 1, hangConfirm: null, lostConfirm: [], timeoutCreate: 0, after: {}, calc: 0 };
  const take = (k) => { if (P.fail[k] > 0) { P.fail[k]--; return true; } return false; };
  const ourOf = (vid) => PF_REV[vid] || null; // 'tee:navy:M'
  const costsOf = (o) => ({ calculation_status: o.calc > 0 ? 'calculating' : 'done', currency: 'USD', subtotal: o.calc > 0 ? null : o.c.subtotal, discount: '0.00', shipping: o.calc > 0 ? null : o.c.shipping,
    digitization: '0.00', additional_fee: '0.00', fulfillment_fee: '0.00', retail_delivery_fee: '0.00', vat: '0.00', tax: '0.00', total: o.calc > 0 ? null : (Number(o.c.subtotal) + Number(o.c.shipping)).toFixed(2) });
  const v2Order = (o) => ({ id: Number(o.id), external_id: o.external_id, store_id: 1, shipping: 'STANDARD', status: o.status, created_at: o.created_at, updated_at: o.created_at,
    recipient: o.recipient, costs: costsOf(o), retail_costs: o.retail_costs,
    order_items: o.items.map((i) => ({ id: i.id, type: 'order_item', source: 'catalog', catalog_variant_id: i.catalog_variant_id, external_id: i.external_id, quantity: i.quantity, name: i.name, price: i.price, retail_price: i.retail_price, currency: 'USD', retail_currency: 'USD' })),
    _links: { self: { href: 'https://api.printful.com/v2/orders/' + o.id } } });
  const out = (o) => { if (o.calc > 0) o.calc--; return J({ data: v2Order(o) }); };
  const v2Ship = (o, s) => ({ id: Number(s.id), order_id: Number(o.id), order_external_id: o.external_id, carrier: s.carrier, service: 'Standard', shipment_status: s.returned ? 'returned' : 'shipped',
    shipped_at: iso(s.ship_date), delivery_status: s.delivered_at ? 'delivered' : 'in_transit', delivered_at: s.delivered_at ? iso(s.delivered_at) : null, is_reshipment: false,
    tracking_number: String(s.id), tracking_url: s.tracking_url, shipment_items: s.items.map((x, n) => { const it = o.items.find((i) => i.external_id === x.order_item_external_id); return { id: n + 1, order_item_id: it ? it.id : null, order_item_external_id: x.order_item_external_id, quantity: it ? it.quantity : 1 }; }) });
  P.fetch = async (url, init) => {
    const u = new URL(url), m = (init && init.method) || 'GET', body = init && init.body ? JSON.parse(init.body) : null;
    const v = u.pathname.startsWith('/v2/') ? 2 : 1, p = v === 2 ? u.pathname.slice(3) : u.pathname;
    P.calls.push({ m, path: p, v, query: u.search, body, headers: (init && init.headers) || {} });
    let mm;
    if (v === 2 && (mm = /^\/catalog-products\/(\d+)\/prices$/.exec(p))) {
      if (!P.costs) return pfErr(404, 'Not found');
      const variants = Object.entries(PF_VARIANT_IDS).filter(([k]) => PF_PRODUCTS[k.split(':')[0]] === Number(mm[1]) && !(P.costs.unpriced || []).includes(k)).map(([k, id]) => { // unpriced: left out of the reply (part 5 fixes, finding 9)
        const [prod, , size] = k.split(':'), c = P.costs.variants && P.costs.variants[k] != null ? P.costs.variants[k] : unitCost(PRODUCTS[prod], size);
        return { id, techniques: [{ technique_key: prod === 'mug' ? 'sublimation' : 'dtg', technique_display_name: prod === 'mug' ? 'Sublimation' : 'DTG printing', price: (c / 100).toFixed(2), discounted_price: (c / 100).toFixed(2) }] };
      });
      return J({ data: { currency: 'USD', product: { id: Number(mm[1]), placements: [] }, variants }, paging: { total: variants.length, offset: 0, limit: 100 }, _links: {} });
    }
    if (v === 2 && p === '/shipping-rates' && m === 'POST') {
      if (!P.costs) return pfErr(404, 'Not found');
      const region = regionOf(body.recipient.country_code), it = body.order_items[0], our = ourOf(it.catalog_variant_id), g = PRODUCTS[our.split(':')[0]].group;
      const fe = (P.costs.ship && P.costs.ship[region + ':' + g]) || SHIP_COSTS[region][g];
      return J({ data: [{ shipping: 'STANDARD', shipping_method_name: 'Flat Rate', rate: ((fe[0] + (it.quantity - 1) * fe[1]) / 100).toFixed(2), currency: 'USD', shipments: [] }], extra: [] });
    }
    if (v === 2 && p === '/orders' && m === 'POST') {
      if (take('create')) return pfProblem(503, 'Service Unavailable');
      if (P.refuse.recipient) return pfErr(400, 'Recipient: Invalid state `ZZ` select a valid state for country `' + body.recipient.country_code + '`');
      if (P.refuse.file > 0) { P.refuse.file--; return pfErr(400, 'Item 0: Could not download the print file from the address given in `/order_items/0/placements/0/layers/0/url`'); } // part 5 fixes, finding 4 (an invented text)
      const bad = body.order_items.map((i, n) => ((P.refuse.variants || []).includes('pf:' + ourOf(i.catalog_variant_id)) ? 'Item ' + n + ': This product variant is not available' : null)).filter(Boolean);
      if (bad.length) return pfErr(400, bad.join('; '));
      const was = P.byExt.get(body.external_id); if (was && !P.orders.get(was).gone) return pfErr(400, 'The external_id provided already exists and cannot be used');
      const id = String(++P.n), region = regionOf(body.recipient.country_code);
      const groups = {}; let items = 0;
      for (const i of body.order_items) { const [prod, , size] = ourOf(i.catalog_variant_id).split(':'); items += unitCost(PRODUCTS[prod], size) * i.quantity; groups[PRODUCTS[prod].group] = (groups[PRODUCTS[prod].group] || 0) + i.quantity; }
      let ship = 0; for (const g of Object.keys(groups)) ship += SHIP_COSTS[region][g][0] + (groups[g] - 1) * SHIP_COSTS[region][g][1];
      const o = { id, external_id: body.external_id, status: 'draft', recipient: body.recipient, created_at: new Date().toISOString(), retail_costs: body.retail_costs, calc: P.calc || 0,
        c: { subtotal: (items * P.costMul / 100).toFixed(2), shipping: (ship / 100).toFixed(2) },
        items: body.order_items.map((i) => ({ id: ++P.n, external_id: i.external_id, status: 'draft', catalog_variant_id: i.catalog_variant_id, quantity: i.quantity, name: i.name, retail_price: i.retail_price, price: null, placements: i.placements })),
        files: body.order_items.map((i) => i.placements[0].layers[0].url), shipments: [] };
      P.orders.set(id, o); P.byExt.set(body.external_id, id);
      if (P.after.create) await P.after.create(o);
      if (P.timeoutCreate > 0) { P.timeoutCreate--; await new Promise((r) => setTimeout(r, 400)); }
      return out(o);
    }
    if (v === 1 && (mm = /^\/orders\/(\d+)$/.exec(p)) && m === 'DELETE') { // v1 cancel: "Cancels pending order or draft"
      const o = P.orders.get(mm[1]); if (!o || o.gone) return pfErr(404, 'Not found');
      if (take('delete')) return pfErr(500, 'Internal error', 'InternalServerError');
      if (o.status !== 'draft' && o.status !== 'pending') return pfErr(400, 'This order can not be cancelled');
      o.status = 'canceled'; o.deleted = true; if (P.after.delete) await P.after.delete(o);
      return J({ code: 200, result: { id: Number(o.id), external_id: o.external_id, status: 'canceled' } });
    }
    if (v === 2 && (mm = /^\/orders\/(@?)([^/]+)(\/confirmation|\/shipments)?$/.exec(p))) {
      const id = mm[1] ? P.byExt.get(decodeURIComponent(mm[2])) : mm[2], o0 = id && P.orders.get(id), o = o0 && !o0.gone ? o0 : null; // a deleted draft is gone
      if (mm[3] === '/shipments') return o ? J({ data: o.shipments.map((s) => v2Ship(o, s)), paging: { total: o.shipments.length, offset: 0, limit: 100 } }) : pfErr(404, 'Not found');
      if (m === 'GET') { if (take('get')) return pfProblem(503, 'Service Unavailable'); return o ? out(o) : pfErr(404, 'Not found'); }
      if (!o) return pfErr(404, 'Not found');
      if (mm[3] === '/confirmation') {
        if (P.hangConfirm) await P.hangConfirm; if (take('confirm')) return pfProblem(503, 'Service Unavailable');
        if (P.refuse.billing) return pfErr(400, 'Order could not be charged: no valid billing method');
        // part 5 fixes: Printful confirms a draft (or a failed order sent again), never an order it took already: a second confirm is refused
        if (P.refuse.confirm || !['draft', 'failed'].includes(o.status)) return pfErr(400, 'Order cannot be confirmed');
        if (P.timeoutConfirm) { P.timeoutConfirm--; o.status = 'pending'; await new Promise((r) => setTimeout(r, 400)); }
        o.status = 'pending'; o.items.forEach((i) => (i.status = 'pending')); if (P.after.confirm) await P.after.confirm(o);
        // review finding 2: Printful took the confirm, then the answer was lost: 'drop' (the connection fails) or '5xx' (a gateway error)
        const lost = P.lostConfirm && P.lostConfirm.shift(); if (lost === 'drop') throw new Error('connection reset'); if (lost === '5xx') return pfProblem(502, 'Bad Gateway');
        return out(o);
      }
      if (m === 'PATCH') {
        if (P.refuse.recipient) return pfErr(400, 'Recipient: Invalid state `ZZ` select a valid state for country `' + ((body.recipient && body.recipient.country_code) || 'US') + '`');
        o.recipient = Object.assign({}, o.recipient, body.recipient); if (P.after.update) await P.after.update(o); return out(o);
      }
      if (m === 'DELETE') { // v2: deletes a draft, failed or canceled order (not charged); 204, no body
        if (take('delete')) return pfProblem(503, 'Service Unavailable');
        if (!['draft', 'failed', 'canceled'].includes(o.status)) return pfErr(400, 'Order cannot be deleted');
        o.status = 'canceled'; o.deleted = true; o.gone = true; if (P.after.delete) await P.after.delete(o); return new Response(null, { status: 204 });
      }
    }
    return pfErr(404, 'Not found');
  };
  // a parcel leaves: items by our item external ids (v2 shipment_items carry order_item_external_id)
  P.ship = (id, exts, o) => { o = o || {}; const ord = P.orders.get(id); const s = { id: String(++P.n), carrier: 'USPS', tracking_url: 'https://track.test/' + P.n, ship_date: new Date(o.at || Date.now()).toISOString(), items: exts.map((e) => ({ order_item_external_id: e })) }; ord.shipments.push(s); ord.status = o.status || 'partial'; return s; };
  P.secret = '5e6b1c0a9d8f7e6d5c4b3a29180716253443526170819a0b1c2d3e4f5a6b7c8d'; // hex, as Printful hands it out (invented)
  // a v2 webhook body (no event id in v2: occurred_at, made from the test's id, keeps two hints apart; the same id gives the same body)
  const H = { package_shipped: 'shipment_sent', package_returned: 'shipment_returned' };
  const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
  P.hook = (ord, type, id) => {
    const t = H[type] || type || 'shipment_sent', last = ord.shipments && ord.shipments[ord.shipments.length - 1];
    const data = { order: { id: Number(ord.id), external_id: ord.external_id, status: ord.status, store_id: 1, dashboard_url: 'https://www.printful.com/dashboard?order_id=' + ord.id, created_at: ord.created_at || null, updated_at: ord.created_at || null } };
    if (/^shipment_/.test(t) && last) data.shipment = { id: Number(last.id), status: last.returned ? 'returned' : 'shipped', store_id: 1, tracking_number: String(last.id), tracking_url: last.tracking_url, created_at: last.ship_date, ship_date: last.ship_date.slice(0, 10), shipped_at: last.ship_date, delivered_at: null, reshipment: false };
    return JSON.stringify({ type: t, occurred_at: new Date(Date.UTC(2026, 11, 1) + (id ? (hash(String(id)) % 1e8) * 1000 : 0)).toISOString().replace('.000', ''), retries: 0, store_id: 1, data });
  };
  return P;
}

// ---------------- the renderer and Resend ----------------
export function png(w, h, extra) { const b = new Uint8Array(33 + (extra || 64)); b.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]); const dv = new DataView(b.buffer); dv.setUint32(16, w); dv.setUint32(20, h); for (let i = 33; i < b.length; i++) b[i] = (i * 7) & 255; return b; }
export function fakeRender() {
  const R = { calls: [], queue: [], after: {} };
  R.fetch = async (url, init) => {
    const p = new URL(url).pathname, body = JSON.parse(init.body), prod = /prod=(\w+)/.exec(body.url)[1];
    R.calls.push({ p, url: body.url, viewport: body.viewport });
    const next = R.queue.length ? R.queue.shift() : 'ok', size = prod === 'tee' ? [4500, 5400] : [2700, 1050];
    if (next === 'daily') return new Response('Browser time limit exceeded for today', { status: 429 });
    if (next === 'rate') return new Response('Too many requests', { status: 429 });
    if (next === 'err') return new Response('ERR', { status: 500 });
    if (next === 'wrongsize') return new Response(png(100, 100));
    if (next === 'big') return new Response(png(size[0], size[1], 8 * (1 << 20)));
    if (R.after.shot) await R.after.shot(body);
    return new Response(png(size[0], size[1], 2.5 * (1 << 20))); // over 2 MB: stored in parts
  };
  return R;
}
// part 4: a stand-in for the Browser Run binding itself (env.BROWSER), so render.js's real path runs: quickAction('screenshot', opts) answers a
// Response like Cloudflare's (status, X-Browser-Ms-Used, the PNG body). queue: 'ok' | 'daily' | 'rate' (an unknown 429 text) | 'err' | 'wrongsize'
// | 'throw' | 'throwdaily' | 'hang' (never answers) | a function (opts) -> Response. ms: the billed time sent with each answer (null: no header)
export function fakeBrowser() {
  const B = { calls: [], queue: [], ms: 1300, after: {} };
  B.quickAction = async (kind, opts) => {
    B.calls.push({ kind, opts: JSON.parse(JSON.stringify(opts)) });
    const next = B.queue.length ? B.queue.shift() : 'ok', prod = /prod=(\w+)/.exec(opts.url)[1], size = prod === 'tee' ? [4500, 5400] : [2700, 1050];
    const h = B.ms == null ? {} : { 'X-Browser-Ms-Used': String(B.ms) };
    if (typeof next === 'function') return next(opts);
    if (next === 'hang') return new Promise(() => {});
    if (next === 'throw') throw new Error('boom: browser went away');
    if (next === 'throwdaily') throw new Error('429: Browser time limit exceeded for today');
    if (next === 'daily') return new Response('Browser time limit exceeded for today', { status: 429, headers: h });
    if (next === 'rate') return new Response('Rate limit exceeded: try again in a few seconds', { status: 429, headers: h });
    if (next === 'err') return new Response('Navigation timeout of 30000 ms exceeded\nwaiting for selector #o svg', { status: 500, headers: h });
    if (next === 'wrongsize') return new Response(png(100, 100), { headers: Object.assign({ 'content-type': 'image/png' }, h) });
    if (B.after.shot) await B.after.shot(opts);
    return new Response(png(size[0], size[1], 4096), { headers: Object.assign({ 'content-type': 'image/png' }, h) });
  };
  return B;
}
export function fakeMail() {
  const M = { sent: [], keys: new Map(), fail: 0, calls: 0, after: {} };
  M.fetch = async (url, init) => {
    M.calls++; if (M.fail > 0) { M.fail--; return J({ message: 'try later' }, 500); }
    const b = JSON.parse(init.body), key = init.headers['Idempotency-Key'];
    if (key && M.keys.has(key)) return J({ id: M.keys.get(key) }); // Resend: the same key within 24 h sends nothing new
    M.sent.push({ key, to: b.to[0], subject: b.subject, text: b.text, html: b.html || null }); const id = 'em_' + M.sent.length; if (key) M.keys.set(key, id);
    if (M.after.send) await M.after.send(M.sent[M.sent.length - 1]);
    return J({ id });
  };
  return M;
}
export { require };
