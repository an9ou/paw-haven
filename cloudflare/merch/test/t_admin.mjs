// Stage 4: the admin routes, tools/merch.sh (dry run), privacy (section 5) and the order page.
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { T, ok, eq, world, mug, tee, PP, ROOT, MIN, HOUR, DAY } from './harness.mjs';

export async function admin() {
  console.log('--- stage 4: admin routes, merch.sh, privacy');
  await T('X-admin-auth', 'admin routes: Bearer MERCH_ADMIN_KEY; unset or short key: always 401', async () => {
    const w = await world();
    for (const k of [null, 'Bearer wrong', 'admin-key-for-tests-0123']) { const r = await w.call('GET', '/merch/admin/report', null, k ? { authorization: k } : {}); ok(r.status === 401, 'refused: ' + k); }
    ok((await w.admin('GET', 'report')).status === 200, 'the right key');
    const w2 = await world({ env: { MERCH_ADMIN_KEY: undefined } }); ok((await w2.call('GET', '/merch/admin/report', null, { authorization: 'Bearer undefined' })).status === 401, 'no key set: 401');
    const w3 = await world({ env: { MERCH_ADMIN_KEY: 'short' } }); ok((await w3.call('GET', '/merch/admin/report', null, { authorization: 'Bearer short' })).status === 401, 'a key under 16 characters is never accepted');
    ok((await w.admin('GET', 'nothing')).status === 404 && (await w.admin('GET', 'order/mo_AAAAAAAAAAAAAAAAAAAAAA')).status === 404, '404s');
  });
  await T('X-admin-list-show', 'list and show: orders by status and hold; show has lines, parcels, refunds, events, signed print links; no email hash', async () => {
    const w = await world(); const a = await w.drafted([mug(0)]); await w.newOrder([mug(1)]);
    const l = await w.admin('GET', 'orders?status=paid'); ok(l.json.orders.length === 1 && l.json.orders[0].id === a, 'by status');
    ok((await w.admin('GET', 'orders')).json.orders.length === 2, 'all');
    const s = await w.admin('GET', 'order/' + a); ok(s.json.lines[0].file_url && s.json.events.length && !('email_hash' in s.json.order) && !('checkout_url' in s.json.order), 'show');
    const got = await w.raw('GET', s.json.lines[0].file_url.replace('https://merch-api.doodledoggo.app', '')); ok(got.status === 200, 'the signed link works');
  });
  await T('X-admin-export', 'export: JSON lines in a date range with no buyer data (no email hash, dog name, recipe, links)', async () => {
    const w = await world(); const a = await w.confirmedOrder([tee(0)]); await w.admin('POST', 'order/' + a + '/refund', { line: 1, reason: 'test' });
    const r = await w.raw('GET', '/merch/admin/export?from=2026-11-01&to=2027-01-01', null, { authorization: 'Bearer ' + w.env.MERCH_ADMIN_KEY }); const t = await r.text();
    ok(r.status === 200 && r.headers.get('content-type') === 'application/x-ndjson', 'ndjson'); const rows = t.trim().split('\n').map((x) => JSON.parse(x));
    ok(rows.length === 1 && rows[0].lines.length === 1 && rows[0].refunds.length === 1 && rows[0].total === 3198, 'the order with lines and refunds');
    ok(!/email_hash|Mochi|recipe|print_link|checkout_url|example\.test|Example Street/.test(t), 'no buyer data: ' + t.slice(0, 200));
    const none = await w.raw('GET', '/merch/admin/export?from=2027-01-01&to=2027-02-01', null, { authorization: 'Bearer ' + w.env.MERCH_ADMIN_KEY }); ok((await none.text()) === '', 'empty range');
  });
  await T('X-admin-flag-report', 'flag (block, allow, clear; raw email or IP hashed server side) and the report', async () => {
    const w = await world();
    for (const b of [{ key: 'e:nothex', mode: 'block' }, { key: 'email:a@b.c', mode: 'ban' }, {}]) ok((await w.admin('POST', 'flag', b)).status === 400, 'bad flag ' + JSON.stringify(b));
    const f = await w.admin('POST', 'flag', { key: 'email:Someone@Example.test', mode: 'block' }); ok(/^e:[0-9a-f]{64}$/.test(f.json.key) && !JSON.stringify(w.q('select * from merch_flags')).includes('xample'), 'hashed');
    await w.admin('POST', 'flag', { key: f.json.key, mode: 'clear' }); ok(!w.q('select * from merch_flags').length, 'cleared');
    const r = await w.admin('GET', 'report'); ok(r.status === 200 && Array.isArray(r.json.held) && r.json.storage && Array.isArray(r.json.sales_12m), 'report');
  });
  await T('X-privacy', 'no address or email is ever stored or returned by GET /merch/order/:id (section 5); the page has what the buyer needs', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(4)]); w.pf.ship(w.order(id).provider_order, [id + '_1']); await w.phook(w.pf.hook(w.pfOrder(id), 'package_shipped', 'pv1'));
    const p = await w.call('GET', '/merch/order/' + id); const t = p.text;
    ok(!/buyer@example|Example Street|Exampleton|Pat Example|email|PC-4242/.test(t), 'no buyer data on the page: ' + t.slice(0, 300));
    eq(Object.keys(p.json).sort(), ['can_cancel', 'cancel_until', 'country', 'dispute', 'gift_code', 'gift_name', 'hold', 'id', 'late', 'lines', 'paid_at', 'parcels', 'pay_pending', 'pres', 'status', 'totals'].sort(), 'fields');
    ok(p.json.lines[1].name === "D'Artagnan" && p.json.lines[0].name === null && p.json.parcels.length === 1, 'the dog’s name only where printed');
    const all = JSON.stringify([w.q('select * from merch_orders'), w.q('select * from merch_order_items'), w.q('select * from merch_events'), w.q('select * from merch_refunds'), w.q('select * from merch_parcels'), w.q('select * from merch_meta'), w.q('select * from merch_outbox')]);
    ok(!/buyer@example|Example Street|Exampleton|Pat Example|PC-4242/.test(all), 'nothing about the buyer in any table but the email HMAC');
  });
  await T('X-time-travel', 'time travel for the cooling hour: can_cancel until cancel_until + 120 s, the confirm alarm at exactly that time', async () => {
    const w = await world(); const id = await w.drafted([mug(0)]); const cu = w.order(id).cancel_until;
    await w.advance(cu - w.clock.t + 119e3); ok((await w.call('GET', '/merch/order/' + id)).json.can_cancel === true, 'can cancel at +1:59');
    await w.advance(1e3); const p = (await w.call('GET', '/merch/order/' + id)).json; ok(p.can_cancel === false && p.status === 'confirmed', 'at +2:00 the confirm ran: ' + p.status);
  });
  await T('X-merch-sh', 'tools/merch.sh prints what it would do by default; never prints the key; checks its arguments', async () => {
    const sh = path.join(ROOT, 'tools', 'merch.sh'), run = (args, env) => execFileSync('bash', [sh, ...args], { env: Object.assign({ PATH: process.env.PATH }, env || {}), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    let o = run(['refund', 'mo_AAAAAAAAAAAAAAAAAAAAAA', '2', '1', 'arrived "cracked"'], { MERCH_ADMIN_KEY: 'super-secret-key-123' });
    ok(/DRY RUN/.test(o) && /POST https:\/\/merch-api.doodledoggo.app\/merch\/admin\/order\/mo_AAAAAAAAAAAAAAAAAAAAAA\/refund/.test(o) && o.includes('{"line": 2, "qty": 1, "reason": "arrived \\"cracked\\""}') && !o.includes('super-secret'), o);
    JSON.parse(o.match(/body: (.*)/)[1]); o = run(['reprint', 'mo_AAAAAAAAAAAAAAAAAAAAAA', '1,2', '777']); ok(o.includes('{"lines": [1,2], "provider_order": "777"}') && /NOT set/.test(o), o);
    o = run(['list', 'held', 'review']); ok(o.includes('orders?status=held&hold=review'), o); o = run(['export', '2026-12-01', '2027-01-01']); ok(o.includes('merch-export-2026-12-01-2027-01-01.jsonl'), o);
    o = run(['help']); ok(/merch console/.test(o) && /refund <order>/.test(o), 'help');
    let threw = 0; for (const a of [['show', 'nope'], ['refund', 'mo_AAAAAAAAAAAAAAAAAAAAAA', 'x', 'why'], ['bogus']]) { try { run(a); } catch (e) { threw++; } } ok(threw === 3, 'bad arguments exit 2');
    try { run(['report'], { DRY_RUN: '0' }); ok(false, 'should need the key'); } catch (e) { ok(/MERCH_ADMIN_KEY is not set/.test(String(e.stderr)), 'DRY_RUN=0 without a key refuses'); }
  });
}
