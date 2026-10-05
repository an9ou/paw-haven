// v2.1 TOWN: Gene Sniffer (Kibble Corner, Bond 6, 1,200 once), free vet sniff, Playdate Board sniff + npcTested,
// Town Square painter (500, up to 4 dogs, S.portrait + Family Photo Frame), tight visitor spot (4 dogs + visitor), Sparkle bubble, arrow keys.
require('./test_lib').run('v21_town', async (t) => {
  const { ok, sec, ev, S } = t; const p = () => t.p;
  await t.newGame({ sex: 'girl' }, { coins: 5000, bond: { level: 3, pts: 300 } });
  const tools = async () => { await t.home('market'); await p().click('#placeBtns [data-sh=kibble]', { force: true }); await p().waitForSelector('[data-tab=tools]'); await p().click('[data-tab=tools]'); await p().waitForSelector('.sitem'); };

  sec('Gene Sniffer: locked, bought once');
  await tools();
  ok(await p().locator('[data-buy="Gene Sniffer"]').count() === 0 && /Bond 6/.test(await p().textContent('.sitem .chip.lock')), 'locked below Bond 6 (Bond 6 chip)');
  ok(/unlocks when any dog reaches Bond 6/i.test(await p().textContent('.sitem')), 'the lock reason is shown');
  ok(await p().locator('.sitem .art').count() === 1, 'a tool card with art (a "?" placeholder is fine until the art merges)');
  await t.closeX();
  await t.patch({ bond: { level: 6, pts: 1200 } });
  await tools();
  let s = await S(); const c0 = s.coins;
  await p().click('[data-buy="Gene Sniffer"]', { force: true }); await p().waitForSelector('.buyveil'); await p().click('.bb-yes', { force: true });
  ok(await t.until(() => window.__paw.S.sniffer === true), 'bought: S.sniffer = true');
  s = await S(); ok(s.coins === c0 - 1200, `charged 1,200 (${c0} -> ${s.coins})`);
  ok(await t.until(() => !!document.querySelector('.sitem .chip.own')) && await p().locator('[data-buy="Gene Sniffer"]').count() === 0, 'card now says Owned, no Buy button (cannot be bought twice)');
  s = await S(); ok(!s.inv.food['Gene Sniffer'] && !(s.inv.toys || []).includes('Gene Sniffer'), 'not stored as food or a toy');
  await t.closeX();

  sec('free sniff at the vet');
  await t.home('vet'); await p().click('#placeBtns [data-pb=vet]'); await p().waitForSelector('#vetGene');
  ok(await p().locator('#vetSniff').count() === 1 && /Use your Gene Sniffer \(free\)/.test(await p().textContent('#vetSniff')), '"Use your Gene Sniffer (free)" shown for an untested dog');
  s = await S(); const c1 = s.coins;
  await p().click('#vetSniff'); await p().waitForSelector('.sniffcard');
  ok(await t.until(() => !!document.querySelector('.dnacard'), null, 6000), 'after the sniff animation the gene card opens');
  await t.until(() => !!document.querySelector('.dnacard.done'), null, 5000);
  s = await S(); ok(s.dog.geneTested === true && s.coins === c1, 'geneTested is set and no coins were charged');
  ok(await p().locator('.dna-lines li').count() >= 4, 'same gene card as the 60-coin test');
  await p().click('#dnaBack'); await p().waitForSelector('#vetGene');
  ok(await p().locator('#vetSniff').count() === 0, 'tested dog: no sniff button');
  await t.closeX();

  sec('playdate board sniff');
  await t.home('dogpark'); await p().waitForSelector('#playboardG'); await p().click('#playboardG'); await p().waitForSelector('.pbcard');
  ok(await p().locator('[data-sniff]').count() === 4, 'each NPC card has a Sniff button');
  const npc0 = await ev(() => window.__paw.town.boardDogs()[0]);
  ok(await ev((n) => window.__paw.town.npcTested(n), npc0) === false, 'npcTested is false before sniffing');
  await p().click('[data-sniff="0"]');
  ok(await t.until(() => !!document.querySelector('.pbcard .pbsniff')), 'the card shows the gene summary');
  const sum = await p().textContent('.pbcard .pbsniff');
  ok(/Carries|No hidden surprises|carries/.test(sum), 'summary text: ' + sum.trim());
  s = await S(); ok(!!s.sniffed[npc0.id], 'S.sniffed[npc.id] is set');
  ok(await ev((n) => window.__paw.town.npcTested(n), npc0) === true, 'npcTested is true after');
  ok(await p().locator('[data-sniff]').count() === 3, 'sniffed card has no Sniff button');
  await t.SH('01_board_sniff'); await t.closeX();

  sec('town painter');
  await ev(() => { const S = window.__paw.S, a = S.dogs[0]; ['corgi', 'husky', 'pug', 'poodle'].forEach((k, i) => { S.dogs.push(Object.assign(JSON.parse(JSON.stringify(a)), { id: 'pd' + i, key: k, name: 'Pal' + i })); }); });
  await t.home('square'); await p().waitForSelector('#easelG');
  ok(await p().locator('#easelG').count() === 1, 'the easel hotspot is in Town Square');
  await t.SH('02a_square_easel');
  s = await S(); const c2 = s.coins;
  ok(!s.portrait, 'no portrait yet');
  await p().click('#easelG', { force: true }); await p().waitForSelector('.painter');
  ok(/Hold still\. Everyone\. Even you, the one licking the easel\./.test(await p().textContent('.painter')), 'painter line');
  await t.SH('02_painter');
  const pickable = await p().locator('[data-tpick]').count(); ok(pickable === 5, '5 dogs to pick from');
  const sel0 = await p().$$eval('[data-tpick]', (b) => b.filter((x) => x.getAttribute('aria-pressed') === 'true').length); ok(sel0 === 4, 'up to 4 are preselected');
  await p().click('[data-tpick="pd3"]', { force: true });
  ok(await p().$$eval('[data-tpick]', (b) => b.filter((x) => x.getAttribute('aria-pressed') === 'true').length) === 4, 'a fifth dog cannot be added');
  await p().click('#twPaintGo');
  ok(await t.until(() => !!window.__paw.S.portrait), 'confirm sets S.portrait');
  s = await S(); ok(s.coins === c2 - 500, `charged 500 (${c2} -> ${s.coins})`);
  ok(s.portrait.ids.length === 4 && /^\d{4}-\d\d-\d\d$/.test(s.portrait.date), 'portrait = { date, ids } with 4 ids');
  ok(s.decor && s.decor['Family Photo Frame'] && s.decor['Family Photo Frame'].out === true && !!s.decor['Family Photo Frame'].got, 'Family Photo Frame decor added');
  const first = s.portrait.ids.slice();
  await p().click('#easelG', { force: true }); await p().waitForSelector('.painter');
  ok(/replaces the old one/.test(await p().textContent('.painter')), 'a new portrait replaces the old one (said on the card)');
  await p().click('[data-tpick]:nth-of-type(1)', { force: true }); await p().click('#twPaintGo');
  await t.until(() => document.querySelector('.painter') === null);
  s = await S(); ok(s.coins === c2 - 1000 && s.portrait.ids.join() !== first.join(), 'the second portrait replaced the first (500 more)');
  await ev(() => { window.__paw.S.coins = 100; });
  await p().click('#easelG', { force: true }); await p().waitForSelector('.painter'); await p().click('#twPaintGo');
  ok(await t.waitToast(/Not enough coins/), 'too poor: kind refusal'); s = await S(); ok(s.coins === 100, 'nothing charged');
  await t.closeX(); await ev(() => { window.__paw.S.coins = 5000; });

  sec('visitor with 4 dogs: tight spot');
  await t.freezeMotion(true);
  await ev(() => { const S = window.__paw.S; S.dogs.splice(4); S.house = 'Royal Castle Kennel'; S.rehomed = [{ id: 'rh_1', name: 'Pip-Squeak', key: 'corgi', mix: null, sex: 'male', coat: '', eyes: 'brown', sparkle: true, born: (() => { const d = new Date(); d.setDate(d.getDate() - 60); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })(), genes: null, family: 'the Tanakas by the bakery', gen: 1, lastVisit: '' }]; });
  for (const place of ['square', 'cafe']) {
    await t.home('yard'); await t.rnd(0.1); await t.home(place); await t.rnd(null);
    ok(await t.until(() => !!document.querySelector('#visitorG')), `${place}: the visitor shows`);
    await t.sleep(200);
    const m = await ev(() => {
      const r = (el) => { const b = el.getBoundingClientRect(); return [b.left, b.top, b.right, b.bottom]; }, ar = (a) => (a[2] - a[0]) * (a[3] - a[1]);
      const inter = (a, b) => Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1]));
      const v = r(document.querySelector('#visitorG > rect')), tag = r(document.querySelector('#visitorG .vtag rect')), packs = [...document.querySelectorAll('#pack .packdog > .pd-wander > rect')].map(r), me = r(document.querySelector('#dogHit'));
      const others = packs.concat([me]);
      return { frac: Math.max(...others.map((o) => inter(v, o) / ar(v))), tagFrac: Math.max(...packs.map((o) => inter(tag, o) / ar(tag))), n: packs.length, tagW: tag[2] - tag[0] };
    });
    ok(m.n === 3, `${place}: 3 pack dogs + active dog + visitor`);
    ok(m.frac <= 0.15, `${place}: visitor overlaps a dog's hit box by ${(m.frac * 100).toFixed(1)}% (max 15%)`);
    ok(m.tagFrac <= 0.15 && m.tagW >= 60, `${place}: name tag readable (overlap ${(m.tagFrac * 100).toFixed(1)}%, ${m.tagW.toFixed(0)}px wide)`);
    if (place === 'cafe') await t.SH('03_cafe_four_dogs_visitor');
  }
  ok(await ev(() => /and still sparkly!/.test(window.__paw.town.line)), 'Sparkle visitor bubble says "...and still sparkly!"');
  await t.freezeMotion(false);
  await ev(() => { const S = window.__paw.S; S.dogs.splice(1); S.activeId = S.dogs[0].id; S.rehomed = []; });

  sec('purchase window arrow keys still work');
  await t.home('market'); await p().click('#placeBtns [data-sh=kibble]', { force: true }); await p().waitForSelector('[data-tab=food]'); await p().click('[data-tab=food]'); await p().waitForSelector('[data-buy="Basic Kibble"]');
  await p().mouse.move(5, 300); await p().click('[data-buy="Basic Kibble"]', { force: true }); await p().waitForSelector('.buyveil'); await t.until(() => document.activeElement === document.querySelector('.bb-in'));
  const unit = await p().evaluate(() => +document.querySelector('.bb-unit').textContent.replace(/[^\d]/g, ''));
  await p().keyboard.press('ArrowRight'); await p().keyboard.press('ArrowUp');
  ok(await t.until(([n, u]) => { const m = /Total: ([\d,]+) coins/.exec(document.querySelector('.bb-sum').textContent); return document.querySelector('.bb-in').value === String(n) && !!m && +m[1].replace(/,/g, '') === n * u; }, [3, unit]), 'arrow keys: box shows 3 and Total = 3 x unit');
  await p().keyboard.press('Escape');
});
