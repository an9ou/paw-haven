# "My dog" merch: money and orders (design, 24 Nov 2026)

Status: a design only. No code, no deploys. Every Worker, Stripe or money step below needs the owner's approval (CLAUDE.md, V224.md).
Because merch is a big new paid feature, it counts as a **special update**: it waits for the owner's explicit go-ahead and launch date, and
the 5-minute rule does not apply to it.
Inputs: V224.md 4 (Kind shop), `cloudflare/worker.js` (`/shop/*`, `shopWebhook`, `limited()`, `corsFor()`, letters/Resend), `cloudflare/schema.sql`,
`docs/design/kind-shop-stripe-setup.md` (the Stripe account is registered in **Hong Kong** and the owner lives in Japan), PROMO.md, site/privacy.html.
`PROVIDERS.md` and `spike/SPIKE.md` were **not written yet** when I checked, at the start and again at the end. Provider facts marked
**PENDING PROVIDERS.md** come from Printful's public catalog and shipping pages (read 24 Nov 2026) and are placeholders. Rendering facts are marked **PENDING SPIKE.md**.

---

## 0. The one finding that shapes everything

The Kind shop's model **cannot be reused**. Stripe Managed Payments (Stripe as merchant of record) covers only digital products:
*"Managed Payments doesn't support non-digital product categories, including: Physical goods"* (docs.stripe.com/payments/managed-payments/eligibility,
read 24 Nov 2026). For a mug or a tee, whoever runs the checkout is the seller of record and carries the sales tax and VAT duties.

Stripe Tax only calculates and collects. *"Adding your registrations allows Stripe to calculate and collect the taxes you're responsible for
remitting"*. You register with each tax authority yourself (or use Stripe's paid "Register for me", which is US only, or Taxually outside the US).
*"You must file and remit the tax you collect for every location where you're registered"* (docs.stripe.com/tax/registering and
docs.stripe.com/tax/filing, read 24 Nov 2026). Stripe files automatically only in the US, plus non-Union OSS in Ireland and Canada GST.
UK VAT returns go through a partner (Taxually) or the seller's accountant. The price is 0.5% per Checkout transaction, and only where you are registered (stripe.com/tax/pricing).

---

## 1. Who is the seller, and which checkout

| | A. Our Stripe Checkout (we are the seller) | B. Merchant-of-record storefront (Fourthwall; Shopify + app) | C. The provider's own hosted checkout |
|---|---|---|---|
| Per-buyer unique art by API | yes: our file URL on each order | **Fourthwall: no.** Its docs say buyers *"cannot add individual names ... during checkout"* and *"Each unique item requires a separate product listing"* (fourthwall.com/llms-full.txt, read 24 Nov 2026). Its customization API is a design sketch tool at 5 requests a minute per shop. Shopify is not a merchant of record (Managed Markets needs a US/CA business and does not cover domestic sales) | no consumer checkout for API-made items at Printful or Gelato: PENDING PROVIDERS.md |
| Tax burden for a HK/JP individual | **on us**: see 1.1 | on them (Fourthwall uses Avalara for US sales tax and handles VAT) | n/a |
| Fees | Stripe HK: 3.4% + US$0.30, +0.5% for international cards, +2% when a currency is converted; disputes HK$85 (stripe.com/en-hk/pricing, read 24 Nov 2026); Stripe Tax 0.5% | 3.9% + $0.30 international processing plus the base cost | n/a |
| Control of the flow | full: our page, our recipe, our order page and emails | their store, their accounts, their brand | n/a |
| Chargebacks | ours (merch disputes run higher than digital ones: "not received") | theirs | n/a |
| Effort | medium: about Kind shop size plus a provider adapter | low, but it cannot do the product | n/a |

**Recommendation: A, our own Stripe Checkout, on a separate Stripe account** under the owner's existing login (Dashboard > New account,
the same HK business), without Managed Payments and with Stripe Tax turned on. Why a separate account:
1. Managed Payments requires *"a low historical dispute rate"* to stay eligible. "Not received" disputes on physical goods must never put the Kind shop at risk.
2. The live Kind shop webhook receives **every** `checkout.session.completed` and `charge.refunded` on its account. A merch session would
   fail `shopPaidCheck` and land in `shop_review` (worker.js line 991). A separate account keeps both Workers apart without touching the Kind shop.
