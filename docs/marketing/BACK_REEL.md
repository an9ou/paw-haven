# "Stop feeling bad about a week off" Reel, v2.25 "Glad you're back" (12 Nov 2026)

One English Reel about v2.25 "Glad you're back" (live since 12 Nov 2026). English only, one video, no RedNote cut. **Made, waiting for the owner's approval; nothing posted.** Files in `brand/instagram/launch/back_reel/`.

| File | What |
|---|---|
| `doodle-doggo-week-off.mp4` | Instagram Reels, TikTok, YouTube Shorts and X. 1080 x 1920, 30 fps, AAC stereo, 44.03 s: 41.53 s of Reel, then our standard end card for 2.5 s with the music fading under it. Faster (owner, 13 Nov 2026: "The reels speed can be faster less reading time is fine"): each card stays up for its spoken line + 0.4 s, with a 0.15 s pause between beats; Noodle speaks at 1.1x. |
| `back-cover.jpg` | The designed cover (not a frame), on the game's own Home Yard by day (autumn): "Stop feeling bad / about a week off" in a big cream card on the sky, the pill "your dog saved you a gift", the wrapped gift and Noodle begging big on the grass, the logo on its own cream card. Key content inside the 1:1 crop (y 420..1500), the logo inside 4:5. |
| `build_back.js` | Remake (below). Every frame runs `centreCheck()`, `safeCheck()` and `apartCheck()` (`../centre_text.js`), keeps every decoration 20 px clear of everything and every word and key art left of x 850: the build stops on the first miss. It also stops if any quoted game text or number below changed on main, and if Noodle, Gerald or the gift does not stand on the scene's floor (the grass in front of the fence, the floorboards in front of the sofa) or stands on the garden plot. |
| `capture_back.js` | The clean captures of the game's own screens from a main build (the diary page, Gerald's letter, the treat-bag drawing). |
| `vo_back.json` | Noodle's lines (Kokoro af_bella 1.1x). |

## Shots

Owner, 13 Nov 2026: "Can u change the background, coz last reels already using this, we can use the gaming assets." The backgrounds are the game's own scenes from main (`PawArt.scene`, autumn, sunny, no game interface), drawn at 3.2x so the scene's full height fills the frame; each beat shows a 337-unit window of a 1000 x 600 scene, pre-rendered once per build (`WORK/bg_<key>.jpg`) and cross-faded between beats:

| Beat | Scene (window, scene units) |
|---|---|
| hook | the Home Yard by day, x 600..937: the fence, the hills, the sun, the autumn tree |
| away | the same yard view going from day to dusk to night as the calendar flips (Noodle naps at night) |
| letter | the Home Yard by day, x 225..562: the house corner, the mailbox on its post, the washing line (Gerald waits by the mailbox) |
| diary | the Cozy House living room, x 545..882: the sofa's arm, the lamp, the striped wall, Noodle's bed with its bone |
| gift | the Cozy House living room, x 300..637: the blue sofa under the window (Noodle stands in front of the sofa) |
| days, mile, end | the Home Yard on a sunny morning (dawn), x 640..977: the fence, the rising sun, the autumn tree |

Every word sits on a solid cream card, pill or badge (never on the scene); the game items float in cream chips (the treat bag, Squeaky Duck, Carrot Sticks, coin), so nothing sits on a scene object. Noodle, Gerald and the gift stand on the grass or the floorboards (checked on every frame). Noodle is big in every beat. Music: the game's own yard music (`mods/pawaudio.js`) about 11 dB under the voice, the game's treasure sting on the gift and level-up sting on Gerald's gifts, calendar flips and ticks; loudness -16 LUFS.

