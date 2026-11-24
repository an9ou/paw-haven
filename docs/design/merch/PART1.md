# Part 1: print art ready for real products (24 Nov 2026)

PawPrint now makes the final print files for the launch products, the **tee and the mug**, as PRINT_FILES.md decided. Nothing is live.

**No stickers at launch (owner, 24 Nov 2026).** The sticker sheet is switched off: `PRODUCTS.stickers.launch` is `false`, so the merch page and the Worker leave it out. Its layout code and tests stay as they were when the decision came (all green, not polished further), and there are no sticker samples for the owner.

## What was built

- **One table, `PawPrint.PRODUCTS`** (`merch/pawprint_core.js`): for `tee`, `mug` (`launch: true`) and `stickers` (`launch: false`) the file size, 300 dpi, inches, the Printful product, placement and technique (tee 71 `front_large` `dtg`; mug 19 `default` `sublimation`; sheet 505 `default` `digital`), the layout boxes, the poses (stand, sit, happy) and the colours. The merch page preview, the print page and the tests all read it.
- **`PawPrint.print(recipe, { product, colour, pose, name })`** returns the whole print SVG at exactly the product's size. A bad recipe, product, colour or pose throws (a caller's slip). A name that cannot print is left off quietly. `print.last` holds the numbers (scale, art box in mm, boxes).
- **Tee**: 4500 x 5400, transparent. The 240 x 200 art box prints 10 x 8.33 in at (750, 300), the name in a 10 x 1.67 in strip under it (letters at most 1.3 in, shrunk to fit). Scaled by the art box, so a puppy prints puppy-sized. No ground shadow.
- **Tee colours** (`PawPrint.TEE_COLOURS`, both US and UK): White #FFFFFF, Soft Cream #E7D4C0, Athletic Heather #CECECC, Pink #FDBFC7, Heather Prism Ice Blue #C3E2E3, Navy #212642, Black #0C0C0C, each with US, UK and "both" sizes. Every colour but white has `patch: true`.
- **The paper patch**: a cream card with a wobbly crayon edge, 0.4 in round the 10 x 10 in block (or round the art box when the name is off), behind the dog and the name.
- **Mug**: 2700 x 1050. The same dog on both faces (centred at 2.25 in and 6.75 in), facing the back of the mug, the name above each dog, a yard strip along the bottom. Dog and name stay 0.25 in from top and bottom and 0.5 in from both ends (the handle). The dog fills its face; its art box is never under 80 mm (smallest over 40 breeds, 3 ages, 3 poses: 84.7 mm). The name fits a 3 in face. The mug is white: no background colour, so no band edge shows on the glaze.
- **Sticker sheet (switched off, code kept as is)**: 1749 x 2481, transparent. Nine stickers, as DESIGN 9: stand, sit, happy (one scale), a big head, a small head on a round badge, a name label ("good dog!" when the name is off), a heart, a paw, a bone. Layout: two rows of two (dogs and big head), then label and badge, then heart, paw, bone. Each sticker is the art over a white backing 0.06 in wide (PRINT_FILES 4), which joins bits up to 0.12 in apart. Sparkle stars are left off the sheet; the happy pose's hearts get a white bridge to the nearest part of the dog. No cut line and no border of our own.
- **Line weight**: no stroke under 0.5 mm in any file (`minLine`), counted through every transform. The smallest dog on a sheet: 53.9 mm across its art box (our sticker rule: at least 50 mm).
- **Names** (`merch/names.js`, no dependencies; also inside PawPrint): `nameClean(s)` and `nameOk(s)`. At most 20 characters, trimmed, one line, only what the font draws (Latin with accents, digits, space and `' - . & !`). A short kind-word list (ROT13 in the file), matched after accents off, leet digits, spacing and repeats. A refusal is `{ ok: false, why, say: "Let's try another name" }`, never a throw.
- **`PawPrint.ART_VER`** (`pp1-` + a hash of the art, genes, font, name rules and core, made by `tools/merch_build.js`) is in every print SVG as `data-pawprint` and a comment. Store it with each order.
- **The print page** `merch/print/v1/` (`index.html`, `print.js`; the build copies them with `pawprint.js` to `merch/dist/print/v1/`). It reads `#p=<one dog>&prod=tee|mug|stickers&col=<colour>&pose=stand|sit|happy&n=0|1`, checks it (`PawPrint.printFromHash`: unknown, repeated or missing keys, a wrong colour or pose, two dogs or a bad dog all refuse) and draws one SVG at the product's pixel size, transparent, no margins. Title `READY wxh` or `ERR ...`. Its CSP allows no requests but its own two scripts. Screenshot it with the viewport at the product size, or half of it at deviceScaleFactor 2 (the tee). `PawPrint.printHash(recipe, o)` makes the link.

## Edges on coloured fabric

- The patch is drawn with `shape-rendering="crispEdges"`, and it is the only thing that touches the fabric: the dog is clipped to its art box and the name to its strip, both inside the patch. Every soft crayon pass is composited onto cream. Result, measured on the Chromium render: alpha is only 0 or 255 in every navy tee file (no white speckle risk).
- (Stickers, switched off: their backings are crisp too, so a sheet file is alpha 0 or 255.)
- On white tees the soft edges stay (no white ink on white); the mug is sublimation, where soft edges are fine.
- Pixel post-processing (flatten alpha at 0.5) is only needed if a renderer ignores `crispEdges` (Chromium and resvg both honour it), or if we ever print on colour without the patch.

## How to run

1. `NODE_PATH=$(npm root -g) node tools/merch_build.js` (PawPrint, ART_VER, the print page in `merch/dist/print/v1/`).
2. `NODE_PATH=$(npm root -g) node merch/test_pawprint.js`: 63 checks; the last 8 render the real print page in Chromium (skipped without Playwright), including every patched tee colour.
3. The game round trip: `node game/build.js && node game/harness.js merged && NODE_PATH=$(npm root -g) node merch/test_merch_game.js`.
4. Samples: `NODE_PATH=$(npm root -g) node tools/merch_render.js part1 [out] [sheets]` renders the 8 sample dogs (`merch/sample_dogs.js`) through the print page (full size to `merch/dist/part1/`, about 0.5 MB a file, up to 1 MB for a tee) and writes the mock-ups in `samples/`: `tee_white.png`, `tee_dark.png` (navy and black), `mug.png`. No sticker samples.

## Left, or needs a decision

- **Stickers, if they come back:** thin parts. In our file about 1% of a sheet's area (ear tips, a zigzag tail, the heart bridges) is narrower than 0.2 in. After Printful's 3 mm border every part is at least 0.24 in. A 0.1 in backing (`PRODUCTS.stickers.backing: 30`) would make the file itself meet 0.2 in, with a wider white rim. Recommend: keep 0.06 in until a real sheet is ordered.
- Sparkle stars are dropped on stickers (they would float).
- **Mug face direction**: which half of the wrap faces out with the handle on the right is not verified, so both faces carry the dog and the name.
- **Not verified with Printful** (needs the store key or a sample): the exact printfile pixels, where the 15 x 18 in area sits under the collar, the mug's handle zone, and how the sticker cut is traced.
- The Shiba happy-pose ear and cheek fill is game art (the Game Manager's fix); it shows on the tee and mug samples.
- The merch page preview should switch to `PawPrint.print` (it still uses the prototype's own layouts) and the order server should send the print page link and store `ART_VER`.
