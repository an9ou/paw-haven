# v2.30 "Better together": final review before the launch (18 Nov 2026)

Branch `claude/v230-together`. Launch: 25 Nov 2026 00:00 JST (owner's date). Contract: `V230.md`.
Scope: the whole v2.30 diff against `origin/main` after merging it in (v2.31.12): `game/src/58_invite.js`, `58b_goal.js`,
`game/css/60_together.css`, the bandana (`dogs/pawart_dogs.js`, `world/pawart_world_b.js`), `cloudflare/worker.js` and `schema.sql`, the tests.
Nothing was merged to `main`, deployed or pushed to itch.io. The live Worker has no v2.30 routes today (`GET /town/goal` answers `404 not_found`).

## 1. The merge

`origin/main` was 97 commits ahead (v2.31.x fixes, test rounds, Winter Market dates, keyboard and screen readers, the Fable review fixes).

| File | How it was resolved |
| --- | --- |
| `game/css/ORDER.txt`, `game/src/ORDER.txt` | Both kept: `60_share.css` then `60_together.css`; `58_share.js` then `58_invite.js`, `58b_goal.js`. |
| `game/run_tests.js` | Both kept (`v2291_balance`, `v230_together`, `v230_worker`). |
| `game/src/49c_news.js` | All three entries kept (`NEWS_V2291`, `NEWS_V231`, `NEWS_V230` dated 2026-11-25). `nwSort()` and the `__paw.nw` test hook carry both sides. |
| `game/i18n/*.json` (12 files) | Both sides' keys, in key order. Checked against a three-way key merge: 10,215 keys each, none missing, none extra, none changed. |
| `game/fonts/i18n/zh-Hans.*`, `yue.*` | Regenerated from the merged tables (`tools/i18n_fonts.js --for game`, all six languages in the recipe's order). `ja` came out equal to main's, `ko`, `zh-Hant` and `th` equal to the branch's: the tool is byte-stable here. |
| `game/i18n/packed.js` | Regenerated (`tools/i18n_pack.js`), never merged by hand. `--check` is clean. |

Merged without conflict and read through: `game/src/00_core.js` (v2.30's `toastSheetTop` change sits beside main's `toastHard` / `toastSoft`,
the focus trap and `a11yBack`), `cloudflare/worker.js` (main's security pass and v2.30's routes; `tidy()` carries both), `50_friends.js`,
`55_projects.js`. `FR_LIM` did not change on either side; `DC_LIM.outfit` goes 58 to 59 (the Friendship Bandana appended last, nothing
reordered). `CHANGELOG.md` had no conflict: v2.30 had no row yet, one is added now.

Main's newer behaviour after the merge: `phone_shell` (toast placement, the phone chips), `v2171_market` (`fmMain`, `fmTentFrom`),
`share_dog`, `v229_story`, `coin_juice`, `v216_first_week`, `v2291_balance` and `test_gate` were run on the merged branch (results in section 4).

## 2. Findings that were fixed

| # | Severity | Where | What happened | Fix |
| --- | --- | --- | --- | --- |
| 1 | High | `cloudflare/worker.js:1552` (`GET /town/goal`, the `owed` lookup), `cloudflare/schema.sql` | The lookup of an account's own months filtered `town_goal_users` by `user_id`, but the table's only key is `(month, user_id)`. SQLite's plan was `SCAN u`: every row of the table read on each call. The game calls this route on every game load, on the Square and when the sheet opens, for every cloud player (guests too). With 2,000 players a month the table holds up to 26,000 rows after a year, read in full thousands of times a day. D1 bills and limits rows read, and the limit is shared with cloud saves. | Index `town_goal_users_user (user_id, month)` in `schema.sql` (a new index on a new table; `cf_api_deploy.sh` makes it). The plan is now `SEARCH u USING INDEX`. `v230_worker` fails if the plan scans again. |
| 2 | Medium | `game/src/50_friends.js:96` (`frReadInvite`), `:806` (`frInviteTry`), `:110` (`frGuideHold`) | The code from `/play/?friend=DOG-XXXXX` lived in memory only and was taken off the address at once, while the add card waits until Puppy's first day with Gerald is over (about six minutes). A new player who reloaded, or whose phone dropped the tab, or who came back later, lost the code. No add card, no invite row, no bandana for either player. This is the main path of the invite gift. | `fiLinkKeep()` in `58_invite.js` keeps the code in the save (`S.fi.inv`, additive) until the add card has been shown once, so a reload still never opens Add a second time. Only while `btOn()`. An add that uses the code lets it go too (`fiLinkDone`). Suite section 8 plays it: code kept, reload, code back, first day over, add card pre-filled, the Worker records the invite, a later reload opens nothing. |
| 3 | Medium | `cloudflare/worker.js:130` (`route`), `:1563` (`BT_FROM`) | The game is gated by date, the Worker was not: from the deploy (days before the launch) anyone with a guest token could post belly rubs or make invite rows. November's count could start, or be filled, before the launch, and a player with a device clock set ahead got the features early. | The four routes answer `404 not_found` with `soon: true` until `BT_FROM` (the launch at 00:00 JST less 10 minutes for a fast device clock). No rate row, no count. The game already reads that answer as "not here yet" and keeps what is waiting. The Worker variable `BT_FROM` moves the gate without new code. `v230_worker` fails when `BT_FROM` and `NEWS_V230.date` disagree. |
| 4 | Low | `game/src/49c_news.js:268` (`nwOpen`) | v2.30 opens a week after v2.31, so the newer entry has the smaller id. The automatic What's new sheet picked "not seen" by comparing ids. On 25 Nov it still led with v2.30 (by its fallback), but a later small entry would have led with v2.31 "Share my dog" again for everyone who had seen it. | "Not seen" is read from the list's own order (date, then version) when the entry last seen is in the list; the id compare stays as the fallback. Five checks in `v230_together`. `v2291_balance` (main's lead rules) still passes. |
| 5 | Low (test) | `game/test_v230_together.js:39`, `:43` | After the merge the suite crashed on the title: main's v2.31 title has one Play button (`#tPlay`). | The suite accepts `#tPlay`, as main's `test_promo.js` does. |
| 6 | Low (test, red on main) | `game/test_v2182_news.js:23`, `:32` | `v2182_news` fails on main since 18 Nov: its newest id stopped at 2.25, and its icon count took the five entries that share 18 Nov as one. | The newest id is 2.31 from 18 Nov and 2.30 from 25 Nov; the icon check reads the lead entry. Green. |

Also added: one line in `tools/cf_api_smoke.sh` (the v2.30 routes answer, shut or open), `docs/FILES.md` (the v2.30 line), the `CHANGELOG.md` row.

## 3. Checked and found right

- **Invite gift, once each.** One row per new player (`new_id` is the key; a second call is `409 used`). The game grants per save (`S.fi.mine`,
  the row tokens in `S.fi.thx`, `fiOwns()` before `pmGive`), so a second poll, a second device or a replayed answer adds no second bandana.
- **Abuse.** Self-invite: `400 self`; with a second account it needs a second email address and gives one look. Many accounts: 5 new rows a
  Japan day per IP, credits only for new players with an email account, 10 thank-yous per inviter. Old accounts: `409 not_new` after 7 days,
  and the inviter must be the older account. Replays: `used`. A guest: `gift: 'later'`, the kind waiting card and letter, the bandana when the
  account gets an email (same user id). No cloud: nothing shows. Offline, 401, 429, 5xx: `S.fi.link` is kept and asked again on the next start.
- **Town count under concurrency.** One post per account per 2 minutes through an atomic upsert, so the account's day row has no race. The IP's
  share is one atomic upsert with `returning`. The month's total, `done_at` and the account's row change in one D1 batch; `done_at` is set once.
- **D1 cost** after fix 1: every query on the new routes is a key or index lookup (plans printed and read). `btTidy` scans run from `tidy()`
  only, about once in 1,000 requests.
- **Before 25 Nov:** `btOn()` is false, so no Friends line, no board note, no Town projects link, no news entry, and the suite counts zero
  requests to the new routes. After fix 3 the Worker refuses them too. **After the goal is reached:** the count goes on, the bar stays full,
  the sheet says the town did it, and anyone who takes part later in the month still gets the treat bag, once.
- **Japan time:** the Worker's day and month are JST (`dcDay`); the game's gate is `jstISO()`; "So close!" uses the Worker's month, never
  the device clock.
- **Privacy:** the routes send `{ code }` and `{ n }` only; no typed text. Answers carry friend names (two Dog Card words) and an opaque row
  token, never a user id, an email or a time. Stored: `invites (new_id, inviter_id, at)`, `town_goal_users (month, user_id, n)`, and day-long
  rate rows keyed by IP, as the older routes do.
- **Old saves:** `fiFields` and `glFields` are additive, odd values are tidied, `v` stays 1.
- **Layout:** fit step `bt` plus the news and Friends steps, 12 languages at 5 sizes: 900 states, 0 findings. Looked at by eye at 360x640 and
  1280x720: the v2.30 news page (en, ja, de, th, fr, yue), the cards, the goal sheet, a letter in Thai. On a phone the board's note is off
  screen until "Look right"; after it the note is on screen and a real tap opens the sheet (its tap box is 58 x 66 px). Town projects has the link either way.
- **Art:** main did not touch `dogs/` or `world/` since the branch point, so the branch's `connect_check` and fill sweep results stand.

## 4. Suites on the merged branch

One suite at a time, `NODE_PATH=$(npm root -g) node game/run_tests.js <suite> --jobs 1`, on the final tree.

| Suite | Result |
| --- | --- |
| `v230_worker` | pass, 86 checks (run directly; the runner prints 0 for node suites). 10 new: the launch gate, the `owed` plan |
| `v230_together` | pass, 88 checks, three runs in a row. 16 new: the news lead, the invite code over a reload |
| `worker`, `promo_worker`, `v224_worker`, `test_gate` | pass |
| `promo` | pass, 90 |
| `v219_friends` | pass, 350 (once flaky before the fixes: row h in section 5) |
| `smoke` | pass, 35 |
| `i18n`, `copy` | pass. `i18n_extract --check` and `i18n_pack --check` clean, 12 languages at 10,215 of 10,215 keys |
| `itch_build` | pass, 30 |
| `v211_cards` | pass, 82 |
| `v2182_news` | pass, 33 (red on main: fix 6) |
| `i18n_fit`, steps `bt`, `nw`, `fr` | pass: 12 languages x 5 sizes, 900 states, 0 findings |
| Main's newer behaviour: `phone_shell` 203, `v2171_market` 81, `share_dog` 60, `v229_story` 169, `coin_juice` 89, `v216_first_week` 120, `v227_projects` 75 | pass |
| `v2291_balance` | **1 of 18 fails, the same on `origin/main` today** (run on a copy of main): "launch day with v2.29 unseen shows v2.29" gets "Share my dog", because on 18 Nov the test's "today" is also v2.31's date. Passes again from 19 Nov. Not changed. |

A note for other suites: `page.reload()` of the `file://` harness sometimes comes back with an empty `localStorage` (known from
`test_promo.js`). The new section 8 lost its save that way twice under load, so it reloads as `test_promo.js` does: a fresh page on a copy
of the storage.

## 5. Left as it is

| # | Severity | What | Why it is left |
| --- | --- | --- | --- |
| a | Owner | **November has 6 days of v2.30 for a goal of 10,000.** That is 1,667 belly rubs a day; one account adds 150 a day at most. A missed month ends with the kind "So close!" letter on 1 Dec. | A design choice. The Worker variable `TOWN_GOAL` can lower the first goal, but it must be set before the launch (the goal is fixed when the month's first belly rub arrives) and taken away before 1 Dec. |
| b | Owner | **The privacy page has no line for invites or the town goal** (`site/`, 12 languages, a site deploy). | Outside this branch. Suggested text below. |
| c | Low | 5 new invite rows per IP a day can delay a real invite on a carrier's shared address. | The game asks again on every start inside the 7 days. Raising it weakens the only cap on account piles. |
| d | Low | IPv6 address rotation can lift the town count past the per-IP cap. | Nothing of value rides on the count (one treat bag a month). |
| e | Low | Leave Friends does not remove the invite row (it goes with the account). | Dropping it would take a waiting bandana from the other player. The privacy line says so. |
| f | Low | A reset save on an old account gets every owed treat bag at once (up to 12), each with a toast. | Rare, and a kind surprise. |
| g | Low | While offline the game retries its post every 30 s. | The request fails on the device and never reaches the Worker. |
| h | Note | `v219_friends` failed once and passed on its rerun: "three friend dogs: no dog drawn over another" at 360x640, a sampled check of roaming dogs. | Not touched by v2.30. |
| i | Note | Trying v2.30 on the live Worker before the launch needs the Worker variable `BT_FROM=0`, and every test belly rub counts for November. | Use the suites (local D1) or take the test rows out before the launch. |

Suggested privacy lines (English; the site's 11 other languages follow):

- Friends: "**Invites:** when a new player joins through your invite link and adds you, we keep that these two accounts are linked by the
  invite, so both get the Friendship Bandana. It is deleted when either account is deleted."
- A new short section: "**Town goal:** we keep how many belly rubs your game added each month, for about a year, so the town's treat bag
  can reach you. Nobody else sees your number. The board shows only the town's total."

## 6. For the launch

1. Owner's go-ahead for the merge to `main` (a content release) and for the Worker deploy.
2. `bash tools/cf_api_deploy.sh`, then `bash tools/cf_api_smoke.sh`. Against the live Worker of today the deploy adds: the tables `invites`
   (index `invites_inviter`), `town_goal`, `town_goal_users` (index `town_goal_users_user`); the routes `POST /invite/join`,
   `GET /invite/gifts`, `POST /town/goal`, `GET /town/goal`, shut until 24 Nov 23:50 JST; `DC_LIM.outfit` 58 to 59; `btTidy` inside `tidy()`.
   No column is added, nothing existing changes.
3. If the launch date moves: `NEWS_V230.date` and the Worker's `BT_FROM` together (or the Worker variable `BT_FROM`).
4. The site: the privacy lines above and, if wanted, a word about the bandana on the `/f/` invite page (owner's go-ahead, site deploy).
5. The version line at the top of `CLAUDE.md` (left for the release step).
