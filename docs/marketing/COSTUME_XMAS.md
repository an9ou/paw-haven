# "Stop the video to dress Noodle" Christmas Reel

Made 15 Nov 2026, made a seamless loop with no end card and given a RedNote cut on 16 Nov 2026 (owner: "Not Halloween, i want similar one but Christmas version"; the brief first asked for a Halloween remake of the October Reel, then changed to Christmas, so no Halloween version was made). English only. Made, waiting for the owner: nothing posted. The owner decides the posting date. Captions: `docs/marketing/captions/COSTUME_XMAS_CAPTIONS.md`.

Files in `brand/instagram/launch/costume_reel_xmas/`:

| File | What |
|---|---|
| `doodle-doggo-dress-noodle-christmas.mp4` | 1080 x 1920, 30 fps, AAC audio, 31.4 s (943 frames), a **seamless loop with no end card** (owner, 16 Nov 2026: "It is a loop video, so no need end card"): 41 looks, each falls once per loop, the last frame flows into the first and the music is crossfaded end into start. |
| `doodle-doggo-dress-noodle-christmas-rednote.mp4` | The RedNote cut (owner, 16 Nov 2026): the same loop, every word in Simplified Chinese, LXGW WenKai. See RedNote below. |
| `brand/rednote/rednote-18-xmas-dress.jpg` | The RedNote cover, 3:4 (1080 x 1440): the English cover's design with the Chinese hook 暂停视频 / 给Noodle换装！, the 完美合身！ stamp and 你能停在完美合身吗？. |
| `xmas-dress-cover.jpg` | The designed cover (not a frame): "Stop the video / to dress Noodle!", Noodle big in the Father Christmas Suit with the "perfect fit!" stamp, four costume cards around him (Penguin Suit, Reindeer Antlers, Nutcracker Jacket & Hat, Snowman Suit, the game's own item art), "can you get a perfect fit?", the logo. Key content inside the 1:1 crop (y 420..1500), the logo inside 4:5. |
| `build_xmas.js` | The build script (below). |

## What is in it

- **Like the October Halloween Reel** (`COSTUME_REEL.md`): Noodle sits still and each costume falls straight down, fast (0.65 s from the top edge to the bottom), right through him, one every 23 frames (0.77 s, so the loop is a whole number of frames). It fits him on **one frame only**, and that frame shows a gold "perfect fit!" stamp just above his head. Pause a frame early or late and it misses.
- **Rebuilt from today's art** (origin/main 980ebc71, v2.25.2): nothing reused from the October renders. Noodle is `PawArt.dog('dachs', { pose: 'sit' })`, 740 px wide, on the snow below the fence's foot. Each falling costume is cut out of the game's own drawing of Noodle wearing that look (the look minus plain Noodle, pixel by pixel, with a clean-up of stray crayon lines; the colours always come from the drawing of the whole look, so pieces the art hides stay hidden).
- **Scene:** the game's Home Yard on a snowy winter night (`PawArt.scene('yard', { season: 'winter', time: 'night', weather: 'snow' })`), with four Winter Market yard decorations as the game draws them at night (props, sizes and tint from `game/src/03_yard.js`): the Felt Fir Tree by the fence, and the Present Pile, the lit Star Lantern and the Yard Snowman in the snow at the bottom, at spots a player can move them to. No game UI.
- **On screen the whole time:** a card "Stop the video to dress Noodle 🎄 / comment what Noodle got 👇", and a label with the nearest costume's name (a combination shows its name and its pieces with the game's exact item names, e.g. "The Full Reindeer / Reindeer Antlers + Very Ugly Sweater + Jingle Bell Collar").
- **Checks on every frame** (the build stops on any): `centreCheck()`, `safeCheck()` and `apartCheck()` (28 px) from `brand/instagram/launch/centre_text.js` over the header, the label, the stamp, Noodle (with the costume he wears on the fitting frame) and each decoration; words, cards and Noodle inside x 60..850, y 270..1440. The falling costume crosses the cards on purpose (that is the game). The item list is checked against main: every wearable with `fest: 'winter'`, `'snow'` or `'lights'`, the Winter Market clothes table and the v2.8 winter outfits (`WN_OUTS`) must be in it, and nothing Halloween or New Year.
- **No end card: a seamless loop** (owner, 16 Nov 2026; the exception to the end-card rule in `README.md`). The falls wrap round the loop point, so a costume that leaves the bottom at the end comes back in at the top of the first frame; checked: the last and first frames match the rest of the timeline, and the audio join steps less than a normal sample step. The website and handles are in the captions.
- **Sound:** the game's own music engine (`mods/pawaudio.js`), the Winter Market's night music (`fmarket`, fest `winter`), rendered 2.2 s longer and crossfaded end into start (as `costume_reel/build_costumes.js`), plus a quiet crayon whoosh as each costume passes Noodle (wrapping round the loop point); -16 LUFS.

