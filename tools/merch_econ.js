#!/usr/bin/env node
// Merch unit economics with a Hong Kong Stripe account (24 Nov 2026).
// Formula: docs/design/merch/TRANSACTIONS.md section 9, without the fixed cost o:
//   margin = P - T - W*(1 + t_w) - f - s - r
// Prints Markdown tables. No dependencies: `node tools/merch_econ.js`.
// Research, not tax or accounting advice.
'use strict';

// ---------------------------------------------------------------- inputs
const IN = {
  // FX. ECB reference rates for 23 Nov 2026 (api.frankfurter.app, read 24 Nov 2026).
  fx: { hkdPerUsd: 7.84, usdPerGbp: 1.307, gbpSens: [1.25, 1.35] },

  // Stripe Hong Kong, stripe.com/en-hk/pricing read 24 Nov 2026.
  stripe: {
    base: 0.034,          // 3.4% card fee
    intl: 0.005,          // +0.5% international cards (every US or UK card is international to a HK account)
    fx: 0.02,             // +2% if currency conversion is required
    fixedHkd: 2.35,       // HK$2.35 per domestic-rate charge (settled in HKD)
    fixedUsdSettled: 0.30, // US$0.30 per charge "when settled in USD"
    // GBP settled in GBP: the page lists no GBP fixed fee. Assumed: HK$2.35 converted to GBP.
    disputeHkd: 85,       // HK$85 per dispute
    tax: 0.005,           // Stripe Tax 0.5% per transaction (no-code / Checkout), only where registered
    taxApiHkd: 3.50,      // or HK$3.50 per transaction for API integrations
  },

  // Taxes and reserve.
  usToolTax: 0.07,   // Printful charges ~7% US sales tax on (base + shipping) without a resale certificate; placeholder average
  ukVat: 0.20,       // UK prices include 20% VAT; seller VAT-registered, Printful's UK VAT reclaimed
  reserve: 0.05,     // reprint reserve, 5% of wholesale W
  usHoliday: 0.40,   // Printful US holiday surcharge per US order, 15 Oct 2026 - 17 Jan 2027

  // Printful base (USD, size S-XL, front print): public catalog API api.printful.com/products/{id}, read 24 Nov 2026.
  // Standard shipping, first item (USD): printful.com/shipping as quoted in PROVIDERS.md 1.1 (not re-read).
  // price: PROVIDERS.md section 4 (hoodie from the prototype). us/uk: null = not offered there.
  products: [
    { name: '11 oz mug',         id: '19',   base: 6.07,  ship: { us: 6.69, uk: 5.19 }, price: { us: 21.99, uk: 15.99 } },
    { name: 'Tee (B+C 3001)',    id: '71',   base: 11.92, ship: { us: 4.95, uk: 4.79 }, price: { us: 27.99, uk: 23.99 } },
    { name: 'Sticker sheet A5',  id: '505',  base: 5.15,  ship: { us: 4.49, uk: 4.29 }, price: { us: 15.99, uk: 13.49 } },
    { name: 'Tote W101',         id: '1553', base: 10.18, ship: { us: 4.69, uk: null }, price: { us: 24.99, uk: null } },
    { name: 'Tote EC8000',       id: '367',  base: 15.87, ship: { us: 4.69, uk: 4.59 }, price: { us: 24.99, uk: 28.99 } },
    { name: 'Sweatshirt (18000)', id: '145', base: 19.17, ship: { us: 8.79, uk: 7.29 }, price: { us: 45.99, uk: 37.99 } },
    { name: 'Hoodie (18500)',    id: '146',  base: 22.63, ship: { us: 8.79, uk: 7.29 }, price: { us: 51.99, uk: 42.99 } },
  ],

  floor: { usd: 4, share: 0.20 },   // margin guard, TRANSACTIONS.md section 3
  targets: [0.25, 0.30, 0.35],
  fixedMonthlyGbp: [20, 40, 80],    // a monthly fixed cost o (accountant, VAT filing), spread over UK orders
  ukOrders: [10, 20, 50],
};

