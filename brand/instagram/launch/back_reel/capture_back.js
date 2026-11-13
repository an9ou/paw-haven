// v2.25 "Glad you're back": clean captures of the game's own screens for the week-off Reel (docs/marketing/BACK_REEL.md).
// From a main build (game/test_merged.html: node game/build.js && node game/harness.js merged), with the test harness (game/test_lib.js):
// Noodle the dachshund is adopted, the What's new sheet is marked seen, a 7-day absence is set up (S.wbPend { h: 168 }) and the game's own
// "While you were out" page is opened (__paw.wb.open()), then Gerald's welcome-back letter (__paw.wb.letter(), opened in the mailbox).
// Only the sheet or the letter is captured (3x, transparent round corners); the game's buttons (the close cross, "Hello, Noodle!", Collect)
// and the dev button are hidden. Nothing in the game changes.
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/back_reel/capture_back.js <main checkout> <outdir>
// The game seeds the diary lines by the return and the dog, and today's gift by the date and the dog: the script adopts until today's gift is a
// treat and picks a return whose page starts with the sock line and has the gate line (SEED=<n> forces a return). facts.json lists what it got.
const path = require('path'), fs = require('fs');
const DEV = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'back_caps'); fs.mkdirSync(OUT, { recursive: true });
const { run } = require(path.join(DEV, 'game', 'test_lib'));
const CLEAN = '#devBtn,#toasts,.sheet-grab,#modal .xbtn,#modal .foot,.mb-get,.mb-got{display:none!important}'
  + 'body *:not(#modal):not(#modal *){visibility:hidden!important}#modal,#modal *{visibility:visible}'
  + '#modal,#stage,html,body{background:transparent!important;backdrop-filter:none!important;box-shadow:none}';
// a copy of the test page with one line added: the game's own treat-bag drawing (fwBagSVG, 47_firstweek.js) reachable from outside
const PAGE = path.join(DEV, 'game', 'test_back_reel.html');
{ const s = fs.readFileSync(path.join(DEV, 'game', 'test_merged.html'), 'utf8'), a = 'function fwBagSVG() {';
  if (s.split(a).length !== 2) throw new Error('art changed: ' + a); fs.writeFileSync(PAGE, s.replace(a, 'window.__fwBag = () => fwBagSVG(); ' + a)); }
