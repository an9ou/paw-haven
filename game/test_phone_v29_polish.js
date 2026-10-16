// phone_v29_polish (V29.md section 3, POLISH lane): the phone fixes at 360x740 and 390x844 (iPhone 15 profile, viewport set explicitly).
//   1 the Play board's sniff summary names the dog and fits;   2 the painter's chip labels have room;
//   3 the yard missions clipboard stays tappable (44 px) while a Feed, Play or Care tray is open;
//   4 the playdate pals' noses keep clear of each other in the bow pose;   5 the map controls stay clear of the place names after panning and zooming.
// node game/run_tests.js phone_v29_polish
const { run } = require('./test_lib');

async function suite(t, W, H) {
  const { ok, sec, ev } = t; const tag = W + 'px';
  await t.newGame({ sex: 'girl', device: 'iPhone 15' }, { bond: { level: 10, pts: 3300 }, coins: 5000, house: 'Royal Castle Kennel', careDays: 60, stats: { hunger: 90, happy: 90, energy: 90, clean: 90 } });
  const p = t.p; await p.setViewportSize({ width: W, height: H });
  await ev(() => { window.R = (e) => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }; }); // a page helper: the rect of an element as [left, top, right, bottom]
  ok(await ev(() => document.documentElement.dataset.layout === 'phone'), `${tag}: phone layout`);
  const ids = await ev(() => {
    const P = window.__paw, S = P.S, f = S.dog; const d = new Date(); d.setDate(d.getDate() - 30);
    const iso = (x) => `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
    f.born = iso(d); f.litters = 0; f.lastLitter = null; f.key = 'corgi'; f.mix = { a: 'corgi', b: 'husky', body: 'corgi', head: 'husky', name: 'Horgi' }; f.genes.M = ['m', 'm']; f.geneTested = true;
    const m = P.addDog({ key: 'dachs', sex: 'male', months: 30 }, 'Otto'); m.bond = { level: 10, pts: 3300 }; m.stats = { hunger: 90, happy: 90, energy: 90, clean: 90 }; m.genes.M = ['m', 'm']; m.geneTested = true;
    P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pickle'); P.addDog({ key: 'beagle', sex: 'female', months: 30 }, 'Mrs Waggington'); P.S.sniffer = true;
    P.breed.setSeason(f.id, true); P.saveNow(); return { f: f.id, m: m.id };
  });

  const settle2 = async () => { let last = ''; for (let i = 0; i < 40; i++) { const cur = await ev(() => document.getElementById('mapInner').style.transform + document.getElementById('mapInner').getBoundingClientRect().left); if (cur === last) return; last = cur; await t.sleep(80); } };
  sec(`${tag}: 1 the Play board names the dog`);
  await t.home('square'); await t.calm();
  await ev(() => window.__paw.town.openBoard()); await p.waitForSelector('.pbcard');
  await p.locator('[data-sniff="0"]').first().tap();
  ok(await t.until(() => !!document.querySelector('.pbcard[data-npc="0"] .pbsniff'), null, 3000), `${tag}: the sniff summary shows`);
  const sn = await ev(() => ({ txt: document.querySelector('.pbcard[data-npc="0"] .pbsniff').textContent.trim(), name: document.querySelector('.pbcard[data-npc="0"] > b').childNodes[0].textContent.trim(), fs: parseFloat(getComputedStyle(document.querySelector('.pbsniff')).fontSize), sw: document.documentElement.scrollWidth, iw: innerWidth, r: R(document.querySelector('.pbcard[data-npc="0"] .pbsniff')), card: R(document.querySelector('.pbcard[data-npc="0"]')) }));
  ok(sn.txt.startsWith(sn.name + ' sniffed:'), `${tag}: the summary names the dog: "${sn.txt}"`);
  ok(sn.fs >= 15 && sn.sw === sn.iw && sn.r[0] >= sn.card[0] && sn.r[2] <= sn.card[2] + 0.5, `${tag}: 15 px text, no sideways scroll, inside its card`);
  await t.SH('board_' + tag); await t.closeX(); await t.modalGone();

  sec(`${tag}: 2 the painter chips`);
  await ev(() => window.__paw.town.twOpenPainter()); await p.waitForSelector('.painter .tw-pick');
  const ch = await ev(() => {
    const note = document.getElementById('twPickNote').getBoundingClientRect(), panel = document.querySelector('#modal .panel').getBoundingClientRect();
    return { note: [note.left, note.top, note.right, note.bottom], panel: [panel.left, panel.top, panel.right, panel.bottom], sw: document.documentElement.scrollWidth, iw: innerWidth, c: [...document.querySelectorAll('.painter .tw-pick')].map((b) => ({ n: b.textContent.trim(), b: R(b), s: R(b.querySelector('span')), h: R(b.querySelector('svg')), fs: parseFloat(getComputedStyle(b.querySelector('span')).fontSize) })) };
  });
  ok(ch.c.length === 4, `${tag}: four chips`);
  ok(ch.c.every((c) => c.s[0] >= c.b[0] && c.s[2] <= c.b[2] + 0.5 && c.s[1] >= c.b[1] && c.s[3] <= c.b[3] + 0.5 && c.s[0] >= c.h[2] - 1), `${tag}: every name sits inside its chip, beside the head`);
  ok(ch.c.every((c, i) => ch.c.every((d, j) => i === j || !t.hitR(c.b, d.b))), `${tag}: no two chips overlap`);
  ok(ch.c.every((c) => c.b[3] <= ch.note[1] + 0.5 && c.b[0] >= ch.panel[0] && c.b[2] <= ch.panel[2]), `${tag}: chips clear the note and stay inside the sheet`);
  ok(ch.c.every((c) => c.fs >= 15 && c.b[3] - c.b[1] >= 43.5 && c.b[2] - c.b[0] >= 43.5) && ch.sw === ch.iw, `${tag}: 15 px labels, 44 px chips, no sideways scroll`);
  await t.SH('painter_' + tag); await t.closeX(); await t.modalGone();

  sec(`${tag}: 3 the clipboard stays tappable under a tray`);
  await t.home('yard'); await t.calm(); await t.freezeMotion(true);
  await t.until(() => !!document.querySelector('#msCardG > rect'), null, 8000);
  const clip = () => ev(() => { const g = document.getElementById('msCardG'), r = g && g.querySelector(':scope > rect'); if (!r) return null; const q = (s) => { const e = document.querySelector(s); return e ? R(e) : null; };
    const b = R(r), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, top = document.elementFromPoint(cx, cy); return { vis: getComputedStyle(g).visibility, b, w: b[2] - b[0], h: b[3] - b[1], dog: q('#dogHit'), mail: q('#mailboxG > rect') || q('#sceneG [data-hot=mailbox]'), on: !!top && !!top.closest('#msCardG'), topEl: top ? (top.tagName + '#' + top.id + '.' + String(top.className.baseVal != null ? top.className.baseVal : top.className).slice(0, 30) + ' in ' + ((top.closest('[id]') || {}).id || '')) : null, iw: innerWidth, cx, cy }; });
  const settle = async () => { let last = ''; for (let i = 0; i < 40; i++) { const cur = JSON.stringify(await ev(() => { const r = document.querySelector('#msCardG > rect'); return r ? R(r).map(Math.round) : null; })); if (cur === last) return; last = cur; await t.sleep(80); } }; // the scene stops resizing: two equal reads in a row
  const idle = await clip(); ok(idle && idle.w >= 47.5 && idle.h >= 47.5, `${tag}: no tray: the tap rect is 48 px (${idle && Math.round(idle.w)}x${idle && Math.round(idle.h)})`);
  for (const a of ['feed', 'play', 'care']) {
    await p.locator(`#bar [data-act=${a}]`).tap(); ok(await t.waitPop(true), `${tag}: ${a} tray opens`);
    ok(await t.until(() => { const r = document.querySelector('#msCardG > rect'); if (!r) return false; const b = r.getBoundingClientRect(); return b.width >= 43.5 && b.height >= 43.5; }, null, 4000), `${tag}: ${a} tray: the tap rect grows back to 44 px as the scene shrinks`);
    await settle(); const c = await clip();
    ok(c && c.vis !== 'hidden', `${tag}: ${a} tray: the clipboard is not hidden`);
    ok(c && c.w >= 43.5 && c.h >= 43.5, `${tag}: ${a} tray: tap rect ${c && Math.round(c.w)}x${c && Math.round(c.h)} >= 44`);
    ok(c && c.b[0] >= 0 && c.b[2] <= c.iw && !t.hitR(c.b, c.dog) && !t.hitR(c.b, c.mail), `${tag}: ${a} tray: on screen, clear of #dogHit and the mailbox`);
    ok(c && (c.on || /^SECTION#dock/.test(c.topEl)), `${tag}: ${a} tray: only the tray's own backdrop sits on it (${c && c.topEl})`);
    if (a === 'feed') await t.SH('clipboard_tray_' + tag);
    await p.touchscreen.tap(c.cx, c.cy);
    ok(await t.until(() => !!document.querySelector('#modal:not([hidden]) .panel.ms-pop'), null, 5000), `${tag}: ${a} tray: a tap opens the Missions sheet`);
    ok(await t.waitPop(false), `${tag}: ${a} tray: and the tray closes (like any tap outside it)`);
    await t.closeX(); await t.modalGone();
    await t.until(() => { const r = document.querySelector('#msCardG > rect'); if (!r) return false; const b = r.getBoundingClientRect(); return b.width >= 47.5; }, null, 4000);
  }
  const after = await clip(); ok(after && after.w >= 47.5 && after.h >= 47.5, `${tag}: tray closed: the 48 px rect is back`);

  sec(`${tag}: 4 the bow pose`);
  await t.freezeMotion(false); // with Motion off the scene runs its three phases in 60 / 120 / 200 ms
  await ev(() => window.__paw.breed.openPlaydates()); await t.until(() => !!document.getElementById('pdGo'));
  await p.locator(`.pd-dog[data-pd="a|${ids.f}"]`).tap(); await t.until((i) => !!document.querySelector(`.pd-dog.on[data-pd="b|${i.m}"]`), ids);
  // hold the scene's three phase timers (900 / 2100 / 3000 ms) so each pose can be measured while it is on screen, however slow the machine is, then release them in order
  await ev(() => { window.__held = []; window.__st = window.setTimeout; window.setTimeout = (f, ms, ...a) => { if (ms === 900 || ms === 2100 || ms === 3000) { window.__held.push([ms, f]); return 0; } return window.__st(f, ms, ...a); }; });
  await p.locator('#pdGo').tap(); await t.until(() => !!document.querySelector('.pd-scene.ph-bow'), null, 4000);
  const pals = () => ev(() => ({ a: R(document.querySelector('.pd-pal.a')), b: R(document.querySelector('.pd-pal.b')), sc: R(document.getElementById('pdScene')), pr: R(document.querySelector('#modal .panel')) }));
  await ev(() => document.querySelectorAll('.pd-pal').forEach((e) => { e.style.animation = 'none'; })); // pin the bounce: the boxes are measured, not the wobble
  const bow = await pals();
  ok(bow.b[0] - bow.a[2] >= 4, `${tag}: in the bow the two pal boxes no longer overlap (gap ${Math.round(bow.b[0] - bow.a[2])} px; it was -12)`);
  ok(bow.a[0] >= bow.sc[0] && bow.b[2] <= bow.sc[2] && bow.sc[0] >= bow.pr[0] - 1 && bow.sc[2] <= bow.pr[2] + 1, `${tag}: both pals still fit inside the scene and the sheet`);
  await t.SH('bow_' + tag);
  const release = async (ms) => { await ev((ms) => { const h = window.__held.find((x) => x[0] === ms); if (h) h[1](); }, ms); };
  await ev(() => { window.setTimeout = window.__st; });
  await release(900); ok(await t.until(() => !!document.querySelector('.pd-scene.ph-chase'), null, 3000), `${tag}: the scene goes on to the chase`);
  await release(2100); ok(await t.until(() => !!document.querySelector('.pd-scene.ph-rest'), null, 3000), `${tag}: and lies down together`);
  const rest = await pals(); ok(rest.a[0] < rest.b[0] && rest.a[0] >= rest.sc[0] && rest.b[2] <= rest.sc[2], `${tag}: the later phases keep their v2.3 places, inside the scene`);
  await release(3000); ok(await t.until(() => !!document.getElementById('pdResult'), null, 8000), `${tag}: the result shows`);
  await p.locator('#pdOk').tap(); await t.modalGone();

  sec(`${tag}: 5 the map controls after panning and zooming`);
  await ev(() => { window.__paw.S.place = 'yard'; window.__paw.go('map'); }); await p.waitForSelector('#mapZoom'); await t.until(() => document.querySelectorAll('#mapInner svg text').length > 5, null, 6000); await settle2();
  const hits = () => ev(() => { const ctl = ['#mapX', '#mapZoom'].map((s) => R(document.querySelector(s))); return [...document.querySelectorAll('#mapInner svg text')].filter((e) => e.textContent.trim().length > 1).filter((e) => { const r = R(e); return ctl.some((c) => r[2] > c[0] && r[0] < c[2] && r[3] > c[1] && r[1] < c[3]); }).map((e) => e.textContent.trim()); });
  const drag = async (dx, dy) => { await p.mouse.move(200, 420); await p.mouse.down(); for (let i = 1; i <= 8; i++) await p.mouse.move(200 + dx * i / 8, 420 + dy * i / 8); await p.mouse.up(); };
  ok((await hits()).length === 0, `${tag}: the default view is clear`);
  let worst = [], n = 0;
  for (let i = 0; i < 20; i++) {
    await drag(i < 4 ? 300 : -70, i % 3 === 0 ? 40 : -25);
    const clear = await t.until(() => { const ctl = ['#mapX', '#mapZoom'].map((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }); return ![...document.querySelectorAll('#mapInner svg text')].filter((e) => e.textContent.trim().length > 1).some((e) => { const r = e.getBoundingClientRect(); return ctl.some((c) => r.right > c[0] && r.left < c[2] && r.bottom > c[1] && r.top < c[3]); }); }, null, 2500);
    n++; if (!clear) worst.push(i + ':' + (await hits()).join('/'));
  }
  ok(worst.length === 0, `${tag}: after each of ${n} drags no place name stays under the X or the zoom column${worst.length ? ' -> ' + worst.join(' | ') : ''}`);
  await t.SH('map_panned_' + tag);
  const zbad = [];
  for (const f of ['#mapZin', '#mapZin', '#mapZin', '#mapZout', '#mapZout', '#mapZout', '#mapZout']) {
    await p.locator(f).tap();
    const clear = await t.until(() => { const ctl = ['#mapX', '#mapZoom'].map((s) => { const r = document.querySelector(s).getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }); return ![...document.querySelectorAll('#mapInner svg text')].filter((e) => e.textContent.trim().length > 1).some((e) => { const r = e.getBoundingClientRect(); return ctl.some((c) => r.right > c[0] && r.left < c[2] && r.bottom > c[1] && r.top < c[3]); }); }, null, 2500);
    if (!clear) zbad.push(f + ':' + (await hits()).join('/'));
  }
  ok(zbad.length === 0, `${tag}: after each zoom tap the names stay clear of the controls${zbad.length ? ' -> ' + zbad.join(' | ') : ''}`);
  const zr = await ev(() => { const z = document.getElementById('mapZoom'), b = [...z.querySelectorAll('button')].map((x) => { const r = x.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; }); const r = z.getBoundingClientRect(); return { b, r: [r.left, r.top, r.right, r.bottom], iw: innerWidth, ih: innerHeight, sw: document.documentElement.scrollWidth }; });
  ok(zr.b.every(([w, h]) => w >= 44 && h >= 44) && zr.r[0] >= 0 && zr.r[2] <= zr.iw && zr.r[3] <= zr.ih && zr.sw === zr.iw, `${tag}: the zoom buttons are 44 px and on screen wherever the column ended up`);
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
}

(async () => { for (const [W, H] of [[360, 740], [390, 844]]) await run('phone_v29_polish_' + W, (t) => suite(t, W, H), { device: 'iPhone 15', timeout: 300000 }); })();
