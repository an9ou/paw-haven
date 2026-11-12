/* ======================= v2.26 "Yard visitors" (V226.md, tag yv, test hook window.__paw.yv) =======================
   Neighbourhood dogs visit YOUR yard while you are away and play with the toys you put out. One is in the yard when you come back (the town
   visitor's spot and drawing, #visitorG.yv); tap: its card (Pet, the Visitors Book, Wave bye). The Visitors Book: a page per visitor, pencil
   silhouettes for those not met yet. Thank-you gifts: one a day at most, coins rare and small. Never a dog to keep or buy.
   Save: S.visitors (v226Fields, called from freshState and migrate). Toys: four HM_DECOR yard decorations (v27, so Barkitecture sells them).
   Art: PawArt.YARD_VISITORS (world_b, the props yvtugpost / yvpool / yvtunnel / yvbubbles and the book). */
function yvOn() { return (!navigator.webdriver && nwDue(NEWS_V226)) || !!prefs.yvTest; }
const YV_AWAY = 20 * 60e3, YV_BACK = 48 * 3600e3, YV_SLOTS = [10, 15, 20], YV_Q = 3, YV_LOG = 20, YV_GIFT = 0.4, YV_COIN = 10, YV_COIN_GAP = 7 * 86400e3;
// the four yard toys (V226.md 5): HM_DECOR entries like every v2.7 yard decoration, sold at Barkitecture "For the yard"
Object.assign(HM_DECOR, {
  'Tug Post': { prop: 'yvtugpost', at: [180, 410, 72, 96], vb: [120, 160], price: 300, room: 'yard', zone: 'floor', kind: 'decor', v27: true, v226: true, story: 'A sturdy wooden post with a rope to pull. It never lets go first, and nobody minds.' },
  'Puddle Pool': { prop: 'yvpool', at: [620, 506, 140, 84], vb: [200, 120], price: 600, room: 'yard', zone: 'floor', kind: 'decor', v27: true, v226: true, story: 'A round blue pool, ankle deep, with a rubber duck. Splashing is the whole point.' },
  'Play Tunnel': { prop: 'yvtunnel', at: [700, 430, 154, 84], vb: [220, 120], price: 900, room: 'yard', zone: 'floor', kind: 'decor', v27: true, v226: true, story: 'A crinkly striped tunnel. Dogs go in one end very fast and come out the other end very proud.' },
  'Bubble Fountain': { prop: 'yvbubbles', at: [470, 410, 72, 96], vb: [120, 160], price: 1500, room: 'yard', zone: 'floor', kind: 'decor', v27: true, v226: true, story: 'A little box that blows bubbles all afternoon. Dog-safe bubbles, so catching them is allowed.' }
});
const YV_TOYS = ['Tug Post', 'Puddle Pool', 'Play Tunnel', 'Bubble Fountain'];
const YV_OLD = ['Sandbox', 'Bird Bath', 'Stepping Stones', 'Hammock', 'Garden Bench', 'Doggy Ramp']; // older yard items that pull a little
// the visitors (V226.md 3): [id, name, breed, coat option, age in months, family, favourite toy, rare condition]
const YV_DOGS = [
  ['biscuit', 'Biscuit', 'beagle', 0, 26, 'the Okafors on Elm Row', 'Tug Post'],
  ['dumpling', 'Dumpling', 'pug', 0, 40, 'Mrs Plum', 'Puddle Pool'],
  ['noodle', 'Noodle', 'dachs', 0, 22, 'the Novaks', 'Play Tunnel'],
  ['coco', 'Coco', 'poodle', 0, 33, 'Mr Ferreira', 'Bubble Fountain'],
  ['pepper', 'Pepper', 'chihuahua', 0, 18, 'the Tanakas', 'Sandbox'],
  ['gus', 'Gus', 'frenchie', 0, 30, 'Ana from the café', 'Puddle Pool'],
  ['muffin', 'Muffin', 'westie', 0, 44, 'the Lindqvists', 'Play Tunnel'],
  ['sunny', 'Sunny', 'golden', 0, 20, 'the Patels', 'Puddle Pool'],
  ['patches', 'Patches', 'mutt', 0, 52, 'the Nguyen kids', 'Tug Post'],
  ['pompom', 'Pom-Pom', 'pom', 0, 28, 'Grandpa Joe', 'Bubble Fountain'],
  ['tilly', 'Tilly', 'yorkie', 0, 36, 'the Moreaus', 'Sandbox'],
  ['cloud', 'Cloud', 'bichon', 0, 24, 'Mrs Achebe', 'Bubble Fountain'],
  ['yuki', 'Yuki', 'samoyed', 0, 30, 'the Satos', 'Puddle Pool', { weather: 'snow' }],
  ['momiji', 'Momiji', 'shiba', 0, 26, 'Mr Kimura', 'Play Tunnel', { season: 'autumn' }],
  ['dash', 'Dash', 'collie', 0, 34, 'the Training Ground coach', 'Play Tunnel', { agility: 1 }],
  ['puddles', 'Puddles', 'lab', 0, 22, 'the O\'Briens', 'Puddle Pool', { weather: 'rain', toy: 'Puddle Pool' }],
  ['nanuk', 'Nanuk', 'husky', 0, 38, 'the Larsens', 'Tug Post', { season: 'winter', toy: 'Tug Post' }],
  ['waddles', 'Sir Waddles', 'corgi', 0, 48, 'Lady Pemberton', 'Bubble Fountain', { toy: 'Bubble Fountain' }],
  ['zoom', 'Zoom', 'greyhound', 0, 42, 'Ms Reyes', 'Play Tunnel', { evening: 1, toy: 'Play Tunnel' }],
  ['rapunzel', 'Rapunzel', 'afghan', 0, 60, 'Madame Dubois', 'Bubble Fountain', { pool: 1 }]
].map(([id, name, key, coat, age, fam, fav, rare]) => ({ id, name, key, coat, age, fam, fav, rare: rare || null }));
const yvDog = (id) => YV_DOGS.find((v) => v.id === id) || null;
function yvFam(v) { return tt('yv.fam_' + v.id, v.fam); }
function yvHint(v) {
  const r = v.rare; if (!r) return tt('yv.hint_common', 'A neighbour\'s dog. Put a toy out!');
  if (r.weather === 'snow') return tt('yv.hint_snow', 'Comes on snowy days.');
  if (r.season === 'autumn') return tt('yv.hint_autumn', 'Comes when the leaves turn.');
  if (r.agility) return tt('yv.hint_agility', 'Comes after an agility run at the Training Ground.');
  if (r.weather === 'rain') return tt('yv.hint_rain', 'Comes on rainy days, if there is a Puddle Pool.');
  if (r.season === 'winter') return tt('yv.hint_winter', 'Comes in winter, for a good pull on a Tug Post.');
  if (r.evening) return tt('yv.hint_evening', 'Comes in the evening, if there is a Play Tunnel.');
  if (r.pool) return tt('yv.hint_pool', 'Comes after a paddle at the Splash Pool.');
  return tt('yv.hint_bubbles', 'Comes for the bubbles.');
}

