# The 45-second promo video (English)

Made 17 Oct 2026 from the script in `VIDEO_SCRIPT_45S.md`. Files are in `brand/instagram/launch/video45/`.

| File | Use it for |
|---|---|
| `doodle-doggo-promo-45s-soon.mp4` | **Now.** Ends: "Doodle Doggo. Coming soon. Follow, so you don't miss me." |
| `doodle-doggo-promo-45s-play.mp4` | **When the game is live.** Ends: "Doodle Doggo. Free to play in your browser. Link in bio." |
| `promo-45s-cover.jpg` | Cover picture (1080 x 1440, the part the profile grid shows). |
| `doodle-doggo-promo-45s-soon-male-voice.mp4`, `...-play-male-voice.mp4` | The first version, with a calm male voice. |
| `voice-samples/noodle-voice-*.mp3` | Other voices for Noodle (four female, four male), if you want to change the narrator. |

Both videos: 1080 x 1920 (9:16), 30 fps, 45 seconds, H.264 + AAC, about 20 MB. Good for Instagram Reels, TikTok, YouTube Shorts, and Meta ads (Reels and Stories placements).

## What is in it

| Time | Picture | Noodle says |
|---|---|---|
| 0:00 to 0:05 | The game's real yard art drawn in on a sketchbook page (a pencil pass, then colour), then Noodle scribbled in with crayon | "Everything in this town was drawn very carefully. Except me. I drew myself." |
| 0:05 to 0:08 | The Doodle Doggo logo, Noodle bounces in | "Hi, I'm Noodle. Welcome to Doodle Doggo." |
| 0:08 to 0:13 | **Gameplay:** the shelter. Tapping through the dogs, each says its own line ("is that... a snack?", "BALL? BALL! BALL!!", "snort.", "still loading... (I am long)") | "Adopt a wobbly crayon pup. There are fourteen of us. We are all very proud." |
| 0:13 to 0:16 | **Gameplay:** feeding, a belly rub with hearts, the bath, a nap | "Feed us. Pet us. Bathe us, if you must." |
| 0:16 to 0:20 | **Gameplay:** a walk, zoomed in on the run | "Take us on walks. Dig up treasure. Visit Mount Fuji." |
| 0:20 to 0:24 | **Gameplay:** Fuji View Hill at dusk. Noodle's real line pops up on screen | "Somebody should dig a tunnel through that mountain. I volunteer." |
| 0:24 to 0:29 | **Gameplay:** the veggie patch, the kitchen, a yard with puppies | "Grow a garden. Cook dog-safe treats. Have puppy playdates, with real coat genetics." |
| 0:29 to 0:34 | **Gameplay:** the witch hat in the Square, Noodle in the Very Ugly Sweater in the snow (with the snowman), the Ugly Sweater Contest sheet | "Dress up for every season. The ugly sweater contest is judged by a duck." |
| 0:34 to 0:40 | **Gameplay:** a walk where Noodle runs into a log. His bubble: "I meant to do that." | "And nothing bad ever happens here. Worst case, you walk into a log. I meant to do that." |
| 0:40 to 0:45 | End card: Noodle in heart sunglasses | coming soon / play free line |

**Subtitles** are burned in (English), so it works with the sound off, which is how most people scroll.

## How it was made, honestly

- **Gameplay is real.** It was recorded from the actual game (iPhone 15 screen size, full resolution), with the game clock stepped one frame at a time so it is smooth. Nothing in the phone was drawn by hand.
- **One small staging:** when a dog bumps into something on a walk, the game picks one of seven real lines at random. For this video we used "I meant to do that." (one of those seven) so it matches the voice-over.
- **The opening drawing** uses the game's own yard art and Noodle's own crayon art, animated for the video.
- **Music** is the game's own soundtrack, made by the game's music engine. It is original, so there are no licence problems on any platform. It gets quieter while Noodle talks.
- **Voice:** a computer voice made with **Kokoro** (an open text-to-speech model, Apache-2.0 licence, so commercial use and ads are allowed). Main version: the female voice **"af_bella"**, the most expressive one, at 1.1x speed, with exclamation marks in the script for a warm, passionate read (owner's choice, 17 Oct). Noodle is still the character speaking; a woman voicing a boy dog is normal in cartoons. The engine has no emotion setting, so the energy comes from the voice, the pace and the punctuation. The first version used the male voice "am_michael". I could not listen to it myself, so **please listen once before you publish.** If a word sounds wrong, or you prefer another voice, tell me: changing it takes a few minutes. Four alternatives are in `voice-samples/`.
- **Platform labels:** some platforms ask you to label AI-generated or synthetic media in ads. The voice is synthetic, the pictures are real gameplay. If an ad form asks, say the voice-over is AI-generated.

## Caption to post with it (English)

**Now (coming soon)**
```
Meet Noodle. He drew himself. 🖍️🐶
Doodle Doggo is a cozy dog game coming soon to your browser: adopt a wobbly crayon pup, take walks, grow a garden, cook dog-safe treats and have puppy playdates, in a pencil-sketch town with Mt. Fuji on every skyline.

Free, for phone and computer. Follow to be the first to play! 👇
Which dog would you adopt first?

#cozygames #indiegame #browsergame #comingsoon #doodledoggo #cozygaming #doggame
```
**When live**
```
Meet Noodle. He drew himself. 🖍️🐶
Doodle Doggo is a free cozy dog game you play in your browser: adopt a wobbly crayon pup, take walks, grow a garden, cook dog-safe treats and have puppy playdates. Phone or computer, nothing to download.

Tap the link in our bio to play! 👇

#cozygames #indiegame #browsergame #freegame #doodledoggo #cozygaming #doggame
```

## For foreign audiences and ads

- **Where:** English-speaking countries first (US, UK, Canada, Australia). The cozy-game audience is big there.
- **Ads:** as in `REEL_AND_ADS.md`. Wait until the game is live, use the **play** version, the Traffic goal, and the ad's own button (no "link in bio" needed). Start small and compare this 45-second video with the 30-second Reel: shorter videos often get more people to the end.
- **A 15-second cut** for ads (hook, Fuji joke, end card) is easy to make from the same files. Ask if you want it.
- **YouTube / itch.io:** a 16:9 version can be made from the same pieces.

## Remake it

All steps are scripts in `brand/instagram/launch/video45/`:
```
NODE_PATH=/opt/node-tools/node_modules
node footage45.js <footage> autumn          # real gameplay (and: node footage45.js <footage> winter)
python vo45.py af_bella 1.1 <modelDir> <voDir>     # (the male version: am_michael 1.08)   # the voice (Kokoro; see the top of vo45.py)
node ../reel_audio.js <music.wav> music45.json       # the game's music
node build45.js <footage> <voDir> <music.wav> <work> both   # frames, mix, MP4
```
The layout and animation are in `video45.html`; the timing of every line and shot is at the top of `build45.js`.
