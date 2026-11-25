// The owner's admin routes (TRANSACTIONS.md 6.3): there is no SQL console for a Durable Object, so tools/merch.sh calls these.
// Authorization: Bearer MERCH_ADMIN_KEY (unset = always 401). 60 an hour per IP. No buyer data leaves here except what the owner needs for a
// dispute (the tracking, the delivery date and signed links to the print PNGs); never an address or an email.
import { json, fail, same, ORDER_ID, DAY, jstDay } from './util.js';
import * as stripe from './stripe.js';

// a game gift code as tools/promo.sh makes them: letters, digits and dashes, 4-40 characters (PROMO.md 1)
export const GIFT_CODE = /^[A-Z0-9][A-Z0-9-]{3,39}$/;
// part 9, C2: which printer this Worker uses now, first in `merch.sh show` and `report`, so the sandbox's stand-in (test_printer.js, the key
// 'test-printer' the test entry passes) is never taken for Printful: its drafts are not at Printful and its costs are catalog.js estimates
export const printerNow = (env) => (env.MERCH_PROVIDER_KEY !== 'test-printer' ? (env.MERCH_PROVIDER_KEY ? 'printful' : 'none')
  : env.MERCH_TEST === '1' && env.PROVIDER_FETCH ? 'STAND-IN (test_printer.js): not Printful; these drafts and costs are made up from catalog.js'
  : 'none (the key test-printer is only the stand-in on the test Worker with its binding)');

