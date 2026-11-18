# "Noodle's Winter Market shopping list" Reel (made 18 Nov 2026)

The owner approved the idea on 18 Nov 2026: Noodle's Winter Market shopping list, to post when the Winter Market opens (Mon 23 Nov 2026 00:00 JST, open until 31 Dec). **English cut only. Nothing posted, nothing sent.** No cover, no captions and no RedNote cut yet: those are made only when the owner asks. Files in `brand/instagram/launch/winter_list_reel/`.

| File | What |
|---|---|
| `doodle-doggo-winter-list.mp4` | The main cut, hook "The Winter Market opens tonight". **True only if posted on 22 Nov 2026 JST** (the evening before the opening). 1080 x 1920, 30 fps, AAC stereo, 30.37 s (911 frames): 27.87 s of Reel, then our standard end card for 2.5 s ("Play free!" over the logo, doodledoggo.app, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp with icons), music fading under it. Fast pace: each card stays up for its line + 0.4 s, 0.15 s between beats. |
| `doodle-doggo-winter-list-open.mp4` | The second hook, "The Winter Market is open!", **for any day from 23 Nov to 31 Dec 2026 JST**. Same length. Only the hook frames (0..132) are rendered again and the hook line is said again; frames 133..910 and the music are the main cut's. |
| `capture_winter.js` | The game footage: one continuous take of the real Winter Market place from a fresh worktree of origin/main, on the frozen page clock (below). Also holds `plan()`, the one timeline both scripts use. |
| `build_winter.js` | The cards, the checks, the sound, the encode (below). Stops if any game fact below changed on main. `CHECK=1` runs every frame's checks without screenshots; `FRAMES=a-b` re-renders only those frames; `VARIANT=open` makes the second hook. |
| `vo_winter.json` | Noodle's lines (both hook lines). Written "Yogurt" for the voice only, so Kokoro says it right; on screen it is the game's "Frozen Yoghurt Snowballs". |

## The hook

`ig-reel` hook scoring (`python3 .claude/skills/ig-reel/hookscore.py`), 10 options. Used: **"Only 6 things on your dog's list. The Winter Market opens tonight."** 83.0 STRONG (length 88, specificity 100, stakes 70, front-load 100, address 100); the second cut's "…The Winter Market is open!" scores 84.4 STRONG. It is what the Reel shows: the list has six lines, and the sixth is "everything" (the joke the hook sets up). The line the idea was approved with scores 42.2 WEAK (nothing at stake, no "you", the payload late), so the wording changed and the idea did not: the list card is titled "Noodle's list".

On screen at frame 1: the card "Only 6 things on / your dog's list" + red "The Winter Market opens tonight" (or "The Winter Market is open!"), Noodle dancing under it. At 2.0 s the card gives way to the list.

