# doodledoggo.app split deploy: plan (17 Nov 2026, not deployed)

The main site Worker `doodle-doggo` is at **9.57 MB gzipped** of the paid plan's 10 MB limit (inline build of `main`, v2.29), with the site
test budget at 9.8 MB. The Cloudflare token can create Worker routes since 16 Nov 2026 (checked by creating and deleting a test route), so the
split mode that `tools/cf_site.js` has had since v2.14 (never deployed) can now go live and free about 7.6 MB.

## What goes where

| Worker | Serves | Route(s) on the zone | Gzipped (17 Nov build) |
|---|---|---|---|
| `doodle-doggo` (main, Custom Domains `doodledoggo.app` + `www`) | every page in 12 languages, `/f/<code>`, brand files, art, `/style.css`, `/js/site.js`, the 404s, `www` -> apex, `/play` -> `/play/` | none (Custom Domain) | 9.57 MB inline -> **1.97 MB** split |
| `doodle-doggo-fonts` | the site's per-language fonts (`site/fonts/i18n/*.woff2`, `.css`, OFL notes) and the game copy's font subsets | `doodledoggo.app/fonts/i18n/*`, `doodledoggo.app/play/fonts/i18n/*` | 2.70 MB |
| `doodle-doggo-img` | the `/map` place pictures (`site/img/map/`) | `doodledoggo.app/img/map/*` | 1.43 MB |
| `doodle-doggo-play` | the game copy at `/play/` (the itch build: `index.html`, `lang/*.<hash>.js`, `photo_fonts`, `world_f/g`, brand files) | `doodledoggo.app/play/*` | 3.48 MB |

Routing: a Worker route runs before the Custom Domain Worker (Cloudflare docs, "Custom Domains: Interaction with Routes"), and of two matching
routes the more specific wins, so `/play/fonts/i18n/*` goes to the fonts Worker, the rest of `/play/*` to the game Worker. `/play` (no slash)
matches no route and stays with the main Worker, which redirects it to `/play/` (as now). `www.doodledoggo.app` has no routes: the main Worker
redirects it to the apex, where the routes apply. No route touches a page path, `/f/*`, `/thanks` or `/reset`.

The routes come from one table: `tools/cf_site.js` writes `_cfsite/routes.txt` (`<folder> <script> <pattern>`), which the deploy script and the
site suite both read. Headers are the inline build's: hashed game files and the game fonts a year (`immutable`), HTML 5 minutes
(`/play/` with `stale-while-revalidate`), everything else a day, `nosniff` everywhere, the game's own CSP (`frame-ancestors 'self'`) on `/play/`.

## Fixes made while preparing (17 Nov)

- `cf_pages_deploy.sh`: `SITE_BUILD_ONLY=1` (builds every bundle, prints each gzipped size against 10 MB and the routes, exits before any
  Cloudflare call); `SITE_SPLIT=1` shorthand; refuses any bundle over 10 MB; routes from `_cfsite/routes.txt`; every side Worker is uploaded
  before any route and the main Worker last, so no path is ever without a Worker that has its files.
- **Stale-route guard**: once the split is live, the plain inline deploy would upload a main Worker whose `/play/`, fonts and pictures are
  shadowed by the routes, so the game copy would silently stay old. The deploy now lists the zone's routes (read only) and refuses while a split
  route it does not want is live; `SITE_DROP_ROUTES=1` is the rollback (upload inline, then delete those routes).
- Mixed mode (`SITE_PLAY=split` with fonts inline) sent `/play/fonts/i18n/*` to the game Worker, which did not have the fonts (404): the game
  fonts now ride in the game Worker in that case, and the `/play/fonts/i18n/*` route is only made when the fonts Worker has them.
- Side Workers cached unversioned files (map pictures, site fonts CSS, `/play/` brand files) a week, the main Worker a day: now a day, so the
  move changes no caching (an updated `/map` picture is not stuck for a week).
