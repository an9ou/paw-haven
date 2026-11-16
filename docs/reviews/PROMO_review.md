# Gift codes (v2.25.5, `claude/promo-codes`): review and fix batch

Review of `claude/promo-codes` at 167db2b3, 16 Nov 2026. Contract: `PROMO.md`; items: `docs/design/promo-items.md`.

Owner's decisions (16 Nov 2026), kept as they are:
- One code per account per batch.
- A code may give an item that is also sold in town; `tools/promo.sh` warns on stderr.
- iOS / Android: ignored for now; `PROMO_UI` stays as it is (no change).

## Findings

1. **`tools/promo.sh` batch ids collide.** `batch` never checked D1 for an existing batch and keyed batches only by PREFIX, so a second
   `batch GIFT 100` later shares the first one's batch: a player who used a December code gets 409 `used` on the new one, and `stats` /
   `disable` cover both. Fix: the batch id is PREFIX plus the creation Japan date (`GIFT-20261116`); `batch` asks D1 first and refuses an id that
   exists; `stats` / `disable` / `enable` take the batch id; `PROMO.md` updated.
   Status: fixed: `batch` stores the batch id PREFIX-YYYYMMDD (Japan day), asks D1 first (`select count(*) ... where batch = ?1`) and refuses an id that exists (exit 2, nothing made); `stats` / `disable` / `enable` take the batch id (a bare PREFIX matches nothing and says so); `PROMO.md` 1 and 4. Tests: `promo_worker` 12-13 (DRY_RUN bodies, and for real against a local D1 stand-in via `PROMO_D1_API`: a 45-code batch, the same PREFIX again the same day refused, stats / disable by batch id).
2. **The phone sheet and the on-screen keyboard** (`game/src/55_promo.js` `prOpen`): the field sits at about 396-442 px at 360x640, under a
   ~280 px keyboard (and the itch.io iframe is unreliable). Fix: reuse the reset sheet's `rsKeyboard` (`game/src/22d_reset.js`) and the `--rs-kb`
   padding (`game/css/11b_reset.css`); a test that shrinks the viewport like the reset test.
   Status: fixed: `prOpen` calls `rsKeyboard(p)`; `58_promo.css` gives `.pr-sheet .panel-body` the `--rs-kb` padding on phones. Tests: `promo` 9: Android (the page shrunk to 360x360, the field in view) and iOS (a stand-in `visualViewport` shrunk by 280 px: `--rs-kb` 280px, the field above the keyboard, back to 0px after).
3. **`game/test_promo.js` section 7 flaky**: after the reload, `waitForSelector('#tContinue')` timed out at 20 s (twice in one run), then passed
   three times. Fix: find the cause and make it deterministic; run the suite 5 times.
   Status: fixed: the cause was not a slow signal: after `page.reload()` the file:// harness came back with an EMPTY localStorage (no save, login or cloud meta; only the prefs the harness rewrites on load), so the title showed "How do you want to play?" and `#tContinue` never came. The game has no `localStorage.clear()`; with a storage probe in place it never happened again, so it is the browser's file:// storage across the reload. The reload is now a fresh page on a copy of the page's storage (as section 9 does). Two more races found while looping it: section 6's lost answer could be restored by the start-up poll before it was typed (the test now runs that poll first; `pr.polled()` hook), and `newHere` could click "Play as guest" as the title redrew for a stored login (it now waits for the cloud start). After the fixes: 26 runs in a row green, the last 5 with `--retries 0`.
4. **`tools/promo.sh` printed every batch code to stdout**, so codes could land in chat transcripts. Fix: print only the count and the CSV path.
   Status: fixed: `batch` prints only "made N unique codes in batch <id>; they are in <csv>"; DRY_RUN prints the requests and a count on stderr. Test: no code from the CSV appears in stdout or stderr.
5. **`PROMO.md` 4**: say that `promo.sh` needs python3 and runs from a cloud session (the owner's Mac has none), like `shop_flag.sh`.
   Status: fixed: `PROMO.md` 4 and the `promo.sh` header: needs python3 and curl, run it from a Claude cloud session (the owner's Mac has no Python), like `shop_flag.sh`.
6. **Worker `/promo/redeem` and `/promo/mine`** answered 403 `login` for a missing or expired token too. Fix: 401 `no_session` when there is no
   session (`me` is null), 403 `login` for a guest; the game shows the right line for each (expired: sign in again).
   Status: fixed: both routes are `auth: true` (401 `no_session` for no token or an unknown/expired one); a guest stays 403 `login`. The game shows "You were logged out on this device. Log in again, then try the code." with a Log in button (opens the cloud log-in form); `clApi` drops the dead token as for every 401. Tests: `promo_worker` 1, `promo` 11.
7. **`55_promo.js` `prRedeem`**: a 200 for a key this save already has (the same save on a second account) spent a slot silently and said "used".
   Fix: check `S.promo.used` before asking the Worker (no slot spent), and a clear line ("This save already has this gift.") for the 200 case.
   Status: fixed: `prRedeem` turns the code into the Worker's key (`prKey`, same normalising as `promoNorm`) and checks `S.promo.used` first: "This save already has this gift." and the Worker is not asked (no slot spent). The rare 200 for a key the save has shows the same line. Tests: `promo` 5 (no POST reached the Worker) and 6.
8. **`55_promo.js` card**: with everything already owned and no coins or treats, the card said "Gerald sent you a letter" though none was sent.
   Status: fixed (no letter rather than an empty one): `prGrant` records `out.letter`; the card shows "Gerald sent you a letter about it." only when a letter went, and the restore toast uses a new "Your gift codes came back: {list}." when none did. Test: `promo` 11.
9. **`55_promo.js` `prKind`**: `HM_DECOR[n]` lookup without an own-property check (`constructor`, `toString` ...).
   Status: fixed: `Object.prototype.hasOwnProperty.call(HM_DECOR, n)`. Test: `promo` 11 (`constructor`, `toString`, `__proto__`, `hasOwnProperty` are not items).
10. **One-per-batch 409**: the line said "You have used this code already" for a different code of the same batch. Fix: a batch line ("You already
    used a code from this gift batch.").
    Status: fixed: the Worker answers 409 `batch_used` for another code of a batch (also when the `(batch, user_id)` index stops a race); the game says "You already used a code from this gift batch.". Tests: `promo_worker` 5, 6 (race), 12-13; `promo` 11.

## Checks after the fixes

`promo_worker` 82 passed, `promo` 90 checks (5 runs, `--retries 0`, all green), `worker` 2321 passed, `smoke` 35, `i18n` and `copy` OK,
`i18n_fit` promo step for de ja th yue: 20 sessions, 6 states each (sheet, a line, logged out, guest, Settings, card), 0 findings.
New text (`pr.err_batch`, `pr.err_had`, `pr.err_session`, `pr.restored_nl`) in all 12 languages; `packed.js` rebuilt; the game font
subsets did not change (every new character was already in them).
