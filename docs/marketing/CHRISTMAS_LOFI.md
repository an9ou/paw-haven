# Christmas lo-fi: "Christmas by the fire" (preview, 25 Nov 2026)

Owner, 25 Nov 2026: "Can u create Christmas vibe lofi music, something like all i want for christmas is you".
The aim is that song's **vibe** (joyful, sparkly, sleigh bells, warm Christmas magic, a little bouncy) as cozy lo-fi, with an **original** tune and arrangement. Nothing is taken from the song.

**Status: a 60 s preview for the owner's approval.** No 30-minute version, video, poster or thumbnail yet. They wait for approval (see "If approved" below).

## Files

- `brand/youtube/lofi/christmas-lofi-preview.mp3`: 60.0 s, MP3 256 kbps, 44.1 kHz stereo, 2 s fade in, 5 s fade out.
  Measured (ffmpeg ebur128 / loudnorm): **-16.0 LUFS** integrated, **true peak -2.8 dBTP**, sample peak -2.76 dBFS, LRA 1.0 LU, no clipped samples.
- `brand/youtube/lofi/christmas_lofi.js`: the music. It patches a copy of the game's engine (`mods/pawaudio.js`) with one new place, `'xmaslofi'`, and renders it with `PawAudio._render` in Chromium, the same way `spooky_lofi.js` and `cozy_lofi.js` work. The game's own music does not change.

## The music (preview = variant `sleigh`)

