# Part 2: the `/merch` page, test mode (24 Nov 2026)

The prototype's six steps made real in `site/merch/`, phones first, English only. **Nothing is live**: no deploy, no outside service, no payment
code. The page talks only to a local fake of the order server; the Pay button shows "The shop is not open yet". `<meta name="robots" content="noindex">`,
and no other page links to `/merch`.

## What was built

| File | What it is |
|---|---|
| `site/merch/index.html` | The page. The site's own `/style.css`, fonts, `/js/site.js`, header and footer (copied from the generated English `site/about.html`; no "Merch" tab, the language menu says "The shop is in English for now"). A test-mode strip on top. |
| `site/merch/merch.css` | The page's styles, on top of `/style.css` (grew from the prototype's `merch.css`). |
| `site/merch/merch.js` | The steps, the basket, "Ship to", the name rules, the order page. Hash routes `#/`, `#/pick`, `#/thing`, `#/make`, `#/basket`, `#/order/<id>`. |
| `site/merch/mock.js` | The product drawings (a tee, size L flat, and an 11 oz mug from the front), pencil lines in the site's style, fills inside their outlines, no photos, no logos. The print is laid on **unchanged**: the exact string `PawPrint.print()` returned, inside one `<g class="pp-print">` that only moves and scales it. |
| `site/merch/api.js` | The API seam: `api.catalog()`, `api.quote()`, `api.checkout()`, `api.order()` (+ `api.cancel()`), the shapes of TRANSACTIONS.md 6.3. `MERCH_API = ''` = test mode: the fake. With a URL it would `fetch` the Worker, but this build never opens a payment page. |
| `site/merch/api_fake.js` | The fake order server (browser and Node). Reads `catalog.json`, prices a basket the way the server will, checks every line (recipe, product, colour, size, pose, name with `PawPrint.nameOk(name, { product })`, qty), answers checkout with `503 merch_closed`. `demoPay()` only with `?demo=1`. |
| `site/merch/catalog.json` | The static stand-in for `GET /merch/catalog` (same shape; money in US cents). Mug $19.99, tee $26.99 (2XL +$2, 3XL +$4, 4XL +$6: **placeholders** for "Printful's extra, rounded up"), tee colours and sizes = `PawPrint.TEE_COLOURS` sizes made in both the US and the UK; zones of SHIPPING.md model C; 224 countries with English names; `shut: true`. |
| `site/merch/print/<ART_VER>/` | The PawPrint bundle and print page of this build, copied by `tools/merch_build.js` (new step at its end). The page loads `/merch/print/<ART_VER>/pawprint.js`; the build rewrites that one script tag, so a cache never mixes builds. Older folders stay. |
| `merch/test_page.js` | Suite `merch_page` (276 checks, about 25 s). |
| `docs/design/merch/part2_shots/` | Every step at 390x844 and 1280x720, deviceScaleFactor 2 (`SHOTS=1`). PNGs: add them with `git add -f` if they are ignored. |

## The steps

1. **Landing** "Put your dog on a mug": the mug and the tee drawn with the player's own dog (or a ready-made one), prices from the catalog, the
   "Ship to" line, "Use my dog", how it works, four ready-made dogs (Lab, French Bulldog, Golden, Dachshund; no name), questions.
2. **Which dog?** From a link (`#p=...` → `PawPrint.merchFromHash`; kept in `sessionStorage` for this tab only, the hash becomes `#/pick`), else
   the save in this browser (`localStorage['pawhaven_proto_v1']`, **read only**, `merchFromSave`), else "We can't see any of your dogs from here yet"
   with Next off and the ready-made dogs. Cards: the dog drawn by PawPrint, name, breed, "playing now", Puppy / Newborn, what it wears. A bad link
   is said kindly.
3. **The thing**: mug and tee only. Products are the catalog's `on` **and** `PawPrint.PRODUCTS[id].launch`: stickers appear nowhere.
4. **Make it yours**: the preview (on the thing, or the print file alone with its size: "Your dog prints about 5.0 in wide"), pose (stand, sit,
   happy), name on/off and typed, colour (7 swatches; the patch note on colour), size (per colour) with a size guide, how many (1-3), "Add to basket"
   (or "Save changes" when changing a line). Names use `PawPrint.nameOk(name, { product })`: letters it can't draw ("Some of those letters we can't
   draw yet ..."), too long for that product ("A little shorter, please: up to 16 of these letters fit on the mug."), a word it won't print
   ("Let's try another name."), empty ("Type a name, or turn the name off."). The typed name goes into the line's recipe (`merchEncode`).
5. **Basket**: up to `max_lines` 6 lines, `max_qty` 3 each (the same thing added again merges, capped at 3); qty −/+, Change, Remove; each line's
   picture is its print. "Ship to" (in the shop bar on every step, guessed from the browser language, kept under `dd_merch_ship_v1`); the shipping
   line, the ETA, the totals **from `api.quote()`** only, "Orders of $35 or more ship free." from the zone, the one USD/currency line, the import-tax
   line (zone `world`), separate parcels (mug + tee), "Coming soon to the United Kingdom ..." for shut countries (no total, Pay off), the policy
   card, "You need to be 18 or over to order", Pay → **"The shop is not open yet"** card. The basket lives under `dd_merch_basket_v1` (never the save).
