# Merch part 3: the merch order Worker, money faked (24 Nov 2026; review fixes 25 Nov 2026)

Built to the contract `TRANSACTIONS.md` (sections 2, 2.1, 2.2, 3, 4, 5, 6). **Nothing is deployed; nothing was created on Cloudflare, Stripe or Printful;
no outside service was called.** Stripe, Printful, the renderer and Resend sit behind four small seams that only talk through injected fetches; without
them (and without keys) the Worker refuses every order. Suite `merch_worker`: **156 checks, 156 pass** (one per row T2.1-01..33 and T2.2-01..56;
the review's cases R-M1..R-M5, R-S1..R-S16, R-N1..R-N9; 12 crash tests C-*; 5 race tests X-race-*; a draft-mode world; route, gate, signature,
privacy, admin and workerd checks).

The combined review (`docs/reviews/MERCH_PART3_review.md`, 5 must-fix, 16 should-fix, 9 nice) is fixed in full: the map is below.

## What was built

- **`cloudflare/merch/`**, a separate Worker `doodle-doggo-merch` (never `cloudflare/worker.js`): `worker.js` (front: CORS, signed files, print pages),
  `ledger.js` (`MerchLedger`: every table of 6.2, the alarm, the state machine, refunds, the outbox, the nightly job, tidy), `prints.js` (`MerchPrints`,
  one per JST day, PNGs in 1 MB parts), `catalog.js`, `lines.js` (switches, line checks, prices, margin guard), `stripe.js`, `provider_printful.js`,
  `render.js`, `mail.js`, `admin.js`, `build_assets.mjs`, `wrangler.example.toml`, `README.md`, `test/` (fakes, harness, seven test files).
- **`tools/merch.sh`**: list, show, refund a line, reprint, confirm, lost, flag, export, forget, report, tick, nightly. Dry run by default; the key from
  the environment only, sent on stdin.
- **Storage** as 6.1/6.2: SQLite Durable Objects only (no D1, KV or R2). Extra columns, all additive (an older table gets them in place at start):
  orders `hold_at`, `why`, `draft_del`, `lease_until`, `pcancel`, `draft_n`; lines `rp`, `keep_until`, `store_tries`; refunds `next_try_at`; a
  `merch_reprints` table (one row per `<order>-r<n>`, with `why`), `merch_outbox` (one row per email) and `merch_trash` (print files on their way out).
- **PawPrint on the server**: the built bundle (`merch/dist/pawprint.js`) loads in a Worker as it is (workerd imports it as a CommonJS module; tested in
  Miniflare). About 30 ms of CPU to load, so only the ledger object loads it (lazily, once).
