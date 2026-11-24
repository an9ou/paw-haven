# Merch unit economics with a Hong Kong Stripe account

24 Nov 2026

Research, not tax or accounting advice: an accountant should confirm the tax treatment.

This replaces the table in PROVIDERS.md section 4, which used Stripe Japan fees. The seller's Stripe account is in Hong Kong.
The numbers come from `node tools/merch_econ.js`; change an input at the top of that file and run it again.
Formula (TRANSACTIONS.md section 9, fixed cost `o` shown on its own): margin = P - T - W*(1 + t_w) - f - s - r.

## Inputs

- **Printful base prices** (USD, S-XL, front print): mug 6.07, tee 11.92, sticker sheet 5.15, tote W101 10.18, tote EC8000 15.87, sweatshirt 19.17, hoodie 22.63. Re-read from the public catalog API (api.printful.com/products/19, 71, 505, 1553, 367, 145, 146) on 24 Nov 2026: no change. EC8000 also lists some variants at 14.75; the table uses 15.87. 2XL and up cost $2-8 more. [fetched]
- **Standard shipping, first item** (USD): mug US 6.69 / UK 5.19, tee 4.95 / 4.79, stickers 4.49 / 4.29, tote 4.69 / 4.59, sweatshirt and hoodie 8.79 / 7.29. printful.com/shipping. [from PROVIDERS.md, not re-read]
- **US holiday surcharge** $0.40 per US order until 17 Jan 2027. [from PROVIDERS.md, not re-read]
- **US tax Printful charges us**: about 7% of base + shipping (an average; it varies by state). Placeholder. [from PROVIDERS.md, not re-read]
- **UK**: prices include 20% VAT; the seller is VAT-registered, so Printful's 20% UK VAT is reclaimed. [from PROVIDERS.md, not re-read]
- **Stripe Hong Kong**, stripe.com/en-hk/pricing [fetched]: 3.4% + HK$2.35 for domestic cards; "3.4% + US$0.30 per successful card charge when settled in USD"; +0.5% for international cards; +2% if currency conversion is required; HK$85 per dispute; Stripe Tax 0.5% per transaction (no-code) or HK$3.50 (API), only where registered.
- **GBP fixed fee**: the HK page lists none for GBP. Assumed HK$2.35 converted (about £0.23). Not verified.
- **Multi-currency settlement**, docs.stripe.com/payouts/multi-currency-settlement [fetched]: Hong Kong is on the list. Each settlement currency needs a bank account in that currency. "Stripe charges the applicable fee when funds settle into a non-primary settlement currency." The fee table loads by script and could not be read, so which currencies a HK account may hold, and at what fee, is **not verified**. docs.stripe.com/payouts: "Some additional settlement currencies incur a fee when funds settle." [fetched]
- **FX**: ECB reference rates for 23 Nov 2026 via api.frankfurter.app: $1 = HK$7.8409 (used 7.84), £1 = $1.3074 (used 1.307). [fetched]
- **Reprint reserve** 5% of W; **floor** US$4 and 20% of net price. [TRANSACTIONS.md sections 3 and 9]

## Which Stripe case applies

- **Case 1, domestic rate (3.4%)**: never. Buyers pay with US or UK cards, which are international to a HK account (+0.5%).
- **Case 2, settled in the charge currency (3.9%)**: US orders, once the account turns on USD settlement and adds a USD bank account. The HK pricing page names USD settlement, so this looks available. UK orders only if a HK account can also settle GBP: not verified, and a settlement fee may apply.
- **Case 3, converted to HKD (5.9%)**: the default for any currency without its own settlement balance. Plan UK prices on case 3 until the dashboard shows GBP.
- The fixed fee is US$0.30 on a USD-settled charge, HK$2.35 (about $0.30) otherwise. The difference is under one cent.

## Tables

FX: $1 = HK$7.84, £1 = $1.307. Case 2 = settled in the charge currency (3.9%), case 3 = converted to HKD (5.9%). Margin before fixed costs and income tax.

### USA at current prices (USD, tax-exclusive, no state registered)

