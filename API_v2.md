# Paw Haven prototype: contract v2 (read with API.md; this file overrides it)

## Client direction (latest)
1. **The dogs stay in style H, "Ugly hand-drawn".** The dog module `/home/claude/proto/dogs/pawart_dogs.js` is DONE and does not change.
2. **Everything else is drawn in style G, "Doodle sketch", and more detailed.** That covers dog houses, items, icons, props, speech bubbles, scenes, the map, walk strips, and the whole UI/UX chrome: panels, buttons, meters, cards and bubbles.
   - The contrast is the joke and the brand: a lovingly detailed, cute pencil-sketchbook world, with a crude crayon dog living in it.
3. **Laptop first, built fast.** Target a desktop or laptop browser at 1280×720 and up, landscape. Do NOT spend time on phone layouts, portrait crops or touch tuning. Phone comes later, only when the client asks. Keep scope tight and skip polish that isn't visible at laptop size.

## Style G, "Doodle sketch": the spec
Reference code: `/home/claude/proto/g_style_reference.js` (`G2` palette, `drawG`), and the G cards on `/home/claude/art/paw_haven_style_study.html` (render them with Playwright to see the look).
- **Paper:** warm off-white `#FFFBF3`, a faint dot grid `#E3D2BA`, and a subtle paper grain.
- **Line:**
  - Warm brown pencil `#5B3D32`, slightly wobbly and hand-drawn, heavier on the underside of forms.
  - Each outline is 2 overlapping tapered strokes with small gaps and overshoots.
  - Faint graphite construction lines `#A8968A` here and there.
- **Color:**
  - Colored pencil or watercolor wash in soft pastels, multiplied over the lines and drifting slightly off them, patchy with grain.
  - Light diagonal hatching on shadow sides.
  - Pink accents `#F28FA5`.
- **Charm details:**
  - Washi-tape strips, little sparkles, hearts, music notes, tiny doodled flowers.
  - Handwritten labels in **Caveat** (the game page loads Caveat, Patrick Hand and Gloria Hallelujah).
  - Use `font-family:'Caveat',cursive` for text inside the art.
- **"More detailed" means:**
  - Real texture and small hand-drawn details: wood grain on the doghouse, shingles, stitched seams on clothes, a label on the kibble bag, leaves on trees, cobbles on Market Street, window frames, flower boxes and so on.
  - Still a sketchbook drawing, not a realistic painting.
- **Deterministic:** seeded jitter, so the same call always gives the same drawing.
- **Boil (optional for the world):** no boil on big scenes, for performance. Small props and icons can be static.
- **Performance:** define ONE paper-grain `<filter>` per SVG at most, and prefer none on icons and items. Keep scenes light enough to redraw at 60 fps behind CSS animations: render once, then reuse.

## World art is split across two modules (same API as API.md, now in style G)
| Module | Owner | Covers |
|---|---|---|
| `/home/claude/proto/world/pawart_world_a.js` | Opus artist A | `PawArt.scene(name, o)` and `PawArt.walkStrip(area)` |
| `/home/claude/proto/world/pawart_world_b.js` | Opus artist B | `PawArt.icon`, `PawArt.item`, `PawArt.house`, `PawArt.collectible`, `PawArt.prop` |

- Function names, names lists, viewBoxes, data-attributes and ground lines are exactly as in API.md.
- Laptop-only change: scenes no longer need a phone safe area. Keep the yard overlay zones as specified.
- **Extra icon for B:** `settings` (gear).
- **Extra props for B:**
  - `prop('speech')`: a doodle speech bubble, `viewBox="0 0 200 120"`, `preserveAspectRatio="none"`-friendly, with the tail at the bottom-left.
  - `prop('panel')`: a doodle paper card with washi tape, `viewBox="0 0 300 200"`, stretchable.
  - `prop('tape')`: a single washi strip, `viewBox="0 0 120 30"`.

  The game may use these as backgrounds for UI chrome.
- Each module is a plain IIFE that adds to `window.PawArt`. Inject CSS once under id `pawart-world-a-css` or `pawart-world-b-css`. Internal classes are prefixed `pa-wa-` or `pa-wb-`, and SVG ids must be unique per call.
- **Working folders:**
  - Artist A works in `/home/claude/proto/world/a/`, and its module lives at `/home/claude/proto/world/pawart_world_a.js`.
  - Artist B works in `/home/claude/proto/world/b/`, and its module lives at `/home/claude/proto/world/pawart_world_b.js`.
  - Each delivers its own `gallery.html` in its folder.
- An older crude H-style world module sits in `/home/claude/proto/world/old_h_version/`. Use it only as a reference for which assets exist; the client rejected its style.

## Merge
The coordinator replaces `/*@@PAWART@@*/` in the game with `pawart_dogs.js` + `pawart_world_a.js` + `pawart_world_b.js`, in that order.
