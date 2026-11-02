// v2.19 "Friends first": CLEAN footage for the launch Reel (owner, 2 Nov 2026: "without the game buttons, make it clean, introduce the upcoming update").
// The same v2.19 build, Worker mock and slow clock as capture_friends.js, but every game bar, button, menu, sheet, toast and speech bubble is hidden,
// so the yard fills the whole phone screen (the game lays the view out full height once the top bar and the bottom bar are gone). Only the scenes:
//   yard   Noodle at home                     visit  Sunny Biscuit's yard, Waffles and Honey get petted (hearts, happy poses)
//   note   the paw-print stamp lands on their path       gift   the wrapped gift flies off from their yard
//   walk   the run with Waffles beside Mochi (the runner's own buttons, timer and hints hidden)
// The sheets for the note and the gift are used with the sheet hidden (their buttons are clicked from script).
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/capture_clean.js <game checkout> <outdir>
const path = require('path'), fs = require('fs');
const DEV = path.resolve(process.argv[2] || '.');
const OUT = path.resolve(process.argv[3] || 'friends_clean'); fs.mkdirSync(OUT, { recursive: true });
const { run, URL } = require(path.join(DEV, 'game', 'test_lib'));
const { mockInit, slowInit } = require('./capture_friends.js');
const OUR_NAME = (process.env.OUR_NAME || '25,6').split(',').map(Number);
const GAP = +(process.env.GAP || 110);
// the game's own interface, hidden for the clean look (the view then fills the screen; a resize lets the game lay it out again)
const CLEAN_CSS = '#hud,#bar,#dock,#toasts,#devBtn,#placeBtns,#status,#phPeek,#ddWish,#msBtn,#bubble,.hint,.coach,'
  + '.pw-hud,.pw-ctrls,.pw-tut,.pw-panel,.pw-legend,.pw-btn,.pw-card,.pw-notes,.pw-badge,.pw-nl,.pw-mini,.pw-hint{display:none!important}';
const HIDE_MODAL = '#modal{opacity:0!important}';

