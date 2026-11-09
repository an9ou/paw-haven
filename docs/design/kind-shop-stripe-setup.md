# Kind shop: Stripe setup (owner, later)

The Worker's shop routes are built and closed: they answer "shop_closed" until the keys below are in. Contract: `V224.md` section 4.
Do everything in **test mode** first, then repeat it in live mode for the launch. Keys go into the Worker as secrets only, never into
the repo, a chat or a file.

## 0. Account country (owner, 9 Nov 2026)
The Stripe account is registered in **Hong Kong** (the owner's accountant's advice). Hong Kong is a supported business location for
Managed Payments (docs.stripe.com/payments/managed-payments/eligibility: AU, HK, JP, SG in Asia Pacific). Keep Managed Payments **on**:
Hong Kong has no sales tax, but buyers' own countries tax digital sales to consumers (EU and UK VAT, Japan JCT, Australian GST, many US
states) wherever the seller is based, and with Managed Payments Stripe is the seller of record and files those. A Stripe account's country
can't be changed, so a Hong Kong account is a new account (Dashboard > account menu > New account > Hong Kong). Payouts go to a Hong Kong
bank account in HKD; the prices stay in USD. Buyers in China, Russia and a few other places can't buy (Stripe's restricted list).

## 1. In Stripe (Dashboard)
1. Turn on Managed Payments (Settings > Managed Payments) and accept its terms. Stripe is then the merchant of record and handles tax.
2. Check the API version (Developers > API version) is `2025-03-31.basil` or later. Managed Payments needs it.
3. Create one product per shop item, each with a one-time price in USD and a tax code marked "Eligible for Managed Payments":
   use `txcd_10201000` (Video Games - downloaded - non subscription - with permanent rights) for every item:

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

## 5. Done so far (9 Nov 2026)
Sandbox account `Doodle Doggo sandbox` (acct_1UXv1nIdJRrYdh73): the 10 products, each with its USD price and tax code `txcd_10201000`,
metadata `ks_id` = the shop id. Sandbox `SHOP_PRICES` (not secret):
```
{"supporter":"price_1UZv02IdJRrYdh73LKLVqeBn","tokyo":"price_1UZv0GIdJRrYdh73eBKpmFQb","cozy":"price_1UZv0JIdJRrYdh73mpSMNVNI","robo":"price_1UZv0LIdJRrYdh73suyKlF8I","sprinkler":"price_1UZv0UIdJRrYdh73oY2DOnr7","bowl":"price_1UZv0XIdJRrYdh73Qs0qprma","comfort":"price_1UZv0aIdJRrYdh73qUtnLFVX","coins_1k":"price_1UZv0cIdJRrYdh73isFK94WB","coins_3k":"price_1UZv0fIdJRrYdh73KWCWNl1Y","coins_8k":"price_1UZv0jIdJRrYdh73NocCKIgV"}
```
The Worker on `claude/kind-shop` carries main's RED_I line (DC_COAT `I`) and passes test_worker (2309) and test_v224_worker (93).
**Deployed 9 Nov 2026** (owner's go-ahead) with the sandbox secrets: `STRIPE_KEY` (restricted key: Checkout Sessions write, Products and
Prices read), `STRIPE_WEBHOOK_SECRET` (sandbox destination `we_1UZvA1IdJRrYdh73ntuQV8mp`, the three events) and `SHOP_PRICES` above.
End-to-end sandbox test, 9 Nov 2026, with a throwaway account (deleted from D1 afterwards):
- `/shop/catalog`: all 10 items `on`.
- 1,000 coins: Stripe-hosted checkout with Managed Payments ("Sold through Link", tax liability Stripe), test card 4242, US address:
  US$0.99 + 8.875% NY tax = US$1.08, back to doodledoggo.app/thanks?ok=1; the webhook recorded it in `/shop/owned`.
- Tokyo Street: paid (US$3.26 with tax), a second checkout answered 409 owned; a full refund through the API reached the Worker
  (`refunded: true`) and the item could be bought again.
Tax: the owner chose **tax-inclusive** prices (9 Nov 2026): buyers pay exactly the price the game shows, the tax comes out of the
owner's share. All 10 sandbox prices are `tax_behavior: inclusive`; set the same on every live price. Adaptive Pricing is on.
Live-mode products: not made yet.

## 6. Live mode (9 Nov 2026)
The owner activated the live Hong Kong account. Live account `Doodle Doggo` (acct_1UXv1dElR1ebyhgm): the 10 products, tax code
`txcd_10201000`, prices `tax_behavior: inclusive`. Live `SHOP_PRICES` (set on the Worker only together with the live key and webhook secret):
```
{"supporter":"price_1UZvj2ElR1ebyhgmR6Dk5Sg1","tokyo":"price_1UZvjKElR1ebyhgmA142oDy3","cozy":"price_1UZvjLElR1ebyhgmtUqgDKTc","robo":"price_1UZvjLElR1ebyhgm3oBmS0Yz","sprinkler":"price_1UZvjMElR1ebyhgmRjrpXstr","bowl":"price_1UZvjNElR1ebyhgml5WXm5lh","comfort":"price_1UZvjNElR1ebyhgmmbQU4db2","coins_1k":"price_1UZvjOElR1ebyhgmjwMv3WE5","coins_3k":"price_1UZvjPElR1ebyhgmqTs7uy7c","coins_8k":"price_1UZvjPElR1ebyhgmAeovn2xd"}
```
