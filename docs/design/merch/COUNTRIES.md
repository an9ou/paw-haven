# "My dog" merch: which countries, and what each needs (research, 24 Nov 2026)

The owner decided on 24 Nov 2026: "We can ship to everywhere, not only the USA". This file turns that into a country list.
**This is research, not tax or legal advice.** Every "seller must" line is for the owner's accountant or adviser to confirm before launch.
Seller: a small Hong Kong business, Stripe account in Hong Kong, owner living in Japan, about 10 orders a day at most. Products: mug (Printful 19),
tee (71, Bella+Canvas 3001), A5 kiss-cut sticker sheet (505). Marks: **[fetched]** = I read the page; **[snippet]** = search extract only; **[not verified]**.

## Summary
1. **Open at launch, tier 1 (made in the country or next door, no registration at our volume):** USA, Canada, Australia, New Zealand, Japan, Hong Kong.
2. **Open at launch, tier 2 (no seller registration, but tax or a fee may be due at the door, or delivery is slow):** Norway, Switzerland,
   Singapore, South Korea, Taiwan, Mexico, and the rest of the world except tier 4. The page says so plainly before Pay (wording below).
3. **Wait, tier 3 (registration or adviser sign-off before the first order):** the **UK** (VAT from the first sale, any value, any facility),
   the **EU 27** (no threshold for a non-EU seller; OSS in Latvia or Spain for EU-made items), and **Brazil** (CPF, 60% duty route, local-sale questions).
4. **Never, tier 4:** Russia, Belarus, Ecuador, Venezuela, Cuba, Iran, Syria, North Korea, Gaza (Palestine), and Ukraine for now; plus territories Stripe Checkout refuses.
5. The decisive facts: GOV.UK says an overseas seller of goods in the UK "of any value" must register; the EU OSS guide gives non-EU sellers no €10,000 threshold.
6. Surprises: Switzerland's CHF 100,000 counts only small parcels into Switzerland (not worldwide); Norway charges 25% VAT on *every* import from a non-VOEC shop;
   Japan's ¥10,000 import exemption excludes knitted apparel (a tee), which only matters when a tee size is missing in Japan.
7. Every open country gets a line in the Worker's nightly report against its threshold (watch list below). Stripe's own alerts start only after US$10,000 a year.

## 1. Per country (Printful Standard rates in USD, first item / each extra; printing takes 2–5 business days before shipping)
Shipping rates and DDP [fetched printful.com/shipping, 24 Nov 2026]. Mugs and stickers "always ship separately" (each is its own parcel) [fetched, same page].
"Made in" comes from Printful's catalog API `availability_status` per variant [fetched api.printful.com/products/{19,71,505}, 24 Nov 2026].

