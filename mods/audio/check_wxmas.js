// The Winter Market's Christmas tune (wxmas) and its turns with the old Winter Market tune (wmarket): node mods/audio/check_wxmas.js
//   (NODE_PATH=$(npm root -g)). About 4 minutes (two long offline renders). Checks:
//   - every other place, time, weather, walk area and festival resolves exactly as before: describe().sig per place matches
//     sig_snapshot.json (taken from the engine before wxmas; after a deliberate music change elsewhere, rewrite it with
//     `node mods/audio/check_wxmas.js --write-snapshot` and say so in the release notes)
//   - the variant: 88 bpm, the 16-bar 'xmas' chords, celesta, the market ambience (no fireplace), kept at dusk / night / snow
//   - the turns, in offline renders: the first visit plays wxmas, a new visit the other tune, a stall or the journal pauses a visit,
//     a quick hop away (< 60 s) keeps it, staying changes tune at the top of the form after MK_TURN s; 0 dropped voices, no clipping
//   - loudness: the two tunes within 1.5 dB RMS of each other
//   - live: setContext reaches wxmas, a stall and back keeps it, mute still mutes, nothing throws
const { chromium } = require('playwright'); const path = require('path'); const fs = require('fs'); const crypto = require('crypto');
const MOD = process.env.PAW_AUDIO || path.join(__dirname, '..', 'pawaudio.js');
const SNAP = path.join(__dirname, 'sig_snapshot.json');
const WRITE = process.argv.includes('--write-snapshot');
let fails = 0; const log = (...a) => console.log('[wxmas]', ...a);
const ok = (c, m) => { if (!c) { fails++; console.log('[wxmas] FAIL', m); } else console.log('[wxmas] ok  ', m); };
const WM = { place: 'fmarket', time: 'day', weather: 'snow', fest: 'winter' };
const W = (o) => Object.assign({}, WM, o);

(async () => {
  const b = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : undefined, args: ['--autoplay-policy=no-user-gesture-required'] });
  const errors = [];
  const p = await b.newPage();
  p.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await p.goto('about:blank'); await p.addScriptTag({ path: MOD });

  // ---- every other context resolves as before (per-place hash of every sig) ----
  const sigs = await p.evaluate(() => {
    const A = window.PawAudio, out = {};
    for (const pl of A.PLACES) for (const fest of [null, 'winter']) {
      const key = pl + (fest ? '+' + fest : ''), list = [];
      for (const ar of pl === 'walk' ? A.AREAS : [null]) for (const t of A.TIMES) for (const w of A.WEATHERS) list.push(A.describe({ place: pl, area: ar, time: t, weather: w, fest, _month: 6 }).sig);
      out[key] = list.join('\n');
    }
    return out;
  });
  const hashes = {}; for (const k of Object.keys(sigs)) hashes[k] = crypto.createHash('sha1').update(sigs[k]).digest('hex');
  if (WRITE) { fs.writeFileSync(SNAP, JSON.stringify(hashes, null, 1) + '\n'); log('wrote', SNAP, Object.keys(hashes).length, 'places'); await b.close(); return; }
  const snap = JSON.parse(fs.readFileSync(SNAP, 'utf8'));
  const changed = Object.keys(snap).filter((k) => hashes[k] !== snap[k]);
  ok(changed.length === 0, `every place x time x weather (x walk area, x fest) resolves as before: ${Object.keys(snap).length} places` + (changed.length ? '; changed: ' + changed.join(', ') : ''));

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
  const loud = await R({ seconds: 15, vols: { master: 1, music: 1, ambience: 1 }, segments: [{ at: 0, ctx: W({ tune: 'xmas', weather: 'sunny' }) }] });
  ok(loud.peakDb < -1 && loud.dropped === 0, `worst case (all volumes 1.0): peak ${loud.peakDb} dBFS, dropped ${loud.dropped}`);
  const lv = {}; for (const tune of ['old', 'xmas']) lv[tune] = (await R({ seconds: 40, sampleRate: 22050, segments: [{ at: 0, ctx: W({ tune }) }] })).rmsDb;
  ok(Math.abs(lv.old - lv.xmas) <= 1.5, `loudness: old ${lv.old} dB RMS, xmas ${lv.xmas} dB RMS`);

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
  log(fails ? fails + ' FAILED' : 'all ok');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
