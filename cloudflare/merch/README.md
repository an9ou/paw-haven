# doodle-doggo-merch (part 3: the merch order Worker, money faked)

"Put your dog on a mug": the order server for the merch shop. The contract is `docs/design/merch/TRANSACTIONS.md`; what was built, the route list
and the T-row table are in `docs/design/merch/PART3.md`. **Nothing here is deployed, and nothing may be without the owner's go-ahead.**

## Files

| File | What |
|---|---|
| `worker.js` | The front Worker: CORS, the signed file route, the print pages (static assets); every order route goes to the ledger. Never loads PawPrint. |
| `ledger.js` | `MerchLedger`, one SQLite Durable Object: every table (6.2), the alarm, the order state machine (2.1, 2.2), refunds (4), the email outbox, the nightly job and tidy (3.3, 5). Loads PawPrint lazily. Its five rules (a lease and a wake before every outside call, read again after it, nothing for a stopped order, nothing confirmed unless live, money and mail as rows) are in PART3.md. |
| `prints.js` | `MerchPrints`, one SQLite Durable Object per JST day: the PNGs, in 1 MB parts. |
| `catalog.js` | The price list: products, zones, countries, the never list, Printful's shipping table, the holiday surcharge, the floor. |
| `lines.js` | The basket: switches, the line checks (PawPrint), prices, the margin guard. |
| `stripe.js`, `provider_printful.js`, `render.js`, `mail.js` | The four seams. Each talks only through an injected fetch (`STRIPE_FETCH`, `PROVIDER_FETCH`, `RENDER_FETCH`, `MAIL_FETCH`). |
| `provider_printful.js` (part 5) | The real Printful adapter, API v2 (one v1 call: the late cancel), built against the replies in `test/printful/` (each marked docs / built / public). On Cloudflare, with `MERCH_PROVIDER_KEY` set and no `PROVIDER_FETCH`, it uses the global `fetch`; Node never does, so the tests never reach the network. `tools/merch_pf_check.mjs` is the key-day kit (dry run by default). See PART5.md. |
| `admin.js` | The owner's admin routes (`tools/merch.sh`). |
| `build_assets.mjs` | Copies every released print folder from `site/merch/print/<ART_VER>/` (in git) into `assets/merch/print/` (git-ignored, a copy), never deleting one. |
| `wrangler.example.toml` | Bindings, the two Durable Object classes and their migration, the cron, the variables (shut by default). No ids, no secrets. |
| `test/` | The `merch_worker` suite (156 checks): the contract rows, the review's cases (R-*), crashes (C-*), races (X-race-*), a draft-mode world, Miniflare. |

## Run the tests

```
NODE_PATH=$(npm root -g) node tools/merch_build.js           # the PawPrint bundle (merch/dist/pawprint.js)
NODE_PATH=$(npm root -g) node cloudflare/merch/test/run.mjs   # about 6 s; ONLY=<regex> runs a subset
```

Node 22 (`node:sqlite` stands in for the Durable Object storage, as `cloudflare/d1_node.js` does for D1) and the global Miniflare (the last test runs the
same Worker in workerd with real SQLite Durable Objects and alarms; it is skipped, and says so, when Miniflare is missing). No network is used: Stripe,
Printful, the renderer and Resend are stateful fakes (`test/fakes.mjs`), and the clock is `env.NOW`.

## Safe by default

