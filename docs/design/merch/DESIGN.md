# "My dog" merch page: design prototype

A clickable prototype of `doodledoggo.app/merch` for the owner to look at before anything is built. Static files only, fake data, no payment code, no network calls. Nothing in the repo was changed.

**Open it:** serve this folder (for example `python3 -m http.server` or `ruby -run -e httpd . -p 8765`) and open `index.html`.
- `index.html?clean=1` hides the prototype controls.
- `?src=link` and `?src=none` show the other "where the dogs came from" states.
- `?cur=gbp` starts in pounds.
- `index.html?from=share&dog=biscuit` is the "Put this on a mug" entry from the share sheet.
- `entry.html` shows the in-game entry points.

## Files

| File | What it is |
|---|---|
| `index.html`, `css/merch.css`, `js/merch.js`, `js/art.js` | The page. Every step is in one page, routed by `#/pick`, `#/product`, `#/make`, `#/pay`, `#/done`. |
| `css/site.css`, `js/site.js` | The site's own `style.css` and `site.js`, copied with their paths made relative. These give the header, peeking dogs and falling momiji. |
| `entry.html` | Mock frames of the in-game entry points. |
| `assets/` | Assets copied or rendered for the prototype: the site's fonts (Caveat and Patrick Hand, with their OFL licences), the logo, the peek heads and momiji. It also holds `dogs/*.svg` and `img/yard.webp`. |
| `step1_390.png` … `step6_1280.png` | Every step at 390x844 and 1280x720, full page, deviceScaleFactor 2. |
| Extra screenshots | `step2_link_*` (the itch.io link state), `step2_none_*` (no dogs found), `step4_sheet_*` (the sticker sheet) and `step4_hoodie_*` (a dark colour, the yard background, a puppy). |
| `entry_points.png`, `merch_design_sheet.png` | The entry-point frames, and the phone flow side by side (2400 px wide). |

**Where the dogs come from:** `assets/dogs/*.svg` was rendered from the game's own `PawArt.dog` / `PawArt.dogHead` and cropped to the drawing. `assets/img/yard.webp` is `PawArt.scene('yard')`. The scripts that made them are in `../design_tools/`.

## Checks done

- Every view was checked at 360x640, 390x844 and 1280x720. Nothing is wider than the screen, nothing is clipped, and every tap target is at least 44 px. A script checks both of these on every screenshot run.
- I looked at every screenshot. I fixed these problems:
  - dogs that were too small on the products (the drawings are now cropped to the dog)
  - a tee shaped like a dress (now about 20 x 28 in proportions)
  - uneven ready-made cards
  - the favourite badge covering an ear
  - ready-made dogs that dwarfed the player's own dogs on desktop
  - the sticky price bar covering "Pose" in the screenshots (the screenshots are now taken at the full page height)
  - "Your Biscuit" in the thank-you text
- No console errors.

## The main decisions, and why

1. **One page with a 4-step stepper** (Your dog · The thing · Make it · Check), plus the landing and the thank-you page.
   - Phones show the stepper as four equal numbered tiles. Steps already done are mint with a tick and can be tapped to go back.
   - Hash routing keeps the Back button working.
2. **The header gains a sixth tab, "Merch"**, before About Us.
   - It is peach, with a crayon mug doodle.
   - On phones the six tabs share one row (about 48 px each at 360). "About Us" wraps to two lines, as it does today in some languages.
3. **Delivered prices: delivery to the USA and the UK is included in the price.**
   - The numbers are PROVIDERS.md section 4's suggestions (Printful, about 30% margin).
   - Kind, no surprise at the end: the price on the tile is the price you pay. This matches the Kind shop's tone (V224.md 3).
   - "Somewhere else" adds a delivery charge, which is a placeholder.
4. **Prices are shown in USD or GBP**, guessed from the browser language. `en-GB` (and IE, IM, JE, GG) gets £. A visible switch sits on every step.
   - Choosing UK or USA as the destination moves the currency with it, unless the buyer has set the currency by hand.
