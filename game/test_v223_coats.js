// v2.23 "Coat pick" (V223.md, owner 7 Nov 2026): the first dog (and a later starter from the Shelter list) comes home in a colour chosen on its
// card, with an eye choice for the husky, the Aussie and merle coats. Checks: every breed's options give the coat they name, stay inside the
// breed's FREQ, never M/M; option 1 is the old STARTER_GENES dog; the meet dog redraws; the pick resets with the dog; Random rolls a valid colour;
// the chosen coat and eyes survive a reload; a Shelter-list starter keeps its colour; the card fits on desktop (1280x720), iPhone 13 (390x844) and
// a 360x740 phone, and so do the Shelter list's starter cards. Review fixes (7 Nov 2026): no amber-eye b/b stand-ins, every Border Collie coat has the
// eye choice (Bl only through the starter preset), the arrow keys reset Boy / Girl, and a Dog Card / Friends dog keeps its eyes and coat pattern.
// COAT_SHOTS=<dir> also writes the card screenshots (lab, border collie with eyes, husky; phone and desktop).
// node game/run_tests.js v223_coats
const { run } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path'); const fs = require('fs');
devices['Phone 360x740'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 740 }, screen: { width: 360, height: 740 } }); // as test_account.js
const SHOTS = process.env.COAT_SHOTS || null;

