// MerchLedger: one SQLite Durable Object ('ledger') with every merch table, the alarm and all order logic (TRANSACTIONS.md 2, 2.1, 2.2, 3, 4, 5, 6).
// Only the front Worker (worker.js) reaches it; it passes the buyer's IP in x-merch-ip and the page's Origin in x-merch-origin.
// Races: a Durable Object runs one event at a time between awaits, but another request may run while this one waits on Stripe or Printful.
// So every money or provider step is "claim first, call after": the state change is written in one transactionSync() before the outside call,
// and every call carries an idempotency key or is a GET-before-create (T2.2-40, T2.2-55).
import { nowOf, jstDay, jstHour, nextUtcMidnight, addBusinessDays, json, fail, sha256hex, hmacHex, orderId, ORDER_ID, pngSize, MIN, HOUR, DAY, GRACE } from './util.js';
import { buildCatalog, ZONES, zoneOf, regionOf, variantId, PRODUCTS as CATP } from './catalog.js';
import { checkBasket, priceBasket, marginOf, quoteOut, openCountries, fromOpen, productsOn, taxBehavior, withArtVer } from './lines.js';
import * as stripe from './stripe.js';
import * as provider from './provider_printful.js';
import * as render from './render.js';
import * as mail from './mail.js';
import { adminRoute } from './admin.js';

const TEST_ORIGIN = 'https://test.doodledoggo.app';
const PNG_MAX = 7.5 * (1 << 20);
const LINE_RANK = { pending: 0, queued: 1, ready: 2, drafted: 3, confirmed: 4, in_production: 5, shipped: 6, delivered: 7 };
const DEAD = ['void', 'rejected', 'cancelled', 'replaced'];
const PAID_STATES = ['paid', 'held', 'confirming', 'confirmed', 'part_shipped', 'shipped'];
const BACKOFF = [1, 5, 15, 60].map((m) => m * MIN);

export const SCHEMA = `
create table if not exists merch_orders (id text primary key, nonce text unique, day text, created_at integer, updated_at integer, status text, hold text,
  country text, zone text, lang text, cat_ver text, subtotal integer, ship_fee integer, ship_extra integer, tax integer, total integer,
  pres_currency text, pres_amount integer, cost_est integer, margin_est integer, stripe_session text unique, checkout_url text, expires_at integer,
  pay_pending integer default 0, payment_intent text, paid_at integer, cancel_until integer, ship_by integer, provider text, provider_order text,
  provider_cost integer, confirmed_at integer, refunded integer default 0, refunded_at integer, refund_failed integer default 0, disputed_at integer,
  dispute text, dispute_id text, late_sent_at integer, gift_code text, email_hash text, tries integer default 0, next_try_at integer, last_error text,
  hold_at integer, why text, draft_del integer default 0);
create index if not exists merch_orders_pi on merch_orders (payment_intent);
create index if not exists merch_orders_due on merch_orders (status, next_try_at);
create index if not exists merch_orders_day on merch_orders (day, status);
create index if not exists merch_orders_email on merch_orders (email_hash);
create table if not exists merch_order_items (order_id text, line integer, product text, colour text, size text, pose text, name_on integer, qty integer,
  name text, recipe text, print_link text, art_ver text, unit integer, line_total integer, line_tax integer, cost_est integer, provider_variant text,
  status text, file_key text, file_sha text, file_bytes integer, rendered_at integer, renderer text, provider_item text, parcel_id text,
  refunded_qty integer default 0, refunded integer default 0, reprint_of integer, tries integer default 0, last_error text, rp integer, keep_until integer,
  primary key (order_id, line));
create index if not exists merch_items_status on merch_order_items (status);
create table if not exists merch_parcels (id text primary key, order_id text, product text, carrier text, tracking_url text, shipped_at integer,
  delivered_at integer, lost_at integer, returned_at integer);
create index if not exists merch_parcels_order on merch_parcels (order_id);
create table if not exists merch_refunds (id text primary key, order_id text, line integer, qty integer, amount integer, reason text, stripe_refund text,
  status text, created_at integer, next_try_at integer);
create table if not exists merch_events (id text primary key, order_id text, type text, at integer, note text);
create table if not exists merch_variants (id text primary key, product text, colour text, size text, provider_variant text, cost_base integer, on_flag integer, cost_at integer);
create table if not exists merch_ship_costs (id text primary key, first integer, extra integer, cost_at integer);
create table if not exists merch_flags (key text primary key, mode text, note text, created_at integer);
create table if not exists merch_gift_pool (code text primary key, order_id text unique, claimed_at integer);
create table if not exists merch_rate (k text primary key, n integer, reset_at integer);
create table if not exists merch_shards (name text primary key, bytes integer, files integer, keep_until integer);
create table if not exists merch_meta (k text primary key, v text);
create table if not exists merch_reprints (id text primary key, order_id text, n integer, provider_order text, status text, created_at integer);
`;

let PAWPRINT = null; // loaded once per object, lazily: about 30 ms of CPU, so never in the front Worker (Free: 10 ms a request)
async function loadPawPrint(env) {
  if (env.PAWPRINT) return env.PAWPRINT;
  if (!PAWPRINT) { const m = await import('../../merch/dist/pawprint.js'); PAWPRINT = m.default || m; }
  return PAWPRINT;
}
const piOf = (cs) => (typeof cs.payment_intent === 'string' ? cs.payment_intent : cs.payment_intent && cs.payment_intent.id) || null;
const countryOf = (cs) => { const a = (cs.collected_information && cs.collected_information.shipping_details && cs.collected_information.shipping_details.address) || (cs.shipping_details && cs.shipping_details.address) || {}; return a.country || null; };
const emailOf = (cs) => (cs && cs.customer_details && cs.customer_details.email) || null;
function recipientOf(cs) { // read from the session when the draft is made: never stored
  const d = (cs.collected_information && cs.collected_information.shipping_details) || cs.shipping_details || {}; const a = d.address || {};
  return { name: d.name || '', address1: a.line1 || '', address2: a.line2 || '', city: a.city || '', state_code: a.state || '', zip: a.postal_code || '', country_code: a.country || '' };
}

export class MerchLedger {
  constructor(state, env) { this.state = state; this.st = state.storage; this.sql = state.storage.sql; this.env = env; this.fx = []; this.inited = false; }
  now() { return nowOf(this.env); }
  q(s, ...a) { return this.sql.exec(s, ...a).toArray(); }
  one(s, ...a) { return this.q(s, ...a)[0] || null; }
  run(s, ...a) { this.sql.exec(s, ...a).toArray(); }
  tx(fn) { return this.st.transactionSync(fn); }
  async init() {
    if (this.inited) return;
    this.sql.exec(SCHEMA); this.PP = await loadPawPrint(this.env); this.cat = buildCatalog(this.PP); this.inited = true;
  }
  meta(k) { const r = this.one('select v from merch_meta where k = ?', k); return r ? r.v : null; }
  setMeta(k, v) { this.run('insert or replace into merch_meta (k, v) values (?, ?)', k, String(v)); }
  order(id) { return typeof id === 'string' ? this.one('select * from merch_orders where id = ?', id) : null; }
  lines(id) { return this.q('select * from merch_order_items where order_id = ? order by line', id).map((l) => Object.assign(l, { group: (CATP[l.product] || {}).group, variant: variantId(l.product, l.colour, l.size) })); }
  // set columns of an order; from: the statuses it may move from (the guard); -> true when it changed
  set(id, cols, from) {
    const k = Object.keys(cols); cols.updated_at = this.now(); if (!k.includes('updated_at')) k.push('updated_at');
    const where = from ? ' and status in (' + from.map(() => '?').join(',') + ')' : '';
    return this.q('update merch_orders set ' + k.map((c) => c + ' = ?').join(', ') + ' where id = ?' + where + ' returning id', ...k.map((c) => cols[c]), id, ...(from || [])).length > 0;
  }
  setLine(id, line, cols) { const k = Object.keys(cols); this.run('update merch_order_items set ' + k.map((c) => c + ' = ?').join(', ') + ' where order_id = ? and line = ?', ...k.map((c) => cols[c]), id, line); }
  next(id, t) { this.run('update merch_orders set next_try_at = ? where id = ?', t, id); }
  // an event row; false when it was there already (the same delivery twice)
  event(eid, orderId, type, note) { return this.q('insert into merch_events (id, order_id, type, at, note) values (?, ?, ?, ?, ?) on conflict(id) do nothing returning id', eid, orderId || null, String(type || '').slice(0, 60), this.now(), note == null ? null : String(note).slice(0, 300)).length > 0; }
  ownerMail(orderId, reason, note) { this.fx.push({ t: 'owner', order: orderId || '-', reason, note }); }
  buyerMail(orderId, kind, key, to) { this.fx.push({ t: 'mail', order: orderId, kind, key, to }); }
  flagged(key) { const r = this.one('select mode from merch_flags where key = ?', key); return r && r.mode === 'block'; }
  async hashOf(s) { return hmacHex(this.env.MERCH_HASH_KEY || 'merch-unset', s); }
  rate(k, limit) {
    const now = this.now(), r = this.one('select n, reset_at from merch_rate where k = ?', k);
    if (!r || r.reset_at <= now) { this.run('insert or replace into merch_rate (k, n, reset_at) values (?, 1, ?)', k, now + HOUR); return true; }
    if (r.n >= limit) return false;
    this.run('update merch_rate set n = n + 1 where k = ?', k); return true;
  }
  served() { return [this.PP.ART_VER].concat(String(this.env.MERCH_ART_VERS || '').split(',').map((s) => s.trim()).filter(Boolean)); }
  cap() { const n = Number(this.env.MERCH_DAY_CAP); return Number.isFinite(n) && this.env.MERCH_DAY_CAP !== '' && this.env.MERCH_DAY_CAP != null ? n : 10; }
  dayCount(day) { return Number(this.one("select count(*) as n from merch_orders where day = ? and status != 'expired'", day).n); }
  coolMs() { const m = Number(this.env.MERCH_COOL_MIN); return (Number.isFinite(m) && m > 0 ? m : 60) * MIN; }
  live() { return this.env.MERCH_PROVIDER_MODE === 'live'; }
  // can a new order be taken? -> { ok } or { ok: false, why }
  gate() {
    const now = this.now();
    if (!fromOpen(this.env, now)) return { ok: false, why: 'shut' };
    if (this.env.MERCH_OFF === '1') return { ok: false, why: 'off' };
    // nothing set up: never take an order (no Stripe fetch seam, no key, no webhook secret, no hash or file key)
    if (!stripe.stripeReady(this.env) || !this.env.MERCH_HASH_KEY || !this.env.MERCH_FILE_KEY) return { ok: false, why: 'not_set_up' };
    return { ok: true };
  }
  shut(g) { return fail('merch_closed', 503, g.why === 'off' ? { resting: true } : {}); }
  variantOff() { const off = new Set(this.q('select id from merch_variants where on_flag = 0').map((r) => r.id)); return (v) => off.has(v); }
  costs() {
    const v = new Map(this.q('select id, cost_base from merch_variants where cost_base is not null').map((r) => [r.id, r.cost_base]));
    const s = new Map(this.q('select id, first, extra from merch_ship_costs').map((r) => [r.id, [r.first, r.extra]]));
    return { unit: (id) => v.get(id), ship: (region, g) => s.get(region + ':' + g) };
  }
  basket(body) {
    const b = checkBasket(this.PP, this.cat, this.env, body, this.variantOff());
    if (b.err) return b;
    for (const l of b.lines) l.tax_code = this.cat.products[l.product].tax_code;
    return b;
  }

