# v2.14 cross-lane notes (from lane reports)
## TOWN (lane/v214-town e3184af) — merged? see git log
- tests unconfirmed under load: re-run `smoke v2_town v2_journal v21_town v21_journal v24_shop v27_mailbox` on a quiet machine
- shared helpers: 05 shopTitle(k), shItemName(cat,n,id), shNameAny(n), shSlotName, shPerk(c); 14 townPlaceName/RouteName/RouteWord/RouteHint/townOrList; 14b townFamily(s); 07 jrTitleName(t); 11 pipFull(), gkCropName, gkRecipeName, gkSeason
- 03_yard lines ~450/805: use shopTitle not SHOP_NAME[k] (HOME); 00_core setHudDog: jrTitleName(S.title) (CORE); 13b owner display via townFamily (HOME); FAMILIES keys families.<id>.{name,where} (HOME)
- keys: food|toys|clothes|houses|beds.<tid(n)>.{n,note,tip,perk}, slot_name.<s>, treasures.<tid(n)>.{n,ab,txt}, tfood.<id>.{n,note}, rarity.<i>, jr_mile_txt.<n>, jr_grand.<i>, buff_txt.<id>, shop_name.<k>, town_families.<i>, npc_lines.<i>, gene_fb.<k>.<tid(field)>, crops.<id>.{name,seeditem,item}, recipes.<id>.{name,hint}, pantry.<id>.name, people_food.<id>.{name,why,swap}, crop_names.<id>, hm_decor.<tid(n)>.n
- mix-name chips (Coats tab) need a MODS A mixName display; info.personality (36 pers) display
- CORE: real tt must escape var values for _html keys; fmtC toLocaleString('en-US') → tnum; extractor must learn tt/tdata (literals inside tt are not hits; --en reads them)
- English changes: Oxford comma via Intl.ListFormat; "1 coin" singular
## FEATURES B (lane/v214-feat-b 1711ce9)
- tests unconfirmed under load: re-run `v29_photo v29_polish v29_pack v29_flows v27_pack v210_roam v210_ball v211_cards v211_tokyo v213_expr v29_review`
- photo font hook: 35_photo.js `phLangFontCSS()` stub after phNames, used in phCompose → CORE fills it
- DECISION: tlist English = no Oxford comma (en-GB list style) to keep English identical (told CORE)
- 29_pack_care crNames/crDogsN → tlist (FEAT A); PK_CAP_PLAY/WALK are {toString} objects
- HOME 03_yard:492 use tkLinePath(breed, place) for Tokyo lines (and Fuji Hill same issue, FEAT A); others use tkPlaceName(k) not PLACES[k].n
- TABLES.txt paths: dc_words_a, dc_words_b, dc_breed_words, ph_caps, ph_season_cap, ex_words, bl_lines, tk_care, tk_fortunes, tk_ueno, tk_hot_label, tk_stamp_n, tk_places, tk_station, tk_fb_hots, tk_lines, breed_pers, pers_def; hm_decor.<id>.n needs a name field
- 41_expressions keys use area `expressions.*`
## HOME (lane/v214-home b4018af, includes town + feat-b merges)
- tests unconfirmed: re-run `v2_slots v25_fixes_a` (+ phone suites) on a quiet machine
- helpers in 02_adoption: homePick, homeSx, homeName(n) (FOOD/TFOOD/TOYS/CLOTHES/HOUSES/BEDS/HM_DECOR .n), homeSig, adBreed, mixShown, placeName, homeFam, shopName
- calls PawGenes.mixName(mix) with {a,b,name}, falls back to mix.name; must return a string (MODS A)
- English join changes via tlist (Feed all toast, spot reqs) — check against CORE's no-Oxford-comma en
- extractor: add tt/tdata/tid/tbreed/tnum/tdate/tlist to deny calls; misses setAttribute('aria-label'), short strings, interjections
- TABLES.txt: `n` for food, tfood, toys, clothes, houses, beds, hm_decor; fallback_dogs.<key>.breed long names; paths ac_ch, wx_lines, bd_tips, eat/potty/greet/walk_lines, jokes, duck_lines, npc_jokes, junk, fav, starter_genes, spot_toast, spot_ord, sig, tricks
- coat/eye words on cards pass through as saved English (MODS A lookup not wired)
## PLAY (lane/v214-play 92d7df1, includes town)
- tests NOT verified: re-run `smoke v2_play v171_tricks v16 v16b v24_toys v24_missions v24_guide v17 phone_walk phone_v24_guide` (log was scratchpad/run1.log)
- helpers: tdPickLine(path, arr), playTrick, tCmd, tgGradeTxt
- drop SIG_COMBO from TABLES.txt (trick ids)
- rollTreasure result + bag entries get `label` (shown name); rarity/desc already translated → MODS B display label
- msDayLabel uses tdate weekday long/day/month short: English must stay "Monday 19 Oct" → CORE: English Intl locale en-GB for tdate and tlist
- wnLesson seasonal lesson (31_winter) keeps own English → FEAT A wrap
- paths: ms_pool.<id>.t|s, gd_steps.<k>.t|tp, gd_lessons.<k>_<icon>.2|3, tricks.<id>.n, sig.<dogkey>.n|say, tcmd, tg_miss, chi_alert, clues, mud, junk, npc_jokes
- PLAY run1: smoke v16 v16b v17 v24_toys v24_missions v24_guide PASS; v2_play (Focus timing) + v171_tricks (beat timing) FAIL under load → re-run quiet; phone_walk phone_v24_guide not run
## MODS A (lane/v214-mods-a)
- tests: re-run `v212_breeds v25_breeds` alone (watchdog under load)
- API: PawGenes.mixName(mix), mixLabel(en), coatLabel(coat, bodyBreedKey), breedLabel(key); PawKitchen.safetyText(id)
- GLUE TODO after merges: Coats tab (07 journal), predict rows, pedigree, pup/dog cards (HOME) must show coatLabel(...) and mixLabel(...) instead of stored English (TOWN + HOME left these English)
- key is mod.genes.mix_pattern (not genes.mix_pattern); TABLES.txt paths listed in its report: crops, recipes, pantry, people_food, extra_unsafe, crop_names, notes, buff_text, step_name, lines, breed_line, perk, perk_line, jokes, plant/water/harvest/fluff/guard_lines, wx_txt, stage_txt, season_name; genes words, merle_words, dapple_words, merle_by, tri_solid, breed_names, mix_list, pig_need, grand_recipes
- CORE: PawI18n should export tlist (modules use Intl.ListFormat(tlang()) now)
- English fix: Afghan garden {him} → sex select
## FEATURES A (lane/v214-feat-a)
- tests: v27_pack fails only on Oxford comma (clears with CORE en-GB tlist); re-run alone `cloud account v28_jp v28_japan v211_cards v29_pack v25_festival`
- helpers: fsIName(cat,n), hoName(n), jpLinePath(breed, place) → 'jp_place_lines.<breed>' or null; PLACE_LINES[breed].fujihill getter returns translated line
- GLUE TODO: HOME placeAmbient 03_yard ~492 use jpLinePath; 35_photo phDateLine reads FS_MONTHS directly → use tdata('fs_months.N'); multi-sentence toast joins with a space (spaceless languages: join message?)
- TABLES.txt: jp_place_lines (jpPlaceLines lowercase), hm_decor n field, fs_months
## MODS B (merged, lane/v214-mods-b)
- en.json dropped 6746→6441 keys after merge: the extractor must treat mods `LT(`, `LTD(`, `L(`, `LE(` as wrappers (toys LT ~488 calls, walkrun L/LE) — FIX FIRST in glue batch, then --en + pack
- TABLES.txt: WALK_LINES, HINT, HINT_NAME, ROUTE_NOTES, ROUTE_WX, ROUTE_NAME, OBS_LABEL (+tide_pool, duck, obs_label.cat), BADGE (index 1, badge.<cat>.1), TOYS_LINES (data.toys_lines.<breed>.<slot>.<i>)
- GLUE: 18_mod_walk_toys (PLAY) pass ctx.label (translated toy name) to PawToys.open; rollTreasure add rarityKey:'Common'… ; art aria: o.aria in dog()/dogHead(), aria/ariaMap on world calls (game may pass later)
- tests: re-run full `node dogs/check_identical.js v214-base` on a quiet machine (direct check: 1960 dog + 676 world renders, 0 diff)
