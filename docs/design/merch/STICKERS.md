# Merch stickers: cheaper postage and the best offer

24 Nov 2026. Research, not tax or accounting advice.

Question: Printful posts one A5 sticker sheet to the USA for US$4.49 (+$0.05 per extra sheet). Can stickers be made and posted for clearly less, and what should we offer?
Tags: [fetched] page read 24 Nov 2026; [snippet] search extract only; [not verified]. Margins: `tools/merch_econ.js` formulas (case 2, model C fees and thresholds of SHIPPING.md), run unchanged; pack sums done outside it.

## 1. Printful

- **Postage** (printful.com/shipping) [fetched]: "Postcards, stickers" USA $4.49 / +$0.05; Canada 5.19 / 0.10; UK and Europe 4.29 / 0.10; Japan 2.99 / 0.08; worldwide 8.29 / 0.25. The 15x3.75 in sticker has its own row (USA 4.69 / 0.15).
- **No cheaper service** [fetched]: methods named are "Flat Rate (Standard)", "Standard rate with CO2 offsetting", "Standard DDP" (Canada, UK) and "Express" (live rates only). No economy, letter or untracked option. API orders use `"shipping": "STANDARD"`, shown as "Flat Rate" (developers.printful.com/docs) [fetched]. Live rates "could occasionally be lower" [snippet, ecommerce-platforms.com]; Printful's help page on them returns 403.
- **No saving in a shared parcel** [fetched]: stickers and mugs are on the list that "ship separately ... due to packaging differences". For such products in different categories, "add the shipping prices from the Single product column of both products' categories". Footnote: "Occasionally, some of these products can be shipped together with other products, but they would still be charged as a single product for the shipping fee." So **tee + sheet = 4.95 + 4.49 = $9.44; mug + sheet = 6.69 + 4.49 = $11.18**, as SHIPPING.md says.
- **Other sticker products** (public catalog API, api.printful.com/products/{id}, no key) [fetched]. All fall under "stickers"; decals and die-cut have no row of their own on the shipping page, so their postage is [not verified].

| Product (id) | Sizes and base price (USD) | Made in |
|---|---|---|
| Kiss-Cut Sticker Sheet (505) | 5.83x8.27 in: 5.15 | US, EU, Latvia, CA, UK, JP, AU |
| Kiss-Cut Stickers (358) | 3x3: 2.34; 4x4: 2.54; 5.5x5.5: 2.74; 15x3.75: 5.47 (US, EU only) | US, EU, Latvia, CA, UK, JP, AU |
| Kiss-Cut Holographic (673) | 3x3: 4.16; 4x4: 4.43; 5.5x5.5: 4.68 | US, EU, UK |
| Die-Cut Stickers (957) | 2x2: 3.86 ... 6x6: 6.08 | US only |
| Kiss-Cut Vinyl Decals (974) | 3x4: 1.23; 4x6: 2.21; 6x8: 4.36; 8x10: 7.80 | US only |

A single 3x3 sticker saves $2.81 of base against the sheet, but the postage is the same $4.49. Nothing at Printful makes one sticker order clearly cheaper to post.

## 2. Other providers (per-order file by API, stickers printed in the USA)

