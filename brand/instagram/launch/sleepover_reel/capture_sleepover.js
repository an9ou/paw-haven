// The 26 Nov 2026 "Noodle's first sleepover" Reel (v2.33 Helping paws; docs/marketing/SLEEPOVER_REEL.md): clean captures from a fresh worktree of
// origin/main (game/test_merged.html: node game/build.js && node game/harness.js merged), with the test harness (game/test_lib.js) and the Friends
// cloud mock (game/fr_mock.js mockInit({ hp: true }), as game/test_v233_helps.js). Nothing in main changes. Page date 26 Nov 2026 (the feature is live).
// Two games, two players (both made up: the mock's friend names, two Dog Card words each):
//   ME      Noodle's family, friend name "Fluffy Button" (the suite's ME, name [3, 4]): Noodle the Dachshund (boy) in the Autumn Scarf.
//   FRIEND  "Sunny Biscuit" (the mock's first friend, name [0, 0]): Honey the Golden (girl), the Cozy Cottage, a Bird Bath and a Flower Barrel out.
// 1. ME: Noodle's card dog (frYard, the snapshot's leader), so the friend's game gets the real sleep act.
// 2. FRIEND: their yard snapshot (frYard, with today's hp: something growing, Honey's wish a game of ball); then the acts from Fluffy Button (bowl,
//    water, wish, sleep), claimed as the Worker hands them over: the help letter in the mailbox, the guest Noodle in their yard at night (the tag,
//    the card, a pet), the letter's "Say thanks" (note 12) and its toast; the yard at night and in the morning, as the game draws it.
// 3. ME: a visit to Sunny Biscuit's yard with that snapshot (the strip, the bowl, the can, the wish bubble), the three helps (toasts, the full bowl),
//    the Sleepover button, sheet, confirm and toast; then the next morning (the recipe's night is over): Noodle home (toast), the diary page (title,
//    lines, picture), the real Share this moment PNG (the share sheet's preview blob); Sunny Biscuit's thank-you paw print postcard; my yard at dawn.
// 4. The drawings, animated on the FROZEN CLOCK (../frozen_clock.js): Noodle and Honey in every pose used, 30 frames a loop at exactly 1000/30 ms.
//   NODE_PATH=$(npm root -g) [PAW_LANG=zh-Hans] node brand/instagram/launch/sleepover_reel/capture_sleepover.js <main checkout> <outdir>
// PAW_LANG=zh-Hans (the RedNote cut): both games in Simplified Chinese (the harness's language pin), so the toasts, the tag, the letters and the
// share picture's line are the game's zh-Hans words; the drawings and the scenes are the same art.
const path = require('path'), fs = require('fs');
const DEV = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'sleep_caps'); fs.mkdirSync(OUT, { recursive: true });
const { run, URL } = require(path.join(DEV, 'game', 'test_lib'));
const { mockInit } = require(path.join(DEV, 'game', 'fr_mock'));
const { freezeClock, stepClock, releaseClock } = require('../frozen_clock.js');
const ME = { fid: 'ownerxxxxxxxxxxxxxxxxx', code: 'DOG-23456', name: [3, 4] }, SUNNY = 'sunnybiscuitxxxxxxxxxx', SUNNY_NAME = [0, 0];
const OUTFIT = { neck: 'Autumn Scarf' };
const LANG = process.env.PAW_LANG || 'en';
const HONEY_N = 45; // DC_PET_NAMES[45] 'Honey' (checked below)
const NOODLE_POSES = ['idle', 'sit', 'happy', 'bow', 'jump', 'sleep'], HONEY_POSES = ['idle', 'sit', 'happy', 'jump', 'sleep'];
const CLEAN = '#devBtn,#toasts,.sheet-grab,#modal .xbtn,#modal .x{display:none!important}'
  + 'body *:not(#modal):not(#modal *){visibility:hidden!important}#modal,#modal *{visibility:visible}'
  + '#modal,#stage,html,body{background:transparent!important;backdrop-filter:none!important;box-shadow:none}';
