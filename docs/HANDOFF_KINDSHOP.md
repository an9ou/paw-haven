# Kind shop (v2.24) handoff, 9 Nov 2026
Branch `claude/kind-shop` (mirrored to `claude/new-session-lzxuf9`). Contract `V224.md`, decisions `docs/design/kind-shop.md`,
Stripe state `docs/design/kind-shop-stripe-setup.md` (section 5 = what is done).
- Game, art, site, translations, the 3 reviews: done. Tests green: v224_shop 96, v224_worker 93, worker 2309, smoke, i18n_fit.
- (+) by the coins opens the Coins tab; pack lists centred (owner asked, 9 Nov).
- Stripe: Hong Kong account, Managed Payments on, sandbox products/prices (tax-inclusive), webhook, restricted key; the Worker
  is DEPLOYED with the sandbox secrets and passed a real end-to-end buy / owned / refund test. SHOP_LIVE stays false.
- Stripe connector is connected (accounts: live acct_1UXv1dElR1ebyhgm, sandbox acct_1UXv1nIdJRrYdh73).
Live (9 Nov): live products, webhook, rk_live_ key and live SHOP_PRICES are in; a real US$0.99 buy and refund worked end to end.
BLOCKER: the live checkout showed tax liability `self`, not `stripe` (Managed Payments review pending?). Re-test before SHOP_LIVE.
Open:
1. Merge origin/main into claude/kind-shop: conflicts in i18n json, packed.js, font subsets, CHANGELOG, HANDOFF_GM, 06_wardrobe,
   49c_news, css ORDER, worker.js (keep both: FR_LIM houses 15 + DC_COAT I). Regenerate packed.js and fonts, rerun the suites.
2. Launch (owner sets the date; never merge or deploy the game before it): live-mode products with tax_behavior inclusive,
   live webhook + rk_live_ key (owner pastes secrets into Cloudflare), live SHOP_PRICES, NEWS_V224 date, SHOP_LIVE = true,
   coordinate with the Game Manager, then itch.io push and the Marketing briefing.
3. Edge cases before launch: a refund that arrives before its completed webhook is lost; partial refunds keep the item.
