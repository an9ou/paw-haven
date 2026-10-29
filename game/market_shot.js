// v2.17.2 Spooky Stalls: screenshots of the Halloween Market scene (prefs.fmTest, Japan date pinned to 27 Oct 2026).
//   NODE_PATH=$(npm root -g) MK_DEV=desktop|phone MK_OUT=file.png node game/market_shot.js   (after node game/build.js + node game/harness.js merged)
const { run, sleep } = require('./test_lib'); const { devices } = require('playwright');
const dev = process.env.MK_DEV === 'phone' ? 'iPhone 15' : null;
run('market_shot', async (t) => {
  const { ev } = t;
  await t.newGame(Object.assign({ prefs: { fmTest: true, fmDate: '2026-10-27' }, ground: true }, dev ? { device: dev } : {}), { bond: { level: 8, pts: 1600 }, coins: 4000 });
  await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000); await ev(() => window.__paw.fm.sync());
  await ev(() => { const P = window.__paw; P.S.place = 'fmarket'; P.go('yard'); }); await t.calm(); await t.lu(); await sleep(1500);
  await ev(() => { const st = document.createElement('style'); st.textContent = '#toasts,.toast{display:none!important}'; document.head.appendChild(st); });
  await sleep(300); await t.p.screenshot({ path: process.env.MK_OUT });
}, { time: 'day', weather: 'sunny', season: 'autumn' });
