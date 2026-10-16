// More launch screenshots for the informative posts (garden, kitchen, house + pack, map, wardrobe, tricks, shelter, journal tree, winter Fuji).
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/shots2.js <outdir>
const path = require('path'), fs = require('fs');
const { run } = require(path.join(__dirname, '..', '..', '..', 'game', 'test_lib'));
const OUT = path.resolve(process.argv[2] || 'shots'); fs.mkdirSync(OUT, { recursive: true });
run('launch_shots2', async (t) => {
  const { ev } = t, p = () => t.p;
  await t.newGame({ sex: 'boy', device: 'iPhone 15', head: '~Dachshund' }, { bond: { level: 10, pts: 3300 }, coins: 3000, house: 'Royal Castle Kennel', stats: { hunger: 85, happy: 90, energy: 90, clean: 90 }, dog: { name: 'Noodle' } });
  await t.dev(async () => {});
  await p().addStyleTag({ content: '#devBtn{opacity:0!important}#toasts{display:none!important}' });
  const setEnv = (time, weather) => ev(([a, b]) => { for (const [id, v] of [['dvTime', a], ['dvWeather', b]]) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('change')); } }, [time, weather]);
  const shot = async (n, ms) => { await ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const b = document.getElementById('bubble'); if (b) b.hidden = true; }); await t.sleep(ms || 1000); await p().screenshot({ path: path.join(OUT, n + '.png') }); console.log('shot', n); };
  const step = async (n, fn) => { try { await fn(); } catch (e) { console.log('SKIP', n, e.message.split('\n')[0]); } };
  await setEnv('day', 'sunny');
  await step('garden', async () => { await t.patch({ inv: { seeds: { carrot: 3, peas: 3, pumpkin: 2, apple: 2, blueberry: 2 } } }); await t.home('yard'); await ev(() => window.__paw.go('garden')); await t.until(() => document.querySelectorAll('.pg-plot').length === 6); await t.sleep(900); await p().locator('.pg-plot').nth(1).tap(); await t.sleep(900); await shot('garden', 300); await ev(() => window.__paw.go('yard')); });
  await step('kitchen', async () => { await t.home('house'); await ev(() => window.__paw.go('kitchen')); await t.until(() => !!document.querySelector('.pk-root')); await shot('kitchen', 1200); await ev(() => window.__paw.go('house')); });
  await step('house_pack', async () => { await ev(() => { const P = window.__paw, S = P.S; const ks = ['corgi', 'golden', 'shiba']; let i = 0; while (S.dogs.length < 4) { P.addDog({ key: ks[i++ % 3], sex: i % 2 ? 'male' : 'female', months: 20 }, ['Biscuit', 'Sunny', 'Mochi'][i - 1]); } }); await t.home('house'); await t.sleep(1500); await shot('house_pack', 600); await t.home('yard'); await t.sleep(900); await shot('yard_pack', 600); });
  await step('map', async () => { await t.home('yard'); await ev(() => window.__paw.go('map')); await t.untilMode('map'); await shot('map', 900); await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); });
  await step('wardrobe', async () => { await t.home('yard'); await ev(() => { const o = window.__paw.S.inv.clothes; o.push('Witch Hat', 'Candy Corn Bandana'); }); await p().locator('[data-act=wardrobe]').tap(); await t.sleep(1100); await shot('wardrobe', 300); await ev(() => { document.querySelector('.panel .x')?.click(); }); await t.sleep(400); });
  await step('tricks', async () => { await t.home('yard'); await p().locator('[data-act=play]').tap(); await t.waitPop(true); await p().locator('[data-play=tricks]').tap(); await t.until(() => !!document.querySelector('#trainPanel:not([hidden])')); await shot('tricks', 800); await ev(() => document.querySelector('#trainPanel .x, #trainPanel [aria-label=Close]')?.click()); await t.sleep(400); });
  await step('shelter', async () => { await t.home('yard'); if (await t.toShelter()) { await shot('shelter_list', 900); await t.closeX(); await t.sleep(500); await shot('shelter_room', 900); } await t.leaveShelter(); });
  await step('journal', async () => { await t.home('yard'); await p().locator('[data-act=journal]').tap(); await p().waitForSelector('.panel.journal'); await t.sleep(700); await shot('journal', 300); const tb = p().locator('.panel.journal .jtabs .btn', { hasText: /Family/ }); if (await tb.count()) { await tb.first().tap(); await t.sleep(900); await shot('journal_tree', 300); } await ev(() => document.querySelector('.panel .x')?.click()); await t.sleep(400); });
  await step('fuji_day', async () => { await t.home('yard'); await ev(() => { const S = window.__paw.S; S.place = 'fujihill'; window.__paw.go('yard'); }); await t.until(() => window.__paw.S.place === 'fujihill' && window.__paw.mode === 'yard', null, 8000); await t.sleep(1500); await shot('fujihill_day2', 300); });
}, { device: 'iPhone 15', date: '2026-10-20', season: 'auto', fest: 'auto', prefs: { hwTest: true, jpTest: true, wnTest: true }, timeout: 400000 });
// winter Fuji (a second run on a December date)
run('launch_shots2_winter', async (t) => {
  const { ev } = t, p = () => t.p;
  await t.newGame({ sex: 'boy', device: 'iPhone 15', head: '~Dachshund' }, { bond: { level: 10, pts: 3300 }, coins: 3000, stats: { hunger: 85, happy: 90, energy: 90, clean: 90 }, dog: { name: 'Noodle' } });
  await t.dev(async () => {});
  await p().addStyleTag({ content: '#devBtn{opacity:0!important}#toasts{display:none!important}' });
  const at = async (place) => { await ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, place); await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard', place, 8000); await t.calm(); };
  const setEnv = (time, weather) => ev(([a, b]) => { for (const [id, v] of [['dvTime', a], ['dvWeather', b]]) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('change')); } }, [time, weather]);
  const shot = async (n) => { await ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const b = document.getElementById('bubble'); if (b) b.hidden = true; }); await t.sleep(1400); await p().screenshot({ path: path.join(OUT, n + '.png') }); console.log('shot', n); };
  await setEnv('dusk', 'snow'); await at('yard'); await shot('winter_yard'); await at('square'); await shot('winter_square'); await at('fujihill'); await shot('winter_fujihill');
}, { device: 'iPhone 15', date: '2026-12-12', season: 'auto', fest: 'auto', prefs: { hwTest: true, jpTest: true, wnTest: true }, timeout: 300000 });
