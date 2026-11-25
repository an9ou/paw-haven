# "Noodle is ready for the holidays" dance loop Reel

The owner shared a trending Reel on 25 Nov 2026 (an illustrated dachshund dancing to "Teach Me How to Dougie", captioned "Get ready for the holidays", 22K likes) and said "Lets make it". This is our own take. Only the trend is shared: our dog, our art, our room and our words.

This is the English cut only. There is no RedNote cut, no cover and no captions yet. It is made and waiting for the owner. Nothing is posted.

## Files

| File | What |
|---|---|
| `brand/instagram/launch/dougie_reel/doodle-doggo-holiday-dance.mp4` | **The one to post.** 1080 x 1920, 30 fps, H.264, **11.30 s (339 frames) = 4 bars of 4 beats at 85 BPM**. A seamless loop with no end card (owner, 16 Nov 2026: loop Reels have no end card). The website goes in the caption later. **No music**: a digitally silent stereo AAC track (48 kHz). |
| `brand/instagram/launch/dougie_reel/doodle-doggo-holiday-dance-beatcheck.mp4` | **Not for posting.** The same video with a soft click on every beat, louder on beat 1 of each bar. Use it to check the sync. |
| `capture_dougie.js` | Clean captures from a fresh worktree of origin/main (c4212e35, v2.33.1), game date 25 Nov 2026, through the test harness. |
| `build_dougie.js` | The plan (beat grid, looks, moves), the frames on the frozen page clock, every check, both encodes and checkFrames. |

## The music: what we do and don't put in the file

- The song "Teach Me How to Dougie" (Cali Swag District) is copyrighted, so **it is not in our file**. The posting MP4 has only a silent audio track: no music, no clicks and no voice. The owner adds the trending sound in the Instagram app.
- I chose a silent track over no audio stream at all. A normal audio stream with nothing in it works with Instagram's "Use audio" and its original-audio volume slider, and with any editor. There is nothing in it to hear or to claim.

### Tempo and source

**85 BPM**, so one beat is 0.7059 s and one bar (4 beats) is 2.8235 s.

- Music Gateway, song key and BPM: "Teach Me How to Dougie", 85 BPM. https://musicgateway.com/music-tools/song-key-bpm/cali-swag-district/teach-me-how-to-dougie
- AudioKeychain: 85.00 BPM. https://www.audiokeychain.com/track/bG/cali-swag-district-teach-me-how-to-dougie
- A DJ track log (University of Waterloo, CHR radio set) gives 86 as the published figure, 85.0 from Mixmeister and 170 (double time) from Traktor. https://cs.uwaterloo.ca/~dtompkin/music/track/CHRRADIO_216/CHRRADIO_216-10.html

All three are automated analyses, not the label's own data. They agree on 85, so the Reel uses 85.

### How the owner adds the sound in Instagram