export async function adminRoute(L, req, path, ip) {
  const ih = await L.hashOf(ip, 'ip');
  if (!L.tx(() => L.rate('admin:ip:' + ih, 60))) return fail('slow_down', 429);
  const auth = req.headers.get('authorization') || '', key = L.env.MERCH_ADMIN_KEY;
  if (!key || String(key).length < 16 || !same(auth, 'Bearer ' + key)) return fail('unauthorized', 401);
  const u = new URL(req.url), m = req.method;
  let body = {};
  if (m === 'POST') { // review finding 14: a body over 64 KB is said as such (before: read as {} and answered "1 to 2000 codes")
    const t = await req.text(); if (t.length > 65536) return fail('too_big', 413, { say: 'At most 64 KB a request: send the codes 1000 at a time (tools/merch.sh gift add does).' });
    try { const o = JSON.parse(t || '{}'); body = o && typeof o === 'object' ? o : {}; } catch (e) { body = {}; }
  }
  const mm = /^order\/([^/]+)(?:\/(refund|reprint|confirm|lost))?$/.exec(path);
  if (path === 'orders' && m === 'GET') {
    const st = u.searchParams.get('status'), hold = u.searchParams.get('hold');
    let q = 'select id, status, hold, why, country, zone, total, refunded, created_at, paid_at, dispute from merch_orders where 1 = 1'; const a = [];
    if (st) { q += ' and status = ?'; a.push(st); } if (hold) { q += ' and hold = ?'; a.push(hold); }
    return json({ orders: L.q(q + ' order by created_at desc limit 500', ...a) });
  }
  if (mm) {
    const o = ORDER_ID.test(mm[1]) && L.order(mm[1]); if (!o) return fail('not_found', 404);
    const act = mm[2];
    if (!act && m === 'GET') {
      const lines = L.lines(o.id);
      for (const l of lines) l.file_url = l.file_key ? await L.fileUrl(l.file_key, 7 * DAY) : null;
      const ord = Object.assign({}, o); delete ord.email_hash; delete ord.checkout_url; ord.gift_code = !!o.gift_code; // part 6: never the code itself
      return json({ printer: printerNow(L.env), order: ord, lines, parcels: L.q('select * from merch_parcels where order_id = ?', o.id), refunds: L.q('select * from merch_refunds where order_id = ? order by created_at', o.id),
        events: L.q('select id, type, at, note from merch_events where order_id = ? order by at', o.id), reprints: L.q('select * from merch_reprints where order_id = ?', o.id),
        mail: L.q('select id, who, kind, status, tries, last_error, sent_at from merch_outbox where order_id = ? order by created_at', o.id) });
    }
    if (m !== 'POST') return fail('not_found', 404);
    if (act === 'refund') { // T2.1-21
      const line = Number(body.line), reason = typeof body.reason === 'string' ? body.reason.trim().slice(0, 40) : '';
      if (!/[A-Za-z]/.test(reason)) return fail('no_reason', 400, { say: 'Give the reason in words, for example: damaged' }); // S15: "2" is a quantity, not a reason
      const r = L.tx(() => {
        const x = L.order(o.id); if (!['paid', 'held', 'confirming', 'confirmed', 'part_shipped', 'shipped'].includes(x.status)) return { error: 'not_paid' };
        if (x.dispute === 'open' || x.dispute === 'lost') return { error: 'disputed' }; // part 9 (M1): lost, the bank already paid the buyer back
        const l = L.lines(x.id).find((y) => y.line === line); if (!l) return { error: 'bad_line' };
        if (l.status === 'replaced') return { error: 'replaced', reprint: (L.lines(x.id).find((y) => y.reprint_of === l.line && y.status !== 'replaced') || {}).line || null }; // S4: refund the reprint's line
        const q = body.qty == null ? l.qty - l.refunded_qty : Number(body.qty);
        return L.lineRefund(x, l, q, reason);
      });
      if (r.error) return fail(r.error, r.error === 'bad_line' || r.error === 'bad_qty' ? 400 : 409, r.reprint ? { reprint: r.reprint } : {});
      L.tx(() => L.event('x:refund:' + r.id, o.id, 'admin_refund', reason));
      await L.flush();
      return json({ ok: true, refund: r.id, amount: r.amount, status: L.order(o.id).status });
    }
    if (act === 'reprint') { // T2.1-23, T2.2-47 (attach a Printful claim reship by its order id)
      const lines = Array.isArray(body.lines) ? body.lines.map(Number) : [];
      const po = typeof body.provider_order === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(body.provider_order) ? body.provider_order : null;
      const r = await L.reprint(o, lines, po, null, 'owner');
      return r.ok ? json(r) : fail(r.error, r.status || 409);
    }
    if (act === 'confirm') { // the owner's go (T2.2-25, T2.2-39). M1: only from a review hold, draft_mode or a won dispute (part 9: any close but lost is 'won'); never a stopped order
      const okHold = (x) => x.status === 'held' && (x.hold === 'review' || x.hold === 'draft_mode' || (x.hold === 'dispute' && x.dispute === 'won'));
      let x = L.order(o.id);
      const held = L.q("select id from merch_reprints where order_id = ? and status = 'held'", o.id).length > 0;
      if (!okHold(x) && !(held && !L.stopped(x))) return fail('not_held', 409);
      if (okHold(x) && !x.paid_at) { // N7: a dispute or a Dashboard refund came before completed: the payment is read from Stripe now
        const g = await stripe.getSession(L.env, x.stripe_session); if (!g.ok || !g.data) return fail('busy', 503);
        if (g.data.status !== 'complete' || g.data.payment_status !== 'paid') return fail('not_paid', 409);
        await L.paidFrom(x.id, g.data, null); x = L.order(o.id);
      }
      const ok = L.tx(() => {
        const y = L.order(o.id); let did = false;
        if (okHold(y)) did = L.set(o.id, { status: 'paid', hold: null, why: null, hold_at: null, next_try_at: L.now() }, ['held']);
        if (did && y.hold === 'dispute') L.lateResume(o.id, y.hold_at); // second review (R2-M2): the delay date moves on by the time the dispute held it
        if (!L.stopped(L.order(o.id)) && L.q("update merch_reprints set status = 'queued' where order_id = ? and status = 'held' returning id", o.id).length) { did = true; L.next(o.id, L.now()); }
        return did;
      });
      if (!ok) return fail('not_held', 409);
      L.tx(() => L.event('x:confirm:' + o.id + ':' + L.now(), o.id, 'admin_confirm'));
      await L.tick();
      return json({ ok: true, status: L.order(o.id).status });
    }
    if (act === 'lost') { // T2.2-44: the other parcel is untouched
      const p = typeof body.parcel === 'string' && L.one('select * from merch_parcels where id = ? and order_id = ?', body.parcel, o.id);
      if (!p) return fail('bad_parcel', 400);
      L.tx(() => { L.run('update merch_parcels set lost_at = ? where id = ?', L.now(), p.id); L.event('x:lost:' + p.id, o.id, 'lost', p.id); });
      const lines = L.lines(o.id).filter((l) => l.parcel_id === p.id && l.status !== 'replaced' && l.refunded_qty < l.qty).map((l) => l.line);
      if (body.then === 'reprint') { const r = await L.reprint(L.order(o.id), lines, null, null, 'lost'); return r.ok ? json(Object.assign({ lines }, r)) : fail(r.error, r.status || 409); }
      if (body.then === 'refund') {
        // second review (R2-M4, its neighbour): never while a dispute is open or after it was lost (the bank decides, or already paid the buyer back)
        const x = L.order(o.id); if (x.dispute === 'open' || x.dispute === 'lost') return fail('disputed', 409);
        const out = L.tx(() => L.refundLines(o.id, lines.map((n) => ({ line: n })), 'lost')); // one email for the parcel (part 6)
        await L.flush(); return json({ ok: true, lines, refunds: out, status: L.order(o.id).status });
      }
      return json({ ok: true, lines });
    }
  }
  if (path === 'flag' && m === 'POST') { // T2.2-51/52: 'e:<hash>' / 'ip:<hash>', or email:<address> / ipaddr:<ip> hashed here; mode block | allow | clear
    let k = typeof body.key === 'string' ? body.key.trim() : '';
    if (/^(email|ipaddr):/.test(k) && !L.env.MERCH_HASH_KEY) return fail('not_set_up', 503); // N8: hashed with MERCH_HASH_KEY only
    if (/^email:/.test(k)) k = 'e:' + await L.hashOf(k.slice(6).trim().toLowerCase(), 'email');
    else if (/^ipaddr:/.test(k)) k = 'ip:' + await L.hashOf(k.slice(7).trim(), 'ip');
    if (!/^(e|ip):[0-9a-f]{64}$/.test(k) || !['block', 'allow', 'clear'].includes(body.mode)) return fail('bad_flag', 400);
    L.tx(() => { if (body.mode === 'clear') L.run('delete from merch_flags where key = ?', k); else L.flag(k, body.mode, typeof body.note === 'string' ? body.note.slice(0, 120) : null); });
    return json({ ok: true, key: k, mode: body.mode });
  }
  if (path === 'export' && m === 'GET') { // JSON lines, no buyer data (no email hash, no dog name, no recipe, no links)
    const from = Date.parse(u.searchParams.get('from') || '1970-01-01') || 0, to = Date.parse(u.searchParams.get('to') || '2999-01-01') || 4e13;
    const os = L.q('select * from merch_orders where created_at >= ? and created_at < ? order by created_at', from, to);
    const out = [];
    for (const o of os) {
      for (const k of ['email_hash', 'checkout_url', 'nonce']) delete o[k];
      o.gift_code = !!o.gift_code; // part 6: whether it had a gift, never the code
      o.lines = L.q('select line, product, colour, size, pose, name_on, qty, art_ver, unit, line_total, line_tax, cost_est, status, file_sha, refunded_qty, refunded, reprint_of from merch_order_items where order_id = ? order by line', o.id);
      o.refunds = L.q('select id, line, qty, amount, reason, status, created_at from merch_refunds where order_id = ?', o.id);
      o.parcels = L.q('select id, product, carrier, shipped_at, delivered_at, lost_at, returned_at from merch_parcels where order_id = ?', o.id);
      out.push(JSON.stringify(o));
    }
    L.tx(() => L.setMeta('last_export', L.now()));
    return new Response(out.join('\n') + (out.length ? '\n' : ''), { headers: { 'content-type': 'application/x-ndjson', 'cache-control': 'no-store', 'content-disposition': 'attachment; filename="merch-' + jstDay(L.now()) + '.jsonl"' } });
  }
  if (path === 'forget' && m === 'POST') { // S13, TRANSACTIONS 5: deletion on request, by order id or by the buyer's email (hashed here, never kept)
    let ids;
    if (typeof body.order === 'string' && ORDER_ID.test(body.order)) ids = [body.order];
    else if (typeof body.email === 'string' && /^[^@\s]+@[^@\s]+$/.test(body.email.trim())) {
      const h = await L.hashOf(body.email.trim().toLowerCase(), 'email'); if (!h) return fail('not_set_up', 503);
      ids = L.q('select id from merch_orders where email_hash = ?', h).map((r) => r.id);
    } else return fail('bad_forget', 400);
    const r = await L.forget(ids);
    return json(Object.assign(r, { kept: 'order and line rows (money, country, product, colour, size, status, dates), refunds, parcels (carrier and dates), events, fraud flags (a hash only), and the records Stripe and Printful keep by law',
      todo: r.printful.length ? 'Ask Printful to delete the recipient of these orders (dashboard or support): ' + r.printful.map((p) => p.provider_orders.join(',') || p.id).join('; ') : null }));
  }
  if (path === 'gift') { // part 6: the thank-you gift codes. Add (POST {codes: [...]}) or count (GET). A code is never logged, echoed back or listed.
    if (m === 'GET') return json(L.giftCounts());
    if (m !== 'POST') return fail('not_found', 404);
    const list = Array.isArray(body.codes) ? body.codes : null;
    if (!list || !list.length || list.length > 2000) return fail('bad_codes', 400, { say: 'Send {codes: [...]}, 1 to 2000 codes at a time.' });
    let added = 0, skipped = 0;
    L.tx(() => {
      for (const c of list) {
        const k = typeof c === 'string' ? c.trim().toUpperCase() : '';
        if (!GIFT_CODE.test(k)) { skipped++; continue; }
        if (L.q('insert into merch_gift_pool (code) values (?) on conflict(code) do nothing returning code', k).length) added++; else skipped++; // the same code twice: kept once
      }
    });
    return json(Object.assign({ added, skipped }, { left: L.giftCounts().left }));
  }
  if (path === 'render-test' && m === 'POST') { const r = await L.renderTest(body); return json(r.body, r.status); } // part 4: the render self-test
  if (path === 'report' && m === 'GET') return json(Object.assign({ printer: printerNow(L.env) }, L.report()));
  if (path === 'tick' && m === 'POST') { await L.tick(); return json({ ok: true }); }
  if (path === 'nightly' && m === 'POST') return json(await L.nightly(L.now()));
  return fail('not_found', 404);
}
