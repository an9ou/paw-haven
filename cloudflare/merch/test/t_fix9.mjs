// The part 9 code review fixes (docs/reviews/MERCH_PART9_code_review.md; docs/design/merch/PART6.md "Part 9 fixes"). Rows F9-* and the new
// contract rows T2.1-35 (the printer read before an automatic step) and T2.1-36 (the daily re-read). The clock is
// the harness's fixed one: paid at T0 = Tue 1 Dec 2026 01:00 UTC, so ship_by = Thu 10 Dec 01:00 UTC and late_eta = Mon 21 Dec 01:00 UTC.
import { T, ok, eq, world, mug, tee, T0, MIN, HOUR, DAY } from './harness.mjs';
import { one, addCodes } from './t_part6.mjs';

const SHIP_BY = Date.parse('2026-12-10T01:00:00Z'), LATE_ETA = Date.parse('2026-12-21T01:00:00Z');
const shipHint = async (w, id) => w.phook(w.pf.hook(w.pfOrder(id), 'package_shipped', 'evt_' + Math.random()));
const orderReads = (w) => w.pf.calls.filter((c) => c.m === 'GET' && c.v === 2 && /^\/orders\/\d+$/.test(c.path)).length;
const refundsSum = (w) => w.stripe.refunds.reduce((a, r) => a + r.amount, 0);
const page = async (w, id) => (await w.call('GET', '/merch/order/' + id)).json;
const withCron = async (w, ms) => { const end = w.clock.t + ms; while (w.clock.t < end) { await w.advance(Math.min(10 * MIN, end - w.clock.t)); await w.cron(); } };
const dispute = (w, id, type, status, did) => w.hook('charge.dispute.' + type, { id: did || 'dp_' + id.slice(3, 9), payment_intent: w.order(id).payment_intent, status });
// Printful made the order a failed one after it was confirmed, and said so: held review pf_failed (the part 5 hold)
async function pfFailed(w) { const id = await w.confirmedOrder([tee(0)]); w.pfOrder(id).status = 'failed'; await w.phook(w.pf.hook(w.pfOrder(id), 'order_failed', 'evt_f_' + id)); eq([w.order(id).status, w.order(id).why], ['held', 'pf_failed'], 'held pf_failed'); return id; }

