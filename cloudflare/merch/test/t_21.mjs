// Stage 2: TRANSACTIONS.md 2.1, one test per row (T2.1-01..33).
import { T, ok, eq, world, mug, tee, R, DOG, PP, MIN, HOUR, DAY } from './harness.mjs';

const GRACE = 120e3;
const shipHint = async (w, id) => { const o = w.pfOrder(id); return w.phook(w.pf.hook(o, 'package_shipped', 'evt_' + Math.random())); };

export async function t21() {
  console.log('--- stage 2: transitions and repeats (2.1)');
  await T('T2.1-01', 'quote, valid basket: re-checks and prices every line; writes nothing', async () => {
    const w = await world(); const r = await w.quote([mug(0), tee(1, { qty: 2 })]);
    ok(r.status === 200, r.text); eq(r.json.lines.map((l) => [l.unit, l.qty, l.total]), [[1999, 1, 1999], [2699, 2, 5398]], 'lines');
    eq([r.json.subtotal, r.json.ship_fee, r.json.total, r.json.zone], [7397, 0, 7397, 'us_jp'], 'totals'); ok(r.json.eta[0] === 5 && r.json.cat_ver, 'eta, cat_ver');
    ok(w.q('select count(*) as n from merch_orders')[0].n === 0 && w.stripe.calls.length === 0, 'nothing written, no Stripe call');
  });
  await T('T2.1-02', 'checkout, valid, new nonce: order + lines (an open session is not counted: S9), one Stripe session (mc_<order>, expires in 1 h, only the quoted country), url stored', async () => {
    const w = await world(); const r = await w.checkout([mug(0), tee(4, { colour: 'black', size: 'L' })], 'CA');
    ok(r.status === 200 && /^mo_[A-Za-z0-9_-]{22}$/.test(r.json.order) && r.json.url.startsWith('https://checkout.stripe.test/'), r.text);
    const o = w.order(r.json.order), L = w.lines(o.id), c = w.stripe.calls.find((x) => x.m === 'POST');
    eq([o.status, o.country, o.zone, o.total, o.ship_fee], ['open', 'CA', 'ca_au_nz', 1999 + 2699 + 799, 799], 'order row'); eq(L.map((l) => l.status), ['pending', 'pending'], 'lines pending');
    ok(c.key === 'mc_' + o.id && c.version === '2025-03-31.basil', 'Idempotency-Key and Stripe-Version');
    const f = c.body; ok(f['shipping_address_collection[allowed_countries][0]'] === 'CA' && f['shipping_address_collection[allowed_countries][1]'] === undefined, 'only CA');
    ok(f['adaptive_pricing[enabled]'] === 'true' && f['automatic_tax[enabled]'] === 'true' && f.mode === 'payment' && !Object.keys(f).some((k) => /payment_method_types|capture_method|discounts/.test(k)), 'Adaptive Pricing, no manual capture');
    ok(Number(f.expires_at) === Math.floor((w.clock.t + HOUR) / 1000), 'expires_at = now + 1 h');
    ok(f['line_items[1][price_data][product_data][name]'] === 'Tee with your dog (Black, L)' && !JSON.stringify(f).includes('Mochi') && !JSON.stringify(f).includes(R[0]), 'generic names, no dog name or recipe at Stripe');
    ok(f['line_items[0][price_data][tax_behavior]'] === 'exclusive' && f['shipping_options[0][shipping_rate_data][fixed_amount][amount]'] === '799' && f['shipping_options[1][shipping_rate_data][type]'] === undefined, 'one shipping option');
    ok(f['metadata[merch]'] === o.id && f.client_reference_id === o.id && f['payment_intent_data[metadata][merch]'] === o.id, 'the order id in metadata');
    eq([L[0].art_ver, /&av=pp1-/.test(L[0].print_link), L[1].name, L[0].recipe === R[0]], [PP.ART_VER, true, "D'Artagnan", true], 'recipe, ART_VER and print link stored');
    ok(L[1].print_link === '#p=' + R[4] + '&prod=tee&col=black&pose=sit&n=1&av=' + PP.ART_VER, 'the print link: ' + L[1].print_link);
    ok(w.L().dayCount(o.day) === 0, 'an open session does not count toward the day cap (S9: paid orders only)'); ok(o.checkout_url === r.json.url, 'url stored');
  });
  await T('T2.1-03', 'checkout again, same nonce, url stored: the same {order, url}; no new order, no Stripe call', async () => {
    const w = await world(); const q = await w.quote([mug(0)]);
    const b = { country: 'US', lines: [mug(0)], expect_total: q.json.total, art_ver: PP.ART_VER, nonce: 'double-tap-0001', agree: true };
    const a = await w.call('POST', '/merch/checkout', b), n = w.stripe.calls.length, c = await w.call('POST', '/merch/checkout', b);
    eq([c.status, c.json.order, c.json.url], [200, a.json.order, a.json.url], 'same answer'); ok(w.stripe.calls.length === n && w.q('select count(*) as n from merch_orders')[0].n === 1, 'no new order or call');
  });
  await T('T2.1-04', 'checkout again, same nonce, the first tap still waiting on Stripe: 409 busy', async () => {
    const w = await world(); const q = await w.quote([mug(0)]); let go; w.stripe.hang = new Promise((r) => { go = r; });
    const b = { country: 'US', lines: [mug(0)], expect_total: q.json.total, art_ver: PP.ART_VER, nonce: 'double-tap-0002', agree: true };
    const first = w.call('POST', '/merch/checkout', b); await new Promise((r) => setTimeout(r, 20));
    const second = await w.call('POST', '/merch/checkout', b); eq([second.status, second.json.error], [409, 'busy'], 'busy');
    w.stripe.hang = null; go(); const f = await first; ok(f.status === 200, 'the first tap finishes');
  });
  await T('T2.1-05', 'Stripe errors, cannot be reached or times out at checkout: order and lines deleted, 503 busy, the next tap starts clean', async () => {
    const w = await world(); w.stripe.fail.create = 1;
    const q = await w.quote([mug(0)]), b = { country: 'US', lines: [mug(0)], expect_total: q.json.total, art_ver: PP.ART_VER, nonce: 'stripe-down-01', agree: true };
    const r = await w.call('POST', '/merch/checkout', b); ok(r.status === 503 && r.json.error === 'busy' && /Nothing was paid/.test(r.json.say), r.text);
    ok(w.q('select count(*) as n from merch_orders')[0].n === 0 && w.q('select count(*) as n from merch_order_items')[0].n === 0, 'nothing kept');
    const again = await w.call('POST', '/merch/checkout', b); ok(again.status === 200, 'the next tap works: ' + again.text);
    // a timeout: Stripe made the session but its answer came too late (the result is unknown): the same as an error, and the lost session is never shown to anyone
    const x = await world(); x.stripe.slowCreate = 1; const q2 = await x.quote([mug(0)]), b2 = Object.assign({}, b, { expect_total: q2.json.total, nonce: 'stripe-slow-01' });
    const t = await x.call('POST', '/merch/checkout', b2); ok(t.status === 503 && t.json.error === 'busy', 'timeout: 503 busy: ' + t.text);
    ok(x.q('select count(*) as n from merch_orders')[0].n === 0 && x.stripe.sessions.size === 1, 'nothing kept (Stripe has a session nobody was given)');
    const t2 = await x.call('POST', '/merch/checkout', b2); ok(t2.status === 200 && t2.json.url !== Array.from(x.stripe.sessions.values())[0].url, 'the next tap gets a new order and its own session');
  });
  await T('T2.1-06', 'completed + paid, checks pass: paid_at, cancel_until, amounts, pres_*, email_hash; lines queued; Thank you; alarm; gift code', async () => {
    const w = await world(); await w.init(); w.L().run("insert into merch_gift_pool (code) values ('GIFT-0001'), ('GIFT-0002')");
    const id = await w.newOrder([mug(0)]); const r = await w.pay(id, { pres: { presentment_amount: 3800, presentment_currency: 'jpy' } });
    ok(r.status === 200 && r.json.received, r.text); const o = w.order(id);
    eq([o.status, o.paid_at, o.cancel_until, o.total, o.pres_currency, o.pres_amount, o.gift_code], ['paid', w.clock.t, w.clock.t + HOUR, 2498, 'jpy', 3800, 'GIFT-0001'], 'paid row');
    ok(/^[0-9a-f]{64}$/.test(o.email_hash) && !JSON.stringify(w.q('select * from merch_orders')).includes('buyer@example.test'), 'only an HMAC of the email');
    ok(w.lines(id).every((l) => l.status === 'queued'), 'lines queued'); ok(w.state().alarmAt != null && w.state().alarmAt <= w.clock.t + 1, 'alarm set');
    ok(w.mails(/_thanks$/).length === 1 && w.mails(/_thanks$/)[0].to === 'buyer@example.test', 'Thank you email to the address read from the session');
    ok(o.ship_by > o.paid_at + 5 * DAY, 'ship_by');
  });
  await T('T2.1-07', 'completed with payment_status unpaid (a delayed method): pay_pending = 1, nothing else', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); const r = await w.pay(id, { unpaid: true });
    ok(r.status === 200, r.text); eq([w.order(id).status, w.order(id).pay_pending], ['open', 1], 'open, pending');
    const p = await w.call('GET', '/merch/order/' + id); ok(p.json.pay_pending === true && p.json.status === 'open', 'the page says waiting for your bank');
    ok(!w.stripe.calls.some((c) => c.m === 'GET'), 'no re-read for an unpaid completed');
  });
  await T('T2.1-08', 'async_payment_succeeded: as T2.1-06, the hour starts now', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); await w.pay(id, { unpaid: true });
    w.clock.t += 2 * DAY; w.stripe.pay(w.sid(id));
    const r = await w.hook('checkout.session.async_payment_succeeded', { id: w.sid(id), object: 'checkout.session', payment_status: 'paid' });
    ok(r.status === 200, r.text); eq([w.order(id).status, w.order(id).cancel_until, w.order(id).pay_pending], ['paid', w.clock.t + HOUR, 0], 'paid, hour from now');
  });
  await T('T2.1-09', 'session expired or async_payment_failed: lines void; an expired order never takes a day-cap place (S9: paid orders only)', async () => {
    const w = await world({ env: { MERCH_DAY_CAP: '1' } }); const id = await w.newOrder([mug(0)]);
    let r = await w.hook('checkout.session.expired', { id: w.sid(id), object: 'checkout.session' });
    eq([w.order(id).status, w.lines(id)[0].status], ['expired', 'void'], 'expired'); r = await w.quote([mug(1)]); ok(r.status === 200, 'an expired order never takes a day-cap place');
    const id2 = await w.newOrder([mug(1)]); await w.hook('checkout.session.async_payment_failed', { id: w.sid(id2), object: 'checkout.session' }); ok(w.order(id2).status === 'expired', 'async_payment_failed too');
    const p = await w.paidOrder([mug(2)]); ok((await w.quote([mug(1)])).status === 409, 'a paid one does'); ok(w.order(p).status === 'paid', 'paid');
  });
  await T('T2.1-10', 'alarm: a queued line, renderer free: renders, stores the PNG, checks its size, writes sha, bytes, art_ver; lines at least 11 s apart', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0), tee(1)]);
    await w.advance(1); let L = w.lines(id); eq(L.map((l) => l.status), ['ready', 'queued'], 'one line per wake');
    ok(/^[0-9a-f]{64}$/.test(L[0].file_sha) && L[0].file_bytes > 2 * (1 << 20) && L[0].renderer === 'browser' && L[0].art_ver === PP.ART_VER, 'sha, bytes (over 2 MB: stored in parts), renderer');
    ok(w.rd.calls[0].url === 'https://merch-api.doodledoggo.app/merch/print/' + PP.ART_VER + '/' + L[0].print_link && w.rd.calls[0].viewport.width === 2700, 'the print page of the line’s art_ver: ' + w.rd.calls[0].url);
    await w.advance(5e3); ok(w.lines(id)[1].status === 'queued', 'not before 11 s');
    await w.advance(7e3); L = w.lines(id); ok(L[1].status === 'ready' || L[1].status === 'drafted', 'the second after 11 s'); ok(w.rd.calls[1].viewport.deviceScaleFactor === 2, 'tee viewport x2');
    const f = await w.L().fileUrl(L[0].file_key); const got = await w.raw('GET', f.replace('https://merch-api.doodledoggo.app', ''));
    const buf = new Uint8Array(await got.arrayBuffer()); ok(got.status === 200 && buf.length === L[0].file_bytes && buf[1] === 80, 'the stored PNG comes back whole');
  });
  await T('T2.1-11', 'alarm: every line ready: one Printful draft (not charged), draft costs stored, lines drafted', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0), tee(1)]); await w.advance(30e3);
    const o = w.order(id), P = w.pfOrder(id); ok(P && P.status === 'draft' && P.external_id === id, 'a draft with external_id = the order');
    eq(P.items.map((i) => i.external_id), [id + '_1', id + '_2'], 'item external ids'); ok(P.files.every((u) => /\/merch\/file\/p-2026-12-01~mo_.+\/\d+\/[0-9a-f]{64}\.png$/.test(u)), 'signed file URLs');
    ok(P.recipient.address1 === '1 Example Street' && !JSON.stringify(w.q('select * from merch_orders')).includes('Example Street'), 'recipient read from the session, never stored');
    ok(o.provider_cost === 607 + 1192 + 495 + 669 && w.lines(id).every((l) => l.status === 'drafted'), 'costs stored, lines drafted: ' + o.provider_cost);
    ok(!w.pf.calls.some((c) => /confirm/.test(c.path)), 'not confirmed');
  });
  await T('T2.1-12', 'alarm at cancel_until + 120 s, draft made, costs within 10%, live: claims confirming, confirms at Printful', async () => {
    const w = await world(); const id = await w.drafted([tee(0)]), cu = w.order(id).cancel_until;
    await w.advance(cu + GRACE - 1 - w.clock.t); ok(w.order(id).status === 'paid' && !w.pf.calls.some((c) => /confirm/.test(c.path)), 'nothing at cancel_until + 119.999 s');
    await w.advance(1); const o = w.order(id); eq([o.status, w.pfOrder(id).status], ['confirmed', 'pending'], 'confirmed'); ok(o.confirmed_at === cu + GRACE && w.lines(id).every((l) => l.status === 'confirmed'), 'lines confirmed at the grace');
  });
  await T('T2.1-13', 'MERCH_PROVIDER_MODE=draft: never confirms; held draft_mode, listed in the report', async () => {
    const w = await world({ env: { MERCH_PROVIDER_MODE: 'draft' } }); const id = await w.drafted([tee(0)]); await w.advance(2 * HOUR);
    eq([w.order(id).status, w.order(id).hold], ['held', 'draft_mode'], 'held'); ok(!w.pf.calls.some((c) => /confirm/.test(c.path)), 'never confirmed');
    ok(w.L().report().draft_mode.includes(id), 'in the report'); const p = await w.call('GET', '/merch/order/' + id); ok(p.json.status === 'held' && !p.json.can_cancel, 'page');
    const w2 = await world({ env: { MERCH_PROVIDER_MODE: undefined } }); const id2 = await w2.drafted([tee(0)]); await w2.advance(2 * HOUR); ok(w2.order(id2).hold === 'draft_mode', 'the default is draft');
  });
  await T('T2.1-14', 'Printful order in production (re-read after a hint): lines in_production', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]); const P = w.pfOrder(id); P.status = 'inprocess';
    const r = await w.phook(w.pf.hook(P, 'order_updated', 'evt_p1')); ok(r.status === 200, r.text);
    eq([w.order(id).status, w.lines(id)[0].status], ['confirmed', 'in_production'], 'in production');
  });
  await T('T2.1-15', 'a Printful shipment for some lines: parcel row, lines shipped, one On its way email me_<order>_ship_<parcel>, part_shipped', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]); const s = w.pf.ship(w.order(id).provider_order, [id + '_1']);
    await shipHint(w, id); const p = w.one('select * from merch_parcels where id = ?', s.id);
    ok(p && p.product === 'mug' && p.tracking_url === s.tracking_url, 'parcel row'); eq(w.lines(id).map((l) => l.status), ['shipped', 'in_production'], 'lines (Printful: partial = in production)');
    eq(w.order(id).status, 'part_shipped', 'part shipped'); ok(w.mails(new RegExp('^me_' + id + '_ship_' + s.id + '$')).length === 1, 'one email per parcel');
    const page = (await w.call('GET', '/merch/order/' + id)).json; ok(page.parcels.length === 1 && page.parcels[0].tracking_url === s.tracking_url, 'tracking link on the page');
  });
  await T('T2.1-16', 'shipment for the last live lines: shipped', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]), po = w.order(id).provider_order;
    w.pf.ship(po, [id + '_1']); await shipHint(w, id); w.pf.ship(po, [id + '_2'], { status: 'fulfilled' }); await shipHint(w, id);
    eq(w.order(id).status, 'shipped', 'shipped'); ok(w.q('select count(*) as n from merch_parcels where order_id = ?', id)[0].n === 2 && w.mails(/_ship_/).length === 2, 'two parcels, two emails');
  });
  await T('T2.1-17', 'Printful reports a parcel delivered: delivered_at, lines delivered', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]); const s = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
    s.delivered_at = w.clock.t + 3 * DAY; await shipHint(w, id);
    ok(w.one('select delivered_at from merch_parcels where id = ?', s.id).delivered_at === s.delivered_at && w.lines(id)[0].status === 'delivered' && w.order(id).status === 'shipped', 'delivered');
  });
  await T('T2.1-18', 'cancel within the hour: cancelled first, full refund mr_<order>_all_1, draft deleted, Cancelled email, files kept 2 days', async () => {
    const w = await world(); const id = await w.drafted([mug(0), tee(1)]); const po = w.order(id).provider_order;
    const r = await w.call('POST', '/merch/order/' + id + '/cancel', {}); eq([r.status, r.json.status, r.json.refund], [200, 'cancelled', 'done'], r.text);
    const o = w.order(id), re = w.stripe.refunds[0]; ok(o.status === 'cancelled' && re.amount === 4698 && re.metadata.merch_refund === 'mr_' + id + '_all_1', 'full refund');
    ok(w.stripe.calls.find((c) => c.path === '/v1/refunds' && c.m === 'POST').key === 'mr_' + id + '_all_1', 'the refund key');
    ok(w.pf.orders.get(po).deleted, 'the Printful draft deleted'); ok(w.lines(id).every((l) => l.status === 'cancelled' && l.keep_until === w.clock.t + 2 * DAY), 'lines cancelled, files 2 days');
    ok(w.mails(/_cancelled$/).length === 1, 'Cancelled email'); const p = (await w.call('GET', '/merch/order/' + id)).json; ok(p.lines.every((l) => l.recipe), 'the page can put these back in the basket');
    await w.advance(3 * HOUR); ok(!w.pf.calls.some((c) => /confirm/.test(c.path)), 'never confirmed');
  });
  await T('T2.1-19', 'cancel an unpaid order: expire the session at Stripe; if it is not open, GET tells expired from complete', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]);
    let r = await w.call('POST', '/merch/order/' + id + '/cancel', {}); eq([r.status, r.json.status], [200, 'expired'], r.text);
    ok(w.stripe.calls.some((c) => c.path === '/v1/checkout/sessions/' + w.sid(id) + '/expire'), 'expire called'); ok(w.order(id).status === 'expired', 'expired');
    const id2 = await w.newOrder([mug(1)]); w.stripe.pay(w.sid(id2)); // paid at Stripe, the webhook not here yet: expire fails, GET says complete
    r = await w.call('POST', '/merch/order/' + id2 + '/cancel', {}); eq([r.status, r.json.status], [200, 'cancelled'], 'complete: recorded as paid and cancelled with a full refund: ' + r.text);
    ok(w.stripe.refunds.some((x) => x.amount === 2498), 'refunded');
  });
  await T('T2.1-20', 'cancel after the window (confirming or later): 409 too_late, nothing changes', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]); const before = JSON.stringify(w.order(id));
    const r = await w.call('POST', '/merch/order/' + id + '/cancel', {}); ok(r.status === 409 && r.json.error === 'too_late' && /Printing has started/.test(r.json.say), r.text);
    ok(JSON.stringify(w.order(id)) === before && !w.stripe.refunds.length, 'unchanged');
  });
  await T('T2.1-21', 'owner refunds a line (merch.sh refund): row mr_<order>_l<line>_<n>, a Stripe partial refund (section 4), refunded_qty, Refunded email', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1, { qty: 2 })]);
    const r = await w.admin('POST', 'order/' + id + '/refund', { line: 2, qty: 1, reason: 'damaged' }); ok(r.status === 200 && r.json.refund === 'mr_' + id + '_l2_1' && r.json.amount === 2699, r.text);
    const r2 = await w.admin('POST', 'order/' + id + '/refund', { line: 2, qty: 1, reason: 'damaged' }); ok(r2.json.refund === 'mr_' + id + '_l2_2', 'n counts the scope');
    eq([w.lines(id)[1].refunded_qty, w.order(id).refunded, w.order(id).status], [2, 5398, 'confirmed'], 'line and order'); ok(w.stripe.refunds.map((x) => x.amount).join() === '2699,2699', 'partial refunds');
    ok(w.mails(/_refund_mr_/).length === 2, 'Refunded emails');
    const bad = await w.admin('POST', 'order/' + id + '/refund', { line: 2, qty: 1, reason: 'x' }); ok(bad.status === 400 && bad.json.error === 'bad_qty', 'nothing left on that line');
    const w2 = await world(); const id2 = await w2.confirmedOrder([mug(0, { qty: 2 }), tee(1)], 'HK'); // world: + $5.99 for each refunded extra item
    const r3 = await w2.admin('POST', 'order/' + id2 + '/refund', { line: 1, qty: 1, reason: 'misprint' }); ok(r3.json.amount === 1999 + 599, 'world zone extra item: ' + r3.json.amount);
  });
  await T('T2.1-22', 'a refund that leaves no item un-refunded also refunds the shipping that is left: refunded', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]); // 1999 + 499 shipping
    const r = await w.admin('POST', 'order/' + id + '/refund', { line: 1, reason: 'lost' }); ok(r.json.amount === 2498 && r.json.status === 'refunded', r.text);
    eq([w.order(id).status, w.order(id).refunded], ['refunded', 2498], 'refunded in full');
  });
  await T('T2.1-23', 'owner reprints lines: new line rows (reprint_of, 101), the stored PNG, a Printful order <order>-r1 confirmed at once, old lines replaced', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]), po = w.order(id).provider_order;
    w.pf.ship(po, [id + '_1', id + '_2'], { status: 'fulfilled' }); await shipHint(w, id); ok(w.order(id).status === 'shipped', 'shipped');
    const r = await w.admin('POST', 'order/' + id + '/reprint', { lines: [2] }); ok(r.status === 200 && r.json.reprint === id + '-r1', r.text);
    const L = w.lines(id), n = L.find((l) => l.line === 101);
    ok(n && n.reprint_of === 2 && n.file_key === L[1].file_key && n.status === 'confirmed' && L[1].status === 'replaced', 'new line from the stored PNG: ' + JSON.stringify(L.map((l) => [l.line, l.status])));
    const P = w.pf.orders.get(w.one('select provider_order from merch_reprints where id = ?', id + '-r1').provider_order);
    ok(P.external_id === id + '-r1' && P.status === 'pending' && P.items[0].external_id === id + '-r1_101', 'confirmed at once');
    eq(w.order(id).status, 'part_shipped', 'part shipped until it ships'); ok(w.mails(/_reprint_1$/).length === 1 && w.stripe.calls.filter((c) => c.path === '/v1/refunds').length === 0, 'A new one is on its way; no charge to the buyer');
    w.pf.ship(P.id, [id + '-r1_101'], { status: 'fulfilled' }); await w.phook(w.pf.hook(P, 'package_shipped', 'evt_rp1')); eq(w.order(id).status, 'shipped', 'the reprint ships');
  });
  await T('T2.1-24', 'any Stripe event id seen before: 200, nothing changes (the event row is written with the work)', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); const cs = w.stripe.pay(w.sid(id));
    const e = await w.stripe.event('checkout.session.completed', { id: cs.id, payment_status: 'paid', metadata: cs.metadata }, { now: w.clock.t });
    const a = await w.call('POST', '/merch/webhook/stripe', e.raw, { 'stripe-signature': e.sig }); const gets = w.stripe.calls.length, mails = w.mail.sent.length;
    const b = await w.call('POST', '/merch/webhook/stripe', e.raw, { 'stripe-signature': e.sig });
    ok(a.status === 200 && b.status === 200 && w.stripe.calls.length === gets && w.mail.sent.length === mails, 'no-op the second time');
    ok(w.one('select id from merch_events where id = ?', 's:' + e.id), 'event row');
  });
  await T('T2.1-25', 'completed and async_payment_succeeded both arrive for one paid session: the second is a no-op', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]); const pa = w.order(id).paid_at; w.clock.t += 5e3;
    const r = await w.hook('checkout.session.async_payment_succeeded', { id: w.sid(id), payment_status: 'paid' }); ok(r.status === 200, r.text);
    ok(w.order(id).paid_at === pa && w.mails(/_thanks$/).length === 1, 'unchanged');
  });
  await T('T2.1-26', 'session expired after completed: ignored', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]); await w.hook('checkout.session.expired', { id: w.sid(id) });
    eq(w.order(id).status, 'paid', 'still paid'); ok(w.lines(id)[0].status !== 'void', 'lines untouched');
  });
  await T('T2.1-27', 'the same Printful hint twice (its event id or sha256 of the body): no-op', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]); w.pf.ship(w.order(id).provider_order, [id + '_1']);
    const body = w.pf.hook(w.pfOrder(id), 'package_shipped', null); // no event id: the body's sha256 is the key
    await w.phook(body); const gets = w.pf.calls.length; await w.phook(body); ok(w.pf.calls.length === gets && w.mails(/_ship_/).length === 1, 'second identical body: no re-read, no email');
    const b2 = w.pf.hook(w.pfOrder(id), 'package_shipped', 'evt_same'); await w.phook(b2); const g2 = w.pf.calls.length; await w.phook(b2); ok(w.pf.calls.length === g2, 'same event id: no-op');
  });
  await T('T2.1-28', 'Printful hints out of order (shipped, then in production): the re-read decides; a line never moves back', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]); const P = w.pfOrder(id);
    w.pf.ship(P.id, [id + '_1']); await w.phook(w.pf.hook(P, 'package_shipped', 'e1'));
    P.status = 'inprocess'; await w.phook(w.pf.hook(P, 'order_updated', 'e0'));
    eq(w.lines(id).map((l) => l.status), ['shipped', 'in_production'], 'shipped stays shipped'); eq(w.order(id).status, 'part_shipped', 'part shipped');
  });
  await T('T2.1-29', 'address fix in held address: sent straight to Printful (never stored), hold cleared, the flow resumes (confirm if the hour passed)', async () => {
    const w = await world(); w.pf.refuse.recipient = true; const id = await w.paidOrder([mug(0)]); await w.advance(2 * MIN);
    eq([w.order(id).status, w.order(id).hold], ['held', 'address'], 'held address'); w.pf.refuse.recipient = false; await w.advance(HOUR);
    const r = await w.call('POST', '/merch/order/' + id + '/address', { name: 'Pat Example', line1: '22 Fixed Road', city: 'Newtown', state: 'CA', postal: '90001', country: 'US' });
    ok(r.status === 200 && r.json.ok, r.text); ok(w.pfOrder(id).recipient.address1 === '22 Fixed Road', 'Printful got it');
    ok(!JSON.stringify(w.q('select * from merch_orders')).includes('Fixed Road') && !JSON.stringify(w.q('select * from merch_events')).includes('Fixed Road'), 'never stored');
    await w.advance(1e3); eq(w.order(id).status, 'confirmed', 'the hour had passed: confirmed');
    const bad = await w.call('POST', '/merch/order/' + id + '/address', { name: 'x', line1: 'y', city: 'z', postal: '1', country: 'US' }); ok(bad.status === 409 && bad.json.error === 'not_needed', 'not needed now');
  });
  await T('T2.1-30', 'alarm: a live line not shipped by ship_by: once per order "Taking longer than we said", late_sent_at', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]); w.pf.ship(w.order(id).provider_order, [id + '_1']); await shipHint(w, id);
    await w.advance(w.order(id).ship_by - w.clock.t + 1e3); ok(w.order(id).late_sent_at && w.mails(/_late$/).length === 1, 'late email');
    await w.advance(3 * DAY); ok(w.mails(/_late$/).length === 1, 'once'); ok((await w.call('GET', '/merch/order/' + id)).json.late === true, 'the page offers the late cancel');
  });
  await T('T2.1-31', 'cancel {scope: late} after the delay email: refunds every unshipped live line; Printful cancels the order only if none of it shipped (N5), else an owner email', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]); w.pf.ship(w.order(id).provider_order, [id + '_1']); await shipHint(w, id);
    let r = await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' }); ok(r.status === 409 && r.json.error === 'not_late', 'not before the delay email');
    await w.advance(w.order(id).ship_by - w.clock.t + 1e3); w.pfOrder(id).status = 'inprocess';
    r = await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' }); ok(r.status === 200 && r.json.status === 'shipped', 'what is left has all shipped: ' + r.text);
    ok(w.stripe.refunds.map((x) => x.amount).join() === '2699' && w.lines(id)[1].refunded_qty === 1, 'the tee refunded; shipping stays as charged: ' + w.stripe.refunds.map((x) => x.amount));
    ok(!w.pf.calls.some((c) => c.m === 'DELETE'), 'N5: part of the Printful order shipped, so it is not cancelled whole'); ok(w.owner(/cancel_late/).length === 1 && /cancel those items/.test(w.owner(/cancel_late/)[0].text), 'owner email: cancel the late items by hand');
    const x = await world(); const j = await x.confirmedOrder([tee(0)]); await x.advance(x.order(j).ship_by - x.clock.t + 1e3); // nothing shipped: the whole order is cancelled at Printful
    const c = await x.call('POST', '/merch/order/' + j + '/cancel', { scope: 'late' }); ok(c.status === 200 && c.json.status === 'refunded' && x.pf.calls.some((y) => y.m === 'DELETE') && !x.order(j).pcancel, 'nothing shipped: asked Printful to cancel: ' + c.text);
  });
  await T('T2.1-32', 'nightly: a variant that fails the floor alone: on_flag = 0, owner email; quote and checkout 409 variant_off', async () => {
    const w = await world(); await w.init(); w.pf.costs = { variants: { 'tee:pink:L': 2500 }, ship: {} };
    w.clock.t = Date.parse('2026-12-02T04:30:00+09:00'); const r = await w.call('POST', '/merch/admin/nightly', {}, { authorization: 'Bearer ' + w.env.MERCH_ADMIN_KEY }); ok(r.status === 200, r.text);
    ok(w.one("select on_flag from merch_variants where id = 'tee:pink:L'").on_flag === 0 && w.one("select on_flag from merch_variants where id = 'tee:pink:M'").on_flag === 1, 'only that variant');
    ok(w.owner(/variant_off/).length === 1, 'owner email'); const q = await w.quote([tee(0, { colour: 'pink', size: 'L' })]); ok(q.status === 409 && q.json.error === 'variant_off' && q.json.line === 1, q.text);
    const c = await w.call('GET', '/merch/catalog'); ok(!c.json.products[1].colours.find((x) => x.id === 'pink').sizes.includes('L'), 'the catalog leaves it out');
  });
  await T('T2.1-33', 'tidy (nightly): files, hashes, names, recipes, events, unpaid orders, rate rows (section 5)', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]); w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
    const gone = await w.newOrder([mug(2)]); await w.hook('checkout.session.expired', { id: w.sid(gone) });
    const key = w.lines(id)[0].file_key, shard = key.split('~')[0]; ok(w.env.PRINTS.get(shard).obj.stat().files === 1, 'one file stored');
    await w.L().tidy(w.clock.t + 31 * DAY); ok(!w.order(gone), 'expired order deleted after 30 days'); ok(w.lines(id)[0].file_key === key, 'the file stays');
    await w.L().tidy(w.clock.t + 181 * DAY); ok(w.lines(id)[0].file_key === null && w.q('select count(*) as n from merch_shards')[0].n === 0, 'file gone 180 days after shipping, empty shard dropped');
    ok(w.q('select count(*) as n from merch_events where at < ?', w.clock.t + 181 * DAY - 90 * DAY)[0].n === 0, 'events older than 90 days gone');
    ok(w.order(id).email_hash && w.lines(id)[0].recipe, 'buyer data kept until 24 months');
    await w.L().tidy(w.clock.t + 740 * DAY); ok(!w.order(id).email_hash && !w.lines(id)[0].recipe && !w.lines(id)[0].print_link && w.order(id).total === 2498, 'hash, name, recipe and link cleared after 24 months; money kept');
    ok(w.q('select count(*) as n from merch_rate')[0].n === 0, 'rate rows gone');
  });
}
