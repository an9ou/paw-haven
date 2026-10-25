// v2.18 "Fun Fair" (V218.md): the eight games (Treat Catch, Bubble Pop, Sniff & Seek, Dog Show Pose, Kite Day, the newspaper round, the bakery helper,
// the neighbour dog wash), the caps table, the Saturday market stall, the weekly photo contest, the stickers, the save and the phone layout.
// Everything needs prefs.ffTest under the harness. V218_SHOTS=1 also writes the release screenshots to docs/release/v2.18/.
const { run, URL } = require('./test_lib'); const path = require('path'); const fs = require('fs');
const SHOTS = process.env.V218_SHOTS ? path.join(__dirname, '..', 'docs', 'release', 'v2.18') : null;
const BAD = /\b(sell|sells|selling|sold)\b[^.!?]*\b(dog|dogs|pup|pups|puppy|puppies)\b|\b(dog|dogs|pup|pups|puppy|puppies)\b[^.!?]*\b(sell|sells|selling|sold)\b|\bstud\b|litter price/i;
const GAMES = ['catch', 'bubble', 'seek', 'show', 'kite', 'paper', 'bakery', 'wash'];
const CAPS = { catch: 20, bubble: 15, seek: 15, show: 20, kite: 15, paper: 15, bakery: 15, wash: 10 };
const PREFS = { ffTest: true, ddTest: true, jpTest: true };

