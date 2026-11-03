# Cantonese (yue) translation plan

For the agents who translate Doodle Doggo into spoken Hong Kong Cantonese (v2.20, the 12th language). Owner's choice: spoken Cantonese in Traditional characters for everything players read; short buttons stay simple. Rules: `docs/i18n/yue.md` (style guide) and `game/i18n/glossary/yue.json` (breeds, terms, bans). Voice sample: `docs/i18n/yue_sample.md`. **Start only after the owner has approved the sample** (or after 5 minutes with no answer, with the sample as written).

## Source of meaning

- Translate from **English**: `game/i18n/en.json` (8,343 keys, about 51,000 words) and `site/i18n/en.json` (881 keys, about 5,800 words).
- `game/i18n/zh-Hant.json` and `site/i18n/zh-Hant.json` are a **reference only**, for item names already fixed and for joke ideas. They are written Mandarin with Taiwan words. Never convert them: write real spoken Cantonese (係, 唔, 嘅, 咗, 佢, 喺; HK words such as 狗糧, 提子, 朱古力, 衫, 撳). The check in step 4 below refuses converted text.
- `game/i18n/yue.json` and `site/i18n/yue.json` start as copies of zh-Hant (placeholders from the plumbing lane), so `tools/i18n_todo.js yue --next` sees nothing left to do. Use `tools/yue_chunks.js` for batches and progress: it keeps a ledger of translated keys per chunk.

## The chunks

Each chunk is a set of whole areas (the first two parts of a `data.*` or `mod.*` key, else the first part), grouped so a translator stays in one kind of text. `node tools/yue_chunks.js` checks that every key of en.json is in exactly one chunk (all 8,343 are) and writes `docs/i18n/coord/yue_chunks.json` (key → chunk). If en.json gains a new area, the script fails until the area is added to a chunk in `CHUNKS` there and in the table below.

| Chunk | What | Keys | Words | Share |
|---|---|---|---|---|
| 1 | UI, settings, account, journal, missions, care, tricks, shop, Dog Cards, photo, first week, diary, the yard | 1,672 | 8,939 | 17.5 % |
| 2 | Dog lines: jokes, greetings, meals, potty, signature tricks, personalities, toy play | 1,120 | 7,942 | 15.6 % |
| 3 | Gerald, letters and families, lessons and food safety, puppies, pack, genes and coats, vet | 1,802 | 8,128 | 16.0 % |
| 4 | Items and home: clothes, food, toys, decor, beds, houses, treasures, kitchen, garden | 1,552 | 9,004 | 17.7 % |
| 5 | Places, walks, weather, the runner, the town map, Training Ground, Splash Pool | 1,139 | 8,656 | 17.0 % |
| 6 | Japan trip and Tokyo, festivals and markets, Fun Fair, Friends, news | 1,058 | 8,286 | 16.3 % |
| 7 | The website: `site/i18n/en.json` (home, 35 dog profiles, map, guide, about, privacy, invite, reset) | 881 | 5,808 | site |
| | **Game total** | **8,343** | **50,955** | |

Words count each `{var}` or ICU block as one word and leave HTML tags out.

**Chunk 7: the website.** All of `site/i18n/en.json` except `_meta` and `_notes`: `common` 4, `nav` 7, `footer` 12, `lang` 2, `home` 88, `dogs` 10, `dog` 538 (the 35 dog profiles, 2,300 words: the biggest part), `card` 3, `profile` 9, `map` 66, `guide` 42, `about` 17, `privacy` 45, `invite` 6, `play` 23, `reset` 4, `soon` 3, `notfound` 2. Same spoken Cantonese as the game, the privacy page included (it keeps one line saying the English version wins if they differ). The dog profiles reuse the game's breed names, starter names and jokes from chunks 2 and 4, so chunk 7 goes last.

## Order and lanes

