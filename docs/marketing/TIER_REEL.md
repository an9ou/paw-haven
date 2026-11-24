# "9, 45 or 900 coins?" Winter Market tier Reel (made 24 Nov 2026)

The owner approved the idea on 24 Nov 2026 ("Good, render it"): a price-tier Reel for the Winter Market, which is open in the game from 23 Nov to 31 Dec 2026. **English cut only. Nothing posted, nothing sent.** No cover, no captions and no RedNote cut yet. Those get made only when the owner asks. Files are in `brand/instagram/launch/tier_reel/`.

| File | What |
|---|---|
| `doodle-doggo-winter-tiers.mp4` | The cut: 1080 x 1920, 30 fps, h264 + AAC stereo, **28.30 s (849 frames)**. That is 25.79 s of Reel, then our standard end card for 2.5 s ("Play free!" over the logo, doodledoggo.app, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp with icons), with the music fading under it. Pace: each card stays up for its line + 0.4 s, with 0.15 s between beats. Mix at -16.2 LUFS. |
| `capture_tier.js` | The game footage: three real places from a fresh worktree of origin/main (2ec92581), with the game date 24 Nov 2026, sunny, by day, on the frozen page clock. Also holds `plan()`, the one timeline both scripts use. |
| `build_tier.js` | The tag, the cards, the checks, the sound and the encode. Stops if any game fact below changed on main. `CHECK=1` runs every frame's checks; `FRAMES=a-b` re-renders only those frames; `ONLY=stills` renders key frames. |
| `vo_tier.json` | Noodle's lines. "Yogurt" is spelled that way for the voice only, so Kokoro says it right. On screen it is the game's "Frozen Yoghurt Snowballs". |

## The hook

Options were scored with `ig-reel` hook scoring (`python3 .claude/skills/ig-reel/hookscore.py`), built around the approved line "9 coins, 45 coins or 900 coins. What would you get your dog?". As worded, the approved line scored only 57.1: nothing was at stake. The hook used is **"9, 45 or 900 coins. What should your dog get first?"**, which scored **100.0 STRONG** (length 100, specificity 100, stakes 100 for "should" and "first", front-load 100, address 100). It is true: it is a question, the three prices are the game's real prices (below), and it keeps the approved idea. The first price tag ("Tier 1 / 9 coins") is fully on screen in frame 1.

| Score | Option | Why (not) |
|---|---|---|
| **100.0** | **9, 45 or 900 coins. What should your dog get first?** | **Used.** |
| 84.4 | 9, 45 or 900 coins. What would you get your dog first? | Runner-up: only one stake word. |
| 84.4 | 9, 45 or 900 coins. What would you actually get your dog? | One stake word. |
| 84.4 | 9, 45 or 900 coins. Which would you get your dog first? | One stake word. |
| 84.4 | 9, 45 or 900 coins: what's your dog getting first? | One stake word. |
| 83.1 | 9, 45 or 900 coins. What would you get your dog, not you? | One stake word, odd. |
| 80.8 | What would you get your dog first: 9, 45 or 900 coins? | Payload late. |
| 78.7 | 9 coins, 45 coins or 900 coins. What would you get your dog first? | Too long (66 characters). |
| 58.4 | 9, 45 or 900 coins. What would you get your dog? | Nothing at stake. |
| 57.1 | 9 coins, 45 coins or 900 coins. What would you get your dog? (the approved wording) | Nothing at stake, long. |

## Script and shots (Noodle, Kokoro af_bella 1.1x)

