#!/usr/bin/env node
// Doodle Doggo playtest (skill paw-playtest): plays the real game (the test harness build) as three kinds of player over a simulated week
// and reports where each one gets bored, stuck or runs out of things to do. Findings go to the Game Manager; this tool changes nothing.
//
//   NODE_PATH=$(npm root -g) PAW_ARGS=--ignore-certificate-errors node tools/playtest.js [options]
//     --profile <list>     light,regular,keen (default all three)
//     --days <n>           days to play, 1-30 (default 7)
//     --phone              play at 360x640 (phone layout) instead of 1280x720
//     --shots [dir]        a screenshot at the end of each day (default <os tmp>/paw_playtest_shots)
//     --out <file>         write the markdown report there (default: stdout)
//     --start <YYYY-MM-DD> day 1 (default today; festivals and markets follow the date)
//     --build              rebuild the game and the harness first
//
// How it plays: one fresh save per profile, adopted through the real title and adoption screens. Each day the clock moves on 24 hours and
// the page reloads (so mail, the garden, needs and the Japan-day resets happen as for a player coming back), then the profile's session runs.
// Real UI for feeding, petting, naps, the route carousel, the map, the shops and the purchase window; the game's own functions (the
// window.__paw hooks) for the mailbox, outfits and Fun Fair rounds. The walk runner itself is not played (see balance_walk.js for that):
// each walk starts for real and ends with the runner's own end call, paying a measured walk's coins (tools/balance_walk.json), with the
// treasure dig and junk rolled by the game. All the game's rules for pay, Bond, levels, missions and limits apply as in the real game.
const fs = require('fs'), path = require('path'), os = require('os');
const L = require('./paw_sim_lib');

const argv = process.argv.slice(2), opt = { profiles: ['light', 'regular', 'keen'], days: 7, phone: false, shots: null, out: null, start: null, build: false };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i], nx = () => argv[++i];
  if (a === '--profile') opt.profiles = nx().split(','); else if (a === '--days') opt.days = Math.max(1, Math.min(30, +nx() || 7)); else if (a === '--phone') opt.phone = true;
  else if (a === '--shots') opt.shots = argv[i + 1] && !argv[i + 1].startsWith('--') ? nx() : path.join(os.tmpdir(), 'paw_playtest_shots');
  else if (a === '--out') opt.out = nx(); else if (a === '--start') opt.start = nx(); else if (a === '--build') opt.build = true;
  else if (a === '-h' || a === '--help') { console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 20).join('\n')); process.exit(0); }
  else { console.error('unknown option ' + a); process.exit(2); }
}

// what each kind of player does in one session. shop: things bought a day at most (cheapest affordable first, keeping `keep` coins)
const PROFILES = {
  light: { label: 'Light (about 15 min)', feed: 1, pet: true, walks: 2, mission: true, swap: false, helps: 1, mail: true, ff: 0, shop: 1, keep: 60, travel: false, outfit: false },
  regular: { label: 'Regular (about 45 min)', feed: 2, pet: true, walks: 5, mission: true, swap: true, helps: 2, mail: true, ff: 2, shop: 2, keep: 80, travel: true, outfit: true, vary: true },
  keen: { label: 'Keen (about 2 hours)', feed: 2, pet: true, walks: 9, mission: true, swap: true, helps: 2, mail: true, ff: 8, shop: 99, keep: 100, travel: true, outfit: true, vary: true }
};
let WALK = { path: 28, junk: 3, found: 0.6, bond: 17 };
try { const w = JSON.parse(fs.readFileSync(path.join(__dirname, 'balance_walk.json'), 'utf8')).walks.filter((x) => !x.failed); if (w.length) { const av = (f) => w.reduce((s, x) => s + f(x), 0) / w.length; WALK = { path: av((x) => x.coins - x.junkCoins - x.pouch), junk: av((x) => x.junkCoins), found: av((x) => (x.treasure ? 1 : 0)), bond: av((x) => x.bond) }; } } catch (e) { /* the fallback */ }

