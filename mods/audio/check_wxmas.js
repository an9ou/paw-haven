// The Winter Market's Christmas tune (wxmas) and its turns with the old Winter Market tune (wmarket): node mods/audio/check_wxmas.js
//   (NODE_PATH=$(npm root -g)). About 4 minutes (two long offline renders). Checks:
//   - every other place, time, weather, walk area and festival resolves exactly as before: describe().sig per place matches
//     sig_snapshot.json, for months 6, 0 and 11 (taken from the engine before wxmas, origin/main of 25 Nov 2026; after a deliberate
//     music change elsewhere, rewrite it with `node mods/audio/check_wxmas.js --write-snapshot` and say so in the release notes)
//     --sig runs only this part, in plain node (no browser, under a second): the `audio_sig` suite (game/test_audio_sig.js)
//   - the variant: 88 bpm, the 16-bar 'xmas' chords, celesta, the market ambience (no fireplace), kept at dusk / night / snow
//   - the turns, in offline renders: the first visit plays wxmas, a new visit the other tune, a stall or the journal pauses a visit,
//     a quick hop away (< 60 s) keeps it, staying changes tune at the top of the form after MK_TURN s, the old tune comes back at its
//     own bar 1 even when the visit began on an odd bar; 0 dropped voices, no clipping
//   - loudness: the two tunes within 0.8 dB RMS of each other (25 Nov 2026: 0.5 dB in 5 runs out of 5)
//   - live: setContext reaches wxmas, a stall and back keeps it, mute still mutes, nothing throws
const path = require('path'); const fs = require('fs'); const crypto = require('crypto'); const vm = require('vm');
const MOD = process.env.PAW_AUDIO || path.join(__dirname, '..', 'pawaudio.js');
const SNAP = path.join(__dirname, 'sig_snapshot.json');
const WRITE = process.argv.includes('--write-snapshot'), SIG_ONLY = process.argv.includes('--sig');
const MONTHS = [6, 0, 11];   // month only changes the garden (summer bees); 6 keeps the old keys, the others get '@<month>'
let fails = 0; const log = (...a) => console.log('[wxmas]', ...a);
const ok = (c, m) => { if (!c) { fails++; console.log('  FAIL ' + m); } else console.log('  ok   ' + m); };
const WM = { place: 'fmarket', time: 'day', weather: 'snow', fest: 'winter' };
const W = (o) => Object.assign({}, WM, o);
const done = () => { log(fails ? fails + ' FAILED' : 'all ok'); if (!fails) console.log('ALL OK'); process.exit(fails ? 1 : 0); };

// every place x fest x walk area x time x weather x month: one sha1 of the describe().sig list per place (+fest, +month).
// resolve() needs no WebAudio, so the engine runs in a plain node sandbox (the same sigs as in Chromium).
function sigHashes(mod) {
  const w = {}; const ctx = vm.createContext({ window: w }); vm.runInContext(fs.readFileSync(mod, 'utf8'), ctx, { filename: mod });
  const A = w.PawAudio, out = {};
  for (const mon of MONTHS) for (const pl of A.PLACES) for (const fest of [null, 'winter']) {
    const key = pl + (fest ? '+' + fest : '') + (mon === 6 ? '' : '@' + mon), list = [];
    for (const ar of pl === 'walk' ? A.AREAS : [null]) for (const t of A.TIMES) for (const wt of A.WEATHERS) list.push(A.describe({ place: pl, area: ar, time: t, weather: wt, fest, _month: mon }).sig);
    out[key] = crypto.createHash('sha1').update(list.join('\n')).digest('hex');
  }
  return out;
}

