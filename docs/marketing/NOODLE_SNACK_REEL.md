# "Noodle's snack" Reel: a calm cozy-game-ad style clip

Made 23 Oct 2026. The owner shared a Forest Island ad (https://www.instagram.com/p/DegC93isbc3/: 16 s, one hamster slowly munching a seed in a soft close-up with no text, then 4 s of logo and store buttons; the caption carries the message) and asked for something similar. This is our version with the game's real art. English only. Files are in `brand/instagram/launch/munch_reel/`.

| File | What |
|---|---|
| `doodle-doggo-noodle-snack-reel.mp4` | 1080 x 1920, 30 fps, 16 s, with the game's yard music and soft crunch sounds. |
| `noodle-snack-cover.jpg` | The cover: Noodle mid-chew with his blissful face, the Doodle Doggo logo above, in the grid's 3:4 crop. |
| `build_munch.js` | Remake: `NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/munch_reel/build_munch.js <workdir>` (about 5 minutes; `ONLY=stills` renders key frames and the cover only). For a fix to one part, copy the last render's workdir and run with `FRAMES=a-b` (frame numbers at 30 fps, b excluded), so only those frames are rendered again. |

## What is in it

- **0–11.7 s, no text:** a close-up of Noodle in the autumn yard (the fence, the clothesline and Mt. Fuji behind, soft like a shallow focus, two biscuits blurred in the front grass, a slow push-in).
  - 0–1.25 s: he stands and wags.
  - 1.25–1.85 s: a bone-shaped biscuit drops from above (his curious face) and he catches it.
  - 1.85–9 s: he chews with his blissful "dreamy" face. Five crunches, the biscuit gets smaller with each one, and crumbs fall to the grass.
  - 9–10 s: a wink after the last bite.
  - 10–11.7 s: a little happy hop into heart eyes.
- **11.7–16 s, the end card:** the scene goes soft and pale, the Doodle Doggo logo pops in, "a free cozy dog game", and "play free at doodledoggo.app" in a yellow pill.
- Real art only (`PawArt.dog` with v2.13 faces, `PawArt.scene('yard')`, `PawArt.item('Bone-shaped Biscuit')`). No game buttons or menus. The faces with a word on them ("yum!", "blep", "ta-da!") are left out so the clip stays wordless like the reference.
- Sound: the game's own yard music, quiet, a soft plop at the catch, a crunch at each bite and little chew clicks, a sparkle at the logo. Levelled to -16 LUFS.

## When to post

**Mon 26 Oct, 20:30 JST** (a free day between the faces carousel on Sun 25 Oct and the informative post on Tue 27 Oct). It also works any time as a calm "palate cleanser" between the busy Halloween posts.

How to post: Instagram, "+", Reel, upload the `.mp4`, cover `noodle-snack-cover.jpg`, keep "Original audio", paste the caption.

## Caption

```
A snack, a wag, a little happy hop 🦴🐶
Adopt a crayon dog, feed him treats and let the day melt away. No timers, no pressure. Just good dogs.

Doodle Doggo is a free cozy dog game you play right in your browser, on your phone or computer. Link in bio.

#doodledoggo #cozygames #cozygaming #doglovers #dachshund #indiegame #relaxinggames
```
**Alt text:** `A crayon dachshund catches a bone-shaped biscuit and happily munches it in a sunny autumn yard.` (96 characters)

## Using it as an ad (Meta Ads Manager)

This clip is made in the same shape as the cozy-game ads that run well (one cute animal, one small action, wordless, an end card with the name), so it is a good first ad. The end card names the game and doodledoggo.app, so it works without the caption.

**Goal:** Traffic. **Website:** https://doodledoggo.app (the game plays right on the home page). **Button:** "Play game". **Placements:** Reels and Stories.

**Primary text, option A (the calm one)**
```
Adopt a crayon dog, give him a snack and let the stress melt away 🦴 No timers, no pressure. Free in your browser, no download.
```
**Primary text, option B (the collection one)**
```
35 crayon dogs to adopt, dress up and spoil 🐶 Walk the town, grow a garden, take naps. A free cozy dog game, no download.
```
**Headline** (pick one): `Free cozy dog game, no download` · `Adopt a crayon dog 🐶` · `Snack time for Noodle 🦴`
**Description:** `Play free in your browser.`

Notes:
- Run A and B as two ads in one ad set for 3–4 days, then keep the one with the lower cost per link click.
- If it does well, the same build can make more clips like this with other dogs and treats (one dog, one small action each).
