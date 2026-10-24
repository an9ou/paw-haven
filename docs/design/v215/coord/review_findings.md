# v2.15 combined review findings (24 Oct 2026, on 8e4be22)

## Reviewer 1: code + phone
Phone passes everywhere tested (390x844, 360x640, en/de/ja; map, yard, Kibble Corner, Training Ground, Splash Pool, 3 tracks, 3 storefronts); off-switch = v2.14; tt keys in all 11 tables; economy fine.
1. SHOULD: 45_pool.js:93-101 plVestOn writes the vest into the real save (saveNow mid-paddle keeps "body":"Doggy Life Vest", old outfit lost). Fix: PL_WORN back in the saveNow replacer (00_core.js:744) or a draw-only override in outfitOf(d), never touch d.outfit.
2. SHOULD: 37_roam.js:172 place change keeps r.lift, r.grIn, r.grSpot, r.grHid (dog floats 17.5 after the pause table). rmPause drops the queue before `free` (43_ground.js:246), grIn stays set. Fix: reset lift/grIn/grSpot + grHide(d,false) at line 172 and in rmPause.
3. SHOULD: 44_agility.js:21 AG_LOW includes 'jump': puppies and seniors run through the full-height bar; welfare text promises "a bar on the ground". Fix: a low/ground-bar art state in world G switched by A.low (art), or drop 'jump' from AG_LOW.
4. SHOULD: #bowlG in grOn places other than the yard sits at (205,462), not depth-sorted; overlaps the pool sun lounger (shot scratchpad/shots/rv1_desk_bowl_pool.png). Fix: a 'bowl' spot per FLOOR place + #bowlG in grDepth like the yard (no-go box to match).
5. NIT: 00_core.js:236 Bamboo Ring text "+1 coin per return" vs TR_RING_TOY coin 3 ("Floats, 3 coins"). Make the text match (re-translate the key in 10 languages).
6. NIT: phone storefronts (Boutique, Kibble Corner): home crop cuts the door hot spot, pan chip on the dev button (R390_en_boutique.png). Centre the crop on the door.
7. NIT: phone map: place/time pill covers the "Doodle Doggo Town" banner (R390_en_map.png).
Notes: phGndLayers '' for 1600-wide scenes (cosmetic; accept viewBox `0 0 grW 600`); V215.md 8.3 still lists pool paddle as a roaming act (update contract). Not checked: PACK_SPOTS cafe [930,466].

## Coordinator
8. i18n_fit PLACES lists only the 11 v2.14 places: add Training Ground, Splash Pool, the track windows (and storefronts) and run them to 0.

## Reviewer 2: art (check_identical 0 differ; style, seasons, night, rain, Halloween, New Year pass in all 23 FLOOR scenes + map)
9. SHOULD: world G :1461 pool hard box [334,392,758,136] smaller than the drawn pool (coping to y 538, shade 545; feet allowed from 536): dogs stand on the coping over the water. Fix: [316,386,794,160], re-check paddle and ramp spots (shots art/game/act_summer_pool_paddle1.png, c_pool.png, d_pool.png).
10. SHOULD: 44_agility.js:93-103 #agBoard sits above the night/weather tint: daytime-bright on a snowy night. Fix: draw it inside #sceneG under the tint, or an o.agBest option so world G draws the rosettes (x_training_night_board.png).
11. SHOULD (= 3): puppy course shows only the raised bar (world G :822 jumpBar(...,40)); when A.low hide it and draw a pole on the ground (data-low variant) (act_summer_ag_pup1/2.png).
12. SHOULD: 40_dogcards.js:260 #dcVis goes before #pack, but v2.15 floor props live in #pack: visitors in front of props draw behind them. Fix: each visitor into #pack with data-fy = v.y.
13. NIT (= 4): #bowlG outside the yard: wrap as a gr-prop on the FLOOR 'bowl' spot (training has 1440,556) (x_feed_pool.png, x_feed_training.png).
14. NIT: 14_town_places.js:139 kite at fixed x 650 in #fx, off screen on the 1600-wide hilltop: offset by grCam().x.
15. NIT: world G :252 isLeafy recolour turns bamboo olive in autumn and grey-white in snow: keep culms and leaves green, only grass changes (art/png/sheet_bamboo.png).
16. NIT (size): world C source 252 -> 400 KB, world A 186 -> 231 KB in the first load (only F and G are lazy); winter all-flags renders: map 845 KB (old 449), square 553 (cap 560), woods 536. Fix idea: move the A/C v215 blocks into the g chunk.
17. NIT: desktop place buttons cover the cafe dog bed (PACK_SPOTS cafe [930,466]) (a_cafe.png).
Screenshot folders: scratchpad/art/game/, scratchpad/art/png/, scratchpad/shots/ (scratchpad = /tmp/claude-0/-home-user-paw-haven/834db3c8-472e-5975-b3a8-1dd86c39be20/scratchpad).

## Fix batch split
- FIX-CODE (paw-fixer): 1, 2, 5, 6, 7, 8, 12, 14, V215.md 8.3 note.
- FIX-ART (paw-artist): 9, 10, 3/11, 4/13, 15, 17. Item 16 is not in this batch (a chunking refactor; listed in the as-built notes and the report).
