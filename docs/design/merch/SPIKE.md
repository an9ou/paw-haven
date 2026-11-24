# "My dog" merch: technical spike (24 Nov 2026)

Branch `claude/merch-print` (worktree `/home/user/paw-haven-merch`), commit `bcdc32ba`. Nothing pushed or deployed and nothing changed in the game. Every number below was measured on this cloud container (4 vCPU, busy with other browser jobs), unless a source is cited.

## Short answer

- **Recipe:** 9 short fields plus an optional name. A one-dog link is **26 to 35 base64url characters** (28 typical). A pack of 5 dogs with names and outfits is **136 characters**. Recipe to SVG matches the game's own drawing **byte for byte in 483 of 483 renders**.
- **Renderer:** `PawPrint` is one script that runs in the browser and in Node, with no game state. It is 603 KB minified, **207 KB gzip** or 154 KB brotli.
- **Server-side render in the Worker:** **not on the Workers Free plan.** Free allows 10 ms CPU per request and a mug wrap needs about 0.4 to 0.6 s. **Yes on Workers Paid**, which allows 30 s by default and 128 MB of memory:
  - With resvg-wasm, sizes up to 3000x3000 render in one pass, using 24 to 73 MB of wasm memory.
  - The 4500x5400 tee renders in 12 bands streamed into one PNG: 17 to 25 MB of wasm memory, about 1.7 to 1.9 s CPU, and output identical to the one-pass render.
  - I could not check which plan the account has. The repo's own docs (`docs/CLOUDFLARE_LOGIN.md`, `tools/site_art.js`) assume the free plan.
- **Fidelity:**
  - resvg against Chromium: mean difference 0.07 to 0.12 per channel; 0.02 to 0.04% of pixels differ by more than 32.
  - The transparent edges are clean: compositing the transparent print over white gives exactly the same image as drawing it on white.

## 1. The recipe (`merchRecipe`)

```json
{ "v": 1, "b": 0, "g": "220200", "e": 0, "p": 2840919217, "a": 0, "s": "f", "sp": 1, "h": 11, "o": [1, 0, 85], "n": "Mochi" }
```

| field | meaning |
|---|---|
| `b` | breed, as an index into `PawGenes.BREEDS` (40) |
| `g` | genes: one digit per locus B D E S M Bl giving the count of dominant alleles, plus `a<n>` / `i<n>` only when the dog carries the tan-point or red-intensity locus. Their presence changes the coat, so "absent" is its own state. |
| `e` | eyes, as an index into `DC_EYES` |
| `p` | art seed: `artSeed`, or `hashId(id)` when the dog has none |
| `a` | adult / puppy / newborn (`dogLook`: under 1 dog month is a newborn, under 6 is a puppy) |
| `s` | sex |
| `sp` | sparkle |
| `h` | mix head breed |
| `o` | worn items, as indexes into `WEAR` (one per slot, six slots) |
| `n` | optional name, at most 20 characters |

