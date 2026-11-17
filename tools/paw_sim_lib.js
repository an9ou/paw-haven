// Shared helpers for the two design tools tools/balance_sim.js and tools/playtest.js (skills paw-balance, paw-playtest).
// Not part of the game build: they read the built test harness (game/test_merged.html), make a scratch copy with a few read-only
// hooks injected, and drive it with the globally installed Playwright Chromium. The game sources are never changed.
//   NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors node tools/<tool>.js
const fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const HARNESS = path.join(ROOT, 'game', 'test_merged.html');
const CHROME = process.env.PAW_CHROME || ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
const ARGS = ['--disable-dev-shm-usage', '--mute-audio', '--disable-background-networking', '--disable-sync', '--disable-component-update', '--no-first-run',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows'].concat((process.env.PAW_ARGS || '').split(/\s+/).filter(Boolean));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// build the harness when it is missing, older than the sources, or when asked
function ensureHarness(force) {
  const srcT = Math.max(...['game/src', 'game/css', 'mods', 'dogs', 'world'].map((d) => newest(path.join(ROOT, d))));
  const stale = !fs.existsSync(HARNESS) || fs.statSync(HARNESS).mtimeMs < srcT;
  if (!force && !stale) return;
  process.stderr.write('building the game and the test harness...\n');
  cp.execFileSync(process.execPath, ['game/build.js'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  cp.execFileSync(process.execPath, ['game/harness.js', 'merged'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
}
function newest(dir) { let t = 0; if (!fs.existsSync(dir)) return 0; for (const f of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, f.name); t = Math.max(t, f.isDirectory() ? newest(p) : fs.statSync(p).mtimeMs); } return t; }

// the read-only table dump, run inside the game's shared scope (23_boot.js, where window.__paw is made). Every name is guarded, so a renamed
// constant shows up as null in the dump (and as a warning in the tools) instead of breaking the page.
const ECON_NAMES = ['BOOST', 'GAME_SEC', 'WALK_FULL', 'BOND_TH', 'FOOD', 'TOYS', 'CLOTHES', 'HOUSES', 'BEDS', 'HM_DECOR', 'ROUTES', 'RAR_P', 'RAR_COINS',
  'MS_PAY', 'MS_CARD', 'MS_CARD_COINS', 'MSW_COINS', 'MSW_NEED', 'MSW_NOTES', 'FF_CAPS', 'FF_GAMES', 'PIP_CAP', 'STAR_MULT', 'CROPS_FB', 'BL_COIN_DAY', 'BL_COIN_SES',
  'AG_COIN_DAY', 'AG_COINS', 'DD_COIN', 'DD_COIN_DAY', 'FW_CAL_COIN_CAP', 'FW_DG_COIN_CAP', 'KS_ITEMS', 'KS_LOOK_COINS', 'KS_SUP_COINS', 'KS_WALK_K', 'KS_GROW_MUL',
  'KS_TOKYO', 'KS_COZY', 'KS_TOOLS', 'LV_AT', 'LV_CAP', 'LV_MAX', 'LV_SRC', 'LV_WALK', 'LV_MILE', 'LV_UNLOCK', 'LV_FLOOR', 'SHOP_LIVE', 'MS2_LIVE'];
const ECON_JS = `window.__econ = () => { const g = (f) => { try { return f(); } catch (e) { return null; } }; return JSON.parse(JSON.stringify({ ${ECON_NAMES.map((n) => `${n}: g(() => ${n})`).join(', ')},
  CROPS: g(() => (window.PawGarden && window.PawGarden.CROPS) || null), TOOLS: g(() => twTools()), DECOR_SHOP: g(() => hoShopItems('decor').concat(hoShopItems('furniture')).filter((x) => !x.head)) })); };\n`;
// the runner's insides for the walk autoplayer (balance_sim --measure): one line in step(), after the run-mode check
const WALK_HOOK = "if (window.__pwAuto) window.__pwAuto({ S, live, DOG, PH, heat, jumpPress, jumpRelease, crouchPress, crouchRelease, doDig, gen }, dt);\n";

// a scratch copy of the harness with the hooks in; returns its path
function scratchCopy(o) {
  o = o || {}; let h = fs.readFileSync(HARNESS, 'utf8');
  const put = (anchor, add, after) => { const i = h.indexOf(anchor); if (i < 0) throw new Error('hook anchor not found (the game changed?): ' + anchor); const at = after ? i + anchor.length : i; h = h.slice(0, at) + add + h.slice(at); };
  if (o.econ) put('window.__paw = { get S()', ECON_JS);
  if (o.walk) put("    if (S.mode !== 'run') return;\n", '    ' + WALK_HOOK, true);
  const dir = o.dir || fs.mkdtempSync(path.join(os.tmpdir(), 'pawsim-'));
  const f = path.join(dir, 'paw_sim_' + (o.econ ? 'e' : '') + (o.walk ? 'w' : '') + '.html'); fs.writeFileSync(f, h); return f;
}

async function launch() {
  let pw; try { pw = require('playwright'); } catch (e) { throw new Error('playwright not found: run with NODE_PATH=$(npm root -g)'); }
  return pw.chromium.launch({ executablePath: CHROME, args: ARGS });
}

// every feature that is live in the shipped game but switched off under the harness (navigator.webdriver) is switched on here, so the page
// plays like the real game. Friends stay off (they need the Worker) and so does cloud save.
const LIVE_PREFS = { msTest: true, ms2Test: true, lvTest: true, gdTest: true, fwTest: true, fsTest: true, hwTest: true, wnTest: true, jpTest: true, mpTest: true, grTest: true,
  tkTest: true, exTest: true, ddTest: true, ffTest: true, fmTest: true, nwTest: true, pupTest: true, rmTest: true, shopTest: true,
  // v2.25 welcome back, v2.26 visitors, v2.27 town projects, v2.28 stories, v2.29 story mode and its scenes. Unknown prefs are ignored, so a build
  // without a feature (main before the v2.26-29 launch) is not changed by them. These need no date: under the harness only the pref counts.
  wbTest: true, yvTest: true, prTest: true, stTest: true, smTest: true, scTest: true };

// a page with a movable clock: page time = startMs + real time since load + sessionStorage.__ptOff (ms). shift(ms) moves it live; a reload keeps it.
async function newPage(browser, o) {
  o = o || {}; const pw = require('playwright');
  const ctxOpts = o.device ? Object.assign({}, pw.devices[o.device], { defaultBrowserType: undefined }) : { viewport: o.viewport || { width: 1280, height: 720 } };
  const ctx = await browser.newContext(ctxOpts); ctx.setDefaultTimeout(20000);
  await ctx.addInitScript((cfg) => {
    const R = Date, base = cfg.start - R.now();
    const off = () => { try { return base + (+sessionStorage.getItem('__ptOff') || 0); } catch (e) { return base; } };
    const now = () => R.now() + off();
    class FakeDate extends R { constructor(...a) { if (a.length === 0) super(now()); else super(...a); } static now() { return now(); } }
    window.Date = FakeDate;
    // dated features (49c_news.js nwNext): off by default, they follow the simulated date like for a player; o.next = true opens them all early
    if (cfg.next) window.__ddNextTest = true;
    // the clock moves while the page is still open and then the page reloads: the game saves on pagehide, which would stamp the save with the NEW
    // time (no real absence, so "While you were out" never shows, and a save from the future). __ptShift(ms, true) mutes that last save: the save
    // written just before the shift (at the old time) is the one that stays. Registered first and in capture, so it runs before the game's own.
    const mute = (e) => { try { if (sessionStorage.getItem('__ptMute') === '1') e.stopImmediatePropagation(); } catch (x) { /* none */ } };
    window.addEventListener('pagehide', mute, true); document.addEventListener('visibilitychange', mute, true); window.addEventListener('beforeunload', mute, true); // a reload fires visibilitychange (hidden) too
    try { sessionStorage.removeItem('__ptMute'); } catch (e) { /* none */ } // a new page saves normally again (the flag only mutes the page being left)
    // who emptied the save? (a removeItem or clear is logged to sessionStorage, so the harness can say so after a reload)
    try {
      const log = (w) => { try { sessionStorage.setItem('__lsEv', (sessionStorage.getItem('__lsEv') || '') + w + ';'); } catch (x) { /* none */ } };
      const ri = Storage.prototype.removeItem, cl = Storage.prototype.clear, si = Storage.prototype.setItem;
      Storage.prototype.removeItem = function (k) { if (this === localStorage) log('remove:' + k); return ri.apply(this, arguments); };
      Storage.prototype.clear = function () { if (this === localStorage) log('clear'); return cl.apply(this, arguments); };
      Storage.prototype.setItem = function (k, v) { if (this === localStorage && k === 'pawhaven_proto_v1' && (v === '' || v == null || v === 'null')) log('empty-save'); return si.apply(this, arguments); };
    } catch (e) { /* none */ }
    window.__ptShift = (ms, mute) => { try { if (mute) sessionStorage.setItem('__ptMute', '1'); sessionStorage.setItem('__ptOff', String((+sessionStorage.getItem('__ptOff') || 0) + ms)); } catch (e) { /* none */ } };
    try {
      const PK = 'pawhaven_prefs_v1'; let pr = {}; try { pr = JSON.parse(localStorage.getItem(PK) || '{}') || {}; } catch (e) { pr = {}; }
      let ch = false; for (const k in cfg.prefs) if (!(k in pr)) { pr[k] = cfg.prefs[k]; ch = true; }
      if (ch) localStorage.setItem(PK, JSON.stringify(pr));
    } catch (e) { /* storage blocked */ }
    window.__toasts = [];
    const arm = () => { const el = document.getElementById('toasts'); if (!el) return; new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.classList && n.classList.contains('toast')) window.__toasts.push(n.textContent); }))).observe(el, { childList: true }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
  }, { start: o.start || Date.now(), next: !!o.next, prefs: Object.assign({ lang: 'en', ovrTime: 'day', ovrWeather: 'cloudy', crOne: true }, LIVE_PREFS, o.prefs || {}) });
  const page = await ctx.newPage(); page.errors = [];
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); }); page.on('pageerror', (e) => page.errors.push(e.message));
  return page;
}

