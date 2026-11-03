# "Snack time" ad Reels: calm cozy-game-ad style clips, any dog

Made 23 Oct 2026. The owner shared a Forest Island ad (https://www.instagram.com/p/DegC93isbc3/: 16 s of one 3D hamster slowly munching a seed in a soft close-up with no text, then 4 s of logo and store buttons; the caption carries the message) and asked for something similar. Owner's calls the same day:
- A different dog each time, not always Noodle.
- "3D" means depth around the game's real crayon dog, not a redrawn 3D dog (the ad must show the dogs players get).
- These are for ads.

English only. Files are in `brand/instagram/launch/munch_reel/`.

| File | What |
|---|---|
| `doodle-doggo-snack-reel-chihuahua.mp4` | **Ad 1: Peanut the Chihuahua.** 1080 x 1920, 30 fps, 11 s (owner, 23 Oct 2026: 10–12 s), with the game's yard music and soft crunch sounds. |
| `snack-cover-chihuahua.jpg` | Its cover: Peanut mid-chew with the blissful face, the Doodle Doggo logo above, in the grid's 3:4 crop. |
| `build_munch.js` | Makes one for any of the 35 dogs (`POSE=sit` and `END_POSE=beg` by default): `DOG=<key> NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/munch_reel/build_munch.js <workdir>` (no `DOG`: a random dog other than Noodle; about 5 minutes; `ONLY=stills` renders key frames and the cover only). It measures each dog (its size and where its muzzle is), so the biscuit lands in the mouth and the dog fills the frame, small or big. For a fix to one part, copy the last render's workdir and run with `FRAMES=a-b` (frame numbers at 30 fps, b excluded), so only those frames are rendered again. |

Dog keys: `shiba corgi golden dachs husky mutt chihuahua pug greyhound beagle poodle collie samoyed frenchie akita spitz pom afghan dane mastiff gsd dobie corso pitbull minpin lab malamute chow stdpoodle schnauzer westie yorkie bichon maltese shihtzu`. Made so far: `chihuahua` (yard), `chow` (pier at dusk). Next time, pick a different dog and place.

## What is in it

- **0–7.6 s, no text:** a close-up of the dog in the autumn yard, with depth built round the real art:
  - The yard behind is soft (the fence, the clothesline, Mt. Fuji), with a warm haze.
  - Light rays come from the top right.
  - Light motes and falling leaves float at three depths: small and nearly sharp behind the dog, big and very soft in front.
  - Two biscuits lie blurred in the front grass, under a soft round shadow.
  - The camera creeps in while the layers move at different speeds (parallax).
- **The action (owner, 23 Oct 2026: the dog sits, and the player throws the biscuit):**
  - The dog sits and wags.
  - The player's hand (the game's own crayon hand from the trick signals, with a blue sleeve) comes in from the bottom right with a biscuit on the palm. The dog gets star eyes.
  - The hand winds back, then flicks forward with speed lines and a whoosh. The biscuit spins in an arc away from the camera (big and a little soft near the hand, smaller and sharp at the dog), and the dog jumps a little to catch it.
  - The dog chews with the blissful "dreamy" face: three crunches, the biscuit gets smaller each time, and crumbs fall to the grass.
  - A wink after the last bite.
  - A little happy hop up to beg (sitting up), with heart eyes.
- **7.6–11 s, the end card:** the scene goes soft and pale, the Doodle Doggo logo pops in, "a free cozy dog game", and "play free at doodledoggo.app" in a yellow pill.
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

---

# Ad 2: Bao the Chow Chow on the pier at dusk (3 Nov 2026)

Owner, 3 Nov 2026: "create an immersive reel like the chihuahua reel, choose another dog and background". Same story and length as Ad 1 (11 s: sit, the hand throws a biscuit, three crunches, a wink, a hop up to beg with heart eyes, then the end card), in a new place.

| File | What |
|---|---|
| `doodle-doggo-snack-reel-chow-pier.mp4` | **Ad 2: Bao the Chow Chow.** 1080 x 1920, 30 fps, 11 s, with the pier's own music and sea ambience from the game, the throw, plop and crunch sounds. |
| `snack-cover-chow-pier.jpg` | Its cover: Bao mid-chew with the blissful face at sunset, the Doodle Doggo logo above, in the grid's 3:4 crop. |

Remake: `DOG=chow SCENE=pier TIP=186,104 NODE_PATH=$(npm root -g) node brand/instagram/launch/munch_reel/build_munch.js <workdir>`.
- **The place:** `SCENE=pier` is the game's pier at dusk (`PawArt.scene('pier', { time: 'dusk' })`): a pink and peach sky, the sun going down behind Mt. Fuji over the sea, the sailboat, the railing and the boards, softened behind Bao, with a warm sunset light (peach light rays and haze, warm light motes, a slightly deeper vignette). `SCENE=yard` (the default) is Ad 1 unchanged. Other places can be added to `LOOKS` in the script (the scene, its time, the slice behind the dog and the light's colours).
- **The dog:** Bao the Chow Chow (cinnamon, very fluffy): not used in any recent post, not black or white. His ruff sticks out further than his nose, so the muzzle is set by hand (`TIP=186,104`); without it the biscuit lands under his chin.

## Running it as an ad

