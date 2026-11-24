# Handoff: Doodle Doggo · MERCH session

Written by the Game Manager (GM), 24 Nov 2026 (JST). This session owns the "My dog" merch shop. Read `CLAUDE.md` (the owner's standing
rules apply to you too), then this file, then `docs/design/merch/`.

## What the owner asked for (23-24 Nov 2026)

- A merch shop on doodledoggo.app where **each player prints their own in-game dog** on real things (cups, tees, sweaters...), choosing
  their favourite dog. "Go straight to my-dog printing." Buyers: **mostly USA and UK, not Asia.**
- The owner wants a separate session for it (this one), briefed with the house rules.

## Where things stand

Branch `merch/shop` (from the spike branch `claude/merch-print` + main). Nothing is built into the site or the game, nothing is deployed,
no payment code exists.

| Piece | Where | State |
|---|---|---|
| Provider research | `docs/design/merch/PROVIDERS.md` | Done. Recommend **Printful** (prints in the USA and the UK, per-order unique file by API, draft orders, no sandbox), backup Gelato; Fourthwall = merchant-of-record alternative (checkout on their side, UK customs risk, per-player hidden products not verified). |
| Transactions | `docs/design/merch/TRANSACTIONS.md` | Done (draft). Our own Stripe Checkout on a **new, separate Stripe account** (Hong Kong seller, the owner lives in Japan), Stripe Tax, guest checkout, one item per order, 1-hour cancel window, D1 `merch_orders`, `/merch/*` routes, gate off by default. Managed Payments (the Kind shop's model) does not cover physical goods. |
| Print spike | `docs/design/merch/SPIKE.md`, code `merch/`, `tools/merch_*` | Done. `PawPrint` redraws a dog from a ~28-character recipe, byte-identical to the game (483/483). Server render with resvg: needs **Workers Paid** (30 s CPU); tee 4500x5400 in 12 bands. Phones make previews only. |
| Shop page design | `docs/design/merch/DESIGN.md`, `docs/design/merch/prototype/` (open `index.html`; pictures in `shots/`) | Done as a clickable prototype (6 steps, phones first). The owner has seen the pictures; no feedback yet. |

## The owner's answers (24 Nov 2026, about 12:50 JST, in the choice window; the owner's own words in quotes)

1. Countries: "We can ship to everywhere not only mention USA, we can list free shipping with purchase over $50usd". So: **worldwide**, not
   USA-only. Still open: the UK needs a UK VAT registration before the first UK sale, and the EU has its own rules (PROVIDERS.md 2). The
   MERCH session must put that to the owner with a country list (`COUNTRIES.md`) before anything is built for those countries.
2. Currencies: "Showing usd only, and buyers can decide which currency they use when they pay in stripe". So: **one USD price list**, and
   Stripe's own currency choice at checkout (Adaptive Pricing), not a GBP list.
3. Products at launch: **mug, tee, sticker sheet.**
4. Returns: **none for a change of mind; free reprint or refund for damage, misprint or loss; 1-hour cancel window.**
5. Delivery: "The selling price is included the shipping fee, but i want to make more income, please research for a reasonable shipping
   fee, we can do free shipping if they purchase over $50/ smaller amount we can do free shipping". So: **a shipping fee on small orders
   and free shipping over a threshold (US$50 or lower)**; the owner wants more income per order. This needs a **cart** (more than one
   item per order), which TRANSACTIONS.md had rejected: the order flow changes.
6. Cloudflare: "It is free plan as i know, but can u try to put it on cloudflare first, otherwise lets see if we can do it in free way".
   So: **no paid plan assumed.** Find a way to make the print files on Cloudflare Free, or another free way.

Research that followed (all in `docs/design/merch/`, pushed on `merch/shop`):

| File | What it settles |
|---|---|
| `ECONOMICS.md`, `tools/merch_econ.js` (`--cart` for baskets) | Margins with Stripe Hong Kong fees: 3.9% + US$0.30 when settled in USD, 5.9% when converted to HKD. A lost dispute costs 4 to 6 orders of margin. |
| `PRINT_FILES.md` | The tee: 4500x5400 file, dog + name in a 10 x 10 in block. Stickers: no floating pieces, no border of our own. Dark garments: keep the paper patch. Exact pixel sizes need the owner's Printful key. |
| `SHIPPING.md` | Proposed list (model C): mug $19.99, tee $26.99, sticker sheet $13.99; shipping USA/Japan $4.99, free from $35; UK/Europe $5.99 and Canada/Australia/NZ $7.99, free from $70; elsewhere $11.99, never free. Tees, mugs and stickers each travel in their own parcel. The basket asks "Ship to" first. |
| `COUNTRIES.md` | Tier 1 open at launch: USA, Canada, Australia, NZ, Japan, Hong Kong. Tier 2 open with a "tax may be due at the door" line: the rest of the world. Tier 3 wait for a registration: UK, EU, Brazil. Tier 4 never (sanctions, Printful, Stripe). |
| `RENDER_FREE.md` | Free plan: Cloudflare's own browser (Browser Run, 10 browser-minutes a day free) draws a static print page; the Worker streams the PNG into KV. About 80 orders a day. Unproven until one throwaway test deploy. Fallback: a GitHub Actions render. R2 is out (needs a card). |
| `BUILD_PLAN.md` | The parts, updated for the basket, the zones and the free render. |

## The owner's second answers (24 Nov 2026, about 13:05 JST, in the choice window)

1. Prices: **"Free from $35 (Recommended)"** = `SHIPPING.md` model C: mug $19.99, tee $26.99, sticker sheet $13.99; USA shipping $4.99,
   free from $35; the other zones as in `SHIPPING.md` section 3.
2. Countries: the owner's own words: **"Open for all, no need mention countries"**. So the shop is built to open everywhere the printer and
   Stripe allow (tier 4 of `COUNTRIES.md` is refused by them, not by us), and the page does not list or single out countries beyond the
   "Ship to" choice the fee needs. The MERCH session told the owner twice that the UK and the EU need a tax registration before the first
   order (research, not advice). Countries are a switch (`MERCH_COUNTRIES` / zones), set at launch: **put the exact list, with the UK/EU
   registration note, in front of the owner again with the launch go-ahead**, and suggest the accountant before that day. Do not re-ask
   before then. Without a UK/EU registration the "prices include VAT" lines of model C do not apply as written: re-run
   `tools/merch_econ.js --cart` for those zones when the catalog is made.
3. Test deploy: **yes.** One throwaway Worker `doodle-doggo-print-test` (+ a KV namespace `print-test`) on the Free plan, deleted after
   (`RENDER_FREE.md` section 7). Approved for this one test only; every other deploy still needs its own go-ahead.
4. USD payouts: **"Yes, I have a USD account".** So Stripe case 2 (3.9% + US$0.30) and Adaptive Pricing are the plan.

## Now running / next (update this as parts finish)

- Part 0b: **done, 24 Nov.** The test Worker ran and is deleted (checked: 6 Workers as before, 0 Durable Object namespaces). Result in
  `RENDER_FREE.md` section 8: Cloudflare's free browser makes every print file pixel-exact; about 270 orders a day on Free; Worker CPU
  under 4 ms. Print files are stored in a SQLite Durable Object of the **merch** Worker (the session's token cannot create KV; no R2).
  First fallback: resvg-wasm inside that Durable Object (it also worked on Free). Workers Paid is not needed.
- **Stickers are OUT of the launch (owner, 24 Nov 2026, about 20:10 JST: "No stickers at launch").** The owner found Printful's $4.49
  postage for one sheet too dear; `STICKERS.md` found no cheaper printer (US rates $4.29-4.89 everywhere) and proposed a 2-sheet pack,
  which the owner did not take. **Launch products: mug ($19.99) and tee ($26.99) only**, shipping $4.99, free from $35 (so any two items
  ship free). Keep the sticker layout code that part 1 already wrote, switched off (`MERCH_PRODUCTS=mug,tee`); do not spend more on it.
  Bring stickers back to the owner only if a clearly cheaper way to post them turns up.
- Part 1: **done, 24 Nov** (`docs/design/merch/PART1.md`). `PawPrint.PRODUCTS` (one spec table; stickers `launch: false`),
  `PawPrint.print()`, the tee (4500x5400, 10 x 10 in block, paper patch on every colour but white, hard edges), the mug wrap (dog on
  both faces, clear of the handle), `merch/names.js` (name rules and kind-word filter), `ART_VER`, the print page `merch/print/v1/`.
  Tests: `node merch/test_pawprint.js` 63/63; game round trip 483/483. Samples sent to the owner (`docs/design/merch/samples/`):
  no feedback yet. **Not yet reviewed:** run ONE combined review (paw-reviewer, Opus: code + art at full size) before part 2 builds on it.
  Small open points for the owner, to ask with the next real question, not alone: a puppy or newborn prints puppy-sized on a tee
  (tiny on the patch: keep, or scale up?); the name letters are at most 1.3 in tall.
- **Part 1 review and fixes: done, 24 Nov late evening** (`docs/reviews/MERCH_PART1_review.md`; fixes in commit d915b8f; PART1.md is
  current). `test_pawprint` 84/84, game round trip 483/483. Print links now need every key plus `av=<ART_VER>`; the title names what
  was drawn; no art is clipped; the name filter is fixed both ways; the patch hugs the dog; `PRODUCTS.tee.minDogIn = 5` (small dogs
  scaled up to 5 in wide). New samples sent to the owner (`docs/design/merch/samples/`, committed). **Open for the owner, to ask with
  the next real question:** small dogs "as in the game" or "scaled up to 5 in" (picture `samples/puppy_size_choice.png`; built: scaled
  up, recommended). Good to tell the owner then: a mug name carries at most 16 wide letters ("A little shorter, please"); XS-M tees
  print the file at 77%. Sent to the GM: the tricolour Corgi happy-pose outline gap (game art, review item 12). Left for part 3:
  review item 16 (the server checks the recipe).
- **TRANSACTIONS.md rewrite: done, 24 Nov evening** (644 lines; test rows `T2.1-01..33`, `T2.2-01..56`). Storage: **everything in
  SQLite Durable Objects, no D1** (`MerchLedger` orders, `MerchPrints` PNGs per JST day; admin routes + `tools/merch.sh` instead of a
  SQL console). Adaptive Pricing: verified and not-verified lists in its section 3.1 (not verified: whether a Hong Kong account can
  switch it on; goes to the sandbox run, part 9). No manual capture with Adaptive Pricing, so each cancel costs us the Stripe fee.
  **Its section 10 has 12 open points for the owner** (recommendation first): ask them together with the next real question or the
  launch go-ahead, not one by one. The build goes ahead on the recommendations; each is a switch or a table value.
- **Running now (started 24 Nov about 22:30 JST), one Opus agent each:** **part 2** (the `/merch` page in test mode: `site/merch/**`,
  `merch/test_page.js`, `PART2.md`; a fake api with the shapes of TRANSACTIONS.md 6.3; no shared site files) and **part 3** (the merch
  Worker, money faked: `cloudflare/merch/**`, `tools/merch.sh`, `PART3.md`; one test per T row; it may come back partial with a list
  of rows left). When each is back: run its suite yourself, commit, then ONE combined review per part (paw-reviewer, Opus; part 2 also
  phone fit at 360x640), fixes, and a message to the GM that the part is ready. Then parts 4 (render) and 5 (Printful adapter).
- For the owner to do when they are ready (nothing blocks the build yet): open the Printful account and the separate Stripe account
  (Hong Kong, USD payouts, Adaptive Pricing); talk to an accountant about the UK and the EU before launch day.
- Nothing is on sale and nothing is deployed except the throwaway test Worker while its test runs.

Only the owner can: open the Printful account and its payment method, open the separate Stripe account and turn on Stripe Tax, register
for tax where needed (with an accountant: we give research, not tax advice), set secrets in the dashboards, order real samples.

## Known problems to solve in the build

- Unit economics in PROVIDERS.md used Stripe **Japan** fees; redo with Stripe **Hong Kong** fees (TRANSACTIONS.md has them).
- The tee print area differs between the design (dog about 35% of the width) and the spike (about 45%): settle it from Printful's file rules.
- Dark garments: dark outlines and the brown name vanish (white border, light name). Stickers: hearts and sparkle float off the dog (cut line).
- Names: Latin letters only for now, 20 characters, a word filter. Keep each printed PNG (art may change later).
- resvg 2.6.2 crashes on elements fully outside the drawing area (worked around per band).
- The Shiba happy-pose fill outside its outline is GAME art: the GM fixes it on main (not you).

## Suggested next steps (after the owner answers)

1. Turn the prototype into the real `/merch` page in **test mode only** (site style, English first), with PawPrint previews.
2. Worker `/merch/*` routes behind a gate that is OFF (`MERCH_FROM = ''`), Stripe test keys, Printful draft orders; tests for every step.
3. Legal pages (terms of sale, shipping and returns, privacy additions) as drafts for the owner.
4. The owner orders real samples of every product; only then a launch date, set by the owner.

## Working with the Game Manager

- GM session: `session_01D6KLY4c4fCxHWPdQRekZXZ` ("Doodle Doggo" Game Manager). MARKETING session: `session_01D6KLY4Gxx78VuyjbRFaSgb`.
- You work on `merch/shop` (and worktrees/branches from it). **You do not push to `main`, release, or deploy.** The GM merges, releases
  and deploys after the owner's go-ahead. Send the GM a short message when a part is ready to merge or when you need a change in shared
  files: `game/src/*`, `cloudflare/worker.js`, `cloudflare/schema.sql`, `site/tpl/*` and the site header, `tools/cf_*`. Prefer new files
  (`merch/`, `site/merch*`, `cloudflare/merch_*.js`) so merges stay small.
- Anything about reels, posts or captions goes to MARKETING, not to you and not to the GM.
