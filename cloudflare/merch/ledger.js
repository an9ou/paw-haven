// MerchLedger: one SQLite Durable Object ('ledger') with every merch table, the alarm and all order logic (TRANSACTIONS.md 2, 2.1, 2.2, 3, 4, 5, 6).
// Only the front Worker (worker.js) reaches it; it passes the buyer's IP in x-merch-ip and the page's Origin in x-merch-origin.
// Races: a Durable Object runs one event at a time between awaits, but another request (a cancel, a webhook, the cron) may run while this one waits
// on Stripe, the printer, the renderer or the mail service. The rules every step here follows (PART3.md, "the ledger's rules"):
//   1. claim first: a step that calls the printer or the renderer takes the order's lease (lease_until) and leaves a wake (next_try_at) BEFORE
//      the call, so a crash, an eviction or an exception can never strand a paid order: the wake comes back to it;
//   2. after EVERY await on an outside call the order and the line are read again, and the step acts only if they are still what it claimed
//      (a cancel, a Dashboard refund or a dispute may have come in meanwhile: then the step undoes what it made, e.g. deletes the new draft);
//   3. nothing is confirmed, reprinted or reshipped for an order that is cancelled, refunded or in dispute, or for a line that is fully refunded;
//   4. nothing is confirmed at the printer unless MERCH_PROVIDER_MODE is live;
//   5. money and mail are rows written in the same transaction as the change (merch_refunds, merch_outbox), sent after commit, retried by the alarm.
import { nowOf, jstDay, jstHour, nextUtcMidnight, addBusinessDays, json, fail, sha256hex, hmacHex, hex, orderId, ORDER_ID, pngSize, MIN, HOUR, DAY, GRACE } from './util.js';
import { buildCatalog, ZONES, zoneOf, regionOf, variantId, ALL_COUNTRIES, PRODUCTS as CATP } from './catalog.js';
import { checkBasket, priceBasket, marginOf, quoteOut, zoneNotes, openCountries, fromOpen, productsOn, taxBehavior, withArtVer } from './lines.js';
import * as stripe from './stripe.js';
import * as provider from './provider_printful.js';
import * as render from './render.js';
import * as mail from './mail.js';
import { adminRoute } from './admin.js';

const TEST_ORIGIN = 'https://test.doodledoggo.app';
const PNG_MAX = 7.5 * (1 << 20);
const LINE_RANK = { pending: 0, queued: 1, ready: 2, drafted: 3, confirmed: 4, in_production: 5, shipped: 6, delivered: 7 };
const DEAD = ['void', 'rejected', 'cancelled', 'replaced'];
const ENDED = ['cancelled', 'refunded', 'expired'];
const LATE_ST = ['paid', 'held', 'confirming', 'confirmed', 'part_shipped'];
const PF_CONFIRMED = ['pending', 'inprocess', 'onhold', 'partial', 'fulfilled']; // a Printful order past its draft (N4: failed / canceled are not)
const BACKOFF = [1, 5, 15, 60].map((m) => m * MIN);
const MAIL_BACKOFF = [1, 5, 15, 60, 180].map((m) => m * MIN), MAIL_TRIES = 6;
const LEASE = 3 * MIN, WAKE = 5 * MIN; // a step's lease, and the wake it leaves behind in case it never finishes

export const SCHEMA = `
create table if not exists merch_orders (id text primary key, nonce text unique, day text, created_at integer, updated_at integer, status text, hold text,
  country text, zone text, lang text, cat_ver text, subtotal integer, ship_fee integer, ship_extra integer, tax integer, total integer,
  pres_currency text, pres_amount integer, cost_est integer, margin_est integer, stripe_session text unique, checkout_url text, expires_at integer,
  pay_pending integer default 0, payment_intent text, paid_at integer, cancel_until integer, ship_by integer, provider text, provider_order text,
  provider_cost integer, confirmed_at integer, refunded integer default 0, refunded_at integer, refund_failed integer default 0, disputed_at integer,
  dispute text, dispute_id text, late_sent_at integer, gift_code text, email_hash text, tries integer default 0, next_try_at integer, last_error text,
  hold_at integer, why text, draft_del integer default 0, lease_until integer, pcancel integer default 0, draft_n integer default 0);
create index if not exists merch_orders_pi on merch_orders (payment_intent);
create index if not exists merch_orders_due on merch_orders (status, next_try_at);
create index if not exists merch_orders_day on merch_orders (day, status);
create index if not exists merch_orders_paid on merch_orders (paid_at);
create index if not exists merch_orders_email on merch_orders (email_hash);
create table if not exists merch_order_items (order_id text, line integer, product text, colour text, size text, pose text, name_on integer, qty integer,
  name text, recipe text, print_link text, art_ver text, unit integer, line_total integer, line_tax integer, cost_est integer, provider_variant text,
  status text, file_key text, file_sha text, file_bytes integer, rendered_at integer, renderer text, provider_item text, parcel_id text,
  refunded_qty integer default 0, refunded integer default 0, reprint_of integer, tries integer default 0, last_error text, rp integer, keep_until integer,
  store_tries integer default 0, primary key (order_id, line));
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
create table if not exists merch_reprints (id text primary key, order_id text, n integer, provider_order text, status text, created_at integer, why text);
create table if not exists merch_outbox (id text primary key, order_id text, who text, kind text, note text, status text, tries integer default 0,
  next_try_at integer, created_at integer, sent_at integer, last_error text);
create index if not exists merch_outbox_due on merch_outbox (status, next_try_at);
create table if not exists merch_trash (key text primary key, at integer);
`;
// columns added after the first build: added to an older table in place (additive, never dropped)
const MIGRATE = [['merch_orders', 'lease_until', 'integer'], ['merch_orders', 'pcancel', 'integer default 0'], ['merch_orders', 'draft_n', 'integer default 0'],
  ['merch_order_items', 'store_tries', 'integer default 0'], ['merch_reprints', 'why', 'text']];

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
const rethrow = (e) => { if (e && e.evicted) throw e; }; // the test harness's "this object was evicted": never swallowed

