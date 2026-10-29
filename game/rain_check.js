// Rainy days: who is wet where (rain pinned): the yard, a raincoat, the house, the café, then the weather turning sunny.
//   NODE_PATH=$(npm root -g) node game/rain_check.js   (after node game/build.js + node game/harness.js merged)
const { run, sleep } = require('./test_lib');
run('rain_check', async (t) => {
  const { ev, ok } = t;
  await t.newGame({ sex: 'girl' }, { coins: 500 });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'chow', sex: 'male', months: 3 }, 'Bao'); P.go('yard'); });
  await t.calm(); await t.lu(); await sleep(800);
  const wet = () => ev(() => [...document.querySelectorAll('#dogArt svg.pa-dog')].concat([...document.querySelectorAll('#pack .rm-art svg.pa-dog')]).map((s) => s.classList.contains('pa-d-wet'))); // the leader first, then the pack
  let w = await wet(); ok(w.length >= 2 && w.every(Boolean), 'yard in the rain: every dog wet ' + JSON.stringify(w));
  await ev(() => { const P = window.__paw; P.S.outfit.body = 'Yellow Raincoat'; P.go('yard'); }); await t.calm(); await sleep(800);
  w = await wet(); ok(w[0] === false && w.slice(1).every(Boolean), 'leader in a raincoat stays dry, the pup is wet ' + JSON.stringify(w));
  await ev(() => { const P = window.__paw; P.S.outfit.body = null; P.S.place = 'house'; P.go('yard'); }); await t.calm(); await sleep(800);
  w = await wet(); ok(w.length >= 1 && w.every((x) => !x), 'indoors (the house): dry ' + JSON.stringify(w));
  await ev(() => { const P = window.__paw; P.S.place = 'cafe'; P.go('yard'); }); await t.calm(); await sleep(800);
  w = await wet(); ok(w.length >= 1 && w.every((x) => !x), 'the café: dry ' + JSON.stringify(w));
  await ev(() => { const P = window.__paw; P.S.place = 'yard'; P.go('yard'); }); await t.calm(); await sleep(800);
  await ev(() => { const pr = JSON.parse(localStorage.getItem('pawhaven_prefs_v1') || '{}'); pr.ovrWeather = 'sunny'; localStorage.setItem('pawhaven_prefs_v1', JSON.stringify(pr)); });
  await t.p.reload(); await t.p.waitForSelector('#tNew, #tContinue'); await t.p.click('#tContinue'); await t.calm(); await t.lu(); await sleep(1200);
  w = await wet(); ok(w.length >= 2 && w.every((x) => !x), 'sunny: dry ' + JSON.stringify(w));
}, { weather: 'rain', time: 'day', season: 'autumn' });