(async () => {
  // ---- every other context resolves as before (per-place hash of every sig) ----
  const t0 = Date.now(), hashes = sigHashes(MOD);
  if (WRITE) { fs.writeFileSync(SNAP, JSON.stringify(hashes, null, 1) + '\n'); log('wrote', SNAP, Object.keys(hashes).length, 'places x months from', MOD); return; }
  const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
  const changed = Object.keys(snap).filter((k) => hashes[k] !== snap[k]), extra = Object.keys(hashes).filter((k) => !(k in snap));
  ok(changed.length === 0 && extra.length === 0, `every place x time x weather (x walk area, x fest, x months ${MONTHS.join('/')}) resolves as before: ${Object.keys(snap).length} keys` +
    (changed.length ? '; changed: ' + changed.join(', ') : '') + (extra.length ? '; not in the snapshot: ' + extra.join(', ') : ''));
  ok(MONTHS.every((m) => ('garden' + (m === 6 ? '' : '@' + m)) in snap) && snap['garden@0'] !== snap.garden, `the snapshot covers months ${MONTHS.join(', ')} (the garden differs in winter: no bees)`);
  if (SIG_ONLY) { log('sig check in', Date.now() - t0, 'ms'); return done(); }

  const { chromium } = require('playwright');
  const b = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
  const errors = [];
  const p = await b.newPage();
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await p.goto('about:blank'); await p.addScriptTag({ path: MOD });

  // ---- the variant ----
  const d = await p.evaluate((c) => { const A = window.PawAudio, D = (o) => A.describe(Object.assign({}, c, o));
    return { plain: D({}), old: D({ tune: 'old' }), x: D({ tune: 'xmas' }), dusk: D({ tune: 'xmas', time: 'dusk' }), night: D({ tune: 'xmas', time: 'night', weather: 'sunny' }),
      sunny: D({ tune: 'xmas', weather: 'sunny' }), dawn: D({ tune: 'xmas', fest: null, time: 'dawn' }), yard: D({ tune: 'xmas', place: 'yard' }), bogus: D({ tune: 'constructor' }) }; }, WM);
  ok(d.plain.base === 'wmarket' && d.old.sig === d.plain.sig, 'describe() of the Winter Market without a tune is the old wmarket, as before');
  ok(d.x.base === 'wxmas' && d.x.bpm === 88 && d.x.prog === 'xmas' && d.x.top === 'celesta', 'tune xmas: wxmas, 88 bpm, the 16-bar xmas chords, celesta: ' + d.x.label);
  ok(d.x.ambience.snowmkt > 0 && d.x.ambience.market > 0 && !('fire' in d.x.ambience) && JSON.stringify(d.x.ambience) === JSON.stringify(d.old.ambience), 'the market ambience, the same as the old tune (no fireplace): ' + JSON.stringify(d.x.ambience));
  ok([d.dusk, d.night, d.sunny].every((v) => v.base === 'wxmas' && v.prog === 'xmas' && v.top === 'celesta' && v.bpm >= 64 && v.bpm <= 90), `kept at dusk (${d.dusk.bpm} bpm), night (${d.night.bpm} bpm) and sunny`);
  ok(d.dawn.base === 'market' && d.yard.base === 'yard' && d.bogus.base === 'wmarket', 'a tune key does nothing away from the Winter Market or when junk');

  // ---- the turns (offline renders, low sample rate) ----
  const R = (o) => p.evaluate((o) => window.PawAudio._render(Object.assign({ sampleRate: 8000 }, o)), o);
  const bases = (r) => [r.first.base].concat(r.variants.map((v) => v.base));
  const stay = await R({ seconds: 240, segments: [{ at: 0, ctx: WM }] });
  const t1 = stay.variants.find((v) => v.base === 'wmarket');
  ok(stay.first.base === 'wxmas' && t1 && t1.at >= 180 && t1.at < 230 && t1.bar % 16 === 0 && stay.mkTurns === 1, `staying: the first visit plays wxmas, the old tune comes in at the top of the form after 3 min (${t1 && t1.at} s, bar ${t1 && t1.bar})`);
  ok(stay.dropped === 0 && stay.peakDb < -1 && stay.clippedSamples === 0, `staying 4 min: 0 dropped voices (${stay.dropped}), peak ${stay.peakDb} dBFS`);
  const vis = await R({ seconds: 270, mkTurn: 1000, segments: [{ at: 0, ctx: WM }, { at: 20, ctx: { place: 'yard' } }, { at: 100, ctx: WM }, { at: 130, ctx: { place: 'shop' } }, { at: 200, ctx: W({ time: 'dusk' }) }, { at: 220, ctx: { place: 'map' } }, { at: 240, ctx: WM }] });
  ok(JSON.stringify(bases(vis)) === JSON.stringify(['wxmas', 'yard', 'wmarket', 'market', 'wmarket', 'yard', 'wmarket']), 'visits: xmas, away 80 s -> the other tune, a stall pauses the visit (any length), a 20 s hop keeps it: ' + bases(vis).join(' > '));
  const vis2 = await R({ seconds: 120, mkTurn: 1000, segments: [{ at: 0, ctx: W({ tune: 'old' }) }, { at: 10, ctx: { place: 'house' } }, { at: 80, ctx: WM }] });
  ok(JSON.stringify(bases(vis2)) === JSON.stringify(['wmarket', 'house', 'wxmas']), 'visits from the old tune: the next visit gets the Christmas tune: ' + bases(vis2).join(' > '));
  const sh = await R({ seconds: 80, mkTurn: 20, segments: [{ at: 0, ctx: W({ tune: 'old' }) }, { at: 30, ctx: W({ time: 'dusk' }) }] });
  const sv = sh.variants;
  ok(sh.first.base === 'wmarket' && sv.length === 3 && sv[0].base === 'wxmas' && sv[0].bar % 8 === 0 && sv[1].base === 'wxmas' && /dusk/.test(sv[1].variant) && sv[2].base === 'wmarket' && sv[2].bar === sv[0].bar + 16,
    'short turns: old -> xmas at the top of its 8 bars, a time change keeps the tune, back to old after the full 16-bar form: ' + sv.map((v) => v.at + 's bar ' + v.bar + ' ' + v.base).join(', '));
  // the visit begins on an odd bar (the Christmas form then starts on the next even bar): the old tune still comes in at its own bar 1
  // and plays whole 8-bar phrases (before the fix it came in at bar % 8, e.g. its bar 5 or 7)
  for (const at of [6, 12]) {
    const od = await R({ seconds: at + 90, mkTurn: 20, segments: [{ at: 0, ctx: { place: 'yard' } }, { at, ctx: WM }] }), ov = od.variants;
    const x0 = ov.find((v) => v.base === 'wxmas'), o1 = ov.find((v) => v.base === 'wmarket'), x1 = o1 && ov.find((v) => v.base === 'wxmas' && v.at > o1.at);
    ok(x0 && x0.bar % 2 === 1 && o1 && o1.prog === 'winter' && o1.pi === 0 && o1.bar % 8 !== 0 && x1 && x1.pi === 0 && (x1.bar - o1.bar) % 8 === 0,
      `arriving at ${at} s (an odd bar): the old tune comes back at its bar 1 and plays whole phrases: ` + ov.map((v) => v.at + 's bar ' + v.bar + ' ' + v.base + ' pos ' + v.pi).join(', '));
  }
  const loud = await R({ seconds: 15, vols: { master: 1, music: 1, ambience: 1 }, segments: [{ at: 0, ctx: W({ tune: 'xmas', weather: 'sunny' }) }] });
  ok(loud.peakDb < -1 && loud.dropped === 0, `worst case (all volumes 1.0): peak ${loud.peakDb} dBFS, dropped ${loud.dropped}`);
  const lv = {}; for (const tune of ['old', 'xmas']) lv[tune] = (await R({ seconds: 40, sampleRate: 22050, segments: [{ at: 0, ctx: W({ tune }) }] })).rmsDb;
  ok(Math.abs(lv.old - lv.xmas) <= 0.8, `loudness: old ${lv.old} dB RMS, xmas ${lv.xmas} dB RMS`);

  // ---- live ----
  const S = () => p.evaluate(() => window.PawAudio.state());
  await p.evaluate(() => window.PawAudio.init());
  await new Promise((r) => setTimeout(r, 600));
  await p.evaluate((c) => window.PawAudio.setContext(c), WM); await new Promise((r) => setTimeout(r, 4500));
  const s1 = await S();
  await p.evaluate(() => window.PawAudio.setContext({ place: 'shop' })); await new Promise((r) => setTimeout(r, 4000));
  const s2 = await S();
  await p.evaluate((c) => window.PawAudio.setContext(c), WM); await new Promise((r) => setTimeout(r, 4000));
  const s3 = await S();
  ok(s1.ctxState === 'running' && s1.base === 'wxmas' && s1.tune === 'xmas' && s2.base === 'market' && s2.tuneVisit && s3.base === 'wxmas', `live: market -> wxmas (${s1.base}), a stall (${s2.base}) and back keeps it (${s3.base})`);
  ok(JSON.stringify(Object.keys((await p.evaluate(() => window.PawAudio.contexts.slice(-1)[0])))) === '["place","area","time","weather","fest"]', 'PawAudio.contexts entries unchanged (no tune key leaks to the game)');
  await p.evaluate(() => window.PawAudio.setMuted(true)); await new Promise((r) => setTimeout(r, 800));
  const s4 = await S();
  ok(s4.gains.mute < 0.01 && s4.dropped === 0, `live: mute still mutes (gain ${s4.gains.mute.toFixed(4)}), dropped voices ${s4.dropped}`);
  ok(errors.length === 0, 'no page errors' + (errors.length ? ': ' + errors.join(' | ') : ''));
  await b.close();
  done();
})().catch((e) => { console.error(e); process.exit(1); });
