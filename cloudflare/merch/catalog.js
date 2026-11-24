// The merch price list (TRANSACTIONS.md 3, SHIPPING.md model C). Changed only by a reviewed PR. US cents. The browser never sends a price.
// buildCatalog(PawPrint) -> the full catalog (the tee colours and sizes come from PawPrint.TEE_COLOURS, so the page and the print agree),
// with cat_ver = a hash of all of it.
import { fnv } from './util.js';

// Printful wholesale costs (USD cents, S-XL, front print) are estimates until the nightly job writes merch_variants (ECONOMICS.md inputs, 24 Nov 2026).
// 2XL and up: Printful's extra [not verified: re-read in part 5]; the price adds it rounded up to a dollar (TRANSACTIONS 3).
const TEE_SIZE_COST = { '2XL': 150, '3XL': 350, '4XL': 550, '5XL': 750 };
const TEE_SIZE_PRICE = { '2XL': 200, '3XL': 400, '4XL': 600, '5XL': 800 };

export const PRODUCTS = {
  mug: { id: 'mug', launch: true, price: 1999, cost: 607, group: 'mug', tax_code: 'txcd_99999999', label: 'Mug with your dog', sized: false, poses: ['stand', 'sit', 'happy'] },
  tee: { id: 'tee', launch: true, price: 2699, cost: 1192, group: 'tee', tax_code: 'txcd_30011000', label: 'Tee with your dog', sized: true, size_price: TEE_SIZE_PRICE, size_cost: TEE_SIZE_COST, poses: ['stand', 'sit', 'happy'] },
  // off at launch (owner, 24 Nov 2026): kept in the table, never offered (launch: false here and in PawPrint.PRODUCTS)
  stickers: { id: 'stickers', launch: false, price: 1399, cost: 515, group: 'stk', tax_code: 'txcd_99999999', label: 'Stickers with your dog', sized: false, poses: ['stand'] }
};

export const EU27 = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'];
// Stripe Checkout's shipping countries (docs.stripe.com/api/checkout/sessions/create, read in COUNTRIES.md 2) without ZZ and the few it does not take.
// [not verified at build: compare with Stripe's own list before launch]
const STRIPE_COUNTRIES = ('AC AD AE AF AG AI AL AM AO AQ AR AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CD CF CG CH CI CK CL CM CN CO CR CV CW CY CZ ' +
  'DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HN HR HT HU ID IE IL IM IN IO IQ IS IT JE JM JO JP ' +
  'KE KG KH KI KM KN KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MK ML MM MN MO MQ MR MS MT MU MV MW MX MY MZ NA NC NE NG NI NL NO NP NR NU NZ OM ' +
  'PA PE PF PG PH PK PL PM PN PR PS PT PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SZ TA TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ ' +
  'UA UG US UY UZ VA VC VE VG VN VU WF WS XK YE YT ZA ZM ZW').split(' ');
// never (COUNTRIES.md tier 4: sanctions, Printful, Stripe; Ukraine closed because Checkout cannot leave out a region)
export const NEVER = ['RU', 'BY', 'EC', 'VE', 'PS', 'UA', 'CU', 'IR', 'SY', 'KP'];

// zones (TRANSACTIONS 3, model C). eta: business days from payment to the door (making 2-5 + delivery) [estimates; not verified for JP, AU, NZ]
export const ZONES = {
  us_jp: { id: 'us_jp', fee: 499, free_from: 3500, extra: 0, eta: [5, 9], notes: [] },
  uk_eu: { id: 'uk_eu', fee: 599, free_from: 7000, extra: 0, eta: [5, 25], notes: [], vat_note: 'Prices include VAT.' },
  ca_au_nz: { id: 'ca_au_nz', fee: 799, free_from: 7000, extra: 0, eta: [5, 14], notes: [] },
  world: { id: 'world', fee: 1199, free_from: null, extra: 599, eta: [7, 25], notes: ['Your country may charge import tax or a fee when it arrives.'] }
};
const ZONE_OF = Object.assign({ US: 'us_jp', JP: 'us_jp', GB: 'uk_eu', CA: 'ca_au_nz', AU: 'ca_au_nz', NZ: 'ca_au_nz' }, Object.fromEntries(EU27.map((c) => [c, 'uk_eu'])));
export const zoneOf = (c) => ZONE_OF[c] || 'world';
// cost regions (Printful's shipping table, merch_econ.js cartInputs): which Printful rate and tax applies
const EFTA = ['NO', 'CH', 'IS', 'LI'];
export const regionOf = (c) => (c === 'US' ? 'us' : c === 'CA' ? 'ca' : c === 'GB' ? 'uk' : EU27.includes(c) ? 'eu' : c === 'AU' || c === 'NZ' ? 'au' : c === 'JP' ? 'jp' : EFTA.includes(c) ? 'efta' : 'row');
export const ALL_COUNTRIES = STRIPE_COUNTRIES.filter((c) => !NEVER.includes(c));