- `MERCH_FROM` is empty: the shop is shut (catalog `shut: true`; a quote still answers with `shut: true`, prices are public; checkout 503 `merch_closed`).
- Part 3 never calls the global `fetch`. Without the injected fetches, or without `MERCH_STRIPE_KEY`, `MERCH_STRIPE_WEBHOOK_SECRET`, `MERCH_HASH_KEY`,
  `MERCH_FILE_KEY`, a printer (`PROVIDER_FETCH`, `MERCH_PROVIDER_KEY`) and a renderer, it refuses every order, so it can never charge anyone, nor take a
  payment it then cannot make. In live mode it also needs `MERCH_PROVIDER_WEBHOOK_SECRET` (printer hints must be signed: Printful's webhook v2 `secret_key`, in hex as Printful shows it). Wiring the real Stripe, Printful, Browser Run and Resend calls is parts 4, 5,
  6 and 9, each with the owner's approval.
- `MERCH_PROVIDER_MODE` defaults to `draft`: Printful is never asked to confirm (no wholesale charge), and reprints are held. The adapter itself also
  refuses a confirm unless the mode is `live`, and always on the test Worker (`MERCH_TEST=1`, which never opens in live mode).
- The test Worker (`MERCH_TEST=1`) refuses `sk_live` / `rk_live` keys and every origin but `https://test.doodledoggo.app`; the live Worker refuses that origin.

## What the owner must approve and set before any deploy

Approve: the deploy itself (and the test Worker's), the `merch-api.doodledoggo.app` custom domain, the cron trigger (the account has 5; count them), the
Browser Run binding (part 4). Do: open the separate Stripe account (Hong Kong, USD settlement, Adaptive Pricing, Stripe Tax) and its webhook endpoint
with the events in TRANSACTIONS.md 6.3; open Printful and fund its wallet; choose the launch countries with the accountant (section 10.1).

Secrets, by name only (set in the dashboard or with `wrangler secret put`, never in the repo or chat): `MERCH_STRIPE_KEY` (restricted key),
`MERCH_STRIPE_WEBHOOK_SECRET`, `MERCH_PROVIDER_KEY` (a Printful private token: orders, file library, webhooks), `MERCH_PROVIDER_WEBHOOK_SECRET`
(Printful webhook v2 signs: PART5.md), `MERCH_FILE_KEY`, `MERCH_HASH_KEY`,
`MERCH_ADMIN_KEY`, `RESEND_API_KEY`. Variables: `MERCH_OWNER_TO` (the owner's address), then `MERCH_COUNTRIES` and, last, `MERCH_FROM` with the launch date.

Never set in production: `STRIPE_FETCH`, `PROVIDER_FETCH`, `RENDER_FETCH`, `MAIL_FETCH`, `NOW`, `PAWPRINT` (test seams).

Printer variables (part 5, all optional): `MERCH_PROVIDER_STORE` (the store id, only with an account-level token: sent as `X-PF-Store-Id`),
`MERCH_PF_V1_CANCEL` (`0`: never use v1's cancel; the owner cancels a late confirmed order in the dashboard), `MERCH_PF_POLLS` / `MERCH_PF_POLL_MS`
(re-reads of a draft whose costs are still being worked out, default 2 x 1500 ms), `MERCH_PF_PRICE_REGION` (the nightly price read, default
`worldwide`), `MERCH_PF_SHIP_REGIONS` (the cost regions whose rates the nightly job reads, default all eight).

## The print folders (never remove one)

Each released print page lives in git under `site/merch/print/<ART_VER>/` (the page build puts a new one there and it is committed). Before a deploy,
`node cloudflare/merch/build_assets.mjs` copies every folder into `assets/` (git-ignored) and prints `MERCH_ART_VERS`. **A folder is never removed once an
order was taken with it**: a line is redrawn from its own folder forever (a reprint, or a reship after the file was deleted at 180 days).

## The owner's console

`tools/merch.sh` (list, show, refund a line, reprint, confirm, lost, flag, export, forget, report, and since part 6 `gift add` (codes on STDIN only) and `gift count`). It prints what it would do unless `DRY_RUN=0`, and reads the
key from `MERCH_ADMIN_KEY` in the environment only (sent on stdin, so it never shows in the process list). Keep one `export` a month.
`gift add` also takes `tools/promo.sh`'s CSV (the first column; the header line skipped).
`forget` is deletion on request: it clears the buyer data of ended orders and says what stays (the money rows the law asks for) and which Printful
recipients to ask Printful to delete.

## Part 6 review batch (25 Nov 2026)

- `catalog.js` is the single source of the delivery promise (`SHIP_BY_DAYS` = 7, `LATE_MORE_DAYS` = 7, `ZONES[*].eta`) and of the recommended
  launch countries (`LAUNCH_SOON`, `LAUNCH_COUNTRIES`: set `MERCH_COUNTRIES` to it at launch). `site/merch/catalog.json` is written from it:
  `NODE_PATH=$(npm root -g) node tools/merch_catalog_json.js` (the suite fails while they differ).
- A new buyer route: `POST /merch/order/:id/wait` ("Keep waiting" on a late part), the same id check and limit as cancel.
- The delay plan, the gift shown after the cancel hour, and the other fixes: `docs/design/merch/PART6.md` "Review fixes (25 Nov 2026)".
