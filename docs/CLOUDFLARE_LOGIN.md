# Cloudflare login (planned release after v2.7)

The owner's decisions (13 Oct 2026, choice window):

- **Swap the login and cloud save from Supabase to Cloudflare.** The title screen stays exactly as it is: Log in / Make an account / Play as guest, email plus own password, no emails ever sent, and Export / Import save codes.
- **When:** after v2.7 ships, as its own small release, before v2.8 (Winter + Japan).
- **Old accounts move over:** same email and password, nothing lost.
- **Sync on open, no live push:** the save syncs on every change (as now, about 2 s after real input), on game open and on focus. No Realtime or Durable Objects.

## Shape (for the team that builds it)

- **Worker** `pawhaven-api` (`cloudflare/worker.js`, `cloudflare/wrangler.toml`) on `workers.dev`, with a **D1** database `pawhaven`:
  - `users (id, email unique null, pw_hash, pw_salt, created_at, guest int)`,
  - `sessions (token_hash, user_id, created_at, last_seen)`,
  - `saves (user_id pk, data, rev, changed_at, device, updated_at)`, `save_backups (...)`, the same fields as `supabase/schema.sql`.
- **Passwords:** PBKDF2-SHA256 with Web Crypto (100k iterations, a 16-byte salt). Never stored or logged in plain text. Login is rate-limited per IP and per email.
- **Sessions:** a random 32-byte bearer token. Only its SHA-256 is stored. The client keeps the token in `localStorage['pawhaven_cf_auth']`.
- **Guests:** `POST /guest` makes a guest user with no email. "Make an account" on a guest adds email and password to the same user, the way the anonymous Supabase upgrade works now.
- **Endpoints:** `/guest`, `/register`, `/login`, `/logout`, `/me`, `GET/PUT /save` (rev and changed_at conflict rule unchanged, the loser goes to `save_backups`), `/backups`. CORS only for the game's origins: doodledoggo.app (and www), GitHub Pages, localhost, and the itch.io game frame (https://html-classic.itch.zone and https://html.itch.zone). The itch.io copy needs this so players there can log in. The claude.ai artifact stays cloud-off.
- **Moving old accounts (lazy, no password export):** when `/login` gets an email it doesn't know, the Worker tries Supabase's password grant with the **public** publishable key. If Supabase accepts, the Worker makes the Cloudflare user with a fresh PBKDF2 hash of that same password, reads that user's `saves` row with the user's own Supabase token, stores it, and marks the email migrated. No secret key and no hash export are needed. Guests never had a password: their save is already on the device and uploads to the new guest account on first start. Keep Supabase on for about 3 months, then switch it off.
- **Client:** `game/src/22b_cloud.js` keeps its public API and the title UI. Only the transport changes, from supabase-js to `fetch` against the Worker. Drop the Realtime channel and keep the focus pull. `22b_cloud_config.js` holds only the Worker URL. Update `test_cloud.js`, `test_account.js` and the mock (`window.__pawCloudMock`) to fake the Worker.
- **Tests:** a node test for the Worker (Miniflare or `wrangler dev --local` with D1 local), plus the existing cloud and account suites against the mock.

## What the owner needs to set up before this starts

1. A Cloudflare account (free plan is enough: Workers + D1).
2. A Cloudflare API token with **Workers Scripts: Edit** and **D1: Edit** on the account, plus the **Account ID**. Add them to the cloud environment (environment menu, Edit, Network secrets) as `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. Never paste them into chat.

## Queue (one team at a time, owner's rule since 13 Oct)

1. UI/UX phone fixes, 2. ART fixes, 3. SHELTER ART, 4. HOME, 5. PACK CARE, 6. SHELTER, 7. COORDINATOR: merges, reviews, release of v2.7 (owner's OK first), 8. **Cloudflare login**, 9. v2.8 Winter & New Year + Japan scenery (`V28.md` on `docs/v2.8`).
