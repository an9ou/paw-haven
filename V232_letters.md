# v2.32 "A letter from your dog" (contract; not released, not deployed)

Marketing idea 4, owner's go-ahead 16 Nov 2026. Built on `claude/dog-letter-email` (from `claude/v230-together`), because both change
`cloudflare/worker.js`. A special update: it goes live only with the owner's go-ahead and launch date (CLAUDE.md).
Code: `game/src/59b_letters.js` (tag `lt`, test hook `window.__paw.lt`), `game/css/62_letters.css`; the Worker's "letters" section in
`cloudflare/worker.js`, its texts in the generated `cloudflare/letters_text.js` (`node tools/letters_pack.js`, from `game/i18n/*.json`),
tables in `cloudflare/schema.sql` + one trigger in `schema_triggers.sql`. Suites: `letters` (game), `letters_worker` (Worker on a local D1).
Save stays `v: 1`. **No coins, no rewards, no prices, nothing paid, no change to the economy.**

## 0. What it is

A player with cloud save on an email account can ask for **one short letter a week "from" their dog**, by email, in their game language.
It is **off unless the player turns it on**, and the address must say yes itself (section 2) before any letter is sent.

## 1. Gate (off until the owner sets the launch)

- Game: `LT_FROM` in `59b_letters.js`. `''` = no launch date yet (off); `'YYYY-MM-DD'` = on from 00:00 JST that day. `ltOn()` = (not webdriver
  and `LT_FROM` is due) or `prefs.ltTest`. While off: no Settings row, no offer card, no call to a `/letters` route, no `S.ltr` writes.
- Worker: the constant `LETTERS_FROM` (same text as `LT_FROM`; the suite `letters_worker` fails when the two differ) opens the routes at that
  JST midnight **less 10 minutes**. The Worker variable `LETTERS_FROM` (ms, an ISO time, or `0` = open now, `off` = shut) overrides it without
  new code. The routes also need the secrets `RESEND_API_KEY` and `LETTERS_KEY`. Until all three are there every `/letters*` route answers
  `404 not_found { soon: true }` (no rate row, no D1 write) and the cron does nothing. One exception: an unsubscribe link with a **valid**
  signature always works, so closing the gate later never traps anyone on the list.
- The game reads `404 not_found` as "not here" (an older or closed Worker): the feature hides for the rest of the load, nothing is lost.
- No cloud (claude.ai copy), a guest, or a logged-out save: the Settings row says letters need an account; no card.

## 2. Opt-in, consent, opt-out

