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
import { nowOf, jstDay, jstHour, nextUtcMidnight, addBusinessDays, json, fail, sha256hex, hmacHex, hex, orderId, ORDER_ID, pngSize, MIN, HOUR, DAY, GRACE, siteOf } from './util.js';
import { buildCatalog, ZONES, zoneOf, regionOf, variantId, ALL_COUNTRIES, PRODUCTS as CATP, SHIP_BY_DAYS, LATE_MORE_DAYS, LATE_MAX_DAYS } from './catalog.js';
import { checkBasket, priceBasket, marginOf, quoteOut, catalogOut, openCountries, fromOpen, productsOn, taxBehavior, withArtVer } from './lines.js';
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
// Browser Run (part 4, PART4.md): our own budget of billed browser time a UTC day (Free: 600 000 ms; MERCH_BROWSER_BUDGET_MS overrides), and the
// number of unknown 429s in a row (each 11 s or more apart, so never the 1-per-10-s rate) after which the day is called out for an hour
// ERROR_RUN (review finding 4): browser errors in a row (timeouts, throws, unknown answers, bad files) after which the browser is off for an hour
// and the fallback draws at once, instead of two browser calls and a minute for every line. Any good answer resets the run.
const BROWSER_BUDGET_MS = 540e3, RATE_RUN = 3, ERROR_RUN = 3;
const utcDay = (t) => new Date(t).toISOString().slice(0, 10);
const browserLine = (b) => !b ? '' : 'Browser Run (UTC day): ' + Math.round(b.ms_today / 1000) + ' s used of our ' + Math.round(b.budget_ms / 1000) + ' s budget (Free: 600 s), yesterday ' + Math.round(b.ms_yesterday / 1000) + ' s' + (b.off ? '; out now (' + b.off + '): the resvg fallback draws the prints' : '')
  + (b.parts ? '; set up: browser ' + (b.parts.via === 'worker' ? 'via the Worker (SELF ' + (b.parts.self ? 'yes' : 'MISSING') + ')' : b.parts.browser ? 'yes' : 'MISSING') + ', fallback RENDER ' + (b.parts.fallback ? 'yes' : 'MISSING') : ''); // review finding 7
// the buyer emails that may carry the thank-you gift once it is shown (the first one sent after the cancel hour; once only: gift_mailed)
const GIFT_KINDS = ['ship', 'reprint', 'late', 'late_again'];
// the order statuses in which a reserved gift is shown once the cancel hour is over and the order is drafted at the printer (part 9, review m2:
// at or past 'confirming', never a 'paid' order still rendering or without a draft; a held order only once it was confirmed, or draft_mode,
// which stands for "printing has started" in a world that never prints)
const GIFT_ON = ['confirming', 'confirmed', 'part_shipped', 'shipped'];
// part 9 (review B1): never refund blind. Before an automatic step that depends on what was posted (the delay email, the automatic refund of a
// late part, the 24-hour refund of an order Printful failed, cancelled or did not answer a confirm for) the order is read from the printer and
// what it says applied first. A read that fails pushes the step back PF_RETRY; the owner hears once when the reads have failed for PF_TELL.
// The daily re-read (cron) reads every confirmed or part-shipped order at least once a day, PF_READS_CRON a run (the cron runs every 10
// minutes: up to 720 orders a day, 2 calls each); an alarm makes at most PF_READS_TICK reads (Printful's limit: 120 calls a minute).
const PF_RETRY = 15 * MIN, PF_TELL = DAY, PF_READS_TICK = 10, PF_READS_CRON = 5;

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
  ['merch_order_items', 'store_tries', 'integer default 0'], ['merch_reprints', 'why', 'text'],
  // part 6 review batch (25 Nov 2026): the delay plan (late_eta: the new date of the first delay email; late_ok_at: the buyer said keep
  // waiting; late2_sent_at: the second notice went; late_auto_at: the late part was refunded by itself), the gift (gift_shown_at: shown on the
  // order page; gift_mailed: the outbox row that carries it, once), render rejects told in one email (told)
  ['merch_orders', 'late_eta', 'integer'], ['merch_orders', 'late_ok_at', 'integer'], ['merch_orders', 'late2_sent_at', 'integer'], ['merch_orders', 'late_auto_at', 'integer'],
  ['merch_orders', 'gift_shown_at', 'integer'], ['merch_orders', 'gift_mailed', 'text'], ['merch_refunds', 'told', 'integer default 0'],
  // part 9 code review batch: the printer re-read (pf_read_at: the last good read; pf_read_fail: when the reads started failing, null once one
  // works; pf_wait: no automatic late step before this time), how many times a refund row was sent to Stripe (sent_n: a full refund is capped at
  // what is left on the charge before its first send only), and the last daily read of a reprint's Printful order (read_at)
  ['merch_orders', 'pf_read_at', 'integer'], ['merch_orders', 'pf_read_fail', 'integer'], ['merch_orders', 'pf_wait', 'integer'],
  ['merch_refunds', 'sent_n', 'integer default 0'], ['merch_reprints', 'read_at', 'integer']];

