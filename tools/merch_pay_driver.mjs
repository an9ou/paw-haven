#!/usr/bin/env node
// The Stripe TEST pay page driver for the merch sandbox run (docs/design/merch/SANDBOX.md part D, "Who taps Pay").
// It fills Stripe Checkout's hosted page (https://checkout.stripe.com/...) with a made-up buyer and one of Stripe's published TEST card numbers,
// taps Pay, answers the test 3-D Secure page (complete or fail) and says what happened. It can never pay a real order:
//   - it opens only https://checkout.stripe.com/ pages whose session id is a test one (cs_test_...); a cs_live_ session is refused;
//   - the page must show Stripe's own test badge ("Test mode" or "Sandbox") before anything is typed, or it stops (`not_test_mode`);
//   - the card must be one of the TEST_CARDS below (Stripe's test numbers used in part D); any other number is refused before a browser opens.
// No key, no account: it only types into the page the order server already opened.
//
// HOW TO USE
//   NODE_PATH=$(npm root -g) node tools/merch_pay_driver.mjs --url 'https://checkout.stripe.com/c/pay/cs_test_...' \
//     --email 'you+location_US@example.com' --name 'Test Buyer' --line1 '1 Test Street' --city 'Springfield' --state 'IL' \
//     --postal '62701' --country US [--phone ...] [--line2 ...] [--card 4000002500003155] [--exp 12/34] [--cvc 123] \
//     [--3ds complete|fail] [--shots <dir>] [--headed]
//   Prints one JSON line: { status: 'paid' | 'declined' | 'needs_human' | 'error', url?, message?, code?, screenshot?, seconds }.
//   Exit code: 0 paid, 2 declined, 3 needs_human, 1 error. The shipping NAME picks the stand-in printer's case in run 1 (part D6:
//   "Test Refuse Address", "Test Refuse Tee", ...), so pass it with --name. A screenshot is saved for anything but `paid`
//   (default folder: <os tmp>/dd-merch-pay-shots, outside the repo).
//   From code: import { payStripeCheckout } from './merch_pay_driver.mjs'; await payStripeCheckout(url, buyer, card, opts).
//   Playwright and Chromium come from the session (NODE_PATH=$(npm root -g)); never `playwright install`.
//
// THE WHOLE TRIP ON OUR TEST SHOP (shopTrip below) is WRITTEN BUT NOT RUN YET: nothing of ours is deployed. Before its first use:
//   TODO 1. Read the test password cookie (dd_test, tools/test_gate.mjs) from a logged-in browser, or add a login step with the password
//           from the session's secure store; never put the password or the cookie in the repo or in chat.
//   TODO 2. Confirm the basket line shape the page keeps under localStorage 'dd_merch_basket_v1' (merch.js storeLine/cleanBasket): the trip
//           seeds it as given; a line the page drops ("can't be made any more") shows as an empty basket and the trip stops (`empty_basket`).
//   TODO 3. Confirm the test page fetches /merch/test_cfg.json with the cookie (Pay then carries X-Merch-Test-Token), and that Pay goes to
//           checkout.stripe.com within the step time on the real test Worker.
//   TODO 4. Run S-6 once by hand next to it and compare.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

// Stripe's test card numbers (docs.stripe.com/testing) used in SANDBOX part D. Nothing else is ever typed.
export const TEST_CARDS = Object.freeze({
  '4242424242424242': 'succeeds (Visa)',
  '4000000000000002': 'declined (generic)',
  '4000002500003155': '3-D Secure required',
  '4000000000004954': 'Radar: highest risk, blocked',
  '4000000000005126': 'succeeds; a refund fails later',
  '4000000000000259': 'succeeds; disputed (fraudulent)',
  '4000000000001976': 'succeeds; inquiry',
});
export const STRIPE_ORIGIN = 'https://checkout.stripe.com';
const T = { load: 30000, field: 10000, submit: 90000, challenge: 30000 };
const TEST_BADGE = /^\s*(test mode|sandbox|test)\s*$/i;
const DECLINE = /declin|insufficient|blocked|fraud|unable to authenticate|authentication (failed|was not)|not supported|incorrect|expired|could ?n.t be (processed|charged)|try (again|another)/i;
const HUMAN = /unusual activity|verify (that )?you.?re (a )?human|are you a robot|complete the (security )?check|captcha/i;
const SUCCESS_TEXT = /thanks for your (payment|order)|payment (successful|complete|succeeded)|thank you for your (payment|order)/i;

