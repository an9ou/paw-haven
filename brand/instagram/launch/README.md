# Launch images

Made 16 Oct 2026. Plan, captions and checklist: `docs/marketing/`.

| File | What |
|---|---|
| `banner-1-left-newest.jpg`, `banner-2-middle.jpg`, `banner-3-right-post-first.jpg` | **A. The 3-tile banner** (1080 x 1350). One word box (middle tile), 9 big dogs, the cottage and decorations. Post right, middle, left, then pin all three. |
| `banner-0-wide-preview.jpg` | The whole banner in one picture (3104 x 1350). For looking at, not for posting. |
| `info1-japan-view.jpg`, `info2-meet-the-dogs.jpg`, `info3-what-you-can-do.jpg`, `info4-how-to-play.jpg` | **B. The informative series** (1080 x 1350): Japan view, the 21 dogs, what you can do, how to play |
| `post1-meet-noodle.jpg`, `post2-pencil-town-fuji.jpg`, `post3-play-free-halloween.jpg` | Extra single posts. Post 3 is a good Halloween push. |
| `dogs/dog-01-mochi.jpg` ... `dog-21-strudel.jpg` | **The 21 dog introduction posts** (15 to 21 are the v2.11 Tokyo Trip dogs) (1080 x 1350): whole dog, puppy, name, game quote, what it loves, four traits. Captions: `docs/marketing/DOG_INTRO_POSTS.md` |
| `soon-more-dogs-coming.jpg` | Teaser post: "More dogs are coming! Stay tuned" (mystery dogs behind a fence) |
| `reel/doodle-doggo-reel-30s-soon.mp4`, `reel/doodle-doggo-reel-30s-play.mp4`, `reel/reel-cover.jpg` | The 30 s Reel (1080 x 1920) with the game's own music. `-soon` ends on "coming soon", `-play` on "play free, link in bio". Guide: `docs/marketing/REEL_AND_ADS.md` |
| `video45/doodle-doggo-promo-45s-soon.mp4`, `video45/doodle-doggo-promo-45s-play.mp4`, `video45/promo-45s-cover.jpg` | The 45 s English promo video: real gameplay, Noodle narrates (Kokoro voice), burned-in subtitles, the game's music. Guide: `docs/marketing/PROMO_VIDEO_45S.md` |
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
node brand/instagram/launch/make.js   /tmp/shots all           # posts | banner | info | dogs | profile | covers | grid | all
DOG_DOC=1 node brand/instagram/launch/make.js /tmp/shots dogs   # also rewrites docs/marketing/DOG_INTRO_POSTS.md (DOG_MODE=head swaps the puppy for a big head close-up)
```
`make.js` draws the extra posts, `make_banner.js` the panorama and tiles (it measures each dog's real outline and lays the dogs out so none overlap; the cottage, trees, fence and lanterns are drawn there too), `make_info.js` the informative series, `make_extra.js` the covers, profile pictures and grid mockup. The dogs and props are the real art (`PawArt.dog`, `PawArt.prop`). Text is Caveat from Google Fonts (needs network). The tiles are cut from one 3104 px picture, each 1080 wide and overlapping by 68 px, so the 3:4 grid crop (34 px off each side) joins exactly.

## Reel
`sh brand/instagram/launch/reel_build.sh <workdir> <shotsdir>` rebuilds both videos (`reel_footage.js` real gameplay, `reel_audio.js` the game's music, `reel_render.js` frames, `reel/reel.html` layout and timing).
