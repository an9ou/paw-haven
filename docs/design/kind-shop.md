# The kind shop: income decisions (owner, 3 Nov 2026)

Source: the Growth Plan (https://claude.ai/artifact/6CfP7zLRodZ5Y44rJ6REeL, "A kind shop"). The owner decided these in the choice window on 3 Nov 2026:

1. **Paid looks + Supporter Pack.** Supporter Pack 4.99 USD once (golden name tag, "Founding Friend" badge, a thank-you letter from Gerald, a unique house). Outfit and decor packs at 1.99–3.99 USD (6–10 themed items each, e.g. Tokyo street, Seaside, Cozy Winter). Everything except the Supporter Pack can also be earned slowly with coins. **Sparkle stays free** (design rule: cosmetic only, never paid).
2. **Rewarded ads on the web too**, not only in a future Android app. Always optional, never forced or interrupting: the player chooses to watch 15–30 s for double walk treasure, an extra harvest or a spare daily wish, at most 3 a day. The game is complete without them.
3. **Doodle Club monthly pass (2.99 a month): later**, after the one-time shop is out and selling.
4. **Payments: Stripe** (owner's choice; the owner is the seller, so overseas sales tax is the owner's job; Stripe Tax can help).

Rules that stay (CLAUDE.md, the Growth Plan): never sell dogs, Bond, welfare, coins-for-power or chances; no loot boxes or random paid rewards; a confirm step on every purchase (nothing aimed at children's impulse buys); prices in local currency; purchases verified by the Worker and stored in D1, with an "owned" list in the cloud save (additive migration). The v2.16 calendar line "no paid items" must be reworded before the shop ships.

## Open before building (owner)
- Stripe account (Hong Kong), and whether to turn on Stripe Tax.
- Web ads: which network. Google's H5 Games Ads (Ad Placement API) needs an AdSense account and Google's approval; kids play the game, so ads must be child-directed (non-personalised, no tracking), and EU/UK players need a consent prompt. itch.io and doodledoggo.app/play/ rules for ads must be checked. Earnings on the web are usually small.
- Prices and the first two packs' themes; the Supporter Pack house design.
- Version and date: a big content release (special-update rule: owner's go-ahead and launch date before main). The Growth Plan put it at v2.20 in December; Cantonese was also labelled v2.20 in its CHANGELOG row: pick one when either is dated.

## Next step
A design contract (V2xx.md): shop UI in the sketchbook style, the pack items (art), the Stripe Checkout flow through the Worker (`/shop/*`, webhooks, D1 table, restore purchases on a new device via the account), the ad button and its daily cap, the under-13 and parental wording, privacy page changes in 12 languages, tests. Three reviews (code, phone, art) as for every big release.

## Item previews (draft)
Preview art only (3 Nov 2026): `world/pawart_shop.js` (`PawArt.SHOP.*`, not in the build). The wearables are drawn by the game's own dog renderer through a preview-only hook (the game's `dogs/pawart_dogs.js` is unchanged); building them for real means moving them into `dogs/pawart_dogs.js` (and a new feet slot for the sneakers). Boards: `supporter.png`, `tools.png`, `tokyo_street.png`, `cozy_winter.png`, `overview.png` (in the session scratchpad `shop/`). Coin prices are for the "earn it slowly" path (clothes cost 75–95 coins and decor 80–100 today; a walk pays about 100 a day).

| Item | Price | What it does | Numbers, and what the player keeps | Also for coins? |
|---|---|---|---|---|
| **Supporter Pack** (all below) | 4.99 USD once | Thank-you pack | — | No |
| Golden Paw Cottage (Supporter House) | in the pack | A unique house: blue bell roof, gold trim, heart window, golden paw weathervane | A look, same comfort as a mid house | No |
| Golden Name Tag | in the pack | Neck item: a gold bone tag on a blue collar | Not the Bond 10 Golden Collar (that stays a Bond reward) | No |
| Founding Friend Badge | in the pack | A badge on the Dog Card and the friend card | Cosmetic | No |
| Gerald's Thank-You Letter | in the pack | A letter in the mailbox, kept to reread | Cosmetic | No |
| +20% walk coins | in the pack | Walks pay more | ×1.2 on the walk's coins (not on minigames, jobs, garden or gifts) | No |
| Crops grow 25% faster | in the pack | Shorter grow time | Grow time ×0.8 (25% more speed); harvests, quality and prices unchanged | No |
| +1 daily gift | in the pack | A second calendar gift each day | A treat, food or seeds only, never coins, so `FW_DG_COIN_CAP` is untouched | No |
| Robo Scoop | 1.99 USD | Tidies one pee or poop in the home yard and house once a game hour | Comfort only: no Bond, coins, `scooped` count or mission tick. Scooping by hand today gives +1 Bond at home (`12_popups_beds_map_snacks_potty.js`) and +2 Bond +3 coins in town; the player keeps that by scooping first, and town messes are never auto-tidied | Yes, 4,000 coins |
| Garden Sprinkler | 0.99 USD | Waters a veggie plot when it runs dry (water back to 3) | Watering by hand gives no coins or Bond today, only the `garden_water` mission; the sprinkler gives no mission tick. Side effect: no dry hours, so the "never dry" quality point comes free | Yes, 2,500 coins |
| Auto Water Bowl | 0.99 USD | Fresh Water refills and the dog drinks by itself when it is ready (every 2 game hours) | Same Happiness +5 / Energy +10 as by hand; Fresh Water gives no Bond today; no `water` mission tick from the auto drink | Yes, 2,500 coins |
| Comfort Kit | 2.99 USD | The three tools | Saves 0.98 | (each tool by coins) |
| **Tokyo Street** (6 outfits) | 2.99 USD | Sukajan Jacket (body), Bucket Hat (head), Little Sneakers (feet, new slot), Paw Tote (neck), Round Shades (eyes), Lucky Cat Charm (neck) | Looks only, no perks; new names (the Happi Coat and the Tokyo bandanas stay) | Yes, 600 coins each |
| **Cozy Winter** (6 decorations) | 2.99 USD | Cable-Knit Rug, Cocoa Mug Lamp (lit), Doggy Snow Globe, Tea-Cosy Bed (bed), Cardboard Fireplace, Woolly Armchair | Looks only; new names (Winter Market set, Giant Mitten Bed, Braided Rag Rug, Moon Lamp, Patchwork Quilt stay) | Yes, 600 coins each |

Every tool can be switched off in Settings and the hand way always works; nothing bad happens without a tool (a mess or a dry plot just waits).

**Economy check:** walks about 100 a day (230 real coins in the v2.18 sim) become 120 (276), and the garden (about 35 a day at 6 plots, 60 in the sim) becomes at most about 44 (75) if every plot is replanted on time, so walks stay the largest source and the garden stays below them; the v1.3 garden check (6 plots ≤ 45 a day) is close at 44, so the perk should be counted in the balance sim.

**Design concerns:** (1) +20% walk coins is a paid coin boost, against the Growth Plan's "never coins-for-power" line above: the owner asked for it (3 Nov 2026), so that line needs rewording ("no coins for sale; the Supporter Pack's small, capped speed-ups") before the shop ships, and a cap (e.g. +20 real coins a day) keeps it small. (2) Little Sneakers need a new feet slot in the Wardrobe and the save (`S.outfit.feet`, additive). (3) The Robo Scoop must not tick the daily `scoop` mission, or a paid tool would do a mission for the player.

## Owner's decisions, 8 Nov 2026 (kind shop lead session)

Research behind them: itch.io web games run in a frame on itch.io's own domain, so programmatic ads (they need `ads.txt` on a domain we control) can only run on doodledoggo.app/play/; itch.io allows unobtrusive ads if the page says so. Google H5 Games Ads needs AdSense plus a separate approval; each rewarded ad is opted into one by one; the "child" age tag (TFAT, which replaced TFCD/TFUA) turns off personalised ads and remarketing. Stripe Managed Payments (Stripe as merchant of record) supports Hong Kong sellers; Stripe Tax alone only calculates.

1. **Tax: Stripe Managed Payments.** Stripe is the merchant of record and files sales tax and VAT abroad; the owner files nothing overseas.
2. **Web ads: later, doodledoggo.app/play/ only.** The paid shop ships first. A later update adds AdSense + H5 Games Ads with the child tag (non-personalised), an EU/UK consent prompt and at most 3 a day; no ads in the itch.io build. Apply for AdSense early.
3. **+20% walk coins, no daily limit** (owner's choice over the +30 cap; the sim says +14-17% income for payers).
4. **Coins are for sale.** New shop rule (replaces "never coins-for-power"): *"We sell coins and looks, never dogs, Bond, welfare or chances. No loot boxes or random paid rewards, and the game is complete without paying."* Sparkle stays free and is never sold for coins either.
5. **Coin packs: 1,000 coins 0.99 · 3,000 coins 1.99 · 8,000 coins 4.99 USD.** No "best deal" banner.
6. **Spending guard: the confirm step only** (no grown-up check, no monthly cap); Stripe Checkout does the rest.
7. **First packs: Tokyo Street (6 outfits) and Cozy Winter (6 decorations)**, 2.99 USD each or 600 coins an item.
8. **Supporter Pack as drafted plus a one-time 2,000-coin gift.**
