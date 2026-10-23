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

  /* ---- Training Ground (ACTIVITIES part 1: agility, V215.md 6.1). The suite runs on the deep ground ({ ground: true }) ---- */
  sec('Training Ground: the place, the care note, the arrival lines, the button');
  await t.home('yard');
  ok(await ev(() => window.__paw.gr.on('training')), 'training is a grOn place');
  ok(await ev(() => !window.__paw.ag.on() && !document.querySelector('#placeBtns [data-ag]')), 'no agility button at the yard');
  await t.home('training'); await t.sleep(500);
  ok(await ev(() => window.__paw.ag.on() && !!document.querySelector('#placeBtns [data-ag]') && !!document.querySelector('#agBoard')), 'at the Training Ground: agOn, the course button, the scoreboard marks');
  ok(await t.until(() => [...document.querySelectorAll('#toasts .toast.gold')].some((e) => /Agility is play, so keep runs short/.test(e.textContent) && /low bars keep young and old joints happy/.test(e.textContent)), null, 4000), 'the first-visit care note (gold toast, both sentences)');
  ok(await ev(() => window.__paw.S.ag.seen === true), 'S.ag.seen is set');
  {
    const L = await ev(() => { const B = Object.keys(window.__paw.ag.lines); return { n: B.length, miss: B.filter((b) => !window.__paw.mp.line(b, 'training')) }; });
    ok(L.n === 35 && !L.miss.length, `every one of the 35 breeds has a Training Ground arrival line (${L.n}, missing ${L.miss.join(' ')})`);
    ok(await ev(() => { const l = window.__paw.ag.lesson(); return Array.isArray(l) && l.length === 4 && !/;/.test(l[3]); }), "Gerald's guide has the agility card");
    ok(await ev(() => window.__paw.ms.pool.includes('agility') && window.__paw.ms.pool.includes('agility_ros') && window.__paw.ms.pool.includes('travel_training')), 'the agility missions are in the pool');
  }

  sec('Training Ground: a full adult run (all Perfect), the rewards');
  const dog0 = await ev(() => window.__paw.S.dog.id);
  const snap = () => ev(() => { const S = window.__paw.S; return { coins: S.coins, bond: S.bond.pts + S.bond.level * 1e6, en: S.stats.energy, ag: JSON.parse(JSON.stringify(S.ag)) }; });
  // run the open course: pin the marker (0.5 = the middle of the green), tap Go! for each obstacle (or 'slow': a late tap), wait for the result
  const course = async (pin) => {
    for (let i = 0; i < 6; i++) {
      if (!await t.until(() => { const s = window.__paw.ag.state; return !!s && (s.ready || s.ph === 'done'); }, null, 14000)) return false;
      if (await ev(() => window.__paw.ag.state.ph === 'done')) break;
      if (pin === 'slow') await ev(() => window.__paw.ag.go('slow')); else { await ev((v) => window.__paw.ag.pin(v), pin); await t.p.click('#agGo'); }
      await t.sleep(250);
    }
    return t.until(() => { const s = window.__paw.ag.state; return !!s && s.ph === 'done'; }, null, 14000);
  };
  await ev(() => { window.__paw.S.stats.energy = 100; });
  const b0 = await snap();
  await t.p.click('#placeBtns [data-ag]'); await t.p.waitForSelector('#agStart');
  ok(await ev(() => document.documentElement.classList.contains('ag-on') && !!document.querySelector('.ag-tray')), 'the pick tray opens');
  await t.p.click('#agStart');
  ok(await t.until(() => window.__paw.ag.state && window.__paw.ag.state.ready, null, 8000), 'the first obstacle is ready: Go! waits');
  {
    const st = await ev(() => window.__paw.ag.state);
    ok(st.course.join() === 'table,weave,tunnel,jump,tyre' && !st.low && Math.abs(st.hw - 0.12) < 1e-6, 'the adult course has five obstacles: ' + st.course.join());
    const go = await t.p.locator('#agGo').boundingBox(); ok(go.height >= 63, 'the Go! button is 64 px tall: ' + Math.round(go.height));
    await t.SH('agility_mid_run');
  }
  ok(await course(0.5), 'five Perfect taps finish the course');
  await t.sleep(300);
  {
    const R = await ev(() => window.__paw.ag.state), b1 = await snap();
    ok(R.pts.join() === '2,2,2,2,2' && R.res.stars === 3, 'all Perfect: 3 rosettes ' + JSON.stringify(R.res));
    ok(b1.coins - b0.coins === 30 && b1.ag.coins === 30 && b1.ag.runs === 1, `3 rosettes pay 30 coins (+${b1.coins - b0.coins}), the day counts 30`);
    ok(b1.bond > b0.bond, 'Bond for the first run of the day for this dog');
    ok(b0.en - b1.en >= 9 && b0.en - b1.en <= 13, 'Energy -10 a run (' + (b0.en - b1.en).toFixed(1) + ')');
    ok(b1.ag.best[dog0] === 3 && await ev((id) => window.__paw.ag.best(id), dog0) === 3, 'the best rosettes are kept (S.ag.best)');
    ok(await ev(() => document.querySelectorAll('.ag-ros-row .ag-ros.on').length === 3), 'the result shows 3 rosettes');
    ok(await ev(() => window.__paw.ag.left() === 10), 'agility coins left today: 10');
    await t.SH('agility_rosettes');
  }

  sec('Training Ground: a run of only late taps still clears everything (no fail state), second run of the day');
  await ev(() => { window.__paw.S.stats.energy = 100; });
  const c0 = await snap();
  await t.p.click('#agAgain');
  ok(await course('slow'), 'five slow taps finish the course');
  {
    const R = await ev(() => window.__paw.ag.state), c1 = await snap();
    ok(R.pts.join() === '0,0,0,0,0' && R.res.stars === 1, 'every obstacle cleared, 1 rosette at least: ' + R.res.stars);
    ok(c1.coins - c0.coins === 10 && c1.ag.coins === 40 && c1.ag.runs === 2, `the second run pays 10 coins (+${c1.coins - c0.coins}), the day is at 40`);
    ok(c1.bond === c0.bond, 'no second Bond for the same dog on the same day');
    ok(await ev(() => window.__paw.ag.left() === 0), 'the pack cap (AG_COIN_DAY 40) is reached');
  }
  await ev(() => { window.__paw.S.stats.energy = 100; });
  const d0 = await snap();
  await t.p.click('#agAgain'); ok(await course(0.5), 'a third run');
  {
    const d1 = await snap(); ok(d1.coins === d0.coins, 'no coins after the first two runs (' + (d1.coins - d0.coins) + ')');
    ok(await ev(() => /two runs of the day/.test(document.getElementById('agHint').textContent)), 'the result says why: coins are for the first two runs');
  }
  await t.p.click('#agDone');
  ok(await ev(() => !window.__paw.ag.running() && !document.documentElement.classList.contains('ag-on') && !!document.querySelector('#placeBtns [data-ag]')), 'Done leaves the course, the button is back');

  sec('Training Ground: the cap and a new day');
  await ev(() => { const S = window.__paw.S; S.ag.coins = 35; S.ag.runs = 0; S.stats.energy = 100; });
  const e0 = await snap();
  await ev(() => window.__paw.ag.open()); await t.p.click('#agStart'); ok(await course(0.5), 'run under a 35 coin day');
  { const e1 = await snap(); ok(e1.coins - e0.coins === 5 && e1.ag.coins === 40, 'a 30 coin run pays only what the cap leaves: ' + (e1.coins - e0.coins)); }
  await ev(() => window.__paw.ag.stop());
  await ev(() => { window.__paw.S.ag.day = '2000-01-01'; });
  ok(await ev(() => window.__paw.ag.left() === 40), 'a new day: 40 coins left again');

  sec('Training Ground: the puppy course (and a pack dog through pkWith)');
  const pup = await ev(() => { const P = window.__paw; const d = P.addDog({ key: 'dachs', sex: 'male', months: 4 }, 'Pip'), old = P.addDog({ key: 'corgi', sex: 'female', months: 100 }, 'Nana'); return { pup: d.id, old: old.id }; });
  await t.home('training'); await t.sleep(400);
  ok(await ev((p) => window.__paw.ag.low(p.pup) && window.__paw.ag.low(p.old) && !window.__paw.ag.low(window.__paw.S.dog.id), pup), 'puppies and seniors take the low course, the adult does not');
  await ev(() => { window.__paw.S.dogs.forEach((d) => { d.stats.energy = 100; }); });
  const lead0 = await ev(() => window.__paw.S.activeId);
  ok(await ev((id) => window.__paw.ag.start(id), pup.pup), 'the puppy starts a run (picked from the pack)');
  ok(await t.until(() => window.__paw.ag.state && window.__paw.ag.state.ready, null, 8000), 'the puppy course is ready');
  {
    const st = await ev(() => window.__paw.ag.state);
    ok(st.low && st.course.join() === 'table,tunnel,jump' && st.hw > 0.12, `the puppy course: table, tunnel and the ground bar, a wider window (${st.course.join()} hw ${st.hw})`);
    ok(await ev((id) => window.__paw.S.activeId === id, pup.pup), 'the picked dog leads the run (pkWith)');
    await t.SH('agility_puppy');
  }
  ok(await course('slow'), 'late taps finish the puppy course too');
  { const R = await ev(() => window.__paw.ag.state); ok(R.res.stars >= 1 && R.pts.length === 3, 'a puppy gets its rosette: ' + R.res.stars); }
  await t.p.click('#agDone');
  ok(await t.until((id) => window.__paw.S.activeId === id, lead0, 4000), 'the old leader is back when the run ends (pkBack)');
  ok(await ev((id) => window.__paw.ag.best(id) >= 1, pup.pup), 'the puppy has its own best');
  ok(await ev((id) => window.__paw.ag.start(id), pup.old) && await t.until(() => window.__paw.ag.state && window.__paw.ag.state.low, null, 8000), 'a senior runs the low course');
  await ev(() => window.__paw.ag.stop()); await t.sleep(200);
  ok(await ev((id) => { window.__paw.S.dogs.find((d) => d.id === id).stats.energy = 4; return window.__paw.ag.start(id) === false; }, pup.pup), 'a dog with Energy below 10 does not start (a kind note, nothing bad)');

  sec('Training Ground: the trick bonus');
  await ev(() => { window.__paw.S.dogs.forEach((d) => { d.stats.energy = 100; }); });
  ok(await ev(() => window.__paw.ag.bonus() === false), 'no bonus without a training session');
  await t.home('training'); await t.p.click('[data-act=play]'); await t.waitPop(true); await t.p.click('[data-play=tricks]'); await t.until(() => !!window.__paw.train, null, 4000);
  ok(await ev(() => window.__paw.ag.bonus() === true && window.__paw.ag.bonus() === false), 'the Training Ground counts one extra step per session');
  await ev(() => window.__paw.go('yard')); await t.calm();
  await t.home('yard'); await t.p.click('[data-act=play]'); await t.waitPop(true); await t.p.click('[data-play=tricks]'); await t.until(() => !!window.__paw.train, null, 4000);
  ok(await ev(() => window.__paw.ag.bonus() === false), 'no bonus at the yard');
  await ev(() => window.__paw.go('yard')); await t.calm();
  /* ---- Splash Pool (ACTIVITIES part 2: paddle, flat faces, the vest, float fetch, the sprinkler, no coins, the Winter Dome; V215.md 6.2) ---- */
  sec('Splash Pool: the place, the lesson, the free vest, the arrival lines');
  await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.stats.energy = 100; d.stats.happy = 40; d.stats.clean = 20; }); });
  await t.home('yard');
  ok(await ev(() => !window.__paw.pl.on() && !document.querySelector('#placeBtns [data-pl]') && !window.__paw.pl.vest()), 'no pool button at the yard, no vest yet');
  await t.home('pool'); await t.sleep(500);
  ok(await ev(() => window.__paw.pl.on() && !!document.querySelector('#placeBtns [data-pl]')), 'at the Splash Pool: plOn, the Splash time button');
  ok(await t.until(() => [...document.querySelectorAll('#toasts .toast.gold')].some((e) => /Not every dog loves water, so let them wade in at their own pace/.test(e.textContent) && /A life vest and a ramp to climb out make every swim a safe one/.test(e.textContent)), null, 4000), 'the first-visit lesson (gold toast, the two sentences)');
  ok(await ev(() => window.__paw.S.pool.seen === true && window.__paw.S.pool.vest === true && window.__paw.S.inv.clothes.includes('Doggy Life Vest')), 'S.pool.seen and S.pool.vest are set, the Doggy Life Vest is in the wardrobe');
  {
    const V = await ev(() => { const c = window.__paw.pl.vestRow(); return c ? { slot: c.slot, price: c.price, reward: !!c.reward, fest: c.fest || null, shop: window.__paw.pl.inShop() } : null; });
    ok(V && V.slot === 'body' && V.price === 0 && V.reward && !V.fest && !V.shop, 'the vest is a body slot row, price 0, never in a shop: ' + JSON.stringify(V));
    const L = await ev(() => { const B = Object.keys(window.__paw.pl.lines); return { n: B.length, miss: B.filter((b) => !window.__paw.mp.line(b, 'pool')) }; });
    ok(L.n === 35 && !L.miss.length, `every one of the 35 breeds has a Splash Pool arrival line (${L.n}, missing ${L.miss.join(' ')})`);
    ok(await ev(() => { const l = window.__paw.pl.lesson(); return Array.isArray(l) && l.length === 4 && !/;/.test(l[3]); }), "Gerald's guide has the pool card");
    ok(await ev(() => window.__paw.ms.pool.includes('pool_paddle') && window.__paw.ms.pool.includes('pool_float')), 'the pool missions are in the pool');
    await ev(() => { document.querySelector('#placeBtns [data-pl]').click(); });
    ok(await t.until(() => window.__paw.pl.running(), null, 2000), 'the button opens the pool tray');
    await ev(() => window.__paw.pl.stop()); await t.sleep(200);
  }

  sec('Splash Pool: a paddle (ramp, water, climb out, shake), the rewards, once a day');
  const poolDog = await ev(() => window.__paw.S.dog.id);
  const snapP = () => ev(() => { const S = window.__paw.S; return { coins: S.coins, happy: S.stats.happy, clean: S.stats.clean, bl: S.bl ? S.bl.coins : 0, body: S.outfit.body || null }; });
  // sample the dog while it paddles: the x range, the shake pose, the vest, ripples
  const watch = (id) => ev((id) => {
    const w = window.__plW = { x0: 1e9, x1: -1e9, vest: false, shake: false, rip: 0 }; if (window.__plI) clearInterval(window.__plI);
    window.__plI = setInterval(() => { const P = window.__paw, p = P.rm.pos(id); if (!p) return; w.x0 = Math.min(w.x0, p.x); w.x1 = Math.max(w.x1, p.x); if (p.pose === 'shake') w.shake = true; if (id in P.pl.worn()) w.vest = true; w.rip = Math.max(w.rip, document.querySelectorAll('#fx .pl-rip').length); }, 100);
  }, id);
  const unwatch = () => ev(() => { clearInterval(window.__plI); return window.__plW; });
  const pre = await snapP();
  await ev(() => { window.__paw.S.dog.outfit.body = null; });
  await t.p.click('#placeBtns [data-pl]'); await t.p.waitForSelector('#plPaddle');
  ok(await ev(() => document.documentElement.classList.contains('pl-on') && !!document.querySelector('.pl-tray')), 'the pool tray opens');
  await t.SH('pool_tray');
  await watch(poolDog);
  await t.p.click('#plPaddle');
  ok(await t.until(() => { const s = window.__paw.pl.state; return !!s && s.ph === 'done'; }, null, 60000), 'the paddle runs to its end');
  {
    const w = await unwatch(), post = await snapP();
    ok(w.x1 > 800 && w.x0 < 1200, 'the dog went up the ramp and into the water (x ' + Math.round(w.x0) + ' to ' + Math.round(w.x1) + ')');
    ok(w.vest, 'the Doggy Life Vest was worn in the water');
    ok(post.body === null, 'and the dog is back to its own outfit after (' + post.body + ')');
    ok(w.shake, 'the dog shook (the shake pose)');
    ok(w.rip > 0, 'ripples round the dog in the pool');
    ok(post.happy - pre.happy >= 14.5 && post.happy - pre.happy <= 15.5, '+15 Happiness (' + (post.happy - pre.happy).toFixed(1) + ')');
    ok(post.clean >= 59.5, 'Cleanliness to at least 60 (' + post.clean + ')');
    ok(post.coins === pre.coins && post.bl === pre.bl, 'no pool coins (the coins stay at ' + post.coins + ')');
    ok(await ev((id) => window.__paw.pl.paddled(id), poolDog), 'S.pool.day has today for this dog');
    ok(await ev(() => /had a lovely paddle/.test(document.querySelector('.pl-tray h3').textContent) && /\+\d+ Happiness/.test(document.getElementById('plHint').textContent)), 'the result tray says so');
    await t.SH('pool_paddle_done');
  }
  await t.p.click('#plBack');
  ok(await t.until(() => window.__paw.pl.state && window.__paw.pl.state.ph === 'pick', null, 2000), 'Back to the pool returns to the pick tray');
  ok(await ev(() => document.getElementById('plPaddle').getAttribute('aria-disabled') === 'true' && /has paddled today/.test(document.getElementById('plHint').textContent)), 'a second paddle the same day is kindly refused');
  ok(await ev((id) => window.__paw.pl.paddle(id) === false, poolDog), 'plPaddle says no for a dog that paddled today');
  await t.p.click('#plDone');
  ok(await ev(() => !window.__paw.pl.running() && !document.documentElement.classList.contains('pl-on') && !!document.querySelector('#placeBtns [data-pl]')), 'Done leaves, the button is back');
  await ev(() => { window.__paw.S.pool.day = {}; });
  ok(await ev((id) => !window.__paw.pl.paddled(id), poolDog), 'a new day (cleared) lets the dog paddle again');

  sec('Splash Pool: a flat-faced dog paddles on the step only');
  const pug = await ev(() => { const d = window.__paw.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Mochi'); d.stats.energy = 100; d.stats.happy = 40; d.stats.clean = 20; return d.id; });
  const lead1 = await ev(() => window.__paw.S.activeId);
  await t.home('pool'); await t.sleep(400);
  ok(await ev((id) => window.__paw.pl.flat(id) && !window.__paw.pl.flat(window.__paw.S.activeId), pug) && await ev(() => ['pug', 'frenchie', 'shihtzu'].every((k) => window.__paw.pl.flatList.includes(k))), 'the pug is flat-faced (pug, frenchie, shihtzu are on the list)');
  await watch(pug);
  ok(await ev((id) => window.__paw.pl.paddle(id), pug), 'the pug starts a paddle (picked from the pack)');
  ok(await ev((id) => window.__paw.S.activeId === id, pug), 'the picked dog leads the run (pkWith)');
  ok(await ev(() => /wide step/.test(document.getElementById('plHint').textContent)), 'the tray says it stays on the wide step');
  ok(await t.until(() => { const s = window.__paw.pl.state; return !!s && s.ph === 'done'; }, null, 60000), 'the pug paddle finishes');
  {
    const w = await unwatch();
    ok(w.x1 <= 520, 'the pug never went past the step (x ' + Math.round(w.x0) + ' to ' + Math.round(w.x1) + ')');
    ok(w.vest && w.shake, 'it wore the vest and shook as well');
    ok(await ev((id) => window.__paw.pl.paddled(id) && window.__paw.S.dogs.find((d) => d.id === id).stats.happy >= 54, pug), 'the pug has its +15 Happiness');
    await t.SH('pool_flat_step');
  }
  await t.p.click('#plDone');
  ok(await t.until((id) => window.__paw.S.activeId === id, lead1, 4000), 'the old leader is back (pkBack)');

  sec('Splash Pool: the sprinkler gives Happiness only');
  await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.stats.energy = 100; d.stats.happy = 40; }); });
  {
    const a = await snapP(); const id = await ev(() => window.__paw.S.dog.id);
    ok(await ev((id) => window.__paw.pl.sprinkle(id), id), 'the sprinkler run starts');
    ok(await t.until(() => { const s = window.__paw.pl.state; return !!s && s.ph === 'done'; }, null, 40000), 'the sprinkler run ends');
    const b = await snapP();
    ok(b.happy - a.happy >= 4.5 && b.happy - a.happy <= 5.5 && b.coins === a.coins && Math.abs(b.clean - a.clean) < 1, `Happiness +5 only (+${(b.happy - a.happy).toFixed(1)}), no coins, Cleanliness the same`);
    ok(await ev((id) => !window.__paw.pl.paddled(id), id), "the sprinkler is not the day's paddle");
    await t.p.click('#plDone');
  }

  sec('Splash Pool: float fetch (ball play with o.water) shares the ball play coin cap');
  await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.stats.energy = 100; }); if (!S.inv.toys.includes('Tennis Ball')) S.inv.toys.push('Tennis Ball'); S.bl = { day: window.__paw.pl.today(), coins: 0, n: 0 }; });
  await t.p.click('#placeBtns [data-pl]'); await t.p.waitForSelector('.pl-toy');
  ok(await ev(() => !!document.querySelector('.pl-float .pl-toy[data-toy="Tennis Ball"]')), 'the tray offers float fetch with the owned fetch toys');
  await t.p.click('.pl-toy[data-toy="Tennis Ball"]');
  ok(await t.until(() => window.__paw.bl.on, null, 4000), 'float fetch starts ball play');
  {
    const st = await ev(() => ({ pool: window.__paw.bl.state.zone.no.some((b) => b[5] === 'pool'), vest: Object.keys(window.__paw.pl.worn()).length }));
    ok(!st.pool, 'the pool is not a no-go box for float fetch');
    ok(st.vest >= 1, 'the dogs wear the life vest in the water');
    await t.SH('pool_float_fetch');
  }
  await ev(() => { window.__paw.S.bl.coins = window.__paw.bl.cap.day - 2; });
  await ev(() => window.__paw.bl.stop()); await t.sleep(300);
  ok(await ev(() => Object.keys(window.__paw.pl.worn()).length === 0 && !!document.querySelector('#placeBtns [data-pl]')), 'after float fetch the vest comes off and the pool button is back');
  ok(await ev(() => window.__paw.S.bl.coins <= window.__paw.bl.cap.day), 'ball play coins stay inside BL_COIN_DAY (' + await ev(() => window.__paw.S.bl.coins) + ')');
  ok(await ev(() => !window.__paw.bl.on && !window.__paw.pl.running()), 'both are closed');

  sec('Splash Pool: a puppy under 3 months stays out');
  {
    const pp = await ev(() => { const d = window.__paw.addDog({ key: 'corgi', sex: 'male', months: 2 }, 'Tiny'); return d.id; });
    ok(await ev((id) => window.__paw.pl.paddle(id) === false, pp), 'a 2 month puppy does not paddle (a kind note, nothing bad)');
  }

  sec('Splash Pool: the Winter Dome (winter, the pool stays open)');
  await t.newGame({ season: 'winter', ground: true }, { coins: 1000, bond: { level: 7, pts: 1600 }, stats: { hunger: 80, happy: 40, energy: 100, clean: 20 } });
  await t.home('pool'); await t.sleep(600);
  ok(await ev(() => window.__paw.pl.on() && !!document.querySelector('#placeBtns [data-pl]')), 'in winter the pool activities are on');
  ok(await ev(() => !!document.querySelector('#view svg.world') && document.querySelector('#view svg.world').innerHTML.length > 20000), 'the winter pool scene is drawn');
  await t.SH('pool_winter_dome');
  {
    const id = await ev(() => window.__paw.S.dog.id), a = await snapP();
    ok(await ev((id) => window.__paw.pl.paddle(id), id), 'a paddle starts under the dome');
    ok(await t.until(() => { const s = window.__paw.pl.state; return !!s && s.ph === 'done'; }, null, 60000), 'and finishes in winter');
    const b = await snapP(); ok(b.happy - a.happy >= 14.5, 'with its +15 Happiness (' + (b.happy - a.happy).toFixed(1) + ')');
    await t.SH('pool_winter_paddle');
    await t.p.click('#plDone');
  }

  sec('Run gates (ACTIVITIES part 3, details in v215_tracks): the arch starts a walk with the pickArea checks');
  await t.newGame({ ground: true }, { coins: 500, bond: { level: 8, pts: 1600 }, stats: { hunger: 90, happy: 80, energy: 100, clean: 90 } });
  for (const [pl, route] of [['sunflower', 'sunflower'], ['bamboo', 'bamboo'], ['cliffs', 'cliffs'], ['square', 'town'], ['pier', 'pier']]) {
    await t.home(pl); await t.sleep(300);
    ok(await ev(() => { const h = document.querySelector('#sceneG [data-hot="run"]'); return !!h && h.classList.contains('hot') && h.getAttribute('role') === 'button'; }), `${pl}: a run gate button stands in the scene`);
    await ev(() => { window.__paw.S.stats.energy = 15; });
    await ev(() => document.querySelector('#sceneG [data-hot="run"]').dispatchEvent(new MouseEvent('click', { bubbles: true }))); await t.sleep(300);
    ok(await ev(() => window.__paw.mode === 'yard'), `${pl}: Energy 15, no walk`);
    await ev(() => { window.__paw.S.stats.energy = 100; });
    await ev(() => document.querySelector('#sceneG [data-hot="run"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    ok(await t.until((r) => window.__paw.mode === 'walk' && window.__paw.W && window.__paw.W.area === r, route, 6000), `${pl}: Energy 100, the walk on ${route} starts`);
    await ev(() => { window.__paw.S.sleeping = false; window.__paw.go('yard'); }); await t.calm();
  }
}, { ground: true });
