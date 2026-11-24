# Print PNGs with no paid plan (24 Nov 2026)

Follows SPIKE.md (resvg-wasm needs 0.4-1.9 s CPU, Workers Free allows 10 ms). Question: can we make, store and serve the print PNGs (tee 4500x5400 transparent, mug 2700x1050, sticker sheet 1749x2481) on the free plan? Sections 1-7 were written with nothing deployed; the one approved test deploy (section 7) ran on 24 Nov 2026 and was deleted again: results in section 8. Marks: [doc] read on the page named in section 5; [measured] on this container; [cloud] measured on the account in section 8; [not verified] still open.

## 1. Short answer

**Yes, on Cloudflare, free: let Cloudflare's own browser draw the print. Proven on the account [cloud].** Browser Run (the new name of Browser Rendering) is on the Free plan with 10 browser-minutes a day [doc]. A Free Worker only asks for the screenshot and pipes the PNG into a SQLite Durable Object (proven) or Workers KV (not provable with this session's token); waiting on the browser is not CPU time (max 3.7 ms CPU per invocation measured), and the Worker never loads PawPrint. The browser opens a static print page that loads PawPrint and draws the dog from the recipe in the URL hash, so the print is still drawn from the recipe alone (no uploads).

```
 Stripe paid --webhook--> pawhaven-api (Free): order + recipe in D1 (as TRANSACTIONS.md plans)
                               |  cron every 10 min, inside the 1-hour cooling window
                               v
 env.BROWSER.quickAction('screenshot', { url: 'https://doodledoggo.app/merch/print/<av>/#p=<recipe>&prod=tee&col=navy&pose=stand&n=1&av=<av>',
     viewport: { width: 2250, height: 2700, deviceScaleFactor: 2 }, screenshotOptions: { omitBackground: true },
     waitForSelector: '#o svg' })          <- Cloudflare's Chrome loads the static page; PawPrint draws the SVG there
                               |  PNG response body streamed, never decoded in the Worker
                               v
 store print/<order>/<item>.png (SQLite DO, or KV) --> GET /merch/file/<key>?exp=&sig= (HMAC) --> Printful fetches it
```

- **Capacity on Free [cloud]:** billed browser time is 1.27-1.46 s per tee, 0.37-0.51 s per mug, 0.50-0.76 s per sheet, so 10 browser-minutes make about **410 tees or 1,170 mugs a day: plan on about 270 orders a day** (1.5 tees per order, the worst case).
- **The owner turns nothing on:** Browser Run, Durable Objects (SQLite), KV and cron are all in the Free plan. No R2, no card.
- **Fallback 1 (Cloudflare, free) [cloud]:** option G works: a SQLite Durable Object on Free drew 10 banded tees and 2 mugs with resvg-wasm (1.1-1.7 s each, no `exceededCpu`).
- **Fallback 2 (also free):** a GitHub Actions job triggered by the Worker (`repository_dispatch`) renders with resvg-js (0.05-0.6 s per file) and uploads the PNGs back to the Worker. It uses about 1 to 2 of the 2,000 free Linux minutes per run.

## 2. The candidates

