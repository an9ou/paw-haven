/* ======================= v2.19 "Friends first": 50_friends.js (tag fr) =======================
   Friend codes, the Friends sheet, yard visits, pets and paw-print notes (V219.md sections 0, 2, 3, 4 and 8). Gifts and the walk come later.
   Save field S.fr (v219Fields in 00_core.js). Test hook: window.__paw.fr.
   No typed text leaves the device: names are word indices, notes are FR_NOTES indices, dogs are Dog Card indices.
   Off until the v2.19 release (FR_LIVE). A test turns it on with prefs.frTest or window.__pawCloudMock. Never on the claude.ai artifact. */
const FR_LIVE = false; // the Game Manager turns this on at the v2.19 release
function frOn() {
  if (typeof clArtifact === 'function' && clArtifact()) return false;
  if (FR_LIVE && !navigator.webdriver) return true; // live, but still off under the test harness unless a test asks (V219 section 0)
  return !!(prefs.frTest || (typeof window !== 'undefined' && window.__pawCloudMock));
}
const FR = { pick: [0, 0], invite: null, inviteShown: false, wantAdd: false, offline: false, pending: 0, inAt: 0, yardAt: 0, menu: '', gen: 0, visit: null, roam: [], raf: 0, petBusy: false };

/* append only, never reorder: the Worker validates indices */
const FR_NOTES = [
  'Your dog is so fluffy!',
  'Thanks for the gift!',
  'Happy walk day!',
  'Your yard looks lovely!',
  'Woof! (That means hello.)',
  'See you tomorrow!',
  'What a nice outfit!',
  'Sending a big sniff!',
  'Have a cosy day!',
  'Your garden is growing!',
  'Best buddies!',
  'Good dog, good day!'
];
/* append only, never reorder: the Worker validates indices. Yard decor only (HM_DECOR, missing room counts as yard). Winter Market included. */
const FR_DECOR = [
  'Giant Crayon Box', 'Family Photo Frame', 'Doggy Ramp', 'Rocking Chair', 'Jack-o-Lantern Trio', 'Paper Bat Bunting', 'Friendly Scarecrow', 'Pumpkin Lantern', 'Ghost Garland',
  'Ghost Lantern String', 'Pumpkin Fairy Lights', 'Friendly Fence Web', 'Cardboard Black Cat', 'Cauldron Planter', 'Felt Fir Tree', 'Yard Snowman', 'Candy-Cane Fairy Lights', 'Present Pile', 'Star Lantern',
  'Bird Bath', 'Flower Barrel', 'String Lights', 'Garden Bench', 'Hammock', 'Wind Chime', 'Sandbox', 'Stepping Stones', 'Paper Snowflake Garland', 'Felt Holly Wreath', 'Red Wooden Sled', 'Kadomatsu Pair'
];
/* append only, never reorder: the Worker validates indices */
const FR_HOUSES = ['Cardboard Box', 'Classic Wooden Doghouse', 'Cozy Cottage', 'Snow Igloo', 'Treehouse Den', 'Royal Castle Kennel', 'Little Tea House', 'Beach Hut', 'Camper Van', 'Pumpkin Cottage', 'Lighthouse Kennel', 'Friendly Haunted Kennel', 'Gingerbread Kennel', 'Rocket Ship'];
/* append only, never reorder: the Worker validates indices.
   FOOD in table order except Fresh Water, then Wild Berries and Duck's Picnic Sandwich, then the 6 seed packets, then the 6 crops. No Golden Bone. */
const FR_GIFTS = [
  'Basic Kibble', 'Puppy Kibble', 'Bone-shaped Biscuit', 'Chicken & Rice Bowl', 'Salmon Pâté', 'Pupcake', 'Carrot Sticks', 'Apple Slices', 'Blueberry Bites', 'Seedless Watermelon Cubes',
  'Sweet Potato Chews', 'Pumpkin Purée', 'Turkey Meatballs', 'Baked Pumpkin Wedges', 'Sweet Potato Coins', 'Warm Bone Broth', 'Ghost Biscuits', 'Candy Corn Carrots', 'Monster Meatball', 'Pumpkin Patch Pupcake',
  'Apple Monster Biscuits', 'Sweet Potato Bones', 'Frozen Yoghurt Ghosts', 'Warm Carob Cup', 'Snowflake Oat Cookies', 'Snow Day Stew', 'Pup Kinton', 'Reindeer Crunch', 'Turkey & Cranberry Bites', 'Frozen Yoghurt Snowballs',
  'Sweet Potato Strip', 'Dog Senbei', 'Frozen Pupsicle', 'Wild Berries', "Duck's Picnic Sandwich", 'Pea Seeds', 'Spinach Seeds', 'Carrot Seeds', 'Blueberry Seeds', 'Sweet Potato Seeds', 'Pumpkin Seeds',
  'Peas', 'Spinach', 'Carrot', 'Blueberries', 'Sweet Potato', 'Pumpkin'
];
const FR_ALPH = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const FR_LINK = 'https://doodledoggo.app/f/';

