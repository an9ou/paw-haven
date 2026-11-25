// The part 9 fifth review fixes (docs/reviews/MERCH_PART9_fifth_review.md, "Fixes (fifth review)"). Rows F9e-*: one or more per finding
// (R5-M1, R5-m1..m4), each failing on the code as reviewed (9ed8937), plus the cases next to them (the hand checks of the new count). The
// clock is the harness's fixed one (paid at T0 = Tue 1 Dec 2026 01:00 UTC). A mug is 1999 cents a unit.
import { T, ok, eq, world, mug, MIN, HOUR, DAY } from './harness.mjs';
import { testMailOk } from '../mail.js';

const hint = (w, ord, type) => w.phook(w.pf.hook(ord, type || 'package_shipped', 'evt_' + Math.random()));
const shipHint = (w, id) => hint(w, w.pfOrder(id));
const back = (w, id, s) => { s.returned = true; return hint(w, w.pfOrder(id), 'package_returned'); };
const refundLine = (w, id, line, qty, reason) => w.admin('POST', 'order/' + id + '/refund', Object.assign({ line, reason: reason || 'returned' }, qty ? { qty } : {}));
const parts = (w) => w.owner(/reship_part/).map((m) => (m.text.match(/\d+ of \d+ of line \d+/) || [])[0]);
const held = (w, id) => [w.order(id).hold, w.order(id).why];
const withCron = async (w, ms) => { const end = w.clock.t + ms; while (w.clock.t < end) { await w.advance(Math.min(10 * MIN, end - w.clock.t)); await w.cron(); } };
const gets = (w, po) => w.pf.calls.filter((c) => c.m === 'GET' && c.path === '/orders/' + po).length;
const stranded = (w) => w.L().report().stranded;
// a mug line of qty n that Printful posts one unit a parcel (a split, not a reship); posted: how many of the n units are posted now
async function split(w, n, posted) {
  const id = await w.confirmedOrder([mug(0, { qty: n })]), po = w.order(id).provider_order, ps = [];
  for (let i = 0; i < (posted == null ? n : posted); i++) { ps.push(w.pf.ship(po, [[id + '_1', 1]], { status: i === n - 1 ? 'fulfilled' : 'partial' })); await shipHint(w, id); }
  ok(ps.every((p) => p.reship === false), 'the fake says: a split, no reshipment');
  return { id, po, ps };
}

