# Doodle Doggo in the app stores: launch plan (draft for the owner)

Written 11 Nov 2026 for the owner ("After finishing those tasks, we start planning launch in app stores", 11 Nov). This is a plan to decide on, not a
build: nothing here has been built, no store account exists, and no game code changed. Store rules move fast; every rule below has its source and the
date it was read (section 11). Re-check the payment rules (section 3) in the week we submit.

## 1. Goal and recommendation (one screen)

**Goal:** Doodle Doggo on the iPhone App Store and Google Play, free to download, the same game as itch.io and doodledoggo.app, with the Kind
shop working inside the stores' rules, and one cloud account that carries the dogs and purchases between web and app.

**Recommendation:**
- **One wrapper for both stores: Capacitor.** The game's own build goes into the app, fully offline; no live-update tricks. Android first (cheaper,
  faster review), iOS a few weeks later or together if the Mac is ready.
- **Payments: the store's own billing inside the apps, Stripe stays on the web and itch.io.** StoreKit (Apple) and Play Billing (Google) sell
  the same items at the same prices (0.99 / 1.99 / 2.99 / 4.99 USD). The pawhaven-api Worker checks every store receipt and writes it into the
  same `purchases` table, so a purchase made anywhere shows up everywhere (Apple allows this for multiplatform games, 3.1.3(b)). No links to
  Stripe from inside the apps in v1 (simpler, no regional rules, no reviewer arguments). Join both 15% small business programmes.
- **Accounts: keep our own email login** (no Sign in with Apple needed, 4.8 exemption) and **add "Delete my account" in the game**
  (required by both stores; today it is an email to contact@doodledoggo.app). Let guests buy in the app (no email needed).
- **Audience: all ages, not the Kids category.** Apple 4+ outside the Kids category; Google target audience includes children, so we follow the
  Families policy (we already do: no ads, no tracking, no free text). "We never sell dogs, no loot boxes, the game is complete for free" goes into
  the store text.
- **Native extras so it is more than a website (Apple 4.2):** offline play, haptics, a share sheet for photos, Game Center achievements from the
  badges, and gentle opt-in reminders (off by default, never guilt).
- **Cost:** Apple 99 USD a year + Google 25 USD once; about 1 new Worker part, 1 app build tool, 1 game release with app hooks. **Time:** about
  6 to 9 weeks from the owner's decisions to both stores (section 9), so late January 2027 if we start in early December.

## 2. Packaging

| Option | iOS | Android | Store payments | Offline | Verdict |
|---|---|---|---|---|---|
| **Capacitor** (Ionic, open source) | yes | yes | yes, by plugin | yes, the game is inside the app | **Recommended** |
| TWA (Trusted Web Activity, Bubblewrap) | no | yes | Play Billing via Digital Goods API, awkward | only with a service worker | Android-only, needs a web store build; no |
| PWA (add to home screen) | no store | no store | — | with a service worker | Not a store app; could still be offered on the site later |
| Cordova / React Native WebView / Tauri mobile | yes | yes | yes | yes | Cordova is older; RN or Tauri add a second toolchain for nothing |

Why Capacitor: it is a thin native shell around the system WebView (WKWebView on iOS, Android System WebView = Chrome), it serves our files
from inside the app, and it has plugins for everything below. The game stays one web build; the app is a third target next to itch.io and
`/play/`, made by a new `tools/app.js` (like `tools/itch.js`: the split, minified build, the dev button stripped, and a small app bridge script).

What the app build must handle:
- **Offline play.** All files ship in the app: the game, `lang/<code>.<hash>.js`, the photo fonts and the CJK and Thai subsets. The three Google
  Fonts (Caveat, Gloria Hallelujah, Patrick Hand; open licences) are bundled too, so the app never calls Google Fonts and plays on a plane.
