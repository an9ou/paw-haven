# "Pick a coat" Reel: stop picking the yellow Lab

Today's idea from `VIRAL_REEL_IDEAS.md` (9 Nov 2026, hook score 94.8): pause and pick 1 of 4 coats. The news behind it: v2.23 / v2.23.1, players pick the coat when they adopt a starter dog, and puppies inherit the genes. Fox red Labrador and dark golden Golden Retriever are new in v2.23.1. No black or white dog is a pick (owner rule, 1 Nov 2026). English only, one video for every platform. **Waiting for the owner. Not posted anywhere.**

| File | |
|---|---|
| Video | `brand/instagram/launch/coat_reel/doodle-doggo-pick-a-coat.mp4` (19.5 s, 1080 x 1920, 30 fps, AAC stereo) |
| Script | `brand/instagram/launch/coat_reel/build_coat.js`, voice lines `brand/instagram/launch/coat_reel/vo_coat.json` |
| Cover | none: Instagram and TikTok can use frame 1 (the hook card over the yellow Lab), or pick the 4-dog grid at about 3 s |

The art is the game's own. The coats come from the starter presets the adoption colour picker uses (`STARTER_COATS`, `starterCoats`, `starterEyes` in `game/src/10_sex_age_genes.js`). Names and colours come from `mods/genes.js` `phenotype()`, and each dog is drawn the way the game draws that dog (`PawArt.dog(key, { coat, seed: hashId(id) })`). The collie's id is picked the same way `starterIdFor()` does it, so its merle eye roll really gives odd eyes (one blue, one brown). The Chocolate Lab has the game's amber eyes (b/b). The yellow Lab is the game's default Lab. Every frame passes `centreCheck()`, `safeCheck()` (everything inside x 60..890, y 270..1440) and `apartCheck()`. The last frame is the same as the first, so the Reel loops.

Owner, 9 Nov 2026: make the news explicit. Picking the coat when you adopt a new dog is new in the game (v2.23, 7 Nov; more coats in v2.23.1, 8 Nov). A pink crayon sticker **NEW! pick your dog's coat** sits between the top card and the dogs from the countdown to the loop, and the news line was re-voiced.

## Shots

| Time (s) | Noodle says | On screen |
|---|---|---|
| 0.0 to 1.35 | "Stop picking the yellow Lab. Pick one of these four dogs instead." (0.1 to 3.75) | Card at frame 1: **Stop picking the yellow Lab. / Pick 1 of these 4 dogs instead.** over the sitting yellow Lab. A red crayon cross at 0.4 s (two scratch sounds), pill: *sorry yellow Labs, you're great*. The Lab slides off to the left at 0.95 s |
| 1.35 to 3.85 | (hook continues) | The four pop in at once in a 2 x 2 grid with a tick: 1 Fox red, 2 Dark golden, 3 Red merle, 4 Chocolate (number badges, coat pills) |
| 3.87 to 5.6 | "Pause now! Three, two, one." | Card: **pause now! / PICK 1 · 2 · 3 · 4**, a pink 3, 2, 1 bubble on the spoken numbers (soft ticks). The sticker **NEW! pick your dog's coat** pops in under the card and stays until the loop |
| 5.64 | "Fox red. Not a fox. We checked." | Dog 1 pops big, card **1 Fox red / Labrador** with a **NEW!** sticker, subtitles |
| 7.77 | "Dark golden. Like toast, but a dog." | Dog 2 big, **2 Dark golden / Golden Retriever**, **NEW!** |
| 10.19 | "Odd eyes. Both judging you." | Dog 3 big, **3 Red merle / Border Collie**, an eye loupe on its face, pill *one blue eye, one brown* |
| 12.05 | "Chocolate. The dog-safe kind." | Dog 4 big, **4 Chocolate / Labrador** |
| 14.04 | "New! Now you pick the coat when you adopt a new dog. Puppies inherit it!" | The four back in the grid, green card **new: pick the coat / when you adopt**, the game's "adopt" sting, subtitles |
| 18.10 | "Comment your number!" | Card **Comment / your number!**, the four bounce |
| 19.02 to 19.52 | (none) | The four slide off and the yellow Lab slides back in under the hook card: loop |

Sound: Noodle (Kokoro af_bella 1.1x) at -16 LUFS. Under it is the game's own cozy yard music (`mods/pawaudio.js`), 11 dB under the voice (about 30 %), plus crayon ticks and scratches. The whole mix is at -16 LUFS, true peak -1.5.

Changes from the draft in `VIRAL_REEL_IDEAS.md`: spoken numbers are left out of the payoffs (the big number badge carries them). Line 3 is "Odd eyes. Both judging you." and the screen says "one blue eye, one brown". Line 4 is "Chocolate. The dog-safe kind.", which keeps the food-safety wink. The news line is "New! Now you pick the coat when you adopt a new dog. Puppies inherit it!" (owner, 9 Nov 2026). The full draft lines ran 22 s at 1.1x, and these cuts bring it to 19.5 s.

## Rebuild

```
# main checkout with the v2.23.1 coats, e.g. a worktree of origin/main
VO_LINES=brand/instagram/launch/coat_reel/vo_coat.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo dir>
ART_ROOT=<main checkout> NODE_PATH=$(npm root -g) node brand/instagram/launch/coat_reel/build_coat.js <workdir> <vo dir>
# ONLY=stills (STRIP=t1,t2,...) renders key frames only into <workdir>/stills
```
The Kokoro model files (`kokoro-v1.0.int8.onnx`, `voices-v1.0.bin`) are never committed.

## Instagram caption (TikTok: the same text)

```
new in Doodle Doggo: you pick the coat when you adopt a new dog 🖍️ comment your number 👇 1, 2, 3 or 4?

the yellow Lab is lovely. but these four are just as real, and fox red and dark golden only arrived this week

1 fox red Lab (new!)
2 dark golden Golden Retriever (new!)
3 red merle Border Collie, one blue eye and one brown
4 chocolate Lab, the only chocolate a dog should ever have 🍫🚫

they're real coat genes, so the puppies inherit them 🐶 free cozy dog game in your browser, link in bio 🏡

#DoodleDoggo #CozyGames #BorderCollie #Labrador #DogLovers
```
One ask (comment your number). 5 hashtags. No link in the caption ("link in bio"). No em dashes.

**TikTok title:** New: pick your dog's coat. Stop picking the yellow Lab, pick 1 of these 4 👀 #DoodleDoggo #CozyGames