1. New Reel, then pick `doodle-doggo-holiday-dance.mp4` (not the beatcheck file).
2. Tap the music note ("Add audio"), search for **Teach Me How to Dougie** or open the trending Reel's sound and tap **Use audio**.
3. **Line up beat 1 with 0.0 s.** The first look (the Pom-pom Beanie with its sparkle pop and Noodle's first hop) lands on frame 0. In the audio trim, drag the song so a strong downbeat (the start of a bar, for example right on "Teach me how to Dougie") sits at the very start of the clip. **You may need to nudge the start of the sound** a little in Instagram's audio trim until the hops land on the beat. Every outfit change and every hop is on a beat, so once beat 1 lines up, the rest follows.
4. The clip is 11.3 s, exactly 4 bars, so the song loops with the video bar for bar.
5. If Instagram shows an "original audio" slider, set it to 0 (it is silent anyway).
6. To check the sync before posting, play `doodle-doggo-holiday-dance-beatcheck.mp4` next to the song: each click is a beat, and the louder click is beat 1 of a bar.

## The beat grid

Beat b starts on frame `round(b x 60/85 x 30)`, so each cut lands on the nearest frame. In the build, a frame's beat comes from its own time n/30 (with a half-frame tolerance), and the frame number comes from the frozen clock with the 0.0001 frame-index nudge. Smooth motion inside a beat runs over that beat's own frames (21 or 22), so frame 339 is frame 0 again, pixel for pixel. The 16 beats last 11.294 s and the loop is 11.300 s: the video is 6 ms (a fifth of a frame) longer than 4 exact bars.

| Bar.beat | Time (s) | Frame | Move (the game's own pose and face) | Look (pop = it lands here) |
|---|---|---|---|---|
| 1.1 | 0.000 | 0 | hop: dance, facing right, zoomies | Pom-pom Beanie (pop) |
| 1.2 | 0.706 | 21 | dance leaning left (facing left), wink | Pom-pom Beanie |
| 1.3 | 1.412 | 42 | dance leaning right, hearts | Reindeer Antlers (pop) |
| 1.4 | 2.118 | 64 | sit and wave (`paw`), blep | Reindeer Antlers |
| 2.1 | 2.824 | 85 | hop: dance, facing right, zoomies | Reindeer Antlers + Jingle Bell Collar (pop) |
| 2.2 | 3.529 | 106 | dance leaning left (facing left), wink | Reindeer Antlers + Jingle Bell Collar |
| 2.3 | 4.235 | 127 | dance leaning right, hearts | Knit Winter Sweater + Pom-pom Beanie (pop) |
| 2.4 | 4.941 | 148 | proud sit (`sit`), proud ("ta-da!") | Knit Winter Sweater + Pom-pom Beanie |
| 3.1 | 5.647 | 169 | hop: dance, facing right, zoomies | Knit Winter Sweater + Pom-pom Beanie + Snowflake Snood (pop) |
| 3.2 | 6.353 | 191 | dance leaning left (facing left), wink | (same) |
| 3.3 | 7.059 | 212 | dance leaning right, hearts | Father Christmas Suit (pop) |
| 3.4 | 7.765 | 233 | sit and wave (`paw`), blep | Father Christmas Suit |
| 4.1 | 8.471 | 254 | hop: dance, facing right, zoomies | Father Christmas Suit + Jingle Bell Collar (pop) |
| 4.2 | 9.176 | 275 | dance leaning left (facing left), wink | (same) |
| 4.3 | 9.882 | 296 | dance leaning right, hearts | (same) |
| 4.4 | 10.588 | 318 | proud sit (`sit`), proud ("ta-da!") | **Pom-pom Beanie again (pop)**, so the loop closes |

Then 11.300 s is frame 0 again: beat 1, the hop in the Beanie.

- **The moves.** Each beat shows one of the game's three crayon drawings of its pose (`PawArt.dog('dachs', { pose, facing, expr, outfit })`). The dance's three drawings tilt the head (0, -10 and +10 degrees), so the hop uses the straight one and the two leans use the tilted ones. The art is never stretched or redrawn. Over it, whole-body moves on the beat only: a bounce that touches down on every beat (30 px), a hop on every bar's beat 1 (60 px up and back down by beat 2; his crayon floor shadow stays on the floor), a small settle on the end-of-bar sit (12 px) and a lean of up to 2.2 degrees from side to side over two beats. Noodle stays centred on his spot. Each drawing is placed by its own drawn box, so the sit poses (which sit further right in the art's box) don't jump sideways.
- **Why no play bow.** The game's `bow` pose is 224 art units long. At Noodle's dance size it would be about 880 px, wider than the safe zone, so each bar ends on a sit instead: a sit-and-wave in bars 1 and 3, and the game's proud "ta-da!" sit in bars 2 and 4.
- **The pop.** When a look lands (and on beat 1 at 0.0 s), five of the game's own sparkle doodles (world A `O.sparkle`: the four-point crayon star in the game's yellow and pink) pop in an arc above his head for 12 frames. They grow, turn and fade, and they move with him.
- **The outfit timing.** A new look every 2 beats (beats 1, 3, 5, 7, 9, 11 and 13), the Father Christmas Suit with its collar held for 3 beats, then the first look back on the last beat (4.4). Beat 1 (0.0 s) has no outfit change of its own: it is the Beanie's first frame, with a pop and the first hop, which is what to line the song up with.

## The looks: real game clothes

All six pieces were checked in the capture against main's `CLOTHES` (`game/src/00_core.js`: name and slot) and `game/i18n/en.json` (the English item name). Where players get them, for the caption later:

| Piece | Slot | In the game |
|---|---|---|
| Pom-pom Beanie | head | all year (90 coins) |
| Knit Winter Sweater | body | all year (150 coins) |
| Reindeer Antlers | head | Snow Days (from 1 Dec) and the Winter Market |
| Snowflake Snood | neck | Snow Days (from 1 Dec) and the Winter Market |
| Jingle Bell Collar | neck | Winter Market (1 to 26 Dec) |
| Father Christmas Suit | body | Winter Market (1 to 26 Dec) |

So "Get ready for the holidays" is true: half the looks arrive in the game on 1 Dec. No white costume and no black or white dog: Noodle's red-brown coat is the subject.

## The words on screen

- **Bar 1 (0 to 2.75 s): "Get ready / for the holidays"**, on a cream card (Caveat, the second line in Christmas red), with the game's own crayon **Felt Fir Tree** (`PawArt.prop('wmfirtree')`) standing beside the card in place of the 🎄 emoji. It fades in over 0.5 s from 0.0 s and fades out from 2.3 s.
- **Bar 4 (8.47 to 11.15 s): "Noodle's ready. / Is your dog?"**, on the same kind of card. It fades in over 0.5 s from beat 4.1 and is gone by 11.15 s.
- Frame 0 and the last frame show no words, so the seam is clean. (A fade much faster than half a second changes a frame as much as a beat cut, and checkFrames would call it a jump.)
- Each text sits in the exact centre of its card (`centreCheck`). All words and key art are inside x 60..850, y 270..1440. The cards sit low enough to stay off the floor lamp's glow rays.
- The game's own art writes "ta-da!" (proud) and "blep" (blep) next to Noodle's head: these are the faces' own words.

