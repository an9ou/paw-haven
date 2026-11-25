# Merch part 4: the print render (25 Nov 2026)

Replaces part 3's render seam with the real print render of `RENDER_FREE.md` 8: Cloudflare's browser (Browser Run) draws the released print page and
the PNG goes into `MerchPrints`; the first fallback is resvg-wasm in a Durable Object ("option G"). **Nothing is deployed; no Cloudflare API was called
(the cloud test kit was only run dry).** Suite `merch_worker`: **194 checks, 194 pass** (181 before, 13 new `P4-*` rows; one old check changed: R-S12 now counts 3
Durable Object bindings under `[env.test]`, since the test Worker needs `RENDER` too); the Chromium truth script
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

**The cloud test ran on 25 Nov 2026: see "The cloud test: results" below.** Settled: the first, the fourth to the eighth points. Still open: the 429
texts and what an error looks like (results, points 6 and 7).

- Whether a **Durable Object may call the Browser Run binding** (the `direct` default) or only the Worker can (`MERCH_RENDER_VIA = "worker"`).
- **What `quickAction` returns** on 429 and errors: a Response with the status (assumed and handled) or a throw (also handled).
- **The rate-limit 429's text** (recorded once by the probe), and whether `X-Browser-Ms-Used` also comes with errors.
- The fallback's CPU and wall time in a Free Durable Object with this code (the spike's version ran there in 1.15-1.70 s a tee).
- That the self binding to `RenderGate` can be made by the API upload in one Worker (the kit uploads twice: the second upload adds it).
- The metadata form of `migrations` and the `browser` binding in a direct API upload (wrangler's own form is in `wrangler.example.toml`).
- (Added by the review.) The front Worker's start-up time and CPU with the wasm module in the bundle (the kit records `startup_time_ms` from both
  upload answers and reads `workersInvocationsAdaptive` once, if the token may read analytics).
- (Added by the review.) The PNG colour type Browser Run returns (the file check wants 6, RGBA; the kit records it for every browser file).
- (Added by the review.) Whether `X-Browser-Ms-Used` comes with errors and timeouts (the kit records `ms_used` on every failed answer; without it
  the ledger books the wall time).
- **Stays unverified even after the cloud test**: the real text of Browser Run's daily 429. The kit never spends the day's 10 minutes to provoke
  it; `render.js` matches "time limit exceeded for today" from Cloudflare's limits page, and three unknown 429s in a row call the day out for an
  hour anyway (decision 3).
- The tee comparison of the review stopped at 83 of 101 dogs (time); `render_chromium.mjs` covers all 8 sample dogs (`DOGS=` with all 8 ids).

## The cloud test (run book; the owner approves it first)

`tools/merch_rtest.mjs`. Dry by default: it bundles with `wrangler --dry-run` (no Cloudflare call, metrics off) and prints every request.

1. Owner's go-ahead for one throwaway Worker on the Free plan, about 10 s of browser time (the kit caps the Worker's budget at 60 s).
2. In a Claude cloud session (the proxy adds the token) or with `CLOUDFLARE_API_TOKEN` (Workers Scripts: Edit) exported:
   `NODE_PATH=$(npm root -g) DRY_RUN=0 RTEST_GO=yes-the-owner-approved node tools/merch_rtest.mjs` (`WRANGLER=<bin>` to use an installed wrangler).
3. It lists the accounts (more than one and no `CLOUDFLARE_ACCOUNT_ID`: refused, nothing made), counts Workers and Durable Object namespaces,
   uploads `doodle-doggo-merch-rtest` (workers.dev only, no domain, no cron, shop shut, random admin and file keys made in memory; from the
   moment the first upload is sent the Worker counts as made), and runs 14 self-tests 12 s apart: tee and mug for akita, dane and golden by the
   browser (direct), golden's tee and mug through the Worker, the same 6 by resvg; then the rate probe (two calls 1 s apart). 10 browser renders
   in all. After 2 browser failures every later browser job and the probe are skipped (and reported); the resvg jobs still run.
