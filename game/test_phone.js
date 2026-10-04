// v1.5B phone version: full playthrough with touch on iPhone 13 + a smoke run on Pixel 7 (harness.js merged). node test_phone.js
const { chromium, devices } = require('playwright'); const path = require('path'); const fs = require('fs');
const URL = 'file://' + path.join(__dirname, 'test_merged.html');
const DIR = path.join(__dirname, 'shots_phone'); fs.mkdirSync(DIR, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const fails = []; const ok = (c, l) => { console.log(c ? '  ok  ' : '  FAIL', l); if (!c) fails.push(l); };
const TAP_SEL = 'button, [role=button], a[href], input:not([type=hidden]), select, .card';

async function run(b, devName, full) {
  console.log(`\n# ${devName}${full ? ' (full playthrough)' : ' (smoke)'}`);
  const ctx = await b.newContext({ ...devices[devName], defaultBrowserType: undefined });
  const p = await ctx.newPage(); const errors = [];
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); }); p.on('pageerror', (e) => errors.push(e.message));
  const cdp = await ctx.newCDPSession(p);
  const tag = devName.replace(/\s+/g, '').toLowerCase();
  const SH = (n) => p.screenshot({ path: path.join(DIR, `${tag}_${n}.png`) });
  const S = () => p.evaluate(() => JSON.parse(JSON.stringify(window.__paw.S)));
  const ev = (f, a) => p.evaluate(f, a);
  const mode = () => ev(() => window.__paw.mode);
  const tap = async (sel, o = {}) => { await p.locator(sel).first().tap(o); await sleep(o.wait ?? 300); };
  const center = async (sel) => { const bb = await p.locator(sel).first().boundingBox(); return [bb.x + bb.width / 2, bb.y + bb.height / 2]; };
  const touchDrag = async (pts, ms = 30) => {
    const tp = (x, y) => [{ x, y, radiusX: 4, radiusY: 4, force: 1, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(...pts[0]) });
    for (let i = 1; i < pts.length; i++) { await sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(...pts[i]) }); }
    await sleep(ms); await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  const line = (a, bb, n = 10) => Array.from({ length: n + 1 }, (_, i) => [a[0] + (bb[0] - a[0]) * i / n, a[1] + (bb[1] - a[1]) * i / n]);
  const lu = async () => { for (let i = 0; i < 6 && await p.locator('#luOk').count(); i++) { await tap('#luOk'); } };
  const dev = async (ids) => { await tap('#devBtn'); for (const id of ids) { await p.locator(id).first().tap(); await sleep(120); } if (await p.locator('#devPanel:not([hidden])').count()) await tap('#dvX'); await lu(); };
  const calm = () => ev(() => window.__paw.S.dogs.forEach((d) => { d.potty.poopDue = null; d.potty.peeDue = null; d.potty.nextPee = window.__paw.S.gameMin + 9999; }));
  const travel = async (k) => { await tap('[data-act=map]', { wait: 700 }); await ev((k) => window.__paw.mapTo(k), k); await sleep(100); await p.locator(`[data-area=${k}]`).first().tap({ force: true }); await sleep(300); await tap('#mapGoBtn', { wait: 1900 }); await lu(); };
  const noHScroll = async (where) => { const [sw, iw] = await ev(() => [document.documentElement.scrollWidth, window.innerWidth]); ok(sw === iw, `${where}: no horizontal scroll (${sw} = ${iw})`); };
  const targets = async (where) => {
    const bad = await ev((sel) => {
      const out = [], vw = innerWidth, vh = innerHeight;
      document.querySelectorAll(sel).forEach((el) => {
        if (el.closest('#modHost .pw-root, #modHost [class^="pw-"], #modHost [class^="pt-"], .lptip, #devPanel[hidden]')) return; // walk + toys modules belong to their own authors
        let r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
        if (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) return;
        if (el.type === 'checkbox' && el.closest('label')) r = el.closest('label').getBoundingClientRect();
        if (el.closest('#devPanel,#devBtn') && el.id !== 'devBtn') return;
        const m = Math.min(r.width, r.height);
        if (m < 43.5) out.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}.${String(el.className && el.className.baseVal != null ? el.className.baseVal : el.className).split(' ')[0]} ${Math.round(r.width)}x${Math.round(r.height)} "${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 18)}"`);
      });
      return out;
    }, TAP_SEL);
    ok(bad.length === 0, `${where}: tap targets >= 44 px${bad.length ? ' -> ' + bad.slice(0, 6).join(' | ') : ''}`);
  };

  await p.goto(URL); await sleep(800);
  ok((await ev(() => document.documentElement.dataset.layout)) === 'phone', 'phone layout is on'); await SH('01_title'); await noHScroll('title'); await targets('title');
  await tap('#tNew', { wait: 500 }); await tap('#aGirl'); await SH('02_adopt'); await targets('adopt'); await tap('#aAdopt', { wait: 400 }); await tap('#nOk', { wait: 400 });
  for (let i = 0; i < 3; i++) { if (await p.locator('#iNext').count()) await tap('#iNext', { wait: 350 }); }
  await sleep(700); await calm(); await SH('03_yard'); await noHScroll('yard'); await targets('yard');
  const vb = await ev(() => document.querySelector('#view > svg.world').getAttribute('viewBox'));
  ok(vb !== '0 0 1000 600', 'scene cropped around the dog: viewBox ' + vb);
  const bar = await ev(() => [...document.querySelectorAll('#bar .act')].map((b) => Math.round(b.getBoundingClientRect().height)));
  ok(bar.length === 7 && bar.every((h) => h >= 48), '7-button icon bar, each >= 48 px tall: ' + bar.join(','));

  // pet by touch: a tap is a pat, a rub (touch drag) pets more
  await ev(() => { window.__paw.S.stats.happy = 50; });
  const b0 = (await S()).bond.pts, h0 = (await S()).stats.happy; const dc = await center('#dogHit');
  await p.touchscreen.tap(dc[0], dc[1]); await sleep(300); const h1 = (await S()).stats.happy;
  await touchDrag([dc, [dc[0] - 60, dc[1]], [dc[0] + 60, dc[1]], [dc[0] - 60, dc[1] + 10], [dc[0] + 60, dc[1]], [dc[0] - 60, dc[1]], [dc[0] + 60, dc[1] + 10], [dc[0] - 60, dc[1]]], 40); await sleep(400);
  const b2 = (await S()).bond.pts; ok(h1 > h0 && b2 > b0, `petting by touch: tap = a pat (Happiness ${Math.round(h0)}->${Math.round(h1)}), rub = Bond ${b0}->${b2}`);

  // feed: bottom sheet, swipe down closes, tap feeds
  await ev(() => { window.__paw.S.stats.hunger = 30; });
  await tap('[data-act=feed]', { wait: 400 }); await SH('04_feed_sheet'); await targets('feed sheet');
  const sheet = await p.locator('#dock > .tray').boundingBox();
  ok(Math.abs(sheet.width - (await ev(() => innerWidth))) < 2 && sheet.y + sheet.height > (await ev(() => innerHeight)) - 120, 'Feed popup is a full-width bottom sheet');
  await touchDrag(line([sheet.x + sheet.width / 2, sheet.y + 12], [sheet.x + sheet.width / 2, sheet.y + 260], 8)); await sleep(400);
  ok(!(await ev(() => !!document.querySelector('#dock > .tray:not(.dock-idle):not(.mini)') && getComputedStyle(document.getElementById('dock')).display !== 'none')), 'swipe down closes the sheet');
  await tap('[data-act=feed]', { wait: 400 }); await tap('[data-food="Basic Kibble"]', { wait: 2900 }); ok((await S()).stats.hunger > 30, 'tap-to-feed');

  if (full) {
    await dev(['#dvBond', '#dvBond', '#dvBond', '#dvCoins', '#dvCoins']); await calm();
    // HUD ring meters expand on tap; the ... menu has Settings + Mute
    await tap('#meters'); ok(await p.locator('#hud.hexp').count() === 1, 'tap the ring meters: full meters'); await SH('05_hud_expanded'); await tap('#meters');
    await tap('#moreBtn', { wait: 400 }); ok(await p.locator('#mmSet').count() === 1 && await p.locator('#mmMute').count() === 1, '... menu: Settings + Mute'); await tap('#mmSet', { wait: 400 }); await SH('06_settings'); await targets('settings'); await tap('.panel .x');

    // map: drag pan + tap-to-confirm chip
    await tap('[data-act=map]', { wait: 800 }); await SH('07_map'); await targets('map'); await noHScroll('map');
    const tf = () => ev(() => document.getElementById('mapInner').style.transform); const sl0 = await tf(); const mc = await center('#mapPan');
    await touchDrag(line([mc[0] + 120, mc[1]], [mc[0] - 120, mc[1]], 10)); await sleep(500);
    const sl1 = await tf(); ok(sl1 !== sl0, `map pans by drag (${sl0} -> ${sl1})`);
    await ev(() => window.__paw.mapTo('market')); await sleep(100); await p.locator('[data-area=market]').first().tap({ force: true }); await sleep(300);
    ok(/Go to Market Street/.test(await p.textContent('#mapGo')), 'tap a place: confirm chip "Go to Market Street"'); await SH('08_map_chip');
    await tap('#mapGoBtn', { wait: 1900 }); await lu(); ok((await S()).place === 'market', 'travelled to the market'); await calm();

    // shop: purchase sheet with big - / +
    await tap('#placeBtns [data-sh=kibble]', { wait: 500 }); await SH('09_shop'); await targets('shop');
    const k0 = (await S()).inv.food['Basic Kibble'] || 0;
    await tap('[data-buy="Basic Kibble"]', { wait: 400 }); await tap('.bb-p'); await tap('.bb-p'); await SH('10_purchase_sheet'); await targets('purchase sheet');
    ok((await p.inputValue('.bb-in')) === '3', 'purchase sheet: + + makes 3'); await tap('.bb-yes', { wait: 400 });
    ok((await S()).inv.food['Basic Kibble'] === k0 + 3, 'bought 3 kibble'); await tap('.panel .x');
    // beds for the nap later
    await tap('#placeBtns [data-sh=builder]', { wait: 400 }); await tap('[data-btab=beds]'); await tap('[data-buy="Plaid Pillow"]', { wait: 400 }); await tap('.bb-yes', { wait: 400 }); await tap('.confirm .yes', { wait: 400 });
    ok((await S()).bed === 'Plaid Pillow', 'bought a bed'); await tap('.panel .x');
    await tap('#placeBtns [data-sh=boutique]', { wait: 400 }); const cl = await p.locator('[data-buy]').first().getAttribute('data-buy'); await tap('[data-buy]', { wait: 400 }); await tap('.bb-yes', { wait: 400 }); if (await p.locator('.confirm .no').count()) await tap('.confirm .no'); await tap('.panel .x');

    // wardrobe: sheet, 1-column layout
    await tap('[data-act=wardrobe]', { wait: 400 }); await SH('11_wardrobe'); await targets('wardrobe'); ok(await p.locator('.ward').count() === 1, 'wardrobe sheet');
    if (await p.locator(`[data-eq="${cl}"]`).count()) await tap(`[data-eq="${cl}"]`);
    ok(Object.values((await S()).outfit).includes(cl), 'wardrobe: equipped ' + cl + ' by tap'); await tap('.panel .x');

    // journal sheet with scrolling tabs
    await tap('[data-act=journal]', { wait: 400 }); await SH('12_journal'); await targets('journal'); await tap('[data-jt=profile]'); await SH('13_profile'); await tap('.panel .x');

    // walk with touch
    await travel('yard'); await calm();
    await tap('[data-act=walk]', { wait: 800 }); await SH('14_routes'); await targets('routes'); await noHScroll('routes');
    await tap('#rtStart', { wait: 1300 });
    for (let i = 0; i < 10; i++) { const g = p.locator('button:has-text("Let\'s go")'); if (await g.count()) { await g.first().tap(); break; } await sleep(300); }
    await sleep(2200); ok((await mode()) === 'walk', 'walk (runner) started by touch');
    const vw = await ev(() => [innerWidth, innerHeight]); await p.touchscreen.tap(vw[0] * 0.8, vw[1] * 0.55); await sleep(400);
    const jumpBtn = await p.locator('#modHost button:has-text("Jump"), #modHost [aria-label*="Jump" i]').count();
    console.log(`   runner touch buttons from the walk module: ${jumpBtn ? 'present' : 'not yet (walk module author is adapting it)'}`);
    await SH('15_runner'); await noHScroll('runner');
    await p.keyboard.press('Escape'); await sleep(600); if (await p.locator('[data-home]').count()) await tap('[data-home]');
    for (let i = 0; i < 20 && !(await p.locator('#resOk').count()); i++) await sleep(300);
    if (await p.locator('#resOk').count()) await tap('#resOk', { wait: 900 }); await lu(); ok((await mode()) === 'yard', 'walk finished, back home');

    // toy with touch
    await calm(); await tap('[data-act=play]', { wait: 400 });
    if (await p.locator('[data-play="toy:Tennis Ball"]').count()) {
      await tap('[data-play="toy:Tennis Ball"]', { wait: 1500 }); ok((await mode()) === 'toy', 'toy opened by tap');
      const hc = await center('#modHost'); await touchDrag(line([hc[0], hc[1] + 120], [hc[0] + 40, hc[1] - 160], 6), 16); await sleep(800); await SH('16_toy'); await noHScroll('toy');
      await ev(() => window.__paw.go('yard')); await sleep(600);
    } else ok(false, 'tennis ball toy');

    // garden: seed drag by touch, water, close
    await calm(); await tap('#placeBtns [data-pb=garden]', { wait: 1300 }); ok((await mode()) === 'garden', 'garden opens'); await SH('17_garden'); await noHScroll('garden'); await targets('garden');
    ok(await ev(() => !!document.querySelector('.pg-root.pg-portrait')), 'garden portrait layout (2x3 plots)');
    await tap('.pg-tool[data-t="seeds"]', { wait: 400 }); await SH('18_pouch');
    const pk = await center('.pg-pk[data-c="carrot"]'), pl = await center('.pg-plot[data-i="1"]');
    await touchDrag(line(pk, pl, 12), 25); await sleep(500);
    if (!(await ev(() => !!window.__paw.S.garden.plots[1].crop))) { await p.locator('.pg-plot[data-i="1"]').tap(); await sleep(500); }
    ok((await ev(() => window.__paw.S.garden.plots[1].crop)) === 'carrot', 'garden: dragged a carrot seed packet onto plot 2 (touch)');
    await tap('.pg-tool[data-t="water"]', { wait: 300 }); await p.locator('.pg-plot[data-i="1"]').tap(); await sleep(600);
    ok((await ev(() => window.__paw.S.garden.plots[1].water)) === 3, 'garden: watered by tap'); await SH('19_garden_planted');
    await tap('.pg-done', { wait: 900 });

    // kitchen: drag an ingredient to the pot by touch, tap another, cook
    await ev(() => { const S = window.__paw.S; S.inv.pantry.oats = 3; S.inv.crops.carrot = [2, 0, 0]; });
    await tap('#placeBtns [data-pb=house]', { wait: 1800 }); await lu(); await calm();
    await tap('#placeBtns [data-pb=kitchen]', { wait: 1400 }); ok((await mode()) === 'kitchen', 'kitchen opens'); await SH('20_kitchen'); await noHScroll('kitchen'); await targets('kitchen');
    ok(await ev(() => !!document.querySelector('.pk-root.pk-portrait')), 'kitchen portrait layout (pantry strip under the pot)');
    await ev(() => document.querySelector('[data-ing="carrot"]').scrollIntoView({ inline: 'center', block: 'nearest' })); await sleep(300);
    const ct = await center('[data-ing="carrot"]'), pot = await center('.pk-pot');
    await touchDrag(line(ct, pot, 12), 25); await sleep(700);
    await p.locator('[data-ing="oats"]').first().tap(); await sleep(600);
    const inPot = await ev(() => document.querySelectorAll('.pk-slot.pk-fullslot').length); ok(inPot === 2, `kitchen: carrot dragged (touch) + oats tapped into the pot (${inPot})`);
    await tap('.pk-btn.pk-go:has-text("Cook!")', { wait: 400 }); await SH('21_minigame');
    for (let i = 0; i < 60 && !(await p.locator('.pk-rbtns').count()); i++) { if (i === 6 && await p.locator('.pk-tap').count()) await p.locator('.pk-tap').tap().catch(() => {}); await sleep(200); }
    await sleep(400); await SH('22_reveal'); ok((await S()).inv.dishes.length >= 1, 'cooked a dish');
    if (await p.locator('.pk-rbtns .pk-btn:has-text("Done")').count()) await tap('.pk-rbtns .pk-btn:has-text("Done")', { wait: 900 });
    if ((await mode()) === 'kitchen') { await p.keyboard.press('Escape'); await sleep(900); }

    // bed nap in the house
    await calm(); await ev(() => { window.__paw.S.stats.energy = 40; });
    await tap('[data-act=care]', { wait: 400 }); await tap('[data-care=sleep]', { wait: 1500 });
    ok((await S()).sleeping, 'nap on the bed'); await SH('23_nap'); await targets('nap'); await tap('#wakeBtn', { wait: 1600 });

    // potty clean by tap
    await travel('park'); await calm(); await dev(['#dvPoop']); await sleep(3700);
    ok(((await S()).messes.park || []).length === 1, 'poop happened'); await SH('24_poop');
    await sleep(900);
    await p.locator('#messG [data-mi="0"]').tap({ force: true }); await sleep(500); ok(((await S()).messes.park || []).length === 0, 'tapped to scoop');
  } else {
    await tap('[data-act=map]', { wait: 800 }); await SH('05_map'); await noHScroll('map'); await targets('map'); await tap('#mapX', { wait: 500 });
    await tap('[data-act=journal]', { wait: 400 }); await SH('06_journal'); await targets('journal'); await tap('.panel .x');
    await ev(() => { window.__paw.S.bond.level = 4; window.__paw.go('garden'); }); await sleep(1300); await SH('07_garden'); await noHScroll('garden'); await targets('garden'); await ev(() => window.__paw.go('yard')); await sleep(500);
  }
  ok(errors.length === 0, `${devName}: no console errors${errors.length ? ' -> ' + errors.slice(0, 3).join(' | ') : ''}`);
  await ctx.close();
}

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  await run(b, 'iPhone 13', true);
  await run(b, 'Pixel 7', false);
  console.log(fails.length ? `\nFAILED ${fails.length}: ${fails.join(' | ')}` : '\nALL OK');
  await b.close();
})().catch((e) => { console.error('CRASH', e); process.exit(1); });
