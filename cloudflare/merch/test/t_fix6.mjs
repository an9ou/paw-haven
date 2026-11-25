// The part 6 review fixes (docs/reviews/MERCH_PART6_review.md; docs/design/merch/PART6.md "Review fixes (25 Nov 2026)"). Row ids F6-* and the
// new contract row T2.1-34 (the second delay notice and the automatic refund of a late part). The clock is the harness's fixed one: paid at
// T0 = Tue 1 Dec 2026 01:00 UTC, so ship_by = Thu 10 Dec 01:00 UTC and late_eta = Mon 21 Dec 01:00 UTC.
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { T, ok, eq, world, mug, tee, PP, ROOT, T0, MIN, HOUR, DAY } from './harness.mjs';
import { checkMail, one, addCodes } from './t_part6.mjs';
import * as mail from '../mail.js';
import { addBusinessDays, siteOf, orderLink } from '../util.js';
import { SHIP_BY_DAYS, LATE_MORE_DAYS, LATE_MAX_DAYS, MAKE_DAYS, ZONES, LAUNCH_SOON, LAUNCH_COUNTRIES, NO_POST, ALL_COUNTRIES, variantId } from '../catalog.js';
import { openCountries } from '../lines.js';

const GRACE = 120e3;
const SHIP_BY = Date.parse('2026-12-10T01:00:00Z'), LATE_ETA = Date.parse('2026-12-21T01:00:00Z');
const shipHint = async (w, id) => w.phook(w.pf.hook(w.pfOrder(id), 'package_shipped', 'evt_' + Math.random()));
const withCron = async (w, ms) => { const end = w.clock.t + ms; while (w.clock.t < end) { await w.advance(Math.min(10 * MIN, end - w.clock.t)); await w.cron(); } };
const crash = (w, fake, k) => { fake.after[k] = async () => { fake.after[k] = null; w.evict(); }; };
const refundKeys = (w) => w.stripe.refunds.map((r) => r.metadata.merch_refund);
const sh = (args, env, input) => execFileSync('bash', [path.join(ROOT, 'tools', 'merch.sh'), ...args], { env: Object.assign({ PATH: process.env.PATH }, env || {}), encoding: 'utf8', input: input == null ? '' : input, stdio: ['pipe', 'pipe', 'pipe'] });
const page = async (w, id) => (await w.call('GET', '/merch/order/' + id)).json;
// a confirmed order: a mug and a tee, the mug posted (part shipped), the tee late
async function partLate(w) { const id = await w.confirmedOrder([mug(0), tee(1)]); w.pf.ship(w.order(id).provider_order, [id + '_1']); await shipHint(w, id); return id; }
// the gift is either back in the pool (the order has no code) or shown and kept; never both, never neither
function giftOne(w, id, code) {
  const o = w.order(id), p = w.one('select order_id from merch_gift_pool where code = ?', code);
  const back = o.gift_code === null && p.order_id === null, kept = o.gift_code === code && !!o.gift_shown_at && p.order_id === id;
  ok(back !== kept, 'exactly one outcome for ' + code + ': back ' + back + ', kept ' + kept + ' (' + o.status + ')');
  return kept ? 'kept' : 'back';
}