export async function fix9e() {
  console.log('--- the part 9 fifth review fixes (F9e-*)');

  // ---- R5-M1: a part-line count counts only units not out in a parcel and not refunded
  await T('F9e-M1-again', 'R5-M1 (probe 1): qty 2 posted 1 + 1; A comes back, Printful reships it (A2, flagged), A2 comes back too: the owner hears "1 of 2" (not 2 of 2); refunding that 1 unit ends the hold (one refund, the delivered unit never paid back)', async () => {
    const w = await world(); const { id, po, ps: [a] } = await split(w, 2);
    await back(w, id, a); eq([held(w, id), parts(w)], [['review', 'reship_part'], ['1 of 2 of line 1']], 'A back');
    const a2 = w.pf.ship(po, [[id + '_1', 1]], { status: 'fulfilled' }); ok(a2.reship === true, 'flagged'); await shipHint(w, id);
    eq(held(w, id), [null, null], 'A2 out: the hold ends');
    await w.advance(DAY); await back(w, id, a2);
    eq([held(w, id), parts(w)], [['review', 'reship_part'], ['1 of 2 of line 1', '1 of 2 of line 1']], 'A2 back: the true number');
    const r = await refundLine(w, id, 1, 1); ok(r.status === 200, r.text);
    eq([held(w, id), w.lines(id)[0].refunded_qty, w.stripe.refunds.map((x) => x.amount)], [[null, null], 1, [1999]], 'one unit refunded: the hold ends');
    await w.advance(9 * DAY); eq([held(w, id), w.stripe.refunds.length], [[null, null], 1], '9 days on: nothing more');
  });
  await T('F9e-M1-twice', 'R5-M1 (probe 2): qty 3 posted 1 + 1 + 1; A back, the owner refunds 1 (the hold ends); B back: the owner hears "1 of 3" (not 2 of 3); refunding that 1 ends the hold, and 9 days later it is still ended', async () => {
    const w = await world(); const { id, ps: [a, b] } = await split(w, 3);
    await w.advance(HOUR); await back(w, id, a); eq([held(w, id), parts(w)], [['review', 'reship_part'], ['1 of 3 of line 1']], 'A back');
    ok((await refundLine(w, id, 1, 1)).status === 200 && w.order(id).hold === null, 'the first refund ends the hold');
    await w.advance(DAY); await back(w, id, b);
    eq([held(w, id), parts(w)], [['review', 'reship_part'], ['1 of 3 of line 1', '1 of 3 of line 1']], 'B back: 1 of 3');
    ok((await refundLine(w, id, 1, 1)).status === 200, 'refund 1 more');
    eq([held(w, id), w.lines(id)[0].refunded_qty], [[null, null], 2], 'the hold ends');
    await w.advance(9 * DAY); eq([held(w, id), w.stripe.refunds.map((x) => x.amount)], [[null, null], [1999, 1999]], '9 days on: two units refunded, the delivered one never');
    ok(!stranded(w).length, 'nothing stranded');
  });
  await T('F9e-M1-cases', 'R5-M1, the hand checks: a unit never posted is not waiting; a flagged reship that is out settles its unit; the other half coming back after a reship is 1; a whole-line refund ends the hold', async () => {
    let w = await world(); let { id, po, ps: [a] } = await split(w, 3, 2);
    await back(w, id, a); eq([held(w, id), parts(w)], [['review', 'reship_part'], ['1 of 3 of line 1']], 'qty 3, 2 posted, A back: 1 (the unposted one is not waiting)');
    ok((await refundLine(w, id, 1, 1)).status === 200 && w.order(id).hold === null, 'refunded: the hold ends');
    const c = w.pf.ship(po, [[id + '_1', 1]], { status: 'fulfilled' }); ok(c.reship === false, 'the third unit, not a reship'); await shipHint(w, id);
    eq([held(w, id), parts(w).length], [[null, null], 1], 'the third unit posted late: nothing held');
    let b; w = await world(); ({ id, po, ps: [a, b] } = await split(w, 2));
    await back(w, id, a); const a2 = w.pf.ship(po, [[id + '_1', 1]], { status: 'fulfilled' }); await shipHint(w, id);
    eq(held(w, id), [null, null], 'a flagged reship out: settled');
    await w.advance(DAY); await back(w, id, b);
    eq([held(w, id), parts(w)], [['review', 'reship_part'], ['1 of 2 of line 1', '1 of 2 of line 1']], 'B back after A was reshipped: 1 of 2');
    ok(a2.returned !== true, 'A2 is still out');
    w = await world(); ({ id, ps: [a] } = await split(w, 2));
    await back(w, id, a); ok(w.order(id).hold === 'review', 'held');
    const r = await refundLine(w, id, 1); ok(r.status === 200, r.text);
    eq([held(w, id), w.lines(id)[0].refunded_qty], [[null, null], 2], 'a whole-line refund ends it');
  });
  await T('F9e-M1-settled', 'R5-M1, its other side: a part refund first (a damaged unit the buyer keeps), then a parcel of that line comes back: the refunds already cover it, so nothing is held, but the owner hears (returned_settled), never silence', async () => {
    const w = await world(); const { id, ps: [a] } = await split(w, 2);
    ok((await refundLine(w, id, 1, 1, 'damaged')).status === 200, 'one unit refunded');
    await back(w, id, a);
    eq([held(w, id), w.owner(/reship_part/).length, w.mails(/_checking_|_address_/).length], [[null, null], 0, 0], 'nothing held');
    const m = w.owner(/returned_settled/); ok(m.length === 1 && m[0].text.includes(a.id) && /merch\.sh refund/.test(m[0].text), 'the owner told: ' + (m[0] && m[0].text));
  });

  // ---- R5-m1: with no reshipment flag, the line's second half posted after a return is not a reship
  await T('F9e-m1-noflag', 'R5-m1 (probe): qty 2, A(1) posted with no flag comes back; the second unit B(1), also with no flag, is posted later: B is not a reship of A; the hold stays the owner\'s (in both orders of events: the return read first, or the return and B in one read)', async () => {
    for (const same of [false, true]) {
      const w = await world(); const id = await w.confirmedOrder([mug(0, { qty: 2 })]); const po = w.order(id).provider_order;
      const a = w.pf.ship(po, [[id + '_1', 1]], { status: 'partial', reship: 'none' }); await shipHint(w, id);
      await w.advance(10 * DAY); a.returned = true;
      if (!same) { await hint(w, w.pfOrder(id), 'package_returned'); eq(held(w, id), ['review', 'reship_part'], 'the return read first: held'); }
      await w.advance(2 * DAY);
      w.pf.ship(po, [[id + '_1', 1]], { status: 'fulfilled', reship: 'none' }); await shipHint(w, id);
      await w.advance(9 * DAY);
      const how = same ? 'the return and B in one read' : 'B after the return';
      eq([held(w, id), parts(w), w.mails(/_checking_/).length, w.mails(/_address_/).length, w.stripe.refunds.length], [['review', 'reship_part'], ['1 of 2 of line 1'], 1, 0, 0], how);
      ok((await refundLine(w, id, 1, 1)).status === 200 && w.order(id).hold === null, how + ': the owner\'s refund of 1 ends it');
    }
  });

  // ---- R5-m2: the daily re-read covers a shipped order held for the owner's check of a return
  await T('F9e-m2-reread', 'R5-m2 (probe): a split line, a part back, Printful reships it (flagged) with no hint: the daily re-read ends the review hold; a whole line in reship_unread whose Printful order can be read again ends too', async () => {
    let w = await world(); const { id, po, ps: [a] } = await split(w, 2);
    await back(w, id, a); eq([w.order(id).status, held(w, id)], ['shipped', ['review', 'reship_part']], 'held');
    w.pf.ship(po, [[id + '_1', 1]], { status: 'fulfilled' }); // no hint
    await withCron(w, 3 * DAY);
    eq([held(w, id), w.stripe.refunds.length, w.owner(/reship_part/).length], [[null, null], 0, 1], 'reshipped: the hold ends, nothing refunded, no more emails');
    w = await world(); const id2 = await w.confirmedOrder([mug(0)]);
    const s = w.pf.ship(w.order(id2).provider_order, [id2 + '_1'], { status: 'fulfilled' }); await shipHint(w, id2); await back(w, id2, s);
    w.pfOrder(id2).gone = true; await w.advance(w.order(id2).hold_at + 7 * DAY - w.clock.t + 25 * HOUR);
    eq([w.order(id2).status, held(w, id2)], ['shipped', ['review', 'reship_unread']], 'reship_unread');
    const told = w.owner(/printer_unread/).length;
    await withCron(w, 2 * DAY); eq([held(w, id2), w.owner(/printer_unread/).length - told], [['review', 'reship_unread'], 0], 'still unreadable: quiet (the owner was told)');
    w.pfOrder(id2).gone = false; w.pf.ship(w.order(id2).provider_order, [id2 + '_1'], { status: 'fulfilled' }); // Printful reshipped it, no hint
    await withCron(w, 2 * DAY);
    eq([held(w, id2), w.lines(id2)[0].parcel_id === s.id, w.stripe.refunds.length], [[null, null], false, 0], 'read again: the reship is seen, the hold ends');
  });
  await T('F9e-m2-quiet', 'R5-m2, what the re-read does to such an order: reads that keep failing are tried every 15 minutes for a day, then once a day (never every 15 minutes for ever); the owner told once; a Printful hold is told once, not every daily read', async () => {
    let w = await world(); const { id, po, ps: [a] } = await split(w, 2);
    await back(w, id, a); w.pfOrder(id).gone = true; const n0 = gets(w, po);
    await withCron(w, 4 * DAY);
    const n = gets(w, po) - n0;
    ok(n > 10 && n < 110, 'reads in 4 days: ' + n);
    eq([held(w, id), w.owner(/printer_unread/).length, w.stripe.refunds.length], [['review', 'reship_part'], 1, 0], 'still held, told once, nothing refunded');
    ok(!stranded(w).length, 'nothing stranded');
    w = await world(); const x = await split(w, 2); await back(w, x.id, x.ps[0]);
    w.pfOrder(x.id).status = 'onhold'; await withCron(w, 3 * DAY);
    eq([held(w, x.id), w.owner(/provider_hold/).length], [['review', 'reship_part'], 1], 'Printful\'s hold: told once');
  });

  // ---- R5-m3: no reprint of a line split over parcels with units out
  await T('F9e-m3-reprint', 'R5-m3 (probe): qty 2 posted 1 + 1, A back: the owner email offers a refund of 1, not a reprint; merch.sh reprint of that line is refused (409 part_line, says what to refund), nothing made; the refund ends the hold', async () => {
    const w = await world(); const { id, ps: [a] } = await split(w, 2);
    await back(w, id, a); const m = w.owner(/reship_part/)[0];
    ok(!/merch\.sh reprint/.test(m.text) && /merch\.sh refund/.test(m.text) && /1 of 2 of line 1/.test(m.text), 'refund only: ' + m.text);
    const p = await w.admin('POST', 'order/' + id + '/reprint', { lines: [1] });
    ok(p.status === 409 && p.json.error === 'part_line' && p.json.say.includes('merch.sh refund ' + id + ' 1 1 "returned"'), p.text);
    eq([w.lines(id).map((l) => [l.line, l.status]), w.q('select id from merch_reprints').length, held(w, id)], [[[1, 'shipped']], 0, ['review', 'reship_part']], 'nothing made');
    const lost = await w.admin('POST', 'order/' + id + '/lost', { parcel: a.id, then: 'reprint' });
    ok(lost.status === 409 && lost.json.error === 'part_line', 'nor through merch.sh lost ... reprint: ' + lost.text);
    ok((await refundLine(w, id, 1, 1)).status === 200, 'refund 1');
    eq([held(w, id), w.stripe.refunds.map((x) => x.amount)], [[null, null], [1999]], 'the hold ends: one unit back');
  });
  await T('F9e-m3-allback', 'R5-m3, next to it: every parcel of a split line came back (nothing out with the buyer): the reprint is allowed and makes the units not refunded; the hold ends', async () => {
    const w = await world(); const { id, ps: [a, b] } = await split(w, 2);
    await back(w, id, a); await back(w, id, b); eq(held(w, id), ['review', 'reship_part'], 'held');
    const p = await w.admin('POST', 'order/' + id + '/reprint', { lines: [1] }); ok(p.status === 200, p.text);
    eq([w.lines(id).map((l) => [l.line, l.status, l.qty]), held(w, id)], [[[1, 'replaced', 2], [101, 'confirmed', 2]], [null, null]], 'reprinted');
  });

  // ---- R5-m4: the test allow list is ASCII only
  await T('F9e-m4-ascii', 'R5-m4 (probe): a look-alike domain (the Kelvin sign) or any other non-ASCII address is refused; the listed ones pass as before', async () => {
    const env = { MERCH_TEST_MAIL_TO: 'Kate@Kakao.com, me+x@example.com, bad list@x.com, béa@example.com' };
    eq(['kate@kakao.com', 'KATE+location_JP@KAKAO.COM', 'me+y@example.com', 'kate@Kakao.com', 'Kate@kakao.com', 'béa@example.com', 'bea@example.com', 'kate@kakao.com​', 'list@x.com'].map((a) => testMailOk(env, a)),
      [true, true, true, false, false, false, false, false, false], 'the list');
  });
}