| Provider | Sticker product, base (qty 1) | USA postage, 1st / extra | Tracked | API with file URL | Verdict |
|---|---|---|---|---|---|
| Printify, Kiss-Cut Stickers (blueprint 400) | 2-6 in; base not public without an account; "from $1.27" [snippet] | SPOKE $4.49 / $0.09 (a second US profile $4.79); Printify Choice $4.29 / $0.09 [fetched, api.printify.com, no key] | not verified | yes (`print_areas` URL) [PROVIDERS.md, fetched] | **same postage as Printful** |
| Printify, Kiss-Cut Sticker Sheet (5372) | 5.83x8.27 in, "from USD 5.14" [snippet] | "from USD 4.59" [snippet]; API reads refused ("Unauthenticated") | not verified | yes | no saving |
| Printify Economy | US only, "from $3.99", $2.19 each extra [snippet] | "only if every product in it has this flag enabled" [fetched, developers.printify.com]; not for products made at order time [PROVIDERS.md] | not verified | no (needs saved products) | does not fit unique files |
| Printify, Iowa provider (vinyl decals) | base not public | $4.89 / $0.09, "Tracking available" [fetched, printify.com/shipping-rates/stickers-posters/] | yes | yes | dearer |
| Gooten | kiss-cut, US-made, sizes up to 5.6x8.5 in sheets, packs of 1-100 [fetched, gooten.com] | not public | not verified | yes (one API) | prices need an account |
| Cloudprinter | paper or vinyl, 148x105 mm to 8.5x11 in; "Postal (untracked)" method [fetched, cloudprinter.com/products/stickers] | not public; US print site not stated | untracked option | yes, real-time quotes | prices need an account |
| Prodigi | kiss-cut 3x4 to 14x14 in, "from £0.80", single editions; **made in UK and EU only** [fetched, prodigi.com] | not public; Budget is "generally untracked", US orders tracked [snippet, help.prodigi.com] | US: yes [snippet] | yes [PROVIDERS.md] | posts from abroad to US buyers |
| Sticker it | kiss-cut sheets; files "by URL" per order; ships to USA [fetched, third-party polotno.com page] | not public; print location not stated | not verified | yes | prices need an email |
| Gelato | no sticker product found [snippet]; site blocks automated reads | - | - | yes | ruled out |
| Sticker Mule | "You can only order items you have ordered before"; "Custom items ... are not available through the API" [fetched, stickermule.com/api] | - | - | no | ruled out |
| StickerApp | minimum 10 units or about $26-28 a sheet order [snippet] | - | - | not verified | ruled out |
| SPOD/Spreadconnect, CustomCat, Lulu Direct, StickersAndPosters | no sticker prices or sticker API found (Lulu Direct is books) | - | - | - | not verified |

- **Benchmark only, not usable by us**: Cotton Bureau posts stickers in the US for "a flat $1.99", "completely untracked", US only, no API (blog, 7 Jul 2025) [fetched]. A sheet in an envelope fits US letter limits (11.5 x 6.125 x 0.25 in, 3.5 oz) and travels untracked [snippet]. That price exists only for shops that post themselves.
- **Finding: no provider found with an order API, a unique file per order, US printing and clearly cheaper US postage.** Every published US sticker rate is $4.29-4.89 for the first item, tracked or unknown. The cheap untracked routes (Cloudprinter, Prodigi Budget) have no public price; Prodigi would post from the UK or EU.

## 3. What a second provider costs

A second provider means a second adapter (order, file, status webhook, cancel, reprint), a second account and wallet for the owner to open and top up, a second data processor in the privacy page and the processor list, and a second tax setup (US sales tax on our wholesale orders). A cart with a tee and stickers would become two provider orders with two parcels, two tracking links and two failure paths (TRANSACTIONS.md partial failure doubles). Against that, the best published saving is $0.20 a sticker order (Printify Choice $4.29 vs $4.49). Not worth it.

## 4. The offer (USA, shipping $4.99, free from $35; margin = ours, share of net; "hol" = with the $0.40 US holiday surcharge)