/* ---------------- page helpers ---------------- */
const ev = (p, f, a) => p.evaluate(f, a);
const mode = (p) => ev(p, () => window.__paw && window.__paw.mode);
async function clickJS(p, sel) { return ev(p, (s) => { const e = document.querySelector(s); if (!e) return false; if (typeof e.click === 'function') e.click(); else e.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window })); return true; }, sel); }
// every action runs through safe(): a failing action becomes a note in the report instead of ending the run
async function safe(day, name, f) { try { return await f(); } catch (e) { day.stuck.push(`${name} failed: ${String(e.message || e).split('\n')[0].slice(0, 140)}`); return `${name}: error`; } }
// close whatever is open (modals, level-up cards, the purchase window, walk results) and log what it was. Returns false if something stayed
async function clear(p, day, why) {
  for (let i = 0; i < 12; i++) {
    const s = await ev(p, () => {
      const m = document.getElementById('modal'), pan = m && !m.hidden && m.querySelector('.panel'), veil = document.querySelector('.buyveil');
      if (veil) return { k: 'veil' };
      if (!pan) return null;
      const h = pan.querySelector('h2, h3'); return { k: 'modal', h: h ? h.textContent.trim().replace(/\s+/g, ' ').slice(0, 80) : '', txt: pan.textContent.trim().replace(/\s+/g, ' ').slice(0, 160), cls: pan.className };
    });
    if (!s) return true;
    if (s.k === 'veil') { await clickJS(p, '.buyveil .bb-no') || await clickJS(p, '.buyveil .x'); await p.keyboard.press('Escape'); continue; }
    if (day && i === 0) day.modals.push(s.h || s.txt.slice(0, 60));
    const hit = await ev(p, () => {
      const pan = document.querySelector('#modal .panel'); if (!pan) return 'gone';
      for (const sel of ['#luOk', '#resOk', '#iNext', '[data-mcollect]', '.x']) { const b = pan.querySelector(sel) || document.querySelector(sel); if (b && b.offsetParent !== null) { b.click(); return sel; } }
      const bs = [...pan.querySelectorAll('button')].filter((b) => b.offsetParent !== null && !b.disabled); const b = bs.find((x) => /later|close|ok|thanks|done|lovely|yay|back/i.test(x.textContent)) || bs[bs.length - 1];
      if (b) { b.click(); return 'btn:' + b.textContent.trim().slice(0, 20); } return null;
    });
    if (!hit) await p.keyboard.press('Escape');
    await L.sleep(250);
  }
  const still = await ev(p, () => { const m = document.getElementById('modal'); const pan = m && !m.hidden && m.querySelector('.panel'); return pan ? (pan.querySelector('h2, h3') || pan).textContent.trim().slice(0, 80) : null; });
  if (still && day) day.stuck.push(`a window would not close (${why}): "${still}"`);
  return !still;
}
async function home(p, place) { await ev(p, (pl) => { const S = window.__paw.S; S.sleeping = false; if (pl) S.place = pl; window.__paw.go(pl === 'market' ? 'market' : 'yard'); }, place || null); await L.until(p, () => ['yard', 'market'].includes(window.__paw.mode), null, 8000); }
async function snap(p) {
  return ev(p, () => {
    const P = window.__paw, S = P.S, lv = S.lv || {};
    return { coins: S.coins, bond: S.bond.level, bondPts: S.bond.pts, lv: lv.lv || 1, xp: lv.xp || 0, energy: Math.round(S.stats.energy), hunger: Math.round(S.stats.hunger), clean: Math.round(S.stats.clean),
      mail: (S.mail || []).length, unread: (S.mail || []).filter((m) => m && !m.read).length, walksToday: (S.daily && S.daily.walks) || 0, months: P.pup ? P.pup.months(S.dog) : null,
      ms: (S.missions && S.missions.list || []).map((x) => ({ id: x.id, done: !!x.done, t: P.ms.text(x) })), stamps: S.missions && S.missions.stamps,
      helps: (S.missions && S.missions.help && S.missions.help.list || []).map((x) => ({ id: x.id, done: !!x.done, t: P.ms2.text(x) })),
      inv: { food: Object.assign({}, S.inv.food), toys: S.inv.toys.length, clothes: S.inv.clothes.length, houses: S.inv.houses.length, beds: (S.beds || []).length, decor: Object.keys(S.decor || {}).length },
      place: S.place, mode: P.mode };
  });
}

