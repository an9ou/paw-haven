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
    // today's bar (v2.16): phones show the option C bar Care / Walk / Map / More, the desktop all seven buttons
    const acts = await p.evaluate(() => [...document.querySelectorAll('#bar > .act')].filter((b) => b.getClientRects().length).map((b) => b.dataset.act).join(','));
    ok((await t.mode()) === 'yard' && (dev.o.device ? acts === 'caremenu,walk,map,more' : await p.locator('#bar .act').count() === 7), `the game starts: adopted, in the yard with today's bar (${dev.o.device ? 'Care, Walk, Map, More' : '7 action buttons'}: ${acts})`);
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
  const L = (code) => JSON.parse(fs.readFileSync(path.join(ROOT, 'game', 'i18n', code + '.json'), 'utf8'))['title.play'];
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
  ok((await p.textContent('#tNew')).trim() === 'Play' && await p.evaluate(() => document.documentElement.lang === 'en'), 'French file missing: the game starts in English');
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
  // the GitHub Pages test copy's flags (tools/pages.js) never reach itch.io or /play/: Friends, Cantonese, v2.20 Missions v2 (MS2_LIVE), the password screen
  sec('no Pages-only test flags');
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'itch', 'index.html'), 'utf8');
  // the same pattern as tools/itch.js: the real flags are a <script> tag of their own (tools/pages.js); the bare text also sits in the test hooks (__paw.ms2.pagesFlag, the Friends hook)
  ok(!/<script>window\.__dd(Fr|Yue|Ms2)Test=1<\/script>|dd_gate_v1|id="ddGate"/.test(html), 'dist/itch/index.html has no __ddFrTest, __ddYueTest or __ddMs2Test flag tag and no password screen');
  ok(await p.evaluate(() => !window.__ddMs2Test && !window.__ddFrTest && !!window.__paw.ms2 && window.__paw.ms2.on() === window.__paw.ms2.live() && !!window.__paw.lv && window.__paw.lv.on() === false), 'the itch.io copy runs Missions v2 exactly as MS2_LIVE says (on since 7 Nov 2026), Town levels off under the test harness, no Missions v2 or Friends test flag set (the harness sets __ddYueTest itself)');
  // Home screen tip (game/src/59_a2hs.js): it belongs to doodledoggo.app/play/ only. The same build inside itch.io's frame (another origin) never shows it
  sec('no Add to home screen tip inside the itch.io frame');
  {
    const GAME = 'https://html-classic.itch.zone/html/1/', PAGE = 'https://an9ou.itch.io/doodle-doggo', DIST = path.join(ROOT, 'dist', 'itch');
    const TYPE = { html: 'text/html; charset=utf-8', js: 'text/javascript; charset=utf-8', png: 'image/png', svg: 'image/svg+xml', woff2: 'font/woff2', webmanifest: 'application/manifest+json', css: 'text/css' };
    const q = await t.mk({ device: 'iPhone 15', prefs: { a2Test: true, a2: { n: 0, at: 0 } } });
    await q.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.href.split('?')[0] === PAGE) return route.fulfill({ status: 200, contentType: TYPE.html, body: `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="margin:0"><iframe id="game" src="${GAME}index.html" style="border:0;width:100vw;height:100vh" allow="fullscreen"></iframe>` });
      if (u.href.startsWith(GAME)) { const f = path.join(DIST, decodeURIComponent(u.pathname.slice('/html/1/'.length)) || 'index.html'); return fs.existsSync(f) && f.startsWith(DIST) ? route.fulfill({ status: 200, contentType: TYPE[f.split('.').pop()] || 'application/octet-stream', body: fs.readFileSync(f) }) : route.fulfill({ status: 404, body: '' }); }
      return route.fulfill({ status: 200, contentType: /\.css|css2/.test(u.href) ? 'text/css' : 'text/plain', body: '' }); // Google Fonts: empty
    });
    await q.goto(PAGE); const fr = await (await q.waitForSelector('#game')).contentFrame();
    await fr.waitForSelector('#tNew, #tPlay, #tContinue', { timeout: 30000 });
    await fr.click((await fr.locator('#tPlay').count()) ? '#tPlay' : '#tNew'); await fr.waitForSelector('#aAdopt'); await fr.click('#aGirl'); await fr.click('#aAdopt'); await fr.waitForSelector('#nOk'); await fr.click('#nOk');
    for (let i = 0; i < 3; i++) { await fr.waitForSelector('#iNext'); const h = await fr.textContent('#modal .panel h2'); await fr.click('#iNext'); await fr.waitForFunction((h) => { const e = document.querySelector('#modal .panel h2'); return !e || e.textContent !== h; }, h, { timeout: 5000 }).catch(() => {}); }
    await fr.waitForFunction(() => window.__paw && window.__paw.mode === 'yard' && document.getElementById('modal').hidden && !!window.__paw.a2, null, { timeout: 15000 });
    // everything else says yes: an iPhone with Safari, the 3rd day played, no waiting, never shown before
    const st = await fr.evaluate(() => { const P = window.__paw; P.S.daysPlayed = 3; P.S.daysLastISO = P.rh.jst(); P.a2.timing(0, 0); return { host: location.hostname, on: P.a2.on(), plat: P.a2.plat(), safari: P.a2.safari(), frame: P.a2.frame(), site: P.a2.site(), due: P.a2.due(), calm: P.a2.calm() }; });
    ok(st.host === 'html-classic.itch.zone' && st.on && st.plat === 'ios' && st.safari && st.calm && st.frame === 'other' && st.site === false && st.due === false, `in itch.io's frame on an iPhone, on a calm yard on day 3: another frame, not the site, nothing due (${JSON.stringify(st)})`);
    const ev = await fr.evaluate(() => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => Promise.resolve({ outcome: 'accepted' }); window.dispatchEvent(e); return { prevented: e.defaultPrevented, kept: window.__paw.a2.evt() }; });
    ok(!ev.prevented && !ev.kept, "an install event there is left to the browser (not prevented, not kept)");
    await fr.evaluate(() => { window.__paw.a2.force(true); }); // even the dev switch for test copies does nothing in another site's frame
    await t.sleep(3200);
    ok(await fr.evaluate(() => !document.querySelector('.a2-pop') && document.getElementById('modal').hidden && !window.__paw.a2.due() && window.__paw.a2.st().n === 0), 'three seconds later, with the waits at zero and even the dev switch on: no card, nothing counted');
    ok(await fr.evaluate(() => !document.getElementById('dvA2') && !document.getElementById('devPanel')), 'and no dev panel there to preview it from');
    t.errors = t.errors.filter((e) => !/Failed to load resource|net::ERR_|Blocked autofocusing on a <input> element in a cross-origin subframe/.test(e)); // the name box's autofocus: Chromium's note about any framed page, as on itch.io itself
  }
});
