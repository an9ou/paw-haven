# Merch part 9: the phone review

Branch `merch/shop` at 12d9fe4, 25 Nov 2026 (JST). Reviewer: paw-reviewer (read-only); this file is the reviewer’s report as handed back, written down by the MERCH session. The shop page, the order page in every state, the legal pages and the emails at 360x640, 390x844 and 1280x720. The screenshots it names were kept only for the session (not in git).

Fixes: see the end of this file (added when the fix batch is merged).

```
PHONE review, part 9, merch/shop at 12d9fe4. I checked out that commit detached, ran merch_build, then put the worktree back on its own branch. It is clean, and nothing was committed or deployed. I tested with my own Playwright scripts (touch, DPR 1) at 360x640, 390x844 and 1280x720. Screenshots are in /tmp/claude-0/-home-user-paw-haven/375b5391-25b0-5759-b21c-d2ed25c2699d/scratchpad/part9_phone/ and I looked at each one I cite.

BLOCKER
- None.

MAJOR
- M1. Make it, 360, on-screen keyboard (viewport shrunk to 330 px): the sticky price bar covers the name field.
  - Measured: input at 282-330, `.paybar` at 254-330. The letter count or error message (`#nameMsg`) is off screen below it.
  - Shot: C3_keyboard_name_360.png. Cause: merch.css:193 `.paybar{position:sticky;bottom:0}`.
  - Fix: hide or unstick the paybar while a text input in `.opts` has focus, or add `scroll-padding-bottom` set to the bar's height. Also move `#addMsg` above the bar: it now shows under it (C2_name_rejected_360.png).
- M2. Basket, US, one tee: the money lines can be misread.
  - Subtotal $32.99, total $37.98, and the page says "Orders of $35 or more ship free" twice, yet shipping is charged. The rule is on the subtotal, which only the legal page says.
  - Shot: A5_basket1_360.png. Cause: merch.js:251, merch.js:525.
  - Fix: "Free shipping when your things come to $35 or more (before shipping)", plus "Add $2.01 more for free shipping" when under.
- M3. Basket with 6 lines: "things" means two different counts on one screen.
  - "Things (11)" and the bag badge say 11, while "Your basket holds up to 6 things" and "Up to 6 things in one order" (`#bfull`). The buyer cannot tell why they are blocked.
  - Shot: B4_basket6_360.png. Cause: merch.js:509, merch.js:522, merch.js:271, merch.js:455.
  - Fix: call a line a "design" (or "different thing"): "up to 6 different designs, up to 3 of each".
- M4. Delivery time reads as if it adds up.
  - The text: "About 5 to 11 working days to your door. Printing usually takes 2 to 5 working days, and we post every order within 7 working days." A buyer adds them together.
  - catalog.js says eta is payment to door.
  - Shot: A5_basket1_360.png. Cause: merch.js:257.
  - Fix: "About 5 to 11 working days from payment to your door, printing included." Same wording on the legal "Door to door" column.
- M5. Order page, unpaid (`open`, and waiting for the bank): it contradicts the title.
  - The tracker says "Now: Order received. Your receipt is in your email." under "This order isn't paid yet."
  - Shot: D_open_360.png. Cause: merch.js:698, merch.js:746, merch.js:750.
  - Fix: hide the tracker for `open` (or show step 1 as "Waiting for payment", with no receipt line).
- M6. Order page, `held` for an address: the top and the box disagree.
  - Title "Thank you! Your order is in." and "A receipt is on its way to your email" sit above "Please check your address". This is the page the "We need your address" email links to, days later.
  - Related: `dispute` also says "A receipt is on its way"; `reship` says "Your order is on its way" while the parcel came back.
  - Shot: D_address_360.png. Cause: merch.js:706-711.
  - Fix: own titles: "We need your address", "A parcel came back to us"; drop the receipt line after the first hour.
