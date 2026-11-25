// Stage 5: crashes and races (docs/reviews/MERCH_PART3_review.md, PART3.md "the ledger's rules").
//   C-*      the object is killed between an outside call and the write (w.evict(): its later storage calls throw), then woken: the order always
//            ends confirmed/shipped, refunded or held with an owner email; never stuck, never two drafts, never two refunds, never two emails.
//   X-race-* a cancel, a Dashboard refund and a dispute arriving DURING each await (the fake runs it before answering).
//   X-draft-world  a whole world in MERCH_PROVIDER_MODE=draft: nothing is ever confirmed at the printer, reprints are held.
import { T, ok, eq, world, mug, tee, PP, MIN, HOUR, DAY } from './harness.mjs';

const GRACE = 120e3;
// after a REQUEST dies nothing re-arms the alarm: the */10 cron is the backstop (TRANSACTIONS 6.5). This runs time forward with it.
const withCron = async (w, ms) => { const end = w.clock.t + ms; while (w.clock.t < end) { await w.advance(Math.min(10 * MIN, end - w.clock.t)); await w.cron(); } };
const crash = (w, fake, k) => { fake.after[k] = async () => { fake.after[k] = null; w.evict(); }; };
const shipHint = async (w, id) => w.phook(w.pf.hook(w.pfOrder(id), 'package_shipped', 'evt_' + Math.random()));
const confirms = (w) => w.pf.calls.filter((c) => /\/confirm$/.test(c.path)).length;
const live = (w) => Array.from(w.pf.orders.values()).filter((o) => !o.deleted);
const refundKeys = (w) => w.stripe.refunds.map((r) => r.metadata.merch_refund);
// the checks every crash ends with
function settled(w, id, want) {
  const o = w.order(id), rep = w.L().report();
  ok(want.includes(o.status), 'ends ' + want.join('|') + ': ' + o.status + '/' + o.hold);
  if (o.status === 'held') ok(w.owner().some((m) => m.subject.includes(id)), 'held with an owner email');
  ok(!rep.stranded.length, 'nothing stranded: ' + JSON.stringify(rep.stranded));
  ok(new Set(refundKeys(w)).size === refundKeys(w).length && w.stripe.refunds.reduce((a, r) => a + r.amount, 0) <= o.total, 'never two refunds: ' + refundKeys(w));
  ok(live(w).filter((p) => p.external_id === id || p.external_id.startsWith(id + '-d')).length <= 1, 'never two drafts');
  ok(!w.q("select id from merch_orders where lease_until > ?", w.clock.t).length, 'no lease left behind');
}

