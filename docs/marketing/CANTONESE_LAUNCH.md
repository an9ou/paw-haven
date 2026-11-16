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

## Posters (16 Nov 2026, owner's review; drafts: nothing is posted until the owner approves)

Two versions with the same words. The hook is 「勁正！」, the headline 「Doodle Doggo 識講廣東話喇！」 and the English line "now in Cantonese · our 12th language". The thank-you line is 「多謝香港朋友逐句幫我哋睇過」, and the logo sits with doodledoggo.app. **Before posting, the owner's Hong Kong friend should check 「勁正！」 as the hook.** Chinese text is Iansui (the face the game uses for yue and zh-Hant) and Latin text is Caveat. All art is today's, from origin/main e3be5e8f. No flags.

The three bubbles quote the game's Cantonese text exactly (`game/i18n/yue.json` on main; both builds stop if a line no longer matches; line breaks and vertical setting are only for the bubbles):
- Noodle the Dachshund: 「扭呀扭。後面嗰半遲到咗。」 `data.sig.dachs.say` ("Wiggle wiggle. The back half is late.")
- Peanut the Chihuahua: 「我係八號風球！！」 `data.sig.chihuahua.say` ("I AM A WEATHER EVENT.", here Typhoon Signal No. 8)
- Sunny the Golden Retriever: 「睇下我搵到乜！」 `data.sr_lines.fetch.2` ("Look what I found!")

### 1. Mt. Fuji Lookout: `brand/instagram/launch/cantonese_post/cantonese-launch.jpg`
Build: `build_cantonese_post.js`. The hook is in a yellow sticker burst, with the headline card under it. The game's Mt. Fuji Lookout on an autumn day fills the poster (v215 art, no game UI). Changes from the owner's review:
- All three bubbles sit in open sky and lake, with no prop under or touching them. A new pixel check (`prop_check.js`) keeps every bubble, dog and card at least 12 px clear of the scene's props (lanterns, torii, shrine, bench, bowl).
- The scene is drawn a little smaller so the dogs are bigger and the middle around Fuji is filled. The dogs stand on the meadow, clear of the props.
- The English line is bigger and darker.
- Peanut's line is on one line.
- The footer logo is bigger.

### 2. Japan style: `brand/instagram/launch/cantonese_post/cantonese-launch-japan.jpg`
Build: `build_cantonese_japan.js`.
- 「勁正！」 is a red hanko seal, set vertically.
- The headline hangs on an indigo noren, one character per panel, with "Doodle Doggo" on the top band. The English line is on a paper strip.
- The game's Asakusa (the Tokyo trip) on an autumn day sits in a wooden frame. Its tap outlines and corner tapes are left out.
- Peanut's and Sunny's lines are set vertically in manga-style bubbles beside the picture. Noodle's bubble is above him.
- The dogs stand on a wooden engawa.
- The thank-you strip and an ema plaque with the logo and doodledoggo.app sit at the bottom.
- Washi paper, a seigaiha wave border and crayon momiji leaves.

Rebuild both (checks: text ink-centred in every box, dogs apart, nothing closer than 20 px, 60 px margins; the Fuji poster also runs the prop check):
```
git worktree add --detach <scratch>/main origin/main
ART_ROOT=<scratch>/main NODE_PATH=$(npm root -g) node brand/instagram/launch/cantonese_post/build_cantonese_post.js
ART_ROOT=<scratch>/main NODE_PATH=$(npm root -g) node brand/instagram/launch/cantonese_post/build_cantonese_japan.js
```
