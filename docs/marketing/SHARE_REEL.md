# "Share my dog" Reel: v2.31 (18 Nov 2026)

The owner (18 Nov 2026): "Create share dog reels". One English Reel for v2.31 "Share my dog" (live 18 Nov). **Made, waiting for the owner; nothing posted.** No RedNote cut, no cover and no captions yet: those come only if the owner asks. Files in `brand/instagram/launch/share_reel/`.

| File | What |
|---|---|
| `doodle-doggo-share-my-dog.mp4` | English: Instagram Reels, YouTube Shorts, X. 1080 x 1920, 30 fps, AAC stereo, 29.60 s (888 frames): 27.10 s of Reel, then our standard end card for 2.5 s ("Play free!" over the logo, doodledoggo.app, Instagram @doodledoggo.app, X @doodledoggoapp, YouTube @DoodleDoggoApp with icons), music fading under it. Fast pace (owner, 13 Nov): each card stays up for its line + 0.4 s, 0.15 s between beats. |
| `capture_share.js` | The clean captures from a fresh worktree of origin/main (below). |
| `build_share.js` | Remake (below). Every frame runs `centreCheck()`, `safeCheck()` and `apartCheck()` (`../centre_text.js`), keeps every word and key art inside x 60..850, y 270..1440, stands Noodle on the scene's floor 28 px clear of the scene's own props (`KEEP`, scene units), keeps the game's pictures 28 px clear of those props too, and stops if any game fact below changed on main. `CHECK=1` runs every frame's checks without screenshots. |
| `vo_share.json` | Noodle's lines. |

## The hook

`ig-reel` hook scoring (`hookscore.py`), 7 options. Used: **"Free! Your dog as a crayon drawing, in two sizes."** 84.4 STRONG (length 100, specificity 100, stakes 70, front-load 100, address 100). It is true: Share my dog is free, draws the dog in crayon, and makes two sizes. On screen at frame 1: "Your dog as a / crayon drawing" + red "Free. In two sizes."; Noodle's own share picture pops in at 0.25 s.