| | Works on Free? | Limits that matter | Daily capacity | Time per file | Owner must turn on | Risks |
|---|---|---|---|---|---|---|
| **A. Browser Run Quick Action from a Free Worker** (recommended) | **Yes** [doc]: Free plan, binding needs no token | 10 browser-min/day, Quick Actions 1 request per 10 s, 60 s browser timeout; Free Worker 10 ms CPU, 50 external / 1,000 Cloudflare subrequests per run; cron 15 min wall | 120-600 files (time), 8,640 (rate), 1,000 (KV writes) | 0.16-0.48 s locally; cloud billed time [not verified] | Nothing (approve the deploys) | Billed seconds per file unknown; daily cap returns 429 until the next UTC day; a big viewport [not verified] |
| A2. Browser Run REST from outside (GitHub, a laptop) | Yes, same pool | Needs an API token with "Browser Run - Edit"; this session's token lacks it (401, code 10000) | same | same | A scoped token | One more secret |
| A3. Browser Sessions (Puppeteer binding) | Yes, 3 browsers, 1 new every 20 s | The Worker would decode CDP base64 screenshots (MBs) in JS: CPU over 10 ms | - | - | - | Do not use on Free |
| **B. Printful takes the SVG/PDF itself** | Unknown | Help centre (16 Nov 2026): "PDFs are an accepted file format" but PNG/JPEG recommended, flatten transparency. A support article lists JPEG, PNG, SVG (SVG up to 20 MB) [search snippet only]. The API docs name no file type | No render at all | Printful's | Printful key to test | Printful's own RIP flattens our 0.35 crayon opacity on DTG (PRINT_FILES 3 warns about this); no `hardAlpha`; no pixel control. Test, do not plan on it |
| C. Buyer's browser renders and uploads | Upload yes; trust no | iOS 17 and older cap a canvas at 16.7 MP, the tee is 24.3 MP (a 150 dpi tee, 2250x2700 = 6.1 MP, fits). A Free Worker can only read the PNG header and length in 10 ms | Unlimited | phone | Nothing | Anyone can upload any picture; we are the Printful store, so its content policy (help 50263862632977) and any copyright claim land on us. Checking means rendering anyway (D). Preview only |
| **D. GitHub Actions, after payment** (fallback) | Yes: private repo, GitHub Free gives $12 of compute a month = 2,000 Linux minutes; with no card, use stops there (no bill) [doc] | Run start latency [not verified, usually under a minute]; a fine-grained token (this repo, Contents read/write) as a Worker secret; an upload secret on both sides | ~33-66 runs a day, each run renders every due order | 0.05-0.6 s CPU (resvg-js) + ~1 min setup | Two secrets | The repo's other Actions share the minutes; GitHub outages |
| D2. Supabase Edge Function (free) | Partly | 2 s CPU, 256 MB [doc]; resvg-wasm tee was 1.7-1.9 s CPU here | mug, sheet only | 0.4-1.9 s | A new account | Too tight for the tee; free projects pause when idle |
| E. Split resvg into many 10 ms requests | **No** | resvg-wasm start alone is ~60 ms per isolate and one tee band ~150 ms; a 10 ms split needs hundreds of chained calls that each restart wasm | - | - | - | Error 1102, below |
| G. resvg-wasm in a SQLite Durable Object | Maybe | The DO limits page says "CPU per request 30 seconds (default)" with no Free exception, while the DO FAQ says DOs "have the same per invocation CPU limits as any Workers do". Free DO time: 13,000 GB-s a day | thousands, if true | 0.4-1.9 s CPU | Nothing | Docs disagree: prove it (section 7, test 2) or forget it |

**E, what Free actually does over 10 ms:** Cloudflare returns Error 1102 "Worker exceeded resource limits" (outcome `exceededCpu`). The limits page adds: "Each isolate has some built-in flexibility to allow for cases where your Worker infrequently runs over the configured limit. If your Worker starts hitting the limit consistently, its execution will be terminated." Rare overruns survive; a renderer would hit it every time. Never rely on it.

**F, caching:** no help. Every dog differs (coat, seed, outfit, name); only the mug's yard strip is shared, and laying the dog over a cached strip is still a full-size raster pass. Even making the SVG in a Free Worker is risky: loading PawPrint costs 15 ms CPU and the first `svg()` call 13.9 ms (1.8-2.8 ms warm) [measured]. That is why the print page in the browser draws the SVG, not the Worker.

## 3. Measurements (this container, 4 vCPU, headless Chromium standing in for Browser Run)

Three dogs (red Shiba happy, harlequin Dane sit, Golden with sparkle, crown and bandana stand), each as tee 4500x5400 `bg:'none'`, mug 2700x1050 `bg:'strip'`, and a stand-in sticker sheet 1749x2481 (three bordered stickers, not yet the PRINT_FILES 4 layout). SVGs 14-21 KB (tee), 33-40 KB (mug), 54-94 KB (sheet). Scratch only; nothing in the repo.

