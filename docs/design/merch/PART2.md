# Part 2: the `/merch` page, test mode (24 Nov 2026)

The prototype's six steps made real in `site/merch/`, phones first, English only. **Nothing is live**: no deploy, no outside service, no payment
code. The page talks only to a local fake of the order server; the Pay button shows "The shop is not open yet". `<meta name="robots" content="noindex">`,
and no other page links to `/merch`.

## What was built

| File | What it is |
|---|---|
| `site/merch/index.html` | The page. The site's own `/style.css`, fonts, `/js/site.js`, header and footer (copied from the generated English `site/about.html`; no "Merch" tab, the language menu says "The shop is in English for now"). A test-mode strip on top. |
| `site/merch/merch.css` | The page's styles, on top of `/style.css` (grew from the prototype's `merch.css`). |
| `site/merch/merch.js` | The steps, the basket, "Ship to", the name rules, the order page. Hash routes `#/`, `#/faq`, `#/pick`, `#/thing`, `#/make`, `#/basket`, `#/order/<id>`; the address always names the step on show (Back after Add, a deep link to a step with nothing chosen, junk after a step: the address is fixed); the footer "Questions" lands on the questions from any step. |
| `site/merch/mock.js` | The product drawings (a tee, size L flat, and an 11 oz mug from the front), pencil lines in the site's style, fills inside their outlines, no photos, no logos. The print is laid on **unchanged**: the exact string `PawPrint.print()` returned, inside one `<g class="pp-print">` that only moves and scales it. |
| `site/merch/api.js` | The API seam: `api.catalog()`, `api.quote()`, `api.checkout()`, `api.order()` (+ `api.cancel()`), the shapes of TRANSACTIONS.md 6.3 (with its note of 24 Nov). `MERCH_API = ''` = test mode: the fake. With a URL it `fetch`es the Worker (the suite runs the page that way against a live-style server answering exactly the 6.3 fields), but this build never opens a payment page, and `?demo=1` does nothing there. |
| `site/merch/api_fake.js` | The fake order server (browser and Node). Reads `catalog.json`, prices a basket the way the server will, checks every line (recipe, product, colour, size, pose, name with `PawPrint.nameOk(name, { product })`, qty), answers a quote while shut with `shut: true` (a `soon` country: 403 `country_closed`), answers checkout with `503 merch_closed`. `demoPay()` only with `?demo=1`. |
| `site/merch/catalog.json` | The static stand-in for `GET /merch/catalog` (same shape; money in US cents). Mug $19.99, tee $26.99 (2XL +$2, 3XL +$4, 4XL +$6: **placeholders** for "Printful's extra, rounded up"), tee colours and sizes = `PawPrint.TEE_COLOURS` sizes made in both the US and the UK; zones of SHIPPING.md model C with `notes` as codes (`vat_included` for UK/EU, `import_tax` elsewhere); 224 countries as `{code, zone, soon}` with **no names**; `shut: true`. Exactly the fields of 6.3, nothing more. |
| `site/merch/print/<ART_VER>/` | The PawPrint bundle and print page of this build, copied by `tools/merch_build.js` (new step at its end). The page loads `/merch/print/<ART_VER>/pawprint.js`; the build rewrites that one script tag, so a cache never mixes builds. Older folders stay. |
| `merch/test_page.js` | Suite `merch_page` (632 checks, about 45 s). `LOOK=<dir>` also writes the review pictures. |
| `docs/design/merch/part2_shots/` | Every step at 390x844 and 1280x720, deviceScaleFactor 2 (`SHOTS=1`); the basket, closed and order pictures show the usual case (3 lines to the United States, over $35, free shipping). Six are kept in git (`basket_390`, `make-tee_390`, `pick_390`, `home_1280`, `closed_390`, `order_1280`); add others with `git add -f`. |

## The steps

1. **Landing** "Put your dog on a mug": the mug and the tee drawn with the player's own dog (or a ready-made one), prices from the catalog, the
   "Ship to" line, "Use my dog", how it works, four ready-made dogs (Lab, French Bulldog, Golden, Dachshund; no name), questions.
