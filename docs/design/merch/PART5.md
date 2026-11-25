# Merch part 5: the real Printful adapter, built against recorded replies (25 Nov 2026)

**No Printful key exists yet. Nothing was created at Printful, no order of any kind was placed, and no call carried a credential.** The adapter was
built from Printful's own published API description and checked against replies recorded from it; the only calls made to `api.printful.com` were
two reads of its public, unauthenticated catalog (`/products/19` and `/products/71`, as PRINT_FILES.md did on 24 Nov). The day the owner's key
exists, a short, listed set of checks with real replies remains (the table below and `tools/merch_pf_check.mjs`).

Suite `merch_worker`: **199 checks, 199 pass** (the 181 before, and 18 new `P5-*` rows in `test/t_printful.mjs`).

## What was built

- **`cloudflare/merch/provider_printful.js`**, the real adapter: `createDraft`, `get`, `update`, `confirm`, `deleteDraft`, `cancel`, `quoteCost`,
  `catalogCosts`, `parseHook`, `mapOrder`, the error map `errKind`, `hookSign`. Every call still answers `{ ok, data }` or `{ ok: false, kind }` with the
  kinds the ledger knows (`down | timeout | refused (items) | address | billing | not_found | cannot | not_set_up`); a 429 is `down` with `retry_ms`
  (Printful's Retry-After). It never throws and never logs the key, a recipient or a reply.
- **The network.** The adapter talks through `env.PROVIDER_FETCH` when it is set (tests, a service binding). When it is not, it uses the global
  `fetch` only on Cloudflare's runtime (`navigator.userAgent === 'Cloudflare-Workers'`) and only with `MERCH_PROVIDER_KEY` set. Node never gets the
  global fetch, so a test without `PROVIDER_FETCH` has no printer: the gate stays shut exactly as before, and the tests cannot reach the network.
- **Belt and braces.** `confirm` refuses at the adapter (no call) unless `MERCH_PROVIDER_MODE` is `live`, and always when `MERCH_TEST=1`. The test
  Worker never opens in live mode (`providerReady` is false for `MERCH_TEST=1` + `live`).
- **Headers.** `Authorization: Bearer <key>`; `X-PF-Store-Id` only when `MERCH_PROVIDER_STORE` is set (an account-level token needs it: v1 and v2
  docs, "required only for account level token").
- **catalog.js**: `PF_PRODUCTS` and `PF_VARIANT_IDS`, Printful's catalog variant ids for every colour and size we offer (table below). A line still
  stores `pf:<our variant>`; the adapter turns it into Printful's number and refuses a line it has no id for (no call is made with a placeholder).
- **Recorded replies**: `cloudflare/merch/test/printful/*.json`, 46 files, each with `_source` (list below).
- **Tests**: `test/t_printful.mjs` (18 rows, one line in `run.mjs`); the fake printer in `test/fakes.mjs` now answers in v2 shapes.
- **The key-day kit**: `tools/merch_pf_check.mjs`, dry run by default (it was only ever run dry).
- **Docs**: this file; the checklist in PART3.md annotated line by line; the printer lines in `cloudflare/merch/README.md` and `wrangler.example.toml`.

## The API version: v2 (with one v1 call)

**Chosen: Printful API v2** (`https://api.printful.com/v2/...`), the version the docs call open beta but say "all presented endpoints can be used in a
production environment", and the one Printful asks integrations to move to ("support for V1 may be phased out in the future").

Why v2, for our flow (the ledger re-reads Printful after every hint, so the re-read must tell the whole truth):
1. **Signed webhooks** (question 20): v2 signs every event; v1 cannot.
2. **Parcels name their items by our id**: v2 `shipment_items[].order_item_external_id`; v1 shipments give only Printful's `item_id`.
3. **Returned and delivered are in the re-read**: v2 shipments carry `shipment_status` (`returned`) and `delivery_status` / `delivered_at`; v1 has no
   delivered state at all and a return only in the webhook body, which the ledger does not trust.
4. **Our flow is v2's documented use**: one unique design per order, placements with a technique (`front_large` + `dtg`, the mug's `default` +
   `sublimation`, PRINT_FILES.md).