- **Tempo:** 88 bpm, swung 16ths (swing 0.60).
- **Key:** F major, the game's own key centre.
- **Form:** 16 bars, one chord per bar, with rich 7th, 9th and 13th chords and two bright secondary dominants (D9, G9) for the warm "Christmas lift":
  - A: `Fmaj9 | Bbmaj9 | Am9 | D9 | Gm9 | C13 | Fmaj9 | C9sus`
  - B: `Bbmaj9 | C13 | Am9 | Dm9 | G9 | Gm9 | C9sus | C13`
  - D9 and G9 are new to the engine (rootless voicings like its own: D9 = F# C E A, G9 = B D F A). The rest are the engine's chords.
- **Topline:** an original 16-bar celesta tune, written out note by note in `MEL` in the script. It opens with a rising sixth (A C F-E C A C), answers with a falling line (D C A F), sequences the opening a step higher in bar 5 (Bb D G-F D Bb D), and closes each half with a stepwise run.
  - From the second time round, a soft music-box glock doubles the long notes an octave up.
  - A glittery bell chimes at the top of each half.
  - A sleigh-bell shake leads into bars 8 and 16.
- **Instruments:** all synthesised live by the engine. No samples, no recordings.
  - Rhodes FM keys with tremolo (the bouncy comp)
  - warm triangle + sine bass (the bouncy pattern, with chromatic approach notes)
  - swung kick (bouncy), snare with ghost notes
  - **sleigh bells** as the hats layer: the engine's Winter Market sleigh voice, made of 2-4 tiny sine jingles at 4.2-6.4 kHz and a breath of shaken noise. It plays a swung 8ths pattern with 16th pickups.
  - **celesta** lead (the Winter Market voice), plus the music-box glock and the glitter bell
  - a soft pad
  - vinyl crackle, tape wobble, reverb, and the lowpass warmth at 7.8 kHz
  - **a gentle fireplace**, new in this copy and made from the engine's own noise buffers: a low flickering roar, small wood pops and an occasional snap, "inside the room".
- **Seeded:** Math.random is seeded, so each render plays the same notes, hits and pops. Two Chromium renders differ only at about -64 dB.
- **Where things land in the preview:** the tune starts at 0 s. The sleigh shake comes at about 20.5 s, the B half at 21.8 s, the second shake at 42.3 s, and the second pass with the glock doubling and chime at 43.6 s.

### Listen-check (by measurement)

- **Swing:** in the solo sleigh-bell stem, every off-beat 16th lands about 0.2 of a 16th late (0.24 for `cocoa`). The 8ths sit on the grid. That is the 0.60 / 0.62 swing as set.
- **Bells come through:** the sleigh-bell energy at 4-7.5 kHz sits at -17.4 dB of the whole mix in `sleigh` (-18.7 in `cocoa`, -20.5 in `musicbox`). They show as a steady dotted band in the spectrogram for the whole track.
- **The tune plays as written:** the strongest pitch at each scored note onset in the celesta stem matches the score for 83 of 83 notes.
- **Balance** (solo stems, before mastering, LUFS): celesta -23.5, keys -24.5, bass -22.7, drums -24.3, sleigh bells -30.8, fire -39.7, crackle -41.5, full mix -17.7. The tune sits level with the keys, and the fire and crackle stay well under the music.
- **Master:** a fade, a gain to -16 LUFS and a gentle limiter at -2 dBFS. No voices were dropped (0 over the engine's polyphony cap).

## The three variants rendered

All three use the same tune, form and chords. Each was mastered the same way to -16.0 LUFS.

| variant | bpm | swing | groove | bells | lead | other | TP |
|---|---|---|---|---|---|---|---|
| **`sleigh` (picked)** | 88 | 0.60 | bouncy keys, bouncy bass, bouncy kick, ghost snare | jingle 8ths + 16th pickups, shakes into bars 8/16 | celesta + glock doubling on pass 2, chimes | fire 0.7, lowpass 7.8 kHz | -2.8 |
| `cocoa` | 86 | 0.62 | comp keys, bass with approach notes, std kick, ghost snare | same as sleigh | celesta + glock doubling, chimes | fire 0.85, lowpass 7.2 kHz | -3.0 |
| `musicbox` | 84 | 0.64 | comp keys, full bass, lazy kick, brushed snare | the Winter Market's own sleigh pattern, no shakes | music box (soft glock), chimes | fire 0.9, soft snowy wind outside, lowpass 6.4 kHz | -2.7 |

**Why `sleigh`:** it is the most joyful and Christmassy of the three, the closest to the "a little bouncy" Christmas-pop feel asked for, with the brightest bells, and it still sounds like lo-fi.
- `cocoa` is the cozier, more laid-back pick. It is the better choice if the owner wants it calmer for the 30-minute version.
- `musicbox` is the sleepiest, so it was not chosen ("joyful, not sleepy").

Any of them renders with one command (below).

## How it echoes the vibe without copying

**What gives the vibe** (the general Christmas sound, which nobody owns):
- sleigh bells on every 8th note, with shakes into the turnarounds
- the bell-like celesta and the glittery chimes
- bright major-key harmony with secondary-dominant lifts
- a bouncy bass and a happy swung groove
- the warmth of the fireplace

**What is original and how it differs from "All I Want for Christmas Is You":**
- **Melody:** composed for this track and written out in `MEL`. Its phrases, rhythms and contour come from the game's chords (arpeggios and stepwise runs). No phrase, hook or rhythm of the song is used, quoted or paraphrased, and there are no lyrics or words.
- **No piano intro:** there is no rubato or free-time opening and no solo piano. The track starts in tempo on the groove under a fade.
- **Chords:** our own 16-bar form in F. It avoids the song's signature moves:
  - no long stretch on the tonic
  - no minor-iv colour chord
  - no descending chromatic line-cliché or augmented chords

  The moves it uses (I-IV-iii-VI7-ii-V, a II7 before ii-V) are shared jazz and pop vocabulary, in an order that does not follow the song.
- **Groove and tempo:** a slow, swung lo-fi beat at 88 bpm in 16ths. The song is a fast, straight-eighth pop shuffle with pounding piano chords. Here the keys comp in syncopated hits.
- **Sound:** no vocals, no choir or backing vocals, no samples or recordings of anything. Every sound is synthesised live by the game's own WebAudio engine (FM Rhodes, sine celesta, the sleigh voice made of sine jingles and noise), so the track sounds like the game's music.

## Render

```
# the celesta and sleigh voices are on main since v2.18.4 (Winter Market). If this branch's mods/pawaudio.js has no EP.sleigh,
# the script reads origin/main's copy with git (or set SRC=<a main worktree>).
NODE_PATH=$(npm root -g) node brand/youtube/lofi/christmas_lofi.js brand/youtube/lofi/christmas-lofi-preview.mp3            # sleigh, 60 s
NODE_PATH=$(npm root -g) node brand/youtube/lofi/christmas_lofi.js /tmp/x/cocoa.mp3 cocoa 60                               # another variant
ALL=1 WAV=1 NODE_PATH=$(npm root -g) node brand/youtube/lofi/christmas_lofi.js /tmp/x/any.mp3                              # all three (+ mastered wav)
```

Chromium is at `/opt/pw-browsers/chromium`, as for the other lo-fi scripts.

## If approved (not started)

1. **30-minute YouTube loop**, made like the rainy evening one (`LOFI_YOUTUBE.md`, `cozyLoop` in `cozy_lofi.js`):
   - The loop is 32 bars: the tune plain, then with the glock doubling. For that, the doubling switches on odd passes (`pass % 2`) instead of from pass 2 on. At 88 bpm that is 87.27 s.
   - Render three loops and a bit, cut the middle one, and lay the next bar over its start with a 1.5 s crossfade. Then gain to -16 LUFS with a gentle limiter, done on three copies end to end, keeping the middle one.
   - Tile it to 30:00: the audio from the tiled wav, AAC 192k.
   - The picture is a separate 30 s seamless video loop with its audio tiled on its own. Both loops are seamless, so they don't need the same length. If one shared loop is wanted, 90 bpm makes 16 bars exactly 42.667 s = 1280 frames at 30 fps.
2. **Poster and thumbnail**, as the brief asks: **Noodle by the fireplace** in the Cozy House at night.
   - Snow outside the window, a stocking, the fire glowing, real game art only.
   - The same layout as the rainy evening ones (`lofi-rainy-evening-thumb.jpg` / `-poster.jpg`).
   - Note: the Marketing rule "a different dog each time" is for ads. The brief named Noodle for this one, so check with the owner at approval if a second dog should join.
3. **Short clips for Reels:** 15-30 s cut at bar lines from the loop, for example the sleigh shake into the B half (about 20.5 s), or the tune's opening.
   - Each clip gets a designed cover and the standard end card (logo, doodledoggo.app, Instagram, X, YouTube), with the music fading under it.
   - Captions go into a `docs/marketing/` file, not into chat.
4. **Alternatives on request:** the `cocoa` (cozier) or `musicbox` (sleepier) variant, a different tempo, or no fire. Each is one setting in `VARIANTS`.