/* ---------------- actions (each returns a short note, never throws) ---------------- */
async function feed(p, day) {
  const has = await ev(p, () => Object.keys(window.__paw.S.inv.food).filter((n) => window.__paw.S.inv.food[n] > 0 && n !== 'Fresh Water'));
  if (!has.length) { await buyFood(p, day); }
  await clickJS(p, '[data-act=feed]'); if (!(await L.until(p, () => !!document.querySelector('[data-food]'), null, 3000))) return 'feed: no food tray';
  const h0 = await ev(p, () => window.__paw.S.stats.hunger);
  const pick = await ev(p, () => { const b = [...document.querySelectorAll('[data-food]')].map((x) => x.dataset.food).filter((n) => n !== 'Fresh Water'); return b.find((n) => /Kibble/.test(n)) || b[0] || null; });
  if (!pick) { await p.keyboard.press('Escape'); return 'feed: nothing to feed'; }
  await clickJS(p, `[data-food="${pick}"]`); const ok = await L.until(p, (h) => window.__paw.S.stats.hunger > h, h0, 6000);
  await clickJS(p, '[data-act=feed]'); if (await L.until(p, () => !!document.querySelector('[data-food="Fresh Water"]'), null, 1500)) await clickJS(p, '[data-food="Fresh Water"]'); else await p.keyboard.press('Escape');
  return ok ? 'fed ' + pick : 'feed ignored';
}
async function pet(p) {
  const b0 = await ev(p, () => window.__paw.S.bond.pts);
  for (let r = 0; r < 8; r++) {
    const box = await p.locator('#dogHit').boundingBox().catch(() => null); if (!box) return 'pet: dog not found';
    for (let i = 0; i < 30; i++) await p.mouse.move(box.x + box.width * (0.3 + 0.4 * (i % 2)), box.y + box.height * 0.4);
    if (await L.until(p, (b) => window.__paw.S.bond.pts > b, b0, 600)) return 'petted';
  }
  return 'pet: no Bond';
}
async function nap(p, day) {
  await clickJS(p, '[data-act=care]'); if (!(await L.until(p, () => !!document.querySelector('[data-care=sleep]'), null, 3000))) { await ev(p, () => window.__paw.shop.sleep()); } else await clickJS(p, '[data-care=sleep]');
  const ok = await L.until(p, () => window.__paw.S.stats.energy >= 85, null, 45000); await ev(p, () => window.__paw.shop.wake()); await clear(p, day, 'nap'); await home(p);
  return ok ? 'napped' : 'nap: energy did not fill in 45 s';
}
async function walk(p, day, P) {
  const s = await snap(p); if (s.energy < 30) day.acts.push(await nap(p, day));
  await home(p, 'yard'); await clear(p, day, 'before walk');
  await ev(p, () => { const W = window.PawWalk; if (W && !W.__ptSpy) { const s = W.start.bind(W); W.start = (h, op) => { window.__ptOpts = op; return s(h, op); }; W.__ptSpy = true; } window.__ptOpts = null; });
  await clickJS(p, '[data-act=walk]'); if (!(await L.until(p, () => !!document.getElementById('rtStart'), null, 5000))) { await clear(p, day, 'walk'); return 'walk: no route screen'; }
  if (P.vary) { // regular and keen players try the routes they have open, in turn (the carousel opens on the current place's route)
    const n = await ev(p, () => document.querySelectorAll('.rt-card').length); const want = (day.walkN = (day.walkN || 0) + 1) + day.d;
    for (let k = 0; k < n; k++) { const i = (want + k) % n; await clickJS(p, `.rt-card[data-i="${i}"]`); await L.sleep(120); if (await ev(p, () => { const b = document.getElementById('rtStart'); return !b.disabled && b.getAttribute('aria-disabled') !== 'true' && !/Locked/i.test(b.textContent); })) break; }
  }
  const btn = await ev(p, () => { const b = document.getElementById('rtStart'); return { dis: b.disabled || b.getAttribute('aria-disabled') === 'true', txt: b.textContent.trim(), why: (document.querySelector('.rt-block, .rt-why, .rt-lock') || {}).textContent || '' }; });
  if (btn.dis || /Locked/i.test(btn.txt)) { await clickJS(p, '#rtBack'); return `walk: blocked ("${btn.txt}" ${btn.why.trim().slice(0, 80)})`; }
  const toasts0 = await ev(p, () => (document.querySelector('#toasts') || {}).textContent || ''); // v2.29.1: toasts already on screen before Start do not count
  const newToast = (all) => (all.startsWith(toasts0) ? all.slice(toasts0.length) : all).trim();
  await clickJS(p, '#rtStart');
  // v2.29.1: read the toast right after Start (a block such as "Not for {name} yet" is gone after 3 s), then wait on for a slow start
  const quick = await L.until(p, () => window.__paw.mode === 'walk' && !!window.__ptOpts, null, 2500);
  if (!quick) { const t = newToast(await ev(p, () => (document.querySelector('#toasts') || {}).textContent || '')); if (t && !(await ev(p, () => window.__paw.mode === 'walk'))) { await clear(p, day, 'walk start'); await home(p); return 'walk: blocked (' + t.slice(-80) + ')'; } }
  if (!quick && !(await L.until(p, () => window.__paw.mode === 'walk' && !!window.__ptOpts, null, 12500))) { const t = await ev(p, () => (document.querySelector('#toasts') || {}).textContent || ''); await clear(p, day, 'walk start'); await home(p); return 'walk: did not start ' + t.slice(-80); }
  const go = p.locator('.pw-ov [data-go]'); if (await go.count()) await go.first().click().catch(() => {});
  await L.sleep(400);
  const c0 = await ev(p, () => window.__paw.S.coins);
  await ev(p, (w) => {
    const o = window.__ptOpts, found = Math.random() < w.found; let tr = null, pouch = 0;
    if (found) { tr = o.rollTreasure(o.area); if (tr && !tr.name) pouch = +tr.coins || 0; }
    const junk = found ? [] : [o.junk()]; const jc = junk.reduce((s, j) => s + (+(j && j.coins) || 0), 0);
    o.onEnd({ coins: Math.round(w.path) + jc + pouch, happiness: 15, bond: Math.round(w.bond), energy: 20, cleanliness: 6, early: false, distance: 900, treasure: tr, junk, obstaclesHit: 1, cleanRun: false });
  }, WALK);
  const res = await L.until(p, () => !!document.getElementById('resOk'), null, 8000);
  const c1 = await ev(p, () => window.__paw.S.coins); const area = await ev(p, () => window.__ptOpts && window.__ptOpts.area);
  await clear(p, day, 'walk results'); await home(p);
  return res ? `walk ${area} +${c1 - c0}` : 'walk: no results screen';
}
async function travel(p, day, k) {
  await home(p); await clickJS(p, '[data-act=map]'); if (!(await L.until(p, (k) => !!document.querySelector(`[data-area=${k}]`), k, 5000))) { await clear(p, day, 'map'); await home(p); return `travel ${k}: not on the map`; }
  await ev(p, (k) => window.__paw.mapTo(k), k);
  for (let i = 0; i < 8; i++) { await clickJS(p, `[data-area=${k}]`); if (await L.until(p, (k) => window.__paw.S.place === k || !!document.querySelector('.onway'), k, 1500)) break; }
  const ok = await L.until(p, (k) => window.__paw.S.place === k && !document.querySelector('.onway') && window.__paw.mode !== 'map', k, 15000);
  const t = ok ? '' : await ev(p, () => (document.querySelector('#toasts') || {}).textContent || '');
  await clear(p, day, 'travel'); if (!ok) await home(p);
  return ok ? `went to ${k}` : `travel ${k}: did not arrive ${t.slice(-80)}`;
}
async function mailbox(p, day) {
  const before = await ev(p, () => window.__paw.S.coins), n = await ev(p, () => (window.__paw.S.mail || []).filter((m) => m && !m.read).length);
  if (!n) return 'mailbox: empty';
  await ev(p, () => window.__paw.openMailbox()); await L.sleep(300);
  const titles = await ev(p, () => [...document.querySelectorAll('[data-mail].unread')].slice(0, 8).map((b) => 'letter: ' + ((b.querySelector('.mb-t b') || b).textContent.trim().replace(/\s+/g, ' ').slice(0, 50))));
  for (let i = 0; i < 10; i++) { const b = await ev(p, () => { const x = document.querySelector('#modal [data-mail].unread'); if (x) { x.click(); return true; } return false; }); if (!b) break; await L.sleep(200); await ev(p, () => { const c = document.querySelector('#modal [data-mbget]'); if (c) c.click(); }); await L.sleep(150); }
  await ev(p, () => { const P = window.__paw; if (P.mbOwed && P.mbOwed().length) P.mbCollect(P.mbOwed()); }); await clear(p, day, 'mailbox');
  const after = await ev(p, () => window.__paw.S.coins); day.letters.push(...titles);
  return `mailbox: ${n} letters, +${after - before} coins`;
}
// read every shop list (real shop screens), buy cheapest affordable things the profile wants, note what was affordable and left
async function shop(p, day, P) {
  const tabs = [['kibble', 'tab', 'toys'], ['boutique', null, null], ['builder', 'btab', 'houses'], ['builder', 'btab', 'beds'], ['builder', 'btab', 'decor'], ['builder', 'btab', 'furniture']];
  const rows = [];
  for (const [k, attr, t] of tabs) {
    await ev(p, (k) => window.__paw.shop.shop(k), k); if (attr) { await clickJS(p, `[data-${attr}="${t}"]`); await L.sleep(150); }
    const r = await ev(p, ([k, t]) => [...document.querySelectorAll('#modal .sitem')].map((e) => ({ k, t: t || 'clothes', n: (e.querySelector('b') || {}).textContent, buy: (e.querySelector('[data-buy]') || {}).dataset ? (e.querySelector('[data-buy]') || { dataset: {} }).dataset.buy : null, price: +(((e.querySelector('.price') || {}).textContent || '').replace(/[^0-9]/g, '')) || 0, lock: (e.querySelector('.chip.lock') || {}).textContent || '' })), [k, t]);
    rows.push(...r); await clear(p, null, 'shop');
  }
  const coins = (await snap(p)).coins, buyable = rows.filter((r) => r.buy && r.price > 0), locked = rows.filter((r) => r.lock);
  const want = buyable.filter((r) => r.price <= coins - P.keep).sort((a, b) => a.price - b.price);
  let n = 0, spent = 0, have = coins;
  for (const r of want) {
    if (n >= P.shop || r.price > have - P.keep) break;
    await ev(p, (k) => window.__paw.shop.shop(k), r.k); if (r.k !== 'boutique') { await clickJS(p, `[data-${r.k === 'kibble' ? 'tab' : 'btab'}="${r.t}"]`); await L.sleep(150); }
    if (!(await clickJS(p, `[data-buy="${r.buy}"]`))) { await clear(p, null, 'shop'); continue; }
    if (!(await L.until(p, () => !!document.querySelector('.buyveil .bb-yes'), null, 3000))) { await clear(p, day, 'buy'); continue; }
    await clickJS(p, '.buyveil .bb-yes'); await L.until(p, () => !document.querySelector('.buyveil'), null, 3000); await L.sleep(300);
    await ev(p, () => { const b = [...document.querySelectorAll('#modal .panel button')].find((x) => /later|not now/i.test(x.textContent)); if (b) b.click(); });
    const c = (await snap(p)).coins; if (c < have) { spent += have - c; have = c; n++; day.bought.push(`${r.n} (${r.price})`); }
    await clear(p, null, 'shop');
  }
  day.affordable = buyable.filter((r) => r.price <= have).map((r) => r.n); day.lockedCount = locked.length; day.buyableCount = buyable.length;
  day.cheapestLeft = buyable.filter((r) => !day.bought.some((b) => b.startsWith(r.n + ' '))).map((r) => r.price).sort((a, b) => a - b)[0] || null;
  await home(p);
  return `shop: ${buyable.length} for sale, ${locked.length} locked, bought ${n} (${spent})`;
}
async function buyFood(p, day) {
  await ev(p, () => window.__paw.shop.shop('kibble')); await clickJS(p, '[data-tab="food"]'); await L.sleep(150);
  if (!(await clickJS(p, '[data-buy="Basic Kibble"]'))) { await clear(p, day, 'food'); return; }
  if (await L.until(p, () => !!document.querySelector('.buyveil .bb-yes'), null, 3000)) { await clickJS(p, '[data-qq="5"]'); await L.sleep(100); await clickJS(p, '.buyveil .bb-yes'); }
  await L.sleep(300); await clear(p, null, 'food');
}
async function funfair(p, day, n) {
  const out = [];
  const games = await ev(p, () => { const F = window.__paw.ff; return F.keys.filter((k) => F.left(k) > 0).map((k) => ({ k, place: F.games[k].place, left: F.left(k) })); });
  for (const g of games.slice(0, n)) {
    await home(p, g.place === 'yard' ? 'yard' : g.place);
    const can = await ev(p, (k) => { const F = window.__paw.ff; return F.can(k); }, g.k);
    const started = await ev(p, (k) => window.__paw.ff.start(k), g.k);
    if (!started) { out.push(`${g.k}: closed${can ? '' : ''}`); await home(p); continue; }
    await L.sleep(800); const c0 = await ev(p, () => window.__paw.S.coins);
    await ev(p, () => { const G = window.__paw.ff.g; if (G) { G.score = Math.max(G.score || 0, 12); G.hits = Math.max(G.hits || 0, 12); G.n = Math.max(G.n || 0, 12); } window.__paw.ff.end(); });
    await L.sleep(500); const c1 = await ev(p, () => window.__paw.S.coins); out.push(`${g.k} +${c1 - c0}`);
    await ev(p, () => window.__paw.ff.back()); await clear(p, day, 'fun fair'); await home(p);
  }
  return out.length ? 'fun fair: ' + out.join(', ') : 'fun fair: nothing open';
}
async function outfit(p) {
  const r = await ev(p, () => { const S = window.__paw.S; const c = S.inv.clothes[0]; if (!c) return null; window.__paw.shop.equip(c); return c; });
  return r ? 'wore ' + r : 'outfit: no clothes';
}
async function toy(p, day) {
  await home(p, 'yard'); await clickJS(p, '[data-act=play]'); if (!(await L.until(p, () => !!document.querySelector('[data-play]'), null, 3000))) return 'toy: no play tray';
  const k = await ev(p, () => { const b = document.querySelector('[data-play="duck"], [data-play="tug"]'); if (b) { b.click(); return b.dataset.play; } return null; });
  if (!k) { await p.keyboard.press('Escape'); await clear(p, day, 'toy'); return 'toy: no quick toy (Squeaky Duck or Rope Tug) owned'; }
  await L.sleep(2500); await clear(p, day, 'toy'); return 'played ' + k;
}
// today's wish for the leading dog (Dog Days): do it when the script can
async function wish(p, day, P) {
  const w = await ev(p, () => { const x = window.__paw.dd && window.__paw.dd.wish(); return x ? { k: x.k, a: x.a || null, done: !!x.done } : null; });
  if (!w) return false; if (w.done) return true;
  const map = { walk: 'walk', snack: 'feed', pet: 'pet', nap: 'nap', toy: 'toy', place: w.a ? 'travel:' + w.a : null };
  if (!map[w.k]) { day.notes.push(`wish "${w.k}" not done (the script cannot play it)`); return false; }
  await doTask(p, day, P, '_' + w.k, map[w.k]); return true;
}
// the daily mission and the little helps: do the ones this script can do, swap one it cannot (free swap), note the rest
const CAN = { walk: 'walk', feed2: 'feed', pet: 'pet', nap: 'nap', wear: 'wear', mail: 'mail', buy: 'buy', buy_food_new: 'buy', toy: 'toy', travel: 'travel:dogpark', travel_fuji: 'travel:fujihill', travel_training: 'travel:training', h_pet: 'pet', h_water: 'feed', h_nap: 'nap', h_wear: 'wear', h_mail: 'mail', h_treat: 'feed', h_toy: 'toy', wish: 'wish' };
async function doTask(p, day, P, id, how) {
  const a = how || CAN[id]; if (!a) return false;
  if (a === 'wish') return wish(p, day, P);
  if (a === 'toy') { day.acts.push(await toy(p, day)); return true; }
  if (a === 'walk') day.acts.push(await walk(p, day, P)); else if (a === 'feed') day.acts.push(await feed(p, day)); else if (a === 'pet') day.acts.push(await pet(p));
  else if (a === 'nap') day.acts.push(await nap(p, day)); else if (a === 'wear') day.acts.push(await outfit(p)); else if (a === 'mail') day.acts.push(await mailbox(p, day));
  else if (a === 'buy') { await buyFood(p, day); day.acts.push('bought kibble'); } else if (a.startsWith('travel:')) { day.acts.push(await travel(p, day, a.slice(7))); await home(p); }
  return true;
}

