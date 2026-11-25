# Merch part 9: the sandbox run (prepared 25 Nov 2026 JST)

The plan for the whole "My dog" flow on https://test.doodledoggo.app with Stripe sandbox keys (BUILD_PLAN.md step 9, TRANSACTIONS.md 8 stage 2).
**Nothing is deployed and nothing is on sale.** Only test money moves in a sandbox: nobody is charged. Merch is a special update: every
deploy here needs the owner's go-ahead in the choice window, and the 5-minute rule does not apply.

Marks: **[O]** the owner; **[GM]** the Game Manager (shared files, the test copy deploy); **[M]** the MERCH session. "To confirm in the dashboard"
means our research does not say it for sure: look on the screen, and tell the MERCH session if it differs.

## 0. Before anything: four code changes the run needs (found while preparing)

The test Worker can be deployed today, but **it would refuse every order**, for two reasons found in the code and checked by loading the built test
bundle in local workerd (Miniflare) with a dummy value for every key: the catalog still says `shut: true` and checkout answers `merch_closed`.

| # | What is missing | Who | Needed for |
|---|---|---|---|
| C1 | **Done** (c7a0b63; `merch_worker` rows C1-node, C1-live-key, C1-throw, C1-timeout, C1-mf-global, C1-mf-refused). Was: **Stripe and Resend have no real network path.** `stripe.js` only calls `env.STRIPE_FETCH` and `mail.js` only `env.MAIL_FETCH` (test seams, "never set in production"). On Cloudflare neither is set, so `stripeReady()` is false and no email is ever sent. The printer already does it right (`provider_printful.js` `net()`: the seam, else the global `fetch` on Cloudflare's runtime with a key). | [M] | every run, and the launch |
| P1 | **Done** (c7a0b63; `merch_page` rows "P1: ...", "P1 test copy: ..."). Was: **The page never talks to a Worker.** `site/merch/api.js` has `MERCH_API = ''` (the page's own fake). | [M] | every run |
| P2 | **Done** (c7a0b63; `merch_page` rows "P2 ...", "live client: ...", "late pending: ...", "fake: late cancel ..."). Was: **Pay never opens Stripe.** `site/merch/merch.js` `pay()` shows the "shop is not open" card even on a good checkout answer. | [M] | every run, and the launch |
| G1-G3 | **The test copy does not serve `/merch/`** and its CSP blocks the merch API (part F); G3 (fourth review): it serves the test token file, without which the test Worker takes no order. | [GM] | every run |
| C2 | **Done** (25 Nov, branch `merch/part9-test-printer`; `merch_worker` rows C2-shape, C2-flow, C2-address, C2-tee, C2-all, C2-down, C2-file, C2-realkey, C2-live, C2-build, C2-mf, C2-mf-keys). Was: **no printer without a Printful key**: the gate wants one, so no order is taken. Now a stand-in printer Worker for the test Worker only (part C). | [M] | run 1 (the owner said "not yet" to the key) |

C1, P1, P2 and C2 are built (part C, "Code changes", says what each does); they need one review before the run (the part 9 lesson: every fix
batch so far hid new holes). The deploy script itself is ready: `tools/merch_test_deploy.sh` (part B), with `MERCH_TEST_PRINTER=1` for run 1.

---

## A. What the owner does

Everything here is free: a Stripe sandbox never charges a card, the Cloudflare Free plan stays free, Resend's free plan is enough, Printful drafts
are never charged. About **40 minutes** in all before the first run. Never paste a key into the chat or anywhere but the box named.

| # | Step | Where (click path) | Copy what, to where | Time | Money | Can wait? |
|---|---|---|---|---|---|---|
| 1 | **Make the new, separate Stripe account.** Name "Doodle Doggo Merch", country **Hong Kong** (the country cannot be changed later: to confirm in the dashboard). Stop after it is made: do **not** "Activate payments" (business details and bank are only for real money, part 10). | dashboard.stripe.com, your account name (top left), **New account** (to confirm the words) | nothing | 5 min | free | no |
| 2 | **Open its sandbox** (test mode) and stay in it for every step below. | the new account, the **Sandbox** / **Test mode** switch (to confirm where) | nothing | 1 min | free | no |
| 3 | **Public details.** Public business name "Doodle Doggo", support email contact@doodledoggo.app, **Terms of service URL** `https://doodledoggo.app/merch/terms/` (Stripe only links it; our checkout asks buyers to tick the terms, and Stripe refuses that without this URL: to confirm). | Settings, Business, **Public details** (to confirm) | the URL above | 3 min | free | no |
| 4 | **Adaptive Pricing on** (buyers may pay in their own money). If there is no such setting for a Hong Kong account, tell us: that is a finding (TRANSACTIONS 3.1, not-verified 1). | Settings, Payments, **Adaptive Pricing** (to confirm) | nothing | 1 min | free | no |
| 5 | **Stripe Tax on** with the Hong Kong head office address (typed in Stripe only, never here). **No registrations** (as at launch: tax is 0 everywhere). Our checkout always asks for automatic tax, which needs this (to confirm). | Settings, **Tax** | nothing | 5 min | free in a sandbox (to confirm) | no |
| 6 | **Payment methods**: cards, Apple Pay, Google Pay, Link on; bank debits and pay-later off. | Settings, Payments, **Payment methods** | nothing | 2 min | free | yes |
| 7 | **The restricted key** for the test Worker. Name "merch test Worker". Permissions, exactly: **Checkout Sessions: Write; Refunds: Write; PaymentIntents: Read; Charges: Read; Disputes: Read**; everything else None. It starts with `rk_test_`. | Developers, API keys, **Create restricted key** | the key, once, straight into Cloudflare step 10 (`MERCH_STRIPE_KEY`) | 3 min | free | no |
| 8 | **The webhook.** Endpoint URL `https://merch-api-test.doodledoggo.app/merch/webhook/stripe`; API version `2025-03-31.basil` if the form offers a choice (to confirm). Events, all of these: `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `checkout.session.async_payment_failed`, `checkout.session.expired`, `charge.refunded`, `charge.dispute.created`, **`charge.dispute.updated`**, `charge.dispute.closed`, and the refund-failure events the list offers: `refund.failed`, `refund.updated`, `charge.refund.updated` (tick each one that exists). It can be made before the Worker exists. | Developers, Webhooks, **Add destination** (Your account, Webhook endpoint) | its **signing secret** (`whsec_...`, Reveal) into Cloudflare step 10 (`MERCH_STRIPE_WEBHOOK_SECRET`) | 5 min | free | no |
| 9 | **Radar**: block when the CVC check fails, block the highest risk. | Radar, **Rules** | nothing | 1 min | free | yes |
| 10 | **Secrets on the test Worker** (after our first deploy made it: a Worker must exist before a secret can be added). For each: **Add**, Type **Secret**, the name, the value, then **Deploy**. `MERCH_STRIPE_KEY` (step 7), `MERCH_STRIPE_WEBHOOK_SECRET` (step 8), `MERCH_FILE_KEY`, `MERCH_HASH_KEY`, `MERCH_ADMIN_KEY` (each a **new** random password of 50+ characters from your password manager's generator; keep only the admin one, in your password manager), `MERCH_OWNER_TO` (your email, as a Secret so our redeploys keep it), and `MERCH_TEST_MAIL_TO` (fourth review: the only addresses the test may email buyers at, comma between them: your own, and anyone else's who pays test orders; `you+location_JP@...` counts as `you@...`. As a Secret too. Without it no buyer email goes out). | Cloudflare dashboard, Workers & Pages, **doodle-doggo-merch-test**, Settings, **Variables and Secrets** | the values above | 10 min | free | no |
| 11 | **The admin key for Claude.** When the session opens a secure form for the host `merch-api-test.doodledoggo.app`, paste the `MERCH_ADMIN_KEY` value there. Then `tools/merch.sh` works from the session and the key never shows in chat. | the secure form in the Claude app | `MERCH_ADMIN_KEY`'s value | 1 min | free | no |
| 12 | **Emails** (if you say yes in Q3): a Resend key with **Sending access** for the domain doodledoggo.app only (the domain is already verified for the game's password codes, so no DNS work), and **open and click tracking off** for the domain. | resend.com, API Keys, **Create**; Domains, doodledoggo.app (tracking: to confirm where) | the key into Cloudflare step 10 as `RESEND_API_KEY` | 3 min | free (100 emails a day on the free plan, shared with the game's reset codes: to confirm; the run sends about 30) | yes (run 1 can go without) |
| 13 | **Printful** (later, run 2): a separate **test store** in Printful, its private token (orders, file library, webhooks) through the secure form for `api.printful.com`, and on the Worker `MERCH_PROVIDER_KEY` and, once the webhook is set up, `MERCH_PROVIDER_WEBHOOK_SECRET`. | printful.com; the secure form; Cloudflare step 10 | the token | 10 min | free (drafts are never charged) | yes |
| 14 | **During the run**: pay test orders on your phone or computer with Stripe's test card numbers (part D), and a few clicks in the Stripe dashboard (a refund, dispute evidence). | test.doodledoggo.app/merch/ (the test password), the Stripe sandbox | nothing | 2-3 sittings of about an hour (about 45 short orders, with waits for the cancel hour in between) | free | - |

Also the four go-aheads in part F ("Questions for the owner"). The game's test copy password (`TEST_PASSWORD`) is already set; nothing new there.
The shared test token (fourth review) needs nothing from you: the build makes it and the test copy gets it from the GM (part F, G3).

---

## B. What gets deployed

One new Worker, **`doodle-doggo-merch-test`**, on the Free plan, at **https://merch-api-test.doodledoggo.app** (a Workers Custom Domain; its
workers.dev address off). For run 1 (no Printful key yet) a second one, **`doodle-doggo-merch-test-printer`**, the stand-in printer (C2): no
address at all (no route, no domain, workers.dev off), reached only through the test Worker's service binding `PROVIDER_FETCH`. The game's
test copy `doodle-doggo-test` is redeployed by the GM with the merch page in it (part F). Nothing live changes.

**What it runs**: the real `cloudflare/merch/worker.js`, unchanged, inside a small test entry that `tools/merch_test_build.mjs` writes (outside the
repo): it serves the released print folders from Text modules, because a Claude session cannot upload Workers static assets (the cloud proxy
replaces their upload token: `tools/cf_test.js`, CLOUDFLARE_LOGIN.md), exactly as the 25 Nov cloud render test did; and it answers 503 to
everything (and skips the cron) unless `MERCH_TEST = "1"`. Bundle built here on 25 Nov: **4,457 KiB, gzip 1,533 KiB** (Free limit 3 MB gzip).

| Part | Value |
|---|---|
| Durable Objects (SQLite, Free plan) | `LEDGER` -> `MerchLedger`, `PRINTS` -> `MerchPrints`, `RENDER` -> `MerchRender`: the test Worker's own objects, never the live ones |
| Migration | first deploy only: one step to tag `v2`, `new_sqlite_classes` = the three classes (the form Cloudflare took on 25 Nov; the end tag matches the toml's last one). Later deploys send none. A new tag in `wrangler.example.toml` makes the build refuse until the script learns it. |
| Browser Run | binding `BROWSER` (no token). Free plan: 10 browser-minutes a day for the whole account. Our test budget `MERCH_BROWSER_BUDGET_MS = 60000` (one minute a day): billed 1.07-1.45 s a tee and 0.47-0.70 s a mug (cloud test), so about 40 tees or 100 mugs a day, then the resvg fallback draws (a test row). **Cost: $0.** |
| Self binding | `SELF` -> `doodle-doggo-merch-test`, entrypoint `RenderGate` (a second upload: a binding can only name a Worker that exists) |
| Print pages | `ASSETS`, stood in by the test entry: every folder in `site/merch/print/` (today `pp1-6df20bb6`) |
| Stand-in printer (run 1, `MERCH_TEST_PRINTER=1`) | binding `PROVIDER_FETCH` -> `doodle-doggo-merch-test-printer` (in both uploads). That Worker: `cloudflare/merch/test_printer.js` behind a two-line entry, one SQLite Durable Object `PRINTER` -> `TestPrinter` (its own migration `v1` on its first deploy), no variables, no secrets, no cron, no route, workers.dev off. It is uploaded **first** (a binding can only name a Worker that exists). The test entry makes it the printer only while `MERCH_TEST = "1"`, the binding is there and no real `MERCH_PROVIDER_KEY` is set (it then passes the key `test-printer`); with a real key the binding is taken away, so that key goes to Printful, never to the stand-in. A later send without `MERCH_TEST_PRINTER=1` drops the binding. |
| Cron | `*/10 * * * *`: the backstop wake and the nightly job after 04:00 JST. **The account may have 5 cron triggers**; `pawhaven-api` has 2. Count: Cloudflare dashboard, each Worker, Settings, Triggers, Cron Triggers; the script also counts them through the API and refuses to add a 6th. |
| Account counts | Workers 6 today (25 Nov) -> 7 (8 with the stand-in printer of C2); Durable Object namespaces 0 -> 3 (4: the stand-in's `TestPrinter`). Cron triggers: +1 (the stand-in has none). Well inside the Free plan (the deploy script counts the Workers and the cron triggers before it sends). |
| Logs | `observability.enabled` (Workers Logs; the code logs only short error texts, never a key, an address or an email) |
| Secrets | set by the owner (A10), names only: `MERCH_STRIPE_KEY`, `MERCH_STRIPE_WEBHOOK_SECRET`, `MERCH_FILE_KEY`, `MERCH_HASH_KEY`, `MERCH_ADMIN_KEY`, `MERCH_OWNER_TO`, later `RESEND_API_KEY`, `MERCH_PROVIDER_KEY`, `MERCH_PROVIDER_WEBHOOK_SECRET`. Every upload sends `keep_bindings: ["secret_text"]`, so a redeploy keeps them. |

**Variables** (from `wrangler.example.toml` `[env.test.vars]`; the three run values on top are the script's own, printed on every run):

| Variable | Test value | Why |
|---|---|---|
| `MERCH_TEST` | `1` | takes only `sk_test_` / `rk_test_` Stripe keys (after trimming: fourth review R4-m2), refuses every origin but https://test.doodledoggo.app and any printer confirm; buyer emails only to `MERCH_TEST_MAIL_TO` |
| `MERCH_TEST_TOKEN` | random, 32 bytes (run value, fourth review R4-m4; never printed: in the build folder's `test_cfg.json`; kept when the same folder is built again, `MERCH_TEST_TOKEN=<it>` to give it) | the test order server is public: a checkout, an order button (cancel, wait, address, refund) and an unsigned printer hint need it in the header `X-Merch-Test-Token`. The test page reads it from `/merch/test_cfg.json` behind the test password (part F, G3). The live Worker never has one |
| `MERCH_FROM` | `2026-11-25T00:00:00+09:00` (run value; `MERCH_TEST_FROM=` keeps it shut) | the test shop is open; it still takes no order until the keys are there |
| `MERCH_COUNTRIES` | `catalog.js LAUNCH_COUNTRIES` (run value): every country but GB, the EU 27, Brazil, Korea and a few others | the run tests the recommended launch list, "coming soon" included |
| `MERCH_DAY_CAP` | `10` (`MERCH_TEST_DAY_CAP` changes it) | the soft-launch cap |
| `MERCH_PROVIDER_MODE` | `draft` | the test Worker never confirms at the printer (the build refuses anything else) |
| `MERCH_PRODUCTS` | `mug,tee` | the launch products |
| `MERCH_COOL_MIN` | `60` | the real cancel hour |
| `MERCH_SITE` | `https://test.doodledoggo.app` | every buyer link and Stripe's return pages point at the test copy |
| `MERCH_PUBLIC_URL` | `https://merch-api-test.doodledoggo.app` | where Browser Run opens the print page and Printful fetches the files |
| `MERCH_STRIPE_VERSION` | `2025-03-31.basil` | pinned |
| `MERCH_BROWSER_BUDGET_MS` | `60000` | shares the account's 10 minutes |
| `MERCH_RENDER_VIA`, `MERCH_PF_V1_CANCEL`, `MERCH_PF_PRICE_REGION`, `MAIL_FROM` | `direct`, `1`, `worldwide`, `orders@doodledoggo.app` | as the toml |
| left out (empty) | `MERCH_OFF`, `MERCH_ART_VERS`, `MERCH_OWNER_TO`, `MERCH_SELLER_NAME`, `MERCH_SELLER_ADDR`, `MERCH_GIFT_NAME`, `MERCH_PROVIDER_STORE` | so the owner can add them as Secrets and a redeploy keeps them (and `MERCH_TEST_MAIL_TO`, not in the toml: A10) |

The build refuses to send a test seam (`STRIPE_FETCH`, `PROVIDER_FETCH`, `RENDER_FETCH`, `MAIL_FETCH`, `NOW`, `PAWPRINT`, `RESVG_WASM`,
`MERCH_RENDER_PROBE`) or a secret's name as a variable. The stand-in's `PROVIDER_FETCH` (C2) is a service binding the build adds itself with
`MERCH_TEST_PRINTER=1`, never a variable; the build refuses a toml that binds `PROVIDER_FETCH`.

**The script**: `tools/merch_test_deploy.sh` (new; `tools/cf_test_deploy.sh` is untouched). It builds into one fixed folder outside the repo
(`MERCH_TEST_OUT`, default `$TMPDIR/dd-merch-test-build`), so a rebuild keeps the test token; the build wipes only a folder it made (its
`.merch_test_build` marker) or an empty or new one, and refuses any other (fourth review R4-m5). Dry by default; `BUILD_ONLY=1` builds only; a real send
needs `DRY_RUN=0` **and** `MERCH_TEST_DEPLOY_OK=1`; it refuses any name but `doodle-doggo-merch-test`; it never reads, prints or sets a secret (in a
cloud session the proxy adds the Cloudflare token; elsewhere only curl reads `CLOUDFLARE_API_TOKEN`). Its public checks also expect a checkout
without the test token to be refused (403, or 503 while shut). What it printed here on 25 Nov:
- `BUILD_ONLY=1`: the bundle (entry.js, the wasm, three print files as Text modules; 4,457 KiB, gzip 1,533 KiB), the bindings, the migration and
  the 15 variables above (16 since the fourth review: `MERCH_TEST_TOKEN`); "nothing sent". Loaded in local Miniflare: the catalog answers (`shut: true` with no keys), the print page 200, CORS 204
  for the test copy and 403 for the live site, the Stripe webhook 503 `not_set_up`, admin 401, checkout `merch_closed`; with `MERCH_TEST=0` every
  route 503. With dummy values for every key it stays `shut` (blocker C1).
- the default dry run: the same build, then every request it would send: the zone, the Worker list, the cron count per Worker, two uploads
  (`meta_new.json` with the migration, then `meta.json` with `SELF`), the cron `PUT .../schedules`, workers.dev off, the Custom Domain (with the
  DNS check), the secret names, the public checks; "nothing was sent". `DRY_RUN=0` without `MERCH_TEST_DEPLOY_OK=1`: refused (exit 2).
- With `MERCH_TEST_PRINTER=1` (C2, 25 Nov): the build adds the stand-in (`printer/`: `entry.js`, upload 16.99 KiB, gzip 6.19 KiB; the test
  Worker 4,459 KiB, gzip 1,534 KiB) and `PROVIDER_FETCH -> doodle-doggo-merch-test-printer` in both uploads. The dry run then prints, before the
  test Worker's two uploads: `PUT .../scripts/doodle-doggo-merch-test-printer` with `printer_meta_new.json` (bindings `PRINTER:durable_object_namespace`;
  migration `v1` `TestPrinter`) + `entry.js`, and `POST .../doodle-doggo-merch-test-printer/subdomain {"enabled":false}`; no cron, no domain for it;
  at the end the workers.dev check for it and how to delete both (the test Worker first). Without it, the output is as before (one line says the
  stand-in was not built). The build refuses the stand-in for any Worker name but `doodle-doggo-merch-test`.

**The first deploy, in order**
1. C1, P1, P2 (and C2 for run 1) merged into `merch/shop` and reviewed; `merch_worker` and `merch_page` green; G1-G3 merged by the GM.
2. The owner's go-ahead (Q1). Stripe steps A1-A8 may come before or after.
3. `DRY_RUN=0 MERCH_TEST_DEPLOY_OK=1 MERCH_TEST_PRINTER=1 bash tools/merch_test_deploy.sh` (run 1): makes the stand-in printer Worker
   (workers.dev off), then the Worker (two uploads), the cron, workers.dev off, the Custom Domain; lists the missing secrets; checks the public
   answers (the webhook check says 503 until its secret is set: expected). The Worker is safe with no secret at all: it refuses every order
   (README "Safe by default").
4. The owner adds the secrets (A10, A11), but **not** `MERCH_PROVIDER_KEY` for run 1 (a real key turns the stand-in off). Run the script again
   (with `MERCH_TEST_PRINTER=1`): no missing secrets but the printer's; it says "printer: the stand-in"; the catalog `shut: false`.
5. The GM deploys the test copy with the merch page (`bash tools/cf_test_deploy.sh`, its own go-ahead).
6. Smoke: one mug to the US with the card 4242 (row S-6).

**Approval prompts the deploy raises**: (1) the owner's go-ahead in the choice window for the merch test Worker (special update: no 5-minute
rule); (2) a separate go-ahead for the GM's test copy deploy with the merch page; (3) the session's permission prompt for the one command that
sends (`DRY_RUN=0 MERCH_TEST_DEPLOY_OK=1 bash tools/merch_test_deploy.sh`, about 15 Cloudflare API calls), unless it is already allowed; (4) the
secure form for the admin key (A11) and later the Printful token (A13). The wrangler download is from the npm registry (open by default). No
prompt for the secrets: the owner types them in the dashboard.