/* ---------------- save ---------------- */
function v226Fields(s) {
  if (!s) return s; const now = Date.now(), o = (x) => x && typeof x === 'object' && !Array.isArray(x);
  if (!o(s.visitors)) s.visitors = {}; const V = s.visitors;
  if (typeof V.seed !== 'string' || !V.seed) V.seed = Math.random().toString(36).slice(2, 10);
  if (typeof V.since !== 'number' || !(V.since > 0)) V.since = now;
  if (typeof V.seen !== 'number' || !(V.seen > 0)) V.seen = now;
  if (!o(V.met)) V.met = {};
  ['q', 'log'].forEach((k) => { if (!Array.isArray(V[k])) V[k] = []; });
  if (typeof V.gday !== 'string') V.gday = ''; if (typeof V.cday !== 'number') V.cday = 0; if (typeof V.flowers !== 'number' || !(V.flowers >= 0)) V.flowers = 0;
  return s;
}
const yvS = () => v226Fields(S).visitors;

/* ---------------- when and who (V226.md 2) ---------------- */
const yvJst = (ms) => new Date(ms + 9 * 3600e3).toISOString().slice(0, 10);
const yvDay0 = (day) => Date.parse(day + 'T00:00:00+09:00');
function yvOut(n) { return !!(S && S.decor && S.decor[n] && S.decor[n].out); }
function yvPull() { return YV_TOYS.filter(yvOut).length * 2 + YV_OLD.filter(yvOut).length; }
function yvOpen() { const p = yvPull(); return p >= 3 ? 3 : p >= 1 ? 2 : 1; }
function yvSlotT(day, k) { return yvDay0(day) + (YV_SLOTS[k] * 60 + hashId(yvS().seed + '|' + day + '|' + k) % 91) * 60e3; }
function yvWeatherAt(t) {
  if (ENV.weather !== 'auto') return ENV.weather;
  const d = new Date(t), per = Math.floor(d.getHours() / 8), r = seeded((d.getFullYear() * 400 + (d.getMonth() + 1) * 32 + d.getDate()) * 7 + per * 131 + 17)(); // weatherNow() for that date
  return r < 0.45 ? 'sunny' : r < 0.70 ? 'cloudy' : r < 0.95 ? 'rain' : [11, 0, 1].includes(d.getMonth()) ? 'snow' : 'rain';
}
const yvSeasonAt = (t) => (SEASONS.includes(ENV.season) ? ENV.season : seasonOf(new Date(t).getMonth() + 1));
const yvEveningAt = (t) => (ENV.time !== 'auto' ? ENV.time === 'dusk' || ENV.time === 'night' : new Date(t).getHours() >= 17);
const yvAgility = () => !!(S && S.ag && S.ag.best && Object.values(S.ag.best).some((x) => +x > 0));
const yvPaddled = () => !!(S && S.pool && S.pool.day && Object.keys(S.pool.day).length);
function yvCan(v, t) {
  const r = v.rare; if (!r) return true;
  if (r.weather && yvWeatherAt(t) !== r.weather) return false;
  if (r.season && yvSeasonAt(t) !== r.season) return false;
  if (r.evening && !yvEveningAt(t)) return false;
  if (r.toy && !yvOut(r.toy)) return false;
  if (r.agility && !yvAgility()) return false;
  if (r.pool && !yvPaddled()) return false;
  return true;
}
// the visitor of slot k of a JST day, never one in `excl` (already came that day)
function yvPick(day, k, excl) {
  const t = yvSlotT(day, k), V = yvS(), rnd = seeded(hashId(V.seed + '|' + day + '|' + k + '|who'));
  const c = YV_DOGS.filter((v) => !excl.includes(v.id) && yvCan(v, t)); if (!c.length) return null;
  const w = c.map((v) => (v.rare ? 3 : 1) * (V.met[v.id] ? 1 : 2)), sum = w.reduce((a, b) => a + b, 0);
  let x = rnd() * sum, v = c[c.length - 1]; for (let i = 0; i < c.length; i++) { x -= w[i]; if (x < 0) { v = c[i]; break; } }
  const out = YV_TOYS.concat(YV_OLD).filter(yvOut), toy = yvOut(v.fav) ? v.fav : v.rare && v.rare.toy && yvOut(v.rare.toy) ? v.rare.toy : out.length ? out[Math.floor(rnd() * out.length)] : '';
  return { id: v.id, t, toy, day, k };
}
// the whole day as it would go (tests and the Dev panel): one pick per open slot
function yvPlan(day) { const ex = [], L = []; for (let k = 0; k < yvOpen(); k++) { const p = yvPick(day, k, ex); if (p) { ex.push(p.id); L.push(p); } } return L; }
// a thank-you gift (V226.md 4): one per JST day at most, coins at most once a week
function yvGift(p) {
  const V = yvS(); if (V.gday === p.day) return '';
  const r = seeded(hashId(V.seed + '|' + p.day + '|' + p.k + '|gift')); if (r() >= YV_GIFT) return '';
  const x = r(), m = V.met[p.id] || {};
  let g = x < 0.4 ? 'sticker' : x < 0.7 ? 'bone' : x < 0.93 ? 'flower' : 'coins';
  if (g === 'sticker' && m.stk) g = 'flower';
  if (g === 'coins' && p.t - V.cday < YV_COIN_GAP) g = 'flower';
  V.gday = p.day;
  if (g === 'sticker') m.stk = 1;
  else if (g === 'bone') S.inv.food['Bone-shaped Biscuit'] = (S.inv.food['Bone-shaped Biscuit'] || 0) + 1;
  else if (g === 'flower') V.flowers++;
  else { V.cday = p.t; S.coins += YV_COIN; }
  return g;
}
function yvArrive(p) {
  const V = yvS(), m = V.met[p.id] || (V.met[p.id] = { d: localISO(new Date(p.t)), n: 0, last: 0, stk: 0, pet: '' });
  m.n++; m.last = Math.max(m.last || 0, p.t);
  const e = { id: p.id, t: p.t, toy: p.toy, g: yvGift(p) };
  V.log.push(e); if (V.log.length > YV_LOG) V.log.splice(0, V.log.length - YV_LOG);
  V.q.push(e); V.q.sort((a, b) => a.t - b.t); if (V.q.length > YV_Q) V.q.splice(0, V.q.length - YV_Q);
  return e;
}
// on coming back: every open slot between the last time the game was open and now becomes a visit
function yvCatchUp(now) {
  if (!S || !yvOn()) return [];
  now = now || Date.now(); const V = yvS();
  if (now - V.seen < YV_AWAY) { V.seen = Math.max(V.seen, now); return []; }
  const from = Math.max(V.seen, now - YV_BACK), got = [];
  for (let d0 = yvDay0(yvJst(from)); d0 <= now; d0 += 86400e3) {
    const day = yvJst(d0 + 3600e3), ex = V.log.filter((e) => yvJst(e.t) === day).map((e) => e.id);
    for (let k = 0; k < yvOpen(); k++) {
      const t = yvSlotT(day, k); if (t <= from || t > now) continue;
      const p = yvPick(day, k, ex); if (!p) continue; ex.push(p.id); got.push(yvArrive(p));
    }
  }
  V.seen = now; markDirty();
  if (got.length) emit('visitors:arrived', { list: got.map((e) => Object.assign({ name: yvDog(e.id).name }, e)) });
  return got;
}