## The 41 looks (in the video's order after the first, shuffled; the Father Christmas Suit opens)

**Every Christmas and winter wearable on its own (18)**, and where players get it:

| Item | Slot | How to get it in the game |
|---|---|---|
| Father Christmas Suit, Little Elf Outfit, Gingerbread Pup Suit, Snowman Suit, Polar Bear Hood, Penguin Suit, Puffer Jacket, Nutcracker Jacket & Hat, Snowflake Wings | body | Winter Market only, 1 to 26 Dec (Japan date), every year |
| Jingle Bell Collar | neck | Winter Market only, 1 to 26 Dec |
| Very Ugly Sweater (body), Reindeer Antlers (head), Snowflake Snood (neck) | | Baker Bea's Winter Stall in the Square (Snow Days, 1 Dec to the end of Feb) and the Winter Market |
| Ugly Sweater Rosette | neck | the prize of the Ugly Sweater Contest (Winter Lights, 1 to 25 Dec) |
| Pom-pom Beanie (head), Knit Winter Sweater (body) | | Bow-Wow Boutique, all year |
| Cozy Hoodie (body) | | Mrs. Plum's gift for good care, all year |
| Knit Scarf (neck) | | Mrs. Plum's gift by post at Bond 3, all year |

**Christmas and winter combinations (23):** The Full Reindeer (Reindeer Antlers + Very Ugly Sweater + Jingle Bell Collar), Sweater Champion (Very Ugly Sweater + Ugly Sweater Rosette), Champion Reindeer (Reindeer Antlers + Very Ugly Sweater + Ugly Sweater Rosette), Jingle All the Way (Reindeer Antlers + Jingle Bell Collar), Gingerbread Reindeer (Reindeer Antlers + Gingerbread Pup Suit), Jingle Gingerbread (Gingerbread Pup Suit + Jingle Bell Collar), Gingerbread in a Beanie (Pom-pom Beanie + Gingerbread Pup Suit), Prize Gingerbread (Gingerbread Pup Suit + Ugly Sweater Rosette), Ski Day (Pom-pom Beanie + Puffer Jacket), Puffer Reindeer (Reindeer Antlers + Puffer Jacket + Jingle Bell Collar), Snow Angel (Snowflake Wings + Snowflake Snood), Flying Reindeer (Reindeer Antlers + Snowflake Wings), Cosy Night In (Pom-pom Beanie + Knit Winter Sweater + Knit Scarf), Snowflake Sweater (Knit Winter Sweater + Snowflake Snood), Hoodie Reindeer (Reindeer Antlers + Cozy Hoodie), Cozy Day (Cozy Hoodie + Knit Scarf), Snow Day (Pom-pom Beanie + Snowflake Snood), Jingle Santa (Father Christmas Suit + Jingle Bell Collar), Prize Penguin (Penguin Suit + Ugly Sweater Rosette), Snowman in a Snood (Snowman Suit + Snowflake Snood), Polar Bear in a Scarf (Polar Bear Hood + Knit Scarf), Nutcracker Champion (Nutcracker Jacket & Hat + Ugly Sweater Rosette), Jingle Elf (Little Elf Outfit + Jingle Bell Collar).

