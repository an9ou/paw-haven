// Merch spike: the recipe round trip against the real game. In the merged test build (game/test_merged.html), for every breed (40) x coats
// (the starter, two seeded random genotypes, a Bl/bl or merle one) x ages (adult, 3-month puppy, newborn) x outfits (none, two pieces, all six slots)
// x sparkle / mix head / art seed, the dog the game draws on its share picture (58_share.js shSVG -> dogSVG) is compared, string for string, with
// PawPrint.dogSVG(merchDecode(merchEncode(merchRecipe(dog)))). Poses: happy (the share picture), sit, idle (stand).
//   node game/build.js && node game/harness.js merged && NODE_PATH=$(npm root -g) node tools/merch_build.js && NODE_PATH=$(npm root -g) node merch/test_merch_game.js
const path = require('path');
const { run } = require('../game/test_lib');

run('merch_game', async (t) => {
  const { ok, sec, ev } = t;
  await t.boot(); await t.adopt({ sex: 'girl' }); await t.until(() => !!(window.__paw && window.__paw.sh), null, 8000); await t.calm();
  await t.p.addScriptTag({ path: path.join(__dirname, 'dist', 'pawprint.js') });
  ok(await ev(() => !!window.PawPrint && !window.PawPrint.PawArt && window.PawArt && window.PawArt.dog !== undefined), 'PawPrint loads beside the game and keeps its own copy of the art');

  sec('1. the recipe redraws the game dog byte for byte');
  const res = await ev(() => {
    const P = window.PawPrint, G = window.PawGenes, S = window.__paw.S, keys = G.BREEDS;
    const iso = (days) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - days); return d.toISOString().slice(0, 10); };
    let a = 0x9E3779B9; const rnd = () => { a = (a + 0x6D2B79F5) >>> 0; let x = a; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
    const bySlot = {}; P.WEAR.forEach((w) => { (bySlot[w.slot] = bySlot[w.slot] || []).push(w.n); });
    const pick = (l) => l[Math.floor(rnd() * l.length)];
    const fits = [() => ({}), () => ({ head: pick(bySlot.head), neck: pick(bySlot.neck) }), () => { const o = {}; Object.keys(bySlot).forEach((s) => { o[s] = pick(bySlot[s]); }); return o; }];
    const ages = [null, iso(40), iso(3), iso(0)]; // 1 real day = 1 dog month: an adult, a 3-month puppy, a newborn
    const dogs = [JSON.parse(JSON.stringify(S.dogs[0]))]; let n = 0;
    for (const key of keys) {
      const gl = [G.STARTER_GENES[key] || G.STARTER_GENES.mutt, G.randomGenotype(key, rnd), G.randomGenotype(key, rnd), Object.assign({}, G.randomGenotype(key, rnd), rnd() < 0.5 ? { Bl: ['Bl', 'bl'] } : { M: ['M', 'm'], E: ['E', 'e'] })];
      gl.forEach((genes, gi) => {
        const born = ages[n % ages.length], fit = fits[((n >> 2) + gi) % fits.length]();
        const d = { id: 'mt-' + key + '-' + gi, key, genes, sex: rnd() < 0.5 ? 'female' : 'male', name: 'Pup ' + gi, outfit: Object.assign({ head: null, eyes: null, neck: null, body: null, feet: null, charm: null }, fit) };
        if (born) d.born = born; if (gi === 1 || rnd() < 0.15) d.sparkle = true; if (gi === 2) d.mix = { head: keys[(keys.indexOf(key) + 7) % keys.length] }; if (gi === 3) d.artSeed = Math.floor(rnd() * 4294967295);
        dogs.push(d); n++;
      });
    }
    const out = { nb: 0, neg: 0, eyeDiff: 0, seedDiff: 0, n: 0, same: 0, bad: [], bytes1: 0, bytes5: 0, lens: [], stages: {}, worn: 0, mix: 0, spk: 0 };
    const stripRoot = (s) => { const m = /^<svg\b[^>]*\bclass="([^"]*)"[^>]*>([\s\S]*)<\/svg>$/.exec(s.replace(/\s(?:role|aria-label)="[^"]*"/g, '')); return m ? m[1] + '|' + m[2] : null; };
    for (const d of dogs) {
      const own = S.dogs.some((x) => x.id === d.id); if (!own) S.dogs.push(d);
      try {
        const r0 = P.merchRecipe(d, { today: new Date() }), enc = P.merchEncode(r0), dec = P.merchDecode(enc), r = dec.ok ? dec.dogs[0] : null;
        out.lens.push(enc.length); out.stages[r0.a] = (out.stages[r0.a] || 0) + 1; if (r0.o) out.worn++; if (r0.h !== undefined) out.mix++; if (r0.sp) out.spk++;
        for (const pose of ['happy', 'sit', 'idle']) {
          out.n++;
          const sh = window.__paw.sh.svg({ id: d.id, pose, outfit: d.outfit, wet: false, size: 'feed' });
          const m = /<svg x="268" y="246" width="422" height="352"[^>]*>[\s\S]*?<\/svg>/.exec(sh); // the shared dog (SH_DOG in 58_share.js)
          const game = m ? stripRoot(m[0].replace(/^<svg x="268" y="246" width="422" height="352" style="[^"]*"\s*/, '<svg ')) : null;
          const mine = r ? stripRoot(P.dogSVG(r, { pose })) : null;
          if (pose === 'happy' && r && game) { const e2 = stripRoot(P.dogSVG(Object.assign({}, r, { e: (r.e + 1) % 4 }), { pose })), p2 = stripRoot(P.dogSVG(Object.assign({}, r, { p: (r.p + 1) >>> 0 }), { pose })); out.eyeDiff += e2 !== game ? 1 : 0; out.nb += r.a === 2 ? 1 : 0; out.seedDiff += p2 !== game ? 1 : 0; out.neg++; }
          if (game && mine && game === mine) out.same++; else if (out.bad.length < 5) out.bad.push({ id: d.id, pose, enc, game: game && game.slice(0, 160), mine: mine && mine.slice(0, 160) });
        }
      } finally { if (!own) S.dogs.pop(); }
    }
    out.dogs = dogs.length;
    return out;
  });
  ok(res.n > 400 && res.same === res.n, `recipe -> SVG equals the game's share-picture dog: ${res.same}/${res.n} renders of ${res.dogs} dogs (${JSON.stringify(res.stages)} adult/puppy/newborn, ${res.worn} dressed, ${res.mix} mixes, ${res.spk} sparkly)`);
  ok(res.eyeDiff === res.neg - res.nb, `the comparison is sharp: other eyes change the drawing for ${res.eyeDiff}/${res.neg} dogs (all but the ${res.nb} newborns, whose eyes are shut); another art seed for ${res.seedDiff}/${res.neg} (only dogs with patches, merle, spots or sparkle depend on it)`);
  if (res.bad.length) console.log(JSON.stringify(res.bad, null, 1));
  const L = res.lens.slice().sort((a, b) => a - b);
  console.log('  one-dog link payload (base64url chars): min', L[0], 'median', L[L.length >> 1], 'max', L[L.length - 1]);

  sec('2. the save reader on the real save (same origin as /play/)');
  const fs = await ev(() => { const raw = localStorage.getItem('pawhaven_proto_v1'), r = window.PawPrint.merchFromSave(raw, { today: new Date() }); return { bytes: raw.length, ok: r.ok, dogs: r.dogs.map((x) => ({ key: x.key, name: x.name, active: x.active })), same: r.ok && window.PawPrint.dogSVG(r.dogs[0].recipe, { pose: 'happy' }).replace(/\s(?:role|aria-label)="[^"]*"/g, '').replace(/^<svg[^>]*>/, '') === /<svg x="268" y="246"[^>]*>([\s\S]*?<\/svg>)/.exec(window.__paw.sh.svg({ pose: 'happy', wet: false }))[1] };
  });
  ok(fs.ok && fs.dogs.length === 1 && fs.dogs[0].active && fs.same, 'merchFromSave reads the live save (' + fs.bytes + ' chars) and draws its dog as the share picture does: ' + JSON.stringify(fs.dogs));
}, { timeout: 600000 });
