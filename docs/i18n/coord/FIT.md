# FIT AUDIT (v2.14): does every language fit?

The owner (via the Game Manager): "make sure all languages can fit in all the menus, windows, box, all sizes can be adjusted when needed."
Two suites measure it. They only measure: the layout and translation fixes are a later step, and these suites are how that step knows it is done.

| Suite | File | What |
|---|---|---|
| `i18n_fit` | `game/test_i18n_fit.js` | the game: 11 languages x 5 sizes, about 110 states per session |
| `site_fit` | `game/test_site_fit.js` | doodledoggo.app: 11 languages x 5 widths, 8 pages and their menus |
| (shared) | `game/fit_lib.js` | the in-page measurement (`MEASURE`), the red frame for screenshots (`HILITE`), the reports |

Both are in their own runner group `fit`, not in `all` or `phone` (they take a while).

## How to run

```
node game/run_tests.js i18n_fit --jobs 3          # the game, every language and size (about 41 min with --jobs 3 on 4 cores)
node game/run_tests.js site_fit --jobs 3          # the site (about 14 min with --jobs 3)
node game/run_tests.js fit --jobs 3               # both, one after the other only if --jobs is shared: prefer running them separately
PAW_LANGS=de,th PAW_FIT_SIZES=iphone15,small node game/run_tests.js i18n_fit     # a few languages and sizes
PAW_FIT_REPORT_ONLY=1 node game/run_tests.js i18n_fit                             # report mode: always passes
```

