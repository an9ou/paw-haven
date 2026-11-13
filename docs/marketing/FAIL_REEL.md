# "Your dog can't fail in this game. I tried 5 ways." Reel (13 Nov 2026)

One English Reel, one video, its designed cover and captions. No RedNote cut. **Made, waiting for the owner's approval; nothing posted.** Files in `brand/instagram/launch/fail_reel/`.

| File | What |
|---|---|
| `doodle-doggo-cant-fail.mp4` | Instagram Reels, TikTok, YouTube Shorts and X. 1080 x 1920, 30 fps, AAC stereo, 40.71 s: 38.21 s of Reel, then our standard end card for 2.5 s with the music fading under it. Fast: each card stays up for its spoken line + 0.4 s, 0.15 s between beats; Noodle's voice (Kokoro af_bella) at 1.1x. |
| `fail-cover.jpg` | The designed cover (not a frame), in the game's own woods: "Your dog can't fail / in this game" in a big cream card on the sky, the pill "I tried 5 ways", the red "fail" crossed out next to the green "proud of it", Noodle big and proud on the grass beside the game's log, the logo on its own cream card. Key content inside the 1:1 crop (y 420..1500), the logo inside 4:5. |
| `build_fail.js` | Remake (below). Every frame runs `centreCheck()`, `safeCheck()` and `apartCheck()` (`../centre_text.js`, 28 px between Noodle, every card, pill, badge, chip, the log and the letter), keeps every word and key art inside x 60..850, y 270..1440, and checks that Noodle, the log and every chip stand on the scene's open ground: feet on the floor, top below the scene's back row of props (`FLOORS[name].back`), clear of the props in front (benches, the fountain, tunnels, the garden plot: keep-out boxes in scene units). It stops on the first miss, and if any quoted game text, number or rule below changed on main. |
| `vo_fail.json` | The spoken lines (Kokoro af_bella 1.1x). |
| (capture) | Gerald's letter is captured from a main build by `../back_reel/capture_back.js` (the same capture as the week-off Reel). |

## Shots

The backgrounds are the game's own scenes from main (`PawArt.scene`, autumn, no game interface: the game's dashed hotspot outlines are hidden), a different place each beat. Each scene is zoomed onto its open ground (3.7x to 5.2x, the scene's bottom at the frame's bottom), so the back row of props (fences, trunks, poles, the sofa, the shops, the bench and pumpkins) ends above Noodle's head: Noodle, the log and every chip stand on open ground and never overlap a scene prop (coordinator, 13 Nov 2026). Pre-rendered once per build and cross-faded between beats. Every word sits on a solid cream card, pill or badge (never on the scene); items float in cream chips. Noodle is the star of every beat, big, standing on the ground in front of the scene's props. The gag: each "way" gets a red ✕ "fail #n" badge, then a green ✓ badge pops in beside it and the red one is crossed out with a crayon line. Music: the game's own park music (`mods/pawaudio.js`) about 11 dB under the voice, the game's rain ambience in the rain beat, the game's discover sting on the ribbon, treasure sting on the coins, level-up sting on the payoff; a bonk, ticks and dings; loudness -16 LUFS.

