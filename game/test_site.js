// SITE (v2.8.2, v2 redesign 17 Oct 2026, v3 pages 19 Oct 2026): the doodledoggo.app introduction site (site/, served by the Worker tools/cf_site.js builds), in Miniflare.
//   NODE_PATH=$(npm root -g) node game/test_site.js      (or: node game/run_tests.js site)
// Site v3: six pages (/, /dogs, /map, /about, /privacy, /reset) in 11 languages, each with the same header (header#sitehead: the brand, nav#sitenav with
// Home / Dogs / Map / About Us, the language menu). Desktop 1280x800 and iPhone 15: the home page (the live playroom, the itch.io widget, 8 featured dogs,
// Dogs in Japan, the map and About Us teasers), /dogs (every dog's profile), /map (25 places with pictures), /about, /privacy, /reset (v2.9.2: a notice,
// the reset is in the game) against the real cloudflare/worker.js on a local D1 (game/cloud_mock.js); www -> apex, no request leaves the site except the
// itch.io widget (no tracking; itch.io is a stub here, the tests never touch the network), the crayon decorations stay off the text, reduced motion,
// phone minimums (44 px taps, 15 px text, no sideways scroll, 320 px phones).
// v2.14: the same pages in 10 more languages (tools/site_i18n.js) and the test-only pseudo-locales /xx/ (en-XA) and /xx-cjk/ (ja-XA): html lang, hreflang,
// the language menu (also without JavaScript), the first-visit language from navigator.languages, the dog count rule, the size budget, iPhone 15 and Pixel 7.
// The second and third Workers: the per-language fonts (_cfsite_fonts/, route /fonts/i18n/*) and the map pictures (_cfsite_img/, route /img/map/*),
// reached in the browser the way their routes reach them.
// PAW_SITE_SHOTS=<dir> also saves screenshots there: site_<page>_<lang>_<device>.png for every page in en, ja, fr at desktop and iPhone 15.
// Node-only runner contract: prints ALL OK when every check passes.
process.removeAllListeners('warning');
const path = require('path'), fs = require('fs'), zlib = require('zlib'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const API = 'https://pawhaven-api.ansonyuen0108.workers.dev';
const ITCH = 'https://an9ou.itch.io/doodle-doggo', EMBED = 'https://itch.io/embed/5163381';
let fails = 0, passes = 0;
const BREEDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'mods', 'genes.js'), 'utf8').match(/const BREEDS = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
// the words rules (CLAUDE.md, the same patterns as test_copy_node.js): never "breed" as a verb, no stud, no selling dogs, no franchise names
const WORDS = [/\b(to breed|breed (them|your|her|him|my|our|dogs)|breeding (your|her|him|them|dogs)|bred (by|with|from))\b/i, /\bstuds?\b/i, /litter price/i,
  /\b(sell|sells|selling|sold)\b[^.!?]*\b(dog|dogs|pup|pups|puppy|puppies)\b|\b(dog|dogs|pup|pups|puppy|puppies)\b[^.!?]*\b(sell|sells|selling|sold)\b/i, /nintendo|pok[eé]mon|animal crossing/i];
// never a claim that the game is made in Japan (a Japanese style, not an origin): English, plus the usual phrasings of the 10 languages
const MADE_JP = /made in japan|(made|from|created|built) [^.]{0,30}\bin japan\b|from japan|japanese-made/i;
const MADE_JP_L10N = /日本製|日本で作|日本產|日本产|일본에서 만든|ผลิตในญี่ปุ่น|hecho en jap|feito no jap|fabriqué au jap|aus japan|buatan jepang/i;
// the six pages (data-page: the nav link that is aria-current there; privacy and reset have none)
const PG = [{ id: 'index', path: '/', nav: 'home' }, { id: 'dogs', path: '/dogs', nav: 'dogs' }, { id: 'map', path: '/map', nav: 'map' }, { id: 'about', path: '/about', nav: 'about' },
  { id: 'privacy', path: '/privacy', nav: null }, { id: 'reset', path: '/reset', nav: null }];
const NAV = [['home', '/'], ['dogs', '/dogs'], ['map', '/map'], ['about', '/about']];
const PLACES = ['yard', 'house', 'garden', 'kitchen', 'park', 'river', 'woods', 'beach', 'market', 'square', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier', 'shelter', 'fujihill',
  'station', 'shibuya', 'yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba'];
const ok = (c, m) => { if (c) { passes++; console.log('  ok  ' + m); } else { fails++; console.log('  FAIL ' + m); } };
const T0 = Date.now(), sec = (s) => console.log(`\n# ${s}  [${Math.round((Date.now() - T0) / 1000)} s]`);
const req = (m) => { for (const r of [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean), module.paths)) { try { return require(path.join(r, m)); } catch (e) { /* next */ } } return require(m); };
// a light HTML attribute reader for the header checks on the Worker's pages
const attrs = (s) => { const o = {}; for (const m of s.matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) o[m[1].toLowerCase()] = m[2] != null ? m[2] : m[3] != null ? m[3] : m[4] != null ? m[4] : ''; return o; };
const words = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ');

