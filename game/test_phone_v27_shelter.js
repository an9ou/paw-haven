// v2.7 SHELTER lane, phones (iPhone 13 and Pixel 7): the Shelter Playroom in a new game and from the Map, the tray, the board,
// the list sheet, the Meet card and the naming step pass the phone minimums (taps >= 44 px, room dogs >= 48 px, text >= 15 px, no sideways scroll),
// and nothing covers the dogs, the HUD, the action bar or the place chip.
// node game/run_tests.js phone_v27_shelter
const { run } = require('./test_lib');

// In-page audit of everything visible (as test_phone_home.js): tap targets >= 44, text >= 15 (13 for captions), no horizontal scroll.
const AUDIT = () => {
  const out = { small: [], text: [], scroll: document.documentElement.scrollWidth - window.innerWidth };
  const SKIP = '#devPanel, #devBtn, #bar, #hud, #toasts';
  const vis = (el) => {
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return null;
    for (let e = el; e && e !== document.body; e = e.parentElement) { if (e.hidden) return null; const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) return null; }
    if (r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight) return null; return r;
  };
  const nm = (el) => (el.id ? '#' + el.id : '') + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '') + ' "' + (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 20) + '"';
  document.querySelectorAll('button, [role=button], a[href], input:not([type=hidden]):not([type=range]), select, .card, .hot').forEach((el) => {
    if (el.closest(SKIP)) return; if (el.closest('#modal:not([hidden])') == null && !document.getElementById('modal').hidden && el.closest('#view')) return; // a sheet is open: the room behind it is not tappable
    const r = vis(el); if (!r) return;
    if (r.width < 43.5 || r.height < 43.5) out.small.push(nm(el) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
  });
  const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = w.nextNode());) {
    const s = n.nodeValue.trim(); if (!s) continue; const el = n.parentElement; if (!el || el.closest('svg, script, style, ' + SKIP) || !vis(el)) continue;
    const fs = parseFloat(getComputedStyle(el).fontSize), cap = !!el.closest('.small, .sub, small, .cap, .crayon-note, .tagline');
    if (fs < (cap ? 12.95 : 14.95)) out.text.push(nm(el) + ' ' + fs + 'px');
  }
  return out;
};

