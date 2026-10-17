// v2.11 TRAVEL lane test (V211.md section 5.3), desktop 1280 x 720, prefs.tkTest. Without tkTest there is no Station and S.tk only gets its defaults.
// The Station pin is locked below Bond 3, the day ticket costs 60 once a day, the ride (every dog's head at a window, a tap skips it, the care note once),
// the Japan map (a pin per place, the locks, the Stamp book button, Tokyo Station "Ride home"), each place loads with the whole pack, every hot spot
// (Hachiko, the crossing, the souvenir stands, omikuji, the Nakamise treats, the lantern photo, hanami, the sunset walk, Yoyogi ball play), the seven
// stamps and the book, the tokyo photo frame, the care notes once, the Map button in Tokyo, the ride home, the two missions, the town shops never list
// the souvenirs, the pack roams in every place (prefs.rmTest), an old save loads, no console errors.
// node game/run_tests.js v211_tokyo   (PAW_SHOTS=1 writes game/shots_v211_tokyo/)
require('./test_lib').run('v211_tokyo', async (t) => {
  const { ok, sec, ev } = t;
  const p = () => t.p;
  const motion = (on) => ev((on) => { document.documentElement.dataset.motion = on ? 'on' : 'off'; }, on);
  const quiet = () => ev(() => { window.__toasts.splice(0); document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); });
  const toasts = () => ev(() => window.__toasts.slice());
  const S = () => t.S();
  const hot = (id) => ev((id) => { const g = document.querySelector(`#sceneG [data-hot="${id}"]`); if (!g) return false; g.dispatchEvent(new MouseEvent('click', { bubbles: true })); return true; }, id);
  const idle = () => t.until(() => !window.__paw.tk.busy && !window.__paw.tk.riding && window.__paw.tk.pending === 0, null, 15000);
  const at = async (k) => {
    await ev((k) => { const s = window.__paw.S; s.sleeping = false; s.place = k; window.__paw.go('yard'); }, k);
    await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard' && !!document.querySelector('#placeBtns [data-tk]'), k, 6000); await t.lu();
  };
  const btns = () => ev(() => [...document.querySelectorAll('#placeBtns .btn')].map((b) => b.textContent));
  const hots = () => ev(() => [...document.querySelectorAll('#sceneG [data-hot]')].map((h) => h.getAttribute('data-hot')).sort().join(','));
  const pts = async () => (await S()).bond.pts;
  const toJapan = async () => { await ev(() => window.__paw.go('japan')); await t.untilMode('japan'); };
  const pick = async (k) => { await toJapan(); await ev((k) => window.__paw.tk.pick(k), k); await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard' && !!document.querySelector('#placeBtns [data-tk]'), k, 6000); await t.lu(); };

  /* ======================= without tkTest ======================= */
  sec('without tkTest: no Station, no Tokyo places');
  await t.newGame({}, { bond: { level: 6, pts: 1500 } });
  let s = await S();
  ok(await ev(() => !window.__paw.tk.on() && window.__paw.tk.places().length === 0), 'tkOn() is false and PLACES has no Tokyo place');
  ok(s.tk && s.tk.day === null && s.tk.rides === 0 && JSON.stringify(s.tk.stamps) === '{}' && s.tk.frame === false, 'S.tk has its defaults (day null, rides 0, no stamps, no frame)');
  await p().click('[data-act=map]'); await t.untilMode('map');
  ok(await ev(() => !document.querySelector('[data-area=station]')), 'the town map has no Station pin');
  ok(await ev(() => { const seen = new Set(); for (let i = 0; i < 200; i++) window.__paw.ms.pick('x' + i).forEach((m) => seen.add(m.id)); return !seen.has('tokyo_ride') && !seen.has('tokyo_stamp'); }), 'the Tokyo missions are not eligible');
  await t.ctx.close();

  /* ======================= Bond 2: the Station is locked ======================= */
  sec('tkTest, Bond 2: the Station pin is locked');
  await t.newGame({ prefs: { tkTest: true } }, { bond: { level: 2, pts: 300 }, coins: 500 });
  await p().click('[data-act=map]'); await t.untilMode('map'); await p().waitForSelector('[data-area=station]');
  ok(await ev(() => { const g = document.querySelector('[data-area=station]'); return /Bond 3/.test(g.textContent) || g.classList.contains('locked') || /locked/.test(g.getAttribute('aria-label') || ''); }), 'the Station pin shows the Bond 3 lock');
  await quiet(); await ev(() => window.__paw.mapTo('station')); await p().click('[data-area=station]');
  ok(await t.until(() => window.__toasts.some((x) => /Station opens at Bond 3/.test(x)), null, 3000), 'tapping it at Bond 2 says it opens at Bond 3');
  ok(await ev(() => document.getElementById('modal').hidden && window.__paw.mode === 'map' && window.__paw.S.coins === 500), 'no ticket window, no coins spent');
  ok(await ev(() => { const seen = new Set(); for (let i = 0; i < 200; i++) window.__paw.ms.pick('x' + i).forEach((m) => seen.add(m.id)); return !seen.has('tokyo_ride'); }), 'tokyo_ride is not eligible below Bond 3');
  await t.ctx.close();

  /* ======================= Bond 3: the ticket, the ride, the Japan map ======================= */
  sec('Bond 3: the day ticket and the ride');
  await t.newGame({ prefs: { tkTest: true } }, { bond: { level: 3, pts: 460 }, coins: 500 });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'dachs', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); });
  await t.calm(); await t.home('yard');
  ok(await ev(() => { const seen = new Set(); for (let i = 0; i < 300; i++) window.__paw.ms.pick('x' + i).forEach((m) => seen.add(m.id)); return seen.has('tokyo_ride') && seen.has('tokyo_stamp'); }), 'tokyo_ride and tokyo_stamp are eligible at Bond 3');
  await p().click('[data-act=map]'); await t.untilMode('map'); await ev(() => window.__paw.mapTo('station'));
  await p().click('[data-area=station]'); await t.waitH2(/Station/);
  ok(await ev(() => /Shinkansen day ticket, 60 coins/.test(document.querySelector('#modal .panel').textContent) && /Buy a ticket \(60\)/.test(document.getElementById('tkGo').textContent)), 'the ticket window: "Shinkansen day ticket, 60 coins", Buy a ticket (60)');
  await t.SH('station');
  await motion(true); await quiet();
  await p().click('#tkGo');
  await t.until(() => !!document.querySelector('.tk-ride'), null, 3000);
  s = await S();
  ok(s.coins === 440 && !!s.tk.day && s.tk.rides === 1, `60 coins paid (${s.coins}), S.tk.day set, rides 1`);
  ok(await ev(() => document.querySelectorAll('.tk-ride .tk-head').length === 3 || (!!document.querySelector('.tk-ride svg') && document.querySelectorAll('.tk-ride .pa-wd-head, .tk-ride .tk-head').length >= 3)), 'every dog\'s head is at a window (3 dogs)');
  await t.sleep(1200); await t.SH('ride');
  await p().click('.tk-ride'); await t.untilMode('japan', 3000);
  ok(!(await ev(() => !!document.querySelector('.tk-ride'))), 'a tap skips the ride and the Japan map opens');
  ok(await t.until(() => window.__toasts.some((x) => /closed carrier/.test(x)), null, 7000), 'the first ride shows its care note (after the welcome)');

  sec('the Japan map');
  const jm = await ev(() => ({ pins: [...document.querySelectorAll('#mapInner [data-area]')].map((g) => g.getAttribute('data-area')).sort().join(','), locked: [...document.querySelectorAll('#mapInner [data-area]')].filter((g) => /Bond \d/.test(g.textContent) || g.classList.contains('locked')).map((g) => g.getAttribute('data-area')).sort().join(','), book: !!document.getElementById('tkBookBtn'), x: document.getElementById('mapX').hidden, bar: document.getElementById('bar').hidden }));
  ok(jm.pins === 'asakusa,odaiba,shibuya,station,tokyotower,ueno,yoyogi', 'a pin per place plus Tokyo Station: ' + jm.pins);
  ok(jm.locked === 'asakusa,odaiba,tokyotower,ueno', 'at Bond 3 Asakusa, Ueno, Tokyo Tower and Odaiba show their Bond: ' + jm.locked);
  ok(jm.book && jm.x, 'the Stamp book button is there, the X is hidden on arrival (Tokyo Station takes you home)');
  ok(await ev(() => /Ride home/.test(document.querySelector('#mapInner [data-area=station]').textContent) || /Ride home/.test(document.querySelector('#mapInner [data-area=station]').getAttribute('aria-label') || '')), 'Tokyo Station says Ride home');
  await t.SH('japanmap');
  await quiet(); await p().click('#mapInner [data-area=asakusa]');
  ok(await t.until(() => window.__toasts.some((x) => /opens at Bond 4/.test(x)), null, 3000) && (await t.mode()) === 'japan', 'a locked place says its Bond and the map stays');
  await p().click('#tkBookBtn'); await t.waitH2(/Stamp book/);
  ok(await ev(() => document.querySelectorAll('#modal .tk-stamp').length === 7 && document.querySelectorAll('#modal .tk-stamp.got').length === 0), 'the Stamp book shows seven empty stamps');
  await t.closeX();

  sec('Shibuya: the place, the pack, the care note, the buttons');
  await motion(false); await quiet();
  await p().click('#mapInner [data-area=shibuya]');
  await t.until(() => window.__paw.S.place === 'shibuya' && window.__paw.mode === 'yard' && !!document.querySelector('#placeBtns [data-tk]'), null, 6000); await t.lu();
  ok(await ev(() => document.querySelectorAll('#pack .rmdog').length === 3), 'the whole pack came along (3 dogs in the scene)');
  ok((await hots()) === 'crossing,hachiko,souvenir,stamp', 'Shibuya hot spots: ' + (await hots()));
  let b = await btns();
  ok(b.includes('Sit with Hachikō') && b.includes('Japan map') && !b.includes('Go home'), 'the buttons: Sit with Hachikō, Japan map, and no Go home: ' + b.join('|'));
  ok(await t.until(() => window.__toasts.some((x) => /Busy crossings are loud/.test(x)), null, 4000), 'the Shibuya care note shows on the first visit');
  ok((await S()).tk.seen.shibuya === 1, 'S.tk.seen.shibuya is set');
  await t.SH('shibuya');

  sec('the Map button in Tokyo');
  await p().click('[data-act=map]'); await t.untilMode('japan');
  ok(await ev(() => !document.getElementById('mapX').hidden), 'in a Tokyo place the Map button opens the Japan map, with the X back');
  await p().click('#mapX'); await t.untilMode('yard');
  ok((await S()).place === 'shibuya', 'the X goes back to Shibuya Crossing');

  sec('Shibuya: the stamp, Hachiko, the crossing, the souvenir stand');
  await quiet(); let p0 = await pts();
  ok(await hot('stamp'), 'the stamp hot spot is there');
  await t.until(() => !!(window.__paw.S.tk.stamps.shibuya), null, 3000);
  ok((await pts()) - p0 === 20 && (await toasts()).some((x) => /Shibuya stamp is in your book \(1 of 7\)/.test(x)), 'the first Shibuya stamp: +20 Bond points and a stamp toast');
  await quiet(); p0 = await pts(); await hot('stamp'); await t.sleep(300);
  ok((await pts()) === p0 && (await toasts()).some((x) => /already in your book/.test(x)), 'a second tap pays nothing');
  await quiet(); p0 = await pts();
  await hot('hachiko'); await idle();
  s = await S();
  ok(s.tk.hachi && s.tk.stamps.hachiko && s.bond.pts - p0 === 35, `Hachikō: today's sit, the hachiko stamp, +15 +20 Bond points (${s.bond.pts - p0})`);
  ok(await t.until(() => window.__toasts.some((x) => /Hachikō waited at Shibuya Station for his person every day for years/.test(x)), null, 4000), 'the first sit tells the Hachikō story');
  const sat = await ev(() => window.__paw.S.dogs.map((d) => window.__paw.rm.pos(d.id)));
  const hb = await ev(() => { const svg = document.querySelector('#view > svg.world'), r = document.querySelector('#sceneG [data-hot=hachiko]').getBoundingClientRect(), M = svg.getScreenCTM().inverse(), a = new DOMPoint(r.left, r.top).matrixTransform(M), c = new DOMPoint(r.right, r.bottom).matrixTransform(M); return [a.x, c.x]; });
  ok(sat.every((q) => q.x > hb[0] - 420 && q.x < hb[1] + 420), 'the pack gathered by the statue: ' + JSON.stringify(sat.map((q) => Math.round(q.x))));
  await quiet(); p0 = await pts(); await hot('hachiko'); await t.sleep(300);
  ok((await pts()) === p0 && (await toasts()).some((x) => /already sat with Hachikō today/.test(x)), 'Hachikō is once a day');
  b = await btns(); ok(b.includes('Sat with Hachikō'), 'the button says Sat with Hachikō after');
  const x0 = await ev(() => window.__paw.rm.pos(window.__paw.S.activeId).x);
  await hot('crossing'); await idle();
  const x1 = await ev(() => window.__paw.rm.pos(window.__paw.S.activeId).x);
  ok((x0 > 500 && x1 < 500) || (x0 <= 500 && x1 > 500), `the pack crossed to the far side (leader x ${Math.round(x0)} -> ${Math.round(x1)})`);
  await hot('souvenir'); await t.waitH2(/Souvenirs/);
  ok(await ev(() => /Shibuya Bandana/.test(document.querySelector('#modal').textContent) && !/Asakusa Bandana/.test(document.querySelector('#modal').textContent)), 'the Shibuya stand has the Shibuya Bandana');
  await t.SH('souvenirs');
  await t.closeX(); await ev(() => window.__paw.tk.shopBuy('Shibuya Bandana')); await t.sleep(300);
  s = await S(); ok(s.inv.clothes.includes('Shibuya Bandana') && s.coins === 380, `bought the Shibuya Bandana for 60 (coins ${s.coins})`);
  await t.closeX();

  /* ======================= every place at Bond 6 ======================= */
  sec('Bond 6: every place, its hot spots and buttons');
  await t.patch({ bond: { level: 6, pts: 1500 }, coins: 2000 }); await t.lu();
  const want = { shibuya: 'crossing,hachiko,souvenir,stamp', yoyogi: 'stamp', asakusa: 'lantern,nakamise,omikuji,souvenir,stamp', ueno: 'hanami,stamp', tokyotower: 'souvenir,stamp', odaiba: 'stamp,sunset' };
  const care = { yoyogi: /Dog runs have their own rules/, asakusa: /only welcome dogs in a carrier/, ueno: /Picnic food is for people/, tokyotower: /City pavements get hot/, odaiba: /Sea water is salty/ };
  for (const k of ['yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba']) {
    await quiet(); await pick(k);
    ok(await ev(() => document.querySelectorAll('#pack .rmdog').length === 3), `${k}: the whole pack (3 dogs)`);
    ok((await hots()) === want[k], `${k}: hot spots ${await hots()}`);
    ok(await t.until((re) => window.__toasts.some((x) => new RegExp(re).test(x)), care[k].source, 4000), `${k}: its care note on the first visit`);
    ok(await ev(() => !document.querySelector('#placeBtns [data-pb=yard]') && !!document.querySelector('#placeBtns [data-tk=map]')), `${k}: Japan map instead of Go home`);
    await t.SH('place_' + k);
  }

  sec('Asakusa: omikuji, Nakamise, the lantern, the souvenirs');
  await at('asakusa'); await quiet();
  let c0 = (await S()).coins;
  await hot('omikuji'); await t.waitH2(/Omikuji/);
  const fortunes = await ev(() => window.__paw.tk.fortunes);
  ok(await ev((f) => f.some((x) => document.querySelector('#modal .tk-fortune').textContent.includes(x)), fortunes), 'the fortune is one of the kind ones');
  s = await S(); ok(s.coins === c0 - 10 && !!s.tk.omi, 'omikuji: 10 coins, today');
  await t.closeX(); await quiet(); await hot('omikuji'); await t.sleep(300);
  ok((await S()).coins === c0 - 10 && (await toasts()).some((x) => /today's fortune already/.test(x)), 'omikuji is once a day');
  c0 = (await S()).coins; const h0 = (await S()).dogs.map((d) => d.stats.happy);
  await hot('nakamise'); await t.waitH2(/Nakamise/);
  ok(await ev(() => /Sweet Potato Strip/.test(document.querySelector('#modal').textContent) && /Dog Senbei/.test(document.querySelector('#modal').textContent) && /no salt and no soy/.test(document.querySelector('#modal').textContent)), 'Nakamise: Sweet Potato Chew and Dog Senbei, with the food-safety tip');
  await ev(() => window.__paw.tk.snack('Dog Senbei')); await t.sleep(300);
  s = await S(); ok(s.coins === c0 - 36 && !!s.tk.snack, `one Dog Senbei for each of the 3 dogs: 36 coins (${c0 - s.coins})`);
  ok(s.dogs.every((d, i) => d.stats.happy > h0[i] || d.stats.happy >= 99), 'every dog got happier: ' + JSON.stringify([h0, s.dogs.map((d) => d.stats.happy)]));
  await quiet(); ok((await ev(() => window.__paw.tk.snack('Sweet Potato Strip'))) === false && (await S()).coins === c0 - 36, 'one treat a day');
  await t.closeX();
  await hot('lantern'); await t.until(() => { const m = document.getElementById('phMode'); return !!m && !m.hidden; }, null, 8000);
  ok(await ev(() => { const m = document.getElementById('phMode'); return !!m && !m.hidden; }), 'the lantern: the pack gathers and photo mode opens');
  await p().click('#phClose'); await t.until(() => { const m = document.getElementById('phMode'); return !m || m.hidden; }, null, 3000); await idle();
  await hot('souvenir'); await t.waitH2(/Souvenirs/);
  ok(await ev(() => /Asakusa Bandana/.test(document.querySelector('#modal').textContent) && /Lucky Cat/.test(document.querySelector('#modal').textContent)), 'the Asakusa stand has the Asakusa Bandana and the Lucky Cat');
  await t.closeX(); await ev(() => window.__paw.tk.shopBuy('Lucky Cat')); await t.sleep(300);
  s = await S(); ok(!!(s.decor && s.decor['Lucky Cat']) && s.decor['Lucky Cat'].out === false, 'the Lucky Cat is bought and waits at home');
  await t.closeX();

  sec('Ueno, Tokyo Tower, Odaiba, Yoyogi');
  await at('ueno'); await quiet();
  let hp = (await S()).dogs.map((d) => d.stats.happy);
  await hot('hanami'); await idle();
  s = await S(); ok(!!s.tk.hanami && s.dogs.every((d, i) => d.stats.happy >= Math.min(99, hp[i] + 7)), 'Ueno: the rest by the pond (summer), +8 Happiness for the pack, today: ' + JSON.stringify([s.tk.hanami, hp, s.dogs.map((d) => d.stats.happy)]));
  await quiet(); await hot('hanami'); await t.sleep(300); ok((await toasts()).some((x) => /Ueno rest today/.test(x)), 'Ueno is once a day');
  await at('tokyotower');
  await hot('souvenir'); await t.waitH2(/Souvenirs/);
  ok(await ev(() => /Tokyo Tower Bandana/.test(document.querySelector('#modal').textContent) && /Shinkansen Plush/.test(document.querySelector('#modal').textContent)), 'the Tokyo Tower stand has the bandana and the plush');
  await t.closeX(); await ev(() => window.__paw.tk.shopBuy('Shinkansen Plush')); await t.sleep(300);
  ok((await S()).inv.toys.includes('Shinkansen Plush') && (await ev(() => window.PawToys.supports('Shinkansen Plush'))), 'the Shinkansen Plush is a toy with its own play game');
  await t.closeX();
  await at('odaiba'); await quiet(); hp = (await S()).dogs.map((d) => d.stats.happy);
  await hot('sunset'); await idle();
  s = await S(); ok(!!s.tk.sunset && s.dogs.every((d, i) => d.stats.happy >= Math.min(99, hp[i] + 7)), 'Odaiba: the sunset walk, +8 Happiness for the pack, today: ' + JSON.stringify([s.tk.sunset, hp, s.dogs.map((d) => d.stats.happy)]));
  await quiet(); await hot('sunset'); await t.sleep(300); ok((await toasts()).some((x) => /sunset walk today/.test(x)), 'the sunset walk is once a day');
  await at('yoyogi');
  await p().click('#placeBtns [data-tk=ball]');
  ok(await t.until(() => !!(window.__paw.bl && window.__paw.bl.on), null, 3000), 'Yoyogi: Ball play starts the v2.10 ball play');
  await ev(() => window.__paw.bl.stop()); await t.until(() => !window.__paw.bl.on, null, 3000);

  sec('the seven stamps, the book, the tokyo frame');
  await quiet();
  for (const k of ['yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba']) { await at(k); await hot('stamp'); await t.until((k) => !!window.__paw.S.tk.stamps[k], k, 3000); }
  s = await S();
  ok(Object.keys(s.tk.stamps).length === 7 && s.tk.frame === true, 'all seven stamps: S.tk.frame is true');
  ok(await t.until(() => window.__toasts.some((x) => /All seven stamps! The Tokyo photo frame is yours/.test(x)), null, 4000), 'the gold toast for the frame');
  await ev(() => window.__paw.tk.book()); await t.waitH2(/Stamp book/);
  ok(await ev(() => document.querySelectorAll('#modal .tk-stamp.got').length === 7), 'the book shows all seven stamps');
  await t.SH('book'); await t.closeX();
  await p().click('#phBtn'); await t.until(() => { const m = document.getElementById('phMode'); return !!m && !m.hidden; }, null, 5000);
  ok(await ev(() => !!document.querySelector('#phMode [data-frame=tokyo]')), 'photo mode lists the Tokyo stamps frame');
  await p().click('#phMode [data-frame=tokyo]');
  ok(await t.until(() => { const i = document.querySelector('#phMode .ph-pic'); return !!i && /^data:image\/svg/.test(i.src || '') && !document.getElementById('phMode').classList.contains('ph-busy'); }, null, 8000), 'the tokyo frame draws a postcard');
  await t.SH('frame');
  await p().click('#phClose'); await t.until(() => { const m = document.getElementById('phMode'); return !m || m.hidden; }, null, 3000);

  sec('care notes once, the ride home, the ticket is good all day');
  await quiet(); await pick('shibuya'); await t.sleep(2000);
  ok(!(await toasts()).some((x) => /Busy crossings/.test(x)), 'the Shibuya care note does not show again');
  await toJapan(); await quiet();
  await p().click('#mapInner [data-area=station]');
  await t.untilMode('yard', 5000);
  s = await S(); ok(s.place === 'yard' && s.tk.rides === 2, 'Ride home: the ride (Motion off: instant), then the yard');
  ok(!(await toasts()).some((x) => /closed carrier/.test(x)), 'the ride care note does not show again');
  c0 = s.coins;
  await p().click('[data-act=map]'); await t.untilMode('map'); await ev(() => window.__paw.mapTo('station'));
  await p().click('[data-area=station]'); await t.waitH2(/Station/);
  ok(await ev(() => /Ride to Tokyo/.test(document.getElementById('tkGo').textContent)), 'the same day: Ride to Tokyo, no new ticket');
  await p().click('#tkGo'); await t.untilMode('japan', 4000);
  ok((await S()).coins === c0, 'no coins for a second ride the same day');
  await ev(() => { window.__paw.S.tk.day = '2000-1-1'; }); await ev(() => window.__paw.tk.pick('station')); await t.untilMode('yard', 4000);
  await p().click('[data-act=map]'); await t.untilMode('map'); await ev(() => window.__paw.mapTo('station'));
  await p().click('[data-area=station]'); await t.waitH2(/Station/);
  ok(await ev(() => /Buy a ticket/.test(document.getElementById('tkGo').textContent)), 'a new day needs a new ticket');
  await t.closeX();

  sec('the town shops never list the souvenirs');
  await t.home('market'); await t.sleep(400);
  const shopTxt = await ev(async () => {
    const out = []; const open = (k) => { document.querySelector(`#placeBtns [data-sh="${k}"]`).click(); return document.querySelector('#modal').textContent; };
    out.push(open('boutique')); document.querySelector('#modal .x').click();
    out.push(open('kibble')); const tb = document.querySelector('#modal [data-tab=toys]'); if (tb) { tb.click(); out.push(document.querySelector('#modal').textContent); }
    document.querySelector('#modal .x').click();
    out.push(open('builder')); const dt = document.querySelector('#modal [data-btab=decor]'); if (dt) { dt.click(); out.push(document.querySelector('#modal').textContent); }
    document.querySelector('#modal .x').click(); return out.join(' ');
  });
  ok(!/Shibuya Bandana|Asakusa Bandana|Tokyo Tower Bandana|Shinkansen Plush|Lucky Cat|Dog Senbei|Sweet Potato Strip/.test(shopTxt), 'the Boutique, Kibble Corner and Barkitecture list none of the Tokyo things: ' + ((shopTxt.match(/Shibuya Bandana|Asakusa Bandana|Tokyo Tower Bandana|Shinkansen Plush|Lucky Cat|Dog Senbei|Sweet Potato Chew(?!s)/g) || []).join() || shopTxt.length));
  await t.ctx.close();

  /* ======================= roaming in every place ======================= */
  sec('prefs.rmTest: the pack roams in every Tokyo place');
  await t.newGame({ prefs: { tkTest: true, rmTest: true } }, { bond: { level: 6, pts: 1500 } });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'beagle', sex: 'male', months: 14 }, 'Bagel'); P.addDog({ key: 'samoyed', sex: 'female', months: 30 }, 'Cloud'); });
  await t.calm(); await ev(() => window.__paw.idle.speed(0.05));
  for (const k of ['shibuya', 'yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba']) {
    await at(k);
    const ids = (await S()).dogs.map((d) => d.id), a = await ev((l) => l.map((id) => window.__paw.rm.pos(id)), ids);
    const moved = await t.until(([l, a]) => l.some((id, i) => { const q = window.__paw.rm.pos(id); return Math.hypot(q.x - a[i].x, q.y - a[i].y) > 20; }), [ids, a], 20000);
    const z = await ev((k) => window.__paw.rm.zone(k), k);
    ok(moved && z.y0 >= 400 && z.y1 <= 592, `${k}: a dog of the pack walked on its own (zone y ${z.y0}-${z.y1})`);
  }
  await t.ctx.close();

  /* ======================= the two missions (prefs.msTest: a mission pays coins, so only here) ======================= */
  sec('the missions tokyo_ride and tokyo_stamp');
  await t.newGame({ prefs: { tkTest: true, msTest: true } }, { bond: { level: 3, pts: 460 } });
  await motion(false); await ev(() => window.__paw.ms.force(['tokyo_ride', 'tokyo_stamp']));
  await ev(() => window.__paw.tk.ride('out')); await t.untilMode('japan', 3000);
  ok(await t.until(() => !!window.__paw.S.missions.list.find((m) => m.id === 'tokyo_ride').done, null, 3000), 'the ride to Tokyo completes tokyo_ride');
  await ev(() => window.__paw.tk.pick('shibuya')); await t.until(() => window.__paw.S.place === 'shibuya' && window.__paw.mode === 'yard', null, 5000); await t.lu();
  await hot('stamp');
  ok(await t.until(() => !!window.__paw.S.missions.list.find((m) => m.id === 'tokyo_stamp').done, null, 3000), 'a new station stamp completes tokyo_stamp');
  await t.ctx.close();

  /* ======================= review fixes (v2.11 review) ======================= */
  sec('review fixes: the ride keys, the status chip, Escape, Walk hidden, leaving mid-walk, Hachiko on day 2');
  await t.newGame({ prefs: { tkTest: true } }, { bond: { level: 3, pts: 460 }, coins: 500 });
  await motion(true); await ev(() => window.__paw.tk.ride('out')); await t.until(() => !!document.querySelector('.tk-ride'), null, 3000);
  await p().keyboard.press('2'); await t.sleep(250);
  ok(await ev(() => !!document.querySelector('.tk-ride') && !document.querySelector('#dock .tray:not(.dock-idle):not(.mini)')), 'the number keys do nothing under the ride');
  await p().keyboard.press('Escape'); await t.untilMode('japan', 3000);
  ok(!(await ev(() => !!document.querySelector('.tk-ride'))), 'Escape skips the ride');
  ok(await ev(() => document.querySelector('#status .pname').textContent === 'Tokyo'), 'the status chip says Tokyo on the Japan map');
  await p().keyboard.press('Escape'); await t.untilMode('yard', 3000);
  ok((await S()).place === 'yard', 'Escape on the Japan map straight from the ride goes home');
  await at('shibuya');
  ok(await ev(() => getComputedStyle(document.querySelector('#bar [data-act=walk]')).display === 'none' && getComputedStyle(document.querySelector('#bar [data-act=care]')).display !== 'none'), 'Walk is hidden in a Tokyo place, Care stays');
  await p().keyboard.press('4'); await t.sleep(300); ok((await t.mode()) === 'yard', 'the Walk key does nothing in Tokyo');
  ok((await btns()).includes('Stamp'), 'a Stamp button until the place is stamped');
  await p().click('[data-act=map]'); await t.untilMode('japan'); await p().keyboard.press('Escape'); await t.untilMode('yard', 3000);
  ok((await S()).place === 'shibuya', 'Escape on the Japan map goes back to the place');
  await motion(true); await quiet(); const p1 = await pts();
  await hot('hachiko'); await t.sleep(250); await p().click('[data-act=map]'); await t.untilMode('japan');
  ok(await ev(() => !window.__paw.tk.busy && !!window.__paw.S.tk.hachi), 'leaving mid-walk frees the hold at once and still pays the sit');
  ok((await pts()) - p1 === 35, 'the sit and its first stamp were paid (+35 Bond points)');
  await ev(() => window.__paw.tk.pick('yoyogi'));
  ok(await t.until(() => window.__paw.S.place === 'yoyogi' && window.__paw.mode === 'yard', null, 5000), 'a pin tap right after works');
  ok(!(await toasts()).some((x) => /Everyone is under the lantern/.test(x)), 'nothing from the walk shows on the map');
  await motion(false); await at('shibuya'); await quiet();
  await ev(() => { window.__paw.S.tk.hachi = '2000-01-01'; }); await hot('hachiko'); await idle(); await t.sleep(600);
  ok(!(await toasts()).some((x) => /already in your book/.test(x)) && (await toasts()).some((x) => /quietly with Hachikō/.test(x)), 'Hachikō on a later day: the sit, no stamp toast');
  await t.ctx.close();

  sec('review fixes: the missions');
  await t.newGame({ prefs: { tkTest: true, msTest: true } }, { bond: { level: 3, pts: 460 }, coins: 500 });
  await ev(() => { const s = window.__paw.S; s.tk.stamps = { shibuya: 'x', hachiko: 'x', yoyogi: 'x' }; });
  ok(await ev(() => { const seen = new Set(); for (let i = 0; i < 300; i++) window.__paw.ms.pick('x' + i).forEach((m) => seen.add(m.id)); return !seen.has('tokyo_stamp') && seen.has('tokyo_ride'); }), 'tokyo_stamp is not eligible when every free stamp is in a locked place');
  await ev(() => window.__paw.ms.force(['buy'])); await motion(false);
  await ev(() => window.__paw.tk.buy()); await t.untilMode('japan', 3000);
  await at('shibuya'); await ev(() => window.__paw.tk.shopBuy('Shibuya Bandana')); await t.sleep(300);
  ok(await ev(() => !window.__paw.S.missions.list.find((m) => m.id === 'buy').done), 'the ticket and the souvenirs do not count as Market Street shopping');
  await t.ctx.close();

  /* ======================= old saves ======================= */
  sec('an old save loads');
  await t.newGame({}, { bond: { level: 4, pts: 800 } });
  const old = await ev(() => { const s = JSON.parse(JSON.stringify(window.__paw.S)); delete s.tk; delete s.dc; return JSON.stringify(s); });
  const inTokyo = await ev(() => { const s = JSON.parse(JSON.stringify(window.__paw.S)); s.place = 'shibuya'; return JSON.stringify(s); });
  await t.ctx.close();
  let pg = await t.mk({ prefs: { tkTest: true }, storage: { pawhaven_proto_v1: old } }); await pg.goto(require('./test_lib').URL); await pg.waitForSelector('#tContinue'); await pg.click('#tContinue');
  await t.untilMode('yard');
  s = await S(); ok(s.tk && s.tk.rides === 0 && s.tk.day === null && s.dc && s.dc.on === false, 'a v2.10 save without S.tk loads and gets the defaults');
  await t.ctx.close();
  pg = await t.mk({ storage: { pawhaven_proto_v1: inTokyo } }); await pg.goto(require('./test_lib').URL); await pg.waitForSelector('#tContinue'); await pg.click('#tContinue');
  await t.untilMode('yard');
  ok((await S()).place === 'yard', 'a save standing in Tokyo loads at home when the trip is off');
  await t.ctx.close();
});
