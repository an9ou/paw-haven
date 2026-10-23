// v2.15 Around Town (V215.md sections 2 to 4, 10 and 16): the new town map, its building buttons and the travel walk (desktop).
//   * 25 buildings, each <g class="mb" role="button" tabindex="0"> with an .mb-hit; Tab goes in map order (back to front), Enter travels
//   * hover / keyboard focus lift the building, a press squashes it (the computed transform of .mb-lift changes), the glow shows
//   * no two buildings alike: the hash of each building's art group and of its silhouette at 32 px are all distinct
//   * every place is reachable on PawArt.MAP_ROADS
//   * the travel walk: the leader's dog runs the shortest road path and the trip starts in <= 1.7 s; a tap skips it; Motion off = no walk
//   * a locked place shakes, says the Bond line and does not travel
//   * the "new" / "moved" stickers (7 days, cleared by a visit, never on a save that started on v2.15)
//   * the Settings switches: Labels on the map, the shop window on arrival
//   * captions fit in every language: each caption is narrower than its building's art plus 40 (the packed language tables)
const { run } = require('./test_lib');
const LANGS = ['en', 'ja', 'zh-Hans', 'zh-Hant', 'ko', 'es', 'pt-BR', 'fr', 'de', 'th', 'id'];
const PREFS = { tkTest: true, jpTest: true }; // the Station and the Mt. Fuji Lookout are on the map too (25 buildings)

