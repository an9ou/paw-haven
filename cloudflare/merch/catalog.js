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
// places with no postal delivery (PART2.md: never listed): Ascension, Antarctica, Bouvet Island, South Georgia, the British Indian Ocean
// Territory, Tristan da Cunha, the French Southern Territories (part 6 review batch, 25 Nov 2026: the Worker leaves them out too)
export const NO_POST = ['AC', 'AQ', 'BV', 'GS', 'IO', 'TA', 'TF'];

// The posting promise (one sentence everywhere: the shop page, the legal pages, the emails; MERCH decision 25 Nov 2026, part 6 review "the
// delay plan"): every order is posted within SHIP_BY_DAYS working days of payment. ship_by = addBusinessDays(paid, SHIP_BY_DAYS) (util.js).
export const SHIP_BY_DAYS = 7;
// If a part is not posted by ship_by, the delay email gives a definite new date: late_eta = ship_by + LATE_MORE_DAYS working days (never more
// than LATE_MAX_DAYS calendar days after ship_by). Part 5 may use the printer's own date instead, under the same cap.
export const LATE_MORE_DAYS = 7;
export const LATE_MAX_DAYS = 30;
// Making takes 2-5 working days at the printer (Printful: "Fulfilment takes 2-5 business days", PROVIDERS.md 1.1, SHIPPING.md 1).
export const MAKE_DAYS = [2, 5];

// zones (TRANSACTIONS 3, model C). eta: working days from payment to the door, the ONE source of every delivery time (the Stripe delivery
// estimate, the quote, the page, the emails, the legal pages): [2 + the fastest post, SHIP_BY_DAYS + the slowest post].
// The post times are estimates [verify with the printer's key, part 5]:
//   us_jp     US 3-4 working days (PROVIDERS.md 1.1, SHIPPING.md 1 [fetched]); Japan assumed made in Japan and posted within the same days
//             [not verified: where Japanese orders are printed] -> [2 + 3, 7 + 4] = [5, 11]
//   ca_au_nz  Canada 2-4 (COUNTRIES.md 1: 2 days Ontario, 4 most provinces [fetched]); Australia and New Zealand made in Australia, up to 9 in
//             the region (Printful's regional figure "about 5-9 business days", PROVIDERS.md 1.1 [snippet]) -> [2 + 2, 7 + 9] = [4, 16]
//   uk_eu     UK about 2 (PROVIDERS.md 1.1 [snippet]); the EU up to Printful's international 20 until its EU facilities are known
//             -> [2 + 2, 7 + 20] = [4, 27] (shut at launch: LAUNCH_SOON)
//   world     Printful's international 5-20 (PROVIDERS.md 1.1, SHIPPING.md 1 [fetched]) -> [2 + 5, 7 + 20] = [7, 27]
// tools/merch_catalog_json.js writes site/merch/catalog.json (the page's stand-in catalog) from this file; the legal pages' suite reads it too.
export const ZONES = {
// notes are short codes the page turns into words (TRANSACTIONS 6.3, note of 24 Nov 2026): import_tax, vat_included, separate_parcels
  us_jp: { id: 'us_jp', fee: 499, free_from: 3500, extra: 0, eta: [5, 11], notes: [] },
  uk_eu: { id: 'uk_eu', fee: 599, free_from: 7000, extra: 0, eta: [4, 27], notes: [], vat_note: true }, // vat_included only while registered
  ca_au_nz: { id: 'ca_au_nz', fee: 799, free_from: 7000, extra: 0, eta: [4, 16], notes: [] },
  world: { id: 'world', fee: 1199, free_from: null, extra: 599, eta: [7, 27], notes: ['import_tax'] }
};
const ZONE_OF = Object.assign({ US: 'us_jp', JP: 'us_jp', GB: 'uk_eu', CA: 'ca_au_nz', AU: 'ca_au_nz', NZ: 'ca_au_nz' }, Object.fromEntries(EU27.map((c) => [c, 'uk_eu'])));
export const zoneOf = (c) => ZONE_OF[c] || 'world';
// cost regions (Printful's shipping table, merch_econ.js cartInputs): which Printful rate and tax applies
const EFTA = ['NO', 'CH', 'IS', 'LI'];
export const regionOf = (c) => (c === 'US' ? 'us' : c === 'CA' ? 'ca' : c === 'GB' ? 'uk' : EU27.includes(c) ? 'eu' : c === 'AU' || c === 'NZ' ? 'au' : c === 'JP' ? 'jp' : EFTA.includes(c) ? 'efta' : 'row');
export const ALL_COUNTRIES = STRIPE_COUNTRIES.filter((c) => !NEVER.includes(c) && !NO_POST.includes(c));
// The launch plan's shut countries (TRANSACTIONS 10 point 1, PART2.md "Shut countries"): the UK with the Isle of Man, the EU 27 with Monaco and
// France's overseas departments and Saint Martin, Brazil and South Korea. This is the RECOMMENDED launch value of the countries switch, written
// here so the page's stand-in catalog and the legal pages follow one list; it changes nothing in the Worker: MERCH_COUNTRIES still decides
// (set it to LAUNCH_COUNTRIES at launch). Note: zoneOf() puts IM, MC, GF, GP, MQ, RE, YT and MF in 'world', so 'all,-uk_eu' alone opens them.
export const LAUNCH_SOON = ['GB', 'IM'].concat(EU27, ['MC', 'GF', 'GP', 'MQ', 'RE', 'YT', 'MF', 'BR', 'KR']);
export const LAUNCH_COUNTRIES = 'all,' + LAUNCH_SOON.map((c) => '-' + c).join(',');

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

