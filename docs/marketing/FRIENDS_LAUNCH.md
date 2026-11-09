# v2.19 "Friends first": launch Reel and "add a friend in 3 steps" carousel (2 Nov 2026)

> **Superseded (7 Nov 2026): the 6 Nov "final" Reel, cover, carousel and RedNote cut below were never approved and are replaced by the how-to.** The owner's changes of 7 Nov 2026: "put some in-game content, teach players how to use the function, how they can share the code through WhatsApp, IG, other social media platforms with the poster". The new English PREVIEW (a ~35 s how-to Reel in Noodle's voice with the real Friends screens, a crayon share menu with app names as text only, the poster as a chat message and a story; its own cover; an 8-slide carousel with the same steps) is in `brand/instagram/launch/friends_reel/howto/` (`*.*`, scripts `capture_howto.js`, `build_howto.js`, `build_howto_carousel.js`, `howto_art.js`, `howto_cover.js`, voice lines `vo_howto.json`); captions in `FRIENDS_REEL_CAPTIONS.md`, section "How-to version". The how-to ends on a code swap, never "add us" (owner, 7 Nov 2026: our account DOG-K3APZ holds 50 friends at most, adding is two-way and instant): "drop your friend code below / and add each other!" over comment bubbles with blank code boxes; Sunny Biscuit / DOG-K3APZ appears only as the demo player in the steps. Waiting for the owner's approval: do not post anything from this page, and make no final or RedNote cut of the how-to until the owner says yes.
>
> How the how-to was made (7 Nov 2026, main c23aba5):
> ```
> git worktree add --detach <dir> origin/main; cd <dir> && node game/build.js && node game/harness.js merged && cd -
> export NODE_PATH=$(npm root -g) OUR_CODE=DOG-K3APZ OUR_NAME=0,0
> node brand/instagram/launch/friends_reel/howto/capture_howto.js <dir> <ui>                       # the real Friends screens, our side and the friend's
> DOG_HEAD= DOG_NAME=Mochi node brand/instagram/launch/friends_reel/capture_clean.js <dir> <clean>  # visit, gift, walk with Mochi
> VO_LINES=brand/instagram/launch/friends_reel/howto/vo_howto.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo>
> PAR=5 node brand/instagram/launch/friends_reel/howto/build_howto.js <dir> <ui> <clean> <work> <vo>   # Reel + cover (ONLY=stills|cover, FRAMES=a-b, CHECK=1)
> node brand/instagram/launch/friends_reel/howto/build_howto_carousel.js <dir> <ui> <clean>          # 8 slides
> # the RedNote cut (7 Nov 2026, after the owner approved the English): the same, in the zh-Hans game and Mandarin
> PAW_LANG=zh-Hans node brand/instagram/launch/friends_reel/howto/capture_howto.js <dir> <ui_zh>
> PAW_LANG=zh-Hans DOG_HEAD= DOG_NAME=Mochi node brand/instagram/launch/friends_reel/capture_clean.js <dir> <clean_zh>
> VO_LINES=brand/instagram/launch/friends_reel/howto/vo_howto_zh.json PYTHONPATH=<jieba-0.42.1> python3 brand/instagram/launch/friends_reel/vo_friends_zh.py <kokoro dir> <vo_zh>   # PHON=1 prints misaki's readings
> REDNOTE=1 PAR=5 node brand/instagram/launch/friends_reel/howto/build_howto.js <dir> <ui_zh> <clean_zh> <work_rn> <vo_zh>   # writes ...-rednote.mp4 and brand/rednote/rednote-11-friends-howto.jpg
> ```
>
> **RedNote cut re-made (8 Nov 2026):** `howto/doodle-doggo-friends-howto-rednote.mp4` (1080 x 1920, 45.5 s, the same length as the 7 Nov cut) and its cover `brand/rednote/rednote-11-friends-howto.jpg`. RedNote throttled the 7 Nov cut because it named other platforms (owner: "we cannot include other social media platforms in the video, only can say share link and poster with friends"). Now: the voice line s3b says 把链接和海报分享给朋友！ (only that line re-voiced, zf_073 1.0x; the other lines are the 7 Nov takes), step card 分享给朋友; the crayon share menu says 发给朋友 / 复制链接 / 保存海报 / 更多… (no app names; 发给朋友 is the tapped row); the second phone is 保存海报 (the poster, no story bar) instead of 发朋友圈; the end card keeps the website QR to https://doodledoggo.app with 扫码就能玩 (owner, 9 Nov 2026: every RedNote version ends on it); our card (card.png) and the game's poster carry a pink paw in the QR tile (as `friends_card.js`), and the poster's "扫一扫，或添加 DOG-K3APZ / doodledoggo.app/f/…" lines become the game's own "添加 DOG-K3APZ" (`rnClean()` in `build_howto.js`). No platform name and no written domain anywhere; the end card's website QR is the only QR. Same footage (`ui_zh`, `clean_zh` of 7 Nov, main c23aba5).

