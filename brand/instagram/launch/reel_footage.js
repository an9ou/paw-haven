// Records REAL gameplay clips for the Reel with Chrome's screencast (iPhone 15 profile, DPR 3), as numbered JPEG frames + timestamps.
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/reel_footage.js <outdir>
const path = require('path'), fs = require('fs');
const { run } = require(path.join(__dirname, '..', '..', '..', 'game', 'test_lib'));
const OUT = path.resolve(process.argv[2] || 'footage'); fs.mkdirSync(OUT, { recursive: true });
run('reel_footage', async (t) => {
  const { ev } = t, p = () => t.p;
  await t.newGame({ sex: 'boy', device: 'iPhone 15', head: '~Dachshund' }, { bond: { level: 10, pts: 3300 }, coins: 3000, house: 'Royal Castle Kennel', stats: { hunger: 85, happy: 85, energy: 90, clean: 90 }, dog: { name: 'Noodle' } });
  await ev(() => { const o = window.__paw.S.outfit; o.eyes = null; });
  await t.dev(async () => {});
  await p().addStyleTag({ content: '#devBtn{opacity:0!important}#toasts{display:none!important}' });
  const setEnv = (time, weather) => ev(([a, b]) => { for (const [id, v] of [['dvTime', a], ['dvWeather', b]]) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('change')); } }, [time, weather]);
  const at = async (place) => { await ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, place); await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard', place, 8000); await t.calm(); await t.lu(); };
  const hide = () => ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); });
  async function clip(name, secs, act) {
    const dir = path.join(OUT, name); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    const cdp = await t.ctx.newCDPSession(p()), ts = []; let n = 0;
    cdp.on('Page.screencastFrame', (e) => { fs.writeFileSync(path.join(dir, String(n++).padStart(5, '0') + '.jpg'), Buffer.from(e.data, 'base64')); ts.push(e.metadata.timestamp); cdp.send('Page.screencastFrameAck', { sessionId: e.sessionId }).catch(() => {}); });
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 88, maxWidth: 1179, maxHeight: 1977, everyNthFrame: 1 });
    const t0 = Date.now(); await (act ? act(t0) : Promise.resolve());
    const left = secs * 1000 - (Date.now() - t0); if (left > 0) await t.sleep(left);
    await cdp.send('Page.stopScreencast'); await cdp.detach().catch(() => {});
    fs.writeFileSync(path.join(dir, 'ts.json'), JSON.stringify(ts)); console.log(name, n, 'frames', f1((ts[n - 1] - ts[0])) + 's');
  }
  const f1 = (x) => Math.round(x * 10) / 10;
  // 1. the yard at dusk: Noodle gets a rub
  await setEnv('dusk', 'sunny'); await at('yard'); await hide(); await t.sleep(600);
  await clip('yard', 8, async () => { await t.sleep(1500); const box = await p().locator('#dogHit').boundingBox(); for (let r = 0; r < 5; r++) for (let i = 0; i < 24; i++) { await p().mouse.move(box.x + box.width * (0.3 + 0.4 * (i % 2)), box.y + box.height * 0.4); await t.sleep(25); } });
  // 2. Mt. Fuji Lookout: look at Fuji
  await at('fujihill'); await hide(); await t.sleep(800);
  await clip('fuji', 8, async () => { await t.sleep(1800); await ev(() => { const b = document.querySelector('#placeBtns [data-jp]'); if (b) b.click(); }); });
  // 3. a walk (a few hops)
  await setEnv('day', 'sunny'); await at('yard'); await ev(() => { window.__paw.S.daily.play = false; });
  try { await t.startWalk(); await hide(); await clip('walk', 7, async () => { for (let i = 0; i < 5; i++) { await p().keyboard.press('Space'); await t.sleep(1300); } }); } catch (e) { console.log('walk skipped', e.message.split('\n')[0]); }
  // 4. the house with a pack
  await ev(() => { const P = window.__paw, S = P.S; const ks = ['corgi', 'golden', 'shiba']; let i = 0; while (S.dogs.length < 4) { P.addDog({ key: ks[i++ % 3], sex: i % 2 ? 'male' : 'female', months: 20 }, ['Biscuit', 'Sunny', 'Mochi'][i - 1]); } });
  try { await t.quitWalk && 0; } catch (e) {}
  await t.home('house'); await hide(); await t.sleep(800);
  await clip('house', 5, async () => {});
}, { device: 'iPhone 15', date: '2026-10-20', season: 'auto', fest: 'auto', prefs: { jpTest: true }, timeout: 500000 });
