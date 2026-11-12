// v2.26 "Yard visitors" (V226.md section 7): neighbourhood dogs visit the yard while you are away.
//   1. migration: an old save without S.visitors loads with the defaults, v 1, nothing dropped, no visitor on the first load
//   2. a visit after time away (a reload after 30 h away): visits recorded and met, one #visitorG.yv in the yard, its card, Pet once a day, Wave bye
//   3. gates: no toys = 1 visit a day and no rare one; snow -> Yuki, autumn -> Momiji, the Bubble Fountain -> Sir Waddles, an agility best -> Dash,
//      a paddle -> Rapunzel; never more than 3 a day, never the same dog twice in a day
//   4. the Visitors Book: 20 pages, met ones named with their visits, the rest silhouettes; the Journal tab and the Care card open it
//   5. gifts: 40 simulated days, at most one gift a JST day, coins at most 10 in any 7 days
//   6. the 4 toys: Barkitecture lists them at 300 / 600 / 900 / 1,500; placed, they draw their art in the yard
//   7. phone 360x640: the visitor in the yard, the card and the book fit (no sideways scroll, 44 px taps, two columns)
// node game/run_tests.js v226_visitors      (YV_SHOTS=<dir> also writes screenshots there)
const { run, URL } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path'); const fs = require('fs');
devices['Phone 360x640'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 } });
const SAVE = 'pawhaven_proto_v1', ON = { yvTest: true }, SHOTS = process.env.YV_SHOTS || '';
const TOYS = ['Tug Post', 'Puddle Pool', 'Play Tunnel', 'Bubble Fountain'];

