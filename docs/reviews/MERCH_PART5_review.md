# Merch part 5 review: the Printful adapter (25 Nov 2026)

One combined review (code and money paths), read-only, on `merch/shop` at 1c2241d (the part is 114066e..b8b6a3e). Suite at review time:
`merch_worker` 199 of 199. Written by the MERCH session from the reviewer's report. The reviewer checked the adapter against Printful's
public v2 OpenAPI file and wrote three probes (not in the repo).

**Verdict:** the adapter matches Printful's published v2 schema and the variant table is right. Three blockers before live mode, all small.

## Findings

| # | Severity | Where | What happens | Fix |
|---|---|---|---|---|
| 1 | **blocker** | `worker.js:31`, `provider_printful.js:264`, `test/harness.mjs:65` | Printful (v2) signs with the header `x-pf-webhook-signature`; the front Worker forwards only `x-pf-signature`, so a correctly signed hint gets 401. There is no polling, so in live mode every shipped order would get the delay email and then the automatic late refund. The suite is green only because the adapter also accepts the old name. | Forward `x-pf-webhook-signature`; the harness sends the real name; one Miniflare row with only the real name; then drop the fallback name. |
| 2 | **blocker** | `provider_printful.js` `confirm`, `ledger.js:1275` | A confirm that Printful took but whose answer was lost (connection drop, 5xx) answers `down`; the held order is confirmed again with no re-read, Printful refuses the second confirm, the order goes to review and is refunded a day later while Printful prints it. | In `confirm()`, on any answer that is not ok, `get(id)` and answer ok when the status is pending, inreview, inprocess, onhold, partial or fulfilled. |
| 3 | **blocker** (PART5 Q23) | `ledger.js` `applyProvider` (920-954) | Printful fails or cancels a confirmed order ("problem with address, printfiles, charging": a wallet problem most likely shows here, not as a 402) and nothing happens: the buyer waits until the late date, the owner is never told. | Hold `review` with `pf_failed` / `pf_canceled` and an owner email. Before launch, not later. |
| 4 | should fix | `provider_printful.js:58-60` `errKind` | Any item-indexed error becomes `refused(items)`, also a print-file fetch problem on our side (`/order_items/0/placements/0/layers/0/url`): the line is refunded and the variant is switched off for everyone. The address fallback matches any message with "address", "city" or "zip", so a file message can send "fix your address". | Messages about file, url, placement or layer map to `down` (or review), never a variant refusal or an address email. All error texts are `built`: key day. |
| 5 | should fix | `mapOrder` `cents()`, `ledger.js:1247` `adopt` | A cost string that is not a number gives NaN, the cost guard passes (`NaN > x` is false), the order is confirmed and `provider_cost` is NaN. A null shipping becomes 0. | Costs not finite or shipping missing: costs = null (the `cost_unknown` hold). |
| 6 | should fix | `provider_printful.js:100`, `lines.js:129` | `retail_costs.tax` is sent for tax-inclusive countries, where the VAT is already inside the retail price and the shipping fee: the declared retail total (customs value, packing slip) is too high by the VAT. | Send `'0.00'` for inclusive countries. |
| 7 | should fix | the owner email after a confirm that comes back `failed` | It says "Printful refused the confirm" with no hint about the wallet. | Add "check the Printful wallet and dashboard". |
| 8 | should fix | `tools/merch_pf_check.mjs:79` | The kit never checks what Q22 rests on: that v1 sees an order made through v2 by the same id. `scrub` only cleans person fields inside objects with `address1`. | A v1 `GET /orders/{id}` of the kit's own draft before it is deleted; scrub names, emails and phones everywhere. |
| 9 | nit | `catalogCosts` | Sends `limit`/`offset` to a route that does not document them; if v2 variant ids differ from v1 it answers ok with no variants and nobody is told. | Key day: check paging. Mail the owner when one of our variants gets no price. |
| 10 | nit | `quoteCost`, `MERCH_TEST` | Re-reads `polls + 1` times (`i <=`). `MERCH_TEST` is compared with exactly `'1'`. Two events of one type with the same `occurred_at` share an id (harmless: the next hint re-reads). | Fix the loop bound; leave the rest. |

## Tests

The 18 `P5-*` rows check our requests against the schema, and those match. Of the 46 fixtures, 33 are `built`, 11 `docs`, 2 `public`. Resting
only on built fixtures: the create, confirm (ok, inreview, failed, billing), shipments and v1 cancel replies; every error text; every v2 hook but
`order_created`; the prices and USD rates replies; the finished estimation task. The three widened regexes (`/\/confirm(ation)?$/`) are not a
weakening. The fake printer now refuses a v2 DELETE of a `pending` order (true to the docs; the old fake cancelled it).

## The open questions of PART5.md

- Q20, Q21, Q24, Q26-Q30: agreed. Q22 (keep the v1 late cancel): agreed, if key day shows v1 sees v2 order ids (finding 8).
- Q23: not to be deferred: finding 3.
- Q25: agreed. The fixtures show +$2.00 / +$4.00 / +$6.00 for 2XL / 3XL / 4XL; `TEE_SIZE_COST` guesses less. The nightly cost read corrects it per
  variant once it has run, but checkout uses the static guess until then.
- `front_large`: the v2 price text says one placement is in the base price; v1 lists it at +5.95 "additional". If it costs extra as the only
  placement, the per-draft 10% check holds every tee order (no loss, but no sale): **check on key day.**

## Checked and fine

Paths, methods and bodies against the v2 OpenAPI file (orders, `@external_id`, confirmation, shipments, shipping rates, prices, estimation
tasks); DELETE only on drafts; headers and scopes; the status and shipment enums; the signature check itself (hex secret decoded, HMAC over the
raw body, 64 hex, constant-time compare, replay only re-reads); never a charge by accident (`confirm` refuses unless live, always on
`MERCH_TEST=1`; no v1 create; reprints wait unless live); no double draft and no stranded order on the timeout and "still calculating" paths;
privacy (no logging, no message text in errors, invented people only, the kit dry by default and never confirming); the variant table (every one
of the 43 ids checked by script against the recorded catalog).

## Not checked

Any real reply (no key); that v2 variant ids equal v1's; the untrimmed public catalog; whether `front_large` costs extra.

## Fixes

Findings 1 to 10 go to one fix batch (see `docs/design/merch/PART5.md` "Review fixes" when it is done).
