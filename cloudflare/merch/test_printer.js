// Merch part 9, C2 (docs/design/merch/SANDBOX.md part C): a stand-in printer for the TEST Worker only, the Worker
// "doodle-doggo-merch-test-printer". It answers the Printful calls provider_printful.js makes, in the shapes of test/printful/*.json (ported
// from test/fakes.mjs fakePrintful()), so the sandbox run can take orders before the owner's Printful key exists.
//   - No route, no domain, workers.dev off: it is reached only through the test Worker's service binding PROVIDER_FETCH, which only the test
//     entry has (tools/merch_test_build.mjs with MERCH_TEST_PRINTER=1). It never calls the network.
//   - One SQLite Durable Object (PRINTER -> TestPrinter, one instance 'printer'): its orders, by our external id.
//   - It never confirms: a confirmation is refused, as the test Worker never asks for one (provider_printful.js confirm()).
//   - It keeps no address: only the recipient's country (the costs need it). The name is read once, for the magic names below, and dropped.
//   - Its costs are our own estimates from catalog.js (unitCost, SHIP_COSTS), never Printful's prices: admin.js marks such orders "stand-in".
// What it refuses is chosen by the shipping name typed on Stripe's page (any case, spaces trimmed); any other name gives a normal draft:
//   "Test Refuse Address"  the recipient (400 "Recipient: ..."; also when the address form sends that name again)   -> held address (T2.2-36)
//   "Test Refuse Tee"      the tee lines ("Item n: ...")                                                             -> those lines refunded (T2.2-32)
//   "Test Refuse All"      every line                                                                                -> all refunded (T2.2-33)
//   "Test Printer Down"    the whole printer answers 503 to every call for 30 minutes (one outage per order)         -> retried (T2.2-34, T2.2-41)
//   "Test Refuse File"     a print file it "could not download" (every try)                                          -> retried as down, never a buyer email
// A missing name, first address line, city or country is refused like an address Printful cannot use.
import { nowOf, keyOf } from './util.js';
import { PRODUCTS, PF_PRODUCTS, PF_VARIANT_IDS, SHIP_COSTS, regionOf, unitCost } from './catalog.js';

export const PRINTER_NAME = 'doodle-doggo-merch-test-printer';
export const PRINTER_KEY = 'test-printer'; // the key the test entry passes when the stand-in is the printer; never a Printful key
export const DOWN_MS = 30 * 60e3;
const MAGIC = { 'test refuse address': 'address', 'test refuse tee': 'tee', 'test refuse all': 'all', 'test printer down': 'down', 'test refuse file': 'file' };
export const magicOf = (name) => MAGIC[String(name == null ? '' : name).trim().replace(/\s+/g, ' ').toLowerCase()] || null;

// The test entry's env for the ledger (tools/merch_test_build.mjs, MERCH_TEST_PRINTER=1). The stand-in is the printer ONLY on the test Worker
// (MERCH_TEST = "1"), with the PROVIDER_FETCH binding there, and with no real MERCH_PROVIDER_KEY set. Otherwise the binding is taken away, so a
// real key is never sent to the stand-in (it goes to Printful, as without C2), and the key 'test-printer' is never sent anywhere.
export function printerEnv(env) {
  const e = Object.assign({}, env), key = env ? keyOf(env.MERCH_PROVIDER_KEY) : ''; // R4-m2: trimmed, as provider_printful.js reads it
  if (env && env.MERCH_TEST === '1' && env.PROVIDER_FETCH && (!key || key === PRINTER_KEY)) { e.MERCH_PROVIDER_KEY = PRINTER_KEY; return e; }
  delete e.PROVIDER_FETCH;
  if (key === PRINTER_KEY) delete e.MERCH_PROVIDER_KEY;
  return e;
}

