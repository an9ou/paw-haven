# Merch part 9: the art review

Branch `merch/shop` at 12d9fe4, 25 Nov 2026 (JST). Reviewer: paw-reviewer (read-only); this file is the reviewer’s report as handed back, written down by the MERCH session. 46 print files at full size, the shop page’s own pictures, the emails and the legal pages. The pictures it names were kept only for the session (not in git).

Fixes: see the end of this file (added when the fix batches are merged).

```
ART REVIEW, merch part 9 (merch/shop @ 12d9fe4, detached; ART_VER pp1-3f73333c). Read-only. The worktree is clean (git status is empty).
Pictures are in /tmp/claude-0/-home-user-paw-haven/375b5391-25b0-5759-b21c-d2ed25c2699d/scratchpad/part9_art/ and the full-size files in .../scratchpad/full/.

BLOCKER
- None. No print file I rendered should be stopped from printing.

MAJOR
M1. Mug preview: the dog faces the wrong way relative to the handle.
- What: `site/merch/mock.js:51-63` draws the handle on the right and shows the LEFT half of the wrap (x 0-1350), with x 0 at the mug's left edge. So the buyer sees the dog facing the handle, name tilted -2°.
- Why it is wrong: the wrap's ends meet at the handle and the strip reads left to right. So with the handle on the right you see x 1350-2700. That half's dog faces away from the handle and its name tilts +2°.
- Result: the real mug shows the mirror image of the preview. This is a preview ≠ print mismatch the buyer will notice, on the home card and on step 3.
- Pictures: P6_mug_preview.png, P7_mug_flat.png, C1_mug_wraps.png.
- Fix: in `mug()`, lay the print at x = 30 - 4.5*k (show the right half), or draw the handle on the left. Confirm with a sample, as PART1 "Mug face direction" says.

MINOR
m1. Tee mock: the sleeve hem lines lie outside the tee outline, on the page background.
- Seen on both sleeves, on every colour. On dark tees it is a cream stroke past the armpit notch. This breaks the owner's "inside the lines" rule in the buyer's own view of the product.
- Cause: `mock.js:37`, hems `[P(±15.2,8), P(±12,10.6)]` sit below the sleeve edge `P(±16,7)→P(±12.5,10)`.
- Fix: move the hem just inside the sleeve, e.g. `P(±15.4,7.4)→P(±12.7,9.7)`, or clip the hems to the body path.
- Pictures: P8b_tee_mock_hem_outside_white_200.png, P5b_tee_mock_armpit_hem_400.png.

m2. Newborns: all three poses print the same file.
- Beagle newborn stand and happy PNGs are byte-identical (`full/beagle_newborn_*_tee_white.png`).
- The page still offers Stand / Sit / Happy, so a buyer who picks "Happy" gets the same sleeping pup with no hearts.
- Fix: show one pose ("Sleeping") for a = 2, in `merch.js` rMake (the pose buttons) and the cart. Or say so under the buttons.

m3. Long names make a wide, empty patch.
- The tee name stays 390 px (1.3 in) until it reaches the 9.6 in band. "Sir Wigglesworth III" under a 5 in Maltese puppy prints wider than the dog, and the patch grows to about 10.4 in. Same for the 20-W Golden (10.6 in patch).
- Picture: A1_batch2_tees.png (pink tile); `pawprint_core.js:509` (N0 fit box `P.name.w`).
- Fix: cap the name width at about max(dog width x 1.15, 6 in), down to `nameMin`.

m4. Dog pick cards show the ground shadow; the print drops it.
- The dog cards on "Which dog?" draw the hatched grey ground shadow. The previews and the print never have it.
- Picture: P2_pick_390.png.
- Fix: draw the cards from the print art without the shadow (`dropShadow`), as the pose buttons already do.

m5. Mug yard strip at the handle.
- At the seam a fence picket is cut in half and the base line steps by about 5 px.
- Flower doodles land in the 0.5 in handle keep-clear (x < 150 and x > 2550; greyhound and Dane wraps).
- Pictures: C4_mug_seam_ends_joined_100.png, C1_mug_wraps.png. Cause: `yardStrip(...)` in `mugBody`, `pawprint_core.js:540`.
- Fix: start and end the fence on a whole picket gap, keep flowers out of the ends, and make the base line level at x 0 and 2700.

m6. White tees keep soft edges.
- 0.5-1.0% of inked pixels have partial alpha, all anti-aliased edges. No free-standing semi-transparent ink was found within 3 px of nothing opaque (Samoyed, Westie, Golden sparkle, Dalmatian, newborns).
- This is the PART1 choice, but Printful's DTG advice is "avoid semi-transparent edges".
- Fix (cheap): flatten alpha at 0.5 on white tees too, as is already done for the patched colours.

m7. Emails look plain.
- The heading is a system serif (Times-like) and there is no dog picture. Line names don't match: "Mug with Biscuit" but "Tee with your dog, navy, L" (`cloudflare/merch/mail.js:42`).
- Picture: `docs/design/merch/part6_shots/emails/thanks_390.png`.
- Fix: use one wording (both "with Biscuit") and a sans or rounded stack for the heading. A small dog picture is optional.

GAME-ART FINDINGS (for the Game Manager)
- None new. Review item 12 (tricolour Corgi happy-pose neck) is now closed: the outline is continuous (G1_corgi_tri_happy_neck_100.png).
- The Shiba happy-pose ear and cheek also look clean at print size (ov_shiba.png).
- The Pug sitting front leg is messy but closed (G2_pug_sit_neck_frontleg_80.png): crude by design, no fill escapes.

CHECKED AND FINE
- Prints: 46 print files through the real print page, all READY: 34 breeds (tiny, long, giant, fluffy, flat-faced), solid, merle (harlequin, dapple, blue merle), tan-point tricolours, brindle, spots, white and black dogs, newborn, 3-month and adult, all 3 poses, 11 outfits and sparkle.
- Nothing cut: the ink box equals the reported drawn box. Witch Hat, Akita tail and Astronaut Helmet are whole. Part-1 items 1, 7, 8 and 12 are really fixed.
- Patch and edges: alpha is only 0/255 on every patched colour, in both Chromium and the 12-band resvg fallback. Banded vs one pass: no seam (at most 12 px of anti-alias difference at a band row). Patch edge and corners are clean at 100% on all 7 colours (B1_samoyed_all_tee_colours.png).
- Names, mug, page: Caveat names are clean at 100%. The mug's 16-wide-letter limit holds (17 refused, 16 at 90 px). Mug faces are the same size and level, clear of the 0.25 in rim/base and 0.5 in ends. The tee preview places the patch at the print's scale and spot. The legal pages follow the site's style.
```

