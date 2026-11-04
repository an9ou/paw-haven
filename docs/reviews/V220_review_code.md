# v2.20 Missions v2: code review (paw-reviewer, 4 Nov 2026, tip a0ba0f3e)

2 must-fix, 8 nice-to-have. Status of each item is added by the fix batch.

## Must-fix
1. **i18n suite red**: `HM_DECOR 'Trophy Shelf'` (game/src/03_yard.js:960, art merge 148dbf53) came after the last extract: `data.hm_decor.trophy_shelf.n` / `.story` missing from en.json. Fix: `node tools/i18n_extract.js --en` + `node tools/i18n_pack.js`.
   Status: fixed in 889298fa (extract + pack after all text changes).
2. **Changed English, same keys**: `data.gd_lessons.missions_missions.2` and `.3` (game/src/25_guide.js:28) keep the old one-paragraph text in the 11 languages, and `i18n_todo.js` only lists empty keys. Fix: delete both keys from the 11 language files (or rename) so the translation batch picks them up.
   Status: fixed in 889298fa (both keys deleted from the 11 language files, i18n_todo lists them again).

## Nice-to-have
3. game/src/24c_badges.js:155-166 `msPagesSync`: `MSB.order` (and `MSB.card`, `MSB.medal`, `NB.pg`, `MS2.q`) survive `clApply` swapping S in place (22b_cloud.js:295: import, restore, cloud pull): wrong page remap, dropped/duplicated page gifts, a stray `msb_card` sticker. Fix: remember which S the caches belong to and reset them when S changes.
   Status: fixed in 889298fa (ms2Mine resets the queue, dots, MSB.order, NB.pg when S changes; test G3 through __pawCloud.apply).
4. game/src/24c_badges.js:105-121: `MSB.medal` is memory only; a reload before the yard is quiet loses the only Crayon Medal notice. Fix: a saved pending flag like `nb.pop`.
   Status: fixed in 889298fa (saved S.missions.mpop; test G2 reloads).
5. game/src/24_missions.js:132-137 `msSwap` ignores today's helps' `x` lists (h_trick with trick_show, h_photo with photo): one act ticks two rows. Fix: add the helps' `x` ids to the swap's exclusion list.
   Status: fixed in 889298fa (msSwapExcl adds the helps' x ids; test G1).
6. game/src/24c_badges.js:27 `msbPlaces` counts the festival pop-up `fmarket` (49_market.js:117): the Out and about crayon target and `w_places` gate move with festival windows. Fix: skip places with `PLACES[k].fm`.
   Status: fixed in 889298fa (msbPlaces skips PLACES[k].fm; test G1).
7. Calm rule: the `titleGive` toast + fanfare at gold, `ddPageGift`'s full-page toast, and the kaching in `nbFinish` / `msWeekFill` skip `ms2Say` / `msGuideBusy` (e.g. notebook page 1 finishing at the end of the first-day guide). Fix: quiet titles with an `ms2Say` line, hold sounds while the guide is busy.
   Status: fixed in 889298fa (titles written quietly and named in the one badge toast, ddPageGift through ms2Say / msbHush, sounds through ms2Sfx).
8. game/src/24e_notebook.js:166-170 `nbDecorGift`: no `emit('decor:new')` (cf. 07_treasure_journal.js:233); popup says "Arrange the yard" for a house decoration. Fix: emit, word by room.
   Status: fixed in 889298fa (emit decor:new, the day-14 popup names Arrange the house or the yard by room).
9. game/src/24d_week.js:225-229: a new Monday board does not call `msHudSync`, so the soft dot waits for the next HUD redraw. Fix: `msHudSync()` after `msWeekRoll`.
   Status: fixed in 889298fa (msHudSync after the Monday roll; test G2).
10. game/src/24b_missions2.js `ms2Backfill`: `life.bath`, `trick`, `fetch` backfill from `S.dd.wk` (wishes by kind, 48_dogdays.js:91), so old players' Squeaky clean, Trick practice and Fetch start near 0. Owner-facing note; follows the contract.
   Status: skipped: old saves have no real counters for baths, tricks or throws to backfill from; noted in V220.md section 8 as a known limit.

## Checked, no problems
S.v stays 1, additive fields; old, fresh and cloud saves load (guards for undefined/NaN); JST day and week keys right, no reroll on reload, one pouch a day; the board letter dedups by id and pays 50 raw via `mbGrant`; badges, helps, notebook, growing up pay no coins; `friend_yard` gated by FR_LIVE; act hooks match the contract; no duplicate top-level names; no streak/expiry wording; pouch treats are dog-safe FOOD rows; per-act work is small.

Tests: v220_missions 197, copy, v24_missions, v24_guide, v24_shop, v27_mailbox, v2192_rhythm, smoke pass; i18n fails (item 1); v24_toys and v217_dog_days not run (runner exit 144).