/* ---------------- one profile ---------------- */
async function playProfile(b, key, file, start) {
  const P = PROFILES[key], res = { key, label: P.label, days: [], errors: [] };
  const page = await L.newPage(b, Object.assign({ start }, opt.phone ? { viewport: { width: 360, height: 640 } } : {}));
  const p = page; let seenErr = 0;
  await L.adoptNew(p, file); await clear(p, null, 'start');
  let prev = null;
  try { for (let d = 1; d <= opt.days; d++) {
    const day = { d, acts: [], modals: [], letters: [], bought: [], stuck: [], notes: [], errors: [] };
    if (d > 1) {
      await ev(p, () => window.__paw.saveNow()); const json = await ev(p, () => localStorage.getItem('pawhaven_proto_v1'));
      await ev(p, () => window.__ptShift(864e5)); await p.reload();
      // a slow load under a busy machine: one more try before giving up on the day
      if (!(await p.waitForSelector('#tNew, #tContinue', { timeout: 60000 }).catch(() => null))) { day.stuck.push('the title screen took over 60 s to load (reloaded once)'); await p.goto('file://' + file); await p.waitForSelector('#tNew, #tContinue', { timeout: 90000 }); }
      if (!(await p.locator('#tContinue').count())) { await ev(p, (j) => localStorage.setItem('pawhaven_proto_v1', j), json); await p.reload(); await p.waitForSelector('#tContinue', { timeout: 60000 }); }
      await clickJS(p, '#tContinue'); await L.until(p, () => window.__paw && ['yard', 'market'].includes(window.__paw.mode), null, 20000); await L.sleep(1200);
    }
    const s0 = await snap(p); day.start = s0;
    await clear(p, day, 'arrival');
    const A = async (name, f) => { const r = await safe(day, name, f); if (typeof r === 'string') day.acts.push(r); await safe(day, 'tidy', () => clear(p, day, name)); return r; };
    if (P.mail) await A('mailbox', () => mailbox(p, day));
    for (let i = 0; i < P.feed; i++) await A('feed', () => feed(p, day));
    if (P.pet) await A('pet', () => pet(p));
    if (P.outfit) await A('outfit', () => outfit(p));
    for (let i = 0; i < P.walks; i++) await A('walk', () => walk(p, day, P));
    // the daily mission
    let s = await snap(p);
    for (const m of s.ms.filter((x) => !x.done)) {
      if (!P.mission) break;
      if (!(await safe(day, 'mission', () => doTask(p, day, P, m.id)))) {
        if (P.swap && (await ev(p, () => window.__paw.ms.swapFree()))) { await ev(p, () => window.__paw.ms.swap()); const n = (await snap(p)).ms[0]; day.notes.push(`mission "${m.t}" swapped for "${n && n.t}"`); if (n && !n.done && !(await safe(day, 'mission', () => doTask(p, day, P, n.id)))) day.notes.push(`mission "${n.t}" not done (the script cannot play it)`); }
        else day.notes.push(`mission "${m.t}" not done (the script cannot play it${P.swap ? ', swap used' : ''})`);
      }
    }
    s = await snap(p);
    for (const h of s.helps.filter((x) => !x.done).slice(0, P.helps)) if (!(await safe(day, 'help', () => doTask(p, day, P, h.id)))) day.notes.push(`little help "${h.t}" not done (the script cannot play it)`);
    if (P.helps >= 1) await safe(day, 'wish', () => wish(p, day, P));
    if (P.ff) await A('fun fair', () => funfair(p, day, P.ff));
    if (P.travel && d % 2 === 0) await A('travel', () => travel(p, day, ['dogpark', 'square', 'cafe', 'pool', 'fujihill', 'training'][d % 6]));
    await safe(day, 'home', () => home(p, 'yard'));
    await A('shop', () => shop(p, day, P));
    await safe(day, 'tidy', () => clear(p, day, 'end of session'));
    day.affordable = day.affordable || [];
    const s1 = await snap(p); day.end = s1;
    s = s1; day.msDone = s.ms.filter((x) => x.done).length + '/' + s.ms.length; day.helpsDone = s.helps.filter((x) => x.done).length + '/' + s.helps.length;
    day.errors = p.errors.slice(seenErr); seenErr = p.errors.length;
    if (opt.shots) { fs.mkdirSync(opt.shots, { recursive: true }); await p.screenshot({ path: path.join(opt.shots, `${key}_day${d}.png`) }).catch(() => {}); }
    // boredom and stuck signals
    const newThings = [s1.lv > s0.lv ? `level ${s1.lv}` : '', s1.bond > s0.bond ? `Bond ${s1.bond}` : '', ...day.bought.map((x) => 'bought ' + x)].filter(Boolean);
    day.newThings = newThings;
    const sig = JSON.stringify([day.acts.map((a) => a.replace(/[+\-]?\d+/g, '#')), day.modals.length, newThings.length]);
    if (!newThings.length && !day.letters.length) day.notes.push('nothing new today (no level, no Bond level, nothing bought, no letters)');
    if (!day.bought.length && s1.coins > 300 && !day.affordable.length) day.notes.push(`${s1.coins} coins and nothing to buy (${day.lockedCount} things locked)`);
    if (prev && prev === sig && !newThings.length) day.notes.push('the same session as yesterday');
    prev = sig;
    res.days.push(day);
    process.stderr.write(`${key} day ${d}: coins ${s0.coins}->${s1.coins} lv ${s1.lv} bond ${s1.bond} ${day.acts.length} acts, ${day.modals.length} windows, ${day.errors.length} errors\n`);
  } } catch (e) { res.crash = `stopped after day ${res.days.length}: ${String(e.message || e).split('\n')[0].slice(0, 160)}`; process.stderr.write(`${key} ${res.crash}\n`); }
  await p.context().close().catch(() => {});
  return res;
}