| | tee 4500x5400 | mug 2700x1050 | sheet 1749x2481 |
|---|---|---|---|
| Chromium, warm: setContent + screenshot | 5-22 ms + 306-488 ms | 6-7 + 60-64 ms | 7-10 + 81-94 ms |
| Viewport 2250x2700 at deviceScaleFactor 2 | 346-361 ms, **byte-identical** to 4500x5400 at 1 | - | - |
| Print page by URL (loads 776 KB PawPrint, draws from `#p=`) | 456-493 ms | 148 ms | - |
| Cold: launch + render + close | 476-478 ms | 162 ms | 220 ms |
| Exact size / transparency | 4500x5400, corner alpha 0, 64-68% clear, 0.10-0.14% partly clear | opaque, as drawn | 1749x2481, 67-73% clear |
| Chromium against resvg-js (mean diff per channel, over white and black / pixels > 32 apart) | 0.025-0.031 / 0.008-0.016% | 0.107-0.114 / 0.016-0.024% | 0.074-0.105 / 0.028-0.050% |
| PNG size: Chromium / resvg-js | 1.1-1.2 MB / 0.52-0.61 MB | 250-268 KB / 151-161 KB | 463-562 KB / 269-334 KB |
| resvg-js native CPU (fallback D) | 520-585 ms | 54-58 ms | 157-170 ms |

- `omitBackground: true` gives a clean transparent tee; the mug's strip is opaque as designed.
- A bad link on the print page sets the title to `ERR base64` and draws nothing, so `waitForSelector` times out. Failed Quick Actions that time out are not charged [doc].
- resvg-js peaked at 567 MB RSS over the nine renders: fine on a GitHub runner, never in a Worker.
- Chromium is the better reference anyway: the game itself is drawn by browsers.

**Cloudflare account, read-only:** the token reads account settings and Worker scripts (6 Workers, all `standard`). It gets **401, code 10000 "Authentication error"** on `/browser-rendering/screenshot`, `/browser-run/screenshot`, `/browser-run/content`, the KV and R2 listings and `/subscriptions`. So the plan could not be read and no real Browser Run render was made (0 s of browser time used). The REST endpoint needs a token with "Browser Run - Edit" [doc]; a Worker binding needs none.

## 4. Storage and serving: Workers KV

- **KV, Free** [doc]: values up to 25 MiB (a tee is 1.2 MB), 1,000 writes a day to different keys, 100,000 reads a day, 1 GB stored, free daily limits reset 00:00 UTC. No KV is used today (`cloudflare/wrangler.toml` has D1 and 2 crons), so all 1,000 writes are ours.
- **Key** `print/<order>/<item>.png`, PNG streamed from the Browser Run response into `KV.put`.
- **Serve** it from a Worker route `GET /merch/file/<key>?exp=&sig=` (an HMAC over a short string: well under 1 ms) and give that URL to Printful; or add the file to Printful's file library and use its id.
- **Delete** it once Printful reports the file `ok` and the order ships. Keep the recipe and the print-page version (`/merch/print/v1/`) in D1, so a reprint redraws the same picture. KV then holds about a day of files (about 2 MB an order), far under 1 GB.
- **KV is eventually consistent:** another location may see a new key up to about 60 s later. Send the order to Printful at least 5 minutes after the write; the cooling window covers it.
- **R2: not on Free without a card.** The R2 get-started page says "You need a Cloudflare account with an R2 subscription", added by "Complete the checkout flow" [doc]; sister products' pages say a "linked payment card" is required. The 10 GB-month R2 free tier is real but sits behind that checkout.
- **D1 as a blob store:** possible (5 GB free) but a row is at most 2 MB, too close to the tee's 1.2 MB. Keep D1 for orders.

## 5. Cloudflare limits read (developers.cloudflare.com, 24 Nov 2026, each page's own Markdown)