3. It gets its own statement descriptor ("DOODLEDOGGO MERCH"), its own tax settings and its own keys.
Rejected: B, because it cannot print a unique dog per buyer, and that is the whole product. One account with a metadata guard is also rejected:
it works, but it changes the live Kind shop webhook and mixes dispute rates.

### 1.1 Tax burden under option A (individual or HK seller; to confirm with the owner's accountant)
- **USA.** A foreign remote seller is subject to each state's economic nexus. Most states use US$100k of sales a year; a few still count
  transactions too. At launch volumes no state is likely to be reached, and Stripe Tax's threshold monitoring watches this.
  Whether third-party print facilities create physical nexus is not settled; get the accountant's view. Practical effect today: **we register in no
  state and collect no US tax at launch.** Printful charges *us* sales tax on the wholesale cost in states where Printful is registered, unless we have
  a resale certificate, which needs a state permit (help.printful.com "How does sales tax affect me", read 24 Nov 2026). Model it as a cost (section 9).
- **UK.** An overseas seller is a non-established taxable person. *"The UK VAT registration ... thresholds do not apply to NETPs ... An NETP must
  register for VAT in the UK if they make any taxable supplies whatsoever"* (gov.uk HMRC manual VATREG37050, read 24 Nov 2026).
  If the goods are made in a UK facility, that is a UK supply. If they ship in from outside the UK at £135 or less, the overseas seller must also register and charge VAT at sale.
  So **the UK needs a UK VAT registration from the first order**, whatever the facility. After that: VAT returns (Making Tax Digital), 20% VAT
  inside UK prices, and the provider's UK VAT on wholesale is reclaimable once registered (Printful takes a VAT ID in Billing).
- **EU.** Goods printed in an EU facility (Printful: Latvia, Spain) mean VAT registration in the dispatch country, plus Union OSS for other EU
  buyers. Goods shipped in from outside the EU at €150 or less need IOSS, and a non-EU seller needs an EU intermediary (docs.stripe.com/tax/registering).
  Without IOSS the buyer pays import VAT and a carrier fee at the door. **No EU at launch.**
- **Japan or HK at home**: section 7.2. Income or profits tax on the margin applies either way.

**Consequence:** launch **US first**. Open **GB the day the UK VAT registration is active and added in Stripe Tax** (`MERCH_COUNTRIES`).

---

## 2. The order flow

**Cart: one item per order** (one dog, one product, one size or colour, quantity 1). Rejected: a multi-item cart, because of partial failures across items
(one printed, one rejected), combined shipping and split refunds. A second item is simply a second checkout.

```
game "Make it a mug" -> doodledoggo.app/merch#r=<recipe>   (the recipe stays in the URL fragment: no server sees it until a quote)
1  POST /merch/quote    {recipe, product, variant, country}      -> {price, currency, delivered: true, tax_note, eta_days} | closed | sold_out_today
2  POST /merch/checkout {recipe, product, variant, country, nonce, agree:true, lang}
     - validate everything again; check the cap, the kill switch, flags and the margin guard
     - insert merch_orders (status 'open', unique nonce)        -- a double tap returns the same url
     - render the print file -> R2 'pending/<order>.png' (PENDING SPIKE.md: at checkout if under ~5 s, else after payment)
     - Stripe POST /v1/checkout/sessions  (Idempotency-Key mc_<order>)
         mode=payment; line_items[0][price_data] {currency, unit_amount, tax_behavior, product_data{name, tax_code, metadata}}
         shipping_address_collection[allowed_countries][0]=<country of the quote>   (a US price can only ship to the US)
         phone_number_collection[enabled]=false          (PENDING PROVIDERS.md: on only if the provider or carrier needs it)
         automatic_tax[enabled]=true; payment_method_types: card (wallets come with it) -> no delayed payment methods
         consent_collection[terms_of_service]=required + custom_text "I am 18 or older and agree to the Terms of sale"
         client_reference_id=<order>; metadata[merch]=<order>  (never metadata[item]); expires_at = now + 1 h
         success_url https://doodledoggo.app/merch/order/<order>?new=1 ; cancel_url .../merch?back=1
     -> {url}
3  webhook checkout.session.completed (paid) -> re-read the session from Stripe (as V224 4.5), check amount/currency/order
     -> status 'paid', store amounts and country, move the file to 'orders/<order>.png', claim a gift code, email "Thank you"
4  provider: create the order as a DRAFT (external_id = order id, recipient from the Stripe session, file = signed URL) -> 'queued'
5  cooling hour: the cron confirms drafts whose cancel_until has passed -> 'confirmed' (the wholesale charge happens here)
6  provider webhooks (hints only; re-read the order from the provider API): in_production -> shipped(+tracking) -> email "On its way"
     failed | canceled | returned -> section 2.2
7  order page /merch/order/<id>: status, product picture, tracking link, gift code, Cancel (only before cancel_until), help email
```

