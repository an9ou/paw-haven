# How we build a release with parallel agents (cost-saving playbook)

Read with `PIPELINE.md` (lanes, shared scope, tests). This file says **who runs, on which model, and how to keep the cost down.** It was written after v2.1 and v2.2, which were built overnight on 5–6 Oct 2026.

## What the last build cost, and why

The platform's usage meters, at list price:

| Who | Cost | Share |
|---|---|---|
| Coordinator (Opus) | $68.5 | 46% |
| Task manager (Opus) | $39.9 | 27% |
| 15 lanes (v2.1 + v2.2) | $36.9 | 25% |
| Reviews | $4.0 | 3% |
| **Total** | **≈ $149** | |

**Building was cheap. Managing was expensive.** The two managing sessions grew past 600k tokens of context, and every check-in, notification and status lookup re-reads the whole context (the Coordinator re-read 126M tokens). A lane's model mattered much less: an Opus lane cost $1.2–4.5 and a Sonnet lane $1.5–6.6.

**Target:** a release like v2.2 for about **$50–70**, at the same speed or faster.

## Roles

| Role | Model | Lives for | Job |
|---|---|---|---|
| **Project manager** | Opus | Long-running, the owner's chat | Talks to the owner: plans, decisions, reports. Reads the Build Board for progress. Never builds or merges. |
| **Coordinator** | Opus | **One release** | Writes lane briefs, starts the lanes, merges, fixes merge fallout, releases. |
| **Lanes** | Sonnet by default | **One release** | Build one area in their own branch. |
| **Integration review** | Opus, three in parallel | One review | Read-only checks: code and cross-lane, phone layout and occlusion, art and style. Each re-checks every fix batch as it merges. Worth it: it found 7 real bugs in each release. |

There is no separate QA session. `game/test_copy_node.js` (the `copy` suite) and the phone suites check the standing rules for free.

## The eleven rules

1. **Same name, fresh session, every release.** Name sessions `Paw Haven · <AREA> (<Model>)`, with no version number. Start a **new** session for each release and archive the old one when the release ships. Never reuse a session across releases: it carries its whole history into every turn.
2. **Wake on events, not on a timer.**
   - Every lane brief ends with: "When done, send your report to the Coordinator (session `<id>`) with send_message."
   - The Coordinator keeps one fallback check-in of 60 minutes or more, in case a message is lost.
   - The Project manager hears from the Coordinator three times: at the start, for decisions it can't take, and at the end.
3. **Keep managers' context small.**
   - Lane reports are 25 lines at most.
   - Read sessions with `list_events` and `kinds: ["result"]`, not full transcripts or repeated `get_session` dumps.
   - Don't paste big files or diffs into a manager. Run the tests instead, and let the review read the diff.
4. **Size lanes by work, not by area.**
   - A lane is worth it at about 1–3 hours of work on its own files.
   - Anything under about 30 minutes rides along in a neighbouring lane, or the Coordinator does it. In v2.2, the TOWN lane spent $1.5 adding 3 CSS rules.
5. **Sonnet by default.**
   - Opus for the spec, the Coordinator, the integration review, and lanes that create a new system (e.g. cloud save, the phone shell).
   - Haiku only for small, mechanical, fully specified edits (e.g. one outfit in the dog art).
6. **Free checks before paid reviews.**
   - `copy`: banned words, emoji, semicolons in player text, browser dialogs.
   - The phone suites: 44 px taps, 15 px text, no sideways scroll.
   - A `grep` for duplicate top-level names.
7. **Test once at the right level.**
   - Lanes run `smoke`, their own suite, and the suites for the files they touched.
   - The Coordinator runs `all` and `phone` once after the last merge, then once more after the review fixes.
8. **Decide up front.**
   - The spec holds the data-model table, the cross-lane API table, the art-names table, the lane table and the merge order (see `V21.md` and `PHONE.md`).
   - Most merge-day fixes came from lanes guessing at each other's names.
9. **Don't wait on the owner.**
   - Decisions go to the Project manager with a recommendation.
   - With no answer in 5 minutes, take the recommendation and list it in the final report (the owner aims for auto coding).
