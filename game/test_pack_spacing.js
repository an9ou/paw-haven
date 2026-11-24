// Pack spacing (24 Nov 2026, the owner: "make sure everything is in correct size, no overlapping"): idle dogs never stand, sit or lie on top
// of each other.
//   node game/run_tests.js pack_spacing          (PS_ONLY=home or PS_ONLY=friend: one half; PS_SHOTS=<folder>: a screenshot per scenario)
// Home yard: packs of 3 and 5 (a Great Dane, a Dachshund, a Pug and a Golden with the starter; a pack of five draws its leader and three, as
// the yard always has: 13_more_dogs.js packSVG), 0 and 20 decorations out, at 360x640, 390x844 and 1280x720, the dogs roaming (prefs.rmTest)
// and sampled every 2 s for 40 s. Friend's yard (50_friends.js frLayout): their 2 or 4 dogs and my leader, at the same sizes, every 2 s for 16 s.
// A dog's body box is its drawn art box less its tail and ears (PS_SIDE of the width each side, PS_TOP of the height on top). Two idle dogs (not
// walking, not in a together pose: the leader's social idle, the greeting pair while it greets) may overlap by at most PS_MAX of the smaller
// body box, unless they stand in a clear stagger: the dog behind at least PS_ROW further back and only the bottom PS_LEGS of its body box behind
// the one in front (its legs; the yard's perspective draws it higher and smaller).
const { run, URL } = require('./test_lib');
const { mockInit } = require('./fr_mock');

const PS_SIDE = 0.15, PS_TOP = 0.15, PS_MAX = 0.15, PS_ROW = 30, PS_LEGS = 0.34;
const SIZES = [[360, 640], [390, 844], [1280, 720]];
const PACK5 = ['dane', 'dachs', 'pug', 'golden'];
const DECOR20 = ['Bird Bath', 'Flower Barrel', 'Garden Bench', 'Sandbox', 'Stepping Stones', 'Yard Snowman', 'Felt Fir Tree', 'Present Pile', 'Giant Crayon Box', 'Rocking Chair', 'Doggy Ramp', 'Red Wooden Sled', 'Hammock', 'String Lights', 'Wind Chime', 'Kadomatsu Pair', 'Star Lantern', 'Family Photo Frame', 'Paw-Print Pennant', 'Cauldron Planter'];
const SHOTS = process.env.PS_SHOTS || '';
// the greeting pair's play poses (a few seconds as the visit starts) are a together moment: at 360 px with five dogs the one dog that finds no
// clear spot stands where only the pair's jump reaches over its back for that moment (frLayout's last fallback picks the least covered spot)
const FR_PLAYP = ['jump', 'bow', 'sniff'];
const ONLY = process.env.PS_ONLY || '', CASE = process.env.PS_CASE ? process.env.PS_CASE.split(',') : null; // PS_CASE=360:5:20,1280:3:0 (width:pack:decor; a friend's yard: width:pack)

// in the page: the body boxes of the dogs drawn now (world units), and the pairs over the limit. sel: the dogs' groups and their art
function measure(cfg) {
  const svg = document.querySelector('#view > svg.world'), M0 = svg && svg.getScreenCTM(); if (!M0) return { dogs: [], bad: [], stag: 0 };
  const M = M0.inverse(), W = (x, y) => new DOMPoint(x, y).matrixTransform(M);
  const dogs = cfg.list.map((o) => {
    const el = document.querySelector(o.art); if (!el) return null; const r = el.getBoundingClientRect(); if (!r.width) return null;
    const a = W(r.left, r.top), b = W(r.right, r.bottom), w = b.x - a.x, h = b.y - a.y;
    return Object.assign({}, o, { box: [a.x + w * cfg.side, a.y + h * cfg.top, b.x - w * cfg.side, b.y], raw: [a.x, a.y, b.x, b.y].map(Math.round) });
  }).filter(Boolean);
  const bad = []; let stag = 0;
  for (let i = 0; i < dogs.length; i++) for (let j = i + 1; j < dogs.length; j++) {
    const A = dogs[i], B = dogs[j]; if (A.moving || B.moving || (A.together && B.together)) continue;
    const ix = Math.min(A.box[2], B.box[2]) - Math.max(A.box[0], B.box[0]), iy0 = Math.max(A.box[1], B.box[1]), iy = Math.min(A.box[3], B.box[3]) - iy0; if (ix <= 0 || iy <= 0) continue;
    const ar = (q) => (q.box[2] - q.box[0]) * (q.box[3] - q.box[1]), f = (ix * iy) / Math.min(ar(A), ar(B)); if (f <= cfg.max) continue;
    const back = A.y < B.y ? A : B, front = back === A ? B : A;
    if (front.y - back.y >= cfg.row && iy0 >= back.box[3] - cfg.legs * (back.box[3] - back.box[1])) { stag++; continue; } // a clear stagger: only its legs behind
    bad.push({ a: A.name + ' ' + A.pose + (A.why ? ' ' + A.why : ''), b: B.name + ' ' + B.pose + (B.why ? ' ' + B.why : ''), f: Math.round(f * 100) / 100, A: A.raw, B: B.raw, ya: Math.round(A.y), yb: Math.round(B.y) });
  }
  return { dogs: dogs.length, bad, stag };
}
const CFG = { side: PS_SIDE, top: PS_TOP, max: PS_MAX, row: PS_ROW, legs: PS_LEGS };