**Emails.** Stripe sends its own receipt (turn on "Successful payments" in the merch account). We send the rest through Resend, as the letters do,
from `orders@doodledoggo.app` with reply-to `contact@`: "Thank you" (with the order page link), "On its way" (tracking), "We need your address",
and "Refunded". Each uses `Idempotency-Key me_<order>_<kind>`. The provider sends no customer emails (white label; PENDING PROVIDERS.md). The buyer's email
address is **read from the Stripe session each time a mail is sent, never stored**. We keep only a keyed hash.

### 2.1 Idempotency at every step
| Step | Key | Repeat behaviour |
|---|---|---|
| checkout tap | `nonce` unique in merch_orders; Stripe `mc_<order>` | same `url`, no second session |
| Stripe events | `merch_events.id = 's:'+event.id`, written after the work | no-op |
| status changes | `update ... where id=? and status in (<allowed from>)`; status only moves forward by rank | an older event changes nothing |
| provider create | `external_id = order id`; on a timeout, GET by external id before creating again | one provider order |
| provider confirm | only from 'queued'; the provider's confirm is idempotent | no second charge |
| refund | Stripe `mr_<order>_<n>` | one refund per decision |
| gift code | `merch_gift_pool.order_id unique` | one code per order |

### 2.2 When a step fails
| Failure | Money state | What happens |
|---|---|---|
| render fails at checkout | not paid | 503 `busy`, no session; the art error goes to the logs |
| render fails after payment (if rendering is moved there) | paid | retry for 1 h, then `needs_review` (the owner gets an email); 24 h without a fix -> automatic full refund |
| provider rejects the address | paid | `needs_address`; email with a link to fix it on the order page (the fix goes straight to the provider, not to D1); 7 days without an answer -> full refund |
| provider rejects the file or variant, or it is out of stock | paid | automatic full refund + a kind email; the variant goes `on=0` until the nightly check; the owner gets an email |
| wallet empty or card declined at confirm | paid | stays 'queued', retried every 10 min, the owner gets an email; after 72 h, `needs_review` |
| provider API down | paid | `next_try_at` backoff (1, 5, 15, 60 min ...) by the cron |
| `charge.refunded` before `completed` | refunded | as Kind shop v2.24.1: look up the session by payment_intent, write the order as refunded; the later completed event creates no provider order |
| dispute (`charge.dispute.created`) | disputed | `disputed_at`; a draft or queued order is cancelled at the provider; a shipped one stays and the owner answers in Stripe with the tracking; that email hash is blocked for merch |
| completed arrives twice | paid | event dedupe plus the status guard |
| provider events out of order (shipped before in_production) | - | status rank: shipped wins and in_production is ignored |
| session expired | not paid | `checkout.session.expired` -> 'expired'; the pending file is deleted by tidy after 2 days |

---

## 3. Money safety

- **Price list source of truth:** `cloudflare/merch/catalog.js` in the repo (retail price per variant group and region, tax code, provider variant id),
  changed only by a reviewed PR. D1 `merch_variants` holds the **live wholesale costs** and the `on` flag, written by the nightly job.
  The browser never sends a price. Sessions use inline `price_data`, so there are no Stripe Price ids to keep in sync. Rejected: Stripe Price ids
  as in the Kind shop's `SHOP_PRICES`; with sizes and regions that is dozens of ids to keep in sync and a `prev` list to manage.