function frIcon() {
  try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.badge === 'function') return P.FRIENDS.badge(); } catch (e) { /* art missing */ }
  return ICON('bond'); // TODO art
}
function frPawHTML() {
  let svg = '';
  try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.paw === 'function') svg = P.FRIENDS.paw(); } catch (e) { svg = ''; }
  if (!svg) svg = `<svg viewBox="-16 -16 32 32" aria-hidden="true">${doodle('paw', 0, 0, 1)}</svg>`; // TODO art
  return `<span class="fr-letterpaw" aria-hidden="true">${svg}</span>`;
}
const frBadgeN = () => FR.pending | 0;
function frPairName(pair) {
  if (!pair || DC_WORDS_A[pair[0]] == null || DC_WORDS_B[pair[1]] == null) return '';
  return tt('fr.name', '{a} {b}', { a: dcWordA(pair[0]), b: dcWordB(pair[1]) });
}
function frNormCode(s) {
  if (typeof s !== 'string' || s.length > 40) return null;
  let t = s.replace(/\s+/g, '').toUpperCase();
  if (t.startsWith('DOG-')) t = t.slice(4);
  else if (t.startsWith('DOG')) t = t.slice(3);
  if (t.length !== 5 || [...t].some((c) => !FR_ALPH.includes(c))) return null;
  return 'DOG-' + t;
}
const frLinkOf = (code) => FR_LINK + (code || '');
function frReadInvite() {
  try {
    const q = new URLSearchParams(location.search).get('friend') || '';
    const hash = String(location.hash || '').replace(/^#/, '');
    const hm = hash.match(/(?:^|[?&])friend=([^&]*)/);
    const code = frNormCode(q || (hm ? decodeURIComponent(hm[1]) : ''));
    if (code) FR.invite = code;
  } catch (e) { /* a bad hash stays unset */ }
}
function frGuideHold() {
  if (!S || !S.guide || S.guide.done || S.guide.skipped) return false;
  if (typeof gdLive === 'function' && gdLive() && typeof gdAllowed === 'function' && gdAllowed()) return true;
  if (S.fw && S.fw.fresh && typeof gdAllowed === 'function' && gdAllowed() && S.guide.step >= 0) return true;
  return false;
}
function frDay() { if (!S) return; const before = S.fr && S.fr.day; v219Fields(S); if (S.fr && before && before !== S.fr.day) markDirty(); }

async function frApi(method, path, body) {
  if (typeof clEnsureUser !== 'function' || !(await clEnsureUser())) throw new Error('offline');
  return clApi(method, path, body);
}
function frErr(r) { return (r && r.data && r.data.error) || (r && r.error && r.error.message) || ''; }

/* ---------- the yard snapshot (V219.md section 2). Indices only. Never a typed dog name. ---------- */
function frYard() {
  if (!S || !S.fr) return null;
  v219Fields(S);
  const dogs = [];
  const lead = S.dog;
  [lead].concat((S.dogs || []).filter((d) => d && lead && d.id !== lead.id)).forEach((d) => {
    if (!d || dogs.length >= 5 || typeof dcDogOf !== 'function') return;
    const x = dcDogOf(d);
    if (!x || !Number.isInteger(x.b) || x.b < 0) return;
    if (x.c && x.c.M && x.c.M[0] === 'M' && x.c.M[1] === 'M') return;
    dogs.push({ b: x.b, c: x.c, o: x.o, a: x.a, s: x.s, sp: x.sp ? 1 : 0, n: x.n });
  });
  const decor = [];
  if (typeof hmDecorFields === 'function') hmDecorFields();
  Object.keys((S && S.decor) || {}).forEach((n) => {
    if (decor.length >= 40) return;
    const rec = S.decor[n]; if (!rec || !rec.out) return;
    const i = FR_DECOR.indexOf(n); if (i < 0) return;
    const cat = typeof HM_DECOR !== 'undefined' ? HM_DECOR[n] : null;
    const at = Array.isArray(rec.at) && rec.at.length >= 2 ? rec.at : (cat && cat.at) || null;
    if (!at) return;
    let x = Math.round(Number(at[0])), y = Math.round(Number(at[1]));
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    x = Math.max(0, Math.min(1200, x)); y = Math.max(0, Math.min(800, y));
    decor.push({ i, x, y });
  });
  const hi = FR_HOUSES.indexOf(S.house);
  const season = typeof seasonNow === 'function' ? seasonNow() : 'spring';
  const name = Array.isArray(S.fr.name) ? S.fr.name.slice(0, 2) : [0, 0];
  return { v: 1, name, house: hi >= 0 ? hi : 0, season, dogs, decor };
}
function frAfterPush() {
  try {
    if (!frOn() || !S || !S.fr || !S.fr.fid) return Promise.resolve(false);
    if (Date.now() - FR.yardAt < 600000) return Promise.resolve(false);
    const yard = frYard(); if (!yard) return Promise.resolve(false);
    FR.yardAt = Date.now();
    return frApi('PUT', '/friends/yard', { yard }).then((r) => { if (!r || !r.ok) FR.yardAt = 0; return !!(r && r.ok); }).catch(() => { FR.yardAt = 0; return false; });
  } catch (e) { FR.yardAt = 0; return Promise.resolve(false); }
}

/* ---------- QR, drawn as pencil squares on the card's white tile. The card itself is never night-tinted. ---------- */
function frQRSVG(text, box) {
  let M = null;
  try { M = window.PawQR && typeof PawQR.matrix === 'function' ? PawQR.matrix(text) : null; } catch (e) { M = null; }
  if (!M || !M.length) return '';
  const n = M.length, q = 1, cells = n + q * 2, s = box.w / cells;
  let out = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (M[r][c]) {
    const x = box.x + (c + q) * s, y = box.y + (r + q) * s;
    out += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(s + 0.15).toFixed(2)}" height="${(s + 0.15).toFixed(2)}" fill="${INKG}"/>`;
  }
  return out;
}
function frCardSVG(code, name) {
  let svg = '';
  try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.card === 'function') svg = P.FRIENDS.card(code || ''); } catch (e) { svg = ''; }
  const box = (window.PawArt && PawArt.FRIENDS && PawArt.FRIENDS.cardQR) || { x: 34, y: 42, w: 116, h: 116 };
  const qr = code ? frQRSVG(frLinkOf(code), box) : '';
  const size = !name ? 22 : name.length > 16 ? 15 : name.length > 12 ? 18 : 22;
  const nm = name ? `<text x="222" y="114" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${size}" fill="${INKG}" textLength="108" lengthAdjust="spacingAndGlyphs">${esc(name)}</text>` : '';
  if (!svg) return `<div class="fr-codebig">${esc(code || '')}${qr ? `<svg viewBox="0 0 300 200">${qr}</svg>` : ''}</div>`; // TODO art
  return svg.replace(/<\/svg>\s*$/, qr + nm + '</svg>');
}
function frWheelSVG(which, idx) {
  const words = which === 'a' ? DC_WORDS_A : DC_WORDS_B, show = which === 'a' ? dcWordA : dcWordB;
  const at = (k) => show((idx + k + words.length) % words.length);
  let frame = '';
  try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.wheel === 'function') frame = P.FRIENDS.wheel(); } catch (e) { frame = ''; }
  const tx = (id, y, word, size, op) => `<text id="${id}" x="80" y="${y}" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${size}" fill="${INKG}" opacity="${op}" textLength="100" lengthAdjust="spacingAndGlyphs">${esc(word)}</text>`;
  const texts = tx('frW-' + which + '-p', 68, at(-1), 16, '.45') + tx('frW-' + which, 116, at(0), 22, '1') + tx('frW-' + which + '-n', 164, at(1), 16, '.45');
  if (!frame) return `<b id="frW-${which}">${esc(at(0))}</b>`; // TODO art
  return frame.replace(/<\/svg>\s*$/, texts + '</svg>');
}
function frDoodle(kind, on) {
  let svg = '';
  try {
    const P = window.PawArt && PawArt.FRIENDS;
    if (kind === 'note' && P && P.paw) svg = P.paw();
    else if (kind === 'gift' && P && P.wrap) svg = P.wrap(0);
  } catch (e) { svg = ''; }
  if (kind === 'pet' || !svg) svg = `<svg viewBox="-18 -18 36 36" aria-hidden="true">${doodle(kind === 'gift' ? 'bone' : kind === 'note' ? 'paw' : 'heart', 0, 2, 0.8)}</svg>`;
  return `<span class="fr-doo${on ? ' on' : ''}">${svg}</span>`;
}
function frHeadHTML(dog) {
  if (!dog || typeof dcDog !== 'function') return `<span class="fr-head">${doodle('paw', 24, 24, 1)}</span>`;
  try {
    const d = dcDog({ id: 'fr', name: [0, 0], dogs: [dog] }, 0);
    if (d && typeof headSVG === 'function') return `<span class="fr-head" aria-hidden="true">${headSVG(d)}</span>`;
  } catch (e) { /* a breed this copy does not know yet */ }
  return `<span class="fr-head" aria-hidden="true"><svg viewBox="-16 -16 32 32">${doodle('paw', 0, 0, 1)}</svg></span>`;
}

