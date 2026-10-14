// v2.7 SHELTER lane phone test (iPhone 13 and Pixel 7), V27.md section 7: the playroom (adopt and shelter mode), the shelter tray,
// the list sheet and the Meet card pass the phone minimums; the board and the sign sit in the crop; room dogs have 48 px tap rects.
// node game/run_tests.js phone_v27_shelter
require('./test_lib').run('phone_v27_shelter', async (t) => {
  const { ok, sec, ev } = t;
  // minimums inside a container: buttons >= minH tall, text >= 15 px (captions .small >= 13), no sideways scroll
  const audit = (sel, minH) => ev(([sel, minH]) => {
    const root = document.querySelector(sel); if (!root) return { miss: true };
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const small = [...root.querySelectorAll('button, [role=button]')].filter(vis).filter((b) => !b.closest('svg') && Math.min(b.getBoundingClientRect().height, b.getBoundingClientRect().width) < minH - 0.5).map((b) => (b.id || b.textContent.trim().slice(0, 18)) + ':' + Math.round(b.getBoundingClientRect().height));
    const tiny = [...root.querySelectorAll('*')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !e.closest('svg')).filter((e) => parseFloat(getComputedStyle(e).fontSize) < (e.closest('.small,.stamp,.spot') ? 13 : 15) - 0.1).map((e) => e.textContent.trim().slice(0, 18) + ':' + getComputedStyle(e).fontSize);
    return { small, tiny, hs: document.documentElement.scrollWidth > window.innerWidth + 1 };
  }, [sel, minH]);
  const show = (a) => JSON.stringify({ small: (a.small || []).slice(0, 4), tiny: (a.tiny || []).slice(0, 4), hs: a.hs });
  // a world box [x, y, w, h] lies inside the view (on screen, not under the dock)
  const inCrop = (box) => ev((box) => {
    const svg = document.querySelector('#view > svg.world'), M = svg.getScreenCTM(), v = document.getElementById('view').getBoundingClientRect();
    const d = document.getElementById('dock'), dr = d && d.offsetParent !== null && d.querySelector('.tray') ? d.querySelector('.tray').getBoundingClientRect() : null;
    const q = (x, y) => { const pt = svg.createSVGPoint(); pt.x = x; pt.y = y; return pt.matrixTransform(M); };
    const a = q(box[0], box[1]), b = q(box[0] + box[2], box[1] + box[3]);
    return a.x >= v.left - 1 && b.x <= v.right + 1 && a.y >= v.top - 1 && b.y <= v.bottom + 1 && (!dr || b.y <= dr.top + 1);
  }, box);
  const dogRects = () => ev(() => [...document.querySelectorAll('#srDogs .sr-dog')].filter((g) => g.style.display !== 'none').map((g) => { const r = g.querySelector('.sr-hit').getBoundingClientRect(); return Math.round(Math.min(r.width, r.height)); }));

  for (const device of ['iPhone 13', 'Pixel 7']) {
    sec(device + ': adopt mode');
    if (t.ctx) await t.ctx.close();
    const p = await t.boot({ device });
    await p.locator('#tNew').tap(); await p.waitForSelector('#aAdopt');
    const room = await ev(() => window.__paw.sr.room);
    ok(await inCrop(room.board) && await inCrop(room.sign), 'the board and the sign sit in the crop');
    let a = await audit('#dock', 44); ok(!a.miss && !a.small.length && !a.hs, 'the adopt tray: buttons >= 44 px, no sideways scroll ' + show(a));
    let hr = await dogRects(); ok(hr.length === 6 && hr.every((h) => h >= 48), `room dog tap rects >= 48 px (${hr})`);
    await t.SH(device.replace(/\s/g, '') + '_01_adopt');
    const front = await ev(() => window.__paw.sr.dogs().sort((a, b) => b.y - a.y)[0]), id = front.id, key = front.key; // the frontmost dog is drawn on top
    await p.locator(`[data-srdog="${id}"] .sr-hit`).tap({ force: true });
    ok(await t.until((k) => window.__paw.sr.meetKey === k, key, 4000), 'a tap on a room dog selects it');

    sec(device + ': shelter mode');
    await p.locator('#aGirl').tap(); await p.locator('#aAdopt').tap(); await p.waitForSelector('#nOk'); await p.locator('#nOk').tap(); await t.intro(); await t.calm();
    await t.patch({ coins: 2000, bond: { level: 7, pts: 1600 }, house: 'Classic Wooden Doghouse', inv: { houses: ['Cardboard Box', 'Classic Wooden Doghouse'] } });
    await ev(() => window.__paw.go('shelter')); ok(await t.untilMode('shelter'), 'the shelter opens');
    await t.until(() => !!document.querySelector('#dock .sr-tray #srBoard'));
    await t.sleep(400); await t.until(() => window.__paw.sr.dogs().every((d) => !d.walking), null, 4000);
    const big = await ev(() => ['#srBoard', '#srToss', '#srHome'].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().height)));
    a = await audit('#dock .sr-tray', 48);
    ok(big.every((h) => h >= 48) && !a.small.length && !a.tiny.length && !a.hs, `the tray: buttons 48 px (${big}), text 15 px, no sideways scroll ` + show(a));
    ok(await inCrop(room.board) && await inCrop(room.sign), 'the board and the sign sit in the crop, above the tray');
    hr = await dogRects(); ok(hr.length === 6 && hr.every((h) => h >= 48), `room dog tap rects >= 48 px (${hr})`);
    ok(await ev(() => window.__paw.sr.dogs().every((d) => { const svg = document.querySelector('#view > svg.world'), pt = svg.createSVGPoint(); pt.x = d.x; pt.y = d.y; const q = pt.matrixTransform(svg.getScreenCTM()), tr = document.querySelector('#dock .sr-tray').getBoundingClientRect(); return q.x >= 0 && q.x <= innerWidth && q.y <= tr.top + 2; })), 'every room dog stands in view, above the tray');
    await t.SH(device.replace(/\s/g, '') + '_02_shelter');
    // the whole board opens the list on phones (a portrait too)
    await p.locator('#srBoardG [data-srslot]').first().tap({ force: true });
    ok(await t.waitH2(/Paw Haven Shelter/) && await p.locator('.shcard.resident').count() === 4, 'a tap on the board opens the list sheet');
    a = await audit('#modal .panel', 44); ok(!a.miss && !a.small.length && !a.tiny.length && !a.hs, 'the list sheet: buttons >= 44 px, text >= 15 px, no sideways scroll ' + show(a));
    await t.SH(device.replace(/\s/g, '') + '_03_list');
    await p.locator('.shcard.resident [data-srmeet]').first().tap();
    ok(await t.until(() => !!document.querySelector('#modal .panel.sr-meet #srAdopt')), 'Meet opens the Meet card');
    a = await audit('#modal .panel', 44); ok(!a.miss && !a.small.length && !a.tiny.length && !a.hs, 'the Meet card: buttons >= 44 px, text >= 15 px, no sideways scroll ' + show(a));
    await p.locator('#srMeetPet').tap();
    ok(await t.until(() => /pa-pose-(pet|rollover)/.test(document.getElementById('srMeetArt').innerHTML), null, 3000), 'Pet works by tap');
    await t.SH(device.replace(/\s/g, '') + '_04_meet');
    await p.locator('#srMeetBack').tap(); ok(await t.until(() => !!document.querySelector('#modal .panel .shcard.resident')), 'Back returns to the list');
    await t.closeX();
    await p.locator('#srToss').tap(); ok(await t.until(() => !!window.__paw.sr.lastFetch, null, 9000), 'Toss a toy works by tap, and a dog fetches it');
    ok(await ev(() => document.documentElement.scrollWidth <= innerWidth + 1), 'no sideways scroll in the playroom');
  }
}, { device: 'iPhone 13' });