run('back_capture', async (t) => {
  const { ev } = t, p = () => t.p;
  // the dog's id seeds the diary lines and today's gift: adopt again (up to 10 times) until today's gift is a treat (the Reel's gift beat)
  for (let i = 0; ; i++) {
    if (t.ctx) await t.ctx.close();
    await t.mk({ prefs: { wbTest: true } });
    await p().goto('file://' + PAGE); await p().waitForSelector('#tNew, #tContinue');
    await t.adopt({ head: '~Dachshund', sex: 'boy' });
    const g = await ev(() => window.__paw.wb.pick()); console.log('try', i, JSON.stringify(g));
    if (g.t === 'food' || i >= 9) break;
  }
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 85, happy: 85, energy: 90, clean: 90 }, dog: { name: 'Noodle' } });
  await t.calm(); await t.lu();
  // the What's new sheet is done; no page waits; today's gift not given yet
  await ev(() => { const S = window.__paw.S; S.newsSeen = '9.99'; S.wbPend = null; S.awayGiftISO = ''; S.backISO = ''; window.__paw.saveNow(); });
  await p().waitForTimeout(1500);
  await ev(() => { const m = document.getElementById('modal'); if (m && !m.hidden) { const x = m.querySelector('.x'); if (x) x.click(); } });
  // the diary lines: the game seeds them by the return; pick a return whose page has the sock line (wb.l1)
  const at = await ev((seed) => { if (seed) return +seed; for (let a = 1; a < 5000; a++) { const L = window.__paw.wb.lines({ at: a, h: 168 }); if (/found a sock/.test(L[0]) && L.some((l) => /sat by the gate/.test(l))) return a; } for (let a = 1; a < 5000; a++) if (/found a sock/.test(window.__paw.wb.lines({ at: a, h: 168 })[0])) return a; return 1; }, process.env.SEED || 0);
  // PAW_LANG=zh-Hans (the RedNote cut, owner 13 Nov 2026): the same dog, return and gift, with the game switched to the language and reloaded with
  // the save, so the diary page and the letter are the game's own Chinese screens (as friends_reel/capture_clean.js)
  if (process.env.PAW_LANG) {
    await ev((l) => { window.__paw.S.lang = l; window.__paw.saveNow(); const K = 'pawhaven_prefs_v1'; let pr = {}; try { pr = JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch (e) { pr = {}; } pr.lang = l; localStorage.setItem(K, JSON.stringify(pr)); }, process.env.PAW_LANG);
    await t.reloadKeepingSave(); await p().waitForSelector('#tContinue'); await p().click('#tContinue'); await t.untilMode('yard'); await t.calm();
    await ev(() => { const S = window.__paw.S; S.newsSeen = '9.99'; S.wbPend = null; S.awayGiftISO = ''; S.backISO = ''; });
    await p().waitForTimeout(1500);
    await ev(() => { const m = document.getElementById('modal'); if (m && !m.hidden) { const x = m.querySelector('.x'); if (x) x.click(); } });
    console.log('language', await ev(() => document.documentElement.lang));
  }
  const lines = await ev((a) => window.__paw.wb.lines({ at: a, h: 168 }), at);
  console.log('seed', at, JSON.stringify(lines));
  await p().addStyleTag({ content: CLEAN });
  const cdp = await t.ctx.newCDPSession(p());
  const shoot = async (sel, name) => {
    await p().waitForTimeout(700);
    const r = await ev((s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return { x: q.left, y: q.top, width: q.width, height: q.height }; }, sel);
    if (!r) throw new Error('no ' + sel);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    const s = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: Object.assign({}, r, { scale: 3 }) });
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(s.data, 'base64')); console.log('wrote', name, Math.round(r.width), 'x', Math.round(r.height));
    fs.writeFileSync(path.join(OUT, name + '.txt'), await ev((s) => document.querySelector(s).innerText, sel));
  };
  // 1. While you were out (a 7-day return: 3 lines, "You were away for 7 days", today's gift)
  const gift = await ev((a) => { const S = window.__paw.S; S.wbPend = { at: a, h: 168 }; window.__paw.wb.open(); return document.querySelector('.wb-gift') ? document.querySelector('.wb-gift').innerText : ''; }, at);
  console.log('gift', JSON.stringify(gift));
  await shoot('#modal .panel.wb-pop', 'diary_page');
  // also the gift art alone, as vector, for the gift beat
  fs.writeFileSync(path.join(OUT, 'gift_art.svg'), await ev(() => { const e = document.querySelector('.wb-gart svg'); return e ? e.outerHTML : ''; }));
  await ev(() => { const x = document.querySelector('#modal .x'); if (x) x.click(); else document.getElementById('modal').hidden = true; });
  // 2. Gerald's welcome-back letter ("We kept your spot warm": a treat bag and 100 coins)
  const id = await ev(() => { const m = window.__paw.wb.letter(); return (m && m.id) || (window.__paw.S.mail.find((x) => /^wb_back_/.test(x.id)) || {}).id; });
  await ev((id) => window.__paw.openMailbox(id), id);
  await shoot('#modal .mb-read article.letter', 'gerald_letter');
  fs.writeFileSync(path.join(OUT, 'treat_bag.svg'), await ev(() => window.__fwBag()));
  fs.writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify({ seed: at, lines, gift, letterId: id }, null, 1));
  try { fs.unlinkSync(PAGE); } catch (e) { /* gone */ }
}, { date: process.env.CAP_DATE || null, timeout: 180000 });