- **Saves.** The game keeps using `localStorage['pawhaven_proto_v1']` (WebView storage lives in the app's own data and survives updates). iOS can in
  rare cases clear WebView data, so the bridge also mirrors the save to native storage (Capacitor Preferences) and puts it back on start if
  localStorage is empty. The cloud save works as today.
- **The API's CORS list.** The app's pages come from `capacitor://localhost` (iOS) and `https://localhost` (Android). Both must be added to
  `ORIGINS` in `cloudflare/worker.js`, or cloud save and Friends fail in the app.
- **Size.** The page is about 8 MB raw with every language (PERF.md), plus fonts and the shell: an estimated 15 to 25 MB download. Fine for both
  stores (no asset packs needed).
- **Low-end phones.** Same engine as Chrome on Android, so today's phone tuning carries over. Test on one cheap Android (2 to 3 GB RAM) and an
  older iPhone (iOS 16, the proposal's floor) with `tools/perf_measure.js`-style timings.
- **Safe areas.** The phone CSS already uses `env(safe-area-inset-*)` in ten files; set `viewport-fit=cover`, portrait only on phones, and
  check the notch, Dynamic Island and the Android gesture bar with paw-fit screenshots.
- **Audio.** The game already starts audio on the first tap. In the app, use the "ambient" audio session (mixes with the player's own music and
  respects the silent switch) and pause music when the app goes to the background.
- **Android back button.** Close the top sheet; if none, go back to the home yard; at home, "Leave Doodle Doggo?" (App plugin `backButton`).
- **Deep links for invites `/f/<code>`.** iOS Universal Links (`apple-app-site-association`) and Android App Links (`assetlinks.json`), both served
  from doodledoggo.app by the site Worker. With the app installed, the invite opens the app's Friends sheet with the code filled in; without it,
  the current `/f/` page stays and gains "Get it on the App Store / Google Play" buttons.
- **Links out.** The app hides "Play on itch.io", the site's play box and the Stripe path. Help, privacy and Instagram links open in the system
  browser.
- **Updates.** Each release is a normal store update with the game inside. No over-the-air code updates (Apple's rules on downloaded code, and
  they would break offline play).

## 3. Payments

### What the stores require
- **Apple 3.1.1:** digital items used in the app (coins, the Supporter Pack, looks, tools) must be sold with In-App Purchase. Outside the US the
  app may not show buttons or links to other ways to pay.
- **Apple 3.1.3(b) Multiplatform:** items bought on our website or itch.io may be used in the app, consumable coins included, **as long as they
  are also on sale as In-App Purchases in the app**. So the shared account can keep everything.
- **Google Payments policy:** Play Billing for digital goods, with regional exceptions (below).

### Region by region (read 11 Nov 2026)
| Region | Apple | Google | What we do in v1 |
|---|---|---|---|
| US | Links and buttons to web payment are allowed in US apps; since the Ninth Circuit ruling (Dec 2025) and the stay reversal (29 Apr 2026) Apple may not charge a commission on them until the district court sets one | External content links and alternative billing programmes (since 9 Dec 2025); Google collects fees from 1 Oct 2026 (reporting for links extended to 1 Feb 2027) | IAP / Play Billing only. A later option: a US-only "or pay on the web" link to Stripe (section 10, decision 3) |
| EU (DMA) | Link-out entitlements with Apple's EU fees on top | Alternative billing and external offers, reduced fee | IAP / Play Billing only |
| Japan (MSCA, from 18 Dec 2025, iOS 26.2) | IAP: 21% (10% small business) + 5% IAP fee; web link-out: 15% (10% for small business); **no link-outs in Kids-category apps** | User choice billing available | IAP / Play Billing only |
| Korea | Alternative payment entitlement, 26% | User choice billing | IAP / Play Billing only |
| Everyone else | IAP | Play Billing | IAP / Play Billing |

Why no link-outs in v1: the money saved is small for a game of our size (the table below), every region has its own forms, fees and wording, the US
rules are still in court, and a child-friendly game is easier to approve with a single "Buy" path.

### The catalogue in the stores
| Id (same as Stripe) | Store type | Price tier (USD) |
|---|---|---|
| `supporter` | non-consumable | 4.99 |
| `tokyo`, `cozy` | non-consumable | 2.99 each |
| `robo` | non-consumable | 1.99 |
| `sprinkler`, `bowl` | non-consumable | 0.99 each |
| `comfort` | non-consumable (grants the three tools) | 2.99 |
| `coins_1k` / `coins_3k` / `coins_8k` (2,000 / 5,000 / 14,000 coins) | consumable | 0.99 / 1.99 / 4.99 |

Both stores turn the USD tier into local prices (Japan, the EU, and so on) and include VAT and sales tax; like Managed Payments, the store is the
seller of record and files the tax. **Same prices on web and app** (simplest; Apple and Google allow cheaper web prices but we do not need
them). Later packs: one new store product each, created by the owner in App Store Connect and Play Console.

### How the shop changes in the app (game, behind an app flag)
- The confirm sheet says "Pay with the App Store / Google Play" and calls the store plugin instead of opening Stripe. No Stripe words in the app.
- **Guests can buy** (no email needed): the purchase is tied to the guest's cloud id (the Worker already gives guests a token). Adding an email later
  keeps it (the `/register` upgrade path).
- **Restore purchases** (Apple expects it for non-consumables): asks the store to restore, sends the receipts to the Worker, then reads
  `/shop/owned` as today.
- Coin buys with game coins are unchanged.

### The Worker (`pawhaven-api`)
- New routes `POST /shop/apple` and `POST /shop/google`: the game sends the signed transaction (Apple StoreKit 2 JWS) or the purchase token
  (Google). The Worker checks it with the App Store Server API / Google Play Developer API, then writes a row into `purchases` with
  `source = 'apple' | 'google' | 'stripe'` and the store's transaction id (idempotent, like the Stripe session id). Then the game's usual
  `/shop/owned` grant path (`ksGrant`, the Delivered! card, Gerald's letter) works untouched.
- **Refunds:** Apple App Store Server Notifications v2 (`REFUND`) and Google Real-time developer notifications (`voidedPurchases`, via a Pub/Sub
  push) hit the Worker and mark the row refunded: one-time items are taken back, coins already given stay (our current rule). The owner cannot
  refund store purchases; players ask Apple or Google. Google consumables must be "consumed" after the grant so they can be bought again.
- **Secrets:** an App Store Connect API key and a Google service account key go in as Worker secrets (like the Stripe keys), never in the repo.
- No third-party payment SDK (for example RevenueCat): it would mean another company in the privacy answers. Our Worker already does the job.

### Fees compared (per sale, rough)
| Price | App Store / Play (15% small business) | Stripe Managed Payments (about 3.5% + card fee about 3% + a fixed fee; check the HK price page) |
|---|---|---|
| 0.99 | about 0.84 | about 0.60 |
| 2.99 | about 2.54 | about 2.50 |
| 4.99 | about 4.24 | about 4.37 |

The stores cost about the same as Stripe for these small prices (and less on 0.99, where the card fee bites). Store prices also include VAT,
so the net is a little lower in VAT countries; the same is true for Managed Payments.

**Managed Payments:** nothing changes for web and itch.io purchases. Store purchases never touch Stripe; Apple and Google pay out monthly
to the owner's bank (Hong Kong or Japan, the owner's choice when setting up the account) with their own tax forms (a US W-8BEN or W-8BEN-E).

## 4. Accounts and login

| Rule | Today | What to do |
|---|---|---|
| Apple 4.8 Login services: an app using a third-party or social login must also offer one like Sign in with Apple | We use only our own email + password (and guests) | **Nothing.** Apps that use only their own sign-in are exempt. Do not add Google sign-in in v1, or Sign in with Apple becomes required |
| Apple 5.1.1(v): an app that creates accounts must offer account deletion **in the app** | Deletion by email to contact@doodledoggo.app | **Build "Delete my account"** in Settings > Cloud: confirm twice, then `DELETE /account` deletes the account, saves, backups, Dog Card, Friends data and our purchase rows (Stripe and the stores keep their own records). The device save stays unless the player also resets. Guests get "Delete my cloud copy" |
| Google Play account deletion: in-app deletion **and** a web link listed in the Data safety form | — | The same route, plus a deletion page on doodledoggo.app (`/delete`: log in with email and password, or the code by email, then delete) |
| Apple 5.1.1(v): apps without account features must work without login | Guest play is complete | Keep it; never ask for an email before playing |

Optional later: Sign in with Apple and Google sign-in together (one tap, no password to forget). It needs Worker work and new privacy answers; not
needed to launch.

## 5. Privacy and compliance

### What the game really collects (from `cloudflare/worker.js`, `site/privacy.html`)
- Email address and a password hash (only for email accounts).
- The game save and up to 5 backups (dogs, coins, the yard: game progress).
- A random account id and session tokens; a random device label in saves.
- Purchases: id, item, amount, currency, time, account id.
- Dog Card (opt-in) and Friends (opt-in): two-word names picked from lists, the dogs' looks, the yard snapshot, pets, preset notes, gifts.
  No free text anywhere.
- IP address, used only for rate limits.
- Not collected: name, age, location, contacts, photos (photo mode saves to the device), analytics, advertising ids. No ads, no tracking.

### Apple privacy "nutrition label"
- **Data used to track you:** none.
- **Data linked to you:** Contact Info (Email Address: App Functionality), Identifiers (User ID: App Functionality), Purchases (Purchase
  History: App Functionality), User Content (Gameplay Content: App Functionality).
- No App Tracking Transparency prompt (we do not track).

### Google Data safety
- Collected: Personal info > Email address (optional, account management); App activity > Other actions / in-game progress (app
  functionality); Financial info > Purchase history (app functionality); Device or other IDs (the save's device label, app functionality; declare
  it to be safe).
- Shared with third parties: none (Cloudflare and Resend are service providers, which Google does not count as sharing).
- Encrypted in transit: yes. Players can ask for deletion: yes (in the app and the `/delete` web page).

### Privacy page changes (12 languages)
"You play on itch.io" becomes "on itch.io, doodledoggo.app or the app"; App Store and Google Play named as sellers for app purchases; the
in-app deletion steps; the bundled fonts (no Google Fonts call in the app).

### Age rating and audience
- **Apple:** the new questionnaire (five tiers since 2025: 4+, 9+, 13+, 16+, 18+). No violence, no free-text chat, no user feed, no gambling, no
  loot boxes. Expected **4+**, with "In-App Purchases" shown. Not in the Kids category: it forbids links out and purchases outside a parental gate,
  and Japan's new link rules exclude it; we gain little from it.
- **Google:** the IARC questionnaire in Play Console (it also gives ESRB, PEGI, USK, CERO-style ratings). Expected **Everyone / PEGI 3** with
  "In-Game Purchases". Friends has only preset words, so "Users Interact" should not apply; answer honestly if the questionnaire says otherwise.
- **Target audience:** the crayon dogs appeal to children and Google will judge that anyway, so include children in the Google target age
  groups and follow the **Families policy** (no ads or ad SDKs today; any later rewarded ads must use a Families-certified ad SDK; a privacy
  policy; no personal data from children beyond what the game needs). Keep the existing "Ask a grown-up before you buy" line on every confirm sheet.
- **Watch:** US state "app store accountability" age laws (Texas SB 2420 and others) and Apple's Declared Age Range API. They mainly bind the
  stores; check again before submission whether a game like ours must read the age range.

### Selling points for review and players
"We never sell dogs. No loot boxes, no random paid rewards, no ads, no tracking. Every paid item shows exactly what you get, and the game is
complete without paying." These match Apple 3.1.1 (loot box odds), the Families policy and the stores' kids guidance, and belong in the description.

## 6. Store listing

- **Name:** "Doodle Doggo" (check that it is free in both stores and as a trademark in the owner's main markets). Apple subtitle (30 chars),
  e.g. "Cozy crayon dog town"; Google short description (80 chars).
- **Keywords** (Apple, 100 chars per language): dog, puppy, cozy, pet, crayon, doodle, garden, Tokyo, Japan, walk. Never "breed" as a verb,
  "sell" for dogs, or other games' names (the build's word list applies to store text too).
- **Description in 12 languages:** written in English from `docs/itch/PAGE_TEXT.md`, then translated in one batch with the **paw-i18n** skill
  (style guides `docs/i18n/<code>.md`). Store text lives in `docs/store/<lang>.md` (Fastlane-style folders later, if we automate uploads).
- **Screenshots:** Apple: 6.9-inch iPhone (1320 x 2868) and, if iPad is on, 13-inch iPad (2064 x 2752); Google: phone 9:16 (e.g. 1080 x 1920),
  optional tablet, plus a 1024 x 500 feature graphic. Made with `brand/itch/make_screenshots.js` at those sizes and checked with **paw-fit**
  (every language, nothing under the phone bar). 5 to 8 shots: the yard, a walk in Tokyo, the garden, puppies, the Wardrobe, Friends, a festival.
  One localised set per language for the top languages (en, ja, zh-Hant, ko), English captions elsewhere at first.
- **Icon:** `brand/make.js` already draws the 512 px icon; add 1024 x 1024 for Apple (no transparency) and Android adaptive layers.
- **Preview video** (optional, 15 to 30 s): the story mode scene engine (v2.29) can play a scripted tour that we record in Playwright at the
  store sizes. Apple requires real in-app footage, which this is.
- **Ratings prompt:** the native review prompt (Apple `SKStoreReviewController`, Google In-App Review) once, after a happy moment (the Bond 2
  party), never after a purchase, never blocking play, never asking twice in a month.

## 7. Review risks and how to pass

| Risk | How we pass |
|---|---|
| **Apple 4.2 "repackaged website"** (the main risk for web games) | It is a full game, offline, no browser chrome, with native features: haptics (catches, level-ups; off switch), the share sheet and "Save to Photos" for photo mode, Game Center achievements from the 19 badges (`24c_badges.js`), opt-in local reminders, Universal Links for invites. Say so in the review notes |
| Apple 3.1.1: a link or word about paying on the web | The app build removes Stripe, itch.io and `/play/` paths; the review notes say web purchases are honoured under 3.1.3(b) and every item is also an IAP |
| Reviewer cannot test the shop or Friends | A review account (email + password) with dogs, a friend and some coins; sandbox testers for IAP |
| Reminders seen as pushy | Off by default, chosen in Settings, at most one a day, kind and factual only ("Your tomatoes are ripe", "Gerald left a letter"). Never "your dog misses you", streak threats or countdowns. Local notifications only: no push server, no device tokens |
| Account deletion missing | Built before submission (section 4) |
| Google 12 testers for 14 days | Only for new **personal** Play accounts; an organisation account skips it. If personal: recruit 12 testers (Marketing's followers, friends) for a closed test |
| Kids / Families review | The Families checklist in Play Console; no ad SDKs; privacy policy link; "Ask a grown-up" on every purchase |
| Cloud saves between versions (web newer than the app while a review waits) | Submit the app 3 to 5 days before a web release and release both on the same day (Apple "manual release", Google managed publishing). The Worker can tell an old client to update if a save from a newer version arrives |

Widgets and iCloud: not in v1 (widgets need native Swift and Kotlin code; the cloud account already does what iCloud would).

## 8. Costs and who does what

| Item | Cost |
|---|---|
| Apple Developer Program | 99 USD a year |
| Google Play developer account | 25 USD once |
| D-U-N-S number (organisation accounts only) | free, 1 to 2 weeks |
| Store fees | 15% of sales (small business programmes, under 1M USD a year) |
| iOS builds | the owner's Mac with Xcode (free; Apple requires a recent Xcode and SDK for uploads, so the Mac must run a recent macOS), or a cloud Mac build service such as Codemagic or GitHub Actions macOS runners (free tiers exist; check current pricing) |
| Test devices | one cheap Android phone (about 100 to 150 USD) if the owner has none; the owner's iPhone |
| Worker | no change in cost (same Worker and D1) |

**The owner's manual steps** (Claude cannot do these): open the Apple and Google developer accounts (identity checks, payment, tax and bank
forms, the D-U-N-S number if an organisation); accept the paid-apps agreements; create the store products (or approve an API key so a session
can); make the App Store Connect API key and the Google service account and put them into the Worker as secrets; install Xcode or approve a
cloud build service; sign and upload the iOS build (or let the cloud service do it); press "Submit for review" and "Release"; answer reviewers.

**Claude sessions:** `tools/app.js` and the Capacitor projects (`app/` folder), the app bridge (saves mirror, back button, haptics, share,
notifications, Game Center), the shop's store path, the Worker routes and their tests, account deletion and the `/delete` page, the privacy
page, store text in 12 languages, screenshots and video, review notes, the release recipe. Android builds (Gradle) can run in a cloud session if
its network allows Google's Maven hosts. **This cloud environment cannot run Xcode**, so iOS builds happen on the owner's Mac or a cloud Mac service.

## 9. Timeline and release process

| Phase | What | Rough time |
|---|---|---|
| 0. Decisions and accounts | The owner answers section 10; opens both developer accounts (D-U-N-S first if an organisation) | 1 to 2 weeks (waiting for checks) |
| 1. App shell | `tools/app.js`, Capacitor projects, offline fonts, CORS, safe areas, back button, audio; first Android build on the owner's phone | 1 week |
| 2. Store payments and accounts | Worker `/shop/apple` and `/shop/google`, refunds, `DELETE /account`, `/delete` page; the game's app flag for the shop path, restore and deletion; tests (`v2xx_app`, `v224_worker` grows) | 2 weeks |
| 3. Native extras and listing | Haptics, share, Game Center, reminders; store text in 12 languages (one batch), screenshots, icon, video; privacy page | 1 to 2 weeks (alongside phase 2) |
| 4. Testing | Google internal test then closed test (14 days with 12 testers if a personal account); TestFlight for iOS; sandbox purchases and refunds; the three reviews (code, phone, art) | 2 weeks |
| 5. Submit and launch | Apple review (usually 1 to 3 days); Google first review (up to about a week); staged rollout on Google 10% > 50% > 100% over a week; Apple phased release over 7 days | 1 to 2 weeks |

From the owner's decisions to both stores: about 6 to 9 weeks. This is a big release, so the owner's go-ahead and launch date are needed before
anything goes public (CLAUDE.md; the 5-minute default does not apply). Marketing hears about it once the date is set.

**After launch, every release:** `main` green > web, itch.io and site as today > `tools/app.js` builds the app > Google internal test track and
TestFlight > submit both > release web and apps on the same day. Small fixes that touch only the web can still ship to the web alone; the apps
pick them up with the next store update. The paw-release skill gets an "app" section.

## 10. Decisions for the owner

1. **Which stores first?** (a) Both together **(recommended if the Mac can run current Xcode)**; (b) Google Play first, iOS about a month later;
   (c) iOS first.
2. **Wrapper?** (a) **Capacitor for both (recommended)**; (b) TWA for Android only; (c) PWA only, no stores.
3. **Payments in the apps?** (a) **Store billing only, the same items and prices, purchases shared through the account (recommended)**;
   (b) as (a) plus a US-only "pay on the web" link to Stripe (0% Apple commission for now, Google fees since Oct 2026; more work and legal
   change risk); (c) no shop in the apps.
4. **Prices?** (a) **The same USD tiers everywhere (recommended)**; (b) cheaper on the web to pass on the lower fee (not needed at these prices).
5. **Developer accounts as a person or an organisation?** (a) **An organisation (the Hong Kong business), if it exists (recommended)**: the
   business name and address show in the stores instead of the owner's own (both stores show seller details to EU players), and Google's
   12-tester rule does not apply; needs a free D-U-N-S number; (b) a personal account (faster, but the owner's name and, for paid items, an address
   are public).
6. **Audience and rating?** (a) **All ages, Apple 4+ outside the Kids category, Google target audience including children under the
   Families policy (recommended)**; (b) Apple Kids category too (parental gate on the shop, no links out); (c) 13+ only (not honest for this game).
7. **Sign-in options?** (a) **Keep email + guests, add in-app account deletion (recommended)**; (b) also add Sign in with Apple and Google
   sign-in at launch.
8. **Guests buying in the app?** (a) **Yes, tied to the guest's cloud id, restorable through the store (recommended)**; (b) require an email first
   (as on the web today).
9. **Native extras for v1?** (a) **Haptics, share sheet, Game Center achievements, opt-in kind reminders (recommended)**; (b) also widgets;
   (c) no reminders at all.
10. **iPad?** (a) **iPhone and iPad (the desktop layout fits iPad; needs iPad screenshots) (recommended)**; (b) iPhone only first.
11. **iOS builds?** (a) **Install Xcode on the owner's Mac (recommended, free)**; (b) a cloud Mac build service (no Mac needed, a monthly
    cost after the free tier).
12. **When?** (a) **Start after the current releases (Sakura, Stories and stars, story mode), aim for late January 2027 (recommended)**;
    (b) start now in parallel with them.

## 11. Sources (read 11 Nov 2026)

- Apple App Store Review Guidelines, https://developer.apple.com/app-store/review/guidelines/ (3.1.1, 3.1.1(a), 3.1.3(b), 4.2, 4.7, 4.8,
  5.1.1(v), 1.3), read 11 Nov 2026.
