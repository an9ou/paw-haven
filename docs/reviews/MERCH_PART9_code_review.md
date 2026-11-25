# Merch part 9: the code review

Branch `merch/shop` at 12d9fe4, 25 Nov 2026 (JST). Reviewer: paw-reviewer (read-only); this file is the reviewer’s report as handed back, written down by the MERCH session. Order of the review: the part 6 fix batch (the automatic late refund, the gift reserve), part 8b, the part 4 and 5 fix batches, then the whole system.

Fixes: see the end of this file (added when the fix batch is merged).

```
CODE review, merch/shop at 12d9fe4 (read-only; tree left clean). Suites run: merch_worker 242/242, test_enc 36/36, gen.js --check current. I ran each finding below as a throwaway probe against the harness, then deleted the probes.

BLOCKER
B1 PROVEN. cloudflare/merch/ledger.js:1026-1038 lateCheck (called from work() :1044); also workHeld :1115-1117 (the 24 h refund of review pf_failed/pf_canceled).
  What is wrong: the automatic late refund decides "not posted" from local line status alone. Only Printful hints change that status (rProvider :913). Nothing polls Printful, and nothing re-reads the order before refunding. So one lost or late hint means we refund goods that have shipped: a webhook outage, a 502 while provider.get fails, an event type not subscribed, a deploy window, or a hint dropped by the 300/h rate limit. The same happens if the owner fixes a failed order at Printful but its hint is lost: it is refunded at 24 h while Printful prints it. The first delay email also goes out for parcels already posted.
  Repro 1: confirmedOrder([tee]), then pf.ship(..., fulfilled) with no hint, then advance to late_eta. Result: status refunded, $31.98 refunded, Printful order fulfilled.
  Repro 2: mug+tee order, mug hint sent, tee shipped with no hint. Result: the tee's $26.99 is refunded although it was posted.
  Fix: in work(), before the tx that runs lateCheck (and before any automatic refund of an order with confirmed_at), await provider.get(provider_order) and run applyProvider. If the read fails, push the step back 15 min; never refund blind. A daily re-read of every confirmed or part_shipped order would also catch lost hints.

MAJOR
M1 PROVEN. ledger.js:429 rCancel scope 'late' refuses only `hold === 'dispute' || dispute === 'open'`. The same gap is in admin.js:45 (line refund).
  What is wrong: after a LOST dispute on a confirmed order, the page still shows `late: true` and the late cancel refunds again. The bank already returned the money, so in the fake the buyer is paid back twice. With real Stripe, a refund on a charged-back charge is refused (charge_disputed, SUSPECTED), so we hit M2: retried every 5 min forever, while the buyer has already been emailed "We've refunded $X".
  Repro: confirmedOrder, advance past ship_by, dispute.created, dispute.closed lost, POST cancel {scope:'late'}. Result: 200, status refunded, a Stripe refund of 3198.
  Fix: refuse when dispute is 'lost' (and 'open') in rCancel late, in the admin refund, and in page().late; lateDue already does this for the second step.

M2 PROVEN (logic) / SUSPECTED (the real Stripe answer). ledger.js:606-611 sendRefund and :503 fullRefund.
  What is wrong: any refund that is not ok is retried every 5 min with no end. A permanent 4xx is never final: amount over what is left on the charge, charge_disputed, a bad payment_intent. The row's amount is never recomputed either. Example: a Dashboard partial refund whose webhook has not arrived yet, then the buyer cancels. fullRefund asks for total - o.refunded = the full total.
  Repro: paidOrder(mug), stripe.dashRefund(pi, 500) with no hook, then cancel. The refund row asks for 2498 on a charge with 1998 left (the fake accepted it: 2998 refunded in all). Real Stripe would refuse it forever, and the buyer never gets the 1998.
  Fix: on a 4xx (invalid_request_error) mark the row 'failed' and set refund_failed, then email the owner at once. Better: before sending a full refund, cap the amount at charge.amount - amount_refunded read from Stripe (listRefunds is already called after 20 h).

M3 PROVEN. ledger.js:901-905 onDispute (`won = d.status === 'won'`); admin.js:63 okHold.
  What is wrong: any closed status that is not 'won' is treated as lost. That includes 'warning_closed', an inquiry that closed with no chargeback, where we keep the money. An unprinted order is then paused: held 'dispute', dispute 'lost', gift returned. `merch.sh confirm` refuses it because okHold needs 'won'. The order is never made, never refunded, and does not show in the report's stranded list.
  Repro: paidOrder, dispute.created (warning_needs_response), dispute.closed (warning_closed), advance 30 days, admin confirm. Result: 409 not_held, 0 refunds, no Printful order.
  Fix: lost = status === 'lost' only. Treat warning_closed (and any other non-lost close) as won, or add a resolved state that okHold accepts. Treat inquiries (warning_*) on created as a flag, not a pause.

MINOR
m1 PROVEN in code (follows from B1). ledger.js:963-970 applyProvider.
  What is wrong: when a hint arrives after the late refund, the refunded line is moved to 'shipped' and the buyer gets "On its way". The owner gets no flag that a refunded line shipped (provCancel's 'cannot' email only covers a whole order cancelled with nothing shipped).
  Fix: email the owner when a line with refunded_qty = qty is shipped.

m2 SUSPECTED (by design?). ledger.js:43 GIFT_ON includes 'paid'.
  What is wrong: giftShow runs in any set() or next() past the hour, so an order still rendering or still without a Printful draft shows the code. If every line is then rejected, fullRefund 'nothing' leaves the buyer with a fully refunded order plus a code. This contradicts TRANSACTIONS T2.1-06 ("shown in the transaction that takes the order past cancel_until + 120 s ... printing starts").
  Fix: show it only once the order is drafted and at or past 'confirming' (or draft_mode).

m3. TRANSACTIONS.md T2.1-31 and T2.1-34 vs the code. The contract says "not in a dispute" but does not say what a lost or closed dispute means for the late steps (see M1 and M3). Update both rows with the fix.

Checked and sound
- Gift reserve: one atomic pool update with a unique order_id; giftBack inside the cancel/refund tx; cancel and show share the cancel_until+GRACE edge; mailed once (gift_mailed); never in the admin, export or report. Empty pool and webhook replays are fine.
- Late steps: one tx per step with its marker; the 3 crash points and repeated alarms make no second refund or email; no alarm loops (lateDue goes null after each step); amounts are capped at the order rest; world-zone extra and exclusive tax shares are right.
- Part 8b: 61_merch_enc.js declares only MERCH_WEAR, MERCH_SHARE, merchKitC, merchKit, merchMake, merchRecipe, merchEncode and merchLink; none collides with game/src. PawNames is kept inside a fake `self`. It reads only PawGenes/PawArt (phenotype does not change the dog's genes) and touches no save data or DOM.
- The share-link hash: capped in size; checked with hasOwnProperty against the page's own lists; one dog only; names are font-letter only and escaped.
- Part 4 fixes (pngCheck, far_px, error run, the 72 h wait, the band guard, the budget, the kit's delete) and part 5 fixes (only x-pf-webhook-signature is read, confirm re-read, pf_failed/pf_canceled hold, TAKEN) are in and tested.
- Stripe signature and replay checks, idempotency keys, GET-before-create, admin auth (constant time, at least 16 characters, rate limited), the gate shut by default, the server pricing everything, 128-bit order ids, escaped HTML email, and the internal routes unreachable from outside.

Not checkable without the real Stripe sandbox or a Printful key
- What Stripe answers to a refund on a charged-back charge, and to an amount over what is left (M1, M2).
- The full list of dispute statuses Stripe can close with ('warning_closed', 'prevented'?) (M3).
- Printful's v2 webhook retry policy and delivery guarantees (B1).
- Whether the v1 DELETE cancels a v2 order, and from which statuses.
- Adaptive Pricing on partial refunds; whether a Durable Object may call Browser Run directly.
```

## Fixes (25 Nov 2026, branch `merch/part9-code-fixes`, merged in e12f02d3; `merch_worker` 259/259)

All seven findings fixed, each with tests that fail on the old code (17 new cases in `cloudflare/merch/test/t_fix9.mjs`); the contract rows are in TRANSACTIONS.md (T2.1-06, 31, 34, 35, 36; T2.2-23, 25, 42) and the notes in PART5.md and PART6.md. Left for the next batch, found by the fixer: an order released 30+ days after a dispute closes in our favour is refunded at its next wake; the 7-day reship refund does not read the printer first; `stopped()` lets a confirmed order with a lost dispute be reprinted. This fix batch still needs its own second review.
