---
name: paw-music
description: >-
  Make or change Doodle Doggo's music and ambience: the generative lo-fi engine
  in mods/pawaudio.js (window.PawAudio). Use when adding a place's music, a
  seasonal or festival variant (a market, Christmas, Halloween), a new
  instrument, ambience or stinger, when tuning levels, or when the owner wants
  to hear a sample clip before anything ships.
---

# Paw music

All music is synthesized live with WebAudio in `mods/pawaudio.js` (one IIFE, `window.PawAudio`). Rules: `V12.md` (music part)
and `V13.md`; mods never touch localStorage or game state. The game only calls `PawAudio.setContext({ place, area, time, weather })`
from `audioPlace()` in `game/src/00_core.js` (~line 793).

## House style (keep it)

- **Key:** F major / D minor family only: the chords in `CH`, toplines on F pentatonic (`pentaMidi`, nudged off clashes by `fit`).
- **Tempo:** 68-86 bpm, swung 16ths (swing 0.55-0.66). Calm places slower, play places faster.
- **Band:** FM Rhodes keys with tremolo, warm triangle bass, brushed or soft drums, a topline (kalimba, glock, music box, flute,
  bird, bubble), a soft triangle pad, vinyl crackle, tape wobble, a warm lowpass on the whole mix, a small reverb.
- **Texture:** lo-fi, cozy, never busy. Changes glide in on the next bar over ~4-6 s, so a place change is never obvious.
- **Never:** audio files, samples or any external host (all sound is made in code); sharp, harsh, loud or sudden sounds (no
  bright square leads, no hard clicks, nothing above the master limiter); minor-key gloom, tension or "fail" sounds; quotes of
  real songs or carols (original motifs only); a new key or a tempo outside 64-90.
- **Owner's rule:** the owner listens and approves before any new or changed music ships. Render clips (below), send the paths,
  wait for the go-ahead. Festival music also waits for the owner's launch date (CLAUDE.md festival rule).

## How the engine is organised (`mods/pawaudio.js`)

| What | Where |
|---|---|
| Names: `PLACES`, `TIMES`, `WEATHERS`, `AREAS`, `STINGERS`, `STINGS`, `AMBS`, `AMB_CONT` (continuous beds) | lines 12-25 |
| Chords `CH`, 8-bar progressions `PROGS` | 42, 60 |
| `THEME` (the Doodle Doggo tune), `MOTIFS`, `BUBBLES`, `TOP_OCT` (octave per topline) | 85-105 |
| Rhythm patterns `KEYS`, `BASS`, `KICK`, `SNARE`, `HATS` (16 steps) | 108-128 |
| Variants: `DEF`, `V()`, `BASE` (one per music style), `PLACE_BASE` (place -> style), `KEEP_PROG`, `STRONG` | 131-169 |
| `resolve(ctx)`: style + time of day + weather + ambience -> one variant object (`v.sig` decides if it changed) | 183 |
| `Engine(ac, offline)`: buses, layers (`keys pad bass kick snare hats top crackle`), ambience gains | 345 |
| Instruments `EP.rhodes`, `padNote`, `bassNote`, `kick`, `snare`, `hat`, `kalimba`, `glock`, `flute`, ...; `EP.topNote` dispatch | 456-578 |
| Ambience: `EP.ambStart` (continuous beds), event sounds (`murmur`, `gull`, `clink`...), `EP.ambEvents` (rates) | 580-802 |
| Scheduler: `apply`, `barStart`, `planTop`, `scheduleStep`, `tick` | 804-925 |
| Stingers `EP.stinger` (music bus), stings `EP.sting` (sfx bus) | 927, 1003 |
| Offline `render(opts)` + `analyse` (exposed as `PawAudio._render`), public API, `PA.describe(ctx)` | 1503, 1537-1690 |

Line numbers drift; grep the name. `CAP = 80` voice units (`EP.alloc`): every new sound calls `alloc` first.

## Recipe: a new place, or a seasonal / festival variant

1. **Place name:** add it to `PLACES` (an unknown place falls back to `'yard'` in `norm()`: the Festive Market `'fmarket'` does
   that today). Indoor? add to `INDOOR`. Map it in `PLACE_BASE`.