What v2 costs us, and how the adapter handles it:
- **Costs are worked out after the create** (`costs.calculation_status`: `calculating`, `done`, `failed`). `createDraft` re-reads the draft up to
  `MERCH_PF_POLLS` times (default 2, `MERCH_PF_POLL_MS` 1500 ms apart); still calculating, it answers `down` (`why: calculating`, `retry_ms`), and the
  ledger's next try finds the draft by external id (GET before create, unchanged). `get` answers the same for a calculating draft. Costs that
  failed, or that are not in USD, come back as `null`, and the ledger now holds such a draft for the owner (the one ledger change, below).
- **Shipments are a second read** (`GET /v2/orders/{id}/shipments`); skipped for a draft or a failed order.
- **No cancel of a confirmed order in v2.** v2's DELETE "will delete the order if the order can be deleted" (draft, failed, cancelled, not charged);
  "This is distinct from version 1 where the DELETE method will actually cancel the order". So `cancel` (the late part, T2.1-31) deletes a draft or
  failed order through v2, and cancels a `pending` / `onhold` order through **v1's `DELETE /orders/{id}`** ("Cancels pending order or draft. Charged
  amount is returned to the store owner's credit card."), the same token and the same order id. `inprocess` and later answer `cannot` without a call
  (the ledger emails the owner, as before). `MERCH_PF_V1_CANCEL=0` turns the v1 call off (question 22).
