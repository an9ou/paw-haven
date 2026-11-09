# Kind shop: Stripe setup (owner, later)

The Worker's shop routes are built and closed: they answer "shop_closed" until the keys below are in. Contract: `V224.md` section 4.
Do everything in **test mode** first, then repeat it in live mode for the launch. Keys go into the Worker as secrets only, never into
the repo, a chat or a file.

## 1. In Stripe (Dashboard)
1. Turn on Managed Payments (Settings > Managed Payments) and accept its terms. Stripe is then the merchant of record and handles tax.
2. Check the API version (Developers > API version) is `2025-03-31.basil` or later. Managed Payments needs it.
3. Create one product per shop item, each with a one-time price in USD and a tax code marked "Eligible for Managed Payments"
   (a digital good, such as video game content):

   | id | product | price |
   |---|---|---|
   | `supporter` | Supporter Pack | 4.99 |
   | `tokyo` | Tokyo Street | 2.99 |
   | `cozy` | Cozy Winter | 2.99 |
   | `robo` | Robo Scoop | 1.99 |
   | `sprinkler` | Garden Sprinkler | 0.99 |
   | `bowl` | Auto Water Bowl | 0.99 |
   | `comfort` | Comfort Kit | 2.99 |
   | `coins_1k` | 1,000 coins | 0.99 |
   | `coins_3k` | 3,000 coins | 1.99 |
   | `coins_8k` | 8,000 coins | 4.99 |

   Turn on Adaptive Pricing if you want local currencies at checkout. Note each price id (`price_...`).
4. Add a webhook endpoint (Developers > Webhooks): URL `https://<the API Worker's address>/shop/webhook`, events
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded`. Note its signing secret (`whsec_...`).

## 2. In the Worker (pawhaven-api)
```
npx wrangler secret put STRIPE_KEY -c cloudflare/wrangler.toml              # the secret key, sk_test_... first
npx wrangler secret put STRIPE_WEBHOOK_SECRET -c cloudflare/wrangler.toml   # the endpoint's whsec_...
npx wrangler secret put SHOP_PRICES -c cloudflare/wrangler.toml             # {"supporter":"price_...","tokyo":"price_...", ...}
```
`SHOP_PRICES` is not secret, but as a secret it survives `tools/cf_api_deploy.sh`. An item missing from it stays closed.
Optional: `STRIPE_VERSION` (pins the API version header), `SHOP_SUCCESS_URL` / `SHOP_CANCEL_URL` (default
`https://doodledoggo.app/thanks?ok=1` / `?ok=0`).

Deploy the Worker (`bash tools/cf_api_deploy.sh`) **before** the game release that turns the shop on: it also adds the `purchases`
table and the new house and outfit limits.

## 3. Test (test mode)
1. In a test copy with the shop switched on, buy each item with the card `4242 4242 4242 4242`. The game tab should get it when you come back.
2. Stripe Dashboard > the payment > Refund (in full): the next poll takes the item back (coins stay).
3. Webhooks page: every delivery answered 200.

## 4. Launch
Repeat steps 1.3, 1.4 and 2 in live mode (new live price ids, a live endpoint and its own `whsec_...`, the `sk_live_...` key), one live
purchase and refund, then the Game Manager sets `SHOP_LIVE = true` on your launch date.
