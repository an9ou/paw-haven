// v2.7 HOME lane phone test (iPhone 13 and Pixel 7), V27.md section 5: the Decorate sheet and the arrange tray pass the phone minimums,
// tap-select and tap-place move an item, item tap rects are 48 px, long-press names, nothing covers #dogHit with every v2.7 item out.
// node game/run_tests.js phone_v27_home
require('./test_lib').run('phone_v27_home', async (t) => {
  const { ok, sec, ev } = t;
  const V27 = (o) => ev(() => Object.keys(window.__paw.ho.specs).filter((n) => window.__paw.ho.specs[n].v27));
  // minimums inside a container: buttons >= minH tall, text >= 15 px (captions .small >= 13), no sideways scroll
  const audit = (sel, minH) => ev(([sel, minH]) => {
    const root = document.querySelector(sel); if (!root) return { miss: true };
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    const small = [...root.querySelectorAll('button, [role=button]')].filter(vis).filter((b) => b.getBoundingClientRect().height < minH - 0.5).map((b) => (b.id || b.textContent.trim().slice(0, 18)) + ':' + Math.round(b.getBoundingClientRect().height));
    const tiny = [...root.querySelectorAll('*')].filter((e) => vis(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && !e.closest('svg')).filter((e) => parseFloat(getComputedStyle(e).fontSize) < (e.closest('.small') ? 13 : 15) - 0.1).map((e) => e.textContent.trim().slice(0, 18) + ':' + getComputedStyle(e).fontSize);
    return { small, tiny, hs: document.documentElement.scrollWidth > window.innerWidth + 1 || [...root.querySelectorAll('*')].some((e) => e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX === 'visible' && e.clientWidth > 0 && !e.closest('svg')) };
  }, [sel, minH]);
  const show = (a) => JSON.stringify({ small: a.small, tiny: (a.tiny || []).slice(0, 4), hs: a.hs });
  const tap = async (sel) => { await t.p.locator(sel).first().tap(); };

  for (const device of ['iPhone 13', 'Pixel 7']) {
    sec(device + ': the House things sheet and the arrange tray');
    if (t.ctx) await t.ctx.close();
    await t.newGame({ device }, { coins: 5000 });
    const all = await V27();
    await ev((all) => { const S = window.__paw.S; all.forEach((n) => { S.decor[n] = { got: '2026-10-13', out: false }; }); S.beds.push('Knitted Nest'); }, all);
    await t.home('house');
    await t.retryUntil(() => tap('[data-act=care]'), () => !!document.querySelector('[data-care=decor]'));
    await tap('[data-care=decor]'); ok(await t.waitH2(/House things/), 'the House things sheet opens');
    let a = await audit('#modal .panel', 44); ok(!a.miss && !a.small.length && !a.tiny.length && !a.hs, 'House things sheet: buttons >= 44 px, text >= 15 px, no sideways scroll ' + show(a));
    await tap('#hoArrange');
    ok(await t.until(() => !!document.querySelector('#dock .ho-tray #hoDone') && !!window.__paw.ho.placing), 'Arrange: the arrange tray shows, placing the house');
    await t.until(() => { const r = document.querySelector('#dock .ho-tray').getBoundingClientRect(); return r.height > 50 && r.bottom <= window.innerHeight + 1; });
    a = await audit('#dock .ho-tray', 44);
    const big = await ev(() => ['#hoDone', '#hoAway'].map((s) => Math.round(document.querySelector(s).getBoundingClientRect().height)));
    ok(big.every((h) => h >= 48) && !a.small.length && !a.tiny.length && !a.hs, `tray: Done and Put away 48 px (${big}), put-away row 44 px, text 15 px, no sideways scroll ` + show(a));
    // tap-select: a put-away item goes out at a free spot and is selected
    await tap('[data-hoput="Toy Basket"]');
    ok(await t.until(() => { const h = window.__paw.ho.placing; return !!h && h.sel === 'Toy Basket' && window.__paw.S.decor['Toy Basket'].out; }), 'tapping a put-away item puts it out and selects it');
    const selIn = await t.until(() => { const o = document.querySelector('[data-ho-item="Toy Basket"] .ho-ol'); if (!o) return false; const r = o.getBoundingClientRect(), v = document.getElementById('view').getBoundingClientRect(); return r.left >= v.left - 1 && r.right <= v.right + 1 && r.top >= v.top - 1 && r.bottom <= v.bottom + 1; }, null, 5000);
    ok(selIn, 'the camera brings the selected item into the crop');
    await t.until(() => { const x = document.querySelector('#view > svg.world').viewBox.baseVal.x, st = window.__cv !== undefined && Math.abs(window.__cv - x) < 0.05; window.__cv = x; return st; }, null, 6000);
    // tap-place: a tap on empty floor moves the selected item there
    const spot = await ev(() => {
      const svg = document.querySelector('#view > svg.world'), vb = svg.viewBox.baseVal, M = svg.getScreenCTM();
      for (let fx = 0.25; fx <= 0.75; fx += 0.05) { const pt = svg.createSVGPoint(); pt.x = vb.x + vb.width * fx; pt.y = 560; const q = pt.matrixTransform(M), el = document.elementFromPoint(q.x, q.y); if (el === svg) return { sx: q.x, sy: q.y, wx: pt.x }; }
      return null;
    });
    ok(!!spot, 'found a bare piece of floor in the crop');
    if (spot) {
      await t.p.touchscreen.tap(spot.sx, spot.sy);
      const pos = await ev(() => window.__paw.ho.pos('Toy Basket'));
      ok(Math.abs(pos[0] + 42 - spot.wx) <= 6, `tap-place: the Toy Basket moves to the tap (${pos}, tap x ${Math.round(spot.wx)})`);
    }
    // item tap rects while placing: at least 48 screen px each way
    const hits = await ev(() => [...document.querySelectorAll('[data-ho-item] .ho-hit')].map((r) => { const b = r.getBoundingClientRect(); return [r.parentNode.dataset.hoItem, Math.round(b.width), Math.round(b.height)]; }));
    ok(hits.length >= 2 && hits.every((h) => h[1] >= 47 && h[2] >= 47), 'item tap rects >= 48 px while placing ' + JSON.stringify(hits));
    await tap('#hoDone');
    ok(await t.until(() => !window.__paw.ho.placing && !!document.querySelector('#hoRoomG [data-decor="Toy Basket"]')), 'Done: the Toy Basket stays where it was tapped');
    ok(JSON.stringify((await t.S()).decor['Toy Basket'].at) === JSON.stringify(await ev(() => window.__paw.ho.pos('Toy Basket'))), 'its spot is saved');
    ok(await ev(() => document.querySelector('#hoRoomG [data-decor="Toy Basket"]').getAttribute('data-tip') === 'Toy Basket'), 'long-press shows the name (data-tip)');
    await t.SH(device.replace(/ /g, '') + '_house');

    sec(device + ': every v2.7 item out: decor tap rects 48 px, nothing covers #dogHit');
    await ev((all) => { const S = window.__paw.S; all.forEach((n) => { S.decor[n].out = false; }); }, all);
    for (const room of ['yard', 'house']) {
      await t.home(room);
      await ev((all) => { all.filter((n) => window.__paw.ho.room(n) === window.__paw.S.place).forEach((n) => window.__paw.ho.place(n)); window.__paw.ho.done(); }, all);
      await t.until(() => !window.__paw.ho.placing); await t.home(room);
      const r = await ev(() => {
        const hit = document.getElementById('dogHit'), b = hit.getBoundingClientRect(), pts = [[0.5, 0.5], [0.3, 0.4], [0.7, 0.4], [0.35, 0.75], [0.65, 0.75]];
        const cover = pts.map(([fx, fy]) => { const el = document.elementFromPoint(b.left + b.width * fx, b.top + b.height * fy); return el && (el === hit || el.closest('#dogPos')) ? null : (el ? (el.closest('[data-decor],[data-furn],[data-bed]') || el).getAttribute('data-decor') || el.id || el.tagName : 'none'); }).filter(Boolean);
        const small = [...document.querySelectorAll('#decorG [data-decor] > rect, #hoRoomG [data-decor] > rect, #hoRoomG [data-furn] > rect')].map((e) => { const q = e.getBoundingClientRect(); return [e.parentNode.dataset.decor || e.parentNode.dataset.furn, Math.round(q.width), Math.round(q.height)]; }).filter((x) => x[1] < 47 || x[2] < 47);
        return { cover, small, n: document.querySelectorAll('#decorG [data-decor], #hoRoomG [data-decor], #hoRoomG [data-furn]').length, hs: document.documentElement.scrollWidth > window.innerWidth + 1 };
      });
      ok(r.n >= 8 && !r.cover.length && !r.small.length && !r.hs, `${room}: ${r.n} items out, nothing covers #dogHit, tap rects >= 48 px, no sideways scroll ` + JSON.stringify(r));
      await t.SH(device.replace(/ /g, '') + '_' + room + '_all');
    }
  }
}, { device: 'iPhone 13', packCare: true });
