// v2.24 "Kind shop" (V224.md section 8, items 1-6 and 9): the game half. The Worker (/shop/*, Stripe) and the art (8) are other parts.
//   1. migration: an old save loads with every dog's outfit.feet = null and the S.shop defaults; nothing else changes
//   2. SHOP_LIVE off: no Kind shop button (Market Street, the phone menu), no Feet row, the sheet does not open, and no other shop, list or level row
//      carries a kind-shop item
//   3. coin buys: every look for 1,500 coins and every tool for its price, owned once; the Wardrobe wears and removes the sneakers (feet slot), the house
//      shows a Cozy Winter decoration once placed; the Supporter Pack and coins are never for coins
//   4. granting: a fake /shop/owned list grants once; the same list again, and the synced save after a reload, grant nothing more; a refund takes back
//      the one-time items (worn ones go back to nothing, the house moves back) and the coins that purchase added, and keeps what was bought with coins.
//      A refunded one-time item is not granted again. Two Supporter sessions add 2,000 coins once. Spent refunded coins become a debt the next pack pays.
//   5. perks: walk pay x1.2 rounded down after the half pay (and the walk result line), crops grow time x0.8, the second calendar gift never coins
//   6. tools: no Bond, coins, scooped count or act (mission) from the Robo Scoop, the Sprinkler or the Auto Water Bowl; town messes stay; Settings
//      switches them off
//   7. payments wiring (part 3): ksCheckout, ksRestore and the poll against the real Worker on a local D1, Stripe faked, window.open recorded
//   9. phone 360x640: the shop sheet and the confirm sheet with the phone bar, one column, 44 px taps, nothing covered (screenshots in test_logs/)
// node game/run_tests.js v224_shop
const { run, URL } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path'); const { makeServer, mockInit } = require('./cloud_mock');
devices['Phone 360x640'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 } });
const SAVE = 'pawhaven_proto_v1', LOGS = path.join(__dirname, 'test_logs');
const ON = { shopTest: true, shopCash: 'ok' };

