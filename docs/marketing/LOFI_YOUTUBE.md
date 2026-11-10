# YouTube lofi loop: "rainy evening" (owner, 7 Nov 2026)

Owner's ask: "a looped lofi music video for posting on YouTube. You can choose the dog/dogs, place, movements, in around 30 s first."
Owner, 7 Nov 2026: "we can now loop it to around 30 mins". **30-minute version made and sent** (not in the repo: 244 MB): the 30 s loop re-encoded once at CRF 24 (`-tune animation`, so 60 copies fit under the 500 MB send limit), then
```
ffmpeg -stream_loop 59 -i loop_crf24.mp4 -stream_loop 59 -i <workdir>/cozy_loop.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart -t 1800 rainy-evening-30min.mp4
```
1800.0 s, -16.1 LUFS, joins checked at 30 s, 15 min and 29.5 min (no click). Title for it: `rainy evening lofi 🌧️ 30 minutes of cozy beats with two sleepy crayon dogs` (the 1-hour title below, with the length changed).

## Files (`brand/youtube/lofi/`)

- `rainy-evening-loop-30s.mp4`: the loop, 1920 x 1080, 30 fps, 900 frames, H.264 + AAC 192k, exactly 30.000 s, -16 LUFS integrated, true peak -2.6 dBTP. Frame 900 would be frame 0 again (checked pixel for pixel), the music is a seamless 10-bar loop.
- `lofi-rainy-evening-thumb.jpg`: the 1280 x 720 thumbnail ("rainy evening lofi" in Caveat, Pickle with his curious "?", Scone asleep, the logo).
- `lofi-rainy-evening-poster.jpg`: the same picture with "play at doodledoggo.app" beside the logo (owner, 9 Nov 2026; `make_poster.js`). Bottom-left only, as YouTube puts the video length bottom-right.
- `build_lofi.js`: the video build. `cozy_lofi.js`: the music (the game's music engine with one added place, 'cozy').

## The scene

The Cozy House living room at night in the rain (the game's own scene, built-in bed left out, no game UI). Pickle the Jack Russell sits on the back of the sofa in front of the rainy window; Scone the Cavalier sleeps in the Cloud Bed on the bed rug. Real game art only; the little moves are the game's own pose parts (head tilt about the neck, ears, eyes, yawn mouth, tail angle, the 'curious' face), so nothing is redrawn. The dogs never touch (apartCheck on every frame).

Moves (all repeat exactly every 30 s): Pickle blinks, twitches his ears, yawns once (8-10.6 s) and tilts his head at a big raindrop that lands by his nose (19.6 s). Scone breathes slowly, flicks an ear, thumps his tail twice and sends up the game's sleepy z's. Rain at three depths behind the glass, drops that sit and then run down the glass, the floor lamp's glow breathing, steam from the kettle, warm dust motes, a slow camera drift that comes back to its start. Small logo bottom left, no words, no end card.

Music: F major-7 changes over 10 bars (Fmaj9 Am9 Bbmaj9 C9sus Fmaj9 Dm9 Gm9 C13 Bbmaj9 C9sus), 80 bpm (a bar is 3 s, so 10 bars = 30 s), swing 0.62, lazy kick, brushed snare, comped keys, warm bass, kalimba topline, pad, vinyl crackle, the game's indoor rain and window taps. Seeded, so it renders the same every time.

## Rebuild

```
# the Cavalier and the Jack Russell are v2.21 breeds: until main is merged into marketing/launch, point SRC at a worktree of main
git fetch origin main && git worktree add --detach /tmp/dd_main origin/main
SRC=/tmp/dd_main PAR=3 NODE_PATH=$(npm root -g) node brand/youtube/lofi/build_lofi.js /tmp/lofi_rainy
# ONLY=stills (key frames), FRAMES=a-b (re-render part, same sound), THUMB=1 (thumbnail), LONG=60 (a 60-minute test file in the workdir)
```

Long version (after approval), from the loop and its seamless wav (`<workdir>/cozy_loop.wav`): video stream-copied, audio re-encoded from the tiled wav so no AAC padding lands on the joins:

```
ffmpeg -stream_loop 119 -i rainy-evening-loop-30s.mp4 -stream_loop 119 -i /tmp/lofi_rainy/cozy_loop.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -movflags +faststart -t 3600 rainy-evening-1h.mp4
```

A 10-minute test made this way played clean at every join (no click or gap at 30, 60, 90 s).

## YouTube title

30 s loop (or a Short): `rainy evening lofi 🌧️ two crayon dogs and a cozy beat`

Long version: `rainy evening lofi 🌧️ 1 hour of cozy beats with two sleepy crayon dogs`

## Description (ig-human detect.py: PASS, 77.9)

```
It's raining, we're staying in, and that's the whole plan tonight.

Pickle the Jack Russell has climbed onto the back of the sofa so he can watch the rain. Now and then a fat drop lands on the glass right by his nose and he tilts his head at it like it owes him money. Scone the Cavalier stopped caring about the rain ages ago. He's out cold in his Cloud Bed, and if you watch long enough you'll catch his tail thumping in his sleep.

I made the beat for them: slow lofi at 80 bpm, warm keys, a soft bass, a bit of vinyl crackle and the rain tapping on our window. Put it on while you study, read, work or drift off. It loops, so you don't have to get up.

Pickle, Scone, the living room and the bed are all from Doodle Doggo, our free cozy dog game that runs in your browser. You adopt wobbly crayon dogs, take them for walks around a pencil-drawn town and tuck them in at night. Nothing bad ever happens there, we promise.

🎮 Play free: https://doodledoggo.app
☕ Ko-fi: https://ko-fi.com/doodledoggoapp
📷 Instagram: https://www.instagram.com/doodledoggo.app/

#lofi #rainyday #cozygames
```

## Chapters

None. It is one scene on a loop, so chapters would only repeat the same 30 s; YouTube also needs three or more real sections for chapters to show.

## Tags

`lofi, lofi beats, lofi hip hop, rainy day lofi, rain sounds, lofi rain, cozy lofi, chill beats, study music, beats to relax, beats to study to, sleep music, cozy games, cozy game, dog lofi, cute dogs, jack russell, cavalier king charles spaniel, doodle doggo, browser game, free game, indie game, crayon art`

## Pinned comment (optional)

`which one are you tonight: Pickle watching the rain or Scone fast asleep? 🌧️🐶`
