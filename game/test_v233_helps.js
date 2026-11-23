// v2.33 "Helping paws" (V233.md 13): the game half, against the Friends cloud mock (game/fr_mock.js) with and without hp.
//   node game/run_tests.js v233_helps
// Part 1 (V233.md 14.1, the plumbing): the gate off (no hp field, no ?hp=1, S.hp only the defaults), an older Worker = v2.32.1 behaviour, the
// migration of an old save and of a broken S.hp, the snapshot's hp (d, g, w, a; a done wish or a snack that is no gift sends no w) and the
// retry without it on bad, ?hp=1 and the claim (acts applied once across a failed claim), note 12. Parts 2-4 add their sections below.
const { run, URL } = require('./test_lib');
const { mockInit } = require('./fr_mock');

const ME = { fid: 'ownerxxxxxxxxxxxxxxxxx', code: 'DOG-23456', name: [3, 4] };
const SUNNY = 'sunnybiscuitxxxxxxxxxx';

// a game with Friends on (prefs.frTest + the mock). o.hp: the mock is a Worker with the gate open; o.test: prefs.hpTest (the game's gate)
async function start(t, o) {
  o = o || {};
  await t.mk({ prefs: Object.assign({ frTest: true, ddTest: true }, o.test ? { hpTest: true } : {}), storage: o.storage || null }); // ddTest: the daily wish (48_dogdays.js) under webdriver
  await t.ctx.addInitScript(mockInit, { hp: !!o.hp });
  await t.p.goto(URL);
  await t.p.waitForSelector('#tNew, #tContinue, #tGuest, #tPlay');
  if (o.storage) { await t.p.click('#tContinue, #tPlay'); await t.untilMode('yard'); }
  else {
    if (await t.p.locator('#tGuest').count()) { await t.p.click('#tGuest'); await t.p.waitForSelector('#tNew'); }
    await t.adopt({});
    await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000 });
    await t.calm();
  }
  await t.until(() => !!(window.__paw && window.__paw.hp && window.__paw.fr && window.__frSrv), null, 8000);
  // my friend id and one friend (Sunny Biscuit), as the Worker would answer them; the list is read once (frLoad)
  await t.ev(([me, sunny]) => {
    const s = window.__frSrv; s.me = me; s.events = [];
    s.friends = [{ fid: sunny, name: [0, 0], dogs: s.yardOf[sunny].dogs, seen: 'today', sent: { pet: false, note: false, gift: false, walk: false } }];
  }, [ME, SUNNY]);
  await t.ev(() => window.__paw.hp.load());
}

