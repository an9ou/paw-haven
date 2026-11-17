# Gift-code launch Reel: v2.26-v2.29 + the follower gift codes (18 Nov 2026)

One Reel for the 18 Nov 2026 launch (00:00 JST = 17 Nov 15:00 UTC): the four new features of v2.26-v2.29 and the follower gift codes, in two cuts. **Made, waiting for the owner; nothing posted.** Files in `brand/instagram/launch/gift_reel/`. Captions (with the `{CODE_IG}` / `{CODE_YT}` / `{CODE_X}` / `{CODE_RN}` placeholders): `docs/marketing/captions/GIFT_CODE_CAPTIONS.md`.

**No code anywhere in the videos or these files.** The video says "the code is in the caption" (spoken in the hook and the ask, on screen in the hook card and the red ask pill); the game's "Have a code?" sheet is shown with its field EMPTY, a neutral `YOURCODE` placeholder (English) or nothing (Chinese). The gift card text the capture made with a made-up key is not used, and the build stops if any capture shows a code line.

| File | What |
|---|---|
| `doodle-doggo-gift-code.mp4` | English: Instagram Reels, YouTube Shorts, X. 1080 x 1920, 30 fps, AAC stereo, 34.98 s: 32.48 s of Reel, then our standard end card for 2.5 s (the logo, doodledoggo.app, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp with icons), music fading under it. Fast pace (owner, 13 Nov): each card stays up for its spoken line + 0.4 s, 0.15 s between beats; Noodle at 1.1x. |
| `doodle-doggo-gift-code-rednote.mp4` | RedNote / 小红书: the same Reel in Simplified Chinese, 43.56 s (41.06 s + the RedNote end card for 2.5 s: the logo, 治愈系蜡笔狗狗游戏 and only "搜 Doodle Doggo App", centred at 540, 960). Every word from the game's zh-Hans text where the game has it; the game's screens captured in Chinese (PAW_LANG=zh-Hans); Noodle in Mandarin (Kokoro zf_073 1.0x); subtitles of at most 14 characters; LXGW WenKai; full frame (no safe zone). No QR, link, domain, handle or other platform name anywhere (the build checks its words against the anti-ban list). |
| `gift-cover.jpg` | English cover (9:16), its own design: the Home Yard by day, "FREE GIFT" in big red on a cream card, the pill "the code is in the caption", Noodle begging big in the Follower Star Bandana, the Paw-Print Pennant on the grass, a coin chip and the wrapped present, the logo on its own card. Key content inside the 1:1 crop (y 420..1500), the logo inside 4:5. |
| `brand/rednote/rednote-19-gift-code.jpg` | RedNote cover (3:4, 1080 x 1440): the same design with "送你一份礼物" and "兑换码就在文案里". |
| `capture_gift.js` | The clean captures from the release build (below). |
| `build_gift.js` | Remake (below). Every frame runs `centreCheck()`, `safeCheck()` (English) and `apartCheck()` incl. the scene's own props (the bushes, the tree, the planter, the sofa, lamp, bed and kitchen, the lamp post and bench at the pier, the board and lamps in the square: `KEEP` in scene units), keeps every word and key art inside x 60..850, y 270..1440 (English), stands Noodle, Biscuit, the pennant and the present on the scene's floor, and stops if any quoted game text below changed on the release branch. `CHECK=1` runs every frame's checks without screenshots. |
| `vo_gift.json`, `vo_gift_zh.json` | Noodle's lines (English, Mandarin). |

## The hook

`ig-reel` hook scoring (`hookscore.py`), 14 options; the winner is the owner's example, which tied for the top score and is true on the launch day: **"Free gift for you today! The code is in the caption."** 81.4 STRONG (length 100, front-load 100, address 100, specificity 75, stakes 70). "Free bandana for your dog..." scored the same but the gift is more than the bandana; options opening with "stop scrolling" hit the dealbreaker (61.6 to 69.4).

## Script (English, Noodle, Kokoro af_bella 1.1x)