- `game/test_site.js`: it could not test `SITE_PLAY=split` (no game Worker, so `/play/` 404'd). It now routes requests through
  `_cfsite/routes.txt` like the zone does (browser and direct requests, query strings and redirects kept) and checks the routes, each side
  Worker's size, content types, caching, CSP, the main Worker leaving routed paths alone, and the `/play` redirects.

## Deploy (needs the owner's go-ahead, as every site deploy)

From `main` with the itch build of `main`:

```sh
NODE_PATH=$(npm root -g) node tools/itch.js
SITE_SPLIT=1 SITE_BUILD_ONLY=1 SITE_GAME=$PWD/dist/itch bash tools/cf_pages_deploy.sh   # sizes and routes, no upload
SITE_SPLIT=1 SITE_GAME=$PWD/dist/itch bash tools/cf_pages_deploy.sh                     # the deploy
```

Order inside: upload `doodle-doggo-fonts`, `-img`, `-play`; create (or repoint) the four routes; upload `doodle-doggo`; re-PUT the Custom Domains;
the curl checks. From then on **every site deploy must use `SITE_SPLIT=1`** (the plain one refuses); flip the default in
`cf_pages_deploy.sh` and the paw-release skill (`SITE_GAME=... bash tools/cf_pages_deploy.sh`) in the commit after the live check passes.
**Done 18 Nov 2026:** split deployed with v2.31, live checks passed, `/play/` md5 matches itch, default flipped (inline = `SITE_SPLIT=0`).

## Roll back

```sh
SITE_DROP_ROUTES=1 SITE_GAME=$PWD/dist/itch bash tools/cf_pages_deploy.sh
```

It uploads the inline main Worker (9.57 MB, which has every file again) and then deletes the four routes, so nothing 404s in between. The three side
Workers stay, unrouted and harmless; delete them in the dashboard (Workers & Pages) only if wanted. By hand: Workers & Pages > doodle-doggo-* >
Settings > Domains & Routes > remove each route, after the inline upload.

## Live checks after the deploy

The script prints status and type for the pages, `/img/map/town-map.webp`, `/play/`, `/fonts/i18n/ja.css`, `/play/fonts/i18n/ja.woff2` and
the `/play` redirect. Then:

```sh
for u in /play/ /play/fonts/i18n/ja.woff2 /fonts/i18n/ja.woff2 /img/map/town-map.webp /ja/map /; do
  curl -sSI "https://doodledoggo.app$u" | grep -iE '^(HTTP|content-type|cache-control|content-security-policy)'; done
curl -sSI "https://doodledoggo.app/play" | grep -i location          # https://doodledoggo.app/play/
curl -sSI "https://doodledoggo.app/play/?friend=dog-abcde" | grep -i location   # /play/?friend=DOG-ABCDE (the game Worker's friend redirect)
curl -sSI "https://www.doodledoggo.app/play/" | grep -i location     # https://doodledoggo.app/play/
```

- `/play/` is `text/html` with `frame-ancestors 'self'`; the font is `font/woff2`, a year `immutable`; the map picture `image/webp`, a day.
- In a browser: the home page plays the game in its box (en and ja: Japanese text in the game's font, not tofu), `/ja/` shows the Japanese site
  font, `/map` shows every place picture; no 404 in the console.
- Dashboard: Workers & Pages lists the three side Workers with their routes; `doodle-doggo` is about 2 MB.
- Then run the site suite against `main` with `SITE_SPLIT`-style env (`SITE_FONTS=split SITE_IMG=split SITE_PLAY=split`) once more and flip
  the default.

## Test

```sh
SITE_FONTS=split SITE_IMG=split SITE_PLAY=split SITE_GAME=$PWD/dist/itch NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors \
  node game/run_tests.js site --jobs 1
```

17 Nov 2026, on `main` at ec1285e4 with its itch build: `site` PASS in split mode (493 checks) and inline (490 checks).