/* ---------- lists ---------- */
function frSentN(f) { const s = (f && f.sent) || {}; return ['pet', 'note', 'gift', 'walk'].reduce((n, k) => n + (s[k] ? 1 : 0), 0); }
function frSorted(list) {
  return (list || []).slice().sort((a, b) => frSentN(a) - frSentN(b) || frPairName(a.name).localeCompare(frPairName(b.name)));
}
function frApplyMe(me) {
  if (!me || !me.fid) return;
  v219Fields(S);
  const name = Array.isArray(me.name) ? me.name.slice(0, 2) : S.fr.name;
  const same = S.fr.on && S.fr.fid === me.fid && S.fr.code === (me.code || S.fr.code) && JSON.stringify(S.fr.name) === JSON.stringify(name);
  S.fr.on = true; S.fr.fid = me.fid; if (me.code) S.fr.code = me.code; if (Array.isArray(me.name)) S.fr.name = name;
  if (!same) markDirty();
}
function frCache(friends) {
  v219Fields(S);
  const next = JSON.stringify(friends || []);
  if (JSON.stringify(S.fr.cache.friends || []) !== next) { S.fr.cache = { at: Date.now(), friends: friends || [] }; markDirty(); }
}
async function frLoad() {
  v219Fields(S);
  try {
    const r = await frApi('GET', '/friends');
    if (!r || !r.ok || !r.data) { FR.offline = true; return null; }
    FR.offline = false;
    if (r.data.me) frApplyMe(r.data.me);
    frCache(Array.isArray(r.data.friends) ? r.data.friends : []);
    return r.data;
  } catch (e) { FR.offline = true; return null; }
}

/* ---------- inbox: notes become postcard letters, and a day's pets become one visit letter. gift and walk stay, and count on the badge. ---------- */
function frPetText(names, dog, bonded) {
  const name = names[0] || tt('fr.a_friend', 'A friend'), n = names.length - 1;
  const line = n > 0
    ? tt('fr.pet_many', '{name} and {n, plural, one {# friend} other {# friends}} visited and petted {dog}.', { name, n, dog })
    : tt('fr.pet_one', '{name} visited and petted {dog}.', { name, dog });
  if (!bonded) return line;
  return line + ' ' + (bonded === 1 ? tt('fr.plus_bond', '+1 Bond') : tt('fr.plus_bond_n', '+{n} Bond', { n: bonded }));
}
function frClaimPets(events) {
  const groups = new Map();
  events.forEach((ev) => {
    if (!ev || ev.kind !== 'pet') return;
    const day = typeof ev.day === 'string' && ev.day ? ev.day : localISO();
    if (!groups.has(day)) groups.set(day, []);
    groups.get(day).push(ev);
  });
  const claim = [];
  v219Fields(S);
  groups.forEach((list, day) => {
    const names = []; let bonded = 0;
    list.forEach((ev) => {
      const name = frPairName(ev.from && ev.from.name) || tt('fr.a_friend', 'A friend');
      if (!names.includes(name)) names.push(name);
      if (S.fr.gotPets < 5) { addBond(1, { raw: true }); S.fr.gotPets++; bonded++; markDirty(); }
      claim.push(ev.id);
    });
    if (typeof mailPush === 'function') mailPush({ kind: 'news', id: 'fr_pet_' + day + '_' + list[0].id, from: names[0], title: names.length > 1 ? tt('fr.pet_title_many', 'A visit from {name} and friends', { name: names[0] }) : tt('fr.pet_title', 'A visit from {name}', { name: names[0] }), text: frPetText(names, NAME(), bonded) });
  });
  return claim;
}
async function frInbox() {
  if (!frOn() || !S) return;
  v219Fields(S);
  if (!S.fr.fid) return;
  let r = null;
  try { r = await frApi('GET', '/friends/inbox'); } catch (e) { return; }
  if (!r || !r.ok || !r.data || !Array.isArray(r.data.events)) return;
  const claim = [];
  r.data.events.forEach((ev) => {
    if (!ev || ev.kind !== 'note') return;
    const i = ev.data && ev.data.i;
    if (!Number.isInteger(i) || i < 0 || i >= FR_NOTES.length) return;
    const name = frPairName(ev.from && ev.from.name) || tt('fr.a_friend', 'A friend');
    if (typeof mailPush === 'function') mailPush({ kind: 'postcard', id: 'fr_note_' + ev.id, from: name, title: tt('fr.note_title', 'A paw print from {name}', { name }), text: tt('fr.note_' + i, FR_NOTES[i]), frPaw: true });
    claim.push(ev.id);
  });
  frClaimPets(r.data.events).forEach((id) => { if (!claim.includes(id)) claim.push(id); });
  FR.pending = r.data.events.filter((ev) => ev && !claim.includes(ev.id)).length;
  frBadgeSync();
  if (claim.length) { try { await frApi('POST', '/friends/inbox/claim', { ids: claim.slice(0, 30) }); } catch (e) { /* the letter is already here. the next look claims it */ } }
}
function frInboxSoon(force) {
  if (!frOn() || !S || !S.fr || !S.fr.fid) return;
  const now = Date.now();
  if (!force && now - FR.inAt < 60000) return;
  FR.inAt = now; frInbox();
}

/* ---------- buttons ---------- */
function frMenuBtn() {
  if (!frOn() || !S) return '';
  const n = frBadgeN();
  return `<button class="btn big" id="mmFr" type="button" aria-label="${esc(n ? tt('fr.menu_n', 'Friends, {n} waiting', { n }) : tt('fr.menu', 'Friends'))}"><span class="ic">${frIcon()}</span>${esc(tt('fr.menu', 'Friends'))}${n ? `<b class="fr-badge">${n > 9 ? '9+' : n}</b>` : ''}</button>`;
}
function frLeaveRow() {
  if (!frOn() || !S || !S.fr || !S.fr.fid) return '';
  return `<p class="fr-setrow"><button class="btn" type="button" id="frLeave">${esc(tt('fr.leave', 'Leave Friends'))}</button></p>`;
}
function frHudSync() {
  const coins = $('#coins'); if (!coins) return;
  let b = $('#frBtn');
  if (!b) {
    const after = $('#msBtn') || coins;
    after.insertAdjacentHTML('afterend', `<button id="frBtn" class="fr-btn" type="button" hidden><span class="fr-ic" aria-hidden="true">${frIcon()}</span><b class="fr-badge" hidden></b></button>`);
    b = $('#frBtn'); b.onclick = (e) => { e.stopPropagation(); SFX.click(); frOpen(); };
  }
  const on = frOn() && !!S && cur.mode !== 'title';
  b.hidden = !on;
  if (!on) return;
  const n = frBadgeN(), badge = b.querySelector('.fr-badge');
  if (badge) { badge.hidden = !n; badge.textContent = n > 9 ? '9+' : String(n); }
  const lbl = n ? tt('fr.menu_n', 'Friends, {n} waiting', { n }) : tt('fr.menu', 'Friends');
  if (b.getAttribute('aria-label') !== lbl) { b.setAttribute('aria-label', lbl); b.title = lbl; }
  frDockBadge();
}
function frDockBadge() {
  if (typeof bar === 'undefined' || !bar) return;
  const b = bar.querySelector('.act[data-act="friends"]'); if (!b) return;
  let t = b.querySelector(':scope > .fr-badge');
  const n = frBadgeN();
  if (!n) { if (t) t.remove(); return; }
  const txt = n > 9 ? '9+' : String(n);
  if (!t) b.insertAdjacentHTML('beforeend', `<b class="fr-badge" aria-hidden="true">${txt}</b>`);
  else if (t.textContent !== txt) t.textContent = txt;
}
function frBadgeSync() { try { frHudSync(); } catch (e) { /* hud not up yet */ } }