/* ---------------- the visitor in the yard ---------------- */
const YV = { tick: 0, greet: false };
// fix batch (art 3, phone 4): the yard visitor has its own spot, right of the dog and clear of the mailbox (the pack's free spot stood it in front of
// the mailbox, the mail badge on its head, and off the left edge at 390 px). Feet x 592: inside the phone crop at 360 and 390 (phHomeRefit widens the
// crop to the right edge of visitorSpot(), which answers this spot while a yard visitor is drawn).
const YV_SPOT = [592, 452, 'left', 0.58]; // [feet x, feet y, facing, scale] as PACK_SPOTS (0.57 at y 438)
const yvSpot = () => YV_SPOT.slice();
const yvTownSpot = visitorSpot; // 14b_vet_playboard.js: the town visitor's spot (the pack's next free spot)
visitorSpot = function () { return S && S.place === 'yard' && $('#yvHost #visitorG', view) ? yvSpot() : yvTownSpot(); }; // eslint-disable-line no-func-assign
function yvVisDog(v) { const cs = typeof starterCoats === 'function' ? starterCoats(v.key) : [], c = cs[v.coat] || cs[0]; return { id: 'yv_' + v.id, key: v.key, genes: c ? c.genes : {}, born: bornDaysAgo(v.age), mix: null, sparkle: false }; }
function yvToyName(n) { return n ? homeName(n) : ''; }
function yvLine(e) {
  const v = yvDog(e.id);
  return e.toy ? tt('yv.line_toy', '{name} came by and tried the {toy}!', { name: v.name, toy: yvToyName(e.toy) })
    : tt('yv.line_sniff', '{name} came by and had a good sniff round the garden.', { name: v.name });
}
function yvSVG(e) {
  const v = yvDog(e.id), d = yvVisDog(v), [fx, fy, face, sc] = yvSpot(), tg = isPhone() ? [132, 31, 25, 21] : [92, 22, 17, 15], nm = v.name.length > 12 ? v.name.slice(0, 11) + '.' : v.name, w = 264 * sc, h = 220 * sc, z = sizeK(d);
  const ph = isPhone(), rw = Math.max((w - 52) * z, ph ? w - 52 : 0), up = Math.max((h * (205 / 220) - 26) * z, ph ? h * (205 / 220) - 26 : 0), dn = h * (15 / 220) * Math.max(z, ph ? 1 : 0);
  return `<g id="visitorG" class="visitor yv hot" data-yv="${esc(v.id)}" tabindex="0" role="button" aria-label="${esc(tt('yv.aria', '{name} is visiting from {family}', { name: v.name, family: yvFam(v) }))}"><rect x="${(fx - rw / 2).toFixed(1)}" y="${(fy - up).toFixed(1)}" width="${rw.toFixed(1)}" height="${(up + dn).toFixed(1)}" fill="transparent"/>${place(dogSVG(d, wetOpt(d, { pose: 'happy', facing: face })), fx - w * z / 2, fy - h * z * (205 / 220), w * z, h * z)}<g class="vtag" pointer-events="none" transform="translate(${fx} ${fy + 4})"><rect x="${-tg[0] / 2}" y="-2" width="${tg[0]}" height="${tg[1]}" rx="7" fill="#FFF3DA" stroke="#5B3D32" stroke-width="2"/><text y="${tg[3]}" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${tg[2]}" fill="#5B3D32">${esc(nm)}</text></g></g>`; // phones: a tag of 12 px or more at 360 (phone 11)
}
function yvHere() { return !!(S && yvOn() && cur.mode === 'yard' && S.place === 'yard' && !(typeof HO !== 'undefined' && HO.pl)); }
function yvDraw(greet) {
  const old = $('#yvHost', view); if (old) old.remove();
  if (!yvHere()) return null;
  const V = yvS(), e = V.q[V.q.length - 1]; if (!e || !yvDog(e.id)) return null;
  const svg = $('svg.world', view), pack = svg && $('#pack', svg); if (!pack) return null;
  if ($('#visitorG', view)) return null; // a town visitor already stands there
  pack.insertAdjacentHTML('beforebegin', `<g id="yvHost">${yvSVG(e)}</g>`);
  const g = $('#visitorG', view); g.onclick = () => yvCard(e.t); g.onkeydown = (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); yvCard(e.t); } };
  if (typeof phHomeRefit === 'function') phHomeRefit();
  if (typeof rmScan === 'function') try { rmScan(); } catch (er) { /* roam off */ }
  if (typeof dcRoom === 'function') dcRoom();
  if (greet) setTimeout(() => {
    if (!yvHere() || !$('#visitorG.yv', view) || !modal.hidden) return; const [fx, fy, , sc] = yvSpot(); say(yvLine(e), fx, fy - 200 * sc, 4200); SFX.bark(BARK[yvDog(e.id).key] || 1);
    if (e.g) setTimeout(() => toast(yvGiftLine(e), 'gold'), 600);
  }, 900);
  return e;
}
function yvGiftLine(e) {
  const v = yvDog(e.id);
  return e.g === 'sticker' ? tt('yv.gift_sticker', '{name} left a paw sticker for the Visitors Book.', { name: v.name })
    : e.g === 'bone' ? tt('yv.gift_bone', '{name} left a Bone-shaped Biscuit by the door. Thank you, {name}!', { name: v.name })
      : e.g === 'flower' ? tt('yv.gift_flower', '{name} left a little flower. It is pressed in the Visitors Book now.', { name: v.name })
        : e.g === 'coins' ? tt('yv.gift_coins', '{name} found {n} coins under the hedge and left them for you.', { name: v.name, n: YV_COIN }) : '';
}
function yvCard(t) {
  const V = yvS(), e = V.q.find((x) => x.t === t) || V.q[V.q.length - 1]; if (!e) return;
  const v = yvDog(e.id), m = V.met[v.id] || { n: 1 }, d = yvVisDog(v), petted = m.pet === localISO(), more = V.q.length > 1;
  SFX.boop(700);
  const p = openModal(tt('yv.title', '{name} is visiting!', { name: esc(v.name) }), `<div class="visitcard yv-card"><span class="vzdog">${dogSVG(d, { pose: 'sit' })}</span><div><p><b>${esc(v.name)}</b> · ${esc(tbreed(v.key))}${v.rare ? ` <span class="yv-star" title="${esc(tt('yv.rare', 'Rare visitor'))}">★</span>` : ''}</p>
    <p>${esc(tt('yv.family', 'Lives with {family}.', { family: yvFam(v) }))}</p><p class="small">${esc(yvLine(e))}</p>
    <p class="small">${esc(tt('yv.times', '{n, plural, one {First visit!} other {Visit number #.}}', { n: m.n }))}</p>${e.g ? `<p class="small yv-gift">${esc(yvGiftLine(e))}</p>` : ''}</div></div>`,
  { cls: 'yv-pop', foot: `<button class="btn" id="yvBye">${more ? tt('yv.next', 'Wave bye, next!') : tt('yv.bye', 'Wave bye')}</button><button class="btn" id="yvBookB">${tt('yv.book', 'Visitors Book')}</button><button class="btn yes big" id="yvPet" ${petted ? 'aria-disabled="true"' : ''}>${petted ? tt('yv.petted', 'Petted today') : tt('yv.pet', 'Pet')}</button>` });
  $('#yvPet', p).onclick = () => {
    const mm = V.met[v.id]; if (!mm) return;
    if (mm.pet === localISO()) { nope(tt('yv.already', '{name} already got pets today. The tail says otherwise.', { name: v.name })); return; }
    mm.pet = localISO(); addStat('happy', 3); markDirty(); SFX.boop(820); updateHUD(); closeModal();
    const [fx, fy, , sc] = yvSpot(); fxText('♥', fx, fy - 150 * sc); setTimeout(() => fxText('♥', fx + 20, fy - 170 * sc), 200);
    toast(tt('yv.hello', '{name} and {friend} sniff hello. +3 Happiness.', { name: NAME(), friend: v.name }), 'good');
  };
  $('#yvBookB', p).onclick = () => { SFX.click(); yvOpenBook(); };
  $('#yvBye', p).onclick = () => { SFX.click(); const i = V.q.indexOf(e); if (i >= 0) V.q.splice(i, 1); markDirty(); closeModal(); yvDraw(true); };
}

