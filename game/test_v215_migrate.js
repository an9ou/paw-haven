// v2.15 Around Town (V215.md sections 9 and 16): old saves load with the v2.15 map off and on.
//   * a v2.14 save (no S.ag / S.pool / S.trk / S.mapNew) standing in every old place key (market, fujihill and a Tokyo place too) loads and stays
//     there with mpOn() off and on; v215Fields gives the defaults (S.mapNew.since = the first v2.15 load); no field of the old save is dropped
//   * a save standing in a new place stays there with the map on and goes to the yard with it off; an unknown place (a later build) goes to the yard
//   * the stubs answer: PLACES rows and names only while mpOn(), market is "Kibble Corner" only then, grOn false without a floor, artChunk resolves
//     at once in the harness, a new place without world G scene art draws the plain sketch ground (no console error)
const { run, URL } = require('./test_lib');
const SAVE = 'pawhaven_proto_v1';
const OLD = ['yard', 'house', 'park', 'river', 'woods', 'beach', 'market', 'square', 'cafe', 'dogpark', 'vet', 'salon', 'hilltop', 'pier', 'fujihill', 'shibuya', 'ueno'];
const NEW = ['boutique', 'builder', 'sprout', 'training', 'pool', 'sunflower', 'bamboo', 'cliffs'];
const BOND = { boutique: 1, builder: 1, sprout: 1, training: 3, pool: 2, sunflower: 2, bamboo: 4, cliffs: 7 };

