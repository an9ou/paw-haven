# Merch shipping, carts and free shipping

24 Nov 2026. Research, not tax or accounting advice.

The owner's decision (24 Nov 2026): item prices in USD only, a shipping fee on small orders, free shipping over a threshold (US$50 or lower),
a cart with several items, shipping worldwide, and more income per order than the old "one delivered price, one item" model.
Numbers: `node tools/merch_econ.js --cart` (inputs in `cartInputs()`). Same formula as ECONOMICS.md, per order, Stripe case 2.

## 1. Facts

**Printful Standard flat rate, USD, first item / each extra item** (printful.com/shipping, read 24 Nov 2026) [fetched]

| | USA | Canada | UK | Europe | Australia/NZ | Japan | Norway/Switzerland (EFTA) | Worldwide |
|---|---|---|---|---|---|---|---|---|
| T-shirt | 4.95 / 2.20 | 8.59 / 1.95 | 4.79 / 1.50 | 4.99 / 1.45 | 7.99 / 1.40 | 4.95 / 2.00 | 10.39 / 1.10 | 12.49 / 6.00 |
| 11 oz mug | 6.69 / 3.50 | 8.09 / 4.70 | 5.19 / 1.25 | 5.39 / 2.05 | 8.69 / 3.65 | 4.99 / 1.60 | 10.79 / 1.75 | 12.49 / 6.50 |
| Stickers | 4.49 / 0.05 | 5.19 / 0.10 | 4.29 / 0.10 | 4.29 / 0.10 | 5.89 / 0.10 | 2.99 / 0.08 | 10.39 / 0.05 | 8.29 / 0.25 |

- Mixed orders [fetched, same page]: same category = first rate + extra rate per extra item; different categories shipping together = the highest
  first rate + the other's extra rate. Mugs and stickers "ship separately ... due to packaging differences" and pay their own first-item rate even
  when they ship together. So **tees, mugs and stickers each pay their own first-item rate**: mug + tee + stickers to the USA = 4.95 + 6.69 + 4.49
  = $16.13. Items from different facilities ship separately, and "multiple shipment orders will have higher shipping costs".
- **US holiday surcharge**: "From Oct 15, 2026, to Jan 17, 2027, a $0.40 surcharge will be added to all orders with a US destination address". [fetched]
- Making 2-5 business days; USA and Canada 3-4 business days after that; international 5-20. Buyers "might have to pay customs fees". [fetched]

**What comparable US-facing shops charge** (shop types in our own text; names only as sources here) [snippet]
- Gaming merch shop (Game Theory Merch): $7.99, free over $49 worldwide. Board-game studio (Fowers Games): free over $50 to US, UK, Germany.
- Game publisher (Japanime Games): free over $75, continental US. Big-game merch shop (Dead by Daylight): free over $99. POD merch shop (Indie-Merch): over $100.
- POD marketplaces: TeePublic free over $80 (US); Society6 about $5 a tee, free only in promos; Etsy's guarantee: US orders of **$35** or more (help.etsy.com).
- POD tee shops: Threadless from $7.70 US / $17.64 abroad, $5 flat over $99; Cotton Bureau free over $99 with a code; a small reseller $4.99, free for 2 items or $64.99.
- Game merch shop (Fangamer): free US shipping in its holiday sale; base rate not found.
- Pattern: **US fees $4.99-$7.99; free from $35 to $100, often US only; abroad usually reduced, not free.**

**Published data** [snippet; vendor blogs kedra.io, easyappsecom.com, redstagfulfillment.com; original sources unclear]
- 228 Shopify stores: median threshold about **80% of average order value**, half between 61% and 102%. US averages quoted at $59-$64.
  Common advice: 15-30% above average order value. Claimed order-value lifts (12-30%) are not trustworthy.
- Baymard: extra costs (shipping, tax, fees) are the top reason for leaving a checkout, 40% (48% in a 2024 US survey). Show the total early.

**Stripe** (docs.stripe.com, read 24 Nov 2026) [fetched unless marked]
- A shipping rate is a fixed amount for the whole order; `shipping_rate_data` makes one inline; at most **5** `shipping_options`; payment mode
  only; `tax_behavior` and `tax_code` per rate (shipping `txcd_92010001`). Up to 100 line items.
- The hosted page **cannot** change shipping options after the address is typed (only the embedded form or Elements, as a preview).
- **Adaptive Pricing**: "You pay 0%. Your customers pay 2-4%"; buyers "still have the option to pay in the original currency". The session and the
  settled amount stay in USD (`presentment_details` shows what the buyer paid). Refunds use the original rate, "no extra costs for you".
- Limits: prices must be in one of **our settlement currencies** (USD settlement must be on); not with `capture_method: manual`; not with Elements +
  Payment Intents; a price with `currency_options` for the buyer's currency is not converted. Hong Kong businesses can use it [snippet].
- Shipping rates and Stripe Tax are not named among the limits; whether the fee converts with the items is **not verified**.

## 2. Comparison (USD; buyer pays / our margin, share of net revenue)