const J = (o, status) => new Response(JSON.stringify(o), { status: status || 200, headers: { 'content-type': 'application/json' } });
// Printful's two error shapes (test/printful): { code, result, error: { reason, message } } on the order routes; RFC 9457 problem details for a 5xx
const pfErr = (status, message, reason) => J({ code: status, result: message, error: { reason: reason || (status === 404 ? 'NotFound' : 'BadRequest'), message } }, status);
const pfProblem = (status, title) => J({ type: 'https://developers.printful.com/docs/v2-beta/#errors/internal-server-error', status, title, details: title }, status);
const PF_REV = Object.fromEntries(Object.entries(PF_VARIANT_IDS).map(([k, v]) => [String(v), k]));
const ourOf = (vid) => PF_REV[String(vid)] || null; // 'tee:navy:M'
const money = (c) => (c / 100).toFixed(2);
const baseOf = (ext) => String(ext || '').replace(/-[dr]\d+$/, ''); // <order>-d1 (a new draft after a delete) is still that order

export class TestPrinter {
  constructor(ctx, env) { this.ctx = ctx; this.sql = ctx.storage.sql; this.env = env || {}; this.ready = false; }
  now() { return nowOf(this.env); }
  init() {
    if (this.ready) return;
    this.sql.exec(`create table if not exists pf_orders (id integer primary key, ext text not null, body text not null, gone integer not null default 0, created_at integer not null);
create index if not exists pf_orders_ext on pf_orders (ext, id);
create table if not exists pf_meta (k text primary key, v text);
create table if not exists pf_downs (base text primary key, at integer not null);`);
    this.ready = true;
  }
  rows(q, ...b) { return this.sql.exec(q, ...b).toArray(); }
  meta(k) { const r = this.rows('select v from pf_meta where k = ?', k)[0]; return r ? r.v : null; }
  setMeta(k, v) { this.sql.exec('insert or replace into pf_meta (k, v) values (?, ?)', k, String(v)); }
  nextId() { const n = Number(this.meta('n') || 93100000) + 1; this.setMeta('n', n); return n; }
  load(id) { const r = this.rows('select body, gone from pf_orders where id = ?', Number(id))[0]; return r && !r.gone ? JSON.parse(r.body) : null; }
  byExt(ext) { const r = this.rows('select id, gone from pf_orders where ext = ? order by id desc limit 1', ext)[0]; return r && !r.gone ? this.load(r.id) : null; }
  save(o) { this.sql.exec('update pf_orders set body = ? where id = ?', JSON.stringify(o), Number(o.id)); }

  // the v2 Order, as order_create_draft.json (only the fields the stand-in has; never an invented one)
  out(o) {
    return { id: o.id, external_id: o.external_id, store_id: 1, shipping: 'STANDARD', status: o.status, created_at: o.created_at, updated_at: o.updated_at || o.created_at,
      recipient: { country_code: o.country },
      costs: { calculation_status: 'done', currency: 'USD', subtotal: o.costs.subtotal, discount: '0.00', shipping: o.costs.shipping, digitization: '0.00', additional_fee: '0.00',
        fulfillment_fee: '0.00', retail_delivery_fee: '0.00', vat: '0.00', tax: '0.00', total: money(Math.round(Number(o.costs.subtotal) * 100) + Math.round(Number(o.costs.shipping) * 100)) },
      retail_costs: o.retail_costs || null,
      order_items: o.items.map((i) => ({ id: i.id, type: 'order_item', source: 'catalog', catalog_variant_id: i.catalog_variant_id, external_id: i.external_id, quantity: i.quantity,
        name: i.name, price: i.price, retail_price: i.retail_price, currency: 'USD', retail_currency: 'USD' })),
      _links: { self: { href: 'https://api.printful.com/v2/orders/' + o.id } } };
  }
  // the recipient Printful would refuse, by the magic name or a missing field: the old-style 400 that starts "Recipient:" (order_recipient_invalid.json)
  badRecipient(rc) {
    if (!rc || typeof rc !== 'object') return pfErr(400, 'Recipient: Recipient is required');
    if (magicOf(rc.name) === 'address') return pfErr(400, 'Recipient: Invalid state `ZZ` select a valid state for country `' + String(rc.country_code || 'US').slice(0, 2) + '`');
    for (const [k, w] of [['name', 'Name'], ['address1', 'Address'], ['city', 'City'], ['country_code', 'Country']]) if (!rc[k] || !String(rc[k]).trim()) return pfErr(400, 'Recipient: ' + w + ' cannot be blank.');
    return null;
  }

