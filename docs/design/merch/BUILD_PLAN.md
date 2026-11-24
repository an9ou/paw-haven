# "My dog" merch: build plan in parts (draft, 24 Nov 2026)

Written by the MERCH session. A plan only: nothing here is built yet. Merch is a **special update**: nothing goes live, on sale or deployed
without the owner's explicit go-ahead and launch date. Tax and legal notes are research, not advice: an accountant confirms them.

Marks: **[O]** only the owner can do or approve it. **[GM]** needs the Game Manager (shared files, merge, deploy). Everything else is the
MERCH session's own work on `merch/shop`, in new files.

## Rules for every part

- Each part ends green on its own test suite and is merged into `merch/shop` before the next one starts. At most 2 working agents at once,
  one test suite at a time. One combined review per part; the three big reviews (code, phone, art) run once, in part 9.
- The shop stays shut in every build: `MERCH_FROM = ''` in the Worker, no link to `/merch` from the site header or the game until launch.
- No real money anywhere before part 10: Stripe sandbox keys, Printful draft orders only (`MERCH_PROVIDER_MODE=draft`).
- No secrets in the repo, logs or chat. No buyer data in the merch Worker's storage beyond TRANSACTIONS.md section 5.
- English first. Translation is one batch at the end (one line in the other 11 languages: "Merch ships to ... in English").
- Words: "Put your dog on a mug". Never words that sound like selling dogs. Money screens as calm as the Kind shop.

## What the owner decided (24 Nov 2026), and what it changes here

| Decision | What it changes |
|---|---|
| Ship everywhere | Zones, not one country: `COUNTRIES.md` tiers. The UK, the EU and Brazil stay shut until a registration (owner + accountant). Parts 2, 3, 7. |
| USD prices only; buyers may pay in their own currency on Stripe | One USD list, Adaptive Pricing on, no GBP list. Needs USD payouts on the Stripe account. Parts 2, 3. |
| Mug and tee only at launch (the owner dropped the sticker sheet later the same day: its postage is too dear, `STICKERS.md`) | Part 1 finishes the mug and the tee. The sticker layout stays in the code, switched off. Parts 2, 3 and 5 list two products. |
| No returns; free reprint or refund; 1-hour cancel | Parts 2, 6, 7 as TRANSACTIONS.md 4. |
| A shipping fee, free over a threshold | **A basket** (up to 6 lines) replaces "one item per order": `SHIPPING.md` section 6. A "Ship to" choice comes first. Parts 2, 3, 5, 6. |
| Free Cloudflare plan | No resvg in a Worker, no R2, no KV, no D1. Part 4 is the Browser Run pipeline of `RENDER_FREE.md` 8 (proven by the test deploy); print files and orders live in SQLite Durable Objects of the merch Worker (TRANSACTIONS.md 6.1). |

Still open (second round of questions, docs/HANDOFF_MERCH.md): the price list and threshold, the launch countries, the test deploy, USD payouts.

## The parts

**0. Decisions and accounts [O].** The second round of questions (docs/HANDOFF_MERCH.md). Then: a Printful account, the separate Stripe
account (Hong Kong, USD payouts, Adaptive Pricing, Stripe Tax). No paid Cloudflare plan and no R2. An accountant's view on the UK, the EU,
Canada, Australia and US sales tax (`COUNTRIES.md` "for the accountant").

**0b. The render test deploy [O approves; GM or MERCH deploys as the owner says].** One throwaway Worker on the Free plan, deleted after
(`RENDER_FREE.md` section 7). It decides part 4: Browser Run, or the GitHub Actions fallback.

**1. Print art ready for real products.** Files: `merch/*`, `tools/merch_*`.
- Print areas and file sizes per product from Printful's rules (`PRINT_FILES.md`), the tee size settled.
- Dark garments (paper patch or border, light name), the sticker sheet layout with no floating pieces, the 0.5 mm line rule.
- The name: Latin letters, 20 characters, a kind word filter, drawn as outlines.
- `art_ver` stamped on every file. Tests: `merch/test_pawprint.js`, `merch/test_merch_game.js` (byte-identical to the game).
- Done when: sample files for every launch product and 8 test dogs pass an art review at 100% zoom.

**2. The `/merch` page, test mode.** Files: `site/merch/*` (page, css, js), PawPrint for previews. [GM] for `site/tpl/*`, the header tab
and the site build (`tools/cf_*`, `tools/pages.js`).
- The prototype's six steps made real: dogs from the save (`merchFromSave`) or the link (`merchFromHash`), ready-made dogs, live previews.
- New against the prototype: a basket (several dogs and things in one order), "Ship to" chosen first, the shipping line and the plain
  "Orders of $N or more ship free" line, USD only, the "tax may be due at the door" line by zone, "Coming soon" for shut countries.
