// Phone-layout screenshots of the v2.15 "A Bigger Town" places for the update post (390 x 844 CSS px at DPR 3 = 1170 x 2532 PNGs):
// the new town map, an agility run at the Training Ground, a paddle at the Splash Pool. English UI, no dev button.
//   node game/build.js && node game/harness.js merged
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/updates/capture_v215.js <outdir>      DOG (corso), NAME (Bruno)
const path = require('path'), fs = require('fs');
const { devices } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const { run, URL } = require(path.join(ROOT, 'game', 'test_lib'));
const OUT = path.resolve(process.argv[2] || 'v215_out'); fs.mkdirSync(OUT, { recursive: true });
const DOG = process.env.DOG || 'corso', NAME = process.env.NAME || 'Bruno';
devices['Ad Phone'] = Object.assign({}, devices['iPhone 15'], { viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 } });
const CSS = '#devBtn,#devPanel{display:none!important}';

run('v215_capture', async (t) => {
  const p = () => t.p, ev = (f, a) => t.ev(f, a);
  // a real 1 pm on Playwright's clock instead of the Time override (no override star by the clock)
  t.boot = async (o) => { await t.mk(o); await t.ctx.clock.install({ time: new Date('2026-10-25T13:00:00') }); await p().goto(URL); await p().waitForSelector('#tNew, #tContinue'); return p(); };
  await t.newGame({ device: 'Ad Phone', ground: true, season: 'autumn', weather: 'sunny', time: null, clock: false, prefs: { tkTest: true, jpTest: true } }, { coins: 2000, bond: { level: 7, pts: 1600 }, stats: { hunger: 90, happy: 85, energy: 100, clean: 90 } });
  await ev(([k, n]) => {
    const P = window.__paw, S = P.S, old = S.dog.id;
    P.addDog({ key: k, sex: 'male', months: 28 }, n); P.switchDog(S.dogs.find((x) => x.key === k).id); S.dogs = S.dogs.filter((x) => x.id !== old);
    S.dogs.forEach((d) => { d.bond = { level: 7, pts: 1600 }; d.stats = { hunger: 90, happy: 85, energy: 100, clean: 90 }; d.outfit = Object.assign(d.outfit || {}, { neck: 'Red Bandana' }); });
    if (!S.inv.clothes.includes('Red Bandana')) S.inv.clothes.push('Red Bandana');
    S.careGifts = Object.assign(S.careGifts || {}, { hoodie: '2026-10-01' }); P.saveNow();
  }, [DOG, NAME]);
  await t.calm(); await t.lu(); await p().addStyleTag({ content: CSS });
  const clean = () => ev(() => document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()));
  const snap = async (n) => { await clean(); await t.sleep(250); await p().screenshot({ path: path.join(OUT, n + '.png'), scale: 'device' }); console.log('wrote', n); };

  // the new town map
  await t.home('market'); await p().locator('[data-act=map]').first().tap().catch(() => p().click('[data-act=map]'));
  await p().waitForSelector('#mapInner .mb[data-area]'); await t.sleep(900); await snap('map');
  await p().keyboard.press('Escape'); await t.sleep(400);

  // the Training Ground: start a run and catch it mid-course
  await t.home('training'); await t.luWait(800); await t.lu(); await t.sleep(600); await clean();
  await p().tap('#placeBtns [data-ag]'); await p().waitForSelector('#agStart'); await p().tap('#agStart');
  await t.until(() => window.__paw.ag.state && window.__paw.ag.state.ready, null, 9000);
  for (let i = 0; i < 2; i++) { await t.until(() => { const s = window.__paw.ag.state; return !!s && (s.ready || s.ph === 'done'); }, null, 14000); await ev(() => window.__paw.ag.pin(0.5)); await p().tap('#agGo'); await t.sleep(i === 1 ? 650 : 250); }
  await snap('training');
  await t.until(() => { const s = window.__paw.ag.state; if (s && s.ready) { window.__paw.ag.pin(0.5); window.__paw.ag.mark(); } return !!s && s.ph === 'done'; }, null, 30000);
  await ev(() => window.__paw.ag.stop()); await t.sleep(400); await t.lu();

  // the Splash Pool: the paddle, in the free life vest
  await t.home('pool'); await t.luWait(800); await t.lu(); await t.sleep(600); await clean();
  await p().tap('#placeBtns [data-pl]'); await p().waitForSelector('#plPaddle'); await t.sleep(400); await p().tap('#plPaddle');
  await t.until(() => { const s = window.__paw.pl.state; return !!s && s.ph === 'run'; }, null, 4000); await t.sleep(+process.env.PADDLE || 1600);
  await snap('pool');
}, { lang: 'en', timeout: 600000 });
