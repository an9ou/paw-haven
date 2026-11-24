// Fakes for the merch_worker suite: Durable Object storage over node:sqlite (as cloudflare/d1_node.js fakes D1), DO namespaces, and stateful
// stand-ins for Stripe, Printful, the renderer and Resend. Nothing here reaches the network.
import { DatabaseSync } from 'node:sqlite';
import { createRequire } from 'node:module';
import { SHIP_COSTS, regionOf, PRODUCTS, unitCost } from '../catalog.js';
import { signFor } from '../stripe.js';

const require = createRequire(import.meta.url);

// ---------------- Durable Object state: storage.sql.exec / transactionSync / alarms ----------------
export class FakeState {
  constructor() { this.db = new DatabaseSync(':memory:'); this.alarmAt = null; this.inTx = false; const self = this;
    this.storage = {
      sql: { exec(q, ...b) { return self.exec(q, b); } },
      transactionSync(fn) {
        if (self.inTx) throw new Error('nested transactionSync'); // the real one would not nest either: catch it here
        self.inTx = true; self.db.exec('begin');
        try { const r = fn(); if (r && typeof r.then === 'function') throw new Error('transactionSync got an async function'); self.db.exec('commit'); return r; }
        catch (e) { self.db.exec('rollback'); throw e; } finally { self.inTx = false; }
      },
      async setAlarm(t) { self.alarmAt = Number(t); }, async getAlarm() { return self.alarmAt; }, async deleteAlarm() { self.alarmAt = null; },
      async deleteAll() { const t = self.db.prepare("select name from sqlite_master where type = 'table'").all(); for (const r of t) self.db.exec('drop table if exists "' + r.name + '"'); self.alarmAt = null; }
    };
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

// a namespace: idFromName(name) -> name; get(id).fetch(...) -> the instance's fetch
export function namespace(Cls, env) {
  const inst = new Map();
  const ns = {
    instances: inst,
    idFromName: (n) => n,
    get(id) { if (!inst.has(id)) { const st = new FakeState(); inst.set(id, { st, obj: new Cls(st, env) }); } const it = inst.get(id); return { fetch: (input, init) => it.obj.fetch(input instanceof Request ? input : new Request(input, init)), obj: it.obj, state: it.st }; }
  };
  return ns;
}

const formParse = (s) => { const o = {}; for (const kv of String(s || '').split('&').filter(Boolean)) { const i = kv.indexOf('='); o[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1)); } return o; };
const J = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json' } });

// ---------------- Stripe ----------------
export function fakeStripe() {
  const S = { now: () => Date.now(), sessions: new Map(), byKey: new Map(), refunds: [], refundKeys: new Map(), calls: [], n: 0, fail: {}, hang: null, secret: 'whsec_test_merch' };
  const lineItems = (f) => { const out = []; for (let i = 0; f['line_items[' + i + '][quantity]'] !== undefined; i++) { const q = Number(f['line_items[' + i + '][quantity]']), u = Number(f['line_items[' + i + '][price_data][unit_amount]']); out.push({ quantity: q, amount_subtotal: u * q, amount_tax: 0, amount_total: u * q, description: f['line_items[' + i + '][price_data][product_data][name]'] }); } return out; };
  S.fetch = async (url, init) => {
    const u = new URL(url), m = (init && init.method) || 'GET', h = (init && init.headers) || {}, key = h['Idempotency-Key'] || null, body = formParse(init && init.body);
    S.calls.push({ m, path: u.pathname + u.search, key, body, auth: h.Authorization, version: h['Stripe-Version'] });
    const p = u.pathname;
    const take = (k) => { if (S.fail[k] > 0) { S.fail[k]--; return true; } return false; };
    if (p === '/v1/checkout/sessions' && m === 'POST') {
      if (S.hang) await S.hang;
      if (take('create')) return J({ error: { message: 'boom' } }, 500);
      if (key && S.byKey.has(key)) return J(S.sessions.get(S.byKey.get(key)));
      const id = 'cs_test_' + (++S.n) + 'x'.repeat(8), li = lineItems(body), sub = li.reduce((a, x) => a + x.amount_subtotal, 0), fee = Number(body['shipping_options[0][shipping_rate_data][fixed_amount][amount]']);
      const cs = { id, object: 'checkout.session', url: 'https://checkout.stripe.test/c/pay/' + id, status: 'open', payment_status: 'unpaid', currency: 'usd', client_reference_id: body.client_reference_id,
        metadata: { merch: body['metadata[merch]'] }, amount_subtotal: sub, amount_total: sub + fee, shipping_cost: { amount_subtotal: fee, amount_total: fee }, total_details: { amount_discount: 0, amount_tax: 0, amount_shipping: fee },
        line_items: { data: li }, expires_at: Number(body.expires_at), payment_intent: null, form: body, country: body['shipping_address_collection[allowed_countries][0]'] };
      S.sessions.set(id, cs); if (key) S.byKey.set(key, id); return J(cs);
    }
    let mm = /^\/v1\/checkout\/sessions\/([^/]+)(\/expire)?$/.exec(p);
    if (mm && mm[2] && m === 'POST') { const cs = S.sessions.get(mm[1]); if (take('expire')) return J({ error: {} }, 500); if (!cs || cs.status !== 'open') return J({ error: { message: 'not open' } }, 400); cs.status = 'expired'; return J(cs); }
    if (mm && m === 'GET') { if (take('get')) return J({ error: { message: 'rate' } }, 429); const cs = S.sessions.get(mm[1]); if (cs && cs.status === 'open' && S.now() / 1000 > cs.expires_at) cs.status = 'expired'; // Stripe expires it at expires_at
      return cs ? J(cs) : J({ error: {} }, 404); }
    if (p === '/v1/checkout/sessions' && m === 'GET') { if (take('list')) return J({ error: {} }, 500); const pi = u.searchParams.get('payment_intent'); return J({ data: Array.from(S.sessions.values()).filter((c) => c.payment_intent === pi) }); }
    if (p === '/v1/refunds' && m === 'POST') {
      if (take('refund')) return J({ error: { message: 'no' } }, 500);
      if (key && S.refundKeys.has(key)) return J(S.refundKeys.get(key));
      const re = { id: 're_' + (++S.n), object: 'refund', amount: Number(body.amount), payment_intent: body.payment_intent, status: 'succeeded', metadata: { merch: body['metadata[merch]'], merch_refund: body['metadata[merch_refund]'] } };
      S.refunds.push(re); if (key) S.refundKeys.set(key, re); return J(re);
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

// ---------------- Printful ----------------
export function fakePrintful() {
  const P = { orders: new Map(), byExt: new Map(), calls: [], n: 9000, fail: {}, refuse: {}, costMul: 1, hangConfirm: null, timeoutCreate: 0 };
  const take = (k) => { if (P.fail[k] > 0) { P.fail[k]--; return true; } return false; };
  const out = (o) => J({ code: 200, result: o });
  P.fetch = async (url, init) => {
    const u = new URL(url), m = (init && init.method) || 'GET', body = init && init.body ? JSON.parse(init.body) : null; P.calls.push({ m, path: u.pathname, body });
    const p = u.pathname;
    if (p === '/merch/catalog-costs') return P.costs ? out(P.costs) : J({ error: {} }, 404);
    if (p === '/orders' && m === 'POST') {
      if (take('create')) return J({ code: 503, error: { reason: 'down' } }, 503);
      if (P.refuse.recipient) return J({ code: 400, error: { reason: 'recipient', message: 'cannot ship there' } }, 400);
      const bad = body.items.filter((i) => (P.refuse.variants || []).includes(i.variant_id)).map((i) => i.external_id);
      if (bad.length) return J({ code: 400, error: { reason: 'items', items: bad } }, 400);
      const id = String(++P.n), region = regionOf(body.recipient.country_code);
      const groups = {}; let items = 0;
      for (const i of body.items) { const [, prod, , size] = i.variant_id.split(':'); items += unitCost(PRODUCTS[prod], size) * i.quantity; groups[PRODUCTS[prod].group] = (groups[PRODUCTS[prod].group] || 0) + i.quantity; }
      let ship = 0; for (const g of Object.keys(groups)) ship += SHIP_COSTS[region][g][0] + (groups[g] - 1) * SHIP_COSTS[region][g][1];
      const o = { id, external_id: body.external_id, status: 'draft', recipient: body.recipient, costs: { subtotal: (items * P.costMul / 100).toFixed(2), shipping: (ship / 100).toFixed(2), tax: '0.00' }, items: body.items.map((i) => ({ external_id: i.external_id, status: 'draft' })), files: body.items.map((i) => i.files[0].url), shipments: [] };
      P.orders.set(id, o); P.byExt.set(body.external_id, id);
      if (P.timeoutCreate > 0) { P.timeoutCreate--; await new Promise((r) => setTimeout(r, 400)); }
      return out(o);
    }
    const mm = /^\/orders\/(@?)([^/]+)(\/confirm)?$/.exec(p);
    if (mm) {
      const id = mm[1] ? P.byExt.get(decodeURIComponent(mm[2])) : mm[2], o = id && P.orders.get(id);
      if (m === 'GET') { if (take('get')) return J({ error: {} }, 503); return o ? out(o) : J({ code: 404, error: { reason: 'not_found' } }, 404); }
      if (!o) return J({ code: 404, error: {} }, 404);
      if (mm[3]) { if (P.hangConfirm) await P.hangConfirm; if (take('confirm')) return J({ code: 503, error: {} }, 503); if (P.refuse.billing) return J({ code: 402, error: { reason: 'billing' } }, 402); if (P.timeoutConfirm) { P.timeoutConfirm--; o.status = 'pending'; await new Promise((r) => setTimeout(r, 400)); } o.status = 'pending'; o.items.forEach((i) => (i.status = 'pending')); return out(o); }
      if (m === 'PUT') { if (P.refuse.recipient) return J({ code: 400, error: { reason: 'recipient' } }, 400); o.recipient = body.recipient; return out(o); }
      if (m === 'DELETE') { if (take('delete')) return J({ code: 503, error: {} }, 503); if (o.status !== 'draft' && o.status !== 'pending') return J({ code: 400, error: { reason: 'cannot_cancel' } }, 400); o.status = 'canceled'; o.deleted = true; return out(o); }
    }
    return J({ error: { message: 'unknown' } }, 404);
  };
  P.ship = (id, exts, o) => { o = o || {}; const ord = P.orders.get(id); const s = { id: 'sh_' + (++P.n), carrier: 'USPS', tracking_url: 'https://track.test/' + P.n, ship_date: new Date(o.at || Date.now()).toISOString(), items: exts.map((e) => ({ order_item_external_id: e })) }; ord.shipments.push(s); ord.status = o.status || 'partial'; return s; };
  P.hook = (ord, type, id) => JSON.stringify({ id: id || null, type: type || 'package_shipped', data: { order: { id: Number(ord.id), external_id: ord.external_id } } });
  return P;
}

// ---------------- the renderer and Resend ----------------
export function png(w, h, extra) { const b = new Uint8Array(33 + (extra || 64)); b.set([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82]); const dv = new DataView(b.buffer); dv.setUint32(16, w); dv.setUint32(20, h); for (let i = 33; i < b.length; i++) b[i] = (i * 7) & 255; return b; }
export function fakeRender() {
  const R = { calls: [], queue: [] };
  R.fetch = async (url, init) => {
    const p = new URL(url).pathname, body = JSON.parse(init.body), prod = /prod=(\w+)/.exec(body.url)[1];
    R.calls.push({ p, url: body.url, viewport: body.viewport });
    const next = R.queue.length ? R.queue.shift() : 'ok', size = prod === 'tee' ? [4500, 5400] : [2700, 1050];
    if (next === 'daily') return new Response('Browser time limit exceeded for today', { status: 429 });
    if (next === 'rate') return new Response('Too many requests', { status: 429 });
    if (next === 'err') return new Response('ERR', { status: 500 });
    if (next === 'wrongsize') return new Response(png(100, 100));
    if (next === 'big') return new Response(png(size[0], size[1], 8 * (1 << 20)));
    return new Response(png(size[0], size[1], 2.5 * (1 << 20))); // over 2 MB: stored in parts
  };
  return R;
}
export function fakeMail() { const M = { sent: [] }; M.fetch = async (url, init) => { const b = JSON.parse(init.body); M.sent.push({ key: init.headers['Idempotency-Key'], to: b.to[0], subject: b.subject, text: b.text }); return J({ id: 'em_' + M.sent.length }); }; return M; }
export { require };