run('v215_map', async (t) => {
  const { ok, sec, ev } = t;
  const openMap = async () => { await t.p.click('[data-act=map]'); await t.p.waitForSelector('#mapInner .mb[data-area]'); await t.until(() => !!document.querySelector('#mpWalkG .mp-walker'), null, 3000); };
  const hitAt = async (k) => { await ev((k) => window.__paw.mapTo(k), k); const b = await t.p.locator(`#mapInner .mb[data-area="${k}"] .mb-hit`).boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };
  const lift = (k) => ev((k) => getComputedStyle(document.querySelector(`#mapInner .mb[data-area="${k}"] .mb-lift`)).transform, k);
  const settle = (k, want) => t.until(([k, w]) => { const m = getComputedStyle(document.querySelector(`#mapInner .mb[data-area="${k}"] .mb-lift`)).transform; return w === 'none' ? m === 'none' : m === w; }, [k, want], 3000);

  sec('the map: 25 buildings, each a button');
  await t.newGame({}, { bond: { level: 4, pts: 900 } });
  await openMap(); await t.SH('map_summer');
  const B = await ev(() => [...document.querySelectorAll('#mapInner .mb[data-area]')].map((g) => ({ k: g.getAttribute('data-area'), role: g.getAttribute('role'), tab: g.tabIndex, hit: !!g.querySelector(':scope > .mb-hit'), aria: g.getAttribute('aria-label') || '', y: g.getBoundingClientRect().top })));
  ok(B.length === 25, `25 buildings on the map (${B.length}): ${B.map((b) => b.k).join(' ')}`);
  ok(B.every((b) => b.role === 'button' && b.tab === 0 && b.hit && b.aria.length > 3), 'every building is role=button, tabindex 0, with an .mb-hit and an aria-label');
  ok(await ev(() => window.__paw.mp.ready() && !!document.querySelector('#mapInner svg.pa-wf-map')), 'the v2.15 map is drawn (world F)');
  ok(await ev(() => document.querySelector('#mpWalkG .mp-walker').getAttribute('data-at') === 'yard'), "the leader's dog stands at the pack's place (the yard)");

  sec('hover, keyboard focus and press change the lift');
  {
    const k = 'park'; ok((await lift(k)) === 'none', 'at rest the lift has no transform');
    const c = await hitAt(k); await t.p.mouse.move(c.x, c.y);
    ok(await t.until((k) => document.querySelector(`#mapInner .mb[data-area="${k}"]`).classList.contains('mp-hov'), k, 2000), 'the mouse over the hit ellipse adds .mp-hov');
    ok(await settle(k, 'matrix(1.06, 0, 0, 1.06, 0, -12)'), 'hover: translateY(-12) scale(1.06): ' + await lift(k));
    ok(await ev((k) => getComputedStyle(document.querySelector(`#mapInner .mb[data-area="${k}"] .mb-glow`)).opacity === '1', k) || await t.until((k) => getComputedStyle(document.querySelector(`#mapInner .mb[data-area="${k}"] .mb-glow`)).opacity === '1', k, 1500), 'hover shows the glow');
    await t.p.mouse.move(5, 400); ok(await settle(k, 'none'), 'mouse away: the lift settles back');
    await ev((k) => document.querySelector(`#mapInner .mb[data-area="${k}"]`).classList.add('mp-press'), k);
    ok(await settle(k, 'matrix(0.95, 0, 0, 0.95, 0, 4)'), 'press: translateY(4) scale(.95): ' + await lift(k));
    await ev((k) => document.querySelector(`#mapInner .mb[data-area="${k}"]`).classList.remove('mp-press'), k); await settle(k, 'none');
    // keyboard: Tab from one building goes to the next in map order (back to front), focus lifts it
    const order = B.slice().sort((a, b) => a.y - b.y).map((b) => b.k), dom = B.map((b) => b.k);
    ok(JSON.stringify(order) === JSON.stringify(dom), 'the buildings are in map order (back to front), so Tab goes in map order');
    await ev(() => document.querySelector('#mapInner .mb[data-area="house"]').focus());
    await t.p.keyboard.press('Tab');
    const next = dom[dom.indexOf('house') + 1], act = await ev(() => document.activeElement && document.activeElement.getAttribute('data-area'));
    ok(act === next, `Tab moves from Cozy House to the next building (${act}, want ${next})`);
    const lockedAct = await ev((k) => document.querySelector(`#mapInner .mb[data-area="${k}"]`).getAttribute('data-locked') === '1', act);
    ok(await t.until((k) => document.querySelector(`#mapInner .mb[data-area="${k}"]`).classList.contains('mp-foc'), act, 1500) && await settle(act, lockedAct ? 'matrix(1.02, 0, 0, 1.02, 0, -5)' : 'matrix(1.06, 0, 0, 1.06, 0, -12)'), `keyboard focus lifts the building${lockedAct ? ' (a locked one a little)' : ''} and shows the ring: ` + await lift(act));
    ok(await ev(() => { const p = document.getElementById('mapPan'); return p.scrollLeft === 0 && p.scrollTop === 0; }), 'focus never scrolls the clipped map pane (the pan is the map transform)');
    await t.SH('focus_' + act);
  }

  sec('no two buildings alike');
  {
    const H = await ev(async () => {
      const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h.toString(16); };
      const art = {}; document.querySelectorAll('#mapInner .mb[data-area]').forEach((g) => { const l = g.querySelector('.mb-lift').cloneNode(true); l.querySelectorAll('.mb-box,.mb-cap,.mb-lock,.mb-sticker').forEach((e) => e.remove()); art[g.getAttribute('data-area')] = hash(l.innerHTML.replace(/\bid="[^"]*"|url\(#[^)]*\)/g, '')); });
      const sil = {};
      for (const a of window.PawArt.MAP215_AREAS) {
        const svg = window.PawArt.mapBuilding(a.id, {}).replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="28"');
        const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); await img.decode();
        const c = document.createElement('canvas'); c.width = 32; c.height = 28; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 32, 28);
        const d = x.getImageData(0, 0, 32, 28).data; let bits = ''; for (let i = 3; i < d.length; i += 4) bits += d[i] > 60 ? '1' : '0'; sil[a.id] = hash(bits);
      }
      return { art, sil };
    });
    const dup = (o) => { const seen = {}, d = []; Object.keys(o).forEach((k) => { if (seen[o[k]]) d.push(seen[o[k]] + '=' + k); else seen[o[k]] = k; }); return d; };
    ok(Object.keys(H.art).length === 25 && !dup(H.art).length, 'every building art group is different ' + dup(H.art).join(' '));
    ok(Object.keys(H.sil).length === 25 && !dup(H.sil).length, 'every 32 px silhouette is different ' + dup(H.sil).join(' '));
  }

  sec('every place is reachable on the roads');
  {
    const R = await ev(() => {
      const M = window.PawArt.MAP_ROADS, adj = {}; M.edges.forEach((e) => { (adj[e.a] = adj[e.a] || []).push(e.b); (adj[e.b] = adj[e.b] || []).push(e.a); });
      const seen = new Set(['yard']), q = ['yard']; while (q.length) (adj[q.shift()] || []).forEach((n) => { if (!seen.has(n)) { seen.add(n); q.push(n); } });
      const ids = window.PawArt.MAP215_AREAS.map((a) => a.id); return { miss: ids.filter((k) => !seen.has(k)), r: window.__paw.mp.route('yard', 'cliffs') };
    });
    ok(!R.miss.length, 'every building is on the road graph from home ' + R.miss.join(' '));
    ok(R.r && R.r.nodes[0] === 'yard' && R.r.nodes[R.r.nodes.length - 1] === 'cliffs' && R.r.pts.length > 10, 'the shortest path from home to the cliffs: ' + (R.r && R.r.nodes.join(' > ')));
  }

  sec('the travel walk');
  {
    const c = await hitAt('park'); const t0 = Date.now(); await t.p.mouse.click(c.x, c.y);
    ok(await t.until(() => !!window.__paw.mp.walking(), null, 1500), 'clicking Sunny Park starts the walk');
    const w = await ev(() => window.__paw.mp.walking()); ok(w && w.from === 'yard' && w.to === 'park' && w.path[0] === 'yard' && w.path[w.path.length - 1] === 'park', 'the walk goes yard to park by the roads: ' + JSON.stringify(w && w.path));
    await t.sleep(600); await t.SH('walk_mid');
    ok(await t.until(() => !!document.querySelector('.onway') || window.__paw.S.place === 'park', null, 2500), 'then the trip starts (travelTo)');
    const L = await ev(() => window.__paw.mp.last());
    ok(L && !L.skipped && L.ms <= 1700 && L.ms >= 1100, `the walk took ${L && L.ms} ms (1.2 to 1.6 s planned: ${L && L.dur}, at most 1.7 s), ${Date.now() - t0} ms to the trip`);
    const end = await ev(() => { const g = document.querySelector('#mpWalkG .mp-walker'), n = window.PawArt.MAP_ROADS.nodes.park, m = /translate\(([-\d.]+) ([-\d.]+)\)/.exec(g.getAttribute('transform')); return { at: g.getAttribute('data-at'), d: m ? Math.hypot(+m[1] - n[0], +m[2] - n[1]) : 999 }; });
    ok(end.at === 'park' && end.d < 1, 'the dog ends at the park door: ' + JSON.stringify(end));
    ok(await t.until(() => window.__paw.S.place === 'park' && window.__paw.mode === 'yard', null, 5000), 'and arrives at Sunny Park');
    await t.calm();
    // a tap skips the walk
    await openMap(); ok(await ev(() => document.querySelector('#mpWalkG .mp-walker').getAttribute('data-at') === 'park'), 'the map opens with the dog at the park');
    const c2 = await hitAt('square'); await t.p.mouse.click(c2.x, c2.y);
    await t.until(() => !!window.__paw.mp.walking(), null, 1500); await t.sleep(250);
    ok(await t.p.locator('#mpSkip').count() === 1, 'the Skip chip shows during the walk');
    await t.p.mouse.click(640, 360);
    const L2 = await ev(() => window.__paw.mp.last());
    ok(L2 && L2.k === 'square' && L2.skipped && L2.ms < 1000, 'a tap skips the walk: ' + JSON.stringify(L2));
    ok(await t.until(() => window.__paw.S.place === 'square' && window.__paw.mode === 'yard', null, 5000), 'the skipped walk still travels to the Square');
    ok(await ev(() => !document.getElementById('mpSkip') && !document.querySelector('#view.mp-walking')), 'the Skip chip is gone');
    await t.calm();
    // Motion off: no walk at all
    await t.freezeMotion(true); await openMap();
    const c3 = await hitAt('cafe'); await ev(() => { window.__mpW = 0; const f = () => { if (window.__paw.mp.walking()) window.__mpW++; if (window.__paw.mode === 'map') requestAnimationFrame(f); }; requestAnimationFrame(f); });
    await t.p.mouse.move(c3.x, c3.y); ok(await settle('cafe', 'none'), 'Motion off: hover does not lift (the glow only)');
    await t.p.mouse.click(c3.x, c3.y);
    ok(await t.until(() => !!document.querySelector('.onway'), null, 600), 'Motion off: the trip starts at once');
    ok(await ev(() => window.__mpW === 0), 'Motion off: no travel walk');
    ok(await t.until(() => window.__paw.S.place === 'cafe' && window.__paw.mode === 'yard', null, 5000), 'and arrives at the café');
    await t.freezeMotion(false); await t.calm();
  }

  sec('a locked place shakes and does not travel');
  {
    await openMap(); await t.toasts();
    const c = await hitAt('woods'); await t.p.mouse.click(c.x, c.y);
    ok(await t.until(() => document.querySelector('#mapInner .mb[data-area="woods"]').classList.contains('mp-shake'), null, 800), 'Maple Woods (Bond 5) shakes');
    ok(await ev(() => !!document.querySelector('#mapInner .mb[data-area="woods"] .mb-lock')), 'it carries the lock veil and the Bond chip');
    ok(await t.waitToast(/Bond 5/), 'the Bond line');
    await t.SH('locked');
    await t.sleep(400); ok(await ev(() => window.__paw.mode === 'map' && !window.__paw.mp.walking() && !document.querySelector('.onway') && window.__paw.S.place === 'cafe'), 'no walk and no travel');
  }

  sec('stickers: new and moved, for 7 days, cleared by a visit');
  {
    ok(await ev(() => window.__paw.S.mapNew.fresh === true && !document.querySelector('#mapInner .mb-sticker')), 'a save that started on v2.15 shows no stickers');
    await t.patch({ mapNew: { fresh: false, since: await ev(() => window.__paw.S.mapNew.since), seen: [] } });
    await t.home('cafe'); await openMap(); await t.SH('stickers');
    const st = await ev(() => [...document.querySelectorAll('#mapInner .mb[data-sticker]')].map((g) => g.getAttribute('data-area') + ':' + g.getAttribute('data-sticker')).sort());
    ok(JSON.stringify(st) === JSON.stringify(['bamboo:new', 'boutique:moved', 'builder:moved', 'cliffs:new', 'pool:new', 'sprout:moved', 'sunflower:new', 'training:new']), 'the 8 new and moved places carry their stickers: ' + st.join(' '));
    await ev(() => window.__paw.mp.seen('pool')); await t.home('cafe'); await openMap();
    ok(await ev(() => !document.querySelector('#mapInner .mb[data-area="pool"][data-sticker]') && !!document.querySelector('#mapInner .mb[data-area="training"][data-sticker="new"]')), 'a visit clears that sticker only');
    await t.patch({ mapNew: { since: await ev(() => { const d = new Date(Date.now() - 8 * 864e5); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }) } });
    await t.home('cafe'); await openMap();
    ok(await ev(() => !document.querySelector('#mapInner .mb-sticker')), 'after 7 days the stickers are gone');
  }

  sec('Settings: Labels on the map, the shop window on arrival');
  {
    await t.home('cafe');
    await t.p.click('#gearBtn'); await t.p.waitForSelector('#setMapLabels');
    ok(await ev(() => document.getElementById('setMapLabels').checked && document.getElementById('setShopOpen').checked), 'both switches are on by default');
    await t.p.click('#setMapLabels'); await t.p.click('#setShopOpen');
    ok(await ev(() => window.__paw.mp.labels() === false), 'Labels off');
    await t.closeX(); await openMap(); await t.SH('labels_off');
    ok(await ev(() => [...document.querySelectorAll('#mapInner .mb-cap')].every((c) => getComputedStyle(c).display === 'none') && document.querySelectorAll('#mapInner .mb').length === 25), 'the captions are hidden, the buildings stay');
    await t.home('cafe'); await t.p.click('#gearBtn'); await t.p.waitForSelector('#setMapLabels'); await t.p.click('#setMapLabels'); await t.p.click('#setShopOpen'); await t.closeX();
    await openMap(); ok(await ev(() => [...document.querySelectorAll('#mapInner .mb-cap')].every((c) => getComputedStyle(c).display !== 'none')), 'Labels on again: the captions are back');
    ok(await ev(() => { const P = JSON.parse(localStorage.getItem('pawhaven_prefs_v1') || '{}'); return P.mapLabels === true && P.shopOpen === true; }), 'the switches are saved in the prefs');
  }

  sec('winter and the festivals draw on the new map');
  {
    await t.home('cafe');
    await t.dev(async () => { await t.p.selectOption('#dvSeason', 'winter'); });
    await openMap(); await t.SH('map_winter');
    ok(await ev(() => document.querySelector('#mapInner svg.pa-wf-map').getAttribute('data-season') === 'winter'), 'the winter map (data-season winter)');
    await t.home('cafe'); await t.dev(async () => { await t.p.selectOption('#dvSeason', 'summer'); });
  }

  sec('no mission or guide text says Market Street');
  {
    const r = await ev(() => {
      const ms = window.__paw.ms, list = ms.force(ms.pool), mt = list.map((it) => ms.text(it) + ' | ' + ms.text(it, true));
      const gt = []; for (let i = 0; i < window.__gd.steps; i++) gt.push(window.__gd.text(i));
      return { n: list.length, mt, gt, tab: window.__gd.tab() };
    });
    ok(r.n > 10, `the whole mission pool was checked (${r.n})`);
    ok(!r.mt.some((x) => /Market Street/i.test(x)), 'no mission text says Market Street: ' + r.mt.filter((x) => /Market Street/i.test(x)).join(' / '));
    ok(r.mt.some((x) => /shop in town/.test(x)), 'the buy mission says "a shop in town"');
    ok(!r.gt.some((x) => /Market Street/i.test(x)) && !/Market Street/i.test(r.tab), 'no guide step or lesson says Market Street');
  }

  sec('captions fit in every language');
  for (const lang of LANGS) {
    await t.boot({ lang });
    const r = await ev(() => {
      const names = window.__paw.mp.names(), host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:2400px;height:1500px;opacity:0;pointer-events:none';
      host.innerHTML = window.PawArt.scene('map', { v215: true, names }); document.body.appendChild(host); window.__paw.mp.fitCaps(host); // what enterMap does
      const bad = [], n = Object.keys(names).length;
      host.querySelectorAll('.mb[data-area]').forEach((g) => {
        const cap = g.querySelector('.mb-cap'), lift = g.querySelector('.mb-lift'); let x0 = 1e9, x1 = -1e9;
        [...lift.children].forEach((e) => { if (e.matches('.mb-box,.mb-cap,.mb-lock,.mb-sticker')) return; try { const b = e.getBBox(); if (b.width) { x0 = Math.min(x0, b.x); x1 = Math.max(x1, b.x + b.width); } } catch (er) { /* not drawn */ } });
        const cw = cap.getBBox().width, bw = x1 - x0, fs = +cap.getAttribute('font-size'); if (!(cw <= bw + 40)) bad.push(`${g.getAttribute('data-area')} "${cap.textContent}" ${Math.round(cw)} > ${Math.round(bw)}+40`); if (fs < 26) bad.push(`${g.getAttribute('data-area')} font ${fs} < 26`);
      });
      host.remove(); return { lang: window.PawI18n ? window.PawI18n.tlang() : '?', n, bad, sample: names.dogpark };
    });
    ok(r.lang === lang && r.n === 25, `${lang}: the game runs in ${r.lang}, 25 names (${r.sample})`);
    ok(!r.bad.length, `${lang}: every caption fits its building (+40): ${r.bad.join(', ')}`);
  }
}, { map215: true, prefs: PREFS });
