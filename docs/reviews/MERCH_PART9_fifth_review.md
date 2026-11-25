# Merch part 9: the fifth review (the fourth fix batch and the pay driver's guards)

25 Nov 2026 (JST). One short read-only code review at d52ef4e of the fourth fix batch (`git diff 9815a07..1e830eb`, tests
`cloudflare/merch/test/t_fix9d.mjs`) and of the safety guards of `tools/merch_pay_driver.mjs`. Written up by the MERCH session from the
reviewer's hand-back (the reviewer is read-only). Every finding was confirmed by a probe on the test harness. The reviewer's run of
merch_worker was 326 of 326 (its worktree had no Miniflare, so those rows were skipped; the full run on `merch/shop` is 333 of 333).

**Verdict: 0 blocker, 1 major, 4 minor. Not ready for the sandbox run until R5-M1 is fixed**; R5-m1 and R5-m2 belong in the same batch.

## Major

### R5-M1 (`ledger.js:1902`, `partWaiting`): a part-line count counts the same unit twice, and the owner is told to over-refund

- `back` adds up the units in every returned parcel, so a unit that came back twice is counted twice. `paid` only counts refunds made
  since this hold began (`since = hold_at`), so a refund that settled an earlier return is not counted. The only cap is
  `l.qty - l.refunded_qty`, which still includes units the buyer has received.
- **Sequence 1 (the reship goes to the same bad address):** a mug of qty 2 posted as A(1) and B(1); B is delivered; A comes back;
  Printful reships it as A2 (flagged); A2 comes back too. Probe:
  ```
  A back: review reship_part [ '1 of 2 of line 1' ]
  A2 reshipped: null null
  A2 back: review reship_part [ '1 of 2 of line 1', '2 of 2 of line 1' ]
  owner refunds the 1 real unit: 200 hold review reship_part
  only a 2nd refund (B, delivered) ends it: 200 hold null refunded_qty 2 refunds [1999,1999]
  ```
- **Sequence 2:** qty 3 posted 1 + 1 + 1; A comes back, the owner refunds 1, the hold ends; B comes back: the owner email says "2 of 3
  of line 1" (the true number is 1); the owner refunds 1: the hold stays `review/reship_part`, still there 9 days later.
- **What goes wrong:** the owner email names too many units and its own instruction (`merch.sh refund <order> <line> <qty>`) pays back a
  unit the buyer has. If the owner refunds the correct number the hold never ends: only an over-refund or a whole-line reprint clears it.
- **Fix:** count only units that are not out in a parcel and not refunded; drop the `since` / `paid` term:
  `out = sum(q of this line's parcels with returned_at null)`, `waiting = max(0, min(back - again, l.qty - l.refunded_qty - out))`.
  Both probes become F9e rows.

## Minor

### R5-m1 (`ledger.js:1895-1898`, `reshipOf`): with no reshipment flag, the second half of a split is taken for a reship

Qty 2: A(1) is posted with the flag missing and comes back; the line's second unit B(1) is posted later, also without the flag. B was
first seen at or after the return, so it counts as a reship of A. Probe: return read first: the hold is set, then ends by itself when B
arrives (1 owner email, no refund, the unit is gone); return and B in the same read (the times tie): `hold null, owner 0, buyer 0,
refunds 0`. Matters only if Printful's flag is missing (the open question for run 2; the fallback exists for exactly that). Fix: with a
null flag, count a parcel as a reship only for units posted beyond the line's quantity: unflagged `again` <= `max(0, sum(all q) - l.qty)`.

### R5-m2 (`ledger.js:2068`, `rereads`): the daily re-read skips orders held for `review` after a return

The query covers `status = 'shipped' and hold = 'reship'` but not `hold = 'review' and why in ('reship_part', 'reship_unread')`. Probe (a
split line, a part back, Printful reships it flagged with no hint, 3 days of cron): `shipped/review/reship_part ->
shipped/review/reship_part, parcel= old`; the same with a whole-line `reship` hold does end. The owner may refund a unit that was
reshipped. Fix: add `or (status in ('shipped', 'part_shipped') and hold = 'review' and why in ('reship_part', 'reship_unread'))`.

