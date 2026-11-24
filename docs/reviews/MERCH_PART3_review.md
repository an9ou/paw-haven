# Merch part 3: combined review of the merch Worker, money faked (merch/shop @ f0997c0, read-only)

Scope: `cloudflare/merch/**`, `tools/merch.sh`. Suite: 108/108 pass (5.5 s). Written up by the MERCH session from the reviewer's
report (24 Nov 2026). The reviewer's repro scripts only import the suite's harness (kept outside the repo; the cases are described
below so each can become a test).

## Verdict

Careful work. Money is whole cents; the Stripe signature, the admin key and the file link checks are sound; the 128-bit order ids
are fine. But "claim first" does not hold for the draft step or for the alarm's work lease, so it is **not ready for real money**.
Must-fix 5, should-fix 16, nice 9.

## Must-fix

- **M1** `ledger.js:824-835`. `adopt()` writes without a status guard after awaiting `createDraft`. A cancel, a Dashboard refund or
  a dispute during that call leaves `provider_order` on a cancelled order. The cost estimate then runs over 0 drafted lines, the order
  goes to "held review cost", the draft is never deleted, and a dispute hold is overwritten. If the owner then runs `merch.sh confirm`
  (`admin.js:52` accepts any hold), the printer charges and ships a fully refunded order. Fix: in `adopt`, if the status is not paid or
  held provider/address, set `draft_del=1` and delete the draft; estimate over the drafted lines only; admin confirm only from review,
  draft_mode or a won dispute.
- **M2** `ledger.js:642`. `tick()` sets `next_try_at=null` before `work()`. A deploy eviction or an exception mid-step leaves a paid
  order with no wake ever, and the report does not list it (still paid after 7 days, no refund). Fix: lease `next_try_at=now+5 min`
  before the work; report paid/confirming rows with no `next_try_at`.
- **M3** `ledger.js:910`. `workReprints` confirms at the printer right away and ignores `MERCH_PROVIDER_MODE=draft`. A buyer can reach
  it through the reship address form (`ledger.js:310`), and the printer has no sandbox. Fix: when not live, hold the reprint.
- **M4** `ledger.js:613-616, 303, 876`. A returned parcel on a refunded order sets hold reship and emails the buyer; the address form
  then reprints and confirms for free. A Dashboard full refund leaves `refunded_qty` at 0 (`ledger.js:535-543`). Fix: no reship or
  reprint on refunded/cancelled orders or fully refunded lines.
- **M5** `ledger.js:116`. The gate checks only the Stripe, hash and file keys. Without a printer key or a renderer it still opens
  Checkout, and the paid orders then sit in "held provider" with no automatic refund. Fix: also require the provider and the render
  to be ready.

## Should-fix

- **S1** `ledger.js:729,750`: a render that finishes after a cancel sets the line back to ready and can send "couldn't print".
- **S2** `ledger.js:345`: a line refund adds `line_tax` even when the tax is inclusive, so it over-refunds once VAT is registered (2748 vs 2598).
- **S3** `ledger.js:529-531`: any partial Dashboard refund before completed marks the whole order refunded and makes nothing (500 of 2498 back).
- **S4** `admin.js:36`: a refund on a replaced line is accepted, so line 1 and its reprint 101 are both refunded.
- **S5** `ledger.js:375,523`: refunds retry forever with the same key, but Stripe prunes idempotency keys after 24 h; `charge.refunded`
  finds our row but leaves it "sending". Fix: mark it done there; before a retry older than about 20 h list the refunds by payment
  intent and match `metadata.merch_refund`.
- **S6** `ledger.js:425`: a completed event for an expired order is acknowledged silently, so question 13's `late_pay` is never reached from webhooks.
- **S7** `ledger.js:395`: a failed email is dropped and never retried (the Thank you email carries the cancel link). The owner email
  key (`mail.js:269`) has no day in it, so the mail service's 24 h window can swallow the nightly report.
