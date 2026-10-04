// PawAudio checks: node test_audio.js
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs');
const URL = 'file://' + path.join(__dirname, 'test.html');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log('[audio]', ...a);
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const errors = [];
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  const S = () => p.evaluate(() => window.PawAudio.state());
  await p.goto(URL); await sleep(300);
  await p.click('#start'); await sleep(1200);
  let s = await S(); log('after start:', s.ctxState, '|', s.variant, '| bpm', s.bpm);

  // scheduler timing: steps vs audio clock
  const a0 = await S(); await sleep(5000); const a1 = await S();
  const dt = a1.time - a0.time, exp = dt * a0.bpm * 4 / 60, got = a1.steps - a0.steps;
  log(`timing: ${dt.toFixed(2)} s audio → ${got} steps (expected ~${exp.toFixed(1)}), late=${a1.late}, resyncs=${a1.resyncs}, voices=${a1.voices}`);

  // rapid-fire every combination (debounce must coalesce)
  const appliedBefore = (await S()).variant;
  await p.evaluate(async () => {
    const A = window.PawAudio;
    for (const pl of A.PLACES) for (const t of A.TIMES) for (const w of A.WEATHERS) { A.setContext({ place: pl, area: pl === 'walk' ? 'beach' : null, time: t, weather: w }); await new Promise((r) => setTimeout(r, 5)); }
    A.setContext({ place: 'yard', area: null, time: 'night', weather: 'rain' });
  });
  await sleep(150); s = await S(); log('right after burst: variant', s.variant === appliedBefore ? '(unchanged, coalesced)' : s.variant, '| pending', s.pending);
  await sleep(4500); s = await S(); log('after a bar:', s.variant, '| layers', JSON.stringify(s.layers), '| amb', JSON.stringify(s.ambience));

  // click through places / times / weathers / areas via the UI
  const ids = [];
  for (const pl of await p.evaluate(() => window.PawAudio.PLACES.filter((x) => x !== 'walk'))) ids.push('#place-' + pl);
  for (const ar of await p.evaluate(() => window.PawAudio.AREAS)) ids.push('#area-' + ar);
  for (const t of ['dawn', 'dusk', 'night', 'day']) ids.push('#time-' + t);
  for (const w of ['cloudy', 'rain', 'snow', 'sunny']) ids.push('#weather-' + w);
  const seen = new Set();
  for (const id of ids) { await p.click(id); await sleep(700); seen.add((await S()).variant); }
  await sleep(3500); s = await S(); seen.add(s.variant);
  log(`UI cycle: ${ids.length} clicks, ${seen.size} distinct variants applied; now: ${s.variant}; bpm ${s.bpm}; prog ${s.prog}; voices ${s.voices}; dropped ${s.dropped}`);

  // volumes + mute
  await p.evaluate(() => window.PawAudio.setVolumes({ master: 0.7, music: 0.3, sfx: 0.9, ambience: 0.2, bogus: 5 }));
  await sleep(500);
  const v = await p.evaluate(() => window.PawAudio.getVolumes()); s = await S();
  log('getVolumes', JSON.stringify(v), '| bus master gain', s.gains.master.toFixed(3));
  await p.evaluate(() => window.PawAudio.setVolumes({ music: 7, ambience: -1 }));
  log('clamped', JSON.stringify(await p.evaluate(() => window.PawAudio.getVolumes())));
  await p.click('#mute'); await sleep(600); s = await S();
  log('muted', await p.evaluate(() => window.PawAudio.isMuted()), '| mute gain', s.gains.mute.toFixed(4));
  await p.click('#mute'); await sleep(600); s = await S();
  log('unmuted', await p.evaluate(() => window.PawAudio.isMuted()), '| mute gain', s.gains.mute.toFixed(4));
  await p.evaluate(() => window.PawAudio.setVolumes({ master: 0.8, music: 0.5, sfx: 0.8, ambience: 0.25 }));

  // duck + stingers + sfx bus
  await p.click('#duck'); await sleep(300); s = await S(); log('duck gain during duck', s.gains.duck.toFixed(3));
  await sleep(2600); s = await S(); log('duck gain after', s.gains.duck.toFixed(3));
  for (const st of ['treasure', 'levelup', 'adopt', 'harvest', 'cooked', 'discover']) { await p.click(`[data-st=${st}]`); await sleep(1500); }
  await p.click('#sfx'); await p.evaluate(() => window.PawAudio.stinger('nope'));
  log('stingers logged', JSON.stringify(await p.evaluate(() => window.PawAudio.stingers)));
  // dog voices: every breed x kind through the UI, the 2-voice cap and the bark duck
  const kinds = await p.evaluate(() => window.PawAudio.BARK_KINDS);
  for (const br of ['Shiba Inu', 'Corgi', 'Golden Retriever', 'Dachshund', 'Husky', 'Shelter Mutt', 'Chihuahua', 'Pug', 'Greyhound', 'Beagle', 'Mystery']) {
    await p.selectOption('#bkBreed', br);
    for (const k of kinds) { await p.click('#bark-' + k); await sleep(br === 'Husky' ? 260 : 60); }
  }
  await sleep(2500);
  await p.evaluate(() => { for (let i = 0; i < 6; i++) window.PawAudio.bark({ breed: 'Corgi', pitch: 1 }, 'alert'); });
  await sleep(60); s = await S(); log('bark spam x6 → active bark voices', s.barkVoices, '| duck gain', s.gains.duck.toFixed(2));
  await sleep(2000); s = await S(); log('after barks → active', s.barkVoices, '| duck', s.gains.duck.toFixed(2), '| total barks played', s.barks);
  log('bark never throws', await p.evaluate(() => { try { window.PawAudio.bark(null, 'nonsense', { distance: 'x' }); window.PawAudio.bark(); window.PawAudio.bark({ breed: 7 }, 'howl', { volume: 9 }); return true; } catch (e) { return String(e); } }));
  // idempotent init
  log('init idempotent', await p.evaluate(() => { const c = window.PawAudio.ctx; window.PawAudio.init(); window.PawAudio.init(); return c === window.PawAudio.ctx; }));

  // visibility: fake hidden -> suspend, visible -> resume
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(900); s = await S(); log('hidden →', s.ctxState, '| vis gain', s.gains.vis.toFixed(3));
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); });
  await sleep(1500); const r0 = await S(); await sleep(2000); const r1 = await S();
  log('visible →', r1.ctxState, '| vis gain', r1.gains.vis.toFixed(3), '| steps advancing', r1.steps - r0.steps, '| late', r1.late);

  await p.screenshot({ path: path.join(__dirname, 'test_bench.png') });

  // offline renders
  log('defaults', JSON.stringify(await p.evaluate(() => { const v = window.PawAudio.getVolumes(); return v; })));
  const renders = [
    { file: 'paw_yard_day.wav', seconds: 20, segments: [{ at: 0, ctx: { place: 'yard', time: 'day', weather: 'sunny' } }], stingers: [{ at: 13, name: 'treasure' }] },
    { file: 'paw_night_rain_to_fetch.wav', seconds: 22, segments: [{ at: 0, ctx: { place: 'yard', time: 'night', weather: 'rain' } }, { at: 9, ctx: { place: 'fetch', time: 'day', weather: 'sunny' } }] },
    { file: 'paw_walk_beach_dusk.wav', seconds: 20, segments: [{ at: 0, ctx: { place: 'walk', area: 'beach', time: 'dusk', weather: 'sunny' } }] },
    { file: null, label: 'sleep night', seconds: 15, segments: [{ at: 0, ctx: { place: 'sleep', time: 'night', weather: 'sunny' } }] },
    { file: null, label: 'market day (worst case, all volumes 1.0)', seconds: 15, vols: { master: 1, music: 1, ambience: 1 }, segments: [{ at: 0, ctx: { place: 'market', time: 'day', weather: 'sunny' } }], stingers: [{ at: 6, name: 'levelup' }] },
    { file: 'paw_house_night_rain.wav', seconds: 15, segments: [{ at: 0, ctx: { place: 'house', time: 'night', weather: 'rain' } }] },
    { file: 'paw_garden_summer_day.wav', seconds: 16, segments: [{ at: 0, ctx: { place: 'garden', time: 'day', weather: 'sunny', _month: 6 } }], stingers: [{ at: 5, name: 'harvest' }, { at: 10, name: 'discover' }] },
    { file: null, label: 'garden rain dusk', seconds: 12, segments: [{ at: 0, ctx: { place: 'garden', time: 'dusk', weather: 'rain' } }] },
    { file: 'paw_kitchen_night_rain.wav', seconds: 16, segments: [{ at: 0, ctx: { place: 'kitchen', time: 'night', weather: 'rain' } }], stingers: [{ at: 8, name: 'cooked' }] },
    { file: null, label: 'park hangout day', seconds: 12, segments: [{ at: 0, ctx: { place: 'park', time: 'day', weather: 'sunny' } }] },
    { file: null, label: 'ambience only: river rain dawn', seconds: 12, vols: { master: 0.8, music: 0, ambience: 0.25 }, segments: [{ at: 0, ctx: { place: 'walk', area: 'river', time: 'dawn', weather: 'rain' } }] }
  ];
  for (const r of renders) {
    const res = await p.evaluate((o) => window.PawAudio._render(o), { seconds: r.seconds, segments: r.segments, stingers: r.stingers, vols: r.vols, wav: !!r.file });
    if (r.file) { fs.writeFileSync(path.join(__dirname, r.file), Buffer.from(res.wav, 'base64')); delete res.wav; }
    log('render', r.file || r.label, JSON.stringify(res));
  }
  const bk = await p.evaluate(() => window.PawAudio._renderBarks({ wav: true }));
  fs.writeFileSync(path.join(__dirname, 'barks_demo.wav'), Buffer.from(bk.wav, 'base64')); delete bk.wav;
  const byKind = {}; bk.items.forEach((i) => { (byKind[i.kind] = byKind[i.kind] || []).push(i.loud50msDb); });
  log('barks_demo.wav', JSON.stringify({ seconds: Math.round(bk.items[bk.items.length - 1].at + 2), peak: bk.peak, clipped: bk.clippedSamples, maxItemPeak: Math.max(...bk.items.map((i) => i.peak)) }));
  log('bark loudness spread per kind (dB, min..max across breeds):', Object.entries(byKind).map(([k, v]) => k + ' ' + Math.min(...v) + '..' + Math.max(...v)).join(' | '));
  const v17 = await p.evaluate(() => window.PawAudio._renderBarks({ breeds: ['chihuahua', 'pug', 'greyhound', 'beagle'], wav: true }));
  fs.writeFileSync(path.join(__dirname, 'barks_demo_v17.wav'), Buffer.from(v17.wav, 'base64'));
  log('barks_demo_v17.wav', JSON.stringify({ seconds: Math.round(v17.items[v17.items.length - 1].at + 2), peak: v17.peak, clipped: v17.clippedSamples }));
  const far = await p.evaluate(() => window.PawAudio._renderBarks({ breeds: ['golden'], kinds: ['woof'], distance: 0.8 }));
  log('distant golden woof (distance 0.8):', far.items[0].loud50msDb, 'dB vs near', bk.items.find((i) => i.breed === 'golden' && i.kind === 'woof').loud50msDb);
  log('console errors/warnings:', errors.length ? errors : 'none');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
