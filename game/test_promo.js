// v2.25.5 "Gift codes" (PROMO.md): the game half, against the real Worker (cloudflare/worker.js on a local D1, game/cloud_mock.js).
//   1. migration: an old save loads with S.promo = { used: [], wait: [] } and nothing else changes; tools/promo_items.json matches the tables
//   2. no cloud here (the harness, the claude.ai copy) and the PROMO_UI build flag off: no box anywhere
//   3. a guest: one kind line and "Make the free account", which opens the cloud sign-up
//   4. an account: Settings > Have a code? (a text field: upper case, no autocorrect), a shared code typed loosely: the card lists what came and
//      where it is, Gerald's letter, items in the Wardrobe and the house, treats in the pantry, coins exactly once (they fly from the card)
//   5. the kind error lines: used, unknown (also expired), empty, gone, rate limited, offline; nothing granted
//   6. a lost answer: the Worker recorded it but the game never heard: typing it again restores it (no double coins)
//   7. a fresh device (no cloud save): every redemption comes back once, coins once; a second look and a reload add nothing
//   8. an item this build does not know yet waits in S.promo.wait and is given once it is known
//   9. phone 360x640: the "..." menu's Have a code?, the sheet and the card, 44 px taps, above the phone bar, one column (screenshots in test_logs/)
//  10. reduce motion: the card and the coins still arrive
//  11. a second code of one batch (its own line), a code that brings nothing new (no letter promised), own-key item lookups, an expired login
// node game/run_tests.js promo
const { run, URL } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path'); const fs = require('fs'); const { makeServer, mockInit } = require('./cloud_mock');
devices['Phone 360x640'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 } });
const SAVE = 'pawhaven_proto_v1', AUTH = 'pawhaven_cf_auth', LOGS = path.join(__dirname, 'test_logs');

