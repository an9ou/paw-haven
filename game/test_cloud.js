// CLOUD (v2.2, v2.8.1): cloud save against a local copy of the Cloudflare Worker (no network). PHONE.md section 3 and the CLOUD part of section 4.
//   PAW_ARGS=--ignore-certificate-errors NODE_PATH=$(npm root -g) node game/test_cloud.js     (or: node game/run_tests.js game/test_cloud.js)
// The real cloudflare/worker.js runs in this Node process on a D1 lookalike (game/cloud_mock.js) and is shared by every page
// (each page is one "device"). Each page gets window.__pawCloudMock ({ fetch }) that reaches it through an exposed binding.
// No Realtime since v2.8.1: another device's save arrives on game open, on focus and when the device comes back online.
const { run, URL } = require('./test_lib');
const { makeServer, mockInit } = require('./cloud_mock');

run('cloud', async (t) => {
  const { ok, sec } = t; const srv = makeServer();
  const pages = {};
  // one "device": its own browser context (own localStorage), with the mock installed
  async function device(name, devName, cfg) {
    const p = await t.mk({ device: devName });
    if (cfg !== false) {
      await t.ctx.exposeBinding('__clSrv', (src, m, u, b, a) => srv.handle(src.page, m, u, b, a));
      await t.ctx.addInitScript(mockInit, cfg || {});
      srv.pages.add(p);
    }
    await p.goto(URL); await p.waitForSelector('#tNew, #tContinue, #tGuest'); // v2.3: cloud on and no session shows Log in / Make an account / Play as guest
    pages[name] = p; return p;
  }
  const use = (p) => { t.p = p; return p; };
  // v2.3 title: a fresh device picks Play as guest first (today's flow), then New game
  const adopt = async (p, o) => { use(p); if (await p.locator('#tGuest').count()) { await p.click('#tGuest'); await p.waitForSelector('#tNew'); } await t.adopt(o); };
  const ev = (p, f, a) => p.evaluate(f, a);
  const st = (p) => ev(p, () => window.__pawCloud.status());
  const until = (p, f, a, ms) => { use(p); return t.until(f, a, ms); };
  const waitSynced = (p, ms) => until(p, () => window.__pawCloud.status().state === 'synced', null, ms || 8000);
  // a real player change: input first (so it counts as a change), then the game's own save
  const change = (p, patch) => ev(p, (o) => { window.dispatchEvent(new PointerEvent('pointerdown')); Object.assign(window.__paw.S, o); window.__paw.saveNow(); }, patch);
  const uidOf = (p) => ev(p, () => window.__pawCloud.CL.uid);
  const focus = (p) => ev(p, () => { window.__pawCloud.CL.lastPull = 0; window.dispatchEvent(new Event('focus')); }); // the player comes back to this device
  const openCloud = async (p) => { await ev(p, () => window.__pawCloud.open()); await p.waitForSelector('#clBox'); };
  const tap = async (p, sel) => { await p.locator(sel).first().scrollIntoViewIfNeeded(); await p.locator(sel).first().tap(); };
  // phone minimums for the Cloud save section: tap targets, text size, no sideways scroll
  async function phoneCheck(p, label, sel) {
    const r = await ev(p, (q) => {
      const box = document.querySelector(q); const small = []; const tiny = [];
      box.querySelectorAll('button, input, textarea').forEach((e) => { const b = e.getBoundingClientRect(); if (b.width && (b.height < 44 || b.width < 44)) small.push(`${e.dataset.cl || e.id || e.textContent.trim()} ${Math.round(b.width)}x${Math.round(b.height)}`); });
      const walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT); let n;
      while ((n = walk.nextNode())) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el.getClientRects().length) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 15) tiny.push(`${n.textContent.trim().slice(0, 24)} ${fs}px`); }
      return { phone: document.documentElement.dataset.layout, small, tiny, sw: document.documentElement.scrollWidth, iw: innerWidth };
    }, sel || '#clBox');
    use(p); await t.SH(label.replace(/\W+/g, '_'));
    ok(r.phone === 'phone', `${label}: phone layout is on`);
    ok(!r.small.length, `${label}: every Cloud save tap target is 44 px or more ${r.small.join(', ')}`);
    ok(!r.tiny.length, `${label}: Cloud save text is 15 px or more ${r.tiny.slice(0, 4).join(', ')}`);
    ok(r.sw === r.iw, `${label}: no horizontal scroll (${r.sw} vs ${r.iw})`);
  }

  sec('device 1 (iPhone 15): a guest starts automatically and the save reaches the cloud');
  const d1 = await device('d1', 'iPhone 15'); await adopt(d1, { sex: 'girl' });
  ok(await until(d1, () => !!window.__pawCloud.CL.uid, null, 8000), 'a guest user is made once there is a save');
  const g1 = await uidOf(d1);
  ok(await until(d1, (u) => window.__pawCloud.meta().rev >= 1 && window.__pawCloud.meta().uid === u, g1, 8000) && !!srv.saves[g1], 'the first save is pushed to the cloud');
  ok(await waitSynced(d1), 'status: synced');
  const name1 = (await ev(d1, () => window.__paw.S.dog.name));
  ok(srv.saves[g1] && srv.saves[g1].data.dogs[0].name === name1 && srv.saves[g1].data.v === 1, 'the cloud stores exactly the local save (S.v 1)');
  ok(JSON.stringify(srv.saves[g1].data) === await ev(d1, () => localStorage.getItem('pawhaven_proto_v1')), 'cloud data is byte-for-byte what localStorage holds');

  sec('push debounce (about 2 s) and idle saves');
  const up0 = srv.count(d1, 'PUT /save');
  for (let i = 0; i < 3; i++) { await change(d1, { coins: 300 + i }); await t.sleep(250); }
  await t.sleep(700);
  ok(srv.count(d1, 'PUT /save') === up0, 'no push in the first ~1.4 s after a burst of changes');
  ok((await st(d1)).state === 'syncing', 'status: syncing while a push waits');
  ok(await until(d1, () => window.__pawCloud.status().state === 'synced', null, 5000), 'the push lands');
  ok(srv.count(d1, 'PUT /save') === up0 + 1, `three quick changes make one push (${srv.count(d1, 'PUT /save') - up0})`);
  ok(srv.saves[g1].data.coins === 302, 'the pushed save has the newest change');
  const rev1 = srv.saves[g1].rev; ok(rev1 === (await ev(d1, () => window.__pawCloud.meta().rev)), 'rev goes up by one per push and is remembered');
  await ev(d1, () => window.__paw.saveNow()); await t.sleep(2600);
  ok(srv.count(d1, 'PUT /save') === up0 + 1, 'a save with no player input (the clock ticking) is not pushed');
  ok(/^Synced \d+ s ago$/.test((await st(d1)).text), 'status text reads "Synced N s ago": ' + (await st(d1)).text);

  sec('Settings -> Cloud save on the phone, register: the guest becomes the account');
  await openCloud(d1);
  ok(/Guest/.test(await d1.textContent('#clStat')), 'status line says Guest');
  await phoneCheck(d1, 'iPhone 15 Cloud save');
  await tap(d1, '[data-cl=reg]'); await d1.waitForSelector('#clPw2');
  await phoneCheck(d1, 'iPhone 15 make an account form');
  await d1.fill('#clEmail', 'mochi@example.com'); await d1.fill('#clPw', 'short'); await d1.fill('#clPw2', 'short'); await tap(d1, '[data-cl=doReg]');
  ok(/at least 8/.test(await d1.textContent('.clmsg')), 'a password under 8 characters is refused');
  await d1.fill('#clEmail', 'mochi@example.com'); await d1.fill('#clPw', 'pupper123'); await d1.fill('#clPw2', 'pupper124'); await tap(d1, '[data-cl=doReg]');
  ok(/don't match/.test(await d1.textContent('.clmsg')), 'two different passwords are refused');
  await d1.fill('#clEmail', 'mochi@example.com'); await d1.fill('#clPw', 'pupper123'); await d1.fill('#clPw2', 'pupper123'); await tap(d1, '[data-cl=doReg]');
  ok(await until(d1, () => window.__pawCloud.CL.regPath === 'upgrade', null, 6000), 'register upgrades the guest on the Worker');
  ok((await uidOf(d1)) === g1 && srv.users.find((u) => u.id === g1).email === 'mochi@example.com', 'same user id, now with the email');
  ok(srv.saves[g1].data.dogs[0].name === name1 && (await ev(d1, () => window.__paw.S.dog.name)) === name1, 'register keeps the save');
  ok(await until(d1, () => /Logged in as m…@example\.com/.test(document.getElementById('clStat').textContent), null, 3000), 'status line: Logged in as m…@example.com');
  ok(await d1.locator('[data-cl=logout]').count() === 1 && await d1.locator('[data-cl=pw]').count() === 1, 'logged-in view has Change password and Log out');
  await tap(d1, '[data-cl=pw]'); await d1.fill('#clPw', 'pupper456'); await d1.fill('#clPw2', 'pupper456'); await tap(d1, '[data-cl=doPw]');
  ok(await until(d1, () => /Password changed/.test((document.querySelector('.clmsg') || {}).textContent || ''), null, 4000) && srv.pwIs(g1, 'pupper456'), 'change password works (stored as a PBKDF2 hash)');
  await t.SH('d1_settings');
  await t.closeX();

  sec('device 2 (Pixel 7): log in on a second device');
  const d2 = await device('d2', 'Pixel 7'); use(d2);
  await t.sleep(400);
  ok(!(await uidOf(d2)) && srv.users.length === 1, 'a fresh device with no save makes no guest user');
  await openCloud(d2); await phoneCheck(d2, 'Pixel 7 Cloud save');
  await tap(d2, '[data-cl=login]'); await d2.waitForSelector('#clPw');
  await phoneCheck(d2, 'Pixel 7 log in form');
  await d2.fill('#clEmail', 'Mochi@example.com'); await tap(d2, '[data-cl=forgot]'); await d2.waitForSelector('#modal .panel[data-ready] #fgEmail');
  ok((await d2.inputValue('#fgEmail')) === 'Mochi@example.com', 'Forgot your password? opens with the email already typed');
  await phoneCheck(d2, 'Pixel 7 forgot password', '#modal .panel');
  let mails0 = srv.mails.length; await tap(d2, '#fgGo');
  ok(await until(d2, () => /a link is on its way/.test((document.getElementById('fgMsg') || {}).textContent || ''), null, 5000), 'Send the link: "If that email has an account, a link is on its way"');
  ok(srv.mails.length === mails0 + 1 && srv.mails[mails0].to[0] === 'mochi@example.com' && /^https:\/\/doodledoggo\.app\/reset\?token=/.test(srv.mails[mails0].link), 'one email with a reset link went out');
  await phoneCheck(d2, 'Pixel 7 forgot password sent', '#modal .panel');
  await tap(d2, '#fgBack'); await d2.waitForSelector('#clBox');
  await tap(d2, '[data-cl=login]'); await d2.waitForSelector('#clPw');
  await d2.fill('#clEmail', 'mochi@example.com'); await d2.fill('#clPw', 'wrongpass1'); await tap(d2, '[data-cl=doLogin]');
  ok(await until(d2, () => /don't match/.test((document.querySelector('.clmsg') || {}).textContent || ''), null, 4000), 'wrong password: a kind message');
  ok(!(await ev(d2, () => window.__paw.S)), 'wrong password changes nothing');
  await d2.fill('#clEmail', 'mochi@example.com'); await d2.fill('#clPw', 'pupper456'); await tap(d2, '[data-cl=doLogin]');
  ok(await until(d2, (n) => !!window.__paw.S && window.__paw.S.dog.name === n, name1, 6000), 'right password: the account save loads on device 2');
  ok(await until(d2, () => !!document.querySelector('#tContinue'), null, 4000), 'the title screen now offers Continue');
  ok((await uidOf(d2)) === g1, 'device 2 is the same account');
  // the title screen may still be redrawing after the account save loaded: tap again until the game leaves it
  let cont = false; for (let k = 0; k < 4 && !cont; k++) { await tap(d2, '#tContinue').catch(() => {}); cont = await until(d2, () => window.__paw.mode === 'yard', null, 3000); }
  ok(cont, 'Continue goes to the yard');
  use(d2); await t.calm(); await t.lu();

  sec('sync on focus: a save on one device shows up on the other when the player comes back to it');
  await ev(d1, () => window.__paw.go('yard')); use(d1); await t.calm();
  await change(d2, { coins: 777 }); ok(await waitSynced(d2), 'device 2 pushes 777 coins');
  await t.sleep(1500); ok((await ev(d1, () => window.__paw.S.coins)) !== 777, 'no live push: device 1 waits for focus (no Realtime)');
  await focus(d1);
  ok(await until(d1, () => window.__paw.S.coins === 777, null, 8000), 'device 1 picks up device 2\'s save on focus');
  use(d1); ok(await t.waitToast(/Synced from your other device/), 'soft toast: Synced from your other device.');
  // not mid-popup: device 1 opens Settings, device 2 saves, nothing changes until the popup closes
  await openCloud(d1); await change(d2, { coins: 778 }); ok(await waitSynced(d2), 'device 2 pushes 778 coins'); await focus(d1);
  await t.sleep(3000);
  ok((await ev(d1, () => window.__paw.S.coins)) === 777, 'a remote save waits while a popup is open');
  use(d1); await t.closeX();
  ok(await until(d1, () => window.__paw.S.coins === 778, null, 5000), 'it applies once the game is idle');

  sec('only real changes count (live-check fix): taps plus clock-only saves never out-date the other device');
  const upA = srv.count(d1, 'PUT /save');
  await ev(d1, () => { window.dispatchEvent(new PointerEvent('pointerdown')); const S = window.__paw.S; S.gameMin = (S.gameMin || 0) + 7; S.dog.stats.happy = Math.max(0, S.dog.stats.happy - 3); window.__paw.saveNow(); });
  await t.sleep(2600);
  ok(srv.count(d1, 'PUT /save') === upA, 'a tap followed by a clock-only save (gameMin, stats) is not pushed');
  // device 1 last acted before device 2's change: a later autosave on device 1 (a day roll-over, say) must not win
  await ev(d1, () => window.dispatchEvent(new PointerEvent('pointerdown'))); await t.sleep(300);
  await change(d2, { coins: 779 }); ok(await until(d2, () => window.__pawCloud.status().state === 'synced', null, 6000), 'device 2 pushes 779 coins');
  await ev(d1, () => { const S = window.__paw.S; S.mailGiftDay = 'roll-over-test'; window.__paw.saveNow(); });
  await t.sleep(3500);
  ok(srv.saves[g1].data.coins === 779, `the cloud keeps device 2's newer change (${srv.saves[g1].data.coins})`);
  await focus(d1); ok(await until(d1, () => window.__paw.S.coins === 779, null, 6000), 'device 1 ends up with device 2\'s change');

  sec('newer wins on pull, and the loser is backed up');
  srv.offline.add(d1);
  await change(d1, { coins: 111 }); await t.sleep(2600); // device 1 changes while offline: its push fails
  ok((await st(d1)).state === 'offline', 'device 1 status: Offline');
  await change(d2, { coins: 222 }); ok(await until(d2, () => window.__pawCloud.status().state === 'synced', null, 6000), 'device 2 saves a newer change');
  srv.offline.delete(d1); const b0 = srv.backups.length;
  await ev(d1, () => window.__pawCloud.pull());
  ok(await until(d1, () => window.__paw.S.coins === 222, null, 6000), 'device 1 pulls: the newer cloud save wins');
  ok(srv.backups.length === b0 + 1 && srv.backups[srv.backups.length - 1].data.coins === 111 && srv.backups[srv.backups.length - 1].reason === 'older than your other device', 'device 1\'s older change went to backups with a reason');
  // the other way round: the local change is newer than the cloud
  srv.offline.add(d1);
  await change(d2, { coins: 333 }); ok(await until(d2, () => window.__pawCloud.status().state === 'synced', null, 6000), 'device 2 saves first');
  await t.sleep(50); await change(d1, { coins: 444 }); await t.sleep(2400);
  srv.offline.delete(d1); await ev(d1, () => { window.__pawCloud.CL.err = ''; return window.__pawCloud.push(); });
  ok(await until(d1, () => window.__pawCloud.status().state === 'synced', null, 6000) && srv.saves[g1].data.coins === 444, 'device 1\'s newer change wins on push');
  ok(srv.backups.some((b) => b.data.coins === 333 && b.reason === 'older than your other device'), 'device 2\'s older save went to backups');
  await focus(d2); ok(await until(d2, () => window.__paw.S.coins === 444, null, 8000), 'device 2 follows the winner');
  ok(srv.backups.filter((b) => b.user_id === g1).length <= 5, 'at most 5 backups per player');

  sec('Backups list and Restore');
  await openCloud(d1); await tap(d1, '[data-cl=backups]');
  ok(await until(d1, () => document.querySelectorAll('[data-clrestore]').length >= 2, null, 5000), 'Backups lists the saved versions');
  ok(/coins/.test(await d1.textContent('.clbk')) && /older than your other device/.test(await d1.textContent('.clbk')), 'each backup shows date, dogs, coins and why');
  await phoneCheck(d1, 'iPhone 15 backups list');
  const idx = await ev(d1, () => window.__pawCloud.CL.bk.findIndex((b) => b.data.coins === 111));
  await tap(d1, `[data-clrestore="${idx}"]`); await d1.waitForSelector('.confirm .yes'); await tap(d1, '.confirm .yes');
  ok(await until(d1, () => window.__paw.S.coins === 111, null, 6000), 'Restore loads the backup');
  ok(await until(d1, () => window.__pawCloud.status().state === 'synced', null, 6000) && srv.saves[g1].data.coins === 111, 'the restored backup becomes the newest cloud save');
  ok(srv.backups.some((b) => b.reason === 'before a restore' && b.data.coins === 444), 'the game before the restore is kept as a backup');
  await focus(d2); ok(await until(d2, () => window.__paw.S.coins === 111, null, 8000), 'the other device follows the restore');

  sec('Export / Import save code (round trip)');
  await openCloud(d1); await tap(d1, '[data-cl=export]'); await d1.waitForSelector('#clCodeOut');
  const code = await d1.inputValue('#clCodeOut');
  ok(/^PAWZ?1\.[A-Za-z0-9+/=]+\.[0-9a-f]{8}$/.test(code), `export makes a save code with a checksum (${code.length} chars)`);
  await phoneCheck(d1, 'iPhone 15 export');
  await tap(d1, '[data-cl=copy]'); ok(await until(d1, () => /Copied|copy it by hand/.test((document.querySelector('#clCode .clmsg') || {}).textContent || ''), null, 3000), 'Copy button answers');
  const before = await ev(d1, () => JSON.parse(localStorage.getItem('pawhaven_proto_v1')));
  use(d1); await t.closeX(); await change(d1, { coins: 5 }); await t.sleep(200);
  await openCloud(d1); await tap(d1, '[data-cl=import]'); await d1.waitForSelector('#clCodeIn');
  await d1.fill('#clCodeIn', code.slice(0, -3) + 'zzz'); await tap(d1, '[data-cl=doImport]');
  ok(await until(d1, () => /broken|isn't/.test((document.querySelector('#clCode .clmsg') || {}).textContent || ''), null, 3000), 'a damaged code is refused (checksum)');
  ok((await ev(d1, () => window.__paw.S.coins)) === 5, 'a refused code changes nothing');
  await d1.fill('#clCodeIn', code); await tap(d1, '[data-cl=doImport]');
  ok(await until(d1, () => window.__paw.S.coins === 111 && document.getElementById('modal').hidden, null, 6000), 'import loads the save and closes Settings');
  const after = await ev(d1, () => JSON.parse(localStorage.getItem('pawhaven_proto_v1')));
  ok(after.dogs[0].id === before.dogs[0].id && after.dogs[0].name === before.dogs[0].name && after.coins === before.coins, 'round trip: the same dog and coins');
  ok((await ev(d1, () => JSON.parse(localStorage.getItem('pawhaven_proto_v1_backup') || '{}').coins)) === 5, 'import backed the old game up locally');
  ok(await until(d1, () => window.__pawCloud.status().state === 'synced', null, 6000) && srv.backups.some((b) => b.reason === 'before an import' && b.data.coins === 5), 'import backed the old game up in the cloud and pushed the new one');
  use(d1); ok(await t.waitToast(/Save code loaded/), 'import toast');

  sec('device 3: register after the guest login ended on the Worker makes a new account with this save');
  const d3 = await device('d3', 'iPhone 15'); await adopt(d3, { sex: 'boy' });
  ok(await until(d3, () => window.__pawCloud.status().state === 'synced', null, 8000), 'device 3 guest save is in the cloud');
  const g3 = await uidOf(d3), name3 = await ev(d3, () => window.__paw.S.dog.name);
  srv.endSessions(g3);
  await openCloud(d3); await tap(d3, '[data-cl=reg]'); await d3.waitForSelector('#clPw2');
  await d3.fill('#clEmail', 'pawhaven-test-cloud-1@example.com'); await d3.fill('#clPw', 'biscuits9'); await d3.fill('#clPw2', 'biscuits9'); await tap(d3, '[data-cl=doReg]');
  ok(await until(d3, () => window.__pawCloud.CL.regPath === 'new', null, 6000), 'a new account is made');
  const a3 = await uidOf(d3);
  ok(a3 && a3 !== g3 && srv.users.find((u) => u.id === a3).email === 'pawhaven-test-cloud-1@example.com', 'a new account user was made');
  ok(await until(d3, () => window.__pawCloud.status().state === 'synced', null, 6000) && srv.saves[a3] && srv.saves[a3].data.dogs[0].name === name3, 'the guest\'s save became the account\'s save');
  ok(!!srv.saves[g3], 'the guest row is left behind, untouched');
  ok((await ev(d3, () => window.__paw.S.dog.name)) === name3, 'the game on device 3 is unchanged');
  use(d3); await t.closeX();

  sec('device 4: log in on a device that has a guest save, plus the nudge');
  const d4 = await device('d4', 'Pixel 7'); await adopt(d4, { sex: 'girl' });
  ok(await until(d4, () => window.__pawCloud.status().state === 'synced', null, 8000), 'device 4 guest save is in the cloud');
  await change(d4, { careDays: 3 }); use(d4);
  ok(await t.waitToast(/Make an account to keep .+ safe on every device/), 'after 3 care days: the one-time nudge');
  await change(d4, { careDays: 4 }); await t.sleep(900);
  ok((await ev(d4, () => window.__toasts.filter((x) => /Make an account/.test(x)).length)) === 1, 'the nudge shows only once');
  const guest4 = await ev(d4, () => window.__paw.S.dog.name);
  await openCloud(d4); await tap(d4, '[data-cl=login]'); await d4.waitForSelector('#clPw');
  await d4.fill('#clEmail', 'mochi@example.com'); await d4.fill('#clPw', 'pupper456'); await tap(d4, '[data-cl=doLogin]');
  ok(await until(d4, (n) => window.__paw.S.dog.name === n && document.getElementById('modal').hidden, name1, 6000), 'the account\'s save loads, no question asked');
  ok(srv.backups.some((b) => b.user_id === g1 && b.reason === 'guest save before sign-in' && b.data.dogs[0].name === guest4), 'the guest save went to the account\'s backups');
  use(d4); ok(await t.waitToast(/Logged in/), 'login toast');
  await openCloud(d4); await tap(d4, '[data-cl=logout]'); await d4.waitForSelector('.confirm .yes'); await tap(d4, '.confirm .yes');
  ok(await until(d4, () => !window.__pawCloud.CL.uid && /Logged out/.test(document.getElementById('clBody').textContent), null, 4000), 'log out works');
  ok((await ev(d4, () => window.__paw.S.dog.name)) === name1 && !!(await ev(d4, () => localStorage.getItem('pawhaven_proto_v1'))), 'the local save stays after log out');
  use(d4); await t.closeX();

  sec('the artifact copy: cloud off, local save kept');
  const d5 = await device('d5', 'iPhone 15', { host: 'abc.claudeusercontent.com' }); await adopt(d5, { sex: 'boy' });
  const name5 = await ev(d5, () => window.__paw.S.dog.name);
  ok((await st(d5)).state === 'off' && (await ev(d5, () => window.__pawCloud.CL.why)) === 'artifact', 'cloud is off on the claude.ai copy');
  ok(srv.calls.filter((c) => c.page === d5).length === 0, 'the artifact copy never calls the cloud');
  await openCloud(d5);
  ok(/Cloud save works on the web version\./.test(await d5.textContent('#clStat')), 'Settings says: Cloud save works on the web version.');
  await phoneCheck(d5, 'artifact copy Settings');
  await tap(d5, '[data-cl=export]'); await d5.waitForSelector('#clCodeOut');
  ok(/^PAWZ?1\./.test(await d5.inputValue('#clCodeOut')), 'Export works on the artifact copy too');
  use(d5); await t.closeX(); await change(d5, { coins: 4321 });
  await d5.reload(); await d5.waitForSelector('#tContinue');
  ok((await ev(d5, () => JSON.parse(localStorage.getItem('pawhaven_proto_v1')).coins)) === 4321 && (await ev(d5, () => window.__paw.S && window.__paw.S.dog.name)) === name5, 'the local save is kept across a reload');
  ok(srv.calls.filter((c) => c.page === d5).length === 0, 'still no cloud calls after the reload');

  sec('the test harness (no mock): cloud off, no network');
  const d6 = await device('d6', 'Pixel 7', false);
  ok((await ev(d6, () => window.__pawCloud.status().state)) === 'off' && (await ev(d6, () => window.__pawCloud.CL.why)) === 'harness', 'under the test harness the cloud is off');
  ok(!(await ev(d6, () => !!document.querySelector('script[src*="supabase"]'))) && !(await ev(d6, () => !!localStorage.getItem('pawhaven_cf_auth'))), 'no cloud library and no login on this device');

  sec('offline: the Worker can\'t be reached');
  const d7 = await device('d7', 'iPhone 15', { broken: true }); await adopt(d7, { sex: 'girl' });
  ok(await until(d7, () => window.__pawCloud.status().state === 'offline', null, 6000), 'status: Offline');
  use(d7); ok(await t.waitToast(/Cloud save is offline\. Your game is saved on this device\./), 'the offline message shows');
  await change(d7, { coins: 999 }); await t.sleep(300);
  ok((await ev(d7, () => JSON.parse(localStorage.getItem('pawhaven_proto_v1')).coins)) === 999 && (await ev(d7, () => window.__paw.mode)) === 'yard', 'the game keeps playing and saving locally');


  sec('device 8: a v2.8 Supabase login on this device carries over (same account, same save, no password typed)');
  const su = srv.sb.mkUser({ email: 'old-friend@example.com', password: 'oldfriend1' }), tk = srv.sb.login(su);
  const oldSave = Object.assign({}, srv.saves[g1].data, { coins: 6543 }); oldSave.dogs = oldSave.dogs.map((d) => Object.assign({}, d, { id: 'dogOld8', name: 'Pickle' })); oldSave.dog = oldSave.dogs[0];
  srv.sb.saves[su.id] = { data: oldSave, rev: 12, changed_at: '2026-10-14T09:00:00Z', device: 'iPhone Safari' };
  const at8 = Date.parse('2026-10-14T09:00:00Z');
  const p8 = await t.mk({ device: 'iPhone 15', storage: {
    pawhaven_proto_v1: JSON.stringify(oldSave),
    pawhaven_cloud_v1: JSON.stringify({ rev: 12, changedAt: at8, pushedAt: at8, uid: su.id, dogId: 'dogOld8', nudged: true, owner: su.id, ownerDog: 'dogOld8', ownerAt: at8 }),
    pawhaven_sb_auth: JSON.stringify({ access_token: tk.at, refresh_token: tk.rt, token_type: 'bearer', user: { id: su.id, email: 'old-friend@example.com' } })
  } });
  await t.ctx.exposeBinding('__clSrv', (src, m, u, b, a) => srv.handle(src.page, m, u, b, a)); await t.ctx.addInitScript(mockInit, {}); srv.pages.add(p8);
  const nUsers8 = srv.users.length;
  await p8.goto(URL); await p8.waitForSelector('#tContinue, #tNew, #tGuest');
  ok(await until(p8, (id) => window.__pawCloud.CL.uid === id && !window.__pawCloud.CL.anon, su.id, 8000), 'the Supabase login carried over: the same user id, logged in');
  ok(srv.users.length === nUsers8 + 1 && srv.users.find((u) => u.id === su.id).email === 'old-friend@example.com', 'one account made on the Worker, with the same email (no guest)');
  ok(srv.saves[su.id] && srv.saves[su.id].rev === 12 && srv.saves[su.id].data.coins === 6543, 'the Supabase save came over with its rev');
  ok(await ev(p8, () => !localStorage.getItem('pawhaven_sb_auth') && !!JSON.parse(localStorage.getItem('pawhaven_cf_auth')).token), 'the old login is removed, the new one is kept');
  ok(await ev(p8, () => !!document.querySelector('#tContinue')) && (await ev(p8, () => JSON.parse(localStorage.getItem('pawhaven_proto_v1')).coins)) === 6543, 'the game on this device is unchanged: Continue');
  await change(p8, { coins: 6544 });
  ok(await until(p8, () => window.__pawCloud.status().state === 'synced', null, 8000) && srv.saves[su.id].data.coins === 6544 && srv.saves[su.id].rev === 13, 'the next change syncs to the same account (rev 13)');
  ok(!srv.pwIs(su.id, 'oldfriend1'), 'no password is stored until the player types it');

  sec('device 9: one email, one account: "Make an account" with an old Supabase email is refused, logging in moves it over');
  const so = srv.sb.mkUser({ email: 'returning@example.com', password: 'returning1' }); srv.legacy('returning@example.com');
  const save9 = Object.assign({}, oldSave, { coins: 9191 }); save9.dogs = oldSave.dogs.map((d) => Object.assign({}, d, { id: 'dogOld9', name: 'Noodle' })); save9.dog = save9.dogs[0];
  srv.sb.saves[so.id] = { data: save9, rev: 3, changed_at: '2026-10-13T00:00:00Z', device: 'Mac Safari' };
  const d9 = await device('d9', 'Pixel 7'); await adopt(d9, { sex: 'girl' });
  ok(await waitSynced(d9), 'device 9 guest save is in the cloud'); const guest9 = await ev(d9, () => window.__paw.S.dog.name);
  await openCloud(d9); await tap(d9, '[data-cl=reg]'); await d9.waitForSelector('#clPw2');
  await d9.fill('#clEmail', 'Returning@example.com'); await d9.fill('#clPw', 'returning1'); await d9.fill('#clPw2', 'returning1'); await tap(d9, '[data-cl=doReg]');
  ok(await until(d9, () => /This email already has an account\. Log in, or use Forgot your password\./.test((document.querySelector('#clBox .clmsg') || {}).textContent || ''), null, 6000), 'refused, kindly: "This email already has an account. Log in, or use Forgot your password."');
  ok(!srv.users.some((u) => u.email === 'returning@example.com') && (await ev(d9, () => window.__pawCloud.CL.anon)), 'no account made, still a guest');
  await tap(d9, '[data-cl=back]'); await tap(d9, '[data-cl=login]'); await d9.waitForSelector('#clPw');
  await d9.fill('#clEmail', 'returning@example.com'); await d9.fill('#clPw', 'returning1'); await tap(d9, '[data-cl=doLogin]');
  ok(await until(d9, () => window.__paw.S && window.__paw.S.coins === 9191 && document.getElementById('modal').hidden, null, 8000), 'logging in moves the old account over and loads its save');
  ok((await uidOf(d9)) === so.id && !(await ev(d9, () => window.__pawCloud.CL.anon)), 'logged in to the moved account (same user id)');
  ok(srv.backups.some((b) => b.user_id === so.id && b.reason === 'guest save before sign-in' && b.data.dogs[0].name === guest9), 'the guest game went to that account\'s backups');

}, { timeout: 300000 });
