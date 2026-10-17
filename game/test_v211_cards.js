// v2.11 CARDS (V211.md section 5.5): Dog Cards. Fake mode (the harness, like the claude.ai artifact): town players visit the Dog Park,
// the card sheet, a paw once a day, Hide this card, the roam holds, never over the player's dogs or a tappable spot. Mock mode (the real
// cloudflare/worker.js on a local D1 through game/cloud_mock.js): an email account publishes, a guest on another device sees it visit and
// gives a paw, the owner gets the new paws toast once, turning it off deletes the card. Also: the game's lists match the Worker's limits.
//   node game/run_tests.js v211_cards
const fs = require('fs'), path = require('path');
const { run, URL } = require('./test_lib');
const { makeServer, mockInit } = require('./cloud_mock');

run('v211_cards', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a);
  const vis = () => ev(() => window.__paw.dc.visitors());
  const ov = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
  // what a tap at the middle of each player dog's tap rect and of each tappable spot hits: never a visitor
  const tapsClear = () => ev(() => {
    const svg = document.querySelector('#view > svg.world'), M = svg.getScreenCTM(), out = [];
    const at = (x, y) => { const p = new DOMPoint(x, y).matrixTransform(M); return document.elementFromPoint(p.x, p.y); };
    window.__paw.rm.dogs().forEach((id) => { const b = window.__paw.rm.tap(id), e = at(b[0] + b[2] / 2, b[1] + b[3] / 2); if (e && e.closest('#dcVis')) out.push('dog ' + id); });
    window.__paw.rm.scan().filter((b) => b[4] !== 'btn' && b[4] !== 'scene').forEach((b) => { const e = at(b[0] + b[2] / 2, b[1] + b[3] / 2); if (e && e.closest('#dcVis')) out.push(b[4]); });
    return out;
  });
  // a point where visitor i is on top (a player dog may stand in front of part of it), in page px
  const visPt = (i) => ev((i) => {
    const el = document.querySelector(`#dcVis [data-dcv="${i}"] .dc-hit`); if (!el) return null; const r = el.getBoundingClientRect();
    for (const fy of [0.5, 0.6, 0.7, 0.8, 0.9, 0.4, 0.3, 0.2, 0.1]) for (const fx of [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8, 0.1, 0.9]) { const x = r.left + r.width * fx, y = r.top + r.height * fy, e = document.elementFromPoint(x, y); if (e && e.closest(`[data-dcv="${i}"]`)) return { x, y }; }
    return null;
  }, i);
  const check = (V, z, label) => {
    ok(V.length >= 1 && V.length <= 3, `${label}: 1 to 3 visiting dogs (${V.length})`);
    ok(new Set(V.map((v) => v.card)).size <= 2, `${label}: from at most 2 cards`);
    ok(V.every((v) => v.y >= z.y0 && v.y <= z.y1 && v.x >= z.x0 && v.x <= z.x1), `${label}: every visitor stands in rmZone`);
  };

  sec('1. the lists: append-only indices, the same counts as the Worker checks');
  const worker = fs.readFileSync(path.join(__dirname, '..', 'cloudflare', 'worker.js'), 'utf8');
  const lim = JSON.parse(worker.match(/const DC_LIM = (\{[^}]+\})/)[1].replace(/(\w+):/g, '"$1":'));
  await t.newGame({}, { coins: 2000, bond: { level: 8, pts: 2000 }, stats: { hunger: 90, happy: 80, energy: 90, clean: 90 } });
  const L = await ev(() => { const l = window.__paw.dc.lists; return { a: l.a.length, b: l.b.length, n: l.n.length, outfit: l.outfits.length, breeds: l.breeds.length, words: l.a.concat(l.b, l.n), outfits: l.outfits }; });
  ok(L.a === lim.a && L.b === lim.b && L.n === lim.n && L.outfit === lim.outfit, `DC_WORDS_A ${L.a}, DC_WORDS_B ${L.b}, DC_DOG_NAMES ${L.n}, DC_OUTFITS ${L.outfit} match the Worker's DC_LIM`);
  ok(L.breeds <= lim.breed && lim.breed === 21, `PawGenes BREEDS (${L.breeds}) fits the Worker's 21 breeds`);
  ok(L.n - 80 === lim.breed, 'one breed name word per breed the Worker allows');
  ok(L.words.every((w) => /^[A-Z][a-z]+$/.test(w)), 'every name word is one plain capitalised word');
  ok(L.n === 101 && (await ev(() => window.__paw.dc.lists.n.slice(80).join())) === 'Shiba,Corgi,Golden,Dachshund,Husky,Mutt,Chihuahua,Pug,Greyhound,Beagle,Poodle,Collie,Samoyed,Frenchie,Akita,Spitz,Pom,Hound,Dane,Mastiff,Shepherd', '80 pet names, then the 21 breed name words');
  ok(await ev(() => window.__paw.dc.lists.outfits.slice(0, 44).every((n) => typeof n === 'string' && /Bandana|Hat|Tie|Crown|Sunglasses|Raincoat|Beanie|Sweater|Cape|Collar|Tutu|Pyjamas|Suit|Coat|Hoodie|Scarf|Beret|Sheet|Rosette|Wings|Antlers|Snood|Hood|Helmet|Cap|Goggles|Necklace|Poncho/.test(n))), 'DC_OUTFITS are the game\'s wearables');
  const F = await ev(() => window.__paw.dc.fake.map((c) => ({ id: c.id, n: c.dogs.length, b: c.dogs.map((d) => d.b), ok: c.dogs.every((d) => d.n >= 0 && d.o >= -1) })));
  ok(F.length === 8 && F.every((c) => c.n >= 1 && c.n <= 3 && c.ok), 'DC_FAKE: 8 town players with 1 to 3 dogs each');
  ok(new Set([].concat(...F.map((c) => c.b))).size >= 17, 'the 17 v2.11 breeds appear among them (lane BREEDS adds the four after pom)');
  ok(await ev(() => window.__paw.dc.mode()) === 'fake', 'dcMode is fake under the harness');

  sec('2. one dog in the Dog Park: visitors from the town players');
  await t.home('dogpark'); await t.until(() => window.__paw.dc.visitors().length > 0, null, 4000);
  let V = await vis(); const z = await ev(() => window.__paw.rm.zone('dogpark'));
  check(V, z, 'Dog Park');
  ok(await ev(() => window.__paw.dc.visitors().every((v) => Math.abs(v.k - window.__paw.rm.scale(v.y)) < 0.002)), 'each is drawn at rmScale(y)');
  ok(await ev(() => { const g = document.getElementById('dcVis'); return !!g && g.nextElementSibling && g.nextElementSibling.id === 'pack' && g.querySelectorAll('.dcvis').length === window.__paw.dc.visitors().length; }), '#dcVis sits just behind #pack, one group per visitor');
  ok(await ev(() => [...document.querySelectorAll('#dcVis .dcvis')].every((g) => g.querySelector('.dc-tag text').textContent === 'visitor' && g.getAttribute('role') === 'button' && /Dog Card/.test(g.getAttribute('aria-label')))), 'each has a small visitor tag and a button label');
  ok(await ev(() => !window.__paw.rm.scan().some((b) => b[4] === 'hot' && b[0] > 0 && document.querySelector('#dcVis'))), 'the roam scan does not count visitors as no-go boxes');
  const hots = await ev(() => window.__paw.rm.scan().filter((b) => b[4] !== 'scene'));
  ok(V.every((v) => hots.every((b) => ov(v.tap, b) === 0)), 'no visitor\'s tap rect covers a tappable spot, the bowl or a place button');
  ok((await tapsClear()).length === 0, 'a tap on any player dog or spot never lands on a visitor');
  await t.SH('dogpark_one');

  sec('3. other places: no visitors');
  await t.home('yard'); ok(await ev(() => !document.getElementById('dcVis') && !window.__paw.dc.visitors().length), 'none in the yard');
  await t.home('square'); ok(await ev(() => !document.getElementById('dcVis')), 'none in the Town Square');
  ok(await ev(() => window.__paw.dc.visit().then((l) => l.length === 0)), 'dcVisit draws nothing outside DC_PLACES');
  await ev(() => window.__paw.dc.visit(['town-2', 'town-7'])); // pins the next Dog Park visit's cards

  sec('4. the card sheet and a paw once a day');
  await t.home('dogpark'); await ev(() => window.__paw.rm.pause('test')); // nobody walks off while we tap (the suite runs with prefs.rmTest)
  await ev(() => window.__paw.dc.visit(['town-2', 'town-7'])); await t.until(() => window.__paw.dc.visitors().length >= 2, null, 4000);
  V = await vis();
  ok(V.length === 3 && V.filter((v) => v.card === 'town-2').length === 2 && V.filter((v) => v.card === 'town-7').length === 1, 'two cards: 2 dogs from the first, 1 from the second (3 at most)');
  const pt = await visPt(V.findIndex((v) => v.card === 'town-7'));
  ok(!!pt, 'the visitor is tappable');
  const keep0 = JSON.stringify(V.map((v) => [v.card, v.i, Math.round(v.x), Math.round(v.y)]));
  await t.home('dogpark'); await ev(() => window.__paw.rm.pause('test')); await t.until(() => window.__paw.dc.visitors().length >= 2, null, 4000);
  ok(JSON.stringify((await vis()).map((v) => [v.card, v.i, Math.round(v.x), Math.round(v.y)])) === keep0, 'the scene rebuilt in the same place: every visitor where it stood');
  await t.p.mouse.click(pt.x, pt.y); await t.waitH2(/Starry Lantern/);
  ok(await ev(() => /Starry Lantern/.test(document.querySelector('#modal h2').textContent)), 'a tap opens its card: the picked display name');
  const card = await ev(() => { const p = document.querySelector('#modal .panel'); return { dogs: p.querySelectorAll('.dc-dog').length, art: p.querySelectorAll('.dc-dog .dc-art svg').length, txt: p.textContent, paw: p.querySelector('#dcPaw').textContent, hide: !!p.querySelector('#dcHide') }; });
  ok(card.dogs === 1 && card.art === 1 && /Louie/.test(card.txt) && /French Bulldog/.test(card.txt) && /Grown-up/.test(card.txt), 'the dog drawn with its card name, breed and age');
  ok(/4\s*paws/.test(card.txt) && card.paw === 'Give a paw' && card.hide, 'the paw count, Give a paw and Hide this card');
  ok(!/@|;/.test(card.txt), 'no email and no free text on the card');
  await t.SH('card_sheet');
  await t.p.click('#dcPaw'); await t.waitToast(/You gave Starry Lantern a paw/);
  const s1 = await t.S(), today = await ev(() => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
  ok(s1.dc.given['town-7'] === today, 'S.dc.given keeps today\'s paw, on the Japan day like the Worker');
  ok(await ev(() => /5\s*paws/.test(document.querySelector('#modal .panel').textContent) && document.getElementById('dcPaw').textContent === 'Paw given today'), 'the count goes up and the button says Paw given today');
  await ev(() => document.getElementById('dcPaw').click()); ok(await t.waitToast(/already gave Starry Lantern a paw today/), 'a second paw the same day: a kind no');
  await t.closeX();
  await t.patch({ dc: { given: { 'town-7': '2000-01-01', 'old-card': '2000-01-01' } } });
  await ev(() => window.__paw.dc.card('town-7')); await t.waitH2(/Starry Lantern/);
  ok(await ev(() => document.getElementById('dcPaw').textContent === 'Give a paw' && /4\s*paws/.test(document.querySelector('#modal .panel').textContent)), 'the next day: a paw again');
  await t.p.click('#dcPaw'); await t.waitToast(/You gave/);
  ok(!('old-card' in (await t.S()).dc.given), 'S.dc.given is pruned to the last 2 days');
  await t.closeX();

  sec('5. Hide this card');
  await ev(() => window.__paw.dc.card('town-2')); await t.waitH2(/Sunny Pancake/);
  await t.p.click('#dcHide'); await t.p.click('#modal .confirm .yes'); await t.waitToast(/Sunny Pancake is hidden/);
  ok((await t.S()).dc.hide.includes('town-2'), 'S.dc.hide keeps the card id');
  ok(!(await vis()).some((v) => v.card === 'town-2'), 'its dogs leave the scene at once');
  let seen = false;
  for (let i = 0; i < 12 && !seen; i++) seen = (await ev(() => window.__paw.dc.visit(null).then(() => window.__paw.dc.cards()))).includes('town-2');
  ok(!seen, 'a hidden card never visits again (12 visits)');

  sec('6. four dogs roaming: visitors loop, step aside, and hold with the roam holds');
  await ev(() => { const P = window.__paw; P.addDog({ key: 'dachs', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); P.addDog({ key: 'golden', sex: 'female', months: 20 }, 'Goldie'); });
  await t.calm(); await ev(() => window.__paw.rm.resume('test'));
  await t.home('yard'); await t.home('dogpark'); await ev(() => window.__paw.dc.visit(['town-5', 'town-3'])); await t.sleep(300);
  V = await vis(); check(V, await ev(() => window.__paw.rm.zone('dogpark')), 'four dogs');
  const bad = [];
  const P0 = JSON.stringify(V.map((v) => [v.x, v.y]));
  for (let i = 0; i < 24; i++) { await t.sleep(400); const c = await tapsClear(); if (c.length) bad.push(c.join()); }
  ok(!bad.length, `over 10 s of roaming a tap on a player dog or spot never lands on a visitor ${bad.slice(0, 3).join(' | ')}`);
  const moved = JSON.stringify((await vis()).map((v) => [v.x, v.y])) !== P0;
  ok(moved, 'the visitors walk their small loops (prefs.rmTest)');
  await t.SH('dogpark_four');
  await ev(() => window.__paw.rm.pause('test')); await t.sleep(300);
  const H0 = JSON.stringify((await vis()).map((v) => [v.x, v.y])); await t.sleep(2500);
  ok(JSON.stringify((await vis()).map((v) => [v.x, v.y])) === H0, 'rmPause holds them where they stand');
  await ev(() => window.__paw.rm.resume('test'));
  await ev(() => window.__paw.bl.start('Tennis Ball')); await t.until(() => window.__paw.bl.on, null, 3000); await t.sleep(300);
  const B0 = JSON.stringify((await vis()).map((v) => [v.x, v.y])); await t.sleep(2500);
  ok(JSON.stringify((await vis()).map((v) => [v.x, v.y])) === B0, 'ball play holds them too');
  await ev(() => window.__paw.bl.stop()); await t.until(() => !window.__paw.bl.on, null, 3000);

  sec('7. Settings in fake mode: a Dog Card needs an email account');
  await ev(() => window.__pawCloud.open()); await t.p.waitForSelector('#dcBox');
  ok(/Log in with email to share a Dog Card/.test(await ev(() => document.getElementById('dcBox').textContent)), 'the account panel says: Log in with email to share a Dog Card');
  await t.closeX();

  sec('8. mock mode: publish, a visit from another device, paws, opt out');
  const srv = makeServer(), raw = srv.env.DB.raw;
  async function device(devName) {
    const p = await t.mk(devName ? { device: devName } : {});
    await t.ctx.exposeBinding('__clSrv', (src, m, u, b, a) => srv.handle(src.page, m, u, b, a));
    await t.ctx.addInitScript(mockInit, {}); srv.pages.add(p);
    await p.goto(URL); await p.waitForSelector('#tNew, #tContinue, #tGuest'); return p;
  }
  const use = (p) => { t.p = p; return p; };
  const adopt = async (p) => { use(p); if (await p.locator('#tGuest').count()) { await p.click('#tGuest'); await p.waitForSelector('#tNew'); } await t.adopt({ sex: 'girl' }); };
  const A = await device(); await adopt(A);
  await t.until(() => !!window.__pawCloud.CL.uid, null, 8000);
  await ev(() => window.__pawCloud.open()); await A.waitForSelector('#dcBox');
  ok(/Log in with email/.test(await ev(() => document.getElementById('dcBox').textContent)), 'a guest sees: Log in with email to share a Dog Card');
  await A.click('[data-cl=reg]'); await A.waitForSelector('#clPw2');
  await A.fill('#clEmail', 'cardowner@example.com'); await A.fill('#clPw', 'pupper123'); await A.fill('#clPw2', 'pupper123'); await A.click('[data-cl=doReg]');
  await t.until(() => /Account made/.test(document.getElementById('clBox').textContent), null, 8000);
  ok(await t.until(() => !!document.querySelector('#dcBox [data-dcs="open"]'), null, 4000), 'an email account gets the Dog Card button');
  ok(/not shared/.test(await ev(() => document.getElementById('dcBox').textContent)), 'off by default');
  await A.click('#dcBox [data-dcs="open"]'); await t.waitH2(/My Dog Card/);
  ok(await ev(() => !document.getElementById('dcOn').checked && document.querySelectorAll('[data-dcdog]').length === 1 && !!document.querySelector('#dcPrev .dc-dog')), 'the editor: Share off, the dogs to pick, a live preview');
  ok(await ev(() => !document.querySelector('#modal input[type=text], #modal textarea')), 'no text box anywhere: only lists');
  await A.check('#dcOn'); await A.selectOption('#dcA', '1'); await A.selectOption('#dcB', '2');
  ok(/Happy Dewdrop/.test(await ev(() => document.getElementById('dcPrev').textContent)), 'the preview follows the picked name');
  await t.SH('settings_editor');
  await A.click('#dcSave'); await t.until(() => /Your Dog Card is shared/.test(document.getElementById('dcMsg').textContent), null, 8000);
  const uidA = await ev(() => window.__pawCloud.CL.uid);
  const rowA = raw.prepare('select * from cards where user_id = ?').get(uidA);
  ok(rowA && rowA.name_a === 1 && rowA.name_b === 2 && JSON.parse(rowA.dogs).length === 1, 'Save publishes the card (PUT /card)');
  ok(rowA && !rowA.dogs.includes('cardowner') && !/[A-Z][a-z]+[a-z]/.test(rowA.dogs.replace(/"(b|c|o|a|s|sp|n|B|D|E|S|M|Bl|bl|sp|pup|adult|m|f|e|d|b)"/g, '')), 'the stored card has no email and no words, only indices and tokens');
  const S_A = await t.S(); ok(S_A.dc.on === true && S_A.dc.name.join() === '1,2' && S_A.dc.dogs.length === 1, 'S.dc keeps on, the name and the dogs');
  const cardId = rowA.id;
  await t.closeX();

  const B = await device(); await adopt(B);
  await t.until(() => !!window.__pawCloud.CL.uid, null, 8000);
  ok(await ev(() => window.__paw.dc.mode()) === 'on', 'dcMode is on with a session (a guest too)');
  await t.home('dogpark'); await t.until(() => window.__paw.dc.visitors().length > 0, null, 6000);
  V = await vis();
  ok(V.some((v) => v.card === cardId), 'the other player\'s card visits the Dog Park');
  ok(V.some((v) => /^town-/.test(v.card)), 'with fewer than 2 real cards, a town player fills up');
  await ev((id) => window.__paw.dc.card(id), cardId); await t.waitH2(/Happy Dewdrop/);
  await ev(() => { window.__toasts.splice(0); const b = document.getElementById('dcPaw'); b.click(); b.click(); b.click(); }); // a quick triple tap
  await t.waitToast(/You gave Happy Dewdrop a paw/); await t.sleep(400);
  ok(raw.prepare('select paws from cards where id = ?').get(cardId).paws === 1, 'Give a paw: the Worker counts it (POST /paw)');
  ok(await ev(() => window.__toasts.filter((x) => /You gave/.test(x)).length === 1), 'a triple tap gives one paw and one toast');
  const ptxt = await ev(() => document.querySelector('#modal .panel .dc-paws').textContent); ok(/^\s*1 paw$/.test(ptxt), 'the card shows 1 paw ' + ptxt);
  await t.closeX();
  await t.patch({ dc: { given: null } }); await t.patch({ dc: { given: {} } }); // this device forgot (another device, or another day by the clock)
  await ev(() => window.__toasts.splice(0)); await ev((id) => window.__paw.dc.card(id), cardId); await t.waitH2(/Happy Dewdrop/);
  await B.click('#dcPaw'); ok(await t.waitToast(/Happy Dewdrop already got your paw today/), 'the Worker says given:false: a kind "already got your paw today"');
  ok(raw.prepare('select paws from cards where id = ?').get(cardId).paws === 1 && !(await ev(() => window.__toasts.some((x) => /You gave/.test(x)))), 'no second paw and no "You gave"');
  ok((await t.S()).dc.given[cardId], 'and the device remembers it');
  await t.closeX();
  await ev(() => window.__paw.dc.settings()); await t.waitH2(/Dog Card/);
  ok(/Log in with email/.test(await ev(() => document.querySelector('#modal .panel').textContent)), 'a guest cannot share a card');
  await t.closeX();

  use(A); await ev(() => window.__toasts.splice(0));
  await ev(() => window.__paw.dc.sync());
  ok(await t.waitToast(/Your Dog Card got 1 new paw\./), 'the owner: "Your Dog Card got 1 new paw."');
  ok((await t.S()).dc.got === 1, 'S.dc.got remembers it');
  await ev(() => window.__toasts.splice(0)); await ev(() => window.__paw.dc.sync()); await t.sleep(300);
  ok(!(await ev(() => window.__toasts.some((x) => /new paw/.test(x)))), 'only once');
  ok((await t.S()).dc.uid === uidA, 'S.dc.uid: the account that switched it on');
  // the opt-in belongs to that account: a save switched on by another account never publishes from here
  await t.patch({ dc: { uid: 'another-account', name: [5, 5] } }); await ev(() => window.__paw.dc.sync());
  ok(raw.prepare('select name_a from cards where user_id = ?').get(uidA).name_a === 1, 'S.dc.uid of another account: nothing is published');
  await ev(() => window.__paw.dc.settings()); await t.waitH2(/My Dog Card/);
  ok(await ev(() => !document.getElementById('dcOn').checked), 'and the editor shows Share off for this account');
  await t.closeX(); await t.patch({ dc: { uid: uidA, name: [1, 2] } });
  // every dog on the card has left (adopted out): the card goes, Settings says so
  const keepDogs = (await t.S()).dc.dogs; await t.patch({ dc: { dogs: null } }); await t.patch({ dc: { dogs: [{ id: 'gone-dog', nm: 0 }] } });
  await ev(() => window.__paw.dc.sync());
  ok(!raw.prepare('select * from cards where user_id = ?').get(uidA), 'no dogs left on the card: DELETE /card');
  await t.patch({ dc: { dogs: null } }); await t.patch({ dc: { dogs: keepDogs } }); await ev(() => window.__paw.dc.sync());
  ok(!!raw.prepare('select * from cards where user_id = ?').get(uidA), 'the dogs are back: shared again');
  const cardId2 = raw.prepare('select id from cards where user_id = ?').get(uidA).id;
  // opt out
  await ev(() => window.__pawCloud.open()); await A.waitForSelector('#dcBox [data-dcs="open"]');
  ok(/shared\. 0 paws/.test(await ev(() => document.getElementById('dcBox').textContent)), 'the account panel: shared, 0 paws so far (the card was made again)');
  await A.click('#dcBox [data-dcs="open"]'); await t.waitH2(/My Dog Card/);
  await A.uncheck('#dcOn'); await t.until(() => /not shared any more/.test(document.getElementById('dcMsg').textContent), null, 8000);
  ok(!raw.prepare('select * from cards where user_id = ?').get(uidA) && !raw.prepare('select * from paws where card_id = ?').get(cardId2), 'turning it off deletes the card and its paws (DELETE /card)');
  ok((await t.S()).dc.on === false, 'S.dc.on is off');
  use(B); seen = false;
  for (let i = 0; i < 5 && !seen; i++) seen = (await ev(() => window.__paw.dc.visit(null).then(() => window.__paw.dc.cards()))).some((id) => id === cardId || id === cardId2);
  ok(!seen, 'it never visits again');
}, { prefs: { rmTest: true } });