Owner's go-ahead (2 Nov 2026, via the Game Manager): the launch Reel and the carousel, English first, ready before **Sat 7 Nov 2026 00:00 JST**. **Nothing is posted before then.** Plan: `V219_FRIENDS_FIRST.md`. The RedNote cut and its 3:4 cover come after the owner approves the English.

## Status: FINAL cuts made 7 Nov 2026 (JST) with our real friend name and code

v2.19 is live (7 Nov 2026 00:00 JST). The Game Manager sent the game's own Friends account: friend name **Sunny Biscuit** (Dog Card words A[0] + B[0], `OUR_NAME=0,0`; on RedNote 阳光饼干, the zh-Hans words), code **DOG-K3APZ**, invite link https://doodledoggo.app/f/DOG-K3APZ. The final Reel, cover, carousel and RedNote cut below carry them; the captions too. Posting is the owner's: nothing is posted by Marketing. (The owner had not yet said yes to the English previews when the finals were made: the finals are the approved-for-launch design with the real code, nothing new added.) The `preview/` files stay as they were (placeholder code, red patch): **never post a PREVIEW**.

How the finals were made (re-run the same way if anything changes; about 40 minutes with both Reels):
```
git fetch origin main; git worktree add --detach <dir> FETCH_HEAD     # the v2.19 build, main 940ed5e (FR_LIVE on)
cd <dir> && node game/build.js && node game/harness.js merged && cd -
export NODE_PATH=$(npm root -g) OUR_CODE=DOG-K3APZ OUR_NAME=0,0
node brand/instagram/launch/friends_reel/capture_clean.js <dir> <clean>                         # Reel footage (clean), English game
PAW_LANG=zh-Hans node brand/instagram/launch/friends_reel/capture_clean.js <dir> <clean_zh>     # the same in the zh-Hans game (can run at the same time: each capture writes its own page copy)
node brand/instagram/launch/friends_reel/capture_friends.js <dir> <footage>                     # carousel screens
python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo>                     # Noodle's voice, af_bella 1.1x
PYTHONPATH=<jieba-0.42.1 sdist> python3 brand/instagram/launch/friends_reel/vo_friends_zh.py <kokoro dir> <vo_zh>   # zf_073 1.0x; needs <kokoro dir>/config-v1.1-zh.json
node brand/instagram/launch/friends_reel/build_friends.js <dir> <clean> <work> <vo>                       # the Reel
REDNOTE=1 node brand/instagram/launch/friends_reel/build_friends.js <dir> <clean_zh> <work_zh> <vo_zh>   # the RedNote cut
node brand/instagram/launch/friends_reel/make_friends_cover.js <dir> <out>; REDNOTE=1 node brand/instagram/launch/friends_reel/make_friends_cover.js <dir> <out>
node brand/instagram/launch/friends_reel/build_carousel.js <dir> <footage> <out>                # 8 slides
```
`OUR_NAME` is the pair of Dog Card word indices (`DC_WORDS_A`, `DC_WORDS_B` in `game/src/40_dogcards.js`). Without `OUR_CODE` the builds draw the old red placeholder patch (preview mode).

