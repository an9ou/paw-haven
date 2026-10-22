// I18N FIT (v2.14, the owner via the Game Manager: "make sure all languages can fit in all the menus, windows, boxes; all sizes can be adjusted
// when needed"). The MEASURING TOOL only: it opens every screen of the game in every language at every size and lists text that does not fit.
//   node game/run_tests.js i18n_fit [--jobs N]          (its own group: not in `all` or `phone`; about 25 min for 11 languages x 5 sizes with --jobs 3)
//   PAW_LANGS=en,th node game/run_tests.js i18n_fit       a few languages              PAW_FIT_SIZES=desktop,iphone15   a few sizes
//   PAW_FIT_REPORT_ONLY=1                                 report mode: always passes (the report is still written)
//   PAW_FIT_JOBS=N                                        parallel browsers (default: the runner's --jobs, else CPU cores - 1)
//   PAW_FIT_SCREENS=title,yard,...                        only the steps whose name starts with one of these (debugging)
// Output: game/test_logs/i18n_fit.json (every finding), game/test_logs/i18n_fit.md (counts per language x size x kind, the worst 50 deduped by
// selector + kind across languages, with the i18n key), game/test_logs/fit_shots/ (the 30 worst, the element framed in red).
// The suite FAILS while any finding remains (or a screen could not be opened), and always prints the summary. Checks and false-positive
// rules: game/fit_lib.js; how to read and run it: docs/i18n/coord/FIT.md.
//
// Sizes: desktop 1280x720 (also the itch.io embed: "Viewport dimensions 1280 x 720", brand/itch/description.md, and the doodledoggo.app game box
// wider than 820 px: site/js/site.js draws the game at 1280 px and scales the frame down, so its layout is this one); embed = the doodledoggo.app
// game box on a 768 px tablet (portrait iPad: the box is 684 x 716, measured by site_fit, and below 820 px the game is drawn 1:1, in its phone layout, with touch);
// iphone15 393x852 dpr 3, pixel7 412x915 dpr 2.625, small 360x640 dpr 2 (phone layout). Phone rules (44 px taps, 15 / 13 px text) apply to
// every phone-layout size (embed included).
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const M = require('./i18n/msg.js');
const FIT = require('./fit_lib');
const LOGS = path.join(__dirname, 'test_logs'), PARTS = path.join(LOGS, 'i18n_fit_parts'), TMP = path.join(LOGS, 'i18n_fit_tmpshots');
const LANGS_ALL = ['en'].concat(M.CODES.filter((c) => c !== 'en'));
const LANGS = process.env.PAW_LANGS ? process.env.PAW_LANGS.split(',').map((s) => s.trim()).filter(Boolean) : LANGS_ALL;
const SIZES_ALL = ['desktop', 'embed', 'iphone15', 'pixel7', 'small'];
const SIZES = process.env.PAW_FIT_SIZES ? process.env.PAW_FIT_SIZES.split(',').map((s) => s.trim()).filter(Boolean) : SIZES_ALL;
const REPORT_ONLY = !!process.env.PAW_FIT_REPORT_ONLY;
const SCREENS = process.env.PAW_FIT_SCREENS ? process.env.PAW_FIT_SCREENS.split(',').map((s) => s.trim()).filter(Boolean) : null;
const SHOTS_PER_JOB = 30, SHOTS_KEEP = 30;
// captions (13 px floor on phones): the classes the phone CSS sets to 13 px on purpose (game/css/2x_phone_*.css: .small, .stamp, .hw-tag,
// .pd-st, .pd-rules, .cr-cap, .fsub, .pc-mark, .wn-cue, #trainPanel small) and the generic caption classes of the title and cards
// plus every selector the phone CSS itself sets to 13 px (read from game/css at start, under html[data-layout="phone"])
const CAPTIONS = ['small, .small, .sub, .cap, .caption, .crayon-note, .tagline, .stamp, .hw-tag, .hwtag, .badge, .tag, sup, sub'].concat((() => {
  const out = new Set(), dir = path.join(__dirname, 'css');
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.css'))) {
    const css = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) if (/font-size:\s*13(\.\d+)?px/.test(m[2])) m[1].split(',').map((x) => x.trim()).filter((x) => /html\[data-layout="phone"\]/.test(x)).forEach((x) => out.add(x.replace(/html\[data-layout="phone"\]\s*/, '').trim()));
  }
  return [...out].filter(Boolean);
})()).join(', ');
// overlays: whatever is inside these sits on top of the page on purpose (R5 in fit_lib.js)
const LAYERS = '#modal, .buyveil, #toasts, .toast, #bubble, .bubble, .pg-bubble, .pt-bubble, .lptip, .pt-tip, .ps-tip, #gdLayer, #trainPanel, .pw-ov, #mapGo, .onway, .tk-ride, #psTurn, .confirm';