4. Each file is downloaded through its signed link (sha and PNG colour type recorded) and compared with this machine's Chromium (`equal_px`
   should be 1.0 for the browser files, as on 24 Nov; resvg within `render.js` `MATCH`: mean under 0.2 and at most 5,000 / 3,000 pixels more than
   32 apart). Then the start-up time (from the upload answers) and the front Worker's CPU (GraphQL, read only) if readable.
5. Always, on every way out (an error, Ctrl-C, SIGTERM): the Worker is deleted with `force` (its Durable Object namespaces go with it; a 404
   means it is gone already) and the counts are compared. **If the delete fails**, the kit prints this one line, still prints the counts and
   writes the report, and exits 3:
   `CLEAN UP BY HAND: the test Worker doodle-doggo-merch-rtest may still exist. In the Cloudflare dashboard open Workers & Pages, select doodle-doggo-merch-rtest, Settings, Delete (its Durable Objects go with it).`
6. The results go to `RTEST_OUT` (a temp folder by default; never the repo): `rtest-report.json` with each status, `ms_used` (also on errors),
   `ms_booked`, size, colour type, sha, the 429 texts, the differences, `startup_ms` and `cpu`. Then: set `MERCH_RENDER_VIA` from what worked,
   write the 429 text into `render.js` if it is not the daily one, and tick the PART3.md checklist line.

Dry run here (25 Nov 2026): clean; every request printed (the GraphQL read too), nothing sent; a real run without `RTEST_GO` is refused (exit 2).
`RTEST_FAKE=<cases>` runs the whole kit against an in-memory fake of the API (row F4-kit): nothing is sent, no bundle, no waits.

## The cloud test: results (25 Nov 2026, 14:34 JST; the owner approved it in the choice window)

One real run of `tools/merch_rtest.mjs`. The Worker `doodle-doggo-merch-rtest` was deleted at the end and the account counted the same as before
(6 Workers, 0 Durable Object namespaces). About 6.5 s of the day’s browser time was used. 13 of the 14 self-tests passed; the one that did not is
a test-kit matter, not a render matter (point 8).

1. **A Durable Object may call the Browser Run binding**: all 5 direct renders that ran passed. `MERCH_RENDER_VIA = "direct"` stays the default;
   the way through the front Worker (`"worker"`, the self binding to `RenderGate` added by the second upload) works too (2 of 2), so it stays as
   the switch to fall back on.
2. **Pixel-exact**: every browser file (2 tees, 3 mugs direct; 1 tee, 1 mug through the Worker) equals this machine’s Chromium pixel for pixel
   (`equal_px` 1, `far_px` 0). PNG colour type 6 (RGBA) every time, as the file check wants. Sizes 4500x5400 and 2700x1050; 247-528 KiB.
3. **Browser time billed** (`X-Browser-Ms-Used`, a fraction of a millisecond, e.g. 526.14): tee 1,065-1,449 ms, mug 465-702 ms; wall time 1.0-1.8 s.
   That is in line with RENDER_FREE 8 (about 410 tees a day on Free).
4. **The resvg fallback in a Free Durable Object**: 6 of 6 drawn; tee 646-851 ms wall, mug 298-368 ms; all inside `MATCH` against Chromium
   (tee mean 0.013-0.020 a channel and 811-1,274 far pixels of 5,000 allowed; mug mean 0.08-0.16 and 590-975 of 3,000).
5. **The upload**: the metadata form of `migrations`, the `browser` binding and the three SQLite Durable Object classes was accepted as written;
   bundle 4,416 KiB, gzip 1,522 KiB (Free limit 3 MB gzip). Start-up time 1 ms and 2 ms. Front Worker CPU p50 0.8 ms, p99 2.9 ms (58 requests).
6. **The rate limit was NOT met**: the probe’s two calls 1 s apart both answered 200 with the very same `X-Browser-Ms-Used` (464.810546875), so
   the second was most likely Cloudflare’s own short cache of an identical quick action, not a second drawing. So the real text of the rate 429
   stays unverified, like the daily one. Nothing changes in the code: the ledger never asks more often than every 11 s, an unknown 429 is retried
   in 11 s, and three in a row call the browser off for an hour (decision 3). A cached answer books its browser time a second time, which only
   errs on the safe side.
