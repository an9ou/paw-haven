# Week-off Reel: all captions (13 Nov 2026)

Videos: `brand/instagram/launch/back_reel/doodle-doggo-week-off.mp4` (English: Instagram, TikTok, YouTube Shorts, X) and `doodle-doggo-week-off-rednote.mp4` (RedNote). Covers: `back_reel/back-cover.jpg`, `brand/rednote/rednote-15-week-off.jpg`.

### Instagram

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

### TikTok

```
stop feeling bad about a week off 🐶 in our cozy dog game, your dog keeps a "While you were out" diary page for you. Noodle found a sock. nobody knows whose. it belongs to Noodle now. there's a little gift once a day, and after 3 days away Gerald the duck sends a treat bag and 100 coins. the game counts every day you play and never resets, so missing a day costs you nothing. no streaks, no guilt, just a happy dog. tag someone who needs a break 👇 #DoodleDoggo #CozyGames #DogGame #DogLovers
```
One ask: tag · 4 hashtags · no link · `ig-human` score 79.5 PASS.

### YouTube Shorts

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

### X (under 280 characters)
```
stop feeling bad about a week off 🐶 your dog keeps a diary for you ("Noodle found a sock. Nobody knows whose. It belongs to Noodle now.") and saves you a gift. miss a day? nothing lost. tag someone who needs a break https://doodledoggo.app #DoodleDoggo #CozyGames
```
264 of 280 (the link counts as 23, the emoji as 2) · one ask: tag · `ig-human` score 57.4.

**Alt text:** `A crayon dachshund called Noodle in the game's own autumn yard. A calendar flips from day 1 to day 7 while he waits and naps as day turns to night. Then Gerald the duck's letter "We kept your spot warm" with a treat bag and 100 coins, Noodle's "While you were out" diary page ("Noodle found a sock. Nobody knows whose. It belongs to Noodle now."), a little gift once a day, a days-played count that never resets, gifts at 7, 30, 100 and 365 days, and "No streaks. No guilt. Just a happy dog." It ends on the Doodle Doggo card with doodledoggo.app and our Instagram, X and YouTube.`

### RedNote / 小红书 (Simplified Chinese, no link)

Owner, 13 Nov 2026: approved the 44 s English cut ("Good") and asked "create the rednote version". Post `brand/instagram/launch/back_reel/doodle-doggo-week-off-rednote.mp4` (1080 x 1920, 30 fps, 56.30 s: 53.80 s of Reel and the RedNote end card for 2.5 s) with the 3:4 cover `brand/rednote/rednote-15-week-off.jpg` (1080 x 1440; upload it as the video's custom cover: "离开一周 / 别再愧疚啦！", "狗狗给你留了礼物", Noodle and the gift in the game's yard, the logo).

