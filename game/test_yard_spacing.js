// v2.33 fix batch (overlap review docs/reviews/V233_overlap_review.md S3, S4): yard decorations stay in sight, the yard visitor stays clear of them.
//   1. at 360x640, 390x844, 768x1024 and 1280x720, with 0, 10, 20 and every yard decoration out, each put out through each path
//      (buy: hoFreeSpot as Barkitecture and the markets; gift: out with no spot + decor:new, as the treasure, family, vet, Halloween and welcome gifts;
//      quiet: out with no spot and no event, as the Trophy Shelf path, settled on the next yard visit):
//      every decoration out is at least 60% in sight (its drawn ink box less what is drawn over it: decorations in front, the dog house, the mailbox,
//      the bowl, the place buttons), none is hidden completely, and the yard visitor's dog and its name chip are clear of every decoration's ink box,
//      the mailbox, the door, the place buttons and chips, and inside the view
//   2. an old save with piled decorations (no S.hoTidy): tidied once on load (only the hidden ones move, a placed one in sight keeps its spot),
//      S.hoTidy = 1, v stays 1, no field dropped; the next reload changes nothing
// node game/run_tests.js yard_spacing      (YS_SHOTS=<dir> writes screenshots at deviceScaleFactor 2)
const { run, URL } = require('./test_lib'); const { devices } = require('playwright'); const path = require('path'); const fs = require('fs');
const SHOTS = process.env.YS_SHOTS || '', SAVE = 'pawhaven_proto_v1';
const dsf = SHOTS ? 2 : 1;
devices['YS 360'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 360, height: 640 }, screen: { width: 360, height: 640 }, deviceScaleFactor: dsf });
devices['YS 390'] = Object.assign({}, devices['Pixel 7'], { viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: dsf });
devices['YS 768'] = Object.assign({}, devices['iPad (gen 7)'], { viewport: { width: 768, height: 1024 }, screen: { width: 768, height: 1024 }, deviceScaleFactor: dsf });
devices['YS 1280'] = { viewport: { width: 1280, height: 720 }, deviceScaleFactor: dsf, isMobile: false, hasTouch: false };
const SIZES = [['s360', 'YS 360'], ['s390', 'YS 390'], ['s768', 'YS 768'], ['s1280', 'YS 1280']].filter(([k]) => !process.env.YS_SIZES || process.env.YS_SIZES.split(',').includes(k)); // YS_SIZES=s390,s1280: a quicker run
// the review's twenty (docs/reviews/V233_overlap_review.md, roam.js), then every other yard decoration
const D20 = ['Tug Post', 'Puddle Pool', 'Play Tunnel', 'Bubble Fountain', 'Bird Bath', 'Flower Barrel', 'Garden Bench', 'Sandbox', 'Stepping Stones', 'Yard Snowman', 'Felt Fir Tree', 'Present Pile', 'Giant Crayon Box', 'Rocking Chair', 'Doggy Ramp', 'Hammock', 'String Lights', 'Wind Chime', 'Star Lantern', 'Family Photo Frame'];
const PREFS = { yvTest: true, rmTest: true };

