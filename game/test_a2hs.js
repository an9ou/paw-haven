// "Home screen tip" (game/src/59_a2hs.js): the Add Doodle Doggo to your home screen card.
//   1. old saves load: nothing is added to the save (v stays 1), what the tip remembers lives in prefs.a2 and bad values are cleaned
//   2. hidden: itch.io (another host, another frame), a test copy, a computer, the Android app's WebView, an installed app (standalone),
//      another iOS browser, Android with no install event, the first day
//   3. shown: a phone at doodledoggo.app/play/ from the 2nd day played, with the browser's install event kept; it waits for a sheet,
//      a story scene and the map; the card: a dialog, 44 px buttons, inside 360x640
//   4. once a week (x and Escape mean "later"), three times at most; never after No thanks
//   5. Android: the button calls the kept event's prompt() once; accepted = added (never again), dismissed = later, a prompt that
//      fails shows where the browser keeps it; the appinstalled event counts as added
//   6. iPhone and iPad: Safari gets the two steps with crayon icons and the note about the save; Got it = never again
//   7. the site's game box (a frame of the site itself) is the site copy; the dev panel shows a preview that changes nothing
// node game/run_tests.js a2hs        (screenshots: A2HS_SHOTS=<dir>, else test_logs/)
const { run } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path');
devices['Phone 360x640'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 } });
devices['iPhone 360x640'] = Object.assign({}, devices['iPhone 15'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 } });
const SAVE = 'pawhaven_proto_v1', PREFS = 'pawhaven_prefs_v1', SHOTS = process.env.A2HS_SHOTS || path.join(__dirname, 'test_logs');
const SITE = { host: 'doodledoggo.app', path: '/play/', frame: '', standalone: false };
const UA = {
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
  webview: 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0.0.0 Mobile Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  crios: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.0.0 Mobile/15E148 Safari/604.1',
  insta: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0.0.0'
};