- M7. Which dog, 360: tapping your own dog only selects it, but tapping a ready-made dog goes straight to the next step.
  - "Next: pick a thing" is about 3 screens down, past 6 dogs and 4 ready-made dogs. A first-time buyer taps Mochi and nothing seems to happen.
  - Shot: A2_pick_360.png, A2_pick_fold_360.png. Cause: merch.js:366 vs merch.js:339.
  - Fix: a tap on a dog card goes to "the thing" (as the ready-made cards do), or a sticky Next bar.
- M8. Shop footer and pay card have no link to 特定商取引法に基づく表記, though Japan is an open zone.
  - The four legal pages link it; the shop page does not. Japanese buyers need to reach it from the shop.
  - Shot: A1_home_360.png (footer). Cause: index.html:147, index.html:135.
  - Fix: add it to the footer (and label "Seller" as "Seller details", as the legal pages do).

MINOR
- m1. Reload on Make it loses every choice (colour, size, typed name) and drops to "Which dog?"; Back then goes to "The thing". Cause: merch.js:310-311 (the draft is not kept). Fix: keep the draft in sessionStorage, as the link dogs are.
- m2. Empty basket (reached from the bag): steps 1-3 show green ticks with nothing chosen, and the button says "Put another dog on something". Shot: G_basket_empty_360.png. Cause: merch.js:295, index.html:112. Fix: tick a step only when it was done; say "Put your dog on something" when empty.
- m3. Coming-soon country (UK, Brazil): basket lines show no prices at all, and the error repeats the Shipping box. At 360 the picker cuts "United Kingdom (co…", so "(coming soon)" is hidden. Shot: B2_ship_GB_360.png. Cause: merch.js:491, merch.js:856, merch.css:56. Fix: show line prices from the catalog without a quote; put "Soon:" before the name in the option.
- m4. Mug name counter says "16 / 20 letters" when 16 wide letters is the mug's limit, and a 20-letter game name arrives already rejected with Add disabled. Cause: merch.js:395. Fix: count against the product's max.
- m5. The sticky paybar has no `env(safe-area-inset-bottom)` while the page uses `viewport-fit=cover`, so on iPhones it can sit under the home bar. Cause: merch.css:193. Fix: `padding-bottom:calc(10px + env(safe-area-inset-bottom))`.
- m6. Size chips (3XL/4XL, 2XL) touch "Size guide" (0 px gap). Shot: A4_make_tee_360.png. Cause: merch.css:183-184 (`#sgBtn` inside `.sizes`' fieldset with no margin). Fix: margin-top of 8 px on `#sgBtn`.
- m7. Footer links touch each other at 360 and 390 (0 px gap between wrapped rows), and rows end with a dangling "·". The pay card line wraps "( " and "Shipping and returns )" onto separate lines. Shot: A5_basket1_360.png. Cause: index.html:135, index.html:147. Fix: `row-gap:6px` on the footer; drop the parentheses.
- m8. Address form: each error shows at the field and again in the `#addrErr` alert under the form (said twice). The inputs have no `autocapitalize`. Shot: D_addr_error_360.png. Cause: merch.js:795-798, merch.js:665. Fix: field errors only at the field; `autocapitalize="words"` on name and city.
- m9. Cancel dialog: the destructive "Yes, cancel it" is the yellow primary button, and the safe answer is quiet. Shot: D_cancel_dialog_360.png. Cause: index.html:161. Fix: make "Keep my order" the primary.
- m10. The home page shows the "No dog yet?" block even when the buyer's game dogs are loaded. Shot: A1_home_360.png. Cause: index.html:39. Fix: hide it when `st.src !== 'none'`.

Checked and fine: no sideways scroll on any screen (all sizes, all 7 tee colours and size lists, mug, 1/2/6 lines, every zone); main taps are 44 px or more; links in legal-page prose are inline and exempt. The share link (make → thing → pick on Back), the 6-dog link, a broken link, a hostile link and an unknown product all behave and log no console errors. The basket survives reload. All 10 order states render. Address inputs are 48 px with shipping autocomplete, and the empty submit focuses the field with its error beside it. The gift Copy works. The draft mark is in the first screen of all four legal pages. All 10 emails are 360 px wide with no small text and each has a `.txt` part. The slow first load shows "Getting your dogs ready…" and no half-drawn step.
```
