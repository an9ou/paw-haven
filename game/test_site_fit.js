// SITE FIT (v2.14, the owner via the Game Manager: every language fits every menu and box). The measuring tool for doodledoggo.app: every page in
// every site language at five widths, with the same checks as the game (game/fit_lib.js: clip, escape, overlap, hscroll, and on phones tap / font).
//   node game/run_tests.js site_fit [--jobs N]        (its own group: not in `all` or `phone`; about 6 min for 11 languages x 5 widths)
//   PAW_LANGS=en,de ...   PAW_FIT_SIZES=1440,390 ...   PAW_FIT_REPORT_ONLY=1 (always passes)   PAW_FIT_JOBS=N (parallel pages)
// Output: game/test_logs/site_fit.json, game/test_logs/site_fit.md, game/test_logs/fit_shots_site/ (the 30 worst, framed in red).
// The site is served the way game/test_site.js serves it (tools/cf_site.js, the Worker in Miniflare, the fonts and map pictures Workers relayed),
// except the game box: /play/ is a stub page here (SITE_GAME=<a stub folder>), so no dist/itch build from main is needed, and the itch.io
// widget is a stub. Nothing reaches the network.
// Pages: home (with the game box), /dogs and one dog pop-up, /map, /guide, /about, /privacy, /reset, a 404; on each: the header as it loads,
// the header stuck (scrolled), the language menu open (and the phone page menu when there is one). Widths 1440x900, 1024x800, 768x1024,
// 390x844 (iPhone 15, touch, dpr 3) and 360x740 (Pixel 7 class, touch, dpr 2): the phone rules (44 px taps, 15 / 13 px text) at 390 and 360.
'use strict';
process.removeAllListeners('warning');
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const FIT = require('./fit_lib');
const ROOT = path.join(__dirname, '..'), LOGS = path.join(__dirname, 'test_logs'), TMP = path.join(LOGS, 'site_fit_tmpshots'), STUB = path.join(LOGS, 'site_fit_game_stub');
const req = (m) => { for (const r of [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean), module.paths)) { try { return require(path.join(r, m)); } catch (e) { /* next */ } } return require(m); };
const I18N = require('../tools/site_i18n');
const LANGS = process.env.PAW_LANGS ? process.env.PAW_LANGS.split(',').map((s) => s.trim()).filter(Boolean) : ['en'].concat(I18N.LANGS.map((l) => l.code).filter((c) => c !== 'en'));
const W_ALL = ['1440', '1024', '768', '390', '360'];
const SIZES = process.env.PAW_FIT_SIZES ? process.env.PAW_FIT_SIZES.split(',').map((s) => s.trim()).filter(Boolean) : W_ALL;
const REPORT_ONLY = !!process.env.PAW_FIT_REPORT_ONLY;
const JOBS = Math.max(1, parseInt(process.env.PAW_FIT_JOBS || process.env.PAW_JOBS || String(Math.max(1, os.cpus().length - 1)), 10));
const PAGES = [{ id: 'home', path: '/' }, { id: 'dogs', path: '/dogs' }, { id: 'map', path: '/map' }, { id: 'guide', path: '/guide' }, { id: 'about', path: '/about' }, { id: 'privacy', path: '/privacy' }, { id: 'reset', path: '/reset' }, { id: '404', path: '/no-such-page' }];
// captions on the site (13 px floor): small print, the footer, figure captions and the little name tags
const CAPTIONS = 'small, .small, figcaption, footer, .foot, .note, .cap, .caption, .tag, .badge, .jpline, sup, sub';
// layers on top of the page on purpose (R5): the header (sticky), the dog pop-up, an open <details> menu, the game box and its full-screen chrome
const LAYERS = '#sitehead, dialog, details[open] > nav, .gameframe, .fsx';

function devOf(w) {
  const { devices } = req('playwright');
  const D = {
    1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    1024: { viewport: { width: 1024, height: 800 }, deviceScaleFactor: 1 },
    768: { viewport: { width: 768, height: 1024 }, deviceScaleFactor: 2 },
    390: Object.assign({}, devices['iPhone 15'], { viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, defaultBrowserType: undefined }),
    360: Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 740 }, screen: { width: 360, height: 740 }, deviceScaleFactor: 2, defaultBrowserType: undefined }),
  };
  if (!D[w]) throw new Error('unknown width ' + w); return D[w];
}

