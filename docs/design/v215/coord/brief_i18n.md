# Brief: I18N batch (v2.15), lanes `i18n-a` and `i18n-b`, then `i18n-fit`

Read `v215_common.md` first (lane rules; use the Claude-Session line below, not the one there). Commit trailer session line: `Claude-Session: https://claude.ai/code/session_01QrEn8GuJzf6563HVWgovNg`.

## Step 1: translation (two lanes at once)
- `i18n-a`: ja, zh-Hans, zh-Hant, ko, th. Branch `lane/v215-i18n-a`.
- `i18n-b`: es, pt-BR, fr, de, id. Branch `lane/v215-i18n-b`.

Both from `origin/integration/v2.15`. All the v2.15 text is in `game/i18n/en.json` already (about 245 keys per language: areas `map215`, `ground`, `agility`, `pool`, `tracks`, `data.ag_lines`, `data.pl_lines`, plus new rows in `data.treasures`, `data.ms_pool`, `data.route_*`, `data.routes`, `data.clothes`; `node tools/i18n_todo.js <code> --stats` lists them).

Follow the v2.14 translation brief `docs/i18n/coord/brief_translation.md` exactly (the loop with `tools/i18n_todo.js --next / --merge`, the content rules, the style guide `docs/i18n/<code>.md`, the glossary `game/i18n/glossary/<code>.json`), with these changes:
- Edit only `game/i18n/<code>.json` for your five languages, `docs/i18n/<code>.md` (TODO(native) lines under a "v2.15" heading) and, for the new place names (Training Ground, Splash Pool, Market Street, Kibble Corner, Sunflower Lanes, Bamboo Grove, Seaside Cliffs and the other v2.15 places in `map215.*`), a `terms` entry in your glossary so later text agrees. Look at how each place is shown (`game/src/40_*`-`46_*`, `V215.md` sections 1-7) before naming it.
- Map captions are drawn under small buildings: keep place names short (V215.md 10). The care lessons (`pool.lesson*`, `agility` care notes, track care notes, `data.gd_lessons.*`) stay exactly two sentences (th: two clauses), kind and short.
- Commit and push after each language. Don't commit `game/i18n/packed.js`.
- Done when, for each of your languages: `--stats` shows 0 left, `--merge game/i18n/<code>.json --dry` OK. Then once: `node game/test_i18n_node.js` ALL OK and `flock /tmp/v215_test.lock node game/run_tests.js i18n --jobs 1` passes (tracked background task). No screenshots and no fit audits in this step.
- Report (15 lines): branch + head, keys per language, test results, the place names you chose (one line per language), number of TODO(native) lines.

## Step 2: fonts, pack and fit (one lane, after both are merged)
Branch `lane/v215-i18n-fit` from `origin/integration/v2.15`.
1. Game font subsets from the final tables: `node tools/i18n_fonts.js <lang> --for game` for ja, zh-Hans, zh-Hant, ko, th (see `docs/i18n/FONTS.md` 7 and commit 48fa26a for the exact flags used in v2.14), then `node tools/i18n_pack.js`. The site did not change in v2.15: leave `site/fonts/` alone unless `site_fit` says otherwise.
2. `flock /tmp/v215_test.lock node game/run_tests.js i18n_fit --jobs 2` (tracked background task; read `docs/i18n/coord/FIT.md` first: every rule counts, crowd R12 and the bubble rules included). Fix every finding until it reports 0: prefer a shorter translation; a CSS fix only under the v2.15 places' own selectors or `html[lang]`/`[data-layout="phone"]` rules, never changing an English render. Then `site_fit` the same way, to 0.
3. Then `i18n`, `i18n_smoke`, `i18n_phone` and `smoke`, one at a time.
4. Report (20 lines): head, font sizes before/after, fit findings fixed (by kind), suites and results.