### What changed from the previews (7 Nov 2026)

- **Our real card** on the Reel's code page and end page and on carousel slides 4 and 8: Sunny Biscuit / DOG-K3APZ, the QR of https://doodledoggo.app/f/DOG-K3APZ (the game's QR module; the game's own card on slide 4 shows the same QR), no placeholder patch. The card is drawn the way the 7 Nov game draws it (`friends_card.js`): the code in **DD Code** (the game's Atkinson Hyperlegible Bold subset, GM briefing 2 Nov 2026), the name in Caveat; RedNote: 阳光饼干 and a pink paw in the QR tile (no QR, no link).
- **The made-up friend is renamed "Cozy Maple"** (was "Sunny Biscuit": that turned out to be our own account's real name, so the friend list, the visit and the mailbox would have shown our own name as the friend's). `FRIEND_NAME` in the captures (default `2,14`); only the carousel's screens show it.
- **Dogs never touch (owner, 6 Nov 2026):** every Reel frame, every carousel slide and both covers now run `apartCheck()` (28 px). The captures save each dog's drawn box on every frame (`boxes.json`; shadows left out) and the builds mark them `data-apart`. To pass it: the game's greeting pair stands 16 world units apart instead of nose to nose (`PAIR_GAP`, set in the capture's own copy of the page; they still sniff toward each other with the game's hearts); on the carousel's visit the third dog (Honey) holds a free spot, the pair steps forward on the lawn, and the visit buttons are hidden for those shots; on the carousel's walk Waffles follows 14 px further back, as in the Reel. Covers: Noodle and Waffles face each other with clear space under the heart (no longer nose to nose), all three dogs a little smaller.
- **Carousel step 2** (GM briefing): "Share invite, Share poster, Copy code, or let them scan your QR.", and the window now shows the game's three buttons (Share invite, Share poster, Copy code) under the card. No "New code" button anywhere. Carousel slide 2 uses the visit clip at 2.4 s as before; slide 1 and the "pet their dogs" tile are cropped a little differently to keep all three dogs.
- **RedNote voice** re-made with the v1.1-zh vocab passed as `vocab_config` (`vo_friends_zh.py` now does this, as `vo_bedtime_walk_zh.py`): same lines, same voice zf_073 at 1.0x. The RedNote end page is unchanged in wording (owner: no re-render for the site wording).
- Captions: the real code and name where the previews had placeholders; carousel step 2 adds Share poster; RedNote: "浏览器搜 Doodle Doggo App 就能玩" (no domain with a dot, no 免费/无广告, REDNOTE.md 4 Nov 2026).

## Files (`brand/instagram/launch/friends_reel/`)

