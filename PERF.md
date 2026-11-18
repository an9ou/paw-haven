# PERF: fast first load, small downloads (v2.14 PERF lane)

Branch `lane/v214-perf` from `integration/v2.14` (`ba9112b`), 22 Oct 2026. The owner wants a fast first load, small downloads and smooth play on phones and desktops before the launch. The game behaves the same; old saves load; the test harness is unchanged (every language inline, nothing minified) unless a run asks for `--minified`.

## 1. How it was measured

`NODE_PATH=$(npm root -g) node tools/perf_measure.js <folder> --runs 5 --lang en,ja --net fast,slow4g`

- The folder is served over local HTTP **gzipped** (as GitHub Pages, itch.io and the Cloudflare Worker serve it), no cache between runs.
- Chromium with the Playwright **Pixel 7** profile, **4x CPU throttle** (CDP `Emulation.setCPUThrottlingRate`).
- Networks: **fast** = no throttling; **slow 4G** = 1.6 Mbps down, 750 kbps up, 150 ms latency.
- **#tNew** = time from navigation to the title's New game button existing (the first screen a player can use). **FCP** = first contentful paint. **KB** = bytes on the wire (gzipped), including the language file and its font when there is one.
- `en` = an English browser (`en-US`), `ja` = a Japanese one (`ja`): the game picks the language from the browser on a first visit.
- Google Fonts is faked so runs repeat: its stylesheet answers after 100 ms (fast) or 600 ms (slow 4G), its font files are refused. The language fonts (`fonts/i18n/<lang>.woff2`) load as for a player.
- The container is a shared 4-core cloud machine: single runs vary by ±15 %; the tables give the median of 5.

## 2. Results (Pixel 7, 4x CPU, median of 5)

Each row adds one step to the row above. `#tNew` = the title is usable; FCP = first paint; KB = gzipped bytes on the wire (`ja` includes its 207 KB font).

| Build | en fast #tNew | en slow 4G #tNew | ja fast #tNew | ja slow 4G #tNew | FCP en fast / slow 4G | KB en / ja |
|---|---|---|---|---|---|---|
| before (`ba9112b`, one file) | 2103 ms | 13435 ms | 2684 ms | 13635 ms | 2396 / 13648 ms | 2438 / 2641 |
| 1. one language at a time (+ photo fonts on first use) | 1672 ms | 7638 ms | 2012 ms | 8912 ms | 1868 / 7876 ms | 1307 / 1651 |
| 2. + minified | 1573 ms | 6100 ms | 1974 ms | 7272 ms | 1784 / 6328 ms | 1022 / 1366 |
| 3. + the loading paw | 1875 ms | 6016 ms | 2117 ms | 7233 ms | 448 / 852 ms | 1024 / 1368 |
| 4. + Google Fonts not blocking (**shipped**) | **1639 ms** | **6118 ms** | **2028 ms** | **7200 ms** | **160 / 248 ms** | **1024 / 1368** |

**In short:** the title is usable **22 % sooner on a fast connection and 55 % sooner on slow 4G** (13.4 s → 6.1 s), something is on screen **at once** (first paint 2.4 s → 0.16 s, 13.6 s → 0.25 s on slow 4G), and an English player downloads **58 % less** (2.44 → 1.02 MB), a Japanese one 48 % less (2.64 → 1.37 MB).

Notes:
- Step 1 is the big one: 1.07 MB gzipped of other languages no longer travel with the page (a non-English player gets about 145 KB for its own: 36 KB of keys and 89–114 KB of text).
- The loading paw changes nothing on slow 4G and costs 0–4 % of `#tNew` on a fast connection (within the noise of these runs; the row-3 fast run is the noisiest), for a first paint at about 0.2 s instead of 1.7–13.6 s. A first version animated the paw on the main thread and cost about 200 ms on fast loads; the shipped one animates the `<svg>` element itself (composited).
- The photo fonts (108 KB gzipped) left the first load in step 1, so they are part of its numbers.
- Measured twice for steps 2–4 (after the composited paw): the numbers above are the second round; the first round gave the same picture (step 2: 1486 / 6076 / 1974 / 7183 ms).

