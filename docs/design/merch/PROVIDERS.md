# Print-on-demand for "print your own dog": provider research

Read on 24 Nov 2026 (every source below was read that day unless marked otherwise). The brief was re-weighted mid-task: buyers are mostly in the **USA and UK**. Providers are ranked by production inside the US and the UK first, then the EU. Japan is a secondary column.

How sources were read:
- **[fetched]**: I read the page myself.
- **[snippet]**: the page blocked automated fetching (HTTP 403/503). The fact comes from the search engine's extract of that page, so check it in the browser before relying on it.
- **[not verified]**: nothing found.
- Printful prices come straight from Printful's public catalog API (`https://api.printful.com/products/{id}`, no key needed) **[fetched JSON]**. They are USD, excluding tax and discounts.

---

## 0. Short answer

- **Primary: Printful.** It has its own US facilities and its own UK facility in Wolverhampton, which takes UK-addressed orders only. Its API docs describe exactly our flow ("customers specify their own designs ... every order is unique"). It also has:
  - draft orders that are not charged
  - a mockup task API
  - webhooks
  - per-order packing slips
  - a DPA (data processing agreement)
  - no monthly fee
  - prices that are public and stable
- **Backup: Gelato.** It has 39 production hubs in the US and Canada and 17 in the UK. The API comes with the free plan, and it has an `order_status_updated` webhook. However, its docs and price pages block automated reading, so its prices for our products are **not verified**. Mockups come only through "create product from template", not through a standalone call.
- **Prodigi** (UK in-house, plus US and EU) is the best third option for paper, stickers and mugs. It is the only one with a **real sandbox** (orders are neither charged nor printed).
- **Japan-local providers (SUZURI, pixivFACTORY, Canvath)**: leave for later. None has a verified public API for placing orders.
  - SUZURI's API can create designs and products, but the buyer must check out on suzuri.jp.
  - Printful already makes tees, sweatshirts, hoodies, 11 oz mugs, stickers and phone cases in Japan.
  - Acrylic stands and keychains are the only reason to add a Japanese provider later.
- **Tax trap, the most important finding.** Selling to UK consumers goods that are in the UK at the point of sale requires **UK VAT registration from the first sale, with no threshold**, for an overseas seller (GOV.UK). Printful's own 20% VAT charge does **not** cover it. Shipping into the UK from outside (≤ £135) also needs registration for direct website sales. **Plan for this before selling to the UK.**

---

## 1. Provider by provider

### 1.1 Printful (Latvia-headquartered; facilities in the US, Mexico, Canada, Spain, Latvia and the UK; partners in Japan, Brazil and Australia)