export async function fix9() {
  console.log('--- the part 9 code review fixes (F9-*)');

  // ---- B1: never refund blind
  await T('F9-B1-repro1', 'B1 repro 1: a tee posted with no hint at all; at ship_by Printful is read first: shipped, ONE "On its way", no delay email, nothing refunded at late_eta', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]);
    w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); // no hint
    await w.advance(LATE_ETA - w.clock.t + HOUR);
    const o = w.order(id);
    eq([o.status, w.stripe.refunds.length, w.mails(/_late$/).length, w.mails(/_ship_/).length], ['shipped', 0, 0, 1], 'shipped, nothing refunded, no delay email, one On its way');
    ok(o.pf_read_at && !o.pf_read_fail && !o.pf_wait && !o.late_auto_at, 'the read is recorded');
    ok(!w.L().report().stranded.length, 'nothing stranded');
  });
  await T('F9-B1-repro2', 'B1 repro 2: mug posted with a hint, the tee posted after the delay email with no hint: at late_eta the read finds it: no refund, the tee gets its "On its way" once', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]);
    w.pf.ship(w.order(id).provider_order, [id + '_1']); await shipHint(w, id);
    await w.advance(SHIP_BY - w.clock.t + DAY); ok(w.mails(/_late$/).length === 1, 'the delay email went (the tee was late then)');
    w.pf.ship(w.order(id).provider_order, [id + '_2'], { status: 'fulfilled' }); // posted; the hint is lost
    await w.advance(LATE_ETA - w.clock.t + HOUR);
    eq([w.order(id).status, w.stripe.refunds.length, w.mails(/_ship_/).length, w.order(id).late_auto_at], ['shipped', 0, 2, null], 'nothing refunded, two parcels told once each');
    await w.advance(3 * DAY); await w.cron(); ok(w.mails(/_ship_/).length === 2 && !w.stripe.refunds.length, 'and nothing more later');
  });
  await T('T2.1-35', 'B1 (F9-B1-still): Printful says still not posted: the late part is refunded as before, right after a read made in the same step', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]);
    await w.advance(LATE_ETA - w.clock.t - MIN); const before = orderReads(w);
    await w.advance(2 * MIN);
    ok(orderReads(w) > before && w.order(id).status === 'refunded' && w.order(id).pf_read_at === LATE_ETA && refundsSum(w) === w.order(id).total, 'read at late_eta, then refunded in full');
  });
  await T('F9-B1-fail', 'B1: the read fails: no refund and no delay email, tried again every 15 minutes; it works again: the step runs then (here a refund of what is still not posted)', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]);
    await w.advance(SHIP_BY - w.clock.t - MIN); w.pf.down = true; const r0 = orderReads(w);
    await w.advance(2 * HOUR + MIN);
    let o = w.order(id); ok(!o.late_sent_at && !w.mails(/_late$/).length && o.pf_read_fail === SHIP_BY && o.pf_wait > w.clock.t - 16 * MIN, 'no delay email while Printful cannot be read');
    const n = orderReads(w) - r0; ok(n >= 7 && n <= 10, 'about one read every 15 minutes: ' + n);
    w.pf.down = false; await w.advance(16 * MIN); o = w.order(id);
    ok(o.late_sent_at && !o.pf_read_fail && !o.pf_wait && w.mails(/_late$/).length === 1, 'read again: the delay email goes, once');
    await w.advance(LATE_ETA - w.clock.t - MIN); w.pf.down = true; await w.advance(HOUR);
    ok(w.order(id).status === 'confirmed' && !w.stripe.refunds.length, 'at late_eta the read fails: nothing refunded');
    w.pf.down = false; await w.advance(16 * MIN); ok(w.order(id).status === 'refunded' && w.stripe.refunds.length === 1, 'read again, still not posted: refunded once');
    ok(!w.L().report().stranded.length, 'nothing stranded');
  });
  await T('F9-B1-tell', 'B1: the reads fail for 24 hours: the owner hears ONCE (printer_unread), nothing is refunded; still failing two days on: no second email', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]);
    await w.advance(LATE_ETA - w.clock.t - MIN); w.pf.down = true;
    await w.advance(DAY - 30 * MIN); ok(!w.owner(/printer_unread/).length, 'not before 24 hours');
    await w.advance(HOUR); ok(w.owner(/printer_unread/).length === 1 && /could not be read/.test(w.owner(/printer_unread/)[0].text), 'told at 24 hours');
    await w.advance(2 * DAY); ok(w.owner(/printer_unread/).length === 1 && !w.stripe.refunds.length && w.order(id).status === 'confirmed', 'once, and never refunded blind');
  });
  await T('F9-B1-crash', 'B1: a crash between the read and its transaction: nothing written, the step comes back and reads again: one refund, one email; and if the parcel left during the crash, no refund', async () => {
    let w = await world(); let id = await w.confirmedOrder([tee(0)]);
    await w.advance(LATE_ETA - w.clock.t - MIN);
    w.pf.after.get = async () => { w.pf.after.get = null; w.evict(); };
    await w.advance(2 * MIN); ok(!w.order(id).late_auto_at && !w.stripe.refunds.length, 'the crash wrote nothing');
    await w.advance(HOUR); await withCron(w, HOUR);
    const o = w.order(id); ok(o.status === 'refunded' && w.stripe.refunds.length === 1 && w.mails(new RegExp('^me_' + id + '_refund_')).length === 1 && !o.lease_until, 'one refund, one email');
    w = await world(); id = await w.confirmedOrder([tee(0)]); await w.advance(LATE_ETA - w.clock.t - MIN);
    w.pf.after.get = async (po) => { w.pf.after.get = null; w.evict(); w.pf.ship(po.id, [id + '_1'], { status: 'fulfilled' }); };
    await w.advance(HOUR);
    eq([w.order(id).status, w.stripe.refunds.length, w.mails(/_ship_/).length], ['shipped', 0, 1], 'posted during the crash: no refund, one On its way');
  });
  await T('F9-B1-held', 'B1: the 24-hour refund of an order Printful failed: read first. Fixed at Printful with the hint lost: confirmed, no refund. Still failed: refunded. Read fails: waits', async () => {
    let w = await world(); let id = await pfFailed(w);
    w.pfOrder(id).status = 'pending'; // sent again in Printful's dashboard; no hint
    await w.advance(DAY + MIN); eq([w.order(id).status, w.order(id).hold, w.stripe.refunds.length], ['confirmed', null, 0], 'Printful went on: confirmed, nothing refunded');
    w = await world(); id = await pfFailed(w); await w.advance(DAY + MIN);
    ok(w.order(id).status === 'refunded' && w.stripe.refunds.length === 1 && w.owner(/auto_refund/).length === 1, 'still failed: refunded as before');
    w = await world(); id = await pfFailed(w); w.pf.down = true; await w.advance(DAY + 2 * HOUR);
    ok(w.order(id).status === 'held' && !w.stripe.refunds.length && w.order(id).next_try_at <= w.clock.t + 15 * MIN, 'cannot read: not refunded, tried again in 15 minutes');
    w.pf.down = false; await w.advance(20 * MIN); ok(w.order(id).status === 'refunded' && w.stripe.refunds.length === 1, 'then refunded once');
  });
  await T('F9-B1-confirm', 'B1: a confirm that came back failed (held review confirm_refused), then sent again by the owner in Printful’s dashboard: read at 24 hours, confirmed, never refunded', async () => {
    const w = await world(); w.pf.after.confirm = async (o) => { w.pf.after.confirm = null; o.status = 'failed'; };
    const id = await w.drafted([mug(0)]); await w.advance(65 * MIN);
    eq([w.order(id).status, w.order(id).why], ['held', 'confirm_refused'], 'held');
    w.pfOrder(id).status = 'pending';
    await w.advance(DAY);
    const o = w.order(id); eq([o.status, !!o.confirmed_at, w.lines(id)[0].status, w.stripe.refunds.length], ['confirmed', true, 'confirmed', 0], 'confirmed from the read');
  });
  await T('T2.1-36', 'B1 (F9-B1-daily): the daily re-read catches a lost hint within a day (cron), at most 5 orders a cron run, the oldest first; a reprint too', async () => {
    const w = await world(); const ids = [];
    for (let i = 0; i < 7; i++) { const x = await w.newOrder([mug(i % 8)]); await w.pay(x, { email: 'daily' + i + '@example.test' }); await w.advance(65 * MIN); ok(w.order(x).status === 'confirmed', 'confirmed ' + i); ids.push(x); }
    for (const id of ids) w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); // every hint lost
    w.clock.t += DAY; const r0 = orderReads(w); await w.cron();
    ok(orderReads(w) - r0 === 5, 'five reads in one cron run: ' + (orderReads(w) - r0));
    eq(ids.map((id) => w.order(id).status), ['shipped', 'shipped', 'shipped', 'shipped', 'shipped', 'confirmed', 'confirmed'], 'the oldest five first');
    w.clock.t += 10 * MIN; await w.cron(); ok(ids.every((id) => w.order(id).status === 'shipped') && w.mails(/_ship_/).length === 7, 'the rest at the next run; one On its way each');
    const r1 = orderReads(w); w.clock.t += 10 * MIN; await w.cron(); ok(orderReads(w) === r1, 'shipped orders are not read again');
    // a reprint of a posted line, posted at Printful with no hint
    const id = ids[0]; await w.admin('POST', 'order/' + id + '/reprint', { lines: [1] }); const rp = w.one('select * from merch_reprints where order_id = ?', id);
    ok(rp && rp.status === 'confirmed' && w.order(id).status === 'part_shipped', 'reprinted: ' + (rp && rp.status));
    w.pf.ship(rp.provider_order, [id + '-r1_101'], { status: 'fulfilled' });
    w.clock.t += DAY + MIN; await w.cron(); ok(w.order(id).status === 'shipped' && w.lines(id).find((l) => l.line === 101).status === 'shipped', 'the reprint read too: shipped');
  });

  // ---- M1: a lost dispute
  await T('F9-M1', 'M1: after a LOST dispute on a confirmed order: the late cancel 409 not_late, the owner line refund 409 disputed, page late false, no automatic refund; Stripe would refuse it anyway', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]);
    await w.advance(SHIP_BY - w.clock.t + MIN); ok((await page(w, id)).late === true, 'late before');
    await dispute(w, id, 'created', 'needs_response'); ok((await page(w, id)).late === false, 'not late in an open dispute');
    await dispute(w, id, 'closed', 'lost'); w.stripe.disputed.add(w.order(id).payment_intent);
    const r = await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' });
    ok(r.status === 409 && r.json.error === 'not_late', 'late cancel refused: ' + r.text);
    const a = await w.admin('POST', 'order/' + id + '/refund', { line: 1, reason: 'late' }); ok(a.status === 409 && a.json.error === 'disputed', 'admin refund refused: ' + a.text);
    ok((await page(w, id)).late === false, 'page late false');
    await w.advance(LATE_ETA - w.clock.t + DAY); ok(!w.stripe.refunds.length && !w.order(id).late_auto_at && !w.q('select id from merch_refunds').length, 'nothing refunded, ever');
  });

  // ---- M2: refunds Stripe refuses, and the cap
  await T('F9-M2-cap', 'M2 repro: a Dashboard partial refund whose webhook has not come, then the buyer cancels: the full refund is capped at what is left (read from Stripe); the buyer gets exactly the rest; the late webhook squares the books', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]); const o = w.order(id);
    w.stripe.dashRefund(o.payment_intent, 500);
    const c = await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' }); ok(c.status === 200, c.text);
    await w.advance(HOUR);
    const row = w.one("select * from merch_refunds where id glob 'mr_*'");
    eq([row.status, row.amount, refundsSum(w), w.order(id).refunded], ['done', o.total - 500, o.total, o.total - 500], 'capped, the rest refunded, the books say what we refunded');
    ok(w.stripe.calls.filter((x) => x.m === 'POST' && x.path === '/v1/refunds').length === 1, 'one refund call');
    await w.hook('charge.refunded', { id: 'ch_' + id, payment_intent: o.payment_intent, amount: o.total, refunded: true });
    eq(w.order(id).refunded, o.total, 'the Dashboard webhook adds its part: refunded = the total');
    const m = w.mails(new RegExp('^me_' + id + '_cancelled$')); ok(m.length === 1 && m[0].text.includes('We’ve refunded all of it, $' + (o.total / 100).toFixed(2)), 'one Cancelled email; all of it is back (the Dashboard part and ours): ' + (m[0] && m[0].text.slice(0, 200)));
  });
  await T('F9-M2-cap-retry', 'M2: the capped amount is kept on a retry (a key sent again must carry the same amount); all of it refunded in the Dashboard already: nothing sent', async () => {
    let w = await world(); let id = await w.paidOrder([mug(0)]); let o = w.order(id);
    w.stripe.dashRefund(o.payment_intent, 700); w.stripe.fail.refund = 2;
    await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' }); await w.advance(HOUR);
    const keys = w.stripe.calls.filter((x) => x.m === 'POST' && x.path === '/v1/refunds').map((x) => x.body.amount);
    ok(keys.length === 3 && new Set(keys).size === 1 && Number(keys[0]) === o.total - 700 && refundsSum(w) === o.total, 'three tries, one amount: ' + keys);
    w = await world(); id = await w.paidOrder([mug(0)]); o = w.order(id); w.stripe.dashRefund(o.payment_intent, o.total);
    await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' }); await w.advance(HOUR);
    ok(!w.stripe.calls.some((x) => x.m === 'POST' && x.path === '/v1/refunds') && w.one("select status, amount from merch_refunds where id glob 'mr_*'").status === 'done' && w.order(id).refunded === 0 && !w.order(id).refund_failed, 'nothing left: nothing sent, no failure');
  });
  await T('F9-M2-refused', 'M2: a refund Stripe refuses for good (a charged-back charge, an amount over what is left): not retried; the row failed, refund_failed set, the owner told at once', async () => {
    let w = await world(); let id = await w.confirmedOrder([mug(0), tee(1)]); w.stripe.disputed.add(w.order(id).payment_intent);
    const a = await w.admin('POST', 'order/' + id + '/refund', { line: 1, reason: 'damaged' }); ok(a.status === 200, a.text);
    await w.advance(3 * HOUR);
    const row = w.one("select * from merch_refunds where id glob 'mr_*'");
    ok(row.status === 'failed' && row.next_try_at === null && w.order(id).refund_failed === 1 && w.stripe.calls.filter((x) => x.m === 'POST' && x.path === '/v1/refunds').length === 1, 'failed, flagged, one call');
    const om = w.owner(/refund_refused/); ok(om.length === 1 && /charge_disputed/.test(om[0].text), 'the owner told: ' + (om[0] && om[0].text.slice(0, 200)));
    ok(w.L().report().refund_failed.includes(id) && !w.L().report().stranded.length, 'in the report, nothing stranded');
    // more than is left: a line refund after a Dashboard refund of almost everything
    w = await world(); id = await w.confirmedOrder([mug(0), tee(1)]); const o = w.order(id); w.stripe.dashRefund(o.payment_intent, o.total - 100);
    await w.admin('POST', 'order/' + id + '/refund', { line: 1, reason: 'damaged' }); await w.advance(HOUR);
    ok(w.one("select status from merch_refunds where id glob 'mr_*'").status === 'failed' && w.owner(/refund_refused/).length === 1 && refundsSum(w) === o.total - 100, 'over what is left: refused once, not retried');
  });

  // ---- M3: only lost is lost
  await T('F9-M3-inquiry', 'M3 repro: an inquiry (warning_needs_response) is a flag for the owner, not a pause: the order is made; closed warning_closed: kept (won), nothing refunded', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]);
    await dispute(w, id, 'created', 'warning_needs_response');
    eq([w.order(id).status, w.order(id).hold, w.order(id).dispute], ['paid', null, 'inquiry'], 'not paused');
    ok(w.owner(/dispute_inquiry/).length === 1 && !w.q("select key from merch_flags").length, 'the owner told; the buyer not blocked');
    await w.advance(2 * HOUR); ok(w.order(id).status === 'confirmed' && w.pfOrder(id).status === 'pending', 'made at Printful');
    await dispute(w, id, 'closed', 'warning_closed'); await w.advance(2 * DAY);
    ok(w.order(id).dispute === 'won' && !w.stripe.refunds.length && !w.L().report().stranded.length, 'closed: kept, nothing refunded');
  });
  await T('F9-M3-closed', 'M3: a chargeback closed any way but lost (prevented, warning_closed, won) releases like won: merch.sh confirm makes the order; lost stays lost; an inquiry that becomes a chargeback (updated) pauses then', async () => {
    for (const st of ['prevented', 'warning_closed', 'won']) {
      const w = await world(); const id = await w.paidOrder([mug(0)]);
      await dispute(w, id, 'created', 'needs_response'); eq([w.order(id).status, w.order(id).hold], ['held', 'dispute'], st + ': paused');
      await dispute(w, id, 'closed', st); await w.advance(2 * DAY);
      const c = await w.admin('POST', 'order/' + id + '/confirm'); ok(c.status === 200, st + ': confirm ' + c.text);
      await w.advance(10 * MIN); ok(['confirmed', 'confirming'].includes(w.order(id).status) && w.order(id).provider_order && !w.stripe.refunds.length, st + ': made: ' + w.order(id).status);
    }
    let w = await world(); let id = await w.paidOrder([mug(0)]);
    await dispute(w, id, 'created', 'needs_response'); await dispute(w, id, 'closed', 'lost');
    ok(w.order(id).dispute === 'lost' && (await w.admin('POST', 'order/' + id + '/confirm')).status === 409, 'lost: not released');
    w = await world(); id = await w.paidOrder([mug(0)]);
    await dispute(w, id, 'created', 'warning_needs_response', 'dp_up'); ok(w.order(id).status === 'paid', 'an inquiry');
    await dispute(w, id, 'updated', 'warning_under_review', 'dp_up'); ok(w.order(id).status === 'paid', 'still an inquiry');
    await dispute(w, id, 'updated', 'needs_response', 'dp_up'); eq([w.order(id).status, w.order(id).hold, w.order(id).dispute], ['held', 'dispute', 'open'], 'a chargeback now: paused');
    await dispute(w, id, 'updated', 'under_review', 'dp_up'); ok(w.owner(/\[dispute\]/).length === 1, 'later updates change nothing');
  });

  // ---- m1, m2
  await T('F9-m1', 'm1: a line refunded in full (the late part, by itself) that Printful posts after all: the owner hears once; the buyer gets "On its way"', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]);
    w.pf.ship(w.order(id).provider_order, [id + '_1']); await shipHint(w, id);
    await w.advance(LATE_ETA - w.clock.t + MIN); ok(w.order(id).late_auto_at && w.lines(id)[1].refunded_qty === 1, 'the tee refunded by itself');
    w.pf.ship(w.order(id).provider_order, [id + '_2'], { status: 'fulfilled' }); await shipHint(w, id); await shipHint(w, id);
    const m = w.owner(/refunded_shipped/); ok(m.length === 1 && /line 2, already refunded in full/.test(m[0].text), 'the owner told once: ' + m.length);
    ok(w.mails(/_ship_/).length === 2, 'the buyer told of both parcels');
  });
  await T('F9-m2', 'm2: the gift is not shown for an order past its hour that is not drafted at the printer yet; every line rejected then: no code shown, the code back in the pool', async () => {
    const w = await world(); await addCodes(w, ['TEST-GIFT-0901']); w.rd.queue.push('err', 'err', 'err', 'err', 'err', 'err');
    const id = await w.newOrder([mug(0)]); await w.pay(id);
    w.clock.t = w.order(id).cancel_until + 3 * MIN; w.L().tx(() => w.L().next(id, w.clock.t)); // a step past the hour, nothing drafted yet
    ok(w.order(id).gift_code === 'TEST-GIFT-0901' && !w.order(id).gift_shown_at && (await page(w, id)).gift === 'soon', 'reserved, not shown');
    await w.advance(10 * MIN);
    const o = w.order(id), p = w.one('select order_id from merch_gift_pool where code = ?', 'TEST-GIFT-0901');
    eq([o.status, o.gift_code, p.order_id, (await page(w, id)).gift], ['refunded', null, null, null], 'refunded, no code, back in the pool');
    ok(!w.mails(/./).some((m) => m.text.includes('TEST-GIFT')), 'no email carries it');
    const x = await world(); await addCodes(x, ['TEST-GIFT-0902']); const j = await x.drafted([mug(0)]);
    x.clock.t = x.order(j).cancel_until + GRACE_OK; x.L().tx(() => x.L().next(j, x.clock.t)); ok(!x.order(j).gift_shown_at, 'drafted but still paid (the confirm not started): not yet');
    await x.advance(MIN); ok(x.order(j).gift_shown_at && x.order(j).status === 'confirmed', 'shown once it goes to print');
  });
}
const GRACE_OK = 120e3 + 1000;
