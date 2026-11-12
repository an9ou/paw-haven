// v2.25 "Glad you're back" (V225.md, game/src/53_welcome.js):
//   1. migration: an old save loads with the v2.25 defaults, v stays 1, nothing dropped; the day count starts from what the save proves
//   2. While you were out: 4+ real hours away opens the diary page on a calm yard (2-3 lines, the dog's name), a short absence keeps the toast;
//      a pending page survives a reload; it waits for the What's new sheet
//   3. the gift: once a Japan day, coins rare and at most 30, treats dog-safe
//   4. the welcome-back letter after 3+ days: once per return, 100 coins and a treat bag; the clock turned back brings nothing
//   5. days played: distinct Japan days, never down; the 7/30/100/365 gifts once each; the calendar line; the photo frame
//   6. the tomorrow line: once a Japan day after the day's last daily task
//   7. phone 360x640 and desktop: the sheet fits (screenshots: V225_SHOTS=<dir>, else test_logs/)
// node game/run_tests.js v225_welcome
const { run, URL } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path');
devices['Phone 360x640'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 } });
const SAVE = 'pawhaven_proto_v1', SHOTS = process.env.V225_SHOTS || path.join(__dirname, 'test_logs');
const ON = { wbTest: true, msTest: true };

run('v225_welcome', async (t) => {
  const { ok, sec, ev } = t;
  const wbShown = () => ev(() => !!document.querySelector('#modal:not([hidden]) .wb-pop'));
  const waitWb = (ms) => t.until(() => !!document.querySelector('#modal:not([hidden]) .wb-pop'), null, ms || 9000);
  const noWb = async (ms) => { const w0 = Date.now(); while (Date.now() - w0 < ms) { if (await wbShown()) return false; await t.sleep(250); } return true; };
  const closeWb = async () => { await t.p.click('#wbOk'); await t.modalGone(); };
  const goneAway = (ms) => ev((ms) => { const P = window.__paw, S = P.S; S.lastReal = Date.now() - ms; S.lastSeenAt = Date.now() - ms; P.rh.away(); return { pend: S.wbPend, seen: S.lastSeenAt }; }, ms);

  sec('1. migration: an old save gets the v2.25 fields; the day count starts from what it proves');
  await t.newGame({ prefs: ON });
  ok(await t.until(() => !!(window.__paw && window.__paw.wb), null, 5000), 'the hook is there');
  await t.until(() => window.__paw.S.daysPlayed === 1, null, 4000);
  const fresh = await ev(() => { const S = window.__paw.S; return { n: S.daysPlayed, last: S.daysLastISO, seen: S.lastSeenAt, g: S.daysGifts, jst: window.__paw.rh.jst() }; });
  ok(fresh.n === 1 && fresh.last === fresh.jst && fresh.seen > 0 && Array.isArray(fresh.g) && !fresh.g.length, `a new save: day 1 today, a last-seen stamp, no gifts yet (${JSON.stringify(fresh)})`);
  const mg = await ev(() => {
    const W = window.__paw.wb, j = window.__paw.rh.jst();
    const a = W.fields({ v: 1 }, false);
    const b = W.fields({ v: 1, dd: { diary: [{ j: '2026-10-01' }, { d: '2026-10-02' }, { j: '2026-10-02' }, { j: '2026-10-05' }, { j: '2099-01-01' }] }, fw: { wel: { days: ['2026-10-01', '2026-10-06'] }, cal: { ym: '2026-11', days: [1, 2] } } }, false);
    const c = W.fields({ v: 1, fw: { cal: { ym: '2026-11', days: [1, 2, 3, 4, 5, 6, 7, 8] } }, missions: { pouch: { c: 3, day: '' } } }, false);
    const d = W.fields({ v: 1, missions: { pouch: { c: 9, day: j } } }, false);
    const e = W.fields({ v: 1, daysPlayed: 50, daysLastISO: '2026-11-01', daysGifts: [7, 30], awayGiftISO: '2026-11-02' }, false);
    return { a, b: b.daysPlayed, c: c.daysPlayed, d: [d.daysPlayed, d.daysLastISO === j], e: [e.daysPlayed, e.daysLastISO, e.daysGifts.join(), e.awayGiftISO] };
  });
  ok(mg.a.v === 1 && mg.a.daysPlayed === 0 && mg.a.daysLastISO === '' && mg.a.lastSeenAt === 0 && mg.a.awayGiftISO === '' && mg.a.backISO === '' && mg.a.tmrwISO === '' && Array.isArray(mg.a.daysGifts) && mg.a.wbPend === null, 'an empty old save: 0 days (today makes 1), every default, v 1: ' + JSON.stringify(mg.a));
  ok(mg.b === 4, 'diary pages and welcome-week days count as distinct dates, a future date never counts: ' + mg.b);
  ok(mg.c === 8, "this month's calendar paws are a floor: " + mg.c);
  ok(mg.d[0] === 9 && mg.d[1], "Gerald's pouches count (one a Japan day), and today's pouch marks today as counted: " + mg.d);
  ok(mg.e.join('|') === '50|2026-11-01|7,30|2026-11-02', 'existing v2.25 fields are kept as they are: ' + mg.e.join('|'));
  // a real old save through the title screen
  const base = await ev((k) => { const P = window.__paw; P.S.coins = 777; P.saveNow(); const s = JSON.parse(localStorage.getItem(k)); ['daysPlayed', 'daysLastISO', 'lastSeenAt', 'awayGiftISO', 'backISO', 'tmrwISO', 'daysGifts', 'wbPend'].forEach((f) => delete s[f]); s.fw.cal.days = [1, 2, 3]; s.fw.cal.ym = '2026-10'; return s; }, SAVE);
  ok(!('daysPlayed' in base) && !('lastSeenAt' in base), 'the base save has no v2.25 fields');
  { const was = t.ctx; await t.mk({ storage: { [SAVE]: JSON.stringify(base) }, prefs: ON }); await was.close(); }
  await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu();
  const m1 = await ev(() => { const S = JSON.parse(JSON.stringify(window.__paw.S)); return { keys: Object.keys(S), v: S.v, coins: S.coins, n: S.daysPlayed, seen: S.lastSeenAt, g: S.daysGifts }; });
  const lost = Object.keys(base).filter((k) => !m1.keys.includes(k));
  ok(m1.v === 1 && !lost.length && m1.coins === 777, 'v stays 1, no field dropped, coins as they were' + (lost.length ? ': ' + lost.join(' ') : ''));
  ok(m1.n >= 3 && m1.n <= 4 && m1.seen > 0 && Array.isArray(m1.g), `it plays on with ${m1.n} days played (3 paws last month, plus today) and a last-seen stamp`);

  sec('2. While you were out: 4+ real hours away opens the diary page; a short absence keeps the toast');
  await ev(() => { const S = window.__paw.S; S.awayGiftISO = ''; S.newsSeen = window.__paw.nw.latest(); });
  let r = await goneAway(1 * 3600e3);
  ok(!r.pend, 'one hour away: no page');
  ok(await t.waitToast(/While you were away, .+ napped/), 'the old "napped for N game hours" toast for a short absence');
  ok(await noWb(4000), 'and no page opens');
  r = await goneAway(5 * 3600e3);
  ok(r.pend && r.pend.h === 5, 'five hours away: the page is due (h 5): ' + JSON.stringify(r.pend));
  ok(await waitWb(9000), 'the page opens on the calm yard');
  const pg = await ev(() => { const P = window.__paw, n = P.S.dog.name, ls = [...document.querySelectorAll('#modal .wb-page .dd-ptext p')].map((p) => p.textContent);
    return { n, ls, head: !!document.querySelector('#modal .wb-page .dd-dhead svg'), away: (document.querySelector('#modal .wb-page .dd-pt .small') || {}).textContent, gift: (document.querySelector('#modal .wb-gift') || {}).textContent || '', ok: (document.getElementById('wbOk') || {}).textContent, pend: P.S.wbPend, giftDay: P.S.awayGiftISO, jst: P.rh.jst() }; });
  ok(pg.ls.length === 2 && pg.ls.every((l) => l.includes(pg.n)) && new Set(pg.ls).size === 2, 'two different lines with the dog\'s name: ' + pg.ls.join(' / '));
  ok(pg.head && /away for 5 hours/.test(pg.away), 'the dog\'s crayon head and "You were away for 5 hours": ' + pg.away);
  ok(pg.gift.length > 0 && pg.giftDay === pg.jst && pg.pend === null, 'a little gift today, S.awayGiftISO is today, the page is no longer pending: ' + pg.gift);
  ok(pg.ok === `Hello, ${pg.n}!`, 'the button says "Hello, <name>!"');
  const same = await ev(() => { const W = window.__paw.wb; return [W.lines({ at: 123, h: 13 }), W.lines({ at: 123, h: 13 }), W.lines({ at: 456, h: 13 })]; });
  ok(same[0].length === 3 && same[0].join() === same[1].join() && same[0].join() !== same[2].join(), '12+ hours: three lines, the same for the same return, others for another');
  await closeWb(); ok(await noWb(3500), 'closed, it stays closed');
  r = await goneAway(6 * 3600e3); ok(await waitWb(9000), 'another long absence the same day: the page again');
  ok(!(await ev(() => !!document.querySelector('#modal .wb-gift'))), 'but no second gift the same Japan day');
  await closeWb();
  // a pending page survives a reload
  await ev(() => { const P = window.__paw; P.S.wbPend = { at: 42, h: 30 }; P.saveNow(); });
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm();
  ok(await waitWb(10000), 'a page still pending at a reload opens after it');
  ok(await ev(() => /away for 30 hours/.test(document.querySelector('#modal .wb-page .dd-pt .small').textContent)), '"You were away for 30 hours"');
  await closeWb();
  // it waits for the What's new sheet
  await ev(() => { const P = window.__paw; P.nw.test(true); P.S.newsSeen = ''; P.S.lastReal = Date.now() - 5 * 3600e3; P.S.lastSeenAt = P.S.lastReal; P.rh.away(); });
  ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .nw-pop'), null, 9000), "the What's new sheet goes first");
  ok(!(await wbShown()), 'the page is not on top of it');
  await t.p.click('#nwOk'); await t.modalGone();
  ok(await waitWb(9000), 'then the page comes');
  await closeWb(); await ev(() => window.__paw.nw.test(false));

  sec('3. the gift: dog-safe, coins rare and at most 30');
  const gp = await ev(() => { const W = window.__paw.wb, out = []; const d0 = new Date('2026-01-01T00:00:00Z'); for (let i = 0; i < 365; i++) { const d = new Date(d0.getTime() + i * 864e5).toISOString().slice(0, 10); out.push(W.pick(d)); } return out; });
  const coins = gp.filter((g) => g.t === 'coins'), safe = ['Bone-shaped Biscuit', 'Carrot Sticks', 'Blueberry Bites', 'Apple Slices'];
  ok(coins.length > 0 && coins.length / gp.length < 0.2 && coins.every((g) => g.c > 0 && g.c <= 30), `coins on ${coins.length} of 365 days, each 10-30`);
  ok(gp.filter((g) => g.t === 'food').every((g) => safe.includes(g.n) && g.q === 2), 'treats are the calendar\'s dog-safe snacks');
  ok(gp.every((g) => ['coins', 'food', 'toy'].includes(g.t)), 'only coins, a treat or a toy');
  const once = await ev(() => { const P = window.__paw, W = P.wb; P.S.awayGiftISO = ''; const a = W.gift(), b = W.gift(); P.S.awayGiftISO = '2099-01-01'; const c = W.gift(); return [!!a, b, c]; });
  ok(once[0] && once[1] === null && once[2] === null, 'one gift a Japan day; a later date already stamped (a clock turned back) gives none');

  sec('4. the welcome-back letter after 3+ days: once per return');
  const mailN = () => ev(() => window.__paw.S.mail.filter((m) => /^wb_back_/.test(m.id)).length);
  await ev(() => { const S = window.__paw.S; S.backISO = ''; S.awayGiftISO = window.__paw.rh.jst(); S.mail = S.mail.filter((m) => !/^wb_back_/.test(m.id)); });
  await goneAway(2 * 864e5); ok((await mailN()) === 0, 'two days away: no letter'); await waitWb(9000); await closeWb();
  await goneAway(3.2 * 864e5);
  const L = await ev(() => { const m = window.__paw.S.mail.find((x) => /^wb_back_/.test(x.id)); return m && { title: m.title, from: m.from, gift: m.gift, text: m.text }; });
  ok(L && L.title === 'We kept your spot warm' && L.from === 'Gerald' && L.gift.coins === 100 && L.gift.bag === true, 'three days away: Gerald\'s letter "We kept your spot warm" with 100 coins and a treat bag');
  ok(await waitWb(9000) && await ev(() => /away for 3 days/.test(document.querySelector('#modal .wb-page .dd-pt .small').textContent)), 'and the page says "You were away for 3 days"');
  await closeWb();
  await goneAway(4 * 864e5); ok((await mailN()) === 1, 'another 3+ day return the same Japan day: still one letter'); await waitWb(9000); await closeWb();
  // the clock turned back: the high-water mark is in the future, so "away" is negative
  const back = await ev(() => { const P = window.__paw, S = P.S; S.backISO = ''; S.wbPend = null; S.lastSeenAt = Date.now() + 10 * 864e5; S.lastReal = Date.now() - 5 * 864e5; P.rh.away(); return { pend: S.wbPend, n: S.mail.filter((m) => /^wb_back_/.test(m.id)).length }; });
  ok(!back.pend && back.n === 1, 'after a clock turned forward and back: no page and no letter');
  await ev(() => { window.__paw.S.lastSeenAt = Date.now(); });
  const col = await ev(() => { const P = window.__paw, S = P.S, m = S.mail.find((x) => /^wb_back_/.test(x.id)), c0 = S.coins, f0 = S.inv.food['Bone-shaped Biscuit'] || 0; const txt = P.mbCollect([m.id]); return { dc: S.coins - c0, df: (S.inv.food['Bone-shaped Biscuit'] || 0) - f0, txt, again: P.mbCollect([m.id]) }; });
  ok(col.dc === 100 && col.df === 3 && /100 coins/.test(col.txt) && /treat bag/.test(col.txt) && col.again === '', 'Collect: +100 coins and the treat bag (3 biscuits ...), once: ' + col.txt);

  sec('5. days played: distinct Japan days, never down; the gifts at 7, 30, 100 and 365 once each');
  const dp = await ev(() => {
    const P = window.__paw, S = P.S, W = P.wb, R = Date.now, out = {};
    try {
      S.daysPlayed = 4; S.daysLastISO = '2026-11-01'; S.daysGifts = [];
      Date.now = () => Date.UTC(2026, 10, 2, 3); out.a = W.days(); out.a2 = W.days(); // the same Japan day twice
      Date.now = () => Date.UTC(2026, 10, 2, 14, 59); out.b = W.days(); // still 2 Nov in Japan
      Date.now = () => Date.UTC(2026, 10, 2, 15, 1); out.c = W.days(); // 3 Nov in Japan
      Date.now = () => Date.UTC(2026, 10, 1, 12); out.d = W.days(); // the clock turned back
      out.n = S.daysPlayed; out.last = S.daysLastISO;
    } finally { Date.now = R; }
    return out;
  });
  ok(dp.a === true && dp.a2 === false && dp.b === false && dp.c === true && dp.d === false && dp.n === 6 && dp.last === '2026-11-03', `4 -> 6 over two Japan days; the same day and a clock turned back add nothing (${JSON.stringify(dp)})`);
  const mile = await ev(() => {
    const P = window.__paw, S = P.S, W = P.wb, j = P.rh.jst(), y = new Date(Date.now() + 9 * 3600e3 - 864e5).toISOString().slice(0, 10);
    S.mail = S.mail.filter((m) => !/^wb_days_/.test(m.id));
    S.daysPlayed = 6; S.daysLastISO = y; S.daysGifts = []; const n7 = W.days() && S.daysPlayed, g7 = W.mile(), again = W.mile(), fr = W.frames().map((f) => f.k);
    const dec = W.mileGift(30); S.daysPlayed = 30; const g30 = W.mile(); const decOk = dec.t === 'decor' ? !!(S.decor && S.decor[dec.n]) : dec.t === 'bag';
    const wear = W.mileGift(100); S.daysPlayed = 100; const g100 = W.mile(); const wearOk = wear.t === 'cloth' ? S.inv.clothes.includes(wear.n) : wear.t === 'bag';
    const gb0 = S.inv.food['Golden Bone'] || 0; S.daysPlayed = 365; const g365 = W.mile(); const gb = (S.inv.food['Golden Bone'] || 0) - gb0;
    const letters = S.mail.filter((m) => /^wb_days_/.test(m.id)).map((m) => m.id + ':' + (m.keep ? 'keep' : ''));
    return { n7, g7, again, fr, dec, decOk, wear, wearOk, g30, g100, g365, gb, gifts: S.daysGifts.slice(), frames: W.frames().map((f) => f.k + '=' + f.n), letters, cal: W.cal() };
  });
  ok(mile.n7 === 7 && mile.g7.join() === '7' && mile.again.length === 0, 'day 7: the 7-day gift once');
  ok(mile.fr.includes('wb7'), 'a photo frame "7 days together" in photo mode: ' + mile.frames.join(', '));
  ok(mile.g30.join() === '30' && mile.decOk, '30 days: a yard decoration (' + JSON.stringify(mile.dec) + ')');
  ok(mile.g100.join() === '100' && mile.wearOk, '100 days: a costume (' + JSON.stringify(mile.wear) + ')');
  ok(mile.g365.join() === '365' && mile.gb === 1 && mile.frames.some((f) => /^wb365=A whole year together/.test(f)), '365 days: a Golden Bone and the golden year frame');
  ok(mile.gifts.join() === '7,30,100,365' && mile.letters.length === 4 && mile.letters.every((l) => /keep$/.test(l)), 'each once, each with a letter from Gerald to keep: ' + mile.letters.join(' '));
  ok(/365 days played, ever/.test(mile.cal) && /Every days-played gift is yours/.test(mile.cal), 'the calendar line: "365 days played, ever"');
  ok(await t.waitToast(/^7 days played! A gift from Gerald: A photo frame: 7 days together\.$/), 'toast "7 days played! A gift from Gerald: ..."');
  await ev(() => { const P = window.__paw; P.fw.test(true); P.S.daysPlayed = 12; P.fw.open(false); });
  ok(await t.until(() => { const e = document.querySelector('#modal .fw-monp .wb-life'); return !!e && /12 days played, ever/.test(e.textContent) && /Next gift from Gerald at 30 days/.test(e.textContent); }, null, 4000), 'the monthly calendar shows "12 days played, ever" and the next gift at 30');
  await t.closeX(); await t.modalGone(); await ev(() => window.__paw.fw.test(false));

  sec('6. the tomorrow line: once a Japan day, after the last daily task');
  const tm0 = await ev(() => { const P = window.__paw, S = P.S; S.tmrwISO = ''; S.missions.pouch.day = ''; P.wb.doneAt(0); return P.wb.done(); });
  ok(tm0 === false, 'the pouch not opened: the day is not done');
  await t.sleep(1500); ok(await ev(() => window.__paw.S.tmrwISO === ''), 'no line yet');
  await ev(() => { const P = window.__paw; P.S.missions.pouch.day = P.rh.jst(); window.__toasts.length = 0; });
  ok(await ev(() => window.__paw.wb.done()), "Gerald's pouch is open: all three are done");
  ok(await t.until(() => window.__paw.S.tmrwISO === window.__paw.rh.jst(), null, 10000), 'a few seconds later the line is shown, S.tmrwISO is today');
  const tl = await ev(() => window.__toasts.slice());
  ok(tl.length >= 1 && /tomorrow|Tomorrow|Saturday/.test(tl[tl.length - 1]), 'a gentle toast about tomorrow: ' + tl[tl.length - 1]);
  await ev(() => { window.__toasts.length = 0; window.__paw.wb.doneAt(0); }); await t.sleep(8000);
  ok(await ev(() => !window.__toasts.some((x) => /tomorrow|Tomorrow|Saturday/.test(x))), 'not again the same day');
  const crop = await ev(() => { const S = window.__paw.S, pl = S.garden.plots[0], keep = JSON.stringify(pl); Object.assign(pl, { crop: 'carrot', g: 0.95, ready: null }); const t1 = window.__paw.wb.tmrwText(); Object.assign(pl, JSON.parse(keep)); return t1; });
  ok(/Tomorrow: the carrots should be ready to pick\./.test(crop), 'with a crop due within a day: ' + crop);
  await t.ctx.close();

  sec('6b. v2.26 visitors on the page: listed once, the order of events does not matter, none = unchanged');
  await t.newGame({ prefs: ON });
  const vp = await ev(() => {
    const P = window.__paw, S = P.S, ids = P.yv.dogs.slice(0, 5).map((v) => v.id), now = Date.now();
    S.awayGiftISO = '';
    S.visitors.log = ids.slice(0, 4).map((id, i) => ({ id, t: now - (5 - i) * 600e3, toy: '', g: i === 0 ? 'flower' : '' }));
    S.wbPend = { at: now, h: 5 }; return { n: S.visitors.log.length };
  });
  ok(await waitWb(10000), 'the page opens with visitors in the log'); await t.sleep(400);
  const v1 = await ev(() => ({ head: (document.querySelector('#modal .wb-vis b') || {}).textContent, rows: document.querySelectorAll('#modal .wb-vis p').length, txt: (document.querySelector('#modal .wb-vis') || {}).textContent || '', seen: window.__paw.S.wbVisSeen }));
  ok(v1.head === 'Visitors came by' && v1.rows === 4 && /came by/.test(v1.txt) && v1.seen > 0, 'a Visitors came by card: 3 rows and an "and 1 more" row: ' + JSON.stringify(v1));
  await closeWb();
  await ev(() => { window.__paw.S.awayGiftISO = ''; window.__paw.S.wbPend = { at: Date.now(), h: 6 }; });
  ok(await waitWb(10000), 'a second page opens'); await t.sleep(300);
  ok(!(await ev(() => !!document.querySelector('#modal .wb-vis'))), 'the same visitors are never listed twice (and a page with no new visitors has no card)');
  await closeWb();
  await ev(() => { const S = window.__paw.S; S.awayGiftISO = ''; S.visitors.log.push({ id: window.__paw.yv.dogs[5].id, t: Date.now() + 1, toy: '', g: '' }); S.wbPend = { at: Date.now(), h: 6 }; });
  ok(await waitWb(10000), 'a third page opens'); await t.sleep(300);
  const v3 = await ev(() => ({ n: document.querySelectorAll('#modal .wb-vis p').length, txt: (document.querySelector('#modal .wb-vis') || {}).textContent, seen: window.__paw.S.wbVisSeen, log: window.__paw.S.visitors.log.map((e) => e.t) })); ok(v3.n === 1, 'only the visitor who came since is listed ' + JSON.stringify(v3));
  await closeWb(); await t.ctx.close();

  sec('7. it fits: phone 360x640 and desktop 1280x720');
  for (const [dev, name] of [['Phone 360x640', 'phone'], [null, 'desktop']]) {
    await t.newGame(Object.assign({ prefs: ON }, dev ? { device: dev } : {}));
    await ev(() => { const P = window.__paw, S = P.S; S.awayGiftISO = ''; S.wbPend = { at: 777, h: 14 }; if (S.visitors && P.yv) S.visitors.log = P.yv.dogs.slice(0, 4).map((v, i) => ({ id: v.id, t: 777 - 1000 * (i + 1), toy: '', g: i ? '' : 'bone' })); const el = document.getElementById('toasts'); if (el) el.innerHTML = ''; });
    ok(await waitWb(10000), `${name}: the page opens`); await t.sleep(600);
    const Lt = await ev(() => {
      const vw = document.documentElement.clientWidth, vh = window.innerHeight, p = document.querySelector('#modal .panel').getBoundingClientRect(), b = document.getElementById('wbOk').getBoundingClientRect();
      const over = [...document.querySelectorAll('#modal .wb-page p, #modal .wb-gt b, #modal .wb-gt span, #modal .wb-vis p')].filter((e) => e.scrollWidth > e.clientWidth + 1).length;
      const body = document.querySelector('#modal .panel-body'), gift = document.querySelector('#modal .wb-gift').getBoundingClientRect(), page = document.querySelector('#modal .wb-page').getBoundingClientRect();
      return { vw, vh, p: [p.left, p.top, p.right, p.bottom].map(Math.round), b: [b.left, b.top, b.right, b.bottom, b.height].map(Math.round), over, scroll: body.scrollHeight - body.clientHeight, gap: Math.round(gift.top - page.bottom), lines: document.querySelectorAll('#modal .wb-page .dd-ptext p').length };
    });
    ok(Lt.p[0] >= 0 && Lt.p[2] <= Lt.vw && Lt.p[1] >= 0 && Lt.p[3] <= Lt.vh + 1, `${name}: the sheet is inside the screen ${JSON.stringify(Lt.p)} in ${Lt.vw}x${Lt.vh}`);
    ok(Lt.b[4] >= 44 && Lt.b[3] <= Lt.vh && Lt.b[1] >= 0, `${name}: the Hello button is a 44 px tap on screen ${JSON.stringify(Lt.b)}`);
    ok(Lt.over === 0 && Lt.gap >= 0 && Lt.lines === 3, `${name}: three lines, no text runs out of its box, the gift card below the page (scroll ${Lt.scroll})`);
    await ev(() => { const el = document.getElementById('toasts'); if (el) el.innerHTML = ''; }); await t.sleep(200); // a first-day hint toast is not part of the sheet
    await t.p.screenshot({ path: path.join(SHOTS, `v225_welcome_${name}.png`) });
    await closeWb(); if (dev) await t.ctx.close();
  }
});