- **Money**: server-side prices on every call, `expect_total` / `price_changed`, the margin guard on the whole order (checkout, draft, nightly), refunds
  per line (section 4 amounts, the `world` extra-item fee, shipping with the last item, the line's tax share only when the tax is exclusive), one parcel
  per product type, all keys as written (`mc_`, `mr_..._all_n`, `mr_..._l<line>_n`, `me_...`).

## The ledger's rules (after the review: "claim first" now holds everywhere)

Every await on an outside call in `ledger.js` and `admin.js` was gone through with this list (`prints.js` makes no outside call):

1. **A lease and a wake before the step.** A step that calls the printer or the renderer claims the order (`lease_until` = now + 3 min) and leaves a
   wake (`next_try_at` = now + 5 min) in the same write, before the call. The alarm claims each order before its step. A crash, a deploy eviction or an
   exception mid-step leaves the wake behind, so the order is worked on again (M2); an exception also sends one owner email a day (`stuck`). A request
   that dies (the alarm is then not re-armed) is picked up by the `*/10` cron. The report lists anything that should have a wake and has none.
2. **Read again after every await.** When the call returns, the order and the line are read again and the step acts only if they are still what it
   claimed; otherwise it undoes what it made: a draft made during a cancel, a refund or a dispute is deleted (M1); a render that ends after a cancel
   stores nothing and sends no "couldn't print" (S1); a reprint draft made during a refund or a dispute is deleted (`drop`).
3. **Nothing for a stopped order.** No confirm, reprint or reship for an order that is cancelled, refunded, expired or in dispute, or for a fully refunded
   line (M4). A Dashboard full refund marks every line refunded. `merch.sh confirm` releases only a review hold, `draft_mode` or a won dispute (M1).
4. **Nothing confirmed unless live.** `MERCH_PROVIDER_MODE` other than `live` never confirms an order or a reprint (M3: a reprint is held with no printer
   call at all; `merch.sh confirm` releases it once live).
5. **Money and mail are rows.** A refund is a `merch_refunds` row (its `next_try_at` is its lease, so the request and the alarm never send one key twice:
   N6); an email is a `merch_outbox` row written in the same transaction as the change it tells about, sent after commit, retried 1, 5, 15, 60, 180 min,
   and after the 6th failure the owner is told (S7). The buyer's address is never stored: read from the Stripe session at send time.

## Review fix map

| Id | Fix | Tests |
|---|---|---|
| M1 | `adopt()` reads the order again: a stopped order's new draft is deleted (`draft_del`); the estimate covers drafted lines only; a dispute hold is never overwritten; admin confirm only from review, draft_mode or a won dispute | R-M1, X-race-draft, T2.2-40 |
| M2 | the step lease and wake (rule 1); the report's `stranded` list | R-M2, C-*, C-exception |
| M3 | `workReprints` holds the reprint when not live; no printer call | R-M3, X-draft-world |
| M4 | no reship or reprint on refunded/cancelled/disputed orders or refunded lines; a Dashboard full refund sets `refunded_qty = qty` | R-M4, T2.2-45 |
| M5 | the gate also needs `providerReady` and `renderReady` | R-M5, X-not-set-up, X-shut-catalog |
| S1 | the render re-reads the line after its await | R-S1, X-race-render, X-race-store |
| S2 | the line's tax share only when exclusive (lines and full refunds; a reprint line carries its share) | R-S2, T2.2-56 |
| S3 | a partial Dashboard refund before completed: `held review` (`dash_refund`) with the amount; the owner confirms or, after 24 h, the rest goes back | R-S3, T2.2-18 |
| S4 | a refund on a `replaced` line: 409 `replaced {reprint}` | R-S4 |
| S5 | `charge.refunded` marks our sending row done; a retry 20 h or more after the row lists the refunds by payment intent and matches `metadata.merch_refund` first | R-S5, T2.2-42 |
| S6 | a completed event for an expired order is re-read and goes to `held review` (`late_pay`) | R-S6 |
| S7 | the outbox (rule 5); the owner email key carries the JST day | R-S7, C-mail |
| S8 | printer hints: 300 an hour per IP hash; in live mode only signed hints (401 `signing_required`), and the gate needs the secret before live | R-S8, T2.2-48 |
| S9 | the day cap counts orders paid in the JST day (open sessions never; cancelled ones not); a payment after the cap is served | R-S9, T2.2-01, T2.2-11, T2.1-02, T2.1-09 |
| S10 | every live order keeps a wake at `ship_by` until the delay email went (`lateWake`), held ones too (not during a dispute); the late cancel works for held orders | R-S10 |
| S11 | a failed store backs off (1, 5, 15, 60 min), keeps the PNG in memory (no re-render), emails the owner, past the hour `held render`; the report has the ledger's size and the day's row writes | R-S11 |
| S12 | `[env.test]` repeats every var and both Durable Object bindings; `MERCH_SITE` is the test copy | R-S12 |
| S13 | `POST /merch/admin/forget {order \| email}` and `merch.sh forget` (below) | R-S13 |
| S14 | released print folders live in git under `site/merch/print/<ART_VER>/`; `build_assets.mjs` copies every one and never deletes | R-S14 |
| S15 | `merch.sh refund` and the admin route refuse a reason with no letters | R-S15, X-merch-sh |
| S16 | a GET by external id before every draft create | R-S16, C-draft, T2.2-35 |
| N1 | refund counts by `glob`, not `like` | R-N1 |
| N2 | the cron deletes spent rate rows every 10 minutes | R-N2 |
| N3 | `refunded_all` ("in full") for full refunds | R-N3 |
| N4 | a stale confirm: only pending/inprocess/onhold/partial/fulfilled count as confirmed; failed/canceled: `held review` | R-N4 |
| N5 | the late cancel cancels the Printful order only when none of it has shipped; otherwise an owner email | R-N5, T2.1-31 |
| N6 | the refund row is claimed before the call | R-N6 |
| N7 | a dispute won before completed: confirm reads the payment from Stripe, then it is made | R-N7 |
| N8 | no public fallback hash key: without `MERCH_HASH_KEY` no email is hashed, raw flags are refused, IPs use a key kept in memory only | R-N8 |
| N9 | question 16 as decided (below) | R-N9 |

**Deletion on request** (S13, section 5): `merch.sh forget <order|email:address>` clears, for each ended order (shipped, cancelled, refunded, expired;
not while a dispute is open), the email hash, the dog's name, the recipe, the print link, the print PNGs and the parcels' tracking links. **What stays**
(the law's records): the order and line rows (money, country, product, colour, size, status, dates), refunds, parcels (carrier and dates), events, fraud
flags (a hash only), and whatever Stripe and Printful keep. Orders still in progress are listed as `waiting`. The answer lists the Printful orders whose
recipient the owner asks Printful to delete (no API for it is known: part 5).

## How to run

```
NODE_PATH=$(npm root -g) node tools/merch_build.js
NODE_PATH=$(npm root -g) node cloudflare/merch/test/run.mjs        # ~8 s; ONLY=<regex> for a subset
```

**Simulated, and what could not be:** Miniflare 4 runs SQLite Durable Objects, `transactionSync`, alarms and cron (`X-miniflare`). The node layer fakes
the object storage over `node:sqlite` and moves a fake clock. A crash is simulated by killing the running instance (every later storage call of it
throws) and starting a new one on the same storage; a killed alarm is retried after 2 s, as Cloudflare does. The fakes run any request at a chosen
moment during a call (a cancel, a refund, a dispute). The fake Stripe forgets idempotency keys after 24 h; the fake Resend sends one email per key.
Not simulated: the real Stripe, Printful, Browser Run and Resend answers (assumptions until parts 4, 5, 6 and 9), Cloudflare's real limits, a deploy.

## Routes (TRANSACTIONS.md 6.3)

| Route | Notes |
|---|---|
| `GET /merch/catalog` | `{cat_ver, shut, sold_out_today, products[{id, price, sizes[{id, add, price}], colours[{id, sizes, on}], poses, on}], zones[{id, fee, free_from, extra, eta: [min, max], notes: codes}], countries[{code, zone, soon}], max_lines, max_qty, art_vers}`; never-countries left out; no free text; `cache-control: public, max-age=60` |
| `POST /merch/quote` | 60/h per IP; writes nothing; answers while shut by `MERCH_FROM` with `shut: true`; a `soon` country 403 `country_closed`; `notes` are codes (`import_tax`, `vat_included`, `separate_parcels`); `eta: [min, max]` |
| `POST /merch/checkout` | 10/h per IP; `{order, url}`; one Stripe session, `Idempotency-Key: mc_<order>`; 503 `merch_closed` while shut |
| `GET /merch/order/:id` | 120/h; never an address, email or hash |
| `POST /merch/order/:id/cancel` `{scope: order\|late}` | 10/h; `late` also for held orders (not in a dispute) |
| `POST /merch/order/:id/address` | 10/h; only in `held address` or a reship hold; sent on, never stored; `{again: true}` when the print is redrawn first and the address will be asked once more |
| `POST /merch/order/:id/refund` | 10/h; only in `held address` |
| `POST /merch/webhook/stripe` | raw body, `Stripe-Signature`, 300 s; the session is re-read; 502 leaves no event row |
| `POST /merch/webhook/provider` | a hint (the Printful order is re-read); 300/h per IP; 401 on a bad signature, and on any unsigned hint in live mode |
| `GET /merch/file/<key>/<exp>/<sig>.png` | HMAC (`MERCH_FILE_KEY`) over key + exp; 403 bad or expired |
| `GET /merch/print/<art_ver>/*` | static assets, one folder per released `ART_VER` (from `site/merch/print/`) |
| `/merch/admin/*` | Bearer `MERCH_ADMIN_KEY` (16+ characters), 60/h: `orders`, `order/:id` (with its outbox rows), `order/:id/refund\|reprint\|confirm\|lost`, `flag`, `export`, `forget`, `report`, `tick`, `nightly` |
| cron `*/10` | wakes the ledger, deletes spent rate rows; the nightly job once a JST day after 04:00 |

## Contract questions (each one line; settled where the review or the Game Manager decided)

1. **Row size** (6.1, 6.2): a SQLite Durable Object row is at most 2 MB, not 8 MB; PNGs are kept in 1 MB parts (dated note under 6.2).
2. **"One request or alarm at a time"** (6.1, T2.2-40): not true across awaits; now every step follows the ledger's rules above (the review disagreed with the first build: fixed).
3. **Margin formula** (3.3 vs `tools/merch_econ.js`): built the script's form, so SHIPPING.md's margins hold to the cent.
4. **Day cap**: decided (S9): orders paid in the JST day, open sessions never, cancelled ones not; a payment after the cap is always served (dated note in TRANSACTIONS 2.2).
5. **Same nonce after the order moved on**: 409 `nonce_used {order}`.
6. **Cancel during a dispute**: 409 `not_allowed` (the bank decides the money).
7. **Tee sizes**: only sizes made in both the US and the UK, so no 5XL while the UK is shut; the owner may want the US list.
8. **2XL and up**: prices and costs are placeholders until part 5; Stripe tax codes not verified.
9. **`charge.refunded`**: the Worker re-reads `GET /v1/refunds?payment_intent=` (502 on failure); ours carry `metadata.merch_refund` and are marked done there (S5).
10. **Refund failure event**: `refund.failed`, `refund.updated` and `charge.refund.updated` with status `failed`; confirm the name in the sandbox (part 9).
11. **Late cancel (T2.1-31)**: what is left all shipped: `shipped`; shipping stays as charged; the Printful order is cancelled only when none of it shipped (N5).
12. **Held render (T2.2-29)**: a wake at `cancel_until` and at most every 2 h while held; each wake tries Browser Run once.
13. **Paid after we expired it**: decided: `held review` (`late_pay`), reached from the webhook too (S6); a full refund after 24 h unless the owner confirms.
14. **Dispute before completed (T2.2-24)**: the later completed records the payment and flags the email hash; the order stays held; a won dispute then `merch.sh confirm` makes it (N7).
15. **A Printful refusal naming no line**: `held review` and an owner email; part 5 learns the real error shapes.
16. **Reship with the file gone**: decided: the print is redrawn, then the buyer is ALWAYS asked for the address again through the form; never the address that bounced, never the Stripe session's (N9). A typed address is kept only in memory until it is sent on.
17. **Old print folders**: decided (S14): released folders live in git under `site/merch/print/<ART_VER>/` (the page build puts them there); `build_assets.mjs` copies every one and never deletes; a folder is never removed once an order was taken with it.
18. **Emails after a crash**: decided: the outbox (S7); any mail error is retried, nothing is lost.
19. **6.8 `merch/recipe_check.js`**: not needed (PawPrint loads in the ledger object); not written.
20. **Printful webhook signing before live** (new, S8): the gate refuses live mode without `MERCH_PROVIDER_WEBHOOK_SECRET`. If part 5 finds that Printful's webhooks cannot be signed, the owner decides: poll Printful from the alarm instead, or accept unsigned hints (they are re-read anyway).
21. **A draft deleted, then made again** (new): a later draft uses the external id `<order>-d<n>` (whether Printful refuses a reused external id is unknown: part 5).

## To verify with the printer's key (part 5): a checklist

Part 5 (25 Nov 2026) answered what Printful's published docs settle; each line says which. The details and sources are in PART5.md.

- [ ] Every error shape in `pf()` (the reasons `recipient`, `items`, `billing`, `cannot_cancel` are invented); map the real ones.
  *Part 5: answered from the docs for the shape (`{ code, result, error: { reason, message } }`, reasons such as `BadRequest`, `NotFound`, `TooManyRequests`; RFC 9457 on newer v2 routes), items named "Item <n>:" or `/order_items/<n>`, the recipient "Recipient: ...", OR-13 for a used external id, 429 with Retry-After. Still needs the key: the exact texts of a refused variant, a refused address and a failed charge.*
- [ ] Shipments: `order_item_external_id` or `item_id` per item (with `item_id`, parcels never attach: `mapOrder`).
  *Part 5: answered from the docs. v1 shipments name only `item_id` (the worry was right); v2 `shipment_items` carry `order_item_external_id` and `order_item_id`. The adapter uses v2, with the id as a fallback.*
- [ ] GET an order by external id (`/orders/@<external_id>`), including after it was deleted (what status, or 404).
  *Part 5: answered from the docs for GET by `@<external_id>` (v1 and v2). Still needs the key: what a deleted v2 draft answers (the adapter takes 404 and canceled as gone).*
- [ ] Whether a duplicate external id is refused (the `-d<n>` and `-r<n>` ids assume a new id is needed).
  *Part 5: answered from the docs (v1): "Each order's External ID must be unique within the store", OR-13 EXTERNAL_ID_IN_USE; at most 32 characters. Still needs the key: whether a deleted v2 draft frees its id (`-d<n>` stays either way).*
- [ ] DELETE on a draft vs a pending order; what a second DELETE answers (`deleteDraft` treats 404 and "canceled" as done).
  *Part 5: answered from the docs. v2 DELETE deletes a draft, failed or cancelled order not yet charged (204); v2 cannot cancel a pending order; v1 DELETE "Cancels pending order or draft" (used for the late cancel). Still needs the key: the second DELETE's answer.*
- [ ] The cost fields of a draft (`costs.subtotal`, `costs.shipping`, `costs.tax`).
  *Part 5: answered from the docs (v2 Costs: subtotal, discount, shipping, digitization, additional_fee, fulfillment_fee, retail_delivery_fee, vat, tax, total, worked out after the create: `calculation_status`). Still needs the key: one real draft's numbers (and whether `front_large` adds a fee as the only placement).*
- [ ] When Printful fetches the print files, against the 30-day signed link.
  *Part 5: still needs the key (not in the docs; the kit adds one file by URL and reads its status).*
- [ ] Webhook signing (header name, HMAC over what) and the event names (returned, on hold, hold removed); see question 20.
  *Part 5: answered from the docs. v1 cannot sign; v2 signs: HMAC-SHA256 of the raw body with the hex-decoded `secret_key`, hex in `x-pf-webhook-signature`. Events: shipment_sent, shipment_delivered, shipment_returned, order_failed, order_canceled, order_put_hold, order_remove_hold and others. worker.js forwards `x-pf-webhook-signature` and the adapter reads only that name (PART5.md, review fixes 1).*
- [ ] Whether a recipient can be deleted on request (section 5, `merch.sh forget`).
  *Part 5: still open (not in the API docs; ask Printful support, who are our processor under their Data Processing Terms).*
- [ ] `/merch/catalog-costs` is not a Printful route: the nightly cost read is written for real; the variant ids (`pf:<variant>`) are placeholders.
  *Part 5: done. `catalogCosts` reads v2 prices and Standard rates; the variant ids are Printful's, from the public catalog (catalog.js `PF_VARIANT_IDS`). Still needs the key: that the v2 ids are the same (the kit checks).*
- [x] Browser Run (part 4): calling it from inside the object: **verified in the cloud test, 25 Nov 2026** (PART4.md "The cloud test: results"; `MERCH_RENDER_VIA = "direct"` stays). Still open: the two 429 texts (the rate probe did not meet the limit); the code treats an unknown 429 safely.

## To verify in the Stripe sandbox (part 9): a checklist

- [ ] Amounts stay USD with Adaptive Pricing: `amount_total`, line items, `shipping_cost`, `total_details`.
- [ ] Line items come back in the order they were sent (`paidCheck` compares by position).
- [ ] The collected-information path of the shipping address and country (`collected_information.shipping_details`).
- [ ] Listing sessions by payment intent (`GET /v1/checkout/sessions?payment_intent=`).
- [ ] Refund metadata on the list call (`GET /v1/refunds?payment_intent=` returns `metadata.merch_refund`).
- [ ] The refund-failure event name (question 10).
- [ ] Idempotency: keys pruned after 24 h; the error on a reused key with other parameters.
- [ ] The answer to expiring a completed session (T2.1-19).
- [ ] The Terms URL for `consent_collection` (Dashboard).
- [ ] Adaptive Pricing for a Hong Kong account; partial refunds at the original rate (3.1 list).
- [ ] The test Worker's `[env.test]` inherits `migrations`, `triggers` and `assets` (S12) at its first deploy.

## Every row, its test and status

All tests are in `cloudflare/merch/test/` (`t_basics.mjs` X-rows, `t_21.mjs`, `t_22.mjs`, `t_admin.mjs`, `t_review.mjs` R-rows, `t_crash.mjs` C- and
X-race rows, `t_miniflare.mjs`), named by the row id. This table is made from the test files (each test's own name).

| Id | Test | Status |
|---|---|---|
| X-catalog | GET /merch/catalog: products, zones, countries, art_vers; no stickers; edge cache 60 s | pass |
| X-shut-catalog | catalog says shut when MERCH_FROM is empty or in the future, or nothing is set up | pass |
| X-countries | MERCH_COUNTRIES: empty, all, a list, minus codes and zones; the never list always wins | pass |
| X-quote-cents | quote totals to the cent for the SHIPPING.md baskets (model C) | pass |
| X-margin | the margin guard matches SHIPPING.md model C to the cent (US, no holiday): mug 9.41, tee 11.54, mug+tee 11.66, 2 tees 16.87, 2 mugs 13.11 | pass |
| X-lines | line checks: merge identical lines, the recipe, colour, size and pose tables, the name per product | pass |
| X-inputs | input checks on every route (bad JSON, bad country, bad nonce, no agree, unknown routes, wrong methods) | pass |
| X-cors | CORS: the site and localhost only; webhooks and files send no CORS headers; the test Worker only test.doodledoggo.app | pass |
| X-not-set-up | no fetch seams or no keys: the Worker refuses to take an order (it can never charge anyone by accident) | pass |
| X-shut-gate | the shut gate: checkout refuses when MERCH_FROM is empty; a quote answers with shut: true (prices are public); a soon country still 403 | pass |
| X-stickers | stickers are refused everywhere: quote, checkout, catalog, even with MERCH_PRODUCTS listing them; printHash refuses them too | pass |
| T2.1-01 | quote, valid basket: re-checks and prices every line; writes nothing | pass |
| T2.1-02 | checkout, valid, new nonce: order + lines (an open session is not counted: S9), one Stripe session (mc_<order>, expires in 1 h, only the quoted country), url stored | pass |
| T2.1-03 | checkout again, same nonce, url stored: the same {order, url}; no new order, no Stripe call | pass |
| T2.1-04 | checkout again, same nonce, the first tap still waiting on Stripe: 409 busy | pass |
| T2.1-05 | Stripe errors, cannot be reached or times out at checkout: order and lines deleted, 503 busy, the next tap starts clean | pass |
| T2.1-06 | completed + paid, checks pass: paid_at, cancel_until, amounts, pres_*, email_hash; lines queued; Thank you; alarm; gift code | pass |
| T2.1-07 | completed with payment_status unpaid (a delayed method): pay_pending = 1, nothing else | pass |
| T2.1-08 | async_payment_succeeded: as T2.1-06, the hour starts now | pass |
| T2.1-09 | session expired or async_payment_failed: lines void; an expired order never takes a day-cap place (S9: paid orders only) | pass |
| T2.1-10 | alarm: a queued line, renderer free: renders, stores the PNG, checks its size, writes sha, bytes, art_ver; lines at least 11 s apart | pass |
| T2.1-11 | alarm: every line ready: one Printful draft (not charged), draft costs stored, lines drafted | pass |
| T2.1-12 | alarm at cancel_until + 120 s, draft made, costs within 10%, live: claims confirming, confirms at Printful | pass |
| T2.1-13 | MERCH_PROVIDER_MODE=draft: never confirms; held draft_mode, listed in the report | pass |
| T2.1-14 | Printful order in production (re-read after a hint): lines in_production | pass |
| T2.1-15 | a Printful shipment for some lines: parcel row, lines shipped, one On its way email me_<order>_ship_<parcel>, part_shipped | pass |
| T2.1-16 | shipment for the last live lines: shipped | pass |
| T2.1-17 | Printful reports a parcel delivered: delivered_at, lines delivered | pass |
| T2.1-18 | cancel within the hour: cancelled first, full refund mr_<order>_all_1, draft deleted, Cancelled email, files kept 2 days | pass |
| T2.1-19 | cancel an unpaid order: expire the session at Stripe; if it is not open, GET tells expired from complete | pass |
| T2.1-20 | cancel after the window (confirming or later): 409 too_late, nothing changes | pass |
| T2.1-21 | owner refunds a line (merch.sh refund): row mr_<order>_l<line>_<n>, a Stripe partial refund (section 4), refunded_qty, Refunded email | pass |
| T2.1-22 | a refund that leaves no item un-refunded also refunds the shipping that is left: refunded | pass |
| T2.1-23 | owner reprints lines: new line rows (reprint_of, 101), the stored PNG, a Printful order <order>-r1 confirmed at once, old lines replaced | pass |
| T2.1-24 | any Stripe event id seen before: 200, nothing changes (the event row is written with the work) | pass |
| T2.1-25 | completed and async_payment_succeeded both arrive for one paid session: the second is a no-op | pass |
| T2.1-26 | session expired after completed: ignored | pass |
| T2.1-27 | the same Printful hint twice (its event id or sha256 of the body): no-op | pass |
| T2.1-28 | Printful hints out of order (shipped, then in production): the re-read decides; a line never moves back | pass |
| T2.1-29 | address fix in held address: sent straight to Printful (never stored), hold cleared, the flow resumes (confirm if the hour passed) | pass |
| T2.1-30 | alarm: a live line not shipped by ship_by: once per order "Taking longer than we said", late_sent_at | pass |
| T2.1-31 | cancel {scope: late} after the delay email: refunds every unshipped live line; Printful cancels the order only if none of it shipped (N5), else an owner email | pass |
| T2.1-32 | nightly: a variant that fails the floor alone: on_flag = 0, owner email; quote and checkout 409 variant_off | pass |
| T2.1-33 | tidy (nightly): files, hashes, names, recipes, events, unpaid orders, rate rows (section 5) | pass |
| T2.2-01 | two tabs, two nonces, the same basket: two open orders (open sessions never count toward the cap: S9); the unpaid one expires within 1 h | pass |
| T2.2-02 | shop shut (MERCH_FROM empty or future): checkout 503 merch_closed, quote answers shut: true, catalog shut; webhooks, renders, confirms and refunds still run | pass |
| T2.2-03 | MERCH_OFF=1: new checkouts refused (resting); paid orders finish; order pages say resting | pass |
| T2.2-04 | country not open (MERCH_COUNTRIES, the never list): 403 country_closed | pass |
| T2.2-05 | product not in MERCH_PRODUCTS (stickers) or not launch: 400 bad_line {line, why: product} | pass |
| T2.2-06 | bad recipe, two dogs in one line, unknown colour, size or pose: 400 bad_line {line, why} | pass |
| T2.2-07 | name refused by merch/names.js: 400 bad_name {line, say} | pass |
| T2.2-08 | more than 6 lines, quantity 0 or over 3 (identical lines are merged first): too_many / bad_qty | pass |
| T2.2-09 | expect_total differs from the server total: 409 price_changed {quote}; nothing written | pass |
| T2.2-10 | the catalog changes after a session is made, before payment: the session’s prices are honoured (checks use the order row) | pass |
| T2.2-11 | day cap reached (paid orders of the JST day): 409 sold_out_today; sessions already open are honoured when paid, even after the cap is lowered | pass |
| T2.2-12 | the live margin guard fails at checkout (costs moved): 409 cant_make; owner email with the basket | pass |
| T2.2-13 | art_ver from the page is not a version the Worker serves: 409 art_changed | pass |
| T2.2-14 | a paid session fails the re-read checks (amount, currency, lines, order id, a discount alone, a shipping fee): held review; no render; owner email; 24 h: full refund | pass |
| T2.2-15 | shipping country on the paid session differs from the order’s: review (other_country); after 24 h a full refund | pass |
| T2.2-16 | Stripe re-read fails (network, 429, any non-OK): 502, nothing written, no event row; Stripe retries | pass |
| T2.2-17 | bad Stripe-Signature or outside 300 s: 400 bad_signature / stale (and good, replayed) | pass |
| T2.2-18 | charge.refunded (full) before completed: session looked up by payment_intent; order refunded, lines cancelled; the later completed makes nothing; lookup fails: 502; a PARTIAL refund before completed: held review for the owner, 24 h: the rest back (S3) | pass |
| T2.2-19 | a partial refund made in the Stripe Dashboard: refunded += amount; an unassigned merch_refunds row; lines unchanged; nightly report | pass |
| T2.2-20 | a full refund in the Dashboard, order not yet confirmed: refunded; the Printful draft deleted; never confirmed | pass |
| T2.2-21 | a full refund in the Dashboard after confirm: refunded (it stays so: later shipments are stored as parcels); owner email | pass |
| T2.2-22 | charge.dispute.created before confirm: held dispute; draft deleted; no confirm, no refund; the email hash flagged block | pass |
| T2.2-23 | a dispute after confirm or shipping: flag only; the flow goes on; hash flagged | pass |
| T2.2-24 | a dispute before completed: session lookup by payment_intent; held dispute; the later completed does nothing more | pass |
| T2.2-25 | charge.dispute.closed, won: dispute won; an unprinted held order stays held; owner email (the owner decides) | pass |
| T2.2-26 | charge.dispute.closed, lost: dispute lost; draft lines deleted at Printful if still a draft; in the report | pass |
| T2.2-27 | checkout abandoned and no expired event: alarm at expires_at + 1 h asks Stripe: expired -> T2.1-09; complete and paid -> T2.1-06 | pass |
| T2.2-28 | render error on one line: retry once after 1 min; then resvg; still failing: line rejected, line refund, owner email; other lines go on | pass |
| T2.2-29 | Browser Run 429 for the day: resvg fallback; if that fails, wait for 00:00 UTC; past the hour held render; owner email at 2 h; refund at 72 h | pass |
| T2.2-30 | Browser Run 429 for the 1-per-10-s rate: next try in 11 s; no hold | pass |
| T2.2-31 | a print shard write fails (full): the next shard for that day (p-YYYY-MM-DD-b); retry at once | pass |
| T2.2-32 | Printful refuses one line at draft: that line rejected; the draft made with the rest; line refund; the variant off; owner email | pass |
| T2.2-33 | Printful refuses every line: full refund, shipping included; refunded; owner email | pass |
| T2.2-34 | Printful down (5xx or 429): backoff 1, 5, 15, 60 min, then hourly; past the hour held provider; owner email at 24 h | pass |
| T2.2-35 | Printful create times out or the object is killed after it (result unknown): GET by external id before creating again; never two Printful orders | pass |
| T2.2-36 | Printful refuses the recipient: held address; "We need your address" email; 7 days without a fix: full refund | pass |
| T2.2-37 | address fix in another country: 400 other_country; "Refund me instead" only in held address | pass |
| T2.2-38 | Printful billing fails at confirm: held wallet; retry every 30 min; owner email at once; 5 days: full refund | pass |
| T2.2-39 | draft cost over cost_est + 10%: held review; owner email; owner confirms, or after 48 h: confirm if the margin is still >= $0, else refund | pass |
| T2.2-40 | cancel at minute 59 racing the confirm: both orders of arrival; a cancel during the draft call deletes the new draft (M1) | pass |
| T2.2-41 | cancel while Printful is down: cancelled and the refund first; the draft deletion is retried; a cancelled order is never confirmed | pass |
| T2.2-42 | Stripe refund call fails: the row stays sending with its key; the alarm retries with the same Idempotency-Key; owner email after 24 h; Stripe forgets keys after 24 h | pass |
| T2.2-43 | a refund fails later at the bank (refund.failed / charge.refund.updated failed): refund_failed = 1; owner email | pass |
| T2.2-44 | one parcel lost (merch.sh lost): lost_at; its lines reprinted or refunded; the other parcel untouched | pass |
| T2.2-45 | a parcel comes back to Printful: returned_at; hold reship (status stays); "We need your address"; one free reship after the fix; 7 days: refund those lines; a refunded order is never reshipped (M4) | pass |
| T2.2-46 | Printful puts a confirmed order on hold: held provider; owner email; back when the hold is removed | pass |
| T2.2-47 | a Printful hint for an order we don’t know (a claim reship): logged, 200; attached by merch.sh reprint ... <provider order> | pass |
| T2.2-48 | a Printful hint with a bad or missing signature: 401 when signing is set up; without a secret: accepted as a hint only while not live (S8) | pass |
| T2.2-49 | the Worker is redeployed with a new ART_VER between pay and render: the render uses the line’s own art_ver folder | pass |
| T2.2-50 | rate limits (6.3): 429 slow_down (quote 60/h, checkout 10/h, order 120/h, buttons 10/h, admin 60/h per IP) | pass |
| T2.2-51 | IP flagged block: checkout 403 not_available | pass |
| T2.2-52 | a paid order from a blocked email hash, or the 4th in 24 h from one hash: held review; owner email; blocked: refund after 24 h; 4th: goes on | pass |
| T2.2-53 | GET /merch/order/:id with an unknown id: 404 not_found | pass |
| T2.2-54 | file URL expired or bad signature: 403 (a reprint signs a fresh URL) | pass |
| T2.2-55 | the Worker or object stops mid-step (timeouts and real kills after the confirm and the refund): the confirming claim is re-read (GET first); a sending refund is retried | pass |
| T2.2-56 | Stripe Tax returns tax on a paid order where none was expected: the real tax is stored; the margin re-checked; the buyer is served; an inclusive-tax line refund adds no tax (S2) | pass |
| X-admin-auth | admin routes: Bearer MERCH_ADMIN_KEY; unset or short key: always 401 | pass |
| X-admin-list-show | list and show: orders by status and hold; show has lines, parcels, refunds, events, signed print links; no email hash | pass |
| X-admin-export | export: JSON lines in a date range with no buyer data (no email hash, dog name, recipe, links) | pass |
| X-admin-flag-report | flag (block, allow, clear; raw email or IP hashed server side) and the report | pass |
| X-privacy | no address or email is ever stored or returned by GET /merch/order/:id (section 5); the page has what the buyer needs | pass |
| X-time-travel | time travel for the cooling hour: can_cancel until cancel_until + 120 s, the confirm alarm at exactly that time | pass |
| X-merch-sh | tools/merch.sh prints what it would do by default; never prints the key; checks its arguments | pass |
| R-M1 | a cancel / refund / dispute during the draft: the draft is deleted, no cost hold over a dispute; merch.sh confirm only from review, draft_mode or a won dispute | pass |
| R-M2 | the step lease: the wake is written BEFORE the outside call; a paid order without a wake shows in the report | pass |
| R-M3 | draft mode: a reprint (here through the reship address form) is held, never confirmed at the printer | pass |
| R-M4 | no reship or reprint on a refunded order: a Dashboard full refund marks every line refunded; reprint and the address form refuse | pass |
| R-M5 | the gate needs the printer and the renderer too: without either, checkout is 503 and Stripe is never called | pass |
| R-S1 | a render that ends after a cancel: the line stays cancelled; a render that FAILS after a cancel sends no "couldn’t print" | pass |
| R-S2 | a line refund adds the line tax only when the tax is exclusive (inclusive: inside the price) | pass |
| R-S3 | a partial Dashboard refund before completed: held review with the amount, the owner decides (confirm makes it); never "refunded, make nothing" | pass |
| R-S4 | a refund on a replaced line is refused (409 replaced, it names the reprint line); the reprint line can be refunded | pass |
| R-S5 | charge.refunded marks our own sending row done; a retry after 20 h lists the refunds first (Stripe forgot the key) | pass |
| R-S6 | question 13: a completed event for an expired order: held review late_pay, refunded after 24 h unless the owner confirms | pass |
| R-S7 | the outbox: a failed email is retried and sent once; after the last try the owner is told; the nightly report has one email per JST day | pass |
| R-S8 | printer hints: rate-limited per IP; in live mode only signed hints are read | pass |
| R-S9 | the day cap counts paid orders of the JST day only: open sessions never block the shop; a payment after the cap is reached is served | pass |
| R-S10 | the delay email runs for held orders too; the late cancel then refunds it | pass |
| R-S11 | a failed print store backs off (no re-render), tells the owner; the report shows the ledger’s storage and writes | pass |
| R-S12 | wrangler.example.toml: [env.test] repeats every var and both Durable Object bindings, and points MERCH_SITE at the test copy | pass |
| R-S13 | deletion on request (admin forget, merch.sh forget): buyer data and files of ended orders cleared, the money rows kept; orders in progress wait | pass |
| R-S14 | build_assets.mjs copies every released folder from site/merch/print/ and never deletes one already served | pass |
| R-S15 | merch.sh refund <order> <line> 2 with the reason forgotten is refused (and the server refuses a reason with no words) | pass |
| R-S16 | GET before EVERY draft create (not only after a timeout): a crash during the create never gives a second draft | pass |
| R-N1 | refund ids per line: line 1 and line 101 count apart (no LIKE wildcard) | pass |
| R-N2 | rate rows go within the hour (the */10 cron), not only at the nightly tidy | pass |
| R-N3 | a full refund email says "in full"; a part refund says "part" | pass |
| R-N4 | a stale confirming order that Printful shows as canceled or failed is held for the owner, never taken as confirmed | pass |
| R-N5 | a late cancel never cancels the whole Printful order once part of it has shipped (see T2.1-31) | pass |
| R-N6 | the request’s flush and the alarm never send one refund key at the same time (the row is claimed) | pass |
| R-N7 | a dispute won before completed, then confirm: the payment is read from Stripe and it is made (not refunded) | pass |
| R-N8 | no public fallback hash key: without MERCH_HASH_KEY no order is taken, an email is never hashed, raw flags are refused | pass |
| R-N9 | question 16: a reship whose print file is gone re-renders, then asks the buyer for the address again; the bounced address is never used | pass |
| C-checkout | killed after Stripe made the session (url never stored): the order expires by itself; nobody can pay it | pass |
| C-paid | killed after the webhook re-read the session: no event row, Stripe resends, paid once, one Thank you | pass |
| C-render | killed after the renderer answered: re-rendered after the lease, one file, the flow goes on | pass |
| C-store | killed after the print file was stored but before the ledger wrote it: stored again under the same key, drafted | pass |
| C-draft | killed after Printful made the draft: the wake GETs it by external id and adopts it (never two drafts) | pass |
| C-confirm | killed after Printful confirmed (charged): the stale confirming claim is re-read, never a second confirm | pass |
| C-refund | killed after Stripe made the refund (a cancel): the row stays sending and is retried with its key: one refund | pass |
| C-deldraft | killed after Printful deleted the draft: draft_del stays, the retry finds it gone (404 = done) | pass |
| C-mail | killed after Resend sent the Thank you: the outbox row is sent again with the same key, Resend sends nothing new: one email | pass |
| C-reprint | killed after the reprint was made, and after it was confirmed: one reprint order, one confirm each | pass |
| C-address | killed after the fixed address made the draft (a request): the buyer can send it again, the GET finds the draft | pass |
| C-exception | a step that throws (not a crash): the lease leaves a wake, the owner is told, the next wake works | pass |
| X-race-render | S1: a cancel, a Dashboard refund or a dispute while the renderer works: the line is never set ready again, nothing more is made | pass |
| X-race-store | the same while the print file is being stored: kept 2 days at most, nothing more is made | pass |
| X-race-draft | M1: the same while Printful makes the draft: the new draft is deleted, the dispute hold is never overwritten | pass |
| X-race-confirm | during the confirm call: a cancel is too_late; a Dashboard refund leaves it refunded with confirmed_at kept and an owner email; a dispute only flags | pass |
| X-race-reprint | during a reprint’s create: a Dashboard refund or a dispute: the reprint draft is deleted and never confirmed | pass |
| X-draft-world | MERCH_PROVIDER_MODE=draft, a whole world: orders, owner confirm, reprints, a reship: nothing is ever confirmed at the printer | pass |
| X-miniflare | workerd: catalog, quote, checkout, the signed webhook, a real alarm renders into MerchPrints (parts), the draft, the signed file, cancel with refund, the cron | pass |

## For the Game Manager

- Merge `cloudflare/merch/**`, `tools/merch.sh`, this file and the dated notes in TRANSACTIONS.md; no shared file was touched.
- Add the suite to the runner if wanted: `merch_worker: { file: '../cloudflare/merch/test/run.mjs' }` (it needs `NODE_PATH=$(npm root -g)`).
- Then part 4 (Browser Run in `render.js`) and part 5 (the real Printful adapter, with the checklist above) replace two seams.
- Part 6 (25 Nov 2026, `PART6.md`) wrote the real email texts in `mail.js`, the order link form, the gift pool and the order page; suite now 166 checks
  (`test/t_part6.mjs`, rows P6-*).
- The part 6 review batch (25 Nov 2026, PART6.md "Review fixes") added the delay plan (row T2.1-34), the gift shown after the cancel hour and
  the other fixes, keeping the ledger's rules above (every step and its marker in one transaction; crash tests F6-crash-late); suite 181 checks
  (`test/t_fix6.mjs`, rows F6-*).
- Owner, with the launch go-ahead (not before): the contract's section 10 points, plus questions 7 and 20 above.
- Nothing to deploy; the README lists the secrets (names only) and approvals any deploy will need.
