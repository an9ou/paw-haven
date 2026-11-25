# Merch part 9: the combined second review of the three fix batches

25 Nov 2026 (JST). One read-only review (code + phone page + print art) of the three part 9 fix batches on `merch/shop` at 1fab9d8b:
the code fixes (merge e12f02d3, fix commit 3f21682d, `t_fix9.mjs`), the page fixes (merge 88e7c1f0) and the print and email fixes
(merge ea311ba7, ART_VER `pp1-5688199b`). The first reviews: `MERCH_PART9_code_review.md`, `MERCH_PART9_phone_review.md`,
`MERCH_PART9_art_review.md`. Written up by the MERCH session from the reviewer's hand-back (the reviewer is read-only).

**Verdict: not ready for the sandbox.** The five first-review code fixes are in and hold, but money holes remain.
0 blocker, 4 major, 5 minor. The three open money points from the handoff are all confirmed by probe: they are R2-M2, R2-M3 and R2-M4.

## Major

### R2-M1 (code, `ledger.js:445-452`, `rCancel` scope `'late'`): the buyer's late cancel never reads Printful first

- Case (probe): a confirmed tee order, the delay email sent, the tee posted at Printful with the hint lost, then POST cancel
  `{scope:'late'}`. Result: 200, refunded in full, and the Printful order is fulfilled. We pay for a refund and a parcel.
- Fix: if `needRead(x)`, run `readPrinter` before the tx, then do `applyRead` and the `lateRefund` in one tx. If the read fails, still
  honour the cancel (the FTC right) and email the owner.
- Test: the same probe gives 409 `not_late`, the order shipped, 0 refunds.

### R2-M2 (handoff point 1; code, `ledger.js:1119`, `lateCheck`): `late_eta` counts from `ship_by`

- Case (probe): a paid order, a dispute created, 40 days pass, the dispute closes won, the owner confirms. Within 10 minutes the order
  is refunded with `late_eta` in the past: the owner's "ship it" is undone, and the late email and the refund email arrive together.
- Fix: `const from = Math.max(o.ship_by, now)` and `eta = min(addBusinessDays(from, LATE_MORE_DAYS), from + LATE_MAX_DAYS*DAY)`.
  Also, on a won close with `late_sent_at` set, push `late_eta` on by `now - disputed_at`.
- Test: the probe gives one late email with `late_eta >= now + 7 working days`, no refund at +2 h, and the `late_auto` refund only at
  the new `late_eta`.

### R2-M3 (handoff point 2; code, `ledger.js:1191-1199`, `workAfter` reship): the 7-day reship refund does not read Printful

- Reading alone is not enough: `applyProvider` (`ledger.js:1008` `up()`, `:1048`) never moves `parcel_id` to a new shipment for a line
  already ranked shipped, so `reshipLines` still lists a line Printful has reshipped.
- Fix: read and apply first (also re-read `shipped` orders that have `hold='reship'` in `rereads`, `:1717`). In `applyProvider`, when a
  new shipment holds a line whose parcel has `returned_at`, set `parcel_id` to the new shipment.
- Test: a parcel returned, the owner reships at Printful with no hint, 7 days pass: 0 refunds, the hold cleared, one "On its way".

### R2-M4 (handoff point 3; code, `ledger.js:189`, `stopped`): a lost dispute does not stop a reprint

- Case (probe): a shipped tee, the dispute lost, admin lost `{then:'reprint'}` gives 200 and a reprint row. The same gap is in
  `reshipOk` (`:486`) and the returned-parcel path (`:1063`), which asks the buyer for an address.
- Fix: add `|| o.dispute === 'lost'` in all three places.
- Test: the probe gives 409 `not_allowed` and 0 reprints; a returned parcel gets the owner's 'returned' mail and no buyer address
  mail; POST `/address` gives 409.

## Minor

- **R2-m1 (code, `ledger.js:1137` / `1224` / `1712`).** A Printful read made outside the tx can be stale. If an `order_failed` or
  `onhold` hint lands during the await, `applyRead` "goes on" (`:1031`, `:1046`) and undoes the hold for up to a day.
  Fix: skip `applyRead` when `updated_at` changed since the read started.
- **R2-m2 (code, `ledger.js:967`).** A `charge.dispute.created` that arrives after its `closed` reopens the dispute and pauses the
  order for good. Fix: ignore `created` when `d.id === o.dispute_id` and `dispute` is won or lost.
- **R2-m3 (page, `merch.js:256`).** In the basket the Shipping box says "$4.99" while the totals say "Free" (subtotal $52.98).
  Fix: say "Your shipping is free" when over the threshold.
- **R2-m4 (print, the mug's `yardStrip` / name).** Long mug names touch the 0.5 in handle line with 0 px to spare
  ("Captain Fluffybottom", `samples/mug.png`). Fix: a 20-30 px inner margin.
- **R2-m5 (email, `mail.js`, the thanks email).** "Printing takes 2-5 days … posted by … about 5 to 11 working days to reach you"
  still reads as adding up (the page's M4). Fix: use the page wording "from payment to your door, printing included".

## Checked and fine

- Code: B1 (the automatic reads, the 15-minute retry, one 24 h owner mail, the daily re-read of 5 per cron run, crash safety); the M2
  cap (only before the first send, the same key and amount on retries) and the refused-for-good handling; M3 (dispute statuses, the
  inquiry), m1 and m2. The `t_fix9` tests check real behaviour, not only the happy path; they miss R2-M1, R2-m1 and R2-m2.
- Suites: merch_worker 260/260; merch_page with `P9=1` 599/599.
- Page at 360x640, 390x844 and 1280x720: no sideways scroll, every tap at least 44 px, no text spill, no console errors. Phone M1 (the
  field and its message visible in a 330 px keyboard view), M5, M6, M7, M8, m2 and m9 are really fixed.
- Prints (`pp1-5688199b`, 24 files rendered at full size): every tee file is alpha 0 or 255; a clean 1 px backing on white tees; the
  name band right; patches clean on navy and black; the mug seam lands on a whole gap and the base is level; fills stay inside their
  outlines.

## Could not check

- A real DTG or mug sample (the white backing, the mug's face direction): part 10.
- Real Stripe and Printful answers (no network calls, by the rules): the sandbox run.
