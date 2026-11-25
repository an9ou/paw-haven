# Part 8: the in-game entry points (a brief for the Game Manager)

Written by the MERCH session, 25 Nov 2026 (JST). **The GM builds this on `main`, at launch, and only after the owner's go-ahead and launch
date** (merch is a special update). Nothing here is built in the game yet. The design pictures are `docs/design/merch/prototype/entry.html`
and `shots/entry_points.png`; the words are DESIGN.md "In-game entry points".

## What the player gets

1. **A "Merch" tile in the phone More tray**, the 12th, after Kind shop, with "new!" tape until first opened. Desktop: the same entry in the
   top bar's More menu. Tile words: "Put my dog on merch".
2. **A confirm sheet** before anything opens (a shop page, so a grown-up line; and it says exactly what leaves the game):
   - Title: "Put my dog on merch"
   - Body: "Opens doodledoggo.app in a new tab, with how your {n} dogs look: names, breeds, coats and outfits. Nothing else from your game
     goes with them." (one dog: "with how {name} looks: name, breed, coat and outfit.")
   - Line: "It's a shop, so ask a grown-up first."
   - Buttons: [Open the merch page] [Not now]
   - Languages other than English get one more line: "The merch page is in English."
3. **"Put this on a mug" under the Share my dog picture** (`58_share.js`: the share sheet; not the three "Share this moment" cards, see the
   open points). It goes through the same confirm sheet (one dog) and opens the merch page with that dog, the mug chosen and the happy pose.

No coins, no rewards, no missions, no timers, no badges for buying. The game never shows prices. Never words that sound like selling dogs:
it is always "put your dog on a mug / a tee".

## The link (the only thing that leaves the game)

`https://doodledoggo.app/merch/#p=<recipes>` opened in a **new tab** (`window.open(url, '_blank', 'noopener')`, the way the Kind shop opens
Stripe; on itch.io the game is in a frame, so never navigate the frame itself). The part after `#` is never sent to any server.

- `<recipes>` = `merchEncode(dogs.map(merchRecipe))`: looks only (breed, genes as counts, eyes, art seed, age stage, sex, sparkle, mix head,
  worn items, the name). No ids, no save data, no account. 26 to 35 characters a dog.
- **Which dogs:** the active dog first, then the others in pack order, **8 at most** (the page refuses more, and links over 1024
  characters). From the share sheet: that one dog only.
- **From the share sheet** add `&prod=mug&pose=happy&from=share` after the recipes (the page opens the "make it" step with the mug chosen;
  unknown or switched-off products fall back to the dog list).
- The same link is used everywhere, also on doodledoggo.app/play/ where the page could read the save itself: one path, one test.
- A dog the art cannot encode (it should not happen: the round trip is proven for all 40 breeds) is left out; with none left the sheet says
  "We couldn't get your dog ready. Try again after the next update." and opens nothing.

## What MERCH hands over (ready before launch; ask if it is not there)