## 3. What was done

### Step 1: one language at a time (`tools/split.js`, `game/i18n/loader.js`)

- `node game/build.js publish` still writes the one self-contained `paw_haven_prototype.html` (every language inline, byte-identical to `perl tools/build.pl`) and now also the **split build** in `_split/`:
  - `index.html`: the `pawi18n` slot holds only `game/i18n/msg.js`, a small `PAW_I18N` (the font list and the file names, no texts) and `game/i18n/loader.js`;
  - `lang/<code>.<hash>.js` for each of the other languages (11 since yue, v2.20) (that language's array from `game/i18n/packed.js`) and one shared `lang/keys.<hash>.js` (the sorted keys, about 36 KB gzipped);
  - `photo_fonts.<hash>.js` (step 5).
- `loader.js` runs before the art and the game: it works out the language the game will pick (the same rules as `i18nWanted`: the `prefs.lang` pin, the save's `S.lang`, the title pick, the browser) and starts loading that language's file and the keys with `<script>` tags (works on `file://`, in the itch.io zip, in the artifact and on any host). The game script is wrapped in `PAW_I18N.run(...)`, so it runs at once for English and, for another language, once its file came (or failed, or after 15 s). The loading paw (step 3) shows meanwhile. The first screen is already in the right language; nothing renders twice.
- `00b_i18n.js`: `i18nHave(code)` / `i18nTarget()`. A language whose file failed plays in English; `i18nLater` tries again (3 s, then 15, 30, ... s, six tries): on the title screen the language switches live as soon as the file comes; in the game it is there on the next load (no surprise reload mid-play). `tsetLang` (Settings and the title chip) loads the file first, then switches as before (title: live re-render; game: save and reload, the file is in the browser cache by then). On a failed load nothing changes and the toast "That didn't work. Try again in a moment." shows (the existing `cloud.err_generic` text, so no new key to translate). `tlangCheck` (a cloud save bringing another language) loads the file first too.
- The single-file builds and the test harness have no `PAW_I18N.has`, so every check is "always there" and the code paths are the old ones.
- **Fonts (CJK and Thai):** the v2.14 FONTS step already loads only the current language's `'DD Local'` face from `fonts/i18n/` (`i18nFonts`, `game/fonts/i18n/<lang>.css` through `packed.js`), with a `?v=<hash>` in the URL. Nothing to change; the split keeps the font list in the small inline `PAW_I18N`.
- Every target ships the split build: GitHub Pages (`tools/pages.js` copies `_split/` into `_site/`), itch.io (`tools/itch.js` puts `lang/` and `photo_fonts.*.js` into the zip), doodledoggo.app `/play/` (`tools/cf_site.js`, section 4) and the claude.ai artifact (`tools/artifact.js`: `i18n.js` is now 47 KB instead of 3.7 MB, plus the `lang/` files and `photo_fonts.*.js`; the file list to pass to the Artifact tool is printed and written to `_artifact/files.json`).

### Step 2: minified production outputs (`tools/minify.js`)

- `tools/minify.js` from `main` (esbuild 0.24.0, each inline script and style on its own, `debugger` dropped, `console.log/debug/info` pure, nothing renamed across scripts). New: `minifyJs(code)` and `available()` for the artifact's separate files.
- `tools/pages.js` minifies `_site/index.html` (so the itch.io zip and `/play/` are minified too; `--no-minify` keeps it readable, `--single` wraps the old one-file build). `tools/artifact.js` minifies `game.js`, `dogs.js`, `world_*.js`, `mods.js`, `i18n.js` and `index.html` (`--no-minify` to skip). The generated `lang/` and `photo_fonts` files are already compact and stay as they are.
- Without esbuild every tool warns and ships the unminified files (never a broken build). Install: `npm i -g esbuild@0.24.0` (cloud sessions) or `npm i --prefix tools esbuild@0.24.0`. The GitHub Pages workflow installs it (`.github/workflows/pages.yml`).
- `node game/run_tests.js <suites> --minified` minifies `game/test_merged.html` before the suites (a missing esbuild is an error there).

### Step 3: the loading paw (`game/shell.html`, `23_boot.js`)

- Before the game's CSS and scripts: a paper page (the game's `#FFF8EC` with faint ruled lines), a wobbly crayon paw in inline SVG (a turbulence filter gives the crayon edge), "Loading…" and three paw prints that light up in turn. About 3 KB.
- The text follows `navigator.language` for en, ja, zh-Hans, zh-Hant (zh-TW, zh-HK, zh-Hant), yue (v2.20, the same 載入中…), ko, es, pt, fr, de, th and id, else English. It is `role="status"`.
- `prefers-reduced-motion`: no wobble, the prints stay still.
- `start()` in `23_boot.js` removes it first thing, before the title is drawn, so no suite ever sees it (the harness boots synchronously).
- `tools/pages.js` now cuts the head at the first `<style` (the loading paw's), so the title and meta tags still go into `<head>`.

### Step 4: Google Fonts without blocking the first paint

- In the split builds (Pages, itch.io, `/play/`, the artifact) the stylesheet is `<link rel="preload" as="style" ... onload="this.rel='stylesheet'">` with a `<noscript>` copy; `display=swap` stays. Text shows in the fallback font until Caveat, Patrick Hand and Gloria Hallelujah arrive, then swaps (as `display=swap` already did for the font files).
- The title and the photo postcard render the same: the postcard never used page fonts (it embeds its own, step 5), and the title is drawn after the game boots, by which time the stylesheet has usually arrived.
- The harness and `paw_haven_prototype.html` keep the blocking link, so text measurements in the fit and layout suites are unchanged.

### Step 5: the photo fonts on first use

- In the split builds `35b_photo_fonts.js` (143 KB, 108 KB gzipped: base64 woff2 hardly compresses) becomes `photo_fonts.<hash>.js`. The game gets a stub (`let PH_FONT_CSS = ''`, `PH_FONT_FILE`, `phFontsSet`); `phFonts()` in `35_photo.js` loads it with the first photo and `phDraw` waits for it (at most 6 s; offline, that postcard uses the fallback fonts and the next one tries again). The harness keeps it inline (`phFonts()` returns `null`, nothing changes).

### Step 6: caching

- **doodledoggo.app `/play/`** (`tools/cf_site.js`, deploy with `bash tools/cf_pages_deploy.sh`, owner's go-ahead):
  - `index.html`: `public, max-age=300, stale-while-revalidate=86400` (a new release reaches players within 5 minutes; a returning player gets the page at once while it refreshes).
  - `lang/<code>.<hash>.js`, `lang/keys.<hash>.js`, `photo_fonts.<hash>.js`: `public, max-age=31536000, immutable` (the hash changes with the content).
  - `fonts/i18n/*.woff2`: the game always asks for them with `?v=<hash>` (`packed.js`), so also a year, immutable.
  - Brand files: a day (inline, the main Worker) or a week (split, a side Worker).
  - The deploy is **inline** (the account has the paid 10 MB Worker limit and its token cannot create routes, `tools/cf_pages_deploy.sh`): the main Worker serves `/play/` with the split files and, since this lane, the game's own CJK and Thai font subsets at `/play/fonts/i18n/` (before, only the top-level files of `dist/itch` were served, so CJK and Thai players at `/play/` saw the system fonts; `SITE_PLAY_FONTS=0` leaves them out). `/play` (no slash) now redirects to `/play/` (301), because the game's files are relative (`game/test_site.js` updated for that).
  - **Worker budget (Game Manager, 22 Oct 2026):** the main Worker is now **8.17 MB gzipped of the 10 MB limit** (6.81 MB without the game's font subsets; about 7.1 MB with the old one-file game and no subsets). The site suite's budget is raised from 8 to 9 MB. **v2.15 must keep its new art in lazy chunks (section 5) and watch this budget.** If it gets tight: serve the `/play/` font subsets from a second origin (or the split fonts Worker, once the token can create routes), or drop rarely used glyph ranges from the subsets.
  - Split mode, for an account whose token can create routes (`SITE_FONTS=split SITE_IMG=split SITE_PLAY=split`): the game copy becomes its own Worker, `doodle-doggo-play` (`_cfsite_play/`, route `doodledoggo.app/play/*`, 2.33 MB gzipped), its fonts ride in `doodle-doggo-fonts` on a second route, `doodledoggo.app/play/fonts/i18n/*` (more specific, so it wins over `/play/*`), and the main Worker is 2.11 MB.
- **GitHub Pages:** its fixed `max-age=600` for everything. The hashed names still help: a new release never mixes an old language file with a new game.
- **itch.io:** it serves the zip's files from its CDN (`html-classic.itch.zone`) with its own cache headers (we cannot set them). Each upload gets a new path on that CDN, so a release never meets stale files; within one release the browser revalidates. Nothing to do.
- **claude.ai artifact:** served by claude.ai. The hashed names mean each publish adds new `lang/` files; pass `null` for the old ones in `files` (list them with `action: "list", scope: "files"` first) so the artifact does not collect stale copies (the limit is 511 files per version).
- **Service worker: not now.** A service worker would make repeat visits instant and allow offline play, but a mistake in its update logic serves an old game forever, and itch.io's iframe on another origin, the claude.ai artifact and the Pages copy each need their own scope rules. Recommendation for later (v2.15 or after launch): a small network-first worker for `index.html` and cache-first for the hashed files only, with a version check against the page and a kill switch (`/sw.js` that unregisters itself), tested on all three hosts first.

## 4. Sizes

| What | Before | After |
|---|---|---|
| Page (GitHub Pages / itch.io / `/play/` `index.html`) | 7.96 MB, 2.50 MB gzipped | 3.12 MB, 1.04 MB gzipped |
| of which i18n (`pawi18n`) | 3.67 MB, 1.07 MB gz | 46 KB, 17 KB gz (msg.js + loader) |
| of which art (`pawart`) | 1.53 MB, 0.51 MB gz | 1.28 MB, 0.43 MB gz |
| of which modules (`pawmods`) | 0.81 MB, 0.24 MB gz | 0.55 MB, 0.19 MB gz |
| of which game script | 1.71 MB, 0.62 MB gz (with the 143 KB photo fonts) | 1.05 MB, 0.37 MB gz |
| CSS | 237 KB, 55 KB gz | 196 KB, 39 KB gz |
| Language files (one per player, besides English) | inline | 89–114 KB gz each + 36 KB gz keys (all ten: 3.61 MB, 1.05 MB gz) |
| Photo fonts (first photo only) | inline | 143 KB, 108 KB gz |
| itch.io zip (everything, all languages and fonts) | 3.96 MB | 3.68 MB |
| claude.ai artifact, first load in English | about 7.96 MB over 9 files | about 3.1 MB (`i18n.js` 3.67 MB → 47 KB, `game.js` 1.71 MB → 1.05 MB, art and modules minified) |
| doodledoggo.app main Worker, inline deploy (gzipped) | about 7.1 MB (no game font subsets at `/play/`) | 8.17 MB with the game's font subsets, 6.81 MB without (split mode: 2.11 MB + `/play/` Worker 2.33 MB) |

Nothing is minified across scripts (each inline script and style on its own), so the shared names (`PawArt`, `PawGenes`, `window.__paw`) are unchanged. esbuild writes UTF-8 as it is (`charset: 'utf8'`): with its default ASCII output the all-language harness grew from 6.88 to 8.55 MB.

## 5. Plan for v2.15: load scenes when they are needed

The v2.15 map (`V215.md`, branch `design/v2.15-map`) adds world F (the new map, 25 buildings) and world G (eight new places, three run strips). Today every art world, every module and the photo fonts load before the title. The same mechanism as the language files (a hashed file, a `<script>` tag, a promise the caller awaits) can carry them:

| Chunk | Loaded when | Size now (min + gzip) | Saved on first load |
|---|---|---|---|
| world D + E (Tokyo, v2.11) | `tkStation()` / the Shinkansen ride | 148 + 151 KB min, 49 + 52 KB gz | about 100 KB gz |
| world G (v2.15 places) | the first visit to one of the eight places | estimate 150–250 KB min, 50–80 KB gz | about 60 KB gz |
| world F (v2.15 map) | the first map open (the old map stays in world A until then) | estimate 100–150 KB min, 35–50 KB gz | about 40 KB gz, but the map opens often: preload it after the title |
| `mods/garden.js` + `mods/kitchen.js` | the garden or the kitchen | 67 + 62 KB min, 23 + 21 KB gz | about 44 KB gz |
| `mods/toys.js` | the first toy game or ball play | 184 KB min, 66 KB gz | about 66 KB gz (ball play is common: preload when idle) |
| photo fonts | done in v2.14 | | 108 KB gz |

- Expected first load in English with all of it: about **0.7 MB gzipped** instead of 1.0 MB, and, by the v2.14 numbers (time grows with bytes to parse on a throttled phone), roughly 0.4–0.6 s less to the title on a mid phone and 1.5 s less on slow 4G.
- Rules: a chunk is a plain script that registers into `window.PawArt` or `window.PawX` (no game state, as now); the caller shows a short paper wobble while it waits (at most a few hundred ms on 4G); after the title, idle time preloads the likely next chunks (`requestIdleCallback`), so a tap never waits on a good connection. The harness keeps everything inline (as the languages), and a `--split` test run covers the loader.
- Art code is mostly long SVG path strings, which minify little: the next big win after chunks is `PawArt` scene caching across sessions (Cache Storage, keyed by the build hash), which only makes sense with the service worker above.

## 6. Tests

- Unminified (the normal harness): `smoke`, `i18n_smoke`, `phone_shell`, `v210_ball`, `v29_photo`, `phone_v29_photo`, `account`, `i18n`, `copy`, `itch_build` pass (`phone_shell` flaky once under load: "a backdrop tap closes the sheet", passed on retry).
- `--minified`: `smoke`, `i18n_smoke`, `phone_shell`, `v210_ball`, `v29_photo`, `phone_v29_photo`, `account` pass (`v210_ball` flaky once, a click timeout under load with three jobs; it passed on retry and in the next minified run).
- `itch_build` now also checks the split build: English loads no language file and the loading paw is gone; Japanese shows its title in Japanese with only its file and the keys; a title switch to German loads that file; a missing French file starts the game in English and the title switches to French once the file is there; the photo fonts load with the first photo, once, and the postcard carries them.
- `site` (after merging `integration/v2.14` at `d8f78ac`): everything passes except "the privacy page: ... this website loads nothing from anyone else", which fails the same way on `integration/v2.14` without this branch (the new Google Fonts line in the privacy text). The `/play` check now expects the 301 to `/play/`.
- `node tools/build.pl` still gives a byte-identical `paw_haven_prototype.html`.

## 7. Slow phones (test round C, v2.31.7, 17 Nov 2026)

Probe: the itch build (`node tools/itch.js`) served gzipped, Chromium at 360x640 (DPR 2, touch), CDP CPU throttle 4x and 6x, Chrome's Fast 3G (1.44 Mbps, 562 ms RTT) for the loads; rAF deltas and `longtask` entries while each thing runs; CDP profiles and traces for the causes. The container is shared, so single frame numbers vary a lot; the profile totals are the steady ones.

- **Load (Fast 3G, median of 3):** the title's Play at 10.1 s (4x) / 10.9 s (6x), first paint 0.7 / 0.8 s; Play to the adoption screen 2.1 / 2.7 s; a returning player's Continue to the yard 1.6 / 2.4 s (one 1.3-2.0 s task: the first yard build). Network-bound: `index.html` is now 1.52 MB gzipped (game script 637 KB, art 565 KB, modules 202 KB, CSS 62 KB) against 1.02 MB at v2.14. The next real win is still section 5 (lazy art and module chunks); not done here.
- **Story scenes and Memories replay:** each frame searched the whole backdrop (thousands of nodes) for the actors, the fade and the Skip button, and forced a layout to measure the film (about 1 ms a frame at 4x: 275-340 ms of `getBoundingClientRect` and up to 480 ms of `querySelector` per 8 s scene). Now the elements are found once a shot and the film is measured again only when it or the card title changes size (a `ResizeObserver`): both are down to a few ms. A shot's first frame still builds and paints its picture (200-450 ms at 4-6x); that frame now holds the scene clock (`SC_JUMP_MS`), so the cut's 380 ms fade-in plays in full instead of jumping from 1 to 0.03-0.24 (measured at 6x: now 0.94 on the first frame after the cut).
- **Share my dog:** making the picture takes about 1.0-1.3 s at 4x and 1.3-1.8 s at 6x (the first one also loads the photo fonts), with one 165-300 ms (4x) / 300-460 ms (6x) task for the SVG raster and the PNG encode while the sheet shows "Drawing your picture..."; about 5 MB of heap. Not changed: moving it off the main thread needs a worker, and an SVG image cannot be drawn in one (bigger redesign).
- **Coin, heart and star flies, the yard with 5 dogs, visitors, While you were out:** no single task over about 300 ms at 6x. With 5 roaming dogs the main thread is 85-90 % busy at 4x, mostly paint and layerize of the SVG yard: the moving dogs repaint the world svg. Compositing them would need the dogs out of the world svg (bigger redesign).

## 8. The rest file: a smaller page before the title (v2.31.14, 18 Nov 2026)

Branch `claude/faster-load`. Section 7 measured a 1.52 MB gzipped `index.html`. This step moves what the title screen does not need out of it. The game itself is unchanged: same art, same save, same `migrate()`.

### What is in the 1.52 MB (gzipped, each part minified on its own)

| Part | KB gz | Before the title? |
|---|---|---|
| Game script (85 source files, one shared scope; biggest: `00_core` 49, `03_yard` 40, `50_friends` 29, `39_tokyo` 22) | 637 | yes: one scope, it cannot be cut without a rewrite |
| Art world B (icons, items, beds, houses, props, furniture, market items) | 182 | yes: the top bar's icons and the title's tape and panels are in it |
| Art world C (hangouts, the Playroom, the wide v2.15 scenes, the Japan scenery `PawArt.JP`) | 105 | yes: world A's yard (the title's backdrop) draws Mt. Fuji with `PawArt.JP`; the adoption needs the Playroom |
| Dogs (`dogs/pawart_dogs.js`) | 82 | yes |
| Art world A (yard, market, shelter, old map, four walk strips) | 62 | yes: the title's backdrop |
| CSS | 62 | yes |
| `mods/genes.js`, `mods/pawaudio.js` | 22 + 24 | yes: read while the game script loads |
| i18n core, loaders, the loading paw | about 20 | yes |
| **Art world E** (three Tokyo scenes, the market, v2.15-v2.18 and Fun Fair items, the aria layer) | 63 | **no** |
| **Art world D** (Japan map, Shinkansen, Shibuya, Yoyogi, Asakusa) | 48 | **no** |
| **`pawart_shop.js`** (Kind shop art) | 16 | **no** |
| **`mods/toys.js`** | 66 | **no** |
| **`mods/walkrun.js`** | 37 | **no** |
| **`mods/garden.js`, `mods/kitchen.js`** | 24 + 21 | **no** |
| **`mods/qr.js`** | 8 | **no** |

The last five rows (291 KB gzipped together) are now one file, **`world_r.<hash>.js`** ("the rest"), next to `world_f` and `world_g`.

### How it loads

- `tools/split.js` writes the file (the sources in their old order: D, E, shop art, then the five modules) and sets `window.PAW_CHUNKS.r`. `game/build.js` leaves those sources out of the split build's art and module slots. `game/i18n/rest.js` (`window.PAW_REST`, inline before the art) loads it with a `<script>` tag, like the language files.
- **A returning player** (a save or the cloud bookkeeping in `localStorage`, a hot-reload host, or storage that cannot be read): the download starts at the top of the page, next to the page itself (`<link rel="preload">`), and the game script waits for it (`PAW_REST.run`, around `PAW_I18N.run`). The game starts with everything loaded, in the old order, exactly as before. This matters: `migrate()`, the garden clock and the daily wish read the modules while the save loads.
- **A new player** (nothing stored): the game script runs at once and draws the title with the dogs and worlds A, B and C. The file is fetched while the script runs and added right after the title is drawn. Until it has run, every tap on the page is held (`restGate` in `00_core.js`, a capture listener): the paper wobble card shows "Loading…" and the tap is given again once the file is here. `go()` has a second lock (no screen but the title without the file). So the adoption, the first save and every game screen always have all the art and modules, and no game code had to change.
- **World E's aria layer** (the last wrapper over every `PawArt` call, for translated `aria-label`s) is needed on the title, so the split build keeps a copy inline; the rest file takes that copy off (`PawArt._ariaOff()`) before world D runs, and world E puts its own on, under the shop art, as in the one-file build. Worlds F and G wait for the rest file (`artChunk`), so the wrapping order stays A, B, C, D, E, shop, F, G.
- **A failed load**: three tries (0.6 s and 2 s apart). Then a new player's card reads "That didn't load. Tap to try again." (12 languages, in `rest.js`, because the game's own texts may not be there yet) and a tap starts over; the held Play then goes on. A returning player reads the same line on the loading paw. Nothing is lost: no game has started and nothing was saved.
- **Where it runs:** the itch.io zip (a relative `<script src>`, in the zip like `world_f`), doodledoggo.app `/play/` and the test copy (the name matches the `world_[a-z].<hash>.js` pattern of `tools/pages.js`, `tools/itch.js`, `tools/cf_site.js` and `tools/cf_test.js`: minified, copied, served for a year as immutable; `script-src 'self'` allows it; no Worker code changed). The claude.ai artifact (`tools/artifact.js`, `lazy: false`), `paw_haven_prototype.html` and the test harness keep everything inline. Offline after a first load works where it did: the file is cached like the page's other files.

### Numbers

Probe: the itch build served gzipped with no cache, Chromium 360x640 (DPR 2, touch), CPU 4x, Chrome's Fast 3G (1.44 Mbps, 562 ms RTT), median of 3 (single runs within 0.2 s of each other).

| | Before (`1ee5911d`) | After |
|---|---|---|
| `index.html` | 4.57 MB, **1.523 MB gzipped** | 3.71 MB, **1.234 MB gzipped** (−19 %) |
| Gzipped bytes before the title, English | 1.52 MB | **1.23 MB** |
| Gzipped bytes before the title, Japanese (page + `lang/ja` 156 KB + keys 48 KB; the 207 KB font comes after) | 1.73 MB | **1.44 MB** |
| The rest file (after the title; before the game for a returning player) | | 855 KB, 291 KB gzipped |
| **Time to the title's Play, English** | 10.2 s | **8.7 s** (−1.5 s, −15 %) |
| **Time to the title's Play, Japanese** | 11.4 s | **9.9 s** (−1.5 s) |
| First paint | 0.7 s | 0.7 s |
| Play tapped the instant it shows, to the adoption screen (the worst case), English | 11.2 s | 11.8 s (a 3.1 s wait on the card instead of 1.0 s) |
| Same, Japanese (the rest file shares the line with the 207 KB font) | 12.4 s | 14.3 s |
| itch.io zip | 5.04 MB | 5.05 MB |

**The 0.9 MB target is not met.** What still travels before the title is the game script (637 KB), world B (182 KB), world C (105 KB), the dogs (82 KB), world A and the CSS (62 KB each). Each needs art or game work that would not be a safe, reviewable change here:

1. **World C after the title (about 105 KB):** move the Japan scenery (`PawArt.JP`, used by world A's yard) into world A or a small file of its own. World C could then join the rest file (the Playroom is first needed after Play).
2. **World B in two (about 100 of 182 KB):** the title needs 17 icons and 3 props. The market, festival and furniture items could become a second file, but they share one closure with the pencil kit, so the art lane has to split the file.
3. **The game script in two (up to 300 of 637 KB):** it is one shared scope. Friends, Tokyo, the Fun Fair, the Kind shop, the story and the missions would each need to become a module with a declared interface.
4. **True on-demand loading** (Tokyo on the Shinkansen, the garden on its first open): today the game reads module presence as a feature switch while it loads a save (`gkOn()`, `toySupported()`, `gardenNew()`, `tkArtReady()`), so a module that arrives late changes game state. Each switch would have to become "known but not loaded yet" first. With the rest file loaded right after the title this would save no time before Play, only data for players who never open those places.

The cost is the worst case in the last two rows: a player who taps Play the instant it appears waits on the "Loading…" card until the rest file is here, and reaches the adoption 0.6 s (English) to 1.9 s (Japanese) later than before. A player who looks at the title for three seconds or more waits for nothing. A returning player's load is the same bytes as before, in two files fetched side by side.

### Proof that nothing looks different

- **Art, byte for byte** (Node `vm`, no browser): the one-file order against the split order (dogs, A, B, C, the aria copy, then `_ariaOff`, D, E, shop). 88 title calls made before the rest file (the yard in every time, weather and season with the Japan scenery, the 17 top-bar icons with and without `aria`, the three props, two dogs) and 1,215 calls after it (every scene, walk strip, prop, item, icon, bed, house, obstacle, collectible and Fun Fair piece of worlds A to E and the shop, plain and with `aria` / `ariaMap`): **0 differ**, and `PawArt` has the same keys. This check found that the title's yard needs world C (the first cut had it in the rest file).
- **Screens** (page clock frozen and stepped, `Math.random` seeded, 360x640): title, adoption, first yard, map, garden, kitchen, a market, Shibuya, Ueno, the Japan map, the café, story scene 1, and a returning player's title, yard and Asakusa. Base against new: the DOM (random dog ids and the random tip line masked) and the screenshot are byte-identical on 13 of 15; two runs of the base build against each other give the same 13 of 15 (the adoption's and the kitchen's random idle poses and lines differ between any two runs). The title as a real browser sees it (not `navigator.webdriver`, so with Mt. Fuji) is identical in DOM and pixels.
- No file under `dogs/`, `world/` or `mods/` changed (`git diff 1ee5911d -- dogs world mods` is empty), so `check_identical` and the fill sweep have nothing new to see.

### Tests

`itch_build` has a new section (20 checks): the file exists and the page names it; worlds D and E and the modules are not in `index.html`; a new player gets the title first, then one tag, then everything; the aria layer sits where it did; a missing file leaves the title up, a tap waits, the card says "Tap to try again", nothing is saved, and with the file back the held Play goes on; a returning player's game waits, the loading paw offers the retry, and the title then comes with every module there.
