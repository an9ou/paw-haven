// Part 9, C2: the stand-in printer for the TEST Worker only (cloudflare/merch/test_printer.js; docs/design/merch/SANDBOX.md part C).
// Node rows: the stand-in against the recorded Printful replies (test/printful), the ledger with the stand-in as the test entry wires it
// (printerEnv), each magic shipping name, a real key, the live Worker, the build and the deploy script's dry run. Miniflare rows (workerd): the
// built test bundle with the stand-in as a second Worker behind the PROVIDER_FETCH service binding. Nothing here reaches the network.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { T, ok, eq, world, mug, tee, PP, ROOT, MIN, HOUR, DAY } from './harness.mjs';
import { namespace, fakeStripe, fakeRender, fakeMail, require } from './fakes.mjs';
import standin, { TestPrinter, printerEnv, magicOf, PRINTER_KEY, PRINTER_NAME, DOWN_MS } from '../test_printer.js';
import { MerchLedger } from '../ledger.js';
import * as pf from '../provider_printful.js';
import { PF_VARIANT_IDS, SHIP_COSTS, PRODUCTS, unitCost } from '../catalog.js';

const DIR = path.join(ROOT, 'cloudflare', 'merch', 'test', 'printful');
const fx = (n) => JSON.parse(fs.readFileSync(path.join(DIR, n + '.json'), 'utf8'));
const NAME = 'doodle-doggo-merch-test';
const st = (w, id) => [w.order(id).status, w.order(id).hold];
const refunded = (w) => w.stripe.refunds.reduce((a, x) => a + x.amount, 0);

// the stand-in Worker in Node: its default fetch over a Durable Object namespace on node:sqlite; the clock is the world's
function standIn(clock) {
  const env = { NOW: () => clock.t }; env.PRINTER = namespace(TestPrinter, env);
  const S = { calls: [], answers: [], env };
  S.fetch = async (url, init) => {
    const r = new Request(url, init), u = new URL(r.url);
    S.calls.push({ m: r.method, path: u.pathname, auth: r.headers.get('authorization') });
    const res = await standin.fetch(r, env), text = res.status === 204 ? '' : await res.clone().text();
    S.answers.push({ m: r.method, path: u.pathname, status: res.status, body: text ? JSON.parse(text) : null });
    return res;
  };
  S.get = async (ref) => { const r = await standin.fetch(new Request('https://api.printful.com/v2/orders/' + ref, { headers: { authorization: 'Bearer ' + PRINTER_KEY } }), env); return { status: r.status, json: r.status === 204 ? null : await r.json() }; };
  return S;
}
// a world as the test entry builds it (MERCH_TEST_PRINTER=1): the test Worker's variables, the ledger wrapped by printerEnv, PROVIDER_FETCH ->
// the stand-in, no MERCH_PROVIDER_KEY (unless o.env sets one)
async function c2world(o) {
  o = o || {};
  const w = await world({ env: Object.assign({ MERCH_TEST: '1', MERCH_PROVIDER_MODE: 'draft', MERCH_PROVIDER_KEY: undefined, MERCH_PROVIDER_WEBHOOK_SECRET: undefined, PROVIDER_FETCH: undefined }, o.env || {}) });
  w.sp = standIn(w.clock);
  if (o.binding !== false) w.env.PROVIDER_FETCH = w.sp.fetch;
  class LedgerT extends MerchLedger { constructor(state, env) { super(state, printerEnv(env)); } }
  if (o.wrap !== false) w.env.LEDGER = namespace(LedgerT, w.env);
  return w;
}
// the buyer pays on Stripe's page and types this shipping name
async function paidAs(w, lines, name, country) {
  const id = await w.newOrder(lines, country), cs = w.stripe.pay(w.sid(id), country ? { country } : undefined);
  cs.collected_information.shipping_details.name = name;
  const r = await w.hook('checkout.session.completed', { id: cs.id, object: 'checkout.session', payment_status: cs.payment_status, metadata: cs.metadata });
  ok(r.status === 200, 'pay webhook ' + r.status + ' ' + r.text); return id;
}
// every key the stand-in answers is one Printful's recorded reply has (it never invents a field), of the same type where the reply has a value
function within(a, b, where) {
  if (Array.isArray(a)) { ok(Array.isArray(b), where + ': an array in the fixture'); if (a.length && b.length) within(a[0], b[0], where + '[0]'); return; }
  if (!a || typeof a !== 'object') return;
  ok(b && typeof b === 'object', where + ': an object in the fixture');
  for (const k of Object.keys(a)) {
    ok(k in b, where + '.' + k + ': not in the recorded reply');
    if (a[k] !== null && b[k] !== null && b[k] !== undefined) { ok(typeof a[k] === typeof b[k], where + '.' + k + ': ' + typeof a[k] + ' where the reply has ' + typeof b[k]); within(a[k], b[k], where + '.' + k); }
  }
}
const sh = (ans, name, where, status) => { const f = fx(name); eq(ans.status, status || f.status, (where || name) + ': status'); within(ans.body, f.body, where || name); };

