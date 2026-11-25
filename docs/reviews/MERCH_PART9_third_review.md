# Merch part 9: the review of the second fix batch (money logic)

25 Nov 2026 (JST). One read-only code review of `git diff fb48a9f..ecddc13 -- cloudflare/merch` (the second review's nine fixes,
`cloudflare/merch/test/t_fix9b.mjs`), at 22c0fb5. Written up by the MERCH session from the reviewer's hand-back (the reviewer is
read-only). The reviewer's probes were run with the test harness; every finding below was confirmed by a probe.

**Verdict: not ready for the sandbox run.** Two new money holes in the R2-M3 reship code, one older hole next door, three minor
points. 0 blocker, 3 major, 3 minor. The full suite is green at 22c0fb5 (282 of 282).

## Major

### R3-M1 (`ledger.js:1102`): a reshipped line can still be refunded at 7 days

- A line moves to Printful's new parcel only if two things are both true: the new parcel is inserted in this read, and the old
  parcel was already marked returned before the loop reaches it. Otherwise the line stays in the returned parcel and is refunded at
  7 days, even though the buyer has the reship: the buyer ends up with the item and the money.
- Probe A1: one read lists the shipments newest first, [reship, returned]: hold reship, the address email sent, refunded at 7 days
  (2 "On its way" emails and 1 refund). Probe A2: the reship hint lands first and the returned flag comes in a later read: 1 refund.
- Fix: in `applyProvider`, mark every `s.returned` parcel first. Then, in a second pass, move every live line whose parcel is returned
  and whose external id appears in a non-returned shipment of `d` (inserted now or earlier). Only then check whether the hold ends.
  Printful v2's `is_reshipment` could also be used as a hint.
- Tests: F9b-M3-order (the shipments reversed) and F9b-M3-late-flag (the reship seen before the return): 0 refunds, the hold cleared.

### R3-M2 (`ledger.js:1266`): a reprint's failed read is never counted, capped or told

- The 7-day reship refund reads a reprint's Printful order with a bare `provider.get`. Unlike `readPrinter`, it never calls
  `readFailed` and skips the `PF_READS_TICK` cap. If that read keeps failing, the refund never comes, the owner never hears, and the
  order is read every 15 minutes for ever.
- Probe H: a reprint's parcel came back, then that Printful order answers 404. After 9 days: hold still reship, 0 refunds, 194 GETs,
  and the only owner email was the nightly report. The buyer paid, the parcel came back, and they are never refunded or asked.
- Fix: route reprint reads through a shared helper that counts toward `PF_READS_TICK` and writes `pf_wait` / `pf_read_fail`, so
  `printer_unread` goes out after `PF_TELL`. After `PF_TELL` of failures, either refund those lines and email the owner, or hold the
  order for review with an owner email. The same in the daily reprint re-read (line ~1822).
- Test: F9b-M3-rp-unread: the owner is told within about 24 hours and the case ends.

### R3-M3 (`ledger.js:1091`; older than this batch, next door to R2-M3): an `onhold` read or hint overwrites any hold

- It also has no `d.id === o.provider_order` check.
- Probe C: a part-shipped order with hold reship, then the main order goes on hold at Printful: hold becomes provider. When Printful
  releases it: hold null, the address form answers 409 `not_needed`, and after 8 days nothing is reshipped or refunded. The returned
  mug is stuck for good. Probe G: a reprint order on hold put the main order on hold as well.
- Fix: require `String(d.id) === String(o.provider_order)` and `!o.hold`. When there is a reship hold, email the owner instead.
- Tests: F9b-M4-onhold-reship and F9b-rp-onhold.

## Minor

- **R3-m1 (`ledger.js:1018`).** A lost close cancels only queued, need_address and held reprints; a reprint already confirmed at
  Printful keeps going (probe B). The lost close sends the owner no email at all (that silence is older than this batch).
  Fix: on a lost close, email the owner with any confirmed reprints and unshipped main lines; ask Printful to cancel a reprint that
  has nothing posted, the way `lateRefund` does with `pcancel`. Test: F9b-M4-confirmed-reprint.
