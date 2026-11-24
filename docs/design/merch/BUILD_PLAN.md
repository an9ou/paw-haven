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
- No secrets in the repo, logs or chat. No buyer data in D1 beyond TRANSACTIONS.md section 5.
- English first. Translation is one batch at the end (one line in the other 11 languages: "Merch ships to ... in English").
- Words: "Put your dog on a mug". Never words that sound like selling dogs. Money screens as calm as the Kind shop.

## What waits for which answer

| Owner's answer | Parts it changes |
|---|---|
| UK at launch | 3 (countries list), 7 (UK legal text), 10 (VAT registration first) |
| Currencies | 2 (currency switch), 3 (catalog) |
| First products | 1 (which layouts to finish), 2 (tiles), 5 (variants) |
| Returns | 2 (promise text), 7 (terms) |
| Delivery included | 2 (price lines), 3 (catalog prices) |
| Cloudflare plan | 4 (render in a Worker, or a render step outside Cloudflare) |

## The parts

**0. Decisions and accounts [O].** The six open questions (docs/HANDOFF_MERCH.md). Then: a Printful account, the separate Stripe account
(Hong Kong, Stripe Tax on), Workers Paid if the plan is Free, R2 turned on. An accountant's view on UK VAT and US sales tax.

**1. Print art ready for real products.** Files: `merch/*`, `tools/merch_*`.
- Print areas and file sizes per product from Printful's rules (`PRINT_FILES.md`), the tee size settled.
- Dark garments (paper patch or border, light name), the sticker sheet layout with no floating pieces, the 0.5 mm line rule.
- The name: Latin letters, 20 characters, a kind word filter, drawn as outlines.
- `art_ver` stamped on every file. Tests: `merch/test_pawprint.js`, `merch/test_merch_game.js` (byte-identical to the game).
- Done when: sample files for every launch product and 8 test dogs pass an art review at 100% zoom.

**2. The `/merch` page, test mode.** Files: `site/merch/*` (page, css, js), PawPrint for previews. [GM] for `site/tpl/*`, the header tab
and the site build (`tools/cf_*`, `tools/pages.js`).
- The prototype's six steps made real: dogs from the save (`merchFromSave`) or the link (`merchFromHash`), ready-made dogs, live previews.
- The catalog comes from a static file until part 3. The pay button says the shop is not open yet.
- Suite `merch_page`; `paw-fit` at 360x640, 390x844 and 1280x720.

**3. The merch Worker, money faked.** Files: `cloudflare/merch/*` (its own Worker `doodle-doggo-merch`, its own D1 and R2; never
`cloudflare/worker.js`). TRANSACTIONS.md sections 2, 3 and 6.
- Routes: catalog, quote, checkout, order, cancel, address, Stripe webhook, provider webhook, signed file, cron.
- Stripe and the provider are faked in tests (`STRIPE_FETCH`, `PROVIDER_FETCH`). Suite `merch_worker` covers every row of
  TRANSACTIONS.md 2.1 and 2.2 (double taps, events twice or out of order, refund before paid, disputes, rejects).
- Switches: `MERCH_FROM`, `MERCH_OFF`, `MERCH_COUNTRIES`, `MERCH_PRODUCTS`, `MERCH_DAY_CAP`, `MERCH_PROVIDER_MODE`.

**4. The print render.** Files: `cloudflare/merch/print_*` or `merch/print_worker.mjs`.
- Workers Paid: PawPrint + resvg-wasm in a Worker, banded above 3000x3000, PNG to R2, a fresh instance after any trap, a time limit.
- Free plan: the same code as a small render step outside Cloudflare; the Worker keeps the recipe and checks a small proof.
- Test: the server file equals the reference render; every launch product inside the CPU and memory limits.

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
