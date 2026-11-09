# Wardrobe glow-up: one before / after image post

One Instagram image for v2.23.3 "Tidy wardrobe" (live 9 Nov 2026). English only, one picture: no RedNote version, no carousel, no video. **Made, waiting for the owner. Not posted anywhere.**

| File | |
|---|---|
| Image | `brand/instagram/launch/wardrobe_post/wardrobe-glowup.jpg` (1080 x 1350, 4:5) |
| Build | `brand/instagram/launch/wardrobe_post/build_wardrobe_post.js` (the layout), `brand/instagram/launch/wardrobe_post/capture_wardrobe.js` (the two game screenshots) |

## What the post shows

Sketchbook paper with the pencil frame. Headline **our wardrobe had a glow-up** (a pink crayon swash under "glow-up", two sparkles), and under it **tabs · tidy tiles · see your dog while you scroll**. Two crayon phone frames side by side with a clear gap and a pencil arrow between them, labelled **before** (a red crayon cross) and **after** (yellow pill, a green crayon tick). At the bottom: the logo, small and centred, a heart and a sparkle on the left, a pink **so tidy!** sticker on the right.

Both phones hold the real game, captured on a 393 x 852 phone at 3x with the same save: Noodle the Dachshund in the Flower Crown, Heart Sunglasses, Red Bandana and Knit Winter Sweater, charm Lucky Penny. He owns 14 everyday Boutique clothes (Party Hat, Flower Crown, Pom-pom Beanie, Chef Hat, Cowboy Hat; Heart Sunglasses; Red Bandana, Bow Tie; Yellow Raincoat, Frog Raincoat, Knit Winter Sweater, Superhero Cape, Tutu, Bumblebee Suit) and two charms (Lucky Penny, Sparkle Stone). No festival, Winter Market or Christmas items. The Cowboy Hat and Bumblebee Suit were bought last and not seen yet, so the new build shows its "new!" tape on them (the Cowboy Hat is in view).

- **before**: v2.23.2 (origin/main `14eae860`). The open Wardrobe: the dog card on top, then one long list of pills of mixed widths under Head, Eyes, Neck, Body, with the worn ones in a yellow wash.
- **after**: v2.23.3 (origin/main `f4b15682`). The same sheet with the bigger dog strip, the six tabs All / Head 5 / Eyes 1 / Neck 2 / Body 6 / Charm 2, and the grid of same-size tiles with names, green ticks on the Flower Crown and the Heart Sunglasses, and "new!" tape on the Cowboy Hat.

Only toasts, tutorial hints and the dev button are hidden (as in the other capture scripts). Everything else on screen is the game's own, the phone bar included. The build checks that each pill's text is ink-centred (`centre_text.js`), that everything drawn stays 50 px inside the edges, and that the two phones are at least 60 px apart (69 px).

## How to rebuild

```
S=<scratch dir>
git worktree add --detach $S/before 14eae860; git worktree add --detach $S/after f4b15682
(cd $S/before && node game/build.js && node game/harness.js merged); (cd $S/after && node game/build.js && node game/harness.js merged)
NODE_PATH=$(npm root -g) node brand/instagram/launch/wardrobe_post/capture_wardrobe.js $S/before $S/before.png
NODE_PATH=$(npm root -g) node brand/instagram/launch/wardrobe_post/capture_wardrobe.js $S/after $S/after.png
NODE_PATH=$(npm root -g) node brand/instagram/launch/wardrobe_post/build_wardrobe_post.js $S/before.png $S/after.png
```
Caveat comes from Google Fonts, so the build needs the network. The raw screenshots and the worktrees stay out of git.

## Captions

True facts only: no new items in this update, 40 dogs, free in the browser. One ask each, no em dashes, no link in the caption (it is in the bio). No Threads (the owner has no Threads account).

### Instagram

```
the dog wardrobe in Doodle Doggo had a glow-up which tab do you open first? comment below 👇

before, it was one long list of clothes in pills of every size, and your dog scrolled away. now there are 6 tabs (All, Head, Eyes, Neck, Body, Charm), each with how many you own, and a tidy grid of same-size tiles

a green tick shows what your dog's wearing, "new!" tape marks clothes you just got, and on phones your dog stays in view while you scroll 🖍️

same clothes, nothing new to buy, it's just tidier. Doodle Doggo is our free cozy dog game with 40 crayon dogs, and you play it in your browser 🐶

#DoodleDoggo #CozyGames #DogLovers #IndieGame
```
`caption.py` READY (search terms "cozy dog game", "dog wardrobe"). `detect.py` human score 79.1 PASS. `humanize.py`: nothing to strip, no structural tells (the ✨ was taken out because the linter flags sparkle emoji). 4 hashtags.

### X

```
our dog wardrobe had a glow-up 🖍️ it used to be one long list, and Noodle scrolled away. now it's 6 tabs, same-size tiles, a green tick on what's worn, and on phones your dog stays put while you scroll

before or after? 👇

#DoodleDoggo #CozyGames #IndieGame
```
257 characters. `detect.py` human score 83.5 PASS.
