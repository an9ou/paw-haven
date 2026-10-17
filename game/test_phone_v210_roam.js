// v2.10 ROAM lane phone test (iPhone 15 and Pixel 7), V210.md sections 1 and 5.2: the home and town crops are about 700 world units wide (zoomed out,
// the extra sky above the scene), centred on the pack; a dog outside the crop gets a look-left / look-right chip (44 px) that pans to it; every dog is
// drawn the same size; a finger tap on a pack dog pets that dog only; the leader's #dogHit sits fully on screen; nothing scrolls sideways.
// node game/run_tests.js phone_v210_roam
require('./test_lib').run('phone_v210_roam', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p, S = () => t.S();
  const noSide = () => ev(() => document.scrollingElement.scrollWidth <= window.innerWidth + 1 && document.body.scrollWidth <= window.innerWidth + 1);
  const quiet = async () => { await t.luWait(1200); await t.lu(); };
  const vb = () => ev(() => { const v = document.querySelector('#view svg.world').viewBox.baseVal; return { x: v.x, y: v.y, w: v.width, h: v.height }; });
  const tapAt = (id) => ev((id) => { const r = document.querySelector(`#pack [data-dog="${id}"] .pd-wander > rect`).getBoundingClientRect(); for (const fy of [0.5, 0.6, 0.7, 0.4, 0.8]) for (const fx of [0.5, 0.6, 0.4, 0.7, 0.3]) { const x = r.left + r.width * fx, y = r.top + r.height * fy, e = document.elementFromPoint(x, y), g = e && e.closest('[data-dog]'); if (g && g.dataset.dog === id) return { x, y }; } return null; }, id);
  for (const device of ['iPhone 15', 'Pixel 7']) {
    const tag = device.replace(' ', '');
    sec(device + ': one dog, the wide crop');
    await t.newGame({ device }, { coins: 2000, bond: { level: 8, pts: 3000 } });
    await t.home('yard'); await quiet();
    let v = await vb();
    ok(v.w > 500 && v.w < 710 && v.y < 0, `the yard crop is wider than v2.9 (1.3 x, at most 700 units), the extra sky above (${Math.round(v.w)} x ${Math.round(v.h)} from y ${Math.round(v.y)})`);
    ok(await ev(() => { const r = document.getElementById('dogHit').getBoundingClientRect(), w = document.getElementById('view').getBoundingClientRect(); return r.left >= w.left - 1 && r.right <= w.right + 1 && r.top >= w.top - 1 && r.bottom <= w.bottom + 1 && r.width >= 44 && r.height >= 44; }), 'the dog\'s tap rect is fully on screen and at least 44 px');
    ok(await ev(() => !!getComputedStyle(document.getElementById('view')).backgroundColor), 'the view behind the extra sky has a colour');
    ok(await noSide(), 'no sideways scroll');

    sec(device + ': four dogs, the same size, the look chips');
    await ev(() => { const P = window.__paw; P.addDog({ key: 'dachs', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); P.addDog({ key: 'golden', sex: 'female', months: 20 }, 'Goldie'); });
    await t.calm(); await t.home('house'); await t.home('yard'); await quiet(); await t.sleep(500);
    const ids = (await S()).dogs.map((d) => d.id);
    const g = await ev((l) => l.map((id) => window.__paw.rm.pos(id)), ids);
    ok(g.every((q) => Math.abs(q.sc - (0.88 * Math.max(0.86, Math.min(1.12, 1 + (q.y - 500) * 0.0012)))) < 0.002), 'every dog at rmScale: ' + JSON.stringify(g.map((q) => [Math.round(q.x), Math.round(q.y), +q.sc.toFixed(2)])));
    v = await vb();
    const outL = g.filter((q) => q.x < v.x + 20).length, outR = g.filter((q) => q.x > v.x + v.w - 20).length;
    const chips = await ev(() => ['rmLookL', 'rmLookR'].map((id) => { const b = document.getElementById(id); if (!b || b.hidden) return null; const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), label: b.getAttribute('aria-label') }; }));
    ok((outL ? !!chips[0] : !chips[0]) && (outR ? !!chips[1] : !chips[1]), `a look chip for each side with a dog off the crop (left ${outL}, right ${outR}) ` + JSON.stringify(chips));
    ok(chips.filter(Boolean).every((c) => c.w >= 44 && c.h >= 44 && /Look (left|right): /.test(c.label)), 'look chips are at least 44 px and say who is there');
    // move a dog off the crop on purpose, then follow the chip
    await ev((id) => { window.__paw.rm.pause('test'); const v = document.querySelector('#view svg.world').viewBox.baseVal; window.__paw.rm.set(id, { x: v.x + v.width > 900 ? 120 : 900, y: 560 }); }, ids[3]);
    await t.until(() => { const l = document.getElementById('rmLookL'), r = document.getElementById('rmLookR'); return (l && !l.hidden) || (r && !r.hidden); }, null, 3000);
    const side = await ev(() => { const l = document.getElementById('rmLookL'); return l && !l.hidden ? 'rmLookL' : 'rmLookR'; });
    await p().tap('#' + side); await t.sleep(900);
    v = await vb(); const gx = (await ev((id) => window.__paw.rm.pos(id), ids[3])).x;
    ok(gx > v.x && gx < v.x + v.w, `the ${side === 'rmLookL' ? 'look-left' : 'look-right'} chip pans to Goldie (x ${Math.round(gx)} in ${Math.round(v.x)}..${Math.round(v.x + v.w)})`);
    await ev(() => window.__paw.rm.resume('test'));
    await t.SH(tag + '_yard4');
    ok(await noSide(), 'no sideways scroll with four dogs');

    sec(device + ': a finger tap pets that dog only');
    await ev(() => { window.__paw.rm.pause('test'); window.__paw.S.dogs.forEach((d) => { d.stats.happy = 40; }); });
    const v2 = await vb(); await ev(([id, x]) => window.__paw.rm.set(id, { x, y: 560 }), [ids[2], Math.round(v2.x + v2.w * 0.78)]);
    const xy = await tapAt(ids[2]); ok(!!xy, 'Pip can be tapped');
    if (xy) { for (let i = 0; i < 3; i++) { const q = await tapAt(ids[2]); if (q) await p().touchscreen.tap(q.x, q.y); await t.sleep(150); } } // she walks to the front after the first pet: find her again
    const st = await S();
    ok(st.dogs.every((d) => (d.id === ids[2] ? d.stats.happy > 40 : Math.round(d.stats.happy) === 40)) && st.activeId === ids[0], 'only Pip was petted, the leader stays: ' + JSON.stringify(st.dogs.map((d) => Math.round(d.stats.happy))));
    await ev(() => window.__paw.rm.resume('test'));

    sec(device + ': the house and a town place');
    for (const pl of ['house', 'square']) {
      await t.home(pl); await quiet(); await t.sleep(300); v = await vb();
      ok(v.w > 500 && v.w < 710, `${pl}: the crop is wider than v2.9 (${Math.round(v.w)})`);
      ok(await ev(() => { const r = document.getElementById('dogHit').getBoundingClientRect(), w = document.getElementById('view').getBoundingClientRect(); return r.width >= 44 && r.right > w.left && r.left < w.right; }), `${pl}: the leader's tap rect is at least 44 px`);
      ok(await noSide(), `${pl}: no sideways scroll`);
      await t.SH(tag + '_' + pl + '4');
    }
    await t.ctx.close();
  }
  if (!t.failed) console.log('ALL OK');
}, { device: 'iPhone 15', prefs: { rmTest: true } });