const cleanCard = (n) => String(n || '').replace(/[\s-]/g, '');
export function checkCard(card) {
  const n = cleanCard(card && card.number);
  if (!Object.prototype.hasOwnProperty.call(TEST_CARDS, n)) return { ok: false, code: 'refused_card', message: 'not one of Stripe\'s test card numbers this tool allows' };
  const exp = String((card && card.exp) || '12/34');
  if (!/^(0[1-9]|1[0-2]) ?\/ ?\d{2}$/.test(exp)) return { ok: false, code: 'bad_card', message: 'expiry must be MM/YY' };
  const cvc = String((card && card.cvc) || '123');
  if (!/^\d{3,4}$/.test(cvc)) return { ok: false, code: 'bad_card', message: 'cvc must be 3 or 4 digits' };
  return { ok: true, number: n, exp: exp.replace(/\s/g, ''), cvc };
}
// only Stripe's hosted pay page, only a test session. allowLocalTest lets the offline test serve its stand-in page on http://127.0.0.1.
export function checkUrl(url, opts = {}) {
  let u; try { u = new URL(String(url)); } catch { return { ok: false, code: 'refused_origin', message: 'not a URL' }; }
  const local = opts.allowLocalTest === true && u.protocol === 'http:' && u.hostname === '127.0.0.1';
  if (u.origin !== STRIPE_ORIGIN && !local) return { ok: false, code: 'refused_origin', message: 'only ' + STRIPE_ORIGIN + '/ pages are opened, not ' + u.origin };
  if (/cs_live_/.test(u.pathname + u.search + u.hash)) return { ok: false, code: 'refused_live', message: 'a live Checkout Session (cs_live_)' };
  if (!/cs_test_/.test(u.pathname + u.search + u.hash)) return { ok: false, code: 'refused_live', message: 'no test session id (cs_test_) in the URL' };
  return { ok: true, url: u.href };
}
function checkBuyer(b) {
  const need = ['email', 'name', 'line1', 'city', 'postal', 'country'].filter((k) => !b || !String(b[k] || '').trim());
  if (need.length) return { ok: false, code: 'bad_buyer', message: 'buyer is missing ' + need.join(', ') };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.email)) return { ok: false, code: 'bad_buyer', message: 'buyer email does not look like one' };
  if (!/^[A-Za-z]{2}$/.test(b.country)) return { ok: false, code: 'bad_buyer', message: 'country is a 2-letter code' };
  return { ok: true };
}

let PW = null;
function playwright() { if (!PW) PW = createRequire(import.meta.url)('playwright'); return PW; } // honours NODE_PATH=$(npm root -g)

