# Merch part 6 review: order emails, the order page, the thank-you gift (25 Nov 2026)

One combined review (code, phone layout, words) of commits 82f6228, 76fa57c, f54f829 on `merch/shop`. Written by the MERCH session from
the reviewer's report. Suites at review time: merch_worker 166/166, merch_page 1339/1339 (82 s).

**Verdict.** Careful work. The HTML email is escaped all the way through (hostile names, colours, carriers, sizes, gift codes and gift names
were tried: nothing got through). The gift code does not leak into events, the export, `show`, the report, owner emails or outbox notes. The
admin gift route authenticates, answers counts only and keeps duplicates out. Old outbox rows without a note still send. The layout holds at
360, 390 and 1280 in 9 states (a 6-line order with long names too): nothing overflows, no tap under 44 px, no body text under 15 px. Not
ready as it was: 2 must-fix problems (the delay email, the gift claim) and a few page bugs that lose a basket or give a wrong message.

## Findings

| # | Sev | Finding | Decided fix |
|---|---|---|---|
| 1 | must | The delay email cannot meet the US mail-order rule. `ledger.js` 581 always sets `new_eta = null` ("We don't know the new date yet"); "Keep waiting" tells the server nothing; with no date, silence is not consent; nothing asks again or refunds by itself. The email says "we said your order would be sent by <ship_by>" (`mail.js` 196) but no buyer text ever gave that date. | The delay plan below (a-d). |
| 2 | must | The gift can be farmed: a code is claimed when the order becomes `paid` (`ledger.js` 120), the Thank you email carries it inside the cancel hour, and a cancelled order keeps it. "Order, cancel within the hour" empties the pool and costs a Stripe fee each time. | Reserve at paid, hidden; show it when the cancel hour ends; a cancel inside the hour puts the unseen code back. See "The gift" below. |
| 3 | should | `?new=1` stays in the address bar and in bookmarks (`merch.js` 576; the page says "bookmark it"): reopening later empties the buyer's new basket, and the title stays "Thank you! Your order is in." even once shipped (653). | Drop `new=1` with `history.replaceState` after the first read; clear the basket once per order only (paid less than an hour ago). |
| 4 | should | Cancel errors: anything but `not_allowed` (`offline`, `slow_down`, `busy`) says "It's too late to cancel: printing has started" while the hour is open (`merch.js` 801); `say()` writes only to the hidden live region, so sighted buyers see nothing. `act:ip` allows 10 actions an hour, shared with address tries. | Each error its own words, shown in `ORD.note`. |
| 5 | should | Several lines refused by the printer at once: `lineRefund` runs per line (`ledger.js` ~1108), so each line but the last gets "Sorry, we couldn't make one thing" and the last "refunded in full", in the same moment. Render rejects landing together behave the same. | `refundLines(id, bad, 'provider')` with one email for the batch. |
| 6 | should | The Thank you email has no Tax row (`mail.js` 129): for a US buyer the rows do not add up to the total. | Add Tax when `tax > 0` (the page does). |
| 7 | should | Gift words promise more than the code system gives: "Each game account can use one merch thank-you code" holds only inside one promo batch, and `promo.sh batch` makes a new batch id each day; PART6.md 126 says "a code group with `promo.sh batch`" but `batch` has no `--group`. A batch with `--to` hands out dead codes after its end date. The `promo.sh` CSV (`code,batch,made_at`) piped to `gift add` fails as "no codes on STDIN". | Soften the sentence; PART6.md: no end date, the Game Manager decides the group; `gift add` takes the first CSV column and skips a header. |
| 8 | should | An order refunded after delivery shows step 3 "On its way" with nothing marked Arrived (`merch.js` 644: `allCame` needs `shipped`). A shipped or delivered order under dispute is titled "Your order is paused... Nothing more happens". | `allCame` from the parcels alone; other words for a dispute after posting. |
| 9 | small | The late box does not name the late items; its words differ from the email's and from the button ("cancel it" / "Cancel the late part"). Late cancel is refused while `confirming` (`ledger.js` 350) though the delay email is sent in that state. | Tag the late lines, one label, allow `confirming` (or say why). |
| 10 | small | After 12 polls (1 minute) on an open order polling stops silently while the text says "This page shows it as soon as it arrives" (`merch.js` 577). | Keep polling every 30 s for up to 10 minutes, then say "Reload this page in a minute". |
| 11 | small | The yes/no dialog opens with focus on the destructive "Yes, refund me"; after it closes focus drops to `<body>`. | Focus on No; after the redraw focus the order title. |
| 12 | small | `MERCH_SITE` is never checked (`util.js` 42): a `javascript:` value would become every link in the emails. | Accept only `^https://[a-z0-9.-]+$`, else the default. |
| 13 | small | Facts are read at send time without looking at the order's state: a retried Thank you after a cancel still says "our print partner makes each one"; a part refund email sent after the rest was refunded says "the rest goes on as before". | In `mailView`, skip or reword `thanks` / `refunded` when the order has since ended. |
| 14 | small | `merch.sh gift add` exits 1 when the code count is an exact multiple of 1000; a body over 64 KB is answered "1 to 2000 codes". | `if` instead of `&&`; 413 `too_big`. |
| 15 | small | The fake differs from the Worker in two places: the demo order answers `name` when `name_on` is false (Worker: null); `canCancel` has no 120 s grace. The step dots are emoji (from part 2; hidden from screen readers). | Fix both; numbered dots with a drawn tick, no emoji. |
| T | should | Test gaps: order states use 3 lines only; no refunded-after-shipping, dispute-after-posting, `confirming` or `?new=1` revisit case; nothing tests the US tax total in the email or several lines refused at once; the `cancel_until` and "same day" checks use the real clock (could flake near midnight). | Add each; a fixed clock. |