export async function testprinter() {
  console.log('--- part 9 C2: the stand-in printer for the test Worker (test_printer.js)');

  await T('C2-shape', 'the stand-in answers every call the adapter makes in the shapes of test/printful (create, GET by id and @external_id, shipments, PATCH, v2 and v1 delete, prices, rates, every error), and the adapter reads each one', async () => {
    const clock = { t: Date.parse('2026-12-01T10:00:00+09:00') }, S = standIn(clock);
    const env = { PROVIDER_FETCH: S.fetch, MERCH_PROVIDER_KEY: PRINTER_KEY, MERCH_TEST: '1', MERCH_PROVIDER_MODE: 'draft', MERCH_PF_POLL_MS: '0', MERCH_TIMEOUT_MS: '2000' };
    const last = () => S.answers[S.answers.length - 1], ext = 'mo_' + 'S'.repeat(22);
    const o = { id: ext, subtotal: 4698, ship_fee: 499, tax: 0, country: 'US' };
    const L2 = [{ line: 1, product: 'mug', provider_variant: 'pf:mug:white', qty: 1, refunded_qty: 0, unit: 1999 }, { line: 2, product: 'tee', provider_variant: 'pf:tee:navy:M', qty: 1, refunded_qty: 0, unit: 2699 }];
    const URLS = { 1: 'https://merch-api.test/merch/file/k1/1/aa.png', 2: 'https://merch-api.test/merch/file/k2/1/bb.png' };
    const RC = (name) => ({ name, address1: '1 Example Street', address2: '', city: 'Exampleton', state_code: 'CA', zip: '90001', country_code: 'US' });
    eq((await pf.get(env, ext)).kind, 'not_found', 'GET @external_id of nothing'); sh(last(), 'order_not_found', 'GET @ext 404');
    const c = await pf.createDraft(env, o, L2, RC('Pat Example'), URLS, ext); sh(last(), 'order_create_draft', 'create');
    ok(c.ok && /^\d+$/.test(c.data.id) && c.data.external_id === ext && c.data.status === 'draft' && c.data.items.map((i) => i.external_id).join() === ext + '_1,' + ext + '_2', 'createDraft: ' + JSON.stringify(c));
    eq(c.data.costs, { items: unitCost(PRODUCTS.mug) + unitCost(PRODUCTS.tee, 'M'), shipping: SHIP_COSTS.us.mug[0] + SHIP_COSTS.us.tee[0], tax: 0 }, 'the costs: catalog.js unit costs and Standard rates (our own estimates, never Printful prices)');
    const sent = S.calls.filter((x) => x.m === 'POST'); ok(sent.every((x) => x.auth === 'Bearer ' + PRINTER_KEY), 'the adapter sent the stand-in key');
    const g1 = await pf.get(env, ext); ok(g1.ok && g1.data.id === c.data.id, 'GET by @external_id'); sh(last(), 'order_create_draft', 'GET order');
    // (the adapter reads no shipments of a draft; the route answers as Printful's does, with none)
    await S.fetch('https://api.printful.com/v2/orders/' + c.data.id + '/shipments?limit=100', { headers: { Authorization: 'Bearer ' + PRINTER_KEY } }); sh(last(), 'order_shipments', 'shipments');
    eq(last().body.data, [], 'never a parcel');
    const g2 = await pf.get(env, c.data.id); ok(g2.ok && g2.data.external_id === ext, 'GET by id');
    const u = await pf.update(env, c.data.id, RC('Pat Example')); ok(u.ok && u.data.status === 'draft', 'PATCH the recipient'); sh(last(), 'order_patch_recipient', 'PATCH');
    const dup = await standin.fetch(new Request('https://api.printful.com/v2/orders', { method: 'POST', headers: { authorization: 'Bearer ' + PRINTER_KEY }, body: JSON.stringify({ external_id: ext, recipient: RC('Pat Example'), order_items: [{ catalog_variant_id: 1320, quantity: 1, external_id: ext + '_1' }] }) }), S.env);
    sh({ status: dup.status, body: await dup.json() }, 'order_external_id_in_use', 'an external id in use');
    eq((await pf.createDraft(env, o, L2, RC('Pat Example'), URLS, ext)).ok, true, 'a create for an id it has: the adapter adopts the same draft');
    const cf = await pf.confirm(Object.assign({}, env, { MERCH_PROVIDER_MODE: 'live' }), c.data.id); eq([cf.ok, cf.kind, cf.why], [false, 'cannot', 'test'], 'the adapter never confirms on the test Worker');
    const cr = await standin.fetch(new Request('https://api.printful.com/v2/orders/' + c.data.id + '/confirmation', { method: 'POST', headers: { authorization: 'Bearer ' + PRINTER_KEY } }), S.env);
    eq([cr.status, pf.errKind({ status: cr.status, data: await cr.json() }).kind], [400, 'cannot'], 'and the stand-in itself refuses a confirmation');
    // v1 delete (the late cancel of a confirmed order: only a draft here), then the v2 delete
    const v1 = await standin.fetch(new Request('https://api.printful.com/orders/' + c.data.id, { method: 'DELETE', headers: { authorization: 'Bearer ' + PRINTER_KEY } }), S.env);
    sh({ status: v1.status, body: await v1.json() }, 'order_cancel_v1_ok', 'v1 delete');
    eq((await pf.deleteDraft(env, c.data.id)).ok, true, 'v2 delete of the canceled draft'); sh(last(), 'order_delete_draft', 'v2 delete'); ok(last().body === null, '204, no body');
    eq((await pf.get(env, ext)).kind, 'not_found', 'gone after the delete');
    const c2 = await pf.createDraft(env, o, L2, RC('Pat Example'), URLS, ext + '-d1'); ok(c2.ok, 'a new draft under <order>-d1');
    eq((await pf.cancel(env, c2.data.id)).ok, true, 'the late cancel of a draft (v2 delete)');
    const pt = await pf.update(env, c.data.id, RC('Pat Example')); eq(pt.kind, 'not_found', 'PATCH of a deleted draft');
    // the errors, each as the adapter reads it
    const kinds = [];
    for (const [nm, lines, fixture] of [['Test Refuse Address', L2, 'order_recipient_invalid'], ['Test Refuse Tee', L2, 'order_item_refused'], ['Test Refuse All', L2, 'order_item_refused'], ['Test Refuse File', L2, 'order_item_refused'], ['', L2, 'order_recipient_invalid']]) {
      const r = await pf.createDraft(env, o, lines, RC(nm), URLS, 'mo_' + (nm.replace(/\W/g, '') + 'X'.repeat(22)).slice(0, 22)); sh(last(), fixture, 'create, name "' + nm + '"');
      kinds.push(r.kind + (r.items ? ':' + r.items.map((i) => i.slice(-1)).join('') : '') + (r.why ? ':' + r.why : ''));
    }
    eq(kinds, ['address', 'refused:2', 'refused:12', 'down:file', 'address'], 'address, the tee line, both lines, a file problem ("down", never the buyer\'s), a missing name');
    const nd = await pf.createDraft(env, o, L2, RC('Pat Example'), URLS, 'mo_' + 'N'.repeat(22)), pa = await pf.update(env, nd.data.id, RC('test  refuse ADDRESS '));
    eq(pa.kind, 'address', 'PATCH with the magic name (any case, spaces): address'); sh(last(), 'order_recipient_invalid', 'PATCH refused');
    await standin.fetch(new Request('https://api.printful.com/v2/orders/' + nd.data.id, { method: 'DELETE', headers: { authorization: 'Bearer ' + PRINTER_KEY } }), S.env);
    const rn = await standin.fetch(new Request('https://api.printful.com/v2/orders/' + nd.data.id, { method: 'GET', headers: { authorization: 'Bearer ' + PRINTER_KEY } }), S.env); eq(rn.status, 404, 'a deleted draft: 404');
    // the nightly cost read: every variant priced, every region's rates, in the recorded shapes
    const cc = await pf.catalogCosts(env); ok(cc.ok, 'catalogCosts ' + JSON.stringify(cc).slice(0, 200));
    eq(Object.keys(cc.data.variants).sort(), Object.keys(PF_VARIANT_IDS).sort(), 'every variant priced'); eq(cc.data.missing, [], 'none missing');
    for (const [reg, g] of Object.entries(SHIP_COSTS)) for (const grp of Object.keys(g).filter((x) => ['mug', 'tee'].includes(x))) eq(cc.data.ship[reg + ':' + grp], SHIP_COSTS[reg][grp], 'the rates ' + reg + ':' + grp);
    sh(S.answers.find((a) => a.path === '/v2/catalog-products/19/prices'), 'catalog_prices_mug'); sh(S.answers.find((a) => a.path === '/v2/catalog-products/71/prices'), 'catalog_prices_tee');
    sh(S.answers.find((a) => a.path === '/v2/shipping-rates'), 'shipping_rates_usd');
    // down, and a key that is not the stand-in's
    S.env.PRINTER.get('printer').obj.setMeta('down_until', clock.t + 1000); const dn = await pf.get(env, ext); eq([dn.kind, dn.status], ['down', 503], 'down: 503'); sh(last(), 'server_error_500', '503 problem details (the 5xx shape)', 503);
    clock.t += 1001; eq((await pf.get(env, ext)).kind, 'not_found', 'back after it');
    const n0 = S.calls.length, bad = await pf.get(Object.assign({}, env, { MERCH_TEST: '1', MERCH_PROVIDER_KEY: 'pf_real_key_dummy' }), ext);
    eq(bad.kind, 'not_set_up', 'another key: refused (401), as Printful refuses a bad key'); sh(last(), 'unauthorized_401', '401');
    ok(S.calls.length === n0 + 1, 'one call');
    const nm = await standin.fetch(new Request('https://api.printful.com/v2/orders/' + nd.data.id, { method: 'PATCH', headers: { authorization: 'Bearer ' + PRINTER_KEY }, body: '{}' }), S.env);
    eq(nm.status, 404, 'PATCH of a gone draft');
    const keep = JSON.stringify(S.env.PRINTER.get('printer').obj.rows('select body from pf_orders'));
    ok(!/Example Street|Exampleton|90001|Pat Example|Refuse/i.test(keep), 'no address and no name is kept: only the country ' + keep.slice(0, 160));
    eq([magicOf(' Test   Printer DOWN '), magicOf('Test Refuse'), magicOf(null), magicOf('Test Refuse File')], ['down', null, null, 'file'], 'magic names: exact words, any case and spacing');
  });

  await T('C2-flow', 'the test Worker with the stand-in (no Printful key): paid, drafted at the stand-in inside the hour, then held draft_mode; never confirmed; a cancel deletes the draft; merch.sh show and report say STAND-IN', async () => {
    const w = await c2world();
    const cat = await w.call('GET', '/merch/catalog'); ok(cat.json.shut === false, 'the catalog is open with the stand-in as the printer ' + cat.text.slice(0, 120));
    const id = await paidAs(w, [mug(0), tee(1)], 'Pat Example'); await w.advance(5 * MIN);
    ok(w.order(id).provider_order && w.lines(id).every((l) => l.status === 'drafted'), 'drafted: ' + w.lines(id).map((l) => l.status));
    const g = await w.sp.get('@' + id); eq([g.status, g.json.data.status, g.json.data.order_items.length], [200, 'draft', 2], 'the stand-in holds the draft');
    eq(w.order(id).provider_cost, w.order(id).cost_est, 'its cost is our own estimate (so never a cost hold)');
    await w.advance(62 * MIN); eq(st(w, id), ['held', 'draft_mode'], 'past the hour: held draft_mode');
    await w.advance(DAY); eq(st(w, id), ['held', 'draft_mode'], 'stays held');
    ok(!w.sp.calls.some((c) => /confirm/.test(c.path)), 'never a confirmation call');
    const show = await w.admin('GET', 'order/' + id); ok(/^STAND-IN/.test(show.json.printer), 'merch.sh show: ' + show.json.printer);
    const rep = await w.admin('GET', 'report'); ok(/^STAND-IN/.test(rep.json.printer), 'merch.sh report: ' + rep.json.printer);
    const j = await paidAs(w, [mug(2)], 'Pat Example'); await w.advance(2 * MIN); const po = w.order(j).provider_order; ok(po, 'second drafted');
    const x = await w.call('POST', '/merch/order/' + j + '/cancel', {}); eq([x.json.status, x.json.refund], ['cancelled', 'done'], 'cancel in the hour');
    eq((await w.sp.get(po)).status, 404, 'its draft deleted at the stand-in');
    ok(w.sp.calls.every((c) => c.auth === 'Bearer ' + PRINTER_KEY), 'every call carried the stand-in key, nothing else');
    const live = await world(); ok(!/STAND/.test((await live.admin('GET', 'report')).json.printer), 'with a Printful key: "printful"');
  });

  await T('C2-address', 'F-1 / T2.2-36: "Test Refuse Address": held address, "We need your address"; the same name in the form is refused again; another name: drafted, then held draft_mode; F-2: another country 400 other_country', async () => {
    const w = await c2world(); const id = await paidAs(w, [mug(0)], 'Test Refuse Address'); await w.advance(1);
    eq(st(w, id), ['held', 'address'], 'held address'); ok(w.mails(/_address$/).length === 1, 'the address email'); ok((await w.call('GET', '/merch/order/' + id)).json.hold === 'address', 'the page shows the form');
    const form = (name, country) => w.call('POST', '/merch/order/' + id + '/address', { name, line1: '2 Example Road', city: 'Exampleton', state: 'CA', postal: '90001', country: country || 'US' });
    const again = await form('Test Refuse Address'); eq([again.status, again.json.error], [400, 'bad_address'], 'the magic name again: refused');
    const fr = await form('Pat Example', 'CA'); eq([fr.status, fr.json.error], [400, 'other_country'], 'another country: other_country (F-2)');
    const good = await form('Pat Example'); ok(good.status === 200 && w.order(id).provider_order, 'a good fix: drafted ' + good.text);
    await w.advance(62 * MIN); eq(st(w, id), ['held', 'draft_mode'], 'back on track: held draft_mode');
    const k = await paidAs(w, [mug(1)], 'Test Refuse Address'); await w.advance(1);
    const r = await w.call('POST', '/merch/order/' + k + '/refund', {}); ok(r.status === 200 && w.order(k).status === 'refunded', '"Refund me instead": refunded ' + r.text);
  });

  await T('C2-tee', 'F-3 / T2.2-32: "Test Refuse Tee", a mug + a tee: the tee rejected and refunded, the variant off, the mug drafted', async () => {
    const w = await c2world(); const id = await paidAs(w, [mug(0), tee(1)], 'Test Refuse Tee'); await w.advance(30e3);
    eq(w.lines(id).map((l) => l.status), ['drafted', 'rejected'], 'lines'); ok(refunded(w) === 2699 && (await w.sp.get(w.order(id).provider_order)).json.data.order_items.length === 1, 'drafted without it, the tee refunded');
    ok(w.one("select on_flag from merch_variants where id = 'tee:navy:M'").on_flag === 0 && w.owner(/provider_reject/).length === 1 && w.mails(/_reject_2$/).length === 1, 'variant off, owner and buyer told');
    await w.advance(62 * MIN); eq(st(w, id), ['held', 'draft_mode'], 'the mug: held draft_mode');
  });

  await T('C2-all', 'F-4 / T2.2-33: "Test Refuse All": every line refused: refunded in full, shipping included; owner email', async () => {
    const w = await c2world(); const id = await paidAs(w, [mug(0), tee(1)], 'Test Refuse All', 'CA'); await w.advance(30e3);
    eq(w.order(id).status, 'refunded', 'refunded'); ok(refunded(w) === w.order(id).total && w.order(id).ship_fee === 799, 'all of it, shipping too'); ok(w.owner(/provider_reject/).length === 1, 'owner email');
  });

  await T('C2-down', 'F-5 / T2.2-34, T2.2-41: "Test Printer Down": the whole stand-in answers 503 for 30 minutes; the order backs off (1, 5, 15, 60 min) and is drafted on the try after the outage; a drafted order cancelled meanwhile is refunded at once and its draft deleted on a retry', async () => {
    const w = await c2world(); const b = await paidAs(w, [mug(1)], 'Pat Example'); await w.advance(MIN); const pb = w.order(b).provider_order; ok(pb, 'B drafted before the outage');
    const a = await paidAs(w, [mug(0)], 'Test Printer Down'); await w.advance(1); const t0 = w.clock.t;
    eq([w.order(a).last_error, w.order(a).provider_order], ['down', null], 'A: the first create starts the outage');
    const down = w.sp.env.PRINTER.get('printer').obj.meta('down_until'); eq(Number(down) - t0 <= DOWN_MS && Number(down) - t0 > DOWN_MS - MIN, true, 'down for 30 minutes');
    const x = await w.call('POST', '/merch/order/' + b + '/cancel', {}); eq([x.json.status, x.json.refund], ['cancelled', 'done'], 'B cancelled while down: refunded at once');
    eq((await w.sp.get(pb)).status, 503, 'B\'s draft is still there (the stand-in is down)');
    const waits = []; for (let i = 0; i < 4 && !w.order(a).provider_order; i++) { const t = w.order(a).next_try_at; waits.push(Math.round((t - w.clock.t) / MIN)); await w.advance(t - w.clock.t); }
    eq(waits, [1, 5, 15, 60], 'backoff 1, 5, 15, 60 min');
    ok(w.order(a).provider_order && w.lines(a)[0].status === 'drafted', 'A drafted on the first try after the outage: ' + st(w, a) + ' ' + w.order(a).last_error);
    ok(w.clock.t - t0 > DOWN_MS, 'after the 30 minutes');
    eq(st(w, a), ['held', 'draft_mode'], 'A, past the hour when drafted: straight to held draft_mode (never held provider: the outage ended inside the hour)');
    eq((await w.sp.get(pb)).status, 404, 'B\'s draft deleted on a retry after the outage');
    ok(w.order(b).draft_del === 0 && w.order(b).status === 'cancelled', 'B: cancelled, nothing left to delete');
    ok(!w.mails(/_address$|_reject_/).length, 'no buyer email about the printer');
    const c = await paidAs(w, [mug(2)], 'Test Printer Down'); await w.advance(5 * MIN); ok(w.order(c).provider_order === null || w.order(c).provider_order === undefined, 'another order named so: a new outage of its own');
  });

  await T('C2-file', 'F-6: "Test Refuse File": retried as down (why file), never a buyer email; past the hour held provider; the owner hears at 24 h about the print file; merch.sh refund ends it', async () => {
    const w = await c2world(); const id = await paidAs(w, [mug(0)], 'Test Refuse File'); await w.advance(1);
    eq([w.order(id).status, w.order(id).last_error], ['paid', 'file'], 'a file problem: down, marked file');
    await w.advance(3 * HOUR); eq([...st(w, id), w.order(id).why], ['held', 'provider', 'down'], 'past the hour: held provider');
    await w.advance(DAY); const om = w.owner(/provider_down/); ok(om.length === 1 && /print file/.test(om[0].text), 'owner email at 24 h names the print file');
    ok(!w.mails(/^me_.*_(address|reject_\d+|refund\w*)$/).length, 'never a buyer email about it');
    const r = await w.admin('POST', 'order/' + id + '/refund', { line: 1, reason: 'test file' }); ok(r.status === 200 && w.order(id).status === 'refunded', 'merch.sh refund: ' + r.text);
  });

  await T('C2-realkey', 'a real MERCH_PROVIDER_KEY turns the stand-in off: printerEnv takes the binding away (the key is never sent to it); the stand-in refuses any key but its own; with no binding or not on the test Worker, the word test-printer is dropped', async () => {
    const f = async () => new Response('{}');
    const cases = [
      [{ MERCH_TEST: '1', PROVIDER_FETCH: f }, PRINTER_KEY, true],
      [{ MERCH_TEST: '1', PROVIDER_FETCH: f, MERCH_PROVIDER_KEY: PRINTER_KEY }, PRINTER_KEY, true],
      [{ MERCH_TEST: '1', PROVIDER_FETCH: f, MERCH_PROVIDER_KEY: 'pf_real_dummy' }, 'pf_real_dummy', false],
      [{ PROVIDER_FETCH: f }, undefined, false],
      [{ MERCH_TEST: '0', PROVIDER_FETCH: f, MERCH_PROVIDER_KEY: PRINTER_KEY }, undefined, false],
      [{ MERCH_TEST: '1', MERCH_PROVIDER_KEY: PRINTER_KEY }, undefined, false]];
    for (const [env, key, bound] of cases) { const e = printerEnv(env); eq([e.MERCH_PROVIDER_KEY, !!e.PROVIDER_FETCH], [key, bound], JSON.stringify(Object.keys(env)) + ' ' + env.MERCH_PROVIDER_KEY); ok(env.PROVIDER_FETCH === f || !('PROVIDER_FETCH' in env), 'the env itself is never changed'); }
    const w = await c2world({ env: { MERCH_PROVIDER_KEY: 'pf_real_key_dummy' } });
    ok((await w.call('GET', '/merch/catalog')).json.shut === true, 'Node: a real key and no stand-in = no printer here (no global path in Node): shut');
    const c = await w.checkout([mug(0)]); eq([c.status, c.json.error], [503, 'merch_closed'], 'checkout refused');
    await w.advance(HOUR); eq(w.sp.calls.length, 0, 'the stand-in was never called with the real key');
    // the stand-in itself: any other key is a 401 that changes nothing
    const S = standIn({ t: Date.now() });
    for (const auth of [undefined, 'Bearer pf_real_key_dummy', 'Bearer ' + PRINTER_KEY + 'x', 'bearer ' + PRINTER_KEY]) {
      const h = auth ? { authorization: auth } : {};
      const r = await standin.fetch(new Request('https://api.printful.com/v2/orders', { method: 'POST', headers: h, body: JSON.stringify({ external_id: 'mo_' + 'K'.repeat(22), recipient: { name: 'Pat', address1: '1', city: 'x', country_code: 'US' }, order_items: [{ catalog_variant_id: 1320, quantity: 1 }] }) }), S.env);
      eq(r.status, 401, String(auth));
    }
    eq(S.env.PRINTER.get('printer').obj.rows('select count(*) as n from pf_orders')[0].n, 0, 'nothing kept');
  });

  await T('C2-live', 'the live Worker never honours the stand-in: the key test-printer is not a printer there (shut, nothing called, even with a PROVIDER_FETCH seam); on the test Worker it needs the binding', async () => {
    const S = standIn({ t: Date.now() });
    for (const [name, env] of [['live, test-printer + a seam', { MERCH_PROVIDER_KEY: PRINTER_KEY, PROVIDER_FETCH: S.fetch, MERCH_PROVIDER_MODE: 'draft' }],
      ['live mode, test-printer + a seam', { MERCH_PROVIDER_KEY: PRINTER_KEY, PROVIDER_FETCH: S.fetch }],
      ['test Worker, test-printer, no binding', { MERCH_TEST: '1', MERCH_PROVIDER_MODE: 'draft', MERCH_PROVIDER_KEY: PRINTER_KEY, PROVIDER_FETCH: undefined }]]) {
      const w = await world({ env });
      ok(!pf.providerReady(w.env), name + ': not ready');
      ok((await w.call('GET', '/merch/catalog')).json.shut === true, name + ': shut');
      const c = await w.checkout([mug(0)]); eq([c.status, c.json.error], [503, 'merch_closed'], name + ': checkout refused');
      eq((await pf.get(w.env, 'mo_' + 'L'.repeat(22))).kind, 'not_set_up', name + ': the adapter sends nothing');
    }
    eq(S.calls.length, 0, 'the stand-in was never called');
    ok(pf.providerReady({ MERCH_TEST: '1', MERCH_PROVIDER_MODE: 'draft', MERCH_PROVIDER_KEY: PRINTER_KEY, PROVIDER_FETCH: S.fetch }), 'only the test Worker with the binding');
    ok(pf.providerReady({ MERCH_PROVIDER_KEY: 'pf-test-key', PROVIDER_FETCH: S.fetch }), 'any other key: unchanged');
  });

  await T('C2-build', 'the build: no PROVIDER_FETCH and no stand-in without MERCH_TEST_PRINTER=1; with it the binding in both uploads and the printer\'s own metadata; refused for any other Worker name; the toml never binds PROVIDER_FETCH; the deploy dry run sends nothing and names the second Worker', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-c2-'));
    try {
      const build = (dir, more) => spawnSync(process.execPath, [path.join(ROOT, 'tools', 'merch_test_build.mjs'), '--out', path.join(tmp, dir), '--no-bundle'], { encoding: 'utf8', env: Object.assign({}, process.env, { MERCH_TEST_PRINTER: '', MERCH_TEST_NAME: '' }, more || {}) });
      const rd = (dir, f) => fs.readFileSync(path.join(tmp, dir, f), 'utf8');
      const off = build('off'); ok(off.status === 0, 'plain build ' + off.stderr);
      for (const f of ['meta.json', 'meta_new.json']) ok(!JSON.parse(rd('off', f)).bindings.some((b) => b.name === 'PROVIDER_FETCH' || b.service === PRINTER_NAME), f + ': no PROVIDER_FETCH');
      ok(!/test_printer|printerEnv|PROVIDER_FETCH/.test(rd('off', 'entry.js')) && !fs.existsSync(path.join(tmp, 'off', 'printer_meta.json')), 'no stand-in code or files'); ok(/not built/.test(off.stdout), off.stdout);
      const on = build('on', { MERCH_TEST_PRINTER: '1' }); ok(on.status === 0, 'stand-in build ' + on.stderr);
      for (const f of ['meta.json', 'meta_new.json']) {
        const m = JSON.parse(rd('on', f)), b = m.bindings.filter((x) => x.name === 'PROVIDER_FETCH');
        eq(b, [{ type: 'service', name: 'PROVIDER_FETCH', service: PRINTER_NAME }], f + ': the service binding to the stand-in');
        ok(!m.bindings.some((x) => x.name === 'MERCH_PROVIDER_KEY'), f + ': no key sent (the entry passes test-printer at run time)');
      }
      const pn = JSON.parse(rd('on', 'printer_meta_new.json')), pm = JSON.parse(rd('on', 'printer_meta.json'));
      eq([pn.bindings, pn.migrations], [[{ type: 'durable_object_namespace', name: 'PRINTER', class_name: 'TestPrinter' }], { new_tag: 'v1', new_sqlite_classes: ['TestPrinter'] }], 'the printer: one SQLite Durable Object, its own migration');
      ok(!pm.migrations && pm.bindings.length === 1 && !pm.keep_bindings, 'a later printer upload: no migration, nothing else bound');
      eq([rd('on', 'printer_parts.txt').trim(), pn.main_module], ['entry.js application/javascript+module', 'entry.js'], 'the printer part');
      eq(rd('on', 'printer/entry.js').split('\n').filter((l) => !/^\/\//.test(l) && l).map((l) => l.replace(/'.*\//, "'")), ["export { default, TestPrinter } from 'test_printer.js';"], 'its entry: the stand-in, nothing else');
      ok(/workers_dev = false/.test(rd('on', 'printer/wrangler.toml')) && /name = "doodle-doggo-merch-test-printer"/.test(rd('on', 'printer/wrangler.toml')), 'its toml: workers.dev off');
      const e = rd('on', 'entry.js'); ok(/class MerchLedgerT extends MerchLedger \{ constructor\(state, env\) \{ super\(state, printerEnv\(env\)\); \} \}/.test(e) && /export \{ MerchLedgerT as MerchLedger/.test(e), 'the entry wraps the ledger');
      const novar = (f) => { const v = JSON.parse(rd(f, 'vars.json')); ok(/^[A-Za-z0-9_-]{43}$/.test(v.MERCH_TEST_TOKEN || ''), f + ': a random test token (R4-m4)'); delete v.MERCH_TEST_TOKEN; return v; };
      eq(novar('on'), novar('off'), 'the same variables (each build its own test token)');
      for (const [more, why] of [[{ MERCH_TEST_PRINTER: '1', MERCH_TEST_NAME: 'doodle-doggo-merch' }, /stand-in printer is only ever wired into doodle-doggo-merch-test/], [{ MERCH_TEST_PRINTER: '1', MERCH_TEST_NAME: 'doodle-doggo-merch-test-printer' }, /stand-in/], [{ MERCH_TEST_PRINTER: 'yes' }, /MERCH_TEST_PRINTER/]]) {
        const r = build('bad', more); ok(r.status === 2 && why.test(r.stderr), JSON.stringify(more) + ': refused ' + r.stderr);
      }
      // the live toml (and its test block): no PROVIDER_FETCH binding anywhere; the only service binding is SELF
      const toml = fs.readFileSync(path.join(ROOT, 'cloudflare', 'merch', 'wrangler.example.toml'), 'utf8').split('\n').filter((l) => !/^\s*#/.test(l)).map((l) => l.replace(/#.*$/, ''));
      ok(!toml.some((l) => /PROVIDER_FETCH|test_printer|test-printer/.test(l)), 'wrangler.example.toml: no stand-in');
      eq(toml.filter((l) => /^\s*binding\s*=\s*"/.test(l)).map((l) => l.trim()), ['binding = "ASSETS"', 'binding = "BROWSER"', 'binding = "SELF"', 'binding = "BROWSER"', 'binding = "SELF"'], 'the bindings of the live and test blocks');
      // the deploy script's default dry run: nothing sent; the stand-in first, PROVIDER_FETCH on the test Worker, workers.dev off, how to delete
      const dry = (more) => spawnSync('bash', [path.join(ROOT, 'tools', 'merch_test_deploy.sh')], { encoding: 'utf8', env: Object.assign({}, process.env, { MERCH_TEST_NO_BUNDLE: '1', DRY_RUN: '', BUILD_ONLY: '', MERCH_TEST_DEPLOY_OK: '', CLOUDFLARE_API_TOKEN: '', MERCH_TEST_OUT: path.join(tmp, 'dry'), MERCH_TEST_PRINTER: '' }, more || {}) });
      const d1 = dry({ MERCH_TEST_PRINTER: '1' }), out = d1.stdout + d1.stderr;
      ok(d1.status === 0 && /DRY RUN done: nothing was sent/.test(out), 'dry run ' + out.slice(-400));
      const iP = out.indexOf('PUT https://api.cloudflare.com/client/v4/accounts/<account_id>/workers/scripts/' + PRINTER_NAME + ' '), iW = out.indexOf('PUT https://api.cloudflare.com/client/v4/accounts/<account_id>/workers/scripts/' + NAME + ' ');
      ok(iP > 0 && iW > iP, 'the stand-in uploaded first');
      ok(/scripts\/doodle-doggo-merch-test-printer {2}multipart: printer_meta_new\.json \(bindings PRINTER:durable_object_namespace; migration new_tag v1 new_sqlite_classes TestPrinter\)/.test(out), 'its first upload');
      ok(/POST https:\/\/api\.cloudflare\.com\/client\/v4\/accounts\/<account_id>\/workers\/scripts\/doodle-doggo-merch-test-printer\/subdomain {2}\{"enabled":false/.test(out), 'its workers.dev off');
      ok(/meta_new\.json \(bindings [^)]*PROVIDER_FETCH:service -> doodle-doggo-merch-test-printer/.test(out) && /meta\.json \(bindings [^)]*PROVIDER_FETCH:service -> doodle-doggo-merch-test-printer/.test(out), 'PROVIDER_FETCH in both test Worker uploads');
      ok(!/doodle-doggo-merch-test-printer\/schedules/.test(out) && !/"service":"doodle-doggo-merch-test-printer"/.test(out), 'no cron and no domain for it');
      ok(/to delete them afterwards[^\n]*first doodle-doggo-merch-test [^\n]*then doodle-doggo-merch-test-printer/.test(out), 'how to delete it, after the test Worker');
      const d0 = dry(), o0 = d0.stdout + d0.stderr; ok(d0.status === 0 && !/printer|PROVIDER_FETCH/.test(o0.replace(/stand-in printer \(C2\): not built[^\n]*/, '')), 'without MERCH_TEST_PRINTER: no second Worker ' + o0.slice(-300));
      const dn = dry({ MERCH_TEST_PRINTER: '1', MERCH_TEST_NAME: 'doodle-doggo-merch' }); ok(dn.status === 2, 'another name: refused');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  await miniflareC2();
}

/* ---------------- workerd: the built test bundle with the stand-in as a second Worker ---------------- */
function findMiniflare() {
  const roots = [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean));
  for (const r of roots) for (const sub of ['miniflare', 'wrangler/node_modules/miniflare']) { try { return require(path.join(r, sub)); } catch (e) { /* next */ } }
  try { return require('miniflare'); } catch (e) { return null; }
}
const NAMES = { 'idempotency-key': 'Idempotency-Key', authorization: 'Authorization', 'stripe-version': 'Stripe-Version', 'content-type': 'Content-Type' };
async function seen(req) { const h = {}; for (const [k, v] of req.headers) h[NAMES[k] || k] = v; return { url: req.url, method: req.method, headers: h, body: req.method === 'GET' ? '' : await req.text() }; }
const svc = (f) => async (req) => { const s = await seen(req); return f(s.url, { method: s.method, headers: s.headers, body: s.method === 'GET' ? undefined : s.body }); };
const SRC = path.join(ROOT, 'cloudflare', 'merch');
const srcModules = () => fs.readdirSync(SRC).filter((f) => f.endsWith('.js')).map((f) => ({ type: 'ESModule', path: path.join(SRC, f), contents: fs.readFileSync(path.join(SRC, f), 'utf8') }));
const pawprint = () => ({ type: 'CommonJS', path: path.join(ROOT, 'merch', 'dist', 'pawprint.js'), contents: fs.readFileSync(path.join(ROOT, 'merch', 'dist', 'pawprint.js'), 'utf8') });
// the modules of a built entry (tools/merch_test_build.mjs --no-bundle): entry.js first, the merch Worker's files, PawPrint, the print Text modules
function entryModules(out) {
  const print = fs.readdirSync(path.join(out, 'print')).map((f) => ({ type: 'Text', path: path.join(out, 'print', f), contents: fs.readFileSync(path.join(out, 'print', f), 'utf8') }));
  return [{ type: 'ESModule', path: path.join(out, 'entry.js'), contents: fs.readFileSync(path.join(out, 'entry.js'), 'utf8') }].concat(srcModules(), [pawprint()], print);
}
const SECRETS = (stripe) => ({ MERCH_STRIPE_KEY: 'rk_test_dummy', MERCH_STRIPE_WEBHOOK_SECRET: stripe.secret, MERCH_HASH_KEY: 'hash-key-for-tests', MERCH_FILE_KEY: 'file-key-for-tests', MERCH_ADMIN_KEY: 'admin-key-for-tests-0123' });
const DO3 = { LEDGER: { className: 'MerchLedger', useSQLite: true }, PRINTS: { className: 'MerchPrints', useSQLite: true }, RENDER: { className: 'MerchRender', useSQLite: true } };
const until = async (f, ms) => { for (let i = 0; i < (ms || 20000) / 100; i++) { if (await f()) return true; await new Promise((r) => setTimeout(r, 100)); } return false; };
function client(mf, token) { // token: the built test Worker's shared test token (R4-m4: X-Merch-Test-Token), sent as the test page sends it
  const call = async (m, p, body, headers) => { const r = await mf.dispatchFetch('https://merch-api-test.doodledoggo.app' + p, { method: m, headers: Object.assign({ 'content-type': 'application/json', 'CF-Connecting-IP': '10.72.0.1' }, token ? { 'x-merch-test-token': token } : {}, headers || {}), body: body == null ? undefined : typeof body === 'string' ? body : JSON.stringify(body) }); const t = await r.text(); let j = null; try { j = JSON.parse(t); } catch (e) { j = null; } return { status: r.status, json: j, text: t }; };
  let n = 0; const checkout = async (lines) => { const q = await call('POST', '/merch/quote', { country: 'US', lines }); return call('POST', '/merch/checkout', { country: 'US', lines, expect_total: q.json && q.json.total, art_ver: PP.ART_VER, nonce: 'c2-mf-nonce-' + (++n) + '-abcdef', agree: true }); };
  return { call, checkout, admin: (m, p, b) => call(m, '/merch/admin/' + p, b, { authorization: 'Bearer admin-key-for-tests-0123' }) };
}

async function miniflareC2() {
  const MF = findMiniflare();
  if (!MF) { console.log('  SKIP C2 workerd rows: Miniflare is not installed here (NODE_PATH=$(npm root -g))'); return; }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-c2mf-'));
  const build = (dir, more) => { const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'merch_test_build.mjs'), '--out', path.join(tmp, dir), '--no-bundle'], { encoding: 'utf8', env: Object.assign({}, process.env, { MERCH_TEST_PRINTER: '', MERCH_TEST_NAME: '' }, more || {}) }); ok(r.status === 0, r.stderr); return path.join(tmp, dir); };
  try {
    const OUT = build('on', { MERCH_TEST_PRINTER: '1' }), VARS = JSON.parse(fs.readFileSync(path.join(OUT, 'vars.json'), 'utf8'));
    await T('C2-mf', 'workerd, the built test bundle (MERCH_TEST_PRINTER=1) with the stand-in as a second Worker behind PROVIDER_FETCH: a basket from a faked Stripe payment to the stand-in\'s draft, then held draft_mode; "Test Refuse Address" held address; nothing reaches the network', async () => {
      const stripe = fakeStripe(), rd = fakeRender(), out = [], persist = path.join(tmp, 'do');
      const opts = (bind) => ({ durableObjectsPersist: persist,
        workers: [
          { name: NAME, modulesRoot: '/', modules: entryModules(OUT), compatibilityDate: '2026-03-24', durableObjects: DO3,
            bindings: Object.assign({}, VARS, SECRETS(stripe), { MERCH_FROM: '2026-01-01T00:00:00+09:00' }, bind || {}),
            serviceBindings: { PROVIDER_FETCH: PRINTER_NAME, STRIPE_FETCH: svc(stripe.fetch), RENDER_FETCH: svc(rd.fetch) },
            outboundService: async (req) => { out.push(req.method + ' ' + req.url); return new Response('{"error":"no network in this test"}', { status: 599 }); } },
          { name: PRINTER_NAME, modulesRoot: '/', modules: [{ type: 'ESModule', path: path.join(OUT, 'printer', 'entry.js'), contents: fs.readFileSync(path.join(OUT, 'printer', 'entry.js'), 'utf8') }].concat(srcModules().filter((m) => /\/(test_printer|util|catalog)\.js$/.test(m.path))), compatibilityDate: '2026-03-24',
            durableObjects: { PRINTER: { className: 'TestPrinter', useSQLite: true } },
            outboundService: async (req) => { out.push('printer: ' + req.method + ' ' + req.url); return new Response('{}', { status: 599 }); } }] });
      let mf = new MF.Miniflare(opts());
      try {
        const c = client(mf, VARS.MERCH_TEST_TOKEN);
        const cat = await c.call('GET', '/merch/catalog'); ok(cat.status === 200 && cat.json.shut === false, 'the catalog is open: the stand-in is the printer ' + cat.text.slice(0, 160));
        const pay = async (name) => {
          const k = await c.checkout([mug(0)]); ok(k.status === 200 && /^https:\/\/checkout\.stripe\.test\//.test(k.json.url), 'checkout ' + k.text);
          const cs = stripe.pay(Array.from(stripe.sessions.values()).find((s) => s.client_reference_id === k.json.order).id); cs.collected_information.shipping_details.name = name;
          const e = await stripe.event('checkout.session.completed', { id: cs.id, payment_status: 'paid', metadata: cs.metadata });
          const h = await c.call('POST', '/merch/webhook/stripe', e.raw, { 'stripe-signature': e.sig }); ok(h.status === 200, 'webhook ' + h.text);
          return k.json.order;
        };
        const id = await pay('Pat Example');
        ok(await until(async () => { const p = (await c.call('GET', '/merch/order/' + id)).json; return p && p.lines[0].status === 'drafted'; }), 'drafted in workerd');
        const show = await c.admin('GET', 'order/' + id); ok(show.status === 200 && /^STAND-IN/.test(show.json.printer) && /^\d+$/.test(show.json.order.provider_order), 'merch.sh show: the stand-in\'s draft ' + show.text.slice(0, 160));
        const ns = await mf.getDurableObjectNamespace('PRINTER', PRINTER_NAME), sp = ns.get(ns.idFromName('printer'));
        const g = await sp.fetch('https://api.printful.com/v2/orders/@' + id, { headers: { authorization: 'Bearer ' + PRINTER_KEY } }); const gj = await g.json();
        eq([g.status, gj.data.status, gj.data.id, gj.data.order_items.length, gj.data.recipient], [200, 'draft', Number(show.json.order.provider_order), 1, { country_code: 'US' }], 'the stand-in (its own SQLite Durable Object) holds the draft, and only the country');
        const id2 = await pay('Test Refuse Address');
        ok(await until(async () => { const p = (await c.call('GET', '/merch/order/' + id2)).json; return p && p.hold === 'address'; }), 'held address in workerd');
        await mf.dispose();
        // the same Durable Objects 65 minutes on (a frozen clock for this check only: NOW is a test seam the build never sends)
        mf = new MF.Miniflare(opts({ NOW: String(Date.now() + 65 * MIN) }));
        const c2 = client(mf, VARS.MERCH_TEST_TOKEN), t = await c2.admin('POST', 'tick', {}); ok(t.status === 200, 'tick ' + t.text);
        const s2 = await c2.admin('GET', 'order/' + id); eq([s2.json.order.status, s2.json.order.hold], ['held', 'draft_mode'], 'past the hour: held draft_mode');
        eq([(await c2.admin('GET', 'order/' + id2)).json.order.hold], ['address'], 'the address order still waits for its form');
        const ns2 = await mf.getDurableObjectNamespace('PRINTER', PRINTER_NAME), g2 = await ns2.get(ns2.idFromName('printer')).fetch('https://api.printful.com/v2/orders/@' + id, { headers: { authorization: 'Bearer ' + PRINTER_KEY } });
        eq((await g2.json()).data.status, 'draft', 'still a draft at the stand-in: never confirmed');
        eq(out, [], 'no global fetch at all (Stripe and the renderer through their seams, the printer through the binding)');
      } finally { await mf.dispose(); }
    });
    await T('C2-mf-keys', 'workerd: a real MERCH_PROVIDER_KEY on the built entry goes to api.printful.com, never to the PROVIDER_FETCH binding; the live Worker with the key test-printer is shut and calls nobody; the plain build (no MERCH_TEST_PRINTER) is shut with no printer key', async () => {
      // (a) the stand-in build with a real key: the binding is a spy here, and must stay unused
      const stripe = fakeStripe(), rd = fakeRender(), out = [], spy = [];
      let mf = new MF.Miniflare({ name: NAME, modulesRoot: '/', modules: entryModules(OUT), compatibilityDate: '2026-03-24', durableObjects: DO3,
        bindings: Object.assign({}, VARS, SECRETS(stripe), { MERCH_FROM: '2026-01-01T00:00:00+09:00', MERCH_PROVIDER_KEY: 'pf_real_key_dummy' }),
        serviceBindings: { PROVIDER_FETCH: async (req) => { spy.push(req.url); return new Response('{}', { status: 500 }); }, STRIPE_FETCH: svc(stripe.fetch), RENDER_FETCH: svc(rd.fetch) },
        outboundService: async (req) => { const s = await seen(req); out.push(s); return new Response('{"type":"x","status":503,"title":"Service Unavailable"}', { status: 503 }); } });
      try {
        const c = client(mf, VARS.MERCH_TEST_TOKEN);
        ok((await c.call('GET', '/merch/catalog')).json.shut === false, 'open: the real key is the printer, through the global fetch');
        const show0 = await c.admin('GET', 'report'); eq(show0.json.printer, 'printful', 'merch.sh report: printful');
        const k = await c.checkout([mug(0)]); const cs = stripe.pay(Array.from(stripe.sessions.keys())[0]);
        const e = await stripe.event('checkout.session.completed', { id: cs.id, payment_status: 'paid', metadata: cs.metadata }); await c.call('POST', '/merch/webhook/stripe', e.raw, { 'stripe-signature': e.sig });
        ok(await until(() => out.length > 0), 'the draft step reached the global fetch');
        ok(out.every((x) => new URL(x.url).host === 'api.printful.com' && x.headers.Authorization === 'Bearer pf_real_key_dummy'), 'only api.printful.com, with the real key: ' + out.map((x) => x.method + ' ' + x.url).join(', '));
        eq(spy, [], 'the PROVIDER_FETCH binding (the stand-in) was never called');
        ok(k.status === 200, 'checkout ' + k.text);
      } finally { await mf.dispose(); }
      // (b) the live Worker (worker.js itself, not the test entry), the key test-printer, no MERCH_TEST: shut, nothing called
      const out2 = [], s2 = fakeStripe(), mods = srcModules(); mods.sort((a, b) => (a.path.endsWith('/worker.js') ? -1 : b.path.endsWith('/worker.js') ? 1 : 0)); mods.push(pawprint());
      mf = new MF.Miniflare({ modulesRoot: '/', modules: mods, compatibilityDate: '2026-03-24', durableObjects: DO3,
        bindings: Object.assign({}, SECRETS(s2), { MERCH_FROM: '2026-01-01T00:00:00+09:00', MERCH_COUNTRIES: 'all,-uk_eu', MERCH_PROVIDER_MODE: 'draft', MERCH_PROVIDER_KEY: PRINTER_KEY, MERCH_PUBLIC_URL: 'https://merch-api.test' }),
        serviceBindings: { STRIPE_FETCH: svc(s2.fetch), RENDER_FETCH: svc(fakeRender().fetch) },
        outboundService: async (req) => { out2.push(req.method + ' ' + req.url); return new Response('{}', { status: 599 }); } });
      try {
        const c = client(mf), cat = await c.call('GET', '/merch/catalog'); ok(cat.json.shut === true, 'the live Worker: test-printer is not a printer: shut');
        const k = await c.checkout([mug(0)]); eq([k.status, k.json && k.json.error], [503, 'merch_closed'], 'checkout refused');
        ok(/^none/.test((await c.admin('GET', 'report')).json.printer), 'and merch.sh report says there is no printer');
        eq(out2, [], 'nothing called: never api.printful.com with that word');
      } finally { await mf.dispose(); }
      // (c) the plain test build (no stand-in): no printer key, no binding = shut
      const OFF = build('off'), s3 = fakeStripe(), out3 = [];
      mf = new MF.Miniflare({ name: NAME, modulesRoot: '/', modules: entryModules(OFF), compatibilityDate: '2026-03-24', durableObjects: DO3,
        bindings: Object.assign({}, JSON.parse(fs.readFileSync(path.join(OFF, 'vars.json'), 'utf8')), SECRETS(s3), { MERCH_FROM: '2026-01-01T00:00:00+09:00' }),
        serviceBindings: { STRIPE_FETCH: svc(s3.fetch), RENDER_FETCH: svc(fakeRender().fetch) }, outboundService: async (req) => { out3.push(req.url); return new Response('{}', { status: 599 }); } });
      try { const c = client(mf); ok((await c.call('GET', '/merch/catalog')).json.shut === true, 'the plain test build: shut without a printer key'); eq(out3, [], 'nothing called'); }
      finally { await mf.dispose(); }
    });
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}
