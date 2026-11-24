#!/usr/bin/env node
// Merch unit economics with a Hong Kong Stripe account (24 Nov 2026).
// Formula: docs/design/merch/TRANSACTIONS.md section 9, without the fixed cost o:
//   margin = P - T - W*(1 + t_w) - f - s - r
// Prints Markdown tables. No dependencies: `node tools/merch_econ.js`.
// `node tools/merch_econ.js --cart`: carts of several items, shipping fees and free shipping (SHIPPING.md).
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

if (!process.argv.includes('--cart')) {
  console.log(out.join('\n'));
} else {
  console.log(cartReport().join('\n'));
}

// ================================================================ cart (--cart)
// docs/design/merch/SHIPPING.md. Several items per order, item prices in USD + a shipping fee per zone,
// free shipping over a threshold, worldwide. `node tools/merch_econ.js --cart`.
// Every order is charged in USD and settles in USD (case 2: 3.9% + US$0.30, one fixed fee per ORDER).
// With Adaptive Pricing a buyer may pay in their own currency; Stripe says the conversion fee is paid by the buyer.
function cartInputs() {
  return {
    // Printful Standard flat rate, USD, first item / each additional item of the same group,
    // printful.com/shipping read 24 Nov 2026. Mugs and stickers "ship separately", so each group
    // (tees, mugs, stickers) pays its own first-item rate; extras of the same group pay the extra rate.
    ship: {
      us:  { tee: [4.95, 2.20], mug: [6.69, 3.50], stk: [4.49, 0.05] },
      ca:  { tee: [8.59, 1.95], mug: [8.09, 4.70], stk: [5.19, 0.10] },
      uk:  { tee: [4.79, 1.50], mug: [5.19, 1.25], stk: [4.29, 0.10] },
      eu:  { tee: [4.99, 1.45], mug: [5.39, 2.05], stk: [4.29, 0.10] },
      au:  { tee: [7.99, 1.40], mug: [8.69, 3.65], stk: [5.89, 0.10] },
      jp:  { tee: [4.95, 2.00], mug: [4.99, 1.60], stk: [2.99, 0.08] },
      efta: { tee: [10.39, 1.10], mug: [10.79, 1.75], stk: [10.39, 0.05] },
      row: { tee: [12.49, 6.00], mug: [12.49, 6.50], stk: [8.29, 0.25] },
    },
    base: { mug: 6.07, tee: 11.92, stk: 5.15 },
    names: { mug: 'mug', tee: 'tee', stk: 'stickers' },
    // Tax per region. vat: share added on top of net that sits inside P (VAT-inclusive consumer price, seller registered).
    // tw: provider tax on W we cannot reclaim. US 7% placeholder; Japan 10% consumption tax on JP-fulfilled orders [snippet].
    // EU 21% is a rough average of member-state rates. CA, AU, EFTA, rest of world: no tax modelled (SHIPPING.md "Not verified").
    tax: {
      us: { vat: 0, tw: 0.07, stax: false }, ca: { vat: 0, tw: 0, stax: false },
      uk: { vat: 0.20, tw: 0, stax: true }, eu: { vat: 0.21, tw: 0, stax: true },
      au: { vat: 0, tw: 0, stax: false }, jp: { vat: 0, tw: 0.10, stax: false },
      efta: { vat: 0, tw: 0, stax: false }, row: { vat: 0, tw: 0, stax: false },
    },
    regionName: { us: 'USA', ca: 'Canada', uk: 'UK', eu: 'EU', au: 'Australia/NZ', jp: 'Japan', efta: 'Norway/Switzerland', row: 'Rest of world' },
    // Buyer-facing zones: the fee and threshold are set per zone.
    zoneOf: { us: 'z1', uk: 'z2', eu: 'z2', ca: 'z3', au: 'z3', efta: 'z4', row: 'z4', jp: 'z5' },
    zones: { z1: 'USA', z2: 'UK+EU', z3: 'CA+AU+NZ', z4: 'other', z5: 'Japan' },
    models: {
      A: { label: 'A: prices minus old built-in shipping, flat fee, free over $50',
        price: { mug: 14.99, tee: 22.99, stk: 11.99 },
        fee: { z1: 5.99, z2: 5.99, z3: 8.99, z4: 12.99, z5: 5.99 }, free: { z1: 50, z2: 50, z3: 50, z4: 50, z5: 50 } },
      B: { label: 'B: old delivered prices kept, small fee, free over $50',
        price: { mug: 21.99, tee: 27.99, stk: 15.99 },
        fee: { z1: 3.99, z2: 4.99, z3: 6.99, z4: 9.99, z5: 4.99 }, free: { z1: 50, z2: 50, z3: 50, z4: 50, z5: 50 } },
      C: { label: 'C: proposal',
        price: { mug: 19.99, tee: 26.99, stk: 13.99 },
        // Rest of world: +$5.99 for each mug or tee after the first one; sticker sheets add nothing.
        fee: { z1: 4.99, z2: 5.99, z3: 7.99, z4: 11.99, z5: 4.99 }, extra: { z4: 5.99 }, extraKinds: ['mug', 'tee'],
        free: { z1: 35, z2: 70, z3: 70, z4: null, z5: 35 } },
    },
    carts: [['mug'], ['tee'], ['stk'], ['mug', 'tee'], ['tee', 'stk'], ['mug', 'stk'], ['mug', 'tee', 'stk'], ['tee', 'tee'], ['mug', 'mug']],
    // Assumed mix (a guess for planning, not data): share of orders by cart, and of orders by region.
    mix: { 'tee': 0.35, 'mug': 0.20, 'stk': 0.10, 'tee+stk': 0.10, 'mug+tee': 0.08, 'mug+stk': 0.05, 'mug+tee+stk': 0.05, 'tee+tee': 0.05, 'mug+mug': 0.02 },
    regionMix: { us: 0.55, ca: 0.08, uk: 0.10, eu: 0.12, au: 0.05, jp: 0.03, efta: 0.01, row: 0.06 },
    thresholds: [35, 40, 45, 50],
  };
}