- **Currencies: fixed USD for US buyers and fixed GBP for UK buyers**, at round, VAT-inclusive prices (UK consumer prices must include VAT).
  **Adaptive Pricing off** on the merch account while each region has one currency. Rejected: Adaptive Pricing alone, because buyers pay 2-4%
  more on a floating rate and a UK buyer sees odd pence (docs.stripe.com/payments/currencies/localize-prices/adaptive-pricing, read 24 Nov 2026).
  Later: EUR as its own fixed list. JPY only if Japan shipping opens. A GBP charge on a HK account costs us the +2% conversion: priced in (section 9).
- **US tax display:** prices are tax-exclusive (`tax_behavior: exclusive`). While no state is registered, Stripe Tax adds $0, and the page says
  "Shipping included. Any sales tax is shown at checkout." **UK:** `tax_behavior: inclusive`, VAT 20% inside the price.
- **Shipping: a delivered price per product and region** (shipping inside the price, one item). Rejected: live rates from the provider. They
  need more API calls, the price moves at checkout, and buyers trust "£22 delivered".
- **Margin guard:** `margin = net price - wholesale - shipping - provider tax - Stripe fees - reserve` (section 9). The floor is **US$4 and 20% of
  the net price**. A **nightly cron** reads the provider's variant and shipping prices, writes `merch_variants`, and turns any variant below the floor `on=0`.
  The owner gets an email with the list. At confirm, if the provider's draft cost is more than 10% above `cost_est`, the order goes to `needs_review`
  and is not confirmed automatically. The buyer is still served: the owner confirms it at a small loss or refunds it.
- **Wholesale payment:** a **prepaid provider wallet** topped up by the owner (PENDING PROVIDERS.md: Printful has a wallet). The balance is the
  spending cap. Rejected: a card charged per order, because nothing stops a bug or a flood from spending without a ceiling.
- **Fraud:** Stripe Radar default rules. Block when the CVC fails, and when the risk level is highest. An email hash or IP in `merch_flags` is refused.
  More than 3 orders per email hash in 24 h goes to review. No billing-address check: gifts to another address are normal.
- **Caps and switches (Worker vars, like `BT_FROM` and `LETTERS_FROM`):** `MERCH_FROM` (the launch time; '' keeps the shop shut),
  `MERCH_OFF=1` (no new checkouts; webhooks and paid orders still finish), `MERCH_COUNTRIES=US` then `US,GB`, `MERCH_PRODUCTS`,
  `MERCH_DAY_CAP` (paid plus open orders per UTC day; 10 at soft launch, then `sold_out_today`), `MERCH_PROVIDER_MODE=draft|live`
  (draft never confirms), `MERCH_COOL_MIN=60`.
- **Test mode end to end:** the merch Stripe account's **sandbox** keys plus the provider in **draft mode**, on a separate Worker environment
  `doodle-doggo-merch-test`. **Merch gets a sandbox on test.doodledoggo.app**: test keys cannot take real money. The game's own
  payments-off rule (`window.__ddNoPay`, the `/shop/checkout` refusal) stays unchanged. The live merch Worker refuses the test origin, as `TEST_ORIGIN` does today.
  Tests: suite `merch_worker` (local D1, Stripe and provider faked through `STRIPE_FETCH` / `PROVIDER_FETCH`, every row of 2.2).

---

## 4. Refunds, cancellations, reprints, chargebacks

**Policy text (plain words, for /merch/shipping):**
> Every item is printed just for you with your own dog, so we can't take it back if you change your mind. You can cancel for a full refund
> within **1 hour** of ordering, from your order page. If it arrives damaged or misprinted, or never arrives, email us within **30 days** of delivery
> (or of the latest delivery date we gave you) with a photo, and we'll reprint it or refund you, whichever you prefer. This doesn't affect your
> legal rights.

- **UK:** the 14-day cancellation right does not apply to *"goods that are made to the consumer's specifications or are clearly personalised"*
  (Consumer Contracts Regulations 2013 reg. 28(1)(b), legislation.gov.uk/uksi/2013/3134/regulation/28, read 24 Nov 2026). The buyer must be **told
  before ordering** that there is no right to cancel (Schedule 2). Faulty goods keep Consumer Rights Act 2015 remedies (repair or replace, refund). EU: CRD art. 16(c) is the same exception.
