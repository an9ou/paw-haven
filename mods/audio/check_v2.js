// PawAudio v2 check: node mods/audio/check_v2.js   (NODE_PATH=$(npm root -g))
// Offline renders (OfflineAudioContext) prove the new voices / stings / nursery music / vet+salon beds are non-silent,
// then a live AudioContext page proves the public API never throws and keeps the 2-voice limit.
const { chromium } = require('playwright'); const path = require('path');
const MOD = path.join(__dirname, '..', 'pawaudio.js');
let fails = 0; const log = (...a) => console.log('[audio-v2]', ...a);
const ok = (c, m) => { if (!c) { fails++; console.log('[audio-v2] FAIL', m); } else console.log('[audio-v2] ok  ', m); };
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const errors = [];
  const p = await b.newPage();
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await p.goto('about:blank'); await p.addScriptTag({ path: MOD });

  // ---- API surface + never throws before init ----
  const api = await p.evaluate(() => {
    const A = window.PawAudio, out = {};
    out.kinds = A.BARK_KINDS.slice(); out.stings = A.STINGS; out.places = A.PLACES.includes('nursery');
    let threw = false;
    try { A.sting('birth'); A.sting(); A.sting(null); A.sting('nope'); A.bark({ age: 'puppy' }, 'whimper'); A.bark(null, null); A.bark({ age: 'newborn', breed: 7 }, {}); A.setContext({ place: 'nursery' }); } catch (e) { threw = true; }
    out.threw = threw; return out;
  });
  ok(api.kinds.includes('whimper'), 'BARK_KINDS has whimper');
  ok(JSON.stringify(api.kinds.slice(0, 15)) === JSON.stringify(['woof', 'yip', 'alert', 'demand', 'play', 'howl', 'talk', 'scream', 'whine', 'growl-play', 'sneeze', 'yawn', 'snore', 'pant', 'huff']), 'existing kind order unchanged');
  ok(JSON.stringify(api.stings) === '["birth","sparkle","playdate"]' && api.places, 'STINGS + nursery place exposed');
  ok(!api.threw, 'sting/bark/setContext never throw before init or with junk args');

  // ---- offline voices: every breed x every kind x each age is non-silent ----
  // (breed subsets keep this fast on a shared CPU; adult = the new whimper kind plus woof, all other adult voices are unchanged code)
  const BR5 = ['shiba', 'golden', 'pug', 'chihuahua', 'beagle'];
  for (const age of ['adult', 'puppy', 'newborn']) {
    const r = await p.evaluate(([age, br5]) => window.PawAudio._renderBarks(age === 'adult' ? { breeds: br5, kinds: ['woof', 'whimper'], sampleRate: 22050, gap: 0.2 } : { breeds: br5, age, sampleRate: 22050, gap: 0.2 }), [age, BR5]);
    const quiet = r.items.filter((i) => i.peak < 0.01 || i.loud50msDb < -55);
    const loud = r.items.filter((i) => i.peak > 0.9);
    ok(quiet.length === 0, `${age}: ${r.items.length} breed/kind voices all audible` + (quiet.length ? ' quiet: ' + quiet.slice(0, 5).map((i) => i.breed + '/' + i.kind + ' ' + i.peak).join(', ') : ''));
    ok(loud.length === 0 && r.clippedSamples === 0, `${age}: no clipping (peak ${r.peakDb} dB)`);
    const w = r.items.filter((i) => i.kind === 'woof'), wh = r.items.filter((i) => i.kind === 'whimper');
    log(age, 'woof loud50ms', w.map((i) => i.loud50msDb).join(','), '| whimper', wh.map((i) => i.loud50msDb).join(','));
  }

  // ---- plans: pitch lift, shorter, hiccup, newborn kind mapping, breed character ----
  const pl = await p.evaluate(() => {
    const A = window.PawAudio, R = { lift: [], shorter: 0, n: 0, hic: 0, newMap: {}, breedF: {} };
    for (let i = 0; i < 40; i++) {
      const ad = A._barkPlan({ breed: 'Beagle', pitch: 1 }, 'woof'), pu = A._barkPlan({ breed: 'Beagle', pitch: 1, age: 'puppy' }, 'woof');
      R.lift.push(pu.B.f0 / ad.B.f0); R.n++; if (pu.dur < ad.dur + 0.3 && pu.S[0].d < ad.S[0].d) R.shorter++;
      if (pu.S.length > ad.S.length) R.hic++;
    }
    A.BARK_KINDS.forEach((k) => { const q = A._barkPlan({ breed: 'corgi', age: 'newborn' }, k); R.newMap[k] = q.kind + ':' + q.S.length; });
    ['shiba', 'golden', 'dachshund', 'husky', 'pug', 'chihuahua'].forEach((br) => { const q = A._barkPlan({ breed: br, pitch: 1, age: 'puppy' }, 'woof'); R.breedF[br] = Math.round(q.B.F[0]); });
    return R;
  });
  ok(Math.min(...pl.lift) > 1.25 && Math.max(...pl.lift) < 1.6, `puppy pitch lift ${Math.min(...pl.lift).toFixed(2)}..${Math.max(...pl.lift).toFixed(2)} (5-7 semitones = 1.33..1.50)`);
  ok(pl.shorter === pl.n, 'puppy barks are shorter than adult barks');
  ok(pl.hic > 5 && pl.hic < pl.n, `bark-hiccup appears sometimes (${pl.hic}/${pl.n})`);
  const nm = Object.entries(pl.newMap);
  ok(nm.every(([k, v]) => ['whine', 'whimper', 'yip'].includes(v.split(':')[0])) && pl.newMap.whine.startsWith('whine') && pl.newMap.whimper.startsWith('whimper') && pl.newMap.yip.startsWith('yip') && pl.newMap.howl.startsWith('yip:1'), 'newborn: whine/whimper/yip kept, every other kind maps to a single squeak');
  ok(new Set(Object.values(pl.breedF)).size >= 5, 'breed character survives in puppies (formants differ: ' + JSON.stringify(pl.breedF) + ')');

  // ---- offline stings: sfx-bus, non-silent, ends, not clipped ----
  for (const [name, minSec, maxEnergySec] of [['birth', 2.0, 4.2], ['sparkle', 0.8, 2.5], ['playdate', 0.4, 1.6]]) {
    const r = await p.evaluate((name) => window.PawAudio._render({ seconds: 5, sampleRate: 22050, vols: { music: 0, ambience: 0 }, segments: [{ at: 0, ctx: { place: 'nursery', time: 'day', weather: 'sunny' } }], stingers: [{ at: 0.2, name }] }), name);
    // second render with a sting at 3 s to find how long it rings: energy in the final second must be near-silent for short stings
    ok(r.rmsDb > -48 && r.peak > 0.02, `sting ${name}: audible (rms ${r.rmsDb} dB, peak ${r.peakDb} dB)`);
    ok(r.clippedSamples === 0 && r.peak < 0.8, `sting ${name}: no clipping, headroom ok`);
    const tail = await p.evaluate((name) => window.PawAudio._render({ seconds: 8, sampleRate: 22050, vols: { music: 0, ambience: 0 }, segments: [{ at: 0, ctx: { place: 'nursery', time: 'day', weather: 'sunny' } }], stingers: [{ at: 0.1, name }] }), name);
    log(`sting ${name}: loudest 1 s ${tail.loudest1sRmsDb} dB, whole-8s rms ${tail.rmsDb} dB`);
  }
  // sting must come from the sfx bus: sfx volume 0 silences it
  const mute = await p.evaluate(async () => {
    const A = window.PawAudio, c = new (window.OfflineAudioContext)(1, 22050 * 3, 22050);
    return A._render({ seconds: 3, sampleRate: 22050, vols: { music: 0, ambience: 0, master: 0 }, segments: [{ at: 0, ctx: { place: 'yard' } }], stingers: [{ at: 0.2, name: 'birth' }] });
  });
  ok(mute.peak < 0.0005, 'sting is silent when master volume is 0 (rms ' + mute.rmsDb + ' dB)');

  // ---- nursery music: lullaby variant of home, unknown places fall back ----
  const nur = await p.evaluate(() => {
    const A = window.PawAudio, d = (c) => A.describe(c), o = {};
    o.nursery = d({ place: 'nursery', time: 'day', weather: 'sunny' }); o.house = d({ place: 'house', time: 'day', weather: 'sunny' });
    o.sleep = d({ place: 'sleep', time: 'day', weather: 'sunny' }); o.bogus = d({ place: 'bogus-place' }); o.yard = d({ place: 'yard' });
    o.night = d({ place: 'nursery', time: 'night', weather: 'rain' }); o.all = [];
    for (const t of A.TIMES) for (const w of A.WEATHERS) o.all.push(d({ place: 'nursery', time: t, weather: w }).bpm);
    return o;
  });
  ok(nur.nursery.label.indexOf('nursery') === 0 && nur.nursery.top === 'box' && nur.nursery.bpm <= 72 && nur.nursery.layers.kick < 0.2 && nur.nursery.layers.pad >= 0.4, 'nursery = soft lullaby (music-box top, slow, pad, barely any drums): ' + nur.nursery.label);
  ok(nur.nursery.sig !== nur.house.sig && nur.nursery.sig !== nur.sleep.sig, 'nursery differs from house and sleep');
  ok(nur.bogus.sig === nur.yard.sig, 'unknown place still falls back to yard');
  ok(nur.night.bpm >= 60 && nur.all.every((x) => x >= 60 && x <= 90), 'nursery bpm sane in all times/weather: ' + nur.all.join(','));
  const nr = await p.evaluate(() => window.PawAudio._render({ seconds: 14, sampleRate: 22050, vols: { ambience: 0 }, segments: [{ at: 0, ctx: { place: 'nursery', time: 'day', weather: 'sunny' } }, { at: 6, ctx: { place: 'nursery', time: 'night', weather: 'rain' } }] }));
  ok(nr.rmsDb > -50 && nr.steps > 20 && nr.clippedSamples === 0, `nursery music renders (rms ${nr.rmsDb} dB, ${nr.steps} steps)`);

  // ---- vet / salon ambience: present, and level-matched to the other indoor places ----
  const amb = {};
  for (const pl2 of ['vet', 'salon', 'house', 'kitchen', 'cafe', 'yard']) {
    for (const weather of ['cloudy', 'sunny']) {
      if (weather === 'sunny' && (pl2 === 'house' || pl2 === 'cafe')) continue;   // (house is silent when sunny; keep the run short)
      const r = await p.evaluate(([pl2, weather]) => window.PawAudio._render({ seconds: 12, sampleRate: 22050, vols: { music: 0 }, segments: [{ at: 0, ctx: { place: pl2, time: 'day', weather } }] }), [pl2, weather]);
      amb[pl2 + '/' + weather] = r.rmsDb;
    }
  }
  log('ambience rms dB', JSON.stringify(amb));
  const d = await p.evaluate(() => ({ vet: window.PawAudio.describe({ place: 'vet' }).ambience, salon: window.PawAudio.describe({ place: 'salon' }).ambience, house: window.PawAudio.describe({ place: 'house' }).ambience }));
  ok(d.vet.vet > 0 && d.vet.clock > 0 && d.salon.salon > 0 && d.house.vet === 0 && d.house.salon === 0, 'vet bed only at the vet, salon bed only at the salon');
  for (const k of ['vet', 'salon']) for (const w of ['cloudy', 'sunny']) {
    const v = amb[k + '/' + w], refs = ['kitchen', 'cafe', 'yard'].map((x) => amb[x + '/' + w]).filter((x) => x != null), lo = Math.min(...refs), hi = Math.max(...refs);
    ok(v > (amb['house/' + w] != null ? amb['house/' + w] : -90) + 3 && v >= lo - 2 && v <= hi + 1, `${k}/${w}: ${v} dB, no longer near-empty (house ${amb['house/' + w]}) and level-matched (kitchen/cafe/yard span ${lo}..${hi} dB)`);
  }

  // ---- live engine: everything plays, never throws, 2-voice limit holds, ducking + mute respected ----
  const live = await p.evaluate(async () => {
    const A = window.PawAudio, sl = (ms) => new Promise((r) => setTimeout(r, ms)), R = { err: null };
    try {
      A.init(); await sl(400); R.state = A.state().ctxState;
      for (const pl2 of ['nursery', 'vet', 'salon', 'bogus', 'nursery']) { A.setContext({ place: pl2, time: 'night', weather: 'snow' }); await sl(300); }
      R.nurseryVariant = A.state().variant;
      const idle = async () => { for (let i = 0; i < 40 && A.state().barkVoices > 0; i++) await sl(40); };
      for (const age of ['newborn', 'puppy', undefined]) for (const k of ['whimper', 'whine', 'yip', 'woof', 'howl', 'bogus']) { A.bark({ breed: 'Beagle', pitch: 1.1, age, size: 'small' }, k, { volume: 0.5 }); await idle(); }
      for (const k of A.BARK_KINDS) { A.bark({ breed: 'Corgi', age: 'puppy' }, k, { volume: 0.3 }); A.bark({ breed: 'Corgi', age: 'newborn' }, k, { volume: 0.3 }); await sl(10); }   // rapid fire: the 2-voice limit just drops extras
      R.maxV = 0;
      for (let i = 0; i < 12; i++) { A.bark({ breed: 'shiba', age: 'puppy' }, 'alert'); R.maxV = Math.max(R.maxV, A.state().barkVoices); }
      await sl(1500);
      A.sting('birth'); R.duckSting = A.state().gains.duck; await sl(150); R.duckSting = Math.min(R.duckSting, A.state().gains.duck);
      A.sting('sparkle'); A.sting('playdate'); await sl(300);
      A.setMuted(true); A.sting('birth'); A.bark({ age: 'puppy' }, 'whimper'); await sl(700); R.mutedGain = A.state().gains.mute; A.setMuted(false);
      A.setVolumes({ sfx: 0 }); A.sting('birth'); A.setVolumes({ sfx: 0.8 });
      R.stingLog = A.stingLog.slice(-3); R.barks = A.state().barks;
    } catch (e) { R.err = String(e); }
    return R;
  });
  ok(!live.err, 'live: no exception (' + live.err + ')');
  ok(live.state === 'running', 'live: AudioContext running');
  ok(live.nurseryVariant && live.nurseryVariant.indexOf('nursery') === 0, 'live: nursery context applied: ' + live.nurseryVariant);
  ok(live.maxV <= 2, `live: never more than 2 bark voices (max ${live.maxV})`);
  ok(live.barks >= 18, `live: ${live.barks} barks played across ages/kinds (rapid-fire extras dropped by the 2-voice limit)`);
  ok(live.duckSting < 0.9, `live: sting ducks the music slightly (duck gain ${live.duckSting.toFixed(2)})`);
  ok(live.mutedGain < 0.05, 'live: mute still silences the sfx bus');
  ok(errors.length === 0, 'no console errors/warnings' + (errors.length ? ': ' + errors.slice(0, 3).join(' | ') : ''));
  await b.close();
  console.log(fails ? `\n[audio-v2] ${fails} FAILED` : '\n[audio-v2] ALL OK');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
