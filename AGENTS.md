# Notes for coding agents (Cursor and others)

Doodle Doggo is a cozy browser game. The owner reads only English. Claude (the Game Manager) designs the features, draws the art, translates,
reviews every PR and ships releases. Coding agents build the parts described in GitHub issues. Read `CLAUDE.md` (the project rules), `README.md`,
`PIPELINE.md`, the contract named in the issue (e.g. `V219.md`) and the parts of `docs/FILES.md` the issue points to.

## How to work
- One issue, one branch (`cursor/<short-name>`), one PR into `main`. Never push to `main` directly. Never deploy (no `tools/cf_*`, no
  `tools/itch_push.sh`). The Worker and the site go live only when Claude deploys them on the owner's go-ahead.
- Keep to the issue's scope. If the contract is unclear or wrong, say so in the PR description instead of inventing a new design.
- Match the surrounding code: its naming, its comment density, its short helper style. Files in `game/src/` share **one scope**: the IIFE
  opens in `00_core.js` and closes in `23_boot.js`, and files load in `game/src/ORDER.txt` order. New files go into `ORDER.txt`, and each new
  system gets a short tag prefix (e.g. `fr` for friends).
- Art comes from `window.PawArt` (`dogs/`, `world/`). Don't draw new art and don't change `dogs/pawart_dogs.js`. If art is missing, use an
  existing icon and leave `// TODO art`.
- Modules in `mods/` never touch `localStorage` or the game state `S`.
- Text: every player-facing string goes through `tt('key', 'English')` (or `tdata`). Write English only; Claude translates all 11 languages
  in one batch. No typed text from players ever goes to the server.
- Save data: migrate **additively** in `migrate()` (`game/src/00_core.js`) with a `v<ver>Fields(s)` helper. Give new fields defaults, never
  bump `S.v`, never drop or rename fields. Old saves must always load.
- Phones first: check 390x844 and 360x740. Taps are 44 px or more, nothing hides under the phone bar, and the page never scrolls sideways.

## Game rules you must not break
- Nothing bad ever happens: no fail states, sickness, death or running away. Nothing is ever lost to another player.
- Dogs are never sold, traded or given. Words: never "breed" as a verb, never "stud", "litter price", or "sell" for dogs. The build rejects
  "nintendo", "pokémon" and "animal crossing".
- Nothing toxic to dogs can be planted, cooked, fed or gifted.
- Economy: walks are the main income (~100 coins a day). Any new source of coins has a daily cap stated in its issue.
- Look: a pencil-sketchbook world with deliberately crude crayon dogs. Every colour fill stays inside its own outline.

## Tests (Node 20+ and Playwright; Chromium is installed in Cursor's cloud machines with `npx playwright install chromium`)
- Build: `node game/build.js` (the publish build: `node game/build.js publish`).
- Run one suite at a time: `node game/run_tests.js <suite>` (e.g. `smoke`, `worker`, `cloud`, and the suite your issue names).
  `node game/run_tests.js --list` lists them.
- A PR is ready when the issue's suites pass. Paste the summary table into the PR description.
