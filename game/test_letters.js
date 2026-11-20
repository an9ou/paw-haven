// v2.32 "A letter from your dog" (V232_letters.md 7): the game half, against the real Worker (cloudflare/worker.js on a local D1, game/cloud_mock.js).
//   1. off before the launch: no Settings row, no card, no /letters route asked, nothing in the save
//   2. a guest: the row says letters need an account; no switch, no card
//   3. an email account: the switch (off), the sample letter; on -> pending and one confirmation email; the address says yes -> on; off -> the row is gone
//   4. stopped (a bounce or a complaint): the switch is locked, a kind line
//   5. the offer card: never on day 1, not before Bond 3 or day 7, not over a sheet, once; "No thanks" never again; "Yes, please" asks the Worker
//   6. the save's weekly notes (S.ltr), and the whole way: play -> cloud save -> the Worker's cron -> the letter names the dog and the walk
//   7. an older Worker (404 not_found): the row goes, nothing breaks; the language follows the game
//   8. phone 360x640: the Settings row and the card fit (screenshots: LETTERS_SHOTS or game/test_logs)
// node game/run_tests.js letters
const { run, URL } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path'); const fs = require('fs'); const { makeServer, mockInit } = require('./cloud_mock');
devices['Phone 360x640'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 } });
const AUTH = 'pawhaven_cf_auth', LOGS = path.join(__dirname, 'test_logs');
const SHOTS = process.env.LETTERS_SHOTS || LOGS;