run('v233_helps', async (t) => {
  const { ok, sec, ev } = t;

  sec('A0. the gate is shut while HP_FROM has no date (the mock Worker has hp)');
  await start(t, { hp: true });
  ok(await ev(() => window.__paw.hp.from === ''), 'HP_FROM is \'\' (no launch date yet)');
  ok(await ev(() => window.__paw.hp.srv() === true && window.__paw.hp.on() === false), 'the Worker said hp: 1, but hpOn() is off without the date (and under webdriver)');
  ok(await ev(() => !('hp' in window.__paw.hp.yard())), 'no hp field in the snapshot');
  await ev(() => window.__paw.hp.push());
  ok(await t.until(() => window.__frSrv.yards.length > 0, null, 4000) && (await ev(() => window.__frSrv.yards.every((y) => !('hp' in y)))), 'the snapshot sent has no hp');
  await ev(() => window.__paw.hp.inbox());
  ok(await ev(() => window.__frSrv.inboxQ.length > 0 && window.__frSrv.inboxQ.every((q) => q === '')), 'the inbox is asked without ?hp=1');
  const hp0 = await ev(() => window.__paw.S.hp);
  ok(hp0 && hp0.day === '' && hp0.bond === 0 && hp0.n === 0 && hp0.ids.length === 0 && hp0.sl.length === 0 && hp0.gu.length === 0 && hp0.slDay === '', 'S.hp holds only the defaults: ' + JSON.stringify(hp0));
  ok(await ev(() => { window.__paw.hp.day(); return window.__paw.S.hp.day === ''; }), 'hpDay writes nothing while off');
  ok(await ev(() => window.__paw.hp.test(true) === true), 'prefs.hpTest turns it on (the Worker has hp)');
  await t.ctx.close();

  sec('A1. an older Worker (no hp: 1) = v2.32.1: no hp anywhere, even with the test flag');
  await start(t, { hp: false, test: true });
  ok(await ev(() => window.__paw.hp.srv() === false && window.__paw.hp.on() === false), 'FR.hp stays false: hpOn() is off');
  ok(await ev(() => !('hp' in window.__paw.hp.yard())), 'no hp in the snapshot');
  await ev(() => { window.__frSrv.events = [{ id: 7, from: { fid: 'sunnybiscuitxxxxxxxxxx', name: [0, 0] }, kind: 'note', data: { i: 3 }, day: '2026-11-20', claimed: false }]; });
  await ev(() => window.__paw.hp.inbox());
  ok(await t.until(() => window.__frSrv.claimBodies.length >= 1, null, 4000), 'the note is claimed');
  ok(await ev(() => window.__frSrv.inboxQ.every((q) => q === '') && JSON.stringify(Object.keys(window.__frSrv.claimBodies[0])) === '["ids"]'), 'no ?hp=1, and the claim is { ids } only (the v2.32 shape)');
  ok(await ev(() => window.__frSrv.badHp === 0), 'nothing refused');
  // extra fields from a newer Worker are ignored by the list and the snapshot reader
  ok(await ev(() => { const y = window.__paw.fr.clean({ v: 1, name: [0, 0], house: 2, season: 'winter', dogs: [], decor: [], hp: { d: '2026-11-23', g: 1, w: 0 }, zz: 1 }); return !!y && !('zz' in y) && y.hp && y.hp.w === 0; }), 'frYardClean keeps a valid hp and drops unknown keys');
  ok(await ev(() => { const y = window.__paw.fr.clean({ v: 1, name: [0, 0], house: 2, season: 'winter', dogs: [], decor: [], hp: { d: 'x', g: 1 } }); return !!y && !('hp' in y); }), 'frYardClean drops a broken hp');
  ok(await ev(() => { const y = window.__paw.fr.clean({ v: 1, name: [0, 0], house: 2, season: 'winter', dogs: [], decor: [], hp: { d: '2026-11-23', g: 9, w: 99, a: 3 } }); return !!y && !('hp' in y); }), 'frYardClean drops an out-of-range hp');
  ok(await ev(() => { const y = window.__paw.fr.clean({ v: 1, name: [0, 0], house: 2, season: 'winter', dogs: [], decor: [], hp: { d: '2026-11-23', g: 0, w: 1, a: 3 } }); return !!y && y.hp.w === 1 && !('a' in y.hp); }), 'a only with a snack wish');

  sec('A2. migration: an old save without S.hp, and a broken S.hp');
  const planted = await ev(() => {
    window.__paw.saveNow();
    const raw = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete raw.hp;
    const bare = JSON.parse(JSON.stringify(raw)); window.__paw.hp.fields(bare);
    const broken = { hp: { day: 5, bond: 'x', gotB: 99, bowls: 99, n: -3, thx: 2.5, host: 4, ids: 'no', slDay: 'yesterday', sl: [null, 3, { day: '2026-11-01', my: 'a' }, { day: 'x' }], gu: {} } };
    window.__paw.hp.fields(broken);
    const many = { hp: { ids: Array.from({ length: 120 }, (_, i) => i + 1), sl: Array.from({ length: 14 }, (_, i) => ({ day: '2026-11-' + String(i + 1).padStart(2, '0') })), gu: [{ day: '2026-11-20' }, { day: '2026-11-21' }, { day: '2026-11-22' }] } };
    window.__paw.hp.fields(many);
    return { bare: bare.hp, broken: broken.hp, many: { ids: many.hp.ids.length, first: many.hp.ids[0], sl: many.hp.sl.length, gu: many.hp.gu.length }, json: JSON.stringify(raw), v: raw.v };
  });
  const b = planted.bare;
  ok(b && b.day === '' && b.bond === 0 && b.gotB === 0 && b.bowls === 0 && b.n === 0 && b.thx === 0 && b.host === 0 && b.slDay === '' && Array.isArray(b.ids) && Array.isArray(b.sl) && Array.isArray(b.gu), 'a save with no S.hp gets the defaults: ' + JSON.stringify(b));
  const k = planted.broken;
  ok(k.day === '' && k.bond === 0 && k.gotB === 5 && k.bowls === 3 && k.n === 0 && k.thx === 0 && k.host === 4 && k.slDay === '' && Array.isArray(k.ids) && !k.ids.length && k.sl.length === 1 && k.sl[0].my === 'a' && Array.isArray(k.gu) && !k.gu.length, 'a broken S.hp: wrong types get defaults, counters their caps: ' + JSON.stringify(k));
  ok(planted.many.ids === 90 && planted.many.first === 31 && planted.many.sl === 10 && planted.many.gu === 2, 'arrays are cut to their caps (ids 90, the newest; sl 10; gu 2): ' + JSON.stringify(planted.many));
  ok(planted.v === 1, 'the save stays v: 1');
  await t.ctx.close();
  await start(t, { hp: true, test: true, storage: { pawhaven_proto_v1: planted.json } });
  ok(await ev(() => { const h = window.__paw.S.hp; return !!h && Array.isArray(h.ids) && h.n === 0 && window.__paw.S.v === 1; }), 'the old save loads with S.hp');
  ok(await ev(() => window.__paw.S.fr.fid === 'ownerxxxxxxxxxxxxxxxxx' && window.__paw.hp.on() === true), 'Friends and the gate are on (the Worker has hp)');
  ok(await ev(() => window.__paw.hp.day() === new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10)), 'hpDay starts the day once on');

  sec('A3. the snapshot\'s hp: d, g, w, a');
  const today = await ev(() => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
  const snapWith = (wish) => ev((w) => {
    window.__paw.hp.snap(); // today's wish table first (ddWishes starts a new day's)
    const S = window.__paw.S, d = S.dog, W = S.dd && S.dd.wish;
    if (W) { W.w[d.id] = w; }
    return window.__paw.hp.snap();
  }, wish);
  let h = await snapWith({ k: 'pet', a: null, done: 0 });
  ok(h.d === today && Number.isInteger(h.g) && h.w === 0 && !('a' in h), 'a pet wish: w 0 (' + JSON.stringify(h) + ')');
  h = await snapWith({ k: 'snack', a: 'Basic Kibble', done: 0 });
  ok(h.w === 2 && h.a === 0, 'a snack naming Basic Kibble: w 2, a 0');
  h = await snapWith({ k: 'snack', a: null, done: 0 });
  ok(h.w === 2 && !('a' in h), 'a snack naming no food: w 2 alone');
  h = await snapWith({ k: 'snack', a: 'Golden Bone', done: 0 });
  ok(!('w' in h) && !('a' in h), 'a snack naming a food that is no gift (Golden Bone): no w');
  h = await snapWith({ k: 'walk', a: 'park', done: 0 });
  ok(h.w === 3, 'a walk wish (for home): w 3');
  h = await snapWith({ k: 'ball', a: null, done: 1 });
  ok(!('w' in h), 'a wish already done: no w');
  const garden = await ev(() => {
    const S = window.__paw.S; S.gkEarly = true;
    const pl = S.garden.plots; pl.forEach((p) => { p.crop = null; p.g = 0; });
    pl[0].crop = 'carrot'; pl[0].g = 0.4; pl[1].crop = 'peas'; pl[1].g = 1; pl[2].crop = 'peas'; pl[2].g = 0;
    const a = window.__paw.hp.snap().g;
    pl.forEach((p) => { p.crop = null; p.g = 0; });
    return { a, b: window.__paw.hp.snap().g };
  });
  ok(garden.a === 2 && garden.b === 0, 'g counts the plots with a crop that is not ready (2), 0 when nothing grows: ' + JSON.stringify(garden));
  const y = await ev(() => window.__paw.hp.yard());
  ok(y.hp && y.hp.d === today && Object.keys(y).join() === 'v,name,house,season,dogs,decor,hp', 'frYard carries hp last: ' + JSON.stringify(y.hp));
  await ev(() => { window.__frSrv.yards = []; return window.__paw.hp.push(); });
  ok(await t.until(() => window.__frSrv.yards.length === 1 && !!window.__frSrv.yards[0].hp, null, 4000), 'the pushed snapshot has hp, and the mock Worker takes it');

  sec('A4. a Worker that went back: the snapshot is sent again without hp, for the rest of the load');
  await ev(() => { window.__frSrv.hp = false; window.__frSrv.yards = []; });
  const pushed = await ev(() => window.__paw.hp.push());
  ok(pushed === true && (await ev(() => window.__frSrv.badHp === 1 && window.__frSrv.yards.length === 1 && !('hp' in window.__frSrv.yards[0]))), 'bad, then the same yard without hp: ok');
  ok(await ev(() => window.__paw.hp.old() === true && !('hp' in window.__paw.hp.yard())), 'FR.hpOld: no hp for the rest of the load');
  await ev(() => window.__paw.hp.push());
  ok(await ev(() => window.__frSrv.badHp === 1 && window.__frSrv.yards.length === 2), 'the next snapshot goes without hp at once');
  await ev(() => window.__paw.hp.load());
  ok(await ev(() => window.__paw.hp.srv() === false && window.__paw.hp.on() === false), 'the next GET /friends without hp: 1 turns hpOn() off');
  await ev(() => { window.__frSrv.hp = true; window.__paw.hp.old(false); });
  await ev(() => window.__paw.hp.load());
  ok(await ev(() => window.__paw.hp.on() === true), 'hp: 1 again: on');

  sec('A5. ?hp=1, the acts and the claim');
  await ev((sunny) => {
    const s = window.__frSrv, from = { fid: sunny, name: [0, 0] }, day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    s.inboxQ = []; s.claimBodies = [];
    s.events = [{ id: 30, from, kind: 'note', data: { i: 12 }, day, claimed: false }];
    s.acts = [{ id: 41, from, kind: 'bowl', data: {}, day, claimed: false }, { id: 42, from, kind: 'sleep', data: { dog: { b: 0, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 0 } }, day, claimed: false },
      { id: 43, from, kind: 'water', data: {}, day, claimed: false }, { id: 44, from, kind: 'hug', data: {}, day, claimed: false }];
  }, SUNNY);
  await ev(() => window.__paw.hp.inbox());
  ok(await t.until(() => window.__frSrv.claimBodies.length >= 1, null, 4000), 'one claim');
  const c1 = await ev(() => ({ q: window.__frSrv.inboxQ.slice(), body: window.__frSrv.claimBodies[0], ids: window.__paw.S.hp.ids.slice(), claimed: window.__frSrv.acts.filter((a) => a.claimed).map((a) => a.id), badge: window.__paw.fr.badge() }));
  ok(c1.q.join() === '?hp=1', 'the inbox is asked with ?hp=1');
  ok(JSON.stringify(c1.body) === JSON.stringify({ ids: [30], acts: [41, 43, 44, 42] }), 'the claim is { ids, acts } (sleepovers last, as the Worker sends them; an unknown kind is claimed and dropped): ' + JSON.stringify(c1.body));
  ok(c1.ids.join() === '41,43,44,42' && c1.claimed.length === 4 && c1.badge === 0, 'the act ids are kept in S.hp.ids, all claimed, nothing on the badge');
  ok(await ev(() => (window.__paw.S.mail || []).some((m) => m && m.id === 'fr_note_30' && m.text === 'Thank you for helping!')), 'note 12 arrives as a postcard: "Thank you for helping!"');

  // a claim that does not reach the Worker: the act comes back and is only claimed again
  await ev((sunny) => {
    const s = window.__frSrv, day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
    s.claimBodies = []; s.failClaim = true; s.acts.push({ id: 45, from: { fid: sunny, name: [0, 0] }, kind: 'wish', data: { w: 0 }, day, claimed: false });
  }, SUNNY);
  await ev(() => window.__paw.hp.inbox());
  ok(await t.until(() => window.__frSrv.claimBodies.length >= 1, null, 4000) && (await ev(() => window.__paw.S.hp.ids.filter((x) => x === 45).length === 1 && !window.__frSrv.acts.find((a) => a.id === 45).claimed)), 'the failed claim: act 45 applied and kept, still unclaimed at the Worker');
  ok(await ev(() => JSON.parse(localStorage.getItem('pawhaven_proto_v1')).hp.ids.includes(45)), 'saved on this device before the claim');
  await ev(() => { window.__frSrv.failClaim = false; window.__frSrv.claimBodies = []; });
  await ev(() => window.__paw.hp.inbox());
  ok(await t.until(() => window.__frSrv.claimBodies.length >= 1, null, 4000), 'the next look claims it again');
  ok(await ev(() => JSON.stringify(window.__frSrv.claimBodies[0]) === '{"ids":[],"acts":[45]}' && window.__paw.S.hp.ids.filter((x) => x === 45).length === 1 && window.__frSrv.acts.find((a) => a.id === 45).claimed), 'act 45 claimed once, never applied twice');
  const twice = await ev(() => { let n = 0; window.__paw.hp.fields(window.__paw.S); const r = window.__paw.hp.acts([{ id: 45, kind: 'bowl', from: { fid: 'x', name: [0, 0] }, day: '2026-11-23' }, { id: 0, kind: 'bowl' }, null, { id: 46, kind: 'bowl', from: { fid: 'x', name: [0, 0] }, day: '2026-11-23' }]); n = r.n; return { n, claim: r.claim }; });
  ok(twice.n === 1 && twice.claim.join() === '45,46', 'hpActs: an applied id is only claimed, a broken act is skipped: ' + JSON.stringify(twice));
  // no acts: the claim stays the v2.32 shape
  await ev((sunny) => { const s = window.__frSrv; s.claimBodies = []; s.events.push({ id: 31, from: { fid: sunny, name: [0, 0] }, kind: 'pet', data: {}, day: '2026-11-22', claimed: false }); }, SUNNY);
  await ev(() => window.__paw.hp.inbox());
  ok(await t.until(() => window.__frSrv.claimBodies.length >= 1, null, 4000) && (await ev(() => JSON.stringify(window.__frSrv.claimBodies[0]) === '{"ids":[31]}')), 'no acts: the claim is { ids } only');
  ok(await ev(() => !window.__frSrv.unknown.some((x) => /friends/.test(x))), 'no Friends request the mock does not know: ' + JSON.stringify(await ev(() => window.__frSrv.unknown)));
});