run('v224_shop', async (t) => {
  const { ok, sec, ev } = t;
  const later = async () => { if (await t.until(() => !!document.querySelector('#modal .confirm .no'), null, 2500)) await t.p.click('#modal .confirm .no'); };

  sec('1. migration: an old save (no S.shop, no outfit.feet) loads with the defaults and nothing else changes');
  await t.newGame({ prefs: ON });
  const base = await ev((k) => { const P = window.__paw; P.S.outfit.neck = 'Red Bandana'; P.S.inv.clothes.push('Red Bandana'); P.saveNow(); const s = JSON.parse(localStorage.getItem(k)); delete s.shop; s.dogs.forEach((d) => { delete d.outfit.feet; }); return s; }, SAVE);
  ok(!('shop' in base) && base.dogs.every((d) => !('feet' in d.outfit)), 'the base save has no v2.24 fields');
  { const was = t.ctx; await t.mk({ storage: { [SAVE]: JSON.stringify(base) }, prefs: ON }); await was.close(); }
  await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu();
  const m1 = await ev(() => { const S = JSON.parse(JSON.stringify(window.__paw.S)); return { keys: Object.keys(S), shop: S.shop, feet: S.dogs.map((d) => d.outfit.feet), neck: S.dogs[0].outfit.neck, coins: S.coins, inv: S.inv, house: S.house, v: S.v }; });
  const lost = Object.keys(base).filter((k) => !m1.keys.includes(k));
  ok(m1.v === 1 && !lost.length, 'v stays 1, no field dropped' + (lost.length ? ': ' + lost.join(' ') : ''));
  ok(m1.feet.every((f) => f === null), 'every dog has outfit.feet = null: ' + JSON.stringify(m1.feet));
  ok(m1.shop && JSON.stringify(m1.shop.owned) === '[]' && JSON.stringify(m1.shop.claimed) === '[]' && JSON.stringify(m1.shop.tools) === '{"robo":true,"sprinkler":true,"bowl":true}', 'S.shop = { owned: [], claimed: [], tools: all on }: ' + JSON.stringify(m1.shop));
  ok(m1.neck === 'Red Bandana' && m1.coins === base.coins && JSON.stringify(m1.inv) === JSON.stringify(base.inv) && m1.house === base.house, 'the outfit, coins, bag and house are as they were');

  sec('2. SHOP_LIVE as built (no test switch): off = nothing new for players; on (launch) = the shop is there');
  { const was = t.ctx; await t.newGame({ prefs: { shopTest: false } }); await was.close(); }
  const off = await ev(() => { const K = window.__paw.ks; return { live: K.live, on: K.on(), open: !!K.open() }; });
  const LIVE = off.live === true; // v2.24 launch: the same section checks the switched-on shop once SHOP_LIVE is true
  if (LIVE) { ok(off.on === true && off.open, 'SHOP_LIVE is true: ksOn() is true and the sheet opens: ' + JSON.stringify(off)); await ev(() => { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); }); }
  else ok(off.live === false && off.on === false && !off.open, 'SHOP_LIVE is false, ksOn() is false, the sheet does not open: ' + JSON.stringify(off));
  await t.home('market');
  ok(await t.until(() => !!document.querySelector('#placeBtns [data-sh]'), null, 5000) && (await ev(() => !!document.querySelector('[data-pb="kindshop"]'))) === LIVE, LIVE ? 'Market Street has its shop buttons and the Kind shop button' : 'Market Street has its shop buttons and no Kind shop button');
  if (!LIVE) ok(!(await ev(() => /Kind shop/.test(document.body.innerText))), 'no "Kind shop" anywhere on the page');
  const leak = await ev(async () => {
    const P = window.__paw, out = [], K = P.ks, all = K.tokyo.concat(K.cozy, ['Golden Name Tag', 'Golden Paw Cottage']);
    const look = (k, tabs) => { for (const tb of tabs || [null]) { P.shop.shop(k); if (tb) { const b = document.querySelector(`[data-btab="${tb}"],[data-tab="${tb}"]`); if (b) b.click(); } const txt = document.querySelector('#modal .panel') ? document.querySelector('#modal .panel').innerText : ''; all.forEach((n) => { if (txt.includes(n)) out.push(k + '/' + (tb || '') + ': ' + n); }); } };
    look('boutique'); look('builder', ['houses', 'beds', 'decor', 'furniture']); look('kibble', ['food', 'toys', 'tools']);
    document.querySelector('#modal .panel .x') && document.querySelector('#modal .panel .x').click();
    return out;
  });
  ok(!leak.length, 'the Boutique, Barkitecture (houses, beds, decor, furniture) and Kibble Corner list no kind-shop item: ' + leak.join(' | '));
  const rows = await ev(() => { const K = window.__paw.ks, all = K.tokyo.concat(K.cozy, ['Golden Name Tag', 'Golden Paw Cottage']); const lv = window.__paw.lv; let r = []; try { r = (lv && lv.rows ? lv.rows() : []).map((x) => x.id); } catch (e) { r = []; } return { lv: all.filter((n) => r.includes(n)), wardFeet: (() => { window.__paw.shop.wardrobe(); const f = [...document.querySelectorAll('#modal .ward .slot[data-slot]')].map((h) => h.dataset.slot).concat([...document.querySelectorAll('#modal [data-wt="feet"]')].map(() => 'feet tab')); document.querySelector('#modal .panel .x').click(); return f; })() }; });
  ok(!rows.lv.length, 'no town level row unlocks a kind-shop item: ' + rows.lv.join(' '));
  if (LIVE) ok(rows.wardFeet.join() === 'head,eyes,neck,body,feet,charm,feet tab', 'the Wardrobe has a Feet tab and section with the shop on: ' + rows.wardFeet.join(', '));
  else ok(rows.wardFeet.length === 5 && !rows.wardFeet.some((x) => /feet/.test(x)), 'the Wardrobe has its four slots and the charm, no Feet tab or section: ' + rows.wardFeet.join(', '));
  const menu = await ev(() => typeof window.__paw.ks.open === 'function' && !document.getElementById('mmKs'));
  if (!LIVE) { ok(menu, 'no kind shop in the menu');
  ok(await ev(() => { const b = document.getElementById('ksPlus'); return !b || b.hidden || !b.offsetParent; }), 'no (+) by the coins while the shop is off'); }
  else ok(await ev(() => { const b = document.getElementById('ksPlus'); return !!b && !b.hidden && !!b.offsetParent; }), 'the (+) by the coins shows with the shop on');

  sec('3. coin buys: every look for 1,500 coins, every tool for its price, owned once');
  { const was = t.ctx; await t.newGame({ prefs: ON }, { coins: 50000 }); await was.close(); }
  await t.home('market');
  ok(await t.until(() => !!document.querySelector('[data-pb="kindshop"]'), null, 5000), 'with the kind shop on, Market Street shows a Kind shop button');
  await t.p.click('[data-pb="kindshop"]');
  ok(await t.until(() => !!document.querySelector('#modal .panel.ks [data-kstab]'), null, 4000), 'it opens the Kind shop sheet with its tabs');
  const tabs = await ev(() => [...document.querySelectorAll('#modal .panel.ks [data-kstab]')].map((b) => b.dataset.kstab).join(','));
  ok(tabs === 'supporter,looks,tools,coins', 'tabs Supporter, Looks, Tools, Coins: ' + tabs);
  const sup = await ev(() => { const c = document.querySelector('[data-ks="supporter"]'); return { cash: !!c.querySelector('[data-kscash="supporter"]'), coin: !!c.querySelector('[data-kscoin]'), txt: c.innerText, ask: /Ask a grown-up before you buy/.test(document.querySelector('#modal .panel').innerText), why: !!document.querySelector('.ks-why summary') }; });
  ok(sup.cash && !sup.coin && /US\$4\.99/.test(sup.txt), 'the Supporter Pack: US$4.99, never for coins');
  ok(sup.ask && sup.why, '"Ask a grown-up before you buy" and "Why is there a shop?" are on the sheet');
  const coins0 = await ev(() => window.__paw.S.coins);
  const looks = await ev(() => window.__paw.ks.tokyo.concat(window.__paw.ks.cozy));
  for (const n of looks) { await ev((n) => { window.__paw.ks.coinBuy(n); }, n); await t.win(); await later(); }
  const got = await ev((L) => L.filter((n) => window.__paw.ks.look(n)), looks);
  const c1 = await ev(() => window.__paw.S.coins);
  ok(got.length === 12 && coins0 - c1 === 12 * 1500, `all 12 looks owned for 1,500 coins each (${got.length}, spent ${coins0 - c1})`);
  ok(await ev(() => window.__paw.ks.owned('tokyo') && window.__paw.ks.owned('cozy')), 'both packs show as owned once every piece is');
  await ev(() => { window.__paw.ks.coinBuy('Bucket Hat'); }); await t.p.waitForSelector('.buyveil .bb-yes');
  ok(await ev(() => document.querySelector('.buyveil .bb-yes').disabled), 'a second buy of an owned look is refused (the coin window is disabled)');
  await t.p.click('.buyveil .bb-no'); await t.until(() => !document.querySelector('.buyveil'), null, 2000);
  for (const n of ['robo', 'sprinkler', 'bowl']) { await ev((n) => { window.__paw.ks.coinBuy(n); }, n); await t.win(); }
  const c2 = await ev(() => window.__paw.S.coins), tl = await ev(() => ['robo', 'sprinkler', 'bowl'].map((k) => window.__paw.ks.tool(k)));
  ok(tl.every(Boolean) && c1 - c2 === 22000, `the three tools for 10,000 + 6,000 + 6,000 coins (spent ${c1 - c2})`);
  await ev(() => window.__paw.ks.open('tools'));
  ok(await ev(() => !document.querySelector('[data-ks="comfort"]') && document.querySelectorAll('.panel.ks .ks-yours').length === 3), 'all tools owned: three "Yours" and the Comfort Kit is not offered');
  ok(await ev(async () => (await window.__paw.ks.coinBuy('supporter')) === false && (await window.__paw.ks.coinBuy('coins_1k')) === false), 'the Supporter Pack and coin packs cannot be bought with coins');
  await t.closeX();
  // the feet slot
  await ev(() => window.__paw.shop.wardrobe());
  ok(await t.until(() => !!document.querySelector('#modal .ward .slot[data-slot="feet"] [data-eq="Little Sneakers"]') && !!document.querySelector('#modal [data-wt="feet"]'), null, 3000), 'the Wardrobe has a Feet tab and the sneakers as a tile in its section');
  await t.p.click('#modal [data-eq="Little Sneakers"]');
  ok(await t.until(() => window.__paw.S.outfit.feet === 'Little Sneakers', null, 3000), 'the Little Sneakers go on the feet slot');
  ok(await ev(() => window.__paw.shop.outfit('sleep').feet === null && window.__paw.shop.outfit('idle').feet === 'Little Sneakers'), 'shoes come off for naps (the sleep outfit has no feet), on again awake');
  await t.p.click('#modal [data-un="feet"]');
  ok(await t.until(() => window.__paw.S.outfit.feet === null, null, 3000), 'Nothing on the Feet row takes them off');
  await t.closeX();
  // a Cozy Winter decoration in the house
  await ev(() => { const P = window.__paw, S = P.S, n = 'Cable-Knit Rug'; S.decor[n].at = P.ho.freeSpot(n); S.decor[n].out = true; S.place = 'house'; P.go('yard'); });
  ok(await t.until(() => !!document.querySelector('[data-decor="Cable-Knit Rug"]'), null, 6000), 'the Cable-Knit Rug, placed, stands in the house');

  sec('4. granting: once, again nothing, a synced save nothing, a refund takes back items and the coins');
  await t.home('yard');
  const L1 = [{ id: 'cs_test_sup', item: 'supporter', refunded: false }, { id: 'cs_test_3k', item: 'coins_3k', refunded: false }, { id: 'cs_test_tokyo', item: 'tokyo', refunded: false }, { id: 'cs_test_kit', item: 'comfort', refunded: false }];
  const g1 = await ev((L) => { const P = window.__paw, c = P.S.coins, r = P.ks.grant(L); return { r, d: P.S.coins - c, sup: P.ks.sup(), house: P.S.inv.houses.includes('Golden Paw Cottage'), tag: P.S.inv.clothes.includes('Golden Name Tag'), mail: (P.S.mail || []).find((m) => m.id === 'ks_thanks'), kit: P.S.shop.owned.includes('comfort') }; }, L1);
  ok(g1.r.granted.length === 4 && g1.d === 7000, `four purchases granted: 2,000 Supporter coins + 5,000 (coins_3k; got ${g1.d})`);
  ok(g1.sup && g1.house && g1.tag && g1.kit, 'the Supporter Pack: perks on, the Golden Paw Cottage, the Golden Name Tag; the Comfort Kit owned');
  ok(g1.mail && g1.mail.keep === true && /Gerald/.test(g1.mail.from), "Gerald's thank-you letter is in the mailbox, kept to reread");
  const g2 = await ev((L) => { const P = window.__paw, c = P.S.coins, r = P.ks.grant(L); return { n: r.granted.length, d: P.S.coins - c, letters: P.S.mail.filter((m) => m.id === 'ks_thanks').length }; }, L1);
  ok(g2.n === 0 && g2.d === 0 && g2.letters === 1, 'the same list again grants nothing (no coins, one letter)');
  await ev(() => { window.__paw.saveNow(); });
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu();
  const g3 = await ev((L) => { const P = window.__paw, c = P.S.coins, r = P.ks.grant(L); return { n: r.granted.length, d: P.S.coins - c, sup: P.ks.sup() }; }, L1);
  ok(g3.n === 0 && g3.d === 0 && g3.sup, 'the saved (synced) copy carries claimed: after a reload the list grants nothing more');
  const dup = await ev(() => {
    const P = window.__paw, S = P.S, shop = JSON.parse(JSON.stringify(S.shop)), coins = S.coins, houses = S.inv.houses.slice(), clothes = S.inv.clothes.slice();
    S.shop.owned = S.shop.owned.filter((x) => x !== 'supporter'); S.shop.onceBack = [];
    const c = S.coins, r = P.ks.grant([{ id: 'cs_dup_a', item: 'supporter', coins: 2000 }, { id: 'cs_dup_b', item: 'supporter', coins: 0 }]);
    const out = { n: r.granted.length, d: S.coins - c, items: r.items.join() };
    S.shop = shop; S.coins = coins; S.inv.houses = houses; S.inv.clothes = clothes; P.saveNow(); return out;
  });
  ok(dup.n === 2 && dup.d === 2000 && dup.items === 'supporter', 'two Supporter sessions grant 2,000 coins once (' + dup.d + ', items ' + dup.items + ')');
  // wear the pack pieces and live in the cottage, then refund
  await ev(() => { const S = window.__paw.S; if (!S.inv.houses.includes('Cozy Cottage')) S.inv.houses.push('Cozy Cottage'); window.__paw.shop.equip('Golden Name Tag'); window.__paw.shop.equip('Little Sneakers'); window.__paw.shop.equip('Round Shades'); });
  await ev(() => { const P = window.__paw; P.S.shop.prevHouse = 'Cozy Cottage'; P.S.house = 'Golden Paw Cottage'; });
  const L2 = L1.map((p) => Object.assign({}, p, { refunded: true }));
  const g4 = await ev((L) => { const P = window.__paw, S = P.S, c = S.coins, r = P.ks.grant(L); return { r, d: S.coins - c, sup: P.ks.sup(), house: S.house, houses: S.inv.houses.includes('Golden Paw Cottage'), tag: S.inv.clothes.includes('Golden Name Tag'), neck: S.outfit.neck, feet: S.outfit.feet, eyes: S.outfit.eyes, sneakers: S.inv.clothes.includes('Little Sneakers'), kit: S.shop.owned.includes('comfort'), robo: P.ks.tool('robo') }; }, L2);
  ok(g4.r.refunded.length === 4 && g4.d === -7000, 'four refunds handled, the 2,000 Supporter coins and the 5,000 pack are taken back (' + g4.d + ')');
  ok(!g4.sup && !g4.houses && g4.house === 'Cozy Cottage', 'the Supporter perks end, the cottage is taken back and the dog moves back to the house before: ' + g4.house);
  ok(!g4.tag && g4.neck === null, 'the worn Golden Name Tag goes back to Nothing');
  ok(g4.sneakers && g4.feet === 'Little Sneakers' && g4.eyes === 'Round Shades', 'Tokyo Street pieces bought with coins stay, worn as they were');
  ok(!g4.kit && g4.robo, 'the Comfort Kit is taken back; the Robo Scoop bought with coins stays');
  const g5 = await ev((L) => { const P = window.__paw, c = P.S.coins; P.S.inv.clothes.push('Golden Name Tag'); const r = P.ks.grant(L); const keep = P.S.inv.clothes.includes('Golden Name Tag'); P.S.inv.clothes = P.S.inv.clothes.filter((x) => x !== 'Golden Name Tag'); return { n: r.refunded.length + r.granted.length, d: P.S.coins - c, keep }; }, L2);
  ok(g5.n === 0 && g5.d === 0 && g5.keep, 'a refund is handled once: the same refunded list again takes nothing');
  const g6 = await ev(() => { const P = window.__paw, c = P.S.coins, r = P.ks.grant([{ id: 'cs_late', item: 'cozy', refunded: true }, { id: 'cs_bad', item: 'a_dog', refunded: false }, { id: '', item: 'coins_8k' }, null]); return { r, d: P.S.coins - c }; });
  ok(!g6.r.granted.length && !g6.r.refunded.length && g6.d === 0, 'a purchase refunded before it was granted, an unknown item and a bad row do nothing');
  ok(await ev(() => !window.__paw.S.shop.onceBack.includes('cozy') && !window.__paw.ks.refundedId('cozy')), 'a looks pack refunded before this save got it is not marked: it is for sale again (owner, 13 Nov: only the Supporter Pack is never for sale again)');
  // owner, 13 Nov: after a full refund a looks pack or a tool can be bought again, and a new purchase gives its looks or tool again, never coins
  const rebuy = await ev(() => {
    const P = window.__paw, S = P.S, K = P.ks, keep = JSON.parse(JSON.stringify(S.shop)), c0 = S.coins, cl0 = S.inv.clothes.slice(), of0 = S.dogs.map((d) => Object.assign({}, d.outfit));
    S.shop.onceBack = ['tokyo', 'comfort', 'robo']; // an older build listed these: they no longer block anything
    const old = { tok: K.refundedId('tokyo'), kit: K.refundedId('comfort'), robo: K.refundedId('robo') };
    S.shop.coin = S.shop.coin.filter((x) => x !== 'robo' && x !== 'sprinkler' && x !== 'bowl'); // only the Kit decides the tools here
    S.inv.clothes = S.inv.clothes.filter((x) => !K.tokyo.includes(x)); S.shop.coin = S.shop.coin.filter((x) => !K.tokyo.includes(x));
    const c = S.coins, r = K.grant([{ id: 'cs_rebuy_tok', item: 'tokyo', coins: 0 }, { id: 'cs_rebuy_kit', item: 'comfort', coins: 0 }]);
    const o = { old, d: S.coins - c, granted: r.granted.length, tok: K.owned('tokyo'), looks: K.tokyo.every((n) => S.inv.clothes.includes(n)), kit: K.owned('comfort'), robo: K.tool('robo'),
      left: S.shop.onceBack.filter((x) => x === 'tokyo' || x === 'comfort').join() };
    const mint = K.grant([{ id: 'cs_rebuy_tok2', item: 'tokyo', coins: 5000 }, { id: 'cs_rebuy_robo', item: 'robo', coins: 9999 }]); o.mint = S.coins - c - o.d; o.mintRet = mint.coins;
    const b = K.grant([{ id: 'cs_rebuy_tok', item: 'tokyo', refunded: true }, { id: 'cs_rebuy_tok2', item: 'tokyo', refunded: true }, { id: 'cs_rebuy_kit', item: 'comfort', refunded: true }]);
    o.back = { tok: K.owned('tokyo'), kit: S.shop.owned.includes('comfort'), d: S.coins - c, onceBack: S.shop.onceBack.filter((x) => x !== 'robo').join(), refT: K.refundedId('tokyo'), refK: K.refundedId('comfort'), n: b.refunded.length };
    S.shop = keep; S.coins = c0; S.inv.clothes = cl0; S.dogs.forEach((d, i) => { if (d.outfit) Object.assign(d.outfit, of0[i]); }); P.saveNow(); return o;
  });
  ok(!rebuy.old.tok && !rebuy.old.kit && !rebuy.old.robo, 'an older save whose onceBack lists Tokyo Street, the Kit or a tool: none of them is blocked any more: ' + JSON.stringify(rebuy.old));
  ok(rebuy.granted === 2 && rebuy.d === 0 && rebuy.tok && rebuy.looks && rebuy.kit && rebuy.robo, 'Tokyo Street and the Comfort Kit bought again after a refund: the six looks and the tools come back, 0 coins: ' + JSON.stringify(rebuy));
  ok(rebuy.mint === 0 && rebuy.mintRet === 0, 'a looks pack or a tool row never adds coins, even if a row says it carries some');
  ok(rebuy.back.n === 3 && !rebuy.back.tok && !rebuy.back.kit && rebuy.back.d === 0 && !rebuy.back.onceBack && !rebuy.back.refT && !rebuy.back.refK, 'their refunds take them back again, take no coins, and leave them for sale (not in onceBack): ' + JSON.stringify(rebuy.back));
  const debt = await ev(() => {
    const P = window.__paw, S = P.S, c0 = S.coins, d0 = S.shop.coinDebt || 0;
    S.coins = 100; P.ks.grant([{ id: 'cs_debt_pack', item: 'coins_1k' }]); S.coins = 50;
    P.ks.grant([{ id: 'cs_debt_pack', item: 'coins_1k', refunded: true }]);
    const mid = { coins: S.coins, debt: S.shop.coinDebt };
    P.ks.grant([{ id: 'cs_debt_pack2', item: 'coins_1k' }]);
    const after = { coins: S.coins, debt: S.shop.coinDebt };
    S.coins = c0; S.shop.coinDebt = d0; P.saveNow(); return { mid, after };
  });
  ok(debt.mid.coins === 0 && debt.mid.debt === 1950, 'a refund takes the coins still there and remembers the ones already spent (' + JSON.stringify(debt.mid) + ')');
  ok(debt.after.coins === 50 && debt.after.debt === 0, 'the next coin pack pays that debt before any coins are added (' + JSON.stringify(debt.after) + ')');
  // review 13 Nov, 4: the refund letter, the Delivered! split, My purchases, every coin text
  const vis = await ev(() => {
    const P = window.__paw, S = P.S, K = P.ks, c0 = S.coins, d0 = S.shop.coinDebt, mail0 = S.mail.length;
    S.coins = 100; K.grant([{ id: 'cs_vis_pack', item: 'coins_1k', coins: 2000 }]); S.coins = 50;
    const r1 = K.grant([{ id: 'cs_vis_pack', item: 'coins_1k', coins: 2000, refunded: true }]);
    const letter = S.mail.find((m) => m.id === 'ks_refund_cs_vis_pack');
    const debt1 = S.shop.coinDebt;
    const r2 = K.grant([{ id: 'cs_vis_pack2', item: 'coins_3k', coins: 5000 }]); K.grantToast(r2);
    const deliv = S.mail.find((m) => m.id === 'ks_got_cs_vis_pack2'), split = { items: r2.items.join(), got: r2.got[0], line: K.gotLine('coins_3k', r2.got[0]) };
    const coinsAfter = S.coins, debt2 = S.shop.coinDebt;
    S.shop.coinDebt = 40; const c1 = S.coins, g1 = K.addCoinsD(25, true), earn = g1.n, note = K.settleNote(g1.d), c2 = S.coins, g2 = K.addCoinsD(25, true), earn2 = g2.n, note2 = K.settleNote(g2.d), c3 = S.coins;
    const stale = K.settleNote(0) + K.settleNote(); // a text with no coins of its own (a toy gift) says nothing, whatever an earlier call settled
    const out = { r1: { letter: r1.letter, refunded: r1.refunded.length, coins: r1.coins }, letter: letter ? { title: letter.title, text: letter.text, keep: letter.keep } : null, debt1, deliv: deliv ? deliv.text : '', split, coinsAfter, debt2,
      earn, note, d1: c2 - c1, earn2, note2, d2: c3 - c2, debt3: S.shop.coinDebt, stale };
    S.coins = c0; S.shop.coinDebt = d0; S.mail.length = mail0; P.saveNow(); return out;
  });
  ok(vis.r1.refunded === 1 && vis.r1.letter && vis.letter && /refund/i.test(vis.letter.title) && /2,?000 Paw Coins/.test(vis.letter.text) && /next 1,?950 coins/.test(vis.letter.text) && vis.debt1 === 1950, "a refund that takes coins back sends Gerald's kind letter (coins went back, the next 1,950 settle the rest): " + JSON.stringify(vis.letter));
  ok(vis.split.items === 'coins_3k' && vis.split.got.n === 5000 && vis.split.got.a === 3050 && vis.coinsAfter === 3050 && vis.debt2 === 0, 'a coin pack bought while settling is still delivered, and the split is known (5,000 = 1,950 settled + 3,050 added): ' + JSON.stringify(vis.split.got));
  ok(/1,?950 settled the refund and 3,?050 coins were added/.test(vis.split.line) && /1,?950 settled the refund/.test(vis.deliv), "Delivered! and Gerald's delivery letter say how the pack split: " + vis.split.line);
  ok(vis.earn === 25 && /25 coins go to settling the refund/.test(vis.note) && vis.d1 === 0, 'a coin gain while settling shows what happened: +25 earned, "(25 coins go to settling the refund)", the balance does not move: ' + vis.note);
  ok(vis.earn2 === 25 && /15 coins go to settling/.test(vis.note2) && vis.d2 === 10 && vis.debt3 === 0, 'the last 15 settle it and 10 reach the balance; nothing goes negative: ' + vis.note2);
  ok(vis.stale === '', 'a settle note reads its own coins only: with none it says nothing (no stale "last call" value): ' + JSON.stringify(vis.stale));
  const lbl = await ev(async () => {
    const P = window.__paw, S = P.S, K = P.ks, d0 = S.shop.coinDebt; S.shop.coinDebt = 1234;
    K.open('supporter'); await new Promise((r) => setTimeout(r, 200));
    const sup = document.querySelector('#modal [data-ks="supporter"]'), mine = document.querySelector('#modal .ks-mine'), settling = document.querySelector('#modal .ks-settling');
    const o = { supRef: !!(sup && sup.querySelector('.ks-refunded')), supPay: !!(sup && sup.querySelector('[data-kscash]')), supText: sup && sup.querySelector('.ks-refunded') ? sup.querySelector('.ks-refunded').innerText : '', mineOpen: !!(mine && mine.open), settling: settling ? settling.innerText : '' };
    K.open('looks'); await new Promise((r) => setTimeout(r, 200));
    const tk = document.querySelector('#modal [data-ks="tokyo"]');
    o.tokRef = !!tk && !tk.querySelector('.ks-refunded') && !!(tk.querySelector('[data-kscash]') || tk.querySelector('.ks-yours')); // for sale again (Yours when every look was bought with coins)
    o.lookCoins = document.querySelectorAll('#modal [data-kslook]').length + document.querySelectorAll('#modal [data-kslookcard] .ks-yours').length === 12;
    K.open('tools'); await new Promise((r) => setTimeout(r, 200));
    const kit = document.querySelector('#modal [data-ks="comfort"]');
    o.kit = !kit || (!kit.querySelector('.ks-refunded') && !!kit.querySelector('[data-kscash]'));
    o.toolPay = !!document.querySelector('#modal [data-kscash="sprinkler"]') || P.ks.tool('sprinkler');
    S.shop.coinDebt = d0; return o;
  });
  ok(lbl.supRef && !lbl.supPay && /not for sale again/i.test(lbl.supText), 'the refunded Supporter Pack card says "' + lbl.supText + '" and has no Pay button');
  ok(lbl.tokRef && lbl.lookCoins && lbl.kit && lbl.toolPay, 'refunded Tokyo Street and Comfort Kit cards show their Pay button again (only the Supporter Pack is never for sale again); each look still has its coin price, a tool never bought still has its Pay button');
  ok(lbl.mineOpen && /Settling: 1,?234 coins/.test(lbl.settling), 'My purchases is open while settling and says "' + lbl.settling.slice(0, 60) + '"');
  await t.home('yard');
  // a paid Supporter row that arrives after its refund (paid before that refund, a race the Worker no longer allows) still delivers: the player paid
  const again = await ev(() => { const P = window.__paw, c = P.S.coins, r = P.ks.grant([{ id: 'cs_sup_again', item: 'supporter', coins: 2000 }]); const o = { d: P.S.coins - c, sup: P.ks.sup(), items: r.items.join(), refunded: P.ks.refundedId('supporter') };
    const b = P.ks.grant([{ id: 'cs_sup_again', item: 'supporter', coins: 2000, refunded: true }]); o.back = { sup: P.ks.sup(), refunded: P.ks.refundedId('supporter'), n: b.refunded.length }; return o; });
  ok(again.d === 2000 && again.sup && again.items === 'supporter' && !again.refunded, 'a paid Supporter session after a refund still delivers (+2,000, perks on, the card is not "refunded")');
  ok(again.back.n === 1 && !again.back.sup && again.back.refunded, 'and its own refund takes it back again');
  // review 13 Nov, 5: a pack granted before the save recorded coinGot (before this fix) is taken back at the size the row was for
  const leg = await ev(() => {
    const P = window.__paw, S = P.S, K = P.ks, c0 = S.coins, d0 = S.shop.coinDebt, oldAt = Date.UTC(2026, 10, 10, 9), newAt = Date.UTC(2026, 10, 12, 9);
    S.shop.claimed.push('cs_leg_a', 'cs_leg_b', 'cs_leg_c'); S.coins = 20000; S.shop.coinDebt = 0;
    const a = -K.grant([{ id: 'cs_leg_a', item: 'coins_1k', at: oldAt, coins: 1000, refunded: true }]).coins;
    const b = -K.grant([{ id: 'cs_leg_b', item: 'coins_8k', at: oldAt, refunded: true }]).coins; // an old Worker that sends no coins: the date decides
    const c = -K.grant([{ id: 'cs_leg_c', item: 'coins_1k', at: newAt, refunded: true }]).coins;
    S.coins = 300; S.shop.claimed.push('cs_leg_d');
    K.grant([{ id: 'cs_leg_d', item: 'coins_3k', at: oldAt, coins: 3000, refunded: true }]);
    const o = { a, b, c, d: { coins: S.coins, debt: S.shop.coinDebt }, nom: K.nominal({ item: 'coins_1k', coins: 99999 }) };
    S.coins = c0; S.shop.coinDebt = d0; P.saveNow(); return o;
  });
  ok(leg.a === 1000 && leg.b === 8000 && leg.c === 2000, 'packs granted before this fix are taken back at the size the row was for: 1,000 / 8,000 (old, by date) and 2,000 (new): ' + JSON.stringify(leg));
  ok(leg.d.coins === 0 && leg.d.debt === 2700 && leg.nom === 2000, 'the debt is never more than the row granted (3,000 - 300 = 2,700), and a row never counts for more than the pack is today');
  // review 13 Nov, 6: a fresh device restores two Supporter rows, the older one refunded: the 2,000 come with the live one
  const fresh = await ev(() => {
    const P = window.__paw, S = P.S, keep = JSON.parse(JSON.stringify(S.shop)), coins = S.coins, houses = S.inv.houses.slice(), clothes = S.inv.clothes.slice(), mail = S.mail.length;
    S.shop.owned = S.shop.owned.filter((x) => x !== 'supporter'); S.shop.onceBack = []; S.shop.claimed = []; S.shop.refunded = []; S.shop.coinGot = {};
    const c = S.coins, r = P.ks.grant([{ id: 'cs_fd_a', item: 'supporter', at: 1, coins: 0, refunded: true }, { id: 'cs_fd_b', item: 'supporter', at: 2, coins: 2000 }]);
    const o = { d: S.coins - c, sup: P.ks.sup(), granted: r.granted.join(), refunded: r.refunded.length, letter: !!r.letter, back: P.ks.refundedId('supporter') };
    S.shop = keep; S.coins = coins; S.inv.houses = houses; S.inv.clothes = clothes; S.mail.length = mail; P.saveNow(); return o;
  });
  ok(fresh.d === 2000 && fresh.sup && fresh.granted === 'cs_fd_b' && !fresh.letter && !fresh.back, 'a fresh device: the live Supporter row brings its 2,000 and the perks; the refunded one takes nothing: ' + JSON.stringify(fresh));

  sec('5. perks: walk pay x1.2 after half pay, crops x0.8 grow time, the second gift never coins');
  await ev(() => { const sh = window.__paw.S.shop; if (!sh.owned.includes('supporter')) sh.owned.push('supporter'); }); // perks under test; a refunded pack is not bought again
  const wp = await ev(() => { const P = window.__paw, h = P.rh.share(37, 0, 0.5), f = P.rh.share(37, 0, 1); return { half: h, full: f, bh: P.ks.walkBonus(P.rh.share(37, 0, 0.5)), bf: P.ks.walkBonus(f), b9: P.ks.walkBonus(9) }; });
  ok(wp.half === 19 && wp.bh === 3 && wp.bf === 7 && wp.b9 === 1, `+20% rounded down after the half pay: 37 half -> ${wp.half} +${wp.bh}, full 37 +${wp.bf}, 9 +${wp.b9}`);
  // a real walk after the 5th of the day: the result says "+N Supporter" and N is 20% of the pay, rounded down
  await ev(() => { const S = window.__paw.S; window.__paw.rh.dailyCheck(); S.daily.walks = 5; S.stats.energy = 100; });
  await ev(() => { const s0 = window.PawWalk.start; window.PawWalk.start = (el, o) => { window.__ksWalk = o; return s0(el, o); }; }); // the runner's end, with a known pay: 47 raw coins, no pouch
  await t.startWalk(true); await t.sleep(1500);
  await ev(() => { window.__ksC0 = window.__paw.S.coins; window.__paw.S.shop.coinDebt = 30; }); // review 13 Nov, 4: a walk while settling still shows its pay, and says where 30 of it went
  await ev(() => window.__ksWalk.onEnd({ coins: 47, distance: 12, early: false, happiness: 5, bond: 1, energy: 5, cleanliness: 2 }));
  await t.until(() => !!document.getElementById('resOk'), null, 8000);
  const wr = await ev(() => { const l = document.querySelector('#modal .ks-walk'), st = document.querySelector('#modal .ks-settle'), tile = [...document.querySelectorAll('#modal .results .res')].map((r) => r.innerText).find((x) => /Paw Coins/.test(x)) || ''; return { line: l ? l.innerText : '', tired: !!document.querySelector('#modal .walk-tired'), tile, settle: st ? st.innerText : '', dc: window.__paw.S.coins - window.__ksC0, debt: window.__paw.S.shop.coinDebt }; });
  ok(/30 coins went to settling the refund/.test(wr.settle) && /All settled/.test(wr.settle) && (wr.dc === 57 - 30 || wr.dc === 57 + 20 - 30) && wr.debt === 0, 'the walk result says "' + wr.settle + '" and the balance grew by the rest (' + wr.dc + ', with the daily play bonus)');
  const tot5 = +((/\+(\d+)/.exec(wr.tile) || [0, 0])[1]), m5 = /\+(\d+) Supporter/.exec(wr.line), n5 = m5 ? +m5[1] : 0;
  ok(wr.tired, 'the walk was the 6th today (half pay)');
  ok(tot5 - n5 === 48 && n5 === 9, `47 raw coins on the 6th walk: half pay 24, x2 = 48, the walk result shows +${n5} Supporter on ${tot5 - n5} coins of half pay (the tile says +${tot5}): 20% rounded down`);
  await t.p.click('#resOk'); await t.untilMode('yard'); await t.lu(); await t.calm();
  const gr = await ev(() => { const P = window.__paw, G = window.PawGarden, pl = () => ({ crop: 'carrot', g: 0, water: 3, wd: 0, dry: 0, inSeason: true, inspected: false, ready: null, took: 0, planted: null, harvested: 0 }); const st = { v: 2, plots: [pl(), pl(), pl(), pl(), pl(), pl()], last: P.S.garden.last, harvests: {} };
    const a = G.advance(st, { steps: 1, stepWeather: 'cloudy', growMul: P.ks.growMul() }).state.plots[0].g, b = G.advance(st, { steps: 1, stepWeather: 'cloudy' }).state.plots[0].g; return { mul: P.ks.growMul(), a, b }; });
  ok(gr.mul === 1.25 && Math.abs(gr.a / gr.b - 1.25) < 1e-9, `crops: one hour grows ${gr.a.toFixed(4)} with the Supporter Pack vs ${gr.b.toFixed(4)} (grow time x0.8)`);
  const gifts = await ev(() => { const K = window.__paw.ks, bad = []; for (let m = 1; m <= 12; m++) for (let d = 1; d <= 31; d++) { const ym = '2026-' + String(m).padStart(2, '0'), r = K.gift2(ym, d); if (!r || r.t === 'coins' || r.c) bad.push(ym + '-' + d); } return bad; });
  ok(!gifts.length, 'the second daily gift is never coins (a whole year of days): ' + gifts.slice(0, 3).join(' '));
  const gc = await ev(() => { const P = window.__paw, S = P.S, t = new Date(), ym = t.getFullYear() + '-' + String(t.getMonth() + 1).padStart(2, '0'), d = t.getDate(); S.fw = S.fw || {}; S.fw.cal = Object.assign(S.fw.cal || {}, { ym, days: [d], dg: S.fw.cal && S.fw.cal.ym === ym ? S.fw.cal.dg : [] }); const c = S.coins, can = P.ks.gift2Can(), a = P.ks.gift2Claim(), b = P.ks.gift2Claim(); return { can, a, b, d: S.coins - c }; });
  ok(gc.can && gc.a && !gc.b && gc.d === 0, 'the Supporter claims the second gift once a day, and it adds no coins');

  sec('6. tools: no Bond, coins, scooped or acts; town messes stay; Settings switches them off');
  await t.home('yard');
  const r1 = await ev(() => { const P = window.__paw, S = P.S, gm = S.gameMin; S.shop.roboAt = -1e9; S.messes.yard = [{ type: 'poop', x: 420, at: gm - 30, dog: S.dog.id }]; S.messes.park = [{ type: 'pee', x: 300, at: gm - 300, dog: S.dog.id }];
    const b = JSON.stringify(S.dogs.map((d) => d.bond)), c = S.coins, sc = S.dogs.map((d) => d.potty.scooped).join(); P.ks.rec(); P.ks.robo();
    const r = { yard: S.messes.yard.length, park: S.messes.park.length, bond: JSON.stringify(S.dogs.map((d) => d.bond)) === b, coins: S.coins === c, sc: S.dogs.map((d) => d.potty.scooped).join() === sc, acts: P.ks.acts() };
    S.messes.yard = [{ type: 'pee', x: 300, at: gm - 30, dog: S.dog.id }]; P.ks.robo(); r.hour = S.messes.yard.length; return r; });
  ok(r1.yard === 0 && r1.bond && r1.coins && r1.sc && !r1.acts.length, 'Robo Scoop: the yard poop is tidied with no Bond, coins, scooped count or act: ' + JSON.stringify(r1.acts));
  ok(r1.park === 1, 'a town mess (the park) is never tidied by it');
  ok(r1.hour === 1, 'once a game hour: a second mess right after waits');
  const r2 = await ev(() => { const P = window.__paw, S = P.S; S.shop.tools.robo = false; S.shop.roboAt = -1e9; P.ks.robo(); const n = S.messes.yard.length; S.shop.tools.robo = true; return n; });
  ok(r2 === 1, 'switched off in Settings, the Robo Scoop does nothing');
  const w1 = await ev(() => { const P = window.__paw, S = P.S; S.sleeping = false; S.stats.happy = 50; S.stats.energy = 50; S.waterAt = S.gameMin - 9999; const b = JSON.stringify(S.bond), c = S.coins; P.ks.rec(); P.ks.bowl(); return { water: S.gameMin - S.waterAt < 1, happy: Math.round(S.stats.happy), energy: Math.round(S.stats.energy), bond: JSON.stringify(S.bond) === b, coins: S.coins === c, acts: P.ks.acts() }; });
  ok(w1.water && w1.happy === 55 && w1.energy === 60, `Auto Water Bowl: the dog drinks by itself, +5 Happiness, +10 Energy (${w1.happy}, ${w1.energy})`);
  ok(w1.bond && w1.coins && !w1.acts.includes('water') && !w1.acts.length, 'no Bond, coins or water tick from the bowl: ' + JSON.stringify(w1.acts));
  const w2 = await ev(() => { const P = window.__paw, S = P.S, at = S.waterAt; P.ks.bowl(); const again = S.waterAt === at; S.shop.tools.bowl = false; S.waterAt = S.gameMin - 9999; const at2 = S.waterAt; P.ks.bowl(); const off = S.waterAt === at2; S.shop.tools.bowl = true; return { again, off }; });
  ok(w2.again && w2.off, 'not again before it refills, and switched off it never drinks');
  const sp = await ev(() => { const P = window.__paw, S = P.S; S.garden.plots[0] = Object.assign({}, S.garden.plots[0], { crop: 'carrot', g: 0.1, water: 0, wd: 0, dry: 0, inSeason: true, ready: null }); P.ks.rec(); P.ks.garden(1); const p0 = S.garden.plots[0], on = { water: p0.water, dry: p0.dry, acts: P.ks.acts() };
    S.shop.tools.sprinkler = false; S.garden.plots[1] = Object.assign({}, S.garden.plots[1], { crop: 'carrot', g: 0.1, water: 0, wd: 0, dry: 0, inSeason: true, ready: null }); P.ks.garden(1); const p1 = S.garden.plots[1]; S.shop.tools.sprinkler = true; return { on, off: { water: p1.water, dry: p1.dry } }; });
  ok(sp.on.water >= 2 && sp.on.dry === 0 && !sp.on.acts.length, `Garden Sprinkler: the dry plot is watered (water ${sp.on.water}, no dry hour), no garden_water act: ` + JSON.stringify(sp.on.acts));
  ok(sp.off.water === 0 && sp.off.dry === 1, 'switched off, the dry plot just waits (dry ' + sp.off.dry + ')');
  await ev(() => window.__paw.go('yard'));
  const set = await ev(() => { document.querySelector('#modal .panel .x') && document.querySelector('#modal .panel .x').click(); return true; });
  await ev(() => document.getElementById('gearBtn').click());
  const hasSw = await t.until(() => !!document.getElementById('ksT-robo') && !!document.getElementById('ksT-bowl') && !!document.getElementById('ksT-sprinkler'), null, 3000);
  ok(set && hasSw, 'Settings shows a switch for each owned tool');
  if (hasSw) { await t.p.click('#ksT-bowl'); ok(await t.until(() => window.__paw.S.shop.tools.bowl === false, null, 2000), 'the switch turns the Auto Water Bowl off'); await t.p.click('#ksT-bowl'); }

  sec('6b. code-review fixes: bowl grace and the hand way, refund house, throwing grant, email gate, cloud off');
  await ev(() => { document.querySelector('#modal .panel .x') && document.querySelector('#modal .panel .x').click(); }); await t.until(() => document.getElementById('modal').hidden, null, 2000); await t.calm();
  const bw = await ev(() => { const P = window.__paw, S = P.S, K = P.ks, W = K.bowlWait(), out = {}; S.sleeping = false; S.stats.happy = 50; S.stats.energy = 50;
    const jst = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); S.missions = S.missions || {}; const keep = S.missions.help;
    S.waterAt = S.gameMin - (W - 5); K.bowl(); out.inGrace = Math.round(S.stats.happy) === 50;
    S.missions.help = { date: jst, sw: '', list: [{ id: 'h_water', n: 1, p: 0, done: null }] }; S.waterAt = S.gameMin - 9999; K.bowl(); out.helpOpen = Math.round(S.stats.happy) === 50;
    S.missions.help.list[0].done = 1; S.waterAt = S.gameMin - 9999; out.pre = [S.sleeping, S.waterAt, S.missions.help.date, jst]; K.bowl(); out.helpDone = Math.round(S.stats.happy) === 55; out.h = S.stats.happy; S.missions.help = keep; return out; });
  ok(bw.inGrace && bw.helpOpen && bw.helpDone, 'Auto Water Bowl: waits a 20-minute grace, never while the water help is open, drinks once it is done: ' + JSON.stringify(bw));
  const rh = await ev(() => { const P = window.__paw, S = P.S, K = P.ks, dogs = S.dogs, h0 = S.inv.houses.slice(), hs = S.house, pv = S.shop.prevHouse, ow = S.shop.owned.slice(), cl = S.shop.claimed.slice();
    S.inv.houses = ['Cardboard Box', 'Cozy Cottage', 'Golden Paw Cottage']; S.house = 'Golden Paw Cottage'; S.shop.prevHouse = 'Cardboard Box'; S.shop.owned = ['supporter']; S.shop.claimed = ['rh1']; S.shop.coin = [];
    S.dogs = [dogs[0], dogs[0]]; K.grant([{ id: 'rh1', item: 'supporter', refunded: true }]); const r = S.house; S.dogs = dogs; S.inv.houses = h0; S.house = hs; S.shop.prevHouse = pv; S.shop.owned = ow; S.shop.claimed = cl; return r; });
  ok(rh.house !== 'Cardboard Box' && rh === 'Cozy Cottage', 'refund: the previous house is skipped when it no longer fits the dogs; the biggest owned house is used (' + rh + ')');
  const gt = await ev(() => { const K = window.__paw.ks, S = window.__paw.S, n0 = S.shop.claimed.length; const e = console.warn; console.warn = () => {}; let r1; try { r1 = K.grant([{ id: 'boom1', item: 'coins_1k', refunded: false }], () => { throw new Error('x'); }); } finally { console.warn = e; } const mid = S.shop.claimed.includes('boom1'); const r2 = K.grant([{ id: 'boom1', item: 'coins_1k', refunded: false }]); return { g1: r1.granted.length, mid, g2: r2.granted.length, after: S.shop.claimed.includes('boom1'), n0 }; });
  ok(gt.g1 === 0 && !gt.mid && gt.g2 === 1 && gt.after, 'a throwing grant stays unclaimed and the next poll grants it: ' + JSON.stringify(gt));
  const gm = await ev(async () => { const P = window.__paw, out = {}; for (const m of ['guest', 'off', 'ok']) { P.prefs ? 0 : 0; window.__ddShopCash = m; document.querySelector('#modal .panel .x') && document.querySelector('#modal .panel .x').click(); P.ks.open('coins'); await new Promise((r) => setTimeout(r, 150));
      const pn = document.querySelector('#modal .panel.ks'), cash = pn.querySelectorAll('.ks-cash').length, rs = !!pn.querySelector('#ksRestore'), txt = /Shop payments are not open here/.test(pn.innerText); let sheet = false, coin = 0;
      if (m === 'guest') { pn.querySelector('.ks-cash').click(); await new Promise((r) => setTimeout(r, 100)); sheet = /Add an email to your save first/.test(pn.innerText); }
      P.ks.open('tools'); await new Promise((r) => setTimeout(r, 100)); coin = document.querySelectorAll('#modal .panel.ks .ks-coin').length + document.querySelectorAll('#modal .panel.ks .ks-yours, #modal .panel.ks .ks-own').length;
      out[m] = { cash, rs, txt, coin, sheet }; }
    delete window.__ddShopCash; return out; });
  ok(gm.guest.cash > 0 && gm.guest.rs && gm.guest.sheet, 'guest without an email: a cash button opens the "Add an email" sheet: ' + JSON.stringify(gm.guest));
  ok(gm.off.cash === 0 && !gm.off.rs && gm.off.txt && gm.off.coin > 0, 'cloud off: no cash buttons or Restore, "Shop payments are not open here", coin buys stay: ' + JSON.stringify(gm.off));
  ok(gm.ok.cash > 0 && gm.ok.rs && !gm.ok.txt, 'an account with an email: cash buttons and Restore');
  await ev(() => { document.querySelector('#modal .panel .x') && document.querySelector('#modal .panel .x').click(); });

  sec('7. payments wiring (part 3): the game against the real Worker (cloudflare/worker.js on a local D1), Stripe faked');
  {
    const srv = makeServer(), stripe = [];
    const was = t.ctx; await t.mk({ prefs: { shopTest: true } });
    await t.ctx.exposeBinding('__clSrv', (src, m, u, b, a) => srv.handle(src.page, m, u, b, a));
    await t.ctx.addInitScript(mockInit, {});
    await t.ctx.addInitScript(() => { // window.open recorded: a fake tab, or null when ksBlock is set (a pop-up blocker)
      window.__ksTabs = []; window.__ksBlock = false;
      window.open = function (u, n) { window.__ksTabs.push({ at: performance.now(), u, n }); if (window.__ksBlock) return null; const w = { closed: false, opener: 1, close() { this.closed = true; }, location: { href: '' }, document: { title: '', body: { innerHTML: '' } } }; window.__ksTabs[window.__ksTabs.length - 1].w = w; return w; };
    });
    await was.close();
    await t.p.goto(URL); await t.p.waitForSelector('#tGuest, #tNew'); if (await t.p.locator('#tGuest').count()) { await t.p.click('#tGuest'); await t.p.waitForSelector('#tNew'); }
    await t.adopt({}); await t.calm();
    ok(await t.until(() => !!(window.__pawCloud.CL.uid && window.__paw && window.__paw.ks), null, 8000), 'a guest on the local Worker');
    // the guest becomes an email account on the Worker (same user id), and this device takes the new login
    const tok0 = await ev(() => JSON.parse(localStorage.getItem('pawhaven_cf_auth')).token);
    const reg = srv.json((await srv.handle(null, 'POST', '/register', JSON.stringify({ email: 'shopper@example.com', password: 'pupper123' }), 'Bearer ' + tok0)).text);
    await ev((r) => { localStorage.setItem('pawhaven_cf_auth', JSON.stringify({ token: r.token })); const C = window.__pawCloud.CL; C.email = r.user.email; C.anon = false; }, reg);
    const uid = reg.user.id;
    ok(reg.upgraded && (await ev(() => window.__paw.ks.cashMode())) === 'ok', 'an account with an email: cash mode ok');

    // keys absent: the Worker answers shop_closed
    await ev(() => { window.__ksTabs.length = 0; window.__toasts.length = 0; return window.__paw.ks.checkout('supporter'); });
    ok(await t.waitToast(/The shop opens soon/, 3000), 'checkout with no Stripe keys: "The shop opens soon"');
    const tc = await ev(() => window.__ksTabs.map((x) => ({ n: x.n, closed: x.w && x.w.closed })));
    ok(tc.length === 1 && tc[0].closed === true, 'the blank tab opened in the tap is closed again: ' + JSON.stringify(tc));
    await ev(() => { window.__toasts.length = 0; return window.__paw.ks.restore(true); });
    ok(await t.waitToast(/The shop opens soon/, 3000), 'Restore purchases with no keys: "The shop opens soon"');

    // keys in (test values only), Stripe faked in node
    Object.assign(srv.env, { STRIPE_KEY: 'sk_test_fake_for_tests', STRIPE_WEBHOOK_SECRET: 'whsec_test_only', SHOP_PRICES: JSON.stringify({ supporter: 'price_sup123', tokyo: 'price_tok123', coins_1k: 'price_c1k123' }),
      STRIPE_FETCH: async (url, o) => { stripe.push({ url, form: new URLSearchParams(o.body) }); const id = 'cs_test_game' + String(stripe.length).padStart(4, '0'); return new Response(JSON.stringify({ id, url: 'https://checkout.stripe.com/c/pay/' + id }), { status: 200 }); } });
    const sync = await ev(() => { window.__ksTabs.length = 0; window.__toasts.length = 0; const p = window.__paw.ks.checkout('tokyo'); return { tabs: window.__ksTabs.length, p: !!p }; }); // window.open must already have run, before the Worker answered
    ok(sync.tabs === 1, 'Pay opens the tab synchronously, in the tap');
    ok(await t.until(() => window.__ksTabs[0] && window.__ksTabs[0].w && /^https:\/\/checkout\.stripe\.com\/c\/pay\/cs_test_game0001$/.test(window.__ksTabs[0].w.location.href), null, 4000), 'then points it at the Stripe Checkout URL');
    ok(stripe.length === 1 && stripe[0].form.get('line_items[0][price]') === 'price_tok123' && stripe[0].form.get('client_reference_id') === uid && stripe[0].form.get('managed_payments[enabled]') === 'true', 'the Worker asked Stripe for Tokyo Street, for this account, Managed Payments on');
    await ev(() => { window.__ksBlock = true; window.__ksTabs.length = 0; window.__toasts.length = 0; return window.__paw.ks.checkout('coins_1k'); });
    ok(await t.until(() => { const a = document.querySelector('.ks-link a.ks-go'); return !!a && a.target === '_blank' && /^https:\/\/checkout\.stripe\.com\//.test(a.href); }, null, 4000), 'a blocked pop-up: a "Pay with Stripe" link sheet opens Stripe from a real tap');
    await ev(() => { window.__ksBlock = false; const n = document.querySelector('.ks-link .ks-no'); if (n) n.click(); });

    // Stripe's webhook landed (the suite v224_worker checks the webhook itself): the tab is shown again -> the poll grants it once
    const put = (id, item, refunded) => srv.env.DB.raw.prepare('insert into purchases (id, user_id, item, amount, currency, payment_intent, created_at, refunded_at) values (?, ?, ?, 299, ?, ?, ?, ?) on conflict(id) do update set refunded_at = excluded.refunded_at').run(id, uid, item, 'usd', 'pi_' + id, Date.now(), refunded ? Date.now() : null) && srv.env.DB.raw.prepare('delete from shop_holds where user_id = ? and item = ? and session_id = ?').run(uid, item, id); // the webhook also drops that session's hold
    put('cs_test_game0001', 'tokyo', false);
    const c0 = await ev(() => window.__paw.S.coins);
    await ev(() => { window.__toasts.length = 0; document.dispatchEvent(new Event('visibilitychange')); });
    ok(await t.until(() => window.__paw.S.shop.claimed.includes('cs_test_game0001') && window.__paw.ks.owned('tokyo'), null, 5000), 'back on the game tab: the poll fetches /shop/owned and grants Tokyo Street');
    // v2.24.1: the Delivered! card lists exactly what came and where it is; Gerald's letter lists it too; My purchases has it
    ok(await t.until(() => !!document.querySelector('#modal .panel.ks-got'), null, 3000), 'a Delivered! card opens: ' + JSON.stringify(await ev(() => ({ hid: document.getElementById('modal').hidden, cls: (document.querySelector('#modal .panel') || {}).className, toasts: (window.__toasts || []).slice(-3) }))));
    const got = await ev(() => { const p = document.querySelector('#modal .panel.ks-got'), m = window.__paw.S.mail.find((x) => x.id === 'ks_got_cs_test_game0001'); return { txt: p.innerText, rows: p.querySelectorAll('.ks-got-row').length, ok: !!p.querySelector('#ksGotOk'), letter: m ? m.text : '', log: window.__paw.S.shop.log.map((e) => e.id + ':' + e.item + ':' + (e.at > 0) + ':' + e.r) }; });
    await t.sleep(800); await t.p.screenshot({ path: path.join(LOGS, 'v224_shop_delivered.png') });
    ok(got.rows === 1 && /Delivered!/.test(got.txt) && /Tokyo Street/.test(got.txt) && /Sukajan Jacket/.test(got.txt) && /Lucky Cat Charm/.test(got.txt) && /Wardrobe/.test(got.txt) && got.ok, 'it names Tokyo Street, its six things and where they are: ' + got.txt.replace(/\s+/g, ' ').slice(0, 200));
    ok(/Tokyo Street: Sukajan Jacket/.test(got.letter) && /My purchases/.test(got.letter), "Gerald's delivery letter lists them: " + got.letter.replace(/\n/g, ' / ').slice(0, 160));
    ok(got.log.join() === 'cs_test_game0001:tokyo:true:false', 'My purchases has it, with its date: ' + got.log.join());
    await t.p.click('#ksGotOk'); ok(await t.until(() => document.getElementById('modal').hidden, null, 2000), 'Yay! closes the card');
    await ev(() => window.__paw.ks.open('coins'));
    const mine = await ev(() => { const d = document.querySelector('#modal .panel.ks .ks-mine'); return d ? d.textContent : ''; });
    ok(/My purchases \(1\)/.test(mine) && /contact@doodledoggo\.app/.test(mine), 'the Kind shop shows My purchases (1) with the help email');
    put('cs_test_game0002', 'coins_1k', false);
    await ev(() => { window.__toasts.length = 0; return window.__paw.ks.restore(true); });
    ok(await t.until((c) => window.__paw.S.coins === c + 2000, c0, 4000), 'Restore purchases grants the coin pack once');
    ok(await t.until(() => { const p = document.querySelector('#modal .panel.ks-got'); return !!p && /2,000 coins/.test(p.innerText) && /Added to your Paw Coins/.test(p.innerText); }, null, 3000), 'over the open shop: a Delivered! card for the coins');
    await t.p.click('#ksGotOk'); ok(await t.until(() => { const d = document.querySelector('#modal .panel.ks .ks-mine'); return !!d && /My purchases \(2\)/.test(d.innerText); }, null, 2000), 'Yay! goes back to the Kind shop, now My purchases (2)');
    await ev(() => document.querySelector('#modal .panel .x').click()); await t.until(() => document.getElementById('modal').hidden, null, 2000);
    await ev(() => { window.__toasts.length = 0; return window.__paw.ks.restore(true); });
    ok(await t.waitToast(/Nothing new to restore/, 3000) && (await ev(() => window.__paw.S.coins)) === c0 + 2000, 'a second restore: nothing new, no coins twice');
    // an owned one-time item: the Worker refuses it, the tab closes, the game restores
    await ev(() => { window.__ksTabs.length = 0; window.__toasts.length = 0; return window.__paw.ks.checkout('tokyo'); });
    ok(await t.waitToast(/This is yours already/, 3000) && (await ev(() => window.__ksTabs[0] && window.__ksTabs[0].w.closed)), 'Tokyo Street again: "This is yours already", the blank tab closes');
    // a refund: the next poll takes the pack back, the coins stay
    put('cs_test_game0001', 'tokyo', true);
    await ev(() => window.__paw.ks.poll(true));
    ok(await t.until(() => !window.__paw.ks.owned('tokyo') && window.__paw.S.shop.refunded.includes('cs_test_game0001'), null, 4000) && (await ev(() => window.__paw.S.coins)) === c0 + 2000, 'refunded: Tokyo Street is taken back, coins kept');
    ok(await ev(() => window.__paw.S.shop.log.find((e) => e.id === 'cs_test_game0001').r === true), 'My purchases marks it refunded');
    // owner, 13 Nov: a refunded looks pack is for sale again (only the Supporter Pack is not): its card has the Pay button, and buying it gives the looks again
    await ev(() => window.__paw.ks.open('looks'));
    const rc = await ev(() => { const c = document.querySelector('#modal [data-ks="tokyo"]'); return { tag: !!(c && c.querySelector('.ks-refunded')), pay: !!(c && c.querySelector('[data-kscash]')), looks: document.querySelectorAll('#modal [data-kslook]').length }; });
    ok(!rc.tag && rc.pay && rc.looks >= 6, 'its card shows the Pay button again, no "not for sale again"; each look still has its coin price: ' + JSON.stringify(rc));
    await t.p.screenshot({ path: path.join(LOGS, 'v224_shop_refunded_card.png') });
    await ev(() => { document.querySelector('#modal .panel .x') && document.querySelector('#modal .panel .x').click(); });
    const ns = stripe.length;
    await ev(() => { window.__ksTabs.length = 0; window.__toasts.length = 0; return window.__paw.ks.checkout('tokyo'); });
    ok(await t.until((n) => window.__ksTabs[0] && window.__ksTabs[0].w && /^https:\/\/checkout\.stripe\.com\/c\/pay\/cs_test_game/.test(window.__ksTabs[0].w.location.href) && !window.__ksTabs[0].w.closed, ns, 4000) && stripe.length === ns + 1, 'Tokyo Street after its refund: the Worker opens a new Checkout (not 409 refunded)');
    const reSid = 'cs_test_game' + String(stripe.length).padStart(4, '0'), cR = await ev(() => window.__paw.S.coins);
    put(reSid, 'tokyo', false);
    await ev(() => window.__paw.ks.poll(true));
    ok(await t.until(() => window.__paw.ks.owned('tokyo') && window.__paw.ks.tokyo.every((n) => window.__paw.S.inv.clothes.includes(n)), null, 4000) && (await ev(() => window.__paw.S.coins)) === cR, 'bought again: Tokyo Street and its six looks come back, no coins added');
    if (await t.until(() => !!document.querySelector('#ksGotOk'), null, 3000)) await t.p.click('#ksGotOk');
    await t.until(() => document.getElementById('modal').hidden, null, 2000);
    // review 13 Nov, 4: a coin pack refunded after most of it was spent: the balance goes to 0, the rest is settled by later coins, and Gerald writes
    await ev(() => { window.__paw.S.coins = 500; window.__toasts.length = 0; });
    put('cs_test_game0002', 'coins_1k', true);
    await ev(() => window.__paw.ks.poll(true));
    ok(await t.until(() => window.__paw.S.shop.refunded.includes('cs_test_game0002'), null, 4000), 'the coin pack refund lands');
    const rf = await ev(() => { const S = window.__paw.S, m = S.mail.find((x) => x.id === 'ks_refund_cs_test_game0002'); return { coins: S.coins, debt: S.shop.coinDebt, letter: m ? m.text : '' }; });
    ok(rf.coins === 0 && rf.debt === 1500 && /2,?000 Paw Coins/.test(rf.letter) && /next 1,?500 coins/.test(rf.letter), "500 coins leave the balance, 1,500 are settled by later coins, and Gerald's letter says so: " + rf.letter.replace(/\n/g, ' / '));
    ok(await t.waitToast(/A refund came through/, 3000), 'a toast points to the letter');
    const ms = await ev(() => { const s = document.querySelector('#modal .ks-settling'); return s ? s.innerText : ''; });
    await ev(() => window.__paw.ks.open('coins'));
    const ms2 = await ev(() => { const s = document.querySelector('#modal .ks-settling'); return s ? s.innerText : ''; });
    ok(/Settling: 1,?500 coins/.test(ms || ms2), 'My purchases says "Settling: 1,500 coins": ' + (ms || ms2));
    await ev(() => { window.__paw.S.shop.coinDebt = 0; document.querySelector('#modal .panel .x') && document.querySelector('#modal .panel .x').click(); });
    // refund protection (owner, 14 Nov 2026): two full refunds on this account (Tokyo Street, the coin pack) -> the Worker answers 409 paused
    const nP = stripe.length;
    ok(!(await ev(() => window.__paw.ks.paused())), 'before the next Pay the game does not know about any pause');
    await ev(() => { window.__ksTabs.length = 0; window.__toasts.length = 0; return window.__paw.ks.open('coins'); });
    await ev(() => window.__paw.ks.checkout('coins_1k'));
    ok(await t.waitToast(/Paid items are paused for this account\. Everything you can get with coins still works\./, 3000) && (await ev(() => window.__ksTabs[0] && window.__ksTabs[0].w.closed)) && stripe.length === nP, 'two refunds: 409 paused -> the kind line as a toast, the blank tab closes, Stripe is not asked');
    const pz = await ev(() => { const p = document.querySelector('#modal .panel.ks'), l = p && p.querySelector('.ks-paused'); return { paused: window.__paw.ks.paused(), line: l ? l.innerText : '', cash: p ? p.querySelectorAll('[data-kscash]').length : -1, tags: p ? p.querySelectorAll('.ks-paused-tag').length : -1, ask: !!(p && /Ask a grown-up/.test(p.innerText)), restore: !!(p && p.querySelector('#ksRestore')) }; });
    ok(pz.paused && /Paid items are paused/.test(pz.line) && pz.cash === 0 && pz.tags === 3 && !pz.ask && pz.restore, 'the open shop now shows the line instead of the Pay buttons (coin packs say "Paused for now"), Restore purchases stays: ' + JSON.stringify(pz));
    await t.p.screenshot({ path: path.join(LOGS, 'v224_shop_paused.png') });
    await ev(() => window.__paw.ks.open('tools'));
    const pt = await ev(() => { const p = document.querySelector('#modal .panel.ks'); return { cash: p.querySelectorAll('[data-kscash]').length, coin: p.querySelectorAll('[data-kscoin]').length }; });
    ok(pt.cash === 0 && pt.coin >= 3, 'Tools: no Pay buttons, every coin price still there: ' + JSON.stringify(pt));
    await ev(() => { window.__paw.S.coins = 50000; window.__paw.updateHUD && window.__paw.updateHUD(); });
    const cB = await ev(() => window.__paw.S.coins), roboC = await ev(() => window.__paw.ks.items.robo.coins);
    await ev(() => { window.__paw.ks.coinBuy('robo'); }); await t.win();
    ok(await t.until(() => window.__paw.ks.tool('robo'), null, 3000) && (await ev(() => window.__paw.S.coins)) === cB - roboC, 'the coins shop still works while paused: the Robo Scoop for ' + roboC + ' coins');
    await ev(() => window.__paw.ks.open('looks'));
    ok(await ev(() => document.querySelectorAll('#modal [data-kslook]').length + document.querySelectorAll('#modal .ks-look .ks-yours').length >= 12 && !document.querySelector('#modal [data-kscash]')), 'Looks: each look keeps its coin price (or Yours), no Pay buttons');
    await ev(() => { document.querySelector('#modal .panel .x') && document.querySelector('#modal .panel .x').click(); });
    // the owner lifts it (tools/shop_flag.sh allow): the next Pay works; the game only remembers the pause for this session
    srv.env.DB.raw.prepare("insert or replace into shop_flags (key, mode, note, created_at) values (?, 'allow', null, ?)").run('u:' + uid, Date.now());
    await ev(() => { window.__ksTabs.length = 0; window.__toasts.length = 0; return window.__paw.ks.checkout('coins_1k'); });
    ok(await t.until(() => window.__ksTabs[0] && window.__ksTabs[0].w && /^https:\/\/checkout\.stripe\.com\//.test(window.__ksTabs[0].w.location.href), null, 4000) && stripe.length === nP + 1, 'an allow row: the next Pay opens Stripe again');
    ok(await ev(() => !window.__paw.ks.paused() && !/paus/i.test(JSON.stringify(window.__paw.S.shop)) && !/paus/i.test(localStorage.getItem('pawhaven_proto_v1').match(/"shop":\{[^}]*\}/)[0])), 'a Checkout that opens clears the pause, and nothing about it is in the save');
    // the Worker down: a kind toast, and the tab closes
    delete srv.env.STRIPE_FETCH; srv.offline.add(t.p);
    await ev(() => { window.__ksTabs.length = 0; window.__toasts.length = 0; return window.__paw.ks.checkout('supporter'); });
    ok(await t.waitToast(/could not be reached\. Nothing was paid/, 3000) && (await ev(() => window.__ksTabs[0].w.closed)), 'offline: "The shop could not be reached. Nothing was paid." and the tab closes');
    srv.offline.delete(t.p);
    ok(!stripe.some((s) => !/^https:\/\/api\.stripe\.com\/v1\/checkout\/sessions$/.test(s.url)), 'the fake Stripe was the only Stripe');
  }

  sec('9. phone 360x640: the shop sheet and the confirm sheet');
  { const was = t.ctx; await t.newGame({ prefs: ON, device: 'Phone 360x640' }, { coins: 3000 }); await was.close(); }
  { const pl = await ev(() => { const b = document.getElementById('ksPlus'), c = document.getElementById('coins'); if (!b || b.hidden || !b.offsetParent) return null; const r = b.getBoundingClientRect(), a = getComputedStyle(b, '::after'), g = -parseFloat(a.top) || 0, i = parseFloat(getComputedStyle(b, '::before').left) || 0, cr = c.getBoundingClientRect(); return { w: r.width + 2 * g, h: r.height + 2 * g, inside: r.left + i >= cr.left - 1 && r.right - i <= cr.right + 1, over: document.documentElement.scrollWidth > innerWidth + 1 }; });
    ok(pl && pl.w >= 44 && pl.h >= 44 && pl.inside && !pl.over, 'the (+) sits in the coin counter with a 44 px tap area, no sideways scroll: ' + JSON.stringify(pl));
    await t.p.click('#ksPlus');
    ok(await t.until(() => !!document.querySelector('#modal .panel.ks [data-kstab="coins"][aria-selected="true"]'), null, 3000), 'the (+) opens the Kind shop on the Coins tab');
    await t.p.screenshot({ path: path.join(LOGS, 'v224_shop_phone_plus.png') }); }
  await ev(() => window.__paw.ks.open('supporter'));
  await t.until(() => !!document.querySelector('#modal .panel.ks'), null, 4000); await t.sleep(600);
  const audit = () => ev(() => {
    const vw = innerWidth, vh = innerHeight, bad = [], bar = document.getElementById('bar'), br = bar && !bar.hidden && bar.offsetParent ? bar.getBoundingClientRect() : null;
    const panel = document.querySelector('#modal .panel.ks'), pr = panel.getBoundingClientRect();
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    [...panel.querySelectorAll('.btn, summary')].filter(vis).forEach((b) => { const r = b.getBoundingClientRect(); if (r.height < 43.5 || r.width < 43.5) bad.push('small ' + (b.innerText || b.className).trim().slice(0, 20) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); });
    const cols = new Set([...panel.querySelectorAll('.ks-grid > .sitem')].filter(vis).map((e) => Math.round(e.getBoundingClientRect().left))).size;
    return { bad, cols, over: document.documentElement.scrollWidth > vw + 1, pw: Math.round(pr.width), pBottom: Math.round(pr.bottom), barTop: br ? Math.round(br.top) : null, vh };
  });
  const a1 = await audit();
  await t.p.screenshot({ path: path.join(LOGS, 'v224_shop_phone_sheet.png') });
  ok(!a1.bad.length, 'every tap on the sheet is 44 px or more: ' + a1.bad.slice(0, 4).join(' | '));
  ok(a1.pw <= 360 && !a1.over, `the sheet fits 360 px (${a1.pw}), no sideways scroll`);
  ok(a1.barTop == null || a1.pBottom <= a1.barTop + 1, `the sheet ends above the phone bar (sheet ${a1.pBottom}, bar ${a1.barTop})`);
  await ev(() => window.__paw.ks.open('looks')); await t.sleep(400);
  const a2 = await audit();
  ok(a2.cols === 1 && !a2.bad.length, `Looks: one column (${a2.cols}), 44 px taps ` + a2.bad.slice(0, 3).join(' | '));
  await t.p.screenshot({ path: path.join(LOGS, 'v224_shop_phone_looks.png') });
  // the confirm sheet: tap a cash price
  await ev(() => window.__paw.ks.open('tools')); await t.sleep(300);
  await t.p.locator('[data-kscash="robo"]').scrollIntoViewIfNeeded(); await t.p.click('[data-kscash="robo"]');
  ok(await t.until(() => !!document.querySelector('.ks-confirm .ks-pay'), null, 3000), 'a cash price opens the confirm sheet');
  await t.sleep(400);
  const cf = await ev(() => {
    const box = document.querySelector('.ks-confirm'), txt = box.innerText, pay = box.querySelector('.ks-pay'), no = box.querySelector('.ks-no'), bar = document.getElementById('bar'), br = bar && !bar.hidden && bar.offsetParent ? bar.getBoundingClientRect() : null;
    const hit = (e) => { const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2, h = document.elementFromPoint(x, y); return { ok: !!h && (h === e || e.contains(h)), r: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] }; };
    const p = hit(pay), n = hit(no), r = box.getBoundingClientRect();
    return { txt, p, n, inView: r.left >= -1 && r.right <= innerWidth + 1 && pay.getBoundingClientRect().bottom <= innerHeight, barTop: br ? br.top : null, payBottom: pay.getBoundingClientRect().bottom };
  });
  await t.p.screenshot({ path: path.join(LOGS, 'v224_shop_phone_confirm.png') });
  ok(/US\$1\.99/.test(cf.txt) && /secure page in a new tab/.test(cf.txt) && /You get exactly this/.test(cf.txt), 'the confirm sheet says what you get, the price and where you pay');
  ok(cf.p.ok && cf.n.ok && cf.inView && cf.p.r[3] >= 44 && cf.n.r[3] >= 44, 'Pay with Stripe and Not now are 44 px, in view and on top (nothing covers them): ' + JSON.stringify([cf.p, cf.n]));
  ok(cf.barTop == null || cf.payBottom <= cf.barTop + 1, `Pay sits above the phone bar (${Math.round(cf.payBottom)} / ${cf.barTop})`);
  await t.p.click('.ks-confirm .ks-pay');
  ok(await t.waitToast(/The shop opens soon/, 3000) && !(await ev(() => !!document.querySelector('.ks-confirm'))), 'Pay calls ksCheckout: "The shop opens soon" for now, the confirm sheet closes');
  await ev(() => window.__paw.ks.open('tools')); await t.p.locator('[data-kscash="robo"]').scrollIntoViewIfNeeded(); await t.p.click('[data-kscash="robo"]'); await t.p.click('.ks-confirm .ks-no');
  ok(await t.until(() => !document.querySelector('.ks-confirm'), null, 2000) && await ev(() => !window.__paw.ks.tool('robo')), 'Not now closes it and nothing is bought');
  // the phone menu has the shop
  await ev(() => { document.querySelector('#modal .panel .x').click(); });
  await t.until(() => document.getElementById('modal').hidden, null, 2000);
  await ev(() => document.getElementById('moreBtn').click());
  const mm = await t.until(() => !!document.getElementById('mmKs'), null, 2500);
  ok(mm, 'the phone "..." menu has a Kind shop button');
  if (mm) { await t.p.click('#mmKs'); ok(await t.until(() => !!document.querySelector('#modal .panel.ks'), null, 3000), 'it opens the Kind shop'); }
});