| Order | Buyer pays | Printful (W) | Margin | With hol | Floor |
|---|---|---|---|---|---|
| 1 sheet $13.99 | $18.98 | $9.64 | $7.14 (38%) | $6.71 (35%) | pass |
| 1 sheet $12.99 | $17.98 | $9.64 | $6.18 (34%) | $5.75 (32%) | pass |
| 1 sheet $11.99 | $16.98 | $9.64 | $5.22 (31%) | $4.79 (28%) | pass |
| 1 sheet $10.99 | $15.98 | $9.64 | $4.26 (27%) | $3.83 | FAIL with hol |
| 2 sheets $19.99 | $24.98 | $14.84 | $7.08 (28%) | $6.66 (27%) | pass |
| **2 sheets $21.99** | **$26.98** ($13.49 a sheet) | $14.84 | **$9.01 (33%)** | $8.58 (32%) | pass |
| 2 sheets $22.99 | $27.98 | $14.84 | $9.97 (36%) | $9.54 (34%) | pass |
| 3 sheets $29.99 | $34.98 (just under $35: avoid) | $20.04 | $10.87 (31%) | $10.44 (30%) | pass |
| tee + 1 sheet $13.99 | $40.98 free | $26.51 | $9.39 (23%) | $8.96 (22%) | pass |
| tee + 1 sheet $11.99 | $38.98 free | $26.51 | $7.47 (19%) | $7.04 (18%) | **FAIL** |
| tee + 2 sheets $21.99 | $48.98 free | $31.71 | $11.25 (23%) | $10.83 (22%) | pass |
| mug + 1 sheet $13.99 | $38.97 | $22.40 | $12.06 (31%) | $11.63 (30%) | pass |
| mug + 2 sheets $21.99 | $41.98 free | $27.60 | $9.13 (22%) | $8.70 (21%) | pass |
| mug + tee + 2 sheets | $68.97 free | $44.47 | $16.17 (23%) | $15.75 (23%) | pass |

- **The pack is where postage gets cheap**: the second sheet costs us $5.20 ($5.15 + $0.05). Two sheets for $21.99 bring the buyer's delivered price per sheet from $18.98 to $13.49 and still earn more per order than one sheet ($9.01 vs $7.14).
- **A cheaper single sheet hurts free-shipping carts**: at $11.99 a tee + sheet ships free and drops under 20%. Keep the single at $13.99.
- **"Add-on only" saves nothing**: Printful charges the full $4.49 even in the tee's parcel, and a sticker-only order has the best margin share. Do not restrict it.
- **Other regions** (model C fees): one sheet and the 2-sheet pack pass everywhere (UK $6.36, EU $6.17, Canada $12.14, Japan $10.25 for the pack). Checking every cart of up to 4 items with the pack: **UK and EU fail** on 2 tees + pack ($75.97, free from $70: UK 19.9%, EU 19%). Free from **$80** in UK/EU fixes it (worst then: tee + pack, 21-22%); free from $75 does not. The pack at $22.99 still fails in the EU, and at $23.99 mug + tee + pack lands at $70.97 and fails.
- Wording: "1 sheet $13.99 · 2 sheets $21.99 (one dog or two)". No "save", no "was" price, no timer.

## 5. Recommendation: (b) Printful stickers, sold as 1 sheet or a 2-sheet pack

1. Keep Printful: no API provider found posts US stickers clearly cheaper ($4.29-4.89 everywhere); a second provider would save at most $0.20 an order for a second adapter, account, processor and parcel.
2. Offer **1 sheet $13.99** and **2 sheets $21.99** (same dog or two dogs), shipping $4.99, free from $35 (USA); margins $7.14 (38%) and $9.01 (33%), every US cart checked (up to 6 items, packs at $21.99) passes the floor with the holiday surcharge.
3. The pack turns Printful's $0.05 extra-sheet rate into a lower price per sheet for the buyer ($13.49 delivered), honestly and without discount wording.
4. With the pack, move the UK/EU free-shipping threshold from $70 to $80 (SHIPPING.md section 3; not changed here); add the pack to `cartInputs()` when the shop is built.
5. Keep stickers in the launch; ask a sticker provider for a quote (Gooten, Cloudprinter) only if sticker volume later justifies a second adapter.

**Not verified:** Printify, Gooten, Cloudprinter, Prodigi and Sticker it base prices and US postage for one sheet (need accounts or emails); whether Printful live rates are ever lower for stickers; postage for Printful decals and die-cut stickers; any tracking on Printful sticker parcels; the order mix with packs.
