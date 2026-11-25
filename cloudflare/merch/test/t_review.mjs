// Stage 4c: each case of the part 3 review (docs/reviews/MERCH_PART3_review.md) as a named test: R-M1..R-M5, R-S1..R-S16, R-N1..R-N9.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { T, ok, eq, world, mug, tee, PP, ROOT, MIN, HOUR, DAY } from './harness.mjs';

const GRACE = 120e3;
const shipHint = async (w, id) => w.phook(w.pf.hook(w.pfOrder(id), 'package_shipped', 'evt_' + Math.random()));
const confirms = (w) => w.pf.calls.filter((c) => /\/confirm$/.test(c.path)).length;
const refunded = (w) => w.stripe.refunds.reduce((a, x) => a + x.amount, 0);
const shipped = async (w, lines) => { const id = await w.confirmedOrder(lines || [mug(0)]); w.pf.ship(w.order(id).provider_order, w.lines(id).map((l) => id + '_' + l.line), { status: 'fulfilled' }); await shipHint(w, id); return id; };
const dash = async (w, id, amount) => { const o = w.order(id); w.stripe.dashRefund(o.payment_intent, amount == null ? o.total : amount); return w.hook('charge.refunded', { id: 'ch_' + Math.random(), payment_intent: o.payment_intent, amount: o.total, refunded: amount == null }); };
const sh = (args, env) => execFileSync('bash', [path.join(ROOT, 'tools', 'merch.sh'), ...args], { env: Object.assign({ PATH: process.env.PATH }, env || {}), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

export async function review() {
  console.log('--- stage 4c: the review cases (R-M*, R-S*, R-N*)');
  await T('R-M1', 'a cancel / refund / dispute during the draft: the draft is deleted, no cost hold over a dispute; merch.sh confirm only from review, draft_mode or a won dispute', async () => {
    const w = await world(); w.pf.costMul = 1.4; let id; w.pf.after.create = async () => { w.pf.after.create = null; await w.hook('charge.dispute.created', { id: 'dp_m1', payment_intent: w.order(id).payment_intent }); };
    id = await w.paidOrder([tee(0)]); await w.advance(30e3);
    eq([w.order(id).status, w.order(id).hold, w.order(id).why], ['held', 'dispute', null], 'the dispute hold is not overwritten by a cost review');
    ok(Array.from(w.pf.orders.values())[0].deleted && !w.order(id).provider_order, 'the draft is deleted');
    ok((await w.admin('POST', 'order/' + id + '/confirm', {})).status === 409, 'confirm refused while the dispute is open');
    const c = await world(); const ci = await c.drafted([mug(0)]); await c.call('POST', '/merch/order/' + ci + '/cancel', {}); ok((await c.admin('POST', 'order/' + ci + '/confirm', {})).status === 409, 'never a cancelled order');
    const p = await world(); p.pf.fail.create = 99; const pi = await p.paidOrder([mug(0)]); await p.advance(2 * HOUR); eq(p.order(pi).hold, 'provider', 'held provider');
    ok((await p.admin('POST', 'order/' + pi + '/confirm', {})).status === 409, 'not a provider hold either (only review, draft_mode, a won dispute)');
    await w.hook('charge.dispute.closed', { id: 'dp_m1', payment_intent: w.order(id).payment_intent, status: 'won' }); w.pf.costMul = 1; const g = await w.admin('POST', 'order/' + id + '/confirm', {});
    ok(g.status === 200, 'a won dispute: confirm allowed: ' + g.text); await w.advance(2 * HOUR);
    ok(w.order(id).status === 'confirmed' && w.pfOrder(id).external_id === id + '-d1', 'made with a new external id after the deleted draft: ' + w.order(id).status);
  });
  await T('R-M2', 'the step lease: the wake is written BEFORE the outside call; a paid order without a wake shows in the report', async () => {
    const w = await world(); let seen; w.rd.after.shot = async () => { w.rd.after.shot = null; seen = w.order(id); }; const id = await w.paidOrder([mug(0)]); await w.advance(1);
    ok(seen.lease_until > w.clock.t && seen.next_try_at >= w.clock.t + 5 * MIN - 1, 'during the render: a lease and a wake 5 minutes on');
    w.L().run('update merch_orders set next_try_at = null where id = ?', id); ok(w.L().report().stranded.some((r) => r.id === id), 'a paid order with no wake is in the report');
  });
  await T('R-M3', 'draft mode: a reprint (here through the reship address form) is held, never confirmed at the printer', async () => {
    const w = await world(); const id = await shipped(w, [mug(0)]); w.env.MERCH_PROVIDER_MODE = 'draft';
    const s = w.pfOrder(id).shipments[0]; s.returned = true; await shipHint(w, id); const n = confirms(w);
    const r = await w.call('POST', '/merch/order/' + id + '/address', { name: 'Pat', line1: '9 New Lane', city: 'Town', postal: '12345', country: 'US' }); ok(r.status === 200, r.text);
    ok(confirms(w) === n && w.one('select status from merch_reprints where order_id = ?', id).status === 'held' && w.owner(/reprint_held/).length === 1, 'held, the owner told, no confirm');
  });
  await T('R-M4', 'no reship or reprint on a refunded order: a Dashboard full refund marks every line refunded; reprint and the address form refuse', async () => {
    const w = await world(); const id = await shipped(w, [mug(0), tee(1)]); await dash(w, id);
    ok(w.order(id).status === 'refunded' && w.lines(id).every((l) => l.refunded_qty === l.qty), 'refunded_qty = qty');
    ok((await w.admin('POST', 'order/' + id + '/reprint', { lines: [1] })).status === 409, 'reprint refused');
    const s = w.pfOrder(id).shipments[0]; s.returned = true; await shipHint(w, id); ok(!w.order(id).hold && !w.mails(/_address_/).length, 'no reship hold, no email');
  });
  await T('R-M5', 'the gate needs the printer and the renderer too: without either, checkout is 503 and Stripe is never called', async () => {
    for (const env of [{ PROVIDER_FETCH: undefined }, { RENDER_FETCH: undefined }, { MERCH_PROVIDER_KEY: undefined }]) {
      const w = await world({ env }); const r = await w.checkout([mug(0)]); ok((r.status === 503 && r.json.error === 'merch_closed') && !w.stripe.calls.length, JSON.stringify(env) + ' ' + r.status);
    }
  });
  await T('R-S1', 'a render that ends after a cancel: the line stays cancelled; a render that FAILS after a cancel sends no "couldn’t print"', async () => {
    for (const fail of [false, true]) {
      const w = await world(); let id; if (fail) w.rd.queue.push('err', 'err', 'err');
      w.rd.after.shot = async () => { w.rd.after.shot = null; await w.call('POST', '/merch/order/' + id + '/cancel', {}); };
      if (fail) { const real = w.rd.fetch; w.rd.fetch = async (u, i) => { const r = await real(u, i); if (w.rd.calls.length === 3) await w.call('POST', '/merch/order/' + id + '/cancel', {}); return r; }; w.env.RENDER_FETCH = w.rd.fetch; }
      id = await w.paidOrder([mug(0)]); await w.advance(5 * MIN);
      ok(w.lines(id)[0].status === 'cancelled' && !w.mails(/_reject_/).length && !w.owner(/render_reject/).length && refunded(w) === 2498, (fail ? 'fail' : 'ok') + ': ' + w.lines(id)[0].status);
    }
  });
  await T('R-S2', 'a line refund adds the line tax only when the tax is exclusive (inclusive: inside the price)', async () => {
    const w = await world({ env: { MERCH_COUNTRIES: 'all' } }); const id = await w.newOrder([tee(0), tee(1)], 'NZ'); const cs = w.stripe.pay(w.sid(id));
    cs.total_details.amount_tax = 300; cs.line_items.data[0].amount_tax = 150; cs.line_items.data[1].amount_tax = 150; // NZ: inclusive (the total stays)
    await w.hook('checkout.session.completed', { id: cs.id, payment_status: 'paid' }); await w.advance(65 * MIN);
    const r = await w.admin('POST', 'order/' + id + '/refund', { line: 1, reason: 'damaged' }); ok(r.json.amount === 2699, '2699, not 2849: ' + r.json.amount);
  });
  await T('R-S3', 'a partial Dashboard refund before completed: held review with the amount, the owner decides (confirm makes it); never "refunded, make nothing"', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); const cs = w.stripe.pay(w.sid(id)); w.stripe.dashRefund(cs.payment_intent, 500);
    await w.hook('charge.refunded', { id: 'ch_s3', payment_intent: cs.payment_intent, amount: 2498 }); eq([w.order(id).status, w.order(id).why, w.order(id).refunded], ['held', 'dash_refund', 500], 'held');
    await w.hook('checkout.session.completed', { id: cs.id, payment_status: 'paid' }); const c = await w.admin('POST', 'order/' + id + '/confirm', {}); ok(c.status === 200, c.text);
    await w.advance(2 * HOUR); ok(w.order(id).status === 'confirmed' && w.order(id).refunded === 500, 'the owner’s confirm: made; the 500 stays recorded');
  });
  await T('R-S4', 'a refund on a replaced line is refused (409 replaced, it names the reprint line); the reprint line can be refunded', async () => {
    const w = await world(); const id = await shipped(w, [mug(0)]); await w.admin('POST', 'order/' + id + '/reprint', { lines: [1] });
    const r = await w.admin('POST', 'order/' + id + '/refund', { line: 1, reason: 'damaged' }); ok(r.status === 409 && r.json.error === 'replaced' && r.json.reprint === 101, r.text);
    const r2 = await w.admin('POST', 'order/' + id + '/refund', { line: 101, reason: 'damaged again' }); ok(r2.status === 200 && refunded(w) === 2498, 'one refund only, of the reprint line: ' + r2.text);
  });
  await T('R-S5', 'charge.refunded marks our own sending row done; a retry after 20 h lists the refunds first (Stripe forgot the key)', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]); let lost = true; w.stripe.after.refund = async () => { if (lost) { lost = false; w.stripe.fail.refund = 400; w.evict(); } };
    await w.call('POST', '/merch/order/' + id + '/cancel', {}); const pi = w.order(id).payment_intent;
    await w.hook('charge.refunded', { id: 'ch_s5', payment_intent: pi, amount: 2498, refunded: true }); ok(w.one('select status from merch_refunds where order_id = ?', id).status === 'done', 'done from the event');
    await w.advance(2 * DAY); ok(w.stripe.refunds.length === 1, 'never sent again');
    const x = await world(); const j = await x.paidOrder([mug(0)]); x.stripe.after.refund = async () => { x.stripe.after.refund = null; x.stripe.fail.refund = 400; x.evict(); };
    await x.call('POST', '/merch/order/' + j + '/cancel', {}); await x.advance(21 * HOUR); x.stripe.fail.refund = 0; await x.advance(30 * MIN);
    ok(x.stripe.refunds.length === 1 && x.stripe.calls.some((c) => c.m === 'GET' && /^\/v1\/refunds/.test(c.path)) && x.one('select status from merch_refunds where order_id = ?', j).status === 'done', 'found by metadata, one refund');
  });
  await T('R-S6', 'question 13: a completed event for an expired order: held review late_pay, refunded after 24 h unless the owner confirms', async () => {
    for (const owner of [false, true]) {
      const w = await world(); const id = await w.newOrder([mug(0)]); const cs = w.stripe.pay(w.sid(id)); w.L().tx(() => w.L().expire(id));
      await w.hook('checkout.session.completed', { id: cs.id, payment_status: 'paid' }); eq([w.order(id).status, w.order(id).hold, w.order(id).why], ['held', 'review', 'late_pay'], 'late_pay');
      ok(w.owner(/review/).length === 1, 'owner email');
      if (owner) { await w.admin('POST', 'order/' + id + '/confirm', {}); await w.advance(2 * HOUR); eq(w.order(id).status, 'confirmed', 'the owner confirmed: made'); }
      else { await w.advance(DAY + MIN); ok(w.order(id).status === 'refunded' && refunded(w) === 2498, 'refunded after 24 h'); }
    }
  });
  await T('R-S7', 'the outbox: a failed email is retried and sent once; after the last try the owner is told; the nightly report has one email per JST day', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); w.mail.fail = 2; await w.pay(id);
    ok(w.one('select status, tries from merch_outbox where id = ?', 'me_' + id + '_thanks').tries === 1, 'failed once, queued'); await w.advance(10 * MIN);
    ok(w.mails(/_thanks$/).length === 1 && w.one('select status from merch_outbox where id = ?', 'me_' + id + '_thanks').status === 'sent', 'sent on a retry');
    const x = await world(); const j = await x.newOrder([mug(0)]); x.mail.fail = 6; await x.pay(j); await x.advance(6 * HOUR);
    ok(x.one('select status, tries from merch_outbox where id = ?', 'me_' + j + '_thanks').status === 'failed' && x.owner(/mail_failed/).length === 1, 'failed after 6 tries; the owner told');
    const y = await world(); y.clock.t = Date.parse('2026-12-02T04:30:00+09:00'); await y.cron(); await y.cron(); y.clock.t += DAY; await y.cron();
    ok(y.owner(/report/).length === 2 && new Set(y.owner(/report/).map((m) => m.key)).size === 2, 'two nights, two reports (the key carries the day)');
  });
  await T('R-S8', 'printer hints: rate-limited per IP; in live mode only signed hints are read', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0)]); const ip = { 'CF-Connecting-IP': '10.80.0.1' }; const gets = () => w.pf.calls.filter((c) => c.m === 'GET').length;
    for (let i = 0; i < 300; i++) await w.phook(JSON.stringify({ id: 'f' + i, type: 'x', data: { order: { external_id: 'nope' } } }), ip);
    const r = await w.phook(JSON.stringify({ id: 'f-last', type: 'x', data: { order: { external_id: 'nope' } } }), ip); ok(r.status === 429, '301st hint: ' + r.status);
    const g = gets(); ok((await w.phook(w.pf.hook(w.pfOrder(id), 'x', 'u1'), {}, { unsigned: true })).status === 401 && gets() === g, 'unsigned: 401, no printer read');
  });
  await T('R-S9', 'the day cap counts paid orders of the JST day only: open sessions never block the shop; a payment after the cap is reached is served', async () => {
    const w = await world({ env: { MERCH_DAY_CAP: '1' } }); const open = []; for (let i = 0; i < 5; i++) open.push(await w.newOrder([mug(i % 3)]));
    ok((await w.call('GET', '/merch/catalog')).json.sold_out_today === false, 'five open sessions: not sold out');
    await w.pay(open[0]); ok((await w.checkout([mug(1)])).json.error === 'sold_out_today', 'one paid: sold out'); await w.pay(open[1]);
    eq(w.order(open[1]).status, 'paid', 'paid after the cap was reached: served, never refused');
    await w.call('POST', '/merch/order/' + open[0] + '/cancel', {}); ok(w.L().dayCount(w.order(open[1]).day) === 1, 'a cancelled order frees its place');
  });
  await T('R-S10', 'the delay email runs for held orders too; the late cancel then refunds it', async () => {
    const w = await world({ env: { MERCH_PROVIDER_MODE: 'draft' } }); const id = await w.drafted([mug(0)]); await w.advance(2 * HOUR); eq(w.order(id).hold, 'draft_mode', 'held');
    await w.advance(w.order(id).ship_by - w.clock.t + MIN); ok(w.order(id).late_sent_at && w.mails(/_late$/).length === 1, 'the delay email');
    const c = await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' }); ok(c.status === 200 && w.order(id).status === 'refunded' && refunded(w) === 2498, c.text);
    const d = await world(); const di = await d.drafted([mug(0)]); await d.hook('charge.dispute.created', { id: 'dp_s10', payment_intent: d.order(di).payment_intent }); await d.advance(15 * DAY); ok(!d.mails(/_late$/).length, 'not during a dispute');
  });
  await T('R-S11', 'a failed print store backs off (no re-render), tells the owner; the report shows the ledger’s storage and writes', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]); const real = w.env.PRINTS.get; let n = 0;
    w.env.PRINTS.get = (x) => { const s = real(x); return { obj: s.obj, fetch: async (u, i) => (/\/put/.test(String(u)) && n++ < 4 ? new Response('no', { status: 500 }) : s.fetch(u, i)) }; };
    await w.advance(1); ok(w.lines(id)[0].store_tries === 1 && w.order(id).next_try_at - w.clock.t === MIN && w.owner(/store_failed/).length === 1, 'backoff 1 min, the owner told');
    await w.advance(3 * HOUR); ok(w.rd.calls.length === 1 && ['drafted', 'confirmed'].includes(w.lines(id)[0].status) && w.lines(id)[0].file_key, 'stored on a later try without a new render: ' + w.rd.calls.length + ' ' + w.lines(id)[0].status);
    const rep = w.L().report(); ok(rep.ledger.bytes > 0 && rep.ledger.writes_today > 0 && rep.ledger.writes_free_a_day === 100000, JSON.stringify(rep.ledger));
  });
  await T('R-S12', 'wrangler.example.toml: [env.test] repeats every var and both Durable Object bindings, and points MERCH_SITE at the test copy', async () => {
    const t = fs.readFileSync(path.join(ROOT, 'cloudflare', 'merch', 'wrangler.example.toml'), 'utf8'), top = t.slice(t.indexOf('[vars]'), t.indexOf('[env.test]')), env = t.slice(t.indexOf('[env.test.vars]'));
    const names = (s) => Array.from(s.matchAll(/^([A-Z_]+) = /gm)).map((m) => m[1]);
    const miss = names(top).filter((n) => !names(env).includes(n)); ok(!miss.length, 'missing in env.test: ' + miss);
    ok((t.match(/\[\[env\.test\.durable_objects\.bindings\]\]/g) || []).length === 2 && /MERCH_SITE = "https:\/\/test\.doodledoggo\.app"/.test(env) && /MERCH_PROVIDER_MODE = "draft"/.test(env), 'bindings, site, draft');
    ok(!/(sk|rk)_(live|test)_[A-Za-z0-9]{6}|whsec_[A-Za-z0-9]{6}/.test(t), 'no key-like strings');
  });
  await T('R-S13', 'deletion on request (admin forget, merch.sh forget): buyer data and files of ended orders cleared, the money rows kept; orders in progress wait', async () => {
    const w = await world(); const id = await shipped(w, [mug(0)]); const busy = await w.paidOrder([mug(1)], 'US', { email: 'buyer@example.test' }); const key = w.lines(id)[0].file_key;
    const r = await w.admin('POST', 'forget', { email: 'Buyer@Example.test' }); ok(r.status === 200 && r.json.forgotten.includes(id) && r.json.waiting.some((x) => x.id === busy) && r.json.printful.length === 1 && /recipient/.test(r.json.todo), r.text);
    const o = w.order(id), l = w.lines(id)[0];
    ok(!o.email_hash && !l.recipe && !l.name && !l.print_link && !l.file_key && !w.one('select tracking_url from merch_parcels where order_id = ?', id).tracking_url, 'cleared');
    const stat = await (await w.env.PRINTS.get(key.split('~')[0]).fetch('https://prints/stat')).json();
    ok(o.total === 2498 && o.status === 'shipped' && stat.files === 0 && !w.q('select * from merch_trash').length, 'money kept; the PNG deleted');
    ok((await w.admin('POST', 'forget', {})).status === 400 && /forget/.test(sh(['forget', 'email:a@b.c'])) && /"order": "mo_AAAAAAAAAAAAAAAAAAAAAA"/.test(sh(['forget', 'mo_AAAAAAAAAAAAAAAAAAAAAA'])), 'inputs; merch.sh forget (dry run)');
  });
  await T('R-S14', 'build_assets.mjs copies every released folder from site/merch/print/ and never deletes one already served', async () => {
    const base = fs.mkdtempSync(path.join(process.env.TMPDIR || '/tmp', 'merch-assets-')), src = path.join(base, 'src'), dst = path.join(base, 'dst');
    for (const d of ['pp1-aaaaaaaa', 'pp1-bbbbbbbb']) { fs.mkdirSync(path.join(src, d), { recursive: true }); fs.writeFileSync(path.join(src, d, 'index.html'), d); }
    fs.mkdirSync(path.join(dst, 'pp1-00000000'), { recursive: true }); fs.writeFileSync(path.join(dst, 'pp1-00000000', 'index.html'), 'old');
    fs.mkdirSync(path.join(dst, 'pp1-aaaaaaaa'), { recursive: true }); fs.writeFileSync(path.join(dst, 'pp1-aaaaaaaa', 'index.html'), 'released');
    const out = execFileSync(process.execPath, [path.join(ROOT, 'cloudflare', 'merch', 'build_assets.mjs')], { env: Object.assign({}, process.env, { MERCH_PRINT_SRC: src, MERCH_ASSETS_DIR: dst, MERCH_ART_VER: 'pp1-bbbbbbbb' }), encoding: 'utf8' });
    eq(fs.readdirSync(dst).sort(), ['pp1-00000000', 'pp1-aaaaaaaa', 'pp1-bbbbbbbb'], 'every folder, none deleted');
    ok(fs.readFileSync(path.join(dst, 'pp1-aaaaaaaa', 'index.html'), 'utf8') === 'released' && out.includes('MERCH_ART_VERS = "pp1-00000000,pp1-aaaaaaaa"'), 'a released file never changes; ' + out);
    ok(fs.existsSync(path.join(ROOT, 'site', 'merch', 'print', PP.ART_VER)), 'the current ART_VER folder is in git under site/merch/print/');
    fs.rmSync(base, { recursive: true, force: true });
  });
  await T('R-S15', 'merch.sh refund <order> <line> 2 with the reason forgotten is refused (and the server refuses a reason with no words)', async () => {
    let e = null; try { sh(['refund', 'mo_AAAAAAAAAAAAAAAAAAAAAA', '1', '2']); } catch (x) { e = x; } ok(e && e.status === 2 && /reason must be words/.test(String(e.stderr)), 'exit 2');
    const w = await world(); const id = await w.confirmedOrder([mug(0)]); const r = await w.admin('POST', 'order/' + id + '/refund', { line: 1, reason: '2' }); ok(r.status === 400 && r.json.error === 'no_reason' && !w.stripe.refunds.length, r.text);
  });
  await T('R-S16', 'GET before EVERY draft create (not only after a timeout): a crash during the create never gives a second draft', async () => {
    const w = await world(); w.pf.after.create = async () => { w.pf.after.create = null; w.evict(); }; const id = await w.paidOrder([mug(0)]); await w.advance(2 * HOUR);
    ok(w.pf.orders.size === 1 && w.order(id).status === 'confirmed' && w.pf.calls.filter((c) => c.m === 'GET' && c.path === '/orders/@' + id).length >= 2, 'one draft; a GET before each create');
  });
  await T('R-N1', 'refund ids per line: line 1 and line 101 count apart (no LIKE wildcard)', async () => {
    const w = await world(); const id = await shipped(w, [mug(0, { qty: 3 })]); await w.admin('POST', 'order/' + id + '/reprint', { lines: [1] });
    const a = await w.admin('POST', 'order/' + id + '/refund', { line: 101, qty: 1, reason: 'damaged' }); ok(a.json.refund === 'mr_' + id + '_l101_1', a.text);
    w.L().run("insert into merch_refunds (id, order_id, line, qty, amount, reason, status, created_at) values (?, ?, 1, 1, 0, 'x', 'done', 0)", 'mr_' + id + '_l1_1');
    const b = await w.admin('POST', 'order/' + id + '/refund', { line: 101, qty: 1, reason: 'damaged' }); ok(b.json.refund === 'mr_' + id + '_l101_2', 'not counted with line 1: ' + b.json.refund);
  });
  await T('R-N2', 'rate rows go within the hour (the */10 cron), not only at the nightly tidy', async () => {
    const w = await world(); await w.quote([mug(0)]); ok(w.q('select count(*) as n from merch_rate')[0].n === 1, 'a row'); w.clock.t += HOUR + 10 * MIN; await w.cron();
    ok(w.q("select count(*) as n from merch_rate where k glob 'quote:*'")[0].n === 0, 'gone');
  });
  await T('R-N3', 'a full refund email says "in full"; a part refund says "part"', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]); await w.admin('POST', 'order/' + id + '/refund', { line: 1, reason: 'damaged' }); await w.admin('POST', 'order/' + id + '/refund', { line: 2, reason: 'damaged' });
    const m = w.mails(/_refund_mr_/); ok(/part of your order/.test(m[0].text) && /in full/.test(m[1].text), m.map((x) => x.text.slice(0, 40)).join(' | '));
  });
  await T('R-N4', 'a stale confirming order that Printful shows as canceled or failed is held for the owner, never taken as confirmed', async () => {
    const w = await world(); const id = await w.drafted([tee(0)]); w.pf.after.confirm = async (o) => { w.pf.after.confirm = null; o.status = 'canceled'; w.evict(); };
    await w.advance(w.order(id).cancel_until + GRACE - w.clock.t); await w.advance(10 * MIN);
    eq([w.order(id).status, w.order(id).hold, w.order(id).why], ['held', 'review', 'confirm_canceled'], 'held'); ok(w.owner(/review/).length === 1 && !w.order(id).confirmed_at, 'owner told, not confirmed');
  });
  await T('R-N5', 'a late cancel never cancels the whole Printful order once part of it has shipped (see T2.1-31)', async () => {
    const w = await world(); const id = await w.confirmedOrder([mug(0), tee(1)]); w.pf.ship(w.order(id).provider_order, [id + '_1']); await shipHint(w, id); await w.advance(w.order(id).ship_by - w.clock.t + MIN);
    await w.call('POST', '/merch/order/' + id + '/cancel', { scope: 'late' }); ok(!w.pf.calls.some((c) => c.m === 'DELETE') && !w.pfOrder(id).deleted, 'not deleted');
  });
  await T('R-N6', 'the request’s flush and the alarm never send one refund key at the same time (the row is claimed)', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]); let go; const gate = new Promise((r) => { go = r; }); w.stripe.after.refund = async () => { await gate; };
    const c = w.call('POST', '/merch/order/' + id + '/cancel', {}); await new Promise((r) => setTimeout(r, 20));
    const rid = w.one('select id from merch_refunds where order_id = ?', id).id; await w.L().sendRefund(rid); go(); await c;
    ok(w.stripe.calls.filter((x) => x.m === 'POST' && x.path === '/v1/refunds').length === 1, 'one call');
  });
  await T('R-N7', 'a dispute won before completed, then confirm: the payment is read from Stripe and it is made (not refunded)', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); const cs = w.stripe.pay(w.sid(id));
    await w.hook('charge.dispute.created', { id: 'dp_n7', payment_intent: cs.payment_intent }); await w.hook('charge.dispute.closed', { id: 'dp_n7', payment_intent: cs.payment_intent, status: 'won' });
    ok(!w.order(id).paid_at, 'completed never came'); const c = await w.admin('POST', 'order/' + id + '/confirm', {}); ok(c.status === 200, c.text);
    await w.advance(2 * HOUR); ok(w.order(id).status === 'confirmed' && !w.stripe.refunds.length && w.order(id).paid_at, 'made: ' + w.order(id).status);
  });
  await T('R-N8', 'no public fallback hash key: without MERCH_HASH_KEY no order is taken, an email is never hashed, raw flags are refused', async () => {
    const w = await world({ env: { MERCH_HASH_KEY: undefined } }); ok((await w.checkout([mug(0)])).status === 503, 'no orders');
    ok((await w.admin('POST', 'flag', { key: 'email:a@b.c', mode: 'block' })).status === 503, 'flag by email refused');
    await w.init(); ok((await w.L().hashOf('a@b.c', 'email')) === null && /^[0-9a-f]{64}$/.test(await w.L().hashOf('1.2.3.4', 'ip')), 'email: none; IP: a key kept only in memory');
  });
  await T('R-N9', 'question 16: a reship whose print file is gone re-renders, then asks the buyer for the address again; the bounced address is never used', async () => {
    const w = await world(); const id = await shipped(w, [mug(0)]); const s = w.pfOrder(id).shipments[0]; s.returned = true; await shipHint(w, id);
    await w.L().tidy(w.clock.t + 181 * DAY); ok(!w.lines(id)[0].file_key, 'the file is gone');
    const a1 = { name: 'Pat', line1: '9 New Lane', city: 'Town', postal: '12345', country: 'US' };
    const r = await w.call('POST', '/merch/order/' + id + '/address', a1); ok(r.status === 200 && r.json.again === true, r.text);
    await w.advance(5 * MIN); const rp = w.one('select * from merch_reprints where order_id = ?', id);
    ok(rp.status === 'need_address' && w.order(id).hold === 'reship' && w.mails(new RegExp('_address_' + rp.id + '$')).length === 1 && !w.pf.calls.some((c) => c.m === 'POST' && c.body && c.body.external_id === rp.id), 'redrawn; asked again; nothing sent to the printer yet');
    const r2 = await w.call('POST', '/merch/order/' + id + '/address', Object.assign({}, a1, { line1: '10 Newer Lane' })); ok(r2.status === 200, r2.text);
    const P = Array.from(w.pf.orders.values()).find((p) => p.external_id === rp.id); ok(P && P.recipient.address1 === '10 Newer Lane' && P.status === 'pending', 'made with the address typed the second time');
    ok(!Array.from(w.pf.orders.values()).some((p) => p.external_id === rp.id && p.recipient.address1 === '1 Example Street'), 'never the Stripe session’s (bounced) address');
  });
}