function cartShip(C, items, region) {
  const n = { mug: 0, tee: 0, stk: 0 };
  for (const k of items) n[k]++;
  let w = 0;
  for (const k of Object.keys(n)) if (n[k]) w += C.ship[region][k][0] + (n[k] - 1) * C.ship[region][k][1];
  return w;
}

// One order: P = items + fee; margin = P - T - W - hol - provider tax - f - s - r (USD).
function cartEcon(C, items, region, model, opts = {}) {
  const m = C.models[model], z = C.zoneOf[region], tx = C.tax[region];
  const sub = items.reduce((a, k) => a + m.price[k], 0);
  const thr = opts.free !== undefined ? opts.free : m.free[z];
  const free = thr != null && sub >= thr - 1e-9;
  const nx = m.extraKinds ? items.filter(k => m.extraKinds.includes(k)).length : items.length;
  const fee = free ? 0 : m.fee[z] + Math.max(0, nx - 1) * ((m.extra && m.extra[z]) || 0);
  const P = sub + fee;
  const T = P * tx.vat / (1 + tx.vat);
  const ship = cartShip(C, items, region);
  const W = items.reduce((a, k) => a + C.base[k], 0) + ship;
  const hol = region === 'us' && opts.holiday ? IN.usHoliday : 0;
  const toolTax = (W + hol) * tx.tw;
  const f = (S.base + S.intl) * P + S.fixedUsdSettled;
  const s = tx.stax ? S.tax * P : 0;
  const r = IN.reserve * W;
  const margin = P - T - W - hol - toolTax - f - s - r;
  const net = P - T;
  const pass = margin >= IN.floor.usd - 1e-9 && margin >= IN.floor.share * net - 1e-9;
  return { sub, fee, free, P, T, ship, W, margin, net, share: margin / net, pass };
}

// The old model: one delivered price per item, one item per order (each item is its own order). USA only.
function baselineUs(items) {
  const byKey = { mug: IN.products[0], tee: IN.products[1], stk: IN.products[2] };
  let P = 0, margin = 0, net = 0;
  for (const k of items) { const e = econ(byKey[k], 'us', 2); P += e.P; margin += e.margin; net += e.net; }
  return { P, margin, share: margin / net, orders: items.length };
}

// Every cart of 1..4 items.
function allCarts(maxN) {
  const keys = ['mug', 'tee', 'stk'], res = [];
  (function rec(start, cur) {
    if (cur.length) res.push(cur.slice());
    if (cur.length === maxN) return;
    for (let i = start; i < keys.length; i++) { cur.push(keys[i]); rec(i, cur); cur.pop(); }
  })(0, []);
  return res;
}