| Starts | Beat | Noodle says | On screen | Scene (the game's, release build) |
|---|---|---|---|---|
| 0.10 s | hook | "Free gift for you today! The code is in the caption." (2.76 s) | Card at frame 1: "Free gift / for you today!" + red "The code is in the caption." Noodle begs, big, in the Follower Star Bandana, at the wrapped present on the grass. | Home Yard by day, autumn, x 600..937: the fence, the hills, the sun, the autumn tree |
| 3.41 s | visit | "Big update! Neighbourhood dogs visit your yard while you're away." (3.35 s) | Card "Visitors in the yard!" "Neighbourhood dogs visit / while you're away" small "meet 20 in the Visitors Book"; the game's line "Biscuit came by and tried the Tug Post!" on a pill; Noodle sits on the left, Biscuit the beagle (the game's own visitor drawing) on the right, apart. | Home Yard, x 610..947 |
| 7.31 s | proj | "Four town projects to build. The lighthouse shines at night!" (3.28 s) | A narrower card on the left: "Town projects / 4 builds. / The lighthouse / shines at night!"; on the right, out at sea, the game's new lighthouse lit with its beam; Noodle sits on the boardwalk. | Lighthouse Pier at night, all four projects built, x 549..886 |
| 11.14 s | stories | "Neighbours send little stories. And Bond stars past Bond ten!" (3.56 s) | Card "Stories and stars" "Neighbours send you / little stories" small "plus Bond stars past Bond 10"; the game's own letter "A woolly idea" from Mrs. Plum next door (captured); Noodle sits on the floor. | Cozy House living room, x 600..937: the lamp, the wall card, the kitchen, the bed |
| 15.25 s | story | "And Gerald's storybook: eight chapters!" (2.17 s) | Card "Story mode" "Gerald's storybook, 8 chapters"; the game's own prologue scene PLAYING in a cream frame (115 frames at 30 a second: Noodle walks the yard, Gerald comes over, "Every good book needs a hero. Gerald looked around the yard, and there was Noodle."); Noodle sits on the left. | Town Square by day with the builds, x 360..697 |
| 17.97 s | gift | "Your gift: a Follower Star Bandana, a Paw-Print Pennant and a hundred coins!" (4.54 s) | Card "Your free gift / Follower Star Bandana / Paw-Print Pennant / + 100 coins" small "code-only, never sold"; the game's Paw-Print Pennant prop stands on the grass, a coin chip, Noodle sits in the bandana. Treasure sting. | Home Yard, x 600..937 |
| 23.06 s | redeem | "Open Settings, then Have a code. It needs the free cloud save." (3.77 s) | Card "How to use it / Settings > Have a code? / (phone: More)" small "needs the free cloud save"; the game's own "Have a code?" sheet (Gift code field EMPTY, placeholder YOURCODE, "Use code"); Noodle gives a paw. | Cozy House living room, x 600..937 |
| 27.38 s | ask | "One code per player, until December seventeenth. Grab yours in the caption!" (4.50 s) | Card "One code per player, / until 17 Dec" + red pill "grab your code in the caption". Noodle happy with hearts, big. | Home Yard, x 575..912 |
| 32.48 s | end card | (music fades) | Standard end card (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`), 2.5 s. | |

Mandarin (RedNote, `vo_gift_zh.json`): 今天送你一份免费礼物！兑换码就在文案里。 / 大更新！你不在的时候，邻居家的狗狗会来院子里玩。 / 四个小镇项目等你来建。夜里灯塔会亮起来！ / 邻居们会写信讲小故事。亲密度10以后，还有亲密度之星！ / 还有杰拉德的故事书，一共八章！ / 你的礼物：粉丝星星三角巾、爪印小旗，还有一百金币！ / 打开设置，点有兑换码吗。需要免费的云存档账号。 / 每位玩家只能用一个兑换码，十二月十七日截止。快去文案里领吧！ Cards: 送你一份 / 免费礼物！(兑换码就在文案里); 院子里来客人啦！; 小镇项目; 故事和星星; 故事模式; 你的免费礼物 (粉丝星星三角巾, 爪印小旗, 还有100金币; 只能用兑换码得到，从不出售); 怎么用 (设置 > 有兑换码吗？ (手机：更多) 需要免费的云存档账号); 每位玩家只能用一个，12月17日截止 + 去文案里领兑换码吧. The RedNote cut's scene windows move with its front (85 px right), and its subtitles sit lower in the living room (under the bed) and the square (between the board and the tub) so they touch no prop.

**Smoother storybook (owner, 17 Nov 2026: "bit laggy").** The first scene run was taken with `sc.seek(ms)` and a screenshot while the page clock kept running, so every frame landed 15-200 ms late by a different amount (motion between frames 14..950, jumps up to 12x). `capture_gift.js` now steps the page's own clock: `performance.now()` and `requestAnimationFrame` run on a virtual clock that moves only between screenshots, and every CSS animation is paused at its age on it, so frame n is exactly 4100 + n x 33.33 ms of the scene. Only the English cut's storybook beat was re-rendered (`FRAMES=450-545`, the original sound kept); in it, motion between frames is now even (276..610, jumps at most 1.3x) with no duplicate frames. RedNote cut (owner approved the English one, 17 Nov 2026: "Very good"): the Chinese scene run re-captured the same way and only frames 600-715 re-rendered, the original sound kept. It also had a second cause: its beat starts at 20.30 s, where `lt*30` lands a hair under whole numbers, so `Math.floor` showed one frame twice and skipped the next (31 doubled frames in the run); `build_gift.js` now adds 1e-4 before flooring (the English cut's numbers are unchanged). Steady run 622-709: 0 doubled frames, motion 206..645, jumps at most 1.31x.

Music: the game's own yard music (`mods/pawaudio.js`) about 11 dB under the voice, the discover sting at the start and the treasure sting on the gift; ticks on cuts; loudness -16 LUFS.

**Art.** All from the release branch (origin/claude/release-26-29 1fa38495): Noodle (`PawArt.dog('dachs')` with `outfit: { neck: 'Follower Star Bandana' }`: beg, sit, happy, paw), the Paw-Print Pennant (`PawArt.prop('prpennant')`), the wrapped present (`PawArt.FRIENDS.wrap(0)`), the coin icon, Biscuit (the game's own drawing in the yard, `#visitorG`). The backgrounds are the game's `svg.world` as the release build draws each place (our own dog, the effects and the interactive yard items, i.e. the dog house, mailbox and bowl, left out, as in the scenes `PawArt.scene` draws), autumn, rendered at 3.2x. Mrs Plum's letter, the "Have a code?" sheet and the prologue scene frames are the game's own screens, captured clean (the close cross, the Skip button and the dev button hidden). Every fill is the game's own.

## Where the facts come from (release branch; the build checks each)

| On screen / said | Source |
|---|---|
| Launch 18 Nov 2026 (all four) | `NEWS_V226`..`NEWS_V229` `date: '2026-11-18'` (`game/src/49c_news.js`); HANDOFF_MARKETING 69 |
| Visitors in the yard! Neighbourhood dogs visit while you're away; 20 in the Visitors Book | `nw.v226.title`, `nw.v226.come`, `nw.v226.book`; V226.md 1-3 |
| "Biscuit came by and tried the Tug Post!" | `yv.line_toy` with the visit the capture got (seed `reel2`: Biscuit the beagle, the Okafors on Elm Row, with the Tug Post; `facts.json`); on the captured visitor card |
| Four town projects, the lighthouse shines at night | `nw.v227.four` (Four builds: a dog fountain, a bandstand, Sakura Avenue and a lighthouse), `nw.v227.fun` ("a light at night"); V227.md 2; the pier scene grabbed at night with all four built (`.pr-glow .pr-beam`) |
| Neighbours send little stories; Bond stars past Bond 10 | `nw.v228.stories`, `nw.v228.stars`; the captured letter `st.plum_t0` "A woolly idea" |
| Gerald's storybook, 8 chapters | `nw.v229.book` ("8 chapters to play at your own pace"); the captured scene is `prologue` (V229.md, 12.5 s), 4.1 to 7.9 s |
| Follower Star Bandana, Paw-Print Pennant, code-only, never sold | `data.clothes.follower_star_bandana.n` / `.perk` ("Only from a code."), `data.hm_decor.paw_print_pennant.n` / `.story`; `promo: true` in `00_core.js` / `03_yard.js` |
| + 100 coins, one code per player, until 17 Dec | the owner's code facts (GM, 16 Nov 2026): the same gift on all four codes, one of the four per cloud-save account, valid 18 Nov 00:00 to 17 Dec 23:59 JST |
| Settings > Have a code? (phone: More), needs the free cloud save | `settings.title`, `pm.title`, `fw.more`, `pm.guest` ("Gift codes are for players with the free account"); `pmSettingsHTML()` in Settings (`20_settings_dev.js`) |

Changed from the brief: "Gerald cuts the ribbon" (true, `nw.v227.ribbon`) is not in the video (kept short); the Visitors Book is a small line; "neighbourhood" is the game's spelling. The video's code sheet shows a neutral `YOURCODE` and no real code (the game's own example is now "ABC123"; the launch codes are 6 characters, 17 Nov 2026). Noodle narrates (the launch's mascot), so the README's "different dog each time" rule was not applied; Biscuit the beagle is the second dog.

## Remake

```
git worktree add --detach <rel> origin/claude/release-26-29 && cd <rel> && node game/build.js && node game/harness.js merged
NODE_PATH=$(npm root -g) node brand/instagram/launch/gift_reel/capture_gift.js <rel> <caps_en>
PAW_LANG=zh-Hans NODE_PATH=$(npm root -g) node brand/instagram/launch/gift_reel/capture_gift.js <rel> <caps_zh>
VO_LINES=brand/instagram/launch/gift_reel/vo_gift.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo_en> af_bella 1.1
VO_LINES=brand/instagram/launch/gift_reel/vo_gift_zh.json PYTHONPATH=<jieba-0.42.1 sdist> python3 brand/instagram/launch/friends_reel/vo_friends_zh.py <kokoro dir> <vo_zh> zf_073 1.0
ART_ROOT=<rel> CAPS=<caps_en> NODE_PATH=$(npm root -g) node brand/instagram/launch/gift_reel/build_gift.js <work_en> <vo_en>
REDNOTE=1 ART_ROOT=<rel> CAPS=<caps_zh> NODE_PATH=$(npm root -g) node brand/instagram/launch/gift_reel/build_gift.js <work_zh> <vo_zh>
```
`ONLY=cover` writes the cover, `ONLY=stills` key frames (`TS=a,b,...`), `FRAMES=a-b` re-renders only frames a..b and encodes again with the same sound, `CHECK=1` runs all checks without screenshots. The captures switch the four features on only in the test page (the harness prefs `yvTest`, `prTest`, `stTest`, `smTest`, page date 20 Nov 2026); the branch is not changed. The visit is seeded (`VISITOR=biscuit:Tug Post` by default), and the scene run is `SEQ=prologue:4100-7900`. The Kokoro model files are never committed.
