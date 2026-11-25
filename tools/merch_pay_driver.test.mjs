// Offline test of tools/merch_pay_driver.mjs against a local stand-in of Stripe's pay page (fields named and labelled like Checkout's,
// a test badge, Link's "save my info" box, a terms box, a manual-address button, a test 3-D Secure frame, a robot check). Nothing leaves
// the machine. Run: NODE_PATH=$(npm root -g) node --test tools/merch_pay_driver.test.mjs
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { payStripeCheckout, checkUrl, checkCard } from './merch_pay_driver.mjs';

const { chromium } = createRequire(import.meta.url)('playwright');
const SHOTS = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-pay-test-'));

const PAGE = (mode) => `<!doctype html><html><head><meta charset="utf-8"><title>Fake pay</title><style>.HiddenInput{position:absolute;width:0;height:0;overflow:hidden;opacity:0;border:0;padding:0;margin:0}</style></head><body>
<header>Doodle Doggo ${mode === 'live' ? '' : '<span class="pill">Test mode</span>'}</header>
<form id="f" onsubmit="return go(event)">
  <label for="email">Email</label><input id="email" name="email" type="email">
  <fieldset><legend>Payment method</legend>
    <button type="button" aria-label="Pay with card" style="width:0;height:0;padding:0;border:0"></button>
    <label for="cardNumber">Card number</label><input id="cardNumber" name="cardNumber" inputmode="numeric">
    <label for="cardExpiry">Expiration</label><input id="cardExpiry" name="cardExpiry" placeholder="MM / YY">
    <label for="cardCvc">CVC</label><input id="cardCvc" name="cardCvc">
    <label for="billingName">Cardholder name</label><input id="billingName" name="billingName">
  </fieldset>
  <fieldset><legend>Shipping address</legend>
    <label for="shippingName">Full name</label><input id="shippingName" name="shippingName">
    <label for="shippingCountry">Country or region</label><select id="shippingCountry" name="shippingCountry" disabled><option value="US">United States</option></select>
    <button type="button" id="manual" onclick="document.getElementById('addr').hidden=false;this.hidden=true">Enter address manually</button>
    <div id="addr" hidden>
      <label for="shippingAddressLine1">Address line 1</label><input id="shippingAddressLine1" name="shippingAddressLine1">
      <label for="shippingAddressLine2">Address line 2</label><input id="shippingAddressLine2" name="shippingAddressLine2">
      <label for="shippingLocality">City</label><input id="shippingLocality" name="shippingLocality">
      <label for="shippingPostalCode">ZIP</label><input id="shippingPostalCode" name="shippingPostalCode">
      <label for="shippingAdministrativeArea">State</label><select id="shippingAdministrativeArea" name="shippingAdministrativeArea" class="HiddenInput" aria-hidden="true" tabindex="-1"><option value="">State</option><option value="CA">California</option><option value="IL">Illinois</option></select>
    </div>
  </fieldset>
  <label><input type="checkbox" id="enableStripePass" name="enableStripePass" class="HiddenInput" checked> Save my information for faster checkout with Link</label>
  <label><input type="checkbox" id="termsOfServiceConsentCheckbox" name="termsOfServiceConsentCheckbox"> I agree to the Terms of sale</label>
  <div id="err"></div>
  <button type="submit" data-testid="hosted-payment-submit-button">Pay</button>
</form>
<script>
const $ = (id) => document.getElementById(id);
function alertMsg(t) { $('err').innerHTML = '<div role="alert"></div>'; $('err').firstChild.textContent = t; }
window.addEventListener('message', (e) => { if (e.data === 'complete') location.href = '/success?paid=1'; if (e.data === 'fail') { document.querySelector('#tds').remove(); alertMsg('We are unable to authenticate your payment method. Please choose a different payment method and try again.'); } });
function go(e) {
  e.preventDefault(); $('err').innerHTML = '';
  const v = (id) => $(id).value.trim(), n = v('cardNumber').replace(/\\s/g, '');
  const missing = ['email', 'cardExpiry', 'cardCvc', 'shippingName', 'shippingAddressLine1', 'shippingLocality', 'shippingPostalCode', 'shippingAdministrativeArea'].filter((k) => !v(k));
  if (missing.length) { alertMsg('Incomplete: ' + missing.join(', ')); return false; }
  if (!$('termsOfServiceConsentCheckbox').checked) { alertMsg('Please agree to the terms'); return false; }
  if ($('enableStripePass').checked) { alertMsg('Link would have saved this card'); return false; }
  ${mode === 'captcha' ? "const f = document.createElement('iframe'); f.src = '/fake-hcaptcha/challenge?frame=challenge'; f.style = 'width:400px;height:500px'; document.body.appendChild(f); return false;" : ''}
  if (n === '4242424242424242') { setTimeout(() => { location.href = '/success?paid=1&city=' + encodeURIComponent(v('shippingLocality')) + '&state=' + v('shippingAdministrativeArea'); }, 300); return false; }
  if (n === '4000000000000002') { setTimeout(() => alertMsg('Your card has been declined.'), 300); return false; }
  if (n === '4000002500003155') { const f = document.createElement('iframe'); f.id = 'tds'; f.src = '/3ds'; f.style = 'width:400px;height:300px'; document.body.appendChild(f); return false; }
  alertMsg('unexpected card ' + n); return false;
}
</script></body></html>`;
const TDS = `<!doctype html><body><p>3D Secure 2 Test Page</p><button onclick="parent.postMessage('complete','*')">Complete</button><button onclick="parent.postMessage('fail','*')">Fail</button></body>`;