function cartReport() {
  const C = cartInputs();
  const o = [];
  const $ = v => (v < 0 ? '-$' : '$') + Math.abs(v).toFixed(2);
  const key = items => items.join('+');
  const label = items => ['mug', 'tee', 'stk'].map(k => [k, items.filter(x => x === k).length]).filter(([, n]) => n)
    .map(([k, n]) => (n === 1 ? C.names[k] : n + ' ' + (k === 'stk' ? 'sticker sheets' : C.names[k] + 's'))).join(' + ');
  const regionsShown = ['us', 'ca', 'au', 'uk'];

  o.push('USD. Case 2 (charged and settled in USD, 3.9% + $0.30 per order). Printful Standard first / extra item per group;',
    'mugs and stickers ship as their own parcels. Margin before fixed costs and income tax. Floor: $4 and 20% of net revenue.',
    'UK and EU: VAT inside the price (seller registered). Canada, Australia/NZ, rest of world: no tax modelled. No holiday surcharge.', '');

  o.push('### Price lists', '');
  const zk = Object.keys(C.zones), zl = zk.map(z => C.zones[z]).join(' / ');
  o.push(row(['Model', 'Mug', 'Tee', 'Stickers', 'Fee ' + zl, 'Free over ' + zl]), row(Array(6).fill('---')));
  o.push(row(['Old (baseline)', $(IN.products[0].price.us), $(IN.products[1].price.us), $(IN.products[2].price.us), 'shipping inside the price, USA (and UK in GBP) only', 'one item per order']));
  for (const mk of Object.keys(C.models)) {
    const m = C.models[mk];
    o.push(row([m.label, $(m.price.mug), $(m.price.tee), $(m.price.stk),
      zk.map(z => $(m.fee[z]) + (m.extra && m.extra[z] ? ' +' + $(m.extra[z]) + ' per extra ' + (m.extraKinds ? m.extraKinds.join(' or ') : 'item') : '')).join(' / '),
      zk.map(z => (m.free[z] == null ? 'never' : '$' + m.free[z])).join(' / ')]));
  }
  o.push('');

  for (const r of regionsShown) {
    o.push(`### ${C.regionName[r]}: buyer pays / our margin (share of net)`, '');
    const head = ['Cart', 'Printful shipping'];
    if (r === 'us') head.push('Old (separate orders)');
    head.push('A', 'B', 'C');
    o.push(row(head), row(head.map(() => '---')));
    for (const items of C.carts) {
      const cells = [label(items), $(cartShip(C, items, r))];
      if (r === 'us') { const b = baselineUs(items); cells.push(`${$(b.P)} / ${$(b.margin)} (${pc(b.share)})${b.orders > 1 ? ' in ' + b.orders + ' orders' : ''}`); }
      for (const mk of ['A', 'B', 'C']) {
        const e = cartEcon(C, items, r, mk);
        cells.push(`${$(e.P)}${e.free ? ' free ship' : ''} / ${$(e.margin)} (${pc(e.share)})${e.pass ? '' : ' FAIL'}`);
      }
      o.push(row(cells));
    }
    o.push('');
  }

  // Floor check over every cart of up to 4 items, every region.
  const every = allCarts(4);
  o.push('### Floor check, every cart of 1-4 items (worst margin; FAIL = below $4 or 20%)', '');
  o.push(row(['Region', 'Model', 'Worst single item', 'Worst paid-shipping cart', 'Worst free-shipping cart']), row(Array(5).fill('---')));
  for (const r of Object.keys(C.ship)) for (const mk of ['A', 'B', 'C']) {
    const worst = list => {
      if (!list.length) return 'none';
      let w = null;
      for (const items of list) { const e = cartEcon(C, items, r, mk); if (!w || e.margin - IN.floor.share * e.net < w.e.margin - IN.floor.share * w.e.net) w = { items, e }; }
      return `${label(w.items)} ${$(w.e.margin)} (${pc(w.e.share)})${w.e.pass ? '' : ' FAIL'}`;
    };
    const singles = every.filter(c => c.length === 1);
    const paid = every.filter(c => c.length > 1 && !cartEcon(C, c, r, mk).free);
    const free = every.filter(c => cartEcon(C, c, r, mk).free);
    o.push(row([C.regionName[r], mk, worst(singles), worst(paid), worst(free)]));
  }
  o.push('');

  // Lowest free-shipping threshold that keeps every free cart (1-4 items) above the floor, per region, model C prices.
  o.push('### Model C prices: lowest safe free-shipping threshold, and the fee against our real cost', '');
  o.push(row(['Region', 'Zone', 'Lowest threshold where every free cart passes (with the US holiday surcharge)', 'C threshold', 'C fee / Printful single-item cost (tee, mug, stickers)']), row(Array(5).fill('---')));
  for (const r of Object.keys(C.ship)) {
    let safe = null;
    for (let t = 35; t <= 150 && safe == null; t += 5) {
      if (every.every(items => { const e = cartEcon(C, items, r, 'C', { free: t, holiday: true }); return !e.free || e.pass; })) safe = t;
    }
    const z = C.zoneOf[r], m = C.models.C;
    const ratio = ['tee', 'mug', 'stk'].map(k => (m.fee[z] / C.ship[r][k][0]).toFixed(2) + 'x').join(', ');
    o.push(row([C.regionName[r], C.zones[z], safe == null ? 'none up to $150' : '$' + safe, m.free[z] == null ? 'never free' : '$' + m.free[z], ratio]));
  }
  o.push('');

  // Threshold test for model C in the USA.
  o.push('### Model C prices, USA: free-shipping threshold test', '');
  o.push(row(['Threshold', 'Carts (of the 9) shipping free', 'Worst free-shipping cart (1-4 items)', 'Expected margin per order (assumed mix)']), row(Array(4).fill('---')));
  for (const t of C.thresholds) {
    const freeN = C.carts.filter(c => cartEcon(C, c, 'us', 'C', { free: t }).free).length;
    let w = null;
    for (const items of every) { const e = cartEcon(C, items, 'us', 'C', { free: t }); if (e.free && (!w || e.margin - 0.2 * e.net < w.e.margin - 0.2 * w.e.net)) w = { items, e }; }
    let exp = 0;
    for (const items of C.carts) exp += C.mix[key(items)] * cartEcon(C, items, 'us', 'C', { free: t }).margin;
    o.push(row(['$' + t, String(freeN), w ? `${label(w.items)} ${$(w.e.margin)} (${pc(w.e.share)})${w.e.pass ? '' : ' FAIL'}` : 'none', $(exp)]));
  }
  o.push('');

  // Expected margin per order under the assumed mix.
  const mixTxt = Object.entries(C.mix).map(([k, v]) => `${k.replace(/stk/g, 'stickers')} ${Math.round(v * 100)}%`).join(', ');
  const regTxt = Object.entries(C.regionMix).map(([k, v]) => `${C.regionName[k]} ${Math.round(v * 100)}%`).join(', ');
  const expUs = mk => C.carts.reduce((a, c) => a + C.mix[key(c)] * cartEcon(C, c, 'us', mk).margin, 0);
  const expWorld = mk => Object.entries(C.regionMix).reduce((a, [r, w]) => a + w * C.carts.reduce((b, c) => b + C.mix[key(c)] * cartEcon(C, c, r, mk).margin, 0), 0);
  const basePerCart = C.carts.reduce((a, c) => a + C.mix[key(c)] * baselineUs(c).margin, 0);
  const basePaid = C.carts.reduce((a, c) => a + C.mix[key(c)] * baselineUs(c).P, 0);
  const paidUs = mk => C.carts.reduce((a, c) => a + C.mix[key(c)] * cartEcon(C, c, 'us', mk).P, 0);
  o.push('### Expected margin per order (assumed mix)', '', `Cart mix: ${mixTxt}. Region mix (world): ${regTxt}.`, '');
  o.push(row(['Model', 'USA: buyer pays on average', 'USA: margin per order', 'World mix: margin per order']), row(Array(4).fill('---')));
  o.push(row(['Old (baseline, each item its own order)', $(basePaid), $(basePerCart), 'n/a (USA and UK only)']));
  for (const mk of ['A', 'B', 'C']) o.push(row([mk, $(paidUs(mk)), $(expUs(mk)), $(expWorld(mk))]));
  o.push('');

  const hol = C.carts.map(c => cartEcon(C, c, 'us', 'C').margin - cartEcon(C, c, 'us', 'C', { holiday: true }).margin);
  const holFail = every.filter(c => cartEcon(C, c, 'us', 'C').pass && !cartEcon(C, c, 'us', 'C', { holiday: true }).pass).map(label);
  o.push(`US holiday surcharge ($${IN.usHoliday.toFixed(2)} per order to 17 Jan 2027): model C US margins drop by ${$(Math.min(...hol))}-${$(Math.max(...hol))}; carts that then fail: ${holFail.length ? holFail.join(', ') : 'none'}.`);
  return o;
}
