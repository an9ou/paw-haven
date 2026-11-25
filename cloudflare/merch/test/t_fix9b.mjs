// The part 9 second review fixes (docs/reviews/MERCH_PART9_second_review.md, "Fixes (second review)"). Rows F9b-*: one or more per finding
// (R2-M1..M4, R2-m1, R2-m2), each failing on the code as reviewed (fb48a9f), plus the cases next to them (a failed printer read, a replay,
// events out of order, which date a window counts from). The clock is the harness's fixed one: paid at T0 = Tue 1 Dec 2026 01:00 UTC, so
// ship_by = Thu 10 Dec 01:00 UTC and, for a delay email sent then, late_eta = Mon 21 Dec 01:00 UTC.
import { T, ok, eq, world, mug, tee, MIN, HOUR, DAY } from './harness.mjs';
import { addBusinessDays } from '../util.js';

const SHIP_BY = Date.parse('2026-12-10T01:00:00Z'), LATE_ETA = Date.parse('2026-12-21T01:00:00Z');
const shipHint = async (w, id) => w.phook(w.pf.hook(w.pfOrder(id), 'package_shipped', 'evt_' + Math.random()));
const dispute = (w, id, type, status, did) => w.hook('charge.dispute.' + type, { id: did || 'dp_' + id.slice(3, 9), payment_intent: w.order(id).payment_intent, status });
const lateCancel = (w, id) => w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' });
const address = (w, id) => w.call('POST', '/merch/order/' + id + '/address', { name: 'Pat', line1: '9 New Lane', city: 'Town', postal: '12345', state: 'NY', country: 'US' });
const withCron = async (w, ms) => { const end = w.clock.t + ms; while (w.clock.t < end) { await w.advance(Math.min(10 * MIN, end - w.clock.t)); await w.cron(); } };
const stranded = (w) => w.L().report().stranded;
// a confirmed order whose delay email has gone (an hour after ship_by)
async function lateOrder(w, lines) { const id = await w.confirmedOrder(lines || [tee(0)]); await w.advance(SHIP_BY - w.clock.t + HOUR); ok(w.order(id).late_sent_at && w.mails(/_late$/).length === 1, 'the delay email went'); return id; }
// a shipped order whose one parcel came back to Printful: hold reship, the buyer asked for an address
async function returned(w, lines) {
  const id = await w.confirmedOrder(lines || [mug(0)]); const ids = w.lines(id).map((l) => id + '_' + l.line);
  const s = w.pf.ship(w.order(id).provider_order, ids, { status: 'fulfilled' }); await shipHint(w, id); s.returned = true; await shipHint(w, id);
  eq([w.order(id).status, w.order(id).hold], ['shipped', 'reship'], 'returned: hold reship'); return { id, s };
}