| Country | Made in: mug / tee / sticker | Tee · mug · sticker | Delivery after printing | Buyer at the door | Seller before the first sale | Tier |
|---|---|---|---|---|---|---|
| USA | US / US / US | 4.95/2.20 · 6.69/3.50 · 4.49/0.05 (+$0.40 to 17 Jan 2027) | 3–4 bd [fetched] | nothing (made in the US) | nothing below each state's economic nexus, commonly US$100k a year; Printful charges us sales tax on wholesale [snippet, PROVIDERS.md 2] | 1 |
| Canada | CA / CA / CA (Toronto) | 8.59/1.95 · 8.09/4.70 · 5.19/0.10 | 2 days Ontario, 4 most provinces [fetched printful.com/print-on-demand-canada] | "no customs or duty fees" for Canada-made [fetched, same]; DDP offered for imports [fetched] | C$30,000 small-supplier test; non-residents with goods in a Canadian fulfilment warehouse use the normal GST/HST regime [fetched canada.ca digital-economy page; the C$30,000 figure snippet] | 1 |
| UK | UK / UK / UK (UK addresses only) | 4.79/1.50 · 5.19/1.25 · 4.29/0.10 | ~2 bd [snippet] | nothing (UK-made) | **register for UK VAT before the first sale** (3.1) | 3 |
| EU 27 | EU (LV, ES) / EU / EU (LV) | 4.99/1.45 · 5.39/2.05 · 4.29/0.10 | 5–20 bd [fetched] | nothing when EU-made | **VAT due in the buyer's country from the first sale** (3.2) | 3 |
| Norway | EU, crosses a border | EFTA: 10.39/1.10 · 10.79/1.75 · 10.39/0.05 | 5–20 bd [not verified] | 25% VAT on all imports from non-VOEC shops plus a carrier fee [fetched toll.no] (Posten NOK 75 for 500–3,000 [snippet]) | VOEC registration required at NOK 50,000 to Norwegian consumers in any 12 months; voluntary from the first sale [fetched skatteetaten.no] | 2 |
| Switzerland | EU, crosses a border | EFTA rate as Norway | [not verified] | 8.1% VAT once the tax is over CHF 5 (≈ CHF 62 incl. shipping), plus a Swiss Post fee (CHF 11.50–70 [snippet ch.ch]) | register at CHF 100,000 a year of small consignments into CH (not worldwide), then a Swiss tax representative [fetched estv.admin.ch] | 2 |
| Australia | AU / AU (83 of 628 variants) / AU | AU/NZ: 7.99/1.40 · 8.69/3.65 · 5.89/0.10 | [not verified] (partners in Brisbane, Melbourne [fetched]) | nothing (made in AU) | GST at A$75,000 turnover connected with Australia; goods located in AU are "connected" [snippet ato.gov.au] | 1 |
| New Zealand | likely AU (in-region) [not verified] | AU/NZ rate | [not verified] | none expected under NZ$1,000 (offshore sellers collect instead) [not verified at the border] | GST at NZ$60,000 of low-value goods to NZ consumers in 12 months [fetched ird.govt.nz] | 1 |
| Japan | JP / JP (only 35 variants: White S, XL, 2XL; Black XS–L) / JP | 4.95/2.00 · 4.99/1.60 · 2.99/0.08 | [not verified] | nothing when JP-made; imports ≤ ¥10,000 are duty and tax free except some goods incl. knitted apparel [snippet customs.go.jp, JETRO] | a non-resident's sales in Japan are exempt from JCT at ≤ ¥10m taxable sales (base period) [snippet nta.go.jp]; 特商法 notice needed (5) | 1 |
| Hong Kong | JP (in-region) | worldwide: 12.49/6.00 · 12.49/6.50 · 8.29/0.25 | 5–9 bd from Japan [fetched printful.com] | nothing: free port, no tariff, no VAT [snippet customs.gov.hk] | the seller's home: profits tax only (PROVIDERS.md 2) | 1 |
| Singapore | JP (in-region) | worldwide rate | ~6 bd [fetched printful.com] | probably nothing ≤ S$400 by air or post [not verified for unregistered sellers] | OVR only if global turnover > S$1m **and** B2C low-value sales to SG > S$100k [fetched iras.gov.sg] | 2 |
| South Korea | JP (in-region) | worldwide rate | 5–9 bd [fetched printful.com] | duty and VAT free to US$150 a day per site; **a Personal Customs Clearance Code (P + 12 digits) is required** even below it [snippet fedex.com, KCS news] | none found for low-value goods [not verified] | 2 |
| Taiwan | not stated (JP or US) [not verified] | worldwide rate | [not verified] | free under NT$2,000 CIF, 6 times per half-year; EZ WAY real-name check for express parcels since 1 Mar 2026 [snippet] | none found [not verified] | 2 |
| Mexico | US (Tijuana unclear) [not verified] | worldwide rate (Mexico not listed) | [not verified] | US-shipped courier parcels: free to US$50, then tariff (17% or tax free to US$117: sources conflict) plus 16% IVA [snippet] | none found for direct sellers [not verified] | 2 |
| Brazil | BR / BR (31 variants) / shipped in | 12.49/6.00 · 12.49/6.50 · 8.29/0.25 | 10–25 bd [fetched printful.com] | CPF required on every order [snippet Printful help]; non-Remessa-Conforme sellers: 60% duty + 17–20% ICMS [snippet] | how a foreign seller's Brazil-made sale is invoiced: unknown [not verified] | 3 |
| Rest of world | US or EU | worldwide rate | 5–20 bd [fetched] | import tax and carrier fees possible, by local limits [fetched] | some countries run seller-collect schemes for low-value goods [not verified per country] | 2 |

DDP: Printful's Standard DDP exists only for Canada (3–5 bd) and the UK (3–7 bd) [fetched]. Printful otherwise: "Your end customer is responsible for any customs fees" [snippet help.printful.com].

## 2. Printful and Stripe limits (tier 4)
- **Printful does not ship to** Crimea, Luhansk and Donetsk regions, Russia, Belarus, Ecuador, Cuba, Iran, Syria, North Korea [fetched printful.com/shipping].
  The help centre also lists the Gaza Strip and Venezuela; Ukraine and Kosovo only from Latvia; India refuses Pakistan-made blanks [snippet]. Product limits found: pet bowls
  not to JP, KR, HK, TW (not ours) [fetched]. No mug or sticker limit found [not verified].
