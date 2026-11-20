// The 20 Nov 2026 "Guess who's at the door" Reel (v2.26 Yard visitors; docs/marketing/VISITOR_REEL.md): clean captures from a fresh worktree of
// origin/main (game/test_merged.html: node game/build.js && node game/harness.js merged), with the test harness (game/test_lib.js). Nothing in main
// changes. The page date is 20 Nov 2026 (autumn, sunny, day), the visitors feature on through the harness's own test pref (prefs.yvTest).
//   yard.svg     the Home Yard as the game draws it (svg.world; our own dog, the roaming dogs, a visitor and the effects left out), nothing put out
//   book.svg     the Visitors Book's own art (PawArt.YARD_VISITORS.book())
//   facts.json   for each visitor of ROUNDS: the Visitors Book page before it is met (the silhouette page: "???" and its hint), a real visit in the
//                yard (seed search, as gift_reel/capture_gift.js), the yard tag, the visitor's card and its Visitors Book page after the visit
//                (name, breed, family, favourite, hint), the game's own data (window.__paw.yv.dogs) and its coat
//   draw.json    the drawings the build animates, each the game's own PawArt.dog SVG (anim on: the art's three keyframes), with the state of its
//                frame animation at every frame of one loop, read off the page on the FROZEN CLOCK (../frozen_clock.js: freezeClock, then
//                stepClock at exactly 1000/30 ms, then releaseClock). The art's frame animation loops every second (pa-d-b0..b2, 1 s, steps),
//                so 30 frames are the whole loop; the build plays frame n of a run as loop frame n mod 30 and checks the loop is exact.
//                The visitors are drawn as the game draws them in the yard (yvSVG: dogSVG of the breed's starter coat, seeded by its id):
//                the capture checks its own drawing of pose happy, facing left, is the yard's #visitorG drawing, byte for byte.
//                Noodle is PawArt.dog('dachs') in the Autumn Scarf, as in the share and winter Reels.
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/visitor_reel/capture_visitor.js <main checkout> <outdir>
const path = require('path'), fs = require('fs');
const DEV = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'visitor_caps'); fs.mkdirSync(OUT, { recursive: true });
const { run } = require(path.join(DEV, 'game', 'test_lib'));
const { freezeClock, stepClock, releaseClock } = require('../frozen_clock.js');
const ROUNDS = (process.env.ROUNDS || 'waddles,rapunzel,momiji').split(',');
const NOODLE_POSES = ['idle', 'sit', 'bow', 'happy', 'beg', 'jump'], VIS_POSES = ['walk', 'idle', 'happy', 'sit'];
const OUTFIT = { neck: 'Autumn Scarf' };
// STARTER_GENES[key] of main (game/src/10_sex_age_genes.js), the loci only (coatGenes(key, ''))
function starterGenes(key) { const src = fs.readFileSync(path.join(DEV, 'game', 'src', '10_sex_age_genes.js'), 'utf8'), m = new RegExp('[{,\\s]' + key + ': (\\{[^}]*\\})').exec(src.slice(src.indexOf('const STARTER_GENES')));
  if (!m) throw new Error('no STARTER_GENES for ' + key); const g = Function('return ' + m[1])(), out = {}; ['B', 'D', 'E', 'S', 'M', 'Bl', 'A', 'I'].forEach((k) => { if (g[k]) out[k] = g[k].slice(); }); return out; }