async function until(p, fn, arg, ms) { try { await p.waitForFunction(fn, arg, { timeout: ms || 10000, polling: 50 }); return true; } catch (e) { return false; } }

// a new game through the real title and adoption screens (as game/test_lib.js adopt + intro)
async function adoptNew(p, file, o) {
  o = o || {};
  await p.goto('file://' + file); await p.waitForSelector('#tNew, #tContinue', { timeout: 60000 });
  await p.click('#tNew'); await p.waitForSelector('#aAdopt');
  if (o.head) await p.click(`.heads button[aria-label="${o.head}"]`).catch(() => {});
  await p.click(o.sex === 'boy' ? '#aBoy' : '#aGirl'); await p.click('#aAdopt'); await p.waitForSelector('#nOk'); await p.click('#nOk');
  for (let i = 0; i < 6; i++) {
    if (!(await until(p, () => !!document.getElementById('iNext'), null, i ? 1500 : 6000))) break;
    const h = await p.textContent('#modal .panel h2').catch(() => ''); await p.click('#iNext').catch(() => {});
    await until(p, (h) => { const e = document.querySelector('#modal .panel h2'); return !e || e.textContent !== h; }, h, 4000);
  }
  await until(p, () => window.__paw && window.__paw.mode === 'yard', null, 15000);
}

module.exports = { ROOT, HARNESS, ensureHarness, scratchCopy, launch, newPage, until, adoptNew, sleep, LIVE_PREFS, ECON_NAMES };