// ---- small helpers on a Page or a Frame ("root")
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function visible(loc) { try { return (await loc.count()) > 0 && (await loc.first().isVisible()); } catch { return false; } }
// Checkout draws its own dropdowns and boxes over a native <select> / checkbox that is kept but visually hidden (class HiddenInput /
// Checkbox-Input): those count when their own box is shown, i.e. the element or its label or its parent has a size
async function shown(loc) {
  if (await visible(loc)) return true;
  try {
    return (await loc.count()) > 0 && (await loc.first().evaluate((el) => {
      if (!/^(SELECT|INPUT)$/.test(el.tagName) || (el.tagName === 'INPUT' && !/checkbox|radio/.test(el.type))) return false;
      const box = (e) => { if (!e) return false; const r = e.getBoundingClientRect(), s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      return box((el.labels && el.labels[0]) || null) || box(el.parentElement);
    }));
  } catch { return false; }
}
// the first shown candidate: input/select by its name (Stripe's names are stable), then by its label; polls up to ms
async function field(root, names, labels, ms) {
  const cands = [];
  for (const n of names) cands.push(root.locator(`input[name="${n}"], select[name="${n}"], textarea[name="${n}"]`));
  for (const l of labels) cands.push(root.getByLabel(l, { exact: false }));
  const end = Date.now() + (ms || 0);
  do { for (const c of cands) if (await shown(c)) return c.first(); if (Date.now() >= end) break; await wait(200); } while (true);
  return null;
}
async function put(loc, value, slow) {
  const tag = await loc.evaluate((el) => el.tagName).catch(() => '');
  if (tag === 'SELECT') {
    const v = String(value), sel = (o) => loc.selectOption(o, { force: true, timeout: 3000 }).then((r) => r.length > 0, () => false);
    return (await sel({ value: v })) || (await sel({ value: v.toUpperCase() })) || (await sel({ label: v }));
  }
  if (!(await loc.isEditable().catch(() => false))) return false;
  if (slow) { await loc.click(); await loc.fill(''); await loc.pressSequentially(String(value), { delay: 15 }); } else await loc.fill(String(value));
  return true;
}
async function tick(loc, on) {
  try {
    if ((await loc.isChecked()) === on) return true;
    await loc.setChecked(on, { force: true, timeout: 3000 }).catch(() => {});
    if ((await loc.isChecked()) !== on) await loc.evaluate((el) => el.click());
    return (await loc.isChecked()) === on;
  } catch { return false; }
}
async function clickIf(root, role, name) { const b = root.getByRole(role, { name }); if (await visible(b)) { await b.first().click().catch(() => {}); return true; } return false; }
const frameText = async (f) => { try { return await f.locator('body').innerText({ timeout: 1000 }); } catch { return ''; } };

async function isTestPage(root, ms) {
  const end = Date.now() + ms;
  do {
    if (await visible(root.getByText(TEST_BADGE))) return true;
    if (Date.now() >= end) return false; await wait(250);
  } while (true);
}
async function humanCheck(page) {
  for (const f of page.frames()) {
    const u = f.url();
    if (/hcaptcha|recaptcha|arkoselabs|challenges\.cloudflare/i.test(u) && /challenge|frame=challenge|anchor/i.test(u)) {
      const el = await f.frameElement().catch(() => null), box = el && (await el.boundingBox().catch(() => null));
      if (box && box.width > 60 && box.height > 60 && (await el.isVisible().catch(() => false))) return 'a robot check (' + new URL(u).hostname + ')';
    }
  }
  const t = await frameText(page.mainFrame());
  const m = HUMAN.exec(t); return m ? 'the page says: "' + m[0] + '"' : '';
}
// the test 3-D Secure page: Stripe's challenge frame has "Complete" and "Fail" buttons (older pages: "Complete authentication" / "Fail authentication")
async function threeDS(page, how) {
  const want = how === 'fail' ? /^\s*fail( authentication)?\s*$/i : /^\s*complete( authentication)?\s*$/i;
  for (const f of page.frames()) {
    const b = f.getByRole('button', { name: want });
    if (await visible(b)) { await b.first().click(); return true; }
  }
  return false;
}
async function alerts(root) {
  const out = [];
  for (const loc of [root.locator('[role="alert"]'), root.locator('.FieldError, .ConfirmPaymentButton-error, .SubmitButton-error')]) {
    const n = await loc.count().catch(() => 0);
    for (let i = 0; i < n && i < 8; i++) { const a = loc.nth(i); if (await a.isVisible().catch(() => false)) { const t = (await a.innerText().catch(() => '')).trim(); if (t) out.push(t); } }
  }
  return [...new Set(out)];
}

// ---- the pay page itself. root: the Page (hosted Checkout) or the Checkout frame. Returns a result; never throws for a page problem.
async function fillAndPay(page, root, buyer, card, opts, log) {
  const tm = Object.assign({}, T, opts.timeouts || {});
  // 1. the test badge, before anything is typed (embedded Checkout shows none: its frame address carries pk_test_ + cs_test_ instead)
  if (!opts._embeddedTest && !(await isTestPage(root, tm.load))) return { status: 'error', code: 'not_test_mode', message: 'no "Test mode" / "Sandbox" badge on the page: refused' };
  log('test badge seen');
  const h0 = await humanCheck(page); if (h0) return { status: 'needs_human', message: h0 };
  // 2. email (Link may offer itself after it: a code box for a known email is skipped or handed to a human)
  const email = await field(root, ['email'], [/^email/i], tm.field);
  if (!email) return { status: 'error', code: 'no_email_field', message: 'no email field' };
  await put(email, buyer.email); await email.press('Tab').catch(() => {});
  log('email');
  // 3. the card: choose "Card" when the page lists several ways to pay
  let num = await field(root, ['cardNumber'], [/card number/i], 1500);
  if (!num) { (await clickIf(root, 'radio', /^card$/i)) || (await clickIf(root, 'button', /^(pay with )?card$/i)); num = await field(root, ['cardNumber'], [/card number/i], tm.field); }
  if (!num) {
    const link = await visible(root.getByText(/enter the code|verification code|sent to your phone|log in to link/i));
    if (link) { await clickIf(root, 'button', /pay without link|use a different|cancel|close|not you/i); num = await field(root, ['cardNumber'], [/card number/i], tm.field); }
    if (!num) return { status: link ? 'needs_human' : 'error', code: 'no_card_field', message: link ? 'Link asked for a code and could not be skipped' : 'no card number field' };
  }
  await put(num, card.number, true);
  const exp = await field(root, ['cardExpiry'], [/expir|mm ?\/ ?yy/i], tm.field); if (exp) await put(exp, card.exp.replace('/', ''), true);
  const cvc = await field(root, ['cardCvc'], [/^cvc|security code|cvv/i], tm.field); if (cvc) await put(cvc, card.cvc, true);
  log('card');
  // 4. names, address (its shape changes by country: fill the fields that are there), phone
  const shipCountry = await field(root, ['shippingCountry'], [], 0); if (shipCountry && (await shipCountry.isEnabled().catch(() => false))) await put(shipCountry, buyer.country.toUpperCase());
  await clickIf(root, 'button', /enter (the )?address manually/i);
  const set = async (names, labels, v, slow) => { if (v == null || v === '') return false; const f = await field(root, names, labels, 0); return f ? put(f, v, slow) : false; };
  await set(['billingName'], [/cardholder name|name on card/i], buyer.name);
  await set(['shippingName'], [/^full name|^name$/i], buyer.name);
  const l1 = await field(root, ['shippingAddressLine1'], [/address line 1|^address$/i], 0);
  if (l1) { await put(l1, buyer.line1); await l1.press('Escape').catch(() => {}); } // closes the address suggestions
  await set(['shippingAddressLine2'], [/address line 2|apt|suite/i], buyer.line2);
  await set(['shippingPostalCode'], [/zip|postal|postcode/i], buyer.postal);
  await set(['shippingLocality'], [/^city|town|suburb/i], buyer.city);
  await set(['shippingAdministrativeArea'], [/^state|province|prefecture|county|region/i], buyer.state);
  // billing: only when it is asked separately (Checkout's "same as shipping" box ticked: these are hidden)
  const billCountry = await field(root, ['billingCountry'], [], 0); if (billCountry && (await billCountry.isEnabled().catch(() => false))) await put(billCountry, buyer.country.toUpperCase());
  await set(['billingAddressLine1'], [], buyer.line1); await set(['billingAddressLine2'], [], buyer.line2);
  await set(['billingLocality'], [], buyer.city); await set(['billingAdministrativeArea'], [], buyer.state);
  await set(['billingPostalCode'], [/^zip|^postal/i], buyer.postal);
  if (!(await field(root, ['shippingLocality'], [], 0)) && (await clickIf(root, 'button', /enter (the )?address manually/i))) { // a second chance after the suggestions
    await set(['shippingLocality'], [/^city|town|suburb/i], buyer.city); await set(['shippingPostalCode'], [/zip|postal|postcode/i], buyer.postal);
    await set(['shippingAdministrativeArea'], [/^state|province|prefecture|county|region/i], buyer.state);
  }
  log('address');
  // 5. the boxes: Link's "save my info" off first (its phone box goes with it), the terms on (our session requires them), then a phone if asked
  const save = await field(root, ['enableStripePass'], [/save my (info|information)|faster checkout|with link/i], 0);
  if (save && !(await tick(save, false))) log('could not untick Link');
  const terms = await field(root, ['termsOfServiceConsentCheckbox'], [/agree|terms/i], 0); if (terms) await tick(terms, true);
  await set(['phone', 'phoneNumber'], [/^phone/i], buyer.phone); // Checkout's own phone field (off in our sessions); Link's is gone with the box
  // 6. Pay
  // Checkout's submit button (its test id), else a button named just "Pay" (never "Pay with card", "Pay with Apple Pay"...)
  let pay = null;
  for (const c of [root.getByTestId('hosted-payment-submit-button'), root.getByRole('button', { name: /^\s*(pay|buy|book|donate|subscribe|place order)\s*$/i })]) {
    const n = await c.count().catch(() => 0);
    for (let i = 0; i < n && !pay; i++) if (await c.nth(i).isVisible().catch(() => false)) pay = c.nth(i);
    if (pay) break;
  }
  if (!pay) return { status: 'error', code: 'no_pay_button', message: 'no Pay button' };
  const before = page.url();
  await pay.click();
  log('pay tapped');
  // 7. what happened: polled every 300 ms up to the submit time (no fixed sleeps)
  const end = Date.now() + tm.submit; let did3ds = false, seen = '', firstAlertAt = 0;
  while (Date.now() < end) {
    const u = page.url();
    if (u !== before && !u.startsWith(new URL(before).origin + '/c/pay/') && !/^about:/.test(u) && !/cs_test_/.test(new URL(u).pathname))
      return { status: 'paid', url: u };
    if (opts.successText !== false && (await visible(root.getByText(SUCCESS_TEXT)))) return { status: 'paid', url: u, message: 'success text on the page' };
    const h = await humanCheck(page); if (h) return { status: 'needs_human', message: h };
    if (!did3ds && (await threeDS(page, opts.threeDS))) { did3ds = true; log('3-D Secure: ' + (opts.threeDS === 'fail' ? 'fail' : 'complete')); continue; }
    const al = await alerts(root);
    const dec = al.find((t) => DECLINE.test(t));
    if (dec) return { status: 'declined', message: dec, threeDS: did3ds || undefined };
    if (al.length) { seen = al.join(' | '); if (!firstAlertAt) firstAlertAt = Date.now(); else if (Date.now() - firstAlertAt > 4000 && (await pay.isEnabled().catch(() => false))) return { status: 'error', code: 'form_invalid', message: seen }; }
    else firstAlertAt = 0;
    await wait(300);
  }
  return { status: 'error', code: 'timeout', message: 'no result within ' + Math.round(tm.submit / 1000) + ' s' + (seen ? ': ' + seen : '') };
}

async function shoot(page, res, opts) {
  if (res.status === 'paid' || !page) return res;
  try {
    const dir = opts.shots || path.join(os.tmpdir(), 'dd-merch-pay-shots'); fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, 'pay-' + new Date().toISOString().replace(/\D/g, '').slice(0, 14) + '-' + res.status + (res.code ? '-' + res.code : '') + '.png');
    await page.screenshot({ path: f, fullPage: true, timeout: 10000 }); res.screenshot = f;
  } catch { /* a screenshot is a help, never a failure */ }
  return res;
}

