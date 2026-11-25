// The part 9 fourth review fixes (docs/reviews/MERCH_PART9_fourth_review.md, "Fixes (fourth review)"). Rows F9d-*: one or more per finding
// (R4-M1, R4-m1..m5, the not-counted stand-in drafts), each failing on the code as reviewed (9815a07), plus the cases next to them. The clock
// is the harness's fixed one (paid at T0 = Tue 1 Dec 2026 01:00 UTC).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { T, ok, eq, world, mug, PP, ROOT, TEST_TOKEN, MIN, HOUR, DAY } from './harness.mjs';
import { namespace, fakeStripe } from './fakes.mjs';
import standin, { TestPrinter, PRINTER_KEY } from '../test_printer.js';
import { call } from '../util.js';
import * as stripe from '../stripe.js';
import * as pf from '../provider_printful.js';
import * as mail from '../mail.js';
import { corsFor } from '../worker.js';
import { printerNow } from '../admin.js';

const hint = (w, ord, type) => w.phook(w.pf.hook(ord, type || 'package_shipped', 'evt_' + Math.random()));
const shipHint = (w, id) => hint(w, w.pfOrder(id));
const stranded = (w) => w.L().report().stranded;
const address = (w, id) => w.call('POST', '/merch/order/' + id + '/address', { name: 'Pat', line1: '9 New Lane', city: 'Town', postal: '12345', state: 'NY', country: 'US' });
const refundLine = (w, id, line, qty) => w.admin('POST', 'order/' + id + '/refund', Object.assign({ line, reason: 'returned' }, qty ? { qty } : {}));
// a shipped mug line of qty 2 that Printful posts in two parcels of one each (a split, not a reship)
async function splitOrder(w, more) {
  const id = await w.confirmedOrder([mug(0, { qty: 2 })].concat(more || []));
  const po = w.order(id).provider_order;
  const a = w.pf.ship(po, [[id + '_1', 1]], { status: 'partial' }); await shipHint(w, id);
  const b = w.pf.ship(po, [[id + '_1', 1]], { status: more ? 'partial' : 'fulfilled' }); await shipHint(w, id);
  ok(a.reship === false && b.reship === false, 'the fake says: a split, no reshipment');
  return { id, po, a, b };
}
// the stand-in printer in Node (as t_testprinter.mjs): its default fetch over a Durable Object namespace; calls counted
function standIn(clock) {
  const env = { NOW: () => clock.t }; env.PRINTER = namespace(TestPrinter, env);
  const S = { calls: [] };
  S.fetch = async (url, init) => { const r = new Request(url, init); S.calls.push(r.method + ' ' + new URL(r.url).pathname); return standin.fetch(r, env); };
  return S;
}

