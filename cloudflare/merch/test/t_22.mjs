// Stage 3: TRANSACTIONS.md 2.2, one test per row (T2.2-01..56).
import { T, ok, eq, world, mug, tee, R, DOG, PP, MIN, HOUR, DAY } from './harness.mjs';
import { hmacHex, sha256hex } from '../util.js';

const GRACE = 120e3;
const shipHint = async (w, id, eid) => w.phook(w.pf.hook(w.pfOrder(id), 'package_shipped', eid || 'evt_' + Math.random()));
const st = (w, id) => [w.order(id).status, w.order(id).hold];
const refunded = (w) => w.stripe.refunds.reduce((a, x) => a + x.amount, 0);

export async function t22() {
  console.log('--- stage 3: failures and odd cases (2.2)');
  await T('T2.2-01', 'two tabs, two nonces, the same basket: two open orders (open sessions never count toward the cap: S9); the unpaid one expires within 1 h', async () => {
    const w = await world(); const a = await w.newOrder([mug(0)]), b = await w.newOrder([mug(0)]);
    ok(a !== b && w.L().dayCount(w.order(a).day) === 0, 'two orders, neither counts while open'); await w.pay(a); ok(w.L().dayCount(w.order(a).day) === 1, 'the paid one counts');
    await w.advance(2 * HOUR + MIN); eq(w.order(b).status, 'expired', 'the unpaid one expired (Stripe expired it at 1 h; the alarm asked)'); ok(w.order(a).status !== 'expired', 'the paid one goes on');
  });
  await T('T2.2-02', 'shop shut (MERCH_FROM empty or future): checkout 503 merch_closed, quote answers shut: true, catalog shut; webhooks, renders, confirms and refunds still run', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]), id2 = await w.paidOrder([tee(1)]);
    w.env.MERCH_FROM = '';
    const r0 = await w.call('POST', '/merch/checkout', { country: 'US', lines: [mug(0)], expect_total: 2498, art_ver: PP.ART_VER, nonce: 'shut-nonce-1', agree: true }); ok(r0.status === 503 && r0.json.error === 'merch_closed', 'checkout');
    ok((await w.call('GET', '/merch/catalog')).json.shut === true, 'catalog shut'); w.env.MERCH_FROM = '2027-03-01T00:00:00+09:00'; const q = await w.quote([mug(0)]); ok(q.status === 200 && q.json.shut === true, 'a future MERCH_FROM: the quote says shut');
    const r = await w.pay(id); ok(r.status === 200 && w.order(id).status === 'paid', 'the webhook still runs');
    const c = await w.call('POST', '/merch/order/' + id + '/cancel', {}); ok(c.status === 200 && c.json.status === 'cancelled' && w.stripe.refunds.length === 1, 'refunds still run');
    await w.advance(65 * MIN); ok(w.order(id2).status === 'confirmed', 'renders and confirms still run');
  });
  await T('T2.2-03', 'MERCH_OFF=1: new checkouts refused (resting); paid orders finish; order pages say resting', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]); w.env.MERCH_OFF = '1';
    const r = await w.checkout([mug(1)]); ok(r.status === 503 && r.json.error === 'merch_closed' && r.json.resting === true, r.text);
    await w.advance(65 * MIN); eq(w.order(id).status, 'confirmed', 'the paid order finishes'); ok((await w.call('GET', '/merch/order/' + id)).json.resting === true, 'page: resting');
  });
  await T('T2.2-04', 'country not open (MERCH_COUNTRIES, the never list): 403 country_closed', async () => {
    const w = await world(); for (const c of ['GB', 'DE', 'BR', 'KR', 'RU', 'UA']) { const r = await w.quote([mug(0)], c); ok(r.status === 403 && r.json.error === 'country_closed', c + ' ' + r.status); }
    const w2 = await world({ env: { MERCH_COUNTRIES: 'all' } }); ok((await w2.quote([mug(0)], 'RU')).status === 403 && (await w2.quote([mug(0)], 'GB')).status === 200, 'all: never list still shut, GB open');
    const w3 = await world({ env: { MERCH_COUNTRIES: '' } }); ok((await w3.quote([mug(0)], 'US')).status === 403, 'empty: none');
  });
  await T('T2.2-05', 'product not in MERCH_PRODUCTS (stickers) or not launch: 400 bad_line {line, why: product}', async () => {
    const w = await world({ env: { MERCH_PRODUCTS: 'tee' } });
    for (const L of [mug(0), { recipe: R[0], product: 'stickers', pose: 'stand', qty: 1 }, { recipe: R[0], product: 'hoodie', pose: 'stand', qty: 1 }]) { const r = await w.quote([tee(0), L]); eq([r.status, r.json.error, r.json.line, r.json.why], [400, 'bad_line', 2, 'product'], L.product); }
  });
  await T('T2.2-06', 'bad recipe, two dogs in one line, unknown colour, size or pose: 400 bad_line {line, why}', async () => {
    const w = await world(); const two = PP.merchEncode([DOG[0], DOG[1]]), cut = R[0].slice(0, -3) + 'AAA';
    for (const [L, why] of [[mug(0, { recipe: cut }), 'recipe'], [mug(0, { recipe: two }), 'recipe'], [mug(0, { recipe: 42 }), 'recipe'], [tee(0, { colour: 'orange' }), 'colour'], [mug(0, { colour: 'navy' }), 'colour'],
      [tee(0, { size: 'XXL' }), 'size'], [tee(0, { size: null }), 'size'], [mug(0, { pose: 'dance' }), 'pose'], [mug(0, { pose: undefined }), 'pose']]) {
      const r = await w.quote([L]); eq([r.status, r.json.error, r.json.why], [400, 'bad_line', why], JSON.stringify(L).slice(0, 60));
    }
  });
  await T('T2.2-07', 'name refused by merch/names.js: 400 bad_name {line, say}', async () => {
    const w = await world();
    for (const n of ['Fvck', 'A.S.S', 'Shiiit']) { const d = Object.assign({}, DOG[0], { n }); let rec; try { rec = PP.merchEncode(d); } catch (e) { continue; } const r = await w.quote([mug(1), mug(0, { recipe: rec, name_on: true })]); ok(r.status === 400 && r.json.error === 'bad_name' && r.json.line === 2 && r.json.say, n + ': ' + r.text); }
    ok((await w.quote([mug(0, { recipe: PP.merchEncode(Object.assign({}, DOG[0], { n: 'Scunthorpe' })), name_on: true })])).status === 200, 'Scunthorpe passes');
  });
  await T('T2.2-08', 'more than 6 lines, quantity 0 or over 3 (identical lines are merged first): too_many / bad_qty', async () => {
    const w = await world();
    let r = await w.quote([0, 1, 2, 3, 4, 5, 6].map((i) => mug(i))); ok(r.status === 400 && r.json.error === 'too_many', '7 lines');
    r = await w.quote([0, 1, 2, 3, 4, 5].map((i) => mug(i)).concat([mug(0)])); ok(r.status === 200 && r.json.lines.length === 6, '7 lines that merge to 6 are fine');
    for (const q of [0, 4, 1.5, '2', -1]) { r = await w.quote([mug(1), mug(0, { qty: q })]); ok(r.status === 400 && r.json.error === 'bad_qty' && r.json.line === 2, 'qty ' + q); }
    r = await w.quote([mug(0, { qty: 2 }), mug(0, { qty: 2 })]); ok(r.status === 400 && r.json.error === 'bad_qty', '2 + 2 merged is over 3');
  });
  await T('T2.2-09', 'expect_total differs from the server total: 409 price_changed {quote}; nothing written', async () => {
    const w = await world(); const r = await w.call('POST', '/merch/checkout', { country: 'US', lines: [mug(0)], expect_total: 2399, art_ver: PP.ART_VER, nonce: 'price-change-1', agree: true });
    ok(r.status === 409 && r.json.error === 'price_changed' && r.json.quote.total === 2498, r.text); ok(w.q('select count(*) as n from merch_orders')[0].n === 0 && !w.stripe.calls.length, 'nothing written');
  });
  await T('T2.2-10', 'the catalog changes after a session is made, before payment: the session’s prices are honoured (checks use the order row)', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); w.L().cat.products.mug.price = 2199;
    await w.pay(id); eq(st(w, id), ['paid', null], 'paid at the old price'); ok(w.order(id).total === 2498, 'the order row');
    w.L().cat.products.mug.price = 1999;
  });
  await T('T2.2-11', 'day cap reached (paid orders of the JST day): 409 sold_out_today; sessions already open are honoured when paid, even after the cap is lowered', async () => {
    const w = await world({ env: { MERCH_DAY_CAP: '2' } }); const a = await w.newOrder([mug(0)]); await w.paidOrder([mug(1)]); await w.paidOrder([mug(3)]);
    const r = await w.checkout([mug(2)]); ok(r.status === 409 && r.json.error === 'sold_out_today', r.text); ok((await w.call('GET', '/merch/catalog')).json.sold_out_today === true, 'the catalog says so');
    w.env.MERCH_DAY_CAP = '0'; await w.pay(a); eq(st(w, a), ['paid', null], 'a session opened before the cap was reached, paid after it: still served');
    w.clock.t += DAY; w.env.MERCH_DAY_CAP = '2'; ok((await w.quote([mug(2)])).status === 200, 'the next JST day opens again');
  });
  await T('T2.2-12', 'the live margin guard fails at checkout (costs moved): 409 cant_make; owner email with the basket', async () => {
    const w = await world(); await w.init(); w.L().run("insert into merch_variants (id, product, colour, size, cost_base, on_flag) values ('mug:white', 'mug', 'white', null, 1700, 1)");
    const r = await w.checkout([mug(0)]); ok(r.status === 409 && r.json.error === 'cant_make', r.text); ok(!w.stripe.calls.length && w.owner(/cant_make/).length === 1 && /mug:white/.test(w.owner(/cant_make/)[0].text), 'no session; owner email names the basket');
  });
  await T('T2.2-13', 'art_ver from the page is not a version the Worker serves: 409 art_changed', async () => {
    const w = await world(); let r = await w.checkout([mug(0)], 'US', { art_ver: 'pp1-00000000' }); ok(r.status === 409 && r.json.error === 'art_changed', r.text);
    w.env.MERCH_ART_VERS = 'pp1-00000000'; r = await w.checkout([mug(0)], 'US', { art_ver: 'pp1-00000000' }); ok(r.status === 200, 'an older version the Worker still serves');
  });
  await T('T2.2-14', 'a paid session fails the re-read checks (amount, currency, lines, order id, a discount alone, a shipping fee): held review; no render; owner email; 24 h: full refund', async () => {
    for (const [po, why] of [[{ amount: 100 }, 'amount'], [{ currency: 'eur' }, 'currency']]) {
      const w = await world(); const id = await w.newOrder([mug(0)]); await w.pay(id, po);
      eq([...st(w, id), w.order(id).why], ['held', 'review', why], why); await w.advance(2 * HOUR); ok(!w.rd.calls.length && !w.pf.calls.length, 'no render, no Printful');
      ok(w.owner(/review/).length === 1, 'owner email'); await w.advance(23 * HOUR); eq(w.order(id).status, 'refunded', 'refunded after 24 h'); ok(w.mails(/refund_all/).length === 1, 'kind email');
    }
    const w = await world(); const id = await w.newOrder([mug(0)]); const cs = w.stripe.pay(w.sid(id)); cs.metadata = { merch: 'mo_other' };
    await w.hook('checkout.session.completed', { id: cs.id, payment_status: 'paid' }); eq(w.order(id).why, 'order_id', 'order id mismatch');
    const d = await world(); const di = await d.newOrder([mug(0)]); const dc = d.stripe.pay(d.sid(di)); dc.total_details.amount_discount = 100; dc.amount_total -= 100; // only the discount is wrong
    await d.hook('checkout.session.completed', { id: dc.id, payment_status: 'paid' }); eq([...st(d, di), d.order(di).why], ['held', 'review', 'discount'], 'a discount (metadata intact) is caught');
    const f = await world(); const fi = await f.newOrder([mug(0)]); const fc = f.stripe.pay(f.sid(fi)); fc.shipping_cost.amount_subtotal = 0; fc.amount_total -= 499; // a shipping fee that is not ours
    await f.hook('checkout.session.completed', { id: fc.id, payment_status: 'paid' }); eq(f.order(fi).why, 'shipping', 'a shipping-fee mismatch is caught');
    const w2 = await world(); const id2 = await w2.newOrder([mug(0), tee(1)]); const c2 = w2.stripe.pay(w2.sid(id2)); c2.line_items.data[1].quantity = 2;
    await w2.hook('checkout.session.completed', { id: c2.id, payment_status: 'paid' }); eq(w2.order(id2).why, 'lines', 'line items');
  });
  await T('T2.2-15', 'shipping country on the paid session differs from the order’s: review (other_country); after 24 h a full refund', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); await w.pay(id, { country: 'CA' });
    eq([...st(w, id), w.order(id).why], ['held', 'review', 'other_country'], 'held'); await w.advance(DAY + MIN); eq(w.order(id).status, 'refunded', 'refunded'); ok(refunded(w) === 2498, 'all of it');
  });
  await T('T2.2-16', 'Stripe re-read fails (network, 429, any non-OK): 502, nothing written, no event row; Stripe retries', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); w.stripe.fail.get = 1;
    const r = await w.pay(id); ok(r.status === 502, r.text); ok(!w.one('select id from merch_events where id = ?', 's:' + r.eventId) && w.order(id).status === 'open', 'nothing written');
    const again = await w.call('POST', '/merch/webhook/stripe', r.raw, { 'stripe-signature': r.sig }); ok(again.status === 200 && w.order(id).status === 'paid', 'the retry works');
  });
  await T('T2.2-17', 'bad Stripe-Signature or outside 300 s: 400 bad_signature / stale (and good, replayed)', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); const cs = w.stripe.pay(w.sid(id)); const obj = { id: cs.id, payment_status: 'paid' };
    let r = await w.hook('checkout.session.completed', obj, { badSig: true }); ok(r.status === 400 && r.json.error === 'bad_signature', 'bad');
    r = await w.hook('checkout.session.completed', obj, { secret: 'whsec_other' }); ok(r.status === 400 && r.json.error === 'bad_signature', 'other secret');
    r = await w.hook('checkout.session.completed', obj, { t: Math.floor(w.clock.t / 1000) - 301 }); ok(r.status === 400 && r.json.error === 'stale', 'stale');
    r = await w.call('POST', '/merch/webhook/stripe', '{"id":"evt_x"}', {}); ok(r.status === 400 && r.json.error === 'bad_signature', 'none');
    r = await w.call('POST', '/merch/webhook/stripe', '{"id":"evt_x"}', { 'stripe-signature': 't=1,v1=zz' }); ok(r.json.error === 'bad_signature', 'malformed');
    ok(w.order(id).status === 'open', 'nothing changed'); const good = await w.hook('checkout.session.completed', obj); ok(good.status === 200 && w.order(id).status === 'paid', 'good');
    w.clock.t += 400e3; const replay = await w.call('POST', '/merch/webhook/stripe', good.raw, { 'stripe-signature': good.sig }); ok(replay.status === 400 && replay.json.error === 'stale', 'a replay after 5 minutes is stale');
    const w2 = await world({ env: { MERCH_STRIPE_WEBHOOK_SECRET: undefined } }); r = await w2.call('POST', '/merch/webhook/stripe', '{}', { 'stripe-signature': 't=1,v1=' + '0'.repeat(64) }); ok(r.status === 503, 'no secret set: 503 so Stripe retries later');
  });
  await T('T2.2-18', 'charge.refunded (full) before completed: session looked up by payment_intent; order refunded, lines cancelled; the later completed makes nothing; lookup fails: 502; a PARTIAL refund before completed: held review for the owner, 24 h: the rest back (S3)', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); const cs = w.stripe.pay(w.sid(id)); w.stripe.dashRefund(cs.payment_intent, 2498);
    w.stripe.fail.list = 1; let r = await w.hook('charge.refunded', { id: 'ch_1', payment_intent: cs.payment_intent, amount: 2498, refunded: true }); ok(r.status === 502, 'lookup fails: 502');
    r = await w.hook('charge.refunded', { id: 'ch_1', payment_intent: cs.payment_intent, amount: 2498, refunded: true }); ok(r.status === 200, r.text);
    eq([w.order(id).status, w.lines(id)[0].status, w.order(id).refunded], ['refunded', 'cancelled', 2498], 'refunded');
    await w.hook('checkout.session.completed', { id: cs.id, payment_status: 'paid' }); await w.advance(3 * HOUR); ok(w.order(id).status === 'refunded' && !w.rd.calls.length && !w.pf.calls.length, 'nothing rendered, no Printful order');
    ok(w.lines(id).every((l) => l.refunded_qty === l.qty), 'every line counts as refunded');
    // S3: a PARTIAL refund before completed: held for the owner, never "refunded, make nothing", never printed silently
    const x = await world(); const j = await x.newOrder([mug(0)]); const c2 = x.stripe.pay(x.sid(j)); x.stripe.dashRefund(c2.payment_intent, 500);
    await x.hook('charge.refunded', { id: 'ch_p', payment_intent: c2.payment_intent, amount: 2498, refunded: false });
    eq([...st(x, j), x.order(j).why, x.order(j).refunded], ['held', 'review', 'dash_refund', 500], 'held review, the amount recorded'); ok(x.owner(/review/).length === 1, 'owner email');
    await x.hook('checkout.session.completed', { id: c2.id, payment_status: 'paid' }); ok(x.order(j).paid_at && x.order(j).status === 'held' && !x.rd.calls.length, 'completed records the payment; the hold stays; nothing printed');
    await x.advance(DAY + MIN); ok(x.order(j).status === 'refunded' && refunded(x) === 2498, '24 h without the owner: the rest (1998) back, 2498 in all: ' + refunded(x));
  });
  await T('T2.2-19', 'a partial refund made in the Stripe Dashboard: refunded += amount; an unassigned merch_refunds row; lines unchanged; nightly report', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]); const pi = w.order(id).payment_intent; const re = w.stripe.dashRefund(pi, 500);
    await w.hook('charge.refunded', { id: 'ch_2', payment_intent: pi, amount: 4698, refunded: false });
    const row = w.one('select * from merch_refunds where id = ?', 's:' + re.id); ok(row && row.line === null && row.amount === 500, 'unassigned row');
    eq([w.order(id).refunded, w.order(id).status, w.lines(id).map((l) => l.refunded_qty).join()], [500, 'confirmed', '0,0'], 'order and lines'); ok(w.L().report().unassigned_refunds.length === 1, 'report');
    const ours = await w.admin('POST', 'order/' + id + '/refund', { line: 1, reason: 'damaged' }); await w.hook('charge.refunded', { id: 'ch_2', payment_intent: pi, amount: 4698 });
    ok(w.order(id).refunded === 500 + ours.json.amount && w.q('select count(*) as n from merch_refunds where order_id = ?', id)[0].n === 2, 'our own refund is matched by its metadata, not counted twice');
  });
  await T('T2.2-20', 'a full refund in the Dashboard, order not yet confirmed: refunded; the Printful draft deleted; never confirmed', async () => {
    const w = await world(); const id = await w.drafted([tee(0)]); const pi = w.order(id).payment_intent, po = w.order(id).provider_order; w.stripe.dashRefund(pi, 3198);
    await w.hook('charge.refunded', { id: 'ch_3', payment_intent: pi, amount: 3198, refunded: true }); eq(w.order(id).status, 'refunded', 'refunded');
    ok(w.pf.orders.get(po).deleted, 'draft deleted'); await w.advance(3 * HOUR); ok(!w.pf.calls.some((c) => /confirm/.test(c.path)), 'never confirmed');
  });
  await T('T2.2-21', 'a full refund in the Dashboard after confirm: refunded (it stays so: later shipments are stored as parcels); owner email', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]); const pi = w.order(id).payment_intent; w.stripe.dashRefund(pi, 3198);
    await w.hook('charge.refunded', { id: 'ch_4', payment_intent: pi, amount: 3198, refunded: true }); eq(w.order(id).status, 'refunded', 'refunded');
    ok(w.owner(/refund_after_confirm/).length === 1 && /Printful dashboard/.test(w.owner(/refund_after_confirm/)[0].text), 'owner email');
    w.pf.ship(w.order(id).provider_order, [id + '_1']); await shipHint(w, id); ok(w.order(id).status === 'refunded' && w.q('select count(*) as n from merch_parcels')[0].n === 1, 'parcel stored, status stays');
    ok((await w.call('GET', '/merch/order/' + id)).json.parcels.length === 1, 'tracking still shown');
  });
  await T('T2.2-22', 'charge.dispute.created before confirm: held dispute; draft deleted; no confirm, no refund; the email hash flagged block', async () => {
    const w = await world(); const id = await w.drafted([tee(0)]); const o = w.order(id);
    await w.hook('charge.dispute.created', { id: 'dp_1', payment_intent: o.payment_intent, status: 'needs_response' });
    eq([...st(w, id), w.order(id).dispute], ['held', 'dispute', 'open'], 'held'); ok(w.pf.orders.get(o.provider_order).deleted, 'draft deleted');
    await w.advance(3 * DAY); ok(!w.pf.calls.some((c) => /confirm/.test(c.path)) && !w.stripe.refunds.length, 'no confirm, no refund');
    ok(w.one('select mode from merch_flags where key = ?', 'e:' + o.email_hash).mode === 'block', 'hash flagged');
    const c = await w.call('POST', '/merch/order/' + id + '/cancel', {}); ok(c.status === 409 && c.json.error === 'not_allowed', 'no cancel while the bank decides');
  });
  await T('T2.2-23', 'a dispute after confirm or shipping: flag only; the flow goes on; hash flagged', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]); await w.hook('charge.dispute.created', { id: 'dp_2', payment_intent: w.order(id).payment_intent });
    eq([w.order(id).status, w.order(id).dispute], ['confirmed', 'open'], 'confirmed, flagged'); ok(w.one('select mode from merch_flags where key = ?', 'e:' + w.order(id).email_hash), 'hash flagged');
    const show = await w.admin('GET', 'order/' + id); ok(show.json.lines[0].file_url && /\/merch\/file\//.test(show.json.lines[0].file_url), 'the print PNG link for the owner’s answer');
  });
  await T('T2.2-24', 'a dispute before completed: session lookup by payment_intent; held dispute; the later completed does nothing more', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); const cs = w.stripe.pay(w.sid(id));
    await w.hook('charge.dispute.created', { id: 'dp_3', payment_intent: cs.payment_intent }); eq([...st(w, id)], ['held', 'dispute'], 'held dispute');
    await w.hook('checkout.session.completed', { id: cs.id, payment_status: 'paid' }); await w.advance(3 * HOUR);
    ok(w.order(id).status === 'held' && !w.rd.calls.length, 'nothing more'); ok(w.order(id).email_hash && w.one('select mode from merch_flags where key = ?', 'e:' + w.order(id).email_hash), 'the email hash is flagged too');
  });
  await T('T2.2-25', 'charge.dispute.closed, won: dispute won; an unprinted held order stays held; owner email (the owner decides)', async () => {
    const w = await world(); const id = await w.drafted([tee(0)]); const pi = w.order(id).payment_intent;
    await w.hook('charge.dispute.created', { id: 'dp_4', payment_intent: pi }); await w.hook('charge.dispute.closed', { id: 'dp_4', payment_intent: pi, status: 'won' });
    eq([...st(w, id), w.order(id).dispute], ['held', 'dispute', 'won'], 'held'); ok(w.owner(/dispute_won/).length === 1, 'owner email');
  });
  await T('T2.2-26', 'charge.dispute.closed, lost: dispute lost; draft lines deleted at Printful if still a draft; in the report', async () => {
    const w = await world(); const id = await w.drafted([tee(0)]); const pi = w.order(id).payment_intent, po = w.order(id).provider_order;
    await w.hook('charge.dispute.closed', { id: 'dp_5', payment_intent: pi, status: 'lost' }); eq(w.order(id).dispute, 'lost', 'lost');
    ok(w.pf.orders.get(po).deleted && w.L().report().disputes.some((d) => d.id === id && d.dispute === 'lost'), 'draft deleted, in the report');
  });
  await T('T2.2-27', 'checkout abandoned and no expired event: alarm at expires_at + 1 h asks Stripe: expired -> T2.1-09; complete and paid -> T2.1-06', async () => {
    const w = await world(); const a = await w.newOrder([mug(0)]), b = await w.newOrder([mug(1)]);
    w.stripe.sessions.get(w.sid(a)).status = 'expired'; w.stripe.pay(w.sid(b));
    await w.advance(HOUR + 59 * MIN); ok(w.order(a).status === 'open', 'not before expires_at + 1 h');
    await w.advance(2 * MIN); eq([w.order(a).status, w.order(b).status], ['expired', 'paid'], 'expired, and the missed payment is recorded');
  });
  await T('T2.2-28', 'render error on one line: retry once after 1 min; then resvg; still failing: line rejected, line refund, owner email; other lines go on', async () => {
    const w = await world(); w.rd.queue.push('err', 'err', 'err'); const id = await w.paidOrder([mug(0), tee(1)]);
    await w.advance(1); ok(w.lines(id)[0].tries === 1 && w.lines(id)[0].status === 'queued', 'retry after 1 min');
    await w.advance(MIN); const L = w.lines(id); eq(L[0].status, 'rejected', 'rejected after the second try and the resvg fallback');
    ok(w.rd.calls.map((c) => c.p).slice(0, 3).join() === '/screenshot,/screenshot,/resvg', 'browser, browser, resvg');
    ok(refunded(w) === 1999 && w.owner(/render_reject/).length === 1 && w.mails(/_reject_1$/).length === 1, 'the mug refunded; owner and buyer told');
    await w.advance(3 * MIN); ok(w.lines(id)[1].status === 'drafted' && w.pfOrder(id).items.length === 1, 'the tee goes on alone');
    for (const bad of ['wrongsize', 'big']) { const x = await world(); x.rd.queue.push(bad, bad, 'err'); const i = await x.paidOrder([mug(0)]); await x.advance(2 * MIN); eq(x.order(i).status, 'refunded', bad + ': a PNG of the wrong size or over 7.5 MB is never stored'); }
    const y = await world(); y.rd.queue.push('err'); const j = await y.paidOrder([mug(0)]); await y.advance(2 * MIN); ok(y.lines(j)[0].status === 'drafted' && y.lines(j)[0].renderer === 'browser', 'one error then fine');
  });
  await T('T2.2-29', 'Browser Run 429 for the day: resvg fallback; if that fails, wait for 00:00 UTC; past the hour held render; owner email at 2 h; refund at 72 h', async () => {
    const w = await world(); w.rd.queue.push('daily'); const id = await w.paidOrder([mug(0)]); await w.advance(1);
    ok(['ready', 'drafted'].includes(w.lines(id)[0].status) && w.lines(id)[0].renderer === 'resvg', 'the fallback made it');
    const x = await world(); x.clock.t = Date.parse('2026-12-01T02:00:00+09:00'); x.rd.queue.push(...Array(30).fill('daily'));
    const i = await x.paidOrder([mug(0)]); await x.advance(1); ok(x.order(i).next_try_at === x.order(i).cancel_until, 'looks again when the hour ends');
    await x.advance(4 * HOUR); ok(x.order(i).status === 'held' && x.order(i).hold === 'render' && x.order(i).next_try_at <= Date.parse('2026-12-01T00:00:00Z'), 'past the hour: held render, waits (at most until 09:00 JST, the reset)');
    const y = await world(); y.rd.queue.push(...Array(200).fill('daily')); const j = await y.paidOrder([mug(0)]);
    y.L().env.MERCH_PUBLIC_URL = undefined; await y.advance(HOUR + 5 * MIN); eq([...st(y, j)], ['held', 'render'], 'held');
    await y.advance(3 * HOUR); ok(y.owner(/render_held/).length >= 1, 'owner email after 2 h held');
    await y.advance(72 * HOUR); eq(y.order(j).status, 'refunded', 'refunded after 72 h held'); ok(y.mails(/refund_all/).length === 1, 'and the apology');
  });
  await T('T2.2-30', 'Browser Run 429 for the 1-per-10-s rate: next try in 11 s; no hold', async () => {
    const w = await world(); w.rd.queue.push('rate'); const id = await w.paidOrder([mug(0)]); await w.advance(1);
    ok(w.lines(id)[0].status === 'queued' && w.order(id).status === 'paid' && w.order(id).next_try_at === w.clock.t + 11e3, 'next try in 11 s: ' + (w.order(id).next_try_at - w.clock.t));
    await w.advance(12e3); ok(w.lines(id)[0].status !== 'queued', 'then it renders');
  });
  await T('T2.2-31', 'a print shard write fails (full): the next shard for that day (p-YYYY-MM-DD-b); retry at once', async () => {
    const w = await world({ env: { MERCH_SHARD_MAX: String(3 * (1 << 20)) } }); const id = await w.paidOrder([mug(0), mug(1)]); await w.advance(20e3);
    const keys = w.lines(id).map((l) => l.file_key); ok(keys[0].startsWith('p-2026-12-01~') && keys[1].startsWith('p-2026-12-01-b~'), 'the second file went to -b: ' + keys);
  });
  await T('T2.2-32', 'Printful refuses one line at draft: that line rejected; the draft made with the rest; line refund; the variant off; owner email', async () => {
    const w = await world(); w.pf.refuse.variants = ['pf:tee:navy:M']; const id = await w.paidOrder([mug(0), tee(1)]); await w.advance(30e3);
    eq(w.lines(id).map((l) => l.status), ['drafted', 'rejected'], 'lines'); ok(w.pfOrder(id).items.length === 1 && refunded(w) === 2699, 'drafted without it, the tee refunded');
    ok(w.one("select on_flag from merch_variants where id = 'tee:navy:M'").on_flag === 0 && w.owner(/provider_reject/).length === 1 && w.mails(/_reject_2$/).length === 1, 'variant off, owner and buyer told');
    ok((await w.quote([tee(0)])).json.error === 'variant_off', 'until the nightly check');
  });
  await T('T2.2-33', 'Printful refuses every line: full refund, shipping included; refunded; owner email', async () => {
    const w = await world(); w.pf.refuse.variants = ['pf:tee:navy:M', 'pf:mug:white']; const id = await w.paidOrder([mug(0), tee(1)], 'CA'); await w.advance(30e3);
    eq(w.order(id).status, 'refunded', 'refunded'); ok(refunded(w) === w.order(id).total && w.order(id).ship_fee === 799, 'all of it, shipping too'); ok(w.owner(/provider_reject/).length === 1, 'owner email');
  });
  await T('T2.2-34', 'Printful down (5xx or 429): backoff 1, 5, 15, 60 min, then hourly; past the hour held provider; owner email at 24 h', async () => {
    const w = await world(); w.pf.fail.create = 99; const id = await w.paidOrder([mug(0)]); await w.advance(1);
    const waits = []; for (let i = 0; i < 6; i++) { const t = w.order(id).next_try_at; waits.push(Math.round((t - w.clock.t) / MIN)); await w.advance(t - w.clock.t); }
    eq(waits, [1, 5, 15, 60, 60, 60], 'backoff 1, 5, 15, 60, then hourly');
    eq([...st(w, id)], ['held', 'provider'], 'held provider past the hour'); await w.advance(DAY); ok(w.owner(/provider_down/).length === 1, 'owner email at 24 h');
    w.pf.fail.create = 0; await w.advance(HOUR); ok(['confirmed', 'confirming'].includes(w.order(id).status), 'back when Printful is: ' + st(w, id));
  });
  await T('T2.2-35', 'Printful create times out or the object is killed after it (result unknown): GET by external id before creating again; never two Printful orders', async () => {
    const w = await world(); w.pf.timeoutCreate = 1; const id = await w.paidOrder([mug(0)]); await w.advance(1); ok(w.order(id).last_error === 'timeout', 'timeout noted');
    await w.advance(2 * MIN); ok(w.pf.orders.size === 1 && w.order(id).provider_order === Array.from(w.pf.orders.keys())[0], 'one Printful order, adopted');
    ok(w.pf.calls.some((c) => c.m === 'GET' && c.path === '/orders/@' + id), 'GET by external id first');
    // a CRASH during create (no timeout recorded: S16): the next try still GETs first and adopts it
    const x = await world(); x.pf.after.create = async () => { x.pf.after.create = null; x.evict(); }; const j = await x.paidOrder([mug(0)]); await x.advance(1);
    ok(!x.order(j).provider_order && x.pf.orders.size === 1, 'killed after Printful made it: nothing recorded'); await x.advance(10 * MIN);
    ok(x.pf.orders.size === 1 && x.order(j).provider_order === Array.from(x.pf.orders.keys())[0] && x.lines(j)[0].status === 'drafted', 'one Printful order, adopted after the crash');
  });
  await T('T2.2-36', 'Printful refuses the recipient: held address; "We need your address" email; 7 days without a fix: full refund', async () => {
    const w = await world(); w.pf.refuse.recipient = true; const id = await w.paidOrder([mug(0)]); await w.advance(1);
    eq([...st(w, id)], ['held', 'address'], 'held address'); ok(w.mails(/_address$/).length === 1, 'email'); ok((await w.call('GET', '/merch/order/' + id)).json.hold === 'address', 'the page shows the form');
    await w.advance(7 * DAY); eq(w.order(id).status, 'refunded', 'refunded after 7 days');
  });
  await T('T2.2-37', 'address fix in another country: 400 other_country; "Refund me instead" only in held address', async () => {
    const w = await world(); w.pf.refuse.recipient = true; const id = await w.paidOrder([mug(0)], 'CA'); await w.advance(1);
    const r = await w.call('POST', '/merch/order/' + id + '/address', { name: 'Pat', line1: '1 Rue', city: 'Paris', postal: '75001', country: 'FR' });
    ok(r.status === 400 && r.json.error === 'other_country' && r.json.country === 'CA', r.text);
    for (const [b, f] of [[{ line1: 'x', city: 'y', postal: '1', country: 'CA' }, 'name'], [{ name: 'x'.repeat(81), line1: 'x', city: 'y', postal: '1', country: 'CA' }, 'name'], [{ name: 'x', line1: 'x', city: 'y', postal: '1', country: 'ca' }, 'country']]) { const x = await w.call('POST', '/merch/order/' + id + '/address', b); ok(x.status === 400 && x.json.error === 'bad_address' && x.json.field === f, f); }
    const other = await w.paidOrder([mug(1)], 'CA'); const no = await w.call('POST', '/merch/order/' + other + '/refund', {}); ok(no.status === 409 && no.json.error === 'not_allowed', 'not in held address');
    const yes = await w.call('POST', '/merch/order/' + id + '/refund', {}); ok(yes.status === 200 && yes.json.status === 'refunded' && w.order(id).status === 'refunded', yes.text);
  });
  await T('T2.2-38', 'Printful billing fails at confirm: held wallet; retry every 30 min; owner email at once; 5 days: full refund', async () => {
    const w = await world(); w.pf.refuse.billing = true; const id = await w.drafted([mug(0)]); await w.advance(62 * MIN);
    eq([...st(w, id)], ['held', 'wallet'], 'held wallet'); ok(w.owner(/wallet/).length === 1, 'owner email at once'); ok(w.order(id).next_try_at - w.clock.t <= 30 * MIN, '30 min');
    w.pf.refuse.billing = false; await w.advance(31 * MIN); eq(w.order(id).status, 'confirmed', 'topped up: confirmed');
    const x = await world(); x.pf.refuse.billing = true; const j = await x.drafted([mug(0)]); await x.advance(62 * MIN + 5 * DAY + HOUR); eq(x.order(j).status, 'refunded', '5 days: refunded');
  });
  await T('T2.2-39', 'draft cost over cost_est + 10%: held review; owner email; owner confirms, or after 48 h: confirm if the margin is still >= $0, else refund', async () => {
    const w = await world(); w.pf.costMul = 1.4; const id = await w.drafted([tee(0)]); eq([...st(w, id), w.order(id).why], ['held', 'review', 'cost'], 'held'); ok(w.owner(/cost/).length === 1, 'owner email');
    const c = await w.admin('POST', 'order/' + id + '/confirm', {}); ok(c.status === 200, c.text); await w.advance(62 * MIN); eq(w.order(id).status, 'confirmed', 'owner confirmed');
    const x = await world(); x.pf.costMul = 1.4; const j = await x.drafted([tee(0)]); await x.advance(48 * HOUR + MIN); ok(['confirmed', 'confirming'].includes(x.order(j).status), '48 h, margin >= 0: confirmed');
    const y = await world(); y.pf.costMul = 3; const k = await y.drafted([tee(0)]); await y.advance(48 * HOUR + MIN); eq(y.order(k).status, 'refunded', '48 h, margin < 0: refunded');
  });
  await T('T2.2-40', 'cancel at minute 59 racing the confirm: both orders of arrival; a cancel during the draft call deletes the new draft (M1)', async () => {
    const w = await world(); const id = await w.drafted([tee(0)]); const paid = w.order(id).paid_at;
    await w.advance(paid + 59 * MIN - w.clock.t); const r = await w.call('POST', '/merch/order/' + id + '/cancel', {}); eq([r.status, r.json.status], [200, 'cancelled'], 'minute 59: cancelled');
    await w.advance(5 * MIN); ok(!w.pf.calls.some((c) => /confirm/.test(c.path)) && w.order(id).status === 'cancelled', 'the confirm alarm then does nothing');
    const g = await world(); const gi = await g.drafted([tee(0)]); await g.advance(g.order(gi).paid_at + 61 * MIN - g.clock.t);
    ok((await g.call('POST', '/merch/order/' + gi + '/cancel', {})).json.status === 'cancelled', 'minute 61, inside the 2-minute grace: cancelled');
    const x = await world(); const j = await x.drafted([tee(0)]); let go; x.pf.hangConfirm = new Promise((res) => { go = res; });
    const alarm = x.advance(x.order(j).cancel_until + GRACE - x.clock.t); await new Promise((res) => setTimeout(res, 30));
    eq(x.order(j).status, 'confirming', 'the alarm claimed it before calling Printful');
    const c = await x.call('POST', '/merch/order/' + j + '/cancel', {}); ok(c.status === 409 && c.json.error === 'too_late', 'a cancel that finds confirming: too_late');
    x.pf.hangConfirm = null; go(); await alarm; eq(x.order(j).status, 'confirmed', 'confirmed'); ok(!x.stripe.refunds.length, 'no refund');
    // M1: a cancel while Printful is making the draft: the new draft is deleted; no cost review; never confirmed
    const y = await world(); y.pf.costMul = 1.4; let k; y.pf.after.create = async () => { y.pf.after.create = null; const c2 = await y.call('POST', '/merch/order/' + k + '/cancel', {}); ok(c2.json.status === 'cancelled', 'cancelled during the draft'); };
    k = await y.paidOrder([tee(0)]); await y.advance(3 * HOUR);
    const P = Array.from(y.pf.orders.values()); ok(P.length === 1 && P[0].deleted, 'the draft made during the cancel is deleted'); eq([y.order(k).status, y.order(k).hold], ['cancelled', null], 'cancelled, not held for cost');
    ok(!y.pf.calls.some((c) => /confirm/.test(c.path)) && y.stripe.refunds.length === 1 && (await y.admin('POST', 'order/' + k + '/confirm', {})).status === 409, 'never confirmed; one refund; merch.sh confirm refuses');
  });
  await T('T2.2-41', 'cancel while Printful is down: cancelled and the refund first; the draft deletion is retried; a cancelled order is never confirmed', async () => {
    const w = await world(); const id = await w.drafted([tee(0)]); const po = w.order(id).provider_order; w.pf.fail.delete = 2;
    const r = await w.call('POST', '/merch/order/' + id + '/cancel', {}); ok(r.json.status === 'cancelled' && w.stripe.refunds.length === 1 && !w.pf.orders.get(po).deleted, 'cancelled and refunded; the draft is still there');
    await w.advance(40 * MIN); ok(w.pf.orders.get(po).deleted && w.order(id).draft_del === 0, 'deleted on a retry'); ok(!w.pf.calls.some((c) => /confirm/.test(c.path)), 'never confirmed');
  });
  await T('T2.2-42', 'Stripe refund call fails: the row stays sending with its key; the alarm retries with the same Idempotency-Key; owner email after 24 h; Stripe forgets keys after 24 h', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]); w.stripe.fail.refund = 400;
    const r = await w.call('POST', '/merch/order/' + id + '/cancel', {}); eq([r.json.status, r.json.refund], ['cancelled', 'sending'], 'sending');
    await w.advance(30 * MIN); const keys = w.stripe.calls.filter((c) => c.path === '/v1/refunds' && c.m === 'POST').map((c) => c.key);
    ok(keys.length >= 3 && keys.every((k) => k === 'mr_' + id + '_all_1'), 'retried with the same key: ' + keys.length);
    await w.advance(DAY); ok(w.owner(/refund_stuck/).length === 1, 'owner email after 24 h');
    w.stripe.fail.refund = 0; await w.advance(10 * MIN); ok(w.one('select status from merch_refunds where id = ?', 'mr_' + id + '_all_1').status === 'done' && w.stripe.refunds.length === 1, 'done once');
    // the fake forgets keys after 24 h, as Stripe does: a refund made whose answer was lost, then Stripe down for 25 h: found by its metadata, never sent twice
    const x = await world(); const j = await x.paidOrder([mug(0)]); x.stripe.after.refund = async () => { x.stripe.after.refund = null; x.stripe.fail.refund = 400; x.evict(); };
    await x.call('POST', '/merch/order/' + j + '/cancel', {}); ok(x.stripe.refunds.length === 1, 'made at Stripe; the answer lost');
    await x.advance(25 * HOUR); x.stripe.fail.refund = 0; await x.advance(30 * MIN);
    ok(x.stripe.refunds.length === 1 && x.one('select status from merch_refunds where order_id = ?', j).status === 'done', 'one refund only, the row done: ' + x.stripe.refunds.length);
  });
  await T('T2.2-43', 'a refund fails later at the bank (refund.failed / charge.refund.updated failed): refund_failed = 1; owner email', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]); await w.call('POST', '/merch/order/' + id + '/cancel', {}); const re = w.stripe.refunds[0];
    await w.hook('refund.failed', { id: re.id, object: 'refund', status: 'failed', payment_intent: re.payment_intent, metadata: re.metadata });
    ok(w.order(id).refund_failed === 1 && w.one('select status from merch_refunds where id = ?', 'mr_' + id + '_all_1').status === 'failed' && w.owner(/refund_failed/).length === 1, 'flagged, owner told');
    const x = await world(); const j = await x.paidOrder([mug(0)]); await x.call('POST', '/merch/order/' + j + '/cancel', {}); const r2 = x.stripe.refunds[0];
    await x.hook('charge.refund.updated', { id: r2.id, status: 'failed', payment_intent: r2.payment_intent, metadata: {} }); ok(x.order(j).refund_failed === 1, 'charge.refund.updated failed too');
  });
  await T('T2.2-44', 'one parcel lost (merch.sh lost): lost_at; its lines reprinted or refunded; the other parcel untouched', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]); const po = w.order(id).provider_order;
    const s1 = w.pf.ship(po, [id + '_1']); await shipHint(w, id); const s2 = w.pf.ship(po, [id + '_2'], { status: 'fulfilled' }); await shipHint(w, id);
    const r = await w.admin('POST', 'order/' + id + '/lost', { parcel: s1.id, then: 'reprint' }); ok(r.status === 200 && r.json.reprint === id + '-r1', r.text);
    ok(w.one('select lost_at from merch_parcels where id = ?', s1.id).lost_at && !w.one('select lost_at from merch_parcels where id = ?', s2.id).lost_at, 'only that parcel');
    eq(w.lines(id).map((l) => [l.line, l.status]), [[1, 'replaced'], [2, 'shipped'], [101, 'confirmed']], 'the mug reprinted');
    const x = await world(); const j = await x.confirmedOrder([mug(0), tee(1)]); const t1 = x.pf.ship(x.order(j).provider_order, [j + '_1']); await shipHint(x, j);
    const rr = await x.admin('POST', 'order/' + j + '/lost', { parcel: t1.id, then: 'refund' }); ok(rr.json.refunds.length === 1 && x.stripe.refunds[0].amount === 1999, 'or refunded: ' + rr.text);
  });
  await T('T2.2-45', 'a parcel comes back to Printful: returned_at; hold reship (status stays); "We need your address"; one free reship after the fix; 7 days: refund those lines; a refunded order is never reshipped (M4)', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]); const po = w.order(id).provider_order;
    const s = w.pf.ship(po, [id + '_1', id + '_2'], { status: 'fulfilled' }); await shipHint(w, id); s.returned = true; await shipHint(w, id);
    eq([w.order(id).status, w.order(id).hold], ['shipped', 'reship'], 'hold reship, status shipped'); ok(w.mails(new RegExp('_address_' + s.id + '$')).length === 1, 'address email');
    const r = await w.call('POST', '/merch/order/' + id + '/address', { name: 'Pat', line1: '9 New Lane', city: 'Town', postal: '12345', state: 'NY', country: 'US' }); ok(r.status === 200, r.text);
    const rp = w.pf.orders.get(w.one('select provider_order from merch_reprints where order_id = ?', id).provider_order);
    ok(rp.recipient.address1 === '9 New Lane' && rp.status === 'pending' && rp.files.length === 2, 'reshipped with the same files, confirmed'); ok(!w.order(id).hold && !w.stripe.refunds.length, 'free');
    const x = await world(); const j = await x.confirmedOrder([mug(0)]); const t = x.pf.ship(x.order(j).provider_order, [j + '_1'], { status: 'fulfilled' }); await shipHint(x, j); t.returned = true; await shipHint(x, j);
    await x.advance(7 * DAY + MIN); ok(x.stripe.refunds.length === 1 && x.order(j).status === 'refunded', '7 days: refunded');
    // M4: a parcel coming back on a REFUNDED order: no reship, the buyer is not asked, the form says not needed
    const y = await world(); const k = await y.confirmedOrder([mug(0)]); const u = y.pf.ship(y.order(k).provider_order, [k + '_1'], { status: 'fulfilled' }); await shipHint(y, k);
    await y.admin('POST', 'order/' + k + '/refund', { line: 1, reason: 'never came' }); u.returned = true; await shipHint(y, k);
    ok(y.order(k).status === 'refunded' && !y.order(k).hold && !y.mails(/_address_/).length && y.owner(/returned/).length === 1, 'refunded: no hold, no buyer email, the owner told');
    const f = await y.call('POST', '/merch/order/' + k + '/address', { name: 'Pat', line1: '9 New Lane', city: 'Town', postal: '12345', country: 'US' }); ok(f.status === 409 && !y.pf.calls.some((c) => c.m === 'POST' && /-r\d/.test((c.body || {}).external_id || '')), 'no free reprint');
  });
  await T('T2.2-46', 'Printful puts a confirmed order on hold: held provider; owner email; back when the hold is removed', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]); const P = w.pfOrder(id); P.status = 'onhold'; await w.phook(w.pf.hook(P, 'order_put_hold', 'h1'));
    eq([...st(w, id)], ['held', 'provider'], 'held'); ok(w.owner(/provider_hold/).length === 1, 'owner email'); await w.advance(3 * HOUR); eq([...st(w, id)], ['held', 'provider'], 'waits for Printful');
    P.status = 'inprocess'; await w.phook(w.pf.hook(P, 'order_remove_hold', 'h2')); eq([...st(w, id)], ['confirmed', null], 'back');
  });
  await T('T2.2-47', 'a Printful hint for an order we don’t know (a claim reship): logged, 200; attached by merch.sh reprint ... <provider order>', async () => {
    const w = await world(); const r = await w.phook(JSON.stringify({ id: 'u1', type: 'package_shipped', data: { order: { id: 777, external_id: 'claim-777' } } }));
    ok(r.status === 200 && w.one("select type, note from merch_events where id = 'p:u1'").note === 'claim-777', 'logged');
    const id = await w.confirmedOrder([mug(0)]); w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
    const a = await w.admin('POST', 'order/' + id + '/reprint', { lines: [1], provider_order: '777' }); ok(a.status === 200 && w.one("select status from merch_reprints where provider_order = '777'").status === 'attached', a.text);
    ok(!w.pf.calls.some((c) => c.m === 'POST' && c.path === '/orders' && c.body.external_id === id + '-r1'), 'no new Printful order for an attached claim');
  });
  await T('T2.2-48', 'a Printful hint with a bad or missing signature: 401 when signing is set up; without a secret: accepted as a hint only while not live (S8)', async () => {
    const w = await world({ env: { MERCH_PROVIDER_WEBHOOK_SECRET: 'pf-hook-secret' } }); const body = JSON.stringify({ id: 'z1', type: 'x', data: { order: { id: 1 } } });
    ok((await w.phook(body, {}, { unsigned: true })).status === 401 && (await w.phook(body, { 'x-pf-signature': '0'.repeat(64) })).status === 401, 'missing and bad: 401');
    ok((await w.phook(body, { 'x-pf-signature': await hmacHex('pf-hook-secret', body) })).status === 200, 'good: 200');
    const x = await world({ env: { MERCH_PROVIDER_WEBHOOK_SECRET: undefined, MERCH_PROVIDER_MODE: 'draft' } }); ok((await x.phook(body)).status === 200, 'no secret set, not live: accepted as a hint (Printful is re-read anyway)');
    const y = await world({ env: { MERCH_PROVIDER_WEBHOOK_SECRET: undefined } }); const r = await y.phook(body); ok(r.status === 401 && r.json.error === 'signing_required', 'S8: live without a secret: refused');
  });
  await T('T2.2-49', 'the Worker is redeployed with a new ART_VER between pay and render: the render uses the line’s own art_ver folder', async () => {
    const w = await world({ env: { MERCH_ART_VERS: 'pp1-0ldbuild' } }); const id = await w.newOrder([mug(0)], 'US', { art_ver: 'pp1-0ldbuild' }); await w.pay(id); await w.advance(1);
    const u = w.rd.calls[0].url; ok(u.includes('/merch/print/pp1-0ldbuild/#p=') && u.endsWith('&av=pp1-0ldbuild'), 'old folder and av: ' + u);
    const page = await w.call('GET', '/merch/print/pp1-0ldbuild/index.html'); ok(page.status === 200 && /print page/.test(page.text), 'the old folder is still served (static assets)');
  });
  await T('T2.2-50', 'rate limits (6.3): 429 slow_down (quote 60/h, checkout 10/h, order 120/h, buttons 10/h, admin 60/h per IP)', async () => {
    const w = await world(); const ip = { 'CF-Connecting-IP': '10.50.0.1' };
    for (let i = 0; i < 60; i++) ok((await w.call('POST', '/merch/quote', { country: 'US', lines: [mug(0)] }, ip)).status === 200, 'quote ' + i);
    const r = await w.call('POST', '/merch/quote', { country: 'US', lines: [mug(0)] }, ip); ok(r.status === 429 && r.json.error === 'slow_down', '61st quote');
    ok((await w.call('POST', '/merch/quote', { country: 'US', lines: [mug(0)] }, { 'CF-Connecting-IP': '10.50.0.2' })).status === 200, 'another IP is fine');
    w.clock.t += HOUR; ok((await w.call('POST', '/merch/quote', { country: 'US', lines: [mug(0)] }, ip)).status === 200, 'after the hour');
    const ip2 = { 'CF-Connecting-IP': '10.50.0.3' }; for (let i = 0; i < 10; i++) await w.call('POST', '/merch/checkout', {}, ip2); ok((await w.call('POST', '/merch/checkout', {}, ip2)).status === 429, '11th checkout');
    const ip3 = { 'CF-Connecting-IP': '10.50.0.4' }; for (let i = 0; i < 120; i++) await w.call('GET', '/merch/order/mo_AAAAAAAAAAAAAAAAAAAAAA', null, ip3); ok((await w.call('GET', '/merch/order/mo_AAAAAAAAAAAAAAAAAAAAAA', null, ip3)).status === 429, '121st order read');
    const ip4 = { 'CF-Connecting-IP': '10.50.0.5' }; for (let i = 0; i < 10; i++) await w.call('POST', '/merch/order/mo_AAAAAAAAAAAAAAAAAAAAAA/cancel', {}, ip4); ok((await w.call('POST', '/merch/order/mo_AAAAAAAAAAAAAAAAAAAAAA/cancel', {}, ip4)).status === 429, '11th button');
    const ip5 = { 'CF-Connecting-IP': '10.50.0.6', authorization: 'Bearer nope' }; for (let i = 0; i < 60; i++) await w.call('GET', '/merch/admin/report', null, ip5); ok((await w.call('GET', '/merch/admin/report', null, ip5)).status === 429, '61st admin call');
    ok(w.q('select k from merch_rate').every((x) => /^[a-z]+:ip:[0-9a-f]{64}$/.test(x.k)), 'rate keys are ip: + an HMAC, never the IP');
  });
  await T('T2.2-51', 'IP flagged block: checkout 403 not_available', async () => {
    const w = await world(); const f = await w.admin('POST', 'flag', { key: 'ipaddr:10.51.0.1', mode: 'block', note: 'card testing' }); ok(f.status === 200 && /^ip:[0-9a-f]{64}$/.test(f.json.key), f.text);
    const q = await w.quote([mug(0)]); const r = await w.call('POST', '/merch/checkout', { country: 'US', lines: [mug(0)], expect_total: q.json.total, art_ver: PP.ART_VER, nonce: 'blocked-ip-01', agree: true }, { 'CF-Connecting-IP': '10.51.0.1' });
    ok(r.status === 403 && r.json.error === 'not_available' && !w.stripe.calls.length, r.text);
  });
  await T('T2.2-52', 'a paid order from a blocked email hash, or the 4th in 24 h from one hash: held review; owner email; blocked: refund after 24 h; 4th: goes on', async () => {
    const w = await world(); await w.admin('POST', 'flag', { key: 'email:Bad@Example.test', mode: 'block' }); const id = await w.paidOrder([mug(0)], 'US', { email: 'bad@example.test' });
    eq([...st(w, id), w.order(id).why], ['held', 'review', 'blocked'], 'blocked'); await w.advance(DAY + MIN); eq(w.order(id).status, 'refunded', 'refunded after 24 h');
    const x = await world(); const ids = []; for (let i = 0; i < 4; i++) ids.push(await x.paidOrder([mug(i)], 'US', { email: 'gifts@example.test' }));
    eq(ids.map((i) => x.order(i).status), ['paid', 'paid', 'paid', 'held'], 'the 4th held'); eq(x.order(ids[3]).why, 'many', 'why'); ok(x.owner(/review/).length === 1, 'owner email');
    await x.advance(DAY + MIN); ok(!['held', 'refunded'].includes(x.order(ids[3]).status) || x.order(ids[3]).hold !== 'review', '24 h: it goes on (' + st(x, ids[3]) + ')'); ok(!x.stripe.refunds.length, 'no refund');
  });
  await T('T2.2-53', 'GET /merch/order/:id with an unknown id: 404 not_found', async () => {
    const w = await world(); for (const id of ['mo_AAAAAAAAAAAAAAAAAAAAAA', 'nope', 'mo_' + 'x'.repeat(30)]) { const r = await w.call('GET', '/merch/order/' + id); ok(r.status === 404 && r.json.error === 'not_found', id); }
  });
  await T('T2.2-54', 'file URL expired or bad signature: 403 (a reprint signs a fresh URL)', async () => {
    const w = await world(); const id = await w.drafted([mug(0)]); const key = w.lines(id)[0].file_key;
    const good = (await w.L().fileUrl(key, HOUR)).replace('https://merch-api.doodledoggo.app', ''); ok((await w.raw('GET', good)).status === 200, 'good');
    const bad = good.replace(/\/([0-9a-f]{64})\.png$/, (m, s) => '/' + (s[0] === 'a' ? 'b' : 'a') + s.slice(1) + '.png'); ok((await w.call('GET', bad)).status === 403, 'bad signature');
    const other = good.replace(key, key.replace(/~1$/, '~2')); ok((await w.call('GET', other)).status === 403, 'another key with this signature');
    w.clock.t += 2 * HOUR; const r = await w.call('GET', good); ok(r.status === 403 && r.json.error === 'expired', 'expired');
    const fresh = (await w.L().fileUrl(key, HOUR)).replace('https://merch-api.doodledoggo.app', ''); ok((await w.raw('GET', fresh)).status === 200, 'a fresh link works');
    const exp = Math.floor(w.clock.t / 1000) + 600, missing = '/merch/file/p-2026-12-01~nope~1/' + exp + '/' + await hmacHex(w.env.MERCH_FILE_KEY, 'p-2026-12-01~nope~1/' + exp) + '.png'; ok((await w.call('GET', missing)).status === 404, 'signed but missing: 404');
  });
  await T('T2.2-55', 'the Worker or object stops mid-step (timeouts and real kills after the confirm and the refund): the confirming claim is re-read (GET first); a sending refund is retried', async () => {
    const w = await world(); const id = await w.drafted([tee(0)]); w.pf.timeoutConfirm = 1; await w.advance(w.order(id).cancel_until + GRACE - w.clock.t);
    eq(w.order(id).status, 'confirming', 'stuck in confirming (result unknown)'); await w.advance(2 * MIN + 1);
    eq(w.order(id).status, 'confirmed', 'the alarm re-read Printful (already pending) and finished'); ok(w.pf.calls.filter((c) => /confirm/.test(c.path)).length === 1, 'no second confirm');
    const x = await world(); const j = await x.paidOrder([mug(0)]); x.stripe.fail.refund = 1; await x.call('POST', '/merch/order/' + j + '/cancel', {});
    await x.advance(6 * MIN); ok(x.one('select status from merch_refunds where order_id = ?', j).status === 'done', 'the sending refund was retried');
    // real crashes (the object killed between the call and the write): the confirm, then the refund
    const y = await world(); const k = await y.drafted([tee(0)]); y.pf.after.confirm = async () => { y.pf.after.confirm = null; y.evict(); };
    await y.advance(y.order(k).cancel_until + GRACE - y.clock.t); eq(y.order(k).status, 'confirming', 'killed after Printful confirmed: still confirming');
    await y.advance(10 * MIN); eq(y.order(k).status, 'confirmed', 'the wake re-read it and finished'); ok(y.pf.calls.filter((c) => /confirm/.test(c.path)).length === 1, 'never a second confirm');
    const z = await world(); const m = await z.paidOrder([mug(0)]); z.stripe.after.refund = async () => { z.stripe.after.refund = null; z.evict(); };
    const c = await z.call('POST', '/merch/order/' + m + '/cancel', {}); ok(c.status === 503 && z.order(m).status === 'cancelled', 'killed after the refund call: the cancel was written first');
    await z.advance(10 * MIN); ok(z.stripe.refunds.length === 1 && z.one('select status from merch_refunds where order_id = ?', m).status === 'done', 'retried with the same key: one refund');
  });
  await T('T2.2-56', 'Stripe Tax returns tax on a paid order where none was expected: the real tax is stored; the margin re-checked; the buyer is served; an inclusive-tax line refund adds no tax (S2)', async () => {
    const w = await world(); const id = await w.newOrder([tee(0)]); await w.pay(id, { tax: 250 });
    eq([w.order(id).status, w.order(id).tax, w.order(id).total, w.lines(id)[0].line_tax], ['paid', 250, 3198 + 250, 250], 'paid with the tax stored');
    const x = await world({ env: { MERCH_COUNTRIES: 'all' } }); const j = await x.newOrder([mug(0)], 'HK'); await x.pay(j, { tax: 2000, amount: 3198 }); // inside the price (inclusive): the margin drops
    ok(x.order(j).status === 'paid' && x.L().report().margin_low.some((m) => m.order_id === j), 'below the floor: nightly report only');
    const r = await w.admin('POST', 'order/' + id + '/refund', { line: 1, reason: 'x' }); ok(r.json.amount === 3198 + 250, 'a line refund carries its share of the (exclusive) tax');
    // S2: inclusive tax is inside the price: a line refund is the item price, never price + tax
    const y = await world({ env: { MERCH_COUNTRIES: 'all' } }); const k = await y.newOrder([mug(0), tee(1)], 'HK'); const cs = y.stripe.pay(y.sid(k)); cs.total_details.amount_tax = 300; cs.line_items.data[1].amount_tax = 150; cs.line_items.data[0].amount_tax = 150;
    await y.hook('checkout.session.completed', { id: cs.id, payment_status: 'paid' }); await y.advance(65 * MIN); eq(y.order(k).status, 'confirmed', 'served');
    const t = await y.admin('POST', 'order/' + k + '/refund', { line: 2, reason: 'misprint' }); ok(t.json.amount === 2699 + 599, 'the tee alone: 2699 + the world extra item, no tax on top: ' + t.json.amount);
  });
}