// The driver. url: Stripe's hosted pay page; buyer: { email, name, line1, line2?, city, state?, postal, country, phone? };
// card: { number, exp: 'MM/YY', cvc } (default 4242); opts: { threeDS: 'complete'|'fail', shots, headed, timeouts, page (an open Page to
// use, as shopTrip does), browser, allowLocalTest (the offline test only), log(fn) }.
export async function payStripeCheckout(url, buyer, card, opts = {}) {
  const t0 = Date.now(), done = (r) => Object.assign(r, { seconds: Math.round((Date.now() - t0) / 100) / 10 });
  const log = typeof opts.log === 'function' ? opts.log : () => {};
  opts = Object.assign({}, opts, { _embeddedTest: false }); // the hosted page always needs its test badge
  const cu = checkUrl(url, opts); if (!cu.ok) return done({ status: 'error', code: cu.code, message: cu.message });
  const cc = checkCard(card || { number: '4242424242424242' }); if (!cc.ok) return done({ status: 'error', code: cc.code, message: cc.message });
  const cb = checkBuyer(buyer); if (!cb.ok) return done({ status: 'error', code: cb.code, message: cb.message });
  let browser = null, page = opts.page || null, res;
  try {
    if (!page) {
      browser = opts.browser || (await playwright().chromium.launch({ headless: !opts.headed }));
      page = await (await browser.newContext({ locale: 'en-US', viewport: { width: 1280, height: 1000 } })).newPage();
    }
    if (page.url() !== cu.url) await page.goto(cu.url, { waitUntil: 'domcontentloaded', timeout: (opts.timeouts && opts.timeouts.load) || T.load });
    const again = checkUrl(page.url(), opts); // a redirect may not take it anywhere else
    if (!again.ok) res = { status: 'error', code: again.code, message: 'the page moved to another place: ' + again.message };
    else res = await fillAndPay(page, page, buyer, cc, opts, log);
  } catch (e) {
    res = { status: 'error', code: 'exception', message: String((e && e.message) || e).split('\n')[0].slice(0, 300) };
  }
  await shoot(page, res, opts);
  if (browser && !opts.browser) await browser.close().catch(() => {});
  return done(res);
}