Old = $21.99 mug, $27.99 tee, $15.99 stickers delivered, one item per order (a pair = two orders). A = $14.99 / $22.99 / $11.99, fee $5.99 (USA),
free over $50. B = old prices, fee $3.99, free over $50. C = proposal (section 3). Holiday surcharge not included (it costs $0.43 a US order).

| Cart, USA | Printful shipping | Old | A | B | C |
|---|---|---|---|---|---|
| mug | 6.69 | 21.99 / 6.54 (30%) | 20.98 / 5.57 (27%) | 25.98 / 10.38 (40%) | 24.98 / 9.41 (38%) |
| tee | 4.95 | 27.99 / 7.70 (28%) | 28.98 / 8.66 (30%) | 31.98 / 11.54 (36%) | 31.98 / 11.54 (36%) |
| stickers | 4.49 | 15.99 / 4.27 (27%) | 17.98 / 6.18 (34%) | 19.98 / 8.10 (41%) | 18.98 / 7.14 (38%) |
| mug + tee | 11.64 | 49.98 / 14.25 (2 orders) | 43.97 / 8.77 FAIL | 53.97 / 18.38 | 46.98 free / 11.66 (25%) |
| tee + stickers | 9.44 | 43.98 / 11.97 (2 orders) | 40.97 / 9.38 | 47.97 / 16.11 | 40.98 free / 9.39 (23%) |
| mug + stickers | 11.18 | 37.98 / 10.81 (2 orders) | 32.97 / 6.30 FAIL | 41.97 / 14.95 | 38.97 / 12.06 (31%) |
| mug + tee + stickers | 16.13 | 65.97 / 18.51 (3 orders) | 55.96 / 9.50 FAIL | 65.97 free / 19.11 | 60.97 free / 14.31 (23%) |
| 2 tees | 7.15 | 55.98 / 15.41 (2 orders) | 51.97 / 14.93 | 55.98 free / 18.79 | 53.98 free / 16.87 (31%) |
| 2 mugs | 10.19 | 43.98 / 13.08 (2 orders) | 35.97 / 9.26 | 47.97 / 20.79 | 39.98 free / 13.11 (33%) |

C abroad (tee; mug + tee + stickers): Canada 34.98 / 11.78 and 68.96 / 18.71; Australia 34.98 / 12.41 and 68.96 / 17.98; UK 32.98 / 8.19 and 66.96 / 13.27.

- **A fails**: taking the shipping out of the prices and then shipping mixed carts free loses on the separate parcels (USA; worse abroad).
- **B earns most** ($13.06 an order in the USA) but is a $4 rise on every single item, and its "free over $50" fails outside the USA, UK, EU and Japan (a 3-item cart to the rest of the world keeps 6%).
- **Every C cart of 1-4 items passes the floor** in every region, with the holiday surcharge too (worst: EU mug + 2 tees + stickers 20%, USA tee + stickers 23%).
- At C prices, free shipping passes the floor from: USA and Japan $35; Canada, UK, Australia $65; EU $70; Norway/Switzerland $90; elsewhere $110.
- US threshold test: $35, $40, $45 and $50 all pass; expected margin per order $10.93 / $11.03 / $11.51 / $11.89.

**Expected margin per order.** Assumed mix (a guess, not data): tee 35%, mug 20%, stickers 10%, tee + stickers 10%, mug + tee 8%, mug + stickers 5%,
all three 5%, 2 tees 5%, 2 mugs 2%; world: USA 55%, EU 12%, UK 10%, Canada 8%, rest 6%, Australia/NZ 5%, Japan 3%, EFTA 1%.
**Old $9.27 (USA; buyer pays $33.07 on average) → C $10.93 (USA; buyer pays $34.44), +18%; C world mix $10.99.** A $8.12, B $13.06.
Each $1 more on the tee adds about $0.65 an order. The old model needed a second checkout for a second item, so it would see fewer pairs.

## 3. Recommended price list (model C)

| Item | Price (USD) | | Ship to | Shipping | Free shipping |
|---|---|---|---|---|---|
| 11 oz mug | $19.99 | | USA, Japan | $4.99 | orders of $35 or more |
| Tee (Bella+Canvas 3001), S-XL | $26.99 | | UK and Europe (prices include VAT) | $5.99 | orders of $70 or more |
| Sticker sheet A5 | $13.99 | | Canada, Australia, New Zealand | $7.99 | orders of $70 or more |
| Tee 2XL and up | + Printful's extra, rounded up to a dollar | | Everywhere else (incl. Norway, Switzerland, Hong Kong, Korea) | $11.99, + $5.99 per extra mug or tee | not offered |

- **$35 in the USA**: just above the most common single item (tee $26.99), so any tee plus anything ships free; one item alone never does.
  It is about 100% of the expected US order ($34.44), inside the published 61-102% band. $40 would put tee + stickers ($40.98) only 98 cents over
  the line; never pick a threshold that a common cart misses or makes by a few cents.
