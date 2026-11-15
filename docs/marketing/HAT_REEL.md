# "Pick a hat" Reel: stop picking the cute hat, your dog wants number 3

Owner, 15 Nov 2026: "Create 4 for today's reels. Can we have more hats". The pick-a-number Reel in the format of the approved Pick a coat Reel (`COAT_REEL.md`), with eight hats instead of four, in a tidy 2 x 4 grid. English only, one video for every platform. **Made, waiting for the owner. Not posted anywhere.**

| File | |
|---|---|
| Video | `brand/instagram/launch/hat_reel/doodle-doggo-pick-a-hat.mp4` (32.6 s, 1080 x 1920, 30 fps, AAC stereo; ends on our standard end card) |
| Cover | `brand/instagram/launch/hat_reel/hat-cover.jpg` (1080 x 1920, its own design: the hook card, Noodle big in the Wizard Hat with hearts on the Boutique's paving, the eight numbered hats from the game's item art with number 3 in pink. Everything inside the 1:1 crop (y 420 to 1500), the logo inside the 4:5 crop) |
| Script | `brand/instagram/launch/hat_reel/build_hat.js`, voice lines `brand/instagram/launch/hat_reel/vo_hat.json` |
| Captions | `docs/marketing/captions/HAT_CAPTIONS.md` (Instagram, TikTok, YouTube Shorts, X, alt text) |

## The hats and where they come from (origin/main 84b2fab1, v2.25.1)

Only head items that are live today and that every player can buy or earn all year. No festival, market, Christmas (no Reindeer Antlers), Halloween, Kind shop (no Bucket Hat) or Bond 10 (no Crayon Crown) item. The build reads `game/src/00_core.js` on main and stops if any of this changes.

| # | Item (exact game name) | How players get it | Payoff (voice and card) | Why it is true |
|---|---|---|---|---|
| 1 | Party Hat | Bow-Wow Boutique, 60 coins, Bond 3 | "It's not his birthday. He insists." | a joke; its perk is about Pupcakes |
| 2 | Chef Hat | Bow-Wow Boutique, 60 coins, Bond 2 | "He cooks. Mostly snacks for himself." | perk "Chef's kiss: meals give +5 Happiness." |
| 3 | Wizard Hat | Bow-Wow Boutique, 90 coins, Bond 4 | "Ooh. Remember this one." | the favourite, revealed later |
| 4 | Cowboy Hat | Bow-Wow Boutique, 70 coins, Bond 2 | "Yeehaw. Then a nap." | perk "Yeehaw: naps outdoors restore 10% more." |
| 5 | Astronaut Helmet | the prize for a full missions stamp card (7 stamps, `24_missions.js`) | "Small step for dog." | |
| 6 | Flower Crown | Bow-Wow Boutique, 90 coins, Bond 3 | "The cute one. He knows." | the "cute hat" of the hook, kindly |
| 7 | Acorn Cap | walk treasure (woods, park) | "The squirrels have questions." | its ability is called "Squirrel Diplomacy" |
| 8 | Sun Hat | walk treasure (beach, park) | "Hot days? Not his problem." | "Hot days do not bother the dog while worn." |

**Why number 3.** The Wizard Hat's perk in the game is "Magic hands: petting gives +1 extra Bond." (`00_core.js`), and `03_yard.js` really adds 1 Bond when a pet bonds while he wears it. The reveal quotes the perk word for word and Noodle says "Every pet gives him extra Bond. Magic!" Nothing about the daily wish is claimed.

## The art

Noodle is the game's dachshund (`PawArt.dog('dachs', { pose, outfit: { head }, expr })` from main's `dogs/pawart_dogs.js`), with the game's own outfit art, all three line-boil frames flipping as in the game. The grid shows his sitting drawing cropped to the head and hat (no expression marks). Payoffs: sitting, with the game's wink (Party Hat), dreamy (Cowboy Hat) and wow (Astronaut Helmet) faces; the reveal is the beg pose with the hearts face. No expression that draws words (yum, blep, hmph, ta-da, oops) is used: words only sit on cream cards. Each payoff card also shows the hat itself from the game's item art (`PawArt.item`).

