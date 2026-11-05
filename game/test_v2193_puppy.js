// v2.19.3 "Puppy start" (V2193.md, owner 5 Nov 2026): every starter from the shelter arrives as a 3-month puppy (desktop and iPhone 15),
// Puppy's first day with Gerald works with a puppy (its walk is a Sunny Park walk), the daily mission and the daily wish never ask a puppy for a
// walk it can't do, the one-time old-save migration (pupStartFields: 7 months younger, never a stage back, dogs that have had puppies keep their
// age, S.pupStart stops a second run), an old v1 save still loads, and the shift throws no birthday party.
// PUP_SHOTS=<dir> also writes iPhone 15 (DSF 1) screenshots of the adoption and the yard on day 1.
// node game/run_tests.js v2193_puppy
const { run, URL } = require('./test_lib'); const path = require('path'); const fs = require('fs');
const SHOTS = process.env.PUP_SHOTS || null;
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

run('v2193_puppy', async (t) => {
  const { ok, sec, ev } = t;
  const errs = () => t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  const age = (id) => ev((id) => window.__paw.pup.age(id), id || null);
  const shot = async (name) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.sleep(600); await t.p.screenshot({ path: path.join(SHOTS, name + '.png') }); };

  sec('1. the shelter starter is a 3-month puppy (desktop)');
  await t.boot({ pupStart: true });
  await t.p.click('#tNew'); await t.p.waitForSelector('#aAdopt');
  ok(await ev(() => window.__paw.pup.months()) === 3 && await ev(() => window.__paw.pup.START) === 3, 'starterMonths() is 3 with pupStart');
  ok(await t.until(() => { const s = window.__paw.sr && window.__paw.sr.stages(); return !!s && s.length > 0 && s.every((x) => x === 'puppy'); }, null, 6000), 'every starter in the playroom is a puppy: ' + (await ev(() => window.__paw.sr.stages().join(','))));
  await t.p.click('#aGirl'); await t.p.click('#aAdopt'); await t.p.waitForSelector('#nOk'); await t.p.click('#nOk'); await t.intro(); await t.calm();
  let s = await t.S();
  ok(await age() === 3 && s.dog.born === iso(3), `the first dog is 3 months old (born ${s.dog.born}) and a puppy (${await ev(() => window.__paw.pup.stage(window.__paw.pup.age()))})`);
  ok(s.pupStart === 1, 'a new save carries S.pupStart = 1, so the old-save migration never touches it');
  ok(await ev(() => window.__paw.play.walkBlock(window.__paw.S.dog, 'park') === null && /only does Sunny Park/.test(window.__paw.play.walkBlock(window.__paw.S.dog, 'river') || '') && window.__paw.play.walkScale() === 0.7), 'the puppy walks the Sunny Park (0.7 length) and says a kind no to the Riverside Trail');
  ok(await ev(() => window.__paw.play.trainBlock() === null), 'a 3-month puppy can practise tricks');
  // a later starter from the shelter list is a puppy too
  await ev(() => { const S = window.__paw.S; S.house = 'Treehouse Den'; S.dogs[0].bond = { level: 8, pts: 1900 }; S.careDays = 21; S.coins = 2000; });
  await ev(() => window.__paw.sr.list()); await t.waitH2(/Doodle Doggo Shelter/);
  const sk = await ev(() => { const b = document.querySelector('.shcard.starter [data-shsex]'); return b ? b.dataset.shsex.split('|')[0] : null; });
  ok(!!sk && await ev(() => !!document.querySelector('.shcard.starter .shdog svg')), 'the shelter list shows the starter dogs: ' + sk);
  await t.p.click(`[data-shsex="${sk}|male"]`); await t.p.click(`[data-shadopt="starter|${sk}"]`); await t.p.waitForSelector('#shOk'); await t.p.click('#shOk');
  ok(await t.until(() => window.__paw.S.dogs.length === 2, null, 6000), 'a second starter came home');
  s = await t.S(); const d2 = s.dogs[1];
  ok(d2.key === sk && !d2.rescue && await age(d2.id) === 3, `the later starter is 3 months old too (${d2.key}, ${await age(d2.id)} months)`);
  await t.ctx.close();

  sec('2. Puppy\'s first day with Gerald, with a puppy: five steps, the walk is a Sunny Park walk, Bond 2 on the way home');
  await t.boot({ pupStart: true, prefs: { fwTest: true } }); await t.adopt({ sex: 'girl' });
  const cardAt = (k) => t.until((k) => { const c = document.querySelector('#gdLayer .gd-card'); return !!c && !c.hidden && c.dataset.k === k; }, k, 8000);
  ok(await age() === 3, 'the first-day dog is a 3-month puppy');
  ok(await cardAt('pet'), 'Gerald starts with the pet step');
  await t.pet(() => window.__paw.S.guide.step >= 1); ok(await cardAt('feed'), 'pet done');
  await t.p.click('[data-act=feed]'); await t.waitPop(true);
  await t.retryUntil(() => ev(() => { const b = document.querySelector('[data-food="Basic Kibble"]'); if (b) b.click(); }), () => window.__paw.S.guide.step >= 2);
  await t.waitPop(false); await t.calm(); ok(await cardAt('ball'), 'feed done');
  await t.p.click('[data-act=play]'); await t.waitPop(true);
  await t.p.click('[data-play="ball:Tennis Ball"]'); await t.until(() => !!(window.__paw.bl && window.__paw.bl.on), null, 4000);
  await ev(() => window.__paw.bl.throwV(800, -600)); await ev(() => window.__paw.bl.sim(14));
  ok(await t.until(() => window.__paw.S.guide.step >= 3, null, 6000), 'the puppy brings the ball back');
  await ev(() => window.__paw.bl.stop()); await t.untilMode('yard'); await t.calm(); await t.lu();
  ok(await cardAt('tag'), 'the name-tag step');
  await t.p.click('#gdLayer .gd-next'); await t.p.waitForSelector('#fwTagName'); await t.p.click('#fwTagOk');
  ok(await cardAt('walk'), 'then the walk');
  await t.startWalk(true);
  const w = await ev(() => { const W = window.__paw.W; return W ? { area: W.area, scale: window.__paw.play.walkScale() } : null; });
  ok(!!w && w.area === 'park' && w.scale === 0.7, 'the first walk is a short Sunny Park walk (60 s x 0.7): ' + JSON.stringify(w));
  await ev(() => { window.__paw.W.dist = 1e7; }); await t.quitWalk(false);
  await t.p.click('#resOk'); await t.untilMode('yard');
  s = await t.S(); ok(s.bond.level === 2 && s.guide.done && !s.guide.skipped, `after the walk: Bond 2 (${s.bond.pts} points) and the first day is done`);
  await t.lu(); await t.modalGone();
  ok(!errs().length, 'no page errors: ' + errs().slice(0, 3).join(' | '));
  await t.ctx.close();

  sec('3. the daily mission and the daily wish are doable by a puppy');
  await t.newGame({ pupStart: true, map215: true }, { bond: { level: 7, pts: 1450 }, coins: 1000 });
  ok(await age() === 3, 'a puppy, at Bond 7 (every route but the beach unlocked)');
  const BAD = ['walk_river', 'new_trail'];
  let el = await ev(() => window.__paw.ms.eligible());
  ok(!el.some((id) => BAD.includes(id)) && el.includes('walk'), 'no Riverside or new-trail mission for a puppy; a plain walk is fine: ' + el.join(' '));
  const picks = await ev(() => { const out = []; for (let i = 1; i <= 40; i++) { const d = new Date(Date.UTC(2026, 10, i)); const r = window.__paw.ms.pick(d.toISOString().slice(0, 10)); (Array.isArray(r) ? r : [r]).forEach((x) => out.push(x && (x.id || x))); } return out; });
  ok(picks.length >= 40 && !picks.some((id) => BAD.includes(id)), `40 days of missions, none asks the puppy for a walk it can't do (${[...new Set(picks)].join(' ')})`);
  const fresh = await ev(() => (window.__paw.ms2 && window.__paw.ms2.fresh ? window.__paw.ms2.fresh() : null));
  ok(Array.isArray(fresh) && fresh.every((k) => k === 'park'), 'Missions v2 "a fresh route": only the Sunny Park for a puppy: ' + JSON.stringify(fresh));
  const wo = await ev(() => window.__paw.dd.walkOpts());
  ok(wo.length === 1 && wo[0] === 'park', 'the daily wish only wishes for a Sunny Park walk: ' + JSON.stringify(wo));
  await ev(() => window.__paw.addDog({ key: 'dachs', sex: 'male', months: 30 }, 'Otto'));
  el = await ev(() => window.__paw.ms.eligible());
  ok(el.includes('walk_river'), 'with a grown-up dog in the pack the Riverside mission comes back');
  ok((await ev(() => window.__paw.dd.walkOpts(window.__paw.S.dogs[1].id))).includes('river'), 'and the grown-up dog may wish for the river');
  await t.ctx.close();

  sec('3b. Missions v2 notebook page 3 (behind MS2_LIVE): a puppy-only pack gets a short walk instead of the Riverside Trail');
  await t.newGame({ pupStart: true, prefs: { msTest: true, ddTest: true, ms2Test: true } }, { bond: { level: 2, pts: 70 }, coins: 1000 });
  await t.until(() => !!(window.__paw.msn && window.__paw.S.missions && window.__paw.S.missions.nb), null, 6000);
  const nb3 = await ev((b5) => {
    const P = window.__paw, N = P.msn, S = P.S, nb = S.missions.nb, out = {};
    S.dog.born = b5; nb.pages = 3; nb.done = {}; nb.got = []; N.page(3);
    out.age = P.pup.age(); out.lock = N.lock(3, 2); const h = N.html(); out.short = /Go for a short walk/.test(h); out.river = /Walk the Riverside Trail/.test(h);
    P.ms.act('walk', { area: 'park', pack: 1 }); out.done = (nb.done[3] || []).includes(2);
    P.addDog({ key: 'dachs', sex: 'male', months: 30 }, 'Otto'); nb.done[3] = (nb.done[3] || []).filter((x) => x !== 2); N.page(3); out.river2 = /Walk the Riverside Trail/.test(N.html());
    P.ms.act('walk', { area: 'park', pack: 1 }); out.parkAdult = (nb.done[3] || []).includes(2);
    return out;
  }, iso(5));
  ok(nb3.age === 5 && nb3.lock === 0 && nb3.short && !nb3.river && nb3.done, 'a 5-month puppy on day 3: the step says "Go for a short walk", is open, and a Sunny Park walk does it: ' + JSON.stringify(nb3));
  ok(nb3.river2 && !nb3.parkAdult, 'with a grown-up dog in the pack it is the Riverside Trail again (a park walk does not count)');
  ok(!errs().length, 'no page errors: ' + errs().slice(0, 3).join(' | '));
  await t.ctx.close();

  sec('4. the migration table (pupStartFields on a prepared save)');
  await t.boot({ pupStart: true }); await t.adopt({ sex: 'boy' });
  const tab = await ev((B) => {
    const P = window.__paw, mk = (id, m, x) => Object.assign({ id, key: 'shiba', name: id, sex: 'female', born: B[m], parents: null, litters: 0, lastLitter: null, rescue: null, seasonSeed: 2 }, x || {});
    const s = { dogs: [mk('y10', 10), mk('y11', 11), mk('a13', 13), mk('a30', 30), mk('s88', 88), mk('s100', 100, { fixed: true }), mk('lit', 30, { litters: 1 }), mk('sire', 30, { sex: 'male' }), mk('mum', 20),
      mk('preg', 20, { preg: { since: B[1], due: B[0] } }), mk('res', 30, { rescue: { date: B[40] } }), mk('pup1', 4, { parents: { dam: 'lit', sire: 'x' } }), mk('p4', 4), mk('nob', 0, { born: undefined }),
      mk('pd', 20, { preg: { sire: 'ps', since: B[1], due: B[0], pups: [{ parents: { dam: 'pd', sire: 'ps' } }] } }), mk('ps', 20, { sex: 'male' }), mk('ls', 20, { sex: 'male' }), mk('ns', 20, { sex: 'male' }),
      mk('m98', 98, { sex: 'male' }), mk('f75', 75), mk('g20', 20, { key: 'dane' })],
    litters: [{ mum: 'mum', sire: 'ls', pups: [] }], rehomed: [{ id: 'gone', parents: { dam: 'zz', sire: 'sire' } }], npcLitters: [{ npc: 'n1', sire: 'ns', pups: [] }], tree: { a30: { id: 'a30', born: B[30] } } };
    P.pup.fields(s);
    const t0 = new Date(); t0.setHours(0, 0, 0, 0); const m = (d) => (d.born ? Math.round((t0 - new Date(d.born + 'T00:00:00')) / 864e5) : null);
    const out = {}; s.dogs.forEach((d) => { out[d.id] = m(d); });
    const first = { flag: s.pupStart, tree: s.tree.a30.born === s.dogs[3].born, seed: s.dogs[3].seasonSeed, bday: [s.dogs[2].pupBday, s.dogs[4].pupBday, s.dogs[5].pupBday, s.dogs[0].pupBday] };
    s.dogs[3].born = B[30]; P.pup.fields(s); out.again = m(s.dogs[3]);
    return { out, first };
  }, Object.fromEntries([0, 1, 4, 10, 11, 13, 20, 30, 40, 75, 88, 98, 100].map((n) => [n, iso(n)])));
  const o = tab.out;
  ok(o.y10 === 6 && o.y11 === 6, `young 10 / 11 -> 6 (${o.y10}, ${o.y11})`);
  ok(o.a13 === 12 && o.a30 === 23, `adult 13 -> 12, adult 30 -> 23 (${o.a13}, ${o.a30})`);
  ok(o.s88 === 84 && o.s100 === 93, `senior 88 -> 84, senior 100 -> 93 (a fixed dog) (${o.s88}, ${o.s100})`);
  ok(o.pd === 20 && o.ps === 20 && o.ls === 20 && o.ns === 20, `the father of a litter on the way, of a nursery litter and of a neighbour's litter keep their age (${o.pd}, ${o.ps}, ${o.ls}, ${o.ns})`);
  ok(o.m98 === 96 && o.f75 === 72 && o.g20 === 18, `never back under a welfare age line: a male at 98 -> 96 (retired), a female at 75 -> 72 (no litters), a Great Dane at 20 -> 18 (grown) (${o.m98}, ${o.f75}, ${o.g20})`);
  ok(o.lit === 30 && o.sire === 30 && o.mum === 20 && o.preg === 20, `dogs that have had puppies keep their age: litters ${o.lit}, a sire of a rehomed pup ${o.sire}, a nursing mum ${o.mum}, expecting ${o.preg}`);
  ok(o.res === 30 && o.pup1 === 4 && o.p4 === 4 && o.nob === null, `a shelter resident (${o.res}), a born pup (${o.pup1}), a puppy (${o.p4}) and a dog with no birthday are left as they are`);
  ok(tab.first.flag === 1 && tab.first.tree && tab.first.seed === (2 + 7) % 6, 'S.pupStart = 1, the family tree follows the new birthday, the season phase stays (seasonSeed ' + tab.first.seed + ')');
  ok(JSON.stringify(tab.first.bday) === JSON.stringify([12, 84, 96, undefined]), 'pupBday keeps the birthdays already had: ' + JSON.stringify(tab.first.bday));
  ok(o.again === 30, 'the flag stops a second run (a dog set back to 30 months stays 30)');
  await t.ctx.close();

  sec('5. an old v1 save still loads, gets its puppy months back once, and throws no birthday party');
  const old = { v: 1, dog: { key: 'corgi', name: 'Biscuit', favFood: ['Basic Kibble'], favToy: 'Tennis Ball', sex: 'male', born: iso(13) }, stats: { hunger: 70, happy: 70, energy: 80, clean: 80 }, bond: { level: 3, pts: 300 }, coins: 99, inv: { food: {}, toys: ['Tennis Ball'], clothes: [], houses: ['Cardboard Box'], charms: [] }, outfit: { head: null, eyes: null, neck: null, body: null, charm: null }, house: 'Cardboard Box', tricks: {}, gameMin: 600, lastReal: Date.now(), waterAt: -999, pupUntil: -1, daily: { day: 0 }, sleeping: false, collection: {}, adopted: true, found: {}, mapPieces: [], walks: 3, glowUntil: -1, secretDug: false, title: '', place: 'yard' };
  await t.mk({ pupStart: true, storage: { pawhaven_proto_v1: JSON.stringify(old) } }); await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue');
  ok(await t.untilMode('yard'), 'the old v1 save loads to the yard');
  s = await t.S();
  ok(s.v === 1 && s.dogs.length === 1 && s.dogs[0].name === 'Biscuit' && s.coins === 99 && s.pupStart === 1, 'one dog, the coins, v 1, and S.pupStart = 1');
  ok(await age() === 12 && s.dogs[0].born === iso(12) && s.dogs[0].pupBday === 12, `Biscuit was 13 months, now 12 (never a stage back): born ${s.dogs[0].born}`);
  await t.sleep(3500);
  ok(!(await ev(() => window.__toasts.some((x) => /Happy birthday/.test(x)))), 'no birthday toast from the shift (12 months, but his first birthday was already had)');
  await ev(() => window.__paw.saveNow()); await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.sleep(2500);
  ok(await age() === 12 && !(await ev(() => window.__toasts.some((x) => /Happy birthday/.test(x)))), 'after a reload: still 12 months (the migration ran once) and still no party');
  ok(!errs().length, 'no page errors: ' + errs().slice(0, 3).join(' | '));
  await t.ctx.close();

  sec('6. iPhone 15: the shelter starter is a 3-month puppy, the yard on day 1');
  await t.boot({ pupStart: true, device: 'iPhone 15', dsf: SHOTS ? 1 : undefined, prefs: { fwTest: true } });
  await t.p.click('#tNew'); await t.p.waitForSelector('#aAdopt');
  ok(await t.until(() => { const s = window.__paw.sr && window.__paw.sr.stages(); return !!s && s.length > 0 && s.every((x) => x === 'puppy'); }, null, 6000), 'phone: every starter in the playroom is a puppy');
  await t.until(() => !!window.__paw.sr.meetKey, null, 4000); await shot('01_phone_adopt_puppy');
  await t.p.click('#aBoy'); await t.p.click('#aAdopt'); await t.p.waitForSelector('#nOk'); await shot('02_phone_name'); await t.p.click('#nOk'); await t.intro(); await t.calm();
  ok(await age() === 3, 'phone: the first dog is 3 months old');
  await t.until(() => { const c = document.querySelector('#gdLayer .gd-card'); return !!c && !c.hidden; }, null, 6000); await shot('03_phone_yard_day1_gerald');
  ok(await ev(() => { const a = document.querySelector('#dogHit'); if (!a) return false; const r = a.getBoundingClientRect(); return r.width > 20 && r.height > 20 && r.left >= -1 && r.right <= innerWidth + 1; }), 'phone: the puppy is on screen in the yard');
  if (SHOTS) {
    await ev(() => { const P = window.__paw; P.S.guide.done = P.S.guide.done || new Date().toISOString().slice(0, 10); P.S.guide.step = -1; });
    await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.modalGone(); await shot('04_phone_yard_day1');
    await ev(() => { const S = window.__paw.S; S.house = 'Treehouse Den'; S.dogs[0].bond = { level: 8, pts: 1900 }; S.careDays = 21; }); await ev(() => window.__paw.sr.list()); await t.waitH2(/Doodle Doggo Shelter/);
    await ev(() => { const e = document.querySelector('.shcard.starter'); if (e) e.scrollIntoView(); }); await shot('05_phone_shelter_starters');
  }
  ok(!errs().length, 'no page errors: ' + errs().slice(0, 3).join(' | '));
});