/* ---------------- the Visitors Book (V226.md 1) ---------------- */
function yvBookArt() { const P = window.PawArt, Y = P && P.YARD_VISITORS; try { return Y && Y.book ? Y.book() : ''; } catch (e) { return ''; } }
function yvBookHTML() {
  const V = yvS(), met = YV_DOGS.filter((v) => V.met[v.id]).length;
  const page = (v) => {
    const m = V.met[v.id], d = yvVisDog(v);
    if (!m) return `<div class="yv-page unk"><span class="yv-dog yv-sil">${dogSVG(d, { pose: 'sit' })}</span><b>???</b><span class="small">${esc(yvHint(v))}</span></div>`;
    return `<button class="yv-page" data-yvpage="${esc(v.id)}"><span class="yv-dog">${dogSVG(d, { pose: 'sit' })}</span>${m.stk ? `<span class="yv-stk" aria-label="${esc(tt('yv.stk', 'Paw sticker'))}">${yvPawStk()}</span>` : ''}<b>${esc(v.name)}${v.rare ? ' <span class="yv-star">★</span>' : ''}</b><span class="small">${esc(tbreed(v.key))}</span><span class="small">${esc(tt('yv.n_visits', '{n, plural, one {# visit} other {# visits}}', { n: m.n }))}</span></button>`;
  };
  return `<div class="yv-book"><div class="yv-head"><span class="yv-bookart">${yvBookArt()}</span><div><b>${esc(tt('yv.met_n', 'Met {n} of {total}', { n: met, total: YV_DOGS.length }))}</b><p class="small">${esc(tt('yv.book_intro', 'Neighbourhood dogs come by while you are out. Put toys in the yard and see who visits.'))}</p>${V.flowers ? `<p class="small">${esc(tt('yv.flowers', '{n, plural, one {# pressed flower} other {# pressed flowers}} between the pages.', { n: V.flowers }))}</p>` : ''}</div></div>
    <div class="yv-grid">${YV_DOGS.map(page).join('')}</div></div>`;
}
function yvPawStk() { return '<svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" fill="#FFE59A" stroke="#5B3D32" stroke-width="2.4"/><ellipse cx="20" cy="25" rx="7" ry="5.6" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.6"/><circle cx="12" cy="17" r="3" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.4"/><circle cx="17" cy="12" r="3" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.4"/><circle cx="23" cy="12" r="3" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.4"/><circle cx="28" cy="17" r="3" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.4"/></svg>'; }
function yvOpenBook() {
  const p = openModal(tt('yv.book_title', 'Visitors Book'), yvBookHTML(), { cls: 'yv-bookpop' });
  yvBindBook(p); return p;
}
function yvBindBook(root) { root.querySelectorAll('[data-yvpage]').forEach((b) => { b.onclick = () => { SFX.click(); yvOpenPage(b.dataset.yvpage); }; }); }
function yvOpenPage(id) {
  const v = yvDog(id), m = yvS().met[id]; if (!v || !m) return;
  const d = yvVisDog(v), fav = homeName(v.fav);
  const p = openModal(esc(v.name), `<div class="visitcard yv-card"><span class="vzdog">${dogSVG(d, { pose: 'happy', facing: 'right' })}</span><div><p><b>${esc(v.name)}</b> · ${esc(tbreed(v.key))}${v.rare ? ` <span class="yv-star">★</span>` : ''}</p>
    <p>${esc(tt('yv.family', 'Lives with {family}.', { family: yvFam(v) }))}</p><p class="small">${esc(tt('yv.first', 'First met: {date}', { date: tdate(new Date(m.d + 'T12:00:00'), { day: 'numeric', month: 'long' }) }))}</p>
    <p class="small">${esc(tt('yv.n_visits', '{n, plural, one {# visit} other {# visits}}', { n: m.n }))} · ${esc(tt('yv.fav', 'Favourite: {toy}', { toy: fav }))}</p>${v.rare ? `<p class="small">${esc(yvHint(v))}</p>` : ''}${m.stk ? `<p class="small"><span class="yv-stk in">${yvPawStk()}</span> ${esc(tt('yv.stk_left', 'Left you a paw sticker.'))}</p>` : ''}</div></div>`,
  { cls: 'yv-pop', foot: `<button class="btn yes" id="yvBack">${tt('yv.back', 'Back to the book')}</button>` });
  $('#yvBack', p).onclick = () => { SFX.click(); yvOpenBook(); };
}
// the Care tray card (yard) and the Journal tab (07_treasure_journal.js calls these)
function yvCareCard() {
  if (!S || !yvOn() || S.place === 'house') return '';
  const V = yvS(), met = YV_DOGS.filter((v) => V.met[v.id]).length;
  return `<button class="card" data-yvbook="1"><span class="art">${yvBookArt() || iconOr('star', '<circle r="12" fill="#F9D56E" stroke="#5B3D32" stroke-width="2.5"/>')}</span><b>${tt('yv.care', 'Visitors')}</b><span class="small">${esc(tt('yv.met_n', 'Met {n} of {total}', { n: met, total: YV_DOGS.length }))}</span></button>`;
}
function yvJournalTab(tabs) { if (S && yvOn()) tabs.push(['visitors', tt('yv.tab', 'Visitors')]); }
if (typeof dock !== 'undefined' && dock) dock.addEventListener('click', (ev) => { const b = ev.target.closest && ev.target.closest('[data-yvbook]'); if (b) { SFX.click(); yvOpenBook(); } });
if (typeof modal !== 'undefined' && modal) modal.addEventListener('click', (ev) => { const b = ev.target.closest && ev.target.closest('.j-visitors [data-yvpage]'); if (b) { SFX.click(); yvOpenPage(b.dataset.yvpage); } });

