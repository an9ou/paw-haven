# "Pick a coat" Reel: stop picking the yellow Lab

Today's idea from `VIRAL_REEL_IDEAS.md` (9 Nov 2026, hook score 94.8): pause and pick 1 of 4 coats. The news behind it: v2.23 / v2.23.1, players pick the coat when they adopt a starter dog, and puppies inherit the genes. Fox red Labrador and dark golden Golden Retriever are new in v2.23.1. No black or white dog is a pick (owner rule, 1 Nov 2026). English only, one video for every platform. **Approved by the owner (9 Nov 2026). Not posted anywhere.**

| File | |
|---|---|
| Video | `brand/instagram/launch/coat_reel/doodle-doggo-pick-a-coat.mp4` (24.0 s, 1080 x 1920, 30 fps, AAC stereo; ends on our standard end card since 9 Nov 2026) |
| Script | `brand/instagram/launch/coat_reel/build_coat.js`, voice lines `brand/instagram/launch/coat_reel/vo_coat.json`, picker capture `brand/instagram/launch/coat_reel/capture_picker.js` |
| Cover | `brand/instagram/launch/coat_reel/coat-cover.jpg` (1080 x 1920, its own design and not a frame of the Reel: the hook card, the four numbered dogs with their coat names, "PICK 1 · 2 · 3 · 4", the NEW sticker. All of it sits inside the 1:1 profile-grid crop (y 420 to 1500), and the logo inside the 4:5 grid crop) |
| RedNote video | `brand/instagram/launch/coat_reel/doodle-doggo-pick-a-coat-rednote.mp4` (30.4 s, 1080 x 1920, 30 fps, everything in Simplified Chinese, ends on the RedNote end card with the QR code) |
| RedNote cover | `brand/rednote/rednote-12-coats.jpg` (1080 x 1440, 3:4: the middle of the Chinese cover) |

The art is the game's own. The coats come from the starter presets the adoption colour picker uses (`STARTER_COATS`, `starterCoats`, `starterEyes` in `game/src/10_sex_age_genes.js`). Names and colours come from `mods/genes.js` `phenotype()`, and each dog is drawn the way the game draws that dog (`PawArt.dog(key, { coat, seed: hashId(id) })`). The collie's id is picked the same way `starterIdFor()` does it, so its merle eye roll really gives odd eyes (one blue, one brown). The Chocolate Lab has the game's amber eyes (b/b). The yellow Lab is the game's default Lab. Every frame passes `centreCheck()`, `safeCheck()` (everything inside x 60..890, y 270..1440) and `apartCheck()`. The last frame is the same as the first, so the Reel loops.

Owner, 9 Nov 2026: make the news explicit. Picking the coat when you adopt a new dog is new in the game (v2.23, 7 Nov; more coats in v2.23.1, 8 Nov). A pink crayon sticker **NEW! pick your dog's coat** sits between the top card and the dogs from the countdown to the loop, and the news line was re-voiced.

Owner, 9 Nov 2026 (second ask: "more informative to audiences"): the news line was replaced by two beats.
- **A, the coat grid.** Every dog that has a choice of coat (34 of the 40), in the game's dog order and drawn with the game's art. Each dog cycles through its own starter coats every 0.4 s, staggered so the grid shimmers. The card reads **134 coats / 34 of 40 dogs have a choice**. Both numbers are counted by the build from `starterCoats()` on main, and it prints them: 40 dogs, 134 coats including each dog's default coat. Six dogs have one coat only (Samoyed, Japanese Spitz, Westie, Bichon, Maltese, Bernese), so the line says "almost every dog", not "all dogs". Some coats in the grid are black or white, but no black or white dog is singled out or enlarged.
- **B, the real adoption colour picker.** `capture_picker.js` records it in a phone viewport (393 x 659 at 3x) from the v2.23.1 build of main. It starts a new game, picks the Shelter's Border Collie (Scout) and scrolls its colour row up. The only thing hidden is the dog's joke bubble. It starts on Chocolate and white, then taps Blue merle, then Red merle, then odd eyes; the meet dog changes each time. The Reel shows the full-width screen (CSS y 110 to 490) in a crayon phone frame, with a pink ring on each tap. The game's own "Coat: ... · Eyes: ..." line is repeated large in a yellow pill, because the in-game line is small on a phone. The card reads **pick the coat / when you adopt**.

## Shots

