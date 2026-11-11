---
name: paw-fit
description: >-
  Check that a Doodle Doggo screen fits on phones and desktop in every language: run the fit audits (i18n_fit for the game,
  site_fit for doodledoggo.app, fit_lib.js rules), take and look at screenshots at 360x640 and 1280x720, and judge text inside
  cards, CJK and Thai not clipped, 44 px taps, nothing under the phone bar, fills inside outlines. Use after any UI, text or
  translation change, when adding a new screen or feature, or when the owner reports overlap, cut-off or tiny text.
---

# Paw fit

Owner's rule: every language fits every menu, window and box, at every size. Measuring is `game/fit_lib.js` (rules R1-R12 in its
header); the suites only measure. Full description: `docs/i18n/coord/FIT.md` (written for 11 languages; there are 12 now, yue included).
Phone rules (`PHONE.md`): taps at least 44 x 44 px, text at least 15 px (captions 13 px), no sideways scroll.

## Sizes and languages

| Game size (`PAW_FIT_SIZES`) | Viewport | Note |
|---|---|---|
| `desktop` | 1280 x 720 | computer layout, the itch.io embed and the site game box wider than 820 px |
| `embed` | 684 x 716, touch | the site game box on a tablet; phone layout |
| `iphone15` | 393 x 852, dpr 3 | |
| `pixel7` | 412 x 915 | |
| `small` | 360 x 640 | the smallest phone: the one that breaks first |

Site widths (`site_fit`): `1440, 1024, 768, 390, 360`. Languages: `PAW_LANGS=en,ja,zh-Hans,zh-Hant,yue,ko,es,pt-BR,fr,de,th,id`
(default all 12; `xx` and `xx-cjk` are pseudo-locales, about 40 % longer and CJK-shaped). The long ones to always try: **de fr th ja yue**.
Findings kinds: `clip`, `escape`, `overlap`, `hscroll`, `tap`, `font`, `crowd` (text too near its window's pencil line).

## Run it

Prefix: `NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors`. One runner at a time; `--jobs 3` at most.

- One screen, a few languages and sizes (fast, the normal loop):
  `PAW_LANGS=de,th,ja PAW_FIT_SIZES=small,desktop PAW_FIT_SCREENS=nw,wardrobe node game/run_tests.js i18n_fit --jobs 2`
  `PAW_FIT_SCREENS` takes step names or screen-name prefixes (`title,yard,journal`, `kind shop`, `nw`).
- Everything: `node game/run_tests.js i18n_fit --jobs 3` (about 40 min; split by `PAW_LANGS` to stay under the 2 h limit) and
  `node game/run_tests.js site_fit --jobs 3` (about 15 min, uses a stub `/play/`, needs no `dist/itch`).
- `PAW_FIT_REPORT_ONLY=1` always passes and only reports; without it any finding or unopened screen fails the suite.
- One session by hand: `FIT_JOB=de:small node game/test_i18n_fit.js` (after the harness exists, see below).
- Output: `game/test_logs/i18n_fit.md` / `.json` (worst 50, counts, the i18n `key` of each text), `fit_shots/` (the 30 worst, the
  element framed in red), `site_fit.*`, `fit_shots_site/`. Read the English column first: a finding that is also in `en` is not a translation problem.
- The accepted exceptions and false-positive classes are listed in FIT.md ("Known classes", "Accepted exceptions"); do not add a
  hard-coded exception for a finding, fix the layout or the (shorter) translation. Fix, then rerun the language and size you touched, then wider.

## Look at it yourself (always, the audits miss art and taste)

Needs `game/test_merged.html`: `node game/build.js && node game/harness.js merged` (a `run_tests.js smoke` also makes it). Write a
throwaway script in your scratchpad, based on `game/shots_uiux.js` and `test_lib.js`:

```js
// node <scratchpad>/look.js   (run from the repo root; NODE_PATH=$(npm root -g))
const { run } = require('/abs/path/to/game/test_lib');
run('look', async (t) => {
  for (const [lang, w, h, dev] of [['en', 360, 640, 'Pixel 7'], ['de', 360, 640, 'Pixel 7'], ['th', 360, 640, 'Pixel 7'], ['ja', 1280, 720, null]]) {
    await t.newGame({ lang, device: dev || undefined, sex: 'girl' }, { bond: { level: 10, pts: 3300 }, coins: 5000 });
    if (dev) await t.p.setViewportSize({ width: w, height: h });
    await t.home('yard');
    await t.ev(() => { const el = document.getElementById('toasts'); if (el) el.innerHTML = ''; window.__paw.nw.open(); });  // your screen: its __paw hook or its button; clear toasts so they do not cover it
    await t.sleep(600);
    await t.p.screenshot({ path: `/abs/scratchpad/${lang}_${w}.png` });   // then Read the PNG to look at it
  }
}, { timeout: 300000 });
```

Then `Read` each PNG (you see the image). Check, at 360 x 640 first, then 393 x 852 and 1280 x 720:

1. Text sits **inside its card**, nothing leaves the pencil frame, no line touches the frame or a ruled line.
2. **CJK, Thai and Korean are not clipped**: no cut tops of Thai marks, no half lines, the right font (no tofu boxes, no mixed faces).
3. Every button and tab is a comfortable **44 px** target (the audit's `tap` kind), labels not truncated with an ellipsis (de/fr compounds).
4. **Nothing hides under the phone bar** (Care / Walk / Map / More) or the HUD, and the sheet scrolls to its last button.
5. Art: **colour fills stay inside their outlines** (owner's rule for all art); crayon look kept. Dogs: `node dogs/fill_sweep.js`.
6. Night and rain also (`time`, `weather` options of `T`), and a long dog name (12 letters) in the HUD and on the card.

## Add a feature's screen to the audit

Add a `step` to `game/test_i18n_fit.js` next to the others (before `journal`, near `nw` or `kind shop`). It runs once per language and
size. Keep it small: open the screen through its `window.__paw.<hook>`, wait, `measure(name)`, tabs with `eachTab`, then `closeAll()`.

```js
await step('myfeature', async () => {                       // v2.xx My feature (NN_myfeature.js)
  if (!(await ev(() => !!(window.__paw.mf && window.__paw.mf.on())))) return;   // skip while its gate is off
  await ev(() => window.__paw.mf.open()); await modalUp(); await measure('myfeature');
  await eachTab('myfeature', '#modal .panel.mf [role=tab]', 6);                 // one measure per tab
  await jsClick('#mfConfirm'); await waitSel('.mf-confirm'); await measure('myfeature: confirm');
  await closeAll();
}, 30000);                                                                       // optional timeout in ms
```

Helpers in scope there: `ev`, `measure`, `jsClick`, `waitSel`, `modalUp`, `eachTab`, `closeAll`, `sleep`, `has`, `atPlace(k)`, `phone`, `t`.
A feature that needs a `prefs.xxTest` flag gets it in the `t.mk({ prefs })` line near the top of `worker()`. Failures to open a
screen are reported as "screens not opened" (they fail the suite), so keep selectors exact. Run it with `PAW_FIT_SCREENS=myfeature`.
The site has no step list: add a page to `PAGES` in `game/test_site_fit.js`.

## Report findings

Per finding: screen, language, size, kind, the text and its `key`, the selector, and the screenshot path; say whether English has it
too. Group by cause (one long compound, one fixed-height box). Fix order: shorten the translation or add a phone short form, then
the CSS (`html[data-layout="phone"]` rules only for phones). Final line: counts before and after, suites run, screens looked at.