6. **Thank you / order page** (only with `?demo=1`, "Test only: see the thank-you page"): marked "Test order: made up ...", "We'll start printing
   at 14:35. If you change your mind before then, you can cancel here." (a plain time), the four stages, the lines and totals, Cancel (a calm dialog).

Words: no "buy", "sell" or "shop for dogs"; no countdowns, no "only N left", no pre-ticked boxes. "Printed and posted by our print partner" (no name, no logo).

## How to run

1. `NODE_PATH=$(npm root -g) node tools/merch_build.js` (also copies the print folder into `site/merch/print/<ART_VER>/` and fixes the script tag).
2. `NODE_PATH=$(npm root -g) node merch/test_page.js` (serves `site/` itself, the brand icons at the root as `tools/cf_site.js` does).
   `SHOTS=1` also writes `docs/design/merch/part2_shots/`.
3. By hand: serve `site/` as the web root (`npx http-server site`) and open `/merch/` (`/merch/?demo=1` for the whole flow). A save from
   `/play/` on the same origin shows up in step 2.

The suite covers: the fake on its own (shape, prices, zones, every quote and checkout error, demo orders, cancel); dogs from a save, a link, a bad
link and none; every step; add, change, remove; the 6-line and 3-each limits; "Ship to" US, Canada, Hong Kong, the longest name and the UK (shut);
every name refusal; the preview, the file view, the product tiles and the basket pictures equal `PawPrint.print()` for the same options (both
parsed by the same browser); no stickers; the page's quote equals the fake's to the cent for 8 baskets in 8 countries; Pay never navigates;
nothing written to the game's save; no console errors; no request off the origin; at 360x640, 390x844 and 1280x720: no sideways scroll, every
tap at least 44 px, no text past its card (with 6 lines, a 20-letter name, a puppy, a newborn, dark tees and "St. Vincent and Grenadines").

## Decided here (the owner may choose otherwise)

- **Shut countries** in the static catalog: the UK (with the Isle of Man), the EU 27 (with Monaco and France's overseas departments), Brazil and
  South Korea show "(coming soon)" (TRANSACTIONS.md 10 point 1). Never listed: COUNTRIES.md tier 4 and places with no post. Everything else is open.
- **Tee sizes** offered per colour = those made in both the US and the UK (`sizes.both`): white S-4XL, black XS-4XL, navy and ice blue XS-2XL,
  the rest S-2XL. 2XL-4XL prices are placeholders until the Printful key.
- **Delivery estimates** shown: Printful's making plus post, +2 days on the top end (TRANSACTIONS 10 point 11): USA/Japan 5-11, Canada/Australia/NZ
  5-13, elsewhere 7-27 working days.
- **Everywhere else** follows model C to the letter: $11.99 + $5.99 per extra mug or tee, never free (9 things to St. Vincent = $59.91 shipping).
- The gift code block of the prototype is left out (TRANSACTIONS 10 point 5 is still open). "Terms of sale" and "Shipping and returns" are plain
  text until part 7 writes them.
- The fake answers quotes while the shop is shut (so prices show before launch); the real server's table lists `503 merch_closed` for quotes too.
  **Part 3 should answer quotes while shut** (recommended), or the page shows "We couldn't work out the total".

## For the Game Manager (shared files, later)

- **`tools/cf_site.js` walks all of `site/`**: the next site deploy would publish `/merch/` (test mode, noindex, unlinked, about 0.8 MB of PawPrint
  per build). Skip the `merch` folder in its `walk()` until launch, or accept it as a hidden test page.
- The header "Merch" tab (the prototype's peach tab with the mug doodle, before About Us; six tabs on phones) and a footer link, at launch only.
- The page as a `site/tpl` template with i18n keys (English only at launch; the other 11 languages get the one line "The shop is in English for
  now"), built by `tools/site_i18n.js` / `tools/pages.js`; then the header and footer come from the template instead of the copy.
- CSP for `/merch/`: scripts from self only (`/merch/print/<ART_VER>/pawprint.js`, `api_fake.js`, `api.js`, `mock.js`, `merch.js`, `/js/site.js`),
  no inline script, `connect-src 'self'` plus `https://merch-api.doodledoggo.app` once part 3 sets `MERCH_API`; styles self + the inline `style`
  attributes on the colour swatches.
- Register the suite in `game/run_tests.js` as `merch_page` (`node merch/test_page.js`, needs Playwright; after `tools/merch_build.js`).
- When part 3 is live: set `MERCH_API` in `site/merch/api.js`, and the Pay step then opens `data.url` (Stripe) — that one line is deliberately
  not written yet. Keep `catalog.json` only as a test fixture.
