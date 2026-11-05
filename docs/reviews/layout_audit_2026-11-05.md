# Whole-game layout audit, 5 Nov 2026

Owner's ask: "make sure nothing is bugging, overlapping, wordings are not in centre, enough spacing of the windows and bubbles".
Audited: main @ 65d81d50, the built GitHub Pages test copy with Little Helps, Friends and the five new breeds on. Sizes: iPhone 15
(393x659 visible), 360 px phone, desktop 1280x720; English everywhere, de and ja on the busiest phone screens. Screenshots (DSF 1):
the session scratchpad `audit/<size>_<lang>_<name>.png` (177 files).

Clean everywhere: no console errors, no raw keys, no NaN, no sideways scroll; every phone tap target is at least 44 px (except the
26 px Settings checkboxes, which sit inside their labels).

## Must-fix

1. **Garden / Kitchen (iPhone 15):** the dog's speech bubble covers the Garden "Water" button and the Kitchen slots and "Empty";
   "Empty" and "Cook!" are also cut off at the bottom. (`.pg-bubble`, mods/garden.js:670; the kitchen bubble in mods/kitchen.js.)
   Shots ip15_en_80_garden, ip15_en_81_kitchen.
2. **Phone toasts:** 2-4 stack mid-screen, covering the dog, the `<` `>` arrows, the wish chip, the bottom of Gerald's first-day
   card, the walk How-to title, the walk result art and shop sheet content. (css/20_phone_shell.css:132-135, 28_guide.css:71.)
   Suggested: one toast at a time on phones. Shots ip15_en_50_place_pool/_training/_dogpark, 04_intro_3, 60_walk_howto, 60_walk_result, 50_place_market.
3. **Phone HUD:** an earned title runs under the "+N" pack chip and is clipped ("Town Know-it-al"). (css/20_phone_shell.css:67
   `#hudTitle max-width:160px` against `#hudPack`, line 32.) Shots ip15_en_50_place_pool, 50_place_station.
4. **Phone bar in German:** the last letter of "Pflege", "Gassi", "Karte" is clipped; English has the same tight metrics (a 21 px
   span in a 19 px box). (css/48_firstweek.css:51 overflow hidden + ellipsis.) Shot ip15_de_71_bar_crop.
5. **Desktop HUD with 5 dogs:** the meter row is crushed (icons hit the bars, values wedged between them), and toasts cover the
   "Next" pill. (css/03_hud.css:8-9.) Shots desk_en_70_hud_crop, desk_en_20_yard.
6. **Phone title screen (guest / Continue):** the tagline is not centred, "edition" alone on the left. (css/11_title.css:80
   centres it only for `.cover.choosing`.) Shot ip15_en_01b_title_guest.

## Nice to have

7. Walk result title off-centre (left-aligned in a box indented for the X). ip15_en_60_walk_result.
8. Walk run: the red "-3s" overlaps the pause button and runs off the right edge. ip15_en_60_walk_run.
9. The Care tray covers the place buttons; "games" peeks out at the right. ip15_en_21_care_tray.
10. Missions "Today" label wraps in a narrow column (4 lines in de). ip15_en/de_31_missions.
11. Japanese wish chip leaves one kana alone on line 2 ("…おひる / ね"). ip15_ja_20_yard.
12. Diary empty-state line left-aligned; the sheet title stays "Treasure Journal" on every tab. ip15_en_36_diary.
13. Kibble Corner puts "Go home" first; every other place puts it last. ip15_en_67_buywin.
14. Settings: two checkboxes share a cramped row. ip15_en_34_settings.
15. Phone Playdate Board squeezes two cards side by side. ip15_en_64_playdate_a.
16. Friends name picker repeats its heading in the body; OK is below the fold. ip15_en_30_friends.
17. Mailbox unread dots sit on the row border. ip15_en_37_mailbox.
18. Kitchen close X touches the Fridge pill. ip15_en_81_kitchen.
19. Phone "+N" chip overlaps the last dog chip by 6 px (deliberate negative margin; only matters with item 3).

Not covered: the Shinkansen ride and Japan map, puppies / nursery / birth, the buy window and Reset confirm, the desktop places tour,
de/ja walks and places, outfits, Winter Market, the level-up modal. Captured but not viewed: Bubble Pop, Agility, the Puppy
Predictor, What's new. The 360 px run got the automated check only (clean).

## Status

(Filled in by the fix batch.)
