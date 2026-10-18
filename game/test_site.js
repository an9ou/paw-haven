// SITE (v2.8.2, v2 redesign 17 Oct 2026): the doodledoggo.app introduction site (site/, served by the Worker tools/cf_site.js builds), in Miniflare.
//   NODE_PATH=$(npm root -g) node game/test_site.js      (or: node game/run_tests.js site)
// Desktop 1280x800 and iPhone 15: the home page (the live playroom, the 21 dog cards, Dogs in Japan), /dogs (every dog's profile), reduced motion, /privacy, /reset (v2.9.2: a notice, the reset is in the game) against the real cloudflare/worker.js on a
// local D1 (game/cloud_mock.js), www -> apex, no request leaves the site (no tracking), phone minimums.
// PAW_SITE_SHOTS=<dir> also saves screenshots there. Node-only runner contract: prints ALL OK when every check passes.
process.removeAllListeners('warning');
const path = require('path'), fs = require('fs'), zlib = require('zlib'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const API = 'https://pawhaven-api.ansonyuen0108.workers.dev';
let fails = 0, passes = 0;
const BREEDS = JSON.parse(fs.readFileSync(path.join(ROOT, 'mods', 'genes.js'), 'utf8').match(/const BREEDS = (\[[^\]]*\])/)[1].replace(/'/g, '"'));
// the words rules (CLAUDE.md, the same patterns as test_copy_node.js): never "breed" as a verb, no stud, no selling dogs, no franchise names
const WORDS = [/\b(to breed|breed (them|your|her|him|my|our|dogs)|breeding (your|her|him|them|dogs)|bred (by|with|from))\b/i, /\bstuds?\b/i, /litter price/i,
  /\b(sell|sells|selling|sold)\b[^.!?]*\b(dog|dogs|pup|pups|puppy|puppies)\b|\b(dog|dogs|pup|pups|puppy|puppies)\b[^.!?]*\b(sell|sells|selling|sold)\b/i, /nintendo|pok[eé]mon|animal crossing/i];
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
    { // the dog count in the copy follows the breed list (v2.11.1: it said 14 long after 21 were in)
      const NUM = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen','twenty'];
      const word = (n) => n <= 20 ? NUM[n] : (['', '', 'twenty', 'thirty', 'forty'][Math.floor(n / 10)] + (n % 10 ? '-' + NUM[n % 10] : ''));
      const dogsPage = fs.readFileSync(path.join(ROOT, 'site', 'dogs.html'), 'utf8'), n = BREEDS.length;
      const said = (home + dogsPage).match(new RegExp('\\b(\\d+|' + NUM.slice(10).join('|') + '|(?:twenty|thirty|forty)(?:-\\w+)?) (wobbly|profiles)', 'gi')) || [];
      ok(said.length >= 4 && said.every((m) => { const w = m.split(' ')[0].toLowerCase(); return w === String(n) || w === word(n); }), `every dog count in the copy says ${n} (${said.join('; ')})`);
    }
    ok(home.includes('🖍️ Adopt a wobbly crayon pup to love') && /<a class="play" id="play" href="https:\/\/an9ou\.itch\.io\/doodle-doggo">PLAY AT ITCH\.IO<\/a>/.test(home), 'tagline and the PLAY AT ITCH.IO button');
    ok(/<h1 class="h1logo"><img class="logo" src="\/doodle-doggo-logo\.svg"/.test(home), 'the heading is the brand logo');
    r = await get('https://doodledoggo.app/dogs'); const dogsHtml = await r.text();
    ok(r.status === 200 && /<title>Meet the dogs/.test(dogsHtml), '/dogs: 200, the dogs page');
    const words = (h) => h.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const bad = WORDS.filter((re) => re.test(words(home)) || re.test(words(dogsHtml)));
    ok(!bad.length, 'the words rules: no "breed" as a verb, no selling dogs ' + bad.join(' '));
    ok(!/made in japan|(made|from|created|built) [^.]{0,30}\bin japan\b|from japan|japanese-made/i.test(words(home) + words(dogsHtml) + words(await (await get('https://doodledoggo.app/privacy')).text())), 'no claim that the game is made in Japan (a Japanese style, not an origin)');
    const js = await (await get('https://doodledoggo.app/js/site.js')).text();
    ok(!/https?:\/\//.test(js.replace(/^\s*\/\/.*$/mg, '')) && !/fetch\(|XMLHttpRequest|cookie|localStorage/.test(js), 'site.js asks no one for anything (no URLs, fetch, cookies or storage)');
    ok(/og:image" content="https:\/\/doodledoggo\.app\/logo-1200x630\.png/.test(home) && /rel="icon" href="\/favicon\.svg/.test(home) && /<title>Doodle Doggo/.test(home), 'title, favicon and og:image tags');
    ok(!/googleapis|gstatic|google-analytics|gtag|facebook|plausible|cdn\./i.test(home + dogsHtml + js + (await (await get('https://doodledoggo.app/style.css')).text())), 'no third-party fonts, scripts or trackers in the pages, the script or the CSS');
    for (const u of ['/favicon.svg', '/logo-1200x630.png', '/icon-180.png', '/site.webmanifest', '/doodle-doggo-logo.svg', '/fonts/caveat.woff2', '/img/screenshot-1-winter-yard.webp', '/img/noodle-happy.svg', '/privacy', '/reset', '/js/site.js', '/img/art/playroom.webp', '/img/art/ball.svg', '/img/art/fuji-spring.webp', '/img/art/fuji-summer.webp', '/img/art/fuji-autumn.webp', '/img/art/fuji-winter.webp', '/img/art/momiji.svg', '/img/art/sakura.svg', '/img/art/washi.svg']
      .concat(...BREEDS.map((k) => ['walk', 'jump', 'sit', 'happy', 'sniff', 'still', 'pup', 'sleep'].map((p) => `/img/art/dogs/${k}-${p}.svg`)))) {
      r = await get('https://doodledoggo.app' + u); ok(r.status === 200, `${u}: 200 ${r.headers.get('content-type')}`); await r.arrayBuffer();
    }
    r = await get('https://www.doodledoggo.app/privacy?x=1'); ok(r.status === 301 && r.headers.get('location') === 'https://doodledoggo.app/privacy?x=1', 'www.doodledoggo.app redirects to the apex, keeping the path');
    r = await get('https://doodledoggo.app/dogs.html'); ok(r.status === 301 && r.headers.get('location') === 'https://doodledoggo.app/dogs', '/dogs.html redirects to /dogs');
    r = await get('https://doodledoggo.app/js/site.js'); ok(/javascript/.test(r.headers.get('content-type')), 'site.js is served as JavaScript'); await r.text();
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
      const cards = await page.evaluate(() => [...document.querySelectorAll('.cards .dcard')].map((a) => [a.getAttribute('href'), a.querySelector('.dname').textContent, a.querySelector('.dimg').getAttribute('src')]));
      ok(cards.length === 21 && BREEDS.every((k, i) => cards[i] && cards[i][0] === '/dogs#' + k && cards[i][2] === `/img/art/dogs/${k}-still.svg`), 'one card per dog (all 21 in BREEDS order), each linking to its profile on /dogs'.replace('BREEDS_IN', ''));
      const soon = await page.evaluate(() => { const c = document.querySelector('.cards li:last-child .soon'); return c && { t: c.textContent, sils: c.querySelectorAll('.sil img').length, q: c.querySelectorAll('.sil b').length }; });
      ok(soon && /More dogs are coming!/.test(soon.t) && /Japanese Chin, Shih Tzu and Kai Ken are on their way/.test(soon.t) && soon.sils === 3 && soon.q === 3 && !/\b(20\d\d|soon|month|week)\b/i.test(soon.t.replace('coming', '')), 'the last card: More dogs are coming! with three "?" silhouettes (Japanese Chin, Shih Tzu, Kai Ken), no dates');
      const wall = await page.evaluate(() => ({ pic: !!document.querySelector('#stage .wallpic img'), text: [...document.querySelectorAll('#stage *:not(.bark)')].filter((e) => e.children.length === 0 && e.textContent.trim()).map((e) => e.textContent.trim()) }));
      ok(wall.pic && !wall.text.some((t) => /[\u3040-\u30FF\u4E00-\u9FFF]/.test(t)), 'the playroom wall has a framed Mt. Fuji picture, no kanji');
      const contact = await page.evaluate(() => { const a = document.querySelector('footer #contact'); const b = a && a.getBoundingClientRect(); return a && { text: a.textContent.trim(), href: a.getAttribute('href'), h: b.height, w: b.width, insta: !!document.querySelector('footer #insta'), privacy: !!document.querySelector('footer a[href="/privacy"]') }; });
      ok(contact && contact.text === 'CONTACT US' && contact.href === 'mailto:contact@doodledoggo.app' && contact.h >= 44 && contact.w >= 44 && contact.insta && contact.privacy, 'the footer: CONTACT US (mailto:contact@doodledoggo.app, 44 px) next to Instagram and Privacy');
      const jp = await page.evaluate(() => ({ notes: [...document.querySelectorAll('#japan .notes h3')].map((h) => h.textContent), trip: document.querySelector('#japan .trip').textContent, words: document.querySelectorAll('#japan .words dt').length, hanko: document.querySelectorAll('.hanko').length }));
      ok(jp.notes.length === 6 && /Hachiko/.test(jp.notes[0]) && /Shiba and Akita/.test(jp.notes[1]) && /café/.test(jp.notes[2]) && /Strollers/.test(jp.notes[3]) && /lead/.test(jp.notes[4]) && /shrines/.test(jp.notes[5]), 'Dogs in Japan: Hachiko, Shiba and Akita, dog cafés, strollers, leads in parks, shrines ' + jp.notes.join(' / '));
      ok(/Tokyo Trip/.test(jp.trip) && /Shibuya/.test(jp.trip) && /Asakusa/.test(jp.trip) && !/\b(20\d\d|January|February|March|April|May|June|July|August|September|October|November|December|spring|summer|autumn|winter|soon)\b/i.test(jp.trip), 'the Tokyo Trip teaser names Shibuya and Asakusa and promises no date');
      ok(jp.words >= 6 && jp.hanko >= 2, `small Japanese words with their meaning (${jp.words}) and hanko stamps (${jp.hanko})`);
      for (let y = 0; y < 30; y++) { const end = await page.evaluate(() => { scrollBy(0, innerHeight); return innerHeight + scrollY >= document.documentElement.scrollHeight - 2; }); await page.waitForTimeout(120); if (end) break; }
      await page.waitForLoadState('networkidle'); await page.waitForTimeout(400);
      ok(await page.evaluate(() => !window.__dd.running()), 'the playroom pauses when it scrolls out of view');
      await page.evaluate(() => scrollTo(0, 0));
      const info = await page.evaluate(() => ({
        imgs: [...document.querySelectorAll('img')].map((i) => [i.getAttribute('src'), i.complete && i.naturalWidth > 0]),
        feats: document.querySelectorAll('.feats li').length, shots: document.querySelectorAll('.shots img').length,
        fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family)
      }));
      ok(info.imgs.every((x) => x[1]), 'every picture loads (logo, playroom, dogs, Mt. Fuji, screenshots) ' + info.imgs.filter((x) => !x[1]).map((x) => x[0]).join(' '));
      ok(info.shots === 4 && info.feats === 6, `4 screenshots and 6 features (${info.shots}, ${info.feats})`);
      ok(info.fonts.some((f) => /Caveat/.test(f)) && info.fonts.some((f) => /Patrick Hand/.test(f)), 'the game\'s hand fonts load from the site itself');
      const a = await audit(page);
      ok(a.scroll <= 0, `no sideways scroll (${a.scroll})`); ok(!a.small.length, 'tap targets 44 px or more ' + a.small.join(', ')); ok(!a.tiny.length, 'text 15 px or more ' + a.tiny.slice(0, 4).join(', '));
      const play = await page.locator('#play').boundingBox(); ok(play && play.height >= 56, `a big Play free on itch.io button (${play && Math.round(play.height)} px tall)`);
      if (label === 'iPhone 15') ok(play && play.y + play.height < 844 * 1.6, 'the Play button is near the top on the phone');
      if (shots) { fs.mkdirSync(shots, { recursive: true }); await page.screenshot({ path: path.join(shots, `site_home_${tag}.png`), fullPage: label === 'iPhone 15' ? false : false }); }

      sec(`${label}: /dogs`);
      await page.goto(base + '/dogs#shiba', { waitUntil: 'networkidle' });
      const dg = await page.evaluate(() => ({ ids: [...document.querySelectorAll('article.prof')].map((a) => a.id), nav: [...document.querySelectorAll('.dognav a')].map((a) => a.getAttribute('href')),
        full: [...document.querySelectorAll('article.prof')].every((a) => a.querySelector('h2').textContent.trim() && a.querySelector('.bubble').textContent.length > 4 && a.querySelectorAll('.traits li').length === 4 && a.querySelectorAll('.loves li').length === 3 && a.querySelector('.pup') && a.querySelector('.playline') && /[\u30A0-\u30FF\u4E00-\u9FFF]/.test(a.querySelector('.jpline').textContent)),
        top: Math.round(document.getElementById('shiba').getBoundingClientRect().top), play: (document.querySelector('#play') || {}).href }));
      ok(dg.ids.join() === BREEDS.join(), 'a profile for every dog in BREEDS order, with the dog\'s key as its anchor (/dogs#shiba ...)');
      ok(await page.evaluate(() => { const x = document.querySelector('section.soonprof#soon'); return !!x && x.previousElementSibling.id === 'gsd' && /More dogs are coming!/.test(x.textContent) && /Japanese Chin, Shih Tzu and Kai Ken are on their way/.test(x.textContent) && x.querySelectorAll('.sil').length === 3 && document.querySelector('footer #contact').getAttribute('href') === 'mailto:contact@doodledoggo.app'; }), '/dogs ends with More dogs are coming! and has CONTACT US in the footer');
      ok(dg.full, 'every profile: name, line, 4 traits, 3 favourites, a puppy drawing, the playroom habit and the Japanese name');
      ok(dg.nav.join() === BREEDS.map((k) => '#' + k).join(), 'the picture menu links every profile');
      ok(Math.abs(dg.top) < 40, `/dogs#shiba opens at Mochi's profile (top ${dg.top})`);
      ok(dg.play === 'https://an9ou.itch.io/doodle-doggo', 'the dogs page has the itch.io button');
      for (let y = 0; y < 40; y++) { const end = await page.evaluate(() => { scrollBy(0, innerHeight); return innerHeight + scrollY >= document.documentElement.scrollHeight - 2; }); await page.waitForTimeout(80); if (end) break; }
      await page.waitForLoadState('networkidle'); await page.waitForTimeout(300);
      ok(await page.evaluate(() => [...document.images].every((i) => i.complete && i.naturalWidth > 0)), 'every dog, puppy and favourite drawing loads');
      const a4 = await audit(page); ok(a4.scroll <= 0 && !a4.small.length && !a4.tiny.length, 'dogs: phone minimums (no sideways scroll, 44 px taps, 15 px text) ' + a4.small.concat(a4.tiny).slice(0, 4).join(', '));
      if (shots) await page.screenshot({ path: path.join(shots, `site_dogs_${tag}.png`) });

      sec(`${label}: privacy`);
      await page.goto(base + '/privacy', { waitUntil: 'networkidle' });
      const pt = await page.textContent('main');
      ok(/Privacy policy/.test(pt) && /no ads and no tracking/i.test(pt) && /contact@doodledoggo\.app/.test(pt) && !/CONTACT EMAIL/.test(pt) && (await page.getAttribute('footer #contact', 'href')) === 'mailto:contact@doodledoggo.app' && /6-digit code/.test(pt) && !/password link/.test(pt), 'the privacy page: no ads, no tracking, emails only for a 6-digit reset code, the contact email filled in');
      const a2 = await audit(page); ok(a2.scroll <= 0 && !a2.small.length && !a2.tiny.length, 'privacy: phone minimums ' + a2.small.concat(a2.tiny).slice(0, 4).join(', '));

      sec(`${label}: the reset page (v2.9.2: only a notice, the reset happens in the game)`);
      await page.goto(base + '/reset?token=' + 'L'.repeat(43), { waitUntil: 'networkidle' }); // an old emailed link
      ok((await page.evaluate(() => location.search)) === '', 'an old link\'s code leaves the address bar at once');
      ok(/Forgot your password\?/.test(await page.textContent('h1')), 'title: Forgot your password?');
      const rt = await page.textContent('#rsMoved');
      ok(rt.includes('Password resets now happen in the game: tap Forgot your password? and use the code we email you.'), '"Password resets now happen in the game: tap Forgot your password? and use the code we email you."');
      ok((await page.getAttribute('#rsMoved a', 'href')) === 'https://an9ou.itch.io/doodle-doggo', 'with the itch.io link');
      ok(!(await page.locator('input, form').count()), 'no password form on the site any more');
      const a3 = await audit(page); ok(a3.scroll <= 0 && !a3.small.length && !a3.tiny.length, 'reset: phone minimums ' + a3.small.concat(a3.tiny).slice(0, 4).join(', '));
      if (shots) await page.screenshot({ path: path.join(shots, `site_reset_${tag}.png`) });
      ok(!srv.calls.some((c) => c.page === page), 'the page calls nothing');
      if (label === 'iPhone 15') {
        await page.goto('about:blank'); await page.goto(base + '/reset#access_token=sbat_old&type=recovery&expires_in=3600', { waitUntil: 'networkidle' });
        ok((await page.evaluate(() => location.hash)) === '' && await page.isVisible('#rsMoved'), 'an old Supabase link: it leaves the address bar, the same notice');
      }
      ok(!outside.length, 'no request leaves the site except the Worker (no tracking) ' + outside.slice(0, 3).join(' '));
      ok(!errs.length, 'no console errors ' + errs.slice(0, 2).join(' | '));
      await ctx.close();
    }
    sec('reduced motion (iPhone 15): a still playroom, no falling leaves');
    {
      const ctx = await browser.newContext(Object.assign({}, devices['iPhone 15'], { reducedMotion: 'reduce' })); const page = await ctx.newPage();
      const errs = []; page.on('pageerror', (e) => errs.push(e.message));
      await page.goto(base + '/', { waitUntil: 'networkidle' }); await page.waitForTimeout(500);
      const rm = await page.evaluate(() => ({ live: document.getElementById('scene').classList.contains('live'), dd: !!window.__dd, dogs: [...document.querySelectorAll('#scene .dd img')].map((i) => i.complete && i.naturalWidth > 0), petals: document.querySelectorAll('.petal').length, toss: document.getElementById('toss').hidden,
        anim: [...document.querySelectorAll('#scene .dd img')].every((i) => /-still\.svg$/.test(i.getAttribute('src'))) }));
      ok(!rm.live && !rm.dd && rm.dogs.length >= 3 && rm.dogs.every(Boolean) && rm.anim, 'the playroom stays still: the drawn dogs sit in place, one frame each, no animation');
      ok(!rm.petals && rm.toss, 'no falling leaves and no Toss button');
      ok(!errs.length, 'no errors ' + errs.join(' | '));
      await ctx.close();
    }
  } catch (e) { fails++; console.log('  CRASH', e && e.stack || e); }
  finally { await browser.close(); await mf.dispose(); }
  console.log(`\n${passes} passed, ${fails} failed`);
  if (!fails) console.log('ALL OK');
  process.exit(fails ? 1 : 0);
})();
