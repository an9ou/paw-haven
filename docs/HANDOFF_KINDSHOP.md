# Kind shop (v2.24) handoff, 9 Nov 2026
Branch `claude/kind-shop` (mirrored to `claude/new-session-lzxuf9`). Contract `V224.md`, decisions `docs/design/kind-shop.md`,
Stripe state `docs/design/kind-shop-stripe-setup.md` (section 5 = what is done).
- Game, art, site, translations, the 3 reviews: done. Tests green: v224_shop 96, v224_worker 93, worker 2309, smoke, i18n_fit.
- (+) by the coins opens the Coins tab; pack lists centred (owner asked, 9 Nov).
- Stripe: Hong Kong account, Managed Payments on, sandbox products/prices (tax-inclusive), webhook, restricted key; the Worker
  is DEPLOYED with the sandbox secrets and passed a real end-to-end buy / owned / refund test. SHOP_LIVE stays false.
- Stripe connector is connected (accounts: live acct_1UXv1dElR1ebyhgm, sandbox acct_1UXv1nIdJRrYdh73).
Live (9 Nov): live products, webhook, rk_live_ key and live SHOP_PRICES are in; a real US$0.99 buy and refund worked end to end.
Managed Payments confirmed on live (SG card: liability stripe); HK buyers show `self` (domestic, no HK sales tax). No blocker.
Launch: the owner launches it together with the Game Manager (9 Nov). The owner lives in Japan; the Stripe account is Hong Kong.
Open:
1. Done 9 Nov: origin/main (v2.23.1-v2.23.3) merged; the Feet slot is a Wardrobe tab (only with the shop on or shoes owned), a 7-tab row
   keeps one line (`wd-t7`); v224_shop and wardrobe_tidy check either SHOP_LIVE state; merged worker.js = the deployed pawhaven-api.
2. Launch (owner sets the date; never merge or deploy the game before it): live-mode products with tax_behavior inclusive,
   live webhook + rk_live_ key (owner pastes secrets into Cloudflare), live SHOP_PRICES, NEWS_V224 date, SHOP_LIVE = true,
   coordinate with the Game Manager, then itch.io push and the Marketing briefing.
3. Edge cases: a refund that arrives before its completed webhook is handled since v2.24.1 (the Worker looks the session up); partial refunds keep the item (by design).