| Env | Meaning |
|---|---|
| `PAW_LANGS` | languages, comma separated (default: en + the 10 of `M.CODES` / the site's `I18N.LANGS`); the game also takes `xx`, `xx-cjk` |
| `PAW_FIT_SIZES` | game: `desktop, embed, iphone15, pixel7, small`; site: `1440, 1024, 768, 390, 360` |
| `PAW_FIT_REPORT_ONLY=1` | always pass (print and write the report); without it the suite FAILS while any finding remains or a screen could not be opened |
| `PAW_FIT_JOBS` | parallel browsers inside the suite (default: the runner's `--jobs`, passed as `PAW_JOBS`, else CPU cores - 1) |
| `PAW_FIT_SCREENS` | game only, debugging: only the steps / states whose name starts with one of these (`title,yard,journal`) |

Each game session runs in its own node process (`FIT_JOB=<lang>:<size> node game/test_i18n_fit.js` runs one by hand; its part lands in
`game/test_logs/i18n_fit_parts/<lang>_<size>.json` and `.log`). The site suite runs its pages in one browser, `PAW_FIT_JOBS` at a time.

## Output

- `game/test_logs/i18n_fit.json`, `site_fit.json`: every finding `{ lang, size, screen, kind, how, sel, text, key, num, sev, rect, states, screens, shot }`.
  `key` is the i18n key whose text is exactly the finding's text (static strings only), `states` the number of states it was seen in.
- `game/test_logs/i18n_fit.md`, `site_fit.md`: counts per language, per size, per language x size x kind; the worst 50, deduped by selector + kind across
  languages (with how many languages, sizes and screens share it); screens that could not be opened.
- `game/test_logs/fit_shots/`, `fit_shots_site/`: the 30 worst (one per selector + kind), the element framed in red with a label.
- The calibration run (all languages, report mode, 22 Oct 2026) is kept in `docs/i18n/coord/fit_report/`.

## Sizes

| Game size | Viewport | Why |
|---|---|---|
| `desktop` | 1280 x 720 | the computer layout; also the itch.io embed ("Viewport dimensions 1280 x 720", `brand/itch/description.md`) and the doodledoggo.app game box wider than 820 px (`site/js/site.js` draws the game at 1280 px and scales the frame, so the layout is this one) |
| `embed` | 684 x 716, touch, dpr 2 | the doodledoggo.app game box on a 768 px tablet (portrait iPad): below 820 px the box draws the game 1:1 and the game switches to its phone layout (`site_fit` prints the measured box size) |
| `iphone15` | 393 x 852, dpr 3 | |
| `pixel7` | 412 x 915, dpr 2.625 | |
| `small` | 360 x 640, dpr 2 | the smallest phone layout |

Site widths: 1440x900, 1024x800, 768x1024, 390x844 (iPhone 15, touch), 360x740 (touch). The phone rules (taps, font) apply to every game size but
`desktop`, and to the site at 390 and 360.

## What is measured

Game, per session: title, its language menu, adoption (shelter, naming, the three intro cards), Gerald's guide (every step), the yard and HUD (and the
expanded meters on phones), the Feed / Play / Care trays, the longest real toast and speech-bubble lines of the language (keys used with
`toast(tt(...))` / `say(tt(...))`), the phone ⋯ menu, Settings (top, scrolled, the language list), the wardrobe and its tabs, every journal tab, the
mailbox and its tabs and a letter, missions, the Dog Card settings, photo mode, training (both tabs), ball play, the town map and its confirm chip,
11 places and every place button that opens a window (shops and their tabs, the purchase window and the toast after buying, the vet and its gene card,
the café, the salon, the playdate board, the builder, Pip's cart ...), puppy playdates, the shelter playroom and list, the garden, the kitchen and
recipe book, Tokyo (the Station, the ticket window, the ride, the Japan map, the stamp book, Shibuya, Yoyogi with a visiting Dog Card, Asakusa), a
walk (the route picker, the first-walk how-to card, the running HUD, the pause card, results, the toasts back home) and, on a fresh device with
the cloud on but unreachable, the account screens (the title choice, log in, forgot password, make an account). Harness prefs: `gdTest`,
`tkTest`, `jpTest`, `exTest`.

Site, per session: home (with the game box: `/play/` is a stub, no `dist/itch` needed), /dogs and a dog pop-up, /map, /guide, /about, /privacy,
/reset, a 404; on each the header stuck (scrolled), the phone page menu and the language menu open.

Checks on visible elements (kinds):

| Kind | Check |
|---|---|
| `clip` | text cut by an overflow hidden/clip box (`own box`, `ancestor`), a truncating ellipsis or line clamp, a label-sized box that scrolls its text |
| `escape` | text outside its nearest bordered / backgrounded box (`box`) or the viewport (`viewport`) |
| `overlap` | two text-bearing elements (buttons, labels, chips, tabs, text, map pin names) crossing by more than 2 px both ways |
| `hscroll` | the page (or the game's `#stage`) scrolls sideways; names the outermost culprits |
| `tap` | phone layouts: a button, link, `[role=button]`, `[role=tab]` under 44 px either way |
| `font` | phone layouts: text under 15 px, captions under 13 px (captions: `small`, `.small`, `.stamp`, ... plus every selector the phone CSS itself sets to 13 px) |
| `crowd` | v2.14.1 (R12, game only): text closer than 10 px (CJK, Hangul, Thai) or 4 px (other scripts) to the pencil line its window draws (sheets, trays, the adopt card, buy windows, confirms, route cards, the guide's notes, shop items); the line is read from the window's own stretched frame svg |

`sev` is the size of the problem in CSS px (font: 3 x the missing px).

## False-positive rules

Every rule is written down in the header of `game/fit_lib.js` (R1 to R11) and none of them names a single finding. In short:
R1 only visible things (no svg/canvas art, no dev panel, no closed `<details>`, no screen-reader-only text); R2 text scrolled or panned fully
out of a scroll box or carousel is not shown, and a box meant to scroll may scroll; R2b a card cut sideways by a carousel is panned, not clipped;
R3 text under an opaque surface (the modal veil and sheet, the dock) is not seen (hit testing, with the crayon `::after` paper counted);
R4 absolutely placed elements are judged against their containing block chain; R5 overlaps across intentional layers (sheets, toasts, speech
bubbles, tips, the site header and dialog) are ignored; R6 glyph boxes, not font content boxes (Thai keeps its full box for its marks), and
small tolerances; R12 (crowd) skips text in nested framed cards and controls and text at a scroll fold; R7 inline links, disabled and hidden inputs are exempt from 44 px; R8 font sizes in CSS px before transforms; R9 hscroll
culprits; R10 one finding per element and kind per session; R11 small corner badges.

Known classes the rules do not filter (they show in English too, so read the English column first):
- a sheet's title or footer with no background over the scrolled body (Settings scrolled, the Dog Card settings footer): a real overlap, but not a
  language problem;
- the mailbox list truncates long letter titles with an ellipsis by design;
- the guide's ring around a target button pushes `#stage` a few px sideways at step 4 (`hscroll`, decor);
- the garden and kitchen modules keep their desktop sizes in the 684 px `embed` box (small taps and 11-14 px text there).

## Fixing with it

Fix, then run the language and size you touched (`PAW_LANGS=de PAW_FIT_SIZES=small node game/run_tests.js i18n_fit`), then everything. The fix step is
done when both suites pass without `PAW_FIT_REPORT_ONLY`.

## Calibration run (22 Oct 2026, `integration/v2.14` at 8058a1c, id still partly English, report mode)

Kept in `docs/i18n/coord/fit_report/` (`i18n_fit.md/.json`, `site_fit.md/.json`, `game_shots/`, `site_shots/`; shots as JPEG).
Counts are distinct findings per session (R10), so one cut label in the action bar counts once per language and size.

| Game | en | ja | zh-Hans | zh-Hant | ko | es | pt-BR | fr | de | th | id | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| findings | 72 | 115 | 78 | 79 | 85 | 84 | 85 | 91 | 89 | 109 | 72 | 959 |
| after the fit pass | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Per size: desktop 54, embed 653 (the kitchen and garden at 684 px: taps and text sizes), iphone15 65, pixel7 57, small 130.
Per kind: clip 162, escape 58, overlap 108, hscroll 45, tap 323, font 263. Runtime 41 min (`--jobs 3`, 4 cores).

| Site | en | ja | zh-Hans | zh-Hant | ko | es | pt-BR | fr | de | th | id | total |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| findings | 10 | 9 | 16 | 16 | 9 | 9 | 11 | 9 | 9 | 18 | 12 | 128 |
| after the fit pass | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 |

Per width: 1440 1, 1024 2, 768 1, 390 26, 360 98. Per kind: clip 8, escape 20, overlap 0, hscroll 1, tap 44, font 55. Runtime 14 min.

## After the fit pass (22 Oct 2026, strict runs)

The "after the fit pass" rows above: both suites pass without `PAW_FIT_REPORT_ONLY` (game 0, site 0, every screen reached). The final reports are
kept in `docs/i18n/coord/fit_report/final/` (`i18n_fit.md/.json`, `site_fit.md/.json`). The fixes are in the merges of `lane/v214-fit-{site,home,panels,mods,followup}`
(list: `V214.md` section 17, `CHANGELOG.md` v2.14). Rules added on the way: R2c, R2d, R2e (header of `game/fit_lib.js`).

Accepted exceptions (not findings, checked by eye):
- the first-walk how-to card scrolls at 360x640 in th and ja (sticky footer; English scrolled there before too);
- the Thai site's stuck tab strip scrolls sideways at 360 px on purpose (a shorter `nav.about` would avoid it);
- es "Dar de comer" and pt-BR "Guarda-roupa" don't fit the 49 px dock button, so Comida and Roupas stay.