  /* ---------------- the front door ---------------- */
  async fetch(req) {
    await this.init();
    const u = new URL(req.url), p = u.pathname.replace(/\/+$/, ''), m = req.method, ip = req.headers.get('x-merch-ip') || 'local';
    try {
      if (p === '/internal/cron') return json(await this.cron());
      if (p === '/internal/tick') { await this.tick(); return json({ ok: true }); }
      if (p === '/merch/catalog' && m === 'GET') return this.rCatalog();
      if (p === '/merch/quote' && m === 'POST') return await this.rQuote(req, ip);
      if (p === '/merch/checkout' && m === 'POST') return await this.rCheckout(req, ip);
      if (p === '/merch/webhook/stripe' && m === 'POST') return await this.rStripe(req);
      if (p === '/merch/webhook/provider' && m === 'POST') return await this.rProvider(req);
      if (p.startsWith('/merch/admin/')) return await adminRoute(this, req, p.slice('/merch/admin/'.length), ip);
      const mm = /^\/merch\/order\/([^/]+)(?:\/(cancel|address|refund))?$/.exec(p);
      if (mm) return await this.rOrder(req, mm[1], mm[2] || null, m, ip);
      return fail('not_found', 404);
    } finally { await this.flush(); await this.arm(); }
  }
  async body(req) { const t = await req.text(); if (t.length > 65536) return null; try { const o = JSON.parse(t || '{}'); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }

  rCatalog() {
    const now = this.now(), g = this.gate(), on = productsOn(this.env), off = this.variantOff();
    const products = Object.values(this.cat.products).filter((P) => P.launch && on.has(P.id) && this.PP.PRODUCTS[P.id] && this.PP.PRODUCTS[P.id].launch).map((P) => {
      const colours = P.colours.map((c) => ({ id: c.id, name: c.name, hex: c.hex, sizes: c.sizes.filter((s) => !off(variantId(P.id, c.id, s))), on: P.sized ? c.sizes.some((s) => !off(variantId(P.id, c.id, s))) : !off(variantId(P.id, c.id, null)) }));
      const sizes = P.sized ? Array.from(new Set(P.colours.flatMap((c) => c.sizes))).map((s) => ({ id: s, price: P.price + ((P.size_price && P.size_price[s]) || 0) })) : [];
      return { id: P.id, price: P.price, sizes, colours, poses: P.poses, on: colours.some((c) => c.on) };
    });
    const zones = Object.values(ZONES).map((z) => ({ id: z.id, fee: z.fee, free_from: z.free_from, extra: z.extra, eta: { min: z.eta[0], max: z.eta[1] } }));
    const countries = g.ok ? Array.from(openCountries(this.env)).sort().map((c) => ({ code: c, zone: zoneOf(c) })) : [];
    return json({ cat_ver: this.cat.cat_ver, shut: !g.ok, resting: g.why === 'off' || undefined, sold_out_today: this.dayCount(jstDay(now)) >= this.cap(), products, zones, countries,
      max_lines: this.cat.limits.max_lines, max_qty: this.cat.limits.max_qty, art_vers: this.served() });
  }
  async rQuote(req, ip) {
    const ih = await this.hashOf(ip), body = await this.body(req);
    return this.tx(() => {
      if (!this.rate('quote:ip:' + ih, 60)) return fail('slow_down', 429);
      const g = this.gate(); if (!g.ok) return this.shut(g);
      if (!body) return fail('bad_json', 400);
      const b = this.basket(body); if (b.err) return json(b.err.body, b.err.status);
      if (this.dayCount(jstDay(this.now())) >= this.cap()) return fail('sold_out_today', 409);
      return json(quoteOut(this.cat, b, priceBasket(b.zone, b.lines)));
    });
  }
  async rCheckout(req, ip) {
    const ih = await this.hashOf(ip), body = await this.body(req), origin = req.headers.get('x-merch-origin') || '';
    const r = this.tx(() => {
      if (!this.rate('checkout:ip:' + ih, 10)) return { res: fail('slow_down', 429) };
      const g = this.gate(); if (!g.ok) return { res: this.shut(g) };
      if (!body) return { res: fail('bad_json', 400) };
      if (this.flagged('ip:' + ih)) return { res: fail('not_available', 403) };
      if (this.env.MERCH_TEST !== '1' && origin === TEST_ORIGIN) return { res: fail('not_available', 403) }; // the live Worker refuses the test copy
      if (this.env.MERCH_TEST === '1' && origin && origin !== TEST_ORIGIN) return { res: fail('not_available', 403) };
      if (body.agree !== true) return { res: fail('no_agree', 400) };
      if (typeof body.nonce !== 'string' || !/^[A-Za-z0-9_-]{8,64}$/.test(body.nonce)) return { res: fail('bad_nonce', 400) };
      const ex = this.one('select id, status, checkout_url from merch_orders where nonce = ?', body.nonce);
      if (ex) { // a double tap (T2.1-03, T2.1-04)
        if (ex.status === 'open' && ex.checkout_url) return { res: json({ order: ex.id, url: ex.checkout_url }) };
        if (ex.status === 'open') return { res: fail('busy', 409) };
        return { res: fail('nonce_used', 409, { order: ex.id }) };
      }
      if (typeof body.art_ver !== 'string' || !this.served().includes(body.art_ver)) return { res: fail('art_changed', 409) };
      const b = this.basket(body); if (b.err) return { res: json(b.err.body, b.err.status) };
      const pr = priceBasket(b.zone, b.lines);
      if (body.expect_total !== pr.total) return { res: fail('price_changed', 409, { quote: quoteOut(this.cat, b, pr) }) };
      const now = this.now(), day = jstDay(now);
      if (this.dayCount(day) >= this.cap()) return { res: fail('sold_out_today', 409) };
      const mg = marginOf(this.cat, b.country, b.lines, pr.subtotal, pr.ship_fee, now, this.costs());
      if (!mg.pass) {
        this.ownerMail(null, 'cant_make', 'A basket failed the margin guard: ' + b.country + ' ' + b.lines.map((l) => l.qty + 'x ' + l.variant).join(', ') + ' total ' + pr.total + ' margin ' + Math.round(mg.margin));
        return { res: fail('cant_make', 409) };
      }
      const id = orderId(), lang = typeof body.lang === 'string' ? body.lang.slice(0, 10) : 'en';
      const o = { id, nonce: body.nonce, day, created_at: now, updated_at: now, status: 'open', country: b.country, zone: b.zone, lang, cat_ver: this.cat.cat_ver,
        subtotal: pr.subtotal, ship_fee: pr.ship_fee, ship_extra: pr.ship_extra, tax: 0, total: pr.total, cost_est: mg.W, margin_est: Math.round(mg.margin), expires_at: now + HOUR };
      const k = Object.keys(o);
      this.run('insert into merch_orders (' + k.join(',') + ') values (' + k.map(() => '?').join(',') + ')', ...k.map((x) => o[x]));
      for (const l of b.lines) {
        this.run(`insert into merch_order_items (order_id, line, product, colour, size, pose, name_on, qty, name, recipe, print_link, art_ver, unit, line_total, line_tax, cost_est, provider_variant, status)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 'pending')`, id, l.line, l.product, l.colour, l.size, l.pose, l.name_on, l.qty, l.name, l.recipe,
          withArtVer(l.print_link, body.art_ver), body.art_ver, l.unit, l.line_total, l.cost_est, l.provider_variant);
      }
      return { o, b };
    });
    if (r.res) return r.res;
    const { o, b } = r;
    const site = this.env.MERCH_SITE || 'https://doodledoggo.app';
    const s = await stripe.createSession(this.env, o, stripe.sessionForm(o, b.lines, ZONES[o.zone], taxBehavior(o.country), site));
    if (!s.ok || !s.data || typeof s.data.id !== 'string' || typeof s.data.url !== 'string') { // T2.1-05: nothing kept, the next tap starts clean
      this.tx(() => { if (this.q("delete from merch_orders where id = ? and status = 'open' and checkout_url is null returning id", o.id).length) this.run('delete from merch_order_items where order_id = ?', o.id); });
      return fail('busy', 503, { say: "We couldn't reach the payment page. Nothing was paid." });
    }
    this.tx(() => this.set(o.id, { stripe_session: s.data.id, checkout_url: s.data.url, next_try_at: o.expires_at + HOUR }));
    return json({ order: o.id, url: s.data.url });
  }

  /* ---------------- the order page and the buyer's buttons ---------------- */
  async rOrder(req, id, act, m, ip) {
    const ih = await this.hashOf(ip);
    if (!act && m === 'GET') {
      if (!this.tx(() => this.rate('order:ip:' + ih, 120))) return fail('slow_down', 429);
      const o = ORDER_ID.test(id) && this.order(id); if (!o) return fail('not_found', 404);
      return json(this.page(o));
    }
    if (!act || m !== 'POST') return fail('not_found', 404);
    if (!this.tx(() => this.rate('act:ip:' + ih, 10))) return fail('slow_down', 429);
    const o = ORDER_ID.test(id) && this.order(id); if (!o) return fail('not_found', 404);
    const body = (await this.body(req)) || {};
    if (act === 'cancel') return this.rCancel(o, body);
    if (act === 'address') return this.rAddress(o, body);
    if (act === 'refund') {
      const done = this.tx(() => { const x = this.order(o.id); if (!(x.status === 'held' && x.hold === 'address')) return false; this.fullRefund(x, 'address_refund', 'refunded'); return true; });
      if (!done) return fail('not_allowed', 409);
      await this.flush(); return json({ status: 'refunded' });
    }
  }
  // what GET /merch/order/:id shows: never an address, an email or its hash (TRANSACTIONS 5)
  page(o) {
    const now = this.now(), L = this.lines(o.id), parcels = this.q('select * from merch_parcels where order_id = ? order by shipped_at', o.id);
    const can = ['paid', 'held'].includes(o.status) && o.hold !== 'dispute' && o.cancel_until != null && now < o.cancel_until + GRACE;
    const unshipped = L.some((l) => !DEAD.includes(l.status) && (LINE_RANK[l.status] || 0) < LINE_RANK.shipped && l.refunded_qty < l.qty);
    return { id: o.id, status: o.status, hold: o.hold, pay_pending: !!o.pay_pending, paid_at: o.paid_at, cancel_until: o.cancel_until, can_cancel: can, country: o.country,
      lines: L.map((l) => ({ line: l.line, product: l.product, colour: l.colour, size: l.size, pose: l.pose, name_on: !!l.name_on, name: l.name_on ? l.name : null, qty: l.qty, unit: l.unit,
        status: l.status, refunded_qty: l.refunded_qty, parcel: l.parcel_id, recipe: l.recipe, reprint_of: l.reprint_of })),
      parcels: parcels.map((p) => ({ id: p.id, product: p.product, carrier: p.carrier, tracking_url: p.tracking_url, shipped_at: p.shipped_at, delivered_at: p.delivered_at })),
      totals: { subtotal: o.subtotal, ship_fee: o.ship_fee, tax: o.tax, total: o.total, refunded: o.refunded }, pres: o.pres_currency ? { currency: o.pres_currency, amount: o.pres_amount } : null,
      gift_code: o.gift_code, late: !!o.late_sent_at && unshipped, resting: this.env.MERCH_OFF === '1' || undefined, dispute: o.dispute || null };
  }
  async rCancel(o, body) {
    const now = this.now(), scope = body.scope === 'late' ? 'late' : 'order';
    if (scope === 'late') { // T2.1-31: the FTC delay cancel
      const r = this.tx(() => {
        const x = this.order(o.id); if (!x.late_sent_at || !['confirmed', 'part_shipped'].includes(x.status)) return null;
        const late = this.lines(x.id).filter((l) => !DEAD.includes(l.status) && LINE_RANK[l.status] < LINE_RANK.shipped && l.refunded_qty < l.qty);
        if (!late.length) return null;
        for (const l of late) this.lineRefund(this.order(x.id), l, l.qty - l.refunded_qty, 'late');
        this.fx.push({ t: 'pcancel', order: x.id, items: late.map((l) => x.id + '_' + l.line) });
        return true;
      });
      if (!r) return fail('not_late', 409);
      await this.flush(); const x = this.order(o.id);
      return json({ status: x.status, refund: this.refundState(x.id) });
    }
    if (o.status === 'open') { // T2.1-19: expire the session at Stripe
      if (o.stripe_session) {
        const e = await stripe.expireSession(this.env, o.stripe_session);
        if (!e.ok) {
          const g = await stripe.getSession(this.env, o.stripe_session);
          if (!g.ok || !g.data) return fail('busy', 503);
          if (g.data.status === 'complete' && g.data.payment_status === 'paid') { await this.paidFrom(o.id, g.data, 'x:cancel:' + o.id); return this.rCancel(this.order(o.id), body); }
          if (g.data.status !== 'expired') return fail('busy', 503);
        }
      }
      this.tx(() => this.expire(o.id));
      return json({ status: 'expired', refund: null });
    }
    if (o.status === 'cancelled') return json({ status: 'cancelled', refund: this.refundState(o.id) });
    if (o.status === 'expired') return json({ status: 'expired', refund: null });
    if (o.hold === 'dispute') return fail('not_allowed', 409, { say: 'Your bank is looking at this payment, so we\u2019ve paused it.' }); // the bank decides the money
    // T2.1-18 / T2.2-40: a cancel handled before cancel_until + 120 s wins; a confirm never starts before then and writes 'confirming' first
    const ok = this.tx(() => {
      const x = this.order(o.id);
      if (!['paid', 'held'].includes(x.status) || x.hold === 'dispute' || x.cancel_until == null || this.now() >= x.cancel_until + GRACE) return false;
      this.fullRefund(x, 'cancel', 'cancelled'); return true;
    });
    if (!ok) return fail('too_late', 409, { say: "Printing has started, so this order can't be cancelled now. If something arrives damaged, we'll make it right." });
    await this.flush();
    return json({ status: 'cancelled', refund: this.refundState(o.id) });
  }
  refundState(id) { const r = this.q("select status from merch_refunds where order_id = ? and id like 'mr_%'", id); if (!r.length) return null; return r.every((x) => x.status === 'done') ? 'done' : 'sending'; }
  async rAddress(o, body) {
    if (!((o.status === 'held' && o.hold === 'address') || o.hold === 'reship')) return fail('not_needed', 409);
    const f = (k, max, need) => { const v = body[k]; if (v == null || v === '') return need ? false : ''; return typeof v === 'string' && v.trim().length <= max && !/[\u0000-\u001f]/.test(v) ? v.trim() : false; };
    const a = { name: f('name', 80, true), line1: f('line1', 120, true), line2: f('line2', 120, false), city: f('city', 80, true), state: f('state', 60, false), postal: f('postal', 20, true) };
    for (const k of Object.keys(a)) if (a[k] === false) return fail('bad_address', 400, { field: k });
    if (typeof body.country !== 'string' || !/^[A-Z]{2}$/.test(body.country)) return fail('bad_address', 400, { field: 'country' });
    if (body.country !== o.country) return fail('other_country', 400, { country: o.country, say: 'We can only send this order to its country. To send it somewhere else, we’ll refund you and you can order again.' });
    const rec = { name: a.name, address1: a.line1, address2: a.line2, city: a.city, state_code: a.state, zip: a.postal, country_code: body.country }; // sent on, never stored
    if (o.hold === 'reship') { const r = await this.reprint(o, this.reshipLines(o).map((l) => l.line), null, rec, 'reship'); return r.ok ? json({ ok: true }) : fail(r.error || 'busy', r.status || 503); }
    const r = o.provider_order ? await provider.update(this.env, o.provider_order, rec) : await this.makeDraft(o, rec);
    if (r && r.kind === 'address') return fail('bad_address', 400, { field: 'address' });
    if (!r || (!r.ok && r.kind !== undefined)) return fail('busy', 503);
    this.tx(() => { const x = this.order(o.id); if (x.status === 'held' && x.hold === 'address') this.set(o.id, { status: 'paid', hold: null, why: null, hold_at: null, next_try_at: this.now() }, ['held']); });
    await this.tick(); // the flow resumes now (confirm if the hour has passed)
    return json({ ok: true, say: 'Thanks! We’ll send it there.' });
  }

  /* ---------------- money: refunds (TRANSACTIONS 4) ---------------- */
  // the whole order back (cancel in the hour, can't make it, a hold that timed out). Sync: call inside tx(). One row mr_<order>_all_<n>.
  fullRefund(o, reason, to) {
    const now = this.now(), amount = Math.max(0, (o.total || 0) - (o.refunded || 0));
    if (amount > 0) {
      const n = Number(this.one("select count(*) as n from merch_refunds where id like ?", 'mr_' + o.id + '_all_%').n) + 1, rid = 'mr_' + o.id + '_all_' + n;
      this.run("insert into merch_refunds (id, order_id, line, qty, amount, reason, status, created_at, next_try_at) values (?, ?, null, null, ?, ?, 'sending', ?, ?)", rid, o.id, amount, reason, now, now);
      this.fx.push({ t: 'refund', id: rid });
    }
    for (const l of this.lines(o.id)) {
      const shipped = (LINE_RANK[l.status] || 0) >= LINE_RANK.shipped;
      const cols = { refunded_qty: l.qty, refunded: l.line_total + (l.line_tax || 0) };
      if (!shipped && !DEAD.includes(l.status)) { cols.status = to === 'cancelled' ? 'cancelled' : 'cancelled'; cols.keep_until = now + 2 * DAY; }
      this.setLine(o.id, l.line, cols);
    }
    const cols = { status: to, refunded: o.total || 0, refunded_at: now, next_try_at: now };
    if (to !== 'refunded' || !['part_shipped', 'shipped'].includes(o.status)) cols.hold = null;
    if (o.provider_order && !o.confirmed_at) { cols.draft_del = 1; this.fx.push({ t: 'deldraft', order: o.id }); }
    this.set(o.id, cols);
    this.buyerMail(o.id, to === 'cancelled' ? 'cancelled' : 'refunded', 'me_' + o.id + '_' + (to === 'cancelled' ? 'cancelled' : 'refund_all'));
  }
  // one line, q of its items (owner, a reject, a late line). Section 4 amounts; the last item left takes the shipping too (T2.1-22). Sync.
  lineRefund(o, l, q, reason) {
    const left = l.qty - l.refunded_qty; if (!Number.isInteger(q) || q < 1 || q > left) return { error: 'bad_qty' };
    const L = this.lines(o.id).filter((x) => !['void', 'replaced'].includes(x.status));
    const before = L.reduce((a, x) => a + x.qty - x.refunded_qty, 0), after = before - q;
    let amount = l.unit * q + Math.round((l.line_tax || 0) * q / l.qty);
    if (o.zone === 'world' && o.ship_fee > 0) amount += ZONES.world.extra * (Math.max(0, before - 1) - Math.max(0, after - 1));
    const rest = (o.total || 0) - (o.refunded || 0);
    if (after === 0) amount = rest; // nothing left un-refunded: the shipping that is left goes back too
    amount = Math.max(0, Math.min(amount, rest));
    const now = this.now(), n = Number(this.one('select count(*) as n from merch_refunds where id like ?', 'mr_' + o.id + '_l' + l.line + '_%').n) + 1, rid = 'mr_' + o.id + '_l' + l.line + '_' + n;
    if (amount > 0) { this.run("insert into merch_refunds (id, order_id, line, qty, amount, reason, status, created_at, next_try_at) values (?, ?, ?, ?, ?, ?, 'sending', ?, ?)", rid, o.id, l.line, q, amount, reason, now, now); this.fx.push({ t: 'refund', id: rid }); }
    this.setLine(o.id, l.line, { refunded_qty: l.refunded_qty + q, refunded: l.refunded + amount });
    const cols = { refunded: (o.refunded || 0) + amount, refunded_at: now };
    if (after === 0) {
      cols.status = 'refunded'; cols.next_try_at = now;
      if (!['part_shipped', 'shipped'].includes(o.status)) cols.hold = null;
      if (o.provider_order && !o.confirmed_at) { cols.draft_del = 1; this.fx.push({ t: 'deldraft', order: o.id }); }
      for (const x of L) if (!DEAD.includes(x.status) && (LINE_RANK[x.status] || 0) < LINE_RANK.shipped) this.setLine(o.id, x.line, { status: 'cancelled', keep_until: now + 2 * DAY });
    }
    this.set(o.id, cols);
    if (after > 0 && ['confirmed', 'part_shipped'].includes(o.status)) { // what is left may all be shipped already (a late part refunded)
      const live = this.lines(o.id).filter((x) => !DEAD.includes(x.status) && x.refunded_qty < x.qty);
      if (live.length && live.every((x) => (LINE_RANK[x.status] || 0) >= LINE_RANK.shipped)) this.set(o.id, { status: 'shipped', next_try_at: null });
    }
    if (reason !== 'render' && reason !== 'provider') this.buyerMail(o.id, 'refunded', 'me_' + o.id + '_refund_' + rid);
    return { id: rid, amount, last: after === 0 };
  }
  async sendRefund(rid) {
    const r = this.one('select * from merch_refunds where id = ?', rid); if (!r || r.status !== 'sending') return;
    const o = this.order(r.order_id); if (!o || !o.payment_intent) { this.tx(() => this.run('update merch_refunds set next_try_at = ? where id = ?', this.now() + 15 * MIN, rid)); return; }
    const res = await stripe.refund(this.env, o.payment_intent, r.amount, r.id, o.id);
    this.tx(() => {
      const now = this.now();
      if (res.ok && res.data && res.data.id) { this.run("update merch_refunds set status = 'done', stripe_refund = ?, next_try_at = null where id = ? and status = 'sending'", res.data.id, rid); return; }
      this.run('update merch_refunds set next_try_at = ? where id = ?', now + 5 * MIN, rid); // T2.2-42: the alarm retries with the same key
      if (now - r.created_at >= DAY) this.ownerMail(o.id, 'refund_stuck', 'A refund has not gone through for 24 hours: ' + rid);
    });
  }

  /* ---------------- side effects, after each transaction ---------------- */
  async flush() {
    while (this.fx.length) {
      const e = this.fx.shift();
      try {
        if (e.t === 'refund') await this.sendRefund(e.id);
        else if (e.t === 'owner') {
          const eid = 'o:' + e.order + ':' + e.reason + ':' + jstDay(this.now());
          if (this.one('select id from merch_events where id = ?', eid)) continue;
          const r = await mail.owner(this.env, e.order, e.reason, e.note);
          this.tx(() => this.event(eid, e.order === '-' ? null : e.order, 'owner_mail', e.reason + (r.sent ? '' : ' (not sent: ' + r.why + ')')));
        } else if (e.t === 'mail') {
          const eid = 'm:' + e.key; if (this.one('select id from merch_events where id = ?', eid)) continue;
          let to = e.to;
          if (!to) { const o = this.order(e.order); if (o && o.stripe_session) { const g = await stripe.getSession(this.env, o.stripe_session); to = g.ok ? emailOf(g.data) : null; } }
          const r = await mail.send(this.env, to, e.kind, e.order, e.key);
          if (r.sent || r.why === 'not_set_up') this.tx(() => this.event(eid, e.order, 'mail', e.kind + (r.sent ? '' : ' (not sent)')));
        } else if (e.t === 'deldraft') {
          const o = this.order(e.order); if (!o || !o.provider_order || !o.draft_del) continue;
          const r = await provider.deleteDraft(this.env, o.provider_order);
          this.tx(() => (r.ok ? this.set(o.id, { draft_del: 0 }) : this.next(o.id, this.now() + 15 * MIN))); // T2.2-41: retried by the alarm
        } else if (e.t === 'pcancel') {
          const o = this.order(e.order); const r = o && o.provider_order ? await provider.cancel(this.env, o.provider_order) : { ok: false, kind: 'cannot' };
          if (!r.ok) this.tx(() => this.ownerMail(e.order, 'cancel_late', 'Printful could not cancel the late part (' + (r.kind || '?') + '): please cancel it in the Printful dashboard if you can.'));
        }
      } catch (err) { console.error('merch fx', e.t, String((err && err.message) || err).slice(0, 100)); }
    }
  }

  /* ---------------- Stripe (TRANSACTIONS 3.2, 2.1, 2.2) ---------------- */
  async rStripe(req) {
    const raw = await req.text(); if (raw.length > 600000) return fail('too_big', 413);
    if (!this.env.MERCH_STRIPE_WEBHOOK_SECRET) return fail('not_set_up', 503);
    const sig = await stripe.sigOk(this.env, raw, req.headers.get('stripe-signature'), this.now());
    if (sig === 'stale') return fail('stale', 400);
    if (sig !== true) return fail('bad_signature', 400);
    let ev; try { ev = JSON.parse(raw); } catch (e) { return fail('bad_json', 400); }
    if (!ev || typeof ev.id !== 'string' || !/^[A-Za-z0-9_]{1,255}$/.test(ev.id)) return fail('bad_json', 400);
    const eid = 's:' + ev.id, type = String(ev.type || ''), o = ev.data && ev.data.object;
    if (this.one('select id from merch_events where id = ?', eid)) return json({ received: true }); // T2.1-24
    const ack = (orderId, note, fn) => { this.tx(() => { if (this.event(eid, orderId, type, note) && fn) fn(); }); return json({ received: true }); };
    if (!o || typeof o !== 'object') return ack(null, 'no object');
    if (type === 'checkout.session.completed' || type === 'checkout.session.async_payment_succeeded') {
      const x = this.sessionOrder(o); if (!x) return ack(null, 'not ours');
      if (type === 'checkout.session.completed' && o.payment_status !== 'paid') return ack(x.id, 'unpaid', () => { if (this.order(x.id).status === 'open') this.set(x.id, { pay_pending: 1 }, ['open']); }); // T2.1-07
      if (x.status !== 'open') { // T2.1-25, T2.2-18, T2.2-24: nothing more
        if (x.dispute && !x.email_hash) { const g = await stripe.getSession(this.env, x.stripe_session); const em = g.ok ? emailOf(g.data) : null; const h = em ? await this.hashOf(em.toLowerCase()) : null; return ack(x.id, 'after ' + x.status, () => { if (h) { this.set(x.id, { email_hash: h }); this.flag('e:' + h, 'block', 'dispute ' + x.id); } }); }
        return ack(x.id, 'after ' + x.status);
      }
      const g = await stripe.getSession(this.env, x.stripe_session || o.id); // the re-read: the webhook body is never what we act on
      if (!g.ok || !g.data) return fail('stripe_error', 502); // T2.2-16: no event row, Stripe retries
      if (g.data.payment_status !== 'paid') return ack(x.id, 'not paid yet', () => { this.set(x.id, { pay_pending: 1 }, ['open']); });
      return this.paidFrom(x.id, g.data, eid).then(() => json({ received: true }));
    }
    if (type === 'checkout.session.expired' || type === 'checkout.session.async_payment_failed') {
      const x = this.sessionOrder(o); return ack(x && x.id, null, () => { if (x) this.expire(x.id); }); // T2.1-09; after paid: ignored (T2.1-26)
    }
    if (type === 'charge.refunded') return this.onRefunded(o, eid, type);
    if (type === 'charge.dispute.created' || type === 'charge.dispute.closed') return this.onDispute(o, eid, type);
    if (type === 'refund.failed' || ((type === 'refund.updated' || type === 'charge.refund.updated') && o.status === 'failed')) {
      const rid = o.metadata && o.metadata.merch_refund, row = (rid && this.one('select * from merch_refunds where id = ?', rid)) || this.one('select * from merch_refunds where stripe_refund = ?', o.id);
      const x = (row && this.order(row.order_id)) || this.orderByPI(o.payment_intent);
      return ack(x && x.id, 'refund failed', () => { if (row) this.run("update merch_refunds set status = 'failed' where id = ?", row.id); if (x) { this.set(x.id, { refund_failed: 1 }); this.ownerMail(x.id, 'refund_failed', 'A refund failed at the bank: ' + (row ? row.id : o.id) + '. Please write to the buyer.'); } });
    }
    return ack(null, 'ignored');
  }
  sessionOrder(cs) { return (cs.id && this.one('select * from merch_orders where stripe_session = ?', cs.id)) || (cs.metadata && ORDER_ID.test(cs.metadata.merch || '') && this.order(cs.metadata.merch)) || null; }
  orderByPI(pi) { return typeof pi === 'string' && pi ? this.one('select * from merch_orders where payment_intent = ?', pi) : null; }
  // the order of a charge or dispute; when completed has not arrived yet, find its session by payment_intent (T2.2-18, T2.2-24). -> order | null | 'fail'
  async orderForPI(pi) {
    const x = this.orderByPI(pi); if (x) return x;
    if (typeof pi !== 'string' || !pi) return null;
    const s = await stripe.sessionByPI(this.env, pi); if (!s.ok || !s.data) return 'fail';
    const cs = Array.isArray(s.data.data) ? s.data.data[0] : null; return cs ? this.sessionOrder(cs) : null;
  }
  flag(key, mode, note) { this.run('insert or replace into merch_flags (key, mode, note, created_at) values (?, ?, ?, ?)', key, mode, note || null, this.now()); }
  expire(id) { if (this.set(id, { status: 'expired', next_try_at: null }, ['open'])) this.run("update merch_order_items set status = 'void' where order_id = ?", id); }
  // a paid session (re-read from Stripe) -> the order is paid (T2.1-06/08), or held for review (T2.2-14/15/52)
  async paidFrom(id, cs, eid) {
    const em = emailOf(cs), eh = em ? await this.hashOf(String(em).toLowerCase()) : null;
    this.tx(() => {
      if (eid && !this.event(eid, id, 'paid')) return;
      const o = this.order(id), now = this.now();
      if (!o) return;
      if (o.status === 'expired') { // paid after we gave up on it (a race with an expiry): keep the money safe for the owner
        this.set(id, { status: 'held', hold: 'review', why: 'late_pay', hold_at: now, payment_intent: piOf(cs), paid_at: now, total: cs.amount_total, next_try_at: now + DAY }, ['expired']);
        this.ownerMail(id, 'review', 'Paid after it expired'); return;
      }
      if (o.status !== 'open') return;
      const L = this.lines(id), why = this.paidCheck(o, L, cs), tax = (cs.total_details && cs.total_details.amount_tax) || 0;
      const items = (cs.line_items && cs.line_items.data) || [];
      L.forEach((l, i) => this.setLine(id, l.line, { line_tax: (items[i] && items[i].amount_tax) || 0, status: 'queued' }));
      const pd = cs.presentment_details || {};
      const cols = { paid_at: now, cancel_until: now + this.coolMs(), ship_by: addBusinessDays(now, 5) + 2 * DAY, payment_intent: piOf(cs), tax, total: Number.isInteger(cs.amount_total) ? cs.amount_total : o.total,
        pres_currency: pd.presentment_currency || null, pres_amount: pd.presentment_amount || null, email_hash: eh, pay_pending: 0, next_try_at: now };
      let hold = null;
      if (why) hold = why;
      else if (eh && this.flagged('e:' + eh)) hold = 'blocked';
      else if (eh && Number(this.one("select count(*) as n from merch_orders where email_hash = ? and paid_at > ? and id != ?", eh, now - DAY, id).n) >= 3) hold = 'many';
      if (hold) Object.assign(cols, { status: 'held', hold: 'review', why: hold, hold_at: now, next_try_at: now + DAY });
      else cols.status = 'paid';
      const g = this.one('select code from merch_gift_pool where order_id is null order by code limit 1');
      if (g && !hold) { this.run('update merch_gift_pool set order_id = ?, claimed_at = ? where code = ?', id, now, g.code); cols.gift_code = g.code; }
      this.set(id, cols, ['open']);
      if (hold) this.ownerMail(id, 'review', 'Held for review: ' + hold);
      if (tax > 0) { // T2.2-56: the real tax is stored; below the floor -> the nightly report only (the buyer is served)
        const inside = taxBehavior(o.country) === 'inclusive' ? tax : 0;
        const mg = marginOf(this.cat, o.country, L, o.subtotal, o.ship_fee, now, this.costs(), inside);
        if (!mg.pass) this.event('x:margin_low:' + id, id, 'margin_low', Math.round(mg.margin));
      }
      this.buyerMail(id, 'thanks', 'me_' + id + '_thanks', em);
    });
    await this.flush();
  }
  // TRANSACTIONS 3.2 -> null when every check holds, else the reason
  paidCheck(o, L, cs) {
    if (cs.payment_status !== 'paid') return 'status';
    if (cs.currency !== 'usd') return 'currency';
    if (!cs.metadata || cs.metadata.merch !== o.id || cs.client_reference_id !== o.id) return 'order_id';
    const items = cs.line_items && Array.isArray(cs.line_items.data) ? cs.line_items.data : null;
    if (!items || items.length !== L.length) return 'lines';
    for (let i = 0; i < L.length; i++) if (Number(items[i].quantity) !== L[i].qty || items[i].amount_subtotal !== L[i].unit * L[i].qty) return 'lines';
    if (cs.amount_subtotal !== o.subtotal) return 'amount';
    if (!cs.shipping_cost || cs.shipping_cost.amount_subtotal !== o.ship_fee) return 'shipping';
    const td = cs.total_details || {};
    if ((td.amount_discount || 0) !== 0) return 'discount';
    if (cs.amount_total !== o.subtotal + o.ship_fee + (taxBehavior(o.country) === 'exclusive' ? (td.amount_tax || 0) : 0)) return 'amount';
    if (countryOf(cs) !== o.country) return 'other_country';
    return null;
  }
  async onRefunded(ch, eid, type) {
    const x = await this.orderForPI(ch.payment_intent);
    if (x === 'fail') return fail('stripe_error', 502);
    if (!x) { this.tx(() => this.event(eid, null, type, 'not ours')); return json({ received: true }); }
    const rl = await stripe.listRefunds(this.env, ch.payment_intent);
    if (!rl.ok || !rl.data || !Array.isArray(rl.data.data)) return fail('stripe_error', 502);
    this.tx(() => {
      if (!this.event(eid, x.id, type)) return;
      let o = this.order(x.id), sum = 0, added = 0; const now = this.now();
      for (const re of rl.data.data) {
        if (!re || !['succeeded', 'pending', 'requires_action'].includes(re.status)) continue;
        sum += re.amount || 0;
        const mine = re.metadata && re.metadata.merch_refund && this.one('select id from merch_refunds where id = ?', re.metadata.merch_refund);
        if (mine) { this.run('update merch_refunds set stripe_refund = coalesce(stripe_refund, ?) where id = ?', re.id, mine.id); continue; }
        if (this.one('select id from merch_refunds where stripe_refund = ? or id = ?', re.id, 's:' + re.id)) continue;
        this.run("insert into merch_refunds (id, order_id, line, qty, amount, reason, stripe_refund, status, created_at) values (?, ?, null, null, ?, 'dashboard', ?, 'done', ?)", 's:' + re.id, o.id, re.amount || 0, re.id, now);
        added += re.amount || 0; // T2.2-19: unassigned, lines unchanged
      }
      const full = sum >= (Number.isInteger(ch.amount) ? ch.amount : o.total);
      if (o.status === 'open') { // T2.2-18: refunded before completed: nothing will be made
        this.set(o.id, { status: 'refunded', payment_intent: ch.payment_intent, refunded: sum, refunded_at: now, next_try_at: null }, ['open']);
        this.run("update merch_order_items set status = 'cancelled' where order_id = ?", o.id); return;
      }
      if (added) this.set(o.id, { refunded: (o.refunded || 0) + added, refunded_at: now });
      o = this.order(o.id);
      if (full && !['cancelled', 'refunded', 'expired'].includes(o.status)) {
        const before = ['paid', 'held'].includes(o.status);
        const cols = { status: 'refunded', refunded: sum, refunded_at: now };
        if (before) { // T2.2-20
          cols.hold = null; cols.next_try_at = now;
          if (o.provider_order) { cols.draft_del = 1; this.fx.push({ t: 'deldraft', order: o.id }); }
          this.run("update merch_order_items set status = 'cancelled', keep_until = ? where order_id = ? and status in ('pending', 'queued', 'ready', 'drafted')", now + 2 * DAY, o.id);
        } else this.ownerMail(o.id, 'refund_after_confirm', 'Refunded in the Dashboard after printing started: cancel it in the Printful dashboard if you can.'); // T2.2-21
        this.set(o.id, cols);
      }
    });
    await this.flush();
    return json({ received: true });
  }
  async onDispute(d, eid, type) {
    const x = await this.orderForPI(d.payment_intent);
    if (x === 'fail') return fail('stripe_error', 502);
    this.tx(() => {
      if (!this.event(eid, x && x.id, type) || !x) return;
      const o = this.order(x.id), now = this.now();
      if (type === 'charge.dispute.created') {
        if (o.status === 'open') { this.set(o.id, { status: 'held', hold: 'dispute', hold_at: now, payment_intent: d.payment_intent, disputed_at: now, dispute: 'open', dispute_id: d.id || null, next_try_at: null }, ['open']); this.ownerMail(o.id, 'dispute', 'A dispute before the payment was recorded.'); return; } // T2.2-24
        this.set(o.id, { disputed_at: now, dispute: 'open', dispute_id: d.id || null });
        if (o.email_hash) this.flag('e:' + o.email_hash, 'block', 'dispute ' + o.id);
        if (['paid', 'held'].includes(o.status)) { // T2.2-22: pause; no confirm, no refund (the bank decides the money)
          const cols = { status: 'held', hold: 'dispute', hold_at: now, next_try_at: null };
          if (o.provider_order && !o.confirmed_at) { cols.draft_del = 1; this.fx.push({ t: 'deldraft', order: o.id }); }
          this.set(o.id, cols);
        }
        this.ownerMail(o.id, 'dispute', 'A dispute: answer in Stripe with the tracking, the delivery scan and the print PNG (merch.sh show).'); // T2.2-23: the flow goes on
        return;
      }
      const won = d.status === 'won';
      this.set(o.id, { dispute: won ? 'won' : 'lost' });
      if (won) this.ownerMail(o.id, 'dispute_won', 'Dispute won. If it was held before printing, decide: ship it (merch.sh confirm) or refund it.');
      else if (o.provider_order && !o.confirmed_at) { this.set(o.id, { draft_del: 1 }); this.fx.push({ t: 'deldraft', order: o.id }); }
      this.event('x:dispute_' + (won ? 'won' : 'lost') + ':' + o.id, o.id, 'dispute_' + (won ? 'won' : 'lost'));
    });
    await this.flush();
    return json({ received: true });
  }

  /* ---------------- the provider's hints (T2.1-14..17, T2.1-27/28, T2.2-45..48) ---------------- */
  async rProvider(req) {
    const raw = await req.text(); if (raw.length > 600000) return fail('too_big', 413);
    const h = await provider.parseHook(this.env, raw, req.headers);
    if (h && h.bad) return fail('bad_signature', 401);
    const eid = 'p:' + (h && h.id ? h.id : await sha256hex(raw));
    if (this.one('select id from merch_events where id = ?', eid)) return json({ received: true });
    const ref = h && h.order, m = ref && /^(mo_[A-Za-z0-9_-]{22})(?:-r(\d+))?$/.exec(ref);
    const o = (m && this.order(m[1])) || (ref && (this.one('select * from merch_orders where provider_order = ?', ref) || this.orderOfReprint(ref)));
    if (!o) { this.tx(() => this.event(eid, null, 'unknown', ref)); return json({ received: true }); } // T2.2-47
    const g = await provider.get(this.env, ref);
    if (!g.ok || !g.data) return fail('provider_error', 502); // not marked: Printful sends it again
    this.tx(() => { if (this.event(eid, o.id, h.type)) this.applyProvider(o.id, g.data); });
    await this.flush();
    return json({ received: true });
  }
  orderOfReprint(ref) { const r = this.one('select order_id from merch_reprints where provider_order = ? or id = ?', ref, ref); return r ? this.order(r.order_id) : null; }
  // the re-read provider order decides; a line never moves back (sync)
  applyProvider(id, d) {
    let o = this.order(id); const now = this.now(), L = this.lines(id), byExt = new Map(L.map((l) => [String(l.provider_item || ''), l]));
    const lineOf = (ext) => byExt.get(ext) || L.find((l) => ext.endsWith('_' + l.line) && ext.startsWith(id));
    const up = (l, st, extra) => { if (DEAD.includes(l.status) || (LINE_RANK[l.status] || 0) >= LINE_RANK[st]) return false; this.setLine(id, l.line, Object.assign({ status: st }, extra || {})); l.status = st; return true; };
    const refunded = o.status === 'refunded';
    if (d.status === 'onhold' && ['confirmed', 'part_shipped'].includes(o.status)) { this.set(id, { status: 'held', hold: 'provider', why: 'onhold', hold_at: now }); this.ownerMail(id, 'provider_hold', 'Printful put this order on hold.'); o = this.order(id); } // T2.2-46
    else if (d.status !== 'onhold' && o.status === 'held' && o.hold === 'provider' && o.why === 'onhold') { this.set(id, { status: 'confirmed', hold: null, why: null, hold_at: null }); o = this.order(id); }
    if (!refunded && ['inprocess', 'partial', 'fulfilled'].includes(d.status)) for (const it of d.items.length ? d.items : L.map((l) => ({ external_id: l.provider_item || '' }))) { const l = lineOf(String(it.external_id)); if (l && l.status === 'confirmed') up(l, 'in_production'); } // T2.1-14
    for (const s of d.shipments || []) {
      const ls = s.items.map(lineOf).filter(Boolean); if (!ls.length) continue;
      let p = this.one('select * from merch_parcels where id = ?', s.id);
      if (!p) {
        this.run('insert into merch_parcels (id, order_id, product, carrier, tracking_url, shipped_at) values (?, ?, ?, ?, ?, ?)', s.id, id, ls[0].product, s.carrier, s.tracking_url, s.shipped_at || now);
        for (const l of ls) { if (!refunded) up(l, 'shipped', { parcel_id: s.id }); else this.setLine(id, l.line, { parcel_id: s.id }); this.setLine(id, l.line, { keep_until: (s.shipped_at || now) + 180 * DAY }); }
        this.buyerMail(id, 'ship', 'me_' + id + '_ship_' + s.id); // T2.1-15: one "On its way" per parcel
        p = this.one('select * from merch_parcels where id = ?', s.id);
      }
      if (s.delivered_at && !p.delivered_at) { this.run('update merch_parcels set delivered_at = ? where id = ?', s.delivered_at, s.id); if (!refunded) for (const l of ls) up(l, 'delivered'); } // T2.1-17
      if (s.returned && !p.returned_at) { // T2.2-45: back at Printful; the status stays, the hold says why
        this.run('update merch_parcels set returned_at = ? where id = ?', now, s.id);
        this.set(id, { hold: 'reship', hold_at: now, next_try_at: now + 7 * DAY }); this.buyerMail(id, 'address', 'me_' + id + '_address_' + s.id);
      }
    }
    if (refunded) return; // T2.2-21: parcels are stored but change no status
    o = this.order(id);
    const live = this.lines(id).filter((l) => !DEAD.includes(l.status) && l.refunded_qty < l.qty);
    const shipped = live.filter((l) => (LINE_RANK[l.status] || 0) >= LINE_RANK.shipped).length;
    if (['confirmed', 'part_shipped', 'shipped'].includes(o.status) && shipped) {
      const st = shipped === live.length ? 'shipped' : 'part_shipped';
      if (st !== o.status) this.set(id, { status: st, next_try_at: st === 'shipped' ? null : o.ship_by }, ['confirmed', 'part_shipped', 'shipped']);
    }
  }

  /* ---------------- the alarm (TRANSACTIONS 6.5) ---------------- */
  async alarm() { await this.init(); try { await this.tick(); } finally { await this.flush(); await this.arm(); } }
  async arm() {
    const a = this.one("select min(t) as t from (select min(next_try_at) as t from merch_orders where next_try_at is not null union all select min(next_try_at) as t from merch_refunds where status = 'sending' and next_try_at is not null)");
    if (a && a.t != null) await this.st.setAlarm(Math.max(Number(a.t), this.now() + 1)); else await this.st.deleteAlarm();
  }
  // works through what is due, a bounded number of steps per wake
  async tick(max) {
    for (let i = 0; i < (max || 40); i++) {
      const now = this.now();
      const rf = this.one("select id from merch_refunds where status = 'sending' and next_try_at <= ? order by next_try_at limit 1", now);
      if (rf) { await this.sendRefund(rf.id); continue; }
      const o = this.one('select id from merch_orders where next_try_at is not null and next_try_at <= ? order by next_try_at limit 1', now);
      if (!o) break;
      this.tx(() => this.next(o.id, null)); // each step writes its own next time
      await this.work(o.id); await this.flush();
    }
  }
  async work(id) {
    const o = this.order(id); if (!o) return;
    const now = this.now();
    if (o.draft_del && o.provider_order) { this.fx.push({ t: 'deldraft', order: id }); await this.flush(); }
    const queued = this.lines(id).find((l) => l.status === 'queued');
    switch (o.status) {
      case 'open': if (o.stripe_session && now >= o.expires_at + HOUR) return this.staleOpen(o); return this.tx(() => this.next(id, o.expires_at + HOUR));
      case 'paid': return this.workPaid(o);
      case 'held': return this.workHeld(o);
      case 'confirming': if (now - o.updated_at >= 2 * MIN) return this.confirmOrder(o, true); return this.tx(() => this.next(id, o.updated_at + 2 * MIN)); // T2.2-55
      case 'confirmed': case 'part_shipped': case 'shipped':
        if (o.hold === 'reship' && now >= o.hold_at + 7 * DAY) return this.tx(() => { for (const l of this.reshipLines(o)) this.lineRefund(this.order(id), l, l.qty - l.refunded_qty, 'reship'); this.set(id, { hold: null, hold_at: null }); });
        if (queued) return this.renderLine(o, queued);
        if (await this.workReprints(o)) return;
        if (o.ship_by && now >= o.ship_by && !o.late_sent_at && o.status !== 'shipped') { // T2.1-30: once per order
          const late = this.lines(id).some((l) => !DEAD.includes(l.status) && LINE_RANK[l.status] < LINE_RANK.shipped && l.refunded_qty < l.qty);
          if (late) this.tx(() => { this.set(id, { late_sent_at: now }); this.buyerMail(id, 'late', 'me_' + id + '_late'); });
          return;
        }
        if (o.ship_by && !o.late_sent_at && o.status !== 'shipped') this.tx(() => this.next(id, o.ship_by));
        if (o.hold === 'reship') this.tx(() => this.next(id, o.hold_at + 7 * DAY));
        return;
      default: return;
    }
  }
  async workPaid(o) {
    const now = this.now(), L = this.lines(o.id), queued = L.find((l) => l.status === 'queued');
    if (queued) return this.renderLine(o, queued);
    if (!o.provider_order) {
      if (!L.some((l) => l.status === 'ready')) { if (!L.some((l) => ['drafted', 'confirmed'].includes(l.status))) this.tx(() => this.fullRefund(this.order(o.id), 'nothing', 'refunded')); return; }
      return this.makeDraft(o);
    }
    if (now < o.cancel_until + GRACE) return this.tx(() => this.next(o.id, o.cancel_until + GRACE));
    if (!this.live()) { this.tx(() => this.set(o.id, { status: 'held', hold: 'draft_mode', hold_at: now, next_try_at: null }, ['paid'])); return; } // T2.1-13
    return this.confirmOrder(o);
  }
  async workHeld(o) {
    const now = this.now(), since = now - (o.hold_at || now), id = o.id;
    const refund = (why) => this.tx(() => { this.fullRefund(this.order(id), why, 'refunded'); this.ownerMail(id, 'auto_refund', 'Refunded in full: ' + why); });
    const release = () => this.tx(() => this.set(id, { status: 'paid', hold: null, why: null, hold_at: null, next_try_at: now }, ['held']));
    switch (o.hold) {
      case 'render': { // T2.2-29
        if (since >= 72 * HOUR) return refund('render_72h');
        if (since >= 2 * HOUR) this.tx(() => this.ownerMail(id, 'render_held', 'Print files have waited 2 hours or more.'));
        const q = this.lines(id).find((l) => l.status === 'queued');
        if (q) return this.renderLine(o, q);
        return release();
      }
      case 'provider': // T2.2-34 (why 'down'); 'onhold' waits for Printful's hint (T2.2-46)
        if (o.why === 'onhold') return;
        if (since >= DAY) this.tx(() => this.ownerMail(id, 'provider_down', 'Printful has not answered for 24 hours.'));
        return o.provider_order ? this.confirmOrder(o) : this.makeDraft(o);
      case 'address': if (since >= 7 * DAY) return refund('address_7d'); return this.tx(() => this.next(id, o.hold_at + 7 * DAY)); // T2.2-36
      case 'wallet': if (since >= 5 * DAY) return refund('wallet_5d'); return this.confirmOrder(o); // T2.2-38
      case 'review':
        if (o.why === 'cost') { // T2.2-39: 48 h without the owner: confirm if the margin is still >= $0, else refund
          if (since < 48 * HOUR) return this.tx(() => this.next(id, o.hold_at + 48 * HOUR));
          const L = this.lines(id).filter((l) => !DEAD.includes(l.status)), P = o.total - o.refunded - (taxBehavior(o.country) === 'exclusive' ? o.tax : 0);
          const m = P - o.provider_cost - (0.039 * P + 30) - 0.05 * o.provider_cost;
          if (m >= 0 && L.length) return release();
          return refund('cost');
        }
        if (since < DAY) return this.tx(() => this.next(id, o.hold_at + DAY));
        if (o.why === 'many') return release(); // T2.2-52: the 4th order goes on (gifts are normal)
        return refund('review_' + o.why); // T2.2-14/15/52 blocked
      default: return; // dispute, draft_mode: the owner decides
    }
  }
  // one line through the renderer (T2.1-10, T2.2-28..31, T2.2-49): at least 11 s between renders
  async renderLine(o, l) {
    const now = this.now(), last = Number(this.meta('render_at') || 0);
    if (now < last + 11e3) return this.tx(() => this.next(o.id, last + 11e3));
    this.tx(() => this.setMeta('render_at', now));
    const url = (this.env.MERCH_PUBLIC_URL || 'https://merch-api.doodledoggo.app') + '/merch/print/' + l.art_ver + '/' + l.print_link; // the line's own art_ver folder
    const good = (r) => r.ok && this.pngOk(l.product, r.png);
    let r = await render.screenshot(this.env, l.product, url), renderer = 'browser';
    if (r.ok && !good(r)) r = { ok: false, kind: 'error', why: 'png' };
    if (!r.ok && r.kind === 'rate') return this.tx(() => this.next(o.id, now + 11e3)); // T2.2-30
    if (!r.ok && (r.kind === 'daily' || (r.kind === 'error' && l.tries >= 1))) { const f = await render.resvg(this.env, l.product, url); if (good(f)) { r = f; renderer = 'resvg'; } }
    if (good(r)) {
      const s = await this.storePng(o, l, r.png);
      if (!s.ok) return this.tx(() => this.next(o.id, this.now())); // T2.2-31: the next shard, at once
      return this.tx(() => {
        this.setLine(o.id, l.line, { status: 'ready', file_key: s.key, file_sha: s.sha, file_bytes: r.png.length, rendered_at: this.now(), renderer, last_error: null });
        const x = this.order(o.id);
        if (x.status === 'held' && x.hold === 'render' && !this.lines(o.id).some((y) => y.status === 'queued')) this.set(o.id, { status: 'paid', hold: null, hold_at: null }, ['held']);
        this.next(o.id, this.now());
      });
    }
    if (r.kind === 'daily' || r.kind === 'not_set_up') { // T2.2-29: wait for 09:00 JST; past the hour, held render
      return this.tx(() => {
        const x = this.order(o.id), reset = r.kind === 'daily' ? nextUtcMidnight(now) : now + HOUR;
        const cols = { next_try_at: x.status === 'paid' && now < x.cancel_until ? Math.min(reset, x.cancel_until) : reset }; // look again when the hour ends, to hold it
        if (x.status === 'paid' && now >= x.cancel_until) Object.assign(cols, { status: 'held', hold: 'render', hold_at: now });
        const held = cols.hold === 'render' || (x.status === 'held' && x.hold === 'render'), since = cols.hold_at || x.hold_at || now;
        if (held) cols.next_try_at = Math.min(reset, now + 2 * HOUR, since + 72 * HOUR); // held: the 2-hour owner email and the 72-hour refund need a wake
        this.set(o.id, cols); this.setLine(o.id, l.line, { last_error: r.kind });
      });
    }
    if (l.tries < 1) return this.tx(() => { this.setLine(o.id, l.line, { tries: 1, last_error: r.why || 'render' }); this.next(o.id, now + MIN); }); // T2.2-28: once more after 1 min
    return this.tx(() => { // still failing after the fallback: that line is refunded, the others go on
      this.setLine(o.id, l.line, { status: 'rejected', last_error: 'render', tries: l.tries + 1 });
      const x = this.order(o.id), res = this.lineRefund(x, this.lines(o.id).find((y) => y.line === l.line), l.qty - l.refunded_qty, 'render');
      this.ownerMail(o.id, 'render_reject', 'Line ' + l.line + ' could not be rendered and was refunded.');
      if (!res.last) this.buyerMail(o.id, 'reject', 'me_' + o.id + '_reject_' + l.line);
      this.next(o.id, this.now());
    });
  }
  pngOk(product, png) { const P = this.PP.PRODUCTS[product], d = pngSize(png); return !!(P && d && d.w === P.w && d.h === P.h && png.length <= PNG_MAX); }
  shardFor(day, bytes) {
    for (const suf of ['', '-b', '-c', '-d', '-e', '-f']) {
      const name = 'p-' + day + suf, r = this.one('select bytes from merch_shards where name = ?', name);
      if (!r || r.bytes + bytes <= 900 * (1 << 20)) return name;
    }
    return 'p-' + day + '-z';
  }
  async storePng(o, l, png) {
    const sha = await sha256hex(png), day = jstDay(o.paid_at || this.now());
    for (let i = 0; i < 2; i++) {
      const shard = this.shardFor(day, png.length), key = shard + '~' + o.id + '~' + l.line;
      const res = await this.env.PRINTS.get(this.env.PRINTS.idFromName(shard)).fetch('https://prints/put?key=' + encodeURIComponent(key) + '&sha=' + sha, { method: 'PUT', body: png });
      if (res.ok) { const j = await res.json(); this.tx(() => this.run('insert or replace into merch_shards (name, bytes, files) values (?, ?, ?)', shard, j.shard_bytes, j.files)); return { ok: true, key, sha }; }
      this.tx(() => this.run('insert or replace into merch_shards (name, bytes, files) values (?, ?, coalesce((select files from merch_shards where name = ?), 0))', shard, 900 * (1 << 20), shard)); // full: the next one
    }
    return { ok: false };
  }
  async fileUrl(key, ttlMs) {
    const exp = Math.floor((this.now() + (ttlMs || 30 * DAY)) / 1000), sig = await hmacHex(this.env.MERCH_FILE_KEY || '', key + '/' + exp);
    return (this.env.MERCH_PUBLIC_URL || 'https://merch-api.doodledoggo.app') + '/merch/file/' + key + '/' + exp + '/' + sig + '.png';
  }
  backoff(o) {
    const now = this.now(), tries = (o.tries || 0) + 1, wait = tries <= BACKOFF.length ? BACKOFF[tries - 1] : HOUR;
    const cols = { tries, next_try_at: now + wait, last_error: 'down' };
    if (o.status === 'paid' && now >= o.cancel_until + GRACE) Object.assign(cols, { status: 'held', hold: 'provider', why: 'down', hold_at: now });
    if (o.status === 'confirming') Object.assign(cols, { status: 'held', hold: 'provider', why: 'down', hold_at: o.hold_at || now });
    this.tx(() => this.set(o.id, cols));
  }
  // the Printful draft, inside the hour (T2.1-11, T2.2-32..36). rec: an address the buyer fixed (passed straight on, never stored)
  async makeDraft(o, rec) {
    let recipient = rec;
    if (!recipient) { const g = await stripe.getSession(this.env, o.stripe_session); if (!g.ok || !g.data) { this.backoff(o); return { ok: false, kind: 'down' }; } recipient = recipientOf(g.data); }
    if ((o.tries || 0) > 0 || o.last_error === 'timeout') { // T2.2-35: never two Printful orders
      const g = await provider.get(this.env, o.id);
      if (g.ok && g.data) { this.adopt(o.id, g.data); return { ok: true }; }
    }
    for (let round = 0; round < 7; round++) {
      const L = this.lines(o.id).filter((l) => l.status === 'ready');
      if (!L.length) { this.tx(() => this.fullRefund(this.order(o.id), 'provider', 'refunded')); return { ok: false, kind: 'refused' }; }
      const urls = {}; for (const l of L) urls[l.line] = await this.fileUrl(l.file_key);
      const r = await provider.createDraft(this.env, this.order(o.id), L, recipient, urls);
      if (r.ok && r.data) { this.adopt(o.id, r.data); return { ok: true }; }
      if (r.kind === 'refused' && r.items && r.items.length) {
        const bad = L.filter((l) => r.items.includes(o.id + '_' + l.line));
        if (!bad.length || bad.length === L.length) { // T2.2-33: every line refused: all of it back, shipping included
          this.tx(() => { for (const l of L) { this.setLine(o.id, l.line, { status: 'rejected', last_error: 'provider' }); this.run('update merch_variants set on_flag = 0 where id = ?', l.variant); } this.fullRefund(this.order(o.id), 'provider', 'refunded'); this.ownerMail(o.id, 'provider_reject', 'Printful refused every line.'); });
          return { ok: false, kind: 'refused' };
        }
        this.tx(() => { // T2.2-32: that line is refunded and its variant turned off; the draft is made with the rest
          for (const l of bad) {
            this.setLine(o.id, l.line, { status: 'rejected', last_error: 'provider' });
            this.run('insert into merch_variants (id, product, colour, size, provider_variant, on_flag) values (?, ?, ?, ?, ?, 0) on conflict(id) do update set on_flag = 0', l.variant, l.product, l.colour, l.size, l.provider_variant);
            this.lineRefund(this.order(o.id), this.lines(o.id).find((y) => y.line === l.line), l.qty - l.refunded_qty, 'provider');
            this.buyerMail(o.id, 'reject', 'me_' + o.id + '_reject_' + l.line);
          }
          this.ownerMail(o.id, 'provider_reject', 'Printful refused ' + bad.map((l) => l.variant).join(', '));
        });
        continue;
      }
      if (r.kind === 'address') { // T2.2-36
        this.tx(() => { this.set(o.id, { status: 'held', hold: 'address', hold_at: this.now(), next_try_at: this.now() + 7 * DAY }, ['paid', 'held']); this.buyerMail(o.id, 'address', 'me_' + o.id + '_address'); });
        return r;
      }
      if (r.kind === 'timeout') { this.tx(() => this.set(o.id, { tries: (o.tries || 0) + 1, last_error: 'timeout', next_try_at: this.now() + MIN })); return r; }
      if (r.kind === 'refused') { this.tx(() => { this.set(o.id, { status: 'held', hold: 'review', why: 'provider', hold_at: this.now(), next_try_at: this.now() + DAY }); this.ownerMail(o.id, 'review', 'Printful refused the draft without naming a line.'); }); return r; }
      this.backoff(o); return r; // down, not set up (T2.2-34)
    }
    return { ok: false, kind: 'refused' };
  }
  adopt(id, d) {
    this.tx(() => {
      const o = this.order(id), now = this.now(), L = this.lines(id).filter((l) => l.status === 'ready');
      for (const l of L) this.setLine(id, l.line, { status: 'drafted', provider_item: id + '_' + l.line });
      const cost = (d.costs.items || 0) + (d.costs.shipping || 0);
      const est = marginOf(this.cat, o.country, this.lines(id).filter((l) => l.status === 'drafted'), o.subtotal, o.ship_fee, now, this.costs()).W;
      const cols = { provider: 'printful', provider_order: d.id, provider_cost: cost, tries: 0, last_error: null };
      if (cost > est * 1.1) { Object.assign(cols, { status: 'held', hold: 'review', why: 'cost', hold_at: now, next_try_at: now + 48 * HOUR }); this.ownerMail(id, 'cost', 'Printful’s draft costs ' + cost + ' against our ' + est + ': confirm (merch.sh confirm) or refund.'); }
      else if (o.status === 'held' && ['provider', 'address'].includes(o.hold)) Object.assign(cols, { status: 'paid', hold: null, why: null, hold_at: null, next_try_at: now });
      else cols.next_try_at = Math.max(now, (o.cancel_until || now) + GRACE);
      this.set(id, cols);
    });
  }
  // the wholesale charge, only after the hour + grace (T2.1-12, T2.2-38, T2.2-40, T2.2-55)
  async confirmOrder(o, stale) {
    const now = this.now();
    if (!this.live()) return this.tx(() => this.set(o.id, { status: 'held', hold: 'draft_mode', hold_at: now, next_try_at: null }, ['paid', 'held']));
    const claimed = this.tx(() => {
      const x = this.order(o.id);
      if (x.cancel_until == null || now < x.cancel_until + GRACE || !x.provider_order) return false;
      const from = stale ? ['confirming'] : x.status === 'held' && ['wallet', 'provider'].includes(x.hold) ? ['held'] : ['paid'];
      return this.set(o.id, { status: 'confirming', next_try_at: now + 2 * MIN }, from); // written before the call
    });
    if (!claimed) return;
    if (stale) { const g = await provider.get(this.env, o.provider_order); if (g.ok && g.data && g.data.status && g.data.status !== 'draft') return this.confirmed(o.id); }
    const r = await provider.confirm(this.env, o.provider_order);
    if (r.ok) return this.confirmed(o.id);
    if (r.kind === 'timeout') return; // stays 'confirming': the alarm re-reads it after 2 minutes
    if (r.kind === 'billing') return this.tx(() => { this.set(o.id, { status: 'held', hold: 'wallet', hold_at: this.order(o.id).hold_at || now, next_try_at: now + 30 * MIN }, ['confirming']); this.ownerMail(o.id, 'wallet', 'Printful could not charge the wallet. Please top it up.'); });
    if (r.kind === 'down' || r.kind === 'not_set_up') return this.backoff(this.order(o.id));
    return this.tx(() => { this.set(o.id, { status: 'held', hold: 'review', why: 'confirm_' + r.kind, hold_at: now, next_try_at: now + DAY }, ['confirming']); this.ownerMail(o.id, 'review', 'Printful refused the confirm.'); });
  }
  confirmed(id) {
    this.tx(() => {
      if (!this.set(id, { status: 'confirmed', hold: null, why: null, hold_at: null, confirmed_at: this.now(), tries: 0, next_try_at: this.order(id).ship_by }, ['confirming'])) return;
      this.run("update merch_order_items set status = 'confirmed' where order_id = ? and status = 'drafted'", id);
    });
  }
  async staleOpen(o) { // T2.2-27: no expired event came
    const g = await stripe.getSession(this.env, o.stripe_session);
    if (!g.ok || !g.data) return this.tx(() => this.next(o.id, this.now() + 10 * MIN));
    if (g.data.status === 'expired') return this.tx(() => this.expire(o.id));
    if (g.data.status === 'complete' && g.data.payment_status === 'paid') return this.paidFrom(o.id, g.data, 'x:missed:' + o.id);
    return this.tx(() => this.next(o.id, this.now() + HOUR));
  }

  /* ---------------- reprints (T2.1-23, T2.2-44, T2.2-45) ---------------- */
  reshipLines(o) { const ps = this.q('select id from merch_parcels where order_id = ? and returned_at is not null', o.id).map((p) => p.id); return this.lines(o.id).filter((l) => ps.includes(l.parcel_id) && l.status !== 'replaced' && l.refunded_qty < l.qty); }
  // new line rows (101, 102 ...) from the stored PNGs (or a re-render with the same art_ver); a Printful order <order>-r<n>, confirmed at once
  async reprint(o, lineNums, providerOrder, rec, why) {
    const res = this.tx(() => {
      const x = this.order(o.id);
      if (!['part_shipped', 'shipped', 'confirmed'].includes(x.status) && x.hold !== 'reship') return { error: 'not_allowed', status: 409 };
      const all = this.lines(x.id), pick = all.filter((l) => lineNums.includes(l.line) && l.status !== 'replaced' && !['void', 'cancelled'].includes(l.status));
      if (!pick.length || pick.length !== lineNums.length) return { error: 'bad_lines', status: 400 };
      const n = Number(this.one('select count(*) as n from merch_reprints where order_id = ?', x.id).n) + 1, rid = x.id + '-r' + n;
      let next = 100 + all.filter((l) => l.line > 100).length;
      for (const l of pick) {
        next++;
        this.run(`insert into merch_order_items (order_id, line, product, colour, size, pose, name_on, qty, name, recipe, print_link, art_ver, unit, line_total, line_tax, cost_est, provider_variant, status,
          file_key, file_sha, file_bytes, rendered_at, renderer, reprint_of, rp, refunded_qty, refunded) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
          x.id, next, l.product, l.colour, l.size, l.pose, l.name_on, l.qty - l.refunded_qty, l.name, l.recipe, l.print_link, l.art_ver, l.unit, 0, l.cost_est, l.provider_variant,
          providerOrder ? 'confirmed' : l.file_key ? 'ready' : 'queued', l.file_key, l.file_sha, l.file_bytes, l.rendered_at, l.renderer, l.line, n);
        this.setLine(x.id, l.line, { status: 'replaced' });
      }
      this.run('insert into merch_reprints (id, order_id, n, provider_order, status, created_at) values (?, ?, ?, ?, ?, ?)', rid, x.id, n, providerOrder || null, providerOrder ? 'attached' : 'queued', this.now());
      const cols = { next_try_at: this.now() };
      if (x.status === 'shipped' || x.status === 'confirmed') cols.status = 'part_shipped';
      if (why === 'reship') { cols.hold = null; cols.hold_at = null; }
      this.set(x.id, cols);
      this.event('x:reprint:' + rid, x.id, 'reprint', why || 'owner');
      return { rid, n };
    });
    if (res.error) return res;
    if (!providerOrder) await this.workReprints(this.order(o.id), rec);
    await this.flush();
    return { ok: true, reprint: res.rid };
  }
  async workReprints(o, rec) {
    const rp = this.one("select * from merch_reprints where order_id = ? and status = 'queued' order by n limit 1", o.id); if (!rp) return false;
    const L = this.lines(o.id).filter((l) => l.rp === rp.n);
    const q = L.find((l) => l.status === 'queued'); if (q) { await this.renderLine(o, q); return true; }
    let recipient = rec; if (!recipient) { const g = await stripe.getSession(this.env, o.stripe_session); if (!g.ok) { this.tx(() => this.next(o.id, this.now() + 15 * MIN)); return true; } recipient = recipientOf(g.data); }
    const ex = await provider.get(this.env, rp.id); // GET before create
    let d = ex.ok && ex.data ? ex.data : null;
    if (!d) { const urls = {}; for (const l of L) urls[l.line] = await this.fileUrl(l.file_key); const r = await provider.createDraft(this.env, o, L, recipient, urls, rp.id); if (!r.ok) { this.tx(() => this.next(o.id, this.now() + 15 * MIN)); return true; } d = r.data; }
    const c = d.status === 'draft' ? await provider.confirm(this.env, d.id) : { ok: true }; // confirmed at once: no cooling hour, no charge to the buyer
    this.tx(() => {
      this.run("update merch_reprints set provider_order = ?, status = ? where id = ?", d.id, c.ok ? 'confirmed' : 'queued', rp.id);
      if (c.ok) { for (const l of L) this.setLine(o.id, l.line, { status: 'confirmed', provider_item: rp.id + '_' + l.line }); this.buyerMail(o.id, 'reprint', 'me_' + o.id + '_reprint_' + rp.n); }
      this.next(o.id, c.ok ? this.now() : this.now() + 15 * MIN);
    });
    return true;
  }

  /* ---------------- the cron: backstop and the nightly job (6.5, 3.3, 5) ---------------- */
  async cron() {
    const now = this.now(), day = jstDay(now); let nightly = false;
    if (jstHour(now) >= 4 && this.meta('nightly') !== day) { this.tx(() => this.setMeta('nightly', day)); await this.nightly(now); nightly = true; }
    await this.tick();
    return { ok: true, nightly };
  }
  async nightly(now) {
    const c = await provider.catalogCosts(this.env);
    if (c.ok && c.data) this.tx(() => {
      for (const [id, cents] of Object.entries(c.data.variants || {})) { const [p, col, size] = id.split(':'); this.run('insert into merch_variants (id, product, colour, size, cost_base, on_flag, cost_at) values (?, ?, ?, ?, ?, 1, ?) on conflict(id) do update set cost_base = excluded.cost_base, cost_at = excluded.cost_at', id, p, col, size || null, Number(cents), now); }
      for (const [id, fe] of Object.entries(c.data.ship || {})) this.run('insert or replace into merch_ship_costs (id, first, extra, cost_at) values (?, ?, ?, ?)', id, fe[0], fe[1], now);
    });
    // T2.1-32: a variant that fails the floor alone in any open zone is turned off (and back on when it passes again)
    const regions = new Map(); for (const ct of openCountries(this.env)) { const r = regionOf(ct); if (!regions.has(r)) regions.set(r, ct); }
    const costs = this.costs(), off = [], bad = [];
    this.tx(() => {
      for (const P of Object.values(this.cat.products).filter((x) => x.launch)) for (const col of P.colours) for (const size of P.sized ? col.sizes : [null]) {
        const v = variantId(P.id, col.id, size), unit = P.price + ((P.size_price && P.size_price[size]) || 0), uc = P.cost + ((P.size_cost && P.size_cost[size]) || 0);
        const fails = Array.from(regions.values()).some((ct) => { const pr = priceBasket(zoneOf(ct), [{ line_total: unit, qty: 1 }]); return !marginOf(this.cat, ct, [{ qty: 1, group: P.group, variant: v, unit_cost: uc }], pr.subtotal, pr.ship_fee, now, costs).pass; });
        this.run('insert into merch_variants (id, product, colour, size, provider_variant, on_flag) values (?, ?, ?, ?, ?, ?) on conflict(id) do update set on_flag = excluded.on_flag', v, P.id, col.id, size, 'pf:' + v, fails ? 0 : 1);
        if (fails) off.push(v);
      }
      // the reference baskets: 1-4 items, each open zone (a zone's fee or threshold changes only by a reviewed PR)
      const M = this.cat.products.mug, T = this.cat.products.tee;
      const kinds = [[M], [T], [M, T], [T, T], [M, M], [M, T, T], [T, T, T], [M, M, T], [M, M, T, T], [T, T, T, T]];
      for (const ct of regions.values()) for (const k of kinds) {
        const ls = k.map((P) => ({ qty: 1, line_total: P.price, group: P.group, variant: variantId(P.id, P.colours[0].id, P.sized ? 'M' : null), unit_cost: P.cost }));
        const pr = priceBasket(zoneOf(ct), ls); if (!marginOf(this.cat, ct, ls, pr.subtotal, pr.ship_fee, now, costs).pass) bad.push(ct + ' ' + k.map((P) => P.id).join('+'));
      }
      if (off.length) this.ownerMail(null, 'variant_off', 'Turned off (fails the floor alone): ' + off.join(', '));
      if (bad.length) this.ownerMail(null, 'basket_floor', 'Reference baskets under the floor: ' + bad.join('; '));
    });
    await this.tidy(now);
    const rep = this.report();
    this.tx(() => { this.setMeta('report', JSON.stringify(rep)); this.ownerMail(null, 'report', JSON.stringify(rep).slice(0, 4000)); });
    await this.flush();
    return rep;
  }
  // TRANSACTIONS 5 retention (T2.1-33)
  async tidy(now) {
    const files = this.q('select order_id, line, file_key from merch_order_items where file_key is not null and keep_until is not null and keep_until <= ?', now);
    // storage over 4 GB: also the oldest files of orders shipped more than 60 days ago with no open dispute (6.6)
    const total = Number(this.one('select coalesce(sum(bytes), 0) as b from merch_shards').b);
    if (total > Number(this.env.MERCH_STORE_SOFT || 4 * 2 ** 30)) {
      files.push(...this.q("select i.order_id, i.line, i.file_key from merch_order_items i join merch_orders o on o.id = i.order_id join merch_parcels p on p.id = i.parcel_id where i.file_key is not null and p.shipped_at < ? and coalesce(o.dispute, '') != 'open' order by p.shipped_at limit 200", now - 60 * DAY));
      this.tx(() => this.ownerMail(null, 'storage', 'Print storage is over 4 GB' + (total > 4.5 * 2 ** 30 ? ': time for Workers Paid' : '')));
    }
    const seen = new Set();
    for (const f of files) {
      if (seen.has(f.file_key)) continue; seen.add(f.file_key);
      const shard = f.file_key.split('~')[0];
      const r = await this.env.PRINTS.get(this.env.PRINTS.idFromName(shard)).fetch('https://prints/del?key=' + encodeURIComponent(f.file_key), { method: 'POST' });
      if (r.ok) { const j = await r.json(); this.tx(() => { this.run('update merch_order_items set file_key = null where file_key = ?', f.file_key); if (!j.files) this.run('delete from merch_shards where name = ?', shard); else this.run('update merch_shards set files = ? where name = ?', j.files, shard); }); }
    }
    this.tx(() => {
      const old = now - 730 * DAY; // buyer data and the dog: 24 months after close
      const closed = this.q("select id from merch_orders where status in ('shipped', 'cancelled', 'refunded', 'expired') and max(coalesce(refunded_at, 0), coalesce(updated_at, 0), coalesce((select max(shipped_at) from merch_parcels p where p.order_id = merch_orders.id), 0)) < ? and (email_hash is not null or exists (select 1 from merch_order_items i where i.order_id = merch_orders.id and i.recipe is not null))", old);
      for (const c of closed) { this.run('update merch_orders set email_hash = null where id = ?', c.id); this.run('update merch_order_items set name = null, recipe = null, print_link = null where order_id = ?', c.id); }
      this.run('delete from merch_events where at < ?', now - 90 * DAY);
      for (const e of this.q("select id from merch_orders where status = 'expired' and created_at < ?", now - 30 * DAY)) { this.run('delete from merch_order_items where order_id = ?', e.id); this.run('delete from merch_orders where id = ?', e.id); }
      this.run('delete from merch_rate where reset_at <= ?', now);
    });
  }
  report() {
    const now = this.now(), day = jstDay(now);
    return { at: now, day,
      held: this.q("select id, hold, why, hold_at from merch_orders where status = 'held'"),
      draft_mode: this.q("select id from merch_orders where status = 'held' and hold = 'draft_mode'").map((r) => r.id),
      unassigned_refunds: this.q("select id, order_id, amount from merch_refunds where line is null and id like 's:%'"),
      disputes: this.q('select id, dispute, disputed_at from merch_orders where dispute is not null'),
      refund_failed: this.q('select id from merch_orders where refund_failed = 1').map((r) => r.id),
      margin_low: this.q("select order_id, note from merch_events where type = 'margin_low'"),
      orders_today: this.q("select country, count(*) as n, sum(total) as total from merch_orders where day = ? and status != 'expired' group by country", day),
      sales_12m: this.q("select country, count(*) as n, sum(total - refunded) as net from merch_orders where paid_at > ? group by country order by net desc limit 20", now - 365 * DAY),
      variants_off: this.q('select id from merch_variants where on_flag = 0').map((r) => r.id),
      storage: { bytes: Number(this.one('select coalesce(sum(bytes), 0) as b from merch_shards').b), shards: Number(this.one('select count(*) as n from merch_shards').n) } };
  }
}
