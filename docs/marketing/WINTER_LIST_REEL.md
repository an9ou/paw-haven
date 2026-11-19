# "Noodle's Winter Market shopping list" Reel (made 18 Nov 2026)

The owner approved the idea on 18 Nov 2026: Noodle's Winter Market shopping list, to post when the Winter Market opens (Mon 23 Nov 2026 00:00 JST, open until 31 Dec). **English cut only. Nothing posted, nothing sent.** No cover, no captions and no RedNote cut yet: those are made only when the owner asks. Files in `brand/instagram/launch/winter_list_reel/`.

| File | What |
|---|---|
| `doodle-doggo-winter-list.mp4` | The main cut, hook "…It opens tonight!". **True only if posted on 22 Nov 2026 JST** (the evening before the opening). 1080 x 1920, 30 fps, AAC stereo, 30.50 s (915 frames): 27.99 s of Reel, then our standard end card for 2.5 s ("Play free!" over the logo, doodledoggo.app, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp with icons), music fading under it. Fast pace: each card stays up for its line + 0.4 s, 0.15 s between beats. |
| `doodle-doggo-winter-list-open.mp4` | The second hook, "…It's open now!", **for any day from 23 Nov to 31 Dec 2026 JST**. Same length. Only the hook frames (0..136) are rendered again and the hook line is said again; frames 137..914 and the music are the main cut's. |
| `capture_winter.js` | The game footage: one continuous take of the real Winter Market place from a fresh worktree of origin/main, on the frozen page clock (below). Also holds `plan()`, the one timeline both scripts use. |
| `build_winter.js` | The cards, the checks, the sound, the encode (below). Stops if any game fact below changed on main. `CHECK=1` runs every frame's checks without screenshots; `FRAMES=a-b` re-renders only those frames; `VARIANT=open` makes the second hook. |
| `vo_winter.json` | Noodle's lines (both hook lines). Written "Yogurt" for the voice only, so Kokoro says it right; on screen it is the game's "Frozen Yoghurt Snowballs". |