- **Settings** gets a row "Letters from my dog": a switch (default off), one line of what is sent and how often, the address it goes to,
  "What is in a letter?" (a sample letter, built from the player's own dog on the device; nothing is sent to show it).
- **The offer card**, once per save, ever: only for an email account with letters off, from the 2nd day played **and** (Bond 3 on any dog or
  7 days played), 45 s into the session and after 5 calm seconds on the home yard or house (`nwCalmNow`: never over a sheet, a story scene, a
  walk, photo mode, the guide, What's new, While you were out). Buttons "No thanks" / "Yes, please"; closing it any way counts as shown
  (`S.ltr.ask = 1`). Never again, never a reminder.
- **The account system has no verified emails** (register is email + password, no confirmation). So turning letters on is a **double opt-in**:
  `POST /letters { on: true }` puts the row in `pending` and sends **one confirmation email** (fixed text, no player-typed text, in the game
  language) with a signed link, valid 48 hours. The link opens a small page with one button; the button (`POST`) turns the row `on`. A link
  that is only opened (a mail scanner) changes nothing. Until then no letter is ever sent. At most 3 confirmation emails a Japan day and 6
  in 30 days per account (an address that never says yes is left alone), and 10 an hour per IP.
- Children and consent: nothing beyond what the account already asks (an email and a password); the confirmation email goes to the account's
  own address and whoever reads that mailbox decides. No nagging: the card shows once, the pending line in Settings has a quiet "Send it again".
- **Opt-out**: the switch in Settings (`POST /letters { on: false }`), the link in every letter (a page with one button), and the mail app's own
  Unsubscribe button (`List-Unsubscribe` + `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, RFC 8058: a `POST` to the same signed link).
  Opting out **deletes the row**. Unsubscribe links are valid 180 days.
- **Bounces and complaints**: `POST /letters/hook` takes Resend's webhook (Svix signature, secret `RESEND_WEBHOOK_SECRET`; 404 while unset).
  `email.bounced` (permanent) and `email.complained` set the row to `stopped`: no more letters, and the switch cannot turn them on again for
  that account (the owner clears the row by hand). The game says kindly that letters could not reach the address.

## 3. The letter

- **When**: Sundays 10:00 JST. Cron Triggers `0 1-23 * * SUN` and `0 * * * MON` (UTC) run hourly through a **send window of 48 hours** from
  Sunday 10:00 JST; the handler checks the window itself. The week's id is that Sunday's JST date (`YYYY-MM-DD`).
- **Built only from the cloud save the account already syncs** (`saves.data`, `saves.updated_at`) and the row's language:
  the active dog's name and breed, its Bond level, Bond gained this week, days played, and up to two highlights of the last 7 days:
  a trick learned, wishes come true, a story chapter, something from a market, a friend's visit, a new dog at home, walks.
  The game keeps a tiny weekly note for this **inside the save** (`S.ltr`, section 5); the Worker stores none of it.
- **Voice**: the dog writes ("Dear human,"), crude crayon charm, and Gerald signs off under it ("With a happy waddle, Gerald").
  Nothing bad ever happens: no hunger, no sadness, no guilt. No coins, no offers, no ads.
- **Away** (days since `saves.updated_at`): under 7 days the weekly letter. 7 days and more: a calm "all is well" letter with one gentle
  "I miss you a little, in the happy way", **only in away weeks 1, 2 and 4** (weeks 3, 5, 6, 7 send nothing). At **8 weeks** one last kind
  letter ("my last letter for now, so I do not fill your mailbox"), then `quiet = 1` and nothing more until the save is played again.
- **Language**: the row's `lang` (the game's language when the player turned letters on; the game sends it again when it changes). All 12
  languages; an unknown code falls back to English. Texts are `lt.m_*` keys in `game/i18n/*.json`, packed for the Worker by
  `tools/letters_pack.js` with the breed and trick names (`--check` fails when stale; the suite runs it).
- **Form**: a light HTML email (no scripts, no web fonts, one small crayon header image at `https://doodledoggo.app/img/mail/letter.png`,
  the same file for everyone, sent only when the Worker variable `LETTERS_IMG` is `1`, i.e. after the site deploy that hosts it) plus a plain-text
  part. **No tracking pixel, no link tracking, no per-person URL** except the unsubscribe link. Two links: the unsubscribe link and
  `https://doodledoggo.app`.
- **The dog's name** is the one typed text in a letter. It only ever goes to the account's own confirmed address, HTML-escaped, cut to 24
  characters, control characters dropped; a name that looks like a link (`/ \ @ :` or `www.`) is replaced by the breed name.

## 4. The Worker

Tables (new; no added columns):

```
letters (user_id text primary key, lid text unique,   -- lid: a random id for links, never the user id
         state text,                                  -- 'pending' | 'on' | 'stopped'   (off = no row)
         lang text, at integer,                       -- the game language; when the player asked (ms)
         ok_at integer,                               -- when the address confirmed (ms)
         last_week text default '',                   -- the last week handled (sent or skipped), 'YYYY-MM-DD'
         quiet integer default 0)                     -- 1: the last letter after 8 weeks away went out
```

Nothing else: no email text, no copy of the save, no open or click data. A deleted account's row goes at once (trigger `users_letters_gone`)
and again from `tidy()`. Pending rows older than 7 days are dropped by `tidy()`.

- `GET /letters` (email account; 120/h) -> `{ state: 'off' | 'pending' | 'on' | 'stopped', lang, day: 0 (Sunday), hour: 10 }`.
- `POST /letters { on, lang? }` (email account; 20/h): `on: true` -> `pending` + the confirmation email (`on` already: only the language is
  updated; `stopped`: `409 stopped`; the daily confirmation cap: `429 rate_limited`); `on: false` -> the row is deleted (a `stopped` row
  stays). A guest: `403 no_account`. `lang` not one of the 12: English.
- `GET /letters/confirm?t=` and `GET /letters/unsub?t=` -> a small HTML page with one button (the row's language); `POST` to the same address
  does it. A bad, forged or expired token: a kind page, status 400, nothing changes. 60 an hour per IP.
- `POST /letters/hook` (Resend).
- Tokens: `v1.<c|u>.<lid>.<expiry, base 36 seconds>.<HMAC-SHA256 over "dd-letter-v1|kind|lid|expiry" with LETTERS_KEY, base64url>`.
- **The cron** (`scheduled`, `ltRun(env, now)`): inside the window it takes at most `LETTERS_CAP` rows a run (default 20, variable, at most
  200) and at most `LETTERS_DAY` letters a UTC day (default 80: Resend's free plan sends 100 a day and Forgot password must keep working),
  oldest `last_week` first. What is left is the **backlog**: the next hourly run takes it, until the window ends.
- **Never twice**: each row is claimed first (`last_week` compare-and-swap to this week), then sent with Resend's `Idempotency-Key`
  `dd-letter/<lid>/<week>`. A 429 or 5xx from Resend gives the claim back (and ends the run); any other refusal keeps the week as handled. A
  run that dies between claim and send skips that week's letter for those rows: late or missing, never double.
- A new opt-in starts with `last_week` = the current week, so the first letter is the next Sunday's.
- Limits: `LETTERS_GAP` ms between sends (default 550: Resend's 2 requests a second).

## 5. The game's save (`ltFields`, additive)

```
S.ltr = { st: '' | 'pending' | 'on' | 'stopped' (the Worker's last answer, for the Settings row),
          ask: 0|1 (the offer card was shown),
          b: [[jstDay, bondLevel, bondPts]] (the active dog's Bond at its first look each day, the last 9 days played),
          ev: [[jstDay, kind, value]] (at most 40, 9 days: w walks n, wi wishes n, t trick name, mk market buys n, v friend visits n, dg new dog n) }
```

Made on first use (`ltFields`) and written only while `ltOn()`: `migrate()` and `freshState()` do not touch it, so a save from before the
launch carries nothing of this. Fixed tokens and numbers only. Story chapters come from `S.story.c` (already dated).

## 6. Privacy page

`site/i18n/*.json` (12 languages) and `docs/itch/PRIVACY.md` get the letter lines: optional, off by default, what is used (the email, the
saved game, the language), what is kept (the choice, when, the language, the last week sent), sent through Resend, no tracking, how to stop.
The site is regenerated, **not deployed** here.

## 7. Tests

`game/test_letters_worker.js` (node, local D1, a fake Resend): the gate (constant vs game, 404 soon, env override, missing secrets), opt-in
(guest, pending, the confirmation mail and its caps, language fallback), tokens (valid, forged, expired, wrong kind), confirm and unsubscribe
(GET changes nothing, POST does), the cron (weekday and hour in JST, the 48 h window, one letter per week per account, a retry sends nothing,
the run cap and the backlog, the day cap, 429 gives the claim back, away weeks 1/2/4, the 8-week goodbye then silence, playing again), the
letter text for sample saves (snapshots in `en` and `ja`, all 12 languages render with no `{var}` left), name safety, headers
(`List-Unsubscribe`, `Idempotency-Key`), the bounce and complaint hook, deletion (trigger and tidy), `letters_text.js` fresh.
`game/test_letters.js` (browser, the real Worker on a local D1): off before the launch (no row, no route asked), the Settings row for no
cloud / guest / account, on -> pending -> on, off, stopped, the sample letter, the offer card (not on day 1, not before Bond 3 or day 7, not
over a sheet, once, "No thanks" never again, "Yes" asks the Worker), `S.ltr` notes, migration, an older Worker (404), phone 360x640 fit.

## Status

Built 18 Nov 2026 on `claude/dog-letter-email` (not merged, not deployed, no real email sent, Cloudflare and Resend untouched). `LT_FROM` and
`LETTERS_FROM` are both empty: nothing shows in the game and the Worker's routes answer 404.
New text: 71 game keys (`lt.*`: 52 for the email, the confirmation email and the two pages, 19 for the Settings row, the card and the toasts) and
6 new + 3 changed site keys (`privacy.letters.*`, `privacy.collect.email`, `privacy.dont.email`, `privacy.where.text`), all in 12 languages; game and
site font subsets, `packed.js` and `cloudflare/letters_text.js` rebuilt. CSS classes are `ltr-*` (the litter cards own `lt-*`).
Checks: `letters_worker` 169, `letters` 58, the `lt` step of `i18n_fit` (12 languages x 5 sizes, 480 states, 0 findings), the routes and the cron
once in real workerd (Miniflare, by hand). Green, one at a time: `letters`, `letters_worker`, `v230_worker`, `v230_together`, `worker` (Node and
Miniflare, now with two modules), `v224_worker`, `promo_worker`, `smoke`, `i18n`, `copy`, `itch_build`, `site` (split mode).

Not done here, on purpose: the Worker deploy, `tools/resend_setup.sh`, any Cloudflare or Resend change, the site deploy, CHANGELOG, the NEWS entry
(a "What's new" line belongs to the launch, with its date).

Before launch the owner:
1. **Resend**: checks that the sending domain doodledoggo.app is verified (the Forgot password email already uses it), that open and click
   tracking are **off** for the domain (the privacy page promises no tracking), and that the plan covers the list: the free plan sends 100 emails a
   day, so the Worker's default is 80 letters a day (`LETTERS_DAY`) and 20 a run (`LETTERS_CAP`), about 160 to 240 letters a week. More
   subscribers need a paid Resend plan and higher variables. A paid Workers plan is advised for the cron (the free plan's 10 ms of CPU a run is
   tight for reading saves).
2. Approves the **Worker deploy** (`bash tools/cf_api_deploy.sh`): the table `letters` and the trigger `users_letters_gone`, `letters_text.js` as
   the Worker's second module, the two Cron Triggers (`0 1-23 * * SUN`, `0 * * * MON`), a generated `LETTERS_KEY` secret (made once, never
   printed), and plain variables kept across deploys from now on (`keep_bindings` gains `plain_text`).
3. Optional but advised: adds the **Resend webhook** `https://api.doodledoggo.app/letters/hook` (events `email.bounced`, `email.complained`) and
   sets its signing secret as the Worker secret `RESEND_WEBHOOK_SECRET`. Without it bounces and complaints do not stop the letters by themselves.
4. Approves the **site deploy** (the privacy lines in 12 languages, `site/img/mail/letter.png`), then sets the Worker variable `LETTERS_IMG=1`.
5. Sets the **launch date**: `LT_FROM` in `game/src/59b_letters.js` and `LETTERS_FROM` in `cloudflare/worker.js` (the same `YYYY-MM-DD`; the suite
   fails when they differ), the privacy page's date (`POLICY_DATE` in `tools/site_i18n.js`), a NEWS entry, then the usual release.
