# "I drew all 35 dog breeds badly" Reel: what to post on each channel

Reel #4 of the viral list (`VIRAL_REEL_IDEAS.md`, hook score 80.8), the owner's pick on 6 Nov 2026. Goal: hold people in the first 10 seconds. The hook card is up at frame 1 with the first dog already moving; all 35 of the game's dogs flash by (about 0.26 s each, the game's own default coats and English breed names, a "12/35" counter), 25 dogs have shown by 7.5 s and all 35 by 10.9 s; Noodle tells it (Kokoro af_bella 1.1x) with two kind deadpan jokes (the Pug, the Greyhound); then "didn't see yours? comment your dog 👇" and the shared end card. English only for now: the RedNote cut comes after the owner approves. **Waiting for the owner's approval.**

| Channel | Video | Cover |
|---|---|---|
| Instagram Reels | `brand/instagram/launch/breeds_reel/doodle-doggo-35-breeds.mp4` (16.3 s, 1080 x 1920, 25 fps) | `breeds_reel/breeds-cover.jpg` ("FIND YOUR DOG", nine crayon dogs, none black or white, a crayon magnifying glass on the Beagle, the logo; all inside the grid's middle 1080 x 1440) |
| YouTube Shorts | the same video | the cover, or YouTube picks a frame |
| X | the same video | none needed |
| TikTok | the same video | the cover |

Remake: `python3 brand/instagram/launch/breeds_reel/vo_breeds.py <kokoro dir> <vo dir>`, then `PAR=4 NODE_PATH=$(npm root -g) node brand/instagram/launch/breeds_reel/build_breeds.js <workdir> <vo dir>` (options in the script's header: ONLY=stills, FRAMES=a-b over a copy of a full workdir, PAR=n, COVER=1). Every frame passes `centreCheck()` and `safeCheck()`.

Hook for Shorts and X: **"I drew all 35 dog breeds badly. Find yours before it ends."** (80.8, Superlative / Callout). Do not mention Little Helps, new breeds or Town levels (unannounced).

## Instagram (and TikTok: the same text)

```
comment your dog below 👇 is it in here, or did I draw it too badly to spot? 🙈

I drew all 35 dog breeds from our game in crayon 🖍️ and I'm sorry 😅 the Pug was harder than it looks 🐶 the Greyhound? mostly legs 🦵 our Corgi somehow ended up with bunny ears 🐰 but my favourite is still the Beagle with the big floppy ears 🤎

did you spot yours? Labrador 🐕 Shiba, Husky, Golden, Dachshund, a Mutt from the shelter 🐾 they're all in there. too fast? pause it 👀

we put these dog drawings in Doodle Doggo, our free cozy dog game 🎮 you can play it in your browser on your phone or computer, adopt one of the 35 crayon dogs, walk them round a sketchbook town 🏡 and hand out belly rubs 💛

#DoodleDoggo #DogBreeds #CozyGames #DogDrawing #DogLovers
```
One ask (comment your dog) · 5 hashtags · search: "dog breeds", "cozy dog game", "dog drawing" · no link (it's in the bio) · 15 emoji (2.0 per 100 characters) · `caption.py` READY · `detect.py` human score 87.7 PASS.

Alt text:
```
A fast parade of 35 crayon-drawn dogs, one after another on soft coloured paper, each with its breed name in a pill and a counter from 1/35 to 35/35, under a card that says "I drew all 35 dogs badly, find yours". It ends with a Beagle, a Corgi and a Pomeranian sitting under "didn't see yours? comment your dog", then the Doodle Doggo logo.
```

## YouTube Shorts

Title:
```
I drew all 35 dog breeds badly. Find yours before it ends 👀 #Shorts
```

Description:
```
All 35 dog breeds, drawn badly in crayon. Can you find yours?

I drew every dog in our game, and not one of them came out right. The Pug took the longest. The Greyhound is mostly legs. They flash by fast, so keep your eyes open, and pause if you need to.

Didn't see your dog? Tell us in the comments which one you have, and we'll tell you where it was hiding.

Doodle Doggo is our free cozy dog game, drawn in a pencil sketchbook. You can adopt one of 35 crayon dogs, walk the town with your dog, grow carrots in the garden and hand out as many belly rubs as you like. There's no timer and nothing to win, and nothing bad ever happens. If you like dog drawing, this whole game is one.

🎮 Play free: https://doodledoggo.app
🕹️ itch.io: https://an9ou.itch.io/doodle-doggo
☕ Support us on Ko-fi: https://ko-fi.com/doodledoggoapp
📷 Instagram: https://www.instagram.com/doodledoggo.app/

#DoodleDoggo #Shorts #DogBreeds #CozyGames #DogDrawing
```
Text above the link block: `caption.py` READY · `detect.py` human score 74.9 PASS (the link list is the same fixed block as the other Shorts). The title is the scored hook itself (80.8); on its own it is too short for the human panel (62.0), so it is checked with the description.

## X (259 of 280; the link counts as 23, each emoji as 2)

```
I drew all 35 dog breeds badly. find yours before it ends 👀

the Pug was harder than it looks. the Greyhound's mostly legs. didn't see your dog? tell me 🐶 every dog drawing here is from our free cozy dog game: https://doodledoggo.app #DoodleDoggo #DogBreeds
```
`detect.py` human score 85.8 PASS. `caption.py` REVIEW only for its Instagram rule "no links in captions" (on X the link is clickable and wanted); every other check passes.
