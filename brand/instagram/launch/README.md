# Launch images

Made 16 Oct 2026. Plan, captions and checklist: `docs/marketing/`.

| File | What |
|---|---|
| `banner-1-left-newest.jpg`, `banner-2-middle.jpg`, `banner-3-right-post-first.jpg` | **A. The 3-tile banner** (1080 x 1350). One word box (middle tile), 9 big dogs, the cottage and decorations. Post right, middle, left, then pin all three. |
| `banner-0-wide-preview.jpg` | The whole banner in one picture (3104 x 1350). For looking at, not for posting. |
| `info1-japan-view.jpg`, `info2-meet-the-dogs.jpg`, `info3-what-you-can-do.jpg`, `info4-how-to-play.jpg` | **B. The informative series** (1080 x 1350): Japan view, the 14 dogs, what you can do, how to play |
| `post1-meet-noodle.jpg`, `post2-pencil-town-fuji.jpg`, `post3-play-free-halloween.jpg` | Extra single posts. Post 3 is a good Halloween push. |
| `grid-preview.jpg` | Mockup of the profile grid, banner and informative posts, with bio and highlights |
| `highlight-1-meet.png` ... `highlight-4-events.png` | Story highlight covers (1080 x 1920) |

Profile pictures (PNG exports of the .svg files) are one folder up: `brand/instagram/*-1080.png`.

## Remake
```
node game/build.js && node game/harness.js merged              # builds game/test_merged.html
export NODE_PATH=/opt/node-tools/node_modules
node brand/instagram/launch/shots.js  /tmp/shots               # real in-game screenshots (iPhone 15 profile, 20 Oct 2026, Japan scenery on)
node brand/instagram/launch/shots2.js /tmp/shots               # garden, kitchen, house, map, wardrobe, journal, winter Fuji
node brand/instagram/launch/shots3.js /tmp/shots               # title and adoption screens
node brand/instagram/launch/make.js   /tmp/shots all           # posts | banner | info | profile | covers | grid | all
```
`make.js` draws the extra posts, `make_banner.js` the panorama and tiles (it measures each dog's real outline and lays the dogs out so none overlap; the cottage, trees, fence and lanterns are drawn there too), `make_info.js` the informative series, `make_extra.js` the covers, profile pictures and grid mockup. The dogs and props are the real art (`PawArt.dog`, `PawArt.prop`). Text is Caveat from Google Fonts (needs network). The tiles are cut from one 3104 px picture, each 1080 wide and overlapping by 68 px, so the 3:4 grid crop (34 px off each side) joins exactly.
