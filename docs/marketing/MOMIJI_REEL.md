# "Peak momiji week" loop Reel

The owner approved the idea on 21 Nov 2026 and asked for it right away. It is the English cut only: no RedNote cut, no cover and no captions yet. Made and waiting for the owner. Nothing is posted.

Autumn leaves in Japan are at their peak this week, so this is a calm loop made for saves and rewatches. Noodle naps under one of the game's red momiji trees while leaves drift down. The last frame flows into the first.

## File

| File | What |
|---|---|
| `brand/instagram/launch/momiji_reel/doodle-doggo-momiji-loop.mp4` | 1080 x 1920, 30 fps, H.264 + AAC 192k, **15.00 s (450 frames)**, -16.0 LUFS. A seamless loop with no end card (owner, 16 Nov 2026: loop Reels have no end card). The website goes in the caption later. |
| `capture_momiji.js` | Clean captures from a fresh worktree of origin/main (3950b5b1, v2.32.1), game date 21 Nov 2026, through the test harness. |
| `build_momiji.js` | Builds the frames on the frozen page clock, runs every check, makes the music loop, encodes the video and runs checkFrames. |

## The hook (on screen)

**"Your 15 seconds of Tokyo autumn, / no rush"** (`hookscore.py`: **80.8, STRONG**). It is true to the place and the length: the scene is Ueno Park in Tokyo and the loop is exactly 15.0 s.

It sits on one small, soft cream card (Caveat, pen brown, the second line muted) at the top of the safe zone, centred on x 455. It fades in over the first second, holds until 3.4 s and fades out by 4.2 s. At frame 0 it is at 0, so it doesn't break the loop.

Options scored (no emoji, because the scorer counts an emoji in the hook as a dealbreaker):

| Score | Line |
|---|---|
| 84.4 | 15 seconds of Tokyo momiji you can still catch |
| 84.4 | 15 seconds of Japan autumn you can still catch |
| 83.2 | Take 15 seconds of Tokyo autumn before the leaves fall |
| 80.8 | **Your 15 seconds of Tokyo autumn, no rush** (used) |
| 80.8 | Your 15 seconds under Tokyo's red maples, no rush |
| 77.8 | Your 15 seconds of peak momiji, no rush |
| 62.6 | Only 15 seconds of peak momiji in Japan |
| 50.6 | 15 seconds of autumn in Japan |
| 35.6 | 15 seconds of autumn in Japan 🍁 (emoji: dealbreaker) |
| 25.2 | Peak momiji week |

I chose the 80.8 line over the two 84.4 lines because "no rush" fits the calm loop and asks for nothing. "Momiji" is also a word many English viewers don't know yet. It can go in the caption instead.

## Scene source

- **Ueno Park** (`ueno`, `world/pawart_world_e.js`; a Tokyo trip place, `game/src/39_tokyo.js`). It hasn't been used in a Reel before. Its two big cherry trees turn momiji red in autumn (`pa-we-sakura data-bloom="autumn"`). This is the strongest momiji scene in the game. I compared it in autumn, with the Japan scenery on, against the Mt. Fuji Lookout (one small maple), Asakusa, Yoyogi, Tokyo Tower, Shibuya, the Bamboo Grove, the Cliffs, the Sunflower Field and Hilltop Meadow, which have only small orange or red trees.
- The scene is captured from the running game (svg.world): autumn, **golden hour** (time `dusk`, the warm pink sky through the leaves), sunny, the Japan scenery on (`data-jp="1"`), festivals left to the date. The tap-spot outlines are hidden, as the game hides them.
- **The right-hand maple at 4.6x.** The window is x 765..999.8 and y 182.6..600, so it runs to the scene's foot with no blank areas. The red crown fills the top third and its trunk runs down to the sand, with the pond, lotus pads and the end of the hanami deck behind. The grass corner with flowers is at the bottom, along with the scene's own paper tape, which is under the caption area.
- **Noodle** is `PawArt.dog('dachs')`, lying down (`down`), facing right, with the game's `dreamy` face (bubbles and blush). His drawn box is about 590 px wide, at x 92..684 and y 1163..1432, on the open sand. He is 28 px clear of the deck (its box, its foot and its side rope) and the maple's trunk.
- **Motion:**
  - A slow 3 s breath: the art is scaled about its feet, 5 breaths a loop.
  - The art's own 3-drawing crayon wobble, read off the game on the frozen clock: 10 frames per drawing.
  - One look up: from 8.17 to 10.17 s he wears the game's `curious` face (the "?") while one leaf drifts past his nose, just right of the "?". The face changes on a wobble flip, so it never pops.
