# Merch part 4: the print render (25 Nov 2026)

Replaces part 3's render seam with the real print render of `RENDER_FREE.md` 8: Cloudflare's browser (Browser Run) draws the released print page and
the PNG goes into `MerchPrints`; the first fallback is resvg-wasm in a Durable Object ("option G"). **Nothing is deployed; no Cloudflare API was called
(the cloud test kit was only run dry).** Suite `merch_worker`: **194 checks, 194 pass** (181 before, 13 new `P4-*` rows); the Chromium truth script
`cloudflare/merch/test/render_chromium.mjs`: 18 checks, all pass.

## What was built

| File | What |
|---|---|
| `cloudflare/merch/render.js` | `screenshot(env, product, url[, via])`: `env.BROWSER.quickAction('screenshot', { url, viewport, screenshotOptions: { omitBackground: true }, waitForSelector: { selector: '#o svg' } })` as measured (tee 2250x2700 at 2, mug 2700x1050 at 1), our own 75 s limit, `X-Browser-Ms-Used` read and returned as `ms`, never throws. `classify()` for every non-picture answer. `resvg(env, product, url)`: the line's link to `MerchRender`. `gate()`: the front Worker's side of the `worker` path. `renderReady(env)`. `RENDER_FETCH` (part 3's fake protocol) still wins, so the 181 old checks run unchanged. |
| `cloudflare/merch/resvg.js` | `MerchRender`, a new SQLite Durable Object: the fallback. PawPrint and the wasm load on the first render only. Tee in 12 bands, mug in one piece, rows deflated as they come (`CompressionStream`), one PNG out. |
| `cloudflare/merch/vendor/resvg-wasm/` | `@resvg/resvg-wasm` 2.6.2, MPL-2.0 (`LICENSE-NOTICE.txt`): `index_bg.wasm` unchanged (2,478,606 bytes); `resvg_glue.js` = the package's `index.mjs` wrapped in one factory so each call makes a fresh wasm instance (the original allows one per module). Nothing else was added to the Worker. |
| `cloudflare/merch/ledger.js` | Only around `renderLine`: `shot()` (the budget and the "day out" check before the call), `browserBook()` (ms per UTC day, the 429 run, the day out, the owner email), `browserStatus()` (report), `renderTest()` (the self-test), a day called out early comes back at its own time (`until`), the nightly line, two tidy lines. Every ledger rule stays: the render step still claims first, re-reads after each await (S1), backs off a failed store without re-rendering (S11). |
| `cloudflare/merch/admin.js` | `POST /merch/admin/render-test` (same auth and rate limit as the other admin routes). |
| `cloudflare/merch/worker.js` | Exports `MerchRender` and the entrypoint `RenderGate` (three lines). |
| `tools/merch.sh` | `render-test <tee|mug> [browser|resvg] [direct|worker]` (dry run by default, like every sub-command). |
| `tools/merch_rtest.mjs` | The one cloud test, prepared (below). Dry run by default. |
| tests | `test/t_render.mjs` (13 rows, registered in `run.mjs`), `test/fakes.mjs` `fakeBrowser()` (a binding object, not a fetch), `test/render_chromium.mjs`. |

## Decisions (each can be changed)

1. **The fallback is its own class, `MerchRender`, not `MerchPrints` or the ledger.** A render takes 0.2-0.8 s of CPU here (1.2-1.7 s measured in the
   cloud); in its own object it never holds up the ledger's webhooks and checkouts or the file route, and a wasm trap breaks only it. Cost: one
   migration line, tag `v2`, `new_sqlite_classes = ["MerchRender"]` (SQLite, as Free requires). One instance (`'resvg'`): renders are 11 s apart anyway.
2. **The SVG is made in `MerchRender` from the line's own link** (`PawPrint.printFromHash`, the same function the print page runs), so the ledger sends
   only the link. The fallback has only the CURRENT PawPrint: a link of any other `av`, or a folder that is not the link's `av`, is refused
   (`{ ok: false, kind: 'error', why: 'art_ver' }`), never drawn with the wrong art (T2.2-49). Such a line waits for the browser.
3. **429 classifier.** The daily text (`/time limit exceeded for today/i`) is the day: the browser is not asked again until 00:00 UTC (`br_off` in
   `merch_meta`) and the fallback draws at once. Any other 429 is the 1-per-10-s rate: next try in 11 s. **N = 3**: three unknown 429s in a row,
   each 11 s or more apart (so never the 10-second rate), call the day out for **one hour** (not until midnight: the text is unverified), and the
   owner is told. Any other answer resets the run. A thrown error whose message has the daily text counts as daily; one with "429", "rate limit" or
   "too many requests" as rate.
4. **Our own budget: 540 000 ms of billed browser time a UTC day** (`MERCH_BROWSER_BUDGET_MS`; Free is 600 000). Past it the day is out for the
   browser, the fallback draws, the owner is told once (one owner email per reason and JST day, the existing outbox). The test Worker's example
   sets 60 000: it shares the account's 10 minutes, and each Worker only counts its own use.
5. **Owner email `browser_off`** for all three ways the day goes out (daily text, the 429 run, the budget), at most once a JST day.
6. **`MERCH_RENDER_VIA`**: unset or `direct` (default) = the ledger object calls `env.BROWSER`; `worker` = the object calls `env.SELF` (a service
   binding to this Worker's entrypoint `RenderGate`, a plain object export: not reachable from the internet), which calls the binding and returns
   Browser Run's status, `X-Browser-Ms-Used` and the body stream as they came (no PawPrint, no decoding). The gate opens only `<MERCH_PUBLIC_URL>/merch/print/<folder>/#p=...`.
7. **Time limits**: 75 s for a browser call (`MERCH_RENDER_TIMEOUT_MS`; Browser Run's own 60 s answer should come first), 60 s for a fallback call
   (`MERCH_RESVG_TIMEOUT_MS`), and inside the object 25 s, checked between bands (`MERCH_RESVG_BUDGET_MS`). A timeout is an `error`: once more after a
   minute, then the fallback, as T2.2-28.
8. **Self-test files** are stored in the day's normal print shard with a 15-minute link; the nightly tidy deletes them after that (`rt:<key>` rows in
   `merch_meta`). The self-test keeps the 11 s spacing; the one exception is `probe: true`, honoured only when `MERCH_RENDER_PROBE = "1"` (set only by
   the cloud test, to provoke Browser Run's own rate limit once).
9. **The mug is not opaque**: PawPrint's mug print is clear at the top corners and opaque along the name strip at the bottom (both Chromium and resvg).
   The tests check that, not "an opaque mug".
10. **Vendored, not an npm dependency**: the tests and the Miniflare run need the wasm without an install step. 2.4 MB of binary in git.

## The resvg fallback: what it took to make the bands right

resvg-wasm 2.6.2 cannot draw the 4500x5400 tee in one piece in 128 MB (192 MB of wasm memory, SPIKE.md), so it draws 12 bands of 450 rows (each drawn
48 rows taller on both sides, the extra rows cut off). Measured while building it, on the 8 sample dogs, 3 poses, navy and white tees and the mug:

- **A shape with its own `opacity`** crossing a band edge makes resvg 2.6.2 panic (`unreachable`: the akita tee, band 900-1350, even with nothing left
  out) or draw in the wrong place. So in a band such a shape's opacity moves into its one paint: no stroke -> `fill-opacity`; no visible fill
  (`fill="none"`, or a path of single straight segments, which has no area) -> `stroke-opacity`. Exact (one paint is one operation); the one-pass
  render with and without it differs by 0.001 per channel. A shape with both a fill and a stroke keeps its `opacity` (none in today's prints).
- **The nested `<svg>`** that places the art clips at its viewport, which resvg also draws through a layer. PawPrint always nests the art with a
  viewBox holding the whole drawing plus a margin (`pawprint_core.js` `nest()`), so in a band that `<svg>` is drawn as the `<g transform>` it means,
  only after checking every shape in it lies inside the viewport.
- **Culling** (a band leaves out shapes wholly outside it, the spike's work-around for the panic) uses each shape's own `PawPrint.bbox` in its chain
  of transforms; `bbox`'s per-element point list has no stroke pad, so each shape gets its own call, and a mitred join counts 4 half-strokes.
- Result: all 72 sample prints (8 dogs, 3 poses, navy tee, white tee, mug) draw without a trap; banded against one pass: mean difference 0.0006-0.0014 per channel.

## Numbers (this container, 4 vCPU; the cloud will differ)

| | tee 4500x5400 | mug 2700x1050 |
|---|---|---|
| resvg fallback in Node (12 bands / one piece), 3 dogs | 450-760 ms, 214-371 KB | 175-385 ms, 127-172 KB |
| resvg fallback in workerd (Miniflare), self-test | 600-780 ms, 313 KB (dane) | - |
| local Chromium through `render.screenshot` (the fake binding) | 487-636 ms, 824-982 KB | 222-326 ms, 347-445 KB |
| resvg fallback against Chromium, mean diff per channel over white / black (limit 0.2) | 0.008-0.020 / 0.008-0.020 | 0.108-0.155 / 0.081-0.114 |
| exact size, corners | 4500x5400, alpha 0 | 2700x1050, top clear, strip opaque |

All 8 sample dogs pass the Chromium script (`DOGS=` picks them). The mug's difference (0.11-0.16) is resvg's crayon edges against Chromium's, as
RENDER_FREE 3 measured (0.107-0.114); it is the closest any check comes to its limit.

**Bundle** (`wrangler deploy --dry-run`, wrangler 4.50.0, the real `cloudflare/merch/worker.js` with every binding): **Total Upload 3,591 KiB, gzip
1,247 KiB** (`worker.js` 314 KiB gzip, the wasm 928 KiB gzip as its own module), under the Free limit of 3 MB gzip. Wrangler keeps
`import('./...index_bg.wasm')` as a dynamic import of a separate module; module start-up instantiates no wasm (row `P4-ready` counts
`WebAssembly.instantiate` and `compile` calls: 0 at import and in the constructor) and loads no PawPrint. The bundle's module load in Node: 19 ms.
The cloud test's Worker (with the print page as text modules): 4,392 KiB, gzip 1,515 KiB.

**Capacity**: unchanged from RENDER_FREE 8 for Browser Run (about 410 tees a day in 600 s; 370 in our 540 s budget). The fallback has its own Durable
Object budget (13,000 GB-s a day on Free: tens of thousands of tees).

## Test rows

| Id | What | Status |
|---|---|---|
| P4-shot | the exact quickAction call; a real PNG stored whole and back byte for byte; ms booked per UTC day; the tee viewport | pass |
| P4-size | a wrong-size picture: error, retry after 1 min, then resvg (renderer resvg) | pass |
| P4-daily | the daily 429: resvg at once, the browser not asked until 00:00 UTC, owner told once; a thrown daily text too | pass |
| P4-rate | an unknown 429: 11 s, no hold, text kept; 3 in a row: an hour out, resvg, owner told; asked again after the hour | pass |
| P4-budget | the budget switch; report and nightly line; the default 540 000 ms | pass |
| P4-timeout | our own time limit; a throw; 120 characters kept; no binding: not_set_up | pass |
| P4-via | `MERCH_RENDER_VIA=worker` through `RenderGate`; the gate refuses other pages and GET; throw and daily through the gate | pass |
| P4-artver | the fallback refuses another art_ver (object and render.js); the current one is drawn | pass |
| P4-admin | the self-test: auth, JSON, link, no order, 11 s, budget, probe switch, `merch.sh render-test`, tidy deletes it | pass |
| P4-resvg-real | the real fallback: 3 dogs x tee and mug pass `pngOk`, corners, banded = one pass | pass |
| P4-trap | a wasm trap: 500, a fresh instance next time; the fallback's own time limit | pass |
| P4-ready | `renderReady`; the shop shut without the binding (M5); no wasm at start-up | pass |
| P4-miniflare | workerd: a daily 429 in a real alarm -> `MerchRender` with the `CompiledWasm` module draws the mug; tee self-test by resvg; mug via `SELF`/`RenderGate` | pass |

Miniflare cannot emulate Browser Run's binding, so `P4-miniflare` wraps the real Worker in a test entry that gives every object a `BROWSER` whose
`quickAction` reaches the Node fake through a service binding. Everything else in it is the real code in workerd: the SQLite objects, the wasm as a
`CompiledWasm` module loaded by a dynamic import, PawPrint and the sample dogs as CommonJS, the self binding to the `RenderGate` entrypoint.

## Unverified until the cloud test

- Whether a **Durable Object may call the Browser Run binding** (the `direct` default) or only the Worker can (`MERCH_RENDER_VIA = "worker"`).
- **What `quickAction` returns** on 429 and errors: a Response with the status (assumed and handled) or a throw (also handled).
- **The rate-limit 429's text** (recorded once by the probe), and whether `X-Browser-Ms-Used` also comes with errors.
- The fallback's CPU and wall time in a Free Durable Object with this code (the spike's version ran there in 1.15-1.70 s a tee).
- That the self binding to `RenderGate` can be made by the API upload in one Worker (the kit uploads twice: the second upload adds it).
- The metadata form of `migrations` and the `browser` binding in a direct API upload (wrangler's own form is in `wrangler.example.toml`).

## The cloud test (run book; the owner approves it first)

`tools/merch_rtest.mjs`. Dry by default: it bundles with `wrangler --dry-run` (no Cloudflare call, metrics off) and prints every request.

1. Owner's go-ahead for one throwaway Worker on the Free plan, about 10 s of browser time (the kit caps the Worker's budget at 60 s).
2. In a Claude cloud session (the proxy adds the token) or with `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit) exported:
   `NODE_PATH=$(npm root -g) DRY_RUN=0 RTEST_GO=yes-the-owner-approved node tools/merch_rtest.mjs` (`WRANGLER=<bin>` to use an installed wrangler).
3. It counts Workers and Durable Object namespaces, uploads `doodle-doggo-merch-rtest` (workers.dev only, no domain, no cron, shop shut, random
   admin and file keys made in memory), and runs 14 self-tests 12 s apart: tee and mug for akita, dane and golden by the browser (direct), golden's
   tee and mug through the Worker, the same 6 by resvg; then the rate probe (two calls 1 s apart). 10 browser renders in all.
4. Each file is downloaded through its signed link (sha checked) and compared with this machine's Chromium (`equal_px` should be 1.0 for the
   browser files, as on 24 Nov; mean difference under 0.2 for resvg).
5. Always, even after an error: the Worker is deleted with `force` (its Durable Object namespaces go with it) and the counts are compared.
6. The results go to `RTEST_OUT` (a temp folder by default; never the repo): `rtest-report.json` with each status, `ms_used`, size, sha, the 429
   texts and the differences. Then: set `MERCH_RENDER_VIA` from what worked, write the 429 text into `render.js` if it is not the daily one, and
   tick the PART3.md checklist line.

Dry run here (25 Nov 2026): clean; every request printed, nothing sent; a real run without `RTEST_GO` is refused (exit 2).