let server, base, browser;
before(async () => {
  server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://x'), html = (s) => { res.writeHead(200, { 'content-type': 'text/html' }); res.end(s); };
    if (u.pathname.startsWith('/c/pay/')) return html(PAGE(u.searchParams.get('mode') || 'test'));
    if (u.pathname === '/3ds') return html(TDS);
    if (u.pathname === '/fake-hcaptcha/challenge') return html('<p>Please verify</p>');
    if (u.pathname === '/success') return html('<p>Thank you</p>');
    res.writeHead(404); res.end();
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch();
});
after(async () => { await browser.close(); server.close(); fs.rmSync(SHOTS, { recursive: true, force: true }); });

const BUYER = { email: 'test.buyer@example.com', name: 'Test Buyer', line1: '1 Example Street', city: 'Springfield', state: 'IL', postal: '62701', country: 'US' };
const OPTS = () => ({ browser, allowLocalTest: true, shots: SHOTS, timeouts: { load: 3000, field: 3000, submit: 8000 } });
const card = (number) => ({ number, exp: '12/34', cvc: '123' });
const url = (mode = 'test', id = 'cs_test_a1B2c3') => base + '/c/pay/' + id + (mode ? '?mode=' + mode : '');

test('only Stripe\'s hosted page: other origins refused', async () => {
  for (const u of ['https://evil.example/c/pay/cs_test_a1', 'http://checkout.stripe.com/c/pay/cs_test_a1', 'https://checkout.stripe.com.evil.example/c/pay/cs_test_a1', 'javascript:alert(1)'])
    assert.equal(checkUrl(u).code, 'refused_origin', u);
  assert.equal(checkUrl('https://checkout.stripe.com/c/pay/cs_test_a1#fid').ok, true);
  const r = await payStripeCheckout(url(), BUYER, card('4242424242424242'), { browser, shots: SHOTS }); // 127.0.0.1 without the test option
  assert.equal(r.status, 'error'); assert.equal(r.code, 'refused_origin');
});

test('live mode refused: a cs_live_ session, and a page without the test badge', async () => {
  assert.equal(checkUrl('https://checkout.stripe.com/c/pay/cs_live_a1').code, 'refused_live');
  assert.equal(checkUrl('https://checkout.stripe.com/c/pay/ppage_x').code, 'refused_live');
  const r1 = await payStripeCheckout(url('test', 'cs_live_a1'), BUYER, card('4242424242424242'), OPTS());
  assert.equal(r1.code, 'refused_live');
  const r2 = await payStripeCheckout(url('live'), BUYER, card('4242424242424242'), OPTS());
  assert.equal(r2.status, 'error'); assert.equal(r2.code, 'not_test_mode'); assert.ok(r2.screenshot && fs.existsSync(r2.screenshot));
});

test('a card that is not a Stripe test number is refused before any browser', async () => {
  for (const n of ['4111111111111111', '5555555555554444', '4242424242424241', '']) assert.equal(checkCard(card(n)).code, 'refused_card', n);
  assert.equal(checkCard(card('4242 4242 4242 4242')).ok, true);
  const r = await payStripeCheckout(url(), BUYER, card('4000056655665556'), OPTS());
  assert.equal(r.code, 'refused_card'); assert.equal(r.screenshot, undefined);
});

test('paid: 4242, the address filled by hand, Link unticked, terms ticked', async () => {
  const r = await payStripeCheckout(url(), BUYER, card('4242424242424242'), OPTS());
  assert.equal(r.status, 'paid', JSON.stringify(r));
  assert.match(r.url, /\/success\?paid=1&city=Springfield&state=IL$/);
  assert.equal(r.screenshot, undefined);
});

test('3-D Secure completed: paid; failed: declined', async () => {
  const ok = await payStripeCheckout(url(), BUYER, card('4000002500003155'), OPTS());
  assert.equal(ok.status, 'paid', JSON.stringify(ok));
  const no = await payStripeCheckout(url(), BUYER, card('4000002500003155'), Object.assign(OPTS(), { threeDS: 'fail' }));
  assert.equal(no.status, 'declined', JSON.stringify(no)); assert.equal(no.threeDS, true); assert.match(no.message, /unable to authenticate/);
});

test('declined: Stripe\'s message and a screenshot', async () => {
  const r = await payStripeCheckout(url(), BUYER, card('4000000000000002'), OPTS());
  assert.equal(r.status, 'declined', JSON.stringify(r)); assert.equal(r.message, 'Your card has been declined.');
  assert.ok(r.screenshot && fs.existsSync(r.screenshot));
});

test('needs_human: a robot check after Pay', async () => {
  const r = await payStripeCheckout(url('captcha'), BUYER, card('4242424242424242'), OPTS());
  assert.equal(r.status, 'needs_human', JSON.stringify(r)); assert.match(r.message, /robot check/);
  assert.ok(r.screenshot && fs.existsSync(r.screenshot));
});
