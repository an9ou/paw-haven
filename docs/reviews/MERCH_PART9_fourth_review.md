# Merch part 9: the fourth review (the third fix batch, the wiring, the stand-in printer)

25 Nov 2026 (JST). One read-only code review at 29f9650 of three batches that had no review of their own: the third fix batch
(`git diff b7ef7ab..167d986 -- cloudflare/merch`), the wiring (`git diff 99a110d..3376171`) and the stand-in printer
(`git diff 4e42257..927a019`). Written up by the MERCH session from the reviewer's hand-back (the reviewer is read-only). The full suite
was green at 29f9650 (merch_worker 316 of 316). The reviewer did not run `tools/merch_test_deploy.sh`.

**Verdict: 0 blocker, 1 major, 5 minor.** Nothing found lets a live key reach the test Worker or lets test code run on the live Worker;
there is one narrow gap in the live-key check (R4-m2). The major is a regression in the R3-M1 "three passes" code: rare, but nobody is
told when it happens.

## Major

### R4-M1 (batch 1, `ledger.js:1215` pass 2, `provider_printful.js:273-276`): one line posted in two parcels, one comes back, nobody is told

- **Sequence:** a line of qty 2 that Printful posts in two parcels A and B (a split, not a reship). Then A comes back.
- **What goes wrong:** pass 2 treats B as "Printful reshipped it" and moves the line to B. The buyer is not asked for an address, the
  7-day step never refunds, the owner gets no email. The returned unit is simply gone. If B comes back instead, the line stays in A and
  the owner gets "nothing is reshipped (refunded, cancelled, in a dispute or held)": the wrong reason.
- **Old code (b7ef7ab):** in the A case it asked for an address, so this is new.
- **Root cause:** `mapOrder` drops `is_reshipment` and the per-shipment `quantity`, so a split and a reship look the same to the ledger.
- **Probe:** `mug(0, { qty: 2 })`, `pf.ship(po,[ext])` twice, one parcel marked returned. First parcel back: `shipped hold null ...
  address asked 0 owner returned mails 0`, and 9 days later `refunds 0 hold null reprints 0`. Second parcel back: `owner returned mails
  1 ("nothing is reshipped")`, then `refunds 0`.
- **Fix:** keep `is_reshipment` and the item quantities in `mapOrder`; in pass 2 move a line only to a shipment with the reshipment flag
  set, or, when the flag is missing, to a shipment first seen after the parcel was returned (`returned_at`); count quantities, so half of
  a line that came back is still asked for. Test F9c-split, both halves (no flag: address asked; flag set: moved, nothing asked).

## Minor

### R4-m1 (batch 2, `util.js:79-80`): a reply whose body never ends still hangs with no limit

`clearTimeout(timer)` runs when the headers arrive, before `r.text()`. A reply that sends headers and then stalls keeps the request (or
the alarm) waiting with no limit and no abort. Probe: a fetch returning `new Response(new ReadableStream({start(){}}))` with a 100 ms
limit printed `STILL WAITING after 2000 ms aborted: false`. Fix: keep the timer and the abort running until `r.text()` returns; a
stalled body is a `timeout`.

### R4-m2 (batch 2, `stripe.js:13`): the live-key check can be passed with leading whitespace

The check is `/^(sk|rk)_live/` on the raw value. On `MERCH_TEST:'1'`, `" sk_live_abc"` and `"\tsk_live_abc"` give `stripeReady = true`
(probe). Not probed: whether Stripe accepts the padded header. Fix: on the test Worker accept only keys that start with `sk_test_` or
`rk_test_` after trimming (an allow list, not a block list), and send the trimmed key.

### R4-m3 (batch 1, `ledger.js:1439-1447` reshipUnread): the buyer hears nothing after `reship_unread`