// For a public Stripe demo that shows Checkout embedded (js.stripe.com, a cs_test_ session) instead of hosted: the same form in a frame.
// Used only to find out whether Stripe's test page can be driven from a cloud session; the same card list and test badge rule apply.
export async function payEmbeddedTestFrame(page, frame, buyer, card, opts = {}) {
  const t0 = Date.now(), log = typeof opts.log === 'function' ? opts.log : () => {};
  let fu; try { fu = new URL(frame.url()); } catch { fu = null; }
  if (!fu || fu.origin !== 'https://js.stripe.com' || !/^\/v3\/embedded-checkout-inner\.html$/.test(fu.pathname)) return { status: 'error', code: 'refused_origin', message: 'not an embedded Stripe Checkout frame' };
  // a pk_test_ key cannot take a real payment: with a cs_test_ session it stands in for the badge embedded Checkout does not draw
  if (!/^pk_test_/.test(fu.searchParams.get('publishableKey') || '') || !/^cs_test_/.test(fu.searchParams.get('checkoutSessionId') || '')) return { status: 'error', code: 'refused_live', message: 'not a test key and test session' };
  const cc = checkCard(card || { number: '4242424242424242' }); if (!cc.ok) return { status: 'error', code: cc.code, message: cc.message };
  const cb = checkBuyer(buyer); if (!cb.ok) return { status: 'error', code: cb.code, message: cb.message };
  let res; try { res = await fillAndPay(page, frame, buyer, cc, Object.assign({}, opts, { _embeddedTest: true }), log); } catch (e) { res = { status: 'error', code: 'exception', message: String((e && e.message) || e).split('\n')[0] }; }
  await shoot(page, res, opts);
  return Object.assign(res, { seconds: Math.round((Date.now() - t0) / 100) / 10 });
}