### R5-m3 (`ledger.js:1272` and `reprint`): for a split line the owner email suggests a reprint, which prints the delivered unit again

`reprint` takes `qty - refunded_qty`. Probe (qty 2 posted 1 + 1, A back, `merch.sh reprint` line 1): `lines
[[1,"replaced",2,3998,0],[101,"confirmed",2,0,0]]`: 2 units, one more than needed, and a later refund of line 101 (by hand, late,
returned or the 7-day step) pays back 3998, the whole line, although the buyer has B. Fix: for `reship_part` offer only "refund N", or
make the reprint take a quantity.

### R5-m4 (low; `mail.js:277`, `mailbox`): the test allow list lowercases Unicode, so a look-alike domain passes

With `kate@kakao.com` on the list, `testMailOk` is true for `kate@` + a domain spelled with the Kelvin sign K (a different domain).
Display names, lists with spaces, quotes and `a@b.evil` are refused correctly. Low: a stranger cannot make an order without the test
token. Fix: refuse any non-ASCII address (`/^[\x21-\x7e]+$/`).

## Looked at and fine

- **R4-M1 mapping and migration:** the quantity parse; `flagOf` (true, false, missing); `init()` runs the migration before any read; old
  parcels have `seen_at` null and never count as a reship; the next read fills in units for old parcels before the return check; a
  replayed hint never changes `seen_at`; three parcels with a flagged reship; a Printful hold meeting a part hold; an open or lost
  dispute leads to the `returned` owner email only.
- **R4-m3:** `endReview` is called from `lineRefund`, `reprint` and the read; the `checking` email has one id per parcel or per
  `reship_unread`; `returned_review`.
- **R4-m1:** the body read races the same timer; an aborted body is caught (no double settle, no unhandled rejection); the limit was
  already for the whole call (20 to 25 s).
- **R4-m2:** the admin key, the Stripe and Printful webhook secrets and the file key are still compared raw; nothing compared raw before
  now compares trimmed values; the test Worker accepts only `sk_test_` / `rk_test_` after trimming.
- **R4-m4 on the live Worker:** `testToken` returns true unless `MERCH_TEST` is `'1'`; the allow list is checked only under
  `MERCH_TEST === '1'` (on live an unlisted address is sent); the header is forwarded and allowed by CORS only on test; `api.js` fetches
  `test_cfg.json` only on the exact test origin and sends the token only to the test API, on POST only; the token is compared in constant
  time, needs at least 32 characters, fails closed, is never logged, mailed or returned.
- **R4-m4, the test Worker's routes:** gated by the token: checkout, the order buttons (cancel, wait, address, refund), an unsigned
  printer hint. Not gated and fine: GET catalog, quote and order (no outside call); the Stripe webhook (signed); a signed printer hint;
  admin (its key); `/merch/file` (HMAC-signed links); `/merch/print` (static). Owner emails on the test Worker still go to
  `MERCH_OWNER_TO`, not through the allow list.
- **R4-m5 and the tools:** the marker rule (links and files refused); the token kept on rebuild, never printed, the build folder outside
  the repo; it is sent as a plain variable, visible in the dashboard (acceptable); nothing is sent without `DRY_RUN=0` and
  `MERCH_TEST_DEPLOY_OK=1`.
- **The stand-in draft guard:** only when `provider = 'stand-in'` exactly (old and null rows are Printful); a real Printful order is
  never stopped; the calls it does not guard need `confirmed_at` or live mode, which a stand-in order never has.
- **The pay driver:** the CLI cannot set `allowLocalTest`; `cs_live_` anywhere in the URL is refused; the URL is checked again after
  `goto`; locators never reach into other-origin frames; `payEmbeddedTestFrame` needs js.stripe.com, `pk_test_` and `cs_test_`; only
  Stripe test cards are accepted; no card number or buyer is printed; screenshots go to the temp folder unless `--shots` says otherwise.