- **US:** no federal change-of-mind right. The FTC Mail, Internet or Telephone Order Merchandise Rule (16 CFR 435) requires us to ship within the
  time we state (or 30 days), and on a delay to tell the buyer and offer to cancel with a prompt refund (ftc.gov business guide; to verify at build).
  So the page states the delivery estimate, and the cron emails a delay offer when an order is not shipped by `eta + 5 days`.
- **Who clicks what:**
  - Cancel within the hour: **the buyer**, on the order page. The Worker refunds through the Stripe API (the restricted key needs Refunds write) and deletes the provider draft. No owner action.
  - Defect or lost parcel: **the owner** files the claim in the provider dashboard (reprint; PENDING PROVIDERS.md: claim window and who pays),
    or refunds in the **Stripe Dashboard**. The Worker follows: `charge.refunded` sets `refunded` (amount, partial or full); a reprint is recorded by
    `bash tools/merch.sh reprint <order> <provider order id>`, which adds a `merch_events` row. A provider webhook for an order with an unknown
    external id is attached by its `-r1` suffix.
  - Chargeback: **the owner** answers in Stripe with the tracking and the delivery scan (the order page has both). The Worker only marks and blocks.
- **Reprint reserve:** 5% of wholesale set aside per order (section 9). Reprints for the provider's own errors are usually free (PENDING PROVIDERS.md).

---

## 5. Data and privacy

**Newly held, and by whom:**
| Data | Stripe | Provider | Our D1 |
|---|---|---|---|
| name, shipping address | yes | yes (to print and ship) | **no** |
| email | yes | **no** (not sent unless required) | HMAC hash only (`MERCH_HASH_KEY`) |
| phone | only if turned on | only if required | no |
| card | yes | no | no |
| dog recipe, optional 20-character name | metadata: order id only | the print file | yes |
| country, amounts, status, tracking URL | yes | yes | yes |

- **Retention.** Order rows: 7 years, for tax records (HK keeps business records 7 years; a Japanese blue-return filer keeps books 7 years: to confirm).
  `email_hash`, `user_id` and the recipe's free name are cleared **24 months** after delivery. Print files are deleted from R2 **90 days** after
  delivery, refund or cancel (a reprint later re-renders from the recipe plus `art_ver`). `merch_events` are kept 90 days.
- **Deletion on request** (contact@): clear the hash, the name and the user link at once. Ask the provider to delete the recipient (PENDING
  PROVIDERS.md). Stripe keeps its records as the law asks, and the privacy page says so, as it does for the Kind shop.
- **Processors for /privacy:** Stripe (payment, address, email), the print provider and its carriers (name, address), Cloudflare (D1, R2), Resend (order emails).
- **Children:** the game is family-friendly, so **an adult must buy**. The merch page says: "Grown-ups only. You must be 18 or over to order. If
  you're younger, ask a parent or carer to order for you." Stripe's required consent box carries the same line. In the game the button keeps the Kind
  shop's "Ask a grown-up". The game never sends anything but the recipe.
- **GDPR / UK GDPR:** offering goods to UK (later EU) people brings an overseas seller into scope (Art. 3(2)). Lawful basis: the contract.
  Ask the advisor about a UK GDPR Art. 27 representative; the "occasional, low-risk" exemption may apply. The same question already exists for UK game accounts.
- **Account: guest checkout (recommended).** The recipe arrives in the link from the game, so no login is needed. Rejected: requiring a cloud
  account, which would cost sales and push the game's account email into a money flow. A signed-in player gets nothing extra beyond the gift code below.

---

## 6. Tables, routes, files

**Separate Worker `doodle-doggo-merch`** with its own D1 `ddmerch` and R2 bucket `dd-merch-prints`, served at `merch-api.doodledoggo.app`
(a Workers Custom Domain, like `tools/cf_api_domain.sh`). Rejected: adding the routes to `pawhaven-api`. That keeps money and addresses out
of the game-save Worker, gives separate secrets and deploy approvals, and means a merch bug cannot break saves.