7. **Still unverified**: both 429 texts; what an error or a timeout of the browser looks like and whether `X-Browser-Ms-Used` comes with it (no
   browser call failed in the run).
8. **The one failure** (akita tee, the very first self-test): the kit’s own POST got `404 error code: 1042` from workers.dev in 0.4 s, before the
   Worker ran: the workers.dev address had only just been switched on and one edge did not know it yet (the print page had already answered
   once). No browser call was made. The other two tees (dane, golden) passed. If the kit is ever run again: wait for three good answers in a row
   and retry a 404 with 1042 once. The shop itself runs on a custom domain, where this cannot happen.

## Review fixes (25 Nov 2026)

The 11 findings of `docs/reviews/MERCH_PART4_review.md`, branch `merch/part4-fixes`. Suite `merch_worker`: **223 checks, 223 pass** (212 before, 11 new
`F4-*` rows; R-S12 extended); `render_chromium.mjs` ALL OK on all 8 sample dogs (`DOGS=akita,dane,dachs,golden,corgi,newborn,black,white`), with the new
file checks, the far-pixel limit and two self-checks. The kit's dry run is clean. Nothing deployed, no Cloudflare API called.

| # | Finding | What changed | Test |
|---|---|---|---|
| 1 | `pngOk` checked only size and bytes | `render.pngCheck` (the ledger's `pngOk` / `pngWhy`): exact size, IHDR 8-bit colour type 6 (RGBA), not interlaced, a least byte size (tee 128 KiB, mug 64 KiB) and the old 7.5 MB most, the chunk list whole to IEND (a cut file fails), and for the tee the first scanline inflated (`DecompressionStream('deflate')`, stopped as soon as one row is out; the other 5,399 rows are never inflated) with every alpha 0. The mug has no alpha check (its top corners are clear by design, its name strip opaque). The check is async: `shot()` runs it before booking, `renderLine` re-reads the order after it (`live()` before the fallback and before the store). A browser file that fails is a browser error (it counts toward finding 4's run); the self-test reports `png_why` and `colour_type`. | F4-png; `render_chromium.mjs` (every Chromium and resvg file of the 8 dogs passes; a tee shot without `omitBackground` comes back colour type 2 and is refused) |
| 2 | the mean could not see a missing body part | `render.js` `MATCH` (mean 0.2; pixels more than 32 apart in any channel over white or black: tee 5,000, mug 3,000) and `matchPx`, used by `render_chromium.mjs` and the kit's `compare()` (`pass`). Measured on the 8 sample dogs: at most 1,302 (navy tee) and 1,042 (mug) such pixels, 1,687 on a white tee (measured once). Self-check: a 1/5-scale pass finds the akita tee's shapes whose loss changes about 10,000+ pixels (22 of 53); the 6 the mean sees least each fail the match when left out, all 6 while the mean alone passes (closest: mean 0.063, 10,076 pixels) | F4-match; `render_chromium.mjs` |
| 3 | the kit could leave the Worker behind | `ST.made = true` before the first upload is sent; `cleanUp()` runs once on every way out (an error, SIGINT, SIGTERM: handlers that clean up, then exit 130 / 143); a 404 on DELETE is done; a failed DELETE is caught, prints the hand line (run book step 5), the counts and the report still follow, exit 3. `RTEST_FAKE` runs the kit against an in-memory fake API (no network, no bundle, no waits) | F4-kit (upload timeout after "creating" -> deleted; delete fails -> the line, exit 3; 404; SIGTERM while waiting -> deleted, exit 143) |
| 4 | browser errors were invisible; time booked only from the header | `render.screenshot` returns `wall` for every real call (not for not_set_up or a gate refusal); `browserBook` books `X-Browser-Ms-Used`, else the wall time (`ms_booked` in the self-test). `ERROR_RUN = 3` (ledger.js, next to `RATE_RUN`): 3 browser errors in a row put the browser off for an hour (`br_off` why `errors`, the `browser_off` owner email once a JST day); while off, a line gets the fallback at once and is still an error for T2.2-28 (a line neither renderer can draw is rejected as before, not kept waiting); any good answer resets the run. The kit stops all browser jobs (and the probe) after 2 failures and reports `browser_stopped` | F4-time, F4-errors, F4-kit |
| 5 | an opacity or clip layer across a band edge could crash resvg or draw in the wrong place | `splitBands` -> `layerCheck`: a shape whose opacity stays (fill and stroke), any shape or group with `opacity`, `clip-path`, `mask` or `filter`, or a nested `<svg>` that clips, crossing a band edge, throws `layer: ...` before any band is drawn; `MerchRender` answers 422 `layer` (the wasm instance kept), `render.resvg` why `layer`. In `renderLine` a fallback that cannot draw the line (`layer` or `art_ver`) after two browser errors makes it **wait for the browser** (kind `wait`: an hour, held after the cancel hour, the owner told at 2 h, refunded at 72 h), never rejected and refunded. With the browser out for the day the line waits for 00:00 UTC as T2.2-29 (held, 2 h email, 72 h refund). All 336 tee prints of the 8 sample dogs (7 colours, 3 poses, name on and off) split without a refusal | F4-layer (made-up SVGs: opacity shape, group, clipping `<svg>`; the object; the ledger) |
| 6 | the self-test row deleted in its own transaction | the `rt:` rows are deleted in the same transaction as the trash rows | F4-tidy (a crash at the trash insert rolls back both; the next tidy deletes the file) |
| 7 | `RENDER` not listed; `not_set_up` never tried resvg | `render.renderParts` in `browserStatus().parts` and the nightly line ("set up: browser yes, fallback RENDER yes / MISSING"); a browser `not_set_up` answer goes to the fallback | F4-ready |
| 8 | R-S12 did not check the test Worker's browser or SELF | R-S12 also checks `[env.test.browser]` binding BROWSER and `[[env.test.services]]` SELF -> `doodle-doggo-merch-test`, `RenderGate` | R-S12 |
| 9 | the kit took the first account | more than one account visible and no `CLOUDFLARE_ACCOUNT_ID`: refused before anything is made | F4-kit |
| 10 | `waitForSelector` without a timeout | `{ selector: '#o svg', timeout: 15000 }` (`SELECTOR_MS`). Otherwise the call is as RENDER_FREE 8 measured it (viewport, scale, `omitBackground`); Browser Run's timeouts page allows up to 60 s for `waitForSelector` | F4-selector; P4-shot and P4-via updated |
| 11 | resvg drew after a cancel during the browser call | `live()` is read before the fallback; a cancelled or refunded order gets no fallback render | F4-reread |
| - | the old-art line's 72 h refund on a browser-out day was untested | (test only) | F4-oldart72 |

