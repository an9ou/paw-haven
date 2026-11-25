// Part 6: the email texts, the order link, the thank-you gift (docs/design/merch/PART6.md). Row ids P6-*.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { T, ok, eq, world, mug, tee, R, ROOT, MIN, HOUR, DAY } from './harness.mjs';
import * as mail from '../mail.js';

const shipHint = async (w, id) => w.phook(w.pf.hook(w.pfOrder(id), 'package_shipped', 'evt_' + Math.random()));
const SITE = 'https://doodledoggo.app';
const BUYER = /buyer@example|Example Street|Exampleton|Pat Example|PC-4242|9 New Lane/;
const BANNED = [/buy now/i, /\bbuy\b/i, /\bsell(?!er\b)/i, /printful/i, /\bAI\b|language model|Claude/, /\p{Extended_Pictographic}/u, /!!/, /hurry|only \d+ left|last chance|act now/i];
const sh = (args, env, input) => execFileSync('bash', [path.join(ROOT, 'tools', 'merch.sh'), ...args], { env: Object.assign({ PATH: process.env.PATH }, env || {}), encoding: 'utf8', input: input == null ? '' : input, stdio: ['pipe', 'pipe', 'pipe'] });

// every buyer email: a subject, a text and an html body; the facts it needs; nothing it must not have
export function checkMail(m, id, what) {
  const tag = what + ' (' + (m && m.key) + ')';
  ok(m && typeof m.subject === 'string' && m.subject.length > 3 && m.subject.length <= 45, tag + ': a short subject: ' + (m && m.subject));
  ok(typeof m.text === 'string' && m.text.length > 80 && typeof m.html === 'string' && /^<!doctype html>/.test(m.html), tag + ': text and html');
  for (const body of [m.text, m.html]) {
    ok(body.includes(SITE + '/merch/#/order/' + id) && !body.includes('/merch/order/'), tag + ': the order link, one form');
    ok(!BUYER.test(body), tag + ': no buyer address or email');
    const mails = body.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+/g) || []; ok(mails.every((x) => x === 'contact@doodledoggo.app'), tag + ': no email address but ours: ' + mails);
    for (const b of BANNED) ok(!b.test(body.replace(/Doodle Doggo/g, '')), tag + ': no ' + b + ' in ' + body.slice(0, 80));
    ok(body.includes(SITE + '/merch/terms/') && body.includes(SITE + '/merch/shipping/') && body.includes(SITE + '/privacy') && body.includes('Reply to this email or write to contact@doodledoggo.app'), tag + ': the footer links');
    ok(body.includes(id.replace(/^mo_/, '')), tag + ': the order id');
  }
  ok(!/<script|<img|<link|<iframe|<form|\bsrc=|url\(|http:\/\//i.test(m.html), tag + ': no scripts, no remote images, no tracking');
  ok((m.html.match(/href="([^"]+)"/g) || []).every((h) => /^href="https:\/\//.test(h)), tag + ': https links only');
  ok(!/Seller:/.test(m.text), tag + ': no seller line while it is not known');
}
export const one = (w, re) => { const x = w.mails(re); ok(x.length === 1, 'one email ' + re + ': ' + x.length); return x[0]; };
export const addCodes = async (w, codes) => w.admin('POST', 'gift', { codes });

export async function part6() {
  console.log('--- part 6: emails, the order link, the gift');
  await T('P6-mail-kinds', 'every buyer email kind, sent through the outbox from a real flow: subject, text and html, the facts, no buyer data, no banned words', async () => {
    let w = await world(); await addCodes(w, ['TEST-GIFT-0001', 'TEST-GIFT-0002', 'TEST-GIFT-0003']);
    // one mug: Thank you (with the gift), cancelled in the hour
    const a = await w.paidOrder([mug(0)], 'US', { pres: { presentment_amount: 3800, presentment_currency: 'jpy' } });
    const th = one(w, new RegExp('^me_' + a + '_thanks$')); checkMail(th, a, 'thanks');
    ok(/Mug with your dog: \$19\.99/.test(th.text) && /Total: \$24\.98 \(US dollars\)/.test(th.text) && /You paid ¥3,800 at checkout\./.test(th.text), 'thanks: the line, the USD total, what was paid: ' + th.text.slice(0, 300));
    ok(/within 1 hour of paying, from your order page/.test(th.text) && !/\d\d:\d\d/.test(th.text), 'thanks: the cancel hour in words, no clock time');
    ok(!th.text.includes('TEST-GIFT') && !th.html.includes('TEST-GIFT') && /A little thank-you for your dog in the game will be waiting on your order page once printing starts\./.test(th.text), 'thanks: the gift is only promised (review finding 2: shown after the hour)');
    ok(/We’ll post it by Thursday 10 December\./.test(th.text) && /printing usually takes 2 to 5 working days/.test(th.text) && /about 5 to 11 working days to reach you/.test(th.text), 'thanks: the posting date in words, the door-to-door days');
    await w.call('POST', '/merch/order/' + a + '/cancel', { scope: 'order' }); const ca = one(w, new RegExp('^me_' + a + '_cancelled$')); checkMail(ca, a, 'cancelled');
    ok(/refunded all of it, \$24\.98, shipping too/.test(ca.text) && /few days to show on your card/.test(ca.text) && !ca.text.includes('TEST-GIFT'), 'cancelled: the amount');
    ok(w.one('select order_id from merch_gift_pool where code = ?', 'TEST-GIFT-0001').order_id === null && w.order(a).gift_code === null, 'cancelled in the hour: the unseen code is back in the pool');
    // a 6-line basket: Thank you lists all six
    const six = [mug(0), mug(1, { qty: 2 }), tee(4), tee(2, { colour: 'black', size: 'L', name_on: false }), mug(3, { pose: 'sit' }), tee(0, { colour: 'white', size: 'XL', qty: 3, name_on: false })];
    const b = await w.paidOrder(six, 'US'); const tb = one(w, new RegExp('^me_' + b + '_thanks$')); checkMail(tb, b, 'thanks 6');
    ok((tb.text.match(/^- /gm) || []).length === 6 && /2 × Mug with your dog: \$39\.98/.test(tb.text) && /Tee with D'Artagnan, navy, M: \$26\.99/.test(tb.text) && /3 × Tee with your dog, white, XL/.test(tb.text) && /Shipping: Free/.test(tb.text), 'six lines in words: ' + tb.text.slice(0, 400));
    // a parcel, a part refund, a full refund at the end, a reprint, the delay email
    w = await world(); // a fresh world per order below: four paid orders from one email in a day would be held for review (T2.2-52)
    const c = await w.confirmedOrder([mug(0), tee(4)]); const s = w.pf.ship(w.order(c).provider_order, [c + '_1']); await shipHint(w, c);
    const sp = one(w, new RegExp('_ship_' + s.id + '$')); checkMail(sp, c, 'ship');
    ok(sp.text.includes(s.tracking_url) && /Carrier: /.test(sp.text) && /Part of your order is on its way/.test(sp.text) && /- Mug with your dog\n/.test(sp.text) && !/Tee with/.test(sp.text) && /its own parcel/.test(sp.text), 'ship: the parcel, its tracking link, the rest: ' + sp.text.slice(0, 400));
    ok(!sp.text.includes('TEST-GIFT'), 'ship: no gift (the Thank you email had it)');
    await w.advance(w.order(c).ship_by - w.clock.t + MIN); const lt = one(w, new RegExp('^me_' + c + '_late$')); checkMail(lt, c, 'late');
    ok(/Taking longer than we said/.test(lt.subject) && /we said we’d post your order by Thursday 10 December, and part of it hasn’t gone out yet/.test(lt.text) && /We now expect to post the late part by Monday 21 December\./.test(lt.text) && /You don’t need to do anything to keep waiting/.test(lt.text) && /cancel the late part for a full refund from your order page, any time until it’s posted/.test(lt.text) && /Tee with D'Artagnan/.test(lt.text) && !/Mug with/.test(lt.text), 'late: the date we said, the new date, no answer needed, the late part only: ' + lt.text.slice(0, 500));
    const lv = mail.build('late', w.L().mailView({ id: 'me_' + c + '_late', order_id: c, kind: 'late', note: '{}' }), w.env);
    ok(lv.text === lt.text && !/don’t know/.test(lt.text), 'late: built from the order at send time, always with a date');
    await w.call('POST', '/merch/order/' + c + '/cancel', { scope: 'late' });
    const rf = w.mails(new RegExp('^me_' + c + '_refund_')); ok(rf.length === 1, 'the late part: ONE email: ' + rf.length); checkMail(rf[0], c, 'refunded late');
    ok(/We’ve refunded \$26\.99 for part of your order/.test(rf[0].text) && /As you asked, we’ve refunded the part of your order that was running late/.test(rf[0].text) && /Tee with D'Artagnan/.test(rf[0].text), 'refunded: the amount and the line: ' + rf[0].text.slice(0, 300));
    w = await world(); const d = await w.confirmedOrder([mug(0, { qty: 2 }), tee(1)]); w.pf.ship(w.order(d).provider_order, [d + '_1', d + '_2'], { status: 'fulfilled' }); await shipHint(w, d);
    await w.admin('POST', 'order/' + d + '/refund', { line: 1, qty: 1, reason: 'damaged' });
    const p1 = w.mails(new RegExp('^me_' + d + '_refund_mr_')); ok(p1.length === 1, 'one part refund'); checkMail(p1[0], d, 'refunded part');
    ok(/We’ve refunded \$19\.99 for part of your order/.test(p1[0].text) && /- Mug with your dog/.test(p1[0].text) && !/damaged/.test(p1[0].text), 'part refund: the amount, the line, never the owner’s reason');
    await w.admin('POST', 'order/' + d + '/reprint', { lines: [2] }); const rp = one(w, new RegExp('^me_' + d + '_reprint_1$')); checkMail(rp, d, 'reprint');
    ok(/A new one is on its way/.test(rp.subject) && /- Tee with Duke, navy, M/.test(rp.text) && /nothing to pay/.test(rp.text) && !/Mug/.test(rp.text.split('Order:')[0]), 'reprint: the reprinted line: ' + rp.text.slice(0, 300));
    await w.admin('POST', 'order/' + d + '/refund', { line: 1, reason: 'damaged' }); await w.admin('POST', 'order/' + d + '/refund', { line: 101, reason: 'damaged' });
    const all = w.mails(/refund_/).filter((m) => m.key.includes(d) && /in full/.test(m.text)); ok(all.length === 1, 'refunded in full once'); checkMail(all[0], d, 'refunded_all');
    ok(/Your order is refunded/.test(all[0].subject) && new RegExp('in full: \\' + mail.usd(w.order(d).total)).test(all[0].text), 'refunded_all: the whole amount: ' + all[0].text.slice(0, 200));
    // a reject (the render fails twice and resvg too), and the address email (the printer refuses the recipient)
    const x = await world(); x.rd.queue.push('err', 'err', 'err'); const e = await x.paidOrder([mug(0), tee(4)]); await x.advance(1); await x.advance(2 * MIN); // the tee renders, then the one reject email
    const rj = one(x, new RegExp('^me_' + e + '_reject_1$')); checkMail(rj, e, 'reject');
    ok(/couldn’t print one thing/.test(rj.subject) && /- Mug with your dog/.test(rj.text) && /We’ve refunded \$19\.99 for it/.test(rj.text) && /The rest of your order goes on/.test(rj.text), 'reject: the line and its refund');
    const y = await world(); y.pf.refuse.recipient = true; const f = await y.paidOrder([mug(0)]); await y.advance(1);
    const ad = one(y, new RegExp('^me_' + f + '_address$')); checkMail(ad, f, 'address');
    ok(/We need your address/.test(ad.subject) && /type the address again/.test(ad.text) && /we don’t keep it/.test(ad.text) && /7 days/.test(ad.text) && /refund/.test(ad.text), 'address: what to do, the 7 days');
  });
  await T('P6-mail-pure', 'build(kind, view, env) without a network: every kind; the gift only with a code; the seller line only when set; pres; a reship; an unknown kind', async () => {
    const id = 'mo_AAAAAAAAAAAAAAAAAAAAAA', base = { id, status: 'paid', can_cancel: true, ship_by: Date.parse('2026-12-10T00:00:00Z'), eta: [5, 9],
      lines: [{ line: 1, product: 'mug', colour: 'white', name: 'Biscuit', qty: 1, unit: 1999, status: 'shipped', refunded_qty: 0, parcel: 'p1' }, { line: 2, product: 'tee', colour: 'navy', colour_name: 'Navy', size: 'L', name: null, qty: 2, unit: 2699, status: 'confirmed', refunded_qty: 0, parcel: null },
        { line: 101, product: 'tee', colour: 'navy', colour_name: 'Navy', size: 'L', name: null, qty: 1, unit: 2699, status: 'confirmed', refunded_qty: 0, parcel: null, reprint_of: 2, rp: 1 }],
      parcels: [{ id: 'p1', carrier: 'USPS', tracking_url: 'https://track.example/p1' }], totals: { subtotal: 7397, ship_fee: 0, total: 7397, refunded: 0 }, pres: null, gift_code: null };
    for (const k of mail.KINDS) {
      const m = mail.build(k, Object.assign({}, base, { about: { parcel: 'p1', line: 1, refund: { amount: 1999, reason: 'lost', lines: [{ line: 1, qty: 1 }] }, reprint: { n: 1, why: 'lost' } } }), {});
      checkMail(Object.assign({ key: k }, m), id, 'pure ' + k);
      ok(!/gift|thank-you code/i.test(m.text), 'pure ' + k + ': no gift, no mention of one, without a code');
    }
    const g = mail.build('ship', Object.assign({}, base, { gift_code: 'TEST-GIFT-0009', about: { parcel: 'p1', gift: true } }), { MERCH_GIFT_NAME: 'Test Bandana' });
    ok(g.text.includes('TEST-GIFT-0009') && /the Test Bandana, a little gift for your dog in the game/.test(g.text) && /the Test Bandana/.test(g.html), 'the gift name from MERCH_GIFT_NAME');
    ok(/Each code works once\. Got more than one\? Pass the extra to a friend who plays\./.test(g.text) && !/Each game account can use one/.test(g.text), 'finding 7: the softened sentence');
    for (const k of ['thanks', 'cancelled', 'refunded', 'refunded_all', 'reject', 'address']) ok(!mail.build(k, Object.assign({}, base, { gift_code: 'TEST-GIFT-0009', about: { gift: true, parcel: 'p1' } }), {}).text.includes('TEST-GIFT-0009'), k + ': never carries the code');
    ok(!mail.build('ship', Object.assign({}, base, { gift_code: 'TEST-GIFT-0009', about: { parcel: 'p1' } }), {}).text.includes('TEST-GIFT'), 'ship: the code only in the one email that carries it');
    ok(/will be waiting on your order page once printing starts/.test(mail.build('thanks', Object.assign({}, base, { gift: 'soon' }), {}).text) && !/thank-you for your dog/.test(mail.build('thanks', base, {}).text), 'thanks: the gift promised only when one is reserved');
    const s = mail.build('ship', Object.assign({}, base, { about: { parcel: 'p1', gift: true }, gift_code: 'TEST-GIFT-0009' }), { MERCH_SELLER_NAME: 'Example Seller (test)', MERCH_SELLER_ADDR: '1 Test Road, Testville' });
    ok(/Seller: Example Seller \(test\), 1 Test Road, Testville\./.test(s.text) && /Seller: Example Seller/.test(s.html) && s.text.includes('TEST-GIFT-0009'), 'the seller line when set; a late gift on the ship email');
    const p = mail.build('thanks', Object.assign({}, base, { pres: { currency: 'eur', amount: 6912 } }), {}); ok(/You paid €69\.12 at checkout\./.test(p.text), 'pres in its own currency');
    const k3 = mail.presMoney({ currency: 'kwd', amount: 22650 }), j = mail.presMoney({ currency: 'krw', amount: 98000 }); ok(/22\.650/.test(k3) && /98,000/.test(j) && !/\./.test(j), 'zero- and three-decimal currencies: ' + k3 + ' ' + j);
    const late = mail.build('thanks', Object.assign({}, base, { can_cancel: false }), {}); ok(!/within 1 hour/.test(late.text), 'after the hour, the Thank you email (a retry) does not offer the cancel');
    const rs = mail.build('address', Object.assign({}, base, { about: { reship: true, reship_lines: [1] } }), {}); ok(/came back to our print partner/.test(rs.text) && /- Mug with Biscuit\n/.test(rs.text) && !/Tee with/.test(rs.text) && /refund those things/.test(rs.text), 'a reship: the parcel’s lines');
    const ev = mail.build('ship', Object.assign({}, base, { lines: [{ line: 1, product: 'mug', name: '<b>Bo</b>', qty: 1, parcel: 'p1', status: 'shipped' }], parcels: [{ id: 'p1', carrier: '<i>X</i>', tracking_url: 'javascript:alert(1)' }], about: { parcel: 'p1' } }), {});
    ok(!/<b>Bo|<i>X|javascript:/.test(ev.html) && /&lt;b&gt;Bo/.test(ev.html) && !/javascript:/.test(ev.text), 'everything escaped; a tracking link that is not https is left out');
    const u = mail.build('nonsense', base, {}); ok(u.subject && u.text.includes(SITE + '/merch/#/order/' + id), 'an unknown kind: a plain note, never blank');
    const t2 = mail.build('thanks', base, { MERCH_SITE: 'https://test.doodledoggo.app/' }); ok(t2.text.includes('https://test.doodledoggo.app/merch/#/order/' + id) && t2.text.includes('https://test.doodledoggo.app/merch/terms/'), 'MERCH_SITE (the test copy) in every link');
  });
  await T('P6-order-link', 'the order link is <MERCH_SITE>/merch/#/order/<id> everywhere: Stripe success_url /merch/?new=1#/order/<id>, emails, owner emails', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]);
    const c = w.stripe.calls.find((x) => x.m === 'POST' && x.path === '/v1/checkout/sessions');
    eq([c.body.success_url, c.body.cancel_url], [SITE + '/merch/?new=1#/order/' + id, SITE + '/merch/?back=' + id], 'Stripe urls');
    const t = await world({ env: { MERCH_SITE: 'https://test.doodledoggo.app' } }); const id2 = await t.newOrder([mug(0)]);
    ok(t.stripe.calls.find((x) => x.path === '/v1/checkout/sessions').body.success_url === 'https://test.doodledoggo.app/merch/?new=1#/order/' + id2, 'the test copy');
    const o = mail.ownerBuild(w.env, id, 'review', 'Held for review: blocked');
    ok(o.text.includes(SITE + '/merch/#/order/' + id) && /tools\/merch\.sh confirm mo_/.test(o.text) && /\[review\]/.test(o.subject) && o.subject.includes(id) && /What happened: /.test(o.text) && /What to do: /.test(o.text), 'owner: what happened, what to do, the command');
  });
  await T('P6-owner-mail', 'owner emails: tidy subject and body, no buyer data; the nightly report in words with the gift count, never a code', async () => {
    const w = await world(); await addCodes(w, ['TEST-GIFT-0101', 'TEST-GIFT-0102']);
    await w.admin('POST', 'flag', { key: 'email:buyer@example.test', mode: 'block' }); const id = await w.paidOrder([mug(0)]);
    const m = w.owner(/review/); ok(m.length === 1 && m[0].subject.includes(id) && /Details: Held for review: blocked/.test(m[0].text) && !BUYER.test(m[0].text + m[0].subject), 'review: tidy, no buyer data');
    w.clock.t = Date.parse('2026-12-02T05:00:00+09:00'); await w.cron(); const r = w.owner(/report/);
    ok(r.length === 1 && /Gift codes: 2 left, 0 given/.test(r[0].text) && /Held: mo_/.test(r[0].text) && !/TEST-GIFT/.test(r[0].text) && !/^\{/.test(r[0].text.split('Details: ')[1] || ''), 'the report in words: ' + r[0].text.slice(0, 300));
    ok(w.owner().every((x) => !BUYER.test(x.text + x.subject) && !/TEST-GIFT-\d/.test(x.text + x.subject) && !x.html), 'no owner email has buyer data, a gift code or an html part');
  });
  await T('P6-gift-pool', 'the gift: reserved when paid (hidden: gift soon), shown once the cancel hour is over and carried by the first On its way only; held then released; empty pool: no gift, no mention; a cancel in the hour puts it back', async () => {
    const w = await world(); const n = await w.paidOrder([mug(0)]);
    ok(w.order(n).gift_code === null && !/gift|thank-you for your dog/i.test(one(w, new RegExp('^me_' + n + '_thanks$')).text) && !w.owner(/gift/).length, 'empty pool: no gift, no mention, no owner email');
    let pj = (await w.call('GET', '/merch/order/' + n)).json; ok(pj.gift === null && pj.gift_code === null && pj.gift_name === null, 'the page: no gift');
    await addCodes(w, ['TEST-GIFT-0201', 'TEST-GIFT-0202', 'TEST-GIFT-0203']);
    const k = await w.paidOrder([mug(2)]);
    pj = (await w.call('GET', '/merch/order/' + k)).json;
    ok(w.order(k).gift_code === 'TEST-GIFT-0201' && pj.gift === 'soon' && pj.gift_code === null && pj.gift_name === null && !JSON.stringify(pj).includes('TEST-GIFT'), 'reserved at payment, hidden from the page');
    const th = one(w, new RegExp('^me_' + k + '_thanks$')); ok(!th.text.includes('TEST-GIFT') && /will be waiting on your order page once printing starts/.test(th.text), 'the Thank you email promises it, without the code');
    await w.advance(w.order(k).cancel_until + 120e3 - w.clock.t - 1); ok(!w.order(k).gift_shown_at && (await w.call('GET', '/merch/order/' + k)).json.gift === 'soon', 'still hidden one ms before the hour (and its grace) ends');
    await w.advance(2); pj = (await w.call('GET', '/merch/order/' + k)).json;
    ok(w.order(k).status === 'confirmed' && pj.gift === 'ready' && pj.gift_code === 'TEST-GIFT-0201', 'shown in the step that ends the hour (the confirm): ' + w.order(k).status);
    await w.call('POST', '/merch/order/' + k + '/cancel', { scope: 'order' }); ok(w.order(k).status === 'confirmed', 'too late to cancel');
    const s1 = w.pf.ship(w.order(k).provider_order, [k + '_1'], { status: 'fulfilled' }); await shipHint(w, k);
    ok(one(w, new RegExp('_ship_' + s1.id + '$')).text.includes('TEST-GIFT-0201') && w.order(k).gift_mailed === 'me_' + k + '_ship_' + s1.id, 'the first On its way email carries it');
    await w.admin('POST', 'order/' + k + '/reprint', { lines: [1] }); await w.advance(MIN);
    ok(!one(w, new RegExp('^me_' + k + '_reprint_1$')).text.includes('TEST-GIFT'), 'a later email does not carry it again');
    // held at payment: nothing reserved; released by the owner inside the hour: reserved then, shown when the hour ends
    await w.admin('POST', 'flag', { key: 'email:held@example.test', mode: 'block' });
    const h = await w.newOrder([mug(1)]); await w.pay(h, { email: 'held@example.test' });
    eq([w.order(h).status, w.order(h).hold, w.order(h).gift_code], ['held', 'review', null], 'held at payment: no gift yet');
    w.clock.t += 5 * MIN; ok((await w.admin('POST', 'order/' + h + '/confirm')).status === 200 && w.order(h).gift_code === 'TEST-GIFT-0202' && !w.order(h).gift_shown_at, 'released inside the hour: reserved, not shown');
    await w.advance(2 * HOUR); ok(w.order(h).status === 'confirmed' && w.order(h).gift_shown_at && (await w.call('GET', '/merch/order/' + h)).json.gift_code === 'TEST-GIFT-0202', 'shown once its hour is over');
    const s = w.pf.ship(w.order(h).provider_order, [h + '_1'], { status: 'fulfilled' }); await shipHint(w, h);
    ok(one(w, new RegExp('_ship_' + s.id + '$')).text.includes('TEST-GIFT-0202'), 'its first On its way email carries it');
    // a cancel in the hour: the code goes back to the pool and the next order gets it
    const c = await w.paidOrder([mug(3)]); ok(w.order(c).gift_code === 'TEST-GIFT-0203', 'the next order, the next code');
    await w.call('POST', '/merch/order/' + c + '/cancel', { scope: 'order' }); eq([w.order(c).status, w.order(c).gift_code], ['cancelled', null], 'cancelled in the hour: no code kept');
    ok(w.one('select order_id from merch_gift_pool where code = ?', 'TEST-GIFT-0203').order_id === null, 'back in the pool');
    const d = await w.paidOrder([mug(4)], 'US', { email: 'other@example.test' }); ok(w.order(d).gift_code === 'TEST-GIFT-0203', 'given to the next order');
    const where = JSON.stringify([w.q('select * from merch_events'), w.q('select * from merch_outbox'), w.q('select * from merch_meta'), (await w.admin('GET', 'report')).json, (await w.admin('GET', 'order/' + k)).json]);
    ok(!/TEST-GIFT/.test(where), 'no code in events, the outbox, meta, the report or the admin show');
    const ex = await w.raw('GET', '/merch/admin/export?from=2026-11-01&to=2027-01-01', null, { authorization: 'Bearer ' + w.env.MERCH_ADMIN_KEY }); ok(!/TEST-GIFT/.test(await ex.text()), 'no code in the export');
    // a dispute before completed: no gift
    const q = await world(); await addCodes(q, ['TEST-GIFT-0301']); const dq = await q.newOrder([mug(0)]); q.stripe.pay(q.sid(dq));
    await q.hook('charge.dispute.created', { id: 'dp_1', payment_intent: q.stripe.sessions.get(q.sid(dq)).payment_intent }); ok(q.order(dq).hold === 'dispute' && !q.order(dq).gift_code, 'a dispute first: no gift');
  });
  await T('P6-gift-low', 'the pool: one owner email a day under 10 left, and when it is empty; the nightly report counts', async () => {
    const w = await world(); const codes = Array.from({ length: 11 }, (_, i) => 'TEST-GIFT-' + String(i + 1).padStart(4, '0')); await addCodes(w, codes);
    let n = 0; const pay = () => w.paidOrder([mug(n % 8)], 'US', { email: 'b' + (++n) + '@example.test' }); // one email each: no "4th order in a day" hold
    await pay(); ok(!w.owner(/gift/).length, '10 left: no email');
    await pay(); await pay(); ok(w.owner(/gift_low/).length === 1 && /9 codes left/.test(w.owner(/gift_low/)[0].text) && /tools\/merch\.sh gift add/.test(w.owner(/gift_low/)[0].text), 'under 10: one email today');
    w.clock.t = Date.parse('2026-12-02T05:00:00+09:00'); await w.cron(); ok(w.owner(/gift_low/).length === 2, 'the next day, once more (the nightly job)');
    const rep = (await w.admin('GET', 'report')).json; eq(rep.gift, { left: 8, claimed: 3 }, 'the report counts');
    for (let i = 0; i < 8; i++) await pay();
    ok(w.owner(/gift_empty/).length === 1 && /no gift/.test(w.owner(/gift_empty/)[0].text), 'empty: one email');
    const z = await pay(); ok(w.order(z).status === 'paid' && w.order(z).gift_code === null && w.owner(/gift_empty/).length === 1, 'an order after it: no gift, no error, no second email that day');
  });
  await T('P6-gift-admin', 'admin gift: Bearer key; add validates, deduplicates, never echoes a code (counts only); count; merch.sh gift add reads STDIN and never prints a code', async () => {
    const w = await world();
    ok((await w.call('POST', '/merch/admin/gift', { codes: ['TEST-GIFT-0001'] })).status === 401 && (await w.call('GET', '/merch/admin/gift')).status === 401, 'no key: 401');
    const r = await addCodes(w, ['TEST-GIFT-0001', 'test-gift-0002', ' TEST-GIFT-0001 ', 'not a code!', 'ab', 7, 'TEST-GIFT-0003']);
    eq(r.json, { added: 3, skipped: 4, left: 3 }, 'counts only'); ok(!/TEST-GIFT/i.test(r.text), 'no code echoed');
    eq(w.q('select code from merch_gift_pool order by rowid').map((x) => x.code), ['TEST-GIFT-0001', 'TEST-GIFT-0002', 'TEST-GIFT-0003'], 'upper case, once each');
    ok((await addCodes(w, [])).status === 400 && (await w.admin('POST', 'gift', { codes: 'TEST-GIFT-0004' })).status === 400 && (await addCodes(w, Array(2001).fill('TEST-GIFT-0005'))).status === 400, 'bad bodies: 400');
    const c = await w.admin('GET', 'gift'); eq(c.json, { left: 3, claimed: 0 }, 'count'); ok(Object.keys(c.json).sort().join() === 'claimed,left', 'only counts');
    const out = sh(['gift', 'add'], { MERCH_ADMIN_KEY: 'super-secret-key-123' }, 'TEST-GIFT-0101\n test-gift-0102 \n\nnot a code\nTEST-GIFT-0101\n');
    ok(/DRY RUN/.test(out) && /POST https:\/\/merch-api\.doodledoggo\.app\/merch\/admin\/gift/.test(out) && /2 codes/.test(out) && /1 line(s)? skipped/.test(out) && !/TEST-GIFT/i.test(out) && !out.includes('super-secret'), 'merch.sh gift add (dry run): counts, no codes, no key: ' + out);
    ok(/GET https:\/\/merch-api\.doodledoggo\.app\/merch\/admin\/gift/.test(sh(['gift', 'count'])), 'merch.sh gift count');
    let threw = 0; try { sh(['gift', 'add', 'TEST-GIFT-0001']); } catch (e) { threw++; ok(/STDIN/.test(String(e.stderr)) && !/TEST-GIFT/.test(String(e.stderr)), 'refuses a code as an argument'); } ok(threw === 1, 'an argument is refused');
    try { sh(['gift', 'add'], {}, '\n\n'); ok(false, 'no codes'); } catch (e) { ok(/no codes/.test(String(e.stderr)), 'nothing on STDIN: refused'); }
  });
  await T('P6-gift-release', 'held at payment as the 4th order of a day (T2.2-52), released after 24 h: the gift then', async () => {
    const w = await world(); await addCodes(w, ['TEST-GIFT-0401', 'TEST-GIFT-0402', 'TEST-GIFT-0403', 'TEST-GIFT-0404']);
    const ids = []; for (let i = 0; i < 4; i++) ids.push(await w.paidOrder([mug(i)], 'US', { email: 'gifts@example.test' }));
    eq(ids.map((i) => w.order(i).gift_code), ['TEST-GIFT-0401', 'TEST-GIFT-0402', 'TEST-GIFT-0403', null], 'three paid with a gift, the 4th held without');
    await w.advance(DAY + MIN); ok(w.order(ids[3]).status !== 'held' && w.order(ids[3]).gift_code === 'TEST-GIFT-0404', 'released after 24 h: its gift: ' + w.order(ids[3]).status);
  });
  await T('P6-reject-last', 'part 3 fix: an order whose only line cannot be printed gets one "refunded in full" email (before: none)', async () => {
    const w = await world(); w.rd.queue.push('err', 'err', 'err'); const id = await w.paidOrder([mug(0)]); await w.advance(1); await w.advance(MIN);
    eq([w.lines(id)[0].status, w.order(id).status], ['rejected', 'refunded'], 'rejected, refunded');
    const m = w.mails(new RegExp('^me_' + id + '_refund_')); ok(m.length === 1 && /couldn’t get your order ready to print/.test(m[0].text) && /in full: \$24\.98/.test(m[0].text), 'one email: ' + (m[0] && m[0].text.slice(0, 200)));
    checkMail(m[0], id, 'refunded_all render'); ok(!w.mails(/^me_.*_reject_/).length, 'no "one thing" email for the only thing');
  });
  await T('P6-outbox', 'the outbox still sends once per key; a row from before part 6 (no note) still sends with its facts', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(4)]); const s = w.pf.ship(w.order(id).provider_order, [id + '_1']); await shipHint(w, id);
    w.L().fx.push({ t: 'mail', id: 'me_' + id + '_thanks' }); await w.L().flush(); await w.advance(HOUR);
    ok(w.mails(/_thanks$/).length === 1 && w.mails(/_ship_/).length === 1, 'once per key');
    // an old row: written the part 3 way (no note), with a key that says what it is about
    w.L().run("insert into merch_outbox (id, order_id, who, kind, status, tries, next_try_at, created_at) values (?, ?, 'buyer', 'ship', 'queued', 0, ?, ?)", 'me_' + id + '_ship_' + s.id + 'X', id, w.clock.t, w.clock.t);
    w.L().run("insert into merch_parcels (id, order_id, product, carrier, tracking_url, shipped_at) values (?, ?, 'mug', 'Old Post', 'https://track.example/old', ?)", s.id + 'X', id, w.clock.t);
    w.L().run('update merch_order_items set parcel_id = ? where order_id = ? and line = 2', s.id + 'X', id);
    await w.L().tick(); await w.L().flush(); const old = w.mails(new RegExp('_ship_' + s.id + 'X$')); ok(old.length === 1 && /Old Post/.test(old[0].text) && /track\.example\/old/.test(old[0].text) && /Tee with D'Artagnan/.test(old[0].text), 'the old row sent, its facts read from its key');
  });
}
