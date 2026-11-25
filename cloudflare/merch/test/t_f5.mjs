// Part 5 review fixes (docs/reviews/MERCH_PART5_review.md, PART5.md "Review fixes"): one F5-* row (or more) per finding. The adapter rows
// replay recorded replies (test/printful/*.json) as t_printful.mjs does; the ledger rows use the fake printer. Nothing reaches the network.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { T, ok, eq, world, mug, tee, MIN, HOUR, DAY } from './harness.mjs';
import * as pf from '../provider_printful.js';
import { PRODUCTS, PF_VARIANT_IDS, buildCatalog } from '../catalog.js';
import { marginOf, priceBasket } from '../lines.js';
import { PP } from './harness.mjs';

const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), 'printful');
const fx = (n) => JSON.parse(fs.readFileSync(path.join(DIR, n + '.json'), 'utf8'));
const EXT = 'mo_TestOrder0000000000001', PID = '93000001', KEY = 'pf-key-for-tests-0001', GRACE = 120e3;
function replay(seq) {
  const R = { calls: [], left: seq.slice() };
  R.fetch = async (url, init) => {
    const u = new URL(url), c = { method: (init && init.method) || 'GET', url: String(url), path: u.pathname + u.search, body: init && init.body ? JSON.parse(init.body) : null };
    R.calls.push(c);
    const next = R.left.shift(); if (!next) throw new Error('unexpected call ' + c.method + ' ' + c.path);
    if (next === 'hang') return new Promise(() => {});
    if (next === 'drop') throw new Error('connection reset');
    const f = typeof next === 'string' ? fx(next) : next(c);
    return new Response(f.body == null ? null : JSON.stringify(f.body), { status: f.status, headers: Object.assign({ 'content-type': 'application/json' }, f.headers || {}) });
  };
  return R;
}
const envOf = (R, more) => Object.assign({ PROVIDER_FETCH: R.fetch, MERCH_PROVIDER_KEY: KEY, MERCH_PROVIDER_MODE: 'live', MERCH_TIMEOUT_MS: '100', MERCH_PF_POLL_MS: '0' }, more || {});
const emptyShips = () => ({ status: 200, body: { data: [], paging: { total: 0, offset: 0, limit: 100 } } });
const withStatus = (name, st) => () => { const f = fx(name); f.body.data.status = st; return f; };
const err400 = (message) => () => ({ status: 400, body: { code: 400, result: message, error: { reason: 'BadRequest', message } } });
const confirms = (w) => w.pf.calls.filter((c) => c.m === 'POST' && /\/confirmation$/.test(c.path)).length;
const hint = (w, id, type, eid) => w.phook(w.pf.hook(w.pfOrder(id), type, eid));