- **Stripe Checkout** `shipping_address_collection.allowed_countries` takes 238 codes (incl. `ZZ`) [fetched docs.stripe.com/api/checkout/sessions/create]. Compared with
  Printful's country list, Stripe **does not offer** AS, CC, CU, CX, FM, HM, IR, KP, MH, MP, NF, PW, SY, UM, VI. So the US Virgin Islands, American Samoa,
  the Northern Marianas and the Pacific compact states cannot be reached through Checkout; Puerto Rico and Guam can.
- Checkout cannot block a region inside a country (Crimea etc.), so **Ukraine stays closed** at launch. Our list: `MERCH_COUNTRIES` = tiers 1 and 2 minus
  RU, BY, EC, VE, PS, UA; tier 3 added one by one.
- **Stripe Tax** where we are not registered: it calculates zero with `taxability_reason: not_collecting` ("You must register before collecting tax in a jurisdiction")
  [fetched docs.stripe.com/tax/zero-tax]. Its threshold monitoring is only a hint ("it's up to you to confirm"), it treats every sale as taxable at destination,
  and notifications need US$10,000 of revenue in the previous year [fetched docs.stripe.com/tax/monitoring]. So our own nightly report is needed (6).
- Korea needs the clearance code: Checkout `custom_fields` (up to 3) can ask for it [fetched API reference]; where Printful wants it is [not verified] (other carriers use Address 2).

## 3. Tier 3: what opening needs
### 3.1 UK
- Facts: an overseas seller "who owns goods of any value that are located in the UK at the point of sale" must register; for goods shipped in at £135 or less the
  seller must "charge and account for VAT at the point of sale" [fetched gov.uk/guidance/vat-and-overseas-goods-sold-directly-to-customers-in-the-uk, updated 13 May 2022].
  NETPs get no threshold (VATREG37050, TRANSACTIONS.md 1.1). Printful's UK VAT on wholesale is reclaimable once registered. DDP does not remove the seller's duty.
- Involves: online VAT registration (direct, or through an agent; a UK VAT representative is optional), 20% inside UK prices, Making Tax Digital returns [snippet gov.uk VATREG37370].
- Cost (published prices are scarce): one filing service form shows £240 for a non-resident registration [snippet]; returns are usually a yearly fee [not verified].
- Alternatives: (a) don't ship to the UK yet; (b) a merchant of record that can print a unique file per buyer (none found: Fourthwall cannot, TRANSACTIONS.md 1);
  (c) a marketplace (Etsy with a Printful link) takes UK VAT as the deemed supplier, but each order's dog file would be manual [not verified].
### 3.2 EU 27
- EU-made (Printful Latvia or Spain): the €10,000 threshold "only applies" to sellers established in the EU, so VAT is due in the buyer's country from the first order.
  A non-EU seller uses the Union OSS with "the Member State in which the dispatch or the transport of the goods begins" (Latvia or Spain) [fetched OSS guide, July 2026].
  Open: is Printful's sale or ours the one that moves the goods (chain rule), and do Latvian or Spanish buyers need a local return [accountant].
- Shipped in from the US or UK at ≤ €150: IOSS is voluntary; a non-EU seller needs an EU **intermediary** to use it [fetched OSS guide]. Without IOSS, "the customer is
  the person liable" for import VAT and the carrier collects it, usually with a fee [snippet, EC 2026 addendum]. The €150 duty relief ended: **€3 per item (per tariff line)**
  from 1 Jul 2026 to 1 Jul 2028, meant for all distance sales ≤ €150, plus a **€2 Union handling fee per item**, expected from 1 Nov 2026 [fetched EC customs guidance on the €3 duty, Oct 2026].