## The delay plan (finding 1; also part 7 review finding 4)

- **(a) One posting promise.** `export const SHIP_BY_DAYS = 7` in `cloudflare/merch/catalog.js`; `ship_by` = payment + 7 business days
  (today 5 business days + 2 days, `ledger.js` 687). The buyer is told the date: the Thank you email and the order page say "We'll post it
  by <date>" (`page(o)` answers `ship_by`). The shop page and the legal pages say "we post every order within 7 working days of payment".
- **(b) A revised date.** The first delay email goes out at `ship_by` (not after) with a definite new date: `late_eta` = `ship_by` + 7
  business days (`LATE_MORE_DAYS`; the printer's own date when part 5 has one, never more than 30 days). With a definite date, waiting needs
  no answer.
- **(c) If the new date is missed too.** At `late_eta` with lines still not posted: if the buyer pressed "Keep waiting" (now recorded on the
  server, `late_ok_at`), one second notice `late_again` (key `me_<order>_late_2`): no new date, "you can cancel the late part any time until
  it's posted". If the buyer did not say so: the late part is refunded in full by itself, kindly, and the printer is asked to cancel it (the
  same path as the late cancel; the owner is told if the printer cannot).
- **(d)** "You can cancel the late part any time until it's posted" in the email and on the page.
- New point for the owner's launch list (TRANSACTIONS.md 10): the automatic refund of a late part at the missed new date.

## The gift (finding 2)

A code is **reserved** for the order when it is paid (stored, hidden: the order answer says `gift: 'soon'`, never the code), **shown** when
the cancel hour ends (the order page, and the first email after that: "On its way"; the Thank you email says a little gift will be on the
order page once printing starts, only when a code is reserved). A cancel inside the hour puts the unseen code back in the pool. After it is
shown the order keeps it whatever happens (a gift is a gift).

## Worker-side items moved here from the part 7 review

- **(e) Delivery times from one source:** `ZONES[*].eta` in `catalog.js` (door to door = 2 + post at best, `SHIP_BY_DAYS` + post at worst;
  estimates until part 5). `site/merch/catalog.json` is generated from `catalog.js` (`tools/merch_catalog_json.js`) and a test checks they
  are equal; the launch plan's shut countries live in `catalog.js` too. The legal pages follow (their suite reads `catalog.js`).
- **(f)** A line the printer or the render rejected gets `keep_until = now + 2 days` (today its print file is kept for ever).
- **(g)** Order rows: TRANSACTIONS.md 5 says "at least 7 years" (`tidy()` deletes no paid order); no purge is built now.
- TRANSACTIONS.md 4 and 5 take the part 7 wording ("the last day of the delivery time shown for your order").

## Checked and fine

Gift claim: one statement, idempotent (a webhook twice, a release, a confirm, a won dispute keep one code); empty pool = no gift, no
mention; the low-pool owner email once a day. Outbox keys unchanged; one email per `refundLines` call; "refunded in full" once. Every value
escaped in the HTML; tracking links https only; subjects fixed strings; no buyer email or postal address in any body. The page escapes all
server text, shows every parcel's tracking link, keeps address values nowhere, has labels, `aria-invalid`, `aria-describedby`,
`autocomplete="shipping ..."`, focus on the first bad field, Copy works without clipboard permission. Emails: no remote images, no scripts,
`color-scheme: light`, the text part reads alone; kind words; the printer named only in owner emails; no emoji in emails. The gift steps
match the game (`55_promo.js`). PART6.md and the TRANSACTIONS notes match the code apart from finding 7.