export async function crashes() {
  console.log('--- stage 5: crashes between a call and its write, races during every await, a draft-mode world');
  await T('C-checkout', 'killed after Stripe made the session (url never stored): the order expires by itself; nobody can pay it', async () => {
    const w = await world(); crash(w, w.stripe, 'create'); const q = await w.quote([mug(0)]);
    const r = await w.call('POST', '/merch/checkout', { country: 'US', lines: [mug(0)], expect_total: q.json.total, art_ver: PP.ART_VER, nonce: 'crash-checkout-1', agree: true });
    const id = w.q('select id from merch_orders')[0].id; ok(r.status === 503 && !w.order(id).checkout_url && w.order(id).next_try_at, 'the wake was written with the order: ' + r.status);
    await withCron(w, 2 * HOUR + 10 * MIN); eq([w.order(id).status, w.lines(id)[0].status], ['expired', 'void'], 'expired'); ok(!w.L().report().stranded.length, 'nothing stranded');
  });
  await T('C-paid', 'killed after the webhook re-read the session: no event row, Stripe resends, paid once, one Thank you', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); crash(w, w.stripe, 'get'); const r = await w.pay(id);
    ok(r.status === 503 && w.order(id).status === 'open' && !w.one('select id from merch_events where id = ?', 's:' + r.eventId), 'nothing written: ' + r.status);
    const again = await w.call('POST', '/merch/webhook/stripe', r.raw, { 'stripe-signature': r.sig }); ok(again.status === 200 && w.order(id).status === 'paid', 'Stripe resends: paid');
    await w.advance(2 * HOUR); settled(w, id, ['confirmed']); ok(w.mails(/_thanks$/).length === 1, 'one Thank you');
  });
  await T('C-render', 'killed after the renderer answered: re-rendered after the lease, one file, the flow goes on', async () => {
    const w = await world(); crash(w, w.rd, 'shot'); const id = await w.paidOrder([mug(0)]); await w.advance(1);
    ok(w.lines(id)[0].status === 'queued' && w.order(id).next_try_at > w.clock.t, 'still queued, with a wake'); await w.advance(2 * HOUR);
    settled(w, id, ['confirmed']); ok(w.rd.calls.length === 2 && w.lines(id)[0].file_key, 'rendered again once');
  });
  await T('C-store', 'killed after the print file was stored but before the ledger wrote it: stored again under the same key, drafted', async () => {
    const w = await world(); w.after.put = async () => { w.after.put = null; w.evict(); }; const id = await w.paidOrder([mug(0)]); await w.advance(1);
    ok(w.lines(id)[0].status === 'queued', 'not recorded'); await w.advance(2 * HOUR); settled(w, id, ['confirmed']);
    const key = w.lines(id)[0].file_key; ok(w.env.PRINTS.get(key.split('~')[0]).obj.stat().files === 1, 'one file in the shard (the same key replaced)');
  });
  await T('C-draft', 'killed after Printful made the draft: the wake GETs it by external id and adopts it (never two drafts)', async () => {
    const w = await world(); crash(w, w.pf, 'create'); const id = await w.paidOrder([mug(0), tee(1)]); await w.advance(30e3);
    ok(!w.order(id).provider_order && w.pf.orders.size === 1, 'made, not recorded'); await w.advance(2 * HOUR); settled(w, id, ['confirmed']); ok(w.pf.orders.size === 1 && confirms(w) === 1, 'one draft, confirmed once');
  });
  await T('C-confirm', 'killed after Printful confirmed (charged): the stale confirming claim is re-read, never a second confirm', async () => {
    const w = await world(); const id = await w.drafted([tee(0)]); crash(w, w.pf, 'confirm'); await w.advance(w.order(id).cancel_until + GRACE - w.clock.t);
    eq(w.order(id).status, 'confirming', 'still confirming'); await w.advance(HOUR); settled(w, id, ['confirmed']); ok(confirms(w) === 1, 'one confirm');
  });
  await T('C-refund', 'killed after Stripe made the refund (a cancel): the row stays sending and is retried with its key: one refund', async () => {
    const w = await world(); const id = await w.drafted([mug(0)]); crash(w, w.stripe, 'refund');
    const c = await w.call('POST', '/merch/order/' + id + '/cancel', {}); ok(c.status === 503 && w.order(id).status === 'cancelled', 'cancelled first');
    const again = await w.call('POST', '/merch/order/' + id + '/cancel', {}); ok(again.json.status === 'cancelled', 'tapping again is fine');
    await w.advance(3 * HOUR); settled(w, id, ['cancelled']); ok(w.stripe.refunds.length === 1 && w.order(id).draft_del === 0 && live(w).length === 0, 'one refund, the draft deleted');
  });
  await T('C-deldraft', 'killed after Printful deleted the draft: draft_del stays, the retry finds it gone (404 = done)', async () => {
    const w = await world(); const id = await w.drafted([mug(0)]); crash(w, w.pf, 'delete'); await w.call('POST', '/merch/order/' + id + '/cancel', {});
    ok(w.order(id).draft_del === 1, 'not recorded'); await withCron(w, HOUR); settled(w, id, ['cancelled']); ok(w.order(id).draft_del === 0 && !confirms(w), 'cleared, never confirmed');
  });
  await T('C-mail', 'killed after Resend sent the Thank you: the outbox row is sent again with the same key, Resend sends nothing new: one email', async () => {
    const w = await world(); const id = await w.newOrder([mug(0)]); crash(w, w.mail, 'send'); const r = await w.pay(id);
    ok(w.order(id).status === 'paid' && w.one('select status from merch_outbox where id = ?', 'me_' + id + '_thanks').status === 'queued', 'paid; the mail row still queued: ' + r.status);
    await w.advance(2 * HOUR); ok(w.mails(/_thanks$/).length === 1 && w.one('select status from merch_outbox where id = ?', 'me_' + id + '_thanks').status === 'sent', 'one email, the row sent');
    settled(w, id, ['confirmed']);
  });
  await T('C-reprint', 'killed after the reprint was made, and after it was confirmed: one reprint order, one confirm each', async () => {
    for (const k of ['create', 'confirm']) {
      const w = await world(); const id = await w.confirmedOrder([mug(0)]); w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
      crash(w, w.pf, k); const r = await w.admin('POST', 'order/' + id + '/reprint', { lines: [1] }); ok(r.status === 503, k + ': the call died ' + r.status);
      await withCron(w, 2 * HOUR); const rp = w.one('select * from merch_reprints where order_id = ?', id);
      ok(rp.status === 'confirmed' && live(w).filter((p) => p.external_id === id + '-r1').length === 1 && confirms(w) === 2, k + ': ' + rp.status + ' confirms ' + confirms(w));
      settled(w, id, ['part_shipped']);
    }
  });
  await T('C-address', 'killed after the fixed address made the draft (a request): the buyer can send it again, the GET finds the draft', async () => {
    const w = await world(); w.pf.refuse.recipient = true; const id = await w.paidOrder([mug(0)]); await w.advance(2 * MIN); w.pf.refuse.recipient = false; crash(w, w.pf, 'create');
    const a = { name: 'Pat', line1: '22 Fixed Road', city: 'Newtown', postal: '90001', country: 'US' };
    ok((await w.call('POST', '/merch/order/' + id + '/address', a)).status === 503 && w.order(id).hold === 'address', 'still held address');
    await w.advance(10 * MIN); const r = await w.call('POST', '/merch/order/' + id + '/address', a); ok(r.status === 200, r.text);
    await w.advance(2 * HOUR); settled(w, id, ['confirmed']); ok(w.pf.orders.size === 1, 'one draft');
  });
  await T('C-exception', 'a step that throws (not a crash): the lease leaves a wake, the owner is told, the next wake works', async () => {
    const w = await world(); const id = await w.paidOrder([mug(0)]); await w.init(); const L = w.L(), real = L.makeDraft.bind(L); let n = 0;
    L.makeDraft = async (...a) => { if (!n++) throw new Error('boom'); return real(...a); };
    await w.advance(30e3); ok(w.owner(/stuck/).length === 1 && w.order(id).next_try_at > w.clock.t && !w.order(id).provider_order, 'told; a wake left');
    await w.advance(2 * HOUR); settled(w, id, ['confirmed']);
  });

  // ---- a cancel, a Dashboard refund and a dispute during each await ----
  const does = {
    cancel: (w, id) => w.call('POST', '/merch/order/' + id + '/cancel', {}),
    dash: (w, id) => { const o = w.order(id); w.stripe.dashRefund(o.payment_intent, o.total); return w.hook('charge.refunded', { id: 'ch_race', payment_intent: o.payment_intent, amount: o.total, refunded: true }); },
    dispute: (w, id) => w.hook('charge.dispute.created', { id: 'dp_race', payment_intent: w.order(id).payment_intent })
  };
  const during = (fake, k, w, what, idRef) => { fake.after[k] = async () => { fake.after[k] = null; await does[what](w, idRef.id); }; };
  const before = async (name, setHook) => {
    for (const what of ['cancel', 'dash', 'dispute']) {
      const w = await world(); w.pf.costMul = 1.4; const ref = {}; setHook(w, what, ref);
      ref.id = await w.newOrder([mug(0)]); await w.pay(ref.id); await w.advance(3 * DAY);
      const o = w.order(ref.id), L = w.lines(ref.id);
      ok(!confirms(w) && !live(w).length, name + '/' + what + ': never confirmed, any draft deleted: ' + live(w).length);
      ok(!w.mails(/_reject_/).length && o.why !== 'cost', name + '/' + what + ': no "couldn’t print", no cost hold');
      if (what === 'dispute') eq([o.status, o.hold, w.stripe.refunds.length], ['held', 'dispute', 0], name + ': held dispute, no refund');
      else ok(o.status === (what === 'cancel' ? 'cancelled' : 'refunded') && w.stripe.refunds.reduce((a, r) => a + r.amount, 0) === o.total && L.every((l) => l.status === 'cancelled' && l.refunded_qty === l.qty), name + '/' + what + ': ' + o.status + ' ' + L.map((l) => l.status));
      ok(!w.L().report().stranded.length, name + '/' + what + ': nothing stranded');
    }
  };
  await T('X-race-render', 'S1: a cancel, a Dashboard refund or a dispute while the renderer works: the line is never set ready again, nothing more is made', async () => before('render', (w, what, ref) => during(w.rd, 'shot', w, what, ref)));
  await T('X-race-store', 'the same while the print file is being stored: kept 2 days at most, nothing more is made', async () => before('store', (w, what, ref) => { w.after.put = async () => { w.after.put = null; await does[what](w, ref.id); }; }));
  await T('X-race-draft', 'M1: the same while Printful makes the draft: the new draft is deleted, the dispute hold is never overwritten', async () => before('draft', (w, what, ref) => during(w.pf, 'create', w, what, ref)));
  await T('X-race-confirm', 'during the confirm call: a cancel is too_late; a Dashboard refund leaves it refunded with confirmed_at kept and an owner email; a dispute only flags', async () => {
    for (const what of ['cancel', 'dash', 'dispute']) {
      const w = await world(); const id = await w.drafted([tee(0)]); let res; w.pf.after.confirm = async () => { w.pf.after.confirm = null; res = await does[what](w, id); };
      await w.advance(2 * HOUR); const o = w.order(id);
      if (what === 'cancel') ok(res.status === 409 && res.json.error === 'too_late' && o.status === 'confirmed' && !w.stripe.refunds.length, 'cancel: too late');
      if (what === 'dash') ok(o.status === 'refunded' && o.confirmed_at && w.owner(/refund_after_confirm/).length === 1, 'dash: refunded, confirmed_at kept, owner told: ' + o.status);
      if (what === 'dispute') ok(o.status === 'confirmed' && o.dispute === 'open', 'dispute: the flow goes on: ' + o.status);
      ok(confirms(w) === 1 && !w.L().report().stranded.length, what + ': one confirm, nothing stranded');
    }
  });
  await T('X-race-reprint', 'during a reprint’s create: a Dashboard refund or a dispute: the reprint draft is deleted and never confirmed', async () => {
    for (const what of ['dash', 'dispute']) {
      const w = await world(); const id = await w.confirmedOrder([mug(0)]); w.pf.ship(w.order(id).provider_order, [id + '_1'], { status: 'fulfilled' }); await shipHint(w, id);
      w.pf.after.create = async () => { w.pf.after.create = null; await does[what](w, id); };
      await w.admin('POST', 'order/' + id + '/reprint', { lines: [1] }); await w.advance(2 * HOUR);
      const rp = w.one('select * from merch_reprints where order_id = ?', id), P = Array.from(w.pf.orders.values()).find((p) => p.external_id === id + '-r1');
      ok(rp.status === 'cancelled' && P.deleted && confirms(w) === 1 && !w.mails(/^me_.*_reprint_/).length, what + ': ' + rp.status + ' deleted ' + P.deleted + ' confirms ' + confirms(w));
      ok(w.lines(id).find((l) => l.line === 1).status !== 'replaced', what + ': the old line carries on as it was');
    }
  });
  await T('X-draft-world', 'MERCH_PROVIDER_MODE=draft, a whole world: orders, owner confirm, reprints, a reship: nothing is ever confirmed at the printer', async () => {
    const w = await world({ env: { MERCH_PROVIDER_MODE: 'draft' } });
    const a = await w.drafted([mug(0), tee(1)]); await w.advance(2 * HOUR); eq([w.order(a).status, w.order(a).hold], ['held', 'draft_mode'], 'held draft_mode');
    const c = await w.admin('POST', 'order/' + a + '/confirm', {}); ok(c.status === 200 && w.order(a).hold === 'draft_mode', 'the owner’s confirm: still held (not live)');
    w.pf.costMul = 1.4; const b = await w.drafted([tee(2)]); await w.admin('POST', 'order/' + b + '/confirm', {}); await w.advance(3 * DAY); ok(w.order(b).hold === 'draft_mode', 'a cost review released: held again');
    // an order already shipped (as if made in live mode), then a reprint and a reship while in draft mode
    w.pf.costMul = 1; w.env.MERCH_PROVIDER_MODE = 'live'; const s = await w.confirmedOrder([mug(3)]); w.pf.ship(w.order(s).provider_order, [s + '_1'], { status: 'fulfilled' }); await shipHint(w, s); w.env.MERCH_PROVIDER_MODE = 'draft';
    const n0 = confirms(w), pf0 = w.pf.calls.filter((x) => x.m === 'POST').length;
    const r = await w.admin('POST', 'order/' + s + '/reprint', { lines: [1] }); ok(r.status === 200 && w.one('select status from merch_reprints where order_id = ?', s).status === 'held' && w.owner(/reprint_held/).length === 1, 'M3: the reprint is held, the owner told');
    await w.advance(DAY); ok(confirms(w) === n0 && w.pf.calls.filter((x) => x.m === 'POST').length === pf0, 'no printer call for it at all');
    ok(w.L().report().reprints_waiting.length === 1 && !w.L().report().stranded.length, 'in the report; nothing stranded');
    w.env.MERCH_PROVIDER_MODE = 'live'; await w.admin('POST', 'order/' + s + '/confirm', {}); await w.advance(MIN);
    ok(w.one('select status from merch_reprints where order_id = ?', s).status === 'confirmed', 'live again: the owner releases it and it is made');
  });
}