- `/workers/platform/limits/`: Free 10 ms CPU per HTTP request and per Cron Trigger; 100,000 requests a day; 128 MB; 50 subrequests (1,000 to Cloudflare services); 5 cron triggers an account; cron wall 15 min; `waitUntil` 30 s after the response; "Waiting on network requests ... does not count toward CPU time"; Error 1102 text quoted above.
- `/browser-run/limits/` (changed 14 Oct 2026) and `/browser-run/pricing/` (20 Nov 2026): Free 10 browser-minutes a day, 3 concurrent sessions, 1 new browser per 20 s, Quick Actions 1 request per 10 s, 60 s timeout; 429 "Browser time limit exceeded for today" until the next UTC day; header `X-Browser-Ms-Used`. Paid: 10 browser-hours a month, then $0.09 an hour.
- `/browser-run/quick-actions/screenshot-endpoint/`: `omitBackground`, `viewport` with `deviceScaleFactor` (its own example is 3600x2400 at 2), `waitForSelector`, binding `env.BROWSER.quickAction('screenshot', …)`. The binding needs compatibility date 2026-03-24 or later (agents/tools/browser page).
- `/kv/platform/limits/`, `/kv/platform/pricing/`, `/r2/pricing/` (10 GB-month, 1 M Class A, 10 M Class B free), `/r2/get-started/`.
- `/queues/platform/limits/`: on Free, 10,000 operations a day and 24-hour retention; consumer CPU is still the plan's.
- `/workflows/reference/limits/`: Free 10 ms CPU per step, 3,000 steps a day.
- `/containers/platform/pricing/`: Containers are Workers Paid only ("Free: N/A").
- `/durable-objects/platform/limits/` and `/pricing/`: SQLite DOs on Free; 13,000 GB-s a day; the 30 s CPU line (option G).
- `/pages/platform/limits/`: build limits only; Pages Functions are Workers and get the same 10 ms.

Printful: help.printful.com public article search, "How should I prepare my print file" (updated 16 Nov 2026). Developer docs v1 and v2: no file type named; files are fetched by URL and processed asynchronously. GitHub: docs.github.com "GitHub Actions billing".

## 6. When we would need Workers Paid ($5 a month)

- More than about **100 to 200 print files a day** for several days (10 browser-minutes), or a daily cap hit at a sale. Paid includes 10 browser-hours a month (about 7,000 to 36,000 files), or SPIKE.md's resvg-wasm render Worker.
- More than 1,000 KV writes a day (1,000 files), or a need to keep print files for months (R2 also needs a card).
- More than about 20 orders per cron run reaching Printful (each order makes about 2 external calls; Free allows 50 per run). Run the cron more often before paying.
- Until then, a 429 from Browser Run only delays: the order waits, the next cron tries again, and the GitHub fallback can take the overflow.

## 7. Not verified (one test deploy proves it; the owner approves it)

Deploy one throwaway Worker `doodle-doggo-print-test` (Free plan; workers.dev only, no custom domain; a Browser Run binding, one new KV namespace `print-test`; static assets: the print page and `pawprint.min.js`; compatibility date 2026-11-01). It calls its own print page, so the site needs no deploy. Run the test, then delete the Worker and the namespace.