/* ---------- name pick ---------- */
function frDefaultName() {
  const nm = S && S.dc && Array.isArray(S.dc.name) ? S.dc.name : null;
  if (nm && DC_WORDS_A[nm[0]] != null && DC_WORDS_B[nm[1]] != null) return [nm[0], nm[1]];
  return [0, 0];
}
function frWheelPaint() {
  ['a', 'b'].forEach((w) => {
    const words = w === 'a' ? DC_WORDS_A : DC_WORDS_B, show = w === 'a' ? dcWordA : dcWordB, i = FR.pick[w === 'a' ? 0 : 1];
    const put = (id, k) => { const el = document.getElementById(id); if (el) el.textContent = show((i + k + words.length) % words.length); };
    put('frW-' + w + '-p', -1); put('frW-' + w, 0); put('frW-' + w + '-n', 1);
  });
  const p = document.getElementById('frPrev'); if (p) p.textContent = frPairName(FR.pick);
}
function frNameHTML() {
  const wheel = (w, i, label) => `<div class="fr-wheel"><button class="btn fr-wbtn" type="button" data-frspin="${w}:-1" aria-label="${esc(tt('fr.wheel_up', 'Previous {word}', { word: label }))}">${esc(tt('fr.up', 'Up'))}</button><div class="fr-wframe">${frWheelSVG(w, i)}</div><button class="btn fr-wbtn" type="button" data-frspin="${w}:1" aria-label="${esc(tt('fr.wheel_down', 'Next {word}', { word: label }))}">${esc(tt('fr.down', 'Down'))}</button></div>`;
  return `<div class="fr-namepick"><p>${esc(tt('fr.pick_lead', 'Pick your friend name. Two words, the same ones as a Dog Card.'))}</p><div class="fr-wheels">${wheel('a', FR.pick[0], tt('fr.word_a', 'First word'))}${wheel('b', FR.pick[1], tt('fr.word_b', 'Second word'))}</div><p class="fr-prev" id="frPrev">${esc(frPairName(FR.pick))}</p><div class="fr-namebtns"><button class="btn" type="button" id="frRand">${esc(tt('fr.random', 'Random'))}</button><button class="btn yes" type="button" id="frOk">${esc(tt('fr.this_name', 'This is my name'))}</button></div></div>`;
}
function frNameBind(p) {
  p.querySelectorAll('[data-frspin]').forEach((b) => { b.onclick = () => { SFX.click(); const [w, d] = b.dataset.frspin.split(':'); const k = w === 'a' ? 0 : 1, n = w === 'a' ? DC_WORDS_A.length : DC_WORDS_B.length; FR.pick[k] = (FR.pick[k] + (+d) + n) % n; frWheelPaint(); }; });
  const rand = $('#frRand', p); if (rand) rand.onclick = () => { SFX.click(); FR.pick = [RINT(0, DC_WORDS_A.length - 1), RINT(0, DC_WORDS_B.length - 1)]; frWheelPaint(); };
  const ok = $('#frOk', p); if (ok) ok.onclick = () => { SFX.click(); frMake(FR.pick[0], FR.pick[1], p); };
}
function frNameSheet() {
  FR.pick = frDefaultName();
  const p = openModal(esc(tt('fr.pick_title', 'Pick your friend name')), frNameHTML(), { cls: 'frsheet' });
  frNameBind(p); return p;
}
async function frMake(a, b, p) {
  const btn = p && $('#frOk', p); if (btn) btn.disabled = true;
  let r = null;
  try { r = await frApi('POST', '/friends/me', { name: [a, b] }); } catch (e) { r = null; }
  if (btn) btn.disabled = false;
  if (!r || !r.ok || !r.data || !r.data.fid) {
    FR.offline = !r;
    toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad');
    return false;
  }
  frApplyMe(r.data); try { saveNow(); } catch (e) { /* storage */ }
  frSheet(); frInboxSoon(true); return true;
}