| Time (s) | Noodle says | On screen |
|---|---|---|
| 0.0 to 1.35 | "Stop picking the yellow Lab. Pick one of these four dogs instead." (0.1 to 3.75) | Card at frame 1: **Stop picking the yellow Lab. / Pick 1 of these 4 dogs instead.** over the sitting yellow Lab. A red crayon cross at 0.4 s (two scratch sounds), pill: *sorry yellow Labs, you're great*. The Lab slides off to the left at 0.95 s |
| 1.35 to 3.85 | (hook continues) | The four pop in at once in a 2 x 2 grid with a tick: 1 Fox red, 2 Dark golden, 3 Red merle, 4 Chocolate (number badges, coat pills) |
| 3.87 to 5.6 | "Pause now! Three, two, one." | Card: **pause now! / PICK 1 · 2 · 3 · 4**, a pink 3, 2, 1 bubble on the spoken numbers (soft ticks). The sticker **NEW! pick your dog's coat** pops in under the card and stays until the end card |
| 5.64 | "Fox red. Not a fox. We checked." | Dog 1 pops big, card **1 Fox red / Labrador** with a **NEW!** sticker, subtitles |
| 7.77 | "Dark golden. Like toast, but a dog." | Dog 2 big, **2 Dark golden / Golden Retriever**, **NEW!** |
| 10.19 | "Odd eyes. Both judging you." | Dog 3 big, **3 Red merle / Border Collie**, an eye loupe on its face, pill *one blue eye, one brown* |
| 12.05 | "Chocolate. The dog-safe kind." | Dog 4 big, **4 Chocolate / Labrador** |
| 14.04 | "New! Almost every dog comes in different coats!" | The chocolate Lab fades. A grid of the 34 dogs that have a choice pops in, each cycling through its coats. Green card **134 coats / 34 of 40 dogs have a choice**, subtitles |
| 17.04 | "Pick one when you adopt. Puppies inherit it!" | The real adoption colour picker in a crayon phone. Taps (pink rings, ticks) at 17.7 Blue merle, 18.5 Red merle, 19.3 odd eyes. A yellow pill shows the game's Coat / Eyes line. Card **pick the coat / when you adopt**, the game's "adopt" sting, subtitles |
| 20.54 | "Comment your number!" | The four pop back into the grid. Card **Comment / your number!**, the four bounce |
| 21.46 to 23.97 | (none) | The four slide off as our standard end card fades in over paper (owner, 9 Nov 2026: "can we add the social media and website at the end card of the reels"; `brand/kids/endcard.js`): the logo, **doodledoggo.app**, Instagram **@doodledoggo.app**, X **@doodledoggoapp**, YouTube **@DoodleDoggoApp**, each with its icon. The music fades out under it. The Reel no longer loops back to the hook |

Sound: Noodle (Kokoro af_bella 1.1x) at -16 LUFS. Under it is the game's own cozy yard music (`mods/pawaudio.js`), 11 dB under the voice (about 30 %), plus crayon ticks and scratches. The whole mix is at -16 LUFS, true peak -1.5.

Changes from the draft in `VIRAL_REEL_IDEAS.md`: spoken numbers are left out of the payoffs (the big number badge carries them). Line 3 is "Odd eyes. Both judging you." and the screen says "one blue eye, one brown". Line 4 is "Chocolate. The dog-safe kind.", which keeps the food-safety wink. The closing beats are "New! Almost every dog comes in different coats!" and "Pick one when you adopt. Puppies inherit it!" (owner, 9 Nov 2026). The Reel runs 22.0 s.

## Rebuild

```
# main checkout with the v2.23.1 coats, e.g. a worktree of origin/main, with game/test_merged.html built (node game/build.js && node game/harness.js merged)
NODE_PATH=$(npm root -g) node brand/instagram/launch/coat_reel/capture_picker.js <main checkout> <workdir>/../picker   # or PICKER=<dir>
VO_LINES=brand/instagram/launch/coat_reel/vo_coat.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir>
ART_ROOT=<main checkout> NODE_PATH=$(npm root -g) node brand/instagram/launch/coat_reel/build_coat.js <workdir> <vo dir>
# ONLY=stills (STRIP=t1,t2,...) renders key frames only into <workdir>/stills
```
The Kokoro model files (`kokoro-v1.0.int8.onnx`, `voices-v1.0.bin`) are never committed.

## RedNote cut

