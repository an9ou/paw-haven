// "Noodle is ready for the holidays" dance loop Reel (owner, 25 Nov 2026: "Lets make it"; docs/marketing/DOUGIE_REEL.md): clean captures from a fresh
// worktree of origin/main (game/test_merged.html: node game/build.js && node game/harness.js merged), with the test harness (game/test_lib.js).
// Nothing in main changes. The page date is 25 Nov 2026 (autumn: no Snow Days, no Winter Lights, no Christmas dressing in the game yet), night, the
// festivals left to the date (no override).
//   house.svg   svg.world as the game draws the Cozy House living room at night (our own dog and every other dog left out, the effects layers empty),
//               with the player's own placement of three Cozy Winter decorations from the kind shop (the Cardboard Fireplace by the kitchen, the
//               Cocoa Mug Lamp and the Doggy Snow Globe on the floor at the front) and the dog bed moved out of the shot, as a player places them
//               (S.decor[n].at, S.bedAt: the game's placement mode keeps a spot the player chose while the thing is in sight)
//   props.json  the drawn box (scene units) of every piece of the room: the scene's own children, the furniture (#pack .gr-prop), the decorations,
//               the bed, the bowl
//   draw.json   every drawing of Noodle the Reel uses (PawArt.dog('dachs', { pose, facing, expr, outfit }) as the game's page draws it), one per
//               look x move of the plan in build_dougie.js; each with its three crayon drawings (pa-d-f0..f2)
//   items.json  the item art of every piece of clothing in the looks (PawArt.item, as the wardrobe draws it), for the covers
//   facts.json  the date, the festivals on that date (none), the place name, the clothes checked against CLOTHES and en.json, the game's spark doodle colours,
//               the Felt Fir Tree prop (the crayon tree by the first line), the dog art's CSS, the main commit, and every CSS animation running in the
//               room (none is used: the room is still; the motion is Noodle's)
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/dougie_reel/capture_dougie.js <main checkout> <outdir>
const path = require('path'), fs = require('fs'), cp = require('child_process');
const DEV = path.resolve(process.argv[2] || '.'), OUT = path.resolve(process.argv[3] || 'dougie_caps'); fs.mkdirSync(OUT, { recursive: true });
const { run } = require(path.join(DEV, 'game', 'test_lib'));
const { PLAN, ROOM } = require('./build_dougie.js');
run('dougie_capture', async (t) => {
  const { ev } = t, p = () => t.p, facts = {};
  const closeAll = () => ev(() => { for (let i = 0; i < 5; i++) { const m = document.getElementById('modal'); if (!m || m.hidden) break; const x = m.querySelector('.panel .x'); if (x) x.click(); else break; } });
  await t.newGame({ map215: true, ground: true, head: '~Dachshund', sex: 'boy' }, { coins: 3000, dog: { name: 'Noodle' } });
  await t.calm(); await t.lu();
  facts.main = cp.execFileSync('git', ['-C', DEV, 'rev-parse', '--short', 'HEAD']).toString().trim();
  facts.date = await ev(() => new Date().toISOString().slice(0, 10));
  facts.dogKey = await ev(() => window.__paw.S.dog.key);
  if (facts.dogKey !== 'dachs') throw new Error('the adopted dog is not the dachshund: ' + facts.dogKey);

  // the clothes: every piece of every look is a wearable in main's CLOTHES and has its English name in game/i18n/en.json
  const core = fs.readFileSync(path.join(DEV, 'game', 'src', '00_core.js'), 'utf8'), en = JSON.parse(fs.readFileSync(path.join(DEV, 'game', 'i18n', 'en.json'), 'utf8'));
  facts.clothes = {};
  for (const L of PLAN.looks) for (const [slot, n] of Object.entries(L.o)) {
    const m = new RegExp("\\{ n: '" + n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "', slot: '(\\w+)'([^\\n]*)\\}").exec(core);
    if (!m || m[1] !== slot) throw new Error(n + ' is not a ' + slot + ' wearable in CLOTHES');
    const k = Object.keys(en).find((q) => /^data\.clothes\.[a-z0-9_]+\.n$/.test(q) && en[q] === n); if (!k) throw new Error(n + ' has no name in en.json');
    facts.clothes[n] = { slot, fest: (/fest: '(\w+)'/.exec(m[2]) || [])[1] || null, price: +((/price: (\d+)/.exec(m[2]) || [])[1] || 0), i18n: k };
  }

  // the Cozy House at night: the three decorations out where the player put them, the bed moved out of the shot
  await ev((R) => { const S = window.__paw.S; S.newsSeen = '9.99'; S.wbPend = null; S.awayGiftISO = ''; S.backISO = ''; S.hoTidy = 1; S.decor = S.decor || {};
    for (const [n, at] of Object.entries(R.decor)) S.decor[n] = { out: true, at: at.slice() };
    S.bedAt = S.bedAt || {}; const bed = Object.keys(S.bedAt)[0] || S.bed || 'Old Blanket'; S.bedAt[bed] = R.bed.slice();
    S.sleeping = false; S.place = 'house'; window.__paw.saveNow(); window.__paw.go('yard'); }, ROOM);
  await t.until(() => window.__paw.S.place === 'house' && window.__paw.mode === 'yard' && !!document.querySelector('#view svg.world #hoRoomG'), null, 8000);
  await t.lu(); await p().waitForTimeout(1500); await closeAll(); await p().waitForTimeout(500);
  const r = await ev((R) => { const s = document.querySelector('#view svg.world'), inv = s.getScreenCTM().inverse();
    const bb = (e) => { const r0 = e.getBoundingClientRect(); if (!r0.width && !r0.height) return null; const a = new DOMPoint(r0.left, r0.top).matrixTransform(inv), z = new DOMPoint(r0.right, r0.bottom).matrixTransform(inv); return [a.x, a.y, z.x, z.y].map((v) => Math.round(v * 10) / 10); };
    const sc = s.querySelector('#sceneG svg.pa-wa-house'); if (!sc) return { err: 'no Cozy House scene art in the world' };
    const parts = [];
    [...sc.children].forEach((e, i) => { const b = bb(e); if (b) parts.push({ i, kind: 'scene', tag: e.tagName, fill: e.getAttribute('fill') || '', box: b }); });
    s.querySelectorAll('#pack .gr-prop').forEach((e, i) => { const b = bb(e); if (b) parts.push({ i, kind: 'furniture', id: e.querySelector('[id]') ? e.querySelector('[id]').id : '', box: b }); });
    s.querySelectorAll('.hm-decor').forEach((e) => { const sv = e.querySelector('svg'); parts.push({ kind: 'decor', n: e.getAttribute('data-decor') || e.getAttribute('aria-label') || '', box: bb(sv || e) }); });
    const bed = s.querySelector('#bedG'); if (bed) parts.push({ kind: 'bed', box: bb(bed) });
    const decor = {}; s.querySelectorAll('.hm-decor').forEach((e) => { const n = e.getAttribute('data-decor'); if (n) decor[n] = bb(e.querySelector('svg') || e); });
    // the world without any dog: our own dog (the roaming leader), the pack, the sleep z's, the ball and effects layers
    const c = s.cloneNode(true);
    c.querySelectorAll('.rmdog,.packdog,#zzz,#fx,#ballLayer,#messG,[data-dog],.say,.bubble').forEach((e) => e.remove());
    const left = [...c.querySelectorAll('svg.pa-dog')].length;
    const words = [...c.querySelectorAll('text')].map((e) => e.textContent.trim()).filter(Boolean);
    const anims = document.getAnimations().filter((a) => a.effect && a.effect.target && s.contains(a.effect.target) && !a.effect.target.closest('.rmdog,.packdog,#zzz,#fx'))
      .map((a) => (a.animationName || a.id || 'anim') + ' on ' + (a.effect.target.getAttribute('class') || a.effect.target.tagName));
    return { svg: c.outerHTML, left, words, anims, vb: s.getAttribute('viewBox'), place: window.__paw.S.place, parts, decor,
      name: (document.querySelector('.statuschip,#status,.placechip') || {}).textContent || '',
      data: { time: sc.getAttribute('data-time') || '', night: !!document.querySelector('#view.night,#view .night') } }; }, ROOM);
  if (r.err) throw new Error(r.err);
  if (r.left) throw new Error('a dog is still in the room art: ' + r.left);
  for (const n of Object.keys(ROOM.decor)) if (!r.decor[n]) throw new Error(n + ' is not out in the room');
  fs.writeFileSync(path.join(OUT, 'house.svg'), r.svg);
  facts.scene = { vb: r.vb, place: r.place, words: r.words, anims: r.anims, chip: r.name.trim().slice(0, 80), data: r.data };
  // the festivals the game shows on this date (00_core.js: Snow Days from 12-01, Winter Lights 12-01..12-25): none of the Christmas dressing yet
  if (!/snow: md >= '12-01' \|\| md <= '02-29', lights: md >= '12-01' && md <= '12-25'/.test(core)) throw new Error('the winter festival dates changed');
  const md = facts.date.slice(5); facts.fest = { snow: md >= '12-01' || md <= '02-29', lights: md >= '12-01' && md <= '12-25' };
  facts.placeName = await ev(() => { try { return window.__paw.placeName ? window.__paw.placeName('house') : ''; } catch (e) { return ''; } });
  console.log('room', r.vb, JSON.stringify(facts.scene.data), 'chip', facts.scene.chip, 'anims', r.anims.length, 'words', r.words.join(' | '));
  console.log('decor', JSON.stringify(r.decor));

  // the game's in-room screenshot for reference (the UI as the player sees it)
  await p().screenshot({ path: path.join(OUT, 'house_ingame.png') });

  // Noodle: every drawing of the plan, as the game's page draws it
  const draw = {};
  for (const [li, L] of PLAN.looks.entries()) for (const m of PLAN.movesFor(li)) {
    const key = PLAN.drawKey(li, m); if (draw[key]) continue;
    if (m.expr && !(await ev((a) => window.PawArt.exprOk(a[0], a[1]), [m.expr, m.pose]))) { if (PLAN.strict) throw new Error(m.expr + ' is not a face of the ' + m.pose + ' pose'); continue; }
    const o = { pose: m.pose, facing: m.facing, expr: m.expr || undefined, outfit: L.o };
    const svg = await ev((o) => window.PawArt.dog('dachs', o), o);
    if (!svg.includes('pa-pose-' + m.pose) || (m.expr && !svg.includes('pa-ex-' + m.expr)) || !/Noodle/.test(svg)) throw new Error('no ' + key + ' drawing of Noodle');
    draw[key] = { o, svg };
  }
  console.log('drawings', Object.keys(draw).length);
  facts.dogCss = await ev(() => { const e = document.getElementById('pawart-dogs-css'); return e ? e.textContent : null; });
  if (!facts.dogCss || !/pa-d-b0/.test(facts.dogCss)) throw new Error('no dog art CSS');
  // the crayon tree for the first line: the game's Felt Fir Tree prop
  facts.firTree = await ev(() => window.PawArt.prop('wmfirtree', {}));
  if (!/<svg/.test(facts.firTree)) throw new Error('no Felt Fir Tree prop');
  // the game's spark doodle (world A O.sparkle): its colours
  const wa = fs.readFileSync(path.join(DEV, 'world', 'pawart_world_a.js'), 'utf8');
  const sp = /sparkle\(k,x,y,s,col=C\.yellow\)\{const q=s\*\.16;k\.add\(`<path d="M\$\{x\} \$\{y-s\}Q\$\{x\+q\} \$\{y-q\} \$\{x\+s\*\.9\} \$\{y\}Q\$\{x\+q\} \$\{y\+q\} \$\{x\} \$\{y\+s\}Q\$\{x-q\} \$\{y\+q\} \$\{x-s\*\.9\} \$\{y\}Q\$\{x-q\} \$\{y-q\} \$\{x\} \$\{y-s\}Z" fill="\$\{col\}" stroke="\$\{C\.ink\}" stroke-width="1\.5"/.test(wa);
  if (!sp) throw new Error('the game\'s sparkle doodle changed');
  const C = /const C=\{ink:'(#[0-9A-Fa-f]{6})'[^}]*?yellow:'(#[0-9A-Fa-f]{6})'[^}]*?pink:'(#[0-9A-Fa-f]{6})'/.exec(wa) || /const C=\{ink:'(#[0-9A-Fa-f]{6})'[^}]*?pink:'(#[0-9A-Fa-f]{6})'[^}]*?yellow:'(#[0-9A-Fa-f]{6})'/.exec(wa);
  if (!C) throw new Error('no C colours in world A');
  const yellow = /yellow:'(#[0-9A-Fa-f]{6})'/.exec(wa.slice(wa.indexOf('const C={')))[1], ink = /ink:'(#[0-9A-Fa-f]{6})'/.exec(wa.slice(wa.indexOf('const C={')))[1], pink = /pink:'(#[0-9A-Fa-f]{6})'/.exec(wa.slice(wa.indexOf('const C={')))[1];
  facts.spark = { yellow, ink, pink, shape: 'O.sparkle: a four-point crayon star, q = s x .16, stroke 1.5' };
  // the clothes' own item art, as the game's wardrobe and shops draw it (art('item', name)), for the covers' outfit tiles
  const items = {};
  for (const n of Object.keys(facts.clothes)) { const sv = await ev((n) => window.PawArt.item(n), n); if (!/<svg/.test(sv || '')) throw new Error('no item art for ' + n); items[n] = sv; }
  fs.writeFileSync(path.join(OUT, 'items.json'), JSON.stringify(items));
  fs.writeFileSync(path.join(OUT, 'draw.json'), JSON.stringify(draw));
  fs.writeFileSync(path.join(OUT, 'props.json'), JSON.stringify({ parts: r.parts, decor: r.decor }, null, 1));
  fs.writeFileSync(path.join(OUT, 'facts.json'), JSON.stringify(facts, null, 1));
}, { date: process.env.CAP_DATE || '2026-11-25', timeout: 300000, season: null, time: 'night', weather: 'sunny', fest: null });
