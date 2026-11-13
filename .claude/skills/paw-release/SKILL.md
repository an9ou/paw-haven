---
name: paw-release
description: >-
  Ship a Doodle Doggo release: the step-by-step recipe from a green branch to main, the What's new (NEWS) entry in 12
  languages, CHANGELOG and version line, the itch.io push, the doodledoggo.app site deploy, the live check, the Worker
  (only if cloudflare/ changed), the Marketing briefing and the HANDOFF_GM note. Use when a fix or an update is done and
  tested and the owner wants it live ("ship it", "release", "push to itch", "deploy the site"), and for the go-ahead rules.
---

# Paw release

Read `CLAUDE.md` (owner's standing rules) and the top "CURRENT" section of `docs/HANDOFF_GM.md` first. Never edit
`paw_haven_prototype.html` (generated). Releases go to GitHub (main), itch.io and doodledoggo.app only; the claude.ai artifact stays on v2.14.

## 0. Pre-checks (stop and ask if any fails)

- **Small fix** (a bug, a text, a balance change): ships automatically once green (owner's push rule), with one combined review.
- **Big or special release** (a festival or market set, a new language, a big content update, ads, shop changes): the owner's
  explicit go-ahead **and launch date** first, asked in the choice window. The 5-minute default does NOT apply to it. Prepare
  everything, then wait. Marketing hears only after the owner has set the date. Big releases also had three reviews (code, phone, art).
- **Worker (`cloudflare/`) changed and it touches money or Stripe** (the `/shop/*` routes): the owner approves in the choice
  window first. Never read, print or change Stripe secrets; refunds are the owner's job in the Stripe Dashboard.
- Gates `FR_LIVE`, `MS2_LIVE`, `YUE_LIVE`, `SHOP_LIVE` are all on today. `tools/itch.js` fails if a Pages-only test flag leaked.
- Start from a clean tree on the up-to-date `origin/main`. **If other agents have uncommitted work in the main checkout, release from a
  separate worktree:** `git worktree add <dir> origin/main`, `git checkout -B release/<ver>`, merge the work branch there, build and
  deploy there. `dist/itch` must come from main, never from a branch with unreleased work.
- Tools: `npm i -g esbuild@0.24.0` (itch.js minifies; `itch_push.sh` refuses without it). Run tests as
  `NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors node game/run_tests.js <suite> --jobs 1`: one suite at a time
  (three at once overload a 4-core box); long runs as tracked background tasks.

## 1. Change set

1. Merge the work branch into the release branch. **`game/i18n/packed.js` is generated: never hand-merge it**, re-run `node tools/i18n_pack.js`.
2. **NEWS entry** (`game/src/49c_news.js`; how-to: `V218.md` section 14). Only when players see something new; none for pure fixes.
   - Add an object with `id` (the version), `date` (ISO, the release day in Japan), `c` colour, `d` doodle, `pic`, `title()` and
     3-5 `items`, every text through `tt('nw.v<ver>.<name>', 'English', {vars})`. Model: `NEWS_V2241`. A gated feature uses a
     `const NEWS_Vxxx`, a `nwVxxxDue()` and a line in `nwSort()`; otherwise put the object at the top of `NEWS`.
   - Update the newest id in `game/test_v2182_news.js` (the `want` expression near line 23 and its check message).
   - `node tools/i18n_extract.js --en`, then translate the new `nw.*` keys in all 12 languages in one batch with the `paw-i18n` skill.
3. `CHANGELOG.md`: a new row at the top of the table (date, version and name, what changed and why, files, suites).
4. `CLAUDE.md`: the "Current version" line at the top (new version in front). `README.md`, `TODO.md`, `docs/FILES.md` only if a system changed.

## 2. Suites (green before any push)

`smoke`, the feature's own suite, `v2182_news` (flaky: rerun once alone), `i18n`, `copy`, `itch_build`; `worker` if `cloudflare/` changed
(`v224_worker` prints 0 checks in the runner but passes 93 run directly); `i18n_smoke` after language changes (flaky on its reload
check). Layout: the `paw-fit` skill. Big releases: `all` then `phone`. Known red on main: `i18n_phone` (Feed tap), `phone_v29_pack`
(Tug position), and the `site` size budget (below). A suite that fails and then passes on a plain rerun is flaky: say so in the report.

## 3. Ship, in this order

1. **Worker first, only if `cloudflare/` changed:** `bash tools/cf_api_deploy.sh`, then `bash tools/cf_api_smoke.sh`.
2. `git push origin HEAD:main` (a green push deploys GitHub Pages: check the run succeeded), and the dev branch if one is in use. Never force-push.
3. `node tools/itch.js` (writes `dist/itch/`), then `bash tools/itch_push.sh <ver>`. It needs `BUTLER_API_KEY` and `ITCH_USER` in
   the environment (never print them), rebuilds, pushes channel `html5` and prints `butler status`. Note the build number.
4. **Site** (also carries `/play/`, the itch build of main): `SITE_GAME=$PWD/dist/itch node game/run_tests.js site`, then
   `SITE_GAME=$PWD/dist/itch bash tools/cf_pages_deploy.sh`. In a cloud session the deploy raises an approval prompt for the
   owner; if it waits 5 minutes, do not deploy, take the path that needs no prompt and say so. The script refuses while
   `tools/site_dogs.js` holds unreleased dog profiles.
   - **Size budget:** the Worker limit is 10 MB gzipped; the `site` suite allows 9.8 MB and stood at 9.86 MB on 10 Nov (its only red
     check). Add no site art or fonts without trimming; raise the test budget only with the owner.
   - **Fonts gotcha:** `node tools/i18n_fonts.js <lang>` without `--for game` rewrites the SITE fonts in `site/fonts/i18n/`. Game subsets need `--for game`.
5. **Live check:** `curl -s https://doodledoggo.app/play/ | md5sum` equals `md5sum dist/itch/index.html`. After a deploy the old page can
   be served for about 15 minutes (the token cannot purge the cache): wait, do not redeploy. Also `/yue/` and `/ja/` answer 200.
6. itch.io: the new build shows on https://an9ou.itch.io/doodle-doggo.

## 4. After shipping

- **Brief Marketing:** find the session tagged `team:marketing` (`Doodle Doggo · MARKETING`, branch `marketing/launch`) with
  `list_sessions`. One short message: version and name; what is new for players (3-5 lines); new breeds or items; links
  (https://doodledoggo.app, https://an9ou.itch.io/doodle-doggo, https://an9ou.github.io/paw-haven/); where the materials are
  (`brand/itch/<ver>/`, new breeds also `brand/instagram/launch/dogs/`); what not to say (no ads, nothing unreleased; "12 languages";
  "no chat, no messages", not "no typing"). Captions live in `docs/marketing/` files; the chat only says where. Special updates:
  only after the owner has set the date.
- **`docs/HANDOFF_GM.md`:** add a "DONE <date>: vX.Y.Z shipped" bullet to the CURRENT section: main commit, itch build number, site
  deployed (md5 matched), Worker deployed or not, suites green or flaky, Marketing told, what is open. Commit and push.
- Do not build or upload itch.io page text, cover or screenshots (`tools/itch.js` for the page, `brand/itch/`) as part of other tasks unless the owner asks.
- One short report to the owner when the whole task is done; no progress updates.
