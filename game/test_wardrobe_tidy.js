// Tidy wardrobe (9 Nov 2026; game/src/06_wardrobe.js, game/css/55_wardrobe.css; owner: "more beautiful and tidy, now is a bit messy"). Checks: the slot tabs
// (All / Head / Eyes / Neck / Body / Charm) show one slot each, wear and take off by tile, the crayon tick on what is worn, a tap redraws in place
// (same tab, same scroll, no pop), "new!" on clothes not seen here yet and gone after the sheet closes, the Pyjamas toggle in the Body slot, equal tiles
// at one art size, and the fit: desktop 1280x720 (wide panel, 4+ tiles a row), a 390x844 and a 360x740 phone (3 tiles a row, 44 px taps, every tab
// in view, the grid scrolls inside the sheet, nothing behind the phone bar, no sideways page scroll).
// node game/run_tests.js wardrobe_tidy
const { run } = require('./test_lib'); const { devices } = require('playwright');
devices['Phone 360x740'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 740 }, screen: { width: 360, height: 740 } }); // as test_account.js
devices['Phone 390x844'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 } });
const OWN = ['Red Bandana', 'Party Hat', 'Bow Tie', 'Flower Crown', 'Heart Sunglasses', 'Yellow Raincoat', 'Frog Raincoat', 'Rain Hat', 'Pom-pom Beanie', 'Knit Winter Sweater', 'Superhero Cape', 'Chef Hat', 'Tutu', 'Cowboy Hat', 'Pyjamas', 'Wizard Hat', 'Witch Hat', 'Year of the Sheep Hood', 'Puffer Jacket', 'Little Witch Hat & Cape', 'Crayon Crown', 'Golden Collar', 'Sun Hat', 'Clover Collar'];

