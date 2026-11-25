// The part 9 third review fixes (docs/reviews/MERCH_PART9_third_review.md, "Fixes (third review)"). Rows F9b-*: one or more per finding
// (R3-M1..M3, R3-m1..m3), each failing on the code as reviewed (b7ef7ab), plus the cases next to them. The clock is the harness's fixed one:
// paid at T0 = Tue 1 Dec 2026 01:00 UTC, so ship_by = Thu 10 Dec 01:00 UTC.
import { T, ok, eq, world, mug, tee, MIN, HOUR, DAY } from './harness.mjs';

const SHIP_BY = Date.parse('2026-12-10T01:00:00Z');
const hint = (w, ord, type) => w.phook(w.pf.hook(ord, type || 'package_shipped', 'evt_' + Math.random()));
const shipHint = (w, id) => hint(w, w.pfOrder(id));
const dispute = (w, id, type, status, did) => w.hook('charge.dispute.' + type, { id: did || 'dp_' + id.slice(3, 9), payment_intent: w.order(id).payment_intent, status });
const lateCancel = (w, id) => w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' });
const address = (w, id) => w.call('POST', '/merch/order/' + id + '/address', { name: 'Pat', line1: '9 New Lane', city: 'Town', postal: '12345', state: 'NY', country: 'US' });
const withCron = async (w, ms) => { const end = w.clock.t + ms; while (w.clock.t < end) { await w.advance(Math.min(10 * MIN, end - w.clock.t)); await w.cron(); } };
const stranded = (w) => w.L().report().stranded;
const gets = (w, po) => w.pf.calls.filter((c) => c.m === 'GET' && c.path === '/orders/' + po).length;
async function lateOrder(w, lines) { const id = await w.confirmedOrder(lines || [tee(0)]); await w.advance(SHIP_BY - w.clock.t + HOUR); ok(w.order(id).late_sent_at && w.mails(/_late$/).length === 1, 'the delay email went'); return id; }
// a shipped order whose first line (a mug) was reprinted by the owner: the reprint's own Printful order, confirmed
async function withReprint(w, lines) {
  const id = await w.confirmedOrder(lines || [mug(0)]);
  w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: lines && lines.length > 1 ? 'partial' : 'fulfilled' }); await shipHint(w, id);
  const a = await w.admin('POST', 'order/' + id + '/reprint', { lines: [1] }); ok(a.status === 200, a.text); await w.advance(30 * MIN);
  const rp = w.one('select * from merch_reprints where order_id = ?', id); ok(rp.status === 'confirmed' && rp.provider_order, 'the reprint is confirmed at Printful');
  return { id, rp, ro: w.pf.orders.get(String(rp.provider_order)) };
}