- `inreview` ("being reviewed but is still cancellable") is mapped to `pending` (the ledger's list of confirmed states does not know it).
- Order routes answer errors in the old shape `{ code, result, error: { reason, message } }`; some newer v2 routes (shipping rates, estimates, files)
  answer RFC 9457 problem details. `errKind` reads both.

### The webhook header (done in the review fixes)

Printful sends its signature in **`x-pf-webhook-signature`**. The front Worker (`worker.js`) now copies that header to the ledger, the adapter reads
only that name (the old fallback `x-pf-signature` is gone: a hint signed under it is refused), and the harness signs under the real name. Row
`F5-mf-header` sends a hint through the front Worker in workerd with only the real name (200) and only the old name (401).

### Hints are only hints (part 9 code review, B1)

A hint can be lost (a webhook outage, a 502 while we re-read the order, an event we do not subscribe to, Printful giving up after its last
retry at 1024 minutes). So the ledger never decides "not posted" from hints alone: before the delay email, the automatic late refund and the
24-hour refund of a printer-failed hold it reads the order itself (`provider.get`, TRANSACTIONS T2.1-35; a failed read waits 15 minutes,
never refunds), and the cron reads every confirmed or part-shipped order once a day, 5 a run (T2.1-36). Each read is 2 calls (the order and
its shipments), well under Printful's 120 a minute.

## PART3 checklist: what the docs answered, what needs the key

| PART3 checklist item | Answered from the docs (source, read 25 Nov 2026) | Still needs the key |
|---|---|---|
| Error shapes | `{ code, result, error: { reason, message } }` (v1 Errors; v2 order routes); reasons `BadRequest`, `NotFound`, `TooManyRequests`; problem details on newer v2 routes (v2 Errors); items "Item 0: ..." (v1 Examples) and `/order_items/0` (v2 shipping-rates); "Recipient: ..." (v2 estimate `failure_reasons` example); OR-1 not editable, OR-13 external id in use (v1 Errors); 409 "already being updated" (v2 deleteOrder); 401, 404 examples. | The exact texts of a refused variant, a refused address and a failed charge (fixtures `order_item_refused`, `order_recipient_invalid`, `order_confirm_billing` are built). Whether several refused items come in one reply. |
| Shipments name items by | v2 `shipment_items[].order_item_external_id` and `order_item_id` (v2 Shipment schema; Use cases "Shipping information"); v1 only `item_id`. | No. |
| GET by external id | `/orders/@<external_id>` (v1 Orders "External ID"; v2 getOrder "Order External ID (string prepended with @)"). | What a deleted v2 draft answers (404 or canceled). |
| Duplicate external id | "Each order's External ID must be unique within the store"; up to 32 characters, digits, letters, `-`, `_`; item ids unique per order; OR-13 EXTERNAL_ID_IN_USE (v1 Orders, Errors). | Whether a deleted v2 draft frees its id. |
| DELETE draft vs pending; a second DELETE | v2 DELETE: draft, failed or cancelled, not charged, 204 (v2 deleteOrder); v1 DELETE cancels pending or draft (v1 cancelOrderById). | The second DELETE's answer. |
| Cost fields | v2 Costs: `calculation_status`, `currency`, `subtotal`, `discount`, `shipping`, `digitization`, `additional_fee`, `fulfillment_fee`, `retail_delivery_fee`, `vat`, `tax`, `total` (strings, "up to 2 decimal points"). | One real draft's numbers; whether `front_large` costs extra as the only placement (the catalog lists it at +$5.95 "for each additional placement after the first"). |
| When print files are fetched | Not documented (v1: "If a file with the same URL already exists, it will be reused"). | Yes: the kit adds one file by URL and reads its status. |
| Webhook signing and event names | v1: no signing. v2: HMAC-SHA256 of the raw body with the hex-decoded `secret_key`, hex in `x-pf-webhook-signature`, public key in `x-pf-webhook-public-key`; HTTPS only; optional expiry; retries after 1, 4, 16, 64, 256 and 1024 minutes; events shipment_sent, shipment_delivered, shipment_returned, shipment_out_of_stock, shipment_canceled, shipment_put_hold, shipment_put_hold_approval, shipment_remove_hold, order_created, order_updated, order_failed, order_canceled, order_put_hold, order_put_hold_approval, order_remove_hold, order_refunded, catalog_stock_updated, catalog_price_changed, mockup_task_finished, approval_sheet_status_changed (v2 Webhook, x-webhooks). No event id in a v2 event. | One real signed event (the kit lists the configuration; an event needs an order). |
| Recipient deleted on request | Not in the API docs. | Ask Printful support (processor under its Data Processing Terms, PROVIDERS.md 1.1). |
| The nightly cost read | v2 `/catalog-products/{id}/prices` (per variant and technique; without a production currency "the highest price will be returned") and `/v2/shipping-rates` (Standard rate, days). Variant ids: public catalog. | That the v2 catalog variant ids equal the v1 ids (the docs' tee example 4011 is 3001 White / S in v1); real prices per region. |
| Browser Run | Not part 5. | Part 4. |
| (6.7) Korean customs code | Only `tax_number`, required for Brazil, is documented. | Moot while KR is shut. |
| (6.7) rate limits | 120 requests a minute per store (v1 Rate Limiting); v2 a leaky bucket with X-Ratelimit-* headers; 429 with Retry-After, "nothing is created, updated or charged". | No. |

## The variant table (catalog.js `PF_VARIANT_IDS`)

From `GET https://api.printful.com/products/19` and `/products/71` (public, no key, read 25 Nov 2026; recorded in
`test/printful/catalog_v1_product_19.json` and `_71.json`). Every colour code equals ours; every variant is in stock in the US and the UK.
`P5-variants` checks the table against the recorded catalog on every run.

| Our variant | Printful id | Price (USD) |
|---|---|---|
| mug:white (White Glossy Mug 11 oz) | 1320 | 6.07 |
| tee:white S, M, L, XL, 2XL, 3XL, 4XL | 4011, 4012, 4013, 4014, 4015, 5294, 5309 | 11.92 (2XL 13.92, 3XL 15.92, 4XL 17.92) |
| tee:soft-cream S, M, L, XL, 2XL | 4151, 4152, 4153, 4154, 4155 | 11.92 (2XL 13.92) |
| tee:athletic-heather S, M, L, XL, 2XL | 6948, 6949, 6950, 6951, 6952 | 11.92 (2XL 13.92) |
| tee:pink S, M, L, XL, 2XL | 4136, 4137, 4138, 4139, 4140 | 11.92 (2XL 13.92) |
| tee:ice-blue XS, S, M, L, XL, 2XL | 9576, 9360, 9361, 9362, 9363, 9364 | 11.92 (2XL 13.92) |
| tee:navy XS, S, M, L, XL, 2XL | 9546, 4111, 4112, 4113, 4114, 4115 | 11.92 (2XL 13.92) |
| tee:black XS, S, M, L, XL, 2XL, 3XL, 4XL | 9527, 4016, 4017, 4018, 4019, 4020, 5295, 5310 | 11.92 (2XL 13.92, 3XL 15.92, 4XL 17.92) |

Found on the way: Printful's big-size extras are **+$2.00, +$4.00, +$6.00** (2XL, 3XL, 4XL), not catalog.js's `TEE_SIZE_COST` guesses of 1.50, 3.50,
5.50 (question 25). Set to 200 / 400 / 600 in the review fixes (below).

## The recorded replies (`cloudflare/merch/test/printful/`)

Marks: **docs** = the documentation's own example; **built** = made from the documented schema because no example exists (the note says what is
invented); **public** = a real reply of the public catalog route, no key. Invented people and places only ("Test Buyer, 1 Example Street").

| File | Mark | What |
|---|---|---|
| order_create_draft | built | POST /v2/orders: a draft, a mug and a tee, costs done |
| order_draft_calculating | docs | the costs block "still calculating" |
| order_draft_costs_failed | built | `calculation_status: failed`, costs null |
| order_get_pending, order_get_partial, order_get_inprocess, order_get_canceled | built | GET by external id or id, per status |
| order_shipments | built | four parcels: shipped and delivered; returned (named by `order_item_id` only); canceled; packaged |
| order_not_found | docs | 404 |
| order_recipient_invalid | built | 400 "Recipient: ..." |
| order_item_refused | built | 400 "Item 1: ..." |
| order_external_id_in_use | built | OR-13 |
| order_patch_recipient, order_not_editable | built | PATCH, and OR-1 |
| order_confirm_ok, order_confirm_inreview, order_confirm_failed, order_confirm_billing | built | the confirmation route's answers |
| order_delete_draft | docs | 204 No Content |
| order_delete_conflict | docs | 409 "already being updated" |
| order_delete_refused | built | 400 |
| order_cancel_v1_ok, order_cancel_v1_refused | built | v1 DELETE /orders/{id} |
| rate_limited_429 | docs | 429, Retry-After 38 and the X-RateLimit headers |
| server_error_500 | docs | problem details, InternalServerError |
| unauthorized_401 | docs | "Malformed Authorization header." |
| estimation_task_created | docs | a new estimation task (pending) |
| estimation_task_completed | built | completed, with costs |
| estimation_task_failed | docs | `failure_reasons: ["Recipient: Country cannot be blank."]` |
| shipping_rates_docs | docs | the EUR example (skipped: we read USD only) |
| shipping_rates_usd | built | a USD rate (the tests set the rate per call) |
| shipping_rates_disabled | built | "Sorry, shipping to this country has been disabled!" |
| catalog_prices_mug, catalog_prices_tee | built | v2 prices, with the public catalog's prices |
| catalog_v1_product_19, catalog_v1_product_71 | public | the public catalog, trimmed to our variants |
| hook_order_created_docs | docs | the docs' event example (a trailing comma removed) |
| hook_shipment_sent, hook_shipment_sent_retry, hook_shipment_delivered, hook_shipment_returned, hook_order_failed, hook_order_canceled, hook_order_put_hold, hook_order_remove_hold, hook_catalog_price_changed | built | v2 events from their schemas (the tests sign them) |

## What the tests check (`t_printful.mjs`)

Every adapter function against the fixtures, through a replaying `PROVIDER_FETCH` that also keeps each request: the request line, headers and body
(`external_id` `<order>`, `<order>-d<n>`, `<order>-r<n>`; items `<ext>_<line>`; catalog variant ids; placement and technique; the signed file URL;
retail prices and costs; refunded units left out), every error kind, the 429 retry hint, a timeout, the draft-mode and test-Worker confirm refusals,
the calculating re-reads, the duplicate external id, shipments (only parcels that left; delivered; returned; the item id fallback), the hook parser
with and without a signature (an independent HMAC, hex key), retries counted once, `catalogCosts` with pages, a non-USD rate and failures, and its
output fed to the margin guard (`marginOf`), the fixtures' sources and privacy, the variant table against the public catalog, the gate (Node never
uses the global fetch; on Cloudflare it does), and the ledger change.