Backgrounds are the game's own scenes from main, autumn, no game interface: the Bow-Wow Boutique (`PawArt.scene('boutique')`, two windows: the pink door and the big shop window, zoomed 5x onto the paving) and the Home Yard at the reveal (`yard`, 6x, the fence and the grass). As in `fail_reel/build_fail.js`, every frame checks that Noodle's feet are on the floor, his top (hop included) is below the back row of props (the Boutique's doormat line, the yard fence) and he is clear of the keep-out boxes (bench, flowerpot, topiary, drain, the clothesline pole, the garden...).

Every frame passes `centreCheck()`, `safeCheck()` and `apartCheck()` (28 px; Noodle, every card, badge, quote and grid card), and everything except the shared end card stays inside x 60..850, y 270..1440. The cover passes the same checks (24 px) plus its crops.

## Shots

| Time (s) | Noodle says | On screen |
|---|---|---|
| 0.0 to 3.5 | "Stop picking the cute hat. Your dog wants number three." (0.1) | Frame 1: card **Stop picking the cute hat. / Your dog wants number 3.** over the eight numbered grid cards (Noodle's head in each hat, number badge, item name) at the Boutique's door. On "number three" card 3 turns pink |
| 3.57 | "Pause now! Three, two, one." | Card **Pause now!** with a big 3, 2, 1 on the spoken numbers (soft ticks); the grid stays |
| 5.73 | "It's not his birthday. He insists." | The grid goes; Noodle pops big in the **1 Party Hat** (wink), card with the number, the item art and the line |
| 8.28 | "He cooks. Mostly snacks for himself." | **2 Chef Hat**, the shop-window view |
| 11.06 | "Ooh. Remember this one." | **3 Wizard Hat**, door view |
| 12.95 | "Yeehaw. Then a nap." | **4 Cowboy Hat** (dreamy) |
| 14.71 | "Small step for dog." | **5 Astronaut Helmet** (wow) |
| 16.37 | "The cute one. He knows." | **6 Flower Crown** |
| 18.25 | "The squirrels have questions." | **7 Acorn Cap** |
| 20.10 | "Hot days? Not his problem." | **8 Sun Hat** |
| 22.44 | "Number three! The Wizard Hat. Every pet gives him extra Bond. Magic!" | Home Yard, the game's "levelup" sting: pink card **Number 3! / The Wizard Hat.** with a pink 3 and the hat; the quote card **"Magic hands: petting gives +1 extra Bond."** pops in; Noodle hops on his hind legs with hearts |
| 27.33 | "Which number would you pick? Comment below!" | Back at the Boutique: card **Which number would you pick? / Comment below!**, the eight grid cards pop back in one by one (ticks) |
| 30.07 to 32.57 | (none) | Our standard end card (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`): the logo, **doodledoggo.app**, Instagram **@doodledoggo.app**, X **@doodledoggoapp**, YouTube **@DoodleDoggoApp** with icons; the music fades out under it |

Sound: Noodle (Kokoro af_bella 1.1x) at -16 LUFS; the game's own music (`mods/pawaudio.js`, the shop, the yard at the reveal) 11 dB under the voice; crayon ticks; the whole mix at -16 LUFS, true peak -1.5. Pace (owner, fast): each card is up for its line + 0.4 s with 0.15 s between.

## Rebuild

```
# a checkout of origin/main for the art, the scenes, the items and the music, e.g. a worktree at <main checkout>
VO_LINES=brand/instagram/launch/hat_reel/vo_hat.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir> af_bella 1.1
ART_ROOT=<main checkout> NODE_PATH=$(npm root -g) node brand/instagram/launch/hat_reel/build_hat.js <workdir> <vo dir>
# ONLY=cover writes hat-cover.jpg; ONLY=stills (TS=a,b,...) key frames into <workdir>/stills; FRAMES=a-b re-renders only those frames, then encodes again
```
The Kokoro model files (`kokoro-v1.0.int8.onnx`, `voices-v1.0.bin`) are never committed.