| File | What |
|---|---|
| **`doodle-doggo-friends.mp4`** (FINAL) | The Reel: **one cut for every platform** (Instagram Reels, YouTube Shorts, TikTok, X). 1080 x 1920, 30 fps, 32.0 s, 15.4 MB, Noodle's voice over the game's own cozy music (the yard by day), a soft tick as each numbered way pops in and the "discover" sting on the end page; our real card (Sunny Biscuit, DOG-K3APZ, scannable QR). |
| **`friends-cover.jpg`** (FINAL) | The cover, its own design (owner, 2 Nov 2026: not a frame of the Reel): the autumn yard, Noodle the dachshund (the Reel's narrator) and Waffles the Corgi facing each other under a pink heart (clear space between them, owner 6 Nov 2026), Honey the Golden puppy in her party hat, the hook card "4 ways your dog can make friends", a "(no chat)" sticker and "new: Friends in Doodle Doggo". All of it inside the grid's 3:4 crop. `make_friends_cover.js`. |
| **`friends-carousel-1.jpg` … `-8.jpg`** (FINAL) | The carousel, 1080 x 1350, with our real card on slides 4 and 8. |
| **`doodle-doggo-friends-rednote.mp4`** (FINAL) | The RedNote cut: 1080 x 1920, 42.2 s, 18.3 MB, Mandarin voice zf_073, Chinese subtitles, our card as 阳光饼干 / DOG-K3APZ with a pink paw in the QR tile. No QR, no link. |
| **`friends-cover-rednote.jpg`** (FINAL) = `brand/rednote/rednote-06-friends.jpg` | The RedNote 3:4 cover (1080 x 1440). |
| `preview/….*`, `preview/friends-cover-rednote.jpg` | The previews of 2 Nov (placeholder name and code): kept for reference, never posted. |
| `friends_card.js` | Our card as the 7 Nov game draws it (card art, QR or pink paw, name, code in DD Code), and the `data-apart` rects from the captures' dog boxes. |
| `capture_clean.js` | The Reel's footage: the same build and mock with every game bar, button, sheet, toast and speech bubble hidden, so only the scenes are filmed. |
| `capture_friends.js` | The carousel's screens: records the real v2.19 Friends screens (iPhone 15 profile, DPR 3) with Friends turned on and the Worker mocked as `game/test_v219_friends.js` does. The clips are shot at full resolution with the page clock slowed (each frame stamped with its game time), so the motion plays at 30 fps. |
| `build_friends.js`, `build_carousel.js`, `make_friends_cover.js` | The Reel and the carousel. Every text in a box is ink-centred with `centre_text.js` and checked by `centreCheck()` on every frame and slide (the build stops if anything is more than 1.5 px off). Our card on the last frame / slide is drawn from the game's own card art and QR module (`PawArt.FRIENDS.card`, `mods/qr.js`). |

**The footage:** in the Reel our dog is Noodle the dachshund (the narrator, brown); in the carousel's screens it is Mochi the Shiba (orange; also the dog of the game's real Friends account). The friend is a made-up player, "Cozy Maple" (two Dog Card words; "Sunny Biscuit" in the previews), with Waffles the Corgi and Honey the Golden puppy in a party hat, in an autumn yard. No black or white dog is the subject. The friend's code is never shown: it is typed off camera.

## The Reel

Hook (`ig-reel` hookscore 80.1 STRONG, the best of 18): **"4 ways your dog can make friends (no chat)"**.

**Told by Noodle, like our first video** (owner, 2 Nov 2026: "narratives like our first video, introducing the new features"). Noodle the dachshund narrates in the 45 s promo's voice (Kokoro "af_bella" at 1.1x, `vo_friends.py`), with a small deadpan joke after each feature, over clean game scenes with no game interface (`capture_clean.js` hides every bar, button, sheet, toast and speech bubble). Noodle is our dog in the footage now (as in the promo and the profile picture). 32 s; each shot lasts its line.

