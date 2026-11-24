# Merch part 3: the merch order Worker, money faked (24 Nov 2026)

Built to the contract `TRANSACTIONS.md` (sections 2, 2.1, 2.2, 3, 4, 5, 6). **Nothing is deployed; nothing was created on Cloudflare, Stripe or Printful;
no outside service was called.** Stripe, Printful, the renderer and Resend sit behind four small seams that only talk through injected fetches; without
them (and without keys) the Worker refuses every order. Suite `merch_worker`: **108 checks, 108 pass** (one per row T2.1-01..33 and T2.2-01..56, plus 19
route, gate, signature, privacy, admin and workerd checks).

## What was built

- **`cloudflare/merch/`**, a separate Worker `doodle-doggo-merch` (never `cloudflare/worker.js`): `worker.js` (front: CORS, signed files, print pages),
  `ledger.js` (`MerchLedger`: every table of 6.2, the alarm, the state machine, refunds, the nightly job, tidy), `prints.js` (`MerchPrints`, one per JST
  day, PNGs in 1 MB parts), `catalog.js`, `lines.js` (switches, line checks, prices, margin guard), `stripe.js`, `provider_printful.js`, `render.js`,
  `mail.js`, `admin.js`, `build_assets.mjs`, `wrangler.example.toml`, `README.md`, `test/` (fakes, harness, five test files).
- **`tools/merch.sh`**: list, show, refund a line, reprint, confirm, lost, flag, export, report, tick, nightly. Dry run by default; the key from the
  environment only, sent on stdin.
- **Storage** as 6.1/6.2: SQLite Durable Objects only (no D1, KV or R2). Extra columns, all additive: orders `hold_at`, `why`, `draft_del`; lines `rp`,
  `keep_until`; refunds `next_try_at`; a `merch_reprints` table (one row per `<order>-r<n>`).
- **PawPrint on the server**: the built bundle (`merch/dist/pawprint.js`) **loads in a Worker as it is** (workerd imports it as a CommonJS module from
  ES modules; tested in Miniflare). Nothing is missing. It costs about 30 ms of CPU to load, so only the ledger object loads it (lazily, once); the
  front Worker never does. Every line: `merchDecode` (exactly one dog), launch product and `MERCH_PRODUCTS`, colour/size/pose from `PawPrint.PRODUCTS`
  and the catalog, `PawPrint.nameOk(name, {product})` (which runs `merch/names.js` and the per-product fit), then the canonical recipe
  (`merchEncode`), `printHash` with the line's `art_ver`, and `ART_VER` are stored with the line.
- **Money**: server-side prices on every call, `expect_total` / `price_changed`, the margin guard on the whole order (at checkout, at the draft, nightly),
  refunds per line (section 4 amounts, the `world` extra-item fee, shipping with the last item), one parcel per product type, all keys as written
  (`mc_`, `mr_..._all_n`, `mr_..._l<line>_n`, `me_...`).

## How to run

```
NODE_PATH=$(npm root -g) node tools/merch_build.js
NODE_PATH=$(npm root -g) node cloudflare/merch/test/run.mjs        # ~6 s; ONLY=<regex> for a subset
```