/* ---------------- wiring ---------------- */
function yvTick() { if (S && S.visitors && document.visibilityState === 'visible') S.visitors.seen = Math.max(S.visitors.seen || 0, Date.now()); }
function yvBack() { const got = yvCatchUp(); if (got.length && yvHere()) yvDraw(true); else if (got.length) YV.greet = true; return got; }
on('game:ready', () => { if (!S) return; v226Fields(S); const got = yvCatchUp(); if (got.length) YV.greet = true; clearInterval(YV.tick); YV.tick = setInterval(yvTick, 30000); setTimeout(yvExpose, 0); });
on('yard:enter', () => { if (!S || !yvOn()) return; yvDraw(YV.greet); if (YV.greet && $('#visitorG.yv', view)) YV.greet = false; });
document.addEventListener('visibilitychange', () => { if (!S) return; if (document.visibilityState === 'hidden') { if (S.visitors) S.visitors.seen = Date.now(); } else yvBack(); });
function yvExpose() {
  if (!window.__paw) return;
  window.__paw.yv = {
    dogs: YV_DOGS, toys: YV_TOYS, old: YV_OLD, on: yvOn, state: () => JSON.parse(JSON.stringify(yvS())), pull: yvPull, open: yvOpen,
    plan: (day) => yvPlan(day || jstISO()), slotT: yvSlotT, can: (id, t) => yvCan(yvDog(id), t || Date.now()),
    catchUp: (now) => yvCatchUp(now), back: yvBack, draw: () => yvDraw(false), card: () => { const q = yvS().q; if (q.length) yvCard(q[q.length - 1].t); },
    book: yvOpenBook, page: yvOpenPage, away: (ms) => { yvS().seen = Date.now() - ms; }, fields: v226Fields,
    env: (k, v) => { ENV[k] = v; }, test: (v) => { prefs.yvTest = !!v; }, get date() { return NEWS_V226.date; }, journal: () => openJournal('visitors'), care: () => openCareTray(), gift: (id, day, k) => yvGift({ id, day, k, t: Date.now() })
  };
}
setTimeout(yvExpose, 0);
