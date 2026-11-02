# v2.19 "Friends first": launch Reel and "add a friend in 3 steps" carousel (2 Nov 2026)

Owner's go-ahead (2 Nov 2026, via the Game Manager): the launch Reel and the carousel, English first, ready before **Sat 7 Nov 2026 00:00 JST**. **Nothing is posted before then.** Plan: `V219_FRIENDS_FIRST.md`. The RedNote cut and its 3:4 cover come after the owner approves the English.

## Status: preview, waiting for two things

1. **The owner's approval** of the English Reel and carousel (the preview files below).
2. **Our real friend name and code** from the live game on 7 Nov (the Game Manager sends them). The previews use a placeholder name (Waggy Clover) and the placeholder code `DOG-XXXXX`, and every frame or slide that shows our card carries a red "placeholder: our real code on 7 Nov" patch over the QR and the code. **Never post the preview files.**

On 7 Nov, with the code, re-shoot and rebuild (about 15 minutes; also picks up any layout tweaks from the Friends fit pass):
```
git fetch origin <main or the v2.19 dev branch>; git worktree add <dir> FETCH_HEAD     # the v2.19 build (art, Friends screens)
cd <dir> && node game/build.js && node game/harness.js merged && cd -
OUR_NAME=<word A index>,<word B index> NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/capture_clean.js <dir> <clean>        # Reel footage (clean)
OUR_CODE=DOG-XXXXX OUR_NAME=<a>,<b> NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/capture_friends.js <dir> <footage>   # carousel screens
python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro model dir> <vo>                                                  # Noodle's voice (see the top of the file)
OUR_CODE=DOG-XXXXX OUR_NAME=<a>,<b> NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/build_friends.js <dir> <clean> <work> <vo>   # the Reel
NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/make_friends_cover.js <dir> <out>         # its cover
NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/build_carousel.js <dir> <footage> <out>  # 8 slides
```
`OUR_NAME` is the pair of Dog Card word indices (`DC_WORDS_A`, `DC_WORDS_B` in `game/src/40_dogcards.js`; Waggy Clover is `25,6`). With `OUR_CODE` set, no placeholder patch is drawn and the QR on our card is the real invite link (`doodledoggo.app/f/<code>`), scannable.

## Files (`brand/instagram/launch/friends_reel/`)