5. **The player's own dog is printed as it looks today**: coat, puppy size, outfit.
   - The page never offers to change the outfit; it says "change it in the game first". This keeps the game the source of truth, and keeps the page from being a dress-up shop.
   - Poses are limited to three that print well: stand, sit, happy.
6. **An honest preview.**
   - The design sits in the product's real print area, at its real proportions.
   - "The print file" tab shows the flat file with its print size in inches (for the mug: the wrap, with the same dog on both sides).
   - The line under the preview: "What you see is what is printed: same lines, same place, same size. Printed colours look a little softer than a bright screen."
7. **Dark product colours give the dog a paper patch**, a cream wobbly card behind it, so the brown crayon lines still show. The preview shows the patch, and a note explains it.
8. **The dog's name is on by default for the player's own dog and off for ready-made dogs.**
   - The name can be at most 20 letters and is printed in Caveat. It is shrunk to fit and never wraps.
   - The sticker sheet's label sticker says "good dog!" when the name is off.
9. **The sticker sheet is a single fixed layout**: three poses, two heads, a name label, a heart, a paw and a bone. Nine kiss-cut stickers on an A5 sheet (5.8 x 8.3 in, Printful 505). Cut lines are shown dashed.
10. **No dogs? The page is never empty.**
    - The landing has "No dog yet?" with "Play first" and four ready-made famous breeds: Labrador, French Bulldog, Golden Retriever and Dachshund, among the most popular in the US and the UK.
    - The no-dogs state of step 1 explains the three taps in the game, then offers the ready-made dogs.
11. **How the dogs arrive.** The itch.io game runs on itch's own domain, so it cannot share browser storage with doodledoggo.app. That gives two ways in:
    - **Same browser** (the game on doodledoggo.app/play/, the same origin): the page reads the dogs straight from the save.
    - **A link from the game** (itch.io, or any copy): the game opens `doodledoggo.app/merch#dogs=<compact looks>`.
      - The data is in the **#fragment**, so it never reaches a server or its logs.
      - It carries only how each dog looks (name, breed, coat genes, age, outfit, favourite), and it is kept only for that tab.
12. **Money screens follow the Kind shop's tone**: no countdowns, no "only 3 left", no upsells, no pre-ticked extras, no fake sales.
    - The pay button says exactly what happens: "Pay safely with Stripe".
    - A hand-off sheet explains it, without imitating Stripe's page or logo.
    - The grown-up note follows V224.md 6.
13. **The promise and the returns rule are said plainly, next to the price**:
    - "Printed just for you. If it arrives damaged or wrong, we reprint it or refund you."
    - "Because it is made just for you, we can't take it back if you change your mind."
    - This is the flow PROVIDERS.md describes: provider claims within 30 days, no returns for remorse.
14. **The thank-you page doubles as the order page**, with four stages: Order received → Being printed → On its way (tracking link) → Arrived. "See it 4 days later" shows the later state.
15. **Words.** Never "buy a dog" or "sell". The page uses "Your dog, on real things", "Put your dog on…", "Use my dog", "Put this on a mug" and "Put another dog on something". The page and the product tiles never use the word "buy". "Before you buy" appears once, in the grown-up note.

## The copy, screen by screen

**Header / shop bar:** Home · Dogs · Map · Guide · **Merch** · About Us · 🌐 English. "Merch · step N of 4". "Prices in [$ USD] [£ GBP]".

**1. Landing**
- **H1:** "Your dog, on real things"
- **Subtitle:** "Put the crayon dog you raised on a mug, a tee or a sticker sheet."
- **Three tiles:** "A mug" from $21.99, "A tee" from $27.99, "Stickers" from $15.99.
- **Button:** "🐾 Use my dog". Under it: "Printed just for you, near you, in the USA or the UK."
- **How it works:**
  - "1. Pick your dog: The one you raised in the game, just as it looks today: its coat, its outfit, its silly face."
  - "2. Pick a thing: A mug, a tee, a sweatshirt, a hoodie, a tote bag or a sheet of stickers."
  - "3. We print it: A print shop near you makes it just for you and posts it to your door."
