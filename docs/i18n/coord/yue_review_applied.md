# Cantonese (yue): the native check, applied (9 Nov 2026)

The owner's friend, a native Hong Kong speaker, answered every row of the review page (claude.ai artifact `H4jmY9E7bACCwDscp43CYG`, database collection `answers`, doc id = the i18n key, site keys prefixed `site:`). Branch `claude/yue-review`. **YUE_LIVE stays `false`**: Cantonese goes live only on the owner's go.

## Counts

| | Rows | ok | change |
|---|---|---|---|
| Game (`game/i18n/yue.json`) | 441 | 391 | 50 |
| Site (`site/i18n/yue.json`) | 39 | 39 | 0 |
| **All** | **480** | **430** | **50** |

No answer has a comment, so every general rule below was inferred from the changes themselves (the same word changed in several rows, or a question about a word that comes back elsewhere).

- **Friend's lines applied:** 50 game keys. "Mochi" mapped back to `{name}` / `{n}` / `{dog}` / `{pup}`, the sample numbers back to `{coins}` / `{n}` / `#`, `［家庭］` to `{family}`, `<b>{name}</b>` kept in `title.start_over_body_html`; every ICU plural and select kept.
- **Sweeps:** 15 rules, 30 more keys in the game and 11 in the site (41 keys). In all, 80 game keys and 11 site keys changed.
- Merged with `tools/i18n_todo.js yue --merge` (placeholders, ICU, tags, glossary bans: OK), checked with `tools/yue_chunks.js --leaks` (full game table: 0 leaks), `game/test_i18n_node.js` ALL OK.

## Sweeps (rules now in `docs/i18n/yue.md` section 15 and `game/i18n/glossary/yue.json`)

| # | Rule | From the friend's row(s) | Also changed |
|---|---|---|---|
| 1 | a save = **存檔** (save code 存檔碼, Reset save 刪除存檔); 進度 stays only for progress | `cloud.code_not_ours`, `cloud.export_code`, `cloud.import_code`, `cloud.paste_code`, `settings.reset*` | game `cloud.artifact_note`, `cloud.backups_none`, `cloud.code_broken`, `cloud.code_broken_copy`, `cloud.code_loaded`, `cloud.code_no_dog`, `cloud.load_save`, `cloud.reason_guest`, `cloud.reg_lead`, `cloud.save_code`, `cloud.your_code`; site `privacy.short`, `privacy.collect.save`, `privacy.where.text`, `privacy.choices.export`, `privacy.delete`. 存檔 removed from the Taiwan-word list (yue.md 10, 11; `tools/yue_chunks.js` LEAKS). Unchanged progress lines: `dd.tr_*`, `shell.bond_progress`, `walk.progress`, `agility.trick_bonus`, `tricks.fade_lure`, `town.notice_reward_html`. |
| 2 | ENCORE = **Encore** / encore, not 安哥 | `mod.toys.encore`, `mail.card_8` | `mod.toys.encore_2` |
| 3 | Vampire Cape = **吸血鬼披風** | `data.clothes.vampire_cape.n` | `data.dc_outfits.29` |
| 4 | cranberry = **蔓越莓** | `data.food.turkey_cranberry_bites.n` | its `.note` and `.tip` |
| 5 | baked plain = **齋焗** | `data.food.snowflake_oat_cookies.tip` | `data.food.baked_pumpkin_wedges.tip`, `sweet_potato_bones.tip`, `sweet_potato_coins.tip` |
| 6 | Snuffle Mat = **聞嗅墊** | `data.toys.snuffle_mat.n` | `data.toys.snuffle_mat.note` (索索： → 聞嗅：). 索 = sniff stays in 基因索索機, 索索搵寶, 索索儀. |
| 7 | couch potato = **電視精** | `data.fallback_dogs.greyhound.personality` | site `dog.greyhound.personality`, `dog.greyhound.trait2` (were 梳化懶蟲) |
| 8 | show-off = **show off**, not 騷包 | `data.sig.spitz.n` (the question asked if 騷包 is fine for children) | game `data.fallback_dogs.spitz.personality`; site `dog.spitz.personality`, `dog.spitz.trait1` |
| 9 | bring / carry = **拎**, not 擰 | `mail.card_10` | `data.breed_pers.aussie.ask.1`, `data.toys_lines.aussie.fetchdeliver.0`, `data.toys_lines.jrt.fetchdeliver.1`, site `dog.aussie.play`. 擰轉頭, 擰起頭, 扭扭擰擰 unchanged. |
| 10 | "Boing, boing" = **彈下，彈下** | `data.sig.bichon.say` | `data.ag_lines.bichon`, `data.potty_lines.bichon` (彈彈彈, 彈彈跳 unchanged) |
| 11 | a horse is **一隻** | `data.sig.minpin.say` | site `dog.minpin.play` |
| 12 | Play = **去玩** | `data.acts.play.1` (the bar button) | `yard.play` (the Play tray and toy cards), `journal.play` |
| 13 | the Puppy Playdates heading = **BB狗Gathering** | `playdate.puppy_playdates` | `yard.puppy_playdates` (same English). In sentences it stays 狗BB玩伴聚會. |
| 14 | no 依法 joke | `mail.nb_plum_text` | `bath.is_legally_obliged_to_look`: 依法一定要 → 照規矩一定要 |
| 15 | the mail carrier's left foot | `mail.card_6` (左腳鞋 → 左腳) | `mail.nb_carrier_text` (吠我隻左腳鞋 → 吠我隻左腳), its twin joke |