10. **Push `main` only when green.** A push deploys GitHub Pages. Work in progress goes to an integration branch.
11. **Fresh context when a session gets big (owner, 17 Oct 2026).** A session can't run `/compact` on itself or on another session (a `/compact` sent with send_message arrives as a plain message). So a session whose context passes about **300k tokens** (`get_session` → `context_usage.used_tokens`) with more than about an hour of work left is handed over instead. Every step re-reads the whole context, so a 490k session pays about 5x per step what a fresh one does; below 300k a handover saves too little to be worth the extra steps:
   - At the next natural stopping point (tests run, work committed and pushed), it writes a handoff of 25 lines at most: the brief, what is done (commits), what is left, open decisions and the session IDs it talks to. It sends that to its parent with send_message: "HANDOFF: start my replacement".
   - The parent creates a fresh session with the same name, model and branch, gives it the original brief plus the handoff, tells anyone who messages the old session (other lanes, the Coordinator) the new ID, and archives the old session.
   - The Coordinator does this for its lanes and the Game Manager for the Coordinator. The hourly watchdog checks it: any working session past 300k gets "HANDOFF due at your next stopping point".
   - Never hand over in the middle of a merge, a test run or a push. A session that will finish within about 30 minutes finishes instead.
   - The Game Manager chat can't be replaced this way: the owner types `/compact` there.

## Setup that saves time

