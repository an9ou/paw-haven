// Records the extra REAL gameplay for the ~90 s overview trailer (the rest is reused from video45/footage45.js), frame by frame at full iPhone 15 resolution (1179 x 1977, 30 fps).
// The page clock is frozen (Playwright clock) and stepped 1/30 s per frame, so the footage is smooth even though each screenshot is slow.
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/trailer90/footage90.js <outdir> [autumn|newyear] [only-clip]
const path = require('path'), fs = require('fs');
const root = path.join(__dirname, '..', '..', '..', '..');
const { run } = require(path.join(root, 'game', 'test_lib'));
const OUT = path.resolve(process.argv[2] || 'footage45'), SEASON = process.argv[3] || 'autumn', ONLY = process.argv[4] || null;
const URL = 'file://' + path.join(root, 'game', 'test_merged.html');
const FPS = 30, DT = 1000 / FPS;
const DATE = SEASON === 'newyear' ? '2027-01-03T10:00:00' : '2026-10-20T10:00:00';
fs.mkdirSync(OUT, { recursive: true });

run('trailer90_' + SEASON, async (t) => {
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
    const head = (b) => p().click(`.heads button[aria-label$="${b}"]`);
    // ---------- meet: tap through all 14 dogs in the shelter; each says its own line. marks = the frame of each tap ----------
    if (want('meet')) {
      await t.boot({ device: 'iPhone 15' }); await p().addStyleTag({ content: styles });
      await p().click('#tNew'); await p().waitForSelector('#aAdopt'); await t.sleep(600);
      const order = [['Dachshund', 3.2], ['Corgi', 3.1], ['Shiba Inu', 3.8], ['Husky', 3.1], ['Golden Retriever', 0.5], ['Pug', 0.5], ['Chihuahua', 0.5], ['Greyhound', 0.5], ['Beagle', 0.5], ['Poodle', 0.5], ['Border Collie', 0.5], ['Samoyed', 0.5], ['French Bulldog', 0.5], ['Shelter Mutt', 3.8]];
      let tt = 0.15; const acts = [], marks = [];
      for (const [b, d] of order) { const at0 = tt; acts.push([at0, () => head(b)]); marks.push([b, Math.round(at0 * FPS)]); tt += d; }
      await rec('meet', tt + 0.3, acts);
      const ip = path.join(OUT, 'meet', 'info.json'), inf = JSON.parse(fs.readFileSync(ip)); inf.marks = marks; fs.writeFileSync(ip, JSON.stringify(inf));
    }
    // ---------- start: the title screen, New game, pick a pup, Adopt, the name ----------
    await t.boot({ device: 'iPhone 15' }); await p().addStyleTag({ content: styles }); await t.sleep(800);
    if (want('start')) await rec('start', 5.6, [[1.1, () => p().click('#tNew')], [2.6, () => head('Dachshund')], [3.7, () => p().click('#aBoy')], [4.4, () => p().click('#aAdopt')]]);
    else { await p().click('#tNew'); await p().waitForSelector('#aAdopt'); await head('Dachshund'); await p().click('#aBoy'); await p().click('#aAdopt'); }
    await p().waitForSelector('#nOk'); await p().click('#nOk'); await t.intro(); await t.calm();
    await t.patch({ bond: { level: 10, pts: 3300 }, coins: 3000, stats: { hunger: 80, happy: 85, energy: 90, clean: 90 } });
    await ev(() => { const P = window.__paw, S = P.S; S.dog.name = 'Noodle'; P.addDog({ key: 'corgi', sex: 'male', months: 20 }, 'Biscuit'); P.addDog({ key: 'golden', sex: 'female', months: 20 }, 'Sunny'); P.addDog({ key: 'shiba', sex: 'female', months: 20 }, 'Mochi');
      S.careOff = {}; S.dogs.forEach((d) => { d.stats.energy = 95; d.stats.happy = 80; }); });
    await t.dev(async () => {}); await p().addStyleTag({ content: styles });
    // ---------- home: the house with the pack ----------
    if (want('home')) { await setEnv('day', 'sunny'); await t.home('house'); await t.sleep(1500); await quiet(); await rec('home', 3.2, [[0.3, () => rub(12)]]); await t.home('yard'); }
    // ---------- photo: photo mode, the crayon postcard ----------
    if (want('photo')) { await setEnv('day', 'sunny'); await at('yard'); await t.sleep(1200); await quiet(); await rec('photo', 3.6, [[0.4, () => ev(() => window.__paw.ph.open())]]); await ev(() => window.__paw.ph.close()); await t.calm(); }
    // ---------- packdusk: the pack in the yard at dusk, Mt. Fuji behind ----------
    if (want('packdusk')) { await setEnv('dusk', 'sunny'); await at('yard'); await t.sleep(1500); await quiet(); await rec('packdusk', 5.5, [[0.4, () => rub(12)], [2.2, () => rub(12)]]); }
  } else {
    // ---------- newyear: the pine and the kites in the yard, then the Fortune box in the Square ----------
    await t.newGame({ sex: 'boy', device: 'iPhone 15', head: '~Dachshund' }, { bond: { level: 10, pts: 3300 }, coins: 3000, stats: { hunger: 85, happy: 85, energy: 90, clean: 90 }, dog: { name: 'Noodle' } });
    await t.dev(async () => {}); await p().addStyleTag({ content: styles });
    await setEnv('day', 'sunny'); await at('yard'); await t.sleep(900); await quiet();
    if (want('newyear')) await rec('newyear', 2.6, [[0.3, () => rub(12)]]);
    await at('square'); await t.sleep(900); await quiet();
    if (want('fortune')) await rec('fortune', 2.6, []);
  }
}, { device: 'iPhone 15', clock: false, season: 'auto', fest: 'auto', packCare: true, prefs: { hwTest: true, jpTest: true, wnTest: true }, timeout: 1800000 });