**What the Dog Card recipe (`dcDogOf`) lacks, and this recipe adds:**
- All six wear slots. A card keeps one outfit.
- The Crayon Medal charm, plus the 27 wearables that `DC_OUTFITS` never had.
  - `WEAR` = `DC_OUTFITS` (59 items, same order, so a card's outfit index is a WEAR index) followed by the rest of the art's `OUT` table: 86 items, append only.
  - A test checks that WEAR covers the art's table exactly.
- The mix head.
- The newborn stage. A card has only pup or adult.
- The eyes, always. A card sends them only when the id roll decides them.
- The art seed, always.

**Deliberately left out:**
- Wet fur, the pool life vest, the nap pyjamas and an expecting belly. These are moments, not the dog.
- The pose. It is a print option.
- The dog's id. It only decides the eyes and the seed, and both are in the recipe.

**How the round trip was proven** (`merch/test_merch_game.js`, run on the real merged game build):
- The test made 161 dogs: all 40 breeds, each with 4 coats (the starter coat, two seeded random genotypes, and one with Bl/bl or merle).
  - Ages: 81 adults, 40 three-month puppies, 40 newborns.
  - 106 dressed (two pieces, or all six slots), 40 mixes, 60 sparkly, some with their own art seed.
- Each dog was drawn in 3 poses: happy (the share picture), sit, and stand.
- The comparison: the game's own share picture (`__paw.sh.svg` → `shSVG` → `dogSVG`) against `PawPrint.dogSVG(merchDecode(merchEncode(merchRecipe(dog))))`.
  - The two SVG strings are equal in **483 of 483 renders**.
- The check is sharp:
  - Another eye index changes the drawing for 121 of 161 dogs. The other 40 are the newborns, whose eyes are shut.
  - Another seed changes the drawing for 84 of 161 dogs (those with patches, merle, spots or sparkle).
- `merchFromSave` on the live save draws the same dog as the share picture.

**Size** (base64url in `#p=`):
- One dog with a name and two pieces: 28 characters, e.g. `#p=AQEAJSCQqVT8sQIBAAVNb2NoaRje`.
- A bare dog: 18 characters.
- A typical one-dog link: 26 to 35 characters.
- A pack of 5 with names and outfits: 136 characters.

The wire format is: version, count, then for each dog the breed, genes (2 bytes), flags, the 4-byte seed, the mix head if any, the wear list and the name as UTF-8. It ends with a 2-byte FNV check: all 816 single-bit flips of the pack link are rejected.

## 2. PawPrint, the standalone renderer

**Build:** `tools/merch_build.js` writes `merch/dist/pawprint.js` (git-ignored). It wraps three things, each in a private scope:
- `dogs/pawart_dogs.js`: 322 KB, 107 KB gzip. The dogs, outfits, faces and puppy legs.
- `mods/genes.js`: 139 KB, 37 KB gzip. Genes to coat.
- `merch/pawprint_font.js`: 260 KB, 92 KB gzip. Caveat Bold as outlines, made by `tools/merch_font.py` from `site/fonts/caveat.woff2` plus the macron subset.

The wrapper sets no `window.PawArt`, adds no style tag and touches no storage. A test checks that Node's globals are unchanged after loading it.

**Size:** 757 KB raw (250 KB gzip). Minified: **603 KB, 207 KB gzip, 154 KB brotli**. The font is the easiest thing to trim: limiting it to ASCII would save about 70 KB gzip.

**API:** `PawPrint.svg(recipe, { pose, facing, expr, bg, name, w, h, bleed, border, dpi, minLine, shadow })` returns a complete SVG.
- Poses: stand (`idle`), sit, happy (the share picture's pose), plus every art pose. The art's pose fallbacks are kept, as in `dogArtSafe`.
- Layouts (`bg`):
  - `'none'`: dog only, transparent, for garments. Adding `border` gives the sticker's white kiss-cut margin.
  - `'yard'`: a crayon yard panel with sky, sun, cloud, fence, grass and flowers, for totes.
  - `'strip'`: the mug wrap. Dog and name on the print side, a yard strip all round the bottom.
  - `'tile'`: a dotted paper card.
- The name is drawn as **outlines**. There are no `<text>` elements and no fonts to load, so every renderer draws the same letters.

**Where it runs:**
- (a) In a page outside the game: loaded beside the game, and alone in a blank page for the canvas benchmark.
- (b) In Node, for the tests.
- (c) In workerd: `merch/print_worker.mjs`, run by `merch/test_print_worker.mjs`.

## 3. Rasterising: numbers

The bench dog is a Golden with sparkle, four pieces, the yard and its name. Times are CPU time in a fresh process. `tools/merch_render.js bench` writes `bench/bench.json`.

| size | resvg-wasm, one pass: CPU (render + PNG) / peak wasm memory | resvg-wasm, banded: wasm memory / CPU | resvg-js native: CPU | Chromium canvas: draw + toBlob |
|---|---|---|---|---|
| 1500x1500 | 0.41 s (0.17 + 0.12) / — | — | 0.08 s | 27 + 47 ms |
| 2700x1050 mug | 0.42 to 0.63 s / 24 MB | 3 bands: 9 MB / 0.67 s | 0.11 s | 19 + 50 ms |
| 3000x3000 tote | 0.74 to 1.1 s / **73 MB** | 6 bands: 19 MB / 1.0 s | 0.25 s | 29 + 94 ms |
| 4500x5400 tee | 1.5 to 1.9 s / **192 MB (too big)** | 12 bands: **17 to 25 MB / 1.7 to 1.8 s** | 0.65 s | 65 + 177 ms |

- Wasm memory is the linear memory of resvg-wasm 2.6.2, measured directly. It never shrinks within an isolate.
- Banded output is identical to the one-pass render: mean difference 0.0007 per channel.
- Initialising resvg-wasm costs about 60 ms the first time in each isolate.
- The PNGs are 150 to 740 KB (resvg) and are not optimised.

**a. Browser canvas.** It works, with plenty of headroom.
- Chromium drew and exported 4096², 8192², 11000² and **16384² (268 MP)**. 20000² failed: `toBlob` returned null.
  - This matches the commonly cited Chromium limits (32767 px per side, 268,435,456 px in area). I found those only in secondary sources and an old patch, not in current source: [codereview.chromium.org/2255683005](https://codereview.chromium.org/2255683005/patch/1/10008).
- iPhone Safari:
  - The canvas was capped at 4096×4096 = **16,777,216 px** (WebKit's "Canvas area exceeds the maximum limit (width * height > 16777216)").
  - [WebKit bug 271002](https://bugs.webkit.org/show_bug.cgi?id=271002) raised the cap to 8192×8192 (fixed March 2024, 276145@main). Testers report 67 MP on iOS 18 ([pqina.nl](https://pqina.nl/blog/canvas-area-exceeds-the-maximum-limit/), [lionpuro](https://lionpuro-com.pages.dev/posts/canvas-is-finally-usable-on-safari)).
  - Apple publishes no official number. The tee file (4500x5400 = 24.3 MP) **fails on iOS 17 and older**.
- Android Chrome has the same software limits as desktop Chromium, but real devices run out of GPU memory and RAM earlier. Not tested here.
- The crayon look survives intact. The dog art uses no filters, masks or clip paths, only paths, ellipses, opacity and translate/scale. PawPrint adds only a `<pattern>` (the tile), and its names are outlines, so there is no font problem.
  - No tainted canvas: a Blob-URL SVG with nothing external exported in Chromium.
  - Canvas against the Chromium screenshot: mean difference 0.02 to 0.03 per channel.
  - Safari is not tested. The known Safari taint case is SVG with `foreignObject`, which PawPrint never emits.

**b. Node / Worker: resvg.**
- resvg-wasm and resvg-js render identically (0 difference).
- Against Chromium: mean 0.07 to 0.12 per channel, with 0.02 to 0.04% of pixels more than 32 apart (anti-aliasing at the edges).
- Clip paths and patterns work. Text would need font buffers, which is why names are outlines.
- **Problems found:**
  1. resvg 2.6.2 **panics** (`geom.rs:27 unwrap on None`; in wasm, a `RuntimeError: unreachable`) when an element with `opacity` lies wholly outside the canvas.
     - The whole-picture render never does this, but bands do. `tools/merch_band.js` leaves out elements outside each band, using `PawPrint.bbox`.
     - A server must catch the trap and re-create the instance.
  2. `img.pixels` is premultiplied. It must be unpremultiplied before writing PNG rows (`asPng()` already does this).
  3. A `clipPath` makes resvg allocate a layer the size of the canvas: 72 MB at tee size. The yard panel now paints a paper ring over its edges instead, which brought wasm memory from 72 MB to 25 MB and CPU from 4.9 s to 1.8 s.
- It runs in workerd: `print_worker.mjs` (PawPrint min + resvg-wasm, 2.4 MB) returned 2700x1050, 1500x1500 and 3000x3000 PNGs, and refused a bad link with 400. Miniflare does not enforce the CPU and memory limits.
- **Cloudflare limits** (developers.cloudflare.com/workers/platform/limits, read 24 Nov 2026):

| limit | Workers Free | Workers Paid |
|---|---|---|
| CPU per HTTP request | **10 ms** | 30 s default, configurable to 5 min |
| Memory per isolate (JS heap and wasm) | 128 MB | 128 MB |
| Worker size | 64 MiB uncompressed (the 3 MB / 10 MB compressed limits were removed, changelog 4 Sep 2026) | same |
| Global-scope startup | 1 s | 1 s |

  - So: **free plan: impossible.** Paid plan: fine for every product, with bands above about 3000x3000.
  - The render could live in a separate Worker such as `doodle-doggo-print`, kept apart from `pawhaven-api` (161 KB today) so its 3 MB bundle does not slow the game API's start.

**c. Headless Chromium** (Playwright, standing in for Cloudflare Browser Rendering): the fidelity reference.
- 2700x1050 renders in 240 to 350 ms; 3000x3000 in 530 to 630 ms. That includes setContent and screenshot, with a warm browser.
- Cloudflare Browser Rendering limits ([limits page](https://developers.cloudflare.com/browser-rendering/platform/limits/)):
  - Free: 3 concurrent browsers, 1 new browser every 20 s, 10 browser-minutes a day.
  - Paid: 200 concurrent browsers, 3 new browsers a second.
- Workable, but heavier, and it adds a second paid product for no gain in fidelity.

## 4. Print check (sample files)

Files are in `spike/<shiba|dane|dachs|golden>/` (each PNG is next to its SVG source), with inspection crops in `spike/look/`:
- `tee_front_4500x5400.png`: transparent, dog and name, no ground shadow.
- `mug_wrap_2700x1050.png`: dog, name and yard strip.
- `sticker_1500.png`: white kiss-cut border, 42 px (3.6 mm), transparent outside.
- `tote_3000x3000.png`: dog in the yard panel, with name.

The four dogs:
- A red Shiba (happy).
- A harlequin Great Dane with blue eyes (sit).
- A red Dachshund puppy (happy, puppy legs).
- A Golden with sparkle, Flower Crown, Red Bandana, Superhero Cape and Little Sneakers (stand).

**What looked right**, checked at 100% zoom:
- Outlines are crisp and fills stay inside their lines.
- No grey halo: the halo test gives 0 difference over 28,397 edge pixels on the tee and 5,363 on the sticker.
- The name is the game's own Caveat Bold, embedded as outlines.

**What looked wrong:**
- **Fixed in the spike:**
  - The overlapping cloud outlines.
  - The mug dog standing on the fence.
  - The mug name running off the mug face.
  - The faint ground shadow on bare prints, which reads as a stain on fabric (`shadow` is now off by default for `bg: 'none'`).
- **Open:**
  1. **Dark garments.** The ink `#2E2320` and the brown name disappear on navy (`look/tees_on_navy.png`). Dark tees need the sticker-style white border around the dog and a light name colour, or the shop sells light colours only.
  2. **Floating bits on stickers.** Hearts (the happy pose) and sparkle stars float apart from the dog (`look/stickers_on_blue.png`), so the kiss-cut contour has islands. Use a pose without hearts for stickers, and join or drop the stars, or check how the chosen print company builds its contour.
  3. **The Shiba's happy-pose ear and cheek** show orange fill past an open outline stroke (`look/crop_shiba_ear.png`).
     - This is in the game art itself, so the share picture has it too. It is barely visible at game size and obvious on a 10-inch print.
     - It is one for the art lane (the owner's rule: every fill inside its outline). The other three dogs looked clean.
  4. The Dane's grey muzzle block and the crude shapes are the intended joke. They print as drawn.

**Line weight:**
- The dog's main outline is 3.7 art units. Printed, that is:
  - tee 7 to 12 mm
  - tote 3.3 to 5.9 mm
  - sticker 2.2 to 3.9 mm
  - mug 1.3 to 2.2 mm
- The thinnest strokes (shadow hatching, eye shines) are 1.3 to 1.6 units.
- **Proposed rule:**
  - No printed stroke thinner than **0.5 mm** (about 6 px at 300 dpi). `PawPrint`'s `minLine` thickens only such strokes: 3 on the Golden mug, 2 on its sticker, none elsewhere.
  - Never print the dog smaller than **80 mm** across its 240-unit art box, which keeps the main outline at 1.2 mm or more. The mug sits at about 1.3 mm.
  - Check 0.5 mm against the chosen print company's own minimum.

**Mockups:**
- `mock_tee.png` (Shiba)
- `mock_mug.png` (Dane, the print side of the wrap)
- `mock_tote.png` (Golden)
- `mock_sticker_sheet.png` (all four)

They are flat SVG drawings in the sketchbook style (paper dots, brown ink, no photos) with the real print laid on, rendered by resvg.

## 5. Getting the dog to the website

**`merchFromSave(json, { today })`:**
- Used on doodledoggo.app/merch, the same origin as `/play/`. The page reads `localStorage['pawhaven_proto_v1']`: plain JSON of `S`, about 6 to 7 KB on a new save. That is all it needs.
- It reads `S.dogs` and marks the `activeId` dog.
  - A v1.0 to v1.3 save (one `S.dog` with the outfit at the top) still works.
  - The age is taken from `born`, the same way `ageMonths` does it.
- It never needs the cloud. A player on another device signs in to the game once, and the cloud copy lands in the same key.
- Limits:
  - It refuses anything over 8 MB, unparsable, or not `v: 1`.
  - It reads at most 64 dogs.
  - It skips unknown breeds.
  - It drops items the art cannot draw.
  - It cuts the name at 20 characters and leaves it out if the print font cannot draw it. The buyer can type one instead.
- It is tested on the real game save and on fakes.

**`merchFromHash('#p=…')`:**
- Used on itch.io: the game opens `https://doodledoggo.app/merch/#p=<merchEncode([...])>` in a new tab.
- The hash is never sent to a server, and other hash parameters are allowed.
- Limits:
  - 1 to 8 dogs.
  - At most 1024 characters.
  - Each recipe is checked field by field. Unknown fields (`url`, `__proto__`), bad breeds or genes, two items in one slot, a mix with its own breed, and unprintable or over-long names are all refused.
- It never throws: tested on 20,000 random strings, every single-bit flip, cut, padded and oversized links, and non-strings.

Tests: `merch/test_pawprint.js` (21 checks, Node) and `merch/test_merch_game.js` (Playwright on the real game).

## Recommended pipeline

The browser draws the preview. The server redraws the print from the recipe alone. Print files only ever come from game art, so there are no uploads and nothing to moderate except the optional name (Latin letters, at most 20, drawn as outlines).

**On Workers Paid,** run a separate render Worker with PawPrint and resvg-wasm:
- Render in bands above 3000x3000.
- Stream the PNG to R2.
- Hand the print company a signed R2 URL when the order is placed.

**If the account stays on the free plan,** the same `PawPrint` + resvg-js code runs as a small Node render step outside Cloudflare (about 0.1 to 0.7 s per file, 330 MB peak at tee size), triggered from the Stripe webhook. The Worker only stores the recipe with the order and checks a small 600 px proof against what the buyer saw.

```
 game (/play/ or itch.io)
   |  same origin: localStorage pawhaven_proto_v1 -> merchFromSave
   |  itch.io frame: open doodledoggo.app/merch/#p=<recipes>  -> merchFromHash
   v
 /merch page (PawPrint in the browser)
   live preview: PawPrint.svg -> <img>/canvas (≤ 8 MP on phones) -> sketchbook mockups
   |  cart = { recipe link, product, pose, name }      (no image is uploaded)
   v
 Stripe Checkout --webhook--> pawhaven-api: store order + recipe (D1)
   |  render job (Queue or service binding)
   v
 print render: Workers Paid  -> doodle-doggo-print (PawPrint + resvg-wasm, banded) -> R2 PNG
               free plan     -> Node render step (PawPrint + resvg-js)            -> R2 PNG
   |  signed R2 URL + product + address
   v
 print company (US/UK fulfilment)
```

## Open risks

1. **Plan.** Server rendering in a Worker needs Workers Paid ($5 a month, account not checked). Otherwise it needs a render step outside Cloudflare, which is one more thing to host and watch.
2. **Banding is mine, not resvg's.** The culling work-around for the resvg 2.6.2 panic and the premultiplied pixels must be kept. The resvg-wasm npm package has not moved past 2.6.2. Every render needs a timeout and a fresh instance after a trap.
3. **Phones can't make tee-size files.** iOS 17 and older cap a canvas at 16.7 MP, below the tee's 24.3 MP. The browser should only ever make previews; the full-size print file is made by the server.
4. **Dark garments and sticker contours** need art decisions: a white border or a light ink, and poses without floating hearts and stars.
5. **The Shiba ear and cheek fill** past an open stroke. It is an art fix, and it affects the game too.
6. **Names.**
   - Only the Latin letters the Caveat outlines cover can print, so Japanese and other CJK players need a typed Latin name or no name.
   - The free text needs a short word filter before printing. It is printed only on the buyer's own item, but the print company sees it.
   - The page and order mails must escape the name as text.
7. **Recipes outlive the art.** `PawArt.dog` is pure, but a later art change redraws old recipes differently. Each order should store the PNG it printed (R2) and the art version, so a reprint matches the original.
8. **Licences.** Caveat is SIL OFL 1.1: embedding it as outlines in prints is allowed. The print company's own file rules (colour profile, 150 to 300 dpi, maximum file size, minimum line) are not checked yet.
9. **Wording.** The shop sells prints of your dog, never dogs. Shop copy must keep the game's word rules.

## Files added on the branch (commit `bcdc32ba`)

- `merch/pawprint_core.js`: recipe, wire, readers, layouts, bbox, line weight, name outlines
- `merch/pawprint_font.js`: generated Caveat Bold outlines (227 glyphs)
- `merch/.gitignore`: ignores `dist/`, the built PawPrint
- `merch/print_worker.mjs`: the Worker sketch
- `merch/test_print_worker.mjs`: runs the Worker sketch in workerd
- `merch/test_pawprint.js`: Node tests
- `merch/test_merch_game.js`: the round trip against the real game
- `tools/merch_build.js`: builds `merch/dist/pawprint.js` and `.min.js`
- `tools/merch_font.py`: makes the font outlines (fontTools)
- `tools/merch_render.js`: samples, mockups, benchmarks
- `tools/merch_band.js`: banded streaming PNG with memory numbers

**To run:**
1. Build the game and the test harness: `node game/build.js && node game/harness.js merged`.
2. Build PawPrint: `NODE_PATH=$(npm root -g) node tools/merch_build.js`.
3. Run the tests: `node merch/test_pawprint.js` and `NODE_PATH=$(npm root -g) node merch/test_merch_game.js`.
4. The render tools need `@resvg/resvg-wasm@2.6.2`, `@resvg/resvg-js@2.6.2` and `sharp` on `NODE_PATH`. They were installed in the scratchpad, not in the repo.