One-off changes (no sweep, the word does not come back): 迎新週, 是日禮物, 看門狗, Gary, 大聲叫, 順滑一撥, 攤到好低, Show Off緊, Hand Hand！, 趴低搖尾, 瞓到反肚, 新年裝飾, 頭罩, 第二代混種, N歲狗, 閂, 狗吠, 凌厲, 唔夠錢, 搵經理投訴, 借嚟吖, 坐下, 頭暈腳軟, 已經夠, 無事, 真嘅農場, 其實都係, 都冇變過.

## Unclear answers: my calls (for the owner to overrule)

1. **Play button 去玩 vs the owner's 一齊玩 (3 Nov).** The friend changed the bar button `data.acts.play.1` to 去玩. Applied, and swept to the Play tray (`yard.play`) and the journal's Play button (`journal.play`) so the button and the tray it opens match. To keep the owner's choice instead: put those three keys back to 一齊玩.
2. **`journal.mixes_count`:** the friend typed only 第二代混種, not the whole line. Applied as the grand-mix word inside the ICU branch: `{g, plural, other {#種第二代混種}}`.
3. **`settings.barking`:** the friend wrote 狗吠 without the colon; I kept the colon (狗吠：), as in every language, since the Normal / Fewer / Off buttons follow it.
4. **`playdate.puppy_playdates` = BB狗Gathering:** English mixed in, and BB狗 instead of 狗BB. Applied to both headings with this English; the friend kept 狗BB玩伴聚會 in running text (`site:home.intro` OK), so sentences (`journal.no_pups`, `vet.board_intro`, `yard.puppy_playdates_are_almost_ready`) and the site heading `home.feat.playdates.title` keep 狗BB玩伴聚會.
5. **`mail.card_6`:** 郵差嘅左腳鞋 → 郵差嘅左腳 (the left shoe becomes the left foot). Applied as written and to its twin `mail.nb_carrier_text`. If the friend only meant to tidy the wording, 郵差隻左腳鞋 keeps the shoe.
6. **`vet.painter_broke`:** 金幣唔夠 → 唔夠錢 in this line only. The friend marked `town.salon_broke` and `town.cafe_broke` (金幣唔夠) OK, so the other "Not enough coins" lines stay.
7. **`data.ag_lines.husky`:** 穿柱 → 柱 in the husky's joke. The agility label `agility.ob_weave` (穿柱, not on the review page) stays.
8. **`data.npc_jokes.1`:** 加利 → Gary. Only Gary; the other townspeople keep their Cantonese names.
9. **`bath.is_legally_obliged_to_look`** (not on the page): 依法 dropped as in `mail.nb_plum_text`, but the joke needs the "rule", so 照規矩.
10. **Site `dog.greyhound.*`** used 梳化懶蟲, not the 梳化薯仔 the friend changed; made 電視精 too so the game and the site say the same.

## Not strings

- The friend raised nothing about fonts or layout (no comments on any row).
- Font: Iansui has no glyph for 嘣 (the Jack Russell's "boing", 3 lines: `data.breed_pers.jrt.ask.0`, `data.sig.jrt.say`, `data.tk_lines.jrt.asakusa`); it falls back to the next font. Existing text, not from this review. Fine to leave, or write 嘭 if the look matters.
- Fonts rebuilt: game `yue.woff2` 267 glyphs (90.7 KB), site `yue.woff2` 433 glyphs (145.6 KB); `game/i18n/packed.js` repacked.
- `tools/yue_chunks.js`: the chunk table predates v2.20-v2.23 (549 en.json keys in areas it doesn't list, e.g. `ms2w`), which made `--leaks` exit before checking. The leak check now runs before the chunk map (it never needed it). The chunk table itself is not updated; it's only needed for new translation batches.

## Going live (not done here)

- `game/i18n/msg.js` line 49: `const YUE_LIVE = false;` → `true`. Nothing else in the game changes: the picker (`PawI18nMsg.shown()`), `pickLang` (zh-HK, zh-MO, yue -> yue) and saved `S.lang 'yue'` follow `yueOn()`.
- Site: `node tools/site_i18n.js` (adds /yue/ pages, the 廣東話 menu link and hreflang zh-HK to every page, and the zh-HK first-visit redirect to /yue/); `tools/cf_site.js` then routes /yue/ and ships the yue font supplement; `bash tools/cf_pages_deploy.sh`.
- Tests that change with the switch: `game/test_i18n_node.js` takes the "on" branch (`shown()` is all 12); `i18n_smoke` skips its "YUE_LIVE off: Cantonese is hidden" section; the `site` suite drops "no /yue/ pages, link, hreflang or font" and checks instead the /yue/ 404 in Cantonese, the /yue redirect, /yue/ starting `/play/?lang=yue` and zh-HK / zh-Hant-HK / yue-HK -> /yue/; `itch_build` still requires no `__ddYueTest` flag (unchanged). Run `i18n`, `i18n_smoke`, `smoke`, then `node game/build.js publish && node tools/itch.js` and `SITE_GAME=$PWD/dist/itch node game/run_tests.js site`.
- A `NEWS` entry (`game/src/49c_news.js`) if wanted: all 12 translations.
- Marketing: "12 languages" already on this branch in `docs/marketing/KOFI_INTRO.md` (2), `TAPTAP_INTRO.md` (2, zh and en), `YOUTUBE.md` (2, with 廣東話 added to the list) and `README.md` (4). Brief Marketing only once the owner sets the date. The same texts still say 35 breeds (the game has 40): not changed here.