run('wardrobe_tidy', async (t) => {
  const { ok, sec, ev } = t;
  const stock = () => ev((own) => { const P = window.__paw, S = P.S; S.inv.clothes = own.slice(); S.inv.charms = ['Lucky Penny', 'Sparkle Stone']; S.outfit.head = 'Party Hat'; S.outfit.neck = null; S.outfit.body = 'Superhero Cape'; S.outfit.eyes = null; S.outfit.charm = 'Lucky Penny'; delete S.wardN; P.saveNow(); }, OWN);
  const shown = (sel) => ev((s) => [...document.querySelectorAll(s)].filter((e) => e.offsetParent).length, sel);
  const settled = () => t.until(() => { const p = document.querySelector('#modal .panel'); return !!p && !p.getAnimations().length; }, null, 3000);
  const layout = async () => { await settled(); return ev(() => {
    const p = document.querySelector('#modal .panel'), pr = p.getBoundingClientRect(), bar = document.getElementById('bar'), body = p.querySelector('.panel-body'), sc = p.querySelector('.wd-scroll'), row = p.querySelector('.wd-tabs');
    const tiles = [...p.querySelectorAll('.wd-tile')].filter((e) => e.offsetParent), first = tiles.filter((e) => e.offsetTop === tiles[0].offsetTop); // layout boxes: the desktop panel is drawn a little tilted
    const arts = new Set(tiles.map((e) => e.querySelector('.wd-art').offsetWidth)), widths = new Set(tiles.map((e) => e.offsetWidth));
    const tabs = [...p.querySelectorAll('[role=tab]')].map((b) => b.getBoundingClientRect()), pw = p.offsetWidth;
    return { pw, pBottom: pr.bottom, barTop: bar && bar.offsetParent ? bar.getBoundingClientRect().top : null, perRow: first.length, arts: [...arts], widths: [...widths],
      minTileH: Math.min(...tiles.map((e) => e.offsetHeight)), minTileW: Math.min(...tiles.map((e) => e.offsetWidth)),
      minTabH: Math.min(...tabs.map((r) => r.height)), minTabW: Math.min(...tabs.map((r) => r.width)), tabsIn: tabs.every((r) => r.left >= pr.left - 1 && r.right <= pr.right + 1), rowFits: row.scrollWidth <= row.clientWidth + 1,
      bodyScrolls: body.scrollHeight > body.clientHeight + 1, gridScrolls: sc.scrollHeight > sc.clientHeight + 1, pageW: document.documentElement.scrollWidth, vw: innerWidth };
  }); };

  sec('1. desktop 1280x720: tabs, wear and take off, the tick, redraw in place');
  await t.boot(); await t.adopt(); await stock(); await t.lu();
  await t.p.click('[data-act=wardrobe]'); await t.p.waitForSelector('#modal .ward');
  ok(await ev(() => [...document.querySelectorAll('#modal [role=tab][data-wt]')].map((b) => b.dataset.wt).join() === 'all,head,eyes,neck,body,charm'), 'six tabs: All, Head, Eyes, Neck, Body, Charm');
  ok(await ev(() => document.querySelector('#modal [data-wt="all"]').getAttribute('aria-selected') === 'true' && document.querySelector('#modal .ward').dataset.tab === 'all'), 'a fresh open starts on All');
  ok(await shown('#modal .slot h4') === 5 && await shown('#modal [data-un]') === 5, 'All: every slot under its own heading, each with a Nothing tile (eyes too: one pair owned)');
  ok(await ev(() => { const b = document.querySelector('#modal [data-eq="Party Hat"]'); return b.getAttribute('aria-pressed') === 'true' && getComputedStyle(b.querySelector('.wd-tick')).display !== 'none'; }), 'the worn Party Hat carries the crayon tick');
  ok(await ev(() => getComputedStyle(document.querySelector('#modal [data-eq="Flower Crown"] .wd-tick')).display === 'none'), 'an unworn tile has no tick');
  ok(await ev(() => !!document.querySelector('#modal [data-eq="Witch Hat"] .hw-tag') && !!document.querySelector('#modal [data-eq="Sun Hat"] .tstar') && !!document.querySelector('#modal [data-eq="Lucky Penny"] .tstar')), 'the year tag and the treasure star stay on their tiles');
  ok(await ev(() => !document.querySelector('#modal .wd-flag')), 'a save opening the new wardrobe for the first time sees no "new!" (all already seen)');
  const D = await layout();
  ok(D.pw >= 900, 'desktop: the sheet uses the width (' + Math.round(D.pw) + ' px)');
  ok(D.tabsIn && D.rowFits, 'desktop: all six tabs in one row');
  ok(D.perRow >= 4, 'desktop: ' + D.perRow + ' tiles a row');
  ok(D.arts.length === 1 && D.widths.length === 1, 'desktop: every tile the same width and every item art the same size (' + D.arts + ' px)');
  ok(!D.bodyScrolls && D.gridScrolls, 'desktop: the grid scrolls inside its panel, the dog stays put');
  ok(await ev(() => !!document.querySelector('#modal .wd-stage .wd-perks')), 'desktop: the perks note sits under the dog');

  await t.p.click('#modal [data-wt="neck"]');
  ok(await ev(() => document.querySelector('#modal .ward').dataset.tab === 'neck' && document.querySelector('#modal [data-wt="neck"]').getAttribute('aria-selected') === 'true'), 'the Neck tab is picked');
  ok(await shown('#modal [data-eq]') === 4 && await shown('#modal [data-eq="Bow Tie"]') === 1 && await shown('#modal [data-eq="Party Hat"]') === 0, 'Neck: only the four neck pieces show');
  await t.p.click('#modal [data-eq="Bow Tie"]');
  ok(await t.until(() => window.__paw.S.outfit.neck === 'Bow Tie'), 'a tap wears the Bow Tie');
  ok(await t.until(() => { const b = document.querySelector('#modal [data-eq="Bow Tie"]'); return b && b.getAttribute('aria-pressed') === 'true'; }), 'and its tile is marked worn');
  ok(await ev(() => { const p = document.querySelector('#modal .panel'); return document.querySelector('#modal .ward').dataset.tab === 'neck' && !p.classList.contains('pop') && p.classList.contains('wd-still'); }), 'the sheet redraws in place: same tab, no pop');
  ok(await ev(() => !!document.querySelector('#modal [data-wt="neck"] .wd-ti.wd-on svg')), 'the Neck tab now shows the worn piece in colour');
  await t.sleep(80); await t.p.focus('#modal [data-eq="Red Bandana"]'); await t.p.keyboard.press('Enter');
  ok(await t.until(() => window.__paw.S.outfit.neck === 'Red Bandana'), 'the keyboard wears the Red Bandana');
  ok(await t.until(() => (document.activeElement || {}).dataset && document.activeElement.dataset.eq === 'Red Bandana', null, 2000), 'and keeps its focus on that tile after the redraw');
  await t.p.click('#modal [data-un="neck"]');
  ok(await t.until(() => window.__paw.S.outfit.neck === null), 'Nothing takes it off');
  ok(await t.until(() => document.querySelector('#modal [data-un="neck"]').getAttribute('aria-pressed') === 'true'), 'and the Nothing tile is the one ticked');
  await t.p.click('#modal [data-wt="charm"]'); await t.p.click('#modal [data-eq="Sparkle Stone"]');
  ok(await t.until(() => window.__paw.S.outfit.charm === 'Sparkle Stone'), 'the Charm tab equips the Sparkle Stone');
  await t.p.click('#modal [data-wt="body"]');
  ok(await ev(() => { const b = document.querySelector('#shPj'); return !!b && b.offsetParent && b.closest('.slot').dataset.slot === 'body'; }), 'Body: the Pyjamas toggle is in the Body slot');
  await t.p.click('#shPj'); ok(await t.until(() => window.__paw.S.pjAuto === false && /off/.test(document.querySelector('#shPj').textContent)), 'and still switches');
  await t.p.click('#shPj'); await t.until(() => window.__paw.S.pjAuto === true);
  // the grid keeps its scroll when a tap redraws it
  await t.p.click('#modal [data-wt="all"]');
  const y0 = await ev(() => { const s = document.querySelector('#modal .wd-scroll'); s.scrollTop = 260; return s.scrollTop; });
  await ev(() => { const b = [...document.querySelectorAll('#modal [data-eq]')].find((e) => { const r = e.getBoundingClientRect(), q = document.querySelector('#modal .wd-scroll').getBoundingClientRect(); return r.top > q.top && r.bottom < q.bottom; }); b.click(); });
  ok(await t.until((y) => { const s = document.querySelector('#modal .wd-scroll'); return s && s.closest('.panel').classList.contains('wd-still') && Math.abs(s.scrollTop - y) < 2; }, y0, 3000), 'a tap keeps the grid where it was scrolled to');
  await t.closeX(); await t.modalGone();

  sec('2. "new!": clothes not seen here yet, newest first, gone once the sheet closes');
  await ev(() => { const S = window.__paw.S; S.inv.clothes.push('Cozy Hoodie', 'Knit Scarf'); window.__paw.saveNow(); });
  await t.p.click('[data-act=wardrobe]'); await t.p.waitForSelector('#modal .ward');
  ok(await ev(() => [...document.querySelectorAll('#modal .wd-flag')].map((f) => f.closest('[data-eq]').dataset.eq).sort().join() === 'Cozy Hoodie,Knit Scarf'), 'the two new pieces wear "new!"');
  ok(await ev(() => { const g = document.querySelector('#modal .slot[data-slot="body"] .wd-grid'); return g.children[0].dataset.un === 'body' && g.children[1].dataset.eq === 'Cozy Hoodie'; }), 'the new Cozy Hoodie comes first in Body, after Nothing');
  await t.closeX(); await t.modalGone();
  ok(await ev(() => window.__paw.S.wardN === window.__paw.S.inv.clothes.length), 'closing the sheet marks them seen');
  await t.p.click('[data-act=wardrobe]'); await t.p.waitForSelector('#modal .ward');
  ok(await ev(() => !document.querySelector('#modal .wd-flag')), 'the next open shows no "new!"');
  ok(await ev(() => document.querySelector('#modal .ward').dataset.tab === 'all'), 'and starts on All again');
  await t.closeX(); await t.modalGone();
  ok(t.errors.length === 0, 'desktop: no console errors');
  await t.ctx.close();

  for (const dev of ['Phone 390x844', 'Phone 360x740']) {
    sec('3. ' + dev);
    await t.boot({ device: dev }); await t.adopt(); await stock(); await t.lu();
    await t.dock('wardrobe'); await t.p.locator('[data-act=wardrobe]').tap(); await t.p.waitForSelector('#modal .ward'); await t.sleep(300);
    const L = await layout();
    ok(L.pageW <= L.vw, `${dev}: no sideways page scroll (${L.pageW} / ${L.vw})`);
    ok(L.barTop == null || L.pBottom <= L.barTop + 1, `${dev}: nothing behind the phone bar (sheet ${Math.round(L.pBottom)}, bar ${L.barTop && Math.round(L.barTop)})`);
    ok(L.perRow === 3 && L.widths.length === 1 && L.arts.length === 1, `${dev}: three equal tiles a row, one art size (${L.perRow}, ${L.widths}, ${L.arts})`);
    ok(L.minTileH >= 44 && L.minTileW >= 44 && L.minTabH >= 44 && L.minTabW >= 44, `${dev}: 44 px taps (tiles ${Math.round(L.minTileW)}x${Math.round(L.minTileH)}, tabs ${Math.round(L.minTabW)}x${Math.round(L.minTabH)})`);
    ok(L.tabsIn && L.rowFits, `${dev}: all six tabs in view, no sideways tab scroll in English`);
    ok(!L.bodyScrolls && L.gridScrolls, `${dev}: the grid scrolls inside its panel, the dog strip stays`);
    const small = await ev(() => { const out = [], w = document.createTreeWalker(document.querySelector('#modal'), NodeFilter.SHOW_TEXT); while (w.nextNode()) { const el = w.currentNode.parentElement; if (!w.currentNode.textContent.trim() || !el.offsetParent || el.closest('svg')) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < (el.matches('.tstar') ? 13 : 15) - 0.01) out.push(el.className + ' ' + fs); } return out; });
    ok(small.length === 0, `${dev}: every word 15 px or more${small.length ? ' -> ' + small.slice(0, 4).join(' | ') : ''}`);
    ok(await ev(() => !!document.querySelector('#modal .wd-scroll .wd-perks')), `${dev}: the perks close the list`);
    await t.p.locator('#modal [data-wt="head"]').tap();
    ok(await shown('#modal .slot') === 1 && await shown('#modal .slot h4') === 0, `${dev}: Head shows one slot, without the repeated heading`);
    await t.p.locator('#modal [data-eq="Wizard Hat"]').tap();
    ok(await t.until(() => window.__paw.S.outfit.head === 'Wizard Hat'), `${dev}: a tap wears the Wizard Hat`);
    ok(await t.until(() => { const b = document.querySelector('#modal [data-eq="Wizard Hat"]'); return b && b.getAttribute('aria-pressed') === 'true' && document.querySelector('#modal .ward').dataset.tab === 'head'; }), `${dev}: ticked, still on Head`);
    ok(await ev(() => getComputedStyle(document.querySelector('#modal .panel')).animationName === 'none'), `${dev}: the redraw does not slide the sheet up again`);
    await t.closeX(); await t.modalGone();
    ok(t.errors.length === 0, `${dev}: no console errors`);
    await t.ctx.close();
  }
}, { timeout: 300000 });