- Epic v. Apple: Ninth Circuit ruling, Dec 2025 (no commission on US link-outs until the district court sets one), NeonPay summary,
  https://www.neonpay.com/blog/the-latest-epic-v.-apple-appeal-ruling-december-2025-what-changed-for-game-developers ; stay reversed 29 Apr 2026,
  https://www.macrumors.com/2026/04/29/epic-games-wins-reversal-app-store-fee-battle/ ; Apple's bid to delay lost, 15 May 2026,
  https://www.iclarified.com/100711/apple-loses-bid-to-delay-app-store-changes-in-epic-games-lawsuit
- Google Play US programmes (external content links, alternative billing; launched 9 Dec 2025, fees from 1 Oct 2026, link reporting extended to
  1 Feb 2027), https://support.google.com/googleplay/android-developer/answer/15582165 ; fee commentary,
  https://www.stash.gg/blog/googles-october-1-external-link-fees-what-changes-and-what-developers-still-dont-know
- Apple in Japan (MSCA, 17-18 Dec 2025, iOS 26.2): https://www.apple.com/uk/newsroom/2025/12/apple-announces-changes-to-ios-in-japan ;
  https://www.neonpay.com/blog/japans-mobile-software-competition-act-what-changed-for-mobile-game-developers
- Google Play testing for new personal accounts (12 testers, 14 days), https://support.google.com/googleplay/android-developer/answer/14151465
- Apple age ratings and age laws: https://developer.apple.com/news/?id=2ezb6jhj (Texas);
  https://appbot.co/blog/age-verification-apis-for-apps-google-apple/ (2026 overview)
- Known from the stores' own pages, to re-check at sign-up: Apple Developer Program 99 USD a year; Google Play 25 USD once; Apple Small Business
  Program and Google's 15% on the first 1M USD; Google Families policy and Data safety form; IARC ratings in Play Console.
- Our side: `V224.md`, `docs/design/kind-shop.md`, `docs/design/kind-shop-stripe-setup.md`, `cloudflare/worker.js`, `site/privacy.html`,
  `V219.md` (invite links), `PERF.md`, `tools/itch.js`.