export async function f5() {
  console.log('--- part 5 review fixes (F5-*)');

  /* ---------------- finding 2: a confirm Printful took but whose answer was lost ---------------- */
  await T('F5-confirm-adapter', 'confirm: an answer that is not ok re-reads the order; past the draft (pending, inreview, inprocess, onhold, partial, fulfilled) the confirm was taken: ok', async () => {
    for (const [first, why] of [['server_error_500', 'down'], ['drop', 'down'], ['hang', 'timeout'], [err400('Order cannot be confirmed'), 'cannot']]) {
      for (const st of ['pending', 'inreview', 'inprocess', 'onhold', 'partial', 'fulfilled']) {
        const R = replay([first, withStatus('order_get_pending', st), emptyShips]), r = await pf.confirm(envOf(R), PID);
        ok(r.ok && r.data.id === PID && r.reread === why, why + ' then ' + st + ': taken ' + JSON.stringify(r));
        eq(R.calls.map((c) => c.method + ' ' + c.path), ['POST /v2/orders/' + PID + '/confirmation', 'GET /v2/orders/' + PID, 'GET /v2/orders/' + PID + '/shipments?limit=100'], 'the confirm, then one re-read');
      }
    }
    let R = replay(['server_error_500', 'order_create_draft']); eq(await pf.confirm(envOf(R), PID), { ok: false, kind: 'down', status: 500 }, 'still a draft: the first answer stands');
    R = replay(['server_error_500', 'server_error_500']); eq(await pf.confirm(envOf(R), PID), { ok: false, kind: 'down', status: 500 }, 'the re-read fails too: the first answer stands');
    R = replay(['server_error_500', withStatus('order_get_pending', 'failed')]); eq((await pf.confirm(envOf(R), PID)).ok, false, 'failed is not taken');
    R = replay(['server_error_500', withStatus('order_get_pending', 'canceled'), emptyShips]); eq((await pf.confirm(envOf(R), PID)).ok, false, 'canceled is not taken');
    R = replay(['order_confirm_billing']); eq([(await pf.confirm(envOf(R), PID)).kind, R.calls.length], ['billing', 1], 'a billing refusal is never re-read: it cannot be masked');
  });
  await T('F5-confirm-drop', 'the ledger: Printful took the confirm and the connection dropped: the re-read finds it pending: confirmed, one confirm, never a review hold or a refund', async () => {
    const w = await world(); w.pf.lostConfirm = ['drop']; const id = await w.confirmedOrder([mug(0)]);
    eq([confirms(w), w.pfOrder(id).status, w.owner(/review/).length], [1, 'pending', 0], 'one confirm, no owner email');
    await w.advance(2 * DAY); eq([w.order(id).status, w.stripe.refunds.length], ['confirmed', 0], 'a day later: still confirmed, nothing refunded');
  });
  await T('F5-confirm-5xx', 'the ledger: Printful took the confirm and answered 502: confirmed at once; a second confirm (Printful refuses it) would re-read too', async () => {
    const w = await world(); w.pf.lostConfirm = ['5xx']; const id = await w.confirmedOrder([tee(0)]);
    eq([confirms(w), w.order(id).hold, w.owner(/review/).length], [1, null, 0], 'one confirm');
    // the old path: the 5xx answered and the re-read failed: backed off, the next confirm is refused by Printful (taken already): re-read, confirmed
    const x = await world(); x.pf.lostConfirm = ['5xx']; const j = await x.drafted([mug(0)]); x.pf.fail.get = 1;
    await x.advance(x.order(j).cancel_until + GRACE - x.clock.t); eq([x.order(j).status, x.order(j).hold], ['held', 'provider'], 'not known yet: backed off');
    await x.advance(10 * MIN); eq([x.order(j).status, confirms(x), x.owner(/review/).length, x.stripe.refunds.length], ['confirmed', 2, 0, 0], 'the second confirm was refused, the re-read said pending: confirmed');
  });
  await T('F5-confirm-refused', 'a confirm Printful really refused (its order is still a draft) is still refused: held review, owner email; a billing refusal stays the wallet hold even when the order reads as taken', async () => {
    const w = await world(); const id = await w.drafted([mug(0)]); w.pf.refuse.confirm = true;
    await w.advance(w.order(id).cancel_until + GRACE - w.clock.t);
    eq([w.order(id).status, w.order(id).hold, w.order(id).why, w.pfOrder(id).status], ['held', 'review', 'confirm_cannot', 'draft'], 'held');
    ok(w.owner(/review/).length === 1 && /wallet and dashboard/.test(w.owner(/review/)[0].text), 'owner email with the wallet hint');
    const x = await world(); const j = await x.drafted([mug(0)]); x.pf.refuse.billing = true; x.pfOrder(j).status = 'pending'; // an odd Printful: a billing refusal, an order that reads as taken
    const before = x.pf.calls.length; await x.advance(x.order(j).cancel_until + GRACE - x.clock.t);
    eq([x.order(j).status, x.order(j).hold], ['held', 'wallet'], 'wallet hold'); ok(!x.pf.calls.slice(before).some((c, i, a) => c.m === 'GET' && a[i - 1] && /\/confirmation$/.test(a[i - 1].path)), 'no re-read after a billing refusal');
  });

  /* ---------------- finding 7: the owner email after a confirm that comes back failed ---------------- */
  await T('F5-confirm-failed-mail', 'a confirm whose answer says failed: held review, and the owner email says to check the Printful wallet and dashboard', async () => {
    const w = await world(); const id = await w.drafted([mug(0)]); w.pf.after.confirm = async (o) => { o.status = 'failed'; };
    await w.advance(w.order(id).cancel_until + GRACE - w.clock.t);
    eq([w.order(id).status, w.order(id).hold, w.order(id).why], ['held', 'review', 'confirm_refused'], 'held');
    const m = w.owner(/review/); ok(m.length === 1 && /came back failed/.test(m[0].text) && /Printful wallet and dashboard/.test(m[0].text), 'the wallet hint: ' + (m[0] && m[0].text));
  });

  /* ---------------- finding 3: Printful fails or cancels an order it had taken ---------------- */
  await T('F5-pf-failed', 'Printful fails a confirmed order (order_failed, re-read failed): held review pf_failed, one owner email naming the wallet and dashboard', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]); w.pfOrder(id).status = 'failed';
    const r = await hint(w, id, 'order_failed', 'f1'); eq(r.status, 200, 'hint taken');
    eq([w.order(id).status, w.order(id).hold, w.order(id).why], ['held', 'review', 'pf_failed'], 'held');
    const m = w.owner(/provider_failed/); ok(m.length === 1 && /Printful wallet and dashboard/.test(m[0].text) && /merch\.sh confirm/.test(m[0].text), 'one owner email: ' + (m[0] && m[0].text));
    ok(w.one("select id from merch_events where type = 'pf_failed' and order_id = ?", id), 'an event row');
  });
  await T('F5-pf-canceled', 'Printful cancels a confirmed order (order_canceled): held review pf_canceled, one owner email; an order Printful had put on hold counts too', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]); w.pfOrder(id).status = 'canceled';
    await hint(w, id, 'order_canceled', 'c1');
    eq([w.order(id).status, w.order(id).hold, w.order(id).why], ['held', 'review', 'pf_canceled'], 'held');
    ok(w.owner(/provider_canceled/).length === 1 && /wallet and dashboard/.test(w.owner(/provider_canceled/)[0].text), 'owner email');
    const x = await world(); const j = await x.confirmedOrder([mug(0)]); x.pfOrder(j).status = 'onhold'; await hint(x, j, 'order_put_hold', 'h1');
    eq(x.order(j).hold, 'provider', 'on hold first'); x.pfOrder(j).status = 'canceled'; await hint(x, j, 'order_canceled', 'h2');
    eq([x.order(j).status, x.order(j).hold, x.order(j).why], ['held', 'review', 'pf_canceled'], 'then cancelled: held review');
  });
  await T('F5-pf-ours', 'a cancel we asked for never holds: our late cancel (v1 cancel), a refunded order, a deleted draft, a reprint order; part shipped or in a dispute: told once, never held', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]); await w.advance(w.order(id).ship_by - w.clock.t + 1e3);
    const c = await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' }); ok(c.status === 200 && w.pfOrder(id).status === 'canceled', 'our late cancel: ' + c.text);
    await hint(w, id, 'order_canceled', 'o1'); eq(w.order(id).status, 'refunded', 'our own cancel: stays refunded');
    const a = await world(); const ai = await a.confirmedOrder([mug(0)]); a.L().tx(() => a.L().set(ai, { pcancel: 1 })); a.pfOrder(ai).status = 'canceled';
    await hint(a, ai, 'order_canceled', 'o2'); eq(a.order(ai).status, 'confirmed', 'a cancel in flight (pcancel): not held');
    const b = await world(); const bi = await b.drafted([mug(0)]); b.pfOrder(bi).status = 'canceled'; await hint(b, bi, 'order_canceled', 'o3');
    eq(b.order(bi).status, 'paid', 'a draft (never confirmed): not held');
    const r = await world(); const ri = await r.confirmedOrder([mug(0), tee(1)]), po = r.order(ri).provider_order;
    r.pf.ship(po, [ri + '_1', ri + '_2'], { status: 'fulfilled' }); await hint(r, ri, 'package_shipped', 's1');
    const rp = await r.admin('POST', 'order/' + ri + '/reprint', { lines: [2] }); ok(rp.status === 200, rp.text); eq(r.order(ri).status, 'part_shipped', 'a reprint on its way');
    const rpo = r.pf.orders.get(r.one('select provider_order from merch_reprints where id = ?', ri + '-r1').provider_order); rpo.status = 'canceled';
    await r.phook(r.pf.hook(rpo, 'order_canceled', 'o4')); eq(r.order(ri).status, 'part_shipped', 'a reprint order cancelled: the order is not held');
    const all = [w, a, b, r].reduce((n, x) => n + x.owner(/provider_(failed|canceled)/).length, 0); eq(all, 0, 'no provider_failed / provider_canceled email for any of them');
    const p = await world(); const pi = await p.confirmedOrder([mug(0), tee(1)]); p.pf.ship(p.order(pi).provider_order, [pi + '_1']); await hint(p, pi, 'package_shipped', 'p1');
    eq(p.order(pi).status, 'part_shipped', 'part shipped'); p.pfOrder(pi).status = 'canceled'; await hint(p, pi, 'order_canceled', 'p2'); await hint(p, pi, 'order_canceled', 'p3');
    ok(p.order(pi).status === 'part_shipped' && p.owner(/provider_canceled/).length === 1, 'part shipped: told once, not held (no full refund of a parcel that arrived)');
    const d = await world(); const di = await d.confirmedOrder([mug(0)]); await d.hook('charge.dispute.created', { id: 'dp_f5', payment_intent: d.order(di).payment_intent });
    d.pfOrder(di).status = 'failed'; await hint(d, di, 'order_failed', 'd1');
    ok(d.order(di).status === 'confirmed' && d.order(di).dispute === 'open' && d.owner(/provider_failed/).length === 1 && d.stripe.refunds.length === 0, 'in a dispute: told, not held, nothing refunded');
  });
  await T('F5-pf-repeat', 'hints and re-reads repeat: the same event, a new event, a retry days later: one hold, one owner email', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]); w.pfOrder(id).status = 'failed';
    await hint(w, id, 'order_failed', 'r1'); await hint(w, id, 'order_failed', 'r1'); await hint(w, id, 'order_failed', 'r2'); await hint(w, id, 'order_updated', 'r3');
    const at = w.order(id).hold_at; w.clock.t += 2 * HOUR; await hint(w, id, 'order_failed', 'r4');
    eq([w.order(id).why, w.order(id).hold_at, w.owner(/provider_failed/).length, w.q("select count(*) as n from merch_events where type = 'pf_failed'")[0].n], ['pf_failed', at, 1, 1], 'one hold, one email');
  });
  await T('F5-pf-exits', 'the hold ends as every review hold: a day without the owner: refunded in full; the owner confirms: sent to Printful again (confirmed); Printful goes on by itself: confirmed', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]); w.pfOrder(id).status = 'failed'; await hint(w, id, 'order_failed', 'x1');
    await w.advance(HOUR); eq(w.order(id).status, 'held', 'waits for the owner'); await w.advance(DAY);
    eq([w.order(id).status, w.stripe.refunds.reduce((a, r) => a + r.amount, 0), w.owner(/auto_refund/).length], ['refunded', w.order(id).total, 1], 'a day later: refunded in full');
    const x = await world(); const j = await x.confirmedOrder([mug(0)]); x.pfOrder(j).status = 'failed'; await hint(x, j, 'order_failed', 'x2');
    const c = await x.admin('POST', 'order/' + j + '/confirm', {}); ok(c.status === 200, c.text);
    eq([x.order(j).status, x.order(j).hold, confirms(x), x.pfOrder(j).status, x.stripe.refunds.length], ['confirmed', null, 2, 'pending', 0], 'the owner confirmed: sent again, confirmed');
    await x.advance(2 * DAY); eq(x.order(j).status, 'confirmed', 'and it stays confirmed');
    const y = await world(); const k = await y.confirmedOrder([mug(0)]); y.pfOrder(k).status = 'failed'; await hint(y, k, 'order_failed', 'x3');
    y.pfOrder(k).status = 'pending'; await hint(y, k, 'order_updated', 'x4');
    eq([y.order(k).status, y.order(k).hold, confirms(y)], ['confirmed', null, 1], 'fixed and sent again in the Printful dashboard: the hint confirms it, no confirm from us');
    await y.advance(2 * DAY); eq([y.order(k).status, y.stripe.refunds.length], ['confirmed', 0], 'never refunded');
  });

  /* ---------------- finding 4: errKind, a print-file problem is ours; the address only from the recipient's fields ---------------- */
  await T('F5-errkind', 'errKind: the built error texts keep their kinds; a file, URL, placement or layer problem is down (never a refused line or an address); a bare "address" elsewhere is not the buyer\'s', async () => {
    const sent = [EXT + '_1', EXT + '_2'], k = (name) => pf.errKind({ status: fx(name).status, data: fx(name).body }, sent);
    eq(k('order_recipient_invalid'), { ok: false, kind: 'address', status: 400 }, 'Recipient: ...');
    eq(k('order_item_refused'), { ok: false, kind: 'refused', items: [EXT + '_2'], status: 400 }, 'Item 1: out of stock');
    eq([k('order_confirm_billing').kind, k('order_external_id_in_use').kind, k('order_not_editable').kind, k('order_delete_refused').kind, k('order_cancel_v1_refused').kind, k('shipping_rates_disabled').kind, k('order_delete_conflict').kind],
      ['billing', 'duplicate', 'cannot', 'cannot', 'cannot', 'address', 'down'], 'billing, OR-13, not editable, not deleted, not cancelled, shipping disabled, 409');
    const m = (message) => pf.errKind({ status: 400, data: { code: 400, result: message, error: { reason: 'BadRequest', message } } }, sent);
    for (const t of ['Item 0: Could not download the print file', 'Property `/order_items/0/placements/0/layers/0/url` is invalid', 'Item 1: Invalid placement `front_large` for this product',
      'Item 0: Layer 0: the file is too small for the placement', 'Item 0: Could not fetch file: the server address did not answer', 'Invalid URL given for item 1', 'Print file could not be processed (city skyline.png)'])
      eq([m(t).kind, m(t).why, m(t).items], ['down', 'file', undefined], 'a file problem: ' + t);
    eq(m('Invalid address').kind, 'refused', 'a bare "address" with no recipient field: not an address email (the owner looks)');
    for (const t of ['Recipient: Invalid zip', 'Invalid value for `/recipient/zip`', 'The city is required', 'Invalid state code', 'Invalid country code ZZ', 'ZIP code does not match', 'address1 is required']) eq(m(t).kind, 'address', 'the recipient: ' + t);
  });
  await T('F5-errkind-ledger', 'the ledger: Printful could not fetch our print file: no line refunded, no variant turned off, no address email; tried again, and the draft is made once the file is fetched', async () => {
    const w = await world(); w.pf.refuse.file = 2; const id = await w.paidOrder([mug(0), tee(1)]); await w.advance(5 * MIN);
    ok(!w.order(id).provider_order && w.order(id).last_error === 'file' && w.lines(id).every((l) => l.status === 'ready'), 'backed off (the order says why: file), lines kept: ' + w.lines(id).map((l) => l.status));
    ok(!w.one('select id from merch_variants where on_flag = 0') && w.mails(/_address/).length === 0 && w.stripe.refunds.length === 0, 'no variant off, no address email, no refund');
    await w.advance(30 * MIN); ok(w.order(id).provider_order && w.lines(id).every((l) => l.status === 'drafted'), 'then drafted: ' + w.order(id).status + ' ' + w.lines(id).map((l) => l.status));
    const x = await world(); x.pf.refuse.file = 999; const j = await x.paidOrder([mug(0)]); await x.advance(DAY + 2 * HOUR);
    ok(x.order(j).status === 'held' && x.order(j).hold === 'provider' && x.lines(j)[0].status === 'ready', 'a file Printful never takes: held provider, the line kept: ' + x.order(j).status + ' ' + x.order(j).hold);
    const m = x.owner(/provider_down/); ok(m.length === 1 && /could not use a print file/.test(m[0].text), 'after a day the owner hears it is the print file: ' + (m[0] && m[0].text));
  });

  /* ---------------- finding 5: costs that are not numbers ---------------- */
  await T('F5-costs-nan', 'mapOrder: a cost that is not a number, or no shipping cost, gives costs null; the ledger holds such a draft (cost_unknown) and never confirms it', async () => {
    const draft = (patch) => { const f = fx('order_create_draft'); Object.assign(f.body.data.costs, patch); return f.body.data; };
    eq(pf.mapOrder(draft({}), []).costs, { items: 1799, shipping: 1164, tax: 0 }, 'the built draft: read');
    for (const p of [{ subtotal: '12,34' }, { subtotal: 'abc' }, { shipping: null }, { shipping: '' }, { discount: 'n/a' }, { vat: 'NaN' }, { additional_fee: {} }])
      eq(pf.mapOrder(draft(p), []).costs, { items: null, shipping: null, tax: null }, 'unknown: ' + JSON.stringify(p));
    const w = await world(); w.pf.after.create = async (o) => { w.pf.after.create = null; o.c.subtotal = '12,34'; };
    const id = await w.paidOrder([mug(0)]); await w.advance(5 * MIN);
    eq([w.order(id).status, w.order(id).hold, w.order(id).why, w.order(id).provider_cost], ['held', 'review', 'cost_unknown', null], 'held, no NaN stored');
    await w.advance(2 * HOUR); eq(confirms(w), 0, 'never confirmed'); await w.advance(DAY); eq(w.order(id).status, 'refunded', 'a day later: refunded');
  });

  /* ---------------- finding 6: retail_costs.tax ---------------- */
  await T('F5-retail-tax', 'createDraft: retail_costs.tax is 0.00 where the tax is inside the price (JP, GB, AU ...), the tax charged on top in the US and Canada', async () => {
    const L1 = [{ line: 1, product: 'mug', provider_variant: 'pf:mug:white', qty: 1, refunded_qty: 0, unit: 1999 }], U = { 1: 'https://merch-api.test/merch/file/k/1/a.png' };
    const sent = async (country, tax) => { const R = replay(['order_create_draft']); await pf.createDraft(envOf(R), { id: EXT, ship_fee: 499, tax, country }, L1, { name: 'Test Buyer', address1: '1 Example Street', city: 'X', zip: '1', country_code: country }, U); return R.calls[0].body.retail_costs.tax; };
    eq([await sent('US', 165), await sent('CA', 325)], ['1.65', '3.25'], 'exclusive: on top');
    eq([await sent('JP', 227), await sent('GB', 416), await sent('AU', 227), await sent('DE', 399)], ['0.00', '0.00', '0.00', '0.00'], 'inclusive: inside, so none on top');
    const w = await world({ env: { MERCH_COUNTRIES: 'all' } }); const id = await w.newOrder([mug(0)], 'JP'); await w.pay(id, { tax: 227, amount: w.order(id).total }); await w.advance(5 * MIN);
    const c = w.pf.calls.find((x) => x.m === 'POST' && x.path === '/orders'); eq([w.order(id).tax, c.body.retail_costs.tax], [227, '0.00'], 'the ledger\'s draft for Japan: tax stored, none declared on top');
  });

  /* ---------------- finding 10: quoteCost reads at most MERCH_PF_POLLS times ---------------- */
  await T('F5-quote-polls', 'quoteCost: a task still pending is re-read exactly MERCH_PF_POLLS times (not one more), then down; a completed task whose costs are not numbers is down', async () => {
    const pend = 'estimation_task_created';
    let R = replay([pend, pend, pend, pend]); let r = await pf.quoteCost(envOf(R, { MERCH_PF_POLLS: '2' }), { id: EXT }, [{ line: 1, product: 'mug', provider_variant: 'pf:mug:white', qty: 1, unit: 1999 }], { country_code: 'US' });
    eq([r.kind, r.why, R.calls.length], ['down', 'estimating', 3], 'the create and two reads');
    R = replay([pend]); r = await pf.quoteCost(envOf(R, { MERCH_PF_POLLS: '0' }), { id: EXT }, [{ line: 1, product: 'mug', provider_variant: 'pf:mug:white', qty: 1, unit: 1999 }], { country_code: 'US' }); eq([r.why, R.calls.length], ['estimating', 1], 'no reads at 0');
    R = replay([pend, () => { const f = fx('estimation_task_completed'); f.body.data.costs.subtotal = 'x'; return f; }]);
    r = await pf.quoteCost(envOf(R), { id: EXT }, [{ line: 1, product: 'mug', provider_variant: 'pf:mug:white', qty: 1, unit: 1999 }], { country_code: 'US' }); eq([r.ok, r.kind], [false, 'down'], 'unreadable costs');
  });

  /* ---------------- finding 9: a variant of ours with no price in the nightly read ---------------- */
  await T('F5-cost-missing', 'catalogCosts names our variants a full price read left out (not those of a read that failed); the nightly job tells the owner once per change and keeps their last cost', async () => {
    const drop = (ids) => () => { const f = fx('catalog_prices_tee'); f.body.data.variants = f.body.data.variants.filter((v) => !ids.includes(v.id)); f.body.paging.total = f.body.data.variants.length; return f; };
    let R = replay(['catalog_prices_mug', drop([4137, 5310])]); let r = await pf.catalogCosts(envOf(R), { regions: [], groups: [] });
    eq([r.ok, r.data.missing, r.data.variants['tee:pink:M'], r.data.variants['tee:navy:M']], [true, ['tee:pink:M', 'tee:black:4XL'], undefined, 1192], 'two left out: named');
    R = replay(['catalog_prices_mug', 'server_error_500']); r = await pf.catalogCosts(envOf(R), { regions: [], groups: [] }); eq([r.ok, r.data.missing], [true, []], 'the tee read failed: not "missing" (tried again tomorrow)');
    R = replay(['catalog_prices_mug', 'catalog_prices_tee']); eq((await pf.catalogCosts(envOf(R), { regions: [], groups: [] })).data.missing, [], 'all priced: none');
    const w = await world(); await w.init(); w.pf.costs = { variants: { 'tee:pink:M': 1500 }, ship: {} };
    const night = async (d) => { w.clock.t = Date.parse('2026-12-0' + d + 'T04:30:00+09:00'); const x = await w.call('POST', '/merch/admin/nightly', {}, { authorization: 'Bearer ' + w.env.MERCH_ADMIN_KEY }); ok(x.status === 200, x.text); };
    const cost = () => w.one("select cost_base from merch_variants where id = 'tee:pink:M'").cost_base;
    await night(2); eq([cost(), w.owner(/cost_missing/).length], [1500, 0], 'night 1: read, nothing missing');
    w.pf.costs = { variants: { 'tee:pink:M': 1700 }, ship: {}, unpriced: ['tee:pink:M'] }; await night(3);
    const m = w.owner(/cost_missing/); ok(m.length === 1 && /tee:pink:M/.test(m[0].text) && /last known cost is kept/.test(m[0].text), 'night 2: the owner is told: ' + (m[0] && m[0].text)); eq(cost(), 1500, 'the old cost stays');
    await night(4); eq(w.owner(/cost_missing/).length, 1, 'night 3, still missing: not told again');
    w.pf.costs = { variants: { 'tee:pink:M': 1700 }, ship: {} }; await night(5); eq([cost(), w.L().meta('cost_missing')], [1700, ''], 'night 4: priced again, cleared');
    w.pf.costs.unpriced = ['tee:pink:M']; await night(6); eq(w.owner(/cost_missing/).length, 2, 'missing again later: told again');
  });

  /* ---------------- finding 8: the key-day kit ---------------- */
  await T('F5-kit', 'the key-day kit: a v1 GET of its own draft (by id and external id) before the draft is deleted; scrub takes names, emails, phones and address lines out anywhere in a reply; still dry by default, never a confirm', async () => {
    const kit = await import('../../../tools/merch_pf_check.mjs'), names = kit.plan.map((x) => x.name);
    const v1 = kit.plan.find((x) => x.name === 'draft_get_v1');
    ok(v1 && v1.method === 'GET' && v1.path === '/orders/{order_id}' && names.indexOf('draft_get_v1') < names.indexOf('draft_delete') && names.indexOf('draft_get_v1') > names.indexOf('draft_create'), 'the v1 read of the draft, after its create and before its delete');
    ok(names.indexOf('draft_get_v1_ext') < names.indexOf('draft_delete'), 'and by external id');
    ok(!kit.plan.some((x) => /confirm/i.test(x.path)) && kit.plan.filter((x) => x.method === 'DELETE').every((x) => x.path.startsWith('/v2/orders/{')), 'never a confirm; deletes only of its own v2 drafts');
    const reply = { code: 200, result: { id: 1, external_id: 'pfcheck-1', recipient: { name: 'Real Person', address1: '9 Real Road', address2: 'Flat 3', city: 'Realtown', zip: 'RT1 2AB', phone: '+44 20 7946 0958', email: 'real.person@mail.example' },
      packing_slip: { email: 'shop@mail.example', phone: '+1 555 123 4567', message: 'Questions? Call +81 90-1234-5678' }, customer: { name: 'Real Person', company: 'Real Co' }, contact: { first_name: 'Real', last_name: 'Person' },
      notes: 'ordered by real.person@mail.example', billing: { line1: '9 Real Road', name: 'Real Person' }, store: { id: 7, name: 'Doodle Doggo Merch' }, items: [{ id: 2, name: 'Mug with your dog', retail_price: '19.99' }], secret_key: 'abc' } };
    const out = JSON.stringify(kit.scrub(reply));
    for (const bad of ['Real Person', '9 Real Road', 'Flat 3', 'Realtown', 'RT1 2AB', '7946', '555 123', '1234-5678', 'real.person', 'shop@mail', 'Real Co', '"Real"', 'abc']) ok(!out.includes(bad), 'scrubbed: ' + bad + ' in ' + out);
    ok(out.includes('Mug with your dog') && out.includes('Doodle Doggo Merch') && out.includes('19.99') && out.includes('pfcheck-1'), 'product and store names, prices and ids are kept');
    const dry = spawnSync(process.execPath, [fileURLToPath(new URL('../../../tools/merch_pf_check.mjs', import.meta.url))], { encoding: 'utf8' });
    ok(dry.status === 0 && /DRY RUN, nothing is sent/.test(dry.stdout) && /draft_get_v1: GET/.test(dry.stdout), 'run with no flags: the dry plan, nothing sent');
  });

  /* ---------------- Q25: the big tee sizes cost what Printful charges ---------------- */
  await T('F5-size-cost', 'TEE_SIZE_COST is Printful\'s extra for every big size we sell (the recorded prices: 2XL +2.00, 3XL +4.00, 4XL +6.00); each tee size alone still passes the floor in every zone', async () => {
    const tee = fx('catalog_prices_tee').body.data.variants, price = (id) => Math.round(Number(tee.find((v) => v.id === id).techniques[0].price) * 100);
    const sold = Object.keys(PF_VARIANT_IDS).filter((v) => v.startsWith('tee:'));
    for (const v of sold) { const size = v.split(':')[2]; eq(price(PF_VARIANT_IDS[v]) - PRODUCTS.tee.cost, (PRODUCTS.tee.size_cost[size] || 0), v + ': the extra over the base'); }
    eq([PRODUCTS.tee.size_cost['2XL'], PRODUCTS.tee.size_cost['3XL'], PRODUCTS.tee.size_cost['4XL']], [200, 400, 600], 'the table');
    const cat = buildCatalog(PP), T0 = PRODUCTS.tee;
    for (const now of [Date.parse('2026-12-01T00:00:00Z'), Date.parse('2027-02-01T00:00:00Z')]) for (const [c, z] of Object.entries({ US: 'us_jp', JP: 'us_jp', CA: 'ca_au_nz', AU: 'ca_au_nz', GB: 'uk_eu', DE: 'uk_eu', NO: 'world', HK: 'world' })) for (const s of ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL']) {
      const ls = [{ qty: 1, group: 'tee', variant: 'tee:black:' + s, unit_cost: T0.cost + (T0.size_cost[s] || 0), line_total: T0.price + (T0.size_price[s] || 0) }], pr = priceBasket(z, ls);
      ok(marginOf(cat, c, ls, pr.subtotal, pr.ship_fee, now).pass, c + ' tee ' + s + ': under the floor');
    }
  });
}
