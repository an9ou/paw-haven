# Print files: what Printful asks for, and what we send (24 Nov 2026)

Settles the print files for the "My dog" shop from Printful's published rules, above all the tee, where DESIGN.md (dog about 10.8 x 12.6 in) and SPIKE.md (a 4500x5400 file, dog filling it) disagree. Marks: [fetched] I read the page or JSON; [snippet] search extract only; [not verified] nobody has confirmed it; (calc) my arithmetic.

## Sources

- A. Public catalog API `api.printful.com/products/{id}` and `/products/{id}/sizes`, no key [fetched 24 Nov]. All v2 catalog endpoints (`/v2/catalog-products/71`, `/mockup-templates`, `/mockup-styles`, `/availability`, `/prices`, `/catalog-variants/…`) and v1 `/mockup-generator/printfiles/{id}` and `/templates/{id}` answer 401: they need the store's key.
- B. Help centre (help.printful.com, read through its public article search): "standard 15″ × 18″ print placement" (50263171283217, updated 11 Nov 2026), "transition my API integration" (50263208968209), "How is my design scaled for different garment sizes?" (50264397552657, 22 Nov 2026), "prepare my print file" (50264019148177), "When is a white underbase used?" (50264409546641), "Why does my design look different" (50264096966289), "Disclaimers for Printing Techniques" (50264395400337), "150 and 300 DPI" (50264138559377), "DTFlex" (50264342999313), "safe print area" (50264024409233) [all fetched].
- C. Developer docs v1 and v2 (developers.printful.com/docs) [fetched].
- D. Printful blog: "t-shirt design placement guide" and "prepare the perfect printfile" (28 Jul 2025) [fetched]; "transparency-in-dtg-files" [fetched].
- E. support.printful.com sticker guidelines (41396541153553): host blocked here, [snippet] only. Product pages hide "File guidelines" behind script: not readable.

## 1. Facts per product

| Product (id) | Print area | File Printful wants | Technique today | Source |
|---|---|---|---|---|
| Tee, Bella+Canvas 3001 (71) | Front `front_large` **15 x 18 in on L–5XL**; XS, S, M are **downscaled automatically to fit 11.5 x 13.8 in** (x0.767, proportional, never cropped). Legacy `front` (12 x 16 in, 1800x2400 at 150 dpi) is closed for new products since 17 May 2025 | 150 dpi minimum, 300 dpi "perfectly fine"; 15 x 18 in = 2250x2700 at 150, **4500x5400 at 300** (calc). Exact printfile px [not verified] | DTG is the default; DTF (`DTFILM`, placement `front_dtf`) is optional; embroidery | B, A, C |
| Sweatshirt, Gildan 18000 (145) | Front `default`; size and any small-size downscale [not verified] | 150 dpi DTG | DTG default, DTF optional | A, B |
| Hoodie, Gildan 18500 (146) | Front `default`; area above the pocket [not verified]. One reseller lists 4200x4200 px [snippet, third party] | 150 dpi DTG | DTG default, DTF optional | A |
| Tote, Econscious EC8000 (367) | Bag 16 x 14.5 x 5 in; print area [not verified] | 150 dpi DTG | DTG default, DTF `front_dtf_tote` | A |
| Tote 1553 | Printful names it "BagBase W101 Bag of Life", 15 x 16.5 in bag | — | **Embroidery and DTF only, no DTG** | A |
| Mug, 11 oz white glossy (19) | Wrap **9 x 3.5 in** (catalog `dimensions`); mug 3.8 in tall, 3.2 in across, so about 10 in round (calc) | Mug templates "support up to 300 DPI": **2700x1050** (calc). Handle safe zone [not verified] | Sublimation; transparency is fine on mugs | A, B, D |
| Sticker sheet (505) | **5.83 x 8.27 in** (A5) | 300 dpi: about 1749x2481 (calc). Placements `default` and `background` | Digital print; Printful adds a **0.12 in (3 mm) white border** | A, D |

