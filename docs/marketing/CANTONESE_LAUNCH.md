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

## Poster (12 Nov 2026 redo, draft: not posted until the owner approves)

File: `brand/instagram/launch/cantonese_post/cantonese-launch.jpg` (1080 x 1350, Instagram). Build script: `brand/instagram/launch/cantonese_post/build_cantonese_post.js`.

Owner's changes (12 Nov): a hook headline and the game background. Line 1 is the hook 「勁正！」, big pink-red with a cream and an ink outline in a yellow crayon sticker burst. Line 2 is a cream card with 「Doodle Doggo 識講廣東話喇！」 and "now in Cantonese · our 12th language". **Before posting, the owner's Hong Kong friend should check 「勁正！」 as the hook.** Behind everything is the game's own Mt. Fuji Lookout on an autumn day (`PawArt.scene('fujihill', { season: 'autumn', v215: true })`, today's art from origin/main 7a85ce30, no game UI, the corner tapes left out). All text sits on solid cards, bubbles or pills. The dogs stand on the meadow in front of the torii, lanterns and bench, and their heads stay below those objects' feet. At the bottom are the thank-you pill 「多謝香港朋友逐句幫我哋睇過」 and a cream card with the logo and doodledoggo.app. No flags, no other links. Chinese text is Iansui (the face the game uses for yue and zh-Hant) and Latin text is Caveat.

The three bubbles quote the game's Cantonese text exactly (`game/i18n/yue.json` on main; the build stops if a line no longer matches; the line breaks are only for the bubbles):
- Noodle the Dachshund: 「扭呀扭。後面嗰半遲到咗。」 `data.sig.dachs.say` ("Wiggle wiggle. The back half is late.")
- Peanut the Chihuahua: 「我係八號風球！！」 `data.sig.chihuahua.say` ("I AM A WEATHER EVENT.", here Typhoon Signal No. 8)
- Sunny the Golden Retriever: 「睇下我搵到乜！」 `data.sr_lines.fetch.2` ("Look what I found!")

Known small point: the tops of two stone lanterns and the end of the bench sit behind the bubbles. The dogs and the torii are clear.

Rebuild (checks: text ink-centred in every burst, card, bubble and pill, logo row centred, dogs apart, nothing closer than 20 px, 60 px margins, dogs' heads below the scene objects' feet):
```
git worktree add --detach <scratch>/main origin/main
ART_ROOT=<scratch>/main NODE_PATH=$(npm root -g) node brand/instagram/launch/cantonese_post/build_cantonese_post.js
```
