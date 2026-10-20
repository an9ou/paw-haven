# "Office POV" video: sneaking a puppy break at work

Owner's idea (20 Oct 2026): a first-person shot in an office cubicle, hands typing, the camera pushes into the corner of the laptop screen, where a small browser window shows the crayon puppy; the cursor clicks a bone, the puppy munches, hearts float up. 9:16.

A Claude session cannot make photo-real video, and an AI video tool cannot draw the real Noodle (it would invent a different puppy). So it is made in two parts and put together in an editor:

1. **The office shot** from an AI video tool (Sora, Veo, Kling, Runway or similar), with a **plain bright screen** on the laptop.
2. **The screen insert**, made here from the game's real art: `brand/instagram/launch/pov/noodle-browser-insert.mp4` (1280 x 800, 16:10, 60 fps, 8 s, no sound). Noodle wags in the game's yard, the cursor glides to the bone button and clicks, the bone flies to him, he munches it with his head up and his v2.13 "yum" face (the game's eat pose is made for a food bowl, so it is not used here), hearts float up, then heart eyes. The address bar shows `an9ou.itch.io/doodle-doggo`, where the game is played (doodledoggo.app is the introduction site and has no feeding; `URL=doodledoggo.app` remakes it with that address). Remake: `NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/pov/build_screen.js <workdir>`.

## 1. Prompt for the AI video tool

```
First-person POV inside a modern office cubicle, 9:16 vertical. Hands typing quickly on a laptop with a mechanical-style keyboard, soft realistic office lighting, a coffee mug and a plant at the edge of frame. After 2 seconds the camera smoothly pushes in toward the bottom-right corner of the laptop screen and holds there, steady, for 6 seconds, with a gentle cinematic focus shift from the keyboard to the screen. The laptop screen shows a plain flat bright white window in the bottom-right corner with a thin grey border (nothing on it, for a screen replacement later). Slight natural handheld motion, no people's faces, no logos, no text on screen. 10 seconds.
```

Tips:
- Ask for a **plain white (or green) window** on the screen and **no text**: AI tools draw messy fake screens otherwise, and a plain area is easy to cover.
- 4K 60 fps is fine if the tool offers it; Reels play at 1080 x 1920.
- Make 3 or 4 tries and pick the one where the screen corner stays most steady while the camera holds.

## 2. Putting it together (CapCut, free, on phone or computer)

1. New project, 9:16. Add the office clip.
2. Add `noodle-browser-insert.mp4` as an **overlay** at about 2 s (when the camera starts to push in).
3. Scale and move the overlay onto the white window. On the computer version use **Tracking** (or **Keyframes** at the start and end of the push-in) so it moves with the screen.
4. Turn the overlay's **opacity to about 95 %** and add a little **blur (1–2)** so it sits on the screen, not on top of it. A soft vignette helps it look filmed.
5. Sound: keyboard clicks come with most AI clips; add a soft "pop" at the click (about 4.4 s in the final video) and quiet game music. The game's own music is free to use (for example the audio from `brand/instagram/launch/costume_reel/doodle-doggo-costume-reel-b.mp4`).
6. Text on screen (optional, top): `me at work pretending to answer emails` · and at the end: `Doodle Doggo · free on itch.io`.

## Caption

```
Me at 3 pm, "answering emails" 💻🐶
A bone for Noodle and back to work. Probably.

Doodle Doggo is a free cozy dog game you play in your browser, on your phone or computer. Link in bio.

仕事中のこっそりワンコタイム🐶

#doodledoggo #cozygames #officelife #workbreak #doggame #indiegame #ブラウザゲーム
```
**Alt text:** `Office POV: a laptop corner shows a crayon dachshund eating a bone as hearts float up.` (86 characters)
