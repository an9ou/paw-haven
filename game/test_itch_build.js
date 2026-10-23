// ITCH BUILD (about 40 s): node game/run_tests.js itch_build
// Builds the itch.io copy (node tools/itch.js), opens dist/itch/index.html on an iPhone 15 and on the desktop and checks that
// the dev button and the dev panel are gone from the DOM (also after a scene change), that nothing opens the panel,
// that the game still starts, and that there are no console errors. GitHub Pages and the claude.ai artifact keep the dev button.
// v2.14 PERF (PERF.md): it is the split, minified build, so it also checks the per-language files (English loads none, Japanese its own before
// the title, a title switch loads the new one, a missing file starts the game in English and the title switches once the file is there),
// the loading paw going away, and the photo fonts coming with the first photo.
const path = require('path'), cp = require('child_process'), fs = require('fs'), os = require('os');
const ROOT = path.join(__dirname, '..');
cp.execFileSync('node', [path.join(ROOT, 'tools', 'itch.js')], { cwd: ROOT, stdio: 'ignore' });
const ITCH = 'file://' + path.join(ROOT, 'dist', 'itch', 'index.html');

require('./test_lib').run('itch_build', async (t) => {
  const { ok, sec } = t;
  for (const dev of [{ name: 'iPhone 15', o: { device: 'iPhone 15' } }, { name: 'desktop 1280x720', o: {} }]) {
    sec(dev.name);
    const p = await t.mk(dev.o);
    await p.goto(ITCH); await p.waitForSelector('#tNew, #tContinue');
    const gone = () => p.evaluate(() => !document.getElementById('devBtn') && !document.getElementById('devPanel') && !document.querySelector('#devBtn,#devPanel'));
    ok(await p.evaluate(() => !!document.getElementById('itchNoDev') && !!document.getElementById('itchNoDevJs')), 'the itch.io hide rule and strip script are in the page');
    ok(await gone(), 'title screen: no #devBtn, no #devPanel');
    await t.adopt({ sex: 'girl' });
    ok((await t.mode()) === 'yard' && await p.locator('#bar .act').count() === 7, 'the game starts: adopted, in the yard with 7 action buttons');
    await t.sleep(300);
    ok(await gone(), 'yard: no #devBtn, no #devPanel');
    // the dev button is drawn again by each scene, so go to a few: the map, then the park, then home
    await p.click('[data-act=map]'); await p.waitForSelector('[data-area=park]');
    ok(await gone(), 'map: no #devBtn, no #devPanel');
    await p.keyboard.press('Escape'); await t.untilMode('yard');
    await t.travel('park'); await t.sleep(300);
    ok(await gone(), 'park: no #devBtn, no #devPanel');
    // nothing can open it: a click where the button sat, Esc, and the keys a player could try
    await p.mouse.click(dev.o.device ? 385 : 1250, dev.o.device ? 80 : 690);
    for (const k of ['Escape', 'd', 'D', 'F12', 'Control+Shift+D', '`']) await p.keyboard.press(k);
    ok(await gone(), 'after clicks and key presses: still no #devBtn or #devPanel');
    ok(await p.evaluate(() => { const d = document.querySelector('#devPanel'); return !d; }), 'no dev panel anywhere in the document');
    ok(await p.evaluate(() => window.__paw.mode !== undefined), 'the game is still running');
  }

  sec('the split build: one language file at a time, the loading paw, the photo fonts on first use');
  const L = (code) => JSON.parse(fs.readFileSync(path.join(ROOT, 'game', 'i18n', code + '.json'), 'utf8'))['title.new_game'];
  const sideFiles = (p) => p.evaluate(() => [...document.scripts].map((e) => e.getAttribute('src')).filter((u) => u && /^lang\/|^photo_fonts/.test(u))); // the loaders add <script src> tags (file:// has no resource timing)
  let p = await t.mk({}); await p.goto(ITCH); await p.waitForSelector('#tNew, #tContinue');
  ok(!(await sideFiles(p)).length && !(await p.$('#pawload')) && await p.evaluate(() => document.documentElement.lang === 'en'), 'English: no language file, the loading paw is gone');
  p = await t.mk({ lang: 'ja' }); await p.goto(ITCH); await p.waitForSelector('#tNew');
  let files = await sideFiles(p);
  ok((await p.textContent('#tNew')).trim() === L('ja') && files.some((f) => /^lang\/ja\.[0-9a-f]{8}\.js$/.test(f)) && files.some((f) => /^lang\/keys\./.test(f)) && files.length === 2,
    `Japanese: the title comes in Japanese ("${L('ja')}") with only its own file and the keys (${files.join(' ')})`);
  await p.evaluate(() => window.__paw.i18n.set('de'));
  ok(await t.until((s) => document.documentElement.lang === 'de' && document.getElementById('tNew').textContent.trim() === s, L('de'), 15000), 'a switch on the title loads the German file and shows the title in German');
  ok((await sideFiles(p)).some((f) => /^lang\/de\./.test(f)), 'the German file came on the switch');
  // a language file that cannot load: the game starts in English, then the title switches once the file is there
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'paw-itch-')); fs.cpSync(path.join(ROOT, 'dist', 'itch'), tmp, { recursive: true });
  const fr = fs.readdirSync(path.join(tmp, 'lang')).find((f) => /^fr\./.test(f)), frPath = path.join(tmp, 'lang', fr), keep = path.join(tmp, 'fr.keep');
  fs.renameSync(frPath, keep);
  p = await t.mk({ lang: 'fr' }); await p.goto('file://' + path.join(tmp, 'index.html')); await p.waitForSelector('#tNew', { timeout: 30000 });
  ok((await p.textContent('#tNew')).trim() === 'New game' && await p.evaluate(() => document.documentElement.lang === 'en'), 'French file missing: the game starts in English');
  fs.renameSync(keep, frPath);
  ok(await t.until((s) => document.documentElement.lang === 'fr' && document.getElementById('tNew').textContent.trim() === s, L('fr'), 30000), 'once the file is there, the title switches to French on its own');
  t.errors = t.errors.filter((e) => !/ERR_FILE_NOT_FOUND|net::ERR_/.test(e)); // the failed load above is on purpose
  fs.rmSync(tmp, { recursive: true, force: true });
  // the photo fonts: not loaded with the game, loaded with the first photo, and the postcard carries them
  p = await t.mk({}); await p.goto(ITCH); await p.waitForSelector('#tNew'); await t.adopt({ sex: 'girl' });
  ok(!(await sideFiles(p)).some((f) => /photo_fonts/.test(f)), 'no photo fonts before photo mode');
  await p.evaluate(() => window.__paw.ph.open());
  ok(await t.until(() => { const s = window.__paw.ph.svg && window.__paw.ph.svg(); return !!s && s.includes("font-family:'Caveat'") && s.includes('base64'); }, null, 20000), 'the first photo loads the photo fonts and the postcard carries them');
  ok((await sideFiles(p)).filter((f) => /photo_fonts/.test(f)).length === 1, 'the photo fonts file came once');
});