- **R3-m2 (`ledger.js:993`).** The late-created guard compares the event only with the single stored `dispute_id`. A close for a
  second dispute that arrives before its own created keeps the old id, so the late created reopens the dispute (probe F: A won, then
  B closed lost, then B created: the order ends `open` with dp_b, for good; had B been won, a paid order would be paused for good).
  Fix: write `x:dclosed:<d.id>` at every close and have created check for that event (or store the close's own `d.id`).
  Test: F9b-m2-other-id.
- **R3-m3 (`ledger.js:471`).** A single transient 503 turns the late cancel into a refund without reading Printful (probe D: posted
  with its hint lost, then one 503: 200, refunded, the item fulfilled at Printful, only the owner email went out).
  Fix: retry the read once inside the request. If it still fails, record the cancel request and let the alarm refund after a good
  read, refunding without a read only after `PF_TELL`. The buyer's right stays dated from when they asked.
  Tests: F9b-M1-unread-once, plus the existing -unread row moved to the new rule.

## The tests

- The 22 F9b rows were run on fb48a9f (the old merch code with the new test file): 20 fail for the stated reasons. F9b-M2-lost is a
  neighbour row and passes on the old code as expected. **F9b-M1-still** also passes on the old code: its "Printful read first" check
  passes on any GET; it should look for a GET made after the cancel call and before the refund.
- No row covers R3-M1, R3-M2, R3-M3, R3-m1, R3-m2 or R3-m3.

## Checked and fine

- `late_eta` moves only once per dispute: `wasOpen` blocks replays and second closes; the close and the admin-confirm paths cannot both
  apply. An inquiry that becomes a chargeback resets `disputed_at`, so the date moves only by the chargeback's open time.
- `hold_at` is always set by `pause()`. The fresh 7 days is granted once per open-to-won change.
- A cancel racing the alarm's `late_auto`: the snapshot check stops a double refund; a second tap gives 409.
- Snapshot starvation: only `set()` bumps `updated_at`, and a read with identical data writes nothing through `set()`, so there is no
  ping-pong. Line-level changes are outside the snapshot, but `applyProvider` only moves lines forward, so that is harmless.
- The lost-parcel refund's 409 `disputed` check runs with no await before its transaction.

## Could not check (for the sandbox run and the Printful key)

- Printful's real webhook retry policy, and whether repeated 502s can get the webhook switched off. The daily re-read never covers
  `shipped` orders without a reship hold, so a lost `package_returned` hint there is never caught.
- The order in which Printful really lists shipments.
- The Durable Object's input-gate behaviour under workerd (the harness does interleave calls at awaits, and the code is right for that).

## Fixes (third review)

25 Nov 2026, branch `merch/part9-fixes3` from b7ef7ab, fixes in 37f5c44. Tests: `cloudflare/merch/test/t_fix9c.mjs` (rows F9b-*, in the
merch_worker run, 298 of 298). Each finding's new rows fail on b7ef7ab (checked with the old `ledger.js` and `mail.js`); F9b-M3-rp-back is a
neighbour row (on b7ef7ab it stops only at the new `read_fail` column).

- **R3-M1** fixed as recommended: `applyProvider` works in three passes (store parcels and mark the returned ones; move every live line of a
  returned parcel found in a parcel of the read that did not come back, new or earlier, the newest first; only then ask for an address for
  lines still in a parcel marked returned in this read; then the hold check). Tests F9b-M3-order, F9b-M3-late-flag, F9b-M3-part-reship.
- **R3-M2** fixed: every reprint read goes through `readPf` (the same memo, cap and failure bookkeeping as `readPrinter`; a reprint's failures
  in `merch_reprints.read_fail`), in the 7-day reship step and the daily re-read. The daily re-read retries hourly, tells the owner once after
  24 hours (`printer_unread`), then reads once a day. In the reship step, 24 hours of failed reads end the case with the review's safer
  option: held for the owner (`hold = review`, `why = reship_unread`, status unchanged, no wake, the form shut), one owner email, no refund.
  Chosen because the code's rule is "never refund blind" and a returned parcel may have been reshipped by Printful. Tests F9b-M3-rp-unread,
  F9b-M3-rp-back, F9b-M3-rp-cron.
- **R3-M3** fixed as recommended: an `onhold` read holds the order only for our main Printful order and only with no other hold; with a reship
  hold the owner is emailed and the reship goes on; a reprint on hold is an owner email; a reprint read never lifts the main order's hold.
  Beyond the review, its other side: a parcel that comes back while Printful holds the order starts the reship (`part_shipped`, owner told)
  instead of a `held` order with a reship hold nobody could answer. Tests F9b-M4-onhold-reship, F9b-rp-onhold, F9b-M4-returned-onhold.
- **R3-m1** fixed as recommended: the first lost close sends one owner email (`dispute_lost`) naming reprints still going and the main
  order's lines not posted; a confirmed reprint with nothing posted is asked to cancel at Printful (reprint status `pcancel`, retried while
  Printful is down; cancelled: the old line back; refused: back to `confirmed`, owner told). Tests F9b-M4-confirmed-reprint,
  F9b-M4-lost-posted.
- **R3-m2** fixed as recommended: every close writes `x:dclosed:<dispute id>`; a created for a closed id is ignored. Test F9b-m2-other-id.
- **R3-m3** fixed as recommended: the late cancel reads twice; still unread, it records `late_ask_at`, answers 200 `refund: 'pending'` (the
  page says "Your cancel is in ... your refund follows: we'll email you" and no longer offers the late cancel), asks Printful to cancel when
  nothing is known to have shipped, and counts the failed read. The alarm decides after the next good read (`askDecide`): posted before the
  ask, nothing refunded and one new kind buyer email (`late_posted`); otherwise the late part, posted after the ask too, refunded once. No
  good read 24 hours after the ask: refunded on what we know, owner emailed. Tests F9b-M1-unread-once, F9b-M1-ask-posted, F9b-M1-ask-after,
  F9b-M1-ask-tell; F9b-M1-unread moved to the new rule (it now expects 200 pending, no refund until a good read).
- **F9b-M1-still** tightened: it now looks for a Printful GET between the cancel call and the first refund (fails on fb48a9f, passes after).
