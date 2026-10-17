// Records the REAL gameplay for the 45 s promo video, frame by frame at full iPhone 15 resolution (1179 x 1977, 30 fps).
// The page clock is frozen (Playwright clock) and stepped 1/30 s per frame, so the footage is smooth even though each screenshot is slow.
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/video45/footage45.js <outdir> [autumn|winter] [only-clip]
const path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..', '..', '..', '..');
const { run } = require(path.join(root, 'game', 'test_lib'));
const OUT = path.resolve(process.argv[2] || 'footage45'), SEASON = process.argv[3] || 'autumn', ONLY = process.argv[4] || null;
const URL = 'file://' + path.join(root, 'game', 'test_merged.html');
const FPS = 30, DT = 1000 / FPS;
const DATE = SEASON === 'winter' ? '2026-12-12T10:00:00' : '2026-10-20T10:00:00';
fs.mkdirSync(OUT, { recursive: true });

run('video45_' + SEASON, async (t) => {
  const { ev } = t, p = () => t.p;
  // boot with the Playwright clock instead of the harness's fake Date
  t.boot = async (o) => { await t.mk(Object.assign({}, o, { clock: false })); await t.p.clock.install({ time: new Date(DATE) }); await t.p.goto(URL); await t.p.waitForSelector('#tNew, #tContinue'); return t.p; };
  const want = (n) => !ONLY || ONLY.split(',').includes(n);
  // record `secs` of game time; acts = [[atSeconds, async fn]]; stop(frameIndex) may end early
  async function rec(name, secs, acts = [], stop, after = 2.6) {
    const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const now = await p().evaluate(() => Date.now()); await p().clock.pauseAt(new Date(now + 50));
    const todo = acts.slice().sort((a, b) => a[0] - b[0]); let n = 0, extra = null;
    const N = Math.round(secs * FPS);
    for (; n < N; n++) {
      const tt = n / FPS; while (todo.length && todo[0][0] <= tt) { const a = todo.shift(); try { await a[1](); } catch (e) { console.log('  act failed', name, e.message.split('\n')[0]); } }
      await p().clock.runFor(DT);
      await p().screenshot({ path: path.join(dir, String(n).padStart(5, '0') + '.jpg'), type: 'jpeg', quality: 90 });
      if (stop && extra == null && await stop(n)) extra = n;
      if (extra != null && n - extra >= Math.round(after * FPS)) { n++; break; }
    }
    await p().clock.resume();
    fs.writeFileSync(path.join(dir, 'info.json'), JSON.stringify({ frames: n, event: extra }));
    console.log('clip', name, n, 'frames', extra != null ? 'event at frame ' + extra : '');
  }
  const setEnv = (time, weather) => ev(([a, b]) => { for (const [id, v] of [['dvTime', a], ['dvWeather', b]]) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('change')); } }, [time, weather]);
  const at = async (place) => { await ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, place); await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard', place, 8000); await t.calm(); await t.lu(); };
  const quiet = () => ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const b = document.getElementById('bubble'); if (b) b.hidden = true; });
  const rub = async (rounds) => { const box = await p().locator('#dogHit').boundingBox(); for (let i = 0; i < rounds; i++) await p().mouse.move(box.x + box.width * (0.3 + 0.4 * (i % 2)), box.y + box.height * 0.4); };
  const styles = '#devBtn{opacity:0!important}#toasts{display:none!important}';

  if (SEASON === 'autumn') {
    // ---------- 1. adopt: the shelter's carousel of crayon heads ----------
    await t.boot({ device: 'iPhone 15' });
    await p().addStyleTag({ content: styles });
    await p().click('#tNew'); await p().waitForSelector('#aAdopt'); await t.sleep(600);
    const head = (b) => p().click(`.heads button[aria-label$="${b}"]`);
    if (want('adopt')) await rec('adopt', 5.6, [[0.5, () => head('Corgi')], [2.3, () => head('Golden Retriever')], [3.5, () => head('Pug')], [4.5, () => head('Dachshund')]]);
    await head('Dachshund'); await p().click('#aBoy'); await p().click('#aAdopt'); await p().waitForSelector('#nOk'); await p().click('#nOk'); await t.intro(); await t.calm();
    await t.patch({ bond: { level: 10, pts: 3300 }, coins: 3000, inv: { food: { 'Pupcake': 5, 'Basic Kibble': 5 }, seeds: { carrot: 3, peas: 3, pumpkin: 2 } }, stats: { hunger: 40, happy: 80, energy: 70, clean: 30 } });
    await ev(() => { window.__paw.S.dog.name = 'Noodle'; });
    await t.dev(async () => {}); await p().addStyleTag({ content: styles });
    await setEnv('day', 'sunny'); await at('yard'); await t.sleep(800); await quiet();
    // ---------- 2. care: feed, pet, bath, nap ----------
    if (want('feed')) { await rec('feed', 2.2, [[0.1, () => p().click('[data-act=feed]')], [0.7, () => p().click('[data-food="Pupcake"]')]]); await t.sleep(1500); await t.calm(); }
    await t.home('yard'); await quiet();
    if (want('pet')) await rec('pet', 2.0, [0.05, 0.4, 0.75, 1.1, 1.45].map((s) => [s, () => rub(14)]));
    await t.home('yard'); await quiet();
    if (want('bath')) {
      await p().click('[data-act=care]'); await t.waitPop(true); await p().click('[data-care=bath]'); await t.untilMode('bath'); await t.sleep(400);
      await rec('bath', 2.0, Array.from({ length: 16 }, (_, i) => [0.1 + i * 0.12, () => p().keyboard.press(' ')]));
      await t.until(() => window.__paw.mode === 'yard', null, 12000); await t.calm();
    }
    await t.home('yard'); await quiet();
    if (want('nap')) { await rec('nap', 2.0, [[0.1, () => p().click('[data-act=care]')], [0.5, () => p().click('[data-care=sleep]')]]); await ev(() => { window.__paw.S.sleeping = false; window.__paw.go('yard'); }); await t.calm(); }
    // ---------- 3. walk: hops and coins ----------
    await ev(() => { const S = window.__paw.S; S.daily.play = false; S.stats.energy = 100; });
    if (want('walk')) {
      await t.startWalk(); await quiet();
      await rec('walk', 4.4, [0.3, 1.25, 2.2, 3.15].map((s) => [s, async () => { await p().keyboard.down('Space'); await t.sleep(60); await p().keyboard.up('Space'); }]));
      await t.quitWalk(true);
    }
    // ---------- 4. Mt. Fuji Lookout at dusk: arrive, Noodle's line ----------
    await setEnv('dusk', 'sunny'); await at('yard'); await quiet();
    if (want('fuji')) await rec('fuji', 10, [[0.2, () => ev(() => { const S = window.__paw.S; S.place = 'fujihill'; window.__paw.go('yard'); })]], async () => ev(() => { const b = document.getElementById('bubble'); return !!b && !b.hidden && /tunnel/.test(b.textContent); }), 4.3);
    await setEnv('day', 'sunny'); await at('yard'); await quiet();
    // ---------- 5. garden and kitchen ----------
    if (want('garden')) {
      await ev(() => window.__paw.go('garden')); await t.until(() => document.querySelectorAll('.pg-plot').length === 6); await t.sleep(600);
      await rec('garden', 2.4, [[0.4, () => p().locator('.pg-plot').nth(1).tap()]]);
      await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
    }
    if (want('kitchen')) {
      await t.home('house'); await ev(() => window.__paw.go('kitchen')); await t.until(() => !!document.querySelector('.pk-root')); await t.sleep(700);
      await rec('kitchen', 2.4, []); await t.home('yard');
    }
    // ---------- 6. a family: parents and puppies in the yard ----------
    if (want('puppies')) {
      await ev(() => { const P = window.__paw, S = P.S; P.addDog({ key: 'dachs', sex: 'female', months: 24 }, 'Udon'); P.addDog({ key: 'dachs', sex: 'male', months: 3 }, 'Soba'); P.addDog({ key: 'dachs', sex: 'female', months: 3 }, 'Ramen'); });
      await setEnv('day', 'sunny'); await at('yard'); await t.sleep(1200); await quiet();
      await rec('puppies', 2.6, [[0.1, () => rub(12)], [0.9, () => rub(12)]]);
    }
    // ---------- 7. Halloween: the witch hat at dusk ----------
    if (want('halloween')) {
      await ev(() => { const S = window.__paw.S; S.inv.clothes.push('Witch Hat', 'Candy Corn Bandana'); S.outfit.head = 'Witch Hat'; S.outfit.neck = 'Candy Corn Bandana'; });
      await setEnv('dusk', 'sunny'); await at('square'); await t.sleep(900); await quiet();
      await rec('halloween', 2.2, [[0.2, () => rub(12)]]);
      await ev(() => { const S = window.__paw.S; S.outfit.head = null; S.outfit.neck = null; });
    }
    // ---------- 8. the bump: walk with no jumping until a log; the line is one of the game's own bump lines ----------
    if (want('bonk')) {
      await setEnv('day', 'sunny'); await at('yard');
      for (let tries = 0; tries < 15; tries++) {
        await ev(() => { const S = window.__paw.S; S.daily.play = false; S.stats.energy = 100; });
        await ev(() => { const PW = window.PawWalk; if (!PW.__wrapped) { const st = PW.start; PW.start = (...a) => (window.__wctl = st(...a)); PW.__wrapped = true; } });
        await t.startWalk();
        await t.until(() => { const m = window.__wctl; const pk = m && m._peek ? m._peek() : null; return !!(pk && pk.obs.length); }, null, 25000);
        const first = await ev(() => { const pk = window.__wctl._peek(); return pk.obs.slice().sort((a, b) => a.ex0 - b.ex0)[0].name; });
        if (first === 'log') { console.log('  first obstacle: log'); break; }
        console.log('  first obstacle', first, '- retry'); await t.quitWalk(true); await t.calm();
      }
      // the game picks the bump line at random from 7 lines; show "I meant to do that." (one of them) so it matches the voice-over
      await ev(() => { const LINES = ['Bonk. The log wins this round.', 'Ow. Dignity: minus one.', 'That came out of nowhere. (It did not.)', 'Everything is fine. Keep walking.', 'Ow! Rude object.', 'Who put THAT there?'];
        const b = document.querySelector('.pw-say'); new MutationObserver(() => { if (LINES.includes(b.textContent)) b.textContent = 'I meant to do that.'; }).observe(b, { childList: true, characterData: true, subtree: true }); });
      await quiet();
      await rec('bonk', 12, [], async () => ev(() => { const b = document.querySelector('.pw-say'); return !!b && !b.hidden && /meant to do that/.test(b.textContent); }), 2.4);
      await t.quitWalk(true);
    }
  } else {
    // ---------- winter: snow on the yard, the snowdog, the Ugly Sweater Contest ----------
    await t.newGame({ sex: 'boy', device: 'iPhone 15', head: '~Dachshund' }, { bond: { level: 10, pts: 3300 }, coins: 3000, stats: { hunger: 85, happy: 85, energy: 90, clean: 90 }, dog: { name: 'Noodle' } });
    await t.dev(async () => {}); await p().addStyleTag({ content: styles });
    await ev(() => { const S = window.__paw.S; S.inv.clothes.push('Very Ugly Sweater'); S.outfit.body = 'Very Ugly Sweater'; });
    await setEnv('day', 'snow'); await at('yard'); await t.sleep(900); await quiet();
    for (let i = 0; i < 4; i++) { await ev(() => window.__paw.wn && window.__paw.wn.dog()); await t.sleep(500); }
    await quiet();
    if (want('snow')) await rec('snow', 2.4, [[0.2, () => rub(12)]]);
    await setEnv('dusk', 'sunny'); await at('square'); await t.sleep(900); await quiet();
    if (want('sweater')) await rec('sweater', 2.6, [[0.6, () => ev(() => window.__paw.wn.contestOpen())]]);
  }
}, { device: 'iPhone 15', clock: false, season: 'auto', fest: 'auto', prefs: { hwTest: true, jpTest: true, wnTest: true }, timeout: 1800000 });
