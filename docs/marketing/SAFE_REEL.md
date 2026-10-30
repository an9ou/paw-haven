# "Is this safe for my dog?" Reel (30 Oct 2026)

Owner, 30 Oct 2026: idea 10 from the Reel ideas list, made to be saved. Files in `brand/instagram/launch/safe_reel/`.

| File | What |
|---|---|
| `doodle-doggo-is-this-safe.mp4` | Instagram, Shorts and X. 1080 x 1920, 30 fps, 21.7 s, with a Halloween lo-fi beat (`spooky_lofi.js`, owner 30 Oct 2026). |
| `safe-cover.jpg` | The cover: grapes on Noodle's plate with the stop sign and the lesson. |
| `doodle-doggo-is-this-safe-rednote.mp4`, `safe-cover-rednote.jpg` | RedNote: every word in Simplified Chinese (the game's own zh-Hans text), no game link anywhere. |
| `build_safe.js` | Remake: `NODE_PATH=$(npm root -g) node brand/instagram/launch/safe_reel/build_safe.js <workdir>` (`REDNOTE=1` for the RedNote cut, `ONLY=stills` for key frames). |

**What is in it:** The hook card: "stop sharing these 3 snacks" (owner, 30 Oct 2026, after the skill review: "is this safe for my dog?" scored 34; the RedNote cut keeps its question hook). Each round now holds the food and its lesson for 4.4 s so the lesson can be read. Noodle begs in the game's kitchen. Grapes, chocolate and sugar-free gum land on his plate one after another; each gets the game's own paw-stop sign and the game's own lesson, then the game's own safe swap arrives (blueberries, Carrot Crunchies, a Pumpkin Pupcake) with a green tick, and Noodle is delighted. It ends on a "save this for later" page: never for dogs (grapes and raisins, chocolate, sugar-free gum with xylitol, onion and garlic, macadamia nuts), safe swaps (blueberries, carrot, pumpkin), "ate something? call your vet.", and the logo with "a free cozy dog game where nothing toxic can be cooked or fed". **Every food fact on screen is the game's own reviewed text** (`people_food.*` in `game/i18n/en.json` and `zh-Hans.json`), so the Reel says exactly what the game teaches.

## Instagram
Captions rewritten 30 Oct 2026 with the Instagram skills (`ig-caption` linter, `ig-human` detector); the reasons are in `REEL_REVIEW_TRICK_SAFE.md`.

```
save this one: 7 foods dogs can't eat, and 3 safe swaps 📌

never for dogs: grapes and raisins, chocolate, xylitol (it's in a lot of sugar-free gum), onion, garlic and macadamia nuts.

dog safe treats to give instead? blueberries, carrots and plain pumpkin.

ate something it shouldn't? call your vet right away. don't wait for signs.

in Doodle Doggo, our free cozy dog game, you can't cook or feed anything toxic. every recipe comes with a two-sentence safety lesson.

#DoodleDoggo #DogSafety #DogTips #DogHealth #CozyGames
```
Job A · one ask: save · 5 hashtags · search: "foods dogs can't eat" in line 1, "dog safe treats", "cozy dog game" in the body · no link · linter READY · human score 80 PASS. Every food fact matches the game's `people_food` text.

## YouTube Shorts

Title: `Stop sharing these 3 snacks with your dog 🍇🍫 #Shorts`

Description:
```
3 snacks Noodle begs for, and 3 he gets instead: grapes, chocolate and sugar-free gum (it's the xylitol) are never for dogs, while blueberries, Carrot Crunchies and a Pumpkin Pupcake are the swaps he loves. Save it. If your dog ate something it shouldn't, call your vet right away. Don't wait for signs.

Doodle Doggo is our free cozy dog game, drawn in a pencil sketchbook. You can't cook or feed anything toxic in it, and every recipe comes with a two-sentence safety lesson. Nothing bad ever happens.

🎮 Play free: https://doodledoggo.app
🕹️ itch.io: https://an9ou.itch.io/doodle-doggo
☕ Support us on Ko-fi: https://ko-fi.com/doodledoggoapp
📷 Instagram: https://www.instagram.com/doodledoggo.app/

#DoodleDoggo #Shorts #DogSafety #DogTips #CozyGames
```
Title off the strongest hook (81 STRONG). Human score 91 PASS.

## X (under 280 characters)
```
stop sharing these 3 snacks with your dog 🍇🍫 grapes, chocolate and sugar-free gum (it's the xylitol). the 3 swaps Noodle gets instead? blueberries, carrots and plain pumpkin. ate something? call your vet. his game is free: https://doodledoggo.app #DoodleDoggo #DogSafety
```
270 of 280 (the link counts as 23) · human score 89 PASS.

**Alt text:** `A crayon dachshund begs in a kitchen. Grapes, a chocolate bar and sugar-free gum each appear on his plate with a red paw stop sign and a short reason they are unsafe for dogs; then blueberries, carrot crunchies and a pumpkin cupcake appear with a green tick. It ends on a list: never for dogs, grapes and raisins, chocolate, sugar-free gum (xylitol), onion and garlic, macadamia nuts; safe swaps, blueberries, carrot, pumpkin; ate something? call your vet.`

## RedNote / 小红书 (Simplified Chinese, no link)

Post `doodle-doggo-is-this-safe-rednote.mp4` with `safe-cover-rednote.jpg`. On the video: "这个，/ 狗狗能吃吗？" (is this OK for dogs to eat?), the game's own names, lessons and swaps, "狗狗不能吃" (not for dogs), "换成这个" (swap for this), and the page "收藏起来，给狗狗备用" (save this for your dog) with "不小心吃了？马上联系兽医。" (ate something by accident? call a vet right away).

标题 (title, 16 characters; 20 max):
```
狗狗不能吃的7种食物，先收藏🍇🍫
```

> 7 foods dogs can't eat. Save it first.

正文 (text):
```
这个，狗狗能吃吗？🐶

📌 先收藏，狗狗不能吃的7种食物：葡萄、葡萄干、巧克力、木糖醇（无糖口香糖里常有）、洋葱、大蒜、夏威夷果
✅ 可以换成：蓝莓、胡萝卜、原味南瓜

不小心吃了？马上联系兽医，别等出现症状。

在Doodle Doggo里，有毒的食物做不出来，也喂不了，每道菜都附带两句狗狗安全小知识。Noodle最爱胡萝卜脆脆和南瓜汪汪蛋糕。免费，没有广告，浏览器直接玩，搜索 Doodle Doggo 就能找到

你家狗狗最爱吃什么？评论区说说～

#DoodleDoggo #养狗知识 #狗狗不能吃 #宠物健康 #新手养狗 #萌宠 #治愈系游戏 #独立游戏 #免费游戏 #蜡笔画
```

> Is this OK for dogs to eat?
> Save it first, 7 foods dogs can't eat: grapes, raisins, chocolate, xylitol (often in sugar-free gum), onion, garlic, macadamia nuts. Swap for: blueberries, carrots, plain pumpkin.
> Ate something by accident? Call a vet right away; don't wait for symptoms.
> In Doodle Doggo, toxic food can't be cooked or fed, and every dish comes with a two-sentence dog-safety tip. Noodle's favourites are the Carrot Crunchies and the Pumpkin Pupcake. Free, no ads, plays in your browser; search Doodle Doggo to find it.
> What does your dog love to eat? Tell us in the comments!