## Fixes

### Print and email fixes (branch `merch/part9-print-fixes`, 25 Nov 2026)

New print build **`pp1-5688199b`** (released in `site/merch/print/pp1-5688199b/`; the pre-launch `pp1-3f73333c` folder, never used for an order, is removed).

- **m3** (`merch/pawprint_core.js` `teeBody`, `PRODUCTS.tee.name.grow` 1.15 / `minW` 1800): the tee name's band is at most max(dog width x 1.15, 6 in); the letters shrink to fit, down to `nameMin` (87 px) and no further. "Sir Wigglesworth III" under the 5 in Maltese puppy: 9.6 in -> 6.0 in (244 px letters), patch 10.6 -> 7.0 in wide; twenty W's under the 7.9 in Golden: 9.6 -> 9.1 in; short names unchanged at 390 px. Check: `test_pawprint.js` "long names under small dogs" and a "wide name" row over the 720-tee scan.
- **m5** (`yardStrip`): a whole number of pickets with half a gap at each end, so the seam at the handle falls in a whole gap; the rail and the grass line level at x 0 and x 2700; no flower within 150 px of either end. Check: "mug yard strip, 24 wraps".
- **m6** (`teeBody`, `PRODUCTS.tee.backing` 2.4 px): on white tees the drawing and the name lie on a crisp-edged white backing (as the sticker sheet's), so every tee file has only alpha 0 or 255, in Chromium and in the 12-band resvg fallback; white prints no ink on a white tee. Checks: `test_pawprint.js` (the backing in the SVG; rendered white tees: 0 soft pixels) and `render_chromium.mjs` (now also the white tee of every sample dog, both renderers, alpha 0/255, within `MATCH`).
- **m7** (`cloudflare/merch/mail.js`): `itemName` is one template, "<Product> with <the dog's name>" (+ a tee's colour and size), "with your dog" only for a line with no name (the order keeps the name only when it is printed, so a name-off tee line still says "your dog"; the sample's tee line had no name). Headings use a rounded sans stack (`HEAD_FONT`), not Georgia. Samples in `docs/design/merch/part6_shots/emails/` remade with the tee line named. Check: `merch_worker` row P9-mail-words.
