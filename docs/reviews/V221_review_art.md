# v2.21 Five New Friends: art review (paw-reviewer, 5 Nov 2026, 1eee4fe2)

Screenshots: scratchpad review_breeds_art/ (not in the repo).

1. **Must-fix.** Bernese expecting: the fluffy tummy (`drawBelly`, `mix(s.col,'#FFFFFF',.22)`) is a flat grey oval on the black coat, like a stain. Fix: a new spec field (e.g. `bellyFl`) used in the `fl` branch only when set (old dogs byte-identical). expecting.png, outfits_zoom.png.
   Status (art fix): fixed. New spec field `bellyFl` (bernese only): the bulge is a coat-coloured tummy under the body with a tufty ink line and three pale fur ticks; the fill is the tufty line closed over the oval, so it stays inside its line. Other fluffy dogs keep the `fl` branch byte for byte.
2. **Should-fix.** Aussie Black tricolour vs Bernese at chip size (44 px heads, 1x pack bar) read as the same dog; the Aussie rose ears are dark on a dark head. Fix: lighter, lifted Aussie ear with its own outline, shorter/thinner blaze. chips48.png, dk_chips_zoom.png, dk_yard_pack.png.
   Status (art fix): fixed. New ear `EARS_A.roseA` (lifted triangle, top third folded forward), earS .9, a pale crayon rim inside the ear (`earFn: aussieEar`), the ear a lighter grey on a black head (`aussieCoat`; merle and red keep the dark ear), and the blaze short and thin (from -.68 hy, .12-.22 hx wide). The chip now reads grey pointed ears, copper muzzle, no wide blaze.
3. Nice-to-have: Dalmatian `dropD` ears white on white and small (earS .86): the head reads earless; a head-outline stub above the muzzle in the chip. Fix: a big dark spot or tip per ear, earS about 1.0. dbg_dal_ears.png, z5_dal_heads.png, z6_snouts.png.
   Status (art fix): fixed. earS 1, a big dark spot over each ear tip and a small one by the crease (puppy: the tip), pinned inside the ear; the stub was the head outline's crayon gap, now closed by the new spec field `headShut` (dalmatian heads only, mixes with its head too).
4. Nice-to-have: Dalmatian head chip: the 6 DAL_H spots sit at the back of the skull; add 2 on cheek/forehead. dk_chips_zoom.png.
   Status (art fix): fixed. DAL_H gets a cheek spot (puppies too: 4 head spots) and a forehead spot (adults: 8).
5. Nice-to-have: Cavalier Blenheim idle/walk/shake: a thin chestnut seam along the belly (`inEB` clamps the white at .95). Clamp at 1.0 while the body part is open, or lay the belly in neckCol. z7_cav_belly.png.
   Status (art fix, claude/new-breeds-artfix): fixed. Blenheim and Tricolour get the new spec field `bodyShut` (the body outline drawn closed, no crayon gap where the chestnut ground showed) and the white runs out to the ink (`inEB` clamp 1.1, pinned by the open part; .95 only when expecting, where the part is closed). The closed outline moved the crayon jitter, so `cavalier dirty` (expr surprised) floated in v213_neck: NECKFIX `cavalier.dirty [0,0]` added.
6. Nice-to-have: Aussie Red merle (+ copper): faint patches, copper vanishes on the red base. Darken red-merle patches, copper toward orange on merle. coats_b.png.
   Status (art fix): fixed in `mods/genes.js` SHADES, aussie rows only (lines 492-498): mliver/mlivercu dark #9A4E2A -> #6A2E14, copper mblackcu #D8742C, mlivercu #E2701E, mbluecu #DC843A, mlilaccu #E0945A.

Same as the 35, no action: JRT tail flat on the ground in beg/dance/scratch (westie too); drop ears flip up in jump/shake (lab, golden too).

Checked, fine: all 29 poses adult/puppy/left-facing next to same-size breeds; newborns; 14 expressions; wet, sparkle; 15 outfits incl. the Crayon Medal; every coat of V221.md 3; 28 mix pairs both ways; Cavalier ears swing and stay on; connect_check 1820 + 17388 (outfits) 0 failures; fill_sweep FULL 536 renders 0 wet regressions, outfit sweep 966 0 regressions; in game (desktop, iPhone 15, gate on) shelter with 40 heads, yard pack, walks; no console errors.

Art fix checks (claude/new-breeds-artfix): v221_dogs 212483 passed; connect_check five 1820 + outfits 17388, 0 failures; suites smoke, v221_breeds, v213_expr, v213_neck (1370), v2183_connect PASS; `SKIP=<the five> check_identical origin/claude/new-breeds` 418495 renders, 0 differ (the 35 untouched; with the five 14020 renders differ, all of them a new key's render or mix).
