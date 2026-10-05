# Paw Haven v2.2: on phones (portrait, touch, cloud save)

Read `PIPELINE.md`, `V21.md` (standing rules) and `V15B.md` (the paused v1.5B phone layout) first. **Where this file disagrees with older docs, this file wins.**

## Client direction

- **One adaptive build.** The same `paw_haven_prototype.html` switches to the phone layout on phones. There is no second file.
- **Portrait only on phones.** A phone held sideways shows a "Turn your phone upright" card over the paused game. Tablets and laptops are unaffected.
- **Full game on phone.** Every screen from v1.0 to v2.1 gets a phone layout and touch controls.
- **Cloud save with Supabase.**
  - Guests start automatically. An email address with a 6-digit code links the save across devices.
  - **Saving is real time.** Every change reaches the cloud within about 2 seconds.
  - **The player is never asked which save to keep.** The newer save wins automatically, and the older one is kept as a backup.
- **Export / Import save code** in Settings, on every copy.

## Standing rules (every lane)

- Everything in V21.md "Standing rules" still holds: cozy, no selling dogs, plain short copy, every window a centred popup (on phones a bottom sheet), no franchise names.
- **The laptop version (≥ 1024 px wide, mouse) must look and play exactly as it does now.**
  - Every phone rule sits under `html[data-layout="phone"]` (CSS) or `if (isPhone())` (JS).
  - All desktop suites must still pass unchanged (`node game/run_tests.js all`).
- **Phone minimums** (portrait, 360–430 px wide):
  - every tap target at least 44×44 px;
  - text at least 15 px (captions 13 px);
  - no horizontal page scroll (`scrollWidth === innerWidth`);
  - safe areas respected (`env(safe-area-inset-*)`);
  - no hover-only interactions.
- **Touch:**
  - Use pointer events.
  - Long-press shows a tooltip.
  - Drag is always optional. There is a tap-to-select, tap-to-place fallback.
  - No double-tap zoom on game controls (`touch-action: manipulation`).
- **Shared scope:** prefix new top-level names with your lane tag (see Lane assignments). Grep `game/src` for duplicates before committing.

---

## 1. Phone shell (SHELL lane)

- **Mode switch:** keep `html[data-layout="phone"]` from v1.5B (`13_more_dogs.js`, `phoneMQ` / `portMQ`). Move the switch logic into the new `game/src/22c_phone_shell.js`, and leave a call in its old place so nothing else breaks.
- **Portrait lock:**
  - Show the turn card when `isPhone()` (touch, `pointer: coarse`) is in landscape with a height of 500 px or less.
  - Pause the clock-driven animations while the card shows. Remove it on rotate.
  - Desktops never see it: a mouse pointer means no lock.
- **HUD (about 56 + 40 px):**
  - First row: dog chip, mood dot, name, sex symbol, coins and a ⋯ menu (Settings, mute, cloud status).
  - Second row: the 4 ring meters, which a tap expands.
  - The HUD title tag (`#hudTitle`) shows under the name when a title is set.
- **Action bar:** fixed at the bottom with the safe-area inset. It has 7 buttons, each 48 px or taller, with labels.
- **Popups become bottom sheets:**
  - Every `openModal` shows as a full-width sheet up to 88% of the screen height.
  - It has a drag handle, closes on a downward swipe or a backdrop tap, and the content scrolls inside the sheet.
  - Sheet grids reflow to 2 columns, and tab rows scroll sideways inside the sheet.
- **Base sizes:** `.btn`, `.opt` and tab buttons are at least 44 px tall on phones. This fixes the known Settings and Journal tab failures, which measure 40 px today.
- **Toasts** sit above the action bar, never under it.
- **`game/test_phone.js`:**
  - Make it honour `PAW_ARGS` and the shared Chromium path as `test_lib.js` does. It ignores the proxy flag today and fails on the font certificate in this container.
  - Make the potty "tap to scoop" step wait for the real condition.

## 2. Screens (one lane per group)

Each lane makes its screens pass the phone minimums on iPhone 13 (390×844) and Pixel 7 (412×915), with touch and without horizontal scroll.

