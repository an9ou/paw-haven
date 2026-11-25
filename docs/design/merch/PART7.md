# Part 7: the legal page drafts (25 Nov 2026)

Drafts for the owner and a professional to check. **Nothing is live**: the shop is shut and unlinked, every page is `noindex`, and each page says
under its title "Draft: to be checked by a professional before the shop opens." This is a draft based on research, **not legal advice**: no page
claims compliance, and no registration, number, address or company form is invented (the unknown seller facts are marked placeholders).

## (a) What was written

| File | What it is |
|---|---|
| `site/merch/terms/index.html` | **Terms of sale**: the short version (5 lines), who we are (seller block), what you're ordering (made to order, personalised, small print differences), your dog and its name (the name rules; we may refuse a name), prices and currency (USD; Stripe's own-currency offer), taxes and import charges by plain rule ("tax may be included, added at checkout, or collected at your door"), paying, how ordering works and when the contract is made (when payment goes through and the Thank you email is sent), the 1-hour cancel, changing your mind (the TRANSACTIONS.md 4 policy text word for word), faults (damaged, misprinted, wrong item, lost: 30 days, photo, reprint or refund, no posting back), if we can't make it, the delay email and the right to cancel the late part, your legal rights (AU/NZ guarantees; UK/EU made-to-order exemption), 18+, our art / your print, liability, the gift code, disputes and chargebacks ("write to us first"), **governing law in a box "To be decided with a professional"**, changes, contact. |
| `site/merch/shipping/index.html` | **Shipping and returns**: the short version, where it's made, how long (2-5 working days printing, then the post), the **fee table by zone** (fee, free-shipping line, the world zone's extra-item fee, door-to-door days; every figure tagged `data-money` / `data-eta` and checked against `catalog.json`), separate parcels, tracking, customs and import tax, "We can't deliver to some places yet.", address problems (7 days), parcels that come back (one free reship), lost parcels, the cancel hour, returns, damaged or misprinted (30 days, photo, email), refunds (timing; the currency you paid). |
| `site/merch/seller/index.html` | **Seller details**: trading name, registered name, kind of business, Hong Kong, BR number, geographic address, person responsible, email, phone (or the on-request option), tax numbers, what we do, who makes and posts, payments, prices. Unknown facts are placeholders. |
| `site/merch/tokushoho/index.html` | **特定商取引法に基づく表記** in Japanese (です・ます), a short English line on top: 販売業者, 運営統括責任者, 所在地, 電話番号 (with the 「請求があれば遅滞なく開示」 option in a box for the professional), メールアドレス, 販売価格, 商品代金以外の必要料金 (送料, 税金, 関税等, 手数料, 通信料), 支払方法, 支払時期, 商品の引渡時期, 申込みの有効期限, 販売数量・その他の条件 (18歳以上, 6点・各3個, 1日の受付数), 返品・交換・キャンセル (受注生産, 不良品, 1時間以内のキャンセル, 遅延, 返金). No 動作環境 (not software). |
| `site/merch/legal.css` | The four pages' styles, loaded after `/style.css` and `/merch/merch.css`: the draft banner, the date line, the page nav, the short-version card, the placeholder mark (`.ph`, yellow with a dashed border), the "to be decided" box (`.decide`), the facts list, the fee table (a card per row on phones), the Japanese face (the system Japanese stack: the site's Japanese font subset only covers the site's own words). |
| `merch/test_legal.js` | Suite `merch_legal` (304 checks, about 5 s): see the file's head. `SHOTS=1` writes `docs/design/merch/part7_shots/<page>_390.png`. |
| `docs/design/merch/part7_shots/` | Each page at 390x844, deviceScaleFactor 2, the top of the page. |

Every page: the site header and footer copied the way `site/merch/index.html` does (the language menu says "The shop is in English for now."), a
page nav between the four pages, "Back to the shop", the footer links (the shop, the four pages, Privacy, Questions, CONTACT US), `/js/site.js`
only, no inline script, no request off the origin. English only (the Japanese notice is the one exception).