run('v223_coats', async (t) => {
  const { ok, sec, ev } = t;
  const errs = () => t.errors.filter((e) => !/ERR_CERT|Failed to load resource/.test(e));
  const pickDog = (src) => ev((src) => { const r = new RegExp(src); const b = [...document.querySelectorAll('.heads button')].find((x) => r.test(x.getAttribute('aria-label'))); if (b) b.click(); return !!b; }, src);
  const st = () => ev(() => window.__paw.cp.state());

  sec('1. the table: every breed, every option (in the page, with the real PawGenes)');
  await t.boot({ pupStart: true });
  const R = await ev(() => {
    const G = window.PawGenes, C = window.__paw.cp, out = { bad: [], counts: {}, eyes: {} };
    G.BREEDS.forEach((k) => {
      const cs = C.coats(k), f = G.FREQ[k], cat = G.coatCatalog(k).map((x) => x.coat);
      out.counts[k] = cs.length;
      if (cs.length < 1 || cs.length > 5) out.bad.push(k + ': ' + cs.length + ' options');
      const names = new Set();
      cs.forEach((c, i) => {
        const ph = G.phenotype(c.genes, k, 'x');
        if (ph.coatName !== c.coat) out.bad.push(`${k} ${i}: named ${c.coat}, draws ${ph.coatName}`);
        if (names.has(ph.coatName)) out.bad.push(`${k}: ${ph.coatName} twice`); names.add(ph.coatName);
        if (!cat.includes(ph.coatName)) out.bad.push(`${k}: ${ph.coatName} is not in the breed's coat catalog`);
        const lock = (loc, rec, dom, p) => { const pr = c.genes[loc]; if (p === 0 && pr.includes(rec)) out.bad.push(`${k} ${c.coat}: ${rec} at ${loc} (FREQ 0)`); if (p === 1 && pr.includes(dom)) out.bad.push(`${k} ${c.coat}: ${dom} at ${loc} (FREQ 1)`); };
        lock('B', 'b', 'B', f.b); lock('D', 'd', 'D', f.d); lock('E', 'e', 'E', f.e); lock('S', 'sp', 'S', f.sp);
        if (c.genes.M[0] === 'M' && c.genes.M[1] === 'M') out.bad.push(`${k} ${c.coat}: M/M`);
        if (!f.M && c.genes.M.includes('M')) out.bad.push(`${k} ${c.coat}: merle in a breed without merle`);
        const es = C.eyes(k, i);
        if (es.length) out.eyes[k] = (out.eyes[k] || 0) + 1;
        if (es.length && !C.eyesBy[k]) out.bad.push(`${k}: an eye choice in a breed without one`);
        if (es.length && C.eyesBy[k] === 'merle' && !c.merle) out.bad.push(`${k} ${c.coat}: an eye choice on a coat without merle`);
        (es.length ? es : [null]).forEach((e, j) => {
          const p = C.pick(k, i, j);
          if (i === 0 && j === 0) { if (p !== null) out.bad.push(`${k}: option 1 is not the plain starter`); return; }
          if (!p) { out.bad.push(`${k} ${i}/${j}: no pick`); return; }
          if (p.genes.Bl.includes('Bl') && !f.Bl && k !== 'collie') out.bad.push(`${k} ${c.coat}: Bl in a breed without it`); // the collie: Bl only through the starter preset (its FREQ stays 0)
          if (p.eyes === 'amber' && !(e && C.eyesBy[k]) && !/Chocolate|Liver|Red|Copper|Cinnamon|Fawn and rust/.test(c.coat)) out.bad.push(`${k} ${c.coat}: amber eyes on a coat that is not a liver colour`);
          if (p.genes.M[0] === 'M' && p.genes.M[1] === 'M') out.bad.push(`${k} ${c.coat}: M/M pick`);
          const q = G.phenotype(p.genes, k, p.id);
          if (q.coatName !== c.coat || p.coat !== c.coat) out.bad.push(`${k} ${i}/${j}: pick coat ${p.coat} / ${q.coatName}`);
          if (e && q.eyes !== e.eyes) out.bad.push(`${k} ${c.coat}: wanted ${e.eyes} eyes, the id rolls ${q.eyes}`);
          if (p.eyes !== q.eyes) out.bad.push(`${k} ${c.coat}: stored eyes ${p.eyes}, drawn ${q.eyes}`);
          const nd = C.fields(k, p);
          if (nd.id !== p.id || nd.coat !== p.coat || nd.eyes !== p.eyes || JSON.stringify(nd.genes) !== JSON.stringify(p.genes)) out.bad.push(`${k} ${i}/${j}: newDogFields drops the pick`);
        });
      });
      // option 1 = the old default, byte for byte
      const s = C.starter(k), nd = C.fields(k, null), old = { B: s.B, D: s.D, E: s.E, S: s.S, M: s.M, Bl: s.Bl };
      if (JSON.stringify(nd.genes) !== JSON.stringify(old) || nd.coat !== s.coat || nd.eyes !== s.eyes) out.bad.push(`${k}: the default starter changed`);
      if (JSON.stringify(cs[0].genes.B) !== JSON.stringify(s.B) || G.phenotype(cs[0].genes, k, 'x').coatName !== G.phenotype(old, k, 'x').coatName) out.bad.push(`${k}: option 1 is not the STARTER_GENES coat`);
    });
    return out;
  });
  ok(Object.keys(R.counts).length === 40, '40 breeds have colour options: ' + Object.keys(R.counts).length);
  ok(!R.bad.length, 'every option draws the coat it names, keeps to FREQ, no M/M, option 1 = the old starter, eye picks land: ' + R.bad.slice(0, 6).join(' | '));
  ok(R.counts.lab === 3 && R.counts.collie === 4 && R.counts.husky === 3 && R.counts.westie === 1 && R.counts.dalmatian === 2, 'lab 3, border collie 4 (no tricolour: drawn as black and white), husky 3, westie 1, dalmatian 2: ' + JSON.stringify({ lab: R.counts.lab, collie: R.counts.collie, husky: R.counts.husky }));
  ok(R.counts.samoyed === 1 && R.counts.bichon === 1 && R.counts.corgi === 2 && R.counts.pug === 3 && R.counts.frenchie === 3 && R.counts.pom === 4 && R.counts.dane === 4 && R.counts.mastiff === 2 && R.counts.corso === 3 && R.counts.pitbull === 4, 'review fix: the b/b stand-ins and the corgi black and white are gone: ' + ['samoyed', 'bichon', 'corgi', 'pug', 'frenchie', 'pom', 'dane', 'mastiff', 'corso', 'pitbull'].map((k) => k + ' ' + R.counts[k]).join(', '));
  const names = await ev(() => { const C = window.__paw.cp; return ['pug', 'samoyed', 'frenchie', 'pom', 'dane', 'mastiff', 'corso', 'bichon', 'corgi', 'pitbull'].map((k) => k + ':' + C.coats(k).map((c) => c.coat).join('/')).join(' '); });
  ok(!/pug:[^ ]*Apricot|samoyed:[^ ]*Cream|frenchie:[^ ]*Cream|pom:[^ ]*White|dane:[^ ]*Brindle|mastiff:[^ ]*Apricot|corso:[^ ]*(brindle|Red)|bichon:[^ ]*Cream|corgi:[^ ]*Black and white|pitbull:[^ ]*Brindle/.test(names), 'none of the dropped options is offered: ' + names);
  ok(R.eyes.husky === 3 && R.eyes.aussie === 4 && R.eyes.collie === 4 && !R.eyes.lab, 'eye choices: every husky, Aussie and Border Collie coat (the owner\'s example), none for the lab: ' + JSON.stringify(R.eyes));
  const colB = await ev(() => { const G = window.PawGenes, C = window.__paw.cp, out = []; for (let n = 0; n < 300; n++) { const g = G.randomGenotype('collie'); if (g.Bl.includes('Bl')) out.push('random'); } return { f: G.FREQ.collie.Bl, n: out.length, blue: C.pick('collie', 0, 1), odd: C.pick('collie', 1, 2) }; });
  ok(colB.f === 0 && colB.n === 0, 'random and rescue collies never get Bl (FREQ 0, 300 draws)');
  ok(colB.blue && colB.blue.eyes === 'blue' && colB.blue.coat === 'Black and white' && colB.odd && colB.odd.eyes === 'odd' && colB.odd.coat === 'Chocolate and white', 'a black and white collie with blue eyes, a chocolate and white one with odd eyes: ' + JSON.stringify([colB.blue && colB.blue.eyes, colB.odd && colB.odd.eyes]));
  const total = Object.values(R.counts).reduce((a, b) => a + b, 0);
  console.log('  per-breed options: ' + Object.entries(R.counts).map(([k, n]) => k + ' ' + n).join(', ') + ' (total ' + total + ')');

  sec('2. the card: swatches, the meet dog redraws, the pick resets with the dog (desktop)');
  await t.p.click('#tNew'); await t.p.waitForSelector('#aAdopt');
  ok(await ev(() => !!document.querySelector('.adopt-card .coatpick .cp-sw[aria-pressed="true"]')), 'the adoption card shows the colour row, option 1 picked');
  ok(await pickDog('Labrador'), 'the Labrador');
  await t.until(() => window.__paw.sr && window.__paw.sr.meetKey === 'lab', null, 4000); await t.sleep(1600);
  const labels = await ev(() => [...document.querySelectorAll('.adopt-card [data-cp^="c|"]')].map((b) => b.getAttribute('aria-label')));
  ok(labels.join() === 'Yellow,Black,Chocolate', 'the lab comes in Yellow, Black and Chocolate: ' + labels.join(', '));
  ok(await ev(() => !document.querySelector('.adopt-card [data-cp^="e|"]')), 'no eye choice for a lab');
  for (const [re, k] of [['Yorkshire', 'yorkie'], ['Greyhound', 'greyhound'], ['Border Collie', 'collie']]) { // review fix 5: the swatch is the whole sitting dog, cropped to it, and no two options look the same
    await pickDog(re); await t.until((kk) => window.__paw.sr.meetKey === kk, k, 4000);
    const sw = await ev(() => [...document.querySelectorAll('.adopt-card .cp-sw svg')].map((x) => ({ sit: x.classList.contains('pa-pose-sit'), vb: x.getAttribute('viewBox'), crop: x.hasAttribute('data-cpcrop'), h: x.innerHTML.length + ':' + [...x.querySelectorAll('[fill]')].map((n) => n.getAttribute('fill')).join() })));
    ok(sw.length > 1 && sw.every((x) => x.sit && !x.crop && x.vb && x.vb !== '0 0 240 200' && x.vb === sw[0].vb) && new Set(sw.map((x) => x.h)).size === sw.length, k + ': every swatch is the sitting dog, cropped (' + (sw[0] && sw[0].vb) + '), each option drawn differently');
  }
  await pickDog('Labrador'); await t.until(() => window.__paw.sr.meetKey === 'lab', null, 4000); await t.sleep(1600);
  const meet0 = await ev(() => document.querySelector('#adoptDog .sr-meetdog').innerHTML);
  await t.p.click('[data-cp="c|2"]');
  ok(await t.until((m) => { const g = document.querySelector('#adoptDog .sr-meetdog'); return !!g && g.innerHTML !== m; }, meet0, 3000), 'the meet dog redraws in the new colour');
  let m = await ev(() => window.__paw.cp.meet());
  ok(m && m.key === 'lab' && m.genes.B.join('') === 'bb' && /Chocolate/.test(await ev(() => document.querySelector('.coatpick .cp-lbl').textContent)), 'the meet dog and the card say Chocolate: ' + JSON.stringify(m && m.genes.B));
  ok(await ev(() => /svg/.test(document.querySelector('.heads button[aria-current="true"]').innerHTML)), 'the picked head in the heads row is drawn');
  await t.p.click('#aNext'); let s = await st();
  ok(s.coat === 0 && s.eye === 0 && s.sex === null, 'the next dog starts on its first colour (like Boy / Girl)');
  await t.p.click('[data-cp="c|1"]').catch(() => {}); await t.p.click('#aGirl'); await t.p.keyboard.press('ArrowRight'); s = await st();
  ok(s.coat === 0 && s.eye === 0 && s.sex === null, 'the arrow keys reset the colour and Boy / Girl too: ' + JSON.stringify(s));
  await t.p.click('#aGirl'); await t.p.keyboard.press('ArrowLeft'); s = await st();
  ok(s.sex === null, 'ArrowLeft resets Boy / Girl');
  // collie: blue merle, odd eyes
  await pickDog('Border Collie'); await t.until(() => window.__paw.sr.meetKey === 'collie', null, 4000);
  await t.p.click('[data-cp="c|2"]'); ok(await ev(() => document.querySelectorAll('.adopt-card [data-cp^="e|"]').length) === 3, 'a blue merle collie has three eye choices');
  await t.p.click('[data-cp="e|2"]'); s = await st();
  m = await ev(() => window.__paw.cp.meet());
  ok(s.coat === 2 && s.eye === 2 && m.id === s.id && await ev((id) => window.PawGenes.phenotype(window.__paw.cp.meet().genes, 'collie', id).eyes, m.id) === 'odd', 'the meet dog is the blue merle with odd eyes');
  // Random: a valid colour every time, and not always the first
  const seen = [];
  for (let i = 0; i < 14; i++) { await t.p.click('#aRandom'); const r = await st(); const n = await ev((k) => window.__paw.cp.coats(k).length, r.key); const ne = await ev((a) => window.__paw.cp.eyes(a[0], a[1]).length, [r.key, r.coat]); seen.push(r); if (!(r.coat >= 0 && r.coat < n && r.eye >= 0 && r.eye < Math.max(1, ne) && r.sex)) { seen.bad = r; break; } }
  ok(!seen.bad, 'Random dog rolls a valid colour (and eyes) each time: ' + JSON.stringify(seen.bad || seen.slice(0, 3)));
  ok(seen.some((r) => r.coat > 0), 'Random dog rolls other colours than option 1: ' + seen.map((r) => r.key + ':' + r.coat).join(' '));
  ok(await ev(() => { const s = window.__paw.cp.state(); const b = document.querySelector(`.adopt-card [data-cp="c|${s.coat}"]`); return !b || b.getAttribute('aria-pressed') === 'true'; }), 'the rolled colour is the pressed swatch');

  sec('3. adopt the blue merle collie with odd eyes; it keeps them after a reload');
  await pickDog('Border Collie'); await t.until(() => window.__paw.sr.meetKey === 'collie', null, 4000);
  await t.p.click('[data-cp="c|2"]'); await t.p.click('[data-cp="e|2"]'); const pid = (await st()).id;
  await t.p.click('#aGirl'); await t.p.click('#aAdopt'); await t.p.waitForSelector('#nOk'); await t.p.click('#nOk'); await t.intro(); await t.calm();
  let d = await ev(() => window.__paw.cp.dog());
  ok(d.key === 'collie' && d.id === pid && d.coat === 'Blue merle' && d.eyes === 'odd' && d.shown === 'Blue merle' && d.shownEyes === 'odd' && d.genes.M.join('/') === 'M/m', 'the first dog is the blue merle (M/m) with odd eyes it was on the card: ' + JSON.stringify(d));
  await ev(() => window.__paw.saveNow());
  { const key = 'pawhaven_proto_v1', json = await ev((k) => localStorage.getItem(k), key); // the reload keeps the save (as test_v16b.js reloadKeepingSave)
    await t.ctx.addInitScript(({ k, v }) => { try { if (!sessionStorage.getItem('__reseeded')) { sessionStorage.setItem('__reseeded', '1'); if (localStorage.getItem(k) == null) localStorage.setItem(k, v); } } catch (e) { /* storage blocked */ } }, { k: key, v: json }); }
  await t.p.reload(); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard');
  d = await ev(() => window.__paw.cp.dog());
  ok(d.coat === 'Blue merle' && d.shown === 'Blue merle' && d.shownEyes === 'odd' && d.id === pid, 'after a reload: still a blue merle with odd eyes');
  // review fix 1: the Dog Card, a friend's yard and a friend's walk dog keep the eyes and the merle pattern
  const cd = await ev(() => window.__paw.cp.card());
  ok(cd.wire.e === 3 && cd.wire.p === cd.seed && cd.fr && cd.fr.e === 3 && cd.fr.p === cd.seed, 'the card and friends wire carry the eyes (e: odd = 3) and the pattern seed (p): ' + JSON.stringify({ e: cd.wire.e, p: cd.wire.p, fr: cd.fr && [cd.fr.e, cd.fr.p] }));
  ok(cd.eyes === 'odd' && cd.coat === 'Blue merle' && cd.same, 'the card dog has odd eyes, the blue merle and the very same drawing as at home: ' + JSON.stringify({ eyes: cd.eyes, coat: cd.coat, same: cd.same, id: cd.id }));
  ok(cd.oldId === 'dcv:cpTestCard:0', 'an old card dog (no e, no p) decodes exactly as before: ' + cd.oldId);
  // a later starter from the Shelter list gets the same colour row
  await ev(() => { const S = window.__paw.S; S.house = 'Treehouse Den'; S.dogs[0].bond = { level: 8, pts: 1900 }; S.careDays = 21; S.coins = 2000; });
  await ev(() => window.__paw.sr.list()); await t.waitH2(/Doodle Doggo Shelter/);
  const sk = await ev(() => { const c = [...document.querySelectorAll('.shcard.starter')].find((x) => x.querySelectorAll('[data-shcp*="|c|"]').length > 1); return c ? c.querySelector('[data-shsex]').dataset.shsex.split('|')[0] : null; });
  ok(!!sk, 'a Shelter-list starter card has a colour row: ' + sk);
  const sc0 = await ev((k) => document.querySelector(`[data-shcp="${k}|c|1"]`).getAttribute('aria-label'), sk);
  await t.p.click(`[data-shcp="${sk}|c|1"]`);
  ok(await t.until((k) => { const b = document.querySelector(`[data-shcp="${k}|c|1"]`); return !!b && b.getAttribute('aria-pressed') === 'true'; }, sk, 3000), 'tapping a colour on the Shelter card picks it: ' + sc0);
  await t.p.click(`[data-shsex="${sk}|male"]`); await t.p.click(`[data-shadopt="starter|${sk}"]`); await t.p.waitForSelector('#shOk'); await t.p.click('#shOk');
  ok(await t.until(() => window.__paw.S.dogs.length === 2, null, 6000), 'the second starter came home');
  const d2 = await ev(() => window.__paw.cp.dog(window.__paw.S.dogs[1].id));
  ok(d2.key === sk && d2.shown === sc0 && d2.coat === sc0, `the Shelter-list starter keeps its colour (${d2.key}: ${d2.shown})`);
  ok(!errs().length, 'no page errors: ' + errs().slice(0, 3).join(' | '));
  await t.ctx.close();

  sec('4. no pick = the old starter (default adoption, the old test path)');
  await t.boot({ pupStart: true }); await t.adopt({ sex: 'girl' });
  d = await ev(() => window.__paw.cp.dog()); const sg = await ev((k) => window.__paw.cp.starter(k), d.key);
  ok(JSON.stringify(d.genes) === JSON.stringify({ B: sg.B, D: sg.D, E: sg.E, S: sg.S, M: sg.M, Bl: sg.Bl }) && d.coat === sg.coat && d.eyes === sg.eyes, `a dog adopted without a colour tap is the STARTER_GENES ${d.key} (${d.coat}, ${d.eyes} eyes)`);
  await t.ctx.close();

  sec('5. layout: the card on desktop 1280x720, iPhone 13 (390x844) and a 360x740 phone');
  for (const dev of [null, 'iPhone 13', 'Phone 360x740']) {
    await t.boot({ pupStart: true, device: dev || undefined }); await t.p.click('#tNew'); await t.p.waitForSelector('#aAdopt');
    const tag = dev ? (dev === 'Phone 360x740' ? 'phone360' : 'phone') : 'desktop';
    for (const [re, key, c, e] of [['Labrador', 'lab', 0, 0], ['Border Collie', 'collie', 2, 2], ['Husky', 'husky', 2, 2]]) {
      await pickDog(re); await t.until((k) => window.__paw.sr.meetKey === k, key, 4000);
      if (c) await t.p.click(`[data-cp="c|${c}"]`); if (e) await t.p.click(`[data-cp="e|${e}"]`);
      await t.p.click('#aGirl'); await t.sleep(300);
      const L = await ev((phone) => {
        const vw = innerWidth, vh = innerHeight, bad = [], R = (el) => el.getBoundingClientRect();
        const btns = [...document.querySelectorAll('.adopt-card .cp-sw, .adopt-card .cp-ey')].map(R);
        btns.forEach((r, i) => { if (r.left < 0 || r.right > vw + 0.5) bad.push('swatch ' + i + ' off screen'); if (phone && (r.width < 43.5 || r.height < 43.5)) bad.push('swatch ' + i + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); btns.forEach((q, j) => { if (j > i && Math.min(r.right, q.right) - Math.max(r.left, q.left) > 1 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 1) bad.push('swatches ' + i + '/' + j + ' overlap'); }); });
        const cp = R(document.querySelector('.adopt-card .coatpick')), sx = R(document.querySelector('.adopt-card .sexpick')), hd = R(document.querySelector('.heads'));
        if (cp.top < sx.bottom - 1) bad.push('the colour row overlaps Boy / Girl');
        if (!phone && cp.bottom > hd.top + 1 && document.querySelector('.adopt-card .info').scrollHeight <= document.querySelector('.adopt-card .info').clientHeight) bad.push('the colour row overlaps the heads');
        const dk = document.querySelector('#dock'); if ((phone && dk.scrollWidth > dk.clientWidth + 1) || document.documentElement.scrollWidth > vw + 1) bad.push('sideways scroll'); // desktop: the dock does not scroll sideways (it is 2 px wider than its box without the colour row too)
        const ir = R(document.querySelector('.adopt-card .info')); if (cp.left < ir.left - 0.5 || cp.right > ir.right + 0.5) bad.push('the colour row is wider than the card text');
        const info = document.querySelector('.adopt-card .info');
        if (!phone && info.scrollHeight > info.clientHeight + 1) bad.push('the card text is cut (' + info.scrollHeight + ' > ' + info.clientHeight + ')');
        if (phone) { dk.scrollTop = dk.scrollHeight; }
        const a = R(document.getElementById('aAdopt')); if (a.top < 0 || a.bottom > vh + 0.5) bad.push('Adopt off screen ' + Math.round(a.top) + '..' + Math.round(a.bottom));
        const hit = document.elementFromPoint(a.left + a.width / 2, a.top + a.height / 2); if (!hit || !hit.closest('#aAdopt')) bad.push('Adopt covered by ' + (hit ? hit.className || hit.id || hit.tagName : 'nothing'));
        if (phone) dk.scrollTop = 0;
        return bad;
      }, !!dev);
      ok(!L.length, `${tag} ${key}: the colour row fits (${dev ? '44 px taps, ' : ''}no overlap, Adopt reachable): ${L.slice(0, 4).join(' | ')}`);
      if (SHOTS && dev !== 'Phone 360x740') { fs.mkdirSync(SHOTS, { recursive: true }); if (dev) await ev(() => document.querySelector('.adopt-card .coatpick').scrollIntoView({ block: 'center' })); await t.sleep(1400); await t.p.screenshot({ path: path.join(SHOTS, `adopt_${key}_${tag}.png`) }); }
    }
    ok(!errs().length, tag + ': no page errors: ' + errs().slice(0, 3).join(' | '));
    await t.ctx.close();
  }

  sec('6. the Shelter list\'s starter cards on phones (390x844 and 360x740)');
  for (const dev of ['iPhone 13', 'Phone 360x740']) {
    await t.boot({ pupStart: true, device: dev }); await t.adopt({ sex: 'girl' });
    await ev(() => { const S = window.__paw.S; S.house = 'Treehouse Den'; S.dogs[0].bond = { level: 8, pts: 1900 }; S.careDays = 21; S.coins = 2000; });
    await ev(() => window.__paw.sr.list()); await t.waitH2(/Doodle Doggo Shelter/);
    await ev(() => { const b = document.querySelector('[data-shcp="collie|c|2"]'); if (b) b.click(); });
    await t.until(() => { const b = document.querySelector('[data-shcp="collie|c|2"]'); return !!b && b.getAttribute('aria-pressed') === 'true'; }, null, 3000);
    const L = await ev(() => {
      const vw = innerWidth, bad = [], R = (el) => el.getBoundingClientRect(), cards = [...document.querySelectorAll('.shcard.starter')];
      if (!cards.length) bad.push('no starter cards');
      cards.forEach((c) => {
        const cr = R(c), key = (c.querySelector('[data-shsex]') || { dataset: { shsex: '?' } }).dataset.shsex.split('|')[0];
        if (cr.left < -0.5 || cr.right > vw + 0.5) bad.push(key + ' card off screen');
        const btns = [...c.querySelectorAll('.cp-sw, .cp-ey')].map(R);
        btns.forEach((r, i) => { if (r.width < 43.5 || r.height < 43.5) bad.push(key + ' swatch ' + i + ' ' + Math.round(r.width) + 'x' + Math.round(r.height)); if (r.left < cr.left - 0.5 || r.right > cr.right + 0.5) bad.push(key + ' swatch ' + i + ' outside its card'); btns.forEach((q, j) => { if (j > i && Math.min(r.right, q.right) - Math.max(r.left, q.left) > 1 && Math.min(r.bottom, q.bottom) - Math.max(r.top, q.top) > 1) bad.push(key + ' swatches ' + i + '/' + j + ' overlap'); }); });
        const desc = c.querySelector('.desc'); if (desc && /, .* eyes/.test(desc.textContent)) bad.push(key + ': the coat and eyes line is still on the card');
      });
      const pnl = document.querySelector('#modal .panel'); if (pnl && pnl.scrollWidth > pnl.clientWidth + 1) bad.push('sideways scroll in the sheet');
      if (document.documentElement.scrollWidth > vw + 1) bad.push('sideways page scroll');
      const col = document.querySelector('[data-shcp="collie|c|2"]'); if (col) col.closest('.shcard').scrollIntoView({ block: 'center' });
      return { bad, n: cards.length, eyes: col ? col.closest('.shcard').querySelectorAll('.cp-ey').length : -1 };
    });
    ok(!L.bad.length && L.n > 0, `${dev}: ${L.n} Shelter starter cards fit (44 px taps inside each card, no overlap, no sideways scroll, no duplicate coat line): ${L.bad.slice(0, 4).join(' | ')}`);
    ok(L.eyes === 3, dev + ': the blue merle collie card has its three eye choices: ' + L.eyes);
    if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await t.sleep(600); await t.p.screenshot({ path: path.join(SHOTS, `shelter_collie_${dev === 'iPhone 13' ? 'phone' : 'phone360'}.png`) }); }
    ok(!errs().length, dev + ' shelter: no page errors: ' + errs().slice(0, 3).join(' | '));
    await t.ctx.close();
  }
}, { timeout: 900000 });
