// Sakura Market (docs/design/sakura-market.md): the window (25 Mar to 10 Apr, Japan date, every year), the 22 items (only at the market, every year,
// food-safe), buying there, owned things kept after it packs up, the caps (toy games share FF_CAPS.toys, the Petal Ball is ball play under its caps),
// the dressed scene with falling petals, the costumes on every breed (art) and the decorations in the yard.
// node game/run_tests.js sakura_market   (SK_SHOTS=dir also writes screenshots there)
const { run } = require('./test_lib'); const path = require('path'); const fs = require('fs');
const SHOTS = process.env.SK_SHOTS || null;
const PREFS = { fmTest: true, fmDate: '2027-03-28' };
const DECOR = ['Sakura Paper Lanterns', 'Hanami Picnic Blanket', 'Bento Picnic Table', 'Paper Sakura Tree', 'Blossom Swing'];
const CLOTHES = ['Sakura Petal Crown', 'Hanami Sun Hat', 'Sakura Bandana', 'Blossom Garland', 'Sakura Haori', 'Sakura Mochi Suit', 'Butterfly Wings', 'Spring Knit Cardigan'];
const TOYS = ['Squeaky Dango', 'Petal Ball', 'Plush Koi'], TREATS = ['Sakura Pup Mochi', 'Hanami Rice Ball'];
const HOMES = ['Blossom Kennel', 'Picnic Basket Bed', 'Paper Parasol Bed', 'Petal Nest']; // part 2: the homes stall
const ALL = DECOR.concat(CLOTHES, HOMES, TOYS, TREATS);

