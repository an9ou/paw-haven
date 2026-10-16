# Launch images

Made 16 Oct 2026 for the first three Instagram posts. Plan, captions and checklist: `docs/marketing/`.

| File | What |
|---|---|
| `post1-meet-noodle.jpg`, `post2-pencil-town-fuji.jpg`, `post3-play-free-halloween.jpg` | Version B, three separate posts (1080 x 1350) |
| `banner-1-left-newest.jpg`, `banner-2-middle.jpg`, `banner-3-right-post-first.jpg` | Version A, the 3-tile banner (1080 x 1350). Post right, middle, left, then pin all three. |
| `banner-0-wide-preview.jpg` | The whole banner in one picture (3104 x 1350). For looking at, not for posting. |
| `grid-preview.jpg` | Mockup of the profile grid, both versions, with bio and highlights |
| `highlight-1-meet.png` ... `highlight-4-events.png` | Story highlight covers (1080 x 1920) |

Profile pictures (PNG exports of the .svg files) are one folder up: `brand/instagram/*-1080.png`.

## Remake
```
node game/build.js && node game/harness.js merged              # builds game/test_merged.html
NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/shots.js /tmp/shots        # real in-game screenshots (iPhone 15 profile, 20 Oct 2026, Japan scenery on)
NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/make.js /tmp/shots all     # posts | banner | profile | covers | grid | all
```
`make.js` draws the posts, `make_banner.js` the panorama and tiles, `make_extra.js` the covers, profile pictures and grid mockup. The dogs and props are the real art (`PawArt.dog`, `PawArt.prop`). Text is Caveat from Google Fonts (needs network). The tiles are cut from one 3104 px picture, each 1080 wide and overlapping by 68 px, so the 3:4 grid crop (34 px off each side) joins exactly.