// ---------------------------------------------------------------- model
const S = IN.stripe;
// Stripe cases. Case 1 (3.4%, domestic card) never applies: buyers pay with US or UK cards.
// Case 2: the charge settles in its own currency (USD or GBP balance, bank account in that currency), no +2%.
// Case 3: the charge is converted to HKD, +2%.
function stripeFee(P, region, kase, usdPerGbp) {
  const pct = S.base + S.intl + (kase === 3 ? S.fx : 0);
  let fixed;
  if (region === 'us') fixed = kase === 2 ? S.fixedUsdSettled : S.fixedHkd / IN.fx.hkdPerUsd;
  else fixed = S.fixedHkd / IN.fx.hkdPerUsd / usdPerGbp; // GBP fixed fee not published; HK$2.35 either way
  return { pct, fixed, fee: pct * P + fixed };
}

// All amounts in the region's own currency (USD for US, GBP for UK).
function econ(p, region, kase, opts = {}) {
  const usdPerGbp = opts.usdPerGbp || IN.fx.usdPerGbp;
  const k = region === 'us' ? 1 : 1 / usdPerGbp;   // USD -> region currency
  const P = opts.price != null ? opts.price : p.price[region];
  const T = region === 'uk' ? P * IN.ukVat / (1 + IN.ukVat) : 0;
  const net = P - T;
  const W = (p.base + p.ship[region]) * k;
  const tw = region === 'us' ? IN.usToolTax : 0;
  const hol = region === 'us' && opts.holiday ? IN.usHoliday : 0;
  const toolTax = (W + hol) * tw;
  const st = stripeFee(P, region, kase, usdPerGbp);
  const s = region === 'uk' ? S.tax * P : 0;
  const r = IN.reserve * W;
  const margin = P - T - W - hol - toolTax - st.fee - s - r;
  const marginUsd = region === 'us' ? margin : margin * usdPerGbp;
  const pass = marginUsd >= IN.floor.usd && margin >= IN.floor.share * net;
  // A lost dispute: the buyer gets P back, we keep the item cost, the fees and HK$85.
  const disputeCost = (S.disputeHkd / IN.fx.hkdPerUsd) * k + W + hol + toolTax + st.fee + s;
  return { P, T, net, W, toolTax, hol, f: st.fee, s, r, margin, share: margin / net, pass, disputeCost };
}

// Price for a target margin share m of net revenue (P is linear in costs).
function priceFor(p, region, kase, m) {
  const k = region === 'us' ? 1 : 1 / IN.fx.usdPerGbp;
  const W = (p.base + p.ship[region]) * k;
  const st = stripeFee(1, region, kase, IN.fx.usdPerGbp);
  if (region === 'us') {
    const cost = W * (1 + IN.usToolTax) + st.fixed + IN.reserve * W;
    return roundUp(cost / (1 - st.pct - m), region);
  }
  const cost = W + st.fixed + IN.reserve * W;
  return roundUp(cost / ((1 - m) / (1 + IN.ukVat) - st.pct - S.tax), region);
}
function lowestPass(p, region, kase) {
  for (let x = roundUp(1, region); ; x = roundUp(x + 0.01, region)) if (econ(p, region, kase, { price: x }).pass) return x;
}
function roundUp(x, region) {
  const steps = region === 'us' ? [0.99] : [0.49, 0.99];
  for (let n = Math.floor(x); ; n++) for (const c of steps) if (n + c >= x - 1e-9) return +(n + c).toFixed(2);
}

// ---------------------------------------------------------------- output
const cur = r => (r === 'us' ? '$' : '£');
const m2 = (v, r) => (v < 0 ? '-' : '') + cur(r) + Math.abs(v).toFixed(2);
const pc = v => Math.round(v * 100) + '%';
const row = cells => '| ' + cells.join(' | ') + ' |';
const out = [];
const sold = r => IN.products.filter(p => p.price[r] != null && p.ship[r] != null);

out.push(`FX: $1 = HK$${IN.fx.hkdPerUsd}, £1 = $${IN.fx.usdPerGbp}. Case 2 = settled in the charge currency (3.9%), case 3 = converted to HKD (5.9%). Margin before fixed costs and income tax.`, '');

