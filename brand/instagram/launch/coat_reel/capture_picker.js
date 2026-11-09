// The pick-a-coat Reel's beat B (owner, 9 Nov 2026: "more informative to audiences"): the REAL v2.23.1 adoption colour picker on a phone.
// A new game, the Shelter's Border Collie (Scout), its colour row scrolled to the top of the card, then three taps, one still after each:
//   pick0  Chocolate and white (the start, so no black or white dog is the subject)   pick1  Blue merle   pick2  Red merle   pick3  odd eyes
// Hidden: only the dog's joke bubble (#bubble), which is not part of the picker and covered the dog. Everything else is the game's own screen.
// layout.json: each tapped button's rect (CSS px of the 393 x 659 phone, after the scroll) and the dock's top, for the tap marks and the crop.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/coat_reel/capture_picker.js <main checkout> <outdir>
//   (the checkout needs game/test_merged.html: node game/build.js && node game/harness.js merged)
const { chromium } = require('playwright'), path = require('path'), fs = require('fs');
const G = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'picker'); fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const ctx = await b.newContext({ viewport: { width: 393, height: 659 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
  const p = await ctx.newPage(); p.on('pageerror', (e) => { throw e; });
  await p.goto('file://' + path.join(G, 'game', 'test_merged.html')); await p.waitForTimeout(2500);
  await p.addStyleTag({ content: '#bubble{opacity:0!important}' });
  await p.getByText('New game').click(); await p.waitForTimeout(2000);
  const heads = await p.evaluate(() => [...document.querySelectorAll('.heads button')].map((x) => x.getAttribute('aria-label')));
  const ci = heads.findIndex((h) => /Border Collie/.test(h)); if (ci < 0) throw new Error('no Border Collie in the Shelter');
  await p.locator('.heads button').nth(ci).click(); await p.waitForTimeout(600);
  // the colour row at the top of the card (the dock scrolls; the swatches are redrawn on each tap, so scroll again after each)
  const top = () => p.evaluate(() => { const d = document.querySelector('#dock'), c = d.querySelector('.coatpick'); d.scrollTop += c.getBoundingClientRect().top - d.getBoundingClientRect().top - 8; return d.getBoundingClientRect().top; });
  const rect = (sel) => p.evaluate((s) => { const r = document.querySelector(s).getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, sel);
  const label = () => p.evaluate(() => document.querySelector('.cp-lbl').textContent.replace(/\s+/g, ' ').trim());
  const L = { taps: [] };
  const tap = async (cp) => { await top(); const r = await rect(`[data-cp="${cp}"]`); L.taps.push(Object.assign({ cp }, r)); await p.locator(`[data-cp="${cp}"]`).click(); };
  const shot = async (n) => { L.dockTop = await top(); await p.waitForTimeout(1400); await top(); await p.screenshot({ path: path.join(OUT, `pick${n}.png`) }); L['label' + n] = await label(); console.log('pick' + n, L['label' + n]); };
  await tap('c|1'); L.taps.pop(); await shot(0); // the start: Chocolate and white (no tap mark)
  await tap('c|2'); await shot(1);
  await tap('c|3'); await shot(2);
  await tap('e|2'); await shot(3);
  if (!/Red merle/.test(L.label3) || !/odd/.test(L.label3)) throw new Error('the picker did not end on Red merle, odd eyes: ' + L.label3);
  fs.writeFileSync(path.join(OUT, 'layout.json'), JSON.stringify(L, null, 1));
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
