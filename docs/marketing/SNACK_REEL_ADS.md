# "Snack time" ad Reels: calm cozy-game-ad style clips, any dog

Made 23 Oct 2026. The owner shared a Forest Island ad (https://www.instagram.com/p/DegC93isbc3/: 16 s of one 3D hamster slowly munching a seed in a soft close-up with no text, then 4 s of logo and store buttons; the caption carries the message) and asked for something similar. Owner's calls the same day:
- A different dog each time, not always Noodle.
- "3D" means depth around the game's real crayon dog, not a redrawn 3D dog (the ad must show the dogs players get).
- These are for ads.

English only. Files are in `brand/instagram/launch/munch_reel/`.

| File | What |
|---|---|
| `doodle-doggo-snack-reel-chihuahua.mp4` | **Ad 1: Peanut the Chihuahua.** 1080 x 1920, 30 fps, 16 s, with the game's yard music and soft crunch sounds. |
| `snack-cover-chihuahua.jpg` | Its cover: Peanut mid-chew with the blissful face, the Doodle Doggo logo above, in the grid's 3:4 crop. |
| `build_munch.js` | Makes one for any of the 35 dogs (`POSE=sit` and `END_POSE=beg` by default): `DOG=<key> NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/munch_reel/build_munch.js <workdir>` (no `DOG`: a random dog other than Noodle; about 5 minutes; `ONLY=stills` renders key frames and the cover only). It measures each dog (its size and where its muzzle is), so the biscuit lands in the mouth and the dog fills the frame, small or big. For a fix to one part, copy the last render's workdir and run with `FRAMES=a-b` (frame numbers at 30 fps, b excluded), so only those frames are rendered again. |

Dog keys: `shiba corgi golden dachs husky mutt chihuahua pug greyhound beagle poodle collie samoyed frenchie akita spitz pom afghan dane mastiff gsd dobie corso pitbull minpin lab malamute chow stdpoodle schnauzer westie yorkie bichon maltese shihtzu`. Made so far: `chihuahua`. Next time, pick a different one.

## What is in it

- **0–11.7 s, no text:** a close-up of the dog in the autumn yard, with depth built round the real art:
  - The yard behind is soft (the fence, the clothesline, Mt. Fuji), with a warm haze.
  - Light rays come from the top right.
  - Light motes and falling leaves float at three depths: small and nearly sharp behind the dog, big and very soft in front.
  - Two biscuits lie blurred in the front grass, under a soft round shadow.
  - The camera creeps in while the layers move at different speeds (parallax).
- **The action (owner, 23 Oct 2026: the dog sits, and the player throws the biscuit):**
  - The dog sits and wags.
  - The player's hand (the game's own crayon hand from the trick signals, with a blue sleeve) comes in from the bottom right with a biscuit on the palm. The dog gets star eyes.
  - The hand winds back, then flicks forward with speed lines and a whoosh. The biscuit spins in an arc away from the camera (big and a little soft near the hand, smaller and sharp at the dog), and the dog jumps a little to catch it.
  - The dog chews with the blissful "dreamy" face: five crunches, the biscuit gets smaller each time, and crumbs fall to the grass.
  - A wink after the last bite.
  - A little happy hop up to beg (sitting up), with heart eyes.
- **11.7–16 s, the end card:** the scene goes soft and pale, the Doodle Doggo logo pops in, "a free cozy dog game", and "play free at doodledoggo.app" in a yellow pill.
- **Real art only:** `PawArt.dog` with v2.13 faces, `PawArt.scene('yard')` and `PawArt.item('Bone-shaped Biscuit')`. No game buttons or menus. The faces with a word on them ("yum!", "blep", "ta-da!") are left out, so the clip stays wordless like the reference.
- **Sound:** the game's own yard music, quiet. A soft plop at the catch, a crunch at each bite, little chew clicks, and a sparkle at the logo. Levelled to -16 LUFS.

## Running it as an ad (Meta Ads Manager)

**Goal:** Traffic. **Website:** https://doodledoggo.app (the game plays right on the home page). **Button:** "Play game". **Placements:** Reels and Stories (and Feed, where the 4:5 crop keeps the dog and the end card). The end card names the game and the site, so it works without the caption.

**Primary text, option A (the calm one)**
```
Adopt a crayon dog, toss them a treat and let the stress melt away 🦴 No timers, no pressure. Free in your browser, no download.
```
**Primary text, option B (the collection one)**
```
35 crayon dogs to adopt, dress up and spoil 🐶 Walk the town, grow a garden, take naps. A free cozy dog game, no download.
```
**Headline** (pick one): `Free cozy dog game, no download` · `Adopt a crayon dog 🐶` · `Snack time 🦴`
**Description:** `Play free in your browser.`

Notes:
- Run A and B as two ads in one ad set for 3–4 days, then keep the one with the lower cost per link click.
- Each new dog is a fresh ad for the same ad set: fresh creative keeps the cost down once people have seen one clip a few times.

## If it is also posted on the profile

```
Snack time for Peanut 🦴🐶
Toss a treat to a crayon dog and let the day melt away. No timers, no pressure. Just good dogs.

Doodle Doggo is a free cozy dog game you play right in your browser, on your phone or computer. Link in bio.

#doodledoggo #cozygames #cozygaming #doglovers #chihuahua #indiegame #relaxinggames
```
**Alt text:** `A crayon Chihuahua sits, catches a biscuit thrown by a hand and happily munches it in an autumn yard.` (100 characters)
