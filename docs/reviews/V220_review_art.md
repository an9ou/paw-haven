# v2.20 Missions v2: art and style review (paw-reviewer, 4 Nov 2026, tip a0ba0f3e)

Screenshots: scratchpad review_art/ (not in the repo).

## Must-fix
1. game/src/13_more_dogs.js:75 `outfitOf(d)` leaves out `charm`, so `drawMedalCharm` never runs in game (yard dog, Wardrobe preview). Add `charm: d.outfit.charm` there and in any other outfit builder feeding `dogSVG` (`shSleepOutfit`). Only the medal draws, other charms stay identical.
   Status: fixed in 889298fa (charm in outfitOf and dogOutfit (shSleepOutfit goes through outfitOf); test G1).
2. The Trophy Shelf (`HM_DECOR`, game/src/03_yard.js:961) is never given. Give it at the first gold tier in `msTierCheck` with one quiet line (same as code review item: jrDecor + hmDecorRedraw).
   Status: fixed in 889298fa (given at the first gold cup with the badge toast line, quietly in the backfill (one letter line), hmDecorRedraw in the house).
3. Notebook page (game/css/27e_notebook.css:13): the 320x240 tile is drawn once with "meet"; spiral rings run through step text, margin line cuts text, ruled lines stop short; on phones bare bands top/bottom. Draw as a repeat-y CSS background at `background-size:100% auto` (or `xMinYMin slice`), pad text past x 68/320.
   Status: fixed in 889298fa (a repeat-y CSS background at the page width, text right of x 68, rows one ruled line tall).
4. Week notes (game/src/24d_week.js:188, `.msw-nart` 44x44): the 300x110 note art shrinks to a blank 44x16 strip; its colour is off by one from the row's HTML card. Draw `note(i)` as the row background (inset 0, `preserveAspectRatio="none"`, text inside `noteText`) and drop the HTML card colours.
   Status: fixed in 889298fa (note(i) stretched as the row, text inside noteText, the HTML card colours dropped).
5. Week header (`.msw-art`): the banner meant for the title (`boardText`) is empty with the h3 beside it. Overlay the h3 on the banner.
   Status: fixed in 889298fa (the h3 on the banner (boardText)).
6. Growing up chart (game/src/24f_grow.js:116): date labels come out 4-5 px tall. Pass `label: ''` (the list already gives the dates).
   Status: fixed in 889298fa (label '' always).

## Nice-to-have
7. `drawMedalCharm` in lying poses: in sleep (and down on long noses) the medal lands on the muzzle (golden sleep, dachs sleep). Sag toward the chest, or skip in sleep.
   Status: art lane (dogs/pawart_dogs.js), not this batch.
8. With the Red Bandana the medal hides the knot; over the Lion Mane it sits on the mane. Hang about +4 lower for bandana/scarf necks.
   Status: art lane, not this batch.
9. Ribbon colour: rainbow on the item card, plain pink on the dog. Two crayon stripes on the dog, or a pink card ribbon.
   Status: art lane, not this batch.
10. Shelf top row: bunting flags (y about 46.6) touch the top cups' rims (45.4). Lift about 3 units.
   Status: art lane (world/pawart_world_b.js), not this batch.
11. At 75 px crayon cups look paler than gold. A stronger rim or a small spark.
   Status: art lane, not this batch.

## Checked, fine
Fills inside outlines at 3x (shelf, cups, rosettes, medal, pouch, tabs, board, notes; page and chart pencil only); rosettes tell apart at 28 px; tabs at 24 px; shelf at 0/1/8/17 cups, gold/mixed/crayon, 150 and 75 px; style matches Friends art, Coat Collector Ribbon, item cards; medal on 20 breeds, 14 poses, puppies, wet, with sweaters, cape, raincoat, hoods, costumes (hidden under the Ghost Sheet); shelf in the house sits on the floor line, clear of lamp and counter; pouch, Badges rows, fallbacks and pill spacing at 390/360/desktop.

## Status (art lane, branch claude/missions-v2-art)
Status 7-11: done. 7: no medal in sleep or rollover (it would land on the face); in down, crouch and playdead it rests on the chest by the throat. 8: under a bandana it hangs +6, under a scarf or snood +4, clear of the knot; with the Lion Mane it hangs from the chin tuft to the mane's bottom edge. 9: on the dog the ribbon is two crayon straps (pink and blue) and the neck ribbon has two crayon stripes, echoing the card's rainbow ribbon (card unchanged). 10: bunting middle lifted 3 (flag tips 46.6 to 43.6), ends still tied under the crest. 11: crayon cups use brighter crayon colours, a rose rim line, a slightly heavier outline and a soft side shade. Renders without the medal byte-identical; world art identical apart from the shelf.