function sizeProfile(size) {
  const { devices } = require('playwright');
  const ph = (base, w, h, dpr) => Object.assign({}, devices[base], { viewport: { width: w, height: h }, screen: { width: w, height: h }, deviceScaleFactor: dpr, defaultBrowserType: undefined });
  const P = {
    desktop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
    embed: { viewport: { width: 684, height: 716 }, screen: { width: 768, height: 1024 }, deviceScaleFactor: 2, hasTouch: true, isMobile: false, userAgent: devices['Desktop Chrome'].userAgent },
    iphone15: ph('iPhone 15', 393, 852, 3),
    pixel7: ph('Pixel 7', 412, 915, 2.625),
    small: ph('Pixel 7', 360, 640, 2),
  };
  if (!P[size]) throw new Error('unknown size ' + size);
  devices['FIT ' + size] = P[size]; return 'FIT ' + size;
}

// ======================================================================= master =======================================================================
async function master() {
  const t0 = Date.now();
  fs.rmSync(PARTS, { recursive: true, force: true }); fs.mkdirSync(PARTS, { recursive: true }); fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
  const jobs = []; for (const l of LANGS) for (const s of SIZES) jobs.push(l + ':' + s);
  // the heavy jobs first (phones at dpr 3), so the parallel schedule ends together
  const N = Math.max(1, parseInt(process.env.PAW_FIT_JOBS || process.env.PAW_JOBS || String(Math.max(1, os.cpus().length - 1)), 10));
  console.log(`i18n_fit: ${LANGS.length} languages x ${SIZES.length} sizes = ${jobs.length} sessions, ${N} at a time${REPORT_ONLY ? ' (report mode)' : ''}`);
  const crashed = [];
  await new Promise((done) => {
    let running = 0; const q = jobs.slice();
    const next = () => {
      if (!q.length && !running) return done();
      while (running < N && q.length) {
        const j = q.shift(); running++; const s = Date.now();
        const log = path.join(PARTS, j.replace(':', '_') + '.log'), out = fs.openSync(log, 'w');
        const ch = cp.spawn(process.execPath, [__filename], { env: Object.assign({}, process.env, { FIT_JOB: j }), stdio: ['ignore', out, out] });
        const kill = setTimeout(() => { try { ch.kill('SIGKILL'); } catch (e) { /* gone */ } }, 900000);
        ch.on('exit', (code) => {
          clearTimeout(kill); fs.closeSync(out); running--;
          const ok = fs.existsSync(path.join(PARTS, j.replace(':', '_') + '.json'));
          if (!ok) crashed.push(`${j}: the session crashed (exit ${code}), see ${path.relative(process.cwd(), log)}: ` + (fs.readFileSync(log, 'utf8').split('\n').filter((l) => /CRASH|Error/.test(l))[0] || '').slice(0, 160));
          console.log(`  ${ok ? 'done ' : 'CRASH'} ${j.padEnd(18)} ${Math.round((Date.now() - s) / 1000)} s`);
          next();
        });
      }
    };
    next();
  });
  const all = [], unreached = crashed.slice(), ran = [], states = {};
  for (const j of jobs) {
    const f = path.join(PARTS, j.replace(':', '_') + '.json'); if (!fs.existsSync(f)) continue;
    const part = JSON.parse(fs.readFileSync(f, 'utf8')); all.push(...part.findings); unreached.push(...part.unreached); ran.push(j); states[j] = part.states;
  }
  const meta = { title: 'I18N FIT: the game (suite i18n_fit)', langs: LANGS, sizes: SIZES, ran, unreached, secs: (Date.now() - t0) / 1000, i18nDir: path.join(__dirname, 'i18n'),
    extra: ['## Screens measured per session', '', ...Object.entries(states).map(([j, s]) => `- ${j}: ${s.length} states`)] };
  const kept = FIT.keepShots(all, TMP, path.join(LOGS, 'fit_shots'), SHOTS_KEEP);
  const r = FIT.report('i18n_fit', all, meta);
  console.log('\n' + FIT.summary(all, meta).join('\n'));
  console.log(`report: ${path.relative(process.cwd(), r.md)}, game/test_logs/i18n_fit.json, ${kept} screenshots in game/test_logs/fit_shots/`);
  console.log('worst 10:'); r.groups.slice(0, 10).forEach((g, i) => console.log(`  ${i + 1}. ${g.worst.kind}/${g.worst.how} ${g.worst.sev} ${g.worst.screen} [${g.worst.lang} ${g.worst.size}] "${g.worst.text}" ${g.worst.sel}`));
  if (unreached.length) { console.log('screens not opened:'); unreached.slice(0, 40).forEach((u) => console.log('  ' + u)); }
  const bad = all.length + unreached.length;
  if (REPORT_ONLY || !bad) console.log(`\nALL OK${bad ? ' (report mode: ' + all.length + ' findings, ' + unreached.length + ' screens not opened)' : ''}`);
  else { console.log(`\nFAILED: ${all.length} findings, ${unreached.length} screens not opened (PAW_FIT_REPORT_ONLY=1 for report mode)`); process.exitCode = 1; }
}