`hookscore.py` (the owner's lines come first; the loop's mood matters more than the score):

| Score | Line |
|---|---|
| 51.2 OK | Your dog on December 1st |
| 47.6 WEAK | Four outfits, one bar each |
| 40.8 WEAK | Holiday fit check, one beat at a time |
| 37.8 WEAK | **Noodle's ready. Is your dog?** (used, bar 4) |
| 37.8 WEAK | Is your dog holiday ready? |
| 34.2 WEAK | Teach me how to holiday |
| 30.0 WEAK | **Get ready for the holidays** (used, bar 1) |
| 30.0 WEAK | Noodle is ready for the holidays |

The scorer wants stakes and specifics. A dance loop to a trending sound rides the sound, and the two lines the owner asked for are short, true and warm, so I kept them. "Your dog on December 1st" could go in the caption.

## The place

**The Cozy House living room at night** (`house`; captured from the game as it draws it: `svg.world` with our dog left out). It hasn't been in the recent Reels (Winter Market, Home Yard, Ueno Park, Town Square, Lighthouse Pier, Hilltop Meadow, Maple Woods, Riverside). The game date is 25 Nov 2026 (autumn), so there are no Christmas lights, no Snow Days and no snow: those start on 1 Dec. The window is the right-hand side of the room, scene x 640..910, y 120..600 at 4x, so the scene fills the frame to the bottom: the bare striped wall under the house-and-heart picture, the floor lamp's warm glow, the kitchen counter, and three **Cozy Winter** decorations from the kind shop placed as a player places them (`S.decor[n].at`; placement mode keeps a spot the player chose): the **Cardboard Fireplace** with its paper flames against the counter, and the **Cocoa Mug Lamp** (lit) and the **Doggy Snow Globe** on the floor at the front. The dog bed was moved to the middle of the room, out of the shot. The room has no animation of its own (the capture checks this), so all the motion is Noodle's.

Noodle's spot: feet on y 1430, centred on x 420. The dance drawings are **540 to 619 px wide** (his crayon floor shadow makes the whole dog about 710 px). He can't be bigger: he and his shadow fill the room from the safe zone's left edge to the fireplace, 28 px clear of it, and the fireplace has to stay far enough left for its flames to show. He stays 28 px clear of the fireplace, the mug lamp, the snow globe and both cards on every frame (`apartCheck`).

## Checks (all passed)

- **Frozen clock**: all footage is stepped with `freezeClock`, `stepClock` at exactly t0 + (n + 0.0001) x 1000/30 ms, and `releaseClock` (`../frozen_clock.js`). Frame 339 rendered equals frame 0, byte for byte.
- **Every frame** (CHECK=1 and the render): `centreCheck`, `safeCheck`, `apartCheck` (28 px), Noodle inside x 60..850 / y 270..1440, no sparkle over Noodle, a card or a prop, and sparkles inside the safe zone.
- **checkFrames(0..338)**: median 1.03; **no doubled frames**; the 15 jumps are exactly the beat cuts (frames 21, 42, 64, 85, 106, 127, 148, 169, 191, 212, 233, 254, 275, 296, 318), with **none off the beat**. Smooth frames: median 0.98, min 0.18, max 3.0. Beat cuts: 6.54 to 8.09.
- **Seam** (frame 338 to frame 0, beat 4.4 to beat 1.1, the 16th beat cut): **6.64**, 6.45x the median. This is a beat cut like the others and sits inside their range (6.54 to 8.09). There is no text on either side.
- **ffprobe**: h264 1080x1920 yuv420p, 30/1, 339 frames, 11.300 s; aac 48 kHz stereo, 11.300 s; 2.43 MB. The posting file's audio max_volume is -91.0 dB (digital silence, the 16-bit floor).
- Stills were viewed at 1x. Contact sheet (12 stills, about one a beat) and seam strip (frames 336, 337, 338 | 0, 1, 2): `dougie-contact-sheet.jpg` and `dougie-seam-strip.jpg` in the session scratchpad (not committed).

## Rebuild

```
git worktree add --detach <scratch>/dougie_main origin/main
cd <scratch>/dougie_main && node game/build.js && node game/harness.js merged
NODE_PATH=$(npm root -g) node brand/instagram/launch/dougie_reel/capture_dougie.js <scratch>/dougie_main <scratch>/caps
ART_ROOT=<scratch>/dougie_main CAPS=<scratch>/caps NODE_PATH=$(npm root -g) node brand/instagram/launch/dougie_reel/build_dougie.js <scratch>/work
```

`ONLY=sprites` (every drawing used), `ONLY=stills`, `CHECK=1`, `FRAMES=a-b` (re-render part, then encode again), `ENCODE=1`, `DEBUG=1`.

## Still to do (only when the owner asks)

- The cover, the captions (Instagram, TikTok, YouTube Shorts, X; website doodledoggo.app, never itch.io) and a RedNote cut, after the owner approves this English cut.
