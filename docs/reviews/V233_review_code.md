# V2.33 "Helping paws": code review (branch claude/v233-helping-paws, HEAD a11125a7, against main)

Read-only review. I read V233.md (all of it), V219.md 0, CLAUDE.md, and the whole diff for cloudflare/worker.js, schema.sql, 60_helps.js, 60b_sleep.js and the hooks in 50_friends, 00_core, 07b_mailbox, 24c_badges, 48_dogdays, 49c_news, 53_welcome and 58_share, plus the test diffs. I ran no test suite. I checked query plans with node:sqlite against the new schema (file qp.mjs in the scratchpad).

## Must-fix

1. **cloudflare/schema.sql + worker.js `frList` / `hpSend`: full scans of friend_acts on hot paths.**
   - Both from_id indexes are partial (`where kind != 'sleep'` and `where kind = 'sleep'`). The planner cannot prove either condition for `select to_id, kind from friend_acts where from_id = ?1 and day = ?2`.
   - Result: `SCAN friend_acts`, so every `GET /friends` (up to 120/h per player) reads 30 days of everyone's helps and sleepovers.
   - The help pre-check `where from_id=?1 and to_id=?2 and kind=?3 and day=?4` (kind bound) runs as `SEARCH USING INDEX friend_acts_inbox (to_id=?)`. That reads every act sent to the recipient in 30 days. For the official account (everyone's friend, rows born claimed and kept 30 days) every help reads its whole pile.
   - Repro: create the schema in node:sqlite and run `EXPLAIN QUERY PLAN` on each query.
   - Fix: `create index if not exists friend_acts_from on friend_acts (from_id, day);`. Verified: both queries then `SEARCH ... USING INDEX friend_acts_from (from_id=? AND day=?)`. Optionally add a literal `and kind != 'sleep'` to the help pre-check so it uses the covering `friend_acts_pair`.
   - Pre-existing twin in the same function: `select to_id, kind from friend_events where from_id=?1 and day=?2` also does `SCAN friend_events`. Add `friend_events_from (from_id, day)` too.

## Should-fix

2. **Rolling back by redeploying the v2.32 Worker code (the "rolled-back Worker" case in V233.md 1) leaves bad stored data.**
   - Yards pushed while the gate was open hold `hp`. The v2.32 `frYard` rejects unknown keys, so `GET /friends/yard` answers `yard: null` and those yards cannot be visited until their owner pushes again. A player who has lapsed never pushes again.
   - Note-12 events have no `old` filter in v2.32, so they sit unclaimed on old copies' badges for 30 days.
   - Fix: write in V233.md and the release notes that rollback means env `HP_FROM=off` (the new code then answers exactly as v2.32). If code is ever rolled back, run:
     - `update yards set data = json_remove(data,'$.hp') where json_extract(data,'$.hp') is not null;`
     - `delete from friend_events where kind='note' and claimed_at is null and json_extract(data,'$.i') >= 12;`
3. **60b_sleep.js `HP_DO.sleep` and 50_friends.js `frInbox` `FR.pending`: waiting guests go stale and sit on the badge.**
   - A third or later guest stays unclaimed for up to 30 days. A popular player's queue grows by (n-2) a day.
   - Guests then arrive days or weeks late ("staying over today"), long after the sender's dog "came home by morning".
   - `FR.pending` counts them, so the Friends badge shows a number all day that nothing on the sheet clears.
   - Fix: claim and drop (postcard only, or nothing) a sleep act whose `ev.day` is before yesterday. Leave waiting guests out of `FR.pending`.
4. **Tests.**
   - test_v233_helps never asserts coins. Add:
     - on a friend-granted wish, coins rise by exactly the wish's DD_COIN;
     - 0 coins on a second grant or from another friend;
     - 0 coins on every helper send (B2-B9) and on guest Pet and home-by-morning.
   - test_v233_worker tests the unique indexes only by raw insert. `hpSend`'s catch path (a UNIQUE error answering 400 limit, the race answer) has no end-to-end check.
   - Nothing guards the query plan. Add an `explain query plan` check: no "SCAN friend_acts" for the sent query.
5. **48_dogdays.js `ddWishDone`, called from 60_helps.js `hpGot`: a friend can complete my wish mission.**
   - `trackAct('wish')` runs on a friend's grant. A friend's free pet or ball can therefore complete my daily wish mission (40 coins and a stamp), wish badges and notebook entries.
   - It is not a new coin source (one mission a day), but contract 0 says the only exception is the wish's own reward.
   - Confirm with the GM, or pass a flag so a friend grant skips `trackAct`.

## Nice-to-have

6. **50_friends.js `frAfterPush`: one refusal turns `hp` off for the whole load.** Any 400 bad on a yard that carries `hp` sets `FR.hpOld`, even when the cause is newer decor or an outfit (a later game against this Worker). Friends then see no can or bubble for the rest of the load. Fix: set `hpOld` only when the hp-less retry is what succeeds.
7. **worker.js `hpData`: snack wish accepted without a treat.** `{ w: 2 }` with no `a` passes. The game always sends `a`, but a direct API caller can grant an unnamed snack wish without giving a treat. Fix: require `a` when w is 2.
8. **50_friends.js `frChip`: changes behaviour while off.** The new `tight` one-line rule runs even when `hpOn()` is false, so the visit chip differs from v2.32.1 while the gate is off (contract 1). It is a harmless fit fix: accept it explicitly or gate it.
9. **58_share.js `shSVG`: a throw now loses the whole share.** `shOutfit`/`shWet` moved outside the try. A throw there now fails the whole share; before, it only dropped the dog from the picture.
10. **60_helps.js `hpFrame`: layout work every frame.** It reads rects, `getScreenCTM` and `offsetWidth` and writes styles every frame for the whole visit, even with no wish. Run it only while the bubble exists, or only on camera moves.
11. **60_helps.js `hpPgMap`: page gifts dropped at the first sync of a load.** This runs at the first sync of every load once `S.hp.pk` is set. A gift whose page is not in the book at that moment is dropped. If the page comes back, its gift is given again: no duplicate item (owns/includes checks), but a second "full page" toast. Fix: keep unmatched gifts aside, as `S.hp.pg` does.

## Checked and sound

- **Worker gate shut:** answers exactly as v2.32 on every route. New kinds, note 12, a snapshot `hp` and `acts` in a claim are 400 bad; `?hp=1` is ignored; no `hp` or new `sent` keys appear. Shut, `GET /friends/yard` strips a stored `hp`.
- **Input checks:** exact keys and ranges in `hpSnap`, `hpData`, `frNote(n)`, and claim `acts` (at most 30 ints, 1..1e15).
- **Permissions and privacy:** every SQL value is bound (only constants are interpolated). Friends-only and block checks run before every send and yard read. A claim touches only `to_id = me`. No user id, email or time leaves (acts carry fid, name indices and the Japan day).
- **Limits and cleanup:** a duplicate send answers 400 limit (pre-check, then UNIQUE). Official-account rows are born claimed. Remove and block delete unclaimed acts both ways; leave deletes all of mine; `frTidy` and the 30-day sweep cover acts. The deploy applies the schema before the Worker.
- **Mixed versions:** old copies on the new Worker, the new game on an old Worker, and the new game on an env-shut Worker all behave as the contract says.
- **Save:** `v233Fields` defaults and caps hold on broken data. `S.hp.ids` is saved before the claim, and a re-delivered act is only claimed again. The bowls, gotB and bond caps hold; a third guest waits.
- **Economy and rules:** the bag changes only after `{ ok: true }`. The snack list comes from `FR_GIFTS` food rows. A wish is granted once (`w.done`), with coins inside `DD_COIN_DAY`, so a second friend gets Bond only. The sleepover never hides, locks or changes my dog. The recipe, the `sleep` data, the snapshot `hp` and the share file hold no typed text or friend name. The generic page shows no name. No banned words.
- **Shared scope:** I checked every new top-level name for clashes; there are none. The hooks are inert while `hpOn()` is false (`slHome` and `slDraw` run but find empty lists). Listeners and timers are bounded. The 4 s tick is cheap.

## Not checked

- I ran no suite.
- Phone layout and art are the other reviewer's area.
- I did not check D1's own planner (I used node:sqlite; SQLite's partial-index rules are the same).
- Two devices on one account: reasoned only, the same class as v2.19 gifts. If a claim fails and a second device loads an older save, an act can apply on both; one save wins at sync.
- The device clock can reset `S.hp.bond`, like every device-day counter. The Worker still limits sends per real Japan day.
