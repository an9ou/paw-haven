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
- **Parts 2 and 3: built, reviewed and fixed, 25 Nov about 10:30 JST.** Head of `merch/shop`: 259698e (main merged in at
  v2.33.1, the dog outline fix; ART_VER is now `pp1-3f73333c`). All four suites green on it, each run with
  `NODE_PATH=$(npm root -g)`: `node merch/test_pawprint.js` 84/84; the game round trip (`node game/build.js && node game/harness.js
  merged && node merch/test_merch_game.js`) 483/483; `node merch/test_page.js` 632/632; `node cloudflare/merch/test/run.mjs` 156/156.
  - Part 2 (`docs/design/merch/PART2.md`, review `docs/reviews/MERCH_PART2_review.md`): the `/merch` page in test mode in
    `site/merch/` (six steps, basket, "Ship to" first, PawPrint previews, `api_fake.js` + `catalog.json` in the exact shape of
    TRANSACTIONS.md 6.3 and its dated notes, `?demo=1`). Kept screenshots: `docs/design/merch/part2_shots/` (6 files).
  - Part 3 (`docs/design/merch/PART3.md`, review `docs/reviews/MERCH_PART3_review.md`): the Worker `cloudflare/merch/**`, money and
    every outside service faked; `MerchLedger` + `MerchPrints` SQLite Durable Objects; claim-first with leases on every step; an email
    outbox; `tools/merch.sh`. PART3.md holds the checklists "to verify in the Stripe sandbox" (part 9) and "with the printer's key"
    (part 5). Nothing is deployed; the gate is shut by default and needs every service ready.
  - Watch out at merge time: `tools/cf_site.js` walks all of `site/`, so a site deploy from a branch that holds `site/merch/` would
    publish `/merch/` (noindex, unlinked, pay shut): the GM must exclude it until launch. Told to the GM on 25 Nov.
  - Released print folders live in git under `site/merch/print/<ART_VER>/`; once an order has been taken with a folder it is never
    removed (pre-launch folders may be pruned, as was done on 25 Nov).
  - The paw-reviewer agent no longer writes its own report file: write the review file yourself from its report.
  - Usage limit: both fix agents stopped at the limit on 24 Nov 23:00 JST and were only resumed at 09:40 JST. Next time
    `send_later` yourself a resume for 2 minutes after the reset as soon as you see the reset time, and resume stopped agents with
    SendMessage (their work is kept).
- **The owner's third answers (25 Nov 2026, about 10:40 JST, in the choice window):** small dogs on a tee: **"Scaled up
  (Recommended)"** (`PRODUCTS.tee.minDogIn = 5` stays; that open point is closed). A thank-you gift in the game with each order:
  **"Yes, a small gift (Recommended)"**: one cosmetic item by gift code per order, shown on the order page and in the thank-you
  email (part 6; an empty code pool means no gift, never an error). The GM makes the item and the code group (told on 25 Nov); never
  write real codes in files or chat.
  Kept for the launch go-ahead, not asked yet: TRANSACTIONS.md 10 (countries with the UK/EU registration note,
  payment methods, soft-launch limits 10 a day and a US$150 printer wallet, keep time, the delivery promise, the adviser on USD-only
  prices), PART3.md question 20 (if the printer cannot sign its webhooks: poll it, recommended), tee sizes (only those made in both the
  US and the UK, so no 5XL). Good to tell the owner then: a mug name carries at most 16 wide letters; XS-M tees print the file at 77%.
