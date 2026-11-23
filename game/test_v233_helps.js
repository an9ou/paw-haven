// v2.33 "Helping paws" (V233.md 13): the game half, against the Friends cloud mock (game/fr_mock.js) with and without hp.
//   node game/run_tests.js v233_helps
// Part 1 (V233.md 14.1, the plumbing): the gate off (no hp field, no ?hp=1, S.hp only the defaults), an older Worker = v2.32.1 behaviour, the
// migration of an old save and of a broken S.hp, the snapshot's hp (d, g, w, a; a done wish or a snack that is no gift sends no w) and the
// retry without it on bad, ?hp=1 and the claim (acts applied once across a failed claim), note 12. Parts 2-4 add their sections below.
const { run, URL } = require('./test_lib');
const { mockInit } = require('./fr_mock');

const ME = { fid: 'ownerxxxxxxxxxxxxxxxxx', code: 'DOG-23456', name: [3, 4] };
const SUNNY = 'sunnybiscuitxxxxxxxxxx', FERN = ('cozyfern' + 'x'.repeat(22)).slice(0, 22), CLOVER = ('happyclover' + 'x'.repeat(22)).slice(0, 22);
const SHOTS = process.env.HP_SHOTS || ''; // HP_SHOTS: a folder for the part 2 screenshots (none by default)

// a game with Friends on (prefs.frTest + the mock). o.hp: the mock is a Worker with the gate open; o.test: prefs.hpTest (the game's gate)
async function start(t, o) {
  o = o || {};
  await t.mk(Object.assign({ prefs: Object.assign({ frTest: true, ddTest: true }, o.test ? { hpTest: true } : {}), storage: o.storage || null }, o.vw ? { device: 'iPhone 15' } : {}, o.lang ? { lang: o.lang } : {})); // ddTest: the daily wish (48_dogdays.js) under webdriver
  if (o.vw) await t.p.setViewportSize({ width: o.vw, height: o.vh }); // part 2: phones (touch, 360x640 and 390x844)
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
  if (process.env.HP_ONLY === '3') { await sleepPart(t); for (const [w, h, l] of [[360, 640], [390, 844], [360, 640, 'de'], [390, 844, 'th']]) await sleepPhone(t, w, h, l); return; } // a quick run of part 3 only

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
  await t.ctx.close();

  /* ======================= part 2 (V233.md 3.1-3.3, 8, 9): the three helps ======================= */
  await helpsPart(t);
  await claimPart(t);
  for (const [w, h] of [[360, 640], [390, 844]]) await phonePart(t, w, h);

  /* ======================= part 3 (V233.md 4): the sleepover ======================= */
  await sleepPart(t);
  for (const [w, h, l] of [[360, 640], [390, 844], [360, 640, 'de'], [390, 844, 'th']]) await sleepPhone(t, w, h, l);
});

