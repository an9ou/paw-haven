# v2.22 Town levels: phone layout and occlusion review (claude/player-levels @ 7b1157fb, read-only)

Built test page used read-only: /home/user/paw-haven-levels/game/test_merged.html (newer than every src/css/art file). Levels on with prefs ms2Test + lvTest (+ fwTest, ddTest, ffTest, tkTest, gdTest/pupTest for day 1).
DSF 1: 360x740, 390x844, iPhone 15 (393x659), desktop 1280x720; en and de (de lv/hb strings not translated yet, part F; expected).
Shots: /tmp/claude-0/-home-user-paw-haven/2bdd0121-7c30-5d17-94e4-4e89be11931f/scratchpad/lvphone/shots/ (below: SH/<name>.png). Measurements: SH/data_*.json. Scripts: lvphone/shots.js, supp.js, fresh2.js, bondrow.js.

Clean: no sideways scroll anywhere; no text under 13 px in the sheet, level card, star card, sticker page, Profile habits, shop sheets; #lvBtn is 44x44 with nothing on top at all 3 phone sizes (1 and 5 dogs); every OK / Yay! is 44 px and on top; the sheet at 1/7/13/20 and the 4x2 sticker page fit; Profile habits is one column at 15 px in en and de; shop lock chips "Level 14" fit their rows; map "Level N" tags fit the tag (text 28-34 px in a 100 px tag); desktop: the two Next tags, Gerald's card and the toasts never overlap (toasts start under #lvNext); night: the star reads fine (the HUD stays paper). Day 1 (3-month puppy): Gerald's guide comes first, the star turns 2 quietly, the first level card with Gerald's line shows right after the guide ends (SH/en_390x844_fresh2_e_first_card.png).

## Must-fix

1. **Toasts sit on the celebration cards (phones).** A queued toast lands under the card title (toastSheetTop, src/00_core.js:1363-1371) and covers the strip art and first line of the Town level card and the Bond 2 party card; with one-toast-at-a-time it can be a stale "Nope. Party Hat comes in at town level 5" from a shop closed 10+ s earlier, shown over a party. Same on the Mailbox title (the "New mail: Your pack's habits" toast).
   SH/en_360x740_40_bond2party_lvOk_3.png, SH/en_393x659_40_bond2party_luOk_1.png, SH/en_393x659_40_bond2party_lvOk_3.png, SH/en_360x740_60_L20_lvOk_1.png, SH/de_360x740_40_bond2party_luOk_1.png, SH/en_360x740_91_mail_letter.png.
   Fix: in toastNext (00_core.js:1323) keep phone toasts queued while `#modal .panel.celebrate` is open and release them on close (or place them above the sheet over the dimmed HUD only); drop queued `nope` toasts when the sheet or screen they came from closes.
   - **Status: fixed (00_core.js). Phones keep toasts queued while a `.panel.celebrate` is open (the live one is parked) and release them on close; `nope()` tags its screen and a closing sheet or a left mode drops its Nopes (live or queued). The Mailbox title case is not a celebration card: skipped (the toast sits under the title by design, toastSheetTop). Tests in phone_v222_levels.**
2. **Yard button still says "Garden (Bond 2)" / "Kitchen (Bond 3)" with levels on, and does not refresh on a level-up.** At level 2 on day 1 it still reads "Garden (Bond 2)" (grey) until the yard is re-entered. src/03_yard.js:559-560 (no lvOn branch; 3.3 lists the nope lines only).
   SH/en_360x740_01_yard_L1.png, SH/en_360x740_fresh_04_level2_during_guide.png, SH/en_desk_fresh_b_l2_guide.png.
   Fix: lvOn() ? tt('lv.garden_btn', 'Garden (level {n})', { n: wNeed('feat', 'garden', 2) }) (same for the kitchen); re-render the place buttons from the `lv:gain` handler (51_levels.js:393) when `up`.
   - **Status: fixed. `lv.garden_btn` / `lv.kitchen_btn` with lvOn, and `placeButtons()` on `lv:gain` with `up`. Test R.**
3. **Route card stamp "LOCKED: LEVEL 7" wraps at 360 with the "7" alone on line 2** (en and de) and at 390 it touches the art's right edge; "Locked: Bond 7" was one glyph shorter. css/04_view_scene.css:104 `.rt-lock`, text src/17_walk_route_carousel.js:13 (`lv.locked_stamp`).
   SH/en_360x740_20_routes_2.png, SH/de_360x740_20_routes_2.png, SH/en_390x844_20_routes_2.png.
   Fix: `white-space:nowrap; max-width:calc(100% - 24px)` and 20 px on phones, or the shorter stamp "Level 7" (the greyed art and the button already say locked).
   - **Status: fixed. `.rt-lock` nowrap with a max width, 20 px on phones. Test at 360 and 390.**
