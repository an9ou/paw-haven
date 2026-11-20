# "Guess who's at the door" Reel: v2.26 Yard visitors (20 Nov 2026)

The owner (20 Nov 2026): "Good, create it, make it with attractive hook". English cut only: no RedNote cut, no cover and no captions yet (they wait for the owner's approval of this cut). **Nothing posted.** Files in `brand/instagram/launch/visitor_reel/`.

| File | What |
|---|---|
| `doodle-doggo-guess-the-visitor.mp4` | English: Instagram Reels, YouTube Shorts, X. 1080 x 1920, 30 fps, h264 + AAC stereo, **31.38 s (941 frames)**: 28.88 s of Reel, then our standard end card for 2.5 s (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`: the logo, doodledoggo.app, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp with icons), music fading under it. |
| `capture_visitor.js` | The clean captures from a fresh worktree of origin/main d72779a9 (below): the Home Yard, the Visitors Book's silhouette pages, a real visit of each round's dog, the book art, and every dog drawing animated on the frozen page clock. |
| `build_visitor.js` | Remake (below). Stops if any fact below changed on main; every frame runs the checks listed under Checks. `ONLY=stills`, `CHECK=1`, `FRAMES=a-b` as in the other Reels. |
| `vo_visitor.json` | Noodle's lines (Kokoro af_bella 1.1x via `../friends_reel/vo_friends.py`). |

Rebuild:

```
git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
NODE_PATH=$(npm root -g) node brand/instagram/launch/visitor_reel/capture_visitor.js <main> <caps>
VO_LINES=brand/instagram/launch/visitor_reel/vo_visitor.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo> af_bella 1.1
ART_ROOT=<main> CAPS=<caps> NODE_PATH=$(npm root -g) node brand/instagram/launch/visitor_reel/build_visitor.js <work> <vo>
```

## The idea

Three rounds at Noodle's yard gate. A crayon silhouette of a neighbour's dog walks up to the gate; ONE clue is on screen and in the voice; a 2 s guess with a ticking crayon timer; then a pop: the real dog in colour greets Noodle (it turns happy, hearts), and a Visitors Book card shows its name, breed and family. Round 3 is the trickiest shape and its reveal is the last one before the ask ("How many did you get? 👇") and the end card.

**The clue of each round is the game's own:** before you meet a visitor, the Visitors Book shows a pencil silhouette, "???" and a hint under it (`yvBookHTML`, `yvHint`). Each round's clue is exactly that hint. The three visitors are all rare ones (★), so each has its own hint.

**The silhouette is built from the real art:** the visitor's own drawing (`PawArt.dog`, as the yard draws it, the keyframe of that moment) through an SVG filter that recolours every fill to a mid ink-blue (#5A7397) with a crayon grain (fractal noise streaks in a lighter blue) and draws a dark pencil line round the outside (a dilated ring broken by noise, as the game's own book silhouette `yvSil` does in graphite). Not black; the fill stays inside the line; the ground shadow under the dog is the game's own.

## The hook

`hookscore.py` (`.claude/skills/ig-reel/`), 19 options. Used: **"3 shadows at the gate. Bet you can't name all 3!"** **84.4 STRONG** (length 100, specificity 100, stakes 70, front-load 100, address 100). True: there are 3 silhouettes at the gate and it is a playful dare, no made-up statistic. On screen at frame 1 with the first silhouette already walking up to the gate; Noodle says it ("Three shadows at the gate. Bet you can't name all three!").

| Score | Option | Why not |
|---|---|---|
| **84.4** | **3 shadows at the gate. Bet you can't name all 3.** | **Used** (with "!" on screen: same score). Shortest of the 84s, and it names the gate the viewer sees. |
| 84.4 | Bet you can't guess all 3 dogs at Noodle's gate. | Runner-up. Payload at word 3. |
| 84.4 | 3 dog shadows. You can't get all 3. Round 3 is sneaky. | Runner-up. 12 words, 4.4 s spoken: too long for a hook card. |
| 84.4 | Bet you can't guess round 3. Name the dog from its shadow. | 4.4 s spoken. |
| 84.4 | Bet you can't name 3 dogs from their shadows in 2 seconds. | 4.4 s spoken. |
| 81.4 | Bet you can't name all 3 dogs from their shadows. | Less concrete (81). |
| 80.8 | You won't get round 3. Guess the dog from its shadow. | Fine; weaker opener. |
| 69.4 | Don't scroll. Can you name these 3 dog shadows? | Dealbreaker: "don't scroll" opener. |
| 62.6 | Only 2 seconds to guess each shadow. Round 3 is sneaky. | Nobody addressed. |
| 58.4 | 3 shadows at Noodle's gate. Can you name all 3 dogs? | Nothing at stake. |
| 57.1 | 3 dogs at the gate, 2 seconds each. How many can you guess? | Nothing at stake, 13 words. |
| 55.4 | Can you guess 3 dogs from just their shadows? | Nothing at stake. |
| 54.8 | Guess these 3 dogs from their shadows. Round 3 fooled me. | Nothing at stake. |
| 51.2 | You get one clue and 2 seconds. Guess the dog. | Payload late. |
| 50.6 | 3 dogs. 3 shadows. Most people miss round 3. (brief's example) | Nothing at stake; "most people" is an unbacked claim. |
| 50.6 | 3 shadows, 3 clues, 2 seconds each. Ready? | Nobody addressed. |
| 43.4 | Guess the dog from its shadow. Round 3 is sneaky. (brief's example) | Payload late. |
| 40.4 | Guess the dog from its shadow in 2 seconds. Go! | Payload late. |
| 38.4 | Someone's at Noodle's gate. Can you guess who? (brief's example) | No payload word. |

## Script and shot table (Noodle, Kokoro af_bella 1.1x)

Fast pace (owner, 13 Nov): each card stays for its line + 0.4 s with 0.15 s pauses; a clue card stays for its line, then the 2.0 s guess (timer showing 2, then 1, a red crayon wedge running out, the game's click on every half second); the reveal pops straight after the timer. Background in every beat: the game's Home Yard (origin/main `svg.world`, autumn, sunny, day; window x 268..572, y 60..600 of the 1000 x 600 yard, at 3.556x; the washing line's pole just off the right edge): the gate with its towel, the fence with the washing line, the dig patch with its bone bottom right, grass and autumn leaves to the bottom of the frame. Noodle (`PawArt.dog('dachs')`, Autumn Scarf, as in the share and winter Reels) stands big at the front left, 569 px wide standing, facing the gate: standing (idle) through the hook, every clue and every guess, the game's play bow from each reveal on. Each visitor stands on the open grass in front of the gate (feet at y 1128), scaled so its top, even at the reveal's bounce, stays at least 28 px under the washing (visitor scales 1.96, 1.93, 2.16).

| Starts | Frames | Beat | Noodle says | On screen | Dogs |
|---|---|---|---|---|---|
| 0.10 s | 0-100 | hook | "Three shadows at the gate. Bet you can't name all three!" (2.78 s) | Card "3 shadows at the gate. / Bet you can't name all 3!" | Frame 1: the first silhouette (Sir Waddles) already walking up to the gate from the right, at the gate by 1.15 s; Noodle standing (idle). |
| 3.43 s | 101-217 | round 1 clue + guess | "Round one. Comes for the bubbles." (1.79 s) | Card "Round 1: who is it? / Comes for the bubbles."; timer 5.27-7.27 s | Silhouette in front of the gate (idle, breathing); Noodle stands. |
| 7.27 s | 218-302 | round 1 reveal | "Sir Waddles the corgi, from Lady Pemberton!" (2.33 s) | Visitors Book card: the game's book art, "Sir Waddles ★ / Corgi / Lives with Lady Pemberton." | Pop: silhouette to colour (happy, hearts), crayon burst, the game's pop sound; Noodle play-bows. |
| 10.15 s | 303-448 | round 2 clue + guess | "Round two. Comes after a paddle at the Splash Pool." (2.74 s) | Card "Round 2: who is it? / Comes after a paddle / at the Splash Pool."; timer 12.94-14.94 s | Sir Waddles goes home (fades in 0.15 s); Rapunzel's silhouette walks in from the right (1.3 s); Noodle stands. |
| 14.94 s | 449-542 | round 2 reveal | "Rapunzel the Afghan Hound, from Madame Dubois!" (2.60 s) | "Rapunzel ★ / Afghan Hound / Lives with Madame Dubois." | Pop; Noodle play-bows. |
| 18.09 s | 543-688 | round 3 clue + guess (the sneaky one) | "Round three, the sneaky one. Comes when the leaves turn." (2.82 s) | Card "Round 3: the sneaky one / Comes when the leaves turn."; timer 20.96-22.96 s | Momiji's silhouette walks in: the giant spiral tail reads as a squirrel or a fox. |
| 22.96 s | 689-794 | round 3 reveal (last) | "Momiji the Shiba, from Mister Kimura! Not a squirrel." (2.98 s) | "Momiji ★ / Shiba / Lives with Mr Kimura." | Pop; Noodle play-bows. |
| 26.49 s | 795-866 | ask | "How many did you get? Tell me below!" (1.89 s) | Card "How many did / you get? 👇" | Momiji (happy) and Noodle (play bow). |
| 28.88 s | 867-940 | end card | (music fades) | Standard end card, 2.5 s | |

Why these three: real visitors with clearly different shapes and coats that are not black or white. Sir Waddles the Corgi (Red and white): huge ears on short legs, it reads as a rabbit. Rapunzel the Afghan Hound (Red): long nose and a long-haired skirt. Momiji the Shiba (Red with cream): a compact body under a giant spiral tail, the trickiest, so it is round 3. Not used: Cloud (bichon), Muffin (westie) and Yuki (samoyed) are white; Noodle the visitor (the Novaks' dachshund) would be confused with our Noodle.

Sound: the game's own yard music (`mods/pawaudio.js` `_render`, place yard, day, sunny) about 11 dB under the voice (voice -21.6 LUFS raw, +5.6 dB; music -16.4 LUFS raw, -10.6 dB), the game's discover sting at the start; the game's SFX rendered from its own recipe (`00_core.js` `tone()` and `env()` on an OfflineAudioContext): `SFX.pop` (sine 600 to 1300 Hz, 0.08 s) on each reveal, `SFX.click` (triangle 700 to 900 Hz, 0.06 s) as the timer's ticks at 0, 0.5, 1.0 and 1.5 s of each guess. Mix normalised to -16 LUFS, true peak -1.5.

## Where the facts come from (origin/main d72779a9; the build checks each)

| Round | Visitor | Clue (on screen and said) | Name, breed, family | Sources |
|---|---|---|---|---|
| 1 | Sir Waddles (`waddles`), corgi, starter coat 0 "Red and white", 48 months, rare: comes only when the Bubble Fountain is out | "Comes for the bubbles." = `yv.hint_bubbles` (`yvHint` falls through to it for `{ toy: 'Bubble Fountain' }`) | "Sir Waddles ★ / Corgi / Lives with Lady Pemberton." | `YV_DOGS` in `game/src/54_visitors.js`; V226.md table row; `data.yv_dogs.waddles.5` "Lady Pemberton"; the capture's real visit (the yard tag "Sir Waddles", the card "Sir Waddles is visiting! / Sir Waddles · Corgi ★ Lives with Lady Pemberton.", its book page "... Favourite: Bubble Fountain Comes for the bubbles.") and the book's unmet page "??? Comes for the bubbles." |
| 2 | Rapunzel (`rapunzel`), afghan, "Red", 60 months, rare: comes after a paddle at the Splash Pool | "Comes after a paddle at the Splash Pool." = `yv.hint_pool` (`r.pool`) | "Rapunzel ★ / Afghan Hound / Lives with Madame Dubois." | same: `YV_DOGS`, V226.md, `data.yv_dogs.rapunzel.5`, the visit's card and book page, "??? Comes after a paddle at the Splash Pool." |
| 3 | Momiji (`momiji`), shiba, "Red with cream urajiro", 26 months, rare: comes in autumn (it is autumn on 20 Nov) | "Comes when the leaves turn." = `yv.hint_autumn` (`r.season === 'autumn'`) | "Momiji ★ / Shiba / Lives with Mr Kimura." | same: `YV_DOGS`, V226.md, `data.yv_dogs.momiji.5`, the visit's card and book page, "??? Comes when the leaves turn." |

Also checked: the Visitors Book shows a silhouette, "???" and the hint for a dog not met yet (`yvBookHTML` source); `yv.book` "Visitors Book", `yv.family` "Lives with {family}.", `yv.aria` "{name} is visiting from {family}" (the voice's "from"); the ★ is the game's rare-visitor star on the card and the page; v2.26 live since 18 Nov (`NEWS_V226.date`); the visitors feature on in the capture (`yv.on()`); `PawArt.YARD_VISITORS` (`world/pawart_world_b.js`) and its `book()` art (the card's book); the breed names (Corgi, Afghan Hound, Shiba) from the capture's own cards; the coat's main colour is neither black nor white (luminance check). "Not a squirrel" is a joke about the silhouette, not a game claim.

**Drawings.** Each visitor is drawn as the yard draws it (`yvSVG`: `dogSVG` of its breed's starter coat 0, seeded by `'yv_' + id`); the capture rebuilds the same drawing from main's own data (`STARTER_GENES`, `window.__paw.coat`, `hashId`) and checks its "happy, facing left" drawing is the yard's `#visitorG` drawing byte for byte (all three: true) before drawing the other poses (walk, idle, happy, sit).

**Frozen clock.** Every moving drawing (Noodle's idle and bow; each visitor's walk, idle, happy) is the game's own animated SVG (three keyframes, `pa-d-b0..b2`, 1 s, steps) put in the game page and read off on the frozen page clock (`../frozen_clock.js`: `freezeClock`, `stepClock` at exactly 1000/30 ms from a whole-ms start, `releaseClock`): 30 frames per loop, frame 30 checked equal to frame 0, no other animation on the dog. The build plays loop frame (n minus the run's first frame) mod 30 of each run (walk-in, wait, reveal), so the game's legs and tails move as in the game; on top, every dog breathes and sways gently all the time (as in the share Reel) so no hold is frozen.

## Owner's rules: how each holds

1. Noodle big and the star: 569 px wide standing (checked: 550..700), feet on the yard's grass, 28 px clear of the dig patch; the visitors on the open grass in front of the gate; dogs never closer than 28 px (`apartCheck`); no black or white subject.
2. A real game scene to the bottom of the frame (grass and leaves of the yard), no blank areas.
3. No overlaps, scene props included (coordinator fix, 20 Nov 2026): `centreCheck` on every text box, `safeCheck`, `apartCheck` on the dogs, cards and timer; **every dog (each visitor and its silhouette, walking or standing, and Noodle), the reveal's burst, the cards and the timer stay 28 px clear of the washing (both shirts, both socks, the towel), the line itself (its measured path, a box per stretch, `ROPE` in the build) and the pole, on every frame** (boxes count where they are inside the frame; the pole is just off it); dogs also 28 px clear of the dig patch. Every word and key art inside x 60..850, y 270..1440. Only the fence boards, the gate and the far hills are backdrop. One exception, by design: while a visitor walks in from the right edge it may run past x 850 (above the platform buttons, which start at y 1163) until it reaches its spot; it is inside the safe zone before its clue's guess starts.
4. Fast pace, af_bella 1.1, line + 0.4 s, 0.15 s pauses; the guess 2.0 s with a visible ticking crayon timer; yard music about 11 dB under; the game's pop on each reveal.
5. Standard end card, 2.5 s.
6. Only doodledoggo.app; no itch.io, no "breed" as a verb, no "sell", no em dash (the build checks every word).
7. Frozen clock for all game animation (above); `checkFrames` on every run (below).
8. 31.38 s including the end card.

## Checks (20 Nov 2026)

- `CHECK=1`: all 941 frames pass, including the new washing check; the full render runs the same checks on every frame.
- `checkFrames()` on every run (from the frame before its cut to the frame after the next): **0 doubled frames** in all eight moving runs (hook 1-103 median 0.39, c1 101-218 0.25, r1 216-304 0.34, c2 302-448 0.48, r2 446-542 0.34, c3 540-688 0.47, r3 686-794 0.40, ask 792-866 0.37). Single-frame spikes only at the cuts (217, 303, 541, 687, about 7-9; 102-103 and 793-794, card changes). The other "jumps" it lists are not glitches: each visitor's walk-in and each reveal's cross-fade and bounce are smooth ramps, and the rest (180, 259, 539, 829: 0.76..1.2) are the game's own keyframe swaps, every 10 frames from a run's start. The end card (880-940) is the standard still card after its fade-in, as in every Reel.
- ffprobe: h264 1080 x 1920, 30/1 fps, 941 frames, 31.38 s; AAC 44.1 kHz stereo.
- Key stills looked at at 1x (the hook frame 1, a guess with the timer, the three reveals: every visitor's top well under the towel and socks, Noodle play-bowing in front); 10-still contact sheet remade in the scratchpad.

**Fix of 20 Nov 2026 (coordinator).** The first render let the visitors stand in front of the washing (Sir Waddles' ears, Rapunzel's head and Momiji's tail covered the towel). Now the visitors stand forward on the open grass, smaller (scales 1.93..2.16 from 2.18..2.38) so their tops stay under the washing, Noodle stands and play-bows (lower poses than sit and happy-with-hearts, so the two dogs stay 28 px apart), the window moved 4 units left (the pole off the frame), the cards moved up 8 px (clear of the line), and the build fails if any dog, the burst, a card or the timer comes within 28 px of the washing, the line or the pole. Same length, beats and sound.

## Changed from the brief

- The clue of every round is the hint the game's own Visitors Book prints under the silhouette, so all three visitors are rare ones (only rare ones have hints; a common one's hint is "A neighbour's dog. Put a toy out!").
- The hook is "3 shadows at the gate. Bet you can't name all 3!" (84.4); the brief's three examples scored 50.6, 43.4 and 38.4.
- The guess hold replaces the clue card's 0.4 s tail, and the reveal follows the timer with no pause; that keeps the Reel inside 32 s.
- The yard is shown as it is with nothing put out (no toys), so its open grass carries the dogs; the window puts the gate behind the visitor and the dig patch to the right of Noodle.
- Noodle stands while he waits and play-bows on each reveal (not sit and happy): the lower poses leave room for the visitor between him and the washing.
- The VO says "Mister Kimura" (the voice reads "Mr" badly); the card says "Mr Kimura" as the game does.

## RedNote cut (20 Nov 2026)

The owner approved the English cut ("Good") and asked for the RedNote version. Only the MP4 is made (no cover, no captions); the English MP4 is unchanged (same file, md5 checked after the RedNote render).

| File | What |
|---|---|
| `doodle-doggo-guess-the-visitor-rednote.mp4` | RedNote / 小红书: 1080 x 1920, 30 fps, **39.23 s (1177 frames)**: 36.72 s + the RedNote end card for 2.5 s (the logo, 治愈系蜡笔狗狗游戏 and only "搜 Doodle Doggo App", centred at 540, 960). |
| `vo_visitor_zh.json` | Noodle in Mandarin (`../friends_reel/vo_friends_zh.py`, Kokoro v1.1-zh, zf_073 1.0x). |

Remake: `PAW_LANG=zh-Hans node capture_visitor.js <main> <caps_zh>`, the voice with `VO_LINES=brand/instagram/launch/visitor_reel/vo_visitor_zh.json python3 brand/instagram/launch/friends_reel/vo_friends_zh.py <kokoro dir> <vo_zh> zf_073 1.0`, then `REDNOTE=1 CAPS=<caps_zh> node build_visitor.js <work_zh> <vo_zh>`.

Every word is the game's own zh-Hans where the game has it (`game/i18n/zh-Hans.json`, checked by the build; the captures were made with the game in zh-Hans): 访客簿 (`yv.book`), the family line 和{family}住在一起。 (`yv.family`), the hints 为了泡泡而来。 / 在戏水池划完水后会来。 / 树叶变色的时候会来。 (`yv.hint_bubbles`, `yv.hint_pool`, `yv.hint_autumn`), the families 彭伯顿夫人 / 杜布瓦夫人 / 木村先生 (`data.yv_dogs.*.5`), the breeds 柯基犬 / 阿富汗猎犬 / 柴犬 (`data.breed_names.*`). The game keeps the visitors' names in Latin letters in zh-Hans (no zh name keys; the zh capture's cards say "Sir Waddles来做客啦！", "Sir Waddles · 柯基犬 ★ 和彭伯顿夫人住在一起。"), so the cards show Sir Waddles, Rapunzel and Momiji, and the voice says the breed and the family instead of a Latin name. The zh capture's Visitors Book shows "??? " + each hint under the silhouettes.

| Beat | Noodle says (zf_073 1.0x) | Card |
|---|---|---|
| hook | 门口来了三个影子，你能全猜对吗？ | 门口来了3个影子， / 你能全猜对吗？ |
| c1 | 第一轮：为了泡泡而来。 | 第1轮：猜猜是谁？ / 为了泡泡而来。 (timer 2, 1) |
| r1 | 原来是柯基犬，和彭伯顿夫人住在一起！ | 访客簿 card: Sir Waddles ★ / 柯基犬 / 和彭伯顿夫人住在一起。 |
| c2 | 第二轮：在戏水池划完水后会来。 (the voice file says 滑完水: misaki reads 划 as huà; 滑 gives the right sound, huá; subtitles and card keep the game's 划) | 第2轮：猜猜是谁？ / 在戏水池划完水后会来。 |
| r2 | 原来是阿富汗猎犬，和杜布瓦夫人住在一起！ | Rapunzel ★ / 阿富汗猎犬 / 和杜布瓦夫人住在一起。 |
| c3 | 第三轮，最难的来了：树叶变色的时候会来。 | 第3轮：最难的一轮 / 树叶变色的时候会来。 |
| r3 | 原来是柴犬，和木村先生住在一起！不是松鼠哦。 | Momiji ★ / 柴犬 / 和木村先生住在一起。 |
| ask | 你猜对了几个？评论区告诉我！ | 你猜对了几个？ / 评论区告诉我👇 |

Subtitles (Noodle's words, at most 14 characters, LXGW WenKai, at y 1560 under Noodle on the open grass, 28 px clear of the yard's props): 门口来了三个影子 / 你能全猜对吗？ · 第一轮 / 为了泡泡而来。 · 原来是柯基犬 / 和彭伯顿夫人住在一起！ · 第二轮 / 在戏水池划完水后会来。 · 原来是阿富汗猎犬 / 和杜布瓦夫人住在一起！ · 第三轮，最难的来了 / 树叶变色的时候会来。 · 原来是柴犬 / 和木村先生住在一起！ / 不是松鼠哦。 · 你猜对了几个？ / 评论区告诉我！

Full frame, no safe zone: everything in front (and the yard window with it, x 244..548) moved 85 px right, a 50 px margin. All the English cut's rules hold: the washing-line check (every dog, the burst, the cards, the timer and the subtitles 28 px clear of the washing, the line and the pole; the RedNote visitors keep 40 px of headroom under the washing), text centred in its boxes, Noodle 569 px wide standing, dogs 28 px apart, the frozen-clock drawings, the 0.0001 frame-index nudge, the checks on every frame. It is longer than the English cut (Mandarin at 1.0x: 27.8 s of voice), as the earlier RedNote cuts are (share: 36.98 s).

Anti-ban: no QR, link, domain, @ or handle; no other app or platform; nothing about posting or sending. The build stops on any of: a URL or `www.` / `.app` / `.com`, `@`, Instagram, INS, ins, YouTube, TikTok, itch, 微信, 朋友圈, QQ, 微博, 抖音, 小红书, WhatsApp, 链接, 网址, 官网, 二维码, 扫码, 下载, 私信我, 加我, 主页链接, 戳, 发帖, 发到, 发布到, 快拍, 帖子, tag, in the cut's words, the subtitles, the voice and the captured game text (the book title, the silhouette pages, each visit's tag, card and book page).

Checks: all 1177 frames pass (`CHECK=1` and the full render). `checkFrames()`: **0 doubled frames** in all eight moving runs (medians 0.25..0.45); spikes over 5 only at the six beat cuts (115, 247, 375, 532, 668, 840); everything else it flags is under 4.4: the reveal cross-fades, the walk-ins, the subtitle pills fading in and out, and the game's keyframe swaps. The end card (1115..1176) is the still RedNote card after its fade-in. ffprobe: h264 1080 x 1920, 30/1 fps, 1177 frames, 39.23 s, AAC stereo.

## Covers (20 Nov 2026)

The owner asked for both covers; the coordinator writes the captions. Made with `ONLY=cover` (English) and `REDNOTE=1 ONLY=cover` (RedNote); both MP4s unchanged (md5 checked).

| File | What |
|---|---|
| `brand/instagram/launch/visitor_reel/visitor-cover.jpg` | English, 1080 x 1920, its own design (not a frame of the Reel): "Guess the dog?" big in red with "from its shadow" on a cream card; the three silhouettes side by side on the yard's grass (the same crayon-shaded ink-blue filter on the game's own idle drawings: big ears on short legs, the long-haired hound, the spiral tail), each with a number tag 1 / 2 / 3; Noodle big in front (happy, 568 px wide), looking at them; the logo on its own card bottom right. No names and no coloured visitors (the answers stay hidden). The game's Home Yard (window x 268, the gate and the washing behind) filled to the bottom. |
| `brand/rednote/rednote-21-guess-the-visitor.jpg` | RedNote, 3:4 (1080 x 1440): the same design cut at y 240..1680, in LXGW WenKai: 「猜猜是哪只狗？」 and 「看影子猜狗狗」. No link, domain, handle, QR or app name (the build's RedNote ban list runs on the cover's words). |

Checks (both): text centred in its box (`centreCheck`), everything 28 px apart (`apartCheck`: the three silhouettes, their tags, Noodle, the title card, the logo card), the dogs on the yard's floor, every drawn thing 28 px clear of the yard's props (the dig patch, the stone, the house) and of the washing, the line (its measured path) and the pole; everything inside x 40..1040, y 250..1670 (the 3:4 grid crop). The silhouettes are sized so their tops stay under the washing. Both looked at at 1x.
