// Paw Haven shared test library (desktop 1280x720, game/test_merged.html).
// Every suite is a small file:   require('./test_lib').run('name', async (t) => { ... });
// Run one suite on its own:      NODE_PATH=$(npm root -g) node game/test_smoke.js      (or via run_tests.js)
//
// What this library does for every suite (so tests stay fast and reliable):
//   * one Chromium per suite process, launched with CPU-friendly flags;
//   * every page is PINNED at load: dev overrides prefs ovrTime='day' + ovrWeather='cloudy' (neutral: sunny+day makes the dog hot, which blocks idle behaviours) (override with run({time, weather}))
//     and the page clock is frozen to "today 10:00" (it keeps ticking, but the hour and the date can never roll over mid-run);
//   * waits are conditions (waitForFunction / waitForSelector), never fixed sleeps. t.sleep() exists but suites should avoid it;
//   * exit code 1 on any failed check, a crash or a console error (so run_tests.js can trust the exit code).
// Phone suites (v2.2): run('name', fn, { device: 'iPhone 13' }) or t.mk({ device: 'Pixel 7' }) open the page with that Playwright device profile (touch, DPR, UA).
// Screenshots are OFF by default (they cost time); set PAW_SHOTS=1 (run_tests.js --shots) to write them to game/shots_<suite>/.
const { chromium, devices } = require('playwright'); const path = require('path'); const fs = require('fs');
const URL = 'file://' + path.join(__dirname, 'test_merged.html');
const CHROME = process.env.PAW_CHROME || ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
const LOGS = path.join(__dirname, 'test_logs');
const ARGS = ['--disable-dev-shm-usage', '--mute-audio', '--disable-background-networking', '--disable-sync', '--disable-component-update', '--disable-default-apps', '--no-first-run', '--metrics-recording-only', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--disable-features=CalculateNativeWinOcclusion'];
const EXTRA = (process.env.PAW_ARGS || '').split(/\s+/).filter(Boolean);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

class T {
  constructor(name, opts) {
    this.name = name; this.opts = Object.assign({ time: 'day', weather: 'cloudy', season: 'summer', fest: 'off', date: null, clock: true, timeout: 240000, packCare: false }, opts || {}); // v2.5: season / festival pins (summer, off) and opts.date 'YYYY-MM-DD' for the fake clock. v2.7: packCare false pins prefs.crOne (care acts on the active dog only, as before v2.7)
    this.fails = []; this.errors = []; this.p = null; this.ctx = null; this.b = null; this.checks = 0; this.t0 = Date.now();
    // the page clock: "today 10:00" local, ticking. Computed once per suite so reloads and new pages agree.
    const base = this.opts.date ? new Date(this.opts.date + 'T10:00:00') : new Date(); base.setHours(10, 0, 0, 0); this.clockOffset = base.getTime() - Date.now();
    // bind everything so suites can destructure: const { ok, ev, S, click } = t;
    for (const k of Object.getOwnPropertyNames(T.prototype)) if (k !== 'constructor' && typeof this[k] === 'function') this[k] = this[k].bind(this);
  }
  pageNow() { return Date.now() + (this.opts.clock ? this.clockOffset : 0); }
  // ---------- reporting ----------
  ok(c, l) { this.checks++; console.log(c ? '  ok  ' + l : '  FAIL ' + l); if (!c) this.fails.push(l); return !!c; }
  sec(s) { console.log('\n# ' + s + '  [' + Math.round((Date.now() - this.t0) / 1000) + 's]'); }
  async SH(n) { if (!process.env.PAW_SHOTS) return; const d = path.join(__dirname, 'shots_' + this.name); fs.mkdirSync(d, { recursive: true }); await this.p.screenshot({ path: path.join(d, n + '.png') }); }
  // ---------- browser ----------
  async launch() { this.b = await chromium.launch({ executablePath: CHROME, args: ARGS.concat(EXTRA) }); }
  // new context + page. o: { time, weather, clock, prefs:{}, storage:{key:value} (written once, before the game boots) }
  async mk(o) {
    o = Object.assign({}, this.opts, o || {});
    // o.device: a Playwright device profile name ('iPhone 13', 'Pixel 7') for the v2.2 phone suites; default is the desktop 1280x720
    const ctx = await this.b.newContext(o.device ? Object.assign({}, devices[o.device], { defaultBrowserType: undefined }) : { viewport: { width: 1280, height: 720 } }); this.ctx = ctx;
    ctx.setDefaultTimeout(20000);
    await ctx.addInitScript((cfg) => {
      try {
        // 1) page clock: fixed offset from the real clock so the hour/date never changes under a running test
        if (cfg.clock) {
          const R = Date, OFF = cfg.offset; const now = () => R.now() + OFF;
          class FakeDate extends R { constructor(...a) { if (a.length === 0) super(now()); else super(...a); } static now() { return now(); } }
          window.Date = FakeDate;
        }
        // 2) dev overrides (what the Dev panel Time / Weather selects write). Only set when the key is absent, so a test that picks "auto" stays on auto
        const PK = 'pawhaven_prefs_v1'; let pr = {}; try { pr = JSON.parse(localStorage.getItem(PK) || '{}') || {}; } catch (e) { pr = {}; }
        let ch = false; if (cfg.time && !('ovrTime' in pr)) { pr.ovrTime = cfg.time; ch = true; } if (cfg.weather && !('ovrWeather' in pr)) { pr.ovrWeather = cfg.weather; ch = true; }
        if (cfg.season && !('ovrSeason' in pr)) { pr.ovrSeason = cfg.season; ch = true; } if (cfg.fest && !('ovrFest' in pr)) { pr.ovrFest = cfg.fest; ch = true; } // v2.5
        if (!cfg.packCare && !('crOne' in pr)) { pr.crOne = true; ch = true; } // v2.7: pack care pinned off for the older suites (V27.md section 1)
        for (const k in cfg.prefs || {}) if (!(k in pr)) { pr[k] = cfg.prefs[k]; ch = true; }
        if (ch) localStorage.setItem(PK, JSON.stringify(pr));
        // 3) one-time storage seeding (old-save tests)
        if (cfg.storage && !sessionStorage.getItem('__pawSeeded')) { sessionStorage.setItem('__pawSeeded', '1'); for (const k in cfg.storage) localStorage.setItem(k, cfg.storage[k]); }
      } catch (e) { /* storage blocked */ }
      // 4) toast recorder (survives reloads): window.__toasts collects the text of every toast
      window.__toasts = [];
      const arm = () => { const el = document.getElementById('toasts'); if (!el) return; new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach((n) => { if (n.classList && n.classList.contains('toast')) window.__toasts.push(n.textContent); }))).observe(el, { childList: true }); };
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arm); else arm();
    }, { clock: !!o.clock, offset: this.clockOffset, time: o.time, weather: o.weather, season: o.season, fest: o.fest, packCare: !!o.packCare, prefs: o.prefs || {}, storage: o.storage || null });
    const p = await ctx.newPage();
    p.on('console', (m) => { if (m.type() === 'error') this.errors.push(m.text()); }); p.on('pageerror', (e) => this.errors.push(e.message));
    this.p = p; return p;
  }
  async boot(o) { // fresh page on the title screen
    await this.mk(o); await this.p.goto(URL); await this.p.waitForSelector('#tNew, #tContinue'); return this.p;
  }
  // ---------- state ----------
  ev(f, a) { return this.p.evaluate(f, a); }
  S() { return this.p.evaluate(() => JSON.parse(JSON.stringify(window.__paw.S))); }
  mode() { return this.p.evaluate(() => window.__paw.mode); }
  toasts() { return this.p.evaluate(() => window.__toasts.splice(0)); }
  // wait until a toast matching `re` was shown (does not clear the recorder); false on timeout
  async waitToast(re, ms) { try { await this.p.waitForFunction((s) => { const r = new RegExp(s.src, s.fl); return window.__toasts.some((t) => r.test(t)); }, { src: re.source, fl: re.flags }, { timeout: ms || 8000, polling: 50 }); return true; } catch (e) { return false; } }
  // generic condition wait: returns true/false instead of throwing, so it works inside ok()
  async until(fn, arg, ms) {
    const t0 = Date.now(); let r = true;
    try { await this.p.waitForFunction(fn, arg, { timeout: ms || 10000, polling: 50 }); } catch (e) { r = false; }
    if (process.env.PAW_TRACE && (!r || Date.now() - t0 > 1500)) console.log(`   [${r ? 'slow' : 'TIMEOUT'} wait ${Date.now() - t0}ms] ${String(fn).replace(/\s+/g, ' ').slice(0, 120)}`);
    return r;
  }
  // run `action` until `cond` holds. Many game actions are silently ignored while the dog is "busy" (eating, a potty trip, a dig), and that flag is
  // not visible from outside, so instead of guessing a sleep we just repeat the action (only use with idempotent actions).
  async retryUntil(action, cond, arg, o) { o = Object.assign({ tries: 6, each: 3500 }, o || {}); for (let i = 0; i < o.tries; i++) { await action(); if (await this.until(cond, arg, o.each)) return true; } return false; }
  async untilMode(m, ms) { return this.until((m) => window.__paw.mode === m, m, ms); }
  sleep(ms) { return sleep(ms); }
  // deep-merge a plain object into the live state (the "prepared save" tool). Arrays and primitives replace. Keys under `dog` go to the active dog.
  async patch(obj) {
    await this.p.evaluate((o) => {
      const S = window.__paw.S; const mg = (t, s) => { for (const k in s) { const v = s[k]; if (v && typeof v === 'object' && !Array.isArray(v) && t[k] && typeof t[k] === 'object') mg(t[k], v); else t[k] = v; } };
      const { dog, ...rest } = o; mg(S, rest); if (dog) mg(S.dog, dog); window.__paw.saveNow();
    }, obj);
  }
  // potty timers off so nothing interrupts a test
  calm() { return this.p.evaluate(() => window.__paw.S.dogs.forEach((d) => { d.potty.poopDue = null; d.potty.peeDue = null; d.potty.nextPee = window.__paw.S.gameMin + 9999; })); }
  // level-up modal: dismiss any that is open (no waiting when there is none)
  async lu() { for (let i = 0; i < 6; i++) { if (!(await this.p.locator('#luOk').count())) return; await this.p.click('#luOk'); await this.until(() => !document.getElementById('luOk'), null, 3000); } }
  // wait for the level-up modal (after something that crosses a Bond level) then dismiss it
  async luWait(ms) { if (await this.until(() => !!document.getElementById('luOk'), null, ms || 1500)) await this.lu(); }
  rnd(v) { return this.p.evaluate((v) => { if (!window.__rnd0) window.__rnd0 = Math.random; Math.random = v == null ? window.__rnd0 : () => v; }, v); }
  // ---------- UI flows (all condition-based) ----------
  // adoption through the real UI, then wait for the yard. o: { sex:'girl'|'boy', head: 'aria-label' of a carousel head, name:true -> accept the default name }
  async adopt(o) {
    o = o || {}; const p = this.p;
    await p.click('#tNew'); await p.waitForSelector('#aAdopt');
    if (o.head) await p.click(`.heads button[aria-label${o.head.startsWith('~') ? '$' : ''}="${o.head.replace(/^~/, '')}"]`);
    await p.click(o.sex === 'boy' ? '#aBoy' : '#aGirl'); await p.click('#aAdopt'); await p.waitForSelector('#nOk'); await p.click('#nOk');
    await this.intro(); await this.calm();
  }
  async intro() {
    const p = this.p;
    for (let i = 0; i < 3; i++) {
      await p.waitForSelector('#iNext'); const h = await p.textContent('#modal .panel h2'); await p.click('#iNext');
      await this.until((h) => { const e = document.querySelector('#modal .panel h2'); return !e || e.textContent !== h; }, h, 4000);
    }
    await this.untilMode('yard'); await this.until(() => !document.getElementById('iNext'));
  }
  // new game through the UI + a prepared state patch (default: bond 7, coins 1000, full meters), ready on the yard
  async newGame(o, patch) {
    await this.boot(o); await this.adopt(o);
    if (patch !== false) await this.patch(Object.assign({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 80, happy: 80, energy: 90, clean: 90 } }, patch || {}));
    await this.calm(); return this.S();
  }
  // leave whatever is open and be at the yard (or `place`) with nothing in the way
  async home(place) {
    await this.ev((pl) => { const S = window.__paw.S; S.sleeping = false; if (pl) S.place = pl; window.__paw.go(pl === 'market' ? 'market' : 'yard'); }, place || null);
    await this.calm(); await this.lu();
  }
  // rub the dog until pred(S) is true (petting is distance based, so this is deterministic; ticks are dropped while the dog is busy, so we repeat)
  async pet(pred, arg) {
    const p = this.p;
    for (let round = 0; round < 12; round++) {
      const box = await p.locator('#dogHit').boundingBox();
      for (let i = 0; i < 30; i++) await p.mouse.move(box.x + box.width * (0.3 + 0.4 * (i % 2)), box.y + box.height * 0.4);
      if (await this.until(pred, arg, 600)) return true;
    }
    return false;
  }
  // ---------- multi-dog layout helpers (v1.5 / v1.7 pack tests) ----------
  // where the dogs are drawn, in scene coordinates
  layout() {
    return this.p.evaluate(() => {
      const svg = document.querySelector('#view svg.world'); const M = svg.getScreenCTM().inverse();
      const sc = (els) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; els.forEach((el) => { const r = el.getBoundingClientRect(); if (!r.width) return; const a = new DOMPoint(r.left, r.top).matrixTransform(M), b = new DOMPoint(r.right, r.bottom).matrixTransform(M); x0 = Math.min(x0, a.x); y0 = Math.min(y0, a.y); x1 = Math.max(x1, b.x); y1 = Math.max(y1, b.y); }); return [x0, y0, x1, y1].map(Math.round); };
      const kids = (s) => (s ? [...s.children] : []);
      const pack = [...document.querySelectorAll('#pack .packdog svg.pa-dog')].map((s) => sc(kids(s)));
      const bed = document.querySelector('#bedG svg'), bowl = document.querySelector('#bowlG svg'), house = document.querySelector('#houseG svg');
      return { pack, bed: bed ? sc(kids(bed)) : null, bowl: bowl ? sc(kids(bowl)) : null, house: house ? sc(kids(house)) : null };
    });
  }
  // layout once the dogs stop moving (two identical samples in a row), instead of sleeping a fixed time
  async settledLayout(ms) {
    const end = Date.now() + (ms || 6000); let prev = null, L = null;
    while (Date.now() < end) { L = await this.layout(); const j = JSON.stringify(L); if (j === prev) return L; prev = j; await sleep(120); }
    return L;
  }
  // Motion off (the player's own "Motion and wobble" switch): stops the pack dogs' CSS wander animation so their boxes are measured at their resting spots,
  // not at a random phase of a 7 s sway (that phase made the old overlap checks fail about 1 run in 3). Returns the previous setting for restoring.
  freezeMotion(on) { return this.p.evaluate((on) => { const h = document.documentElement; const prev = h.dataset.motion || ''; if (on) h.dataset.motion = 'off'; else if (on === false) { if (window.__motionPrev) h.dataset.motion = window.__motionPrev; else delete h.dataset.motion; } if (on) window.__motionPrev = prev; return prev; }, on); }
  // The pack dogs pick a random pose on their first tick and again every 5-10 s x idle speed; each pose has a slightly different box, and a few random poses
  // touch the bowl by a few px (a layout quirk in the game: reported, not chased in tests). To measure steady, repeatable layouts:
  //   await t.packPin(true);   // idle speed 0.001: pack dogs re-pick a pose every tick while we add/adopt them
  //   ...add / adopt the secondary dogs, be on the yard...
  //   await t.packPin(false);  // pins Math.random so the pick is always 'sit', waits for it, then idle speed 200 (next pick ~20 min away) and unpins
  // (Math.random must NOT be pinned while dogs are created: their ids come from it.)
  async packPin(on) {
    if (on) { await this.ev(() => window.__paw.idle.speed(0.001)); return; }
    await this.rnd(0.3);
    await this.until(() => { const l = [...document.querySelectorAll('#pack svg.pa-dog')]; return l.length > 0 && l.every((s) => /pa-pose-(sit|down|sleep)\b/.test(s.getAttribute('class') || '')); }, null, 15000);
    await this.ev(() => window.__paw.idle.speed(200)); await sleep(400); // one more pick may still be due: let it happen under the pin
    await this.rnd(null);
  }
  hitR(a, b) { return !!a && !!b && a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]; }
  async packCheck(place, label, nPack) {
    const { ok, hitR } = this;
    await this.ev((pl) => { const S = window.__paw.S; S.dogs.forEach((d) => { d.sleeping = false; }); S.place = pl; window.__paw.go('yard'); }, place);
    await this.until((n) => document.querySelectorAll('#pack .packdog svg.pa-dog').length === n, nPack || 3, 6000);
    await this.freezeMotion(true); const L = await this.settledLayout(); await this.freezeMotion(false);
    const zone = place === 'yard' ? [620, 330, 860, 530] : place === 'house' ? (L.bed || [625, 450, 860, 540]) : null, ACT = [315, 300, 548, 508];
    const pairs = []; L.pack.forEach((a, i) => L.pack.forEach((b, j) => { if (i < j && hitR(a, b)) pairs.push(i + '/' + j); }));
    ok(L.pack.length === (nPack || 3), `${label}: ${nPack || 3} secondary dogs drawn`);
    if (zone) ok(L.pack.every((r) => !hitR(r, zone)), `${label}: no secondary dog touches the ${place === 'yard' ? 'dog-house' : 'bed'} zone ${JSON.stringify(zone)}: ${JSON.stringify(L.pack)}`);
    ok(!pairs.length && L.pack.every((r) => !hitR(r, ACT) && !hitR(r, L.bowl)), `${label}: dogs do not overlap each other, the active dog or the bowl ${pairs.join(',')} ${JSON.stringify({ pack: L.pack, bowl: L.bowl })}`);
    ok(L.pack.every((r) => r[3] <= 604 && r[3] >= 395), `${label}: every dog's feet are on the ground band (y ${L.pack.map((r) => r[3]).join(', ')})`);
    return L;
  }
  // map -> shelter (a screen with a modal, not a place)
  async toShelter() {
    const p = this.p; await p.click('[data-act=map]'); await p.waitForSelector('[data-area=shelter]'); await p.evaluate(() => window.__paw.mapTo('shelter'));
    for (let i = 0; i < 6; i++) { await p.click('[data-area=shelter]', { force: true }); if (await this.until(() => window.__paw.mode === 'shelter', null, 2500)) break; }
    if (!(await this.until(() => window.__paw.mode === 'shelter', null, 500))) return false;
    if (await this.until(() => !!document.querySelector('#modal .panel .shcard'), null, 1500)) return true; // v2.6: the list opened by itself
    // v2.7 the Shelter Playroom: the list ("Looking for a home") opens from the Adopt-me board, not by itself (V27.md section 7)
    await p.evaluate(() => { const sr = window.__paw.sr; if (sr && typeof sr.list === 'function' && !document.querySelector('#modal .panel .shcard')) sr.list(); });
    return this.until(() => !!document.querySelector('#modal .panel .shcard'), null, 4000);
  }
  async leaveShelter() { await this.closeX(); await this.p.keyboard.press('Escape'); await this.untilMode('yard'); }
  // open the Dev panel, run fn, close it. (the panel is the real dev panel, so its handlers are the ones under test)
  async dev(fn) {
    const p = this.p; await p.click('#devBtn'); await p.waitForSelector('#devPanel:not([hidden])'); await fn();
    if (await p.locator('#devPanel:not([hidden])').count()) await p.click('#dvX');
    await this.lu();
  }
  // travel through the map screen: map -> click the area -> wait for "On the way" to finish and the place to change
  async travel(k) {
    const p = this.p; await p.click('[data-act=map]'); await p.waitForSelector(`[data-area=${k}]`);
    await p.evaluate((k) => window.__paw.mapTo(k), k);
    // the game ignores a map click while it is busy (e.g. a dig animation): click again until the trip starts
    for (let i = 0; i < 12; i++) {
      await p.click(`[data-area=${k}]`, { force: true });
      if (await this.until((k) => window.__paw.S.place === k || !!document.querySelector('.onway'), k, 1500)) break;
    }
    await this.until((k) => window.__paw.S.place === k && !document.querySelector('.onway') && window.__paw.mode !== 'map', k, 15000);
    await this.lu(); await this.calm();
  }
  popVisible() { return this.p.evaluate(() => { const d = document.getElementById('dock'); return !!d.querySelector('.tray:not(.dock-idle):not(.mini)') && getComputedStyle(d).display !== 'none'; }); }
  async waitPop(on, ms) { return this.until((on) => { const d = document.getElementById('dock'); const v = !!d.querySelector('.tray:not(.dock-idle):not(.mini)') && getComputedStyle(d).display !== 'none'; return v === on; }, !!on, ms || 5000); }
  // close a modal panel by its X and wait until it is gone
  async closeX() { const p = this.p; if (await p.locator('.panel .x').count()) { await p.click('.panel .x'); await this.until(() => !document.querySelector('#modal .panel .x') || document.getElementById('modal').hidden, null, 4000); } }
  async modalGone() { return this.until(() => document.getElementById('modal').hidden || !document.querySelector('#modal .panel'), null, 4000); }
  // purchase / sale window ("buyveil"): wait for it, set the quantity, confirm
  async win(q) {
    const p = this.p; await p.waitForSelector('.buyveil .bb-yes');
    if (q && q !== 1) { await p.fill('.bb-in', String(q)); await this.until((q) => document.querySelector('.bb-in').value === String(q), q); }
    await p.click('.bb-yes'); await p.waitForSelector('.buyveil', { state: 'detached' });
  }
  async buy(name, q) { await this.p.click(`[data-buy="${name}"]`); await this.win(q); }
  // wait for a modal heading
  async waitH2(re, ms) { return this.until((s) => { const h = document.querySelector('#modal .panel h2, #modal .panel h3'); return !!h && new RegExp(s).test(h.textContent); }, re.source, ms || 6000); }
  // after a walk screen was opened (route start button or __paw.go('walk')): click through the first-walk "How to walk" card if it shows;
  // runWait: also wait for the 3-2-1 countdown to finish (the runner is running). Returns false if the walk never came up.
  async walkGate(runWait) {
    const p = this.p;
    const up = await this.until(() => window.__paw.mode === 'walk' && !!(document.querySelector('.pw-ov [data-go]') || document.querySelector('.pw-cd')), null, 15000);
    const g = p.locator('.pw-ov [data-go]'); if (up && await g.count()) await g.first().click();
    if (runWait) await this.until(() => { const o = document.querySelector('.pw-ov'); return window.__paw.mode === 'walk' && !!o && o.hidden; }, null, 12000);
    return up;
  }
  // start a walk from the route carousel. runWait: also wait for the countdown to finish
  async startWalk(runWait) {
    const p = this.p; await p.click('[data-act=walk]'); await p.waitForSelector('#rtStart'); await this.SH('routes');
    await p.click('#rtStart'); return this.walkGate(runWait);
  }
  // quit the walk with "Head home early" and collect the results screen (clicks OK when `okToo`)
  async quitWalk(okToo) {
    const p = this.p; await p.keyboard.press('Escape');
    await this.until(() => !!document.querySelector('[data-home]') || !!document.getElementById('resOk'), null, 8000);
    if (await p.locator('[data-home]').count()) await p.click('[data-home]');
    const got = await this.until(() => !!document.getElementById('resOk'), null, 15000);
    if (got && okToo) { await p.click('#resOk'); await this.until(() => window.__paw.mode === 'yard' && !document.getElementById('resOk'), null, 8000); await this.lu(); }
    return got;
  }
  // ---------- finish ----------
  async finish() {
    this.ok(this.errors.length === 0, 'no console errors' + (this.errors.length ? ' -> ' + [...new Set(this.errors)].slice(0, 4).join(' | ') : ''));
    const secs = Math.round((Date.now() - this.t0) / 1000);
    console.log(`\n${this.checks} checks in ${secs}s`);
    console.log(this.fails.length ? `FAILED ${this.fails.length}: ${this.fails.join(' | ')}` : 'ALL OK');
    if (this.fails.length) process.exitCode = 1;
  }
}

async function run(name, body, opts) {
  fs.mkdirSync(LOGS, { recursive: true });
  const t = new T(name, opts);
  const dog = setTimeout(() => { console.log(`CRASH watchdog: ${name} ran longer than ${t.opts.timeout / 1000}s`); process.exit(1); }, t.opts.timeout); dog.unref();
  try { await t.launch(); await body(t); await t.finish(); }
  catch (e) {
    console.log('CRASH', e && e.stack ? e.stack.split('\n').slice(0, 6).join('\n') : e); process.exitCode = 1;
    try { if (t.p) await t.p.screenshot({ path: path.join(LOGS, name + '_crash.png') }); } catch (e2) { /* page gone */ }
    if (t.fails.length) console.log(`FAILED ${t.fails.length}: ${t.fails.join(' | ')}`);
  } finally { try { await t.b.close(); } catch (e) { /* closed */ } }
}
module.exports = { run, T, URL, sleep };
