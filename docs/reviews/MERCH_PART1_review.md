# Merch part 1: combined code and art review (merch/shop @ 8eef784, read-only)

Scope: `git diff ada2aca..8eef784` for merch/ and tools/merch_build.js, merch_render.js; the files as they stand. Docs and tools/merch_econ.js not reviewed.

Runs (24 Nov 2026, this container):
- `node tools/merch_build.js`: ART_VER `pp1-58a3b682` (no esbuild here, so no pawprint.min.js).
- `node merch/test_pawprint.js`: **63 checks, ALL OK** (Playwright present, so the 8 rendered checks ran).
- `node game/build.js && node game/harness.js merged && node merch/test_merch_game.js`: **5 checks, ALL OK** (483/483 renders equal the game's share-picture dog).
- `node tools/merch_render.js part1 merch/dist/part1 <scratch>`: 24 files, all `READY`. Mock-ups went to the scratch folder, not docs/.
- Extra renders through the real print page: 31 files (afghan, long dachs, merle tricolour collie, merle aussie, dalmatian, husky, bernese, cavalier, pom, chihuahua newborn/puppy/adult, mastiff puppy/adult, Dane with wizard and witch hats, astronaut helmet, akita sit, maltese, bichon, black lab on black and heather). Names tried: 20 W's, accents, one letter, name off.

## Verdict

The base is solid. Recipes redraw the game dog exactly. The patch really gives alpha of only 0 or 255 on coloured tees: I counted pixels on navy, black and Athletic Heather and found no partial alpha. The CSP and the hash parser are tight, and nothing from the hash reaches the DOM as text. Three things need fixing before part 3/4 connect orders to this page: art is cut flat at the art box, the page answers READY for a file that is wrong, and the name filter has easy bypasses. The Shiba happy-pose ear and cheek is known and not reported again.

## Must-fix

1. **The dog is cut with a straight edge at its 240 x 200 art box.** `merch/pawprint_core.js:379` (`nest` clips to the viewBox) and `:386` (`clampBB`).
   - Akita sitting (every outfit, 57 of 57 cases): the curled tail is sliced vertically, with no outline at x 750 on the tee and at the face edge on the mug.
   - Tall hats lose their tips at the top: Witch Hat, Wizard Hat, Wizard Robe & Star Hat, Party Hat on samoyed, dane, husky, dobie, pitbull, stdpoodle. The Astronaut Helmet is cut at the right edge on greyhound, dobie, corso.
   - Seen: extra renders through the print page, crops `merch_part1/01_akita_sit_tee_tail_cut_100pc.png` and `02_akita_sit_mug_tail_cut_50pc.png`. Scan: bbox of `dogSVG` for 40 breeds x 3 ages x 3 poses x 57 head/body items, 241 cases more than 2 units past the box.
   - The tests cannot catch it: they read the clamped `dogBox` (`test_pawprint.js:130`), and the white-tee check at `:241` only asks that ink stays inside the block.
   - Fix: on prints, nest with a viewBox grown to the unclamped bbox (plus the stroke), and place and scale by that box.

2. **The print page says READY for a wrong file.**
   - `pawprint_core.js:565-567`: `col`, `pose` and `n` fall back to white, stand and name on. `#p=..&prod=tee` alone renders a white-tee file with soft edges and no patch. RENDER_FREE.md's own Browser Run URL leaves out `col`.
   - `merch/print/v1/print.js:10-12` never checks the viewport. With 2000x900 at dpr 1 on a mug, the page gives `READY 2700x1050` but a 2000x900 PNG. With 2250x2700 at dpr 1 on a tee, it gives `READY 4500x5400` but a 2250x2700 PNG. (Playwright, `page.title()` and the screenshot's size.)
   - The title does not say what was drawn: no product, colour, pose or ART_VER.
   - Fix: require all five keys. Set ERR when `innerWidth*dpr != w` or `innerHeight*dpr != h`. Use a title such as `READY tee-navy-stand-n1 4500x5400 pp1-xxxx` and have the screenshotter compare it with the order.

3. **The name filter has easy bypasses.** `merch/names.js:35-39`.
   - `sq1` and `sq2` squeeze only runs of 3 or more, so doubled letters pass: "Fuuck", "Shiit", "Ffuucckk" and "Sshhiitt" are all accepted.
   - "xxx" and "XXX" are never refused, because both squeezed forms ("x", "xx") miss the WORD entry "xxx".
   - There are no words from the game's other Latin-script languages: "Puta", "Merde", "Scheisse", "Caralho", "Pendejo" and "Kontol" (Indonesian) all pass.
   - Phonetic forms "Phuck", "Fvck" and "Fuk" pass too (your call).
   - Seen: node loop over `nameOk` (list in this review's notes below).
   - Fix: also test the form with every run of 2 or more squeezed to 1. Compare WORD entries before squeezing. Add a short list per Latin-script game language (es, pt-BR, fr, de, id).

## Should-fix

4. **Ordinary names are refused** (`names.js:38-39`: the SUB words are matched anywhere in the name with its spaces taken out). The list leans toward Japanese romaji, which matters with this player base.
   - Refused: "Ashita", "Hoshi Taro", "Kashi Take", "Shitake", "Pussycat", "Scunthorpe", "Atwater", "Penistone", "Nazira", "Therapist", "Mishit", "Moby Dick".
   - Accepted correctly: Cookie, Dickens, Fanny, Cumin, Cockapoo, Hancock, Titus, Sussex.
   - Fix: match SUB inside single words only, keep the joined form for names written with spaces or dots between single letters ("f u c k"), and keep a small allow list (shiitake, shitake, ashita, pussycat, scunthorpe).

5. **The preview and the print can differ.**
   - The print page serves only the current build. ART_VER changes with any edit to `dogs/pawart_dogs.js`, for example the Shiba fix now on main. An order previewed on one build and rendered after a deploy prints a different dog.
   - ART_VER (`tools/merch_build.js:9-11`) does not hash `merch/print/v1/*` (the dpr and size logic), the build wrapper or the renderer.
   - Fix: add `&av=<ART_VER>` to the hash and set ERR when it does not match, keep each build at `/print/<ART_VER>/`, or render at checkout. Add print/v1 and the wrapper to the hash parts.

6. **A refused name is dropped quietly.** `pawprint_core.js:456` (`nameOf`): an order can arrive with no name.
   - The prototype merch page has its own rule, `replace(/[<>]/g,'').slice(0,20)` (`docs/design/merch/prototype/js/merch.js:186`), so buyers can preview "Łucja" or "Shitake", which the print then leaves out.
   - Fix: `print()` throws on a refused string name (like the other caller slips), and the merch page uses `PawPrint.nameOk` with its message.

7. **Small dogs print very small on the tee** ("Printed 10 x 10 in"). Drawn width:
   - adult 4.3-9.2 in (median 6.9)
   - puppy 3.0-5.9 in
   - newborn 2.0-3.7 in (newborn Yorkie 2.0 in, which Printful shrinks to 1.5 in on XS-M)

   On dark tees the patch stays 11 x 11 in, so a newborn is a small blob at the bottom of a big cream square (`03_newborn_on_black_tee_patch.png`, `07_tee_white_mockup_sizes.png`). The mug instead fills the face: the same newborn's art box is 270-300 mm there, against about 100 mm for an adult.
   - Fix: make the patch hug the drawn dog plus the name (`teeBody`, `:461`), set a minimum drawn size for the tee, and make the shop copy match.

8. **Long names on the mug go under the 0.5 mm line.**
   - Twenty wide letters shrink to 62 px (`print.last.name.size`). Caveat's strokes are then 5-6 px wide (about 0.42-0.5 mm; `04_mug_20_letter_name_300pc.png`).
   - `minLine` only checks strokes and never looks at the name's filled outlines, so PART1's "no stroke under 0.5 mm in any file" does not cover text.
   - Fix: keep mug letters at 75 px or more (shorten the name, or use a wider or two-line name box) and test the name's size.

9. **Stickers are off only by convention.** `printFromHash` and `printHash` still give `READY 1749x2481` for `prod=stickers` (`pawprint_core.js:563`). Fix: refuse `launch: false` products in `printFromHash`, with a test-only option.

10. **The tests can pass without testing.**
    - Without Playwright the run prints one "skip" line and ends "55 checks, ALL OK" with exit code 0 (`test_pawprint.js:223,275`).
    - `:190` checks nothing: `nameChars()` is `NAMES.CHARS` itself, and `textW` falls back to 300 for a missing glyph.
    - `thinnest()` uses the same method as `weight()` and ignores fills and the name.
    - Untested: a missing col, pose or n; a viewport mismatch; doubled letters; ART_VER changing per hashed part; art at the art-box edge.
    - Fix: exit 1, or print "SKIPPED 8", when Playwright is missing; check glyphs against `FONT.g`; add those cases.

11. **`merch/print_worker.mjs` and its test are stale. Do not build part 3/4 on them.**
    - The Worker uses the spike's `P.svg` instead of `P.print`, caps w and h at 3000 (so no tee), and defaults to `bg=strip`.
    - w and h are not checked, so `w=-5` throws `size` uncaught and the request fails with a 500.
    - It has no auth and no rate limit, and it renders with resvg instead of the Chromium print page.
    - The test needs miniflare and `pawprint.min.js`, which the build skips when esbuild is missing.
    - Fix: delete both, or mark them spike-only, and start part 4 from the Browser Run plus Durable Object path.

12. **Game art (for the Game Manager, like the Shiba):** in the tricolour Corgi happy pose, the black body fill shows with no outline at the neck and chest edge (`05_corgi_happy_neck_outline_gap_100pc.png`, from `merch/dist/part1/corgi_tee_navy.png` at x 2550-2950, y 1950-2400). At 10 in it reads as a missing line.

## Nice

13. **The patch's crayon edge has corners made of 2-3 straight cuts** of about 72 px each (`06_patch_corner_navy_200pc.png`). They read as crayon; add more points at the corners if a rounder card is wanted (`crayonCard`, `:445`).
14. **Name letters.**
    - "Ă" passes but "ă" does not (the font has no ă), and "ÿ" passes but "Ÿ" does not (`names.js:13`).
    - Polish, Czech, Turkish and Vietnamese names (Ł, Š, Ż, İ, ễ) are refused. Say why in the buyer's message.
    - A save name over 20 letters is cut mid-word ("Duke the Great Dane"). Show the cut name in the preview.
15. **The ground shadow is removed by a regex** written for the art's exact markup (`pawprint_core.js:374`), and the test looks for the same `ry="6"` form. If the art's shadow changes, it comes back on fabric unnoticed. Mark it in the art (a class) instead.
16. **A hand-edited link can print outfits the dog does not own** (the code-only Follower Star Bandana, Kind shop looks), sparkle, any eye colour or MM genes. MM draws like single merle, so nothing unkind shows. The order server should build the recipe from the save, not from the client's link.
17. **`tools/merch_render.js part1` saves files without checking for a READY title,** and its default mock-up folder is in docs/.

## Notes

- **Alpha.** Navy, black and Athletic Heather tees: only 0 or 255. For example, black_tee_navy has 13,671,208 pixels at 0 and 10,628,792 at 255. White tees: 0.6-1.4% of inked pixels are soft-edged, as intended.
- **Mug** (8 samples and 6 extras): dog and name stay inside 75/975 and 150/2550. An adult Dachshund touches 150 exactly. Both faces, centred names.
- **Name rendering** (20 letters, accents "Ñandú Çé Œuvre-ÿ", "J", name off): fine.
- **Art at 100%** (Golden with flower crown, cape, sneakers and sparkle; merle collie; Afghan; Dane with bat wings and hat; Samoyed and Maltese on white): fills stay inside their outlines, apart from item 12.
- **Determinism:** the same recipe gives a byte-identical SVG.
- **No double copy of the name rule inside PawPrint**: names.js is bundled. The only other copy is the prototype page's (item 6).
- **Name tries, refused:** fuck, F u c k, Fück, Sh1tzu, Pu55y, N4z1, Wh0re, B00b, "‎fuck", "fu­ck", Dıck, A55, Dic k.
- **Name tries, accepted:** Fuuck, Shiit, Ffuucckk, xxx, Phuck, Fvck, Fuk, Puta, Merde, Scheisse, Kontol, Caralho, Pendejo, Coon, Prick, Bastard, Slag.