| Score | Option | Why not |
|---|---|---|
| 85.8 | Never paid for a dog portrait? Yours is free. | Top score but reads as a portrait of the viewer's real pet; the picture is of your game dog. Not used (not true enough). |
| **84.4** | **Free! Your dog as a crayon drawing, in two sizes.** | **Used.** |
| 81.4 | Free crayon drawing of your dog, ready for Instagram. | Fine; "two sizes" is more checkable. |
| 81.4 | Free! Your dog as a crayon drawing, made on your phone. | It works on a computer too (the game says "on your device"). |
| 68.8 | Your dog as a free crayon drawing. Two sizes, no signup. | Payload late. |
| 62.2 | Your dog, as a crayon drawing. Free. (the brief's example) | Payload at the end. |
| 48.6 | POV: your dog gets a free crayon picture to share. | Nothing concrete. |

## Script (Noodle, Kokoro af_bella 1.1x)

| Starts | Beat | Noodle says | On screen | Scene (the game's, origin/main, autumn, sunny, day) |
|---|---|---|---|---|
| 0.10 s | hook | "Free! Your dog as a crayon drawing, in two sizes." (2.97 s) | Card "Your dog as a / crayon drawing" + red "Free. In two sizes."; Noodle's share picture (Post, Show name off) pops in on the left; Noodle begs, big. | Dog Park, x 240..577: the fence |
| 3.62 s | how | "On a phone, tap More, then Share. On a computer, it's in the top bar." (3.92 s) | Card "Share my dog / Phone: tap More, / then Share" small "computer: Share in the top bar"; the game's More tray open on a phone (the Share tile, the More button under it, iPhone 15 capture); Noodle gives a paw. | Maple Woods, x 20..357: the forest edge |
| 8.09 s | sizes | "Pick Post or Story. Your dog's name goes on only if you want." (3.88 s) | Card "Post or Story / Show name: your choice"; the two real shareDog PNGs of Noodle: Post 1080x1350 with Show name off, Story 1080x1920 with Show name on ("Noodle" on it); Noodle sits. | Training Ground, x 560..897 |
| 12.52 s | pals | "Every dog gets one, outfit and all!" (2.14 s) | Card "Every dog gets one!"; three more real share pictures: Maple the Golden in the Flower Crown, Pickle the Beagle in the Bow Tie, Dumpling the Pug in the Heart Sunglasses (Show name on); Noodle sits on the right. | Splash Pool, x 1262..1600 (clear of the pool and the plant pot) |
| 15.21 s | moment | "Or tap Share this moment after a walk, a new Bond level or a story scene." (4.24 s) | Card "Share this moment / after a walk, a new Bond level / or a story scene"; the game's Bond level card with its "Share this moment" button; Noodle sits, big. | Sunny Park, x 290..627: the hedge and the path |
| 20.00 s | device | "It's drawn right on your device. The game uploads nothing." (3.25 s) | Card "Made on your device / the game uploads nothing"; the game's Share my dog sheet on a phone (preview, Post / Story, Show name, "The picture is made on your device...", Share); Noodle begs. | Maple Woods, x 935..1272: the trees and the finish gate |
| 23.80 s | ask | "Share your doodle and tag us! I'm Noodle, by the way." (2.70 s) | Card "Share your doodle / and tag us!" + red pill "@doodledoggo.app"; Noodle big with hearts. | Hilltop Meadow, x 700..1037: the far village and the river |
| 27.10 s | end card | (music fades) | Standard end card (`brand/kids/endcard.js` `endCard('tall', handles(), LOGO_INNER)`, 70 px lower) with "Play free!" over the logo, 2.5 s. | |

Music: the game's own park music (`mods/pawaudio.js`, place `park`, day, sunny) about 11 dB under the voice, the discover sting at the start; ticks on cuts and on each picture; loudness -16 LUFS. No in-game footage moves in this Reel (every game screen is a still capture; the motion is our own: Noodle breathes and sways, his beg and paw poses glide between the game's drawings, the pictures pop in, the scenes cross-fade), so no frozen-clock capture was needed; `checkFrames()` was still run over every beat (numbers below).

**Art.** All from origin/main 48498628 (v2.31.9): Noodle (`PawArt.dog('dachs')` with `outfit: { neck: 'Autumn Scarf' }`: beg, paw, sit, beg with hearts), the same dog and scarf as in his share pictures. The backgrounds are the game's `svg.world` of each place as main draws it (our own dog, the roaming dogs and the effects left out), autumn, rendered at 3.2x; none of the gift Reel's yard, pier, square or living room. The share pictures are the game's own PNGs from `window.__paw.sh.draw()` (the exact file the Share button hands over: the player's yard, the dog about twice the old postcard size, the crayon line, the "Doodle Doggo · doodledoggo.app" chip). The More tray, the Bond card and the sheet are the game's own screens, captured clean and cropped inside their frames. No black or white dog as a subject.

## Where the facts come from (origin/main; the build checks each)