export async function fix9d() {
  console.log('--- the part 9 fourth review fixes (F9d-*)');

  // ---- R4-M1: a split is not a reship; part of a line that came back is held for the owner
  await T('F9d-M1-map', 'R4-M1: mapOrder keeps each shipment item\'s quantity and Printful\'s reshipment flag (is_reshipment or reshipment; null when not given)', async () => {
    const d = { id: 9, status: 'partial', costs: {}, order_items: [{ id: 51, external_id: 'mo_x_1', quantity: 2 }] };
    const ship = (o) => Object.assign({ id: 1, shipment_status: 'shipped', shipment_items: [{ order_item_id: 51, quantity: 1 }] }, o);
    const m = pf.mapOrder(d, [ship({ id: 1, is_reshipment: false }), ship({ id: 2, reshipment: true }), ship({ id: 3, shipment_items: [{ order_item_external_id: 'mo_x_1' }] })]);
    eq(m.shipments.map((s) => [s.id, s.units, s.reship]), [['1', [{ ext: 'mo_x_1', qty: 1 }], false], ['2', [{ ext: 'mo_x_1', qty: 1 }], true], ['3', [{ ext: 'mo_x_1', qty: null }], null]], 'units and the flag');
    eq(m.shipments[0].items, ['mo_x_1'], 'items as before');
  });
  await T('F9d-M1-split-first', 'R4-M1 (probe B, first parcel back): a mug of qty 2 posted 1 + 1; the first parcel comes back: not moved to the other parcel; held for the owner (one email "1 of 2 of line 1"), the buyer told we\'re checking; no address ask, no refund by itself; the owner refunds 1: the hold ends', async () => {
    const w = await world(); const { id, a } = await splitOrder(w);
    a.returned = true; await hint(w, w.pfOrder(id), 'package_returned');
    const o = w.order(id), m = w.owner(/reship_part/);
    eq([o.status, o.hold, o.why, w.lines(id)[0].parcel_id, w.mails(/_address_/).length, w.mails(/_checking_/).length], ['shipped', 'review', 'reship_part', a.id, 0, 1], 'held for the owner');
    ok(m.length === 1 && /1 of 2 of line 1/.test(m[0].text) && m[0].text.includes(a.id), 'the owner email names the part: ' + (m[0] && m[0].text));
    ok(/We’re checking on your parcel/.test(w.mails(/_checking_/)[0].subject), 'the buyer note');
    ok((await address(w, id)).status === 409, 'the address form stays shut');
    await w.advance(9 * DAY);
    eq([w.stripe.refunds.length, w.order(id).hold, w.q('select id from merch_reprints').length], [0, 'review', 0], '9 days on: nothing by itself');
    const r = await refundLine(w, id, 1, 1); ok(r.status === 200, r.text);
    eq([w.stripe.refunds.length, w.lines(id)[0].refunded_qty, w.order(id).hold, w.order(id).why], [1, 1, null, null], 'one unit refunded, the hold ends');
    ok(!stranded(w).length, 'nothing stranded');
  });
  await T('F9d-M1-split-second', 'R4-M1 (probe B, second parcel back): the line names the first parcel, the second comes back: the owner hears the right thing (1 of 2 of line 1, not "nothing is reshipped"), the hold is the owner\'s', async () => {
    const w = await world(); const { id, a, b } = await splitOrder(w);
    b.returned = true; await hint(w, w.pfOrder(id), 'package_returned');
    eq([w.order(id).hold, w.order(id).why, w.lines(id)[0].parcel_id], ['review', 'reship_part', a.id], 'held for the owner; the line still names parcel A');
    ok(!w.owner(/\[returned\]/).length && w.owner(/reship_part/).length === 1 && /1 of 2 of line 1/.test(w.owner(/reship_part/)[0].text) && w.owner(/reship_part/)[0].text.includes(b.id), 'the right email');
    ok(w.mails(/_checking_/).length === 1 && !w.mails(/_address_/).length, 'the buyer told we\'re checking');
  });
  await T('F9d-M1-split-reship', 'R4-M1: a split line, one parcel back, then Printful reships that one unit (flagged): the owner\'s hold ends by itself after the read, nothing refunded', async () => {
    const w = await world(); const { id, po, a } = await splitOrder(w);
    a.returned = true; await hint(w, w.pfOrder(id), 'package_returned');
    ok(w.owner(/reship_part/).length === 1 && w.order(id).hold === 'review', 'held for the owner');
    const r = w.pf.ship(po, [[id + '_1', 1]], { status: 'fulfilled' }); ok(r.reship === true, 'the fake flags it a reshipment');
    await shipHint(w, id);
    eq([w.order(id).hold, w.order(id).why], [null, null], 'reshipped: the hold ends');
    await w.advance(9 * DAY); ok(!w.stripe.refunds.length && !stranded(w).length, 'never refunded');
  });
  await T('F9d-M1-noflag', 'R4-M1: with no reshipment flag, a second whole parcel seen BEFORE the first came back is not a reship (address asked); one first seen after it came back is (moved, nothing asked)', async () => {
    let w = await world(); let id = await w.confirmedOrder([mug(0)]);
    const s = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled', reship: 'none' }); await shipHint(w, id);
    w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled', reship: 'none' }); await shipHint(w, id);
    await w.advance(MIN); s.returned = true; await hint(w, w.pfOrder(id), 'package_returned');
    eq([w.order(id).hold, w.lines(id)[0].parcel_id, w.mails(/_address_/).length], ['reship', s.id, 1], 'seen before: not a reship, the buyer asked');
    w = await world(); id = await w.confirmedOrder([mug(0)]);
    const s1 = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled', reship: 'none' }); await shipHint(w, id);
    s1.returned = true; await hint(w, w.pfOrder(id), 'package_returned');
    eq([w.order(id).hold, w.mails(/_address_/).length], ['reship', 1], 'came back: asked');
    await w.advance(HOUR); const s2 = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled', reship: 'none' }); await shipHint(w, id);
    eq([w.order(id).hold, w.lines(id)[0].parcel_id], [null, s2.id], 'first seen after the return: a reship, the hold ends');
    await w.advance(8 * DAY); ok(!w.stripe.refunds.length, 'never refunded');
  });
  await T('F9d-M1-flag-false', 'R4-M1: Printful says the second parcel is NOT a reshipment (is_reshipment false): the line is never moved to it, even when seen after the return', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]);
    const s1 = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
    s1.returned = true; await hint(w, w.pfOrder(id), 'package_returned');
    w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled', reship: false }); await shipHint(w, id);
    eq([w.order(id).hold, w.lines(id)[0].parcel_id], ['reship', s1.id], 'still waits for the address');
  });
  await T('F9d-M1-mixed', 'R4-M1: a reship waits for a whole line, then a parcel with part of a split line comes back: the owner hears of the part, the reship goes on; at 7 days only the whole line is refunded', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), mug(1, { qty: 2 })]); const po = w.order(id).provider_order;
    const p1 = w.pf.ship(po, [id + '_1']); await shipHint(w, id);
    const p2 = w.pf.ship(po, [[id + '_2', 1]]); await shipHint(w, id);
    w.pf.ship(po, [[id + '_2', 1]], { status: 'fulfilled' }); await shipHint(w, id);
    p1.returned = true; await hint(w, w.pfOrder(id), 'package_returned'); eq([w.order(id).hold, w.mails(/_address_/).length], ['reship', 1], 'the reship of line 1');
    p2.returned = true; await hint(w, w.pfOrder(id), 'package_returned');
    eq([w.order(id).hold, w.owner(/reship_part/).length, w.mails(/_address_/).length], ['reship', 1, 1], 'the reship goes on; the owner told of the part');
    await w.advance(7 * DAY + HOUR);
    eq([w.stripe.refunds.length, w.lines(id).map((l) => l.refunded_qty), w.order(id).hold], [1, [1, 0], null], 'line 1 refunded; line 2 is the owner\'s');
  });

  // ---- R4-m1: the time limit covers the body
  await T('F9d-m1-body', 'R4-m1 (probe C): headers come, the body never ends: a timeout at the limit, and the request aborted', async () => {
    let aborted = false; const t0 = Date.now();
    const f = (u, i) => { i.signal.addEventListener('abort', () => { aborted = true; }); return new Response(new ReadableStream({ start() {} }), { status: 200 }); };
    const r = await Promise.race([call(f, 'https://api.stripe.com/v1/x', { method: 'GET' }, 100), new Promise((res) => setTimeout(() => res('STILL WAITING'), 2000))]);
    ok(r !== 'STILL WAITING' && r.timeout === true && r.ok === false && aborted && Date.now() - t0 < 1000, 'timeout: ' + JSON.stringify(r) + ' aborted ' + aborted);
    const g = await call(async () => new Response('{"a":1}'), 'https://x.test/', { method: 'GET' }, 100); eq([g.ok, g.data], [true, { a: 1 }], 'a normal answer as before');
  });

  // ---- R4-m2: keys trimmed; the test Worker takes test Stripe keys only
  await T('F9d-m2-keys', 'R4-m2 (probe C): on the test Worker only sk_test_ / rk_test_ after trimming; a padded live key is refused; the trimmed key is sent; Printful and Resend keys trimmed alike (a padded test-printer is still not a printer on the live Worker)', async () => {
    const S = fakeStripe(), seen = [];
    const env = (k) => ({ MERCH_TEST: '1', MERCH_STRIPE_KEY: k, MERCH_STRIPE_WEBHOOK_SECRET: 'whsec_x', STRIPE_FETCH: async (u, i) => { seen.push(i.headers.Authorization); return S.fetch(u, i); } });
    eq(['sk_live_abc', ' sk_live_abc', '\tsk_live_abc', ' rk_live_abc\n', 'pk_test_abc', 'sk_test', 'whatever', '', ' sk_test_abc ', 'rk_test_abc'].map((k) => stripe.stripeReady(env(k))),
      [false, false, false, false, false, false, false, false, true, true], 'the allow list');
    await stripe.getSession(env(' sk_test_abc\t'), 'cs_x'); eq(seen, ['Bearer sk_test_abc'], 'the trimmed key is sent');
    ok(stripe.stripeReady({ MERCH_STRIPE_KEY: ' sk_live_abc', MERCH_STRIPE_WEBHOOK_SECRET: 'whsec_x', STRIPE_FETCH: S.fetch }), 'the live Worker takes its live key');
    const pcalls = []; const pfx = async (u, i) => { pcalls.push(i.headers.Authorization); return new Response('{}', { status: 404 }); };
    ok(!pf.providerReady({ MERCH_PROVIDER_KEY: ' test-printer ', PROVIDER_FETCH: pfx, MERCH_PROVIDER_MODE: 'live' }), 'live Worker: a padded test-printer is no printer');
    eq((await pf.get({ MERCH_PROVIDER_KEY: ' test-printer', PROVIDER_FETCH: pfx }, 'x')).kind, 'not_set_up', 'and nothing is sent');
    await pf.get({ MERCH_PROVIDER_KEY: ' pf_key \n', PROVIDER_FETCH: pfx }, 'x'); eq(pcalls, ['Bearer pf_key'], 'a real key trimmed');
    ok(/^STAND-IN/.test(printerNow({ MERCH_TEST: '1', PROVIDER_FETCH: pfx, MERCH_PROVIDER_KEY: ' test-printer' })), 'merch.sh show: still the stand-in');
    const m = []; await mail.owner({ RESEND_API_KEY: ' re_abc ', MERCH_OWNER_TO: 'o@example.test', MAIL_FETCH: async (u, i) => { m.push(i.headers.Authorization); return new Response('{"id":"e"}'); } }, null, 'report', 'x', 'k');
    eq(m, ['Bearer re_abc'], 'Resend: the trimmed key');
  });

  // ---- R4-m3: the buyer hears after reship_unread; the owner's refund or reprint ends the hold; a second parcel keeps it
  const unread = async (lines) => {
    const w = await world(); const id = await w.confirmedOrder(lines || [mug(0)]);
    const s = w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: lines ? 'partial' : 'fulfilled' }); await shipHint(w, id);
    s.returned = true; await hint(w, w.pfOrder(id), 'package_returned'); eq(w.order(id).hold, 'reship', 'returned');
    w.pfOrder(id).gone = true; await w.advance(w.order(id).hold_at + 7 * DAY - w.clock.t + 25 * HOUR);
    eq([w.order(id).hold, w.order(id).why], ['review', 'reship_unread'], 'held for the owner'); w.pfOrder(id).gone = false;
    return { w, id, s };
  };
  await T('F9d-m3-note', 'R4-m3: a reship ends in reship_unread: the buyer gets one kind note (we\'re checking), plain words, nothing alarming', async () => {
    const { w, id } = await unread(); const n = w.mails(/_checking_/);
    ok(n.length === 1 && /We’re checking on your parcel/.test(n[0].subject) && /You don’t need to do anything for now/.test(n[0].text), 'one note: ' + (n[0] && n[0].text.slice(0, 200)));
    ok(!/refund(ed)? (all|in full)|dispute|problem|error/i.test(n[0].text.replace(/Questions\?[\s\S]*$/, '')), 'nothing alarming');
    await w.advance(2 * DAY); ok(w.mails(/_checking_/).length === 1, 'once');
  });
  await T('F9d-m3-clear', 'R4-m3: after reship_unread the owner\'s refund (merch.sh refund) ends the review hold; in a second world the owner\'s reprint does', async () => {
    let { w, id } = await unread(); const r = await refundLine(w, id, 1); ok(r.status === 200, r.text);
    eq([w.order(id).hold, w.order(id).why, w.stripe.refunds.length], [null, null, 1], 'refunded: the hold ends');
    ({ w, id } = await unread()); const p = await w.admin('POST', 'order/' + id + '/reprint', { lines: [1] }); ok(p.status === 200, p.text);
    eq([w.order(id).hold, w.order(id).why], [null, null], 'reprinted: the hold ends'); ok(!stranded(w).length, 'nothing stranded');
  });
  await T('F9d-m3-second', 'R4-m3: held reship_unread, then a second parcel comes back: still the owner\'s review (not a new reship), the owner told, no address ask', async () => {
    const { w, id } = await unread([mug(0), mug(1)]);
    const s2 = w.pf.ship(w.order(id).provider_order, [id + '_2'], { status: 'fulfilled' }); await shipHint(w, id);
    s2.returned = true; await hint(w, w.pfOrder(id), 'package_returned');
    eq([w.order(id).hold, w.order(id).why, w.mails(/_address_/).length], ['review', 'reship_unread', 1], 'still the owner\'s review');
    ok(w.owner(/returned_review/).length === 1 && w.owner(/returned_review/)[0].text.includes(s2.id), 'the owner told of the second parcel');
    await refundLine(w, id, 1); eq(w.order(id).hold, 'review', 'line 1 refunded: line 2 still waits');
    await refundLine(w, id, 2); eq([w.order(id).hold, w.order(id).status], [null, 'refunded'], 'both refunded: the hold ends');
  });

  // ---- R4-m4: the public test order server
  const tw = (env) => world({ env: Object.assign({ MERCH_TEST: '1', MERCH_PROVIDER_MODE: 'draft', MERCH_PROVIDER_WEBHOOK_SECRET: undefined }, env || {}) });
  await T('F9d-m4-mail', 'R4-m4: on the test Worker buyer emails go only to MERCH_TEST_MAIL_TO; none listed: none sent (the outbox row says why, no owner email); the live Worker ignores the list', async () => {
    let w = await tw({ MERCH_TEST_MAIL_TO: undefined }); let id = await w.paidOrder([mug(0)]);
    ok(!w.mail.sent.some((m) => m.to !== w.env.MERCH_OWNER_TO), 'no buyer email');
    const row = w.one("select status, last_error from merch_outbox where order_id = ? and who = 'buyer'", id); eq([row.status, row.last_error], ['failed', 'test_not_listed'], 'the ledger notes it');
    ok(!w.owner(/mail_failed/).length, 'no owner email about it');
    w = await tw({ MERCH_TEST_MAIL_TO: ' Someone@Example.test , other@example.test' }); id = await w.paidOrder([mug(0)]);
    ok(!w.mail.sent.some((m) => m.to === 'buyer@example.test'), 'an address not on the list: not sent');
    w = await tw({ MERCH_TEST_MAIL_TO: 'x@example.test, Buyer@Example.TEST ' }); id = await w.paidOrder([mug(0)]);
    ok(w.mails(/Thank you/).some((m) => m.to === 'buyer@example.test'), 'on the list: sent');
    w = await world({ env: { MERCH_TEST_MAIL_TO: undefined } }); id = await w.paidOrder([mug(0)]);
    ok(w.mails(/Thank you/).some((m) => m.to === 'buyer@example.test'), 'the live Worker: sent as always');
    const L = { MERCH_TEST_MAIL_TO: 'a@b.c, you@mail.test' };
    eq([' A@B.C ', 'you+location_JP@mail.test', 'YOU+x@MAIL.TEST', 'xa@b.c', 'a@b.cc', 'you@other.test', '@b.c', 'a@b.c, x@y.z', '', null].map((a) => mail.testMailOk(L, a)),
      [true, true, true, false, false, false, false, false, false, false], 'the listed mailboxes only (a +tag before the @ aside)');
    ok(!mail.testMailOk({ MERCH_TEST_MAIL_TO: '' }, 'a@b.c') && !mail.testMailOk({}, 'a@b.c'), 'no list: nobody');
  });
  await T('F9d-m4-token', 'R4-m4: the test Worker takes a checkout, an order button and an unsigned printer hint only with the shared test token (none set: refused); the live Worker never asks; CORS lets the test copy send it', async () => {
    const w = await tw(), none = { 'x-merch-test-token': null }, bad = { 'x-merch-test-token': TEST_TOKEN.slice(0, -1) + 'X' };
    const q = await w.quote([mug(0)]); ok(q.status === 200, 'a quote needs no token');
    const body = (n) => ({ country: 'US', lines: [mug(0)], expect_total: q.json.total, art_ver: PP.ART_VER, nonce: 'nonce-tok-' + n + '-abcdef', agree: true, lang: 'en' });
    eq([(await w.call('POST', '/merch/checkout', body(1), none)).status, (await w.call('POST', '/merch/checkout', body(2), bad)).json.error], [403, 'test_only'], 'no token, a wrong token: refused');
    const k = await w.call('POST', '/merch/checkout', body(3)); ok(k.status === 200, 'with the token ' + k.text);
    const id = k.json.order; await w.pay(id);
    eq((await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' }, none)).status, 403, 'the cancel button needs it too');
    ok((await w.call('GET', '/merch/order/' + id, null, none)).status === 200, 'reading the order page does not');
    const h = w.pf.hook({ id: 1, external_id: 'mo_' + 'Z'.repeat(22), status: 'draft', shipments: [] }, 'order_updated', 'e1'); // an order we don't know: 200
    eq([(await w.phook(h, none, { unsigned: true })).status, (await w.phook(h, {}, { unsigned: true })).status], [401, 200], 'an unsigned hint: only with the token');
    eq((await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' })).status, 200, 'the cancel with the token');
    const w2 = await tw({ MERCH_TEST_TOKEN: undefined }), q2 = await w2.quote([mug(0)]);
    eq((await w2.call('POST', '/merch/checkout', Object.assign(body(4), { expect_total: q2.json.total }), { 'x-merch-test-token': TEST_TOKEN })).status, 403, 'no token set on the test Worker: refused');
    const lw = await world({ env: { MERCH_TEST_TOKEN: undefined } }); const q3 = await lw.quote([mug(0)]);
    eq((await lw.call('POST', '/merch/checkout', Object.assign(body(5), { expect_total: q3.json.total }))).status, 200, 'the live Worker: no token asked');
    ok(/X-Merch-Test-Token/.test(corsFor('https://test.doodledoggo.app', { MERCH_TEST: '1' })['Access-Control-Allow-Headers']) && !/Token/.test(corsFor('https://doodledoggo.app', {})['Access-Control-Allow-Headers']), 'CORS: only the test Worker');
  });

  // ---- R4-m4 and R4-m5: the build's token, and the folder it wipes
  const build = (out, more) => spawnSync(process.execPath, [path.join(ROOT, 'tools', 'merch_test_build.mjs'), '--out', out, '--no-bundle'], { encoding: 'utf8', env: Object.assign({}, process.env, { MERCH_TEST_PRINTER: '', MERCH_TEST_NAME: '', MERCH_TEST_TOKEN: '' }, more || {}) });
  await T('F9d-m4-build', 'R4-m4: the build puts a random test token in the variables and in test_cfg.json (never printed); a rebuild of the same folder keeps it; MERCH_TEST_TOKEN gives it', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-f9d-'));
    try {
      const out = path.join(tmp, 'b'), r = build(out); ok(r.status === 0, r.stderr);
      const tok = JSON.parse(fs.readFileSync(path.join(out, 'test_cfg.json'), 'utf8')).token, vars = JSON.parse(fs.readFileSync(path.join(out, 'vars.json'), 'utf8'));
      ok(/^[A-Za-z0-9_-]{43}$/.test(tok) && vars.MERCH_TEST_TOKEN === tok, 'the same random token in both');
      ok(JSON.parse(fs.readFileSync(path.join(out, 'meta.json'), 'utf8')).bindings.some((b) => b.name === 'MERCH_TEST_TOKEN' && b.type === 'plain_text'), 'sent as a plain variable of the test Worker');
      ok(!r.stdout.includes(tok) && /MERCH_TEST_TOKEN=<new, in test_cfg.json>/.test(r.stdout), 'never printed');
      const r2 = build(out); ok(r2.status === 0 && JSON.parse(fs.readFileSync(path.join(out, 'test_cfg.json'), 'utf8')).token === tok && /<kept,/.test(r2.stdout), 'kept on a rebuild');
      const given = 'given_token_0123456789abcdefghijklmnopqrstuvwxyz';
      const r3 = build(path.join(tmp, 'c'), { MERCH_TEST_TOKEN: given }); ok(r3.status === 0 && JSON.parse(fs.readFileSync(path.join(tmp, 'c', 'vars.json'), 'utf8')).MERCH_TEST_TOKEN === given, 'given');
      const r4 = build(path.join(tmp, 'd'), { MERCH_TEST_TOKEN: 'short' }); ok(r4.status === 2 && /MERCH_TEST_TOKEN/.test(r4.stderr), 'a short token refused');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });
  await T('F9d-m5-wipe', 'R4-m5: --out is wiped only when the build made it (its marker) or it is empty or new; a folder with other files, or a file, is refused and left as it was', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-f9d5-'));
    try {
      const mine = path.join(tmp, 'home'); fs.mkdirSync(mine); fs.writeFileSync(path.join(mine, 'notes.txt'), 'keep me');
      const r = build(mine); ok(r.status === 2 && /not empty and was not made by this build/.test(r.stderr), 'refused: ' + r.stderr);
      eq(fs.readdirSync(mine), ['notes.txt'], 'left as it was');
      const file = path.join(tmp, 'file'); fs.writeFileSync(file, 'x'); ok(build(file).status === 2 && fs.readFileSync(file, 'utf8') === 'x', 'a file: refused, kept');
      const empty = path.join(tmp, 'empty'); fs.mkdirSync(empty); ok(build(empty).status === 0 && fs.existsSync(path.join(empty, '.merch_test_build')), 'an empty folder: built, marked');
      fs.writeFileSync(path.join(empty, 'stale.txt'), 'old'); ok(build(empty).status === 0 && !fs.existsSync(path.join(empty, 'stale.txt')), 'its own folder: wiped and built again');
      ok(build(path.join(tmp, 'new', 'deep')).status === 0, 'a new folder');
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });

  // ---- not counted: run 1's stand-in drafts in run 2
  await T('F9d-standin', 'stand-in drafts (run 1) in run 2: the draft records which printer made it; with a real key set, it is never deleted or read at real Printful (no call), only forgotten here', async () => {
    const w = await world({ env: { MERCH_TEST: '1', MERCH_PROVIDER_MODE: 'draft', MERCH_PROVIDER_KEY: PRINTER_KEY, MERCH_PROVIDER_WEBHOOK_SECRET: undefined } });
    const S = standIn(w.clock); w.env.PROVIDER_FETCH = S.fetch;
    const id = await w.drafted([mug(0)]); eq(w.order(id).provider, 'stand-in', 'made by the stand-in');
    const real = []; w.env.MERCH_PROVIDER_KEY = 'pf_real_key_dummy'; w.env.PROVIDER_FETCH = async (u, i) => { real.push(i.method + ' ' + u); return new Response('{}', { status: 500 }); };
    const r = await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'order' }); ok(r.status === 200, r.text); await w.advance(HOUR);
    eq([w.order(id).status, w.order(id).provider_order, w.order(id).draft_del, real], ['cancelled', null, 0, []], 'cancelled; nothing sent to Printful');
    ok(w.q("select id from merch_events where type = 'stand_in_draft'").length === 1, 'the ledger notes it');
    w.env.MERCH_PROVIDER_KEY = 'pf-test-key'; w.env.PROVIDER_FETCH = w.pf.fetch;
    const p = await w.drafted([mug(1)]); eq(w.order(p).provider, 'printful', 'a draft made with a real key says printful');
  });
}
