// v2.7 PACK CARE lane phone test (iPhone 15 and Pixel 7), V27.md section 6: the chip row and both trays pass the phone minimums, chips toggle by tap,
// no sideways scroll, the pack bowls never cover #dogHit, the bath queue tray fits.
// node game/run_tests.js phone_v27_pack
require('./test_lib').run('phone_v27_pack', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p;
  const noSide = () => ev(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1);
  // the chip row: chips at least 44 px tall, names at least 15 px, heads drawn, the row inside the tray (it scrolls sideways itself), the caption at least 13 px
  const rowCheck = () => ev(() => {
    const tray = document.querySelector('#dock > .tray'), row = tray && tray.querySelector('.cr-chips'); if (!row) return { miss: true };
    const tr = tray.getBoundingClientRect(), rr = row.getBoundingClientRect(), cs = getComputedStyle(row);
    const chips = [...row.querySelectorAll('.cr-chip')].map((b) => { const r = b.getBoundingClientRect(); return { h: Math.round(r.height), w: Math.round(r.width), f: parseFloat(getComputedStyle(b.querySelector('.cr-name')).fontSize), head: !!b.querySelector('.cr-head svg') }; });
    return { n: chips.length, chips, inside: rr.left >= tr.left - 1 && rr.right <= tr.right + 1, scrollX: cs.overflowX, cap: parseFloat(getComputedStyle(tray.querySelector('.cr-cap')).fontSize) };
  });
  const settled = () => t.until(() => { const tr = document.querySelector('#dock > .tray'); return !!tr && tr.getAnimations({ subtree: true }).every((a) => a.playState !== 'running'); }, null, 3000); // the sheet slides up first
  const hit = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];
  for (const device of ['iPhone 15', 'Pixel 7']) {
    sec(device + ': three dogs, the Feed tray');
    await t.newGame({ device }, { coins: 2000 });
    await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'samoyed', sex: 'female', months: 30 }, 'Clementine'); P.S.inv.food['Basic Kibble'] = 9; P.S.dogs.forEach((d) => { d.stats.hunger = 30; d.stats.clean = 40; }); });
    await t.calm(); await t.home('yard');
    const ids = await ev(() => window.__paw.S.dogs.map((d) => d.id));
    await t.dock('feed'); await p().click('[data-act=feed]'); await t.waitPop(true); await settled();
    let R = await rowCheck();
    ok(!R.miss && R.n === 3 && R.chips.every((c) => c.h >= 44 && c.f >= 15 && c.head), `${device}: three chips, 44 px tall, 15 px names: ` + JSON.stringify(R.chips));
    ok(R.inside && /auto|scroll/.test(R.scrollX) && R.cap >= 13, `${device}: the row sits inside the tray and scrolls sideways itself (caption ${R.cap} px)`);
    ok(await noSide(), `${device}: no sideways scroll with the Feed tray open`);
    ok(await ev(() => [...document.querySelectorAll('#dock .card[data-food]')].every((c) => c.getBoundingClientRect().height >= 44)), `${device}: the food cards keep their size under the chips`);
    await p().tap(`[data-crdog="${ids[2]}"]`);
    ok(await t.until((c) => window.__paw.S.careOff[c] === true && document.querySelector(`[data-crdog="${c}"]`).getAttribute('aria-pressed') === 'false', ids[2], 2000), `${device}: a tap unticks a dog`);
    await p().tap(`[data-crdog="${ids[2]}"]`);
    ok(await t.until((c) => !window.__paw.S.careOff[c] && document.querySelector(`[data-crdog="${c}"]`).getAttribute('aria-pressed') === 'true', ids[2], 2000), `${device}: a second tap ticks it again`);

    sec(device + ': the pack meal, the bowls clear of the active dog');
    const rest = await ev(() => { const q = document.getElementById('dogHit').getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom]; }); // the active dog at rest (it walks to its own bowl to eat)
    await p().tap('[data-food="Basic Kibble"]');
    ok(await t.until(() => document.querySelectorAll('#fbPackBowls > svg').length === 2, null, 3000), `${device}: a bowl for each pack dog`);
    const B = await ev(() => { const R = (e) => { const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom]; }; const g = document.getElementById('fbPackBowls'), pos = document.getElementById('dogPos'); return { bowls: [...g.querySelectorAll(':scope > svg')].map(R), under: !!(g.compareDocumentPosition(pos) & Node.DOCUMENT_POSITION_FOLLOWING), pe: g.getAttribute('pointer-events') }; });
    ok(B.bowls.every((b) => !hit(b, rest)), `${device}: the pack bowls stay clear of #dogHit at rest: ` + JSON.stringify([B.bowls, rest]));
    ok(B.under && B.pe === 'none', `${device}: the pack bowls are drawn under the active dog and take no taps`);
    await t.until(() => !window.__paw.shop.busy, null, 8000);
    ok(await ev(() => window.__paw.S.inv.food['Basic Kibble'] === 6), `${device}: three portions used`);

    sec(device + ': the Care tray and the bath queue');
    await t.dock('care'); await p().click('[data-act=care]'); await t.waitPop(true); await settled();
    R = await rowCheck();
    ok(!R.miss && R.n === 3 && R.chips.every((c) => c.h >= 44 && c.f >= 15) && R.inside, `${device}: the chip row tops the Care tray`);
    ok(await noSide(), `${device}: no sideways scroll with the Care tray open`);
    const cc = await ev(() => { const body = document.querySelector('#dock > .tray .tray-body'), br = body.getBoundingClientRect(); return { cards: [...document.querySelectorAll('#dock [data-care]')].map((c) => { const r = c.getBoundingClientRect(); return [c.dataset.care, Math.round(r.top), Math.round(r.bottom), Math.round(r.height)]; }), body: [Math.round(br.top), Math.round(br.bottom), body.scrollHeight, body.clientHeight], vh: window.innerHeight }; });
    ok(cc.cards.every((c) => c[3] >= 44) && cc.cards.filter((c) => c[0] === 'bath' || c[0] === 'sleep').every((c) => c[2] <= cc.vh), `${device}: the care cards keep 44 px and Bath and Nap stay on screen`);
    await p().tap('[data-care="bath"]'); await t.untilMode('bath');
    const bt = await ev(() => { const h = document.querySelector('#dock .tray-h h3'), n = document.getElementById('crBathNext'), q = document.getElementById('bathQuit'), r = (e) => e.getBoundingClientRect(); return { title: h.textContent, nh: n && r(n).height, qh: r(q).height, inView: r(n).right <= window.innerWidth && r(q).right <= window.innerWidth && r(q).bottom <= window.innerHeight }; });
    ok(/\(1 of 3\)/.test(bt.title) && bt.nh >= 44 && bt.qh >= 44 && bt.inView, `${device}: the bath tray shows the queue, Next dog and Done for now at 44 px: ` + JSON.stringify(bt));
    ok(await noSide(), `${device}: no sideways scroll in the bath`);
    await p().tap('#crBathNext'); ok(await t.until((id) => window.__paw.S.activeId === id, ids[1], 4000), `${device}: Next dog brings Bun to the tub`);
    await p().tap('#bathQuit'); await t.untilMode('yard');
    ok(await ev((a) => window.__paw.S.activeId === a && !window.__paw.cr.bathQueue, ids[0]), `${device}: Done for now: back in the yard with the first dog`);
    await t.ctx.close();
  }
}, { device: 'iPhone 15', packCare: true });