Combinations never put a hat on a costume that has its own head piece (the game takes the hat off then: Father Christmas, Elf, Snowman, Polar Bear, Penguin, Nutcracker); the build refuses such a combination.

**Left out:** the Year of the Sheep Hood (`fest: 'newyear'`, a New Year 2027 prize, not Christmas). No Halloween items. Non-wearables from the Winter Market (decorations, beds, toys, treats) are not clothes; four decorations dress the scene.

## Rebuild

```
git -C <repo> worktree add <scratch>/main_wt origin/main     # today's art
ART_ROOT=<scratch>/main_wt NODE_PATH=$(npm root -g) node brand/instagram/launch/costume_reel_xmas/build_xmas.js <workdir>
```
About 6 minutes. `REDNOTE=1` makes the RedNote cut (and with `ONLY=cover` the RedNote cover). `ONLY=sprites` writes a check sheet of every look (the cut-out on plain Noodle, `s*.png`, next to the game's own drawing, `g*.png`); `ONLY=stills` key frames (`TS=a,b,...`); `ONLY=cover` the cover; `FRAMES=a-b` re-renders only those frames and encodes again with the same music (owner's rule: re-render only the changed part); `CHECK=1` runs every frame's checks without rendering; `DEBUG=1` outlines the decorations.

## Posting (owner decides the date)

Instagram: "+", Reel, upload the `.mp4`, cover `xmas-dress-cover.jpg`, keep "Original audio", paste the caption.

## RedNote (owner, 16 Nov 2026)

`doodle-doggo-dress-noodle-christmas-rednote.mp4` + cover `brand/rednote/rednote-18-xmas-dress.jpg`, caption in `captions/COSTUME_XMAS_CAPTIONS.md` (RedNote section). Every word on screen in Simplified Chinese: 暂停视频给Noodle换装🎄 / 评论区说说Noodle换到了什么👇, the stamp 完美合身！, and each label with the game's own zh-Hans item names (`game/i18n/zh-Hans.json` on main, checked by the build), e.g. 圣诞老人装, 胡桃夹子外套和帽子, 驯鹿鹿角; combinations get a natural Chinese name with their parts in the game's words, e.g. 全套驯鹿 / 驯鹿鹿角 + 超丑萌毛衣 + 铃铛项圈. LXGW WenKai. No safe zone (the cards run across the frame with 60 px margins); the centring and no-overlap checks stay. A loop, so no end card: nothing on screen is a QR, link, domain, handle or platform name (the build refuses the off-platform words), and "搜 Doodle Doggo App" is in the caption. Combination names: The Full Reindeer 全套驯鹿, Sweater Champion 毛衣冠军, Champion Reindeer 冠军驯鹿, Jingle All the Way 一路响叮当, Gingerbread Reindeer 姜饼驯鹿, Jingle Gingerbread 叮当姜饼, Gingerbread in a Beanie 戴毛线帽的姜饼, Prize Gingerbread 得奖姜饼, Ski Day 滑雪日, Puffer Reindeer 羽绒驯鹿, Snow Angel 雪天使, Flying Reindeer 会飞的驯鹿, Cosy Night In 宅家暖冬夜, Snowflake Sweater 雪花毛衣, Hoodie Reindeer 连帽衫驯鹿, Cozy Day 暖暖的一天, Snow Day 下雪天, Jingle Santa 叮当圣诞老人, Prize Penguin 得奖企鹅, Snowman in a Snood 围脖雪人, Polar Bear in a Scarf 围巾北极熊, Nutcracker Champion 冠军胡桃夹子, Jingle Elf 叮当小精灵. The Winter Market opens 1 Dec: posting from late November works ("opens 1 December"); if posted on or after 1 Dec, change that line to "is open until 26 December".
