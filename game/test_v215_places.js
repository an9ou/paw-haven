// v2.15 Around Town: the new places (V215.md sections 5, 6 and 16).
//   MAP lane (storefronts, section 5):
//   * Bow-Wow Boutique, Barkitecture and Pip's Sprout Cart are their own places; Kibble Corner is `market` (the key and the saves stay)
//   * arriving opens the shop window (prefs.shopOpen); closing it leaves you at the storefront; tapping the door (data-shop) opens it again
//   * prefs.shopOpen off: no window on arrival, the door and the place button still open it
//   * a save standing in `market` lands at Kibble Corner (the v2.15 corner scene is asked for with o.v215)
//   * the Boutique lines of the poodles moved from Market Street to the Boutique; every storefront has an arrival line
//   ACTIVITIES lane: the Training Ground, the Splash Pool and the run gates go in the marked section below.
const { run } = require('./test_lib');
const SHOPS = { boutique: 'boutique', builder: 'builder', sprout: 'sprout', market: 'kibble' };

run('v215_places', async (t) => {
  const { ok, sec, ev } = t;
  // travel through the map like a player: centre the building, click its hit ellipse, skip the walk, wait for the arrival
  const travel = async (k) => {
    await t.p.click('[data-act=map]'); await t.p.waitForSelector(`#mapInner .mb[data-area="${k}"]`);
    await ev((k) => window.__paw.mapTo(k), k); const b = await t.p.locator(`#mapInner .mb[data-area="${k}"] .mb-hit`).boundingBox();
    await t.p.mouse.click(b.x + b.width / 2, b.y + b.height / 2);
    if (await t.until(() => !!window.__paw.mp.walking(), null, 1500)) await t.p.mouse.click(640, 400); // a tap skips the walk
    return t.until((k) => window.__paw.S.place === k && !document.querySelector('.onway') && window.__paw.mode !== 'map', k, 8000);
  };
  const shopOpen = (sh) => t.until((sh) => { const h = document.querySelector('#modal:not([hidden]) .panel h2'); return !!h && h.textContent.includes(window.__paw.mp.name(sh === 'kibble' ? 'market' : sh)); }, sh, 4000);
  const close = async () => { await t.closeX(); await t.modalGone(); };

  sec('storefronts: the shop window opens on arrival, closing it leaves you there, the door opens it again');
  await t.newGame({}, { bond: { level: 7, pts: 1600 } });
  for (const k of ['boutique', 'builder', 'sprout', 'market']) {
    const sh = SHOPS[k];
    ok(await ev((k) => window.__paw.mp.shop(k), k) === sh, `${k}: its shop is ${sh}`);
    ok(await travel(k), `${k}: travelled there through the map`);
    ok(await shopOpen(sh), `${k}: the ${sh} window opens on arrival`);
    await t.SH('store_' + k);
    await close();
    ok(await ev((k) => window.__paw.S.place === k && ['yard', 'market'].includes(window.__paw.mode) && !!document.querySelector('#view svg.world #sceneG'), k), `${k}: closing the window leaves you at the storefront`);
    const door = await ev((sh) => { const d = document.querySelector(`#sceneG [data-shop="${sh}"]`); return d ? { hot: d.classList.contains('hot'), role: d.getAttribute('role'), others: [...document.querySelectorAll('#sceneG [data-shop].hot')].map((x) => x.getAttribute('data-shop')) } : null; }, sh);
    ok(door && door.hot && door.role === 'button' && door.others.length === 1, `${k}: the door is a button and the only shop door here: ` + JSON.stringify(door));
    await ev((sh) => document.querySelector(`#sceneG [data-shop="${sh}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), sh);
    ok(await shopOpen(sh), `${k}: tapping the door opens the window again`);
    await close();
    ok(await ev((sh) => [...document.querySelectorAll('#placeBtns [data-sh]')].map((b) => b.dataset.sh).join() === sh, sh), `${k}: the place buttons offer its own shop only`);
  }
  ok(await ev(() => JSON.parse(document.querySelector('#sceneG').dataset.extra || '{}').v215 === true), 'Kibble Corner asks for its v2.15 corner scene (o.v215)');
  ok(await ev(() => window.__paw.mp.name('market') === 'Kibble Corner'), 'market is shown as Kibble Corner');

  sec('prefs.shopOpen off');
  await t.p.click('#gearBtn'); await t.p.waitForSelector('#setShopOpen'); await t.p.click('#setShopOpen'); await t.closeX();
  ok(await ev(() => window.__paw.mp.labels() && JSON.parse(localStorage.getItem('pawhaven_prefs_v1')).shopOpen === false), 'the switch is off');
  ok(await travel('builder'), 'travelled to Barkitecture');
  await t.sleep(900); ok(await ev(() => document.getElementById('modal').hidden), 'no shop window on arrival');
  await t.p.click('#placeBtns [data-sh="builder"]'); ok(await shopOpen('builder'), 'the place button opens Barkitecture'); await close();
  await t.p.click('#gearBtn'); await t.p.waitForSelector('#setShopOpen'); await t.p.click('#setShopOpen'); await t.closeX();

  sec('arrival lines at the storefronts');
  {
    const L = await ev(() => { const m = window.__paw.mp, B = Object.keys(window.__paw.mp.lines()); return { n: B.length, miss: B.filter((b) => ['boutique', 'builder', 'sprout'].some((k) => !m.line(b, k))), poodle: m.line('poodle', 'boutique'), poodleM: m.line('poodle', 'market'), std: m.line('stdpoodle', 'boutique'), golden: m.line('golden', 'boutique'), lab: m.line('lab', 'builder') }; });
    ok(L.n >= 35 && !L.miss.length, `every breed (${L.n}) has a line at the three storefronts ${L.miss.join(' ')}`);
    ok(/Boutique/.test(L.poodle) && L.poodle === L.poodleM && /Boutique/.test(L.std), 'the poodles say their Boutique line at the Boutique: ' + L.poodle + ' / ' + L.std);
    ok(L.golden && !/Boutique/.test(L.golden) && L.lab, 'the others say the shared storefront line: ' + L.golden);
  }

  sec('a save standing in market lands at Kibble Corner');
  {
    await t.home('market');
    const json = await ev(() => { window.__paw.saveNow(); return localStorage.getItem('pawhaven_proto_v1'); });
    await t.mk({ storage: { pawhaven_proto_v1: json } }); await t.p.goto(require('./test_lib').URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue');
    ok(await t.until(() => ['yard', 'market'].includes(window.__paw.mode) && window.__paw.S.place === 'market' && !!document.querySelector('#sceneG'), null, 8000), 'the save loads at market (' + await ev(() => window.__paw.mode) + ')');
    ok(await ev(() => !!document.querySelector('#sceneG [data-shop="kibble"].hot')), 'its Kibble Corner door is a button');
    ok(await ev(() => /Kibble Corner/.test(document.getElementById('status').textContent) && JSON.parse(document.querySelector('#sceneG').dataset.extra || '{}').v215 === true), 'shown as Kibble Corner, with the v2.15 corner scene asked for');
    await t.SH('kibble_corner');
  }

  /* ======== ACTIVITIES lane: the Training Ground (agility, puppy course), the Splash Pool (paddle, vest, float fetch, winter dome), the run gates ======== */
  // (add the checks here: t.newGame({}, { bond: { level: 7 } }) with map215 on; travel(k) above walks the map like a player)
}, { map215: true });
