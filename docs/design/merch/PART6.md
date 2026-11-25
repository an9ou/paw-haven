# Merch part 6: the emails, the order page, the thank-you gift (25 Nov 2026)

Built on branch `merch/shop` on top of parts 1-3. **Nothing is deployed and no outside service was called**: the emails go through the same
`MAIL_FETCH` seam as before (a fake in the tests), the page talks to the fake order server in test mode. Suites: `merch_worker` **166 checks**
(was 156; new rows `P6-*` in `cloudflare/merch/test/t_part6.mjs`), `merch_page` **1339 checks** (was 632; every order state at three sizes).
After the review batch (25 Nov 2026, "Review fixes" below): `merch_worker` **181**, `merch_page` **1624**, `merch_legal` **381**.

## What was built

- **`cloudflare/merch/mail.js`**: `build(kind, view, env) -> {subject, text, html}`, a pure function (no network). One list of blocks is drawn twice,
  as plain text and as a small HTML page (inline styles only, the site's paper and ink colours, no remote images, no fonts, no tracking, no scripts),
  so both always say the same and the text reads fine alone. The view is the buyer-safe `page(o)` of the ledger plus colour names, the delivery
  estimate and what the email is about (`ledger.mailView(row)`), read **at send time**. The owner emails (`ownerBuild`) say what happened, the order
  id, what to do and the `tools/merch.sh` command; the nightly report is lines of words (`reportText`), never JSON.
- **The outbox row remembers what it is about** in its existing `note` column, as ids only (`{parcel}`, `{refund, reason}`, `{refunds, reason}`,
  `{line, refund}`, `{reprint}`, `{reship}`); no schema change. Rows written before part 6 have no note: their key (`me_<order>_ship_<parcel>` ...)
  says the same, and they still send (test P6-outbox).
- **One order link form** (`util.js` `orderLink`): `<MERCH_SITE>/merch/#/order/<id>` in every email and owner note; Stripe's `success_url` is
  `<MERCH_SITE>/merch/?new=1#/order/<id>`. The old `/merch/order/<id>` is a path the static site does not serve. `cancel_url` (`/merch/?back=<id>`)
  was not broken and is unchanged.
- **The order page** (`site/merch/merch.js`) works for a real `api.order(id)` in every state: open, waiting for the bank, `?new=1` (a calm "Thank
  you" top; the paid basket is emptied; an open order re-reads every 5 s for a minute, then every 30 s up to 10 minutes: review fixes), paid in the cancel hour, every hold (`review`, `render`,
  `provider`, `wallet`: "Getting ready to print. It's taking a little longer than usual."; `draft_mode`: "Getting ready to print."; `address` and
  `reship`: the address form; `dispute`: "Your bank is looking at this payment, so we've paused it."), confirmed, part shipped ("1 of 2 parcels",
  a tracking link per parcel), shipped, arrived, cancelled ("Put these back in my basket"), refunded, part-refunded lines ("Refunded: 1 of 2."),
  a rejected line, a reprint line ("A new one, free"), the late choice (Keep waiting / Cancel the late part), resting, expired, 404 ("We couldn't
  find this order") and a network error (kind words and Try again).
- **The address form**: the order's own country only (said, no picker); every error of `POST /merch/order/:id/address` in words at its field
  (`bad_address {field}`, `other_country`, `not_needed`, `busy`, `slow_down`, offline); "Refund me instead" (`POST .../refund`) only for `held address`.
  The values go to the server and are then dropped: nothing in localStorage or sessionStorage, the form is reset and removed after it is sent
  (checked by the suite).
- **`site/merch/api.js`**: `address()` and `refundHeld()`. **`api_fake.js`** answers the same routes as the Worker and always exactly the 6.3 order
  fields; test hooks `put(order)` (an order in any state, kept in this tab) and a stored order's `_fail.address` (`busy`, `address`, `slow_down`,
  `other_country`, once). `?demo=1` still works.
- **Legal links** in `site/merch/index.html`: the footer has Terms of sale (`/merch/terms/`), Shipping and returns (`/merch/shipping/`), Seller
  (`/merch/seller/`) and Privacy; the pay card links Terms of sale and Shipping and returns. Those pages are another agent's work.
- **The thank-you gift** (owner, 25 Nov: yes): see below.
- `tools/merch.sh gift add` (codes on STDIN) and `gift count`; the admin route `/merch/admin/gift`.

## The emails (subject lines)

| Kind | Subject | Carries |
|---|---|---|
| `thanks` | Thank you for your order | the lines with prices, shipping, Tax (when there is tax), the USD total, "You paid {pres} at checkout", the cancel hour ("within 1 hour of paying", only while it is still open), what happens next, "We'll post it by Thursday 10 December" and the door-to-door days, a word about the gift (only when one is reserved: it waits on the order page once printing starts; never the code), the order page |
| `address` | We need your address | the lines (for a reship: the parcel's lines), type the address on the order page, we don't keep it, 7 days then a refund, the refund-instead choice (not for a reship) |
| `ship` | On its way | the parcel's lines, the carrier, the tracking link (https only), "the rest travels in its own parcel", 30-day damage promise; the gift block when this is the first email after the gift was shown (once) |
| `cancelled` | Your order is cancelled | the lines, the amount refunded, shipping too, "it can take a few days to show on your card", put them back in the basket |
| `refunded` | A refund for part of your order | the amount and the lines (one email for several lines), why when it is the buyer's own choice or a loss, never the owner's own words |
| `refunded_all` | Your order is refunded | "in full", the amount, why (couldn't make it, the address, the late part ...) |
| `reject` | Sorry, we couldn't print one thing (several: "some things") | the line or the lines rejected together (one email), the refund, "the rest goes on" |
| `late` | Taking longer than we said | sent AT `ship_by`: the date we said, the late lines, the new date `late_eta`, "You don't need to do anything to keep waiting", cancel the late part for a full refund from the order page any time until it's posted |
| `late_again` | Still taking longer than we said | at `late_eta`, only when the buyer said keep waiting: no new date, still on it, cancel any time until it's posted |
| `reprint` | A new one is on its way | the reprinted lines, nothing to pay |

Every email: the order id, the order page link, the footer (Seller line when set, Terms of sale, Shipping and returns, Privacy, "Questions? Reply to
this email or write to contact@doodledoggo.app"). Never an address, an email address (but ours), a card, the printer's name, "buy", "sell" about
dogs, an emoji, urgency, or a model or AI mention. Samples for one order: `part6_shots/emails/<kind>.html`, `.txt` and `_390.png`.

## The thank-you gift

- (Review finding 2, 25 Nov 2026.) One code per order from `merch_gift_pool`, **reserved** whenever an order **becomes `paid`** (in `set()`; a
  held order when it is released) and kept hidden: the order answer says `gift: 'soon'` and no code. It is **shown** (`gift_shown_at`, the answer's
  `gift: 'ready'` with the code) in the transaction that takes the order past its cancel hour (`cancel_until` + 120 s, exactly when a cancel stops
  being taken: in practice the confirm, or `draft_mode`), and for a held order once it is released and its hour is over. A cancel or a full refund
  before that (or a lost dispute) puts the code back in the pool in the same transaction. Once shown, the order keeps it (a gift is a gift).
- The first buyer email sent after it is shown carries the code ("On its way", or a delay or reprint email when that comes first), **once**
  (`gift_mailed` = that outbox row; its retries keep it). The Thank you email never has the code; when one is reserved it says "A little thank-you
  for your dog in the game will be waiting on your order page once printing starts."
- **An empty pool = no gift**: never an error and never a mention, anywhere.
- The owner adds codes with `tools/merch.sh gift add < codes.txt` (one per line, or `tools/promo.sh`'s CSV: the first column, the header skipped;
  the file kept outside the repo; never an argument; codes go to curl on STDIN, the key through a file descriptor; nothing printed but counts;
  1000 a request). `gift count` = `{left, claimed}`. The route answers counts only (413 `too_big` over 64 KB).
- One owner email a day while fewer than 10 are left (`gift_low`) and when it is empty (`gift_empty`), only once a pool was ever filled; the nightly
  report says "Gift codes: N left, M given".
- The code is never in a log, an event, the report, `merch.sh show` (it says `gift_code: true`) or the export. Only test codes (`TEST-GIFT-0001`)
  are in the repo.
- The page and the email say how to use it, with the game's own words (`PROMO.md` 5, `game/src/55_promo.js`): open Settings (on a phone: the ⋯
  menu), "Have a code?", type the code; gift codes are for players with the free account (cloud save). The item's name comes from
  `MERCH_GIFT_NAME`; unset, it says "a little gift for your dog in the game".

## Decisions taken (the owner or the Game Manager may change them)

1. **Order link** `<MERCH_SITE>/merch/#/order/<id>`, success `/merch/?new=1#/order/<id>` (a fragment in Stripe's success_url: confirm in the sandbox, part 9).
2. **"Seller:"** labels the seller line (not "Sold by"); it is left out until `MERCH_SELLER_NAME` is set. Nothing invented.
3. **"colour"** (the page's spelling) in emails too; dates as "8 Dec 2026" (the page's form), in UTC in emails (the buyer's clock is unknown).
4. **The order id** is shown without `mo_` (as the page shows it); owner emails use the full id.
5. **Several refunded lines = one email** (late part, reship timeout, lost parcel, lines the printer or the renderer rejected together). A per-line owner refund stays one email each.
6. **The gift reservation is in `set()`** so every way to `paid` gets one; the pool's insertion order (was by code). Shown after the hour (review fixes).
7. **The late choice** (review fixes): a definite new date, so waiting needs no answer; "Keep waiting" is recorded (`POST .../wait`) and decides
   what happens at the new date (a second notice, or the late part refunded by itself).
8. **`?new=1`** empties the page's basket once per order, only within the hour after paying, and is dropped from the address after the first read.
9. Admin `gift` answers `{added, skipped, left}` (`skipped`: bad shape or already there), still counts only.
10. A held-address order's title is still "Thank you! Your order is in." with the form under it (kind, and the form says what is needed).

## Found in parts 2/3 while here (fixed)

- An order whose **only** line could not be rendered (or every line refused one by one) was refunded but **got no email**: it now gets "refunded in full".
- `/merch/order/<id>` (emails, Stripe) was a path the static site does not serve.
- The admin export and `show` returned the gift code; now `true/false`.
- The fake's demo order had fields the Worker never sends (`test`, `eta`) and lacked `pay_pending`, `dispute`; the page now marks test orders from the fake itself.

## Test map

`merch_worker` (`t_part6.mjs`): P6-mail-kinds (every kind from a real flow: one mug, a 6-line basket, a parcel, the delay email, the late
refund as one email, a part refund, a reprint, refunded in full, a reject, the address email; for each: subject, text and html, the order link,
the footer, the facts, no buyer data, no banned words, no remote content), P6-mail-pure (the builder alone: every kind, gift only with a code, the
gift name, the seller line, pres in zero/two/three-decimal currencies, escaping, a non-https tracking link, an unknown kind, MERCH_SITE),
P6-order-link (Stripe urls, the test copy, owner notes), P6-owner-mail (tidy, no buyer data, the report in words with the gift count, no html),
P6-gift-pool (empty pool, held then released, the late gift on the ship email, a cancelled order keeps its code, no code in events, outbox, meta,
report, show or export, a dispute first), P6-gift-low (one email a day under 10 and when empty), P6-gift-admin (auth, validation, dedupe, counts
only, merch.sh STDIN and no echo), P6-gift-release (the 4th order of a day, released after 24 h), P6-reject-last (the fixed email), P6-outbox
(once per key; a pre-part-6 row still sends).
`merch_page`: `orderStateChecks` (27 states: title, status words, cancel button, address form, late choice, gift, parcels, line tags, refunded
total, pres, put back; copy without clipboard permission; keep waiting and the late cancel; not found; a network error and Try again; the address
form's every error and that its values are kept nowhere; refund instead; the reship form; `?new=1`), `orderFitChecks` (every state, not found and
the network error at 360x640, 390x844, 1280x720: no sideways scroll, 44 px taps, text inside its card, contrast, money in ink), the fake's exact
field set and its address, refund and late routes, the legal links' hrefs. `SHOTS6=1 node merch/test_page.js` writes `part6_shots/`.

## Left for parts 4, 5, 9 and the owner

- **Part 5 (Printful)**: the printer's own expected date may replace `late_eta` (same 30-day cap); the post times behind `ZONES[*].eta`; the carrier names as Printful sends them.
- **Part 9 (sandbox and Resend)**: Resend domain set-up (SPF/DKIM), **open and click tracking off** for the domain; the `success_url` with a fragment;
  that `MAIL_FROM` shows "Doodle Doggo" as the sender name if wanted (`"Doodle Doggo <orders@doodledoggo.app>"`); one real email of each kind to
  check in Gmail, Outlook and Apple Mail (dark mode too).
- **The adviser**: settled in the review batch: a definite new date is always given and "keep waiting" is recorded; the automatic refund at a
  missed new date is TRANSACTIONS 10 point 13 for the owner.
- **The owner**: `MERCH_SELLER_NAME` and `MERCH_SELLER_ADDR` (with the seller page), `MERCH_GIFT_NAME`.
- Translation: English only at launch (TRANSACTIONS 7).

## For the Game Manager

- Make the gift item and its codes with `tools/promo.sh` (the Game Manager decides the group and how the codes relate to accounts: `promo.sh batch`
  has no `--group` today and makes a new batch id per run; **no end date** (`--to`), or codes handed out later would be dead), then hand the codes to
  the owner as a file outside the repo; the owner runs `tools/merch.sh gift add < codes.csv` (DRY_RUN=0; promo.sh's CSV is fine) against the merch
  Worker. Keep the pool large (it warns under 10). The emails and the page say only "Each code works once. Got more than one? Pass the extra to a
  friend who plays." (review finding 7).
- Set `MERCH_GIFT_NAME` to the item's name (as players see it in the Wardrobe) on both Workers.
- The order page link form is `<MERCH_SITE>/merch/#/order/<id>`; `MERCH_SITE` is `https://doodledoggo.app` (live) and `https://test.doodledoggo.app` (test Worker).
- The legal pages at `/merch/terms/`, `/merch/shipping/` and `/merch/seller/` are linked from the page and every email: they must exist before launch.
- Merge `cloudflare/merch/**`, `site/merch/*`, `merch/test_page.js`, `tools/merch.sh`, `docs/design/merch/**`; no shared file was touched.

## Review fixes (25 Nov 2026)

From `docs/reviews/MERCH_PART6_review.md`, as decided there. Worker tests in `cloudflare/merch/test/t_fix6.mjs` (rows `F6-*`, `T2.1-34`) unless
said; page tests in `merch/test_page.js`; legal pages in `merch/test_legal.js`. Suites: merch_worker 181, merch_page 1624, merch_legal 381.

| # | What changed | Where it is tested |
|---|---|---|
| 1, (a)-(d) | The delay plan. `catalog.js` `SHIP_BY_DAYS` = 7, `LATE_MORE_DAYS` = 7 (`LATE_MAX_DAYS` 30); `ship_by` = payment + 7 working days; the Thank you email and the order page say "We'll post it by Thursday 10 December" (the UTC date of `ship_by`, "by"). The first delay email goes AT `ship_by` with `late_eta` (stored, additive column) and "you don't need to do anything to keep waiting ... any time until it's posted". `POST /merch/order/:id/wait` records `late_ok_at` (same id check and limit as cancel, idempotent, only while late). At `late_eta` (a wake for held orders too; not while confirming or in a dispute): keep waiting said -> one `late_again` (`me_<order>_late_2`, `late2_sent_at`); else the late part refunded by itself through the late-cancel path (`lateRefund`: refund rows, the printer asked or the owner told, one kind email, `late_auto_at`), all in one transaction. Free reprint lines are never "late". The shop page and the legal pages say the one promise; the legal pages say the email comes "by that day" (it goes at the moment of `ship_by`) and that a late part is refunded by itself at a missed new date unless the buyer said keep waiting | F6-ship-by, F6-late-first, F6-wait, T2.1-34, F6-late-held, F6-crash-late; P6-mail-kinds; page: order states `late`, `latepart`, `lateok`, the Keep waiting / late cancel flow, the demo order's date; legal: the promise and the automatic refund word for word |
| 2 | The gift: reserved at paid (hidden, `gift: 'soon'`), shown when the cancel hour ends (`gift_shown_at`, in the transaction that moves the order on; a held order once released and past its hour), back in the pool on a cancel, a full refund or a lost dispute before that; carried once by the first email after it is shown (`gift_mailed`); the Thank you email only promises it | P6-gift-pool, F6-gift-race (cancel and the hour's end in both orders, during the confirm, the webhook twice, a release after a cancel, Dashboard refunds, a lost dispute), F6-gift-once, P6-gift-release; page states `giftsoon`, `giftnotyet`, `gift` |
| 3 | `?new=1` is dropped with `history.replaceState` after the first read; the basket is emptied once per order (`dd_merch_done_v1`) and only within the hour after paying; "Thank you" only for paid and held orders | page: "?new=1" checks (the address, the same order again, an old order, a posted order's title) |
| 4 | Each cancel error in its own words in the visible note (`too_late`, `not_allowed`, `offline`, `slow_down`, `busy`; the late cancel's `busy`: "try again in a minute or two") | page: "cancel error ..." checks, "late while confirming" |
| 5 | `refundLines` and `tellRefunds`: lines the printer refuses together, and render rejects (told once nothing of the order waits to render), get ONE email ("couldn't print some things"); everything refused: one "refunded in full" | F6-reject-batch, T2.2-28, P6-mail-kinds |
| 6 | The Thank you email has a Tax row (on top of the prices it adds up; inside them it says "included in the prices"); the order page labels the row the same way | F6-tax-mail; page state `tax` |
| 7 | "Each code works once. Got more than one? Pass the extra to a friend who plays."; `gift add` takes promo.sh's CSV (first column, header skipped); "For the Game Manager" above: no end date, the GM decides the group | P6-mail-pure, F6-gift-admin |
| 8 | Delivered from the parcels alone (a refund after delivery shows step 4); a dispute after posting keeps the order's own title and says the bank decides the money | page states `refundedafter`, `disputesent`, `arrived` |
| 9 | The late box names the late things and tags their lines "Running late"; one label, "Cancel the late part", on the page and in the emails; the late cancel stays refused while `confirming` (a confirm call in flight could still print refunded lines) with kind, true words | page states `late`, `latepart`; F6-late-held |
| 10 | Polls every 5 s for a minute, then every 30 s, up to 10 minutes; then "Reload this page in a minute" | page: "polls" checks |
| 11 | The yes/no dialogs open on the safe answer; No gives the focus back to the button; after an answer the order title has the focus | page: cancel and late dialog checks |
| 12 | `MERCH_SITE` only as `^https://[a-z0-9.-]+$`, else the default | F6-site |
| 13 | A Thank you whose order has ended by send time, and a delay email with nothing late any more, are `skipped` (not sent); a part refund email sent after the rest ended leaves out "the rest goes on" | F6-stale-mail |
| 14 | `merch.sh gift add`: `if` instead of `&&` (a multiple of 1000 codes exited 1), one awk pass (2000 codes in a moment); the admin routes answer 413 `too_big` over 64 KB | F6-gift-admin |
| 15 | The fake: no `name` when `name_on` is false; the 120 s grace; the order page's steps are numbered dots with a drawn tick (no emoji) | page: "the fake keeps the Worker's 120 s grace", every state's steps check |
| T | Order states with six lines, refunded after delivery, a dispute after posting, `confirming`, the `?new=1` revisit, the Tax row (email and page), several lines refused at once; the order page on a fixed clock (`clock.setFixedTime`, local noon) | the rows above |
| (e) | `catalog.js` is the single source: `ZONES[*].eta` = [2 + fastest post, `SHIP_BY_DAYS` + slowest post] (us_jp 5-11, ca_au_nz 4-16, uk_eu 4-27, world 7-27; estimates, sources in the file); `LAUNCH_SOON` / `LAUNCH_COUNTRIES` (the recommended launch value, no runtime change); `tools/merch_catalog_json.js` writes `site/merch/catalog.json` from it (the Worker's own `catalogOut`), `vat_included` only as the Worker says it (never while not registered). Found while here: places with no post (`NO_POST`) are left out by the Worker too, sizes listed smallest first | F6-catalog-json, F6-ship-by (the Stripe line), X-quote-cents; page: the catalog and the promise checks; legal: delivery times and open zones from `catalog.js` |
| (f) | A line the renderer or the printer rejected gets `keep_until` = now + 2 days (render, printer partial, printer all, `fullRefund`/`lineRefund`, a Dashboard refund) | F6-keep (tidy removes the file) |
| (g) | TRANSACTIONS.md 5 "at least 7 years"; 4 and 5 "the last day of the delivery time shown for your order". No purge | - |

**Decisions taken here** (the owner or the Game Manager may change them): the delay email says "by <date>" and the legal pages now say "we email
you by that day" (it goes at the moment of `ship_by`); the second-notice subject "Still taking longer than we said"; the late cancel is not
offered while `confirming` (kind words instead); the gift goes in the first email after it is shown, which may be the delay email; a lost
dispute returns an unshown code; `NO_POST` places are no longer listed or taken by the Worker; Australia and New Zealand's post time is the
regional "5-9" figure until part 5.

## Part 9 fixes (25 Nov 2026)

From `docs/reviews/MERCH_PART9_code_review.md` (the code review of `merch/shop` at 12d9fe4). Worker tests in
`cloudflare/merch/test/t_fix9.mjs` (rows `F9-*`, and the new contract rows `T2.1-35`, `T2.1-36`). Suite: merch_worker 259.

| # | What changed | Where it is tested |
|---|---|---|
| B1 | Never refund blind. Before the delay email, the automatic refund of a late part and the 24-hour refund of a `review` hold of an order Printful has past its draft (`pf_failed`, `pf_canceled`, `confirm_*`), `ledger.js` reads the Printful order (`readPrinter`, outside any transaction) and applies it (`applyRead` -> `applyProvider`) in the same transaction as the decision (`lateStep` -> `lateCheck(id, true)`; `workHeld`'s `refund`). A failed read writes only `pf_wait` (+15 min) and `pf_read_fail`: no decision; after 24 hours of failed reads one owner email (`printer_unread`). At most 10 reads an alarm. A confirm Printful did take (the owner sent it again in its dashboard) now ends a `confirm_*` hold as `confirmed`. The cron's daily re-read (`rereads`): every confirmed, part-shipped or Printful-held order and every confirmed reprint with something not posted, read once a day, 5 a cron run, the oldest first | F9-B1-repro1, F9-B1-repro2, T2.1-35, F9-B1-fail, F9-B1-tell, F9-B1-crash, F9-B1-held, F9-B1-confirm, T2.1-36 |
| M1 | A lost dispute: the late cancel (409 `not_late`), the owner's line refund (409 `disputed`) and `page().late` are refused or false while a dispute is open or after it was lost; `lateDue` has no step then at all (the first delay email waits too) | F9-M1 |
| M2 | `sendRefund`: a refund Stripe refuses for good (`stripe.refusedForGood`: 400, 402 or 404 but `lock_timeout`, `idempotency_key_in_use`, `rate_limit`) is marked `failed`, the order `refund_failed`, the owner emailed at once (`refund_refused`); never retried. A full refund is capped, before its first send only (`sent_n`), at what is left on the charge (`stripe.chargeOf`: `latest_charge.amount - amount_refunded`, USD charges), with `refunded` lowered by what was taken off; nothing left: the row is done with 0. The Stripe fake now refuses what Stripe refuses (over what is left, already refunded, charged back, an unknown payment, a key sent again with another amount) | F9-M2-cap, F9-M2-cap-retry, F9-M2-refused |
| M3 | Only `lost` is lost: `won`, `warning_closed`, `prevented` or any other close is `won` (the hold is released by `merch.sh confirm` as before). An inquiry (`warning_*` on `created`) is `dispute = inquiry` and an owner email (`dispute_inquiry`), never a pause and no block flag; `charge.dispute.updated` to an open chargeback status (or a new `created`) pauses it then. The statuses relied on are listed in TRANSACTIONS.md (part 9 notes) | F9-M3-inquiry, F9-M3-closed |
| m1 | A line refunded in full that Printful posts all the same: one owner email per parcel (`refunded_shipped`); the buyer still gets "On its way" | F9-m1 |
| m2 | The gift is shown only once the order is past its hour, drafted at the printer and at or past `confirming` (or `draft_mode`, or held after a confirm); an order whose lines are all rejected never shows it and the code goes back to the pool | F9-m2 |
| m3 | TRANSACTIONS.md rows T2.1-06, T2.1-31, T2.1-34, T2.2-23, T2.2-25, T2.2-42, the new T2.1-35 and T2.1-36, the part 9 notes and the webhook event list (`charge.dispute.updated` added) | - |

**Decisions taken here** (the owner or the Game Manager may change them): a failed printer read waits 15 minutes and the owner hears after
24 hours of them (the step never runs blind, however long); the daily re-read reads 5 orders a cron run; the delay steps (the first email
too) wait while a dispute is open; an inquiry does not block the buyer's email for future orders; a buyer's own late cancel and the owner's
refunds are not read from Printful first (a person chose them); a full refund is capped only for USD charges. **To do at the Stripe set-up
(part 9 sandbox):** subscribe the merch endpoint to `charge.dispute.updated`.