**The least byte sizes**, from the measured files: the smallest real print of the 8 sample dogs in 3 poses, with and without a name, was 181 KB
(tee, resvg, dachs, no name) and 112 KB (mug, resvg, black lab, no name); Chromium's files are 2.5-4 times bigger (673-1,005 KB tee, 323-456 KB
mug) and Browser Run's about 0.78 of local Chromium's (RENDER_FREE 8). A blank print is 94.5 KB (tee, resvg) and 11 KB / 58 KB (mug, resvg /
Chromium). So 128 KiB for the tee (above the resvg blank, 0.7 of the smallest real tee) and 64 KiB for the mug (above both blanks, 0.58 of the
smallest real mug). Limit: a blank tee from local Chromium is 478 KB and passes the size; it fails nothing else either, which is why the size
is only one of the checks. A blank from Browser Run itself was never measured.

**Existing tests touched** (none weakened): P4-shot and P4-via (the measured call now has `timeout: 15000`); P4-size, P4-artver, P4-resvg-real
(`pngOk` is async: awaited, so the real check runs instead of a truthy promise); R-S12 (two more checks); `fakes.mjs` `png()` now makes a
structured PNG (8-bit RGBA, a first row that inflates clear, a padding chunk, IEND) and the fake browser's picture is 300 KB, so every older row
passes the stricter check for the right reason.