1. **Browser Run on this account:** for the 3 test dogs at tee (viewport 2250x2700 at 2), mug and sheet, call `quickAction('screenshot')`, 11 s apart, and stream each PNG into KV. Record: HTTP status, `X-Browser-Ms-Used` (this sets the daily capacity), wall time, the Worker's CPU time per invocation from Workers Logs (must stay under 10 ms), the PNG size, and that each is exactly 4500x5400 / 2700x1050 / 1749x2481 with alpha 0 in the corners. Then compare the PNGs with the local Chromium files (mean diff under 0.2). Also try a 4500x5400 viewport at scale 1 once, to learn the largest viewport. About 10 renders: well under 2 browser-minutes.
2. **Option G:** a SQLite Durable Object in the same Worker renders the mug and then the banded tee with resvg-wasm. Record `exceededCpu` or success and the CPU time. If it succeeds on Free, it is a second Cloudflare-only path with far more headroom.
3. **Serving:** `GET /merch/file/<key>?sig=` streams the KV PNG to `curl` from outside, checked byte for byte, with Worker CPU under 10 ms.
4. **Printful (needs the owner's Printful key, no order):** add one tee PNG URL and one SVG URL to the file library and read back `status`, size and dpi. That settles B: if the SVG comes back `ok`, ask for a mockup task to see how Printful flattens the crayon opacity.

Also unproven: the billed browser seconds per file, how long `repository_dispatch` takes to start, whether R2's checkout always asks for a card, and how Safari draws PawPrint (only Chromium is used here).

## 8. Test deploy results (24 Nov 2026)

One throwaway Worker `doodle-doggo-print-test` (workers.dev only, compatibility date 2026-11-01, a Browser Run binding, one SQLite Durable Object class, Workers observability on) served the print page and PawPrint itself and called `env.BROWSER.quickAction('screenshot', { url, viewport, screenshotOptions: { omitBackground: true }, waitForSelector: { selector: '#o svg' } })`. 10 renders 11 s apart, then 12 option G renders. Deleted the same day: Workers 6 before, 6 after; Durable Object namespaces 0 before, 0 after; KV never created. Scripts stayed in the session scratchpad, not the repo.

| render (3 dogs each) | HTTP | `X-Browser-Ms-Used` | Worker wait / client total | PNG | size, corners | vs local Chromium |
|---|---|---|---|---|---|---|
| tee, viewport 2250x2700 at 2 | 200 x3 | 1,272-1,455 ms | 1.7-2.4 s / 2.3-3.1 s | 646-713 KB | 4500x5400, alpha 0 | **0 (every pixel equal)** |
| tee, viewport 4500x5400 at 1 (once) | 200 | 1,273 ms | 1.7 / 2.3 s | 713 KB | 4500x5400, alpha 0 | 0; byte-identical to the scale-2 file |
| mug 2700x1050 | 200 x3 | 373-508 ms | 0.7-0.8 / 1.3-1.4 s | 185-203 KB | exact, opaque strip | 0 |
| sticker sheet 1749x2481 | 200 x3 | 505-763 ms | 0.8-1.1 / 1.3-1.7 s | 333-420 KB | exact, alpha 0 | 0 |
| **option G** in the Durable Object, resvg-wasm | 200 x12 | none | tee (12 bands) 1.15-1.70 s, mug 0.44-0.83 s round trip | tee 471-513 KB, mug 165 KB | exact, alpha 0 | 0.025-0.031 (vs resvg-js 0.0008-0.0011) |

- **Browser time used in all:** 8.5 s of the 120 s approved. No 429 at any point. Cloudflare's PNGs are 40% smaller than local Chromium's but decode to the same pixels.
- **Worker CPU** (GraphQL `workersInvocationsAdaptive`, all 71 invocations, including the browser's own loads of the page and PawPrint): P50 0.83 ms, **max 3.7 ms**, 0 errors, no `exceededCpu`, one `clientDisconnected` (0.5 ms). The Workers Logs query API answered **403 "Forbidden"** to this token, so there is no per-route split.
- **Storing and serving:** the KV namespace could not be made: `POST /storage/kv/namespaces` and the KV listing both answer **401, code 10000 "Authentication error"**. Instead the Worker split the Browser Run body (`body.tee()`, never decoded) into the response and a SQLite Durable Object. All 10 stored PNGs came back through `GET /merch/file/<key>?sig=` **byte for byte**, in 0.25-0.48 s; a wrong `sig` got 403.
- **Option G:** the Durable Object ran 10 banded tees and 2 mugs in a row with no `exceededCpu`. The same code takes 0.84-1.4 s CPU locally, so the DO clearly gets far more than 10 ms on Free, which matches the limits page (30 s per request). Its exact CPU could not be read: the Durable Object GraphQL datasets returned no rows and Workers Logs is forbidden to this token.

**Now proven [cloud]:** Browser Run works on this Free account with no token (the binding), at the full tee size in one viewport (4500x5400 at scale 1 works too), transparent, pixel-identical to Chromium on this container; the Worker stays far under 10 ms; a PNG streams into SQLite Durable Object storage and out again unchanged; option G renders on Free.
**Not proven:** KV (the token cannot create it: make the namespace in the dashboard or with a token that has Workers KV Storage: Edit, or simply use the Durable Object, which needs nothing extra); the DO's exact CPU; viewports above 4500x5400; Printful (item 4, needs the owner's key); the 10-minute daily cap itself (never reached).

**Daily capacity on Free from the billed time:** 600 s / 1.46 s (slowest tee) = **about 410 tees a day**; mugs 600 / 0.51 = about 1,170; sheets about 790. At 1.5 files an order, all tees, that is **about 270 orders a day** (the old estimate was 80). Quick Actions at 1 per 10 s (8,640 a day) and Durable Object Free limits (100,000 requests a day, 5 GB) are far above it. Option G has its own budget on top (13,000 GB-s a day of DO time = about 100,000 s at 128 MB, tens of thousands of tees).

**Decision: the Browser Run pipeline**, storing the PNGs in a SQLite Durable Object of `pawhaven-api` (KV only if the owner makes a namespace), with option G (resvg-wasm in that DO) as the first fallback when Browser Run returns 429, and GitHub Actions only as the last resort. Workers Paid is not needed at launch.
