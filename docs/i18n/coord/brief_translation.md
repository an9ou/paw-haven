## v2.14 game translation brief (phase 2, V214.md 15), shared by the translation lanes
You translate the game's string table `game/i18n/en.json` (about 6,800 keys, about 45,000 English words) into ONE language: write `game/i18n/<code>.json` (codes exactly: ja, zh-Hans, zh-Hant, ko, es, pt-BR, fr, de, th, id). Read CLAUDE.md (loaded) and V214.md sections 3, 4.3, 7, 10 (skim the rest). Your rules: `docs/i18n/<code>.md` (register, tone, punctuation, word rules) and `game/i18n/glossary/<code>.json` (breed names and terms must match exactly; its `bans` are checked on every batch). The site's translation in `site/i18n/<code>.json` already uses many of the same words (places, items, dogs): reuse them so the site and the game agree.

**Setup:** `git fetch origin integration/v2.14 && git checkout -B lane/v214-t-<code> origin/integration/v2.14` (if the branch already exists on origin, you are a replacement: `git checkout -B lane/v214-t-<code> origin/lane/v214-t-<code>` and carry on from the stats). Edit only `game/i18n/<code>.json` and `docs/i18n/<code>.md` (TODO(native) notes). Never edit en.json, code, tools or other languages.

**The loop** (`tools/i18n_todo.js`; batch files go in your scratchpad, never in the repo):
1. `node tools/i18n_todo.js <code> --stats` shows what is left per area.
2. `node tools/i18n_todo.js <code> --next 120 --out <scratch>/in.json` gives the next keys of one area with their English. Read it.
3. Write `<scratch>/out.json` = `{ "<key>": "<translation>", ... }` for those keys, with your own language skill, carefully (read it back once). Then `node tools/i18n_todo.js <code> --merge <scratch>/out.json`. A batch with any problem is refused whole with the reasons: fix and merge again.
4. Every ~800 keys: `git add game/i18n/<code>.json && git commit -m "v2.14 <code>: <areas>" && git push -u origin lane/v214-t-<code>` (retry 4x with backoff on network errors). So a usage limit or a handover loses little.

**What the keys mean:** the key names the area and the thing (`walk.home_early`, `data.food.wild_berries.note`). If a line is unclear, grep the key (or the English) in `game/src` and `mods/` to see where it is shown. `_html` keys keep exactly the same tags. Keep every `{var}` and the ICU plural/select/josa structure: translate inside the branches, keep the arg names and `other`; add plural branches your language needs (plural categories from Intl.PluralRules). Dog names arrive as vars and are never translated; people's names (Gerald, Mrs. Plum, families) follow the glossary `terms`.

**Content rules (every language):**
- Cozy, kind, simple, playful; the deliberately crude crayon dogs are the joke: keep the jokes landing in your language, not word for word.
- Never "breed" as a verb, no "stud", no "litter price", never "sell" for dogs (shops selling items is fine), never "made in Japan" ("Japan-style" is fine), no franchise names, no emoji, no semicolons.
- The care and food-safety lessons (`data.food.*.tip`, `data.bd_tips.*`, kitchen unsafe notes, `data.gd_lessons.*`, seasonal care notes) stay short, kind and exactly two sentences (th: two clauses).
- UI words (buttons, tabs, chips, HUD) stay short: phones are 390 px wide. Prefer the shorter natural word.
- `data.mix_list.*` (mix names): every language copies the English pun name as-is (es, pt-BR, fr, de, id keep it; unless the glossary gives a local one). ja, zh-Hans, zh-Hant, ko, th translate only the well-known real mixes (Labradoodle, Maltipoo …): a value equal to the English makes the game show the `mod.genes.mix_pattern` form ("A × B") there. Anything else that must stay English (brand "Doodle Doggo", Paw Coins if your glossary keeps it) is written out in English, never left empty.
- zh-Hant is written in Taiwan wording, not converted from zh-Hans. ko uses the josa format for particles after vars (`{name, josa, 이/가}`).

**Done when:** `--stats` shows every key done; `node tools/i18n_todo.js <code> --merge game/i18n/<code>.json --dry` is OK; `node game/test_i18n_node.js` ALL OK; `PAW_LANGS=<code> node game/run_tests.js i18n_smoke --jobs 1` passes (misses empty, no `{var}` left, no long English runs). Look at three screens at phone width once (title, the shop, a walk) with a Playwright screenshot from the i18n_smoke harness and fix any label that obviously overflows by choosing a shorter word. Append the lines you are unsure of as `TODO(native)` under a "Game" heading in `docs/i18n/<code>.md`.

**Big-context rule (BUILDING.md rule 11):** if your context passes about 300k tokens with work left, commit and push, then send the Coordinator a handoff (5 lines: language, keys done/total, areas left) with send_message and stop. Your replacement continues from `--stats`.

**Report** (send_message to the Coordinator session given in your prompt, 15 lines at most): keys done, test results, your word choices for the 10 most visible UI terms, and the number of TODO(native) lines.
