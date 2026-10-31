# RedNote (小红书): profile and first post

Owner, 29 Oct 2026: a RedNote account for Chinese-speaking players, suggested by a friend. Everything here is Simplified Chinese; Instagram stays English only. The wording follows the game's own reviewed zh-Hans text (`game/i18n/zh-Hans.json`, `docs/marketing/TAPTAP_INTRO.md`). The English under each part says what the Chinese says. The owner posts; nothing here is posted for them.

## Profile

Name: `Doodle Doggo` (the game's name stays in English, as it does in the Chinese version of the game).

Bio (80 characters; RedNote allows 100):
```
🐾 一款画在铅笔素描本里的温馨狗狗游戏
🐶 领养歪歪扭扭的蜡笔小狗，在富士山下散步
🎮 免费 · 没有广告 · 浏览器直接玩
🔍 搜索 Doodle Doggo 就能玩
```

> A cozy dog game drawn in a pencil sketchbook.
> Adopt a wobbly crayon puppy and walk it under Mt. Fuji.
> Free · no ads · plays right in your browser.
> Search "Doodle Doggo" to play.

Profile picture: the Halloween Noodle icon, `brand/instagram/doodle-doggo-instagram-halloween-512.png`, works here too.

Profile background (背景图): `brand/rednote/rednote-profile-background.jpg` (1080 x 1080). The game's Mt. Fuji Lookout in spring (torii, Fuji, cherry petals, the sign in the game's Chinese name 富士山观景台) with Mochi, Noodle and Sunny on the grass. No words, because RedNote puts the name and bio over it; the square crops cleanly to whatever shape the app shows. Made by the same `make.js shots rednote` run.

**English first, RedNote after approval (owner, 30 Oct 2026).** For every new Reel or post, render only the English version first. Make the RedNote version only after the owner approves the English one.

**No game link on RedNote (owner, 29 Oct 2026).** The bio, posters, captions and videos for RedNote never show doodledoggo.app or any other link; they say "搜索 Doodle Doggo" (search Doodle Doggo) instead. RedNote also holds back posts that send people to outside sites.

## First post: the hello poster

Image: `brand/rednote/rednote-01-hello.jpg` (1080 x 1440, RedNote's 3:4). Made by `NODE_PATH=$(npm root -g) node brand/instagram/launch/make.js shots rednote` (`make_rednote.js`): Mochi, Noodle and Sunny in the game's real art, the game's Chinese font (LXGW WenKai).

On the poster: "你好，小红书！" (Hello, RedNote!) · "领养一只歪歪扭扭的蜡笔小狗" (Adopt a wobbly crayon puppy) · "一款画在铅笔素描本里的温馨狗狗游戏" (A cozy dog game drawn in a pencil sketchbook) · "画得丑？是故意的！" (Ugly drawing? On purpose!) · 35 dogs, each with its own faces · walk the little town under Mt. Fuji and find treasures · grow vegetables and cook dog-safe snacks · nothing bad ever happens here · free, no ads, plays in your browser · search "Doodle Doggo" to play

标题 (title, 16 characters; 20 max):
```
你好小红书！来领养一只蜡笔小狗🐾
```

> Hello RedNote! Come adopt a crayon puppy.

正文 (text):
```
大家好！这里是Doodle Doggo 🐶

一款画在铅笔素描本里的温馨狗狗游戏。狗狗都是故意画得歪歪扭扭的蜡笔狗——画得丑？是故意的！

🐾 35种狗狗，每一只都有自己的个性和表情
🦮 在富士山下的小镇散步，闻一闻，找宝物
🥕 种胡萝卜和南瓜，再做成对狗狗安全的零食
🗼 坐新干线去东京，逛涩谷、浅草和东京塔
🌸 这里从来不会发生坏事

免费，没有广告，不用下载，浏览器直接玩，搜索 Doodle Doggo 就能找到
游戏支持简体中文

你最想领养哪一只？评论区告诉我们吧！

#DoodleDoggo #治愈系游戏 #狗狗 #独立游戏 #免费游戏 #蜡笔画 #萌宠 #小游戏推荐 #宠物游戏 #丑萌
```

> Hi everyone! This is Doodle Doggo.
> A cozy dog game drawn in a pencil sketchbook. The dogs are deliberately wobbly crayon dogs. Ugly drawing? On purpose!
> 35 dogs, each with its own personality and faces · walk the little town under Mt. Fuji, sniff around and find treasures · grow carrots and pumpkins and cook dog-safe snacks · ride the Shinkansen to Tokyo: Shibuya, Asakusa and Tokyo Tower · nothing bad ever happens here.
> Free, no ads, no download, plays right in your browser; search "Doodle Doggo" to find it. The game is in Simplified Chinese.
> Which one would you adopt? Tell us in the comments!

## Later posts

Reel captions for RedNote sit with each Reel's captions (e.g. `REELS.md`, "RedNote / 小红书"). Post the vertical video. No link anywhere, in the caption or in the video (use the RedNote cut of a Reel, without the address on its end card).

## Reel covers for the two Halloween-week Reels (30 Oct 2026)

These are the RedNote video covers (owner, 30 Oct 2026): upload each one as the video's custom cover. The corner stickers are pale with dark ink words and a dashed coloured ring (owner: white words on colour were too big and hard to read).

Made by `NODE_PATH=$(npm root -g) node brand/instagram/launch/make.js shots rednoteposters` (`make_rednote_posters.js`), 1080 x 1440, in the hello poster's style, the game's real art and its own zh-Hans names, no link. Captions: the RedNote parts of `TRICK_REEL.md` and `SAFE_REEL.md`.
- `brand/rednote/rednote-02-trick.jpg`: "第4扇门，零食全没了" · "不给糖就捣蛋，蜡笔版" · Noodle runs from the Labrador in the 恐龙帽兜 ("汪！"), "……零食不要了" pointing at the treats in the pumpkin · "万圣节市集新服装": 稻草人背带裤, 骷髅服, 木乃伊绷带, 恐龙帽兜 · sticker "万圣节市集 / 开到11月15日" · "免费 · 没有广告 · 浏览器直接玩" · "搜索 Doodle Doggo 就能玩".
- `brand/rednote/rednote-03-safe.jpg`: "狗狗不能吃的7种食物" · "每一条都是游戏里的狗狗安全小知识" · 狗狗不能吃: 葡萄, 葡萄干, 巧克力, 无糖口香糖（木糖醇）, 洋葱, 大蒜, 夏威夷果 (the game's icons) · 可以换成: 蓝莓, 胡萝卜, 南瓜（原味） · "不小心吃了？马上联系兽医。" · "在这个游戏里，有毒的食物做不出来，也喂不了" · "搜索 Doodle Doggo 就能玩" · sticker "先收藏！/ 给狗狗备用".
- `brand/rednote/rednote-04-sweet.jpg` (31 Oct 2026, the sweet potato Reel): "狗狗吃红薯前，先记住这3条" · "每一条都是游戏里的狗狗安全小知识" · the 3 rules with the game's recipe icons (红薯金币片, 红薯骨头, 红薯干): 第1条：不吃生的 (一定要煮熟，生红薯很难消化), 第2条：原味，什么都不加 (不抹黄油，不放糖，不放肉豆蔻), 第3条：切成小条 (等凉了再吃，免得噎着) · "南瓜也一样：原味煮熟，不用南瓜派馅料" · sticker "红薯季 / 先收藏！" · "搜索 Doodle Doggo 就能玩". Caption: `SWEET_REEL.md`.