**Zones on the shipping page.** The shop page names no zones (it shows one country's fee at a time), so the table names each zone by its own
countries: "The USA and Japan", "Canada, Australia and New Zealand", "The UK and the European Union", "Everywhere else we deliver". No page says
which places are shut; the UK/EU row is there because it is a catalog zone. If the owner would rather not show the UK/EU row while those places are
shut, delete that `<tr>` (the suite then wants it back: it checks one row per catalog zone; drop `uk_eu` from the check too).

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
>   never see your card details. Stripe's own rules are at stripe.com/privacy.
> - **What we keep on our own server:** the order number, what you ordered (product, colour, size, pose, how many), the dog's picture recipe and
>   the name printed on it, the place it went to (the country only), the amounts, refunds, the order's status and dates, and the tracking links.
>   To spot repeated payment problems, we also keep a scrambled one-way code of your email (a keyed hash that can't be turned back into the
>   address). We **don't** store your name, your address or your email address.
> - **Your name and address** are read from Stripe only when the order is sent to our print partner, and passed straight to them. If an address
>   needs fixing, what you type on your order page goes straight to our print partner too.
> - **Who helps us, and what they get:** Stripe (payment, name, address, email); our print partner and its delivery companies (your name, address,
>   the items and the picture to print, to make and deliver your order); Cloudflare (runs our order server and makes the picture we print, which
>   only ever shows your dog); Resend (sends the order emails). Each uses the data only to do that job.
> - **Emails:** only about your order (Thank you, We need your address, On its way, Cancelled, Refunded, Taking longer than we said, A new one is
>   on its way). No newsletters, no offers, no tracking pixels. Stripe also sends its receipt.
> - **How long we keep it:**
>   - the picture we print: 180 days after your order ships (2 days after a cancel, or after a full refund before printing);
>   - the scrambled email code, the dog's recipe and its printed name: 24 months after your order ends;
>   - the order's money facts (what, where to, how much, when, refunds): 7 years, the business records the law asks us to keep;
>   - an order that was never paid: 30 days.
> - **Your choices:** to have your order's details deleted early, or to ask what we hold, write to contact@doodledoggo.app with your order number.
>   For an order that has ended (not during a bank dispute) we delete the scrambled email code, the dog's name, the recipe, the picture and the
>   tracking links, and ask our print partner to delete your name and address. We keep the money facts as the law asks. Stripe keeps its own
>   records as the law asks.
> - **Grown-ups only:** you must be 18 or over to order. If you're younger, ask a parent or carer to order for you.

Children: the existing "Children" section stays; the merch line above covers ordering. The FAQ on the shop page ("Is my dog's picture private?")
already says the picture goes away "about six months after it ships", which matches 180 days.

## (c) For the professional: every point that needs a qualified answer

| # | Point | The draft's position now | Why |
|---|---|---|---|
| 1 | **Governing law and courts** | Terms, "Which law applies" (in a box): Hong Kong law and courts, with the consumer's mandatory home law and home courts kept. | Natural default for a Hong Kong seller; UK, EU and Australian consumer law can't be contracted out of, and EU Rome I art. 6 keeps the consumer's home protections. Choose the wording and whether to name courts at all. |
| 2 | **UK/EU distance-selling information** (CCR 2013 Sch. 2; CRD art. 6) and the **made-to-order exemption** (CCR reg. 28(1)(b); CRD art. 16(c)) | Terms list identity, address (placeholder), email, prices, delivery, payment, the no-cancellation line and the legal-rights line; checkout makes the buyer confirm "It's printed just for me, so it can't be returned if I change my mind." | The exemption only holds if the buyer is told before ordering; a durable-medium confirmation (the Thank you email) may also need the terms or the exemption line. Check the email content, a phone number duty, a complaints line, and whether the EU withdrawal button (art. 11a, from 19 Jun 2026) matters where no right exists. Note: the EU ODR platform link duty ended in 2025 [not verified]. |
| 3 | **UK VAT / EU OSS or IOSS** and price display | Pages never say "VAT included"; the plain rule ("may be included, added at checkout, or collected at your door") stands. | UK and EU are planned shut until registered (TRANSACTIONS 1.1). Once open: UK prices must show VAT-inclusive totals; EU likewise; the `vat_included` note and an "including VAT" line on the shipping table's UK/EU row would be added, and the seller page gets the VAT/IOSS numbers. |
| 4 | **USD-only prices to UK/EU consumers** | USD everywhere; Stripe may offer the buyer's currency at checkout. | UK price-marking and the DMCC Act 2024 (drip pricing), and the EU Price Indication Directive, may expect the total in local currency up front [not verified] (TRANSACTIONS 3.1 clash b). |
| 5 | **US state sales tax** | No line beyond the plain rule; Stripe Tax collects only where registered (nowhere at launch). | When a state registration exists, US prices are tax-exclusive, so the basket line "tax added at checkout" is already true; confirm whether any state needs a notice on the page. |
| 6 | **FTC Mail, Internet or Telephone Order Rule** | We state "printing takes 2 to 5 working days, then the post" and send one "Taking longer than we said" email at 5 working days + 2 days, offering wait or cancel-the-late-part with a full refund. | The Rule needs a reasonable basis for the stated shipping time and a delay notice that gives a **revised shipping date** (or says none is known) and a free way to cancel; a second delay needs the buyer's express consent. Our email (`cloudflare/merch/mail.js` `late`) has no revised date and there is no second notice: see "Where the documents and the code disagree". Refunds for credit cards within one billing cycle: ours go at once. |
| 7 | **Australia / New Zealand** consumer guarantees | "Your legal rights": the guarantees can't be excluded and you keep them; we never write "no refunds", only "no returns if you change your mind". | ACCC: overseas sellers to AU consumers must follow the ACL; a "no refunds" line is misleading. Check whether the liability cap in "What we're responsible for" needs an ACL carve-out sentence. NZ CGA likewise. |
| 8 | **Japan 特定商取引法** | The notice page lists every 法11条 item with placeholders; the phone line offers the 「請求があれば遅滞なく開示」 option; returns special terms (返品特約) are stated and not omitted; Stripe's page is the 最終確認画面 and its custom text carries the returns line. | Does the owner living in Japan make the business (or the owner) a 国内事業者 or give it a 国内の事務所等 (then its address and phone must be shown)? Is the 販売業者 the HK company or the owner as an individual? Must the 最終確認画面 (法12条の6) show all six items on Stripe's page (quantity, total with shipping, payment time and method, delivery time, the returns term)? Stripe's page shows amounts and our two custom lines, not delivery time: may need a Japanese line next to Pay. 総額表示 and consumption tax wording if the seller is ever 課税事業者. |
| 9 | **Hong Kong** | Seller page: trading name, registered name, BR number, address placeholders. | Any HK duty to show BR details online, the Trade Descriptions Ordinance (unfair practices) wording, and the profits-tax "offshore" question for records [not verified]. |
| 10 | **Age 18+** | Terms "Who can order", the basket line and the Stripe consent line. | Contract capacity differs by place; check the wording is enough without age checks, and that the game's audience ("a game for everyone") does not make the shop "directed at children" anywhere (UK Children's Code, COPPA: we collect nothing from children). |
| 11 | **Limitation of liability** | Total responsibility capped at what was paid, with carve-outs for injury by negligence, fraud and non-excludable consumer law; no liability for unforeseeable loss or events outside reasonable control. | Caps are often unenforceable against consumers (UK CRA s.31, EU unfair terms, ACL). Check the cap is lawful or drop it. |
| 12 | **Disputes and chargebacks** | "Please write to us first"; you can still ask your bank; we pause unprinted parts and give the bank the order facts. | Make sure "write to us first" can't be read as limiting the buyer's chargeback rights or any ADR route. |
| 13 | **Refund of shipping on faulty items** | One item: its price (plus the world zone's extra-item fee); shipping only when nothing is left un-refunded. | Under UK CRA / EU rules a rejected faulty item may need the delivery cost refunded too. "If the law gives you more, you get it" covers it in words; the professional may want the shipping rule changed. |
| 14 | **The name the buyer prints** | The buyer confirms the name is theirs to print and not rude or about a real person who hasn't agreed; we may refuse; a refused name after payment is refunded. | Check the IP and personal-data angle of printing a name a buyer types. |
| 15 | **Gift code** | A free extra, no cash value, not every order. | Check it isn't a "prize" or "voucher" under local rules (it's a cosmetic in-game item). |
| 16 | **Privacy (UK GDPR / GDPR)** | The "Merch orders" text above. | Lawful basis (contract; legitimate interest for the email hash), international transfers (Stripe, the print partner, Cloudflare, Resend), and whether an Art. 27 representative is needed once UK or EU buyers are served (TRANSACTIONS 5). |

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

