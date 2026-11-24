# Handoff: Doodle Doggo · MERCH session

Written by the Game Manager (GM), 24 Nov 2026 (JST). This session owns the "My dog" merch shop. Read `CLAUDE.md` (the owner's standing
rules apply to you too), then this file, then `docs/design/merch/`.

## What the owner asked for (23-24 Nov 2026)

- A merch shop on doodledoggo.app where **each player prints their own in-game dog** on real things (cups, tees, sweaters...), choosing
  their favourite dog. "Go straight to my-dog printing." Buyers: **mostly USA and UK, not Asia.**
- The owner wants a separate session for it (this one), briefed with the house rules.

## Where things stand

Branch `merch/shop` (from the spike branch `claude/merch-print` + main). Nothing is built into the site or the game, nothing is deployed,
no payment code exists.

| Piece | Where | State |
|---|---|---|
| Provider research | `docs/design/merch/PROVIDERS.md` | Done. Recommend **Printful** (prints in the USA and the UK, per-order unique file by API, draft orders, no sandbox), backup Gelato; Fourthwall = merchant-of-record alternative (checkout on their side, UK customs risk, per-player hidden products not verified). |
| Transactions | `docs/design/merch/TRANSACTIONS.md` | Done (draft). Our own Stripe Checkout on a **new, separate Stripe account** (Hong Kong seller, the owner lives in Japan), Stripe Tax, guest checkout, one item per order, 1-hour cancel window, D1 `merch_orders`, `/merch/*` routes, gate off by default. Managed Payments (the Kind shop's model) does not cover physical goods. |
| Print spike | `docs/design/merch/SPIKE.md`, code `merch/`, `tools/merch_*` | Done. `PawPrint` redraws a dog from a ~28-character recipe, byte-identical to the game (483/483). Server render with resvg: needs **Workers Paid** (30 s CPU); tee 4500x5400 in 12 bands. Phones make previews only. |
| Shop page design | `docs/design/merch/DESIGN.md`, `docs/design/merch/prototype/` (open `index.html`; pictures in `shots/`) | Done as a clickable prototype (6 steps, phones first). The owner has seen the pictures; no feedback yet. |

## The owner's answers (24 Nov 2026, about 12:50 JST, in the choice window; the owner's own words in quotes)

1. Countries: "We can ship to everywhere not only mention USA, we can list free shipping with purchase over $50usd". So: **worldwide**, not
   USA-only. Still open: the UK needs a UK VAT registration before the first UK sale, and the EU has its own rules (PROVIDERS.md 2). The
   MERCH session must put that to the owner with a country list (`COUNTRIES.md`) before anything is built for those countries.
2. Currencies: "Showing usd only, and buyers can decide which currency they use when they pay in stripe". So: **one USD price list**, and
   Stripe's own currency choice at checkout (Adaptive Pricing), not a GBP list.
3. Products at launch: **mug, tee, sticker sheet.**
4. Returns: **none for a change of mind; free reprint or refund for damage, misprint or loss; 1-hour cancel window.**
5. Delivery: "The selling price is included the shipping fee, but i want to make more income, please research for a reasonable shipping
   fee, we can do free shipping if they purchase over $50/ smaller amount we can do free shipping". So: **a shipping fee on small orders
   and free shipping over a threshold (US$50 or lower)**; the owner wants more income per order. This needs a **cart** (more than one
   item per order), which TRANSACTIONS.md had rejected: the order flow changes.
6. Cloudflare: "It is free plan as i know, but can u try to put it on cloudflare first, otherwise lets see if we can do it in free way".
   So: **no paid plan assumed.** Find a way to make the print files on Cloudflare Free, or another free way.

Work that followed (see the files): `ECONOMICS.md` + `tools/merch_econ.js` (margins with Stripe Hong Kong fees), `PRINT_FILES.md` (print
areas; the tee is settled), `BUILD_PLAN.md` (parts; to be updated for the cart, worldwide and the free plan).

Only the owner can: open the Printful account and its payment method, open the separate Stripe account and turn on Stripe Tax, register
for tax where needed (with an accountant: we give research, not tax advice), set secrets in the dashboards, order real samples.

## Known problems to solve in the build

- Unit economics in PROVIDERS.md used Stripe **Japan** fees; redo with Stripe **Hong Kong** fees (TRANSACTIONS.md has them).
- The tee print area differs between the design (dog about 35% of the width) and the spike (about 45%): settle it from Printful's file rules.
- Dark garments: dark outlines and the brown name vanish (white border, light name). Stickers: hearts and sparkle float off the dog (cut line).
- Names: Latin letters only for now, 20 characters, a word filter. Keep each printed PNG (art may change later).
- resvg 2.6.2 crashes on elements fully outside the drawing area (worked around per band).
- The Shiba happy-pose fill outside its outline is GAME art: the GM fixes it on main (not you).

## Suggested next steps (after the owner answers)

1. Turn the prototype into the real `/merch` page in **test mode only** (site style, English first), with PawPrint previews.
2. Worker `/merch/*` routes behind a gate that is OFF (`MERCH_FROM = ''`), Stripe test keys, Printful draft orders; tests for every step.
3. Legal pages (terms of sale, shipping and returns, privacy additions) as drafts for the owner.
4. The owner orders real samples of every product; only then a launch date, set by the owner.

## Working with the Game Manager

- GM session: `session_01D6KLY4c4fCxHWPdQRekZXZ` ("Doodle Doggo" Game Manager). MARKETING session: `session_01D6KLY4Gxx78VuyjbRFaSgb`.
- You work on `merch/shop` (and worktrees/branches from it). **You do not push to `main`, release, or deploy.** The GM merges, releases
  and deploys after the owner's go-ahead. Send the GM a short message when a part is ready to merge or when you need a change in shared
  files: `game/src/*`, `cloudflare/worker.js`, `cloudflare/schema.sql`, `site/tpl/*` and the site header, `tools/cf_*`. Prefer new files
  (`merch/`, `site/merch*`, `cloudflare/merch_*.js`) so merges stay small.
- Anything about reels, posts or captions goes to MARKETING, not to you and not to the GM.
