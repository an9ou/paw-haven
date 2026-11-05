# v2.22 art and style review: PawArt.LEVELS (claude/player-levels, 424f6e72 + parts C/D/G)

Scope: star / card / sheet / habit / sticker, in the game at 390 px (iPhone 12) and desktop 1280, day and night, plus a stricter fill sweep.
Images are in /tmp/claude-0/-home-user-paw-haven/2bdd0121-7c30-5d17-94e4-4e89be11931f/scratchpad/lvart/ (named below) and ../lv/art/.

## Must fix (0)

None. Every colour fill stays inside its own line, and nothing clashes with the crude-dog joke enough to block the release.

## Should fix (ranked)

1. **Two-digit numbers crowd the star at 34 px** (phone `.lv-n` 15 px). The number is centred exactly (measured dx 0, dy 0.1 px at both 34 and 36 px), but "20" is 13.8 px wide against about 17 px of plain middle, so "1x"/"20" touch the inner dips of the outline. Levels 10-20 are half the range.
   Image: hud_ph_stack.png, ../lv/art/stars_zoom.png. Fix: in `lvStar` (world/pawart_world_b.js), raise the inner radius 12.9 -> 14 (fatter middle), or in css/53_levels.css give two-digit numbers `font-size:13.5px;letter-spacing:-.4px` on the phone (a `.d2` class from 51_levels.js).
   Status: fixed (art). Star inner radius 12.9 -> 14.2, tips 18.9 -> 19.1, less wobble: "20" clears the dips at 34 px (../lv/art/stars_zoom_v2.png, v2/hud_ph390_night_L20.png). No CSS change.
2. **The habit "face" (Best face) reads as a bearded human emoji.** The 2.6 lower-lip stroke and the mouth's bottom outline merge with the chin line into a beard. It is the only habit icon that is not dog-like.
   Image: big_icons.png (row 2, 2nd). Fix: in `LV_HB.face`, end the mouth higher (bottom point 51 -> 46) with a thinner lip (w 1.6), and add two floppy ears and a nose dot (the sticker 7 shapes, smaller) so it reads as a dog's grin.
   Status: fixed (art). LV_HB.face is now a crude dog: two odd floppy ears, odd eyes, a tan patch, a big nose, a 1.6 "w" mouth ending at 43 and a small tongue (big_icons.png, v2/profile_desk.png).
3. **The map "Level N" tag may overflow in CJK.** It is the same pink pill as the "Bond N" chip (RC 86x30, Caveat 26, white), and in English it fits: "Level 18" is 59 px in the 86 px pill (map_desk_day.png, map_ph390_night.png). But the old chip was always English, while `lvChip` goes through `tt`, and i18n_fit (V222 7.1 F) does not list the map. "レベル 18" set at 26 px is about 100 px.
   Fix: in world/pawart_world_a.js:933 and _d.js:1280, shrink the tag text the way the place label already does (`s.length>8 ? Math.round(26*8/s.length) : 26`), or add the map tags to i18n_fit.
   - **Status: fixed (world/pawart_world_a.js and _d.js): a level tag wider than the pill shrinks its text by a width estimate (CJK counts wide), at least 14 px; off keeps "Bond N" at 26.**
4. **The energy icon's motion lines touch the card edge.** The lines start at x 1-2 of the 64 grid, so on desktop Journal > Profile they sit on the habits card's left border.
   Image: profile_desk.png. Fix: in `LV_HB.energy`, move the lines to start at x 6 (and the paw 2 units right).
   Status: fixed (art). Motion lines start at x 6-8, paw moved 2 units right (v2/profile_desk.png).
5. **The spot cushion's red X runs over the cushion's top ink line.** It is a free mark, not a fill, but it is colour across an outline (strict sweep: strict_habit_spot.png). Fix: lift the X to y 5-19 so it sits clear above the cushion.
   Status: fixed (art). The X sits at y 4-17, clear above the cushion line (strict_habit_spot.png).
6. **In the pack icon, the second paw (#F6E4C8) nearly vanishes on the cream cards at 32 px.**
   Image: profile_ph390.png, ../lv/profile_habits_phone.png ("With other dogs"). Fix: use C.peach or '#E8C597' for that paw.
   Status: fixed (art). Second paw is '#E8C597' (v2/profile_ph390.png).
7. **The Level sheet header's dotted path is too faint at phone width.** At about 0.9 px the climb from town to the star flag is lost and the middle of the strip looks empty (../lv/art/game_phone_sheet.png). Fix: in `lvSheet`, set the path stroke to 2.4 in '#A88566' and add 1-2 more paw prints along it.
   Status: fixed (art). Path stroke 2.4 in '#A88566', dashes 3.4/3.8, two more paw prints on the hill (../lv/art/contact_2x_v2.png).
8. **The level-up card strip sits tight on the text below it** (about 7 px), where the Bond card's sparkle row has more air (lvcard_ph390.png, lvcard_desk.png). Fix: give `.lv-lu .lv-strip` a bottom margin of 8 px (CSS).
   - **Status: fixed (css/53_levels.css: `.lv-lu .lv-cardart{margin-bottom:8px}`).**
9. **(Optional) The sticker 7 "Doggy face" is a neat, cute puppy, the only dog in this art set.** The HUD mood-ring face is a precedent, so it is not a break. A lopsided, crude crayon face (uneven ears and eyes) would land the joke on the sticker page.
   Image: big_icons.png (row 2, 3rd).

   Status: done lightly (art). Sticker 7 is lopsided now: one ear up, one flopped and darker, eyes 2 vs 3.1, tilted head and tongue.

## Checked and fine

- **Star:** it reads at 34 and 36 px. The HUD stays on paper at night, so night does not change its contrast. On the dark test strip the cream disc still frames it. The arc is clear and the level 20 crown is not clipped (hud_ph_stack.png, hudfull_desk_night.png).
- **Habit icons:** they share the PawArt.MISSIONS builder, weights and ink. Ask, sleep and ball reuse the ICONS shapes. The locked rows grey out cleanly (profile_desk.png). The Bond card habit box fits (bondcard_ph390.png).
- **Stickers:** they read as die-cut stickers (white edge plus soft shadow) and sit well on the sticker page and the star card (../lv/sheet20_phone.png, ../lv/card_star_phone.png).
- **Card and sheet strips:** they use the map's house palette and centre in their cards at 360 and 600.
- **Fill sweep:** the sweep in ../lv/sweep.js is clean. My stricter sweep (strict.js, which also counts coloured strokes) is clean too, apart from intended free marks: the star's track ring, the pet-icon motion ticks and the cushion X.

## Out of lane (for the phone review)

- **Level-up card at 390:** the "Next: Level 3: Mt. Fuji Lookout + the Saturday ..." line is cut at the right edge (lvcard_ph390.png).
- **Toasts:** they cover the card strip (../lv/art/game_phone_levelcard.png).
   - **Status: fixed with the phone review's item 1.**

   - **Status: fixed. With the stall gone the line is shorter; `.lv-lunext` also gets room for the hand font's last stroke and wraps any long line; phone_v222_levels checks it is whole inside the card.**
## Fix batch (5 Nov 2026)

Commits b9471a50, fb073c68 and the itch_build follow-up on claude/player-levels (art fixes: 991b9965). Suites after the batch, one at a time, all green: v222_levels (254), phone_v222_levels (302), smoke, itch_build, v220_missions, phone_home, phone_shell, v2193_puppy, v216_first_week.