```sql
create table merch_orders (
  id text primary key,            -- 'mo_' + 22 base64url (random 128 bit): also the order page key
  nonce text unique,              -- the page's tap id (double tap)
  created_at integer, updated_at integer,
  status text,                    -- open|expired|paid|needs_address|needs_review|queued|confirmed|in_production|shipped|delivered|cancelled|refunded|failed
  product text, variant text, region text, country text,
  recipe text,                    -- the validated recipe JSON (<= 1 KB)
  art_ver text, file_key text, file_sha text,
  currency text, amount_total integer, amount_tax integer, cost_est integer,   -- minor units; cost_est in USD cents
  stripe_session text unique, payment_intent text,
  provider text, provider_order text, provider_cost integer,
  carrier text, tracking_url text,
  email_hash text, user_id text, gift_code text, lang text,
  cancel_until integer, refunded integer default 0, refunded_at integer, disputed_at integer,
  tries integer default 0, next_try_at integer, last_error text
);
create index merch_orders_pi on merch_orders (payment_intent);
create index merch_orders_due on merch_orders (status, next_try_at);
create index merch_orders_email on merch_orders (email_hash);
create table merch_events (id text primary key /* 's:'+stripe id | 'p:'+provider id or sha256(body) | 'x:'+admin */, order_id text, type text, at integer, note text);
create table merch_variants (id text primary key, product text, region text, provider_variant text, cost_base integer, cost_ship integer, cost_at integer, on_flag integer);
create table merch_gift_pool (code text primary key, order_id text unique, claimed_at integer);  -- loaded from tools/promo.sh batch MERCH ...
create table merch_flags (key text primary key /* 'e:'+email hash | 'ip:'+addr */, mode text, note text, created_at integer);
create table rate (k text primary key, n integer, reset_at integer);   -- the same limiter as pawhaven-api
```

| Route | Auth | Limits | Notes |
|---|---|---|---|
| `GET /merch/catalog` | none | 120/h per IP | products, variants, delivered prices per region, `on`, countries, `sold_out_today` |
| `POST /merch/quote` | none | 60/h per IP | validates the recipe; no row is written |
| `POST /merch/checkout` | none | 10/h per IP, 3 open per email hash | as section 2; 503 `merch_closed`, 409 `sold_out_today`, 400 `bad_recipe` / `bad_name` |
| `GET /merch/order/:id` | the id itself | 120/h per IP | status, product, tracking, gift code; never the address or the email |
| `POST /merch/order/:id/cancel` | the id | 10/h | only before `cancel_until` and only from open, paid or queued |
| `POST /merch/order/:id/address` | the id | 10/h | only in `needs_address`; forwarded to the provider |
| `POST /merch/webhook/stripe` | Stripe-Signature (`MERCH_STRIPE_WEBHOOK_SECRET`), 300 s window, raw body first | - | completed, async_payment_succeeded/failed, expired, charge.refunded, charge.dispute.created/closed; paid events re-read from Stripe |
| `POST /merch/webhook/provider` | provider signature if any (PENDING PROVIDERS.md) | - | **a hint only**: the Worker re-reads the provider order before changing anything |
| `GET /merch/file/:order/:exp/:sig.png` | HMAC (`MERCH_FILE_KEY`) over order+exp | - | streams from R2; links last 30 days; the provider fetches it once |
| cron `*/10 * * * *` | - | - | confirm after the cooling hour, retries, delay emails, expiries; nightly at 03:17 UTC: margin check and tidy |

CORS: `https://doodledoggo.app`, `https://www.doodledoggo.app`, localhost. The test Worker allows only `https://test.doodledoggo.app`.
Webhooks send no CORS headers. Cron triggers: the account has 2 in use; this adds 1 or 2 (check the plan limit).

**Recipe** (the Dog Card dog shape, validated by the same rules as `dcDog()` in worker.js: breed, coat genes, never a double merle, eyes, pattern
seed, age, outfit index; plus `pose` and an optional `name`). The name is at most 20 characters: Latin letters including accents, digits, space,
`' - . & !`, and a blocklist. It is printed only as shown in the preview. A new `art_ver` is stored per order, so a reprint is pixel-identical.
**Print files:** rendered by our code (where it runs, and its CPU budget: PENDING SPIKE.md; a Worker is probably too small at 4500x5400,
in which case a render service sits behind `render(recipe, product) -> PNG`). Stored in private R2 and served by the signed route.
Rejected: rendering on every provider fetch, because of CPU limits, and a provider may fetch more than once.

