// v2.17.1 "Festive Market" (V2171.md): the market config and its windows (Japan date, inclusive), the place on the map with its "Festival!" tag,
// the sign, the five stall sheets, buying (Bond gates, coins only), things kept after the market packs up, festive items never in the normal shops,
// the letter, the save and the phone. Everything needs prefs.fmTest (and the v2.15 map) under the harness; prefs.fmDate pins the date.
// V2171_SHOTS=1 also writes the release screenshots to docs/release/v2.17.1/.
const { run, URL } = require('./test_lib'); const path = require('path'); const fs = require('fs');
const SHOTS = process.env.V2171_SHOTS ? path.join(__dirname, '..', 'docs', 'release', 'v2.17.1') : null;
const PREFS = { fmTest: true, fmDate: '2026-10-27' };

run('v2171_market', async (t) => {
  const { ok, sec, ev } = t; const errs = [];
  const shot = async (name) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.sleep(400); await t.p.screenshot({ path: path.join(SHOTS, name + '.png') }); };
  const fresh = async (o, patch) => {
    await t.newGame(Object.assign({ prefs: PREFS, ground: true }, o || {}), Object.assign({ bond: { level: 8, pts: 1600 }, coins: 4000 }, patch || {}));
    t.p.on('pageerror', (e) => errs.push(e.message));
    await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000); await ev(() => window.__paw.fm.sync());
  };
  const shopNames = async (k, tabAttr, tabs) => { // every item name a normal shop lists, tab by tab
    const out = [];
    await ev(() => { document.getElementById('toasts').innerHTML = ''; });
    for (const tab of tabs) {
      await t.p.click(`#placeBtns [data-sh="${k}"]`); await t.p.waitForSelector('#modal .shopgrid');
      if (tab) { await t.p.click(`#modal [${tabAttr}="${tab}"]`); await t.sleep(250); }
      out.push(...(await ev(() => [...document.querySelectorAll('#modal .sitem b')].map((b) => b.childNodes[0] ? b.childNodes[0].textContent.trim() : b.textContent.trim()))));
      await t.closeX(); await t.modalGone();
    }
    return out;
  };

  sec('0. off for the older suites: no market place, no tent');
  await t.newGame({ ground: true });
  ok(await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000) && !(await ev(() => window.__paw.fm.on())), 'the hook exists, the market is off without prefs.fmTest');
  ok(await ev(() => !window.__paw.fm.sync() && window.__paw.fm.open().length === 0 && !window.__paw.fm.tent()), 'no PLACES.fmarket, no map tent');
  await t.ctx.close();

  sec('1. the config: one table, every item real, 2+ items per Halloween stall');
  await fresh();
  {
    const M = await ev(() => window.__paw.fm.markets.map((m) => ({ id: m.id, name: m.name, theme: m.theme, todo: !!m.todo, items: m.items, w: m.win(2026) })));
    ok(['halloween', 'harvest', 'winter', 'newyear', 'sakura'].every((id) => M.some((m) => m.id === id)), 'five markets: ' + M.map((m) => m.id).join(', '));
    const all = [].concat(...M.map((m) => [].concat(...Object.values(m.items))));
    const bad = await ev((all) => all.filter((n) => !window.__paw.fm.row(n)), all);
    ok(all.length >= 35 && !bad.length, `every listed item is in the game's tables (${all.length}) ${bad.join(', ')}`);
    const hw = M.find((m) => m.id === 'halloween');
    ok(['decor', 'clothes', 'homes', 'toys'].every((c) => (hw.items[c] || []).length >= 2 && hw.items[c].length <= 20), 'Halloween: 2 to 20 items in each of the four stalls (v2.17.2: the sheet grid scrolls): ' + ['decor', 'clothes', 'homes', 'toys'].map((c) => c + ' ' + hw.items[c].length).join(', '));
    ok(['Pumpkin Lantern', 'Paper Bat Bunting', 'Pumpkin Patch Suit', 'Little Bat Costume', 'Witch-Hat Bed', 'Pumpkin Cottage', 'Squeaky Ghost'].every((n) => all.includes(n)), 'the lantern, the bunting, the costumes, the pumpkin house, the witch-hat bed, the squeaky ghost');
    ok(M.find((m) => m.id === 'sakura').todo, 'the sakura market waits for its art (todo, never opens)');
  }

  sec('2. the windows: Japan date, inclusive; overlapping markets share the place, the first to close names it');
  {
    const W = await ev(() => { const F = window.__paw.fm, o = (d) => F.open(d).map((x) => x.id).join('+'); return { a: o('2026-10-07'), b: o('2026-10-08'), c: o('2026-10-27'), d: o('2026-11-15'), e: o('2026-11-16'), d2: o('2026-11-02'), f: o('2026-11-30'), g: o('2026-12-01'), h: o('2026-12-26'), i: o('2026-12-27'), j: o('2027-01-07'), k: o('2027-01-08'), l: o('2027-03-30'), m: o('2027-10-23'), n: o('2027-10-24') }; });
    ok(W.a === 'harvest' && W.b === 'halloween+harvest' && W.c === 'halloween+harvest' && W.d === 'halloween+harvest' && W.d2 === 'halloween+harvest' && W.e === 'harvest' && W.f === 'harvest', 'Halloween 8 Oct to 15 Nov 2026 (open on 15 Nov, closed on 16 Nov), the Harvest Market 1 Oct to 30 Nov: ' + JSON.stringify(W));
    ok(W.g === 'winter' && W.h === 'winter' && W.i === 'newyear' && W.j === 'newyear' && W.k === '' && W.l === '' && W.m === 'harvest' && W.n === 'halloween+harvest', 'Winter 1 to 26 Dec, New Year 27 Dec to 7 Jan, nothing in March (sakura todo), Halloween 2027 from 24 Oct');
    ok(await ev(() => window.__paw.fm.sign() === 'Halloween Market · open until 15 Nov'), 'the sign: "Halloween Market · open until 15 Nov"');
    ok(await ev(() => { const F = window.__paw.fm; F.date('2026-11-16'); const s = F.sign(); F.date('2026-10-27'); return s === 'Harvest Market · open until 30 Nov'; }), 'after 15 Nov the sign says "Harvest Market · open until 30 Nov"');
    ok(await ev(() => { const F = window.__paw.fm; F.date('2027-10-27'); const c = F.items('clothes').map((x) => x.n), t = F.items('treats').map((x) => x.n); F.date('2026-10-27'); return !c.includes('Pumpkin Patch Suit') && c.includes('Ghost Sheet') && !t.includes('Pumpkin Patch Pupcake'); }), 'the 2026 edition items are sold in 2026 only');
    // Winter Market 2026 part 1 (docs/design/winter-market.md): five yard decorations, fest 'winter', fm, no edition, so sold every December
    const WM = ['Paper-Star Fir Tree', 'Yard Snowman', 'Candy-Cane Fairy Lights', 'Present Pile', 'Star Lantern'];
    ok(await ev((WM) => { const F = window.__paw.fm, at = (d) => { F.date(d); return F.items('decor').map((x) => x.n); }; const a = at('2026-12-05'), b = at('2027-12-20'), c = at('2026-11-20'); F.date('2026-10-27'); return WM.every((n) => a.includes(n) && b.includes(n) && !c.includes(n)); }, WM), 'the five winter decorations are sold at the Winter Market every December (2026 and 2027), not before it opens');
    ok(await ev((WM) => WM.every((n) => { const D = window.__paw.home.specs[n], P = window.PawArt, lit = ['Candy-Cane Fairy Lights', 'Star Lantern'].includes(n); return D && D.fest === 'winter' && D.fm && !D.ed && D.price >= 80 && D.price <= 150 && (D.bond || 1) <= 3 && !!D.lit === lit
      && P.WINTER_MARKET.decor[D.prop] === n && P.WORLD_B.items.includes(n) && /<svg/.test(P.prop(D.prop, {})) && /<svg/.test(P.item(n)) && P.prop(D.prop, { lit: true }).includes('pa-wb-glow') === lit && !P.prop(D.prop, {}).includes('pa-wb-glow'); }), WM), 'each has its prop and item card (PawArt.WINTER_MARKET), a Halloween-like price and Bond gate, and only the lights and the lantern glow, only when lit');
    // Winter Market 2026 part 2: ten costumes (CLOTHES, fest 'winter', fm, no edition), each with its item card and its own drawing on the dog
    const WC = ['Father Christmas Suit', 'Little Elf Outfit', 'Gingerbread Pup Suit', 'Snowman Suit', 'Polar Bear Hood', 'Penguin Suit', 'Puffer Jacket', 'Nutcracker Jacket & Hat', 'Snowflake Wings', 'Jingle Bell Collar'];
    ok(await ev((WC) => { const F = window.__paw.fm, at = (d) => { F.date(d); return F.items('clothes').map((x) => x.n); }; const a = at('2026-12-05'), b = at('2027-12-20'), c = at('2026-11-20'); F.date('2026-10-27'); return WC.every((n) => a.includes(n) && b.includes(n) && !c.includes(n)); }, WC), 'the ten winter costumes are sold at the Winter Market every December (2026 and 2027), not before');
    ok(await ev((WC) => { const P = window.PawArt, F = window.__paw.fm; return WC.every((n) => { const r = F.row(n), sl = n === 'Jingle Bell Collar' ? 'neck' : 'body'; return r && r.kind === 'clothes' && !r.ed && r.price >= 50 && r.price <= 90 && r.bond >= 1 && r.bond <= 3
      && P.WINTER_MARKET.costumes.includes(n) && /<svg/.test(P.item(n)) && P.dog('golden', { pose: 'idle', outfit: { [sl]: n } }) !== P.dog('golden', { pose: 'idle' }); }); }, WC), 'each has a Halloween-like price and Bond gate, its item card (PawArt.WINTER_MARKET.costumes) and its drawing on the dog');
    // Winter Market 2026 part 3: five toys (TOYS, fest 'winter', fm, no edition), each plays an older toy game (mods/toys.js HM_TOY_GAME) with its own look
    const WT = ['Squeaky Snowman', 'Candy-Cane Rope', 'Plush Penguin', 'Snowball Ball', 'Present Puzzle Box'];
    ok(await ev((WT) => { const F = window.__paw.fm, at = (d) => { F.date(d); return F.items('toys').map((x) => x.n); }; const a = at('2026-12-05'), b = at('2027-12-20'), c = at('2026-11-20'); F.date('2027-12-20'); const cats = F.cats(); F.date('2026-10-27'); return WT.every((n) => a.includes(n) && b.includes(n) && !c.includes(n)) && cats.includes('toys'); }, WT), 'the five winter toys are sold at the Winter Market every December (2026 and 2027), not before, at its own toys stall');
    ok(await ev((WT) => { const P = window.PawArt, F = window.__paw.fm; return WT.every((n) => { const r = F.row(n); return r && r.kind === 'toys' && !r.ed && r.price >= 40 && r.price <= 80 && r.bond >= 1 && r.bond <= 3
      && P.WINTER_MARKET.toys.includes(n) && /<svg/.test(P.item(n)) && window.PawToys.supports(n); }) && /<svg/.test(P.prop('wmpuzzle-board', {})) && /<svg/.test(P.prop('wmpuzzle-lid', {})); }, WT), 'each has a Halloween-like price and Bond gate, its item card (PawArt.WINTER_MARKET.toys) and a toy game (the puzzle box with its own board and lids)');
  }

  sec('3. the map: the tent with a "Festival!" tag beside the Square, the walk there');
  {
    await ev(() => window.__paw.go('map')); await t.until(() => !!document.querySelector('.mb[data-area="fmarket"]'), null, 8000);
    const tent = await ev(() => { const g = document.querySelector('.mb[data-area="fmarket"]'); return g ? { role: g.getAttribute('role'), aria: g.getAttribute('aria-label'), tag: (g.querySelector('.fm-tag') || {}).textContent, cap: (g.querySelector('.mb-cap') || {}).textContent } : null; });
    ok(tent && tent.role === 'button' && tent.tag === 'Festival!' && tent.cap === 'Halloween Market' && /Halloween Market/.test(tent.aria), 'the tent is a button, captioned, tagged: ' + JSON.stringify(tent));
        await shot('map_market_desktop');
    await ev(() => document.querySelector('.mb[data-area="fmarket"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    ok(await t.until(() => window.__paw.mode === 'yard' && window.__paw.S.place === 'fmarket', null, 8000), 'a tap travels to the market');
  }

  sec('4. the market place: the scene, the sign, the stalls, the first-visit toast, the letter');
  {
    await t.calm();
    ok(await ev(() => /Halloween Market · open until 15 Nov/.test((document.querySelector('#sceneG .fm-sign') || {}).textContent || '')), 'the sign is written on the scene');
    ok(await ev(() => document.querySelectorAll('#sceneG [data-fmstall].hot').length === 5 && !!document.querySelector('#placeBtns [data-fmb]')), 'five stalls to tap (v2.17.2: the three stalls, the homes stand and the treats cart), and "Browse the stalls"');
    ok(await t.waitToast(/Welcome to the Halloween Market!/, 4000), 'a gentle welcome toast');
    ok(await t.until(() => (window.__paw.S.mail || []).some((m) => m.id === 'fm_halloween_2026'), null, 6000), 'Gerald\'s letter: the market is open');
    ok(await ev(() => /beside the Town Square/.test(window.__paw.S.mail.find((m) => m.id === 'fm_halloween_2026').text)), 'it says where to find it');
    await ev(() => { document.getElementById('toasts').innerHTML = ''; }); await shot('market_scene_desktop');
  }

  sec('5. the stall sheets: five stalls, scrollable, Bond gates, buying with coins');
  {
    await t.dev(async () => { await t.p.selectOption('#dvTime', 'night'); });
    ok(await ev(() => document.querySelectorAll('#sceneG [data-fmstall].hot').length === 5), 'a time-of-day redraw keeps the five stalls tappable (v2.17.2: the homes stand and the treats cart too)');
    await ev(() => document.querySelector('#sceneG [data-fmstall="decor"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    ok(await t.until(() => !!document.querySelector('#modal .fm-pop .fm-grid'), null, 4000), 'a stall tap still opens its sheet after the redraw');
    await t.closeX(); await t.modalGone();
    await t.dev(async () => { await t.p.selectOption('#dvTime', 'day'); });
    await t.p.click('#placeBtns [data-fmb]'); await t.p.waitForSelector('#modal .fm-pop .fm-grid');
    ok(await ev(() => [...document.querySelectorAll('#modal [data-fmtab]')].map((b) => b.dataset.fmtab).join() === 'decor,clothes,homes,toys,treats'), 'five stall tabs');
    for (const c of ['decor', 'clothes', 'homes', 'toys', 'treats']) {
      await t.p.click(`#modal [data-fmtab="${c}"]`); await t.sleep(250);
      const n = await ev(() => document.querySelectorAll('#modal .fm-grid .fm-card').length), want = await ev((c) => window.__paw.fm.items(c).length, c);
      ok(n === want && n >= 2, `${c}: ${n} items on the sheet`);
      ok(await ev(() => { const g = document.querySelector('#modal .fm-grid'); const cs = getComputedStyle(g); return cs.overflowY === 'auto' || g.scrollHeight <= g.clientHeight + 1; }), `${c}: the sheet scrolls inside`);
      await shot('stall_' + c + '_desktop');
    }
    // Bond gate: the Pumpkin Cottage needs Bond 6
    await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.bond = { level: 2, pts: 100 }; }); });
    await ev(() => window.__paw.fm.sheet('homes')); await t.sleep(200);
    ok(await ev(() => document.querySelector('#modal .fm-card[data-n="Pumpkin Cottage"] [data-fmbuy]').getAttribute('aria-disabled') === 'true'), 'Bond 2: the Pumpkin Cottage (Bond 6) is locked');
    await ev(() => document.querySelector('#modal .fm-card[data-n="Pumpkin Cottage"] [data-fmbuy]').click()); ok(await t.waitToast(/opens at Bond 6/, 3000), 'a kind no');
    await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.bond = { level: 8, pts: 1600 }; }); });
    const buy = async (cat, n) => {
      await ev((c) => window.__paw.fm.sheet(c), cat); await t.sleep(200);
      await ev((n) => document.querySelector(`#modal .fm-card[data-n="${n}"] [data-fmbuy]`).click(), n);
      await t.p.waitForSelector('.buybox .bb-yes', { timeout: 4000 }).catch(() => {});
      await ev(() => { const b = document.querySelector('.buybox .bb-yes'); if (b) b.click(); });
      await t.sleep(400); await ev(() => { const l = [...document.querySelectorAll('#modal button')].find((b) => /Later/.test(b.textContent)); if (l) l.click(); }); await t.sleep(200);
    };
    const c0 = (await t.S()).coins;
    await buy('decor', 'Pumpkin Lantern'); await buy('clothes', 'Pumpkin Patch Suit'); await buy('homes', 'Witch-Hat Bed'); await buy('toys', 'Squeaky Ghost');
    const s = await t.S();
    ok(s.decor['Pumpkin Lantern'] && s.inv.clothes.includes('Pumpkin Patch Suit') && s.beds.includes('Witch-Hat Bed') && s.inv.toys.includes('Squeaky Ghost'), 'bought one from each stall: the lantern, the suit, the bed, the ghost');
    ok(c0 - s.coins === 80 + 70 + 420 + 50 && s.fm.bought === 4, `coins only, the table prices: -${c0 - s.coins}`);
    ok(await ev(() => document.querySelector('#modal .fm-card[data-n="Squeaky Ghost"] .chip.own') !== null), 'the sheet shows Owned');
    await t.closeX(); await t.modalGone();
  }

  sec('6. the new things work at home: the lantern in the yard, the bed in the house, the ghost in ball play');
  {
    await t.home('yard'); ok(await ev(() => !!document.querySelector('#view [data-decor="Pumpkin Lantern"], #view [data-decor-name="Pumpkin Lantern"]') || !!window.__paw.S.decor['Pumpkin Lantern'].out), 'the Pumpkin Lantern stands in the yard');
    await shot('lantern_yard_desktop');
    ok(await ev(() => { const P = window.__paw; return P.bl && P.bl.toys && !!P.bl.toys['Squeaky Ghost']; }), 'the Squeaky Ghost is a ball-play toy');
    ok(await ev(() => typeof window.PawArt.bed === 'function' && /data-bed="Witch-Hat Bed"/.test(window.PawArt.bed('Witch-Hat Bed')) && /pa-bed-front/.test(window.PawArt.bed('Witch-Hat Bed'))), 'the Witch-Hat Bed has its art and a front lip');
  }

  sec('7. festive items are never in the normal shops');
  {
    const fest = await ev(() => { const P = window.__paw; return [].concat(...P.fm.markets.map((m) => [].concat(...Object.values(m.items)))).filter((n) => { const r = P.fm.row(n); return r && n !== 'Pumpkin Cottage'; }).map((n) => P.fm.row(n).name); });
    await t.home('boutique'); const b = await shopNames('boutique', '', ['']);
    await t.home('builder'); const h = await shopNames('builder', 'data-btab', ['houses', 'beds', 'decor']);
    await t.home('market'); const k = await shopNames('kibble', 'data-tab', ['food', 'toys']);
    const all = b.concat(h, k), hit = fest.filter((n) => all.includes(n));
    ok(b.length > 10 && h.length > 10 && k.length > 10 && !hit.length, `the Boutique, Barkitecture and Kibble Corner list ${all.length} things and none of the ${fest.length} festive ones ${hit.join(', ')}`);
  }

  sec('8. after the market packs up: the place leaves, everything bought stays');
  {
    await t.home('fmarket');
    await ev(() => window.__paw.fm.date('2026-12-28')); // the New Year Market: a different market, the Halloween things gone from its stalls
    ok(await ev(() => window.__paw.fm.main() === 'newyear' && !window.__paw.fm.items('clothes').some((x) => x.n === 'Pumpkin Patch Suit')), 'late December: the New Year Market');
    await ev(() => window.__paw.fm.date('2027-02-10')); await ev(() => window.__paw.fm.sync());
    ok(await t.until(() => window.__paw.S.place === 'square', null, 4000), 'no market in February: a dog standing there walks to the Square');
    ok(await t.waitToast(/packed up and left/, 4000), 'a kind toast');
    const s = await t.S();
    ok(s.decor['Pumpkin Lantern'] && s.inv.clothes.includes('Pumpkin Patch Suit') && s.beds.includes('Witch-Hat Bed') && s.inv.toys.includes('Squeaky Ghost'), 'everything bought is still owned');
    await ev(() => window.__paw.go('map')); await t.sleep(1200);
    ok(await ev(() => !document.querySelector('.mb[data-area="fmarket"]')), 'the tent is gone from the map');
    await ev(() => { const P = window.__paw, S = P.S; S.outfit.body = 'Pumpkin Patch Suit'; P.go('yard'); }); await t.calm();
    ok(await ev(() => !!document.querySelector('#dogArt svg.pa-dog')), 'the suit is still worn');
    // a reload keeps it all (S.v stays 1, S.fm in the save)
    await ev(() => window.__paw.saveNow()); const json = await ev(() => localStorage.getItem('pawhaven_proto_v1'));
    await t.ctx.close(); await t.mk({ prefs: Object.assign({}, PREFS, { fmDate: '2027-02-10' }), map215: true, ground: true, storage: { pawhaven_proto_v1: json } }); await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
    const s2 = await t.S();
    ok(s2.v === 1 && s2.fm && s2.fm.bought === 4 && s2.decor['Pumpkin Lantern'] && s2.beds.includes('Witch-Hat Bed') && s2.inv.toys.includes('Squeaky Ghost'), 'after a reload: v 1, S.fm kept, everything owned');
    await t.until(() => !!(window.__paw && window.__paw.fw), null, 6000);
    ok(await ev(() => { const x = window.__paw.fw.migrate({ v: 1, dogs: [{ id: 'a', name: 'A', key: 'shiba', bond: { level: 2, pts: 70 } }], inv: { food: {}, toys: [], clothes: [], houses: [] }, fm: 'junk' }); return x.v === 1 && typeof x.fm.seen === 'object' && x.fm.bought === 0; }), 'an old or broken save gets S.fm, additively');
    await t.ctx.close();
  }

  sec('9. phone (iPhone 15): the map tent, the scene, a stall sheet with 44 px taps and no sideways scroll');
  {
    await t.newGame({ prefs: PREFS, ground: true, device: 'iPhone 15' }, { bond: { level: 8, pts: 1600 }, coins: 4000 });
    await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000); await ev(() => window.__paw.fm.sync());
    await ev(() => window.__paw.go('map')); await t.until(() => !!document.querySelector('.mb[data-area="fmarket"]'), null, 8000);
    await ev(() => { try { window.__paw.mapTo('fmarket'); } catch (e) { /* none */ } }); await t.sleep(900); await shot('map_market_phone');
    await t.home('fmarket'); await ev(() => { document.getElementById('toasts').innerHTML = ''; }); await shot('market_scene_phone');
    ok(await ev(() => { const b = document.querySelector('#placeBtns [data-fmb]').getBoundingClientRect(); return b.height >= 44; }), 'phone: "Browse the stalls" is 44 px tall');
    await t.p.click('#placeBtns [data-fmb]'); await t.p.waitForSelector('#modal .fm-pop .fm-grid');
    for (const c of ['decor', 'clothes', 'homes', 'toys', 'treats']) {
      await ev((c) => window.__paw.fm.sheet(c), c); await t.sleep(250);
      const L = await ev(() => ({ side: document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1, taps: [...document.querySelectorAll('#modal [data-fmtab], #modal [data-fmbuy]')].map((b) => b.getBoundingClientRect()).filter((r) => r.width).map((r) => Math.min(r.height, r.width)), font: Math.min(...[...document.querySelectorAll('#modal .fm-card .desc')].map((e) => parseFloat(getComputedStyle(e).fontSize))) }));
      ok(L.side && L.taps.every((x) => Math.round(x) >= 44) && L.font >= 15, `phone ${c}: no sideways scroll, taps ${Math.min(...L.taps)} px+, text ${L.font} px`);
      await shot('stall_' + c + '_phone');
    }
    await t.closeX(); await t.modalGone();
  }
  ok(!errs.length, 'no page errors ' + errs.slice(0, 3).join(' | '));
}, { timeout: 600000 });