run('friends_clean', async (t) => {
  const { ev } = t, p = () => t.p;
  const day = new Date(t.pageNow()).toISOString().slice(0, 10);
  await t.mk({ device: 'iPhone 15', prefs: { frTest: true } });
  await t.ctx.addInitScript(mockInit, { code: 'DOG-XXXXX', day });
  await t.ctx.addInitScript(slowInit);
  await p().goto(URL);
  await p().waitForSelector('#tNew, #tContinue, #tGuest');
  if (await p().locator('#tGuest').count()) { await p().click('#tGuest'); await p().waitForSelector('#tNew'); }
  await t.adopt({ head: '~Dachshund', sex: 'boy' }); // Noodle, our narrator (as in the 45 s promo and the profile picture)
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000, stats: { hunger: 85, happy: 85, energy: 90, clean: 90 }, dog: { name: 'Noodle' } });
  await ev(() => { window.__paw.S.coolUntil = 1e12; }); // not "too hot" on a sunny midday
  await t.calm();
  const SUNNY = 'sunnybiscuitxxxxxxxxxx';
  const clean = await p().addStyleTag({ content: CLEAN_CSS });
  const relayout = async () => { await ev(() => window.dispatchEvent(new Event('resize'))); await p().waitForTimeout(900); };
  await relayout();
  let cdp = null, rate = 1, modalHid = null;
  const wait = (ms) => p().waitForTimeout(ms / rate);
  async function setRate(x) { if (!cdp) { cdp = await t.ctx.newCDPSession(p()); await cdp.send('Animation.enable'); } await ev((x) => window.__setRate(x), x); await cdp.send('Animation.setPlaybackRate', { playbackRate: x }); rate = x; }
  async function still(name) { await p().waitForTimeout(600); await p().screenshot({ path: path.join(OUT, name + '.png') }); console.log('still', name); }
  async function clip(name, secs, act, r) {
    const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await setRate(r || 0.2); const ts = []; let n = 0, done = false;
    const v0 = await ev(() => window.__vt());
    const shoot = (async () => { const vp = p().viewportSize();
      while (!done) { const v = await ev(() => window.__vt()); if (v - v0 > secs * 1000) break;
        const s = await cdp.send('Page.captureScreenshot', { format: 'jpeg', quality: 92, clip: { x: 0, y: 0, width: vp.width, height: vp.height, scale: 3 } });
        fs.writeFileSync(path.join(dir, String(n++).padStart(5, '0') + '.jpg'), Buffer.from(s.data, 'base64')); ts.push((v - v0) / 1000); } })();
    if (act) await act();
    await shoot; done = true; await setRate(1);
    fs.writeFileSync(path.join(dir, 'ts.json'), JSON.stringify(ts)); console.log('clip', name, n, 'frames', ts[n - 1].toFixed(2) + 's');
  }
  const press = (sel) => ev((s) => { const e = document.querySelector(s); if (!e) throw new Error('no ' + s); e.click(); }, sel);

  // 0. home
  await still('yard');
  // owner, 2 Nov 2026: Noodle drinks from the water bowl in the opening shot (eat pose fixed in d488723: head straight down to the bowl, in profile)
  await ev(() => { window.__paw.S.waterAt = -1e9; });
  await clip('yard', 3.4, () => ev(() => window.__paw.feed('Fresh Water')), 0.17);

  // set up Friends off camera: the name, then Sunny Biscuit by code (the sheet itself is never filmed)
  await ev((nm) => { window.__paw.S.dc.name = nm; }, OUR_NAME);
  await ev(() => window.__paw.fr.open());
  await t.until(() => !!document.getElementById('frOk'), null, 6000); await press('#frOk');
  await t.until(() => !!document.getElementById('frCard'), null, 8000);
  await ev((c) => { c.split('').forEach((ch, i) => { const e = document.getElementById('frCh' + i); e.value = ch; e.dispatchEvent(new Event('input', { bubbles: true })); }); }, '4K7PM');
  await press('#frAdd');
  await t.until(() => document.querySelectorAll('.fr-row').length === 1, null, 6000);

  // 1. the visit, the dogs standing apart
  await press(`.fr-row[data-fid="${SUNNY}"] [data-fr="visit"]`);
  await t.until(() => window.__paw.mode === 'fryard' && document.getElementById('modal').hidden, null, 6000);
  await relayout();
  // the dogs take random spots: visit again until all three stand apart AND none stands on the paw stamp's spot (FR_STAMP, x 452..512 on the path),
  // so the stamp is seen when it lands (their dogs only: ours is hidden for the stamp shot)
  for (let k = 0; k < +(process.env.TRIES || 60); k++) {
    const sp = await ev(() => { const d = window.__paw.fr.scene().dogs; let m = 1e9; for (let i = 0; i < d.length; i++) for (let j = i + 1; j < d.length; j++) m = Math.min(m, Math.hypot(d[i].x - d[j].x, (d[i].y - d[j].y) * 1.5));
      return { gap: m, stamp: Math.min(...d.map((v) => (v.mine || v.y < 450 ? 999 : Math.abs(v.x - 482)))), // a dog further back (feet above the stamp) never covers it; ours is hidden for that shot
        at: d.map((v) => [Math.round(v.x), Math.round(v.y), v.mine ? 'me' : v.name]) }; });
    console.log('visit spots, smallest gap', Math.round(sp.gap), 'nearest dog to the stamp', Math.round(sp.stamp), JSON.stringify(sp.at)); if (sp.gap >= +(process.env.GAP || 100) && sp.stamp >= +(process.env.STAMP || 75)) break;
    await press('#frHomeBtn'); await t.untilMode('yard'); await ev((fid) => window.__paw.fr.visit(fid), SUNNY);
    await t.until(() => window.__paw.mode === 'fryard', null, 6000); await relayout();
  }
  await still('visit');
  const petDog = (i) => ev((i) => { const el = document.querySelectorAll('#frDogs .frdog:not(.fr-mine)')[i]; if (el) el.dispatchEvent(new MouseEvent('click', { bubbles: true })); }, i);
  await clip('visit', 7.6, async () => { await wait(500); await petDog(0); await wait(1900); await petDog(1); await wait(2600); await petDog(0); }, 0.17);

  // 2. the paw print: the note picked with the sheet hidden; the stamp lands on their path
  // the stamp sits at the left edge of the phone's view of their yard, where our own dog's tail covers it: our dog sits this one shot out
  modalHid = await p().addStyleTag({ content: HIDE_MODAL + '#frDogs .fr-mine{display:none!important}' });
  await press('#frNoteBtn');
  await t.until(() => document.querySelectorAll('#modal [data-frnote]').length === 12, null, 4000);
  await clip('note', 4.2, async () => { await wait(400); await press('#modal [data-frnote="0"]'); }, 0.15);
  await still('note_left');

  // 3. the gift: the Bone-shaped Biscuit sent with the sheet hidden; the wrapped gift flies off
  await press('#frGiftBtn');
  await t.until(() => document.querySelectorAll('#modal [data-frgift]').length > 3, null, 4000);
  const bone = await ev(() => { const b = [...document.querySelectorAll('#modal [data-frgift]')].find((e) => /Bone-shaped/.test(e.textContent)); return b ? b.getAttribute('data-frgift') : '0'; });
  await press(`#modal [data-frgift="${bone}"]`);
  await t.until(() => !!document.querySelector('#modal .confirm .yes'), null, 4000);
  await clip('gift', 4.4, async () => { await wait(300); await press('#modal .confirm .yes'); }, 0.15);
  await ev((el) => el.remove(), modalHid);

  // 4. the walk with Waffles: picked on the route screen (not filmed), then the run, clean
  await press('#frHomeBtn'); await t.untilMode('yard'); await t.calm();
  await ev((el) => el.remove(), clean); // the route screen and the run's start as the game shows them (not filmed)
  await ev(() => { const S = window.__paw.S; S.sleeping = false; S.walks = 3; (S.dogs || []).forEach((d) => { d.stats.energy = 95; }); window.__paw.go('routes'); });
  await p().waitForSelector('#rtStart', { state: 'attached' }); await p().waitForTimeout(400);
  await press(`#frWalkRow [data-frg="${SUNNY}:0"]`);
  await p().click('#rtStart'); await t.walkGate(true);
  await t.until(() => !!document.querySelector('.pw-fol.pw-friend'), null, 10000);
  await p().addStyleTag({ content: CLEAN_CSS }); await relayout(); await p().waitForTimeout(600);
  await still('walk');
  await clip('walk', 6.2, null, 0.17);
  console.log('done', OUT);
}, { time: 'day', weather: 'sunny', season: 'autumn', timeout: 900000 });
