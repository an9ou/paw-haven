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

@@NUMBERS@@

## 3. What was done

### Step 1: one language at a time (`tools/split.js`, `game/i18n/loader.js`)

- `node game/build.js publish` still writes the one self-contained `paw_haven_prototype.html` (every language inline, byte-identical to `perl tools/build.pl`) and now also the **split build** in `_split/`:
  - `index.html`: the `pawi18n` slot holds only `game/i18n/msg.js`, a small `PAW_I18N` (the font list and the file names, no texts) and `game/i18n/loader.js`;
  - `lang/<code>.<hash>.js` for each of the 10 other languages (that language's array from `game/i18n/packed.js`) and one shared `lang/keys.<hash>.js` (the sorted keys, about 36 KB gzipped);
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
- The text follows `navigator.language` for en, ja, zh-Hans, zh-Hant (zh-TW, zh-HK, zh-Hant), ko, es, pt, fr, de, th and id, else English. It is `role="status"`.
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
  - Brand files: a week.
  - The game copy is now its own Worker, `doodle-doggo-play` (`_cfsite_play/`, route `doodledoggo.app/play/*`, 2.33 MB gzipped), and its fonts ride in `doodle-doggo-fonts` on a second route, `doodledoggo.app/play/fonts/i18n/*` (more specific, so it wins over `/play/*`). Before, the whole 7.96 MB game sat in the site's main Worker, which put it at 4.72 MB gzipped, over the 3 MB free-plan limit and the 2.5 MB budget in `game/test_site.js`; now the main Worker is 2.11 MB. `SITE_PLAY=inline` keeps the old layout. `/play` (no slash) redirects to `/play/`, so the relative files resolve.
- **GitHub Pages:** its fixed `max-age=600` for everything. The hashed names still help: a new release never mixes an old language file with a new game.
- **itch.io:** it serves the zip's files from its CDN (`html-classic.itch.zone`) with its own cache headers (we cannot set them). Each upload gets a new path on that CDN, so a release never meets stale files; within one release the browser revalidates. Nothing to do.
- **claude.ai artifact:** served by claude.ai. The hashed names mean each publish adds new `lang/` files; pass `null` for the old ones in `files` (list them with `action: "list", scope: "files"` first) so the artifact does not collect stale copies (the limit is 511 files per version).
- **Service worker: not now.** A service worker would make repeat visits instant and allow offline play, but a mistake in its update logic serves an old game forever, and itch.io's iframe on another origin, the claude.ai artifact and the Pages copy each need their own scope rules. Recommendation for later (v2.15 or after launch): a small network-first worker for `index.html` and cache-first for the hashed files only, with a version check against the page and a kill switch (`/sw.js` that unregisters itself), tested on all three hosts first.

## 4. Sizes

@@SIZES@@

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