run('visitor_capture', async (t) => {
  const { ev } = t, p = () => t.p, facts = { rounds: {} };
  const closeAll = () => ev(() => { for (let i = 0; i < 5; i++) { const m = document.getElementById('modal'); if (!m || m.hidden) break; const x = m.querySelector('.panel .x'); if (x) x.click(); else break; } });
  const settle = async () => { await ev(() => { const S = window.__paw.S; S.newsSeen = '9.99'; S.wbPend = null; S.awayGiftISO = ''; S.backISO = ''; window.__paw.saveNow(); }); await p().waitForTimeout(900); await closeAll(); };
  await t.newGame({ map215: true, ground: true, prefs: { yvTest: true }, time: 'day', season: 'autumn', weather: 'sunny', head: '~Dachshund', sex: 'boy' }, { coins: 3000, dog: { name: 'Noodle' } });
  await t.calm(); await t.lu(); await settle();
  facts.date = await ev(() => new Date().toISOString().slice(0, 10));
  facts.yvOn = await ev(() => window.__paw.yv.on()); if (!facts.yvOn) throw new Error('the visitors are off');
  facts.yvDate = await ev(() => window.__paw.yv.date);
  facts.dogs = await ev(() => window.__paw.yv.dogs.map((v) => ({ id: v.id, name: v.name, key: v.key, coat: v.coat, age: v.age, fam: v.fam, fav: v.fav, rare: v.rare })));
  facts.yardArt = await ev(() => window.PawArt.YARD_VISITORS ? { props: window.PawArt.YARD_VISITORS.props, items: window.PawArt.YARD_VISITORS.items } : null);
  // the Visitors Book's own art (PawArt.YARD_VISITORS.book(): the sketchbook the Care card, the Journal tab and the book's head show), for the reveal cards
  fs.writeFileSync(path.join(OUT, 'book.svg'), await ev(() => window.PawArt.YARD_VISITORS.book()));

  // ---- 1. the yard as the game draws it, nothing put out ----
  await t.home(); await p().waitForTimeout(1200); await closeAll();
  const yard = await ev(() => { const s = document.querySelector('#view svg.world'); const c = s.cloneNode(true);
    ['#pack .rmdog', '#pack', '#zzz', '#fx', '#ballLayer', '#messG', '#visitorG', '#yvHost', '#dogG', '#dogPos', '#dogHit'].forEach((q) => c.querySelectorAll(q).forEach((e) => e.remove()));
    return { svg: c.outerHTML, vb: s.getAttribute('viewBox'), place: window.__paw.S.place, name: window.__paw.placeName(window.__paw.S.place), season: document.documentElement.dataset.season || '' }; });
  if (yard.place !== 'yard') throw new Error('not in the yard: ' + yard.place);
  fs.writeFileSync(path.join(OUT, 'yard.svg'), yard.svg); facts.yard = { vb: yard.vb, name: yard.name }; console.log('yard', yard.vb, yard.name);

  // ---- 2. the Visitors Book before anyone is met: each round's page is a silhouette with "???" and its hint ----
  await ev(() => window.__paw.yv.book()); await t.until(() => !!document.querySelector('#modal .yv-book'), null, 5000); await p().waitForTimeout(500);
  facts.bookTitle = await ev(() => (document.querySelector('#modal .panel h2, #modal .panel .ttl, #modal .panel header') || {}).innerText || '');
  const unk = await ev(() => [...document.querySelectorAll('#modal .yv-page.unk')].map((e) => ({ txt: e.innerText.replace(/\s+/g, ' ').trim(), sil: !!e.querySelector('.yv-sil') })));
  facts.bookUnknown = unk; await closeAll();

  // ---- 3. a real visit of each round's dog: the conditions it needs, then seeds until it is the one in the yard ----
  const visit = async (id) => {
    await ev((id) => { const P = window.__paw, S = P.S, v = P.yv.dogs.find((x) => x.id === id), r = v.rare || {};
      S.decor = S.decor || {}; for (const n of P.yv.toys) if (S.decor[n]) S.decor[n].out = false;
      const toy = r.toy || v.fav; if (P.yv.toys.includes(toy)) { S.decor[toy] = Object.assign(S.decor[toy] || {}, { got: '2026-11-20', out: true }); S.decor[toy].at = P.ho.freeSpot(toy); }
      if (r.pool) { S.pool = S.pool || {}; S.pool.day = Object.assign({}, S.pool.day || {}, { [S.dog.id]: '2026-11-20' }); }
      P.saveNow(); }, id);
    await t.home(); await p().waitForTimeout(500);
    const vis = await ev((id) => { const P = window.__paw, V = P.S.visitors, keep = JSON.parse(JSON.stringify(V));
      for (let i = 1; i < 600; i++) { Object.assign(V, JSON.parse(JSON.stringify(keep)), { seed: 'guess' + i, met: {}, q: [], log: [], gday: '', cday: 0, flowers: 0 }); P.yv.away(8 * 3600e3); P.yv.catchUp(Date.now());
        const q = P.yv.state().q, l = q[q.length - 1]; if (l && l.id === id) return { seed: V.seed, toy: l.toy, q: q.map((x) => x.id + ':' + x.toy) }; }
      return null; }, id);
    if (!vis) throw new Error('no seed brings ' + id);
    await ev(() => window.__paw.yv.draw()); await t.home(); await t.until(() => !!document.querySelector('#visitorG.yv'), null, 8000); await p().waitForTimeout(400);
    const yd = await ev(() => { const g = document.querySelector('#visitorG'), s = g.querySelector('svg.pa-dog'); return { id: g.dataset.yv, tag: (g.querySelector('.vtag') || {}).textContent || '', aria: g.getAttribute('aria-label'), svg: s ? s.outerHTML : '', inner: s ? s.innerHTML : '', cls: s ? s.getAttribute('class') : '' }; });
    if (yd.id !== id) throw new Error('the yard shows ' + yd.id + ', not ' + id);
    await ev(() => window.__paw.yv.card()); await t.until(() => !!document.querySelector('#modal .yv-card'), null, 5000); await p().waitForTimeout(300);
    const card = await ev(() => ({ title: (document.querySelector('#modal .panel h2, #modal .panel .ttl, #modal .panel header') || {}).innerText || '', txt: document.querySelector('#modal .yv-card').innerText.replace(/\s+/g, ' ').trim() }));
    await closeAll();
    await ev((id) => window.__paw.yv.page(id), id); await t.until(() => !!document.querySelector('#modal .yv-card'), null, 5000); await p().waitForTimeout(300);
    const page = await ev(() => document.querySelector('#modal .yv-card').innerText.replace(/\s+/g, ' ').trim()); await closeAll();
    // the visitor as the yard draws it, and the same drawing made here from the game's own data (for the other poses)
    const mine = await ev(([id]) => { const P = window.__paw, v = P.yv.dogs.find((x) => x.id === id);
      const hashId = (s) => { let h = 2166136261; s = String(s); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
      // yvVisDog(v): its breed's starter coat (option v.coat), as a dog with id 'yv_' + id; the genes are the ones the yard's dog was drawn from
      const d = { id: 'yv_' + v.id, key: v.key, genes: null }; return { key: v.key, seed: hashId(d.id) }; }, [id]);
    // the coat: the phenotype of the breed's starter genes, coat option 0 (yvVisDog: starterCoats(key)[0].genes = coatGenes(key, ''), the loci of
    // STARTER_GENES[key] only), read off main's source here; the byte check against the yard's drawing below catches any difference
    const v0 = facts.dogs.find((x) => x.id === id); if (v0.coat !== 0) throw new Error(id + ' no longer uses its starter coat 0');
    const coat = await ev(([id, key, genes]) => {
      const c = window.__paw.coat({ id: 'yv_' + id, key, genes }); return c ? { coat: c.coat, coatName: c.coatName, eyes: c.eyes } : null; }, [id, mine.key, starterGenes(mine.key)]);
    if (!coat) throw new Error('no coat for ' + id);
    // the same drawing made here, read back through the DOM (as the yard's was) and compared byte for byte, with its class
    const happyL = await ev(([key, coat, seed]) => { const s = window.PawArt.dog(key, { pose: 'happy', facing: 'left', coat, seed }), h = document.createElement('div'); h.innerHTML = s;
      const e = h.querySelector('svg'); return { svg: s, inner: e.innerHTML, cls: e.getAttribute('class') }; }, [mine.key, coat.coat, mine.seed]);
    const same = happyL.inner === yd.inner && happyL.cls === yd.cls;
    console.log('visit', id, JSON.stringify(vis), '| tag', yd.tag, '| card', card.title, '|', card.txt, '| page', page, '| coat', coat.coatName, '| drawing matches the yard:', same);
    if (!same) { fs.writeFileSync(path.join(OUT, 'yard_' + id + '.svg'), yd.svg); fs.writeFileSync(path.join(OUT, 'mine_' + id + '.svg'), happyL.svg); throw new Error('my drawing of ' + id + ' is not the yard\'s'); }
    facts.rounds[id] = { visit: vis, tag: yd.tag, aria: yd.aria, cardTitle: card.title, card: card.txt, page, coat: { name: coat.coatName, eyes: coat.eyes, colours: coat.coat }, seed: mine.seed, key: mine.key, sameAsYard: same };
    // the visitor goes home (Wave bye), the yard is as before
    await ev(() => { const P = window.__paw, V = P.S.visitors; V.q = []; P.yv.away(0); P.saveNow(); }); await t.home();
    return { key: mine.key, coat: coat.coat, seed: mine.seed };
  };
  const vis = {}; for (const id of ROUNDS) vis[id] = await visit(id);

  // ---- 4. the drawings, animated on the frozen clock: one loop (30 frames) of each pose, read off the page ----
  await t.home(); await p().waitForTimeout(500);
  const draws = [];
  for (const pose of NOODLE_POSES) for (const facing of ['left', 'right']) draws.push({ who: 'noodle', key: 'dachs', pose, facing, o: { pose, facing, outfit: OUTFIT } });
  for (const id of ROUNDS) for (const pose of VIS_POSES) for (const facing of ['left', 'right']) draws.push({ who: id, key: vis[id].key, pose, facing, o: { pose, facing, coat: vis[id].coat, seed: vis[id].seed } });
  await ev(() => { const h = document.createElement('div'); h.id = 'vrHost'; h.style.cssText = 'position:fixed;left:0;top:0;width:480px;height:400px;z-index:99999;background:#fff'; document.body.appendChild(h); });
  const t0 = await freezeClock(p());
  const out = {}; let base = Math.ceil(t0) + 1000; // whole ms, so a loop's start and end are exactly 1000 ms apart
  for (const D of draws) {
    const svg = await ev(([key, o]) => { const s = window.PawArt.dog(key, o); const h = document.getElementById('vrHost'); h.innerHTML = s; return s; }, [D.key, D.o]);
    if (!svg.includes('pa-pose-' + D.pose)) throw new Error(D.who + ' has no ' + D.pose + ' drawing');
    const vis = [];
    for (let n = 0; n < 31; n++) {
      await stepClock(p(), base + n * 1000 / 30);
      vis.push(await ev(() => { const h = document.getElementById('vrHost'), fr = [...h.querySelectorAll('[class*="pa-d-f"]')].filter((e) => /\bpa-d-f\d\b/.test(e.getAttribute('class')));
        const other = document.getAnimations().filter((a) => a.effect && a.effect.target && h.contains(a.effect.target) && !/\bpa-d-f\d\b/.test(a.effect.target.getAttribute('class') || ''));
        if (other.length) return { err: 'other animations: ' + other.map((a) => a.animationName || a.id).join(',') };
        return fr.map((e) => +getComputedStyle(e).opacity); }));
    }
    if (vis.some((v) => v.err)) throw new Error(D.who + ' ' + D.pose + ': ' + vis.find((v) => v.err).err);
    // one loop: frame 30 is frame 0 again
    if (JSON.stringify(vis[30]) !== JSON.stringify(vis[0])) throw new Error(D.who + ' ' + D.pose + ' does not loop in 1 s: ' + JSON.stringify(vis));
    base += 2000;
    out[D.who + '_' + D.pose + '_' + D.facing] = { who: D.who, key: D.key, pose: D.pose, facing: D.facing, svg, vis: vis.slice(0, 30), step: '1000/30 ms, frozen clock' };
  }
  await releaseClock(p());
  console.log('drawings', Object.keys(out).length, 'loops of 30 frames; frames shown in', JSON.stringify(out.noodle_sit_right.vis.map((v) => v.indexOf(1)).join('')));
  fs.writeFileSync(path.join(OUT, 'draw.json'), JSON.stringify(out));
  fs.writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(facts, null, 1));
}, { date: process.env.CAP_DATE || '2026-11-20', timeout: 400000, season: 'autumn', weather: 'sunny' });
