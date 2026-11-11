# Kind shop: the launch carousel (v2.24)

> **LIVE (9 Nov 2026, GM confirmed): the Kind shop is out (v2.24) on doodledoggo.app, itch.io 2.24 and GitHub Pages. Post now, in the owner's order: the Reels first, then the carousel.** Final names and prices (live catalog): Supporter Pack US$4.99 once; Tokyo Street US$2.99 or 1,500 coins each look; Cozy Winter US$2.99 or 1,500 coins each look; Robo Scoop US$1.99 or 10,000 coins; Garden Sprinkler and Auto Water Bowl US$0.99 or 6,000 coins each; Comfort Kit US$2.99; coins 2,000 / 5,000 / 14,000 for US$0.99 / 1.99 / 4.99 (v2.24.2 "Better deals", 11 Nov 2026). The released branch's item art and words match what these were built from. No rewarded ads yet: never mention ads. Captions stay without prices (kind, no pressure); "from US$0.99" is true if the owner wants a price line in English captions. Never on RedNote.


**HOLD: post only after the GM confirms the shop is live; re-check item names/prices at launch.** (The shop goes live once the merged build passes its tests, together with the owner and the Game Manager; `SHOP_LIVE` is still false on `claude/kind-shop`.) English only. Made by Marketing on 9 Nov 2026 for the Game Manager's brief. Not posted anywhere. The Kind shop Reel is a separate piece (`KIND_SHOP_REEL.md`).

| File | |
|---|---|
| Slides | `brand/instagram/launch/shop_carousel/kind-shop-1.jpg` … `kind-shop-8.jpg` (1080 x 1350, 4:5, upload in this order) |
| Build | `brand/instagram/launch/shop_carousel/build_shop_carousel.js` |

## The slides

Sketchbook paper with the pencil frame, Caveat, pencil boxes with pastel washes kept inside the lines, tape, sparkles and hearts. Every drawing is the game's own art from the `claude/kind-shop` branch (`world/pawart_shop.js`, `dogs/pawart_dogs.js` with the Tokyo Street wearables on Noodle). Noodle the Dachshund hosts. A small `@doodledoggo.app  n/8` footer on slides 2 to 8. No prices on any slide, in cash or coins.

1. **Cover**: a pink **NEW** sticker, **a kind shop**, *support the game. it's complete without paying.* Noodle in the Tokyo Street set (Sukajan Jacket, Bucket Hat, Round Shades, Paw Tote, Little Sneakers), around him the Golden Paw Cottage, the Doggy Snow Globe, the Cocoa Mug Lamp (lit), the Robo Scoop and the Woolly Armchair; the logo. Checked at 270 px wide: the headline and Noodle read clearly.
2. **we never sell dogs.** *or Bond, welfare or chances.* Cards: no loot boxes / no random paid rewards / Sparkle stays free / a confirm step on every purchase. Plain Noodle sitting with a "not in the shop" sticker.
3. **Supporter Pack** (tag "a thank-you pack"), *only once. never for coins.* The Golden Paw Cottage, the Golden Name Tag, the Founding Friend badge, Gerald's thank-you letter; the perks in the game's own words: +20% coins from walks, crops grow 25% faster, a second calendar gift every day (a treat, food or seeds), 2,000 coins, once.
4. **Tokyo Street** (tag "looks pack"), *6 outfits. looks only.* Noodle dressed, a "NEW: a feet slot!" sticker pointing at his sneakers, the six outfits in tiles with their names.
5. **Cozy Winter** (tag "looks pack"), *6 cosy things for the house. looks only.* Woolly Armchair, Cocoa Mug Lamp, Doggy Snow Globe, Cardboard Fireplace, Tea-Cosy Bed, Cable-Knit Rug.
6. **comfort tools**, *little helpers, if you want them.* Robo Scoop (tidies one pee or poop at home), Garden Sprinkler (waters a dry veggie plot), Auto Water Bowl (fills the bowl, your dog drinks). Cards: switch them off any time in Settings / the hand way always works / nothing bad happens without them.
7. **earn it by playing** (tag "for everyone"): *everything except the Supporter Pack and the coins can also be earned by playing.* Three items with "also for coins" (Bucket Hat, Woolly Armchair, Garden Sprinkler), Noodle walking, *the game is complete without paying.*, and small: *ask a grown-up before you buy. payments are made on Stripe.*
8. **made by one person. thank you for helping!** Noodle (happy, dressed), the logo, the doodledoggo.app pill, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp with their icons (`brand/kids/endcard.js`).

### Where the words come from

