# v2.23.2 "廣東話 Cantonese" launch post (draft, 9 Nov 2026)

GM briefing (9 Nov 2026): v2.23.2 is live on doodledoggo.app, itch.io (2.23.2) and GitHub. The game speaks spoken Hong Kong Cantonese in Traditional characters, checked line by line by a native speaker from Hong Kong (thanked in "What's new"). **12 languages** now. The site has /yue/ pages (https://doodledoggo.app/yue/) and opens in Cantonese for browsers set to zh-HK or zh-MO. **Draft only: nothing is posted until the owner approves.** No Threads (owner, 9 Nov 2026: no Threads account). No flags in captions or pictures.

Picture: not made yet. Suggestion: one screenshot of the game in Cantonese (Noodle in the yard with a Cantonese speech bubble) or a 3-slide carousel (title screen, a dog line, the "What's new" thank-you). Make it only when the owner asks.

## Instagram (HK followers first, one English line for everyone else)

```
Doodle Doggo 識講廣東話喇！🐶

我哋啲歪歪扭扭嘅蠟筆狗狗，今日開始識講廣東話 🎉 成個遊戲都係廣東話（繁體字），仲係由香港朋友逐句睇過㗎，多謝晒佢 💛

揀一隻蠟筆狗狗返屋企，帶佢喺鉛筆畫嘅小鎮散步、種菜、整狗狗小食，仲可以去朋友屋企探佢嘅狗狗 🏡 呢度乜嘢壞事都唔會發生。

免費，唔使下載，手機同電腦都玩得 ✏️

你會帶邊隻狗狗返屋企？留言話我知 👇

Doodle Doggo now speaks Cantonese, our 12th language 🐾

#DoodleDoggo #廣東話 #香港 #CozyGames #狗狗
```
One ask (留言話我知). No link in the caption (link in bio). 40 dogs and 12 languages are the true counts on 9 Nov 2026.

## RedNote / 小紅書 (Traditional Cantonese, RedNote rules: no link, no domain with a dot, no other platforms; a video would end on the QR end card)

Title (15 characters with the emoji):
```
蠟筆狗狗識講廣東話喇🐶
```

Body:
```
Doodle Doggo 今日開始識講廣東話 🎉 繁體字，香港朋友逐句睇過，多謝晒 💛

40隻歪歪扭扭嘅蠟筆狗狗，散步、種菜、整狗狗小食，仲可以同朋友嘅狗狗做朋友 🏡 呢度乜嘢壞事都唔會發生。

免費，唔使下載。瀏覽器搜 Doodle Doggo App 就玩得 ✏️

你最想要邊隻狗狗？留言話我知 👇
```
Tags: #廣東話 #香港 #治愈系遊戲 #蠟筆畫 #狗狗 #獨立遊戲

## X (under 280)

```
Doodle Doggo now speaks Cantonese 🐶 our 12th language, checked line by line by a friend from Hong Kong 💛 a free cozy dog game with 40 wobbly crayon dogs, in your browser. which language do you play in? doodledoggo.app/yue/
```

## Poster (11 Nov 2026, draft: not posted until the owner approves)

File: `brand/instagram/launch/cantonese_post/cantonese-launch.jpg` (1080 x 1350, Instagram). Build script: `brand/instagram/launch/cantonese_post/build_cantonese_post.js`.

Headline 「Doodle Doggo 識講廣東話喇！」 with "now in Cantonese · our 12th language" under it; the pill 「多謝香港朋友逐句幫我哋睇過」; the logo and doodledoggo.app at the bottom. No flags, no other links. Dogs and logo are today's art from origin/main (913a3539). Chinese text is Iansui (the face the game uses for yue and zh-Hant), Latin text is Caveat.

The three bubbles quote the game's Cantonese text exactly (`game/i18n/yue.json` on main; the build stops if a line no longer matches):
- Noodle the Dachshund: 「扭呀扭。後面嗰半遲到咗。」 `data.sig.dachs.say` ("Wiggle wiggle. The back half is late.")
- Peanut the Chihuahua: 「我係八號風球！！」 `data.sig.chihuahua.say` ("I AM A WEATHER EVENT.", here Typhoon Signal No. 8)
- Sunny the Golden Retriever: 「睇下我搵到乜！」 `data.sr_lines.fetch.2` ("Look what I found!")

Rebuild (checks: bubble and pill text ink-centred, headline centred, dogs apart, nothing closer than 20 px, 60 px margins):
```
git worktree add --detach <scratch>/main origin/main
ART_ROOT=<scratch>/main NODE_PATH=$(npm root -g) node brand/instagram/launch/cantonese_post/build_cantonese_post.js
```
