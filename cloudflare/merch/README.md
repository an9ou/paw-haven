# doodle-doggo-merch (part 3: the merch order Worker, money faked)

"Put your dog on a mug": the order server for the merch shop. The contract is `docs/design/merch/TRANSACTIONS.md`; what was built, the route list
and the T-row table are in `docs/design/merch/PART3.md`. **Nothing here is deployed, and nothing may be without the owner's go-ahead.**

## Files

| File | What |
|---|---|
| `worker.js` | The front Worker: CORS, the signed file route, the print pages (static assets); every order route goes to the ledger. Never loads PawPrint. |
| `ledger.js` | `MerchLedger`, one SQLite Durable Object: every table (6.2), the alarm, the order state machine (2.1, 2.2), refunds (4), the nightly job and tidy (3.3, 5). Loads PawPrint lazily. |
| `prints.js` | `MerchPrints`, one SQLite Durable Object per JST day: the PNGs, in 1 MB parts. |
| `catalog.js` | The price list: products, zones, countries, the never list, Printful's shipping table, the holiday surcharge, the floor. |
| `lines.js` | The basket: switches, the line checks (PawPrint), prices, the margin guard. |
| `stripe.js`, `provider_printful.js`, `render.js`, `mail.js` | The four seams. Each talks only through an injected fetch (`STRIPE_FETCH`, `PROVIDER_FETCH`, `RENDER_FETCH`, `MAIL_FETCH`). |
| `admin.js` | The owner's admin routes (`tools/merch.sh`). |
| `build_assets.mjs` | Copies the print pages (`merch/dist/print/<ART_VER>/`) into `assets/merch/print/`, never deleting a released folder. |
| `wrangler.example.toml` | Bindings, the two Durable Object classes and their migration, the cron, the variables (shut by default). No ids, no secrets. |
| `test/` | The `merch_worker` suite. |

## Run the tests

```
NODE_PATH=$(npm root -g) node tools/merch_build.js           # the PawPrint bundle (merch/dist/pawprint.js)
NODE_PATH=$(npm root -g) node cloudflare/merch/test/run.mjs   # about 6 s; ONLY=<regex> runs a subset
```

Node 22 (`node:sqlite` stands in for the Durable Object storage, as `cloudflare/d1_node.js` does for D1) and the global Miniflare (the last test runs the
same Worker in workerd with real SQLite Durable Objects and alarms; it is skipped, and says so, when Miniflare is missing). No network is used: Stripe,
Printful, the renderer and Resend are stateful fakes (`test/fakes.mjs`), and the clock is `env.NOW`.

## Safe by default

- `MERCH_FROM` is empty: the shop is shut (catalog `shut: true`, quote and checkout 503 `merch_closed`).
- Part 3 never calls the global `fetch`. Without the injected fetches, or without `MERCH_STRIPE_KEY`, `MERCH_STRIPE_WEBHOOK_SECRET`, `MERCH_HASH_KEY` and
  `MERCH_FILE_KEY`, it refuses every order, so it can never charge anyone. Wiring the real Stripe, Printful, Browser Run and Resend calls is parts 4, 5,
  6 and 9, each with the owner's approval.
- `MERCH_PROVIDER_MODE` defaults to `draft`: Printful is never asked to confirm (no wholesale charge).
- The test Worker (`MERCH_TEST=1`) refuses `sk_live` / `rk_live` keys and every origin but `https://test.doodledoggo.app`; the live Worker refuses that origin.

## What the owner must approve and set before any deploy

Approve: the deploy itself (and the test Worker's), the `merch-api.doodledoggo.app` custom domain, the cron trigger (the account has 5; count them), the
Browser Run binding (part 4). Do: open the separate Stripe account (Hong Kong, USD settlement, Adaptive Pricing, Stripe Tax) and its webhook endpoint
with the events in TRANSACTIONS.md 6.3; open Printful and fund its wallet; choose the launch countries with the accountant (section 10.1).

Secrets, by name only (set in the dashboard or with `wrangler secret put`, never in the repo or chat): `MERCH_STRIPE_KEY` (restricted key),
`MERCH_STRIPE_WEBHOOK_SECRET`, `MERCH_PROVIDER_KEY`, `MERCH_PROVIDER_WEBHOOK_SECRET` (if Printful signs), `MERCH_FILE_KEY`, `MERCH_HASH_KEY`,
`MERCH_ADMIN_KEY`, `RESEND_API_KEY`. Variables: `MERCH_OWNER_TO` (the owner's address), then `MERCH_COUNTRIES` and, last, `MERCH_FROM` with the launch date.

Never set in production: `STRIPE_FETCH`, `PROVIDER_FETCH`, `RENDER_FETCH`, `MAIL_FETCH`, `NOW`, `PAWPRINT` (test seams).

## The owner's console

`tools/merch.sh` (list, show, refund a line, reprint, confirm, lost, flag, export, report). It prints what it would do unless `DRY_RUN=0`, and reads the
key from `MERCH_ADMIN_KEY` in the environment only (sent on stdin, so it never shows in the process list). Keep one `export` a month.
