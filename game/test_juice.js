// v2.25.3 "Happy meters" (54_coinfly.js): the coin flight everywhere, a crayon heart for Bond and a crayon star for town XP.
// Desktop 1280x720 and phone 360x640: coins from a letter's gift (the mailbox), the Grand Treasure Chest, a beach dig and a Fun Fair round each
// send exactly one coin, the counter ends on S.coins; rapid Bond gains merge into ONE heart that pops at the dog and lands on the Bond meter,
// whose bar holds the old value while it flies and ends on the true value; petting sends one heart; a Bond level-up keeps its own card (no
// heart); a town XP gain sends one star to the level star, none at the daily cap; one warm pluck / sparkle per heart / star; the flying layer
// never takes a tap; reduce motion (the game's switch and prefers-reduced-motion) means no flight, a soft highlight; no console errors.
// node game/run_tests.js juice
require('./test_lib').run('juice', async (t) => {
  const { ok, sec, ev } = t;
  const PREFS = { msTest: true, ms2Test: true, lvTest: true, ffTest: true, ddTest: true };
  const shown = () => ev(() => document.getElementById('coinNum').textContent);
  const fmt = (n) => ev((n) => new Intl.NumberFormat('en').format(n), n);
  const coinsNow = () => ev(() => window.__paw.S.coins);
  // every frame for ms: how many coins, hearts and stars are in the air, the first of each kind's centre, the meters' centres and values
  const sample = (ms) => ev((ms) => new Promise((res) => {
    const out = [], t0 = performance.now(), c = (el) => { if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
    const f = () => {
      const L = document.getElementById('cfLayer'), q = (s) => (L ? [...L.querySelectorAll(s)] : []), co = q('.cf-coin'), he = q('.jf-heart'), st = q('.jf-star');
      out.push({ t: Math.round(performance.now() - t0), nc: co.length, nh: he.length, ns: st.length, c: c(co[0]), h: c(he[0]), s: c(st[0]),
        ci: c(document.getElementById('coinIc')), bi: c(document.getElementById('bondIc')), li: c(document.querySelector('#lvBtn .lv-art')),
        num: document.getElementById('coinNum').textContent, bw: document.getElementById('bondFill').style.width, lk: (document.querySelector('#lvBtn .lv-track .fill') || {}).style ? document.querySelector('#lvBtn .lv-track .fill').style.width : '',
        dg: (() => { const d = document.getElementById('dogHit'); return d ? d.getBoundingClientRect().toJSON() : null; })(), bhit: document.querySelector('#hud .bond').classList.contains('jf-hit'), lwig: !!document.querySelector('#lvBtn.lv-wig') });
      if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(out);
    };
    requestAnimationFrame(f);
  }), ms);
  const idle = () => t.until(() => window.__paw.jf.idle(), null, 7000);
  const quiet = async () => { await idle(); await ev(() => { document.getElementById('toasts').innerHTML = ''; }); };
  // a flight: one icon of that kind, on screen a while, starting near src (a box) and landing on its meter
  const judge = (S, kind, src, label, near) => {
    const n = kind === 'coin' ? 'nc' : kind === 'bond' ? 'nh' : 'ns', p = kind === 'coin' ? 'c' : kind === 'bond' ? 'h' : 's', m = kind === 'coin' ? 'ci' : kind === 'bond' ? 'bi' : 'li';
    const fly = S.filter((s) => s[n] > 0), max = Math.max(0, ...S.map((s) => s[n]));
    ok(max === 1, `${label}: exactly one ${kind === 'coin' ? 'coin' : kind === 'bond' ? 'heart' : 'star'} in the air (max ${max})`);
    ok(fly.length > 8, `${label}: it is on screen for a while (${fly.length} frames)`);
    if (!fly.length) return;
    const a = fly[0], z = fly[fly.length - 1];
    if (src === 'dog') src = a.dg;
    if (src) ok(a[p].x >= src.left - 40 && a[p].x <= src.right + 40 && a[p].y >= src.top - 50 && a[p].y <= src.bottom + 40, `${label}: it pops at the source (${Math.round(a[p].x)},${Math.round(a[p].y)} in ${Math.round(src.left)}-${Math.round(src.right)} x ${Math.round(src.top)}-${Math.round(src.bottom)})`);
    if (near !== false) { const d0 = Math.hypot(a[p].x - a[m].x, a[p].y - a[m].y), d1 = Math.hypot(z[p].x - z[m].x, z[p].y - z[m].y); ok(d1 < 28 && (d1 <= d0 || d0 < 6), `${label}: it lands on its meter (${Math.round(d0)} px -> ${Math.round(d1)} px${d0 < 6 ? ', no source in sight: a pop on the meter itself' : ''})`); }
  };

  for (const phone of [false, true]) {
    const L = phone ? 'phone 360x640' : 'desktop 1280x720';
    sec(`${L}: setup`);
    await t.newGame({ sex: 'girl', device: phone ? 'Pixel 7' : undefined, prefs: PREFS }, { bond: { level: 5, pts: 900 }, coins: 1000, stats: { hunger: 60, happy: 70, energy: 90, clean: 90 } });
    if (phone) await t.p.setViewportSize({ width: 360, height: 640 });
    await t.home('yard'); await t.freezeMotion(false);
    await t.until(() => !!(window.__paw && window.__paw.jf && window.__paw.lv && window.__paw.lv.on()), null, 6000);
    await ev(() => { const S = window.__paw.S; S.daily.feed = S.daily.pet = S.daily.play = true; });
    const tg = await ev(() => ({ c: window.__paw.jf.target('coin'), b: window.__paw.jf.target('bond'), x: window.__paw.jf.target('xp') }));
    ok(tg.c && tg.b && tg.x, `${L}: the coin counter, the Bond meter and the level star are all visible on the yard`);
    await quiet();

    sec(`${L}: Bond: rapid gains merge into one heart`);
    const b0 = await ev(() => ({ pts: window.__paw.S.bond.pts, w: document.getElementById('bondFill').style.width, log: window.PawAudio ? window.PawAudio.bondLog.length : 0 }));
    const gainsP = ev(async () => { for (let i = 0; i < 5; i++) { window.__paw.jf.bond(3); await new Promise((r) => setTimeout(r, 110)); } });
    const bs = await sample(2600); await gainsP;
    judge(bs, 'bond', 'dog', `${L} bond x5`);
    const flyB = bs.filter((s) => s.nh > 0);
    ok(flyB.length && flyB.every((s) => s.bw === b0.w), `${L} bond: the bar holds the old value (${b0.w}) while the heart is on its way`);
    ok(bs.some((s) => s.bhit), `${L} bond: the meter squashes as the heart lands`);
    await idle();
    const b1 = await ev(() => { const S = window.__paw.S; const w = document.getElementById('bondFill').style.width; document.getElementById('bondTrack').dataset.k = ''; window.__paw.jf.reset(); return { pts: S.bond.pts, w, w2: document.getElementById('bondFill').style.width }; });
    ok(b1.pts === b0.pts + 15 && b1.w === b1.w2 && b1.w !== b0.w, `${L} bond: the bar ends on the true value (${b0.w} -> ${b1.w}, ${b0.pts} -> ${b1.pts} pts)`);
    ok(await ev((n) => window.PawAudio && window.PawAudio.bondLog.length === n + 1 && window.PawAudio.bondLog[n] === 15, b0.log), `${L} bond: one warm pluck for the merged heart (${await ev(() => window.PawAudio && window.PawAudio.bondLog.join())})`);

    sec(`${L}: Bond: petting the dog`);
    await quiet(); await ev(() => { window.__paw.S.daily.pet = true; });
    const p0 = await ev(() => window.__paw.S.bond.pts);
    const petP = t.pet((p0) => window.__paw.S.bond.pts > p0, p0);
    const ps = await sample(3400); ok(await petP, `${L} pet: petting gave Bond`);
    judge(ps, 'bond', 'dog', `${L} pet`);
    await idle();

    sec(`${L}: Bond: a level-up keeps its own card`);
    await quiet();
    const lu = await ev(() => { const P = window.__paw, S = P.S; const lv = S.bond.level; P.jf.bond(2000); return { lv, now: S.bond.level, txt: document.getElementById('bondLvl').textContent }; });
    const ls = await sample(1200);
    ok(lu.now > lu.lv && lu.txt === String(lu.now), `${L} level-up: Bond ${lu.lv} -> ${lu.now} shows at once`);
    ok(ls.every((s) => s.nh === 0), `${L} level-up: no heart (the level-up card celebrates)`);
    await t.until(() => !document.getElementById('modal').hidden, null, 4000);
    await ev(() => { const b = document.querySelector('#modal .panel .foot .btn.yes, #modal .panel .btn.yes, #modal .panel button.btn'); if (b) b.click(); });
    await t.until(() => document.getElementById('modal').hidden, null, 4000).catch(() => {});
    await ev(() => { if (!document.getElementById('modal').hidden) { const b = document.querySelector('#modal button.btn'); if (b) b.click(); } });
    await t.until(() => document.getElementById('modal').hidden, null, 4000);

    sec(`${L}: town XP: one star`);
    await quiet();
    const x0 = await ev(() => ({ xp: window.__paw.lv.xp(), log: window.PawAudio ? window.PawAudio.xpLog.length : 0, lv: window.__paw.lv.level() }));
    const g = await ev(() => window.__paw.lv.gain('care', 4));
    const xs = await sample(1800);
    ok(g === 4, `${L} xp: lvGain granted 4 XP (${g})`);
    judge(xs, 'xp', null, `${L} xp`);
    ok(xs.some((s) => s.lwig), `${L} xp: the level star wiggles as the star lands`);
    await idle();
    ok(await ev((n) => window.PawAudio && window.PawAudio.xpLog.length === n + 1, x0.log), `${L} xp: one light sparkle`);
    sec(`${L}: town XP: nothing flies at the daily cap`);
    const cap = await ev(() => { const L = window.__paw.lv.day(); L.today = 150; return window.__paw.lv.gain('walk', 8); });
    const cs = await sample(1300);
    ok(cap === 0 && cs.every((s) => s.ns === 0), `${L} xp cap: 0 XP granted, no star (granted ${cap})`);

    sec(`${L}: coins: a letter's gift (the mailbox)`);
    await quiet();
    const m = await ev(() => { const P = window.__paw; const id = 'jt_' + Date.now(); P.mailPush({ id, from: 'Gerald', title: 'A gift', text: 'Hello', gift: { coins: 25 } }); const c0 = P.S.coins; P.mbCollect([id]); const te = [...document.querySelectorAll('#toasts .toast')].find((e) => /Collected/.test(e.textContent)); return { c0, c1: P.S.coins, num: document.getElementById('coinNum').textContent, src: te && te.getBoundingClientRect().width ? te.getBoundingClientRect().toJSON() : null }; });
    ok(m.c1 - m.c0 === 25 && m.num === await fmt(m.c0), `${L} mail: +25 in the balance, the counter waits on ${m.num}`);
    const ms = await sample(1500); judge(ms, 'coin', m.src, `${L} mail`);
    await idle(); ok(await shown() === await fmt(await coinsNow()), `${L} mail: the counter ends on S.coins (${await shown()})`);

    sec(`${L}: coins: the Grand Treasure Chest`);
    await quiet();
    await ev(() => { const S = window.__paw.S; S.mapPieces = [1, 2, 3, 4]; S.secretDug = false; window.__paw.go('yard'); });
    await t.until(() => !!document.getElementById('secretX'), null, 4000);
    const ch0 = await coinsNow();
    await ev(() => document.getElementById('secretX').dispatchEvent(new MouseEvent('click', { bubbles: true })));
    await t.until(() => !!document.querySelector('#modal .unlocks li'), null, 6000);
    ok(await coinsNow() === ch0 + 1000 && await shown() === await fmt(ch0), `${L} chest: +1000 in the balance, the counter waits`);
    const chs = await sample(1700); judge(chs, 'coin', await ev(() => document.querySelector('#modal .unlocks li').getBoundingClientRect().toJSON()), `${L} chest`);
    await idle(); ok(await shown() === await fmt(await coinsNow()), `${L} chest: the counter ends on S.coins`);
    await ev(() => document.getElementById('sdOk').click()); await t.until(() => document.getElementById('modal').hidden, null, 4000);

    sec(`${L}: coins: a beach dig`);
    await quiet(); await t.home('beach'); await t.until(() => !!document.querySelector('[data-pb="dig"]'), null, 4000);
    const d0 = await coinsNow(); await ev(() => document.querySelector('[data-pb="dig"]').click());
    await t.until((d0) => window.__paw.S.coins > d0, d0, 4000);
    const dsrc = await ev(() => { const te = [...document.querySelectorAll('#toasts .toast')].pop(); return te && te.getBoundingClientRect().width ? te.getBoundingClientRect().toJSON() : null; });
    const ds = await sample(1500); judge(ds, 'coin', dsrc, `${L} dig`);
    await idle(); ok(await shown() === await fmt(await coinsNow()), `${L} dig: the counter ends on S.coins`);
    await t.home('yard');

    sec(`${L}: coins: a Fun Fair round`);
    await quiet(); await ev(() => window.__paw.ms.force(['bath'])); // no mission ends with the round (its +40 would be a second coin)
    const place = await ev(() => window.__paw.ff.games.catch.place); await t.home(place);
    await ev(() => { const S = window.__paw.S; S.stats.energy = 100; S.sleeping = false; });
    ok(await ev(() => window.__paw.ff.start('catch')), `${L} fair: Treat Catch starts`);
    await t.until(() => window.__paw.mode === 'fair' && !!window.__paw.ff.g, null, 4000);
    await ev(() => { const g = window.__paw.ff.g; g.score = 12; g.caught = 12; g.t = 10; });
    const f0 = await coinsNow(); await ev(() => window.__paw.ff.end());
    await t.until(() => !!document.querySelector('#ffEnd:not([hidden]) #ffBack'), null, 4000);
    const f1 = await coinsNow(), fsS = await sample(1300);
    const fmax = Math.max(...fsS.map((s) => s.nc)); ok(f1 > f0 ? fmax === 1 : fmax === 0, `${L} fair: ${f1 - f0} coins paid, ${fmax} coin icon at most (the counter is ${await ev(() => window.__paw.cf.target() ? 'visible' : 'hidden')} here)`);
    await idle(); ok(await shown() === await fmt(f1), `${L} fair: the counter ends on S.coins`);
    await ev(() => window.__paw.ff.back()); await t.until(() => window.__paw.mode !== 'fair', null, 4000); await t.home('yard');

    sec(`${L}: the flying layer never takes a tap`);
    await quiet();
    const tap = await ev(async () => {
      const P = window.__paw; P.S.coins += 10; P.cf.fly({ x: 60, y: 300 }, 10); P.jf.bond(3);
      await new Promise((r) => setTimeout(r, 300));
      const L = document.getElementById('cfLayer'), pe = getComputedStyle(L).pointerEvents, ic = L.querySelector('.cf-coin, .jf-icon'); if (!ic) return { pe, none: true };
      const r = ic.getBoundingClientRect(), e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return { pe, hit: !L.contains(e), icPe: getComputedStyle(ic).pointerEvents };
    });
    ok(tap.pe === 'none' && tap.hit !== false && (tap.none || tap.icPe === 'none'), `${L}: taps go through the flying icons (layer pointer-events ${tap.pe})`);
    await idle();

    sec(`${L}: reduce motion (the game's switch)`);
    await t.freezeMotion(true); await quiet(); await t.sleep(800); // the calm highlight shows at most once in 0.7 s
    const rm = await ev(() => { const P = window.__paw; const w0 = document.getElementById('bondFill').style.width; P.jf.bond(6); const g = P.lv.gain('help', 10); return { w0, w1: document.getElementById('bondFill').style.width, glow: document.querySelector('#hud .bond').classList.contains('cf-glow'), g }; });
    const rs = await sample(1200);
    ok(rs.every((s) => s.nh === 0 && s.ns === 0), `${L} calm: no heart and no star fly`);
    ok(rm.w1 !== rm.w0 && rm.glow, `${L} calm: the Bond bar moves at once (${rm.w0} -> ${rm.w1}) with a soft highlight`);
    await t.freezeMotion(false);

    sec(`${L}: reduce motion (prefers-reduced-motion)`);
    await t.p.emulateMedia({ reducedMotion: 'reduce' }); await ev(() => { delete document.documentElement.dataset.motion; });
    await ev(() => { window.__paw.jf.bond(6); window.__paw.S.coins += 5; window.__paw.cf.fly({ x: 100, y: 300 }, 5); });
    const ps2 = await sample(1000); ok(ps2.every((s) => s.nh === 0 && s.nc === 0), `${L}: prefers-reduced-motion: nothing flies`);
    await t.p.emulateMedia({ reducedMotion: 'no-preference' }); await idle();
  }
}, { timeout: 420000 });
