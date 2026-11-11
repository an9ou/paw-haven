---
name: paw-i18n
description: >-
  Translate new Doodle Doggo text into all 12 languages in one batch (en ja zh-Hans zh-Hant yue ko es pt-BR fr de th id):
  find the untranslated keys, follow each language's style guide and glossary, keep {placeholders} and ICU plurals, merge,
  rebuild packed.js and the game font subsets, do the site strings and fonts, and run the checks. Use after any release or
  feature adds or changes player-visible text (new tt() keys, a NEWS entry, a shop item, a new screen), or when a language
  shows English or tofu boxes.
---

# Paw i18n

Translate **once, in one batch, near the end of a feature or release** (owner's rule), never per commit. English is the source
(`game/i18n/en.json`, `site/i18n/en.json`); all strings go through `tt('key', 'English', {vars})` / `tdata`.
Overview: `docs/FILES.md` (Languages), `docs/i18n/FONTS.md`, `docs/i18n/coord/brief_translation.md` (the lane brief this recipe comes from).

## 1. Find what is missing

1. `node tools/i18n_extract.js --en` (after any `tt()` change; `--check` only compares). It rewrites `game/i18n/en.json`. The two
   "L() with a computed key" notes for `mods/` are known.
2. Per language: `node tools/i18n_todo.js <lang> --stats` (done / total per area; stale keys not in en.json are counted).
   Languages: `ja zh-Hans zh-Hant yue ko es pt-BR fr de th id`. All must say 100 %.
3. `node tools/i18n_todo.js <lang> --next 150 --out <scratchpad>/in.json` writes the next untranslated keys with their English
   (one area at a time; `--prefix nw.` picks an area). Scratch files go in your scratchpad, never the repo.

## 2. Translate (the rules that the merge enforces)

- Read the language's guide first: `docs/i18n/<lang>.md` (tone, register, gender, buttons, length, examples, TODO(native) notes)
  and its glossary `game/i18n/glossary/<lang>.json` (`breeds`, `terms`, `bans`, `allow`). Use the glossary names: Gerald is
  ジェラルド / 杰拉德 / 傑拉德 / 제럴드 / เจอรัลด์ / "Gerald, die Ente" etc.; Mrs. Plum, Pip, Dr. Paws, Baker Bea differ per language.
  Item names go through `tItem(n)` / `{vars}`, not hard-coded text.
- **yue is spoken Hong Kong Cantonese** in Traditional characters (嘅 咗 啲 唔 冇 喺 嚟 佢), written from the English meaning, never
  converted from zh-Hant (zh-Hant uses Taiwan wording). Guide: `docs/i18n/yue.md` (buttons 2-4 characters, no particles on buttons,
  你 not 您, no 粗口). zh-Hant is Taiwan wording, not converted from zh-Hans. ko uses `{name, josa, 이/가}` for particles after vars.
- Keep **every `{var}`**, `<b>`/`<i>` tags, `_html` tags and the ICU structure (`{n, plural, one {..} other {..}}`, `select`, `#`);
  translate only inside the branches. A `{sex, select, ...}` may be dropped in ja/zh/ko/th/yue (the only arg the merge lets you drop).
- Cozy, kind, short; the crude crayon dogs are the joke, keep the jokes landing, not word for word. Nothing bad ever happens.
  No emoji, no semicolons, never "breed" as a verb, no "stud", no "sell" about dogs, no franchise names. Care and food lessons stay
  exactly two short sentences. Buttons and tabs are short (phones are 360-393 px wide): de and fr use the short forms.
- `data.mix_list.*`: copy the English pun name unless the glossary gives a local one.
- Write `{ "key": "translation", ... }` to `<scratchpad>/out.json`, then
  `node tools/i18n_todo.js <lang> --merge <scratchpad>/out.json [--dry]`. The merge refuses the **whole batch** on an unknown key,
  parse error, mismatched vars/plural args/tags, a semicolon or emoji, or a glossary ban, and lists the reasons: fix and merge again.
  A good merge writes `game/i18n/<lang>.json` with the keys sorted. Do not hand-edit it out of order.
- 12 languages in parallel is fine for subagents (Sonnet `paw-fixer` for es pt-BR fr de id; top model for ja zh ko th yue). Each
  edits only its own `game/i18n/<lang>.json`.

## 3. Pack and fonts (the order matters)

1. fontTools once: `pip install --user fonttools brotli` (the first run also downloads pinned source fonts; needs network).
2. Game font subsets, only when ja, zh-Hans, zh-Hant, yue, ko or th text changed, **`--for game`**, in this order (yue reuses
   zh-Hant's subset, so zh-Hant first): `for l in ja zh-Hans zh-Hant yue ko th; do node tools/i18n_fonts.js $l --for game; done`.
   Output: `game/fonts/i18n/<lang>.woff2` + `.css`. Without `--for game` the tool rewrites the SITE fonts instead (the usual slip).
3. `node tools/i18n_pack.js` writes the generated `game/i18n/packed.js` (it reads the font CSS too). `--check` exits 1 when stale.
   Commit `packed.js` with the tables; on a merge conflict, regenerate it, never hand-merge.

## 4. The site (doodledoggo.app)

- Site strings: `site/i18n/en.json` (source) and `site/i18n/<lang>.json`; a missing key shows English. `node tools/site_i18n.js --report`
  lists missing/broken keys per language (all should be `complete`); plain `node tools/site_i18n.js` regenerates the English pages
  (committed); other languages are generated and git-ignored. `--check` exits 1 when the committed English pages are stale.
  Breed names come from the game glossaries. Translate by hand in the same style as the game (same guides).
- Site fonts (default target, no `--for`), after the site strings change:
  `for l in ja zh-Hans zh-Hant yue ko th; do node tools/i18n_fonts.js $l --title-keys "$(node tools/site_i18n.js --title-keys)"; done`.
  The site stays under its size budget (see the `paw-release` skill): check the subset sizes grew little.

## 5. Checks

Run one at a time, `NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors node game/run_tests.js <suite> --jobs 1`:

- `i18n` (node only: formatter, glossaries, bans, key parity, no emoji or semicolons) and `copy` (the English copy rules; reviewed
  exceptions in `game/i18n/COPY_OK.txt`).
- `PAW_LANGS=ja,de node game/run_tests.js i18n_smoke`: every screen has text, no `{var}` left, `html[lang]` right. Flaky on its
  reload check: rerun alone once. `PAW_I18N_PARTIAL=1` lists misses instead of failing.
- `site` (site pages, fonts, size budget) when the site changed.
- **Fit** for the long languages **de fr th ja yue** (and ko, zh when CJK changed): the `paw-fit` skill, e.g.
  `PAW_LANGS=de,fr,th,ja,yue PAW_FIT_SCREENS=nw node game/run_tests.js i18n_fit`. A long fit run is split by `PAW_LANGS` (2 h limit).
- Look at one new screen in ja, th and de at 360 x 640 (the `paw-fit` skill), since fonts and length are what break.
- Report: keys done per language, glossary words chosen, the number of new TODO(native) notes (add them to `docs/i18n/<lang>.md`).