**Provider adapter** (one file, `cloudflare/merch/provider_<name>.js`): `quoteCost(variant, country)`, `createDraft(order, recipient, fileUrl)`,
`confirm(id)`, `cancel(id)`, `get(idOrExternal)`, `parseHook(req) -> {id, hint}`, `catalogCosts()`. The status map lives in the adapter.

**Secrets (names only; the owner sets them in the dashboard):** `MERCH_STRIPE_KEY` (restricted: Checkout Sessions write, Refunds write, Charges and
PaymentIntents read), `MERCH_STRIPE_WEBHOOK_SECRET`, `MERCH_PROVIDER_KEY`, `MERCH_PROVIDER_WEBHOOK_SECRET` (if any), `MERCH_FILE_KEY`, `MERCH_HASH_KEY`,
`RESEND_API_KEY` (a send-only key for this Worker). Vars: the switches in section 3, `MAIL_FROM`.

---

## 7. Legal pages and site text

### 7.1 Pages (English only at launch)
- `/merch/terms`: Terms of sale. Seller identity, what you get, prices and taxes, the 18+ rule, the personalised-goods exception (stated
  **before** the Pay button as well), delivery estimates, the faulty-goods promise, governing law, contact.
- `/merch/shipping`: Shipping and returns. Countries, delivered prices, times, the section 4 policy text.
- `/merch/seller`: seller identification (7.2). `/privacy`: a new "Merch orders" section (section 5).
- On the page next to Pay (UK CCR Schedule 2): the total price including VAT and delivery, delivery times, "no cancellation after 1 hour
  because it is personalised", the seller's name, geographical address and email, and the complaint route.
- **Translation: English only at launch** (buyers are US and UK). The other 11 site languages get one translated line: "Merch ships to the USA and the
  UK for now, in English." Rejected: 12 languages at launch, which means translation cost and legal-text risk for markets we don't ship to. Add
  Japanese with Japan shipping.

### 7.2 What changes with the seller's country (slot in the answer)
| | Hong Kong (the current Stripe account) | Japan, individual business (個人事業主) |
|---|---|---|
| Stripe | HK fees above; payouts in HKD/USD | a JP account (new account, other fees); the Stripe account country cannot be changed |
| home sales tax | none | consumption tax: sales of goods made and delivered abroad are likely outside JCT (国外取引: confirm); JP buyers later would be domestic sales |
| seller ID on the site | trading name, HK Business Registration no., business address, email | **特定商取引法に基づく表記** (Act on Specified Commercial Transactions, art. 11): name, address, phone, price, payment, delivery, returns. An individual may show address and phone "on request without delay" only if the rules allow it (to verify on the 消費者庁 guide); Stripe JP asks for this page anyway |
| UK and EU | the same (overseas seller: NETP) | the same |
| income tax | HK profits tax (offshore question for the accountant) | business income on the 確定申告 (blue return: 7-year books) |
| UK E-Commerce Regs 2002 | a geographic address is needed: a business address or registered-office service | the same |

---

## 8. Launch in stages ([O] = the owner approves or does it)

0. **Decisions** [O]: section 10. The accountant's view on UK VAT, US nexus and the seller country [O].
1. **Sandbox build:** the merch Worker plus a test D1 and R2, provider draft mode, Stripe sandbox; suite `merch_worker` green. Deploy the test Worker [O, prompt].
2. **Sandbox end to end** on test.doodledoggo.app: card 4242, each product, cancel within the hour, refund before completed, provider rejects (faked), a dispute (test card).
3. **Samples** [O]: the owner orders one of every product and colour at wholesale through the provider dashboard (sample orders) to their own
   address, using production files from our renderer. They check crayon lines, colours, placement and the wash test.
4. **Live dry run** [O]: live keys, `MERCH_FROM` set, `MERCH_DAY_CAP=2`. The owner places one real US order to a friend's address and one order
   cancelled within the hour. Check the receipt, emails, the order page and the wholesale charge.
5. **Soft launch** [O, date; special-update rule]: **US** (plus **GB** if the VAT registration is active), **mug, tee and sticker sheet**
   (PENDING PROVIDERS.md), cap 10 a day, wallet US$150. A NEWS line in the game and a Marketing briefing only after the owner sets the date.