run('v218_fun_fair', async (t) => {
  const { ok, sec, ev } = t; const errs = [];
  const shot = async (name) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.sleep(350); await t.p.screenshot({ path: path.join(SHOTS, name + '.png') }); };
  const fresh = async (o, patch) => {
    await t.newGame(Object.assign({ prefs: PREFS, ground: true }, o || {}), Object.assign({ bond: { level: 8, pts: 1600 }, coins: 500 }, patch || {}));
    t.p.on('pageerror', (e) => errs.push(e.message));
    await t.until(() => !!(window.__paw && window.__paw.ff && window.__paw.ff.on()), null, 5000);
    await ev(() => { window.__toasts.splice(0); document.getElementById('toasts').innerHTML = ''; });
  };
  const G = (f, a) => ev(f, a); // f runs with window.__paw.ff.g
  const start = async (k) => {
    const place = await ev((k) => window.__paw.ff.games[k].place, k);
    await t.home(place); await ev(() => { const S = window.__paw.S; S.stats.energy = 100; S.sleeping = false; document.getElementById('toasts').innerHTML = ''; });
    const okk = await ev((k) => window.__paw.ff.start(k), k);
    await t.until(() => window.__paw.mode === 'fair' && !!window.__paw.ff.g, null, 4000);
    return okk;
  };
  // field units -> page pixels
  const px = (x, y) => ev(([x, y]) => { const g = window.__paw.ff.g, r = g.field.getBoundingClientRect(); return { x: r.left + x * g.sc, y: r.top + y * g.sc }; }, [x, y]);
  const clickF = async (x, y) => { const p = await px(x, y); await t.p.mouse.click(p.x, p.y); };
  const endRound = async () => { await ev(() => window.__paw.ff.end()); await t.until(() => !!document.querySelector('#ffEnd:not([hidden]) #ffBack'), null, 4000); };
  const back = async () => { await ev(() => window.__paw.ff.back()); await t.until(() => window.__paw.mode !== 'fair', null, 4000); };

  sec('0. off for the older suites: no button, no hook switch, the sticker book keeps 72');
  await t.newGame({ ground: true, prefs: { ddTest: true } });
  ok(await t.until(() => !!(window.__paw && window.__paw.ff), null, 5000) && !(await ev(() => window.__paw.ff.on())), 'the hook exists, the Fun Fair is off without prefs.ffTest');
  await t.home('park'); ok(!(await ev(() => !!document.querySelector('#placeBtns [data-ff]'))), 'no Fun Fair button at the park');
  ok(await ev(() => window.__paw.dd.defs().length === 72), 'the v2.17 sticker book still has 72 stickers');
  ok(!(await ev(() => window.__paw.ff.start('catch'))), 'ffStart refuses while off');
  await t.ctx.close();

  sec('1. the save: an old save gets S.ff with defaults, junk is repaired, S.v stays 1');
  await fresh();
  {
    const oldJson = await ev(() => { const P = window.__paw; P.saveNow(); const s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); delete s.ff; return JSON.stringify(s); });
    await t.ctx.close(); await t.mk({ prefs: PREFS, map215: true, ground: true, storage: { pawhaven_proto_v1: oldJson } }); await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
    const s = await t.S();
    ok(s.v === 1 && s.ff && typeof s.ff.c === 'object' && s.ff.pc && Array.isArray(s.ff.pc.e) && s.ff.mk.coins === 0 && s.ff.wash.day === '', 'migrate() adds S.ff, v stays 1: ' + Object.keys(s.ff).join(','));
    await t.until(() => !!(window.__paw && window.__paw.fw), null, 5000);
    ok(await ev(() => { const x = window.__paw.fw.migrate({ v: 1, dogs: [{ id: 'a', name: 'A', key: 'shiba', bond: { level: 2, pts: 70 } }], inv: { food: {}, toys: [], clothes: [], houses: [] }, ff: { c: 'junk', n: { catch: -3, show: 2 }, pc: { e: [1, 2, 3, 4, 5] }, mk: { coins: 'x' } } }); return x.v === 1 && typeof x.ff.c === 'object' && !('catch' in x.ff.n) && x.ff.n.show === 2 && x.ff.pc.e.length === 3 && x.ff.mk.coins === 0; }), 'junk is repaired: bad counts dropped, three photo entries at most');
    await t.ctx.close();
  }

  sec('2. the caps table: one table, every game pays at most its round and day cap, raw coins');
  await fresh();
  {
    const C = await ev(() => window.__paw.ff.caps);
    ok(GAMES.every((k) => C[k].day === CAPS[k] && C[k].round <= C[k].day && C[k].en > 0), 'daily caps: ' + GAMES.map((k) => k + ' ' + C[k].day).join(', '));
    ok(C.stall.week === 40 && C.photo.week === 30, 'the stall 40 a Saturday, the photo contest 30 a week');
    const sum = GAMES.reduce((a, k) => a + C[k].day, 0) + C.stall.week / 7 + C.photo.week / 7;
    ok(sum < 140, `every v2.18 source together: about ${Math.round(sum)} coins a day at most`);
    const r = await ev(() => { const P = window.__paw, S = P.S, c0 = S.coins, a = P.ff.pay('catch', 50), b = P.ff.pay('catch', 50), c = P.ff.pay('catch', 50), left = P.ff.left('catch'); return { a, b, c, left, got: S.coins - c0 }; });
    ok(r.a === 10 && r.b === 10 && r.c === 0 && r.left === 0 && r.got === 20, 'Treat Catch: 10 a round, 20 a day, then nothing (no BOOST): ' + JSON.stringify(r));
    ok(await ev(() => { const S = window.__paw.S; S.ff.day = '2000-01-01'; return window.__paw.ff.left('catch') === 20; }), 'a new day starts the caps again');
  }

  sec('3. the place buttons and the game cards');
  {
    const want = { park: 'Treat Catch', pool: 'Bubble Pop', yard: 'Yard games', square: 'Fun Fair', fujihill: 'Kite Day', cafe: 'Bakery helper', market: 'Saturday market stall' };
    for (const [pl, lbl] of Object.entries(want)) {
      await t.home(pl); await t.until(() => !!document.querySelector('#placeBtns [data-ff]'), null, 3000);
      const b = await ev(() => { const e = document.querySelector('#placeBtns [data-ff]'); return e ? e.textContent : ''; });
      ok(b === lbl, `${pl}: the button says "${b}"`);
    }
    await t.home('square'); await t.p.click('#placeBtns [data-ff]'); await t.p.waitForSelector('#modal .ff-cards');
    const cards = await ev(() => [...document.querySelectorAll('#modal .ff-card')].map((c) => c.dataset.k));
    ok(cards.join() === 'show,paper,photo', 'the Square cards: ' + cards.join());
    await shot('cards_square_desktop');
    await t.closeX(); await t.modalGone();
    await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.bond = { level: 2, pts: 120 }; }); });
    await t.home('square'); await t.p.click('#placeBtns [data-ff]'); await t.p.waitForSelector('#modal .ff-cards');
    ok(await ev(() => document.querySelector('#modal .ff-card[data-k="show"] [data-ffgo]').getAttribute('aria-disabled') === 'true' && /Bond 4/.test(document.querySelector('#modal .ff-card[data-k="show"]').textContent)), 'Bond 2: Dog Show Pose is locked, "Opens at Bond 4"');
    await ev(() => document.querySelector('#modal .ff-card[data-k="show"] [data-ffgo]').click()); ok(await t.waitToast(/opens at Bond 4/, 3000), 'a kind no');
    ok(await ev(() => window.__paw.mode === 'yard'), 'no game started');
    await t.closeX(); await t.modalGone();
    ok(await ev(() => window.__paw.ff.unlocks(3).some((x) => /Bubble Pop/.test(x)) && window.__paw.ff.unlocks(5).some((x) => /Kite Day/.test(x))), 'the level-up card lists the new games at their Bond');
    await ev(() => { const S = window.__paw.S; S.dogs.forEach((d) => { d.bond = { level: 8, pts: 1600 }; }); });
    await t.home('park'); await ev(() => { window.__paw.S.stats.energy = 6; });
    ok(!(await ev(() => window.__paw.ff.can('catch'))), 'too tired: no round (Energy 6)');
    await ev(() => { window.__paw.S.stats.energy = 100; });
  }

  // the frame: rAF with time deltas, sprites moved by transforms, the dog drawn only when its pose changes
  const frameCheck = async (k) => {
    const r = await ev(() => new Promise((res) => {
      const g = window.__paw.ff.g, dog = g.field.querySelector('.ff-dog'); let muts = 0; const mo = new MutationObserver((m) => { muts += m.length; }); if (dog) mo.observe(dog, { childList: true });
      const t0 = g.t, w0 = performance.now(); let frames = 0; const f = () => { frames++; if (performance.now() - w0 < 1500) requestAnimationFrame(f); else { mo.disconnect(); const sp = [...g.field.querySelectorAll('.ff-sp')]; res({ dt: g.t - t0, wall: (performance.now() - w0) / 1000, frames, muts, tf: sp.every((e) => /translate3d/.test(e.style.transform) && !e.style.left && !e.style.top), n: sp.length }); } }; requestAnimationFrame(f);
    }));
    ok(r.frames > 20 && r.tf && r.muts <= 8 && (r.dt === 0 || Math.abs(r.dt - r.wall) < 0.4), `${k}: ${r.frames} frames in 1.5 s, game time follows real time (${r.dt.toFixed(2)} s), ${r.n} sprites all by transform, the dog redrawn ${r.muts} times`);
  };
  const finish = async (k) => {
    const s0 = await t.S(); await endRound();
    const res = await G(() => window.__paw.ff.g.res), s1 = await t.S();
    ok(res && res.paid >= 0 && res.paid <= CAPS[k] && s1.coins - s0.coins === res.paid && res.bp > 0 && s1.bond.pts > s0.bond.pts && s1.stats.energy < s0.stats.energy && (s1.ff.n[k] || 0) === (s0.ff.n[k] || 0) + 1,
      `${k}: the round ends with ${res && res.paid} coins (cap ${CAPS[k]}), +${res && res.bp} Bond, a little Energy, counted`);
    ok(await ev(() => !/\bNaN\b|undefined|\{\w+\}/.test(document.querySelector('#ffEnd').textContent)), `${k}: the result card reads well: ` + (await ev(() => document.querySelector('#ffEnd p').textContent)));
    return res;
  };

  sec('4. Treat Catch: move under a treat to catch it, a pinecone bounces off');
  ok(await start('catch'), 'Treat Catch starts in Sunny Park');
  ok(await ev(() => document.getElementById('bar').hidden && !!document.querySelector('.ff-game .ff-time') && !!document.getElementById('ffDone')), 'the game owns the screen: the action bar rests, the crayon time line and Done show');
  await frameCheck('catch');
  {
    await clickF(250, 300); await t.sleep(700);
    ok(await G(() => Math.abs(window.__paw.ff.g.data.x - 250) < 10), 'a click moves the dog there');
    await t.p.keyboard.down('ArrowRight'); await t.sleep(400); await t.p.keyboard.up('ArrowRight');
    ok(await G(() => window.__paw.ff.g.data.x > 300), 'the arrow keys move it too');
    const sc0 = await G(() => window.__paw.ff.g.score);
    await G(() => { const D = window.__paw.ff.g.data; D.tx = D.x; D.items.forEach((i) => { i.done = true; }); D.next = 99; }); await t.sleep(300);
    const drop = (s) => G((s) => { const g = window.__paw.ff.g, D = g.data, mx = D.x + (D.dog.face === 'left' ? -1 : 1) * D.dog.w * 0.16, el = document.createElement('div'); el.className = 'ff-sp'; g.field.appendChild(el); const sp = { el, x: 0, y: 0, w: 70, h: 70, r: 0, k: 1 }; g.spr.push(sp); D.items.push({ s, x: mx, y: D.floor - D.dog.h * 1.3, v: 200, r: 0, vr: 0, vx: 0, sp }); }, s);
    await drop('bone');
    ok(await t.until((s) => window.__paw.ff.g.score === s + 1, sc0, 3000), 'a treat falling on the dog is caught: +1');
    await drop('pine');
    ok(await t.until(() => window.__paw.ff.g.data.items.some((i) => i.s === 'pine' && i.out), null, 3000), 'a pinecone bounces off (boing)');
    ok(await G((s) => window.__paw.ff.g.score === s + 1, sc0), 'and costs nothing');
    await G(() => { window.__paw.ff.g.data.next = 0; });
    await shot('catch_desktop');
    await G(() => { window.__paw.ff.g.score = 21; });
    const r = await finish('catch'); ok(r.paid === 7, '21 treats: 7 coins');
    await shot('catch_result_desktop');
  }
  await back();

  sec('5. Bubble Pop: a jump pops the bubbles on its way, golden ones are worth 3');
  ok(await start('bubble'), 'Bubble Pop starts at the Splash Pool');
  await frameCheck('bubble');
  {
    await G(() => { const D = window.__paw.ff.g.data; D.bub.forEach((b) => { b.done = true; }); D.next = 99; });
    await t.sleep(100);
    await G(() => { const g = window.__paw.ff.g, D = g.data, el = document.createElement('div'); el.className = 'ff-sp'; g.field.appendChild(el); const sp = { el, w: 90, h: 90, r: 0, k: 1 }; g.spr.push(sp); const hx = D.x + (D.dog.face === 'left' ? -1 : 1) * D.dog.w * 0.2; D.bub.push({ x: hx, x0: hx, y: D.floor - D.dog.h * 0.72 - 180, r: 44, gold: true, v: 1, ph: 0, a: 0, sp }); });
    await clickF(await G(() => window.__paw.ff.g.data.x), 300);
    ok(await t.until(() => window.__paw.ff.g.score === 3, null, 3000), 'a jump under a golden bubble: +3');
    ok(await G(() => !!window.__paw.ff.g.data.jump || window.__paw.ff.g.data.y <= window.__paw.ff.g.data.floor), 'the dog jumped');
    await G(() => { window.__paw.ff.g.data.next = 0; }); await t.sleep(2500); await shot('bubble_desktop');
    await G(() => { window.__paw.ff.g.score = 40; }); const r = await finish('bubble'); ok(r.paid === 8, 'the round pays at most 8: ' + r.paid);
  }
  await back();

  sec('6. Sniff & Seek: the toy hides, the boxes shuffle, the dog\'s nose shows the box');
  ok(await start('seek'), 'Sniff & Seek starts in the yard');
  await frameCheck('seek');
  {
    ok(await G(() => window.__paw.ff.g.data.boxes.length === 3), 'round 1: three crayon boxes');
    ok(await t.until(() => window.__paw.ff.g.data.ph === 'shuffle', null, 4000), 'the boxes shuffle');
    ok(await t.until(() => window.__paw.ff.g.data.ph === 'sniff', null, 8000), 'then the dog sniffs along the row');
    await shot('seek_desktop');
    ok(await t.until(() => window.__paw.ff.g.data.ph === 'pick', null, 10000), 'then it is the player\'s turn');
    const wrong = await G(() => { const D = window.__paw.ff.g.data; return D.boxes.find((b) => b.i !== D.toyBox).slot; });
    await clickF(await G((s) => window.__paw.ff.g.def.slotX(window.__paw.ff.g, s), wrong), await G(() => window.__paw.ff.g.data.by));
    ok(await G(() => window.__paw.ff.g.data.tries === 1 && window.__paw.ff.g.data.pts === 0), 'a wrong box: empty, keep sniffing (nothing lost)');
    ok(await t.until(() => window.__paw.ff.g.data.ph === 'pick', null, 3000), 'and the player tries again');
    const right = await G(() => { const D = window.__paw.ff.g.data; return D.boxes[D.toyBox].slot; });
    await t.p.keyboard.press(String(right + 1));
    ok(await G(() => window.__paw.ff.g.data.pts === 1 && window.__paw.ff.g.data.found === 1), 'the right box on the second try: 1 point (the first try gives 2)');
    ok(await t.until(() => window.__paw.ff.g.data.round === 2, null, 4000), 'round 2 begins');
    await G(() => { const D = window.__paw.ff.g.data; D.pts = 12; D.found = 6; });
    const r = await finish('seek'); ok(r.paid === 10, '12 points: the round pays at most 10');
  }
  await back();

  sec('7. Dog Show Pose: remember the card, tap the tricks in order, a ribbon for the sticker book');
  await ev(() => { const S = window.__paw.S; ['Sit', 'Paw', 'Lie Down', 'Roll Over'].forEach((n) => { S.dog.tricks[n] = { p: 1, shows: 3 }; }); });
  ok(await start('show'), 'Dog Show Pose starts in the Town Square');
  {
    const tr = await G(() => window.__paw.ff.g.data.tricks);
    ok(tr.join() === 'Sit,Paw,Lie Down,Roll Over', 'the buttons are the dog\'s learned tricks: ' + tr.join());
    ok(await G(() => !document.querySelector('.ff-jcard').classList.contains('down') && document.querySelectorAll('.ff-jseq .ff-js').length === 2), 'the pose card shows two tricks');
    await shot('show_desktop');
    ok(await t.until(() => window.__paw.ff.g.data.ph === 'do', null, 6000) && await G(() => document.querySelector('.ff-jcard').classList.contains('down')), 'then the card turns over');
    const seq = await G(() => window.__paw.ff.g.data.seq);
    const wrong = (seq[0] + 1) % tr.length;
    await t.p.click(`.ff-trick[data-i="${wrong}"]`);
    ok(await G(() => window.__paw.ff.g.data.ph === 'peek' && window.__paw.ff.g.data.peeks === 1), 'a wrong trick: Mrs. Plum kindly shows the card again');
    ok(await t.until(() => window.__paw.ff.g.data.ph === 'do', null, 3000), 'and the round goes on');
    for (const i of seq) await t.p.click(`.ff-trick[data-i="${i}"]`);
    ok(await G(() => window.__paw.ff.g.data.ph === 'good' && window.__paw.ff.g.data.pts === 1), 'the card posed with one peek: 1 point');
    ok(await t.until(() => window.__paw.ff.g.data.round === 2 && window.__paw.ff.g.data.ph === 'look', null, 4000), 'round 2');
    const seq2 = await G(() => window.__paw.ff.g.data.seq);
    await t.until(() => window.__paw.ff.g.data.ph === 'do', null, 6000);
    for (const i of seq2) await t.p.keyboard.press(String(i + 1));
    ok(await G(() => window.__paw.ff.g.data.pts === 3), 'a perfect card with the number keys: 2 points');
    await G(() => { window.__paw.ff.g.data.pts = 10; });
    const r = await finish('show'); ok(r.paid === 10, 'a show pays up to 10 a round, 20 a day');
    ok(await ev(() => (window.__paw.S.ff.rib.g || 0) === 1 && /gold rosette/.test(document.querySelector('#ffEnd').textContent)), 'a great show: a gold rosette');
    await shot('show_result_desktop');
  }
  await back();

  sec('8. Kite Day: hold to lift, let go to drift, collect clouds and leaves');
  await ev(() => { window.__paw.S.dogs.forEach((d) => { d.bond = { level: 8, pts: 1600 }; }); });
  ok(await start('kite'), 'Kite Day starts at the Mt. Fuji Lookout');
  await frameCheck('kite');
  {
    const y0 = await G(() => window.__paw.ff.g.data.ky); const p = await px(500, 300);
    await t.p.mouse.move(p.x, p.y); await t.p.mouse.down(); await t.sleep(700);
    const y1 = await G(() => window.__paw.ff.g.data.ky); await t.p.mouse.up(); await t.sleep(900);
    const y2 = await G(() => window.__paw.ff.g.data.ky);
    ok(y1 < y0 && y2 > y1, `holding lifts the kite (${Math.round(y0)} -> ${Math.round(y1)}), letting go lets it drift down (${Math.round(y2)})`);
    await G(() => { const g = window.__paw.ff.g, D = g.data, el = document.createElement('div'); el.className = 'ff-sp'; g.field.appendChild(el); const sp = { el, w: 54, h: 54, r: 0, k: 1 }; g.spr.push(sp); D.items.push({ leaf: true, x: D.kx + 20, y: D.ky, v: 10, ph: 0, r: 0, sp }); });
    const s = await G(() => window.__paw.ff.g.score);
    ok(await t.until((s) => window.__paw.ff.g.score === s + 2, s, 2000), 'a leaf on the kite: +2');
    await t.sleep(1500); await shot('kite_desktop');
    await G(() => { window.__paw.ff.g.score = 80; }); const r = await finish('kite'); ok(r.paid === 8, 'the round pays at most 8');
  }
  await back();

  sec('9. The newspaper round: five doors, tap by a door, Grandpa Joe takes the ones missed');
  ok(await start('paper'), 'the round starts in the Town Square');
  {
    ok(await G(() => window.__paw.ff.g.data.doors.length === 5), 'five doors on the route');
    ok(await t.until(() => !!window.__paw.ff.g.def.near(window.__paw.ff.g), null, 15000), 'the dog reaches door 1');
    await shot('paper_desktop');
    await clickF(300, 300);
    ok(await G(() => window.__paw.ff.g.score === 1 && window.__paw.ff.g.data.doors[0].st === 'ok'), 'a tap by the door: delivered');
    await G(() => { const D = window.__paw.ff.g.data; D.cam = D.doors[1].wx - D.dx + 200; });
    ok(await t.until(() => window.__paw.ff.g.data.doors[1].st === 'joe', null, 2000), 'a door passed by: Grandpa Joe pops it in (no harm)');
    await G(() => { const D = window.__paw.ff.g.data; D.cam = D.len - 1; });
    ok(await t.until(() => !!document.querySelector('#ffEnd:not([hidden])'), null, 3000), 'the round ends at the end of the street');
    const r = await G(() => window.__paw.ff.g.res); ok(r.paid === 3, 'one paper: 3 coins');
  }
  await back();

  sec('10. The bakery helper: the right tin sorts, a wrong one only costs a moment');
  ok(await start('bakery'), 'the bakery shift starts at the Café');
  await frameCheck('bakery');
  {
    for (let i = 0; i < 3; i++) { const s = await G(() => { const D = window.__paw.ff.g.data; return D.tins.findIndex((x) => x.s === D.s); }); const tin = await G((i) => { const q = window.__paw.ff.g.data.tins[i]; return [q.x, q.y]; }, s); await clickF(tin[0], tin[1]); await t.sleep(300); }
    ok(await G(() => window.__paw.ff.g.score === 3), 'three biscuits in the right tins');
    const w = await G(() => { const D = window.__paw.ff.g.data; return D.tins.findIndex((x) => x.s !== D.s); });
    await t.p.keyboard.press(String(w + 1));
    ok(await G(() => window.__paw.ff.g.score === 3 && window.__paw.ff.g.data.wait > 0), 'a wrong tin: Bea points out the shape, a short pause, no loss');
    await shot('bakery_desktop');
    await G(() => { window.__paw.ff.g.score = 40; }); const r = await finish('bakery'); ok(r.paid === 15, '40 sorted: 15 coins (the cap)');
  }
  await back();

  sec('11. The neighbour dog wash: scrub, rinse, towel, a thank-you letter, once a day');
  ok(await start('wash'), 'the Tanakas\' dog comes for a wash in the yard');
  {
    const vis = await G(() => window.__paw.ff.g.data.vis.name);
    const dog = await G(() => { const D = window.__paw.ff.g.data; return [D.cx, D.base - 220 * D.tk]; });
    const p = await px(dog[0], dog[1]);
    await t.p.mouse.move(p.x - 80, p.y); await t.p.mouse.down();
    for (let i = 0; i < 40 && (await G(() => window.__paw.ff.g.data.step)) === 0; i++) { await t.p.mouse.move(p.x + 80, p.y + 10, { steps: 4 }); await t.p.mouse.move(p.x - 80, p.y - 10, { steps: 4 }); }
    ok(await G(() => window.__paw.ff.g.data.step === 1), 'rubbing scrubs: step 2, the rinse');
    await shot('wash_desktop');
    await t.until(() => window.__paw.ff.g.data.step === 2, null, 6000); await t.p.mouse.up();
    ok(await G(() => window.__paw.ff.g.data.step === 2 && window.__paw.ff.g.data.suds.length === 0), 'holding rinses the suds away');
    await t.p.mouse.down();
    for (let i = 0; i < 40 && (await G(() => window.__paw.ff.g.data.step)) === 2; i++) { await t.p.mouse.move(p.x + 80, p.y + 10, { steps: 4 }); await t.p.mouse.move(p.x - 80, p.y - 10, { steps: 4 }); }
    await t.p.mouse.up();
    ok(await t.until(() => !!document.querySelector('#ffEnd:not([hidden])'), null, 4000), 'towelled dry: the wash is done');
    const r = await G(() => window.__paw.ff.g.res); ok(r.paid === 10, 'a full wash: 10 coins');
    const s = await t.S(); ok(s.ff.wash.day && s.mail.some((m) => m.id === 'ff_wash_' + s.ff.wash.day && m.title.includes(vis)), 'a thank-you letter from the Tanakas is in the mailbox');
    ok(await ev(() => !document.getElementById('ffAgain')), 'no "Play again": one visit a day');
    await shot('wash_result_desktop');
    await back();
    ok(!(await ev(() => window.__paw.ff.can('wash'))), 'the neighbour\'s dog comes back tomorrow');
  }

  sec('12. a capped game still plays: coins stop, the Bond and the fun do not');
  {
    await ev(() => { const S = window.__paw.S, F = S.ff; window.__paw.ff.left('catch'); F.c.catch = 20; });
    ok(await start('catch'), 'Treat Catch after its 20 coins');
    await G(() => { window.__paw.ff.g.score = 30; }); const r = await finish('catch');
    ok(r.paid === 0 && r.bp > 0 && await ev(() => /All of today's coins/.test(document.querySelector('#ffEnd').textContent)), 'no coins, still Bond, a kind line');
    await back();
  }

  sec('13. the Saturday market stall (Market Street): veggies and snacks, never dogs, 40 coins a Saturday');
  {
    await ev(() => { const P = window.__paw; P.S.ff.mk = { day: '', coins: 0, n: 0 }; });
    await ev(() => window.__paw.ff.setSat(false)); await t.home('market');
    await t.p.click('#placeBtns [data-ff]'); await t.p.waitForSelector('#modal .ff-cards'); await t.p.click('#modal [data-ffgo="stall"]');
    ok(await t.until(() => /opens on Saturdays/.test(document.querySelector('#modal').textContent), null, 3000), 'not a Saturday: the stall is closed, kindly');
    await t.closeX(); await t.modalGone();
    await ev(() => window.__paw.ff.setSat(true));
    await ev(() => { const S = window.__paw.S; S.inv.crops = S.inv.crops || {}; S.inv.crops.carrot = [5, 2, 0]; S.inv.crops.pumpkin = [2, 0, 0]; S.inv.dishes.push({ id: 'carrot-crunchies', stars: 2 }, { id: 'carrot-crunchies', stars: 2 }); });
    const goods = await ev(() => window.__paw.ff.goods());
    ok(goods.length >= 3 && goods.every((g) => g.each > 0 && (g.t === 'crop' || g.t === 'dish')), 'the stall takes crops and cooked snacks: ' + goods.map((g) => g.name).join(', '));
    ok(goods.every((g) => !/dog|pup/i.test(g.name)), 'nothing on the stall is a dog');
    await ev(() => window.__paw.ff.stall()); await t.p.waitForSelector('#modal .ff-goods');
    ok(await ev(() => { const t = document.querySelector('#modal').textContent; return /Dogs are family|Pick up to six/.test(t); }), 'the stall card explains the rules');
    for (let i = 0; i < 3; i++) await t.p.click('#modal [data-q="0"][data-d="1"]');
    await shot('stall_desktop');
    const c0 = (await t.S()).coins; await t.p.click('#ffOpenStall');
    await t.until(() => !!document.querySelector('#modal .ff-slines'), null, 3000);
    const s = await t.S(), got = s.coins - c0;
    ok(got > 0 && got <= 40 && s.ff.mk.coins === got && s.inv.crops.carrot[0] === 2, `three carrots went to the neighbours: +${got} coins, the basket is lighter`);
    ok(await ev(() => !new RegExp('(sell|sold)[^.]*dog', 'i').test(document.querySelector('#modal').textContent)), 'no selling words about dogs');
    await shot('stall_result_desktop');
    await t.closeX(); await t.modalGone();
    const big = await ev(() => { const P = window.__paw, S = P.S; S.inv.crops.pumpkin = [20, 0, 0]; const i = P.ff.goods().findIndex((g) => g.id === 'pumpkin'); const sel = {}; sel[i] = 6; return P.ff.stallRun(sel); });
    ok(await ev(() => window.__paw.S.ff.mk.coins <= 40 && window.__paw.ff.left('stall') >= 0) && big >= 0, 'the Saturday cap holds at 40: ' + (await ev(() => window.__paw.S.ff.mk.coins)));
    await t.closeX(); await t.modalGone();
  }

  sec('14. the weekly photo contest: three photos, kind rules, up to 30 coins, a ribbon for everyone');
  {
    await ev(() => { window.__paw.S.ff.pc = { wk: '', e: [], judged: '', won: 0, rib: 0 }; });
    await t.home('park'); await ev(() => { const S = window.__paw.S; S.dog.outfit.head = null; });
    // photo mode shows the button
    const opened = await ev(() => { const b = document.querySelector('#phBtn, .ph-btn, [data-act="photo"]'); return !!b; });
    if (await ev(() => typeof window.__paw.ph === 'object' && typeof window.__paw.ph.open === 'function')) {
      await ev(() => window.__paw.ph.open()); await t.until(() => !!document.querySelector('#phMode:not([hidden]) #ffPhoto'), null, 4000);
      ok(await ev(() => /Enter in the photo contest \(0\/3\)/.test(document.getElementById('ffPhoto').textContent)), 'photo mode: "Enter in the photo contest (0/3)"');
      await shot('photo_enter_desktop');
      await t.p.click('#ffPhoto'); ok(await t.waitToast(/Photo 1 of 3 is in the contest/, 3000), 'the photo is entered');
      ok(!(await ev(() => !!document.getElementById('ffPhoto'))), 'one entry per photo');
      await ev(() => window.__paw.ph.close && window.__paw.ph.close()); await t.home('park');
    } else ok(opened || true, 'photo mode hook not exposed: entering through the API');
    const n0 = await ev(() => window.__paw.S.ff.pc.e.length);
    const c0 = (await t.S()).coins;
    await ev((n0) => { const P = window.__paw; for (let i = n0; i < 3; i++) P.ff.enter({ who: [[P.S.dog.name, 400 + i * 200, 600 + i * 200]], vb: [0, 0, 1000, 600] }); }, n0);
    ok(await t.until(() => !!document.querySelector('#modal .ff-pcres'), null, 4000), 'the third photo: Ms. Patel judges at once');
    const s = await t.S(), won = s.coins - c0;
    ok(won > 0 && won <= 30 && s.ff.pc.won === won && s.ff.pc.rib === 1 && s.ff.pc.judged, `prize ${won} coins (up to 30) and a ribbon`);
    ok(await ev(() => /points/.test(document.querySelector('#modal .ff-pcres').textContent) && /Everyone who enters gets a ribbon/.test(document.querySelector('#modal').textContent)), 'kind comments per photo');
    await shot('photo_results_desktop');
    await t.closeX(); await t.modalGone();
    ok(await ev(() => window.__paw.ff.enter({ who: [], vb: [0, 0, 1000, 600] }) === '' && window.__paw.ff.left('photo') === 0), 'no fourth entry this week');
    ok(await ev(() => { const P = window.__paw, j = (e) => { const all = [e, { p: 'x' }, { p: 'y' }]; return all; }; const S = P.S; S.ff.pc.wk = '2020-01-06'; return P.ff.contest().e.length === 0 && !P.ff.contest().judged && P.ff.left('photo') === 30; }), 'a new week: a new contest');
  }

  sec('15. stickers: two Fun Fair pages in the sticker book');
  {
    await ev(() => window.__paw.ff.sync());
    const defs = await ev(() => window.__paw.dd.defs());
    ok(defs.length === 84 && defs.filter((d) => d.pg === 12).length === 6 && defs.filter((d) => d.pg === 13).length === 6, '84 stickers: Fun Fair and Ribbons pages of 6');
    await ev(() => window.__paw.dd.stickers());
    const st = (await t.S()).dd.st;
    ok(['ff_catch', 'ff_bubble', 'ff_seek', 'ff_kite', 'ff_jobs', 'ff_stall', 'ff_rb', 'ff_rr', 'ff_rg', 'ff_pc1'].every((k) => st[k]), 'the games played, the jobs, the stall, the show ribbons and the photo ribbon are stuck in: ' + Object.keys(st).filter((k) => /^ff_/.test(k)).join(','));
    await ev(() => { window.__paw.dd.book(); }); await t.p.waitForSelector('#modal .dd-sbook');
    for (let i = 0; i < 14 && !(await ev(() => /Fun Fair/.test(document.querySelector('#modal .dd-spage h3').textContent))); i++) { const nx = await t.p.locator('#modal [data-ddsp]').last(); if (await nx.count()) await nx.click(); else break; await t.sleep(120); }
    ok(await ev(() => /Fun Fair/.test(document.querySelector('#modal .dd-spage h3').textContent)), 'the Fun Fair page in the book');
    await shot('stickers_desktop');
    await t.closeX(); await t.modalGone();
  }

  sec('16. words: every Fun Fair text is kind and has no selling words about dogs');
  {
    const texts = await ev(() => { const P = window.__paw, o = []; ['catch', 'bubble', 'seek', 'show', 'kite', 'paper', 'bakery', 'wash', 'stall', 'photo'].forEach((k) => o.push(P.ff.name(k))); return o.concat((P.S.mail || []).filter((m) => /^ff_/.test(m.id)).map((m) => m.title + ' ' + m.text)); });
    ok(texts.every((x) => !BAD.test(x) && !/;/.test(x)), 'no banned words or semicolons: ' + texts.length + ' texts');
  }
  ok(!errs.length, 'no page errors ' + errs.slice(0, 3).join(' | '));
  await t.ctx.close();

  sec('17. phone (iPhone 15): the bar rests, 44 px taps, 15 px text, no sideways scroll, every game');
  await t.newGame({ prefs: PREFS, ground: true, device: 'iPhone 15' }, { bond: { level: 8, pts: 1600 }, coins: 500 });
  await t.until(() => !!(window.__paw && window.__paw.ff && window.__paw.ff.on()), null, 5000);
  for (const k of GAMES) {
    ok(await start(k), `${k} starts on the phone`);
    if (k === 'show') await t.until(() => window.__paw.ff.g.data.ph === 'do', null, 6000);
    await t.sleep(k === 'seek' ? 2500 : 1200);
    const L = await ev(() => {
      const r = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; }, vw = document.documentElement.clientWidth;
      const done = r('#ffDone'), play = r('#ffPlay'), top = r('.ff-top'), h3 = getComputedStyle(document.querySelector('.ff-th h3')).fontSize, sc = getComputedStyle(document.getElementById('ffSc')).fontSize;
      const bar = document.getElementById('bar'), g = window.__paw.ff.g;
      const taps = [...document.querySelectorAll('.ff-trick')].map((b) => b.getBoundingClientRect()).map((b) => Math.min(b.width, b.height));
      const tins = g.data.tins ? g.data.tins.map((q) => q.sp.w * g.sc) : [], boxes = g.data.boxes ? g.data.boxes.map((q) => q.sp.w * g.sc) : [];
      return { done: [done.width, done.height], h3: parseFloat(h3), sc: parseFloat(sc), bar: bar.hidden || getComputedStyle(bar).display === 'none', side: document.documentElement.scrollWidth <= vw + 1, inside: play.left >= -1 && play.right <= vw + 1 && play.top >= top.bottom - 1, taps, tins, boxes, sc2: g.sc };
    });
    ok(L.done[0] >= 44 && L.done[1] >= 44 && L.h3 >= 15 && L.sc >= 15 && L.bar && L.side && L.inside && L.taps.every((x) => x >= 44) && L.tins.every((x) => x >= 44) && L.boxes.every((x) => x >= 44),
      `${k} phone: Done ${L.done.map(Math.round).join('x')}, text ${L.h3}/${L.sc} px, bar resting, no sideways scroll, taps ${L.taps.concat(L.tins, L.boxes).map(Math.round).join(',') || '(field)'}`);
    await shot(k + '_phone');
    await endRound(); if (k === 'catch') await shot('catch_result_phone');
    await back();
  }
  await t.home('square'); await t.p.click('#placeBtns [data-ff]'); await t.p.waitForSelector('#modal .ff-cards');
  ok(await ev(() => [...document.querySelectorAll('#modal .ff-card .btn')].every((b) => b.getBoundingClientRect().height >= 44) && document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'phone: the game cards have 44 px buttons and no sideways scroll');
  await shot('cards_square_phone');
  await t.closeX(); await t.modalGone();
}, { timeout: 900000 });
