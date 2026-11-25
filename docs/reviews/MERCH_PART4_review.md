# Merch part 4 review: the real print render (25 Nov 2026)

One combined review (code and art), read-only, on `merch/shop` at 3060833 (the part is 95a9b47..d0956c3). At review time: `merch_worker` 212 of
212, `render_chromium.mjs` ALL OK, `tools/merch_rtest.mjs` clean in its dry run (every request scoped to `doodle-doggo-merch-rtest`, nothing
sent). Written by the MERCH session from the reviewer's report. The reviewer made no cloud call.

**Verdict:** no blockers. The ledger's rules hold and the fallback draws the same picture. Five should-fix items: two in the print-file checks,
two in the cloud kit and the budget, one guard for future art. **The kit is safe to put in front of the owner once finding 3 is fixed.**

## Findings

| # | Severity | Where | What happens | Fix |
|---|---|---|---|---|
| 1 | should fix | `ledger.js` `pngOk` (1155) | It checks only size and bytes; "tee corners clear" is not checked in production. If Browser Run ever dropped `omitBackground` or answered RGB, an opaque 4500x5400 rectangle would go to the printer; a blank page of the right size passes too. | Tee: IHDR colour type 6 and alpha 0 in the first row (only the first scanline is inflated), plus a least byte size (a blank tee is about 25 KB, real ones 290-980 KB). |
| 2 | should fix | `test/render_chromium.mjs:73`, `tools/merch_rtest.mjs` `compare()` | The mean-difference limit (0.2) cannot see a missing body part: a dropped shape of 34,446 pixels scores 0.154 on a tee. The mug mean reaches 0.173 on one dog, close enough to fail a good mug. | Add a limit on pixels more than 32 apart (tee 5,000, mug 3,000; real worst cases 1,665 and 1,236). |
| 3 | should fix (kit) | `tools/merch_rtest.mjs:163` | `made` is set only after the first upload answers: a timeout after Cloudflare made the Worker means no DELETE. A failing DELETE throws inside `finally` (the counts, the report and the clean-up are skipped). No SIGINT/SIGTERM handler. No hand clean-up line in the run book. | `made = true` before the upload; a 404 on delete is done; catch a delete failure and print the hand clean-up line; signal handlers; the line in PART4.md. |
| 4 | should fix | `render.js`, `ledger.js` `browserBook` | Browser errors are invisible: if the object may not call the binding (`direct`, unverified), every line silently costs two browser calls and a minute before resvg draws it. Milliseconds are booked only from `X-Browser-Ms-Used`: our own timeout, a crash before booking and errors without the header book 0, so the kit's 60 s cap is really 10 calls x Browser Run's own limit. | Book the wall time when the header is missing or on a timeout; N errors in a row put the browser off (`browser_off`, why `errors`, the owner told); the kit stops browser jobs after 2 failures. |
| 5 | should fix (future art) | `resvg.js:109` `flatOpacity` | Opacity stays on a shape with both a fill and a stroke, and a nested `<svg>` that clips is kept as a layer; both make resvg 2.6.2 crash or draw in the wrong place when they cross a band edge, and a wrong place passes `pngOk`. Today's art has none (202 prints scanned). | `splitBands` throws when a kept opacity or clip layer crosses a band edge: a future art change fails safe (the line waits for the browser). |
| 6 | nit | `ledger.js:1548` tidy | The self-test's meta row is deleted in its own transaction before the trash insert: a crash between leaves the file stored for good. | One transaction. |
| 7 | nit | `renderReady`, the report | `env.RENDER` (the fallback object) is not checked or listed; a browser `not_set_up` answer never tries resvg. | List RENDER in the report; try resvg on `not_set_up`. |
| 8 | nit | `t_review.mjs` R-S12 | Nothing checks `[env.test.browser]` or that the test Worker's `SELF` names `doodle-doggo-merch-test` (a test SELF pointing at the live Worker would pass). | Add both checks. |
| 9 | nit (kit) | account choice | Without `CLOUDFLARE_ACCOUNT_ID` it takes the first account. | Refuse when more than one account is visible. |
| 10 | nit | `render.js` `waitForSelector` | No timeout: a page that shows ERR bills up to Browser Run's default, twice a line. | `timeout: 15000`. |
| 11 | nit | `renderLine` | After a cancel during the browser call, resvg still draws before the re-read (nothing is stored: wasted work only). | Re-read before the fallback. |

## Checked and fine

- **The ledger's rules.** Claim and lease first; the render fits the lease (75 s + 60 s under 180 s); `live()` is re-read after the render and
  after the store. S1: nothing stored and no "couldn't print" after a cancel, refund or dispute. S11: the PNG is kept, no re-render. The 11 s
  spacing holds across both call paths and between the self-test and orders. The self-test needs the admin key; its files are tidied nightly.
- **429 and budget.** No state gets stuck; owner emails are one a JST day a reason; no double counting.
- **The fallback draws the same picture.** Fallback (banded) against local Chromium on the real print page, 83 tees and 101 mugs: tee mean at
  most 0.023 and at most 1,665 pixels more than 32 apart; mug mean at most 0.173 and 1,236 pixels. Colour tees have no half-clear pixels in
  either renderer. Banded against one pass: at most 141 pixels. The worst crops at 100% are 1-pixel edge differences only; no seams; fills
  inside their outlines.
- **Art version.** Refused in `render.js` and in the object, tested. An old-art line on a day the browser is out waits, is held, the owner is
  told at 2 h and it is refunded at 72 h (that last step is not tested for this case).
- **The mug file.** Clear top corners and an opaque name strip match PRINT_FILES.md (clear = the white mug).
- **RenderGate.** A named entrypoint, not reachable from the internet; only this Worker's own print pages. The front Worker decodes nothing.
- **The vendored wasm.** Byte-identical to npm `@resvg/resvg-wasm` 2.6.2; the MPL notice is adequate; the bundle size claim is plausible.
- **Kit basics.** Dry by default; both switches needed; keys random, in memory, never logged; no route, domain, cron, KV or D1 touched; the shop
  shut twice over.

## Could not check; to add to the cloud test list

Anything in the cloud. Whether workerd compiles the wasm module when the script loads (front Worker start-up time and CPU). The real daily-429
text (the probe only provokes the rate limit). The PNG colour type Browser Run returns. Whether `X-Browser-Ms-Used` comes with timeouts. The
tee comparison stopped at 83 of 101 dogs (time).

## Fixes

Findings 1 to 11 go to one fix batch (see `docs/design/merch/PART4.md` "Review fixes" when it is done).