6. **Widen** [O each]: hoodie and tote, a higher cap, Canada and Australia after a tax check, EU after OSS/IOSS. The nightly margin report goes to the owner weekly.

**Only the owner can:** open the provider account, accept its terms and fund the wallet. Create the separate Stripe account (HK), turn on
Stripe Tax (head office address, default tax codes), add the GB registration once it exists, set Radar rules, turn on receipts, set the
statement descriptor, and create the webhook endpoint with the section 6 events. Get the tax registrations (UK VAT; US only if the accountant says so)
and, if needed, a business address service and a UK GDPR representative. Set every secret in the Cloudflare dashboard. Turn on R2. Add the
`merch-api` custom domain. Approve each deploy prompt. Place the sample and live-test orders.

---

## 9. Unit economics

```
P   = the price the buyer pays (gross, in USD at the day's rate)       T = VAT or sales tax inside P that we remit (UK 20/120 of P; US 0 unregistered)
W   = provider base + provider shipping                                  t_w = provider tax on W we cannot reclaim (US: ~7% placeholder; UK: 0 once VAT-registered)
f   = Stripe % (3.4 + 0.5 international + 2.0 if converted) * P + US$0.30   s = Stripe Tax 0.5% * P (only where registered)
r   = reprint reserve 5% * W            g = gift code (0)              o = fixed costs per order (accountant, UK VAT filing) = monthly fee / orders
margin = P - T - W*(1 + t_w) - f - s - r - o
```
Placeholders (**PENDING PROVIDERS.md**): Printful catalog API read 24 Nov 2026: 11 oz white mug US$6.07; Bella+Canvas 3001 tee S-XL US$11.92
(2XL +$2); shipping page: mug US $6.69 / UK $5.19, tee US $4.95 / UK $4.79. £1 = US$1.27. Retail prices are proposals.

| | Mug to USA | Mug to UK | Tee to USA | Tee to UK |
|---|---|---|---|---|
| price P | US$24.00 delivered | £20.00 incl. VAT = $25.40 | US$29.00 | £25.00 = $31.75 |
| tax T remitted | 0 | £3.33 = $4.23 | 0 | £4.17 = $5.29 |
| W (base + ship) | 12.76 | 11.26 | 16.87 | 16.71 |
| provider tax not reclaimed | 0.89 | 0 | 1.18 | 0 |
| Stripe f | 3.9% + 0.30 = 1.24 | 5.9% + 0.30 = 1.80 | 1.43 | 2.17 |
| Stripe Tax s | 0 | 0.13 | 0 | 0.16 |
| reserve r | 0.64 | 0.56 | 0.84 | 0.84 |
| **margin (before o and income tax)** | **$8.47 (35%)** | **$7.42 (35% of net)** | **$8.68 (30%)** | **$6.58 (25% of net)** |

At soft-launch volume, `o` dominates in the UK. An accountant at £40 a month over 20 UK orders is about $2.50 an order, so the UK opens only when
the expected volume or a price of £21/£26 covers it. A dispute costs HK$85 (about $11) plus the item: one dispute wipes out about one and a half orders' margin.

---

## 10. Open questions for the owner (recommendation first)

1. **Seller country and status?** Use the existing HK business with a new separate HK Stripe account for merch. Otherwise slot in 7.2.
2. **UK at launch?** Only if you register for UK VAT (an overseas seller must register from the first sale). If not ready: **US only first**, UK after.
3. **Currencies?** Fixed USD (US) and GBP (UK), Adaptive Pricing off. JPY and EUR later.
4. **Account or guest?** Guest checkout, with the recipe coming in the link from the game.
5. **Gift with each order?** Yes: a unique in-game gift code (cosmetic only, for example a "My Mug" bandana) from a pre-made PROMO batch, shown on the order page and in the email.
6. **Products at launch?** Mug, tee and sticker sheet (cheap to sample, sturdy prints). Hoodie and tote after samples. PENDING PROVIDERS.md.
7. **Cancellation window?** 1 hour, then printing starts.
8. **Free typed name on the item?** Yes, 20 characters, Latin only, with a blocklist. The alternative is the dog's in-game name only.
9. **Daily cap and wallet?** 10 orders a day and a US$150 wallet at soft launch.
10. **Order emails?** Ours through Resend (`orders@`) plus Stripe's receipt; the provider sends none.
