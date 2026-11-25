// The basket: switches, countries, the check of every line (PawPrint decodes the recipe; merch/names.js through PawPrint.nameOk), prices from
// catalog.js and the margin guard on the whole order (TRANSACTIONS.md 2, 3, 6.4). Pure functions: no storage, no outside calls.
import { ZONES, ALL_COUNTRIES, NEVER, zoneOf, regionOf, TOOL_TAX, REGISTERED, HOLIDAY, FEES, LIMITS, variantId, unitPrice, unitCost, providerVariant, EU27 } from './catalog.js';

// MERCH_COUNTRIES: '' = none; 'all'; a list 'US,CA,AU'; or 'all,-GB,-FR'; a zone id stands for its countries ('all,-uk_eu'). The never list always wins.
export function openCountries(env) {
  const raw = String((env && env.MERCH_COUNTRIES) || '').replace(/\s+/g, '');
  const out = new Set(); if (!raw) return out;
  const expand = (t) => (t === 'all' ? ALL_COUNTRIES : ZONES[t] ? ALL_COUNTRIES.filter((c) => zoneOf(c) === t) : t === 'eu' ? EU27 : [t.toUpperCase()]);
  for (const tok of raw.split(',').filter(Boolean)) {
    const neg = tok[0] === '-', t = neg ? tok.slice(1) : tok;
    for (const c of expand(t)) { if (neg) out.delete(c); else if (ALL_COUNTRIES.includes(c)) out.add(c); }
  }
  for (const c of NEVER) out.delete(c);
  return out;
}
export const productsOn = (env) => new Set(String((env && env.MERCH_PRODUCTS != null && env.MERCH_PRODUCTS !== '') ? env.MERCH_PRODUCTS : 'mug,tee').split(',').map((s) => s.trim()).filter(Boolean));
// MERCH_FROM: empty or in the future = shut (T2.2-02)
export function fromOpen(env, now) {
  const f = String((env && env.MERCH_FROM) || '').trim(); if (!f) return false;
  const t = Date.parse(f); return Number.isFinite(t) && now >= t;
}

const bad = (status, error, more) => ({ err: { status, body: Object.assign({ error }, more || {}) } });

// body {country, lines[]} -> { err } or { country, zone, region, lines, units, groups }. variantOff(id) -> true when the nightly job turned it off.
export function checkBasket(PP, cat, env, body, variantOff) {
  if (!body || typeof body !== 'object') return bad(400, 'bad_line', { line: 0, why: 'empty' });
  const country = body.country;
  if (typeof country !== 'string' || !/^[A-Z]{2}$/.test(country) || !(ALL_COUNTRIES.includes(country) || NEVER.includes(country))) return bad(400, 'bad_country');
  if (!openCountries(env).has(country)) return bad(403, 'country_closed');
  const input = body.lines;
  if (!Array.isArray(input) || !input.length) return bad(400, 'bad_line', { line: 0, why: 'empty' });
  if (input.length > 30) return bad(400, 'too_many');
  const on = productsOn(env), seen = new Map(), out = [];
  for (let i = 0; i < input.length; i++) {
    const L = input[i], n = i + 1;
    if (!L || typeof L !== 'object') return bad(400, 'bad_line', { line: n, why: 'line' });
    const P = cat.products[L.product], PPP = PP.PRODUCTS[L.product];
    // stickers (and anything not on sale) are refused here, whatever MERCH_PRODUCTS says: launch must be true in catalog.js and PawPrint.PRODUCTS
    if (typeof L.product !== 'string' || !P || !P.launch || !PPP || !PPP.launch || !on.has(L.product)) return bad(400, 'bad_line', { line: n, why: 'product' });
    const d = typeof L.recipe === 'string' ? PP.merchDecode(L.recipe) : { ok: false };
    if (!d.ok || d.dogs.length !== 1) return bad(400, 'bad_line', { line: n, why: 'recipe' });
    const dog = d.dogs[0];
    const colour = L.colour == null && P.colours.length === 1 ? P.colours[0].id : L.colour;
    const C = P.colours.find((c) => c.id === colour);
    if (!C || !PPP.colours.some((c) => c.id === colour)) return bad(400, 'bad_line', { line: n, why: 'colour' });
    const size = P.sized ? L.size : (L.size == null || L.size === '' ? null : L.size);
    if (P.sized ? !(typeof size === 'string' && C.sizes.includes(size)) : size !== null) return bad(400, 'bad_line', { line: n, why: 'size' });
    if (typeof L.pose !== 'string' || !P.poses.includes(L.pose) || !PPP.poses.includes(L.pose)) return bad(400, 'bad_line', { line: n, why: 'pose' });
    const nameOn = L.name_on === true || L.name_on === 1;
    let name = null;
    if (nameOn) {
      const r = PP.nameOk(dog.n || '', { product: L.product });
      if (!r.ok) return bad(400, 'bad_name', { line: n, why: r.why, say: r.say || 'Let’s try another name', max: r.max });
      name = r.name;
    }
    if (!Number.isInteger(L.qty) || L.qty < 1 || L.qty > LIMITS.max_qty) return bad(400, 'bad_qty', { line: n });
    const vid = variantId(L.product, colour, size);
    if (variantOff && variantOff(vid)) return bad(409, 'variant_off', { line: n });
    const recipe = PP.merchEncode(dog); // the canonical one-dog recipe (what is stored and printed)
    let link = PP.printHash(dog, { product: L.product, colour, pose: L.pose, name: nameOn });
    const key = [recipe, L.product, colour, size, L.pose, nameOn ? 1 : 0].join('|');
    if (seen.has(key)) { const m = seen.get(key); m.qty += L.qty; if (m.qty > LIMITS.max_qty) return bad(400, 'bad_qty', { line: m.line }); continue; } // identical lines merge first
    const rec = { line: out.length + 1, input: n, product: L.product, colour, size, pose: L.pose, name_on: nameOn ? 1 : 0, name, qty: L.qty, recipe, print_link: link, variant: vid,
      provider_variant: providerVariant(L.product, colour, size), unit: unitPrice(P, size), unit_cost: unitCost(P, size), group: P.group, label: P.label, colour_name: C.name };
    seen.set(key, rec); out.push(rec);
  }
  if (out.length > LIMITS.max_lines) return bad(400, 'too_many');
  for (const r of out) { r.line_total = r.unit * r.qty; r.cost_est = r.unit_cost * r.qty; }
  return { country, zone: zoneOf(country), region: regionOf(country), lines: out };
}
// the print link with this line's art version (the folder /merch/print/<art_ver>/ checks av against its own build)
export const withArtVer = (link, av) => link.replace(/&av=[A-Za-z0-9_-]+$/, '&av=' + av);