- **"No dog yet?":** "Adopt one first: the game is free and your dog is waiting at the shelter. Play first →" / "Or start from a famous face. These four are ready to print:" (Labrador Retriever, French Bulldog, Golden Retriever, Dachshund: "ready-made").
- **Questions:**
  - *How do I bring my dog from the game?* "Open Doodle Doggo, tap More, then Put my dog on merch. This page opens with your dogs on it. Playing on doodledoggo.app? Your dogs are already here when you open Merch in the same browser."
  - *Where is it made, and how long does it take?* "Each order is printed just for you by our print partner: in the USA for US orders and in the UK for UK orders (anywhere else: the nearest one). Printing takes 2 to 5 working days, then about 3 to 4 days in the post in the USA and about 2 in the UK. You get a tracking link by email."
  - *Can I send it back?* "Because it is printed just for you, with your own dog on it, we can't take it back if you change your mind. But if it arrives damaged, misprinted or wrong, tell us within 30 days with a photo and we reprint it or refund you, whichever you like."
  - *Which size should I get?* "The tees, sweatshirts and hoodies are unisex adult sizes. Lay a top you like flat, measure from armpit to armpit and compare with the size guide. Between two sizes? Pick the bigger one."
  - *Is my dog's picture private?* "Your dog's picture is drawn in your browser and sent only to the print shop, to print your order. We never show it anywhere, and we delete the print file 90 days after it arrives. Your dog's name is printed only if you turn it on."
  - *Why does my dog look like that?* "It's meant to. The wobbly crayon lines are the joke, and the printer keeps every one of them."
  - *Does it change anything in my game?* "No. Your dog and your game stay exactly as they are. Nothing you buy here makes a dog happier or faster: they already love you."

**2. Which dog?**
- **Same browser:** "Here are your dogs from the game in this browser. Each one is printed just as it looks today. Want a different outfit? Change it in the game first."
- **From a link:** "5 dogs came with your link from the game. Only how they look came along (name, breed, coat, outfit), and only for this tab."
- **Cards:** head, name, breed; tags "♥ favourite", "Puppy, 4 months", "wearing Party Hat, Red Bandana".
- **Below the cards:** "Or a ready-made dog". Buttons: "← Back" and "Next: pick a thing →".
- **No dogs:** "We can't see any of your dogs from here yet." / "Your dogs live in the game, so let's bring one over: 1. Open Doodle Doggo. 2. Tap More. 3. Tap Put my dog on merch." / "This page opens again with your dogs on it. Open the game →" / "Or pick a ready-made dog". The Next button stays disabled.

**3. Put Biscuit on…**
- **Tiles:**
  - Mug: from $21.99, "11 oz ceramic, dishwasher safe"
  - T-shirt: $27.99, "Soft cotton, unisex fit"
  - Sweatshirt: $45.99, "Cosy crew neck, unisex"
  - Hoodie: $51.99, "Soft fleece inside, unisex"
  - Tote bag: $24.99, "Strong cotton, carries lots"
  - Sticker sheet: $15.99, "9 stickers, kiss-cut, one sheet"
- **Made near you:** "📍 Made near you, in the USA. Delivery included." (UK: "…in the UK."; elsewhere: "Made at the print shop nearest you: USA, UK or EU.")
- **Under the tiles:** "Prices include printing and delivery to the USA and the UK."

**4. Make it yours**
- **Preview tabs:** "On the tee" / "The print file". The honest line is in decision 6.
- **The print file:**
  - Tee and sweatshirt: "Printed 10.8 × 12.6 in on the front."
  - Hoodie: "Printed 10 × 11.7 in, above the pocket."
  - Mug: "9 × 3.5 in wrap: the same dog on both sides, for left and right hands."
  - Tote: "Printed 11 × 11 in on one side."
  - Every product adds: "Drawn again at full size from the game's own art, so every line stays sharp."
