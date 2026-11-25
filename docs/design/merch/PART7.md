# Part 7: the legal page drafts (25 Nov 2026)

Drafts for the owner and a professional to check. **Nothing is live**: the shop is shut and unlinked, every page is `noindex`, and each page says
under its title "Draft: to be checked by a professional before the shop opens." This is a draft based on research, **not legal advice**: no page
claims compliance, and no registration, number, address or company form is invented (the unknown seller facts are marked placeholders).

## (a) What was written

| File | What it is |
|---|---|
| `site/merch/terms/index.html` | **Terms of sale**: the short version (5 lines), who we are (seller block), what you're ordering (made to order, personalised, small print differences), your dog and its name (the name rules; we may refuse a name), prices and currency (USD; Stripe's own-currency offer), taxes and import charges by plain rule ("tax may be included, added at checkout, or collected at your door"), paying, how ordering works and when the contract is made (when payment goes through and the Thank you email is sent), the 1-hour cancel, changing your mind (the TRANSACTIONS.md 4 policy text word for word, with review finding 13's words for the delivery date, and "the 30 days is our own promise"), faults (damaged, misprinted, wrong item, lost: 30 days as our own promise, photo, reprint or refund, no posting back), if we can't make it, the posting promise and the right to cancel the late part, your legal rights (AU/NZ guarantees; UK/EU made-to-order exemption), 18+, our art / your print, liability (no cap), the gift code, disputes and chargebacks ("write to us first"), **governing law in a box "To be decided with a professional"**, changes, contact. |
| `site/merch/shipping/index.html` | **Shipping and returns**: the short version, where it's made, how long (the posting promise, then the post), the **fee table by open zone** (fee, free-shipping line, the world zone's extra-item fee, door-to-door days; every figure tagged `data-money` / `data-eta` inside its own `tr[data-zone]` and checked against `cloudflare/merch/catalog.js`), separate parcels, tracking, customs and import tax, "We can't deliver to some places yet.", address problems (7 days), parcels that come back (one free reship), lost parcels, the cancel hour, returns, damaged or misprinted (30 days, photo, email), refunds (timing; the currency you paid). |
| `site/merch/seller/index.html` | **Seller details**: trading name, registered name, kind of business, Hong Kong, BR number, geographic address, person responsible, email, phone (or the on-request option), tax numbers, what we do, who makes and posts, payments, prices. Unknown facts are placeholders. |
| `site/merch/tokushoho/index.html` | **特定商取引法に基づく表記** in Japanese (です・ます), a short English line on top: 販売業者, 運営統括責任者, 所在地, 電話番号 (with the 「請求があれば遅滞なく開示」 option in a box for the professional), メールアドレス, 販売価格, 商品代金以外の必要料金 (送料, 税金, 関税等, 手数料, 通信料), 支払方法, 支払時期, 商品の引渡時期, 申込みの有効期限, 販売数量・その他の条件 (18歳以上, 「1回のご注文で6種類まで、それぞれ3個までです。」 = 6 lines of up to 3 each, 18 items at most, 1日の受付数), 返品・交換・キャンセル (受注生産, 不良品, 1時間以内のキャンセル, 遅延 (the 7-working-day posting promise), 返金). No 動作環境 (not software). The language menu says 日本語 on this page. |
| `site/merch/legal.css` | The four pages' styles, loaded after `/style.css` and `/merch/merch.css`: the draft banner, the date line, the page nav, the short-version card, the placeholder mark (`.ph`, yellow with a dashed border), the "to be decided" box (`.decide`), the facts list, the fee table (a card per row on phones), the Japanese face (the system Japanese stack: the site's Japanese font subset only covers the site's own words). |
| `merch/test_legal.js` | Suite `merch_legal` (375 checks, about 6 s): see the file's head. It reads `cloudflare/merch/catalog.js` itself (`await import()`): prices, fees, thresholds, extras, eta, `LIMITS`, and `SHIP_BY_DAYS` (part 6 review batch: no "pending" or "note" lines any more; 381 checks). Times catalog.js does not export (the cancel hour, the 7-day address window, the 30 days, the 7 working days) are in one `EXPECT` table at the top, each also checked in its source line. `SHOTS=1` writes `docs/design/merch/part7_shots/<page>_390.png`. |
| `docs/design/merch/part7_shots/` | Each page at 390x844, deviceScaleFactor 2, the top of the page. |