| Item | P | W | Tax on W | Reserve | Stripe c2 | Margin c2 | Stripe c3 | Margin c3 | c3 + holiday | Floor c2/c3 | Dispute = orders (c3) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11 oz mug | $21.99 | $12.76 | $0.89 | $0.64 | $1.16 | $6.54 (30%) | $1.60 | $6.10 (28%) | $5.67 (26%) | pass / pass | $26.09 = 4.3 |
| Tee (B+C 3001) | $27.99 | $16.87 | $1.18 | $0.84 | $1.39 | $7.70 (28%) | $1.95 | $7.14 (26%) | $6.72 (24%) | pass / pass | $30.84 = 4.3 |
| Sticker sheet A5 | $15.99 | $9.64 | $0.67 | $0.48 | $0.92 | $4.27 (27%) | $1.24 | $3.95 (25%) | $3.52 (22%) | pass / FAIL | $22.40 = 5.7 |
| Tote W101 | $24.99 | $14.87 | $1.04 | $0.74 | $1.27 | $7.06 (28%) | $1.77 | $6.56 (26%) | $6.13 (25%) | pass / pass | $28.53 = 4.3 |
| Tote EC8000 | $24.99 | $20.56 | $1.44 | $1.03 | $1.27 | $0.69 (3%) | $1.77 | $0.19 (1%) | -$0.24 (-1%) | FAIL / FAIL | $34.62 = n/a (almost no margin) |
| Sweatshirt (18000) | $45.99 | $27.96 | $1.96 | $1.40 | $2.09 | $12.58 (27%) | $3.01 | $11.66 (25%) | $11.23 (24%) | pass / pass | $43.77 = 3.8 |
| Hoodie (18500) | $51.99 | $31.42 | $2.20 | $1.57 | $2.33 | $14.47 (28%) | $3.37 | $13.43 (26%) | $13.00 (25%) | pass / pass | $47.83 = 3.6 |

### UK at current prices (GBP, incl. 20% VAT, VAT-registered)

| Item | P | VAT | W | Stripe Tax | Reserve | Stripe c2 | Margin c2 | Stripe c3 | Margin c3 | Floor c2/c3 | Dispute = orders (c3) |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 11 oz mug | £15.99 | £2.67 | £8.62 | £0.08 | £0.43 | £0.85 | £3.35 (25%) | £1.17 | £3.03 (23%) | pass / FAIL | £18.16 = 6.0 |
| Tee (B+C 3001) | £23.99 | £4.00 | £12.79 | £0.12 | £0.64 | £1.16 | £5.28 (26%) | £1.64 | £4.80 (24%) | pass / pass | £22.84 = 4.8 |
| Sticker sheet A5 | £13.49 | £2.25 | £7.22 | £0.07 | £0.36 | £0.76 | £2.83 (25%) | £1.03 | £2.57 (23%) | FAIL / FAIL | £16.61 = 6.5 |
| Tote EC8000 | £28.99 | £4.83 | £15.65 | £0.14 | £0.78 | £1.36 | £6.22 (26%) | £1.94 | £5.64 (23%) | pass / pass | £26.03 = 4.6 |
| Sweatshirt (18000) | £37.99 | £6.33 | £20.24 | £0.19 | £1.01 | £1.71 | £8.50 (27%) | £2.47 | £7.74 (24%) | pass / pass | £31.20 = 4.0 |
| Hoodie (18500) | £42.99 | £7.17 | £22.89 | £0.21 | £1.14 | £1.91 | £9.67 (27%) | £2.77 | £8.81 (25%) | pass / pass | £34.17 = 3.9 |

### Price needed for a 25% / 30% / 35% margin of net revenue (case 2 → case 3)