// NOT RUNNABLE YET (nothing of ours is deployed; see the TODO list at the top). The whole trip on our test shop: log in by cookie, put the
// basket in, choose the country, tap Pay, then the driver on Stripe's page. basket: lines in the page's stored shape; cookie: the dd_test value.
export async function shopTrip({ origin = 'https://test.doodledoggo.app', basket, country, cookie, buyer, card, opts = {} }) {
  if (origin !== 'https://test.doodledoggo.app') return { status: 'error', code: 'refused_origin', message: 'the trip runs on the test copy only' };
  if (!Array.isArray(basket) || !basket.length || !cookie || !country) return { status: 'error', code: 'bad_input', message: 'basket, country and cookie are needed' };
  const cc = checkCard(card || { number: '4242424242424242' }); if (!cc.ok) return { status: 'error', code: cc.code, message: cc.message };
  const browser = opts.browser || (await playwright().chromium.launch({ headless: !opts.headed }));
  try {
    const ctx = await browser.newContext({ locale: 'en-US' });
    await ctx.addCookies([{ name: 'dd_test', value: cookie, domain: 'test.doodledoggo.app', path: '/', secure: true, httpOnly: true, sameSite: 'Lax' }]);
    await ctx.addInitScript(([k, v]) => { try { if (location.pathname.startsWith('/merch')) localStorage.setItem(k, v); } catch {} }, ['dd_merch_basket_v1', JSON.stringify(basket)]);
    const page = await ctx.newPage();
    await page.goto(origin + '/merch/#/basket', { waitUntil: 'domcontentloaded', timeout: T.load });
    await page.locator('#shipSel').selectOption(country, { timeout: T.field });
    const pay = page.locator('#payBtn');
    await pay.waitFor({ state: 'visible', timeout: T.field });
    const end = Date.now() + T.field; while (!(await pay.isEnabled()) && Date.now() < end) await wait(200);
    if (!(await pay.isEnabled())) return await shoot(page, { status: 'error', code: 'empty_basket', message: 'Pay stayed off (no quote or no basket)' }, opts);
    await Promise.all([page.waitForURL((u) => String(u).startsWith(STRIPE_ORIGIN + '/'), { timeout: T.load }), pay.click()]);
    return await payStripeCheckout(page.url(), buyer, card, Object.assign({}, opts, { page }));
  } catch (e) {
    return { status: 'error', code: 'exception', message: String((e && e.message) || e).split('\n')[0] };
  } finally { if (!opts.browser) await browser.close().catch(() => {}); }
}