export async function fix9c() {
  console.log('--- the part 9 third review fixes (F9b-*, third review)');

  // ---- R3-M1: a reshipped line moves to its new parcel whatever the order of shipments, hints and reads
  await T('F9b-M3-order', 'R3-M1 (probe A1): one read lists the reship BEFORE the returned parcel: the line moves to the reship, no address asked, no hold; nothing refunded at 7 days', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]);
    const s = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
    s.returned = true; const s2 = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' });
    const ord = w.pfOrder(id); ord.shipments.reverse(); // Printful lists the newest first
    await hint(w, ord, 'package_returned');
    eq([w.order(id).hold, w.lines(id)[0].parcel_id, w.mails(/_address_/).length], [null, s2.id, 0], 'moved to the reship, nobody asked');
    await w.advance(7 * DAY + HOUR);
    eq([w.stripe.refunds.length, w.order(id).status, w.mails(/_ship_/).length], [0, 'shipped', 2], 'never refunded; one "On its way" a parcel');
  });
  await T('F9b-M3-late-flag', 'R3-M1 (probe A2): the reship is seen first, the returned flag comes in a later read: the line moves then; no hold, nothing refunded at 7 days', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]);
    const s = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
    const s2 = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
    ok(w.lines(id)[0].parcel_id === s.id, 'the first parcel has not come back yet: the line stays in it');
    s.returned = true; await hint(w, w.pfOrder(id), 'package_returned');
    eq([w.order(id).hold, w.lines(id)[0].parcel_id, w.mails(/_address_/).length], [null, s2.id, 0], 'moved, nobody asked');
    await w.advance(7 * DAY + HOUR); ok(!w.stripe.refunds.length && !stranded(w).length, 'never refunded');
  });
  await T('F9b-M3-part-reship', 'R3-M1 neighbour: two lines came back, Printful reshipped one (listed first): the other alone waits for the address and alone is refunded at 7 days', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), mug(1)]);
    const s = w.pf.ship(w.order(id).provider_order, [id + '_1', id + '_2'], { status: 'fulfilled' }); await shipHint(w, id);
    s.returned = true; const s2 = w.pf.ship(w.order(id).provider_order, [id + '_2'], { status: 'fulfilled' });
    const ord = w.pfOrder(id); ord.shipments.reverse(); await hint(w, ord, 'package_returned');
    eq([w.order(id).hold, w.lines(id).map((l) => l.parcel_id), w.mails(/_address_/).length], ['reship', [s.id, s2.id], 1], 'line 2 reshipped, line 1 waits');
    await w.advance(7 * DAY + HOUR);
    eq([w.stripe.refunds.length, w.lines(id).map((l) => l.refunded_qty), w.order(id).hold], [1, [1, 0], null], 'only line 1 refunded');
  });

  // ---- R3-M2: a reprint's read is counted, capped and told; the case ends
  await T('F9b-M3-rp-unread', 'R3-M2 (probe H): a reprint\'s parcel came back and its Printful order cannot be read: at 7 days + 24 hours of failed reads the order is held for the owner (one email), nothing refunded, no more reads', async () => {
    const w = await world(); const { id, ro } = await withReprint(w);
    const s = w.pf.ship(ro.id, ro.items.map((i) => i.external_id), { status: 'fulfilled' }); await hint(w, ro); s.returned = true; await hint(w, ro, 'package_returned');
    eq([w.order(id).status, w.order(id).hold], ['shipped', 'reship'], 'returned: hold reship');
    ro.gone = true; const t7 = w.order(id).hold_at + 7 * DAY;
    await w.advance(t7 - w.clock.t + 23 * HOUR);
    ok(w.order(id).hold === 'reship' && !w.owner(/reship_unread/).length && !w.stripe.refunds.length, 'not yet: tried again every 15 minutes');
    await w.advance(2 * HOUR);
    const o = w.order(id);
    eq([o.hold, o.why, o.next_try_at, w.owner(/reship_unread/).length, w.stripe.refunds.length], ['review', 'reship_unread', null, 1, 0], 'held for the owner, one email, no refund');
    ok(/could not be read/.test(w.owner(/reship_unread/)[0].text) && w.owner(/reship_unread/)[0].text.includes(String(ro.id)), 'the email names the Printful order');
    const n = gets(w, ro.id); await withCron(w, 2 * DAY);
    eq([gets(w, ro.id) - n, w.owner(/reship_unread/).length, w.stripe.refunds.length], [0, 1, 0], 'the case ended: no more reads, no second email');
    ok((await address(w, id)).status === 409 && !stranded(w).length, 'the address form is shut; nothing stranded');
  });
  await T('F9b-M3-rp-back', 'R3-M2 neighbour: the reprint\'s order cannot be read for 2 hours at the 7 days, then can: refunded once (not reshipped), the hold ends', async () => {
    const w = await world(); const { id, ro } = await withReprint(w);
    const s = w.pf.ship(ro.id, ro.items.map((i) => i.external_id), { status: 'fulfilled' }); await hint(w, ro); s.returned = true; await hint(w, ro, 'package_returned');
    ro.gone = true; await w.advance(w.order(id).hold_at + 7 * DAY - w.clock.t + 2 * HOUR);
    ok(!w.stripe.refunds.length && w.one('select read_fail from merch_reprints where order_id = ?', id).read_fail, 'failing: counted on the reprint, nothing refunded');
    ro.gone = false; await w.advance(20 * MIN);
    eq([w.stripe.refunds.length, w.order(id).hold, w.one('select read_fail from merch_reprints where order_id = ?', id).read_fail, w.owner(/reship_unread/).length], [1, null, null, 0], 'refunded once');
  });
  await T('F9b-M3-rp-cron', 'R3-M2: the daily re-read of a reprint not posted yet that cannot be read: hourly for a day, the owner told once, then once a day (never every 15 minutes for ever)', async () => {
    const w = await world(); const { id, ro } = await withReprint(w);
    ro.gone = true; await withCron(w, 4 * DAY);
    const unread = w.owner(/printer_unread/).filter((m) => m.text.includes(id + '-r1'));
    ok(unread.length === 1, 'told once: ' + unread.length);
    const n = gets(w, ro.id); ok(n >= 20 && n <= 32, 'about a day of hourly reads, then daily: ' + n);
    await withCron(w, 2 * DAY); ok(gets(w, ro.id) - n <= 3, 'daily now: ' + (gets(w, ro.id) - n));
  });

  // ---- R3-M3: Printful's hold applies to the main order only and never over another hold
  await T('F9b-M4-onhold-reship', 'R3-M3 (probe C): a reship hold, then Printful puts the main order on hold: the reship hold stays (owner told), released: still the reship; the address form works; nothing refunded', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]);
    const s = w.pf.ship(w.order(id).provider_order, [id + '_1']); await shipHint(w, id); s.returned = true; await shipHint(w, id);
    eq([w.order(id).status, w.order(id).hold], ['part_shipped', 'reship'], 'returned');
    const po = w.pfOrder(id); po.status = 'onhold'; await hint(w, po, 'order_put_hold');
    eq([w.order(id).status, w.order(id).hold], ['part_shipped', 'reship'], 'the reship hold stays');
    ok(w.owner(/provider_hold/).length === 1 && /reship/.test(w.owner(/provider_hold/)[0].text), 'the owner is told of Printful\'s hold');
    po.status = 'inprocess'; await hint(w, po, 'order_remove_hold');
    eq([w.order(id).status, w.order(id).hold], ['part_shipped', 'reship'], 'released: still the reship');
    const f = await address(w, id); ok(f.status === 200, 'the address form: ' + f.status + ' ' + f.text);
    await w.advance(8 * DAY);
    ok(!w.stripe.refunds.length && w.q("select id from merch_reprints where order_id = ? and status = 'confirmed'", id).length === 1, 'reshipped, never refunded');
  });
  await T('F9b-rp-onhold', 'R3-M3 (probe G): a reprint\'s Printful order on hold leaves the main order alone (owner told); and a reprint read never lifts the main order\'s own hold', async () => {
    const w = await world(); const { id, ro } = await withReprint(w, [mug(0), tee(1)]);
    const st = w.order(id).status;
    ro.status = 'onhold'; await hint(w, ro, 'order_put_hold');
    eq([w.order(id).status, w.order(id).hold], [st, null], 'the main order goes on');
    ok(w.owner(/provider_hold/).some((m) => m.text.includes(String(ro.id))), 'the owner is told of the reprint\'s hold');
    ro.status = 'pending'; const po = w.pfOrder(id); po.status = 'onhold'; await hint(w, po, 'order_put_hold');
    eq([w.order(id).status, w.order(id).hold], ['held', 'provider'], 'the main order on Printful\'s hold');
    await hint(w, ro, 'order_updated');
    eq([w.order(id).status, w.order(id).hold], ['held', 'provider'], 'a reprint read does not lift it');
  });
  await T('F9b-M4-returned-onhold', 'R3-M3 neighbour: Printful holds the main order, then a posted parcel comes back: the reship goes on (part shipped, the address asked, the form open), the owner told', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]);
    const s = w.pf.ship(w.order(id).provider_order, [id + '_1']); await shipHint(w, id);
    const po = w.pfOrder(id); po.status = 'onhold'; await hint(w, po, 'order_put_hold'); eq(w.order(id).hold, 'provider', 'Printful\'s hold');
    s.returned = true; await hint(w, po, 'package_returned');
    eq([w.order(id).status, w.order(id).hold, w.mails(/_address_/).length], ['part_shipped', 'reship', 1], 'the reship');
    ok(w.owner(/provider_hold/).length >= 1 && (await address(w, id)).status === 200, 'owner told; the address form works');
  });

  // ---- R3-m1: a lost dispute cancels a confirmed reprint with nothing posted, and the owner hears what still goes on
  await T('F9b-M4-confirmed-reprint', 'R3-m1 (probe B): a reprint confirmed at Printful, then the dispute is lost: Printful cancels it, the old line is back as it was, one owner email names it; a replay sends nothing more', async () => {
    const w = await world(); const { id, rp, ro } = await withReprint(w);
    await dispute(w, id, 'created', 'needs_response'); await dispute(w, id, 'closed', 'lost'); await w.advance(HOUR);
    eq([w.one('select status from merch_reprints where id = ?', rp.id).status, ro.status, w.lines(id).map((l) => [l.line, l.status])], ['cancelled', 'canceled', [[1, 'shipped'], [101, 'cancelled']]], 'cancelled at Printful');
    const m = w.owner(/dispute_lost/); ok(m.length === 1 && m[0].text.includes(rp.id), 'the owner told, the reprint named');
    await w.hook('charge.dispute.closed', { id: 'dp_' + id.slice(3, 9), payment_intent: w.order(id).payment_intent, status: 'lost' });
    await w.advance(DAY); ok(w.owner(/dispute_lost/).length === 1 && !stranded(w).length, 'a second close: nothing more');
  });
  await T('F9b-M4-lost-posted', 'R3-m1: lost with a reprint already posted and a main line not posted yet: nothing cancelled blind, the owner email names both', async () => {
    const w = await world(); const { id, rp, ro } = await withReprint(w, [mug(0), tee(1)]);
    w.pf.ship(ro.id, ro.items.map((i) => i.external_id), { status: 'fulfilled' }); await hint(w, ro);
    await dispute(w, id, 'created', 'needs_response'); await dispute(w, id, 'closed', 'lost'); await w.advance(HOUR);
    eq([w.one('select status from merch_reprints where id = ?', rp.id).status, ro.status], ['confirmed', 'fulfilled'], 'the posted reprint left alone');
    const m = w.owner(/dispute_lost/); ok(m.length === 1 && m[0].text.includes(rp.id) && /line 2/.test(m[0].text), 'both named: ' + (m[0] && m[0].text));
  });

  // ---- R3-m2: the late-created guard works per dispute id
  await T('F9b-m2-other-id', 'R3-m2 (probe F): A won, then B closed lost BEFORE its created: the late created of B does not reopen the dispute; B won before its created: a paid order is not paused', async () => {
    let w = await world(); let id = await w.confirmedOrder([mug(0)]);
    await dispute(w, id, 'created', 'needs_response', 'dp_a'); await dispute(w, id, 'closed', 'won', 'dp_a');
    await dispute(w, id, 'closed', 'lost', 'dp_b'); await dispute(w, id, 'created', 'needs_response', 'dp_b');
    eq(w.order(id).dispute, 'lost', 'still lost, not open');
    w = await world(); id = await w.paidOrder([mug(0)]);
    await dispute(w, id, 'created', 'needs_response', 'dp_c'); await dispute(w, id, 'closed', 'won', 'dp_c');
    const c = await w.admin('POST', 'order/' + id + '/confirm'); ok(c.status === 200, c.text);
    await dispute(w, id, 'closed', 'won', 'dp_d'); await dispute(w, id, 'created', 'needs_response', 'dp_d');
    eq([w.order(id).dispute, w.order(id).hold === 'dispute'], ['won', false], 'not paused');
    await dispute(w, id, 'created', 'needs_response', 'dp_e'); eq(w.order(id).dispute, 'open', 'a new dispute still opens');
  });

  // ---- R3-m3: the late cancel with Printful unread
  await T('F9b-M1-unread-once', 'R3-m3 (probe D): the tee was posted with its hint lost and Printful answers one 503: the read is tried again at once: 409 not_late, shipped, nothing refunded', async () => {
    const w = await world(); const id = await lateOrder(w);
    w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); w.pf.fail.get = 1;
    const r = await lateCancel(w, id); await w.advance(HOUR);
    eq([r.status, r.json.error, w.order(id).status, w.stripe.refunds.length, w.owner(/late_cancel_unread/).length], [409, 'not_late', 'shipped', 0, 0], 'read on the second try');
  });
  await T('F9b-M1-ask-posted', 'R3-m3: Printful down at the late cancel, the tee was posted before the buyer asked: the cancel ends not late once Printful answers (no refund), the buyer told kindly', async () => {
    const w = await world(); const id = await lateOrder(w);
    w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled', at: w.clock.t - HOUR }); w.pf.down = true;
    const r = await lateCancel(w, id); eq([r.status, r.json.refund], [200, 'pending'], 'the cancel is in');
    w.pf.down = false; await w.advance(20 * MIN);
    eq([w.order(id).status, w.order(id).late_ask_at, w.stripe.refunds.length, w.mails(/_late_posted$/).length, w.mails(/_ship_/).length], ['shipped', null, 0, 1, 1], 'posted before: not late, told');
    await w.advance(3 * DAY); ok(!w.stripe.refunds.length && !stranded(w).length, 'and never refunded later');
  });
  await T('F9b-M1-ask-after', 'R3-m3: the buyer asked while Printful was down, and Printful posted it after that: refunded as asked (the parcel still goes), the owner told', async () => {
    const w = await world(); const id = await lateOrder(w); w.pf.down = true;
    const r = await lateCancel(w, id); eq([r.status, r.json.refund], [200, 'pending'], 'the cancel is in');
    await w.advance(5 * MIN); w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled', at: w.clock.t });
    w.pf.down = false; await w.advance(20 * MIN);
    eq([w.stripe.refunds.length, w.order(id).status, w.order(id).late_ask_at], [1, 'refunded', null], 'refunded once');
    ok(w.owner(/late_cancel_unread/).length === 1 && /posted after/.test(w.owner(/late_cancel_unread/)[0].text), 'the owner told it was posted after the ask');
  });
  await T('F9b-M1-ask-tell', 'R3-m3: Printful cannot be read for a day after the buyer asked: refunded once on what we know at 24 hours (owner told), never before; Printful back: no second refund', async () => {
    const w = await world(); const id = await lateOrder(w); w.pf.down = true;
    const r = await lateCancel(w, id); ok(r.status === 200 && r.json.refund === 'pending', 'pending');
    await w.advance(23 * HOUR); ok(!w.stripe.refunds.length && w.order(id).late_ask_at, 'not before a day');
    await w.advance(2 * HOUR);
    eq([w.stripe.refunds.length, w.order(id).status, w.owner(/late_cancel_unread/).length], [1, 'refunded', 1], 'refunded on what we know, the owner told');
    w.pf.down = false; await w.advance(DAY); ok(w.stripe.refunds.length === 1 && w.pfOrder(id).status === 'canceled' && !stranded(w).length, 'one refund; Printful cancelled');
  });
}