This is the owner-approved English Reel remade for RedNote (owner, 9 Nov 2026: "create cover and rednote version").
- **Voice.** Noodle's Mandarin voice, Kokoro v1.1-zh zf_073 at 1.0x, the same as the Friends how-to RedNote cut (`../friends_reel/vo_friends_zh.py` with `VO_LINES=coat_reel/vo_coat_zh.json`).
- **Words.** Chinese cards and subtitles of at most 14 characters, in LXGW WenKai. Coat, breed and eye words are the game's own zh-Hans text: 狐狸红, 深金色, 红陨石色, 巧克力色, 拉布拉多寻回犬, 金毛寻回犬, 边境牧羊犬, 蓝色, 棕色 and 异色, via `mods/genes.js` `coatLabel` and `game/i18n/zh-Hans.json`.
- **Picker beat.** Re-recorded in Chinese (`capture_picker.js` with `PAW_LANG=zh-Hans`).
- **RedNote rules.** No link, no written domain, no other platform's name. Owner, 9 Nov 2026: every RedNote video ends on the RedNote end card (`brand/kids/endcard.js` `endCardRN`). The card has the logo, 治愈系蜡笔狗狗游戏, 浏览器搜 Doodle Doggo App 就能玩, and the QR code to the game's site with 扫码就能玩. The QR is made by `qrMatrix` from the game's `mods/qr.js`. So this cut ends on that card and does not loop.
- **Length.** 30.4 s (2.3 s of it the end card), against 24.0 s for the English (2.5 s of it the end card). The Mandarin lines are longer, even after shortening.

