// The password gate of the test copy at test.doodledoggo.app (tools/test_gate.mjs, tools/cf_test.js, tools/cf_test_deploy.sh; owner 18 Nov 2026).
//   node game/test_test_gate.js      (or: node game/run_tests.js test_gate)
// In Node: no password -> the gate page (401, noindex, private no-store); a wrong password 401; the right one a 303 with an HttpOnly Secure
// SameSite=Lax 30-day cookie that then lets the game load; a forged, expired or other-password cookie is refused; no TEST_PASSWORD -> 503;
// next= stays on this host; the brake after 10 wrong tries. Then the real generated Worker (tools/cf_test.js on a tiny fake test build) in
// Miniflare (workerd), when Miniflare is installed, and tools/pages.js --test: payments off, no in-page gate, noindex. Prints ALL OK.
process.removeAllListeners('warning');
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) { passes++; console.log('  ok', m); } else { fails++; console.log('  FAIL', m); } };
const sec = (s) => console.log('--- ' + s);
const PW = 'correct horse battery staple 42';
const GAME = '<!doctype html><html><head><meta name="robots" content="noindex,nofollow"></head><body><script>window.__ddNoPay=1</script>the game</body></html>';

async function checks(label, fetchIt, env) {
  sec(label);
  const go = (p, o) => fetchIt('https://test.doodledoggo.app' + p, Object.assign({ redirect: 'manual' }, o || {}));
  const post = (body, ip) => go('/__gate', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'CF-Connecting-IP': ip || '10.0.0.1' }, body: new URLSearchParams(body).toString() });
  let r = await go('/');
  let t = await r.text();
  ok(r.status === 401 && /<form method="post" action="\/__gate"/.test(t) && !/the game/.test(t), 'no cookie: the gate page (401), not the game');
  ok(r.headers.get('x-robots-tag') === 'noindex, nofollow' && /<meta name="robots" content="noindex,nofollow">/.test(t), 'the gate: X-Robots-Tag noindex and a robots meta');
  ok(r.headers.get('cache-control') === 'private, no-store' && !/public/.test(r.headers.get('cache-control')), 'the gate is never cached publicly: private, no-store');
  ok(/default-src 'none'/.test(r.headers.get('content-security-policy') || '') && /frame-ancestors 'none'/.test(r.headers.get('content-security-policy') || ''), 'the gate has a strict CSP (no scripts, no framing)');
  r = await go('/lang/ja.0123abcd.js'); ok(r.status === 401, 'every file needs the cookie (a language file: 401)');
  r = await go('/robots.txt'); t = await r.text(); ok(r.status === 200 && /Disallow: \//.test(t), 'robots.txt is open and disallows everything');

  r = await post({ password: 'wrong-password', next: '/?lang=ja' }); t = await r.text();
  ok(r.status === 401 && !r.headers.get('set-cookie') && /That is not it/.test(t) && /value="\/\?lang=ja"/.test(t), 'a wrong password: 401, no cookie, the page again (next kept)');
  r = await post({ password: '', next: '/' }); ok(r.status === 401 && !r.headers.get('set-cookie'), 'an empty password: 401');
  r = await post({ password: PW.slice(0, -1), next: '/' }); ok(r.status === 401, 'almost the password: 401');

  r = await post({ password: PW, next: '/?lang=ja' });
  const sc = r.headers.get('set-cookie') || '';
  ok(r.status === 303 && r.headers.get('location') === '/?lang=ja', 'the right password: 303 back to next');
  ok(/^dd_test=v1\.\d+\.[A-Za-z0-9_-]{43};/.test(sc) && /HttpOnly/.test(sc) && /Secure/.test(sc) && /SameSite=Lax/.test(sc) && /Max-Age=2592000/.test(sc) && /Path=\//.test(sc), 'and an HttpOnly Secure SameSite=Lax 30-day cookie: ' + sc.replace(/=v1\.\d+\.[^;]+/, '=v1.<exp>.<hmac>'));
  ok(!sc.includes(PW) && !sc.includes(encodeURIComponent(PW)), 'the cookie never holds the password');
  const cookie = sc.split(';')[0];
  r = await go('/', { headers: { cookie } }); t = await r.text();
  ok(r.status === 200 && /the game/.test(t) && /text\/html/.test(r.headers.get('content-type')), 'with the cookie the game loads');
  ok(r.headers.get('x-robots-tag') === 'noindex, nofollow' && r.headers.get('cache-control') === 'private, no-store', 'the game page: noindex, private no-store');
  ok(/connect-src 'self' https:\/\/api\.doodledoggo\.app/.test(r.headers.get('content-security-policy') || '') && /frame-ancestors 'none'/.test(r.headers.get('content-security-policy') || ''), 'the game page: its CSP (the new API address, nobody frames it)');
  r = await go('/lang/ja.0123abcd.js', { headers: { cookie } }); t = await r.text();
  ok(r.status === 200 && t === 'window.ja=1' && r.headers.get('cache-control') === 'private, max-age=31536000, immutable', 'a hashed file: 200, cached privately for a year');
  r = await go('/brand.svg', { headers: { cookie: 'other=1; ' + cookie } }); ok(r.status === 200 && r.headers.get('cache-control') === 'private, max-age=3600', 'other files: private, an hour (the cookie found among others)');
  r = await go('/nope.js', { headers: { cookie } }); ok(r.status === 404 && /private/.test(r.headers.get('cache-control')), 'a missing file: 404, private');
  r = await go('/', { method: 'POST', headers: { cookie } }); ok(r.status === 405, 'only GET and HEAD for the game');

  const forged = cookie.replace(/\.([A-Za-z0-9_-]{43})$/, (m, s) => '.' + (s[0] === 'A' ? 'B' : 'A') + s.slice(1));
  r = await go('/', { headers: { cookie: forged } }); ok(r.status === 401, 'a forged cookie: the gate');
  const later = cookie.replace(/v1\.(\d+)\./, (m, e) => 'v1.' + (Number(e) + 999) + '.');
  r = await go('/', { headers: { cookie: later } }); ok(r.status === 401, 'a cookie with a longer life written in: the gate');
  r = await go('/', { headers: { cookie: 'dd_test=v1.1000.' + 'A'.repeat(43) } }); ok(r.status === 401, 'an expired cookie: the gate');
  r = await go('/__gate/out', { headers: { cookie } }); ok(r.status === 303 && /dd_test=; .*Max-Age=0/.test(r.headers.get('set-cookie') || ''), '/__gate/out drops the cookie');

  for (const bad of ['//evil.example/', 'https://evil.example/', '/\\evil.example', 'javascript:alert(1)']) {
    r = await post({ password: PW, next: bad }); ok(r.status === 303 && r.headers.get('location') === '/', 'next stays on this host: ' + bad);
  }
  for (let i = 0; i < 10; i++) await post({ password: 'nope-' + i }, '10.9.9.9');
  r = await post({ password: PW }, '10.9.9.9'); ok(r.status === 429 && !r.headers.get('set-cookie'), 'after 10 wrong tries from one IP: 429, even with the right password');
  r = await post({ password: PW }, '10.0.0.2'); ok(r.status === 303, 'another IP is not braked');
  return cookie;
}

(async () => {
  const t0 = Date.now();
  try {
    const gate = await import(path.join(ROOT, 'tools', 'test_gate.mjs'));
    const FILES = { '/index.html': [GAME, 'text/html; charset=utf-8'], '/lang/ja.0123abcd.js': ['window.ja=1', 'text/javascript; charset=utf-8'], '/brand.svg': ['<svg/>', 'image/svg+xml'] };
    const CSP = "default-src 'self'; connect-src 'self' https://api.doodledoggo.app; frame-ancestors 'none'";
    const w = gate.makeGate({ files: FILES, hashed: /^\/(lang\/[\w-]+|photo_fonts|world_[a-z])\.[0-9a-f]{8}\.js$|^\/fonts\/i18n\//, csp: CSP });
    const env = { TEST_PASSWORD: PW };
    const node = (u, o) => w.fetch(new Request(u, o), env);
    const cookie = await checks('in Node (tools/test_gate.mjs)', node, env);
    sec('keys');
    let r = await w.fetch(new Request('https://test.doodledoggo.app/', { headers: { cookie } }), { TEST_PASSWORD: 'a new password' });
    ok(r.status === 401, 'a new TEST_PASSWORD logs everyone out (the cookie key comes from it)');
    const k1 = { TEST_PASSWORD: PW, TEST_COOKIE_KEY: 'k'.repeat(40) }, tok = await gate.makeToken(k1);
    ok(await gate.tokenOk(k1, tok) && !(await gate.tokenOk(env, tok)) && (await gate.tokenOk({ TEST_PASSWORD: 'changed', TEST_COOKIE_KEY: 'k'.repeat(40) }, tok)), 'TEST_COOKIE_KEY signs the cookie when set (then a new password keeps the logins)');
    r = await w.fetch(new Request('https://test.doodledoggo.app/'), {});
    ok(r.status === 503 && r.headers.get('x-robots-tag') === 'noindex, nofollow', 'no TEST_PASSWORD on the Worker: 503 (fails closed)');
    r = await w.fetch(new Request('https://test.doodledoggo.app/__gate', { method: 'POST', body: 'password=', headers: { 'content-type': 'application/x-www-form-urlencoded' } }), {});
    ok(r.status === 503 && !r.headers.get('set-cookie'), 'no TEST_PASSWORD: an empty password does not get in');
    ok(!/TEST_PASSWORD\s*[:=]\s*['"]/.test(fs.readFileSync(path.join(ROOT, 'tools', 'test_gate.mjs'), 'utf8') + fs.readFileSync(path.join(ROOT, 'tools', 'cf_test_deploy.sh'), 'utf8')), 'no password is written in the gate or the deploy script');

    sec('tools/cf_test.js: the generated Worker');
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-gate-')), build = path.join(tmp, 'build'), out = path.join(tmp, 'cf');
    fs.mkdirSync(path.join(build, 'lang'), { recursive: true });
    fs.writeFileSync(path.join(build, 'index.html'), GAME); fs.writeFileSync(path.join(build, 'lang', 'ja.0123abcd.js'), 'window.ja=1'); fs.writeFileSync(path.join(build, 'brand.svg'), '<svg/>'); fs.writeFileSync(path.join(build, 'logo.png'), Buffer.from([137, 80, 78, 71]));
    try {
      const run = (args) => cp.spawnSync('node', [path.join(ROOT, 'tools', 'cf_test.js')].concat(args), { encoding: 'utf8' });
      let g = run(['--from', build, '--out', out]);
      ok(g.status === 0 && fs.existsSync(path.join(out, 'worker.js')) && fs.existsSync(path.join(out, 'gate.js')), 'cf_test.js writes worker.js + gate.js: ' + (g.stdout + g.stderr).trim().slice(0, 120));
      const parts = fs.readFileSync(path.join(out, 'parts.txt'), 'utf8').trim().split('\n').map((l) => l.split(' '));
      ok(parts.some(([n, ty]) => n === 'gate.js' && ty === 'application/javascript+module') && parts.some(([n, ty]) => n === 'f__logo.png' && ty === 'application/octet-stream') && parts.some(([n, ty]) => n === 'f__lang__ja.0123abcd.js' && ty === 'text/plain'), 'parts.txt: the gate as a module, pictures as Data, text as Text modules');
      fs.writeFileSync(path.join(build, 'index.html'), GAME.replace('<script>window.__ddNoPay=1</script>', ''));
      g = run(['--from', build, '--out', path.join(tmp, 'cf2')]); ok(g.status === 1 && /not the test build/.test(g.stderr), 'cf_test.js refuses a build without payments off');
      fs.writeFileSync(path.join(build, 'index.html'), GAME.replace('the game', '<div id="ddGate"></div>the game'));
      g = run(['--from', build, '--out', path.join(tmp, 'cf2')]); ok(g.status === 1 && /password screen/.test(g.stderr), 'cf_test.js refuses a build with the GitHub Pages password screen');
      fs.writeFileSync(path.join(build, 'index.html'), GAME);
      const MF = findMiniflare();
      if (!MF) console.log('--- Miniflare: not installed here (npm i -g miniflare); the generated Worker is not run');
      else {
        const modules = [{ type: 'ESModule', path: path.join(out, 'worker.js'), contents: fs.readFileSync(path.join(out, 'worker.js'), 'utf8') }].concat(parts.map(([n, ty]) => ({
          type: ty === 'application/javascript+module' ? 'ESModule' : ty === 'text/plain' ? 'Text' : 'Data', path: path.join(out, n),
          contents: ty === 'application/octet-stream' ? fs.readFileSync(path.join(out, n)) : fs.readFileSync(path.join(out, n), 'utf8') })));
        const worker = { name: 'doodle-doggo-test', modules, modulesRoot: out, compatibilityDate: '2026-08-01', bindings: { TEST_PASSWORD: PW } };
        let mf; try { mf = new MF.Miniflare(worker); } catch (e) { mf = new MF.Miniflare({ workers: [worker] }); }
        try {
          const ck = await checks('Miniflare (workerd): the generated Worker', (u, o) => mf.dispatchFetch(u, o), null);
          const r2 = await mf.dispatchFetch('https://test.doodledoggo.app/logo.png', { headers: { cookie: ck } });
          const b = Buffer.from(await r2.arrayBuffer());
          ok(r2.status === 200 && r2.headers.get('content-type') === 'image/png' && b.length === 4 && b[0] === 137, 'a picture comes back byte for byte (a Data module)');
        } finally { await mf.dispose(); }
      }
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }

    sec('tools/pages.js --test (when a split build is there) and the itch.io guard');
    const pagesSrc = fs.readFileSync(path.join(ROOT, 'tools', 'pages.js'), 'utf8');
    ok(/TEST \? NOPAY_FLAG : require\('\.\/pages_gate\.js'\)\.gate\(\)/.test(pagesSrc) && /window\.__ddNoPay=1/.test(pagesSrc) && /noindex,nofollow/.test(pagesSrc), 'pages.js --test: payments off and noindex instead of the in-page password screen');
    ok(/__ddNoPay=1/.test(fs.readFileSync(path.join(ROOT, 'tools', 'itch.js'), 'utf8')), 'tools/itch.js refuses a build with payments off (it must never reach itch.io)');
    ok(/if \(ksNoPay\(\)\) \{ toast\(KS_SOON\(\), 'good'\); return Promise\.resolve\(false\); \}/.test(fs.readFileSync(path.join(ROOT, 'game', 'src', '52_kindshop.js'), 'utf8')), 'the Kind shop: ksCheckout stops before the Worker and Stripe when payments are off');
    if (fs.existsSync(path.join(ROOT, '_split', 'index.html'))) {
      const o = fs.mkdtempSync(path.join(os.tmpdir(), 'dd-pages-'));
      try {
        const g = cp.spawnSync('node', [path.join(ROOT, 'tools', 'pages.js'), '--test', '--no-minify', '--out', o], { encoding: 'utf8' });
        const h = fs.readFileSync(path.join(o, 'index.html'), 'utf8');
        ok(g.status === 0 && /<script>window\.__ddNoPay=1<\/script>/.test(h) && !/id="ddGate"|dd_gate_v1/.test(h) && /<meta name="robots" content="noindex,nofollow"><\/head>/.test(h) && /__ddFrTest=1/.test(h), 'the real test build: payments off, no in-page gate, noindex in <head>, the test flags on');
        ok(/id="devBtn"|devBtn/.test(h), 'and the dev button is there');
      } finally { fs.rmSync(o, { recursive: true, force: true }); }
    } else console.log('--- no _split/ build here (node game/build.js publish): the real test build is not checked');
  } catch (e) { fails++; console.log('  CRASH', e && e.stack || e); }
  console.log(`${passes} passed, ${fails} failed (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (!fails) console.log('ALL OK');
  process.exit(fails ? 1 : 0);
})();
function findMiniflare() {
  const roots = [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean), module.paths);
  for (const r of roots) for (const sub of ['miniflare', 'wrangler/node_modules/miniflare']) { try { return require(path.join(r, sub)); } catch (e) { /* next */ } }
  try { return require('miniflare'); } catch (e) { return null; }
}