| Lane | Screens |
|---|---|
| **HOME** | Title and adoption (shelter, dog spots card), yard and house scenes (camera follows the dog, crop centred on the dog area), bath, feeding, petting by rub, potty, beds, houses, pack dogs (tap to switch), the v2.1 yard decorations and Decor card, nursery basket, mailbox hotspot |
| **TOWN** | Town map (drag pan, tap-to-confirm chip), Market and every shop with the purchase sheet (big − / + buttons), Wardrobe, all town places (Square, Café, Pier, Hilltop, Dog Park, Vet, Salon), Vet gene test and sniff, Playdate board, painter and the visitor dogs |
| **JOURNAL** | Journal (Treasures, Food, Toys, Recipes, Profile, Family tree, Coats with the Sparkle jar and mixes strip, titles), Mailbox with letters, postcards and album, Dog spots card from the Profile. The family tree is pannable, and nodes are 44 px or larger. |
| **PUPPY** | Puppy Playdates (pair picker, Puppy Predictor, Sparkle odds line), playdate scene, birth reveal (cards in a swipeable row), naming, nursery popup, Who stays, pick of the litter, Doggy Ramp tip, puppy play (16b) |
| **WALK** | Walk route carousel, the classic treasure walk (hold-to-walk button, dig), the runner module `mods/walkrun.js`, toys `mods/toys.js`, fetch. See below. |
| **SKILL** | Trick training and the trick mini-games (15, 15b), garden and Sprout Cart (`mods/garden.js`, 2×3 plot grid), kitchen and cooking (`mods/kitchen.js`, pantry strip under the pot, tap-to-add fallback) |

**WALK details (portrait only):**

- The runner plays in a landscape-shaped strip, letterboxed and scaled to the width. The HUD sits above it and the controls below.
- **Controls:**
  - Large Jump (hold for a long jump) and Duck buttons in the bottom corners.
  - A tap on the strip jumps, and a swipe down ducks.
  - The Dig button is large when it shows.
- **Fair timing:** obstacles still give at least 1.8 s of warning. Zoom the camera out if needed.
- **Tutorial:** the tutorial cards stack vertically.

## 3. Cloud save (CLOUD lane)

**Where it works:**

- **GitHub Pages and local copies:** on.
- **The claude.ai artifact:** off, because its sandbox blocks outside servers. That copy keeps the local save, and Settings says: "Cloud save works on the web version."

**Supabase setup (the owner does this once):**

1. Authentication → Sign In / Providers: turn on **Allow anonymous sign-ins** and **Email**.
2. Authentication → Email Templates → Magic Link: include `{{ .Token }}`, so the email carries a 6-digit code.
3. Authentication → URL Configuration: Site URL `https://an9ou.github.io/paw-haven/`.
4. SQL Editor: run `supabase/schema.sql` (written by the CLOUD lane).
5. Paste the Project URL and the anon (publishable) key into `game/src/22b_cloud_config.js`. The anon key is public by design. Row-level security protects the data.

**Data (`supabase/schema.sql`):**

- `saves`:
  - columns: `user_id uuid primary key references auth.users on delete cascade`, `data jsonb not null`, `rev bigint not null`, `changed_at timestamptz not null`, `device text`, `updated_at timestamptz default now()`;
  - RLS: select, insert and update only where `auth.uid() = user_id`;
  - add the table to the `supabase_realtime` publication.
- `save_backups`:
  - columns: `id bigserial`, `user_id`, `data jsonb`, `reason text`, `created_at`;
  - same RLS;
  - a trigger keeps the newest 5 per user.
- Optional and commented out: a weekly `pg_cron` job removing anonymous users unused for 90 days.

**Real-time saving, with no "which save?" question:**

- **Local first.**
  - `saveNow()` writes localStorage as today, then calls the cloud hook.
  - The game never waits on the network and works offline.
- **Push.**
  - Changes are debounced to about 2 s, then upserted with `rev + 1` and `changed_at` (the time of the newest change).
  - The game also pushes on `visibilitychange` (hidden) and `pagehide`.
- **Pull.**
  - On load and on focus, read the cloud row.
  - Subscribe with Supabase Realtime to the player's own row.
  - When another device saves, apply its save as soon as the game is idle (not mid-walk, mini-game or popup), with a soft toast: "Synced from your other device."
- **Who wins.** The save with the newer `changed_at` wins, every time, automatically.
  - The losing version is written to `save_backups` with a reason ("older than your other device", "guest save before sign-in"). Nothing is ever deleted unasked.
  - Settings → Cloud save → "Backups" lists them (date, dogs, coins) with "Restore". Restoring makes the backup the newest save.