run('promo', async (t) => {
  const { ok, sec, ev } = t;
  fs.mkdirSync(LOGS, { recursive: true });
  const srv = makeServer(), raw = srv.env.DB.raw;
  const DAY = 864e5;
  const mkCode = (shown, o) => {
    o = o || {}; const code = shown.toUpperCase().replace(/[\s-]/g, '');
    raw.prepare('insert into promo_codes (code, shown, kind, batch, reward, starts_at, ends_at, cap, used, disabled, note, created_at) values (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, null, ?)')
      .run(code, shown, o.kind || 'shared', o.batch || null, JSON.stringify(o.reward), Date.now() - DAY, o.to === undefined ? Date.now() + 30 * DAY : o.to, o.cap === undefined ? null : o.cap, Date.now());
    return code;
  };
  // a page on the local Worker. o: { device, storage, prefs }
  const cloudPage = async (o) => {
    o = o || {}; const was = t.ctx;
    await t.mk({ device: o.device, storage: o.storage, prefs: o.prefs || {} });
    await t.ctx.exposeBinding('__clSrv', (src, m, u, b, a) => srv.handle(src.page, m, u, b, a));
    await t.ctx.addInitScript(mockInit, {});
    if (was) await was.close();
    await t.p.goto(URL); await t.p.waitForSelector('#tGuest, #tNew, #tContinue, #tPlay, [data-ac="guest"]');
  };
  const newHere = async () => { // a new game on the cloud page (a guest pick first when the title asks)
    // the title redraws once the cloud has started (a stored login: "How do you want to play?" turns into New game): decide after that, else
    // the guest card can go away under the click (review 3)
    await t.until((k) => !localStorage.getItem(k) || !!(window.__pawCloud && window.__pawCloud.CL.started && !window.__pawCloud.CL.startP), AUTH, 8000);
    if (!(await t.p.locator('#tNew, #tPlay').count())) { await t.p.click('[data-ac="guest"]'); await t.p.waitForSelector('#tNew'); }
    await t.adopt({}); await t.calm(); await t.lu();
    await t.until(() => !!(window.__pawCloud.CL.uid && window.__paw && window.__paw.pm), null, 8000);
  };
  const register = async (email) => { // the guest becomes an email account on the Worker (same user id); this device takes the new login
    const tok0 = await ev((k) => JSON.parse(localStorage.getItem(k)).token, AUTH);
    const reg = srv.json((await srv.handle(null, 'POST', '/register', JSON.stringify({ email, password: 'pupper123' }), 'Bearer ' + tok0)).text);
    await ev(([k, r]) => { localStorage.setItem(k, JSON.stringify({ token: r.token })); const C = window.__pawCloud.CL; C.email = r.user.email; C.anon = false; }, [AUTH, reg]);
    return reg;
  };
  const closeAll = () => ev(() => { for (let i = 0; i < 3; i++) { const x = document.querySelector('#modal:not([hidden]) .panel .x'); if (x) x.click(); } });
  const settings = async () => { await closeAll(); await ev(() => window.__paw.pm.settings()); return t.until(() => !!document.querySelector('#modal .panel'), null, 3000); };
  const typeCode = async (c) => { await t.p.fill('#pmCode', c); await t.p.press('#pmCode', 'Enter'); };
  const msg = () => ev(() => { const m = document.getElementById('pmMsg'); return m ? m.textContent : ''; });

  sec('1. migration, and tools/promo_items.json matches the game tables');
  await t.newGame({});
  const base = await ev((k) => { window.__paw.saveNow(); const s = JSON.parse(localStorage.getItem(k)); delete s.promo; return s; }, SAVE);
  ok(!('promo' in base), 'the base save has no promo field');
  { const was = t.ctx; await t.mk({ storage: { [SAVE]: JSON.stringify(base) } }); await was.close(); }
  await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu();
  const m1 = await ev(() => { const S = JSON.parse(JSON.stringify(window.__paw.S)); return { keys: Object.keys(S), promo: S.promo, v: S.v, coins: S.coins, inv: S.inv }; });
  const lost = Object.keys(base).filter((k) => !m1.keys.includes(k));
  ok(m1.v === 1 && !lost.length && JSON.stringify(m1.promo) === '{"used":[],"wait":[]}', 'v stays 1, nothing dropped, S.promo = { used: [], wait: [] }: ' + JSON.stringify(m1.promo) + (lost.length ? ' lost ' + lost.join(' ') : ''));
  ok(m1.coins === base.coins && JSON.stringify(m1.inv) === JSON.stringify(base.inv), 'coins and the bag as they were');
  const cat = await ev(() => window.__paw.pm.catalog());
  const file = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'tools', 'promo_items.json'), 'utf8'));
  ok(JSON.stringify(file.items) === JSON.stringify(cat.items) && JSON.stringify(file.treats) === JSON.stringify(cat.treats), 'tools/promo_items.json is up to date (else: node tools/promo_items.js)');
  ok(cat.items.every((x) => !/^(Golden Collar|Crayon Crown|Golden Name Tag|Golden Paw Cottage|Sukajan Jacket)$/.test(x.n)) && !cat.treats.includes('Fresh Water') && !cat.treats.includes('Golden Bone'), 'no earned rewards, no Kind shop looks, no Fresh Water or Golden Bone in what codes may give');
  const promoItems = cat.items.filter((x) => x.promo);
  // the code-only items from the art lane, else stand-ins from the tables (any name works the same way)
  const WEAR = (promoItems.find((x) => x.kind === 'clothes') || { n: 'Party Hat' }).n;
  const DECO = (promoItems.find((x) => x.kind === 'decor') || cat.items.find((x) => x.kind === 'decor' && x.n === 'Bird Bath') || cat.items.find((x) => x.kind === 'decor')).n;
  console.log('   items used: ' + WEAR + ' / ' + DECO + (promoItems.length ? ' (code-only items: ' + promoItems.map((x) => x.n).join(', ') + ')' : ' (no code-only items in the tables yet: stand-ins)'));
  if (promoItems.length) {
    const leak = await ev((L) => { const P = window.__paw, out = []; for (const [k, tabs] of [['boutique', [null]], ['builder', ['houses', 'beds', 'decor', 'furniture']], ['kibble', ['food', 'toys', 'tools']]]) for (const tb of tabs) { P.shop.shop(k); if (tb) { const b = document.querySelector(`[data-btab="${tb}"],[data-tab="${tb}"]`); if (b) b.click(); } const txt = document.querySelector('#modal .panel') ? document.querySelector('#modal .panel').innerText : ''; L.forEach((n) => { if (txt.includes(n)) out.push(k + '/' + (tb || '') + ': ' + n); }); } const x = document.querySelector('#modal .panel .x'); if (x) x.click(); return out; }, promoItems.map((x) => x.n));
    ok(!leak.length, 'no shop in town lists a code-only item: ' + leak.join(' | '));
  }

  sec('2. no cloud here, and the build flag off: no box');
  ok((await ev(() => window.__paw.pm.mode())) === 'off', 'the harness without the cloud: mode off');
  await settings();
  ok(!(await ev(() => !!document.getElementById('pmBox'))), 'Settings has no "Have a code?" box');
  await closeAll();
  await ev(() => window.__paw.pm.more());
  ok(await t.until(() => !!document.querySelector('#modal .moremenu'), null, 3000) && !(await ev(() => !!document.getElementById('mmPromo'))), 'the "..." menu has no "Have a code?"');
  await closeAll();
  await ev(() => { window.__ddPromoMode = 'ok'; });
  await settings();
  ok(await ev(() => !!document.querySelector('#pmBox #pmCode')), 'with the test switch: the box is there');
  await closeAll();
  await ev(() => { window.__ddPromoOff = true; });
  await settings();
  ok(!(await ev(() => !!document.getElementById('pmBox'))) && (await ev(() => window.__paw.pm.mode())) === 'off', 'PROMO_UI off (the build flag): no box even then');
  ok(await ev(() => window.__paw.pm.flag === true), 'PROMO_UI is true in this build');
  await closeAll();

  sec('3. a guest');
  await cloudPage({});
  await newHere();
  ok((await ev(() => window.__paw.pm.mode())) === 'guest', 'a cloud guest: mode guest');
  await settings();
  const g = await ev(() => { const b = document.getElementById('pmBox'); return b ? { kind: b.dataset.pm, txt: b.innerText, input: !!b.querySelector('input'), btn: !!b.querySelector('#pmAcct') } : null; });
  ok(g && g.kind === 'guest' && /free account/.test(g.txt) && !g.input && g.btn, 'Settings: "Have a code?" with one kind line and a button, no field: ' + JSON.stringify(g));
  await t.p.click('#pmAcct');
  ok(await t.until(() => !!document.querySelector('#modal #clBox #clEmail'), null, 3000), '"Make the free account" opens the cloud sign-up form');
  await closeAll();
  const gr = srv.json((await srv.handle(null, 'POST', '/promo/redeem', JSON.stringify({ code: 'ANY-CODE' }), 'Bearer ' + (await ev((k) => JSON.parse(localStorage.getItem(k)).token, AUTH)))).text);
  ok(gr.error === 'login', 'the Worker refuses a guest too: ' + JSON.stringify(gr));

  sec('4. an account: a shared code from Settings');
  const reg = await register('gifted@example.com');
  ok(reg.upgraded && (await ev(() => window.__paw.pm.mode())) === 'ok', 'an email account: mode ok');
  mkCode('DOGGO-IG-NOV', { reward: { items: [WEAR, DECO], coins: 200, treats: { Pupcake: 2, 'Blueberry Bites': 3 } } });
  await ev(() => { const S = window.__paw.S; S.inv.clothes = S.inv.clothes.filter((n) => n !== 'Party Hat'); window.__paw.saveNow(); });
  await settings();
  const box = await ev(() => { const i = document.getElementById('pmCode'), b = document.getElementById('pmGo'), r = (e) => e.getBoundingClientRect(); return i && b ? { cap: i.getAttribute('autocapitalize'), ac: i.getAttribute('autocorrect'), sc: i.getAttribute('spellcheck'), auto: i.getAttribute('autocomplete'), max: i.maxLength, ih: r(i).height, bh: r(b).height, bw: r(b).width, note: document.getElementById('pmBox').innerText } : null; });
  ok(box && box.cap === 'characters' && box.ac === 'off' && box.sc === 'false' && box.auto === 'off' && box.max === 40, 'the field: upper case, no autocorrect, no spellcheck, no autofill, 40 characters: ' + JSON.stringify(box));
  ok(box.ih >= 44 && box.bh >= 44 && box.bw >= 44, `44 px: field ${Math.round(box.ih)}, button ${Math.round(box.bw)}x${Math.round(box.bh)}`);
  ok(/only to our server/.test(box.note), 'the box says the code goes only to our server');
  const before = await ev(() => { const S = window.__paw.S; return { coins: S.coins, pup: S.inv.food.Pupcake || 0, blue: S.inv.food['Blueberry Bites'] || 0, mail: S.mail.length }; });
  await typeCode('  doggo ig-nov ');
  ok(await t.until(() => !!document.querySelector('#modal .panel.pm-got'), null, 5000), 'Enter: the gift card opens');
  const card = await ev(() => { const p = document.querySelector('#modal .panel.pm-got'); return { txt: p.innerText, rows: p.querySelectorAll('.pm-row').length, coins: !!p.querySelector('.pm-coins'), ok: !!p.querySelector('#pmGotOk') }; });
  await t.sleep(700); await t.p.screenshot({ path: path.join(LOGS, 'promo_card_desktop.png') });
  ok(card.rows === 5 && card.coins && card.ok, 'five rows (two items, two treats, the coins) and Yay!: ' + card.rows);
  ok(/A gift for you!/.test(card.txt) && /DOGGO-IG-NOV/.test(card.txt) && /Wardrobe/.test(card.txt) && /Arrange the (yard|house)/.test(card.txt) && /2 × Pupcake/.test(card.txt) && /pantry/.test(card.txt) && /200 coins/.test(card.txt), 'it names each thing and where it is: ' + card.txt.replace(/\s+/g, ' ').slice(0, 260));
  const after = await ev(([w, d]) => { const S = window.__paw.S, m = S.mail.find((x) => x.id === 'pr_DOGGOIGNOV'); return { coins: S.coins, pup: S.inv.food.Pupcake || 0, blue: S.inv.food['Blueberry Bites'] || 0, wear: S.inv.clothes.includes(w), deco: !!(S.decor && S.decor[d]), used: S.promo.used.slice(), letter: m ? m.title + ' / ' + m.text : '' }; }, [WEAR, DECO]);
  ok(after.coins === before.coins + 200, `coins +200 exactly (${before.coins} -> ${after.coins})`);
  ok(after.pup === before.pup + 2 && after.blue === before.blue + 3, 'treats in the pantry: +2 Pupcakes, +3 Blueberry Bites');
  ok(after.wear && after.deco, 'the outfit is in the Wardrobe, the decoration waits in the house');
  ok(after.used.join() === 'DOGGOIGNOV', 'S.promo.used has the code');
  ok(/A little gift for our friends/.test(after.letter) && /DOGGO-IG-NOV/.test(after.letter) && /200 coins/.test(after.letter), "Gerald's letter: " + after.letter.replace(/\n/g, ' / ').slice(0, 200));
  ok(await t.until(() => { const c = document.getElementById('coins'); return !!c && /\d/.test(c.innerText); }, null, 3000), 'the coin counter is there for the fly');
  await t.p.click('#pmGotOk'); ok(await t.until(() => document.getElementById('modal').hidden, null, 2000), 'Yay! closes the card');
  ok(srv.calls.filter((c) => c.page && c.op === 'POST /promo/redeem').length === 1, 'one call from the game to the Worker');

  sec('5. the kind error lines');
  const c5 = await ev(() => window.__paw.S.coins);
  await settings();
  const r5 = srv.calls.filter((c) => c.page && c.op === 'POST /promo/redeem').length;
  await typeCode('doggo-ig-nov'); ok(await t.until(() => /This save already has this gift/.test((document.getElementById('pmMsg') || {}).textContent || ''), null, 4000), 'the same code again: "This save already has this gift.": ' + (await msg()));
  ok(srv.calls.filter((c) => c.page && c.op === 'POST /promo/redeem').length === r5, 'checked on this device first: the Worker was not asked, no slot spent');
  ok(await ev(() => document.getElementById('pmMsg').getAttribute('role') === 'status'), 'the line is a status for screen readers');
  await typeCode('NOPE-1234'); ok(await t.until(() => /not working/.test(document.getElementById('pmMsg').textContent), null, 4000), 'an unknown code: "That code is not working": ' + (await msg()));
  mkCode('OLD-CODE', { reward: { coins: 50 }, to: Date.now() - 1000 });
  await typeCode('old code'); ok(await t.until(() => /not working/.test(document.getElementById('pmMsg').textContent), null, 4000), 'an expired code: the same line');
  await t.p.fill('#pmCode', '   '); await t.p.click('#pmGo'); ok(await t.until(() => /Type a code first/.test(document.getElementById('pmMsg').textContent), null, 2000), 'empty: "Type a code first."');
  mkCode('ONE-LEFT', { reward: { coins: 50 }, cap: 1 });
  { const other = srv.json((await srv.handle(null, 'POST', '/guest', '{}', null)).text); const o2 = srv.json((await srv.handle(null, 'POST', '/register', JSON.stringify({ email: 'quick@example.com', password: 'pupper123' }), 'Bearer ' + other.token)).text); await srv.handle(null, 'POST', '/promo/redeem', JSON.stringify({ code: 'ONE-LEFT' }), 'Bearer ' + o2.token); }
  await typeCode('ONE-LEFT'); ok(await t.until(() => /no gifts left/.test(document.getElementById('pmMsg').textContent), null, 4000), 'a code used up by others: "This code has no gifts left": ' + (await msg()));
  srv.env.RATE_SCALE = '0.0001';
  mkCode('SLOW-CODE', { reward: { coins: 50 } });
  await typeCode('SLOW-CODE'); ok(await t.until(() => /Lots of tries/.test(document.getElementById('pmMsg').textContent), null, 4000), 'over the limit: "Lots of tries!": ' + (await msg()));
  srv.env.RATE_SCALE = 100;
  srv.offline.add(t.p);
  await typeCode('SLOW-CODE'); ok(await t.until(() => /could not be checked/.test(document.getElementById('pmMsg').textContent), null, 4000), 'offline: "could not be checked right now": ' + (await msg()));
  srv.offline.delete(t.p);
  ok((await ev(() => window.__paw.S.coins)) === c5 && (await ev(() => window.__paw.S.promo.used.length)) === 1, 'none of them granted anything');
  ok(!(await ev(() => !!document.querySelector('#modal .panel.pm-got'))), 'no card');
  await closeAll();

  sec('6. a lost answer: recorded at the Worker, never heard by the game');
  mkCode('LOST-ANSWER', { reward: { items: ['Bow Tie'], coins: 120 } });
  // the start-up look at /promo/mine for this account first (it runs once per account: the email account came after the guest's start, so a
  // yard visit could start it any time): else it may bring the lost code back on its own before it is typed (review 3)
  await ev(() => window.__paw.pm.poll()); ok(await ev(() => window.__paw.pm.polled()), 'the start-up restore has run for this account');
  const tok = await ev((k) => JSON.parse(localStorage.getItem(k)).token, AUTH);
  const lostR = srv.json((await srv.handle(null, 'POST', '/promo/redeem', JSON.stringify({ code: 'LOST-ANSWER' }), 'Bearer ' + tok)).text);
  ok(lostR.ok === true, 'the Worker recorded it');
  const c6 = await ev(() => window.__paw.S.coins);
  await settings(); await typeCode('lost-answer');
  ok(await t.until(() => !!document.querySelector('#modal .panel.pm-got'), null, 5000), 'typing it again: the Worker says used, the game restores it and shows the card');
  ok((await ev(() => window.__paw.S.coins)) === c6 + 120 && (await ev(() => window.__paw.S.inv.clothes.includes('Bow Tie'))), '+120 coins and the Bow Tie, once');
  await t.p.click('#pmGotOk'); await t.until(() => document.getElementById('modal').hidden, null, 2000);
  await settings(); await typeCode('LOST-ANSWER');
  ok(await t.until(() => /This save already has this gift/.test(document.getElementById('pmMsg').textContent), null, 4000) && (await ev(() => window.__paw.S.coins)) === c6 + 120, 'and again: this save already has it, no more coins: ' + (await msg()) + ' ' + (await ev(() => [window.__paw.S.coins, document.querySelector('#modal .panel') && document.querySelector('#modal .panel').className])) + ' ' + c6);
  await closeAll();
  const keep = await ev(() => window.__paw.S.coins);

  sec('6b. a Dog Card with the Follower Star Bandana meets an older Worker (DC_LIM.outfit 57): sent again without it');
  { const h0 = srv.handle; let refused = 0, sent = null;
    srv.handle = async (page, m, u, b, a) => { if (srv.oldDc && m === 'PUT' && u === '/card') { const x = JSON.parse(b || '{}'); if ((x.dogs || []).some((d) => d.o >= 57)) { refused++; return { status: 400, text: '{"error":"bad_card"}' }; } sent = x; } return h0(page, m, u, b, a); };
    srv.oldDc = true;
    const dc = await ev(async () => { const P = window.__paw, S = P.S, C = window.__pawCloud.CL; if (!S.inv.clothes.includes('Follower Star Bandana')) S.inv.clothes.push('Follower Star Bandana'); S.dog.outfit.neck = 'Follower Star Bandana'; S.dog.outfit.body = null;
      S.dc.on = true; S.dc.uid = C.uid; S.dc.dogs = [{ id: S.dog.id }]; const before = P.dc.payload().dogs.map((d) => d.o); P.dc.outfitOld(false); await P.dc.sync(); return { before, old: P.dc.outfitOld(), oldN: P.dc.outfitOldN, list: P.dc.lists.outfits.indexOf('Follower Star Bandana'), mine: P.dc.mine ? P.dc.mine.dogs.map((d) => d.o) : null }; });
    ok(dc.list === 57 && dc.before[0] === 57 && dc.oldN === 57, 'the bandana is DC_OUTFITS 57 and the card carries it: ' + JSON.stringify(dc));
    ok(refused === 1 && sent && sent.dogs[0].o === -1 && dc.old === true && dc.mine && dc.mine[0] === -1, 'the older Worker refuses it once; the card goes again with no outfit and stays shared: ' + JSON.stringify({ refused, sent: sent && sent.dogs.map((d) => d.o), dc }));
    await ev(() => window.__paw.dc.sync()); ok(refused === 1, 'a later sync does not knock again');
    srv.oldDc = false; srv.handle = h0;
    await ev(() => { const P = window.__paw, S = P.S; P.dc.outfitOld(false); S.dc.on = false; S.dog.outfit.neck = null; P.saveNow(); });
    await ev(() => window.__paw.dc.sync());
  }

  sec('7. a fresh device with no cloud save: everything comes back once');
  await ev(() => window.__paw.saveNow());
  raw.prepare('delete from saves').run(); // the account has no cloud save (a new game on a new phone)
  const tokF = await ev((k) => localStorage.getItem(k), AUTH);
  await cloudPage({ storage: { [AUTH]: tokF } });
  await newHere();
  ok((await ev(() => window.__paw.pm.mode())) === 'ok', 'signed in on the new device');
  ok(await t.until(() => window.__paw.S.promo.used.length === 2, null, 8000), 'the poll restores both codes this account used: ' + JSON.stringify(await ev(() => window.__paw.S.promo.used)));
  const f7 = await ev(([w, d]) => { const S = window.__paw.S; return { coins: S.coins, wear: S.inv.clothes.includes(w), bow: S.inv.clothes.includes('Bow Tie'), deco: !!(S.decor && S.decor[d]), pup: S.inv.food.Pupcake || 0, letters: S.mail.filter((m) => /^pr_/.test(m.id)).length }; }, [WEAR, DECO]);
  ok(f7.wear && f7.bow && f7.deco && f7.letters === 2, 'items back and two letters: ' + JSON.stringify(f7));
  ok(await t.waitToast(/Your gift codes came back/, 3000), 'a toast says so');
  const f7c = f7.coins;
  const again = await ev(() => window.__paw.pm.restore(true));
  ok(Array.isArray(again) && again.length === 0 && (await ev(() => window.__paw.S.coins)) === f7c, 'a second look: nothing more, coins unchanged');
  ok(srv.calls.filter((c) => c.op === 'GET /promo/mine').length >= 2, 'GET /promo/mine was asked');
  await ev(() => window.__paw.saveNow());
  // "a reload" is a fresh page on a copy of this page's storage (review 3). page.reload() of the file:// harness came back about one run in
  // three with an EMPTY localStorage (no save, login or cloud meta: only the prefs the harness writes on every load), so the title asked
  // "How do you want to play?" and #tContinue never came. The game has no localStorage.clear() and removes only single keys; with a
  // storage probe added the loss never happened again, so it is the browser's file:// storage across the reload, not a signal to wait for
  const keepLS = await ev(() => { const o = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); o[k] = localStorage.getItem(k); } return o; });
  ok(keepLS[SAVE] && keepLS[AUTH], 'the save and the login are on this device before the reload');
  await cloudPage({ storage: keepLS }); await t.p.waitForSelector('#tContinue', { timeout: 8000 }); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu();
  await t.until(() => window.__paw && window.__paw.pm, null, 5000); await ev(() => window.__paw.pm.poll()); await t.sleep(500);
  ok((await ev(() => window.__paw.S.coins)) === f7c && (await ev(() => window.__paw.S.promo.used.length)) === 2, 'after a reload: still once (' + f7c + ' coins)');
  const startCoins = await ev(() => { const S = window.__paw.S; return S.coins - 320; });
  ok(startCoins >= 0 && startCoins <= 400, 'the restored save got the 200 + 120 coins once on top of a new game\'s start (' + startCoins + ' + 320)');
  ok(keep === f7c, 'the same gifts, the same coins as on the first device (' + keep + ')');

  sec('8. an item this build does not know yet waits');
  const w8 = await ev(() => { const o = window.__paw.pm.grant({ key: 'TESTWAIT', code: 'TEST-WAIT', reward: { items: ['Moon Boots'], coins: 0, treats: { 'Golden Bone': 1 } } }); return { o, wait: window.__paw.S.promo.wait.slice() }; });
  ok(w8.o && w8.o.wait === 2 && w8.wait.length === 2 && w8.wait[0].n === 'Moon Boots', 'Moon Boots and a Golden Bone (not a FOOD treat) wait: ' + JSON.stringify(w8.wait));
  const w8b = await ev(() => { const S = window.__paw.S; S.promo.wait[0].n = 'Rain Hat'; S.inv.clothes = S.inv.clothes.filter((n) => n !== 'Rain Hat'); const n = window.__paw.pm.wait(); return { n, has: S.inv.clothes.includes('Rain Hat'), left: S.promo.wait.length, gb: S.inv.food['Golden Bone'] || 0 }; });
  ok(w8b.n === 1 && w8b.has && w8b.left === 1 && w8b.gb === 0, 'once the build knows the item it is given; the Golden Bone never is: ' + JSON.stringify(w8b));
  await ev(() => { window.__paw.S.promo.wait = []; window.__paw.saveNow(); });

  sec('9. phone 360x640: the menu, the sheet, the card');
  mkCode('PHONE-GIFT', { reward: { items: ['Flower Crown'], coins: 80, treats: { 'Carrot Sticks': 2 } } });
  const tokP = await ev((k) => localStorage.getItem(k), AUTH), saveP = await ev((k) => localStorage.getItem(k), SAVE);
  await cloudPage({ device: 'Phone 360x640', storage: { [AUTH]: tokP, [SAVE]: saveP } });
  await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu();
  await t.until(() => window.__paw && window.__paw.pm && window.__paw.pm.mode() === 'ok', null, 8000);
  await t.p.click('#moreBtn');
  ok(await t.until(() => !!document.getElementById('mmPromo'), null, 3000), 'the "..." menu has "Have a code?"');
  const mb = await ev(() => { const r = document.getElementById('mmPromo').getBoundingClientRect(); return { w: r.width, h: r.height }; });
  ok(mb.w >= 44 && mb.h >= 44, `its button is 44 px or more (${Math.round(mb.w)}x${Math.round(mb.h)})`);
  await t.p.click('#mmPromo');
  ok(await t.until(() => !!document.querySelector('#modal .panel.pm-sheet #pmCode'), null, 3000), 'it opens the code sheet');
  await t.sleep(500);
  const audit = (sel) => ev((sel) => {
    const vw = innerWidth, bad = [], bar = document.getElementById('bar'), br = bar && !bar.hidden && bar.offsetParent ? bar.getBoundingClientRect() : null;
    const panel = document.querySelector(sel), pr = panel.getBoundingClientRect();
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    [...panel.querySelectorAll('.btn, input')].filter(vis).forEach((b) => { const r = b.getBoundingClientRect(); if (r.height < 43.5 || r.width < 43.5) bad.push('small ' + (b.innerText || b.id || b.className).trim().slice(0, 20) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); if (r.right > vw + 0.5 || r.left < -0.5) bad.push('off screen ' + (b.id || b.className)); });
    const fs = parseFloat(getComputedStyle(panel.querySelector('input') || panel).fontSize);
    return { bad, over: document.documentElement.scrollWidth > vw + 1, pw: Math.round(pr.width), pBottom: Math.round(pr.bottom), barTop: br ? Math.round(br.top) : null, inputFont: fs };
  }, sel);
  const a9 = await audit('#modal .panel.pm-sheet');
  await t.p.screenshot({ path: path.join(LOGS, 'promo_phone_sheet.png') });
  ok(!a9.bad.length && a9.pw <= 360 && !a9.over, 'the sheet: 44 px taps, inside 360 px, no sideways scroll: ' + JSON.stringify(a9));
  ok(a9.barTop == null || a9.pBottom <= a9.barTop + 1, `above the phone bar (sheet ${a9.pBottom}, bar ${a9.barTop})`);
  ok(a9.inputFont >= 16, 'the field text is 16 px or more (no zoom on iPhone): ' + a9.inputFont);
  const st9 = await ev(() => { const f = document.getElementById('pmForm'), i = document.getElementById('pmCode').getBoundingClientRect(), b = document.getElementById('pmGo').getBoundingClientRect(); return { col: b.top >= i.bottom - 1, dir: getComputedStyle(f).flexDirection }; });
  ok(st9.col && st9.dir === 'column', 'one column: the button under the field');
  // the on-screen keyboard (review 2; as the reset sheet, rsKeyboard): Android shrinks the page, iOS only the visual viewport
  await t.p.setViewportSize({ width: 360, height: 360 }); await t.sleep(300);
  await t.p.focus('#pmCode'); await t.sleep(500);
  const kb9 = await ev(() => { const r = document.getElementById('pmCode').getBoundingClientRect(), g = document.getElementById('pmGo').getBoundingClientRect(), vv = window.visualViewport; return [Math.round(r.top), Math.round(r.bottom), Math.round(vv ? vv.height : innerHeight), Math.round(g.bottom)]; });
  ok(kb9[0] >= 0 && kb9[1] <= kb9[2], 'Android: with the keyboard up (the page 360 px tall), the field stays in view ' + kb9.join(' '));
  await t.p.setViewportSize({ width: 360, height: 640 }); await t.sleep(300);
  await closeAll();
  await ev(() => { // iOS: the page keeps its height, the keyboard covers its bottom: a stand-in visualViewport the test resizes
    const vv = new EventTarget(); vv.width = innerWidth; vv.height = innerHeight; vv.offsetTop = 0; vv.offsetLeft = 0; vv.scale = 1;
    Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true }); window.__fakeVV = vv;
  });
  await t.p.click('#moreBtn'); await t.until(() => !!document.getElementById('mmPromo'), null, 3000); await t.p.click('#mmPromo');
  await t.until(() => !!document.querySelector('#modal .panel.pm-sheet #pmCode'), null, 3000); await t.sleep(400);
  const ios0 = await ev(() => Math.round(document.getElementById('pmCode').getBoundingClientRect().bottom));
  await t.p.focus('#pmCode');
  await ev(() => { const vv = window.__fakeVV; vv.height = innerHeight - 280; vv.dispatchEvent(new Event('resize')); });
  await t.sleep(700);
  const ios = await ev(() => { const p = document.querySelector('#modal .panel.pm-sheet'), r = document.getElementById('pmCode').getBoundingClientRect(); return { kb: p.style.getPropertyValue('--rs-kb'), pad: getComputedStyle(p.querySelector('.panel-body')).paddingBottom, top: Math.round(r.top), bottom: Math.round(r.bottom), vh: window.__fakeVV.height }; });
  ok(ios.kb === '280px' && ios.pad === '280px', 'iOS: the sheet gets room as tall as the keyboard (--rs-kb 280px): ' + JSON.stringify(ios));
  ok(ios.top >= 0 && ios.bottom <= ios.vh, `iOS: the field moves up above a 280 px keyboard (it was at ${ios0}): ` + JSON.stringify(ios));
  await t.p.screenshot({ path: path.join(LOGS, 'promo_phone_keyboard.png') });
  await ev(() => { const vv = window.__fakeVV; vv.height = innerHeight; vv.dispatchEvent(new Event('resize')); });
  await t.sleep(200);
  ok((await ev(() => document.querySelector('#modal .panel.pm-sheet').style.getPropertyValue('--rs-kb'))) === '0px', 'the keyboard down: the room goes too');
  await ev(() => { delete window.visualViewport; delete window.__fakeVV; });
  const c9 = await ev(() => window.__paw.S.coins);
  await t.p.fill('#pmCode', 'phone gift'); await t.p.click('#pmGo');
  ok(await t.until(() => !!document.querySelector('#modal .panel.pm-got'), null, 5000), 'the card opens on the phone');
  await t.sleep(800);
  const a9b = await audit('#modal .panel.pm-got');
  await t.p.screenshot({ path: path.join(LOGS, 'promo_phone_card.png') });
  ok(!a9b.bad.length && a9b.pw <= 360 && !a9b.over && (a9b.barTop == null || a9b.pBottom <= a9b.barTop + 1), 'the card fits the phone, 44 px Yay!, above the bar: ' + JSON.stringify(a9b));
  ok((await ev(() => window.__paw.S.coins)) === c9 + 80, '+80 coins');
  await t.p.click('#pmGotOk'); await t.until(() => document.getElementById('modal').hidden, null, 2000);
  // the guest line on the phone
  await ev(() => { window.__ddPromoMode = 'guest'; });
  await t.p.click('#moreBtn'); await t.until(() => !!document.getElementById('mmPromo'), null, 3000); await t.p.click('#mmPromo');
  ok(await t.until(() => !!document.querySelector('#modal .panel.pm-sheet #pmAcct'), null, 3000), 'a guest on the phone: the kind line and the account button');
  await t.sleep(600);
  const a9c = await audit('#modal .panel.pm-sheet');
  await t.p.screenshot({ path: path.join(LOGS, 'promo_phone_guest.png') });
  ok(!a9c.bad.length && !a9c.over && (a9c.barTop == null || a9c.pBottom <= a9c.barTop + 1), 'it fits, above the bar: ' + JSON.stringify(a9c));
  await ev(() => { delete window.__ddPromoMode; }); await closeAll();

  sec('10. reduce motion: the card and the coins still arrive');
  await ev(() => { document.documentElement.dataset.motion = 'off'; });
  mkCode('CALM-GIFT', { reward: { coins: 60, treats: { 'Apple Slices': 1 } } });
  const c10 = await ev(() => window.__paw.S.coins);
  await t.p.click('#moreBtn'); await t.until(() => !!document.getElementById('mmPromo'), null, 3000); await t.p.click('#mmPromo');
  await t.until(() => !!document.getElementById('pmCode'), null, 3000);
  await t.p.fill('#pmCode', 'CALM-GIFT'); await t.p.click('#pmGo');
  ok(await t.until(() => !!document.querySelector('#modal .panel.pm-got'), null, 5000), 'motion off: the card opens');
  ok(await t.until((c) => window.__paw.S.coins === c + 60 && document.getElementById('coins').innerText.replace(/\D/g, '') === String(window.__paw.S.coins), c10, 4000), 'the coins are in, and the counter shows them: ' + (await ev(() => [window.__paw.S.coins, document.getElementById('coins').innerText])));
  await t.p.click('#pmGotOk'); await t.until(() => document.getElementById('modal').hidden, null, 2000);
  await ev(() => { delete document.documentElement.dataset.motion; });

  sec('11. a second code of one gift batch, nothing new, own keys only, a login that ran out');
  ['XMAS-AB2C-DE3F', 'XMAS-GH4J-KM5N'].forEach((c) => mkCode(c, { kind: 'unique', batch: 'XMAS-20261116', cap: 1, reward: { coins: 30 } }));
  await t.p.click('#moreBtn'); await t.until(() => !!document.getElementById('mmPromo'), null, 3000); await t.p.click('#mmPromo');
  await t.until(() => !!document.getElementById('pmCode'), null, 3000);
  await t.p.fill('#pmCode', 'xmas-ab2c-de3f'); await t.p.click('#pmGo');
  ok(await t.until(() => !!document.querySelector('#modal .panel.pm-got'), null, 5000), 'a batch code: the card');
  await t.p.click('#pmGotOk'); await t.until(() => document.getElementById('modal').hidden, null, 2000);
  const c11 = await ev(() => window.__paw.S.coins);
  await t.p.click('#moreBtn'); await t.until(() => !!document.getElementById('mmPromo'), null, 3000); await t.p.click('#mmPromo');
  await t.until(() => !!document.getElementById('pmCode'), null, 3000);
  await t.p.fill('#pmCode', 'XMAS-GH4J-KM5N'); await t.p.click('#pmGo');
  ok(await t.until(() => /You already used a code from this gift batch/.test(document.getElementById('pmMsg').textContent), null, 4000) && (await ev(() => window.__paw.S.coins)) === c11, 'another code of the same batch: its own line, nothing granted: ' + (await msg()));
  await closeAll();
  // everything owned already, no coins or treats: the card does not promise a letter, and none is sent
  const had = await ev(() => { const P = window.__paw, S = P.S; const n = S.inv.clothes.includes('Bow Tie') ? 'Bow Tie' : S.inv.clothes[0]; const m0 = S.mail.length; const o = P.pm.grant({ key: 'TESTHAD', code: 'TEST-HAD', reward: { items: [n], coins: 0, treats: {} } }); const p = P.pm.card(o); const r = { n, letter: o.letter, mail: S.mail.length - m0, mailLine: !!p.querySelector('.pm-mail'), txt: p.innerText }; p.querySelector('#pmGotOk').click(); return r; });
  ok(had.letter === false && had.mail === 0 && !had.mailLine && /You had this one already/.test(had.txt) && !/sent you a letter/.test(had.txt), 'nothing new: "You had this one already", no letter and no letter line: ' + JSON.stringify(had).slice(0, 200));
  const own = await ev(() => ['constructor', 'toString', '__proto__', 'hasOwnProperty'].map((n) => window.__paw.pm.kind(n)));
  ok(own.every((x) => x === null), 'item lookups use own keys only (constructor, toString ... are not items): ' + JSON.stringify(own));
  // the login ran out (the Worker no longer knows the token): 401 no_session, "log in again" with a Log in button
  await ev(() => { window.__paw.S.promo.used = window.__paw.S.promo.used.filter((k) => k !== 'TESTHAD'); });
  await t.p.click('#moreBtn'); await t.until(() => !!document.getElementById('mmPromo'), null, 3000); await t.p.click('#mmPromo');
  await t.until(() => !!document.getElementById('pmCode'), null, 3000);
  ok(await ev(() => document.querySelector('#pmBox .pm-relog').hidden), 'no Log in button before');
  raw.prepare('delete from sessions').run();
  await t.p.fill('#pmCode', 'CALM-GIFT-2'); await t.p.click('#pmGo');
  ok(await t.until(() => /logged out on this device. Log in again/.test(document.getElementById('pmMsg').textContent), null, 4000), 'an expired login: "You were logged out on this device. Log in again, then try the code.": ' + (await msg()));
  const rl = await ev(() => { const b = document.getElementById('pmLogin'), r = b.getBoundingClientRect(); return { shown: !document.querySelector('#pmBox .pm-relog').hidden, w: r.width, h: r.height, mode: window.__paw.pm.mode() }; });
  ok(rl.shown && rl.w >= 44 && rl.h >= 44 && rl.mode === 'guest', 'a Log in button (44 px) under it; the dead login is dropped: ' + JSON.stringify(rl));
  await t.p.click('#pmLogin');
  ok(await t.until(() => !!document.querySelector('#modal #clBox #clPw[autocomplete="current-password"]'), null, 3000), 'Log in opens the cloud log-in form');
  await closeAll();
  ok(!t.errors.length, 'no console errors: ' + t.errors.slice(0, 3).join(' | '));
}, { timeout: 420000 });