**What a cloud session can and cannot carry here** (the same REST upload as `tools/cf_test_deploy.sh` and the 25 Nov cloud test):
- Durable Objects, their migration, the Browser Run binding and the self binding: **carried** (accepted by Cloudflare on 25 Nov).
- Static assets: **not carried** (the upload token is replaced by the proxy). Stood in by the test entry, as on 25 Nov. Fine for the test; the live
  Worker needs the same answer before launch (an entry like this one, or a deploy from the owner's machine with wrangler).
- The cron: one `PUT /accounts/<id>/workers/scripts/<name>/schedules` call. **Not yet made from a session**: it needs only Workers Scripts: Edit (to
  confirm at the first send); the answer's shape for the count is also to confirm.
- `wrangler deploy` itself: not used (it would upload assets and log in its own way); wrangler only bundles (`--dry-run`, metrics off).
- PART3's last box ("`[env.test]` inherits migrations, triggers and assets"): answered by design: the script sends all three itself, so nothing
  depends on wrangler's environment rules. Check it again only if the test Worker is ever deployed with `wrangler --env test`.

---

## C. The printer and the emails in the test

### What the code does without the keys

| Missing | What happens | So |
|---|---|---|
| Printful key (`MERCH_PROVIDER_KEY`) | `providerReady()` is false, the gate says `not_set_up`: the catalog is `shut`, **every checkout is refused**. No draft, no cost read, no hint. | Run 1 uses the stand-in printer (C2, built): deployed with `MERCH_TEST_PRINTER=1`, it is the printer while no key is set. |
| `MERCH_TEST_MAIL_TO` (fourth review) | Orders go on; no buyer email at all: each row `failed` / `test_not_listed`, no "mail failed" owner email. Owner emails still go. | Set it (A10) before the email rows (D8). |
| Resend key (`RESEND_API_KEY`) | Orders go on. Each email is still an outbox row, marked `failed` / `not_set_up` at once, with no retries and no "mail failed" owner email. `tools/merch.sh show <order>` lists every row (kind, status). | Run 1 proves **which** emails are queued **when**; not their delivery or looks. |
| Both | As above: nothing at all can be ordered. | - |

### Differences between the stand-in printer and real Printful (fourth review: read run 1's results with these in mind)

1. It never confirms, and the test Worker is in draft mode: every order ends `held draft_mode`. Nothing after a confirm runs in the sandbox
   (parcels, hints, re-reads, the late cancel's read, the reship hold, Printful's hold, reprints, the lost-dispute cancel): only the Node and
   Miniflare suites cover those.
2. It never posts, returns or sends webhooks: the hint route and Printful's webhook signature are never used. Unsigned hints on the test
   Worker need the test token (R4-m4).
3. It never fetches the print file: the signed `/merch/file/` link, its expiry and size checks are not tried by a printer ("Test Refuse File"
   is a canned answer).
4. Its costs are our own `catalog.js` estimates, always `done`, no tax or VAT: the cost hold (over 110%), `cost_unknown` and `calculating`
   are never reached, and the run's margins are not Printful's.
5. It checks the recipient only for blank fields and the magic name; real Printful refuses bad state or ZIP codes and more.
6. "Test Printer Down" stops every order for 30 minutes, not just the one that typed it.
7. It frees an external id once its draft is deleted; what Printful does is not recorded (the ledger's `-d<n>` ids make it not matter).
8. No 429, 409 or Retry-After answers, no split or partial shipments (so R4-M1 cannot show up in the run).

### The options (one recommendation each)

| Option | What it proves | What it leaves unproven | Code it needs |
|---|---|---|---|
| **1. Run 1: Stripe + a stand-in printer, draft mode (recommended first)** | All of Stripe: checkout, Adaptive Pricing, tax, every zone, webhooks and their re-read, cancel in the hour, refunds of every kind, refund failure, disputes (won, lost, inquiry), expiry, missed webhooks; the real Browser Run render and the resvg fallback; signed print files; the draft step, the printer's refusals (an address, a line, all lines, down, a file) through the stand-in; the held `draft_mode` state; the order page, the nightly report, the export. With a Resend key: every email that these paths send. | Real Printful replies (create, costs, the file fetch, the refusal texts, the webhook signing); everything after confirm (production, parcels, delivered, returned, the late steps). | C1, P1, P2, C2 |
| **2. Run 2: the real Printful key, still draft (recommended second, short)** | `tools/merch_pf_check.mjs --run` (dry first), the recorded fixtures re-made; then 3-4 orders through the test Worker with the real key: real drafts in the Printful test store (never charged), costs against `cost_est`, Printful fetching our signed file, a real address refusal, the delete on cancel, the webhook set-up and one signed event. | Confirm, parcels, delivery, returns: no confirm ever happens on the test Worker. They wait for part 10's samples and the live dry run. | C1, P1, P2 (C2 stays off: the build wires the stand-in only while no real key is set) |
| 3. Wait for the key and do one run | As 1 + 2, minus the stand-in's refusals (the real printer refuses only what it really refuses). | Same as 2. | C1, P1, P2 |
| 4. A stand-in that also "posts" parcels (run 1b) | Production, parcels, "On its way", delivered, a returned parcel and its address form, a reprint, a refund after shipping, a dispute after shipping, a Dashboard refund after confirm (T2.2-21). | The late steps (they need 7 working days). | C2 plus C3 (below). **Not recommended now**: it needs a door in the printer's "never confirm on the test Worker" rule. The suite covers these rows (298 checks); part 10 runs one real order through them. |

### Code changes (C1, P1 and P2 built on 25 Nov 2026, c7a0b63; C2 built on 25 Nov 2026; C3 described only; none touches `ledger.js`)

**C1. A real network for Stripe and Resend (needed for the run and for the launch).**
- Files: `cloudflare/merch/util.js` (move `onWorkers()` there from `provider_printful.js`, and add `netOf(seam, key)`: the injected fetch when set,
  else the global `fetch` only on Cloudflare's runtime and only with the key), `stripe.js` (`stripeReady()` and `req()` use it with
  `MERCH_STRIPE_KEY`), `mail.js` (`send()` and `owner()` with `RESEND_API_KEY`), `provider_printful.js` (use the shared helper; no change in what it does).
- Safe as before: in Node there is never a global path (`onWorkers()` is false), so `X-not-set-up` and every row stay as they are; `sk_live` /
  `rk_live` stay refused on the test Worker.
- Tests: the existing suite unchanged; new Miniflare rows: with a key and no seam, a Stripe call and a Resend call reach the global fetch
  (Miniflare's `outboundService` answers them, nothing leaves the machine); an `sk_live` key on `MERCH_TEST=1` is still refused; with no key,
  nothing is called.
- Built (c7a0b63). What the seam had hidden, checked against the real calls: the Stripe base URL, the Bearer key, the pinned `Stripe-Version`,
  form encoding and the `Idempotency-Key` header were already right (the same shape as the game Worker's live shop calls); Resend's URL, Bearer key,
  JSON body and `Idempotency-Key` too. New: a call that never answers is now aborted at its time limit (`util.js` `call`), and a thrown fetch is
  the same not-ok answer as a 5xx (retried; never "refused for good"). `req()` itself also refuses a live key on the test Worker, not only the gate.

**P1. The page's address of the order server.** `site/merch/api.js`: `MERCH_API` = `https://merch-api-test.doodledoggo.app` when
`location.origin` is `https://test.doodledoggo.app`, else `''` (the fake), until launch sets the live address. Suite `merch_page`: the test origin
uses the live client, every other origin the fake.

**P2. Pay opens Stripe.** `site/merch/merch.js` `pay()`: on `{order, url}` go to `url` (`location.assign`) **only** if it starts with
`https://checkout.stripe.com/`; anything else is the "We couldn't reach the payment page" error. The "shop is not open" card stays for
`merch_closed`; the made-up thank-you page stays fake-only. Suite `merch_page`: a live-mode fake that answers a Stripe url, a bad url, and each error.
Built (c7a0b63): only with the live client (the page's fake never pays); the url must also have no spaces, quotes, `<>` or `\` and be at most
2048 characters. The page's whole live path was checked against the Worker's routes: two checkout errors had no words (`bad_nonce`, and
`nonce_used`, which now links to that order and starts a new payment on the next tap); the late cancel's `refund: 'pending'` now has a fake case.

**C2. A stand-in printer for the test Worker only (run 1).**
- A new file `cloudflare/merch/test_printer.js`: a small Worker `doodle-doggo-merch-test-printer` with one SQLite Durable Object that answers the
  Printful calls `provider_printful.js` makes (create a draft with costs, read it by id and by `@external_id`, its shipments (none), change its
  recipient, delete it, v1 delete, catalog prices, shipping rates) in the shapes of `test/printful/*.json`, ported from `test/fakes.mjs`
  `fakePrintful()`. No route of its own, no domain, workers.dev off: only reachable through a service binding.
- What it refuses, chosen by the **shipping name typed on Stripe's page** (so the owner needs no command): "Test Refuse Address" (the recipient),
  "Test Refuse Tee" (the tee lines), "Test Refuse All", "Test Printer Down" (503 for 30 minutes), "Test Refuse File" (a file problem). Any other
  name: a normal draft.
- Wiring, only in the test entry (`tools/merch_test_build.mjs`, with `MERCH_TEST_PRINTER=1`): a service binding `PROVIDER_FETCH` to the stand-in,
  and a `MerchLedger` subclass that passes `MERCH_PROVIDER_KEY = 'test-printer'` to the ledger **only** when `MERCH_TEST = "1"`, the binding is
  there and no real `MERCH_PROVIDER_KEY` is set. The live toml never has the binding; the build refuses it for any other Worker name.
- Tests: a new `t_testprinter.mjs` in `merch_worker`: the stand-in answers every adapter call like the recorded fixtures; in Miniflare the built test
  bundle takes a basket from a faked Stripe payment to `held draft_mode`; each magic name gives T2.2-36, T2.2-32, T2.2-33, T2.2-34 and the file
  case; with a real key set the stand-in is not used; the live build has no `PROVIDER_FETCH`.
- Cost: one more Worker and one Durable Object namespace on the Free plan; delete it with the test Worker.
- **Built (25 Nov).** Files: `cloudflare/merch/test_printer.js` (the stand-in, `printerEnv`, the magic names), `tools/merch_test_build.mjs`
  and `tools/merch_test_deploy.sh` (`MERCH_TEST_PRINTER=1`), two small guards outside the stand-in, and `test/t_testprinter.mjs` (12 rows, all
  in `merch_worker`). What it does, and where it differs from the plan above:
  - **The ledger is wrapped in the test entry** (`class MerchLedgerT extends MerchLedger`, exported under the same class name, so no new
    migration): its env goes through `printerEnv`. With a real `MERCH_PROVIDER_KEY` the binding is **taken away**, so the real key is never sent
    to the stand-in; it goes to Printful through the global fetch, as without C2. `ledger.js` is unchanged.
  - **The word `test-printer` is never a key anywhere else** (`provider_printful.js` `net()`): only on the test Worker with the binding. On the
    live Worker it means "no printer" (shut, nothing sent), so it can never reach `api.printful.com` or open the live shop.
  - **The stand-in refuses every key but its own** (401, as Printful refuses a bad key) and keeps no address: only the country, for the costs.
    A missing name, first line, city or country is refused like a bad address.
  - **Its own two-line entry** (`printer/entry.js`): a Worker's main module may export only handlers and classes.
  - **"Test Printer Down" takes the whole stand-in down** (every call, every order) for 30 minutes from that order's first try, once per order:
    that is what lets F-5's second order (cancelled while down) show the draft delete being retried. With the backoff (1, 5, 15, 60 min) the
    order is drafted on its try about 81 minutes in, after the cancel hour, and goes straight to `held draft_mode`: **`held provider` is not
    reached in F-5** (it needs an outage past the hour; the suite covers it, T2.2-34). F-6 shows `held provider` instead.
  - **"Test Refuse File" refuses on every try** (a broken file does not mend itself): retried as down, `held provider` after the hour, the
    owner's "could not use a print file" email at 24 h. End it with a cancel in the hour or `merch.sh refund`.
  - **Marked in the owner's tools**: `merch.sh show` and `merch.sh report` start with `"printer": "STAND-IN (test_printer.js): not Printful;
    these drafts and costs are made up from catalog.js"` (admin.js `printerNow`). The stand-in's costs are catalog.js's own estimates, so a
    cost hold (T2.2-39) never happens with it. Not marked: the nightly report email (it says what the JSON says, without the printer line).
  - It never confirms: the adapter refuses on `MERCH_TEST=1` as before, and the stand-in refuses a confirmation too. No parcels, no hints (C3).

**C3 (only for option 4; not recommended now).** `provider_printful.js` `providerReady()` and `confirm()` would allow `live` on the test Worker only
when the printer is the stand-in (`MERCH_PROVIDER_KEY === 'test-printer'` and `PROVIDER_FETCH` set), plus a random `MERCH_PROVIDER_WEBHOOK_SECRET`
shared with the stand-in, which then "makes" and "posts" each order on its own clock and sends signed hints. It opens a path around the rule that
the test Worker never confirms, so it needs its own review and a row proving a real key can never be confirmed.

**Not proposed**: a clock shift to reach the late steps (T2.1-30, -31, -34) or the 7-day reship refund. It would change how the ledger reads time;
the suite covers those rows.

---

## D. The run

**Setup for every row**: the test copy https://test.doodledoggo.app/merch/ (log in once with the test password; open email links in that same
browser: the password page drops the `#/order/...` part of a link). A `curl` to `/merch/checkout`, an order's buttons or an unsigned printer hint
needs the test token (`-H "X-Merch-Test-Token: <test_cfg.json's token>"`, fourth review); the catalog, a quote and `merch.sh` need none. Stripe test cards: any future date, any CVC, any postcode (the card numbers below are from Stripe's testing page, docs.stripe.com/testing: if one behaves differently, note what it did). Emails at checkout:
your own address with `+location_XX` before the `@` (for example `you+location_JP@...`), which makes Stripe's sandbox act as a buyer in country XX
for Adaptive Pricing (TRANSACTIONS 3.1); use a mailbox that accepts `+` addresses. Commands run from the session, after A11:
`MERCH_API=https://merch-api-test.doodledoggo.app MERCH_ADMIN_KEY=placeholder DRY_RUN=0 bash tools/merch.sh <command>` (the proxy puts the real key in;
"placeholder" is not a key). Times: note them in JST. Run 2 rows are marked **(run 2)**; rows nobody can reach in a sandbox are in part D9.

### D1. Set-up checks

| # | What | How | Expected | Result |
|---|---|---|---|---|
| S-1 | Deploy checks | `tools/merch_test_deploy.sh` real send, then again after the secrets | every check `ok`; no missing secret but the ones for later | |
| S-2 | Shop open | the page, or `curl https://merch-api-test.doodledoggo.app/merch/catalog` | `shut: false`; GB, DE, FR, BR, KR "soon"; RU not listed | |
| S-3 | What is set up | `merch.sh report` | browser yes, fallback `RENDER` yes, ledger writes counted | |
| S-4 | Render health | `merch.sh render-test tee browser direct`, then `mug resvg` | both pass: sizes 4500x5400 and 2700x1050, a 15-minute file link | |
| S-5 | The page on the test copy | open /merch/ on a phone and a desktop | your test-copy dogs listed (the page reads the test game's save), a quote, no console error (CSP) | |
| S-6 | Smoke | one mug, US, card `4242 4242 4242 4242`, `+location_US` | Stripe opens; back on `/merch/?new=1#/order/<id>` (the fragment survives Stripe's `success_url`: PART6 line 84); "Thank you", the cancel time | |

### D2. Products and colours (US, `4242 4242 4242 4242`, unless said)

| # | What | How | Expected | Result |
|---|---|---|---|---|
| P-1 | Mug | white mug, stand pose, name on | Stripe line "Mug with your dog" $19.99 + $4.99; the PNG at 100%: strip clear of the handle | |
| P-2 | Light tees | one basket: white M (sit, name off), soft-cream S, athletic-heather L, pink XL, ice-blue XS | 5 lines "Tee with your dog (Colour, Size)" in the order sent (PART3 box: line order); free shipping | |
| P-3 | Dark tees and big sizes | navy 2XL, black 5XL, happy pose, name on | +$2 and +$8 on the price; the PNGs at 100%: the patch behind the dog, a light name | |
| P-4 | Limits | 6 lines, one with qty 3; then try a 7th line and qty 4 | 6 x 3 taken; "Up to 6 things, and up to 3 of each" | |
| P-5 | Every line made | `merch.sh show <order>` for P-1 to P-3 | each line: renderer, sha, bytes, `art_ver pp1-6df20bb6`; the signed links open the PNG; a link with one letter changed: 403 | |
| P-6 | After the hour (62 min) | `merch.sh show` | held `draft_mode` (never confirmed); a `provider_order` (run 1: the stand-in's, `"printer": "STAND-IN ..."`; run 2: the draft in Printful's dashboard) | |

### D3. Zones, tax and currency (one mug + one tee each, card 4242, the email named)

| # | What | How | Expected | Result |
|---|---|---|---|---|
| Z-1 | US | `+location_US`; then a mug alone | $46.98, free shipping (over $35); a mug alone $24.98; USD only; tax 0 | |
| Z-2 | Japan | `+location_JP` | Stripe offers yen; `merch.sh show`: `amount_total` in USD cents, `pres_currency` jpy; the order page "You paid ¥..." (not-verified 2: does the yen total cover the shipping?) | |
| Z-3 | Canada | `+location_CA` | $7.99 fee under $70; Canadian dollars offered | |
| Z-4 | Australia | `+location_AU`, three tees | $80.97, free shipping (over $70); Australian dollars | |
| Z-5 | New Zealand | `+location_NZ` | as Z-3 | |
| Z-6 | Hong Kong | `+location_HK`, two items | world zone: $11.99 + $5.99 for the second; "may charge import tax" note; HK dollars | |
| Z-7 | Another world country | `+location_MX` (or SG) | as Z-6 in its money | |
| Z-8 | Shut countries | the page; then `curl -X POST .../merch/quote` for GB | GB, DE "coming soon"; the quote 403 `country_closed` | |
| Z-9 | Only the quoted country | on Stripe's page try another country | Stripe offers only the one country | |
| Z-10 | The address path | a paid Z-1 order | not held `other_country` (PART3 box: `collected_information.shipping_details`); drafted, so the address came whole (the stand-in refuses one without a name, first line, city or country, and keeps only the country) | |
| Z-11 | A taxed order (can wait) | add one US state registration in the sandbox's Stripe Tax, order to that state, then remove it | tax on top on Stripe's page; `amount_total` = subtotal + fee + tax; the order paid (T2.2-56) | |

### D4. Paying: edges and repeats

| # | What | How | Expected | Result |
|---|---|---|---|---|
| E-1 | Declined | card `4000 0000 0000 0002` | Stripe says declined; our order stays "Waiting for payment"; an hour later `expired` (T2.1-09) | |
| E-2 | 3-D Secure | card `4000 0025 0000 3155`, approve | paid as usual | |
| E-3 | Back from Stripe | press Stripe's back link | `/merch/?back=<order>`, the basket is back | |
| E-4 | Two taps, two tabs | tap Pay twice; open Pay in two tabs, pay one | one order per tap; the unpaid one expires (T2.1-03, T2.2-01) | |
| E-5 | A race in the cloud | from the session: 5 checkouts at once with one nonce (curl, no Origin; with the test token: `-H "X-Merch-Test-Token: $(node -p "require('$TMPDIR/dd-merch-test-build/test_cfg.json').token")"`, without it each answers 403 `test_only`) | one order, one Stripe session (third review, could-not-check 3: the Durable Object's input gate under workerd) | |
| E-6 | Day cap | dashboard: `MERCH_DAY_CAP` = the day's paid count; pay again | 409 "We've made all we can for today"; an open session still honoured (T2.2-11). Put it back after (our next deploy also does) | |
| E-7 | A lost webhook | Stripe: disable the endpoint; pay; wait 2 h; enable it | the order page waits; at `expires_at + 1 h` the ledger asks Stripe and the order is paid (T2.2-27) | |
| E-8 | An event twice | Stripe: an event of E-7, **Resend** | 200, nothing changes (T2.1-24, T2.1-25) | |
| E-9 | Radar | card `4000 0000 0000 4954` (highest risk) | blocked; no paid order | |
| E-10 | Resting | dashboard: add `MERCH_OFF` = 1; try to pay; open a paid order | Pay refused kindly; the order page "resting"; then remove `MERCH_OFF` | |
| E-11 | Stripe facts | Stripe, Workbench / Logs, the requests of E-4 and E-8 | record: a replayed Idempotency-Key, any error on a key reused with other parameters (PART3 box: idempotency) | |

### D5. Cancel and refunds

| # | What | How | Expected | Result |
|---|---|---|---|---|
| R-1 | Cancel in the hour | the order page, Cancel | `cancelled`, everything refunded with shipping, the draft deleted, "Put these back in my basket" (T2.1-18) | |
| R-2 | Cancel at minute 59 | Cancel about 59 min after paying | cancelled, never past the draft (T2.2-40) | |
| R-3 | Cancel too late | Cancel at 63 min | "Printing has started..." (409 `too_late`) | |
| R-4 | Owner refunds one line | `merch.sh refund <order> <line> 1 "test"` | a partial refund in Stripe; "Refunded $X for the ..."; `GET /v1/refunds` shows our `merch_refund` metadata (PART3 box) (T2.1-21) | |
| R-5 | The last item refunded | `merch.sh refund` the other lines | shipping refunded too; `refunded` (T2.1-22) | |
| R-6 | Dashboard partial refund | Stripe: refund $5 on a paid order | the order's refunded total; the report lists it as not tied to a line (T2.2-19) | |
| R-7 | Dashboard full refund | Stripe: refund all on a paid order | `refunded`, draft deleted (T2.2-20) | |
| R-8 | Refund before `completed` | disable the endpoint; pay; refund all in Stripe; enable; Resend `charge.refunded`, then `checkout.session.completed` | `refunded`, nothing rendered or drafted (T2.2-18); proves the session lookup by payment intent (PART3 box) | |
| R-9 | Partial refund before `completed` | as R-8 with $5 | `held review` (`dash_refund`); a day later the rest refunded | |
| R-10 | Refund fails at the bank | card `4000 0000 0000 5126`; cancel in the hour | the refund fails later; `refund_failed`, an owner email; **record the event's name** (T2.2-43; PART3 box and question 10) | |
| R-11 | Refund refused for good | refund a line in Stripe, then `merch.sh refund` the same line | Stripe refuses; the row `failed`, owner email `refund_refused`, never retried; a full refund capped at what is left (T2.2-42) | |
| R-12 | Refund of a converted payment | `merch.sh refund` a line of Z-2 | yen back at the same rate (not-verified 3) | |
| R-13 | Expire a paid session | if a cancel ever meets a session that just completed (Stripe logs) | record Stripe's answer (PART3 box: T2.1-19); else "not met" | |

### D6. The printer (run 1: the stand-in, by the shipping name on Stripe's page; run 2: the real one)

The names work in any case and spacing, but only as the whole name. Run 1: `merch.sh show` starts with `"printer": "STAND-IN ..."`.
**Run 2 (the real Printful key) starts only after every run-1 order has ended** (`merch.sh orders`: none `paid`, `held`, `confirming` or
`confirmed`; refund or cancel what is left), so nothing drafted by the stand-in is tried again at the real Printful. How the ledger tells
them apart (fourth review): each order keeps which printer made its draft, `provider` = `stand-in` or `printful` (`merch.sh show`, in the
order). And a guard: once a real key is set, a `stand-in` draft is never read, deleted or cancelled at Printful (no call is sent; a delete
is only forgotten here, event `stand_in_draft`; a read counts as failed, so the owner hears after 24 hours). The stand-in's ids (931000xx)
could be a real Printful order's id, which is why the guard looks at `provider`, never at the number.

| # | What | How | Expected | Result |
|---|---|---|---|---|
| F-1 | Address refused | name "Test Refuse Address" | `held address`; "We need your address"; the form on the order page (type another name there: the same name is refused again); a good fix: back on track, then `held draft_mode` (T2.2-36, T2.1-29) | |
| F-2 | Address in another country | in the F-1 form, another country; then "Refund me instead" | 400 `other_country`; refunded in full (T2.2-37) | |
| F-3 | One line refused | name "Test Refuse Tee", a mug + a tee | the tee rejected and refunded, the mug drafted; "Sorry, we couldn't make the ..." (T2.2-32) | |
| F-4 | Every line refused | name "Test Refuse All" | all refunded with shipping (T2.2-33) | |
| F-5 | Printer down | first one order with any name (drafted); then name "Test Printer Down"; within 30 minutes cancel the first one. Run it alone: while down, every order waits | the stand-in is down for 30 minutes: retries at 1, 5, 15 and 60 minutes; drafted on the try about 81 minutes in, then `held draft_mode` (not `held provider`: the outage ends inside the hour, C2); the cancel refunds at once and the draft delete is retried, done after the 30 minutes (T2.2-34, T2.2-41) | |
| F-6 | A file problem | name "Test Refuse File" | retried as "down", never a buyer email; past the hour `held provider`; at 24 h the owner email about the print file; end it with `merch.sh refund` | |
| F-7 | (run 2) the key-day kit | `node tools/merch_pf_check.mjs` dry, then `--run --file-url <a P-5 link>` | 10 steps recorded under `test/printful/recorded/`; fixtures replaced where they differ; suites green | |
| F-8 | (run 2) a real draft | one mug + one tee, the real key | a draft in the Printful test store, not charged; costs within 10% of `cost_est` (else `held review`, T2.2-39); Printful fetched our file | |
| F-9 | (run 2) a real address refusal | an address Printful cannot use (to choose with the kit's address probe) | record Printful's text; `held address` | |
| F-10 | (run 2) cancel deletes the real draft | R-1 with the real key | gone in Printful's dashboard | |
| F-11 | (run 2) the webhook | the kit's webhook step, `MERCH_PROVIDER_WEBHOOK_SECRET` set | one signed event accepted (200); a tampered one 401 | |

### D7. Disputes

| # | What | How | Expected | Result |
|---|---|---|---|---|
| D-1 | Dispute before confirm | card `4000 0000 0000 0259` | right after paying: `held dispute`, draft deleted, the email flagged; "Your bank is looking at this payment" (T2.2-22) | |
| D-2 | Won | Stripe: the D-1 dispute, counter it with the text `winning_evidence` | `won`; stays held; owner email; `merch.sh confirm` releases it to `draft_mode` (T2.2-25) | |
| D-3 | Lost | a second `0259` order; counter with `losing_evidence` (or accept) | `lost`; the draft gone; owner email `dispute_lost`; late cancel 409 (T2.2-26) | |
| D-4 | Inquiry | card `4000 0000 0000 1976` | `dispute = inquiry`, owner email, the order NOT paused (part 9 M3) | |
| D-5 | Inquiry to chargeback | if Stripe's sandbox can turn an inquiry into a dispute (to confirm), do it | `charge.dispute.updated` pauses it then; else "not reachable" | |
| D-6 | The flagged email | order again with the D-1 email | `held review`; refunded after 24 h (T2.2-52) | |
| D-7 | Dispute money | `0259` with `+location_JP` | record the USD amount and Stripe's dispute fee (not-verified 4) | |
| D-8 | Owner's answer | in Stripe, the evidence form | the print PNG (`merch.sh show` link) can be attached | |

### D8. Emails, the nightly job, the files (emails need A12)

| # | What | How | Expected | Result |
|---|---|---|---|---|
| M-1 | Each email kind that can happen | from the rows above: thank you, cancelled, refunded, refunded in full, couldn't make one thing, we need your address | each arrives once, from orders@doodledoggo.app, reply-to contact@ | |
| M-2 | Looks | open one of each in Gmail, Outlook and Apple Mail, light and dark | readable, money in ink, links work (PART6 part 9 line) | |
| M-3 | Sender name | look at the From line | decide: "Doodle Doggo <orders@doodledoggo.app>" or as is (`MAIL_FROM`) | |
| M-4 | Tracking off | hover a link | the plain order link, not a tracking address | |
| M-5 | SPF and DKIM | Gmail, Show original | both pass | |
| M-6 | Owner emails | D-1, R-10, R-11, `merch.sh nightly` | to `MERCH_OWNER_TO`, no buyer data, the `merch.sh` command in each | |
| M-7 | Stripe's own receipt | Stripe: a payment, Send receipt (sandboxes may not send it by themselves: to confirm) | record its currency (not-verified 5) | |
| M-8 | Without Resend (run 1 if no key) | `merch.sh show` | the email rows: kind, `failed`, `not_set_up` | |
| N-1 | Nightly | `merch.sh nightly`; then wait for 04:10 JST | the report (held, disputes, refunds, Browser Run use); the cron ran (Worker, Logs) | |
| N-2 | Browser budget | many tees in one day | past 60 s billed: resvg draws, the owner told once (`browser_off`) | |
| N-3 | Export and forget | `merch.sh export`; `merch.sh forget email:<a test email>` | JSON lines with no buyer data; the email's orders cleared | |

### D9. What a sandbox cannot reach (and where it is covered)

| Path | Why not | Covered by |
|---|---|---|
| Confirm, production, parcels, "On its way", delivered (T2.1-12 to -17) | the test Worker never confirms | suite T2.1-12..17; part 10 samples and live dry run |
| Refund after shipping, a reprint, a lost parcel, a returned parcel and the 7-day reship refund (T2.1-23, T2.2-44, T2.2-45) | no parcels in draft mode; seven real days | suite rows, F9b-*; part 10. Reachable: `merch.sh reprint` and `lost` on a draft order answer 409 (check it) |
| A dispute after confirm or shipping; a Dashboard refund after confirm (T2.2-23, T2.2-21) | no confirm | suite; part 10 |
| The delay email, "Keep waiting", the late cancel and its pending case (T2.1-30, -31, -34) | seven working days | suite (T2.1-30..36, F9b-*). Reachable: `POST /merch/order/<id>/wait` and `cancel {scope:'late'}` answer 409 `not_late` (check it) |
| Delayed payment methods (T2.1-07, T2.1-08) | cards and wallets only at launch | suite; optional: turn on a delayed method in the sandbox |
| Printful's webhook retries (do repeated 502s switch a webhook off?), and a lost `package_returned` on a shipped order (third review, could-not-check 1) | needs real shipped orders | ask Printful support with the key (run 2); the daily re-read covers shipped orders only with a reship hold: a known gap |
| The order in which Printful lists shipments (could-not-check 2) | needs a real order with two parcels | part 10 (a mug + a tee sample order) |
| The two Browser Run 429 texts | the run never spends the day's 10 minutes | stays open (PART4 results 6, 7) |

### Boxes this run ticks

- **PART3 "To verify in the Stripe sandbox"**: USD amounts with Adaptive Pricing (Z-2, Z-4, Z-6); line order (P-2); `collected_information`
  (Z-10); sessions by payment intent (R-8); refund metadata on the list (R-4); the refund-failure event name (R-10); idempotency (E-11); expiring
  a completed session (R-13); the Terms URL (A3, S-6); Adaptive Pricing for a HK account (A4, Z-2) and partial refunds at the rate (R-12);
  `[env.test]` inheriting (answered in part B).
- **TRANSACTIONS 3.1 not verified**: 1 (A4), 2 (Z-2, Z-6), 3 (R-12), 4 (D-7), 5 (M-7), 6 (A6 + Z-2: methods set in the dashboard, conversion still
  offered), 7 (Stripe's fee on Z-2 in the payment's details).
- **TRANSACTIONS 6.7 not verified** (Printful): run 2, F-7 to F-11.
- **PART6 part 9 lines**: Resend domain and tracking (A12, M-4, M-5), the fragment in `success_url` (S-6), the sender name (M-3), one email of each
  kind in three mail apps (M-1, M-2).
- **Third review, could not check**: 1 and 2 (D9), 3 (E-5).

---

## E. Afterwards

- **Switch it off at once** (any of these, fastest first): Cloudflare dashboard, Workers & Pages, `doodle-doggo-merch-test`, Settings, Variables
  and Secrets, add `MERCH_OFF` = 1 as a Secret (no new checkouts; paid test orders finish); or Settings, Domains & Routes, remove
  `merch-api-test.doodledoggo.app` (nothing answers; Stripe retries its events for a while (3 days in live mode, fewer in a sandbox: to confirm), then stops); or Stripe, the webhook, Disable, and the
  restricted key, Roll or Delete (no new sessions).
- **Stays up until part 10's live dry run passes, shut**: the test Worker with `MERCH_OFF` = 1, for a second run after any fix. Its cron keeps
  using 1 of the 5. **The stand-in off** (run 2): set the real `MERCH_PROVIDER_KEY` (the stand-in is then never used), or redeploy without
  `MERCH_TEST_PRINTER=1` (the binding goes; the printer Worker stays, idle, until it is deleted). The Stripe account stays: it becomes the real merch account when the owner activates it (sandbox data stays apart).
- **Deleted after the live dry run**: first `merch.sh export` (kept outside the repo); then the test Worker (Settings, Delete: its Durable Objects
  and their data go with it, the cron slot frees; check that the Custom Domain went too), then the stand-in printer Worker
  `doodle-doggo-merch-test-printer` (Settings, Delete; after the test Worker, which binds to it; its Durable Object `TestPrinter` and its made-up
  drafts go with it), the sandbox's webhook
  endpoint and restricted key, the test Resend key, the Claude secure-form secret for `merch-api-test.doodledoggo.app` (environment settings), and
  the merch page from the test copy if the GM wants it out (or it stays for the next round).
- **Kept in the repo**: this file with the results filled in, the re-recorded Printful fixtures (run 2), and any fix the run asks for.

---

## F. For the Game Manager

### The shared-file changes, as a brief (the GM's files; MERCH has changed none of them)

**G1. `tools/cf_test.js`: put the merch page into the test copy, opt-in.** A new `--merch <dir>` (or `MERCH_PAGE=<dir>` passed by
`tools/cf_test_deploy.sh`), pointing at a checkout of `merch/shop` (the page is not on `main`). Without it the test copy is exactly as today.
With it, add to the files:
- `site/merch/**` at `/merch/...`: `index.html`, `api.js`, `api_fake.js`, `mock.js`, `merch.js`, `merch.css`, `legal.css`, `catalog.json`, the
  `terms/`, `shipping/`, `seller/`, `tokushoho/` pages, and every `print/<ART_VER>/` folder;
- the site files the page loads, at their root paths: `style.css`, `js/site.js`, `img/logo.svg`, `img/art/washi.svg`, `doodle-doggo-icon.svg`,
  `favicon.svg`, `icon-32.png`, `icon-180.png`, `fonts/caveat.woff2`, `fonts/patrick-hand.woff2`, `fonts/dd-code.woff2`. **Stop if the game build
  already has a different file at one of these paths** (no silent overwrite).
- The header's links to `/about`, `/dogs` and so on 404 on the test copy: fine for a test.
- Size: about 0.4 MB gzip more (PawPrint is 266 KB gzip), under the 9 MB check.
- Optional: `/merch/*.js` and `.css` as `private, no-store` while the run lasts (today non-hashed files get an hour, so a fixed `merch.js` could
  look stale until a hard reload).

**G2. `tools/test_gate.mjs`: two small rules, plus tests in `test_gate`.**
- A folder path serves its `index.html`: `/merch/` -> `/merch/index.html`, `/merch/terms/` -> `/merch/terms/index.html` (today only `/` does), and
  `/merch` (no slash) answers 301 to `/merch/`. Stripe returns buyers to `/merch/?new=1#/order/<id>` and to `/merch/?back=<order>`.
- A second CSP for paths under `/merch/`: `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:;
  font-src 'self'; connect-src 'self' https://merch-api-test.doodledoggo.app; frame-ancestors 'none'; base-uri 'none'; form-action 'self'`. The page
  has no inline script; going to checkout.stripe.com is a top-level navigation, which CSP does not limit. The game's CSP stays as it is.
- (Known, no change needed) the gate's 30-day `dd_test` cookie is SameSite=Lax, so it is sent when Stripe sends the buyer back. A link opened in a
  browser without the cookie loses its `#/order/<id>` part at the password page: testers open email links in the logged-in browser.

**G3 (fourth review, R4-m4). The test token file, behind the password.** The test Worker is public, so it takes an order, an order-page
button or an unsigned printer hint only with a shared token in the header `X-Merch-Test-Token`. The merch build makes the token and writes
it to `<build folder>/test_cfg.json` (`{"token":"..."}`; default folder `$TMPDIR/dd-merch-test-build`, printed by
`tools/merch_test_deploy.sh`); the page (`site/merch/api.js`) reads `/merch/test_cfg.json` once, only on https://test.doodledoggo.app, and
sends the header on every POST. What G1/G2 need to add:
- G1 (`tools/cf_test.js`): with `--merch <dir>`, also `--merch-cfg <file>` (or `MERCH_TEST_CFG=<file>`): that file served at
  `/merch/test_cfg.json`, as it is. Check it is JSON with one `token` of 32-128 letters, numbers, `-` or `_`, and refuse anything else. No file
  given: leave the path out (the page then sends no token, and the test Worker answers 403 `test_only` to a checkout: safe, but the run stops).
  The token is a test value, not a key: it may sit in the test copy's upload, never in the repo or the live site.
- G2 (`tools/test_gate.mjs`): `/merch/test_cfg.json` only behind the password like every other path (no exception for it), with
  `cache-control: private, no-store`, plus a `test_gate` row: without the cookie it is the password page, never the file. The merch CSP of G2
  is enough (`connect-src 'self'` covers the file; the header is allowed by the test Worker's CORS).
- When the merch test Worker is rebuilt into another folder (a new token), the test copy is deployed again with the new file. The same
  folder (or `MERCH_TEST_TOKEN=<it>`) keeps the token, so the usual redeploys need nothing.

**G4. `tools/cf_test_deploy.sh`: no change** beyond passing G1's options. Its deploy needs the owner's go-ahead as always.

**Not needed**: no change to `cloudflare/worker.js`, `cloudflare/schema.sql`, `site/tpl/*`, the live site build or the game. The merch test Worker
is deployed by `tools/merch_test_deploy.sh` (merch file), not by any `tools/cf_*` script. When the GM merges `merch/shop` work for the run: C1, P1,
P2 and C2 each come with their own review report.

**Order for the GM**: MERCH builds C1, P1, P2, C2 (one batch, one review) -> GM merges G1-G3 -> the owner's go-ahead (Q1) -> MERCH runs the merch
test Worker deploy -> the owner sets the secrets -> GM deploys the test copy -> the run (owner and MERCH; results filled into part D).

### Questions for the owner (for the choice window; recommendation first)

**Q1. May we put the merch test shop online behind the test copy's password?**
- **Yes, once the fixes listed in SANDBOX.md part 0 are done and checked (recommended).** A private test server (merch-api-test.doodledoggo.app) on the free plan and
  the shop page on test.doodledoggo.app. It costs nothing, uses 1 of your 5 Cloudflare timers while the test lasts, and can only take Stripe
  test money.
- Not yet.

**Q2. The printer in the first test run** (you said "not yet" to the Printful key)
- **A pretend printer first, your Printful key later for a short second run (recommended).** We can test all of the paying, refunds and disputes
  now; the second run checks the real printer.
- Wait for the Printful key and do one run.

**Q3. Order emails in the test**
- **Yes: make a send-only Resend key for the test (about 3 minutes, free); the emails come to your own inbox (recommended).**
- Not in the first run: we only check the list of emails in the order log.

**Q4. Who taps Pay in the test orders?**
- **You, on your phone or computer, with Stripe's test card numbers: about 45 short test orders over two or three sittings of about an hour; no real
  money (recommended).**
- Claude tries to fill in Stripe's test page from the cloud session (needs more network access, and Stripe may stop robots).

### The owner's answers (25 Nov 2026, 18:08 JST, in the choice window)

- Q1: **Yes** (once the last wiring is checked).
- Q2: **A pretend printer first**; the Printful key later for a short second run.
- Q3: **Yes, with a Resend key.**
- Q4: **Claude tries all of them** (the least sure way: if Stripe's pay page stops the cloud session, ask the owner again with the
  mix or the by-hand option). Step 14 in part A is then ours, not the owner's.
