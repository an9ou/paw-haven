// Store / portal promotion screenshots of the real game: 3 horizontal (1920 x 1080: the desktop layout, 1280 x 720 CSS px at DPR 1.5) and
// 3 vertical (1080 x 1920: the phone layout, 360 x 640 CSS px at DPR 3). English UI, no dev button (hidden with CSS in the capture page only).
//
//   node game/build.js && node game/harness.js merged
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/promo_shots/capture_promo.js <outdir> [shot ...]
//
// Shots: h1-yard, h2-tokyo, h3-walk, v1-adopt, v2-shelter, v3-shibuya (default: all). DATE (2026-10-24: autumn, the Halloween pop-up).
const path = require('path'), fs = require('fs');
const { devices } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const { run, URL } = require(path.join(ROOT, 'game', 'test_lib'));

const OUT = path.resolve(process.argv[2] || 'promo_out'); fs.mkdirSync(OUT, { recursive: true });
const ALL = ['h1-yard', 'h2-tokyo', 'h3-walk', 'v1-adopt', 'v2-shelter', 'v3-shibuya'];
const WANT = process.argv.slice(3).length ? process.argv.slice(3) : ALL;
const DATE = process.env.DATE || '2026-10-24';
devices['Promo Desktop'] = { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5, isMobile: false, hasTouch: false, userAgent: devices['Desktop Chrome'].userAgent };
devices['Promo Phone'] = Object.assign({}, devices['iPhone 15'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 }, deviceScaleFactor: 3 });
const CSS = '#devBtn,#devPanel{display:none!important}';
// the pack: a different leader from the last ads (not the Chihuahua or the Mastiff), and three friends, some in outfits
const LEAD = { key: 'pom', name: 'Mochi' };
const PACK = [['corgi', 'male', 'Biscuit', { neck: 'Red Bandana' }], ['beagle', 'female', 'Clover', { head: 'Flower Crown' }], ['samoyed', 'male', 'Cloud', { neck: 'Bow Tie' }]];

