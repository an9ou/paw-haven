# Phone ad: real gameplay clips

`capture_gameplay.js` records short clips of the real game in the **phone portrait layout** (390 x 844 CSS px at DPR 3, so 1170 x 2532 frames)
for ads that show the game on a phone screen or full screen. English UI, no dev button (hidden with CSS in the capture page only; no game file is changed).

## Run

```sh
node game/build.js && node game/harness.js merged      # game/test_merged.html, the page the clips are recorded from
NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/phone_ad/capture_gameplay.js <outdir> [clip ...]
```

Clips (default: all): `home`, `shelter`, `wardrobe`, `walk`, `play`, `ball`, `photo`. A full run takes about 8 minutes.

Output in `<outdir>`:

- `<clip>/frames/00000.png ...`: the PNG sequence at a steady 30 fps
- `<clip>.mp4`: H.264, yuv420p, 30 fps, 1170 x 2532
- `stills/<clip>.png`: one still per clip, and `contact_sheet.png`: every still tiled

Keep the clips and frames out of git.

## What each clip shows

| clip | length | what happens |
|---|---|---|
| home | 5 s | Home Yard, the pack of 4 (Chihuahua Pip, Corgi Biscuit, Husky Luna, Golden Sunny, some in outfits) roams; taps pet Pip, then Luna (heart eyes) |
| shelter | 6.5 s | the Shelter Playroom, a tap pets a room dog, the Adopt-me board opens the list, two finger swipes browse the dogs |
| wardrobe | 6 s | Wardrobe for Pip: Party Hat, Heart Sunglasses, Flower Crown, then back to the yard in the new look |
| walk | 6 s | Sunny Park walk with the pack following: Ready, GO!, taps to jump |
| play | 5 s | Feed sheet, a Bone-shaped Biscuit for the pack, everyone crunching |
| ball | 6 s | ball play in the yard, two flicks of the Tennis Ball, the pack races for it |
| photo | 5.5 s | photo mode from the "..." menu, a swipe along the face row, Heart eyes, then Proud |

## How it stays smooth

The page runs on Playwright's fake clock (Date, timers, requestAnimationFrame, performance.now) and every CSS / Web Animation is paused and
stepped by hand, so each frame moves the game on by exactly 1/30 s however long the screenshot takes. `Math.random` is seeded, so the same
`SEED` gives the same coats, roaming and shelter dogs. Taps are real touch events on the page, with a soft ring drawn where the finger lands.

## Options (env)

- `SEED` (7): another seed gives other coats and moves.
- `DATE` (2026-11-04): the date the game thinks it is. It picks the shelter's dogs (that day: Shiba, Westie, Chow Chow pup, Pomeranian, Min Pin, Shih Tzu).
- `SEASON` (summer), `WEATHER` (sunny).
- `TAPS=0`: no tap rings or finger dots.
- `FRAMES=a-b`: write only those frame numbers of the clips asked for, to redo part of a clip (the run is deterministic, so the other frames still match).
- `FPS` (30), `KEEP=1` (keep a clip's old frames).

To change a clip, edit its block in the script: each one is a list of `[time in seconds, action]` events (tap a selector, swipe a list) plus
the still's time.