The **layout is the same on every beat** (it is not the winter list Reel's wide panorama). Up top is a close view of the place where the item lives, filling the frame to the bottom. In the middle stands Noodle, big, on the open floor in front. Below Noodle is one block (y 1146..1440). The block holds a **big crayon price tag** on the left: it gives the tier, one to three drawn crayon coins (a gold disc with a little paw, no emoji) and the price. The tag pops in with the game's coin chime. On the right is a **card** with the game's own item drawing (`PawArt.item`), its name and the game's own words about it.

| Starts | Beat | Place (camera) | Noodle says | Tag and card | Noodle in the game |
|---|---|---|---|---|---|
| 0.10 s | hook | Winter Market, close on the **Treats cart** with its bowl of snowballs (C1) | "Nine, forty-five, or nine hundred coins. What should your dog get first?" (4.21 s) | The tag shows Tier 1 / 9 coins from frame 1, then pops to Tier 2 / 45 coins at 0.6 s and Tier 3 / 900 coins at 1.6 s, with the voice. The card reads "9, 45 or 900 coins." + "What should your dog get first?" | Dances, facing the cart. |
| 4.86 s | tier 1 | same (C1) | "Tier one, nine coins: Frozen Yogurt Snowballs. Plain unsweetened yogurt only. Two or three are plenty!" (6.97 s) | **Tier 1, 1 coin, 9 coins.** **Frozen Yoghurt Snowballs**: "Plain unsweetened yoghurt only. / Two or three are plenty." | Begs at the cart. At 1.6 s the **yum** face comes on ("yum!"). |
| 12.38 s | tier 2 | Winter Market, close on the **Toys stall** (the Snowball Ball in its left basket) (C2, cut) | "Tier two, forty-five coins: the Snowball Ball. A snowball that never melts!" (4.60 s) | **Tier 2, 2 coins, 45 coins.** **Snowball Ball**: "A snowball that / never melts." | Happy (tail going). At 1.0 s, **zoomies** (speed lines, kicked-up snow). |
| 17.53 s | tier 3 | **Noodle's Home Yard with the Gingerbread Kennel moved in** (C3, cut) | "Tier three, nine hundred coins: the Gingerbread Kennel. A look, not a snack. Wood all the way through." (5.70 s) | **Tier 3, 3 coins, 900 coins.** **Gingerbread Kennel**: "A look, not a snack. / Wood all the way through." | Stands in front of his kennel. At 1.7 s the **hearts** face comes on. |
| 23.78 s | ask | same (C3) | "Which tier are you?" (0.81 s, card +0.6 s) | One card over the whole block: "Which tier / are you?" with a red crayon arrow pointing down. | Stands, **curious** ("?"). |
| 25.79 s | end card | | (music fades) | Standard end card (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`, 70 px lower, "Play free!" over the logo, as in the winter list Reel), 2.5 s. | |

The cameras (world units of the game's `svg.world`, viewBox 0 0 1000 600; S = px per unit):

- **C1** (Winter Market, S 2.55): the Clothes stall fills the top. The Treats cart, with the game's own bowl of Frozen Yoghurt Snowballs on it, stands at the right (x 666..850). Noodle is on the open snow to its left, 32 px or more from the cart and 54 px or more under the Clothes counter.
- **C2** (Winter Market, S 2.2): the Toys stall fills the top, with the fluffy Snowball Ball in its left basket at about y 300. Noodle is to the right of the Treats cart (32 px), 44 px or more under the snow drift.
- **C3** (Home Yard, S 2.0, autumn, as the game draws it on 24 Nov): the Gingerbread Kennel is in its own place (the game draws `S.house` at 620, 330), with the fence, the dig patch and the yard's bushes around it. Noodle stands on the grass in front, 36 px or more below the kennel's drawn box.
- **Noodle** is the game's own leader dog (the dachshund), drawn by the game at a foreground size (`rm.to`'s `k`) of 2.4 px for each unit of his art. **Standing, he is 566 to 583 px long** (tier 3 and the ask). Happy with zoomies he is 600 px. Dancing and begging upright he is 473 to 479 px wide and 401 to 435 px tall. His feet stay on y 1092. His drawn box, faces and their words included, spans x 72..848 and y 673..1114 across the whole Reel.
- **Floor in front:** in every camera the scene's own floor continues to the bottom of the frame. In the market that means its snow colour, its ground dashes copied, and the game's own Present Pile, Red Wooden Sled and Yard Snowman (`PawArt.prop`, all under y 1470). In the yard it means its grass colour and its own speckle pattern, its grass strokes and grass patches copied, and copies of its own two bushes and planter. The yard's two washi-tape corners (the sketchbook's tape, `O.tape`) are left out. The camera drifts on a 3 px circle, one turn every 6 s, so every frame moves.

Sound: the game's own Winter Market music (`mods/pawaudio.js`, place `fmarket` with `fest: 'winter'`) sits 11 dB under the voice for the whole Reel. The game's own coin chime (`PawAudio` stinger `coin`) plays on every tag pop (0.10, 0.70, 1.70, 4.86, 12.38 and 17.53 s), with a soft tick on each card.

## Facts and sources (all checked by `build_tier.js` against origin/main 2ec92581; the build stops if one changes)

| In the Reel | Source on main |
|---|---|
| The Winter Market is open on 24 Nov 2026 (23 Nov to 31 Dec) | `game/src/49_market.js` `FM_MARKETS` winter `win(y)`: in 2026, 11-23 to 12-31. `CHANGELOG.md` rows v2.31.10 and v2.31.11. The sign in the footage ("Winter Market · open until 31 Dec") is the game's own (`fm.sign`, `fm.m_winter` in `game/i18n/en.json`). The capture checks the running game: on 2026-11-24 (Japan date) the winter market is the main open market (winter 2026-11-23..2026-12-31; Harvest until 11-30). |
| **Tier 1: Frozen Yoghurt Snowballs, 9 coins**, "Plain unsweetened yoghurt only. Two or three are plenty." | `FOOD` in `game/src/00_core.js`: price 9, snack, fest 'winter', fm. The game's two-sentence dog-safe lesson (`tip`): "Plain unsweetened yoghurt only, never a sweetened or light pot, which can hide xylitol. Dairy is a treat for dogs, so two or three little snowballs are plenty." The card and the voice use its words, shortened, and it stays true. `data.food.frozen_yoghurt_snowballs.n`. It is on the market's `treats` list. `PawArt.WINTER_MARKET.treats`. |
| **Tier 2: Snowball Ball, 45 coins**, "A snowball that never melts." | `TOYS` in `00_core.js`: price 45, fest 'winter', fm, note "Fetch: a fluffy white ball, a snowball that never melts. 2 coins per return." `data.toys.snowball_ball.n`. It is on the market's `toys` list. `PawArt.WINTER_MARKET.toys`. |
| **Tier 3: Gingerbread Kennel, 900 coins**, "A look, not a snack. Wood all the way through." | `HOUSES` in `00_core.js`: price 900, Bond 3, comfort 0.25, fest 'winter', fm, note "…A look, not a snack: it is wood all the way through." `data.houses.gingerbread_kennel.n`. It is on the market's `homes` list. `PawArt.WINTER_MARKET.house`. In the yard: `03_yard.js` `houseG` draws `S.house` at (620, 330, 240 x 200). The capture moved it in the way the shop's "Move in" does (`S.house`), and the yard names it "Dog house: Gingerbread Kennel". |
| The drawings on the cards | `PawArt.item(name)` of main, saved by the capture (`<caps>/items/`). |
| Not said, kept for captions later | Bond needed: Kennel 3, the ball and the treat 1. The Reel does not claim anyone can buy the kennel on day one. Toy games share one 30-coins-a-day cap. |

No price differed from the brief, so the hook kept 9, 45 and 900. House words: no "sell", no "breed", no em dash, no itch.io (the build checks all of these). The only website is doodledoggo.app on the end card. Noodle is a red-brown dachshund, not a black or white dog.

## How it was made, and the checks

- **Frozen clock (owner, 17 Nov).** Both takes, the market (frames 0..524, C1 and C2) and the yard (525..788, C3), were captured with `brand/instagram/launch/frozen_clock.js`: `freezeClock`, then `stepClock(t0 + n x 1000/30)` before every screenshot, then `releaseClock`. Frame n's time carries the 0.0001 nudge. The game's own timers were stopped for each take. The page was never resized, and the game drew each scene once per take (`facts.draws`). Everything in the picture is drawn by the game page; the build only lays the tag and cards over it. The camera cuts land only on beat cuts (tier 2 and tier 3).
- **checkFrames on every run between beat cuts:** **doubled [] in all five runs.**
  - The smallest frame-to-frame change was 0.25 / 0.26 / 0.21 / 0.13 / 0.12 (hook, t1, t2, t3, ask), so no two frames are alike.
  - Medians were 0.40 / 0.38 / 0.34 / 0.46 / 0.44.
  - The jumps (over 3x median) are only these: the hook tag's pops (frames 21..30 and 51..60); the tag pop and card fade-in in the first frames of each beat; a face coming on (yum at 194, zoomies at 412); and the steps of the game's own crayon pose animation, every 10 frames.
  - The ask run has no jumps at all.
- **Every frame (849)** passes:
  - `centreCheck()`, `safeCheck()` and `apartCheck()` at 28 px (tag, card and Noodle's drawn box from the capture);
  - the tag, the card and Noodle inside x 60..850 and y 270..1440, with the tag's pop overshoot included (the tag stays inside its 260 x 294 space);
  - Noodle's whole box, and the block, 28 px or more from every stall, stand, cart, board and prop of the place in the frame. That covers the market's measured boxes (as in the winter list Reel), the floor props and our foreground things (measured on the page), and the yard's own house, garden bed, dig patch, stones, washing pole and tree;
  - the frame always comes from the camera of its beat.
- Looked at 1x: the 10-still contact sheet of the final MP4, the final MP4's frame at 20.0 s, and the build's key stills at 0.0, 10.8, 16.4, 22.4, 25.2 and 27.0 s from the layout pass. That pass came before the tier 3 pose (begging, now standing) and the tag's price size were finalized.
- ffprobe: h264 1080 x 1920, 30/1 fps, 849 frames, 28.30 s; AAC 44.1 kHz stereo. Mix -16.2 LUFS.

## Remake

```
git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
VO_LINES=brand/instagram/launch/tier_reel/vo_tier.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
NODE_PATH=$(npm root -g) node brand/instagram/launch/tier_reel/capture_tier.js <main> <caps dir> <vo dir>        # about 3 min
ART_ROOT=<main> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/tier_reel/build_tier.js <workdir> <vo dir>
```

A change to the tag or a card: `FRAMES=a-b` on the build (the take is kept). A change to the timing, a camera or Noodle: capture again (the build refuses a capture made for another timeline or other cameras). `ONLY=layout` on the capture writes one still per camera with Noodle's boxes in each pose.

## RedNote cut and both covers (owner approved the English cut on 24 Nov 2026: "I approve it")

The English MP4 above is unchanged. The captions are the coordinator's job.

| File | What |
|---|---|
| `tier_reel/doodle-doggo-winter-tiers-rednote.mp4` | The RedNote cut: 1080 x 1920, 30 fps, **30.07 s (902 frames)**. That is 27.55 s of Reel, then the RedNote end card for 2.5 s (the logo, 治愈系蜡笔狗狗游戏 and only "搜 Doodle Doggo App", centred at (540, 960)). Mix at -16.0 LUFS. It runs 0.07 s over 30 because the Mandarin lines are longer (the ask has no extra 0.6 s here). |
| `tier_reel/tier-cover.jpg` | The English cover, 1080 x 1920. |
| `brand/rednote/rednote-24-winter-tiers.jpg` | The RedNote cover, 1080 x 1440 (3:4: y 240..1680 of the same design). |
| `tier_reel/vo_tier_zh.json` | Noodle in Mandarin (Kokoro v1.1-zh, zf_073 at 1.0x, `../friends_reel/vo_friends_zh.py`). |

**RedNote cut** (`REDNOTE=1`, the pattern of town_goal_reel and visitor_reel):
- The captures were made with `PAW_LANG=zh-Hans`, so the game's own signs read 冬日市集 · 开到12月31日, 衣服, 零食, 玩具 and 小窝.
- The whole picture and the block sit 85 px further right, centred on x 540, with a 50 px margin and no safe zone. Noodle's place in the world, and so every prop clearance, is the same as in the English cut.
- The floor things in front sit 140 px lower, so the subtitle pill (LXGW WenKai, at most 14 characters, centred at (540, 1530)) has open snow or grass of its own.
- The beats, places, Noodle's poses and faces, the tags' pops (with the coin chime) and the music are the same as the English cut. The hook tags pop at 0, 1.1 and 1.85 s, with the Mandarin voice.

| Beat | Noodle says (zf_073) | On screen |
|---|---|---|
| hook | 九、四十五，还是九百金币？你的狗狗先要哪个？ | Tag 第1档 / 9 金币 from frame 1, then 第2档 / 45 and 第3档 / 900. The card reads "9、45还是900金币？" + "你的狗狗先要哪个？" |
| tier 1 | 第一档，九金币：酸奶雪球。只用无糖原味酸奶，两三颗小雪球就够了！ | 第1档, 9 金币. **酸奶雪球** · 冬日市集 · 零食. "只用无糖原味酸奶。/ 两三颗小雪球就够了。" |
| tier 2 | 第二档，四十五金币：雪球球。一颗永远不会化的雪球！ | 第2档, 45 金币. **雪球球** · 冬日市集 · 玩具. "一颗永远不会化的雪球。" |
| tier 3 | 第三档，九百金币：姜饼狗屋。只是好看，不能吃，里里外外都是木头。 | 第3档, 900 金币. **姜饼狗屋** · 冬日市集 · 小窝. "只是好看，不能吃：/ 里里外外都是木头。" |
| ask | 你是哪一档？评论区告诉我！ | "你是哪一档？" + "评论区告诉我" with the red crayon arrow. |

The subtitles are each line in parts of at most 14 characters: 9、45 / 还是900金币 / 你的狗狗先要哪个？ … The build stops if they differ from the voice (the numbers are read out as 九, 四十五, 九百).

**The game's zh-Hans words** (`game/i18n/zh-Hans.json` on main; the build stops if any changes):
- `data.food.frozen_yoghurt_snowballs.n` 酸奶雪球, and its `.tip` "只用无糖原味酸奶，… 两三颗小雪球就够了。"
- `data.toys.snowball_ball.n` 雪球球, and its `.note` "…一颗永远不会化的雪球。…"
- `data.houses.gingerbread_kennel.n` 姜饼狗屋, and its `.note` "…只是好看，不能吃：里里外外都是木头。"
- `fm.m_winter` 冬日市集; `fm.s_treats` 零食, `fm.s_toys` 玩具, `fm.s_homes` 小窝; `pm.coins_n` {n}金币.

Each card line must be a part of the game's own line.

The hook 「9、45还是900金币？你的狗狗先要哪个？」 is the English hook word for word: the three real prices up front, "your dog" and "first" (先). `hookscore.py` scores English only, so no number is given. The ask has no hookscore either.

**Anti-ban:** the build stops on any link, domain, `.app`, `@`, handle, QR, other app or platform name, or any of 链接 网址 官网 二维码 扫码 下载 私信我 加我 主页链接 戳 发帖 快拍 帖子 (README / REDNOTE.md). It checks the words, the subtitles, the voice lines and every word the captured game shows (its signs and labels). The faces' own little words (the game's expression art, e.g. "yum!") are drawn by the game in English in every language.

**Checks:**
- Every frame (902) passes `centreCheck()` and `apartCheck()` at 28 px (tag, card, subtitle pill, Noodle).
- Everything stays inside the 50 px margin (x 50..1030, y 40..1880).
- Noodle and the block (the subtitle's room included) are 28 px clear of every prop in the frame.
- The end card is centred at (540, 960).
- **checkFrames, one run per beat: doubled [] in all five.** The smallest changes were 0.25 / 0.24 / 0.23 / 0.07 / 0.13 and the medians 0.40 / 0.39 / 0.37 / 0.49 / 0.43. The jumps are the tags' pops, the card fade-ins at the beat cuts, a face coming on, and the game's crayon pose steps.
- The RedNote contact sheet and stills were looked at 1x.

**Covers** (`ONLY=cover`). The capture's `ONLY=cover` makes the background: the whole Winter Market at 1 px a unit under an open sky (`COVER` in `capture_tier.js`, with `PAW_LANG=zh-Hans` for RedNote). The build then lays the cover on it:
- The question is big on a cream card: "9, 45 or 900 coins?" with a smaller "What would your dog pick?" (RedNote: 「9、45还是900金币？」 with 「你的狗狗会选哪个？」).
- The three big crayon price tags sit in a row under it, each with the game's own item drawing (`PawArt.item`), its tier, crayon coins and price (Tier 1/2/3 · coins, 第1/2/3档 · 金币).
- Noodle stands big on the snow in front with star eyes (the game's `wow` face), with the logo on its own card beside him.
- Below him are the game's own winter set, different from the Reel's presents, sled and snowman: two Felt Fir Trees and the Star Lantern (`PawArt.prop`).

The checks: text centred in its box; 28 px apart; 28 px clear of every market prop and of the bunting, roofs and lanterns; everything inside x 40..1040, y 250..1670; and the RedNote words pass the ban list.

Remake:

```
VO_LINES=brand/instagram/launch/tier_reel/vo_tier_zh.json python3 brand/instagram/launch/friends_reel/vo_friends_zh.py <kokoro dir> <vo zh dir> zf_073 1.0
PAW_LANG=zh-Hans NODE_PATH=$(npm root -g) node brand/instagram/launch/tier_reel/capture_tier.js <main> <caps zh dir> <vo zh dir>
REDNOTE=1 ART_ROOT=<main> CAPS=<caps zh dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/tier_reel/build_tier.js <workdir zh> <vo zh dir>
ONLY=cover [PAW_LANG=zh-Hans] NODE_PATH=$(npm root -g) node brand/instagram/launch/tier_reel/capture_tier.js <main> <cover caps dir> <vo dir>
ONLY=cover [REDNOTE=1] ART_ROOT=<main> CAPS=<cover caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/tier_reel/build_tier.js <workdir> <vo dir>
```
