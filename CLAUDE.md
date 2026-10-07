# Paw Haven

A cozy browser game: adopt crayon-drawn dogs, care for them, walk a sketchbook town, grow a garden, and have puppy playdates with real coat genetics. Current version: **v2.4 "Shop Day"** (also on claude.ai, where cloud save is off by design). History: `CHANGELOG.md`. Open issues: `TODO.md`.

**Read `PIPELINE.md` and `README.md` first.** Running parallel agents? Read `BUILDING.md` (roles, models and the cost rules). They describe the layout, the shared-scope rules, the lanes and the test runner. Two things there don't apply on this Mac: the `/home/claude/...` paths (they mean this repo root), and the multi-agent worktree workflow (`tools/wt.sh`), unless you're running parallel agents.

## This machine

- No Node, Python, or system git (Xcode Command Line Tools aren't installed).
  - Build with Perl: `perl tools/build.pl` writes `paw_haven_prototype.html`. It's byte-identical to `node game/build.js publish`, minus the syntax check.
  - Git: use GitHub Desktop's bundled binary, `"/Applications/GitHub Desktop.app/Contents/Resources/app/git/bin/git"`. Pushing goes through GitHub Desktop (it holds the sign-in).
- Tests (`node game/run_tests.js smoke|all`) need Node and Playwright. Until those are installed, check changes by building and playing the game in a browser. Serve it with `ruby -run -e httpd . -p 8765`, then open `/paw_haven_prototype.html`.

## Where things are

- `game/shell.html` + `game/css/*` + `game/src/*`: the game. Everything in `src/` is **one shared scope** (IIFE opens in `00_core.js`, closes in `23_boot.js`). Files load in `ORDER.txt` order. A new feature means a new `NN_feature.js` (and `.css`) added to `ORDER.txt`.
- `dogs/pawart_dogs.js`, `world/pawart_world_{a,b,c}.js`: art modules (`window.PawArt`).
- `mods/{genes,pawaudio,walkrun,toys,garden,kitchen}.js`: gameplay modules (`window.PawGenes`, `PawAudio`, `PawWalk`, `PawToys`, `PawGarden`, `PawKitchen`). Modules never touch localStorage or game state; the game passes callbacks.
- The `*_v1…v9.js`, `world/a|b|c/`, galleries and `*_reference.*` files are earlier art versions and review pages. They are not part of the build.
- `V12.md` … `V2.md`, `V2_GENES.md`, `API*.md`, `TREASURE.md`: the build contract for each version. Check the relevant one before changing a system.
- Phone layout: `game/src/22c_phone_shell.js` + `game/css/20_phone_shell.css` (shell), phone rules per lane in `game/css/21–26_phone_*.css`, always under `html[data-layout="phone"]` / `isPhone()`. Contract: `PHONE.md`. Phone suites: `node game/run_tests.js phone` (includes `account` and the occlusion suites `phone_occl_home`, `phone_occl_play`).
- Daily missions: `game/src/24_missions.js` + `game/css/27_missions.css` (tag `ms`). Gerald's guide: `game/src/25_guide.js` + `game/css/28_guide.css` (tag `gd`). Player actions reach them through `trackAct(kind, data)` in `00_core.js` (bus `act`). Contract: `V24.md` (section 13 has the as-built notes).
- Cloud save: `game/src/22b_cloud_config.js` (public Supabase URL and publishable key only, never a secret key), `game/src/22b_cloud.js`, tables in `supabase/schema.sql`. Off on the claude.ai artifact and under the test harness. With cloud on, the title screen offers Log in / Make an account / Play as guest, and a save is owned by its account.
- `docs/design/`: the game design docs (proposal, v2 Playdates & Sparkle, Garden & Kitchen, v1.3 build plan), exported from the claude.ai doc. Charts are placeholders.

## Save data

`localStorage['pawhaven_proto_v1']` holds `S` (schema `v: 1`). The cloud stores exactly that JSON (`saves` table); sync bookkeeping lives in `pawhaven_cloud_v1`. Migrate **additively** in `migrate()` (`game/src/00_core.js`): give new fields defaults, never bump `v`, never drop fields. Old saves must always load. Prototype speed-ups: `BOOST = { coins: 2, bond: 3, nap: 6 }`, 1 game hour = 1 real minute, 1 real day = 1 dog month.

## Design rules (from the proposal; don't break them)

- **Nothing bad ever happens.** No fail states, no sickness, death or running away.
- **No selling dogs, ever.** Puppies are adopted out free to named families. Sparkle is cosmetic only, never paid.
- **Real welfare and food safety.** No double merle, no relatives, age and season limits, rest between litters. Nothing toxic to dogs can be planted, cooked or fed. Blocks are short, kind, two-sentence lessons.
- **Look.** A detailed pencil-sketchbook world with **deliberately crude crayon dogs**. The ugly dogs are the joke.
- **Words.** Never "breed" as a verb, "stud", "litter price", "sell" (for dogs). The build rejects "nintendo", "pokémon" and "animal crossing".
- **Economy.** Walks are the main income (~100 a day); the garden stays below it.

## Publishing

- **GitHub:** pushing `main` triggers `.github/workflows/pages.yml`, which deploys to GitHub Pages (https://an9ou.github.io/paw-haven/ once Pages is set to "GitHub Actions").
- **claude.ai artifact "Paw Haven":** https://claude.ai/artifact/ELi5aBLzRxqJxMuc4YG5zD. It is a multi-file artifact since v2.4: `node tools/artifact.js` writes `_artifact/index.html` plus `dogs.js`, `world_a.js`, `world_b.js`, `world_c.js`, `mods.js`, `game.js`; publish `index.html` to that URL with the Artifact tool, passing the six files as `files`. The tool needs the live page read first and the supporting files listed (`list` with scope `files`): have a subagent do that read (the page is small now), never paste the page into the coordinator's context. Log releases in **Paw Haven Studio**, https://claude.ai/artifact/Raf3Fyx1pS2Gz9U55Wf5BS (database collections `releases`, `agents`, `queue`).