// Printful Standard flat rates, US cents, [first, each extra] per product group (SHIPPING.md 1, read 24 Nov 2026). The nightly job may overwrite
// them in merch_ship_costs.
export const SHIP_COSTS = {
  us: { tee: [495, 220], mug: [669, 350], stk: [449, 5] }, ca: { tee: [859, 195], mug: [809, 470], stk: [519, 10] },
  uk: { tee: [479, 150], mug: [519, 125], stk: [429, 10] }, eu: { tee: [499, 145], mug: [539, 205], stk: [429, 10] },
  au: { tee: [799, 140], mug: [869, 365], stk: [589, 10] }, jp: { tee: [495, 200], mug: [499, 160], stk: [299, 8] },
  efta: { tee: [1039, 110], mug: [1079, 175], stk: [1039, 5] }, row: { tee: [1249, 600], mug: [1249, 650], stk: [829, 25] }
};
// tax Printful charges us that we cannot reclaim (US ~7% placeholder, JP 10%: merch_econ.js); VAT we remit inside the price only where registered
export const TOOL_TAX = { us: 0.07, jp: 0.10 };
export const REGISTERED = {}; // e.g. { uk: 0.20 } once a registration is live in Stripe Tax (TRANSACTIONS 1.1). Empty at launch.
// the US holiday surcharge: $0.40 a US order, 15 Oct 2026 to 17 Jan 2027 (SHIPPING.md 1)
export const HOLIDAY = { cents: 40, from: Date.UTC(2026, 9, 15, 7), to: Date.UTC(2027, 0, 18, 8), countries: ['US'] };
export const FEES = { share: 0.039, fixed: 30, reserve: 0.05, floor: 400, floor_share: 0.20 }; // Stripe HK, USD settled (ECONOMICS case 2); the floor
export const LIMITS = { max_lines: 6, max_qty: 3 };

const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'];
export function buildCatalog(PP) {
  const tee = PP.PRODUCTS.tee, mug = PP.PRODUCTS.mug;
  // tee colours: PawPrint's list, with the sizes made in BOTH the US and the UK (safe for every facility; contract question in PART3.md)
  const teeColours = tee.colours.map((c) => ({ id: c.id, name: c.name, hex: c.hex, sizes: SIZES.filter((s) => c.sizes.both.includes(s)) }));
  const products = {
    mug: Object.assign({}, PRODUCTS.mug, { colours: mug.colours.map((c) => ({ id: c.id, name: c.name, hex: c.hex, sizes: [] })), launch: PRODUCTS.mug.launch && !!mug.launch }),
    tee: Object.assign({}, PRODUCTS.tee, { colours: teeColours, launch: PRODUCTS.tee.launch && !!tee.launch }),
    stickers: Object.assign({}, PRODUCTS.stickers, { colours: [], launch: false })
  };
  const cat = { products, zones: ZONES, ship: SHIP_COSTS, holiday: HOLIDAY, fees: FEES, never: NEVER, limits: LIMITS };
  cat.cat_ver = 'c-' + fnv(JSON.stringify(cat));
  return cat;
}
// one variant's id, unit price and cost estimate
export const variantId = (p, colour, size) => p + ':' + colour + (size ? ':' + size : '');
export function unitPrice(P, size) { return P.price + ((P.size_price && P.size_price[size]) || 0); }
export function unitCost(P, size) { return P.cost + ((P.size_cost && P.size_cost[size]) || 0); }
// the Printful variant (part 5 maps it to Printful's catalog variant id; null until then)
export const providerVariant = (p, colour, size) => 'pf:' + variantId(p, colour, size);