// three friends, each with a yard (Happy Clover gets one here); the Worker has hp and the game's gate is on
async function startHelps(t, o) {
  await start(t, Object.assign({ hp: true, test: true }, o || {}));
  await t.ev(([ids, me]) => {
    const s = window.__frSrv, [sunny, fern, clover] = ids;
    s.yardOf[clover] = { v: 1, name: [1, 6], house: 1, season: 'autumn', dogs: [{ b: 2, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 2 }], decor: [] };
    s.friends = [[sunny, [0, 0]], [fern, [2, 11]], [clover, [1, 6]]].map(([fid, name]) => ({ fid, name, dogs: s.yardOf[fid].dogs, seen: 'today', sent: { pet: false, note: false, gift: false, walk: false } }));
    s.me = me;
  }, [[SUNNY, FERN, CLOVER], ME]);
  await t.ev(() => window.__paw.hp.load());
}
const jst = (t) => t.ev(() => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
// a visit to fid with this snapshot hp (null: none); waits for the strip
async function visit(t, fid, hp) {
  await t.ev(([f, h]) => { const y = window.__frSrv.yardOf[f]; if (h) y.hp = h; else delete y.hp; }, [fid, hp]);
  await t.ev((f) => window.__paw.fr.visit(f), fid);
  return t.until((f) => window.__paw.mode === 'fryard' && window.__paw.fr.scene().fid === f && window.__paw.hp.visit().on && !!document.querySelector('#view .hp-bowl:not([style*="none"])'), fid, 8000);
}
const vis = (t) => t.ev(() => window.__paw.hp.visit());
const toasts0 = (t) => t.ev(() => { window.__toasts.length = 0; });
async function shot(t, name) { if (!SHOTS) return; try { require('fs').mkdirSync(SHOTS, { recursive: true }); await t.p.screenshot({ path: require('path').join(SHOTS, name + '.png') }); } catch (e) { /* no folder */ } }

async function helpsPart(t) {
  const { ok, sec, ev } = t;
  sec('B1. the strip: three buttons, the resting can, no wish button for a home wish (gate on, the Worker has hp)');
  await startHelps(t);
  const today = await jst(t);
  ok(await visit(t, SUNNY, { d: today, g: 2, w: 1 }), 'a visit to Sunny Biscuit (something grows, a ball wish) shows the strip');
  let v = await vis(t);
  ok(v.strip.map((b) => b.k).join() === 'bowl,water,wish' && v.strip.every((b) => !b.done && !b.rest), 'the strip: bowl, can, wish, none done: ' + JSON.stringify(v.strip));
  ok(v.props.slice().sort().join() === 'bowl,water' && /"patch":"growing"/.test(v.patch), 'the scene: the bowl and the can, the veggie patch growing: ' + v.props.join() + ' ' + v.patch);
  ok(v.bubble && !v.bubble.hidden && !v.bubble.home && /Today I wish for a game of ball/.test(v.bubble.text), 'the wish bubble over their leader: ' + JSON.stringify(v.bubble));
  ok(await ev(() => { const s = document.getElementById('hpStrip').getBoundingClientRect(), c = document.getElementById('status').getBoundingClientRect(); return s.top >= c.bottom && s.top - c.bottom < 20 && Math.abs(s.left - c.left) < 12; }), 'the strip sits under the place chip');
  ok(await ev(() => [...document.querySelectorAll('#hpStrip .hp-b')].every((b) => { const r = b.getBoundingClientRect(); return r.width >= 44 && r.height >= 44; })), 'its buttons are 44 px');
  ok(await ev(() => { const c = window.__paw.fr.crop(); return c.boxes.length > 0 && !!window.__paw.hp.spots().at; }), 'the bowl is put down after the dogs stand');
  // no dog drawn over the bowl, unless the bowl stands in front of it (the bowl is then drawn over the dog: #hpTop)
  const over = await ev(() => {
    const b = document.querySelector('#view .hp-bowl').getBoundingClientRect(), top = !!document.querySelector('#hpTop .hp-bowl');
    const hits = [...document.querySelectorAll('#frDogs .frdog .fr-art')].map((e) => e.getBoundingClientRect()).filter((r) => r.left < b.right - 4 && r.right > b.left + 4 && r.top < b.bottom - 4 && r.bottom > b.top + 4);
    return { top, n: hits.length };
  });
  ok(over.n === 0 || over.top, 'no dog is drawn over the bowl: ' + JSON.stringify(over));
  await shot(t, 'strip_1280');

  sec('B2. the bowl: one send, +1 Bond, the tick, the full bowl; a second tap says done');
  await toasts0(t);
  const b0 = await ev(() => ({ pts: window.__paw.S.bond.pts, n: window.__paw.S.hp.n, bond: window.__paw.S.hp.bond, gift: window.__paw.S.fr.gift }));
  ok(await ev(() => window.__paw.hp.tap('bowl', 'strip')), 'Fill the bowl: ok');
  let st = await ev(() => ({ sent: window.__frSrv.sent.filter((x) => x.kind === 'bowl'), pts: window.__paw.S.bond.pts, n: window.__paw.S.hp.n, bond: window.__paw.S.hp.bond, v: window.__paw.hp.visit() }));
  ok(st.sent.length === 1 && st.sent[0].fid === SUNNY && JSON.stringify(st.sent[0].data) === '{}', 'one bowl send to Sunny Biscuit, data {}: ' + JSON.stringify(st.sent));
  ok(st.n === b0.n + 1 && st.bond === b0.bond + 1 && st.pts === b0.pts + 1, '+1 help, +1 Bond (its own count): ' + JSON.stringify([b0, st.n, st.bond, st.pts]));
  ok(await t.waitToast(/helped out! \+1 Bond/), 'the toast "… helped out! +1 Bond"');
  ok(st.v.strip.find((b) => b.k === 'bowl').done, 'the bowl button has its tick');
  ok(await t.until(() => /Basic Kibble|kibble/i.test(document.querySelector('#view .hp-bowlart').innerHTML) || document.querySelector('#view .hp-bowlart').innerHTML.length > 2000, null, 3000), 'the bowl is full');
  ok(await t.until(() => !document.querySelector('#fx .hp-fx'), null, 3000), 'the scoop and kibble are gone after the pour');
  await toasts0(t);
  ok((await ev(() => window.__paw.hp.tap('bowl', 'prop'))) === false && (await t.waitToast(/You did that today/)), 'a second tap (the scene bowl): "You did that today. Come back tomorrow!"');
  ok(await ev(() => window.__frSrv.sent.filter((x) => x.kind === 'bowl').length === 1), 'no second send');

  sec('B3. the ball wish: the send, the arc, their leader glad; the bubble says the wish came true');
  await toasts0(t);
  ok(await ev(() => window.__paw.hp.tap('wish', 'bubble')), 'the bubble tapped: ok');
  ok(await ev(() => { const s = window.__frSrv.sent.filter((x) => x.kind === 'wish'); return s.length === 1 && JSON.stringify(s[0].data) === '{"w":1}'; }), 'one wish send { w: 1 }');
  ok(await ev(() => !!document.querySelector('#fx .hp-ball')), 'the ball arcs');
  ok(await t.until(() => { const b = window.__paw.hp.visit().bubble; return b && b.done && /Wish come true/.test(b.text); }, null, 3000), 'the bubble: "Wish come true!"');
  await shot(t, 'ball_1280');

  sec('B4. water: the send, the tilt and the drops; the cap of 5 helper Bond a day');
  await ev(() => { window.__paw.S.hp.bond = 4; });
  const p1 = await ev(() => window.__paw.S.bond.pts);
  ok(await ev(() => window.__paw.hp.tap('water', 'strip')), 'Water the garden: ok');
  ok(await ev(() => !!document.querySelector('#fx .hp-fx .hp-drop')), 'four drops fall');
  ok(await ev((p) => window.__paw.S.hp.bond === 5 && window.__paw.S.bond.pts === p + 1, p1), 'the fifth help Bond today: +1');
  await t.until(() => !document.querySelector('#fx .hp-fx'), null, 3000);

  sec('B5. a resting can and a home wish (Cozy Fern: nothing grows, a walk wish); the cap reached: no Bond');
  ok(await visit(t, FERN, { d: today, g: 0, w: 3 }), 'a visit to Cozy Fern');
  v = await vis(t);
  ok(v.strip.map((b) => b.k).join() === 'bowl,water' && v.strip[1].rest, 'no wish button for a home wish, the can rests: ' + JSON.stringify(v.strip));
  ok(v.props.join() === 'bowl' && /"patch":"empty"/.test(v.patch), 'no can in the scene, the patch empty');
  ok(await ev(() => document.querySelector('#hpStrip [data-hpk="water"]').getAttribute('aria-disabled') === 'true'), 'the resting can is aria-disabled');
  ok(v.bubble && v.bubble.home && /Today I wish for a walk/.test(v.bubble.text), 'the bubble still shows the home wish: ' + JSON.stringify(v.bubble));
  await toasts0(t);
  ok((await ev(() => window.__paw.hp.tap('water', 'strip'))) === false && (await t.waitToast(/The garden is resting/)), 'the can: "The garden is resting."');
  ok((await ev(() => window.__paw.hp.tap('wish', 'bubble'))) === false && (await t.waitToast(/That wish is one for home/)), 'the bubble: "That wish is one for home."');
  ok(await ev(() => !window.__frSrv.sent.some((x) => x.fid === window.__paw.fr.scene().fid)), 'nothing sent');
  const p2 = await ev(() => window.__paw.S.bond.pts);
  await toasts0(t);
  ok(await ev(() => window.__paw.hp.tap('bowl', 'strip')), 'the bowl at Cozy Fern: ok');
  ok(await ev((p) => window.__paw.S.hp.bond === 5 && window.__paw.S.bond.pts === p, p2), 'no Bond past 5 a day');
  ok(await t.waitToast(/helped out!$/), 'the toast has no Bond part at the cap');
  ok(await ev(() => window.__paw.S.hp.n === 4), 'four helps given: ' + (await ev(() => window.__paw.S.hp.n)));
  // a stale snapshot (another day): the can rests, no bubble
  ok(await visit(t, FERN, { d: '2026-01-01', g: 3, w: 0 }), 'a snapshot from another day');
  v = await vis(t);
  ok(v.strip.find((b) => b.k === 'water').rest && !v.strip.some((b) => b.k === 'wish') && !v.bubble, 'yesterday\'s snapshot: the can rests, no wish');
  // no snapshot hp at all (an older copy of the friend's game): the bowl only
  ok(await visit(t, FERN, null), 'a snapshot without hp');
  v = await vis(t);
  ok(v.strip.find((b) => b.k === 'water').rest && !v.bubble && v.props.join() === 'bowl', 'no hp: the bowl, a resting can, no wish');

  sec('B6. limit (sent on another device): done, quietly; offline: nothing changes');
  ok(await visit(t, CLOVER, { d: today, g: 1, w: 0 }), 'a visit to Happy Clover (a pet wish)');
  await ev((f) => { window.__frSrv.sent.push({ fid: f, kind: 'water', data: {} }); }, CLOVER);
  const n0 = await ev(() => window.__paw.S.hp.n);
  await toasts0(t);
  await ev(() => window.__paw.hp.tap('water', 'prop'));
  ok(await ev((n) => window.__paw.S.hp.n === n && window.__paw.hp.visit().strip.find((b) => b.k === 'water').done && !window.__toasts.some((x) => /helped/.test(x)), n0), 'limit: the can is ticked, no help counted, no toast');
  await ev(() => { window.__frSrv.offline = true; });
  await toasts0(t);
  await ev(() => window.__paw.hp.tap('bowl', 'strip'));
  ok(await t.waitToast(/internet connection/) && (await ev((n) => window.__paw.S.hp.n === n && !window.__paw.hp.visit().strip.find((b) => b.k === 'bowl').done, n0)), 'offline: the Friends offline toast, nothing changes');
  await ev(() => { window.__frSrv.offline = false; });

  sec('B7. the pet wish: the pet first (its own pet event), then the wish');
  const pets0 = await ev((f) => window.__frSrv.sent.filter((x) => x.fid === f && x.kind === 'pet').length, CLOVER);
  ok(await ev(() => window.__paw.hp.tap('wish', 'strip')), 'Make the wish come true: ok');
  ok(await t.until((f) => window.__frSrv.sent.filter((x) => x.fid === f && x.kind === 'pet').length === 1, CLOVER, 3000) && pets0 === 0, 'the pet event went too (not sent today before)');
  ok(await ev((f) => { const s = window.__frSrv.sent.filter((x) => x.fid === f && x.kind === 'wish'); return s.length === 1 && s[0].data.w === 0; }, CLOVER), 'the wish { w: 0 }');

  sec('B8. reduced motion: the bowl just fills, no scoop');
  await ev(() => { document.documentElement.dataset.motion = 'off'; });
  ok(await ev(() => window.__paw.hp.tap('bowl', 'strip')), 'the bowl at Happy Clover: ok');
  ok(await ev(() => !document.querySelector('#fx .hp-scoop') && !document.querySelector('#fx .hp-kib') && document.querySelector('#view .hp-bowlart').innerHTML.length > 0), 'no scoop or kibble, the bowl full at once');
  await ev(() => { delete document.documentElement.dataset.motion; });
  await t.ctx.close();

  sec('B9. the snack wish: only the named food; the bag only after ok; not the day\'s gift');
  await startHelps(t);
  const day2 = await jst(t);
  await ev(() => { const inv = window.__paw.S.inv; inv.food = { 'Basic Kibble': 2, 'Bone-shaped Biscuit': 1, 'Carrot Sticks': 3 }; inv.seeds = { carrot: 2 }; });
  ok(await visit(t, SUNNY, { d: day2, g: 0, w: 2, a: 0 }), 'Sunny Biscuit wishes for Basic Kibble');
  ok(await ev(() => window.__paw.hp.tap('wish', 'strip')) && (await t.until(() => !!document.querySelector('#modal .hp-snacksheet'), null, 3000)), 'the wish button opens the snack sheet');
  ok(await ev(() => [...document.querySelectorAll('#modal [data-hpsnack]')].map((b) => +b.dataset.hpsnack).join() === '0'), 'only Basic Kibble is offered');
  ok(await ev(() => /wishes for Basic Kibble, please/.test(document.querySelector('#modal .hp-snack').textContent)), 'the lead names the wish');
  await shot(t, 'snack_1280');
  await ev(() => { window.__frSrv.failSend = true; });
  await t.p.click('#modal [data-hpsnack="0"]');
  await t.p.waitForSelector('#modal .confirm .btn.yes, #modal .confirm button');
  ok(await ev(() => /Give 1 Basic Kibble to/.test(document.querySelector('#modal').textContent)), 'the ask: "Give 1 Basic Kibble to …?"');
  await t.p.click('#modal .confirm .btn.yes');
  ok(await t.waitToast(/internet connection/) && (await ev(() => window.__paw.S.inv.food['Basic Kibble'] === 2)), 'a send that fails: the bag stays');
  await ev(() => { window.__frSrv.failSend = false; });
  if (!(await ev(() => !!document.querySelector('#modal .hp-snacksheet')))) await ev(() => window.__paw.hp.snack());
  await t.p.click('#modal [data-hpsnack="0"]');
  await t.p.waitForSelector('#modal .confirm .btn.yes');
  await t.p.click('#modal .confirm .btn.yes');
  ok(await t.until(() => window.__paw.S.inv.food['Basic Kibble'] === 1 && document.getElementById('modal').hidden, null, 4000), 'ok: one Basic Kibble leaves the bag, the sheet closes');
  ok(await ev(() => { const s = window.__frSrv.sent.filter((x) => x.kind === 'wish'); return s.length === 1 && s[0].data.w === 2 && s[0].data.a === 0; }), 'the wish { w: 2, a: 0 }');
  ok(await ev(() => window.__paw.S.fr.gift === false && window.__paw.fr.giftUsed() === false), 'not the day\'s gift (S.fr.gift untouched)');
  // a snack wish naming no food: every food in the bag (no seeds); an empty bag says so
  ok(await visit(t, FERN, { d: day2, g: 0, w: 2 }), 'Cozy Fern wishes for a crunchy snack');
  await ev(() => window.__paw.hp.snack());
  ok(await ev(() => [...document.querySelectorAll('#modal [data-hpsnack]')].map((b) => +b.dataset.hpsnack).sort((a, b) => a - b).join() === [0, 'Bone-shaped Biscuit', 'Carrot Sticks'].map((n) => n === 0 ? 0 : window.__paw.fr.lists().gifts.indexOf(n)).sort((a, b) => a - b).join()), 'every food in the bag, no seeds');
  await t.closeX(); await t.modalGone();
  await ev(() => { window.__paw.S.inv.food = {}; });
  await ev(() => window.__paw.hp.snack());
  ok(await ev(() => /No treats in your bag right now/.test(document.querySelector('#modal .hp-snack').textContent)), 'an empty bag: "No treats in your bag right now."');
  await t.closeX(); await t.modalGone();
  ok(await visit(t, CLOVER, { d: day2, g: 0, w: 2, a: 1 }), 'Happy Clover wishes for a food I do not have');
  await ev(() => window.__paw.hp.snack());
  ok(await ev(() => /You don't have .+ in your bag/.test(document.querySelector('#modal .hp-snack').textContent)), '"You don\'t have … in your bag."');
  await t.closeX(); await t.modalGone();

  sec('B10. a Worker that went back: 400 bad on a new kind turns the helps off for the load');
  await ev(() => { window.__frSrv.hp = false; });
  await toasts0(t);
  await ev(() => window.__paw.hp.tap('bowl', 'strip'));
  ok(await t.waitToast(/That didn't reach Happy Clover/), 'the toast "That didn\'t reach Happy Clover. Try again later."');
  ok(await ev(() => window.__paw.hp.on() === false && window.__paw.hp.gone() === true && !document.getElementById('hpStrip') && !document.querySelector('#view .hp-bowl') && !document.getElementById('hpWish')), 'no strip, props or bubble any more; hpOn() off');
  await ev(() => window.__paw.hp.load()); // even a later list (the mock says hp again) keeps it off for the load
  ok(await ev(() => { window.__frSrv.hp = true; return true; }) && (await ev(() => window.__paw.hp.load().then(() => window.__paw.hp.on()))) === false, 'off for the rest of the load');
  await ev(() => window.__paw.hp.gone(false));
  ok(await ev(() => window.__paw.hp.on() === true), 'the test hook turns it back on');
  ok(await ev(() => !window.__frSrv.unknown.some((x) => /friends/.test(x))), 'no Friends request the mock does not know');
  await t.ctx.close();
}

async function claimPart(t) {
  const { ok, sec, ev } = t;
  sec('C1. the claim: one letter per helper per Japan day, bowl +20 (3 a day, at most 100), water every growing plot');
  await startHelps(t);
  const today = await jst(t);
  await ev(() => { const S = window.__paw.S; S.gkEarly = true; S.stats.hunger = 50; const pl = S.garden.plots; pl.forEach((p) => { p.crop = null; p.g = 0; p.water = 0; }); pl[0].crop = 'carrot'; pl[0].g = 0.2; pl[1].crop = 'peas'; pl[1].g = 0.1; pl[2].crop = 'peas'; pl[2].g = 1; });
  const act = (id, fid, name, kind, data, day) => ({ id, from: { fid, name }, kind, data: data || {}, day: day || today, claimed: false });
  await ev((acts) => { window.__frSrv.acts = acts; window.__frSrv.claimBodies = []; }, [act(101, SUNNY, [0, 0], 'bowl'), act(102, SUNNY, [0, 0], 'water'), act(103, FERN, [2, 11], 'bowl')]);
  await ev(() => window.__paw.hp.inbox());
  ok(await t.until(() => window.__frSrv.claimBodies.length >= 1, null, 4000), 'claimed');
  let L = await ev((d) => { const S = window.__paw.S; const m = S.mail.filter((x) => x && /^hp_help_/.test(x.id)); return { m: m.map((x) => ({ id: x.id, title: x.title, text: x.text, ps: x.ps, read: x.read, kind: x.kind })), hunger: S.stats.hunger, bowls: S.hp.bowls, plots: S.garden.plots.slice(0, 3).map((p) => [p.water, p.wd]) }; }, today);
  ok(L.m.length === 2 && L.m.some((x) => x.id === 'hp_help_' + today + '_' + SUNNY) && L.m.some((x) => x.id === 'hp_help_' + today + '_' + FERN), 'two letters, one per helper: ' + L.m.map((x) => x.id).join());
  const sunL = L.m.find((x) => x.id.endsWith(SUNNY));
  ok(/^Sunny Biscuit helped out!$/.test(sunL.title) && /^Sunny Biscuit stopped by: filled .+'s bowl and watered the garden\.$/.test(sunL.text) && sunL.kind === 'postcard', 'the letter: "' + sunL.title + '" / "' + sunL.text + '"');
  ok(/\+20 Hunger\./.test(sunL.ps) && /Every growing plot is watered\./.test(sunL.ps), 'its PS: ' + sunL.ps);
  ok(L.hunger > 89.9 && L.hunger <= 90 && L.bowls === 2, 'two bowls: +40 Hunger (50 -> 90, less the minutes gone by): ' + L.hunger);
  ok(L.plots[0][0] === 3 && L.plots[0][1] === 0 && L.plots[1][0] === 3 && L.plots[2][0] !== 3, 'every growing plot gets 3 drops, a ready one not: ' + JSON.stringify(L.plots));
  // a later read that day: the same letter grows and is unread again; the third bowl tops up (to 100), a fourth gives the letter only
  await ev(() => { const m = window.__paw.S.mail.find((x) => /^hp_help_/.test(x.id)); window.__paw.S.mail.forEach((x) => { x.read = true; }); });
  await ev((acts) => { window.__frSrv.acts.push(...acts); }, [act(104, SUNNY, [0, 0], 'wish', { w: 1 }), act(105, CLOVER, [1, 6], 'bowl'), act(106, CLOVER, [1, 6], 'water')]);
  await ev(() => { const S = window.__paw.S; S.garden.plots.forEach((p) => { p.crop = null; }); });
  await ev(() => window.__paw.hp.inbox());
  await t.until(() => window.__frSrv.acts.every((a) => a.claimed), null, 4000);
  L = await ev(() => { const S = window.__paw.S; return { m: S.mail.filter((x) => /^hp_help_/.test(x.id)).map((x) => ({ id: x.id, text: x.text, ps: x.ps || '', read: x.read })), hunger: S.stats.hunger, bowls: S.hp.bowls }; });
  const sun2 = L.m.find((x) => x.id.endsWith(SUNNY)), clo = L.m.find((x) => x.id.endsWith(CLOVER));
  ok(L.m.length === 3 && !sun2.read && /filled .+'s bowl, watered the garden and made .+'s wish come true\./.test(sun2.text), 'the same letter grows and is unread again: ' + sun2.text);
  ok(L.hunger > 99.9 && L.hunger <= 100 && L.bowls === 3, 'the third bowl (Happy Clover\'s): Hunger to 100, never past: ' + L.hunger);
  ok(/\+20 Hunger\./.test(clo.ps) && !/watered\./.test(clo.ps), 'Happy Clover\'s water with nothing growing: the letter only: "' + clo.ps + '"');
  const h0 = await ev(() => { const S = window.__paw.S; S.stats.hunger = 40; return S.stats.hunger; });
  await ev((a) => { window.__frSrv.acts.push(a); }, act(107, FERN, [2, 11], 'bowl'));
  await ev(() => window.__paw.hp.inbox());
  await t.until(() => window.__frSrv.acts.every((a) => a.claimed), null, 4000);
  ok(await ev((h) => window.__paw.S.stats.hunger <= h && window.__paw.S.hp.bowls === 3 && /stopped by: filled/.test(window.__paw.S.mail.find((x) => x.id.indexOf('hp_help_') === 0 && x.id.endsWith('cozyfernxxxxxxxxxxxxxx')).text), h0), 'a fourth bowl today: the letter only, no Hunger');

  sec('C2. the wish: granted once with ddWishDone; a second one (or another kind, or another day) gives +1 Bond to 5');
  await ev(() => { window.__paw.hp.snap(); const S = window.__paw.S; S.dd.wish.w[S.dog.id] = { k: 'ball', a: null, done: 0 }; });
  const w0 = await ev(() => ({ wn: window.__paw.S.dd.wn, pts: window.__paw.S.bond.pts }));
  await ev((a) => { window.__frSrv.acts.push(a); }, act(110, FERN, [2, 11], 'wish', { w: 1 }));
  await ev(() => window.__paw.hp.inbox());
  ok(await t.until((wn) => { const S = window.__paw.S; return S.dd.wish.w[S.dog.id].done === 1 && S.dd.wn === wn + 1; }, w0.wn, 4000), 'the ball wish came true (ddWishDone: done, the wish count)');
  ok(await t.until((p) => window.__paw.S.bond.pts > p, w0.pts, 4000) && (await t.waitToast(/Wish come true!/)), 'its double Bond and the wish toast');
  ok(await ev((id) => /'s wish came true!/.test(window.__paw.S.mail.find((x) => x.id === id).ps), 'hp_help_' + today + '_' + FERN), 'the letter\'s PS: the wish came true');
  const g0 = await ev(() => ({ gotB: window.__paw.S.hp.gotB, pts: window.__paw.S.bond.pts }));
  await ev((list) => { window.__frSrv.acts.push(...list); }, [act(111, CLOVER, [1, 6], 'wish', { w: 1 }), act(112, SUNNY, [0, 0], 'wish', { w: 0 }, '2026-01-02')]);
  await ev(() => window.__paw.hp.inbox());
  await t.until(() => window.__frSrv.acts.every((a) => a.claimed), null, 4000);
  ok(await t.until((g) => window.__paw.S.hp.gotB === g.gotB + 2 && window.__paw.S.bond.pts === g.pts + 2, g0, 3000), 'already granted, and another day: +1 Bond each (S.hp.gotB): ' + JSON.stringify(await ev(() => [window.__paw.S.hp.gotB, window.__paw.S.bond.pts])));
  ok(await ev(() => /had already come true, so here is \+1 Bond instead/.test(window.__paw.S.mail.find((x) => x.id === 'hp_help_2026-01-02_sunnybiscuitxxxxxxxxxx').ps)), 'the fallback PS');
  await ev(() => { window.__paw.S.hp.gotB = 5; });
  const g1 = await ev(() => window.__paw.S.bond.pts);
  await ev((a) => { window.__frSrv.acts.push(a); }, act(113, CLOVER, [1, 6], 'wish', { w: 2, a: 0 }, '2026-01-03'));
  await ev(() => window.__paw.hp.inbox());
  await t.until(() => window.__frSrv.acts.every((a) => a.claimed), null, 4000);
  ok(await ev((p) => window.__paw.S.bond.pts === p && window.__paw.S.hp.gotB === 5, g1), 'at 5: no more Bond');

  sec('C3. Say thanks: note 12 to the helper, the day\'s note for that friend; a thank-you note counts once');
  const lid = 'hp_help_' + today + '_' + SUNNY;
  await ev(() => window.__paw.shop.mail());
  await t.until((id) => !!document.querySelector(`#modal [data-mail="${id}"]`), lid, 4000);
  await t.p.click(`#modal [data-mail="${lid}"]`);
  ok(await t.until(() => !!document.querySelector('#modal [data-hpthx]'), null, 4000), 'the help letter has "Say thanks"');
  await shot(t, 'letter_1280');
  ok(await ev(() => document.querySelector('#modal [data-hpthx]').textContent === 'Say thanks' && document.querySelector('#modal [data-hpthx]').closest('.mb-acts') !== null), 'in the letter\'s action row');
  await toasts0(t);
  await t.p.click('#modal [data-hpthx]');
  ok(await t.waitToast(/Thank-you note sent!/), 'the toast "Thank-you note sent!"');
  ok(await ev((f) => { const s = window.__frSrv.sent.filter((x) => x.fid === f && x.kind === 'note'); return s.length === 1 && s[0].data.i === 12; }, SUNNY), 'note 12 to Sunny Biscuit');
  ok(await t.until(() => { const b = document.querySelector('#modal [data-hpthx]'); return b && b.textContent === 'Thanked today' && b.getAttribute('aria-disabled') === 'true'; }, null, 2000), 'the button now reads "Thanked today"');
  ok(await ev((f) => window.__paw.fr.sent(f, 'note'), SUNNY), 'the day\'s note for that friend is used');
  await ev(() => document.querySelector('#modal [data-hpthx]').click()); // aria-disabled: Playwright will not click it
  await t.sleep(300);
  ok(await ev((f) => window.__frSrv.sent.filter((x) => x.fid === f && x.kind === 'note').length === 1, SUNNY), 'a second tap sends nothing');
  await t.closeX(); await t.modalGone();
  // a 404 (no longer a friend, as the Worker answers it; the mock says bad) says so, and the helps stay on
  await ev(() => { const M = window.__pawCloudMock, f0 = M.fetch; M.fetch = async (url, o) => { if (/\/friends\/send$/.test(url)) { M.fetch = f0; return new Response(JSON.stringify({ error: 'not_found' }), { status: 404, headers: { 'content-type': 'application/json' } }); } return f0(url, o); }; });
  await toasts0(t);
  ok((await ev((f) => window.__paw.hp.thanks(f), FERN)) === false && (await t.waitToast(/not on your list any more/)) && (await ev(() => window.__paw.hp.on())), 'a friend gone: "That friend is not on your list any more." (the helps stay on)');
  // receiving: note 12 counts in S.hp.thx once, also when it comes back after a failed claim
  await ev((f) => { const s = window.__frSrv; s.events = [{ id: 120, from: { fid: f, name: [0, 0] }, kind: 'note', data: { i: 12 }, day: '2026-11-20', claimed: false }]; s.failClaim = true; s.claimBodies = []; }, SUNNY);
  const thx0 = await ev(() => window.__paw.S.hp.thx);
  await ev(() => window.__paw.hp.inbox());
  await t.until(() => window.__frSrv.claimBodies.length >= 1, null, 4000);
  await ev(() => { window.__frSrv.failClaim = false; window.__frSrv.claimBodies = []; });
  await ev(() => window.__paw.hp.inbox());
  await t.until(() => window.__frSrv.claimBodies.length >= 1, null, 4000);
  ok(await ev((n) => window.__paw.S.hp.thx === n + 1, thx0), 'S.hp.thx +1, once: ' + (await ev(() => window.__paw.S.hp.thx)));
  // the paw-print picker still offers the first 12 notes only (note 12 is for Say thanks)
  ok(await visit(t, CLOVER, null), 'a visit to Happy Clover');
  await t.p.click('#frNoteBtn');
  ok(await t.until(() => document.querySelectorAll('#modal [data-frnote]').length === 12, null, 3000) && (await ev(() => !/Thank you for helping/.test(document.getElementById('modal').textContent))), 'the paw-print picker: 12 notes, no "Thank you for helping!"');
  await t.closeX(); await t.modalGone();
  await t.ctx.close();
}

async function phonePart(t, w, h) {
  const { ok, sec, ev } = t, tag = String(w);
  sec(`D. phone ${w}x${h} (touch): the strip under the chip, the bowl in view, the buttons above the bar, the bubble`);
  await startHelps(t, { vw: w, vh: h });
  ok(await t.until(() => document.documentElement.dataset.layout === 'phone', null, 4000), tag + ': the phone layout');
  const today = await jst(t);
  ok(await visit(t, SUNNY, { d: today, g: 2, w: 1 }), tag + ': a visit with all three helps');
  await t.sleep(400);
  const L = await ev(() => {
    const iw = window.innerWidth, bad = [], R = (e) => e.getBoundingClientRect(), over = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    const strip = document.getElementById('hpStrip'), chip = document.getElementById('status'), bar = document.getElementById('bar'), br = R(bar), sr = R(strip), cr = R(chip);
    if (sr.top < cr.bottom - 1 || sr.top - cr.bottom > 20) bad.push('strip not under the chip ' + Math.round(sr.top) + '/' + Math.round(cr.bottom));
    if (sr.width > 344 || sr.left < 0 || sr.right > iw) bad.push('strip width ' + Math.round(sr.width));
    strip.querySelectorAll('.hp-b').forEach((b) => { const r = R(b); if (r.width < 43.5 || r.height < 43.5) bad.push('small ' + b.dataset.hpk); const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!top || !b.contains(top)) bad.push('covered ' + b.dataset.hpk); });
    const btns = [...document.querySelectorAll('#placeBtns .btn')];
    btns.forEach((b) => { const r = R(b); if (r.height < 43.5 || r.width < 43.5) bad.push('small ' + b.id); if (over(r, br)) bad.push('bar ' + b.id); if (over(r, sr)) bad.push('strip ' + b.id); });
    if (btns[btns.length - 1].id !== 'frHomeBtn') bad.push('Go home not last');
    const gh = R(btns[btns.length - 1]); if (btns.some((b) => R(b).bottom > gh.bottom + 1 || (Math.abs(R(b).top - gh.top) < 2 && R(b).right > gh.right + 1))) bad.push('Go home not bottom right');
    const bowl = document.querySelector('#view .hp-bowl'), b = R(bowl), vr = R(document.getElementById('view'));
    if (b.left < vr.left || b.right > vr.right || b.top < vr.top || b.bottom > br.top) bad.push('bowl outside the view');
    if (b.width < 43.5 || b.height < 43.5) bad.push('bowl tap ' + Math.round(b.width));
    btns.concat([strip, chip]).forEach((e) => { if (over(b, R(e))) bad.push('bowl under ' + (e.id || 'x')); });
    const top = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2); if (!top || !bowl.contains(top)) bad.push('bowl covered');
    const st = document.querySelector('#frStampG .fr-stamp'); if (st && over(b, R(st))) bad.push('bowl on the stamp');
    const onTop = !!document.querySelector('#hpTop .hp-bowl');
    [...document.querySelectorAll('#frDogs .frdog .fr-art')].forEach((e, i) => { const r = R(e); if (!onTop && r.left < b.right - 4 && r.right > b.left + 4 && r.top < b.bottom - 4 && r.bottom > b.top + 4) bad.push('dog over the bowl ' + i); });
    const wish = document.getElementById('hpWish'), wr = wish && R(wish);
    if (!wish || wish.hidden) bad.push('no bubble'); else { if (wr.left < 0 || wr.right > iw || wr.top < sr.bottom || wr.bottom > br.top) bad.push('bubble outside'); if (wr.height < 43.5) bad.push('bubble tap'); }
    return { bad, side: document.documentElement.scrollWidth > iw + 1, strip: [sr.left, sr.top, sr.width, sr.height].map(Math.round), bowl: [b.left, b.top, b.width, b.height].map(Math.round), top: onTop };
  });
  ok(!L.side && !L.bad.length, tag + ': strip, buttons, bowl and bubble fit (44 px, above the bar, Go home last): ' + JSON.stringify(L));
  await shot(t, 'visit_' + tag);
  // the can: the strip's button pans the camera to it, inside the crop
  const cam0 = await ev(() => window.__paw.fr.cam());
  ok(await ev(() => window.__paw.hp.tap('water', 'strip')), tag + ': water from the strip: ok');
  ok(await t.until((x) => Math.abs(window.__paw.fr.cam().x - x) > 40, cam0.x, 2000), tag + ': the camera panned to the can');
  ok(await ev(() => { const c = document.querySelector('#view .hp-can').getBoundingClientRect(), v = document.getElementById('view').getBoundingClientRect(); return c.left >= v.left && c.right <= v.right && c.width >= 43.5; }), tag + ': the can is in view, a 44 px tap');
  await shot(t, 'water_' + tag);
  // the snack sheet fits
  await ev(() => { const inv = window.__paw.S.inv; inv.food = { 'Basic Kibble': 2, 'Bone-shaped Biscuit': 1, 'Carrot Sticks': 3, Pupcake: 1 }; });
  ok(await visit(t, FERN, { d: today, g: 0, w: 2 }), tag + ': a snack wish at Cozy Fern');
  await ev(() => window.__paw.hp.snack());
  await t.until(() => !!document.querySelector('#modal .hp-snacksheet'), null, 3000);
  await t.sleep(400);
  const S2 = await ev(() => {
    const iw = window.innerWidth, bad = [], bar = document.getElementById('bar'), br = bar && !bar.hidden ? bar.getBoundingClientRect() : null;
    document.querySelectorAll('#modal button').forEach((b) => { const r = b.getBoundingClientRect(); if (!r.width) return; if (r.width < 43.5 || r.height < 43.5) bad.push('small ' + (b.dataset.hpsnack || b.className)); if (r.left < -1 || r.right > iw + 1) bad.push('side'); });
    return { bad, side: document.documentElement.scrollWidth > iw + 1, n: document.querySelectorAll('#modal [data-hpsnack]').length };
  });
  ok(!S2.side && !S2.bad.length && S2.n === 4, tag + ': the snack sheet fits, 44 px taps: ' + JSON.stringify(S2));
  await shot(t, 'snack_' + tag);
  await t.ctx.close();
}

/* ======================= part 3 (V233.md 4, 4.1-4.3, 9): the sleepover ======================= */
const today9 = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
// two dog boxes [x0, y0, x1, y1] apart by at least m units
const apart = (a, b, m) => a[2] + m <= b[0] || b[2] + m <= a[0] || a[3] + m <= b[1] || b[3] + m <= a[1];
// n sleep acts from Sunny, Fern and Clover for today (ids 500...)
async function sleepActs(t, n, base, long) { // long: friends with long names (Bouncy Marigold, Plucky Lantern)
  await t.ev(([n, ids, base, long]) => {
    const s = window.__frSrv, day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), names = long ? [[9, 18], [19, 13], [1, 6]] : [[0, 0], [2, 11], [1, 6]];
    const dogs = [{ b: 0, c: null, o: -1, a: 'adult', s: 'f', sp: 0, n: 0 }, { b: 3, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 3 }, { b: 2, c: null, o: -1, a: 'adult', s: 'm', sp: 0, n: 2 }];
    s.acts = []; for (let i = 0; i < n; i++) s.acts.push({ id: base + i, from: { fid: ids[i], name: names[i] }, kind: 'sleep', data: { dog: dogs[i] }, day, claimed: false });
  }, [n, [SUNNY, FERN, CLOVER], base || 500, !!long]);
  const c0 = await t.ev(() => window.__frSrv.claimBodies.length);
  await t.ev(() => window.__paw.hp.inbox());
  return t.until((c0) => window.__frSrv.claimBodies.length > c0, c0, 5000);
}
async function sleepPart(t) {
  const { ok, sec, ev } = t;
  sec('B1. who may go: nursing, expecting and under 3 months stay home with a kind line; the sheet');
  await startHelps(t);
  const ids = await ev(() => {
    const P = window.__paw, S = P.S, a = P.addDog({ key: 'dachs', sex: 'female', months: 30 }, 'Otto'), b = P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'), c = P.addDog({ key: 'corgi', sex: 'male', months: 1 }, 'Bun'), e = P.addDog({ key: 'corgi', sex: 'male', months: 3 }, 'Tom');
    b.preg = { sire: 'x', sireKey: 'beagle', sireName: 'Rex', since: '2026-11-20', due: '2026-11-30', pups: [{}, {}], scanned: false };
    S.litters = [{ id: 'lx', mum: a.id, born: '2026-11-20', pups: [], named: true }];
    return { lead: S.dog.id, nurse: a.id, preg: b.id, little: c.id, pup3: e.id };
  });
  const why = await ev((ids) => { const h = window.__paw.hp.sl; return { lead: h.why(ids.lead), nurse: h.why(ids.nurse), preg: h.why(ids.preg), little: h.why(ids.little), pup3: h.why(ids.pup3) }; }, ids);
  ok(why.lead === '' && why.pup3 === '', 'my leader and a 3-month puppy may go: ' + JSON.stringify([why.lead, why.pup3]));
  ok(/stays with the puppies/.test(why.nurse) && /expecting and rests at home/.test(why.preg) && /too little for sleepovers/.test(why.little), 'nursing, expecting and under 3 months stay home: ' + JSON.stringify(why));
  await ev(() => window.__paw.hp.sl.open('sunnybiscuitxxxxxxxxxx'));
  ok(await t.until(() => !!document.querySelector('#modal .hp-sleep'), null, 3000), 'the Sleepover sheet opens');
  const sh = await ev(() => ({ go: document.querySelectorAll('#modal [data-sldog]').length, no: document.querySelectorAll('#modal [data-slno]').length, lead: document.querySelector('#modal .sl-sheet p').textContent }));
  ok(sh.go === 2 && sh.no === 3 && /Sunny Biscuit's yard tonight/.test(sh.lead), 'two dogs may go, three stay home greyed, the lead names the friend: ' + JSON.stringify(sh));
  await ev((id) => document.querySelector(`#modal [data-slno="${id}"]`).click(), ids.nurse);
  await t.sleep(300);
  ok(await ev(() => !!document.querySelector('#modal .hp-sleep') && !/Send/.test(document.querySelector('#modal').textContent)), 'a dog that stays home asks nothing');
  await ev((id) => document.querySelector(`#modal [data-sldog="${id}"]`).click(), ids.lead);
  ok(await t.until(() => [...document.querySelectorAll('#modal button')].some((b) => /Not tonight/.test(b.textContent)), null, 3000), 'the confirm: Not tonight / Sleepover!');
  ok(await ev(() => /Send Mochi for a sleepover at Sunny Biscuit's yard\?/.test(document.querySelector('#modal').textContent)), 'the confirm names my dog and the friend');

  sec('B2. the send: one a Japan day, the recipe (no pixels), my dog stays in my game');
  await toasts0(t);
  await ev(() => { const b = [...document.querySelectorAll('#modal button')].find((x) => /Sleepover!/.test(x.textContent)); b.click(); });
  ok(await t.until(() => window.__paw.S.hp.sl.length === 1, null, 5000), 'sent: one recipe');
  ok(await t.waitToast(/packed a toothbrush/), 'the toast: packed a toothbrush');
  const snt = await ev(() => window.__frSrv.sent.filter((s) => s.kind === 'sleep'));
  ok(snt.length === 1 && snt[0].fid === 'sunnybiscuitxxxxxxxxxx' && Object.keys(snt[0].data).join() === 'dog' && Number.isInteger(snt[0].data.dog.b) && !('name' in snt[0].data.dog), 'POST /friends/send { kind: sleep, data: { dog: card } }, no name: ' + JSON.stringify(snt));
  const rec = await ev(() => window.__paw.S.hp.sl[0]);
  ok(Object.keys(rec).sort().join() === 'day,de,f,fid,h,home,k,ld,me,my,n,s'.split(',').sort().join() && rec.day === today9() && rec.my === ids.lead && rec.home === 0 && Array.isArray(rec.f) && Number.isInteger(rec.h) && !!rec.me && JSON.stringify(rec).length < 600, 'the recipe has its fields only and is small (' + JSON.stringify(rec).length + ' bytes): ' + JSON.stringify(rec));
  ok(!/data:|<svg|base64/.test(JSON.stringify(rec)), 'the recipe holds no pixels');
  ok(await ev(() => window.__paw.S.hp.slDay) === today9() && await ev(() => window.__paw.hp.sl.sent()), 'S.hp.slDay is today');
  const n0 = await ev(() => window.__frSrv.sends);
  ok(await ev(() => window.__paw.hp.sl.send('cozyfernxxxxxxxxxxxxxx', window.__paw.S.dog.id)) === 'busy' && await ev(() => window.__frSrv.sends) === n0, 'a second sleepover today sends nothing');
  await toasts0(t); await ev(() => window.__paw.hp.sl.open('cozyfernxxxxxxxxxxxxxx'));
  ok(await t.waitToast(/One sleepover a night\. Mochi is at Sunny Biscuit's tonight/), 'the second tap says where my dog sleeps tonight');
  ok(await ev(() => window.__paw.S.dogs.some((d) => d.id === window.__paw.S.dog.id) && window.__paw.mode === 'yard' && !!document.querySelector(`#view [data-dog="${window.__paw.S.dog.id}"], #view #dogG`)), 'my dog is still mine, in my yard and drawn');
  await ev(() => { const S = window.__paw.S; S.litters = []; S.dogs = S.dogs.filter((d) => d === S.dog); S.dog.stats.energy = 90; });
  ok(await t.startWalk(), 'my dog can still go for a walk');
  await t.quitWalk(true);
  await visit(t, SUNNY, null);
  ok(await ev(() => { const b = document.getElementById('hpSleepBtn'); return !!b && /Sleepover sent/.test(b.textContent) && b.getAttribute('aria-disabled') === 'true' && b.classList.contains('soon'); }), 'the visit button reads Sleepover sent');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  await t.ctx.close();

  sec('B2b. offline and a rolled-back Worker change nothing');
  await startHelps(t);
  await ev(() => { window.__frSrv.offline = true; });
  await toasts0(t);
  ok(await ev(() => window.__paw.hp.sl.send('sunnybiscuitxxxxxxxxxx', window.__paw.S.dog.id)) === 'off' && await ev(() => window.__paw.S.hp.sl.length === 0 && window.__paw.S.hp.slDay === ''), 'offline: no recipe, no day used');
  ok(await t.waitToast(/internet connection/), 'offline: the fr.offline toast');
  await ev(() => { window.__frSrv.offline = false; window.__frSrv.hp = false; });
  await toasts0(t);
  ok(await ev(() => window.__paw.hp.sl.send('sunnybiscuitxxxxxxxxxx', window.__paw.S.dog.id)) === 'bad', 'a rolled-back Worker answers bad');
  ok(await ev(() => window.__paw.hp.on() === false && window.__paw.S.hp.sl.length === 0 && !document.getElementById('hpSleepBtn')), 'hp is off for the load, no recipe');
  ok(await t.waitToast(/didn't reach Sunny Biscuit/), 'the hp.failed toast');
  await t.ctx.close();

  sec('B3. the host: two guests a Japan day, a third tomorrow; drawn apart, a card with Pet once; gone the next day');
  await startHelps(t);
  await sleepActs(t, 3);
  const cl = await ev(() => window.__frSrv.claimBodies[window.__frSrv.claimBodies.length - 1]);
  const gu = await ev(() => window.__paw.S.hp.gu);
  ok(gu.length === 2 && JSON.stringify(cl.acts || []) === '[500,501]', 'two guests claimed, the third left unclaimed: ' + JSON.stringify(cl));
  ok(await ev(() => window.__paw.S.hp.host) === 2 && await ev(() => window.__paw.S.mail.some((m) => m.id === 'hp_guest_500') && window.__paw.S.mail.some((m) => m.id === 'hp_guest_501')), 'host counts 2, one postcard each');
  ok(await t.until(() => document.querySelectorAll('#hpGuests .hp-guest').length === 2, null, 4000), 'both guests drawn in my yard');
  await t.sleep(400);
  const dr = await ev(() => ({ d: window.__paw.hp.sl.drawn(), lead: window.__paw.hp.sl.geo().lead }));
  ok(apart(dr.d[0].box, dr.d[1].box, 2) && dr.d.every((o) => apart(o.box, dr.lead, 10)), 'no guest drawn over another dog: ' + JSON.stringify(dr));
  ok(dr.d.every((o) => (o.box[0] + o.box[2]) / 2 < (dr.lead[0] + dr.lead[2]) / 2 ? o.face === 'right' : o.face === 'left'), 'each guest faces my leader');
  ok(dr.d.every((o) => apart(o.tag, dr.lead, 2) && dr.d.every((p) => p === o || (apart(o.tag, p.box, 2) && apart(o.tag, p.tag, 2)))), 'the tags cover no dog and no other tag');
  const tg = await ev(() => [...document.querySelectorAll('#hpGuests .sl-tag text')].map((x) => [...x.querySelectorAll('tspan')].map((s) => s.textContent).join(' ')));
  ok(tg.length === 2 && tg.some((x) => /^Mochi, from Sunny Biscuit$/.test(x)) && tg.some((x) => /^Bella, from Cozy Fern$/.test(x)), 'the tag chip: {dog}, from {name}: ' + JSON.stringify(tg));
  const b0 = await ev(() => window.__paw.S.dog.bond.pts + window.__paw.S.dog.bond.level * 1e6);
  await ev(() => window.__paw.hp.sl.card(500));
  ok(await t.until(() => !!document.querySelector('#modal .hp-gcard #slPet'), null, 3000), 'the guest card opens with Pet');
  await toasts0(t); await ev(() => document.getElementById('slPet').click());
  ok(await t.waitToast(/play together\. \+1 Bond/), 'Pet: +1 Bond and the toast');
  ok(await ev(() => window.__paw.S.dog.bond.pts + window.__paw.S.dog.bond.level * 1e6) > b0, 'my leader got the Bond');
  ok(await ev(() => window.__paw.hp.sl.pet(500)) === 0, 'a second pet gives nothing');
  await ev(() => window.__paw.hp.sl.card(500));
  ok(await t.until(() => /Petted today/.test((document.getElementById('slPet') || {}).textContent || ''), null, 3000), 'the card reads Petted today');
  await ev(() => document.getElementById('slOk').click());
  // the next Japan day: the guests are gone and the third one comes
  await ev(() => { const S = window.__paw.S; S.hp.gu.forEach((g) => { g.day = '2026-01-01'; }); });
  ok(await ev(() => window.__paw.hp.sl.draw()) === 0 && await ev(() => document.querySelectorAll('#hpGuests .hp-guest').length === 0), 'the next day: no guest drawn, no goodbye');
  await ev(() => { window.__frSrv.acts = window.__frSrv.acts.filter((a) => a.id === 502); });
  await ev(() => window.__paw.hp.inbox());
  ok(await t.until(() => window.__paw.S.hp.gu.some((g) => g.id === 502), null, 5000), 'the third guest comes when there is room');
  await t.ctx.close();

  sec('B4. home by morning: a page, +2 Bond, the toast; the picture and the share have no friend name and no text; generic after a remove');
  await startHelps(t);
  ok(await ev(() => window.__paw.hp.sl.send('sunnybiscuitxxxxxxxxxx', window.__paw.S.dog.id)) === 'ok', 'a sleepover sent');
  await ev(() => { window.__paw.S.hp.sl[0].day = '2026-01-01'; });
  await toasts0(t);
  ok(await ev(() => window.__paw.hp.sl.home()) === 1, 'home by morning: one sleepover back');
  ok(await t.waitToast(/home from the sleepover! \+2 Bond\. A new page in the diary/), 'the toast with +2 Bond');
  const pg = await ev(() => window.__paw.S.dd.diary.find((p) => p.sl));
  ok(!!pg && pg.j === '2026-01-01' && pg.sl.my === pg.id && pg.sl.fid === 'sunnybiscuitxxxxxxxxxx' && !('home' in pg.sl), 'a diary page with the recipe, placed on its night');
  const lines = await ev(() => window.__paw.hp.sl.lines(window.__paw.S.dd.diary.find((p) => p.sl)).join(' | '));
  ok(/slept over at Sunny Biscuit's yard/.test(lines) && /Home by breakfast/.test(lines), 'the page lines: ' + lines);
  ok(await ev(() => window.__paw.hp.sl.home()) === 0, 'home only once');
  const pic = await ev(() => { const sl = window.__paw.S.dd.diary.find((p) => p.sl).sl; return { pic: window.__paw.hp.sl.pic(sl), feed: window.__paw.hp.sl.shareSvg(sl, 'feed'), pal: window.__paw.hp.sl.pal(sl) }; });
  ok(!!pic.pal && !/Sunny|Biscuit/.test(pic.pic) && !/<text\b/.test(pic.pic), 'the diary picture: no friend name, no text');
  ok(!/Sunny|Biscuit/.test(pic.feed), 'the share picture has no friend name');
  // both dogs whole and apart in both sizes, measured in the page
  const gaps = await ev(() => ['feed', 'story'].map((size) => {
    const sl = window.__paw.S.dd.diary.find((p) => p.sl).sl, host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:1080px'; host.innerHTML = window.__paw.hp.sl.shareSvg(sl, size); document.body.appendChild(host);
    const root = host.querySelector('svg'); root.style.width = '1080px'; root.style.height = 'auto'; const sc = root.querySelector(':scope > svg'), dogs = [...sc.querySelectorAll(':scope > svg')].slice(-2); // the yard's own art (house, decor, moon) comes first
    const box = (el) => { let L = 1e9, R = -1e9; el.querySelectorAll('path,ellipse,circle,polygon').forEach((c) => { if (c.closest('.pa-d-f1,.pa-d-f2')) return; const b = c.getBoundingClientRect(); if (!b.width && !b.height) return; L = Math.min(L, b.left); R = Math.max(R, b.right); }); return [L, R]; };
    const [a, b] = dogs.map(box); host.remove(); return { n: dogs.length, gap: Math.round(b[0] - a[1]), l: Math.round(a[0] - 46), r: Math.round(1034 - b[1]) };
  }));
  ok(gaps.every((g) => g.n === 2 && g.gap >= 8 && g.l >= 4 && g.r >= 4), 'share 1080x1350 and 1080x1920: both dogs whole, face to face, not over each other: ' + JSON.stringify(gaps));
  await ev(() => window.__paw.journal('diary'));
  ok(await t.until(() => !!document.querySelector('#modal .sl-pic svg') && !!document.querySelector('#modal [data-slshare]'), null, 4000), 'the diary page shows the picture and Share this moment');
  await ev(() => document.querySelector('#modal [data-slshare]').click());
  ok(await t.until(() => { const r = window.__paw.sh.rec(); return !!r && r.from === 'sleep' && r.pal && r.yard; }, null, 8000), 'Share this moment: shareDog with yard and pal');
  await ev(() => { const P = window.__paw; if (!document.getElementById('modal').hidden) P.closeModal && P.closeModal(); });
  await t.p.keyboard.press('Escape');
  // the While you were out line
  const wb = await ev(() => window.__paw.hp.sl.wb({ at: Date.now(), h: 5 }));
  ok(/went to a sleepover at Sunny Biscuit(&#39;|')s yard and came home happy/.test(wb), 'While you were out: the sleepover line: ' + wb);
  // a remove: the page turns generic (no name, house or pal), the picture has my dog alone
  await ev(() => { const S = window.__paw.S; S.fr.cache.friends = S.fr.cache.friends.filter((f) => f.fid !== 'sunnybiscuitxxxxxxxxxx'); });
  const gen = await ev(() => { const p = window.__paw.S.dd.diary.find((x) => x.sl); return { l: window.__paw.hp.sl.lines(p).join(' | '), g: window.__paw.hp.sl.generic(p.sl), pic: window.__paw.hp.sl.pic(p.sl), wb: window.__paw.hp.sl.wb({ at: Date.now(), h: 5 }) }; });
  ok(gen.g && /went to a sleepover at a friend's yard/.test(gen.l) && !/Sunny|Biscuit|Cottage/.test(gen.l), 'generic page after a remove: ' + gen.l);
  ok(!/Sunny|Biscuit/.test(gen.pic) && (gen.pic.match(/class="pa-dog|<svg[^>]*pa-d/g) || []).length <= 1, 'the generic picture: no name, my dog alone');
  ok(/A friend|a friend/.test(gen.wb) && !/Sunny/.test(gen.wb), 'While you were out names no removed friend: ' + gen.wb);
  await t.ctx.close();

  sec('B5. a guest in While you were out');
  await startHelps(t);
  await sleepActs(t, 1);
  ok(/from Sunny Biscuit(&#39;|')s yard came for a sleepover/.test(await ev(() => window.__paw.hp.sl.wb({ at: Date.now(), h: 5 }))), 'While you were out: the guest line');
  await t.ctx.close();
}

// phones: the four visit buttons, the sheet, two guests in the home view (or the look chip), the guest card; 44 px taps, nothing under the bar
async function sleepPhone(t, w, h, lang) {
  const { ok, sec, ev } = t, tag = w + 'x' + h + (lang ? ' ' + lang : '');
  sec(`B6. phone ${tag}: the visit buttons, the sheet, two guests in my yard, the card`);
  await startHelps(t, { vw: w, vh: h, lang });
  await visit(t, SUNNY, null);
  await t.sleep(500);
  const B = await ev(() => {
    const bs = [...document.querySelectorAll('#placeBtns .btn')].map((b) => { const r = b.getBoundingClientRect(); return { t: b.id || b.textContent.trim(), l: r.left, r: r.right, top: r.top, b: r.bottom, w: r.width, h: r.height }; });
    const bar = document.getElementById('bar'), bt = bar && !bar.hidden ? bar.getBoundingClientRect().top : innerHeight; return { bs, bt, iw: innerWidth };
  });
  const last = B.bs[B.bs.length - 1], maxB = Math.max(...B.bs.map((b) => b.b)), maxR = Math.max(...B.bs.map((b) => b.r));
  ok(B.bs.length === 4 && last.t === 'frHomeBtn' && B.bs[2].t === 'hpSleepBtn', tag + ': four buttons, Sleepover third, Go home last: ' + B.bs.map((b) => b.t).join(' / '));
  ok(last.b >= maxB - 1 && last.r >= maxR - 1, tag + ': Go home bottom right');
  ok(B.bs.every((b) => b.w >= 43.5 && b.h >= 43.5 && b.b <= B.bt + 0.5 && b.l >= -0.5 && b.r <= B.iw + 0.5), tag + ': 44 px, inside, above the phone bar');
  await t.p.click('#hpSleepBtn');
  ok(await t.until(() => !!document.querySelector('#modal .hp-sleep'), null, 3000), tag + ': the sheet opens');
  await t.sleep(400);
  const SH = await ev(() => { const iw = innerWidth; return [...document.querySelectorAll('#modal .sl-dog, #modal button')].map((b) => { const r = b.getBoundingClientRect(); return r.width ? (r.height < 43.5 || r.width < 43.5 || r.left < -1 || r.right > iw + 1 ? 'bad ' + b.className : '') : ''; }).filter(Boolean); });
  ok(!SH.length, tag + ': the sheet rows and buttons are 44 px and inside: ' + JSON.stringify(SH));
  await t.p.keyboard.press('Escape');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  await sleepActs(t, 2, 500, !!lang);
  ok(await t.until(() => document.querySelectorAll('#hpGuests .hp-guest').length === 2, null, 4000), tag + ': two guests drawn');
  await t.sleep(1500);
  const G = await ev(() => {
    const svg = document.querySelector('#view > svg.world'), vb = svg.viewBox.baseVal, P = window.__paw.hp.sl, d = P.drawn(), geo = P.geo();
    const inV = (o) => o.box[0] >= vb.x - 1 && o.box[2] <= vb.x + vb.width + 1 && o.tag[0] >= vb.x - 1 && o.tag[2] <= vb.x + vb.width + 1;
    const ob = geo.ob.map((s) => s.split(' ')[0].split(',').map(Number)).filter((b) => b.length === 4);
    const tags = [...document.querySelectorAll('#hpGuests .sl-tag')].filter((g, i) => inV(d[i])).map((g) => { const r = g.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }); // the guests in view
    const bar = document.getElementById('bar'), bt = bar && !bar.hidden ? bar.getBoundingClientRect().top : innerHeight;
    return { d, lead: geo.lead, inView: d.map(inV), look: P.look(), tagsIn: tags.every((r) => r[0] >= -1 && r[2] <= innerWidth + 1 && r[3] <= bt + 1), mail: ob.find((b) => b[1] === 288) || null };
  });
  ok(G.inView[0], tag + ': the first guest is in the home view');
  ok(G.inView[1] || G.look.includes(G.d[1].name), tag + ': the second guest is in view, or the look chip names it: ' + JSON.stringify({ inView: G.inView, look: G.look }));
  ok(apart(G.d[0].box, G.d[1].box, 2) && G.d.every((o) => apart(o.box, G.lead, 10)), tag + ': no dog over another');
  ok(G.d.every((o) => G.d.every((p) => p === o || (apart(o.tag, p.box, 2) && apart(o.tag, p.tag, 2)))), tag + ': no tag over the other guest or its tag');
  ok(!G.mail || G.d.every((o) => apart(o.box, G.mail, 2) && apart(o.tag, G.mail, 2)), tag + ': clear of the mailbox');
  ok(G.tagsIn, tag + ': the tags are inside the screen and above the bar');
  await shot(t, 'sl_guests_' + tag.replace(' ', '_'));
  await ev(() => window.__paw.hp.sl.card(500));
  ok(await t.until(() => !!document.querySelector('#modal .hp-gcard'), null, 3000), tag + ': the guest card');
  await t.sleep(300);
  const C = await ev(() => ['slPet', 'slOk'].map((id) => { const r = document.getElementById(id).getBoundingClientRect(); return r.width >= 43.5 && r.height >= 43.5 && r.right <= innerWidth + 1; }));
  ok(C.every(Boolean), tag + ': Pet and OK are 44 px taps');
  await t.ctx.close();
}