| Score | Option | Why (not) |
|---|---|---|
| 93.8 | 28 winter things for your dog, only until December 31. Opens tonight. | Top score, but it never says Winter Market or list (the idea), and the market's table has 37 winter things, 28 of them new this year. Not used. |
| 84.4 | Your dog already made a list: only 6 things. Opens tonight. | Does not say what opens. |
| 84.4 | **Only 6 things on your dog's list. The Winter Market is open!** | **Used for the second cut** (from 23 Nov). |
| **83.0** | **Only 6 things on your dog's list. The Winter Market opens tonight.** | **Used for the main cut** (22 Nov JST only). |
| 80.8 | Your dog only wants 6 things. Winter Market opens tonight. | Close; the list comes later in the line. |
| 62.4 | Noodle made a Winter Market shopping list. You will not like item 6. | Payload late. |
| 59.0 | The Winter Market opens tonight. Noodle already made a list. | No "you". |
| 45.0 | The Winter Market opens tonight. My dog made a shopping list. | Nothing at stake. |
| 42.2 | The Winter Market opens tonight. Noodle made a list. (the approved wording) | Nothing at stake, no "you". |
| 42.2 | The Winter Market is open! Noodle made a list. (the brief's second hook) | The same. |

## Script and shots (Noodle, Kokoro af_bella 1.1x)

Every shot is the game's own Winter Market place (`fmarket`, winter theme, viewBox 0 0 1000 600) on 23 Nov 2026, sunny, by day, one continuous take. The camera is a 568-unit window at 1.9 px a unit; "x" below is its left edge. Noodle is the game's own leader dog (the dachshund, in the Autumn Scarf, a Harvest Market item still on sale until 30 Nov), driven through the game's hooks; the faces are the game's own (PawArt expr, `41_expressions.js`), with their own words ("ta-da!", "yum!", "oops", "?").

| Starts | Beat | Noodle says | Card (x 60..850, y 270..520, on the market's open sky) | Noodle in the game | Camera |
|---|---|---|---|---|---|
| 0.10 s | hook | "Only six things on your dog's list! The Winter Market opens tonight." (3.83 s; second cut: "…is open!" 3.51 s) | "Only 6 things on / your dog's list" + red "The Winter Market opens tonight". From 2.0 s: **Noodle's list**, six lines with empty boxes: Gingerbread Kennel, Polar Bear Hood, Snowball Ball, Frozen Yoghurt Snowballs, Star Lantern, "???". | Dances on the open snow between the Homes stand and the Treats cart (feet 501, 586; the game's own spot is 500, 586), under the "Winter Market · open until 31 Dec" sign. | x 258..266, the Clothes stall behind |
| 4.48 s | 1 home | "One: the Gingerbread Kennel. Not a snack. I checked." (2.92 s) | The game's kennel drawing, "900 coins", **Gingerbread Kennel**, "A look, not a snack. / Wood all the way through." Tick at 1.3 s. | Turns to the Homes stand, begs, **hearts**. | pans to x 234 |
| 7.95 s | 2 costume | "Two: the Polar Bear Hood. Ta-da!" (2.06 s) | The hood drawing, "80 coins", **Polar Bear Hood**, "Warm: no shivering / in the snow." Tick at 1.0 s. | The hood goes on at 0.3 s (the one hanging at the Clothes stall behind him); bows, **proud** ("ta-da!") at 1.45 s. Off again after this beat. | back to x 260 |
| 10.56 s | 3 toy | "Three: the Snowball Ball. A snowball that never melts!" (3.04 s) | The ball drawing, "45 coins", **Snowball Ball**, "A snowball that / never melts." Tick at 1.95 s. | **Walks** to the Toys stall (501 to 830, 1.65 s, the game's `rm.to`), play bow with **zoomies**. | follows him to x 499 |
| 14.15 s | 4 treat | "Four: Frozen Yogurt Snowballs. Plain yogurt. Two or three are plenty." (4.39 s) | The treat drawing, "9 coins", **Frozen Yoghurt Snowballs**, "Plain unsweetened yoghurt only. / Two or three are plenty." Tick at 2.4 s. | **Walks back** (830 to 501), turns to the Treats cart (the bowl of snowballs on it), **yum** ("yum!"). | follows him to x 300 |
| 19.09 s | 5 decoration | "Five: the Star Lantern. It puts stars on the snow." (3.10 s) | The lantern drawing, "110 coins", **Star Lantern**, "After dark it glows and / puts stars on the snow." Tick at 1.4 s. | Turns left to the Star Lantern standing by the Decor stall, **wow** (star eyes). | pans to x 166: the Decor stall's Present Pile and the lantern |
| 22.74 s | 6 everything | "Six: everything... Oops." (1.64 s, card +0.6 s) | Noodle's list again, five ticks; "everything" is written into line six (0.3..0.9 s), ticked at 1.25 s. | Lies flat, **guilty** ("oops") at 1.15 s. | back to x 256 |
| 25.53 s | ask | "What's first on your list?" (1.14 s, card +0.6 s) | "What's first / on your list?" + red "Winter Market: open until 31 Dec". | Stands, **curious** ("?"). | x 260 |
| 27.87 s | end card | (music fades) | Standard end card (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`, 70 px lower) with "Play free!" over the logo, 2.5 s. | | |

Sound: the game's own Winter Market music (`mods/pawaudio.js`, place `fmarket` with `fest: 'winter'`: the celesta and sleigh-bell variant) 11 dB under the voice, the game's own coin chime (`PawAudio` stinger `coin`) on every tick, a soft tick on each card. Mix at -16 LUFS.

## Facts and sources (all checked by `build_winter.js` against origin/main 42db6dab; the build stops if one changes)

| In the Reel | Source on main |
|---|---|
| The Winter Market opens 23 Nov 2026 00:00 JST and is open until 31 Dec | `game/src/49_market.js` `FM_MARKETS` winter `win(y)`: 2026 = 11-23 to 12-31; `CHANGELOG.md` rows v2.31.10 and v2.31.11. The sign in the footage ("Winter Market · open until 31 Dec") is the game's own (`fm.sign`, `fm.m_winter` in `game/i18n/en.json`). The capture checks the running game: on 2026-11-23 (Japan date) the open markets are harvest (to 30 Nov) and winter, and the winter market holds the tent. |
| Gingerbread Kennel, 900 coins, "A look, not a snack. Wood all the way through." | `HOUSES` in `game/src/00_core.js`: price 900, Bond 3, fest 'winter', fm; note "A look, not a snack: it is wood all the way through."; `data.houses.gingerbread_kennel.n`; `PawArt.WINTER_MARKET.house`; `docs/design/winter-market.md` part 4. |
| Polar Bear Hood, 80 coins, "Warm: no shivering in the snow." | `CLOTHES`: price 80, Bond 2, perk "Warm: no shivering in the snow. …"; in `WARM_WEAR` with the Puffer Jacket; `data.clothes.polar_bear_hood.n`; one of the 10 `PawArt.WINTER_MARKET.costumes`; it hangs at the Clothes stall in the scene. |
| Snowball Ball, 45 coins, "A snowball that never melts." | `TOYS`: price 45, Bond 1, note "Fetch: a fluffy white ball, a snowball that never melts. 2 coins per return."; `data.toys.snowball_ball.n`; one of the 5 toys. (Toy games share one cap of 30 coins a day, `FF_CAPS.toys` in `49_funfair.js`; not said in the Reel.) |
| Frozen Yoghurt Snowballs, 9 coins, "Plain unsweetened yoghurt only. Two or three are plenty." | `FOOD`: price 9, snack, fest 'winter'. The game's two-sentence lesson (`tip`): "Plain unsweetened yoghurt only, never a sweetened or light pot, which can hide xylitol. Dairy is a treat for dogs, so two or three little snowballs are plenty." The card and the voice use its words, shortened. `data.food.frozen_yoghurt_snowballs.n`; one of the 3 treats. |
| Star Lantern, 110 coins, "After dark it glows and puts stars on the snow." | `HM_DECOR` in `game/src/03_yard.js`: price 110, Bond 2, lit; story "A paper star on a wooden post, with little holes cut in it. After dark it glows and puts stars on the snow."; `data.hm_decor.star_lantern.n`; one of the 5 decorations (`PawArt.WINTER_MARKET.decor`). |
| The drawings on the cards | `PawArt.item(name)` of main, saved by the capture (`<caps>/items/`). |
| The set (not said, for captions later) | `PawArt.WINTER_MARKET`: 5 yard decorations, 10 costumes (the Puffer Jacket and Polar Bear Hood count as warm wear), 5 toys, a Gingerbread Kennel and 4 beds, 3 dog-safe treats = 28 new things; the market's table lists 37 with the older winter items. From 23 to 30 Nov the 5 Harvest Market items are also on sale (Leaf Beret, Autumn Scarf, Baked Pumpkin Wedges, Sweet Potato Coins, Warm Bone Broth); from 27 Dec the 2 New Year items (Kadomatsu Pair, Pup Kinton). The five things on Noodle's list cost 1,144 coins together. Bond needed: Kennel 3, Hood 2, Lantern 2, the ball and the treat 1 (the Reel does not say anyone can buy them on day one). |

## How it was made, and the checks

- **Frozen clock (owner, 17 Nov).** The whole take (852 frames) is captured with `brand/instagram/launch/frozen_clock.js`: `freezeClock`, `stepClock(t0 + n x 1000/30)` before every screenshot, `releaseClock`. The game's own timers are stopped for the take, the page is not resized during it (the game draws the scene again on a resize; `facts.json` counts the scene draws: 1), and the capture is taken inside a fixed 2x viewport.
- **checkFrames on every moving run** (main cut and second cut the same): pan to Homes 136..149 (median 5.96), pan to Clothes 241..250 (5.10), walk to Toys 322..366 (7.45), walk back 430..474 (7.34), pan to Decor 575..591 (10.25), pan to the middle 684..697 (8.91): **doubled [] and jumps [] in all six**. In the seven holds between them no two frames are alike (the camera creeps right at 2 units a second; smallest change 0.19); their jumps are the card pops at the beat cuts, the ticks and the steps of the game's crayon poses (drawn about three times a second).
- **Every frame (911)**: `centreCheck()`, `safeCheck()`, `apartCheck()` 28 px (cards and Noodle's drawn box from the capture); every card and Noodle inside x 60..850, y 270..1440; the card 28 px above the market's bunting, roofs and lanterns (it sits on open sky); Noodle's feet on the market's floor (the game's zone, y 586); standing, Noodle is 28 px clear of every stall, stand, board, the sled, the lantern, the tree and the presents.
- **What is not the game's drawing:** the market's floor is the bottom edge of its drawing, and feet must stay above y 1440, so the scene (600 units = 1140 px) sits at y 312..1452 and its flat sky colour (#E4EEF6) goes on above it and its flat snow colour (#F4F7FA) below it. On the toy stop the same two colours go on for about 70 units past the scene's right edge (x 950..1080 of the frame, outside the safe zone; the scene's own far hill is drawn that far). The drawing's bottom and right pen lines are covered with snow colour. The stall hint glow and the HUD are hidden.
- **While walking** to the Toys stall and back, Noodle passes in front of the Treats cart (93 frames within 28 px of it or in front of it): the market's front row is one lane, and the game draws a dog there in front of the cart. He never stops there.
- ffprobe: h264 1080 x 1920, 30/1 fps, 911 frames, 30.37 s; AAC.

## Remake

```
git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
VO_LINES=brand/instagram/launch/winter_list_reel/vo_winter.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
NODE_PATH=$(npm root -g) node brand/instagram/launch/winter_list_reel/capture_winter.js <main> <caps dir> <vo dir>        # about 3 min
ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/winter_list_reel/build_winter.js <workdir> <vo dir>
VARIANT=open ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/winter_list_reel/build_winter.js <workdir> <vo dir>
```

A change to a card: `FRAMES=a-b` on the build (the take is kept). A change to the timing, the camera or Noodle: capture again (the build refuses a capture made for another timeline).
