# Paw Haven prototype: build contract

Three agents build in parallel, and the coordinator merges their work into ONE self-contained HTML file published as a claude.ai Artifact.

| Part | Owner | Output file |
|---|---|---|
| Game (logic, screens, UX, sound) | Opus game agent | `/home/claude/proto/game/paw_haven_proto.html` |
| Dog art module | Opus H artist | `/home/claude/proto/dogs/pawart_dogs.js` |
| World art module | Sonnet artist | `/home/claude/proto/world/pawart_world.js` |

Each agent works ONLY in its own folder: `/home/claude/proto/<game|dogs|world>/`. Put scratch files, test harnesses and screenshots there too, never in a shared scratchpad or /tmp. The other agents' folders are read-only for you.

Art style for EVERYTHING: style **H, "Ugly hand-drawn"**. It looks like it was drawn in 30 seconds with a mouse in a basic paint program, or by a 6-year-old with crayons.
- Thick, uneven, jaggy outlines (warm near-black `#2a2420`) that often don't quite close.
- Flat bucket-fill colors that miss the outline and leave gaps.
- Lopsided shapes, garish but friendly colors, and deliberate comedy.
- Faces stay readable: clean white eye circles of different sizes with big pupils.
- Reference implementation of the H dogs: `/home/claude/proto/h_style_reference.js` (plus `.css`), taken from the style study `/home/claude/art/paw_haven_style_study.html` (search for `drawH`). It uses some shared helpers defined earlier in that page (`rng`, `uid`, `R1`, `mix` and others). Copy whatever helpers you need into your module so it is fully self-contained.
- Jitter is DETERMINISTIC (seeded), so the same call always gives the same drawing.
- The idle "boil" is 3 redraws flipped at 3 fps with `steps()`. It pauses when `html[data-motion="off"]` is set, under `prefers-reduced-motion: reduce`, or when an ancestor has the class `pa-still`.

Fonts (the game page loads these from Google Fonts): **Gloria Hallelujah** for scrawled labels and headings, and **Patrick Hand** for readable UI and body text. Art that contains text should use `font-family:'Gloria Hallelujah',cursive`.

## Module rules (both art modules)
- A plain script with no imports or exports. Start with `window.PawArt = window.PawArt || {};` and add your functions to it. Wrap everything in an IIFE so helpers don't leak, and prefix any global CSS classes with `pa-`. Dogs use `pa-d-…` and world uses `pa-w-…` for internal classes, so the two never collide.
- On load, inject your CSS once with `document.head.appendChild(style)`, guarded by an id (`pawart-dogs-css` / `pawart-world-css`).
- Every function returns an SVG **string**. SVG ids must be unique per call, so use your own counter.
- No external resources. No `alert`, `confirm` or `prompt`. No third-party franchise or brand names anywhere in the output.
- Originality: every dog is an ordinary real breed and our own character. No franchise look-alikes.
- Also deliver `gallery.html` in your folder. It loads your module with a `<script src>` and shows every asset with its call signature, so you (and the coordinator) can screenshot and check everything.
- Verify: run `node --check` on the module, then take Playwright screenshots of the gallery (Chromium `executablePath: '/opt/pw-browsers/chromium'`). Look at them with Read and do up to 3 rounds of fixes.

## Dog API: `pawart_dogs.js` (Opus H artist)
`PawArt.dog(key, o = {})` → SVG string
- `key`: `'shiba'` (Mochi) | `'corgi'` (Biscuit) | `'golden'` (Sunny) | `'dachs'` (Noodle) | `'husky'` (Frost) | `'mutt'` (Pepper)
- `o.pose`: `'idle'` (default) | `'happy'` (tongue out, little hearts) | `'pet'` (being petted: eyes squeezed shut in bliss, blush) | `'eat'` (head down, muzzle at ground level near x≈170 so a bowl can sit there) | `'sleep'` (lying down, eyes shut, "z z") | `'walk'` (the boil frames alternate legs so it reads as walking) | `'jump'` (airborne, legs tucked or splayed, for fetch) | `'sit'` | `'sad'` (droopy, low stats) | `'dirty'` (idle plus brown mud splotches and stink lines)
- `o.outfit`: `{head, eyes, neck, body}`. Each is null or an exact clothing name, drawn ON the dog in H style and fitted per breed:
  - head: `'Party Hat'`, `'Flower Crown'`
  - eyes: `'Heart Sunglasses'`
  - neck: `'Red Bandana'`, `'Bow Tie'`
  - body: `'Yellow Raincoat'`, `'Knit Winter Sweater'`, `'Superhero Cape'`
- `o.anim`: boolean, default `true` (boil animation on).
- `o.facing`: `'right'` (default) | `'left'` (a mirror is fine).
- **Fixed canvas for every key and pose:** `viewBox="0 0 240 200"`, with the dog's feet (or belly when lying) on the ground line y=186, and horizontally centered around x=120 (the dachshund may span nearly the full width). Include a small soft shadow. NO background, sun, grass, name or captions (no "heh.", "AWOOO" or similar: the game shows jokes as speech bubbles). Root element: `<svg class="pa-dog pa-pose-<pose>" viewBox="0 0 240 200" role="img" aria-label="…">`.
- The happy and pet poses can add small hearts above the head, inside the canvas.

`PawArt.dogHead(key)` → SVG string with `viewBox="0 0 100 100"`: a head-only portrait for the HUD and save slot, no animation.

