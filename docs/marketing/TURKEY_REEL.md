# "Stop feeding your dog the turkey skin" Reel (11 Nov 2026)

Owner, 9 to 11 Nov 2026: one English Reel for the holidays, food safety, in the style of our Safe Reel (`SAFE_REEL.md`) and Sweet potato Reel (`SWEET_REEL.md`). English only, no RedNote cut, no other versions. **Made, waiting for the owner's approval; nothing posted.** Files in `brand/instagram/launch/turkey_reel/`.

| File | What |
|---|---|
| `doodle-doggo-turkey-skin.mp4` | Instagram Reels, TikTok, YouTube Shorts and X. 1080 x 1920, 30 fps, AAC stereo, 28.1 s: 25.6 s of Reel, then our standard end card for 2.5 s with the music fading under it. |
| `turkey-cover.jpg` | The designed cover (not a frame): "Stop feeding your dog / the turkey skin" in a big card, the turkey leg with the red cross, Noodle begging, the four swaps with "share these instead" and the logo. Key content inside the 1:1 crop (y 420..1500), the logo inside 4:5. |
| `build_turkey.js` | Remake (below). Every frame runs `centreCheck()`, `safeCheck()` and `apartCheck()` (`../centre_text.js`) plus a tighter x 850 edge: no two dogs, foods, cards or texts overlap or touch, every word sits in the centre of its box, words and key art stay in the safe area (x 60..850, y 270..1440). The build stops on the first miss. |
| `vo_turkey.json` | Noodle's lines (Kokoro af_bella 1.1x). |

## Shots

A festive marigold background (owner, 11 Nov: "more eye-catching, Noodle larger"): crayon bunting along the top above the cards, a cranberry plaid tablecloth along the bottom, autumn leaves and sparkles in the side margins; plain colour behind every card, badge, food and Noodle, and every decoration is checked on every frame to stay 20 px clear of them. Noodle is the star, about 1.5 to 1.8 times his first size: on the "no" beats he stands big on the right, turned to the food, with the crayon red cross (drawn on, with a crayon scratch) above the food on the left; on the "share instead" beats the food and the green tick (with a tick) sit in a row under the card and Noodle runs long along the bottom; on the vet line he sits alone, big. The card is at the top. Music: the game's own kitchen music (`mods/pawaudio.js`) about 11 dB under the voice (~30%), loudness -16 LUFS.