- **Falling leaves are the game's own:** the leaf drawing and the fall of Ueno's "Momiji walk". I ran the walk in the game (`tkHanami` -> `tkPetals('momiji')`) and read the leaves and their CSS animation `tkPetal` off the page: 3.4 s, ease-in, `translate(dx, 340)` with opacity 1 to 0, dx -60..60, a random tilt.
  - In the Reel the same fall is slowed to 2x (6.8 s) for calm, with a gentle rock (±16°), a sway (±6 units) and a 0.35 s fade-in as each leaf leaves the canopy.
  - There are 26 leaves a loop at 0.55..0.85 of the game's size. Each repeats every 15 s, so they wrap round the loop point.
  - No leaf crosses the line's card while it shows. Eight were moved to the right-hand edge and one was left out.

## Music source

The game's own engine (`mods/pawaudio.js`, `PawAudio._render`) with exactly the context the game sends at Ueno at golden hour, captured from `audioPlace()`: `{ place: 'ueno', time: 'dusk', weather: 'sunny' }`. The engine plays its yard music for an outdoor place it has no theme for, with the "dusk: warm, lazy" variant: slower, more swing, softer hats, the warm progression.

It is rendered 2.2 s longer, then crossfaded end into start, as in `costume_reel_xmas/build_xmas.js`:
- 1 s qsin fade-in at the start
- the tail mixed under it with a 1 s fade-out
- two-pass loudnorm to -16 LUFS

There are no stings and no voice. Audio join: a step of 159 across the loop point against a median sample step of 116 (p99 717), so there is no click.

## Shot list (one shot, 15.0 s, loops)

| Time | Frames | What |
|---|---|---|
| 0.0-1.0 s | 0-29 | The line fades in over the maple crown. Noodle dreams on the sand, and leaves are already falling (they started at the end of the last loop). |
| 1.0-3.4 s | 30-101 | The line holds. Leaves drift from the crown over the pond and the deck. |
| 3.4-4.2 s | 102-125 | The line fades out. |
| 4.2-8.2 s | 126-244 | Just Noodle breathing, the wobble and the leaves. |
| 8.17-10.17 s | 245-304 | One leaf leaves the canopy by the trunk and drifts down past his nose. He looks up with the curious face, then goes back to dreaming. |
| 10.2-15.0 s | 305-449 | Leaves and breathing. Frame 450 would be frame 0 again, pixel for pixel. |

## Checks

- **Frozen clock** (`brand/instagram/launch/frozen_clock.js`): the page animates itself with requestAnimationFrame and performance.now() (leaves, breath, line and face), and the dog art's wobble is its own CSS animation. Frames are made with `freezeClock`, a prime step (the wobble is born at t0), then `stepClock(t0 + (n + 5 + 0.0001) x 1000/30)` before each screenshot, then `releaseClock`. That is the 0.0001 frame-index nudge. The 5 frames set the wobble half a drawing into its cycle, so its flips land on frames 5, 15, 25 and the loop point is an ordinary frame step.
- **Loop closes:** frame 450, rendered, is byte for byte the same PNG as frame 0.
- **Per frame (all 451):** the build throws on any failure.
  - `centreCheck()`, `safeCheck()` and `apartCheck()` at 28 px: Noodle's drawn box against the deck and the trunk.
  - Noodle is 550..700 px wide and inside x 60..850, y 270..1440.
  - No leaf is over the line's card while it shows.
- **checkFrames(mp4, 0, 449):** median 0.40.
  - **doubled: none.**
  - Its "jumps" list holds only frames that are the art's own wobble steps (frames 5, 15, 25 ...: a new crayon drawing of Noodle, 0.88..1.56, as in the town goal Reel). **Jumps off a wobble step: none.**
  - Every other step is 0.25..0.63 (median 0.39).
- **Seam:** last frame to first is **0.54** in the MP4 (1.35x the median, inside the ordinary 0.25..0.63 range) and 0.42 on the source frames (median 0.38).
  - The encode puts keyframes on frame 0 and frame 449 at CRF 16. A P-frame against the opening I-frame had doubled the seam to 0.80.