| On screen / said | Source |
|---|---|
| Free; your dog as a crayon picture | `nw.v231.share` ("Share your dog: a big crayon picture of your dog in your own yard, ready for a post or a story"); no coins, no shop in `58_share.js` ("No save field and no coins") |
| Two sizes, Post or Story | `SH_SIZES = { feed: { w: 1080, h: 1350 }, story: { w: 1080, h: 1920 } }` (`58_share.js`); `sh.size_post` "Post", `sh.size_story` "Story"; the captures `pic_noodle_feed` 1080x1350, `pic_noodle_story_name` 1080x1920 (`facts.json`) |
| Show name, your choice; the name goes on only if you want | `sh.show_name` "Show name"; `sh.note` "...Your dog's name is on it only if you turn it on."; `name = o.name && d.name` (off by default, `prefs.shName`) |
| Phone: tap More, then Share | `FW_POPS.more` starts `['photo', 'share', ...]`, `FW_TILE_GO.share` opens `shareDog({ from: 'menu' })` (`47_firstweek.js`); `fw.more` "More", `phone.t_share` "Share"; the iPhone 15 capture (tiles Photo, Share, Wardrobe...; the sheet opened from the tile: `from: 'menu'`) |
| Computer: Share in the top bar | `stPcBtn` after the camera in the top bar, labelled `sh.btn` "Share my dog" (`56_stories.js`); shown on desktop stages from 1130 px (CHANGELOG v2.31.4; on smaller stages Settings has a Share my dog button) |
| Every dog gets one, outfit and all | `shareDog(opts)` draws any dog (`opts.id`, default the active dog) in what it wears; the crayon line `sh.wearing` "{who} wearing {items}": "Golden wearing Flower Crown", "Beagle wearing Bow Tie", "Pug wearing Heart Sunglasses" (captures) |
| Share this moment after a walk, a new Bond level or a story scene | `nw.v231.moment` (the exact words); `sh.moment`; `shMomentHook` (#luOk Bond card, #resOk walk card), `on('sc:end')` chip (`58_share.js`); the Bond card capture |
| Made on your device; the game uploads nothing | `sh.note` "The picture is made on your device."; `58_share.js` header: "Nothing is uploaded anywhere: the PNG is drawn on the device and handed to the device's own share sheet" (the build also checks the file has no fetch, XMLHttpRequest or sendBeacon); suite `share_dog` "nothing was uploaded or fetched" |
| @doodledoggo.app (tag us), the end card | `brand/kids/endcard.js` `handles()`; README rules |

## Changed from the suggested beats

- The hook is "Free! Your dog as a crayon drawing, in two sizes." (84.4) instead of the example "Your dog, as a crayon drawing. Free." (62.2, payload at the end).
- "Where else" shows one game screen, the Bond level card, not the walk results card: a short test walk gave "Walk cut short" and "The treasure stayed hidden", which reads as a fail; the card's words list all three places.
- Privacy says "the game uploads nothing" rather than "nothing is uploaded": the player's own post does upload the picture, the game does not.
- The title-screen Play button and the first-walk treasure are left out: they do not fit a Share Reel and would make it longer.
- The ask beat has Noodle alone: a share picture there would sit on the meadow's far village.
- Seven beats on six places: Maple Woods twice, from two spots (the forest edge, then the finish gate): every other window of the Splash Pool, Riverside, the café and the Training Ground put a prop under Noodle or a picture.
- The end card carries "Play free!" over the logo (the end card's own pill gives doodledoggo.app); the shared end card has no room for a line between the logo and the pill.
- Noodle narrates (the brief's mascot rule), so the README's "different dog each time" rule is not applied; the other dogs are Maple the Golden, Pickle the Beagle and Dumpling the Pug.

## Checks (18 Nov 2026)

- `CHECK=1`: all 888 frames pass centre, safe (x 60..850 / SAFE), apart (28 px), floor and props checks; the full render runs the same checks on every frame.
- `checkFrames()` (`../frozen_clock.js`) on every beat, from 2 frames after its cut to 3 frames before the next: **0 doubled frames** in all seven beats (hook 5-105, how 111-239, sizes 245-372, pals 378-453, moment 459-597, device 602-711, ask 716-810; smallest change 0.05..0.17 against medians 0.13..0.80). The "jumps" it lists are the cross-fade at each beat start and the pop-ins of the game's pictures (smooth ramps of 0.7..3.0 over 10-20 frames, e.g. hook 9-19: 0.78 1.26 1.67 1.63 ... 0.41); the only single-frame spikes are the beat cuts (frames 107 and 598: 16.8, 16.3). The end card (frames 826-887) is a still card after its fade-in.
- Noodle's sit and happy drawings have no keyframes in the game art, so a first render held him frozen after each pop-in (269 identical frames). He now breathes and sways all the time (two sines, the sway at half the breath's rate and pi/8 out of step, so he never stops dead); the game's own beg and paw keyframes still glide underneath.
- ffprobe: h264 1080 x 1920, 30/1 fps, 888 frames, 29.60 s; AAC stereo. Voice -16 LUFS mix, music 10.8 dB down (about 11 dB under the voice).

## Remake

```
git worktree add --detach <main> origin/main && cd <main> && node game/build.js && node game/harness.js merged
NODE_PATH=$(npm root -g) node brand/instagram/launch/share_reel/capture_share.js <main> <caps>
VO_LINES=brand/instagram/launch/share_reel/vo_share.json python3 brand/instagram/launch/friends_reel/vo_friends.py <kokoro dir> <vo> af_bella 1.1
ART_ROOT=<main> CAPS=<caps> NODE_PATH=$(npm root -g) node brand/instagram/launch/share_reel/build_share.js <work> <vo>
```
`ONLY=stills` key frames (`TS=a,b,...`; `LOOSE=1` prints a failed check and goes on, for layout work only), `FRAMES=a-b` re-renders only frames a..b and encodes again with the last full render's sound (`mix.wav` in the workdir), `CHECK=1` runs all checks without screenshots. The captures use the test harness on `game/test_merged.html` (page date 18 Nov 2026, autumn, sunny, day); main is not changed. The Kokoro model files are never committed.
