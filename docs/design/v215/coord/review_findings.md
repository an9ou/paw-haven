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