- **ffprobe:** h264 1080x1920 yuv420p 30/1, 450 frames, 15.000 s; AAC 44.1 kHz stereo 15.000 s; 3.3 MB. EBU R128: -16.0 LUFS, LRA 0.8.
- **Stills looked at 1x:** the line's card (f60) and Noodle's look up (f270).
  - Contact sheet (8 stills): `/tmp/claude-0/-home-user-paw-haven/821f93b0-fc0a-5e7e-8605-cd441828990a/scratchpad/momiji/momiji-contact-sheet.jpg`
  - Seam strip (f447, f448, f449, f0, f1, f2): `/tmp/claude-0/-home-user-paw-haven/821f93b0-fc0a-5e7e-8605-cd441828990a/scratchpad/momiji/momiji-seam-strip.jpg`
  - Both are in the scratchpad and not committed.

## Rebuild

```
git fetch origin main && git worktree add --detach <scratch>/momiji_main origin/main
(cd <scratch>/momiji_main && node game/build.js && node game/harness.js merged)
NODE_PATH=$(npm root -g) node brand/instagram/launch/momiji_reel/capture_momiji.js <scratch>/momiji_main <scratch>/momiji/caps
ART_ROOT=<scratch>/momiji_main CAPS=<scratch>/momiji/caps NODE_PATH=$(npm root -g) node brand/instagram/launch/momiji_reel/build_momiji.js <scratch>/momiji/work
# ONLY=stills (TS=frame,frame,...), FRAMES=a-b (re-render part, same music), ENCODE=1 (encode again), CHECK=1 (checks only)
```

## Notes for later

- **Dog:** the brief asked for Noodle. The README's "a different dog each time" rule is for ads; this is a calm loop, so I followed the brief.
- **Caption (later):** the website goes in the caption (https://doodledoggo.app) and nothing else. A loop has no end card. Don't say "made in Japan" (say "Japan-style"), and no 🇯🇵 flag.

## RedNote cut (23 Nov 2026)

The owner asked for it ("Create rednote version"). This is the cut only, with no cover and no captions. The English MP4 is unchanged (its md5 was checked after the build).

- **File:** `brand/instagram/launch/momiji_reel/doodle-doggo-momiji-loop-rednote.mp4`. It is h264 1080 x 1920, 30 fps, **15.00 s (450 frames)**, with AAC audio at -16.0 LUFS. It is the same seamless loop with no end card.
- **Build:** `REDNOTE=1 ART_ROOT=<main> CAPS=<caps> NODE_PATH=$(npm root -g) node brand/instagram/launch/momiji_reel/build_momiji.js <workdir_rn>`. Copy the English workdir's `music.wav` into it first, so the music is the same render. The build refuses to run without it.
- **On screen:** **东京红叶季，给你15秒** (10 characters), with **上野公园** smaller under it. 上野公园 is the game's own zh-Hans name for Ueno Park (`data.tk_places.ueno.n`, `tokyo.pin_ueno`, checked against `game/i18n/zh-Hans.json` on main).
  - It uses 红叶季 and is true to the place and the length.
  - The font is LXGW WenKai (`RN_FONT_CSS`). There is no emoji, because WenKai has no glyph for one and a fallback face would throw off the centring.
- **Layout:** the full frame with a 50 px margin. The card is centred on x 540 (y 287..457, 760 wide) over the maple crown. The fade is the same: in over the first second, out by 4.2 s.
  - The leaves are the same 26 events. The rule against crossing the card moved 9 to the right edge instead of 8, because the card is wider, and left out 1.
- **Refused words:** the build fails if the line has any Latin letter, @, a domain, 链接 网址 官网 二维码 扫码 下载 私信我 加我 主页链接 戳 发帖 快拍 帖子, or any app or platform name.
- **Checks on every frame (451):** `centreCheck()`; the card, its text and Noodle inside the 50 px margin; `apartCheck()` at 28 px (Noodle against the deck and the trunk); no leaf over the card while it shows. Frame 450 is the same PNG as frame 0.
- **checkFrames(mp4, 0, 449):** median 0.39.
  - **doubled: none.**
  - Jumps off a wobble step: **none**. Every flagged frame is one of the art's own crayon redraws (frames 5, 15, 25 ...; 0.87..1.56).
  - Every other step is 0.20..0.69.
- **Seam:** last frame to first is **0.54** (1.38x the median, inside the ordinary range). The keyframes are on frame 0 and frame 449 at CRF 16.
- **Seen at 1x:** frame 60. Seam strip: `/tmp/claude-0/-home-user-paw-haven/821f93b0-fc0a-5e7e-8605-cd441828990a/scratchpad/momiji/momiji-rednote-seam-strip.jpg` (in the scratchpad, not committed).
