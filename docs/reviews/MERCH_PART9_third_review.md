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
