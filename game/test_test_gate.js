// The password gate of the test copy at test.doodledoggo.app (tools/test_gate.mjs, tools/cf_test.js, tools/cf_test_deploy.sh; owner 18 Nov 2026).
//   node game/test_test_gate.js      (or: node game/run_tests.js test_gate)
// In Node: no password -> the gate page (401, noindex, private no-store); a wrong password 401; the right one a 303 with an HttpOnly Secure
// SameSite=Lax 30-day cookie that then lets the game load; a forged, expired or other-password cookie is refused; no TEST_PASSWORD -> 503;
// next= stays on this host; the brake after 10 wrong tries. Then the real generated Worker (tools/cf_test.js on a tiny fake test build) in
// Miniflare (workerd), when Miniflare is installed, and tools/pages.js --test: payments off, no in-page gate, noindex. Prints ALL OK.
// The merch sandbox run (SANDBOX.md part F, G1-G3): folder paths serve their index.html, /merch answers 301 to /merch/, /merch/ has its own CSP,
// /merch/test_cfg.json only behind the password and never stored; cf_test.js --merch / --merch-cfg (the token file checked, never printed; a
// different file at a game path stops the build) and, without --merch, the same Worker as before. Tokens here are made up (40 x "a").
process.removeAllListeners('warning');
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) { passes++; console.log('  ok', m); } else { fails++; console.log('  FAIL', m); } };
const sec = (s) => console.log('--- ' + s);
const PW = 'correct horse battery staple 42';
const MERCH_CSP = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'self' https://merch-api-test.doodledoggo.app; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"; // SANDBOX.md G2, exactly
const TOKEN_FILE = JSON.stringify({ token: 'a'.repeat(40) }); // made up
const MERCH_HTML = '<!doctype html><html><head><link rel="stylesheet" href="/merch/merch.css"></head><body>the merch page<script src="/merch/merch.js"></script></body></html>';
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
  r = await fetchIt('http://test.doodledoggo.app/merch?back=o1', { redirect: 'manual' });
  ok(r.status === 301 && r.headers.get('location') === 'https://test.doodledoggo.app/merch?back=o1' && r.headers.get('x-robots-tag') === 'noindex, nofollow' && r.headers.get('cache-control') === 'private, no-store', 'http -> 301 https (query kept), noindex, private no-store');

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
    await merchChecks('in Node: the merch page (zones)', gate, CSP, env, w);
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
      const merchOut = await cfMerchChecks(run, tmp, build, out);
      const MF = findMiniflare();
      if (!MF) console.log('--- Miniflare: not installed here (npm i -g miniflare); the generated Worker is not run');
      else {
        const worker = mfWorker(out);
        let mf; try { mf = new MF.Miniflare(worker); } catch (e) { mf = new MF.Miniflare({ workers: [worker] }); }
        try {
          const ck = await checks('Miniflare (workerd): the generated Worker', (u, o) => mf.dispatchFetch(u, o), null);
          const r2 = await mf.dispatchFetch('https://test.doodledoggo.app/logo.png', { headers: { cookie: ck } });
          const b = Buffer.from(await r2.arrayBuffer());
          ok(r2.status === 200 && r2.headers.get('content-type') === 'image/png' && b.length === 4 && b[0] === 137, 'a picture comes back byte for byte (a Data module)');
        } finally { await mf.dispose(); }
        if (merchOut) { // the generated Worker with --merch --merch-cfg: the game checks again, then the merch rules, in workerd
          const mm = mfWorker(merchOut);
          let m2; try { m2 = new MF.Miniflare(mm); } catch (e) { m2 = new MF.Miniflare({ workers: [mm] }); }
          try {
            const ck = await checks('Miniflare (workerd): the generated Worker with --merch', (u, o) => m2.dispatchFetch(u, o), null);
            const go = (p, o) => m2.dispatchFetch('https://test.doodledoggo.app' + p, Object.assign({ redirect: 'manual' }, o || {}));
            let r3 = await go('/merch?back=o1', { headers: { cookie: ck } });
            ok(r3.status === 301 && r3.headers.get('location') === '/merch/?back=o1', 'workerd: /merch -> 301 /merch/ (query kept)');
            r3 = await go('/merch/?new=1', { headers: { cookie: ck } }); let t3 = await r3.text();
            ok(r3.status === 200 && t3 === MERCH_HTML && r3.headers.get('content-security-policy') === MERCH_CSP && r3.headers.get('cache-control') === 'private, no-store', 'workerd: /merch/ is its index.html with the merch CSP, exactly');
            r3 = await go('/', { headers: { cookie: ck } });
            ok(/connect-src 'self' https:\/\/api\.doodledoggo\.app/.test(r3.headers.get('content-security-policy') || '') && r3.headers.get('content-security-policy') !== MERCH_CSP, 'workerd: the game keeps its own CSP');
            r3 = await go('/merch/test_cfg.json'); t3 = await r3.text();
            ok(r3.status === 401 && /action="\/__gate"/.test(t3) && !t3.includes('a'.repeat(40)), 'workerd: /merch/test_cfg.json without the cookie is the password page, never the file');
            r3 = await go('/x/../merch/test_cfg.json'); t3 = await r3.text(); ok(r3.status === 401 && !t3.includes('a'.repeat(40)), 'workerd: /x/../merch/test_cfg.json without the cookie: 401');
            r3 = await go('/merch/test_cfg.json', { headers: { cookie: ck } }); t3 = await r3.text();
            ok(r3.status === 200 && t3 === TOKEN_FILE && r3.headers.get('cache-control') === 'private, no-store' && r3.headers.get('x-robots-tag') === 'noindex, nofollow', 'workerd: with the cookie the token file as it is, private, no-store, noindex');
            r3 = await go('/merch/terms/', { headers: { cookie: ck } }); t3 = await r3.text();
            ok(r3.status === 200 && /the terms/.test(t3), 'workerd: /merch/terms/ is its index.html');
          } finally { await m2.dispose(); }
        }
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
function mfWorker(out) { // the generated Worker in _cftest form, as Miniflare modules (the upload's parts.txt types)
  const parts = fs.readFileSync(path.join(out, 'parts.txt'), 'utf8').trim().split('\n').map((l) => l.split(' '));
  const modules = [{ type: 'ESModule', path: path.join(out, 'worker.js'), contents: fs.readFileSync(path.join(out, 'worker.js'), 'utf8') }].concat(parts.map(([n, ty]) => ({
    type: ty === 'application/javascript+module' ? 'ESModule' : ty === 'text/plain' ? 'Text' : 'Data', path: path.join(out, n),
    contents: ty === 'application/octet-stream' ? fs.readFileSync(path.join(out, n)) : fs.readFileSync(path.join(out, n), 'utf8') })));
  return { name: 'doodle-doggo-test', modules, modulesRoot: out, compatibilityDate: '2026-08-01', bindings: { TEST_PASSWORD: PW } };
}

// G2 in Node: the gate with the merch zone, as tools/cf_test.js --merch writes it
async function merchChecks(label, gate, CSP, env, plain) {
  sec(label);
  const NOSTORE = /^\/merch\/(?:test_cfg\.json$|.*\.(?:js|css)$)/;
  const FILES = { '/index.html': [GAME, 'text/html; charset=utf-8'], '/merch/index.html': [MERCH_HTML, 'text/html; charset=utf-8'], '/merch/terms/index.html': ['<!doctype html>the terms', 'text/html; charset=utf-8'],
    '/merch/merch.js': ['window.m=1', 'text/javascript; charset=utf-8'], '/merch/merch.css': ['a{}', 'text/css; charset=utf-8'], '/merch/catalog.json': ['{}', 'application/json'],
    '/merch/print/pp1-00000000/pawprint.js': ['window.p=1', 'text/javascript; charset=utf-8'], '/merch/test_cfg.json': [TOKEN_FILE, 'application/json'], '/style.css': ['b{}', 'text/css; charset=utf-8'] };
  const w = gate.makeGate({ files: FILES, hashed: /^\/(lang\/[\w-]+|photo_fonts|world_[a-z])\.[0-9a-f]{8}\.js$|^\/fonts\/i18n\//, csp: CSP, zones: [{ prefix: '/merch/', csp: MERCH_CSP, noStore: NOSTORE }] });
  const cookie = 'dd_test=' + (await gate.makeToken(env));
  const go = (p, o, ww) => (ww || w).fetch(new Request('https://test.doodledoggo.app' + p, Object.assign({ redirect: 'manual' }, o || {})), env);
  const withCk = (p, o, ww) => go(p, Object.assign({ headers: { cookie } }, o || {}), ww);
  let r = await go('/merch'); let t = await r.text();
  ok(r.status === 401 && /value="\/merch"/.test(t), '/merch without the cookie: the gate page (next /merch), no redirect before the password');
  r = await withCk('/merch');
  ok(r.status === 301 && r.headers.get('location') === '/merch/' && r.headers.get('x-robots-tag') === 'noindex, nofollow' && r.headers.get('cache-control') === 'private, no-store', '/merch -> 301 /merch/ (noindex, private no-store)');
  r = await withCk('/merch?back=o_12&x=1'); ok(r.status === 301 && r.headers.get('location') === '/merch/?back=o_12&x=1', '/merch?back=... -> 301 /merch/?back=... (query kept)');
  r = await withCk('/merch/terms'); ok(r.status === 301 && r.headers.get('location') === '/merch/terms/', '/merch/terms -> 301 /merch/terms/');
  r = await withCk('/merch/'); t = await r.text();
  ok(r.status === 200 && t === MERCH_HTML && /text\/html/.test(r.headers.get('content-type')) && r.headers.get('cache-control') === 'private, no-store', '/merch/ serves /merch/index.html (private, no-store)');
  ok(r.headers.get('content-security-policy') === MERCH_CSP, '/merch/: the merch CSP, exactly');
  r = await withCk('/merch/?new=1'); t = await r.text(); ok(r.status === 200 && t === MERCH_HTML, '/merch/?new=1 (Stripe sends buyers back here): the page');
  r = await withCk('/merch/terms/'); t = await r.text(); ok(r.status === 200 && t === '<!doctype html>the terms' && r.headers.get('content-security-policy') === MERCH_CSP, '/merch/terms/ serves /merch/terms/index.html, merch CSP');
  r = await withCk('/'); ok(r.status === 200 && r.headers.get('content-security-policy') === CSP, '/: the game\'s CSP exactly as before (not the merch one)');
  r = await withCk('/index.html'); ok(r.headers.get('content-security-policy') === CSP, '/index.html: the game\'s CSP');
  r = await withCk('/style.css'); ok(r.status === 200 && !r.headers.get('content-security-policy') && r.headers.get('cache-control') === 'private, max-age=3600', '/style.css (a root file the page loads): no CSP, an hour, as the game\'s files');
  r = await withCk('/merch/merch.js'); ok(r.status === 200 && r.headers.get('cache-control') === 'private, no-store' && r.headers.get('content-security-policy') === MERCH_CSP, '/merch/merch.js: private, no-store (never stale in the run)');
  r = await withCk('/merch/merch.css'); ok(r.headers.get('cache-control') === 'private, no-store', '/merch/merch.css: private, no-store');
  r = await withCk('/merch/print/pp1-00000000/pawprint.js'); ok(r.headers.get('cache-control') === 'private, no-store', '/merch/print/<ver>/pawprint.js: private, no-store');
  r = await withCk('/merch/catalog.json'); ok(r.status === 200 && r.headers.get('cache-control') === 'private, max-age=3600', '/merch/catalog.json: private, an hour');
  r = await go('/merch/test_cfg.json'); t = await r.text();
  ok(r.status === 401 && /action="\/__gate"/.test(t) && !t.includes('a'.repeat(40)) && r.headers.get('cache-control') === 'private, no-store', '/merch/test_cfg.json without the cookie: the password page, never the file');
  r = await go('/merch/test_cfg.json', { method: 'HEAD' }); ok(r.status === 401, 'HEAD /merch/test_cfg.json without the cookie: 401');
  r = await go('/merch/test_cfg.json', { headers: { cookie: 'dd_test=v1.1000.' + 'A'.repeat(43) } }); ok(r.status === 401, '/merch/test_cfg.json with an expired cookie: 401');
  r = await withCk('/merch/test_cfg.json'); t = await r.text();
  ok(r.status === 200 && t === TOKEN_FILE && r.headers.get('cache-control') === 'private, no-store' && r.headers.get('x-robots-tag') === 'noindex, nofollow' && r.headers.get('content-type') === 'application/json', '/merch/test_cfg.json with the cookie: as it is, private, no-store, noindex');
  r = await go('/x/../merch/test_cfg.json'); t = await r.text(); ok(r.status === 401 && !t.includes('a'.repeat(40)), '/x/../merch/test_cfg.json without the cookie: 401, never the file');
  r = await go('/merch/%74est_cfg.json'); t = await r.text(); ok(r.status === 401 && !t.includes('a'.repeat(40)), '/merch/%74est_cfg.json without the cookie: 401');
  r = await withCk('/\\evil.example'); ok(r.status !== 301 && !r.headers.get('location'), 'with the cookie /\\evil.example: no redirect (' + r.status + ')');
  r = await withCk('//merch'); ok(r.status !== 301 && !r.headers.get('location'), 'with the cookie //merch: no redirect (' + r.status + ')');
  r = await withCk('//evil.example/merch'); ok(r.status !== 301 && !r.headers.get('location'), 'with the cookie //evil.example/merch: no redirect (' + r.status + ')');
  r = await withCk('/merch/nope.js'); ok(r.status === 404, 'a missing merch file: 404');
  r = await withCk('/merch/', { method: 'POST' }); ok(r.status === 405, 'only GET and HEAD under /merch/');
  // the game copy alone (no zones): the folder rule changes nothing there
  r = await withCk('/merch', null, plain); ok(r.status === 404, 'without the merch page: /merch is a 404 (no redirect)');
  r = await withCk('/merch/', null, plain); ok(r.status === 404, 'without the merch page: /merch/ is a 404');
  r = await withCk('/lang', null, plain); ok(r.status === 404, 'without the merch page: a game folder without index.html (/lang) is a 404, as before');
}

// G1 + G3: tools/cf_test.js --merch <dir> [--merch-cfg <file>] on a made-up merch checkout. Returns the --merch out folder for Miniflare.
async function cfMerchChecks(run, tmp, build, out) {
  sec('tools/cf_test.js --merch / --merch-cfg');
  const w = (p, c) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, c); };
  const M = path.join(tmp, 'merch-shop'), PEEKS = ['dachs', 'shiba', 'corgi', 'golden', 'pug', 'samoyed', 'beagle', 'husky', 'frenchie', 'chihuahua'];
  const SITE = ['style.css', 'js/site.js', 'img/logo.svg', 'img/art/washi.svg', 'fonts/caveat.woff2', 'fonts/patrick-hand.woff2', 'fonts/dd-code.woff2', 'img/art/momiji.svg', 'img/art/sakura.svg'].concat(PEEKS.map((d) => `img/art/peek/${d}.svg`)), BRAND = ['doodle-doggo-icon.svg', 'favicon.svg', 'icon-32.png', 'icon-180.png'];
  w(path.join(M, 'site', 'merch', 'index.html'), MERCH_HTML); w(path.join(M, 'site', 'merch', 'merch.js'), 'window.m=1'); w(path.join(M, 'site', 'merch', 'catalog.json'), '{}');
  w(path.join(M, 'site', 'merch', 'terms', 'index.html'), '<!doctype html>the terms'); w(path.join(M, 'site', 'merch', 'print', 'pp1-00000000', 'index.html'), '<!doctype html>print');
  w(path.join(M, 'site', 'merch', '.DS_Store'), 'x');
  SITE.forEach((f) => w(path.join(M, 'site', f), 'site ' + f)); BRAND.forEach((f) => w(path.join(M, 'brand', f), 'brand ' + f));
  w(path.join(build, 'favicon.svg'), 'brand favicon.svg'); // the game build has the same favicon: fine (kept once)
  const cfg = path.join(tmp, 'cfg.json'); w(cfg, TOKEN_FILE);
  const base1 = path.join(tmp, 'p1'), base2 = path.join(tmp, 'p2'), mo = path.join(tmp, 'm1');
  const dirSum = (d) => fs.readdirSync(d).sort().map((f) => f + ':' + require('crypto').createHash('sha256').update(fs.readFileSync(path.join(d, f))).digest('hex')).join('\n');
  let g = run(['--from', build, '--out', base1]);
  const plainWorker = fs.readFileSync(path.join(base1, 'worker.js'), 'utf8');
  ok(g.status === 0 && /\nexport default makeGate\(\{ files: FILES, hashed: \/.+\/, csp: "[^"]+" \}\);\n$/.test(plainWorker) && !/zones|merch/.test(plainWorker) && !/merch/.test(fs.readFileSync(path.join(base1, 'parts.txt'), 'utf8')) && !/merch/.test(g.stdout), 'without --merch: the same Worker as before (no zones, no /merch/ file, the old makeGate call)');
  g = run(['--from', build, '--out', mo, '--merch', M, '--merch-cfg', cfg]);
  const mw = g.status === 0 ? fs.readFileSync(path.join(mo, 'worker.js'), 'utf8') : '';
  ok(g.status === 0 && /with the merch page from .*: 28 files added/.test(g.stdout) && /test_cfg\.json included/.test(g.stdout), '--merch --merch-cfg builds: ' + (g.stdout + g.stderr).trim().split('\n').pop().trim().slice(0, 110));
  ok(!(g.stdout + g.stderr).includes('a'.repeat(40)), 'the build never prints the token');
  const peeks = (fs.readFileSync(path.join(ROOT, 'tools', 'cf_test.js'), 'utf8').match(/const MERCH_PEEKS = (\[[^\]]*\])/) || [])[1];
  ok(peeks && JSON.stringify(eval(peeks)) === JSON.stringify(PEEKS), 'cf_test.js MERCH_PEEKS: the 10 dogs this test expects');
  const siteJs = process.env.MERCH_PAGE ? path.join(process.env.MERCH_PAGE, 'site', 'js', 'site.js') : ''; // MERCH_PAGE=<a merch/shop checkout>: check its real script too
  if (siteJs && fs.existsSync(siteJs)) {
    const real = (fs.readFileSync(siteJs, 'utf8').match(/var PEEKS = (\[[^\]]*\])/) || [])[1];
    ok(real && JSON.stringify(eval(real)) === JSON.stringify(PEEKS), 'merch/shop site/js/site.js PEEKS: the same 10 dogs');
  }
  const need = ['/merch/index.html', '/merch/merch.js', '/merch/catalog.json', '/merch/terms/index.html', '/merch/print/pp1-00000000/index.html', '/merch/test_cfg.json'].concat(SITE.map((f) => '/' + f), BRAND.map((f) => '/' + f), ['/index.html', '/brand.svg']);
  ok(need.every((u) => mw.includes(JSON.stringify(u) + ': [f')) && !/DS_Store/.test(mw), 'every merch file at /merch/..., the 23 site files at the root (the momiji, sakura and 10 peeking dogs too), the game\'s own files kept (no dot files)');
  ok((mw.match(/"\/favicon\.svg": \[f/g) || []).length === 1 && fs.readFileSync(path.join(mo, 'f__favicon.svg'), 'utf8') === 'brand favicon.svg' && fs.readFileSync(path.join(mo, 'f__icon-32.png'), 'utf8') === 'brand icon-32.png', 'a site file the game build has with the same bytes is kept once; the brand files come from <dir>/brand/');
  ok(mw.includes(`zones: [{ prefix: '/merch/', csp: ${JSON.stringify(MERCH_CSP)}, noStore: /^\\/merch\\/(?:test_cfg\\.json$|.*\\.(?:js|css)$)/ }]`), 'the Worker gets the merch zone with the merch CSP, exactly');
  ok(fs.readFileSync(path.join(mo, 'f__merch__test_cfg.json'), 'utf8') === TOKEN_FILE, 'the token file goes in as it is');
  g = run(['--from', build, '--out', base2]);
  ok(g.status === 0 && dirSum(base1) === dirSum(base2), 'a build without --merch after one with it: byte for byte the same as the first');
  g = run(['--from', build, '--out', path.join(tmp, 'm2'), '--merch', M]);
  ok(g.status === 0 && !fs.existsSync(path.join(tmp, 'm2', 'f__merch__test_cfg.json')) && !fs.readFileSync(path.join(tmp, 'm2', 'worker.js'), 'utf8').includes('"/merch/test_cfg.json": [f') && /no test_cfg\.json/.test(g.stdout), '--merch without --merch-cfg: /merch/test_cfg.json left out');
  // the token file: accepted and refused
  const tryCfg = (body) => { w(cfg, body); const o = path.join(tmp, 'mc'); fs.rmSync(o, { recursive: true, force: true }); const r = run(['--from', build, '--out', o, '--merch', M, '--merch-cfg', cfg]); r.wrote = fs.existsSync(path.join(o, 'worker.js')); return r; };
  for (const [tok, why] of [['a'.repeat(32), '32 characters'], ['Z9_-'.repeat(32), '128 characters'], ['aB3-_'.repeat(8), 'letters, digits, - and _']]) {
    g = tryCfg(JSON.stringify({ token: tok })); ok(g.status === 0 && g.wrote, 'token file accepted: ' + why);
  }
  g = tryCfg('{\n  "token": "' + 'a'.repeat(40) + '"\n}\n'); ok(g.status === 0, 'token file accepted: pretty-printed JSON');
  const SECRETISH = 'q'.repeat(31);
  for (const [body, why] of [[JSON.stringify({ token: SECRETISH }), '31 characters'], [JSON.stringify({ token: 'q'.repeat(129) }), '129 characters'], [JSON.stringify({ token: 'q'.repeat(39) + '.' }), 'a dot'],
    [JSON.stringify({ token: 'q'.repeat(39) + '+' }), 'a plus'], [JSON.stringify({ token: 'q'.repeat(39) + '=' }), 'an equals sign'], [JSON.stringify({ token: 'q'.repeat(20) + ' ' + 'q'.repeat(19) }), 'a space'],
    [JSON.stringify({ token: 'q'.repeat(40), other: 1 }), 'a second key'], [JSON.stringify({ Token: 'q'.repeat(40) }), 'another key name'], [JSON.stringify({}), 'no key'], [JSON.stringify([{ token: 'q'.repeat(40) }]), 'an array'],
    ['null', 'null'], [JSON.stringify('q'.repeat(40)), 'a bare string'], [JSON.stringify({ token: 12345678901234567890123456789012345 }), 'a number'], ['token=' + 'q'.repeat(40), 'not JSON'], ['{"token":"' + 'q'.repeat(40) + '"', 'broken JSON'], ['', 'an empty file']]) {
    g = tryCfg(body); ok(g.status === 1 && !g.wrote && /not a test token file/.test(g.stderr) && !(g.stdout + g.stderr).includes('q'.repeat(20)), 'token file refused, nothing written, token not printed: ' + why);
  }
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch', M, '--merch-cfg', path.join(tmp, 'no-such.json')]); ok(g.status === 1 && /not a test token file/.test(g.stderr), 'a missing token file: refused');
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch-cfg', cfg]); ok(g.status === 1 && /only valid together with --merch/.test(g.stderr), '--merch-cfg without --merch: refused');
  const AS_PATH = 'Qx7-' + 'Q'.repeat(40); // a token given where the file's path goes (MERCH_TEST_CFG mixed up with MERCH_TEST_TOKEN)
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch', M, '--merch-cfg', AS_PATH]);
  ok(g.status === 1 && /not a test token file/.test(g.stderr) && !(g.stdout + g.stderr).includes('Q'.repeat(12)) && !(g.stdout + g.stderr).includes(cfg), 'a token given as the --merch-cfg path: refused, the value (and no path) printed');
  g = tryCfg(JSON.stringify({ token: 'q'.repeat(31) })); ok(g.status === 1 && !g.stderr.includes(cfg) && !g.stderr.includes(path.basename(cfg)), 'a refused token file: its path is not printed either');
  fs.symlinkSync(path.join(M, 'site', 'merch', 'merch.js'), path.join(M, 'site', 'merch', 'linked.js'));
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch', M]); ok(g.status === 1 && /linked\.js is a symbolic link/.test(g.stderr), 'a symbolic link in site/merch/: refused');
  fs.rmSync(path.join(M, 'site', 'merch', 'linked.js'));
  fs.mkdirSync(path.join(tmp, 'outside')); fs.writeFileSync(path.join(tmp, 'outside', 'x.js'), 'x'); fs.symlinkSync(path.join(tmp, 'outside'), path.join(M, 'site', 'merch', 'linkdir'));
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch', M]); ok(g.status === 1 && /linkdir is a symbolic link/.test(g.stderr), 'a symbolic link to a folder in site/merch/: refused');
  fs.rmSync(path.join(M, 'site', 'merch', 'linkdir'));
  // a wrong checkout
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch', path.join(tmp, 'nope')]); ok(g.status === 1 && /no such folder/.test(g.stderr), '--merch to a folder that is not there: refused');
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch', build]); ok(g.status === 1 && /no site\/merch\/index\.html/.test(g.stderr), '--merch to a folder without site/merch/: refused');
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch', path.join(M, 'site', 'merch')]); ok(g.status === 1 && /no site\/merch\/index\.html/.test(g.stderr), '--merch to site/merch itself: refused');
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch']); ok(g.status === 1 && /--merch needs a path/.test(g.stderr), '--merch without a path: refused');
  fs.renameSync(path.join(M, 'site', 'fonts', 'dd-code.woff2'), path.join(tmp, 'dd-code.woff2'));
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch', M]); ok(g.status === 1 && /needs \/fonts\/dd-code\.woff2/.test(g.stderr), 'a site file the page needs is missing in the checkout: refused');
  fs.renameSync(path.join(tmp, 'dd-code.woff2'), path.join(M, 'site', 'fonts', 'dd-code.woff2'));
  w(path.join(M, 'site', 'merch', 'test_cfg.json'), TOKEN_FILE);
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch', M]); ok(g.status === 1 && /only ever given with --merch-cfg/.test(g.stderr), 'a test_cfg.json inside the checkout: refused');
  fs.rmSync(path.join(M, 'site', 'merch', 'test_cfg.json'));
  // a path clash: the game build has a different file at a path the merch page needs
  w(path.join(build, 'favicon.svg'), 'the game\'s own favicon');
  fs.rmSync(path.join(tmp, 'mc'), { recursive: true, force: true });
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch', M]);
  ok(g.status === 1 && /already has a different \/favicon\.svg/.test(g.stderr) && !fs.existsSync(path.join(tmp, 'mc', 'worker.js')), 'the game build has a different /favicon.svg: the build stops, nothing written');
  w(path.join(build, 'merch', 'index.html'), '<!doctype html>a game page');
  w(path.join(build, 'favicon.svg'), 'brand favicon.svg');
  g = run(['--from', build, '--out', path.join(tmp, 'mc'), '--merch', M]); ok(g.status === 1 && /already has a different \/merch\/index\.html/.test(g.stderr), 'the game build has a different /merch/index.html: the build stops');
  fs.rmSync(path.join(build, 'merch'), { recursive: true }); fs.rmSync(path.join(build, 'favicon.svg'));
  w(cfg, TOKEN_FILE);
  // cf_test_deploy.sh: --merch only from MERCH_PAGE, --merch-cfg only from MERCH_TEST_CFG (statically, then the line itself in bash)
  const sh = fs.readFileSync(path.join(ROOT, 'tools', 'cf_test_deploy.sh'), 'utf8').split('\n').filter((l) => !/^\s*#/.test(l));
  const mline = sh.filter((l) => /--merch/.test(l));
  ok(mline.length === 1 && mline[0] === 'MERCH=(); [ -n "${MERCH_PAGE:-}" ] && MERCH+=(--merch "$MERCH_PAGE"); [ -n "${MERCH_TEST_CFG:-}" ] && MERCH+=(--merch-cfg "$MERCH_TEST_CFG")'
    && sh.filter((l) => /node tools\/cf_test\.js/.test(l)).every((l) => / \$\{MERCH\[@\]\+"\$\{MERCH\[@\]\}"\}$/.test(l)), 'cf_test_deploy.sh: one line adds --merch only when MERCH_PAGE is set (and --merch-cfg only from MERCH_TEST_CFG)');
  const argsOf = (env) => { const r = cp.spawnSync('bash', ['-c', 'set -euo pipefail; ' + mline[0] + '; for a in ${MERCH[@]+"${MERCH[@]}"}; do printf "<%s>" "$a"; done; echo'], { encoding: 'utf8', env: Object.assign({ PATH: process.env.PATH }, env) }); return r.status === 0 ? r.stdout.trim() : 'exit ' + r.status; };
  ok(argsOf({}) === '' && argsOf({ MERCH_PAGE: '' }) === '' && argsOf({ MERCH_TEST_CFG: '/c.json' }) === '<--merch-cfg></c.json>' && argsOf({ MERCH_PAGE: '/m s' }) === '<--merch></m s>' && argsOf({ MERCH_PAGE: '/m', MERCH_TEST_CFG: '/c.json' }) === '<--merch></m><--merch-cfg></c.json>',
    'that line in bash (set -u): nothing without MERCH_PAGE, --merch <dir> with it (cf_test.js refuses --merch-cfg alone)');
  return mo;
}

function findMiniflare() {
  const roots = [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean), module.paths);
  for (const r of roots) for (const sub of ['miniflare', 'wrangler/node_modules/miniflare']) { try { return require(path.join(r, sub)); } catch (e) { /* next */ } }
  try { return require('miniflare'); } catch (e) { return null; }
}
