// Launch screenshots of the real game (iPhone 15 profile at DPR 3, date 2026-10-20 so the Halloween pop-up is open, Japan scenery on).
//   build first: node game/build.js && node game/harness.js merged
//   NODE_PATH=/opt/node-tools/node_modules node brand/instagram/launch/shots.js <outdir>
const path = require('path'), fs = require('fs');
const { run } = require(path.join(__dirname, '..', '..', '..', 'game', 'test_lib'));
const OUT = path.resolve(process.argv[2] || 'shots'); fs.mkdirSync(OUT, { recursive: true });
run('launch_shots', async (t) => {
  const { ev } = t, p = () => t.p;
  await t.newGame({ sex: 'boy', device: 'iPhone 15', head: '~Dachshund' }, { bond: { level: 10, pts: 3300 }, coins: 3000, stats: { hunger: 85, happy: 90, energy: 90, clean: 90 }, dog: { name: 'Noodle' } });
  await ev(() => { const S = window.__paw.S; S.inv.clothes.push('Witch Hat', 'Candy Corn Bandana'); });
  await p().addStyleTag({ content: '#devBtn{opacity:0!important}#toasts{display:none!important}' });
  await t.dev(async () => {}); // builds the dev panel once
  const clean = () => ev(() => { document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); const b = document.getElementById('bubble'); if (b) b.hidden = true; });
  const setEnv = (time, weather) => ev(([a, b]) => { for (const [id, v] of [['dvTime', a], ['dvWeather', b]]) { const e = document.getElementById(id); e.value = v; e.dispatchEvent(new Event('change')); } }, [time, weather]);
  const shot = async (n, ms) => { await clean(); await t.sleep(ms || 1200); await p().screenshot({ path: path.join(OUT, n + '.png') }); console.log('shot', n); };
  const at = async (place) => { await ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, place); await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard', place, 8000); await t.calm(); await t.lu(); };
  await setEnv('day', 'sunny'); await at('yard'); await shot('yard_day');
  await setEnv('dusk', 'sunny'); await at('yard'); await shot('yard_dusk');
  await ev(() => { const o = window.__paw.S.outfit; o.head = 'Witch Hat'; o.neck = 'Candy Corn Bandana'; }); await at('yard'); await shot('yard_halloween');
  await ev(() => { const o = window.__paw.S.outfit; o.head = null; o.neck = null; });
  await at('square'); await shot('square_dusk');
  await setEnv('day', 'sunny'); await at('square'); await shot('square_day');
  await setEnv('dusk', 'sunny'); await at('fujihill'); await t.sleep(1500); await p().screenshot({ path: path.join(OUT, 'fujihill_dusk_bubble.png') }); await shot('fujihill_dusk', 800);
  await setEnv('day', 'sunny'); await shot('fujihill_day', 1500);
  await at('yard'); await ev(() => { window.__paw.S.daily.play = false; });
  try { await t.startWalk(); await t.sleep(3500); await shot('walk', 200); } catch (e) { console.log('walk skipped', e.message.split('\n')[0]); }
}, { device: 'iPhone 15', date: '2026-10-20', season: 'auto', fest: 'auto', prefs: { hwTest: true, jpTest: true, wnTest: true }, timeout: 300000 });