| File | What |
|---|---|
| `preview/doodle-doggo-friends-PREVIEW.mp4` | The Reel: **one cut for every platform** (Instagram Reels, YouTube Shorts, TikTok, X). 1080 x 1920, 30 fps, 32 s, Noodle's voice over the game's own cozy music (the yard by day), a soft tick as each numbered way pops in and the "discover" sting on the end page. |
| `preview/friends-cover-PREVIEW.jpg` | The cover, its own design (owner, 2 Nov 2026: not a frame of the Reel): the autumn yard, Noodle the dachshund (the Reel's narrator) and Waffles the Corgi nose to nose under a pink heart, Honey the Golden puppy in her party hat, the hook card "4 ways your dog can make friends", a "(no chat)" sticker and "new: Friends in Doodle Doggo". All of it inside the grid's 3:4 crop. `make_friends_cover.js` (no code on it, so nothing to redo on 7 Nov). |
| `preview/friends-carousel-PREVIEW-1.jpg` … `-8.jpg` | The carousel, 1080 x 1350. |
| `capture_clean.js` | The Reel's footage: the same build and mock with every game bar, button, sheet, toast and speech bubble hidden, so only the scenes are filmed. |
| `capture_friends.js` | The carousel's screens: records the real v2.19 Friends screens (iPhone 15 profile, DPR 3) with Friends turned on and the Worker mocked as `game/test_v219_friends.js` does. The clips are shot at full resolution with the page clock slowed (each frame stamped with its game time), so the motion plays at 30 fps. |
| `build_friends.js`, `build_carousel.js`, `make_friends_cover.js` | The Reel and the carousel. Every text in a box is ink-centred with `centre_text.js` and checked by `centreCheck()` on every frame and slide (the build stops if anything is more than 1.5 px off). Our card on the last frame / slide is drawn from the game's own card art and QR module (`PawArt.FRIENDS.card`, `mods/qr.js`). |

**The footage:** in the Reel our dog is Noodle the dachshund (the narrator, brown); in the carousel's screens it is Mochi the Shiba (orange). The friend is a made-up player, "Sunny Biscuit" (two Dog Card words), with Waffles the Corgi and Honey the Golden puppy in a party hat, in an autumn yard. No black or white dog is the subject. The friend's code is never shown: it is typed off camera.

## The Reel

Hook (`ig-reel` hookscore 80.1 STRONG, the best of 18): **"4 ways your dog can make friends (no chat)"**.

**Told by Noodle, like our first video** (owner, 2 Nov 2026: "narratives like our first video, introducing the new features"). Noodle the dachshund narrates in the 45 s promo's voice (Kokoro "af_bella" at 1.1x, `vo_friends.py`), with a small deadpan joke after each feature, over clean game scenes with no game interface (`capture_clean.js` hides every bar, button, sheet, toast and speech bubble). Noodle is our dog in the footage now (as in the promo and the profile picture). 32 s; each shot lasts its line.

| Shot | Noodle says | On screen |
|---|---|---|
| Noodle at home in the autumn yard, drinking from his water bowl (head straight down to the bowl, side-on: the eat/drink fix d488723) | "Big news! Our dogs can make friends now!" | "4 ways your dog can make friends (no chat)", sticker "new update · 7 Nov" |
| Our friend card on the paper (the game's card art) | "Pick a friend name, share your code, and your dog can visit theirs!" | "share your code" |
| Sunny Biscuit's yard, the game's own greeting: Noodle walks in, he and Waffles sniff noses with hearts; Honey (back row) gets petted; nobody overlapping | "Visit their yard! Pet their dogs! This is Waffles. Waffles likes me." | "1. visit & pet" |
| The pink paw stamp lands on their path (Noodle sits this shot out: his tail covers the stamp's spot on a phone) | "Leave a paw-print note! Mine says: your dog is so fluffy!" | "2. paw-print note" |
| The wrapped gift flies off | "Send a gift, once a day! I sent a biscuit. I did not eat it first." | "3. send a gift" |
| The walk: Noodle hops a sprinkler and Waffles hops right after him, Noodle ducks a kite (a window on the paper) | "And take their dog on your walk! Waffles is faster than me." *(beat)* "I let her win." | "4. walk together" |
| Noodle and Waffles play (the greeting goes on): play bows and jumps back and forth, hearts | "No chat. No messages. Just dogs, being friends!" | "no chat. no messages." |
| End page: "add us!", our card, the logo | "Friends arrives on November seventh! Drop your friend code below!" | "drop your code below", "new update · 7 Nov" |

Every line is true to the game: "Your dog is so fluffy!" is the first of the 12 preset notes, gifts are one a day, Waffles is the friend's Corgi (she), and no typed message leaves the device.

Facts checked against `V219.md` and the game: the name is two Dog Card words on two wheels; one code, shared by invite link, Copy code or the QR; visits are read-only; pets give +1 Bond on both sides; notes are 12 preset lines (no typed text leaves the device); one gift a day, arriving as a mailbox letter; a friend's dog can join your walk and they get a walk letter; no chat, no search, no directory; remove or block any time; 11 languages.

### Instagram
```
comment your friend code below 👇 we're swapping codes all week 🐾 (ours is at the end of the Reel 🎴)

Friends just landed in Doodle Doggo 🎉 you pick a name from 2 Dog Card words, like Waggy Clover, and get 1 code to share 🎴 then your dog can visit theirs 🏡 pet their dogs for +1 Bond on both sides 🐶 leave 1 of 12 paw-print notes 💌 send 1 gift a day 🎁 or take their Corgi along on your walk 🦮

no chat and no messages, ever 🤐 notes come from a list of 12, you only add someone by their code or link, and you can remove or block any time 🔒 a cozy dog game to play with friends, and safe for kids too 💛

free, in 11 languages, on phone and computer ✏️

#DoodleDoggo #CozyGames #DogGames #IndieGame #GamesWithFriends
```
Job A (the Reel carries the hook) · one ask: comment (your friend code) · 5 hashtags · search: "cozy dog game", "friend code", "play with friends" · no link · 15 emoji (2.1 per 100 characters), none as bullets · linter READY · human score 77.0 PASS.

"Waggy Clover" in the caption is an example name. If our real name differs, it can stay as the example.

### YouTube Shorts

Title: `4 ways your dog can make friends in a cozy game (no chat) 🐾 #Shorts`

Description:
```
Friends just landed in Doodle Doggo, our free cozy dog game. You pick a friend name from two Dog Card words, share one code (or a QR, or an invite link), and then your dog can visit your friend's dog.

Once a day you can pet their dogs (+1 Bond for both of you), leave one of 12 paw-print notes, send a gift that lands in their mailbox, or take one of their dogs along on your walk. You don't need to be online at the same time.

There's no chat and no messages, ever: the notes come from a list. You can only add someone by their code or link, and you can remove or block a friend any time. Drop your friend code in the comments and swap with other players!

🎮 Play free: https://doodledoggo.app
🕹️ itch.io: https://an9ou.itch.io/doodle-doggo
☕ Support us on Ko-fi: https://ko-fi.com/doodledoggoapp
📷 Instagram: https://www.instagram.com/doodledoggo.app/

#DoodleDoggo #Shorts #CozyGames #DogGames #IndieGame
```
Title off the hook (80.1 STRONG). Human score 78.3 PASS on the text (the link list is the same fixed block as the other Shorts).

### X (under 280 characters)
```
4 ways your dog can make friends in a cozy game (no chat) 🐾 we added Friends to Doodle Doggo: visit a yard, pet their pup, leave 1 of 12 paw-print notes, send a gift, walk their dog. no messages to type. drop your code below! https://doodledoggo.app #DoodleDoggo #CozyGames
```
273 of 280 (the link counts as 23) · human score 77.2 PASS.

**Alt text:** `Noodle, a crayon dachshund, tells the story in a sketchbook autumn yard, under the words "4 ways your dog can make friends (no chat)" and a sticker "new update, 7 Nov". His friend card appears, then four numbered scenes from the game: he visits a friend's yard where a Corgi named Waffles and a Golden puppy get petted, a pink paw print stamps onto their path, a wrapped gift flies off, and Waffles runs beside him on a walk. "No chat. No messages." It ends on "add us!", our friend card and "drop your code below".`

## The carousel ("add a friend in 3 steps", 8 slides)

1. **Cover:** "add a friend in 3 steps" over the visit screen (Mochi, Waffles and Honey in Sunny Biscuit's yard), "your dog visits theirs. no chat, no messages.", pill "new in Doodle Doggo". (Not the Friends badge: one of its two dogs is white.)
2. **The stake:** "visit a friend's yard", "pet their dogs, leave a paw print.", the visit with Waffles saying her line after a pet.
3. **Step 1:** "pick your friend name", "tap More, then Friends. turn the two wheels, like Waggy Clover." The More tray with Friends, an arrow to the name wheels.
4. **Step 2:** "share your code", "Share invite, Copy code, or let them scan your QR." Our card (placeholder patch in the preview).
5. **Step 3:** "add theirs", "type their DOG- code, or open their invite link." The Add a friend boxes and the friend on the list with Visit and Gift.
6. **"then, once a day:"** four screens: pet their dogs, leave a paw print, send a gift, walk their dog.
7. **Recap:** "3 steps, 1 minute": 1. More, then Friends: pick a name / 2. share your code or QR / 3. add theirs: code or link / then visit, pet, leave a paw print, send a gift, walk their dog / no chat. no messages. remove or block any time.
8. **CTA:** "add us!", our card, "then drop your friend code in the comments".

Step bubbles read "1.", "2.", "3.". Handle on every slide, numbered 1/8 … 8/8. The ask matches the Reel (friend codes in the comments, the plan's one angle), so slide 7 is a recap, not "save this".

### Instagram (carousel)
```
comment your friend code below 👇 then grab a few from other players 🐾 adding a friend takes 3 steps and about 1 minute ⏱️

step 1: tap More 👉 then Friends 🐶 and turn the 2 wheels 🎡 to pick your friend name, like Waggy Clover 🍀
step 2: share your friend code with Share invite or Copy code, or let them scan the QR on your card 🎴
step 3: add theirs. type their DOG- code or open their invite link 🔗 that's it!

then, once a day, your dog can visit their yard 🏡 pet their dogs for +1 Bond each 💕 leave a paw-print note 💌 send a gift 🎁 and take one of their dogs along on your walk 🦮

no chat. you never type a message 🤐 and you can remove or block a friend any time 🔒 a cozy dog game to play with friends, free on your phone or computer 📱✏️

#DoodleDoggo #CozyGames #DogGames #IndieGame #GamesWithFriends
```
Job B (the caption carries the steps) · one ask: comment (your friend code) · 5 hashtags · search: "cozy dog game", "friend code", "play with friends" · no link · 19 emoji (2.4 per 100 characters), none as bullets (the steps start with "step 1:") · linter READY · human score 75.4 PASS.

**Alt text (cover):** `A sketchbook page titled "add a friend in 3 steps" over a game screen of a friend's autumn yard, where a crayon Shiba, a Corgi and a Golden puppy in a party hat stand together, and the line "your dog visits theirs. no chat, no messages."`

## RedNote / 小红书 (Simplified Chinese, no link)

Owner asked for it (2 Nov 2026, "make the rednote version") and chose a Mandarin voice (choice window: "Chinese voice (Kokoro)"). Post `brand/instagram/launch/friends_reel/preview/doodle-doggo-friends-rednote-PREVIEW.mp4`'s final cut (made on 7 Nov with our real code, like the English one) with the 3:4 cover `brand/rednote/rednote-06-friends.jpg` as the video's custom cover. **Never post the PREVIEW**: placeholder name and code with a red 占位 patch.

- **Voice:** Noodle in Mandarin, Kokoro v1.1-zh (`zf_001`, 1.1x) with misaki's Chinese G2P, `vo_friends_zh.py` (setup at the top of the file; jieba may need its sdist on PYTHONPATH). Checked by speech-to-text (faster-whisper small): every line reads back as written (摸摸 came back as the homophone 默默, 爪印 as 找印). Waffles is said and written 华夫. 38.6 s.
- **Footage:** the same clean scenes shot in the zh-Hans game (`PAW_LANG=zh-Hans capture_clean.js`); the yard's "veggies!" and "garden" signs are English in the Chinese game too (scene art).
- **Words:** the game's zh-Hans Friends words (fr.*, nw.v219.*): hook "狗狗交朋友的 / 4种方式 / （不用聊天）", sticker "新版本 · 11月7日", "分享你的好友码", "1. 去院子做客", "2. 留个爪印", "3. 送一份礼物", "4. 一起散步", "没有聊天，没有私信。", end page "加我们好友！", our card with its Chinese friend name (the game's zh Dog Card words), "在评论区留下你的好友码", the logo. Subtitles of every line. Owner's rule: 没有聊天，没有私信, never 不用打字. **No QR on RedNote** (a QR is a link): a pink paw sits in the card's QR tile on the 7 Nov cut.
- **Cover:** `make_friends_cover.js` with `REDNOTE=1`: the English cover's design in Chinese, cut to 1080 x 1440: "狗狗交朋友的 / 4种方式", "（不用聊天）", "Doodle Doggo 好友功能来啦！".
- **7 Nov:** `PAW_LANG=zh-Hans capture_clean.js`, then `REDNOTE=1 OUR_CODE=… OUR_NAME=… build_friends.js <dev> <clean_zh> <work> <vo_zh>`.

标题 (title, 15 characters with the emoji; 20 max):
```
狗狗交朋友的4种方式🐶不用聊天
```

> 4 ways your dog can make friends, no chat needed.

正文 (text):
```
Doodle Doggo 好友功能来啦！🎉 11月7日上线

选一个好友名（两个词，和狗狗卡片用的一样），分享你的好友码🎴 然后你的狗狗就能：
🏡 去好友的院子做客，摸摸好友的狗狗，双方+1亲密度
🐾 留个爪印：从12张小纸条里选一张
🎁 每天送一份礼物：零食、种子或菜园里的东西
🦮 带好友的狗狗一起散步，好友还会收到一封信

没有聊天，没有私信🤐 小纸条都是选好的，只有用好友码或邀请链接才能加好友，随时可以删除或屏蔽🔒 小朋友玩也放心💛

我们的好友码在视频最后👀 评论区交换好友码吧～👇

免费，没有广告，浏览器直接玩，搜索 Doodle Doggo 就能找到

#DoodleDoggo #交换好友码 #治愈系游戏 #独立游戏 #我在小红书做游戏 #狗狗 #萌宠 #柯基 #腊肠犬 #蜡笔画
```

> Doodle Doggo's Friends is here! Out on 7 Nov.
> Pick a friend name (two words, the same as on Dog Cards), share your friend code, and then your dog can: visit a friend's yard and pet their dogs (+1 Bond for both); leave a paw print, one of 12 notes; send a gift once a day (a snack, seeds or something from the garden); take a friend's dog on your walk, and they get a letter.
> No chat, no messages. The notes are ready-made, you can only add a friend by friend code or invite link, and you can remove or block any time. Safe for kids too.
> Our friend code is at the end of the video. Swap friend codes in the comments!
> Free, no ads, plays in your browser; search Doodle Doggo to find it.

Checked by hand (RedNote rules): no link, no QR, title 15 characters with the emoji (20 max), the game's own zh-Hans words (好友名, 好友码, 做客, 摸摸, 亲密度, 留个爪印, 小纸条, 送一份礼物, 一起散步, 删除, 屏蔽), one ask (评论区交换好友码). On 7 Nov the post goes up after 00:00 JST, when Friends is live. The "carousel" as a RedNote 图文 ("3步加好友") comes next.

## Fixes after the owner's first look (2 Nov 2026)

- **Pill and box text off centre** ("new in Doodle Doggo" and the others): the pages measured the text before the Caveat face had loaded (a page with no text yet loads no web font), so every box was sized and placed for a wider fallback face, about 50 px to the left. The check measured with the same face and passed. Fixed at the source: `centre_text.js` now refuses to measure a face that isn't loaded, and the builds load Caveat first.
- **Dots after the numbers:** "1." to "4." in the Reel, "1." to "3." on the carousel's steps and recap.
- **Reel cover:** its own design (`make_friends_cover.js`) instead of a frame from the first second.
- **One cut for every platform** (owner, 2 Nov 2026: on Shorts some words were hidden): Shorts, Reels and TikTok cover the right side (buttons) and the top and bottom (titles, names, captions). Every word of ours now sits inside x 60..890, y 250..1440 of the 1080 x 1920 frame, centred on x 475, and the build stops if any text leaves that area (`safeCheck()` in `build_friends.js`). The game screen still fills the frame behind. Where the game's own sheet sits at the bottom of the phone, the screen slides up over the paper (the gift bag), or down below the caption (the mailbox), so the thing being shown stays in the clear area.
- **Fewer words on screen** (owner, 2 Nov 2026): short labels that name each feature instead of sentences, smaller caption cards, the safety card down to one line, and the end page down to the ask, our card, the logo and the link.
- **Safe zone for boxes too** (owner, 2 Nov 2026, with screenshots of the posted puppy-colour Reel): the check now covers every card, bubble, pill and window, not only the words, with Instagram's measured zones; the caption cards moved down a little and their pop-in bounce is smaller. `preview/instagram-zones-check.png` shows frames with Instagram's zones in red.
- **Clean Reel, introducing the update** (owner, 2 Nov 2026): no game interface on screen at all, only the scenes; the name-wheel, code, mailbox and safety shots are gone; a "new update · 7 Nov" sticker on the hook and the end page. 16.4 s (was 25.1 s).
- **Narrated by Noodle** (owner, 2 Nov 2026): told like our first video (the 45 s promo), in the same voice, with Noodle as our dog in the footage; 32 s.
- **Opening shot re-shot with the eat/drink fix** (owner's bug report, 2 Nov 2026; Game Manager fix d488723 on the v2.19 dev branch): `capture_clean.js` now has Noodle drink from the water bowl on purpose in the yard shot, so the fixed pose (head lowered straight to the bowl, in profile) is on screen; the whole clean footage was re-captured from that build and the Reel rebuilt (32 s, centre and safe-zone checks pass).
- **More interaction, no overlapping** (owner, 2 Nov 2026): the owner chose a real greeting in the game over staging it in the Reel. The Game Manager added it to v2.19 (b2ceb6e on the dev branch): on a friend's yard our leader walks in to their leader, the two sniff nose to nose with hearts, then play bows and jumps (~7 s), and no dog is drawn over another (phones fit a pack in two rows). `capture_clean.js` films it with `window.__paw.fr.greet()` and pets Honey meanwhile; the visit and the "no chat" shots are the game exactly as players see it. (`stageInit` in the capture loads the friend yard's state through one line added to a copy of the test page; it now only pets by name and drives the walk.)
- **The walk, no bonks and no touching** (owner, 2 Nov 2026): Waffles followed with her nose on Noodle's tail (the game's follow gap is 8 units), so the capture moves the friend's dog 14 px further back (`.pw-fol.pw-friend{translate:-14px 0}`); the window on the paper is wider (540 of the shot) so Noodle's nose stays inside. Noodle used to bonk into a log in the shot (he goes see-through for a moment); `stageInit`'s `autoRun()` now plays the run with the game's own keys (a tap jump timed by the obstacle's speed, a duck under the high things) and the capture prints `walk bonks 0`. The follower copying the leader's hop is the game's own behaviour.
- **Subtitles** (owner, 2 Nov 2026: "add the subtitles"): Noodle's words in short one-line chunks, cream words on an ink pill, a quick fade, timed by each chunk's share of its line (Kokoro gives no word times). They sit under the feature label on the game scenes (sky and fence, clear of the dogs), under the sticker on the hook, under the card on the code page and at the foot of the end page, which is a little more compact to make room (card 2.1x, the rest moved up ~60-90 px). All inside SAFE, centred, checked every frame. The words are `SUBS_TX` in `build_friends.js`; if `vo_friends.py` changes a line, change its chunks too (the build stops if a line has none). RedNote: Chinese subtitles come with the RedNote cut.