(async () => {
  for (const dev of ['iPhone 13', 'Pixel 7']) {
    await run('phone_v27_shelter_' + dev.replace(/\s/g, '').toLowerCase(), async (t) => {
      const { ok, sec } = t;
      const audit = async (label) => {
        const a = await t.ev(AUDIT);
        ok(a.scroll <= 0, `${label}: no horizontal scroll (${a.scroll})`);
        ok(a.small.length === 0, `${label}: tap targets >= 44 px ${a.small.slice(0, 5).join(' | ')}`);
        ok(a.text.length === 0, `${label}: text >= 15 px (captions 13) ${[...new Set(a.text)].slice(0, 5).join(' | ')}`);
        await t.SH(label.replace(/\W+/g, '_'));
      };
      const tapSel = async (sel) => { await t.p.locator(sel).first().tap(); };
      // the room: every visible room dog's hit box >= 48 px, inside the scene, clear of the tray, the HUD, the bar and the place chip
      const room = (label) => t.ev(() => {
        const v = document.getElementById('view').getBoundingClientRect(), R = (s) => { const e = document.querySelector(s); if (!e || e.hidden || getComputedStyle(e).display === 'none') return null; const r = e.getBoundingClientRect(); return r.width ? r : null; };
        const tray = R('#dock > .tray'), hud = R('#hud'), bar = R('#bar'), chip = R('#status'), hit = (a, b) => !!a && !!b && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        const out = { small: [], covered: [], n: 0 };
        document.querySelectorAll('#srDogs .sr-dog, #adoptDog .sr-dog').forEach((g) => {
          if (g.style.display === 'none') return; const h = g.querySelector('.sr-hit').getBoundingClientRect(), d = g.querySelector('svg.pa-dog').getBoundingClientRect();
          if (h.right < v.left || h.left > v.right) return; out.n++;
          if (Math.min(h.width, h.height) < 48) out.small.push(g.dataset.srdog + ' ' + Math.round(h.width) + 'x' + Math.round(h.height));
          [['tray', tray], ['hud', hud], ['bar', bar], ['chip', chip]].forEach(([k, r]) => { if (hit(d, r) && !(k === 'tray' && document.getElementById('stage').classList.contains('adoptmode') && d.bottom <= r.top + 1)) out.covered.push(g.dataset.srdog + ' under the ' + k); });
        });
        if (tray && tray.top < v.bottom - 1 && !document.getElementById('stage').classList.contains('adoptmode')) out.covered.push('the tray overlaps the scene');
        return out;
      });
      const W = dev === 'iPhone 13' ? 390 : 412;

      sec(dev + ': a new game, the playroom in adopt mode');
      await t.boot({ device: dev });
      ok(await t.ev(() => document.documentElement.dataset.layout === 'phone'), 'phone layout is on');
      ok(await t.ev((w) => innerWidth === w, W), 'viewport is ' + W + ' wide');
      await tapSel('#tNew'); await t.p.waitForSelector('#aAdopt');
      ok(await t.until(() => window.__paw.sr.dogs().filter((d) => !d.meet).length === 6, null, 4000), '6 room dogs');
      await t.until(() => { const m = window.__paw.sr.dogs().find((d) => d.meet); return m && Math.abs(m.y - 592) < 2; }, null, 6000);
      await audit('adopt_room');
      let r = await room(); ok(r.n >= 3 && !r.small.length && !r.covered.length, `adopt: ${r.n} dogs in view, hit boxes >= 48 px, not covered ${r.small.concat(r.covered).join(' | ')}`);
      const bv = await t.ev(() => { const b = document.querySelector('#srBoardG .sr-board > svg').getBoundingClientRect(), v = document.getElementById('view').getBoundingClientRect(); return b.left >= v.left - 1 && b.right <= v.right + 1 && b.top >= v.top - 1; });
      ok(bv, 'adopt: the whole board sits in the crop');
      // tap a room dog with a real touch (motion off, so it stands still), on a point where it is the top dog
      await t.freezeMotion(true); await t.sleep(200);
      const pt = await t.ev(() => { for (const g of document.querySelectorAll('#srDogs .sr-dog')) { if (g.style.display === 'none') continue; const r = g.querySelector('.sr-hit').getBoundingClientRect(); for (const [fx, fy] of [[0.5, 0.6], [0.4, 0.75], [0.6, 0.45], [0.3, 0.5], [0.7, 0.7]]) { const x = r.left + r.width * fx, y = r.top + r.height * fy; const e = document.elementFromPoint(x, y); const hit = e && e.closest('[data-srdog]'); const v = document.getElementById('view').getBoundingClientRect(); if (hit === g && x > v.left + 4 && x < v.right - 4 && y < v.bottom - 4) return { id: g.dataset.srdog, x, y }; } } return null; });
      ok(!!pt, 'a room dog can be tapped ' + JSON.stringify(pt));
      if (pt) {
        const key = pt.id.replace(/^st_/, ''); await t.p.touchscreen.tap(pt.x, pt.y);
        ok(await t.until((k) => { const m = window.__paw.sr.dogs().find((d) => d.meet); return m && m.key === k; }, key, 3000), 'a tap on a room dog picks it (' + key + ')');
        ok(await t.until((k) => (document.querySelector('.heads button[aria-current=true]').getAttribute('aria-label') || '').length > 0 && window.__paw.sr.st().pets > 0, key), 'and pets it');
      }
      await t.freezeMotion(false);
      await tapSel('.heads button[aria-label^="Mochi"]');
      await tapSel('#aGirl'); await tapSel('#aAdopt'); await t.p.waitForSelector('#nOk'); await audit('adopt_name'); await tapSel('#nOk');
      await t.intro(); await t.calm();
      ok((await t.S()).dog.key === 'shiba', 'Mochi adopted on the phone');

      sec(dev + ': the playroom from the Map');
      await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, inv: { houses: ['Cardboard Box', 'Classic Wooden Doghouse'] }, house: 'Classic Wooden Doghouse' });
      await t.home(); await t.ev(() => window.__paw.go('shelter')); await t.untilMode('shelter');
      ok(await t.until(() => window.__paw.sr.dogs().length === 6, null, 4000), 'the 6 roster dogs');
      await t.waitToast(/playroom now/); await t.sleep(3200); // the welcome toast fades
      await audit('playroom');
      r = await room(); ok(r.n >= 2 && !r.small.length && !r.covered.length, `playroom: ${r.n} dogs in view, hit boxes >= 48 px, nothing covers them ${r.small.concat(r.covered).join(' | ')}`);
      const tb = await t.ev(() => [...document.querySelectorAll('#srBoard, #srToss, #srHome')].map((b) => Math.round(b.getBoundingClientRect().height)));
      ok(tb.length === 3 && tb.every((h) => h >= 48), 'tray buttons 48 px or taller: ' + tb.join(','));
      const crop = await t.ev(() => { const v = document.getElementById('view').getBoundingClientRect(), b = document.querySelector('#srBoardG .sr-board > svg').getBoundingClientRect(), bar = document.getElementById('bar').getBoundingClientRect(), tr = document.querySelector('#dock > .tray').getBoundingClientRect(); return { board: b.left >= v.left - 1 && b.right <= v.right + 1 && b.top >= v.top - 1, tray: tr.top >= v.bottom - 1 && tr.bottom <= bar.top + 1 }; });
      ok(crop.board && crop.tray, 'the board sits in the crop, the tray sits between the scene and the action bar ' + JSON.stringify(crop));
      // pet with taps (the playroom keeps going)
      const R0 = await t.ev(() => window.__paw.sr.roster()); const id0 = R0[0].id;
      for (let i = 0; i < 3; i++) await t.ev((id) => window.__paw.sr.pet(id), id0);
      ok(await t.until((id) => window.__paw.sr.dogs().find((d) => d.id === id).pose === 'rollover', id0, 1500), 'three taps: a belly rub');
      await tapSel('#srToss'); ok(await t.until(() => !!document.querySelector('#srFx .sr-toy') || window.__paw.sr.dogs().some((d) => d.held), null, 2000), '#srToss tosses a toy');
      ok(await t.until(() => window.__paw.sr.st().fetches > 0, null, 12000), 'a dog fetches it');

      sec(dev + ': the board, the list sheet, the Meet card, the naming step');
      const bc = await t.ev(() => { const r = document.querySelector('#srBoardG .sr-board > svg').getBoundingClientRect(); return [r.left + r.width * 0.3, r.top + r.height * 0.55]; });
      await t.p.touchscreen.tap(bc[0], bc[1]);
      ok(await t.until(() => !!document.querySelector('#modal .panel .shcard'), null, 4000), 'a tap anywhere on the board (a portrait too) opens the list sheet');
      ok(await t.p.locator('#modal [data-srslot]').count() === 0 && await t.p.locator('.panel.sr-meet').count() === 0, 'phones: no Meet card from the tiny portraits');
      await t.sleep(300); await audit('list');
      const res = R0.find((x) => x.kind === 'resident');
      await t.p.locator(`[data-srmeet="${res.id}"]`).scrollIntoViewIfNeeded(); await tapSel(`[data-srmeet="${res.id}"]`);
      ok(await t.until(() => !!document.querySelector('#modal .panel.sr-meet')), 'Meet card');
      await t.sleep(300); await audit('meet');
      const sheet = await t.ev(() => { const p = document.querySelector('#modal .panel').getBoundingClientRect(), bar = document.getElementById('bar').getBoundingClientRect(); return Math.round(p.bottom) >= Math.round(bar.top) - 2 && p.left <= 1 && p.right >= innerWidth - 1; });
      ok(sheet, 'the Meet card is a bottom sheet');
      await tapSel('#srMeetPet'); ok(await t.until(() => /pa-pose-(pet|rollover)/.test(document.querySelector('#srMeetDog svg').getAttribute('class') || ''), null, 2000), 'Pet in the card');
      await tapSel('#srAdopt'); await t.p.waitForSelector('#shName'); await t.sleep(300); await audit('meet_name');
      await tapSel('#shOk');
      ok(await t.until((id) => window.__paw.S.dogs.some((d) => d.id === id) && window.__paw.mode === 'yard', res.id, 8000), 'the resident is adopted on the phone');
      await t.lu();

      sec(dev + ': full pack: the kind block in the Meet card');
      await t.ev(() => window.__paw.go('shelter')); await t.untilMode('shelter');
      const r2 = (await t.ev(() => window.__paw.sr.roster())).find((x) => x.kind === 'resident');
      await t.ev((id) => window.__paw.sr.meet(id), r2.id); await t.p.waitForSelector('#srAdopt');
      await t.until(() => { const r = document.getElementById('srAdopt').getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; }, null, 3000); // the sheet slides up first
      await t.toasts(); await t.p.locator('#srAdopt').tap({ force: true }); ok(await t.waitToast(/All your dog spots are taken/), 'blocked kindly');
      await t.sleep(200); await audit('meet_full');
      await t.closeX(); await tapSel('#srHome'); ok(await t.untilMode('yard'), 'Go home');
    }, { device: dev });
  }
})();