- **Parts 6 and 7: built, each reviewed once and fixed, 25 Nov about 14:30 JST.** Head of `merch/shop` after the fixes: ecb9024 (+ this
  handoff). On a fresh checkout run `NODE_PATH=$(npm root -g) node tools/merch_build.js` FIRST (`merch/dist` is not in git), then the five
  suites, one at a time, each with `NODE_PATH=$(npm root -g)`: `node merch/test_pawprint.js` 84/84; the game round trip (`node game/build.js
  && node game/harness.js merged && node merch/test_merch_game.js`) 483/483; `node cloudflare/merch/test/run.mjs` 181/181; `node
  merch/test_page.js` 1624/1624 (about 95 s); `node merch/test_legal.js` 381/381.
  - Part 6 (`docs/design/merch/PART6.md`, review `docs/reviews/MERCH_PART6_review.md`): the real order emails (`mail.js` `build(kind, view,
    env)`: text + small HTML, 10 buyer kinds with `late_again`; samples in `docs/design/merch/part6_shots/emails/`), one order link form
    (`<MERCH_SITE>/merch/#/order/<id>`; Stripe returns to `/merch/?new=1#/order/<id>`), the order page for a real order in every state
    (address form, refund instead, the late choice with Keep waiting, put back in basket, the gift card), `POST /merch/order/:id/wait`.
  - **The gift as built:** a code is reserved when the order is paid (hidden: the order answer says `gift: 'soon'`), shown when the 1-hour
    cancel window ends (order page + the first email after that); a cancel or full refund before that puts it back in the pool; after it is
    shown the order keeps it. Reason: "order, then cancel" would otherwise empty the pool at a Stripe fee each time. The pool is filled
    with `tools/merch.sh gift add` (codes on STDIN, also the `promo.sh` CSV; never printed), `gift count`; the nightly report says how many
    are left; the owner is told under 10 and at 0. Switches: `MERCH_GIFT_NAME` (the item's name in the texts), `MERCH_SELLER_NAME`,
    `MERCH_SELLER_ADDR` (the email footer; left out while unset). **Waiting on the GM:** the item, the code group name and who fills the pool
    (codes with no end date; refills should stay one group so "one per account" holds).
  - **The delay plan as built** (US mail-order rule; review "The delay plan"): one promise everywhere, "posted within 7 working days of
    payment" (`SHIP_BY_DAYS = 7` in `catalog.js`; the Thank you email and the order page give the date). At that day: the delay email with
    a new date 7 working days later (`LATE_MORE_DAYS`). At the new date, still not posted: a second notice if the buyer pressed Keep
    waiting, otherwise **the late part is refunded by itself**. New for the owner's launch list: TRANSACTIONS.md 10 point 13.
  - Delivery times have one source now: `ZONES[*].eta` in `cloudflare/merch/catalog.js` (USA/Japan 5-11, Canada/Australia/NZ 4-16, UK/EU
    4-27, elsewhere 7-27 working days: estimates until the printer's key, part 5). `site/merch/catalog.json` is generated by
    `node tools/merch_catalog_json.js` (a test fails if they differ); the launch plan's shut countries are `LAUNCH_COUNTRIES` there.
    The Worker now refuses the no-post places (`NO_POST`).
  - Part 7 (`docs/design/merch/PART7.md`, review `docs/reviews/MERCH_PART7_review.md`): drafts, each marked "Draft: to be checked by a
    professional before the shop opens", noindex: `site/merch/terms/`, `shipping/`, `seller/`, `tokushoho/` (Japan's notice, in Japanese),
    `legal.css`, suite `merch_legal`. PART7.md holds: the "Merch orders" text for `/privacy` ready for the GM to paste; the professional's
    checklist (26 points); **the facts only the owner can fill in** (registered name and that "Doodle Doggo" is the trading name, the kind of
    business, the HK BR number, a street address, the person responsible and the phone choice for the Japan page, the card statement
    name); the row and words to put back when the UK or the EU opens; three open points where documents and code still differ.
  - Not re-reviewed: the part 6 fix batch added money logic (the automatic late refund, the gift reserve and return) with crash and race
    tests but no second review. **Point the part 9 code review at it first** (`cloudflare/merch/test/t_fix6.mjs` lists the cases).
  - Decisions taken in the build that the owner may change (all table values or words; tell the owner with the launch questions): the gift
    timing above; the automatic late refund; the second notice's subject "Still taking longer than we said"; a line refused by the printer
    for several items is one email; sizes listed smallest first; pictures of every email and order state exist for the owner to look at.
  - Pictures: only a few part 6 PNGs are in git (`*.png` is ignored: `git add -f`); remake all with `SHOTS6=1 node merch/test_page.js`.
- **Parts 4, 5 and 8: built, 25 Nov (head 6748c60 + this handoff; every suite below green on it) (the third MERCH session, session_01D6KLY3fNKUKGLDeZrraF9a).** Each of 4 and 5 had
  one review and one fix batch. On a fresh checkout run `NODE_PATH=$(npm root -g) node tools/merch_build.js` FIRST, then the suites one at a
  time, each with `NODE_PATH=$(npm root -g)`: `node merch/test_pawprint.js` 84; the game round trip (`node game/build.js && node
  game/harness.js merged && PAW_ARGS=--ignore-certificate-errors node merch/test_merch_game.js`) 11 checks (483 renders, 161 dogs through the
  game's encoder); `node cloudflare/merch/test/run.mjs` 242; `node cloudflare/merch/test/render_chromium.mjs`;
  `node merch/test_page.js` 1756 (about 100 s); `node merch/test_legal.js` 381; `node merch/game/test_enc.js` 36; `node merch/game/gen.js
  --check`.
  - **Part 4** (`docs/design/merch/PART4.md`, review `docs/reviews/MERCH_PART4_review.md`): `render.js` calls Browser Run
    (`env.BROWSER.quickAction('screenshot')`) from the ledger object (`MERCH_RENDER_VIA = "direct"`) or through the front Worker's
    `RenderGate` (`"worker"`, self binding `SELF`); the fallback is resvg-wasm 2.6.2 (vendored, MPL-2.0) in a NEW Durable Object class
    `MerchRender` (`resvg.js`, migration tag `v2`), tees in 12 bands; our own browser budget (540 000 ms a UTC day), the 429 rules, one
    `browser_off` owner email a day; the admin self-test `tools/merch.sh render-test <tee|mug> [browser|resvg] [direct|worker]`; the cloud
    test kit `tools/merch_rtest.mjs` (dry by default; a real run needs `DRY_RUN=0 RTEST_GO=yes-the-owner-approved`, deploys ONE throwaway
    Worker `doodle-doggo-merch-rtest` uploaded twice (the second adds `SELF`), 14 self-tests 12 s apart (6 browser direct, 2 browser through the Worker, 6 resvg) and one 2-call rate probe, compares each file with local Chromium, then ALWAYS deletes the Worker and re-counts; exit 3 and one hand clean-up line if the delete fails; without `CLOUDFLARE_ACCOUNT_ID` it stops when more than one account is visible). Bundle 1,247 KiB gzip (Free limit 3 MB).
    After the review fixes: `render.pngCheck` (exact size, 8-bit RGBA, least sizes tee 128 KiB / mug 64 KiB, whole to IEND, the tee's first row
    clear) guards every file; 3 browser errors in a row put the browser off for an hour (the fallback draws); a line neither renderer can draw
    (band layer or another `art_ver`) waits for the browser, is held, and is refunded at 72 h; `splitBands` refuses art it cannot band safely.
    **Unverified until the cloud test** (PART4.md has the list): whether the object may call the browser binding, the real rate-limit 429
    text, what a 429 or an error looks like, the fallback's CPU on Free, the upload format for the migration and the bindings.
  - **Part 5** (`docs/design/merch/PART5.md`, review `docs/reviews/MERCH_PART5_review.md`): the Printful adapter on **API v2** (signed
    webhooks, shipments by our own item ids, delivered/returned), with ONE v1 call, the late cancel of a confirmed order
    (`MERCH_PF_V1_CANCEL`). Built against 46 reply fixtures in `cloudflare/merch/test/printful/` (33 built from the schema, 11 from the
    docs' own examples, 2 public catalog reads). The real variant ids of all 43 variants are in `catalog.js` `PF_VARIANT_IDS` (public
    catalog, no key). The review's three blockers are fixed: the Worker forwards `x-pf-webhook-signature`; a confirm whose answer was lost is
    re-read, not sent twice; a confirmed order that Printful fails or cancels is held `review` (`pf_failed` / `pf_canceled`) and the owner is
    told. `TEE_SIZE_COST` is now Printful's documented 2XL/3XL/4XL extras (+$2/$4/$6); no selling price changed; every size clears the floor
    (lowest: 4XL to Japan, $9.90). The key-day kit `tools/merch_pf_check.mjs` (dry by default; makes one draft and deletes it, never confirms)
    records real replies as fixtures. **Needs the owner's Printful key** (PART5.md "still needs the key"): the real error texts, a deleted
    draft's answer, one real draft's costs (does `front_large` cost extra as the only placement? if yes every tee order is held by the 10%
    cost check), that v2 variant ids equal v1's, that v1 sees v2 orders (Q22), webhook set-up. Open questions Q20-Q30 in PART5.md, each with
    a recommendation; the build follows the recommendations.
  - **Part 8** (`docs/design/merch/PART8.md`): the brief for the GM (the Merch tile, the confirm sheet, "Put this on a mug" in the share
    sheet, the link, the gate `MERCH_FROM`, the tests) and what MERCH hands over, both built: `merch/game/61_merch_enc.js` (generated from
    the core by `node merch/game/gen.js`, `--check` fails when stale; the GM copies it unchanged into `game/src/`; it needs only
    `window.PawGenes` and `window.PawArt`; `merchLink(dogs, opts)` makes the address) and the page's share link
    (`#p=<one dog>&prod=mug&pose=happy&from=share` opens the "make it" step). ART_VER is unchanged (`pp1-3f73333c`). Part 8b had no review of
    its own: the part 9 reviews cover it.
  - A builder tried to edit a file outside its own list (`worker.js`, part 5) and was blocked; the change was then checked by the reviewer
    against Printful's docs and made in the fix batch. Told to the owner in this session's chat.
  - Agents make their own branch names in their worktrees (`merch/part4-render`, `merch/part5-fixes` ...): merge those, not the
    `worktree-agent-*` branch. `get_session`'s `context_usage.used_tokens` was already about 245k at about 130k of real conversation: the
    count includes more than the conversation, so check it early.
- **Part 9, first half: done 25 Nov about 15:30 JST (the fourth MERCH session, session_01D6KLY5tW9BfVbcZQJsWN8B).**
  - **The owner’s answers (25 Nov, about 14:30 JST, choice window):** the cloud test: **"Yes, run it (Recommended)"**; the Printful key:
    **"Not yet: later"** (do not ask again before the sandbox run; then ask through `request_credential`, host `api.printful.com`).
  - **The cloud test ran once (14:34 JST) and its Worker is deleted** (the account holds its 6 Workers, 0 Durable Object namespaces, checked
    twice). Results: PART4.md "The cloud test: results", RENDER_FREE.md 9, the PART3.md line ticked. The ledger object may call Browser Run
    (`MERCH_RENDER_VIA = "direct"` stays); every browser file pixel-exact; resvg inside the limits; no code change needed. Still unverified:
    both 429 texts (the rate probe was answered from Cloudflare’s cache) and what a browser error looks like. Do NOT run the kit again
    without a new yes from the owner.
  - **The three reviews are in** (reports as handed back): `docs/reviews/MERCH_PART9_code_review.md` (1 blocker, 3 major, 3 minor),
    `MERCH_PART9_phone_review.md` (0 blockers, 8 major, 10 minor), `MERCH_PART9_art_review.md` (0 blockers, 1 major, 7 minor).
  - **Code fixes: merged** (`merch/part9-code-fixes`, merge e12f02d3; `merch_worker` 259/259): the printer is read before every automatic
    refund and delay email (plus a daily re-read, T2.1-35/36), a lost dispute blocks the late cancel, a refund Stripe refuses for good is
    marked failed and the owner told, only `lost` is lost (an inquiry is a flag, not a pause), the gift shows only at or past `confirming`.
    **Not yet done, found by that fixer (money logic; give them to the next code fix batch):** (1) an order released 30+ days after a
    dispute closes in our favour gets its delay email and is then refunded at its next wake (`late_eta` counts from `ship_by`); (2) the
    7-day reship refund does not read Printful first; (3) `stopped()` lets a confirmed order with a lost dispute be reprinted.
    **This fix batch has had no second review** (the part 6 lesson): point ONE more code review at `t_fix9.mjs` and the `ledger.js` diff of
    3f21682d, together with the three points above once fixed.
  - **For the sandbox set-up list:** the merch webhook endpoint must also subscribe to `charge.dispute.updated`.
  - **Page fixes and print fixes: merged, 25 Nov about 16:15 JST** (`merch/part9-print-fixes` merge ea311ba7, `merch/part9-page-fixes`
    merge 88e7c1f0). Phone M1-M8 and m1-m10 and art M1, m1, m2, m4 on the page; art m3 (the tee name is at most max(dog width x 1.15, 6 in)
    wide), m5 (the mug strip at the handle), m6 (white tees: a crisp white backing, so every tee file is alpha 0 or 255), m7 (email
    headings in a rounded sans). **ART_VER is now `pp1-5688199b`** (folder `site/merch/print/pp1-5688199b/`; the old pre-launch folder is
    removed). The owner’s samples were remade (`docs/design/merch/samples/`). The "Fixes" lists are at the end of each review file.
    **Every suite green on 88e7c1f0** (each with `NODE_PATH=$(npm root -g)`, after `node tools/merch_build.js`): pawprint 88; the game round
    trip 11 checks (483 renders); merch_worker 260; render_chromium ALL OK (8 dogs, now also white tees by both renderers); merch_page 1932
    (about 120 s; `P9=1` runs only the part 9 checks); merch_legal 383; test_enc 36; `gen.js --check` and `merch_catalog_json.js --check`
    current.
  - **Neither of these two fix batches has been reviewed.** Small points left by the fixers: the four legal pages’ footers still use dots
    between links (the shop footer does not); the shop page’s flat print view on a checker shows the white backing as a 1-2 px white
    outline round the dog on white tees (invisible on the tee mock-up); the mug’s face direction and "white prints no ink on a white tee"
    both want a real sample (part 10).
- **Part 9, second review and its fixes: done 25 Nov about 16:50 JST (the fifth MERCH session, session_01D6KLY4FcqQgUYQKpcr8J68).**
  - The combined second review (code + phone + art): `docs/reviews/MERCH_PART9_second_review.md` (0 blockers, 4 major, 5 minor; the
    three money points above were confirmed as R2-M2, R2-M3, R2-M4; the page and the prints were fine but for three small points).
  - **All nine fixed** (`merch/part9-fixes2`, merge ecddc13; the "Fixes (second review)" list ends the review file; tests
    `cloudflare/merch/test/t_fix9b.mjs`, 22 rows): the late cancel and the 7-day reship refund read Printful first; the late date counts
    from max(ship_by, now) and moves on after a won dispute; a lost dispute stops reprints, reships and the lost-parcel refund; a stale
    printer read is not applied (a hint overtaken by a change answers 502 so Printful sends it again; the daily re-read is the backstop);
    a late `created` after its close is ignored; the basket says shipping is free over the threshold; the thanks email's days no longer
    read as adding up; a long mug name keeps 25 px from the handle line. **ART_VER is now `pp1-6df20bb6`** (the `pp1-5688199b` folder is
    removed; only the mug sample changed, the tee sheets are byte-identical).
  - **Every suite green on ecddc13**: pawprint 89; the game round trip 11 checks (needs `node game/build.js && node game/harness.js
    merged` first); merch_worker 282 (`node cloudflare/merch/test/run.mjs`); render_chromium ALL OK; merch_page 1933; merch_legal 383;
    test_enc 36; `merch/game/gen.js --check` and `tools/merch_catalog_json.js --check` current.
  - **New money rules for the launch list** (TRANSACTIONS.md "part 9" notes): the buyer's late cancel is never refused because Printful
    cannot be read (the owner gets an email to check Printful); after a won dispute the late date moves on quietly (shown on the order
    page, no new email); a lost dispute means no reprint, no reship and no lost-parcel refund.
  - Left open (small): dogs on the mug have no inner margin of their own (a wide dog is 37 px from the handle line: fine); the
    502-on-stale-hint relies on Printful retrying webhooks.
- **Part 9, the review of the second fix batch and its fixes: done 25 Nov about 17:35 JST (the same session).**
  - `docs/reviews/MERCH_PART9_third_review.md` (0 blockers, 3 major, 3 minor, every one confirmed by a probe; its "Fixes (third
    review)" list ends the file). **All six fixed** (`merch/part9-fixes3`, merge 167d986; tests `cloudflare/merch/test/t_fix9c.mjs`, 16
    new rows, each failing on b7ef7ab): a reshipped line is never refunded at 7 days, whatever the order of shipments, hints and reads;
    a reprint's failed reads are counted, capped and end with the owner (new column `merch_reprints.read_fail`; in the reship step 24 h
    of failed reads hold the order for the owner, `hold=review`, `why=reship_unread`, no refund); Printful's hold applies only to the
    main order and never overwrites another hold; a lost close sends the owner one email (`dispute_lost`) and cancels unposted reprints
    at Printful; closes are remembered per dispute id (`x:dclosed:<id>`); the late cancel reads Printful twice and, if both fail,
    records `late_ask_at`, answers 200 `refund:'pending'` and lets the alarm decide after the next good read (new buyer email
    `late_posted`; one new line on the order page in `site/merch/merch.js`).
  - **Every suite green on 167d986**: merch_worker 298; pawprint 89; merch_page 1933; merch_legal 383; render_chromium ALL OK;
    test_enc 36; the game round trip 11 checks; `gen.js --check` and `merch_catalog_json.js --check` current. ART_VER unchanged
    (`pp1-6df20bb6`).
  - **Changed money rules for the launch list** (TRANSACTIONS.md "part 9" notes; these replace the late-cancel rule in the block
    above): a late cancel with Printful unreadable is NOT refunded at once: it is decided after a good read (posted before the buyer
    asked: theirs, no refund, the `late_posted` email; posted after the ask: refunded and the owner told; no good read 24 h after the
    ask: refunded on what we know and the owner emailed). A reship whose Printful order cannot be read waits for the owner, who refunds
    or reprints by hand. A lost dispute cancels unposted reprints at Printful; whatever still goes on is named in one owner email.
  - Left open (small): after a reship case ends with the owner, a shipped order is not in the daily re-read (the hold clears only on
    a Printful hint showing the reship); the page's stand-in API (`api_fake.js`) never returns `pending`, so the new order-page line
    has no `merch_page` row (the ledger tests cover the real path); the daily re-read never covers `shipped` orders without a reship
    hold, so a lost `package_returned` hint there is never caught. To learn in the sandbox / with the Printful key: Printful's webhook
    retry policy (do repeated 502s switch a webhook off?) and the order in which it lists shipments.
  - **This third fix batch (482 lines) has had no review of its own.** Each batch so far hid new holes (9 found in batch 1's, 6 in
    batch 2's), each round smaller and further from the main path.
- **The sandbox kit: done 25 Nov about 18:00 JST** (`merch/part9-sandbox-kit`, merge 99a110d): `docs/design/merch/SANDBOX.md` (part 0
  the code the run still needs; A the owner's steps, about 40 minutes, all free; B what gets deployed; C the printer and the emails; D the
  run, about 75 rows; E afterwards; F the GM's shared-file brief and the owner's questions), `tools/merch_test_deploy.sh` (dry run by
  default; a real send needs `DRY_RUN=0` and `MERCH_TEST_DEPLOY_OK=1`; never run for real so far) and `tools/merch_test_build.mjs`.
  **It found that the test Worker would refuse every order**: C1 Stripe and Resend have no real network path (only the test seams), P1 the
  page never talks to a Worker, P2 Pay never opens Stripe, C2 no printer without a Printful key. The GM has the brief for G1/G2 (the
  test copy serves `/merch/`; sent 18:05 JST).
- **The owner's answers (25 Nov, 18:08 JST, choice window; the owner's own picks):** the private test deploy behind the test password:
  **"Yes (Recommended)"** (once the last wiring is checked; Cloudflare's approval prompts still come at the send); the printer in the
  first run: **"Pretend printer first (Recommended)"** (so C2 is to be built; a short second run later with the real Printful key, still
  through `request_credential`, host `api.printful.com`, when the owner is ready); emails: **"Yes, with a Resend key (Recommended)"**;
  who taps Pay on the about 45 test orders: **"Claude tries all of them"** (the owner was told this is the least sure way: it needs
  network access to Stripe's pay page from the cloud session and Stripe may stop robots; if it fails, go back to the owner with the
  mix or the by-hand option). The owner still has to do SANDBOX.md part A (the new Stripe account in test mode, the keys into the
  Cloudflare dashboard after our first deploy, the admin key through the secure form for `merch-api-test.doodledoggo.app`).
- **Next, in this order:**
  1. (done 18:25 JST, merge 3376171) C1, P1, P2 (`merch/part9-wiring`): `util.js` `netOf(seam, key)` (the global fetch only on
     Cloudflare's runtime and only with the key; a live key is refused in `req()` itself on the test Worker; a call that never answers is
     aborted at its time limit), the page's order server on the test origin only, Pay opens only `https://checkout.stripe.com/` urls;
     the page now has words for `bad_nonce` / `nonce_used` and a fake case for the late cancel's `pending`. **Every suite green on
     3376171**: merch_worker 304 (new `t_net.mjs`), merch_page 2036, pawprint 89, merch_legal 383, render_chromium, test_enc 36, the
     game round trip, both `--check`s, `BUILD_ONLY=1 bash tools/merch_test_deploy.sh`. Small points left: Stripe's cancel_url lands on
     the shop home, not the basket (the basket is kept); a Resend retry after a timeout can get a 409 and be noted as a failed mail
     though it went; the pay note's "Test mode" words need new words at launch.
  2. (done 19:00 JST, merge 927a019) C2 (`merch/part9-test-printer`): `cloudflare/merch/test_printer.js`, the Worker
     `doodle-doggo-merch-test-printer` (one SQLite Durable Object, no route or domain, only behind the service binding `PROVIDER_FETCH`;
     never calls the network, never confirms, 401 for any key but `test-printer`), wired only in the test build with
     `MERCH_TEST_PRINTER=1` (`tools/merch_test_build.mjs`; `ledger.js` unchanged; a real `MERCH_PROVIDER_KEY` removes the binding).
     Live code touched: `provider_printful.js` `net()` (the key `test-printer` is "no printer" unless `MERCH_TEST=1` and the binding are
     both there) and `admin.js` (`merch.sh show` / `report` start with a STAND-IN line). The magic shipping names: "Test Refuse
     Address", "Test Refuse Tee", "Test Refuse All", "Test Printer Down" (the whole stand-in down for 30 minutes), "Test Refuse File"
     (refuses on every try). **Every suite green on 927a019**: merch_worker 316 (new `t_testprinter.mjs`, 12 rows), merch_page 2036,
     pawprint 89, merch_legal 383, render_chromium, test_enc 36, the game round trip, both `--check`s, the deploy script's
     `BUILD_ONLY=1` with and without the stand-in. The deploy for run 1 is `MERCH_TEST_PRINTER=1 ... bash tools/merch_test_deploy.sh`.
     Before run 2 (the real Printful key) every run-1 order still open must be ended (SANDBOX.md D6).
  3. (done 25 Nov 19:50 JST, the sixth MERCH session, session_01D6KLY5jgpsjA7kUBm3xv6h) The ONE combined review of the third fix batch,
     the wiring and C2: `docs/reviews/MERCH_PART9_fourth_review.md` (0 blocker, 1 major, 5 minor; its "Fixes (fourth review)" list ends
     the file). **All six fixed, plus the stand-in draft guard** (`merch/part9-fixes4`, merge 1e830eb; tests
     `cloudflare/merch/test/t_fix9d.mjs`, 17 rows, each failing on 9815a07): R4-M1 a line posted in two parcels is no longer taken for a
     reship (`mapOrder` keeps the reshipment flag and the quantities; new table `merch_parcel_items`; a line moves only to a flagged
     reship or, with no flag, to a parcel first seen at or after the return; **a part of a line that comes back is held for the owner**,
     `hold=review`, `why=reship_part`, one owner email and one buyer note, because the address form, the reprint and the 7-day refund
     all take whole lines); the time limit covers the body read; the test Worker takes only `sk_test_` / `rk_test_` keys after trimming
     and every key is trimmed; a new buyer email `checking` when a case ends `reship_unread`, the owner's refund or reprint ends the
     review hold, a parcel back during a review is one owner email `returned_review`; **the test order server is no longer open**:
     buyer emails only to `MERCH_TEST_MAIL_TO` (a Secret the owner sets, SANDBOX A10; without it no buyer email goes out) and checkout,
     the order buttons and unsigned printer hints need the build's random `MERCH_TEST_TOKEN`, which the test page reads from
     `/merch/test_cfg.json` behind the test password (**new GM point G3 in SANDBOX.md part F; until G3 is done the test Worker takes no
     order, 403 `test_only`**); the test build wipes only a folder it made; `merch_orders.provider` records `stand-in` or `printful` and a
     stand-in draft is never sent to real Printful. **Green on 1e830eb**: merch_worker 333, merch_page 2058, pawprint 89, merch_legal
     383, render_chromium, test_enc 36, the game round trip, both `--check`s, `BUILD_ONLY=1` with and without the stand-in.
     Left open: the real name of Printful's reshipment flag and whether `quantity` is always given (run 2, the Printful key); a
     part-line reship is the owner's job by hand.
  3b. (done 25 Nov 20:30 JST) The fourth fix batch got its own short review, with the pay driver's guards:
     `docs/reviews/MERCH_PART9_fifth_review.md` (0 blocker, 1 major, 4 minor; the driver's guards and every live/test guard came out
     clean; its "Fixes (fifth review)" list ends the file). **All five fixed** (`merch/part9-fixes5`, merge d426ba3; tests
     `cloudflare/merch/test/t_fix9e.mjs`, 10 rows): R5-M1 the part-line count no longer counts a unit twice (units out in a parcel,
     refunded or not posted yet are not waiting; the owner email's "N of Q" is the true number and refunding N ends the hold; a new
     owner email `returned_settled` when a return is already settled by an earlier refund); with no reshipment flag only units posted
     beyond the line's quantity count as a reship; the daily re-read covers shipped orders held `review` for `reship_part` /
     `reship_unread`; **`merch.sh reprint` refuses a line posted in more than one parcel while some of its units are out** (409
     `part_line`, the message names the refund to make; the part-line emails offer only the refund; new money rule in TRANSACTIONS.md
     "part 9" notes); the test email allow list refuses non-ASCII addresses. **Green on d426ba3**: merch_worker 343 (nothing outside
     `cloudflare/merch/` and the docs changed, so the other suites stand as on 1e830eb). Left open (small): a Printful claim reship of
     part of a line cannot be attached by `merch.sh reprint` (the hold stays until a refund; harmless); a reprint order behind a
     `reship_unread` is still never re-read; `merch.sh lost ... refund` of a split line refunds the whole line, as before. This fifth
     batch (about 250 lines, all in the part-return code that run 1 cannot reach) has no review of its own: fold it into the review
     before run 2 (the real Printful key).
  4. (done 25 Nov 20:05 JST, merge d3bb77c) The driver for Stripe's test pay page: `tools/merch_pay_driver.mjs`
     (`payStripeCheckout(url, buyer, card, opts)` and a CLI; only `https://checkout.stripe.com/` with a `cs_test_` session, only with
     Stripe's "Test mode" / "Sandbox" badge on the page, only part D's seven test cards; returns `paid` / `declined` / `needs_human` /
     `error`, a screenshot outside the repo on anything but `paid`; test 3-D Secure Complete or Fail), offline test
     `NODE_PATH=$(npm root -g) node tools/merch_pay_driver.test.mjs` (7 of 7 against a local stand-in page). The environment's network
     is unrestricted (`get_environment`), so no host is blocked. **Not proven on Stripe's real hosted page**: the only public demo
     (checkout.stripe.dev, 6 tries with made-up details) shows the form embedded and takes no payment; the filling worked on Stripe's
     real form (about 6-7 s), no robot check while filling, but Stripe checks at Pay, which the demo never reached. So: try the driver
     on the first sandbox order (S-6); `paid`: the session takes the repeat orders; `needs_human` or a robot check: back to the owner
     with the mix or the by-hand option (choice window). Open: the badge's exact words on our hosted page (if different the driver
     refuses, a one-line regex change); `shopTrip()` is written but never run (TODO list in the file header); a simpler path may be a
     `curl` checkout with the test token (SANDBOX E-5) and the driver on the url it returns.
  5. The test deploy. **G1-G3 are on main since 26 Nov 13:55 JST** (main 99883ea) and merged into `merch/shop` (95b2547); every
     suite green there on 26 Nov 14:20 JST: merch_worker 343, merch_page 2058, pawprint 89, merch_legal 383, render_chromium, test_enc
     36, the game round trip 11, both `--check`s, the pay driver 7, `BUILD_ONLY=1` with and without the stand-in, test_gate 185.
     `TEST_PASSWORD` is NOT set on the test copy yet (the GM, 26 Nov: `doodle-doggo-test` is still the empty placeholder; the owner answered the GM "Not yet" for that deploy; the GM tells MERCH when test.doodledoggo.app/merch/ is up; the curl path with the token does not need it). **The order of the two deploys** (SANDBOX part F, G3): (1) the
     MERCH session sends the merch test Worker: `MERCH_TEST_PRINTER=1 DRY_RUN=0 MERCH_TEST_DEPLOY_OK=1 bash tools/merch_test_deploy.sh`
     (only with the owner's fresh yes in the choice window; the owner approves the prompts); (2) the GM, in its own container, runs
     `DRY_RUN=0 bash tools/merch_test_cfg_pull.sh <file outside the repo>` (new, 16 offline checks: it reads the plain variable
     `MERCH_TEST_TOKEN` from the deployed Worker's settings and never prints it; **the settings read is unverified until the first real
     deploy**) and deploys the test copy with `MERCH_PAGE=<the root of a merch/shop checkout>` and `MERCH_TEST_CFG=<that file>`;
     (3) the owner's part A steps 10-12; (4) the run (SANDBOX.md D), the first order with the pay driver (a `curl` checkout with the
     token from the build folder, then the driver on the url), filling in the results.
  5b. **The merch test Worker is deployed (26 Nov 14:35 JST, the owner's yes in the choice window at 14:30 JST: "Yes, send it now").**
     `doodle-doggo-merch-test` at https://merch-api-test.doodledoggo.app (cron */10, workers.dev off) and the stand-in printer
     `doodle-doggo-merch-test-printer` (no route, workers.dev off); a first deploy (migration v2 sent); the script's 8 public checks ok
     (catalog, CORS test copy allowed / live site refused, the print page, unsigned Stripe event refused, admin needs the key, checkout
     without the token refused, the printer has no address). **No secret is set yet**: the Worker refuses every order (503) until the
     owner's steps 10-12 (SANDBOX part A; A10 includes `MERCH_TEST_MAIL_TO`). `tools/merch_test_cfg_pull.sh` is verified against the
     real Worker (the same token as the build). The GM has been told to pull the token and deploy the test copy (its own owner yes).
     **The token lives in this container's `/tmp/dd-merch-test-build/test_cfg.json` and in the Worker's variable.** In a NEW
     container, before any redeploy: `DRY_RUN=0 bash tools/merch_test_cfg_pull.sh <file>` and give the build that token
     (`MERCH_TEST_TOKEN=<it>` from the file, never typed or printed), or the redeploy makes a new token and the test copy's file goes
     stale (then the GM must pull and deploy again). Still to come: the owner's Stripe steps 1-9, steps 10-12 (step 11: only when the
     owner says step 10 is done, open the secure form with `request_credential`, host `merch-api-test.doodledoggo.app`, for
     `MERCH_ADMIN_KEY`), then the run (SANDBOX.md D): the first order with the pay driver; if Stripe stops it, ask the owner again.
  4. Part 10 (samples and launch [O]).
  - **For the launch go-ahead, not before** (the list kept above still stands): TRANSACTIONS.md 10 (13 points), PART5.md Q20-Q30, PART8.md’s
    two open points, the seller facts only the owner can fill in (PART7.md (d)), a professional for the legal drafts, the country list with
    the UK/EU registration note, the decisions taken in parts 4, 5, 6 and in the part 9 fixes (TRANSACTIONS.md "part 9" notes: a failed
    printer read retries every 15 minutes and the owner hears after 24 h; an inquiry does not pause an order).
  - Still on the GM’s side: the gift’s item, its code group and who fills the pool; the `/privacy` text; the launch wiring (PART8.md).
- For the owner to do when they are ready (nothing blocks the build yet): open the Printful account and the separate Stripe account
  (Hong Kong, USD payouts, Adaptive Pricing); talk to an accountant about the UK and the EU before launch day.
- Nothing is on sale and nothing is deployed (the first throwaway test Worker was deleted on 24 Nov; the second cloud test has not run).

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

- GM session (since 26 Nov 2026, 13:50 JST): `session_01D6KLY2jCiNHEM4TzFZ11e4` ("Doodle Doggo · Game Manager"; the older `session_01D6KLY4qCSGZCym9CUpp5Hj`, `session_01D6KLY39DbX4YUzK61TBWQi` and `session_01D6KLY4c4fCxHWPdQRekZXZ` are archived; the MERCH session's parent in the session list is still the old one, so address the new id). G1-G3 are on its list for Thu 26 Nov 13:05 JST. MARKETING session: `session_01D6KLY4Gxx78VuyjbRFaSgb`.
- You work on `merch/shop` (and worktrees/branches from it). **You do not push to `main`, release, or deploy.** The GM merges, releases
  and deploys after the owner's go-ahead. Send the GM a short message when a part is ready to merge or when you need a change in shared
  files: `game/src/*`, `cloudflare/worker.js`, `cloudflare/schema.sql`, `site/tpl/*` and the site header, `tools/cf_*`. Prefer new files
  (`merch/`, `site/merch*`, `cloudflare/merch_*.js`) so merges stay small.
- Anything about reels, posts or captions goes to MARKETING, not to you and not to the GM.