- **Pose:** Stand / Sit / Happy.
- **Background:** Just the dog / A little yard.
- **Name:** [Show the name] switch, the name field, "7 / 20 letters".
- **Colour:** "Colour: White". The swatches are White, Natural, Heather grey, Soft pink, Light blue, Navy, Sand and Black. On a dark colour: "On dark colours your dog gets a little paper patch, so its crayon lines still show."
- **Size:** XS–3XL (2XL and 3XL +$2.00), "Size guide". The size guide table is in placeholder numbers.
- **How many:** − 1 +
- **Price bar:** "$27.99 · delivery included", "Next: check →".
- **Sticker sheet:** "The whole pack on one sheet: three poses, two heads, a name sticker and three little doodles. Cut lines are shown dashed."

**5. Check it over**
- **Recap card:** T-shirt / Biscuit, Corgi / Stand · just the dog / Name: "Biscuit" / White · M / How many: 1 / Change.
- **Our promise:** "Printed just for you. If it arrives damaged or wrong, we reprint it or refund you." / "Because it is made just for you, we can't take it back if you change your mind."
- **"Where is it going?":** 🇺🇸 USA · 🇬🇧 UK · 🌍 Somewhere else.
- **Delivery estimate:**
  - USA: "About 5–9 working days. 2–5 days to print in the USA, then 3–4 days in the post."
  - UK: "About 4–7 working days. 2–5 days to print in the UK, then about 2 days in the post."
  - Elsewhere: "About 7–25 working days. Printed at the nearest print shop (USA, UK or EU), then the post."
- **Lines:** item, "Delivery to the USA: included", Total.
  - USA: "Delivery included: nothing is added at the end."
  - UK: "Includes VAT and delivery: nothing is added at the end."
  - Elsewhere: "Your country may charge import tax or a customs fee when it arrives."
- **Grown-up note:** "🙋 Ask a grown-up before you buy. A grown-up pays on Stripe's secure page; we never see card details."
- **Pay:** "🔒 Pay safely with Stripe" / "Stripe asks for your email and address, so the print shop can post it and send you the tracking link." / "← Change something".
- **Hand-off sheet:** "Off to Stripe's secure page" / "You'll pay on Stripe's own checkout page, in this tab. When you're done it brings you back here." Buttons: (prototype) "Pretend it went through" / "Back".

**6. Thank you**
- **Heading:** "Thank you! Your order is in." / "Order DD-7Q2K" / "A receipt is on its way to your email. Off to the print shop: Biscuit."
- **"Where is it now?":**
  - Order received: "Today. Your receipt is in your email."
  - Being printed: "At the print shop near you, in 2 to 5 working days."
  - On its way: "You get an email with a tracking link." (later: "Posted Friday. Track it →")
  - Arrived: "Say hello to your dog, in real life."
- **Order page note:** "This page is your order page: bookmark it, or use the link in your email."
- **Gift:** "A little gift for your dog" / "A thank-you in the game: the Printer's Bandana, crayon smudges and all." / code `MERCH-7Q2K` / "In the game: ⋯ menu, Have a code? (cloud accounts). It's only a bandana: your dog loves you the same either way."
- **Help:** "Something wrong when it arrives? Reply to the order email with a photo and we'll make it right." / "Put another dog on something".

**Footer:** Terms of sale · Shipping and returns · Privacy · Questions · CONTACT US / "Printed by our print partner … Payments by Stripe. No ads, no tracking."

**In-game entry points (`entry.html`)**
1. **A "Merch" tile, the 12th in the phone More tray** (after Kind shop), with "new!" tape. Desktop: the same entry in the top bar's More menu.
2. **The confirm sheet:** "Put my dog on merch" / "Opens doodledoggo.app in a new tab, with how your 5 dogs look: names, breeds, coats and outfits. Nothing else from your game goes with them." / "It's a shop, so ask a grown-up first." Buttons: [Open the merch page] [Not now].
3. **"☕ Put this on a mug" under the Share my dog picture.** It opens step 3 with that dog, pose and outfit, and the mug chosen.