| Starts | Beat | Noodle says | On screen |
|---|---|---|---|
| 0.10 s | hook | "Stop feeling bad about a week off. Your dog saved you a gift." (3.46 s) | Hook card at frame 1: "Stop feeling bad / about a week off." + red "Your dog saved you a gift." Noodle begs, big, at the game's wrapped gift (the Friends gift art) on the grass. |
| 4.11 s | away | "You took a week off. I waited. And napped. Mostly napped." (3.16 s) | Card "You took a week off. / Noodle waited." small "and napped. mostly napped." A crayon tear-off calendar flips day 1 to day 7; Noodle sits by the fence, then sleeps long on the grass as day turns to evening and night. |
| 7.82 s | letter | "When you come back, Gerald sends a letter. A treat bag and a hundred coins. Welcome back!" (5.11 s) | Pill "Back after 3+ days?"; the game's own letter "We kept your spot warm" (captured); the game's treat bag in a chip beside the pill "a treat bag and 100 coins"; Gerald waving by the mailbox, Noodle happy. |
| 13.48 s | diary | "And I kept a diary for you. I sat by the gate and listened for your footsteps. I found a sock. It's mine now." (6.45 s) | Pill "Away 4+ hours?"; card "While you were out" quoting two lines exactly: "Noodle found a sock. Nobody knows whose. It belongs to Noodle now." and "Noodle sat by the gate and listened for your footsteps."; Noodle sits on the floor by the sofa, the captured diary page beside him on the wall side. |
| 20.48 s | gift | "Plus a little gift from me, once a day. Today, carrot sticks. I only sniffed them." (4.51 s) | Card "A little gift, once a day: a dog-safe treat or a toy, sometimes a few coins". The game's Squeaky Duck, Carrot Sticks and coin pop in, each in a cream chip; Noodle gives a paw in front of the sofa. |
| 25.54 s | days | "The game counts every day you play. It never resets. Miss a day? Nothing lost." (4.66 s) | Card "Days played, ever: a count that never resets. Miss a day? Nothing lost." A month page fills with paws on 12 scattered days (plain gaps between, no crosses); the game's own line "12 days played, ever" counts up. Noodle long along the bottom. |
| 30.75 s | mile | "And Gerald has gifts at seven, thirty, a hundred, and three hundred sixty-five days." (5.16 s) | Card "Gifts from Gerald at 7, 30, 100 and 365 days played"; four gold medals pop in; Gerald cheering, Noodle happy. |
| 36.46 s | end | "No streaks. No guilt. Just a happy dog. Tag someone who needs a break!" (4.47 s) | Card "No streaks. No guilt. / Just a happy dog." + red pill "tag someone who needs a break". Noodle happy with hearts, big, alone. |
| 41.53 s | end card | (music fades) | Our standard end card (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`): the logo, doodledoggo.app, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp with icons, 2.5 s. |

**Art.** All from main (7a85ce30, v2.25 live): Noodle (`PawArt.dog('dachs')`: beg, sit, sleep, paw, idle, happy), Gerald (`PawArt.prop('gerald')` wave and cheer), the wrapped gift (`PawArt.FRIENDS.wrap(0)`), Carrot Sticks, Squeaky Duck, the coin icon, the treat bag (`fwBagSVG`, `game/src/47_firstweek.js`, read out of the build by `capture_back.js`). The diary page and the letter are the game's own sheets, captured at 3x from a main build with Noodle adopted (`__paw.wb.open()` after a 7-day absence, `__paw.wb.letter()` opened in the mailbox), with the game's buttons and the dev button hidden. The backgrounds are the game's scenes (`PawArt.scene('yard')` by day, dusk, night and dawn, `PawArt.scene('house')`), autumn. The calendar, month page, medals and chips are drawn for the Reel in the same crayon style, every fill inside its line.

## Where the facts come from (main)

The build checks each of these and stops if one changed.

| On screen / said | Source |
|---|---|
| "While you were out", after 4+ hours away | `game/i18n/en.json` `wb.title`; `WB_AWAY_MS = 4 * 3600e3` in `game/src/53_welcome.js`; `V225.md` section 1 |
| "Noodle found a sock. Nobody knows whose. It belongs to Noodle now." | `wb.l1` ("{name} found a sock. Nobody knows whose. It belongs to {name} now.") with the dog's name Noodle; on the captured page |
| "Noodle sat by the gate and listened for your footsteps." | `wb.l14`; on the captured page |
| A little gift once a day: a dog-safe treat or a toy, sometimes a few coins | `nw.v225.away` ("once a day a small gift"); `wbGiftPick` in `53_welcome.js` (coins on 12 of 100 days, 10-30, `WB_COIN_CAP = 30`; else a Bond 1-2 toy not owned or a dog-safe treat x2 from `WB_TREATS`); `wb.gift_h` "A little gift from {name}". The captured page's gift was Carrot Sticks x2 |
| Back after 3+ days: Gerald's letter, a treat bag and 100 coins, "Welcome back!" | `wb.b_title` "We kept your spot warm", `wb.b_text` ("Welcome back! ... Here is a treat bag and {n} coins"); `WB_BACK_MS = 3 * 864e5`, `WB_BACK_COINS = 100` |
| Days played, ever; never resets; miss a day, nothing lost | `wb.cal_life` "{n} days played, ever"; `nw.v225.days` ("The calendar counts every day you play, forever. A missed day costs nothing, and Gerald has gifts at 7, 30, 100 and 365 days"); `wb.m_text` ("Not in a row and never in a rush") |
| Gifts from Gerald at 7, 30, 100 and 365 days | `WB_DAYS = [7, 30, 100, 365]`; `nw.v225.days`; V225.md (7: a photo frame, 30: a yard decoration, 100: a costume, 365: a Golden Bone and a golden frame) |
| No streaks, no guilt | V225.md rules kept: "no streak that breaks, no FOMO (a missed day costs nothing)" |

Changed or dropped from the brief: the "tomorrow" line after the last daily task is true (`wb.t_*`, V225.md) but left out to keep the Reel short; the gift beat says "a dog-safe treat or a toy, sometimes a few coins" (the game also gives toys, which the brief's wording allowed). "A week off" is the story's example; the letter comes after 3+ days and the diary page after 4+ hours, as the pills say. Noodle is the narrator as the brief asked (the README's "different dog each time" rule was not applied to this Reel).

## Remake

```
cd <main checkout> && node game/build.js && node game/harness.js merged
NODE_PATH=$(npm root -g) node brand/instagram/launch/back_reel/capture_back.js <main checkout> <caps dir>
VO_LINES=brand/instagram/launch/back_reel/vo_back.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro model dir> <vo dir> af_bella 1.1
ART_ROOT=<main checkout> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/back_reel/build_back.js <workdir> <vo dir>
```
`ONLY=stills` renders key frames (`<workdir>/stills`, `TS=a,b,...` for chosen times), `ONLY=cover` writes `back-cover.jpg`, `FRAMES=a-b` re-renders only frames a..b and encodes again with the same sound. The game seeds the diary lines by the return and the dog, and today's gift by the date and the dog, so `capture_back.js` adopts until today's gift is a treat and picks a return whose page has the sock and gate lines (it writes them to `facts.json`; the build checks them). The Kokoro model files are never committed.

## Instagram

```
stop feeling bad about a week off 🐶 your dog saved you a gift.

that's how coming back works in Doodle Doggo, our free cozy dog game. away for 4 hours or more? your dog meets you with a "While you were out" diary page, and Noodle's says: "Noodle found a sock. Nobody knows whose. It belongs to Noodle now." 🧦 fair.

once a day there's a little gift as well, usually a dog-safe treat or a toy and sometimes a few coins 🥕

gone 3 days or more? Gerald the duck writes you a letter with a treat bag and 100 coins inside ✉️

the game also counts every day you play, forever, and that count never resets, so if you miss a day you lose nothing at all. gifts at 7, 30, 100 and 365 days 🏅

no streaks. no guilt. just a happy dog.

tag someone who needs a break 👇

#DoodleDoggo #CozyGames #DogGame #DogLovers
```
Job: the Reel carries the hook · one ask: tag someone who needs a break · 4 hashtags · search: "cozy dog game", "no streaks" · no link · 7 emoji · `ig-caption` linter: all PASS except ONE ASK (its list has no "tag someone" pattern, so it reads the ask as missing) · `ig-human` score 87.5 PASS.

## TikTok

```
stop feeling bad about a week off 🐶 in our cozy dog game, your dog keeps a "While you were out" diary page for you. Noodle found a sock. nobody knows whose. it belongs to Noodle now. there's a little gift once a day, and after 3 days away Gerald the duck sends a treat bag and 100 coins. the game counts every day you play and never resets, so missing a day costs you nothing. no streaks, no guilt, just a happy dog. tag someone who needs a break 👇 #DoodleDoggo #CozyGames #DogGame #DogLovers
```
One ask: tag · 4 hashtags · no link · `ig-human` score 79.5 PASS.

## YouTube Shorts

Title: `Stop feeling bad about a week off 🐶 #Shorts`

Description:
```
Stop feeling bad about a week off. Your dog saved you a gift.

In Doodle Doggo, our free cozy dog game drawn in a pencil sketchbook, coming back is the good part. Away for 4 hours or more? Your dog greets you with a "While you were out" diary page. Noodle's said: "Noodle found a sock. Nobody knows whose. It belongs to Noodle now." Once a day there's a little gift too, a dog-safe treat or a toy, sometimes a few coins.

Gone for 3 days or more? Gerald the duck writes you a letter with a treat bag and 100 coins. And the game counts every day you play, forever. It never resets, so a missed day costs nothing. Gerald has gifts at 7, 30, 100 and 365 days.

No streaks. No guilt. Just a happy dog. Tag someone who needs a break.

🎮 Play free: https://doodledoggo.app

#DoodleDoggo #Shorts #CozyGames #DogGame
```
One ask: tag · the only link is https://doodledoggo.app · `ig-human` score 73.3.

## X (under 280 characters)
```
stop feeling bad about a week off 🐶 your dog keeps a diary for you ("Noodle found a sock. Nobody knows whose. It belongs to Noodle now.") and saves you a gift. miss a day? nothing lost. tag someone who needs a break https://doodledoggo.app #DoodleDoggo #CozyGames
```
264 of 280 (the link counts as 23, the emoji as 2) · one ask: tag · `ig-human` score 57.4.

**Alt text:** `A crayon dachshund called Noodle in the game's own autumn yard. A calendar flips from day 1 to day 7 while he waits and naps as day turns to night. Then Gerald the duck's letter "We kept your spot warm" with a treat bag and 100 coins, Noodle's "While you were out" diary page ("Noodle found a sock. Nobody knows whose. It belongs to Noodle now."), a little gift once a day, a days-played count that never resets, gifts at 7, 30, 100 and 365 days, and "No streaks. No guilt. Just a happy dog." It ends on the Doodle Doggo card with doodledoggo.app and our Instagram, X and YouTube.`