(async () => {
  cp.execFileSync('node', [path.join(ROOT, 'tools', 'cf_site.js'), '--pseudo'], { stdio: 'ignore' }); // v2.14: with the test-only pseudo-locales /xx/ and /xx-cjk/
  const I18N = require('../tools/site_i18n');
  const SIZES = JSON.parse(fs.readFileSync(path.join(ROOT, '_cfsite', 'sizes.json'), 'utf8'));
  const SCENE_KEYS = JSON.parse(fs.readFileSync(path.join(ROOT, 'site', 'js', 'site.js'), 'utf8').match(/var KEYS = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
  const dir = path.join(ROOT, '_cfsite');
  const readParts = (d) => fs.readFileSync(path.join(d, 'parts.txt'), 'utf8').trim().split('\n').filter(Boolean).map((l) => l.split(' '));
  const parts = readParts(dir);
  const MF = req('miniflare'), { chromium, devices } = req('playwright');
  const { makeServer } = require('./cloud_mock');
  const srv = makeServer();
  const workerOf = (d, o) => new MF.Miniflare(Object.assign({ modules: [{ type: 'ESModule', path: path.join(d, 'worker.js'), contents: fs.readFileSync(path.join(d, 'worker.js'), 'utf8') }]
    .concat(readParts(d).map(([n, t]) => ({ type: t === 'text/plain' ? 'Text' : 'Data', path: path.join(d, n), contents: fs.readFileSync(path.join(d, n)) }))), modulesRoot: d, compatibilityDate: '2026-08-01' }, o || {}));
  const mf = workerOf(dir, { port: 0 });
  const base = String(await mf.ready).replace(/\/$/, '');
  // v2.14: the per-language fonts Worker (only when site/fonts/i18n has fonts); v3: the map pictures Worker (only when split). The browser reaches them the way
  // the routes doodledoggo.app/fonts/i18n/* and doodledoggo.app/img/map/* do
  const fmf = SIZES.fontMode === 'split' ? workerOf(path.join(ROOT, '_cfsite_fonts')) : null;
  const imf = SIZES.imgMode === 'split' && fs.existsSync(path.join(ROOT, '_cfsite_img', 'worker.js')) ? workerOf(path.join(ROOT, '_cfsite_img')) : null;
  const relay = (w) => async (route) => { const fr = await w.dispatchFetch('https://doodledoggo.app' + new URL(route.request().url()).pathname); return route.fulfill({ status: fr.status, headers: { 'content-type': fr.headers.get('content-type') || 'application/octet-stream' }, body: Buffer.from(await fr.arrayBuffer()) }); };
  const local = (u) => { const s = String(u); return s.startsWith(base) || s.startsWith('data:') || s.startsWith('about:') || s.startsWith('blob:'); };
  const ITCH_STUB = '<!doctype html><html lang="en"><meta charset="utf-8"><title>itch.io widget (test stub)</title><body style="margin:0;font:16px sans-serif;background:#fff">Doodle Doggo on itch.io (stub)</body></html>';
  // every browser context: nothing reaches the network (anything not local is aborted, so it also shows as a console error), the itch.io widget is a stub,
  // the fonts and map pictures come from their Workers
  const routeAll = async (ctx) => {
    await ctx.route((u) => !local(u), (route) => route.abort()); // the reset page's Worker calls: page.route in wire() wins over this
    await ctx.route('https://itch.io/**', (route) => route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: ITCH_STUB }));
    await ctx.route('https://static.itch.io/**', (route) => route.fulfill({ status: 200, contentType: 'text/plain', body: '' }));
    if (fmf) await ctx.route('**/fonts/i18n/**', relay(fmf));
    if (imf) await ctx.route('**/img/map/**', relay(imf));
    return ctx;
  };
  const browser = await chromium.launch({ args: (process.env.PAW_ARGS || '').split(' ').filter(Boolean) });
  const newCtx = async (o) => routeAll(await browser.newContext(o));
  const shots = process.env.PAW_SITE_SHOTS;
  const SITE = 'https://doodledoggo.app';
  const LALL = I18N.LANGS.concat(I18N.PSEUDO);
  const pageUrl = (L, p) => I18N.urlFor(L, p);
  const langOf = (code) => LALL.find((x) => x.code === code);
  // the header's facts, from the DOM (browser) or from the HTML (Worker): { head, brand, links: [[page, href, aria-current]], langs }
  const headerProblems = (info, L, pg) => {
    const why = [];
    if (!info.head) return ['no header#sitehead.sitehead'];
    if (info.brand !== pageUrl(L, '/')) why.push(`brand -> ${info.brand}`);
    const pages = info.links.map((x) => x[0]);
    if (info.links.length !== 4 || NAV.some(([p]) => !pages.includes(p))) why.push(`nav links ${pages.join(',')}`);
    NAV.forEach(([p, u]) => { const x = info.links.find((y) => y[0] === p); if (x && x[1] !== pageUrl(L, u)) why.push(`${p} -> ${x[1]}`); });
    const cur = info.links.filter((x) => x[2] != null).map((x) => x[0] + '=' + x[2]);
    if (cur.join() !== (pg.nav ? pg.nav + '=page' : '')) why.push(`aria-current ${cur.join(',') || 'none'}`);
    if (!info.langs) why.push('no details#langs in the header');
    return why;
  };
  const headerFromHtml = (h) => {
    const hm = h.match(/<header\b([^>]*)>([\s\S]*?)<\/header>/g) || [];
    const block = hm.find((x) => /^<header\b[^>]*\bid="sitehead"/.test(x));
    if (!block) return { head: false };
    const open = attrs(block.match(/^<header\b([^>]*)>/)[1]);
    const nav = (block.match(/<nav\b[^>]*\bid="sitenav"[^>]*>[\s\S]*?<\/nav>/) || [''])[0];
    const navOpen = nav ? attrs(nav.match(/^<nav\b([^>]*)>/)[1]) : {};
    const links = [...nav.matchAll(/<a\b([^>]*)>/g)].map((m) => attrs(m[1])).filter((a) => 'data-page' in a).map((a) => [a['data-page'], a.href, a['aria-current'] != null ? a['aria-current'] : null]);
    const brand = [...block.matchAll(/<a\b([^>]*)>/g)].map((m) => attrs(m[1])).find((a) => (' ' + (a.class || '') + ' ').includes(' brand '));
    return { head: (' ' + (open.class || '') + ' ').includes(' sitehead ') && (' ' + (navOpen.class || '') + ' ').includes(' sitenav '), brand: brand && brand.href, links, langs: /<details\b[^>]*\bid="langs"/.test(block) };
  };
  const headerFromDom = (page) => page.evaluate(() => {
    const h = document.querySelector('header#sitehead'), n = document.querySelector('#sitehead nav#sitenav');
    const b = h && h.querySelector('a.brand');
    return { head: !!h && h.classList.contains('sitehead') && !!n && n.classList.contains('sitenav'), brand: b && b.getAttribute('href'),
      links: n ? [...n.querySelectorAll('a[data-page]')].map((a) => [a.dataset.page, a.getAttribute('href'), a.getAttribute('aria-current')]) : [], langs: !!(h && h.querySelector('details#langs')) };
  });
  // the page menu on a phone: a ☰ button (#navbtn) or a <details> menu may hide the four links; open it, then every link must be on screen, 44 px and tappable
  const openNav = async (page) => {
    if (await page.locator('#navbtn').isVisible().catch(() => false)) { if ((await page.getAttribute('#navbtn', 'aria-expanded')) !== 'true') await page.click('#navbtn'); await page.waitForTimeout(250); return 'button'; }
    const s = page.locator('#sitehead details:not(#langs) > summary').first();
    if (await s.count() && await s.isVisible() && !(await s.evaluate((e) => e.parentElement.open))) { await s.click(); await page.waitForTimeout(250); return 'details'; }
    return 'none';
  };
  const navTaps = (page) => page.evaluate(() => [...document.querySelectorAll('#sitenav a[data-page]')].map((a) => {
    const b = a.getBoundingClientRect(), e = b.width && b.height ? document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2) : null;
    return { p: a.dataset.page, w: Math.round(b.width), h: Math.round(b.height), l: Math.round(b.left), r: Math.round(b.right), hit: !!e && (e === a || a.contains(e)), vw: innerWidth };
  }));
  const navTapProblems = (t) => (t.length !== 4 ? [`${t.length} nav links`] : []).concat(t.filter((x) => !(x.w >= 44 && x.h >= 44 && x.l >= 0 && x.r <= x.vw && x.hit)).map((x) => `${x.p} ${x.w}x${x.h} at ${x.l}..${x.r}${x.hit ? '' : ' covered/off screen'}`));
  // a click that opens another page; a missing link fails its check instead of stopping the suite
  const follow = async (page, sel) => { try { if (!(await page.locator(sel).count())) return false; await Promise.all([page.waitForNavigation({ timeout: 10000 }), page.click(sel, { timeout: 5000 })]); return true; } catch (e) { return false; } };
  const scrollThrough = async (page, steps, wait) => { for (let y = 0; y < steps; y++) { const end = await page.evaluate(() => { scrollBy(0, innerHeight); return innerHeight + scrollY >= document.documentElement.scrollHeight - 2; }); await page.waitForTimeout(wait); if (end) break; } };
  try {
    sec('the Worker: size, routes, headers');
    const gz = parts.filter(([f]) => !/^xx(-cjk)?__/.test(f)).reduce((n, [f]) => n + zlib.gzipSync(fs.readFileSync(path.join(dir, f))).length, zlib.gzipSync(fs.readFileSync(path.join(dir, 'worker.js'))).length);
    ok(gz < 2.5e6 && SIZES.main < 2.5e6 && Math.abs(gz - SIZES.main) < 20e3, `the whole site, 11 languages, fits a free-plan Worker (${(gz / 1e6).toFixed(2)} MB gzipped without the test-only pseudo-locales, budget 2.5 MB, limit 3 MB)`);
    ok(SIZES.fontMode !== 'split' || SIZES.fonts < 2.5e6, `the per-language fonts (${SIZES.fontMode}${SIZES.fontMode === 'split' ? ', Worker doodle-doggo-fonts ' + (SIZES.fonts / 1e6).toFixed(2) + ' MB gzipped' : ''}) fit their Worker`);
    ok(['split', 'inline', 'none'].includes(SIZES.imgMode) && (SIZES.imgMode !== 'split' || (imf && SIZES.img < 2.5e6)), `the map pictures (imgMode ${SIZES.imgMode}${SIZES.imgMode === 'split' ? ', Worker _cfsite_img ' + ((SIZES.img || 0) / 1e6).toFixed(2) + ' MB gzipped' : ''}) fit their Worker`);
    if (SIZES.perLang) console.log('  .. per language, gzipped pages: ' + Object.entries(SIZES.perLang).map(([l, n]) => `${l} ${(n / 1e3).toFixed(1)} kB`).join(', '));
    ok(I18N.PAGES.length === PG.length && PG.every((p) => I18N.PAGES.some((x) => x.path === p.path)), 'tools/site_i18n.js makes the six pages (/, /dogs, /map, /about, /privacy, /reset) ' + I18N.PAGES.map((x) => x.path).join(' '));
    const get = (u, o) => mf.dispatchFetch(u, Object.assign({ redirect: 'manual' }, o || {}));
    let r = await get(SITE + '/');
    const csp = r.headers.get('content-security-policy') || '';
    ok(r.status === 200 && /text\/html/.test(r.headers.get('content-type')) && /default-src 'self'/.test(csp), 'home: 200, HTML, a strict content security policy');
    ok(/frame-src https:\/\/itch\.io(;|$| )/.test(csp) && !/unsafe-eval/.test(csp) && /frame-ancestors 'none'/.test(csp) && !/frame-src[^;]*(\*|http:)/.test(csp), `the CSP lets in only the itch.io widget: frame-src https://itch.io, no unsafe-eval, frame-ancestors 'none' (${csp})`);
    const home = await r.text();
    const EN = {}; for (const p of PG) EN[p.id] = p.id === 'index' ? home : await (await get(SITE + p.path)).text();
    { // the dog count in the copy follows the breed list (v2.11.1: it said 14 long after 21 were in)
      const NUM = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
      const word = (n) => n <= 20 ? NUM[n] : (['', '', 'twenty', 'thirty', 'forty'][Math.floor(n / 10)] + (n % 10 ? '-' + NUM[n % 10] : ''));
      const re = () => new RegExp('\\b(\\d+|' + NUM.slice(10).join('|') + '|(?:twenty|thirty|forty)(?:-\\w+)?) (wobbly|profiles)', 'gi'), n = BREEDS.length;
      const said = ['index', 'dogs', 'map', 'about'].map((k) => EN[k]).join('\n').match(re()) || [], onDogs = EN.dogs.match(re()) || [];
      ok(said.length >= 3 && onDogs.length >= 1 && said.every((m) => { const w = m.split(' ')[0].toLowerCase(); return w === String(n) || w === word(n); }), `every dog count in the copy (home, /dogs, /map, /about) says ${n} (${said.join('; ')})`);
    }
    ok(home.includes('🖍️ Adopt a wobbly crayon pup to love') && !/\bid="play"/.test(home) && /<a\b[^>]*class="play"[^>]*href="https:\/\/an9ou\.itch\.io\/doodle-doggo"|<a\b[^>]*href="https:\/\/an9ou\.itch\.io\/doodle-doggo"[^>]*class="play"/.test(home), 'tagline; the old #play button is gone, a plain a.play to itch.io stays at the bottom');
    ok(/<h1 class="h1logo"><img class="logo" src="\/doodle-doggo-logo\.svg"/.test(home), 'the heading is the brand logo');
    ok(/<title>Meet the dogs/.test(EN.dogs), '/dogs: the dogs page');
    const bad = WORDS.filter((re) => ['index', 'dogs', 'map', 'about'].some((k) => re.test(words(EN[k]))));
    ok(!bad.length, 'the words rules on /, /dogs, /map and /about: no "breed" as a verb, no selling dogs ' + bad.join(' '));
    ok(!MADE_JP.test(PG.map((p) => words(EN[p.id])).join(' ')), 'no claim that the game is made in Japan on any English page (a Japanese style, not an origin)');
    const js = await (await get(SITE + '/js/site.js')).text();
    const jsCode = js.replace(/^\s*\/\/.*$/mg, ''); // the comments may talk about itch.io's cookies
    ok(!/https?:\/\//.test(jsCode) && !/fetch\(|XMLHttpRequest|cookie|localStorage/.test(jsCode), 'site.js asks no one for anything (no URLs, fetch, cookies or storage)');
    ok(/og:image" content="https:\/\/doodledoggo\.app\/logo-1200x630\.png/.test(home) && /rel="icon" href="\/favicon\.svg/.test(home) && /<title>Doodle Doggo/.test(home), 'title, favicon and og:image tags');
    const allEn = PG.map((p) => EN[p.id]).join('\n');
    ok(!/googleapis|gstatic|google-analytics|gtag|facebook|plausible|cdn\./i.test(allEn + js + (await (await get(SITE + '/style.css')).text())), 'no third-party fonts, scripts or trackers in the pages, the script or the CSS');
    { const ext = [...new Set([...allEn.matchAll(/\b(?:src|href)="(https?:\/\/[^"]+)"/g)].map((m) => m[1]))].filter((u) => !u.startsWith(SITE) && !u.startsWith(ITCH) && !/^https:\/\/www\.instagram\.com\/doodledoggo\.app\/?$/.test(u) && !u.startsWith(EMBED + '?'));
      ok(!ext.length && /<div\b[^>]*\bid="itchbox"[^>]*\bdata-src="https:\/\/itch\.io\/embed\/5163381\?/.test(home) && !/<iframe\b/i.test(allEn), 'no outside src in the pages: the itch.io widget is click-to-load (#itchbox data-src, no iframe in the HTML; links: itch.io and Instagram) ' + ext.join(' ')); }
    for (const u of ['/favicon.svg', '/logo-1200x630.png', '/icon-180.png', '/site.webmanifest', '/doodle-doggo-logo.svg', '/fonts/caveat.woff2', '/img/noodle-happy.svg', '/privacy', '/reset', '/map', '/about', '/js/site.js', '/img/art/playroom.webp', '/img/art/ball.svg', '/img/art/fuji-spring.webp', '/img/art/fuji-summer.webp', '/img/art/fuji-autumn.webp', '/img/art/fuji-winter.webp', '/img/art/momiji.svg', '/img/art/sakura.svg', '/img/art/washi.svg']
      .concat(...BREEDS.map((k) => (SCENE_KEYS.includes(k) ? ['walk', 'jump', 'sit', 'happy', 'sniff', 'still', 'pup', 'sleep'] : ['still', 'pup']).map((p) => `/img/art/dogs/${k}-${p}.svg`)))) { // v2.14: only the playroom's dogs (KEYS in site.js) need scene poses
      r = await get(SITE + u); ok(r.status === 200, `${u}: 200 ${r.headers.get('content-type')}`); await r.arrayBuffer();
    }
    { const gone = []; for (const u of ['/img/screenshot-1-winter-yard.webp', '/img/screenshot-3-walk-fuji.webp', '/img/screenshot-4-fuji-view-hill.webp', '/img/screenshot-5-new-year.webp']) { r = await get(SITE + u); if (r.status !== 404) gone.push(u + ' ' + r.status); await r.arrayBuffer(); }
      ok(!gone.length, 'the old screenshots are gone from the Worker (budget) ' + gone.join(' ')); }
    { // v3: the map pictures (in their own Worker when split: the main Worker leaves /img/map/ to it)
      const imgGet = (u) => (imf ? imf.dispatchFetch(SITE + u) : get(SITE + u));
      const miss = [];
      for (const n of ['town-map', 'japan-map'].concat(PLACES)) { const ir = await imgGet(`/img/map/${n}.webp`); const b = Buffer.from(await ir.arrayBuffer()); if (ir.status !== 200 || ir.headers.get('content-type') !== 'image/webp' || b.slice(8, 12).toString() !== 'WEBP') miss.push(`${n} ${ir.status} ${ir.headers.get('content-type')}`); }
      ok(!miss.length, `the map pictures: town-map, japan-map and the 25 places answer 200 image/webp ${imf ? 'from the map pictures Worker' : 'from the site Worker'} ${miss.slice(0, 4).join(', ')}`);
      if (imf) { r = await get(SITE + '/img/map/town-map.webp'); await r.arrayBuffer(); const r2 = await imf.dispatchFetch(SITE + '/img/map/nope.webp'); await r2.arrayBuffer();
        ok(r.status === 404 && r2.status === 404, 'the main Worker leaves /img/map/ to the map pictures Worker (budget), which answers 404 for an unknown picture'); }
    }
    r = await get('https://www.doodledoggo.app/privacy?x=1'); ok(r.status === 301 && r.headers.get('location') === SITE + '/privacy?x=1', 'www.doodledoggo.app redirects to the apex, keeping the path');
    r = await get('https://www.doodledoggo.app/ja/map'); ok(r.status === 301 && r.headers.get('location') === SITE + '/ja/map', 'www.doodledoggo.app/ja/map redirects to the apex');
    r = await get(SITE + '/dogs.html'); ok(r.status === 301 && r.headers.get('location') === SITE + '/dogs', '/dogs.html redirects to /dogs');
    r = await get(SITE + '/map.html'); ok(r.status === 301 && r.headers.get('location') === SITE + '/map', '/map.html redirects to /map');
    r = await get(SITE + '/ja/about.html'); ok(r.status === 301 && r.headers.get('location') === SITE + '/ja/about', '/ja/about.html redirects to /ja/about');
    r = await get(SITE + '/js/site.js'); ok(/javascript/.test(r.headers.get('content-type')), 'site.js is served as JavaScript'); await r.text();
    r = await get(SITE + '/privacy.html'); ok(r.status === 301 && r.headers.get('location') === SITE + '/privacy', '/privacy.html redirects to /privacy');
    r = await get(SITE + '/nope'); ok(r.status === 404 && /Nothing here/.test(await r.text()), 'a friendly 404');
    r = await get(SITE + '/reset'); ok(r.headers.get('referrer-policy') === 'no-referrer', '/reset sends no referrer'); await r.text();
    r = await get(SITE + '/map'); ok(r.headers.get('referrer-policy') !== 'no-referrer' && /frame-ancestors 'none'/.test(r.headers.get('content-security-policy') || ''), '/map: the usual headers'); await r.text();
    r = await get(SITE + '/', { method: 'POST' }); ok(r.status === 405, 'only GET and HEAD');

    // the reset page's calls to the Worker go to the local one (with the CORS answer the real Worker gives this origin)
    const wire = async (page) => {
      const outside = [];
      page.on('request', (q) => { const u = q.url(); if (!local(u) && !u.startsWith(API)) outside.push(u); }); // the itch.io widget, once tapped, is filtered out at the end
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
    const itchBox = (page) => page.evaluate(() => { const f = document.querySelector('#itchbox iframe#itch'), l = document.querySelector('a#itchlink'), b = f && f.getBoundingClientRect(), bx = document.getElementById('itchbox');
      return { data: bx && bx.getAttribute('data-src'), src: f && f.getAttribute('src'), w: f && f.getAttribute('width'), h: f && f.getAttribute('height'), title: f && (f.getAttribute('title') || '').trim(), left: b && b.left, right: b && b.right, top: b && b.top + scrollY, bh: b && b.height, vw: innerWidth,
        link: l && l.getAttribute('href'), linkShown: !!l && !!l.getClientRects().length }; });

    for (const [label, opts] of [['desktop 1280x800', { viewport: { width: 1280, height: 800 } }], ['iPhone 15', devices['iPhone 15']]]) {
      sec(`${label}: the home page`);
      const ctx = await newCtx(Object.assign({}, opts, { ignoreHTTPSErrors: true })); const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error' && !/status of 400/.test(m.text())) errs.push(m.text()); }); // the used-link check answers 400 on purpose
      const outside = await wire(page);
      const frames = []; page.on('request', (q) => { if (q.url().startsWith('https://itch.io/')) frames.push(q.url()); });
      await page.goto(base + '/', { waitUntil: 'networkidle' });
      const phone = label === 'iPhone 15';
      const live = await page.evaluate(() => ({ on: document.getElementById('scene').classList.contains('live'), dogs: window.__dd ? window.__dd.dogs.map((d) => d.key) : [], balls: window.__dd ? window.__dd.balls.length : 0, toss: !document.getElementById('toss').hidden }));
      ok(live.on && live.dogs.length === (phone ? 5 : 8) && new Set(live.dogs).size === live.dogs.length && live.toss, `the live playroom runs with ${phone ? 5 : 8} different dogs and a Throw another ball button (${live.dogs.join(', ')})`);
      ok(live.balls === (phone ? 2 : 3), `${phone ? 2 : 3} balls in play from the start (${live.balls})`);
      const seen = await page.evaluate(async () => { const P = {}; for (let i = 0; i < 40; i++) { window.__dd.dogs.forEach((d) => { P[d.pose] = 1; }); await new Promise((r) => setTimeout(r, 150)); } return Object.keys(P); });
      ok(seen.length >= 2 && seen.every((p) => ['walk', 'jump', 'sit', 'happy', 'sniff', 'sleep'].includes(p)), 'the dogs move between poses (' + seen.join(', ') + ')');
      const pos0 = await page.evaluate(() => window.__dd.dogs.map((d) => [d.x, d.y]));
      // a tap on an empty bit of floor throws another ball there
      await page.evaluate(() => document.getElementById('scene').scrollIntoView({ block: 'center' })); await page.waitForTimeout(200);
      // find a bit of floor with no dog near it and tap it in the same task, so no dog can walk in between (waits up to 6 s for a clear spot)
      const nb = await page.evaluate(() => window.__dd.balls.length);
      const spot = await page.evaluate(async () => {
        const st = document.getElementById('stage'), sc = document.getElementById('scene');
        for (let tries = 0; tries < 60; tries++) {
          const r = st.getBoundingClientRect(), c = sc.getBoundingClientRect();
          for (let x = 120; x <= 880; x += 20) for (let y = 470; y <= 585; y += 15) {
            if (!window.__dd.dogs.every((d) => Math.hypot(d.x - x, d.y - 40 - y) > 110)) continue;
            const cx = r.left + x / 1000 * r.width, cy = r.top + y / 600 * r.height;
            if (cx < c.left + 10 || cx > c.right - 10) continue;
            sc.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: cx, clientY: cy }));
            return [cx, cy];
          }
          await new Promise((res) => setTimeout(res, 100));
        }
        return null;
      });
      const tapped = await page.evaluate((n) => ({ n: window.__dd.balls.length, arcs: window.__dd.balls[n] ? window.__dd.balls[n].arcs.length : -1 }), nb);
      ok(spot && tapped.n === nb + 1 && tapped.arcs > 0, `a tap on the floor throws another ball (${nb} -> ${tapped.n}, spot ${spot && spot.map(Math.round)})`);
      for (let i = 0; i < 6; i++) await page.click('#toss');
      ok(await page.evaluate(() => window.__dd.balls.length === window.__dd.max && window.__dd.max === 4), 'more taps and the button stop at 4 balls (they throw the free ones again)');
      const chase = await page.evaluate(async () => { let most = 0, split = false; for (let i = 0; i < 60; i++) { const c = window.__dd.dogs.filter((d) => d.task && d.task.kind === 'chase' && d.task.t >= 0);
        most = Math.max(most, c.length); if (new Set(c.map((d) => d.task.ball)).size >= 2) split = true; if (most >= 2 && split && window.__dd.stats().catches) break; await new Promise((r) => setTimeout(r, 150)); } return { most, split, catches: window.__dd.stats().catches }; });
      ok(chase.most >= 2 && chase.split, `several dogs chase at once, and they pick different balls (up to ${chase.most} chasing)`);
      const caught = chase.catches > 0 || await page.waitForFunction(() => window.__dd.stats().catches > 0, null, { timeout: 9000 }).then(() => true).catch(() => false);
      ok(caught, 'a dog catches a ball and trots it back');
      const moved = await page.evaluate((p0) => window.__dd.dogs.some((d, i) => Math.hypot(d.x - p0[i][0], d.y - p0[i][1]) > 30), pos0);
      ok(moved, 'the dogs run after the ball');
      const inside = await page.evaluate(() => window.__dd.dogs.every((d) => d.x >= 60 && d.x <= 940 && d.y >= 450 && d.y <= 596));
      ok(inside, 'every dog stays on the playroom floor');
      // v3: the itch.io widget replaces the PLAY AT ITCH.IO button; a plain link is always there in case the widget is blocked
      // v3 (click-to-load): itch.io's widget brings its own cookies and analytics, so nothing comes from itch.io until the visitor taps #itchload
      const pre = await page.evaluate(() => { const b = document.getElementById('itchload'), c = document.getElementById('itchcard'); return { btn: !!b && !b.hidden && !!b.getClientRects().length, card: !!c && !!document.querySelector('#itchbox #itchcard'), frame: !!document.querySelector('iframe') }; });
      ok(pre.btn && pre.card && !pre.frame && !frames.length && !outside.length, `before a tap: the itch.io card with its #itchload button, no iframe, not one request to itch.io or anywhere outside (${frames.length + outside.length}) ` + outside.slice(0, 2).join(' '));
      await page.click('#itchload'); await page.waitForSelector('#itchbox iframe#itch', { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(300);
      const ib = await itchBox(page);
      ok(ib.data && ib.src === ib.data && !(await page.$('#itchcard')), 'a tap on #itchload puts iframe#itch in place of the card, src = data-src');
      ok(ib.src && ib.src.startsWith(EMBED + '?') && ib.w === '552' && ib.h === '167' && ib.title, `the itch.io widget: iframe#itch in #itchbox, ${EMBED}?..., 552x167, with a title (${ib.src}, ${ib.w}x${ib.h}, "${ib.title}")`);
      ok(ib.link === ITCH && ib.linkShown, 'the plain a#itchlink to the itch.io page is always there');
      ok(ib.left != null && ib.left >= 0 && ib.right <= ib.vw + 0.5 && ib.bh > 0, `the widget fits the window (${Math.round(ib.left)}..${Math.round(ib.right)} of ${ib.vw})`);
      if (phone) ok(ib.top != null && ib.top < 844 * 1.6, `the itch.io widget is near the top on the phone (${Math.round(ib.top)} px down)`);
      ok(!(await page.$('#play')) && await page.evaluate((u) => !!document.querySelector(`a.play[href="${u}"]`), ITCH), 'no #play button; a plain a.play to itch.io at the bottom');
      const cards = await page.evaluate(() => ({ c: [...document.querySelectorAll('#dogs .cards .dcard')].map((a) => [a.getAttribute('href'), (a.querySelector('.dname') || {}).textContent, (a.querySelector('.dimg') || { getAttribute: () => '' }).getAttribute('src')]), all: !!document.querySelector('#dogs a[href="/dogs"]') }));
      const ck = cards.c.map((c) => (c[0] || '').replace('/dogs#', ''));
      ok(cards.c.length === 8 && new Set(ck).size === 8 && cards.c.every((c, i) => /^\/dogs#\w+$/.test(c[0] || '') && BREEDS.includes(ck[i]) && c[1] && c[2] === `/img/art/dogs/${ck[i]}-still.svg`) && cards.all, `8 featured dogs, each linking to its profile on /dogs, and a link to all of them (${ck.join(', ')})`);
      const wall = await page.evaluate(() => ({ pic: !!document.querySelector('#stage .wallpic img'), text: [...document.querySelectorAll('#stage *:not(.bark)')].filter((e) => e.children.length === 0 && e.textContent.trim()).map((e) => e.textContent.trim()) }));
      ok(wall.pic && !wall.text.some((t) => /[぀-ヿ一-鿿]/.test(t)), 'the playroom wall has a framed Mt. Fuji picture, no kanji');
      const contact = await page.evaluate(() => { const a = document.querySelector('footer #contact'); const b = a && a.getBoundingClientRect(); return a && { text: a.textContent.trim(), href: a.getAttribute('href'), h: b.height, w: b.width, insta: !!document.querySelector('footer #insta'), privacy: !!document.querySelector('footer a[href="/privacy"]') }; });
      ok(contact && contact.text === 'CONTACT US' && contact.href === 'mailto:contact@doodledoggo.app' && contact.h >= 44 && contact.w >= 44 && contact.insta && contact.privacy, 'the footer: CONTACT US (mailto:contact@doodledoggo.app, 44 px) next to Instagram and Privacy');
      const jp = await page.evaluate(() => ({ notes: [...document.querySelectorAll('#japan .notes h3')].map((h) => h.textContent), trip: (document.querySelector('#japan .trip') || {}).textContent || '', words: document.querySelectorAll('#japan .words dt').length, hanko: document.querySelectorAll('.hanko').length }));
      ok(jp.notes.length === 6 && /Hachiko/.test(jp.notes[0]) && /Shiba and Akita/.test(jp.notes[1]) && /café/.test(jp.notes[2]) && /Strollers/.test(jp.notes[3]) && /lead/.test(jp.notes[4]) && /shrines/.test(jp.notes[5]), 'Dogs in Japan: Hachiko, Shiba and Akita, dog cafés, strollers, leads in parks, shrines ' + jp.notes.join(' / '));
      ok(/Tokyo Trip/.test(jp.trip) && /Shibuya/.test(jp.trip) && /Asakusa/.test(jp.trip) && !/\b(20\d\d|January|February|March|April|May|June|July|August|September|October|November|December|spring|summer|autumn|winter|soon)\b/i.test(jp.trip), 'the Tokyo Trip teaser names Shibuya and Asakusa and promises no date');
      ok(jp.words >= 6 && jp.hanko >= 2, `small Japanese words with their meaning (${jp.words}) and hanko stamps (${jp.hanko})`);
      const teas = await page.evaluate(() => ({ map: !!document.querySelector('#mapteaser a[href="/map"]'), mapImgs: [...document.querySelectorAll('#mapteaser img')].map((i) => i.getAttribute('src')), about: !!document.querySelector('#aboutteaser a[href="/about"]') }));
      ok(teas.map && teas.mapImgs.length >= 1 && teas.mapImgs.every((s) => /^\/img\/map\/[\w-]+\.webp$/.test(s)) && teas.about, `the map teaser (link to /map, pictures from /img/map/: ${teas.mapImgs.join(' ')}) and the About Us teaser (link to /about)`);
      await scrollThrough(page, 30, 120);
      await page.waitForLoadState('networkidle'); await page.waitForTimeout(400);
      ok(await page.evaluate(() => !window.__dd.running()), 'the playroom pauses when it scrolls out of view');
      ok(frames.length >= 1 && frames.every((u) => u.startsWith(EMBED + '?')), 'after the tap the widget loads from itch.io/embed only (a stub here) ' + frames.slice(0, 2).join(' '));
      await page.evaluate(() => scrollTo(0, 0));
      const info = await page.evaluate(() => ({
        imgs: [...document.querySelectorAll('img')].map((i) => [i.getAttribute('src'), i.complete && i.naturalWidth > 0]),
        feats: document.querySelectorAll('.feats li').length, shots: document.querySelectorAll('.shots, .shots img').length,
        fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family)
      }));
      ok(info.imgs.every((x) => x[1]), 'every picture loads (logo, playroom, dogs, Mt. Fuji, the map) ' + info.imgs.filter((x) => !x[1]).map((x) => x[0]).join(' '));
      ok(info.shots === 0 && info.feats === 6, `no screenshot strip any more, 6 features (${info.shots}, ${info.feats})`);
      ok(info.fonts.some((f) => /Caveat/.test(f)) && info.fonts.some((f) => /Patrick Hand/.test(f)), 'the game\'s hand fonts load from the site itself');
      const a = await audit(page);
      ok(a.scroll <= 0, `no sideways scroll (${a.scroll})`); ok(!a.small.length, 'tap targets 44 px or more ' + a.small.join(', ')); ok(!a.tiny.length, 'text 15 px or more ' + a.tiny.slice(0, 4).join(', '));

      sec(`${label}: /dogs`);
      await page.goto(base + '/dogs#shiba', { waitUntil: 'networkidle' });
      const dg = await page.evaluate(() => ({ ids: [...document.querySelectorAll('article.prof')].map((a) => a.id), nav: [...document.querySelectorAll('.dognav a')].map((a) => a.getAttribute('href')),
        full: [...document.querySelectorAll('article.prof')].every((a) => a.querySelector('h2').textContent.trim() && a.querySelector('.bubble').textContent.length > 4 && a.querySelectorAll('.traits li').length === 4 && a.querySelectorAll('.loves li').length === 3 && a.querySelector('.pup') && a.querySelector('.playline') && /[゠-ヿ一-鿿]/.test(a.querySelector('.jpline').textContent)),
        top: Math.round(document.getElementById('shiba').getBoundingClientRect().top), head: Math.round((document.getElementById('sitehead') || { getBoundingClientRect: () => ({ bottom: 0 }) }).getBoundingClientRect().bottom),
        sticky: /sticky|fixed/.test(getComputedStyle(document.getElementById('sitehead') || document.body).position), play: [...document.querySelectorAll('a')].some((x) => x.href === 'https://an9ou.itch.io/doodle-doggo') }));
      ok(dg.ids.length === BREEDS.length && dg.ids.join() === BREEDS.join(), `a profile for every dog (${dg.ids.length} = BREEDS.length) in BREEDS order, with the dog's key as its anchor (/dogs#shiba ...)`);
      ok(await page.evaluate(() => { const x = document.querySelector('section.soonprof#soon'); return !!x && x.previousElementSibling.id === 'shihtzu' && /More dogs are coming!/.test(x.textContent) && /Japanese Chin and Kai Ken are on their way/.test(x.textContent) && x.querySelectorAll('.sil').length === 2 && document.querySelector('footer #contact').getAttribute('href') === 'mailto:contact@doodledoggo.app'; }), '/dogs ends with More dogs are coming! and has CONTACT US in the footer');
      ok(dg.full, 'every profile: name, line, 4 traits, 3 favourites, a puppy drawing, the playroom habit and the Japanese name');
      ok(dg.nav.join() === BREEDS.map((k) => '#' + k).join(), 'the picture menu (.dognav) links every profile');
      ok(Math.abs(dg.top - (dg.sticky ? dg.head : 0)) < 40, `/dogs#shiba opens at Mochi's profile (top ${dg.top}${dg.sticky ? ', below the ' + dg.head + ' px sticky header' : ''})`);
      ok(dg.play, 'the dogs page links to itch.io');
      await scrollThrough(page, 100, 80);
      await page.waitForLoadState('networkidle'); await page.waitForTimeout(300);
      ok(await page.evaluate(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0)), 'every dog, puppy and favourite drawing loads');
      const a4 = await audit(page); ok(a4.scroll <= 0 && !a4.small.length && !a4.tiny.length, 'dogs: phone minimums (no sideways scroll, 44 px taps, 15 px text) ' + a4.small.concat(a4.tiny).slice(0, 4).join(', '));

      sec(`${label}: /map`);
      await page.goto(base + '/map', { waitUntil: 'networkidle' });
      await scrollThrough(page, 60, 100); await page.waitForLoadState('networkidle'); await page.waitForTimeout(300);
      const mp = await page.evaluate(() => {
        const src = (s) => { const i = document.querySelector(s); return i && i.getAttribute('src'); };
        const loaded = (s) => { const i = document.querySelector(s); return !!i && i.complete && i.naturalWidth > 0; };
        return { secs: [...document.querySelectorAll('section.places')].map((s) => s.id), town: src('figure#townmap img'), japan: src('figure#japanmap img'), maps: loaded('figure#townmap img') && loaded('figure#japanmap img'),
          places: [...document.querySelectorAll('article.place')].map((a) => { const i = a.querySelector('img'), h = a.querySelector('h3'), p = a.querySelector('p');
            return { id: a.id, src: i && i.getAttribute('src'), alt: !!i && !!(i.getAttribute('alt') || '').trim(), ok: !!i && i.complete && i.naturalWidth > 0, h3: !!h && !!h.textContent.trim(), p: !!p && p.textContent.trim().length > 10, sec: (a.closest('section.places') || {}).id }; }),
          h1: (document.querySelector('h1') || {}).textContent || '' };
      });
      ok(mp.secs.length === 3 && ['home-places', 'town', 'tokyo'].every((s) => mp.secs.includes(s)), `three sections of places: home-places, town, tokyo (${mp.secs.join(', ')})`);
      ok(mp.town === '/img/map/town-map.webp' && mp.japan === '/img/map/japan-map.webp' && mp.maps, `the town map and the Japan map (figure#townmap, figure#japanmap) load (${mp.town}, ${mp.japan})`);
      const pids = mp.places.map((p) => p.id.replace(/^place-/, ''));
      ok(mp.places.length === 25 && PLACES.every((id) => pids.includes(id)) && mp.places.every((p) => p.id === 'place-' + p.id.replace(/^place-/, '')), `25 places, article.place#place-<id> (${PLACES.filter((id) => !pids.includes(id)).join(' ') || 'all there'})`);
      const pbad = mp.places.filter((p) => p.src !== `/img/map/${p.id.replace(/^place-/, '')}.webp` || !p.ok || !p.alt || !p.h3 || !p.p).map((p) => p.id + (p.ok ? '' : ' (picture)') + (p.h3 ? '' : ' (h3)') + (p.p ? '' : ' (p)') + (p.alt ? '' : ' (alt)'));
      ok(!pbad.length, 'every place: its /img/map/<id>.webp picture loads, with alt text, a name (h3) and a line (p) ' + pbad.slice(0, 5).join(', '));
      ok(['shibuya', 'yoyogi', 'asakusa', 'ueno', 'tokyotower', 'odaiba'].every((id) => (mp.places.find((p) => p.id === 'place-' + id) || {}).sec === 'tokyo') && ['yard', 'house'].every((id) => (mp.places.find((p) => p.id === 'place-' + id) || {}).sec === 'home-places') && ['park', 'beach', 'fujihill'].every((id) => (mp.places.find((p) => p.id === 'place-' + id) || {}).sec === 'town'), 'the places sit in the right sections (home, town, Tokyo)');
      ok(/The map/.test(mp.h1), `the map's title (${mp.h1.trim()})`);
      const a5 = await audit(page); ok(a5.scroll <= 0 && !a5.small.length && !a5.tiny.length, 'map: phone minimums ' + a5.small.concat(a5.tiny).slice(0, 4).join(', '));

      sec(`${label}: /about`);
      await page.goto(base + '/about', { waitUntil: 'networkidle' });
      const ab = await page.evaluate(() => { const a = document.querySelector('article#about'); if (!a) return null; const img = a.querySelector('img'), cta = document.querySelector('a#itchcta');
        return { h1: ((a.querySelector('h1') || {}).textContent || '').trim(), img: !!img && img.complete && img.naturalWidth > 0, alt: !!img && /dachshund/i.test(img.getAttribute('alt') || ''), ps: [...a.querySelectorAll('p')].filter((p) => p.textContent.trim().length > 20).length,
          cta: cta && cta.getAttribute('href'), mail: !!document.querySelector('a[href="mailto:contact@doodledoggo.app"]'), text: a.textContent }; });
      ok(ab && /Why I made Doodle Doggo/.test(ab.h1) && ab.img && ab.alt && ab.ps >= 3, `About Us: article#about with its title, the crayon dachshund (it loads) and ${ab ? ab.ps : 0} paragraphs (3 or more)`);
      ok(ab && ab.cta === ITCH && ab.mail, 'About Us: a#itchcta to the itch.io page and the contact email');
      ok(ab && !/\b(must|have to|required)\b[^.]{0,30}\b(pay|donat)/i.test(ab.text) && /free/i.test(ab.text) && /no ads/i.test(ab.text), 'About Us: free, no ads, a donation is never needed');
      const a6 = await audit(page); ok(a6.scroll <= 0 && !a6.small.length && !a6.tiny.length, 'about: phone minimums ' + a6.small.concat(a6.tiny).slice(0, 4).join(', '));

      sec(`${label}: privacy`);
      await page.goto(base + '/privacy', { waitUntil: 'networkidle' });
      const pt = await page.textContent('main');
      ok(/Privacy policy/.test(pt) && /no ads and no tracking/i.test(pt) && /contact@doodledoggo\.app/.test(pt) && !/CONTACT EMAIL/.test(pt) && (await page.getAttribute('footer #contact', 'href')) === 'mailto:contact@doodledoggo.app' && /6-digit code/.test(pt) && !/password link/.test(pt) && /itch\.io/.test(pt) && /only loads if you tap/i.test(pt), 'the privacy page: no ads, no tracking, emails only for a 6-digit reset code, the contact email filled in, the itch.io box only loads on a tap');
      const a2 = await audit(page); ok(a2.scroll <= 0 && !a2.small.length && !a2.tiny.length, 'privacy: phone minimums ' + a2.small.concat(a2.tiny).slice(0, 4).join(', '));

      sec(`${label}: the reset page (v2.9.2: only a notice, the reset happens in the game)`);
      await page.goto(base + '/reset?token=' + 'L'.repeat(43), { waitUntil: 'networkidle' }); // an old emailed link
      ok((await page.evaluate(() => location.search)) === '', 'an old link\'s code leaves the address bar at once');
      ok(/Forgot your password\?/.test(await page.textContent('h1')), 'title: Forgot your password?');
      const rt = await page.textContent('#rsMoved');
      ok(rt.includes('Password resets now happen in the game: tap Forgot your password? and use the code we email you.'), '"Password resets now happen in the game: tap Forgot your password? and use the code we email you."');
      ok((await page.getAttribute('#rsMoved a', 'href')) === ITCH, 'with the itch.io link');
      ok(!(await page.locator('input, form').count()), 'no password form on the site any more');
      const a3 = await audit(page); ok(a3.scroll <= 0 && !a3.small.length && !a3.tiny.length, 'reset: phone minimums ' + a3.small.concat(a3.tiny).slice(0, 4).join(', '));
      ok(!srv.calls.some((c) => c.page === page), 'the page calls nothing');
      if (phone) {
        await page.goto('about:blank'); await page.goto(base + '/reset#access_token=sbat_old&type=recovery&expires_in=3600', { waitUntil: 'networkidle' });
        ok((await page.evaluate(() => location.hash)) === '' && await page.isVisible('#rsMoved'), 'an old Supabase link: it leaves the address bar, the same notice');
      }
      const out2 = outside.filter((u) => !u.startsWith(EMBED + '?') && !u.startsWith('https://static.itch.io/'));
      ok(!out2.length, 'no request leaves the site except the Worker and the tapped itch.io widget (no tracking) ' + out2.slice(0, 3).join(' '));
      ok(!errs.length, 'no console errors ' + errs.slice(0, 2).join(' | '));
      await ctx.close();
    }

    sec('desktop 1280x800: the header nav works');
    {
      const ctx = await newCtx({ viewport: { width: 1280, height: 800 }, locale: 'en-US' }); const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(e.message));
      await page.goto(base + '/', { waitUntil: 'load' }); await openNav(page);
      const t = await navTaps(page); ok(!navTapProblems(t).length, 'desktop: the four page links are on screen at the top ' + navTapProblems(t).join(', '));
      await follow(page, '#sitenav a[data-page="map"]');
      let h = await headerFromDom(page);
      ok(new URL(page.url()).pathname === '/map' && !headerProblems(h, langOf('en'), PG[2]).length, `a click on Map on / opens /map, with aria-current on Map (${new URL(page.url()).pathname}) ${headerProblems(h, langOf('en'), PG[2]).join(', ')}`);
      await page.goto(base + '/ja/', { waitUntil: 'load' }); await openNav(page);
      await follow(page, '#sitenav a[data-page="dogs"]');
      h = await headerFromDom(page);
      ok(new URL(page.url()).pathname === '/ja/dogs' && !headerProblems(h, langOf('ja'), PG[1]).length, `on /ja/ a click on the Dogs link opens /ja/dogs (${new URL(page.url()).pathname}) ${headerProblems(h, langOf('ja'), PG[1]).join(', ')}`);
      await openNav(page); await follow(page, '#sitehead a.brand');
      ok(new URL(page.url()).pathname === '/ja/', `the brand goes home in the same language (${new URL(page.url()).pathname})`);
      ok(!errs.length, 'no errors ' + errs.join(' | '));
      await ctx.close();
    }

    sec('desktop 1280x800: the crayon decorations (#deco peeks and momiji, falling leaves) stay off the text');
    {
      const ctx = await newCtx({ viewport: { width: 1280, height: 800 }, locale: 'en-US' }); const page = await ctx.newPage();
      let peeks = 0, leaves = 0;
      for (const u of ['/', '/dogs', '/map', '/about']) {
        await page.goto(base + u, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready); await page.waitForTimeout(1500);
        const d = await page.evaluate(async () => {
          const raf = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
          const deco = document.getElementById('deco'), petals = document.getElementById('petals');
          const decos = [...document.querySelectorAll('#deco .peek, #deco .leaf')];
          const pe = [deco, petals].filter(Boolean).flatMap((e) => [e].concat([...e.querySelectorAll('*')])).filter((e) => getComputedStyle(e).pointerEvents !== 'none').map((e) => e.className || e.id || e.tagName);
          const shown = (e) => { const s = getComputedStyle(e); const b = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0 && b.width > 0 && b.height > 0; };
          const texts = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
          while ((n = w.nextNode())) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || el.closest('#deco, #petals, script, style, [hidden], [aria-hidden="true"]') || !el.getClientRects().length) continue; texts.push(n); }
          const hits = new Set(), H = document.documentElement.scrollHeight;
          for (let y = 0, k = 0; k < 60; y += Math.round(innerHeight * 0.8), k++) {
            scrollTo({ top: y, behavior: 'instant' }); await raf();
            const boxes = decos.filter(shown).map((e) => [e, e.getBoundingClientRect()]).filter(([, b]) => b.bottom > 0 && b.top < innerHeight);
            if (boxes.length) for (const t of texts) {
              const rg = document.createRange(); rg.selectNodeContents(t);
              for (const r of rg.getClientRects()) {
                if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
                for (const [e, b] of boxes) if (r.left < b.right - 1 && r.right > b.left + 1 && r.top < b.bottom - 1 && r.bottom > b.top + 1) hits.add(`${e.className} ${e.getAttribute('src') ? e.getAttribute('src').split('/').pop() : ''} on "${t.textContent.trim().slice(0, 24)}"`);
              }
            }
            if (y + innerHeight >= H) break;
          }
          // the falling leaves and the decorations sit behind the text: 20 text nodes spread over the page, elementFromPoint at their centre
          const covered = []; const step = Math.max(1, Math.floor(texts.length / 20));
          for (let i = 0; i < texts.length && i / step < 20; i += step) {
            const t = texts[i], rg = document.createRange(); rg.selectNodeContents(t);
            t.parentElement.scrollIntoView({ block: 'center', behavior: 'instant' }); await raf();
            const r = [...rg.getClientRects()].find((x) => x.width >= 4 && x.height >= 4); if (!r) continue;
            const cx = r.left + r.width / 2, cy = r.top + r.height / 2; if (cx < 0 || cy < 0 || cx > innerWidth || cy > innerHeight) continue;
            const e = document.elementFromPoint(cx, cy); if (e && e.closest('#deco, #petals')) covered.push(`"${t.textContent.trim().slice(0, 20)}" under ${e.className}`);
          }
          scrollTo({ top: 0, behavior: 'instant' });
          return { deco: !!deco, hidden: !!deco && deco.getAttribute('aria-hidden') === 'true', peeks: document.querySelectorAll('#deco img.peek').length, leaves: document.querySelectorAll('#deco img.leaf').length, pe, hits: [...hits], covered };
        });
        peeks += d.peeks; leaves += d.leaves;
        ok(d.deco && d.hidden, `${u}: #deco is there and aria-hidden (${d.peeks} peeking dogs, ${d.leaves} momiji)`);
        ok(!d.pe.length, `${u}: every decoration lets taps through (pointer-events: none) ` + d.pe.slice(0, 4).join(', '));
        ok(!d.hits.length, `${u}: no peeking dog or momiji over any text ` + d.hits.slice(0, 4).join(' | '));
        ok(!d.covered.length, `${u}: 20 sampled bits of text are never under a decoration or a falling leaf ` + d.covered.slice(0, 4).join(' | '));
      }
      ok(peeks > 0 && leaves > 0, `the decorations exist: img.peek dogs (${peeks}) and img.leaf momiji (${leaves})`);
      await ctx.close();
    }

    sec('reduced motion (iPhone 15): a still playroom, no falling leaves');
    {
      const ctx = await newCtx(Object.assign({}, devices['iPhone 15'], { reducedMotion: 'reduce' })); const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(e.message));
      await page.goto(base + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
      const rm = await page.evaluate(() => ({ live: document.getElementById('scene').classList.contains('live'), dd: !!window.__dd, dogs: [...document.querySelectorAll('#scene .dd img')].map((i) => i.complete && i.naturalWidth > 0), petals: document.querySelectorAll('.petal').length, toss: document.getElementById('toss').hidden,
        anim: [...document.querySelectorAll('#scene .dd img')].every((i) => /-still\.svg$/.test(i.getAttribute('src'))) }));
      ok(!rm.live && !rm.dd && rm.dogs.length >= 3 && rm.dogs.every(Boolean) && rm.anim, 'the playroom stays still: the drawn dogs sit in place, one frame each, no animation');
      ok(!rm.petals && rm.toss, 'no falling leaves and no Toss button');
      await page.goto(base + '/map', { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
      ok(!(await page.evaluate(() => document.querySelectorAll('.petal').length)), 'no falling leaves on /map either');
      ok(!errs.length, 'no errors ' + errs.join(' | '));
      await ctx.close();
    }
    // ===== v2.14: the site in 11 languages (tools/site_i18n.js), the language menu, the first-visit language, the pseudo-locales
    sec('languages: the strings and the generator');
    {
      const out = cp.spawnSync('node', [path.join(ROOT, 'tools', 'site_i18n.js'), '--check']); ok(out.status === 0, 'the committed English pages are what site/tpl + site/i18n/en.json make ' + String(out.stdout).trim());
      const leg = cp.spawnSync('node', [path.join(ROOT, 'tools', 'site_i18n.js'), '--legacy', '_cfsite/legacy']);
      const legHome = leg.status === 0 && fs.readFileSync(path.join(ROOT, '_cfsite', 'legacy', 'index.html'), 'utf8');
      ok(legHome && !/langbar|hreflang|dd_lang/.test(legHome) && /<!-- dogs:cards -->/.test(legHome), 'the generator can still make the v2.12 English pages without the v2.14 additions (--legacy)');
      const en = JSON.parse(fs.readFileSync(path.join(ROOT, 'site', 'i18n', 'en.json'), 'utf8')), keys = Object.keys(en).filter((k) => !k.startsWith('_'));
      let bad = []; keys.forEach((k) => { try { I18N.parse(en[k]); } catch (e) { bad.push(k); } });
      ok(!bad.length && keys.length > 600, `en.json: ${keys.length} keys, every one a valid message ${bad.join(' ')}`);
      ok(BREEDS.every((k) => ['name', 'quote', 'personality', 'trait1', 'trait4_line', 'play', 'love1', 'love3'].every((f) => en[`dog.${k}.${f}`])) && SCENE_KEYS.every((k) => en['play.bark.' + k]), 'en.json has every dog profile (35) and every playroom bark');
      ok(PLACES.every((id) => en[`map.place.${id}.name`] && en[`map.place.${id}.text`]) && ['nav.home', 'nav.dogs', 'nav.map', 'nav.about', 'about.h1', 'about.p1', 'about.p2', 'about.p3'].every((k) => en[k]), 'en.json has the nav, the 25 places and About Us');
      ok(Object.keys(en._notes).every((k) => k in en) && ['home.dogs.lead', 'profile.jpline', 'card.alt', 'common.play'].every((k) => en._notes[k]), 'translator notes (_notes) for the tricky keys, each naming a real key');
      const built = I18N.build({});
      const hits = built.reports.filter((x) => x.bans && x.bans.length).map((x) => `${x.lang}: ${x.bans.join(', ')}`);
      ok(!hits.length, 'the translated text keeps each language\'s word rules (game/i18n/glossary/<lang>.json bans) ' + hits.join(' | '));
      ok(built.reports.every((x) => !x.drift || !x.drift.length), 'en.json personalities match the game (PawArt.DOGS)');
      for (const L of LALL) {
        const { rep, own } = I18N.table(L);
        if (L.code !== 'en' && !L.pseudo) console.log(`  .. ${L.code}: ${rep.translated}/${rep.total} keys translated${rep.complete ? ', marked complete' : ''}`);
        ok(!rep.broken.length && !rep.unknown.length, `${L.code}: no broken messages or unknown keys ${rep.broken.concat(rep.unknown).slice(0, 3).join(' | ')}`);
        if (rep.complete) ok(!rep.missing.length, `${L.code} is marked complete: no missing keys ${rep.missing.slice(0, 5).join(' ')}`);
        // the dog count rule in every language: the number always comes from {count}, so it follows the breed list
        const counts = I18N.COUNT_KEYS.map((k) => I18N.fmt(L.code, k)), typed = I18N.COUNT_KEYS.filter((k) => own[k] && !/\{count[,}]/.test(own[k]));
        ok(counts.every((c) => c.includes(String(BREEDS.length)) || c.includes('Thirty-five')) && !typed.length, `${L.code}: every dog count says ${BREEDS.length} (from {count}) ${typed.join(' ')}`);
      }
    }

    sec('languages: every page of every language (the Worker): 200, lang, hreflang, the header, the menu, no placeholders');
    for (const L of LALL) {
      let fine = true; const why = [];
      for (const pg of PG) {
        const u = pageUrl(L, pg.path); r = await get(SITE + u); const h = await r.text();
        const alt = [...h.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)">/g)].map((m) => [m[1], m[2]]);
        const want = L.pseudo || pg.id === 'reset' ? [] : I18N.LANGS.map((x) => [x.code, SITE + pageUrl(x, pg.path)]).concat([['x-default', SITE + pg.path]]);
        const langsBlock = (h.match(/<details\b[^>]*\bid="langs"[^>]*>[\s\S]*?<\/details>/) || [''])[0];
        const menu = [...langsBlock.matchAll(/<a\b([^>]*)>/g)].map((m) => attrs(m[1])).filter((a) => 'data-lang' in a).map((a) => a.href);
        const hp = headerProblems(headerFromHtml(h), L, pg);
        const vis = words(h.replace(/<noscript[\s\S]*?<\/noscript>/g, ''));
        const checks = {
          status: r.status === 200, lang: h.includes(`<html lang="${L.code}"`), clang: r.headers.get('content-language') === L.code,
          hreflang: JSON.stringify(alt) === JSON.stringify(want), canonical: pg.id === 'reset' || h.includes(`<link rel="canonical" href="${SITE + u}">`),
          menu: menu.length === 11 && I18N.LANGS.every((x, i) => menu[i] === pageUrl(x, pg.path)),
          script: /localStorage/.test(h) && h.includes(`H='${L.dir || 'en'}'`),
          font: /<link rel="stylesheet" href="\/fonts\/i18n\//.test(h) === (L.code !== 'en' && (() => { const f = path.join(ROOT, 'site', 'fonts', 'i18n', (L.pseudo === 'cjk' ? 'ja' : L.code) + '.css'); return fs.existsSync(f) && /@font-face/.test(fs.readFileSync(f, 'utf8')); })()),
          links: L.code === 'en' || !/href="\/(dogs|privacy|map|about|reset)?(#[^"]*)?"/.test(h.replace(/<link rel="alternate"[^>]*>/g, '').replace(langsBlock, '')),
          header: !hp.length, placeholders: !/[{}]/.test(vis)
        };
        Object.entries(checks).forEach(([k, v]) => { if (!v) { fine = false; why.push(pg.id + ':' + k + (k === 'header' ? ' (' + hp.join(', ') + ')' : k === 'placeholders' ? ' (' + (vis.match(/.{0,20}[{}].{0,20}/) || [''])[0] + ')' : '')); } });
        if (!L.pseudo && (pg.id === 'map' || pg.id === 'about') && (MADE_JP.test(vis) || MADE_JP_L10N.test(vis))) { fine = false; why.push(pg.id + ':made-in-japan (' + (vis.match(MADE_JP) || vis.match(MADE_JP_L10N))[0] + ')'); }
      }
      ok(fine, `${L.code}: the six pages answer 200 with <html lang="${L.code}">, content-language, ${L.pseudo ? 'no hreflang (test-only)' : 'all 11 hreflang + x-default'}, canonical, the header (brand, 4 nav links in the language, aria-current), the menu (11 languages, same page), links that stay in the language, no {placeholder} left${L.pseudo ? '' : ', never "made in Japan" on /map and /about'} ${why.slice(0, 6).join(' ')}`);
    }
    if (fmf) { // the per-language fonts live in the second Worker doodle-doggo-fonts (route doodledoggo.app/fonts/i18n/*)
      const names = readParts(path.join(ROOT, '_cfsite_fonts')).map((l) => l[0].replace(/^fonts__i18n__/, '')); let good = true;
      for (const n of names) { const fr = await fmf.dispatchFetch(SITE + '/fonts/i18n/' + n); good = good && fr.status === 200 && /font\/woff2|text\/css|text\/plain/.test(fr.headers.get('content-type')); await fr.arrayBuffer(); }
      r = await get(SITE + '/fonts/i18n/' + names[0]); await r.text();
      ok(good && r.status === 404, `the fonts Worker serves ${names.length} font files (${names.join(', ')}); the main Worker leaves /fonts/i18n/ to it`);
    }
    r = await get(SITE + '/ja'); ok(r.status === 301 && r.headers.get('location') === SITE + '/ja/', '/ja redirects to /ja/');
    r = await get(SITE + '/zh-hant/dogs.html'); ok(r.status === 301 && r.headers.get('location') === SITE + '/zh-hant/dogs', '/zh-hant/dogs.html redirects to /zh-hant/dogs');
    r = await get(SITE + '/de/index.html'); ok(r.status === 301 && r.headers.get('location') === SITE + '/de/', '/de/index.html redirects to /de/');
    r = await get(SITE + '/ko/nope'); ok(r.status === 404 && /<html lang="ko"/.test(await r.text()) && r.headers.get('content-language') === 'ko', 'a 404 under /ko/ is in Korean (lang ko)');
    r = await get(SITE + '/tpl/index.tpl'); ok(r.status === 404, 'the templates and string tables are not served'); await r.text();
    r = await get(SITE + '/img/art/dogs/akita-walk.svg'); ok(r.status === 404, 'scene poses of dogs the playroom never picks stay out of the Worker (budget)'); await r.text();

    sec('languages: phones (iPhone 15, Pixel 7): the header, no errors, no sideways scroll, the phone minimums');
    // all six pages in en, ja, de, th; the home page and the map in every language
    const FULL = ['en', 'ja', 'de', 'th'];
    for (const [label, dev] of [['iPhone 15', devices['iPhone 15']], ['Pixel 7', devices['Pixel 7']]]) {
      const ctx = await newCtx(Object.assign({}, dev, { locale: 'en-US' })); const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(e.message)); page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
      for (const L of LALL) {
        const bad = [], pages = FULL.includes(L.code) ? PG : PG.filter((p) => p.id === 'index' || p.id === 'map');
        for (const pg of pages) {
          await page.goto(base + pageUrl(L, pg.path), { waitUntil: 'load' });
          const a = await audit(page), lang = await page.evaluate(() => document.documentElement.lang);
          if (a.scroll > 0) bad.push(`${pg.id} scrolls sideways ${a.scroll}px`);
          if (a.small.length) bad.push(`${pg.id} small taps ${a.small.slice(0, 2).join(', ')}`);
          if (a.tiny.length) bad.push(`${pg.id} tiny text ${a.tiny.slice(0, 2).join(', ')}`);
          if (lang !== L.code) bad.push(`${pg.id} lang ${lang}`);
          const hp = headerProblems(await headerFromDom(page), L, pg); if (hp.length) bad.push(`${pg.id} header ${hp.slice(0, 2).join(', ')}`);
          if (pg.id === 'index') { await page.click('#itchload', { timeout: 3000 }).catch(() => bad.push('index: no #itchload')); await page.waitForSelector('#itchbox iframe#itch', { timeout: 3000 }).catch(() => {}); const ib = await itchBox(page); if (!(ib.left >= 0 && ib.right <= ib.vw + 0.5)) bad.push(`index itch.io widget ${Math.round(ib.left)}..${Math.round(ib.right)} of ${ib.vw}`); }
          await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await openNav(page);
          const np = navTapProblems(await navTaps(page)); if (np.length) bad.push(`${pg.id} nav ${np.slice(0, 2).join(', ')}`);
          const s2 = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth); if (s2 > 0) bad.push(`${pg.id} open menu scrolls sideways ${s2}px`);
        }
        ok(!bad.length && !errs.length, `${label}, ${L.code}: ${pages.length === PG.length ? 'six pages' : 'home and map'}, the header and its 4 links (44 px, on screen), no console errors, no sideways scroll, 44 px taps, 15 px text ${bad.concat(errs).slice(0, 3).join(' | ')}`);
        errs.length = 0;
      }
      // the language menu, opened, on a phone: every row a 44 px tap with 15 px+ text, inside the screen
      await page.goto(base + '/dogs', { waitUntil: 'load' });
      if (!(await page.locator('#langs summary').isVisible().catch(() => false))) await openNav(page);
      await page.click('#langs summary', { timeout: 5000 }).catch(() => {}); await page.waitForTimeout(150);
      const m = await page.evaluate(() => [...document.querySelectorAll('#langs a[data-lang]')].map((a) => { const b = a.getBoundingClientRect(); return [a.textContent, Math.round(b.height), Math.round(b.left), Math.round(b.right), parseFloat(getComputedStyle(a).fontSize)]; }));
      const sb = await page.locator('#langs summary').boundingBox();
      ok(m.length === 11 && m.every((x) => x[1] >= 44 && x[2] >= 0 && x[3] <= (dev.viewport.width) && x[4] >= 15) && sb && sb.height >= 44 && (await audit(page)).scroll <= 0, `${label}: the open language menu: 11 native names, 44 px rows, 15 px+ text, on screen (${m.map((x) => x[0]).join(', ')})`);
      await ctx.close();
    }

    sec('languages: the menu, the saved choice and the first-visit language');
    {
      const ctx = await newCtx({ viewport: { width: 1280, height: 800 }, locale: 'en-US' }); const page = await ctx.newPage();
      await page.goto(base + '/dogs', { waitUntil: 'load' });
      ok(!(await page.isVisible('#langs a[data-lang="ja"]')), 'the menu starts closed');
      await page.click('#langs summary', { timeout: 5000 }).catch(() => {}); ok(await page.isVisible('#langs a[data-lang="ja"]'), 'a tap opens it');
      await follow(page, '#langs a[data-lang="ja"]');
      ok(new URL(page.url()).pathname === '/ja/dogs' && await page.evaluate(() => localStorage.getItem('dd_lang')) === 'ja', 'picking 日本語 on /dogs opens /ja/dogs and saves the choice');
      await page.click('#langs summary', { timeout: 5000 }).catch(() => {}); await page.mouse.click(5, 790); ok(!(await page.isVisible('#langs a[data-lang="ja"]')), 'a tap outside closes it');
      await page.click('#langs summary', { timeout: 5000 }).catch(() => {}); await follow(page, '#langs a[data-lang="en"]');
      ok(new URL(page.url()).pathname === '/dogs' && await page.evaluate(() => localStorage.getItem('dd_lang')) === 'en', 'picking English goes back to /dogs and is saved too');
      await page.goto(base + '/map', { waitUntil: 'load' }); await page.click('#langs summary', { timeout: 5000 }).catch(() => {}); await follow(page, '#langs a[data-lang="de"]');
      ok(new URL(page.url()).pathname === '/de/map', `picking Deutsch on /map opens /de/map (${new URL(page.url()).pathname})`);
      await ctx.close();
      const nojs = await newCtx({ viewport: { width: 1280, height: 800 }, javaScriptEnabled: false }); const p2 = await nojs.newPage();
      await p2.goto(base + '/privacy'); await p2.click('#langs summary', { timeout: 5000 }).catch(() => {}); await follow(p2, '#langs a[data-lang="fr"]');
      ok(new URL(p2.url()).pathname === '/fr/privacy', 'without JavaScript the menu still works: plain links (/privacy -> /fr/privacy)');
      await p2.goto(base + '/about'); await p2.click('#langs summary', { timeout: 5000 }).catch(() => {}); await follow(p2, '#langs a[data-lang="ko"]');
      ok(new URL(p2.url()).pathname === '/ko/about', 'and on /about (-> /ko/about)');
      const itchReq = []; p2.on('request', (q) => { if (/itch\.io/.test(new URL(q.url()).hostname)) itchReq.push(q.url()); });
      await p2.goto(base + '/', { waitUntil: 'load' });
      const nj = await p2.evaluate(() => ({ btn: !!document.getElementById('itchload') && !document.getElementById('itchload').getClientRects().length, frame: !!document.querySelector('iframe'), link: !!document.querySelector('a#itchlink') && !!document.querySelector('a#itchlink').getClientRects().length }));
      ok(nj.btn && !nj.frame && nj.link && !itchReq.length, 'without JavaScript: no itch.io button and no iframe, the plain itch.io link shows, nothing from itch.io');
      await nojs.close();
    }
    const detect = async (locale, url, opts) => {
      const ctx = await newCtx(Object.assign({ viewport: { width: 1280, height: 800 }, locale }, opts || {})); const page = await ctx.newPage();
      let navs = 0; page.on('framenavigated', (f) => { if (f === page.mainFrame()) navs++; });
      if (opts && opts.saved) await ctx.addInitScript((v) => { try { if (!localStorage.getItem('dd_lang')) localStorage.setItem('dd_lang', v); } catch (e) { /* none */ } }, opts.saved);
      await page.goto(base + url, { waitUntil: 'load' }); await page.waitForTimeout(400);
      const res = { path: new URL(page.url()).pathname + new URL(page.url()).hash, navs, langs: await page.evaluate(() => navigator.languages.join()) };
      await ctx.close(); return res;
    };
    for (const [loc, url, want] of [['zh-TW', '/', '/zh-hant/'], ['zh-HK', '/dogs#shiba', '/zh-hant/dogs#shiba'], ['zh-CN', '/', '/zh-hans/'], ['pt-PT', '/', '/pt-br/'], ['es-MX', '/privacy', '/es/privacy'], ['ja-JP', '/', '/ja/'], ['ko-KR', '/reset', '/ko/reset'], ['th-TH', '/', '/th/'], ['id-ID', '/', '/id/'], ['de-AT', '/', '/de/'], ['fr-CA', '/', '/fr/'], ['en-GB', '/', '/'], ['it-IT', '/', '/'],
      ['ja-JP', '/map', '/ja/map'], ['fr-FR', '/about', '/fr/about'], ['th-TH', '/map#place-shibuya', '/th/map#place-shibuya']]) {
      const d = await detect(loc, url);
      ok(d.path === want && d.navs <= 2, `first visit with ${loc} (${d.langs}): ${url} -> ${d.path} (${d.navs} navigations)`);
    }
    { const d = await detect('zh-TW', '/', { saved: 'en' }); ok(d.path === '/' && d.navs === 1, 'a saved choice wins: zh-TW with English saved stays on /'); }
    { const d = await detect('ja-JP', '/ja/', {}); ok(d.path === '/ja/' && d.navs === 1, 'translated pages never redirect (no loop)'); }
    { const d = await detect('ja-JP', '/', { userAgent: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }); ok(d.path === '/', 'no redirect for bots'); }
    // v2.14 site fix: a saved pick of another language is followed on the English pages (keeping the #anchor), but never from a page of this site
    { const d = await detect('en-US', '/', { saved: 'ja' }); ok(d.path === '/ja/' && d.navs <= 2, `a saved 日本語 opens /ja/ from / (${d.path})`); }
    { const d = await detect('en-US', '/dogs#shiba', { saved: 'zh-hant' }); ok(d.path === '/zh-hant/dogs#shiba', `a saved 繁體中文 opens /zh-hant/dogs#shiba from /dogs#shiba (${d.path})`); }
    { const d = await detect('en-US', '/', { saved: 'xx-bogus' }); ok(d.path === '/', 'an unknown saved value stays on /'); }
    {
      const ctx = await newCtx({ viewport: { width: 1280, height: 800 }, locale: 'en-US' }); const page = await ctx.newPage();
      await ctx.addInitScript(() => { try { if (!localStorage.getItem('dd_lang')) localStorage.setItem('dd_lang', 'ja'); } catch (e) { /* none */ } });
      await page.goto(base + '/', { waitUntil: 'load', referer: base + '/ja/' }); await page.waitForTimeout(400);
      ok(new URL(page.url()).pathname === '/', 'a saved choice is not followed when the visitor comes from a page of this site (same-host referrer)');
      await page.goto(base + '/dogs#maltese', { waitUntil: 'load', referer: base + '/dogs' }); await page.click('#langs summary', { timeout: 5000 }).catch(() => {});
      await follow(page, '#langs a[data-lang="ko"]');
      ok(new URL(page.url()).pathname + new URL(page.url()).hash === '/ko/dogs#maltese', `the menu keeps the #anchor: /dogs#maltese -> ${new URL(page.url()).pathname + new URL(page.url()).hash}`);
      await ctx.close();
    }
    {
      let r2 = await get(SITE + '/zh-Hant/'); const a1 = r2.status === 301 && r2.headers.get('location') === SITE + '/zh-hant/';
      r2 = await get(SITE + '/pt-BR/dogs'); const a2 = r2.status === 301 && r2.headers.get('location') === SITE + '/pt-br/dogs';
      r2 = await get(SITE + '/zh-Hans'); const a3 = r2.status === 301 && r2.headers.get('location') === SITE + '/zh-hans/';
      r2 = await get(SITE + '/pt-BR/map'); const a4 = r2.status === 301 && r2.headers.get('location') === SITE + '/pt-br/map';
      ok(a1 && a2 && a3 && a4, 'the BCP 47 spellings /zh-Hant/, /pt-BR/dogs, /zh-Hans, /pt-BR/map redirect (301) to the lowercase folders');
      r2 = await get(SITE + '/ja/nope'); const nf = await r2.text();
      ok(r2.status === 404 && /<title>[^<]+<\/title>/.test(nf) && /href="\/fonts\/i18n\/ja\.css\?v=[0-9a-f]{8}"/.test(nf), 'the localized 404 has a <title> and the language font (with its ?v= cache key)');
    }
    sec('320 px phones: no sideways scroll, no name sticking out of its card');
    {
      const ctx = await newCtx({ viewport: { width: 320, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const page = await ctx.newPage();
      const bad = [];
      for (const u of ['/', '/dogs', '/map', '/about', '/ja/', '/ja/dogs', '/ja/map', '/zh-hant/', '/zh-hant/about', '/ko/dogs', '/ko/map', '/th/', '/th/dogs', '/th/map', '/th/about', '/de/dogs', '/de/privacy', '/de/map', '/de/about', '/fr/about', '/xx/map', '/xx/about']) {
        await page.goto(base + u, { waitUntil: 'load' }); await page.evaluate(() => document.fonts.ready);
        const o = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth - innerWidth,
          out: [...document.querySelectorAll('.dognav a, .cards .dcard .dname, #sitenav a, article.place h3')].filter((e) => e.getClientRects().length && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent.trim()) }));
        await openNav(page);
        const np = navTapProblems(await navTaps(page)), s2 = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
        if (o.scroll > 0 || o.out.length || np.length || s2 > 0) bad.push(`${u}: scroll ${o.scroll}/${s2} ${o.out.join(', ')} ${np.slice(0, 2).join(', ')}`);
      }
      ok(!bad.length, '320 px: every page fits, every dog name, nav link and place name fits its box, the 4 nav links reachable ' + bad.join(' | '));
      await ctx.close();
    }

    sec('languages: typography, the playroom barks, the pseudo-locales');
    {
      const ctx = await newCtx(Object.assign({}, devices['iPhone 15'])); const page = await ctx.newPage();
      const st = async (u) => { await page.goto(base + u, { waitUntil: 'load' }); return page.evaluate(() => { const b = getComputedStyle(document.body), h = getComputedStyle(document.querySelector('main h2') || document.querySelector('h2') || document.body); return { lh: parseFloat(b.lineHeight) / parseFloat(b.fontSize), hlh: parseFloat(h.lineHeight) / parseFloat(h.fontSize), wb: b.wordBreak, lb: b.lineBreak, hy: b.hyphens || b.webkitHyphens, ow: b.overflowWrap, read: b.fontFamily, hand: h.fontFamily }; }); };
      const th = await st('/th/'), ko = await st('/ko/'), ja = await st('/ja/'), de = await st('/de/'), en = await st('/');
      ok(th.lh >= 1.7 && th.hlh >= 1.4 && /Thonburi|Noto Sans Thai/.test(th.read), `Thai: body line-height ${th.lh.toFixed(2)}, headings ${th.hlh.toFixed(2)}, Thai system fonts`);
      ok(ko.wb === 'keep-all' && /Apple SD Gothic Neo/.test(ko.read) && ja.lb === 'strict' && /Hiragino Maru Gothic/.test(ja.read) && /^"DD Local Title", "DD Local", Caveat, "Patrick Hand"/.test(ja.hand) && /^"DD Local", "Patrick Hand"/.test(ja.read) && ja.lh >= 1.6, 'Korean keep-all, Japanese strict line breaks and line-height 1.6+, the FONTS.md stacks: DD Local (Title) first, then Caveat / Patrick Hand for Latin, then the system CJK fonts');
      ok(de.hy === 'auto' && de.ow === 'anywhere' && en.hy !== 'auto' && en.ow !== 'anywhere', 'German hyphenates, every translated page can wrap anywhere, English is unchanged');
      const jm = await st('/ja/map'), tm = await st('/th/about');
      ok(jm.lb === 'strict' && jm.lh >= 1.6 && tm.lh >= 1.7 && /Thonburi|Noto Sans Thai/.test(tm.read), 'the same typography on the new pages (/ja/map, /th/about)');
      await page.goto(base + '/xx/', { waitUntil: 'load' }); await page.waitForTimeout(300);
      const px = await page.evaluate(() => ({ live: document.getElementById('scene').classList.contains('live'), bark: window.__dd && window.__dd.tr('bark.shiba', 'heh.'), toss: document.getElementById('toss').textContent, tag: document.querySelector('.tag').textContent }));
      ok(px.live && px.bark && px.bark !== 'heh.' && /[áéíöû]/.test(px.bark + px.toss + px.tag), `the playroom reads the page's barks (/xx/: "${px.bark}", "${px.toss}")`);
      await page.goto(base + '/', { waitUntil: 'load' });
      ok(await page.evaluate(() => !document.getElementById('dd-i18n') && window.__dd.tr('bark.shiba', 'heh.') === 'heh.'), 'English needs no bark table: the built-in lines');
      const len = (code) => I18N.fmt(code, 'home.intro').length;
      ok(len('en-XA') >= len('en') * 1.35 && /[^\x00-\x7F]/.test(I18N.fmt('en-XA', 'home.intro')) && !/ /.test(I18N.fmt('ja-XA', 'home.dogs.title')), `pseudo-locales: en-XA is ${Math.round(100 * len('en-XA') / len('en') - 100)}% longer with accents, ja-XA has CJK-like text without spaces`);
      if (shots) { fs.mkdirSync(shots, { recursive: true }); for (const u of ['/xx/', '/xx-cjk/dogs', '/xx/map', '/th/', '/ja/']) { await page.goto(base + u, { waitUntil: 'load' }); await page.screenshot({ path: path.join(shots, `site_i18n_${u.replace(/\W+/g, '_')}iPhone_15.png`) }); } }
      await ctx.close();
    }

    if (shots) {
      sec(`screenshots: every page in en, ja, fr at desktop 1280x800 and iPhone 15 -> ${shots}`);
      fs.mkdirSync(shots, { recursive: true });
      let n = 0;
      for (const [dev, opts] of [['desktop', { viewport: { width: 1280, height: 800 } }], ['iphone15', devices['iPhone 15']]]) {
        const ctx = await newCtx(Object.assign({}, opts, { locale: 'en-US' })); const page = await ctx.newPage();
        for (const code of ['en', 'ja', 'fr']) for (const pg of PG) {
          await page.goto(base + pageUrl(langOf(code), pg.path), { waitUntil: 'load' });
          await scrollThrough(page, 60, 40); await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await page.waitForLoadState('networkidle').catch(() => {}); await page.waitForTimeout(250);
          await page.screenshot({ path: path.join(shots, `site_${pg.id === 'index' ? 'home' : pg.id}_${code}_${dev}.png`), fullPage: dev === 'desktop' }); n++;
        }
        await ctx.close();
      }
      ok(n === 36, `${n} screenshots saved (6 pages x 3 languages x 2 devices)`);
    }
  } catch (e) { fails++; console.log('  CRASH', e && e.stack || e); }
  finally { await browser.close(); await mf.dispose(); if (fmf) await fmf.dispose(); if (imf) await imf.dispose(); }
  console.log(`\n${passes} passed, ${fails} failed`);
  if (!fails) console.log('ALL OK');
  process.exit(fails ? 1 : 0);
})();
