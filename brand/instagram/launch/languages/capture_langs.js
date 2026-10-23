// Captures the same Home Yard scene in all 11 languages for the "now in 11 languages" post, in the PHONE PORTRAIT layout
// (390 x 844 CSS px at DPR 3 = 1170 x 2532 PNGs). The dog says the same line in each language (its own joke, translated by the game).
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/languages/capture_langs.js <outdir> [lang ...]
//
// Needs game/test_merged.html: `node game/build.js && node game/harness.js merged`. No game file is changed (the dev button is hidden
// with CSS in the capture page only). Options (env): DOG (mastiff), NAME (Waffles), LINE (jokes.<dog>.2, a tdata path), SEED (7),
// DATE (2026-10-24, shown at 1 pm).
const path = require('path'), fs = require('fs');
const { devices } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const { run, URL } = require(path.join(ROOT, 'game', 'test_lib'));

const OUT = path.resolve(process.argv[2] || 'langs_out'); fs.mkdirSync(OUT, { recursive: true });
const ALL = ['en', 'ja', 'zh-Hans', 'zh-Hant', 'ko', 'th', 'es', 'pt-BR', 'fr', 'de', 'id'];
const WANT = process.argv.slice(3).length ? process.argv.slice(3) : ALL;
const DOG = process.env.DOG || 'mastiff', NAME = process.env.NAME || 'Waffles', LINE = process.env.LINE || `jokes.${DOG}.2`, SEED = +process.env.SEED || 7, DATE = process.env.DATE || '2026-10-24';
devices['Ad Phone'] = Object.assign({}, devices['iPhone 15'], { viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 } });
// the English line (the game's own text: English has no data file, so tdata needs it as the fallback): JOKES in game/src/00_core.js
const EN = (() => { const m = /^jokes\.(\w+)\.(\d+)$/.exec(LINE); if (!m) return '?'; const r = new RegExp('^  ' + m[1] + ": (\\['.*\\]),?$", 'm').exec(fs.readFileSync(path.join(ROOT, 'game', 'src', '00_core.js'), 'utf8')); return r ? eval(r[1])[+m[2]] : '?'; })(); // eslint-disable-line no-eval
const CSS = '#devBtn,#devPanel{display:none!important}';

run('languages_capture', async (t) => {
  const p = () => t.p, ev = (f, a) => t.ev(f, a);
  for (const lang of WANT) {
    if (t.ctx) await t.ctx.close();
    // a real 1 pm on Playwright's clock instead of the Time override, so the place line shows no override star
    await t.mk({ lang, device: 'Ad Phone', season: 'autumn', weather: 'sunny', time: null, clock: false });
    await t.ctx.clock.install({ time: new Date(DATE + 'T13:00:00') });
    await t.ctx.addInitScript((seed) => { let a = seed >>> 0; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let x = Math.imul(a ^ a >>> 15, 1 | a); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }, SEED);
    await p().goto(URL); await p().waitForSelector('#tNew, #tContinue');
    await t.adopt({ sex: 'boy' });
    // the star of the post: one dog, the leader, in a flower crown; full meters so no care hint pops up
    await ev(([k, n]) => {
      const P = window.__paw, S = P.S, old = S.dog.id;
      P.addDog({ key: k, sex: 'male', months: 30 }, n); const d = S.dogs.find((x) => x.key === k); P.switchDog(d.id);
      S.dogs = S.dogs.filter((x) => x.id !== old);
      S.dogs.forEach((x) => { x.bond = { level: 8, pts: 2100 }; x.stats = { hunger: 90, happy: 95, energy: 95, clean: 95 }; x.outfit = Object.assign(x.outfit || {}, { head: 'Flower Crown' }); });
      if (!S.inv.clothes.includes('Flower Crown')) S.inv.clothes.push('Flower Crown');
      S.coins = 1240; S.careDays = 30; P.saveNow();
    }, [DOG, NAME]);
    await t.calm(); await t.lu();
    await p().addStyleTag({ content: CSS });
    await t.home('yard'); await t.sleep(2500); await t.lu();
    await ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const x = window.__paw.ex; if (x) x.cool(); });
    const text = await ev(([path, en]) => window.PawI18n.tdata(path, en), [LINE, EN]);
    await ev((s) => window.__paw.home.sayDog(s, 60000), text); await t.sleep(700);
    const file = path.join(OUT, lang + '.png');
    await p().screenshot({ path: file, scale: 'device' });
    console.log(lang, '·', text, '·', await ev(() => window.__paw.i18n.lang));
  }
}, { lang: 'en', timeout: 900000 });