- **Chunk 1 first, alone.** It fixes the words players see most (bar buttons, tabs, toasts, shop and journal labels). The other chunks copy its choices. When it is done, add any new recurring word to the glossary (`terms`) and `yue.md` section 9 in the same commit.
- **Then chunks 2 to 6, two at a time** (owner's rule for big releases: at most 2 subagents at once): 2 + 4, then 3 + 5, then 6. Chunks touch different keys and different ledger files, so two lanes in one worktree do not collide; each lane commits only `game/i18n/yue.json` and its own `docs/i18n/coord/yue_done/<chunk>.txt`, and pulls before it merges a batch.
- **Chunk 7 last** (it reuses the game's words).
- Model: the top model for translation (the voice is the product); Sonnet (`paw-fixer`) for the checks, test runs and phone screenshots.
- Hand over to a fresh session at about 150k context (CLAUDE.md): the ledger says where to continue.

## The loop (one batch of about 120 keys)

1. `node tools/yue_chunks.js --next <chunk> --n 120 --out <scratch>/in.json`: the next keys of one area of the chunk, with their English. Read them; grep a key in `game/src` or `mods/` if it is unclear where it shows. For chunk 7 the keys come from `site/i18n/en.json`.
2. Write `<scratch>/out.json` = `{ "<key>": "<廣東話>" }` with the checklist of `yue.md` section 13. Read it back aloud once.
3. Game chunks: `node tools/i18n_todo.js yue --merge <scratch>/out.json --dry` (placeholders, ICU, tags, glossary bans; a `sex` select may be dropped). Site chunk: merge by hand into `site/i18n/yue.json` (same keys, nested as in en.json) and run `node game/test_i18n_node.js`.
4. `node tools/yue_chunks.js --leaks <scratch>/out.json`: the Mandarin and Taiwan-word check. Every `LEAK` must be fixed (it means converted text: 們, 他/她/它/牠, 沒有, 什麼, 這, 那, 不是, 吧, 嗎, 飼料, 存檔, 葡萄 …). `check` lines (的, 了, 是, 在) are read by hand: 的士, 了解, 實在 are fine, 我的 is not.
5. Merge: `node tools/i18n_todo.js yue --merge <scratch>/out.json` (game), then `node tools/yue_chunks.js --done <chunk> <scratch>/out.json` to record the keys.
6. Every ~800 keys: `git add game/i18n/yue.json docs/i18n/coord/yue_done/<chunk>.txt` (site: `site/i18n/yue.json`), commit `yue chunk <n>: <areas>` with the session's attribution lines. Do not push or deploy unless the coordinator says so.
7. Lines you are unsure of: append `TODO(native)` notes to `docs/i18n/yue.md` under a "Game, chunk <n>" (or "Site") heading at the end, one line each with the key.

Progress: `node tools/yue_chunks.js --stats` (done / total per chunk).

## Done when

- `--stats` shows every chunk complete; `node tools/yue_chunks.js --leaks game/i18n/yue.json` has no `LEAK` (the flat game table can be passed as a batch).
- `node tools/i18n_todo.js yue --merge game/i18n/yue.json --dry` is OK and `node game/test_i18n_node.js` is ALL OK.
- `PAW_LANGS=yue node game/run_tests.js i18n_smoke --jobs 1` passes; three phone-width screenshots (title, a shop, a walk) show no label overflowing (if one does, drop the particle, then shorten the word).
- Then, and only then, the Mandarin-leak patterns may be added to the glossary `bans` (yue.md section 14), so later updates are checked automatically.
- A native check by the owner's friends: `docs/i18n/yue.md` section 14 and every `TODO(native)` line.

## Area lists

The exact areas per chunk, as in `CHUNKS` in `tools/yue_chunks.js` (the source of truth; this list is a copy). Use them with `tools/i18n_todo.js yue --stats` for word counts per area.

**Chunk 1: UI, settings, account, journal, missions, care, tricks, shop, Dog Cards, photo, first week, diary, the yard.** Areas: `shell` `phone` `settings` `title` `core` `cloud` `reset` `guide` `journal` `missions` `adopt` `care` `bath` `train` `tricks` `wardrobe` `shop` `cards` `photo` `idle` `time` `expressions` `fw` `dd` `home` `shelter` `yard` `data.ac_ch` `data.acts` `data.meters` `data.badge` `data.hint` `data.hint_name` `data.rarity` `data.stage_txt` `data.step_name` `data.tcmd` `data.tpose` `data.tricks` `data.slot_name` `data.spot_ord` `data.ms_pool` `data.dc_breed_words` `data.dc_outfits` `data.dc_words_a` `data.dc_words_b` `data.ph_caps` `data.ph_season_cap` `data.ex_words` `data.buff_text` `data.buff_txt` `data.perk` `data.perk_line` `data.jr_grand` `data.jr_mile_txt` `data.wrong`

**Chunk 2: Dog lines: jokes, greetings, meals, potty, signature tricks, personalities, toy play.** Areas: `data.jokes` `data.greet_lines` `data.eat_lines` `data.potty_lines` `data.sig` `data.sig_fb` `data.breed_pers` `data.breed_line` `data.bl_lines` `data.lines` `data.pl_lines` `data.ag_lines` `data.toys_lines` `data.pers_def` `data.duck_lines` `data.fluff_lines` `data.guard_lines` `data.chi_alert` `data.harvest_lines` `data.plant_lines` `data.water_lines` `data.sr_lines` `data.sr_traits` `data.ho_lines` `data.npc_jokes` `data.npc_lines` `data.mud`

**Chunk 3: Gerald, letters and families, lessons and food safety, puppies, pack, genes and coats, vet.** Areas: `mail` `vet` `playdate` `puppies` `genes` `mod.genes` `pack` `packplay` `pupplay` `data.gene_fb` `data.loci` `data.merle_by` `data.merle_words` `data.dapple_words` `data.tri_solid` `data.pig_need` `data.words` `data.starter_genes` `data.breed_names` `data.mix_list` `data.fallback_dogs` `data.bd_tips` `data.gd_lessons` `data.gd_steps` `data.people_food` `data.people_fb` `data.extra_unsafe` `data.tfood` `data.notes` `data.families` `data.town_families` `data.npc_boys` `data.npc_girls`

**Chunk 4: Items and home: clothes, food, toys, decor, beds, houses, treasures, kitchen, garden.** Areas: `data.clothes` `data.food` `data.toys` `data.hm_decor` `data.beds` `data.houses` `data.treasures` `data.fav` `data.recipes` `data.recipes_fb` `data.grand_recipes` `data.crops` `data.crops_fb` `data.crop_names` `data.pantry` `data.pantry_fb` `data.junk` `data.shop_name` `mod.toys` `mod.kitchen` `mod.garden` `garden` `toys`

**Chunk 5: Places, walks, weather, the runner, the town map, Training Ground, Splash Pool.** Areas: `data.place_lines` `data.walk_lines` `data.wx_lines` `data.wx_txt` `data.weather_txt` `data.places` `data.smells` `data.clues` `data.route_hint` `data.route_name` `data.route_notes` `data.route_word` `data.route_wx` `data.routes` `data.obs_label` `data.tg_miss` `data.spot_toast` `walk` `mod.walk` `route` `map` `map215` `town` `agility` `pool` `ground` `tracks` `ball` `fetch` `roam`

**Chunk 6: Japan trip and Tokyo, festivals and markets, Fun Fair, Friends, news.** Areas: `tokyo` `japan` `data.tk_lines` `data.jp_place_lines` `data.tk_care` `data.tk_fb_hots` `data.tk_hot_label` `data.tk_places` `data.tk_stamp_n` `data.tk_station` `data.tk_ueno` `data.tk_fortunes` `data.jp_first` `data.jp_letter` `data.jp_mochi` `data.jp_place` `data.jp_toasts` `fest` `fm` `ff` `fr` `nw` `hw` `winter` `newyear` `popup` `data.fs_letters` `data.fs_months` `data.fs_season_line` `data.hw_cats` `data.hw_letter` `data.hw_plum` `data.wn_cats` `data.wn_letters` `data.ny_fortunes` `data.ny_zodiac` `data.season_name` `data.fr_notes`


## Ship gate: the owner's friend checks first (owner, 3 Nov 2026)

Cantonese does not ship (no main, site or itch) until the owner's friend, a native speaker, has checked it and the owner says go. The 5-minute rule does not apply to this gate. After all chunks are merged and green: the GitHub Pages test copy in 廣東話 (the owner shares its password), plus a review page with the most-seen lines where the friend can type a better wording per line; the Game Manager applies the fixes, re-runs the checks, then asks the owner. If the check isn't done by the 6 Nov Friends release, Friends ships without Cantonese and Cantonese follows as its own small update.

## The switch: YUE_LIVE (3 Nov 2026)

Cantonese rides on `main` (so the Pages test copy has it) but stays invisible on itch.io, doodledoggo.app and /play/ until the owner says go.

- **One constant:** `const YUE_LIVE = false;` in `game/i18n/msg.js` (the formatter both the game and the site tools load). `yueOn()` is true when YUE_LIVE is on, or `globalThis.__ddYueTest` is set (browser), or `DD_YUE_TEST=1` (node).
- **Off (now):** the game's picker (`PawI18nMsg.shown()`, used by `langListHTML` in `game/src/20_settings_dev.js`) lists 11 languages; `pickLang` never returns yue (zh-HK, zh-MO, yue, zh-yue -> zh-Hant); `live()` turns a saved `S.lang` 'yue', a pin or a `?lang=yue` link into zh-Hant (`i18nWanted` in `game/src/00b_i18n.js`, `guess()` in `game/i18n/loader.js`); the save keeps 'yue'. The site (`tools/site_i18n.js` `LANGS`, so also `tools/cf_site.js`) has no /yue/ pages, menu link, hreflang, invite shell, Worker route or yue font, and its first-visit script sends zh-HK to /zh-hant/.
- **The Pages test copy:** `tools/pages.js` adds `<script>window.__ddYueTest=1</script>` next to `__ddFrTest`, before the game scripts. `tools/itch.js` (`--itch`: itch.io and /play/) never gets it and fails the build if it leaks.
- **Tests:** the harness (`game/test_lib.js`) sets `window.__ddYueTest` for every suite, so the yue tests keep testing yue; `t.mk({ yue: false })` tests the hidden state (`i18n_smoke`, "YUE_LIVE off"). Node: `game/test_i18n_node.js` checks both states. The site suite tests the hidden state by default; `DD_YUE_TEST=1 PAW_LANGS=yue node game/run_tests.js site_fit` (and `DD_YUE_TEST=1 node tools/site_i18n.js` before `tools/i18n_fonts.js yue`) builds the site with Cantonese.

## Release (after the native check and the owner's go)

1. Apply the friend's fixes, re-run the checks of "Done when".
2. `game/i18n/msg.js`: `const YUE_LIVE = true;`.
3. `node tools/site_i18n.js` (the committed English pages now carry the 廣東話 menu link and hreflang zh-HK), `node tools/i18n_fonts.js yue && node tools/i18n_fonts.js yue --for game && node tools/i18n_pack.js` if any text changed.
4. A `NEWS` entry if wanted (`game/src/49c_news.js`: entries are for every language, so its keys need all 12 translations).
5. Tests: `i18n`, `i18n_smoke`, `smoke`, then `node game/build.js publish && node tools/itch.js` and `SITE_GAME=$PWD/dist/itch node game/run_tests.js site` (the site suite then runs its yue checks: /yue/ pages, zh-HK -> /yue/).
6. Merge to `main`, deploy the site (`bash tools/cf_pages_deploy.sh`) and push itch.io (`node tools/itch.js && bash tools/itch_push.sh <version>`); tell Marketing.
