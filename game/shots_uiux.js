// UI/UX phone review shots (not a test suite): node game/shots_uiux.js <outdir> [only-regex]
// iPhone 13 (390x664 profile) and 360x740, day and night, date 2026-10-20 (Halloween window, autumn), hwTest on.
const { run } = require('./test_lib'); const path = require('path'); const fs = require('fs');
const OUT = path.resolve(process.argv[2] || 'shots_uiux'); const ONLY = process.argv[3] ? new RegExp(process.argv[3]) : null;
fs.mkdirSync(OUT, { recursive: true });
const SIZES = [['ip13', null], ['360', [360, 740]]];
(async () => {
  for (const [dn, vp] of SIZES) for (const time of ['day', 'night']) {
    await run(`shots_${dn}_${time}`, async (t) => {
      const p0 = await t.newGame({ sex: 'girl', device: 'iPhone 13' }, { bond: { level: 10, pts: 3300 }, coins: 3000, house: 'Royal Castle Kennel', stats: { hunger: 80, happy: 80, energy: 90, clean: 90 } });
      void p0; const p = t.p; if (vp) await p.setViewportSize({ width: vp[0], height: vp[1] });
      const shot = async (n) => { if (ONLY && !ONLY.test(n)) return; await t.sleep(450); await p.screenshot({ path: path.join(OUT, `${n}_${dn}_${time}.png`) }); console.log('  shot ' + n); };
      const step = async (n, fn) => { if (ONLY && !ONLY.test(n)) return; try { await fn(); } catch (e) { console.log('  SKIP ' + n + ': ' + e.message.split('\n')[0]); } try { await t.ev(() => { const m = document.getElementById('modal'); if (!m.hidden) m.querySelector('.x')?.click(); }); await p.keyboard.press('Escape'); } catch (e) { } };
      const ev = t.ev;
      await step('yard_mail', async () => { await t.home('yard'); await t.sleep(600); await ev(() => { const P = window.__paw; for (const n of ['Mrs. Plum writes', 'Leaf Festival news', 'Harvest Stall opens']) P.mailPush({ kind: 'news', from: 'Paw Haven Post', title: n, text: 'Hello.' }); }); await shot('yard_mail'); });
      await t.sleep(3200);
      await step('map_mail', async () => { await ev(() => window.__paw.go('map')); await t.sleep(700); await ev(() => { const P = window.__paw; for (const n of ['Mrs. Plum writes', 'Leaf Festival news', 'Harvest Stall opens']) P.mailPush({ kind: 'news', from: 'Paw Haven Post', title: n, text: 'Hello.' }); }); await shot('map_mail'); await t.sleep(3200); await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); });
      await ev(() => { const P = window.__paw, S = P.S; while (S.dogs.length < 3) P.addDog({ key: ['corgi', 'golden'][S.dogs.length - 1], sex: 'male', months: 20 }, ['Biscuit', 'Pal'][S.dogs.length - 1]); S.place = 'yard'; P.go('yard'); });
      await step('yard_pack', async () => { await t.home('yard'); await t.sleep(1200); await shot('yard_pack'); });
      await step('feed_tray', async () => { await p.locator('[data-act=feed]').tap(); await t.waitPop(true); await shot('feed_tray'); await p.locator('[data-act=feed]').tap(); await t.waitPop(false); });
      await step('journal_toast', async () => { await p.locator('[data-act=journal]').tap(); await p.waitForSelector('.panel.journal'); await t.sleep(500); await ev(() => window.__paw.mailPush({ kind: 'news', from: 'Paw Haven Post', title: 'A note', text: 'Hi.' })); await shot('journal_toast');
        const tb = p.locator('.panel.journal .jtabs .btn', { hasText: /Family/ }); if (await tb.count()) { await tb.first().tap(); await t.sleep(900); await shot('journal_tree'); } });
      await step('trick_panel', async () => { await t.home('yard'); await p.locator('[data-act=play]').tap(); await t.waitPop(true); await p.locator('[data-play=tricks]').tap(); await t.until(() => !!document.querySelector('#trainPanel:not([hidden])')); await t.sleep(700); await shot('trick_panel'); await ev(() => document.querySelector('#trainPanel .x, #trainPanel [aria-label=Close]')?.click()); });
      await step('walk_results', async () => { await t.home('yard'); await ev(() => { window.__paw.S.daily.play = false; }); await t.startWalk(); await t.sleep(1500); await t.quitWalk(false); await t.sleep(250); await shot('walk_results'); await p.click('#resOk'); await t.untilMode('yard'); await t.lu(); });
      await step('garden', async () => { await t.patch({ inv: { seeds: { carrot: 3, peas: 3, pumpkin: 2, apple: 2, blueberry: 2 } } }); await t.home('yard'); await ev(() => window.__paw.go('garden')); await t.until(() => document.querySelectorAll('.pg-plot').length === 6); await t.sleep(900); await shot('garden'); await p.locator('.pg-plot').nth(5).tap(); await t.sleep(700); await shot('garden_pouch'); await ev(() => window.__paw.go('yard')); });
      await step('kitchen', async () => { await t.home('house'); await ev(() => window.__paw.go('kitchen')); await t.until(() => !!document.querySelector('.pk-root')); await t.sleep(900); await shot('kitchen'); await ev(() => window.__paw.go('house')); });
      await step('house_bubble', async () => { await t.home('house'); await t.sleep(900); await ev(() => { const P = window.__paw; const g = document.getElementById('dogHit'); P.home.say('Is it dinner yet? I have been very good all day.', 640, 330); }); await shot('house_bubble'); });
      await step('square', async () => { await t.home('square'); await t.sleep(1200); await shot('square'); });
      await step('market', async () => { await t.home('market'); await t.sleep(1200); await shot('market'); });
      await step('shelter', async () => { await t.home('yard'); await t.toShelter(); await t.sleep(900); await ev(() => { const b = document.querySelector('#modal .panel-body'); if (b) b.scrollTop = 200; }); await t.sleep(400); await shot('shelter'); await t.leaveShelter(); });
    }, { device: 'iPhone 13', date: '2026-10-20', season: 'auto', fest: 'auto', time, prefs: { hwTest: true }, timeout: 400000 });
  }
})();
