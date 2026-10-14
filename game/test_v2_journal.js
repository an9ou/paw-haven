// v2 SYSTEMS: Journal (Profile genes/family/spots, Family tree, Coat Collection + milestones) and the Mailbox (daily gift, postcards, litter letters).
// node game/run_tests.js game/test_v2_journal.js --jobs 1
require('./test_lib').run('v2_journal', async (t) => {
  const { ok, sec, ev, S } = t;
  sec('new game, crafted family');
  const s0 = await t.newGame({}, { coins: 1000 });
  const p = t.p, me = s0.dog.id, key = s0.dog.key;
  const yday = await ev(() => { const d = new Date(); d.setDate(d.getDate() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const ago = (n) => ev((n) => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }, n);
  const corgiGenes = { B: ['B', 'B'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'sp'], M: ['m', 'm'], Bl: ['bl', 'bl'] };
  const tree = {
    gm1: { id: 'gm1', name: 'Granny Plum', key, sex: 'female', coat: '', status: 'npc', parents: null },
    gp1: { id: 'gp1', name: 'Grandpa Toast', key, sex: 'male', status: 'npc', parents: null },
    dam1: { id: 'dam1', name: 'Mama Miso', key, sex: 'female', status: 'npc', owner: 'the Tanakas by the bakery', parents: { dam: 'gm1', sire: 'gp1' } },
    sire1: { id: 'sire1', name: 'Duke', key: 'corgi', sex: 'male', status: 'npc', parents: null },
    pup1: { id: 'pup1', name: 'Pip-Squeak', key: 'corgi', sex: 'male', status: 'rehomed', family: 'the Tanakas by the bakery', parents: { dam: me, sire: 'sire1' } }
  };
  tree[me] = { id: me, name: s0.dog.name, key, sex: s0.dog.sex, status: 'home', parents: { dam: 'dam1', sire: 'sire1' } };
  const rehomed = [{ id: 'pup1', name: 'Pip-Squeak', key: 'corgi', sex: 'male', genes: corgiGenes, born: await ago(4), parents: { dam: me, sire: 'sire1' }, family: 'the Tanakas by the bakery', since: await ago(2), mix: null, sparkle: false }];
  await t.patch({ tree, rehomed, dog: { parents: { dam: 'dam1', sire: 'sire1' }, gen: 1 } });

  sec('daily gift: once per day');
  ok(await t.until(() => (window.__paw.S.mail || []).filter((m) => m.kind === 'gift').length === 1, null, 6000), 'first yard visit of the day: one gift letter');
  ok(await t.waitToast(/New mail/), 'toast "New mail"');
  ok(await p.locator('#mailboxG').count() === 1, 'mailbox hotspot in the home yard');
  ok(await ev(() => +document.querySelector('#mailboxG').dataset.unread >= 1), 'mailbox shows unread (flag)');
  await t.home(); await t.sleep(1300);
  ok((await S()).mail.filter((m) => m.kind === 'gift').length === 1, 'second yard visit the same day: still one gift');
  await t.patch({ mailGiftDay: yday }); await t.home();
  ok(await t.until(() => window.__paw.S.mail.filter((m) => m.kind === 'gift').length === 2, null, 6000), 'a new day: a second gift');
  await t.home('park'); ok(await p.locator('#mailboxG').count() === 0, 'no mailbox away from home'); await t.home('yard');

  sec('postcards from rehomed pups');
  await ev(() => window.__paw.mailTick());
  let s = await S(); const cards = () => s.mail.filter((m) => m.kind === 'postcard' && m.pup === 'pup1');
  ok(cards().length === 1 && cards()[0].dog && cards()[0].dog.key === 'corgi', 'rehomed 2 days ago: first postcard with the pup');
  await ev(() => window.__paw.mailTick()); s = await S();
  ok(cards().length === 1, 'not again on the same day');
  const nx = s.mailCards.pup1.next; ok(nx > (await ago(0)), 'next postcard scheduled in the future (' + nx + ')');
  await t.patch({ mailCards: { pup1: { next: yday } } }); await ev(() => window.__paw.mailTick()); s = await S();
  ok(cards().length === 2, 'about every 3 days: the next postcard arrives');

  sec('mailbox popup');
  const c0 = (await S()).coins;
  await p.click('#mailboxG', { position: { x: 40, y: 30 } }); ok(await p.waitForSelector('.panel.mailbox').then(() => true), 'mailbox opens from the yard');
  ok(await p.locator('.mb-item').count() === 4, '4 letters listed');
  await p.locator('.mb-item.k-postcard').first().click(); await p.waitForSelector('.letter.k-postcard .pc-photo svg');
  ok(await p.locator('.letter .pc-photo svg').count() === 1, 'postcard shows the pup photo'); await t.SH('mailbox_postcard');
  await p.locator('.mb-item.k-gift').first().click(); await p.waitForSelector('.letter.k-gift');
  ok(!(await S()).mail.some((m) => m.kind === 'gift' && m.gift && m.gift.claimed) && (await S()).coins === c0, 'v2.7: opening a gift letter waits for Collect');
  await p.click('.letter [data-mbget]'); await p.waitForSelector('.letter .mb-got');
  let s1 = await S(); const g1 = s1.mail.find((m) => m.kind === 'gift' && m.gift && m.gift.claimed);
  ok(!!g1, 'Collect claims the gift');
  const coinGift = g1 && g1.gift.coins ? g1.gift.coins : 0;
  ok(s1.coins === c0 + coinGift, `gift coins added once (${coinGift})`); await t.SH('mailbox_gift');
  await p.locator('.mb-item.k-postcard').first().click(); await p.locator(`.mb-item[data-mail="${g1.id}"]`).click(); await p.waitForSelector('.letter.k-gift');
  ok((await S()).coins === c0 + coinGift, 'reopening the gift gives nothing more');
  await t.closeX(); await t.modalGone();
  await ev(() => window.__paw.mailPush({ kind: 'litter', from: "Daisy's family", title: "Duke's puppies are here!", text: "Daisy's family says thank you.", pups: [] }));
  await p.click('#mailboxG', { position: { x: 40, y: 30 } }); await p.waitForSelector('.panel.mailbox');
  ok(await p.locator('.letter.k-litter [data-adoptpick]').count() === 1, 'litter letter: "Adopt this pup" button');
  await t.closeX(); await t.modalGone();
  ok(await ev(() => window.__paw.S.mail.every((m) => m.read || m.kind !== 'litter')), 'opened letters are marked read');

  sec('v2.0.1: the mailbox centre is clickable through the dog box, petting still works on the dog');
  await ev(() => window.__paw.idle.speed(50)); // no idle walk-offs while we measure
  const mbOverlap = () => t.until(() => {
    const mb = document.querySelector('#mailboxG'), hit = document.getElementById('dogHit'); if (!mb || !hit) return false;
    const r = mb.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    if (document.elementFromPoint(cx, cy) !== hit) return false;
    hit.style.pointerEvents = 'none'; const under = document.elementFromPoint(cx, cy); hit.style.pointerEvents = '';
    return !!under && mb.contains(under);
  }, null, 6000);
  ok(await mbOverlap(), "the dog's hit box covers the mailbox centre (the overlap that used to swallow clicks)");
  const mbB = await p.locator('#mailboxG').boundingBox(); await p.mouse.click(mbB.x + mbB.width / 2, mbB.y + mbB.height / 2);
  ok(await p.waitForSelector('.panel.mailbox', { timeout: 4000 }).then(() => true, () => false), 'clicking the mailbox centre opens the Mailbox');
  await t.closeX(); await t.modalGone();
  await t.patch({ stats: { happy: 50 } });
  const dogPt = await ev(() => { // a point where the dog itself is painted
    const hit = document.getElementById('dogHit'), r = hit.getBoundingClientRect(); hit.style.pointerEvents = 'none'; let pt = null;
    for (let fy = 0.5; fy < 0.95 && !pt; fy += 0.1) for (let fx = 0.3; fx < 0.75 && !pt; fx += 0.1) { const x = r.left + r.width * fx, y = r.top + r.height * fy, el = document.elementFromPoint(x, y); if (el && el.closest('#dogArt')) pt = [x, y]; }
    hit.style.pointerEvents = ''; return pt;
  });
  ok(!!dogPt, 'found a painted point on the dog');
  if (dogPt) { await p.mouse.click(dogPt[0], dogPt[1]); ok(await t.until(() => window.__paw.S.stats.happy > 50, null, 3000), 'a tap on the dog still pets (+Happiness)'); }
  ok(await ev(() => document.getElementById('modal').hidden), 'petting the dog does not open the Mailbox');
  await ev(() => window.__paw.idle.speed(1));

  sec('dev: Mail deliver now');
  await t.dev(async () => { ok(await p.locator('#dvMail').count() === 1, 'dev panel has "Mail: deliver now"'); await p.click('#dvMail'); ok(await t.waitToast(/Delivered/), 'deliver now works'); });

  sec('journal: tabs + profile genes');
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await p.click('[data-jt=profile]'); await p.waitForSelector('.profile .pf-genes');
  ok(await ev(() => { const b = [...document.querySelectorAll('.jtabs .btn')]; return b.length === 11 && b.every((x) => x.offsetTop === b[0].offsetTop) && b.every((x) => x.getBoundingClientRect().right <= document.querySelector('.panel.journal').getBoundingClientRect().right); }), '11 tabs on one row inside the popup');
  let pf = await p.textContent('.profile');
  ok(!/coming in v2/i.test(pf) && !/in v2/.test(pf), 'no "coming in v2" teasers');
  ok(await p.locator('.pf-genes .gslot').count() === 6 && /Gene test at the Vet Clinic/.test(pf), 'genes hidden before a gene test');
  ok(/Mama Miso/.test(pf) && /Duke/.test(pf) && /Generation 1/.test(pf) && /Pip-Squeak|1 puppy/.test(pf), 'profile: parents, generation, puppy');
  ok(await p.locator('[data-spots]').count() === 1, 'profile: Dog spots button');
  await t.SH('profile_hidden');
  await t.closeX(); await t.modalGone();
  await t.patch({ dog: { geneTested: true } });
  await p.click('[data-act=journal]'); await p.waitForSelector('.profile .pf-genes');
  ok(await p.locator('.pf-genes .gslot').count() === 0 && await p.locator('.pf-genes .glines li').count() >= 3, 'genes shown after the gene test'); await t.sleep(500); await t.SH('profile');

  sec('family tree');
  await p.click('.pf-fh[data-fam="dam1"]'); await p.waitForSelector('.famwrap');
  const nodes = () => ev(() => [...document.querySelectorAll('.ft [data-node-i]')].map((n) => ({ i: +n.dataset.nodeI, id: n.dataset.fam || null, t: n.textContent.trim() })).sort((a, b) => a.i - b.i));
  let ns = await nodes();
  ok(ns.length === 7 && ns[6].id === 'dam1' && ns[4].id === 'gm1' && ns[5].id === 'gp1', 'clicking a parent on the Profile re-centres the tree on her');
  await p.click('.fside .fback'); await p.waitForSelector('.famwrap'); ns = await nodes();
  ok(ns[6].id === me && ns[4].id === 'dam1' && ns[5].id === 'sire1' && ns[0].id === 'gm1' && ns[1].id === 'gp1', 'tree: dog at the bottom, parents and grandparents above');
  ok(!ns[2].id && !ns[3].id && /\?/.test(ns[2].t), 'unknown grandparents show "?"');
  const kid = await p.textContent('.fkids'); ok(/Pip-Squeak/.test(kid) && /With the Tanakas/.test(kid), 'children row with status chip "With the Tanakas"');
  await t.sleep(500); await t.SH('family');
  await p.click('.ft [data-fam="dam1"]'); await t.until(() => document.querySelector('.ft [data-node-i="6"]')?.dataset.fam === 'dam1');
  ok(/Home/.test(await p.textContent('.fkids')), 'click a node to re-centre; children show "Home"');
  await p.click(`.fkids [data-fam="${me}"]`); await t.until((me) => document.querySelector('.ft [data-node-i="6"]')?.dataset.fam === me, me);
  await p.click('.fkids [data-fam="pup1"]'); await t.until(() => document.querySelector('.ft [data-node-i="6"]')?.dataset.fam === 'pup1');
  ns = await nodes(); ok(ns[4].id === me && ns[5].id === 'sire1', 'rehomed pup: mum is your dog');
  await t.closeX(); await t.modalGone();

  sec('coat collection + milestones');
  const names = await ev((k) => { const G = window.PawGenes, set = new Set(); for (let i = 0; i < 4000 && set.size < 8; i++) set.add(G.phenotype(G.randomGenotype(k), k, 'x' + i).coatName); return [...set]; }, key);
  const own = await ev(() => window.__paw.coat(window.__paw.S.dog).coatName);
  const others = names.filter((n) => n !== own).slice(0, 2);
  ok(others.length === 2, 'found 2 extra coat names for the test');
  let book = {}; others.forEach((n) => { book[key + '|' + n] = yday; });
  await t.patch({ coatBook: book, coatRewards: {}, coins: 1000 });
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await p.click('[data-jt=coats]'); await p.waitForSelector('.ctop');
  let cs = await S(); const n0 = Object.keys(cs.coatBook).length;
  ok(n0 === 4 && /^4/.test(await p.textContent('.ccount b')), 'count shows 4 coats (2 + the dog at home + the rehomed pup)');
  ok(await p.locator('.cgrid .coat.found').count() === 3, '3 found coat frames for this breed');
  ok(await p.locator('.cbreed').count() >= 10 && await p.locator('.cstars i').count() >= 10, 'breed tabs and the sparkle row');
  ok(cs.coins === 1000 && !(cs.coatRewards || {})[5], 'no reward below 5 coats');
  await t.closeX(); await t.modalGone();
  book['corgi|Testy Tri'] = yday; book = Object.assign(book, (await S()).coatBook); await t.patch({ coatBook: book, sparkleBook: { corgi: yday } });
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await p.click('[data-jt=coats]'); await p.waitForSelector('.ctop');
  cs = await S(); ok(cs.coins === 1100 && !!cs.coatRewards[5], '5 coats: +100 coins'); ok(await t.waitToast(/5 coats/), 'milestone toast');
  ok(await p.locator('.cstars i.on').count() === 1, 'sparkle star for the corgi');
  await t.sleep(500); await t.SH('coats');
  await p.click('[data-cbreed="corgi"]'); await p.waitForSelector('.cbreed.on[data-cbreed="corgi"]');
  ok(/Testy Tri/.test(await p.textContent('.cgrid')), 'corgi tab lists its coat');
  await p.click('[data-jt=profile]'); await p.waitForSelector('.profile'); await p.click('[data-jt=coats]'); await p.waitForSelector('.ctop');
  ok((await S()).coins === 1100, 'milestone reward only once');
  await t.closeX(); await t.modalGone();
}, { timeout: 480000 });