run('v215_migrate', async (t) => {
  const { ok, sec, ev } = t;
  sec('a v2.14 save to start from');
  await t.newGame();
  const base = await ev((k) => { window.__paw.saveNow(); const s = JSON.parse(localStorage.getItem(k)); ['ag', 'pool', 'trk', 'mapNew'].forEach((f) => delete s[f]); return s; }, SAVE);
  ok(base && base.v === 1 && !('ag' in base) && !('mapNew' in base), 'the base save has no v2.15 fields (a v2.14 save)');
  const today = await ev(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });

  // load `save` with prefs.mpTest = mp, the way a player opens the game on an old save: a fresh browser context with the save already on disk
  // (the harness storage option writes it before the game boots). Seeding it in the old page's pagehide / visibilitychange listeners and then
  // reloading was flaky: Chromium can drop localStorage writes still in flight when a page reloads (worst for a context's first page), so the
  // reloaded title sometimes found no save at all and showed only "New game" (test_lib reloadKeepingSave has the same note)
  const load = async (save, mp) => {
    const was = t.ctx;
    await t.mk({ storage: { [SAVE]: JSON.stringify(save) }, prefs: Object.assign({}, t.opts.prefs, { mpTest: mp }) }); if (was) await was.close();
    await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue');
    await t.until(() => ['yard', 'market'].includes(window.__paw.mode) && !!window.__paw.S, null, 8000);
    return ev(() => { const S = window.__paw.S; return { place: S.place, mode: window.__paw.mode, keys: Object.keys(JSON.parse(JSON.stringify(S))), dogKeys: Object.keys(S.dogs[0] || {}), ag: S.ag, pool: S.pool, trk: S.trk, mapNew: S.mapNew, mp: window.__paw.mp ? window.__paw.mp.on() : null }; });
  };
  const keep = (r) => Object.keys(base).filter((k) => !r.keys.includes(k) && base[k] !== undefined);
  const keepDog = (r) => Object.keys(base.dogs[0]).filter((k) => !r.dogKeys.includes(k));

  for (const mp of [false, true]) {
    sec(`old place keys, the v2.15 map ${mp ? 'on' : 'off'}`);
    for (const k of OLD) {
      const r = await load(Object.assign({}, base, { place: k }), mp);
      ok(r.mp === mp && r.place === k && !keep(r).length && !keepDog(r).length, `${k}: loads and stays (mpOn ${r.mp}, place ${r.place}, mode ${r.mode}${keep(r).length ? ', dropped ' + keep(r).join(' ') : ''}${keepDog(r).length ? ', dog dropped ' + keepDog(r).join(' ') : ''})`);
    }
    const r = await load(Object.assign({}, base, { place: 'yard' }), mp);
    ok(r.ag && r.ag.day === '' && r.ag.runs === 0 && r.ag.coins === 0 && JSON.stringify(r.ag.best) === '{}' && r.ag.seen === false, 'S.ag defaults: ' + JSON.stringify(r.ag));
    ok(r.pool && JSON.stringify(r.pool.day) === '{}' && r.pool.vest === false && r.pool.seen === false, 'S.pool defaults: ' + JSON.stringify(r.pool));
    ok(r.trk && JSON.stringify(r.trk.seen) === '{}', 'S.trk defaults: ' + JSON.stringify(r.trk));
    ok(r.mapNew && r.mapNew.since === today && Array.isArray(r.mapNew.seen) && !r.mapNew.seen.length, `S.mapNew: since the first v2.15 load (${today}): ` + JSON.stringify(r.mapNew));

    sec(`new place keys and an unknown key, the v2.15 map ${mp ? 'on' : 'off'}`);
    for (const k of NEW) {
      const n = await load(Object.assign({}, base, { place: k }), mp);
      ok(n.place === (mp ? k : 'yard') && !keep(n).length, `${k}: ${mp ? 'stays' : 'goes to the yard'} (place ${n.place})`);
    }
    const u = await load(Object.assign({}, base, { place: 'moonbase' }), mp);
    ok(u.place === 'yard' && !keep(u).length, 'an unknown place from a later build goes to the yard: ' + u.place);
  }

  sec('a v2.15 save keeps its own values');
  {
    const id = base.dogs[0].id;
    const v = Object.assign({}, base, { place: 'training', ag: { day: today, runs: 2, coins: 30, best: { [id]: 3 }, seen: true }, pool: { day: { [id]: today }, vest: true, seen: true }, trk: { seen: { sunflower: true } }, mapNew: { since: '2026-10-01', seen: ['pool'] } });
    const r = await load(v, true);
    ok(r.place === 'training' && r.ag.runs === 2 && r.ag.coins === 30 && r.ag.best[id] === 3 && r.ag.seen === true, 'S.ag kept: ' + JSON.stringify(r.ag));
    ok(r.pool.vest === true && r.pool.day[id] === today && r.trk.seen.sunflower === true, 'S.pool and S.trk kept');
    ok(r.mapNew.since === '2026-10-01' && r.mapNew.seen.join() === 'pool', 'S.mapNew kept (since is set only once): ' + JSON.stringify(r.mapNew));
    ok(await ev(() => (window.PawArt.WORLD_G_SCENES || []).includes('training') ? !!document.querySelector('#sceneG') && !document.querySelector('#sceneG [data-plain="training"]') : !!document.querySelector('#sceneG [data-plain="training"]')), 'a new place draws its world G scene, or the plain sketch ground without it');
    const st = await ev(() => {
      const m = window.__paw.mp, gr = window.__paw.gr;
      return { rows: m.places(), bonds: m.places().map((k) => [k, m.row(k).bond]), market: m.name('market'), shop: m.shop('market'), boutique: m.shop('boutique'), labels: m.labels(), ready: m.ready(),
        gr: gr.on('park'), floor: gr.floor('park'), tokyo: gr.on('shibuya'), ag: !!window.__paw.ag && window.__paw.ag.left(), pl: !!window.__paw.pl && window.__paw.pl.vest(), tr: !!window.__paw.tr && window.__paw.tr.tracks.join() };
    });
    ok(st.rows.join() === NEW.join() && st.bonds.every(([k, b]) => BOND[k] === b), 'the eight PLACES rows with their Bond: ' + JSON.stringify(st.bonds));
    ok(st.market === 'Kibble Corner' && st.shop === 'kibble' && st.boutique === 'boutique', `market shows as Kibble Corner (${st.market}), the storefronts know their shop`);
    ok(st.labels === true && st.gr === false && st.tokyo === false, 'stubs: labels on, grOn false without prefs.grTest (Tokyo never)');
    ok(st.ag === 40 - 30 && st.pl === true && st.tr === 'sunflower,bamboo,cliffs', 'the activity stubs read the save (agility coins left, the vest, the tracks)');
    ok(await ev(async () => (await window.__paw.mp.chunk('f')) === true && (await window.__paw.mp.chunk('g')) === true && window.__paw.mp.chunkReady('g')), 'artChunk resolves at once in the harness (the worlds are inline)');
  }

  sec('the map off: v2.14 exactly');
  {
    const r = await load(Object.assign({}, base, { place: 'market' }), false);
    const st = await ev(() => { const m = window.__paw.mp; return { rows: m.places(), market: m.name('market'), row: m.row('market'), train: m.row('training') }; });
    ok(r.place === 'market' && !st.rows.length && st.market === null && st.row.n === 'Market Street' && !('shop' in st.row) && st.train === null, 'no new rows, Market Street keeps its name: ' + JSON.stringify(st));
    await ev(() => window.__paw.go('map')); await t.untilMode('map');
    ok(await ev((ks) => ks.every((k) => !document.querySelector(`#mapInner [data-area="${k}"]`)), NEW), 'the map shows none of the new places');
  }
}, { prefs: { jpTest: true, tkTest: true } });