- **S8** `ledger.js:578-592`: unsigned printer hints: anyone can write unlimited event rows and trigger printer GETs. Rate-limit by IP
  hash and require the secret before live.
- **S9** `ledger.js:107`: the day cap counts open sessions, so one IP doing 10 checkouts an hour keeps the shop "sold out" all day.
- **S10** `ledger.js:654,682`: the delay email never runs for held orders, though T2.2-34 says it still runs.
- **S11** `ledger.js:727,768`: a failed print store retries at once and re-renders each time, using browser minutes, with no owner
  email; the ledger's own storage and write budget are not in the report.
- **S12** `wrangler.example.toml:59-66`: `[env.test]` does not inherit vars or Durable Object bindings, so `MERCH_SITE` falls back to
  the live site and LEDGER/PRINTS are missing.
- **S13** There is no admin route for deletion on request (section 5).
- **S14** (question 17) `assets/` is git-ignored, so a deploy from a clean checkout drops the old print folders and old-art lines are
  rejected and refunded.
- **S15** `tools/merch.sh:51`: `refund <order> <line> 2` with the reason forgotten refunds the whole line with reason "2".
- **S16** `ledger.js:787`: GET-before-create runs only after a recorded timeout, so a crash during create leads to a second draft.

## Nice

N1 `ledger.js:324,350` the LIKE "_" wildcard ("_l1_%" matches l101). N2 rate rows stay until the nightly tidy (about 24 h, not
"within the hour"). N3 `mail.js:250` the "refunded" text says "part of your order" for full refunds. N4 `ledger.js:848` the stale
re-read treats failed/canceled as confirmed. N5 the late cancel DELETEs the whole printer order. N6 flush and the alarm can send one
refund key at the same time. N7 a dispute won before completed, then confirm, refunds instead of shipping. N8 `hashOf` falls back to
a public key. N9 question 16's re-render loses the fixed address.

## Tests

Weak rows: T2.2-14 never reaches its discount check (the metadata mismatch returns first), and a shipping-fee mismatch is untested.
T2.2-55 and T2.2-35 only test timeouts, not crashes (they miss M2 and S16). T2.2-40 has no cancel during the draft (misses M1).
T2.2-42's fake keeps idempotency keys forever. T2.2-56 has no inclusive-tax refund, T2.2-45 no refunded order, T2.1-05 no timeout,
T2.2-18 tests full refunds only. Every test world runs live mode, which hides M3. Sound: T2.1-06/10/11/12/18/19/20/21/22/23/24/29/30
and T2.2-09/11/13/15/16/17/20/22/32/33/49.

## The contract questions of PART3.md

Disagree with 2 (claim-first fails in makeDraft/adopt, renderLine and the tick lease), 13 (not wired for webhooks), 16 (it ships to
the address that bounced), 17 (settle it before any deploy) and 18 (any mail error loses an email, not only a crash). Agree with the
rest; 4 is safe for the money, but see S9.

## To verify in the Stripe sandbox (part 9)

Amounts stay USD with Adaptive Pricing (totals, line items, shipping cost); the order of line items; the collected-information path;
sessions by payment intent; refund metadata on the list call; the refund-failure event name; idempotency 24 h and the
param-mismatch error; the expire error on a completed session; the terms URL for consent collection; Adaptive Pricing for a Hong
Kong account; partial-refund FX.

## To verify with the printer's key (part 5)

Every error shape in `pf()` is invented (reason recipient/items). Shipment items may carry `item_id` rather than
`order_item_external_id`, and then parcels never attach. Also: GET by external id; whether a duplicate external id is refused; DELETE
on draft vs pending; the cost fields; when the printer fetches files vs the 30-day link; webhook signing; the returned and on-hold
names. `/merch/catalog-costs` is not a printer route, and the variant ids are placeholders. Browser Run: the 429 texts.