(async () => {
  const t0 = Date.now();
  fs.mkdirSync(LOGS, { recursive: true }); fs.rmSync(TMP, { recursive: true, force: true }); fs.mkdirSync(TMP, { recursive: true });
  // the game box: a stub game (the real one is the itch.io build from main: not needed to measure the site around it)
  fs.mkdirSync(STUB, { recursive: true });
  fs.writeFileSync(path.join(STUB, 'index.html'), '<!doctype html><html lang="en"><meta charset="utf-8"><title>game (stub)</title><body style="margin:0;background:#f7e7d2;font:16px sans-serif">the game (a stub for the fit audit)</body></html>');
  cp.execFileSync(process.execPath, [path.join(ROOT, 'tools', 'cf_site.js')], { stdio: 'ignore', env: Object.assign({}, process.env, { SITE_GAME: STUB }) });
  const SIZESJ = JSON.parse(fs.readFileSync(path.join(ROOT, '_cfsite', 'sizes.json'), 'utf8'));
  const readParts = (d) => fs.readFileSync(path.join(d, 'parts.txt'), 'utf8').trim().split('\n').filter(Boolean).map((l) => l.split(' '));
  const MF = req('miniflare'), { chromium } = req('playwright');
  const workerOf = (d, o) => new MF.Miniflare(Object.assign({ modules: [{ type: 'ESModule', path: path.join(d, 'worker.js'), contents: fs.readFileSync(path.join(d, 'worker.js'), 'utf8') }]
    .concat(readParts(d).map(([n, t]) => ({ type: t === 'text/plain' ? 'Text' : 'Data', path: path.join(d, n), contents: fs.readFileSync(path.join(d, n)) }))), modulesRoot: d, compatibilityDate: '2026-08-01' }, o || {}));
  const mf = workerOf(path.join(ROOT, '_cfsite'), { port: 0 });
  const base = String(await mf.ready).replace(/\/$/, '');
  const fmf = SIZESJ.fontMode === 'split' ? workerOf(path.join(ROOT, '_cfsite_fonts')) : null;
  const imf = SIZESJ.imgMode === 'split' && fs.existsSync(path.join(ROOT, '_cfsite_img', 'worker.js')) ? workerOf(path.join(ROOT, '_cfsite_img')) : null;
  const relay = (w) => async (route) => { const fr = await w.dispatchFetch('https://doodledoggo.app' + new URL(route.request().url()).pathname); return route.fulfill({ status: fr.status, headers: { 'content-type': fr.headers.get('content-type') || 'application/octet-stream' }, body: Buffer.from(await fr.arrayBuffer()) }); };
  const local = (u) => { const s = String(u); return s.startsWith(base) || s.startsWith('data:') || s.startsWith('about:') || s.startsWith('blob:'); };
  const browser = await chromium.launch({ args: (process.env.PAW_ARGS || '').split(' ').filter(Boolean) });
  const all = [], unreached = [], ran = [], states = {};
  let shotN = 0; const kept = [];

  async function session(lang, w) {
    const L = I18N.LANGS.find((x) => x.code === lang); if (!L) { unreached.push(`${lang} ${w}: not a site language`); return; }
    const phone = +w <= 400, label = `${lang} ${w}`;
    const ctx = await browser.newContext(Object.assign({ locale: lang === 'en' ? 'en-US' : lang }, devOf(w)));
    await ctx.route((u) => !local(u), (route) => route.abort());
    await ctx.route('https://itch.io/**', (route) => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: '<!doctype html><body style="margin:0;font:16px sans-serif">itch.io (stub)</body>' }));
    if (fmf) await ctx.route('**/fonts/i18n/**', relay(fmf));
    if (imf) await ctx.route('**/img/map/**', relay(imf));
    const page = await ctx.newPage(); page.setDefaultTimeout(15000);
    const cfg = { phone, docScrolls: true, skip: '', captions: CAPTIONS, layers: LAYERS };
    const byKey = new Map(), st = [];
    const settle = () => page.evaluate(async () => {
      try { await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 2000))]); } catch (e) { /* no fonts api */ }
      const t0 = performance.now();
      while (performance.now() - t0 < 1500) { const run = document.getAnimations().filter((a) => a.playState === 'running' && a.effect && a.effect.getComputedTiming().iterations !== Infinity); if (!run.length) break; await new Promise((r) => setTimeout(r, 60)); }
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    }).catch(() => {});
    const measure = async (screen) => {
      await settle();
      let r; try { r = await page.evaluate(FIT.MEASURE, cfg); } catch (e) { unreached.push(`${label} ${screen}: measure failed: ${e.message.split('\n')[0]}`); return; }
      st.push({ screen, n: r.n, f: r.findings.length });
      for (const f0 of r.findings.sort((a, b) => b.sev - a.sev)) {
        const f = Object.assign({ lang, size: w, screen }, f0), k = f.kind + '|' + f.how + '|' + f.sel, g = byKey.get(k);
        if (!g) { f.states = 1; f.screens = [screen]; byKey.set(k, f); all.push(f); }
        else { g.states++; if (g.screens.length < 6 && !g.screens.includes(screen)) g.screens.push(screen); if (f.sev > g.sev) { const keep = { states: g.states, screens: g.screens }; Object.keys(g).forEach((x) => delete g[x]); Object.assign(g, f, keep); } }
      }
      // screenshots of this state's worst (at most 2), when they enter the 30 worst kept so far; the page is scrolled to the element first
      let taken = 0;
      for (const f0 of r.findings) {
        if (taken >= 2) break; const f = byKey.get(f0.kind + '|' + f0.how + '|' + f0.sel); if (f.screen !== screen || f.shot) continue;
        const k = f.kind + '|' + f.sel; if (kept.length >= 40 && kept[kept.length - 1].sev >= f.sev) continue; if (kept.some((x) => x.k === k && x.sev >= f.sev)) continue;
        const file = `site_${lang}_${w}_${++shotN}.png`;
        try {
          const sy = await page.evaluate((y) => { const d = Math.max(0, y - innerHeight / 3); scrollBy(0, d); return d; }, f.rect[1]);
          const rect = [f.rect[0], f.rect[1] - sy, f.rect[2], f.rect[3] - sy];
          await page.evaluate(FIT.HILITE, { rect, label: `${f.kind}/${f.how} ${lang} ${w} ${screen}: ${f.text.slice(0, 50)}` });
          await page.screenshot({ path: path.join(TMP, file), scale: 'css', timeout: 8000 });
          await page.evaluate((d) => scrollBy(0, -d), sy);
        } catch (e) { continue; } finally { await page.evaluate(FIT.HILITE, null).catch(() => {}); }
        f.shot = file; taken++; kept.push({ k, sev: f.sev }); kept.sort((a, b) => b.sev - a.sev); if (kept.length > 40) kept.length = 40;
      }
    };
    const step = async (name, fn) => { try { await fn(); } catch (e) { unreached.push(`${label} ${name}: ${String(e && e.message || e).split('\n')[0].slice(0, 160)}`); } };
    const openNav = async () => {
      if (await page.locator('#navbtn').isVisible().catch(() => false)) { if ((await page.getAttribute('#navbtn', 'aria-expanded')) !== 'true') await page.click('#navbtn'); await page.waitForTimeout(250); return true; }
      const s = page.locator('#sitehead details:not(#langs) > summary').first();
      if (await s.count() && await s.isVisible() && !(await s.evaluate((e) => e.parentElement.open))) { await s.click(); await page.waitForTimeout(250); return true; }
      return false;
    };
    try {
      for (const pg of PAGES) {
        const url = base + (pg.id === '404' ? (L.dir ? '/' + L.dir : '') + pg.path : I18N.urlFor(L, pg.path));
        await step(pg.id, async () => {
          const r = await page.goto(url, { waitUntil: 'load' });
          if (!r || (pg.id !== '404' && r.status() !== 200)) throw new Error(`${url}: ${r && r.status()}`);
          await page.waitForTimeout(300);
          if (pg.id === 'home') { await page.evaluate(() => { const g = document.getElementById('gameframe'); if (g) g.scrollIntoView({ block: 'center' }); }).catch(() => {}); await page.evaluate(() => scrollTo(0, 0)); }
          await measure(pg.id);
          if (pg.id === '404') return;
          // the header stuck at the top (scrolled), with the small logo
          await page.evaluate(() => scrollTo(0, Math.min(700, document.documentElement.scrollHeight - innerHeight))); await page.waitForTimeout(250);
          if (await page.evaluate(() => { const h = document.getElementById('sitehead'); return !!h && h.classList.contains('stuck'); })) await measure(pg.id + ': header stuck');
          await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(200);
          if (await openNav()) await measure(pg.id + ': page menu open');
          if (await page.locator('#langs summary').isVisible().catch(() => false)) { await page.click('#langs summary'); await page.waitForTimeout(200); await measure(pg.id + ': language menu open'); await page.click('#langs summary').catch(() => {}); }
          if (pg.id === 'dogs') {
            const a = page.locator('.dognav a[href^="#"]').first();
            if (await a.count()) { await a.click(); await page.waitForSelector('dialog.dogpop[open]', { timeout: 4000 }); await page.waitForTimeout(250); await measure('dogs: a dog pop-up'); await page.keyboard.press('Escape'); }
          }
        });
      }
    } finally { states[lang + ':' + w] = st; ran.push(lang + ':' + w); await ctx.close().catch(() => {}); }
  }

  const jobs = []; for (const l of LANGS) for (const w of SIZES) jobs.push([l, w]);
  console.log(`site_fit: ${LANGS.length} languages x ${SIZES.length} widths = ${jobs.length} sessions, ${JOBS} at a time${REPORT_ONLY ? ' (report mode)' : ''}`);
  let crashed = false;
  try {
    // the game box size on a 768 px tablet (the game suite's `embed` size)
    { const ctx = await browser.newContext(devOf('768')); await ctx.route((u) => !local(u), (route) => route.abort()); const pg = await ctx.newPage(); await pg.goto(base + '/', { waitUntil: 'load' }); await pg.waitForTimeout(500);
      const fr = await pg.evaluate(() => { const f = document.querySelector('#gameframe iframe'), b = document.getElementById('gameframe'); return f ? { w: f.offsetWidth, h: f.offsetHeight, box: [b.clientWidth, b.clientHeight] } : null; });
      console.log(`the game box at 768 x 1024: the game is drawn at ${fr ? fr.w + ' x ' + fr.h : '?'} css px (box ${fr ? fr.box.join(' x ') : '?'}): the i18n_fit size "embed"`); await ctx.close(); }
    const q = jobs.slice();
    await Promise.all(Array.from({ length: Math.min(JOBS, q.length) }, async () => { while (q.length) { const [l, w] = q.shift(); const s = Date.now(); await session(l, w).catch((e) => unreached.push(`${l} ${w}: crashed: ${String(e && e.message || e).split('\n')[0]}`)); console.log(`  done ${(l + ' ' + w).padEnd(14)} ${Math.round((Date.now() - s) / 1000)} s`); } }));
  } catch (e) { crashed = true; console.log('CRASH', e && e.stack ? e.stack.split('\n').slice(0, 5).join('\n') : e); }
  finally { await browser.close().catch(() => {}); for (const m of [mf, fmf, imf]) if (m) await m.dispose().catch(() => {}); }
  const meta = { title: 'SITE FIT: doodledoggo.app (suite site_fit)', langs: LANGS, sizes: SIZES, ran, unreached, secs: (Date.now() - t0) / 1000, i18nDir: path.join(ROOT, 'site', 'i18n'),
    extra: ['## States measured per session', '', ...Object.entries(states).map(([j, s]) => `- ${j}: ${s.length} states`)] };
  const nShots = FIT.keepShots(all, TMP, path.join(LOGS, 'fit_shots_site'), 30);
  const r = FIT.report('site_fit', all, meta);
  console.log('\n' + FIT.summary(all, meta).join('\n'));
  console.log(`report: ${path.relative(process.cwd(), r.md)}, game/test_logs/site_fit.json, ${nShots} screenshots in game/test_logs/fit_shots_site/`);
  console.log('worst 10:'); r.groups.slice(0, 10).forEach((g, i) => console.log(`  ${i + 1}. ${g.worst.kind}/${g.worst.how} ${g.worst.sev} ${g.worst.screen} [${g.worst.lang} ${g.worst.size}] "${g.worst.text}" ${g.worst.sel}`));
  if (unreached.length) { console.log('not measured:'); unreached.slice(0, 30).forEach((u) => console.log('  ' + u)); }
  const bad = all.length + unreached.length + (crashed ? 1 : 0);
  if (!crashed && (REPORT_ONLY || !bad)) console.log(`\nALL OK${bad ? ' (report mode: ' + all.length + ' findings, ' + unreached.length + ' not measured)' : ''}`);
  else { console.log(`\nFAILED: ${all.length} findings, ${unreached.length} not measured${crashed ? ', crashed' : ''} (PAW_FIT_REPORT_ONLY=1 for report mode)`); process.exitCode = 1; }
})();