export async function fix6() {
  console.log('--- the part 6 review fixes (F6-*, T2.1-34)');

  // ---- (a) one posting promise
  await T('F6-ship-by', '(a) ship_by = payment + SHIP_BY_DAYS (7) working days; the order answer has it; the Thank you email says "We’ll post it by Thursday 10 December" (the UTC date, with "by")', async () => {
    eq([SHIP_BY_DAYS, LATE_MORE_DAYS, LATE_MAX_DAYS], [7, 7, 30], 'the promise in catalog.js');
    const w = await world(); const id = await w.paidOrder([mug(0)]); const o = w.order(id);
    eq([o.paid_at, o.ship_by], [T0, addBusinessDays(T0, SHIP_BY_DAYS)], 'ship_by'); eq(o.ship_by, SHIP_BY, 'Thu 10 Dec 01:00 UTC');
    const p = await page(w, id); eq([p.ship_by, p.late_eta, p.late_ok, p.late, p.gift], [SHIP_BY, null, false, false, null], 'the order answer');
    ok(/We’ll post it by Thursday 10 December\./.test(one(w, /_thanks$/).text), 'the Thank you email');
    eq([mail.postDay(Date.parse('2026-12-10T23:59:59Z')), mail.postDay(Date.parse('2026-12-11T00:00:00Z')), mail.postDay(Date.parse('2027-01-04T09:00:00+09:00'))], ['Thursday 10 December', 'Friday 11 December', 'Monday 4 January'], 'the UTC date in words');
    for (const z of Object.values(ZONES)) ok(z.eta[0] >= MAKE_DAYS[0] + 1 && z.eta[1] >= SHIP_BY_DAYS + 1 && z.eta[0] < z.eta[1], z.id + ': eta [2 + fastest post, SHIP_BY_DAYS + slowest post]: ' + z.eta);
    const c = w.stripe.calls.find((x) => x.path === '/v1/checkout/sessions'), E = ZONES.us_jp.eta;
    eq([Number(c.body['shipping_options[0][shipping_rate_data][delivery_estimate][minimum][value]']), Number(c.body['shipping_options[0][shipping_rate_data][delivery_estimate][maximum][value]'])], E, 'the Stripe delivery line is the door-to-door eta');
  });

  // ---- (b) the first delay email at ship_by with a definite new date
  await T('F6-late-first', '(b) the first delay email goes AT ship_by (not before) with late_eta = ship_by + 7 working days (at most 30 days); kind, with "you don’t need to do anything" and "any time until it’s posted"', async () => {
    const w = await world(); const id = await partLate(w);
    ok(w.order(id).next_try_at <= SHIP_BY, 'a wake at ship_by');
    await w.advance(SHIP_BY - w.clock.t - 1); ok(!w.order(id).late_sent_at && !w.mails(/_late$/).length, 'nothing one ms before');
    await w.advance(1); const o = w.order(id);
    eq([o.late_sent_at, o.late_eta], [SHIP_BY, LATE_ETA], 'sent at ship_by, the new date stored');
    ok(o.late_eta === Math.min(addBusinessDays(o.ship_by, LATE_MORE_DAYS), o.ship_by + LATE_MAX_DAYS * DAY) && o.late_eta - o.ship_by <= LATE_MAX_DAYS * DAY, 'never more than 30 days after ship_by');
    const m = one(w, /_late$/); checkMail(m, id, 'late');
    ok(/by Thursday 10 December/.test(m.text) && /by Monday 21 December/.test(m.text) && /You don’t need to do anything to keep waiting/.test(m.text) && /any time until it’s posted/.test(m.text) && /We’re sorry/.test(m.text), 'the words: ' + m.text.slice(0, 400));
    const p = await page(w, id); eq([p.late, p.late_eta, p.late_ok], [true, LATE_ETA, false], 'the order answer');
    ok(w.order(id).next_try_at <= LATE_ETA, 'a wake at late_eta');
  });

  // ---- (c) "Keep waiting" tells the server
  await T('F6-wait', '(c) POST /merch/order/:id/wait: only when late; records late_ok_at once (idempotent); the same id check and rate limit as cancel', async () => {
    const w = await world(); const id = await partLate(w);
    let r = await w.call('POST', '/merch/order/' + id + '/wait', {}); ok(r.status === 409 && r.json.error === 'not_late', 'not before the delay email');
    ok((await w.call('POST', '/merch/order/mo_AAAAAAAAAAAAAAAAAAAAAA/wait', {})).status === 404 && (await w.call('POST', '/merch/order/nope/wait', {})).status === 404, 'an unknown id: 404');
    await w.advance(SHIP_BY - w.clock.t); w.clock.t += 5 * MIN;
    r = await w.call('POST', '/merch/order/' + id + '/wait', {}); ok(r.status === 200 && r.json.late_ok === true && r.json.late_eta === LATE_ETA, r.text);
    const at = w.order(id).late_ok_at; ok(at === w.clock.t, 'recorded'); w.clock.t += MIN;
    r = await w.call('POST', '/merch/order/' + id + '/wait', {}); ok(r.status === 200 && w.order(id).late_ok_at === at && w.q("select id from merch_events where type = 'late_ok'").length === 1, 'twice: the same, one event');
    ok((await page(w, id)).late_ok === true, 'the order answer says so');
    const ip = { 'CF-Connecting-IP': '10.77.0.1' }; let last = 0;
    for (let i = 0; i < 11; i++) last = (await w.call('POST', '/merch/order/' + id + '/wait', {}, ip)).status;
    ok(last === 429, 'the buttons’ limit, 10 an hour per IP: ' + last);
    ok((await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' }, ip)).status === 429, 'shared with cancel');
    // a late part cancelled: nothing is late any more
    ok((await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' })).status === 200 && (await w.call('POST', '/merch/order/' + id + '/wait', {})).status === 409, 'after the late cancel: not_late');
  });

  // ---- (c) at late_eta
  await T('T2.1-34', 'alarm at late_eta, part still not posted: keep waiting said -> one second notice (late_again, me_<order>_late_2), no new date, no refund; not said -> the late part refunded in full by itself (the late-cancel path), the printer asked or the owner told, one kind email', async () => {
    // keep waiting
    let w = await world(); let id = await partLate(w); await w.advance(SHIP_BY - w.clock.t);
    await w.call('POST', '/merch/order/' + id + '/wait', {});
    await w.advance(LATE_ETA - w.clock.t - 1); ok(!w.mails(/_late_2$/).length, 'nothing before late_eta');
    await w.advance(1); const a = one(w, new RegExp('^me_' + id + '_late_2$')); checkMail(a, id, 'late_again');
    ok(/still hasn’t gone out, and we said Monday 21 December/.test(a.text) && /Thank you for waiting/.test(a.text) && /any time until it’s posted/.test(a.text) && !/expect to post/.test(a.text) && /Tee with/.test(a.text) && !/Mug with/.test(a.text), 'the second notice: ' + a.text.slice(0, 400));
    eq([w.order(id).late2_sent_at, w.stripe.refunds.length], [LATE_ETA, 0], 'once, nothing refunded');
    await w.advance(10 * DAY); await w.cron(); ok(w.mails(/_late_2$/).length === 1 && !w.stripe.refunds.length && !w.L().report().stranded.length, 'once, ever');
    ok((await page(w, id)).late === true && (await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' })).status === 200 && w.stripe.refunds.length === 1, 'the buyer can still cancel the late part');
    // not said: refunded by itself; part of the order posted, so the owner cancels the tee by hand
    w = await world(); id = await partLate(w); await w.advance(LATE_ETA - w.clock.t);
    const o = w.order(id);
    eq([o.late_auto_at, o.status, w.stripe.refunds.map((r) => r.amount).join()], [LATE_ETA, 'shipped', '2699'], 'the tee refunded, what is left was posted');
    const rf = w.mails(new RegExp('^me_' + id + '_refund_')); ok(rf.length === 1, 'ONE email'); checkMail(rf[0], id, 'late_auto');
    ok(/It took too long, so we’ve refunded it\. Sorry\./.test(rf[0].text) && /We’ve refunded \$26\.99 for part of your order/.test(rf[0].text) && !/As you asked/.test(rf[0].text), 'the refund email says why, kindly: ' + rf[0].text.slice(0, 300));
    ok(w.owner(/cancel_late/).length === 1 && /refunded by itself/.test(w.owner(/cancel_late/)[0].text) && !w.pf.calls.some((c) => c.m === 'DELETE'), 'part posted: the owner is told, the printer order is not cancelled whole');
    await w.advance(5 * DAY); await w.cron(); w.state().alarmAt = w.clock.t; await w.L().alarm(); ok(w.stripe.refunds.length === 1 && w.mails(new RegExp('^me_' + id + '_refund_')).length === 1 && !w.mails(/_late_2$/).length, 'a repeated alarm and the cron: nothing more');
    // nothing posted: the whole order refunded, the printer asked to cancel
    w = await world(); id = await w.confirmedOrder([tee(0)]); await w.advance(LATE_ETA - w.clock.t + MIN);
    ok(w.order(id).status === 'refunded' && w.pf.calls.some((c) => c.m === 'DELETE') && !w.order(id).pcancel && !w.owner(/cancel_late/).length, 'refunded, cancelled at the printer');
    const ra = w.mails(new RegExp('^me_' + id + '_refund_')); ok(ra.length === 1 && /Your order is refunded/.test(ra[0].subject) && /didn’t go out by the new date we gave you/.test(ra[0].text), 'refunded in full, said why');
  });
  await T('F6-late-held', '(c) the late steps run for held orders too (a wake at ship_by and late_eta), never in a dispute; a confirming order waits for its confirm', async () => {
    // held draft_mode with a draft: refunded by itself at late_eta, the draft deleted, never confirmed
    let w = await world({ env: { MERCH_PROVIDER_MODE: 'draft' } }); let id = await w.drafted([mug(0)]); await w.advance(2 * HOUR);
    eq([w.order(id).status, w.order(id).hold, w.order(id).next_try_at], ['held', 'draft_mode', SHIP_BY], 'held, with a wake at ship_by');
    await w.advance(SHIP_BY - w.clock.t); ok(w.mails(/_late$/).length === 1 && w.order(id).next_try_at === LATE_ETA, 'the delay email, and a wake at late_eta');
    await w.advance(LATE_ETA - w.clock.t + MIN); ok(w.order(id).status === 'refunded' && w.pf.orders.size === 1 && Array.from(w.pf.orders.values()).every((p) => p.deleted) && !w.order(id).draft_del && !w.pf.calls.some((c) => /\/confirm(ation)?$/.test(c.path)), 'refunded, the draft deleted, never confirmed');
    // a dispute opened after the delay email: no second step while it is open; report clean
    w = await world(); id = await partLate(w); await w.advance(SHIP_BY - w.clock.t);
    await w.hook('charge.dispute.created', { id: 'dp_late', payment_intent: w.order(id).payment_intent });
    await w.advance(15 * DAY); await w.cron(); ok(!w.order(id).late_auto_at && !w.stripe.refunds.length && !w.mails(/_late_2$/).length && !w.L().report().stranded.length, 'in a dispute: nothing refunded, nothing sent, nothing stranded');
    // second review (R2-M2): won: the steps go on with the new date moved by the 15 days the dispute held them (not at once)
    const eta0 = w.order(id).late_eta, open0 = w.order(id).disputed_at;
    await w.hook('charge.dispute.closed', { id: 'dp_late', payment_intent: w.order(id).payment_intent, status: 'won' }); await w.advance(MIN);
    ok(!w.order(id).late_auto_at && !w.stripe.refunds.length && w.order(id).late_eta === eta0 + (w.clock.t - MIN - open0), 'won: the new date moved on by the dispute, nothing refunded at once');
    await w.advance(w.order(id).late_eta - w.clock.t + MIN);
    ok(w.order(id).late_auto_at && w.stripe.refunds.length === 1, 'won: the step runs at the moved date');
    // the tee posted before late_eta: nothing more
    w = await world(); id = await partLate(w); await w.advance(SHIP_BY - w.clock.t + DAY);
    w.pf.ship(w.order(id).provider_order, [id + '_2'], { status: 'fulfilled' }); await shipHint(w, id);
    await w.advance(12 * DAY); await w.cron(); ok(w.order(id).status === 'shipped' && !w.order(id).late_auto_at && !w.stripe.refunds.length && !w.mails(/_late_2$/).length, 'posted in time for the new date: no second step');
    // confirming at the late cancel: a kind, true refusal (review finding 9)
    w = await world(); id = await partLate(w); await w.advance(SHIP_BY - w.clock.t);
    w.L().run("update merch_orders set status = 'confirming' where id = ?", id);
    const r = await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' });
    ok(r.status === 409 && r.json.error === 'busy' && /sending your order to print right this minute\. Please try again in a minute or two\./.test(r.json.say) && !w.stripe.refunds.length, 'confirming: not now, said kindly: ' + r.text);
    ok(w.L().lateDue(w.order(id)) === null, 'and the second step waits for the confirm to finish');
  });
  await T('F6-crash-late', 'the automatic refund under crashes: killed after Stripe made the refund, after the printer cancelled, after the email went: one refund, one cancel, one email; a repeated alarm changes nothing', async () => {
    for (const where of ['refund', 'cancel', 'mail']) {
      const w = await world(); const id = await w.confirmedOrder([tee(0)]);
      if (where === 'refund') crash(w, w.stripe, 'refund'); else if (where === 'cancel') crash(w, w.pf, 'delete'); else crash(w, w.mail, 'send');
      await w.advance(SHIP_BY - w.clock.t + MIN); if (where === 'mail') { w.mail.after.send = null; crash(w, w.mail, 'send'); }
      await w.advance(LATE_ETA - w.clock.t + MIN); await withCron(w, 2 * HOUR);
      const o = w.order(id);
      ok(o.status === 'refunded' && o.late_auto_at && !o.pcancel && !o.lease_until, where + ': refunded, nothing left half done: ' + o.status);
      ok(new Set(refundKeys(w)).size === refundKeys(w).length && w.stripe.refunds.length === 1 && w.stripe.refunds[0].amount === o.total, where + ': one refund in full');
      ok(w.mails(new RegExp('^me_' + id + '_refund_')).length === 1 && w.pf.calls.filter((c) => c.m === 'DELETE').length <= 2 && w.pfOrder(id).deleted && !w.owner(/cancel_late/).length, where + ': one email, cancelled at the printer, no owner email');
      ok(!w.L().report().stranded.length, where + ': nothing stranded');
      w.state().alarmAt = w.clock.t; await w.L().alarm(); await w.L().alarm(); ok(w.stripe.refunds.length === 1 && w.mails(new RegExp('^me_' + id + '_refund_')).length === 1, where + ': repeated alarms: nothing more');
    }
  });

  // ---- the gift (finding 2): races
  await T('F6-gift-race', 'the gift: a cancel and the hour ending at the same moment (both orders): exactly one outcome; the webhook twice; a release after a cancel; a Dashboard refund in the hour; a lost dispute', async () => {
    const code = 'TEST-GIFT-0501';
    // a cancel 1 ms before the hour (and its grace) ends, with the confirm due at that moment
    let w = await world(); await addCodes(w, [code]); let id = await w.drafted([mug(0)]); const end = w.order(id).cancel_until + GRACE;
    w.clock.t = end - 1; ok((await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' })).json.status === 'cancelled', 'cancelled'); await w.advance(HOUR);
    eq(giftOne(w, id, code), 'back', 'just inside the hour: back in the pool');
    // the cancel request at exactly the end, before the alarm: too late; the alarm then shows it
    w = await world(); await addCodes(w, [code]); id = await w.drafted([mug(0)]);
    w.clock.t = w.order(id).cancel_until + GRACE; ok((await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' })).json.error === 'too_late', 'at the end: too late');
    await w.advance(MIN); eq(giftOne(w, id, code), 'kept', 'shown');
    // the alarm first at that moment, the cancel right after it
    w = await world(); await addCodes(w, [code]); id = await w.drafted([mug(0)]);
    await w.advance(w.order(id).cancel_until + GRACE - w.clock.t); ok((await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' })).json.error === 'too_late', 'the alarm first: too late');
    eq(giftOne(w, id, code), 'kept', 'shown');
    // a cancel arriving during the confirm call (the hour is over): too late, shown
    w = await world(); await addCodes(w, [code]); id = await w.drafted([mug(0)]); let res;
    w.pf.after.confirm = async () => { w.pf.after.confirm = null; res = await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' }); };
    await w.advance(2 * HOUR); ok(res.json.error === 'too_late', 'during the confirm: too late'); eq(giftOne(w, id, code), 'kept', 'shown');
    // the webhook twice (and async_payment_succeeded after completed): one code
    w = await world(); await addCodes(w, ['TEST-GIFT-0601', 'TEST-GIFT-0602']); id = await w.newOrder([mug(0)]);
    const r1 = await w.pay(id); await w.call('POST', '/merch/webhook/stripe', r1.raw, { 'stripe-signature': r1.sig }); await w.pay(id); await w.pay(id, null, 'checkout.session.async_payment_succeeded');
    eq([w.order(id).gift_code, w.q('select code from merch_gift_pool where order_id is not null').length], ['TEST-GIFT-0601', 1], 'one code reserved');
    // held at payment, cancelled in its hour, then the owner tries to release it: refused, no code taken
    w = await world(); await addCodes(w, ['TEST-GIFT-0701']); await w.admin('POST', 'flag', { key: 'email:held2@example.test', mode: 'block' });
    id = await w.newOrder([mug(0)]); await w.pay(id, { email: 'held2@example.test' });
    ok((await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' })).json.status === 'cancelled' && (await w.admin('POST', 'order/' + id + '/confirm')).status === 409, 'cancelled, then the release is refused');
    ok(!w.q('select code from merch_gift_pool where order_id is not null').length && w.order(id).gift_code === null, 'no code taken');
    // a full Dashboard refund inside the hour: back; after the hour (shown): kept
    w = await world(); await addCodes(w, ['TEST-GIFT-0801', 'TEST-GIFT-0802']);
    const dash = async (x) => { const o = w.order(x); w.stripe.dashRefund(o.payment_intent, o.total); return w.hook('charge.refunded', { id: 'ch_' + x, payment_intent: o.payment_intent, amount: o.total, refunded: true }); };
    id = await w.paidOrder([mug(0)]); await dash(id); eq(giftOne(w, id, 'TEST-GIFT-0801'), 'back', 'a Dashboard refund in the hour: back');
    const k = await w.paidOrder([mug(1)], 'US', { email: 'k@example.test' }); ok(w.order(k).gift_code === 'TEST-GIFT-0801', 'the next order takes it');
    await w.advance(2 * HOUR); await dash(k); eq([w.order(k).status, giftOne(w, k, 'TEST-GIFT-0801')], ['refunded', 'kept'], 'refunded after it was shown: kept (a gift is a gift)');
    // a dispute in the hour (held dispute): reserved, never shown; lost: back
    w = await world(); await addCodes(w, ['TEST-GIFT-0901']); id = await w.paidOrder([mug(0)]); const pi = w.order(id).payment_intent;
    await w.hook('charge.dispute.created', { id: 'dp_g', payment_intent: pi }); await w.advance(3 * HOUR); ok(!w.order(id).gift_shown_at && (await page(w, id)).gift_code === null, 'in a dispute: not shown');
    await w.hook('charge.dispute.closed', { id: 'dp_g', payment_intent: pi, status: 'lost' }); eq(giftOne(w, id, 'TEST-GIFT-0901'), 'back', 'lost: back in the pool');
  });
  await T('F6-gift-once', 'the gift is mailed once: the first email after it is shown (here the delay email), never again (gift_mailed); never in the Thank you', async () => {
    const w = await world(); await addCodes(w, ['TEST-GIFT-1001']); const id = await partLate(w);
    ok(!one(w, /_thanks$/).text.includes('TEST-GIFT') && w.mails(/_ship_/)[0].text.includes('TEST-GIFT-1001'), 'the first On its way carries it');
    await w.advance(SHIP_BY - w.clock.t); ok(!one(w, /_late$/).text.includes('TEST-GIFT'), 'the delay email does not carry it again');
    const x = await world(); await addCodes(x, ['TEST-GIFT-1002']); const j = await x.confirmedOrder([tee(0)]); await x.advance(SHIP_BY - x.clock.t);
    const lt = one(x, /_late$/); ok(lt.text.includes('TEST-GIFT-1002') && x.order(j).gift_mailed === 'me_' + j + '_late', 'nothing posted yet: the delay email is the first after the hour, it carries it');
    x.pf.ship(x.order(j).provider_order, [j + '_1'], { status: 'fulfilled' }); await shipHint(x, j); ok(!x.mails(/_ship_/)[0].text.includes('TEST-GIFT'), 'then On its way does not');
  });

  // ---- findings 5, 6, 12, 13, 14
  await T('F6-reject-batch', 'finding 5: several lines refused by the printer at once, or rendered badly together: ONE email listing them; every line refused: one "refunded in full"', async () => {
    let w = await world(); w.pf.refuse.variants = ['pf:' + variantId('tee', 'navy', 'M'), 'pf:' + variantId('tee', 'black', 'L')];
    let id = await w.paidOrder([mug(0), tee(1), tee(2, { colour: 'black', size: 'L' })]); await w.advance(5 * MIN);
    let rj = w.mails(/^me_.*_reject_/); ok(rj.length === 1 && w.q('select id from merch_refunds where order_id = ?', id).length === 2, 'one email, two refund rows: ' + rj.length);
    checkMail(rj[0], id, 'reject 2'); ok(/couldn’t print some things/.test(rj[0].subject) && /we couldn’t make these/.test(rj[0].text) && (rj[0].text.match(/^- Tee with/gm) || []).length === 2 && /\$53\.98 for them/.test(rj[0].text) && /The rest of your order goes on/.test(rj[0].text), 'both lines, the amount: ' + rj[0].text.slice(0, 300));
    ok(w.lines(id)[0].status === 'drafted' && w.owner(/provider_reject/).length === 1, 'the mug goes on; one owner email');
    w = await world(); w.rd.queue.push('err', 'err', 'err', 'err', 'err', 'err'); id = await w.paidOrder([mug(0), mug(1, { pose: 'sit' }), tee(4)]); await w.advance(6 * MIN);
    rj = w.mails(/^me_.*_reject_/); ok(rj.length === 1 && (rj[0].text.match(/^- Mug with/gm) || []).length === 2 && !/Tee with/.test(rj[0].text.split('Order:')[0]), 'render: two lines in one email: ' + rj.length + ' ' + (rj[0] && rj[0].text.slice(0, 200)));
    w = await world(); w.rd.queue.push('err', 'err', 'err', 'err', 'err', 'err'); id = await w.paidOrder([mug(0), tee(4)]); await w.advance(6 * MIN);
    ok(w.order(id).status === 'refunded' && w.mails(new RegExp('^me_' + id + '_refund_')).length === 1 && !w.mails(/^me_.*_reject_/).length, 'every line: one "refunded in full", no "one thing"');
  });
  await T('F6-tax-mail', 'finding 6: the Thank you email has a Tax row when there is tax; on top of the prices the rows add up to the total', async () => {
    const w = await world(); await w.paidOrder([mug(0)], 'US', { tax: 150 }); const t = one(w, /_thanks$/).text;
    ok(/Shipping: \$4\.99\nTax: \$1\.50\nTotal: \$26\.48 \(US dollars\)/.test(t), 'the rows: ' + t.slice(0, 300));
    const inc = mail.build('thanks', { id: 'mo_AAAAAAAAAAAAAAAAAAAAAA', lines: [], totals: { subtotal: 1999, ship_fee: 499, tax: 227, total: 2498 } }, {});
    ok(/Tax \(included in the prices\): \$2\.27\nTotal: \$24\.98/.test(inc.text), 'inside the prices: said so');
    ok(!/Tax/.test(mail.build('thanks', { id: 'mo_AAAAAAAAAAAAAAAAAAAAAA', lines: [], totals: { subtotal: 1999, ship_fee: 499, tax: 0, total: 2498 } }, {}).text), 'no tax: no row');
  });
  await T('F6-site', 'finding 12: MERCH_SITE is only ever a plain https origin; anything else is the default', async () => {
    for (const bad of ['javascript:alert(1)', 'http://doodledoggo.app', 'https://evil.example/path', 'https://a.example:8443', ' ', 'https://x.example/"onmouseover=1', 'HTTPS://DOODLEDOGGO.APP']) eq(siteOf({ MERCH_SITE: bad }), 'https://doodledoggo.app', bad);
    eq([siteOf({ MERCH_SITE: 'https://test.doodledoggo.app/' }), siteOf({}), orderLink(siteOf({ MERCH_SITE: 'javascript:x' }), 'mo_x')], ['https://test.doodledoggo.app', 'https://doodledoggo.app', 'https://doodledoggo.app/merch/#/order/mo_x'], 'good ones kept');
    const m = mail.build('thanks', { id: 'mo_AAAAAAAAAAAAAAAAAAAAAA', lines: [] }, { MERCH_SITE: 'javascript:alert(1)//' });
    ok(!/javascript:/.test(m.html + m.text) && m.text.includes('https://doodledoggo.app/merch/#/order/'), 'no such link in an email');
  });
  await T('F6-stale-mail', 'finding 13: a Thank you retried after a cancel is not sent; a part refund email sent after the rest was refunded does not say "the rest goes on"', async () => {
    let w = await world(); w.mail.fail = 1; const id = await w.paidOrder([mug(0)]);
    ok(w.one('select status from merch_outbox where id = ?', 'me_' + id + '_thanks').status === 'queued', 'the Thank you waits for a retry');
    await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' }); await w.advance(HOUR);
    ok(!w.mails(/_thanks$/).length && w.one('select status from merch_outbox where id = ?', 'me_' + id + '_thanks').status === 'skipped' && w.mails(/_cancelled$/).length === 1, 'skipped; the cancelled email went');
    w = await world(); const d = await w.confirmedOrder([mug(0), tee(1)]); w.pf.ship(w.order(d).provider_order, [d + '_1', d + '_2'], { status: 'fulfilled' }); await shipHint(w, d);
    w.mail.fail = 1; await w.admin('POST', 'order/' + d + '/refund', { line: 1, reason: 'damaged' }); await w.admin('POST', 'order/' + d + '/refund', { line: 2, reason: 'damaged' }); await w.advance(HOUR);
    const part = w.mails(new RegExp('^me_' + d + '_refund_mr_' + d + '_l1_')); ok(part.length === 1 && /We’ve refunded \$19\.99 for part of your order/.test(part[0].text) && !/goes on as before/.test(part[0].text), 'sent after the rest ended: no "the rest goes on": ' + (part[0] && part[0].text.slice(0, 200)));
  });
  await T('F6-gift-admin', 'finding 14: the admin gift route says 413 too_big over 64 KB; merch.sh gift add: 1000 or 2000 codes exit 0, a promo.sh CSV (first column, header skipped)', async () => {
    const w = await world();
    const big = await w.admin('POST', 'gift', { codes: Array.from({ length: 1990 }, (_, i) => 'TEST-GIFT-' + 'X'.repeat(25) + String(i).padStart(4, '0')) });
    ok(big.status === 413 && big.json.error === 'too_big' && !/TEST-GIFT/.test(big.text), 'over 64 KB: 413 too_big: ' + big.status);
    for (const n of [1000, 2000]) { const out = sh(['gift', 'add'], {}, Array.from({ length: n }, (_, i) => 'TEST-GIFT-' + String(i).padStart(4, '0')).join('\n') + '\n'); ok((out.match(/DRY RUN/g) || []).length === n / 1000 && new RegExp(n + ' codes to send').test(out), n + ' codes: exit 0, ' + n / 1000 + ' request(s)'); }
    const csv = sh(['gift', 'add'], {}, 'code,batch,made_at\nTEST-GIFT-0001,MERCH-THANKS,2026-11-25T00:00:00Z\n"TEST-GIFT-0002",MERCH-THANKS,2026-11-25T00:00:00Z\n');
    ok(/2 codes to send \(0 lines skipped/.test(csv) && !/TEST-GIFT/.test(csv), 'the CSV: two codes, the header skipped: ' + csv);
  });

  // ---- (e) one source, (f) rejected lines' files
  await T('F6-catalog-json', '(e) site/merch/catalog.json is exactly tools/merch_catalog_json.js from catalog.js (eta, fees, LAUNCH_SOON, no never or no-post places, no vat_included while not registered)', async () => {
    const gen = createRequire(import.meta.url)(path.join(ROOT, 'tools', 'merch_catalog_json.js'));
    const want = await gen.make(), have = fs.readFileSync(path.join(ROOT, 'site', 'merch', 'catalog.json'), 'utf8');
    ok(have === want, 'site/merch/catalog.json is out of date: run NODE_PATH=$(npm root -g) node tools/merch_catalog_json.js');
    const j = JSON.parse(have);
    ok(j.zones.every((z) => JSON.stringify(z.eta) === JSON.stringify(ZONES[z.id].eta) && z.fee === ZONES[z.id].fee), 'zones as catalog.js');
    ok(j.countries.filter((c) => c.soon).map((c) => c.code).sort().join() === LAUNCH_SOON.slice().sort().join() && j.countries.every((c) => ALL_COUNTRIES.includes(c.code)) && !NO_POST.some((c) => j.countries.some((x) => x.code === c)), 'soon = LAUNCH_SOON; no never and no no-post places');
    const open = openCountries({ MERCH_COUNTRIES: LAUNCH_COUNTRIES }); ok(!LAUNCH_SOON.some((c) => open.has(c)) && open.has('US') && open.has('JP') && open.has('HK'), 'LAUNCH_COUNTRIES opens all but LAUNCH_SOON');
    ok(j.zones.find((z) => z.id === 'uk_eu').notes.join() === '' && j.zones.find((z) => z.id === 'world').notes.join() === 'import_tax', 'no vat_included while not registered');
    const w = await world(); ok((await w.quote([mug(0)], 'AQ')).json.error === 'bad_country' && !(await w.call('GET', '/merch/catalog')).json.countries.some((c) => NO_POST.includes(c.code)), 'the Worker leaves out places with no post');
    ok(j.products[1].sizes.map((s) => s.id).join() === 'XS,S,M,L,XL,2XL,3XL,4XL', 'sizes smallest first');
  });
  await T('F6-keep', '(f) a line the printer rejected (some lines, or all) keeps its print file 2 days, then tidy() removes it; a render reject and a Dashboard refund too', async () => {
    let w = await world(); w.pf.refuse.variants = ['pf:' + variantId('tee', 'navy', 'M')]; let id = await w.paidOrder([mug(0), tee(1)]); await w.advance(5 * MIN);
    let l = w.lines(id)[1]; ok(l.status === 'rejected' && l.keep_until === l.keep_until && l.keep_until > w.clock.t + DAY && l.keep_until <= w.clock.t + 2 * DAY && l.file_key, 'some: kept 2 days: ' + l.keep_until);
    const shard = l.file_key.split('~')[0], before = w.env.PRINTS.get(shard).obj.stat().files;
    w.clock.t = Date.parse('2026-12-04T05:00:00+09:00'); await w.cron();
    ok(w.lines(id)[1].file_key === null && w.env.PRINTS.get(shard).obj.stat().files === before - 1 && w.lines(id)[0].file_key, 'tidy removed its file, kept the mug’s');
    w = await world(); w.pf.refuse.variants = ['pf:' + variantId('mug', 'white', null), 'pf:' + variantId('tee', 'navy', 'M')]; id = await w.paidOrder([mug(0), tee(1)]); await w.advance(5 * MIN);
    ok(w.order(id).status === 'refunded' && w.lines(id).every((x) => x.status === 'rejected' && x.keep_until && x.keep_until <= w.clock.t + 2 * DAY), 'all: every line kept 2 days');
    w.clock.t = Date.parse('2026-12-04T05:00:00+09:00'); await w.cron(); ok(w.lines(id).every((x) => x.file_key === null), 'tidy removed them');
    w = await world(); w.rd.queue.push('err', 'err', 'err'); id = await w.paidOrder([mug(0), tee(1)]); await w.advance(3 * MIN); ok(w.lines(id)[0].status === 'rejected' && w.lines(id)[0].keep_until, 'a render reject has an end date too');
    w = await world(); id = await w.paidOrder([mug(0), tee(1)]); await w.advance(5 * MIN); w.L().run("update merch_order_items set status = 'rejected', keep_until = null where order_id = ? and line = 2", id);
    const o = w.order(id); w.stripe.dashRefund(o.payment_intent, o.total); await w.hook('charge.refunded', { id: 'ch_k', payment_intent: o.payment_intent, amount: o.total, refunded: true });
    ok(w.lines(id).every((x) => x.keep_until), 'a Dashboard refund: every line has an end date');
  });
}
