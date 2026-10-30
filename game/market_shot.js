// v2.17.2 Spooky Stalls: screenshots of the Halloween Market scene (prefs.fmTest, Japan date pinned to 27 Oct 2026).
//   NODE_PATH=$(npm root -g) MK_DEV=desktop|phone MK_OUT=file.png node game/market_shot.js   (after node game/build.js + node game/harness.js merged)
// Winter Market 2026 part 6: MK_DATE=2026-12-05 (another market), MK_TIME=night, MK_SHEET=decor|clothes|homes|toys|treats (tap that stall),
//   MK_LOOK=left|right (phone: pan the wide scene), MK_BOX=1 (outline the stall buttons, the sign and the place chip, to check overlaps)
const { run, sleep } = require('./test_lib'); const { devices } = require('playwright');
const dev = process.env.MK_DEV === 'phone' ? 'iPhone 15' : null;
run('market_shot', async (t) => {
  const { ev } = t;
  await t.newGame(Object.assign({ prefs: { fmTest: true, fmDate: process.env.MK_DATE || '2026-10-27' }, ground: true }, dev ? { device: dev } : {}), { bond: { level: 8, pts: 1600 }, coins: 4000 });
  await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000); await ev(() => window.__paw.fm.sync());
  await ev(() => { const P = window.__paw; P.S.place = 'fmarket'; P.go('yard'); }); await t.calm(); await t.lu(); await sleep(1500);
  if (process.env.MK_TIME) { await t.dev(async () => { await t.p.selectOption('#dvTime', process.env.MK_TIME); }); await sleep(900); }
  await ev(() => { const st = document.createElement('style'); st.textContent = '#toasts,.toast{display:none!important}'; document.head.appendChild(st); });
  if (process.env.MK_LOOK) {
    if (process.env.MK_LOOK === 'right') { await ev(() => { const b = document.getElementById('phPeek'); if (b) b.click(); }); await sleep(1200); } // the phone's look-right arrow (left is the home view)
  }
  if (process.env.MK_BOX) await ev(() => { document.querySelectorAll('#sceneG [data-fmstall] rect').forEach((r) => { r.setAttribute('stroke', '#E04A3C'); r.setAttribute('stroke-width', '3'); r.setAttribute('stroke-dasharray', '8 5'); }); });
  if (process.env.MK_SHEET) { await ev((c) => document.querySelector(`#sceneG [data-fmstall="${c}"]`).dispatchEvent(new MouseEvent('click', { bubbles: true })), process.env.MK_SHEET); await sleep(900); }
  await sleep(300); await t.p.screenshot({ path: process.env.MK_OUT });
}, { time: process.env.MK_TIME === 'night' ? 'night' : 'day', weather: process.env.MK_WX || 'sunny', season: process.env.MK_DATE && process.env.MK_DATE.slice(5, 7) === '12' ? 'winter' : 'autumn' });