| Item | To | Now | 25% | 30% | 35% | Floor at the 25% price (c3) | Lowest price passing the floor |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 11 oz mug | US | $21.99 | $20.99 → $21.99 | $22.99 | $23.99 → $24.99 | pass ($6.10) | $19.99 |
| Tee (B+C 3001) | US | $27.99 | $27.99 | $29.99 | $31.99 → $32.99 | pass ($7.14) | $25.99 |
| Sticker sheet A5 | US | $15.99 | $15.99 → $16.99 | $16.99 → $17.99 | $18.99 | pass ($4.89) | $15.99 → $16.99 |
| Tote W101 | US | $24.99 | $23.99 → $24.99 | $25.99 → $26.99 | $27.99 → $28.99 | pass ($6.56) | $22.99 |
| Tote EC8000 | US | $24.99 | $32.99 → $33.99 | $35.99 → $36.99 | $38.99 → $39.99 | pass ($8.66) | $30.99 → $31.99 |
| Sweatshirt (18000) | US | $45.99 | $44.99 → $45.99 | $47.99 → $49.99 | $51.99 → $53.99 | pass ($11.66) | $41.99 → $42.99 |
| Hoodie (18500) | US | $51.99 | $49.99 → $51.99 | $53.99 → $55.99 | $58.99 → $60.99 | pass ($13.43) | $46.99 → $47.99 |
| 11 oz mug | UK | £15.99 | £15.99 → £16.99 | £17.49 → £17.99 | £18.99 → £19.49 | pass (£3.80) | £15.99 → £16.49 |
| Tee (B+C 3001) | UK | £23.99 | £23.99 → £24.49 | £25.49 → £26.49 | £27.49 → £28.99 | pass (£5.19) | £21.99 → £22.99 |
| Sticker sheet A5 | UK | £13.49 | £13.49 → £13.99 | £14.49 → £15.49 | £15.99 → £16.49 | FAIL (£2.95) | £13.99 → £14.49 |
| Tote EC8000 | UK | £28.99 | £28.99 → £29.99 | £30.99 → £32.49 | £33.49 → £34.99 | pass (£6.41) | £26.99 → £27.99 |
| Sweatshirt (18000) | UK | £37.99 | £36.99 → £38.49 | £39.99 → £41.49 | £43.49 → £44.99 | pass (£8.13) | £34.99 → £35.99 |
| Hoodie (18500) | UK | £42.99 | £41.99 → £43.49 | £45.49 → £46.99 | £48.99 → £50.99 | pass (£9.19) | £38.99 → £40.49 |

### A monthly fixed cost spread over UK orders (GBP per order)

| Monthly cost | 10 orders | 20 orders | 50 orders |
| --- | --- | --- | --- |
| £20 | £2.00 | £1.00 | £0.40 |
| £40 | £4.00 | £2.00 | £0.80 |
| £80 | £8.00 | £4.00 | £1.60 |

FX sensitivity, UK margin at current prices, case 3, at £1 = $1.25 / $1.307 / $1.35: 11 oz mug £2.60 / £3.03 / £3.32; Tee (B+C 3001) £4.18 / £4.80 / £5.24; Sticker sheet A5 £2.21 / £2.57 / £2.81; Tote EC8000 £4.88 / £5.64 / £6.17; Sweatshirt (18000) £6.76 / £7.74 / £8.42; Hoodie (18500) £7.70 / £8.81 / £9.58.

If Stripe Tax is billed per API transaction (HK$3.50, about £0.34) instead of 0.5%, UK margins drop by £0.13 to £0.27 an order.

"Dispute = orders": a lost dispute costs HK$85, the item, the tax on it and the fees, shown as a number of orders' margin. TRANSACTIONS.md
section 9 said about 1.5 orders; that counted only the HK$85. With the item it is 3.6 to 6.5 orders.

## What this means

- Margins are lower than PROVIDERS.md section 4 said: 27-30% (US) and 25-27% (UK) in case 2; 25-28% (US) and 23-25% (UK) in case 3; not "about 30%". The old table had no fixed fee and no reserve.
- **Fails the floor at today's prices**: US tote EC8000 everywhere (use W101 for the US); US sticker sheet in case 3, and in case 2 too while the holiday surcharge runs ($3.84); UK mug in case 3 (£3.03 = $3.96); UK sticker sheet in both cases.
- **Turn on USD settlement** with a USD bank account. It saves 2% on every US order ($0.32-1.04), and the Printful wallet is topped up in USD, so the money never changes currency.
- **Ask Stripe (or check the dashboard) whether a HK account can settle GBP, and the fee.** Until then, price the UK on case 3.
- **Price changes to pass the floor in case 3**: US sticker sheet $16.99; UK mug £16.49; UK sticker sheet £14.49. For a 30% margin in case 3 everywhere, use the 30% column.
- **UK fixed costs decide the UK launch.** £40 a month over 20 UK orders is £2.00 an order, about 40% of a UK tee's margin. At 10 orders it takes most of it.
- **Disputes are expensive.** Radar rules and clear "printed with your dog" product pages matter more than a few pence of price.
- **FX moves UK margins by about 10-15%** for each 5 cents on the pound. A cheaper pound can push the UK mug and tee near the floor.
- Not in the tables: income tax, Printful samples, 2XL+ sizes, extra items in one parcel (cheaper shipping), and any FX cost on paying Printful for UK orders.