export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL']; // smallest first, everywhere sizes are listed
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
// the Printful variant as a line stores it ('pf:<our variant id>'); provider_printful.js turns it into Printful's catalog variant id below
export const providerVariant = (p, colour, size) => 'pf:' + variantId(p, colour, size);
// Printful's catalog variant ids for what we offer (part 5): read from the public catalog without a key, api.printful.com/products/19 and
// /products/71 (25 Nov 2026; recorded in test/printful/catalog_v1_product_*.json, colour codes equal ours). The v2 API takes the same ids as
// catalog_variant_id (its docs' tee example uses 4011, which is 3001 White / S here). Mug: White Glossy Mug 11 oz; tee: Bella+Canvas 3001.
// Only the sizes made in both the US and the UK (buildCatalog). A variant missing here is never sent to Printful (the adapter refuses the line).
export const PF_PRODUCTS = { mug: 19, tee: 71 };
export const PF_VARIANT_IDS = {
  'mug:white': 1320,
  'tee:white:S': 4011, 'tee:white:M': 4012, 'tee:white:L': 4013, 'tee:white:XL': 4014, 'tee:white:2XL': 4015, 'tee:white:3XL': 5294, 'tee:white:4XL': 5309,
  'tee:soft-cream:S': 4151, 'tee:soft-cream:M': 4152, 'tee:soft-cream:L': 4153, 'tee:soft-cream:XL': 4154, 'tee:soft-cream:2XL': 4155,
  'tee:athletic-heather:S': 6948, 'tee:athletic-heather:M': 6949, 'tee:athletic-heather:L': 6950, 'tee:athletic-heather:XL': 6951, 'tee:athletic-heather:2XL': 6952,
  'tee:pink:S': 4136, 'tee:pink:M': 4137, 'tee:pink:L': 4138, 'tee:pink:XL': 4139, 'tee:pink:2XL': 4140,
  'tee:ice-blue:XS': 9576, 'tee:ice-blue:S': 9360, 'tee:ice-blue:M': 9361, 'tee:ice-blue:L': 9362, 'tee:ice-blue:XL': 9363, 'tee:ice-blue:2XL': 9364,
  'tee:navy:XS': 9546, 'tee:navy:S': 4111, 'tee:navy:M': 4112, 'tee:navy:L': 4113, 'tee:navy:XL': 4114, 'tee:navy:2XL': 4115,
  'tee:black:XS': 9527, 'tee:black:S': 4016, 'tee:black:M': 4017, 'tee:black:L': 4018, 'tee:black:XL': 4019, 'tee:black:2XL': 4020, 'tee:black:3XL': 5295, 'tee:black:4XL': 5310
};