Second version, 19 Nov 2026 (coordinator's review of the first): Noodle is big on the open snow in front of the market, the frame is full to the bottom, no walk crosses anything, and the hook is back on the approved idea.

## The hook

`ig-reel` hook scoring (`python3 .claude/skills/ig-reel/hookscore.py`), options around the approved idea "Noodle made a Winter Market list". Used: **"Noodle already made a Winter Market list. Have you? It opens tonight."** 83.0 STRONG (length 88, specificity 100, stakes 70, front-load 100, address 100); the second cut's "…Have you? It's open now!" also scores 83.0. It is true and the viewer can check it in the Reel: Noodle's list is shown, made before the market opens ("already"), and the market opens on 23 Nov 00:00 JST. "Only 6 things on your dog's list" (the first version) is no longer used.

On screen at frame 1: the card "Noodle already made a / Winter Market list. Have you?" + red "It opens tonight!" (or "It's open now!"), Noodle dancing in front of the market. At 2.85 s (after "Have you?") the card gives way to the list.

| Score | Option | Why (not) |
|---|---|---|
| **83.0** | **Noodle already made a Winter Market list. Have you? It opens tonight.** | **Used for the main cut** (22 Nov JST only). |
| **83.0** | **Noodle already made a Winter Market list. Have you? It's open now!** | **Used for the second cut** (from 23 Nov). |
| 79.4 | Noodle made a Winter Market list before you did. It opens tonight. | We cannot know that the viewer has none. |
| 62.6 | Before the Winter Market opens tonight, Noodle made a list. | No "you". |
| 61.2 | Noodle already made his Winter Market list. It opens tonight. | No "you". |
| 59.0 | Noodle made a Winter Market list before it opens tonight. | No "you", payload late. |
| 56.2 | Noodle made his Winter Market list. It opens tonight, only until December 31. | Long, payload late. |
| 45.6 | Noodle's Winter Market list: 5 things, 1,144 coins. It opens tonight. | Nothing at stake. |
| 42.2 | Noodle made a Winter Market list. It opens tonight. (the coordinator's example) | Nothing at stake, no "you". |
| 42.2 | The Winter Market opens tonight. Here's Noodle's list. (the coordinator's example) | The same. |
| 42.2 | The Winter Market opens tonight. Noodle made a list. (the approved wording) | The same. |

## Script and shots (Noodle, Kokoro af_bella 1.1x)

One continuous take of the game's own Winter Market place (`fmarket`, winter theme, viewBox 0 0 1000 600) on 23 Nov 2026, sunny, by day.

- **The market** is the backdrop: the whole place at 0.94 px a world unit (940 px wide, y 432..996 of the frame), all five stalls and its "Winter Market · open until 31 Dec" sign in view, its bunting 28 px under the cards.
- **Noodle** is the game's own leader dog (the dachshund, in the Autumn Scarf, a Harvest Market item still on sale until 30 Nov), on the open snow in front of the market, near the camera: the game draws him at a foreground size (`rm.to`'s `k`, the size the game uses to fit a dog to a prop), 2.55 px for each unit of his art. He is **598 to 653 px long** standing, bowing and lying down, and 503 px wide and 422 to 431 px tall when he dances or begs. His feet are on y 1419; his whole drawn box (faces and their words included) is always 28 px or more below every stall, stand, cart, board and prop of the market, standing and walking.
- **The walks**: at the start of six beats he takes a short real walk (the game's `rm.to`, 300 units a second, 0.27 to 0.61 s) on that open snow to stand under the stall the line is about, and the camera goes along (it covers world x -45..78). No walk crosses anything.
- **The snow in front** goes on to the bottom of the frame with the game's own winter things at the same foreground size (`PawArt.prop`, the yard size they have beside a dachshund): the Present Pile, the Red Wooden Sled and the Yard Snowman (tops at y 1495 or lower, 28 px or more from Noodle and from each other), and the scene's own ground dashes; the scene's own snowflake doodles are copied into the sky. The game has no footprint drawing, so there are none.
- The faces are the game's own (PawArt expr, `41_expressions.js`), with their own words ("ta-da!", "yum!", "oops", "?").

| Starts | Beat | Noodle says | Card (x 60..850, y 270..520, on the open sky) | Noodle in the game |
|---|---|---|---|---|
| 0.10 s | hook | "Noodle already made a Winter Market list. Have you? It opens tonight!" (3.93 s; second cut: "…It's open now!" 3.95 s) | "Noodle already made a / Winter Market list. Have you?" + red "It opens tonight!". From 2.85 s: **Noodle's list**, six lines with empty boxes: Gingerbread Kennel, Polar Bear Hood, Snowball Ball, Frozen Yoghurt Snowballs, Star Lantern, "???". | Dances in front of the Clothes stall. |
| 4.60 s | 1 home | "One: the Gingerbread Kennel. Not a snack. I checked." (2.92 s) | The game's kennel drawing, "900 coins", **Gingerbread Kennel**, "A look, not a snack. / Wood all the way through." Tick at 1.3 s. | Walks left to stand under the Homes stand, begs, **hearts**. |
| 8.07 s | 2 costume | "Two: the Polar Bear Hood. Ta-da!" (2.06 s) | The hood drawing, "80 coins", **Polar Bear Hood**, "Warm: no shivering / in the snow." Tick at 1.15 s. | Walks back under the Clothes stall (the hood hangs there); the hood goes on at 0.75 s; bows, **proud** ("ta-da!") at 1.45 s. Off again after this beat. |
| 10.68 s | 3 toy | "Three: the Snowball Ball. A snowball that never melts!" (3.04 s) | The ball drawing, "45 coins", **Snowball Ball**, "A snowball that / never melts." Tick at 1.0 s. | Walks right, his head under the Toys stall; play bow with **zoomies**. |
| 14.27 s | 4 treat | "Four: Frozen Yogurt Snowballs. Plain yogurt. Two or three are plenty." (4.39 s) | The treat drawing, "9 coins", **Frozen Yoghurt Snowballs**, "Plain unsweetened yoghurt only. / Two or three are plenty." Tick at 1.6 s. | Steps back under the Treats cart (the bowl of snowballs on it), **yum** ("yum!") at 0.9 s. |
| 19.21 s | 5 decoration | "Five: the Star Lantern. It puts stars on the snow." (3.10 s) | The lantern drawing, "110 coins", **Star Lantern**, "After dark it glows and / puts stars on the snow." Tick at 1.4 s. | Walks left under the Star Lantern by the Decor stall, **wow** (star eyes). |
| 22.86 s | 6 everything | "Six: everything... Oops." (1.64 s, card +0.6 s) | Noodle's list again, five ticks; "everything" is written into line six (0.3..0.9 s), ticked at 1.25 s. | Walks back to the middle, lies flat, **guilty** ("oops") at 1.15 s. |
| 25.65 s | ask | "What's first on your list?" (1.14 s, card +0.6 s) | "What's first / on your list?" + red "Winter Market: open until 31 Dec". | Stands, **curious** ("?"). |
| 27.99 s | end card | (music fades) | Standard end card (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`, 70 px lower) with "Play free!" over the logo, 2.5 s. | |

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

- **Frozen clock (owner, 17 Nov).** The whole take (855 frames) is captured with `brand/instagram/launch/frozen_clock.js`: `freezeClock`, `stepClock(t0 + n x 1000/30)` before every screenshot, `releaseClock`. The game's own timers are stopped for the take, the page is not resized during it (the game draws the scene again on a resize; `facts.json` counts the scene draws: 1), and the capture is taken inside a fixed 2x viewport. Everything in the picture is drawn by the game page (scene, Noodle, the things in front); the build only lays the cards over it.
- **checkFrames on every moving run** (main cut and second cut the same), the six walks with the camera going along: to Homes 140..151 (median 5.98), to the middle 244..255 (5.41), to Toys 322..331 (5.91), to Treats 430..433 (5.93), to Decor 578..591 (6.21), to the middle 688..696 (5.77): **doubled [] and jumps [] in all six**. In the seven holds between them no two frames are alike (the camera creeps right at 4 units a second; smallest change 0.22); their jumps are the card pops at the beat cuts, the ticks and the steps of the game's crayon poses (drawn about three times a second).
- **Every frame (915)**: `centreCheck()`, `safeCheck()`, `apartCheck()` 28 px (cards and Noodle's drawn box from the capture); every card and Noodle inside x 60..850, y 270..1440; the card 28 px above the market's bunting, roofs and lanterns and 28 px from the sky's snowflakes; Noodle on the snow in front, his whole box 28 px below the lowest thing of the market (its own sled, world y 580) and 28 px clear of every market thing and of the three things in front, standing and walking (74 walking frames, none exempt). The three things in front are 28 px from each other.
- **What is not the Winter Market drawing itself:** above it its flat sky colour (#E4EEF6) goes on and around and below it its flat snow colour (#F4F7FA); the drawing's bottom and side pen lines are covered with snow colour; the far hill is the scene's own (drawn 99 units past both edges). The three things in front are the game's `PawArt.prop` drawings placed by the capture, the dashes and snowflakes are copies of the scene's own. Noodle's foreground size is set through the game's own `rm.to` (`k`). The stall hint glow and the HUD are hidden.
- ffprobe: h264 1080 x 1920, 30/1 fps, 915 frames, 30.50 s; AAC. Mix -16.2 LUFS.

## Remake

```
git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
VO_LINES=brand/instagram/launch/winter_list_reel/vo_winter.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
NODE_PATH=$(npm root -g) node brand/instagram/launch/winter_list_reel/capture_winter.js <main> <caps dir> <vo dir>        # about 3 min
ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/winter_list_reel/build_winter.js <workdir> <vo dir>
VARIANT=open ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/winter_list_reel/build_winter.js <workdir> <vo dir>
```

A change to a card: `FRAMES=a-b` on the build (the take is kept). A change to the timing, the camera or Noodle: capture again (the build refuses a capture made for another timeline).