- **Not "free over $50" everywhere**: VAT inside UK/EU prices and separate parcels push three-item carts under the floor below $65-$70, and
  Printful's $12.49 per parcel elsewhere does so below $110. So: free from $35 in the USA and Japan, free from $70 in the UK, Europe, Canada,
  Australia and NZ, reduced (not free) elsewhere. The owner's "$50 or lower" holds where most buyers are.
- **Fees against our real cost**: USA 0.75-1.11x; UK/EU up to 1.40x; Canadian stickers 1.54x; Japanese stickers 1.67x (Japan shipping is cheap:
  keep $4.99 for one simple rule, or $3.99 there). No fee is above what the comparable shops charge.

## 4. What the buyer sees (honest, calm)

- Product page: "$26.99. Shipping to the USA: $4.99, free on orders of $35 or more." The country comes from the cart's "Ship to" choice.
- Cart: items, "Shipping $4.99" or "Shipping free", the total, and one plain line "Orders of $35 or more ship free." No progress bar,
  no "only $X away!", no timers, no "was" prices, no pre-ticked extras.
- "Prices are in US dollars. At checkout you can pay in your own currency at Stripe's rate, which includes a small conversion fee, or pay in US dollars."
- "Mugs and stickers travel in their own parcels, so they may arrive on different days." UK/EU: "Prices include VAT." Elsewhere: "Import taxes or fees may be due on delivery in some countries."

## 5. Stripe mechanics

1. The cart asks "Ship to" (a country) first; the Worker maps it to a zone. The browser never sends a price or a fee.
2. `POST /merch/quote {country, lines[]}` returns item prices, subtotal, fee, `free_over` and total from `catalog.js`.
3. Checkout: one `line_items[]` entry per line (`price_data`, currency `usd`; `tax_behavior` exclusive in the USA, inclusive in the UK/EU).
4. `shipping_options[0][shipping_rate_data]`: `fixed_amount` = the fee or 0, `display_name` "Standard shipping" or "Free shipping",
   `delivery_estimate`, tax code `txcd_92010001`. One option only, so the buyer cannot pick a wrong one.
5. `shipping_address_collection[allowed_countries] = [the quoted country]`: the hosted page cannot re-price for another address.
6. Adaptive Pricing on in the Dashboard; prices stay USD; USD must be a settlement currency of the HK account (ECONOMICS.md case 2).
7. Stripe takes 3.9% + US$0.30 once per order, so a cart saves us $0.30 per extra item against separate orders.
8. Webhook: re-read the session; check `amount_subtotal`, `shipping_cost.amount_total` and `amount_total` (USD) against the quote.
9. A sandbox test per zone (`+location_XX` emails) before launch, to see the converted fee and total.

## 6. Changes this forces on TRANSACTIONS.md

- Section 2: **a cart** replaces "one item per order": up to 6 lines, quantity 1-3 each; a line = recipe (dog) + product + variant. New table
  `merch_order_items` (line, product, variant, price, status, provider item and shipment ids); one print file per line, all rendered before the session.
- Quote and checkout take `{country, lines[]}`. The margin guard runs on the **whole order** at the quoted fee; the nightly job still turns off a
  variant whose single-item order fails the floor, and re-checks the free-shipping carts after any price or rate change.
- **Partial failure**: one Printful order per checkout, split by Printful into parcels (facilities; mugs and stickers apart). If a line is rejected
  (file, variant, stock), refund that line and ship the rest; never charge more when the rest falls under the threshold. If nothing can ship,
  refund all, shipping included. Status per line; the order is `part_shipped`, then `shipped` when every parcel is.
- **Refunds per item**: partial Stripe refunds keyed `mr_<order>_<line>_<n>`; a defect or a lost parcel is reprinted or refunded per line;
  shipping is refunded only with the whole order. Refunds are in USD; Stripe pays back the buyer's currency at the original rate.
- **The one-hour cancel covers the whole order** (full refund with shipping, Printful draft deleted); single lines cannot be cancelled.
- Several tracking links on the order page; one "On its way" email per parcel (`me_<order>_ship_<n>`); the FTC delay check per parcel.
- One gift code per order. `MERCH_DAY_CAP` counts orders; `MERCH_COUNTRIES` becomes a zone list. Section 3: USD only with **Adaptive Pricing on**
  (the fixed GBP list goes); fee + threshold per zone replaces delivered prices. Section 9: P gains the fee, W uses per-group shipping, one Stripe fixed fee per order.

## 7. Not verified

- Whether Adaptive Pricing converts the shipping rate with the items and works with `automatic_tax`; that a HK account can turn on USD settlement.
- Printful's "Worldwide" country list and restricted countries; whether Canada and Australia orders are made locally for each product.
- Tax outside the USA: UK/EU VAT registration (IOSS/OSS) for a HK seller and Printful's EU VAT on our orders; Canada GST/HST; Australia GST;
  Japan consumption tax (modelled as 10% on Printful's charge [snippet]); EU modelled at 21%. Whether a USD-only list is allowed for UK/EU consumers.
- All comparable-shop numbers (banners, policy pages and holiday promotions disagree) and the 228-store study.
- The US 7% tax on Printful's charge (placeholder); 2XL+ costs; carts above 4 items (the script checks 1-4).