export async function fix9b() {
  console.log('--- the part 9 second review fixes (F9b-*)');

  // ---- R2-M1: the buyer's late cancel reads Printful first
  await T('F9b-M1', 'R2-M1 (probe): the tee was posted with its hint lost, then the buyer cancels the late part: Printful is read first: 409 not_late, shipped, nothing refunded, one "On its way"', async () => {
    const w = await world(); const id = await lateOrder(w);
    w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); // posted, no hint
    const r = await lateCancel(w, id); await w.advance(HOUR);
    eq([r.status, r.json.error, w.order(id).status, w.stripe.refunds.length, w.pfOrder(id).status, w.mails(/_ship_/).length], [409, 'not_late', 'shipped', 0, 'fulfilled', 1], 'not late any more');
  });
  await T('F9b-M1-part', 'R2-M1: the mug posted with its hint lost, the tee still not posted: the late cancel refunds the tee only (the read moved the mug to shipped)', async () => {
    const w = await world(); const id = await lateOrder(w, [mug(0), tee(1)]);
    w.pf.ship(w.order(id).provider_order, [id + '_1']); // the mug left, no hint
    const r = await lateCancel(w, id);
    const tee1 = w.lines(id).find((l) => l.line === 2);
    eq([r.status, w.order(id).status, w.stripe.refunds.length, w.stripe.refunds[0] && w.stripe.refunds[0].amount], [200, 'shipped', 1, tee1.unit], 'the tee refunded, the mug kept');
    ok(w.lines(id).find((l) => l.line === 1).status === 'shipped' && w.mails(/_ship_/).length === 1 && w.owner(/cancel_late/).length === 1, 'the mug told as posted; the owner asked to cancel the tee at Printful (part of it shipped)');
  });
  // (moved to the third review's rule, R3-m3: never refunded blind in the request; the cancel is recorded and decided after a good read)
  await T('F9b-M1-unread', 'R2-M1 with R3-m3: Printful cannot be read at the late cancel: the cancel is in (200, refund pending), Printful asked to cancel, nothing refunded blind; a second tap: the same; Printful back: refunded once', async () => {
    const w = await world(); const id = await lateOrder(w); w.pf.down = true;
    const r = await lateCancel(w, id);
    eq([r.status, r.json.refund, w.order(id).status, w.stripe.refunds.length, !!w.order(id).late_ask_at], [200, 'pending', 'confirmed', 0, true], 'recorded, not refunded blind');
    ok(w.order(id).pcancel === 1 && !w.owner(/late_cancel_unread/).length, 'the printer cancel waits for Printful; the owner not told yet');
    ok((await w.call('GET', '/merch/order/' + id)).json.late === false, 'the order page offers no second cancel');
    const r2 = await lateCancel(w, id); eq([r2.status, r2.json.refund, w.stripe.refunds.length], [200, 'pending', 0], 'a second tap: the same, no refund');
    w.pf.down = false; await w.advance(20 * MIN);
    eq([w.stripe.refunds.length, w.order(id).status, w.order(id).late_ask_at, w.pfOrder(id).status, w.owner(/late_cancel_unread/).length], [1, 'refunded', null, 'canceled', 0], 'read, then refunded once and cancelled there');
    ok(!w.order(id).pcancel && !stranded(w).length && w.mails(/_refund_/).length === 1, 'one refund email; nothing stranded');
  });
  await T('F9b-M1-race', 'R2-M1 with R2-m1: the parcel leaves and its hint lands while the cancel\'s read is out: read again: 409 not_late, nothing refunded, one "On its way"', async () => {
    const w = await world(); const id = await lateOrder(w);
    w.pf.after.get = async (po) => { w.pf.after.get = null; w.pf.ship(po.id, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id); };
    const r = await lateCancel(w, id);
    eq([r.status, w.order(id).status, w.stripe.refunds.length, w.mails(/_ship_/).length], [409, 'shipped', 0, 1], 'posted: not refunded');
  });
  await T('F9b-M1-still', 'R2-M1: read and still not posted: the late cancel refunds in full and Printful cancels, no owner email', async () => {
    const w = await world(); const id = await lateOrder(w); const reads = w.pf.calls.length; let atRefund = null;
    w.stripe.after.refund = async () => { if (atRefund == null) atRefund = w.pf.calls.length; }; // (third review: the read must come between the cancel call and the refund)
    const r = await lateCancel(w, id);
    ok(atRefund != null && w.pf.calls.slice(reads, atRefund).some((c) => c.m === 'GET' && /^\/orders\/\d+$/.test(c.path)), 'Printful read after the cancel call and before the refund');
    eq([r.status, w.order(id).status, w.stripe.refunds.length, w.owner(/late_cancel_unread|cancel_late/).length, w.pfOrder(id).status], [200, 'refunded', 1, 0, 'canceled'], 'refunded, cancelled at Printful');
  });

  // ---- R2-M2: the late date counts from max(ship_by, now) and moves on after a won dispute
  await T('F9b-M2', 'R2-M2 (probe): a dispute before printing, won 40 days later, the owner confirms: ONE delay email with late_eta 7 working days from then, nothing refunded at +2 h, the late part refunded only at the new date', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]);
    await dispute(w, id, 'created', 'needs_response'); await w.advance(40 * DAY); await dispute(w, id, 'closed', 'won');
    const c = await w.admin('POST', 'order/' + id + '/confirm'); const t = w.clock.t; ok(c.status === 200, 'confirmed: ' + c.text);
    await w.advance(10 * MIN); let o = w.order(id);
    ok(o.late_sent_at && o.late_eta >= addBusinessDays(t, 7) && o.late_eta > w.clock.t, 'the new date is 7 working days on: ' + new Date(o.late_eta).toISOString());
    await w.advance(2 * HOUR); o = w.order(id);
    eq([o.status, !!o.late_auto_at, w.stripe.refunds.length, w.mails(/_late$/).length], ['confirmed', false, 0, 1], 'printing, not refunded, one delay email');
    await w.advance(o.late_eta - w.clock.t - MIN); ok(!w.stripe.refunds.length, 'not before the new date');
    await w.advance(2 * MIN); ok(w.order(id).late_auto_at && w.stripe.refunds.length === 1 && w.order(id).status === 'refunded', 'refunded at the new date');
  });
  await T('F9b-M2-paused', 'R2-M2: the delay email went, then a dispute paused the order for 10 days, won, the owner releases it: late_eta moves on by the pause; no refund at once', async () => {
    const w = await world({ env: { MERCH_PROVIDER_MODE: 'draft' } }); const id = await w.drafted([mug(0)]);
    await w.advance(SHIP_BY - w.clock.t + MIN); const eta0 = w.order(id).late_eta; eq(eta0, LATE_ETA, 'the first date');
    await w.advance(DAY); await dispute(w, id, 'created', 'needs_response'); const paused = w.clock.t; eq(w.order(id).hold, 'dispute', 'paused');
    await w.advance(10 * DAY); await dispute(w, id, 'closed', 'won'); ok(w.order(id).late_eta === eta0, 'still paused: the date waits for the owner');
    await w.advance(HOUR); const c = await w.admin('POST', 'order/' + id + '/confirm'); const t = w.clock.t; ok(c.status === 200, c.text);
    await w.advance(MIN);
    eq([w.order(id).late_eta, w.stripe.refunds.length], [eta0 + (t - paused), 0], 'moved by the pause, nothing refunded');
    await w.advance(w.order(id).late_eta - w.clock.t + MIN); ok(w.order(id).status === 'refunded' && w.stripe.refunds.length === 1, 'refunded at the moved date');
  });
  await T('F9b-M2-from', 'R2-M2: the delay email waits on failed reads: late_eta counts from the day it goes, never from ship_by', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]);
    await w.advance(SHIP_BY - w.clock.t - MIN); w.pf.down = true; await w.advance(3 * DAY); w.pf.down = false; await w.advance(16 * MIN);
    const o = w.order(id); ok(o.late_sent_at > SHIP_BY + 3 * DAY - HOUR, 'sent late');
    eq(o.late_eta, Math.min(addBusinessDays(o.late_sent_at, 7), o.late_sent_at + 30 * DAY), 'from the email');
  });
  await T('F9b-M2-lost', 'R2-M2 neighbour: lost: the date never moves, no delay step ever runs, the order page never says late', async () => {
    const w = await world(); const id = await lateOrder(w); const eta0 = w.order(id).late_eta;
    await dispute(w, id, 'created', 'needs_response'); await w.advance(5 * DAY); await dispute(w, id, 'closed', 'lost');
    await w.advance(30 * DAY); await w.cron();
    eq([w.order(id).late_eta, !!w.order(id).late_auto_at, w.stripe.refunds.length, (await w.call('GET', '/merch/order/' + id)).json.late], [eta0, false, 0, false], 'nothing');
  });

  // ---- R2-M3: the 7-day reship refund reads Printful first; a reshipped line moves to its new parcel
  await T('F9b-M3', 'R2-M3 (review): a parcel came back, the owner reshipped it at Printful with no hint, 7 days pass: nothing refunded, the hold cleared, one "On its way" for the new parcel', async () => {
    const w = await world(); const { id, s } = await returned(w);
    const s2 = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); // the reship, no hint
    await w.advance(7 * DAY + MIN);
    eq([w.stripe.refunds.length, w.order(id).hold, w.order(id).status, w.lines(id)[0].parcel_id, w.mails(new RegExp('_ship_' + s2.id + '$')).length], [0, null, 'shipped', s2.id, 1], 'reshipped, not refunded');
    ok(w.mails(new RegExp('_ship_' + s.id + '$')).length === 1 && !stranded(w).length, 'the first parcel told once; nothing stranded');
    const f = await address(w, id); ok(f.status === 409, 'the address form is closed: ' + f.status);
  });
  await T('F9b-M3-cron', 'R2-M3: a shipped order with a reship hold is in the daily re-read: Printful\'s reship is found within a day, long before the 7 days', async () => {
    const w = await world(); const { id } = await returned(w);
    const s2 = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' });
    await withCron(w, DAY + 20 * MIN);
    eq([w.order(id).hold, w.lines(id)[0].parcel_id, w.mails(new RegExp('_ship_' + s2.id + '$')).length, w.stripe.refunds.length], [null, s2.id, 1, 0], 'found by the re-read');
    await w.advance(7 * DAY); ok(!w.stripe.refunds.length, 'and never refunded');
  });
  await T('F9b-M3-still', 'R2-M3: not reshipped: refunded at 7 days after a read; the read fails: no refund, tried again; back: refunded once', async () => {
    let w = await world(); let r = await returned(w); const reads = w.pf.calls.length;
    await w.advance(7 * DAY + MIN);
    ok(w.pf.calls.slice(reads).some((c) => c.m === 'GET' && /^\/orders\/\d+$/.test(c.path)) && w.stripe.refunds.length === 1 && w.order(r.id).status === 'refunded', 'read, then refunded');
    w = await world(); r = await returned(w); await w.advance(7 * DAY - MIN); w.pf.down = true; await w.advance(HOUR);
    ok(!w.stripe.refunds.length && w.order(r.id).hold === 'reship' && w.order(r.id).pf_wait, 'Printful cannot be read: nothing refunded');
    w.pf.down = false; await w.advance(16 * MIN);
    ok(w.stripe.refunds.length === 1 && w.order(r.id).status === 'refunded' && !stranded(w).length, 'read again: refunded once');
  });
  await T('F9b-M3-one-read', 'R2-M3: the parcel came back and was already reshipped when the returned hint lands (one read finds both): no address email, no hold, one "On its way" for the reship', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]);
    const s = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
    s.returned = true; const s2 = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' });
    await w.phook(w.pf.hook(w.pfOrder(id), 'package_returned', 'evt_ret')); await w.advance(HOUR);
    eq([w.order(id).hold, w.lines(id)[0].parcel_id, w.mails(/_address_/).length, w.mails(new RegExp('_ship_' + s2.id + '$')).length, w.stripe.refunds.length], [null, s2.id, 0, 1, 0], 'no address asked');
  });

  // ---- R2-M4: a lost dispute stops the reprint, the reship and the lost-parcel refund
  await T('F9b-M4', 'R2-M4 (probe): a shipped tee, the dispute lost: the owner\'s lost-parcel reprint is refused (409 not_allowed), no reprint; the lost-parcel refund too (409 disputed)', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]);
    w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
    await dispute(w, id, 'created', 'needs_response'); await dispute(w, id, 'closed', 'lost');
    const p = w.one('select id from merch_parcels where order_id = ?', id);
    const a = await w.admin('POST', 'order/' + id + '/lost', { parcel: p.id, then: 'reprint' });
    eq([a.status, a.json.error, w.q('select id from merch_reprints').length], [409, 'not_allowed', 0], 'no reprint');
    const b = await w.admin('POST', 'order/' + id + '/lost', { parcel: p.id, then: 'refund' });
    eq([b.status, b.json.error, w.stripe.refunds.length], [409, 'disputed', 0], 'no refund either');
  });
  await T('F9b-M4-returned', 'R2-M4: a parcel comes back after a lost dispute: the owner\'s "returned" email, no buyer address email, no hold; POST /address 409', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]);
    const s = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
    await dispute(w, id, 'created', 'needs_response'); await dispute(w, id, 'closed', 'lost');
    s.returned = true; await shipHint(w, id);
    eq([w.order(id).hold, w.mails(/_address_/).length, w.owner(/returned/).length], [null, 0, 1], 'not asked, owner told');
    const f = await address(w, id); eq(f.status, 409, 'the form is closed');
    await w.advance(8 * DAY); ok(!w.stripe.refunds.length && !w.q('select id from merch_reprints').length, 'never refunded, never reprinted');
  });
  await T('F9b-M4-hold', 'R2-M4: the reship hold was set, then the dispute is lost: the hold ends, the form closes, nothing refunded at 7 days, the owner told', async () => {
    const w = await world(); const { id } = await returned(w);
    await dispute(w, id, 'created', 'needs_response'); await dispute(w, id, 'closed', 'lost');
    ok(!w.order(id).hold && w.owner(/returned/).length >= 1, 'hold ended, owner told');
    const f = await address(w, id); eq(f.status, 409, 'the form is closed');
    await w.advance(8 * DAY); ok(!w.stripe.refunds.length && !w.q('select id from merch_reprints').length && !stranded(w).length, 'no refund, no reprint');
  });
  await T('F9b-M4-held-reprint', 'R2-M4: a reprint waiting (not live) when the dispute is lost: cancelled, the old line back as it was; merch.sh confirm cannot release it', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]);
    w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
    w.env.MERCH_PROVIDER_MODE = 'draft';
    const a = await w.admin('POST', 'order/' + id + '/reprint', { lines: [1] }); ok(a.status === 200, a.text);
    eq(w.one('select status from merch_reprints where order_id = ?', id).status, 'held', 'the reprint waits (not live)');
    await dispute(w, id, 'created', 'needs_response'); await dispute(w, id, 'closed', 'lost');
    eq([w.one('select status from merch_reprints where order_id = ?', id).status, w.lines(id).find((l) => l.line === 1).status], ['cancelled', 'shipped'], 'cancelled, the line back');
    w.env.MERCH_PROVIDER_MODE = 'live';
    const c = await w.admin('POST', 'order/' + id + '/confirm'); await w.advance(HOUR);
    ok(c.status === 409 && !w.pf.calls.some((x) => x.m === 'POST' && /-r\d/.test((x.body || {}).external_id || '')), 'never made');
  });
  await T('F9b-M4-open', 'R2-M4 neighbour: the reship hold reaches 7 days while a dispute is open: nothing refunded; won: a fresh 7 days for the address, then refunded once', async () => {
    const w = await world(); const { id } = await returned(w);
    await w.advance(5 * DAY); await dispute(w, id, 'created', 'needs_response');
    await w.advance(5 * DAY); ok(!w.stripe.refunds.length && w.order(id).hold === 'reship', 'open: nothing refunded');
    await dispute(w, id, 'closed', 'won'); const t = w.clock.t; eq(w.order(id).hold_at, t, 'a fresh 7 days');
    await w.advance(7 * DAY - HOUR); ok(!w.stripe.refunds.length, 'not before');
    await w.advance(2 * HOUR); ok(w.stripe.refunds.length === 1 && w.order(id).status === 'refunded' && !stranded(w).length, 'then refunded once');
  });

  // ---- R2-m1: a read that went out before the order changed is not applied
  await T('F9b-m1', 'R2-m1: the daily re-read goes out, Printful puts the order on hold and its hint lands first; our read (the older one) is not applied: the hold stays (before: undone for a day)', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]); const po = w.pfOrder(id);
    await w.advance(DAY + MIN);
    w.pf.after.get = async (o) => { w.pf.after.get = null; o.status = 'onhold'; await w.phook(w.pf.hook(o, 'order_put_hold', 'evt_hold')); o.status = 'inprocess'; }; // our read answers 'inprocess': older than the hint
    await w.cron();
    eq([w.order(id).status, w.order(id).hold, w.order(id).why], ['held', 'provider', 'onhold'], 'the hold stays');
    ok(w.q("select id from merch_events where type = 'pf_read_stale'").length === 1 && !w.order(id).pf_read_at, 'the stale read is noted, not counted as a read');
    po.status = 'onhold'; await w.advance(10 * MIN); await w.cron();
    ok(w.order(id).hold === 'provider' && w.order(id).pf_read_at === w.clock.t, 'read again (fresh) at the next run: still on Printful\'s hold');
  });
  await T('F9b-m1-hook', 'R2-m1: a hint whose read is overtaken by another hint is not applied (502, Printful sends it again); the fresh one decides', async () => {
    const w = await world(); const id = await w.confirmedOrder([tee(0)]); const po = w.pfOrder(id);
    w.pf.after.get = async (o) => { w.pf.after.get = null; o.status = 'onhold'; await w.phook(w.pf.hook(o, 'order_put_hold', 'evt_h2')); o.status = 'inprocess'; };
    const r = await w.phook(w.pf.hook(po, 'order_updated', 'evt_h1'));
    eq([r.status, w.order(id).status, w.order(id).hold], [502, 'held', 'provider'], 'the older read refused, the hold stays');
  });

  // ---- R2-m2: a created after its close is ignored
  await T('F9b-m2', 'R2-m2: charge.dispute.closed (won) arrives before its created: the late created does not reopen it or pause the order', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]);
    await dispute(w, id, 'closed', 'won', 'dp_x1'); await dispute(w, id, 'created', 'needs_response', 'dp_x1');
    eq([w.order(id).dispute, w.order(id).hold], ['won', null], 'still won, not paused');
    await w.advance(2 * HOUR); ok(w.order(id).status !== 'held' || w.order(id).hold !== 'dispute', 'the flow went on');
    // a NEW dispute (another id) after that is honoured
    await dispute(w, id, 'created', 'needs_response', 'dp_x2'); eq(w.order(id).dispute, 'open', 'a new dispute opens');
  });
  await T('F9b-m2-lost', 'R2-m2: lost, then the same created again late: still lost, nothing changes (no second owner email)', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]);
    await dispute(w, id, 'created', 'needs_response', 'dp_y'); await dispute(w, id, 'closed', 'lost', 'dp_y'); const n = w.owner(/dispute/).length;
    await dispute(w, id, 'created', 'needs_response', 'dp_y');
    eq([w.order(id).dispute, w.owner(/dispute/).length], ['lost', n], 'unchanged');
  });
}