Every page: the site header and footer copied the way `site/merch/index.html` does (the language menu says "The shop is in English for now."), a
page nav between the four pages, "Back to the shop", the footer links (the shop, the four pages, Privacy, Questions, CONTACT US), `/js/site.js`
only, no inline script, no request off the origin. English only (the Japanese notice is the one exception).

**Zones on the shipping page (review finding 3).** Only zones with at least one open country get a row, named only by open places in broad
words: "The USA and Japan", "Canada, Australia and New Zealand", and last "Everywhere else we deliver". Today that leaves out the UK/EU row (all its
countries are shut), and with it the only UK/EU sentences on the shipping page and the Japanese page. "We can't deliver to some places yet." stays.
**How the open set is worked out:** `catalog.js` has no default open set: `lines.js` `openCountries(env)` reads `MERCH_COUNTRIES`, and empty means
none (the launch value is the owner's, TRANSACTIONS 10.1: `all,-uk_eu,-BR,-KR`). So the suite takes the open countries from the `soon` flags of
`site/merch/catalog.json` (the page's stand-in catalog, which follows that launch value) and maps them to zones with `catalog.js` `zoneOf`; nothing
else is read from `catalog.json`. (25 Nov 2026, part 6 review batch: the launch value is now `catalog.js` `LAUNCH_SOON`, and the suite reads the
open zones from it; `catalog.json` is generated from `catalog.js` and the suite fails if its soon flags or delivery times differ.) The rows must equal those open zones exactly, in catalog order, with the world row last.

**Delivery times (review finding 1).** `cloudflare/merch/catalog.js` `ZONES[*].eta` is the single source: today (part 6 review batch, 25 Nov 2026)
us_jp 5-11, ca_au_nz 4-16, world 7-27 working days (2 + the fastest post to `SHIP_BY_DAYS` + the slowest; estimates until part 5). Each figure sits in a `data-eta` span inside its zone's `[data-zone]` (the fee table row; on the Japanese page a `data-zone="us_jp"`
paragraph). When `catalog.js` changes, the suite fails until the pages follow. `catalog.json` is generated from `catalog.js` (`tools/merch_catalog_json.js`); the suite fails if it differs.

**The posting promise (review finding 4).** One sentence everywhere (shipping "How long it takes", terms "If it's taking longer", the Japanese
引渡時期 and 遅延 lines), in the class `shipby`:
> Printing usually takes 2 to 5 working days, and we post every order within 7 working days of payment. If we can't, we email you by that day
> with a new date, and you can wait or cancel the late part for a full refund. You can cancel the late part any time until it's posted.

(25 Nov 2026, part 6 review batch: "before that day" became "by that day", since the delay email goes at the moment of `ship_by`; and the terms,
shipping and Japanese pages add, in the class `lateauto`: "If the new date passes too and you haven't told us you'd rather keep waiting, we refund
the late part by itself." / 「新しい発送予定日までにも発送できず、注文ページで「Keep waiting」（このまま待つ）を選んでいただいていない場合は、遅れている分を自動で全額返金します。」)

Japanese: 「印刷には通常2〜5営業日かかり、どのご注文もお支払いから7営業日以内に発送します。発送できない場合は、その日までに新しい発送予定日をメールでお知らせします。
そのままお待ちいただくか、遅れている分をキャンセルして全額返金を受けるか、お選びいただけます。遅れている分は、発送されるまでいつでもキャンセルできます。」
The Worker follows (part 6 review batch, 25 Nov 2026): `SHIP_BY_DAYS` = 7 in `catalog.js`, `ship_by` = 7 working days, the delay email at
`ship_by` with a new date, a second notice or the automatic refund at the new date (PART6.md "Review fixes").

### When the UK or the EU opens (kept ready, not on the pages today)

The row, as it stood (put it back between the Canada row and the world row; the suite then wants it, as soon as `catalog.json` marks a UK/EU
country open):

```html
<tr data-zone="uk_eu"><th scope="row">The UK and the European Union</th><td data-label="Shipping"><span class="money" data-money="zone.uk_eu.fee">$5.99</span> an order</td><td data-label="Free shipping">Orders of <span class="money" data-money="zone.uk_eu.free_from">$70</span> or more ship free.</td><td data-label="Door to door">about <span data-eta="uk_eu">5 to 25</span> working days</td></tr>
```

Name the row only by the places that are open (for example "The UK" if only GB opens). The sentences that come back with it, only once true:
"Prices include VAT." in that row (only while a UK or EU VAT/IOSS registration is live in Stripe Tax, `REGISTERED` in `catalog.js`), and the
VAT/IOSS number on the seller page. **To decide first:** the VAT/OSS/IOSS registrations (TRANSACTIONS 1.1); whether USD-only prices meet UK and
EU price rules ((c) 4); a GPSR responsible person in the EU and EU textile labels before purchase ((c) 19, 20); whether an Art. 27 representative
is needed ((c) 16); the eta in `catalog.js` (5-25 today, much longer than the other zones: confirm with the print partner's real UK/EU facilities);
and whether `catalog.js` should put GF, GP, MQ, RE, YT, MF, MC and IM in this zone (`catalog.json` does, `zoneOf` does not).

**Small choices made here** (the owner may choose otherwise): "wrong item, colour or size" is listed with damage and misprints (Printful's claims
cover it; TRANSACTIONS.md 4 names damage, misprint and loss); "a photo is enough: we don't ask you to post anything back" (TRANSACTIONS.md 4 has no
send-back step); the statement descriptor "DOODLEDOGGO MERCH" is named (TRANSACTIONS.md 1); refund timing says "a few days, sometimes up to 10
working days" (Stripe's usual 5-10 business days).

## (b) "Merch orders" for `/privacy` (ready to paste; English; the Game Manager adds it to `site/tpl/privacy.tpl` and the i18n keys)

Suggested place: after "Purchases". Suggested keys `privacy.merch.*`. Also add to "Where it is kept": "Merch orders: see Merch orders above."

> **Merch orders**
>
> In the merch shop you can order a mug or a tee printed with your own dog. You don't need an account, and the game sends nothing to the shop
> except how your dog looks, in the link you open.
>
> - **Payment and address go to Stripe.** You type your name, address and email on Stripe's secure payment page. Stripe handles the payment; we
>   never see your card details. For some uses (for example, to stop fraud and to follow the law that applies to it), Stripe decides on its own
>   how it uses the data, under its own privacy notice at stripe.com/privacy.
> - **What we keep on our own server:** the order number, what you ordered (product, colour, size, pose, how many), the dog's picture recipe (it
>   also carries your dog's name) and the name printed on it, the place it went to (the country only), the amounts and tax, refunds, the order's
>   status and dates, and each parcel's carrier and tracking link. To spot repeated payment problems, we also keep a scrambled one-way code of your
>   email (a keyed hash that can't be turned back into the address). We **don't** store your name, your address or your email address.
> - **To slow down misuse,** when someone asks our server for a price, a payment page or an order page, we count the requests from that internet
>   address for an hour, under a scrambled code of the address (not the address itself). The count is deleted at our next nightly tidy-up, so
>   within about a day.
> - **Your order page:** anyone who has the link to your order page can see it (what you ordered, your dog and its name, the amounts, the parcels
>   and their tracking links, and any gift code) and use its buttons (cancel within the hour, fix an address). It never shows your address or your
>   email. Please keep the link to yourself.
> - **Your name and address** are read from Stripe only when the order is sent to our print partner, and passed straight to them. If an address
>   needs fixing, what you type on your order page goes straight to our print partner too.
> - **Who helps us, and what they get:** Stripe (payment, name, address, email); our print partner and its delivery companies (your name, address,
>   the items and the picture to print, to make and deliver your order); Cloudflare (runs our order server and makes the picture we print, which
>   only ever shows your dog); Resend (sends the order emails). Each uses the data only to do that job for us (Stripe also as said above).
> - **Emails:** only about your order: Thank you, We need your address, On its way, Cancelled, Refunded, Sorry we couldn't print one thing,
>   Taking longer than we said (with a new date, and again if that date slips), A new one is on its way. No newsletters, no offers, no tracking
>   pixels. Stripe also sends its receipt.
> - **Emails and photos you send us** (for example, a photo of a broken mug) stay in our mailbox at contact@doodledoggo.app for 24 months after
>   your order ends, then we delete them. [Proposal: the owner confirms the 24 months.]
> - **How long we keep it:**
>   - the picture we print: 180 days after it ships; 2 days after a cancel, after a full refund before printing, or after our print partner
>     couldn't print it;
>   - the scrambled email code, the dog's recipe and its printed name: 24 months after your order ends;
>   - the order's money facts (what, where to, how much, when, refunds) and the parcels' tracking links: at least 7 years, the business and tax
>     records the law asks us to keep;
>   - an order that was never paid: 30 days;
>   - if a payment is disputed with a bank, a block on that scrambled email code, so it can't be used to order again; it stays while the block
>     stands, even if you ask us to delete your order's details.
> - **Your choices:** to have your order's details deleted early, or to ask what we hold, write to contact@doodledoggo.app with your order number.
>   For an order that has ended (not during a bank dispute) we delete the scrambled email code, the dog's name, the recipe, the picture and the
>   tracking links, and ask our print partner to delete your name and address. We keep the money facts as the law asks, and a dispute block as
>   said above. Stripe keeps its own records as the law asks. If you're unhappy with how we handle your data, you can also complain to a data
>   protection authority, for example the one where you live.
> - **Grown-ups only:** you must be 18 or over to order. If you're younger, ask a parent or carer to order for you.

Children: the existing "Children" section stays; the merch line above covers ordering. The FAQ on the shop page ("Is my dog's picture private?")
already says the picture goes away "about six months after it ships", which matches 180 days.

**Checked against the code (25 Nov 2026, review finding 6):** order and line rows are never deleted by `ledger.js` `tidy()` (hence "at least 7
years"); print files `keep_until` = shipped + 180 days (`ledger.js` 769), cancel and refund before printing + 2 days (420, 450, 696); a line the
print partner rejected keeps its file with `keep_until` null, i.e. for ever (`ledger.js` 1027, 1033): the text says 2 days, which the Worker batch
makes true (see "Where the documents and the code disagree" 5); tracking links (`merch_parcels.tracking_url`) are not cleared by `tidy()`, only by
`forget`; rate rows (`merch_rate`, `ledger.js` 154-158) hold an IP HMAC for an hour (`reset_at`) and go at the nightly `tidy()`; block flags
(`merch_flags`, 614, 720) keep `e:<email hash>` with no end date and survive `forget`; the order page (`page()`, `ledger.js` 315) shows lines with
the name and recipe, parcels with tracking, totals and the gift code, never an address or email; the emails are `mail.js` 8-16.

## (c) For the professional: every point that needs a qualified answer

| # | Point | The draft's position now | Why |
|---|---|---|---|
| 1 | **Governing law and courts** | Terms, "Which law applies" (in a box): Hong Kong law and courts, with the consumer's mandatory home law and home courts kept. | Natural default for a Hong Kong seller; UK, EU and Australian consumer law can't be contracted out of, and EU Rome I art. 6 keeps the consumer's home protections. Choose the wording and whether to name courts at all. |
| 2 | **UK/EU distance-selling information** (CCR 2013 Sch. 2; CRD art. 6) and the **made-to-order exemption** (CCR reg. 28(1)(b); CRD art. 16(c)) | Terms list identity, address (placeholder), email, prices, delivery, payment, the no-cancellation line and the legal-rights line; checkout makes the buyer confirm "It's printed just for me, so it can't be returned if I change my mind." | The exemption only holds if the buyer is told before ordering; a durable-medium confirmation (the Thank you email) may also need the terms or the exemption line. Check the email content, a phone number duty, a complaints line, and whether the EU withdrawal button (art. 11a, from 19 Jun 2026) matters where no right exists. Note: the EU ODR platform link duty ended in 2025 [not verified]. |
| 3 | **UK VAT / EU OSS or IOSS** and price display | Pages never say "VAT included"; the plain rule ("may be included, added at checkout, or collected at your door") stands. | UK and EU are planned shut until registered (TRANSACTIONS 1.1). Once open: UK prices must show VAT-inclusive totals; EU likewise; the `vat_included` note and an "including VAT" line on the shipping table's UK/EU row would be added, and the seller page gets the VAT/IOSS numbers. |
| 4 | **USD-only prices to UK/EU consumers** | USD everywhere; Stripe may offer the buyer's currency at checkout. | UK price-marking and the DMCC Act 2024 (drip pricing), and the EU Price Indication Directive, may expect the total in local currency up front [not verified] (TRANSACTIONS 3.1 clash b). |
| 5 | **US state sales tax** | No line beyond the plain rule; Stripe Tax collects only where registered (nowhere at launch). | When a state registration exists, US prices are tax-exclusive, so the basket line "tax added at checkout" is already true; confirm whether any state needs a notice on the page. |
| 6 | **FTC Mail, Internet or Telephone Order Rule** | One promise on every page: "Printing usually takes 2 to 5 working days, and we post every order within 7 working days of payment. If we can't, we email you by that day with a new date, and you can wait or cancel the late part for a full refund. You can cancel the late part any time until it's posted." The code matches since the part 6 review batch: `SHIP_BY_DAYS` = 7, the delay email at `ship_by` with a definite new date, "Keep waiting" recorded; at the new date a second notice (keep waiting said) or the late part refunded by itself (TRANSACTIONS 10 point 13). | The Rule needs a reasonable basis for the stated shipping time (is 7 working days safe with the print partner's real times and holidays?) and a delay notice **by the promised date** with a **revised shipping date** (or "we don't know when") and a free way to cancel; a second delay needs the buyer's express consent (or the order is cancelled and refunded), and "cancel any time until posted" may need saying in the second notice too. Refunds for credit cards within one billing cycle: ours go at once. |
| 7 | **Australia / New Zealand** consumer guarantees | "Your legal rights": the guarantees can't be excluded and you keep them; we never write "no refunds", only "no returns if you change your mind". The liability cap is gone; the 30 days is "our own promise ... the law where you live may give you longer, so write to us anyway". | ACCC: overseas sellers to AU consumers must follow the ACL; a "no refunds" line is misleading. Our "we reprint it or refund it" promise is probably a **warranty against defects**, which must carry the mandatory text of the ACL regulations (Competition and Consumer Regulations 2010 reg. 90) [not verified]: wording and where it goes (the terms, the Thank you email). NZ CGA likewise. |
| 8 | **Japan 特定商取引法** | The notice page lists every 法11条 item with placeholders; the phone line offers the 「請求があれば遅滞なく開示」 option; returns special terms (返品特約) are stated and not omitted; Stripe's page is the 最終確認画面 and its custom text carries the returns line. | Does the owner living in Japan make the business (or the owner) a 国内事業者 or give it a 国内の事務所等 (then its address and phone must be shown)? Is the 販売業者 the HK company or the owner as an individual? Must the 最終確認画面 (法12条の6) show all six items on Stripe's page (quantity, total with shipping, payment time and method, delivery time, the returns term)? Stripe's page shows amounts and our two custom lines, not delivery time: may need a Japanese line next to Pay. 総額表示 and consumption tax wording if the seller is ever 課税事業者. |
| 9 | **Hong Kong** | Seller page: trading name, registered name, BR number, address placeholders. | Any HK duty to show BR details online, the Trade Descriptions Ordinance (unfair practices) wording, and the profits-tax "offshore" question for records [not verified]. |
| 10 | **Age 18+** | Terms "Who can order", the basket line and the Stripe consent line. | Contract capacity differs by place; check the wording is enough without age checks, and that the game's audience ("a game for everyone") does not make the shop "directed at children" anywhere (UK Children's Code, COPPA: we collect nothing from children). |
| 11 | **Limitation of liability** | **Cap dropped** (review finding 5): no "no more than what you paid" bullet. Kept: we're responsible for doing what the terms promise with reasonable care and skill; not for losses nobody could have expected or delays outside our reasonable control (with the late-part cancel still offered); nothing limits what the law doesn't allow (injury by negligence, fraud, non-excludable consumer law). | Check the two kept bullets against UK CRA s.31 and s.57, the EU Unfair Terms Directive, the ACL (s.64, s.29(1)(m)) and 消費者契約法 8条 and 10条; whether "losses nobody could have expected" needs rewording for each. |
| 12 | **Disputes and chargebacks** | "Please write to us first"; you can still ask your bank; we pause unprinted parts and give the bank the order facts. | Make sure "write to us first" can't be read as limiting the buyer's chargeback rights or any ADR route. |
| 13 | **Refund of shipping on faulty items** | One item: its price, its share of any tax paid on it, and in the world zone its extra-item fee; the shipping when every item has been refunded. | Under UK CRA / EU rules a rejected faulty item may need the delivery cost refunded too. "If the law gives you more, you get it" covers it in words; the professional may want the shipping rule changed. |
| 14 | **The name the buyer prints** | The buyer confirms the name is theirs to print and not rude or about a real person who hasn't agreed; we may refuse; a refused name after payment is refunded. | Check the IP and personal-data angle of printing a name a buyer types. |
| 15 | **Gift code** | A free extra, no cash value, not every order. | Check it isn't a "prize" or "voucher" under local rules (it's a cosmetic in-game item). |
| 16 | **Privacy (UK GDPR / GDPR)** | The "Merch orders" text above. | Lawful basis (contract; legitimate interest for the email hash), international transfers (Stripe, the print partner, Cloudflare, Resend), and whether an Art. 27 representative is needed once UK or EU buyers are served (TRANSACTIONS 5). |
| 17 | **US: Textile Act labelling for the tees** (16 CFR 303.34: country of origin and fibre content in mail-order advertising) | The pages say only "a unisex adult tee"; no fibre content and no "Made in USA / Imported". | The rule wants origin (and, by practice, fibre) shown in the catalog description before purchase: the shop page's product text and maybe the terms. Needs the print partner's real blank and facility facts (part 5). |
| 18 | **US: California Prop 65 and food-contact rules for the ceramic mugs** | Nothing on the pages. | Whether a Prop 65 warning is needed for the mug (glaze, lead) and who gives it (the print partner's blanks may already carry it); food-safe and dishwasher wording. |
| 19 | **EU (before it opens): GPSR** (Regulation 2023/988) | Nothing (the EU is shut). | An EU responsible person, and the product safety information on the listing (maker, contact, warnings), before any EU sale. |
| 20 | **EU (before it opens): textile labelling** (Regulation 1007/2011) | Nothing (the EU is shut). | Fibre composition must be shown before purchase in distance selling. Same facts as 17. |
| 21 | **Japan: 消費者契約法 8条 and 10条** | The cap is dropped; the 30 days reads as our own promise on the terms and shipping pages, and on the Japanese page 「この30日は当店独自のお約束です。お住まいの国や地域の法律で、より長い期間が認められることもありますので、30日を過ぎていてもまずご連絡ください。」 | Check that nothing left limits liability or shortens the buyer's rights in a way 8条 or 10条 makes void, and that 「専門家」 wording and the 返品特約 are enough. |
| 22 | **Japan: 景品表示法 and the gift code** | Terms: "a free extra ... no cash value ... not every order gets one". The Japanese page does not mention it. | Whether a gift code that comes with a purchase is a 景品類 (総付景品, limits by value) and needs to be named on the Japanese page. |
| 23 | **Japan: APPI foreign transfers** (個人情報保護法 28条) | The privacy text (b) names Stripe, the print partner, Cloudflare and Resend, but not the countries they are in or the other country's rules. | Japanese buyers' data goes abroad (the seller is in Hong Kong; the processors in the US and elsewhere): the information the law wants given before consent, or the "equivalent measures" route. |
| 24 | **Hong Kong: PDPO collection statement** (DPP1) | The privacy text (b) says what we collect and why, who gets it and how to ask for it; no separate "Personal Information Collection Statement". | Whether the shop needs a PICS shown at or before collection (on Stripe's page we collect nothing ourselves; the order page and emails), and the DPP1 items (purpose, transferees, access and correction rights). |
| 25 | **Processor agreements** | None signed yet. The privacy text says each helper uses the data only to do its job. | Data processing terms with the print partner, Resend and Cloudflare (and Stripe's own as processor for part of its work); whether their standard online terms are enough under GDPR art. 28, APPI and PDPO. |
| 26 | **Accessibility** | The pages pass the suite's own checks (text at least 4.5:1, body text at least 15 px, taps at least 44 px, no sideways scroll at 360 px); no formal audit. | Whether any place the shop serves requires a stated accessibility standard for a small online shop (the EU Accessibility Act from 28 Jun 2025 has a micro-enterprise exemption [not verified]). |

## (d) For the owner: facts to fill in, and switches that change the text

Facts (every one is a yellow `[...]` placeholder; the suite fails if a bracket is left unmarked):
- The seller's **registered name**, and that **"Doodle Doggo"** is the trading name on the Business Registration (terms, seller, tokushoho).
- The **kind of business** (sole proprietorship, partnership or company) (seller).
- The **Hong Kong BR number** (terms, seller, tokushoho).
- A **geographic business address** (not a PO box) (seller, tokushoho), and, with the professional, whether a Japanese address must also be shown (tokushoho).
- The **person responsible** (運営統括責任者) (seller, tokushoho).
- **Phone**: a number, or the "on request, without delay" option (seller, tokushoho). With the option, the owner must answer requests by email quickly.
- **Tax numbers** once any exist (seller).
- Confirm the Stripe **statement descriptor** "DOODLEDOGGO MERCH" (terms, seller) and the **payment methods** (the tokushoho page names cards, Apple Pay and Google Pay as examples).
- **Where Japanese orders are made** (tokushoho, 関税など): the line 「日本国内で作れない商品は、海外から届くことがあります。」 assumes the print partner makes some items in Japan; it is marked 「[未確認：…]」 until the print partner's facility facts (part 5) say where mugs and tees for Japan are printed. The owner and the professional confirm it, and whether Japanese buyers may then pay 関税 or 輸入消費税.
- **How long we keep buyers' emails and photos** in the contact@ mailbox: the privacy text (b) proposes 24 months after the order ends.

Switches that change the text:
- **Countries opened** (`MERCH_COUNTRIES`; its recommended launch value is `catalog.js` `LAUNCH_SOON`, which `site/merch/catalog.json` and the suite follow): no page lists open or shut places. A zone row appears on the shipping page only while at least one of its countries is open; the suite wants exactly the open zones. When the UK or the EU opens, see (a) "When the UK or the EU opens".
- **UK VAT or EU registration live**: add "Prices include VAT." to the UK/EU row (kept in (a)) and the VAT/IOSS number to the seller page; recheck (c) 3-4, 19-20.
- **A US state registration**: nothing on the pages (the plain tax rule already covers "added at checkout").
- **Gift codes off** (empty pool): the terms already say "not every order gets one"; the section can stay or go.
- **Tee 2XL-4XL prices** (placeholders in `catalog.json`): the pages say only "a little more", so no change.
- **Fees, thresholds, eta, LIMITS or `SHIP_BY_DAYS` changed** in `cloudflare/merch/catalog.js` (the single source): change the shipping table, the terms prices and limits, and the Japanese prices, limits and times; the suite fails until they match.
- **"Put these back in my basket"** on the cancelled order page (TRANSACTIONS 4) once it exists: the terms' cancel section can say so.

## (e) What the Game Manager must do at launch

1. Fill the owner's facts (d) and the professional's answers (c); remove the draft banner and the "Last updated ... (draft)" marks, and the suite's
   draft checks with them; set the real date.
2. Link the pages: the shop footer (`site/merch/index.html` "Terms of sale" and "Shipping and returns" spans, plus Seller details and 特定商取引法に基づく表記),
   the "By paying you agree to the Terms of sale" line next to Pay, and the site footer at launch only.
3. Paste "Merch orders" (b) into `site/tpl/privacy.tpl` with i18n keys; translate in the release's one batch.
4. Stripe Dashboard of the merch account: **Terms of service URL** `https://doodledoggo.app/merch/terms/` (Checkout's `consent_collection` needs
   it), the statement descriptor, the receipt settings; the privacy URL `https://doodledoggo.app/privacy`.
5. Keep `/merch/` out of live site deploys until launch (`tools/cf_site.js` walks all of `site/`: PART2.md "For the Game Manager"); at launch drop
   `noindex` if the owner wants the pages found.
6. Register the suite in `game/run_tests.js` as `merch_legal` (`node merch/test_legal.js`, needs Playwright).
7. The Japanese notice is needed only if Japan is open (it is in the plan); link it from the shop footer and next to Pay for Japanese buyers.

## Where the documents and the code disagree (found while writing, and at the review)

Re-checked at the part 6 review batch (25 Nov 2026, PART6.md "Review fixes"): the posting promise and the delay notice (`SHIP_BY_DAYS`, a new
date, the second notice, the automatic refund), "at least 7 years" and "the last day of the delivery time shown for your order" in TRANSACTIONS
4 and 5, "Put these back in my basket", the gift (shown after the cancel hour; a held order gets one when released), a rejected line's print file
(2 days), the stand-in catalog (generated from `catalog.js`), and the four order-page features the pages promise (cancel the late part, the
address form, every parcel's tracking link, "Delivered" once the carrier says so) are now true in the code. Left:

1. **The import-tax note** (review finding 9): the basket shows `import_tax` only for the world zone, while Japanese (and other) orders made abroad
   may pay duty too. The pages now say only "for some places your basket reminds you"; part 5 decides the note for every zone that may cross a
   border, with the print partner's real facilities.
2. **Dispute block flags have no end date** (`merch_flags`; `forget` leaves them): the privacy text says "it stays while the block stands". The
   owner may want an end date (for example 24 months), then the text says it.
3. **The zone of the Isle of Man, Monaco, France's overseas departments and Saint Martin**: `catalog.js` `zoneOf` puts them in `world`; they are
   shut at launch (`LAUNCH_SOON`), so no page names them. Decide their zone before the UK or the EU opens.

## Review fixes (25 Nov 2026)

From `docs/reviews/MERCH_PART7_review.md`. P7 = fixed here; W = left for the Worker / part 6 batch.

| # | What changed here (P7) | Left for the Worker batch (W) |
|---|---|---|
| 1 | Shipping table and the Japanese 引渡時期 show `catalog.js` eta (5-9, 5-14, 7-25), each in a `data-eta` inside its own `[data-zone]`; the suite imports `catalog.js` (eta, fees, thresholds, extras, prices, LIMITS). | Done in the part 6 review batch: `catalog.json` generated; eta 5-11, 4-16, 7-27 (estimates until part 5). |
| 2 | 「1回のご注文で6種類まで、それぞれ3個までです。」; (a) says so; the suite checks it against LIMITS and that any 「N点」 is 18. | - |
| 3 | UK/EU row and UK/EU-only words gone from the shipping and Japanese pages; rows = open zones (suite); the row and what to decide first kept in (a) "When the UK or the EU opens". | - |
| 4 | One posting promise (7 working days, a new date before that day, cancel the late part until posted) on terms, shipping and tokushoho; the suite checks it word for word, and against `SHIP_BY_DAYS` once exported ("pending" line until then). | Done in the part 6 review batch ("by that day" now). |
| 5 | Liability cap bullet dropped; the 30 days is "our own promise ... the law where you live may give you longer, so write to us anyway" (terms, shipping; Japanese on tokushoho); AU reg. 90 text in (c) 7. | - |
| 6 | Privacy text (b) rewritten: at least 7 years, print files incl. rejected lines (2 days), tracking links, IP rate counts (within a day), the dispute block, the recipe carries the name, mailbox 24 months [proposal], the order link, Stripe as its own controller, all eight emails, the right to complain. | Done in the part 6 review batch. |
| 7 | Listed in "Where the documents and the code disagree" 6. | Done (re-checked in the part 6 review batch). |
| 8 | Line refunds include "its share of any tax you paid on it" (terms, shipping, tokushoho); the same-rate sentence softened. | Settle partial refunds in a converted currency in the sandbox (TRANSACTIONS 3.1 point 3). |
| 9 | "Your basket says so" softened to "for some places your basket reminds you ...; please check your own country's rules" (terms, shipping). | The note for every zone that may cross a border (part 5). |
| 10 | The suite: reads `catalog.js`; zone figures tied to their own `[data-zone]` row; rows = open zones exactly, world last; LIMITS (6, 3, 18); the cancel hour, 7 days, 30 days and 7 working days from one `EXPECT` table, each also checked in its source line; BANNED_JA has プリントフル, all text NFKC-folded so full-width Latin "printful" is caught; the Japanese limit sentence; no "latest delivery date", no cap, no "un-refunded". 304 -> 375 checks. | - |
| 11 | (c) 6, 7, 11, 13 updated; (c) 17-26 added (Textile Act, Prop 65, GPSR, EU textile labels, 消費者契約法, 景品表示法, APPI, PDPO, processor agreements, accessibility). | - |
| 12 | "When every item has been refunded, the shipping is refunded too." (terms, shipping); "These are usual times". | - |
| 13 | "the last day of the delivery time shown for your order" everywhere (Japanese: 「ご注文に表示したお届け目安の最終日」). | Done in the part 6 review batch. |
| 14 | Japanese page: the language menu says 日本語 (with English as the other choice); 「保護者の方からご注文ください」; 遅延 rewritten for the 7-working-day promise; 「日本国内で作れない商品は…」 marked 「[未確認：…]」 and listed in (d). | Where Japanese orders are printed (part 5). |

Screenshots in `part7_shots/` refreshed (390x844, dpr 2); every page looked at by hand at 360x640 and 1280x720 after the changes (the fit checks
pass at 360, 390 and 1280). The posting-promise paragraph uses the class `shipby`, not `promise` (`merch.css` already styles `.promise` as the
shop's promise card).

## Sources (read 25 Nov 2026)

- Consumer Affairs Agency, 特定商取引法ガイド「通信販売」: https://www.no-trouble.caa.go.jp/what/mailorder/ (法11条 items, 省略 on request, 12条の6, 15条の3)
- FTC, Business Guide to the Mail, Internet, or Telephone Order Merchandise Rule: https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule
- legislation.gov.uk, The Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, reg. 28: https://www.legislation.gov.uk/uksi/2013/3134/regulation/28
- Your Europe, Returns and refunds (exceptions for made-to-order or personalised goods): https://europa.eu/youreurope/citizens/consumers/shopping/returns/index_en.htm
- ACCC, Consumer rights and guarantees: https://www.accc.gov.au/consumers/buying-products-and-services/consumer-rights-and-guarantees
- Already in the repo and relied on: `TRANSACTIONS.md` 1-7 and 10, `SHIPPING.md`, `COUNTRIES.md` 5 (UK, EU, AU, Canada, Japan), `PART2.md`, `cloudflare/merch/ledger.js`, `mail.js`, `util.js`.
