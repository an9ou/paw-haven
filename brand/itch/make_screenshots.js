// itch.io screenshots of v2.11 "Tokyo Trip" (1280x720, five PNGs in brand/itch/v211/):
//   1 roaming dogs in the yard (Noodle plus the new Akita, Japanese Spitz and Pomeranian)
//   2 ball play in the yard
//   3 Shibuya Crossing and the Hachiko statue
//   4 the Japan map with the stamp ticks
//   5 a Dog Card (a Japanese Spitz and a Pomeranian visiting)
//   6 photo mode (a bonus shot)
//   node game/build.js && node game/harness.js merged && node brand/itch/make_screenshots.js [only-name]      (needs Node and playwright)
// Plays Noodle the dachshund in the test harness (game/test_merged.html) with pinned weather, time, season and date. The Tokyo Trip needs prefs.tkTest and
// roaming prefs.rmTest. The dev button is hidden in every shot (same as the itch.io build, tools/itch.js).
const path = require('path');
const { T } = require('../../game/test_lib');
const out = path.join(__dirname, 'v211'), only = process.argv[2];
const quiet = (t) => t.ev(() => { window.__toasts.splice(0); document.querySelectorAll('#toasts .toast,#bubble').forEach((e) => { e.remove(); }); });
const PREFS = { tkTest: true, rmTest: true, jpTest: true, msTest: true };
async function game(opts, extra) {
  const t = new T('shots', Object.assign({ fest: 'off', season: 'spring', time: 'day', weather: 'sunny', clock: true, prefs: PREFS }, opts));
  t.clockOffset = new Date((opts.date || '2026-04-04') + 'T10:00:00').getTime() - Date.now(); await t.launch();
  await t.boot(Object.assign({}, opts, { prefs: PREFS }));
  await t.adopt({ sex: 'boy', head: '~Dachshund' });
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1200, stats: { hunger: 85, happy: 90, energy: 90, clean: 95 } });
  await t.ev((x) => { const P = window.__paw; (x || []).forEach(([key, sex, months, name]) => P.addDog({ key, sex, months }, name)); }, extra || []);
  await t.p.addStyleTag({ content: '#devBtn,#devPanel{display:none!important}' });
  await t.calm(); return t;
}
const at = async (t, place) => { await t.ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, place); await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard', place, 10000); await t.calm(); await t.lu(); };
async function shot(t, name, wait) { await t.sleep(wait || 3500); await quiet(t); await t.sleep(600); await t.p.screenshot({ path: path.join(out, name) }); console.log('wrote', name); }
const want = (n) => !only || n.includes(only);
const PACK = [['akita', 'male', 30, 'Hachi'], ['pom', 'female', 20, 'Mochi'], ['spitz', 'female', 24, 'Yuki']];

(async () => {
  if (want('screenshot-1')) { // roaming dogs, each doing its own thing
    const t = await game({}, PACK); await at(t, 'yard'); await t.ev(() => { window.__paw.S.dogs.forEach((d) => { d.bond.pts = Math.max(d.bond.pts, 400); }); });
    await shot(t, 'screenshot-1-roaming-yard.png', 7000); await t.b.close();
  }
  if (want('screenshot-2')) { // ball play
    const t = await game({}, [PACK[0]]); await at(t, 'yard');
    await t.ev(() => window.__paw.bl.start('Tennis Ball')); await t.until(() => window.__paw.bl.on, null, 5000);
    await t.ev(() => window.__paw.bl.throwV(260, -180)); await t.ev(() => window.__paw.bl.sim(30));
    await shot(t, 'screenshot-2-ball-play.png', 800); await t.b.close();
  }
  if (want('screenshot-3')) { // Shibuya and Hachiko
    const t = await game({}, [PACK[0], PACK[1]]); await t.ev(() => { window.__paw.tk.allow && window.__paw.tk.allow(true); }); await at(t, 'shibuya');
    await shot(t, 'screenshot-3-shibuya-hachiko.png', 6000); await t.b.close();
  }
  if (want('screenshot-4')) { // the Japan map
    const t = await game({}, PACK);
    await t.ev(() => { const S = window.__paw.S; ['shibuya', 'hachiko', 'yoyogi', 'asakusa'].forEach((k) => { S.tk.stamps[k] = '2026-10-16'; }); window.__paw.go('japan'); });
    await t.untilMode('japan'); await shot(t, 'screenshot-4-japan-map.png', 2500); await t.b.close();
  }
  if (want('screenshot-5')) { // a Dog Card
    const t = await game({}, []); await at(t, 'yard');
    await t.ev(() => window.__paw.dc.card('town-8')); await t.waitH2(/./); await shot(t, 'screenshot-5-dog-card.png', 1500); await t.b.close();
  }
  if (want('screenshot-6')) { // photo mode: the postcard preview
    const t = await game({}, PACK); await at(t, 'yard'); await t.sleep(3000);
    await t.ev(() => window.__paw.ph.open()); await t.until(() => window.__paw.ph.ready(), null, 20000); await shot(t, 'screenshot-6-photo-mode.png', 1500); await t.b.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