Rules for every product [fetched B, D unless marked]:
- PNG (transparent) for DTG; JPEG has no transparency. sRGB IEC61966-2.1. Files up to 200 MB and 20,000 x 20,000 px. No "Save for Web" (72 dpi).
- No size scaling "as a general rule": a design prints at the same size on every garment size, except where the File guidelines list a smaller "Max print area" (the 3001 above).
- Placement: (0,0) is the top-left of the print area; by default a file must fit inside the area (v1 `fill_mode: fit`). The v2 layer `position` takes inches. So a file smaller than the area, sent without `position`, is fitted to the area, i.e. **enlarged** [fetched C; exact default for v2 not verified]. Send the full-area canvas and our dog sits exactly where we drew it.
- v2 order items carry `placements[{placement, technique, layers}]`; the docs' examples always give `technique` ("dtg") [fetched C]. Whether it may be left out [not verified]: always send it.
- Semi-transparency: "Avoid semi-transparent edges or fades for DTG/DTF printing"; shadows, glows, low-opacity textures "may not print the way they appear", worst on coloured and dark garments; halftone instead. Fully transparent pixels disappear, "anything in between might not behave as expected"; on dark garments it can show as white speckles [D].
- Underbase: chosen automatically. White ink is used for a colourful design on a dark or coloured fabric, for white details, and for black on black. No white ink on white garments. Ash and other off-whites may still get it.
- Lines: DTF needs lines of **at least 1 pt, "approximately 4 px at 300 DPI" (0.35 mm)**, text at least 1 pt; DTG publishes no number, only "very small text or thin lines" blur. DTF's white film "may be slightly visible", feels stiff at first, low breathability.
- Placement on the body: Printful's blog puts a full-front print "3–4 inches below the collar", a centre-chest print 3–3.5 in below it, and calls 6 x 6 to 10 x 8 in (8 x 8 most common) the standard centre-chest size; 12 x 16 in is the full front [fetched D]. Where the 15 x 18 area's top edge sits on the shirt [not verified].
- Garment widths, flat, in inches [fetched A]: 3001 XS 16.5, S 18, M 20, L 22, XL 24, 2XL 26, 3XL 28. 18000 and 18500: S 20, M 22, L 24, XL 26, 2XL 28, 3XL 30.

## 2. Colours and sizes in both the US and the UK (public catalog, in stock 24 Nov 2026) [fetched A]

- **Tee 3001** (US 83 colours, UK 46). Short common list: White #ffffff (US S–5XL, XS "supplier out of stock"; UK S–4XL), **Soft Cream** #e7d4c0 (US XS–4XL, UK S–2XL; *Natural is US only*), **Athletic Heather** #cececc (US XS–5XL, UK S–2XL), Pink #fdbfc7 (US XS–4XL, UK S–2XL), **Heather Prism Ice Blue** #c3e2e3 (US XS–4XL, UK XS–2XL; *Light Blue has no US 3XL and no UK XS*), Navy #212642 (US XS–5XL, UK XS–2XL), Black #0c0c0c (US XS–5XL, UK XS–4XL).
- **The UK has no XS and no 3XL in most tee colours**: only S–2XL is safe in both, plus XS for navy, black and ice blue, and 3XL for white and black.
- Sweatshirt 18000 (14 common): White, Sport Grey, Sand, Light Pink, Light Blue, Navy, Black; S–2XL everywhere, 3XL in the UK for all but the pinks and blues. No XS.
- Hoodie 18500 (14 common): White, Sport Grey, Light Pink, Light Blue, Navy, Black; **Sand is US only**. S–2XL everywhere. No XS.
- Tote EC8000: Black and **Oyster** (the natural colour) in both. Tote 1553: US and EU only.
- Mug 11 oz: US, UK (also EU, CA, JP, AU, BR). Sticker sheet: US, UK (also EU, CA, JP, AU).

## 3. Decisions