The buyer was asked for an address. Once the case ends with `reship_unread` the address form is shut (409), the page shows a plain
shipped or part-shipped order and no buyer email goes out. The `review` hold stays on a shipped order until some later Printful read
happens to clear it; the owner's `merch.sh refund` or `reprint` does not clear it. A second returned parcel then replaces `review` with
`reship`, because pass 3 counts only `status = 'held'` as held. No money lost, the owner is told. Fix: one kind buyer note ("we're
checking with our print partner and will write to you"); clear `hold = review, why = reship_unread` in `lineRefund` and `reprint` once
`reshipLines` is empty.

### R4-m4 (deploy; by reading, not probed): the test order server is open to anyone

`merch-api-test.doodledoggo.app` is public; CORS is not a gate. Anyone can pay a test order with card 4242: it spends browser minutes,
uses up the 10-a-day cap and makes the test Worker send real Resend emails to any address typed into Stripe. With the owner's Printful
key in run 2 it also creates real drafts with a stranger's address. Fix: on the test Worker send buyer emails only to an allow list
(e.g. `MERCH_TEST_MAIL_TO`), or require a shared test header or cookie on `/merch/checkout`.

### R4-m5 (tools, `tools/merch_test_build.mjs:98`; by reading, not probed): `--out` / `MERCH_TEST_OUT` is wiped

The folder is deleted with `fs.rmSync(OUT, {recursive:true, force:true})`; the only check is "outside the repo", so
`MERCH_TEST_OUT=$HOME` would delete the home folder. Fix: refuse a folder that is not empty and has no marker file the build wrote, or
delete only the build's own files.

### Not counted (not probed): run 1's stand-in drafts in run 2

Run 1's stand-in drafts (ids 931000xx) stay in the ledger. Once a real `MERCH_PROVIDER_KEY` is set, `printerEnv` removes the binding and
those ids are read, deleted and cancelled at real Printful. A 404 counts as "deleted", so nothing breaks loudly, but the ledger does not
know which printer made a draft. Suggestion: SANDBOX.md says run 2 starts on an empty ledger, or the ledger stores which printer made
each draft.

## Looked at and fine

- **R3-M1:** a reversed shipment list, a returned flag after the reship, a part reship (the F9b rows); a reship inside a reprint's own
  Printful order.
- **R3-M2, main order readable:** an unread reprint parcel on a two-line order whose tee was never posted ends in `review` /
  `reship_unread` after 8 days; the late wake comes back through the daily re-read (the delay email and the `late_auto` refund still go
  out); a stale `read_fail` / `pf_read_fail` is cleared by the daily re-read within the 7 days.
- **R3-M3:** an `onhold` hint on the main order only; never over another hold, held statuses included.
- **R3-m1:** a replayed lost close sends no second email; `cancelReprints` retries while Printful is down; a refused cancel sets the
  reprint back to `confirmed` and emails the owner.
- **R3-m2:** the `x:dclosed` check.
- **R3-m3:** the marker is cleared in the same transaction as the decision; a second tap answers `pending` again and never refunds
  twice; a dispute during the wait holds the decision and a won close resumes it; the `pf_canceled` branch is skipped while
  `late_ask_at` is set; the ask while Printful is down and back an hour later gives one DELETE, one refund, `refunded`, no false
  "could not cancel" owner email.
- **`netOf`:** Node never gets the global fetch; `providerReady` is false on the test Worker in live mode; `req()` refuses `sk_live` /
  `rk_live`; the race in `call()` handles an aborted fetch's rejection.
- **The page:** the API address comes only from the exact origin `https://test.doodledoggo.app`; Pay needs the prefix
  `https://checkout.stripe.com/` with the slash; the order id in the `nonce_used` link is checked; the page shows the `pending` note.
- **The stand-in's guards:** 401 to any key but its own; `printerEnv` removes the binding when a real key is set; the live `net()` drops
  `test-printer` unless `MERCH_TEST=1` and the binding are both there; the test entry answers 503 without `MERCH_TEST=1`; the build
  refuses a `PROVIDER_FETCH` binding in the toml.
- **The deploy script:** nothing goes to Cloudflare unless `DRY_RUN=0` and `MERCH_TEST_DEPLOY_OK=1` are both set (`BUILD_ONLY=1`
  downloads wrangler from npm and sends nothing else); it touches only `doodle-doggo-merch-test`, `doodle-doggo-merch-test-printer` and
  `merch-api-test`; it reads other Workers' cron schedules and changes nothing on them.

## Differences between the stand-in printer and real Printful that matter for the test run

1. **It never confirms, and the test Worker is in draft mode:** every order ends `held` / `draft_mode`. Nothing after a confirm runs in
   the sandbox (shipments, hints, re-reads, the late cancel's read and wait, the reship hold, Printful's own hold, reprints, the
   lost-dispute reprint cancel). A ledger bug in any of these, all of batch 1 included, passes the run; only the Node and Miniflare
   suites cover them.
2. **It never posts, returns or sends webhooks.** The hint route and the Printful webhook signature are never used. With no webhook
   secret and the mode not live, the test Worker accepts unsigned hints from anyone; each one triggers a read of the stand-in. Harmless
   with the stand-in, but not what live does.
3. **It never fetches the print file.** The signed `/merch/file/` URL, its expiry and the size checks are never used by a "printer";
   "Test Refuse File" is a canned answer, so a broken file route passes run 1.
4. **Its costs are our own `catalog.js` estimates:** always `done`, no tax or VAT. The cost-over-110% hold, `cost_unknown` and the
   `calculating` retries are never reached; the margins in the run are not Printful's.
5. **It checks the recipient only for blank fields and the magic name.** Real Printful refuses bad state or ZIP codes and more.
6. **"Test Printer Down" stops every order for 30 minutes**, not just the order that typed it.
7. **It frees an external id once its draft is deleted;** what real Printful does is not recorded. The ledger uses `-d<n>` ids, so this
   does not matter today.
8. **No 429, 409 or Retry-After answers, no split or partial shipments,** so R4-M1 cannot show up in the run.

## Fixes (fourth review)

25 Nov 2026, branch `merch/part9-fixes4` from 9815a07. Tests: `cloudflare/merch/test/t_fix9d.mjs` (rows F9d-*, in the merch_worker run,
333 of 333), plus page rows "R4-m4 page ..." in merch_page. Every F9d row fails on 9815a07 (checked with the old `ledger.js`, `util.js`,
`stripe.js`, `provider_printful.js`, `mail.js`, `test_printer.js`, `admin.js`, `worker.js` and `tools/merch_test_build.mjs`); every F9b row
stays green.

- **R4-M1** fixed as recommended, with the part-line case held for the owner. `mapOrder` keeps each shipment item's `quantity` (`units`)
  and the reshipment flag (`is_reshipment`, else `reshipment`; null when missing: an open question for the Printful key, PART5.md). The
  ledger stores the units of each line in each parcel (`merch_parcel_items`, new), when it first saw a parcel (`seen_at`) and the flag
  (`reship`). Pass 2 moves a whole line only to a parcel that is a reship of it (flagged, or with no flag first seen at or after the return);
  a parcel flagged "not a reshipment" never takes it. A line split over parcels never moves: when some of its units come back and are not
  reshipped, the order is held for the owner (`hold = review`, `why = reship_part`), one owner email names the units ("1 of 2 of line 1"),
  the buyer gets one kind note. Chosen over an address ask because a part-line reship does not fit the tables: a reprint makes the whole
  remaining line again and marks the old line replaced, so the unit that arrived would drop out of the refund count (a later refund of the
  reprint line would pay it back too); the address form and the 7-day refund take whole lines. The hold ends by itself when Printful
  reships those units, or when the owner refunds them (`merch.sh refund <order> <line> <qty>`) or reprints the line. While a whole-line
  reship already waits for an address, the part is an owner email only. The fake `pf.ship` takes `[external id, qty]` items and a `reship`
  option, and by default flags a parcel that posts again units already posted in full (as Printful would), so the F9b rows needed no change.
  Tests F9d-M1-map, F9d-M1-split-first, F9d-M1-split-second, F9d-M1-split-reship, F9d-M1-noflag, F9d-M1-flag-false, F9d-M1-mixed.
- **R4-m1** fixed as recommended: `call()` races the body read against the same timer; a stalled body is `timeout`, aborted. Test
  F9d-m1-body.
- **R4-m2** fixed as recommended: on the test Worker only `sk_test_` / `rk_test_` after trimming (an allow list); the trimmed key is sent.
  Alike for Printful and Resend: every key is trimmed (`util.js keyOf`) before any check and in the header, on the live Worker too, so
  " test-printer" is still the stand-in's word (no printer on the live Worker, nothing sent) and `printerNow` and `printerEnv` agree. Test
  F9d-m2-keys.
- **R4-m3** fixed: one kind buyer note (`checking`, "We're checking on your parcel": we'll write as soon as we know, nothing to do) when a
  case ends `reship_unread` (and for `reship_part`); `lineRefund` and `reprint` end the review hold (`endReview`) once no reship line, no part
  of a line and no reprint waiting for an address is left. Decided: a parcel that comes back while the order is held for the owner's check
  keeps that review (one owner email, `returned_review`), never a new reship or address ask, since the owner is already settling that
  order by hand. Tests F9d-m3-note, F9d-m3-clear, F9d-m3-second.
- **R4-m4** fixed in merch files, the page's part waits for the GM (SANDBOX.md F, G3). (1) On the test Worker buyer emails go only to
  `MERCH_TEST_MAIL_TO` (a Secret the owner sets; a `+tag` before the @ counts as the same mailbox, for the `+location_XX` trick); with no
  list none goes, the outbox row says `test_not_listed`, no owner email. (2) A shared test token: `tools/merch_test_build.mjs` makes a
  random one (kept when the same folder is built again), sends it as the test Worker's `MERCH_TEST_TOKEN` and writes `test_cfg.json`; the
  test Worker refuses a checkout (403 `test_only`), an order button (cancel, wait, address, refund) and an unsigned printer hint (401)
  without it, and with no token set (fail closed); CORS lets the test copy send `X-Merch-Test-Token`; the page sends it on every POST,
  read once from `/merch/test_cfg.json` on the test copy only. The live Worker and the live page never read or need it. Serving that file
  behind the password is the GM's G3 (cf_test.js, test_gate.mjs: not ours to edit): until then the test Worker takes no order. Tests
  F9d-m4-mail, F9d-m4-token, F9d-m4-build; merch_page "R4-m4 page ...".
- **R4-m5** fixed as recommended: the build wipes only a folder with its marker (`.merch_test_build`) or an empty or new one; a folder with
  other files, a file or a link is refused and left as it was. The deploy script now builds into one fixed folder by default
  (`$TMPDIR/dd-merch-test-build`), so the token stays. Test F9d-m5-wipe.
- **Not counted** (run 1's drafts in run 2): SANDBOX.md D6 says run 2 starts only after every run-1 order has ended, and how to tell the
  drafts apart: `merch_orders.provider` is now `stand-in` or `printful` (it was always `printful`). Guard: with a real key set, a stand-in
  draft is never read, deleted or cancelled at Printful (a delete is only forgotten here, event `stand_in_draft`; a read counts as failed;
  the address form makes a new draft). Test F9d-standin.
- **Docs:** SANDBOX.md A (step 10: `MERCH_TEST_MAIL_TO`; the token needs nothing from the owner), B (the variables, the build folder), C
  (the stand-in's differences from Printful, short form; `MERCH_TEST_MAIL_TO` missing), D (curl needs the token; E-5; D6), F (new G3, the old
  G3 is G4); TRANSACTIONS.md part 9 notes; PART5.md (the open flag question).
- **Left open:** the reshipment flag's real name and whether `quantity` is always given (with the Printful key, run 2); G3 by the GM before
  the run; a part-line reship stays the owner's by hand.