Switches that change the text:
- **Countries opened** (`MERCH_COUNTRIES`): no page lists open or shut places, so nothing changes, except the shipping table's UK/EU row (see (a)).
- **UK VAT or EU registration live**: add "Prices include VAT." to the UK/EU row and the VAT/IOSS number to the seller page; recheck (c) 3-4.
- **A US state registration**: nothing on the pages (the plain tax rule already covers "added at checkout").
- **Gift codes off** (empty pool): the terms already say "not every order gets one"; the section can stay or go.
- **Tee 2XL-4XL prices** (placeholders in `catalog.json`): the pages say only "a little more", so no change.
- **Fees or thresholds changed** in `catalog.js`/`catalog.json`: change the shipping table, the terms prices and the Japanese prices; the suite catches any mismatch.
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

## Where the documents and the code disagree (found while writing)

1. **FTC delay notice**: `cloudflare/merch/mail.js` `late` says "You can wait, or cancel the late part for a full refund" with no **revised
   shipping date** and the ledger sends it once (`late_sent_at`); the FTC Rule wants a revised date (or "we don't know when") and a second notice
   needing express consent if that date is missed. The pages promise only what the code does.
2. **Order rows "7 years"** (TRANSACTIONS 5): `ledger.js` `tidy()` never deletes paid order and line rows, so they stay beyond 7 years. The privacy
   text says 7 years; either add a purge at 7 years or say "at least 7 years".
