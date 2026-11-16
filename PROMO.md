# v2.25.5 "Gift codes" (contract; not released)

Owner's decisions, 16 Nov 2026. Branch `claude/promo-codes` (from `main` 28c9b524); the two code-only items are drawn on `claude/promo-art`.
Suites: `promo` (the game), `promo_worker` (the Worker and the CLI), plus a few checks in `worker` (on workerd's own D1). Save stays `v: 1`.

## 0. The rules

- **Nothing is paid.** A code only gives: code-only items (any item name from the tables; the `promo: true` ones are made for codes), a few
  Paw Coins and/or dog-safe treats (FOOD rows). Never dogs, Bond, welfare, chances, sparkle, Kind shop paid looks or earned rewards.
- **Walks stay the main income.** The Worker gives **500 coins at most** per code, whatever the row says (`PROMO_COIN_MAX`), and
  `tools/promo.sh` refuses more (`max_coins` in `tools/promo_items.json`). Treats: 1-10 each, 6 kinds at most; 6 items at most.
- **Signed-in cloud-save accounts only** (an email account). A guest sees one kind line and "Make the free account", which opens the cloud
  sign-up. The claude.ai copy and the harness (no cloud) show no box.
- **Nothing bad ever happens:** every error is a kind line; an expired, unknown, not-yet or disabled code all read the same.
- **Privacy:** the code typed goes only to our Worker, to check it. We keep which codes an account used (and what each gave), so the gifts
  come back on a new device. A deleted account's records go with it (`tidy()`).

## 1. Two kinds of codes

| Kind | Example | Who | Limits |
|---|---|---|---|
| shared | `DOGGO-IG-NOV` | many players | each account once; start/end window; optional total `cap` |
| unique | `GIFT-AB2C-DE3F` (batch `GIFT-20261116`) | one player each | each code once in total (`cap` 1); **one code of a batch per account** |

Codes compare upper case with spaces, dashes, dots and underscores left out (full-width letters and the Japanese long dash from a phone keyboard
count as plain ones): `doggo ig-nov` = `DOGGO-IG-NOV`. A code is 4-40 letters and digits once normalised. Batch codes use the readable
alphabet `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no 0, O, 1, I, L), 8 random characters after the prefix.

## 2. Worker routes (`cloudflare/worker.js`)

- `POST /promo/redeem { code }` (session: none, or a token the Worker no longer knows (expired) is **401 `no_session`**, and the game says
  "log in again" with a Log in button; a guest is **403 `login`**, never 401, so the game keeps a guest's login). Rate limit
  first: **10 an hour per account and 30 per IP**, every attempt counts, a miss too (**429 `rate_limited`**). Then:
  - **404 `unknown`**: no such code, not started, ended, disabled, a broken or empty reward row, a code that does not normalise, extra body
    keys. The same bytes for every reason, so codes cannot be probed.
  - **409 `used`**: this account used this code. **409 `batch_used`**: this account used another code of the same batch ("You already used a
    code from this gift batch.").
  - **409 `gone`**: the cap is reached / the unique code was used by someone else.
  - **200** `{ ok: true, code: 'DOGGO-IG-NOV', key: 'DOGGOIGNOV', reward: { items, coins, treats }, at }`.
  - **Atomic:** the redemption insert and `used = used + 1` go in **one D1 batch** (all or nothing). The CHECK `used <= cap` fails the second
    of two racing redemptions for the last slot and rolls its insert back; the unique `(code, user_id)` and `(batch, user_id)` indexes stop a
    double tap and a second code of a batch. Insert first, then the check (like `shop_holds`); the pre-checks only give the nicer answer.
- `GET /promo/mine` (session, else 401 `no_session`; an email account, else 403 `login`; 120 an hour): `{ redemptions: [{ code, key, at, reward }] }`, oldest first,
  each with the reward **as it was granted** (coins already clamped), even after the code was disabled or its row changed or deleted.

## 3. D1 (`cloudflare/schema.sql`, `create table if not exists`)

- `promo_codes (code text primary key /* normalised */, shown, kind 'shared'|'unique', batch, reward json, starts_at, ends_at, cap, used,
  disabled, note, created_at, check (cap is null or used <= cap))`, index on `batch`.
- `promo_redemptions (code, user_id, batch, reward json /* as granted */, at, unique (code, user_id))`, partial unique index
  `(batch, user_id) where batch is not null`, index on `user_id`.
- `tools/cf_api_deploy.sh` applies them with the rest of `schema.sql` (step 2). Later columns go through its `addcol` (none yet). A CHECK
  cannot be added later in SQLite, so it is in the first `create`.

## 4. The CLI (`tools/promo.sh`; same D1 API as `tools/shop_flag.sh`, `CLOUDFLARE_ACCOUNT_ID`, arguments only as D1 params; `DRY_RUN=1`)

It needs **python3** and curl, so run it **from a Claude cloud session** (the owner's Mac has no Python), like `tools/shop_flag.sh`; the proxy
adds the Cloudflare token there.

```
bash tools/promo.sh create DOGGO-IG-NOV --items "Follower Star Bandana" --coins 200 --treats "Pupcake:2,Blueberry Bites" --from 2026-11-20 --to 2026-12-31 --cap 500 --note "Instagram Nov"
bash tools/promo.sh batch GIFT 200 --items "Paw-Print Pennant" --coins 100 --to 2026-12-31 --note "Christmas cards"
bash tools/promo.sh list
bash tools/promo.sh stats DOGGO-IG-NOV        # or a batch by its id: stats GIFT-20261116
bash tools/promo.sh disable GIFT-20261116     # a code or a whole batch (its id); enable undoes it
```

- Dates are **Japan days**: `--from` starts at 00:00 JST, `--to` ends at the end of that day (JST). `--to` in the past or before `--from` is refused.
- Refused (exit 2, nothing sent): coins over 500, an item or treat not in `tools/promo_items.json`, a treat count over 10, no reward, more than
  6 items or treat kinds, a short or odd code, a bad date, cap 0, an unknown flag. A non-`promo` item is allowed with a note on stderr.
- **A batch id is the PREFIX and the Japan day it is made**: `batch GIFT 200` on 16 Nov 2026 makes batch `GIFT-20261116` (codes
  `GIFT-XXXX-XXXX`). `batch` asks D1 first and refuses (exit 2, nothing made) a batch id that exists already: one batch a PREFIX a day, so a
  second one the same day takes another PREFIX. A later `batch GIFT` is a new batch, so a player who used a December code can use one of it
  too, and `stats` / `disable` of one batch never touch the other. `list` shows the batch ids; `stats` / `disable` / `enable` take one
  (`gift 20261116` works too); a bare PREFIX is not a batch (0 codes, and a hint).
- `batch` **never prints the codes** (output can end up in a chat transcript): only how many were made and the CSV
  `docs/marketing/promo/<batch id>-<JST time>.csv` (git-ignored: private, never committed, pasted or shown). D1 takes 100 bound parameters a
  query, so codes go 40 a request; a failed request stops and says how many were made (those are in the CSV). `DRY_RUN=1` prints the requests
  only (those codes are never made).
- `tools/promo_items.json` is generated: `NODE_PATH=$(npm root -g) node tools/promo_items.js` reads the built game (`window.__paw.pr.catalog()`):
  every `promo: true` item, what the shops sell (price > 0, not `reward`, not `ks`), and FOOD without Fresh Water. The `promo` suite fails
  while it is stale, so rerun it after any item table change.

## 5. The game (`game/src/55_promo.js`, `game/css/58_promo.css`)

- **"Have a code?"** in Settings (above Cloud save) and in the phone "..." menu (a sheet). A text field (`autocapitalize="characters"`,
  `autocorrect="off"`, `autocomplete="off"`, `spellcheck="false"`, 40 characters, 18 px so iPhones do not zoom), a "Use code" button, 44 px+
  taps, one column on phones, a `role="status"` line, and "The code goes only to our server, to check it."
- **Success:** a Delivered!-style card ("A gift for you!", the code, one row per item / treat / the coins, each with where it is), the coins fly
  to the counter from the card (`coinFly`), Gerald's letter "A little gift for our friends" (kept to reread, `pr_<key>`). Items: clothes to the
  Wardrobe, `HM_DECOR` to the house waiting to be put out, houses, beds, toys; one already owned says "You had this one already". Treats to the
  pantry. Coins with `addCoins(raw)` (a Kind shop refund debt is settled first, and the card says so).
- **Errors:** used, batch_used ("You already used a code from this gift batch."), unknown/expired ("That code is not working. Check the
  letters, or it may be over."), empty, gone ("So many friends were quicker!"), rate limited, offline, and no_session (the login ran out:
  "You were logged out on this device. Log in again, then try the code." with a Log in button). Nothing is granted on an error.
- **This save has it already:** the game turns the typed code into the Worker's key and checks `S.promo.used` first: "This save already has
  this gift." and the Worker is not asked (no account spends its slot, e.g. the same save on a second account).
- **Phones:** the sheet makes room for the on-screen keyboard like the reset sheet (`rsKeyboard`, `--rs-kb`), so the field stays above it.
- No letter (and no "Gerald sent you a letter" line) when a code brought nothing new (every item owned already, no coins or treats).
- **Save:** `S.promo = { used: [keys], wait: [{ k, n, q? }] }`, added by `prFields` in `migrate()` and the new-save path. `wait`: an item
  name this build does not know yet (a code made for a newer build) waits and is given once a build knows it.
- **Restore:** `GET /promo/mine` on start (after the cloud's own pull, so a newer cloud save loads first) and after a log in; every
  redemption whose key the save lacks is granted once, from the record (so the coins are exactly what was granted, once per save). A redeem that
  answers `used` also restores first (the answer of an earlier tap was lost on the way) and shows the card if that brought it.
- Friends and Dog Cards: the art lane appends the new items to `FR_DECOR` / `DC_OUTFITS`. An older Worker refuses the new indexes, so the
  game resends once without them: `FR_DECOR_OLD = 31` (friend yard, `FR.decorOld`) and `DC_OUTFITS_OLD = 57` (Dog Card, `DC.outfitOld`).
  The Worker's `FR_LIM.decor` / `DC_LIM.outfit` grow with the lists (see the comments there: written as a delta for the merge with
  `claude/release-26-29` and Sakura). **Append order is the merge order**: the indexes are stored in friend yards and cards.

## 6. Deploy order

1. `tools/cf_api_deploy.sh`: the schema (new tables) and then the Worker (the new routes, the raised limits).
2. Make the codes with `tools/promo.sh` (they only work once the Worker is up).
3. The game release (the box appears; `PROMO_UI` true).
4. The site (`privacy` page line `privacy.shop.codes`; `docs/itch/PRIVACY.md`). The GM sets `POLICY_DATE` on release.

## 7. App stores (iOS build, late January 2027)

Apple's App Review Guideline 3.1.1 does not let an app unlock content or features with its own codes (only App Store offer codes), even free
ones. The iOS build may need the box hidden: **`PROMO_UI`** at the top of `game/src/55_promo.js` is the one switch. `false` hides the box in
Settings and the menu and asks the Worker nothing (no restore poll either: a cloud save already carries what was granted). Google Play's rules
allow free promo codes; keep it on for Android unless the owner says otherwise.

## 8. Tests

- `promo_worker`: signed-in only, shared once per account, normalising (spaces, dashes, case, full-width), the cap, the window, disabled, one
  generic `unknown`, unique once in total and one per batch, races (five accounts for one slot, five for one unique code, three taps from one
  account: exactly one wins, and the losers really reached the CHECK / unique index), the coin ceiling and reward cleaning, `/promo/mine`,
  rate limits (account and IP, misses count), `tidy()`, 401 `no_session` / 403 `login`, `batch_used` (also in a race), and `tools/promo.sh`
  (its DRY_RUN requests run on the local D1; every refusal; and for real against a local D1 stand-in (`PROMO_D1_API`): a batch id, a second
  batch of the same PREFIX the same day refused, no code printed, `stats` / `disable` by batch id).
- `worker`: a cap-1 code, the coin clamp, `/promo/mine` and the CHECK on workerd's D1 (Miniflare).
- `promo`: migration, `promo_items.json` up to date, no box without cloud or with `PROMO_UI` off, the guest line, a shared code from Settings
  (card, letter, items, treats, coins once, 44 px), every error line, a lost answer, a fresh device (restore once, reload adds nothing), the
  wait list, phone 360x640 (menu, sheet, card, guest, above the bar, one column), reduce motion.