// in the page: every decoration's seen part from what is drawn (ink boxes, screen px), and the visitor against everything
const MEASURE = () => {
  const R = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
  const ink = (svg) => { let b = null; [...svg.children].forEach((c) => { if (c.tagName === 'defs' || c.tagName === 'title') return; const r = c.getBoundingClientRect(); if (!r.width && !r.height) return; b = b ? [Math.min(b[0], r.left), Math.min(b[1], r.top), Math.max(b[2], r.right), Math.max(b[3], r.bottom)] : [r.left, r.top, r.right, r.bottom]; }); return b && [b[0], b[1], b[2] - b[0], b[3] - b[1]]; };
  const hit = (a, b) => a[0] < b[0] + b[2] && b[0] < a[0] + a[2] && a[1] < b[1] + b[3] && b[1] < a[1] + a[3];
  const ovA = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
  const seen = (b, occ) => { const o = occ.filter((c) => hit(b, c)); if (!o.length) return 1; const cl = (v, i) => Math.min(b[i] + b[i + 2], Math.max(b[i], v)); const cut = (i) => [...new Set([b[i], b[i] + b[i + 2]].concat(...o.map((c) => [c[i], c[i] + c[i + 2]])).map((v) => cl(v, i)))].sort((p, q) => p - q); const xs = cut(0), ys = cut(1); let cov = 0; for (let i = 0; i < xs.length - 1; i++) for (let j = 0; j < ys.length - 1; j++) { const cx = (xs[i] + xs[i + 1]) / 2, cy = (ys[j] + ys[j + 1]) / 2; if (o.some((c) => cx > c[0] && cx < c[0] + c[2] && cy > c[1] && cy < c[1] + c[3])) cov += (xs[i + 1] - xs[i]) * (ys[j + 1] - ys[j]); } return 1 - cov / Math.max(1, b[2] * b[3]); };
  const vis = (e) => { if (!e || e.hidden) return false; const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && +cs.opacity > 0.05; };
  const decs = [...document.querySelectorAll('#view #decorG > [data-decor]')].map((g) => ({ n: g.dataset.decor, b: ink(g.querySelector(':scope > svg')), flat: !!(window.__paw.ho.specs[g.dataset.decor] || {}).flat })).filter((d) => d.b);
  const fixed = ['#houseG', '#mailboxG', '#bowlG'].map((q) => document.querySelector('#view ' + q)).filter(vis).map((e) => { const s = e.querySelector('svg'); return (s && ink(s)) || R(e); });
  const btns = [...document.querySelectorAll('#placeBtns .btn, #status')].filter(vis).map(R);
  const out = decs.map((d, i) => ({ n: d.n, f: +seen(d.b, decs.slice(i + 1).map((o) => o.b).concat(fixed, btns)).toFixed(3) }));
  const v = document.querySelector('#view #visitorG.yv'); let V = null;
  if (v) {
    const dog = R(v.querySelector(':scope > rect')), tagR = v.querySelector('.vtag rect'), tag = tagR ? R(tagR) : null, vw = R(document.getElementById('view'));
    const svg = document.querySelector('#view svg.world'), M = svg.getScreenCTM(), toS = (b) => { const p = svg.createSVGPoint(); p.x = b[0]; p.y = b[1]; const a = p.matrixTransform(M); p.x = b[0] + b[2]; p.y = b[1] + b[3]; const c = p.matrixTransform(M); return [a.x, a.y, c.x - a.x, c.y - a.y]; };
    const door = toS([148, 290, 44, 116]), mb = document.querySelector('#view #mailboxG');
    // (the roam look chips, .rm-look, come and go with the pack dogs walking out of the crop: the picker keeps clear of the ones on show when it draws)
    const html = [...document.querySelectorAll('#placeBtns .btn, #status, #ddWish:not([hidden]), #phPeek, #msBtn:not([hidden])')].filter(vis).map((e) => ({ n: e.id || e.className, b: R(e) }));
    const bad = [], full = window.__paw.yv.full(), feet = window.__paw.yv.at()[1];
    decs.forEach((d) => { const lb = window.__paw.ho.box(d.n); d.bot = lb[1] + lb[3]; });
    [['dog', dog], ['chip', tag]].forEach(([k, b]) => {
      if (!b) { bad.push(k + ' missing'); return; }
      // a dog may stand on a flat thing (the Stepping Stones), its chip may not cover it. A full yard (no clear spot: yv.full()): the visitor stands at
      // the front, in front of things whose feet are behind its own (it is drawn over them, as it should be), never on one in front of it, its chip above
      // its head covering no thing by more than 40%
      decs.forEach((d) => {
        if (k === 'dog' && (d.flat || (full && d.bot <= feet + 2))) return; const a = ovA(b, d.b);
        if (full && k === 'chip' ? a > 0.4 * d.b[2] * d.b[3] : a > 4) bad.push(k + ' on ' + d.n + ' (' + Math.round(a) + ' px2)');
      });
      if (mb && vis(mb) && ovA(b, ink(mb.querySelector('svg')) || R(mb)) > 4) bad.push(k + ' on the mailbox');
      if (ovA(b, door) > 4) bad.push(k + ' on the door');
      html.forEach((h) => { if (ovA(b, h.b) > 4) bad.push(k + ' under ' + h.n); });
      if (b[0] < vw[0] - 1 || b[0] + b[2] > vw[0] + vw[2] + 1 || b[1] < vw[1] - 1 || b[1] + b[3] > vw[1] + vw[3] + 1) bad.push(k + ' outside the view');
    });
    if (full && !(feet >= 580 && window.__paw.yv.at()[4] === 1)) bad.push('a full yard, but not at the front with its chip up');
    V = { id: v.dataset.yv, bad, at: window.__paw.yv.at(), full };
  }
  return { decs: out, n: decs.length, V, model: window.__paw.ho.seen('yard') };
};