run('sleepover_capture', async (t) => {
  const { ev } = t, p = () => t.p, facts = {};
  const closeAll = () => ev(() => { for (let i = 0; i < 5; i++) { const m = document.getElementById('modal'); if (!m || m.hidden) break; const x = m.querySelector('.panel .x'); if (x) x.click(); else break; } });
  const settle = async () => { await ev(() => { const S = window.__paw.S; S.newsSeen = '9.99'; S.wbPend = null; S.awayGiftISO = ''; S.backISO = ''; window.__paw.saveNow(); }); await p().waitForTimeout(900); await closeAll(); };
  const start = async (key, sex, name, prefs) => {
    await t.mk({ map215: true, ground: true, time: 'day', season: 'autumn', weather: 'sunny', prefs: Object.assign({ frTest: true, ddTest: true, hpTest: true }, prefs || {}) });
    await t.ctx.addInitScript(mockInit, { hp: true });
    await p().goto(URL); await p().waitForSelector('#tNew, #tContinue, #tGuest, #tPlay');
    if (await p().locator('#tGuest').count()) { await p().click('#tGuest'); await p().waitForSelector('#tNew'); }
    await t.adopt({ head: key, sex });
    await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 70, happy: 80, energy: 90, clean: 90 }, dog: { name } });
    await t.calm(); await t.lu(); await settle();
    if (LANG !== 'en') { // adopted in English (the picker's labels), then the game switched to the language and reloaded with the save (as visitor_reel)
      await ev((l) => { window.__paw.S.lang = l; window.__paw.saveNow(); const K = 'pawhaven_prefs_v1'; let pr = {}; try { pr = JSON.parse(localStorage.getItem(K) || '{}') || {}; } catch (e) { pr = {}; } pr.lang = l; localStorage.setItem(K, JSON.stringify(pr)); }, LANG);
      await t.reloadKeepingSave(); await p().waitForSelector('#tContinue'); await p().click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu(); await settle();
      if ((await ev(() => document.documentElement.lang)) !== LANG) throw new Error('the game is not in ' + LANG);
    }
    await t.until(() => !!(window.__paw && window.__paw.hp && window.__paw.fr && window.__frSrv && window.__paw.sh), null, 8000);
  };
  let cdp = null, style = null;
  const clean = async (on, extra) => { if (on && !style) style = await p().addStyleTag({ content: CLEAN + (extra || '') }); if (!on && style) { await style.evaluate((e) => e.remove()); style = null; } };
  const shoot = async (sel, name, scale) => { // a game screen, clean (nothing else on the page), transparent around it
    await p().waitForTimeout(700);
    const r = await ev((s) => { const e = document.querySelector(s); if (!e) return null; const q = e.getBoundingClientRect(); return { x: q.left, y: q.top, width: q.width, height: q.height }; }, sel);
    if (!r) throw new Error('no ' + sel);
    await cdp.send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });
    const s = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: Object.assign({}, r, { scale: scale || 3 }) });
    fs.writeFileSync(path.join(OUT, name + '.png'), Buffer.from(s.data, 'base64'));
    const txt = (await ev((s) => { const e = document.querySelector(s); return e.innerText || e.textContent || ''; }, sel)).replace(/\s+/g, ' ').trim(); facts[name] = { txt, w: Math.round(r.width), h: Math.round(r.height) };
    console.log('shot', name, Math.round(r.width) + 'x' + Math.round(r.height), JSON.stringify(txt));
  };
  // the scene as the game draws it now (svg.world), with the dogs, the effects and the help props left out (the build draws those)
  const scene = async (name) => {
    const r = await ev(() => { const s = document.querySelector('#view svg.world'); const c = s.cloneNode(true);
      ['#pack .rmdog', '#zzz', '#fx', '#ballLayer', '#messG', '#visitorG', '#yvHost', '#dogG', '#dogPos', '#dogHit', '#frDogs', '#hpG', '#hpTop', '#frStampG', '#hpGuests', '#hpTags', '.hp-prop', '.sl-guest'].forEach((q) => c.querySelectorAll(q).forEach((e) => e.remove()));
      const left = [...c.querySelectorAll('#pack > *')].map((e) => (e.id || e.getAttribute('class') || e.tagName));
      return { svg: c.outerHTML, vb: s.getAttribute('viewBox'), place: window.__paw.S.place, mode: window.__paw.mode, left }; });
    console.log('  #pack keeps', JSON.stringify(r.left));
    fs.writeFileSync(path.join(OUT, name + '.svg'), r.svg); facts['scene_' + name] = { vb: r.vb, place: r.place, mode: r.mode }; console.log('scene', name, r.vb, r.place, r.mode);
    await p().screenshot({ path: path.join(OUT, 'dbg_' + name + '.png') });
  };
  const toasts = () => ev(() => window.__toasts.splice(0));
  const en = JSON.parse(fs.readFileSync(path.join(DEV, 'game', 'i18n', 'en.json'), 'utf8')), L = JSON.parse(fs.readFileSync(path.join(DEV, 'game', 'i18n', LANG + '.json'), 'utf8'));
  facts.lang = LANG;
  facts.honeyName = await (async () => { const src = fs.readFileSync(path.join(DEV, 'game', 'src', '40_dogcards.js'), 'utf8'); const m = /const DC_PET_NAMES = (\[[\s\S]*?\]);/.exec(src); const L = Function('return ' + m[1])(); if (L[HONEY_N] !== 'Honey' || L[1] !== 'Noodle') throw new Error('the card names moved'); return L[HONEY_N]; })();

  // ======== 1. ME: Noodle and his card dog ========
  await start('~Dachshund', 'boy', 'Noodle');
  await ev((o) => { window.__paw.S.dog.outfit = Object.assign({}, window.__paw.S.dog.outfit || {}, o); window.__paw.saveNow(); }, OUTFIT);
  await ev(([me]) => { const s = window.__frSrv; s.me = me; s.events = []; s.friends = []; }, [ME]);
  await ev(() => window.__paw.hp.load());
  const noodleCard = await ev(() => window.__paw.hp.yard().dogs[0]);
  facts.noodleCard = noodleCard; console.log('Noodle card', JSON.stringify(noodleCard));
  const meCtx = t.ctx, meP = t.p;

  // ======== 2. FRIEND: Sunny Biscuit and Honey ========
  await start('~Golden Retriever', 'girl', 'Honey');
  cdp = await t.ctx.newCDPSession(p());
  await ev(([sunny, sname, me, card]) => { const s = window.__frSrv; s.me = { fid: sunny, code: 'DOG-4K7PM', name: sname }; s.events = []; s.acts = [];
    s.friends = [{ fid: me.fid, name: me.name, dogs: [card], seen: 'today', sent: { pet: false, note: false, gift: false, walk: false } }]; }, [SUNNY, SUNNY_NAME, ME, noodleCard]);
  await ev(() => window.__paw.hp.load());
  // their yard: the Cozy Cottage, a Bird Bath and a Flower Barrel out (placed as a player places them), carrots and peas growing, Honey wishing for ball
  await ev(() => { const P = window.__paw, S = P.S; S.house = 'Cozy Cottage'; S.houses = Array.from(new Set([].concat(S.houses || [], ['Cozy Cottage'])));
    S.decor = S.decor || {}; for (const n of ['Bird Bath', 'Flower Barrel']) { S.decor[n] = Object.assign(S.decor[n] || {}, { got: '2026-11-20', out: true }); try { S.decor[n].at = P.ho.freeSpot(n); } catch (e) { /* default spot */ } }
    S.gkEarly = true; const pl = S.garden.plots; pl.forEach((q) => { q.crop = null; q.g = 0; }); pl[0].crop = 'carrot'; pl[0].g = 0.4; pl[1].crop = 'peas'; pl[1].g = 0.5;
    P.hp.snap(); const W = S.dd && S.dd.wish; if (W) W.w[S.dog.id] = { k: 'ball', a: null, done: 0 }; P.saveNow(); });
  await t.home(); await p().waitForTimeout(800); await closeAll();
  const snap = await ev(() => window.__paw.hp.yard());
  facts.snapshot = snap; console.log('Sunny Biscuit snapshot', JSON.stringify(snap));
  if (!snap.hp || snap.hp.w !== 1 || !(snap.hp.g > 0)) throw new Error('the snapshot has no ball wish or nothing growing: ' + JSON.stringify(snap.hp));
  facts.friendName = await ev(() => { const L = window.__paw.dc.lists; return L.a[0] + ' ' + L.b[0]; });
  facts.meName = await ev((n) => { const L = window.__paw.dc.lists; return L.a[n[0]] + ' ' + L.b[n[1]]; }, ME.name);
  // the acts from Fluffy Button, as the Worker hands them over (GET /friends/inbox?hp=1): the three helps and the sleepover
  await toasts();
  await ev(([me, card]) => { const s = window.__frSrv, day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10), from = { fid: me.fid, name: me.name };
    s.acts = [{ id: 901, from, kind: 'bowl', data: {}, day, claimed: false }, { id: 902, from, kind: 'water', data: {}, day, claimed: false }, { id: 903, from, kind: 'wish', data: { w: 1 }, day, claimed: false }, { id: 904, from, kind: 'sleep', data: { dog: card }, day, claimed: false }]; }, [ME, noodleCard]);
  await ev(() => window.__paw.hp.inbox());
  await t.until(() => window.__frSrv.claimBodies.length > 0, null, 6000); await p().waitForTimeout(800);
  facts.friendToasts = await toasts(); console.log('friend toasts', JSON.stringify(facts.friendToasts));
  facts.guests = await ev(() => window.__paw.hp.sl.guests()); facts.friendHp = await ev(() => { const h = window.__paw.S.hp; return { host: h.host, n: h.n }; });
  facts.letters = await ev(() => (window.__paw.S.mail || []).filter((m) => m && (/^hp_/.test(m.id) || m.hpHelp)).map((m) => ({ id: m.id, title: m.title, text: m.text, ps: m.ps, kind: m.kind })));
  console.log('letters', JSON.stringify(facts.letters));
  // the guest in their yard, at night
  await ev(() => window.__paw.yv.env('time', 'night')); await t.home(); await p().waitForTimeout(4500); await closeAll(); // the first meeting plays out
  await ev(() => window.__paw.hp.sl.draw());
  facts.guestDrawn = await ev(() => window.__paw.hp.sl.drawn());
  facts.guestTag = await ev(() => [...document.querySelectorAll('#hpTags .sl-tag')].map((e) => e.textContent.trim()));
  facts.guestAria = await ev(() => [...document.querySelectorAll('#hpGuests [aria-label]')].map((e) => e.getAttribute('aria-label')));
  console.log('guest', JSON.stringify(facts.guestTag), JSON.stringify(facts.guestAria));
  await p().screenshot({ path: path.join(OUT, 'dbg_friend_night_guest.png') });
  // the tag chip as the game draws it
  await clean(true, '#hpTags,#hpTags *{visibility:visible!important}'); await shoot('#hpTags .sl-tag', 'guest_tag', 3); await clean(false);
  await scene('friend_night');
  // the guest card and the pet
  const gid = facts.guests[0] && facts.guests[0].id; if (!gid) throw new Error('no guest');
  await ev((id) => window.__paw.hp.sl.card(id), gid); await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel'), null, 4000);
  await clean(true); await shoot('#modal .panel', 'guest_card'); await clean(false);
  await toasts(); await ev((id) => window.__paw.hp.sl.pet(id), gid); await p().waitForTimeout(900);
  facts.petToasts = await toasts(); facts.petCard = await ev(() => { const m = document.querySelector('#modal:not([hidden]) .panel'); return m ? m.innerText.replace(/\s+/g, ' ').trim() : ''; });
  console.log('pet', JSON.stringify(facts.petToasts), JSON.stringify(facts.petCard));
  await closeAll();
  // the help letter in the mailbox, its Say thanks, the toast
  await ev(() => window.__paw.yv.env('time', 'dawn')); await t.home(); await p().waitForTimeout(1500); await closeAll();
  await scene('friend_dawn');
  const lid = facts.letters.find((l) => /^hp_help_/.test(l.id)); if (!lid) throw new Error('no help letter');
  facts.mailKeys = await ev(() => Object.keys(window.__paw).filter((k) => /mail|mb/i.test(k)));
  await ev((id) => { const P = window.__paw; if (typeof P.openMailbox === 'function') P.openMailbox(id); else if (P.mb && P.mb.open) P.mb.open(id); else document.querySelector('#mailboxG, [data-hot="mailbox"]').dispatchEvent(new MouseEvent('click', { bubbles: true })); }, lid.id);
  await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel'), null, 4000); await p().waitForTimeout(600);
  await p().screenshot({ path: path.join(OUT, 'dbg_friend_mailbox.png') });
  facts.mailbox = await ev(() => document.querySelector('#modal .panel').innerText.replace(/\s+/g, ' ').trim());
  await clean(true); await shoot('#modal .mb-read .letter', 'help_letter', 2.5); await clean(false);
  // Say thanks: note 12 to Fluffy Button
  await toasts(); await ev(() => document.querySelector('#modal [data-hpthx]').click());
  await t.until(() => window.__frSrv.sent.some((x) => x.kind === 'note'), null, 5000); await p().waitForTimeout(700);
  facts.thanksToasts = await toasts(); facts.thanksSent = await ev(() => window.__frSrv.sent.filter((x) => x.kind === 'note'));
  facts.thankedBtn = await ev(() => { const b = document.querySelector('#modal [data-hpthx]'); return b ? b.textContent.trim() : ''; });
  console.log('thanks', JSON.stringify(facts.thanksToasts), JSON.stringify(facts.thanksSent), facts.thankedBtn);
  await closeAll();
  // the mailbox on the yard (its drawn box, scene units) for the letter beat
  facts.mailboxBox = await ev(() => { const svg = document.querySelector('#view > svg.world'), M = svg.getScreenCTM().inverse(), e = document.querySelector('#mailboxG') || document.querySelector('#sceneG [data-hot="mailbox"]'); if (!e) return null;
    const r = e.getBoundingClientRect(), a = new DOMPoint(r.left, r.top).matrixTransform(M), b = new DOMPoint(r.right, r.bottom).matrixTransform(M); return [a.x, a.y, b.x, b.y].map(Math.round); });
  console.log('mailbox box', JSON.stringify(facts.mailboxBox));
  await ev(() => window.__paw.yv.env('time', 'day'));

  // ======== 3. ME: the visit, the helps, the sleepover, the morning ========
  t.ctx = meCtx; t.p = meP; cdp = await t.ctx.newCDPSession(p()); style = null;
  await ev(([sunny, sname, snap]) => { const s = window.__frSrv; s.yardOf[sunny] = JSON.parse(JSON.stringify(snap)); s.acts = []; s.events = [];
    s.friends = [{ fid: sunny, name: sname, dogs: snap.dogs, seen: 'today', sent: { pet: false, note: false, gift: false, walk: false } }]; }, [SUNNY, SUNNY_NAME, snap]);
  await ev(() => window.__paw.hp.load());
  await ev((f) => window.__paw.fr.visit(f), SUNNY);
  if (!(await t.until((f) => window.__paw.mode === 'fryard' && window.__paw.fr.scene().fid === f && window.__paw.hp.visit().on && !!document.querySelector('#view .hp-bowl:not([style*="none"])'), SUNNY, 8000))) throw new Error('no visit');
  await p().waitForTimeout(2500);
  facts.visit = await ev(() => window.__paw.hp.visit());
  facts.chip = await ev(() => document.getElementById('status').innerText.replace(/\s+/g, ' ').trim());
  facts.stripLabel = await ev(() => document.getElementById('hpStrip').innerText.replace(/\s+/g, ' ').trim());
  facts.stripAria = await ev(() => [...document.querySelectorAll('#hpStrip [data-hpk]')].map((b) => b.getAttribute('aria-label')));
  facts.visitBtns = await ev(() => [...document.querySelectorAll('#placeBtns .btn')].map((b) => b.textContent.trim()));
  facts.helpArt = await ev(() => ({ bowl: (document.querySelector('#view .hp-bowl .hp-bowlart') || document.querySelector('#view .hp-bowl') || {}).outerHTML || '', can: (document.querySelector('#view .hp-prop[data-hp="water"]') || {}).outerHTML || '',
    scoop: window.PawArt.FRIENDS && window.PawArt.FRIENDS.scoop ? window.PawArt.FRIENDS.scoop() : '', moon: window.PawArt.FRIENDS && window.PawArt.FRIENDS.moon ? window.PawArt.FRIENDS.moon() : '',
    ball: (() => { try { return window.PawArt.item('Tennis Ball'); } catch (e) { return ''; } })(), spots: window.__paw.hp.spots() }));
  console.log('visit', JSON.stringify(facts.visit), '| chip', facts.chip, '| strip', facts.stripLabel, JSON.stringify(facts.stripAria), '| buttons', JSON.stringify(facts.visitBtns));
  await p().screenshot({ path: path.join(OUT, 'dbg_visit.png') });
  await scene('visit');
  await clean(true, '#hpStrip,#hpStrip *{visibility:visible!important}'); await shoot('#hpStrip', 'strip', 3); await clean(false);
  await clean(true, '#hpWish,#hpWish *{visibility:visible!important}'); await shoot('#hpWish', 'wish', 3); await clean(false);
  await clean(true, '#hpSleepBtn,#hpSleepBtn *{visibility:visible!important}'); await shoot('#hpSleepBtn', 'sleep_btn', 3); await clean(false);
  // the three helps, as the strip's buttons do them
  const help = async (k) => { await toasts(); await ev((k) => window.__paw.hp.tap(k, 'strip'), k); await t.until((k) => window.__frSrv.sent.some((x) => x.kind === k), k, 6000); await p().waitForTimeout(3500); return toasts(); };
  facts.helpToasts = { bowl: await help('bowl') };
  facts.helpArt.bowlFull = await ev(() => (document.querySelector('#view .hp-bowl .hp-bowlart') || document.querySelector('#view .hp-bowl') || {}).outerHTML || '');
  facts.helpToasts.water = await help('water'); facts.helpToasts.wish = await help('wish');
  facts.visitAfter = await ev(() => window.__paw.hp.visit());
  facts.helpSent = await ev(() => window.__frSrv.sent.filter((x) => ['bowl', 'water', 'wish'].includes(x.kind)));
  console.log('helps', JSON.stringify(facts.helpToasts), JSON.stringify(facts.helpSent), '| after', JSON.stringify(facts.visitAfter.bubble));
  await clean(true, '#hpWish,#hpWish *{visibility:visible!important}'); await shoot('#hpWish', 'wish_done', 3); await clean(false);
  await clean(true, '#hpStrip,#hpStrip *{visibility:visible!important}'); await shoot('#hpStrip', 'strip_done', 3); await clean(false);
  // the sleepover: the sheet, the confirm, the toast
  const noodleId = await ev(() => window.__paw.S.dog.id);
  await ev((f) => window.__paw.hp.sl.open(f), SUNNY); await t.until(() => !!document.querySelector('#modal .hp-sleep'), null, 4000);
  await clean(true); await shoot('#modal .panel', 'sleep_sheet', 2.5); await clean(false);
  await ev((id) => document.querySelector(`#modal [data-sldog="${id}"]`).click(), noodleId);
  await t.until((no) => [...document.querySelectorAll('#modal button')].some((b) => b.textContent.trim() === no), L['hp.sleep_no'], 4000);
  await clean(true); await shoot('#modal .panel', 'sleep_confirm', 2.5); await clean(false);
  await toasts(); await ev((go) => [...document.querySelectorAll('#modal button')].find((x) => x.textContent.trim() === go).click(), L['hp.sleep_go']);
  await t.until(() => window.__paw.S.hp.sl.length === 1, null, 6000); await p().waitForTimeout(600);
  facts.sleepToasts = await toasts(); facts.recipe = await ev(() => window.__paw.S.hp.sl[0]); facts.sleepSent = await ev(() => window.__frSrv.sent.filter((x) => x.kind === 'sleep'));
  facts.sleepBtnAfter = await ev(() => { const b = document.getElementById('hpSleepBtn'); return b ? b.textContent.trim() : ''; });
  console.log('sleepover', JSON.stringify(facts.sleepToasts), JSON.stringify(facts.recipe), facts.sleepBtnAfter);
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard'); await p().waitForTimeout(600); await closeAll();
  // the morning: the night is over (the recipe's day is yesterday, as at the next Japan day), Noodle comes home
  await ev(() => window.__paw.yv.env('time', 'dawn'));
  await ev(() => { const S = window.__paw.S, r = S.hp.sl[0], d = new Date(Date.parse(r.day + 'T00:00:00Z') - 864e5).toISOString().slice(0, 10); r.day = d; S.hp.slDay = d; window.__paw.saveNow(); });
  await toasts(); await ev(() => window.__paw.hp.sl.home()); await p().waitForTimeout(800);
  facts.homeToasts = await toasts(); console.log('home', JSON.stringify(facts.homeToasts));
  await t.home(); await p().waitForTimeout(1200); await closeAll();
  await scene('me_dawn');
  const page = await ev(() => { const S = window.__paw.S, pg = S.dd.diary.find((x) => x && x.sl); return pg ? JSON.parse(JSON.stringify(pg)) : null; });
  if (!page) throw new Error('no sleepover page');
  facts.diary = { page, lines: await ev((pg) => window.__paw.hp.sl.lines(pg), page), title: en['hp.d_title'] };
  console.log('diary', JSON.stringify(facts.diary.lines));
  fs.writeFileSync(path.join(OUT, 'diary_pic.svg'), await ev((sl) => window.__paw.hp.sl.pic(sl), page.sl));
  // the real share picture: Share this moment hands shareDog the yard and the pal; the sheet's preview is the PNG it shares
  await ev((sl) => window.__paw.hp.sl.share(sl), page.sl);
  await t.until(() => !!document.querySelector('#modal .sh-prev img'), null, 10000); await p().waitForTimeout(600);
  const pic = await ev(async () => { const im = document.querySelector('#modal .sh-prev img'), b = await (await fetch(im.src)).blob(), bm = await createImageBitmap(b), buf = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    return { w: bm.width, h: bm.height, b64: btoa(s), rec: window.__paw.sh.rec(), title: (document.querySelector('#modal .panel h2') || {}).textContent || '' }; });
  fs.writeFileSync(path.join(OUT, 'share_pic.png'), Buffer.from(pic.b64, 'base64')); facts.share = { w: pic.w, h: pic.h, rec: pic.rec, title: pic.title };
  console.log('share', JSON.stringify(facts.share));
  await closeAll();
  // the diary page as the Journal shows it
  try { await ev(() => { const b = [...document.querySelectorAll('button')].find((x) => /Journal/.test(x.textContent) && x.offsetParent); b.click(); }); await p().waitForTimeout(600);
    await ev(() => document.querySelector('[data-jt="diary"]').click()); await t.until(() => !!document.querySelector('#modal .dd-page'), null, 4000); await p().waitForTimeout(500);
    await p().screenshot({ path: path.join(OUT, 'dbg_diary.png') });
    await clean(true); await shoot('#modal .dd-page', 'diary_page', 2.5); await clean(false); } catch (e) { console.log('no diary shot', e.message); }
  await closeAll();
  // Sunny Biscuit's thank-you paw print, as it reaches me
  await ev(([sunny, sname]) => { const s = window.__frSrv, day = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); s.events = [{ id: 77, from: { fid: sunny, name: sname }, kind: 'note', data: { i: 12 }, day, claimed: false }]; }, [SUNNY, SUNNY_NAME]);
  await toasts(); await ev(() => window.__paw.hp.inbox()); await p().waitForTimeout(1200);
  facts.thxToasts = await toasts(); facts.thxMail = await ev(() => (window.__paw.S.mail || []).filter((m) => m && m.frPaw).map((m) => ({ id: m.id, title: m.title, text: m.text, ps: m.ps })));
  console.log('thank-you', JSON.stringify(facts.thxToasts), JSON.stringify(facts.thxMail));
  await ev(() => document.querySelector('#mailboxG, #sceneG [data-hot="mailbox"]').dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await t.until(() => !!document.querySelector('#modal .mb-read .letter'), null, 4000);
  const thx = facts.thxMail.find((m) => (m.text || '') === L['data.fr_notes.12']); if (thx) await ev((id) => { const b = document.querySelector(`#modal [data-mail="${id}"]`); if (b) b.click(); }, thx.id);
  await p().waitForTimeout(600); await p().screenshot({ path: path.join(OUT, 'dbg_me_mailbox.png') });
  await clean(true); await shoot('#modal .mb-read .letter', 'thanks_letter', 2.5); await clean(false); await closeAll();
  facts.shownNames = { me: await ev(() => window.__paw.S.fr && window.__paw.S.fr.name), letters: facts.letters && facts.letters.map((l) => l.title) };
  facts.en = Object.fromEntries(Object.entries(en).filter(([k]) => /^(hp\.|nw\.v233|fr_notes\.12|sh\.moment|dd\.chip_done)/.test(k)));

  // ======== 4. the drawings, animated on the frozen clock: one loop (30 frames) of each pose ========
  const draws = [];
  for (const pose of NOODLE_POSES) for (const facing of ['left', 'right']) draws.push({ who: 'noodle', key: 'dachs', pose, facing, o: { pose, facing, outfit: OUTFIT } });
  for (const pose of HONEY_POSES) for (const facing of ['left', 'right']) draws.push({ who: 'honey', key: 'golden', pose, facing, o: { pose, facing } });
  await ev(() => { const h = document.createElement('div'); h.id = 'vrHost'; h.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:400px;z-index:99999;background:#fff'; document.body.appendChild(h); });
  const t0 = await freezeClock(p());
  const out = {}; let base = Math.ceil(t0) + 1000;
  for (const D of draws) {
    const svg = await ev(([key, o]) => { const s = window.PawArt.dog(key, o); document.getElementById('vrHost').innerHTML = s; return s; }, [D.key, D.o]);
    if (!svg.includes('pa-pose-' + D.pose)) throw new Error(D.who + ' has no ' + D.pose + ' drawing');
    const vis = [];
    for (let n = 0; n < 31; n++) {
      await stepClock(p(), base + n * 1000 / 30);
      vis.push(await ev(() => { const h = document.getElementById('vrHost'), fr = [...h.querySelectorAll('[class*="pa-d-f"]')].filter((e) => /\bpa-d-f\d\b/.test(e.getAttribute('class')));
        const other = document.getAnimations().filter((a) => a.effect && a.effect.target && h.contains(a.effect.target) && !/\bpa-d-f\d\b/.test(a.effect.target.getAttribute('class') || ''));
        if (other.length) return { err: 'other animations: ' + other.map((a) => a.animationName || a.id).join(',') };
        return fr.map((e) => +getComputedStyle(e).opacity); }));
    }
    if (vis.some((v) => v.err)) throw new Error(D.who + ' ' + D.pose + ': ' + vis.find((v) => v.err).err);
    if (JSON.stringify(vis[30]) !== JSON.stringify(vis[0])) throw new Error(D.who + ' ' + D.pose + ' does not loop in 1 s: ' + JSON.stringify(vis));
    base += 2000;
    out[D.who + '_' + D.pose + '_' + D.facing] = { who: D.who, key: D.key, pose: D.pose, facing: D.facing, svg, vis: vis.slice(0, 30), step: '1000/30 ms, frozen clock' };
  }
  await releaseClock(p());
  console.log('drawings', Object.keys(out).length, 'loops of 30 frames');
  fs.writeFileSync(path.join(OUT, 'draw.json'), JSON.stringify(out));
  fs.writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(facts, null, 1));
}, { date: process.env.CAP_DATE || '2026-11-26', timeout: 400000, season: 'autumn', weather: 'sunny' });