**API: order with its own print file**
- Items take a file **URL**: "the most convenient method is to specify the file URL". `external_id` links the order to our own order ID. [fetched https://developers.printful.com/docs/]
- v2 (labelled BETA, but "all presented endpoints can be used in a production environment"): items are `source: "catalog"` + `catalog_variant_id` + `placements[{placement, technique, layers[{type:"file", url}]}]`. [fetched https://developers.printful.com/docs/v2-beta/]
- The v2 docs describe our exact use: "This flow is intended if you allow your customers to specify their own designs which means that every order is unique." [fetched, same page]
- Store type: "Manual order / API store"; its products "won't appear on any website automatically". [snippet https://help.printful.com/hc/en-us/articles/23581702148764]

**Draft and test**
- Draft orders: "Orders with the draft status won't be charged". Either confirm later with `POST /orders/{id}/confirm`, or pass `confirm` to skip the draft step. [fetched v1 and v2 docs]
- **There is no sandbox.** v2 docs: "Create a separate store to test scenarios". [fetched]

**Mockups**
- v1 Mockup Generator: create a task, then fetch the result. v2: `mockup-tasks`, plus a `mockup_task_finished` webhook. Generation is asynchronous.
- Rate limit for creating mockup tasks: **2–10 per minute** (v1 docs). That is far too few to render a live preview for every player, so use our own in-browser preview and Printful mockups only for a final image. [fetched]

**Webhooks**
- Package shipped and returned; order created, updated, failed, canceled, refunded, put on hold and hold removed; stock updated. v2 adds request signing and expiring webhooks. [fetched]

**Rate limits**
- 120 requests per 60 s (leaky bucket: one request every 500 ms after a burst); 30 per minute unauthenticated. [fetched]

**Rules about designs**
- No rule against end-customer designs. The docs promote the flow. Printful's API page offers personalization tools that let "shoppers personalize their products directly on your storefront". [fetched https://www.printful.com/api]

**Branding**
- Per-order packing slip fields: `email`, `phone`, `message`, `logo_url`, `store_name`, `custom_order_id`. [fetched v2 docs]
- Custom inside labels are deprecated except for users from before April 2020. [fetched v1 docs]
- "20% off samples". [fetched https://www.printful.com/custom/mugs/white-glossy-mug]

**Products and base prices** (public catalog API, USD, size S–XL, front print) [fetched JSON]

| Product | Printful ID | Base USD | ≈ JPY at ¥155 | Made in (catalog `availability_regions`) |
|---|---|---|---|---|
| 11 oz White Glossy Mug (sublimation) | 19 | 6.07 | ¥941 | US, EU (LV, ES), CA, **UK**, **JP**, AU, BR |
| Unisex tee, Bella+Canvas 3001 (DTG / DTF) | 71 | 11.92 | ¥1,848 | US (83 colours), **UK** (46), EU (60), CA, **JP** (8) |
| Crewneck sweatshirt, Gildan 18000 | 145 | 19.17 | ¥2,971 | US, **UK**, EU, **JP** |
| Hoodie, Gildan 18500 | 146 | 22.63 | ¥3,508 | US, **UK** (14 colours), EU, **JP** (6) |
| Tote, Econscious EC8000 | 367 | 15.87 | ¥2,460 | US, **UK**, EU, CA (not JP) |
| Tote, Westford Mill W101 (cheaper) | 1553 | 10.18 | ¥1,578 | US, EU (not UK, not JP) |
| Kiss-cut sticker sheet, A5 (5.83″×8.27″) | 505 | 5.15 | ¥798 | US, **UK**, EU, CA, **JP**, AU |
| Kiss-cut sticker 3″ | 358 | 2.34 | ¥363 | US, UK, EU, JP, AU, CA |
| Clear iPhone case (UV print) | 181 | 9.57 | ¥1,483 | US, **UK**, EU, **JP**, AU |
| Enhanced matte poster 10″×10″ / A2 | 1 | 8.05 / 12.89 | ¥1,248 / ¥1,998 | 10×10: everywhere incl. JP; A2: US, UK, EU, CA |
| Wall calendar 2027, A4 | 1643 | 12.19 | ¥1,889 | **US only** |
| Acrylic **ornament** (closest item to acrylic) | 793 | 7.80 | ¥1,209 | US only |

- Printful has **no acrylic stand and no acrylic keychain**. It does have die-cut magnets and pin-button sets. [fetched catalog list]
- Billing currencies: USD, EUR, GBP, CAD and AUD. **JPY is not a billing currency.** Wallet top-ups are USD only; otherwise each order is charged to the card on file. [snippet https://support.printful.com/hc/en-us/articles/41396636624401 and https://help.printful.com/hc/en-us/articles/360014068899]

**Shipping (Standard, first item / each extra item, USD)** [fetched https://www.printful.com/shipping]

| | USA | UK | Europe | Japan | Brazil | Worldwide (incl. HK, TW, KR, TH, ID) |
|---|---|---|---|---|---|---|
| T-shirt | 4.95 / 2.20 | 4.79 / 1.50 | 4.99 / 1.45 | 4.95 / 2.00 | 12.49 / 6.00 | 12.49 / 6.00 |
| Hoodie / sweatshirt | 8.79 / 2.50 | 7.29 / 2.40 | 7.29 / 2.40 | 7.89 / 2.60 | 17.69 / 8.00 | 17.69 / 8.00 |
| Tote | 4.69 / 2.00 | 4.59 / 1.50 | 4.99 / 1.45 | 4.89 / 2.00 | 12.49 / 6.00 | 12.49 / 6.00 |
| 11 oz mug | 6.69 / 3.50 | 5.19 / 1.25 | 5.39 / 2.05 | 4.99 / 1.60 | 12.49 / 6.50 | 12.49 / 6.50 |
| Stickers | 4.49 / 0.05 | 4.29 / 0.10 | 4.29 / 0.10 | 2.99 / 0.08 | 8.29 / 0.25 | 8.29 / 0.25 |
| Small poster | 4.99 / 0.40 | 5.79 / 0.30 | 5.79 / 0.30 | 6.49 / 1.30 | 11.99 / 1.00 | 11.99 / 1.00 |
| Phone case | n/r | 2.59 / 0.90 | n/r | n/r | n/r | n/r |

- n/r: not read.
- Holiday surcharge: $0.40 on US addresses, 15 Oct 2026 – 17 Jan 2027.
- Fulfilment takes 2–5 business days. Standard delivery: US 3–4 business days; international 5–20 business days.
- The UK facility serves UK addresses only. UK delivery is about 2 business days. [snippet https://help.printful.com/hc/en-us/articles/5819467115548]
- Customs: "your customers might have to pay customs fees" when an order ships across regions. [fetched shipping page]
- Hong Kong, South Korea and Singapore orders are routed to Japan, about 5–9 business days. These are marketing pages and may be old. [snippet https://www.printful.com/print-on-demand-hong-kong]

**Print files** [snippet, Printful help and guides]
- At least 150 DPI for DTG; 300 DPI for paper, mugs and phone cases.
- Transparent PNG for DTG; sRGB IEC61966-2.1.
- Maximum 200 MB and 20,000 × 20,000 px.
- Exact pixel sizes per product come from `GET /mockup-generator/printfiles/{id}`. That endpoint needs a key (I got HTTP 401), so sizes are **not verified**.

**Tax charged to us**
- **US**: Printful charges sales tax on US-fulfilled orders to US addresses unless we hold an approved resale certificate, and a certificate needs a state sales-tax permit. The tax base is (Printful price + shipping + services) × rate. California, Massachusetts and Alaska use our retail price (California adds 10% to Printful's price if the retail price is unknown), so pass `retail_costs`. [snippet https://help.printful.com/hc/en-us/articles/360014009780 and /360014009920]
- **UK**: 20% VAT on orders fulfilled and shipped inside the UK, with or without a UK VAT ID. Printful is VAT-registered in the UK, Latvia and Spain. [snippet https://help.printful.com/hc/en-us/articles/4408221934738 and /360014009460]
- **Japan**: 10% consumption tax on orders fulfilled in Japan. [snippet, Printful Japan news / help]
- Printful: "the taxes we charge you as our customer don't replace the tax obligations you might have as a seller". [fetched https://www.printful.com/taxes-guide]

**Quality and returns**
- Damaged, misprinted or defective items: report within 30 days of delivery (or of the estimated delivery date if lost). Remedy is a free reshipment or refund, with no need to return the item.
- Buyer's remorse, wrong size and wrong colour are **not covered**.
- [snippet https://help.printful.com/hc/en-us/articles/50263870468753; https://www.printful.com/policies/returns fetched but empty]
- Independent: Trustpilot **4.1/5**, 8,019 reviews. Recent complaints: slow or rerouted shipping, prints smaller or cropped versus the preview, scripted support. [fetched https://www.trustpilot.com/review/printful.com; small visible sample]

**Data**
- Data Processing Terms v1.1, 12 Mar 2026: the merchant is controller, Printful is processor. Covers customers' name, email, phone and address. Sub-processor list available on request. [snippet https://www.printful.com/policies/data-processing-terms]

**Money**
- No monthly fee for the API; the API page lists no fee. [fetched https://www.printful.com/api]
- No business registration is mentioned anywhere I read. You enter "Legal info" in the dashboard. A company is **not verified** as required.
- **Printful Quick Stores**, where Printful is seller of record, is "only available for sellers and shoppers in the US". It is not for us. [snippet https://help.printful.com/hc/en-us/articles/50265790921617]

### 1.2 Gelato (Norway; network of partner printers)

Gelato's own site and docs return **HTTP 403** to automated fetching (gelato.com, dashboard.gelato.com/docs, developers.gelato.com). Only support.gelato.com could be read. Everything below that is not marked [fetched] is [snippet].

**API**
- `POST https://order.gelatoapis.com/v4/orders`; `orderType` is `order` or `draft` (default `order`); `PATCH` turns a draft into an order. [snippet https://apis.io/apis/gelato/gelato-orders-api/, which mirrors Gelato's OpenAPI]
- Items: `productUid`, `quantity`, `files:[{type:"default", url}]`. [fetched third-party example https://polotno.com/sdk/product/integrations/gelato]
- 100 requests per second, 429 when exceeded. [snippet https://connect-support.gelato.com/en/articles/11075645; note: that is the GelatoConnect product]

**Webhooks**
- `order_status_updated` carries tracking and production country, state and facility. There are also item status, tracking-code and delivery-estimate events.
- Three retries, 5 s apart. [snippet https://dashboard.gelato.com/docs/webhooks/]

**Mockups**
- No standalone mockup endpoint was found. `products:create-from-template` builds the product's mockups in the background. [snippet https://dashboard.gelato.com/docs/ecommerce/products/create-from-template/]

**Sandbox**
- Not found. Drafts are "never printed or charged". [fetched Polotno example]

**Production**
- 32 countries, including the **USA** (US and Canada: 39 hubs), the **UK** (17 hubs), Germany (8), **Japan**, South Korea, China, Singapore, Malaysia, Brazil and others. [fetched https://support.gelato.com/en/articles/8996076]
- Japan is **not** on the apparel production list. [snippet https://support.gelato.com/en/articles/8996105]
- About 85% of orders are made in the delivery country. [snippet]

**Plans**
- Free (€0); the API is included.
- Gelato+ costs $29.99 a month, or $19.99 a month billed annually. It gives up to 33% product discounts, premium mockups and branded packaging. [snippet https://support.gelato.com/en/articles/8996313]

**Prices: mostly not verified**
- Classic crewneck tee to the USA: $15.47 + $3.99 standard shipping (promotional page, undated). [snippet https://www.gelato.com/campaign/first-order]
- Unisex crewneck €18.09 ex-VAT; US shipping €4.21. [snippet]
- Phone cases "from $8.82". [snippet]
- Mug prices in USD or GBP: **not verified**.
- Gelato offers calendars, phone cases and acrylic **wall** prints. Stickers: **not verified**. Acrylic stands and keychains: not found.

**Tax**
- US: Gelato charges sales tax on deliveries to 43 states + DC ("registered in 44 states"). A resale certificate may exempt you. [fetched https://support.gelato.com/en/articles/8996155]
- UK: domestic 20% VAT. [snippet Brexit FAQ]

**Quality and returns**
- No returns for personalised items. Reprint or refund (Gelato's choice) for defects reported within 30 days of receipt, with photos.
- Screen-versus-print colour difference is not a defect. [snippet https://support.gelato.com/en/articles/8996072 and https://www.gelato.com/legal/api-terms]
- Independent: Trustpilot **4.2/5**, 3,489 reviews. Complaints: support is a chatbot loop that is hard to escape, tracking gaps, items out of stock per country with no reroute, dull mugs. [fetched https://www.trustpilot.com/review/gelato.com]

**Data**
- Processor under Data Processing Terms. API terms: "no direct agreement with End Customers". Transfers rely on the DPF or SCCs. [snippet https://www.gelato.com/legal/data-processing-terms, https://www.gelato.com/legal/api-terms]

### 1.3 Prodigi (UK)

**API (v5 and v4)**
- `POST /orders`; items carry `assets:[{printArea:"default", url}]`; optional `callbackUrl` per order; `idempotencyKey`. [snippet OpenAPI mirror https://apis.io/apis/prodigi/prodigi-orders-api/; example fetched at polotno.com]
- **Sandbox:** "a separate test environment where orders aren't charged or fulfilled". Keys start with `sandbox_`. [fetched http://www.prodigi.com/faq/print-api/]
- Rate limit: **1,000 requests per hour per key** (v5). Per-order callbacks exist; webhook subscriptions are "not available in v5 yet". [fetched, same page]
- Mockups: "generate product mockups directly through the API". Quotes cover price, shipping and tax. Drafts can be paused and resumed. [fetched https://www.prodigi.com/print-api/]

**Production**
- "In-house production facilities in the UK, EU and US", plus partners. [fetched https://www.prodigi.com/print-api/]

**Prices**
- 11 oz mug from **£3.54** wholesale, excluding tax and shipping. [snippet https://www.prodigi.com/products/home-and-living/drinkware/photo-mugs/]
- Other products: **not verified**. Prodigi is strongest in wall art, stickers and mugs; its apparel range was not checked.

**Money**
- Pay per order by card or PayPal. Invoicing (Direct Debit) is for eligible UK, EU and US merchants. Billing is in the facility's local currency, converted to your default. No monthly fee is listed. [fetched https://www.prodigi.com/faq/payments-and-pricing/]
- US sales tax is charged on US deliveries without a resale certificate. [snippet https://help.prodigi.com/support/solutions/articles/35000138812]

**Independent**
- Trustpilot **4.0/5**, only 149 reviews (20% are 1-star). Complaints: slow support, damaged frames and prints, missed dispatch dates. [fetched https://www.trustpilot.com/review/prodigi.com]

### 1.4 Printify (marketplace of print providers)

**API**
- Orders can create the product at submission: `blueprint_id` + `print_areas: {"front": "<image URL>"}`. Economy shipping cannot be used that way. [fetched https://developers.printify.com/]
- Webhooks: `order:created`, `order:updated`, `order:sent-to-production`, `order:shipment:created`, `order:shipment:delivered`, signed with `X-Pfy-Signature`. [fetched]
- Limits: 600 requests per minute global; 100 per minute catalog; publishing 200 per 30 min. Error responses must stay under 5% of requests. [fetched]
- No sandbox (only a webhook simulator). Mockups exist only as product mockup selection; no on-demand mockup generator was found. [fetched]

**Plans**
- Free, or Premium at $39 a month ($29 before 17 Feb 2026) or $299 a year, for up to 20% off. [snippet https://printify.com/pricing/]

**Tax**
- Charges US sales tax on our wholesale cost unless we hold a resale certificate; charges VAT on EU, UK and Norway orders.
- Collects the new EU €3 duty on orders from outside the EU.
- "You are solely responsible" for tax on the retail sale. [snippet https://help.printify.com/hc/en-us/articles/4483635869073 and related]

**Why it is not the primary**
- Quality, price and location vary by which print provider you pick for each product.
- No mockup API.
- Base prices: **not verified**; they need a key.

### 1.5 Merchant-of-record options (they take tax off us)

**Fourthwall**
- It *is* the merchant of record: it collects and remits US sales tax and UK VAT (it is UK VAT-registered), and EU VAT through IOSS. [snippet https://help.fourthwall.com/frequently-asked-questions/payments-and-pricing/creator-tax-information]
- Japan is a supported payout country (Stripe Connect). [snippet]
- Its API **can** create a design product per player: upload the image, then `POST /open-api/v1.0/products` with `type:"design"` and `regions[{region, imageId}]`.
  - Products are "created hidden unless you set publishOnCreate: true".
  - The create response returns rendered mockup images, so the player can see their dog on the product.
  - [fetched https://docs.fourthwall.com/guides/create-design-products]
- Catches:
  1. Payment happens on **Fourthwall's checkout**, not our Stripe.
  2. The Storefront API only reads *published* products, so the player gets a private product link. [fetched https://help.fourthwall.com/manage-my-shop/apps-features-and-integrations/storefront-api-for-custom-storefronts]
  3. The help centre says "Fourthwall does not currently support customer uploads or product personalization during checkout" and offers hidden listings as the workaround. [fetched https://help.fourthwall.com/create-and-sell-products/how-to-guides/offer-personalized-products]
  4. Production location is chosen per order, and "UK orders still ship Delivered Duty Unpaid", so UK buyers may pay customs. [snippet https://help.fourthwall.com/frequently-asked-questions/shipping-and-orders/where-products-are-printed-and-shipped]
  5. Base prices and the fee cut: **not verified**.
  6. Whether a hidden product for every player is allowed at volume: **not verified**. Ask Fourthwall.
- **This is the only verified way to have no US or UK tax registrations.**

**Not usable**
- **Paddle**: prohibits "physical products or products that require physical delivery". [snippet https://www.paddle.com/help/start/intro-to-paddle/what-am-i-not-allowed-to-sell-on-paddle]
- **Lemon Squeezy**: digital goods only. Sign-ups are closed and it stops processing on 31 Mar 2027. [snippet https://docs.lemonsqueezy.com/help/getting-started/activate-your-store, https://docs.lemonsqueezy.com/migration]
- **Stripe Managed Payments**: described for digital products only; physical goods **not verified**.

**Shopify + a POD app**
- Shopify is not a merchant of record (not checked in depth).
- Printful's own Shopify personalization is "text-based designs" only. [snippet https://help.printful.com/hc/en-us/articles/20196872271516]

### 1.6 Others checked briefly

- **Spreadconnect / SPOD** (US and EU facilities): has an API; PNG files under 10 MB; 60 calls per minute; a staging server. [snippets via https://apis.io/apis/spod/spod-orders-api/ and polotno.com, not the official docs] Worth a look only if Printful and Gelato fail.
- **Teemill** (UK, organic cotton): has a Print API; 200 dpi transparent PNG. Endpoints **not verified**. [snippet https://teemill.com/print-on-demand-api/]
- **Contrado** (UK): has an API; not checked further.
- **SUZURI**: its API has Material, Product and Choice resources but **no order or purchase endpoint**. `GET /user/sold` is read-only. The API key is described for "development and personal use". [fetched https://suzuri.jp/developer] So we could make a SUZURI product per player, but the buyer must check out on suzuri.jp.
- **pixivFACTORY, Canvath, Up-T and similar**: no public order API found. pixivFACTORY has a corporate page and over 80 goods, including acrylic keychains. **Not verified**; ask them directly. [snippet https://prtimes.jp/main/html/rd/p/000000473.000035885.html]
- **AliExpress, Alibaba, 1688 and China POD**:
  - AliExpress's dropshipping API places orders for *listed* products; I found no per-order print-file field (**not verified**). [snippet https://ds.aliexpress.com/dropshipping-api]
  - The "China POD" names that come up (PrintKK, JetPrint, EPROLO, Artsadd) advertise single items with no minimum, but none had a verified public API. Artsadd is CSV only. [snippets]
  - Since **29 Aug 2025 the US has no $800 de minimis for any country**. Every shipment from abroad pays duty, and postal shipments use ad valorem since 28 Feb 2026. [snippet https://www.cbp.gov/sites/default/files/2025-08/factsheet_suspension_of_duty-free_de_minimis_treatment.pdf; CBP rule effective 24 Jun 2026]
  - The **EU charges €3 per item category on parcels under €150 from 1 Jul 2026**. [snippet https://www.consilium.europa.eu/en/press/press-releases/2026/02/11/council-gives-final-green-light-to-new-customs-duty-rules-for-small-parcels/]
  - So for US and UK buyers, China one-offs lose on duty, lead time and our tax position. MOQ factories make sense only for **fixed** designs (pins, plush, acrylic stands of the 40 breeds), and those need stock and a fulfilment service. That is outside the "no stock" brief.

---

## 2. Transaction design: tax, law, refunds

### US sales tax

**Who charges what**
- The seller is a foreign individual, and the print company ships from a US state.
- Printful, Gelato, Prodigi and Printify all **charge us sales tax on the wholesale order** for US deliveries. None of them remits tax on *our* retail sale.
- To stop the wholesale charge you need a resale certificate, which needs a state seller's permit.

**When we must register**
- A remote seller, including a foreign one, must register in a state once it passes that state's economic-nexus threshold. That is commonly **$100,000** of sales a year; some states use $250k or $500k; many have dropped the 200-transaction test. [snippet https://www.streamlinedsalestax.org/for-businesses/remote-seller-faqs/remote-seller-state-guidance]
- Below the thresholds, the practical model is to charge buyers no sales tax and treat the provider's charge as a cost.
- Printful's own guidance: a seller with no US presence and no US sales has no US sales-tax concern, but economic nexus can arise from sales. [snippet https://help.printful.com/hc/en-us/articles/360014068799]

### UK VAT

**The rule**
- GOV.UK: "If you are an overseas seller and you sell goods of any value that are located in the UK at the point of sale you must: register for VAT, charge VAT, account for VAT". [fetched https://www.gov.uk/guidance/charging-vat-on-goods-sold-direct-to-customers-in-the-uk, updated 30 Jan 2026]
- Non-established taxable persons (NETPs) get no threshold. [snippet https://www.gov.uk/government/publications/vat-notice-7001-should-i-be-registered-for-vat]

**Does the provider's VAT cover it? No.**
- When Printful or Gelato charges 20% VAT on a UK-made order, that VAT is on *their* sale to us. Once we are registered, it becomes input VAT we can reclaim.
- Making the goods outside the UK and shipping them in (≤ £135) does not escape registration either: direct website sales also require it.
- Only a marketplace or merchant of record (Fourthwall, or selling on Etsy or Amazon) takes this on.

**What registration involves**
- The registered address must be the principal place of business, outside the UK.
- Appointing a UK VAT agent is optional. [snippet VAT Notice 700/1]

### EU (briefly)

- Goods made inside the EU (Printful in Latvia or Spain; Gelato in Germany and elsewhere) avoid the €3 duty and import VAT.
- The non-EU seller's own EU VAT position (OSS or IOSS registration) is **not verified**.
- Recommendation: leave the EU out of version 1, or sell there only through a merchant of record.

### Japan, if the seller is in Japan

**Consumption tax**
- A sale of goods located abroad at the time of transfer is 国外取引 (a foreign transaction) and 不課税 (outside the scope of Japanese consumption tax). [snippet https://www.nta.go.jp/taxes/shiraberu/taxanswer/shohi/6210.htm]
- So US- and UK-made orders carry no Japanese consumption tax. Income tax still applies.

**特定商取引法 (the Japanese mail-order disclosure law)**
- Required items: price incl. tax, shipping, other charges, payment timing and method, delivery time, cancellation and returns terms, and the seller's name, address and phone. [fetched https://www.no-trouble.caa.go.jp/what/mailorder/advertising.html]
- Individuals must give their legal name; a handle or shop name alone is not allowed. (Q16)
- **Address and phone, and the name too (Q15), may be omitted** if the page says they will be provided by document or email "遅滞なく" (without delay) on request, and that is actually done.
- A virtual-office or platform address is allowed under three conditions:
  - there is an agreement with the operator;
  - the operator knows the seller's real address and phone;
  - the seller can be reliably reached.
- [fetched https://www.no-trouble.caa.go.jp/qa/advertising.html, Q15–Q18]
- Whether the law applies to sales to foreign buyers: **not verified**. Display it anyway.

### Seller in Hong Kong instead

- No sales tax or VAT at home, and no 特商法. The US, UK and EU rules above still apply.
- Stripe HK: 3.4% + HK$2.35, +0.5% for international cards, +2% for FX, HK$85 per dispute. [fetched https://stripe.com/en-hk/pricing]

### Stripe (Japan account)

- 3.6% per card payment, **+2% when currency conversion is needed**. For example, a USD or GBP charge settled in JPY costs about 5.6%.
- ¥1,500 per dispute.
- Card refunds have no extra fee, but **the original fees are not returned**.
- Stripe Tax: 0.5% per transaction on Checkout.
- [fetched https://stripe.com/jp/pricing]
- A Japan account settling in USD or GBP to avoid the 2%: **not verified**.

### How refunds, chargebacks and reprints flow

1. The buyer pays on Stripe Checkout. The `checkout.session.completed` webhook fires, and the Worker creates the provider order:
   - Printful: draft, then `confirm`. Printful charges our card or wallet at confirmation, and draft orders are not charged.
   - Hold orders as drafts for about 1 hour so a buyer's mistake can be cancelled at no cost.
2. **Defect, misprint or lost parcel**: do **not** refund on Stripe. File a claim with the provider within 30 days of delivery, with a photo.
   - Printful reships or refunds us with no return needed. Gelato reprints or refunds at its option.
   - The buyer gets a free replacement; our only cost is support time.
3. **Buyer's remorse, wrong size**: the providers accept no returns for these.
   - Our policy must say so. Personalised goods are excluded from EU withdrawal rights, per Printful's policy text; the UK Consumer Contracts Regulations exclusion was **not verified** directly.
   - Any goodwill refund is our loss: wholesale cost + shipping + the Stripe fee, which is not returned.
4. **Chargeback**: the provider is never involved.
   - We pay ¥1,500 (or £20 or $15 on a UK or US account) and lose the wholesale cost if we lose the dispute.
   - Keep tracking numbers from the `package_shipped` / `order:shipment:*` webhooks as evidence.
5. **Wrong address typed by the buyer**: assume we pay for the re-ship. The provider rule for this was **not verified**.

### Children and personal data

- The buyer's name, address, email and phone go to the provider as our processor. Printful and Gelato both offer processor terms.
- Recommendations:
  - Require an adult cardholder. Stripe Checkout naturally collects the payer.
  - Never print player names or in-game text without consent.
  - Do not send the player's account ID; send an opaque order ID.
- Japan's APPI rules on transfers to foreign third parties (consent or an equivalent system) apply if the seller is in Japan. **Not verified in this session**; confirm before launch.

---

## 3. Comparison (top 5)

| | Printful | Gelato | Prodigi | Printify | Fourthwall (MoR) |
|---|---|---|---|---|---|
| Made in the US | yes, own facilities | yes, 39 US/CA hubs | yes, in-house | yes, many providers | partners, per order |
| Made in the UK | yes, own (Wolverhampton), UK addresses only | yes, 17 hubs | yes, in-house HQ | depends on provider | not guaranteed; UK ships DDU |
| Made in the EU | LV, ES | 18 countries | yes | yes | yes |
| Made in Japan | yes (tee, sweat, hoodie, mug, stickers, case) | yes (not apparel) | not verified | not verified | no |
| Per-order file URL | yes, documented "every order unique" | yes (`files[].url`) | yes (`assets[].url`) | yes (`print_areas` URL) | per-player hidden product |
| Mockup API | yes, but 2–10 tasks/min | only via create-from-template | yes | no | yes, rendered on create |
| Sandbox | no (drafts free) | no (drafts free) | **yes** | no | no |
| Webhooks | yes, signed (v2) | yes | per-order callback | yes, signed | not checked |
| Monthly fee | none | none (Gelato+ optional) | none | none (Premium optional) | none listed |
| Who pays US/UK tax on the retail sale | us | us | us | us | **Fourthwall** |
| Trustpilot (24 Nov 2026) | 4.1 (8,019) | 4.2 (3,489) | 4.0 (149) | not read | not read |

---

## 4. Unit economics (Printful, delivered price, Standard shipping)

**Assumptions (mine, not verified)**
- FX: $1 = ¥155, £1 = $1.33.
- Stripe: 3.6% (the brief's assumed Japan rate) **+ 2% verified conversion** on USD and GBP charges, so 5.6%. JPY charges: 3.6%.
- US sales tax charged to us by Printful: about 7% of (product + shipping), the average; it varies by state.
- UK: **VAT-registered**. Retail includes 20% VAT; Printful's 20% is reclaimed; margin is measured on the ex-VAT price.
- Japan: Printful's Japan-made items carry a 10% consumption-tax charge to us. The seller is 免税 (not registered for consumption tax), so this is a cost and the buyer is charged no tax.
- No US holiday surcharge ($0.40 until 17 Jan 2027).
- No samples, returns or ads.

Margin = profit ÷ net revenue. Net revenue = price (US, JP) or price ÷ 1.2 (UK).

| Item | To | Base + ship (USD) | Cost incl. tax treatment | Suggested price | Stripe fee | Profit | Margin |
|---|---|---|---|---|---|---|---|
| 11 oz mug | USA | 6.07 + 6.69 | $13.65 (+7% tax) | **$21.99** | $1.23 | $7.11 | 32% |
| 11 oz mug | UK | 6.07 + 5.19 | £8.47 (VAT reclaimed) | **£15.99** incl. VAT | £0.90 | £3.96 | 30% |
| 11 oz mug | Japan | 6.07 + 4.99 | ¥1,886 (+10%) | **¥2,900** | ¥104 | ¥910 | 31% |
| Tee (B+C 3001) | USA | 11.92 + 4.95 | $18.05 | **$27.99** | $1.57 | $8.37 | 30% |
| Tee | UK | 11.92 + 4.79 | £12.56 | **£23.99** | £1.34 | £6.09 | 30% |
| Tee | Japan | 11.92 + 4.95 | ¥2,876 | **¥4,400** | ¥158 | ¥1,366 | 31% |
| Sweatshirt (Gildan 18000) | USA | 19.17 + 8.79 | $29.92 | **$45.99** | $2.58 | $13.49 | 29% |
| Sweatshirt | UK | 19.17 + 7.29 | £19.89 | **£37.99** | £2.13 | £9.64 | 30% |
| Sweatshirt | Japan | 19.17 + 7.89 | ¥4,614 | **¥6,900** | ¥248 | ¥2,038 | 30% |
| Tote | USA (W101, $10.18) | 10.18 + 4.69 | $15.91 | **$24.99** | $1.40 | $7.68 | 31% |
| Tote | UK (EC8000, $15.87) | 15.87 + 4.59 | £15.38 | **£28.99** | £1.62 | £7.16 | 30% |
| Tote | Japan | not made in JP (ships from US or EU; customs) | | n/a | | | |
| Sticker sheet A5 | USA | 5.15 + 4.49 | $10.31 | **$15.99** | $0.90 | $4.78 | 30% |
| Sticker sheet | UK | 5.15 + 4.29 | £7.10 | **£13.49** | £0.76 | £3.39 | 30% |
| Sticker sheet | Japan | 5.15 + 2.99 | ¥1,388 | **¥2,100** | ¥76 | ¥636 | 30% |

**If not VAT-registered in the UK (not compliant, shown only for scale)**
- Printful's 20% becomes a cost and no VAT is charged.
- Example: tee cost £15.07; at £23.99 the profit is about £7.58.

**Stripe fee sensitivity**
- At 3.6% instead of 5.6%, US and UK margins rise by about 2 points.

---

## 5. Not verified, and questions for the owner

**Not verified**
- Gelato: all USD and GBP prices, shipping to the UK and US, stickers, sandbox. Its site blocks automated reading; a free account plus its quote API would answer all of these.
- Prodigi: prices other than the mug; apparel range; shipping rates.
- Printify: base prices.
- Fourthwall: base prices, the fee cut, and whether one hidden product per buyer is allowed.
- Printful: exact print-file pixel sizes (need a key); phone-case US shipping; whether a business is required (nothing says so).
- Japan: any public order API at pixivFACTORY, Canvath, Up-T or ORILAB; whether 特商法 applies to foreign buyers; APPI cross-border transfer steps.
- Tax: EU OSS/IOSS duties for a non-EU seller of EU-made goods; Stripe Japan settling in USD or GBP; the UK Consumer Contracts Regulations exclusion for personalised goods.
- China POD APIs.

**Questions for the owner**
1. **Seller country**: Japan or Hong Kong? This changes Stripe fees, 特商法 and income tax.
2. **Business status**: sole trader (個人事業主, with a 開業届 filed) or nothing registered? Is a company planned?
3. **UK**: are you willing to register for UK VAT as an overseas seller (quarterly returns, possibly an agent)? If not:
   - sell to the UK only through a merchant of record (Fourthwall), or
   - start US-only.
4. **Currencies to charge**: USD and GBP (+2% Stripe conversion on a Japan account), or one currency (USD) for everyone?
5. **Refund policy**: is "no returns on personalised items; free replacement for any defect" acceptable?
6. **Range for v1**: mug, tee, sticker sheet and poster everywhere; sweatshirt, hoodie and tote in the US and UK only. Are calendar and acrylic left out?