// ---- the CLI
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const o = { url: {}, email: {}, name: {}, line1: {}, line2: {}, city: {}, state: {}, postal: {}, country: {}, phone: {}, card: {}, exp: {}, cvc: {}, '3ds': {}, shots: {} };
  for (const k of Object.keys(o)) o[k] = { type: 'string' };
  o.headed = { type: 'boolean' }; o.help = { type: 'boolean', short: 'h' };
  let a; try { a = parseArgs({ options: o, strict: true }).values; } catch (e) { console.error('merch_pay_driver: ' + e.message); process.exit(1); }
  if (a.help || !a.url) { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//')).slice(0, 28).map((l) => l.slice(3)).join('\n')); process.exit(a.help ? 0 : 1); }
  const buyer = { email: a.email, name: a.name, line1: a.line1, line2: a.line2, city: a.city, state: a.state, postal: a.postal, country: a.country, phone: a.phone };
  const card = { number: a.card || '4242424242424242', exp: a.exp || '12/34', cvc: a.cvc || '123' };
  const r = await payStripeCheckout(a.url, buyer, card, { threeDS: a['3ds'] === 'fail' ? 'fail' : 'complete', shots: a.shots, headed: !!a.headed, log: (s) => console.error('· ' + s) });
  console.log(JSON.stringify(r));
  process.exit({ paid: 0, declined: 2, needs_human: 3 }[r.status] ?? 1);
}