export class MerchLedger {
  constructor(state, env) {
    this.state = state; this.st = state.storage; this.sql = state.storage.sql; this.env = env; this.fx = []; this.inited = false;
    this.mem = new Map();  // never stored: a buyer's email for the first try of a mail, an address typed for a reship (until it is sent on)
    this.pngs = new Map(); // a rendered PNG whose store failed: kept for the retry, so a store retry does not re-render (S11)
    this.writes = 0;
  }
  now() { return nowOf(this.env); }
  q(s, ...a) { const c = this.sql.exec(s, ...a), r = c.toArray(); this.writes += Number(c.rowsWritten || 0); return r; }
  one(s, ...a) { return this.q(s, ...a)[0] || null; }
  run(s, ...a) { this.q(s, ...a); }
  tx(fn) { return this.st.transactionSync(fn); }
  async init() {
    if (this.inited) return;
    this.sql.exec(SCHEMA);
    for (const [t, c, ty] of MIGRATE) if (!this.q('pragma table_info(' + t + ')').some((r) => r.name === c)) this.sql.exec('alter table ' + t + ' add column ' + c + ' ' + ty);
    this.PP = await loadPawPrint(this.env); this.cat = buildCatalog(this.PP); this.inited = true;
  }
  meta(k) { const r = this.one('select v from merch_meta where k = ?', k); return r ? r.v : null; }
  setMeta(k, v) { this.run('insert or replace into merch_meta (k, v) values (?, ?)', k, String(v)); }
  // the day's row writes, one meta write per request or alarm (the report compares them with the Free plan's 100k a day: S11)
  saveWrites() { const n = this.writes; if (!n) return; this.writes = 0; this.sql.exec('insert into merch_meta (k, v) values (?, ?) on conflict(k) do update set v = cast(cast(v as integer) + ? as text)', 'w:' + jstDay(this.now()), String(n), n); }
  order(id) { return typeof id === 'string' ? this.one('select * from merch_orders where id = ?', id) : null; }
  lines(id) { return this.q('select * from merch_order_items where order_id = ? order by line', id).map((l) => Object.assign(l, { group: (CATP[l.product] || {}).group, variant: variantId(l.product, l.colour, l.size) })); }
  lineRow(id, line) { return this.lines(id).find((l) => l.line === line) || null; }
  // set columns of an order; from: the statuses it may move from (the guard); -> true when it changed
  set(id, cols, from) {
    const k = Object.keys(cols); cols.updated_at = this.now(); if (!k.includes('updated_at')) k.push('updated_at');
    const where = from ? ' and status in (' + from.map(() => '?').join(',') + ')' : '';
    const ch = this.q('update merch_orders set ' + k.map((c) => c + ' = ?').join(', ') + ' where id = ?' + where + ' returning id', ...k.map((c) => cols[c]), id, ...(from || [])).length > 0;
    if (ch && ('next_try_at' in cols || 'status' in cols || 'hold' in cols)) this.lateWake(id);
    return ch;
  }
  setLine(id, line, cols) { const k = Object.keys(cols); this.run('update merch_order_items set ' + k.map((c) => c + ' = ?').join(', ') + ' where order_id = ? and line = ?', ...k.map((c) => cols[c]), id, line); }
  next(id, t) { this.run('update merch_orders set next_try_at = ? where id = ?', t, id); this.lateWake(id); }
  // S10: an order that may still be late keeps a wake at ship_by, whatever it waits for (held orders too), so the delay email always runs
  lateWake(id) {
    this.run(`update merch_orders set next_try_at = min(coalesce(next_try_at, ship_by), ship_by) where id = ? and ship_by is not null and late_sent_at is null
      and status in ('paid', 'held', 'confirming', 'confirmed', 'part_shipped') and coalesce(hold, '') != 'dispute'`, id);
  }
  // the order's lease: a step that calls the printer or the renderer takes it first, and leaves a wake behind (M2). Sync: inside tx().
  claim(id) { const now = this.now(); return this.q('update merch_orders set lease_until = ?, next_try_at = ? where id = ? and (lease_until is null or lease_until <= ?) returning id', now + LEASE, now + WAKE, id, now).length > 0; }
  unlease(id) { try { this.tx(() => this.run('update merch_orders set lease_until = null where id = ?', id)); } catch (e) { rethrow(e); } }
  stopped(o) { return !o || ENDED.includes(o.status) || o.dispute === 'open' || o.hold === 'dispute'; } // rule 3
  unshipped(l) { return !DEAD.includes(l.status) && (LINE_RANK[l.status] || 0) < LINE_RANK.shipped && l.refunded_qty < l.qty; }
  // an event row; false when it was there already (the same delivery twice)
  event(eid, orderId, type, note) { return this.q('insert into merch_events (id, order_id, type, at, note) values (?, ?, ?, ?, ?) on conflict(id) do nothing returning id', eid, orderId || null, String(type || '').slice(0, 60), this.now(), note == null ? null : String(note).slice(0, 300)).length > 0; }
  // the outbox (S7): a row per email, in the caller's transaction; sent after commit; at most one owner email per order, reason and JST day
  ownerMail(orderId, reason, note) {
    const id = 'o:' + (orderId || '-') + ':' + reason + ':' + jstDay(this.now()), now = this.now();
    if (this.q("insert into merch_outbox (id, order_id, who, kind, note, status, tries, next_try_at, created_at) values (?, ?, 'owner', ?, ?, 'queued', 0, ?, ?) on conflict(id) do nothing returning id", id, orderId || null, reason, note == null ? null : String(note).slice(0, 4000), now, now).length) this.fx.push({ t: 'mail', id });
  }
  buyerMail(orderId, kind, key, to) { // key: the Idempotency-Key (me_<order>_<kind>[_n]); the address is never stored: read from the Stripe session at send time
    const now = this.now();
    if (this.q("insert into merch_outbox (id, order_id, who, kind, status, tries, next_try_at, created_at) values (?, ?, 'buyer', ?, 'queued', 0, ?, ?) on conflict(id) do nothing returning id", key, orderId, kind, now, now).length) { if (to) this.mem.set(key, to); this.fx.push({ t: 'mail', id: key }); }
  }
  flagged(key) { const r = this.one('select mode from merch_flags where key = ?', key); return r && r.mode === 'block'; }
  // N8: never a public fallback key. Without MERCH_HASH_KEY an email is not hashed at all (and no order is taken: the gate); an IP for the rate
  // rows is hashed with a random key that lives only in this object's memory.
  async hashOf(s, kind) {
    if (this.env.MERCH_HASH_KEY) return hmacHex(this.env.MERCH_HASH_KEY, s);
    if (kind !== 'ip') return null;
    if (!this.tmpKey) this.tmpKey = hex(crypto.getRandomValues(new Uint8Array(32)));
    return hmacHex(this.tmpKey, s);
  }
  rate(k, limit) {
    const now = this.now(), r = this.one('select n, reset_at from merch_rate where k = ?', k);
    if (!r || r.reset_at <= now) { this.run('insert or replace into merch_rate (k, n, reset_at) values (?, 1, ?)', k, now + HOUR); return true; }
    if (r.n >= limit) return false;
    this.run('update merch_rate set n = n + 1 where k = ?', k); return true;
  }
  served() { return [this.PP.ART_VER].concat(String(this.env.MERCH_ART_VERS || '').split(',').map((s) => s.trim()).filter(Boolean)); }
  cap() { const n = Number(this.env.MERCH_DAY_CAP); return Number.isFinite(n) && this.env.MERCH_DAY_CAP !== '' && this.env.MERCH_DAY_CAP != null ? n : 10; }
  // S9: the day cap counts orders PAID in the JST day (open sessions never count; a cancelled one does not either). A buyer who pays after the
  // cap was reached is still served: nothing is ever refused after payment.
  dayCount(day) {
    const from = Date.parse(day + 'T00:00:00+09:00');
    return Number(this.one("select count(*) as n from merch_orders where paid_at >= ? and paid_at < ? and status not in ('open', 'expired', 'cancelled')", from, from + DAY).n);
  }
  coolMs() { const m = Number(this.env.MERCH_COOL_MIN); return (Number.isFinite(m) && m > 0 ? m : 60) * MIN; }
  live() { return this.env.MERCH_PROVIDER_MODE === 'live'; }
  // can a new order be taken? -> { ok } or { ok: false, why }
  gate() {
    const now = this.now(), env = this.env;
    if (!fromOpen(env, now)) return { ok: false, why: 'shut' };
    if (env.MERCH_OFF === '1') return { ok: false, why: 'off' };
    // nothing set up: never take an order. M5: the printer and the renderer must be ready too, or paid orders would only wait and be refunded.
    if (!stripe.stripeReady(env) || !env.MERCH_HASH_KEY || !env.MERCH_FILE_KEY || !provider.providerReady(env) || !render.renderReady(env)) return { ok: false, why: 'not_set_up' };
    if (this.live() && !env.MERCH_PROVIDER_WEBHOOK_SECRET) return { ok: false, why: 'not_set_up' }; // S8: signed printer hints before live
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
      if (p === '/merch/webhook/provider' && m === 'POST') return await this.rProvider(req, ip);
      if (p.startsWith('/merch/admin/')) return await adminRoute(this, req, p.slice('/merch/admin/'.length), ip);
      const mm = /^\/merch\/order\/([^/]+)(?:\/(cancel|address|refund))?$/.exec(p);
      if (mm) return await this.rOrder(req, mm[1], mm[2] || null, m, ip);
      return fail('not_found', 404);
    } finally { await this.flush(); this.saveWrites(); await this.arm(); }
  }
  async body(req) { const t = await req.text(); if (t.length > 65536) return null; try { const o = JSON.parse(t || '{}'); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }

  // TRANSACTIONS 6.3 and its note of 24 Nov 2026: countries {code, zone, soon} (never-countries left out, no names), notes as codes, no free text
  rCatalog() {
    const now = this.now(), g = this.gate(), on = productsOn(this.env), off = this.variantOff(), open = openCountries(this.env);
    const products = Object.values(this.cat.products).filter((P) => P.launch && on.has(P.id) && this.PP.PRODUCTS[P.id] && this.PP.PRODUCTS[P.id].launch).map((P) => {
      const colours = P.colours.map((c) => ({ id: c.id, sizes: c.sizes.filter((s) => !off(variantId(P.id, c.id, s))), on: P.sized ? c.sizes.some((s) => !off(variantId(P.id, c.id, s))) : !off(variantId(P.id, c.id, null)) }));
      const sizes = P.sized ? Array.from(new Set(P.colours.flatMap((c) => c.sizes))).map((s) => { const add = (P.size_price && P.size_price[s]) || 0; return { id: s, add, price: P.price + add }; }) : [];
      return { id: P.id, price: P.price, sizes, colours, poses: P.poses, on: colours.some((c) => c.on) };
    });
    const zones = Object.values(ZONES).map((z) => ({ id: z.id, fee: z.fee, free_from: z.free_from, extra: z.extra, eta: z.eta.slice(), notes: zoneNotes(z) }));
    const countries = ALL_COUNTRIES.slice().sort().map((c) => ({ code: c, zone: zoneOf(c), soon: !open.has(c) }));
    return json({ cat_ver: this.cat.cat_ver, shut: !g.ok, resting: g.why === 'off' || undefined, sold_out_today: g.ok && this.dayCount(jstDay(now)) >= this.cap(), products, zones, countries,
      max_lines: this.cat.limits.max_lines, max_qty: this.cat.limits.max_qty, art_vers: this.served() });
  }
  // prices are public: a quote answers while the shop is shut by MERCH_FROM and says shut: true (checkout stays 503 merch_closed)
  async rQuote(req, ip) {
    const ih = await this.hashOf(ip, 'ip'), body = await this.body(req);
    return this.tx(() => {
      if (!this.rate('quote:ip:' + ih, 60)) return fail('slow_down', 429);
      const g = this.gate(); if (!g.ok && g.why !== 'shut') return this.shut(g);
      if (!body) return fail('bad_json', 400);
      const b = this.basket(body); if (b.err) return json(b.err.body, b.err.status);
      if (g.ok && this.dayCount(jstDay(this.now())) >= this.cap()) return fail('sold_out_today', 409);
      return json(Object.assign(quoteOut(this.cat, b, priceBasket(b.zone, b.lines)), { shut: !g.ok }));
    });
  }
  async rCheckout(req, ip) {
    const ih = await this.hashOf(ip, 'ip'), body = await this.body(req), origin = req.headers.get('x-merch-origin') || '';
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
      // the wake at expires_at + 1 h is written with the order: a crash while Stripe makes the session never leaves it open forever
      const o = { id, nonce: body.nonce, day, created_at: now, updated_at: now, status: 'open', country: b.country, zone: b.zone, lang, cat_ver: this.cat.cat_ver,
        subtotal: pr.subtotal, ship_fee: pr.ship_fee, ship_extra: pr.ship_extra, tax: 0, total: pr.total, cost_est: mg.W, margin_est: Math.round(mg.margin), expires_at: now + HOUR, next_try_at: now + 2 * HOUR };
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
    if (!s.ok || !s.data || typeof s.data.id !== 'string' || typeof s.data.url !== 'string') { // T2.1-05 (an error or a timeout): nothing kept, the next tap starts clean
      this.tx(() => { if (this.q("delete from merch_orders where id = ? and status = 'open' and checkout_url is null returning id", o.id).length) this.run('delete from merch_order_items where order_id = ?', o.id); });
      return fail('busy', 503, { say: "We couldn't reach the payment page. Nothing was paid." });
    }
    const kept = this.tx(() => this.set(o.id, { stripe_session: s.data.id, checkout_url: s.data.url, next_try_at: o.expires_at + HOUR }, ['open']));
    if (!kept) { await stripe.expireSession(this.env, s.data.id); return fail('busy', 503, { say: "We couldn't reach the payment page. Nothing was paid." }); } // the order moved on meanwhile
    return json({ order: o.id, url: s.data.url });
  }

  /* ---------------- the order page and the buyer's buttons ---------------- */
  async rOrder(req, id, act, m, ip) {
    const ih = await this.hashOf(ip, 'ip');
    if (!act && m === 'GET') {
      if (!this.tx(() => this.rate('order:ip:' + ih, 120))) return fail('slow_down', 429);
      const o = ORDER_ID.test(id) && this.order(id); if (!o) return fail('not_found', 404);
      return json(this.page(o));
    }
    if (!act || m !== 'POST') return fail('not_found', 404);
    if (!this.tx(() => this.rate('act:ip:' + ih, 10))) return fail('slow_down', 429);
    if (!(ORDER_ID.test(id) && this.order(id))) return fail('not_found', 404);
    const body = (await this.body(req)) || {};
    const o = this.order(id); // read again after the await
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
    const unshipped = L.some((l) => this.unshipped(l));
    return { id: o.id, status: o.status, hold: o.hold, pay_pending: !!o.pay_pending, paid_at: o.paid_at, cancel_until: o.cancel_until, can_cancel: can, country: o.country,
      lines: L.map((l) => ({ line: l.line, product: l.product, colour: l.colour, size: l.size, pose: l.pose, name_on: !!l.name_on, name: l.name_on ? l.name : null, qty: l.qty, unit: l.unit,
        status: l.status, refunded_qty: l.refunded_qty, parcel: l.parcel_id, recipe: l.recipe, reprint_of: l.reprint_of })),
      parcels: parcels.map((p) => ({ id: p.id, product: p.product, carrier: p.carrier, tracking_url: p.tracking_url, shipped_at: p.shipped_at, delivered_at: p.delivered_at })),
      totals: { subtotal: o.subtotal, ship_fee: o.ship_fee, tax: o.tax, total: o.total, refunded: o.refunded }, pres: o.pres_currency ? { currency: o.pres_currency, amount: o.pres_amount } : null,
      gift_code: o.gift_code, late: !!o.late_sent_at && unshipped, resting: this.env.MERCH_OFF === '1' || undefined, dispute: o.dispute || null };
  }
  async rCancel(o, body) {
    const scope = body.scope === 'late' ? 'late' : 'order';
    if (scope === 'late') { // T2.1-31, S10: the FTC delay cancel, for held orders too (never during a dispute: the bank decides)
      const r = this.tx(() => {
        const x = this.order(o.id); if (!x.late_sent_at || !['paid', 'held', 'confirmed', 'part_shipped'].includes(x.status) || x.hold === 'dispute' || x.dispute === 'open') return null;
        const late = this.lines(x.id).filter((l) => this.unshipped(l));
        if (!late.length) return null;
        for (const l of late) this.lineRefund(this.order(x.id), this.lineRow(x.id, l.line), l.qty - l.refunded_qty, 'late');
        const y = this.order(x.id);
        if (y.confirmed_at) { // N5: cancel the whole Printful order only when none of it has shipped; otherwise the owner cancels those items by hand
          if (!this.lines(x.id).some((l) => l.parcel_id || (LINE_RANK[l.status] || 0) >= LINE_RANK.shipped)) { this.set(x.id, { pcancel: 1, next_try_at: this.now() }); this.fx.push({ t: 'pcancel', order: x.id }); }
          else this.ownerMail(x.id, 'cancel_late', 'The buyer cancelled the late part (' + late.map((l) => 'line ' + l.line).join(', ') + '). Part of this Printful order has shipped, so please cancel those items in the Printful dashboard if you can.');
        }
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
    if (o.hold === 'dispute') return fail('not_allowed', 409, { say: 'Your bank is looking at this payment, so we’ve paused it.' }); // the bank decides the money
    // T2.1-18 / T2.2-40: a cancel handled before cancel_until + 120 s wins; a confirm never starts before then and writes 'confirming' first.
    // A step waiting on the printer or the renderer meanwhile reads the order again when its call returns and undoes what it made (M1, S1).
    const ok = this.tx(() => {
      const x = this.order(o.id);
      if (!['paid', 'held'].includes(x.status) || x.hold === 'dispute' || x.cancel_until == null || this.now() >= x.cancel_until + GRACE) return false;
      this.fullRefund(x, 'cancel', 'cancelled'); return true;
    });
    if (!ok) return fail('too_late', 409, { say: "Printing has started, so this order can't be cancelled now. If something arrives damaged, we'll make it right." });
    await this.flush();
    return json({ status: 'cancelled', refund: this.refundState(o.id) });
  }
  refundState(id) { const r = this.q("select status from merch_refunds where order_id = ? and id glob 'mr_*'", id); if (!r.length) return null; return r.every((x) => x.status === 'done') ? 'done' : 'sending'; }
  reshipOk(o) { return o.hold === 'reship' && ['part_shipped', 'shipped', 'confirmed'].includes(o.status) && o.dispute !== 'open'; }
  async rAddress(o, body) {
    const reship = this.reshipOk(o);
    if (!((o.status === 'held' && o.hold === 'address') || reship)) return fail('not_needed', 409);
    const f = (k, max, need) => { const v = body[k]; if (v == null || v === '') return need ? false : ''; return typeof v === 'string' && v.trim().length <= max && !/[\u0000-\u001f]/.test(v) ? v.trim() : false; };
    const a = { name: f('name', 80, true), line1: f('line1', 120, true), line2: f('line2', 120, false), city: f('city', 80, true), state: f('state', 60, false), postal: f('postal', 20, true) };
    for (const k of Object.keys(a)) if (a[k] === false) return fail('bad_address', 400, { field: k });
    if (typeof body.country !== 'string' || !/^[A-Z]{2}$/.test(body.country)) return fail('bad_address', 400, { field: 'country' });
    if (body.country !== o.country) return fail('other_country', 400, { country: o.country, say: 'We can only send this order to its country. To send it somewhere else, we’ll refund you and you can order again.' });
    const rec = { name: a.name, address1: a.line1, address2: a.line2, city: a.city, state_code: a.state, zip: a.postal, country_code: body.country }; // sent on, never stored
    if (!this.tx(() => this.claim(o.id))) return fail('busy', 503, { say: 'One moment, please try again.' });
    let out;
    try {
      if (reship) { // T2.2-45 and question 16: only an address typed in this form is ever used for a reship
        const na = this.one("select * from merch_reprints where order_id = ? and status = 'need_address' order by n limit 1", o.id);
        if (na) {
          this.tx(() => { this.run("update merch_reprints set status = 'queued' where id = ?", na.id); this.set(o.id, { hold: null, hold_at: null }); });
          this.mem.set(na.id, rec); await this.workReprints(this.order(o.id));
          out = json({ ok: true, say: 'Thanks! We’ll send it there.' });
        } else {
          const r = await this.reprint(o, this.reshipLines(o).map((l) => l.line), null, rec, 'reship', true);
          out = r.ok ? json({ ok: true, again: r.ask_again || undefined, say: r.ask_again ? 'Thanks! We’re printing it again first, then we’ll email you to check the address once more before it goes.' : 'Thanks! We’ll send it there.' }) : fail(r.error || 'busy', r.status || 503);
        }
      } else {
        const r = o.provider_order ? await provider.update(this.env, o.provider_order, rec) : await this.makeDraft(o, rec);
        if (r && r.kind === 'address') out = fail('bad_address', 400, { field: 'address' });
        else if (!r || !r.ok) out = fail('busy', 503);
        else this.tx(() => { const x = this.order(o.id); if (x.status === 'held' && x.hold === 'address') this.set(o.id, { status: 'paid', hold: null, why: null, hold_at: null, next_try_at: this.now() }, ['held']); });
      }
    } finally { this.unlease(o.id); }
    if (out) { await this.flush(); return out; }
    await this.tick(); // the flow resumes now (confirm if the hour has passed)
    return json({ ok: true, say: 'Thanks! We’ll send it there.' });
  }

  /* ---------------- money: refunds (TRANSACTIONS 4) ---------------- */
  // the whole order back (cancel in the hour, can't make it, a hold that timed out). Sync: call inside tx(). One row mr_<order>_all_<n>.
  fullRefund(o, reason, to) {
    const now = this.now(), amount = Math.max(0, (o.total || 0) - (o.refunded || 0)), excl = taxBehavior(o.country) === 'exclusive';
    if (amount > 0) {
      const n = Number(this.one('select count(*) as n from merch_refunds where id glob ?', 'mr_' + o.id + '_all_*').n) + 1, rid = 'mr_' + o.id + '_all_' + n;
      this.run("insert into merch_refunds (id, order_id, line, qty, amount, reason, status, created_at, next_try_at) values (?, ?, null, null, ?, ?, 'sending', ?, ?)", rid, o.id, amount, reason, now, now);
      this.fx.push({ t: 'refund', id: rid });
    }
    for (const l of this.lines(o.id)) {
      const shipped = (LINE_RANK[l.status] || 0) >= LINE_RANK.shipped;
      const cols = { refunded_qty: l.qty, refunded: l.line_total + (excl ? l.line_tax || 0 : 0) }; // S2: inclusive tax is inside the price
      if (!shipped && !DEAD.includes(l.status)) { cols.status = 'cancelled'; cols.keep_until = now + 2 * DAY; }
      this.setLine(o.id, l.line, cols);
    }
    const cols = { status: to, refunded: o.total || 0, refunded_at: now, next_try_at: now };
    if (to !== 'refunded' || !['part_shipped', 'shipped'].includes(o.status)) cols.hold = null;
    if (o.provider_order && !o.confirmed_at) { cols.draft_del = 1; this.fx.push({ t: 'deldraft', order: o.id }); }
    this.set(o.id, cols);
    this.stopReprints(o.id);
    this.buyerMail(o.id, to === 'cancelled' ? 'cancelled' : 'refunded_all', 'me_' + o.id + '_' + (to === 'cancelled' ? 'cancelled' : 'refund_all'));
  }
  // one line, q of its items (owner, a reject, a late line). Section 4 amounts; the last item left takes the shipping too (T2.1-22). Sync.
  lineRefund(o, l, q, reason) {
    const left = l.qty - l.refunded_qty; if (!Number.isInteger(q) || q < 1 || q > left) return { error: 'bad_qty' };
    const L = this.lines(o.id).filter((x) => !['void', 'replaced'].includes(x.status));
    const before = L.reduce((a, x) => a + x.qty - x.refunded_qty, 0), after = before - q;
    // S2: the line's tax share only when the tax is on top of the price (exclusive); inclusive tax is already inside unit
    let amount = l.unit * q + (taxBehavior(o.country) === 'exclusive' ? Math.round((l.line_tax || 0) * q / l.qty) : 0);
    if (o.zone === 'world' && o.ship_fee > 0) amount += ZONES.world.extra * (Math.max(0, before - 1) - Math.max(0, after - 1));
    const rest = (o.total || 0) - (o.refunded || 0);
    if (after === 0) amount = rest; // nothing left un-refunded: the shipping that is left goes back too
    amount = Math.max(0, Math.min(amount, rest));
    // N1: glob, not like ('_' is a like wildcard: _l1_% matched l101)
    const now = this.now(), n = Number(this.one('select count(*) as n from merch_refunds where id glob ?', 'mr_' + o.id + '_l' + l.line + '_*').n) + 1, rid = 'mr_' + o.id + '_l' + l.line + '_' + n;
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
    if (after === 0) this.stopReprints(o.id);
    if (after > 0 && ['confirmed', 'part_shipped'].includes(o.status)) { // what is left may all be shipped already (a late part refunded)
      const live = this.lines(o.id).filter((x) => !DEAD.includes(x.status) && x.refunded_qty < x.qty);
      if (live.length && live.every((x) => (LINE_RANK[x.status] || 0) >= LINE_RANK.shipped)) this.set(o.id, { status: 'shipped', next_try_at: null });
    }
    if (reason !== 'render' && reason !== 'provider') this.buyerMail(o.id, after === 0 ? 'refunded_all' : 'refunded', 'me_' + o.id + '_refund_' + rid); // N3
    return { id: rid, amount, last: after === 0 };
  }
  // queued, waiting or held reprints of an order that ended: never made (a draft already made at Printful is deleted). Sync.
  stopReprints(id) {
    const rs = this.q("update merch_reprints set status = case when provider_order is not null then 'drop' else 'cancelled' end where order_id = ? and status in ('queued', 'need_address', 'held') returning *", id);
    for (const rp of rs) this.undoReprint(rp);
    if (rs.some((r) => r.status === 'drop')) this.fx.push({ t: 'droprp', order: id });
  }
  async sendRefund(rid) {
    const now = this.now();
    // N6: claim the row (its next_try_at is the lease): the request's flush and the alarm never send one key at the same time
    const r = this.tx(() => this.one("update merch_refunds set next_try_at = ? where id = ? and status = 'sending' and (next_try_at is null or next_try_at <= ?) returning *", now + WAKE, rid, now));
    if (!r) return;
    const o = this.order(r.order_id); if (!o || !o.payment_intent) { this.tx(() => this.run('update merch_refunds set next_try_at = ? where id = ?', this.now() + 15 * MIN, rid)); return; }
    if (now - r.created_at >= 20 * HOUR) { // S5: Stripe forgets idempotency keys after 24 h: look for this refund by its metadata before sending it again
      const l = await stripe.listRefunds(this.env, o.payment_intent);
      if (!l.ok || !l.data || !Array.isArray(l.data.data)) return; // the wake tries again
      const found = l.data.data.find((re) => re && re.metadata && re.metadata.merch_refund === rid && re.status !== 'failed' && re.status !== 'canceled');
      if (found) { this.tx(() => this.run("update merch_refunds set status = 'done', stripe_refund = ?, next_try_at = null where id = ? and status = 'sending'", found.id, rid)); return; }
    }
    const res = await stripe.refund(this.env, o.payment_intent, r.amount, r.id, o.id);
    this.tx(() => {
      const t = this.now();
      if (res.ok && res.data && res.data.id) { this.run("update merch_refunds set status = 'done', stripe_refund = ?, next_try_at = null where id = ? and status = 'sending'", res.data.id, rid); return; }
      this.run("update merch_refunds set next_try_at = ? where id = ? and status = 'sending'", t + 5 * MIN, rid); // T2.2-42: the alarm retries with the same key
      if (t - r.created_at >= DAY) this.ownerMail(o.id, 'refund_stuck', 'A refund has not gone through for 24 hours: ' + rid);
    });
  }

  /* ---------------- email: the outbox (S7) ---------------- */
  async sendMail(mid) {
    const now = this.now();
    const row = this.tx(() => this.one("update merch_outbox set next_try_at = ? where id = ? and status = 'queued' and next_try_at <= ? returning *", now + WAKE, mid, now));
    if (!row) return;
    let res = null;
    if (row.who === 'owner') res = await mail.owner(this.env, row.order_id, row.kind, row.note, 'mo_' + row.id.replace(/[^A-Za-z0-9_-]/g, '_'));
    else {
      let to = this.mem.get(mid) || null;
      if (!to) { const o = this.order(row.order_id); if (o && o.stripe_session) { const g = await stripe.getSession(this.env, o.stripe_session); if (!g.ok || !g.data) res = { sent: false, why: 'stripe' }; else to = emailOf(g.data); } }
      if (!res) res = to ? await mail.send(this.env, to, row.kind, row.order_id, mid) : { sent: false, why: 'no_address' };
    }
    this.tx(() => {
      const t = this.now(), x = this.one('select * from merch_outbox where id = ?', mid); if (!x || x.status !== 'queued') return;
      if (res.sent) { this.run("update merch_outbox set status = 'sent', sent_at = ?, next_try_at = null, last_error = null where id = ?", t, mid); this.mem.delete(mid); return; }
      const tries = (x.tries || 0) + 1, final = res.why === 'not_set_up' || res.why === 'no_address' || tries >= MAIL_TRIES;
      this.run('update merch_outbox set tries = ?, last_error = ?, status = ?, next_try_at = ? where id = ?', tries, res.why || 'error', final ? 'failed' : 'queued', final ? null : t + MAIL_BACKOFF[Math.min(tries, MAIL_BACKOFF.length) - 1], mid);
      if (final && x.who === 'buyer' && res.why !== 'not_set_up') this.ownerMail(x.order_id, 'mail_failed', 'The "' + x.kind + '" email could not be sent (' + (res.why || 'error') + ', ' + tries + ' tries). Please write to the buyer from the Stripe dashboard.');
    });
  }

  /* ---------------- side effects, after each transaction ---------------- */
  async flush() {
    while (this.fx.length) {
      const e = this.fx.shift();
      try {
        if (e.t === 'refund') await this.sendRefund(e.id);
        else if (e.t === 'mail') await this.sendMail(e.id);
        else if (e.t === 'deldraft') await this.delDraft(e.order);
        else if (e.t === 'pcancel') await this.provCancel(e.order);
        else if (e.t === 'droprp') await this.dropReprints(e.order);
      } catch (err) { rethrow(err); console.error('merch fx', e.t, String((err && err.message) || err).slice(0, 100)); }
    }
  }
  // the Printful draft of a cancelled, refunded or disputed order (draft_del = 1 is the durable claim; the alarm retries)
  async delDraft(id) {
    const o = this.order(id); if (!o || !o.draft_del || !o.provider_order) return;
    const po = o.provider_order, r = await provider.deleteDraft(this.env, po);
    this.tx(() => {
      const x = this.order(id); if (!x || x.provider_order !== po || !x.draft_del) return;
      if (!r.ok) return this.next(id, this.now() + 15 * MIN); // T2.2-41
      // gone: a later draft (a dispute won and released) uses a new external id, <order>-d<n>
      this.set(id, { draft_del: 0, provider_order: null, provider_cost: null, draft_n: (x.draft_n || 0) + 1 });
      this.run("update merch_order_items set status = 'ready', provider_item = null where order_id = ? and status = 'drafted'", id);
      this.event('x:deldraft:' + po, id, 'draft_deleted', po);
    });
  }
  async provCancel(id) { // T2.1-31: the late part, when none of the Printful order has shipped (N5)
    const o = this.order(id); if (!o || !o.pcancel) return;
    const r = o.provider_order ? await provider.cancel(this.env, o.provider_order) : { ok: false, kind: 'cannot' };
    this.tx(() => {
      if (!r.ok && (r.kind === 'down' || r.kind === 'timeout')) return this.next(id, this.now() + 15 * MIN);
      this.run('update merch_orders set pcancel = 0 where id = ?', id);
      if (!r.ok) this.ownerMail(id, 'cancel_late', 'Printful could not cancel the late part (' + (r.kind || '?') + '): please cancel it in the Printful dashboard if you can.');
    });
  }
  async dropReprints(id) { // reprint drafts made just as the order ended: deleted at Printful, never confirmed
    for (const rp of this.q("select * from merch_reprints where order_id = ? and status = 'drop'", id)) {
      const r = rp.provider_order ? await provider.deleteDraft(this.env, rp.provider_order) : { ok: true };
      this.tx(() => { if (r.ok) this.run("update merch_reprints set status = 'cancelled' where id = ? and status = 'drop'", rp.id); else this.next(id, this.now() + 15 * MIN); });
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
      // open: the usual. expired: paid after we gave up on it (question 13, S6). held with no payment recorded: a dispute or a Dashboard refund came first.
      if (!(x.status === 'open' || x.status === 'expired' || (x.status === 'held' && !x.paid_at))) return ack(x.id, 'after ' + x.status); // T2.1-25, T2.2-18
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
      return ack(x && x.id, 'refund failed', () => { if (row) this.run("update merch_refunds set status = 'failed', next_try_at = null where id = ?", row.id); if (x) { this.set(x.id, { refund_failed: 1 }); this.ownerMail(x.id, 'refund_failed', 'A refund failed at the bank: ' + (row ? row.id : o.id) + '. Please write to the buyer.'); } });
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
  // a paid session (re-read from Stripe) -> the order is paid (T2.1-06/08), or held for review (T2.2-14/15/52, late_pay), or, when a dispute or a
  // Dashboard refund came before completed, the payment is recorded and the order keeps its hold (the owner decides: T2.2-24, S3, N7)
  async paidFrom(id, cs, eid) {
    const em = emailOf(cs), eh = em ? await this.hashOf(String(em).toLowerCase(), 'email') : null;
    this.tx(() => {
      if (eid && !this.event(eid, id, 'paid')) return;
      const o = this.order(id), now = this.now(); if (!o) return;
      const before = o.status === 'held' && !o.paid_at;
      if (o.status !== 'open' && o.status !== 'expired' && !before) return;
      const L = this.lines(id), check = this.paidCheck(o, L, cs), tax = (cs.total_details && cs.total_details.amount_tax) || 0;
      const items = (cs.line_items && cs.line_items.data) || [];
      L.forEach((l, i) => this.setLine(id, l.line, { line_tax: (items[i] && items[i].amount_tax) || 0, status: ['pending', 'void'].includes(l.status) ? 'queued' : l.status }));
      const pd = cs.presentment_details || {};
      const cols = { paid_at: now, cancel_until: now + this.coolMs(), ship_by: addBusinessDays(now, 5) + 2 * DAY, payment_intent: piOf(cs), tax, total: Number.isInteger(cs.amount_total) ? cs.amount_total : o.total,
        pres_currency: pd.presentment_currency || null, pres_amount: pd.presentment_amount || null, email_hash: eh, pay_pending: 0 };
      if (before) { // the hold stays; its timer stays
        this.set(id, cols, ['held']);
        if (o.hold === 'dispute' && eh) this.flag('e:' + eh, 'block', 'dispute ' + id);
        return;
      }
      cols.next_try_at = now;
      let hold = null;
      if (o.status === 'expired') hold = check || 'late_pay'; // question 13 (S6): paid after we expired it: kept safe for the owner, refunded after 24 h
      else if (check) hold = check;
      else if (eh && this.flagged('e:' + eh)) hold = 'blocked';
      else if (eh && Number(this.one('select count(*) as n from merch_orders where email_hash = ? and paid_at > ? and id != ?', eh, now - DAY, id).n) >= 3) hold = 'many';
      if (hold) Object.assign(cols, { status: 'held', hold: 'review', why: hold, hold_at: now, next_try_at: now + DAY });
      else cols.status = 'paid';
      const g = this.one('select code from merch_gift_pool where order_id is null order by code limit 1');
      if (g && !hold) { this.run('update merch_gift_pool set order_id = ?, claimed_at = ? where code = ?', id, now, g.code); cols.gift_code = g.code; }
      this.set(id, cols, [o.status]);
      if (hold) this.ownerMail(id, 'review', hold === 'late_pay' ? 'Paid after it expired: confirm (merch.sh confirm) to make it, or it is refunded in full after 24 hours.' : 'Held for review: ' + hold);
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
        if (mine) { // S5: our own refund: it went through, whatever our call heard back
          this.run("update merch_refunds set stripe_refund = coalesce(stripe_refund, ?), next_try_at = case when status = 'sending' then null else next_try_at end, status = case when status = 'sending' then 'done' else status end where id = ?", re.id, mine.id);
          continue;
        }
        if (this.one('select id from merch_refunds where stripe_refund = ? or id = ?', re.id, 's:' + re.id)) continue;
        this.run("insert into merch_refunds (id, order_id, line, qty, amount, reason, stripe_refund, status, created_at) values (?, ?, null, null, ?, 'dashboard', ?, 'done', ?)", 's:' + re.id, o.id, re.amount || 0, re.id, now);
        added += re.amount || 0; // T2.2-19: unassigned, lines unchanged
      }
      const full = sum >= (Number.isInteger(ch.amount) ? ch.amount : o.total);
      if (o.status === 'open' || (o.status === 'held' && !o.paid_at)) { // before completed
        if (full) { // T2.2-18: refunded before completed: nothing will be made
          this.set(o.id, { status: 'refunded', hold: null, payment_intent: ch.payment_intent, refunded: sum, refunded_at: now, next_try_at: null });
          this.run("update merch_order_items set status = 'cancelled', refunded_qty = qty where order_id = ?", o.id); return;
        }
        // S3: part of it back before completed: never "refunded, make nothing", never printed silently. Held for the owner; 24 h: the rest back.
        if (o.status === 'open') {
          this.set(o.id, { status: 'held', hold: 'review', why: 'dash_refund', hold_at: now, payment_intent: ch.payment_intent, refunded: sum, refunded_at: now, next_try_at: now + DAY }, ['open']);
          this.ownerMail(o.id, 'review', 'Part of this order (' + sum + ' cents) was refunded in the Stripe Dashboard before the payment was recorded. Confirm it (merch.sh confirm) to make it, or the rest is refunded after 24 hours.');
        } else this.set(o.id, { refunded: sum, refunded_at: now });
        return;
      }
      if (added) this.set(o.id, { refunded: (o.refunded || 0) + added, refunded_at: now });
      o = this.order(o.id);
      if (full && !ENDED.includes(o.status)) {
        const before = ['paid', 'held'].includes(o.status);
        const cols = { status: 'refunded', refunded: sum, refunded_at: now };
        if (before) { // T2.2-20
          cols.hold = null; cols.next_try_at = now;
          if (o.provider_order && !o.confirmed_at) { cols.draft_del = 1; this.fx.push({ t: 'deldraft', order: o.id }); }
          this.run("update merch_order_items set status = 'cancelled', keep_until = ? where order_id = ? and status in ('pending', 'queued', 'ready', 'drafted')", now + 2 * DAY, o.id);
        } else this.ownerMail(o.id, 'refund_after_confirm', 'Refunded in the Dashboard after printing started: cancel it in the Printful dashboard if you can.'); // T2.2-21
        this.run('update merch_order_items set refunded_qty = qty where order_id = ?', o.id); // M4: every line counts as refunded: no reprint, no reship
        this.set(o.id, cols);
        this.stopReprints(o.id);
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
      const pause = () => { // no confirm, no refund (the bank decides the money); an unconfirmed draft is deleted
        const cols = { status: 'held', hold: 'dispute', hold_at: now, next_try_at: null };
        if (o.provider_order && !o.confirmed_at) { cols.draft_del = 1; cols.next_try_at = now; this.fx.push({ t: 'deldraft', order: o.id }); }
        this.set(o.id, cols, ['paid', 'held']);
      };
      if (type === 'charge.dispute.created') {
        if (o.status === 'open') { this.set(o.id, { status: 'held', hold: 'dispute', hold_at: now, payment_intent: d.payment_intent, disputed_at: now, dispute: 'open', dispute_id: d.id || null, next_try_at: null }, ['open']); this.ownerMail(o.id, 'dispute', 'A dispute before the payment was recorded.'); return; } // T2.2-24
        this.set(o.id, { disputed_at: now, dispute: 'open', dispute_id: d.id || null });
        if (o.email_hash) this.flag('e:' + o.email_hash, 'block', 'dispute ' + o.id);
        if (['paid', 'held'].includes(o.status)) pause(); // T2.2-22
        this.ownerMail(o.id, 'dispute', 'A dispute: answer in Stripe with the tracking, the delivery scan and the print PNG (merch.sh show).'); // T2.2-23: the flow goes on
        return;
      }
      const won = d.status === 'won';
      this.set(o.id, { dispute: won ? 'won' : 'lost' });
      if (won) this.ownerMail(o.id, 'dispute_won', 'Dispute won. If it was held before printing, decide: ship it (merch.sh confirm) or refund it.');
      else if (['paid', 'held'].includes(o.status)) pause(); // lost: the bank took the money back; it is never made
      this.event('x:dispute_' + (won ? 'won' : 'lost') + ':' + o.id, o.id, 'dispute_' + (won ? 'won' : 'lost'));
    });
    await this.flush();
    return json({ received: true });
  }

  /* ---------------- the provider's hints (T2.1-14..17, T2.1-27/28, T2.2-45..48) ---------------- */
  async rProvider(req, ip) {
    const ih = await this.hashOf(ip, 'ip');
    if (!this.tx(() => this.rate('hook:ip:' + ih, 300))) return fail('slow_down', 429); // S8: a flood of hints writes no rows and triggers no printer reads
    const raw = await req.text(); if (raw.length > 600000) return fail('too_big', 413);
    if (this.live() && !this.env.MERCH_PROVIDER_WEBHOOK_SECRET) return fail('signing_required', 401); // S8: unsigned hints only while not live
    const h = await provider.parseHook(this.env, raw, req.headers);
    if (h && h.bad) return fail('bad_signature', 401);
    const eid = 'p:' + (h && h.id ? h.id : await sha256hex(raw));
    if (this.one('select id from merch_events where id = ?', eid)) return json({ received: true });
    const ref = h && h.order, m = ref && /^(mo_[A-Za-z0-9_-]{22})(?:-[rd](\d+))?$/.exec(ref);
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
        const x = this.order(id), live = this.lines(id).filter((l) => l.parcel_id === s.id && !['replaced', 'cancelled', 'void', 'rejected'].includes(l.status) && l.refunded_qty < l.qty);
        // M4: nothing to reship on a refunded or cancelled order, in a dispute, or when its lines are refunded: the buyer is not asked
        if (ENDED.includes(x.status) || x.dispute === 'open' || !live.length) this.ownerMail(id, 'returned', 'A parcel came back to Printful (' + s.id + '); nothing is reshipped (refunded, cancelled or in a dispute).');
        else { this.set(id, { hold: 'reship', hold_at: now, next_try_at: now + 7 * DAY }); this.buyerMail(id, 'address', 'me_' + id + '_address_' + s.id); }
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
  async alarm() { await this.init(); try { await this.tick(); } finally { await this.flush(); this.saveWrites(); await this.arm(); } }
  async arm() {
    const a = this.one(`select min(t) as t from (select min(next_try_at) as t from merch_orders where next_try_at is not null
      union all select min(next_try_at) as t from merch_refunds where status = 'sending' and next_try_at is not null
      union all select min(next_try_at) as t from merch_outbox where status = 'queued' and next_try_at is not null)`);
    if (a && a.t != null) await this.st.setAlarm(Math.max(Number(a.t), this.now() + 1)); else await this.st.deleteAlarm();
  }
  // works through what is due, a bounded number of steps per wake. M2: an order is claimed (lease + a wake 5 minutes on) BEFORE its step runs,
  // so an eviction, a deploy or an exception mid-step leaves the order with a wake: never stranded.
  async tick(max) {
    for (let i = 0; i < (max || 40); i++) {
      const now = this.now();
      const rf = this.one("select id from merch_refunds where status = 'sending' and next_try_at <= ? order by next_try_at limit 1", now);
      if (rf) { await this.sendRefund(rf.id); continue; }
      const mo = this.one("select id from merch_outbox where status = 'queued' and next_try_at <= ? order by next_try_at limit 1", now);
      if (mo) { await this.sendMail(mo.id); continue; }
      const o = this.one('select id, lease_until from merch_orders where next_try_at is not null and next_try_at <= ? order by next_try_at limit 1', now);
      if (!o) break;
      if (!this.tx(() => this.claim(o.id))) { this.tx(() => this.run('update merch_orders set next_try_at = ? where id = ?', o.lease_until, o.id)); continue; } // a request holds it
      try { await this.work(o.id); }
      catch (e) {
        rethrow(e); console.error('merch step', String((e && e.message) || e).slice(0, 120));
        this.tx(() => { this.run("update merch_orders set last_error = 'exception' where id = ?", o.id); this.ownerMail(o.id, 'stuck', 'A step failed with an error and is tried again every 5 minutes: ' + String((e && e.message) || e).slice(0, 120)); });
      } finally { this.unlease(o.id); }
      await this.flush();
    }
  }
  lateCheck(id) { // T2.1-30, S10: once per order, whatever it waits for (not in a dispute)
    const o = this.order(id), now = this.now();
    if (!o || !o.ship_by || now < o.ship_by || o.late_sent_at || !LATE_ST.includes(o.status) || o.hold === 'dispute') return;
    if (!this.lines(id).some((l) => this.unshipped(l))) return;
    this.set(id, { late_sent_at: now }); this.buyerMail(id, 'late', 'me_' + id + '_late');
  }
  async work(id) {
    let o = this.order(id); if (!o) return;
    if (o.draft_del && o.provider_order) { await this.delDraft(id); o = this.order(id); }
    if (o.pcancel) { await this.provCancel(id); o = this.order(id); }
    if (this.one("select id from merch_reprints where order_id = ? and status = 'drop'", id)) { await this.dropReprints(id); o = this.order(id); }
    this.tx(() => this.lateCheck(id));
    o = this.order(id); const now = this.now();
    switch (o.status) {
      case 'open':
        if (now >= o.expires_at + HOUR) return o.stripe_session ? this.staleOpen(o) : this.tx(() => this.expire(id)); // no session stored (a crash at checkout): it can never be paid
        return this.tx(() => this.next(id, o.expires_at + HOUR));
      case 'paid': return this.workPaid(o);
      case 'held': return this.workHeld(o);
      case 'confirming': if (now - o.updated_at >= 2 * MIN) return this.confirmOrder(o, true); return this.tx(() => this.next(id, o.updated_at + 2 * MIN)); // T2.2-55
      case 'confirmed': case 'part_shipped': case 'shipped': return this.workAfter(o);
      default: { // ended: only clean-up is left
        const more = o.draft_del || o.pcancel || this.one("select id from merch_reprints where order_id = ? and status = 'drop'", id);
        return this.tx(() => this.next(id, more ? now + 15 * MIN : null));
      }
    }
  }
  async workAfter(o) {
    const now = this.now(), id = o.id;
    if (o.hold === 'reship' && now >= o.hold_at + 7 * DAY) { // T2.2-45: 7 days without an address: those lines are refunded
      return this.tx(() => {
        const x = this.order(id); if (x.hold !== 'reship') return;
        const na = this.q("select n from merch_reprints where order_id = ? and status = 'need_address'", id).map((r) => r.n);
        const L = this.reshipLines(x).concat(this.lines(id).filter((l) => na.includes(l.rp) && l.refunded_qty < l.qty));
        for (const l of L) { const y = this.order(id); if (y.status === 'refunded') break; const z = this.lineRow(id, l.line); this.lineRefund(y, z, z.qty - z.refunded_qty, 'reship'); }
        this.run("update merch_reprints set status = 'cancelled' where order_id = ? and status = 'need_address'", id);
        this.set(id, { hold: null, hold_at: null, next_try_at: null });
      });
    }
    const q = this.lines(id).find((l) => l.status === 'queued'); if (q) return this.renderLine(o, q);
    if (await this.workReprints(o)) return;
    return this.tx(() => this.next(id, o.hold === 'reship' ? o.hold_at + 7 * DAY : null));
  }
  async workPaid(o) {
    const now = this.now(), L = this.lines(o.id), queued = L.find((l) => l.status === 'queued');
    if (queued) return this.renderLine(o, queued);
    if (!o.provider_order) {
      if (L.some((l) => l.status === 'ready')) return this.makeDraft(o);
      // nothing left to make (every line rejected or cancelled): the money that is left goes back
      return this.tx(() => { const x = this.order(o.id); if (x.status === 'paid') this.fullRefund(x, 'nothing', 'refunded'); });
    }
    if (now < o.cancel_until + GRACE) return this.tx(() => this.next(o.id, o.cancel_until + GRACE));
    if (!this.live()) return this.tx(() => { if (this.set(o.id, { status: 'held', hold: 'draft_mode', hold_at: now }, ['paid'])) this.next(o.id, null); }); // T2.1-13
    return this.confirmOrder(o);
  }
  async workHeld(o) {
    const now = this.now(), since = now - (o.hold_at || now), id = o.id, hold = o.hold, why = o.why;
    const same = (x) => x && x.status === 'held' && x.hold === hold && x.why === why; // a decision taken on this hold only applies to this hold
    const refund = (w) => this.tx(() => { const x = this.order(id); if (!same(x)) return; this.fullRefund(x, w, 'refunded'); this.ownerMail(id, 'auto_refund', 'Refunded in full: ' + w); });
    const release = () => this.tx(() => { const x = this.order(id); if (same(x)) this.set(id, { status: 'paid', hold: null, why: null, hold_at: null, next_try_at: now }, ['held']); });
    switch (hold) {
      case 'render': { // T2.2-29
        if (since >= 72 * HOUR) return refund('render_72h');
        if (since >= 2 * HOUR) this.tx(() => this.ownerMail(id, 'render_held', 'Print files have waited 2 hours or more.'));
        const q = this.lines(id).find((l) => l.status === 'queued');
        if (q) return this.renderLine(o, q);
        return release();
      }
      case 'provider': // T2.2-34 (why 'down'); 'onhold' waits for Printful's hint (T2.2-46)
        if (why === 'onhold') return this.tx(() => this.next(id, null));
        if (since >= DAY) this.tx(() => this.ownerMail(id, 'provider_down', 'Printful has not answered for 24 hours.'));
        return o.provider_order ? this.confirmOrder(o) : this.makeDraft(o);
      case 'address': if (since >= 7 * DAY) return refund('address_7d'); return this.tx(() => this.next(id, o.hold_at + 7 * DAY)); // T2.2-36
      case 'wallet': if (since >= 5 * DAY) return refund('wallet_5d'); return this.confirmOrder(o); // T2.2-38
      case 'review':
        if (why === 'cost') { // T2.2-39: 48 h without the owner: confirm if the margin is still >= $0, else refund
          if (since < 48 * HOUR) return this.tx(() => this.next(id, o.hold_at + 48 * HOUR));
          const L = this.lines(id).filter((l) => !DEAD.includes(l.status)), P = o.total - o.refunded - (taxBehavior(o.country) === 'exclusive' ? o.tax : 0);
          const m = P - o.provider_cost - (0.039 * P + 30) - 0.05 * o.provider_cost;
          if (m >= 0 && L.length) return release();
          return refund('cost');
        }
        if (since < DAY) return this.tx(() => this.next(id, o.hold_at + DAY));
        if (why === 'many') return release(); // T2.2-52: the 4th order goes on (gifts are normal)
        return refund('review_' + why); // T2.2-14/15/52 blocked, late_pay, dash_refund, a printer refusal
      default: return this.tx(() => this.next(id, null)); // dispute, draft_mode: the owner decides (the delay email keeps its wake: lateWake)
    }
  }
  // one line through the renderer (T2.1-10, T2.2-28..31, T2.2-49): at least 11 s between renders
  async renderLine(o, l) {
    const now = this.now(), id = o.id, last = Number(this.meta('render_at') || 0), ck = id + '/' + l.line;
    let r = this.pngs.get(ck) || null; // S11: a PNG whose store failed is stored again without a new render
    if (!r) {
      if (now < last + 11e3) return this.tx(() => this.next(id, last + 11e3));
      this.tx(() => this.setMeta('render_at', now));
      const url = (this.env.MERCH_PUBLIC_URL || 'https://merch-api.doodledoggo.app') + '/merch/print/' + l.art_ver + '/' + l.print_link; // the line's own art_ver folder
      const good = (x) => x.ok && this.pngOk(l.product, x.png);
      r = await render.screenshot(this.env, l.product, url); let renderer = 'browser';
      if (r.ok && !good(r)) r = { ok: false, kind: 'error', why: 'png' };
      if (!r.ok && r.kind === 'rate') return this.tx(() => this.next(id, now + 11e3)); // T2.2-30
      if (!r.ok && (r.kind === 'daily' || (r.kind === 'error' && l.tries >= 1))) { const f = await render.resvg(this.env, l.product, url); if (good(f)) { r = f; renderer = 'resvg'; } }
      if (r.ok) r = { ok: true, png: r.png, renderer };
    }
    const live = () => { const x = this.order(id), y = this.lineRow(id, l.line); return x && y && y.status === 'queued' && !ENDED.includes(x.status) ? { x, y } : null; };
    if (r.ok) {
      if (!live()) { this.pngs.delete(ck); return this.tx(() => this.next(id, this.now())); } // S1: cancelled or refunded during the render: nothing is stored
      const s = await this.storePng(o, l, r.png);
      if (!s.ok) { // S11: back off (never at once), the owner is told, past the hour it is held render (72 h: refund)
        this.pngs.set(ck, r);
        return this.tx(() => {
          const t = this.now(), x = this.order(id), y = this.lineRow(id, l.line); if (!y) return;
          const n = (y.store_tries || 0) + 1;
          this.setLine(id, l.line, { store_tries: n, last_error: 'store' });
          this.ownerMail(id, 'store_failed', 'A print file could not be stored (try ' + n + '). Look at the print storage (merch.sh report).');
          if (x.status === 'paid' && t >= x.cancel_until) this.set(id, { status: 'held', hold: 'render', why: 'store', hold_at: t }, ['paid']);
          this.next(id, t + (n <= BACKOFF.length ? BACKOFF[n - 1] : HOUR));
        });
      }
      this.pngs.delete(ck);
      return this.tx(() => {
        const t = this.now(), ok = live();
        if (!ok) { const y = this.lineRow(id, l.line); if (y) this.setLine(id, l.line, { file_key: s.key, file_sha: s.sha, file_bytes: r.png.length, keep_until: t + 2 * DAY }); return this.next(id, t); } // S1: kept 2 days, nothing else
        this.setLine(id, l.line, { status: 'ready', file_key: s.key, file_sha: s.sha, file_bytes: r.png.length, rendered_at: t, renderer: r.renderer, last_error: null, store_tries: 0 });
        if (ok.x.status === 'held' && ok.x.hold === 'render' && !this.lines(id).some((z) => z.status === 'queued')) this.set(id, { status: 'paid', hold: null, why: null, hold_at: null }, ['held']);
        this.next(id, t);
      });
    }
    return this.tx(() => { // a failure changes only a line still queued in an order that goes on (S1: no "couldn't print" after a cancel)
      const t = this.now(), ok = live(); if (!ok) return this.next(id, t);
      const { x, y } = ok;
      if (r.kind === 'daily' || r.kind === 'not_set_up') { // T2.2-29: wait for 09:00 JST; past the hour, held render
        const reset = r.kind === 'daily' ? nextUtcMidnight(t) : t + HOUR, cols = {};
        let nt = x.status === 'paid' && t < x.cancel_until ? Math.min(reset, x.cancel_until) : reset; // look again when the hour ends, to hold it
        if (x.status === 'paid' && t >= x.cancel_until) Object.assign(cols, { status: 'held', hold: 'render', hold_at: t });
        const held = cols.hold === 'render' || (x.status === 'held' && x.hold === 'render'), since = cols.hold_at || x.hold_at || t;
        if (held) nt = Math.min(reset, t + 2 * HOUR, since + 72 * HOUR); // held: the 2-hour owner email and the 72-hour refund need a wake
        cols.next_try_at = nt; this.set(id, cols); this.setLine(id, l.line, { last_error: r.kind });
        return;
      }
      if (y.tries < 1) { this.setLine(id, l.line, { tries: 1, last_error: r.why || 'render' }); return this.next(id, t + MIN); } // T2.2-28: once more after 1 min
      this.setLine(id, l.line, { status: 'rejected', last_error: 'render', tries: y.tries + 1 }); // still failing after the fallback: refunded, the others go on
      const res = this.lineRefund(x, this.lineRow(id, l.line), y.qty - y.refunded_qty, 'render');
      this.ownerMail(id, 'render_reject', 'Line ' + l.line + ' could not be rendered and was refunded.');
      if (!res.last) this.buyerMail(id, 'reject', 'me_' + id + '_reject_' + l.line);
      this.next(id, t);
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
      let res; try { res = await this.env.PRINTS.get(this.env.PRINTS.idFromName(shard)).fetch('https://prints/put?key=' + encodeURIComponent(key) + '&sha=' + sha, { method: 'PUT', body: png }); }
      catch (e) { rethrow(e); return { ok: false }; }
      if (res.ok) { const j = await res.json(); this.tx(() => this.run('insert or replace into merch_shards (name, bytes, files) values (?, ?, ?)', shard, j.shard_bytes, j.files)); return { ok: true, key, sha }; }
      if (res.status !== 507) return { ok: false };
      this.tx(() => this.run('insert or replace into merch_shards (name, bytes, files) values (?, ?, coalesce((select files from merch_shards where name = ?), 0))', shard, 900 * (1 << 20), shard)); // full: the next one
    }
    return { ok: false };
  }
  async fileUrl(key, ttlMs) {
    const exp = Math.floor((this.now() + (ttlMs || 30 * DAY)) / 1000), sig = await hmacHex(this.env.MERCH_FILE_KEY || '', key + '/' + exp);
    return (this.env.MERCH_PUBLIC_URL || 'https://merch-api.doodledoggo.app') + '/merch/file/' + key + '/' + exp + '/' + sig + '.png';
  }
  backoff(o) { // sync: inside tx()
    const now = this.now(), tries = (o.tries || 0) + 1, wait = tries <= BACKOFF.length ? BACKOFF[tries - 1] : HOUR;
    const cols = { tries, next_try_at: now + wait, last_error: 'down' };
    if (o.status === 'paid' && now >= o.cancel_until + GRACE) Object.assign(cols, { status: 'held', hold: 'provider', why: 'down', hold_at: now });
    if (o.status === 'confirming') Object.assign(cols, { status: 'held', hold: 'provider', why: 'down', hold_at: o.hold_at || now });
    this.set(o.id, cols);
  }
  draftable(x) { return !!x && !this.stopped(x) && !x.draft_del && (x.status === 'paid' || (x.status === 'held' && ['provider', 'address', 'render'].includes(x.hold))); }
  extOf(o) { return o.draft_n ? o.id + '-d' + o.draft_n : o.id; } // a new external id after a draft was deleted
  // the Printful draft, inside the hour (T2.1-11, T2.2-32..36). rec: an address the buyer fixed (passed straight on, never stored)
  async makeDraft(o0, rec) {
    const id = o0.id, guard = (fn) => this.tx(() => { const x = this.order(id); if (this.draftable(x)) fn(x); });
    let o = this.order(id); if (!this.draftable(o)) return { ok: false, kind: 'stopped' };
    let recipient = rec;
    if (!recipient) {
      const g = await stripe.getSession(this.env, o.stripe_session);
      if (!g.ok || !g.data) { guard((x) => this.backoff(x)); return { ok: false, kind: 'down' }; }
      recipient = recipientOf(g.data);
    }
    // S16: GET by external id before EVERY create (a crash during an earlier create leaves an order we never heard of): never two drafts
    let ext = this.extOf(this.order(id));
    const ex = await provider.get(this.env, ext);
    if (ex.ok && ex.data && !['canceled', 'failed'].includes(ex.data.status)) { this.adopt(id, ex.data, ext); return { ok: true }; }
    if (ex.ok && ex.data) { this.tx(() => this.run('update merch_orders set draft_n = coalesce(draft_n, 0) + 1 where id = ?', id)); ext = this.extOf(this.order(id)); }
    else if (ex.kind !== 'not_found') { guard((x) => this.backoff(x)); return { ok: false, kind: 'down' }; } // cannot tell: never create blind
    for (let round = 0; round < 7; round++) {
      o = this.order(id); if (!this.draftable(o)) return { ok: false, kind: 'stopped' };
      const L = this.lines(id).filter((l) => l.status === 'ready');
      if (!L.length) { guard((x) => this.fullRefund(x, 'provider', 'refunded')); return { ok: false, kind: 'refused' }; }
      const urls = {}; for (const l of L) urls[l.line] = await this.fileUrl(l.file_key);
      const r = await provider.createDraft(this.env, o, L, recipient, urls, ext);
      if (r.ok && r.data) { this.adopt(id, r.data, ext); return { ok: true }; }
      // every answer below changes the order only if it is still as this step found it (rule 2)
      if (r.kind === 'refused' && r.items && r.items.length) {
        const bad = L.filter((l) => r.items.includes(ext + '_' + l.line));
        if (!bad.length || bad.length === L.length) { // T2.2-33: every line refused: all of it back, shipping included
          guard((x) => { for (const l of L) { const y = this.lineRow(id, l.line); if (y.status !== 'ready') continue; this.setLine(id, l.line, { status: 'rejected', last_error: 'provider' }); this.run('update merch_variants set on_flag = 0 where id = ?', l.variant); } this.fullRefund(this.order(id), 'provider', 'refunded'); this.ownerMail(id, 'provider_reject', 'Printful refused every line.'); });
          return { ok: false, kind: 'refused' };
        }
        guard(() => { // T2.2-32: that line is refunded and its variant turned off; the draft is made with the rest
          for (const l of bad) {
            const y = this.lineRow(id, l.line); if (y.status !== 'ready') continue;
            this.setLine(id, l.line, { status: 'rejected', last_error: 'provider' });
            this.run('insert into merch_variants (id, product, colour, size, provider_variant, on_flag) values (?, ?, ?, ?, ?, 0) on conflict(id) do update set on_flag = 0', l.variant, l.product, l.colour, l.size, l.provider_variant);
            this.lineRefund(this.order(id), this.lineRow(id, l.line), y.qty - y.refunded_qty, 'provider');
            this.buyerMail(id, 'reject', 'me_' + id + '_reject_' + l.line);
          }
          this.ownerMail(id, 'provider_reject', 'Printful refused ' + bad.map((l) => l.variant).join(', '));
        });
        continue;
      }
      if (r.kind === 'address') { // T2.2-36
        guard(() => { const t = this.now(); this.set(id, { status: 'held', hold: 'address', hold_at: t, next_try_at: t + 7 * DAY }); this.buyerMail(id, 'address', 'me_' + id + '_address'); });
        return r;
      }
      if (r.kind === 'timeout') { guard((x) => this.set(id, { tries: (x.tries || 0) + 1, last_error: 'timeout', next_try_at: this.now() + MIN })); return r; }
      if (r.kind === 'refused') { guard(() => { const t = this.now(); this.set(id, { status: 'held', hold: 'review', why: 'provider', hold_at: t, next_try_at: t + DAY }); this.ownerMail(id, 'review', 'Printful refused the draft without naming a line.'); }); return r; }
      guard((x) => this.backoff(x)); return r; // down, not set up (T2.2-34)
    }
    return { ok: false, kind: 'refused' };
  }
  // a draft Printful made (or one found by its external id): kept only if the order still wants it (M1)
  adopt(id, d, ext) {
    this.tx(() => {
      const x = this.order(id), now = this.now();
      const drop = (why) => { this.set(id, { provider: 'printful', provider_order: d.id, draft_del: 1, next_try_at: now }); this.event('x:draft_stale:' + d.id, id, 'draft_stale', why); this.fx.push({ t: 'deldraft', order: id }); };
      if (!this.draftable(x)) return drop(x.status + '/' + (x.hold || '') + '/' + (x.dispute || '')); // cancelled, refunded or disputed during the call: delete it, change nothing else
      const inDraft = new Set((d.items || []).map((i) => i.external_id));
      const ready = this.lines(id).filter((l) => l.status === 'ready' && (!inDraft.size || inDraft.has(ext + '_' + l.line)));
      if (!ready.length) return drop('no lines');
      for (const l of ready) this.setLine(id, l.line, { status: 'drafted', provider_item: ext + '_' + l.line });
      const drafted = this.lines(id).filter((l) => l.status === 'drafted'); // the estimate covers the drafted lines only
      const cost = (d.costs.items || 0) + (d.costs.shipping || 0);
      const est = marginOf(this.cat, x.country, drafted, x.subtotal, x.ship_fee, now, this.costs()).W;
      const cols = { provider: 'printful', provider_order: d.id, provider_cost: cost, tries: 0, last_error: null };
      if (cost > est * 1.1) { Object.assign(cols, { status: 'held', hold: 'review', why: 'cost', hold_at: now, next_try_at: now + 48 * HOUR }); this.ownerMail(id, 'cost', 'Printful’s draft costs ' + cost + ' against our ' + est + ': confirm (merch.sh confirm) or refund.'); }
      else if (x.status === 'held') Object.assign(cols, { status: 'paid', hold: null, why: null, hold_at: null, next_try_at: now });
      else cols.next_try_at = Math.max(now, (x.cancel_until || now) + GRACE);
      this.set(id, cols);
    });
  }
  // the wholesale charge, only after the hour + grace, only in live mode, never for a stopped order (T2.1-12, T2.2-38, T2.2-40, T2.2-55)
  async confirmOrder(o0, stale) {
    const id = o0.id, now = this.now();
    if (!stale && !this.live()) return this.tx(() => { const x = this.order(id); if (x.status === 'paid' || (x.status === 'held' && ['wallet', 'provider'].includes(x.hold))) { this.set(id, { status: 'held', hold: 'draft_mode', why: null, hold_at: now }); this.next(id, null); } });
    const po = this.tx(() => {
      const x = this.order(id);
      if (!x || !x.provider_order || x.cancel_until == null || now < x.cancel_until + GRACE) return null;
      if (!stale && (this.stopped(x) || x.draft_del)) return null;
      const from = stale ? ['confirming'] : x.status === 'held' && ['wallet', 'provider'].includes(x.hold) ? ['held'] : ['paid'];
      return this.set(id, { status: 'confirming', next_try_at: now + 2 * MIN }, from) ? x.provider_order : null; // written before the call
    });
    if (!po) return;
    if (stale) { // the result of an earlier confirm is unknown: Printful's order says what happened (N4: failed / canceled are not "confirmed")
      const g = await provider.get(this.env, po);
      if (!g.ok || !g.data) return; // stays confirming; the wake tries again
      if (PF_CONFIRMED.includes(g.data.status)) return this.confirmed(id);
      if (g.data.status !== 'draft') return this.tx(() => { if (this.set(id, { status: 'held', hold: 'review', why: 'confirm_' + g.data.status, hold_at: now, next_try_at: now + DAY }, ['confirming'])) this.ownerMail(id, 'review', 'Printful says the order is ' + g.data.status + ' after a confirm we did not hear back from.'); });
    }
    const r = await provider.confirm(this.env, po);
    if (r.ok) return this.confirmed(id);
    if (r.kind === 'timeout') return; // stays 'confirming': the alarm re-reads it after 2 minutes
    if (r.kind === 'billing') return this.tx(() => { const x = this.order(id); if (this.set(id, { status: 'held', hold: 'wallet', hold_at: x.hold_at || now, next_try_at: now + 30 * MIN }, ['confirming'])) this.ownerMail(id, 'wallet', 'Printful could not charge the wallet. Please top it up.'); });
    if (r.kind === 'down' || r.kind === 'not_set_up') return this.tx(() => { const x = this.order(id); if (x.status === 'confirming') this.backoff(x); });
    return this.tx(() => { if (this.set(id, { status: 'held', hold: 'review', why: 'confirm_' + r.kind, hold_at: now, next_try_at: now + DAY }, ['confirming'])) this.ownerMail(id, 'review', 'Printful refused the confirm.'); });
  }
  confirmed(id) {
    this.tx(() => {
      const x = this.order(id); if (!x) return;
      if (!x.confirmed_at) this.run('update merch_orders set confirmed_at = ? where id = ?', this.now(), id); // charged at Printful, whatever happened meanwhile
      this.run("update merch_order_items set status = 'confirmed' where order_id = ? and status = 'drafted'", id);
      if (!this.set(id, { status: 'confirmed', hold: null, why: null, hold_at: null, tries: 0, next_try_at: null }, ['confirming'])) this.event('x:confirmed_late:' + id, id, 'confirmed_late', x.status); // a Dashboard refund came in meanwhile (its owner email went)
    });
  }
  async staleOpen(o) { // T2.2-27: no expired event came
    const g = await stripe.getSession(this.env, o.stripe_session);
    if (!g.ok || !g.data) return this.tx(() => this.next(o.id, this.now() + 10 * MIN));
    if (g.data.status === 'expired') return this.tx(() => this.expire(o.id));
    if (g.data.status === 'complete' && g.data.payment_status === 'paid') return this.paidFrom(o.id, g.data, 'x:missed:' + o.id);
    return this.tx(() => { if (this.order(o.id).status === 'open') this.next(o.id, this.now() + HOUR); });
  }

  /* ---------------- reprints (T2.1-23, T2.2-44, T2.2-45) ---------------- */
  reshipLines(o) { const ps = this.q('select id from merch_parcels where order_id = ? and returned_at is not null', o.id).map((p) => p.id); return this.lines(o.id).filter((l) => ps.includes(l.parcel_id) && !['replaced', 'cancelled', 'void', 'rejected'].includes(l.status) && l.refunded_qty < l.qty); }
  // new line rows (101, 102 ...) from the stored PNGs (or a re-render with the same art_ver); a Printful order <order>-r<n>, confirmed at once (live only)
  async reprint(o, lineNums, providerOrder, rec, why, leased) {
    const res = this.tx(() => {
      const x = this.order(o.id);
      if (this.stopped(x)) return { error: 'not_allowed', status: 409 }; // M4: never for a refunded, cancelled or disputed order
      if (!['part_shipped', 'shipped', 'confirmed'].includes(x.status) && x.hold !== 'reship') return { error: 'not_allowed', status: 409 };
      const all = this.lines(x.id), pick = all.filter((l) => lineNums.includes(l.line) && !['replaced', 'void', 'cancelled', 'rejected'].includes(l.status) && l.refunded_qty < l.qty);
      if (!pick.length || pick.length !== new Set(lineNums).size) return { error: 'bad_lines', status: 400 };
      const n = Number(this.one('select count(*) as n from merch_reprints where order_id = ?', x.id).n) + 1, rid = x.id + '-r' + n;
      let next = 100 + all.filter((l) => l.line > 100).length, gone = false;
      for (const l of pick) {
        next++; const q = l.qty - l.refunded_qty, st = providerOrder ? 'confirmed' : l.file_key ? 'ready' : 'queued'; if (st === 'queued') gone = true;
        this.run(`insert into merch_order_items (order_id, line, product, colour, size, pose, name_on, qty, name, recipe, print_link, art_ver, unit, line_total, line_tax, cost_est, provider_variant, status,
          file_key, file_sha, file_bytes, rendered_at, renderer, reprint_of, rp, refunded_qty, refunded) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0)`,
          x.id, next, l.product, l.colour, l.size, l.pose, l.name_on, q, l.name, l.recipe, l.print_link, l.art_ver, l.unit, Math.round((l.line_tax || 0) * q / l.qty), l.cost_est, l.provider_variant,
          st, l.file_key, l.file_sha, l.file_bytes, l.rendered_at, l.renderer, l.line, n);
        this.setLine(x.id, l.line, { status: 'replaced' });
      }
      this.run('insert into merch_reprints (id, order_id, n, provider_order, status, created_at, why) values (?, ?, ?, ?, ?, ?, ?)', rid, x.id, n, providerOrder || null, providerOrder ? 'attached' : 'queued', this.now(), why || 'owner');
      const cols = { next_try_at: this.now() };
      if (x.status === 'shipped' || x.status === 'confirmed') cols.status = 'part_shipped';
      if (why === 'reship') { cols.hold = null; cols.hold_at = null; }
      this.set(x.id, cols);
      this.event('x:reprint:' + rid, x.id, 'reprint', why || 'owner');
      return { rid, n, gone };
    });
    if (res.error) return res;
    if (rec && !res.gone) this.mem.set(res.rid, rec); // question 16: a file to redraw first: the buyer is asked for the address again after it
    if (!providerOrder && (leased || this.tx(() => this.claim(o.id)))) { try { await this.workReprints(this.order(o.id)); } finally { if (!leased) this.unlease(o.id); } }
    await this.flush();
    return { ok: true, reprint: res.rid, ask_again: !!(rec && res.gone) || undefined };
  }
  // a reprint stopped before it was made: the reprint lines are cancelled and the old lines carry on as they were
  undoReprint(rp) {
    for (const l of this.lines(rp.order_id).filter((x) => x.rp === rp.n)) {
      if ((LINE_RANK[l.status] || 0) < LINE_RANK.shipped && !DEAD.includes(l.status)) this.setLine(rp.order_id, l.line, { status: 'cancelled' });
      const old = this.lineRow(rp.order_id, l.reprint_of); if (old && old.status === 'replaced') this.setLine(rp.order_id, old.line, { status: old.parcel_id ? 'shipped' : 'confirmed' });
    }
  }
  async workReprints(o0) {
    const id = o0.id;
    const rp = this.one("select * from merch_reprints where order_id = ? and status = 'queued' order by n limit 1", id); if (!rp) return false;
    const still = () => { const x = this.order(id), y = this.one('select * from merch_reprints where id = ?', rp.id); return !this.stopped(x) && y && y.status === 'queued' ? x : null; };
    const stop = (draftId) => this.tx(() => { // M4 / rule 3: refunded or cancelled: the reprint is dropped; in a dispute it waits for the owner (no printer call made yet)
      const x = this.order(id), y = this.one('select * from merch_reprints where id = ?', rp.id); if (!y) return;
      if (!['queued', 'need_address'].includes(y.status)) { // already stopped (by the refund itself) while its draft was being made: that draft is deleted too
        if (draftId && !y.provider_order) { this.run("update merch_reprints set status = 'drop', provider_order = ? where id = ?", draftId, rp.id); this.fx.push({ t: 'droprp', order: id }); this.next(id, this.now()); }
        return;
      }
      const st = draftId ? 'drop' : ENDED.includes(x.status) ? 'cancelled' : 'held';
      this.run('update merch_reprints set status = ?, provider_order = coalesce(?, provider_order) where id = ?', st, draftId || null, rp.id);
      if (st !== 'held') this.undoReprint(rp);
      if (st === 'drop') this.fx.push({ t: 'droprp', order: id });
      this.ownerMail(id, 'reprint_stopped', 'The reprint ' + rp.id + ' was ' + (st === 'held' ? 'paused by a dispute (merch.sh confirm releases it after)' : 'stopped: the order was refunded, cancelled or disputed') + '.');
      this.next(id, this.now());
    });
    let o = still(); if (!o) { stop(null); return true; }
    const L = this.lines(id).filter((l) => l.rp === rp.n);
    const q = L.find((l) => l.status === 'queued'); if (q) { await this.renderLine(o, q); return true; }
    if (!this.live()) { // M3: nothing is confirmed at the printer unless live: the reprint waits (no printer call at all)
      this.tx(() => { if (this.q("update merch_reprints set status = 'held' where id = ? and status = 'queued' returning id", rp.id).length) { this.ownerMail(id, 'reprint_held', 'MERCH_PROVIDER_MODE is not live, so the reprint ' + rp.id + ' waits (merch.sh confirm releases it once live).'); this.next(id, null); } });
      return true;
    }
    let recipient = this.mem.get(rp.id) || null;
    if (rp.why === 'reship' && !recipient) { // question 16, N9: never the address that bounced, never the old session's: ask the buyer again
      this.tx(() => { const t = this.now(); if (!this.q("update merch_reprints set status = 'need_address' where id = ? and status = 'queued' returning id", rp.id).length) return; this.set(id, { hold: 'reship', hold_at: t, next_try_at: t + 7 * DAY }); this.buyerMail(id, 'address', 'me_' + id + '_address_' + rp.id); });
      return true;
    }
    if (!recipient) { const g = await stripe.getSession(this.env, o.stripe_session); if (!g.ok || !g.data) { this.tx(() => this.next(id, this.now() + 15 * MIN)); return true; } recipient = recipientOf(g.data); }
    if (!still()) { stop(null); return true; }
    const ex = await provider.get(this.env, rp.id); // GET before create
    let d = ex.ok && ex.data && ex.data.status !== 'canceled' ? ex.data : null;
    if (!d && !ex.ok && ex.kind !== 'not_found') { this.tx(() => this.next(id, this.now() + 15 * MIN)); return true; }
    if (!d) {
      if (!(o = still())) { stop(null); return true; }
      const urls = {}; for (const l of L) urls[l.line] = await this.fileUrl(l.file_key);
      const r = await provider.createDraft(this.env, o, L, recipient, urls, rp.id);
      if (!r.ok) {
        if (r.kind === 'address' && rp.why === 'reship') { this.mem.delete(rp.id); this.tx(() => { const t = this.now(); this.run("update merch_reprints set status = 'need_address' where id = ? and status = 'queued'", rp.id); this.set(id, { hold: 'reship', hold_at: t, next_try_at: t + 7 * DAY }); this.buyerMail(id, 'address', 'me_' + id + '_address_' + rp.id + '_' + t); }); }
        else this.tx(() => this.next(id, this.now() + 15 * MIN));
        return true;
      }
      d = r.data;
    }
    if (!still()) { stop(d.id); return true; } // a refund or a dispute during the calls: the draft is deleted, never confirmed
    const c = d.status === 'draft' ? await provider.confirm(this.env, d.id) : { ok: true }; // confirmed at once: no cooling hour, no charge to the buyer
    this.tx(() => {
      const t = this.now();
      if (!c.ok) { this.run('update merch_reprints set provider_order = ? where id = ?', d.id, rp.id); return this.next(id, t + 15 * MIN); }
      this.run("update merch_reprints set provider_order = ?, status = 'confirmed' where id = ?", d.id, rp.id);
      for (const l of L) this.setLine(id, l.line, { status: 'confirmed', provider_item: rp.id + '_' + l.line });
      this.mem.delete(rp.id);
      const z = this.order(id);
      if (this.stopped(z)) this.ownerMail(id, 'reprint_after_stop', 'The reprint ' + rp.id + ' was confirmed at Printful just as the order was refunded or disputed: cancel it in the Printful dashboard if you can.');
      else this.buyerMail(id, 'reprint', 'me_' + id + '_reprint_' + rp.n);
      this.next(id, t);
    });
    return true;
  }

  /* ---------------- deletion on request (TRANSACTIONS 5, S13) ---------------- */
  // clears the buyer data we hold (email hash, dog name, recipe, print link, the print PNGs, tracking links) of ended orders; the money rows stay
  async forget(ids) {
    const out = { forgotten: [], waiting: [], printful: [] };
    for (const id of ids) {
      const o = this.order(id); if (!o) continue;
      if (!['shipped', 'cancelled', 'refunded', 'expired'].includes(o.status) || o.dispute === 'open') { out.waiting.push({ id, status: o.status, dispute: o.dispute || null }); continue; }
      this.tx(() => {
        for (const k of this.q('select distinct file_key from merch_order_items where order_id = ? and file_key is not null', id)) this.run('insert or ignore into merch_trash (key, at) values (?, ?)', k.file_key, this.now());
        this.run('update merch_orders set email_hash = null where id = ?', id);
        this.run('update merch_order_items set name = null, recipe = null, print_link = null, file_key = null where order_id = ?', id);
        this.run('update merch_parcels set tracking_url = null where order_id = ?', id);
        this.event('x:forget:' + id + ':' + this.now(), id, 'forgotten', 'on request');
      });
      out.forgotten.push(id);
      const pos = [this.order(id).provider_order].concat(this.q('select provider_order from merch_reprints where order_id = ?', id).map((r) => r.provider_order)).filter(Boolean);
      if (pos.length || o.confirmed_at) out.printful.push({ id, provider_orders: pos });
    }
    await this.emptyTrash();
    return out;
  }
  async emptyTrash() { // print files on their way out (the line no longer points at them, so nothing can use a file that is being deleted)
    for (const t of this.q('select key from merch_trash order by at limit 200')) {
      const shard = t.key.split('~')[0];
      let r; try { r = await this.env.PRINTS.get(this.env.PRINTS.idFromName(shard)).fetch('https://prints/del?key=' + encodeURIComponent(t.key), { method: 'POST' }); } catch (e) { rethrow(e); continue; }
      if (!r.ok) continue;
      const j = await r.json();
      this.tx(() => { this.run('delete from merch_trash where key = ?', t.key); if (!j.files) this.run('delete from merch_shards where name = ?', shard); else this.run('update merch_shards set files = ? where name = ?', j.files, shard); });
    }
  }

  /* ---------------- the cron: backstop and the nightly job (6.5, 3.3, 5) ---------------- */
  async cron() {
    const now = this.now(), day = jstDay(now); let nightly = false;
    this.tx(() => this.run('delete from merch_rate where reset_at <= ?', now)); // N2: rate rows go within the hour (the cron runs every 10 minutes)
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
    this.tx(() => { this.setMeta('report', JSON.stringify(rep)); this.ownerMail(null, 'report', JSON.stringify(rep).slice(0, 4000)); }); // its key carries the JST day (S7)
    await this.flush();
    return rep;
  }
  // TRANSACTIONS 5 retention (T2.1-33)
  async tidy(now) {
    // a file goes when no line that uses it (a reprint copies the key) needs it any more
    const keys = this.q('select file_key as k from merch_order_items where file_key is not null group by file_key having max(coalesce(keep_until, 9e15)) <= ?', now).map((r) => r.k);
    // storage over 4 GB: also the oldest files of orders shipped more than 60 days ago with no open dispute (6.6)
    const total = Number(this.one('select coalesce(sum(bytes), 0) as b from merch_shards').b);
    if (total > Number(this.env.MERCH_STORE_SOFT || 4 * 2 ** 30)) {
      keys.push(...this.q("select i.file_key as k from merch_order_items i join merch_orders o on o.id = i.order_id join merch_parcels p on p.id = i.parcel_id where i.file_key is not null and p.shipped_at < ? and coalesce(o.dispute, '') != 'open' order by p.shipped_at limit 200", now - 60 * DAY).map((r) => r.k));
      this.tx(() => this.ownerMail(null, 'storage', 'Print storage is over 4 GB' + (total > 4.5 * 2 ** 30 ? ': time for Workers Paid' : '')));
    }
    this.tx(() => { for (const k of new Set(keys)) { this.run('update merch_order_items set file_key = null where file_key = ?', k); this.run('insert or ignore into merch_trash (key, at) values (?, ?)', k, now); } });
    await this.emptyTrash();
    this.tx(() => {
      const old = now - 730 * DAY; // buyer data and the dog: 24 months after close
      const closed = this.q("select id from merch_orders where status in ('shipped', 'cancelled', 'refunded', 'expired') and max(coalesce(refunded_at, 0), coalesce(updated_at, 0), coalesce((select max(shipped_at) from merch_parcels p where p.order_id = merch_orders.id), 0)) < ? and (email_hash is not null or exists (select 1 from merch_order_items i where i.order_id = merch_orders.id and i.recipe is not null))", old);
      for (const c of closed) { this.run('update merch_orders set email_hash = null where id = ?', c.id); this.run('update merch_order_items set name = null, recipe = null, print_link = null where order_id = ?', c.id); }
      this.run('delete from merch_events where at < ?', now - 90 * DAY);
      this.run("delete from merch_outbox where status in ('sent', 'failed') and created_at < ?", now - 90 * DAY);
      this.run("delete from merch_meta where k glob 'w:*' and k < ?", 'w:' + jstDay(now - 40 * DAY));
      for (const e of this.q("select id from merch_orders where status = 'expired' and created_at < ?", now - 30 * DAY)) { this.run('delete from merch_order_items where order_id = ?', e.id); this.run('delete from merch_orders where id = ?', e.id); }
      this.run('delete from merch_rate where reset_at <= ?', now);
    });
  }
  report() {
    const now = this.now(), day = jstDay(now);
    let bytes = null; try { bytes = this.sql.databaseSize != null ? Number(this.sql.databaseSize) : null; } catch (e) { bytes = null; }
    return { at: now, day,
      held: this.q("select id, hold, why, hold_at from merch_orders where status = 'held'"),
      draft_mode: this.q("select id from merch_orders where status = 'held' and hold = 'draft_mode'").map((r) => r.id),
      // M2: anything that should have a wake and has none (should always be empty)
      stranded: this.q("select id, status, hold from merch_orders where next_try_at is null and (status in ('paid', 'confirming') or (status = 'held' and hold in ('render', 'address', 'wallet', 'review') ) or (status = 'held' and hold = 'provider' and coalesce(why, '') != 'onhold'))")
        .concat(this.q("select id, 'refund' as status, null as hold from merch_refunds where status = 'sending' and next_try_at is null")),
      unassigned_refunds: this.q("select id, order_id, amount from merch_refunds where line is null and id like 's:%'"),
      disputes: this.q('select id, dispute, disputed_at from merch_orders where dispute is not null'),
      refund_failed: this.q('select id from merch_orders where refund_failed = 1').map((r) => r.id),
      mail_failed: this.q("select id, order_id, kind, last_error from merch_outbox where status = 'failed' and created_at > ?", now - 30 * DAY),
      reprints_waiting: this.q("select id, order_id, status from merch_reprints where status in ('held', 'need_address', 'drop')"),
      margin_low: this.q("select order_id, note from merch_events where type = 'margin_low'"),
      orders_today: this.q("select country, count(*) as n, sum(total) as total from merch_orders where day = ? and status != 'expired' group by country", day),
      sales_12m: this.q('select country, count(*) as n, sum(total - refunded) as net from merch_orders where paid_at > ? group by country order by net desc limit 20', now - 365 * DAY),
      variants_off: this.q('select id from merch_variants where on_flag = 0').map((r) => r.id),
      storage: { bytes: Number(this.one('select coalesce(sum(bytes), 0) as b from merch_shards').b), shards: Number(this.one('select count(*) as n from merch_shards').n) },
      ledger: { bytes, writes_today: Number(this.meta('w:' + day) || 0), writes_free_a_day: 100000 } }; // S11: the ledger's own storage and write budget
  }
}
