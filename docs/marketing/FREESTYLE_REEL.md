# "Bluetooth died. The freestyle did not." Reel (draft, 29 Oct 2026)

From the owner's brief (`PROMPT-PACK-CLAUDE.md`, a remake of an Instagram Reel's structure). **Draft only: not posted.** Files in `brand/instagram/launch/freestyle_reel/`.

| File | What |
|---|---|
| `doodle-doggo-freestyle.mp4` | 1080 x 1920, 30 fps, 13.0 s, full-bleed pure white. The last frame matches the first (loop-safe). No text in the video. |
| `doodle-doggo-freestyle-no-music.mp4` | The same video with no sound, for adding a sound inside Instagram (see below). |
| `freestyle-cover.jpg` | The designed cover: the same scene, "bluetooth died. / the freestyle did not." at the top and the logo, inside the grid's 3:4. |
| `build_freestyle.js` | Remake: `NODE_PATH=$(npm root -g) node brand/instagram/launch/freestyle_reel/build_freestyle.js <workdir>` (about 1 minute; `ONLY=stills` for key frames and the cover). |

**What is in it:** Butter (the game's Labrador) on the left, standing up in his real "dance" pose with his eyes closed and a paw up by his head; Noodle on the right, standing up in his real "beg" pose with his paws at his chest, looking at Butter; a crayon brick phone with a small green screen lying on the floor bottom-left, never moving. 0–3 s: a still hold. 3–8 s: one slow breath on Butter only. 8–13 s: Noodle leans his head in toward Butter, holds, and settles back to the first frame. Sound: the game's own calm music, very low, and one tiny plastic clack at 0.0 s.

**Where it differs from the brief, and why:**
- The dogs keep the game's own colours (Noodle is the game's red-brown, not chocolate), so the post shows the dogs players get. Noodle's tan brow spots, tan socks and chest come from his real art.
- Each dog is about a third of the frame tall, not 55–60%: two upright dogs side by side at that height would not fit the 1080 px width. The open space above is for the hook overlay.
- Noodle's "head tilt" is a small lean of his whole upper body (the game art has no separate head to turn).
- The hearts, dance marks and ground shadows the poses normally carry are switched off (in the build script only).
- Noodle's far back foot stands under his haunch, joined by a short leg (owner, 29 Oct: "fix Noodle's leg"). In the game's beg, sit and paw poses that foot is drawn flat on the floor at a fixed spot, so on a long dog it floats away from the body; fixed here in the build script only.

## Overlays (add in the edit, not baked in)

**Hook (pick 1):** `bluetooth died. the freestyle did not.` · `phone's on the floor. the vibe is not.` · `he dropped the brick. she kept the beat.`

## Captions (Noodle's voice, from the brief)

**Instagram**
```
bluetooth died. the freestyle did not. 📱✨
butter's in his stretch era. noodle is taking notes. the brick phone has left the chat.
⋆⁺₊ ⚘
quiet haven nonsense → doodledoggo.app
```
**Shorts:** `phone on the floor. vibe still standing. 🐕📱 doodledoggo.app`
**X:** `dropped the brick. kept the freestyle. ⋆⁺₊ doodledoggo.app`

**Alt text:** `Two crayon dogs stand on their hind legs on a white background: a golden Labrador with his eyes closed and a paw by his head, and a dachshund with his paws at his chest looking at him. A small brick phone lies on the floor.`

## Matched to the reference Reel (owner, 29 Oct 2026: "follow this reel")

Only the reference's preview frame could be read (Instagram blocks downloading the video), so the layout follows that frame: the pair stands in the middle of the screen (feet about 64% down), close and face to face with a small gap, each about a quarter of the frame tall, and the brick phone lies just below-left of Butter, tilted down to the right. The timing stays the brief's near-still one.

**Sound:** the reference uses a licensed song ("crazy b!tch" by Yanka and King Doudou). We can't put it in the file, but Instagram can: post `doodle-doggo-freestyle-no-music.mp4`, then add that song from Instagram's own music library (or tap "Use audio" on the reference Reel). Otherwise post the main file with the game's own music.

## The dancing version (owner, 29 Oct 2026)

"Use our game background, random places, the dogs dancing: the body shaking left to right, the heads, hands and tails moving."

| File | What |
|---|---|
| `doodle-doggo-freestyle-dance.mp4` | 1080 x 1920, 30 fps, 13 s, with the game's upbeat "play" music (86 bpm). |
| `doodle-doggo-freestyle-dance-no-music.mp4` | The same with no sound, for adding a song inside Instagram. |
| `dance-cover.jpg` | The designed cover: the first place, the pair mid-dance, "bluetooth died. / the freestyle did not." on a cream sticker, the logo. |
| `build_dance.js` | Remake: `NODE_PATH=$(npm root -g) node brand/instagram/launch/freestyle_reel/build_dance.js <workdir>` (about 3 minutes; `SEED=n` picks other places; `ONLY=stills`). |

**What is in it:** five game places picked at random, a hard cut every 4 beats (this render: Asakusa, Tokyo Tower, the Town Square, Yoyogi Park, the Park). Butter and Noodle both in their real "dance" pose, flipping through the game's own three dance frames on the beat (head, paws and tail move), swaying left and right and bouncing on every beat; the brick phone on the ground bottom-left. The game's dance marks, ground shadows and the scenes' dashed tap outlines are switched off in the build script only.