run('promo_capture', async (t) => {
  const p = () => t.p, ev = (f, a) => t.ev(f, a);
  const start = async (device, hour, prefs) => {
    if (t.ctx) await t.ctx.close();
    // a real clock time on Playwright's clock (no Time override star), season and festival from the date (autumn, Halloween)
    await t.mk({ device, season: null, fest: null, weather: 'sunny', time: null, clock: false, prefs: Object.assign({ tkTest: true, jpTest: true }, prefs || {}) });
    await t.ctx.clock.install({ time: new Date(`${DATE}T${hour}:00`) });
    await t.ctx.addInitScript(() => { let a = 7; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; });
    await p().goto(URL); await p().waitForSelector('#tNew, #tContinue');
  };
  const setup = async (pack) => {
    await t.adopt({ sex: 'girl' });
    await ev(([L, PK, pack]) => {
      const P = window.__paw, S = P.S, old = S.dog.id;
      P.addDog({ key: L.key, sex: 'female', months: 26 }, L.name); P.switchDog(S.dogs.find((x) => x.key === L.key).id);
      S.dogs = S.dogs.filter((x) => x.id !== old);
      if (pack) PK.forEach(([k, sex, n]) => P.addDog({ key: k, sex, months: 24 }, n));
      const outfits = [{ head: 'Witch Hat' }].concat(PK.map((x) => x[3]));
      S.dogs.forEach((d, i) => { d.bond = { level: 12, pts: 9000 }; d.stats = { hunger: 90, happy: 95, energy: 95, clean: 95 }; d.outfit = Object.assign(d.outfit || {}, outfits[i] || {}); });
      ['Witch Hat', 'Red Bandana', 'Flower Crown', 'Bow Tie'].forEach((n) => { if (!S.inv.clothes.includes(n)) S.inv.clothes.push(n); });
      S.bond = { level: 12, pts: 9000 }; S.coins = 2480; S.careDays = 60; S.careGifts = Object.assign(S.careGifts || {}, { hoodie: '2026-10-01' }); if (!S.inv.clothes.includes('Cozy Hoodie')) S.inv.clothes.push('Cozy Hoodie'); // the 14-day hoodie gift already given, so no gift card pops up S.daily.play = true; P.saveNow();
    }, [LEAD, PACK, pack]);
    await t.calm(); await t.lu(); await p().addStyleTag({ content: CSS });
  };
  const clean = () => ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const x = window.__paw.ex; if (x) x.cool(); });
  const at = async (k) => {
    await ev((k) => { const s = window.__paw.S; s.sleeping = false; s.place = k; window.__paw.go('yard'); }, k);
    await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard', k, 8000); await t.lu();
  };
  const roam = () => ev(() => { const x = window.__paw.ex; if (x) { x.cool(); x.roam(true); } });
  const snap = async (name) => { await clean(); await t.sleep(300); await p().screenshot({ path: path.join(OUT, name + '.png'), scale: 'device' }); console.log('wrote', name); };

  if (WANT.includes('h1-yard')) {   // the Home Yard in autumn, the pack of four roaming, the leader in a Witch Hat
    await start('Promo Desktop', '11:00'); await setup(true);
    await t.home('house'); await t.home('yard'); await roam(); await t.sleep(4500); await t.lu();
    await ev(() => window.__paw.home.sayDog(window.PawI18n.tdata('jokes.pom.3', 'I may be tiny. My opinions are not.'), 60000)); await t.sleep(600);
    await snap('h1-yard');
  }
  if (WANT.includes('h2-tokyo')) {  // Tokyo Tower in the evening with the pack
    await start('Promo Desktop', '18:30'); await setup(true);
    await ev(() => window.__paw.go('japan')); await t.untilMode('japan'); await ev(() => window.__paw.tk.pick('tokyotower'));
    await t.until(() => window.__paw.S.place === 'tokyotower' && window.__paw.mode === 'yard', null, 15000); await t.lu();
    await t.until(() => !window.__paw.tk.busy && !window.__paw.tk.riding, null, 15000); await roam(); await t.sleep(4000); await t.lu();
    await snap('h2-tokyo');
  }
  if (WANT.includes('h3-walk')) {   // the walk runner in the park, the pack following
    await start('Promo Desktop', '10:00'); await setup(true); await t.home('yard');
    await p().click('[data-act=walk]'); await p().waitForSelector('#rtStart'); await t.sleep(400); await p().click('#rtStart');
    await t.walkGate(false); await clean();
    await t.until(() => !!document.querySelector('.pw-cd'), null, 8000); await t.sleep(5200);
    await p().keyboard.down('Space'); await t.sleep(260); await p().screenshot({ path: path.join(OUT, 'h3-walk.png'), scale: 'device' }); await p().keyboard.up('Space'); console.log('wrote h3-walk');
  }
  if (WANT.includes('v1-adopt')) {  // the adoption screen: pick your crayon dog
    await start('Promo Phone', '11:00');
    await p().click('#tNew'); await p().waitForSelector('#aAdopt'); await p().addStyleTag({ content: CSS });
    const n = await ev(() => document.querySelectorAll('.heads button').length);
    await p().click(`.heads button[data-i="${Math.min(6, n - 1)}"]`); await t.sleep(5000);
    await snap('v1-adopt');
  }
  if (WANT.includes('v2-shelter')) { // the Shelter Playroom
    await start('Promo Phone', '11:00'); await setup(false); await t.home('yard');
    await p().click('[data-act=map]'); await p().waitForSelector('[data-area=shelter]'); await ev(() => window.__paw.mapTo('shelter')); await t.sleep(500);
    await p().click('[data-area=shelter]', { force: true }); await t.sleep(400); if (await p().locator('#mapGoBtn').count()) await p().click('#mapGoBtn');
    await t.untilMode('shelter', 10000); await t.sleep(3500);
    await snap('v2-shelter');
  }
  if (WANT.includes('v3-shibuya')) { // Shibuya with the pack
    await start('Promo Phone', '14:00'); await setup(true);
    await ev(() => window.__paw.go('japan')); await t.untilMode('japan'); await ev(() => window.__paw.tk.pick('shibuya'));
    await t.until(() => window.__paw.S.place === 'shibuya' && window.__paw.mode === 'yard', null, 15000); await t.lu();
    await t.until(() => !window.__paw.tk.busy && !window.__paw.tk.riding, null, 15000); await roam(); await t.sleep(4000); await t.lu();
    await snap('v3-shibuya');
  }
}, { lang: 'en', timeout: 900000 });