| Starts | Beat | Noodle says | On screen |
|---|---|---|---|
| 0.10 s | hook | "Stop feeding your dog the turkey skin. Here's what to share instead." (3.53 s) | Hook card: "Stop feeding your dog / the turkey skin." + red "Here's what to share instead." Noodle begs; a roast turkey leg with its skin peeling back; the red crayon cross draws on. |
| 3.77 s | skin | "Very fatty. It can upset a dog's tummy." (2.35 s) | Red card "Turkey skin": "very fatty: it can upset / a dog's tummy", small "too much fat is linked to pancreatitis". Noodle sits politely. |
| 6.22 s | bones | "Cooked bones can splinter." (1.29 s) | Red card "Cooked bones": "they can splinter". Two cooked drumstick bones snapped into splinters; red cross. |
| 7.61 s | gravy | "Gravy and stuffing often have onion and garlic. Toxic to dogs!" (3.99 s) | Red card "Gravy & stuffing": "often made with onion and garlic, / which are toxic to dogs". A gravy boat and a bowl of stuffing (onion bits, herbs); red cross. |
| 11.76 s | turkey | "Plain turkey, no skin or bones." (2.05 s) | Green card "Plain turkey": "a little, cooked, / no skin, no bones". The game's torn plain turkey (no cranberries); green tick; Noodle delighted. |
| 13.89 s | beans | "Plain green beans." (1.16 s) | Green card "Green beans": "plain, nothing on them". Plain green beans on a plate; green tick. |
| 15.13 s | pumpkin | "Plain pumpkin, not pie filling." (1.89 s) | Green card "Plain cooked pumpkin": "not pie filling". The game's Pumpkin Purée; green tick. |
| 17.10 s | carrots | "Carrots! Small amounts, nothing added." (2.07 s) | Green card "Carrots": "small amounts, / nothing added". The game's Carrot Sticks; green tick. |
| 19.32 s | vet | "Ate something it shouldn't? Call your vet right away." (2.45 s) | Card "Ate something it shouldn't? / Call your vet right away." Noodle sits, alone, calm. |
| 21.92 s | game | "In Doodle Doggo, you can't cook or feed anything toxic." (3.3 s) | Card "In Doodle Doggo you can't cook / or feed anything toxic" + yellow pill "save this for the holidays". The game's Turkey & Cranberry Bites; green tick; the game's "cooked" sting. |
| 25.57 s | end | (music fades) | Our standard end card (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`): the logo, doodledoggo.app, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp with icons, 2.5 s. |

The cards carry the spoken words (they work as the subtitles).

**Art.** From main (v2.24.1): Noodle (`PawArt.dog('dachs')`, beg, sit and happy), the game's Pumpkin Purée, Carrot Sticks and Turkey & Cranberry Bites. The game has no turkey skin, cooked bones, gravy, stuffing, plain turkey or green beans icons, so `build_turkey.js` draws those six in the game's own item builder (injected into `world/pawart_world_b.js` for this render only, nothing in the game changes), so they share its crayon washes, inside-the-lines fills and pencil outlines. The plain turkey uses the game's own torn-turkey pieces from Turkey & Cranberry Bites, without the cranberries.

## Where the safety facts come from

The build checks these game texts on main and stops if they change (`game/i18n/en.json`):

| On screen | Source |
|---|---|
| No turkey skin, bones, gravy or seasoning; plain cooked turkey | `data.food.turkey_cranberry_bites.tip`: "Plain cooked turkey with no skin, bones, gravy or seasoning..." |
| Fatty leftovers and gravy upset a dog's tummy | `data.food.snow_day_stew.tip`: "Gravy and fatty leftovers upset a dog's tummy, so they stay on the people plates." |
| Cooked bones can splinter | `data.food.warm_bone_broth.tip`: "Cooked bones can splinter, so none stay in the cup." |
| Onion and garlic are toxic to dogs | `data.food.turkey_meatballs.tip` ("no onion or garlic. Those are poison for dogs"), `data.people_food.onion.why` |
| Green beans | `data.food.snow_day_stew.note` (chicken, carrot and green beans); the game's design doc lists carrot or green beans as the swap for onion (`docs/design/03-garden-kitchen.md`) |
| Plain cooked pumpkin, not pie filling | `data.food.pumpkin_puree.tip`: "Plain cooked pumpkin only, never pie filling." |
| Carrots | `data.food.carrot_sticks.tip`: "Crunchy and safe raw or cooked. Cut them small for little dogs." |
| You can't cook or feed anything toxic | the game's design rule (`CLAUDE.md`, `docs/design/03-garden-kitchen.md` "Dog-safety rules") and the guide text `data.gd_steps.garden.t` ("Nothing toxic can be planted. Ever.") |
| Call your vet right away | the same line as the Safe Reel |

Not in the game's text: "too much fat is linked to pancreatitis" (common veterinary guidance on rich, fatty table scraps, worded conservatively as "linked to") and "gravy and stuffing are often made with onion and garlic" (recipes vary, hence "often"). Grapes, raisins and chocolate were left out (they are in the Safe Reel, and the Reel would run past 25 s).

## Remake

```
VO_LINES=brand/instagram/launch/turkey_reel/vo_turkey.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro model dir> <vo dir>
ART_ROOT=<a checkout of main> NODE_PATH=$(npm root -g) node brand/instagram/launch/turkey_reel/build_turkey.js <workdir> <vo dir>
```
`ONLY=stills` renders key frames (`<workdir>/stills`), `ONLY=cover` writes `turkey-cover.jpg`, `FRAMES=a-b` re-renders only frames a..b and encodes again with the same sound. The Kokoro model files are never committed.

## Instagram

```
stop feeding your dog the turkey skin 🦃 3 foods to skip, 4 to share. save this for the holidays 📌

the 3 to skip 🚫 turkey skin is very fatty. it can upset a dog's tummy, and too much fat is linked to pancreatitis. cooked bones can splinter 🦴 gravy and stuffing are often made with onion and garlic, and both are toxic to dogs 🧅

dog safe holiday food, the 4 to share ✅ a little plain cooked turkey with no skin and no bones. plain green beans 🫛 plain cooked pumpkin, never pie filling 🎃 and carrots 🥕 small amounts, nothing added.

ate something it shouldn't? call your vet right away 🩺 don't wait to see what happens.

Noodle the dachshund learned all of this in Doodle Doggo, our free cozy dog game where you can't cook or feed anything toxic 🐶

#DoodleDoggo #DogSafety #DogTips #Thanksgiving #CozyGames
```
Job A (the Reel carries the hook) · one ask: save · 5 hashtags · search: "turkey skin", "dog safe holiday food", "cozy dog game" · no link · 11 emoji (1.4 per 100 characters) · `ig-caption` linter READY · `ig-human` score 71.0 PASS.

## TikTok

```
stop feeding your dog the turkey skin 🦃 3 foods to skip and 4 to share. skin? way too fatty, it can upset their tummy. cooked bones splinter. and we keep the gravy and stuffing on our own plates, because they're often made with onion and garlic, which are toxic to dogs. our Noodle gets plain turkey, green beans, plain pumpkin and carrots instead, just a little. save this for the holidays 📌 #DoodleDoggo #DogSafety #DogTips #Thanksgiving #CozyGames
```
One ask: save · 5 hashtags · no link · `ig-human` score 73.9 PASS.

## YouTube Shorts

Title: `Stop feeding your dog the turkey skin 🦃 #Shorts`

Description:
```
Stop feeding your dog the turkey skin. 3 holiday foods to skip and 4 to share. The skin is very fatty, it can upset a dog's tummy, and too much fat is linked to pancreatitis. Cooked bones? They splinter. Gravy and stuffing are often made with onion and garlic, which are toxic to dogs.

The 4 to share: a little plain cooked turkey with no skin and no bones, plain green beans, plain cooked pumpkin (never pie filling) and carrots. Small amounts, nothing added. Ate something it shouldn't? Call your vet right away. Save this for the holidays.

Noodle the dachshund lives in Doodle Doggo, our free cozy dog game drawn in a pencil sketchbook. You can't cook or feed anything toxic in it, and its treats come with short safety tips.

🎮 Play free: https://doodledoggo.app

#DoodleDoggo #Shorts #DogSafety #DogTips #Thanksgiving
```
One ask: save · the only link is https://doodledoggo.app · `ig-human` score 73.0.

## X (under 280 characters)
```
stop feeding your dog the turkey skin 🦃 too fatty. cooked bones? they splinter, and gravy often has onion and garlic. we share 4 with Noodle instead: plain turkey, green beans, plain pumpkin, carrots. save this for the holidays 📌 https://doodledoggo.app #DoodleDoggo #DogSafety
```
277 of 280 (the link counts as 23) · one ask: save · `ig-human` score 58.2.

**Alt text:** `A crayon dachshund in a kitchen. A roast turkey leg with its skin peeling back gets a red crayon cross: turkey skin is very fatty and can upset a dog's tummy. Then cooked bones (they can splinter) and gravy and stuffing (often made with onion and garlic, toxic to dogs), each crossed out. Then plain turkey, plain green beans, plain cooked pumpkin and carrots each get a green tick: small amounts, nothing added. Ate something it shouldn't? Call your vet right away. In Doodle Doggo you can't cook or feed anything toxic. It ends on the Doodle Doggo card with doodledoggo.app and our Instagram, X and YouTube.`