## Placeholders (marked on the page with a dashed yellow tag)

- **Prices.** They are PROVIDERS.md suggestions, not final.
  - The hoodie ($51.99 / £42.99) is my estimate from its base price at the same margin.
  - The UK tote is £28.99 because the UK tote is a different, dearer bag.
  - The 2XL/3XL +$2 is a guess.
  - The "somewhere else" delivery ($3.99–$9.99) is a guess.
- **Delivery times** are Printful's published figures (some read only as search snippets).
- **Other placeholders:** the size guide numbers, the order number, the gift code and the Printer's Bandana itself (an idea), the 90-day file deletion period, the provider name ("Printful suggested, not chosen"), and the Terms, Shipping, Privacy and Play links.
- **Product mockups** are my own SVG line drawings. The spike's `mock_*.png` files (mug, tee, tote, sticker sheet) appeared only as I finished; spike/SPIKE.md did not exist yet. They agree with this design on three points: the game's own dog art, the name in Caveat under the dog, and a mug wrap of 2700 x 1050 px (9 x 3.5 in at 300 dpi). The one real difference is the tee: the spike prints the dog larger, about 45% of the tee's width. Here it is about 35%. Set `P.tee.pa` in `js/art.js` to the print size SPIKE.md settles on.
- **The dog art** is real game art. The print file at 300 dpi still needs the spike to confirm.

## Open questions for the owner (my recommendation first)

1. **Is delivery included in the price, or added at checkout?**
   - **Recommend included** for the USA and UK. It is kinder: one honest number, no surprise.
   - "Somewhere else" pays a small extra.
2. **Which countries can order at launch?**
   - **Recommend USA first**, then the UK once UK VAT registration is settled (PROVIDERS.md's "tax trap").
   - Until then, the UK button would say "Coming soon to the UK" rather than disappear.
3. **Currency.** **Recommend USD and GBP**, guessed from the browser and switchable, as drawn. USD-only is simpler, but UK buyers would see dollars.
4. **Which products at launch?**
   - **Recommend mug, tee, sticker sheet and tote.**
   - Add the sweatshirt and hoodie in the second wave: they cost the most, and their sizes cause the most mix-ups.
5. **Should the dog's name be printed by default?**
   - **Recommend on for your own dog, off for ready-made dogs**, as drawn. The name is the player's own text, so it stays limited to 20 letters in Latin script.
   - The name check needs a kind filter (no rude words; see PROVIDERS.md on in-game text).
6. **What should the dark-colour patch look like?** **Recommend the paper patch** as drawn. The other option is an off-white crayon outline around the dog, which looks less like the game.
7. **How should the dogs reach the page from itch.io?**
   - **Recommend the #fragment link** (looks only, never stored) over a short code saved on the server. Nothing personal is kept, and it works for guests.
   - Long links are fine for 1–10 dogs.
8. **Should buyers get an in-game thank-you gift?**
   - **Recommend yes, but cosmetic only**: one bandana, the same for every order, never more for bigger orders. It needs a gift code group (the existing gift-code system) and a cloud account.
   - Or skip it, and keep merch fully separate from the game.
9. **Ready-made designs.** **Recommend the four famous breeds as drawn**: Labrador, Frenchie, Golden and Dachshund. Later, any of the 40 breeds could be picked from the /dogs page.
10. **Should the header get a sixth tab?**
    - **Recommend yes**, as drawn: it fits at 360 px.
    - Alternative: Merch only in the footer and on /play/, if the owner wants the shop quieter.
11. **Does the mug print one side or both?** **Recommend both sides** (the same dog), so left- and right-handers both see it.
12. **Should the page allow a mix of dogs on one item** (for example, two dogs on a mug)? **Recommend not in v1**: one dog per item keeps the preview honest and the flow short.