// prices: subtotal, the zone's fee (0 at or over free_from), 'world' + $5.99 for each mug or tee after the first
export function priceBasket(zoneId, lines) {
  const Z = ZONES[zoneId], subtotal = lines.reduce((a, l) => a + l.line_total, 0), units = lines.reduce((a, l) => a + l.qty, 0);
  const free = Z.free_from != null && subtotal >= Z.free_from;
  const extra = free ? 0 : Z.extra * Math.max(0, units - 1), fee = free ? 0 : Z.fee + extra;
  return { subtotal, ship_fee: fee, ship_extra: extra, total: subtotal + fee, free, units, free_from: Z.free_from, eta: Z.eta.slice() }; // eta: [min, max] business days
}
// The margin of an order (TRANSACTIONS 3.3, as tools/merch_econ.js cartEcon computes it, so SHIPPING.md's numbers hold to the cent):
// W = wholesale + Printful's shipping (each product group its own first-item rate); margin = P - T - W - h - tool tax (W + h) - Stripe fee - reserve (5% of W).
// P = subtotal + our fee; T = VAT inside the price, only where registered (or the real tax inside the price after payment: T2.2-56).
// costs (optional, from the nightly job): { unit: (variant) -> cents, ship: (region, group) -> [first, extra] }
export function marginOf(cat, country, lines, sub, fee, now, costs, taxInside) {
  const region = regionOf(country), units = {};
  let W = 0;
  for (const l of lines) { const q = l.qty - (l.refunded_qty || 0); if (q <= 0) continue; W += ((costs && costs.unit && costs.unit(l.variant)) || l.unit_cost || l.cost_est / l.qty) * q; units[l.group] = (units[l.group] || 0) + q; }
  let ship = 0;
  for (const g of Object.keys(units)) { const r = (costs && costs.ship && costs.ship(region, g)) || cat.ship[region][g]; ship += r[0] + (units[g] - 1) * r[1]; }
  W += ship;
  const P = sub + fee, vat = REGISTERED[region] || 0;
  const T = taxInside != null ? taxInside : (vat ? P * vat / (1 + vat) : 0);
  const hol = HOLIDAY.countries.includes(country) && now >= HOLIDAY.from && now < HOLIDAY.to ? HOLIDAY.cents : 0;
  const tool = (W + hol) * (TOOL_TAX[region] || 0);
  const f = FEES.share * P + FEES.fixed, s = vat ? 0.005 * P : 0, r = FEES.reserve * W;
  const margin = P - T - W - hol - tool - f - s - r, net = P - T;
  return { margin, net, W: Math.round(W), ship, pass: margin >= FEES.floor - 1e-9 && margin >= FEES.floor_share * net - 1e-9 };
}
// the quote the page shows (also inside 409 price_changed)
// a zone's note codes for the catalog: vat_included only while one of its regions is registered (TRANSACTIONS 1.1)
export const zoneNotes = (Z) => (Z.vat_note && (REGISTERED.uk || REGISTERED.eu) ? ['vat_included'] : []).concat(Z.notes);
export function quoteOut(cat, b, pr) {
  const Z = ZONES[b.zone], notes = Z.notes.slice();
  if (Z.vat_note && REGISTERED[b.region]) notes.unshift('vat_included');
  if (new Set(b.lines.map((l) => l.group)).size > 1) notes.push('separate_parcels');
  return { cat_ver: cat.cat_ver, country: b.country, zone: b.zone, lines: b.lines.map((l) => ({ line: l.line, product: l.product, colour: l.colour, size: l.size, pose: l.pose, name_on: !!l.name_on, unit: l.unit, qty: l.qty, total: l.line_total })),
    subtotal: pr.subtotal, ship_fee: pr.ship_fee, free_from: pr.free_from, total: pr.total, eta: pr.eta, notes };
}
// tax_behavior per country (TRANSACTIONS 3: exclusive for US and CA, inclusive elsewhere)
export const taxBehavior = (country) => (country === 'US' || country === 'CA' ? 'exclusive' : 'inclusive');
