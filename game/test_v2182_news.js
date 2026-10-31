// v2.18.2 "What's new in town" (game/src/49c_news.js): shows once per news id on a calm yard, not after a reload, again for a newer id,
// never for a brand-new save, never on top of the first-day guide or the calendar; fits at every size; Settings and the phone menu open it.
//   node game/run_tests.js v2182_news          V2182_SHOTS=1 also writes docs/release/v2.18.2/news_<size>_<lang>.png
const { run } = require('./test_lib'); const path = require('path'); const fs = require('fs');
const SHOTS = process.env.V2182_SHOTS ? path.join(__dirname, '..', 'docs', 'release', 'v2.18.2') : null;
run('v2182_news', async (t) => {
  const { ok, sec, ev } = t;
  const shown = () => ev(() => !!document.querySelector('#modal:not([hidden]) .nw-pop'));
  const waitNews = (ms) => t.until(() => !!document.querySelector('#modal:not([hidden]) .nw-pop'), null, ms || 9000);
  const noNews = async (ms) => { const w0 = Date.now(); while (Date.now() - w0 < ms) { if (await shown()) return false; await t.sleep(250); } return true; };
  const closeNews = async () => { await t.p.click('#nwOk'); await t.modalGone(); };
  const reload = async () => { await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); };
  // every modal change: was the modal hidden right before the news sheet opened?
  const watch = () => ev(() => { const m = document.getElementById('modal'); window.__nwLog = []; let was = m.hidden ? 'hidden' : (m.querySelector('.panel') || {}).className || 'open';
    new MutationObserver(() => { const now = m.hidden ? 'hidden' : (m.querySelector('.panel') || {}).className || 'open'; if (now !== was) { window.__nwLog.push([was, now]); was = now; } }).observe(m, { childList: true, attributes: true, attributeFilter: ['hidden'] }); });

  sec('1. a brand-new save skips the news');
  await t.newGame({ prefs: { nwTest: true } });
  ok(await t.until(() => !!(window.__paw && window.__paw.nw), null, 5000), 'the hook is there');
  const latest = await ev(() => window.__paw.nw.latest());
  ok(latest === '2.18.4' && (await ev(() => window.__paw.S.newsSeen)) === latest, 'adoption sets S.newsSeen to the newest id: ' + latest);
  await t.home('yard'); ok(await noNews(5000), 'no news sheet on a new save');

  sec('2. an old save: S.newsSeen added by migrate(), the sheet shows once, not again after a reload');
  ok(await ev(() => { const x = window.__paw.nw.migrate({ v: 1 }); return x.newsSeen === '' && x.v === 1; }), 'migrate gives an old save newsSeen "" (additive, v stays 1)');
  await ev(() => { const P = window.__paw; P.S.newsSeen = ''; P.saveNow(); });
  await reload(); await watch();
  ok(await waitNews(9000), 'the news sheet opens once the yard is calm');
  ok(await ev(() => document.querySelectorAll('#modal .nw-list li').length === 5 && !!document.querySelector('#modal .nw-pic svg') && [...document.querySelectorAll('#modal .nw-ic')].filter((e) => e.querySelector('svg')).length === 5), 'five lines with crayon icons (an item card may nest an svg), and the picture');
  ok(await ev(() => window.__paw.S.newsSeen === window.__paw.nw.latest() && JSON.parse(localStorage.getItem('pawhaven_proto_v1')).newsSeen === window.__paw.nw.latest()), 'S.newsSeen is saved when it opens');
  await t.p.click('#nwAll'); ok(await t.until(() => !!document.querySelector('#modal .nw-all .nw-page'), null, 3000), '"See all updates" lists the entries');
  await closeNews(); ok(await noNews(5000), 'it does not open again');
  await reload(); ok(await noNews(6000), 'nor after a reload');

  sec('3. a newer id shows again');
  await ev(() => window.__paw.nw.add({ id: '9.9.9' }));
  ok(await waitNews(9000), 'a new entry: the sheet opens again');
  ok(await ev(() => /Test news/.test(document.querySelector('#modal .nw-page h3').textContent)), 'with the newest entry');
  await closeNews(); ok(await ev(() => window.__paw.S.newsSeen === '9.9.9'), 'and remembers it');
  await ev(() => window.__paw.nw.drop());

  sec('4. never on top of the first-day guide or the calendar\'s daily page; it waits its turn');
  await ev(() => { const P = window.__paw, S = P.S; S.newsSeen = ''; P.fw.test(true); S.fw.shown = ''; S.fw.morning = S.fw.morning || '2026-10-30'; S.guide = { step: 0, fw: 1 }; P.saveNow(); window.__gd.start(); });
  await watch();
  ok(await t.until(() => { const c = document.querySelector('#gdLayer .gd-card'); return !!c && !c.hidden; }, null, 6000), 'the first-day guide is up');
  ok(await noNews(5000), 'no news sheet during the guide');
  await ev(() => document.querySelector('#gdLayer .gd-skip').click());
  for (let i = 0; i < 6 && !(await shown()); i++) { await t.sleep(1500); if (!(await shown()) && (await ev(() => !document.getElementById('modal').hidden))) await t.closeX(); }
  ok(await waitNews(12000), 'after the guide (and the calendar), the news sheet comes');
  const log = await ev(() => window.__nwLog);
  const at = log.findIndex((q) => /nw-pop/.test(q[1]));
  ok(at >= 0 && log[at][0] === 'hidden', 'it opened on an empty screen, never replacing another sheet: ' + log.map((q) => q.join('>')).join(' | ').slice(0, 300));
  ok(log.some((q) => /fw-calpop/.test(q[1]) && !/nw-pop/.test(q[1])) ? log.findIndex((q) => /fw-calpop/.test(q[1]) && !/nw-pop/.test(q[1])) < at : true, 'the calendar\'s daily page went first');
  await closeNews(); await ev(() => window.__paw.fw.test(false));

  sec('5. Settings has a "What\'s new" button');
  await ev(() => window.__paw.go('yard')); await t.calm();
  await t.p.click('#gearBtn');
  ok(await t.until(() => !!document.getElementById('setNews'), null, 3000), 'the button is in Settings');
  await t.p.click('#setNews'); ok(await waitNews(3000), 'and opens the sheet'); await closeNews();
  await t.ctx.close();

  sec('6. phone: the "..." menu opens it; it fits at every size (393x852, 360x640, the 684 and 390 px site boxes, desktop) in en and zh-Hant');
  const sizes = [['iphone15', 393, 852], ['small', 360, 640], ['box684', 684, 716], ['box390', 390, 700], ['desktop', 1280, 720]];
  for (const lang of ['en', 'zh-Hant']) {
    await t.newGame({ prefs: { nwTest: true }, device: 'iPhone 15', lang });
    if (lang === 'en') {
      await t.p.click('#moreBtn'); ok(await t.until(() => !!document.getElementById('mmNews'), null, 3000), 'phone menu: "What\'s new" is there');
      await t.p.click('#mmNews'); ok(await waitNews(3000), 'and opens the sheet'); await closeNews();
    }
    for (const [name, w, h] of sizes) {
      await t.p.setViewportSize({ width: w, height: h }); await t.sleep(400);
      await ev(() => { const el = document.getElementById('toasts'); if (el) el.innerHTML = ''; window.__paw.nw.open(); }); await waitNews(3000); await t.sleep(300);
      const L = await ev(() => {
        const vw = document.documentElement.clientWidth, vh = window.innerHeight, p = document.querySelector('#modal .panel').getBoundingClientRect(), okb = document.getElementById('nwOk').getBoundingClientRect(), all = document.getElementById('nwAll').getBoundingClientRect();
        const lis = [...document.querySelectorAll('#modal .nw-list li')], over = lis.filter((li) => li.scrollWidth > li.clientWidth + 1).length;
        const tx = Math.min(...[...document.querySelectorAll('#modal .nw-tx')].map((e) => parseFloat(getComputedStyle(e).fontSize)));
        return { phone: document.documentElement.dataset.layout === 'phone', in: p.left >= -1 && p.right <= vw + 1 && p.top >= -1 && p.bottom <= vh + 1, side: document.documentElement.scrollWidth <= vw + 1, ok: [okb.width, okb.height], all: [all.width, all.height], over, tx, okIn: okb.bottom <= vh + 1 };
      });
      ok(L.in && L.side && L.ok[1] >= 44 && L.ok[0] >= 44 && L.all[1] >= 44 && L.over === 0 && L.tx >= 15 && L.okIn, `${lang} ${name} (${L.phone ? 'phone' : 'desktop'} layout): the sheet fits, OK! ${L.ok.map(Math.round).join('x')}, See all ${L.all.map(Math.round).join('x')}, text ${L.tx} px, no line overflows`);
      if (SHOTS && ['iphone15', 'desktop'].includes(name)) { fs.mkdirSync(SHOTS, { recursive: true }); await t.p.screenshot({ path: path.join(SHOTS, `news_${name === 'iphone15' ? 'phone' : 'desktop'}_${lang}.png`) }); }
      await closeNews();
    }
    await t.ctx.close();
  }
}, { timeout: 400000 });