| Piece | Where | State |
|---|---|---|
| The small encoder for the game: `MERCH_WEAR`, `merchRecipe(dog)`, `merchEncode(recipes)`, `merchLink(dogs, opts)` (20 KB, 8.5 KB gz: no art, no decode, no network, no storage). **Generated**: `merch/game/gen.js` copies the WEAR table, the recipe, the name rules and the wire format word for word from `merch/pawprint_core.js` and `merch/names.js` (`--check` fails when the copy is stale); not an ART_VER input. It relies on two game names only, both read lazily: `window.PawGenes` (`BREEDS`, `phenotype`, `STARTER_GENES`) and `window.PawArt` (`DOGS`). Top-level names: `MERCH_WEAR`, `MERCH_SHARE`, `merchKitC`, `merchKit`, `merchMake`, `merchRecipe`, `merchEncode`, `merchLink` (none is used in `game/src/` today) | `merch/game/61_merch_enc.js`: copy it **unchanged** to `game/src/61_merch_enc.js` and list it in `game/src/ORDER.txt` before `23_boot.js` (after `60b_sleep.js`) | **done (part 8b, 25 Nov 2026)**. Test: `node merch/game/test_enc.js` (36 checks: equal to PawPrint for 6098 recipes, 1500 packs, 326 save dogs; the link rules; the game's scope) |
| The page side of the share link: `&prod=`, `&pose=`, `&from=share` open "make it" with that dog, product and pose (Back walks make → thing → dog list); a quiet line on the dog list from a link: "These are your dogs from the game, just as they look today." | `site/merch/merch.js` (`shareAsk`, `openShare`), `merch.css` (`.fromq`), suite `merch_page` | **done (part 8b)**: 1756 checks (132 new) |
| The round trip test against the real game build (483 of 483 equal; part 8b: the game's encoder equals PawPrint's for 161 of 161 dogs, and `merchLink` on the live save) | `merch/test_merch_game.js` | done. **On every release that changes dog art, genes, wearables or the core:** `node merch/game/gen.js --check`, `node merch/game/test_enc.js`, then `node game/build.js && node game/harness.js merged && NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors node merch/test_merch_game.js`; if the core changed, run `node merch/game/gen.js` and copy the file again |

### How to wire it (GM)

1. `cp merch/game/61_merch_enc.js game/src/61_merch_enc.js`; add `61_merch_enc.js` to `game/src/ORDER.txt` before `23_boot.js`. Never edit the copy.
2. The tile and the confirm sheet: `const url = merchLink(S.dogs, { active: S.activeId })`; `url === null` → the "couldn't get your dog ready" line.
3. The share sheet: `merchLink([dog], { share: { prod: 'mug', pose: 'happy' } })` (one dog only, whatever is passed).
4. The test copy: `merchLink(dogs, { base: 'https://test.doodledoggo.app/merch/' })`. Open with `window.open(url, '_blank', 'noopener')`.
5. The count for the sheet ("your {n} dogs") is the number of dogs in the link: `PawPrint` is not in the game, so count with
   `S.dogs.filter((d) => merchRecipe(d)).slice(0, 8).length` (or one, from the share sheet).

Rule that follows from the first row: **`WEAR` is append only.** A new wearable in the game (`dogs/pawart_dogs.js` `OUT`) must be appended to
`WEAR` in `merch/pawprint_core.js` in the same release, or the test fails. An item the list lacks is simply not drawn on the print.

## What the GM builds (on `main`, at launch)

- `game/src/61_merch.js` (+ the encoder file above, + `css` if needed) in `ORDER.txt`: the tile, the confirm sheet, the share-sheet button,
  `merchOpen(dogs, opts)`.
- **The gate:** `MERCH_FROM` in the game (an ISO time with the JST offset, like `HP_FROM`; empty = hidden), set to the same moment as the
  Worker's `MERCH_FROM`. Before it: no tile, no button, no text, nothing in the More tray count. A rollback is `MERCH_FROM = ''` plus a
  release; the shop itself is shut on the Worker in seconds (`MERCH_OFF = "1"`), and the page then says it is shut, so the tile never
  leads to a broken page.
- `FW_POPS.more` gets `'merch'` (12 tiles: check the phone tray at 360x640 with `paw-fit`), `FW_MORE_ON.merch` = the gate.
- **Save data:** one additive field for the "new!" tape, for example `S.merchN = 0` in `migrate()`; nothing else is stored. The game never
  learns whether anything was bought.
- **The thank-you gift** is the existing gift code system ("Have a code?"): the GM makes the item and the code group and tells MERCH the
  item's name (`MERCH_GIFT_NAME`), the group name and who fills the pool (`tools/merch.sh gift add`). Codes with no end date, one group.
- **Texts:** new `tt()` keys for the tile, the sheet and the button, translated once in the launch batch (12 languages), plus the "The
  merch page is in English." line. The NEWS entry only at launch, with the owner's date.
- **Site wiring (already on the GM's list):** the header or footer link to `/merch`, the `/privacy` "Merch orders" text (PART7.md), the
  Stripe Terms URL, `site/merch/**` left out of every site deploy until launch (`tools/cf_site.js` walks all of `site/`), the merch suites
  in `game/run_tests.js`.
- **itch.io and the Android build:** the copy on itch.io opens the same link in a new tab; check that the frame allows it (the Kind shop
  already opens Stripe from there). The dev button and panel stay stripped as always.

## Tests the GM's suite should hold (suggested name `merch_entry`)

1. Gate empty or in the future: no tile on phone or desktop, no share-sheet button, `S` unchanged, no new text on any screen.
2. Gate passed: the tile is the 12th, the tape shows once, the tray fits at 360x640 and 390x844 in every language.
3. The sheet names the right number of dogs; [Not now] opens nothing; [Open the merch page] calls `window.open` once with a
   `https://doodledoggo.app/merch/#p=` address and `noopener`, and never changes the game's own address.
4. The link decodes on the page side to the same dogs: `PawPrint.merchFromHash(link).dogs` drawn with `PawPrint.dogSVG` equals the game's
   share picture for the active dog (reuse `merch/test_merch_game.js`).
5. More than 8 dogs: the active dog is first and 8 are sent. A name the print font cannot draw still opens the page (the page offers to
   type one).
6. The share-sheet button sends one dog with `&prod=mug&pose=happy&from=share`.
7. Nothing else leaves: no fetch, no beacon, no cookie; `localStorage` gains only the tape field.
8. Words: the build's word check passes; no "sell", "buy your dog" or similar in any of the 12 languages.

## Open points for the owner (asked with the launch go-ahead, recommendation first)

1. The tile for everyone, or only from player level 2? **Recommend everyone**: it is one quiet tile, and the sheet has the grown-up line.
2. "Put this on a mug" under every share picture, or only in the share sheet? **Recommend only the share sheet at launch** (the three
   "Share this moment" cards stay as they are): fewer shop buttons in happy moments.