3. **"Put these back in my basket"** (TRANSACTIONS 2.1 T2.1-18, section 4) is not on the order page in `site/merch/merch.js` yet; the terms say only
   "cancel and order again with the change".
4. **Gift code**: `ledger.js` claims a code only when the paid order has no hold at payment (line 626), so a held order never gets one later; the
   terms' "not every order gets one" covers it.

## Sources (read 25 Nov 2026)

- Consumer Affairs Agency, 特定商取引法ガイド「通信販売」: https://www.no-trouble.caa.go.jp/what/mailorder/ (法11条 items, 省略 on request, 12条の6, 15条の3)
- FTC, Business Guide to the Mail, Internet, or Telephone Order Merchandise Rule: https://www.ftc.gov/business-guidance/resources/business-guide-ftcs-mail-internet-or-telephone-order-merchandise-rule
- legislation.gov.uk, The Consumer Contracts (Information, Cancellation and Additional Charges) Regulations 2013, reg. 28: https://www.legislation.gov.uk/uksi/2013/3134/regulation/28
- Your Europe, Returns and refunds (exceptions for made-to-order or personalised goods): https://europa.eu/youreurope/citizens/consumers/shopping/returns/index_en.htm
- ACCC, Consumer rights and guarantees: https://www.accc.gov.au/consumers/buying-products-and-services/consumer-rights-and-guarantees
- Already in the repo and relied on: `TRANSACTIONS.md` 1-7 and 10, `SHIPPING.md`, `COUNTRIES.md` 5 (UK, EU, AU, Canada, Japan), `PART2.md`, `cloudflare/merch/ledger.js`, `mail.js`, `util.js`.
