# "2 chocolate dogs had puppies. you won't guess the colours" Reel (1 Nov 2026)

Owner, 1 Nov 2026: idea 2 of the new Reel list ("follow your planning"). First made with two black Labradors; the owner asked to change the colour ("black dogs may lead to racism … the community may be sensitive"), so no black or white dogs are the subject: the parents are Chocolate and the puppies Yellow, Silver and Champagne (the script stops if a black or white coat could come from the pair). English first; the owner approved it on 1 Nov 2026, then the RedNote cut and its 3:4 cover were made. Files in `brand/instagram/launch/pups_reel/`.

| File | What |
|---|---|
| `doodle-doggo-puppy-colours.mp4` | Instagram, Shorts and X. 1080 x 1920, 30 fps, 17.3 s, with the game's own cozy music (the yard by day), a tick on the 3-2-1, the "adopt" sting and a puppy bark as each puppy arrives. |
| `pups-cover.jpg` | The cover: the hook over the two chocolate parents with their "mum: Chocolate" / "dad: Chocolate" tags. |
| `doodle-doggo-puppy-colours-rednote.mp4`, `pups-cover-rednote.jpg` | RedNote: every word in Simplified Chinese (the game's zh-Hans coat names and odds words), no game link anywhere. The 3:4 cover is `brand/rednote/rednote-05-pups.jpg`. |
| `build_pups.js` | Remake: `NODE_PATH=$(npm root -g) node brand/instagram/launch/pups_reel/build_pups.js <workdir>` (`REDNOTE=1` for the RedNote cut, `ONLY=stills` for key frames). |

**What is in it:** the hook card "2 chocolate dogs had puppies. / you won't guess the colours" (hookscore 81.4 STRONG) over two chocolate Labradors in the yard (autumn, Fuji behind the fence), tagged "mum: Chocolate" and "dad: Chocolate", and the clue "both carry yellow & dilute (paler) genes". Then "pause and guess / how many colours?" with three question marks and a 3-2-1. The puppies pop in one by one: Yellow (about 1 in 5), Silver (about 1 in 5), Champagne (1 in 16), and "not one chocolate!". Then "both parents are chocolate, but both hide yellow and dilute genes / in this game, puppies get real coat genes", and the end page "did you guess all 3?" with the three puppies, the logo, "a free cozy dog game with real coat genetics" and "play free at doodledoggo.app".

**Where the facts come from:** the game's own genetics (`mods/genes.js`). Both parents are b/b D/d E/e (Chocolate, carrying dilute and red); the three puppies are real outcomes of that pair (b/b D/d e/e Yellow, b/b d/d E/e Silver, b/b d/d e/e Champagne), drawn with the game's `phenotype()` colours. The odds are the game's `predict()` for the pair, in its own words (Chocolate 56.25 % "about 1 in 2", Yellow and Silver 18.75 % "about 1 in 5", Champagne 6.25 % "1 in 16"). The script checks all of this and stops if the genes module changes. "Carries … dilute" follows the game's gene lines (`mod.genes.line_d_carry`, `line_e_carry`); the zh-Hans coat names are the game's (`data.words.lab.*`). Puppies go to named families for free, never sold (design rules). No 🍫 emoji anywhere: chocolate is a coat colour here, and our food posts say chocolate is never for dogs.

## Instagram
```
how many colours did you guess? 🎨 comment your number 👇 then see if you got all 3 🐾

two chocolate Labs 🤎 three puppies: one yellow 💛 one silver 🩶 one champagne 🥂 and not a single chocolate pup. we didn't see it coming either 😅

can chocolate lab puppies be yellow? yep 🧬 a chocolate Lab can carry hidden yellow and dilute genes 🤫 so two chocolate parents can still have yellow, silver and champagne puppies 🐶 for our pair chocolate was the likeliest at about 1 in 2, yellow and silver about 1 in 5 each, and champagne just 1 in 16 🍀✨

it's all in Doodle Doggo, our free cozy dog game where every puppy gets real coat genes ✏️ and goes to a named family 🏡 never sold 💕

#DoodleDoggo #Labrador #DogGenetics #CozyGames #PuppyLove
```
Job A (the Reel carries the hook) · one ask: comment · 5 hashtags · search: "chocolate lab puppies", "coat genes", "cozy dog game" · no link · 17 emoji (2.3 per 100 characters), none as bullets · linter READY · human score 77.8 PASS.

## YouTube Shorts

Title: `2 chocolate dogs had puppies. you won't guess the colours 🐾 #Shorts`

Description:
```
Our two chocolate Labradors had three puppies, and not one came out chocolate. Yellow, silver and champagne instead! Did you pause and guess?

Here's how it works. A chocolate Lab can carry hidden yellow and dilute genes (dilute makes a coat paler), and when both parents carry both, you can get chocolate (about 1 in 2), yellow or silver (about 1 in 5 each) or champagne (1 in 16) puppies. We didn't plan this pair, the genes did.

Doodle Doggo is our free cozy dog game, drawn in a pencil sketchbook, and every puppy you meet in it gets real coat genes from its mum and dad. Puppies go to named families for free. They're never sold, and nothing bad ever happens.

🎮 Play free: https://doodledoggo.app
🕹️ itch.io: https://an9ou.itch.io/doodle-doggo
☕ Support us on Ko-fi: https://ko-fi.com/doodledoggoapp
📷 Instagram: https://www.instagram.com/doodledoggo.app/

#DoodleDoggo #Shorts #Labrador #DogGenetics #CozyGames
```
Title off the hook (81.4 STRONG). Human score 90.1 PASS on the text (the link list is the same fixed block as the other Shorts; with it the detector reads its emoji as bullets).

## X (under 280 characters)
```
2 chocolate dogs had puppies. you won't guess the colours 🐾 yellow, silver AND champagne. not one chocolate! turns out both our Labs hide yellow and dilute genes, so the odds were about 1 in 5, 1 in 5 and 1 in 16. real coat genes: https://doodledoggo.app #DoodleDoggo #CozyGames
```
278 of 280 (the link counts as 23) · human score 87.2 PASS.

**Alt text:** `Two chocolate-brown crayon Labradors stand in a sketchbook yard, tagged mum: Chocolate and dad: Chocolate, with a note that both carry yellow and dilute genes. Three question marks appear and count down 3, 2, 1. Then three puppies pop in one by one: a yellow one, about 1 in 5, a silver-grey one, about 1 in 5, and a pale champagne one, 1 in 16. Not one is chocolate. It ends on "did you guess all 3?" and the Doodle Doggo logo.`

## RedNote / 小红书 (Simplified Chinese, no link)

Owner approved the English cut (1 Nov 2026). Post `doodle-doggo-puppy-colours-rednote.mp4` (9:16, like the other RedNote videos) with the 3:4 cover `brand/rednote/rednote-05-pups.jpg` as the video's custom cover (`make.js shots pupsposter`, `pups_reel/make_pups_poster.js`). `pups-cover-rednote.jpg` is a spare 9:16 cover.

On the video: "两只巧克力色狗狗生了小狗 / 你猜不到是什么颜色", the tags "妈妈：巧克力色" / "爸爸：巧克力色" and "都携带黄色和淡化（更浅的毛色）", "先暂停，猜一猜 / 会有几种颜色？" with 3-2-1, the puppies 黄色 (大约5分之一), 银色 (大约5分之一), 香槟色 (16分之一), "一只巧克力色都没有！", "两只都是巧克力色 / 但都藏着黄色和淡化的基因 / 这个游戏里，小狗的毛色按真实的遗传规律", and the end page "你猜对几只？", "免费的治愈系狗狗游戏，毛色遗传是真的", "搜索 Doodle Doggo 就能玩". The cover hides the answer: the two parents, the clue and three question marks, with the sticker "先猜再看 / 评论区见".

标题 (title, 15 characters; 20 max):
```
两只巧克力色狗狗，生了3只小狗🐶
```

> Two chocolate dogs had 3 puppies.

正文 (text):
```
先暂停猜一猜：3只小狗是什么颜色？🎨

答案是：黄色💛 银色🩶 香槟色🥂
一只巧克力色都没有！😂

为什么会这样？🧬
拉布拉多的毛色由基因决定。巧克力色的狗狗，也可能偷偷携带黄色和淡化的基因（淡化会让毛色更浅）。爸爸妈妈都带着的话，小狗可能是：
🤎 巧克力色：大约2分之一
💛 黄色：大约5分之一
🩶 银色：大约5分之一
🥂 香槟色：16分之一

这是我们做的免费小游戏 Doodle Doggo：每只小狗都有真实的毛色基因，要送养的小狗会免费送到有名字的家庭，从不出售。没有广告，浏览器直接玩，搜索 Doodle Doggo 就能找到

你一开始猜的是几种颜色？评论区告诉我们～

#DoodleDoggo #拉布拉多 #狗狗毛色 #养狗知识 #萌宠 #小狗 #治愈系游戏 #独立游戏 #我在小红书做游戏 #蜡笔画
```

> Pause and guess: what colours are the 3 puppies?
> The answer: yellow, silver, champagne. Not one is chocolate!
> Why? A Labrador's coat colour comes from its genes. A chocolate dog can secretly carry yellow and dilute genes (dilute makes the coat paler). If mum and dad both carry them, the puppies can be: chocolate about 1 in 2, yellow about 1 in 5, silver about 1 in 5, champagne 1 in 16.
> This is our free little game Doodle Doggo: every puppy has real coat genes, and puppies going to new homes go free to named families, never sold. No ads, plays in your browser; search Doodle Doggo to find it.
> How many colours did you guess at first? Tell us in the comments!

Checked by hand (the skills read English only): coat names are the game's zh-Hans (`data.words.lab.liver/lilac/cream`, `data.starter_genes.lab.coat`), the odds are the game's `predict()` in its own zh words (`mod.genes.odds_about_1_in`, `odds_1_in`), "携带淡化" follows `mod.genes.line_d_carry`, no link anywhere, no 繁殖/配种 or "卖", title 15 characters. Hashtag #我在小红书做游戏 from `REDNOTE_TRENDS.md`. Every box on the video and the cover passed the centre check.