run('yard_spacing', async (t) => {
  const { ok, sec, ev } = t;
  const shot = async (n) => { if (!SHOTS) return; fs.mkdirSync(SHOTS, { recursive: true }); await t.p.screenshot({ path: path.join(SHOTS, n + '.png') }); };
  const toYard = async () => {
    await ev(() => { window.__paw.S.place = 'yard'; window.__paw.go('yard'); }); await t.untilMode('yard'); await t.calm(); await t.lu();
    await ev(() => { for (let i = 0; i < 4; i++) { const x = document.querySelector('#modal .panel .x'); if (x) x.click(); } });
    await t.until(() => !!document.querySelector('#view #decorG'), null, 4000); await t.sleep(400);
  };
  // put `names` out through one path (the yard is left first, as a gift usually comes while away)
  const putOut = (names, mode) => ev(([ns, mode]) => {
    const P = window.__paw, S = P.S; S.decor = {};
    if (mode === 'buy') { ns.forEach((n) => { S.decor[n] = { got: '2026-11-20', out: false }; }); ns.forEach((n) => { S.decor[n].at = P.ho.freeSpot(n); S.decor[n].out = true; }); }
    else if (mode === 'gift') ns.forEach((n) => { S.decor[n] = { got: '2026-11-20', out: true }; P.home.emit('decor:new', { name: n }); });
    else ns.forEach((n) => { S.decor[n] = { got: '2026-11-20', out: true }; });
    P.saveNow();
  }, [names, mode]);
  const ALL = await (async () => { await t.newGame({ prefs: PREFS, map215: true, ground: true }); const l = await ev(() => { const P = window.__paw, H = P.ho.specs; return Object.keys(H).filter((n) => P.ho.room(n) === 'yard'); }); await t.ctx.close(); return l; })();
  const MAX = D20.concat(ALL.filter((n) => !D20.includes(n)));
  ok(MAX.length === ALL.length && MAX.length >= 30, 'every yard decoration: ' + MAX.length);

  sec('1. 0, 10, 20 and all ' + MAX.length + ' decorations out, through each path, at four sizes');
  for (const [sz, dev] of SIZES) {
    await t.newGame({ device: dev, prefs: PREFS, map215: true, ground: true }, { coins: 5000 });
    await ev(() => { const P = window.__paw; P.addDog({ key: 'dachs', sex: 'female', months: 30 }, 'Otto'); P.addDog({ key: 'dane', sex: 'male', months: 30 }, 'Bruno'); });
    await ev(() => { const P = window.__paw; P.S.visitors.seen = Date.now() - 30 * 3600e3; P.yv.back(); });
    ok(await ev(() => window.__paw.S.visitors.q.length > 0), sz + ': a yard visitor is waiting');
    for (const cnt of [0, 10, 20, MAX.length]) {
      for (const mode of cnt ? ['buy', 'gift', 'quiet'] : ['buy']) {
        const names = MAX.slice(0, cnt), lab = `${sz} ${cnt} ${mode}`;
        await putOut(names, mode);
        await toYard();
        const m = await ev(MEASURE);
        ok(m.n === cnt, `${lab}: ${cnt} decorations drawn (${m.n})`);
        const low = m.decs.filter((d) => d.f < 0.6), lowM = m.model.filter((d) => d.f < 0.6), min = m.decs.reduce((a, d) => Math.min(a, d.f), 1);
        ok(!low.length, `${lab}: every decoration at least 60% in sight (drawn), the least ${min.toFixed(2)}` + (low.length ? ': ' + low.map((d) => d.n + ' ' + d.f).join(', ') : ''));
        ok(!lowM.length, `${lab}: and by the placement boxes` + (lowM.length ? ': ' + lowM.map((d) => d.n + ' ' + d.f).join(', ') : ''));
        ok(m.V && !m.V.bad.length, `${lab}: the visitor (${m.V && m.V.id}) and its chip clear of the decorations, mailbox, door, buttons and chips, in view` + (m.V ? (m.V.bad.length ? ': ' + m.V.bad.join(', ') + ' at ' + JSON.stringify(m.V.at) : ' at ' + JSON.stringify(m.V.at)) + (m.V && m.V.full ? ' (a full yard: at the front)' : '') : ': no visitor'));
        if (mode === 'quiet' && cnt) ok(await ev(() => window.__paw.ho.tidyOnce().length === 0), `${lab}: settled: another visit moves nothing`);
        if (mode === 'gift' && (cnt === 20 || cnt === MAX.length)) await shot(`${sz}_d${cnt}_after`);
        if (mode === 'buy' && cnt === 0) await shot(`${sz}_d0_after`);
      }
    }
    await t.ctx.close();
  }

  sec('2. an old save with decorations piled up: tidied once, then stable');
  await t.newGame({ prefs: PREFS, map215: true, ground: true });
  const base = await ev(([k, D20]) => {
    const P = window.__paw, S = P.S; S.decor = {};
    // the review's pile: the Tug Post right behind the Crayon Box, the Bubble Fountain behind the Fir Tree, the Doggy Ramp behind the Flower Barrel,
    // the Hammock on the dog house, the Present Pile on the Sandbox (catalogue spots), and the rest where they once were put
    D20.forEach((n) => { S.decor[n] = { got: '2026-11-01', out: true }; });
    const at = { 'Giant Crayon Box': [500, 420], 'Tug Post': [520, 400], 'Felt Fir Tree': [600, 330], 'Bubble Fountain': [606, 356], 'Flower Barrel': [300, 470], 'Doggy Ramp': [302, 486], 'Hammock': [660, 400], 'Garden Bench': [720, 518], 'Bird Bath': [24, 300] };
    Object.keys(at).forEach((n) => { S.decor[n].at = at[n]; });
    P.saveNow(); const s = JSON.parse(localStorage.getItem(k)); delete s.hoTidy; return s;
  }, [SAVE, D20]);
  const before = await ev((s) => { const P = window.__paw; P.S.decor = s.decor; return P.ho.seen('yard'); }, base);
  const hidden = before.filter((o) => o.f < 0.6).map((o) => o.n), fine = before.filter((o) => o.f >= 0.6).map((o) => o.n);
  ok(hidden.includes('Tug Post') && hidden.includes('Bubble Fountain') && hidden.length >= 4, 'the piled save has hidden things: ' + hidden.join(', '));
  base.visitors.seen = Date.now() - 30 * 3600e3; // a visitor comes on this load
  const cont = async (save) => { const was = t.ctx; await t.mk({ storage: { [SAVE]: JSON.stringify(save) }, prefs: PREFS, map215: true, ground: true }); await was.close(); await t.p.goto(URL); await t.p.waitForSelector('#tContinue'); await t.p.click('#tContinue'); await t.untilMode('yard'); await t.calm(); await t.lu(); await t.sleep(300); };
  await cont(base);
  const m1 = await ev(() => { const S = window.__paw.S; return { v: S.v, keys: Object.keys(S), flag: S.hoTidy, decor: JSON.parse(JSON.stringify(S.decor)), seen: window.__paw.ho.seen('yard') }; });
  const lost = Object.keys(base).filter((k) => !m1.keys.includes(k));
  ok(m1.v === 1 && !lost.length && m1.flag === 1, 'v stays 1, no field dropped, S.hoTidy = 1' + (lost.length ? ': lost ' + lost.join(' ') : ''));
  ok(m1.seen.every((o) => o.f >= 0.6), 'every decoration is now at least 60% in sight: ' + m1.seen.map((o) => o.n + ' ' + o.f).join(', '));
  const kept = fine.filter((n) => JSON.stringify(m1.decor[n].at) === JSON.stringify(base.decor[n].at));
  ok(kept.length === fine.length, 'a thing already in sight keeps its spot (' + kept.length + ' of ' + fine.length + ')' + (kept.length < fine.length ? ': moved ' + fine.filter((n) => !kept.includes(n)).join(', ') : ''));
  ok(hidden.every((n) => Array.isArray(m1.decor[n].at) && JSON.stringify(m1.decor[n].at) !== JSON.stringify(base.decor[n].at)), 'each hidden one has a new spot of its own');
  ok(Object.keys(base.decor).every((n) => m1.decor[n] && m1.decor[n].out === true), 'nothing put away or taken');
  const md = await ev(MEASURE);
  ok(md.decs.every((d) => d.f >= 0.6), 'drawn: every decoration at least 60% in sight, the least ' + md.decs.reduce((a, d) => Math.min(a, d.f), 1));
  ok(md.V && !md.V.bad.length, 'the visitor clear of the decorations' + (md.V ? ': ' + md.V.bad.join(', ') : ': no visitor'));
  const s1 = await ev((k) => { window.__paw.saveNow(); return JSON.parse(localStorage.getItem(k)); }, SAVE);
  await cont(s1);
  const m2 = await ev(() => ({ flag: window.__paw.S.hoTidy, decor: JSON.parse(JSON.stringify(window.__paw.S.decor)) }));
  ok(m2.flag === 1 && JSON.stringify(m2.decor) === JSON.stringify(s1.decor), 'the next load changes nothing');
  const s2 = await ev((k) => { window.__paw.saveNow(); return JSON.parse(localStorage.getItem(k)); }, SAVE);
  await cont(s2);
  ok(JSON.stringify(await ev(() => window.__paw.S.decor)) === JSON.stringify(s1.decor), 'nor the one after');
  // a placement the player chooses later stays, even if it hides something (the tidy runs once)
  await ev(() => { const P = window.__paw; P.ho.move('Tug Post', 500, 420); });
  const tp = await ev(() => window.__paw.S.decor['Tug Post'].at.slice());
  await toYard();
  ok(JSON.stringify(await ev(() => window.__paw.S.decor['Tug Post'].at)) === JSON.stringify(tp), "the player's own spot is kept after the one-time tidy: " + JSON.stringify(tp));
}, { timeout: 900000 });
