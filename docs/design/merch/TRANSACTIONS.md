# "My dog" merch: money and orders (contract, rewritten 24 Nov 2026 JST)

Status: a design only. No code, no deploys. Every Worker, Stripe, Printful or money step below needs the owner's approval (CLAUDE.md, V224.md).
Merch is a **special update**: it waits for the owner's explicit go-ahead and launch date, and the 5-minute rule does not apply to it.
This file is the contract for build part 3 (the merch Worker with faked money) and its suite `merch_worker`: **one test per row id** (`T2.1-nn`,
`T2.2-nn`). Tax and legal lines are **research, not tax or legal advice**: an accountant or adviser confirms them before launch.

Inputs: `docs/HANDOFF_MERCH.md` (the owner's decisions), `SHIPPING.md` (model C, section 6), `COUNTRIES.md`, `ECONOMICS.md`, `RENDER_FREE.md` 8,
`PART1.md`, `PROVIDERS.md`, `BUILD_PLAN.md`, V224.md 4 and `cloudflare/worker.js` `/shop/*` (house patterns). Marks: **[fetched]** I read the
page on 24 Nov 2026; **[cloud]** measured on the account (RENDER_FREE 8); **[not verified]** still open, with how to settle it.

## What changed from the first draft

1. **A basket**, not one item per order: up to 6 lines, quantity 1-3 each (`merch_order_items`, `merch_parcels`). Refunds and reprints per line.
   Mugs and tees travel in their own parcels, each with its own tracking link. The 1-hour cancel covers the whole order.
2. **Mug ($19.99) and tee ($26.99) only.** Stickers are off (`MERCH_PRODUCTS=mug,tee`). A product is a row in `catalog.js` (plus its `PawPrint.PRODUCTS` row).
3. **Shipping zones with a fee and a free-shipping threshold** (model C) replace "one delivered price". "Ship to" is chosen first; the server always re-prices.
4. **One USD price list with Adaptive Pricing on** (the buyer may pay in their own currency at Stripe). The fixed GBP list is gone. Fees: 3.9% + US$0.30
   (USD settlement, ECONOMICS case 2). Section 3.1 says what Adaptive Pricing changes.
5. **Countries "open for all"** behind `MERCH_COUNTRIES` (zones); the exact list goes to the owner with the launch go-ahead (section 10, point 1).
6. **No D1, no R2, no KV.** Orders and print files live in **SQLite Durable Objects of the merch Worker** (section 6.1 says why).
7. **Print files are made after payment, inside the cooling hour**, by Cloudflare's Browser Run screenshotting the static print page (RENDER_FREE 8),
   with resvg-wasm inside the Durable Object as the first fallback. Nothing is rendered at checkout.
8. **The Printful draft is made inside the hour; confirm (the wholesale charge) only after the hour plus a 2-minute grace.**
9. **The margin guard runs on the whole order** (floor US$4 and 20% of net), live at checkout and nightly.
10. **Admin routes and `tools/merch.sh`** replace the D1 console (there is none for a Durable Object).
11. The day cap counts the **JST day** (was UTC). `user_id` is dropped (guest checkout only). PENDING PROVIDERS/SPIKE marks are resolved or turned into [not verified].

---

## 0. The one finding that shapes everything (kept)

Stripe Managed Payments (the Kind shop's merchant-of-record model) does not cover physical goods: *"Managed Payments doesn't support non-digital product
categories, including: Physical goods"* (docs.stripe.com/payments/managed-payments/eligibility) [fetched in the first draft]. So whoever runs the merch
checkout is the seller of record and carries sales tax and VAT duties. Stripe Tax only calculates and collects where the seller is registered.

## 1. Who is the seller, and which checkout (kept)

**Our own Stripe Checkout (hosted page), on a new, separate Stripe account** under the owner's login: the same Hong Kong business, USD settlement
with the owner's USD bank account, Adaptive Pricing on, Stripe Tax on, no Managed Payments. Why separate: "not received" disputes on physical goods
must never touch the Kind shop's Managed Payments standing; the live `/shop/webhook` would see every merch event; merch gets its own statement
descriptor ("DOODLEDOGGO MERCH"), tax settings and keys. Rejected: Fourthwall-style merchant-of-record shops (cannot print a unique dog per buyer:
PROVIDERS.md), and one shared Stripe account with a metadata guard (it changes the live Kind shop webhook and mixes dispute rates).

The merch Worker is **`doodle-doggo-merch`** (files `cloudflare/merch/*`), served at `merch-api.doodledoggo.app`. It never touches `cloudflare/worker.js`.

### 1.1 Tax (research, not advice; an accountant confirms every line)

| Where | What the research says | What the design does | Accountant must confirm |
|---|---|---|---|
| USA | A foreign remote seller owes a state's sales tax only past its economic nexus (commonly US$100k a year). Printful charges *us* sales tax on wholesale (about 7%, a cost) unless we hold a resale certificate. | No state registered at launch. `automatic_tax` on: Stripe Tax answers $0 with `not_collecting` where we are not registered (docs.stripe.com/tax/zero-tax) [fetched in COUNTRIES]. US prices are tax-exclusive, so a later registration adds tax on top. Nightly report per state. | Nexus from third-party print facilities; when to register. |
| UK | An overseas seller of goods in the UK "of any value" must register for UK VAT before the first sale (NETP, no threshold) (gov.uk, VATREG37050) [fetched in COUNTRIES]. | GB is a switch. **Recommended: shut until a UK VAT registration is live and added to Stripe Tax** (section 10, point 1). Then UK prices are VAT-inclusive (`tax_behavior: inclusive`), and Printful's UK VAT on wholesale is reclaimable. | Registration route, Making Tax Digital returns, whether a USD-only list is fine for UK consumers. |
| EU 27 | No threshold for a non-EU seller; EU-made goods (Printful Latvia, Spain) need Union OSS in the dispatch country; imports ≤ €150 need IOSS (with an EU intermediary) or the buyer pays at the door; €3 duty per item from 1 Jul 2026 (COUNTRIES 3.2). | Same as the UK: a switch, recommended shut until one route is chosen. | Chain rule, OSS/IOSS, product-safety representative, mug food-contact rules. |
| Canada, Australia, NZ, Norway, Switzerland, Singapore, Japan | Registration only past a threshold (COUNTRIES 6). | Open with the rest of the world; the nightly report watches each threshold (alerts at 50% and 80%). | Whether local print partners change this (CA, AU). |
| Hong Kong (home) | No sales tax. Profits tax on the margin. | Nothing in the Worker. | Offshore question, records (7 years). |

"Open for all" (owner, 24 Nov 2026) is the default the switch is built for; which countries are in it on launch day is the owner's call with the
accountant (section 10). Without a UK/EU registration the "prices include VAT" lines of model C do not apply: re-run `tools/merch_econ.js --cart`
for those zones when the catalog is made.

---

## 2. The order flow (a basket)

The game links to `doodledoggo.app/merch#r=<recipe>` (the recipe stays in the URL fragment: no server sees it until a quote). The page draws every
preview with PawPrint in the browser. The server never trusts a price, a fee or a country from the page.

1. **Ship to.** The page asks "Where should we send it?" first (a country list from `GET /merch/catalog`: only open countries are listed). The country
   gives the zone, its fee and its free-shipping line ("Orders of $35 or more ship free.").
2. **Fill the basket.** Each line: one dog (recipe), product (mug | tee), colour and size (tee), pose (stand | sit | happy), name on or off (the
   dog's name from the recipe, checked by `merch/names.js`), quantity 1-3. Up to 6 lines. The basket lives in the page (localStorage, a convenience only).
3. **Quote.** `POST /merch/quote {country, lines[]}` re-checks every line and prices it from `catalog.js`: line totals, subtotal, shipping fee
   (0 at or over the threshold), total, delivery estimate, the zone's notes. No row is written. The page shows the total early and calmly.
4. **Pay.** `POST /merch/checkout {country, lines[], expect_total, art_ver, nonce, agree: true, lang}`: the server re-checks everything (switches,
   country, products, recipes, names, the day cap, the live margin guard), compares its own total with `expect_total`, writes the order (`open`) and
   its lines (`pending`) and makes one Stripe Checkout Session (section 3, Idempotency-Key `mc_<order>`) whose only shipping country is the quoted
   one. Answer: `{order, url}`. The page opens Stripe.
5. **Stripe Checkout.** The buyer types the address (in the quoted country only), pays by card or wallet, in USD or in their own currency
   (Adaptive Pricing). Stripe Tax adds or includes tax where we are registered (nowhere at launch).
6. **Paid.** `checkout.session.completed` (or `async_payment_succeeded`) with `payment_status: paid`. The Worker re-reads the session from Stripe and
   checks it (section 3.2). The order becomes `paid`; `cancel_until = paid_at + 60 min` (`MERCH_COOL_MIN`). The "Thank you" email goes out with the
   order page link. The success page is the order page: "Thank you! We'll start printing at 14:35. If you change your mind before then, you can
   cancel here." (a plain time in the buyer's own clock, never a ticking countdown).
7. **Render, inside the hour.** The ledger Durable Object works through the lines one at a time, at least 11 s apart (Browser Run Quick Actions allow
   1 per 10 s on Free): `env.BROWSER.quickAction('screenshot', {url: <merch Worker>/merch/print/<art_ver>/#<print link>, viewport, omitBackground:
   true, waitForSelector: '#o svg'})`. The PNG body streams into the print Durable Object; the Worker checks the PNG size header, stores the file's
   SHA-256 and `art_ver`. A line is `ready`. Quantity does not add renders.
8. **Printful draft, inside the hour.** When every line is ready: one Printful order as a **draft** (not charged): `external_id = <order>`, each item
   `external_id = <order>_<line>`, the file as a signed URL on the merch Worker (30 days), the recipient read from the Stripe session (never stored by
   us), `retail_costs` from our prices. Printful's draft costs are read back. Lines are `drafted`. Address and file problems show up here, while the
   buyer can still be told inside the hour.
9. **Confirm, after the hour.** At `cancel_until + 120 s` (the grace that keeps a tap at minute 59 safe) the order is claimed as `confirming` and
   Printful is asked to confirm (the wholesale charge happens here). Then `confirmed`. With `MERCH_PROVIDER_MODE=draft` it never confirms.
10. **Production and parcels.** Printful webhooks are hints only: the Worker re-reads the Printful order. Lines move to `in_production`, then each
    Printful shipment becomes a parcel row (mugs and tees apart) with its tracking link and one "On its way" email. The order is `part_shipped`, then
    `shipped` when every live line is shipped. `delivered_at` is stored when Printful reports it.
11. **After delivery.** Damage, misprint or loss within 30 days of delivery (or of the latest delivery date we gave): the owner reprints or refunds
    per line (section 4). Print files are kept for 180 days after shipping (section 6.6).

**Emails** (Resend, from `orders@doodledoggo.app`, reply-to `contact@`; each with `Idempotency-Key me_<order>_<kind>[_<n>]`; the address is read from
the Stripe session at send time, never stored): Thank you; We need your address; On its way (one per parcel); Cancelled; Refunded (one per refund);
Sorry, we couldn't print one thing; Taking longer than we said; A new one is on its way (reprint). Stripe's own receipt is on too.

### 2.1 States, transitions and repeats

**Order states** (`merch_orders.status`; `hold` says why a paid order waits):

| Status | Meaning | Buyer sees on the order page | Ends? |
|---|---|---|---|
| `open` | Checkout Session made, not paid (or a delayed payment not settled) | "Waiting for payment." | no |
| `expired` | Session expired, abandoned or its delayed payment failed; nothing paid | "This order wasn't paid, so nothing will be made." | yes |
| `paid` | Paid, inside the cooling hour (+ grace); lines rendering, draft being made | "Paid. We'll start printing at 14:35. Changed your mind? Cancel" | no |
| `held` | Paid, waiting for something (`hold`: `render`, `provider`, `address`, `review`, `wallet`, `dispute`, `draft_mode`) | `address`: the address form. Others: "Getting ready to print. It's taking a little longer than usual." | no |

One hold also sits on a shipped order without changing its status: `reship` (a parcel came back, T2.2-45).
| `confirming` | Claimed for the Printful confirm call (a few seconds) | "Printing has started." | no |
| `confirmed` | Printful confirmed (charged); nothing shipped yet | "Printing." | no |
| `part_shipped` | At least one parcel shipped, not all | "On its way: 1 of 2 parcels", tracking links | no |
| `shipped` | Every live line shipped (refunds and reprints still possible) | tracking links, "Delivered" where known | flow ends |
| `cancelled` | The buyer cancelled within the hour; fully refunded (or refund on its way) | "Cancelled. Your refund is on its way." | yes |
| `refunded` | Every line refunded, shipping too | "Refunded." | yes |

Flags beside the status: `disputed_at` + `dispute` (`open`, `won`, `lost`), `refunded` (US cents in total), `late_sent_at`, `refund_failed`.
Status only moves along the table's arrows below; each move is one `UPDATE ... WHERE id = ? AND status IN (<allowed from>)` inside one transaction.

**Line states** (`merch_order_items.status`):

| Status | Meaning |
|---|---|
| `pending` | In an open order |
| `void` | Its order expired |
| `queued` | Paid, waiting for its print file |
| `ready` | Print file stored (sha, bytes, `art_ver`) |
| `drafted` | In the Printful draft |
| `rejected` | Printful or the renderer could not make it; its refund follows (`refunded_qty = qty`) |
| `confirmed` | Its Printful order is confirmed |
| `in_production` | Printful is making it |
| `shipped` | In a parcel with tracking (`parcel_id`) |
| `delivered` | Its parcel was reported delivered |
| `cancelled` | Its order was cancelled in the hour |
| `replaced` | Reprinted: a new line row (`reprint_of`) carries on |

A line's money is separate from its state: `refunded_qty` (0..qty) and `refunded` (cents). A line with `refunded_qty = qty` counts as refunded.

**Transitions and repeats** (each row one test):

| Id | Trigger | From | Server does | To | Buyer sees |
|---|---|---|---|---|---|
| T2.1-01 | `POST /merch/quote`, valid basket | - | Re-checks and prices every line; writes nothing | - | Line prices, shipping, total |
| T2.1-02 | `POST /merch/checkout`, valid, new `nonce` | - | Order + lines written; day cap counted; Stripe session (key `mc_<order>`, `expires_at` now + 1 h); url stored | order `open`, lines `pending` | Stripe Checkout opens |
| T2.1-03 | Checkout again, same `nonce`, url stored | `open` | Returns the same `{order, url}`; no new order, no Stripe call | `open` | The same Checkout |
| T2.1-04 | Checkout again, same `nonce`, first tap still waiting on Stripe | `open`, no url | 409 `busy` | - | "One moment..." (the page retries after 2 s) |
| T2.1-05 | Stripe answers an error or cannot be reached at checkout | `open`, no url | Order and lines deleted; 503 `busy`; the next tap starts clean | - | "We couldn't reach the payment page. Nothing was paid." |
| T2.1-06 | `checkout.session.completed`, `payment_status: paid`, checks pass (3.2) | `open` | `paid_at`, `cancel_until`, amounts, `pres_*`, `email_hash`; lines `queued`; Thank you email; alarm set; gift code claimed (if a pool exists) | `paid` | Order page with the cancel time |
| T2.1-07 | `completed` with `payment_status: unpaid` (a delayed method) | `open` | Marks `pay_pending = 1`; nothing else | `open` | "Waiting for your bank." |
| T2.1-08 | `checkout.session.async_payment_succeeded` | `open` | As T2.1-06 (the hour starts now) | `paid` | As T2.1-06 |
| T2.1-09 | `checkout.session.expired` or `async_payment_failed` | `open` | Lines `void`; the day cap place is free again | `expired` | "This order wasn't paid." |
| T2.1-10 | Alarm: a `queued` line, renderer free | `paid`/`held render` | Renders (step 7), stores the PNG, checks size, writes sha, bytes, `art_ver` | line `ready` | - |
| T2.1-11 | Alarm: every line `ready` | `paid` | Printful draft (step 8); draft costs stored | lines `drafted` | - |
| T2.1-12 | Alarm: now ≥ `cancel_until + 120 s`, draft made, costs ≤ `cost_est` + 10%, live mode | `paid` | Claims `confirming` (written before the call), confirms at Printful | `confirming` → `confirmed`, lines `confirmed` | "Printing." |
| T2.1-13 | As T2.1-12 with `MERCH_PROVIDER_MODE=draft` | `paid` | Never confirms; listed in the nightly report | `held` (`draft_mode`) | "Getting ready to print." |
| T2.1-14 | Printful order in production (re-read after a hint) | `confirmed` | Lines `in_production` | `confirmed` | "Printing." |
| T2.1-15 | Printful shipment for some lines | `confirmed`/`part_shipped` | Parcel row (carrier, tracking URL, lines); lines `shipped`; "On its way" email `me_<order>_ship_<parcel>` | `part_shipped` | Tracking link |
| T2.1-16 | Shipment for the last live lines | `part_shipped`/`confirmed` | As T2.1-15 | `shipped` | All tracking links |
| T2.1-17 | Printful reports a parcel delivered | `part_shipped`/`shipped` | `delivered_at`; lines `delivered` | same | "Delivered" |
| T2.1-18 | `POST /order/:id/cancel`, now < `cancel_until + 120 s` | `paid`/`held` | Writes `cancelled` first; full refund (`mr_<order>_all_1`); deletes the Printful draft if any; Cancelled email; files kept 2 days | `cancelled`, lines `cancelled` | "Cancelled. Your refund is on its way." and "Put these back in my basket" |
| T2.1-19 | Cancel an unpaid order | `open` | Expires the session at Stripe (`POST /v1/checkout/sessions/:id/expire`; if not open, GET tells expired from complete) | `expired` | "Nothing was paid." |
| T2.1-20 | Cancel after the window | `confirming` or later | 409 `too_late`; nothing changes | same | "Printing has started, so this order can't be cancelled now. If something arrives damaged, we'll make it right." |
| T2.1-21 | Owner: refund a line (`tools/merch.sh refund <order> <line> [qty] <reason>`) | paid or later | Refund row (`mr_<order>_l<line>_<n>`), Stripe partial refund (section 4 amounts); `refunded_qty`; Refunded email | same | "Refunded $X for the mug." |
| T2.1-22 | A refund leaves no item un-refunded | any paid | Also refunds the shipping that is left | `refunded` | "Refunded." |
| T2.1-23 | Owner: reprint lines (`tools/merch.sh reprint <order> <lines> [provider order]`) | `part_shipped`/`shipped` | New line rows (`reprint_of`, `line = 100 + n`) with the stored PNGs (or a re-render, 6.6); a Printful order `external_id = <order>-r<n>` confirmed at once (no cooling hour, no charge to the buyer); old lines `replaced` | `part_shipped` until it ships | "A new one is on its way." |
| T2.1-24 | Any Stripe event id seen before (`merch_events 's:'+id`) | any | 200, nothing changes (the event row is written in the same transaction as the work, never on a 502) | same | - |
| T2.1-25 | `completed` and `async_payment_succeeded` both arrive for one paid session | `paid` | The second is a no-op (status guard) | `paid` | - |
| T2.1-26 | `checkout.session.expired` after `completed` | `paid` or later | Ignored | same | - |
| T2.1-27 | Same Printful hint twice (`'p:'+event id` or sha256 of the body) | any | No-op | same | - |
| T2.1-28 | Printful hints out of order (shipped, then in production) | `part_shipped` | The re-read order decides; a line never moves back (`shipped` > `in_production`) | same | - |
| T2.1-29 | `POST /order/:id/address` with a good address, in `held address` | `held` | Sent straight to the Printful draft (never stored); hold cleared; the flow resumes (confirm if the hour has passed) | `paid` or `confirming` | "Thanks! We'll send it there." |
| T2.1-30 | Alarm: a live line not shipped by the order's `ship_by` (FTC rule) | `confirmed`/`part_shipped` | Once per order: "Taking longer than we said" email (`me_<order>_late`) with a choice; `late_sent_at` | same | "You can wait, or cancel the late part for a full refund." |
| T2.1-31 | `POST /order/:id/cancel {scope: 'late'}` after the delay email | `confirmed`/`part_shipped` | Refunds every unshipped live line (T2.1-21 amounts); asks Printful to cancel them; if Printful cannot, the owner gets an email | same or `refunded` | "Refunded the late part." |
| T2.1-32 | Nightly: a variant fails the floor alone | - | `on_flag = 0`, owner email; quote and checkout answer 409 `variant_off` for it | - | "This one isn't available right now." |
| T2.1-33 | Tidy (nightly) | - | Section 5 retention: files, hashes, names, recipes, events, unpaid orders | - | - |

### 2.2 Failures and odd cases

Every row: what the server does, and what the buyer sees. Money first: whenever we cannot make something, the buyer's money goes back without being asked.
"Owner email" is one Resend mail to the owner's address (`MERCH_OWNER_TO`), at most one per order and reason per day.

| Id | Case | Server does | Buyer sees |
|---|---|---|---|
| T2.2-01 | Two tabs, two nonces, the same basket | Two `open` orders, both count toward the day cap; the unpaid one expires within 1 h (T2.1-09) | Two Checkout pages; only the paid one becomes an order |
| T2.2-02 | Shop shut (`MERCH_FROM` empty or in the future) | Quote and checkout 503 `merch_closed`; catalog `{shut: true}`; webhooks, renders, confirms and refunds still run | "The shop opens soon." |
| T2.2-03 | `MERCH_OFF=1` | As T2.2-02 for new checkouts only; paid orders finish | "The shop is resting for now. Your order is safe." on order pages |
| T2.2-04 | Country not open (`MERCH_COUNTRIES`, the never list) | 403 `country_closed` | The country is not in the list; a direct link says "We can't send there yet." |
| T2.2-05 | Product not in `MERCH_PRODUCTS` (stickers) or not `launch` | 400 `bad_line {line, why: 'product'}` | "This one isn't available right now." |
| T2.2-06 | Bad recipe, two dogs in one line, unknown colour, size or pose | 400 `bad_line {line, why}` (`recipe`, `colour`, `size`, `pose`) | "Something about this dog didn't load. Try it again from the game." |
| T2.2-07 | Name refused by `merch/names.js` | 400 `bad_name {line, say}` | "Let's try another name" (or print without the name) |
| T2.2-08 | More than 6 lines, quantity 0 or over 3 (identical lines are merged first) | 400 `too_many` / `bad_qty {line}` | "Up to 6 things, and up to 3 of each." |
| T2.2-09 | `expect_total` differs from the server's total (the catalog changed) | 409 `price_changed {quote}`; nothing written | "Prices changed since you opened the basket. Here's the new total." and Pay again |
| T2.2-10 | The catalog changes after a session is made, before payment | The session's own prices are honoured; checks compare with the order row, not the new catalog | Nothing |
| T2.2-11 | Day cap reached at checkout (`open` + paid orders of the JST day ≥ `MERCH_DAY_CAP`) | 409 `sold_out_today`; sessions already open are honoured when paid, even after the cap is lowered | "We've made all we can for today. The shop opens again tomorrow." |
| T2.2-12 | Live margin guard fails at checkout (costs moved) | 409 `cant_make`; owner email with the basket | "We can't make this basket right now. Nothing was paid." |
| T2.2-13 | `art_ver` from the page is not a version the Worker serves | 409 `art_changed` | The page reloads its preview, then Pay again |
| T2.2-14 | Paid session fails the re-read checks (3.2: amount, currency, lines, order id, discount) | `held review`, reason stored; no render, no Printful; owner email; 24 h without owner action: full refund | "Getting ready..."; after a refund, "Refunded." with a kind email |
| T2.2-15 | Shipping country on the paid session ≠ the order's country (should not happen: Checkout allows only that country) | As T2.2-14 (`review`, reason `other_country`) | "We're checking your order"; after 24 h a full refund and "Please order again with the right country." |
| T2.2-16 | Stripe re-read fails (network, 429, any non-OK) | 502, nothing written, no event row; Stripe retries | Nothing (the order page says "Waiting for payment" a little longer) |
| T2.2-17 | Bad `Stripe-Signature` or outside 300 s | 400 `bad_signature` / `stale` | - |
| T2.2-18 | `charge.refunded` (full) before `completed` | Session looked up by `payment_intent` (`GET /v1/checkout/sessions?payment_intent=`); order written `refunded`, lines `cancelled`; the later `completed` renders nothing and makes no Printful order. Lookup fails: 502 | "Refunded." |
| T2.2-19 | Partial refund made in the Stripe Dashboard (refund id not ours) | `refunded` += amount; a `merch_refunds` row with `line = null` (unassigned); lines unchanged; nightly report | The refund email from Stripe; our order page shows the refunded total |
| T2.2-20 | Full refund in the Dashboard, order not yet confirmed | Order `refunded`; Printful draft deleted; never confirmed | "Refunded." |
| T2.2-21 | Full refund in the Dashboard after confirm | Order `refunded` (it stays `refunded`: later Printful shipments are stored as parcels but change no status); owner email: "printing has started; cancel in the Printful dashboard if you can" (no API cancel after confirm [not verified]) | "Refunded." (tracking links still shown if it ships) |
| T2.2-22 | `charge.dispute.created` before confirm | `disputed_at`, `dispute = open`; `held dispute`; Printful draft deleted; no confirm, no refund (the bank decides the money); `e:`+email hash flagged `block` | "Your bank is looking at this payment, so we've paused it." |
| T2.2-23 | Dispute created after confirm or shipping | Flag only; the flow goes on; owner answers in Stripe with tracking and the stored print PNG; email hash flagged `block` | Nothing changes |
| T2.2-24 | Dispute before `completed` | Session lookup as T2.2-18; order written `held dispute`; the later `completed` does nothing more | As T2.2-22 |
| T2.2-25 | `charge.dispute.closed`, won | `dispute = won`; an unprinted held order stays held; owner email (the owner decides: ship or refund) | Unchanged until the owner acts |
| T2.2-26 | `charge.dispute.closed`, lost | `dispute = lost`; draft lines deleted at Printful if still a draft; the loss is in the nightly report | Unchanged |
| T2.2-27 | Checkout abandoned and no `expired` event comes | Alarm at `expires_at + 1 h` asks Stripe: expired → T2.1-09; complete and paid → T2.1-06 (a missed webhook) | As those rows |
| T2.2-28 | Render error on one line (print page `ERR`, selector timeout, bad PNG size, PNG over 7.5 MB) | Retry once after 1 min; then resvg-wasm in the print Durable Object; still failing: line `rejected` (`render`), line refund (section 4), owner email; other lines go on | "Sorry, we couldn't print the tee with Biscuit. We've refunded $X." |
| T2.2-29 | Browser Run 429 "Browser time limit exceeded for today" | Fallback resvg-wasm in the print Durable Object; if that fails too, wait for 09:00 JST (00:00 UTC, the reset). Past the hour: `held render`; owner email after 2 h held; full refund after 72 h held | "Getting ready to print. It's taking a little longer than usual."; after 72 h, refund and apology |
| T2.2-30 | Browser Run 429 for the 1-per-10-s rate | Next try in 11 s; no hold | Nothing |
| T2.2-31 | Print shard write fails (1 GB per object full) | The next shard for that day (`p-2026-12-01-b`); retry at once | Nothing |
| T2.2-32 | Printful refuses one line at draft (variant, stock, file) | That line `rejected`; the draft is made with the rest; line refund (section 4); the variant `on_flag = 0` until the nightly check; owner email | "Sorry, we couldn't make the navy tee. We've refunded $X. The rest is on its way." |
| T2.2-33 | Printful refuses every line | Full refund, shipping included; order `refunded`; owner email | "Sorry, we couldn't make this order. We've refunded all of it." |
| T2.2-34 | Printful down, 5xx or 429 (draft or confirm) | Backoff 1, 5, 15, 60 min, then hourly (`next_try_at`); past the hour `held provider`; owner email at 24 h; the FTC delay rule (T2.1-30) still runs | "Getting ready to print..." |
| T2.2-35 | Printful create times out (result unknown) | GET by external id before creating again; never two Printful orders | Nothing |
| T2.2-36 | Printful refuses the recipient (an address it cannot ship to) | `held address`; "We need your address" email with the order link; 7 days without a fix: full refund | The address form: "We couldn't send to this address. Please check it." |
| T2.2-37 | Address fix in another country | 400 `other_country`; the form offers "Refund me instead" (`POST /order/:id/refund`, allowed only in `held address`) → full refund | "We can only send this order to Canada. To send it somewhere else, we'll refund you and you can order again." |
| T2.2-38 | Printful billing fails at confirm (wallet empty, card declined) | `held wallet`; retry every 30 min; owner email at once; 5 days: full refund and apology | "Getting ready to print..." |
| T2.2-39 | Draft cost > `cost_est` + 10% | `held review`; owner email; owner confirms (`tools/merch.sh confirm`) or refunds; 48 h without action: confirm if the order's margin is still ≥ $0, else full refund | "Getting ready to print..." |
| T2.2-40 | Cancel at minute 59 racing the confirm | The ledger Durable Object runs one request or alarm at a time. A cancel handled before `cancel_until + 120 s` wins (T2.1-18); confirm never starts before that time and writes `confirming` before calling Printful; a cancel that finds `confirming` gets 409 `too_late`. Test both orders of arrival. | Either "Cancelled" or "Printing has started" |
| T2.2-41 | Cancel while Printful is down | `cancelled` and the refund first; the draft deletion is retried; a cancelled order is never confirmed | "Cancelled. Your refund is on its way." |
| T2.2-42 | Stripe refund call fails (cancel or line refund) | Refund row stays `sending` with its key; the alarm retries with the same Idempotency-Key; owner email after 24 h | "Your refund is on its way." |
| T2.2-43 | A refund fails later at the bank (`refund.failed`, or `charge.refund.updated` with status `failed`: confirm the name at build) | `refund_failed = 1`; owner email | Nothing until the owner writes |
| T2.2-44 | One parcel lost (owner: `tools/merch.sh lost <order> <parcel>`) | Parcel `lost_at`; its lines are reprinted (T2.1-23) or refunded (T2.1-21), as the buyer prefers; the other parcel is untouched | "We're sending a new one." or "Refunded $X." |
| T2.2-45 | A parcel comes back to Printful (undeliverable) | Parcel `returned_at`; order `hold = reship` (its status stays `part_shipped`/`shipped`); "We need your address" email; one free reship of that parcel's lines after the fix (T2.1-23 with the same files); 7 days without an answer: refund those lines | The address form |
| T2.2-46 | Printful puts a confirmed order on hold | `held provider`; owner email; back when the hold is removed | "It's taking a little longer than usual." |
| T2.2-47 | Printful hint for an order we don't know (a claim reship) | Logged, 200; attached by `tools/merch.sh reprint ... <provider order>` or by its `-r<n>` external id | - |
| T2.2-48 | Printful hint with a bad or missing signature | 401 if signing is set up (`MERCH_PROVIDER_WEBHOOK_SECRET`); otherwise accepted as a hint (we re-read Printful anyway) | - |
| T2.2-49 | The merch Worker is redeployed with a new `ART_VER` between pay and render | The render uses the line's own `art_ver` folder (`/merch/print/<art_ver>/`), which stays served | Nothing |
| T2.2-50 | Rate limit (6.3) | 429 `slow_down` | "Too many tries. Please wait a minute." |
| T2.2-51 | IP flagged `block` | Checkout 403 `not_available` | "We can't take this order right now." |
| T2.2-52 | A paid order from an email hash flagged `block`, or the 4th paid order from one hash in 24 h | `held review`; owner email. Blocked: 24 h without action, full refund. 4th order: 24 h without action, it goes on (gifts are normal) | "Getting ready to print..." |
| T2.2-53 | `GET /merch/order/:id` with an unknown id | 404 `not_found` | "We couldn't find this order." |
| T2.2-54 | File URL expired or bad signature | 403 | - (a reprint signs a fresh URL) |
| T2.2-55 | The Worker or object stops mid-step (after a Stripe or Printful call) | Every outbound call has an idempotency key or a GET-before-create; a `confirming` or `sending` claim older than 2 min is retried by the alarm | Nothing |
| T2.2-56 | Stripe Tax returns tax on a paid order where we expected none (a registration was added) | The real tax is stored from the session; the margin is re-checked; below the floor: nightly report only (the buyer is served) | Tax shown on Stripe's page and receipt |

---

## 3. Money safety

- **Price list:** `cloudflare/merch/catalog.js` (repo, changed only by a reviewed PR): products (price per variant in US cents, Printful variant id,
  tax code, `launch`), zones (below), the never list, the holiday surcharge window, `cat_ver` (a hash of all of it). The browser never sends a price.
  Sessions use inline `price_data` (no Stripe Price ids to sync). Live wholesale and Printful shipping costs are in `merch_variants` and
  `merch_ship_costs`, written by the nightly job.
- **Products at launch** (`MERCH_PRODUCTS=mug,tee`): mug 11 oz white $19.99; tee Bella+Canvas 3001 S-XL $26.99, 2XL and up + Printful's extra rounded up
  to a dollar. Colours from `PawPrint.TEE_COLOURS`. The sticker sheet row stays in the table with `launch: false`.
- **Zones** (model C, SHIPPING.md 3). Free shipping when the subtotal (item prices) is at or over `free_from`:

| Zone | Countries | Fee | Free from | Each extra mug or tee | Note shown |
|---|---|---|---|---|---|
| `us_jp` | US, JP | $4.99 | $35 | - | - |
| `uk_eu` | GB, EU 27 | $5.99 | $70 | - | "Prices include VAT." only while registered |
| `ca_au_nz` | CA, AU, NZ | $7.99 | $70 | - | - |
| `world` | every other open country | $11.99 | never | + $5.99 | "Your country may charge import tax or a fee when it arrives." |

  `tax_behavior`: `exclusive` for US and CA, `inclusive` elsewhere (it only matters where Stripe Tax collects). Delivery estimates per zone from
  Printful's making (2-5 business days) plus delivery. `ship_by` (the FTC date) = paid date + 5 business days + 2 days slack.
- **The "Ship to" rule:** the zone comes from the country the page sent, re-checked against `MERCH_COUNTRIES`. The session's
  `shipping_address_collection[allowed_countries]` holds only that country, so the hosted page cannot take an address elsewhere (and it cannot
  re-price after the address is typed). The webhook checks the country again (T2.2-15).
- **USD only, Adaptive Pricing on:** section 3.1.
- **Stripe session** (form-encoded `fetch`, no SDK, `Stripe-Version: MERCH_STRIPE_VERSION`, pinned to 2025-03-31 or later so `adaptive_pricing` and
  `presentment_details` exist):

```
POST /v1/checkout/sessions                     Idempotency-Key: mc_<order>
mode=payment  locale=auto  customer_creation=if_required  billing_address_collection=auto
line_items[i][price_data][currency]=usd  [unit_amount]=<catalog cents>  [tax_behavior]=exclusive|inclusive
line_items[i][price_data][product_data][name]="Mug with your dog" | "Tee with your dog (Navy, M)"   (no dog name, no recipe)
line_items[i][price_data][product_data][tax_code]=<catalog>      line_items[i][quantity]=1..3
shipping_options[0][shipping_rate_data]: type=fixed_amount, fixed_amount[amount]=<fee or 0>, fixed_amount[currency]=usd,
   display_name="Standard shipping" | "Free shipping", tax_behavior as the lines, tax_code=txcd_92010001,
   delivery_estimate[minimum|maximum][unit]=business_day, [value]=<zone>        (one option only)
shipping_address_collection[allowed_countries][0]=<the quoted country>
automatic_tax[enabled]=true   adaptive_pricing[enabled]=true   phone_number_collection[enabled]=false
consent_collection[terms_of_service]=required
custom_text[terms_of_service_acceptance][message]="I'm 18 or over and agree to the Terms of sale. It's printed just for me, so it can't be
   returned if I change my mind."
custom_text[submit][message]="You can cancel within 1 hour of paying, from your order page."
client_reference_id=<order>  metadata[merch]=<order>  payment_intent_data[metadata][merch]=<order>
expires_at=<now + 3600>
success_url=https://doodledoggo.app/merch/order/<order>?new=1   cancel_url=https://doodledoggo.app/merch/?back=<order>
```

  No `payment_method_types` and no `capture_method=manual` (both work against Adaptive Pricing: 3.1). Payment methods are chosen in the merch
  account's Dashboard: cards, Apple Pay, Google Pay and Link at launch (section 10, point 2). Delayed methods are still handled (T2.1-07, T2.1-08).
  The Terms URL is set in the Dashboard [O]. No `discounts`, no promotion codes.

### 3.1 Adaptive Pricing: what it changes

What Stripe's docs say [fetched: docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing (hosted page), docs.stripe.com/tax/calculating/adaptive-pricing,
support.stripe.com/questions/adaptive-pricing and /adaptive-pricing-product-improvements, the Checkout Session API reference]:

| Topic | Stripe says | What we do |
|---|---|---|
| Turning it on | Dashboard setting for Checkout, in sandbox and live; per session `adaptive_pricing[enabled]` (defaults to the Dashboard). | Dashboard on [O] and `adaptive_pricing[enabled]=true` on each session. |
| Price currency | Prices must be in **one of our settlement currencies**; inline `price_data` converts too. | USD only, and the merch account needs USD settlement with the owner's USD bank account (the owner has one). Without it Checkout shows USD only. |
| Webhook amounts | The session and PaymentIntent "reflect what your customer paid in your integration currency": `currency: usd`, `amount_total` in USD cents. A converted payment adds `presentment_details {presentment_amount, presentment_currency}`. (`currency_conversion` is only for sessions made before 2025-03-31.) | Every check is in USD (3.2). `pres_currency` and `pres_amount` are stored for display only ("You paid ¥4,120"). |
| Who pays the conversion | "You pay 0%. Your customers pay 2-4%", inside the rate shown; none if they pay in USD (their bank may charge). The rate is held through settlement. | The page says so before Pay (SHIPPING 4): "Prices are in US dollars. At checkout you can pay in your own currency at Stripe's rate, which includes a small conversion fee, or pay in US dollars." |
| What we receive | Settled in our settlement currency, matching the price we set "regardless of the currency your customer pays in", less Stripe's fees. | Margin guard and economics in USD: 3.9% + US$0.30 per order (ECONOMICS case 2). No HKD conversion. |
| Refunds | We refund in USD; Stripe refunds the buyer in the currency they paid "using the same exchange rate", "no extra costs for you". | Full and per-line refunds are in USD cents; the buyer gets the same share back in their currency; neither side carries an FX move. Stripe's processing fee on the refunded payment is not returned (the Kind shop's experience, V224 4.4): a cancel costs us about $1.50 on a $35 order. |
| Stripe Tax | Tax is calculated on our USD price, not the converted amount; reports stay in USD; the conversion fee is not taxable; refunds reverse tax on the USD amount. `automatic_tax` and Adaptive Pricing work together. | `automatic_tax` on; tax amounts stored in USD. |
| Limits | Not with Elements + Payment Intents; not where a price has `currency_options` for the buyer's currency; **not with `capture_method: manual`**. | Hosted Checkout, inline USD prices, automatic capture. |
| Hong Kong | HK is listed as a buyer market. Stripe Tax lists HK as a supported business location [fetched docs.stripe.com/tax/supported-countries]. | - |

**Not verified** (settle each in the sandbox, part 9, with `+location_XX` test emails, one per zone):
1. That a **Hong Kong business** can turn on Adaptive Pricing: the page names no business countries (only an Indian restriction). Look for the Dashboard setting in the merch account.
2. That the **shipping rate converts** with the items (the docs talk of "prices"; nothing names `shipping_rate_data`). Check that `presentment_amount` covers the shipping fee and the tax.
3. **Partial refunds** at the original rate (the docs say "refunds" in general).
4. **Disputes:** the Adaptive Pricing pages say nothing. Stripe's general currency page says a dispute on a *converted* payment uses the current rate; whether that applies here is unknown. Plan on losing at most the USD charge plus the HK$85 dispute fee, and look at the first sandbox dispute's amounts.
5. **Receipts:** which currency Stripe's own receipt shows. Our Thank you email shows the USD total and, when converted, "You paid {pres_amount} at checkout."
6. Whether leaving out `payment_method_types` and limiting methods in the Dashboard keeps conversion on (a third-party guide says `payment_method_types=['card']` turns it off: not from Stripe).
7. The exact Stripe fee on a converted payment for a HK account (assumed the same 3.9% + US$0.30 on the USD amount).

**Clashes with a decision:** (a) the 1-hour cancel would be free of Stripe fees if we only held the card and captured after the hour, but Adaptive
Pricing does not work with manual capture, so we capture at once and each cancel costs us the fee (section 10, point 9). (b) For UK and EU
consumers, a USD-only list with a converted total at checkout may not meet "prices shown with all taxes" rules [not verified]: one more question for
the adviser before GB or the EU opens.

### 3.2 Checks on a paid session (the re-read)

On `completed` / `async_payment_succeeded`: `GET /v1/checkout/sessions/{id}?expand[]=line_items`. All must hold, else T2.2-14 / T2.2-15:
`payment_status = paid`; `currency = usd`; `metadata.merch = client_reference_id = the order id`; the order is `open`; one line item per order line with
the same quantity and `amount_subtotal = unit × qty`; `amount_subtotal` = the order's subtotal; `shipping_cost.amount_subtotal` = the order's fee;
`total_details.amount_discount = 0`; `amount_total = subtotal + fee + exclusive tax` (`total_details.amount_tax`); the shipping country (in pinned
versions since 2025-03-31 `collected_information.shipping_details.address.country`: confirm at build) = the order's country. A failed read is 502.

### 3.3 Margin guard, wholesale payment, fraud, switches

- **Margin of an order** (USD): `margin = (S + F) − T − Σ W_i·q_i·(1 + t_w) − Ship_P − h − f − r`, where S = subtotal, F = our shipping fee, T = tax
  inside the price that we remit (0 where not registered), W_i = wholesale per unit, t_w = US tax Printful charges us (about 7%, US only), Ship_P =
  Printful's shipping for the order (first-item rate per product group + extra-item rates), h = holiday surcharge ($0.40 on US orders until 17 Jan 2027),
  f = 3.9% × amount_total + $0.30, r = 5% × wholesale (reprint reserve). **Floor: ≥ US$4.00 and ≥ 20% of (S + F − T).**
- **Live at checkout** with the stored costs: below the floor → 409 `cant_make` (T2.2-12). With model C every 1-4 item basket passes in every zone
  (SHIPPING 2), and each extra item adds margin, so this only fires when costs moved before the nightly run.
- **At the draft:** Printful's own draft cost above `cost_est` + 10% → T2.2-39.
- **Nightly** (section 6.5): read Printful's variant and shipping prices; turn a variant `on_flag = 0` when it fails the floor alone in any open
  zone (T2.1-32); check the reference baskets (1-4 items, each zone, the baskets just over each threshold) and email the owner any that fail (a
  zone's fee or threshold is changed only by a reviewed PR). The report also lists held orders, unassigned refunds, disputes, the day's orders per
  country against COUNTRIES 6 thresholds, storage use (6.6) and Browser Run use.
- **Wholesale payment:** the prepaid Printful wallet (USD), topped up by the owner. The balance is the spending ceiling.
- **Fraud:** Stripe Radar defaults; block on a failed CVC and on the highest risk. IP flags at checkout, email-hash flags after payment (T2.2-51, T2.2-52).
  No billing-address match: gifts to other addresses are normal.
- **Switches** (Worker vars, like `BT_FROM`, `HP_FROM`): section 6.4.
- **Test mode end to end:** a separate Worker `doodle-doggo-merch-test` with the merch account's **sandbox** keys and Printful in `draft` mode, its own
  Durable Objects, allowing only the origin `https://test.doodledoggo.app`. The live Worker refuses that origin. The game's own payments-off rule
  (`window.__ddNoPay`, the `/shop/checkout` refusal) is unchanged. The test Worker refuses a key that starts with `sk_live` or `rk_live`.

---

## 4. Refunds, cancellations, reprints, chargebacks

**Policy text** (plain words, for `/merch/shipping` and the Terms; "no returns", never "no refunds"):
> Everything is printed just for you with your own dog, so we can't take it back if you change your mind. You can cancel the whole order for a full
> refund within **1 hour** of paying, from your order page. If something arrives damaged or misprinted, or never arrives, email us within **30 days**
> of delivery (or of the latest delivery date we gave you) with a photo, and we'll reprint it or refund it, whichever you prefer. This doesn't affect
> your legal rights.

- **Consumer law (research):** UK CCR 2013 reg. 28(1)(b) and EU CRD art. 16(c): no cancellation right for clearly personalised goods, if the buyer is
  told before ordering; faulty goods keep their remedies. US FTC Mail, Internet or Telephone Order Rule: ship within the stated time or offer a delay
  cancel with a prompt refund (T2.1-30, T2.1-31). Australia: never write "no refunds". Japan: the returns term on the final confirmation screen.
- **Cancel within the hour = the whole order** (T2.1-18): a full refund including shipping, the Printful draft deleted, the files deleted 2 days later.
  **Per-line cancel: not offered (recommended).** It would re-price shipping when the rest falls under the threshold (we would have to charge more, or
  eat it), make partial refunds on a fresh payment, and add states. Instead the cancelled order page has **"Put these back in my basket"**, so
  changing one thing is: cancel, adjust, pay again (the dogs and choices come back from the order's own lines).
- **Line refund amount** (owner, rejects, late lines): `unit × q` + that line's share of exclusive tax (`round(line_tax × q / qty)`) + in the `world`
  zone $5.99 for each refunded extra item. **Shipping otherwise stays as charged**, and we never charge more when the rest falls under the threshold.
  When a refund leaves no item un-refunded, it also refunds the shipping that is left (T2.1-22). Refunds are in USD; Adaptive Pricing returns the same
  share in the buyer's currency (3.1).
- **Idempotency:** each refund decision is a `merch_refunds` row written **before** the Stripe call, key `mr_<order>_all_<n>` or `mr_<order>_l<line>_<n>`
  (n counts that scope's refunds). A retry sends the same key. A `charge.refunded` for a refund id we hold changes nothing; an unknown one is a
  Dashboard refund (T2.2-19).
- **Who clicks what:** cancel within the hour: **the buyer** (no owner action; the restricted key needs Refunds write). Damage, misprint, loss: **the
  owner**, through `tools/merch.sh refund|reprint|lost` (so lines stay tracked), and files Printful's claim in the Printful dashboard when Printful is at
  fault (its claims are free reshipments within 30 days of delivery: PROVIDERS 1.1). Refunds made in the Stripe Dashboard still work but are unassigned.
- **Reprints:** a new Printful order `<order>-r<n>`, confirmed at once, from the stored PNG (or a re-render from the recipe with the same `art_ver`
  folder after the file is gone: 6.6). A wrong address typed by the buyer gets one free reship (T2.2-45).
- **Chargebacks:** the owner answers in Stripe with the tracking, the delivery scan and the print PNG (the admin route gives all three). The Worker marks,
  pauses unprinted orders and flags the email hash (T2.2-22 to T2.2-26). A lost dispute costs the order plus HK$85: 3.6 to 6.5 orders of margin (ECONOMICS).
- **Reprint reserve:** 5% of wholesale per order, in the margin.

---

## 5. Data and privacy

**Who holds what:**

| Data | Stripe | Printful | Our Durable Objects |
|---|---|---|---|
| Buyer's name, shipping address | yes | yes (to print and ship) | **no** (read from the Stripe session when the draft is made or fixed) |
| Email | yes | no (not sent) | HMAC hash only (`MERCH_HASH_KEY`), for flags and the 3-a-day check |
| Phone | no (off) | no | no |
| Card | yes | no | no |
| Dog recipe, the dog's name on the print | no (generic product names; metadata holds only the order id) | the print file | yes (line `recipe`, `name`) |
| Country, amounts, status, tracking URL | yes | yes | yes |
| IP address | as Stripe logs it | no | only as an HMAC in rate-limit rows (deleted within the hour) and in flags the owner sets |

**Retention** (to confirm with the accountant):
- Order and line rows (money, country, product, status): **7 years** (HK business records; a Japanese blue-return filer also keeps 7 years).
- `email_hash`, line `name`, `recipe` and `print_link`: cleared **24 months** after the order's last shipment, refund or cancel.
- Print PNGs: **180 days after the last shipment** (section 6.6); 2 days after a cancel, an expiry or a full refund before printing.
- `merch_events`: 90 days. Unpaid orders (`expired`): deleted after 30 days. Rate rows: at `reset_at`.
- **Deletion on request** (contact@): clear the hash, the name and the recipe at once; ask Printful to delete the recipient; Stripe keeps its records as
  the law asks (the privacy page says so, as for the Kind shop).
- **Processors for /privacy:** Stripe (payment, address, email), Printful and its carriers (name, address), Cloudflare (the merch Worker's storage and
  its browser, which only ever sees the dog), Resend (order emails).
- **Grown-ups only:** "You must be 18 or over to order. If you're younger, ask a parent or carer to order for you." The game's button keeps "Ask a
  grown-up". The game sends nothing but the recipe in the link.
- **UK GDPR / GDPR:** offering goods to UK or EU people brings an overseas seller into scope; lawful basis: the contract; ask the adviser about an
  Art. 27 representative.
- **Guest checkout (kept):** no account, no game login, no `user_id`.

---

## 6. Storage, tables, routes, files

### 6.1 Storage: all in SQLite Durable Objects (recommended over D1)

| | D1 `ddmerch` (first draft) | **SQLite Durable Objects of the merch Worker** |
|---|---|---|
| To create and approve | A new database (create call, its id in `wrangler.toml`, the token's D1 rights unproven) plus a Durable Object for files anyway | Nothing extra: the classes come with the Worker deploy (`new_sqlite_classes` migration). The print files already need a Durable Object (no R2, no KV: RENDER_FREE 8) |
| Races (cancel vs confirm, double taps, webhook vs alarm) | Conditional `UPDATE`s; D1 `batch()` is atomic but no read-then-write transaction | One ledger object runs one request or alarm at a time; `transactionSync()` for read-then-write |
| Timers | Cron only (10 ms CPU per run on Free; 50 external calls) | The object's own alarm (wakes at the exact due time; 30 s CPU per call, 15 min wall), plus one cron as a backstop |
| Backups | Time Travel 7 days on Free | Point-in-time recovery 30 days (documented for SQLite objects; whether Free differs [not verified]) |
| Owner's console | Dashboard SQL console | None: admin routes + `tools/merch.sh` (list, show, export, refund, reprint, flag) |
| Free limits | 500 MB a database, 5 GB an account; 100k rows written and 5M read a day | 1 GB an object, 5 GB an account (with the print files); 100k rows written, 5M read, 100k requests a day; rows and BLOBs up to 8 MB |

**Recommendation: keep the orders in a Durable Object too, and use no D1.** Fewer things to create and approve (none beyond the Worker), real
transactions in one single-threaded object (which makes T2.2-40 simple and exact), alarms for the cooling hour and retries, and 30-day restores. The
cost is no SQL console, so part 3 also builds the admin routes and `tools/merch.sh`, and the owner keeps a monthly export (`tools/merch.sh export`).

Objects (two SQLite classes in `doodle-doggo-merch`):
- **`MerchLedger`**, one instance named `ledger`: every table in 6.2, the alarm, all order logic. Small: a few KB an order.
- **`MerchPrints`**, one instance per JST day, `p-YYYY-MM-DD` (then `-b`, `-c` if one reaches 900 MB): the PNGs only. A day of 270 orders (the Browser
  Run ceiling) is about 220 MB, far under 1 GB. Day shards make deletion simple (`deleteAll()` when the shard is empty).

### 6.2 Tables (in `MerchLedger`; SQLite types; money in US cents; times in ms since epoch)

```sql
create table merch_orders (
  id text primary key,              -- 'mo_' + 22 base64url (128 random bits): also the order page key
  nonce text unique,                -- the page's tap id (double tap)
  day text,                         -- JST date of creation, for the day cap
  created_at integer, updated_at integer,
  status text, hold text,           -- 2.1
  country text, zone text, lang text, cat_ver text,
  subtotal integer, ship_fee integer, ship_extra integer, tax integer, total integer,   -- tax from Stripe after payment
  pres_currency text, pres_amount integer,                                            -- Adaptive Pricing, display only
  cost_est integer, margin_est integer,
  stripe_session text unique, checkout_url text, expires_at integer, pay_pending integer default 0,
  payment_intent text, paid_at integer, cancel_until integer, ship_by integer,
  provider text, provider_order text, provider_cost integer, confirmed_at integer,
  refunded integer default 0, refunded_at integer, refund_failed integer default 0,
  disputed_at integer, dispute text, dispute_id text,
  late_sent_at integer, gift_code text,
  email_hash text,                  -- BUYER DATA (HMAC of the email); cleared 24 months after close
  tries integer default 0, next_try_at integer, last_error text
);
create index merch_orders_pi on merch_orders (payment_intent);
create index merch_orders_due on merch_orders (status, next_try_at);
create index merch_orders_day on merch_orders (day, status);
create index merch_orders_email on merch_orders (email_hash);

create table merch_order_items (
  order_id text, line integer,      -- 1..6; reprints 101, 102 ...
  product text, colour text, size text, pose text, name_on integer, qty integer,
  name text,                        -- the dog's name as printed; cleared 24 months after close
  recipe text,                      -- merchEncode string (<= 1 KB); cleared 24 months after close
  print_link text,                  -- PawPrint.printHash(...) for this line; cleared with the recipe
  art_ver text,                     -- the print page version used for the preview and the render
  unit integer, line_total integer, line_tax integer, cost_est integer, provider_variant text,
  status text,
  file_key text, file_sha text, file_bytes integer, rendered_at integer, renderer text,   -- 'browser' | 'resvg'
  provider_item text, parcel_id text,
  refunded_qty integer default 0, refunded integer default 0,
  reprint_of integer, tries integer default 0, last_error text,
  primary key (order_id, line)
);
create index merch_items_status on merch_order_items (status);

create table merch_parcels (id text primary key /* provider shipment id */, order_id text, product text, carrier text,
  tracking_url text, shipped_at integer, delivered_at integer, lost_at integer, returned_at integer);
create index merch_parcels_order on merch_parcels (order_id);
create table merch_refunds (id text primary key /* mr_... or 's:'+re_ for Dashboard refunds */, order_id text, line integer, qty integer,
  amount integer, reason text, stripe_refund text, status text /* sending|done|failed */, created_at integer);
create table merch_events (id text primary key /* 's:'+Stripe id | 'p:'+Printful id or sha256(body) | 'x:'+admin */, order_id text, type text, at integer, note text);
create table merch_variants (id text primary key, product text, colour text, size text, provider_variant text, cost_base integer, on_flag integer, cost_at integer);
create table merch_ship_costs (id text primary key /* region:product */, first integer, extra integer, cost_at integer);
create table merch_flags (key text primary key /* 'e:'+email hash | 'ip:'+ip hash */, mode text /* block|allow */, note text, created_at integer);
create table merch_gift_pool (code text primary key, order_id text unique, claimed_at integer);   -- empty = no gift (section 10, point 5)
create table merch_rate (k text primary key, n integer, reset_at integer);
create table merch_shards (name text primary key, bytes integer, files integer, keep_until integer);
create table merch_meta (k text primary key, v text);   -- last nightly run, last export, Browser Run seconds today
```

`MerchPrints` holds `prints (key text primary key /* <order>/<line> */, png blob /* <= 7.5 MB */, sha text, bytes integer, created_at integer, keep_until integer)`.

> Note (part 3 build, 24 Nov 2026): a SQLite Durable Object row (string or BLOB) is at most **2 MB**, not 8 MB as 6.1 says (Miniflare refuses a 7 MB
> blob with `SQLITE_TOOBIG`; 2.1 MB passes locally). So `MerchPrints` keeps each PNG in 1 MB parts (`prints` + `print_parts (key, n, data)`); the
> 7.5 MB file limit stands. PART3.md, contract question 1.

### 6.3 Routes (Worker `doodle-doggo-merch`; JSON unless said; errors as `{error, ...}`)

| Method, path | Auth | Limit | Input | Output | Errors |
|---|---|---|---|---|---|
| `GET /merch/catalog` | none | edge cache 60 s | - | `{cat_ver, shut, sold_out_today, products[{id, price, sizes, colours, poses, on}], zones[{id, fee, free_from, extra, eta}], countries[{code, zone}], max_lines: 6, max_qty: 3, art_vers[]}` | - |
| `POST /merch/quote` | none | 60/h per IP | `{country, lines[{recipe, product, colour, size, pose, name_on, qty}]}` | `{cat_ver, zone, lines[{line, unit, qty, total}], subtotal, ship_fee, free_from, total, eta, notes[]}` | 400 `bad_line`, `bad_name`, `too_many`, `bad_qty`, `bad_country`; 403 `country_closed`; 409 `variant_off`, `sold_out_today`; 503 `merch_closed`; 429 `slow_down` |
| `POST /merch/checkout` | none | 10/h per IP | quote input + `{expect_total, art_ver, nonce, agree: true, lang}` | `{order, url}` | quote errors + 400 `no_agree`; 409 `price_changed {quote}`, `art_changed`, `busy`, `cant_make`; 403 `not_available`; 503 `busy` |
| `GET /merch/order/:id` | the id | 120/h per IP | - | `{id, status, hold, paid_at, cancel_until, can_cancel, country, lines[{line, product, colour, size, pose, name_on, name, qty, unit, status, refunded_qty, parcel, recipe}], parcels[{id, product, carrier, tracking_url, shipped_at, delivered_at}], totals{subtotal, ship_fee, tax, total, refunded}, pres{currency, amount}, gift_code, late: bool}`; never an address or email | 404 `not_found` |
| `POST /merch/order/:id/cancel` | the id | 10/h | `{scope: 'order' \| 'late'}` | `{status, refund: 'sending' \| 'done'}` | 409 `too_late`, `not_late`; 404 |
| `POST /merch/order/:id/address` | the id | 10/h | `{name, line1, line2, city, state, postal, country}` (sent to Printful, never stored) | `{ok: true}` | 409 `not_needed`; 400 `other_country`, `bad_address {field}`; 503 `busy` |
| `POST /merch/order/:id/refund` | the id | 10/h | `{}` (only in `held address`) | `{status: 'refunded'}` | 409 `not_allowed` |
| `POST /merch/webhook/stripe` | `Stripe-Signature` (`MERCH_STRIPE_WEBHOOK_SECRET`), 300 s window, raw body first | - | Stripe event | 200 `{received: true}` | 400 `bad_signature` / `stale`; 502 (a failed re-read: Stripe retries) |
| `POST /merch/webhook/provider` | Printful signature when set up | - | Printful event (a hint) | 200 | 401 |
| `GET /merch/file/:key/:exp/:sig.png` | HMAC (`MERCH_FILE_KEY`) over key + exp | - | - | the PNG, streamed from `MerchPrints` | 403, 404 |
| `GET /merch/print/<art_ver>/*` | none | - | - | the static print page and its PawPrint (Workers static assets; every released version stays) | 404 |
| `GET/POST /merch/admin/*` | `Authorization: Bearer MERCH_ADMIN_KEY` | 60/h | `orders?status=&hold=`, `order/:id` (with events, refunds, signed file links), `order/:id/refund {line, qty, reason}`, `order/:id/reprint {lines, provider_order?}`, `order/:id/confirm`, `order/:id/lost {parcel}`, `flag {key, mode, note}`, `export?from=&to=` (JSON lines, no buyer data), `report` | as asked | 401, 404, 409 |

**Note, 24 Nov 2026 (after the part 2 review, M2): the catalog and the quote, settled.**
- `countries[]` is `{code, zone, soon}`: every country the "Ship to" list shows, the open ones and the ones not open yet (`soon: true`,
  from `MERCH_COUNTRIES`); never-countries are left out. No names: the page names a country with `Intl.DisplayNames` in the page's
  language (the code as a fallback).
- `zones[].notes` and the quote's `notes[]` are short codes, not sentences (`import_tax`, `vat_included`, `separate_parcels`): the page
  holds the words, so they can be translated. No other free text in the catalog.
- `POST /merch/quote` answers while the shop is shut by `MERCH_FROM` (prices are public) and says `shut: true`; a `soon` country still
  gets 403 `country_closed`. `POST /merch/checkout` stays 503 `merch_closed`.

Stripe events on the merch webhook endpoint [O]: `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
`checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`, `charge.dispute.closed`, and the refund
failure event (T2.2-43). Every other event: 200, ignored. CORS: `https://doodledoggo.app`, `https://www.doodledoggo.app`, localhost; the test Worker only
`https://test.doodledoggo.app`; webhooks and files send no CORS headers. Rate keys are `ip:` + an HMAC of the IP.

### 6.4 Switches, secrets, bindings (names only; values never in the repo or chat)

| Var | Default | Meaning |
|---|---|---|
| `MERCH_FROM` | `''` | Launch time (ISO, JST offset). Empty or future: the shop is shut (T2.2-02). |
| `MERCH_OFF` | `''` | `1`: no new checkouts; paid orders finish (T2.2-03). |
| `MERCH_COUNTRIES` | `''` | `all` (every country in `catalog.js` zones minus the never list), a list (`US,CA,AU`), or `all,-GB,-FR,...`. Empty: none. |
| `MERCH_PRODUCTS` | `mug,tee` | Products offered (must also be `launch: true` in `PawPrint.PRODUCTS`). |
| `MERCH_DAY_CAP` | `10` | Open + paid orders per JST day (T2.2-11). |
| `MERCH_PROVIDER_MODE` | `draft` | `draft` never confirms (T2.1-13); `live` confirms. |
| `MERCH_COOL_MIN` | `60` | The cancel window in minutes (the grace of 120 s is fixed in code). |
| `MERCH_STRIPE_VERSION` | (pinned) | `Stripe-Version` header, 2025-03-31 or later. |
| `MAIL_FROM`, `MERCH_OWNER_TO` | - | Sender and the owner's address for owner emails. |

Secrets: `MERCH_STRIPE_KEY` (restricted: Checkout Sessions write, Refunds write, Charges, PaymentIntents and Disputes read),
`MERCH_STRIPE_WEBHOOK_SECRET`, `MERCH_PROVIDER_KEY`, `MERCH_PROVIDER_WEBHOOK_SECRET` (if Printful signs), `MERCH_FILE_KEY`, `MERCH_HASH_KEY`,
`MERCH_ADMIN_KEY`, `RESEND_API_KEY` (send-only, this Worker). Tests only: `STRIPE_FETCH`, `PROVIDER_FETCH`, a fake `BROWSER`, `NOW` (the clock).
Bindings: `LEDGER` (`MerchLedger`), `PRINTS` (`MerchPrints`), `BROWSER` (Browser Run), `ASSETS` (the print pages). Compatibility date 2026-03-24 or
later (the Browser Run binding).

### 6.5 Timers

- **The ledger alarm** (always set to the next due time): renders (one line per wake, ≥ 11 s apart), drafts, confirms at `cancel_until + 120 s`, retries
  (`next_try_at`), hold timeouts (T2.2-14/15/29/36/38/39/52), the delay check (T2.1-30), stale `open` orders (T2.2-27), refund retries (T2.2-42).
  Calling Browser Run from inside the object is **not proven** (the test called it from the Worker and streamed into the object); if it fails, the
  Worker's cron makes the call and streams the body into `MerchPrints`, as tested.
- **One cron trigger** `*/10 * * * *`: wakes the ledger (a backstop if an alarm is lost) and, on the first run after 04:00 JST, the nightly job:
  costs and the margin guard (3.3), the report email to the owner, tidy (section 5), storage sums (6.6). Free allows 5 cron triggers per account;
  `pawhaven-api` uses 2: count again at deploy.

### 6.6 Print files: making, keeping, serving

- **Made** by Browser Run from `/merch/print/<art_ver>/#<print_link>` (PART1: `#p=<dog>&prod=&col=&pose=&n=`), tee at viewport 2250x2700 x2, mug
  2700x1050, `omitBackground: true` [cloud: pixel-identical to Chromium, 1.3-1.5 s billed per tee, 0.4-0.5 s per mug]. Free: 10 browser-minutes a
  day ≈ 410 tees ≈ 270 orders. Fallback: resvg-wasm inside `MerchPrints` [cloud: works on Free]; last resort: GitHub Actions (RENDER_FREE 1).
- **Checked:** PNG width and height from the header equal the product's; bytes ≤ 7.5 MB (the row limit is 8 MB); SHA-256 stored on the line.
- **Versions:** the Worker's static assets keep one folder per released `ART_VER` (about 0.8 MB each). The page sends its `art_ver`; a line renders
  with that folder forever (T2.2-49), so a re-render after the file is gone is the same picture.
- **Served** at `/merch/file/<key>/<exp>/<sig>.png`, links valid 30 days, given to Printful in the draft.
- **Kept 180 days after the line's last shipment** (covers Printful's 30-day claim window after delivery and the usual 120-day card dispute window),
  2 days after a cancel or a refund before printing. Storage per order is about 0.8 MB (a tee 0.65-0.71 MB, a mug 0.19-0.20 MB).
- **Free storage:** 5 GB per account for all Durable Objects. Plan 4 GB for prints: 180 days fits about **27 orders a day**. When the sum passes
  4 GB, the nightly job deletes the oldest files whose orders shipped more than 60 days ago and have no open dispute (60 days fits about **80 a day**),
  and emails the owner. Past 4.5 GB: the owner email says it is time for Workers Paid ($5 a month; stored data then $0.20 per GB-month over 5 GB).

### 6.7 Provider adapter (`cloudflare/merch/provider_printful.js`)

`quoteCost(lines, country)`, `createDraft(order, lines, recipient, fileUrls)`, `update(id, recipient)`, `confirm(id)`, `deleteDraft(id)`, `cancel(id)`
(may say `cannot`), `get(idOrExternal)`, `parseHook(req) -> {id, hint}`, `catalogCosts()`. The adapter maps Printful's states (v1: `draft`, `pending`,
`failed`, `canceled`, `inprocess`, `onhold`, `partial`, `fulfilled`) and shipments (each with `order_item_external_id`, `tracking_url`) to ours.
Known: drafts are not charged, `confirm` charges, edits only in `draft` or `failed`, shipments list their items, 120 requests a minute [fetched,
PROVIDERS 1.1]. Not verified until part 5 (with the owner's key): v2 webhook names and signing, GET by external id, cancel after confirm, how an
address refusal looks, the Korean customs code field.

### 6.8 Files

`cloudflare/merch/worker.js` (routes), `ledger.js` (`MerchLedger`), `prints.js` (`MerchPrints`), `catalog.js`, `stripe.js`, `provider_printful.js`,
`render.js`, `mail.js`, `admin.js`, `wrangler.toml` (and a `[env.test]` for `doodle-doggo-merch-test`); `merch/recipe_check.js` (a small decoder and
the recipe rules, without PawPrint: loading PawPrint costs 15 ms of CPU, over the Free plan's 10 ms; tested equal to `PawPrint.merchDecode` and
`printHash` on every sample dog); `merch/names.js` (shared with PawPrint); `tools/merch.sh` (the admin CLI). Tests: suite `merch_worker` (node; the
Durable Object storage faked over `node:sqlite`, as `cloudflare/d1_node.js` fakes D1; Stripe, Printful, Browser Run and the clock faked).

---

## 7. Legal pages and site text

- `/merch/terms` (Terms of sale), `/merch/shipping` (shipping and returns: zones, fees, the free-shipping lines, times, section 4 policy), `/merch/seller`
  (seller identity: trading name, HK Business Registration number, a geographic business address, email), `/privacy` "Merch orders" (section 5). Drafts
  for the owner, marked "to be checked by a professional".
- **Next to Pay:** the total in USD with shipping; the Adaptive Pricing line (3.1); the zone note ("may charge import tax ..." for `world`); "Printed just
  for you, so no returns if you change your mind. You can cancel within 1 hour."; the seller's name and contact; delivery times.
- **Countries:** the page does not list or single out countries (owner: "no need mention countries"). Only open countries appear under "Ship to"; the
  shipping page says "We can't deliver to some places yet."
- **English only at launch.** The other 11 site languages get one line: "The shop is in English for now."
- Japan's 特定商取引法に基づく表記 page if Japan is open (COUNTRIES 5).

## 8. Launch in stages ([O] = the owner approves or does it)

0. Decisions [O]: section 10. The accountant on UK VAT, the EU, US nexus [O].
1. **Sandbox build:** the merch Worker and its Durable Objects in the test environment, Printful `draft`, Stripe sandbox; `merch_worker` green. Deploy the test Worker [O, prompt].
2. **Sandbox end to end** on test.doodledoggo.app: each product, each zone with `+location_XX` emails (3.1 not-verified list), cancel in the hour, a refund before completed, a faked Printful refusal, a test dispute.
3. **Samples** [O]: one of each product and colour from our real print files.
4. **Live dry run** [O]: live keys, `MERCH_FROM` set, `MERCH_DAY_CAP=2`, `MERCH_PROVIDER_MODE=live`: one real order to a friend and one cancelled in the hour.
5. **Soft launch** [O, date; special-update rule]: mug and tee, `MERCH_COUNTRIES` as the owner sets it with the go-ahead, cap 10, wallet US$150.
   NEWS line and the Marketing briefing only after the owner sets the date.
6. **Widen** [O each]: more products (a catalog row), a higher cap, more countries as registrations come.

**Only the owner can:** open Printful and fund its wallet; open the separate Stripe account (HK, USD settlement, Adaptive Pricing, Stripe Tax head
office and tax codes, Radar rules, receipts, statement descriptor, the Terms URL, payment methods, the webhook endpoint with the 6.3 events); register for
tax where needed; set every secret; add the `merch-api` custom domain; approve each deploy prompt; place the sample and live-test orders.

## 9. Unit economics (per order; numbers in SHIPPING.md 2 and ECONOMICS.md)

The formula is 3.3. Model C, USA, Stripe case 2 (SHIPPING 2): a mug alone $24.98 paid / $9.41 margin (38%); a tee $31.98 / $11.54 (36%); mug + tee
$46.98, free shipping / $11.66 (25%); 2 tees $53.98 / $16.87 (31%). Expected margin about $11 an order. Run `node tools/merch_econ.js --cart` again
with mug and tee only, and for UK/EU without VAT, when `catalog.js` is made. A cancel costs the Stripe fee (3.1); a lost dispute costs 3.6 to 6.5 orders.

---

## 10. Open points for the owner (ask later, with the launch go-ahead or the next real question; recommendation first)

1. **Countries on launch day:** `MERCH_COUNTRIES=all` minus GB, the EU 27, Brazil and Korea (`all,-GB,-DE,-FR,...`), until the accountant confirms a
   UK VAT registration and an EU route (and Printful's Korean customs field is known); GB the day its registration is live in Stripe Tax.
   Alternative: truly all, accepting the tax duty from the first UK or EU order.
2. **Payment methods:** cards, Apple Pay, Google Pay and Link only at launch (no bank debits that settle days later, no pay-later).
3. **Per-line cancel:** no; "Cancel and change" puts the basket back (section 4).
4. **Print file keep time:** 180 days after shipping, shortened automatically only past 4 GB; Workers Paid only if orders stay above about 25 a day.
5. **A gift with each order:** yes, one cosmetic in-game code per order from a gift-code batch (or no gift: an empty pool).
6. **Soft-launch limits:** 10 orders a day and a US$150 Printful wallet.
7. **Automatic refunds when we can't make it:** as written (review 24-48 h, render 72 h, address 7 days, wallet 5 days).
8. **A dispute won before printing:** the owner decides each time (recommended: ship it).
9. **Cancels cost the Stripe fee** (about $1.50 on $35), because Adaptive Pricing rules out holding the card: accept it as the price of the kindness.
10. **Orders in a Durable Object, no D1:** yes, with a monthly export kept by the owner (`tools/merch.sh export`).
11. **The delivery promise:** Printful's estimate + 2 days on the page, so the FTC delay email is rare.
12. **USD-only prices for UK/EU buyers:** ask the adviser before GB or the EU opens (3.1 clash b).
