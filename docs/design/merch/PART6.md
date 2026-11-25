# Merch part 6: the emails, the order page, the thank-you gift (25 Nov 2026)

Built on branch `merch/shop` on top of parts 1-3. **Nothing is deployed and no outside service was called**: the emails go through the same
`MAIL_FETCH` seam as before (a fake in the tests), the page talks to the fake order server in test mode. Suites: `merch_worker` **166 checks**
(was 156; new rows `P6-*` in `cloudflare/merch/test/t_part6.mjs`), `merch_page` **1339 checks** (was 632; every order state at three sizes).

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
  you" top; the paid basket is emptied; an open order re-reads every 5 s for a minute), paid in the cancel hour, every hold (`review`, `render`,
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
| `thanks` | Thank you for your order | the lines with prices, shipping, the USD total, "You paid {pres} at checkout", the cancel hour ("within 1 hour of paying", only while it is still open), what happens next and the delivery estimate, the gift block, the order page |
| `address` | We need your address | the lines (for a reship: the parcel's lines), type the address on the order page, we don't keep it, 7 days then a refund, the refund-instead choice (not for a reship) |
| `ship` | On its way | the parcel's lines, the carrier, the tracking link (https only), "the rest travels in its own parcel", 30-day damage promise; the gift block when the Thank you email went before the gift existed |
| `cancelled` | Your order is cancelled | the lines, the amount refunded, shipping too, "it can take a few days to show on your card", put them back in the basket |
| `refunded` | A refund for part of your order | the amount and the lines (one email for several lines), why when it is the buyer's own choice or a loss, never the owner's own words |
| `refunded_all` | Your order is refunded | "in full", the amount, why (couldn't make it, the address, the late part ...) |
| `reject` | Sorry, we couldn't print one thing | the line, its refund, "the rest goes on" |
| `late` | Taking longer than we said | the promised date, the new date or "We don't know the new date yet", the late lines, the choice: wait (do nothing) or cancel the late part for a full refund from the order page |
| `reprint` | A new one is on its way | the reprinted lines, nothing to pay |

Every email: the order id, the order page link, the footer (Seller line when set, Terms of sale, Shipping and returns, Privacy, "Questions? Reply to
this email or write to contact@doodledoggo.app"). Never an address, an email address (but ours), a card, the printer's name, "buy", "sell" about
dogs, an emoji, urgency, or a model or AI mention. Samples for one order: `part6_shots/emails/<kind>.html`, `.txt` and `_390.png`.

## The thank-you gift

- One code per order from `merch_gift_pool`, claimed whenever an order **becomes `paid`** (in `set()`): a normal payment at once, a held order
  (review, a won dispute, the 4th order of a day ...) when it is released. Held at payment means its Thank you email went without the gift, so the
  **first "On its way" email carries it**; the order page shows it as soon as it is claimed.
- **An empty pool = no gift**: never an error and never a mention, anywhere.
- **A cancelled or refunded order keeps its code** (a gift is a gift). The game's gift codes of one group are one per account, so someone who
  orders and cancels again and again gets one item at most: the cost of misuse is one cosmetic.
- The owner adds codes with `tools/merch.sh gift add < codes.txt` (one per line; the file kept outside the repo; never an argument; codes go to curl on
  STDIN, the key through a file descriptor; nothing printed but counts). `gift count` = `{left, claimed}`. The route answers counts only.
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
5. **Several refunded lines = one email** (late part, reship timeout, lost parcel). A per-line owner refund stays one email each.
6. **The gift claim moved from `paidFrom` to `set()`** so every way to `paid` gets it; the claim order is the pool's insertion order (was by code).
7. **The late choice**: "Keep waiting" sends nothing to the server (silence keeps the order). Whether the US rule wants an explicit yes when no new
   date is given is a question for the adviser (below).
8. **`?new=1`** empties the page's basket once the order shows as paid or later.
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

- **Part 5 (Printful)**: a new expected date for the delay email (`about.new_eta`; today always "we don't know yet"); the carrier names as Printful sends them.
- **Part 9 (sandbox and Resend)**: Resend domain set-up (SPF/DKIM), **open and click tracking off** for the domain; the `success_url` with a fragment;
  that `MAIL_FROM` shows "Doodle Doggo" as the sender name if wanted (`"Doodle Doggo <orders@doodledoggo.app>"`); one real email of each kind to
  check in Gmail, Outlook and Apple Mail (dark mode too).
- **The adviser**: whether "keep waiting" needs an explicit yes from the buyer when no new date is given (US mail-order rule); if so, a small route
  to record it.
- **The owner**: `MERCH_SELLER_NAME` and `MERCH_SELLER_ADDR` (with the seller page), `MERCH_GIFT_NAME`.
- Translation: English only at launch (TRANSACTIONS 7).

## For the Game Manager

- Make the gift item and a **code group** for it with `tools/promo.sh batch` (one code per account per group), then hand the codes to the owner as a
  file outside the repo; the owner runs `tools/merch.sh gift add < codes.txt` (DRY_RUN=0) against the merch Worker. Suggested group name:
  `MERCH-THANKS`; keep the batch large (the pool warns under 10).
- Set `MERCH_GIFT_NAME` to the item's name (as players see it in the Wardrobe) on both Workers.
- The order page link form is `<MERCH_SITE>/merch/#/order/<id>`; `MERCH_SITE` is `https://doodledoggo.app` (live) and `https://test.doodledoggo.app` (test Worker).
- The legal pages at `/merch/terms/`, `/merch/shipping/` and `/merch/seller/` are linked from the page and every email: they must exist before launch.
- Merge `cloudflare/merch/**`, `site/merch/*`, `merch/test_page.js`, `tools/merch.sh`, `docs/design/merch/**`; no shared file was touched.