run('letters', async (t) => {
  const { ok, sec, ev } = t;
  fs.mkdirSync(LOGS, { recursive: true }); fs.mkdirSync(SHOTS, { recursive: true });
  const shot = async (n) => { await t.sleep(600); return t.p.screenshot({ path: path.join(SHOTS, 'letters_' + n + '.png') }); };
  const srv = makeServer(), raw = srv.env.DB.raw;
  Object.assign(srv.env, { LETTERS_FROM: '0', LETTERS_KEY: 'game-suite-letters-key-0123456789' });
  const worker = (await import(path.join(__dirname, '..', 'cloudflare', 'worker.js'))).default;
  const api = async (method, p, body, tok) => { const r = await srv.handle(null, method, p, body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body), tok ? 'Bearer ' + tok : null); return { status: r.status, text: r.text, json: srv.json(r.text) }; };
  const cloudPage = async (o) => {
    o = o || {}; const was = t.ctx;
    await t.mk({ device: o.device, storage: o.storage, prefs: o.prefs || {} });
    await t.ctx.exposeBinding('__clSrv', (src, m, u, b, a) => srv.handle(src.page, m, u, b, a));
    await t.ctx.addInitScript(mockInit, {});
    if (was) await was.close();
    await t.p.goto(URL + (o.query || '')); await t.p.waitForSelector('#tGuest, #tNew, #tContinue, #tPlay, [data-ac="guest"]');
  };
  const newHere = async () => {
    await t.until((k) => !localStorage.getItem(k) || !!(window.__pawCloud && window.__pawCloud.CL.started && !window.__pawCloud.CL.startP), AUTH, 8000);
    if (!(await t.p.locator('#tNew, #tPlay').count())) { await t.p.click('[data-ac="guest"]'); await t.p.waitForSelector('#tNew'); }
    await t.adopt({}); await t.calm(); await t.lu();
    await t.until(() => !!(window.__pawCloud.CL.uid && window.__paw && window.__paw.lt), null, 8000);
  };
  const register = async (email) => {
    await t.until(() => !(window.__paw.lt.busy() || (window.__paw.fi && window.__paw.fi.busy && window.__paw.fi.busy())), null, 8000);
    const tok0 = await ev((k) => JSON.parse(localStorage.getItem(k)).token, AUTH);
    const reg = (await api('POST', '/register', { email, password: 'pupper123' }, tok0)).json;
    await ev(([k, r]) => { localStorage.setItem(k, JSON.stringify({ token: r.token })); const C = window.__pawCloud.CL; C.email = r.user.email; C.anon = false; }, [AUTH, reg]);
    return reg;
  };
  const closeAll = () => ev(() => { for (let i = 0; i < 4; i++) { const x = document.querySelector('#modal:not([hidden]) .panel .x'); if (x) x.click(); } });
  const row = (id) => raw.prepare('select * from letters where user_id = ?').get(id);
  const tokOf = (m) => (m.text.match(/[?]t=(v1\.[A-Za-z0-9._-]+)/) || [])[1] || '';
  const settings = async () => { await closeAll(); await ev(() => { window.__paw.lt.settings(); }); await t.until(() => !!document.querySelector('#modal .panel #setMute'), null, 4000); };
  const box = () => ev(() => { const b = document.getElementById('ltBox'); if (!b) return null; const tg = b.querySelector('#ltTog'); return { text: b.innerText, tog: !!tg, on: !!(tg && tg.checked), dis: !!(tg && tg.disabled), again: !!b.querySelector('#ltAgain'), acct: !!b.querySelector('#ltAcct'), stat: (b.querySelector('#ltStat') || {}).textContent || '', msg: (b.querySelector('#ltMsg') || {}).textContent || '' }; });
  const idle = () => t.until(() => !window.__paw.lt.busy(), null, 8000);
  const toasts = () => ev(() => [...document.querySelectorAll('.toast, #toasts > *')].map((e) => e.textContent).join(' | '));
  // the card's own moment, without the 45 s wait: the timing is set to 0, one try, then back
  const tryCard = () => ev(() => { const L = window.__paw.lt; L.timing(0, 0); L.tryNow(); L.timing(45000, 5000); return L.shown(); });

  sec('1. off before the launch');
  await cloudPage({});
  await newHere();
  ok(await ev(() => { const L = window.__paw.lt; return L.from === '' && !L.on() && L.mode() === 'off' && !L.due(); }), 'LT_FROM is empty: off, never due');
  await settings();
  ok((await box()) === null, 'Settings has no letters row');
  await ev(() => { const P = window.__paw; P.lt.note('w', 1); P.lt.look(); P.saveNow(); });
  ok(await ev((k) => window.__paw.S.ltr === undefined && !('ltr' in JSON.parse(localStorage.getItem(k))), 'pawhaven_proto_v1'), 'the save carries nothing of it (no S.ltr, a note is ignored)');
  ok(!(await tryCard()), 'no card');
  ok(srv.count(null, '/letters') === 0, 'no /letters route is asked');
  await closeAll();

  sec('2. a guest (the feature on)');
  const save0 = await ev(() => JSON.stringify(window.__paw.S)), tok0 = await ev((k) => localStorage.getItem(k), AUTH);
  await cloudPage({ prefs: { ltTest: true }, storage: { pawhaven_proto_v1: save0, [AUTH]: tok0 } });
  if (await t.p.locator('#tContinue').count()) await t.p.click('#tContinue');
  await t.calm(); await t.lu();
  await t.until(() => !!(window.__pawCloud && window.__pawCloud.CL.uid && window.__paw && window.__paw.lt), null, 8000);
  ok(await ev(() => window.__paw.lt.on() && window.__paw.lt.mode() === 'guest'), 'on for the test, a guest');
  await settings();
  let b = await box();
  ok(!!b && !b.tog && b.acct && /Letters need an account/.test(b.text) && /once a week, on Sundays/.test(b.text) && /off unless you turn it on/.test(b.text), 'the row says what it is, how often, and that it needs an account: ' + (b && b.text.replace(/\n+/g, ' / ').slice(0, 160)));
  ok(!(await ev(() => window.__paw.lt.due())) && srv.count(null, '/letters') === 0, 'a guest is never offered the card and no route is asked');
  await closeAll();

  sec('3. an email account: off, on, pending, on, off');
  const reg = await register('letters-game@example.com'), uid = reg.user.id;
  await ev(() => window.__paw.lt.poll()); await idle();
  ok(await ev(() => window.__paw.lt.mode() === 'ok' && window.__paw.lt.known() && window.__paw.S.ltr.st === ''), 'the Worker says off');
  await settings();
  b = await box();
  ok(b.tog && !b.on && !b.dis && !b.again && !b.acct && b.stat === '', 'the switch is there and off by default');
  ok(/No ads and no tracking/.test(b.text) && /Stop any time here, or with the link in every letter/.test(b.text), 'the row says: made from the saved game, no ads, no tracking, how to stop');
  await t.p.click('#ltSampleBtn'); await t.until(() => !!document.querySelector('#ltSample .ltr-letter'), null, 3000);
  const name = await ev(() => window.__paw.S.dog.name);
  const sample = await ev(() => document.querySelector('#ltSample').innerText);
  ok(sample.includes('A letter from ' + name) && sample.includes('Dear human,') && sample.includes('It is me, ' + name) && /We are at Bond \d/.test(sample) && sample.includes('Gerald') && /Nothing was sent/.test(sample), 'the sample letter is written from this save, on the device: ' + sample.replace(/\n+/g, ' / ').slice(0, 200));
  ok(srv.mails.length === 0 && !row(uid), 'looking at the sample sends nothing and makes no row');
  await shot('settings_row');
  await t.p.click('#ltSampleBtn');
  await t.p.click('#ltTog'); await idle();
  await t.until(() => !!document.querySelector('#ltAgain'), null, 4000);
  b = await box();
  ok(row(uid) && row(uid).state === 'pending' && row(uid).lang === 'en' && srv.mails.length === 1 && srv.mails[0].to[0] === 'letters-game@example.com', 'the switch on: the Worker keeps a pending row and sends one confirmation email to the account\'s address');
  ok(b.on && b.again && b.stat === 'Almost there. We sent an email to l\u2026@example.com. Tap the button in it to say yes.' && await ev(() => window.__paw.S.ltr.st === 'pending'), 'the row says: almost there, look in your email: ' + b.stat);
  ok(/Check your email and say yes to the letters/.test(await toasts()), 'a toast says to check the email');
  await shot('settings_pending');
  await t.p.click('#ltAgain'); await idle();
  ok(srv.mails.length === 2 && row(uid).state === 'pending', '"Send it again" sends the confirmation once more');
  const conf = await api('POST', '/letters/confirm?t=' + tokOf(srv.mails[1]), '');
  ok(conf.status === 200 && row(uid).state === 'on', 'the button in the email turns it on (the Worker)');
  await settings(); await idle(); await t.until(() => /On\./.test((document.getElementById('ltStat') || {}).textContent || ''), null, 5000);
  b = await box();
  ok(b.on && !b.again && b.stat === 'On. ' + name + ' writes to l\u2026@example.com every Sunday.' && await ev(() => window.__paw.S.ltr.st === 'on'), 'Settings opened again: on, with the address and the day: ' + b.stat);
  await shot('settings_on');
  await t.p.click('#ltTog'); await idle(); await t.until(() => { const g = document.getElementById('ltTog'); return !!g && !g.checked && !g.disabled; }, null, 4000);
  b = await box();
  ok(!row(uid) && !b.on && b.stat === '' && await ev(() => window.__paw.S.ltr.st === '') && /Letters are off/.test(await toasts()), 'the switch off: the row is deleted, a toast says no more emails');
  // offline: a kind line, the switch goes back
  srv.offline.add(t.p); await t.p.click('#ltTog'); await idle(); await t.until(() => !!(document.getElementById('ltMsg') || {}).textContent, null, 4000);
  b = await box(); srv.offline.delete(t.p);
  ok(!b.on && /The post office did not answer/.test(b.msg) && !row(uid), 'offline: "The post office did not answer", the switch stays off');

  sec('4. stopped: letters could not reach the address');
  await api('POST', '/letters', { on: true }, await ev((k) => JSON.parse(localStorage.getItem(k)).token, AUTH));
  raw.prepare("update letters set state = 'stopped' where user_id = ?").run(uid);
  await settings(); await idle(); await t.until(() => { const g = document.getElementById('ltTog'); return !!g && g.disabled; }, null, 5000);
  b = await box();
  ok(b.dis && !b.on && b.stat === 'Letters could not reach l\u2026@example.com, so they are off.', 'the switch is locked and the row says why, kindly: ' + b.stat);
  ok(!(await ev(() => window.__paw.lt.due())), 'no card for a stopped account');
  raw.prepare('delete from letters where user_id = ?').run(uid);
  await ev(() => window.__paw.lt.poll()); await idle(); await closeAll();

  sec('5. the offer card');
  const mails0 = srv.mails.length;
  const state = (days, lv, ask) => ev(([days, lv, ask]) => { const P = window.__paw, S = P.S; S.daysPlayed = days; S.dogs.forEach((d) => { d.bond.level = lv; d.bond.pts = 0; }); S.ltr.ask = ask; S.ltr.st = ''; return P.lt.due(); }, [days, lv, ask]);
  ok(!(await state(1, 9, 0)), 'the first day: never, even at a high Bond');
  ok(!(await state(2, 2, 0)) && !(await state(6, 1, 0)), 'day 2 with Bond 2, day 6 with Bond 1: not yet');
  ok(await state(2, 3, 0), 'day 2 with Bond 3: due');
  ok(await state(7, 1, 0), 'day 7: due');
  ok(!(await state(30, 10, 1)), 'shown before: never again');
  ok(await ev(() => { const P = window.__paw, S = P.S; S.ltr.ask = 0; S.ltr.st = 'on'; const a = P.lt.due(); S.ltr.st = 'pending'; const c = P.lt.due(); S.ltr.st = ''; return !a && !c; }), 'letters already on or pending: no card');
  await state(7, 3, 0);
  await t.until(() => window.__paw.lt.calm(), null, 8000);
  ok(await ev(() => window.__paw.lt.calm()), 'the home yard, nothing open: a calm moment');
  await settings();
  ok(!(await ev(() => window.__paw.lt.calm())) && !(await tryCard()) && await ev(() => window.__paw.S.ltr.ask === 0), 'a sheet is open: no card, and it does not count as shown');
  await closeAll();
  ok(await ev(() => { const L = window.__paw.lt; L.timing(45000, 5000); L.tryNow(); return !L.shown(); }), 'not in the first 45 seconds of the session, and only after 5 calm seconds');
  ok(await tryCard(), 'at a calm moment the card opens');
  await t.until(() => !!document.querySelector('#modal .panel.ltr-pop #ltrYes'), null, 3000);
  const card = await ev(() => { const p = document.querySelector('#modal .panel.ltr-pop'); return { h: p.querySelector('h2').textContent, text: p.innerText, dog: !!p.querySelector('.ltr-dog svg'), env: !!p.querySelector('.ltr-env'), focus: document.activeElement && document.activeElement.tagName }; });
  ok(card.h === 'A letter from ' + name + '?' && /One short letter by email every Sunday/.test(card.text) && /Free\. Off unless you say yes\. You can stop any time\./.test(card.text) && /No thanks/.test(card.text) && /Yes, please/.test(card.text) && card.dog && card.env, 'the card: the dog, an envelope, what and how often, free, both answers: ' + card.h);
  ok(card.focus !== 'BUTTON', 'the focus is not on a button (a key pressed at that moment answers nothing)');
  ok(await ev(() => window.__paw.S.ltr.ask === 1) && await ev((k) => JSON.parse(localStorage.getItem(k)).ltr.ask === 1, 'pawhaven_proto_v1'), 'shown counts at once, and is saved');
  await shot('offer_card');
  await t.p.click('#ltSampleBtn'); await t.until(() => !!document.querySelector('#modal .ltr-pop #ltSample .ltr-letter'), null, 3000);
  ok(await ev(() => document.querySelector('#modal .ltr-pop #ltSample').innerText.includes('Dear human,')), '"What is in a letter?" shows the sample in the card');
  await shot('offer_card_sample');
  await t.p.click('#ltrNo'); await t.modalGone();
  ok(!(await ev(() => window.__paw.lt.due())) && !(await tryCard()) && !row(uid) && srv.mails.length === mails0, '"No thanks": closed, nothing asked, nothing sent, never shown again');
  await ev(() => { window.__paw.S.ltr.ask = 0; });
  ok(await tryCard(), '(a second save\'s first time)'); await t.until(() => !!document.querySelector('#modal .panel.ltr-pop #ltrYes'), null, 3000);
  await t.p.keyboard.press('Escape'); await t.modalGone();
  ok(await ev(() => window.__paw.S.ltr.ask === 1 && !window.__paw.lt.due()), 'closed with Esc: that was the one time too');
  await ev(() => { window.__paw.S.ltr.ask = 0; }); await tryCard(); await t.until(() => !!document.querySelector('#modal .panel.ltr-pop #ltrYes'), null, 3000);
  await t.p.click('#ltrYes'); await idle(); await t.until(() => window.__paw.S.ltr.st === 'pending', null, 5000);
  ok(row(uid) && row(uid).state === 'pending' && srv.mails.length === mails0 + 1 && /Check your email/.test(await toasts()), '"Yes, please": the Worker sends the confirmation email, a toast says to check it');
  await api('POST', '/letters/confirm?t=' + tokOf(srv.mails[srv.mails.length - 1]), '');

  sec('6. the weekly notes, and the whole way to the letter');
  const notes = await ev(() => {
    const P = window.__paw, S = P.S, L = P.lt; S.ltr.ev = []; S.ltr.b = [];
    L.look(); L.look(); L.note('w', 1); L.note('w', 1); L.note('wi', 1); L.note('t', 'Sit'); L.note('t', 'Sit'); L.note('t', ''); L.note('mk', 1); L.note('v', 2);
    const old = new Date(Date.now() + 9 * 3600e3 - 20 * 864e5).toISOString().slice(0, 10); S.ltr.ev.unshift([old, 'w', 5]); S.ltr.b.unshift([old, S.dog.id, 1, 0]); L.note('dg', 1);
    return { ev: S.ltr.ev.map((e) => e.slice(1).join(':')).join(' '), b: S.ltr.b.length, b0: S.ltr.b[0], id: S.dog.id, lv: S.bond.level, day: S.ltr.ev[0][0], jst: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) };
  });
  ok(notes.ev === 'w:2 wi:1 t:Sit mk:1 v:2 dg:1' && notes.day === notes.jst, 'notes: counts add up by Japan day, a trick once, notes older than 9 days go: ' + notes.ev);
  ok(notes.b === 1 && notes.b0[1] === notes.id && notes.b0[2] === notes.lv, 'the Bond at the first look of the day, once per dog and day');
  await ev(() => { window.__paw.S.daysPlayed = 9; window.__paw.saveNow(); });
  await t.until(() => true, null, 100);
  let synced = false; for (let i = 0; i < 40 && !synced; i++) { const sv = srv.saves[uid]; synced = !!(sv && sv.data.ltr && sv.data.ltr.ev && sv.data.ltr.ev.some((e) => e[1] === 'dg')); if (!synced) await t.sleep(250); }
  ok(synced, 'the notes travel with the cloud save (nothing else is sent)');
  {
    const j = new Date(Date.now() + 9 * 3600e3); let sun = Date.UTC(j.getUTCFullYear(), j.getUTCMonth(), j.getUTCDate() - j.getUTCDay(), 10) - 9 * 3600e3; while (sun <= Date.now()) sun += 7 * 864e5;
    const m0 = srv.mails.length, out = await worker.scheduled({ scheduledTime: sun }, srv.env, {}), m = srv.mails[m0];
    ok(out.sent === 1 && !!m && m.to[0] === 'letters-game@example.com' && m.subject === 'A letter from ' + name, 'next Sunday 10:00 JST the Worker writes one letter from that save: ' + JSON.stringify(out));
    ok(!!m && m.text.includes('It is me, ' + name) || (!!m && m.text.includes(name + ' here.')), 'in the dog\'s voice, with its name');
    ok(!!m && m.text.includes('We have played together on 9 days now.') && m.text.includes('I learned a new trick: Sit.') && m.text.includes('A wish of mine came true this week.'), 'with the days played and the week\'s two top notes (the trick, the wish)');
    ok(!!m && /^<https:\/\/api\.doodledoggo\.app\/letters\/unsub\?t=v1\.u\./.test(m.headers['List-Unsubscribe']), 'and the unsubscribe header');
    const un = await api('POST', '/letters/unsub?t=' + tokOf(m), 'List-Unsubscribe=One-Click');
    await ev(() => window.__paw.lt.poll()); await idle();
    ok(un.status === 200 && !row(uid) && await ev(() => window.__paw.S.ltr.st === ''), 'unsubscribed from the email: the game shows off on its next look');
  }

  sec('7. the language follows the game, and an older Worker');
  await api('POST', '/letters', { on: true, lang: 'en' }, await ev((k) => JSON.parse(localStorage.getItem(k)).token, AUTH));
  raw.prepare("update letters set lang = 'fr' where user_id = ?").run(uid); // as if letters were turned on while the game was in French
  const mailsL = srv.mails.length;
  await ev(() => window.__paw.lt.poll()); await idle(); await t.until(() => true, null, 50);
  ok(row(uid).lang === 'en' && srv.mails.length === mailsL, 'the row follows the game\'s language on the next look (fr -> ' + row(uid).lang + '), with no email about it');
  await ev(() => {
    const M = window.__pawCloudMock; M.realFetch = M.realFetch || M.fetch;
    M.fetch = (u, o) => (/\/letters/.test(String(u)) ? Promise.resolve(new Response('{"error":"not_found"}', { status: 404, headers: { 'content-type': 'application/json' } })) : M.realFetch(u, o));
  });
  await settings(); await idle(); await t.until(() => !document.getElementById('ltBox'), null, 5000);
  ok((await box()) === null && await ev(() => window.__paw.lt.gone() && window.__paw.lt.mode() === 'off' && !window.__paw.lt.due()), 'an older Worker (404 not_found): the row goes for this load, no card, no error');
  ok(await ev(() => !!document.querySelector('#modal .panel #setMute')), 'Settings itself is fine');
  await closeAll();

  sec('8. phone 360x640');
  raw.prepare('delete from letters where user_id = ?').run(uid);
  const save = await ev(() => { const S = window.__paw.S; S.ltr.ask = 0; S.ltr.st = ''; return JSON.stringify(S); });
  const tok = await ev((k) => localStorage.getItem(k), AUTH);
  await cloudPage({ device: 'Phone 360x640', prefs: { ltTest: true }, storage: { pawhaven_proto_v1: save, [AUTH]: tok } });
  if (await t.p.locator('#tContinue').count()) await t.p.click('#tContinue');
  await t.calm(); await t.lu();
  await t.until(() => !!(window.__paw && window.__paw.lt && window.__pawCloud && window.__pawCloud.CL.uid && !window.__pawCloud.CL.anon), null, 8000);
  await ev(() => window.__paw.lt.poll()); await idle();
  const audit = (sel) => ev((sel) => {
    const vw = innerWidth, bad = [];
    const panel = document.querySelector(sel); if (!panel) return { bad: ['no panel ' + sel] };
    const vis = (e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; };
    [...panel.querySelectorAll('.btn, label.tog')].filter(vis).forEach((b) => { const r = b.getBoundingClientRect(); if (r.height < 43.5 || r.width < 43.5) bad.push('small ' + (b.innerText || b.id).trim().slice(0, 20) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); if (r.right > vw + 0.5 || r.left < -0.5) bad.push('off screen ' + (b.id || b.className)); });
    [...panel.querySelectorAll('p, h2, h4, b')].filter(vis).forEach((e) => { if (e.scrollWidth > e.clientWidth + 1) bad.push('clipped ' + e.textContent.slice(0, 20)); const r = e.getBoundingClientRect(); if (r.right > vw + 0.5) bad.push('wide ' + e.textContent.slice(0, 20)); });
    return { bad, over: document.documentElement.scrollWidth > vw + 1, pw: Math.round(panel.getBoundingClientRect().width) };
  }, sel);
  await ev(() => { window.__paw.lt.open(); });
  await t.until(() => !!document.querySelector('#modal .panel.ltr-pop #ltrYes'), null, 3000); await shot('offer_card_phone');
  let a = await audit('#modal .panel.ltr-pop');
  ok(!a.bad.length && a.pw <= 360 && !a.over, 'the offer card fits: ' + JSON.stringify(a));
  ok(await ev(() => { const f = document.querySelector('#modal .panel.ltr-pop .foot'), fr = f.getBoundingClientRect(); return fr.bottom <= innerHeight + 0.5 && [...f.querySelectorAll('.btn')].every((b) => b.getBoundingClientRect().bottom <= innerHeight + 0.5); }), 'both answers are on screen without scrolling');
  await t.p.click('#ltSampleBtn'); await t.until(() => !!document.querySelector('#modal .ltr-pop #ltSample .ltr-letter'), null, 3000); await shot('offer_card_sample_phone');
  a = await audit('#modal .panel.ltr-pop');
  ok(!a.bad.length && !a.over, 'with the sample letter open it still fits (the card scrolls): ' + JSON.stringify(a));
  await closeAll();
  await ev(() => { window.__paw.lt.settings(); }); await t.until(() => !!document.getElementById('ltBox'), null, 4000);
  await ev(() => document.getElementById('ltBox').scrollIntoView({ block: 'start' })); await shot('settings_row_phone');
  a = await audit('#ltBox');
  ok(!a.bad.length && !a.over, 'the Settings row fits: ' + JSON.stringify(a));
  await t.p.click('#ltTog'); await ev(() => new Promise((r) => setTimeout(r, 50))); await t.until(() => !window.__paw.lt.busy() && !!document.querySelector('#ltAgain'), null, 6000);
  await ev(() => document.getElementById('ltBox').scrollIntoView({ block: 'start' })); await shot('settings_pending_phone');
  a = await audit('#ltBox');
  ok(!a.bad.length && !a.over, 'the pending row (the address, "Send it again") fits: ' + JSON.stringify(a));
});
