// v2.22 part B (V222.md 7.1 B1): every lock text a player at Bond 1 meets, read from the live game through the test hooks only.
// It uses nothing from 51_levels.js, so the same code reads the dev build (no levels) for the "today" snapshot (test_v222_b1_today.json):
//   node <this repo>/game/test_v222_probe.js --dump <file>   (run from a dev checkout's game/, see the B1 section of test_v222_levels.js)
// Keys: nope.place.<k> (travelTo / the Station), nope.route.<k> (startRoute), mp.lock.<k> / mp.label.<k> (the town map), route.stamp.<k> /
// route.btn.<k> (the carousel), shop.<shop>.<tab>.<item> (the lock chip), ff.btn.<k> / ff.nope.<k>, tk.<k>, nb.<i>, garden / kitchen,
// fw.next.<L> (the Bond Next line), dd.rows.<L> (the Bond track). The dog's name is written {NAME}.
const PLACES_FF = ['park', 'pool', 'yard', 'square', 'fujihill', 'cafe'];
async function lockTexts(t) {
  const { ev } = t, out = {};
  const name = await ev(() => window.__paw.S.dog.name);
  const norm = (s) => String(s == null ? '' : s).split(name).join('{NAME}').replace(/\s+/g, ' ').trim();
  const put = (pre, o) => Object.keys(o || {}).forEach((k) => { out[pre + k] = norm(o[k]); });
  const PAGE = () => { // page-side helpers, installed once
    window.__b1 = {
      clear: () => { const e = document.getElementById('toasts'); if (e) e.innerHTML = ''; },
      last: () => { const e = document.getElementById('toasts'), c = e && e.lastElementChild; return c ? c.textContent : ''; },
      close: () => { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); }
    };
  };
  await ev(PAGE);
  // the town map: lock chips and labels (v2.15 map)
  const mp = await ev(() => { const o = window.__paw.mp.opts(); return { lock: o.lock || {}, label: o.labels || {} }; });
  put('mp.lock.', mp.lock); put('mp.label.', mp.label);
  // a tap on each locked place (travelTo's Nope, the Station's)
  put('nope.place.', await ev((keys) => { const B = window.__b1, o = {}; keys.forEach((k) => { B.clear(); window.__paw.mp.pick(k); o[k] = B.last(); }); B.clear(); return o; }, Object.keys(mp.lock).sort()));
  // the route carousel: the lock stamp of each card, the start button on each locked card, and the order
  await ev(() => window.__paw.go('routes')); await t.until(() => !!document.querySelector('#rtTrack .rt-card'), null, 8000);
  const rt = await ev(() => {
    const keys = window.__paw.tr.keys(), o = { stamp: {}, btn: {}, locked: [] };
    document.querySelectorAll('#rtTrack .rt-card').forEach((c) => { const i = +c.dataset.i, k = keys[i], s = c.querySelector('.rt-lock'); if (s) { o.stamp[k] = s.textContent; o.locked.push(k); } });
    o.locked.forEach((k) => { document.querySelector(`#rtTrack .rt-card[data-i="${keys.indexOf(k)}"]`).click(); o.btn[k] = document.getElementById('rtStart').textContent; });
    o.order = keys.join(','); return o;
  });
  put('route.stamp.', rt.stamp); put('route.btn.', rt.btn); out['route.order'] = rt.order;
  await ev(() => window.__paw.go('yard')); await t.until(() => window.__paw.mode === 'yard', null, 8000); await t.calm();
  put('nope.route.', await ev((keys) => { const B = window.__b1, o = {}; keys.forEach((k) => { B.clear(); window.__paw.tr.gate(k); o[k] = B.last(); }); B.clear(); return o; }, rt.locked));
  // the shops: the lock chip of every locked row, on every tab (the tools tab adds its line)
  const shopTabs = [['kibble', 'data-tab', ['food', 'toys', 'tools']], ['boutique', null, ['all']], ['builder', 'data-btab', ['houses', 'beds', 'decor', 'furniture']]];
  for (const [shop, attr, tabs] of shopTabs) {
    for (const tab of tabs) {
      const rows = await ev(([shop, attr, tab]) => {
        window.__paw.shop.shop(shop); if (attr) { const b = document.querySelector(`#modal [${attr}="${tab}"]`); if (b) b.click(); }
        const o = {}; document.querySelectorAll('#modal .sitem.lockd').forEach((r) => { const b = r.querySelector('b'), c = r.querySelector('.chip.lock'), s = r.querySelector('.small'); o[b ? b.textContent : '?'] = (c ? c.textContent : '') + (s && c && s.previousElementSibling === c ? ' | ' + s.textContent : ''); });
        window.__b1.close(); return o;
      }, [shop, attr, tab]);
      put(`shop.${shop}.${tab}.`, rows);
    }
  }
  // the Fun Fair cards at each of its places: the locked button and its Nope
  const ff = await ev((places) => {
    const P = window.__paw, B = window.__b1, S = P.S, was = S.place, o = { btn: {}, nope: {} };
    if (!P.ff || !P.ff.on()) return o;
    places.forEach((pl) => {
      S.place = pl; P.ff.cards();
      document.querySelectorAll('#modal .ff-card.locked').forEach((c) => { const k = c.dataset.k, b = c.querySelector('[data-ffgo]'); o.btn[k] = b.textContent; B.clear(); b.click(); o.nope[k] = B.last(); });
      B.close();
    });
    S.place = was; B.clear(); return o;
  }, PLACES_FF);
  put('ff.btn.', ff.btn); put('ff.nope.', ff.nope);
  // Tokyo: the Station and each Tokyo place (all locked at Bond 1)
  put('tk.', await ev(() => { const P = window.__paw, B = window.__b1, o = {}; if (!P.tk || !P.tk.on()) return o; B.clear(); P.tk.station(); o.station = B.last(); P.tk.places().forEach((k) => { if (k === 'station') return; B.clear(); P.tk.pick(k); o[k] = B.last(); }); B.clear(); return o; }));
  // the veggie patch and the kitchen (the Journal's open buttons)
  put('', await ev(() => {
    const P = window.__paw, B = window.__b1, S = P.S, was = S.place, o = {};
    [['garden', 'yard', 'garden'], ['kitchen', 'house', 'recipes']].forEach(([k, pl, tab]) => { S.place = pl; P.dd.journal(tab); const b = document.querySelector(`#modal [data-jopen="${k}"]`); B.clear(); if (b) b.click(); o[k] = B.last(); B.close(); });
    S.place = was; B.clear(); return o;
  }));
  // the new player's notebook: every step's lock tag
  put('nb.', await ev(() => { // every page opened for the read (pages open a day at a time), then put back
    const P = window.__paw, o = {}, nb = P.msn && P.msn.nb(); if (!nb) return o; const was = nb.pages, pg = P.msn.pg; nb.pages = P.msn.pages().length;
    for (let n = 1; n <= nb.pages; n++) { P.msn.page(n); const d = document.createElement('div'); d.innerHTML = P.msn.html(true); d.querySelectorAll('.nb-lock').forEach((e, i) => { const row = e.closest('li') || e.parentElement; o[n + '.' + i] = (row ? row.textContent.replace(e.textContent, '').trim() + ' | ' : '') + e.textContent; }); }
    nb.pages = was; P.msn.page(pg); return o;
  }));
  // the Bond Next line and the Bond track rows
  put('fw.next.', await ev(() => { const o = {}; for (let L = 1; L <= 9; L++) o[L] = window.__paw.fw.next(L); return o; }));
  put('dd.rows.', await ev(() => { const o = {}; for (let L = 1; L <= 10; L++) o[L] = window.__paw.dd.rows(L).join(' / '); return o; }));
  return out;
}
module.exports = { lockTexts };

// --dump <file>: boot the game at Bond 1 with the switches off and write the snapshot (the "today" capture on a dev build)
if (require.main === module) {
  const i = process.argv.indexOf('--dump'), file = i > 0 ? process.argv[i + 1] : null;
  if (!file) { console.error('usage: node test_v222_probe.js --dump <file>'); process.exit(2); }
  const { run } = require(require('path').join(process.cwd(), 'test_lib'));
  run('v222_probe', async (t) => {
    await t.newGame({ sex: 'girl', prefs: { ms2Test: true, msTest: true, tkTest: true, jpTest: true, ffTest: true }, map215: true }, { bond: { level: 1, pts: 0 }, coins: 1000 });
    const snap = await lockTexts(t);
    require('fs').writeFileSync(file, JSON.stringify(snap, null, 1) + '\n');
    t.ok(Object.keys(snap).length > 40, `${Object.keys(snap).length} lock texts written to ${file}`);
  }, { map215: true, timeout: 240000 });
}