- **`.claude/settings.json` + `tools/session_start.sh`:** in every cloud session, this installs Playwright if it's missing and sets `NODE_PATH` and `PAW_ARGS`. Lanes can run tests from their first minute. The hook does nothing on the Mac.
- **Lane brief template:** setup (handled by the hook) → files you own → the spec section → tests to run → "commit on `lane/<name>`, push only that branch, no PRs" → "send your report (25 lines at most) to the Coordinator".
- **The Build Board** (https://claude.ai/artifact/Mk2ihLjRMZn1BA4AJ4KVzZ) is the progress page. The Coordinator updates it, and nobody needs to poll sessions to see progress.

## Release checklist (Coordinator)

1. Stub files and `ORDER.txt` entries on `main`.
2. Lane branches pushed.
3. Lanes started.
4. Merge in the spec's order, with `smoke` and the lane's suite after each.
5. Integration review.
6. Fixes.
7. `all` + `phone`.
8. CHANGELOG, TODO, README, CLAUDE.md.
9. Publish the claude.ai artifact (read it first).
10. Log the release in Studio.
11. Push `main` and check that the Pages deploy succeeded.
12. Archive every session from this release.
13. Send the final report to the Project manager.

## Project manager handoff (read this first if you're a new Project manager chat)

Since 13 Oct 2026 the Project manager session is called **Paw Haven · Game Manager**. It runs one team session per area (game design, art, UI/UX, QA).

You manage Paw Haven for the owner. You don't build. Start a fresh Coordinator session for each release, following the rules above.

**The owner's preferences:**
- **Times in JST** (the owner is in Japan).
- **Quality first:** quality and the game's style come before saving tokens.
- **No Fable from v2.6 on:** Fable is too costly for the owner's usage. Coordinators, specs, lanes and reviews use Opus (Sonnet or Haiku where the rules above allow). v2.5 was the last release run on Fable.
- **Effort levels:** `.claude/settings.json` sets `effortLevel: high` for every session in this repo (Coordinators, spec, art lanes, reviews). Routine work (fix batches, shop wiring, docs, test runs, screenshots) goes to the `paw-fixer` subagent (Opus, medium). Art goes to `paw-artist` and reviews to `paw-reviewer` (both Opus, high). Definitions are in `.claude/agents/`. The Project manager chat can run at medium with `/effort medium`.
- **Speed and quality over token cost:** lanes may use parallel subagents. Take screenshots before and after for every changed screen.
- **Decisions:** the owner aims for auto coding. Ask only real decisions, always in the AskUserQuestion choice window (2–4 options, recommendation first), never as plain-text A/B/C. If the owner has not answered in 5 minutes, take the recommendation and list it in the final report. This applies to every question, including releases. The same 5 minutes apply to approvals: a permission prompt that waits 5 minutes is not approved for the owner; the session takes the recommended path that doesn't need it and carries on, and every team prefers paths with no approval prompt (owner, 16 Oct 2026).
- **Pushing (owner's rule, 14 Oct 2026):** push automatically, without asking, to GitHub branches and to `main`, once the tests are green. A green `main` push deploys GitHub Pages, and that is expected. Then check the Pages run and report what went live.
- **Usage limit: resume at once.** When a session stops at the usage limit, it resumes right after the reset, without waiting for the owner. Each session that hits the limit sets a `send_later` for 2 minutes after the reset time, and the Game Manager keeps an hourly watchdog Routine that resumes any session still stopped. Since 13 Oct the owner wants **one team busy at a time** (the queue is in `docs/CLOUDFLARE_LOGIN.md`); the old cap was 4 Opus sessions at once (7 at once used the whole 5-hour limit in about 25 minutes on 13 Oct).
- **Stop means stop.** If the owner says "stop", stop at once: cancel scheduled check-ins, commit nothing, and ask what they meant.
- **Reports:** always send a final report at the end of every release; progress only when the owner asks. The final report is a claude.ai artifact in the game's own style, with real crayon dogs. To draw the dogs:
  - load `dogs/pawart_dogs.js` in node `vm` with a fake `window`, then call `PawArt.dog(key, {pose, outfit, age, sparkle})`;
  - inline the module's own `const css=` animation styles into the page.
  - Example: https://claude.ai/artifact/L39BrWspasZdsMkhNDKtKM
- **Notifications** come only from the Project manager chat. Other sessions never message the owner and are archived when their release ships.
- **GitHub:** push `main` only when green (it deploys Pages), then check that the Pages run succeeded. If runs sit unstarted, the owner fixes it from the Actions settings or by re-running the workflow by hand.
- **Progress page:** the Build Board, https://claude.ai/artifact/Mk2ihLjRMZn1BA4AJ4KVzZ (collections `lanes`, `stages`, `log`).
- **Releases:** log them in Studio, https://claude.ai/artifact/Raf3Fyx1pS2Gz9U55Wf5BS (collection `releases`).

**State after v2.4 (6 Oct 2026):**
- v2.4 "Shop Day" is live on GitHub Pages and on the claude.ai artifact (now a multi-file artifact, see CLAUDE.md "Publishing": `tools/artifact.js`, and a subagent does the required read of the live page).
- All build sessions are archived.
- Cloud save runs on the Cloudflare Worker `pawhaven-api` (`docs/CLOUDFLARE_LOGIN.md`). Supabase is gone since v2.9.1.
  - Anonymous sign-ins and email are on, with Confirm email off, so no emails are ever sent.
  - 5 test users (`pawhaven-test-1…5@example.com`) may still exist.
- The owner still has to check live sync (Realtime) once on two real phones, and open the claude.ai artifact once.
- v2.4 ran with 5 Opus lanes, each with its own fresh session, and a Fable coordinator that wrote the spec itself. Lanes did their own screenshot checks (desktop and phone, every breed, pose and age for the dog art) and reported in 25 lines. Three reviews (code, phone, art) ran as subagents of the coordinator.
- Next work comes from `TODO.md` (Shop Day, Phone and older sections) or whatever the owner asks for.

**State after v2.5 (7 Oct 2026):**
- v2.5 "Autumn & New Pups" is on `main`, GitHub Pages and the claude.ai artifact. Spec and as-built notes: `V25.md` (section 11). Review screenshots for the owner's report are kept by the Coordinator outside the repo (`game/shots_v25/` was removed before the release).
- Built with a Fable coordinator, 5 Opus feature lanes (SEASON ART, FESTIVAL ART, DOG ART, BREEDS, FESTIVAL) and 2 Opus fix lanes for the owner's v2.4 feedback (FIXES A, FIXES B), three reviews (code and phone on Opus subagents, art by the coordinator). From v2.6 on: no Fable (owner's usage), use the `.claude/agents/` definitions (paw-fixer, paw-artist, paw-reviewer).
- Git tags do not reach GitHub through the build container's proxy: the base reference `v25-base` is a branch. Tag it from a machine that can and delete the branch.
- GitHub returned "Internal Server Error" on every push for about two hours on 7 Oct (15:00 to 17:00Z); the retry loop in the coordinator's notes worked.
- The 5-hour usage limit stopped the coordinator for 90 minutes mid-release (15:20 to 16:50Z). Keep the Board truthful before it hits.

**State after v2.6 (8 Oct 2026):**
- v2.6 "Halloween 2026" is on `main` (`af7a135`), GitHub Pages (run 29) and the claude.ai artifact (version 22). The review screenshots are kept in commit `082ab6a` on `integration/v2.6`. Spec and as-built notes: `V26.md` (section 9). `game/shots_v26/` was removed before the release.
- Built by an Opus coordinator with 5 fresh Opus lanes (HW ART, SCENE ART, DOG ART, TOYS, HALLOWEEN), each in its own session. No Fable.
- Three `paw-reviewer` reviews (code, phone, art). Their fix batches went back to the lanes that own the files.
- The pop-up sells `ed: 2026` items only while `hwShopOpen()`. A Halloween 2027 needs new items and a `HW_WIN` entry (see `TODO.md`).

**State after v2.7 (14 Oct 2026):**
- v2.7 "Home & Pack" is on `main`, GitHub Pages and a **new** claude.ai artifact, https://claude.ai/artifact/MpRmzU43M3EmsZ5F8BXSxa (the owner's choice: the old artifact, Studio and the Build Board belong to another account and stay on v2.6; Studio was skipped). Spec and as-built notes: `V27.md` (section 10). The six report screenshots are kept in commit `3acbcce` on `integration/v2.7`; `game/shots_v27/` was removed before the release.
- Built by an Opus coordinator. HOME ART and mailbox were merged on 8 Oct; on 13–14 Oct SHELTER ART (a `paw-artist` subagent), HOME, PACK CARE and SHELTER (fresh Opus sessions), plus two extra teams: UI/UX (`lane/uiux-phone`, 20 phone clarity fixes) and ART (`lane/art-fixes`, Halloween art fixes). Lane branches are `lane/v27-*` because stale v2.1 `lane/home` and `lane/shelter` still exist on GitHub.
- The 5-hour usage limit stopped every session twice (13 Oct 11:40–15:40 UTC with 7 busy sessions, 14 Oct about 05:00–06:50 UTC). From 13 Oct the owner ran one team at a time, and the coordinator ran the three `paw-reviewer` reviews one at a time, each followed by its own fix batch (`paw-fixer` for phone, `paw-artist` for art).
- Final `all` + `phone --jobs 2`: 66 suites, 64 passed, 2 flaky (the `v27_shelter` flake was fixed afterwards). New suites: `v27_art`, `v27_scenes`, `v27_home`, `v27_pack`, `v27_shelter`, `v27_mailbox`, `v27_review` and their phone twins.
- `node dogs/check_identical.js` against `v27-base` shows only the intended Rainbow Collar star (3302 renders). Make `v28-base` from v2.7 `main` before the next release.
- Open items are in `TODO.md` "Home & Pack (v2.7)".

**State after v2.8 (16 Oct 2026):**
- v2.8 "Winter & New Year" (with the Japan scenery) is on `integration/v2.8`. Spec and as-built notes: `V28.md` (section 14).
- Built by an Opus coordinator with 7 lanes as its own subagents, one at a time: WINTER ART, SCENE ART, JAPAN SCENE ART and DOG ART on `paw-artist`, WINTER and FUJI HILL on Opus, NEW YEAR on Sonnet. Then three `paw-reviewer` reviews, each followed by its own fix batch. Lane branches are `lane/v28-*`. The owner's branch `claude/webgame-cloudflare-updates-1jo46d` was merged twice.
- The usage limit stopped work about six times; the coordinator resumed after each reset.
- Final `all` + `phone --jobs 2`: 74 suites, 71 passed, 3 flaky (`v27_home`, `v171_garden`, `v21_home`, all clean alone; see `TODO.md`), 0 failed. New suites: `v28_art`, `v28_dates`, `v28_scenes`, `v28_japan`, `v28_jp`, `v28_winter`, `v28_newyear`, `phone_v28_winter`.
- Make `v29-base` from v2.8 `main` before the next release.
- Open items are in `TODO.md` "Winter & New Year (v2.8)".

**State after v2.9 (16 Oct 2026):**
- v2.9 "All Together" (pack play and walks, photo mode, polish) is on `main`. Spec and as-built notes: `V29.md` (sections 5 and 6).
- Built by an Opus coordinator with three fresh Sonnet lane sessions (PACK, PHOTO, POLISH, about $6 each), then three `paw-reviewer` reviews and two fix batches (`paw-artist`, `paw-fixer`). Lane branches `lane/v29-*`, fixes on `fix/v29-review`, `v29-base` is v2.8.4 `main`.
- Three Opus reviewers in parallel next to a full test run hit the 5-hour usage limit (13:00 to 15:30 UTC). Run reviews one at a time, and don't run `all` while reviewers run (the load turned `v28_scenes` and `v27_review` red once).
- The art suites need the base refs locally: `git fetch origin integration/v2.4 v25-base v26-base v27-base v28-base` in a fresh clone.
- Make `v30-base` from v2.9 `main` before the next release.
- Open items are in `TODO.md` "All Together (v2.9)".

**State after v2.10 (17 Oct 2026):**
- v2.10 "Free to Roam" (every dog roams by its personality, petting one dog, ball play everywhere) is on `integration/v2.10`. Spec and as-built notes: `V210.md` (sections 5 and 6).
- Built by an Opus coordinator (handed over once under rule 11) with two lanes: ROAM on Opus (handed over once) and BALL on Sonnet. Then three `paw-reviewer` reviews in parallel and the fix batches: the BALL batch on `paw-fixer`, the ROAM fixes in the lane. Lane branches `lane/v210-*`, `v210-base` is a branch at `db73f22` (v2.9).
- Final `all` + `phone`: 89 suites (`all` + `phone --jobs 2`): 85 passed, 4 flaky (`phone_skill`, `phone_v25_fixes_b`, `v29_photo`, `v21_breed`, all passed on retry), 0 failed. New suites: `v210_roam`, `v210_ball`, `phone_v210_roam`, `phone_v210_ball`. `node dogs/check_identical.js v210-base`: 155344 renders, 0 differ.
- Make `v211-base` from v2.10 `main` before the next release.
- Open items are in `TODO.md` "Free to Roam (v2.10)".

**State after v2.11 (17 Oct 2026):**
- v2.11 "Tokyo Trip" (the Shinkansen to six Tokyo places with seven stamps, Dog Cards, seven new breeds for 21 in all) is on `integration/v2.11`. Spec and as-built notes: `V211.md` (sections 5 and 6).
- Built by an Opus coordinator (handed over once under rule 11) with three lane sessions: TRAVEL and CARDS on Opus, BREEDS on Sonnet, plus five `paw-artist` subagents (TOKYO ART D, TOKYO ART E, BREED ART, BREED ART 2 for the owner's four more breeds, and the art fix batch). Then three `paw-reviewer` reviews (code, phone, art) and the fix batches in the lanes. Lane branches `lane/v211-*`, art fixes on `fix/v211-art`, `v211-base` is a branch at `97a2fc0` (v2.10).
- Final `all` + `phone`: TESTNUMBERS. New suites: `v211_tokyo`, `v211_cards`, `v211_breeds`, `v211_art_d`, `v211_art_e`, `v211_dogs`, `phone_v211_tokyo`, `phone_v211_cards`. `node dogs/check_identical.js v211-base`: CHECKNUMBERS.
- The Worker changed (the Dog Card routes and the `cards` and `paws` tables): deploy it with `bash tools/cf_api_deploy.sh` and check with `bash tools/cf_api_smoke.sh`. The claude.ai artifact has eight supporting files now (`world_d.js` and `world_e.js` added). The site's new dog rows are not deployed (owner's go-ahead).
- Screenshots stay on the lane branches. CARDS and TOKYO ART E put theirs into the history through early merges (accepted); remove `game/shots_*` before a release.
- Make `v212-base` from v2.11 `main` before the next release.
- Open items are in `TODO.md` "Tokyo Trip (v2.11)".