## Changes outside the adapter (each minimal)

- **`ledger.js` `adopt`** (one condition, +2 lines): a draft whose costs are `null` (Printful could not work them out, or not in USD) is held
  `review` / `cost_unknown` with an owner email, never confirmed blind; a day without the owner refunds it (the existing review rule). Test
  `P5-ledger-costs`. Nothing in the render code was touched.
- **`catalog.js`**: the id table (`PF_PRODUCTS`, `PF_VARIANT_IDS`) and the comment on `providerVariant`. `cat_ver` is unchanged (the table is not in
  the catalog object).
- **`test/fakes.mjs`**, the fake printer only: v2 routes and shapes (`{ data: Order }`, shipments on their own route, old-style errors, 204 on
  delete, a refused item as "Item <n>:", OR-13 for a used live external id, the v1 cancel route, price and rate routes when `costs` is set), a hex
  webhook secret and `pfSign` (Printful's signing). `calls[].path` is the path inside the API version (no `/v2`), so the existing tests read as before.
  `deleted` now means cancelled or deleted at Printful; `gone` (a v2 delete) makes GET answer 404. Shipment ids are Printful-like numbers.
- **`test/harness.mjs`**: `phook` signs with `pfSign` (the hex-decoded key) instead of `hmacHex`; the header name is unchanged (see the merge step).
- **`test/t_crash.mjs` line 13, `test/t_review.mjs` line 9, `test/t_fix6.mjs` line 110**: the confirm path test `/\/confirm$/` became
  `/\/confirm(ation)?$/` (v2's route is `/orders/{id}/confirmation`).
- **`test/run.mjs`**: one entry, `t_printful.mjs`.
- Not changed: `render.js`, `prints.js`, `worker.js`, `admin.js`, `mail.js`, `stripe.js`, the ledger's back-off (the first wait, 1 minute, already
  covers Retry-After values up to 60 s; `retry_ms` is there for later).

## Open questions (recommendation first)

20. **Webhook signing** (settled with facts). v1 cannot sign; v2 signs (HMAC-SHA256, `x-pf-webhook-signature`). *Recommended: sign.* Set up the
    webhook through `POST /v2/webhooks` with `default_url` = `https://merch-api.doodledoggo.app/merch/webhook/provider`, no `expires_at` (an expiry
    forces a new key pair), the events shipment_sent, shipment_delivered, shipment_returned, order_failed, order_canceled, order_put_hold,
    order_remove_hold, order_updated; put the `secret_key` (shown once) in `MERCH_PROVIDER_WEBHOOK_SECRET`. The gate's rule (no live without a secret)
    stays. Polling instead is not needed; unsigned hints are not needed either. Requires the worker.js merge step above.
21. **A draft deleted, then made again** (settled with facts). External ids are unique within the store and a used one is refused (OR-13, v1 docs);
    whether a deleted v2 draft frees its id is not documented. *Recommended: keep `<order>-d<n>`* (safe either way; the kit's `--reuse-check` answers
    it). Order ids stay within Printful's 32 characters (`mo_` + 22 + `-d<n>` or `-r<n>`: 28; the adapter refuses a longer one without a call). No
    limit is documented for item ids; `<ext>_<line>` is 32 characters at most up to reprint 9 (`-r9_101`), 33 at reprint 10: to check on the key day
    if reprints ever go that far.
22. **The late cancel through v1.** *Recommended: keep it on* (`MERCH_PF_V1_CANCEL` unset): it refunds Printful's charge for a part that will not be
    made, which the owner would otherwise do by hand. If Printful retires v1, set `MERCH_PF_V1_CANCEL=0`: the ledger then emails the owner to cancel
    in the dashboard (already built).
23. **Printful fails or cancels a confirmed order** (`order_failed`: "not accepted because of an error (problem with address, printfiles, charging,
    etc.)"; `order_canceled`). Today the re-read changes nothing for a confirmed order in those states: the buyer is still covered by the delay plan
    (refunded at `late_eta`), but the owner is not told. *Recommended: a small ledger change for the coordinator to approve*: in `applyProvider`, a
    re-read `failed` or `canceled` on a `confirmed` / `part_shipped` order holds it `review` (`pf_failed` / `pf_canceled`) with an owner email. Not
    made here (it changes the order flow, not the provider path).
24. **Several refused lines at once.** Printful's docs say that past basic validation "only the first error" is returned, so two refused variants may
    come one per create, one buyer email each (finding 5 assumed one). *Recommended: accept* (rare: a refused variant is turned off at once, and the
    nightly job checks them); the adapter already reads several items from one reply if Printful names them.
25. **Big-size costs.** Printful charges +$2.00 / +$4.00 / +$6.00 for 2XL / 3XL / 4XL; catalog.js guesses +$1.50 / +$3.50 / +$5.50, and our price
    adds +$2 / +$4 / +$6, so a big tee earns about $0.55 less than modelled (with US tool tax and the reserve). *Recommended: set `TEE_SIZE_COST` to
    200 / 400 / 600 in a reviewed PR and re-run `tools/merch_econ.js`*; the nightly cost read already writes the real numbers into the margin guard.
26. **Which price the nightly job reads.** *Recommended: `worldwide`, USD, no production currency* (Printful then answers its highest price, the safe
    side); per-region prices can come later if they differ (the kit reads four regions).
27. **A draft with no readable costs.** *Recommended: as built* (held `cost_unknown`, one owner email, refunded after a day unless `merch.sh confirm`).
28. **The store's currency.** Printful bills in USD, EUR, GBP, CAD or AUD; the margin guard is in USD. *Recommended: a USD store*; the adapter treats
    non-USD costs as unknown (question 27) and skips non-USD rates, and the kit reads the store's currency first.
29. **Account-level or store token.** *Recommended: a store-level private token* for the merch store (scopes orders, file_library, webhooks); an
    account-level token works too with `MERCH_PROVIDER_STORE`. The test Worker gets its own test store ("Create a separate store to test scenarios").
30. **Calculating re-reads inside a ledger step** (up to 2 x 1.5 s). *Recommended: keep*: well inside the step's 3-minute lease; a slower
    calculation is simply the next try.

## The key-day kit (`tools/merch_pf_check.mjs`)

Prepared only; run dry here (70 steps listed, nothing sent). On the key day, `--run` makes these read-mostly checks and records each real reply,
scrubbed (every address becomes "Test Buyer, 1 Example Street"; secrets and keys removed; emails replaced), as `test/printful/recorded/<step>.json`
(`recorded: "key"`; `P5-fixtures` checks those too):

1. store info and currency; 2. the mug and tee products (placements, techniques); 3. their catalog variants against `PF_VARIANT_IDS` (are v2 ids the
v1 ids?); 4. availability in north_america, uk, europe, japan, australia; 5. prices in worldwide, north_america, uk, europe; 6. Standard rates for a
mug and a tee, one and two items, to one invented address per zone (US, JP, GB, DE, CA, AU, HK); 7. a real 404 and a refused address on the rate
route; 8. with `--file-url <a print PNG>`: add the file by URL and read its status; make **one** draft, read it until its costs are done, read it by
external id, read it through v1 by its id and by its external id (question 22: does v1 see a v2 order?), PATCH its recipient, delete it, read it again, delete it again (question 21 and the second DELETE); with `--reuse-check`, the same
external id once more (then deleted); an address probe (deleted at once if made); 9. the webhook configuration; 10. a v1 read (the same token on v1).

It **never confirms**: there is no confirmation call in the file, and a self-check refuses to start if a step would confirm or cancel a real order.
It never reads, asks for or prints a key: through the session's credential proxy (the default base) it sends a placeholder that the proxy replaces;
through a relay (`--base`) it sends no key at all. Then: compare the recorded replies with the built fixtures, replace those that differ, and re-run
the suite.

## Sources (all read 25 Nov 2026)

- Printful API v2 (2.0.0-beta): https://developers.printful.com/docs/v2-beta/ and its OpenAPI document https://developers.printful.com/docs/v2-beta/openapi.json
  (Orders v2, Shipping Rates v2, Catalog v2, Webhook v2 with "Event signing", Errors, the use cases, the FAQ on rate limits).
- Printful API v1: https://developers.printful.com/docs/ and https://developers.printful.com/docs/openapi.json (Orders API, External ID, Errors with the
  OR-, FL-, SH- codes, Rate Limiting, Authorization: private tokens, account-level tokens and `X-PF-Store-Id`, Webhook API, cancelOrderById).
