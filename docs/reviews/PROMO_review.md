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
   Status: open
2. **The phone sheet and the on-screen keyboard** (`game/src/55_promo.js` `prOpen`): the field sits at about 396-442 px at 360x640, under a
   ~280 px keyboard (and the itch.io iframe is unreliable). Fix: reuse the reset sheet's `rsKeyboard` (`game/src/22d_reset.js`) and the `--rs-kb`
   padding (`game/css/11b_reset.css`); a test that shrinks the viewport like the reset test.
   Status: open
3. **`game/test_promo.js` section 7 flaky**: after the reload, `waitForSelector('#tContinue')` timed out at 20 s (twice in one run), then passed
   three times. Fix: find the cause and make it deterministic; run the suite 5 times.
   Status: open
4. **`tools/promo.sh` printed every batch code to stdout**, so codes could land in chat transcripts. Fix: print only the count and the CSV path.
   Status: open
5. **`PROMO.md` 4**: say that `promo.sh` needs python3 and runs from a cloud session (the owner's Mac has none), like `shop_flag.sh`.
   Status: open
6. **Worker `/promo/redeem` and `/promo/mine`** answered 403 `login` for a missing or expired token too. Fix: 401 `no_session` when there is no
   session (`me` is null), 403 `login` for a guest; the game shows the right line for each (expired: sign in again).
   Status: open
7. **`55_promo.js` `prRedeem`**: a 200 for a key this save already has (the same save on a second account) spent a slot silently and said "used".
   Fix: check `S.promo.used` before asking the Worker (no slot spent), and a clear line ("This save already has this gift.") for the 200 case.
   Status: open
8. **`55_promo.js` card**: with everything already owned and no coins or treats, the card said "Gerald sent you a letter" though none was sent.
   Status: open
9. **`55_promo.js` `prKind`**: `HM_DECOR[n]` lookup without an own-property check (`constructor`, `toString` ...).
   Status: open
10. **One-per-batch 409**: the line said "You have used this code already" for a different code of the same batch. Fix: a batch line ("You already
    used a code from this gift batch.").
    Status: open
