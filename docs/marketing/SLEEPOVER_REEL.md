# "Noodle's first sleepover" Reel: v2.33 Helping paws (26 Nov 2026)

The owner (26 Nov 2026): "Create today's reels, write with an attractive hook". Today's Reel is for v2.33 "Helping paws" (live since 26 Nov 00:00 JST), built around the dog sleepover. **English cut only**: no RedNote cut, no cover and no captions yet (they wait for the owner's OK on this cut). **Nothing posted.** Files in `brand/instagram/launch/sleepover_reel/`.

| File | What |
|---|---|
| `doodle-doggo-sleepover.mp4` | English: Instagram Reels, YouTube Shorts, X. 1080 x 1920, 30 fps, h264 + AAC stereo 44.1 kHz, **33.73 s (1012 frames)**: 31.22 s of Reel, then our standard end card for 2.5 s (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`: the logo, doodledoggo.app, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp), music fading under it. 5.9 MB. |
| `capture_sleepover.js` | Clean captures from a fresh worktree of origin/main b481ab1e (v2.33, with the v2.33.1 dog art), page date 26 Nov 2026, two games on the Friends cloud mock (`game/fr_mock.js` `mockInit({ hp: true })` + `prefs.hpTest`, as `game/test_v233_helps.js`). |
| `build_sleepover.js` | The plan, every frame and its checks, the sound, the encode and `checkFrames`. Stops if any game fact below changed on main. `ONLY=stills`, `CHECK=1`, `FRAMES=a-b`, `LOOSE=1` as in the other Reels. |
| `vo_sleepover.json` | The voice lines (Kokoro af_bella 1.1x via `../friends_reel/vo_friends.py`). |

Rebuild:

```
git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
NODE_PATH=$(npm root -g) node brand/instagram/launch/sleepover_reel/capture_sleepover.js <main> <caps>
VO_LINES=brand/instagram/launch/sleepover_reel/vo_sleepover.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo> af_bella 1.1
ART_ROOT=<main> CAPS=<caps> NODE_PATH=$(npm root -g) node brand/instagram/launch/sleepover_reel/build_sleepover.js <work> <vo>
```

## The hook

`hookscore.py` (`.claude/skills/ig-reel/`), 13 options. Used: **"Noodle's first sleepover! You won't guess what came home with him."** **85.6 STRONG** (weakest: specificity 75). True: it is a playful tease, no made-up number. On screen from frame 0: the card "Noodle's first sleepover!" (red) / "You won't guess what / came home with him." over a covered picture (the real share picture, blurred, under a big red "?" sticker) and Noodle in his own yard at dawn. The souvenir is paid off at 17.6 s: the same picture, unblurred and big.

| Score | Option | Note |
|---|---|---|
| **85.6** | **Noodle's first sleepover. You won't guess what came home with him.** | **Used** ("!" after sleepover on screen and in the voice). |
| 85.6 | Bet you can't guess the souvenir from Noodle's first sleepover. | Runner-up; "souvenir" is vaguer than "came home with him". |
| 80.0 | Bet you can't guess what Noodle brought home from his sleepover. | Runner-up. |
| 77.8 | Your dog's first sleepover. See what comes home with him. | Under 80. |
| 76.4 | Your dog's first sleepover comes with a souvenir. Watch till the end. | Under 80. |
| 48.6 | You won't guess what your dog brings home from a sleepover. | Not specific. |
| 47.0 | Send your dog to a sleepover. Get a drawing back. (brief) | Nothing at stake. |
| 44.4 | Noodle's first sleepover, and the souvenir. (brief) | Not specific. |
| 39.2 | Noodle went to a sleepover. Look what came home with him. (brief) | Nothing at stake. |
| 39.2 | Noodle slept over at a friend's yard. Wait for the souvenir. | Nothing at stake. |
| 35.0 | Send your dog on a sleepover. It comes home with a crayon drawing. | Gives the payoff away. |
| 34.2 | My dog slept over at a friend's house. He brought back this. (brief) | Not specific. |
| 32.6 | Your dog can sleep over at your friend's yard. Look what comes home. | Payload late. |

## Script and shot table

The two players are made up: the mock's friend names (two Dog Card words each). **Fluffy Button** is Noodle's family (the suite's own player, name [3, 4]); **Sunny Biscuit** is the friend (the mock's first friend, name [0, 0]), with **Honey** the Golden (a Dog Card pet name, index 45). Noodle (`dachs`, the Autumn Scarf) is the star; Honey is Golden red. No black or white dog.

Fast pace (owner, 13 Nov): each card stays up for its line + 0.4 s, 0.15 s between beats. Scenes are the game's `svg.world`, a 303.75 x 540-unit window at 3.556x (the visitor Reel's window, x 268): the washing line, the fence and gate, the yard's grass to the bottom of the frame. The hook and the payoff are shot closer (`mzoom`: x 278, y 290..600 at 6.19x): only the bottom of the fence boards and the open grass, so the washing line, its pole and the sky are above the frame and the picture cards sit on plain fence boards and grass.

| Starts (frame) | Beat | Voice | On screen | Place |
|---|---|---|---|---|
| 0.10 s (3) | hook | "Noodle's first sleepover! You won't guess what came home with him." (3.14 s) | Card (above); the covered picture; Noodle standing. | Noodle's yard at dawn, the camera closer (below) |
| 3.79 s (112) | visit, 3 quick shots | "Help out at Sunny Biscuit's yard: fill the bowl, water the garden, make a wish come true!" (4.61 s) | Card "Help out" + the strip's own button names: "Fill Honey's bowl" (the game's bowl fills with Basic Kibble beside Honey), then "Water the garden" (5.54 s: the game's watering can on the veggie patch tilts and pours), then "Make Honey's wish come true" / "Today I wish for a game of ball" (6.99 s: the game's Tennis Ball arcs from Noodle to Honey, she jumps, the line turns "Wish come true!"). | Sunny Biscuit's yard by day, as a visit draws it (`fryard`); the garden shot is the same yard at x 40 |
| 8.95 s (267) | sleep | "Then tap Sleepover. Noodle packed a toothbrush!" (2.58 s) | Card "Sleepover" / "Noodle packed a toothbrush. / See you in the morning!"; both dogs happy. | Sunny Biscuit's yard by day |
| 12.08 s (361) | night | "That night, he's their guest, name tag and all. Pets for Noodle!" (3.45 s) | Card "A sleepover guest!" / "Honey and Noodle / play together. +1 Bond."; Noodle sits with his tag "Noodle, from Fluffy Button"; the pet at 1.3 s: Honey happy, three hearts. | Sunny Biscuit's own yard at night (their game) |
| 16.08 s (481) | morning, the payoff | "Home by breakfast, with a diary page, and a crayon picture of them both!" (4.17 s) | Card "Home by breakfast, of course." / "A new page in the diary, / and a crayon picture!"; at 17.58 s the real share picture pops in big (646 x 808 in a cream frame) on the open grass; Noodle happy. | Noodle's yard at dawn, the camera closer (below) |
| 20.80 s (623) | letter | "Sunny Biscuit gets a letter saying who helped, and taps Say thanks." (3.47 s) | Mailbox card (the yard's own mailbox drawing): "Fluffy Button helped out!" / "Filled Honey's bowl, watered the garden and made Honey's wish come true."; the "Say thanks" button pops in and is pressed at 1.8 s; at 23.10 s the card turns into "A paw print from Sunny Biscuit" / "Thank you for helping!" | Noodle's yard at dawn (no space by the mailbox for a big dog, so the mailbox is on the card) |
| 24.82 s (743) | thanks | "No chat, no messages. Just dogs helping dogs." (3.17 s) | Card, big: "No chat, no messages. / Just dogs helping dogs." | Noodle's yard at dawn |
| 28.54 s (855) | ask | "Tag the friend your dog would sleep over with!" (2.18 s) | Card, big: "Tag the friend your dog / would sleep over with 👇"; both dogs happy. | Sunny Biscuit's yard at night |
| 31.22 s (935) | end card | (music fades) | Standard end card, 2.5 s | |

Sound: the game's own yard music (`mods/pawaudio.js` `_render`, place `yard`, sunny: day, then night from the night beat, dawn from the morning, night for the ask), 11 dB under the voice (voice -21.8 LUFS raw, +5.8 dB; music -17.3 LUFS raw, -9.7 dB); the game's discover sting as Noodle comes home (the sound `slHome()` plays); the game's `SFX.pop` when the bowl fills, when the picture pops in and when the paw print comes; `SFX.click` on Say thanks. Mix normalised to -16 LUFS, true peak -1.5.

## Where the facts come from (origin/main b481ab1e; the build checks each)

| On screen / said | Source |
|---|---|
| Help out; Fill Honey's bowl; Water the garden; Make Honey's wish come true | `hp.help_out`, `hp.bowl_aria`, `hp.water_aria`, `hp.wish_aria` (en.json); the capture's strip `#hpStrip` (label "Help out", the three buttons' aria labels); V233.md 3.1; `60_helps.js` `hpStripHTML` |
| The bowl fills with kibble, the can pours on the veggie patch, the Tennis Ball, Honey jumps | V233.md 3.1 (bowl: `bowlArt('Basic Kibble')`; can at `HP_CAN` on the patch's top edge, mirrored; ball: `art('item', 'Tennis Ball')`, their leader `jump` then `happy`); the art is the visit's own (`.hp-bowlart` empty and full, `.hp-can`, `PawArt.item('Tennis Ball')`) |
| "Today I wish for a game of ball" / "Wish come true!" | the capture's wish bubble `#hpWish` before and after; `hp.wish_chip`, `dd.chip_done`; snapshot `hp.w = 1` (ball) |
| Helpers earn a little Bond ("+1 Bond" on the night card) | toasts "Noodle helped out! +1 Bond" after each help (capture); `hp.g_pet_ok` "Honey and Noodle play together. +1 Bond." (the friend's pet toast, capture); V233.md 3.1, 4.1 |
| Tap Sleepover; Noodle packed a toothbrush. See you in the morning! | the visit button "Sleepover" (`hp.sleep_btn`, the capture's `#placeBtns`), then "Sleepover sent"; toast `hp.sleep_sent` (capture: "Noodle packed a toothbrush. See you in the morning!"); V233.md 4 |
| That night a guest in their yard, name tag "Noodle, from Fluffy Button", a pet | the friend's game after the claim: postcard "A sleepover guest!" (`hp.g_title`), the tag `hp.g_tag` (capture: "Noodle, from Fluffy Button"), the guest card "Noodle is sleeping over" with Pet, the pet toast; V233.md 4.1 |
| Home by breakfast, with a diary page | toast `hp.home_toast` (capture: "Noodle is home from the sleepover! +2 Bond. A new page in the diary."); the diary page's lines (capture: "...I slept over at Sunny Biscuit's yard. Their Cozy Cottage was very cosy. Honey showed me the Bird Bath. ... Home by breakfast, of course. ..."); V233.md 4.2 |
| A crayon picture of them both, Share this moment | the PNG the game's share sheet hands over after Share this moment on the diary page (`slShare` -> `shareDog({ from: 'sleep', yard, pal })`, 1080 x 1350, `sh.rec()`: from sleep, pal true, yard true); `sh.moment`; V233.md 4.2; NEWS `nw.v233.sleep` "Send a dog for a sleepover: it comes home with a diary page and a picture" |
| The friend's letter: "Fluffy Button helped out!" / "filled Honey's bowl, watered the garden and made Honey's wish come true." | the friend's mailbox (capture): `hp.l_title`, `hp.l_text`; V233.md 3.2 |
| Say thanks, a paw print back "Thank you for helping!" | the letter's "Say thanks" button (`hp.thanks`), toast "Thank-you note sent!", the send `{ kind: 'note', data: { i: 12 } }`; my mailbox: "A paw print from Sunny Biscuit" / "Thank you for helping!" (`data.fr_notes.12`); V233.md 3.2 |
| No chat, no messages | V233.md 0 (V219.md 0): no typed text leaves the device; helps, sleepovers and thanks are fixed kinds and preset notes (`FR_NOTES` indices) |
| Nothing bad happens; nothing paid | V233.md 4: "My dog **stays in my game all day**" and is home by breakfast; V233.md 0: **No new coins** (Bond, a diary page, a picture and stickers). The Reel shows no coins or prices. |
| Fluffy Button, Sunny Biscuit | made up: the mock's friend names, two Dog Card words each (`DC_WORDS_A/B`, checked in the capture) |
| Live since 26 Nov 00:00 JST; the feature list, the wording rules | `docs/marketing/HANDOFF_MARKETING.md` entries 80 (the GM's v2.33 briefing: helps, sleepovers, letters and Say thanks, Bond, the sticker page, no new coins, "no chat, no messages") and 87 (open since 00:00 JST, launch check passed); V233.md 1 (`HP_FROM = '2026-11-26'`) |

Not said on screen: friends need a cloud account (the Reel makes no claim either way; the caption can say it). The "Helping paws" sticker page (6 stickers) is real (capture: "New sticker: The first sleepover!", "A sleepover guest!", "A thank-you note!") but left out for time.

## Owner's rules: how each holds

1. Noodle big and the star: **569 px wide standing** (checked 550..700), feet on y 1412 on the open grass, 28 px clear of the stepping stones, the dig patch and the bush, the bowl and the ball; Honey behind him on the grass in front of the fence, her top under the washing; the two dogs never closer than 28 px (`apartCheck`). No black or white dog. The garden shot (5.54 to 6.99 s) is a close-up of the can on the veggie patch without dogs: no ground near the patch is big enough for Noodle at his size.
2. The game's yards fill the frame to the bottom in every shot.
3. Every frame (`CHECK=1` and the render): `centreCheck`, `safeCheck`, `apartCheck` (28 px: dogs, cards, the tag, the pills, the bowl, the ball, the picture), words and key art inside x 60..850, y 270..1440, the dogs and our props 28 px clear of the scene's props (`GROUND`) and of the washing, the line's pole and the line's things (`HANG`); every card is at least 262 px tall so it hides the sky's little sparkle (scene 470, 190) whole instead of half. The washing check covers every card with no exception: the picture cards, the "?" card, the name tag pill and the Say thanks pill (fix of 26 Nov 2026, below).
4. Kokoro af_bella 1.1, line + 0.4 s, 0.15 s pauses; the game's yard music 11 dB under the voice.
5. Standard end card, 2.5 s.
6. Only doodledoggo.app (on the end card and on the game's own picture chip); no itch.io, no "breed" as a verb, no "sell", no em dash (the build checks every word).
7. Frozen clock: every moving drawing (Noodle idle, sit, happy, bow, jump; Honey idle, sit, happy, jump) is the game's own animated SVG read off the frozen page clock in the capture (`freezeClock`, `stepClock` at exactly 1000/30 ms from a whole-ms start, `releaseClock`), 30 frames a loop, frame 30 checked equal to frame 0, no other animation on the dog; a run plays loop frame (n minus its first frame) mod 30; every frame is rendered at t = n/30 + 0.0001 (the frame-index nudge); the dogs breathe and sway gently all the time, and the can keeps a small wobble, so no hold is frozen.
8. 33.73 s with the end card.

## Checks (26 Nov 2026)

- `CHECK=1`: all 1012 frames pass; the full render ran the same checks on every frame.
- `checkFrames()` on every run (from the frame before its cut to the frame after the next): **0 doubled frames** in all ten moving runs (medians 0.12..0.28). The big diffs are the cuts: 25.9 (hook to visit), 27.2 and 28.3 (the visit's garden shot in and out), 5.3 (to the sleepover, same yard), 89.7 (to night), 80.1 (to morning), 27.2 (to the letter), 85.4 (to the ask, night), plus each new card's 0.1 s fade-in (2.0..7.4, the cut's next 3 frames) and two in-beat pops (the share picture at 17.58 s, the paw print card at 23.10 s). Off the cuts the largest diff is 4.60 (frame 239: Honey's drawing changes from idle to jump as the ball lands) and 2.01 (frame 278: Noodle idle to happy); everything else off a cut is under 1.4 (the game's own keyframe swaps and the sway). The end card (935..1011) is the standard still card after its fade.
- ffprobe: h264 1080 x 1920, 30/1 fps, 1012 frames, 33.733 s; AAC 44.1 kHz stereo, 33.72 s.

**Fix of 26 Nov 2026 (coordinator: no overlapping the washing either).** The first render let the hook's covered picture and the payoff's share picture cut across the shirts, socks, towel and line. Now the hook and the morning beat use the closer camera (`mzoom`, above): the washing is off the top of the frame, the "?" card and the share picture sit on plain fence boards and open grass, 28 px clear of everything; the payoff picture is bigger (646 x 808, was 540 x 675; its "Share this moment" pill is gone, there is no room for it under the bigger picture); the build's washing check now runs on every card with no exception. Noodle is the same size (569 px standing), the same timing, lines and audio (mix.wav unchanged, md5 checked); only frames 0..112 and 480..623 were rendered again (`FRAMES`). `CHECK=1`: all 1012 frames pass; checkFrames as above.
- Stills looked at at 1x (the night guest with the tag, the share picture payoff, the visit's bowl shot); 12-still contact sheet in the session scratchpad (`sleepover-contact-sheet.jpg`, not committed).

## Changed from the brief

- Hook: "Noodle's first sleepover! You won't guess what came home with him." (85.6); the brief's examples scored 34.2..47.0.
- The hook and the payoff are shot closer than the other beats, so the picture cards stay off the washing line.
- The visit is three quick shots under one voice line (bowl, garden, wish); the garden shot has no dog (see rule 1).
- The night is the friend's own yard (their game shows the guest), so Noodle sits there as the guest; my side never shows him away (he stays in my game all day, V233.md 4).
- The letter and the paw print are shown on a mailbox card (the game's mailbox drawing on it) in Noodle's yard: by the mailbox itself there is no room for Noodle at his size between the house, the stepping stones and the veggie patch.
- The letter's text and the toasts are the game's words set on our cards (the game's own screens are too small to read at Reel size); the share picture is the game's PNG.
- The Helping paws sticker page is not in the Reel (time).

## Still to do (only when the owner asks)

- The cover, the captions (Instagram, TikTok, YouTube Shorts, X; doodledoggo.app only) and a RedNote cut, after the owner approves this English cut.

## RedNote cut (26 Nov 2026)

The owner approved the English cut ("Good") and asked for the RedNote version. Only the MP4 is made (no cover, no captions). The English MP4 is unchanged (md5 checked after the RedNote render).

| File | What |
|---|---|
| `doodle-doggo-sleepover-rednote.mp4` | RedNote / 小红书: 1080 x 1920, 30 fps, h264 + AAC stereo, **37.80 s (1134 frames)**: 35.30 s + the RedNote end card for 2.5 s (the logo, 治愈系蜡笔狗狗游戏 and only "搜 Doodle Doggo App", centred at 540, 960). 6.6 MB. |
| `vo_sleepover_zh.json` | The Mandarin voice (`../friends_reel/vo_friends_zh.py`, Kokoro v1.1-zh, zf_073 1.0x); Noodle is 面条 in the voice, as in the earlier RedNote cuts. |

Remake: `PAW_LANG=zh-Hans node capture_sleepover.js <main> <caps_zh>`; the voice with `VO_LINES=brand/instagram/launch/sleepover_reel/vo_sleepover_zh.json python3 brand/instagram/launch/friends_reel/vo_friends_zh.py <kokoro dir> <vo_zh> zf_073 1.0`; then `REDNOTE=1 CAPS=<caps_zh> node build_sleepover.js <work_zh> <vo_zh>`. The capture adopts the dogs in English (the picker's labels), then switches the game to zh-Hans and reloads with the save, as `visitor_reel` does.

**Names as the game shows them in zh-Hans.** The friend names are Dog Card words, and zh-Hans shows them in Chinese: Sunny Biscuit is **阳光饼干** and Fluffy Button is **毛茸茸纽扣** (`data.dc_words_a/b`; the game puts a zero-width space between the two words, which draws nothing, and the cards leave it out). The dogs' own names stay Latin, as the game shows them: **Noodle**, **Honey**.

| Beat | Voice (zf_073 1.0x) | Card (the game's zh-Hans words where it has them) |
|---|---|---|
| hook | 面条第一次去好友家过夜！猜猜它带回了什么？ | 面条第一次去好友家过夜！ / 猜猜它带回了什么？ (the covered picture) |
| visit | 在阳光饼干家帮帮忙：添饭，浇水，帮狗狗实现心愿！ | 帮帮忙 (`hp.help_out`) / 给Honey的碗添满饭, 给菜园浇水, 帮Honey实现心愿 (the strip's own labels) / 今天的小心愿：玩一局球 → 心愿实现啦！ (the bubble) |
| sleep | 再点去过夜，面条带上了牙刷！ | 去过夜 (`hp.sleep_btn`) / Noodle带上了牙刷。明早见！ (`hp.sleep_sent`) |
| night | 晚上它是好友家的小客人，挂着名牌。摸摸面条！ | 来过夜的小客人！ (`hp.g_title`) / Honey和Noodle一起玩。+1亲密度。 (`hp.g_pet_ok`); the tag 毛茸茸纽扣家的Noodle (`hp.g_tag`) |
| morning | 早饭前就回家啦，带回一页日记和一幅画！ | 当然啦，早饭前就回家了。 (`hp.d_back`) / 日记里多了一页， (`hp.home_toast`) 还有一幅画！ (`nw.v233.sleep`: 一页日记和一幅画); then the zh share picture, 700 wide |
| letter | 阳光饼干收到一封信，就点了道谢。 | 毛茸茸纽扣来帮忙啦！ (`hp.l_title`) / 给Honey的碗添满了饭、给菜园浇了水和帮Honey实现了心愿。 (`hp.l_text`, the captured letter); the 道谢 button (`hp.thanks`); then 阳光饼干留下的爪印 (`fr.note_title`) / 谢谢你来帮忙！ (`data.fr_notes.12`) |
| thanks | 不聊天，不发消息，只有狗狗帮狗狗。 | 不聊天，不发消息， / 只有狗狗帮狗狗。 |
| ask | 你家狗狗想去谁家过夜？评论区告诉我！ | 你家狗狗想去谁家过夜？ / 评论区告诉我👇 |

The build checks every zh-Hans key above against `game/i18n/zh-Hans.json` and the zh capture (the toasts, the tag, the letters, the diary, the bubble, the strip), and stops if one changed. The game has no zh line for "no chat, no messages": 不聊天，不发消息 says what V233.md 0 says (helps, sleepovers and thanks are fixed kinds and preset notes; no typed text leaves the device), like the Friends RedNote cut's 没有聊天.

**The chip.** The share picture (and the hook's covered copy of it) is cut just above its "Doodle Doggo · doodledoggo.app" chip: RedNote shows y 0..1254 of the 1080 x 1350 PNG (`58_share.js` SH_LAY feed chip at y 1290, 58 px tall, top 1261; the build stops if it moved), as in the Share my dog RedNote cut. The picture keeps its zh line 穿戴秋日围巾的腊肠犬.

Subtitles: the voice's words in pills of at most 14 characters, LXGW WenKai, at y 1560 under Noodle on the open grass (in the garden shot at y 900, over the house wall, clear of the veggie patch, the stones and the washing). Full frame, no safe zone: everything in front, and each scene window with it, 85 px right; a 50 px margin. All the English cut's rules hold: no overlaps (the washing check on every card, the pills, the tag and the subtitles, including the garden shot), text centred in its box, Noodle 569 px wide standing, dogs 28 px apart, the frozen-clock drawings, the 0.0001 frame-index nudge, the checks on every frame.

Anti-ban: no QR, link, domain, @ or handle; no other app or platform; nothing about posting or sending; the ask is a comment ask. The build stops on any of: a URL or `www.` / `.app` / `.com`, `@`, Instagram, YouTube, TikTok, itch, 微信, 朋友圈, QQ, 微博, 抖音, 小红书, WhatsApp, 链接, 网址, 官网, 二维码, 扫码, 下载, 私信我, 加我, 主页链接, 戳, 发帖, 发到, 发布到, 快拍, 帖子, tag, INS/ins, in the cut's words, the subtitles, the voice and the captured game text it uses.

Sound: the same game music and effects; voice -25.5 LUFS raw (+9.5 dB), music -17.5 LUFS raw (-9.5 dB), 11 dB under.

Checks: `CHECK=1`: all 1134 frames pass; the render ran the same checks. `checkFrames()`: **0 doubled frames** in all ten moving runs (medians 0.13..0.39); off the cuts the only diff over 2.5 is 3.81 at frame 268 (Honey's drawing from idle to jump as the ball lands); the rest are the game's keyframe swaps and the subtitles changing (under 2.5). The end card (1058..1133) is the still RedNote card after its fade. ffprobe: h264 1080 x 1920, 30/1 fps, 1134 frames, 37.80 s; AAC 44.1 kHz stereo, 37.80 s. Stills looked at at 1x (the night guest with the zh tag, the payoff with the chip cut off); 12-still contact sheet in the scratchpad (`sleepover-rednote-contact-sheet.jpg`).

Render notes: the first RedNote renders crashed because the disk was full (ENOSPC). Old trial footage (`fr/footage_try2..4`) and the gift Reel's rendered frames (`gift/work_en/f`, `gift/work_zh/f`) were removed from the session scratchpad to make room, and the cut was rendered again in full. The build now also retries a refused screenshot and has `NOENC=1` (render `FRAMES` without encoding).