  async fetch(req) {
    this.init();
    // only the test Worker's own key: a real Printful key (or none) is refused like Printful refuses a bad one, and never kept or logged
    if (req.headers.get('authorization') !== 'Bearer ' + PRINTER_KEY) return pfErr(401, 'Malformed Authorization header.');
    const u = new URL(req.url), m = req.method, now = this.now();
    if (u.host !== 'api.printful.com') return pfErr(404, 'Not found');
    const v = u.pathname.startsWith('/v2/') ? 2 : 1, p = v === 2 ? u.pathname.slice(3) : u.pathname;
    let body = null; if (m !== 'GET' && m !== 'DELETE') { try { body = JSON.parse((await req.text()) || 'null'); } catch (e) { return pfErr(400, 'Malformed JSON'); } }
    if (now < Number(this.meta('down_until') || 0)) return pfProblem(503, 'Service Unavailable'); // "Test Printer Down": every call, every order
    let mm;
    if (v === 2 && m === 'GET' && (mm = /^\/catalog-products\/(\d+)\/prices$/.exec(p))) { // catalog_prices_*.json: our own unit costs
      const pid = Number(mm[1]); if (!Object.values(PF_PRODUCTS).includes(pid)) return pfErr(404, 'Not found');
      const variants = Object.entries(PF_VARIANT_IDS).filter(([k]) => PF_PRODUCTS[k.split(':')[0]] === pid).map(([k, id]) => {
        const [prod, , size] = k.split(':'), c = unitCost(PRODUCTS[prod], size);
        return { id, techniques: [{ technique_key: prod === 'mug' ? 'sublimation' : 'dtg', technique_display_name: prod === 'mug' ? 'Sublimation' : 'DTG printing', price: money(c), discounted_price: money(c) }] };
      });
      return J({ data: { currency: 'USD', product: { id: pid, placements: [] }, variants }, paging: { total: variants.length, offset: 0, limit: 100 }, _links: {} });
    }
    if (v === 2 && m === 'POST' && p === '/shipping-rates') { // shipping_rates_usd.json: catalog.js SHIP_COSTS
      const it = body && Array.isArray(body.order_items) && body.order_items[0], our = it && ourOf(it.catalog_variant_id), cc = body && body.recipient && body.recipient.country_code;
      if (!our || !cc) return pfErr(400, 'Invalid request');
      const fe = SHIP_COSTS[regionOf(cc)][PRODUCTS[our.split(':')[0]].group], q = Math.max(1, Number(it.quantity) || 1);
      return J({ data: [{ shipping: 'STANDARD', shipping_method_name: 'Flat Rate', rate: money(fe[0] + (q - 1) * fe[1]), currency: 'USD', shipments: [] }], extra: [] });
    }
    if (v === 2 && m === 'POST' && p === '/orders') return this.create(body, now);
    if (v === 1 && m === 'DELETE' && (mm = /^\/orders\/(\d+)$/.exec(p))) { // order_cancel_v1_ok.json: "Cancels pending order or draft"
      const o = this.load(mm[1]); if (!o) return pfErr(404, 'Not found');
      if (o.status !== 'draft') return pfErr(400, 'This order can not be cancelled');
      o.status = 'canceled'; o.updated_at = new Date(now).toISOString(); this.save(o);
      return J({ code: 200, result: { id: o.id, external_id: o.external_id, store: 1, status: 'canceled', shipping: 'STANDARD', items: [], shipments: [] } });
    }
    if (v === 2 && (mm = /^\/orders\/(@?)([^/]+)(\/confirmation|\/shipments)?$/.exec(p))) {
      const o = mm[1] ? this.byExt(decodeURIComponent(mm[2])) : /^\d+$/.test(mm[2]) ? this.load(mm[2]) : null;
      if (mm[3] === '/shipments' && m === 'GET') return o ? J({ data: [], paging: { total: 0, offset: 0, limit: 100 } }) : pfErr(404, 'Not found'); // never a parcel
      if (mm[3] === '/confirmation') return o ? pfErr(400, 'Order cannot be confirmed: this is the test printer') : pfErr(404, 'Not found'); // never confirms
      if (mm[3]) return pfErr(404, 'Not found');
      if (m === 'GET') return o ? J({ data: this.out(o) }) : pfErr(404, 'Not found');
      if (!o) return pfErr(404, 'Not found');
      if (m === 'PATCH') { // order_patch_recipient.json; a draft only (order_not_editable.json)
        if (o.status !== 'draft') return pfErr(400, 'The order is no longer editable');
        const rc = Object.assign({ country_code: o.country }, (body && body.recipient) || {}), bad = this.badRecipient(rc); if (bad) return bad;
        o.country = String(rc.country_code);
        o.updated_at = new Date(now).toISOString(); this.save(o); return J({ data: this.out(o) });
      }
      if (m === 'DELETE') { // order_delete_draft.json: 204; a draft, failed or canceled order
        if (!['draft', 'failed', 'canceled'].includes(o.status)) return pfErr(400, 'Order cannot be deleted');
        this.sql.exec('update pf_orders set gone = 1 where id = ?', Number(o.id)); return new Response(null, { status: 204 });
      }
    }
    return pfErr(404, 'Not found');
  }