run('v226_visitors', async (t) => {
  const { ok, sec, ev } = t;
  const shot = async (n) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.p.screenshot({ path: path.join(SHOTS, n + '.png') }); };
  const putOut = (names) => ev((ns) => { const P = window.__paw, S = P.S; ns.forEach((n) => { S.decor[n] = { got: '2026-11-01', out: true }; S.decor[n].at = P.ho.freeSpot(n); }); P.saveNow(); }, names);
  const closeAll = () => ev(() => { for (let i = 0; i < 4; i++) { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); } });
  const continueWith = async (save, o) => { const was = t.ctx; await t.mk(Object.assign({ storage: { [SAVE]: JSON.stringify(save) }, prefs: ON }, o || {})); await was.close(); await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu(); };

  sec('1. migration: an old save without S.visitors');
  await t.newGame({ prefs: ON });
  const base = await ev((k) => { window.__paw.saveNow(); const s = JSON.parse(localStorage.getItem(k)); delete s.visitors; return s; }, SAVE);
  ok(!('visitors' in base), 'the base save has no S.visitors');
  const t0 = await ev(() => Date.now());
  await continueWith(base);
  const m1 = await ev(() => { const S = window.__paw.S; return { keys: Object.keys(S), v: S.v, V: JSON.parse(JSON.stringify(S.visitors)), coins: S.coins, vis: !!document.querySelector('#visitorG') }; });
  const lost = Object.keys(base).filter((k) => !m1.keys.includes(k));
  ok(m1.v === 1 && !lost.length, 'v stays 1, no field dropped' + (lost.length ? ': ' + lost.join(' ') : ''));
  ok(m1.V && typeof m1.V.seed === 'string' && m1.V.seed.length >= 4 && m1.V.seen >= t0 && m1.V.since >= t0, 'S.visitors has a seed, and seen = since = now (no flood): ' + JSON.stringify({ seed: m1.V.seed, seen: m1.V.seen - t0 }));
  ok(JSON.stringify(m1.V.met) === '{}' && m1.V.q.length === 0 && m1.V.log.length === 0 && m1.V.gday === '' && m1.V.cday === 0 && m1.V.flowers === 0, 'met, q, log, gday, cday, flowers start empty');
  ok(!m1.vis && m1.coins === base.coins, 'no visitor on the first load, coins as they were');
  ok(await ev(() => window.__paw.yv.on() === true), 'yvOn() with prefs.yvTest');

  sec('2. a visit after time away (a reload 30 h later)');
  await putOut(['Tug Post', 'Puddle Pool']);
  ok((await ev(() => window.__paw.yv.pull())) === 4 && (await ev(() => window.__paw.yv.open())) === 3, 'two new toys out: pull 4, 3 slots a day');
  const away = await ev((k) => { const P = window.__paw; P.S.visitors.seen = Date.now() - 30 * 3600e3; P.saveNow(); const s = JSON.parse(localStorage.getItem(k)); return s; }, SAVE);
  await continueWith(away);
  const m2 = await ev(() => { const V = window.__paw.S.visitors; return { met: Object.keys(V.met), q: V.q, log: V.log, seen: V.seen, now: Date.now() }; });
  ok(m2.log.length >= 2 && m2.log.length <= 6, '30 h away: 2-6 visits (3 slots a day): ' + m2.log.map((e) => e.id).join(' '));
  ok(m2.met.length >= 1 && m2.log.every((e) => m2.met.includes(e.id)), 'every visitor is now met');
  ok(m2.q.length >= 1 && m2.q.length <= 3, 'one to three wait to be shown: ' + m2.q.length);
  ok(Math.abs(m2.now - m2.seen) < 60e3, 'seen moved to now');
  ok(m2.log.every((e) => !e.toy || TOYS.concat(['Sandbox']).includes(e.toy)), 'each played with a toy that is out (or none)');
  const days = {}; m2.log.forEach((e) => { const d = new Date(e.t + 9 * 3600e3).toISOString().slice(0, 10); (days[d] = days[d] || []).push(e.id); });
  ok(Object.values(days).every((a) => a.length <= 3 && new Set(a).size === a.length), 'at most 3 a JST day, no dog twice in a day: ' + JSON.stringify(days));
  ok(await t.until(() => !!document.querySelector('#visitorG.yv'), null, 5000), 'a visitor (#visitorG.yv) is in the yard');
  const last = m2.q[m2.q.length - 1].id;
  ok((await ev(() => document.querySelectorAll('#visitorG').length)) === 1 && (await ev(() => document.querySelector('#visitorG').dataset.yv)) === last, 'one at a time: the latest one (' + last + ')');
  await shot('desk_yard_visitor');
  await t.p.click('#visitorG.yv', { force: true });
  ok(await t.until(() => !!document.querySelector('#modal .yv-pop #yvPet'), null, 4000), 'tapping it opens its card with Pet');
  await shot('desk_card');
  const h0 = await ev(() => window.__paw.S.stats.happy);
  await t.p.click('#yvPet');
  ok(await t.until((h) => window.__paw.S.stats.happy > h || window.__paw.S.stats.happy >= 100, h0, 3000), 'Pet: +Happiness');
  ok(await ev((id) => !!window.__paw.S.visitors.met[id].pet, last), 'the pet is remembered for today');
  await ev(() => window.__paw.yv.card()); await t.until(() => !!document.querySelector('#yvPet'), null, 3000);
  ok(await ev(() => document.querySelector('#yvPet').getAttribute('aria-disabled') === 'true'), 'Pet again the same day: Petted today');
  const qn = m2.q.length; await t.p.click('#yvBye');
  ok(await t.until((n) => window.__paw.S.visitors.q.length === n - 1, qn, 3000), 'Wave bye: it goes home (queue ' + qn + ' -> ' + (qn - 1) + ')');
  ok(qn > 1 ? await t.until(() => !!document.querySelector('#visitorG.yv'), null, 3000) : !(await ev(() => !!document.querySelector('#visitorG.yv'))), qn > 1 ? 'the next visitor steps in' : 'nobody else waiting: the spot is empty');
  await closeAll();

  sec('3. gates: toys, season, weather and places');
  const plan = (n, o) => ev(({ n, o }) => {
    const Y = window.__paw.yv, out = []; const d0 = Date.parse('2026-11-12T00:00:00+09:00');
    for (let i = 0; i < n; i++) { const day = new Date(d0 + i * 86400e3 + 9 * 3600e3).toISOString().slice(0, 10); out.push(Y.plan(day).map((p) => p.id)); }
    return out;
  }, { n, o });
  const setToys = (on) => ev((on) => { const S = window.__paw.S; Object.keys(S.decor).forEach((n) => { S.decor[n].out = on.includes(n); }); on.forEach((n) => { if (!S.decor[n]) S.decor[n] = { got: '2026-11-01', out: true }; }); }, on);
  const RARE = await ev(() => window.__paw.yv.dogs.filter((v) => v.rare).map((v) => v.id));
  ok(RARE.length === 8 && (await ev(() => window.__paw.yv.dogs.length)) === 20, '20 visitors, 8 rare');
  await setToys([]);
  let P = await plan(40);
  ok(P.every((d) => d.length === 1), 'no toys out: one visit a day');
  ok(!P.flat().some((id) => RARE.includes(id)), 'summer, cloudy, no toys, no agility: no rare visitor in 40 days');
  await setToys(['Bubble Fountain']);
  P = await plan(40);
  ok(P.every((d) => d.length === 2), 'the Bubble Fountain (pull 2): two visits a day');
  ok(P.flat().includes('waddles') && !P.flat().some((id) => RARE.filter((r) => r !== 'waddles').includes(id)), 'the Bubble Fountain brings Sir Waddles (and no other rare one)');
  await setToys(TOYS.concat(['Sandbox', 'Hammock']));
  P = await plan(40);
  ok(P.every((d) => d.length === 3 && new Set(d).size === 3), 'everything out: three a day, never the same dog twice');
  ok(P.flat().includes('waddles') && !P.flat().includes('puddles') && !P.flat().includes('nanuk') && !P.flat().includes('yuki'), 'puddles, nanuk and yuki still need their weather or season');
  await ev(() => window.__paw.yv.env('weather', 'snow')); P = await plan(40);
  ok(P.flat().includes('yuki'), 'snow: Yuki comes');
  await ev(() => window.__paw.yv.env('weather', 'rain')); P = await plan(40);
  ok(P.flat().includes('puddles') && !P.flat().includes('yuki'), 'rain with the Puddle Pool: Puddles comes, Yuki does not');
  await ev(() => window.__paw.yv.env('weather', 'cloudy')); await ev(() => window.__paw.yv.env('season', 'autumn')); P = await plan(40);
  ok(P.flat().includes('momiji') && !P.flat().includes('nanuk'), 'autumn: Momiji comes, Nanuk does not');
  await ev(() => window.__paw.yv.env('season', 'winter')); P = await plan(40);
  ok(P.flat().includes('nanuk') && !P.flat().includes('momiji'), 'winter with the Tug Post: Nanuk comes');
  await ev(() => window.__paw.yv.env('season', 'summer'));
  ok(!(await ev(() => window.__paw.yv.can('dash'))) && !(await ev(() => window.__paw.yv.can('rapunzel'))), 'Dash and Rapunzel wait for the Training Ground and the Splash Pool');
  await ev(() => { const S = window.__paw.S; S.ag.best[S.dog.id] = 2; S.pool.day[S.dog.id] = '2026-11-10'; });
  ok(await ev(() => window.__paw.yv.can('dash')) && await ev(() => window.__paw.yv.can('rapunzel')), 'after an agility run and a paddle: Dash and Rapunzel can come');
  await ev(() => window.__paw.yv.env('time', 'night'));
  ok(await ev(() => window.__paw.yv.can('zoom')), 'evening with the Play Tunnel: Zoom can come');
  await ev(() => window.__paw.yv.env('time', 'day'));
  ok(!(await ev(() => window.__paw.yv.can('zoom', new Date('2026-11-12T10:00:00').getTime()))), 'Zoom never in the daytime');
  const det = await ev(() => JSON.stringify(window.__paw.yv.plan('2026-12-01')) === JSON.stringify(window.__paw.yv.plan('2026-12-01')));
  ok(det, 'a day\'s plan is the same every time it is asked (seeded)');

  sec('4. the Visitors Book');
  await ev(() => window.__paw.yv.book());
  ok(await t.until(() => document.querySelectorAll('#modal .yv-page').length === 20, null, 3000), 'the book has 20 pages');
  const bk = await ev(() => { const V = window.__paw.S.visitors; return { met: Object.keys(V.met).length, btn: document.querySelectorAll('#modal button.yv-page').length, sil: document.querySelectorAll('#modal .yv-page.unk .yv-sil svg').length, head: document.querySelector('#modal .yv-head').textContent, art: !!document.querySelector('#modal .yv-bookart svg') }; });
  ok(bk.btn === bk.met && bk.sil === 20 - bk.met, 'met visitors have their page (' + bk.btn + '), the rest a pencil silhouette (' + bk.sil + ')');
  ok(new RegExp('Met ' + bk.met + ' of 20').test(bk.head) && bk.art, 'the head says "Met ' + bk.met + ' of 20" with the book art');
  await shot('desk_book');
  await t.p.click('#modal button.yv-page');
  ok(await t.until(() => /visit/.test((document.querySelector('#modal .yv-pop') || {}).textContent || '') && !!document.querySelector('#yvBack'), null, 3000), 'a page: name, visits, Back to the book');
  await closeAll();
  await ev(() => window.__paw.yv.journal());
  ok(await t.until(() => !!document.querySelector('#modal.journal, #modal .journal, .j-visitors') && document.querySelectorAll('.j-visitors .yv-page').length === 20, null, 3000), 'the Journal has a Visitors tab with the book');
  if (await ev(() => !!document.querySelector('.j-visitors button.yv-page'))) { await t.p.click('.j-visitors button.yv-page'); ok(await t.until(() => !!document.querySelector('#yvBack'), null, 3000), 'a Journal page opens the visitor\'s page'); }
  await closeAll();
  await ev(() => window.__paw.yv.care());
  ok(await t.until(() => !!document.querySelector('[data-yvbook]'), null, 3000), 'the Care tray has a Visitors card');
  await t.p.click('[data-yvbook]');
  ok(await t.until(() => document.querySelectorAll('#modal .yv-page').length === 20, null, 3000), 'the Care card opens the book');
  await closeAll();

  sec('5. gifts are capped');
  const g = await ev(() => {
    const P = window.__paw, S = P.S, V = S.visitors, Y = P.yv; V.since = 1; V.gday = ''; V.cday = 0; const coins0 = S.coins, out = [];
    const d0 = Date.parse('2026-12-01T00:00:00+09:00');
    for (let i = 0; i < 40; i++) { const now = d0 + i * 86400e3 + 23.5 * 3600e3; V.seen = now - 23.4 * 3600e3; const c0 = S.coins; const got = Y.catchUp(now); out.push({ i, n: got.length, g: got.filter((e) => e.g).map((e) => e.g), c: S.coins - c0 }); }
    return { out, coins: S.coins - coins0 };
  });
  ok(g.out.every((d) => d.g.length <= 1), 'at most one gift a JST day over 40 days');
  ok(g.out.every((d) => d.n <= 3), 'at most 3 visits a day');
  const gifts = g.out.flatMap((d) => d.g);
  ok(gifts.length >= 5, 'gifts do come (' + gifts.length + ' in 40 days: ' + [...new Set(gifts)].join(', ') + ')');
  let worst = 0; for (let i = 0; i < 40; i++) worst = Math.max(worst, g.out.slice(i, i + 7).reduce((a, d) => a + d.c, 0));
  ok(worst <= 10 && g.coins <= 60, 'coins at most 10 in any 7 days (worst ' + worst + ', total ' + g.coins + ')');

  sec('6. the four toys at Barkitecture');
  const sp = await ev((T) => T.map((n) => [n, window.__paw.home.specs[n].price, window.__paw.home.specs[n].room, !!window.__paw.home.specs[n].v27]), TOYS);
  ok(JSON.stringify(sp.map((x) => x[1])) === '[300,600,900,1500]' && sp.every((x) => x[2] === 'yard' && x[3]), 'prices 300 / 600 / 900 / 1,500, yard decorations: ' + JSON.stringify(sp));
  const shopTxt = await ev(() => { window.__paw.shop.shop('builder'); const b = document.querySelector('[data-btab="decor"],[data-tab="decor"]'); if (b) b.click(); return (document.querySelector('#modal .panel') || {}).textContent || ''; });
  ok(TOYS.every((n) => shopTxt.includes(n)), 'Barkitecture Decor lists all four');
  await closeAll();
  await setToys(TOYS); await ev((T) => { const P = window.__paw; T.forEach((n) => { P.S.decor[n].at = P.ho.freeSpot(n); }); }, TOYS);
  await t.home(); await ev(() => window.__paw.home.redraw());
  const drawn = await ev((T) => T.map((n) => { const e = document.querySelector(`#decorG [data-decor="${n}"]`); return !!e && !!e.querySelector('svg path') && !/>\?</.test(e.innerHTML); }), TOYS);
  ok(drawn.every(Boolean), 'placed, all four draw their own art in the yard: ' + drawn);
  const items = await ev((T) => T.map((n) => { const s = window.PawArt.item(n); return /<path/.test(s) && !/>\?</.test(s); }), TOYS);
  ok(items.every(Boolean), 'all four have item cards');
  await ev(() => { const P = window.__paw; P.S.visitors.q = P.S.visitors.log.slice(-1); P.yv.draw(); });
  await shot('desk_yard_toys');
  ok(!t.errors.length, 'no console errors so far' + (t.errors.length ? ': ' + t.errors.slice(0, 3).join(' | ') : ''));

  sec('6b. the toys wait for the v2.26 date (code review 1)');
  { // the real gate: no test pref, navigator.webdriver off, the page clock before and after NEWS_V226.date
    const date = await ev(() => window.__paw.yv.date);
    const probe = () => ev((T) => {
      const P = window.__paw, S = P.S, own = Object.assign({}, S.decor);
      Object.keys(P.home.specs).forEach((n) => { const d = P.home.specs[n]; if (d.v27 && d.kind === 'decor' && !T.includes(n)) S.decor[n] = S.decor[n] || { got: '2026-11-01', out: false }; }); T.forEach((n) => { delete S.decor[n]; });
      P.shop.shop('builder'); const b = document.querySelector('[data-btab="decor"],[data-tab="decor"]'); if (b) b.click();
      const shop = (document.querySelector('#modal .panel') || {}).textContent || ''; const x = document.querySelector('#modal .panel .x'); if (x) x.click();
      const rows = P.lv.rows().filter((r) => r.kind === 'item').map((r) => r.id), pick = P.msn.pick(); S.decor = own;
      return { on: P.yv.on(), shop: T.filter((n) => shop.includes(n)), lv: T.filter((n) => rows.includes(n)), pick };
    }, TOYS);
    await ev(() => { window.__paw.yv.test(false); Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true }); });
    await t.p.clock.setFixedTime(new Date(Date.parse(date + 'T12:00:00+09:00') - 3 * 86400e3));
    const pre = await probe();
    ok(!pre.on && !pre.shop.length && !pre.lv.length && !TOYS.includes(pre.pick), 'before ' + date + ': no toy at Barkitecture, in the level list or as the notebook gift: ' + JSON.stringify(pre));
    await t.p.clock.setFixedTime(new Date(Date.parse(date + 'T12:00:00+09:00') + 86400e3));
    const post = await probe();
    ok(post.on && post.shop.length === 4 && post.lv.length === 4 && post.pick === 'Tug Post', 'from ' + date + ': all four are sold, in the level list and the notebook gift: ' + JSON.stringify(post));
    await ev(() => { delete navigator.webdriver; window.__paw.yv.test(true); });
  }

  sec('7. phone 360x640');
  { const was = t.ctx; await t.newGame({ device: 'Phone 360x640', prefs: ON }); await was.close(); }
  await putOut(['Tug Post', 'Puddle Pool']);
  await ev(() => { const P = window.__paw; P.S.visitors.seen = Date.now() - 30 * 3600e3; P.yv.back(); });
  await t.home();
  ok(await t.until(() => !!document.querySelector('#visitorG.yv'), null, 5000), 'the visitor is in the phone yard');
  const vb = await ev(() => { const r = document.querySelector('#visitorG.yv > rect').getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); });
  ok(vb[2] >= 44 && vb[3] >= 44 && vb[0] + vb[2] > 0 && vb[0] < 360, 'its tap box is at least 44 px and on screen: ' + vb);
  const clr = await ev(() => { const q = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }, v = q('#visitorG.yv > rect'), m = q('#sceneG [data-hot="mailbox"]') || q('#mailboxG'), tg = q('#visitorG .vtag'), tx = document.querySelector('#visitorG .vtag text').getBoundingClientRect().height;
    return { in: v[0] >= 0 && v[2] <= innerWidth && tg[0] >= 0 && tg[2] <= innerWidth, mail: !!m && !(v[0] < m[2] && m[0] < v[2] && v[1] < m[3] && m[1] < v[3]), tag: Math.round(tx) }; });
  ok(clr.in && clr.mail, 'its own spot: wholly on screen at 360 (tap box and name tag) and clear of the mailbox (art 3, phone 4): ' + JSON.stringify(clr));
  ok(clr.tag >= 12, 'the name tag text is at least 12 px at 360 (' + clr.tag + ')');
  await shot('phone_yard_visitor');
  await t.p.tap('#visitorG.yv > rect', { force: true });
  ok(await t.until(() => !!document.querySelector('#yvPet'), null, 4000), 'tap: the card opens');
  const fit = async (label) => {
    const f = await ev(() => { const btns = [...document.querySelectorAll('#modal .panel button')].filter((b) => b.offsetParent).map((b) => Math.round(b.getBoundingClientRect().height)); const pn = document.querySelector('#modal .panel').getBoundingClientRect(); return { sw: document.documentElement.scrollWidth, pw: Math.round(pn.width), pl: Math.round(pn.left), small: btns.filter((h) => h < 44).length, n: btns.length }; });
    ok(f.sw <= 360 && f.pl >= 0 && f.pl + f.pw <= 360, label + ': fits the 360 px screen, no sideways scroll: ' + JSON.stringify(f));
    ok(f.small === 0, label + ': every button at least 44 px tall (' + f.n + ' buttons)');
  };
  await fit('the visitor card'); await shot('phone_card');
  await t.p.tap('#yvBookB');
  ok(await t.until(() => document.querySelectorAll('#modal .yv-page').length === 20, null, 3000), 'the book opens from the card');
  await fit('the book');
  const cols = await ev(() => getComputedStyle(document.querySelector('#modal .yv-grid')).gridTemplateColumns.split(' ').length);
  ok(cols === 2, 'the book has two columns on the phone (' + cols + ')');
  await shot('phone_book');
  ok(!t.errors.length, 'no console errors' + (t.errors.length ? ': ' + t.errors.slice(0, 3).join(' | ') : ''));
});
