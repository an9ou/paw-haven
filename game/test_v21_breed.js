// V2.1 BREED: Sparkle odds line + meter, Puppy Predictor for a sniffed NPC, openPlaydates({ with }), ancestry + a Sled Noodle
// grand-mix litter, Sparkle revealed last, NEW stamps, Gerald's line, the Sparkle adopt-out confirm, the Doggy Ramp,
// Proud Mum + Rocking Chair, mumInBasket + mum in the basket, the Stone hint + rollTreasure('river'), the launch letter once.
//   node game/run_tests.js game/test_v21_breed.js --jobs 1
require('./test_lib').run('v21_breed', async (t) => {
  const { ok, sec, ev, S } = t;
  sec('crafted save: a Horgi girl + a Dachshund boy, Bond 10, Castle, in season');
  await t.newGame({ sex: 'girl' }, { bond: { level: 10, pts: 3300 }, coins: 1000, house: 'Royal Castle Kennel', careDays: 60, stats: { hunger: 90, happy: 90, energy: 90, clean: 90 } });
  const p = t.p;
  ok(await t.until(() => !!(window.__paw.breed && window.__paw.breed.sparkleNow)), '__paw.breed is exposed with the v2.1 hooks');
  // GENES lane functions (V21.md section 3) may not be merged yet: minimal stubs that follow the spec
  const stubbed = await ev(() => {
    const G = window.PawGenes, out = [];
    if (typeof G.sparkleOdds !== 'function') {
      out.push('sparkleOdds');
      G.sparkleOdds = (o) => {
        const parts = []; if (o.stone) parts.push({ label: 'Sparkle Stone', x: 4 });
        for (let i = 0; i < (o.sparkleParents || 0); i++) parts.push({ label: 'Sparkle parent', x: 1.5 });
        if (o.bondA >= 10 && o.bondB >= 10) parts.push({ label: 'Bond 10', x: 2 }); else if (o.bondA >= 8 && o.bondB >= 8) parts.push({ label: 'Bond 8', x: 1.5 });
        const mult = parts.reduce((m, x) => m * x.x, 1), p = (o.base || 1 / 512) * mult, n = 1 / p, v = Math.abs(n - Math.round(n)) < 0.05 ? Math.round(n) : n.toFixed(1);
        return { p, mult, parts, text: parts.length ? `1 in ${v} today: ${parts.map((x) => `${x.label} ×${x.x}`).join(', ')}` : `1 in ${v}` };
      };
    }
    if (typeof G.ancestry !== 'function') {
      out.push('ancestry');
      const K = ['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle'], k = (x) => (K.includes(x) ? x : 'mutt');
      const rnd = (a) => { const o = {}; for (const x in a) { const v = Math.round(a[x] * 64) / 64; if (v > 0) o[x] = v; } return o; };
      G.ancestry = function anc(rec, lookup, depth = 6) {
        if (rec.anc) return rec.anc; const pa = rec.parents, A = pa && depth > 0 && lookup(pa.dam), B = pa && depth > 0 && lookup(pa.sire);
        if (A && B) { const a = anc(A, lookup, depth - 1), b = anc(B, lookup, depth - 1), m = {}; for (const x in a) m[x] = (m[x] || 0) + a[x] / 2; for (const x in b) m[x] = (m[x] || 0) + b[x] / 2; return rnd(m); }
        if (rec.mix && rec.mix.a && rec.mix.b && k(rec.mix.a) !== k(rec.mix.b)) return { [k(rec.mix.a)]: 0.5, [k(rec.mix.b)]: 0.5 };
        return { [k(rec.key)]: 1 };
      };
    }
    if (typeof G.grandMix !== 'function') {
      out.push('grandMix');
      const NM = G.BREED_NAMES, R = { 'corgi|dachs|husky': 'Sled Noodle', 'corgi|golden|shiba': 'Sunrise Loaf', 'golden|husky|mutt': 'Snowdrift' };
      G.grandMix = (anc) => {
        const breeds = Object.entries(anc).sort((a, b) => b[1] - a[1]), at = (f) => breeds.filter((x) => x[1] >= f);
        if (at(0.125).length >= 4) return { kind: 'everything', name: 'The Everything Dog', label: 'The Everything Dog: yes.', breeds };
        if (at(0.25).length >= 3) { const top = breeds.slice(0, 3).map((x) => x[0]), nm = R[top.slice().sort().join('|')]; return nm ? { kind: 'grand', name: nm, label: `${nm}: ${top.map((x) => NM[x]).join(' + ')}`, breeds } : { kind: 'family', name: `${NM[breeds[0][0]]} family mix`, label: `${NM[breeds[0][0]]} family mix`, breeds }; }
        if (breeds[0][1] >= 0.75) return { kind: 'breed', name: NM[breeds[0][0]], label: NM[breeds[0][0]], breeds };
        if (breeds[1] && breeds[1][1] >= 0.25) { const m = G.MIXES[G.mixKey(breeds[0][0], breeds[1][0])]; return { kind: 'mix', name: m.name, label: `${m.name}: ${NM[breeds[0][0]]} × ${NM[breeds[1][0]]}`, breeds }; }
        return { kind: 'family', name: `${NM[breeds[0][0]]} family mix`, label: `${NM[breeds[0][0]]} family mix`, breeds };
      };
    }
    return out;
  });
  ok(true, 'PawGenes stubs injected for: ' + (stubbed.join(', ') || 'none (GENES lane present)'));
  const ids = await ev(() => {
    const P = window.__paw, S = P.S, f = S.dog; const d = new Date(); d.setDate(d.getDate() - 30);
    const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    f.born = iso(d); f.litters = 0; f.lastLitter = null; f.key = 'corgi'; f.mix = { a: 'corgi', b: 'husky', body: 'corgi', head: 'husky', name: 'Horgi' }; f.genes.M = ['m', 'm'];
    const m = P.addDog({ key: 'dachs', sex: 'male', months: 30 }, 'Otto'); m.bond = { level: 10, pts: 3300 }; m.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; m.genes.M = ['m', 'm'];
    S.inv.charms = (S.inv.charms || []).filter((x) => x !== 'Sparkle Stone'); delete S.found['Sparkle Stone']; delete S.stoneHint; delete S.stoneLetter;
    P.breed.setSeason(f.id, true); P.saveNow(); return { f: f.id, m: m.id };
  });

  sec('ancestry backfill + ancOf');
  const anc = await ev((i) => { const S = window.__paw.S, f = S.dogs.find((d) => d.id === i.f); delete f.anc; Object.values(S.tree).forEach((r) => { delete r.anc; }); window.__paw.breed.backfill(); return { f: f.anc, tf: S.tree[i.f].anc, tm: S.tree[i.m].anc, api: window.__paw.breed.ancOf(i.m) }; }, ids);
  ok(anc.f && anc.f.corgi === 0.5 && anc.f.husky === 0.5 && anc.tf && anc.tf.husky === 0.5, 'backfill: the Horgi girl gets anc { corgi 1/2, husky 1/2 } on the dog and in S.tree');
  ok(anc.tm && anc.tm.dachs === 1 && anc.api.dachs === 1, 'backfill: the Dachshund boy is { dachs 1 }; ancOf() agrees');

  sec('Sparkle odds line: Sparkle Stone + Bond 10');
  await ev((i) => { const S = window.__paw.S; S.dogs.find((d) => d.id === i.f).outfit.charm = 'Sparkle Stone'; S.pupsSinceSparkle = 7; }, ids);
  const sn = await ev((i) => window.__paw.breed.sparkleNow(i.f, i.m), ids);
  ok(Math.abs(sn.p - 1 / 64) < 1e-9, `sparkleNow(dam, sire): p = 1/64 (${sn.text})`);
  await ev(() => window.__paw.breed.openPlaydates());
  ok(await t.until(() => !!document.getElementById('pdOdds') && !!document.getElementById('pdGo')), 'the playdate popup shows a Sparkle line');
  const odds = await p.textContent('#pdOdds');
  ok(/^1 in 64 today: Sparkle Stone ×4, Bond 10 ×2$/.test(odds.trim()), 'odds line: ' + odds);
  ok(/Sparkle Meter: 7 \/ 24/.test(await p.textContent('#pdMeter')), 'it shows Sparkle Meter: 7 / 24');
  await t.SH('odds');
  await ev((i) => { window.__paw.S.dogs.find((d) => d.id === i.f).outfit.charm = null; }, ids);
  ok(/^1 in 256 today: Bond 10 ×2$/.test((await ev((i) => window.__paw.breed.sparkleNow(i.f, i.m), ids)).text), 'without the Stone: 1 in 256 today: Bond 10 ×2');
  await t.closeX(); await t.modalGone();

  sec('openPlaydates({ with }) + Puppy Predictor for a sniffed NPC');
  await ev((i) => window.__paw.breed.openPlaydates({ with: i.m }), ids);
  ok(await t.until((i) => !!document.querySelector(`.pd-dog.on[data-pd="a|${i.m}"]`) && !!document.querySelector(`.pd-dog.on[data-pd="b|${i.f}"]`), ids), 'with: Otto is preselected (and his partner fills in)');
  await t.closeX(); await t.modalGone();
  const npc = await ev((i) => ({ id: 'npc_bruno', name: 'Bruno', key: 'golden', sex: 'male', months: 30, genes: JSON.parse(JSON.stringify(window.__paw.S.dogs.find((d) => d.id === i.m).genes)), owner: 'the Tanakas' }), ids);
  await ev((i) => { window.__paw.S.dogs.find((d) => d.id === i.f).geneTested = true; }, ids);
  await ev((n) => window.__paw.breed.openPlaydates({ npc: n }), npc);
  ok(await t.until(() => !!document.querySelector('.pd-verdict.ok')), 'NPC playdate popup is open and the pair is fine');
  ok(!(await p.locator('.pd-predict').count()), 'no Puppy Predictor before the NPC is sniffed');
  await t.closeX(); await t.modalGone();
  await ev(() => { const S = window.__paw.S; S.sniffed = Object.assign({}, S.sniffed, { npc_bruno: new Date().toISOString().slice(0, 10) }); window.npcTested = (n) => n && n.id === 'npc_bruno'; }); // v2.1 merge: TOWN's real npcTested reads S.sniffed; the window stub stays for lane-only runs
  await ev((n) => window.__paw.breed.openPlaydates({ npc: n }), npc);
  ok(await t.until(() => !!document.querySelector('.pd-predict li')), 'npcTested(npc) true: the Puppy Predictor shows');
  await t.closeX(); await t.modalGone();
  await ev((i) => { delete window.npcTested; delete window.__paw.S.sniffed.npc_bruno; window.__paw.S.dogs.find((d) => d.id === i.f).geneTested = false; }, ids);

  sec('a Sled Noodle litter (Horgi x Dachshund), anc stored');
  let r = await ev((i) => window.__paw.breed.playdate(i.f, i.m, { force: true, size: 4, sparkle: true }), ids);
  let s = await S(); let fd = s.dogs.find((d) => d.id === ids.f);
  const pups = fd.preg ? fd.preg.pups : [];
  ok(r.ok && pups.length === 4, 'playdate -> 4 pups rolled');
  ok(pups.every((x) => x.anc && x.anc.dachs === 0.5 && x.anc.corgi === 0.25 && x.anc.husky === 0.25), 'every pup: anc { dachs 1/2, corgi 1/4, husky 1/4 }');
  ok(pups.every((x) => x.mix && x.mix.grand === 'Sled Noodle' && x.mix.name === 'Sled Noodle'), 'grand-mix: mix.grand and mix.name are "Sled Noodle"');
  ok(pups.every((x) => ['corgi', 'dachs'].includes(x.key) && x.mix.body === x.key && x.mix.a === 'corgi' && x.mix.b === 'dachs' && !!x.mix.head), 'body and head art come from mixOf on the parents\' body keys: ' + pups.map((x) => x.key + '/' + x.mix.head).join(', '));
  ok(pups[0].sparkle === true, 'the first pup is Sparkle (forced)');

  sec('birth: Sparkle last, NEW stamps, Gerald once');
  const keep = await ev((i) => { const S = window.__paw.S, pp = S.dogs.find((d) => d.id === i.f).preg.pups[1]; S.coatBook = { [pp.key + '|' + pp.coat]: '2020-01-01' }; return pp.key + '|' + pp.coat; }, ids);
  await t.freezeMotion(true);
  await ev(() => window.__paw.breed.birthNow());
  ok(await t.until(() => document.querySelectorAll('.lt-birth .lt-card').length === 4, null, 6000), 'the Puppies! popup opens with 4 cards');
  const rev = await ev(() => { const c = [...document.querySelectorAll('.lt-birth .lt-card')]; return { spark: c.map((x) => !!x.querySelector('.lt-spark')), ids: c.map((x) => x.dataset.pup), fresh: c.map((x) => !!x.querySelector('.lt-new')), ger: document.querySelectorAll('.lt-gerald').length, gtxt: (document.querySelector('.lt-gerald') || {}).textContent || '' }; });
  ok(rev.spark[3] && rev.spark.filter(Boolean).length === 1 && rev.ids[3] === pups[0].id, 'the Sparkle pup is revealed last');
  const want = rev.ids.map((id) => { const x = pups.find((q) => q.id === id); return x.key + '|' + x.coat !== keep; });
  ok(JSON.stringify(rev.fresh) === JSON.stringify(want) && rev.fresh.includes(false), `NEW stamp only on coats not in the coat book before (${rev.fresh.join(',')})`);
  ok(rev.ger === 1 && /Congratulations\. I still want my sandwich back\./.test(rev.gtxt), 'Gerald the duck\'s line appears once');
  await t.SH('birth_reveal');
  await p.click('#ltOk'); await t.modalGone();
  s = await S(); const L = s.litters[0];
  ok(L && L.gerald === true && L.pups.every((x) => s.tree[x.id] && s.tree[x.id].anc && s.tree[x.id].anc.dachs === 0.5 && s.tree[x.id].mix.grand === 'Sled Noodle'), 'S.tree records keep anc and mix.grand');

  sec('mumInBasket + mum drawn in the nursery basket');
  ok(await ev((i) => window.__paw.breed.mumInBasket(i.f) === false, ids), 'mumInBasket is false while mum is the active dog');
  ok(await t.until(() => !!document.querySelector('#nurseryG') && !document.querySelector('#nurseryG .ns-mum')), 'the basket shows only the pups while mum is on the stage');
  await ev((i) => { window.__paw.switchDog(i.m); window.__paw.go('yard'); }, ids);
  ok(await ev((i) => window.__paw.breed.mumInBasket(i.f) === true, ids), 'mumInBasket is true when Otto is the active dog');
  ok(await t.until(() => !!document.querySelector('#nurseryG.with-mum .ns-mum svg')), 'mum lies down in the nursery basket with her pups');
  await t.SH('nursery_mum');
  ok(await ev(() => { const r = document.querySelector('#nurseryG rect').getBoundingClientRect(), b = document.getElementById('dogHit').getBoundingClientRect(); return r.right < b.left || r.left > b.right || r.bottom < b.top || r.top > b.bottom; }), 'the basket still does not cover the active dog');
  ok(await ev(() => { window.__paw.S.place = 'market'; const v = window.__paw.breed.mumInBasket(window.__paw.S.litters[0].mum); window.__paw.S.place = 'yard'; return v === false; }), 'mumInBasket is false away from the yard and house');

  sec('Who stays: the Sparkle adopt-out confirm, then the Doggy Ramp');
  const sp = pups[0];
  ok(await ev(() => window.__paw.breed.free()) === 1, 'free spots: 1');
  await ev(() => window.__paw.breed.chooseNow());
  ok(await t.until(() => document.querySelectorAll('.lt-card.ws').length === 4, null, 6000), 'the Who stays? popup opens');
  ok(await ev((id) => document.querySelector(`[data-ws="${id}|stay"]`).getAttribute('aria-pressed') === 'true', sp.id), 'the Sparkle pup starts on Stay');
  await p.click(`[data-ws="${sp.id}|home"]`);
  ok(await t.until(() => !!document.getElementById('wsSpark')), 'Loving home on a Sparkle pup asks first');
  const ctext = (await p.textContent('#wsSpark')).trim();
  const spName = L.pups.find((x) => x.id === sp.id).name;
  ok(ctext === `${spName} is a Sparkle pup. The family will love the glitter too. Send ${spName} to them?`, 'confirm text: ' + ctext);
  await t.SH('sparkle_confirm');
  await p.click('#wsSpNo');
  ok(await t.until((id) => !!document.querySelector(`[data-ws="${id}|stay"][aria-pressed="true"]`), sp.id), '"Keep" goes back and the pup still stays');
  await p.click(`[data-ws="${sp.id}|home"]`); await t.until(() => !!document.getElementById('wsSpYes')); await p.click('#wsSpYes');
  ok(await t.until((id) => !!document.querySelector(`[data-ws="${id}|home"][aria-pressed="true"]`), sp.id), '"Send" moves the Sparkle pup to a loving home');
  const keepId = await ev(() => { const L = window.__paw.S.litters[0]; return (L.pups.find((x) => !x.sparkle && x.key === 'corgi') || L.pups.find((x) => !x.sparkle)).id; });
  await p.click(`[data-ws="${keepId}|stay"]`);
  ok(await t.until((id) => !!document.querySelector(`[data-ws="${id}|stay"][aria-pressed="true"]`), keepId), 'a long-backed pup is marked Stay');
  await p.click('#wsOk');
  ok(await t.until(() => !!document.getElementById('wsBye')), 'goodbye card shows');
  ok(await t.until(() => !!document.getElementById('brRampTip')) && /Long backs love ramps\. Jumping off sofas is hard on a dachshund's spine, so a ramp keeps them comfy\./.test(await p.textContent('#brRampTip')), 'the Doggy Ramp tip shows');
  await t.SH('ramp_tip');
  await p.click('#wsBye2'); await t.untilMode('yard');
  s = await S();
  const kd = s.dogs.find((d) => d.id === keepId), rh = s.rehomed.find((x) => x.id === sp.id);
  ok(s.decor && s.decor['Doggy Ramp'] && s.decor['Doggy Ramp'].out === true && !!s.decor['Doggy Ramp'].got, 'S.decor["Doggy Ramp"] = { got, out: true }');
  ok(kd && kd.anc && kd.anc.dachs === 0.5 && s.tree[kd.id].anc && kd.mix.grand === 'Sled Noodle', 'the kept pup stores anc and its grand-mix');
  ok(rh && rh.sparkle && rh.anc && rh.anc.husky === 0.25, 'the Sparkle pup moved in with a family (anc kept)');

  sec('Proud Mum at the 4th litter + the Stone hint at 10 pups');
  await t.toasts();
  r = await ev((i) => { const S = window.__paw.S, f = S.dogs.find((d) => d.id === i.f), m = S.dogs.find((d) => d.id === i.m); f.litters = 3; f.lastLitter = null; m.restUntil = null; S.pupsBorn = 8; window.__paw.switchDog(i.f); return window.__paw.breed.playdate(i.f, i.m, { force: true, size: 2 }); }, ids);
  ok(r.ok, 'a 4th playdate: ' + r.why);
  ok((await S()).stoneHint === undefined, 'no Stone hint before 10 pups');
  await ev(() => window.__paw.breed.birthNow());
  ok(await t.until(() => !!document.querySelector('.lt-birth'), null, 6000), 'the Puppies! popup opens');
  ok(await p.locator('.lt-gerald').count() === 1, 'Gerald is back once for the new birth');
  s = await S(); fd = s.dogs.find((d) => d.id === ids.f);
  ok(fd.litters === 4 && fd.proud === s.litters[0].born, 'd.proud is set at the 4th litter');
  ok(s.decor['Rocking Chair'] && s.decor['Rocking Chair'].out === true, 'the Rocking Chair decoration is added');
  ok(await t.waitToast(/Proud Mum/), 'a Proud Mum toast');
  ok(s.pupsBorn === 10 && !!s.stoneHint, 'S.stoneHint is set once 10 pups are born');
  const hint = (s.mail || []).filter((m) => /Riverside Trail hums whenever puppies are near/.test(m.text));
  ok(hint.length === 1 && hint[0].kind === 'news', 'a news letter: "Psst. Something on the Riverside Trail hums..."');
  await p.click('#ltOk'); await t.modalGone();
  const rolls = await ev(() => [0, 1, 2].map(() => { const r = window.__paw.breed.rollTreasure('river'); return r.item && r.item.n; }));
  ok(rolls.every((n) => n === 'Sparkle Stone'), "rollTreasure('river') returns the Sparkle Stone");
  ok(await ev(() => { const r = window.__paw.breed.rollTreasure('river', { maxR: 1 }); return !r.item || r.item.n !== 'Sparkle Stone'; }), 'a capped surprise roll (maxR 1) is left alone');
  await ev(() => window.__paw.grant('Sparkle Stone'));
  ok(await ev(() => Array.from({ length: 30 }, () => window.__paw.breed.rollTreasure('river')).every((r) => !r.item || r.item.n !== 'Sparkle Stone')), 'once found, the Stone stops turning up');

  sec('launch letter, once');
  const l1 = await ev(() => window.__paw.breed.stoneLetter()), l2 = await ev(() => window.__paw.breed.stoneLetter());
  s = await S();
  ok(l1 === true && l2 === false && !!s.stoneLetter, 'the Stone owner gets the launch letter once (S.stoneLetter)');
  ok((s.mail || []).filter((m) => /The Sparkle Stone is humming louder than ever\. Maybe it likes puppies\?/.test(m.text)).length === 1, 'exactly one "humming louder" letter');
});
