// SITE (v2.8.2): the doodledoggo.app introduction site (site/, served by the Worker tools/cf_site.js builds), in Miniflare.
//   NODE_PATH=$(npm root -g) node game/test_site.js      (or: node game/run_tests.js site)
// Desktop 1280x800 and iPhone 15: the home page, /privacy, /reset (the Forgot password link) against the real cloudflare/worker.js on a
// local D1 (game/cloud_mock.js), www -> apex, no request leaves the site (no tracking), phone minimums.
// PAW_SITE_SHOTS=<dir> also saves screenshots there. Node-only runner contract: prints ALL OK when every check passes.
process.removeAllListeners('warning');
const path = require('path'), fs = require('fs'), zlib = require('zlib'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const API = 'https://pawhaven-api.ansonyuen0108.workers.dev';
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) { passes++; console.log('  ok  ' + m); } else { fails++; console.log('  FAIL ' + m); } };
const sec = (s) => console.log('\n# ' + s);
const req = (m) => { for (const r of [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean), module.paths)) { try { return require(path.join(r, m)); } catch (e) { /* next */ } } return require(m); };

(async () => {
  cp.execFileSync('node', [path.join(ROOT, 'tools', 'cf_site.js')], { stdio: 'ignore' });
  const dir = path.join(ROOT, '_cfsite');
  const parts = fs.readFileSync(path.join(dir, 'parts.txt'), 'utf8').trim().split('\n').map((l) => l.split(' '));
  const MF = req('miniflare'), { chromium, devices } = req('playwright');
  const { makeServer } = require('./cloud_mock');
  const srv = makeServer();
  const modules = [{ type: 'ESModule', path: path.join(dir, 'worker.js'), contents: fs.readFileSync(path.join(dir, 'worker.js'), 'utf8') }]
    .concat(parts.map(([n, t]) => ({ type: t === 'text/plain' ? 'Text' : 'Data', path: path.join(dir, n), contents: fs.readFileSync(path.join(dir, n)) })));
  const mf = new MF.Miniflare({ modules, modulesRoot: dir, compatibilityDate: '2026-08-01', port: 0 });
  const base = String(await mf.ready).replace(/\/$/, '');
  const browser = await chromium.launch({ args: (process.env.PAW_ARGS || '').split(' ').filter(Boolean) });
  const shots = process.env.PAW_SITE_SHOTS;
  try {
    sec('the Worker: size, routes, headers');
    const gz = parts.reduce((n, [f]) => n + zlib.gzipSync(fs.readFileSync(path.join(dir, f))).length, zlib.gzipSync(fs.readFileSync(path.join(dir, 'worker.js'))).length);
    ok(gz < 2.5e6, `the whole site fits a free-plan Worker (${(gz / 1e6).toFixed(2)} MB gzipped, limit 3 MB)`);
    const get = (u, o) => mf.dispatchFetch(u, Object.assign({ redirect: 'manual' }, o || {}));
    let r = await get('https://doodledoggo.app/');
    ok(r.status === 200 && /text\/html/.test(r.headers.get('content-type')) && /default-src 'self'/.test(r.headers.get('content-security-policy') || ''), 'home: 200, HTML, a strict content security policy');
    const home = await r.text();
    ok(home.includes('🖍️ Adopt a wobbly crayon pup to love') && home.includes('https://an9ou.itch.io/doodle-doggo') && /Play free on itch\.io/.test(home), 'tagline and the Play free on itch.io button');
    ok(/og:image" content="https:\/\/doodledoggo\.app\/logo-1200x630\.png/.test(home) && /rel="icon" href="\/favicon\.svg/.test(home) && /<title>Doodle Doggo/.test(home), 'title, favicon and og:image tags');
    ok(!/googleapis|gstatic|google-analytics|gtag|facebook|plausible|cdn\./i.test(home + (await (await get('https://doodledoggo.app/style.css')).text())), 'no third-party fonts, scripts or trackers in the page or the CSS');
    for (const u of ['/favicon.svg', '/logo-1200x630.png', '/icon-180.png', '/site.webmanifest', '/doodle-doggo-logo.svg', '/fonts/caveat.woff2', '/img/screenshot-1-winter-yard.webp', '/img/noodle-happy.svg', '/privacy', '/reset']) {
      r = await get('https://doodledoggo.app' + u); ok(r.status === 200, `${u}: 200 ${r.headers.get('content-type')}`); await r.arrayBuffer();
    }
    r = await get('https://www.doodledoggo.app/privacy?x=1'); ok(r.status === 301 && r.headers.get('location') === 'https://doodledoggo.app/privacy?x=1', 'www.doodledoggo.app redirects to the apex, keeping the path');
    r = await get('https://doodledoggo.app/privacy.html'); ok(r.status === 301 && r.headers.get('location') === 'https://doodledoggo.app/privacy', '/privacy.html redirects to /privacy');
    r = await get('https://doodledoggo.app/nope'); ok(r.status === 404 && /Nothing here/.test(await r.text()), 'a friendly 404');
    r = await get('https://doodledoggo.app/reset'); ok(r.headers.get('referrer-policy') === 'no-referrer', '/reset sends no referrer');
    r = await get('https://doodledoggo.app/', { method: 'POST' }); ok(r.status === 405, 'only GET and HEAD');

    // the reset page's calls to the Worker go to the local one (with the CORS answer the real Worker gives this origin)
    const wire = async (page) => {
      const outside = [];
      page.on('request', (q) => { const u = q.url(); if (!u.startsWith(base) && !u.startsWith(API) && !u.startsWith('data:')) outside.push(u); });
      await page.route(API + '/**', async (route) => {
        const q = route.request(), cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization, content-type', 'access-control-allow-methods': 'GET, PUT, POST, OPTIONS' };
        if (q.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
        const a = await srv.handle(page, q.method(), new URL(q.url()).pathname, q.postData(), q.headers().authorization || null);
        return route.fulfill({ status: a.status, body: a.text, headers: Object.assign({ 'content-type': 'application/json' }, cors) });
      });
      return outside;
    };
    const audit = (page) => page.evaluate(() => {
      const small = [], tiny = [];
      document.querySelectorAll('a, button, input').forEach((e) => { const b = e.getBoundingClientRect(); if (b.width && e.offsetParent !== null && (b.height < 44 || b.width < 44)) small.push(`${e.id || e.textContent.trim().slice(0, 20)} ${Math.round(b.width)}x${Math.round(b.height)}`); });
      const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el.getClientRects().length || el.closest('[hidden], script, style')) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 15) tiny.push(`${n.textContent.trim().slice(0, 20)} ${fs}px`); }
      return { small, tiny, scroll: document.documentElement.scrollWidth - innerWidth };
    });

    for (const [label, opts] of [['desktop 1280x800', { viewport: { width: 1280, height: 800 } }], ['iPhone 15', devices['iPhone 15']]]) {
      const tag = label.replace(/\W+/g, '_');
      sec(`${label}: the home page`);
      const ctx = await browser.newContext(Object.assign({}, opts, { ignoreHTTPSErrors: true })); const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/status of 400/.test(m.text())) errs.push(m.text()); }); // the used-link check answers 400 on purpose
      const outside = await wire(page);
      await page.goto(base + '/', { waitUntil: 'networkidle' });
      const info = await page.evaluate(() => ({
        imgs: [...document.querySelectorAll('img')].map((i) => [i.getAttribute('src'), i.complete && i.naturalWidth > 0]),
        feats: document.querySelectorAll('.feats li').length, shots: document.querySelectorAll('.shots img').length,
        fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family)
      }));
      ok(info.imgs.every((x) => x[1]), 'every picture loads (logo, Noodle, screenshots) ' + info.imgs.filter((x) => !x[1]).map((x) => x[0]).join(' '));
      ok(info.shots === 4 && info.feats === 6, `4 screenshots and 6 features (${info.shots}, ${info.feats})`);
      ok(info.fonts.some((f) => /Caveat/.test(f)) && info.fonts.some((f) => /Patrick Hand/.test(f)), 'the game\'s hand fonts load from the site itself');
      const a = await audit(page);
      ok(a.scroll <= 0, `no sideways scroll (${a.scroll})`); ok(!a.small.length, 'tap targets 44 px or more ' + a.small.join(', ')); ok(!a.tiny.length, 'text 15 px or more ' + a.tiny.slice(0, 4).join(', '));
      const play = await page.locator('#play').boundingBox(); ok(play && play.height >= 56, `a big Play free on itch.io button (${play && Math.round(play.height)} px tall)`);
      if (label === 'iPhone 15') ok(play && play.y + play.height < 844 * 1.6, 'the Play button is near the top on the phone');
      if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, `site_home_${tag}.png`), fullPage: label === 'iPhone 15' ? false : false }); }

      sec(`${label}: privacy`);
      await page.goto(base + '/privacy', { waitUntil: 'networkidle' });
      const pt = await page.textContent('main');
      ok(/Privacy policy/.test(pt) && /no ads and no tracking/i.test(pt) && /\[CONTACT EMAIL: to be filled in by the owner\]/.test(pt) && /password link/.test(pt), 'the privacy page: no ads, no tracking, emails only for a password link, contact placeholder kept');
      const a2 = await audit(page); ok(a2.scroll <= 0 && !a2.small.length && !a2.tiny.length, 'privacy: phone minimums ' + a2.small.concat(a2.tiny).slice(0, 4).join(', '));

      sec(`${label}: the reset page`);
      const em = `reset-${tag.toLowerCase()}@example.com`;
      const reg = srv.json((await srv.handle(null, 'POST', '/register', JSON.stringify({ email: em, password: 'oldpassword1' }), null)).text);
      const m0 = srv.mails.length; await srv.handle(null, 'POST', '/forgot', JSON.stringify({ email: em }), null);
      const mail = srv.mails[m0]; ok(mail && mail.link.startsWith('https://doodledoggo.app/reset?token='), 'the email links to https://doodledoggo.app/reset?token=...');
      await page.goto(base + '/reset?token=' + mail.token, { waitUntil: 'networkidle' });
      ok((await page.evaluate(() => location.search)) === '', 'the code leaves the address bar at once');
      ok(/Set a new password/.test(await page.textContent('h1')), 'title: Set a new password');
      const a3 = await audit(page); ok(a3.scroll <= 0 && !a3.small.length && !a3.tiny.length, 'reset: phone minimums ' + a3.small.concat(a3.tiny).slice(0, 4).join(', '));
      if (shots) await page.screenshot({ path: path.join(shots, `site_reset_${tag}.png`) });
      await page.fill('#rsPw', 'newpassword1'); await page.fill('#rsPw2', 'newpassword2'); await page.click('#rsGo');
      ok(/don't match/.test(await page.textContent('#rsMsg')), 'two different passwords: a kind message');
      await page.fill('#rsPw2', 'newpassword1'); await page.click('#rsGo');
      await page.waitForSelector('#rsDone:not([hidden])', { timeout: 8000 }).catch(() => null);
      const done = await page.textContent('#rsDone');
      ok(/All set! Go back to the game on itch\.io and log in\./.test(done) && (await page.getAttribute('#rsDone a', 'href')) === 'https://an9ou.itch.io/doodle-doggo', '"All set! Go back to the game on itch.io and log in." with the button');
      ok(srv.pwIs(reg.user.id, 'newpassword1') && !srv.pwIs(reg.user.id, 'oldpassword1'), 'the new password is stored, the old one is gone');
      ok((await srv.handle(null, 'GET', '/me', null, 'Bearer ' + reg.token)).status === 401, 'the reset logged out the account\'s other sessions');
      await page.waitForTimeout(300);
      ok(srv.calls.some((c) => c.page === page && c.op === 'POST /logout'), 'the page doesn\'t keep a login (it logs its own session out)');
      if (shots) await page.screenshot({ path: path.join(shots, `site_reset_done_${tag}.png`) });
      await page.goto(base + '/reset?token=' + mail.token, { waitUntil: 'networkidle' });
      await page.fill('#rsPw', 'another-pass1'); await page.fill('#rsPw2', 'another-pass1'); await page.click('#rsGo');
      await page.waitForFunction(() => /run out/.test(document.getElementById('rsMsg').textContent), null, { timeout: 8000 }).catch(() => null);
      ok(/run out or was already used/.test(await page.textContent('#rsMsg')), 'the same link again: "That link has run out or was already used..."');
      await page.goto(base + '/reset', { waitUntil: 'networkidle' });
      ok(await page.isVisible('#rsGone') && !(await page.isVisible('#rsF')), 'no code in the link: a kind note and the itch.io button, no form');
      if (label === 'iPhone 15') {
        sec('iPhone 15: an old Supabase account not moved yet (its own reset email links here)');
        const su = srv.sb.mkUser({ email: 'old-reset@example.com', password: 'forgotten-1' }); srv.legacy('old-reset@example.com');
        srv.sb.saves[su.id] = { data: { v: 1, coins: 4321, dogs: [{ id: 'oldR', name: 'Pickle' }] }, rev: 4, changed_at: '2026-10-01T00:00:00Z' };
        await srv.handle(null, 'POST', '/forgot', JSON.stringify({ email: 'old-reset@example.com' }), null);
        const rc = srv.sb.recovers[srv.sb.recovers.length - 1];
        ok(rc && rc.redirect_to === 'https://doodledoggo.app/reset', 'Supabase\'s reset email is sent to come back to this page');
        await page.goto('about:blank'); await page.goto(base + '/reset#access_token=' + rc.token + '&type=recovery&expires_in=3600', { waitUntil: 'networkidle' });
        ok((await page.evaluate(() => location.hash)) === '', 'the Supabase login leaves the address bar at once');
        await page.fill('#rsPw', 'moved-over-1'); await page.fill('#rsPw2', 'moved-over-1'); await page.click('#rsGo');
        await page.waitForSelector('#rsDone:not([hidden])', { timeout: 8000 }).catch(() => null);
        ok(await page.isVisible('#rsDone'), 'All set');
        ok(srv.users.some((u) => u.id === su.id && u.email === 'old-reset@example.com') && srv.saves[su.id] && srv.saves[su.id].data.coins === 4321 && srv.pwIs(su.id, 'moved-over-1'), 'the old account moved over with its save and the new password');
      }
      ok(!outside.length, 'no request leaves the site except the Worker (no tracking) ' + outside.slice(0, 3).join(' '));
      ok(!errs.length, 'no console errors ' + errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
  } catch (e) { fails++; console.log('  CRASH', e && e.stack || e); }
  finally { await browser.close(); await mf.dispose(); }
  console.log(`\n${passes} passed, ${fails} failed`);
  if (!fails) console.log('ALL OK');
  process.exit(fails ? 1 : 0);
})();