| Starts | Beat | Scene | Spoken (Noodle's voice) | On screen |
|---|---|---|---|---|
| 0.10 s | hook | Hilltop Meadow | "My dog can't fail in this game. I tried five ways." (3.11 s) | Card at frame 1: "My dog can't fail / in this game." + red "I tried 5 ways." Noodle big and proud (the game's proud face, "ta-da!"). |
| 3.76 s | log | the woods (path and pines) | "Way one: walk straight into a log. Bonk! He says he meant to do that." (4.00 s) | Card "Way one: / walk straight into a log." ✕ "fail #1". As in the game's walk, Noodle trots on the spot and the game's log obstacle comes to him; "Bonk!" pops, he hops back and stands proud. ✓ "he's proud of it" + quote card "I meant to do that." |
| 8.31 s | rain | Sunny Park in the rain, then the Cozy House on a rainy day | "Way two: go out in the rain. Wet dog smell intensifies. Then a dry, cosy nap indoors." (5.95 s) | Card "Way two: / go out in the rain." ✕ "fail #2". Noodle wet (the game's rainy-day wet look) under falling rain, a shake; quote "Wet dog smell intensifies." Then the Cozy House with rain on the window: Noodle dry, asleep. ✓ "wet. then cosy." |
| 14.81 s | show | Town Square (Paws & Pages, the clock tower) | "Way three: lose the dog show. Mrs. Plum still pins a ribbon on him." (4.42 s) | Card "Way three: / lose the dog show." ✕ "fail #3". Noodle bows; ✓ "still a ribbon." + quote "Mrs. Plum pins a blue ribbon on Noodle."; the game's Show Ribbon pops in its chip and Noodle cheers. |
| 19.78 s | away | the Home Yard (house corner, washing line) | "Way four: forget about him for a week. Gerald sends a treat bag and a hundred coins. Welcome back!" (5.91 s) | Card "Way four: / forget about him for a week." ✕ "fail #4". Noodle asleep; then ✓ "a welcome-back gift", the game's own letter "We kept your spot warm" (captured), the game's treat bag in a chip, and Noodle up and happy. |
| 26.24 s | trick | the Training Ground (weave poles) | "Way five: get every trick wrong. He invented a brand new trick. Nobody knows what it is." (5.25 s) | Card "Way five: / get every trick wrong." ✕ "fail #5". Noodle sits for the cue, then scratches instead; ✓ "a brand new trick." + quote "Close! Noodle invented a brand new trick. Nobody knows what it is."; Noodle happy. |
| 32.04 s | payoff | the Sunflower Fields (the finish arch) | "Nothing bad ever happens here. That's the point." (2.54 s) | Card "Nothing bad ever / happens here." small "That's the point." + green ✓ "no fail states. ever." Noodle happy with hearts, big. |
| 35.13 s | ask | the Dog Park | "What should I try next? Comment a way to fail!" (2.48 s) | Card "What should I / try next?" + red badge with a down arrow "comment a way to fail". Noodle lies down, curious, big. |
| 38.21 s | end card | (music fades) | | Our standard end card (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`): the logo, doodledoggo.app, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp with icons, 2.5 s, centred. |

**Art.** All from main (a4761920): Noodle (`PawArt.dog('dachs')`: walk, idle with the proud face, sit, idle and shake wet (`wet: true`), sleep, bow, happy with hearts, scratch, lying down with the curious face; never the game's sad or cold pose), the log obstacle (`PawArt.obstacle('log')`, the walk's own), the Show Ribbon (`PawArt.item('Show Ribbon')`, the blue ribbon's sticker), the treat bag (`fwBagSVG`, read out of the build by `capture_back.js`), Gerald's letter (the game's own, captured at 3x after a 7-day absence, buttons and the dev button hidden). The backgrounds: `PawArt.scene` hilltop, woods, park (rain), house (rain), square, yard, training, sunflower, dogpark. The badges, chips, cards and the rain lines are drawn for the Reel in the same crayon style, every fill inside its line.

## Where the facts come from (main a4761920)

The build checks each of these and stops if one changed.

| Said / on screen | Source |
|---|---|
| A bump into a log on a walk: "Bonk!" and a bump line, the walk goes on | `mods/walkrun.js` `stumble()` (pop `mod.walk.pop_bonk` "Bonk!", a line from `walk_lines.bonk`; the log has no named lines, so it uses these); header "no fail state"; `data.obs_label.log` "Log". A bump costs 3 seconds of the walk clock and the walk ends as usual. |
| "I meant to do that." | `data.walk_lines.bonk.2` (one of the 7 bump lines, picked at random). The game shows a short stumble pose on a bump; the Reel shows a hop back and the proud face instead (no sad dog, owner's rule). |
| Wet in the rain, dry indoors | `wetScene()` / `wetDog()` in `game/src/13_more_dogs.js` (rain and an outdoor view, no raincoat = drawn wet); `PLACES.house` `out: false` in `00_core.js` (the Cozy House is indoors, so dry); V218.md section 12. |
| "Wet dog smell intensifies." | `yard.wet_dog_smell_intensifies`: the game's line when you pet your dog outdoors in the rain without a raincoat (`03_yard.js`). |
| Lose the dog show, still a ribbon | The Dog Show Pose (`ff.n_show`), a Fun Fair minigame at Town Square: a wrong trick shows the card again (`ff.h_show_peek` "Mrs. Plum smiles and shows the card again."), 5 cards (`D2.L = [2, 3, 3, 4, 5]`), 1 point a card after a peek, so every finished show has 5+ points and `done()` gives a blue ribbon at least (gold at 9+, red at 6+); `ff.r_ribbon` + `ff.rib_b` = "Mrs. Plum pins a blue ribbon on Noodle."; every round also gives Bond and "Well played, {name}!" (`FF_BOND = 3`, `ff.r_title`). |
| Away for a week: Gerald's letter, a treat bag and 100 coins, "Welcome back!" | `wb.b_title` "We kept your spot warm", `wb.b_text` ("Welcome back! ... There is nothing to catch up on. Here is a treat bag and {n} coins"); `WB_BACK_MS = 3 * 864e5` (after 3+ days), `WB_BACK_COINS = 100` in `53_welcome.js`; the captured letter. |
| A wrong trick: "Close! Noodle invented a brand new trick. Nobody knows what it is." | `data.tg_miss.2` with the dog's name, shown as `tricks.oops` "Oops! {line}" (`15b_trick_games.js` `tgApply`); a miss loses nothing (`TG_GAIN` Missed: 0) and the lesson goes on. The Training Ground adds a bonus step to trick lessons there (`agTrickBonus`, `44_agility.js`). |
| Nothing bad ever happens; no fail states, ever | `CLAUDE.md` design rules: "Nothing bad ever happens. No fail states, no sickness, death or running away." |

**Changed from the brief.**
- Beat 3: the brief's "lose the minigame, still a treat" is not true as written: a lost Fun Fair round gives "Well played", Bond and Happiness ("No coins this time, but lots of fun.", `ff.r_nocoin`), not a treat. So the beat is the Dog Show Pose minigame, where every finished show ends with a ribbon: "lose the dog show" / ✓ "still a ribbon."
- Beat 4: ✓ "a welcome-back gift" instead of "he saved you a gift", because the letter and its gift come from Gerald (the dog's own small gift is the diary page's, not shown here).
- Beat 5: ✓ "a brand new trick." (the game's own miss line) instead of "he's learning. slowly.", because a missed try adds no progress (`TG_GAIN` Missed: 0), so "learning" from a wrong try would not be exact.
- Beat 1: in the game the dog keeps walking after a bump (it does not stop); the Reel shows the bump, a hop back and the proud face.
- The hook says "My dog", the cover and captions "Your dog" / "I tried 5 ways" as the brief's title. Noodle is the star as the brief asked (the README's "different dog each time" rule was not applied).

## Remake

```
cd <main checkout> && node game/build.js && node game/harness.js merged
NODE_PATH=$(npm root -g) node brand/instagram/launch/back_reel/capture_back.js <main checkout> <caps dir>
VO_LINES=brand/instagram/launch/fail_reel/vo_fail.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro model dir> <vo dir> af_bella 1.1
ART_ROOT=<main checkout> CAPS=<caps dir> NODE_PATH=$(npm root -g) node brand/instagram/launch/fail_reel/build_fail.js <workdir> <vo dir>
```
`ONLY=stills` renders key frames (`<workdir>/stills`, `TS=a,b,...` for chosen times; `DEBUG=1` draws the floor line and keep-out boxes), `ONLY=cover` writes `fail-cover.jpg`, `CHECK=1` runs every frame's checks without rendering, `FRAMES=a-b` re-renders only frames a..b and encodes again with the same sound. The Kokoro model files are never committed.

## Captions

All captions together: `docs/marketing/captions/FAIL_CAPTIONS.md`. One ask everywhere: comment a way to fail. Links only https://doodledoggo.app (YouTube and X); never itch.io.

### Instagram

```
comment a way to fail 👇 I tried 5 and Noodle still won every time.

nothing bad ever happens in Doodle Doggo, our free cozy dog game. so I tried to make my dachshund fail. it didn't go well. for me, I mean, because he's had a lovely day every single time and I'm the one running out of ideas.

1. he walked into a log on a walk. "I meant to do that." 🪵
2. rain. he got soggy and wet dog smell intensifies, then he napped indoors where it's dry and cosy 🌧️
3. he lost the dog show. Mrs. Plum pinned a blue ribbon on him anyway 🎀
4. I left for a week. Gerald the duck sent a treat bag and 100 coins ✉️
5. a trick, wrong. the game says he "invented a brand new trick. Nobody knows what it is."

zero fail states. that's the point.

what should I try next?

#DoodleDoggo #CozyGames #DogGame #DogLovers
```
Job: the Reel carries the hook, so line 1 is the ask · one ask: comment a way to fail · 4 hashtags · search: "cozy dog game" · no link · 5 emoji · `ig-caption` linter: all PASS except ONE ASK (its list only knows "comment KEYWORD" in capitals, so it reads the ask as missing) · `ig-human` score 92.2 PASS.

### TikTok

```
I tried 5 ways to make Noodle fail in our cozy dog game and honestly he won all 5 🐶 log on a walk? he said "I meant to do that." rain? soggy, then a nap indoors where it's dry and warm. lost the dog show? Mrs. Plum pinned a blue ribbon on him anyway. 7 days away? Gerald the duck sent a treat bag and 100 coins. a trick wrong? he "invented a brand new trick." zero fail states. I'm out of ideas. comment a way to fail 👇 #DoodleDoggo #CozyGames #DogGame #DogLovers
```
One ask · 4 hashtags · no link · `ig-human` score 85.9 PASS.

### YouTube Shorts

Title: `My dog can't fail in this game. I tried 5 ways 🐶 #Shorts`

Description:
```
My dog can't fail in this game. I tried five ways.

Doodle Doggo is our free cozy dog game, drawn in a pencil sketchbook, and nothing bad ever happens in it. So I tried to make Noodle the dachshund fail. He walked into a log on a walk and said "I meant to do that." He went out in the rain and got soggy, then napped indoors where it's dry. He lost the dog show and Mrs. Plum still pinned a blue ribbon on him. I stayed away for a week and Gerald the duck sent a treat bag and 100 coins. He got a trick wrong and the game said he "invented a brand new trick. Nobody knows what it is."

No fail states. Ever. That's the point.

What should I try next? Comment a way to fail.

🎮 Play free: https://doodledoggo.app

#DoodleDoggo #Shorts #CozyGames #DogGame
```
One ask · the only link is https://doodledoggo.app · `ig-human` score 77.9 PASS.

### X (under 280 characters)

```
I tried 5 ways to make my dog fail in our cozy game 🐶 he walked into a log ("I meant to do that."), lost the dog show and still got a ribbon, and I left for a week and got 100 coins. comment a way to fail https://doodledoggo.app #DoodleDoggo #CozyGames
```
257 of 280 (the link counts as 23, the emoji as 2) · one ask · `ig-human` score 76.2 PASS.

**Alt text:** `A crayon dachshund called Noodle in the game's own pencil scenes tries five ways to fail. He walks into a log ("I meant to do that."), gets wet in the rain and then naps dry indoors, loses the dog show and still gets a blue ribbon, gets Gerald the duck's welcome-back letter with a treat bag and 100 coins after a week away, and gets a trick wrong ("invented a brand new trick"). Each red "fail" badge is crossed out by a green one. "Nothing bad ever happens here." It ends on the Doodle Doggo card with doodledoggo.app and our Instagram, X and YouTube.`