// ======================================================================= one session ==================================================================
async function worker(job) {
  const [lang, size] = job.split(':');
  const { T, URL } = require('./test_lib');
  const dev = sizeProfile(size);
  const t = new T('i18n_fit_' + lang + '_' + size, { lang, timeout: 900000 });
  const findings = [], unreached = [], states = [], kept = [], byKey = new Map(); let shotN = 0;
  const tag = lang + '_' + size;
  const dog = setTimeout(() => { console.log('CRASH watchdog'); process.exit(1); }, 840000); dog.unref();
  // the longest real toast and speech lines of this language (keys used with toast(tt(...)) / say(tt(...)) in game/src, no {vars})
  const lines = (() => {
    let j = {}; try { j = JSON.parse(fs.readFileSync(path.join(__dirname, 'i18n', lang + '.json'), 'utf8')); } catch (e) { /* no table */ }
    const en = JSON.parse(fs.readFileSync(path.join(__dirname, 'i18n', 'en.json'), 'utf8'));
    const src = fs.readdirSync(path.join(__dirname, 'src')).filter((f) => f.endsWith('.js')).map((f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8')).join('\n');
    const keys = (re) => [...new Set([...src.matchAll(re)].map((m) => m[1]))].filter((k) => en[k] && !/[{<]/.test(en[k]));
    const longest = (ks, n) => ks.map((k) => [k, j[k] || en[k]]).sort((a, b) => b[1].length - a[1].length).slice(0, n);
    return { toast: longest(keys(/\btoast\(tt\('([a-z0-9_.]+)'/g), 2), say: longest(keys(/\bsay\(tt\('([a-z0-9_.]+)'/g), 1) };
  })();
  try {
    await t.launch();
    const phone = size !== 'desktop';
    const cfg = { phone, stage: '#stage', skip: '#devPanel, #devBtn', captions: CAPTIONS, layers: LAYERS, svgText: '#mapInner [data-area] text, #view [data-area] text' };
    const p0 = await t.mk({ lang, device: dev, prefs: { gdTest: true, tkTest: true, jpTest: true, exTest: true } });
    let p = p0;
    const ev = (f, a) => t.p.evaluate(f, a);
    const sleep = (ms) => t.sleep(ms);
    // wait until fonts are in and no finite animation runs (the sheets and popups fade and slide in), at most 1.5 s
    const settle = async () => {
      await t.p.evaluate(async () => {
        try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]); } catch (e) { /* no fonts api */ }
        const t0 = performance.now();
        while (performance.now() - t0 < 1500) {
          const run = document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming && a.effect.getComputedTiming().iterations !== Infinity && !(a.effect.target && a.effect.target.closest && a.effect.target.closest('svg')));
          if (!run.length) break; await new Promise((r) => setTimeout(r, 60));
        }
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      }).catch(() => {});
    };
    const want = (name) => !SCREENS || SCREENS.some((s) => name.startsWith(s));
    // measure what is on screen now as `screen`
    const measure = async (screen) => {
      if (!want(screen)) return;
      await settle();
      let r; try { r = await t.p.evaluate(FIT.MEASURE, cfg); } catch (e) { unreached.push(`${lang} ${size} ${screen}: measure failed: ${e.message.split('\n')[0]}`); return; }
      states.push({ screen, n: r.n, f: r.findings.length });
      const fs2 = r.findings.map((f) => Object.assign({ lang, size, screen }, f)).sort((a, b) => b.sev - a.sev);
      // one finding per session for each element and kind (the HUD and the action bar are on every screen): the worst one, with the count of
      // states it was seen in and the first screens
      for (const f of fs2) {
        const k = f.kind + '|' + f.how + '|' + f.sel, g = byKey.get(k);
        if (!g) { f.states = 1; f.screens = [screen]; byKey.set(k, f); findings.push(f); continue; }
        g.states++; if (g.screens.length < 6 && !g.screens.includes(screen)) g.screens.push(screen);
        if (f.sev > g.sev) { const keep = { states: g.states, screens: g.screens }; Object.keys(g).forEach((x) => delete g[x]); Object.assign(g, f, keep); }
        f.dup = true;
      }
      // screenshots: only for findings that enter this session's worst 30 (distinct selector + kind), at most 3 per state
      let taken = 0;
      for (const f0 of fs2) {
        if (taken >= 3) break; const f = byKey.get(f0.kind + '|' + f0.how + '|' + f0.sel); if (f.screen !== screen || f.shot) continue; // the session's instance, measured now
        const k = f.kind + '|' + f.sel, prev = kept.find((x) => x.k === k);
        if (prev && prev.sev >= f.sev) continue;
        if (!prev && kept.length >= SHOTS_PER_JOB && kept[kept.length - 1].sev >= f.sev) continue;
        const file = `${tag}_${++shotN}.png`;
        try {
          await t.p.evaluate(FIT.HILITE, { rect: f.rect, label: `${f.kind}/${f.how} ${lang} ${size} ${screen}: ${f.text.slice(0, 50)}` });
          await t.p.screenshot({ path: path.join(TMP, file), scale: 'css', timeout: 8000 });
        } catch (e) { continue; } finally { await t.p.evaluate(FIT.HILITE, null).catch(() => {}); }
        f.shot = file; taken++;
        if (prev) { prev.sev = f.sev; } else kept.push({ k, sev: f.sev });
        kept.sort((a, b) => b.sev - a.sev); if (kept.length > SHOTS_PER_JOB) kept.length = SHOTS_PER_JOB;
      }
    };
    const has = (sel) => ev((s) => { const e = document.querySelector(s); return !!e && !!e.getClientRects().length; }, sel);
    const jsClick = (sel) => ev((s) => { const e = document.querySelector(s); if (!e) throw new Error('missing ' + s); e.click(); return true; }, sel);
    const waitSel = (sel, ms) => t.until((s) => { const e = document.querySelector(s); return !!e && !!e.getClientRects().length; }, sel, ms || 5000);
    const modalUp = () => t.until(() => !document.getElementById('modal').hidden && !!document.querySelector('#modal .panel'), null, 4000);
    const anyOverlay = () => ev(() => !!(document.querySelector('.buyveil') || (!document.getElementById('modal').hidden && document.querySelector('#modal .panel')) || (document.getElementById('trainPanel') && !document.getElementById('trainPanel').hidden)));
    // close whatever is open: purchase window, training, modals (their X, else Escape)
    const closeAll = async () => {
      for (let i = 0; i < 6; i++) {
        const st = await ev(() => ({ buy: !!document.querySelector('.buyveil'), tr: !!document.getElementById('trainPanel') && !document.getElementById('trainPanel').hidden, modal: !document.getElementById('modal').hidden && !!document.querySelector('#modal .panel'), x: !!document.querySelector('#modal .panel .x'), lu: !!document.getElementById('luOk') })).catch(() => ({}));
        if (st.lu) { await jsClick('#luOk').catch(() => {}); await sleep(200); continue; }
        if (st.buy) { await ev(() => { const n = document.querySelector('.buyveil .bb-no'); if (n) n.click(); }).catch(() => {}); if (await ev(() => !!document.querySelector('.buyveil'))) await t.p.keyboard.press('Escape'); await sleep(250); continue; }
        if (st.tr) { await jsClick('#trX').catch(() => {}); await sleep(250); continue; }
        if (st.modal) { if (st.x) await jsClick('#modal .panel .x').catch(() => {}); else await t.p.keyboard.press('Escape'); await sleep(300); continue; }
        break;
      }
    };
    const recover = async () => {
      await closeAll();
      try { await ev(() => { const P = window.__paw; if (P.bl && P.bl.on) P.bl.stop(); if (P.ph && P.ph.active()) P.ph.close(); }); } catch (e) { /* none */ }
      try { if (!['yard'].includes(await t.mode()) || (await ev(() => window.__paw.S.place)) !== 'yard') await t.home('yard'); } catch (e) { /* try on */ }
      await closeAll();
    };
    const step = async (name, fn, ms) => {
      if (!want(name)) return;
      let to; const s = Date.now();
      try { await Promise.race([fn(), new Promise((_, rej) => { to = setTimeout(() => rej(new Error('step timeout')), ms || 45000); })]); }
      catch (e) { unreached.push(`${lang} ${size} ${name}: ${(e && e.message ? e.message : String(e)).split('\n')[0].slice(0, 160)}`); console.log(`  step ${name} FAILED: ${e && e.message ? e.message.split('\n')[0] : e}`); await recover().catch(() => {}); }
      finally { clearTimeout(to); }
      console.log(`  step ${name} ${Date.now() - s} ms`);
    };
    const atPlace = async (k) => {
      await ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, k);
      await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard' && !!document.getElementById('placeBtns'), k, 8000); await t.calm(); await t.lu();
    };
    // the tabs of the open panel: measure each one (journal, shops, wardrobe, mailbox), `pre` names the screen
    const eachTab = async (pre, tabsSel, max) => {
      const n = await ev((s) => document.querySelectorAll(s).length, tabsSel);
      for (let i = 0; i < Math.min(n, max || 12); i++) {
        const lbl = await ev(([s, i]) => { const b = document.querySelectorAll(s)[i]; if (!b) return null; const k = b.dataset.jt || b.dataset.tab || b.dataset.mt || b.dataset.ptab || b.dataset.trtab || b.dataset.wt || String(i); b.click(); return k; }, [tabsSel, i]);
        if (lbl == null) break; await sleep(250); await measure(`${pre}: ${lbl}`);
      }
    };

    // ---------------------------------------------------------------- title, account (later), adoption ----------------------------------------------------------------
    await p.goto(URL); await p.waitForSelector('#tNew, #tContinue');
    await step('title', async () => { await measure('title'); });
    await step('title language menu', async () => {
      await jsClick('#tLang'); await waitSel('.langsheet [data-lang]'); await measure('title: language menu');
      await t.p.keyboard.press('Escape'); await sleep(250); if (await has('.langsheet')) await jsClick(`.langsheet [data-lang="${lang}"]`).catch(() => {}); await t.until(() => document.getElementById('modal').hidden, null, 3000);
    });
    await step('adoption', async () => {
      await jsClick('#tNew'); await waitSel('#aAdopt', 8000); await measure('adoption');
      await jsClick('#aGirl').catch(() => {}); await jsClick('#aAdopt'); await waitSel('#nOk', 8000); await measure('adoption: naming');
      await jsClick('#nOk');
      for (let i = 0; i < 3; i++) {
        await waitSel('#iNext', 8000); await measure(`adoption: intro card ${i + 1}`);
        const h = await ev(() => { const e = document.querySelector('#modal .panel h2'); return e ? e.textContent : ''; }); await jsClick('#iNext');
        await t.until((h) => { const e = document.querySelector('#modal .panel h2'); return !e || e.textContent !== h; }, h, 4000);
      }
      await t.untilMode('yard'); await t.calm();
    }, 60000);
    if ((await t.mode().catch(() => '')) !== 'yard') { await t.adopt({ sex: 'girl' }).catch(() => {}); }
    // ---------------------------------------------------------------- Gerald's guide (prefs.gdTest) ----------------------------------------------------------------
    const gdAt = (i) => t.until((i) => { const c = document.querySelector('#gdLayer .gd-card'); return !!c && !c.hidden && +c.dataset.step === i; }, i, 6000);
    await step('guide', async () => {
      if (!(await gdAt(0))) throw new Error('the guide strip did not show');
      await measure('guide: step 0 hello'); await jsClick('#gdLayer .gd-next');
      if (await gdAt(1)) await measure('guide: step 1 feed');
      await jsClick('[data-act=feed]'); await t.waitPop(true); await measure('feed tray');
      await t.retryUntil(() => ev(() => { const b = document.querySelector('[data-food="Basic Kibble"]'); if (b) b.click(); }), () => window.__paw.S.guide.step === 2, null, { tries: 5, each: 2500 });
      await t.waitPop(false); await t.calm(); await sleep(300); await measure('yard: after feeding (toast, bubble)');
      for (let i = 2; i < 10; i++) { if (!(await gdAt(i))) break; await measure(`guide: step ${i}`); await jsClick('#gdLayer .gd-next'); }
      await t.until(() => { const c = document.querySelector('#gdLayer .gd-card'); return !c || c.hidden; }, null, 4000);
    }, 70000);
    await ev(() => { const c = document.querySelector('#gdLayer .gd-skip'); const card = document.querySelector('#gdLayer .gd-card'); if (c && card && !card.hidden) c.click(); }).catch(() => {});
    // a prepared save: bond 10, coins, a second dog (playdates, pack), owned clothes and toys
    await t.patch({ bond: { level: 10, pts: 3300 }, coins: 5000, careDays: 60, stats: { hunger: 80, happy: 80, energy: 90, clean: 90 } }).catch(() => {});
    await ev(() => { const P = window.__paw; if (P.S.dogs.length < 2) { const m = P.addDog({ key: 'dachs', sex: 'male', months: 30 }, 'Otto'); m.bond = { level: 10, pts: 3300 }; } P.saveNow(); }).catch(() => {});
    await t.calm().catch(() => {}); await t.home('yard').catch(() => {});

    // ---------------------------------------------------------------- yard, HUD, trays, toasts and bubbles ----------------------------------------------------------------
    await step('yard', async () => { await measure('yard'); });
    if (phone) await step('yard HUD expanded', async () => { await jsClick('#meters'); await sleep(300); await measure('yard: HUD meters expanded'); await jsClick('#view').catch(() => {}); await ev(() => document.getElementById('hud').classList.remove('hexp')); });
    for (const a of ['feed', 'play', 'care']) await step(a + ' tray', async () => { await jsClick(`[data-act=${a}]`); if (!(await t.waitPop(true))) throw new Error('no tray'); await measure(a + ' tray'); await jsClick(`[data-act=${a}]`); await t.waitPop(false); });
    await step('toasts and bubble', async () => {
      await ev((L) => { const P = window.__paw, tt = window.PawI18n.tt; L.toast.forEach(([k, en]) => P.toast(tt(k, en))); if (L.say[0] && P.home) P.home.say(tt(L.say[0][0], L.say[0][1]), 600, 420); }, lines);
      await sleep(350); await measure('toasts + speech bubble (longest lines)');
      await ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const b = document.getElementById('bubble'); if (b) b.hidden = true; });
    });
    if (phone) await step('phone menu', async () => { await jsClick('#moreBtn'); await modalUp(); await measure('phone menu (⋯)'); await closeAll(); });
    await step('settings', async () => {
      await ev(() => { const m = document.getElementById('moreBtn'); if (m && m.offsetParent) m.click(); else document.getElementById('gearBtn').click(); });
      if (await t.until(() => !!document.getElementById('mmSet'), null, 1500)) await jsClick('#mmSet');
      await waitSel('#setLang'); await measure('settings');
      await ev(() => { const b = document.querySelector('#modal .panel-body'); if (b) b.scrollTop = b.scrollHeight; }); await measure('settings (scrolled down)');
      await jsClick('#setLang'); await waitSel('#setLangBox [data-lang]'); await measure('settings: language list'); await closeAll();
    });
    // ---------------------------------------------------------------- wardrobe, journal, mailbox, missions ----------------------------------------------------------------
    await step('wardrobe', async () => { await jsClick('[data-act=wardrobe]'); await waitSel('.ward'); await measure('wardrobe'); await eachTab('wardrobe', '#modal .panel [role=tab]', 6); await closeAll(); });
    await step('journal', async () => { await jsClick('[data-act=journal]'); await waitSel('.panel.journal'); await eachTab('journal', '#modal .jtabs [data-jt]', 14); await closeAll(); }, 90000);
    await step('mailbox', async () => {
      await ev(() => window.__paw.openMailbox()); await modalUp(); await measure('mailbox');
      await eachTab('mailbox', '#modal .panel .mbtabs [role=tab], #modal .panel .mbtabs button', 5);
      const opened = await ev(() => { const b = document.querySelector('#modal .panel [data-mail], #modal .panel [data-letter], #modal .panel .mbitem'); if (b) { b.click(); return true; } return false; });
      if (opened) { await sleep(400); await measure('mailbox: a letter'); }
      await closeAll();
    });
    await step('missions', async () => { await ev(() => window.__paw.ms.open()); await modalUp(); await measure('missions'); await closeAll(); });
    await step('dog card settings', async () => { await ev(() => window.__paw.dc.settings(true)); await modalUp(); await measure('dog cards: my card settings'); await closeAll(); });
    // ---------------------------------------------------------------- photo, training, ball ----------------------------------------------------------------
    await step('photo mode', async () => { await ev(() => window.__paw.ph.open()); await t.until(() => window.__paw.ph.active(), null, 5000); await sleep(600); await measure('photo mode'); await ev(() => window.__paw.ph.close()); await t.until(() => !window.__paw.ph.active(), null, 4000); });
    await step('training', async () => {
      await ev(() => { const S = window.__paw.S; ['Sit', 'Paw', 'Lie Down'].forEach((n) => { S.dog.tricks[n] = S.dog.tricks[n] || { p: 1, shows: 0 }; }); });
      await jsClick('[data-act=play]'); await t.waitPop(true); await jsClick('[data-play=tricks]'); await waitSel('#trainPanel'); await measure('training: train');
      await eachTab('training', '#trainPanel [data-trtab]', 2); await jsClick('#trX'); await sleep(300); await t.waitPop(false).catch(() => {}); await closeAll();
    });
    await step('ball play', async () => {
      await ev(() => window.__paw.bl.start('Tennis Ball')); await t.until(() => window.__paw.bl.on, null, 4000); await sleep(400); await measure('ball play');
      await jsClick('#blDone').catch(() => ev(() => window.__paw.bl.stop())); await t.until(() => !window.__paw.bl.on, null, 3000);
    });
    // ---------------------------------------------------------------- town map ----------------------------------------------------------------
    await step('town map', async () => {
      await t.home('yard'); await jsClick('[data-act=map]'); await waitSel('[data-area=park]'); await sleep(300); await measure('town map');
      await ev(() => window.__paw.mapTo('cafe')); await sleep(300);
      await ev(() => document.querySelector('[data-area=cafe]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
      if (await t.until(() => { const c = document.getElementById('mapGo'); return !!c && !c.hidden; }, null, 3000)) await measure('town map: confirm chip');
      await t.p.keyboard.press('Escape'); await sleep(200); await t.home('yard');
    });
    // ---------------------------------------------------------------- places and every place button (shops, vet, playdate board, café ...) ----------------------------------------------------------------
    const PLACES = ['market', 'square', 'cafe', 'vet', 'salon', 'dogpark', 'pier', 'hilltop', 'park', 'fujihill', 'house'];
    for (const k of PLACES) {
      await step('place ' + k, async () => {
        await atPlace(k); await measure('place: ' + k);
        const btns = await ev(() => [...document.querySelectorAll('#placeBtns button')].filter((b) => b.offsetParent && !b.disabled).map((b, i) => { const a = [...b.attributes].find((x) => /^data-/.test(x.name)); return { i, k: a ? a.name + '=' + a.value : 'btn' + i }; }));
        for (const b of btns.slice(0, 7)) {
          if (/home|go=yard|data-walk|data-tk/.test(b.k)) continue;
          await ev((i) => { const e = [...document.querySelectorAll('#placeBtns button')].filter((x) => x.offsetParent && !x.disabled)[i]; if (e) e.click(); }, b.i);
          await sleep(500);
          const st = await ev(() => ({ modal: !document.getElementById('modal').hidden && !!document.querySelector('#modal .panel'), mode: window.__paw.mode, place: window.__paw.S.place }));
          if (st.modal) {
            const nm = `place: ${k} / ${b.k}`; await measure(nm);
            await eachTab(nm, '#modal .panel .tabs [data-tab], #modal .panel [data-ptab]', 5);
            if (b.k === 'data-sh=kibble') { // the purchase window, then the toast after buying
              const bought = await ev(() => { const x = document.querySelector('#modal .panel [data-tab=food]'); if (x) x.click(); return true; });
              await sleep(250); if (bought && await has('[data-buy]')) { await jsClick('[data-buy]'); await waitSel('.buyveil .bb-yes'); await measure('shop: purchase window'); await jsClick('.buyveil .bb-yes'); await sleep(350); await measure('shop: after buying (toast)'); }
            }
            if (b.k === 'data-pb=vet' && await has('#vetGene')) { await jsClick('#vetGene'); await sleep(500); await measure('vet: gene test card'); }
            await closeAll();
          } else if (st.mode !== 'yard' || st.place !== k) { await measure(`place: ${k} / ${b.k} (${st.mode})`); await t.p.keyboard.press('Escape'); await sleep(300); await closeAll(); await atPlace(k); }
        }
        await closeAll();
      }, 90000);
    }
    await step('playdates', async () => {
      await t.home('yard'); await ev(() => window.__paw.breed.openPlaydates()); await t.until(() => !!document.getElementById('pdGo') || !!document.querySelector('#modal .panel'), null, 4000); await measure('puppy playdates'); await closeAll();
    });
    await step('shelter', async () => {
      await t.home('yard'); await jsClick('[data-act=map]'); await waitSel('[data-area=shelter]'); await ev(() => window.__paw.mapTo('shelter')); await sleep(300);
      for (let i = 0; i < 6 && (await t.mode()) !== 'shelter'; i++) {
        await ev(() => document.querySelector('[data-area=shelter]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
        if (await t.until(() => { const c = document.getElementById('mapGo'); return !!c && !c.hidden; }, null, 1200)) await jsClick('#mapGoBtn').catch(() => {});
        await t.until(() => window.__paw.mode === 'shelter', null, 2500);
      }
      if ((await t.mode()) !== 'shelter') throw new Error('the shelter did not open');
      await sleep(500); await measure('shelter: playroom');
      await ev(() => { const sr = window.__paw.sr; if (sr && typeof sr.list === 'function' && !document.querySelector('#modal .panel .shcard')) sr.list(); });
      if (!(await t.until(() => !!document.querySelector('#modal .panel .shcard'), null, 4000))) throw new Error('no shelter list');
      await measure('shelter: looking for a home'); await closeAll(); await t.p.keyboard.press('Escape'); await sleep(300); await t.home('yard');
    });
    await step('garden', async () => { await t.home('yard'); await ev(() => window.__paw.go('garden')); await t.untilMode('garden'); await waitSel('.pg-plot'); await measure('garden'); await ev(() => { const d = document.querySelector('.pg-done'); if (d) d.click(); }); await t.untilMode('yard'); });
    await step('kitchen', async () => {
      await atPlace('house'); await ev(() => window.__paw.go('kitchen')); await t.untilMode('kitchen'); await waitSel('[data-ing]'); await measure('kitchen');
      await ev(() => { const b = [...document.querySelectorAll('.pk-btn')].find((x) => x.offsetParent); if (b) b.click(); }); await sleep(400); await measure('kitchen: recipe book');
      await t.p.keyboard.press('Escape'); await sleep(200); await closeAll(); await ev(() => window.__paw.go('yard')); await t.home('yard');
    });
    // ---------------------------------------------------------------- Tokyo (prefs.tkTest) and Dog Cards visitors ----------------------------------------------------------------
    await step('tokyo', async () => {
      await atPlace('station'); await measure('tokyo: the Station');
      if (!(await ev(() => window.__paw.tk.station()))) throw new Error('no ticket window'); await modalUp(); await measure('tokyo: ticket window'); await closeAll();
      await ev(() => { document.documentElement.dataset.motion = 'on'; window.__paw.tk.ride('out'); }); await waitSel('.tk-ride', 4000); await sleep(1200); await measure('tokyo: the ride');
      await ev(() => { const r = document.querySelector('.tk-ride'); if (r) r.click(); }); await t.untilMode('japan', 6000); await sleep(500); await measure('tokyo: Japan map');
      if (await ev(() => window.__paw.tk.book())) { await modalUp(); await measure('tokyo: stamp book'); await closeAll(); }
      for (const k of ['shibuya', 'yoyogi', 'asakusa']) {
        await ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, k);
        await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard', k, 8000); await t.lu(); await sleep(400); await measure('tokyo: ' + k);
        if (k === 'yoyogi') {
          const id = await ev(() => { const P = window.__paw; P.dc.visit(); const c = P.dc.fake && P.dc.fake[0]; if (c) P.dc.card(c.id); return c && c.id; });
          if (id && await modalUp()) { await measure('dog cards: a visitor\'s card'); await closeAll(); }
        }
      }
      await ev(() => { const S = window.__paw.S; S.place = 'yard'; window.__paw.go('yard'); }); await t.home('yard');
    }, 90000);
    // ---------------------------------------------------------------- a walk: routes, the how-to card, the runner HUD, pause, results ----------------------------------------------------------------
    await step('walk', async () => {
      await t.home('yard'); await t.calm(); await ev(() => { window.__paw.S.dog.stats.energy = 95; });
      await jsClick('[data-act=walk]'); await waitSel('#rtStart'); await measure('walk: route picker');
      await jsClick('#rtStart');
      await t.until(() => window.__paw.mode === 'walk' && !!(document.querySelector('.pw-ov [data-go]') || document.querySelector('.pw-cd')), null, 15000);
      if (await has('.pw-ov [data-go]')) { await measure('walk: how-to card (first walk tutorial)'); await jsClick('.pw-ov [data-go]'); }
      await t.until(() => { const o = document.querySelector('.pw-ov'); return window.__paw.mode === 'walk' && !!o && o.hidden; }, null, 12000); await sleep(1500);
      await measure('walk: running (HUD)');
      await t.p.keyboard.press('Escape'); await t.until(() => !!document.querySelector('[data-home]') || !!document.getElementById('resOk'), null, 8000); await measure('walk: paused');
      if (await has('[data-home]')) await jsClick('[data-home]');
      await waitSel('#resOk', 15000); await measure('walk: results');
      await jsClick('#resOk'); await t.until(() => window.__paw.mode === 'yard', null, 8000); await t.lu(); await sleep(300); await measure('yard: back from the walk (toasts)');
    }, 70000);
    await t.ctx.close();

    // ---------------------------------------------------------------- account screens (a fresh device with the cloud on but unreachable) ----------------------------------------------------------------
    await step('account', async () => {
      const { mockInit } = require('./cloud_mock');
      await t.mk({ lang, device: dev, prefs: {} }); await t.ctx.addInitScript(mockInit, { broken: true });
      await t.p.goto(URL); await waitSel('#title [data-ac], #tNew', 10000); await measure('account: title choice (cloud on)');
      if (await has('[data-ac=login]')) {
        await jsClick('[data-ac=login]'); await waitSel('#acEmail'); await measure('account: log in');
        if (await has('#acForgot')) { await jsClick('#acForgot'); await sleep(500); await measure('account: forgot password'); await closeAll(); }
        await closeAll(); if (await has('[data-ac=reg]')) { await jsClick('[data-ac=reg]'); await waitSel('#acEmail'); await measure('account: make an account'); await closeAll(); }
      } else throw new Error('no account choice on the title');
      await t.ctx.close();
    }, 45000);
  } catch (e) {
    console.log('CRASH', e && e.stack ? e.stack.split('\n').slice(0, 5).join('\n') : e); unreached.push(`${lang} ${size}: session crashed: ${String(e && e.message || e).split('\n')[0].slice(0, 160)}`);
  } finally { try { await t.b.close(); } catch (e) { /* closed */ } }
  fs.writeFileSync(path.join(PARTS, tag + '.json'), JSON.stringify({ lang, size, findings, unreached, states }));
  console.log(`${lang} ${size}: ${states.length} states, ${findings.length} findings, ${unreached.length} not opened`);
  process.exit(0);
}

if (process.env.FIT_JOB) worker(process.env.FIT_JOB); else master();
