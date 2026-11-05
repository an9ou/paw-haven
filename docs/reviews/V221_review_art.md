# v2.21 Five New Friends: art review (paw-reviewer, 5 Nov 2026, 1eee4fe2)

Screenshots: scratchpad review_breeds_art/ (not in the repo).

1. **Must-fix.** Bernese expecting: the fluffy tummy (`drawBelly`, `mix(s.col,'#FFFFFF',.22)`) is a flat grey oval on the black coat, like a stain. Fix: a new spec field (e.g. `bellyFl`) used in the `fl` branch only when set (old dogs byte-identical). expecting.png, outfits_zoom.png.
2. **Should-fix.** Aussie Black tricolour vs Bernese at chip size (44 px heads, 1x pack bar) read as the same dog; the Aussie rose ears are dark on a dark head. Fix: lighter, lifted Aussie ear with its own outline, shorter/thinner blaze. chips48.png, dk_chips_zoom.png, dk_yard_pack.png.
3. Nice-to-have: Dalmatian `dropD` ears white on white and small (earS .86): the head reads earless; a head-outline stub above the muzzle in the chip. Fix: a big dark spot or tip per ear, earS about 1.0. dbg_dal_ears.png, z5_dal_heads.png, z6_snouts.png.
4. Nice-to-have: Dalmatian head chip: the 6 DAL_H spots sit at the back of the skull; add 2 on cheek/forehead. dk_chips_zoom.png.
5. Nice-to-have: Cavalier Blenheim idle/walk/shake: a thin chestnut seam along the belly (`inEB` clamps the white at .95). Clamp at 1.0 while the body part is open, or lay the belly in neckCol. z7_cav_belly.png.
6. Nice-to-have: Aussie Red merle (+ copper): faint patches, copper vanishes on the red base. Darken red-merle patches, copper toward orange on merle. coats_b.png.

Same as the 35, no action: JRT tail flat on the ground in beg/dance/scratch (westie too); drop ears flip up in jump/shake (lab, golden too).

Checked, fine: all 29 poses adult/puppy/left-facing next to same-size breeds; newborns; 14 expressions; wet, sparkle; 15 outfits incl. the Crayon Medal; every coat of V221.md 3; 28 mix pairs both ways; Cavalier ears swing and stay on; connect_check 1820 + 17388 (outfits) 0 failures; fill_sweep FULL 536 renders 0 wet regressions, outfit sweep 966 0 regressions; in game (desktop, iPhone 15, gate on) shelter with 40 heads, yard pack, walks; no console errors.