let PAWPRINT = null; // loaded once per object, lazily: about 30 ms of CPU, so never in the front Worker (Free: 10 ms a request)
async function loadPawPrint(env) {
  if (env.PAWPRINT) return env.PAWPRINT;
  if (!PAWPRINT) { const m = await import('../../merch/dist/pawprint.js'); PAWPRINT = m.default || m; }
  return PAWPRINT;
}
let SAMPLES = null; // the built-in sample dogs (merch/sample_dogs.js), for the render self-test only; loaded on its first use
async function loadSamples(P) {
  if (!SAMPLES) { const m = await import('../../merch/sample_dogs.js'); SAMPLES = (m.default || m)(P); }
  return SAMPLES;
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
    this.pfMemo = new Map(); this.pfReads = 0; // part 9: a printer read kept for the rest of one step (work); the reads made in this alarm
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
    if (ch && ('next_try_at' in cols || 'status' in cols || 'hold' in cols || 'dispute' in cols || 'late_sent_at' in cols)) this.lateWake(id);
    if (ch && cols.status === 'paid') this.giveGift(id); // part 6: the thank-you gift is reserved when the order becomes paid (also a held order released later)
    if (ch && (cols.status === 'cancelled' || cols.status === 'refunded')) this.giftBack(id); // review finding 2: an unseen gift goes back to the pool
    if (ch) this.giftShow(id); // and it is shown once the cancel hour is over (the same transaction that moves the order on)
    return ch;
  }
  setLine(id, line, cols) { const k = Object.keys(cols); this.run('update merch_order_items set ' + k.map((c) => c + ' = ?').join(', ') + ' where order_id = ? and line = ?', ...k.map((c) => cols[c]), id, line); }
  next(id, t) { this.run('update merch_orders set next_try_at = ? where id = ?', t, id); this.lateWake(id); this.giftShow(id); }
  // S10 and the delay plan (part 6 review): an order that may still be late keeps a wake at its next delay step, whatever it waits for (held
  // orders too; never in a dispute hold): at ship_by the first delay email, at late_eta the second notice or the refund of the late part
  lateWake(id) {
    const o = this.order(id), d = this.lateDue(o);
    if (d != null && (o.next_try_at == null || o.next_try_at > d)) this.run('update merch_orders set next_try_at = ? where id = ?', d, id);
  }
  // a line that can be late: live, not posted, not all refunded, and not a free reprint (a reprint is not the order we promised to post)
  lateLine(l) { return this.unshipped(l) && l.reprint_of == null; }
  // when the next delay step is due, or null. The second step never runs while a confirm is in flight (confirming: its own wake comes back
  // within minutes). Part 9 (review M1): no step at all while a dispute is open or after it was lost (the bank decides the money; a late
  // cancel would be refused then); a dispute won (or closed any other way but lost) lets the steps go on. pf_wait: a printer read that failed
  // pushed the step back (B1).
  lateDue(o) {
    if (!o || !o.ship_by || !LATE_ST.includes(o.status) || o.hold === 'dispute' || o.dispute === 'open' || o.dispute === 'lost') return null;
    let due = null;
    if (!o.late_sent_at) due = o.ship_by;
    else if (!o.late2_sent_at && !o.late_auto_at && o.late_eta && o.status !== 'confirming') due = o.late_eta;
    if (due == null) return null;
    if (!this.lines(o.id).some((l) => this.lateLine(l))) return null;
    return o.pf_wait && o.pf_wait > due ? o.pf_wait : due;
  }
  // part 9 (B1): does Printful have this order past its draft (or may it: a confirm we heard no clear answer to)? Then what it says comes first.
  needRead(o) { return !!(o && o.provider_order && (o.confirmed_at || /^confirm_/.test(o.why || ''))); }
  // the order's lease: a step that calls the printer or the renderer takes it first, and leaves a wake behind (M2). Sync: inside tx().
  claim(id) { const now = this.now(); return this.q('update merch_orders set lease_until = ?, next_try_at = ? where id = ? and (lease_until is null or lease_until <= ?) returning id', now + LEASE, now + WAKE, id, now).length > 0; }
  unlease(id) { try { this.tx(() => this.run('update merch_orders set lease_until = null where id = ?', id)); } catch (e) { rethrow(e); } }
  // rule 3. Second review (R2-M4): a lost dispute stops the order too (the bank already paid the buyer back: no reprint, no reship)
  stopped(o) { return !o || ENDED.includes(o.status) || o.dispute === 'open' || o.dispute === 'lost' || o.hold === 'dispute'; }
  // second review (R2-m1): what a Printful read made outside a transaction is checked against. If the order changed while the read was out
  // (a hint put it on hold, a dispute came, a cancel), the read may be older than what we hold now: it is not applied, the step reads again
  pfSnap(o) { return o ? [o.updated_at, o.status, o.hold, o.why, o.dispute, o.provider_order, o.pcancel, o.draft_del].join('|') : ''; }
  // second review (R2-M2): the delay steps wait while a dispute is open or holds the order; when they go on again, the new date moves on by
  // the time they waited, so a dispute never uses up the buyer's waiting time or our printing time. Sync, inside tx()
  lateResume(id, since) {
    const o = this.order(id), now = this.now();
    if (!o || !o.late_sent_at || !o.late_eta || o.late2_sent_at || o.late_auto_at || !since || now <= since) return;
    this.run('update merch_orders set late_eta = ? where id = ?', o.late_eta + (now - since), id);
    this.event('x:late_resume:' + id + ':' + now, id, 'late_resume', String(now - since));
    this.lateWake(id);
  }
  unshipped(l) { return !DEAD.includes(l.status) && (LINE_RANK[l.status] || 0) < LINE_RANK.shipped && l.refunded_qty < l.qty; }
  // an event row; false when it was there already (the same delivery twice)
  event(eid, orderId, type, note) { return this.q('insert into merch_events (id, order_id, type, at, note) values (?, ?, ?, ?, ?) on conflict(id) do nothing returning id', eid, orderId || null, String(type || '').slice(0, 60), this.now(), note == null ? null : String(note).slice(0, 300)).length > 0; }
  // the outbox (S7): a row per email, in the caller's transaction; sent after commit; at most one owner email per order, reason and JST day
  ownerMail(orderId, reason, note) {
    const id = 'o:' + (orderId || '-') + ':' + reason + ':' + jstDay(this.now()), now = this.now();
    if (this.q("insert into merch_outbox (id, order_id, who, kind, note, status, tries, next_try_at, created_at) values (?, ?, 'owner', ?, ?, 'queued', 0, ?, ?) on conflict(id) do nothing returning id", id, orderId || null, reason, note == null ? null : String(note).slice(0, 4000), now, now).length) this.fx.push({ t: 'mail', id });
  }
  // key: the Idempotency-Key (me_<order>_<kind>[_n]); the address is never stored: read from the Stripe session at send time. about: what the email
  // is about (part 6: { parcel } | { refund, reason } | { refunds, reason } | { line, refund } | { reprint } | { reship }), kept in the row's note as
  // ids only (never buyer data or a gift code); the facts themselves are read from the order when the email is sent.
  buyerMail(orderId, kind, key, to, about) {
    const now = this.now(), note = about ? JSON.stringify(about).slice(0, 1000) : null;
    if (this.q("insert into merch_outbox (id, order_id, who, kind, note, status, tries, next_try_at, created_at) values (?, ?, 'buyer', ?, ?, 'queued', 0, ?, ?) on conflict(id) do nothing returning id", key, orderId, kind, note, now, now).length) { if (to) this.mem.set(key, to); this.fx.push({ t: 'mail', id: key }); }
  }
  /* ---------------- the thank-you gift (part 6; TRANSACTIONS 10 point 5): one cosmetic game code per order, from merch_gift_pool ---------------- */
  // Sync, inside the caller's transaction (set() calls it when an order becomes paid). An empty pool: no gift, never an error. A cancelled or
  // refunded order keeps the code it was given. The code is never logged, put in an event, the report or the admin export.
  // Review finding 2 (25 Nov 2026): the code is RESERVED here (hidden: the order answer says gift: 'soon'), SHOWN by giftShow() once the cancel
  // hour is over, and a cancel or a full refund before that puts it back in the pool (giftBack), all in the transaction of the change. So
  // "order, cancel within the hour" never takes a code; once shown, the order keeps it whatever happens (a gift is a gift).
  giveGift(id) {
    const o = this.order(id); if (!o || o.gift_code || o.status !== 'paid') return;
    const g = this.one('update merch_gift_pool set order_id = ?, claimed_at = ? where rowid = (select rowid from merch_gift_pool where order_id is null order by rowid limit 1) returning code', id, this.now());
    if (g) this.run('update merch_orders set gift_code = ?, gift_shown_at = null, gift_mailed = null where id = ?', g.code, id);
    this.giftCheck();
  }
  // shown when the order is past its cancel hour (cancel_until + the grace: exactly when a cancel stops being taken) and going on
  giftShow(id) {
    const o = this.order(id); if (!o || !o.gift_code || o.gift_shown_at || o.cancel_until == null || this.now() < o.cancel_until + GRACE) return;
    if (!o.provider_order && !o.confirmed_at) return; // part 9 (m2): drafted at the printer first
    const on = GIFT_ON.includes(o.status) || (o.status === 'held' && (o.hold === 'draft_mode' || (!!o.confirmed_at && o.hold !== 'dispute')));
    if (!on || o.dispute === 'open' || o.dispute === 'lost') return;
    this.run('update merch_orders set gift_shown_at = ? where id = ? and gift_shown_at is null', this.now(), id);
  }
  // a reserved code that was never shown goes back to the pool (the order ended before its hour was over, or was never made)
  giftBack(id) {
    const o = this.order(id); if (!o || !o.gift_code || o.gift_shown_at) return;
    this.run('update merch_gift_pool set order_id = null, claimed_at = null where code = ? and order_id = ?', o.gift_code, id);
    this.run('update merch_orders set gift_code = null, gift_mailed = null where id = ?', id);
  }
  giftCounts() { const r = this.one('select count(*) as n, count(order_id) as c from merch_gift_pool'); return { left: Number(r.n) - Number(r.c), claimed: Number(r.c) }; }
  // one owner email a day while fewer than 10 are left, and when it is empty (only once a pool was filled: no codes at all = no gift, by choice)
  giftCheck() {
    const c = this.giftCounts(); if (!(c.left + c.claimed)) return;
    if (c.left === 0) this.ownerMail(null, 'gift_empty', c.claimed + ' codes given, none left.');
    else if (c.left < 10) this.ownerMail(null, 'gift_low', c.left + ' codes left (' + c.claimed + ' given).');
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
      const mm = /^\/merch\/order\/([^/]+)(?:\/(cancel|address|refund|wait))?$/.exec(p);
      if (mm) return await this.rOrder(req, mm[1], mm[2] || null, m, ip);
      return fail('not_found', 404);
    } finally { await this.flush(); this.saveWrites(); await this.arm(); }
  }
  async body(req) { const t = await req.text(); if (t.length > 65536) return null; try { const o = JSON.parse(t || '{}'); return o && typeof o === 'object' ? o : null; } catch (e) { return null; } }

  // TRANSACTIONS 6.3 and its note of 24 Nov 2026: countries {code, zone, soon} (never-countries left out, no names), notes as codes, no free text
  // (the shape is lines.js catalogOut(), which tools/merch_catalog_json.js also uses to write the page's stand-in catalog)
  rCatalog() {
    const now = this.now(), g = this.gate();
    return json(catalogOut(this.PP, this.cat, this.env, { off: this.variantOff(), shut: !g.ok, resting: g.why === 'off', sold_out_today: g.ok && this.dayCount(jstDay(now)) >= this.cap(), art_vers: this.served() }));
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
    const site = siteOf(this.env);
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
    if (act === 'wait') return this.rWait(o);
    if (act === 'address') return this.rAddress(o, body);
    if (act === 'refund') {
      const done = this.tx(() => { const x = this.order(o.id); if (!(x.status === 'held' && x.hold === 'address')) return false; this.fullRefund(x, 'address_refund', 'refunded'); return true; });
      if (!done) return fail('not_allowed', 409);
      await this.flush(); return json({ status: 'refunded' });
    }
  }
  // what GET /merch/order/:id shows: never an address, an email or its hash (TRANSACTIONS 5)
  // (part 6 review batch: ship_by, late_eta, late_ok and gift: null | 'soon' | 'ready' are always in the answer; the gift code only once shown)
  page(o) {
    const now = this.now(), L = this.lines(o.id), parcels = this.q('select * from merch_parcels where order_id = ? order by shipped_at', o.id);
    const can = ['paid', 'held'].includes(o.status) && o.hold !== 'dispute' && o.cancel_until != null && now < o.cancel_until + GRACE;
    // part 9 (M1): never "late" (the late cancel offered) while a dispute is open or after it was lost
    const late = !!o.late_sent_at && !ENDED.includes(o.status) && o.dispute !== 'open' && o.dispute !== 'lost' && L.some((l) => this.lateLine(l)), shown = !!(o.gift_code && o.gift_shown_at);
    return { id: o.id, status: o.status, hold: o.hold, pay_pending: !!o.pay_pending, paid_at: o.paid_at, cancel_until: o.cancel_until, can_cancel: can, country: o.country,
      lines: L.map((l) => ({ line: l.line, product: l.product, colour: l.colour, size: l.size, pose: l.pose, name_on: !!l.name_on, name: l.name_on ? l.name : null, qty: l.qty, unit: l.unit,
        status: l.status, refunded_qty: l.refunded_qty, parcel: l.parcel_id, recipe: l.recipe, reprint_of: l.reprint_of })),
      parcels: parcels.map((p) => ({ id: p.id, product: p.product, carrier: p.carrier, tracking_url: p.tracking_url, shipped_at: p.shipped_at, delivered_at: p.delivered_at })),
      totals: { subtotal: o.subtotal, ship_fee: o.ship_fee, tax: o.tax, total: o.total, refunded: o.refunded }, pres: o.pres_currency ? { currency: o.pres_currency, amount: o.pres_amount } : null,
      gift: o.gift_code ? (shown ? 'ready' : 'soon') : null, gift_code: shown ? o.gift_code : null, gift_name: shown ? mail.giftName(this.env) : null,
      ship_by: o.ship_by || null, late: late, late_eta: o.late_eta || null, late_ok: !!o.late_ok_at, resting: this.env.MERCH_OFF === '1' || undefined, dispute: o.dispute || null };
  }
  // "Keep waiting" (the delay plan c): the buyer's yes, recorded once (late_ok_at), only while part of the order is late. Idempotent.
  rWait(o) {
    const x = this.tx(() => {
      const y = this.order(o.id); if (!y || !y.late_sent_at || ENDED.includes(y.status) || !this.lines(y.id).some((l) => this.lateLine(l))) return null;
      if (!y.late_ok_at) { this.set(y.id, { late_ok_at: this.now() }); this.event('x:late_ok:' + y.id, y.id, 'late_ok'); }
      return this.order(y.id);
    });
    if (!x) return fail('not_late', 409);
    return json({ ok: true, late_ok: true, late_eta: x.late_eta || null });
  }
  // the late part refunded in full (the buyer's late cancel, or by itself at late_eta: reason 'late' | 'late_auto'). Sync, inside tx(). One
  // refund row per line and ONE email (refundLines); the printer is asked to cancel when none of its order has shipped (N5), otherwise the owner
  // is told. (An order not confirmed at the printer has nothing posted, so all of it is late: it ends refunded and its draft is deleted by
  // lineRefund.) -> false when nothing is late.
  lateRefund(x, reason) {
    const late = this.lines(x.id).filter((l) => this.lateLine(l)); if (!late.length) return false;
    const now = this.now();
    this.refundLines(x.id, late.map((l) => ({ line: l.line })), reason);
    const y = this.order(x.id), who = reason === 'late_auto' ? 'The late part was refunded by itself (its new date passed and the buyer had not said to keep waiting)' : 'The buyer cancelled the late part';
    if (y.confirmed_at) { // N5: cancel the whole Printful order only when none of it has shipped; otherwise the owner cancels those items by hand
      if (!this.lines(x.id).some((l) => l.parcel_id || (LINE_RANK[l.status] || 0) >= LINE_RANK.shipped)) { this.set(x.id, { pcancel: 1, next_try_at: now }); this.fx.push({ t: 'pcancel', order: x.id }); }
      else this.ownerMail(x.id, 'cancel_late', who + ' (' + late.map((l) => 'line ' + l.line).join(', ') + '). Part of this Printful order has shipped, so please cancel those items in the Printful dashboard if you can.');
    }
    return true;
  }
  async rCancel(o, body) {
    const scope = body.scope === 'late' ? 'late' : 'order';
    if (scope === 'late') { // T2.1-31, S10: the FTC delay cancel, for held orders too (never during a dispute: the bank decides)
      const can = (x) => !!x && !!x.late_sent_at && ['paid', 'held', 'confirmed', 'part_shipped'].includes(x.status) && x.hold !== 'dispute' && x.dispute !== 'open' && x.dispute !== 'lost'; // part 9 (M1): lost too
      // review finding 9: while 'confirming' the printer is being asked to start (a charge in flight, its answer unknown until the call returns or
      // the re-read 2 minutes later): refunding lines then could still print them. So not now, kindly; it takes a minute or two at most.
      const busyNow = (x) => !!x && x.status === 'confirming' && !!x.late_sent_at;
      // Second review (R2-M1): an order Printful has past its draft is read first, and what it says applied in the refund's own transaction,
      // so a part posted with its hint lost is not refunded as well. A read that fails never takes the buyer's right away: the late part is
      // refunded on what we know, Printful is asked to cancel it, and the owner is told at once to check. The order changed while the read was
      // out (R2-m1): read once more; changed again: "try again in a minute".
      let busy = false, r = null;
      for (let n = 0; n < 2 && r == null && !busy; n++) {
        const x0 = this.order(o.id);
        if (busyNow(x0)) { busy = true; break; }
        if (!can(x0)) { r = false; break; }
        let po = null, snap = null, read = null;
        if (this.needRead(x0)) { po = x0.provider_order; snap = this.pfSnap(x0); const g = await provider.get(this.env, po); read = g.ok && g.data ? g.data : null; }
        r = this.tx(() => {
          let x = this.order(o.id);
          if (busyNow(x)) { busy = true; return false; }
          if (!can(x)) return false;
          if (po && read) {
            if (this.pfSnap(x) !== snap) return null;
            this.applyRead(o.id, po, read); x = this.order(o.id);
            if (!can(x)) return false;
          }
          const done = this.lateRefund(x, 'late'); // one email for the whole late part (part 6)
          if (done && po && !read) this.ownerMail(o.id, 'late_cancel_unread', 'The buyer cancelled the late part (' + this.q("select line from merch_refunds where order_id = ? and reason = 'late'", o.id).map((y) => 'line ' + y.line).join(', ') + ') and it was refunded, but Printful could not be read first. Please check the Printful dashboard: if any of it has been posted, cancel what you still can there.');
          return done;
        });
      }
      if (busy || r == null) return fail('busy', 409, { say: busy ? 'We’re sending your order to print right this minute. Please try again in a minute or two.' : 'One moment, please try again.' });
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
  reshipOk(o) { return o.hold === 'reship' && ['part_shipped', 'shipped', 'confirmed'].includes(o.status) && o.dispute !== 'open' && o.dispute !== 'lost'; } // R2-M4: lost too
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
      else if (DEAD.includes(l.status) && l.keep_until == null) cols.keep_until = now + 2 * DAY; // (f) a rejected line's print file goes in 2 days too
      this.setLine(o.id, l.line, cols);
    }
    const cols = { status: to, refunded: o.total || 0, refunded_at: now, next_try_at: now };
    if (to !== 'refunded' || !['part_shipped', 'shipped'].includes(o.status)) cols.hold = null;
    if (o.provider_order && !o.confirmed_at) { cols.draft_del = 1; this.fx.push({ t: 'deldraft', order: o.id }); }
    this.set(o.id, cols);
    this.stopReprints(o.id);
    this.buyerMail(o.id, to === 'cancelled' ? 'cancelled' : 'refunded_all', 'me_' + o.id + '_' + (to === 'cancelled' ? 'cancelled' : 'refund_all'), null, { refund: amount > 0 ? 'mr_' + o.id + '_all_' + Number(this.one('select count(*) as n from merch_refunds where id glob ?', 'mr_' + o.id + '_all_*').n) : null, reason });
  }
  // one line, q of its items (owner, a reject, a late line). Section 4 amounts; the last item left takes the shipping too (T2.1-22). Sync.
  // quiet: the caller sends one email for several lines (refundLines)
  lineRefund(o, l, q, reason, quiet) {
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
    this.setLine(o.id, l.line, Object.assign({ refunded_qty: l.refunded_qty + q, refunded: l.refunded + amount }, DEAD.includes(l.status) && l.keep_until == null ? { keep_until: now + 2 * DAY } : {})); // (f)
    const cols = { refunded: (o.refunded || 0) + amount, refunded_at: now };
    if (after === 0) {
      cols.status = 'refunded'; cols.next_try_at = now;
      if (!['part_shipped', 'shipped'].includes(o.status)) cols.hold = null;
      if (o.provider_order && !o.confirmed_at) { cols.draft_del = 1; this.fx.push({ t: 'deldraft', order: o.id }); }
      for (const x of L) if (!DEAD.includes(x.status) && (LINE_RANK[x.status] || 0) < LINE_RANK.shipped) this.setLine(o.id, x.line, { status: 'cancelled', keep_until: now + 2 * DAY });
      this.deadKeep(o.id, now);
    }
    this.set(o.id, cols);
    if (after === 0) this.stopReprints(o.id);
    if (after > 0 && ['confirmed', 'part_shipped'].includes(o.status)) { // what is left may all be shipped already (a late part refunded)
      const live = this.lines(o.id).filter((x) => !DEAD.includes(x.status) && x.refunded_qty < x.qty);
      if (live.length && live.every((x) => (LINE_RANK[x.status] || 0) >= LINE_RANK.shipped)) this.set(o.id, { status: 'shipped', next_try_at: null });
    }
    // N3. A reject (render, provider) is told by refundLines / tellRejects (one email for the lines rejected together); a refund that leaves
    // nothing is "refunded in full" (part 6: before, an order whose only line could not be rendered got no email at all)
    if (!quiet) this.tellRefunds(o.id, [rid], reason, l.line);
    return { id: rid, amount, last: after === 0 };
  }
  // (f) rejected (or otherwise dead) lines of an order whose print file had no end date: kept 2 more days, then tidy() deletes the file
  deadKeep(id, now) { this.run("update merch_order_items set keep_until = ? where order_id = ? and status in ('rejected', 'void') and keep_until is null", now + 2 * DAY, id); }
  // several lines at once (the late part, a reship that timed out, a lost parcel, lines the printer refused together): one refund row per line,
  // ONE email for them all (review finding 5). Sync.
  refundLines(id, picks, reason) {
    const rids = [], lines = [];
    for (const p of picks) {
      const x = this.order(id); if (!x || x.status === 'refunded') break;
      const l = this.lineRow(id, p.line); if (!l || l.refunded_qty >= l.qty) continue;
      const r = this.lineRefund(x, l, p.q == null ? l.qty - l.refunded_qty : p.q, reason, true); if (r.id) { rids.push(r.id); lines.push(l.line); }
    }
    if (rids.length) this.tellRefunds(id, rids, reason, lines[0]);
    return rids;
  }
  // the one buyer email for refunds made together: "refunded in full" when nothing is left, "couldn't print" for render and printer rejects,
  // else "a refund for part of your order". Keys as before part 6 (me_<order>_refund_<first refund>, me_<order>_reject_<first line>).
  tellRefunds(id, rids, reason, first) {
    const all = this.order(id).status === 'refunded', reject = !all && (reason === 'render' || reason === 'provider');
    this.run("update merch_refunds set told = 1 where order_id = ? and id in (" + rids.map(() => '?').join(',') + ')', id, ...rids);
    if (reject) this.buyerMail(id, 'reject', 'me_' + id + '_reject_' + first, null, { line: first, refunds: rids, reason });
    else this.buyerMail(id, all ? 'refunded_all' : 'refunded', 'me_' + id + '_refund_' + rids[0], null, rids.length > 1 ? { refunds: rids, reason } : { refund: rids[0], reason });
  }
  // render rejects arrive one line at a time (each line renders on its own wake): told together once no line of the order is still waiting to
  // render, so several lines that fail at once get ONE email (review finding 5). Sync.
  tellRejects(id) {
    if (this.lines(id).some((l) => l.status === 'queued')) return;
    const o = this.order(id); if (!o || o.status === 'cancelled' || o.status === 'expired') return;
    const rs = this.q("select id, line from merch_refunds where order_id = ? and reason = 'render' and coalesce(told, 0) = 0 and id glob 'mr_*' order by created_at, id", id);
    if (rs.length) this.tellRefunds(id, rs.map((r) => r.id), 'render', rs[0].line);
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
    const again = () => this.tx(() => { // T2.2-42: the alarm retries with the same key
      const t = this.now();
      this.run("update merch_refunds set next_try_at = ? where id = ? and status = 'sending'", t + 5 * MIN, rid);
      if (t - r.created_at >= DAY) this.ownerMail(o.id, 'refund_stuck', 'A refund has not gone through for 24 hours: ' + rid);
    });
    // part 9 (review M2): a full refund (a row with no line) is capped, before it is first sent, at what is left on the charge as Stripe reads
    // it: a Dashboard refund whose webhook has not come yet then still leaves the buyer the right rest (its webhook adds it to `refunded` later;
    // here `refunded` comes down by what was taken off). Only before the first send: a key sent again must carry the same amount. A charge in
    // another currency than USD is not capped (the amounts would not compare).
    if (r.line == null && !r.sent_n && /^mr_/.test(rid)) {
      const c = await stripe.chargeOf(this.env, o.payment_intent);
      const ch = c.ok && c.data && c.data.latest_charge && typeof c.data.latest_charge === 'object' ? c.data.latest_charge : null;
      if (!ch && !stripe.refusedForGood(c)) return again(); // cannot tell what is left: never sent blind; a payment Stripe does not know fails below
      if (ch && (!ch.currency || ch.currency === 'usd') && Number.isInteger(ch.amount)) {
        const left = Math.max(0, ch.amount - (ch.amount_refunded || 0));
        const go = this.tx(() => {
          const y = this.one("select * from merch_refunds where id = ? and status = 'sending'", rid); if (!y) return false;
          if (y.sent_n || left >= y.amount) return true;
          this.run('update merch_refunds set amount = ? where id = ?', left, rid);
          this.run('update merch_orders set refunded = max(0, coalesce(refunded, 0) - ?) where id = ?', y.amount - left, y.order_id);
          this.event('x:refund_cap:' + rid, y.order_id, 'refund_capped', y.amount + ' -> ' + left + ' (what is left on the charge)');
          if (left > 0) return true;
          this.run("update merch_refunds set status = 'done', next_try_at = null where id = ?", rid); // nothing left: refunded already (in the Dashboard)
          return false;
        });
        if (!go) return;
      }
    }
    const row = this.tx(() => this.one("update merch_refunds set sent_n = coalesce(sent_n, 0) + 1 where id = ? and status = 'sending' returning *", rid));
    if (!row) return;
    const res = await stripe.refund(this.env, o.payment_intent, row.amount, row.id, o.id);
    const no = stripe.refusedForGood(res);
    if (!(res.ok && res.data && res.data.id) && !no) return again();
    this.tx(() => {
      if (!no) { this.run("update merch_refunds set status = 'done', stripe_refund = ?, next_try_at = null where id = ? and status = 'sending'", res.data.id, rid); return; }
      // M2: refused for good (an amount over what is left, a charge already refunded or charged back, an unknown payment): never retried; the
      // order is flagged and the owner told at once
      if (!this.q("update merch_refunds set status = 'failed', next_try_at = null where id = ? and status = 'sending' returning id", rid).length) return;
      this.set(o.id, { refund_failed: 1 });
      this.event('x:refund_refused:' + rid, o.id, 'refund_refused', no.code);
      this.ownerMail(o.id, 'refund_refused', 'Stripe refused the refund ' + rid + ' of ' + mail.usd(row.amount) + ' (' + no.code + (no.message ? ': ' + no.message : '') + ').');
    });
  }

  /* ---------------- email: the outbox (S7) ---------------- */
  async sendMail(mid) {
    const now = this.now();
    let skip = false;
    const row = this.tx(() => {
      const r = this.one("update merch_outbox set next_try_at = ? where id = ? and status = 'queued' and next_try_at <= ? returning *", now + WAKE, mid, now);
      if (!r || r.who !== 'buyer') return r;
      // review finding 13: an email whose news is out of date by the time it goes is not sent (a Thank you retried after a cancel; a delay
      // email after the late part was cancelled or posted); the email about what happened instead has gone or goes
      const o = this.order(r.order_id);
      // (second review, R2-M3: an address request once nothing waits for an address, e.g. Printful reshipped the parcel in the same read)
      if (o && ((r.kind === 'thanks' && ENDED.includes(o.status)) || ((r.kind === 'late' || r.kind === 'late_again') && !this.page(o).late) || (r.kind === 'address' && o.hold !== 'address' && o.hold !== 'reship'))) {
        this.run("update merch_outbox set status = 'skipped', next_try_at = null where id = ?", r.id); skip = true; return r;
      }
      // the gift, once shown, goes in the first of these emails sent after that, and in no other (gift_mailed: this row; a retry of it keeps it)
      if (GIFT_KINDS.includes(r.kind)) this.run('update merch_orders set gift_mailed = ? where id = ? and gift_code is not null and gift_shown_at is not null and gift_mailed is null', r.id, r.order_id);
      return r;
    });
    if (!row || skip) return;
    let res = null;
    if (row.who === 'owner') res = await mail.owner(this.env, row.order_id, row.kind, row.note, 'mo_' + row.id.replace(/[^A-Za-z0-9_-]/g, '_'));
    else {
      let to = this.mem.get(mid) || null;
      if (!to) { const o = this.order(row.order_id); if (o && o.stripe_session) { const g = await stripe.getSession(this.env, o.stripe_session); if (!g.ok || !g.data) res = { sent: false, why: 'stripe' }; else to = emailOf(g.data); } }
      if (!res) res = to ? await mail.send(this.env, to, row.kind, this.mailView(row), mid) : { sent: false, why: 'no_address' };
    }
    this.tx(() => {
      const t = this.now(), x = this.one('select * from merch_outbox where id = ?', mid); if (!x || x.status !== 'queued') return;
      if (res.sent) { this.run("update merch_outbox set status = 'sent', sent_at = ?, next_try_at = null, last_error = null where id = ?", t, mid); this.mem.delete(mid); return; }
      const tries = (x.tries || 0) + 1, final = res.why === 'not_set_up' || res.why === 'no_address' || tries >= MAIL_TRIES;
      this.run('update merch_outbox set tries = ?, last_error = ?, status = ?, next_try_at = ? where id = ?', tries, res.why || 'error', final ? 'failed' : 'queued', final ? null : t + MAIL_BACKOFF[Math.min(tries, MAIL_BACKOFF.length) - 1], mid);
      if (final && x.who === 'buyer' && res.why !== 'not_set_up') this.ownerMail(x.order_id, 'mail_failed', 'The "' + x.kind + '" email could not be sent (' + (res.why || 'error') + ', ' + tries + ' tries). Please write to the buyer from the Stripe dashboard.');
    });
  }

  // what a buyer email says, read from the order at send time (part 6): page(o) (buyer-safe: no address, no email) plus the colour names, the
  // delivery estimate, and what this email is about. Rows written before part 6 have no note: their key says what they are about.
  mailView(row) {
    const o = this.order(row.order_id); if (!o) return { id: row.order_id, lines: [], totals: {} };
    const v = this.page(o), TC = this.PP.TEE_COLOURS || [], rps = new Map(this.lines(o.id).map((l) => [l.line, l.rp]));
    for (const l of v.lines) { const c = TC.find((x) => x.id === l.colour); l.colour_name = c ? c.name : l.colour; l.rp = rps.get(l.line) == null ? null : rps.get(l.line); delete l.recipe; }
    Object.assign(v, { eta: ZONES[o.zone] ? ZONES[o.zone].eta.slice() : null });
    let a = null; try { a = row.note ? JSON.parse(row.note) : null; } catch (e) { a = null; }
    if (!a || typeof a !== 'object') {
      a = {}; const pre = 'me_' + o.id + '_', rest = String(row.id).startsWith(pre) ? String(row.id).slice(pre.length) : ''; let m;
      if ((m = /^ship_(.+)$/.exec(rest))) a.parcel = m[1];
      else if ((m = /^refund_(mr_.+)$/.exec(rest))) a.refund = m[1];
      else if ((m = /^reject_(\d+)$/.exec(rest))) a.line = Number(m[1]);
      else if ((m = /^reprint_(\d+)$/.exec(rest))) a.reprint = Number(m[1]);
      else if ((m = /^address_(.+?)(?:_\d{12,})?$/.exec(rest))) a.reship = m[1];
    }
    const about = {};
    if (a.parcel) about.parcel = String(a.parcel);
    // the gift block: only in the one email that carries it (sendMail chose it: gift_mailed), only once it is shown on the order page
    about.gift = !!(v.gift_code && o.gift_mailed && o.gift_mailed === row.id);
    let rids = Array.isArray(a.refunds) ? a.refunds : a.refund ? [a.refund] : [];
    if (!rids.length && a.line != null) rids = this.q("select id from merch_refunds where order_id = ? and line = ? and id glob 'mr_*' order by created_at desc limit 1", o.id, Number(a.line)).map((r) => r.id);
    if (!rids.length && row.kind === 'refunded_all') rids = this.q("select id from merch_refunds where order_id = ? and id glob 'mr_*' order by created_at desc limit 1", o.id).map((r) => r.id);
    if (rids.length || a.reason) {
      const rs = rids.map((x) => this.one('select line, qty, amount, reason from merch_refunds where id = ? and order_id = ?', String(x), o.id)).filter(Boolean);
      about.refund = { amount: rs.reduce((n, r) => n + (r.amount || 0), 0), reason: a.reason || (rs[0] && rs[0].reason) || null, lines: rs.filter((r) => r.line != null).map((r) => ({ line: r.line, qty: r.qty })) };
    }
    if (a.line != null) about.line = Number(a.line);
    if (a.reprint != null) { const rp = this.one('select n, why from merch_reprints where order_id = ? and n = ?', o.id, Number(a.reprint)); about.reprint = { n: Number(a.reprint), why: rp ? rp.why : null }; }
    if (a.reship) {
      about.reship = true; const x = String(a.reship), rp = this.one('select n from merch_reprints where id = ? and order_id = ?', x, o.id);
      about.reship_lines = this.lines(o.id).filter((l) => (rp ? l.rp === rp.n : l.parcel_id === x) && !['void', 'cancelled', 'rejected'].includes(l.status) && l.refunded_qty < l.qty).map((l) => l.line);
    }
    v.about = about;
    return v;
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
    if (type === 'charge.dispute.created' || type === 'charge.dispute.closed' || type === 'charge.dispute.updated') return this.onDispute(o, eid, type);
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
      const cols = { paid_at: now, cancel_until: now + this.coolMs(), ship_by: addBusinessDays(now, SHIP_BY_DAYS), payment_intent: piOf(cs), tax, total: Number.isInteger(cs.amount_total) ? cs.amount_total : o.total,
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
      this.set(id, cols, [o.status]); // paid: set() gives the gift (a held one gets it when it is released)
      if (hold) this.ownerMail(id, 'review', hold === 'late_pay' ? 'Paid after it expired: confirm (merch.sh confirm) to make it, or it is refunded in full after 24 hours.' : 'Held for review: ' + hold);
      if (tax > 0) { // T2.2-56: the real tax is stored; below the floor -> the nightly report only (the buyer is served)
        const inside = taxBehavior(o.country) === 'inclusive' ? tax : 0;
        const mg = marginOf(this.cat, o.country, L, o.subtotal, o.ship_fee, now, this.costs(), inside);
        if (!mg.pass) this.event('x:margin_low:' + id, id, 'margin_low', Math.round(mg.margin));
      }
      this.buyerMail(id, 'thanks', 'me_' + id + '_thanks', em, {});
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
          this.deadKeep(o.id, now);
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
      // Part 9 (review M3). Stripe's dispute statuses (docs.stripe.com/api/disputes/object, read 25 Nov 2026): warning_needs_response,
      // warning_under_review, warning_closed (an inquiry: a question from the bank, no money taken), needs_response, under_review,
      // appeal_needs_response, appeal_under_review (a chargeback, open), won, lost, prevented. Only 'lost' is lost: any other close keeps the
      // money with us and counts as won. An inquiry is a flag for the owner, never a pause; when it becomes a chargeback (charge.dispute.updated
      // with an open status, or a new created) it is treated as a dispute created then.
      const st = String(d.status || ''), inquiry = /^warning_/.test(st);
      if (type === 'charge.dispute.updated') { // only the step from an inquiry to a chargeback matters here
        if (inquiry || ['won', 'lost', 'prevented'].includes(st) || !(o.dispute == null || o.dispute === 'inquiry')) return;
        type = 'charge.dispute.created';
      }
      if (type === 'charge.dispute.created' && inquiry) {
        if (o.dispute === 'open' || o.dispute === 'lost') return;
        this.set(o.id, { disputed_at: now, dispute: 'inquiry', dispute_id: d.id || null });
        this.ownerMail(o.id, 'dispute_inquiry', 'Status ' + st.slice(0, 40) + '. Nothing is paused.');
        return;
      }
      if (type === 'charge.dispute.created') {
        if (o.status === 'open') { this.set(o.id, { status: 'held', hold: 'dispute', hold_at: now, payment_intent: d.payment_intent, disputed_at: now, dispute: 'open', dispute_id: d.id || null, next_try_at: null }, ['open']); this.ownerMail(o.id, 'dispute', 'A dispute before the payment was recorded.'); return; } // T2.2-24
        this.set(o.id, { disputed_at: now, dispute: 'open', dispute_id: d.id || null });
        if (o.email_hash) this.flag('e:' + o.email_hash, 'block', 'dispute ' + o.id);
        if (['paid', 'held'].includes(o.status)) pause(); // T2.2-22
        this.ownerMail(o.id, 'dispute', 'A dispute: answer in Stripe with the tracking, the delivery scan and the print PNG (merch.sh show).'); // T2.2-23: the flow goes on
        return;
      }
      const won = st !== 'lost'; // M3: won, warning_closed, prevented and any other close keep the money
      const wasOpen = o.dispute === 'open';
      this.set(o.id, { dispute: won ? 'won' : 'lost' });
      if (!won) this.giftBack(o.id); // the bank took the money back: a gift not shown yet goes back to the pool
      // Second review (R2-M2): won while the flow went on (not paused): the delay steps go on with their date moved by the time they waited. A
      // paused order moves its date when the owner releases it (admin confirm). R2-M4: lost: no reprint and no reship ever (stopReprints), a
      // reship hold ends with nothing refunded (the bank paid the buyer back). Won with a reship hold: the address form was shut while the
      // dispute was open, so the buyer gets a fresh 7 days.
      if (won && wasOpen && o.hold !== 'dispute') this.lateResume(o.id, o.disputed_at);
      if (!won) {
        this.stopReprints(o.id);
        if (o.hold === 'reship') { this.set(o.id, { hold: null, hold_at: null }); this.ownerMail(o.id, 'returned', 'The dispute was lost while a returned parcel waited for the buyer’s address: nothing is reshipped or refunded (the bank paid the buyer back).'); }
      } else if (wasOpen && o.hold === 'reship') this.set(o.id, { hold_at: now, next_try_at: o.next_try_at != null && o.next_try_at > now ? Math.min(o.next_try_at, now + 7 * DAY) : now + 7 * DAY });
      if (won) this.ownerMail(o.id, 'dispute_won', 'Dispute closed (' + st.slice(0, 40) + '): the money stays with us. If it was held before printing, decide: ship it (merch.sh confirm) or refund it.');
      else if (['paid', 'held'].includes(o.status)) pause(); // lost: the bank took the money back; it is never made
      this.event('x:dispute_' + (won ? 'won' : 'lost') + ':' + o.id, o.id, 'dispute_' + (won ? 'won' : 'lost'), st);
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
    // review finding 3 (PART5 Q23): Printful failed or cancelled an order it had taken ("a problem with address, printfiles, charging": a wallet
    // problem most likely shows up here, not as a 402). Only our own confirmed main order counts: never a reprint order (another Printful id),
    // a draft we deleted (never confirmed), or a cancel we asked for (pcancel, or the order already refunded or cancelled). The order is held
    // review with one owner email; the hold ends as every review hold does (the owner confirms, or a day later it is refunded in full). Fires
    // once: the next hint finds the order held, not confirmed. Told only, never held: in a dispute (the bank decides the money), and when part of
    // the order has shipped (a full refund would pay back parcels that arrived; the delay plan refunds the unshipped part at its date).
    const end = { failed: 'pf_failed', canceled: 'pf_canceled' }[d.status];
    if (end && d.id != null && String(d.id) === String(o.provider_order) && o.confirmed_at && !o.pcancel && !o.draft_del
      && (['confirmed', 'part_shipped'].includes(o.status) || (o.status === 'held' && o.hold === 'provider' && o.why === 'onhold'))) {
      const reason = end === 'pf_failed' ? 'provider_failed' : 'provider_canceled', what = end === 'pf_failed' ? 'failed' : 'cancelled';
      const sent = L.some((l) => l.parcel_id || (LINE_RANK[l.status] || 0) >= LINE_RANK.shipped);
      if (o.dispute === 'open' || o.dispute === 'lost' || sent) {
        if (this.event('x:' + end + ':' + d.id, id, end + '_told', o.status)) this.ownerMail(id, reason, 'Printful ' + what + ' this order after it was confirmed, ' + (sent ? 'with part of it shipped: the unshipped part is refunded by the delay plan at its date unless Printful goes on.' : 'during a dispute: nothing changes here.') + ' Check the Printful wallet and dashboard.');
      } else if (this.set(id, { status: 'held', hold: 'review', why: end, hold_at: now, next_try_at: now + DAY }, [o.status])) {
        this.event('x:' + end + ':' + d.id + ':' + now, id, end, o.status);
        this.ownerMail(id, reason, 'Printful ' + what + ' this order after it was confirmed. Check the Printful wallet and dashboard.');
        o = this.order(id);
      }
    }
    // the hold above ends by itself when Printful goes on with the order (fixed in its dashboard and sent again): confirmed, as after a confirm
    if (o.status === 'held' && o.hold === 'review' && ['pf_failed', 'pf_canceled'].includes(o.why) && String(d.id) === String(o.provider_order) && PF_CONFIRMED.includes(d.status)) {
      this.set(id, { status: 'confirmed', hold: null, why: null, hold_at: null, next_try_at: null }, ['held']); o = this.order(id);
    }
    // part 9 (B1): a confirm we had no clear answer to (held review confirm_<kind>) that Printful did take (the owner sent it again in its
    // dashboard, or our answer was lost): confirmed, as confirmed() does, never refunded at 24 hours while it prints
    if (o.status === 'held' && o.hold === 'review' && /^confirm_/.test(o.why || '') && String(d.id) === String(o.provider_order) && PF_CONFIRMED.includes(d.status)) {
      if (!o.confirmed_at) this.run('update merch_orders set confirmed_at = ? where id = ?', now, id);
      this.run("update merch_order_items set status = 'confirmed' where order_id = ? and status = 'drafted'", id);
      this.set(id, { status: 'confirmed', hold: null, why: null, hold_at: null, tries: 0, next_try_at: null }, ['held']); o = this.order(id);
      this.event('x:confirm_seen:' + id, id, 'confirmed_seen', d.status);
      for (const l of L) if (l.status === 'drafted') l.status = 'confirmed';
    }
    if (d.status === 'onhold' && ['confirmed', 'part_shipped'].includes(o.status)) { this.set(id, { status: 'held', hold: 'provider', why: 'onhold', hold_at: now }); this.ownerMail(id, 'provider_hold', 'Printful put this order on hold.'); o = this.order(id); } // T2.2-46
    else if (d.status !== 'onhold' && o.status === 'held' && o.hold === 'provider' && o.why === 'onhold') { this.set(id, { status: 'confirmed', hold: null, why: null, hold_at: null }); o = this.order(id); }
    if (!refunded && ['inprocess', 'partial', 'fulfilled'].includes(d.status)) for (const it of d.items.length ? d.items : L.map((l) => ({ external_id: l.provider_item || '' }))) { const l = lineOf(String(it.external_id)); if (l && l.status === 'confirmed') up(l, 'in_production'); } // T2.1-14
    for (const s of d.shipments || []) {
      const ls = s.items.map(lineOf).filter(Boolean); if (!ls.length) continue;
      let p = this.one('select * from merch_parcels where id = ?', s.id);
      if (!p) {
        this.run('insert into merch_parcels (id, order_id, product, carrier, tracking_url, shipped_at) values (?, ?, ?, ?, ?, ?)', s.id, id, ls[0].product, s.carrier, s.tracking_url, s.shipped_at || now);
        for (const l of ls) {
          // second review (R2-M3): a line already posted in a parcel that came back, now in a new parcel (Printful reshipped it): it moves to
          // the new parcel, so it is no longer waiting for an address and never refunded as unreshipped
          const back = l.parcel_id && l.parcel_id !== s.id && !DEAD.includes(l.status) && this.one('select returned_at from merch_parcels where id = ?', l.parcel_id);
          if (back && back.returned_at) { this.setLine(id, l.line, { parcel_id: s.id }); l.parcel_id = s.id; }
          else if (!refunded) up(l, 'shipped', { parcel_id: s.id }); else this.setLine(id, l.line, { parcel_id: s.id });
          this.setLine(id, l.line, { keep_until: (s.shipped_at || now) + 180 * DAY });
        }
        this.buyerMail(id, 'ship', 'me_' + id + '_ship_' + s.id, null, { parcel: s.id }); // T2.1-15: one "On its way" per parcel
        // part 9 (review m1): a line refunded in full that Printful posted all the same (a late refund, a cancel that came too late): the owner hears
        const paid = ls.filter((l) => l.qty > 0 && l.refunded_qty >= l.qty);
        if (paid.length && this.event('x:refunded_shipped:' + s.id, id, 'refunded_shipped', paid.map((l) => l.line).join(',')))
          this.ownerMail(id, 'refunded_shipped', 'Parcel ' + s.id + ' has ' + paid.map((l) => 'line ' + l.line).join(', ') + ', already refunded in full.');
        p = this.one('select * from merch_parcels where id = ?', s.id);
      }
      if (s.delivered_at && !p.delivered_at) { this.run('update merch_parcels set delivered_at = ? where id = ?', s.delivered_at, s.id); if (!refunded) for (const l of ls) up(l, 'delivered'); } // T2.1-17
      if (s.returned && !p.returned_at) { // T2.2-45: back at Printful; the status stays, the hold says why
        this.run('update merch_parcels set returned_at = ? where id = ?', now, s.id);
        const x = this.order(id), live = this.lines(id).filter((l) => l.parcel_id === s.id && !['replaced', 'cancelled', 'void', 'rejected'].includes(l.status) && l.refunded_qty < l.qty);
        // M4: nothing to reship on a refunded or cancelled order, in a dispute, or when its lines are refunded: the buyer is not asked
        // second review (R2-M4): nor after a lost dispute (the bank paid the buyer back)
        if (ENDED.includes(x.status) || x.dispute === 'open' || x.dispute === 'lost' || !live.length) this.ownerMail(id, 'returned', 'A parcel came back to Printful (' + s.id + '); nothing is reshipped (refunded, cancelled or in a dispute).');
        else { this.set(id, { hold: 'reship', hold_at: now, next_try_at: now + 7 * DAY }); this.buyerMail(id, 'address', 'me_' + id + '_address_' + s.id, null, { reship: s.id }); }
      }
    }
    // R2-M3: every returned line is in a new parcel again (Printful reshipped it) and no reship waits for an address: the reship hold ends
    o = this.order(id);
    if (o.hold === 'reship' && !this.reshipLines(o).length && !this.one("select id from merch_reprints where order_id = ? and status = 'need_address'", id)) {
      this.set(id, { hold: null, hold_at: null }); this.event('x:reshipped:' + id + ':' + now, id, 'reshipped_at_printer');
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
    this.pfReads = 0;
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
  // The delay plan (TRANSACTIONS T2.1-30, T2.1-34; the part 6 review), whatever the order waits for (held orders too; never in a dispute hold).
  // Sync, inside tx(): every step and its marker are written in one transaction, so a repeated alarm or a crash after it changes nothing.
  //   at ship_by: the first delay email, once (late_sent_at), with a definite new date late_eta = ship_by + LATE_MORE_DAYS working days (never
  //     more than LATE_MAX_DAYS days later). Waiting needs no answer.
  //   at late_eta, part still not posted: the buyer said keep waiting -> one second notice (late_again, late2_sent_at), no new date; else the
  //     late part is refunded in full by itself (late_auto_at), through the same path as the buyer's late cancel (lateRefund).
  // Part 9 (B1): an order Printful has past its draft is decided only right after a good read of it (read: lateStep applied one in this same
  // transaction); without one nothing happens here.
  lateCheck(id, read) {
    const o = this.order(id), now = this.now(), due = this.lateDue(o);
    if (due == null || now < due) return;
    if (this.needRead(o) && !read) return;
    if (!o.late_sent_at) {
      // second review (R2-M2): the new date counts from the day the email goes (ship_by, or later when the steps waited: a dispute, a hold the
      // owner released, failed reads), so the buyer always gets the full LATE_MORE_DAYS working days and the date is never in the past
      const from = Math.max(o.ship_by, now), eta = Math.min(addBusinessDays(from, LATE_MORE_DAYS), from + LATE_MAX_DAYS * DAY);
      this.set(id, { late_sent_at: now, late_eta: eta }); this.buyerMail(id, 'late', 'me_' + id + '_late', null, {});
      return;
    }
    if (o.late_ok_at) { this.set(id, { late2_sent_at: now }); this.buyerMail(id, 'late_again', 'me_' + id + '_late_2', null, {}); return; }
    this.set(id, { late_auto_at: now });
    this.lateRefund(this.order(id), 'late_auto');
    this.event('x:late_auto:' + id, id, 'late_auto');
  }
  // B1: the late step of one order. Printful's order is read OUTSIDE any transaction; what it says (applyRead) and the decision (lateCheck)
  // are one transaction, so a crash before it writes nothing (the claim's wake comes back and reads again) and a crash after it leaves a
  // decision that was taken once, with its marker. A read that fails writes only pf_wait (+15 min) and pf_read_fail.
  async lateStep(id) {
    const o = this.order(id), now = this.now(), due = this.lateDue(o);
    if (due == null || now < due) return;
    if (!this.needRead(o)) return this.tx(() => this.lateCheck(id));
    const po = o.provider_order, r = await this.readPrinter(o);
    if (!r.ok) return;
    this.tx(() => { if (this.applyRead(id, po, r.data, r.snap)) { this.lateCheck(id, true); r.snap = this.pfSnap(this.order(id)); } }); // our own change: the read stays good for this step
  }
  // one read of an order's Printful order -> { ok: true, data } | { ok: false } (then pf_wait and, on a failure, pf_read_fail are written).
  // Kept for the rest of the step (pfMemo), so the late step and the hold's refund in one work() read once; at most PF_READS_TICK an alarm.
  async readPrinter(o) {
    const po = o.provider_order;
    if (this.pfMemo.has(po)) return this.pfMemo.get(po);
    if (this.pfReads >= PF_READS_TICK) { this.tx(() => this.run('update merch_orders set pf_wait = ?, next_try_at = min(coalesce(next_try_at, ?), ?) where id = ?', this.now() + MIN, this.now() + MIN, this.now() + MIN, o.id)); return { ok: false }; }
    this.pfReads++;
    const snap = this.pfSnap(this.order(o.id)), g = await provider.get(this.env, po);
    const r = g.ok && g.data ? { ok: true, data: g.data, snap } : { ok: false };
    this.pfMemo.set(po, r);
    if (!r.ok) this.tx(() => this.readFailed(o.id, po, g.kind));
    return r;
  }
  // sync: a read that failed. The step waits PF_RETRY; once the reads have failed for PF_TELL the owner hears, once per run of failures
  readFailed(id, po, kind) {
    const x = this.order(id); if (!x || String(x.provider_order) !== String(po)) return;
    const now = this.now(), since = x.pf_read_fail || now;
    this.run('update merch_orders set pf_read_fail = ?, pf_wait = ?, next_try_at = min(coalesce(next_try_at, ?), ?) where id = ?', since, now + PF_RETRY, now + PF_RETRY, now + PF_RETRY, id);
    if (now - since >= PF_TELL && this.event('x:pf_unread:' + id + ':' + since, id, 'pf_unread', kind || null))
      this.ownerMail(id, 'printer_unread', 'Printful order ' + po + ' could not be read since ' + new Date(since).toISOString().slice(0, 16) + ' UTC (' + (kind || 'error') + '). Its delay steps and automatic refunds wait until it can.');
  }
  // sync: a good read applied (as a hint would be), if the order still has that Printful order -> true. snap (R2-m1): the order as it was when
  // the read went out; changed since: false, nothing applied (the caller reads again)
  applyRead(id, po, d, snap) {
    const x = this.order(id); if (!x || String(x.provider_order) !== String(po) || String(d.id) !== String(po)) return false;
    if (snap != null && this.pfSnap(x) !== snap) { this.pfMemo.delete(po); this.event('x:pf_stale:' + id + ':' + this.now(), id, 'pf_read_stale'); return false; }
    this.run('update merch_orders set pf_read_at = ?, pf_read_fail = null, pf_wait = null where id = ?', this.now(), id);
    this.applyProvider(id, d);
    return true;
  }
  async work(id) {
    this.pfMemo = new Map();
    let o = this.order(id); if (!o) return;
    if (o.draft_del && o.provider_order) { await this.delDraft(id); o = this.order(id); }
    if (o.pcancel) { await this.provCancel(id); o = this.order(id); }
    if (this.one("select id from merch_reprints where order_id = ? and status = 'drop'", id)) { await this.dropReprints(id); o = this.order(id); }
    await this.lateStep(id);
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
      // Second review. R2-M4: never during an open dispute (the bank decides the money; the address form is shut too: a won close gives a fresh
      // 7 days), never after a lost one (the hold ends, nothing refunded). R2-M3: never blind: every Printful order that holds a returned line
      // (ours, or a reprint's) is read first and applied in the refund's own transaction; a line Printful reshipped is in a new parcel then and
      // is not refunded. A read that fails: tried again in 15 minutes (the owner hears after 24 hours, as every failed read).
      if (o.dispute === 'open') return this.tx(() => this.next(id, this.now() + DAY));
      const reads = [];
      if (o.dispute !== 'lost') for (const [po, rp] of this.reshipOrders(o)) {
        if (rp == null) { const r = await this.readPrinter(this.order(id)); if (!r.ok) return this.tx(() => this.next(id, this.order(id).pf_wait || this.now() + PF_RETRY)); reads.push({ po, data: r.data, snap: r.snap }); }
        else { const g = await provider.get(this.env, po); if (!g.ok || !g.data) return this.tx(() => this.next(id, this.now() + PF_RETRY)); reads.push({ po, data: g.data, rp }); }
      }
      return this.tx(() => {
        for (const r of reads) {
          if (r.rp == null) { if (!this.applyRead(id, r.po, r.data, r.snap)) return this.next(id, this.now() + MIN); }
          else if (String(r.data.id) === String(r.po)) { this.run('update merch_reprints set read_at = ? where order_id = ? and n = ?', this.now(), id, r.rp); this.applyProvider(id, r.data); }
        }
        const x = this.order(id); if (x.hold !== 'reship') return; // Printful reshipped it (the hold ended in applyProvider): no refund
        if (x.dispute === 'lost' || x.dispute === 'open') {
          if (x.dispute === 'open') return this.next(id, this.now() + DAY);
          this.run("update merch_reprints set status = 'cancelled' where order_id = ? and status = 'need_address'", id);
          this.set(id, { hold: null, hold_at: null, next_try_at: null });
          this.ownerMail(id, 'returned', 'A returned parcel waited 7 days after a lost dispute: nothing is reshipped or refunded (the bank paid the buyer back).');
          return;
        }
        const na = this.q("select n from merch_reprints where order_id = ? and status = 'need_address'", id).map((r) => r.n);
        const L = this.reshipLines(x).concat(this.lines(id).filter((l) => na.includes(l.rp) && l.refunded_qty < l.qty));
        this.refundLines(id, L.map((l) => ({ line: l.line })), 'reship');
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
    // part 9 (B1): an order Printful has past its draft is read first; what it says is applied in the refund's own transaction (it may have
    // gone on: then the hold ends and nothing is refunded); a read that fails pushes the refund back 15 minutes, never refunds blind
    const refund = async (w) => {
      const o1 = this.order(id); let po = null, data = null, snap = null;
      if (this.needRead(o1)) { po = o1.provider_order; const r = await this.readPrinter(o1); if (!r.ok) return this.tx(() => this.next(id, this.order(id).pf_wait || this.now() + PF_RETRY)); data = r.data; snap = r.snap; }
      return this.tx(() => {
        if (po && !this.applyRead(id, po, data, snap)) return this.next(id, this.now() + MIN); // R2-m1: changed during the read: read again soon
        const x = this.order(id); if (!same(x)) return this.next(id, x ? x.next_try_at : null);
        this.fullRefund(x, w, 'refunded'); this.ownerMail(id, 'auto_refund', 'Refunded in full: ' + w);
      });
    };
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
        if (since >= DAY) this.tx(() => this.ownerMail(id, 'provider_down', o.last_error === 'file' ? 'For 24 hours Printful could not use a print file of this order (the file, its URL or its placement): look at the print file (merch.sh show) and the print storage.' : 'Printful has not answered for 24 hours.'));
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
    const live = () => { const x = this.order(id), y = this.lineRow(id, l.line); return x && y && y.status === 'queued' && !ENDED.includes(x.status) ? { x, y } : null; };
    let r = this.pngs.get(ck) || null; // S11: a PNG whose store failed is stored again without a new render
    if (!r) {
      if (now < last + 11e3) return this.tx(() => this.next(id, last + 11e3));
      this.tx(() => this.setMeta('render_at', now));
      const url = (this.env.MERCH_PUBLIC_URL || 'https://merch-api.doodledoggo.app') + '/merch/print/' + l.art_ver + '/' + l.print_link; // the line's own art_ver folder
      r = await this.shot(l.product, url); let renderer = 'browser'; // part 4: the file check, our own daily budget, the 429 and error runs (shot, browserBook)
      if (!r.ok && r.kind === 'rate') return this.tx(() => this.next(id, now + 11e3)); // T2.2-30
      // the fallback: the day is out, the browser is not set up (review finding 7), a second error, or the browser is off for its errors (finding 4). A fallback that cannot draw this line at all
      // (another art_ver, or a layer across a band edge: review finding 5) never makes the line rejected and refunded while the browser could
      // still draw it: it waits for the browser (kind 'wait': an hour, held after the cancel hour, the owner told at 2 h, refunded at 72 h)
      if (!r.ok && (r.kind === 'daily' || r.kind === 'not_set_up' || (r.kind === 'error' && (l.tries >= 1 || r.off)))) {
        if (!live()) return this.tx(() => this.next(id, this.now())); // review finding 11: cancelled or refunded during the browser call: no fallback render
        const f = await render.resvg(this.env, l.product, url);
        if (f.ok && await this.pngOk(l.product, f.png)) { r = f; renderer = 'resvg'; }
        else if (r.kind === 'error' && !f.ok && (f.why === 'art_ver' || f.why === 'layer')) r = { ok: false, kind: 'wait', why: 'wait: ' + f.why };
      }
      if (r.ok) r = { ok: true, png: r.png, renderer };
    }
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
        this.tellRejects(id); // an earlier line of this order was rejected: told now that nothing waits to render
        this.next(id, t);
      });
    }
    return this.tx(() => { // a failure changes only a line still queued in an order that goes on (S1: no "couldn't print" after a cancel)
      const t = this.now(), ok = live(); if (!ok) return this.next(id, t);
      const { x, y } = ok;
      if (r.kind === 'daily' || r.kind === 'not_set_up' || r.kind === 'wait') { // T2.2-29: wait for 09:00 JST; past the hour, held render ('wait': an hour)
        const reset = r.kind === 'daily' ? (r.until || nextUtcMidnight(t)) : t + HOUR, cols = {}; // part 4: a day called out after a 429 run comes back sooner (until)
        let nt = x.status === 'paid' && t < x.cancel_until ? Math.min(reset, x.cancel_until) : reset; // look again when the hour ends, to hold it
        if (x.status === 'paid' && t >= x.cancel_until) Object.assign(cols, { status: 'held', hold: 'render', hold_at: t });
        const held = cols.hold === 'render' || (x.status === 'held' && x.hold === 'render'), since = cols.hold_at || x.hold_at || t;
        if (held) nt = Math.min(reset, t + 2 * HOUR, since + 72 * HOUR); // held: the 2-hour owner email and the 72-hour refund need a wake
        cols.next_try_at = nt; this.set(id, cols); this.setLine(id, l.line, { last_error: r.kind === 'wait' ? r.why : r.kind });
        return;
      }
      if (y.tries < 1) { this.setLine(id, l.line, { tries: 1, last_error: r.why || 'render' }); return this.next(id, t + MIN); } // T2.2-28: once more after 1 min
      this.setLine(id, l.line, { status: 'rejected', last_error: 'render', tries: y.tries + 1, keep_until: t + 2 * DAY }); // still failing after the fallback: refunded, the others go on
      this.lineRefund(x, this.lineRow(id, l.line), y.qty - y.refunded_qty, 'render', true);
      this.ownerMail(id, 'render_reject', 'Line ' + l.line + ' could not be rendered and was refunded.');
      this.tellRejects(id); // one email for the lines rejected together, once nothing of the order waits to render (review finding 5)
      this.next(id, t);
    });
  }
  // the print file check (review finding 1, render.js pngCheck): exact size, 8-bit RGBA, a least and a most byte size, whole to IEND, and the
  // tee's first row clear. Async (the tee's first row is inflated with DecompressionStream): every caller re-reads the order after it, as after
  // any await (renderLine: live() before the fallback and before the store)
  async pngWhy(product, png) { const P = this.PP.PRODUCTS[product]; return P ? render.pngCheck(product, png, P) : 'product'; }
  async pngOk(product, png) { return !(await this.pngWhy(product, png)) && png.length <= PNG_MAX; }
  /* ---------------- Browser Run: the budget and the 429s (part 4) ---------------- */
  // meta: 'br_ms:<UTC day>' billed ms added up from X-Browser-Ms-Used; 'br_off' '<until ms> <why>' (the browser is not asked until then);
  // 'br_rate_run' unknown 429s in a row; 'br_err_run' browser errors in a row (review finding 4)
  budget() { return Number(this.env.MERCH_BROWSER_BUDGET_MS) > 0 ? Number(this.env.MERCH_BROWSER_BUDGET_MS) : BROWSER_BUDGET_MS; }
  browserOff(now) {
    const off = String(this.meta('br_off') || '').split(' ');
    if (off[0] && now < Number(off[0])) return { why: off[1] || 'off', until: Number(off[0]) };
    if (Number(this.meta('br_ms:' + utcDay(now)) || 0) >= this.budget()) return { why: 'budget', until: nextUtcMidnight(now) };
    return null;
  }
  // one screenshot through render.js, its file checked, booked: never called while the day is out (the fallback takes over at once). A file that
  // fails the check is a browser error (it counts toward the error run); the bytes stay on the answer for the self-test's report
  async shot(product, url, via) {
    const off = this.browserOff(this.now());
    // off for its own errors (review finding 4): an error for the line, so the fallback draws at once and a line the fallback cannot draw either
    // follows T2.2-28 (once more after a minute, then rejected), never a quota day's wait
    if (off) return off.why === 'errors' ? { ok: false, kind: 'error', why: 'errors', until: off.until, skipped: true, off: 'errors' } : { ok: false, kind: 'daily', why: off.why, until: off.until, skipped: true };
    let r = await render.screenshot(this.env, product, url, via);
    if (r.ok) { const why = await this.pngWhy(product, r.png); if (why) r = { ok: false, kind: 'error', why: 'png', png_why: why, png: r.png, ms: r.ms, wall: r.wall }; }
    return this.tx(() => this.browserBook(r));
  }
  // sync, in a transaction: the ms, the 429 and error runs and the day out. -> the answer as the render step should treat it (booked: the ms added)
  // Review finding 4: X-Browser-Ms-Used when Browser Run sends it, else the wall time of the call (an answer without the header, our own timeout,
  // a throw): an unknown cost is counted as the time it took, never as 0
  browserBook(r) {
    const now = this.now(), k = 'br_ms:' + utcDay(now), before = Number(this.meta(k) || 0);
    const ms = r.ms != null && Number(r.ms) >= 0 ? Number(r.ms) : Number(r.wall) > 0 ? Number(r.wall) : 0, after = before + ms;
    r.booked = ms;
    if (ms) this.setMeta(k, after);
    if (before < this.budget() && after >= this.budget()) this.browserDown(now, 'budget', nextUtcMidnight(now), after + ' ms used');
    const errs = Number(this.meta('br_err_run') || 0);
    if (r.ok) { if (Number(this.meta('br_rate_run') || 0)) this.setMeta('br_rate_run', 0); if (errs) this.setMeta('br_err_run', 0); return r; }
    if (!r.ok && r.kind === 'rate') {
      const run = Number(this.meta('br_rate_run') || 0) + 1;
      if (run < RATE_RUN) { this.setMeta('br_rate_run', run); return r; }
      const until = Math.min(now + HOUR, nextUtcMidnight(now)); // unverified: an hour, then the browser is asked again
      this.setMeta('br_rate_run', 0); this.browserDown(now, 'rate_run', until, r.why);
      return Object.assign({}, r, { kind: 'daily', why: 'rate_run ' + run + ': ' + (r.why || ''), until });
    }
    if (Number(this.meta('br_rate_run') || 0)) this.setMeta('br_rate_run', 0);
    if (!r.ok && r.kind === 'daily') { if (errs) this.setMeta('br_err_run', 0); const until = nextUtcMidnight(now); this.browserDown(now, 'daily', until, r.why); return Object.assign({}, r, { until }); }
    if (!r.ok && r.kind === 'error') { // review finding 4: ERROR_RUN in a row put the browser off for an hour; the owner is told (once a JST day)
      const run = errs + 1;
      if (run < ERROR_RUN) { this.setMeta('br_err_run', run); return r; }
      const until = now + HOUR; this.setMeta('br_err_run', 0); this.browserDown(now, 'errors', until, r.why);
      return Object.assign({}, r, { why: 'errors ' + run + ': ' + (r.why || ''), until, off: 'errors' }); // still an error for the line (T2.2-28), with the fallback at once
    }
    return r;
  }
  browserDown(now, why, until, note) { // sync. The owner hears once a JST day (the outbox key carries the day)
    this.setMeta('br_off', until + ' ' + why);
    this.ownerMail(null, 'browser_off', 'Browser Run is out (' + why + (note ? ': ' + String(note).slice(0, 140) : '') + ') until ' + new Date(until).toISOString().slice(0, 16) + ' UTC. The resvg fallback draws the prints meanwhile. Browser time today: ' + Number(this.meta('br_ms:' + utcDay(now)) || 0) + ' ms of our ' + this.budget() + ' ms budget.');
  }
  browserStatus(now) {
    const off = this.browserOff(now);
    return { ms_today: Number(this.meta('br_ms:' + utcDay(now)) || 0), ms_yesterday: Number(this.meta('br_ms:' + utcDay(now - DAY)) || 0), budget_ms: this.budget(), free_ms: 600e3,
      off: off ? off.why : null, off_until: off ? off.until : null, rate_run: Number(this.meta('br_rate_run') || 0), error_run: Number(this.meta('br_err_run') || 0),
      via: this.env.MERCH_RENDER_VIA === 'worker' ? 'worker' : 'direct', parts: render.renderParts(this.env) }; // parts: what is set up, RENDER included (review finding 7)
  }
  // the admin render self-test (part 4): one built-in sample dog of the CURRENT art through the real path (render.js, pngOk, MerchPrints with a
  // 15-minute keep), no order. It keeps the 11 s spacing and its browser time counts toward the budget. -> { status, body }
  async renderTest(b) {
    const product = b.product, renderer = b.renderer || 'browser', via = b.via == null ? null : b.via;
    if (!['tee', 'mug'].includes(product) || !['browser', 'resvg'].includes(renderer) || ![null, 'direct', 'worker'].includes(via)) return { status: 400, body: { error: 'bad_test', say: 'product tee|mug, renderer browser|resvg, via direct|worker' } };
    const S = await loadSamples(this.PP), dog = S.find((d) => d.id === (b.dog || 'golden'));
    if (!dog) return { status: 400, body: { error: 'bad_dog', dogs: S.map((d) => d.id) } };
    const now = this.now(), last = Number(this.meta('render_at') || 0);
    // probe: the one-off cloud test (tools/merch_rtest.mjs) asks twice 1 s apart on purpose, to record Browser Run's own rate-limit answer. Only
    // with MERCH_RENDER_PROBE = "1", which is never set on the real Worker
    const probe = !!b.probe && this.env.MERCH_RENDER_PROBE === '1';
    if (now < last + 11e3 && !probe) return { status: 429, body: { error: 'wait', wait_ms: last + 11e3 - now } };
    this.tx(() => this.setMeta('render_at', now));
    const P = this.PP, colour = product === 'tee' ? (P.PRODUCTS.tee.colours.some((c) => c.id === b.colour) ? b.colour : 'navy') : 'white';
    const link = P.printHash(dog.r, { product, colour, pose: dog.pose }), url = (this.env.MERCH_PUBLIC_URL || 'https://merch-api.doodledoggo.app') + '/merch/print/' + P.ART_VER + '/' + link;
    const out = { ok: false, product, colour, dog: dog.id, art_ver: P.ART_VER, renderer, via: renderer === 'browser' ? (via || (this.env.MERCH_RENDER_VIA === 'worker' ? 'worker' : 'direct')) : null };
    const t0 = Date.now(), r = renderer === 'browser' ? await this.shot(product, url, via) : await render.resvg(this.env, product, url);
    // ms_used: X-Browser-Ms-Used as sent (null without it: the cloud test records whether errors carry it); ms_booked: what the budget counted
    Object.assign(out, { wall_ms: Date.now() - t0, ms_used: r.ms == null ? null : r.ms, ms_booked: r.booked == null ? null : r.booked });
    const png = r.png || null, why = r.ok ? await this.pngWhy(product, png) : r.png_why || null;
    if (png) { const d = pngSize(png); Object.assign(out, { bytes: png.length, width: d ? d.w : null, height: d ? d.h : null, colour_type: d ? png[25] : null, png_ok: !!r.ok && !why && png.length <= PNG_MAX, png_why: why }); }
    if (!r.ok) return { status: 200, body: Object.assign(out, { error: { kind: r.kind, why: r.why || null, skipped: !!r.skipped }, browser: this.browserStatus(this.now()) }) };
    if (!out.png_ok) return { status: 200, body: Object.assign(out, { error: { kind: 'error', why: 'png' }, browser: this.browserStatus(this.now()) }) };
    const s = await this.storePng({ id: 'rt_' + now.toString(36), paid_at: now }, { line: product + '-' + renderer }, r.png);
    if (!s.ok) return { status: 200, body: Object.assign(out, { error: { kind: 'error', why: 'store' }, browser: this.browserStatus(this.now()) }) };
    this.tx(() => this.setMeta('rt:' + s.key, this.now() + 15 * MIN)); // the nightly tidy deletes it once its link is over
    return { status: 200, body: Object.assign(out, { ok: true, sha256: s.sha, key: s.key, file_url: await this.fileUrl(s.key, 15 * MIN), browser: this.browserStatus(this.now()) }) };
  }
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
          guard((x) => { for (const l of L) { const y = this.lineRow(id, l.line); if (y.status !== 'ready') continue; this.setLine(id, l.line, { status: 'rejected', last_error: 'provider', keep_until: this.now() + 2 * DAY }); this.run('update merch_variants set on_flag = 0 where id = ?', l.variant); } this.fullRefund(this.order(id), 'provider', 'refunded'); this.ownerMail(id, 'provider_reject', 'Printful refused every line.'); });
          return { ok: false, kind: 'refused' };
        }
        guard(() => { // T2.2-32: those lines are refunded (ONE email for them: review finding 5) and their variants turned off; the draft is made with the rest
          const picks = [];
          for (const l of bad) {
            const y = this.lineRow(id, l.line); if (y.status !== 'ready') continue;
            this.setLine(id, l.line, { status: 'rejected', last_error: 'provider', keep_until: this.now() + 2 * DAY }); // (f) its print file goes in 2 days
            this.run('insert into merch_variants (id, product, colour, size, provider_variant, on_flag) values (?, ?, ?, ?, ?, 0) on conflict(id) do update set on_flag = 0', l.variant, l.product, l.colour, l.size, l.provider_variant);
            picks.push({ line: l.line });
          }
          this.refundLines(id, picks, 'provider');
          this.ownerMail(id, 'provider_reject', 'Printful refused ' + bad.map((l) => l.variant).join(', '));
        });
        continue;
      }
      if (r.kind === 'address') { // T2.2-36
        guard(() => { const t = this.now(); this.set(id, { status: 'held', hold: 'address', hold_at: t, next_try_at: t + 7 * DAY }); this.buyerMail(id, 'address', 'me_' + id + '_address', null, {}); });
        return r;
      }
      if (r.kind === 'timeout') { guard((x) => this.set(id, { tries: (x.tries || 0) + 1, last_error: 'timeout', next_try_at: this.now() + MIN })); return r; }
      if (r.kind === 'refused') { guard(() => { const t = this.now(); this.set(id, { status: 'held', hold: 'review', why: 'provider', hold_at: t, next_try_at: t + DAY }); this.ownerMail(id, 'review', 'Printful refused the draft without naming a line.'); }); return r; }
      guard((x) => { this.backoff(x); if (r.why === 'file') this.run("update merch_orders set last_error = 'file' where id = ?", id); }); return r; // down, not set up (T2.2-34); a print file Printful could not use (finding 4)
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
      // part 5: Printful v2 may give a draft no costs (calculation failed, or not in USD; review finding 5: or a number we cannot read): never
      // confirmed blind; the owner looks (a day, then refunded)
      if (!Number.isFinite(d.costs.items) || !Number.isFinite(d.costs.shipping)) { Object.assign(cols, { provider_cost: null, status: 'held', hold: 'review', why: 'cost_unknown', hold_at: now, next_try_at: now + DAY }); this.ownerMail(id, 'cost', 'Printful’s draft has no costs we can read: confirm (merch.sh confirm) or refund.'); }
      else if (cost > est * 1.1) { Object.assign(cols, { status: 'held', hold: 'review', why: 'cost', hold_at: now, next_try_at: now + 48 * HOUR }); this.ownerMail(id, 'cost', 'Printful’s draft costs ' + cost + ' against our ' + est + ': confirm (merch.sh confirm) or refund.'); }
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
      if (g.data.status !== 'draft') return this.tx(() => { if (this.set(id, { status: 'held', hold: 'review', why: 'confirm_' + g.data.status, hold_at: now, next_try_at: now + DAY }, ['confirming'])) this.ownerMail(id, 'review', 'Printful says the order is ' + g.data.status + ' after a confirm we did not hear back from. Check the Printful wallet and dashboard.'); });
    }
    const r = await provider.confirm(this.env, po);
    if (r.ok) return this.confirmed(id);
    if (r.kind === 'timeout') return; // stays 'confirming': the alarm re-reads it after 2 minutes
    if (r.kind === 'billing') return this.tx(() => { const x = this.order(id); if (this.set(id, { status: 'held', hold: 'wallet', hold_at: x.hold_at || now, next_try_at: now + 30 * MIN }, ['confirming'])) this.ownerMail(id, 'wallet', 'Printful could not charge the wallet. Please top it up.'); });
    if (r.kind === 'down' || r.kind === 'not_set_up') return this.tx(() => { const x = this.order(id); if (x.status === 'confirming') this.backoff(x); });
    return this.tx(() => { if (this.set(id, { status: 'held', hold: 'review', why: 'confirm_' + r.kind, hold_at: now, next_try_at: now + DAY }, ['confirming'])) this.ownerMail(id, 'review', r.why === 'failed' ? 'Printful took the confirm but the order came back failed (a problem with the address, the print files or the charge). Check the Printful wallet and dashboard, fix it there, then confirm (merch.sh confirm) to send it again; otherwise it is refunded in full after 24 hours.' : 'Printful refused the confirm (' + r.kind + '). Check the Printful wallet and dashboard.'); });
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
  // R2-M3: the Printful orders that hold a returned line still waiting -> Map(provider order -> null for our own order | the reprint's n)
  reshipOrders(o) {
    const out = new Map();
    for (const l of this.reshipLines(o)) {
      if (l.rp == null) { if (o.provider_order) out.set(String(o.provider_order), null); continue; }
      const r = this.one('select provider_order from merch_reprints where order_id = ? and n = ?', o.id, l.rp); if (r && r.provider_order) out.set(String(r.provider_order), l.rp);
    }
    return out;
  }
  reshipLines(o) { const ps =this.q('select id from merch_parcels where order_id = ? and returned_at is not null', o.id).map((p) => p.id); return this.lines(o.id).filter((l) => ps.includes(l.parcel_id) && !['replaced', 'cancelled', 'void', 'rejected'].includes(l.status) && l.refunded_qty < l.qty); }
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
      const st = draftId ? 'drop' : ENDED.includes(x.status) || x.dispute === 'lost' ? 'cancelled' : 'held'; // R2-M4: lost: never made
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
      this.tx(() => { const t = this.now(); if (!this.q("update merch_reprints set status = 'need_address' where id = ? and status = 'queued' returning id", rp.id).length) return; this.set(id, { hold: 'reship', hold_at: t, next_try_at: t + 7 * DAY }); this.buyerMail(id, 'address', 'me_' + id + '_address_' + rp.id, null, { reship: rp.id }); });
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
        if (r.kind === 'address' && rp.why === 'reship') { this.mem.delete(rp.id); this.tx(() => { const t = this.now(); this.run("update merch_reprints set status = 'need_address' where id = ? and status = 'queued'", rp.id); this.set(id, { hold: 'reship', hold_at: t, next_try_at: t + 7 * DAY }); this.buyerMail(id, 'address', 'me_' + id + '_address_' + rp.id + '_' + t, null, { reship: rp.id }); }); }
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
      else this.buyerMail(id, 'reprint', 'me_' + id + '_reprint_' + rp.n, null, { reprint: rp.n });
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
    await this.rereads(now);
    await this.tick();
    return { ok: true, nightly };
  }
  // Part 9 (review B1): the daily re-read. Every order Printful has (confirmed, part shipped, or held on Printful's own hold) and every
  // confirmed reprint with something not yet posted is read once a day at least, the oldest read first, PF_READS_CRON a cron run, so a hint
  // that was lost (a webhook outage, a 502 while we re-read it, an event we do not subscribe to) is caught within a day. What it says is applied
  // as a hint would be. A read that fails: the order is tried again in 15 minutes (pf_wait), a reprint in an hour.
  async rereads(now) {
    let left = PF_READS_CRON;
    // second review (R2-M3): also a shipped order with a reship hold (a parcel came back: Printful may reship it with no hint)
    const os = this.q("select id, provider_order from merch_orders where provider_order is not null and confirmed_at is not null and (status in ('confirmed', 'part_shipped') or (status = 'held' and hold = 'provider') or (status = 'shipped' and hold = 'reship')) and coalesce(pf_read_at, confirmed_at) <= ? and coalesce(pf_wait, 0) <= ? and coalesce(lease_until, 0) <= ? order by coalesce(pf_read_at, confirmed_at) limit ?", now - DAY, now, now, left);
    for (const x of os) {
      left--;
      const g = await provider.get(this.env, x.provider_order);
      this.tx(() => { if (g.ok && g.data) this.applyRead(x.id, x.provider_order, g.data); else this.readFailed(x.id, x.provider_order, g.kind); });
    }
    if (left <= 0) { await this.flush(); return; }
    // reprints with a line not posted yet, and (R2-M3) reprints whose parcel came back while the order waits on a reship
    const rs = this.q("select r.id, r.order_id, r.provider_order from merch_reprints r join merch_orders o on o.id = r.order_id where r.status = 'confirmed' and r.provider_order is not null and coalesce(r.read_at, r.created_at) <= ? and ((o.status in ('confirmed', 'part_shipped') and exists (select 1 from merch_order_items i where i.order_id = r.order_id and i.rp = r.n and i.status in ('confirmed', 'in_production'))) or (o.status in ('confirmed', 'part_shipped', 'shipped') and o.hold = 'reship' and exists (select 1 from merch_order_items i join merch_parcels p on p.id = i.parcel_id where i.order_id = r.order_id and i.rp = r.n and p.returned_at is not null))) order by coalesce(r.read_at, r.created_at) limit ?", now - DAY, left);
    for (const r of rs) {
      const g = await provider.get(this.env, r.provider_order);
      this.tx(() => {
        const fresh = true;
        this.run('update merch_reprints set read_at = ? where id = ?', g.ok && g.data && fresh ? this.now() : this.now() - DAY + HOUR, r.id);
        if (g.ok && g.data && fresh && String(g.data.id) === String(r.provider_order)) this.applyProvider(r.order_id, g.data);
      });
    }
    await this.flush();
  }
  async nightly(now) {
    const c = await provider.catalogCosts(this.env);
    if (c.ok && c.data) this.tx(() => {
      for (const [id, cents] of Object.entries(c.data.variants || {})) { const [p, col, size] = id.split(':'); this.run('insert into merch_variants (id, product, colour, size, cost_base, on_flag, cost_at) values (?, ?, ?, ?, ?, 1, ?) on conflict(id) do update set cost_base = excluded.cost_base, cost_at = excluded.cost_at', id, p, col, size || null, Number(cents), now); }
      for (const [id, fe] of Object.entries(c.data.ship || {})) this.run('insert or replace into merch_ship_costs (id, first, extra, cost_at) values (?, ?, ?, ?)', id, fe[0], fe[1], now);
      // review finding 9: our variants Printful's read gave no price (their last cost stays, as above: only prices read are written). The owner
      // hears once per change of that list, not every night; an empty list clears it.
      const miss = (c.data.missing || []).slice().sort().join(', ');
      if (miss !== (this.meta('cost_missing') || '')) { this.setMeta('cost_missing', miss); if (miss) this.ownerMail(null, 'cost_missing', 'No price from Printful for: ' + miss + '. The last known cost is kept for each.'); }
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
    this.tx(() => { this.setMeta('report', JSON.stringify(rep)); this.ownerMail(null, 'report', (mail.reportText(rep) + '\n' + browserLine(rep.browser)).slice(0, 4000)); this.giftCheck(); }); // its key carries the JST day (S7)
    await this.flush();
    return rep;
  }
  // TRANSACTIONS 5 retention (T2.1-33)
  async tidy(now) {
    // a file goes when no line that uses it (a reprint copies the key) needs it any more
    const keys = this.q('select file_key as k from merch_order_items where file_key is not null group by file_key having max(coalesce(keep_until, 9e15)) <= ?', now).map((r) => r.k);
    // part 4: render self-test files once their 15-minute link is over (their rows go in the same transaction as the trash rows below: review
    // finding 6, a crash between can never leave a file stored for good), and the Browser Run day totals after 40 days
    const rt = this.q("select k from merch_meta where k glob 'rt:*' and cast(v as integer) <= ?", now).map((r) => r.k); for (const k of rt) keys.push(k.slice(3));
    this.tx(() => this.run("delete from merch_meta where k glob 'br_ms:*' and k < ?", 'br_ms:' + utcDay(now - 40 * DAY)));
    // storage over 4 GB: also the oldest files of orders shipped more than 60 days ago with no open dispute (6.6)
    const total = Number(this.one('select coalesce(sum(bytes), 0) as b from merch_shards').b);
    if (total > Number(this.env.MERCH_STORE_SOFT || 4 * 2 ** 30)) {
      keys.push(...this.q("select i.file_key as k from merch_order_items i join merch_orders o on o.id = i.order_id join merch_parcels p on p.id = i.parcel_id where i.file_key is not null and p.shipped_at < ? and coalesce(o.dispute, '') != 'open' order by p.shipped_at limit 200", now - 60 * DAY).map((r) => r.k));
      this.tx(() => this.ownerMail(null, 'storage', 'Print storage is over 4 GB' + (total > 4.5 * 2 ** 30 ? ': time for Workers Paid' : '')));
    }
    this.tx(() => { for (const k of new Set(keys)) { this.run('update merch_order_items set file_key = null where file_key = ?', k); this.run('insert or ignore into merch_trash (key, at) values (?, ?)', k, now); } for (const k of rt) this.run('delete from merch_meta where k = ?', k); });
    await this.emptyTrash();
    this.tx(() => {
      const old = now - 730 * DAY; // buyer data and the dog: 24 months after close
      const closed = this.q("select id from merch_orders where status in ('shipped', 'cancelled', 'refunded', 'expired') and max(coalesce(refunded_at, 0), coalesce(updated_at, 0), coalesce((select max(shipped_at) from merch_parcels p where p.order_id = merch_orders.id), 0)) < ? and (email_hash is not null or exists (select 1 from merch_order_items i where i.order_id = merch_orders.id and i.recipe is not null))", old);
      for (const c of closed) { this.run('update merch_orders set email_hash = null where id = ?', c.id); this.run('update merch_order_items set name = null, recipe = null, print_link = null where order_id = ?', c.id); }
      this.run('delete from merch_events where at < ?', now - 90 * DAY);
      this.run("delete from merch_outbox where status in ('sent', 'failed', 'skipped') and created_at < ?", now - 90 * DAY);
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
      gift: this.giftCounts(), // counts only, never a code
      storage: { bytes: Number(this.one('select coalesce(sum(bytes), 0) as b from merch_shards').b), shards: Number(this.one('select count(*) as n from merch_shards').n) },
      ledger: { bytes, writes_today: Number(this.meta('w:' + day) || 0), writes_free_a_day: 100000 }, // S11: the ledger's own storage and write budget
      browser: this.browserStatus(now) }; // part 4: billed Browser Run time this UTC day against our budget, and whether the fallback has it
  }
}
