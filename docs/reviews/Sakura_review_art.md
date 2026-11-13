# Sakura Market: art review (13 Nov 2026)

Reviewer: paw-reviewer (read-only), branch claude/sakura-market at dbd81d89 (Sakura + v2.26-v2.29). 10 breeds (chihuahua, pug, frenchie, cavalier, dachs, corgi, golden, dane, bernese, afghan), adult + puppy, idle/sit/sleep/walk/eat, dry + wet; costumes with the Golden and Star Collars; item cards, props, homes; yard day/night 1280x720 + 360x640; market scene vs the Winter Market. Shots in the GM scratchpad (not kept).

## Must-fix
1. Blossoms across the set read as dark brown shapes, not pink/white flowers: the petals are too thin for their outline, so ink covers the fill. On dogs: Petal Crown (a dark thorny band), Haori and Bandana blossoms, Cardigan buttons, Blossom Garland, Sun Hat sprig. On cards: Petal Crown (a brown blob), Garland, Bandana, Haori, Cardigan, Petal Ball. dogs/pawart_dogs.js:2008 `skdBloom`, world/pawart_world_b.js:7013-7014 `skBloomP`/`skBloom` (`t=b+v*.62` gives ~2 px petals; line 1.6-2.2 on dogs, .5-.8x scale on cards). Fix: rounder petals (v*1.1-1.2, inner radius u .28 -> ~.45), line width tied to size (dogs w <= z*.18, cards lw <= r*.08). Target: the kennel/bed/tree blossoms, which read fine. Re-run fill_sweep OUTFITS=1 and connect_check.
2. The Paper Sakura Tree's start spot covers the mailbox post and letters badge (desktop and phone) and can take its taps. game/src/03_yard.js:967 `at: [196, 282, ...]`; mailbox box game/src/07b_mailbox.js:236-238. Move it clear (near the Felt Fir Tree x 540, or left of the front path).

## Nice to have
3. Sakura Paper Lanterns start spot (03_yard.js:966 [180,196]) strings across the house's right window and the clothesline shirt; put it along the fence like the Candy-Cane Fairy Lights ([620,258]).
4. Blossom Swing (world/pawart_world_b.js:7077): near-upright posts and thread-thin ropes read as a bar stool. A real A-frame, thicker ropes, bigger garland.
5. Squeaky Dango stick is wood tan #C9A07A (world/pawart_world_b.js:7136), reads as a wooden skewer; the design says a felt stick: felt green or cream.
6. Blossom Kennel item card is small (scale(.233), world/pawart_world_b.js:7261) next to the Gingerbread Kennel card; scale up.
7. Falling petals stay full daytime pink at night; give .fm-petal the night tint or lower opacity. A petal sits over the "s" of the "Homes" board (desktop and phone).
8. Sakura Pup Mochi lesson (game/src/00_core.js:54): say *cooked* sweet potato, and a steamed/blanched cabbage leaf.

## OK
9. Costumes keep their shape on all 10 breeds, adult and puppy, all 5 poses; nothing covers eyes or nose; Sun Hat brim in eat pose like the old Sun Hat; Wings under a sleeping chihuahua's ear hidden like the Bat Wings (not new).
10. Wet: drips and puddles over every costume; the warm-wear Cardigan still looks wet, as designed.
11. Golden and Star Collar with each costume: band and tag on the neck over body costumes; head-down shows the short band.
12. Homes: Blossom Kennel (roof, round windows, noren, branch; night glow consistent with the Gingerbread Kennel), Picnic Basket Bed, Paper Parasol Bed, Petal Nest: good, fills inside lines.
13. Market scene: layout, boards, homes stand, treats cart match the Winter Market's pencil style; petals stay inside the scene SVG, pointer-events none, hidden under prefers-reduced-motion. Small extra: the toys stall's upper half is bare next to the winter stars garland.
14. Food safety: Pup Mochi = sweet potato, beetroot, cabbage (no real mochi, no salted leaf); Hanami Rice Ball = plain rice + boneless plain salmon (no salt, soy, umeboshi); the tree is paper; two-sentence lessons (00_core.js:54-55).
