# "Help the town" Reel: v2.30 town goal, 2,000 belly rubs by 30 Nov (21 Nov 2026)

The owner approved it on 21 Nov 2026: "Help the town: 2,000 belly rubs by 30 Nov". This is the English cut only. There is no RedNote cut, no cover and no captions yet; those wait for the owner's approval of this cut. **Nothing posted.** Files are in `brand/instagram/launch/town_goal_reel/`.

| File | What |
|---|---|
| `doodle-doggo-town-goal.mp4` | English: Instagram Reels, YouTube Shorts, X. 1080 x 1920, 30 fps, h264 + AAC stereo, **23.80 s (714 frames)**: 21.29 s of Reel, then our standard end card for 2.5 s (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`: the logo, doodledoggo.app, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp with icons), with the music fading under it. |
| `capture_town.js` | Clean captures from a fresh worktree of origin/main 3950b5b1 (v2.32.1), page date 21 Nov 2026 (autumn, sunny, day). It captures five places as the game draws them (the floor props kept, our dog and the effects left out), the Town Square with Gerald's paper pinned on the notice board, the game's art (Gerald the duck, the Pupcake, the Bone-shaped Biscuit), and Noodle's drawings animated on the frozen page clock. |
| `build_town.js` | The remake (below). It stops if any fact below changed on main, and every frame runs the checks listed under Checks. `ONLY=stills`, `CHECK=1`, `FRAMES=a-b` work as in the other Reels. |
| `vo_town.json` | Noodle's lines (Kokoro af_bella 1.1x via `../friends_reel/vo_friends.py`). |

Rebuild:

```
git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
NODE_PATH=$(npm root -g) node brand/instagram/launch/town_goal_reel/capture_town.js <main> <caps>
VO_LINES=brand/instagram/launch/town_goal_reel/vo_town.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo> af_bella 1.1
ART_ROOT=<main> CAPS=<caps> NODE_PATH=$(npm root -g) node brand/instagram/launch/town_goal_reel/build_town.js <work> <vo>
```

## The idea

The Reel opens on the whole town and a deadline. It then shows how to help: a belly rub counts, and a walk counts too, with the real weights. Next comes the board in the Town Square filling up, then Gerald's treat bag for everyone who helped, and ONE ask. Each beat is in a different real place of the game. The last Reel used the Home Yard, so this one does not.

**No live count, ever.** We do not know the real number on the board, so the Reel never says or shows "we're at X". The only numbers on screen are the goal (2,000), the date (30 November), the weights (1 and 3) and the bag's items (1 and 3).

The meter is the game's own: Gerald's paper on the notice board (`glNoteSVG`) with its thin crayon meter. It is grabbed at an empty state (`window.__paw.gl.set({ n: 0, goal: 2000 })`, a patched state), and the build fills its rect exactly as the game's `glMiniDraw` does (width = `data-w` x the fill). It goes from the game's starting sliver (3 %) to 72 % and stops short of full. The card says **"How it works"** over it, so it reads as how the board works, not as today's number. The paper carries no number, and Gerald's notice sheet, which prints "Belly rubs so far: n of 2,000", is not shown.

## The hook

I scored 18 options with `hookscore.py` (`.claude/skills/ig-reel/`). I used **"Only until 30 November: your town needs 2,000 belly rubs!"**, which scored **100.0 STRONG** (length 100, specificity 100, stakes 100, front-load 100, address 100).

It is true: November's goal is 2,000 and runs to the end of the Japan month, 30 Nov. It stays true whatever day it is posted, unlike a day count. It says "30 November" and never "Sunday": 30 Nov 2026 is a Monday, and the build checks that. Noodle says it on frame 1 over the Hilltop Meadow, with the town in the distance below.

| Score | Hook |
|---|---|
| **100.0** STRONG | **Only until 30 November: your town needs 2,000 belly rubs!** (used) |
| 84.4 STRONG | Only 10 days left: your town needs 2,000 belly rubs! (true only on 21 Nov: 21 to 30 Nov is 10 days; the goal ran 20 to 30 Nov, 11 days in all) |
| 84.4 STRONG | Only 10 days for your town to reach 2,000 belly rubs! (same) |
| 83.0 STRONG | Your town's first goal: 2,000 belly rubs, only until 30 November! |
| 83.0 STRONG | Your town needs 2,000 belly rubs before 1 December. Only 10 days! |
| 80.8 STRONG | Your town needs 2,000 belly rubs before December! |
| 80.8 STRONG | Our town's first goal: 2,000 belly rubs by 30 November! |
| 58.4 OK | 2,000 belly rubs by Monday. Can your dog help the town? |
| 54.8 OK | Our town has 10 days to give 2,000 belly rubs. |
| 54.8 OK | We need your dog for 2,000 belly rubs by 30 November. |
| 51.2 OK | Our whole town needs 2,000 belly rubs by 30 November. (GM idea 1) |
| 51.2 OK | Can our town hit 2,000 belly rubs by 30 November? |
| 50.6 OK | 2,000 belly rubs. One town. 10 days. (GM idea 2) |
| 50.6 OK | Help the town: 2,000 belly rubs by 30 November! |
| 49.1 WEAK | Your dog's belly rubs count for the whole town, but only until 30 November. |
| 48.2 WEAK | Your dog's belly rub counts for the whole town until 30 November. |
| 47.0 WEAK | The whole town needs 2,000 belly rubs by Monday 30 November. |
| 37.8 WEAK | Every belly rub you give your dog counts for the whole town. |

The GM's two ideas scored 51.2 and 50.6, below 80. Their weak spot was stakes: nothing in the line is on the line. "Only until" carries the deadline as the stake.

## Script and shot table (Noodle, Kokoro af_bella 1.1x)

Fast pace (owner, 13 Nov): each card is on screen for its line + 0.4 s, followed by a 0.15 s pause. The board's beat gets 0.3 s more so its meter can fill. Each card carries the spoken words, so it works as the subtitles.

| # | Time (s) | Place (game scene, camera) | On screen | Noodle says | Picture | Fact source |
|---|---|---|---|---|---|---|
| 1 hook | 0.10-4.53 | Hilltop Meadow, x 572→584, 3.5x | "Only until 30 November: / your town needs / 2,000 belly rubs!" | "Only until November thirtieth, your town needs two thousand belly rubs!" | Noodle standing (569 px wide) on the meadow; the town is far below, across the river | worker.js `GL_MONTH_GOAL = { '2026-11': 2000 }`; 58b_goal.js `m === '2026-11' ? 2000 : 10000`; V230.md 5 "November 2026: 2,000"; CHANGELOG v2.30; HANDOFF 78 (20-30 Nov) |
| 2 rub | 4.68-7.99 | Maple Woods, x 654→662, 4x | "Give your dog a belly rub. / It counts for the whole town!" | the same | Noodle in the game's pet pose, with the game's pet hearts (`fxText('♥')`: 38 world units, #F28FA5, ink stroke, `floatUp` 1 s ease-out up 90 and 15 deg) one every 0.3 s, with the game's squeak or boop | 58b_goal.js `on('act:pet', ...)` → `glAdd`; en.json `nw.v230.goal` "every belly rub and walk in town adds up" |
| 3 walk | 8.14-11.16 | Riverside, x 402→466, 3.5x (the camera goes along) | "Every pet counts 1. / Every walk counts 3!" | "Every pet counts one. Every walk counts three!" | Noodle walking along the river path (the game's walk drawing) | 58b_goal.js `GL_PET = 1, GL_WALK = 3`; en.json `gl.intro` "Every pet counts 1 and every walk counts 3."; V230.md 5; CHANGELOG "a pet counts 1, a walk 3" (the GM's note was right) |
| 4 board | 11.31-14.36 | Town Square, the camera moves in from the whole notice board (3.5x) to Gerald's paper (5.2x) | red "How it works" + "Watch Gerald's board in / the Town Square fill up!" | "Watch Gerald's board in the Town Square fill up!" | Gerald's paper (heart and crayon meter) pinned on the board, the meter filling from 3 % to 72 % (patched state) | 58b_goal.js `glNoteSVG`, `glBoardDraw`, `glMiniDraw`; en.json `nw.v230.goal` "...adds up on the board in the Town Square"; V230.md 5 (Gerald's paper on the Square's notice board) |
| 5 gift | 14.51-18.87 | Lighthouse Pier, x 636→646, 3.5x | Gerald (the game's art, cheering) beside "When the town gets there, / everyone who helped gets / a treat bag from Gerald!"; under it the game's Pupcake "1 Pupcake" and three Bone-shaped Biscuits "3 Bone-shaped Biscuits" | "When the town gets there, everyone who helped gets a treat bag from Gerald!" | Noodle happy on the pier planks; the card pops in with the game's pop | en.json `gl.gift` "When the town gets there, everyone who helped gets a treat bag from Gerald: {gift}"; 58b_goal.js `GL_TREATS = [['Pupcake', 1], ['Bone-shaped Biscuit', 3]]`; V230.md 5 "1 Pupcake and 3 Bone-shaped Biscuits"; CHANGELOG "(1 Pupcake, 3 Bone-shaped Biscuits)"; HANDOFF 71 |
| 6 ask | 19.02-21.19 | Hilltop Meadow, x 586→596, 3.5x | "Give your dog a belly rub / for the town 🐾" | "Give your dog a belly rub for the town!" | Noodle petted again, hearts | ONE ask |
| end | 21.29-23.79 | | standard end card | | music fades | |

The pace is set in `build_town.js` (`BEATS`). The voice lengths are hook 4.03, rub 2.91, walk 2.62, board 2.35, gift 3.96 and ask 1.77 s. The music is the game's own Town Square music (`mods/pawaudio.js` `_render`, place `square`), with the voice at -16 LUFS and the music 11 dB under it. The game's SFX (`00_core.js` `tone()`) are mixed 14 dB down: a squeak (70 %) or a boop with each pet heart, and the pop on the treat bag.

## Where the facts come from (origin/main 3950b5b1; the build checks each)

- **The goal and dates:** CHANGELOG row v2.30 "Better together" (launched 20 Nov 2026 with v2.32): "Town goal 2,000 belly rubs for November 2026, 10,000 a month from December". `cloudflare/worker.js`: `GL_GOAL = 10000` and `GL_MONTH_GOAL = { '2026-11': 2000 }`, in Japan months. `49c_news.js` `NEWS_V230` date `'2026-11-20'`. HANDOFF_MARKETING 78: November's goal is 2,000 belly rubs (20-30 Nov), then 10,000 a month from December. HANDOFF 71 (17 Nov) still said 10,000 and 25 Nov; entry 78 and main replace it. The Reel does not mention the 10,000, to keep one message.
- **The weights:** `58b_goal.js` `GL_PET = 1, GL_WALK = 3` (`act:pet` adds 1 a dog petted; `act:walk` adds 3); en.json `gl.intro`. The note was right.
- **The reward:** en.json `gl.gift` and `nw.v230.gift`; `GL_TREATS` (1 Pupcake, 3 Bone-shaped Biscuit). It goes to everyone who took part that month (`glGift`), once a month.
- **No names, no ranks:** en.json `gl.intro` "No names, no ranks: just the town together."; V230.md 5. The Reel shows no names and no ranks; the line itself was cut for pace.
- **The art:** every drawing is the game's own from the captures. That covers the five places, Gerald's paper (`#glG`, the `.gl-note-fill` rect at x 774.2 y 423.2, 35.6 x 4.6, checked byte for byte), `PawArt.prop('gerald', { pose: 'cheer' })`, `PawArt.item('Pupcake')`, `PawArt.item('Bone-shaped Biscuit')` and `PawArt.dog('dachs')` in the Autumn Scarf.
- **Day count, checked but not used:** 20 to 30 Nov is 11 days in all; on 21 Nov there are 10 left, counting the 21st. 30 Nov 2026 is a Monday.

## Owner's rules: how each holds

1. **Noodle big, the star.** Noodle is 569 px wide standing (checked: 550..700). He is on open ground on each scene's floor, 28 px clear of every prop in the frame (per-frame check, props in scene units in `SCN.*.PROPS`), and he is the only dog. The board beat has no Noodle: the notice board fills the frame there, and Noodle cannot stand in front of it without covering it.
2. **Real scenes to the bottom.** Every beat is a real game place filling 1080 x 1920. There are no blank areas or plain backgrounds.
3. **No overlapping, centred text, safe zone.** Every frame passes `centreCheck`, `safeCheck` and `apartCheck(28)`. Cards and hearts keep 28 px clear of the scene's props (trees, kites, the run arch, the sun, the board, lamps, benches, the gull and so on). On the hilltop, the far town is also kept clear of the cards. Backdrop is allowed behind cards: the far hills, the pine row, the river and sea, the Square's buildings and the pier rail, as in the visitor Reel. Two of the scene's tiny sky decorations are covered by a card: the woods' small heart (the camera moved to avoid it, see below) and a small sparkle above the pier, which sits fully under the treat bag card. Words and key art stay inside x 60..850, y 270..1440. On the board beat, Gerald's paper stays in that zone, and the whole board is inside it at the start.
4. **Fast pace.** The voice is Kokoro af_bella 1.1x, each card is its line + 0.4 s with 0.15 s pauses, and the game music sits 11 dB under the voice.
5. **Standard end card** for 2.5 s.
6. **Words.** No itch.io, no em dash, no "breed" or "sell", no "Sunday", no "we're at" and no "so far" (the build rejects them). The only numbers allowed on screen are 30, 2,000, 1, 3, 1, 3 (checked). Noodle is a red-brown dachshund, not black or white.
7. **Moving footage.** Noodle's drawings are read off the frozen page clock (`frozen_clock.js`, `stepClock` at exactly 1000/30 ms, 30-frame loops checked exact). Frames render at `fi/30 + 0.0001`. There is no screen recording and no real-time seek. Every camera drifts and Noodle breathes and sways in every hold, so no frame of game footage is frozen.
8. **Length:** 23.80 s including the end card.

## Checks (21 Nov 2026)

- **Per frame:** `CHECK=1` passed all 714 frames. The render also ran every check on every frame.
- **ffprobe:** h264 1080x1920, yuv420p, 30/1, 714 frames; AAC 44.1 kHz stereo; 23.80 s; 6.6 MB.
- **checkFrames** (each beat's run, from 1 frame before its cut to 1 after the next):

| Run | Frames | Median | Doubled | Jumps | Jumps off a cut |
|---|---|---|---|---|---|
| hook | 1-140 | 0.47 | none | 139, 140 (the cut) | none |
| rub | 138-244 | 0.76 | none | 139, 141, 243 (cuts), 161, 191, 211, 221 | 161, 191, 211, 221 |
| walk | 242-339 | 2.64 | none | 243, 338 (cuts) | none |
| board | 337-435 | 10.69 | none | 338, 434 (cuts) | none |
| gift | 433-570 | 0.45 | none | 434-439 (the cut, the card's pop-in), 569, 570 (cut) | none |
| ask | 568-638 | 0.82 | none | 569, 571 (cut, card fade-in) | none |
| end | 638-713 | 4.02 | 652-713 | none | none |

  - Rub 161, 191, 211 and 221 are the game's own pet-pose keyframe steps. The pet drawing changes keyframe every 10 frames (loop frames 0/10/20, read off the frozen clock), and in this quiet shot (median 0.76) a step is above 3x the median. They fall exactly on loop frames 10 and 20 of the run. They are not a stutter.
  - A "cut" counts the frame the place changes and the next 5 frames: each card fades in over 0.1 s, and the treat bag card pops in.
  - The end run's doubled frames are the end card holding still after its 0.3 s fade-in. It is the standard card, which is not game footage, and it was the same in the visitor Reel.
- **Stills looked at 1x:** the hook (the bowl by the blanket is the game's own water bowl, a floor prop), the woods, the board at full zoom and the pier. Contact sheet (10 stills): `/tmp/claude-0/-home-user-paw-haven/821f93b0-fc0a-5e7e-8605-cd441828990a/scratchpad/tg/town-goal-contact-sheet.jpg` (scratchpad, not committed).

## Changed from the brief

- **Hook:** I used neither GM idea. Both scored about 51, under 80. The winner, at 100, keeps the GM's deadline and town-wide stakes and stays true after 21 Nov.
- **Woods camera:** I moved it to 4x (y from 120) after looking at the 1x still. At 3.8x a small heart decoration in the woods' sky peeked out from under the card's top corner. Only the rub frames (138-243) were rendered again, then encoded with the same sound.
- **Board beat zoom:** it ends at 5.2x, not 6x, so the paper's speckle texture stays fine.
- **Cameras keep moving through the 0.15 s pause after each line.** The first render's checkFrames found 2 doubled frames at the ends of the walk and board beats, where the camera had stopped. I fixed that and rendered everything again.
- **The "No names. No ranks." line was cut** to keep the Reel fast with one ask. It stays true and is in the game's sheet (`gl.intro`).