`PawArt.DOGS`: an array `[{key, name, breed, personality, joke}]` for the six dogs, in this order: shiba, corgi, golden, dachs, husky, mutt.
- name: Mochi, Biscuit, Sunny, Noodle, Frost, Pepper.
- personality: from the bible (Proud, independent, dramatic | Cheerful, greedy for food | Friendly, loves fetch | Curious, loves digging | Energetic, chatty (howls) | Loyal, gentle).
- joke: one short comedic line per dog that the game can show in a speech bubble at adoption (for example Mochi: "heh.").

## World API: `pawart_world.js` (Sonnet artist)
- **Icons.** `PawArt.icon(name)` → SVG, `viewBox="0 0 64 64"`. Names:
  - Stats: `hunger`, `happy`, `energy`, `clean`, `bond`, `coin`
  - Actions: `feed`, `play`, `walk`, `shop`, `wardrobe`, `house`, `map`, `home`, `back`, `close`, `bath`, `sleep`, `pet`
  - Toggles and markers: `sound-on`, `sound-off`, `lock`, `star`, `heart`, `check`, `speed`
- **Items.** `PawArt.item(name)` → SVG, `viewBox="0 0 64 64"`, for these exact names:
  - Food: `Basic Kibble`, `Chicken & Rice Bowl`, `Salmon Pâté`, `Bone-shaped Biscuit`, `Pupcake`, `Fresh Water`
  - Toys: `Tennis Ball`, `Rope Tug`, `Squeaky Duck`, `Frisbee`, `Plush Bone`, `Puzzle Feeder`
  - Clothes, as flat shop icons: `Red Bandana`, `Yellow Raincoat`, `Knit Winter Sweater`, `Party Hat`, `Heart Sunglasses`, `Superhero Cape`, `Flower Crown`, `Bow Tie`
- **Houses.** `PawArt.house(name)` → SVG, `viewBox="0 0 240 200"`, ground at y=190, door opening centered near x=120. Names: `Cardboard Box`, `Classic Wooden Doghouse`, `Cozy Cottage`, `Snow Igloo`, `Treehouse Den`, `Royal Castle Kennel`. Make each funny in H style: the castle is clearly cardboard-and-crayon royal.
- **Scenes.** `PawArt.scene(name)` → SVG, `viewBox="0 0 1000 600"` with `preserveAspectRatio="xMidYMid slice"`. Keep important content inside the central safe area x 150–850, because phones crop the sides.
  - `yard`: the hub. Sky, scribbled sun, fence, grass, your little human house at the back left. Leave a clear empty patch for the dog house around x 620–860, y 330–520, and for the dog around x 300–560, ground y≈500, because the game overlays these. Bowl spot at about x 250, y 520.
  - `market`: Market Street with 3 crude shopfronts with scrawled signs: "Kibble Corner", "Bow-Wow Boutique", "Barkitecture". Each shopfront is a group with `data-shop="kibble" | "boutique" | "builder"` so the game can make them clickable.
  - `shelter`: the Paw Haven Shelter interior or exterior, used behind the adoption screen.
  - `map`: the illustrated town map with 7 areas. Each area is a group with `data-area="yard" | "market" | "shelter" | "park" | "river" | "woods" | "beach"`, with scrawled labels and paths between them.
  - The map must also show a lock badge on locked areas. Accept an option: `PawArt.scene('map', {locked: ['woods', 'beach']})` draws crude padlocks plus "Bond 5"/"Bond 8" text on those areas.
- **Walk strips.** `PawArt.walkStrip(area)` → SVG, `viewBox="0 0 1200 400"`, tileable SEAMLESSLY left to right (the left and right edges must match), with the walking ground line at y=330. Areas: `park`, `river`, `woods`, `beach`. Each needs a clear identity: park has trees and benches, river has water and a bridge, woods has dark trees and mushrooms, beach has sand, waves and a beach ball.
- **Collectibles.** `PawArt.collectible(name)` → SVG, `viewBox="0 0 60 60"`. Names: `coin`, `shell`, `leaf`, `bone`, `flower`, `acorn`, `sniff` (a smelly puff for a sniff spot), `puddle`, `dig` (a dirt mound with an X).
- **Props.** `PawArt.prop(name)` → SVG, `viewBox="0 0 120 120"`. Names:
  - `bowl-empty`, `bowl-full`, `water-bowl`
  - `tub` (bath tub with bubbles), `bubbles`, `zzz`, `hearts`, `poop-joke` (optional, tasteful: a scribbled stink cloud instead), `ball`, `frisbee`
  - `speech` (an empty crude speech-bubble shape, `viewBox="0 0 200 120"`, which the game stretches)
- **Fresh items.** `PawArt.item` must also cover the food bowls shown in the shop.

## Game (Opus game agent)
- **File:** `/home/claude/proto/game/paw_haven_proto.html`, an Artifact page. That means:
  - No `<!doctype>`, `<html>`, `<head>` or `<body>` tags; the page starts with `<title>`, the font `<link>` and `<style>`.
  - Everything inline, light and dark tokens, works at 400px phone width, and no `alert`/`confirm`/`prompt`.
- **Merge placeholder.** Put exactly this line BEFORE the game script: `<script id="pawart">/*@@PAWART@@*/</script>`. The coordinator replaces `/*@@PAWART@@*/` with the two art modules. While developing, test with your own stub at `game/pawart_stub.js` that implements the full API above with simple placeholder shapes. Inject it via a test harness, never into the deliverable.
- **Use only the API above for art.** You may draw your own UI chrome: buttons, panels, meters, speech bubbles, all in the same crude hand-drawn spirit.
