# v2.19 "Friends first": launch Reel and "add a friend in 3 steps" carousel (2 Nov 2026)

Owner's go-ahead (2 Nov 2026, via the Game Manager): the launch Reel and the carousel, English first, ready before **Sat 7 Nov 2026 00:00 JST**. **Nothing is posted before then.** Plan: `V219_FRIENDS_FIRST.md`. The RedNote cut and its 3:4 cover come after the owner approves the English.

## Status: preview, waiting for two things

1. **The owner's approval** of the English Reel and carousel (the preview files below).
2. **Our real friend name and code** from the live game on 7 Nov (the Game Manager sends them). The previews use a placeholder name (Waggy Clover) and the placeholder code `DOG-XXXXX`, and every frame or slide that shows our card carries a red "placeholder: our real code on 7 Nov" patch over the QR and the code. **Never post the preview files.**

On 7 Nov, with the code, re-shoot and rebuild (about 15 minutes; also picks up any layout tweaks from the Friends fit pass):
```
git fetch origin <main or the v2.19 dev branch>; git worktree add <dir> FETCH_HEAD     # the v2.19 build (art, Friends screens)
cd <dir> && node game/build.js && node game/harness.js merged && cd -
OUR_CODE=DOG-XXXXX OUR_NAME=<word A index>,<word B index> NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/capture_friends.js <dir> <footage>
NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/build_friends.js <dir> <footage> <work>    # Reel + cover
NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/build_carousel.js <dir> <footage> <out>  # 8 slides
```
`OUR_NAME` is the pair of Dog Card word indices (`DC_WORDS_A`, `DC_WORDS_B` in `game/src/40_dogcards.js`; Waggy Clover is `25,6`). With `OUR_CODE` set, no placeholder patch is drawn and the QR on our card is the real invite link (`doodledoggo.app/f/<code>`), scannable.

## Files (`brand/instagram/launch/friends_reel/`)

| File | What |
|---|---|
| `preview/doodle-doggo-friends-PREVIEW.mp4` | The Reel (Instagram, Shorts, X). 1080 x 1920, 30 fps, 25.1 s, the game's own cozy music (the yard by day), a soft tick as each numbered way pops in and the "discover" sting on the end page. |
| `preview/friends-cover-PREVIEW.jpg` | The cover: the hook over Mochi at home. |
| `preview/friends-carousel-PREVIEW-1.jpg` … `-8.jpg` | The carousel, 1080 x 1350. |
| `capture_friends.js` | Records the real v2.19 Friends screens (iPhone 15 profile, DPR 3) with Friends turned on and the Worker mocked as `game/test_v219_friends.js` does. The clips are shot at full resolution with the page clock slowed (each frame stamped with its game time), so the motion plays at 30 fps. |
| `build_friends.js`, `build_carousel.js` | The Reel and the carousel. Every text in a box is ink-centred with `centre_text.js` and checked by `centreCheck()` on every frame and slide (the build stops if anything is more than 1.5 px off). Our card on the last frame / slide is drawn from the game's own card art and QR module (`PawArt.FRIENDS.card`, `mods/qr.js`). |

**The footage:** our dog is Mochi the Shiba (orange). The friend is a made-up player, "Sunny Biscuit" (two Dog Card words), with Waffles the Corgi and Honey the Golden puppy in a party hat, in an autumn yard. No black or white dog is the subject. The friend's code is never shown: it is typed off camera.

## The Reel

Hook (`ig-reel` hookscore 80.1 STRONG, the best of 18): **"4 ways your dog can make friends (no chat)"**.

On screen: the hook card over Mochi in the yard; "pick a friend name" (the wheels turning); "get 1 friend code" (our card); then the four ways, numbered: 1 "visit their yard, pet their dogs" (Waffles and Honey get petted, hearts and a line from each), 2 "leave a paw-print note" (the list of 12, then the stamp on their path), 3 "send a gift, once a day" (the bag, Send, the gift flies off) and "gifts land in the mailbox" (a gift letter from Sunny Biscuit), 4 "take their dog on your walk" (Waffles picked on the route screen, then running beside Mochi with her friend ribbon). Then "no chat. no messages. / friends add you / with your code", and the end page: "add us!", our card, "then drop your friend code below", the logo, "a free cozy dog game", "play free at doodledoggo.app".

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

**Alt text:** `A crayon Shiba named Mochi stands in a sketchbook yard under the words "4 ways your dog can make friends (no chat)". Then real game screens: two wheels pick the friend name, a friend card with a QR code, a visit to a friend's autumn yard where a Corgi and a Golden puppy get petted, a list of preset paw-print notes, a gift box flying off, a gift letter in the mailbox, and the Corgi running beside Mochi on a walk. It ends on "no chat. no messages." and our friend card with "add us! then drop your friend code below".`

## The carousel ("add a friend in 3 steps", 8 slides)

1. **Cover:** "add a friend in 3 steps" over the visit screen (Mochi, Waffles and Honey in Sunny Biscuit's yard), "your dog visits theirs. no chat, no messages.", pill "new in Doodle Doggo". (Not the Friends badge: one of its two dogs is white.)
2. **The stake:** "visit a friend's yard", "pet their dogs, leave a paw print.", the visit with Waffles saying her line after a pet.
3. **Step 1:** "pick your friend name", "tap More, then Friends. turn the two wheels, like Waggy Clover." The More tray with Friends, an arrow to the name wheels.
4. **Step 2:** "share your code", "Share invite, Copy code, or let them scan your QR." Our card (placeholder patch in the preview).
5. **Step 3:** "add theirs", "type their DOG- code, or open their invite link." The Add a friend boxes and the friend on the list with Visit and Gift.
6. **"then, once a day:"** four screens: pet their dogs, leave a paw print, send a gift, walk their dog.
7. **Recap:** "3 steps, 1 minute": 1 More, then Friends: pick a name / 2 share your code or QR / 3 add theirs: code or link / then visit, pet, leave a paw print, send a gift, walk their dog / no chat. no messages. remove or block any time.
8. **CTA:** "add us!", our card, "then drop your friend code in the comments".

Handle on every slide, numbered 1/8 … 8/8. The ask matches the Reel (friend codes in the comments, the plan's one angle), so slide 7 is a recap, not "save this".

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

## RedNote / 小红书

After the owner approves the English cut: the same Reel in Simplified Chinese (the game's zh-Hans Friends words), no link ("搜索 Doodle Doggo"), ask "评论区交换好友码", and a 3:4 cover; the carousel as a 3:4 图文 "3步加好友".