- Cost: one IOSS intermediary lists €49 a month + 1% of declared value [snippet ship24.com]; OSS filing services [not verified].
- Also check: the EU product-safety rules (an EU "responsible person" for a non-EU seller's goods) and food-contact rules for the mug [not verified].
- Alternatives: (a) EU later, after an adviser picks one route; (b) EU-made only, Union OSS in Latvia; (c) a marketplace as deemed supplier for imports [not verified].
### 3.3 Brazil
- Only the mug and some tees are made there; stickers would be imported. An adviser must say how a foreign seller's Brazil-made sale is invoiced; otherwise do not open.

## 4. Shop page wording
- **Tier 2, next to Pay:** "Your country may charge import tax or a fee when it arrives. It isn't included in this price, and it's paid to the delivery company."
  Then "Delivery usually takes {min}–{max} working days." Korea adds "Please enter your personal customs code (P + 12 numbers)." Taiwan adds
  "Customs may ask you to confirm the parcel in the EZ WAY app." Norway and Switzerland: "Norway charges VAT on every parcel from abroad." / "Switzerland charges VAT on most parcels."
- **Tier 3, while closed:** "Coming soon to the UK and Europe. We're sorting out the tax paperwork first, so we can't take orders there yet." Brazil: "Coming later to Brazil."
- **Tier 4:** the country is simply not in the address list. The shipping page says "We can't deliver to some countries because of carrier or legal limits."

## 5. Consumer law next to our policy (no change-of-mind returns on personalised items; reprint or refund for damage, misprint, loss; 1-hour cancel)
- **UK:** no 14-day right for "clearly personalised" goods (CCR 2013 reg. 28(1)(b)); say so **before** ordering; faults keep Consumer Rights Act remedies (TRANSACTIONS.md 4).
- **EU:** CRD art. 16(c), the same exception [not fetched this session]. The new withdrawal button (art. 11a, from 19 Jun 2026) applies where a withdrawal right exists [snippet]; national rules vary.
- **Australia:** refusing change-of-mind refunds is fine; a plain "no refunds" line is unlawful, and the consumer guarantees apply to overseas sellers [snippet state fair-trading pages].
  So write "no returns if you change your mind", never "no refunds".
- **Canada:** provincial. Ontario internet agreements over C$50: disclose before, copy within 15 days, buyer may cancel if not delivered within 30 days of the promised date,
  refund within 15 days [snippet CLEO, Ontario law firms]. Quebec [not verified].
- **Japan:** if return terms are not shown, the buyer may return within 8 days of receipt at their own cost; a clear "returns only for defects" term on the ad and the
  final confirmation screen (art. 12-6) overrides it [snippet; article numbers to check on e-Gov]. Show the 特定商取引法に基づく表記 page.

## 6. Watch list for the Worker's nightly report (sales per country, refunds deducted; alert at 50% and 80%)
| Where | Threshold | Window | Source |
|---|---|---|---|
| UK, EU (each country), Brazil | **any order** = alarm while closed | daily | 3 |
| US, each state | US$100,000 in most states; some also count transactions | state rule (calendar or rolling) | [snippet] |
| Canada | C$30,000 | last 4 quarters, or 1 quarter | [snippet canada.ca] |
| Australia | A$75,000 | 12 months | [snippet ato.gov.au] |
| New Zealand | NZ$60,000 (goods ≤ NZ$1,000) | last or next 12 months | [fetched] |
| Norway | NOK 50,000 (goods < NOK 3,000) | any 12 months | [fetched] |
| Switzerland | CHF 100,000 of small consignments | calendar year | [fetched] |
| Singapore | S$100,000 B2C to SG and S$1m global | calendar year / 12 months | [fetched] |
| Japan | ¥10,000,000 taxable sales in Japan | base period (2 years back), 特定期間 half year | [snippet] |
| Everyone else | report the top 10 countries by sales | 12 months | to spot a new regime |

## 7. Not verified / for the accountant
- Whether a HK business run by an owner who lives in Japan is treated as Japan-resident or has a Japanese establishment (this changes JCT, income tax and 特商法 details).
- Canada: does a third-party printer in Ontario count as a "fulfillment warehouse", and does the C$30,000 test count our worldwide revenue (Kind shop included) or Canadian sales only.
- Australia: GSTR 2018/2 on goods made locally by a partner for a non-resident; whether the Kind shop's AU sales count toward A$75,000.
- EU: the chain-transaction question and local returns in Latvia or Spain; IOSS or no IOSS for imports; product-safety representative; mug food-contact rules.
- UK: agent and filing cost; whether a marketplace route can carry a unique file per order.
- Singapore import relief for unregistered sellers; Korea and Taiwan seller rules; Mexico's current courier rates; delivery times for JP, AU, NZ, TW, MX, NO, CH.
- Which facility serves New Zealand, Taiwan and Mexico; where Printful wants the Korean code; any Printful product limits on mugs or stickers.
- Rest of world: one pass over countries with their own seller-collect rules for low-value goods before opening each region.
- US: whether third-party print facilities create physical nexus (TRANSACTIONS.md 1.1).