async function shot(t, name) { if (!SHOTS) return; try { require('fs').mkdirSync(SHOTS, { recursive: true }); await t.p.screenshot({ path: require('path').join(SHOTS, name + '.png') }); } catch (e) { /* no folder */ } }

async function home(t, w, h, n, dec) {
  const { ok, sec, ev } = t, ph = w < 800, tag = `home ${w}x${h} pack ${n} decor ${dec}`;
  sec(tag);
  await t.mk(Object.assign({ prefs: { rmTest: true } }, ph ? { device: 'iPhone 15', dsf: 2 } : {}));
  if (ph) await t.p.setViewportSize({ width: w, height: h });
  await t.p.goto(URL); await t.p.waitForSelector('#tNew, #tContinue, #tPlay');
  await t.adopt({});
  await t.patch({ bond: { level: 8, pts: 2000 }, coins: 2000 });
  await ev(([n, ks, dec]) => {
    const P = window.__paw, S = P.S; ks.slice(0, n - 1).forEach((k, i) => P.addDog({ key: k, sex: i % 2 ? 'female' : 'male', months: 30 }, 'P' + k));
    S.dogs.forEach((d) => { d.stats = { hunger: 80, happy: 80, energy: 40, clean: 90 }; d.sleeping = false; }); // a little tired: they doze and nap too
    dec.forEach((d) => { S.decor[d] = { out: true }; });
  }, [n, PACK5, dec ? DECOR20 : []]);
  await t.calm(); await t.home('house'); await t.home('yard'); await t.sleep(600);
  await ev(() => { window.__paw.idle.speed(0.5); window.__paw.idle.force('nap'); }); // the leader naps at the door early on (the reported case)
  let worst = [], samples = 0, stag = 0, dogsN = 0;
  for (let s = 0; s < 20; s++) {
    await t.sleep(2000);
    if (s === 8) await ev(() => window.__paw.idle.force('nap'));
    const r = await ev((cfg) => {
      const P = window.__paw, lead = P.S.activeId, act = P.idle.act;
      cfg.list = P.rm.dogs().map((id) => { const p = P.rm.pos(id), d = P.S.dogs.find((x) => x.id === id), g = document.querySelector(`#pack [data-dog="${id}"]`);
        return { name: d.key, pose: p.pose, y: p.y, moving: p.pose === 'walk', together: id === lead ? act === 'social' : false, art: `#pack [data-dog="${id}"] ${id === lead ? '#dogArt' : '.rm-art'}`, g: !!g, why: (id === lead ? 'lead:' + (act || '-') + ' ' : '') + JSON.stringify(P.rm.info(id)).replace(/"/g, '') + ' x' + Math.round(p.x) }; });
      if (act === 'social') cfg.list.forEach((o) => { o.together = true; }); // the leader's together idle poses a pack dog with it
      return (new Function('cfg', 'return (' + cfg.fn + ')(cfg)'))(cfg);
    }, Object.assign({ fn: measure.toString() }, CFG));
    samples++; stag += r.stag; dogsN = Math.max(dogsN, r.dogs); if (r.bad.length) worst.push({ s: (s + 1) * 2, bad: r.bad });
    if (r.bad.length && worst.length === 1) await shot(t, `bad_${w}_${n}_${dec}_${(s + 1) * 2}s`);
    if (r.bad.length && process.env.PS_DEBUG) console.log('DEBUG', JSON.stringify(await ev(() => { const P = window.__paw; const z = P.rm.zone('yard'), fr = []; for (let y = z.y0; y <= z.y1; y += 14) for (let x = z.x0; x <= z.x1; x += 20) if (!P.rm.hard(x, y)) fr.push(x + ',' + y); return { nofree: fr.length, fr: fr.join(' '), no: P.rm.scan().map((b) => b.slice(0, 4).map(Math.round).join(',') + ':' + b[4]).join(' '), free: P.rm.free(), dogs: P.rm.dogs().map((id) => ({ k: P.S.dogs.find((x) => x.id === id).key, c: [true, false, 'loose'].map((lv) => P.rm.cands(id, lv)), least: P.rm.least(id), pos: [P.rm.pos(id).x, P.rm.pos(id).y] })) }; })));
  }
  await shot(t, `home_${w}x${h}_p${n}_d${dec}`);
  ok(dogsN === Math.min(n, 4), `${tag}: ${dogsN} dogs drawn (the yard draws the leader and three)`);
  ok(!worst.length, `${tag}: no two idle dogs over ${PS_MAX * 100}% of the smaller body in ${samples} samples (clear staggers ${stag})` + (worst.length ? ' -> ' + JSON.stringify(worst.slice(0, 3)) : ''));
  await t.ctx.close();
  return worst.length;
}

const ME = { fid: 'ownerxxxxxxxxxxxxxxxxx', code: 'DOG-23456', name: [3, 4] }, SUNNY = 'sunnybiscuitxxxxxxxxxx';
async function friend(t, w, h, n) {
  const { ok, sec, ev } = t, ph = w < 800, tag = `friend's yard ${w}x${h}: ${n} dogs`;
  sec(tag);
  await t.mk(Object.assign({ prefs: { frTest: true, rmTest: true } }, ph ? { device: 'iPhone 15', dsf: 2 } : {}));
  if (ph) await t.p.setViewportSize({ width: w, height: h });
  await t.ctx.addInitScript(mockInit, { hp: false });
  await t.p.goto(URL); await t.p.waitForSelector('#tNew, #tContinue, #tPlay');
  if (await t.p.locator('#tGuest').count()) { await t.p.click('#tGuest'); await t.p.waitForSelector('#tNew'); }
  await t.adopt({}); await t.patch({ bond: { level: 7, pts: 1450 }, coins: 1000 }); await t.calm();
  await t.until(() => !!(window.__paw && window.__paw.fr && window.__frSrv), null, 8000);
  await ev(([me, sunny, ks, n]) => {
    const s = window.__frSrv, B = window.PawGenes.BREEDS; s.me = me; s.events = [];
    s.yardOf[sunny].dogs = ks.slice(0, n - 1).map((k, i) => ({ b: B.indexOf(k), c: null, o: -1, a: 'adult', s: i % 2 ? 'f' : 'm', sp: 0, n: i }));
    s.friends = [{ fid: sunny, name: [0, 0], dogs: s.yardOf[sunny].dogs, seen: 'today', sent: { pet: false, note: false, gift: false, walk: false } }];
  }, [ME, SUNNY, PACK5, n]);
  await ev((f) => window.__paw.fr.visit(f), SUNNY);
  ok(await t.until((f) => window.__paw.mode === 'fryard' && window.__paw.fr.scene().fid === f && document.querySelectorAll('#frDogs .frdog').length > 0, SUNNY, 8000), tag + ': the visit');
  let worst = [], stag = 0, drawn = 0;
  for (let s = 0; s < 8; s++) {
    await t.sleep(2000);
    const r = await ev((cfg) => {
      const sc = window.__paw.fr.scene(), g = window.__paw.fr.greeting();
      cfg.list = sc.dogs.map((v, i) => ({ name: (v.mine ? 'mine ' : '') + v.key, pose: v.pose, y: v.y, moving: v.pose === 'walk' || (!!g && i < 2 && cfg.FR_PLAYP.includes(v.pose)), together: !!g && i < 2, art: `#frDogs [data-frd="${i}"] .fr-art` }));
      return (new Function('cfg', 'return (' + cfg.fn + ')(cfg)'))(cfg);
    }, Object.assign({ fn: measure.toString(), FR_PLAYP }, CFG));
    stag += r.stag; drawn = Math.max(drawn, r.dogs); if (r.bad.length) worst.push({ s: (s + 1) * 2, bad: r.bad });
  }
  await shot(t, `friend_${w}x${h}_${n}`);
  ok(drawn === n, `${tag}: all ${n} dogs drawn (${drawn})`);
  ok(!worst.length, `${tag}: no two idle dogs over ${PS_MAX * 100}% of the smaller body (clear staggers ${stag})` + (worst.length ? ' -> ' + JSON.stringify(worst.slice(0, 3)) : ''));
  await t.ctx.close();
}

run('pack_spacing', async (t) => {
  const want = (k) => !CASE || CASE.includes(k);
  if (ONLY !== 'friend') for (const [w, h] of SIZES) for (const n of [3, 5]) for (const dec of [0, 20]) if (want(`${w}:${n}:${dec}`)) await home(t, w, h, n, dec);
  if (ONLY !== 'home') for (const [w, h] of SIZES) for (const n of [3, 5]) if (want(`${w}:${n}`)) await friend(t, w, h, n);
}, { timeout: 1500000 });
