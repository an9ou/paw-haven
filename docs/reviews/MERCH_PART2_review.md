# Merch part 2: combined review of the /merch page in test mode (merch/shop @ 0d97708, read-only)

Scope: `site/merch/**`, `merch/test_page.js`, the `tools/merch_build.js` change. Suite `merch_page`: 276 passed, 0 failed (23 s).
Written up by the MERCH session from the reviewer's report (24 Nov 2026).

## Verdict

The money maths and the test-mode safety are sound. Two things must be fixed before the real Worker is wired in: a stored basket can
break or attack the page, and the page needs catalog fields the contract does not list.

## Must-fix

- **M1 A stored basket is trusted.** `site/merch/merch.js:76, 94, 315-317`. `loadBasket` only checks the recipe and the product.
  - A stored line with an old pose or colour makes `P.print` throw: the basket shows no lines, no total and no Remove, while the bag
    says 2, until storage is cleared. Any later catalog change can break real baskets.
  - `l.id` and `l.qty` go into `innerHTML` unescaped: a stored basket fired `alert()` (localStorage is shared with `/play/`).
  - Fix: check every field against the catalog and PawPrint, drop or repair bad lines, force qty to a whole number from 1 to 3, make
    new ids, escape everything.
- **M2 The api seam.** `merch.js:113, 340, 417`, `catalog.json`. The page needs `countries[].name`, `.soon` and `zones[].notes`;
  TRANSACTIONS.md 6.3 listed only `countries[{code, zone}]`, open countries only. With the real Worker the "Ship to" list would read
  "undefined". Settled in TRANSACTIONS.md 6.3 (note of 24 Nov): see there.

## Should-fix

- **S1** `merch.js:188, 313`. A player's dog whose game name cannot print (an emoji, non-Latin letters, a refused word) shows "No name"
  on the dog card and "A ready-made Labrador Retriever" in the basket.
- **S2** `merch.js:342, 368-372`. `art_changed` (needs a reload message), `sold_out_today`, `variant_off`, `slow_down`, `busy`,
  `cant_make`, `bad_qty`, `too_many` all fall to a generic text; the `line` number in `bad_line` is not used to point at the line.
- **S3** `merch.js:360-361`. A new nonce on every tap: a retry after a lost answer could make a second order. One nonce per basket and quote.
- **S4** `merch.js:393, 403`. The order page decodes the line's `recipe`; the server clears recipes after 24 months and the page then
  throws. Use `l.name`, guard a missing recipe.
- **S5** `merch.js:398`. "We'll start printing at hh:mm... you can cancel here" still shows after the hour, with no button; "Today."
  under Order received never changes.
- **S6** `merch.js:284-288`. Two tabs: tab A removes a line while tab B changes it; B says "Changed" and the thing is lost. Add it as a
  new line when the old one is gone.
- **S7** `index.html:145`, `route()`. The footer "Questions" link from any step lands at the top of the landing page, far above the
  questions. Back after Add leaves `#/make` in the address while step 2 shows. Deep links keep the wrong hash.
- **S8** Contrast: `--muted #8A7468` is 4.26:1 on paper and 3.88:1 on the preview tint, used for the money and legal lines. Use ink there.
- **S9** Copy that promises more than is built: the "choose your own currency" line (Adaptive Pricing is not verified for a Hong Kong
  account), "The game will get a button", and a dead "Terms of sale" span with a tooltip about a later part.
- **S10** Tests: the 8-basket price check compares the page with the same fake code; only 2 totals are worked out by hand; nothing
  tests a stale or hostile stored basket, the error codes, back/forward, two tabs, the preview after Change, or `pawhaven_cloud_v1`.
  (The reviewer's own check matched SHIPPING.md model C on 2376 baskets in 11 countries: $34.99 pays shipping, $35.00 ships free.)

## Nice

- At 360x640, arriving on "Make it yours" shows only the header, the bars and half the preview.
- The bag button's label "Basket" hides the count from screen readers.
- The order page still shows a "Ship to" picker that does nothing.
- "print file" jargon in the questions and the preview tab.
- With a live `MERCH_API`, the `?demo=1` button throws (no `demoPay`).
- Puerto Rico and Guam are priced as "everywhere else"; the US Virgin Islands and American Samoa are missing.
- A British browser lands on "Coming soon to the United Kingdom"; the 38 "(coming soon)" countries are the owner's call at launch.
- "18 or over" and "a grown-up pays" give a mixed message.

## Clean (checked)

No request leaves the origin and Pay never navigates. The game save and `pawhaven_cloud_v1` are never written; the page works with
storage blocked. Saves with 0 and 30 dogs work; a 5,000-dog save loads in 0.9 s. No stickers anywhere. The preview equals
`PawPrint.print()`. At 360, 390 and 1280: no sideways scroll, no tap under 44 px, no text under 14 px. Mock-up fills stay inside their
outlines. No sales-pressure words. The `tools/merch_build.js` change is correct.
