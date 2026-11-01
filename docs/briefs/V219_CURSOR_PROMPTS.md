# v2.19 "Friends first": prompts for Cursor

Paste one prompt per Cursor task. The work order is in issue #3:
- Part 1 (#4) starts now.
- Part 6 (#9) can run beside parts 2 to 5 once #4 is merged.
- Every other part starts only after the part before it is merged.

Send the PR number to the Game Manager. The Game Manager reviews it, and the owner merges.

## Progress (1 Nov 2026)

| Part | Issue | Branch | Who | State |
| --- | --- | --- | --- | --- |
| 0 Art `PA.FRIENDS.*` | — | — | Claude | done, on `main` |
| Design contract `V219.md`, `AGENTS.md`, issues | #3 | — | Claude | done |
| 1 Worker and D1 | #4 | `cursor/v219-worker` | Cursor | ready to start |
| 2 Friend codes and the Friends sheet | #5 | `cursor/v219-friends-sheet` | Cursor | waits for #4 |
| 3 Yard visits, pets and notes | #6 | `cursor/v219-visits` | Cursor | waits for #5 |
| 4 Gifts | #7 | `cursor/v219-gifts` | Cursor | waits for #6 |
| 5 Walk together | #8 | `cursor/v219-walk` | Cursor | waits for #7 |
| 6 Invite page and privacy | #9 | `cursor/v219-invite` | Cursor | waits for #4 (then runs in parallel) |
| 7 Translations, NEWS, reviews, deploy, release | — | — | Claude | after all are merged, on the owner's date |

## Shared header (the same for every prompt)

```
You are working on Doodle Doggo (repo an9ou/paw-haven), a cozy browser game.
Before coding, read AGENTS.md, CLAUDE.md, V219.md and the GitHub issue named below, in full. The issue is your scope; V219.md is the contract.
Rules:
- One branch, one PR into main.
- Never push to main and never run tools/cf_* or tools/itch_push.sh.
- English only, through tt('fr.*', '...').
- No typed text from players ever goes to the server.
- Save changes are additive in migrate() (v219Fields), and S.v stays 1.
- Never return user_id or an email from the Worker.
- No new art: use PawArt.FRIENDS.* or an existing icon with // TODO art.
- Run the test suites one at a time and paste every summary table into the PR description.
- If V219.md looks wrong or unclear, don't invent a design. Write the question in the PR description.
```

## Part 1: Worker and D1 (#4)

```
[shared header]
Task: implement GitHub issue #4 "v2.19 part 1: Worker and D1 for friends". Server only, no client code.
Branch: cursor/v219-worker. Files: cloudflare/worker.js, cloudflare/schema.sql, game/test_worker.js.
Must get right (the review checks each one):
1. The schema is safe to re-run (create table if not exists / create index if not exists): friend_ids, friends, friend_blocks, yards and friend_events, with the unique rules and the index from V219.md section 1.
2. All 12 routes, including POST /friends/leave, with the limits from the V219.md table, reusing the existing auth helper, limited() and the JST day helper.
3. Codes: DOG- plus 5 characters from ABCDEFGHJKMNPQRSTUVWXYZ23456789, made with crypto.getRandomValues and retried on a clash. Input is case-insensitive, and the spaces and the DOG- prefix are optional.
4. A block in either direction answers not_found. Add misses count toward the add limits (10/h per user, 30/h per IP). Either side at 50 friends answers full.
5. The send limits are per Japan day: pet, note and walk once per (from, to, kind, day), and a gift once per (from, day). Only friends can send.
6. Next to DC_LIM, put FR_LIM = { notes: 12, gifts, decor, houses }, counted from FOOD / the garden tables, HM_DECOR and HOUSES. Note in the PR that part 2 keeps them in step.
7. Snapshot checks: Dog Card dog checks, decor x 0-1200 and y 0-800 as integers, at most 40 decor, at most 5 dogs, 16 KB at most. Anything else answers bad.
8. Privacy: no user_id, no email and no exact timestamp in any response. seen is only today / week / older. Test this on the raw JSON text of every route.
9. Cleanup: remove and block delete the unclaimed events between the two. leave deletes everything of mine. An inbox read deletes events older than 30 days.
Tests: node game/run_tests.js worker, then node game/run_tests.js cloud.
PR description: the summary tables, plus a list of every place you departed from V219.md and why.
```

## Part 2: friend codes and the Friends sheet (#5)

```
[shared header]
Task: implement GitHub issue #5 "v2.19 part 2: friend codes and the Friends sheet". Start from the latest main (part 1 is merged).
Branch: cursor/v219-friends-sheet. New file game/src/50_friends.js (tag fr), added to game/src/ORDER.txt after 49c_news.js.
Read the art coordinates in the comment on issue #5 before drawing anything with PawArt.FRIENDS.
Must get right:
1. frOn() is false on the claude.ai artifact (clArtifact()) and under the test harness, unless prefs.frTest or window.__pawCloudMock is set.
2. v219Fields(s) gives S.fr exactly as in V219.md section 8. The daily counters reset on a new localISO() day, and an old save loads.
3. FR_NOTES, FR_DECOR, FR_HOUSES and FR_GIFTS are explicit append-only arrays with the warning comment. FR_GIFTS holds dog-safe consumables only. FR_LIM in cloudflare/worker.js matches their lengths, with a test asserting that.
4. A Friends button in the phone More tray and the desktop "..." menu next to Daily missions, with an inbox count badge.
5. A first-open name pick from DC_WORDS_A x DC_WORDS_B (wheels, Random, preview; the Dog Card name is the default), then the sheet: my card with the QR, Share (falling back to the clipboard), Copy, New code with its confirm; Add a friend (DOG- fixed plus 5 boxes, no 0/O/1/I) with the four toasts; the friend list (sorted, with the leader head, Visit / Gift as "Coming soon", the three doodles, and "..." with Remove and Block); offline (the offline line and the cached list).
6. mods/qr.js: a vendored MIT QR encoder with its licence header kept and no network calls, drawn as SVG rects in pencil colour.
7. ?friend= or #friend= pre-fills the add card. For a new player it shows only after adoption and the first-day guide.
8. The yard snapshot is PUT at most every 10 minutes, after a cloud push, only with S.fr.fid. Its dogs come from the Dog Card helpers, the leader first. It never holds a typed dog name.
9. Inbox: only note events become postcard letters in this part, and then they are claimed. Leave pet, gift and walk unclaimed, but count them in the badge.
10. "Leave Friends" in Settings, behind a confirm, calls POST /friends/leave and resets S.fr. The guest "make an account" nudge shows once.
11. Phone 390x844 and 360x740: no sideways scroll, taps of 44 px or more, nothing under the phone bar.
Tests: the new suite v219_friends (game/test_v219_friends.js, registered in game/run_tests.js, group all, with an in-memory cloud mock). Then run v219_friends, smoke, cloud, phone_shell and worker, one at a time.
PR: the summaries, plus screenshots at 390x844 and 1280x720 (the name pick, my card, the friend list).
```

## Part 3: yard visits, pets and paw-print notes (#6)

```
[shared header]
Task: implement GitHub issue #6 "v2.19 part 3: yard visits, pets and paw-print notes". Start from the latest main (part 2 is merged). Extend game/src/50_friends.js.
Branch: cursor/v219-visits.
Must get right:
1. Visit fetches GET /friends/yard?fid=, caches it in S.fr.yards[fid] with the day, and enters cur.mode = 'fryard'. With no snapshot: the "still being tidied" toast, and stay home.
2. The scene uses their house (FR_HOUSES), their decor at the saved positions (FR_DECOR) and their season. Their dogs roam like Dog Card visitors (dcDraw), and my leader comes along. It has the "<name>'s yard" chip, "Leave a paw print" and "Go home".
3. Read-only: the garden, mailbox, missions, shop doors, decorating and the Care actions are hidden or inert. The phone bar stays, and Map goes home. Going home (button, Map or the app going to the background) restores the normal yard.
4. Pet: hearts, a happy pose and a personality say(). The first pet per friend per day sends pet. On ok my leader gets +1 Bond, for at most 5 friends a day (S.fr.pets).
5. Note: a pick from the 12 FR_NOTES, sent as { kind: 'note', data: { i } }, then the paw stamp on the path and the toast. Once per friend per day; then the button reads "Paw print left today".
6. Receiving: a day's pets merge into one letter ("X visited and petted Pip. +1 Bond", "X and 2 friends visited..."). Each claimed pet gives +1 Bond, at most 5 a day (S.fr.gotPets). Note letters get the paw doodle.
7. Test: a deep compare of S before and after a visit differs only in Bond and S.fr.
Tests: extend v219_friends. Then run v219_friends, smoke, v27_mailbox, phone_v27_mailbox and phone_shell, one at a time.
PR: the summaries, plus screenshots of a friend's yard at 390x844, 360x740 and 1280x720.
```

## Part 4: gifts (#7)

```
[shared header]
Task: implement GitHub issue #7 "v2.19 part 4: gifts". Start from the latest main (part 3 is merged). Extend game/src/50_friends.js.
Branch: cursor/v219-gifts.
Must get right:
1. The gift sheet opens from the friend-row Gift button and from "Send a gift" in a friend's yard. It shows only the FR_GIFTS items I own (count >= 1), with icons and counts, and the empty-bag line.
2. Confirm "Send 1 {item} to {friend}?", then POST /friends/send { kind: 'gift', data: { i, n: 1 } }. Take 1 from the bag ONLY on ok, then the wrap animation and the toast. On limit or a network error the bag stays the same.
3. One gift a day in all (S.fr.gift). After that the Gift buttons read "Sent today".
4. Receiving: a gift event becomes a mailbox gift letter through the existing mailPush({ kind: 'gift', gift: { cat, id, n: 1 } }), so Collect works unchanged. At most 5 a day (S.fr.gotGifts); the rest stay unclaimed until tomorrow.
5. Check every FR_GIFTS entry against the game's own food-safety rules, and list anything removed in the PR. Never coins, toys, clothes, dogs or puppies.
Tests: extend v219_friends. Then run v219_friends, smoke, v27_mailbox and phone_v27_mailbox, one at a time.
PR: the summaries, plus screenshots of the gift sheet and a gift letter at 390x844, 360x740 and 1280x720.
```

## Part 5: walk together (#8)

```
[shared header]
Task: implement GitHub issue #8 "v2.19 part 5: walk together". Start from the latest main (part 4 is merged).
Branch: cursor/v219-walk.
Must get right:
1. The route-picker row "Walk with a friend's dog" lists my friends' snapshot dogs (cached, fetched at most once a day per friend). "Just us" is the default, and the choice is stored in S.fr.guest = { fid, dog }. The row is hidden when Friends is off or I have no friends. It reads "Your pack is full today" and is disabled when the pack is full.
2. The guest is one more o.pack follower with friend: true, converted like pkWalkLooks. It is drawn with PawArt.FRIENDS.ribbon() and never goes over the pack maximum. mods/walkrun.js must not read S or localStorage: everything comes through o.
3. End of walk: +10 coins for at most 2 friend walks a day (S.fr.walkDay / S.fr.walks), before BOOST, with the summary line "Walked with X's Mochi: +10". Then send { kind: 'walk', data: { t?, dog, mine } } once per friend per day. A repeat walk with the same friend sends nothing and pays nothing. Clear S.fr.guest afterwards.
4. Receiving: walk letters, with the treasure as a gift to Collect or just the letter. At most 3 a day (S.fr.gotWalks).
5. Economy: friends add at most 20 coins a day before BOOST. Add an assertion where the daily income sum is tested (game/test_v215_tracks.js or similar) with the friend bonus at its cap, showing walks stay the main income.
Tests: extend v219_friends. Then run v219_friends, smoke, phone_walk, v215_tracks and the other walk suites, one at a time.
PR: the summaries, plus a screenshot of the guest dog with its ribbon in a walk at 390x844.
```

## Part 6: invite page and privacy (#9)

```
[shared header]
Task: implement GitHub issue #9 "v2.19 part 6: invite link page on doodledoggo.app and privacy text". Start from the latest main (part 1 is merged). Site only: site/, tools/cf_site.js, site/privacy.html, docs/itch/PRIVACY.md, game/test_site*.js. No game client changes.
Branch: cursor/v219-invite.
Must get right:
1. /f/<code> is case-insensitive. It is a crayon page in the site's style (header nav, peeking dog) saying "A friend invited you to Doodle Doggo!", with the code big, "Play here" (/play/?friend=CODE) and "Play on itch.io" with the type-it-in note. A bad code shows the same page with no code, and only "Play here".
2. No API calls and no third-party requests; CSP default-src 'self' stays. Link-preview meta tags use the existing logo-1200x630.png.
3. The site's own language pick and URL prefixes, as on the other pages. Add English strings to the site string tables only; Claude translates.
4. /play/ passes ?friend= on to the game exactly as it passes lang, and only when it matches ^DOG-[A-HJ-NP-Z2-9]{5}$ (case-insensitive). Anything else is dropped, so it can never be injected.
5. A "Friends" section in site/privacy.html and docs/itch/PRIVACY.md, in short plain sentences, covering all six points in the issue. Update "last updated".
Tests: extend the site suite (English and one other language, a bad code, the Play link, /play/ forwarding with a good code and with <script>). Run node game/run_tests.js site.
PR: the summary, plus screenshots of /f/DOG-ABCDE at 390 and 1280.
```

## After a review asks for fixes

```
Read the review on PR #<n> (a numbered list of fixes from Claude). Fix every item on the same branch, with no other changes. Re-run the suites the issue names, one at a time. Then reply on the PR with one line per item (what you changed, or why it can't be done) and the new summary tables.
```
