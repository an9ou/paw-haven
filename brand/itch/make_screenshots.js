// itch.io screenshots of v2.8 "Winter & New Year" + Japan scenery: 5 desktop (1280x720) and 1 phone (iPhone 15, 393x852) PNGs in brand/itch/.
//   node game/build.js && node game/harness.js merged && node brand/itch/make_screenshots.js [only-name]
// Plays Noodle the dachshund in the test harness (game/test_merged.html) with a pinned date, season and the winter / Japan gates
// (prefs wnTest, jpTest). The old v2.7 screenshots are replaced. Needs Node and playwright.
const fs = require('fs'), path = require('path');
const { devices } = require('playwright');
devices.phone393 = Object.assign({}, devices['iPhone 15'], { viewport: { width: 393, height: 852 }, screen: { width: 393, height: 852 }, deviceScaleFactor: 1, defaultBrowserType: undefined }); // the full 393x852 screen
const { T } = require('../../game/test_lib');
const out = __dirname, only = process.argv[2];
const quiet = (t) => t.ev(() => { window.__toasts.splice(0); document.querySelectorAll('#toasts .toast,#bubble').forEach((e) => { e.remove(); }); });
const setDate = (t, d) => { t.clockOffset = new Date(d + 'T10:00:00').getTime() - Date.now(); };
const at = async (t, place) => { await t.ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, place); await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard', place, 10000); await t.calm(); await t.lu(); };
// the HUD, the action bar and the dev button are part of the game, so they stay. Only toasts and bubbles go.
async function game(opts, date) {
  const t = new T('shots', Object.assign({ fest: 'auto', season: 'winter', time: 'day', weather: 'cloudy', clock: true, prefs: { wnTest: true, jpTest: true, msTest: true } }, opts));
  setDate(t, date); await t.launch();
  await t.boot(Object.assign({}, opts, { prefs: { wnTest: true, jpTest: true, msTest: true } }));
  await t.adopt({ sex: 'boy', head: '~Dachshund' });
  await t.patch({ bond: { level: 6, pts: 700 }, coins: 1200, stats: { hunger: 85, happy: 90, energy: 90, clean: 95 } });
  await t.calm(); return t;
}
async function wear(t, item, slot) { await t.ev(([it, sl]) => { const S = window.__paw.S; if (!S.inv.clothes.includes(it)) S.inv.clothes.push(it); S.outfit[sl || 'body'] = it; window.__paw.saveNow(); window.__paw.go('yard'); }, [item, slot]); await t.sleep(600); }
async function shot(t, name) { await t.p.addStyleTag({ content: "#devBtn,#devPanel{display:none!important}" }); await t.until(() => !window.__paw.wn || window.__paw.wn.pending === 0, null, 8000); await t.sleep(2500); await quiet(t); await t.sleep(900); await t.p.screenshot({ path: path.join(out, name) }); console.log('wrote', name); }
const want = (n) => !only || n.includes(only);

(async () => {
  if (want('screenshot-1')) { // the winter yard: snow drifts, Fuji, Noodle in the Very Ugly Sweater
    const t = await game({ time: 'day', weather: 'cloudy' }, '2026-12-10');
    await wear(t, 'Very Ugly Sweater'); await at(t, 'yard'); await shot(t, 'screenshot-1-winter-yard.png'); await t.b.close();
  }
  if (want('screenshot-2')) { // the Town Square in Winter Lights: the Winter Stall and the Ugly Sweater Contest banner
    const t = await game({ time: 'dusk', weather: 'cloudy' }, '2026-12-10');
    await wear(t, 'Reindeer Antlers', 'head'); await at(t, 'square'); await shot(t, 'screenshot-2-winter-square.png'); await t.b.close();
  }
  if (want('screenshot-3')) { // a walk with Mt. Fuji on the skyline
    const t = await game({ time: 'day', weather: 'sunny', season: 'autumn', fest: 'off' }, '2026-10-16');
    await t.startWalk(true); await t.sleep(6000); await shot(t, 'screenshot-3-walk-fuji.png'); await t.b.close();
  }
  if (want('screenshot-4')) { // Fuji View Hill, the new place
    const t = await game({ time: 'day', weather: 'cloudy', season: 'spring', fest: 'off' }, '2026-04-04');
    await at(t, 'fujihill'); await shot(t, 'screenshot-4-fuji-view-hill.png'); await t.b.close();
  }
  if (want('screenshot-5')) { // New Year: kadomatsu and the pine, the first Fuji of the year
    const t = await game({ time: 'day', weather: 'cloudy', fest: 'newyear' }, '2026-12-31');
    await wear(t, 'Year of the Sheep Hood', 'head'); await at(t, 'yard'); await shot(t, 'screenshot-5-new-year.png'); await t.b.close();
  }
  if (want('phone')) { // iPhone 15, 393x852
    const t = await game({ device: 'phone393', time: 'day', weather: 'cloudy' }, '2026-12-10');
    await wear(t, 'Very Ugly Sweater'); await at(t, 'yard'); await shot(t, 'screenshot-phone-393x852.png'); await t.b.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
