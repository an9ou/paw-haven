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

## The ten rules

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
   - With no answer in 20 minutes, take the recommendation and list it in the final report.
10. **Push `main` only when green.** A push deploys GitHub Pages. Work in progress goes to an integration branch.

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

You manage Paw Haven for the owner. You don't build. Start a fresh Coordinator session for each release, following the rules above.

**The owner's preferences:**
- **Times in JST** (the owner is in Japan).
- **Quality first:** quality and the game's style come before saving tokens.
- **Speed and quality over token cost:** lanes may use parallel subagents. Take screenshots before and after for every changed screen.
- **Decisions:** ask with the AskUserQuestion choice window (2–4 options, recommendation first), not plain text. If the owner says "if I don't answer in N minutes, pick the recommendation", schedule a `send_later` for that time and follow through.
- **Stop means stop.** If the owner says "stop", stop at once: cancel scheduled check-ins, commit nothing, and ask what they meant.
- **Reports:** only a final report, unless the owner asks for progress. The final report is a claude.ai artifact in the game's own style, with real crayon dogs. To draw the dogs:
  - load `dogs/pawart_dogs.js` in node `vm` with a fake `window`, then call `PawArt.dog(key, {pose, outfit, age, sparkle})`;
  - inline the module's own `const css=` animation styles into the page.
  - Example: https://claude.ai/artifact/L39BrWspasZdsMkhNDKtKM
- **Notifications** come only from the Project manager chat. Other sessions never message the owner and are archived when their release ships.
- **GitHub:** push `main` only when green (it deploys Pages), then check that the Pages run succeeded. If runs sit unstarted, the owner fixes it from the Actions settings or by re-running the workflow by hand.
- **Progress page:** the Build Board, https://claude.ai/artifact/Mk2ihLjRMZn1BA4AJ4KVzZ (collections `lanes`, `stages`, `log`).
- **Releases:** log them in Studio, https://claude.ai/artifact/Raf3Fyx1pS2Gz9U55Wf5BS (collection `releases`).

**State after v2.3 (6 Oct 2026):**
- v2.3 "Cozy Phones" is live on GitHub Pages and on the claude.ai artifact.
- All build sessions are archived.
- Supabase: the public URL and key are in `PHONE.md` and `game/src/22b_cloud_config.js`, and the tables are in `supabase/schema.sql`.
  - Anonymous sign-ins and email are on, with Confirm email off, so no emails are ever sent.
  - 5 test users (`pawhaven-test-1…5@example.com`) may still exist.
- The owner still has to check live sync (Realtime) once on two real phones.
- Next work comes from `TODO.md` (Phone v2.3 and older sections) or whatever the owner asks for.
