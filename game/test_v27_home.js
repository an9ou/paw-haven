// v2.7 HOME lane test (V27.md section 5): Barkitecture Decor and Furniture tabs, placement mode (drag, click, keyboard, zones, put away),
// an old v2.6 save, a bed for every dog (three dogs napping on three beds), furniture use (active dog and a pack dog, front layers), the Beds tab.
// node game/run_tests.js v27_home
require('./test_lib').run('v27_home', async (t) => {
  const { ok, sec, ev } = t, URL = require('./test_lib').URL;
  const p = () => t.p;
  const S = () => t.S();
  const acts = () => ev(() => window.__paw.ho.acts());
  const R = (sel) => ev((sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height, cx: r.left + r.width / 2, cy: r.top + r.height / 2 }; }, sel);
  const placing = () => ev(() => window.__paw.ho.placing);
  const shop = async (tab) => { await t.home('market'); await p().click('#placeBtns [data-sh=builder]'); await p().waitForSelector('[data-btab=decor]'); if (tab) { await p().click(`[data-btab=${tab}]`); await t.until((tab) => document.querySelector(`[data-btab=${tab}]`).getAttribute('aria-selected') === 'true', tab); } };

  sec('1. Barkitecture: the Decor and Furniture tabs, buying');
  await t.newGame({}, { coins: 2000 });
  await shop('decor');
  const dec = await ev(() => ({ heads: [...document.querySelectorAll('#modal .ho-shh')].map((h) => h.textContent), buys: [...document.querySelectorAll('#modal [data-buy]')].map((b) => b.dataset.buy) }));
  ok(dec.heads.join('|') === 'For the yard|For the house', 'Decor tab: two headings, For the yard and For the house: ' + dec.heads.join('|'));
  ok(dec.buys.length === 16 && !dec.buys.some((n) => /Ghost|Paper Bat|Scarecrow|Lantern/.test(n)), `Decor lists the 16 v2.7 decorations and none of the 2026 ones (${dec.buys.length})`);
  let c0 = (await S()).coins;
  await t.buy('Bird Bath'); await p().waitForSelector('.confirm .no');
  ok(/Put the Bird Bath in the yard now/.test(await p().textContent('.confirm p')), 'after buying: "Put the Bird Bath in the yard now?"');
  await p().click('.confirm .no');
  let st = await S();
  ok(st.coins === c0 - 90 && st.decor['Bird Bath'] && st.decor['Bird Bath'].out === false, `Bird Bath: coins drop by 90 (${c0} -> ${st.coins}), owned and put away`);
  ok((await acts()).some((a) => a.kind === 'buy' && a.name === 'Bird Bath' && a.cat === 'decor' && a.shop === 'builder' && a.qty === 1), "buy act with cat 'decor'");
  ok(await t.until(() => !!document.querySelector('#modal [data-hoplace="Bird Bath"]')), 'the card now says Owned · Place');
  c0 = (await S()).coins; await t.buy('Toy Basket'); await p().waitForSelector('.confirm .no');
  ok(/in the house now/.test(await p().textContent('.confirm p')), 'a house decoration asks about the house'); await p().click('.confirm .no');
  ok((await S()).coins === c0 - 70, 'Toy Basket: 70 coins');
  await p().click('[data-btab=furniture]'); await t.until(() => !!document.querySelector('#modal .ho-shnote'));
  ok(/Furniture corner: big comfy things the dogs actually use/.test(await p().textContent('#modal .ho-shnote')), 'Furniture tab opens with its line');
  ok((await ev(() => document.querySelectorAll('#modal [data-buy]').length)) === 5, 'five furniture pieces');
  c0 = (await S()).coins; await t.buy('Ball Pit'); await p().waitForSelector('.confirm .yes');
  ok((await acts()).some((a) => a.kind === 'buy' && a.name === 'Ball Pit' && a.cat === 'furniture'), "buy act with cat 'furniture'");
  await p().click('.confirm .yes'); // Place it: home to the house, placement with the Ball Pit selected
  ok(await t.until(() => { const h = window.__paw.ho.placing; return window.__paw.mode === 'yard' && window.__paw.S.place === 'house' && !!h && h.sel === 'Ball Pit'; }, null, 8000), 'Place it: goes home to the house and starts placing the Ball Pit');
  ok((await S()).coins === c0 - 280 && (await S()).decor['Ball Pit'].out === true, 'Ball Pit: 280 coins, now out');
  ok(await t.until(() => !!document.querySelector('#dock .ho-tray #hoDone') && !!document.querySelector('svg.world.ho-placing')), 'the arrange tray shows, the scene is in placing mode');
  ok(/Arrange the house/.test(await p().textContent('#dock .ho-tray h3')), 'tray title: Arrange the house');
  await t.SH('1_place_ballpit');

  sec('2. placement: drag, click to place, Done, keyboard, zones');
  const pos0 = await ev(() => window.__paw.ho.pos('Ball Pit'));
  const ri = await R('[data-ho-item="Ball Pit"] .ho-hit');
  await p().mouse.move(ri.cx, ri.cy); await p().mouse.down(); await p().mouse.move(ri.cx + 60, ri.cy + 10, { steps: 4 }); await p().mouse.move(ri.cx + 120, ri.cy + 20, { steps: 4 }); await p().mouse.up();
  const pos1 = await ev(() => window.__paw.ho.pos('Ball Pit'));
  ok(pos1[0] > pos0[0] + 40 && pos1[1] > pos0[1] && pos1[0] % 2 === 0 && pos1[1] % 2 === 0, `drag moves the Ball Pit right and forward, rounded to 2 units (${pos0} -> ${pos1})`);
  // a click on empty floor moves the selected item there (centred on the click)
  const svgR = await R('#view svg.world');
  const fl = await ev(() => { const svg = document.querySelector('#view svg.world'), pt = svg.createSVGPoint(); pt.x = 760; pt.y = 560; const q = pt.matrixTransform(svg.getScreenCTM()); return [q.x, q.y]; });
  await p().mouse.click(fl[0], fl[1]);
  const pos2 = await ev(() => window.__paw.ho.pos('Ball Pit'));
  ok(Math.abs(pos2[0] + 96 - 760) <= 4 && pos2[1] + 112 <= 596, `click on the floor: the Ball Pit goes there, kept in its zone (${pos2})`);
  ok((await S()).decor['Ball Pit'].at === undefined || JSON.stringify((await S()).decor['Ball Pit'].at) !== JSON.stringify(pos2), 'not saved before Done');
  await p().click('#hoDone');
  ok(await t.until(() => !window.__paw.ho.placing && !document.querySelector('svg.world.ho-placing')), 'Done ends placing');
  st = await S(); ok(JSON.stringify(st.decor['Ball Pit'].at) === JSON.stringify(pos2), 'Done saves S.decor[n].at ' + JSON.stringify(st.decor['Ball Pit'].at));
  ok((await acts()).some((a) => a.kind === 'decorate' && a.room === 'house' && a.moved >= 1), 'decorate act on Done');
  ok(!!(await ev(() => document.querySelector('#hoRoomG [data-furn="Ball Pit"]'))), 'the Ball Pit is drawn in the house');
  // keyboard: the Decorate sheet's Place puts the Bird Bath out in the yard and selects it
  await t.home('yard'); await p().click('[data-act=care]'); await t.waitPop(true); await p().click('[data-care=decor]');
  ok(await t.waitH2(/Yard decor/), 'Care > Decor opens the Yard decor sheet');
  ok(await p().locator('#modal [data-back="Bird Bath"]').count() === 1 && await p().locator('#hoArrange').count() === 1, 'the sheet lists the put-away Bird Bath (Place) and has the Arrange button');
  await p().click('#modal [data-back="Bird Bath"]');
  ok(await t.until(() => { const h = window.__paw.ho.placing; return !!h && h.room === 'yard' && h.sel === 'Bird Bath'; }), 'Place: placing the yard with the Bird Bath selected');
  const b0 = await ev(() => window.__paw.ho.pos('Bird Bath'));
  await p().keyboard.press('ArrowRight'); await p().keyboard.press('ArrowRight'); await p().keyboard.press('Shift+ArrowDown');
  const b1 = await ev(() => window.__paw.ho.pos('Bird Bath'));
  ok(b1[0] === b0[0] + 16 && b1[1] === b0[1] + 32, `arrow keys move by 8, Shift by 32 (${b0} -> ${b1})`);
  await p().keyboard.press('Tab'); const selT = (await placing()).sel; await p().keyboard.press('Shift+Tab');
  ok((await placing()).sel === 'Bird Bath' && typeof selT === 'string', 'Tab and Shift+Tab cycle the items (' + selT + ')');
  await p().keyboard.press('Enter');
  ok(await t.until(() => !window.__paw.ho.placing), 'Enter is Done');
  ok(JSON.stringify((await S()).decor['Bird Bath'].at) === JSON.stringify(b1), 'the keyboard spot is saved');
  // zones: a move far outside is clamped (floor: bottom edge on the ground band)
  const cl = await ev(() => window.__paw.ho.move('Bird Bath', -500, 50)), z = await ev(() => window.__paw.ho.zones.yard.floor);
  ok(cl[0] === 0 && cl[1] + 88 === z.y0, `a move outside the zone is clamped: ${cl} (floor from y ${z.y0})`);
  const cw = await ev(() => { window.__paw.S.decor['String Lights'] = { got: '2026-10-13', out: true }; return window.__paw.ho.move('String Lights', 900, 900); });
  const zw = await ev(() => window.__paw.ho.zones.yard.wall);
  ok(cw[0] + 210 <= zw.x1 && cw[1] + 56 <= zw.y1, `a wall item stays inside the wall band: ${cw}`);
  await ev(() => { window.__paw.ho.move('Bird Bath', 60, 300); window.__paw.S.decor['String Lights'] = null; delete window.__paw.S.decor['String Lights']; window.__paw.saveNow(); });
  // the saved spot survives a reload
  const saved = await ev(() => { window.__paw.saveNow(); return localStorage.getItem('pawhaven_proto_v1'); });
  const atBefore = JSON.parse(saved).decor['Bird Bath'].at;
  await t.ctx.close(); let pg = await t.mk({ storage: { pawhaven_proto_v1: saved } }); await pg.goto(URL); await pg.waitForSelector('#tContinue'); await pg.click('#tContinue');
  await t.untilMode('yard'); await t.home('yard'); await t.until(() => !!document.querySelector('#decorG [data-decor="Bird Bath"]'));
  ok(JSON.stringify((await S()).decor['Bird Bath'].at) === JSON.stringify(atBefore) && (await ev(() => +document.querySelector('#decorG [data-decor="Bird Bath"] > svg').getAttribute('x'))) === atBefore[0], 'after a reload the Bird Bath is drawn at its saved spot ' + atBefore);

  sec('3. put away and put back, the last bed stays');
  await t.home('house'); await p().click('[data-act=care]'); await t.waitPop(true);
  ok(/Decorate/.test(await p().textContent('[data-care=decor]')), 'the house Care tray has the Decorate card'); await p().click('[data-care=decor]');
  ok(await t.waitH2(/House things/), 'the House things sheet');
  await p().click('#modal [data-hoaway="Ball Pit"]');
  ok(await t.until(() => window.__paw.S.decor['Ball Pit'].out === false && !document.querySelector('#hoRoomG [data-furn="Ball Pit"]')), 'Put away: the Ball Pit is gone from the room, out:false');
  ok(await t.until(() => !!document.querySelector('#modal [data-back="Ball Pit"]')), 'it shows under Put away with Place');
  await p().click('#modal [data-back="Ball Pit"]');
  ok(await t.until(() => window.__paw.S.decor['Ball Pit'].out === true && !!window.__paw.ho.placing), 'Place: it is back out, placing');
  await ev(() => window.__paw.ho.select(window.__paw.S.bed)); await p().click('#hoAway');
  ok(await t.waitToast(/Someone has to nap somewhere/), 'the last bed cannot be put away (kind line)');
  ok(Object.keys((await S()).bedAt).length === 1, 'the bed is still in the house');
  await p().click('#hoDone'); await t.until(() => !window.__paw.ho.placing);

  sec('4. an old v2.6 save loads with everything where it was');
  const old = await ev(() => { const s = JSON.parse(JSON.stringify(window.__paw.S)); delete s.bedAt; delete s.bedOf; delete s.careOff; delete s.shelter; s.decor = {}; ['Jack-o-Lantern Trio', 'Paper Bat Bunting', 'Friendly Scarecrow', 'Ghost Garland', 'Giant Crayon Box'].forEach((n) => { s.decor[n] = { got: '2026-10-10', out: true }; }); s.beds = ['Old Blanket', 'Plaid Pillow']; s.bed = 'Plaid Pillow'; s.place = 'yard'; return JSON.stringify(s); });
  await t.ctx.close(); pg = await t.mk({ storage: { pawhaven_proto_v1: old } }); await pg.goto(URL); await pg.waitForSelector('#tContinue'); await pg.click('#tContinue'); await t.untilMode('yard'); await t.home('yard');
  await t.until(() => document.querySelectorAll('#decorG [data-decor]').length === 5);
  const yd = await ev(() => [...document.querySelectorAll('#decorG [data-decor]')].map((g) => { const s = g.querySelector(':scope > svg'), a = window.__paw.home.specs[g.dataset.decor].at; return +s.getAttribute('x') === a[0] && +s.getAttribute('y') === a[1] && +s.getAttribute('width') === a[2]; }));
  ok(yd.length === 5 && yd.every(Boolean), 'the four 2026 decorations and the Crayon Box are drawn at their catalogue spots');
  st = await S(); ok(JSON.stringify(st.bedAt) === '{"Plaid Pillow":[610,360]}' && st.bed === 'Plaid Pillow', 'S.bedAt defaults to the one bed at the v2.5 spot: ' + JSON.stringify(st.bedAt));
  await t.home('house');
  const bd = await ev(() => { const s = document.querySelector('#bedG > svg'); return s && [s.getAttribute('x'), s.getAttribute('y'), s.getAttribute('width'), s.getAttribute('height')].join(','); });
  ok(bd === '610,360,260,160' && await ev(() => document.querySelectorAll('#hoRoomG > g').length) === 1, 'the house draws only the bed, at 610,360 260x160, exactly as before');
  ok(await ev(() => window.__paw.ho.napSpot().join(',')) === '417.5,130,0.75', 'its nap spot is the v2.5 one (417.5, 130, 0.75)');

  sec('5. three dogs, three beds: each naps on its own bed');
  await t.ctx.close(); await t.newGame({ packCare: true }, { coins: 2000 });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 4 }, 'Bun'); P.addDog({ key: 'golden', sex: 'female', months: 40 }, 'Pepper'); P.S.beds.push('Knitted Nest', 'Plaid Pillow'); P.S.bedAt['Knitted Nest'] = [0, 436]; P.S.bedAt['Plaid Pillow'] = [60, 264]; });
  await t.calm(); await t.home('house');
  const sy = await ev(() => window.__paw.ho.sync());
  ok(new Set(Object.values(sy.bedOf)).size === 3 && Object.keys(sy.bedOf).length === 3, 'every dog has its own bed: ' + JSON.stringify(sy.bedOf));
  await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.sleeping = true; d.stats.energy = 40; }); S.sleeping = true; window.__paw.go('yard'); });
  const fit = async () => ev(() => {
    const S = window.__paw.S, R = (e) => { const q = e.getBoundingClientRect(); return [q.left, q.top, q.right, q.bottom]; }, out = [];
    S.dogs.forEach((d) => {
      const b = window.__paw.ho.bedFor(d.id), act = d.id === S.activeId;
      const art = act ? document.getElementById('dogArt') : document.querySelector(`#pack [data-dog="${d.id}"] svg.pa-dog`) || document.querySelector(`#pack [data-dog="${d.id}"] svg`);
      const bed = act ? document.getElementById('bedG') : document.querySelector(`#hoRoomG [data-bed="${b}"]`);
      const lipEl = act ? document.querySelector('#bedFront .pa-bed-front') : document.querySelector(`#hoFrontG [data-bed="${b}"] .pa-bed-front`);
      if (!art || !bed) { out.push({ n: d.name, b, miss: true }); return; }
      const a = R(art), bb = R(bed), lip = lipEl ? R(lipEl)[1] : bb[3], h = a[3] - a[1], cx = (a[0] + a[2]) / 2;
      out.push({ n: d.name, b, above: Math.max(0, Math.min(a[3], lip) - a[1]) / h, on: cx > bb[0] && cx < bb[2] && a[3] > bb[1] && a[3] <= bb[3] + 2, lipShown: !lipEl || getComputedStyle(lipEl.closest('.bedfront')).display !== 'none' });
    }); return out;
  });
  await t.until(() => document.querySelectorAll('#pack .packdog[transform]').length === 2 && document.getElementById('dogArt').hasAttribute('transform'), null, 6000);
  let F = await fit();
  ok(F.length === 3 && F.every((f) => !f.miss && f.on && f.above >= 0.8 && f.lipShown) && new Set(F.map((f) => f.b)).size === 3, 'each dog naps on its own bed, at least 80% above the lip: ' + JSON.stringify(F.map((f) => [f.n, f.b, Math.round((f.above || 0) * 100), f.on])));
  await t.SH('5_nap3');
  // S.bed stays the active dog's bed after switching dogs
  await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.sleeping = false; d.stats.energy = 90; }); S.sleeping = false; window.__paw.go('yard'); });
  const before = await S(); const other = before.dogs.find((d) => d.id !== before.activeId);
  await p().click(`#hudPack [data-dog="${other.id}"]`); await t.until((id) => window.__paw.S.activeId === id, other.id);
  st = await S(); ok(st.bed === before.bedOf[other.id] && st.bedOf[other.id] === st.bed && st.bedOf[before.activeId] === before.bed, `after a switch S.bed is the new active dog's bed (${st.bed}), the old one keeps ${before.bed}`);
  ok(await ev(() => window.__paw.ho.napSpot().join(',')) === `${st.bedAt[st.bed][0] - 192.5},${st.bedAt[st.bed][1] - 230},0.75`, 'napSpot follows the active dog\'s own bed');

  sec('6. furniture: the active dog on every spot, a pack dog in the Ball Pit');
  await ev(() => { const S = window.__paw.S; ['Dog Play Tower', 'Tunnel Sofa', 'Ball Pit', 'Sofa Ramp', 'Window Seat'].forEach((n) => { S.decor[n] = { got: '2026-10-13', out: false }; }); S.bedAt = { [S.bed]: [610, 360] }; window.__paw.idle.speed(0.3); });
  await t.home('house');
  for (const n of ['Dog Play Tower', 'Tunnel Sofa', 'Ball Pit', 'Sofa Ramp', 'Window Seat']) await ev((n) => window.__paw.ho.place(n), n);
  await ev(() => window.__paw.ho.done());
  await ev(() => window.__paw.ho.hold(true)); // the pack dogs leave the furniture to us
  const actId = (await S()).activeId; const bad = [];
  for (const n of ['Dog Play Tower', 'Tunnel Sofa', 'Ball Pit', 'Sofa Ramp', 'Window Seat']) {
    for (const k of await ev((n) => window.__paw.ho.spots(n), n)) {
      await ev(() => { Object.keys(window.__paw.ho.uses()).forEach((id) => window.__paw.ho.free(id)); });
      const front = await ev((n) => window.__paw.ho.spot(n, window.__paw.ho.spots(n)[0]) && Object.keys(window.__paw.ho.uses()).length, n);
      const offBefore = await ev((n) => { const g = document.querySelector(`#hoFrontG .ho-front[data-furn="${n}"]`); return !g || g.style.display === 'none'; }, n);
      await ev(([id, n, k]) => window.__paw.ho.use(id, n, k), [actId, n, k]);
      const on = await t.until(([n, k]) => Object.values(window.__paw.ho.uses()).some((u) => u.name === n && u.spot === k && u.on), [n, k], 8000);
      const r = await ev(([n, k]) => { const sp = window.__paw.ho.spot(n, k), g = document.querySelector(`#hoFrontG .ho-front[data-furn="${n}"]`), m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([\d.]+)\)/.exec(document.getElementById('dogPos').style.transform);
        return { front: sp.front, shown: !!g && g.style.display !== 'none', feet: m ? [+m[1] + 430 * +m[3], +m[2] + 500 * +m[3]] : null, want: [sp.fx, sp.fy] }; }, [n, k]);
      const near = r.feet && Math.hypot(r.feet[0] - r.want[0], r.feet[1] - r.want[1]) < 2;
      if (!(on && near && offBefore && r.shown === r.front)) bad.push(`${n}/${k}: on ${on} at spot ${near} front ${r.front} shown ${r.shown} before-off ${offBefore}`);
      void front;
    }
  }
  ok(!bad.length, 'the active dog uses every furniture spot, standing on the spot, the front layer shows only on front spots' + (bad.length ? ' -> ' + bad.join(' | ') : ''));
  ok((await acts()).some((a) => a.kind === 'furniture' && a.dog === actId), 'furniture act with the dog id');
  await ev((id) => window.__paw.ho.free(id), actId);
  ok(await t.until(() => { const g = document.querySelector('#hoFrontG .ho-front[data-furn="Ball Pit"]'); return !Object.keys(window.__paw.ho.uses()).length && (!g || g.style.display === 'none'); }), 'free: the dog leaves, the front layer is off');
  await t.SH('6_furniture');
  const pk = (await S()).dogs.find((d) => d.id !== actId);
  ok(await ev((id) => window.__paw.ho.use(id, 'Ball Pit', 'a'), pk.id), 'a pack dog goes to the Ball Pit');
  const pr = await ev(([id]) => { const g = document.querySelector(`#pack [data-dog="${id}"]`), sp = window.__paw.ho.spot('Ball Pit', 'a'), r = g.getBoundingClientRect(), svg = document.querySelector('#view svg.world'), M = svg.getScreenCTM().inverse(), c = new DOMPoint(r.left + r.width / 2, r.bottom).matrixTransform(M), f = document.querySelector('#hoFrontG .ho-front[data-furn="Ball Pit"]');
    return { dx: Math.abs(c.x - sp.fx), front: !!f && f.style.display !== 'none', pose: window.__paw.ho.uses()[id] }; }, [pk.id]);
  ok(pr.dx < 40 && pr.front && pr.pose && pr.pose.name === 'Ball Pit', `the pack dog is drawn in the pit (dx ${Math.round(pr.dx)}), its front rim over it`);
  await ev((id) => window.__paw.ho.free(id), pk.id);
  ok(await t.until((id) => !window.__paw.ho.uses()[id], pk.id), 'hoFree frees the pack dog');
  await ev(() => window.__paw.ho.hold(false));

  sec('7. the Knitted Nest in the Beds tab, the Beds sheet');
  await shop('beds');
  ok(await p().locator('#modal .sitem:has-text("Knitted Nest")').count() === 1, 'the Knitted Nest shows in the Beds tab');
  await t.closeX(); await ev(() => { const S = window.__paw.S; S.bedAt = { 'Old Blanket': [610, 360], 'Knitted Nest': [0, 436], 'Plaid Pillow': [60, 264] }; }); await t.home('house');
  await p().click('[data-act=care]'); await t.waitPop(true); await p().click('[data-care=bed]');
  ok(await t.waitH2(/Pet beds/), 'Care > Bed opens Pet beds');
  ok(await p().locator('#modal [data-bedfor]').count() >= 3 && await p().locator('#hoBedsArr').count() === 1, 'each bed in the house lists the dog chips, with an Arrange button');
  const bf = await ev(() => { const S = window.__paw.S, d = S.dogs.find((x) => x.id !== S.activeId), b = S.bed; return d.id + '|' + b; });
  await p().click(`#modal [data-bedfor="${bf}"]`);
  await t.until((bf) => window.__paw.S.bedOf[bf.split('|')[0]] === bf.split('|')[1], bf, 4000);
  st = await S(); ok(st.bedOf[bf.split('|')[0]] === bf.split('|')[1] && st.bedOf[st.activeId] !== bf.split('|')[1] && st.bedOf[st.activeId] === st.bed, 'a dog chip gives that bed to that dog, the active dog swaps: ' + bf + ' ' + JSON.stringify([st.bed, st.bedOf]));
  await t.closeX();
}, { packCare: true });