| Time (s) | Noodle says | On screen |
|---|---|---|
| 0.1 | 别再选黄色拉布拉多了！从这四只里挑一只。 | Card **别再选黄色拉布拉多了 / 从这4只里挑1只**, the cross, pill *黄色拉布拉多，你也很棒！*, the four pop in |
| 4.37 | 暂停！三，二，一。 | Card **暂停！ / 选 1 · 2 · 3 · 4**, the 3-2-1, sticker **新！领养时可以选毛色** (kept to the loop) |
| 6.60 | 狐狸红。不是狐狸，查过了。 | **1 狐狸红 / 拉布拉多寻回犬**, 新！ |
| 9.41 | 深金色。像烤面包的狗狗。 | **2 深金色 / 金毛寻回犬**, 新！ |
| 12.34 | 异色眼睛。都在审视你。 | **3 红陨石色 / 边境牧羊犬**, eye loupe, pill *一只蓝色，一只棕色* |
| 15.18 | 巧克力色。唯一安全的巧克力。 | **4 巧克力色 / 拉布拉多寻回犬** |
| 18.44 | 新！几乎每只狗狗都能选毛色！ | The coat grid, card **134种毛色 / 40只狗狗里34只可以选** |
| 22.04 | 领养时挑一个，小狗会遗传！ | The real picker in Chinese (毛色：巧克力色和白色 → 蓝陨石色 → 红陨石色 → 异色眼睛), card **领养的时候 / 挑选毛色** |
| 25.54 | 评论区告诉我你选几号！ | Card **评论区告诉我 / 你选几号！**, the four bounce |
| 28.09 to 30.39 | (none) | The RedNote end card with the QR code and 扫码就能玩 (the game's "discover" sting) |

Rebuild:
```
PAW_LANG=zh-Hans NODE_PATH=$(npm root -g) node brand/instagram/launch/coat_reel/capture_picker.js <main checkout> <dir>/picker_zh
VO_LINES=brand/instagram/launch/coat_reel/vo_coat_zh.json PYTHONPATH=<jieba 0.42.1 src> python3 brand/instagram/launch/friends_reel/vo_friends_zh.py <kokoro dir> <vo_zh dir>
REDNOTE=1 PICKER=<dir>/picker_zh ART_ROOT=<main checkout> NODE_PATH=$(npm root -g) node brand/instagram/launch/coat_reel/build_coat.js <workdir_rn> <vo_zh dir>
# covers: add ONLY=cover to the English build (coat-cover.jpg) and to the RedNote build (brand/rednote/rednote-12-coats.jpg)
```

## Captions

The numbers are true on main: 134 coats, 34 of the 40 dogs have a choice, new in v2.23 (7 Nov) and v2.23.1 (8 Nov). Each caption has one ask: comment your number (评论区告诉我你选几号). No em dashes anywhere.

### Instagram

```
new in Doodle Doggo: almost every dog comes in different coats, pick one when you adopt 🖍️ comment your number 👇

the yellow Lab is lovely. but 34 of our 40 crayon dogs now come in more than one coat, 134 coats in all, and fox red and dark golden only arrived this week

1 fox red Lab (new!)
2 dark golden Golden Retriever (new!)
3 red merle Border Collie, one blue eye and one brown
4 chocolate Lab, the only chocolate a dog should ever have 🍫🚫

they're real coat genes, so the puppies inherit them 🐶 Doodle Doggo is our free cozy dog game, and you play it in your browser 🏡

#DoodleDoggo #CozyGames #BorderCollie #Labrador #DogLovers
```
`caption.py` READY. `detect.py` human score 77.0 PASS. 5 hashtags, no link in the caption (it is in the bio). "link in bio" was taken out because `caption.py` counts it as a second ask.

### TikTok

Title: `Stop picking the yellow Lab. Pick 1 of these 4 dogs instead 👀`

```
new in Doodle Doggo: almost every dog comes in different coats, pick one when you adopt 🖍️ comment your number 👇

I couldn't choose, so you do it. fox red and dark golden only landed this week, and yes, the puppies inherit the coat 🐶

#DoodleDoggo #CozyGames #DogLovers #BorderCollie #Labrador
```
`caption.py` READY. `detect.py` 80.1 PASS.

### YouTube Shorts

Title:
```
Stop picking the yellow Lab. Pick 1 of these 4 dogs instead 👀 #Shorts
```
Description:
```
New in Doodle Doggo: almost every dog comes in different coats, and you pick one when you adopt. 34 of our 40 crayon dogs have a choice, 134 coats in all, and the puppies inherit the coat genes.

1 fox red Labrador (new this week)
2 dark golden Golden Retriever (new this week)
3 red merle Border Collie, one blue eye and one brown
4 chocolate Labrador, the only chocolate a dog should ever have

Which number would you pick? Tell us in the comments.

🎮 Play free: https://doodledoggo.app
☕ Support us on Ko-fi: https://ko-fi.com/doodledoggoapp
📷 Instagram: https://www.instagram.com/doodledoggo.app/

#DoodleDoggo #Shorts #CozyGames #DogLovers #BorderCollie
```
The text above the link block scores 72.7 PASS on `detect.py`. The link block is the same fixed one as on the other Shorts.

### Threads

```
new in Doodle Doggo: almost every dog comes in different coats now 🖍️

you pick one when you adopt. 134 coats across 34 of our 40 crayon dogs. real coat genes, so the puppies inherit them.

I can't decide between these four. fox red Lab? dark golden Golden? the red merle Collie with one blue eye and one brown, or the chocolate Lab? which number would you pick?
```
`detect.py` 78.6 PASS. No hashtags and no link, as with our other Threads posts.

### X (258 of 280; the link counts as 23, each emoji as 2)

```
stop picking the yellow Lab. pick 1 of these 4 instead 👀

new in our cozy dog game: almost every dog comes in different coats, 134 in all, and you pick one when you adopt. puppies inherit them 🐶 which number? https://doodledoggo.app #DoodleDoggo #CozyGames
```
`detect.py` 80.0 PASS.

### RedNote / 小红书

Upload `doodle-doggo-pick-a-coat-rednote.mp4` with `brand/rednote/rednote-12-coats.jpg` as its cover.

标题 (title, 15 characters with the emoji; 20 max):
```
别再选黄色拉布拉多了！挑1只🐶
```
> Stop picking the yellow Lab! Pick one.

正文 (text):
```
新功能来啦🖍️ 现在领养狗狗的时候，可以自己挑毛色！
游戏里40只狗狗，有34只可以选，一共134种毛色。小狗还会遗传毛色基因哦🧬

今天这4只，你选哪只？
1️⃣ 狐狸红 拉布拉多（新）
2️⃣ 深金色 金毛（新）
3️⃣ 红陨石色 边境牧羊犬，一只蓝眼睛一只棕眼睛
4️⃣ 巧克力色 拉布拉多（唯一对狗狗安全的巧克力🍫）

评论区告诉我你选几号👇
浏览器搜 Doodle Doggo App 就能玩

#狗狗 #治愈系游戏 #边境牧羊犬 #拉布拉多 #金毛 #养狗日常 #蜡笔画
```
> New: you can pick the coat when you adopt a dog! 34 of the 40 dogs have a choice, 134 coats in all, and puppies inherit the coat genes. Which of these 4 would you pick? 1 fox red Labrador (new), 2 dark golden Golden (new), 3 red merle Border Collie with one blue eye and one brown, 4 chocolate Labrador (the only chocolate that is safe for dogs). Tell me your number in the comments. Search Doodle Doggo App in your browser to play.

One ask (评论区告诉我你选几号). 7 tags. The only play line is 浏览器搜 Doodle Doggo App 就能玩. The caption has no link, no domain with a dot, no QR and names no other platform. The QR code is only on the video's end card.