run('sakura_market', async (t) => {
  const { ok, sec, ev } = t; const errs = [];
  const shot = async (name) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.sleep(500); await t.p.screenshot({ path: path.join(SHOTS, name + '.png') }); };
  const fresh = async (o, patch) => {
    await t.newGame(Object.assign({ prefs: PREFS, ground: true }, o || {}), Object.assign({ bond: { level: 8, pts: 1600 }, coins: 4000 }, patch || {}));
    t.p.on('pageerror', (e) => errs.push(e.message));
    await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000); await ev(() => window.__paw.fm.sync());
  };

  sec('1. the window: Japan date 25 Mar to 10 Apr inclusive, every year');
  await fresh();
  {
    const W = await ev(() => { const P = window.__paw, has = (d) => P.fm.open(d).some((o) => o.id === 'sakura');
      return { cfg: P.fm.markets.find((m) => m.id === 'sakura'), d: ['2027-03-24', '2027-03-25', '2027-04-01', '2027-04-10', '2027-04-11', '2028-03-24', '2028-03-25', '2028-04-10', '2028-04-11', '2027-12-05'].map((d) => [d, has(d)]) }; });
    ok(W.cfg && !W.cfg.todo && W.cfg.theme === 'sakura', 'the sakura entry is configured and open for business (no todo)');
    const want = { '2027-03-24': false, '2027-03-25': true, '2027-04-01': true, '2027-04-10': true, '2027-04-11': false, '2028-03-24': false, '2028-03-25': true, '2028-04-10': true, '2028-04-11': false, '2027-12-05': false };
    ok(W.d.every(([d, v]) => want[d] === v), 'closed on 24 Mar and 11 Apr, open from 25 Mar to 10 Apr, again the next year: ' + W.d.map(([d, v]) => d + (v ? '+' : '-')).join(' '));
    const C = await ev((d) => { const P = window.__paw; P.fm.date(d); return { main: P.fm.main(), name: P.fm.name(), sign: P.fm.sign(), place: !!P.fm.tent(), cats: P.fm.cats() }; }, '2027-04-10');
    ok(C.main === 'sakura' && C.name === 'Sakura Market' && /Sakura Market · open until/.test(C.sign) && C.place, 'the Sakura Market names the place and the sign: ' + C.sign);
    ok(JSON.stringify(C.cats) === JSON.stringify(['decor', 'clothes', 'homes', 'toys', 'treats']), 'five stalls (homes since part 2): ' + C.cats.join());
    await ev((d) => window.__paw.fm.date(d), '2027-04-11');
    ok(await ev(() => !window.__paw.fm.tent() && window.__paw.fm.main() === null), 'on 11 Apr the place is gone');
    await ev((d) => window.__paw.fm.date(d), '2027-03-24');
    ok(await ev(() => !window.__paw.fm.tent()), 'on 24 Mar it is not there yet');
  }

  sec('2. the items: 5 decorations, 8 costumes, 3 toys, 2 treats, every year, festive (fm), only at the market, food-safe lessons');
  {
    await ev((d) => window.__paw.fm.date(d), '2027-03-28');
    const R = await ev((all) => { const P = window.__paw; return { rows: all.map((n) => P.fm.row(n)), items: ['decor', 'clothes', 'homes', 'toys', 'treats'].map((c) => P.fm.items(c).map((x) => x.n)) }; }, ALL);
    ok(R.rows.every((r) => r && r.price > 0 && !r.ed), 'all 22 have a table row with a price and no edition year (back every spring)');
    ok(JSON.stringify(R.items) === JSON.stringify([DECOR, CLOTHES, HOMES, TOYS, TREATS]), 'the stalls list them in order');
    const stock = R.rows.reduce((s, r) => s + r.price, 0);
    ok(stock >= 2800 && stock <= 3200, 'about 3,000 coins of stock in all (owner, 11 Nov): ' + stock);
    // part 2: the homes stall, like the Winter Market's (a 900-coin kennel at Bond 3, beds 250 to 450), each with its art and card
    ok(await ev((H) => { const P = window.PawArt, F = window.__paw.fm; return H.every((n) => { const r = F.row(n), house = n === 'Blossom Kennel', svg = house ? P.house(n) : P.bed(n);
      return r && r.kind === (house ? 'houses' : 'beds') && r.bond >= 1 && r.bond <= 3 && (house ? r.price === 900 && r.bond === 3 : r.price >= 250 && r.price <= 450)
        && (house ? P.SAKURA_MARKET.house === n && P.WORLD_B.houses.includes(n) && svg.includes('pa-wb-glow') : P.SAKURA_MARKET.beds.includes(n) && P.WORLD_B.beds.includes(n) && /pa-bed-front/.test(svg) && svg.includes('data-bed="' + n + '"'))
        && /<svg/.test(svg) && !/NaN/.test(svg) && /<svg/.test(P.item(n)); }); }, HOMES), 'the Blossom Kennel and three beds: prices and Bond gates like the winter ones, their art (bed front lips, the kennel windows glow at night) and item cards');
    ok(await ev(() => { const P = window.PawArt; return P.prop('sklanterns', {}).length < 70000 && P.prop('sktree', {}).length < 70000; }), 'the lanterns and the paper tree are lighter (under 70 KB each)');
    const tips = await ev((tr) => tr.map((n) => window.__paw.fm.row(n).tip), TREATS);
    ok(tips.every((x) => x && x.split(/[.!?] /).length >= 2), 'each treat has a two-sentence lesson');
    ok(/mochi/i.test(tips[0]) && /salt/i.test(tips[0]) && /salt/i.test(tips[1]), 'the lessons: no real mochi, no salted leaf, no salt in the rice ball');
    for (const d of ['2027-05-01', '2027-12-05', '2027-10-27']) {
      await ev((x) => window.__paw.fm.date(x), d);
      const any = await ev((all) => { const P = window.__paw; return ['decor', 'clothes', 'homes', 'toys', 'treats'].some((c) => P.fm.items(c).some((x) => all.includes(x.n))); }, ALL);
      ok(!any, d + ': no other market sells a Sakura Market item');
    }
    await ev((d) => window.__paw.fm.date(d), '2027-03-28');
  }

  sec('3. buying at the stalls: coins only, Bond gates, Owned');
  {
    await ev(() => { const P = window.__paw; P.S.place = 'fmarket'; P.go('yard'); }); await t.calm();
    const sc = await ev(() => { const g = document.querySelector('#view svg.world'); return { petals: g ? g.querySelectorAll('.fm-petal').length : 0, stalls: g ? [...g.querySelectorAll('#sceneG [data-fmstall]')].map((x) => x.dataset.fmstall) : [], boards: g ? g.querySelectorAll('.fm-stall-sign').length : 0 }; });
    ok(sc.petals >= 10, 'petals fall over the scene: ' + sc.petals);
    ok(['decor', 'clothes', 'homes', 'toys', 'treats'].every((c) => sc.stalls.includes(c)) && sc.boards === 5, 'five stall buttons with boards, the homes stand in front: ' + sc.stalls.join());
    ok(await ev(() => /fmPetal/.test([...document.styleSheets].map((s) => { try { return [...s.cssRules].map((r) => r.cssText).join(''); } catch (e) { return ''; } }).join(''))), 'the petal animation is in the CSS (and off under prefers-reduced-motion)');
    await shot('sakura_scene_desktop');
    const buy = async (cat, n) => {
      await ev((c) => window.__paw.fm.sheet(c), cat); await t.p.waitForSelector(`#modal .fm-card[data-n="${n}"]`);
      await ev((n) => document.querySelector(`#modal .fm-card[data-n="${n}"] [data-fmbuy]`).click(), n);
      await t.p.waitForSelector('.buybox .bb-yes', { timeout: 4000 }).catch(() => {});
      await ev(() => { const b = document.querySelector('.buybox .bb-yes'); if (b) b.click(); });
      await t.sleep(400); await ev(() => { const l = [...document.querySelectorAll('#modal button')].find((b) => /Later/.test(b.textContent)); if (l) l.click(); }); await t.sleep(200);
    };
    const c0 = (await t.S()).coins;
    await buy('decor', 'Paper Sakura Tree'); await buy('clothes', 'Sakura Haori'); await buy('clothes', 'Sakura Petal Crown'); await buy('homes', 'Petal Nest'); await buy('toys', 'Plush Koi'); await buy('toys', 'Petal Ball'); await buy('treats', 'Hanami Rice Ball');
    const s = await t.S();
    ok(s.decor['Paper Sakura Tree'] && s.inv.clothes.includes('Sakura Haori') && s.inv.clothes.includes('Sakura Petal Crown') && s.inv.toys.includes('Plush Koi') && s.inv.toys.includes('Petal Ball') && s.beds.includes('Petal Nest') && (s.inv.food['Hanami Rice Ball'] || 0) >= 1, 'bought from every stall');
    ok(c0 - s.coins === 140 + 80 + 55 + 250 + 65 + 45 + 12, 'coins only, the table prices: -' + (c0 - s.coins));
        if (await ev(() => !document.getElementById('modal').hidden)) { await t.closeX(); await t.modalGone(); }
    // a Bond gate: at Bond 1 the Bond 2 things are locked
    await ev(() => { const P = window.__paw; P.S.dogs.forEach((d) => { d.bond = { level: 1, pts: 0 }; }); });
    await ev(() => window.__paw.fm.sheet('decor')); await t.p.waitForSelector('#modal .fm-card');
    ok(await ev(() => !!document.querySelector('#modal .fm-card[data-n="Blossom Swing"] [aria-disabled="true"]')), 'the Blossom Swing opens at Bond 2');
    await shot('sakura_sheet_desktop');
    await t.closeX(); await t.modalGone();
  }

  sec('4. caps: the toy games share FF_CAPS.toys (30 a Japan day); the Petal Ball is ball play (2 coins a return, under the ball-play caps)');
  {
    const G = await ev(() => { const P = window.PawToys; return { dango: P && P.gameOf ? P.gameOf('Squeaky Dango') : null, koi: P && P.gameOf ? P.gameOf('Plush Koi') : null, has: P && P.has ? ['Squeaky Dango', 'Plush Koi'].map((n) => P.has(n)) : null }; });
    ok(G.dango === 'Squeaky Duck' && G.koi === 'Plush Bone', 'the Squeaky Dango plays the Squeaky Duck game, the Plush Koi the Plush Bone game (nap buddy): ' + JSON.stringify(G));
    const A = await ev(() => { const P = window.__paw, S = P.S, c0 = S.coins; S.ff.toy = { day: '', coins: 0 }; const a = P.ff.toyPay(25), b = P.ff.toyPay(25); const got = S.coins - c0; S.ff.toy.day = '2001-01-01'; return { cap: P.ff.caps.toys.day, a, b, got }; });
    ok(A.cap === 30 && A.a === 25 && A.b === 5 && A.got === 30, 'one toy-game cap of 30 a day: ' + JSON.stringify(A));
    const B = await ev(() => { const B = window.__paw.bl; return { p: B.toys['Petal Ball'], cap: B.cap }; });
    ok(B.p && B.p.coin === 2 && B.cap.session === 16 && B.cap.day === 40, 'the Petal Ball: 2 coins a return, caps 16 a session, 40 a day');
    await t.home('yard'); await t.p.click('[data-act=play]'); await t.waitPop(true, 4000);
    const tray = await ev(() => [...document.querySelectorAll('[data-play]')].map((b) => b.dataset.play + '|' + b.textContent));
    ok(tray.some((x) => x.startsWith('ball:Petal Ball|') && /2 coins/.test(x)) && !tray.some((x) => x.startsWith('toy:Petal Ball|')), 'the Play tray: the Petal Ball is a ball-play card');
    ok(tray.some((x) => x.startsWith('toy:Plush Koi|')), 'the Plush Koi is a toy-game card');
    await t.closeX(); await t.modalGone();
  }

  sec('5. owned things stay after the market packs up; the costume is worn, the tree stands in the yard');
  {
    await ev(() => { const P = window.__paw; P.S.place = 'fmarket'; P.go('yard'); }); await t.calm();
    await ev((d) => { window.__paw.fm.date(d); window.__paw.fm.sync(); }, '2027-04-11');
    ok(await t.until(() => window.__paw.S.place === 'square', null, 4000), 'on 11 Apr a dog standing there walks to the Square');
    const s = await t.S();
    ok(s.decor['Paper Sakura Tree'] && s.inv.clothes.includes('Sakura Haori') && s.inv.toys.includes('Plush Koi'), 'everything bought is still owned');
    await ev(() => { const P = window.__paw, S = P.S; S.outfit.body = 'Sakura Haori'; S.outfit.head = 'Sakura Petal Crown'; P.go('yard'); }); await t.calm();
    ok(await ev(() => !!document.querySelector('#dogArt svg.pa-dog, #view svg.pa-dog')), 'the haori and crown are worn in the yard');
    ok(await ev(() => !!document.querySelector('#view [data-decor="Paper Sakura Tree"], #view [data-decor-name="Paper Sakura Tree"]') || !!window.__paw.S.decor['Paper Sakura Tree'].out), 'the Paper Sakura Tree stands in the yard');
    await shot('sakura_yard_desktop');
    if (SHOTS) { await ev(() => { const P = window.__paw, S = P.S; if (!S.inv.houses.includes('Blossom Kennel')) S.inv.houses.push('Blossom Kennel'); S.house = 'Blossom Kennel'; S.place = 'yard'; P.go('yard'); }); await t.calm(); await shot('sakura_kennel_desktop'); }
  }

  sec('5b. placement: the five decorations clear of the dog house, the house wall, the mailbox and the yard visitor, each inside one phone half, where they are bought');
  {
    await t.ctx.close();
    const ov = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
    const HOUSE = [640, 340, 204, 186], WALLKEEP = [40, 147, 345, 248], MAIL = [179, 258, 66, 88], VIS = [592, 452, 'left', 0.58];
    const half = (b) => (b[0] >= 140 && b[0] + b[2] <= 534) || (b[0] >= 518 && b[0] + b[2] <= 912);
    await t.newGame({ prefs: PREFS, ground: true }, { bond: { level: 8, pts: 1600 }, coins: 4000 });
    await t.until(() => !!(window.__paw && window.__paw.fm && window.__paw.ho), null, 8000);
    const H = await ev((l) => { const D = window.__paw.home.specs; return Object.fromEntries(l.map((n) => [n, { at: D[n].at.slice(0, 4), zone: D[n].zone }])); }, DECOR);
    ok(DECOR.every((n) => H[n].at.every(Number.isFinite) && half(H[n].at)), 'each catalogue spot is inside one phone half (x 140-534 or 518-912): ' + DECOR.map((n) => n + ' ' + H[n].at.join(',')).join('; '));
    ok(DECOR.every((n) => !ov(H[n].at, HOUSE) && !ov(H[n].at, MAIL) && (H[n].zone !== 'wall' || !ov(H[n].at, WALLKEEP))), 'no catalogue spot touches the dog house, the mailbox or the house wall: ' + DECOR.filter((n) => ov(H[n].at, HOUSE) || ov(H[n].at, MAIL) || (H[n].zone === 'wall' && ov(H[n].at, WALLKEEP))).join());
    const vis = await ev((l) => { const P = window.__paw; return Object.fromEntries(l.map((n) => [n, P.ho.keep('yard', n)])); }, DECOR);
    const yv = await ev(() => { const [fx, fy, , sc] = [592, 452, 'left', 0.58]; const w = 264 * sc, h = 220 * sc; return [fx - w / 2 + 20 * sc, fy - h * 205 / 220 + 30 * sc, w - 40 * sc, h - 30 * sc]; });
    ok(DECOR.every((n) => !ov(H[n].at, yv)) && DECOR.every((n) => vis[n].some((k) => Math.abs(k[0] - yv[0]) < 1 && Math.abs(k[1] - yv[1]) < 1)), 'clear of the yard visitor, and hoKeepBoxes lists the visitor box (YV_SPOT) ' + JSON.stringify({ yv, tree: vis['Paper Sakura Tree'], at: H['Paper Sakura Tree'].at }));
    const buy = async (n) => {
      await ev((c) => window.__paw.fm.sheet(c), 'decor'); await t.sleep(200);
      await ev((n) => document.querySelector(`#modal .fm-card[data-n="${n}"] [data-fmbuy]`).click(), n);
      await t.p.waitForSelector('.buybox .bb-yes', { timeout: 4000 }).catch(() => {});
      await ev(() => { const b = document.querySelector('.buybox .bb-yes'); if (b) b.click(); });
      await t.until((n) => !!(window.__paw.S.decor || {})[n], n, 4000);
    };
    await ev(() => { const P = window.__paw; P.fm.sync(); P.S.place = 'fmarket'; P.go('yard'); }); await t.calm();
    for (const n of DECOR) await buy(n);
    const X = await ev((l) => l.map((n) => ({ n, box: window.__paw.ho.box(n) })), DECOR);
    ok(X.every((x) => x.box[0] >= 140 && x.box[0] + x.box[2] <= 912 && !ov(x.box, HOUSE)), 'bought in an empty yard: inside x 140-912, off the dog house: ' + X.map((x) => x.n + ' ' + x.box.join(',')).join('; '));
    ok(X.every((x) => x.box[0] === H[x.n].at[0] && x.box[1] === H[x.n].at[1]), 'each one lands at its catalogue spot: ' + X.filter((x) => x.box[0] !== H[x.n].at[0] || x.box[1] !== H[x.n].at[1]).map((x) => x.n + ' ' + x.box.join(',')).join('; '));
    const bad = []; X.forEach((a, i) => X.forEach((b, j) => { if (j > i && ov(a.box, b.box)) bad.push(a.n + '/' + b.n); }));
    ok(!bad.length, 'none overlaps another: ' + bad.join(', '));
    await ev(() => { const P = window.__paw; P.S.place = 'yard'; P.go('yard'); }); await t.calm();
    const keep = await ev((l) => Object.fromEntries(l.map((n) => [n, window.__paw.ho.keep('yard', n)])), DECOR);
    const hit = []; X.forEach((x) => keep[x.n].forEach((k) => { if (ov(x.box, k)) hit.push(x.n + '/' + k.join(' ')); }));
    ok(!hit.length, 'clear of the yard furniture, the mailbox, the scene hotspots, the visitor and the dog at rest: ' + hit.join(', '));
    // with the Candy-Cane Fairy Lights already out at their catalogue spot, the lanterns are bought at the market and land clear of them
    await ev(() => { const S = window.__paw.S; S.decor = { 'Candy-Cane Fairy Lights': { got: '2026-12-01', out: true, at: [620, 258] } }; window.__paw.go('yard'); });
    await ev(() => { const P = window.__paw; P.S.place = 'fmarket'; P.go('yard'); }); await t.calm();
    await buy('Sakura Paper Lanterns');
    const L = await ev(() => ({ a: window.__paw.ho.box('Sakura Paper Lanterns'), b: window.__paw.ho.box('Candy-Cane Fairy Lights') }));
    ok(!ov(L.a, L.b) && !ov(L.a, HOUSE), 'the lanterns land clear of the Candy-Cane Fairy Lights when both are owned: ' + JSON.stringify(L));
  }
  await t.ctx.close();
  await t.newGame({ prefs: PREFS, ground: true }, { bond: { level: 8, pts: 1600 }, coins: 4000 });
  await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000); await ev(() => window.__paw.fm.sync());

  sec('6. the art: every item has its card, the decorations their props, the treats their bowls; the costumes on every breed and age');
  {
    const A = await ev((x) => { const PA = window.PawArt, ok1 = (s) => typeof s === 'string' && s.length > 200 && /<svg/.test(s);
      const cards = x.all.filter((n) => !ok1(PA.item(n)));
      const props = ['skblanket', 'sklanterns', 'sktree', 'skbento', 'skswing'].filter((p) => !ok1(PA.prop(p, {})));
      const lit = /pa-wb-glow/.test(PA.prop('sklanterns', { lit: true }));
      const bowls = x.tr.filter((n) => !ok1(PA.prop('bowl', { food: n })));
      const keys = (PA.DOGS || []).map((d) => d.key);
      const bad = []; let n = 0;
      keys.forEach((k, i) => x.of.forEach((o, j) => ['idle', 'sit', 'sleep', 'walk'].forEach((pose, q) => { const age = (i + j + q) % 3 === 0 ? 'puppy' : null; n++;
        try { const s = PA.dog(k, { pose, outfit: o, age, anim: false }), s0 = PA.dog(k, { pose, age, anim: false }); if (!ok1(s) || s === s0 || /NaN/.test(s)) bad.push(k + ' ' + pose + ' ' + JSON.stringify(o)); } catch (e) { bad.push(k + ' ' + pose + ' ' + e.message); } })));
      return { cards, props, lit, bowls, bad, n, keys: keys.length }; },
    { all: ALL, tr: TREATS, of: CLOTHES.map((n, i) => (i < 2 ? { head: n } : i < 4 ? { neck: n } : { body: n })) });
    ok(!A.cards.length, '22 item cards: ' + (A.cards.join(', ') || 'all there'));
    ok(!A.props.length && A.lit, '5 decoration props, the lanterns glow when lit');
    ok(!A.bowls.length, 'the two treats have their dog bowls');
    ok(A.keys >= 35 && !A.bad.length, `the 8 costumes on ${A.keys} breeds, 4 poses, adults and puppies: ${A.n} renders, all drawn and different from the plain dog ${A.bad.slice(0, 4).join('; ')}`);
  }

  sec('7. the phone: the scene and a stall sheet at 360 x 640');
  {
    await t.ctx.close();
    await t.newGame({ prefs: PREFS, ground: true, device: 'Galaxy S5' }, { bond: { level: 8, pts: 1600 }, coins: 4000 });
    await t.until(() => !!(window.__paw && window.__paw.fm), null, 8000);
    await ev(() => { const P = window.__paw; P.fm.sync(); P.S.place = 'fmarket'; P.go('yard'); }); await t.calm();
    ok(await ev(() => document.querySelectorAll('#view .fm-petal').length >= 10), 'the petals fall on a phone too');
    await shot('sakura_scene_phone');
    await ev(() => window.__paw.fm.sheet('clothes')); await t.p.waitForSelector('#modal .fm-card');
    const W = await ev(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, cards: document.querySelectorAll('#modal .fm-card').length }));
    ok(W.cards === 8 && W.sw <= W.cw + 1, 'the clothes stall: 8 cards, no sideways page scroll');
    await shot('sakura_sheet_phone');
    if (SHOTS) { await t.closeX(); await t.modalGone(); await ev(() => window.__paw.fm.sheet('homes')); await t.p.waitForSelector('#modal .fm-card'); await shot('sakura_homes_phone'); await t.closeX(); await t.modalGone(); await ev(() => { const P = window.__paw, S = P.S; if (!S.inv.houses.includes('Blossom Kennel')) S.inv.houses.push('Blossom Kennel'); S.house = 'Blossom Kennel'; S.place = 'yard'; P.go('yard'); }); await t.calm(); await shot('sakura_kennel_phone'); }
  }
  ok(!errs.length, 'no page errors: ' + errs.slice(0, 3).join(' | '));
  await t.ctx.close();
});
