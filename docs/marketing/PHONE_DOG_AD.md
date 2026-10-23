# "Real dog + phone" gameplay ad (15–20 s)

Owner's idea (23 Oct 2026), from a cat cafe game ad (https://www.instagram.com/p/Dda7svTgo7S/). That ad mixes three kinds of shot:
- a real cat filmed next to a phone that is playing the game;
- full-screen gameplay clips, each with one short caption;
- an end card where the cat's paw taps the download button.

Ours uses a realistic dog and the real Doodle Doggo gameplay. English only.

## How it is made

- **Realistic dog shots.** A Claude session cannot render a photo-real dog. Blender is not a fit either: there is no ready rigged, furred dog model, and fur rendered on this machine's CPU would take days and still look like a toy. So the dog shots come from an AI video tool: Kling (as for the office video), or a video plugin connected to Claude. Each shot shows the phone with a **plain bright green screen**.
- **The phone screen.** We pin the real gameplay onto that screen, with the screen tracking used for the office video (`brand/instagram/launch/pov/merge_pov.py`, adapted).
- **Gameplay.** The gameplay is recorded from the real game in phone layout by `brand/instagram/launch/phone_ad/capture_gameplay.js`.

## Plan (about 18 s)

| Time | Shot | Caption (burned in, English) |
|---|---|---|
| 0–2.5 s | **Dog shot 1**: a real dog at a table stares at a phone lying in front of it; the game plays on the screen | `which crayon dog looks like yours? 🐶` |
| 2.5–5 s | **Dog shot 2**: a person's hand taps the phone while the dog watches, head tilted | `my dog found my new game` |
| 5–14 s | Full-screen gameplay, 2 s each: adopting at the Shelter Playroom, dressing up, the walk, ball play and treats, the dogs roaming at home | `adopt from 35 crayon dogs` · `dress them up` · `walk the town` · `play ball, give treats` · `they live with you` |
| 14–16 s | **Dog shot 3**: the dog puts a paw on the phone | `even my dog wants to play` |
| 16–18.5 s | End card: logo, `a free cozy dog game`, `play free at doodledoggo.app` | |

## Prompts for the AI video tool (9:16, 5 s each)

Make each one 2–3 times and keep the take where the phone stays most steady and the screen is least covered.

**Shot 1: the dog watching the phone**
```
Vertical 9:16, realistic home video look. A cute small fluffy dog (light tan, like a Pomeranian or a Chihuahua mix) sits at a light wooden table and stares closely at a smartphone lying flat on the table in front of it, the phone screen facing up and slightly toward the camera. The phone screen is a plain flat bright green (#00FF00), evenly lit, no text, no reflections. The dog tilts its head curiously, ears up, small natural movements. Warm soft daylight from a window, cozy living room softly out of focus behind. Camera static, slightly above the table, phone fully visible and not covered. 5 seconds.
```

**Shot 2: a hand plays, the dog watches**
```
Vertical 9:16, realistic home video look. Close shot over a light wooden table: a person's hand holds a smartphone upright in portrait, screen facing the camera, and taps it gently with one finger. The phone screen is a plain flat bright green (#00FF00), no text. Right behind the phone a cute small fluffy tan dog watches the screen with big curious eyes and tilts its head. Warm soft daylight, cozy room out of focus. Camera steady, the phone stays still and fully visible. 5 seconds.
```

**Shot 3: the dog's paw on the phone**
```
Vertical 9:16, realistic home video look. A cute small fluffy tan dog at a light wooden table gently places one front paw on the edge of a smartphone lying flat on the table, then looks up at the camera, happy. The phone screen is a plain flat bright green (#00FF00), no text, mostly visible. Warm soft daylight, cozy living room out of focus. Camera static, slightly above. 5 seconds.
```

Tips:
- Green screen, no text: the tool draws messy fake apps otherwise, and green is easy to replace.
- Keep the same dog and table in all three: describe them the same way, or use the first clip's frame as the reference image for the others.
- Send the clips as they are (MP4). The tool's watermark in a corner is fine, it stays small.