  create(b, now) {
    if (!b || typeof b !== 'object' || typeof b.external_id !== 'string' || !b.external_id || !Array.isArray(b.order_items) || !b.order_items.length) return pfErr(400, 'Invalid request');
    const ext = b.external_id, rc = b.recipient || {}, magic = magicOf(rc.name);
    if (magic === 'down' && !this.rows('select at from pf_downs where base = ?', baseOf(ext)).length) { // one 30-minute outage per order
      this.sql.exec('insert into pf_downs (base, at) values (?, ?)', baseOf(ext), now); this.setMeta('down_until', now + DOWN_MS);
      return pfProblem(503, 'Service Unavailable');
    }
    const bad = this.badRecipient(rc); if (bad) return bad;
    if (magic === 'file') return pfErr(400, 'Item 0: Could not download the print file from the address given in `/order_items/0/placements/0/layers/0/url`');
    const items = b.order_items.map((i) => ({ i, our: ourOf(i && i.catalog_variant_id) }));
    if (items.some((x) => !x.our || !(Number(x.i.quantity) >= 1))) return pfErr(400, 'Item ' + items.findIndex((x) => !x.our || !(Number(x.i.quantity) >= 1)) + ': This product variant is not available');
    const refused = items.map((x, n) => (magic === 'all' || (magic === 'tee' && x.our.startsWith('tee:')) ? 'Item ' + n + ': This product variant is out of stock' : null)).filter(Boolean);
    if (refused.length) return pfErr(400, refused.join('; ')); // order_item_refused.json
    if (this.byExt(ext)) return pfErr(400, 'The external_id provided already exists and cannot be used'); // order_external_id_in_use.json
    const cc = String(rc.country_code), region = regionOf(cc), groups = {}; let sub = 0;
    for (const { i, our } of items) { const [prod, , size] = our.split(':'), P = PRODUCTS[prod]; sub += unitCost(P, size) * Number(i.quantity); groups[P.group] = (groups[P.group] || 0) + Number(i.quantity); }
    let ship = 0; for (const g of Object.keys(groups)) { const fe = SHIP_COSTS[region][g]; ship += fe[0] + (groups[g] - 1) * fe[1]; }
    const id = this.nextId(), at = new Date(now).toISOString();
    const o = { id, external_id: ext, status: 'draft', created_at: at, updated_at: at, country: cc, retail_costs: b.retail_costs || null, costs: { subtotal: money(sub), shipping: money(ship) },
      items: items.map(({ i, our }) => { const [prod, , size] = our.split(':'); return { id: this.nextId(), external_id: String(i.external_id || ''), catalog_variant_id: i.catalog_variant_id, quantity: Number(i.quantity),
        name: String(i.name || ''), price: money(unitCost(PRODUCTS[prod], size)), retail_price: i.retail_price == null ? null : String(i.retail_price) }; }) };
    this.sql.exec('insert into pf_orders (id, ext, body, gone, created_at) values (?, ?, ?, 0, ?)', id, ext, JSON.stringify(o), now);
    return J({ data: this.out(o) });
  }
}

// The Worker: no route of its own (workers.dev off, no domain); the test Worker's PROVIDER_FETCH binding calls this with Printful's URLs.
export default { fetch: (req, env) => env.PRINTER.get(env.PRINTER.idFromName('printer')).fetch(req) };