2. **Which dog?** From a link (`#p=...` → `PawPrint.merchFromHash`; kept in `sessionStorage` for this tab only, the hash becomes `#/pick`), else
   the save in this browser (`localStorage['pawhaven_proto_v1']`, **read only**, `merchFromSave`), else "We can't see any of your dogs from here yet" (playing on itch.io: "pick a ready-made dog for now"; no promise of a game button)
   with Next off and the ready-made dogs. Cards: the dog drawn by PawPrint, its own game name (escaped text, even when the print font can't draw it), breed, "playing now", Puppy / Newborn, what it wears. A bad link
   is said kindly.
3. **The thing**: mug and tee only. Products are the catalog's `on` **and** `PawPrint.PRODUCTS[id].launch`: stickers appear nowhere.
4. **Make it yours**: the preview (on the thing, or "The picture we print" alone with its size: "Your dog prints about 5.0 in wide"), pose (stand, sit,
   happy), name on/off and typed, colour (7 swatches; the patch note on colour), size (per colour) with a size guide, how many (1-3), "Add to basket"
   (or "Save changes" when changing a line). Names use `PawPrint.nameOk(name, { product })`: letters it can't draw ("Some of those letters we can't
   draw yet ..."), too long for that product ("A little shorter, please: up to 16 of these letters fit on the mug."), a word it won't print
   ("Let's try another name."), empty ("Type a name, or turn the name off."). The typed name goes into the line's recipe (`merchEncode`). A game name the font can't draw (an emoji, kana, a refused word) starts with the name print off and one line: "We can't draw these letters yet. Print without the name, or type one we can draw." On a small phone the step opens with the preview in view.
5. **Basket**: up to `max_lines` 6 lines, `max_qty` 3 each (the same thing added again merges, capped at 3); qty −/+, Change, Remove; each line's
   picture is its print. "Ship to" (in the shop bar on every step but the order page, named by `Intl.DisplayNames` in the page's language, the code as a fallback, sorted by the shown name; guessed from the browser language, kept under `dd_merch_ship_v1`); the shipping
   line, the ETA, the totals **from `api.quote()`** only, "Orders of $35 or more ship free." from the zone, the currency line "Prices are in US dollars. On the payment page you may be offered your own currency.", the notes from the quote's codes (`import_tax`, `vat_included`, `separate_parcels`; the words live in the page), "Coming soon to the United Kingdom ..." for shut countries (no total, Pay off), the policy
   card, "You need to be 18 or over to order. Younger? Ask a grown-up to order for you.", Pay → **"The shop is not open yet"** card. The bag button says its count ("Basket, 3 things").
   The basket lives under `dd_merch_basket_v1` (never the save), without ids. **A stored basket is untrusted**: on load and on every `storage` event
   from another tab each line is checked against the catalog and PawPrint (recipe decodes and draws, launch product, colour, size, pose, name through
   `nameOk` for that product, qty a whole number 1 to 3, at most `max_lines`, the same thing twice merged); qty is repaired, anything else is dropped and
   said kindly ("One thing in your basket can't be made any more, so we took it out."); line ids are made fresh on every read (a line that is still the
   same thing keeps its id in that tab). Everything from storage, a link, the save or the server is escaped or set as text; one line that can't draw
   shows "We can't draw this one just now" with Remove, never a blank basket. "Change" on a line another tab removed adds it back as a new line.
   Every error code of 6.3 has its own words (`art_changed` with a Reload button; `price_changed` shows the new total and asks again, never pays by
   itself); `bad_line`, `bad_name`, `bad_qty`, `variant_off` mark their line. One nonce per basket and country, reused on a retry.
6. **Thank you / order page** (only with `?demo=1`, "Test only: see the thank-you page"): marked "Test order: made up ...". The cancel line follows the
   server's `can_cancel` and `cancel_until`: "We'll start printing at 14:35. If you change your mind before then, you can cancel here." in the hour,
   "Printing has started." after it (no cancel line). The four stages show the order's own dates (received from `paid_at`, sent and arrived from the
   parcels, with a tracking link). The page never needs a line's recipe (cleared after 24 months): it uses `l.name` and draws the dog only when a
   recipe is there. No "Ship to" picker here. Cancel is a calm dialog.

Words: no "buy", "sell" or "shop for dogs"; no countdowns, no "only N left", no pre-ticked boxes. "Printed and posted by our print partner" (no name, no logo).

## How to run

1. `NODE_PATH=$(npm root -g) node tools/merch_build.js` (also copies the print folder into `site/merch/print/<ART_VER>/` and fixes the script tag).
2. `NODE_PATH=$(npm root -g) node merch/test_page.js` (serves `site/` itself, the brand icons at the root as `tools/cf_site.js` does).
   `SHOTS=1` also writes `docs/design/merch/part2_shots/`.
3. By hand: serve `site/` as the web root (`npx http-server site`) and open `/merch/` (`/merch/?demo=1` for the whole flow). A save from
   `/play/` on the same origin shows up in step 2.

The suite covers: the fake on its own (exactly the 6.3 fields, prices, zones, every quote and checkout error, demo orders, cancel); **32 baskets in every
zone priced by hand** from SHIPPING.md (the page and the fake against hand-written totals: $34.99 pays shipping and $35.00 ships free, $70.00 in Canada,
the $5.99 extra-item fee, 2XL-4XL tees, 6 lines of 3 to St. Vincent, the US and Canada; UK/EU with those countries opened in a test catalog); a stale and a
hostile stored basket; a game name the print can't draw; every error code's words; one nonce; the order page without recipes, after the hour, shipped
and arrived; two tabs; Back/Forward, deep links and the footer link; the page against a live-style api; contrast (every text at least 4.5:1, money and
legal lines in ink, measured); `pawhaven_cloud_v1` and the save never written; no dialogs; dogs from a save, a link, a bad
link and none; every step; add, change, remove; the 6-line and 3-each limits; "Ship to" US, Canada, Hong Kong, the longest name and the UK (shut);
every name refusal; the preview, the file view, the product tiles and the basket pictures equal `PawPrint.print()` for the same options (both
parsed by the same browser); no stickers; Pay never navigates;
nothing written to the game's save; no console errors; no request off the origin; at 360x640, 390x844 and 1280x720: no sideways scroll, every
tap at least 44 px, no text past its card (with 6 lines, a 20-letter name, a puppy, a newborn, dark tees and "the Falkland Islands (Islas Malvinas)", the longest name).

## Decided here (the owner may choose otherwise)

- **Shut countries** in the static catalog: the UK (with the Isle of Man), the EU 27 (with Monaco and France's overseas departments), Brazil and
  South Korea show "(coming soon)" (TRANSACTIONS.md 10 point 1). Never listed: COUNTRIES.md tier 4 and places with no post. Everything else is open.
- **Tee sizes** offered per colour = those made in both the US and the UK (`sizes.both`): white S-4XL, black XS-4XL, navy and ice blue XS-2XL,
  the rest S-2XL. 2XL-4XL prices are placeholders until the Printful key.
- **Delivery estimates** shown: Printful's making plus post, +2 days on the top end (TRANSACTIONS 10 point 11): USA/Japan 5-11, Canada/Australia/NZ
  5-13, elsewhere 7-27 working days. (25 Nov 2026, part 6 review batch: now from `catalog.js` `ZONES[*].eta`, the single source, with
  `catalog.json` generated from it: USA/Japan 5-11, Canada/Australia/NZ 4-16, elsewhere 7-27; the shop page says the one posting promise, "we post
  every order within 7 working days of payment".)
- **Everywhere else** follows model C to the letter: $11.99 + $5.99 per extra mug or tee, never free (9 things to St. Vincent = $59.91 shipping).
- The gift code block of the prototype is left out (TRANSACTIONS 10 point 5 is still open). "Terms of sale" and "Shipping and returns" are plain
  text until part 7 writes them. (Part 6, 25 Nov 2026: both done: the gift card is on the order page, and the footer and the pay card link
  `/merch/terms/`, `/merch/shipping/` and `/merch/seller/`; PART6.md.)
- Settled in TRANSACTIONS.md 6.3 (note of 24 Nov): quotes answer while shut with `shut: true`; the page still has words for a quote's `merch_closed`.
- Grey text: the site's `--muted` #8A7468 is 3.9-4.3:1 on this page's backgrounds, so `merch.css` sets `--muted: #6B5548` for this page (4.9:1 or
  more on every fill) and the money and legal lines use the ink.

## Left (not in part 2)

- **US territories** (Puerto Rico, Guam, the US Virgin Islands, American Samoa, the Northern Mariana Islands): priced as "everywhere else" or not
  listed until the print partner's real rates are in (part 5).
- The 38 "(coming soon)" countries stay as the catalog says (the owner's call at launch); a browser in one of them lands on "Coming soon to ...".
- "Terms of sale" and "Shipping and returns" stay plain text, no tooltip, until part 7 writes them.

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
