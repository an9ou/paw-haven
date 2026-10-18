# The overview trailer (about 90 seconds, English)

Made 17 Oct 2026 from `VIDEO_SCRIPT_TRAILER_90S.md`. Files are in `brand/instagram/launch/trailer90/`.

| File | Shape | Use it for |
|---|---|---|
| `doodle-doggo-trailer-9x16-soon.mp4` | vertical 1080 x 1920 | Instagram Reels, TikTok, YouTube Shorts (pre-launch) |
| `doodle-doggo-trailer-16x9-soon.mp4` | landscape 1920 x 1080 | YouTube, the doodledoggo.app site (pre-launch) |
| `doodle-doggo-trailer-9x16-play.mp4`, `...-16x9-play.mp4` | same | **now (the game is live)**: ends on "Play free / on itch.io / an9ou.itch.io/doodle-doggo" |

About 89 seconds, 30 fps, H.264 + AAC. The 45-second promo stays the short ad; this is the "what is this game" video.

**35 dogs since v2.12 (18 Oct 2026):** the videos were made with v2.9, so the voice-over ("Fourteen dogs in all") and the chip ("14 dogs to meet") still say 14, and the shelter run shows the first 14 dogs. Not re-rendered yet (ask if you want it: new shelter footage, a new line and chip). The captions below say 35, which is true of the game today.

## What is in it

1. **Welcome (0:00 to 0:08):** the game's real yard art drawn in pencil, then colour; Noodle scribbled in with crayon; the logo.
2. **Meet the dogs (0:08 to 0:30):** real gameplay in the shelter. Noodle, Biscuit, Mochi and Frost each get a name card and say their own in-game line; then all 14 in a quick run (made with v2.9; the game has 35 dogs since v2.12, see the note below); then Pepper: "Adopt for free".
3. **Your day together (0:30 to 0:58):** care (food, belly rub, bath, nap), dress-up (the Witch Hat, the Very Ugly Sweater), **pack fetch with Biscuit and Sunny**, a walk, the Mt. Fuji Lookout, the garden and kitchen, the house with the pack, puppies, the seasons (the Ugly Sweater Contest, snow, New Year), and photo mode (the crayon postcard).
4. **How to play (0:58 to 1:19):** numbered steps on real screens: 1 Tap New game, 2 Pick a pup (and name them), 3 the bottom bar (highlighted), rub to pet, walk controls, and the log: "Nothing bad ever happens" with Noodle's "I meant to do that."
5. **End (1:19 to 1:29):** the pack at dusk, then the end card: "Coming soon / follow to be first" (or "Play free / on itch.io").

Every gameplay shot was recorded from the real game (v2.9), with the same honest notes as the 45-second video: the bump line "I meant to do that." is one of the game's seven random bump lines, picked for the voice-over. Voice: **Bella** (Kokoro TTS, Apache-2.0, a synthetic voice; label it as AI voice-over if an ad form asks). Music: the game's own. Subtitles are burned in.

## Captions

**YouTube title:** `Doodle Doggo – Overview Trailer | A cozy crayon dog game for your browser`

**YouTube description (coming soon)**
```
Welcome to Doodle Doggo: a little town drawn in pencil, where every dog drew themselves.

Adopt one of 35 wobbly crayon dogs, care for them, play fetch with the whole pack, take walks, visit the Mt. Fuji Lookout, grow a garden, cook dog-safe treats, plan puppy playdates with real coat genetics, and snap postcards of your best friends. Nothing bad ever happens here.

Free, in your browser, on phone and computer. Coming soon. Subscribe and follow us to be the first to play!

0:00 Welcome
0:08 Meet the dogs
0:30 Your day together
0:58 How to play
1:19 Coming soon
```

**Instagram / TikTok (coming soon)**
```
Meet the 35 wobbliest best friends you'll ever adopt 🖍️🐶
Care for them, play fetch with the whole pack, walk to the Mt. Fuji Lookout, grow a garden, plan puppy playdates and snap crayon postcards. Nothing bad ever happens here.

Doodle Doggo: free, in your browser, coming soon. Follow to be first! 👇

#cozygames #indiegame #browsergame #comingsoon #doodledoggo #cozygaming #doggame
```

## Remake

```
NODE_PATH=/opt/node-tools/node_modules
node brand/instagram/launch/video45/footage45.js <f45> autumn ; node ... <f45> winter    # shared gameplay clips
node brand/instagram/launch/trailer90/footage90.js <f90> autumn ; node ... <f90> newyear # the trailer's own clips
python brand/instagram/launch/trailer90/vo90.py <kokoroModelDir> <voDir>                 # Bella
node brand/instagram/launch/trailer90/build90.js <f45> <f90> <voDir> <work> both both   # 4 videos
```
The shot list (which clip under which line, the chips and name cards) is `PLAN` at the top of `build90.js`; the layouts are in `trailer90.html`.

## Captions after launch (17 Oct 2026, the game is on itch.io)

**YouTube title:** `Doodle Doggo – Overview Trailer | Free cozy crayon dog game (play on itch.io)`

**YouTube description**
```
Welcome to Doodle Doggo: a little town drawn in pencil, where every dog drew themselves.

Adopt one of 35 wobbly crayon dogs, care for them, play fetch with the whole pack, take walks, visit the Mt. Fuji Lookout, grow a garden, cook dog-safe treats, plan puppy playdates with real coat genetics, and snap postcards of your best friends. Nothing bad ever happens here.

▶ Play free on itch.io (phone or computer, no download): https://an9ou.itch.io/doodle-doggo
📷 Instagram: @doodledoggo.app

0:00 Welcome
0:08 Meet the dogs
0:30 Your day together
0:58 How to play
1:19 Play free
```
