# v2.19 code review (cross-part, c3f8ca7..1fd16d5, 1 Nov 2026)

Reviewer read the code; no suites, no Miniflare proof. Fix in the one fix batch, then re-run v219_friends, worker, site.

## Must-fix
1. **Login change leaves Friends on a stale identity / makes a stray guest.** 50_friends.js:93 (frApi), :226 (frLoad); worker.js:716, :798. An email player logs out (or a reset on another device gives 401 → clGone): the save stays (clOwner set), frApi → clEnsureUser POSTs /guest, a new guest; GET /friends gives me:null, frLoad keeps the old fid/code; the sheet shows the old code, list empty, visits 404, yard PUT 'bad'. The Worker lets a caller with no friend_ids row add/send, writing a friends row the other side can't see or remove (counts to their 50). Fix: frApi doesn't call clEnsureUser while clOwner() is set (treat as offline / "log in"); frLoad clears fid, code, name when me is null or me.fid !== S.fr.fid; /friends/add and /friends/send return 'bad' unless frMine(me.id).
2. **Unclaimed gifts/walks starve pets and notes.** worker.js:832; 50_friends.js:965, :1106. Inbox returns the oldest 30 unclaimed; gifts over 5/day and walks over 3/day stay unclaimed on purpose, so with ~8 active friends the 30 oldest are all gifts/walks within days and pets/notes never arrive (badge stuck at 9+). Fix (Worker only): `order by (e.kind in ('gift','walk')), e.id limit 30`, or a limit per kind.

## Nice-to-have
3. Client day = device day (localISO, frToday 50_friends.js:599), Worker day = JST: row doodles / frSentToday disagree outside Japan. Use jstISO() in v219Fields and frToday.
4. Runner "Head home early" at second 0 still calls frWalkEnd (18_mod_walk_toys.js:53): +10 coins and a walk letter. Pay/send only when the walk covered ground (classic needs frac > 0.05).
5. Leave Friends (50_friends.js:512) `S.fr = {}` resets today's caps: leave + re-add re-earns 20 coins, 5 Bond, a gift. Keep day, walkDay, pets, walks, walked, gift.
6. Walk letter may name the wrong dog (50_friends.js:1112: receiver's current frYardDogs()[d.dog], walker's list up to a day old). Resolve against the last snapshot sent, or fall back to NAME().
7. /friends/send rate limit comes after DB work (worker.js:798-805); bad bodies never count. Check `limited` right after the frOnly shape check.
8. `friend=` stays in the URL (50_friends.js:76): each reload reopens Add and toasts "already friends". history.replaceState to strip it once used.
9. Privacy: docs/itch/PRIVACY.md:9 "We do not see that save" vs the guest cloud copy (site privacy.collect.guest admits it); privacy.delete doesn't mention Friends data (rows only go via frTidy, ~2% of requests). Align, and add Friends to the delete steps or run frTidy in the manual delete.
10. At release: NEWS_V219.date (49c_news.js) and POLICY_DATE (tools/site_i18n.js) = the launch date.
11. mods/qr.js (57 KB) ships to everyone while FR_LIVE=false; could lazy-load on the first card draw.

## Checked, fine
Auth on every /friends route; no user_id/email/time in responses; block = not_found both ways, survives code rotation and Leave; all SQL bound; frCode rejection sampling right; unique indexes match the per-day rules; yard 16 KB cap checked on read; 30-day delete only on inbox read. FR_NOTES 12 / FR_GIFTS 47 / FR_DECOR 31 / FR_HOUSES 14 match FR_LIM and orderOk ties them to FOOD, CROPS_FB, HM_DECOR, HOUSES; no Golden Bone, Fresh Water or people food. Migration additive; gifts leave the bag only after ok; coins 10×2 before BOOST; walk guest one slot, no stats; no double claim; FR_LIVE=false hides button, tray, walk row, Settings row, news and every call; FR_LIVE=true safe at load (no TDZ); every string esc()'d; the visit can't change either save beyond Bond and S.fr; qr.js stateless. Invite page validates the code ^DOG-[A-HJKMNP-Z2-9]{5}$, noindex meta + header, CSP fine, friend= redirect can't loop. Words rule clean.