Same set-up as Ad 1 (Traffic, https://doodledoggo.app, "Play game", Reels and Stories). Add it to the same ad set as a fresh creative.

**Primary text, option A (the sunset one)**
```
Toss a crayon dog a treat on a pier at sunset and let the day melt away 🌅 No timers, no pressure. Free in your browser, no download.
```
**Primary text, option B (the collection one, as Ad 1)**
```
35 crayon dogs to adopt, dress up and spoil 🐶 Walk the town, grow a garden, take naps. A free cozy dog game, no download.
```
**Headline** (pick one): `Free cozy dog game, no download` · `Sunset snack time 🌅` · `Adopt a crayon dog 🐶`
**Description:** `Play free in your browser.`

## If it is also posted on the profile (Instagram)

```
save this for the end of a long day 🌅 it's snack time by the sea with Bao 🐶

we sat Bao the Chow Chow on the pier just as the sun slipped down behind Mt. Fuji and the whole sky went pink 🗻🩷 you toss the biscuit 🦴 he catches it. three slow crunches 😌 then a happy little hop 💕 no timer. nothing to win. just a fluffy crayon dog and the waves 🌊

if you want a relaxing game for tonight 🌙 Doodle Doggo is our free cozy dog game 🎮 it plays in your browser on your phone or computer, and you can adopt one of 35 crayon dogs 🐾 then watch the sunset from this same pier 💛⛵

#DoodleDoggo #CozyGames #ChowChow #RelaxingGames
```
One ask (save) · 4 hashtags · search: "cozy dog game", "chow chow", "relaxing game" · no link · 13 emoji (2.1 per 100 characters), none as bullets · linter READY · human score 78.5 PASS.

**Alt text:** `A fluffy crayon Chow Chow sits on a wooden pier at sunset, with Mt. Fuji and a sailboat behind him. A hand tosses him a biscuit; he catches it, munches it happily and hops up with heart eyes.`

---

# Ad 3: cuddle time with Bao on the pier (3 Nov 2026)

Owner, 3 Nov 2026, after Ad 2: "can we throw different snacks? or we cuddle Bao instead" (choice window: "Cuddle Bao"). Same place, dog, light and length as Ad 2; no throw.

| File | What |
|---|---|
| `doodle-doggo-cuddle-reel-chow-pier.mp4` | **Ad 3: cuddle time.** 1080 x 1920, 30 fps, 11 s, the pier's music and sea ambience, soft fur-rub sounds per stroke, scritch ticks and a soft boop when the heart eyes come. |
| `cuddle-cover-chow-pier.jpg` | Its cover: Bao with dreamy eyes under the hand at sunset, the logo above, in the grid's 3:4 crop. |

Remake: `ACT=cuddle DOG=chow SCENE=pier TIP=186,104 NODE_PATH=$(npm root -g) node brand/instagram/launch/munch_reel/build_munch.js <workdir>` (works for any dog and place: `ACT=cuddle` with any `DOG` and `SCENE`).

**What happens:** Bao sits on the pier at dusk and looks up, curious, as the player's hand comes in (the game's own flat "down" trick-signal hand, mirrored, its arrow and motion ticks taken off, a blue sleeve to the edge). The hand strokes his head four times (he leans into each stroke) with dreamy eyes, then heart eyes with pink hearts floating up; a quick scritch; the hand leaves; a wink and the happy hop up to beg with heart eyes; then the end card ("a free cozy dog game", "play free at doodledoggo.app"). Real art only; the same depth as Ads 1 and 2, without the blurred biscuits in front.

## Running it as an ad

Same set-up as Ads 1 and 2 (Traffic, https://doodledoggo.app, "Play game", Reels and Stories), a fresh creative in the same ad set.

**Primary text, option A (the cuddle one)**
```
Give a fluffy crayon dog a head rub on a pier at sunset 🌅 No timers, no pressure, just a good dog. Free in your browser, no download.
```
**Primary text, option B (the collection one, as Ad 1)**
```
35 crayon dogs to adopt, dress up and spoil 🐶 Walk the town, grow a garden, take naps. A free cozy dog game, no download.
```
**Headline** (pick one): `Free cozy dog game, no download` · `Cuddle time 🐶` · `Adopt a crayon dog 🐶`
**Description:** `Play free in your browser.`

## If it is also posted on the profile (Instagram)

```
save this for when you need a soft minute 🌅 it's cuddle time on the pier with Bao 🐶

the sun was going down behind Mt. Fuji and the sky turned pink 🗻🩷 so we gave Bao the Chow Chow a head rub. four slow strokes 🤚 a quick scritch. his eyes went dreamy 😌 then turned into hearts 💕 then he hopped up for more. no timer. nothing to win. just a fluffy crayon dog who loves you back 🐾

if you want a relaxing game for tonight 🌙 Doodle Doggo is our free cozy dog game 🎮 it plays in your browser on your phone or computer, and you can adopt one of 35 crayon dogs and give every one of them a cuddle 💛⛵

#DoodleDoggo #CozyGames #ChowChow #RelaxingGames
```
One ask (save) · 4 hashtags · search: "cozy dog game", "chow chow", "relaxing game" · no link · 12 emoji (1.9 per 100 characters), none as bullets · linter READY · human score 78.8 PASS.

**Alt text:** `A fluffy crayon Chow Chow sits on a wooden pier at sunset, with Mt. Fuji behind him. A hand strokes his head; his eyes go dreamy, then turn into hearts as pink hearts float up, and he hops up happily.`