for (const r of ['us', 'uk']) {
  out.push(r === 'us' ? '### USA at current prices (USD, tax-exclusive, no state registered)' : '### UK at current prices (GBP, incl. 20% VAT, VAT-registered)', '');
  const head = r === 'us'
    ? ['Item', 'P', 'W', 'Tax on W', 'Reserve', 'Stripe c2', 'Margin c2', 'Stripe c3', 'Margin c3', 'c3 + holiday', 'Floor c2/c3', 'Dispute = orders (c3)']
    : ['Item', 'P', 'VAT', 'W', 'Stripe Tax', 'Reserve', 'Stripe c2', 'Margin c2', 'Stripe c3', 'Margin c3', 'Floor c2/c3', 'Dispute = orders (c3)'];
  out.push(row(head), row(head.map(() => '---')));
  for (const p of sold(r)) {
    const a = econ(p, r, 2), b = econ(p, r, 3), h = econ(p, r, 3, { holiday: true });
    const fl = (a.pass ? 'pass' : 'FAIL') + ' / ' + (b.pass ? 'pass' : 'FAIL');
    const disp = b.margin < 1 ? 'n/a (almost no margin)' : (b.disputeCost / b.margin).toFixed(1);
    out.push(row(r === 'us'
      ? [p.name, m2(a.P, r), m2(a.W, r), m2(a.toolTax, r), m2(a.r, r), m2(a.f, r), `${m2(a.margin, r)} (${pc(a.share)})`, m2(b.f, r), `${m2(b.margin, r)} (${pc(b.share)})`, `${m2(h.margin, r)} (${pc(h.share)})`, fl, `${m2(b.disputeCost, r)} = ${disp}`]
      : [p.name, m2(a.P, r), m2(a.T, r), m2(a.W, r), m2(a.s, r), m2(a.r, r), m2(a.f, r), `${m2(a.margin, r)} (${pc(a.share)})`, m2(b.f, r), `${m2(b.margin, r)} (${pc(b.share)})`, fl, `${m2(b.disputeCost, r)} = ${disp}`]));
  }
  out.push('');
}

out.push('### Price needed for a 25% / 30% / 35% margin of net revenue (case 2 → case 3)', '');
out.push(row(['Item', 'To', 'Now', '25%', '30%', '35%', 'Floor at the 25% price (c3)', 'Lowest price passing the floor']), row(Array(8).fill('---')));
for (const r of ['us', 'uk']) for (const p of sold(r)) {
  const cells = IN.targets.map(m => {
    const a = priceFor(p, r, 2, m), b = priceFor(p, r, 3, m);
    return a === b ? m2(a, r) : `${m2(a, r)} → ${m2(b, r)}`;
  });
  const p25 = priceFor(p, r, 3, 0.25), e = econ(p, r, 3, { price: p25 });
  const lo = [2, 3].map(kk => m2(lowestPass(p, r, kk), r));
  const loTxt = lo[0] === lo[1] ? lo[0] : lo.join(' → ');
  out.push(row([p.name, r.toUpperCase(), m2(p.price[r], r), ...cells, `${e.pass ? 'pass' : 'FAIL'} (${m2(e.margin, r)})`, loTxt]));
}
out.push('');

out.push('### A monthly fixed cost spread over UK orders (GBP per order)', '');
out.push(row(['Monthly cost', ...IN.ukOrders.map(n => `${n} orders`)]), row(Array(IN.ukOrders.length + 1).fill('---')));
for (const c of IN.fixedMonthlyGbp) out.push(row([`£${c}`, ...IN.ukOrders.map(n => m2(c / n, 'uk'))]));
out.push('');

const sens = sold('uk').map(p => p.name + ' ' + [IN.fx.gbpSens[0], IN.fx.usdPerGbp, IN.fx.gbpSens[1]]
  .map(x => m2(econ(p, 'uk', 3, { usdPerGbp: x }).margin, 'uk')).join(' / ')).join('; ');
out.push(`FX sensitivity, UK margin at current prices, case 3, at £1 = $${IN.fx.gbpSens[0]} / $${IN.fx.usdPerGbp} / $${IN.fx.gbpSens[1]}: ${sens}.`);

const apiTax = S.taxApiHkd / IN.fx.hkdPerUsd / IN.fx.usdPerGbp;
const drops = sold('uk').map(p => apiTax - S.tax * p.price.uk);
out.push('', `If Stripe Tax is billed per API transaction (HK$${S.taxApiHkd.toFixed(2)}, about ${m2(apiTax, 'uk')}) instead of 0.5%, UK margins drop by ${m2(Math.min(...drops), 'uk')} to ${m2(Math.max(...drops), 'uk')} an order.`);

console.log(out.join('\n'));