- The public catalog, no key: https://api.printful.com/products/19 and https://api.printful.com/products/71.
- Printful's help centre article on moving an API integration (50263208968209) answered 403 to this session; nothing from it is used here.

## Review fixes (25 Nov 2026, `docs/reviews/MERCH_PART5_review.md`)

All ten findings and Q25, on branch `merch/part5-fixes`. Suite `merch_worker`: **231 checks, 231 pass** (212 before: 19 new rows, the `F5-*` rows in
`test/t_f5.mjs` and `F5-mf-header` in `test/t_miniflare.mjs`). PART3's ledger rules hold in every change: each write re-reads the order in its own
transaction and changes it only from the state it expects (`set(..., from)`), no refund is dropped, and a hold always keeps a wake.

| # | Finding | What changed | Test rows |
|---|---|---|---|
| 1 | Printful's signature header never reached the ledger | `worker.js` forwards `x-pf-webhook-signature` (the rest of its list unchanged); the adapter reads only that name; the harness signs under it; `t_22` T2.2-48 uses it | `F5-mf-header` (workerd, through the front Worker: real name 200, old name 401), the `F5-header` check in `P5-hook`, T2.2-48 |
| 2 | A confirm Printful took but whose answer was lost was confirmed again, refused, and refunded | `confirm()`: on any answer that is not ok (down, a dropped connection, a 5xx, a timeout, a refusal) it re-reads the order; pending, inreview, inprocess, onhold, partial or fulfilled means the confirm was taken: ok with that order. A billing refusal is never re-read (it cannot be masked); a draft, failed or canceled order keeps the first answer. The fake printer now refuses a second confirm, as Printful does | `F5-confirm-adapter`, `F5-confirm-drop`, `F5-confirm-5xx`, `F5-confirm-refused` |
| 3 | Printful failing or cancelling a confirmed order went unnoticed (Q23) | `applyProvider`: a re-read `failed` / `canceled` of our own confirmed main order (`confirmed`, `part_shipped`, or held on Printful's hold) holds it `review` with why `pf_failed` / `pf_canceled` and one owner email (`provider_failed` / `provider_canceled`: check the Printful wallet and dashboard). Never for a cancel we asked for (`pcancel`, an order already refunded or cancelled), a draft (never confirmed), a deleted draft or a reprint order (another Printful id). Fires once: the next hint finds the order held. Exits: a day without the owner, refunded in full (the existing review rule); the owner confirms (`merch.sh confirm`): sent to Printful again; Printful goes on by itself (fixed in its dashboard): the hint confirms it. Told only, never held: in a dispute, or when part has shipped (a full refund would pay back parcels that arrived; the delay plan refunds the rest) | `F5-pf-failed`, `F5-pf-canceled`, `F5-pf-ours`, `F5-pf-repeat`, `F5-pf-exits` |
| 4 | A print-file error refunded the line, turned the variant off, or asked the buyer for an address | `errKind`: messages about a file, URL, placement or layer are `down` (why `file`), never a refused line or an address; the address fallback matches only the recipient's fields (address1/2, city, state code, country code, zip, postal code, "recipient"); a bare "address" elsewhere goes to the owner. The ledger marks the order `last_error = 'file'`, retries, and after a day the owner's `provider_down` email names the print file | `F5-errkind`, `F5-errkind-ledger` |
| 5 | A cost that is not a number was confirmed as NaN; a missing shipping became 0 | `cents()` gives NaN for anything not a number; `mapOrder` gives costs `null` when any cost is not finite or shipping is missing (the `cost_unknown` hold); `adopt` holds on any non-finite cost; `quoteCost`, the rate and price reads skip unreadable numbers | `F5-costs-nan` |
| 6 | `retail_costs.tax` declared the VAT twice in tax-inclusive countries | `'0.00'` where `taxBehavior` is inclusive (everywhere but the US and Canada); the tax charged for US / CA | `F5-retail-tax` |
| 7 | The email after a confirm that came back failed had no wallet hint | "Check the Printful wallet and dashboard" in the `failed` text, the refused text and the stale re-read text | `F5-confirm-failed-mail`, `F5-confirm-refused` |
| 8 | The kit did not check Q22; `scrub` cleaned only address objects | Two v1 reads of the kit's own draft (by id and by external id) before it is deleted, with a "Found" line; `scrub` replaces emails, phones, address lines, tax numbers and person names anywhere, and names / companies / cities / zips inside anything person-like (product and store names stay); phone numbers in text. Still dry by default (run dry: 70 steps) | `F5-kit` |
| 9 | A variant of ours with no price in the nightly read: nobody told | `catalogCosts` answers `missing` (our variants a full product read left out; a failed read is not "missing"); the nightly job emails the owner (`cost_missing`) once per change of that list and keeps the last stored cost | `F5-cost-missing` |
| 10 | `quoteCost` re-read one time too many | `i < polls` | `F5-quote-polls` |
| Q25 | `TEE_SIZE_COST` guessed low | 2XL / 3XL / 4XL = 200 / 400 / 600 cents (Printful's catalog prices 13.92 / 15.92 / 17.92 against 11.92); 5XL (not sold) unchanged; no selling price changed; `site/merch/catalog.json` regenerated (its `cat_ver` changes) | `F5-size-cost` (every sold tee size against the recorded prices, and each size alone over the floor in every zone), `P5-costs` |

Existing tests touched: `t_22` T2.2-48 (the header name), T2.2-55 (the timed-out confirm now re-reads at once, so the "still confirming" step
also fails that re-read: the alarm path is still tested), `t_printful` P5-hook (the old header name is now refused), P5-costs (the 4XL cost and
catalog.js now agree), `harness.mjs` `phook` (the header name), `fakes.mjs` (a second confirm refused; `lostConfirm`, `refuse.confirm`,
`refuse.file`, `costs.unpriced`).

Tee margins, one tee alone, US$ (the US in December, with the holiday surcharge; before -> after): S-XL 11.11 (unchanged); 2XL 11.35 -> 10.79;
3XL 11.03 -> 10.47; 4XL 10.72 -> 10.16. The lowest anywhere: Japan 4XL 9.90 (was 10.47). Every size passes the floor ($4 and 20%) in every zone.
`tools/merch_econ.js` (and `--cart`) has no per-size rows: its output is unchanged.

Key day, added to the checks above:
- **Paging of the prices route**: `catalogCosts` sends `limit` / `offset` and follows `paging.total`, which the route does not document; the kit's
  `prices_*` steps record what it answers. If a page is ignored, the `missing` email names what was left out.
- **A second confirm** is refused (the fake assumes so) and **a failed order can be confirmed again** after it is fixed (the owner's exit of a
  `pf_failed` hold assumes so). If not, a `pf_failed` order is refunded a day later (safe, no sale).
- **The print-file error texts** (built): which words Printful uses for a file it cannot fetch.