| Shot | Noodle says | On screen |
|---|---|---|
| Noodle at home in the autumn yard, drinking from his water bowl (head straight down to the bowl, side-on: the eat/drink fix d488723) | "Big news! Our dogs can make friends now!" | "4 ways your dog can make friends (no chat)", sticker "new update · 7 Nov" |
| Our friend card on the paper (the game's card art) | "Pick a friend name, share your code, and your dog can visit theirs!" | "share your code" |
| The friend's yard, the game's own greeting: Noodle walks in, he and Waffles sniff toward each other with hearts (a clear gap between them); Honey (back row) gets petted; nobody overlapping | "Visit their yard! Pet their dogs! This is Waffles. Waffles likes me." | "1. visit & pet" |
| The pink paw stamp lands on their path (Noodle sits this shot out: his tail covers the stamp's spot on a phone) | "Leave a paw-print note! Mine says: your dog is so fluffy!" | "2. paw-print note" |
| The wrapped gift flies off | "Send a gift, once a day! I sent a biscuit. I did not eat it first." | "3. send a gift" |
| The walk: Noodle hops a sprinkler and Waffles hops right after him, Noodle ducks a kite (a window on the paper) | "And take their dog on your walk! Waffles is faster than me." *(beat)* "I let her win." | "4. walk together" |
| Noodle and Waffles play (the greeting goes on): play bows and jumps back and forth, hearts | "No chat. No messages. Just dogs, being friends!" | "no chat. no messages." |
| End page: "add us!", our card, the logo | "Friends arrives on November seventh! Drop your friend code below!" | "drop your code below", "new update · 7 Nov" |

Every line is true to the game: "Your dog is so fluffy!" is the first of the 12 preset notes, gifts are one a day, Waffles is the friend's Corgi (she), and no typed message leaves the device.

Facts checked against `V219.md` and the game: the name is two Dog Card words on two wheels; one code, shared by invite link, Copy code or the QR; visits are read-only; pets give +1 Bond on both sides; notes are 12 preset lines (no typed text leaves the device); one gift a day, arriving as a mailbox letter; a friend's dog can join your walk and they get a walk letter; no chat, no search, no directory; remove or block any time; 11 languages.

### Instagram
```
comment your friend code below 👇 we're swapping codes all week 🐾 ours is DOG-K3APZ, add us! 🎴

Friends just landed in Doodle Doggo 🎉 you pick a name from 2 Dog Card words, like ours, Sunny Biscuit, and get 1 code to share 🎴 then your dog can visit theirs 🏡 pet their dogs for +1 Bond on both sides 🐶 leave 1 of 12 paw-print notes 💌 send 1 gift a day 🎁 or take their Corgi along on your walk 🦮

no chat and no messages, ever 🤐 notes come from a list of 12, you only add someone by their code or link, and you can remove or block any time 🔒 a cozy dog game to play with friends, and safe for kids too 💛

free, in 11 languages, on phone and computer ✏️

#DoodleDoggo #CozyGames #DogGames #IndieGame #GamesWithFriends
```
Job A (the Reel carries the hook) · one ask: comment (your friend code) · 5 hashtags · search: "cozy dog game", "friend code", "play with friends" · no link · 15 emoji (2.1 per 100 characters), none as bullets · linter READY · human score 79.1 PASS (7 Nov 2026, with our real code and name).

### YouTube Shorts

Title: `4 ways your dog can make friends in a cozy game (no chat) 🐾 #Shorts`

Description:
```
Friends just landed in Doodle Doggo, our free cozy dog game. You pick a friend name from two Dog Card words, share one code (or a QR, or an invite link), and then your dog can visit your friend's dog.

Once a day you can pet their dogs (+1 Bond for both of you), leave one of 12 paw-print notes, send a gift that lands in their mailbox, or take one of their dogs along on your walk. You don't need to be online at the same time.

There's no chat and no messages, ever: the notes come from a list. You can only add someone by their code or link, and you can remove or block a friend any time. We're Sunny Biscuit, code DOG-K3APZ. Add us! Then drop your friend code in the comments and swap with other players.

🎮 Play free: https://doodledoggo.app
🕹️ itch.io: https://an9ou.itch.io/doodle-doggo
☕ Support us on Ko-fi: https://ko-fi.com/doodledoggoapp
📷 Instagram: https://www.instagram.com/doodledoggo.app/

#DoodleDoggo #Shorts #CozyGames #DogGames #IndieGame
```
Title off the hook (80.1 STRONG). Human score 88.3 PASS on the text (7 Nov 2026, with our name and code) (the link list is the same fixed block as the other Shorts).

### X (under 280 characters)
```
4 ways your dog can make friends in a cozy game (no chat) 🐾 new in Doodle Doggo: visit a yard, pet their pup, leave a paw-print note, send a gift, walk their dog. no messages, just dogs. we're DOG-K3APZ, drop yours below! https://doodledoggo.app/f/DOG-K3APZ #DoodleDoggo #CozyGames
```
270 of 280 (the link, now our invite link, counts as 23, each emoji as 2) · human score 81.5 PASS (7 Nov 2026, with our code). (3 Nov 2026: "no messages to type" became "no messages, just dogs", the owner's no-chat-no-messages rule.)

**Alt text:** `Noodle, a crayon dachshund, tells the story in a sketchbook autumn yard, under the words "4 ways your dog can make friends (no chat)" and a sticker "new update, 7 Nov". His friend card appears, then four numbered scenes from the game: he visits a friend's yard, where he and a Corgi named Waffles sniff toward each other and a Golden puppy gets petted, a pink paw print stamps onto their path, a wrapped gift flies off, and Waffles hops over a sprinkler behind him on a walk. Noodle and Waffles play-bow and jump: "No chat. No messages." Subtitles show every line. It ends on "add us!", our friend card (Sunny Biscuit, code DOG-K3APZ) and "drop your code below".`

## The carousel ("add a friend in 3 steps", 8 slides)

1. **Cover:** "add a friend in 3 steps" over the visit screen (Mochi, Waffles and Honey in Cozy Maple's yard), "your dog visits theirs. no chat, no messages.", pill "new in Doodle Doggo". (Not the Friends badge: one of its two dogs is white.)
2. **The stake:** "visit a friend's yard", "pet their dogs, leave a paw print.", the visit with Waffles saying her line after a pet.
3. **Step 1:** "pick your friend name", "tap More, then Friends. turn the two wheels, like Sunny Biscuit." (our own name on the wheels) The More tray with Friends, an arrow to the name wheels.
4. **Step 2:** "share your code", "Share invite, Copy code, or let them scan your QR." Our card (placeholder patch in the preview).
5. **Step 3:** "add theirs", "type their DOG- code, or open their invite link." The Add a friend boxes and the friend on the list with Visit and Gift.
6. **"then, once a day:"** four screens: pet their dogs, leave a paw print, send a gift, walk their dog.
7. **Recap:** "3 steps, 1 minute": 1. More, then Friends: pick a name / 2. share your code or QR / 3. add theirs: code or link / then visit, pet, leave a paw print, send a gift, walk their dog / no chat. no messages. remove or block any time.
8. **CTA:** "add us!", our card, "then drop your friend code in the comments".

Step bubbles read "1.", "2.", "3.". Handle on every slide, numbered 1/8 … 8/8. The ask matches the Reel (friend codes in the comments, the plan's one angle), so slide 7 is a recap, not "save this".

### Instagram (carousel)
```
comment your friend code below 👇 ours is DOG-K3APZ 🎴 adding a friend takes 3 steps and about 1 minute ⏱️

step 1: tap More 👉 then Friends 🐶 and turn the 2 wheels 🎡 to pick your friend name, like ours, Sunny Biscuit ☀️
step 2: share your friend code with Share invite, Share poster or Copy code, or let them scan the QR on your card 🎴
step 3: add theirs. type their DOG- code or open their invite link 🔗 that's it, you're friends! we'd love to add yours too 🐾

then, once a day, your dog can visit their yard 🏡 pet their dogs for +1 Bond each 💕 leave a paw-print note 💌 send a gift 🎁 and take one of their dogs along on your walk 🦮

no chat, no messages 🤐 and you can remove or block a friend any time 🔒 a cozy dog game to play with friends, free on your phone or computer 📱✏️

#DoodleDoggo #CozyGames #DogGames #IndieGame #GamesWithFriends
```
Job B (the caption carries the steps) · one ask: comment (your friend code) · 5 hashtags · search: "cozy dog game", "friend code", "play with friends" · no link · 19 emoji (2.4 per 100 characters), none as bullets (the steps start with "step 1:") · linter READY · human score 85.4 PASS (7 Nov 2026: our code in line 1, our name in step 1, Share poster in step 2).

**Alt text (cover):** `A sketchbook page titled "add a friend in 3 steps" over a game screen of a friend's autumn yard, where a crayon Shiba, a Corgi and a Golden puppy in a party hat stand apart on the lawn, and the line "your dog visits theirs. no chat, no messages."`

## RedNote / 小红书 (Simplified Chinese, no link)

Owner asked for it (2 Nov 2026, "make the rednote version") and chose a Mandarin voice (choice window: "Chinese voice (Kokoro)"). Post the FINAL `brand/instagram/launch/friends_reel/doodle-doggo-friends-rednote.mp4` (made on 7 Nov with our real code, 42.2 s) with the 3:4 cover `brand/rednote/rednote-06-friends.jpg` as the video's custom cover. **Never post the PREVIEW**: placeholder name and code with a red 占位 patch.

- **Voice:** Noodle in Mandarin, Kokoro v1.1-zh with misaki's Chinese G2P. First `zf_001` at 1.1x; the owner found it robotic (2 Nov 2026; its pitch is one of the flattest of the 55 female voices), so five softer voices with livelier pitch were sampled (`preview/voices/voices-A-to-E.mp4`, a video because phones won't play the mp3s) and the owner picked **D, `zf_073` at 1.0x**. Made by `vo_friends_zh.py` (setup at the top of the file; jieba may need its sdist on PYTHONPATH). Checked by speech-to-text (faster-whisper small): every line reads back as written (爪印 comes back as the homophone 找印). Waffles is said and written 华夫. About 42 s. (7 Nov final: re-made with `config-v1.1-zh.json` passed as `vocab_config`; not re-checked by speech-to-text, faster-whisper is not installed in this session.)
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

我们是「阳光饼干」，好友码 DOG-K3APZ 👀 评论区交换好友码吧～👇

浏览器搜 Doodle Doggo App 就能玩

#DoodleDoggo #交换好友码 #治愈系游戏 #独立游戏 #我在小红书做游戏 #狗狗 #萌宠 #柯基 #腊肠犬 #蜡笔画
```

> Doodle Doggo's Friends is here! Out on 7 Nov.
> Pick a friend name (two words, the same as on Dog Cards), share your friend code, and then your dog can: visit a friend's yard and pet their dogs (+1 Bond for both); leave a paw print, one of 12 notes; send a gift once a day (a snack, seeds or something from the garden); take a friend's dog on your walk, and they get a letter.
> No chat, no messages. The notes are ready-made, you can only add a friend by friend code or invite link, and you can remove or block any time. Safe for kids too.
> We're Sunny Biscuit (阳光饼干), friend code DOG-K3APZ. Swap friend codes in the comments!
> Search Doodle Doggo App in your browser to play.

Checked by hand (RedNote rules, 7 Nov 2026): no link, no domain with a dot and no QR ("浏览器搜 Doodle Doggo App 就能玩", REDNOTE.md 4 Nov 2026; the code DOG-K3APZ is not a link), title 15 characters with the emoji (20 max), the game's own zh-Hans words (好友名, 好友码, 做客, 摸摸, 亲密度, 留个爪印, 小纸条, 送一份礼物, 一起散步, 删除, 屏蔽), one ask (评论区交换好友码). On 7 Nov the post goes up after 00:00 JST, when Friends is live. The "carousel" as a RedNote 图文 ("3步加好友") comes next.

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
- **Game Manager briefing, 2 Nov 2026 (ships 7 Nov):** (1) no "New code" button any more: each player keeps one code (nothing of ours says otherwise). (2) A **Share poster** button in the Friends sheet: a 1080 x 1920 story PNG with the leader dog in its own coat, the friend name, the code, a QR, "Scan or add DOG-XXXXX" and the doodledoggo.app/f/ link (`PawArt.FRIENDS.poster`, world/pawart_world_b.js). On the 7 Nov re-shoot, carousel step 2 and its caption add it ("Share invite, Share poster, Copy code, or let them scan your QR"), and our own poster can be the Instagram story on launch day (not on RedNote: it carries a QR and a link). (3) Codes are drawn in Atkinson Hyperlegible Bold (S/5, Z/2, B/8 read apart): every shot that shows a code is re-shot from the 7 Nov build anyway.
- **RedNote site wording (owner, 3 Nov 2026):** the captions say "在浏览器搜索 DoodleDoggo.app 就能玩"; the RedNote video is not re-rendered for it (owner: "no need to re-render"), so its end page stays as it is, also on the 7 Nov cut.