- The catalog comes from a static file until part 3. The pay button says the shop is not open yet.
- Suite `merch_page`; `paw-fit` at 360x640, 390x844 and 1280x720.

**3. The merch Worker, money faked.** Files: `cloudflare/merch/*` (its own Worker `doodle-doggo-merch` with two SQLite Durable Object
classes, `MerchLedger` and `MerchPrints`; no D1, no R2, no KV; never `cloudflare/worker.js`). TRANSACTIONS.md sections 2, 3 and 6.
- Routes: catalog, quote, checkout, order, cancel, address, Stripe webhook, provider webhook, signed file, cron.
- The basket: `merch_order_items`, zones with a fee and a free-shipping threshold, the margin guard on the whole order, a refund per line,
  one parcel and one tracking link per product type (`SHIPPING.md` section 6). TRANSACTIONS.md is rewritten for it first.
- Stripe and the provider are faked in tests (`STRIPE_FETCH`, `PROVIDER_FETCH`). Suite `merch_worker` covers every row of
  TRANSACTIONS.md 2.1 and 2.2 (double taps, events twice or out of order, refund before paid, disputes, rejects).
- Switches: `MERCH_FROM`, `MERCH_OFF`, `MERCH_COUNTRIES`, `MERCH_PRODUCTS`, `MERCH_DAY_CAP`, `MERCH_PROVIDER_MODE`.

**4. The print render.** Files: `cloudflare/merch/print_*`.
- Free plan, first choice: a static print page (`/merch/print/v1/`) where PawPrint draws the dog from the recipe; the Worker asks
  Cloudflare's browser (Browser Run) for a screenshot inside the cooling hour and streams the PNG into a SQLite Durable Object of the
  merch Worker (`MerchPrints`, one per JST day); a signed route serves it.
- Free plan, fallback 1: resvg-wasm inside that Durable Object (proven on Free). Fallback 2: a GitHub Actions job that renders with resvg
  and sends the PNGs back.
- Workers Paid ($5 a month) only if renders pass about 270 orders a day or stored print files pass about 4 GB (about 27 orders a day kept
  180 days; TRANSACTIONS.md 6.6).
- Test: the server file equals the reference render, exact pixel size, clear corners; the Worker stays under 10 ms CPU.

**5. The Printful adapter.** File: `cloudflare/merch/provider_printful.js`.
- `quoteCost`, `createDraft`, `confirm`, `cancel`, `get`, `parseHook`, `catalogCosts`; the nightly margin guard (floor US$4 and 20%).
- Tested against recorded replies. A real draft order (never confirmed) needs the owner's Printful key in the test Worker [O].

**6. Emails, the order page, the thank-you gift.**
- Order emails through Resend (Thank you, On its way, We need your address, Refunded); the order page with tracking and Cancel (1 hour).
- The in-game gift (one cosmetic bandana, code from a gift-code batch) only if the owner wants it. [GM] for the item and the code group.

**7. Legal pages, as drafts for the owner.** Files: `site/merch/terms`, `shipping`, `seller`, and a new part of `/privacy` [GM].
- Terms of sale, shipping and returns, seller details, privacy. Marked "draft: to be checked by a professional" until the owner signs off.

**8. Entry points in the game [GM builds; MERCH writes the brief].** A "Merch" tile in the More tray, "Put this on a mug" under Share my
dog, the confirm sheet, `merchEncode` in the game. Behind a gate that is off until launch. A NEWS entry only at launch.

**9. Reviews and the sandbox run.** Code, phone and art reviews. Then the whole flow on test.doodledoggo.app with Stripe sandbox keys
[O approves the test deploy]: every product, cancel within the hour, refund, a faked provider reject, a test dispute.

**10. Samples and launch [O].**
- The owner orders one sample of every product and colour, made from our real print files. Fix what the samples show.
- A live dry run: day cap 2, one real order, one cancelled order.
- The owner sets the launch date. Only then: the Marketing briefing, the NEWS entry, the translated line, the GM's merge and deploys.

## Order and size

Parts 1, 2 and 3 can run side by side (different files). 4 and 5 follow 3. 6 and 7 follow 3. 8 is the GM's, any time after 2.
Roughly: parts 1 to 3 are the bulk of the work; 4 to 7 are each small; 9 and 10 depend on the owner's time and the post.