2. **Style:** add a `BASE` entry with `V({ bpm, swing, prog, keys, bass, kick, snare, hats, top, dens, cut, brush, L: {...} })`.
   Reuse patterns first; a new progression goes in `PROGS` (8 bars, chords from `CH`), a new pattern in `HATS`/`KEYS`/...
   Add it to `KEEP_PROG` / `STRONG` if its character should survive dusk, night and snow.
3. **Seasonal variant of an existing place:** keep the place, pick the style in `resolve()` from an extra context key
   (e.g. `ctx.fest === 'winter'`) and pass that key from `audioPlace()` in the game. `_render` hands the raw ctx to `resolve`,
   but the live path drops extra keys: `PA.setContext` copies only place/area/time/weather and `norm()` rebuilds the object,
   so add the key in both (and to the `PA.contexts` log if tests should see it).
4. **Weather and time:** check what the `dawn`/`dusk`/`night` and `rain`/`snow` branches of `resolve()` do to your style
   (snow swaps the topline to glock and thins the hats; guard with `bn !== 'yourstyle'` where that would erase the character).
5. **New instrument:** an `EP.<name>` (sines/triangles, soft attack >= 2 ms, `setTargetAtTime` decays, `onended` disconnect),
   wire it in `EP.topNote` (topline) or `scheduleStep` (rhythm), add its octave to `TOP_OCT`.
6. **New ambience:** add to `AMBS`, the `a` object in `resolve()`, and either `EP.ambStart` (+ `AMB_CONT`) or `EP.ambEvents`.
7. **Levels:** match loudness to the neighbouring places (within ~1 LU, see below), peak under -1 dBFS.
8. **Contract:** note the change in the release's `V*.md`, and a `NEWS` entry when players will hear it.

## Listening clips for the owner

`tools/music_clip.js` renders any engine copy offline in headless Chromium (no game, no audio files), fades the end, writes a
16-bit WAV (+ MP3 with `--mp3` when ffmpeg exists) and prints peak, RMS, loudest/quietest second, LUFS, NaN and clipped counts.
It exits 1 on NaN, page errors or a peak over -1 dBFS.

```
export NODE_PATH=$(npm root -g)
node tools/music_clip.js --out <scratch>/A.wav --seconds 36 --seed 11 --mp3 --ctx '{"place":"market","time":"day","weather":"snow"}'
node tools/music_clip.js --engine <scratch>/pawaudio_new.js --out <scratch>/B.wav --seconds 36 --seed 11 --mp3 \
  --ctx '{"place":"fmarket","time":"day","weather":"snow","fest":"winter"}'
node tools/music_clip.js --out x.wav --segments '[{"at":0,"ctx":{"place":"yard"}},{"at":18,"ctx":{"place":"walk","area":"beach"}}]'
```

Prototype in a scratch copy first (copy `mods/pawaudio.js` to the scratchpad, or a small patch script that string-replaces into a
copy) and render it with `--engine`; touch the shipped file only after the owner says yes. Always render the baseline (today's
music in the same context) with the same `--seed` so the owner can compare A and B. Since you can't hear: check the numbers
(peak < -1 dBFS, LUFS within ~1 of the baseline, quietest second well above silence, NaN 0), and look at a spectrogram
(`ffmpeg -i B.wav -t 8 -lavfi showspectrumpic=s=900x400:legend=0 spec.png`, then read the PNG).

## Checks before it ships

```
NODE_PATH=$(npm root -g) node mods/audio/test_audio.js     # live scheduler, every context, offline renders, no throws
NODE_PATH=$(npm root -g) node mods/audio/check_v2.js       # voices, stings, nursery/vet/salon beds non-silent, 2-voice limit
NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors node game/run_tests.js smoke --jobs 1
```

`test_audio.js` takes several minutes (it ends with every breed's barks) and writes demo WAVs into `mods/audio/` (gitignored);
don't wrap it in a short `timeout`. Plus the clip numbers above, and the owner's go-ahead on the clips.