/* ---------------- report ---------------- */
function report(R, start) {
  const o = [`# Playtest (${new Date().toISOString().slice(0, 10)}): ${opt.days} days from ${new Date(start).toISOString().slice(0, 10)}, ${opt.phone ? 'phone 360x640' : 'desktop 1280x720'}`, '',
    `Walks end with a measured walk's pay (${WALK.path.toFixed(0)} path + ${WALK.junk.toFixed(0)} junk raw coins, a treasure dig ${Math.round(WALK.found * 100)}% of the time, rolled by the game). Bath, tricks, toys, garden, kitchen, photos and agility are not played by the script: missions and helps that need them are listed, not counted as player problems.`, ''];
  for (const r of R) {
    o.push(`## ${r.label}`, '', '| Day | Coins start → end | Bought | Level (XP) | Bond | Mission / helps | Windows and letters | New |', '|---|---|---|---|---|---|---|---|');
    r.days.forEach((d) => o.push(`| ${d.d} | ${d.start.coins} → ${d.end.coins} | ${d.bought.length ? d.bought.join(', ') : '-'} | ${d.end.lv} (${d.end.xp}) | ${d.end.bond} | ${d.msDone} / ${d.helpsDone} | ${[...new Set(d.modals.concat(d.letters))].slice(0, 6).join('; ') || '-'} | ${d.newThings.join(', ') || '-'} |`));
    o.push('', '**Bored / stuck:**', '');
    const notes = []; r.days.forEach((d) => { d.notes.forEach((n) => notes.push(`day ${d.d}: ${n}`)); d.stuck.forEach((n) => notes.push(`day ${d.d}: STUCK ${n}`)); d.acts.filter((a) => /blocked|did not|not on|no route|no results|no food|: nothing to/.test(a)).forEach((a) => notes.push(`day ${d.d}: ${a}`)); });
    if (r.crash) notes.unshift('RUN ' + r.crash);
    o.push(notes.length ? [...new Set(notes)].map((n) => '- ' + n).join('\n') : '- none');
    const errs = [...new Set(r.days.flatMap((d) => d.errors))];
    o.push('', '**Console errors:** ' + (errs.length ? '\n' + errs.slice(0, 10).map((e) => '- `' + e.slice(0, 200) + '`').join('\n') : 'none'), '');
  }
  return o.join('\n');
}