**(1) The tee.** Neither 35% nor 45% as written: those percentages compare the dog with the whole drawing, sleeves included. Against the body of an L tee (22 in), the design's 10.8 in is 49% and the spike's layout (the dog's outline fitted to 4500 less 2% margins, so up to 14.4 in wide, calc from `pawprint_core.js`) is up to 65%: a full-front print.
- File: **4500 x 5400 px, 300 dpi, transparent PNG, sRGB, placement `front_large`, technique `dtg`**, sent as the full canvas (no `position`). 300 dpi rather than 150: crisper crayon edges, and DTF asks 300 if we ever switch; it is a server render, so the iOS canvas limit does not apply.
- Dog: the 240 x 200-unit art box prints **10 x 8.33 in** (3000 x 2500 px, 12.5 px per unit), the name in a 10 x 1.67 in strip under it (letters at most 1.3 in, shrunk to fit): one **10 x 10 in block**, 45% of an L body. That is a bold centre-chest print, just above Printful's 10 x 8 standard and well inside the 12 x 16 full front: big enough to read the joke across a room, less solid ink (softer shirt, less underbase on dark colours).
- Scale by the art box, not the dog's outline, so a puppy prints puppy-sized, as DESIGN 5 promises ("as it looks today").
- Place: centred, block top **1 in (300 px) below the top of the print area** (block at x 750, y 300 in the canvas). Expected 3–4 in below the collar on L, Printful's own advice; confirm with a sample.
- **One file for every size.** Printful shrinks XS, S and M to 7.7 x 7.7 in itself (43% of S, 38% of M), which keeps the proportion right. The preview and size picker say so.
- Main outline 3.7 units = 3.9 mm (3.0 mm on XS–M); thinnest stroke 1.3 units = 1.4 mm. All above any minimum.

**(2) The others, one line each.**
- Sweatshirt 18000: the same 10 x 10 in block, centred, 1 in below the area top, on Printful's front printfile at 300 dpi (42% of an L at 24 in).
- Hoodie 18500: a **9 x 9 in** block (art box 9 x 7.5 in), centred, top-aligned so its bottom stays above the pocket; check against Printful's hoodie template before launch.
- Tote EC8000: the yard panel at **10 x 10 in** (3000 x 3000 px at 300 dpi, as the spike), centred, inside a full-area canvas; drop tote 1553 (no DTG, no UK).
- Mug: **2700 x 1050 px** wrap at 300 dpi, unchanged; keep dog and name 0.25 in from top and bottom and 0.5 in from both short ends (they meet at the handle).
- Sticker sheet: about **1749 x 2481 px** at 300 dpi, transparent, one opaque island per sticker, no cut lines in the file (Printful cuts round each shape and adds its 3 mm border); layout rule in (4).

**(3) Dark garments: keep the paper patch.** Every non-white garment gets an underbase, and semi-transparent pixels speckle on it. The patch is one opaque shape, so the crayon opacity (the second pencil pass at 0.35, the hatching, sparkle) is composited onto cream and prints solid; the brown ink and the name stay readable. A white crayon border would also back the dog, but the name, the hearts and any pencil overshoot would still sit semi-transparent on bare fabric. Keep the patch tight (the 10 x 10 block plus 0.4 in of wobble) and print it DTG, not DTF, so the big solid area stays soft. On white garments: no patch, no white ink (white parts of the dog show the shirt).
- On every non-white garment, also **flatten the alpha** of whatever touches bare fabric: alpha 0.5 or more becomes fully opaque, under 0.5 becomes clear. At 300 dpi the hard edge is 0.08 mm and does not show.

**(4) Sticker sheet layout rule.**
- Each sticker is **one connected opaque shape**: the dog (or head, label, doodle) plus a white backing made by `silhouette()` 0.06 in wide, which joins bits up to 0.12 in apart. Bits further out are left out: no floating hearts or sparkle stars (use stand or sit, or draw the hearts overlapping the head).
- At least **0.5 in between two opaque shapes** (leaves about 6 mm between cut lines after both 3 mm borders), and at least **0.4 in from the sheet edge**.
- Each shape at least **0.75 in** across; nothing thinner than 0.2 in (a thin neck or tail tip would tear).
- No dashed cut lines and no own outer border in the file (the 42 px sticker border was for a single sticker; Printful adds its own 3 mm).

**(5) Line weight.** Printful's only published minimum is DTF's 1 pt (0.35 mm, 4 px at 300 dpi). Keep `minLine: 0.5` mm as our rule for everything: it clears Printful's floor with room for DTG blur and sublimation. Keep the 80 mm minimum art box too.

## 4. Constants to change later (no file is changed here)

| File | Name | Old | New |
|---|---|---|---|
| `docs/design/merch/prototype/js/art.js` | `P.tee.pa` | `[136, 108, 128, 149]` | `[148, 109, 104, 104]` (10 x 10 in at 10.4 units per inch: the 228-unit chest = 22 in on L) |
| same | `P.sweat.pa` | `[140, 104, 120, 140]` | `[151, 104, 98, 98]` (9.8 units per inch: 236 units = 24 in) |
| same | `P.hoodie.pa` | `[146, 134, 108, 126]` | `[156, 134, 88, 88]` (9 x 9 in) |
| same | `P.tote.pa` | `[122, 204, 156, 156]` | `[124, 204, 152, 152]` (10 x 10 in, if the bag's 16 in is its width) |
| `prototype/js/merch.js` | tee `file` | `Printed 10.8 × 12.6 in on the front` | `Printed 10 × 10 in on the front (7.7 × 7.7 in on XS, S, M)` |
| same | sweat `file`, hoodie `file`, tote `file` | 10.8 × 12.6, 10 × 11.7, 11 × 11 | `10 × 10`, `9 × 9, above the pocket`, `10 × 10` |
| same | `COL.natural`, `COL.blue` | Natural #F3E9D2, Light blue #CFE0EF | Soft Cream #E7D4C0, Ice blue #C3E2E3 |
| same | tee `sizes` (`ADULT`) | XS–3XL for all colours | per colour and country: UK S–2XL (+XS navy, black, ice blue; +3XL white, black) |
| same | hoodie `cols` | includes `sand` | drop `sand` (US only), or US only |
| `tools/merch_render.js` | `PRODUCTS.tee_front_4500x5400` | `bg: 'none'`, fit to canvas | add `block: [750, 300, 3000, 3000]`, `scale: 'artbox'` |
| same | `PRODUCTS.sticker_1500` | `border: 42` | a sheet product `sticker_sheet_1749x2481`, backing 18 px, no own border |
| `merch/pawprint_core.js` `svg()` | `'none'` layout: `m = B + S*0.02 + border`, `k = min(box/bbox)` | dog fills the canvas | new options `block` (px box for art box + name) and `scale: 'artbox'` (`k` = block width / 240); name strip = block height x 0.167 |
| same | alpha | soft edges everywhere | option `hardAlpha` (threshold 0.5) for garments other than white, and the sticker sheet |
| same | `minLine` default | 0.5 mm | unchanged (Printful's floor is 0.35 mm) |

## Not verified

- Exact printfile pixels and dpi per variant for all seven products (`GET /mockup-generator/printfiles/{id}` or v2 `/catalog-products/{id}/mockup-templates`): needs the owner's Printful key.
- The front print area and any small-size downscale of the sweatshirt, hoodie (above the pocket) and EC8000 tote; the mug's handle safe zone and which wrap edge meets the handle.
- Sticker sheet: minimum sticker size, minimum gap, safe margin, and exactly how the cut line is traced (alpha threshold, whether near bits merge): the sticker guidelines page was only a search snippet. A real sheet should be ordered.
- Where the 15 x 18 in area starts below the collar, and whether XS–M keep the same top: needs a sample tee (Printful offers 20% off samples, PROVIDERS.md).
- Whether `front_large` costs extra as a first placement: the help centre says "without any additional cost", but the public catalog lists `front_large` at +$5.95 (probably as a second placement). Check with v2 `/prices` and the key.
- Whether v2 accepts an order item without `technique`, and the v2 default when no `position` is sent.
- Stock moves daily: re-read the catalog before launch.