- **Remake:** `CAP_DATE=2026-11-12 PAW_LANG=zh-Hans NODE_PATH=$(npm root -g) node brand/instagram/launch/back_reel/capture_back.js <main checkout> <caps_zh dir>` (12 Nov, so today's gift is 胡萝卜条 x2 as in the English cut), `VO_LINES=brand/instagram/launch/back_reel/vo_back_zh.json PYTHONPATH=<jieba-0.42.1 sdist> python3 brand/instagram/launch/friends_reel/vo_friends_zh.py <kokoro dir> <vo_zh dir> zf_073 1.0`, then `REDNOTE=1 ART_ROOT=<main checkout> CAPS=<caps_zh dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/back_reel/build_back.js <workdir> <vo_zh dir>` (`ONLY=cover` for the cover).
- **What is different:** every word is in Simplified Chinese in LXGW WenKai; the game screens are the game's own Chinese ones (captured with the game in zh-Hans: 你不在的时候, Noodle的日记, 我们帮你把位子暖着, 一袋零食和100枚金币). The quoted lines are the game's own (`game/i18n/zh-Hans.json`, checked by the build): `wb.l1` "Noodle找到了一只袜子。没人知道是谁的。现在它是Noodle的了。", `wb.l14` "Noodle坐在大门边，听着有没有你的脚步声。", `wb.title`, `fw.rew_bag_coins`, `wb.cal_life` "一共玩了#天", `nw.v225.days` "错过一天什么都不会少，第7、30、100和365天杰拉德都有礼物", `data.food.carrot_sticks.n` 胡萝卜条. Noodle speaks Mandarin as 我 (zf_073, 1.0x, like the other RedNote cuts), with subtitles of at most 14 characters in a pill under his feet. The fast timing of the English cut: each card holds its line + 0.4 s, 0.15 s between beats. No safe zone: everything in front of the scene sits in the middle of the frame (x 540) with ~60 px margins; the centring, no-overlap and floor checks run on every frame. Same game scenes as the English cut. It ends on the RedNote end card centred on the frame: the logo, 治愈系蜡笔狗狗游戏 and only "搜 Doodle Doggo App". No QR code, link, domain or handle.
- **Shots:** 0.10 s hook "离开一周，/ 别再愧疚啦！" + "狗狗给你留了礼物"; 4.21 s "你休息了一周。/ Noodle一直在等你。" small "还睡了觉。主要是睡觉。" (the calendar 第1天 to 第7天, day to night); 9.70 s "离开3天以上？", Gerald's letter, "一袋零食和100枚金币"; 16.94 s "离开4小时以上？", card 你不在的时候 with the two quoted lines, the game's diary page; 26.27 s 每天一份小礼物: 对狗狗安全的零食或玩具，偶尔还有几枚金币; 32.92 s 玩过的每一天都记着: 这个数字永远不会清零。错过一天？什么都不会少。 ("一共玩了12天"); 40.12 s 杰拉德的礼物: 玩到第7、30、100和365天都有礼物 (medals 7 / 30 / 100 / 365 天); 45.92 s "没有连续打卡，没有负罪感。/ 只有一只开心的狗狗。" + red pill 评论区@一个需要休息的朋友; 53.80 s the RedNote end card.
- **Voice** (`vo_back_zh.json`): 离开一周，别再愧疚啦！狗狗给你留了礼物。/ 你休息了一周。我一直在等你。还睡了觉。主要是睡觉。/ 你一回来，杰拉德就寄来一封信。一袋零食和一百枚金币。欢迎回来！/ 我还给你写了日记。我坐在大门边，听着有没有你的脚步声。我找到了一只袜子。现在它是我的了。/ 每天我还会送你一份小礼物。今天是胡萝卜条。我只是闻了闻。/ 游戏会记住你玩过的每一天，永远不会清零。错过一天？什么都不会少。/ 玩到第七、三十、一百和三百六十五天，杰拉德都会送你礼物。/ 没有连续打卡，没有负罪感，只有一只开心的狗狗。评论区艾特一个需要休息的朋友吧！

标题 (title, 16 characters; 20 max):
```
离开一周别愧疚🐶狗狗给你留了礼物
```

> A week away, don't feel guilty. Your dog left you a gift.

正文 (text):
```
出去玩了一周，回来却有点愧疚？🥺
在Doodle Doggo里完全不用！

🐾 离开4小时以上：狗狗会给你写一页「你不在的时候」日记，比如“Noodle找到了一只袜子。没人知道是谁的。现在它是Noodle的了。”
🎁 每天一份小礼物：对狗狗安全的零食或玩具，偶尔还有几枚金币
✉️ 离开3天以上：杰拉德寄来一封信，附上一袋零食和100枚金币
📅 玩过的每一天都记着，永远不会清零，错过一天什么都不会少
🏅 玩到第7、30、100和365天，杰拉德都会送礼物

没有连续打卡，没有负罪感，只有一只开心的狗狗。
搜 Doodle Doggo App 就能找到

评论区@一个需要休息的朋友吧👇

#DoodleDoggo #治愈系游戏 #养狗日常 #萌宠 #休息一下 #狗狗日记 #治愈
```

> Went away for a week and feel a bit guilty coming back? Not in Doodle Doggo! Away 4+ hours: your dog writes you a "While you were out" diary page, e.g. "Noodle found a sock. Nobody knows whose. It belongs to Noodle now." A little gift every day: a dog-safe treat or toy, sometimes a few coins. Away 3+ days: Gerald sends a letter with a treat bag and 100 coins. Every day you play is remembered and never resets; miss a day and you lose nothing. Gerald has gifts at 7, 30, 100 and 365 days. No streaks, no guilt, just a happy dog. Search Doodle Doggo App to find it. Tag a friend who needs a break in the comments.

Checked against the RedNote anti-ban list (`README.md`): no link, domain or QR; none of 链接 网址 官网 二维码 扫码 下载 私信我 加我 主页链接 戳; no other platform's name, no handle; no 免费 and no claim about ads; the game is named only as "Doodle Doggo App" to search for. One ask: 评论区@一个需要休息的朋友. 7 tags.