The build reads `game/src/52_kindshop.js` and `V224.md` from the branch and stops if a line it quotes has changed (the "Why is there a shop?" text, the Supporter perks `ks.g_*`, the pack and tool lines `ks.l_*`, `ks.tools_note`, `ks.ask`, the shop rule in V224.md 0, Sparkle and the confirm step).

- **"never pay to win" is not used.** The brief's cover line was "support the game. never pay to win.", but the shop sells coin packs and the Supporter Pack adds +20% walk coins and faster crops (V224.md 1; the design doc itself calls the walk perk "a paid coin boost"). The docs' own promise is used instead: "the game is complete without paying" (V224.md 0, Gerald's "Why is there a shop?").
- **"Also for coins" says exactly what the game says**: "Everything here except the Supporter Pack and the coins can also be earned by playing" (the Comfort Kit itself is not sold for coins, but each of its three tools is).
- **No ads anywhere.** V224.md 0: "No rewarded ads in this release" (they come later, on doodledoggo.app/play/ only).
- **No prices**, cash or coins, on the slides or in the captions. The handoff confirms live prices are set but does not list them; prices sit only in V224.md and the game. If the owner wants "from US$0.99" in the caption at launch, check the live shop first (the cheapest items are the 1,000-coin pack, the Garden Sprinkler and the Auto Water Bowl at 0.99 in V224.md).

### Checks (every slide; the build stops on a miss)

Pill and card text ink-centred (`centre_text.js` `centreCheck`); headlines and lines ink-centred on the page; everything at least 60 px inside the edges; dogs and items at least 28 px apart (`apartCheck`, on each drawing's real ink box); tiles never touching; every drawing inside its own tile; no text over a drawing or across a tile edge. Smallest text 34 px (the footer); body text 36 to 54 px.

## How to rebuild

```
S=<scratch dir>; mkdir -p $S/ks
git archive origin/claude/kind-shop dogs world game/src/52_kindshop.js V224.md | tar -x -C $S/ks
ART_ROOT=$S/ks NODE_PATH=$(npm root -g) node brand/instagram/launch/shop_carousel/build_shop_carousel.js        # all 8
ART_ROOT=$S/ks NODE_PATH=$(npm root -g) node brand/instagram/launch/shop_carousel/build_shop_carousel.js 1,4    # only slides 1 and 4
```
Caveat and Andika come from Google Fonts, so the build needs the network. It also writes `kind-shop-1-thumb.png` (the cover at 270 px, for a look; not in git).

## Captions

No links in the captions (the link is in the bio), no em dashes, one ask each. No Threads (no account). No RedNote version yet.

### Instagram

```
we opened a kind shop in Doodle Doggo, and you can't buy a dog in it 🖍️

it's there to support the game. Doodle Doggo is a free cozy dog game made by one person, and the shop helps keep the crayons sharp

inside: the Supporter Pack (the Golden Paw Cottage, a Golden Name Tag, a Founding Friend badge and a thank-you letter from Gerald), Tokyo Street outfits with little sneakers for a new feet slot, Cozy Winter things for the house, comfort tools you can switch off any time, and coin packs

we never sell dogs, Bond, welfare or chances. no loot boxes, no random paid rewards, and Sparkle stays free. everything except the Supporter Pack and the coins can also be earned by playing, and the game is complete without paying. kids, ask a grown-up before you buy 🐾

which would you get first? comment below 👇

#DoodleDoggo #CozyGames #IndieGame #DogGame
```
`caption.py` READY (search terms "cozy dog game", "kind shop"; 1 ask, 4 hashtags). `detect.py` human score 81.0 PASS. `humanize.py`: nothing to strip.

**Alt text (cover):** A crayon dachshund in a green jacket, bucket hat, sunglasses and little sneakers, with a golden cottage, a snow globe, a cocoa mug lamp, a robot scoop and an armchair around him. Text: NEW, a kind shop, support the game, it's complete without paying.

### X (258 characters)

```
we opened a kind shop in Doodle Doggo 🖍️ you can't buy a dog in it. no Bond, welfare or chances either, and no loot boxes. everything except the Supporter Pack and the coins can also be earned by playing

which would you get first? 👇

#DoodleDoggo #CozyGames
```
`detect.py` 62.6 (REVIEW: short text, low sentence variety; no slop, no em dash). Post the first 4 slides with it.

## At launch (before posting)

- The GM confirms the shop is live (`SHOP_LIVE = true`, the merged build green and deployed).
- Re-check the item names in the live shop against the slides (a renamed item means a rebuild: the build reads the names from the branch).
- Prices: none are shown; if a price is added to a caption, take it from the live shop.
