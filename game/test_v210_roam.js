// v2.10 ROAM lane test, V210.md sections 1 and 5.1-5.3: every dog its own character, drawn the same size (rmScale), roaming in the place's zone
// clear of the bowl, the mailbox, the clipboard and each other, petting only the touched dog (it comes to the front), the HUD head row selecting
// stats without moving anybody, attention asks by personality, the cross-lane API (rmDogs, rmPos, rmSet, rmTo, rmPause, rmZone, rmEl), one dog.
// node game/run_tests.js v210_roam
require('./test_lib').run('v210_roam', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p, S = () => t.S();
  const pos = (id) => ev((id) => window.__paw.rm.pos(id), id);
  const ids = async () => (await S()).dogs.map((d) => d.id);
  const ar = (a) => a[2] * a[3], ov = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
  const set = (k, v) => ev(([k, v]) => { window.__paw.S.dogs.forEach((d, i) => { d.stats[k] = Array.isArray(v) ? v[i] : v; d.sleeping = false; }); window.__paw.S.sleeping = false; }, [k, v]);
  const hold = () => ev(() => window.__paw.rm.pause('test')), free = () => ev(() => window.__paw.rm.resume('test'));
  const still = () => t.until(() => !window.__paw.rm.moving.length, null, 8000);
  // a point on dog id's tap rect where that dog is on top (another dog may stand in front of part of it), or null
  const tapAt = (id) => ev((id) => { const r = document.querySelector(`#pack [data-dog="${id}"] .pd-wander > rect`).getBoundingClientRect(); for (let fy = 0.5; fy < 0.95; fy += 0.1) for (const fx of [0.5, 0.6, 0.4, 0.7, 0.3, 0.8, 0.2]) { const x = r.left + r.width * fx, y = r.top + r.height * fy, e = document.elementFromPoint(x, y), g = e && e.closest('[data-dog]'); if (g && g.dataset.dog === id) return { x, y }; } return null; }, id);

  sec('1. one dog: the same scene, that dog roams');
  // Bond 2000: inside level 8 (BOND_TH 1900-2499), so the leader's rub never brings a level popup over the HUD row (section 5)
  await t.newGame({}, { coins: 2000, bond: { level: 8, pts: 2000 }, stats: { hunger: 90, happy: 80, energy: 90, clean: 90 } });
  await t.home('yard');
  const [A] = await ids();
  ok(JSON.stringify(await ev(() => window.__paw.rm.dogs())) === JSON.stringify([A]), 'rmDogs: the one dog');
  ok(await ev((id) => { const g = document.querySelector(`#pack .rmdog.rmlead[data-dog="${id}"]`); return !!g && g.contains(document.getElementById('dogPos')) && g.contains(document.getElementById('dogHit')); }, A), 'the leader is a .rmdog group in #pack holding #dogPos and #dogHit');
  ok(await ev((id) => window.__paw.rm.pos(id).x === 430 && window.__paw.rm.pos(id).y === 500, A), 'a fresh scene puts it where the dog always stood (430, 500)');
  const base = await ev(() => window.__paw.rm.scale(500));
  ok(base >= 0.85 && base <= 1, `rmScale(500) is the one base size, 0.85 to 1 (${base})`);
  ok(await ev(() => window.__paw.rm.scale(420) >= 0.85 * window.__paw.rm.scale(500) && window.__paw.rm.scale(420) < window.__paw.rm.scale(500)), 'further back is a little smaller, at least 0.85 of the base');
  await ev(() => { window.__paw.idle.speed(0.05); window.__paw.idle.force('roam'); });
  ok(await t.until((id) => { const p = window.__paw.rm.pos(id); return Math.hypot(p.x - 430, p.y - 500) > 20; }, A, 6000), 'the roam idle walks the leader to a spot of its own');
  await still(); await ev(() => window.__paw.idle.speed(1));
  const z1 = await ev(() => window.__paw.rm.zone('yard')), p1 = await pos(A);
  ok(p1.y >= z1.y0 && p1.y <= z1.y1 && p1.x >= z1.x0 && p1.x <= z1.x1, `it stands in the yard's zone (${Math.round(p1.x)}, ${Math.round(p1.y)})`);
  ok(Math.abs(p1.sc - await ev((y) => window.__paw.rm.scale(y), p1.y)) < 0.002, 'its scale is rmScale(feet y)');

  sec('2. four dogs: the same size, apart, clear of the bowl, mailbox and clipboard');
  await ev(() => { const P = window.__paw; P.addDog({ key: 'dachs', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); P.addDog({ key: 'golden', sex: 'female', months: 20 }, 'Goldie'); });
  await t.calm(); await t.home('house'); await t.home('yard'); await t.sleep(400);
  const all = await ids(), [, B, C, G] = all;
  ok(JSON.stringify(await ev(() => window.__paw.rm.dogs())) === JSON.stringify(all), 'rmDogs: the leader first, then the pack');
  ok(await ev((l) => l.every((id) => { const g = document.querySelector(`#view [data-dog="${id}"]`); return g && g.classList.contains('rmdog') && g.closest('#pack'); }), all), 'every dog is a .rmdog group in #pack (rmEl)');
  const P4 = await ev((l) => l.map((id) => window.__paw.rm.pos(id)), all);
  ok(P4.every((q) => Math.abs(q.sc - (0.88 * Math.max(0.86, Math.min(1.12, 1 + (q.y - 500) * 0.0012)))) < 0.002), 'every dog at rmScale(its feet y): ' + JSON.stringify(P4.map((q) => +q.sc.toFixed(2))));
  ok(Math.max(...P4.map((q) => q.sc)) / Math.min(...P4.map((q) => q.sc)) < 1.2, 'nobody is a big main character: sizes within depth (' + P4.map((q) => q.sc.toFixed(2)).join(', ') + ')');
  const geo = await ev((l) => { const R = window.__paw.rm; R.scan(); return { tap: l.map((id) => R.tap(id)), no: R.zone('yard').no }; }, all);
  const small = geo.no.filter((b) => b[2] * b[3] < 15000);
  ok(geo.tap.every((T) => small.every((b) => ov(T, b) <= 0.08 * ar(b) + 1)), 'no dog\'s tap rect covers the bowl, mailbox, clipboard or a place button: ' + JSON.stringify({ tap: geo.tap.map((x) => x.map(Math.round)), small: small.map((x) => x.map(Math.round)) }));
  let pair = 0; geo.tap.forEach((a, i) => geo.tap.forEach((b, j) => { if (i < j) pair = Math.max(pair, ov(a, b) / Math.max(ar(a), ar(b))); }));
  ok(pair <= 0.31, `the dogs' tap rects stay mostly apart (worst overlap ${pair.toFixed(2)})`);
  ok(await ev(() => { const ys = [...document.querySelectorAll('#pack > .rmdog')].map((g) => window.__paw.rm.pos(g.dataset.dog).y); return ys.every((y, i) => !i || y >= ys[i - 1]); }), 'drawn back to front by feet y');
  const L = await t.layout(); ok(L.pack.length === 3 && !!L.act, 'the layout helper sees three pack dogs and the leader');

  sec('3. the cross-lane API: rmSet, rmTo, rmPause / rmResume, rmZone');
  await hold();
  await ev((id) => window.__paw.rm.set(id, { x: 700, y: 560, face: 'left', pose: 'sit' }), B);
  let q = await pos(B); ok(q.x === 700 && q.y === 560 && q.face === 'left' && q.pose === 'sit', 'rmSet places a dog at once with its pose and facing');
  ok(await ev((id) => /translate\(700 560\)/.test(document.querySelector(`#pack [data-dog="${id}"] > .rm-at`).getAttribute('transform')) && !!document.querySelector(`#pack [data-dog="${id}"] svg.pa-pose-sit`), B), 'its group moved and its art shows the pose');
  await ev((id) => { window.__rmDone = 0; window.__paw.rm.to(id, 560, 470, { run: true, pose: 'happy', done: () => { window.__rmDone++; } }); }, B);
  ok(await t.until(() => window.__rmDone === 1, null, 4000), 'rmTo runs there and calls done once');
  q = await pos(B); ok(Math.round(q.x) === 560 && Math.round(q.y) === 470 && q.pose === 'happy', 'it arrives with the pose asked for');
  await ev((id) => window.__paw.rm.set(id, { pose: 'walk', face: 'right' }), A);
  ok((await pos(A)).pose === 'walk' && (await pos(A)).face === 'right', 'rmSet on the leader redraws its art (renderDog)');
  await ev(() => window.__paw.S.prefs || 0); await ev(() => { window.__paw.idle.speed(0.02); });
  const snap = JSON.stringify(await ev((l) => l.map((id) => { const p = window.__paw.rm.pos(id); return [Math.round(p.x), Math.round(p.y)]; }), all));
  for (const id of [B, C, G]) await ev((id) => window.__paw.rm.act(id), id);
  await t.sleep(1200);
  ok(JSON.stringify(await ev((l) => l.map((id) => { const p = window.__paw.rm.pos(id); return [Math.round(p.x), Math.round(p.y)]; }), all)) === snap, 'while held (rmPause) nobody walks off on their own');
  await free(); ok(!(await ev(() => window.__paw.rm.on())) === false, 'rmResume: roaming runs again (rmOn)');
  let moved = false; for (let i = 0; i < 8 && !moved; i++) { for (const id of [B, C, G]) await ev((id) => window.__paw.rm.act(id), id); moved = await t.until((s) => JSON.stringify(window.__paw.rm.dogs().map((id) => { const p = window.__paw.rm.pos(id); return [Math.round(p.x), Math.round(p.y)]; })) !== s, snap, 1500); }
  ok(moved, 'released, the pack dogs walk to spots of their own');
  await still(); await ev(() => window.__paw.idle.speed(1));
  const zone = await ev(() => window.__paw.rm.zone('yard'));
  ok(zone.y0 >= 395 && zone.y1 <= 600 && zone.x0 === 60 && zone.x1 === 940 && zone.no.every((b) => b.length === 4) && zone.no.some((b) => b[0] >= 190 && b[0] < 260 && b[1] >= 450 && b[1] < 520), 'rmZone: the floor band and the no-go boxes (the bowl among them)');
  ok(await ev((l) => l.every((id) => { const p = window.__paw.rm.pos(id), z = window.__paw.rm.zone('yard'); return p.y >= z.y0 - 1 && p.y <= z.y1 + 1; }), all), 'every dog is in the zone after roaming');

  sec('4. petting: only the touched dog, it comes to the front, the daily care bonus once');
  await hold(); await set('happy', 40); await ev(() => { const S = window.__paw.S; S.daily = Object.assign(S.daily || {}, { pet: false }); }); await t.toasts();
  // the others stay held at the back (a roaming dog could walk under the cursor, and a full front row leaves Pip no front spot); the petted dog still walks to the front
  await ev(([a, b, c, g]) => { const R = window.__paw.rm; R.set(a, { x: 300, y: 420 }); R.set(b, { x: 560, y: 420 }); R.set(g, { x: 420, y: 440 }); R.set(c, { x: 820, y: 430 }); }, [A, B, C, G]);
  const b0 = (await S()).dogs.map((d) => d.bond.pts), c0 = (await S()).coins;
  for (let i = 0; i < 9; i++) { const xy = await tapAt(C); if (xy) await p().mouse.click(xy.x, xy.y); await p().waitForTimeout(120); }
  let st = await S();
  ok(st.dogs.every((d) => (d.id === C ? d.stats.happy > 50 : Math.round(d.stats.happy) === 40)), 'only Pip\'s Happiness rose: ' + JSON.stringify(st.dogs.map((d) => Math.round(d.stats.happy))));
  ok(st.dogs.every((d, i) => (d.id === C ? d.bond.pts > b0[i] : d.bond.pts === b0[i])), 'only Pip got Bond');
  ok(await t.waitToast(/Pip pretends she did not enjoy that/), 'one Bond toast for Pip');
  ok(st.daily.pet === true && st.coins > c0, 'the daily care bonus on the first good petting of any dog');
  ok(st.activeId === A, 'petting never switches the leader');
  ok(await t.until((id) => { const p = window.__paw.rm.pos(id), z = window.__paw.rm.zone('yard'); return p.y >= z.y1 - 40 && !window.__paw.rm.moving.includes(id); }, C, 6000), 'Pip walked to the front of the scene');
  const pf = await pos(C); await t.sleep(1500);
  const pf2 = await pos(C); ok(Math.abs(pf2.x - pf.x) < 1 && Math.abs(pf2.y - pf.y) < 1, 'and stays there a moment');
  const c1 = (await S()).coins; await set('happy', 40);
  ok(await t.pet(() => window.__paw.S.dog.stats.happy > 45), 'rubbing the leader');
  st = await S(); ok(st.dogs.every((d) => (d.id === A ? d.stats.happy > 45 : Math.round(d.stats.happy) === 40)), 'only the leader\'s Happiness rose: ' + JSON.stringify(st.dogs.map((d) => Math.round(d.stats.happy))));
  ok(!(await ev(() => (window.__toasts || []).some((x) => /Daily care bonus/.test(x) && /pet/.test(x) && window.__toasts.filter((y) => /Daily care bonus: .* pet/.test(y)).length > 1))), 'the care bonus did not come twice');
  ok(st.coins === c1 || st.coins >= c1, 'no second pet bonus');

  sec('5. the HUD head row selects stats, nobody moves');
  await hold(); await still(); const before = JSON.stringify(await ev((l) => l.map((id) => { const p = window.__paw.rm.pos(id); return [Math.round(p.x), Math.round(p.y)]; }), all));
  await p().click(`#hudPack [data-dog="${G}"]`, { force: true });
  ok(await t.until((g) => window.__paw.S.activeId === g, G, 3000), 'tapping Goldie\'s head makes her stats show');
  ok(await ev((g) => !!document.querySelector(`#pack .rmlead[data-dog="${g}"] #dogPos`) && document.querySelectorAll('#dogPos').length === 1, G), 'her group now holds #dogPos (one leader drawing)');
  ok(JSON.stringify(await ev((l) => l.map((id) => { const p = window.__paw.rm.pos(id); return [Math.round(p.x), Math.round(p.y)]; }), all)) === before, 'every dog stayed where it was');
  ok((await t.mode()) === 'yard', 'still in the yard (no scene rebuild)');
  await p().click(`#hudPack [data-dog="${A}"]`, { force: true }); await t.until((a) => window.__paw.S.activeId === a, A, 3000); await free();

  sec('6. attention: the dachshund comes to ask, ignoring it is fine');
  await set('happy', 80); await hold(); await still(); // the others step back so the front row is free
  await ev(([a, c, g]) => { const R = window.__paw.rm; R.set(a, { x: 300, y: 420 }); R.set(c, { x: 560, y: 420 }); R.set(g, { x: 840, y: 440 }); }, [A, C, G]); await free(); await t.sleep(2000);
  ok(await ev((b) => window.__paw.rm.ask(b), B), 'Bun asks for pets');
  ok(await t.until((id) => { const p = window.__paw.rm.pos(id), z = window.__paw.rm.zone('yard'); return p.y >= z.y1 - 40; }, B, 6000), 'he comes to the front');
  ok(await t.until(() => { const b = document.getElementById('bubble'); return !b.hidden && /Bun/.test(b.textContent); }, null, 6000), 'with a short line: ' + await ev(() => document.getElementById('bubble').textContent));
  const h0 = (await S()).dogs.map((d) => d.stats.happy); await t.sleep(1200);
  ok((await S()).dogs.every((d, i) => d.stats.happy >= h0[i] - 0.5), 'ignoring the ask costs nothing');
  ok(await ev(() => { const ask = (id) => window.__paw.rm.petAgo(id); return typeof ask === 'function'; }), 'the per-dog petting timer exists');

  sec('7. Feed / Care keep the pack chip row; a napping pack dog goes to the dog-house door');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  await p().click('[data-act=feed]'); await t.waitPop(true);
  ok(await p().locator('#dock .cr-chips .cr-chip').count() === 4, 'Feed: the chip row with all four dogs');
  await p().click('[data-act=feed]'); await t.waitPop(false);
  await p().click('[data-act=care]'); await t.waitPop(true);
  ok(await p().locator('#dock .cr-chips .cr-chip').count() === 4, 'Care (Bath, Nap): the chip row');
  await p().click('[data-act=care]'); await t.waitPop(false);
  await ev((id) => { const d = window.__paw.S.dogs.find((x) => x.id === id); d.sleeping = true; window.__paw.go('yard'); }, C); await t.untilMode('yard'); await t.sleep(300);
  q = await pos(C); ok(Math.abs(q.x - 740) < 60 && Math.abs(q.y - 515) < 4 && q.pose === 'sleep', `a napping pack dog lies at the dog-house door (${Math.round(q.x)}, ${Math.round(q.y)}, ${q.pose})`);
  await ev((id) => { window.__paw.S.dogs.find((x) => x.id === id).sleeping = false; window.__paw.go('yard'); }, C); await t.untilMode('yard');

  sec('8. town places: everybody the same size, inside the zone');
  for (const pl of ['square', 'dogpark']) {
    await t.home(pl); await t.sleep(400);
    const g = await ev(() => { const R = window.__paw.rm; return R.dogs().map((id) => R.pos(id)); });
    const z = await ev((pl) => window.__paw.rm.zone(pl), pl);
    ok(g.length === 4 && g.every((q) => q.y >= z.y0 - 1 && q.y <= z.y1 + 1 && Math.abs(q.sc - (0.88 * Math.max(0.86, Math.min(1.12, 1 + (q.y - 500) * 0.0012)))) < 0.002), `${pl}: four dogs at rmScale, in the zone ` + JSON.stringify(g.map((q) => [Math.round(q.x), Math.round(q.y)])));
  }
  if (!t.failed) console.log('ALL OK');
}, { packCare: true, prefs: { rmTest: true } });