4. **The level-10 title "Friendly Neighbour" is cut on most phones with a pack.** As built C says name and title are whole at 390+, but the suite only uses "Town Know-it-all": with 5 dogs "Friendly Neighb…" at 390 and iPhone 15, "Friendly N…" and "Marsh…" at 360 (with 1 dog everything fits). #hudTitle in css/53_levels.css:37-38 (`.namewrap` 106 px at 390).
   SH/en_390x844_71_hud5_friendly_crop.png, SH/en_360x740_71_hud5_friendly_crop.png, SH/en_360x740_70_hud5_title_crop.png, SH/en_360_s_1dog_Marshmallow_FriendlyNeighbour_crop.png.
   Fix: let #hudTitle (row 2 of .namewrap) run under the pack chip (the chip is only as tall as the name line; give the title `margin-right:-48px` / its own grid row), or drop the title font to 14 px on phones; add "Friendly Neighbour" + a long name to phone_v222_levels.
   - **Status: fixed. With a title and a pack, `#hudTitle` runs on under the pack chip and the chip draws a smaller lifted circle (tap box 44 px). Whole at 360, 390 and the iPhone 15 with 5 dogs; added to phone_v222_levels.**

## Nice to have

5. Several levels at once: the card list runs past the card with no scroll cue and the "Next:" line is out of view (4 levels in de on the iPhone 15 shows 10 rows, then nothing). SH/de_393x659_50_L7_lvOk_1.png, SH/en_360x740_50_L7_lvOk_1.png. Fix: group by level like the sheet ("Level 4: a, b, c") or a bottom fade on the card body.
   - **Status: fixed. Several levels give one line a level (`lv.lu_group`).**
6. "Opened so far" has no disclosure marker (`display:flex` on summary drops it), so it reads as a heading. css/53_levels.css:63; SH/en_360x740_51_sheet_L7.png. Fix: a crayon chevron (::before) that turns on [open].
   - **Status: fixed. A turning marker (`summary::before`).**
7. Habits letter is one paragraph for the whole pack, a 5th dog is named but gets no line (hbMailLines slices 4, src/51b_habits.js:223), and on the iPhone 15 the long body squeezes the letter list to about 1.5 rows. src/51_levels.js:277. SH/en_393x659_92_mail_letter_end.png, SH/de_360x740_91_mail_letter.png. Fix: one paragraph per dog (white-space:pre-line or <p>), "and N more" past 4.
   - **Status: skipped (it changes the mail renderer's text format and the D5 letter test; for the translation batch / a later pass).**
8. Star card with 3 stickers says "A new sticker: Gold star, Bone and Tennis ball." `lv.st_got` needs an ICU plural (src/51_levels.js:479). SH/en_393x659_61_star_lvStOk_1.png.
   - **Status: fixed. `lv.st_got` is an ICU plural ("New stickers: ...").**
9. Map lock tags fit, but at the phone's 100 % zoom the white-on-pink "Level 7" has about 7 px cap height (same size as the old "Bond 5", so not a regression). SH/en_360x740_10_map_tag_zoom.png, SH/de_360x740_10_map_L1.png. Fix: a larger font in the tag art when the phone map is at 100 %.
   - **Status: skipped (art: the tag size is world art; the art review's CJK shrink went into world A / D, item 3 there).**
10. Desktop slim HUD (map): the star plus an empty 56 px track float alone mid-bar. SH/en_desk_20_map_L6.png. Fix: hide `.lv-track` in `#stage.slimhud`.
   - **Status: fixed. `#stage.slimhud #lvBtn .lv-track{display:none}`.**
11. Not v2.22 (pre-existing, noted while here): in German at 360 the Bond meter wraps ("Bindung 3" over its track) and the HUD grows to 118 px with or without the star (SH/de_360_bondrow_off.png vs SH/de_360_bondrow_on.png); a "Nope" toast from the map follows you onto the walk carousel and covers the card top (SH/en_360x740_20_routes_1.png).

   - **Status: the map Nope following onto the carousel: fixed with item 1 (tested). The German Bond meter wrap: skipped (pre-existing, not v2.22).**
## Fix batch (5 Nov 2026)

Commits b9471a50, fb073c68 and the itch_build follow-up on claude/player-levels (art fixes: 991b9965). Suites after the batch, one at a time, all green: v222_levels (254), phone_v222_levels (302), smoke, itch_build, v220_missions, phone_home, phone_shell, v2193_puppy, v216_first_week.