run('a2hs', async (t) => {
  const { ok, sec, ev } = t;
  const shown = () => ev(() => !!document.querySelector('#modal:not([hidden]) .panel.a2-pop'));
  const waitCard = (ms) => t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.a2-pop'), null, ms || 6000);
  const noCard = async (ms) => { const w0 = Date.now(); while (Date.now() - w0 < (ms || 2600)) { if (await shown()) return false; await t.sleep(200); } return true; };
  const env = (o) => ev((o) => window.__paw.a2.env(o), o);
  const st = () => ev(() => window.__paw.a2.st());
  const set = (o) => ev((o) => window.__paw.a2.set(o), o);
  const due = () => ev(() => window.__paw.a2.due());
  const fast = () => ev(() => window.__paw.a2.timing(0, 300));
  // a stand-in for the browser's install event: counts prompt() calls, answers with `outcome` ('throw' = prompt() fails)
  const fire = (outcome) => ev((outcome) => {
    const e = new Event('beforeinstallprompt', { cancelable: true }); window.__a2 = { prompts: 0, e };
    e.prompt = () => { window.__a2.prompts++; if (outcome === 'throw') throw new Error('no prompt'); return Promise.resolve({ outcome }); };
    e.userChoice = outcome === 'throw' ? undefined : Promise.resolve({ outcome });
    window.dispatchEvent(e); return { prevented: e.defaultPrevented, kept: window.__paw.a2.evt() };
  }, outcome);
  const days = (n) => ev((n) => { const P = window.__paw; P.S.daysPlayed = n; P.S.daysLastISO = P.rh.jst(); P.saveNow(); }, n);
  const weekAgo = () => ev(() => window.__paw.a2.set({ at: Date.now() - window.__paw.a2.WEEK - 60000 }));

  sec('1. old saves load: nothing new in the save, the tip remembers in prefs');
  await t.newGame({ device: 'Phone 360x640', prefs: { a2Test: true, scTest: true } });
  ok(await t.until(() => !!(window.__paw && window.__paw.a2), null, 5000), 'the hook is there');
  const fresh = await ev(() => ({ v: window.__paw.S.v, keys: Object.keys(window.__paw.S).filter((k) => /^a2/i.test(k)), st: window.__paw.a2.st() }));
  ok(fresh.v === 1 && !fresh.keys.length && fresh.st.n === 0 && fresh.st.at === 0 && fresh.st.no === false && fresh.st.done === false, `a new save: v 1, no a2 field in the save, the tip starts clean (${JSON.stringify(fresh)})`);
  { // an older save (the v2.25 fields taken away) with junk in prefs.a2
    const old = await ev((k) => { const s = JSON.parse(localStorage.getItem(k)); ['daysPlayed', 'daysLastISO', 'daysGifts', 'lastSeenAt', 'wbPend'].forEach((f) => delete s[f]); s.coins = 4321; return JSON.stringify(s); }, SAVE);
    await t.mk({ device: 'Phone 360x640', prefs: { a2Test: true, a2: { n: 'lots', at: -5, no: 0, done: null } }, storage: { [SAVE]: old } });
    await t.p.goto(require('./test_lib').URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
    await t.until(() => !!(window.__paw && window.__paw.a2), null, 5000);
    const o = await ev((k) => { const P = window.__paw, s = JSON.parse(localStorage.getItem(k)); return { v: P.S.v, coins: P.S.coins, days: P.S.daysPlayed, st: P.a2.st(), saved: Object.keys(s).filter((x) => /^a2/i.test(x)), due: P.a2.due() }; }, SAVE);
    ok(o.v === 1 && o.coins === 4321 && typeof o.days === 'number' && !o.saved.length, `an old save loads: v stays 1, its coins are kept, days played is a number, no a2 field is written to the save (${JSON.stringify(o)})`);
    ok(o.st.n === 0 && o.st.at === 0 && o.st.no === false && o.st.done === false && o.due === false, 'junk in prefs.a2 is cleaned to the defaults, and nothing is due on a local file');
    const future = await ev(() => { const a = window.__paw.a2.set({ at: Date.now() + 9e9 }); return a.at <= Date.now(); });
    ok(future, 'a "last shown" from a clock that was ahead is pulled back to now (it can never lock the tip away)');
    await set({ at: 0 });
  }

  sec('2. hidden everywhere but the site copy on a phone or tablet');
  await days(3); await fast();
  const combos = [
    ['a local file or a test page (no site address)', null, false],
    ['the site copy, Android, but no install event yet', Object.assign({}, SITE, { ua: UA.android }), false],
    ['iPhone Safari at doodledoggo.app/play/', Object.assign({}, SITE, { ua: UA.iphone }), true],
    ['iPhone Safari at www.doodledoggo.app/play/', Object.assign({}, SITE, { host: 'www.doodledoggo.app', ua: UA.iphone }), true],
    ['iPad Safari (says Macintosh, has touch)', Object.assign({}, SITE, { ua: UA.ipad, touch: 5 }), true],
    ['a Mac with Safari (no touch)', Object.assign({}, SITE, { ua: UA.ipad, touch: 0 }), false],
    ['itch.io (html-classic.itch.zone)', Object.assign({}, SITE, { host: 'html-classic.itch.zone', path: '/html/123/index.html', frame: 'other', ua: UA.iphone }), false],
    ['a frame that is not the site, even with the site address', Object.assign({}, SITE, { frame: 'other', ua: UA.iphone }), false],
    ['the test copy test.doodledoggo.app', Object.assign({}, SITE, { host: 'test.doodledoggo.app', path: '/', ua: UA.iphone }), false],
    ['GitHub Pages', Object.assign({}, SITE, { host: 'an9ou.github.io', path: '/paw-haven/', ua: UA.iphone }), false],
    ['the site but not the game (doodledoggo.app/)', Object.assign({}, SITE, { path: '/', ua: UA.iphone }), false],
    ['a computer at the site copy', Object.assign({}, SITE, { ua: UA.desktop, touch: 0 }), false],
    ['already an installed app (standalone)', Object.assign({}, SITE, { ua: UA.iphone, standalone: true }), false],
    ['Chrome on iPhone (no Add to Home Screen in Share)', Object.assign({}, SITE, { ua: UA.crios }), false],
    ['the Instagram in-app browser', Object.assign({}, SITE, { ua: UA.insta }), false],
    ['the Android app (a WebView)', Object.assign({}, SITE, { ua: UA.webview }), false]
  ];
  for (const [label, e, want] of combos) { await env(e); const d = await due(); ok(d === want, `${want ? 'due' : 'hidden'}: ${label}`); }
  await env(Object.assign({}, SITE, { ua: UA.desktop, touch: 0 }));
  const desk = await fire('accepted');
  ok(!desk.prevented && !desk.kept && !(await due()), 'a computer: the browser keeps its own install event (not prevented, not kept), nothing due');
  await env(Object.assign({}, SITE, { host: 'html-classic.itch.zone', frame: 'other', ua: UA.android }));
  const itch = await fire('accepted');
  ok(!itch.prevented && !itch.kept && !(await due()), 'itch.io on Android: the install event is left alone, nothing due');
  ok(await noCard(2600), 'and no card opens there, with the waits at zero');
  await env(Object.assign({}, SITE, { ua: UA.iphone })); await days(1);
  ok(!(await due()), 'the first day played: not yet');
  ok(await noCard(2400), 'no card on day 1');

  sec('3. shown on a phone at the site copy from day 2, at a calm moment');
  await env(SITE); // the Pixel 7 profile's own Android address line
  const kept = await fire('dismissed');
  ok(kept.prevented && kept.kept, "Android at the site copy: the browser's install event is kept for later (its own bar is prevented)");
  await days(2);
  ok(await due(), 'day 2 with an install event: due');
  // it waits: a sheet, the map, a story scene
  await ev(() => window.__paw.go('map'));
  ok(await noCard(2600) && !(await ev(() => window.__paw.a2.calm())), 'on the map: it waits');
  await t.home('yard');
  await ev(() => window.__paw.nw.open());
  await t.until(() => !!document.querySelector('#modal .nw-pop'), null, 4000);
  const sheetUp = await ev(() => !document.getElementById('modal').hidden && !!document.querySelector('#modal .nw-pop'));
  ok(sheetUp && await noCard(2600) && await ev(() => !!document.querySelector('#modal .nw-pop')), "under another sheet (What's new): it waits, and the sheet stays");
  await t.closeX(); await t.modalGone();
  await ev(() => { const P = window.__paw; P.S.place = 'park'; P.go('yard'); });
  ok(await noCard(2400), 'out at the park: it waits for home');
  await t.home('yard');
  // a story scene (57_scenes.js) and a guide card of Gerald's (25_guide.js, the first-week steps) are in the way too
  ok(await ev(() => window.__paw.sc.play('visit_park') === true && !!window.__paw.sc.on()), 'a story scene starts');
  ok(await noCard(2600) && await ev(() => !!window.__paw.sc.on() && !window.__paw.a2.calm()), 'under a story scene: it waits');
  await t.until(() => { const b = document.querySelector('#scLayer .sc-skip'); return !!b && !b.hidden; }, null, 6000); await t.p.click('#scLayer .sc-skip');
  await t.until(() => !window.__paw.sc.on(), null, 5000);
  const gd = await ev(() => { let L = document.getElementById('gdLayer'), made = false; if (!L) { L = document.createElement('div'); L.id = 'gdLayer'; document.body.appendChild(L); made = true; } const c = document.createElement('div'); c.className = 'gd-card a2-fake'; L.appendChild(c); window.__a2Gd = made ? L : c; return !window.__paw.a2.calm(); });
  ok(gd && await noCard(2400), "while one of Gerald's guide steps is up: it waits");
  await ev(() => window.__a2Gd.remove());
  ok(await waitCard(7000), 'back on a calm home yard: the card opens by itself');
  await t.sleep(450);
  const card = await ev(() => {
    const p = document.querySelector('#modal .panel.a2-pop'), r = p.getBoundingClientRect(), body = p.querySelector('.panel-body');
    const btn = [...p.querySelectorAll('button')].map((b) => { const q = b.getBoundingClientRect(); return { id: b.id || b.className, w: Math.round(q.width), h: Math.round(q.height), in: q.left >= -0.5 && q.right <= innerWidth + 0.5 && q.top >= -0.5 && q.bottom <= innerHeight + 0.5, label: (b.getAttribute('aria-label') || b.textContent).trim() }; });
    const bar = document.getElementById('bar').getBoundingClientRect();
    return { kind: p.dataset.a2, role: p.getAttribute('role'), modal: p.getAttribute('aria-modal'), label: p.getAttribute('aria-label'), h2: p.querySelector('h2').textContent, r: [r.left, r.top, r.right, r.bottom].map(Math.round), vw: innerWidth, vh: innerHeight, barTop: Math.round(bar.top),
      btn, scroll: body.scrollHeight - body.clientHeight, hs: document.documentElement.scrollWidth - innerWidth, focus: document.activeElement && document.activeElement.className, art: p.querySelectorAll('.a2-top svg').length, hidArt: [...p.querySelectorAll('.a2-top > span')].every((x) => x.getAttribute('aria-hidden') === 'true'), lead: p.querySelector('.a2-lead').textContent, steps: p.querySelectorAll('.a2-steps li').length };
  });
  ok(card.kind === 'android' && card.role === 'dialog' && card.modal === 'true' && card.label === 'Add Doodle Doggo to your home screen' && card.h2 === card.label, `the Android card is a labelled dialog (${card.kind}, ${card.role}, "${card.label}")`);
  ok(card.btn.length === 3 && card.btn.every((b) => b.w >= 44 && b.h >= 44 && b.in) && card.btn.some((b) => b.id === 'a2Add' && b.label === 'Add to home screen') && card.btn.some((b) => b.id === 'a2No' && b.label === 'No thanks') && card.btn.some((b) => b.label === 'Close'), `x, No thanks and Add to home screen, each 44 px or more and on the screen (${card.btn.map((b) => `${b.id} ${b.w}x${b.h}`).join(', ')})`);
  ok(card.r[0] >= 0 && card.r[2] <= card.vw && card.r[1] >= 0 && card.r[3] <= card.barTop + 1 && card.scroll <= 0 && card.hs <= 0, `it fits 360x640 over the phone bar with nothing to scroll (${card.r.join(' ')}, bar at ${card.barTop})`);
  ok(card.focus === 'a2-lead' && card.art >= 2 && card.hidArt && /one tap away/.test(card.lead) && card.steps === 0, `the focus starts on the card's first line, never on a button (a stray key cannot answer a card that opened by itself); the phone doodle and Gerald are decoration only; no steps on Android (${card.focus}, ${card.art} drawings)`);
  await t.p.keyboard.press('Enter'); await t.p.keyboard.press(' ');
  ok(await shown() && (await st()).no === false && (await ev(() => window.__a2.prompts)) === 0, 'Enter and Space right after it opened answer nothing');
  await t.p.screenshot({ path: path.join(SHOTS, 'a2hs_android_360x640.png') });
  const s1 = await st();
  ok(s1.n === 1 && s1.at > 0 && !s1.no && !s1.done, `it counts as shown once, now (${JSON.stringify(s1)})`);
  ok(await ev((k) => { const p = JSON.parse(localStorage.getItem(k)); return !!p.a2 && p.a2.n === 1; }, PREFS) && await ev((k) => !/"a2"/.test(localStorage.getItem(k)), SAVE), 'that is written to prefs, never to the save');

  sec('4. once a week, three times at most; never after No thanks');
  await t.p.keyboard.press('Escape');
  ok(await t.modalGone() && !(await shown()), 'Escape closes it');
  const s2 = await st();
  ok(!s2.no && !s2.done && !(await due()) && await noCard(2600), 'closed without an answer means later: not due again the same week');
  await ev(() => window.__paw.a2.set({ at: Date.now() - 6 * 864e5 }));
  ok(!(await due()), 'six days later: still not');
  await weekAgo();
  ok(await due() && await waitCard(7000), 'a week later it comes once more');
  await t.sleep(350); await t.p.click('#modal .panel.a2-pop .x');
  ok(await t.modalGone() && (await st()).n === 2, 'the x closes it too (shown twice now)');
  await weekAgo(); ok(await waitCard(7000), 'a third week: the third time');
  await t.sleep(350); await t.p.keyboard.press('Escape'); await t.modalGone();
  await weekAgo();
  ok((await st()).n === 3 && !(await due()) && await noCard(2400), 'after three times it never asks by itself again');
  await set({ n: 1, at: 0 }); ok(await waitCard(7000), '(back to once shown) the card again');
  await t.sleep(350); await t.p.click('#a2No');
  ok(await t.modalGone() && (await st()).no === true, 'No thanks closes it and is remembered');
  await weekAgo(); await set({ n: 0 });
  ok(!(await due()) && await noCard(2400), 'never again after No thanks, weeks later too');
  await t.reloadKeepingSave(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.until(() => !!(window.__paw && window.__paw.a2), null, 5000);
  ok((await st()).no === true, 'No thanks is still there after a reload');

  sec('5. Android: the button asks the browser once');
  await fast(); await env(SITE); await set({ no: false, n: 0, at: 0 }); await days(3);
  await fire('accepted');
  ok(await waitCard(7000), 'the card, with a new install event');
  await t.sleep(350); await t.toasts(); await t.p.click('#a2Add');
  ok(await t.modalGone(), 'Add to home screen: the card closes once the browser says it was added');
  const acc = await ev(() => ({ prompts: window.__a2.prompts, kept: window.__paw.a2.evt(), st: window.__paw.a2.st() }));
  ok(acc.prompts === 1 && !acc.kept && acc.st.done === true, `prompt() was called once, the event is used up, and it is remembered as added (${JSON.stringify(acc)})`);
  ok(await t.waitToast(/home screen/i, 4000), 'a kind toast says where to look');
  await weekAgo(); await fire('accepted');
  ok(!(await due()) && await noCard(2400), 'never again once it was added');
  // dismissed in the browser's own window = later
  await set({ done: false, n: 0, at: 0 }); await fire('dismissed');
  ok(await waitCard(7000), 'the card again (not added yet)');
  await t.sleep(350); await t.p.click('#a2Add');
  ok(await t.modalGone() && (await ev(() => window.__a2.prompts)) === 1 && !(await st()).done && !(await st()).no, "the browser's own window closed without adding: our card closes, nothing is remembered but the week");
  // a prompt that cannot open
  await set({ n: 0, at: 0 }); await fire('throw');
  ok(await waitCard(7000), 'the card again');
  await t.sleep(350); await t.p.click('#a2Add');
  const hint = await ev(() => ({ up: !!document.querySelector('#modal .panel.a2-pop'), txt: document.getElementById('a2Hint').textContent, role: document.getElementById('a2Hint').getAttribute('role'), btn: document.getElementById('a2Add').textContent }));
  ok(hint.up && /menu/.test(hint.txt) && hint.role === 'status' && hint.btn === 'OK', `the browser could not open its window: the card says where the menu keeps it and the button becomes OK ("${hint.txt}")`);
  await t.p.click('#a2Add'); ok(await t.modalGone() && !(await st()).done, 'OK closes it');
  // added from the browser's own menu
  await set({ n: 0, at: 0 }); await fire('dismissed'); ok(await waitCard(7000), 'the card once more');
  await ev(() => window.dispatchEvent(new Event('appinstalled')));
  ok(await t.modalGone() && (await st()).done === true, 'the appinstalled event closes the card and counts as added');

  sec('6. iPhone and iPad: the two Safari steps');
  await t.newGame({ device: 'iPhone 360x640', prefs: { a2Test: true } });
  await t.until(() => !!(window.__paw && window.__paw.a2), null, 5000);
  await fast(); await env(SITE); await days(2); // the iPhone 15 profile's own Safari address line
  ok(await ev(() => window.__paw.a2.plat() === 'ios' && window.__paw.a2.safari() && window.__paw.a2.kind() === 'ios'), 'the iPhone profile is iOS Safari: the steps card');
  ok(await waitCard(7000), 'the card opens by itself (no install event needed)');
  await t.sleep(450);
  const ios = await ev(() => {
    const p = document.querySelector('#modal .panel.a2-pop'), r = p.getBoundingClientRect(), bar = document.getElementById('bar').getBoundingClientRect();
    const steps = [...p.querySelectorAll('.a2-steps li')].map((li) => ({ t: li.querySelector('span').textContent, ic: !!li.querySelector('svg.a2-ic[aria-hidden="true"] path'), in: li.getBoundingClientRect().right <= innerWidth + 0.5 }));
    const btn = [...p.querySelectorAll('button')].map((b) => { const q = b.getBoundingClientRect(); return { id: b.id, w: Math.round(q.width), h: Math.round(q.height) }; });
    return { kind: p.dataset.a2, ol: !!p.querySelector('ol.a2-steps'), steps, save: p.querySelector('.a2-save').textContent, btn, add: !!document.getElementById('a2Add'), r: [r.left, r.top, r.right, r.bottom].map(Math.round), vw: innerWidth, barTop: Math.round(bar.top), hs: document.documentElement.scrollWidth - innerWidth };
  });
  ok(ios.kind === 'ios' && ios.ol && ios.steps.length === 2 && /Share/.test(ios.steps[0].t) && /three dots/.test(ios.steps[0].t) && /Add to Home Screen/.test(ios.steps[1].t) && ios.steps.every((s) => s.ic && s.in), `two steps in a list, each with its crayon icon: Share, then Add to Home Screen (${ios.steps.map((s) => s.t).join(' / ')})`);
  ok(/own save/.test(ios.save) && /account/.test(ios.save), `a guest is told the new icon keeps its own save and how the dog comes along ("${ios.save}")`);
  ok(!ios.add && ios.btn.every((b) => b.w >= 44 && b.h >= 44) && ios.btn.some((b) => b.id === 'a2Ok') && ios.btn.some((b) => b.id === 'a2No'), `Got it and No thanks, no install button, 44 px taps (${ios.btn.map((b) => `${b.id} ${b.w}x${b.h}`).join(', ')})`);
  ok(ios.r[0] >= 0 && ios.r[2] <= ios.vw && ios.r[1] >= 0 && ios.r[3] <= ios.barTop + 1 && ios.hs <= 0, `it fits 360x640 (${ios.r.join(' ')})`);
  await t.p.screenshot({ path: path.join(SHOTS, 'a2hs_ios_360x640.png') });
  await t.p.keyboard.press('Tab'); await t.p.keyboard.press('Tab'); await t.p.keyboard.press('Tab'); await t.p.keyboard.press('Tab');
  ok(await ev(() => !!document.activeElement && !!document.activeElement.closest('.panel.a2-pop')), 'Tab stays inside the card');
  await t.p.click('#a2Ok');
  ok(await t.modalGone() && (await st()).done === true, 'Got it closes it and it never comes back');
  await weekAgo(); ok(!(await due()), 'not due again');

  sec('7. the site\'s own game box, and the dev preview');
  await set({ done: false, n: 0, at: 0 });
  await env(Object.assign({}, SITE, { frame: 'site' }));
  ok(await due(), 'in the game box of a site page (a frame of the site itself): due, as on /play/');
  await env(Object.assign({}, SITE, { frame: 'other' }));
  ok(!(await due()), 'in any other frame: never');
  await env(null);
  ok(await ev(() => window.__paw.a2.frame() === '' && !window.__paw.a2.site()), 'this test page itself: no frame, not the site');
  const prev = await ev(() => { const P = window.__paw, before = JSON.stringify(P.a2.st()); P.a2.open('ios'); return { up: !!document.querySelector('#modal .panel.a2-pop'), same: JSON.stringify(P.a2.st()) === before }; });
  ok(prev.up && prev.same, 'a preview (the dev panel, the hook) shows the card and changes nothing the tip remembers');
  await t.p.keyboard.press('Escape'); await t.modalGone();
  ok(await ev(() => { window.__paw.a2.test(false); const off = !window.__paw.a2.on() && !window.__paw.a2.due(); window.__paw.a2.test(true); return off; }), 'under the test harness it is off unless a suite asks (prefs.a2Test)');
}, { timeout: 480000 });