(async () => {
  L.ensureHarness(opt.build);
  const file = L.scratchCopy({}); const d0 = opt.start ? new Date(opt.start + 'T00:00:00Z') : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const start = d0.getTime() + 3600e3; // 01:00 UTC = 10:00 in Japan: the Japan day and the UTC day are the same date
  const b = await L.launch(); const R = [];
  // the profiles play side by side (one page each); each finished profile rewrites --out, so a stopped run still leaves a report
  opt.profiles.forEach((k) => { if (!PROFILES[k]) throw new Error('no profile ' + k); });
  try {
    await Promise.all(opt.profiles.map((k) => playProfile(b, k, file, start).then((r) => { R.push(r); if (opt.out) fs.writeFileSync(opt.out, report(opt.profiles.map((x) => R.find((y) => y.key === x)).filter(Boolean), start) + '\n'); })
      .catch((e) => { console.error(`${k} stopped: ${String(e.message || e).split('\n')[0]}`); })));
  } finally { await b.close(); }
  R.sort((a, b) => opt.profiles.indexOf(a.key) - opt.profiles.indexOf(b.key));
  const md = report(R, start);
  if (opt.out) { fs.writeFileSync(opt.out, md + '\n'); console.error('wrote ' + opt.out); } else console.log(md);
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
