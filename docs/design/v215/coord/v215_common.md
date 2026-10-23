# v2.15 "Around Town": rules for every lane (read before you start)

You are a lane of the v2.15 build of Doodle Doggo (repo an9ou/paw-haven). The Coordinator (the session that started you) merges your work. Your final answer is your report to the Coordinator.

## Read first
- `CLAUDE.md`, `PIPELINE.md`, and `V215.md` (the build contract; your brief names the sections that matter most). `PHONE.md` if you touch layout. `PERF.md` section 5 if you touch the build or chunks.
- Paths in CLAUDE.md like `/home/claude/...` mean the repo root. Ignore CLAUDE.md's "This machine" section (it is about the owner's Mac): here you have Node 22, Playwright with Chromium, git, esbuild 0.24.0.

## Git
- You work in your own git worktree. First: `git fetch origin integration/v2.15 && git checkout -B lane/v215-<name> origin/integration/v2.15` (your brief gives `<name>`; if it says to base on another branch, use that).
- The container can restart without warning (it did on 23 Oct): commit and push a WIP commit at least every 30–45 minutes of work.
- Commit on `lane/v215-<name>` and push only that branch: `git push -u origin lane/v215-<name>` (retry up to 4 times with backoff on network errors). Never merge, rebase onto, or push `integration/v2.15` or `main`. No pull requests.
- Commit messages end with:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_012Vu6bXcG1ZGRKUjSTTn4wF
  ```
- Never put a model name in commits, code or docs.
- Don't commit screenshots or `game/i18n/packed.js` (the Coordinator re-packs). Keep screenshots in `game/shots_v215_<name>/` (untracked) or the scratchpad.

## Environment
- `export NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors` before running tests.
- The container has 4 cores and other lanes run at the same time. Run tests with `--jobs 1`, only `smoke` plus your own suites and the suites for files you touched. Never run `all`, `phone`, `i18n_fit` or `site_fit`. Run long test commands as tracked background tasks (Bash `run_in_background`), not detached processes, and wait for them to finish.

## Rules that apply to everything
- Design rules in CLAUDE.md: nothing bad ever happens, crude crayon dogs on a detailed pencil-sketchbook world, word rules (never "breed" as a verb, "stud", "sell" for dogs), real welfare and food safety, walks stay the main income.
- Old renders stay byte-identical: everything new in old art files sits behind `o.v215` (no `o.v215` = the old output byte for byte). The dog art: `node dogs/check_identical.js v215-base` must show 0 differ with no `SKIP` (run `git fetch origin v215-base:v215-base` first if the ref is missing).
- i18n (v2.14): every new player-visible string in game code goes through `tt('<area>.<what>', 'English')` / `tdata(...)` from the first line (areas: `map215`, `ground`, `agility`, `pool`, `tracks`). Never bind the names `tt`, `tdata`, `tbreed`, `tnum`, `tdate`, `tlist` yourself. After `tt()` changes run `node tools/i18n_extract.js --en` and commit `game/i18n/en.json`. Art modules (`world/`, `dogs/`) never call `tt`: they take any text (captions, aria-labels) from the caller through options, the way the v2.14 map and scenes already do. Translations into the other 10 languages are done by the I18N lane later, not by you.
- Copy rules: `node game/test_copy_node.js` (no emoji, no semicolons in player text, no browser dialogs, banned words).
- Save data: additive only, never bump `v`.
- Phone: 44 px taps, 15 px text, no sideways scroll; phone rules under `html[data-layout="phone"]` / `isPhone()`.
- Unique SVG ids across a scene (prefix yours).

## Report (your final answer, 25 lines at most)
Branch and commits, what you built (files), tests run and results (exact pass/fail), screenshots path, anything not done or any decision the Coordinator must take.

## Big context
If your context passes about 300k tokens and more than about an hour of work is left: commit and push what you have at a clean point, then end with a report starting "HANDOFF:" (25 lines: what is done, what is left, where), so the Coordinator can start a fresh lane.

## One test run at a time in the container (after two restarts on 23 Oct)
Wrap every test or heavy command (`run_tests.js`, `check_identical.js`, Playwright screenshot scripts, `i18n_fonts.js`) in the shared lock, so only one runs in the whole container at a time:
`flock /tmp/v215_test.lock <command>`
Run it as one tracked background task and wait for its notification; don't start pollers (`until pgrep ...; sleep`) on top of it.
