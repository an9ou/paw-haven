# Gemini prompt: 3D Noodle dancing, 5 seconds (owner, 25 Oct 2026)

The owner asked for a prompt to render Noodle in 3D with Gemini (video). This is the owner's own exception to the "3D means depth around the real crayon dog, never a redrawn 3D dog" rule. Upload a reference picture with the prompt so Gemini keeps Noodle's real design: `brand/instagram/launch/gemini/noodle-reference-happy.png` (also `-dance.png` and `-sit.png`), drawn from the game's own art (fills inside the lines).

```
Create a 5-second vertical video (9:16) of the cartoon dog in the reference image, rebuilt as a cute 3D character, dancing.

Character (keep this design exactly, just in 3D): "Noodle", a deliberately crude, hand-drawn crayon dachshund. A very long, flat, sausage-shaped reddish-brown body; four short stubby legs with tan lower halves; a thin curved tail; a blocky head with a tan muzzle, one darker brown floppy ear, big round cartoon eyes with white highlights, and a little pink tongue always sticking out. Simple, chunky shapes like a soft matte clay or vinyl toy, with a thick dark-brown outline feel at the edges and a faint crayon texture on the surfaces. Colours stay inside their shapes. Not a realistic dog, no realistic fur.

Action: Noodle does a happy, slightly clumsy dance to an upbeat beat: bouncing side to side, wiggling the long body like a wave from nose to tail, tail wagging fast, a little hop, then a proud pose facing the camera with the tongue out. The long body should bend and wobble in a funny way.

Setting: a cozy cream sketchbook-paper background with faint pencil dots, a soft round shadow under Noodle, warm soft lighting. Camera locked, framed full body in the centre, with a gentle slow push-in. Smooth, cheerful, cozy-game look.

Sound: a short playful ukulele-and-xylophone beat, light and happy, no vocals.

No text, no logos, no watermark, no other characters.
```

**If the result drifts from Noodle's look:** add "match the reference image's proportions and colours exactly" at the start, or try the `-dance.png` reference. **For a loop:** add "make the last frame match the first so it loops".

## Free test made here instead (25 Oct 2026)

TRELLIS on Hugging Face refused the anonymous request (its free GPU allowance needs a free Hugging Face token), so Noodle was built from simple shapes in **Blender 4.5** on the session's own computer (no graphics card; Cycles on the CPU) from his game design: the long sausage body on a five-bone spine, the light chest and socks, the floppy dark ear, big eyes, the tongue out, game colours, dark ink outlines, every colour inside its line. 5 s, 1080 x 1920 (rendered at 720 x 1280 and scaled up), with the game's own "play" music: `brand/instagram/launch/noodle3d/noodle-3d-dance.mp4`. Remake: install Blender (download.blender.org, about a minute), then `blender -b -P brand/instagram/launch/noodle3d/noodle3d.py -- <dir> anim 67` (about 25 minutes; `still` renders 4 test frames) and `NODE_PATH=$(npm root -g) node brand/instagram/launch/noodle3d/encode.js <dir> <out.mp4>`.