/* ---------- the sheet ---------- */
function frBoxesHTML() {
  const raw = FR.invite ? FR.invite.slice(4) : '';
  const boxes = [0, 1, 2, 3, 4].map((i) => `<input class="fr-ch" id="frCh${i}" data-i="${i}" maxlength="1" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" aria-label="${esc(tt('fr.letter_n', 'Letter {n}', { n: i + 1 }))}" value="${esc(raw[i] || '')}">`).join('');
  return `<div class="fr-add"><span class="fr-pre" aria-hidden="true">DOG-</span><span class="fr-boxes">${boxes}</span><button class="btn yes" type="button" id="frAdd">${esc(tt('fr.add', 'Add'))}</button></div>`;
}
function frRowHTML(f) {
  const name = frPairName(f.name) || tt('fr.a_friend', 'A friend');
  const s = f.sent || {};
  return `<div class="fr-row" data-fid="${esc(f.fid)}">${frHeadHTML(f.dogs && f.dogs[0])}<span class="fr-nm">${esc(name)}</span><span class="fr-doos" aria-hidden="true">${frDoodle('pet', !!s.pet)}${frDoodle('note', !!s.note)}${frDoodle('gift', !!s.gift)}</span><span class="fr-rowacts"><button class="btn" type="button" data-fr="visit">${esc(tt('fr.visit', 'Visit'))}</button><button class="btn" type="button" data-fr="gift">${esc(tt('fr.gift', 'Gift'))}</button><button class="btn" type="button" data-fr="more" aria-label="${esc(tt('fr.more_aria', 'More for {name}', { name }))}">...</button></span>${FR.menu === f.fid ? `<span class="fr-pop"><button class="btn" type="button" data-fr="remove">${esc(tt('fr.remove', 'Remove friend'))}</button><button class="btn" type="button" data-fr="block">${esc(tt('fr.block', 'Block'))}</button></span>` : ''}</div>`;
}
function frSheetHTML() {
  v219Fields(S);
  const name = frPairName(S.fr.name), code = S.fr.code || '';
  const friends = frSorted((S.fr.cache && S.fr.cache.friends) || []);
  const off = FR.offline ? `<p class="fr-off" id="frOff">${esc(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'))}</p>` : '';
  const list = friends.length ? friends.map(frRowHTML).join('') : `<p class="small">${esc(tt('fr.none', 'No friends yet. Share your code, or add one below.'))}</p>`;
  return `<div class="fr-sheet">${off}<div class="fr-card" id="frCard">${frCardSVG(code, name)}</div><div class="fr-acts"><button class="btn yes" type="button" id="frShare">${esc(tt('fr.share', 'Share invite'))}</button><button class="btn" type="button" id="frCopy">${esc(tt('fr.copy', 'Copy code'))}</button><button class="btn" type="button" id="frNew">${esc(tt('fr.new_code', 'New code'))}</button></div><h3 class="fr-h">${esc(tt('fr.add_title', 'Add a friend'))}</h3>${frBoxesHTML()}<h3 class="fr-h">${esc(tt('fr.list_title', 'Friends'))}</h3><div class="fr-list" id="frList">${list}</div></div>`;
}
function frCodeChars() { return [0, 1, 2, 3, 4].map((i) => { const el = document.getElementById('frCh' + i); return el ? el.value.toUpperCase() : ''; }).join(''); }
function frFillCode(code) {
  const raw = (code || '').replace(/^DOG-/, '');
  [0, 1, 2, 3, 4].forEach((i) => { const el = document.getElementById('frCh' + i); if (el) el.value = raw[i] || ''; });
}
function frTakeChar(el, ch) {
  const c = String(ch || '').toUpperCase();
  if (!c) { el.value = ''; return false; }
  if (!FR_ALPH.includes(c)) { el.value = ''; return false; }
  el.value = c; return true;
}
function frBindBoxes(p) {
  const boxes = [...p.querySelectorAll('.fr-ch')];
  boxes.forEach((el, i) => {
    el.addEventListener('input', () => {
      const raw = el.value;
      if (!raw) return;
      if (raw.length > 1) { frFillCode(frNormCode(raw) || raw); return; }
      if (!frTakeChar(el, raw) ) return;
      const n = boxes[i + 1]; if (n) n.focus();
    });
    el.addEventListener('keydown', (e) => { if (e.key === 'Backspace' && !el.value && boxes[i - 1]) { boxes[i - 1].focus(); boxes[i - 1].value = ''; } });
    el.addEventListener('paste', (e) => {
      const t = (e.clipboardData && e.clipboardData.getData('text')) || '';
      if (!t) return;
      e.preventDefault();
      const code = frNormCode(t);
      if (code) frFillCode(code);
      else { const chars = t.toUpperCase().replace(/[^A-Z2-9]/g, '').split('').filter((c) => FR_ALPH.includes(c)); chars.slice(0, 5).forEach((c, k) => { if (boxes[k]) boxes[k].value = c; }); }
    });
  });
}
async function frCopyText(text, okLine) {
  try { if (navigator.clipboard && navigator.clipboard.writeText) { await navigator.clipboard.writeText(text); toast(okLine, 'good'); return true; } } catch (e) { /* fall through */ }
  try {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.left = '-9999px';
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove();
    if (ok) { toast(okLine, 'good'); return true; }
  } catch (e) { /* nothing to copy with */ }
  toast(tt('fr.copy_fail', 'Could not copy just now.'), '');
  return false;
}
async function frShare() {
  const link = frLinkOf(S.fr && S.fr.code);
  try {
    if (navigator.share) { await navigator.share({ title: tt('fr.share_title', 'Doodle Doggo'), text: tt('fr.share_text', 'Come and play Doodle Doggo with me.'), url: link }); return; }
  } catch (e) { if (e && e.name === 'AbortError') return; }
  frCopyText(link, tt('fr.link_copied', 'Invite link copied'));
}
function frHearts() {
  try {
    if (cur.mode !== 'yard' || typeof dogHeadWorld !== 'function' || typeof fxText !== 'function') return;
    const h = dogHeadWorld(); fxText('♥', h.x, h.y - 80); setTimeout(() => fxText('♥', h.x + 18, h.y - 110), 180);
  } catch (e) { /* the toast still says it */ }
}
async function frAdd() {
  const code = frNormCode('DOG-' + frCodeChars());
  if (!code) { nope(tt('fr.not_found', "We couldn't find that code. Check the letters?")); return; }
  const had = new Set(((S.fr.cache && S.fr.cache.friends) || []).map((f) => f.fid));
  let r = null;
  try { r = await frApi('POST', '/friends/add', { code }); } catch (e) { FR.offline = true; frSheet(); return; }
  if (!r || !r.ok) {
    const err = frErr(r);
    if (err === 'not_found') nope(tt('fr.not_found', "We couldn't find that code. Check the letters?"));
    else if (err === 'self') nope(tt('fr.self', "That's you! Share your code with a friend."));
    else if (err === 'full') nope(tt('fr.full', 'You have 50 friends, the most for now.'));
    else if (err === 'already') toast(tt('fr.already', 'You are already friends.'), 'good');
    else toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad');
    return;
  }
  FR.invite = null; FR.wantAdd = false;
  await frLoad();
  const added = ((S.fr.cache && S.fr.cache.friends) || []).find((f) => f && !had.has(f.fid));
  toast(tt('fr.added', '{name} is your friend now!', { name: (added && frPairName(added.name)) || tt('fr.a_friend', 'A friend') }), 'good');
  frHearts(); frSheet();
}
async function frNewCode(p) {
  const ok = await confirmIn(p, esc(tt('fr.new_ask', 'Your old code will stop working. Friends you already have stay.')), esc(tt('fr.new_yes', 'New code')), esc(tt('fr.keep_code', 'Keep this code')));
  if (!ok) return;
  let r = null;
  try { r = await frApi('POST', '/friends/code/new', {}); } catch (e) { toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad'); return; }
  if (!r || !r.ok || !r.data || !r.data.code) { toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad'); return; }
  frApplyMe(r.data); try { saveNow(); } catch (e) { /* storage */ }
  toast(tt('fr.new_done', 'New code ready.'), 'good'); frSheet();
}
async function frRemove(fid) {
  let r = null;
  try { r = await frApi('POST', '/friends/remove', { fid }); } catch (e) { FR.offline = true; frSheet(); return; }
  if (!r || !r.ok) { toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad'); return; }
  FR.menu = '';
  if (S.fr.cache && Array.isArray(S.fr.cache.friends)) { S.fr.cache.friends = S.fr.cache.friends.filter((f) => f.fid !== fid); markDirty(); }
  frSheet();
}
async function frBlock(fid, p) {
  const ok = await confirmIn(p, esc(tt('fr.block_ask', "They won't be able to add you again.")), esc(tt('fr.block', 'Block')), esc(tt('fr.keep', 'Keep them')));
  if (!ok) return;
  let r = null;
  try { r = await frApi('POST', '/friends/block', { fid }); } catch (e) { FR.offline = true; frSheet(); return; }
  if (!r || !r.ok) { toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad'); return; }
  FR.menu = '';
  if (S.fr.cache && Array.isArray(S.fr.cache.friends)) { S.fr.cache.friends = S.fr.cache.friends.filter((f) => f.fid !== fid); markDirty(); }
  frSheet();
}
async function frLeave(p) {
  const ok = await confirmIn(p, esc(tt('fr.leave_ask', 'Your code, friends list and yard snapshot will be deleted.')), esc(tt('fr.leave_yes', 'Leave Friends')), esc(tt('fr.stay', 'Stay')));
  if (!ok) return;
  let r = null;
  try { r = await frApi('POST', '/friends/leave', {}); } catch (e) { toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad'); return; }
  if (!r || !r.ok) { toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad'); return; }
  S.fr = {}; v219Fields(S); FR.pending = 0; FR.menu = ''; FR.yardAt = 0; markDirty(); try { saveNow(); } catch (e) { /* storage */ }
  frBadgeSync();
  const row = $('#frLeave', p); if (row && row.parentElement) row.parentElement.remove();
  toast(tt('fr.left', 'You left Friends. Your code is gone.'), 'good');
}
function frGuestNudge() {
  if (!CL.on || !CL.uid || !CL.anon || typeof clMeta !== 'function') return;
  const m = clMeta(); if (m.frNudged) return;
  clMetaSet({ frNudged: true }); // its own flag: the 3-care-day cloud nudge (clMeta.nudged) is a different moment
  setTimeout(() => { if (S && document.querySelector('.panel.frsheet')) toast(tt('cloud.nudge', "Make an account to keep {name} safe on every device. It's in Settings.", { name: NAME() }), 'gold'); }, 2000);
}
function frSheetBind(p) {
  const share = $('#frShare', p); if (share) share.onclick = () => { SFX.click(); frShare(); };
  const copy = $('#frCopy', p); if (copy) copy.onclick = () => { SFX.click(); frCopyText(S.fr.code || '', tt('fr.code_copied', 'Code copied')); };
  const neu = $('#frNew', p); if (neu) neu.onclick = () => { SFX.click(); frNewCode(p); };
  const add = $('#frAdd', p); if (add) add.onclick = () => { SFX.click(); frAdd(); };
  frBindBoxes(p);
  p.querySelectorAll('[data-fr]').forEach((b) => {
    b.onclick = () => {
      SFX.click();
      const row = b.closest('[data-fid]'), fid = row && row.dataset.fid;
      const act = b.dataset.fr;
      if (act === 'visit') { frVisit(fid); return; }
      if (act === 'gift') { toast(tt('fr.soon', 'Coming soon'), 'good'); return; }
      if (act === 'more') { FR.menu = FR.menu === fid ? '' : fid; frSheet(); return; }
      if (act === 'remove') frRemove(fid);
      if (act === 'block') frBlock(fid, p);
    };
  });
}
function frSheet() {
  if (!S) return null;
  v219Fields(S);
  const p = openModal(esc(tt('fr.title', 'Friends')), frSheetHTML(), { cls: 'frsheet' });
  frSheetBind(p);
  frGuestNudge();
  if (FR.invite) { const el = document.getElementById('frCh0'); if (el) el.focus({ preventScroll: true }); }
  return p;
}
async function frOpen() {
  if (!S || !frOn()) return false;
  v219Fields(S); frDay();
  if (!S.fr.fid) { frNameSheet(); return true; }
  await frLoad();
  frSheet();
  frInboxSoon(true); // once per open. a redraw of the same sheet does not ask again
  return true;
}
function frInviteTry() {
  if (!frOn() || !S || !FR.invite || FR.inviteShown) return;
  if (cur.mode !== 'yard' || (titleEl && !titleEl.hidden)) return; // never over a walk, a minigame or the title
  if (frGuideHold()) return;
  if (!modal.hidden) return;
  FR.inviteShown = true; FR.wantAdd = true; frOpen();
}

/* ---------- a friend's yard (V219.md section 4). Read-only: the save moves only in Bond and S.fr. ---------- */
function frFriend(fid) { return ((S && S.fr && S.fr.cache && S.fr.cache.friends) || []).find((f) => f && f.fid === fid) || null; }
function frSent(fid, kind) { const f = frFriend(fid); return !!(f && f.sent && f.sent[kind]); }
function frMarkSent(fid, kind) {
  const f = frFriend(fid); if (!f) return;
  if (!f.sent || typeof f.sent !== 'object') f.sent = { pet: false, note: false, gift: false, walk: false };
  if (f.sent[kind]) return;
  f.sent[kind] = true; markDirty();
}
function frDid(kind) { const v = FR.visit; return !!(v && ((v.did && v.did[kind]) || frSent(v.fid, kind))); }
function frDidSet(kind) { if (!FR.visit) return; FR.visit.did = FR.visit.did || {}; FR.visit.did[kind] = true; frMarkSent(FR.visit.fid, kind); }
function frYardOk(y) {
  return !!(y && y.v === 1 && ['spring', 'summer', 'autumn', 'winter'].includes(y.season) && Number.isInteger(y.house) && y.house >= 0 && y.house < FR_HOUSES.length && Array.isArray(y.dogs) && Array.isArray(y.decor));
}
function frCacheYard(fid, yard) {
  v219Fields(S);
  const prev = S.fr.yards[fid], next = { day: localISO(), yard };
  S.fr.yards[fid] = next;
  if (!prev || prev.day !== next.day || JSON.stringify(prev.yard) !== JSON.stringify(yard)) markDirty();
}
function frTidying(name) { toast(tt('fr.tidying', "{name}'s yard is still being tidied. Try again later.", { name: name || tt('fr.a_friend', 'A friend') }), ''); }
async function frVisit(fid) {
  if (!frOn() || !S || !fid || cur.mode === 'walk') return false;
  v219Fields(S); frDay();
  const name = frPairName((frFriend(fid) || {}).name) || tt('fr.a_friend', 'A friend');
  let r = null;
  try { r = await frApi('GET', '/friends/yard?fid=' + encodeURIComponent(fid)); } catch (e) { r = null; }
  if (!r || !r.ok) { toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad'); return false; }
  const yard = r.data && r.data.yard;
  if (!frYardOk(yard)) { frTidying(name); return false; }
  frCacheYard(fid, yard);
  FR.visit = { fid, name, yard, did: { pet: frSent(fid, 'pet'), note: frSent(fid, 'note') } };
  go('fryard');
  return true;
}
function frChipHTML() {
  const name = (FR.visit && FR.visit.name) || tt('fr.a_friend', 'A friend');
  return `<span class="pin"><svg viewBox="-10 -12 20 24"><path d="M0 11 C-3 4 -8 0 -8 -4 a8 8 0 0 1 16 0 c0 4 -5 8 -8 15z" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.8"/><circle cy="-4" r="3" fill="#FFFBF3" stroke="#5B3D32" stroke-width="1.4"/></svg></span><b class="pname">${esc(tt('fr.yard_chip', "{name}'s yard", { name }))}</b>`;
}
function frDecorSVG(decor) {
  const items = [];
  (decor || []).slice(0, 40).forEach((d) => {
    if (!d || !Number.isInteger(d.i) || !FR_DECOR[d.i] || typeof HM_DECOR === 'undefined' || !HM_DECOR[FR_DECOR[d.i]]) return;
    const n = FR_DECOR[d.i], wh = hoSize(n), x = Math.max(0, Math.min(1200, Math.round(Number(d.x)) || 0)), y = Math.max(0, Math.min(800, Math.round(Number(d.y)) || 0));
    items.push({ n, x, y, w: wh[0], h: wh[1], layer: hoLayer(n), b: y + wh[1] });
  });
  items.sort((a, b) => a.layer - b.layer || a.b - b.b);
  return `<g id="decorG" data-frdecor="1">${items.map((it) => `<g class="hm-decor" data-decor="${esc(it.n)}" data-x="${it.x}" data-y="${it.y}" pointer-events="none">${place(hmDecorArt(it.n), it.x, it.y, it.w, it.h)}</g>`).join('')}</g>`;
}
function frYardSVG(y) {
  const house = FR_HOUSES[y.house] || FR_HOUSES[0];
  return `<svg class="world" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice">
    ${sceneG('yard', { patch: 'empty', season: y.season })}${frDecorSVG(y.decor)}
    <g id="houseG" data-house="${esc(house)}" aria-hidden="true">${place(art('house', house), 620, 330, 240, 200)}</g>
    <g id="frDogs"></g><g id="frPawStamp" pointer-events="none"></g><g id="fx"></g></svg><div id="status"></div><div id="placeBtns"></div>`;
}
function frQuietHots() {
  const svg = $('svg.world', view); if (!svg) return;
  svg.querySelectorAll('[data-hot], [data-shop], #mailboxG, #bowlG, #secretX').forEach((el) => { el.style.pointerEvents = 'none'; el.removeAttribute('tabindex'); el.removeAttribute('role'); });
}
function frPawArt() {
  try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.paw === 'function') return P.FRIENDS.paw(); } catch (e) { /* art missing */ }
  return `<svg viewBox="-16 -16 32 32" aria-hidden="true">${doodle('paw', 0, 0, 1)}</svg>`; // TODO art
}
function frShowPaw() {
  const g = $('#frPawStamp'); if (!g || g.dataset.on) return;
  g.dataset.on = '1'; g.innerHTML = place(frPawArt(), 400, 470, 72, 72);
}
function frPlaceBtns() {
  const pb = $('#placeBtns'); if (!pb) return;
  const noted = frDid('note');
  pb.innerHTML = `<button class="btn fr-act" type="button" id="frNoteBtn">${esc(noted ? tt('fr.noted_today', 'Paw print left today') : tt('fr.leave_paw', 'Leave a paw print'))}</button><button class="btn yes fr-act" type="button" id="frHomeBtn">${esc(tt('fr.go_home', 'Go home'))}</button>`;
  const note = $('#frNoteBtn', pb); if (note) note.onclick = () => { SFX.click(); if (frDid('note')) return; frNoteSheet(); };
  const home = $('#frHomeBtn', pb); if (home) home.onclick = () => { SFX.click(); frGoHome(); };
}
function frNoteSheet() {
  if (!FR.visit || frDid('note') || cur.mode !== 'fryard') return null;
  const rows = FR_NOTES.map((line, i) => `<button class="btn fr-note" type="button" data-fri="${i}">${esc(tt('fr.note_' + i, line))}</button>`).join('');
  const p = openModal(esc(tt('fr.note_pick', 'Leave a paw print')), `<div class="fr-notes">${rows}</div>`, { cls: 'frsheet' });
  if (isPhone()) { p.style.position = 'fixed'; p.style.left = '0'; p.style.right = '0'; p.style.bottom = '96px'; p.style.maxHeight = 'calc(100dvh - 120px)'; p.style.margin = '0'; }
  p.querySelectorAll('[data-fri]').forEach((b) => { b.onclick = () => { SFX.click(); frSendNote(+b.dataset.fri, p); }; });
  return p;
}
async function frSendNote(i, p) {
  const v = FR.visit; if (!v || frDid('note') || cur.mode !== 'fryard' || !Number.isInteger(i) || i < 0 || i >= FR_NOTES.length) return false;
  const btns = p ? [...p.querySelectorAll('[data-fri]')] : [];
  btns.forEach((b) => { b.disabled = true; });
  let r = null;
  try { r = await frApi('POST', '/friends/send', { fid: v.fid, kind: 'note', data: { i } }); } catch (e) { r = null; }
  if (!r || !r.ok) {
    btns.forEach((b) => { b.disabled = false; });
    if (r && frErr(r) === 'limit') { frDidSet('note'); frShowPaw(); frPlaceBtns(); if (!modal.hidden) closeModal(); toast(tt('fr.noted_today', 'Paw print left today'), ''); return false; }
    toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad');
    return false;
  }
  v219Fields(S); S.fr.notes++; markDirty(); frDidSet('note');
  frShowPaw(); if (!modal.hidden) closeModal(); frPlaceBtns();
  toast(tt('fr.paw_left', 'Paw print left!'), 'good');
  return true;
}
function frSpots(n) {
  const z = typeof rmZone === 'function' ? rmZone('yard') : { x0: 80, x1: 920, y0: 430, y1: 560 };
  const x0 = isPhone() ? 340 : z.x0 + 30, x1 = isPhone() ? 680 : z.x1 - 30, out = [];
  for (let i = 0; i < n; i++) out.push([x0 + (i + 1) * (x1 - x0) / (n + 1), Math.min(z.y1 - 6, z.y0 + (z.y1 - z.y0) * (0.62 + (i % 2) * 0.22))]);
  return out;
}
function frXf(v) { return `translate(${f1(v.x)} ${f1(v.y)}) scale(${v.k.toFixed(3)}) translate(-430 -500)`; }
function frDogSVG(v) {
  const label = v.mine ? tt('fr.my_dog', '{name}, come along', { name: v.dog.name }) : tt('fr.pet_dog', '{name}. Tap to pet.', { name: v.dog.name });
  const tag = v.mine ? '' : `<g class="fr-tag" pointer-events="none" transform="translate(430 512)"><rect x="-44" y="-2" width="88" height="25" rx="8" fill="#FFF3DA" stroke="#5B3D32" stroke-width="2"/><text y="17" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="19" fill="#5B3D32">${esc(tt('cards.visitor_tag', 'visitor'))}</text></g>`;
  let art = '';
  try { art = place(dogSVG(v.dog, { pose: v.pose, outfit: v.dog.outfit, facing: v.face }), DX, DY, DW, DH); } catch (e) { art = ''; }
  return `<g class="frdog" data-fri="${v.i}" data-mine="${v.mine ? 1 : 0}" data-key="${esc(v.dog.key || '')}" tabindex="0" role="button" aria-label="${esc(label)}"><g class="fr-at" transform="${frXf(v)}"><rect class="fr-hit" x="${DX + 44}" y="${DY + 35}" width="${DW - 88}" height="180" fill="transparent"/><g class="fr-art">${art}</g>${tag}</g></g>`;
}
function frDogPaint(v) {
  const el = document.querySelector(`#frDogs [data-fri="${v.i}"]`); if (!el) return;
  const at = el.querySelector('.fr-at'); if (at) at.setAttribute('transform', frXf(v));
  const key = v.pose + '|' + v.face; if (key === v.drawn) return; v.drawn = key;
  const a = el.querySelector('.fr-art'); if (!a) return;
  try { a.innerHTML = place(dogSVG(v.dog, { pose: v.pose, outfit: v.dog.outfit, facing: v.face }), DX, DY, DW, DH); } catch (e) { /* the last pose stays */ }
}
function frDogsDraw() {
  const v = FR.visit, g = $('#frDogs'); if (!v || !g || !S || !S.dog) return;
  const dogs = [{ mine: true, dog: S.dog }];
  const card = { id: 'fry:' + v.fid, name: Array.isArray(v.yard.name) ? v.yard.name : [0, 0], dogs: (v.yard.dogs || []).slice(0, 5) };
  card.dogs.forEach((x, i) => { if (dogs.length >= 6 || typeof dcDog !== 'function') return; let d = null; try { d = dcDog(card, i); } catch (e) { d = null; } if (d) dogs.push({ mine: false, dog: d }); });
  const spots = frSpots(dogs.length);
  FR.roam = dogs.map((o, i) => { const d = { i, mine: o.mine, dog: o.dog, x: spots[i][0], y: spots[i][1], face: i % 2 ? 'left' : 'right', pose: 'idle', tw: null, wait: performance.now() + RINT(1200, 2800), drawn: 'idle|' + (i % 2 ? 'left' : 'right') }; d.k = (typeof rmScale === 'function' ? rmScale(d.y) : 0.9) * sizeK(d.dog); return d; });
  g.innerHTML = FR.roam.map(frDogSVG).join('');
  g.querySelectorAll('.frdog').forEach((el) => {
    const open = (e) => { if (e) e.stopPropagation(); const d = FR.roam[+el.dataset.fri]; if (d && !d.mine) frPet(d); };
    el.addEventListener('click', open);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); } });
  });
  frDogsLoop();
}
function frStep(v, now) {
  const z = typeof rmZone === 'function' ? rmZone('yard') : { x0: 80, x1: 920, y0: 430, y1: 560 };
  for (let n = 0; n < 8; n++) {
    const x = z.x0 + Math.random() * (z.x1 - z.x0), y = z.y0 + Math.random() * (z.y1 - z.y0);
    if (Math.hypot(x - v.x, y - v.y) < 36) continue;
    if (x > 610 && x < 870 && y > 330 && y < 540) continue; // the friend's house
    v.tw = { x0: v.x, y0: v.y, x1: x, y1: y, t0: now, dur: Math.max(400, (Math.hypot(x - v.x, y - v.y) / (typeof RM_WALK === 'number' ? RM_WALK : 150)) * 1000) };
    v.face = x < v.x ? 'left' : 'right'; v.pose = 'walk'; frDogPaint(v); return;
  }
  v.wait = now + 2000;
}
function frFrame(t) {
  FR.raf = 0; if (cur.mode !== 'fryard' || !$('#frDogs')) return;
  const wander = typeof rmWander === 'function' && rmWander();
  if (wander && modal.hidden) FR.roam.forEach((v) => {
    if (v.tw) {
      const w = v.tw, k = w.dur > 0 ? Math.min(1, (t - w.t0) / w.dur) : 1;
      v.x = w.x0 + (w.x1 - w.x0) * k; v.y = w.y0 + (w.y1 - w.y0) * k; v.k = (typeof rmScale === 'function' ? rmScale(v.y) : 0.9) * sizeK(v.dog);
      if (k >= 1) { v.tw = null; if (v.pose === 'walk') v.pose = 'idle'; v.wait = t + RINT(2200, 5200); }
      frDogPaint(v);
    } else if (t > (v.wait || 0) && v.pose !== 'happy') frStep(v, t);
  });
  FR.raf = requestAnimationFrame(frFrame);
}
function frDogsLoop() { if (!FR.raf) FR.raf = requestAnimationFrame(frFrame); }
function frDogsStop() { cancelAnimationFrame(FR.raf); FR.raf = 0; FR.roam = []; FR.petBusy = false; }
async function frPet(v) {
  if (!v || v.mine || cur.mode !== 'fryard' || !FR.visit) return;
  v.pose = 'happy'; v.drawn = ''; frDogPaint(v);
  const k = v.k || 1;
  try { fxText('♥', v.x, v.y - 170 * k); setTimeout(() => { if (cur.mode === 'fryard') fxText('♥', v.x + 18, v.y - 196 * k); }, 180); } catch (e) { /* the line still shows */ }
  try { say(persLine(v.dog), v.x, v.y - 20, 3200); } catch (e) { /* hearts are enough */ }
  try { SFX.bark((typeof BARK === 'object' && BARK[v.dog.key]) || 1); } catch (e) { /* quiet */ }
  setTimeout(() => { if (cur.mode === 'fryard' && v.pose === 'happy') { v.pose = 'idle'; v.drawn = ''; frDogPaint(v); } }, 4200);
  if (frDid('pet') || FR.petBusy) return;
  FR.petBusy = true;
  let r = null;
  try { r = await frApi('POST', '/friends/send', { fid: FR.visit.fid, kind: 'pet', data: {} }); } catch (e) { r = null; }
  FR.petBusy = false;
  if (!FR.visit || cur.mode !== 'fryard') return;
  if (!r || !r.ok) { if (r && frErr(r) === 'limit') frDidSet('pet'); return; }
  frDidSet('pet');
  v219Fields(S);
  if (S.fr.pets < 5) { addBond(1, { raw: true }); S.fr.pets++; markDirty(); }
}
function enterFrYard() {
  const v = FR.visit;
  if (!v || !frYardOk(v.yard)) return;
  setChrome(true, true);
  view.innerHTML = frYardSVG(v.yard);
  phHomeCx = 480; phCamHome = isPhone() ? 480 : 500; view.style.background = '';
  clearTimeout(phPanT); cancelAnimationFrame(camRaf); phPeekOn = false;
  view.style.removeProperty('--vfit'); view.style.removeProperty('--trayH'); phZoom = 1;
  camCx = phCamHome; camApply(camCx);
  const svg = $('svg.world', view);
  frQuietHots(); frDogsDraw(); frPlaceBtns(); if (frDid('note')) frShowPaw();
  const ms = $('#msBtn'); if (ms) ms.hidden = true;
  if (svg && typeof phCamPan === 'function') phCamPan(svg);
  if (isPhone()) { if (typeof phTrayFit === 'function') phTrayFit(); if (typeof phPeek === 'function') phPeek(); if (typeof phGnd === 'function') phGnd(); }
  onCleanup(() => { frDogsStop(); FR.visit = null; });
}
function frGoHome() {
  if (cur.mode !== 'fryard') return;
  go('yard');
  if (typeof msHudSync === 'function') msHudSync();
}
function frBackground() { if (cur.mode === 'fryard') frGoHome(); }

/* ---------- boot ---------- */
function frExpose() {
  if (!window.__paw || window.__paw.fr) return;
  window.__paw.fr = {
    on: () => frOn(), live: () => FR_LIVE, open: () => frOpen(),
    lists: () => ({ notes: FR_NOTES.slice(), gifts: FR_GIFTS.slice(), decor: FR_DECOR.slice(), houses: FR_HOUSES.slice() }),
    orderOk: () => {
      const food = FOOD.filter((f) => f.n !== 'Fresh Water').map((f) => f.n);
      const seeds = CROPS_FB.map((c) => c.seedItem), crops = CROPS_FB.map((c) => c.item);
      const want = food.concat(['Wild Berries', "Duck's Picnic Sandwich"], seeds, crops);
      const decor = Object.keys(HM_DECOR).filter((n) => (HM_DECOR[n].room || 'yard') === 'yard');
      return { gifts: FR_GIFTS.join('|') === want.join('|') && !FR_GIFTS.includes('Golden Bone') && !FR_GIFTS.includes('Fresh Water'), decor: FR_DECOR.join('|') === decor.join('|'), houses: FR_HOUSES.join('|') === HOUSES.map((h) => h.n).join('|'), notes: FR_NOTES.length === 12, n: { notes: FR_NOTES.length, gifts: FR_GIFTS.length, decor: FR_DECOR.length, houses: FR_HOUSES.length } };
    },
    lim: () => ({ notes: FR_NOTES.length, gifts: FR_GIFTS.length, decor: FR_DECOR.length, houses: FR_HOUSES.length }),
    yard: () => frYard(), pushYard: (force) => { if (force) FR.yardAt = 0; return frAfterPush(); },
    inbox: () => frInbox(), badge: () => frBadgeN(), migrate: (s) => v219Fields(s),
    note: (i) => FR_NOTES[i] || '', invite: () => FR.invite,
    visit: (fid) => frVisit(fid), home: () => frGoHome(), background: () => frBackground(),
    dogs: () => FR.roam.map((v) => ({ i: v.i, mine: !!v.mine, key: v.dog && v.dog.key, name: v.dog && v.dog.name, x: v.x, y: v.y, pose: v.pose }))
  };
}
frReadInvite();
on('game:ready', () => { frExpose(); frDay(); setTimeout(() => { frHudSync(); frInboxSoon(true); frInviteTry(); }, 300); });
on('yard:enter', () => setTimeout(frInviteTry, 400));
window.addEventListener('focus', () => frInboxSoon(false));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') frInboxSoon(false); else frBackground(); });
on('scene:redraw', () => { if (cur.mode !== 'fryard') return; frQuietHots(); if (frDid('note')) frShowPaw(); });
setInterval(() => { try { frExpose(); frDay(); frHudSync(); frInviteTry(); } catch (e) { /* a tick never breaks the game */ } }, 4000);