**Simulated, and what could not be:** Miniflare 4 here runs SQLite Durable Objects, `transactionSync`, alarms and cron (`X-miniflare`: checkout,
signed webhook, a real alarm renders into `MerchPrints` in parts, draft, signed file, cancel and refund, cron). The node layer fakes the object storage
over `node:sqlite` and moves a fake clock, so the cooling hour, backoffs, 24 h / 48 h / 72 h / 7-day holds and tidy are tested exactly. Not simulated:
the real Stripe, Printful, Browser Run and Resend answers (their shapes are assumptions until parts 4, 5, 6 and 9), Cloudflare's real CPU and row limits
(only Miniflare's), and a real deploy.

## Routes (TRANSACTIONS.md 6.3)

| Route | Notes |
|---|---|
| `GET /merch/catalog` | `{cat_ver, shut, sold_out_today, products, zones, countries (open only), max_lines, max_qty, art_vers}`; `cache-control: public, max-age=60` |
| `POST /merch/quote` | 60/h per IP; writes nothing |
| `POST /merch/checkout` | 10/h per IP; `{order, url}`; one Stripe session, `Idempotency-Key: mc_<order>` |
| `GET /merch/order/:id` | 120/h; never an address, email or hash |
| `POST /merch/order/:id/cancel` `{scope: order\|late}` | 10/h |
| `POST /merch/order/:id/address` | 10/h; only in `held address` or a returned parcel; sent on, never stored |
| `POST /merch/order/:id/refund` | 10/h; only in `held address` |
| `POST /merch/webhook/stripe` | raw body, `Stripe-Signature`, 300 s; the session is re-read; 502 leaves no event row |
| `POST /merch/webhook/provider` | a hint: the Printful order is re-read; 401 when signing is set up and the signature is bad |
| `GET /merch/file/<key>/<exp>/<sig>.png` | HMAC (`MERCH_FILE_KEY`) over key + exp; 403 bad or expired |
| `GET /merch/print/<art_ver>/*` | static assets, one folder per released `ART_VER` |
| `/merch/admin/*` | Bearer `MERCH_ADMIN_KEY` (16+ characters), 60/h: `orders`, `order/:id`, `order/:id/refund\|reprint\|confirm\|lost`, `flag`, `export`, `report`, `tick`, `nightly` |
| cron `*/10` | wakes the ledger; the nightly job once a JST day after 04:00 |

## Every T row, its test and status

All tests are in `cloudflare/merch/test/` (`t_basics.mjs` X-rows, `t_21.mjs`, `t_22.mjs`, `t_admin.mjs`, `t_miniflare.mjs`), named by the row id.

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
| X-shut-gate | the shut gate: quote and checkout refuse when MERCH_FROM is empty (every money route that starts an order) | pass |
| X-stickers | stickers are refused everywhere: quote, checkout, catalog, even with MERCH_PRODUCTS listing them; printHash refuses them too | pass |
| T2.1-01 | quote, valid basket: re-checks and prices every line; writes nothing | pass |
| T2.1-02 | checkout, valid, new nonce: order + lines, day cap counted, one Stripe session (mc_<order>, expires in 1 h, only the quoted country), url stored | pass |
| T2.1-03 | checkout again, same nonce, url stored: the same {order, url}; no new order, no Stripe call | pass |
| T2.1-04 | checkout again, same nonce, the first tap still waiting on Stripe: 409 busy | pass |
| T2.1-05 | Stripe errors or cannot be reached at checkout: order and lines deleted, 503 busy, the next tap starts clean | pass |
| T2.1-06 | completed + paid, checks pass: paid_at, cancel_until, amounts, pres_*, email_hash; lines queued; Thank you; alarm; gift code | pass |
| T2.1-07 | completed with payment_status unpaid (a delayed method): pay_pending = 1, nothing else | pass |
| T2.1-08 | async_payment_succeeded: as T2.1-06, the hour starts now | pass |
| T2.1-09 | session expired or async_payment_failed: lines void, the day cap place is free again | pass |
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
| T2.1-31 | cancel {scope: late} after the delay email: refunds every unshipped live line; asks Printful to cancel them; owner email when it cannot | pass |
| T2.1-32 | nightly: a variant that fails the floor alone: on_flag = 0, owner email; quote and checkout 409 variant_off | pass |
| T2.1-33 | tidy (nightly): files, hashes, names, recipes, events, unpaid orders, rate rows (section 5) | pass |
| T2.2-01 | two tabs, two nonces, the same basket: two open orders, both count; the unpaid one expires within 1 h | pass |
| T2.2-02 | shop shut (MERCH_FROM empty or future): quote and checkout 503 merch_closed, catalog shut; webhooks, renders, confirms and refunds still run | pass |
| T2.2-03 | MERCH_OFF=1: new checkouts refused (resting); paid orders finish; order pages say resting | pass |
| T2.2-04 | country not open (MERCH_COUNTRIES, the never list): 403 country_closed | pass |
| T2.2-05 | product not in MERCH_PRODUCTS (stickers) or not launch: 400 bad_line {line, why: product} | pass |
| T2.2-06 | bad recipe, two dogs in one line, unknown colour, size or pose: 400 bad_line {line, why} | pass |
| T2.2-07 | name refused by merch/names.js: 400 bad_name {line, say} | pass |
| T2.2-08 | more than 6 lines, quantity 0 or over 3 (identical lines are merged first): too_many / bad_qty | pass |
| T2.2-09 | expect_total differs from the server total: 409 price_changed {quote}; nothing written | pass |
| T2.2-10 | the catalog changes after a session is made, before payment: the session’s prices are honoured (checks use the order row) | pass |
| T2.2-11 | day cap reached: 409 sold_out_today; sessions already open are honoured when paid, even after the cap is lowered | pass |
| T2.2-12 | the live margin guard fails at checkout (costs moved): 409 cant_make; owner email with the basket | pass |
| T2.2-13 | art_ver from the page is not a version the Worker serves: 409 art_changed | pass |
| T2.2-14 | a paid session fails the re-read checks (amount, currency, lines, order id, discount): held review; no render; owner email; 24 h: full refund | pass |
| T2.2-15 | shipping country on the paid session differs from the order’s: review (other_country); after 24 h a full refund | pass |
| T2.2-16 | Stripe re-read fails (network, 429, any non-OK): 502, nothing written, no event row; Stripe retries | pass |
| T2.2-17 | bad Stripe-Signature or outside 300 s: 400 bad_signature / stale (and good, replayed) | pass |
| T2.2-18 | charge.refunded (full) before completed: session looked up by payment_intent; order refunded, lines cancelled; the later completed makes nothing; lookup fails: 502 | pass |
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
| T2.2-35 | Printful create times out (result unknown): GET by external id before creating again; never two Printful orders | pass |
| T2.2-36 | Printful refuses the recipient: held address; "We need your address" email; 7 days without a fix: full refund | pass |
| T2.2-37 | address fix in another country: 400 other_country; "Refund me instead" only in held address | pass |
| T2.2-38 | Printful billing fails at confirm: held wallet; retry every 30 min; owner email at once; 5 days: full refund | pass |
| T2.2-39 | draft cost over cost_est + 10%: held review; owner email; owner confirms, or after 48 h: confirm if the margin is still >= $0, else refund | pass |
| T2.2-40 | cancel at minute 59 racing the confirm: both orders of arrival (time travel against the confirm alarm) | pass |
| T2.2-41 | cancel while Printful is down: cancelled and the refund first; the draft deletion is retried; a cancelled order is never confirmed | pass |
| T2.2-42 | Stripe refund call fails: the row stays sending with its key; the alarm retries with the same Idempotency-Key; owner email after 24 h | pass |
| T2.2-43 | a refund fails later at the bank (refund.failed / charge.refund.updated failed): refund_failed = 1; owner email | pass |
| T2.2-44 | one parcel lost (merch.sh lost): lost_at; its lines reprinted or refunded; the other parcel untouched | pass |
| T2.2-45 | a parcel comes back to Printful: returned_at; hold reship (status stays); "We need your address"; one free reship after the fix; 7 days: refund those lines | pass |
| T2.2-46 | Printful puts a confirmed order on hold: held provider; owner email; back when the hold is removed | pass |
| T2.2-47 | a Printful hint for an order we don’t know (a claim reship): logged, 200; attached by merch.sh reprint ... <provider order> | pass |
| T2.2-48 | a Printful hint with a bad or missing signature: 401 when signing is set up; otherwise accepted as a hint | pass |
| T2.2-49 | the Worker is redeployed with a new ART_VER between pay and render: the render uses the line’s own art_ver folder | pass |
| T2.2-50 | rate limits (6.3): 429 slow_down (quote 60/h, checkout 10/h, order 120/h, buttons 10/h, admin 60/h per IP) | pass |
| T2.2-51 | IP flagged block: checkout 403 not_available | pass |
| T2.2-52 | a paid order from a blocked email hash, or the 4th in 24 h from one hash: held review; owner email; blocked: refund after 24 h; 4th: goes on | pass |
| T2.2-53 | GET /merch/order/:id with an unknown id: 404 not_found | pass |
| T2.2-54 | file URL expired or bad signature: 403 (a reprint signs a fresh URL) | pass |
| T2.2-55 | the Worker or object stops mid-step: a confirming claim older than 2 min is retried (GET first); a sending refund is retried | pass |
| T2.2-56 | Stripe Tax returns tax on a paid order where none was expected: the real tax is stored; the margin re-checked; the buyer is served | pass |
| X-admin-auth | admin routes: Bearer MERCH_ADMIN_KEY; unset or short key: always 401 | pass |
| X-admin-list-show | list and show: orders by status and hold; show has lines, parcels, refunds, events, signed print links; no email hash | pass |
| X-admin-export | export: JSON lines in a date range with no buyer data (no email hash, dog name, recipe, links) | pass |
| X-admin-flag-report | flag (block, allow, clear; raw email or IP hashed server side) and the report | pass |
| X-privacy | no address or email is ever stored or returned by GET /merch/order/:id (section 5); the page has what the buyer needs | pass |
| X-time-travel | time travel for the cooling hour: can_cancel until cancel_until + 120 s, the confirm alarm at exactly that time | pass |
| X-merch-sh | tools/merch.sh prints what it would do by default; never prints the key; checks its arguments | pass |
| X-miniflare | workerd: catalog, quote, checkout, the signed webhook, a real alarm renders into MerchPrints (parts), the draft, the signed file, cancel with refund, the cron | pass |

## Contract questions (built the safest reading; each one line)

1. **Row size** (6.1, 6.2): a SQLite Durable Object row is at most 2 MB, not 8 MB; PNGs are kept in 1 MB parts (dated note added under 6.2).
2. **"One request or alarm at a time"** (6.1, T2.2-40): an object may run another request while one waits on Stripe or Printful; every step is claim-first (state written before the call), and T2.2-40 tests both arrival orders with a hanging confirm.
3. **Margin formula** (3.3 vs `tools/merch_econ.js`): built the script's form (Printful shipping inside W, the 7% US tax on W + holiday, the 5% reserve on W), so SHIPPING.md's margins hold to the cent.
4. **Day cap**: counts every order of the JST day except `expired` (cancelled and refunded still count).
5. **Same nonce after the order moved on** (paid, expired): not in the contract; answers 409 `nonce_used {order}`.
6. **Cancel during a dispute**: not in the contract; 409 `not_allowed` (the bank decides the money).
7. **Tee sizes**: only sizes made in both the US and the UK (`TEE_COLOURS[].sizes.both`), so no 5XL while the UK is shut; the owner may want the US list.
8. **2XL and up**: prices +$2/+4/+6/+8 and costs are placeholders until part 5 reads Printful; Stripe tax codes (`txcd_99999999` mug, `txcd_30011000` tee) not verified.
9. **`charge.refunded`**: since Stripe 2022-11-15 a charge does not carry its refunds, so the Worker re-reads `GET /v1/refunds?payment_intent=` (502 on failure); our refunds carry `metadata.merch_refund` so they are never counted as Dashboard refunds.
10. **Refund failure event**: handles `refund.failed`, `refund.updated` and `charge.refund.updated` with status `failed`; confirm the name in the sandbox (part 9).
11. **Late cancel (T2.1-31)**: when what is left has all shipped, the order becomes `shipped`; shipping stays as charged (section 4).
12. **Held render (T2.2-29)**: needs a wake at `cancel_until` and at most every 2 h while held (for the 2 h email and the 72 h refund); each wake tries Browser Run once.
13. **Paid after we expired it** (a race with a cancel or an expiry): `held review` (`late_pay`), full refund after 24 h unless the owner acts.
14. **Dispute before completed (T2.2-24)**: the email hash is stored and flagged when `completed` arrives later (the contract is silent).
15. **A Printful refusal naming no line**: `held review` and an owner email (contract silent); part 5 learns Printful's real error shapes.
16. **Reship with the file gone** (after 180 days): the re-render reads the address from the Stripe session, not the fixed one; rare, left for part 5.
17. **Old print folders**: "every released version stays" needs them kept somewhere durable; `build_assets.mjs` never deletes, but `cloudflare/merch/assets/` is git-ignored: decide whether to commit released folders (~0.8 MB each).
18. **Emails after a crash**: emails are sent after the transaction commits; a crash in between can lose one email (refunds are rows and are retried).
19. **6.8 `merch/recipe_check.js`**: not needed (PawPrint loads in the ledger object, whose CPU limit is far above 10 ms); not written (merch/* is not part 3's).

## For the Game Manager

- Merge `cloudflare/merch/**`, `tools/merch.sh`, this file and the dated note in TRANSACTIONS.md; no shared file was touched.
- Add the suite to the runner if wanted: `merch_worker: { file: '../cloudflare/merch/test/run.mjs' }` (it needs `NODE_PATH=$(npm root -g)`).
- One combined review of part 3 (code + money paths), then part 4 (Browser Run in `render.js`) and part 5 (the real Printful adapter) replace two seams.
- Owner, with the launch go-ahead (not before): the contract's section 10 points, plus questions 4, 7 and 17 above.
- Nothing to deploy; the README lists the secrets (names only) and approvals any deploy will need.