- **Guest to email.** Adding an email to a guest (`updateUser({ email })`, then verifying the code) keeps the same user, so nothing moves.
- **Signing in on a device that has a guest save.** The account's cloud save loads, and the guest save goes to that account's backups ("guest save before sign-in"). There is no prompt.
- **Library.** `@supabase/supabase-js` v2 is lazy-loaded from `cdn.jsdelivr.net` only when the cloud is on. If it fails to load (offline, blocked), the game shows "Cloud save is offline. Your game is saved on this device." and keeps playing.
- **Settings → Cloud save:**
  - status (Guest, Signed in as a…@…, Offline, Syncing, Synced 12 s ago);
  - "Keep my save on every device: add your email" (email, then a 6-digit code);
  - Sign out (the local save stays);
  - Backups.
- **A gentle nudge** once, after 3 care days: "Add your email to keep Mochi safe on every device." It never blocks play.
- **Export / Import:**
  - Export makes a compact save code (base64 of the JSON, with a checksum) and a Copy button.
  - Import validates it, saves the current game to backups (cloud) or to `pawhaven_proto_v1_backup` (local), then loads it.
- **Save format:** `S.v` stays 1 and `migrate()` stays additive. The cloud stores exactly what localStorage stores.

## 4. Tests

- Each lane writes `game/test_phone_<lane>.js` with Playwright device profiles (iPhone 13, Pixel 7; see `game/test_phone.js`) covering its screens. It checks:
  - every screen opens;
  - tap targets are 44 px or more;
  - text is 15 px or more;
  - there is no horizontal scroll;
  - touch works (tap, rub, drag, swipe);
  - there are no console errors.
- **CLOUD** adds `game/test_cloud.js`. It runs against a mocked Supabase client (`window.__pawCloudMock`), so the tests need no network. It covers:
  - push debounce;
  - newer-wins on pull;
  - backup of the loser;
  - guest to email keeping the user id;
  - Export / Import round trip;
  - the artifact copy (cloud off) keeping the local save.
- **Desktop regression:** `node game/run_tests.js all --jobs 2` must pass unchanged after every merge.
- **QA lane (Haiku), after all merges:** an audit of every phone screen against the minimums above. It reports findings for the coordinator to fix.

## 5. Lane assignments

| Lane | Model | Files (src / css / other) |
|---|---|---|
| **SHELL** | Opus | `22c_phone_shell.js` (new), the phone section of `13_more_dogs.js`, `22_input.js`, `shell.html` (markup hooks only) / `19_phone_v15b.css`, `20_phone_shell.css` (new) / `game/test_phone.js` |
| **HOME** | Sonnet | phone-only branches in `01_title`, `02_adoption`, `03_yard`, `04_bath`, `12_popups_beds_map_snacks_potty`, `13_more_dogs` (not its phone section) / `21_phone_home.css` (new) |
| **TOWN** | Sonnet | phone-only branches in `05_market_shops`, `06_wardrobe`, `08_map`, `14_town_places`, `14b_vet_playboard` / `22_phone_town.css` (new) |
| **JOURNAL** | Sonnet | phone-only branches in `07_treasure_journal`, `07b_mailbox`, `11_garden_kitchen` (journal part) / `23_phone_journal.css` (new) |
| **PUPPY** | Sonnet | phone-only branches in `13b_breeding`, `13c_litter`, `16b_puppy_play` / `24_phone_puppy.css` (new) |
| **WALK** | Sonnet | phone-only branches in `09_walk_classic`, `17_walk_route_carousel`, `18_mod_walk_toys`, `19_fetch`, `mods/walkrun.js`, `mods/toys.js` / `25_phone_walk.css` (new) |
| **SKILL** | Sonnet | phone-only branches in `15_trick_training`, `15b_trick_games`, `11_garden_kitchen` (garden and kitchen UI), `mods/garden.js`, `mods/kitchen.js` / `26_phone_skill.css` (new) |
| **CLOUD** | Opus | `22b_cloud_config.js`, `22b_cloud.js` (new), `20_settings_dev.js` (Settings section), a two-line cloud hook in `00_core.js` `saveNow` and load / `supabase/schema.sql`, `game/test_cloud.js` |
| **QA** | Haiku | read-only audit after merge |

- The coordinator adds the new stub files to `src/ORDER.txt` and `css/ORDER.txt` on `main` before the lanes start, so no lane edits ORDER.txt.
- Lane tags: `ps` SHELL, `ph` HOME, `pt` TOWN, `pj` JOURNAL, `pp` PUPPY, `pw` WALK, `pk` SKILL, `cl` CLOUD.

## 6. Merge order

1. SHELL
2. CLOUD
3. HOME
4. TOWN
5. JOURNAL
6. PUPPY
7. WALK
8. SKILL

Smoke and `test_phone.js` run after each merge. After the last merge come the QA audit and fixes, `all --jobs 2` plus every phone suite, CHANGELOG and TODO, then publishing.
