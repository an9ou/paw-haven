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
