/* ======================= v2.19 "Friends first": 50_friends.js (tag fr) =======================
   Friend codes and the Friends sheet (V219.md sections 0, 2, 3 and 8). Part 3 (section 4): yard visits (cur.mode 'fryard'), pets and paw-print
   notes, and the pet letters. Part 4 (section 5): gifts, one a day in all, from the bag (FR_GIFTS), and gift letters. Part 5 (section 6): walk together,
   a friend's dog from their snapshot joins the next walk (the route picker row, S.fr.guest), +10 coins for 2 friend walks a day, walk letters.
   Save field S.fr (v219Fields in 00_core.js). Test hook: window.__paw.fr.
   No typed text leaves the device: names are word indices, notes are FR_NOTES indices, dogs are Dog Card indices.
   Off until the v2.19 release (FR_LIVE). A test turns it on with prefs.frTest or window.__pawCloudMock. Never on the claude.ai artifact. */
const FR_LIVE = false; // the Game Manager turns this on at the v2.19 release
if (FR_LIVE) NEWS.unshift(NEWS_V219); // the v2.19 news entry (49c_news.js) appears with the release, never before
function frOn() {
  if (typeof clArtifact === 'function' && clArtifact()) return false;
  if (FR_LIVE && !navigator.webdriver) return true; // live, but still off under the test harness unless a test asks (V219 section 0)
  return !!(prefs.frTest || (typeof window !== 'undefined' && window.__pawCloudMock));
}
const FR = { pick: [0, 0], invite: null, inviteShown: false, wantAdd: false, offline: false, pending: 0, inAt: 0, yardAt: 0, menu: '', gen: 0, loadDay: '', sent: {} };

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
// the friend name in the language's order, and its two lines for the card: the joiner ("-" in de) stays at the end of the first line. A language that
// writes the two words with nothing between them (ja, zh, th) gets a zero-width space there, so a line may break between the words, never inside one (fit audit 3)
function frPairParts(pair) {
  if (!pair || DC_WORDS_A[pair[0]] == null || DC_WORDS_B[pair[1]] == null) return null;
  const a = dcWordA(pair[0]), b = dcWordB(pair[1]), m = tt('fr.name', '{a} {b}', { a: '\uE000', b: '\uE001' });
  const i = m.indexOf('\uE000'), j = m.indexOf('\uE001');
  if (i < 0 || j < 0) { const n = tt('fr.name', '{a} {b}', { a, b }); return { name: n, l1: n, l2: '' }; }
  const lo = Math.min(i, j), hi = Math.max(i, j), pre = m.slice(0, lo) + (i < j ? a : b), post = (i < j ? b : a) + m.slice(hi + 1), mid = m.slice(lo + 1, hi);
  return mid.trim() ? { name: pre + mid + post, l1: pre + mid.trim(), l2: post } : { name: pre + (mid || '\u200B') + post, l1: pre, l2: post };
}
function frPairName(pair) { const p = frPairParts(pair); return p ? p.name : ''; }
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
    if (q || hm) { // used once: a reload does not open Add again (code review 8)
      const u = new URL(location.href); u.searchParams.delete('friend');
      if (hm) u.hash = hash.replace(/(^|[?&])friend=[^&]*&?/, '$1').replace(/[?&]$/, '');
      history.replaceState(history.state, '', u.href);
    }
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
  // the save belongs to an account that is not logged in here (a log out, or a 401): never make a new guest for Friends (code review 1)
  if (typeof CL !== 'undefined' && !CL.uid && typeof clOwner === 'function' && clOwner()) throw new Error('offline');
  if (typeof clEnsureUser !== 'function' || !(await clEnsureUser())) throw new Error('offline');
  return clApi(method, path, body);
}
function frErr(r) { return (r && r.data && r.data.error) || (r && r.error && r.error.message) || ''; }

/* ---------- the yard snapshot (V219.md section 2). Indices only. Never a typed dog name. ---------- */
// a dog as a Dog Card dog { b, c, o, a, s, sp, n }, or null (a breed the cards do not know, or double merle)
function frCardOf(d) {
  if (!d || typeof dcDogOf !== 'function') return null;
  const x = dcDogOf(d);
  if (!x || !Number.isInteger(x.b) || x.b < 0) return null;
  if (x.c && x.c.M && x.c.M[0] === 'M' && x.c.M[1] === 'M') return null;
  return { b: x.b, c: x.c, o: x.o, a: x.a, s: x.s, sp: x.sp ? 1 : 0, n: x.n };
}
// the snapshot's dogs in order (the leader first, at most 5): { d: my dog, x: its card dog }. A walk letter's `dog` index points into this list
function frYardDogs() {
  const out = [], lead = S && S.dog;
  [lead].concat(((S && S.dogs) || []).filter((d) => d && lead && d.id !== lead.id)).forEach((d) => {
    if (out.length >= 5) return;
    const x = frCardOf(d); if (x) out.push({ d, x });
  });
  return out;
}
function frYard() {
  if (!S || !S.fr) return null;
  v219Fields(S);
  const dogs = frYardDogs().map((o) => o.x);
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
    const ids = frYardDogs().map((o) => o.d.id);
    return frApi('PUT', '/friends/yard', { yard }).then((r) => { if (!r || !r.ok) { FR.yardAt = 0; return false; } if (JSON.stringify(S.fr.snap) !== JSON.stringify(ids)) { S.fr.snap = ids; markDirty(); } return true; }).catch(() => { FR.yardAt = 0; return false; });
  } catch (e) { FR.yardAt = 0; return Promise.resolve(false); }
}

/* ---------- QR, drawn as pencil squares on the card's white tile. The card itself is never night-tinted. ---------- */
function frQRSVG(text, box) {
  let M = null;
  try { M = window.PawQR && typeof PawQR.matrix === 'function' ? PawQR.matrix(text) : null; } catch (e) { M = null; }
  if (!M || !M.length) return '';
  const n = M.length, q = 2, cells = n + q * 2, s = box.w / cells;
  let out = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (M[r][c]) {
    const x = box.x + (c + q) * s, y = box.y + (r + q) * s;
    out += `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${(s + 0.15).toFixed(2)}" height="${(s + 0.15).toFixed(2)}" fill="${INKG}"/>`;
  }
  return out;
}
// name: frPairParts() (or a plain string). The name is one line when it fits at 18 units, else its two words on two lines (fit audit 7, frFit)
function frCardSVG(code, parts) {
  const P = typeof parts === 'string' ? { name: parts, l1: '', l2: '' } : parts, name = P ? P.name : '';
  let svg = '';
  try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.card === 'function') svg = P.FRIENDS.card(code || ''); } catch (e) { svg = ''; }
  const box = (window.PawArt && PawArt.FRIENDS && PawArt.FRIENDS.cardQR) || { x: 34, y: 42, w: 116, h: 116 };
  const qr = code ? frQRSVG(frLinkOf(code), box) : '';
  const size = !name ? 22 : name.length > 16 ? 15 : name.length > 12 ? 18 : 22;
  const two = P && P.l1 && P.l2 ? ` data-l1="${esc(P.l1)}" data-l2="${esc(P.l2)}"` : '';
  const nm = name ? `<text class="fr-fit" data-max="108" data-fs="${size}"${two} x="222" y="104" text-anchor="middle" font-family="${FR_FONT}" style="font-family:${FR_FONT}" font-weight="700" font-size="${size}" fill="${INKG}">${esc(name)}</text>` : '';
  if (!svg) return `<div class="fr-codebig">${esc(code || '')}${qr ? `<svg viewBox="0 0 300 200">${qr}</svg>` : ''}</div>`; // TODO art
  return svg.replace(/<\/svg>\s*$/, qr + nm + '</svg>');
}
const FR_FONT = "'Caveat','DD Local Title','DD Local',cursive"; // the hand face, then the language's local faces (as world_b's FONT_L), never a system gothic.
// The <text>s carry it as an inline style too: world_b's `.pa-wb text` rule would beat the attribute (fit audit 1)
// a word wider than its room (data-max, in SVG units) steps its font size down, to 70% at most, and only then is squeezed. Short words keep their own width.
// A card name with two lines (data-l1, data-l2) that does not fit on one line at 18 units goes on two lines instead, one word each (fit audit 7)
const FR_TWO = { fs: 18, two: 15, y: [87, 103] }; // one line when it fits at 18; two lines at 15 sit in x 166..278, y 74..109 (Thai marks too), clear of the code on its line at y 136
const frLen = (el) => { try { return el.getComputedTextLength(); } catch (e) { return 0; } };
function frFitTwo(el, max) {
  const x = el.getAttribute('x'), fs = Math.min(+el.dataset.fs, FR_TWO.two);
  el.textContent = ''; el.setAttribute('font-size', fs);
  const ts = [el.dataset.l1, el.dataset.l2].map((s, k) => { const t = document.createElementNS('http://www.w3.org/2000/svg', 'tspan'); t.setAttribute('x', x); t.setAttribute('y', FR_TWO.y[k]); t.textContent = s; el.appendChild(t); return t; });
  const w = Math.max(...ts.map(frLen)); if (!(w > max)) return;
  el.setAttribute('font-size', (fs * Math.max(0.7, max / w)).toFixed(1));
  ts.forEach((t) => { if (frLen(t) > max) { t.setAttribute('textLength', max); t.setAttribute('lengthAdjust', 'spacingAndGlyphs'); } });
}
function frFit(root) {
  (root || document).querySelectorAll('text.fr-fit').forEach((el) => {
    const max = +el.dataset.max, fs = +el.dataset.fs; if (!max || !fs || typeof el.getComputedTextLength !== 'function') return;
    if (el.dataset.l2) { if (el.dataset.nm == null) el.dataset.nm = el.textContent; el.textContent = el.dataset.nm; }
    el.removeAttribute('textLength'); el.removeAttribute('lengthAdjust'); el.setAttribute('font-size', fs);
    let w = frLen(el);
    if (!(w > max)) return;
    if (el.dataset.l2 && w * Math.min(1, FR_TWO.fs / fs) > max) { frFitTwo(el, max); return; }
    const k = Math.max(0.7, max / w); el.setAttribute('font-size', (fs * k).toFixed(1));
    try { w = el.getComputedTextLength(); } catch (e) { w = 0; }
    if (w > max) { el.setAttribute('textLength', max); el.setAttribute('lengthAdjust', 'spacingAndGlyphs'); }
  });
}
function frFitSoon(root) { frFit(root); try { if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => frFit(root)); } catch (e) { /* no font loading API */ } }
function frWheelSVG(which, idx) {
  const words = which === 'a' ? DC_WORDS_A : DC_WORDS_B, show = which === 'a' ? dcWordA : dcWordB;
  const at = (k) => show((idx + k + words.length) % words.length);
  let frame = '';
  try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.wheel === 'function') frame = P.FRIENDS.wheel(); } catch (e) { frame = ''; }
  const tx = (id, y, word, size, op) => `<text id="${id}" class="fr-fit" data-max="106" data-fs="${size}" x="80" y="${y}" text-anchor="middle" font-family="${FR_FONT}" style="font-family:${FR_FONT}" font-weight="700" font-size="${size}" fill="${INKG}" opacity="${op}">${esc(word)}</text>`;
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
  if (kind === 'pet') svg = ICON('heart');
  if (!svg) svg = `<svg viewBox="-18 -18 36 36" aria-hidden="true">${doodle(kind === 'gift' ? 'bone' : kind === 'note' ? 'paw' : 'heart', 0, 2, 0.8)}</svg>`;
  return `<span class="fr-doo${on ? ' on' : ''}">${svg}</span>`;
}
function frHeadHTML(dog) {
  if (!dog || typeof dcDog !== 'function') return `<span class="fr-head fr-nohead" aria-hidden="true">${frIcon()}</span>`;
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
    FR.offline = false; FR.loadDay = frToday(); // the list's sent flags are for today
    if (r.data.me) frApplyMe(r.data.me);
    else if (S.fr.fid || S.fr.code) { S.fr.fid = null; S.fr.code = null; S.fr.name = null; S.fr.on = false; markDirty(); } // this login has no friend id: forget the old one (code review 1)
    frCache(Array.isArray(r.data.friends) ? r.data.friends : []);
    if (S.fr.cache.day !== FR.loadDay) { S.fr.cache.day = FR.loadDay; markDirty(); } // part 5: the day the friends' snapshot dogs were fetched (the walk row asks once a day)
    return r.data;
  } catch (e) { FR.offline = true; return null; }
}

/* ---------- inbox: notes become postcard letters, a day's pets one letter, gifts mailbox gift letters (at most 5 a day), walks walk letters (at most 3 a day), and those are claimed. The rest count on the badge. ---------- */
const FR_PET_MAX = 5; // Bond from pets: at most 5 friends petted (S.fr.pets) and 5 claimed pets (S.fr.gotPets) a day
function frPetText(m) {
  const who = m.frPets.who, name = frPairName(who[0]) || tt('fr.a_friend', 'A friend'), more = who.length - 1;
  const by = more > 0 ? tt('fr.pet_who_more', '{name} and {n, plural, one {# friend} other {# friends}}', { name, n: more }) : name;
  m.title = tt('fr.pet_title', 'A visit from {who}', { who: by });
  m.text = tt('fr.pet_text', '{who} visited and petted {dog}.{bond, plural, =0 {} other { +# Bond}}', { who: by, dog: m.frPets.dog, bond: m.frPets.bond });
}
// every pet of one day goes into one letter (fr_pet_<day>): a later look that day adds the new friends to it and opens it again
// (the letter keeps the event ids it holds, so an event that comes back because its claim did not reach the Worker gives no second Bond)
function frPetLetter(day, list) {
  if (typeof mailPush !== 'function') return;
  if (typeof mailFields === 'function') mailFields();
  const id = 'fr_pet_' + day, old = (S.mail || []).find((x) => x && x.id === id);
  const m = old || { kind: 'postcard', id, from: '', frPets: null };
  if (!m.frPets || !Array.isArray(m.frPets.ids)) m.frPets = { who: [], fids: [], ids: [], dog: NAME(), bond: 0 };
  const fresh = list.filter((ev) => !m.frPets.ids.includes(ev.id));
  if (!fresh.length) return;
  let bond = 0;
  fresh.forEach((ev) => {
    m.frPets.ids.push(ev.id);
    if (S.fr.gotPets < FR_PET_MAX) { S.fr.gotPets++; bond++; } // each claimed pet: +1 Bond, at most 5 a day. Extra pets give the letter only
    const fid = ev.from.fid; if (!fid || m.frPets.fids.includes(fid)) return;
    m.frPets.fids.push(fid); m.frPets.who.push(Array.isArray(ev.from.name) ? ev.from.name.slice(0, 2) : [0, 0]);
  });
  if (bond) addBond(bond, { raw: true });
  m.frPets.bond += bond;
  m.from = frPairName(m.frPets.who[0]) || tt('fr.a_friend', 'A friend');
  frPetText(m);
  if (!old) { mailPush(m); return; }
  old.read = false; markDirty();
  if (typeof mailboxRefresh === 'function') mailboxRefresh();
}
async function frInbox() {
  if (!frOn() || !S) return;
  v219Fields(S);
  if (!S.fr.fid) return;
  let r = null;
  try { r = await frApi('GET', '/friends/inbox'); } catch (e) { return; }
  if (!r || !r.ok || !r.data || !Array.isArray(r.data.events)) return;
  frDay();
  const claim = [], pets = {};
  r.data.events.forEach((ev) => {
    if (!ev || ev.kind !== 'pet' || !ev.from || typeof ev.day !== 'string') return;
    (pets[ev.day] = pets[ev.day] || []).push(ev);
    claim.push(ev.id);
  });
  Object.keys(pets).sort().forEach((day) => frPetLetter(day, pets[day]));
  if (claim.length) markDirty();
  r.data.events.forEach((ev) => {
    if (!ev || ev.kind !== 'note') return;
    const i = ev.data && ev.data.i;
    if (!Number.isInteger(i) || i < 0 || i >= FR_NOTES.length) return;
    const name = frPairName(ev.from && ev.from.name) || tt('fr.a_friend', 'A friend');
    if (typeof mailPush === 'function') mailPush({ kind: 'postcard', id: 'fr_note_' + ev.id, from: name, title: tt('fr.note_title', 'A paw print from {name}', { name }), text: tdata('fr_notes.' + i, FR_NOTES[i]), frPaw: true });
    claim.push(ev.id);
  });
  const gave = frGiftLetters(r.data.events, claim) + frWalkLetters(r.data.events, claim);
  FR.pending = r.data.events.filter((ev) => ev && !claim.includes(ev.id)).length;
  frBadgeSync();
  if (gave) { try { saveNow(); } catch (e) { /* storage */ } } // the gift and walk letters are saved on this device before the Worker hears the claim
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
  frFit(document.querySelector('.fr-wheels'));
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
  frNameBind(p); frFitSoon(p); return p;
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
  return `<div class="fr-row" data-fid="${esc(f.fid)}">${frHeadHTML(f.dogs && f.dogs[0])}<span class="fr-nm">${esc(name)}</span><span class="fr-doos" aria-hidden="true">${frDoodle('pet', !!s.pet)}${frDoodle('note', !!s.note)}${frDoodle('gift', !!s.gift)}</span><span class="fr-rowacts"><button class="btn" type="button" data-fr="visit">${esc(tt('fr.visit', 'Visit'))}</button>${frGiftBtnHTML('', 'data-fr="gift"', tt('fr.gift', 'Gift'))}<button class="btn" type="button" data-fr="more" aria-label="${esc(tt('fr.more_aria', 'More for {name}', { name }))}">...</button></span>${FR.menu === f.fid ? `<span class="fr-pop"><button class="btn" type="button" data-fr="remove">${esc(tt('fr.remove', 'Remove friend'))}</button><button class="btn" type="button" data-fr="block">${esc(tt('fr.block', 'Block'))}</button></span>` : ''}</div>`;
}
function frSheetHTML() {
  v219Fields(S);
  const parts = frPairParts(S.fr.name), code = S.fr.code || '';
  const friends = frSorted((S.fr.cache && S.fr.cache.friends) || []);
  const off = FR.offline ? `<p class="fr-off" id="frOff">${esc(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'))}</p>` : '';
  const list = friends.length ? friends.map(frRowHTML).join('') : `<p class="small">${esc(tt('fr.none', 'No friends yet. Share your code, or add one below.'))}</p>`;
  return `<div class="fr-sheet">${off}<div class="fr-card" id="frCard">${frCardSVG(code, parts)}</div><div class="fr-acts"><button class="btn yes" type="button" id="frShare">${esc(tt('fr.share', 'Share invite'))}</button><button class="btn" type="button" id="frCopy">${esc(tt('fr.copy', 'Copy code'))}</button><button class="btn" type="button" id="frNew">${esc(tt('fr.new_code', 'New code'))}</button></div><h3 class="fr-h">${esc(tt('fr.add_title', 'Add a friend'))}</h3>${frBoxesHTML()}<h3 class="fr-h">${esc(tt('fr.list_title', 'Friends'))}</h3><div class="fr-list" id="frList">${list}</div></div>`;
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
// Remove waits FR_UNDO_MS with an Undo on the toast; only then does the Worker hear it (phone review 9). Quiet either way
const FR_UNDO_MS = TOAST_MS + 300; // the Undo stays tappable while its toast shows
const frSheetIfOpen = () => { if (!modal.hidden && modal.querySelector('.fr-sheet')) frSheet(); };
// while a sheet is open the Undo toast sits under the sheet (or over it) on a wide screen when there is room, else (and on phones, where the bar and
// the place buttons sit around the sheet) at the sheet's foot, so the title and the top row's
// Visit and Gift stay clear (fit audit 4).
// Layout boxes (offsetTop), as toastSheetTop, so the sheet's slide-in transform and the desktop stage scale don't move it
function frUndoPlace() {
  const pn = modal.hidden ? null : modal.querySelector('.panel'); if (!pn) return;
  let top = 0; for (let e = pn; e && e !== stage; e = e.offsetParent) top += e.offsetTop;
  const h = toasts.offsetHeight, H = stage.clientHeight, end = top + pn.offsetHeight;
  const wide = !isPhone(), y = Math.max(6, Math.round(wide && end + 8 + h <= H - 6 ? end + 8 : wide && top - 8 - h >= 6 ? top - 8 - h : Math.min(end, H) - h - 14));
  toasts.style.top = y + 'px'; toasts.style.bottom = 'auto'; toasts.style.flexDirection = ''; toasts.style.setProperty('--toastTop', y + 'px');
}
function frRemove(fid) {
  const list = (S.fr.cache && S.fr.cache.friends) || [], f = list.find((x) => x && x.fid === fid); if (!f) return;
  const at = list.indexOf(f), name = frPairName(f.name) || tt('fr.a_friend', 'A friend');
  FR.menu = ''; S.fr.cache.friends = list.filter((x) => x !== f); markDirty(); frSheet();
  let undone = false;
  const t = toast(tt('fr.removed', '{name} is off your list.', { name }), 'good');
  if (t) {
    t.classList.add('fr-undo'); t.insertAdjacentHTML('beforeend', ` <button class="btn" type="button">${esc(tt('fr.undo', 'Undo'))}</button>`);
    frUndoPlace();
    const b = t.querySelector('button'); b.onclick = (e) => {
      e.stopPropagation(); SFX.click(); undone = true; t.remove();
      const now = (S.fr.cache && S.fr.cache.friends) || [];
      if (!now.some((x) => x && x.fid === fid)) { now.splice(Math.min(at, now.length), 0, f); S.fr.cache.friends = now; markDirty(); }
      frSheetIfOpen();
    };
  }
  setTimeout(async () => {
    if (undone) return;
    let r = null;
    try { r = await frApi('POST', '/friends/remove', { fid }); } catch (e) { r = null; }
    if (r && r.ok) return;
    const now = (S.fr.cache && S.fr.cache.friends) || []; // not removed after all (offline): the row comes back
    if (!now.some((x) => x && x.fid === fid)) { now.splice(Math.min(at, now.length), 0, f); S.fr.cache.friends = now; markDirty(); }
    toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad'); frSheetIfOpen();
  }, FR_UNDO_MS);
}
async function frBlock(fid, p) {
  const f = frFriend(fid), name = frPairName(f && f.name) || tt('fr.a_friend', 'A friend');
  const ok = await confirmIn(p, esc(tt('fr.block_ask_name', "Block {name}? They won't be able to add you again.", { name })), esc(tt('fr.block', 'Block')), esc(tt('fr.keep', 'Keep them')));
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
  const o = S.fr, keep = { day: o.day, pets: o.pets, gotPets: o.gotPets, notes: o.notes, gift: o.gift, gotGifts: o.gotGifts, walkDay: o.walkDay, walks: o.walks, gotWalks: o.gotWalks, walked: o.walked, gotIds: o.gotIds };
  S.fr = keep; v219Fields(S); FR.pending = 0; // today's caps stay: leave and add again earns nothing twice (code review 5) FR.menu = ''; FR.yardAt = 0; markDirty(); try { saveNow(); } catch (e) { /* storage */ }
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
  frRowsBind(p);
}
function frRowsBind(p) {
  p.querySelectorAll('[data-fr]').forEach((b) => {
    b.onclick = () => {
      SFX.click();
      const row = b.closest('[data-fid]'), fid = row && row.dataset.fid, P = b.closest('.panel') || p;
      const act = b.dataset.fr;
      if (act === 'visit') { frVisit(fid); return; }
      if (act === 'gift') { const b = P.querySelector('.panel-body'); FR.listTop = b ? b.scrollTop : 0; frGiftSheet(fid, 'list'); return; }
      if (act === 'more') { const was = FR.menu; FR.menu = FR.menu === fid ? '' : fid; frRowPatch(P, was); frRowPatch(P, fid); frPopShow(P); return; }
      if (act === 'remove') frRemove(fid);
      if (act === 'block') frBlock(fid, P);
    };
  });
}
// one row redrawn where it is (the "..." menu): no pop-in, the scroll stays
function frRowPatch(p, fid) {
  if (!p || !fid) return;
  const row = [...p.querySelectorAll('.fr-row')].find((r) => r.dataset.fid === fid), f = frFriend(fid);
  if (!row || !f) return;
  const box = document.createElement('div'); box.innerHTML = frRowHTML(f);
  const nu = box.firstElementChild; row.replaceWith(nu); frRowsBind(nu);
}
function frPopShow(p) { const pop = p && p.querySelector('.fr-pop'); if (pop && pop.scrollIntoView) pop.scrollIntoView({ block: 'nearest' }); }
function frSheet() {
  if (!S) return null;
  v219Fields(S);
  const open = !modal.hidden && modal.querySelector('.panel.frsheet .fr-sheet'), body = open && open.closest('.panel-body');
  if (body) { // the sheet is up: patch it in place (no pop-in replay, the scroll stays where it was)
    const p = body.closest('.panel'), top = body.scrollTop, c = p.querySelector('.confirm'); if (c) c.remove();
    body.innerHTML = frSheetHTML(); body.scrollTop = top;
    frSheetBind(p); frFitSoon(p); frPopShow(p);
    return p;
  }
  const back = FR.back; FR.back = null;
  const p = openModal(esc(tt('fr.title', 'Friends')), frSheetHTML(), { cls: 'frsheet' + (back ? ' fr-back' : '') });
  if (back) { p.classList.remove('pop'); const b = p.querySelector('.panel-body'); if (b) b.scrollTop = back.top; } // back from the gift sheet: where the list was
  frSheetBind(p); frFitSoon(p);
  frGuestNudge();
  if (FR.invite) { const el = document.getElementById('frCh0'); if (el) el.focus({ preventScroll: true }); }
  return p;
}
async function frOpen() {
  if (!S || !frOn()) return false;
  v219Fields(S); frDay();
  if (!S.fr.fid) { frNameSheet(); return true; }
  const got = await frLoad();
  if (got && !S.fr.fid) { frNameSheet(); return true; } // a different login: pick a name for this one
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

/* ---------- part 3: a friend's yard (V219.md section 4). Read-only: it draws their snapshot and changes nothing in this save but Bond and S.fr ----------
   cur.mode 'fryard' (go() in 00_core.js). The scene is its own: their house, their decor at their spots and their season, their dogs roaming as Dog Card
   visitors do (dcDog, the same art and scale) and my leader along. No garden, mailbox, missions, shop doors, decorating or care: the bar's Map goes home. */
const FRV = { fid: '', pair: null, yard: null, card: null, dogs: [], raf: 0, last: 0, chk: 0, crop: null, busy: '', fit: 1, gr: null };
const FR_VISIT_FROM = ['yard', 'fryard', 'map', 'market', 'shelter', 'japan']; // a walk, a game or the garden finishes first
const FR_STAMP = [452, 540, 60, 60]; // the paw stamp on the yard path (x, y, w, h)
const FR_HOUSE_AT = [620, 330, 240, 200]; // where the yard draws the house (03_yard.js)
const frToday = () => jstISO(); // Japan days, as the Worker counts them (code review 3)
const frFriend = (fid) => ((S && S.fr && S.fr.cache && S.fr.cache.friends) || []).find((f) => f && f.fid === fid) || null;
function frSentToday(fid, kind) {
  if (FR.sent[fid + ':' + kind] === frToday()) return true;
  const f = frFriend(fid);
  return FR.loadDay === frToday() && !!(f && f.sent && f.sent[kind]);
}
function frMarkSent(fid, kind) {
  FR.sent[fid + ':' + kind] = frToday();
  const f = frFriend(fid);
  if (f) { if (!f.sent || typeof f.sent !== 'object') f.sent = {}; if (!f.sent[kind]) { f.sent[kind] = true; markDirty(); } } // the row's doodle fills in
}
// a snapshot from the Worker, checked again here: only indices this copy knows are drawn
function frYardClean(y) {
  if (!y || typeof y !== 'object') return null;
  const okXY = (v) => Number.isFinite(Number(v));
  const dogs = (Array.isArray(y.dogs) ? y.dogs : []).filter((d) => d && typeof d === 'object' && Number.isInteger(d.b) && Number.isInteger(d.n)).slice(0, 5);
  const decor = (Array.isArray(y.decor) ? y.decor : []).filter((d) => d && Number.isInteger(d.i) && FR_DECOR[d.i] && typeof HM_DECOR !== 'undefined' && HM_DECOR[FR_DECOR[d.i]] && okXY(d.x) && okXY(d.y)).slice(0, 40)
    .map((d) => ({ n: FR_DECOR[d.i], x: clamp(Number(d.x), 0, 1200), y: clamp(Number(d.y), 0, 800) }));
  return {
    name: Array.isArray(y.name) ? y.name.slice(0, 2) : null,
    house: Number.isInteger(y.house) && FR_HOUSES[y.house] ? FR_HOUSES[y.house] : FR_HOUSES[0],
    season: SEASONS.includes(y.season) ? y.season : seasonNow(),
    dogs, decor
  };
}
// the cache: S.fr.yards[fid] = { day, yard }. Only today's visits stay (a snapshot can be 16 KB)
function frYardKeep(fid, yard) {
  const day = frToday(), ys = S.fr.yards;
  Object.keys(ys).forEach((k) => { if (!ys[k] || ys[k].day !== day) delete ys[k]; });
  ys[fid] = { day, yard }; markDirty();
}
async function frVisit(fid) {
  if (!S || !frOn() || !fid) return false;
  v219Fields(S); frDay();
  if (!FR_VISIT_FROM.includes(cur.mode)) { toast(tt('fr.visit_later', 'Finish this first, then visit.'), 'good'); return false; }
  if (FRV.busy === 'visit') return false;
  const f = frFriend(fid), name = frPairName(f && f.name) || tt('fr.a_friend', 'A friend');
  FRV.busy = 'visit';
  let r = null;
  try { r = await frApi('GET', '/friends/yard?fid=' + encodeURIComponent(fid)); } catch (e) { r = null; }
  FRV.busy = '';
  let raw = null;
  if (r && r.ok && r.data && 'yard' in r.data) {
    if (!r.data.yard) { toast(tt('fr.tidying', "{name}'s yard is still being tidied. Try again later.", { name }), 'good'); return false; }
    raw = r.data.yard; frYardKeep(fid, raw);
  } else if (r && r.status === 404) { toast(tt('fr.not_friend', 'That friend is not on your list any more.'), ''); return false; }
  else {
    const c = S.fr.yards[fid]; // offline: today's copy, if there is one
    if (!c || !c.yard) { toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad'); return false; }
    raw = c.yard;
  }
  const yard = frYardClean(raw); if (!yard) return false;
  if (FR.loadDay !== frToday()) await frLoad(); // the sent flags are today's
  FRV.fid = fid; FRV.yard = yard; FRV.pair = (f && f.name) || yard.name;
  FRV.card = { id: 'fr:' + fid, name: FRV.pair || [0, 0], dogs: yard.dogs };
  if (!modal.hidden) closeModal();
  go('fryard');
  return true;
}
function frHome() { if (cur.mode === 'fryard') go('yard'); }
function frBarAct(a) {
  if (a === 'map') { SFX.click(); frHome(); return true; }
  if (['walk', 'feed', 'play', 'care', 'wardrobe', 'journal'].includes(a)) { SFX.click(); toast(tt('fr.visit_inert', 'You are visiting. Go home first.'), 'good'); return true; }
  return false;
}
// a yard decoration as the yard draws it (hmDecorArt), but never with my own family photo in the frame
function frDecorArt(n) {
  const D = HM_DECOR[n], glows = D.lit || D.prop === 'hwlanterns', lit = glows && isNight(), a = glows ? art('prop', D.prop, { lit }) : art('prop', D.prop);
  return `<svg viewBox="0 0 ${D.vb[0]} ${D.vb[1]}" xmlns="http://www.w3.org/2000/svg">${place(propTint(a, lit, false), 0, 0, D.vb[0], D.vb[1])}</svg>`;
}
function frDecorSVG(list) {
  const rows = list.map((d, i) => { const at = HM_DECOR[d.n].at; return { d, i, w: at[2], h: at[3], l: hoLayer(d.n) }; });
  rows.sort((a, b) => a.l - b.l || (a.l === 2 ? a.d.y + a.h - (b.d.y + b.h) : 0) || a.i - b.i); // wall, flat, then by the bottom edge (hoOrder)
  return rows.map((o) => `<g class="fr-decor" data-frdecor="${esc(o.d.n)}">${place(frDecorArt(o.d.n), o.d.x, o.d.y, o.w, o.h)}</g>`).join('');
}
function frStampSVG() {
  let svg = '';
  try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.paw === 'function') svg = P.FRIENDS.paw(); } catch (e) { svg = ''; }
  const [x, y0, w, h] = FR_STAMP, y = isPhone() ? y0 - 70 : y0;
  if (!svg) return `<g class="fr-stamp">${doodle('paw', x + w / 2, y + h / 2, 1.4)}</g>`; // TODO art
  return `<g class="fr-stamp">${place(propTint(svg, false, false), x, y, w, h)}</g>`;
}
function frYardSVG(y) {
  const stamp = frSentToday(FRV.fid, 'note') ? frStampSVG() : '';
  return `<svg class="world" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice">${sceneG('yard', { patch: 'empty', season: y.season })}<g id="frDecorG" pointer-events="none">${frDecorSVG(y.decor)}</g>`
    + `<g id="houseG" class="fr-house${isNight() ? ' night' : ''}" pointer-events="none" aria-hidden="true">${place(art('house', y.house), ...FR_HOUSE_AT)}</g><g id="frStampG" pointer-events="none">${stamp}</g>`
    + `<g id="frDogs"></g><g id="fx"></g></svg><div id="status"></div><div id="placeBtns" class="fr-pbtns"></div>`;
}
function frNoteBtnHTML() {
  const done = frSentToday(FRV.fid, 'note');
  return `<button class="btn${done ? ' soon' : ' yes'}" type="button" id="frNoteBtn"${done ? ' aria-disabled="true"' : ''}>${esc(done ? tt('fr.paw_done', 'Paw print left today') : tt('fr.paw_leave', 'Leave a paw print'))}</button>`;
}
function frBtns() {
  const pb = $('#placeBtns'); if (!pb) return;
  pb.innerHTML = frNoteBtnHTML() + frGiftBtnHTML('frGiftBtn', '', tt('fr.gift_send', 'Send a gift')) + `<button class="btn" type="button" id="frHomeBtn">${esc(tt('yard.go_home', 'Go home'))}</button>`;
  $('#frNoteBtn', pb).onclick = () => { SFX.click(); if (!frSentToday(FRV.fid, 'note')) frNoteSheet(); };
  $('#frGiftBtn', pb).onclick = () => { SFX.click(); frGiftSheet(FRV.fid, 'yard'); };
  $('#frHomeBtn', pb).onclick = () => { SFX.click(); frHome(); };
}
// the place chip says "<name>'s yard" (the core writes the chip: the name is put back after every rewrite, as the Tokyo map does)
function frChip() {
  const st = $('#status'); if (!st) return;
  const nm = tt('fr.yard_of', "{name}'s yard", { name: frPairName(FRV.pair) || tt('fr.a_friend', 'A friend') });
  const fix = () => { const n = st.querySelector('.pname'); if (cur.mode === 'fryard' && n && n.textContent !== nm) n.textContent = nm; };
  fix(); const mo = new MutationObserver(fix); mo.observe(st, { childList: true }); onCleanup(() => mo.disconnect());
}
// phones: the camera rests on the house and the middle of the yard; a drag pans the whole yard and the look-left button (#phPeek) shows
// the rest of their decor and back (phone review 3). Desktop shows the whole yard
const FRC = { x: 0, w: 1000, home: 0, raf: 0 };
function frCamSet(x) {
  const svg = $('#view > svg.world'); if (!svg) return;
  FRC.x = clamp(x, 0, 1000 - FRC.w); svg.setAttribute('viewBox', `${FRC.x.toFixed(1)} 0 ${FRC.w.toFixed(1)} 600`);
}
function frCamTo(x, secs) {
  cancelAnimationFrame(FRC.raf); const x0 = FRC.x, x1 = clamp(x, 0, 1000 - FRC.w), t0 = performance.now(), ms = (secs || 0) * 1000;
  if (!ms || motionOff()) { frCamSet(x1); frScan(); return; }
  const step = (t) => { const k = Math.min(1, (t - t0) / ms), e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; frCamSet(x0 + (x1 - x0) * e); if (k < 1) FRC.raf = requestAnimationFrame(step); else frScan(); };
  FRC.raf = requestAnimationFrame(step);
}
function frCam() {
  const svg = $('#view > svg.world'); if (!svg) return;
  const vw = svg.clientWidth || view.clientWidth, vh = svg.clientHeight || view.clientHeight;
  if (!isPhone() || !vw || !vh) { FRC.w = 1000; FRC.home = 0; frCamSet(0); return; }
  FRC.w = Math.min(1000, 600 * vw / vh); FRC.home = clamp(590 - FRC.w / 2, 0, 1000 - FRC.w); // the house's door near the right edge, the open yard to its left
  frCamSet(FRC.home);
}
const frCamAway = () => Math.abs(FRC.x - FRC.home) > 40;
function frPan(svg) {
  if (!isPhone() || FRC.w >= 1000) return;
  const b = document.createElement('button'); b.type = 'button'; b.className = 'iconbtn ph-peek fr-peek'; b.id = 'phPeek'; view.appendChild(b);
  b.innerHTML = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M19 12 Q29 22 31 24 Q28 28 19 36" fill="none" stroke="#5B3D32" stroke-width="4.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M21 11 Q31 21 33 24" fill="none" stroke="#F28FA5" stroke-width="2" stroke-linecap="round" opacity=".7"/></svg>';
  const sync = () => { const a = frCamAway(); b.classList.toggle('back', a); const l = a ? tt('fr.look_back', 'Look back at the house') : tt('fr.look_left', 'Look around the yard'); if (b.getAttribute('aria-label') !== l) b.setAttribute('aria-label', l); };
  b.onclick = () => { SFX.click(); frCamTo(frCamAway() ? FRC.home : 0, 0.7); setTimeout(sync, 750); };
  let x0 = null, c0 = 0, id = null, on = false, swallow = false;
  svg.addEventListener('click', (e) => { if (swallow) { swallow = false; e.stopPropagation(); e.preventDefault(); } }, true);
  svg.addEventListener('pointerdown', (e) => { swallow = false; if (x0 != null) return; x0 = e.clientX; c0 = FRC.x; id = e.pointerId; on = false; });
  svg.addEventListener('pointermove', (e) => {
    if (x0 == null || e.pointerId !== id) return; const dx = e.clientX - x0;
    if (!on) { if (Math.abs(dx) < 10) return; on = true; cancelAnimationFrame(FRC.raf); try { svg.setPointerCapture(id); } catch (er) { /* none */ } }
    frCamSet(c0 - dx * FRC.w / (svg.clientWidth || view.clientWidth || 1));
  });
  const end = (e) => { if (x0 == null || e.pointerId !== id) return; x0 = null; if (!on) return; on = false; swallow = true; setTimeout(() => { swallow = false; }, 400); frScan(); sync(); };
  svg.addEventListener('pointerup', end); svg.addEventListener('pointercancel', end);
  sync(); onCleanup(() => cancelAnimationFrame(FRC.raf));
}
/* the dogs: the friend's (up to 5, Dog Card visitors' art and scale) and my leader. Under the harness they stand still unless prefs.rmTest (rmWander).
   Owner's rule (2 Nov 2026): no dog is drawn over another. Each dog's drawn box is measured once per visit, per pose (frMeasure), and every spot keeps
   that box clear of the others' (frClash). Two rows may stack only when the dog behind is covered at its legs at most (FR_LEGS). A phone that cannot
   fit them all keeps the rest of the pack off to the side of its crop, where the look-around button shows them (frDrawDogs) */
const frK = (v, y) => RM_BASE * clamp(1 + (y - 500) * RM_DEPTH, 0.86, 1.12) * sizeK(v.dog) * (isPhone() ? 0.84 : 1) * (FRV.fit || 1); // a phone shows ~360 world units beside the house: a little smaller there (and FRV.fit, when even that is too big for the greeting pair)
const frTap = (x, y, k) => [x - 88 * k, y - 170 * k, 176 * k, 180 * k]; // the dog's tap rect (dc-hit) at feet x, y
const frOver = (a, b) => Math.max(0, Math.min(a[0] + a[2], b[0] + b[2]) - Math.max(a[0], b[0])) * Math.max(0, Math.min(a[1] + a[3], b[1] + b[3]) - Math.max(a[1], b[1]));
const FR_REST = ['idle', 'sit', 'happy', 'walk'], FR_PLAY = ['sniff', 'bow', 'jump']; // the poses a visit draws; the greeting pair also plays
const FR_LEGS = 0.3, FR_ROW = 40; // a dog at least FR_ROW behind another may hide the bottom FR_LEGS of its drawn box (its legs and feet) behind it, no more
const frU = (a, b) => (a ? [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[2], b[2]), Math.max(a[3], b[3])] : b.slice());
// what a dog must keep clear of, in world units: the chip, the buttons, the bar (phones) and the edges of what the camera shows
function frScan() {
  const svg = $('#view > svg.world'), M = svg && svg.getScreenCTM(); if (!M) { FRV.crop = { x0: 60, x1: 940, y1: 590, boxes: [], feet: [] }; return; }
  const inv = M.inverse(), toW = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; return p.matrixTransform(inv); };
  const vr = view.getBoundingClientRect(), a = toW(vr.left, vr.top), b = toW(vr.right, vr.bottom);
  const boxes = [];
  ['#placeBtns .btn', '#status', '#bar:not([hidden])', '#ddWish:not([hidden])', '#phPeek'].forEach((sel) => document.querySelectorAll(sel).forEach((el) => {
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
    const p = toW(r.left - 6, r.top - 6), q = toW(r.right + 6, r.bottom + 6); boxes.push([p.x, p.y, q.x - p.x, q.y - p.y]);
  }));
  const feet = []; // the scene's own spots (the veggie patch, the mailbox post): inert here, but the dogs keep their feet off them as at home
  svg.querySelectorAll('#sceneG [data-hot]').forEach((el) => { const r = el.getBoundingClientRect(); if (!r.width) return; const p = toW(r.left, r.top), q = toW(r.right, r.bottom); feet.push([p.x - 8, p.y - 8, q.x - p.x + 16, q.y - p.y + 16]); });
  FRV.crop = { x0: Math.max(0, a.x), x1: Math.min(1000, b.x), y1: Math.min(590, b.y - 6), boxes, feet };
}
// each dog's drawn box per pose and way it faces, in its own units around the feet (430, 500): drawn hidden all at once, then measured. Facing
// left is the mirror image unless the pose has words (the sniff: words are not mirrored), then it is measured too. Kept for later visits (FR_EXT_MEMO)
const FR_EXT_MEMO = new Map(), FR_WORDS = 10;
const frFontsIn = () => { try { return !document.fonts || document.fonts.status === 'loaded'; } catch (e) { return true; } };
const frMirror = (e) => [-e[2], e[1], -e[0], e[3]];
function frMeasure(list, play) {
  const g = $('#frDogs'); if (!g) return;
  const jobs = [], opt = (v, p, f) => ({ pose: p, outfit: frOutfit(v), facing: f });
  const keyOf = (v, o) => { try { return v.dog.key + '|' + JSON.stringify(dogOpts(v.dog, o)); } catch (e) { return null; } };
  list.forEach((v) => {
    v.ext = {}; v.envc = {};
    (play.includes(v) ? FR_REST.concat(FR_PLAY) : FR_REST).forEach((p) => {
      const oR = opt(v, p, 'right'), oL = opt(v, p, 'left'), kR = keyOf(v, oR), kL = keyOf(v, oL);
      if (kR && kL && FR_EXT_MEMO.has(kR) && FR_EXT_MEMO.has(kL)) { v.ext[p] = FR_EXT_MEMO.get(kR); v.ext[p + '/l'] = FR_EXT_MEMO.get(kL); return; }
      const sR = dogSVG(v.dog, oR), words = /<text\b/.test(sR); jobs.push({ v, n: p, s: sR, k: kR, words, f: 'right' });
      jobs.push(words ? { v, n: p + '/l', s: dogSVG(v.dog, oL), k: kL, words, f: 'left' } : { v, n: p + '/l', mirror: p, k: kL });
    });
  });
  const draw = jobs.filter((j) => j.s);
  if (draw.length) {
    g.innerHTML = '<g visibility="hidden" aria-hidden="true">' + draw.map((j) => `<g>${place(j.s, DX, DY, DW, DH)}</g>`).join('') + '</g>';
    const kids = g.firstElementChild.children;
    draw.forEach((j, i) => {
      let b = null; try { b = kids[i].getBBox(); } catch (e) { b = null; }
      j.e = b && b.width > 1 ? [b.x - 430, b.y - 500, b.x + b.width - 430, b.y + b.height - 500] : null;
      if (j.e && j.words) { if (j.f === 'left') j.e[0] -= FR_WORDS; else j.e[2] += FR_WORDS; } // the words in front of the nose: room for a font still loading
    });
    g.innerHTML = '';
  }
  jobs.forEach((j) => {
    const e = j.mirror ? j.v.ext[j.mirror] && frMirror(j.v.ext[j.mirror]) : j.e; if (!e) return; // not measured (no layout yet): frExt's stand-in box
    j.v.ext[j.n] = e;
    if (j.k && (!j.words || frFontsIn())) { FR_EXT_MEMO.set(j.k, e); if (FR_EXT_MEMO.size > 400) FR_EXT_MEMO.delete(FR_EXT_MEMO.keys().next().value); }
  });
}
const frOutfit = (v) => (v.mine ? outfitOf(v.dog) : v.dog.outfit);
// the box every pose the dog may take there covers (its own units), facing one way or (face null) either way
function frEnvL(v, face) {
  const key = face || 'both'; if (v.envc && v.envc[key]) return v.envc[key];
  let r = null; (v.play ? FR_REST.concat(FR_PLAY) : FR_REST).forEach((p) => (face ? [face] : ['left', 'right']).forEach((f) => { r = frU(r, frExt(v, p, f)); }));
  if (v.envc) v.envc[key] = r; return r;
}
const frExt = (v, p, f) => (v.ext && v.ext[p + (f === 'left' ? '/l' : '')]) || [-110, -175, 110, 10];
const frEnv = (v, x, y, k, face) => { const e = frEnvL(v, face); return [x + k * e[0], y + k * e[1], x + k * e[2], y + k * e[3]]; };
// the shortest the dog is drawn in any of those poses (its own units): the part of it that counts as legs is measured on that
function frMinH(v) {
  if (v.envc && v.envc.h) return v.envc.h;
  const h = Math.min(...(v.play ? FR_REST.concat(FR_PLAY) : FR_REST).flatMap((p) => ['right', 'left'].map((f) => { const e = frExt(v, p, f); return e[3] - e[1]; })));
  if (v.envc) v.envc.h = h; return h;
}
// what a dog holds: its drawn box r, its feet y (null: a walk between rows) and its shortest drawn height h, in world units
const frRes = (v, r, y, k) => ({ r, y, h: frMinH(v) * k });
// two holds: 0 apart, 1 the dog behind shows all but its legs (the bottom FR_LEGS of its shortest pose), 2 one drawn over the other
function frClash(A, B) {
  const a = A.r, b = B.r, iy0 = Math.max(a[1], b[1]), iy1 = Math.min(a[3], b[3]);
  if (Math.min(a[2], b[2]) - Math.max(a[0], b[0]) <= 1 || iy1 - iy0 <= 1) return 0;
  if (A.y == null || B.y == null || Math.abs(A.y - B.y) < FR_ROW) return 2;
  const back = A.y < B.y ? A : B;
  return iy0 >= back.r[3] - FR_LEGS * back.h ? 1 : 2;
}
// the box the dog holds now, where it stands
function frHold(v) { v.res = frRes(v, frEnv(v, v.x, v.y, v.k, v.face), v.y, v.k); }
// o: { legs: allow the row stacking, wide: anywhere in the yard (a phone's crop is full), face: the way it will face (default its own; null either), any: other dogs aside }
function frSpotOk(v, x, y, o) {
  o = o || {};
  const c = FRV.crop || { x0: 60, x1: 940, y1: 590, boxes: [], feet: [] }, z = isPhone() ? RM_ZONES_PH.yard || RM_ZONES.yard : RM_ZONES.yard;
  if (x < 60 || x > 940 || y < z[0] || y > Math.min(z[1], c.y1)) return false;
  if (x > 625 && x < 870 && y < 536) return false; // behind the house (its walls are at x 637 to 844, its front at y 530)
  if ((c.feet || []).some((b) => x > b[0] && x < b[0] + b[2] && y > b[1] && y < b[1] + b[3])) return false;
  const k = frK(v, y), T = frTap(x, y, k), R = frEnv(v, x, y, k, 'face' in o ? o.face : v.face);
  if (y < 500 && R[2] > 640 && R[0] < 860) return false; // well behind the house's front: never drawn over the house
  if (o.wide) {
    if (R[0] < 4 || R[2] > 996) return false;
    if (c.boxes.some((b) => b[1] > 300 && T[1] + T[3] > b[1])) return false; // clear of the buttons and the bar wherever the camera pans
  } else {
    if (Math.min(T[0], R[0]) < c.x0 + 4 || Math.max(T[0] + T[2], R[2]) > c.x1 - 4) return false; // the whole dog on screen
    if (c.boxes.some((b) => frOver(T, b) > 0)) return false;
  }
  const most = o.legs ? 1 : 0;
  const me = frRes(v, R, y, k);
  return !!o.any || !FRV.dogs.some((d) => d !== v && d.res && frClash(me, d.res) > most);
}
function frSpots(v, near, o) {
  const z = RM_ZONES.yard, out = [];
  for (let y = z[0]; y <= 594; y += 14) for (let x = 60; x <= 940; x += 20) if ((!near || (Math.abs(x - near[0]) < 160 && Math.abs(y - near[1]) < 70)) && frSpotOk(v, x, y, o)) out.push([x, y]);
  return out;
}
const frXf = (v) => `translate(${f1(v.x)} ${f1(v.y)}) scale(${v.k.toFixed(3)}) translate(-430 -500)`;
function frPose(v) { return v.tw ? 'walk' : performance.now() < v.happy ? 'happy' : v.pose; }
function frDogArt(v) {
  const pose = frPose(v), o = { pose, outfit: frOutfit(v), facing: v.face };
  v.drawn = pose + '|' + v.face;
  return place(dogSVG(v.dog, o), DX, DY, DW, DH); // no passing faces (41_expressions.js) on a visit: the drawn box stays the one measured
}
function frDogSVG(v, i) {
  const lbl = v.mine ? v.dog.name : tt('fr.dog_aria', '{dog}, {name}\'s dog. Tap to pet.', { dog: v.dog.name, name: frPairName(FRV.pair) || tt('fr.a_friend', 'A friend') });
  const tap = v.mine ? ' pointer-events="none" aria-hidden="true"' : ` tabindex="0" role="button" aria-label="${esc(lbl)}"`;
  return `<g class="frdog${v.mine ? ' fr-mine' : ''}" data-frd="${i}"${tap}><g class="fr-at" transform="${frXf(v)}">${v.mine ? '' : `<rect class="fr-hit" x="${DX + 44}" y="${DY + 35}" width="${DW - 88}" height="180" fill="transparent"/>`}<g class="fr-art">${frDogArt(v)}</g></g></g>`;
}
function frPaint(v) {
  const el = $(`#frDogs [data-frd="${FRV.dogs.indexOf(v)}"]`); if (!el) return;
  el.style.display = v.hidden ? 'none' : '';
  const at = el.querySelector('.fr-at'); if (at) at.setAttribute('transform', frXf(v));
  if (frPose(v) + '|' + v.face === v.drawn) return;
  const a = el.querySelector('.fr-art'); if (a) a.innerHTML = frDogArt(v);
}
function frOrder() {
  const g = $('#frDogs'); if (!g) return;
  const els = [...g.children], want = els.slice().sort((a, b) => FRV.dogs[+a.dataset.frd].y - FRV.dogs[+b.dataset.frd].y);
  if (want.some((e, i) => els[i] !== e)) want.forEach((e) => g.appendChild(e));
}
/* the greeting (owner, 2 Nov 2026, as in the launch Reel): my leader walks in to their leader, the two sniff nose to nose with a heart or two, then play
   (a play bow, a jump, back and forth, hearts), then the visit goes on as before. Real timers (the harness too); reduced motion: no walk in, no jumps */
const FR_GREET = [{ a: 'sniff', b: 'sniff', ms: 1900, fx: [250, 1000], s: 'sniff' }, { a: 'happy', b: 'happy', ms: 700 },
  { a: 'bow', b: 'jump', ms: 650, fx: [80], s: 'boop' }, { a: 'jump', b: 'bow', ms: 650, fx: [80] }, { a: 'bow', b: 'jump', ms: 650, fx: [80] }, { a: 'jump', b: 'bow', ms: 650, fx: [80] }];
const FR_GREET_CALM = [{ a: 'sniff', b: 'sniff', ms: 2000, fx: [300], s: 'sniff' }, { a: 'bow', b: 'bow', ms: 1600, fx: [200], s: 'boop' }];
const FR_WALK_IN = [200, 140, 80]; // how far my leader walks in from, if the way is clear
// the pair's spots: the two facing each other at one depth, their boxes as close as the poses allow, as far forward as fits, near the middle of the view
function frPairAt(a, b) {
  const c = FRV.crop || { x0: 60, x1: 940 }, pref = FRC.w < 1000 ? (c.x0 + c.x1) / 2 : 430, z = isPhone() ? RM_ZONES_PH.yard || RM_ZONES.yard : RM_ZONES.yard;
  const fa = frEnvL(a, 'right'), fb = frEnvL(b, 'left'), yp = FRC.w < 1000 ? 594 : 552;
  let best = null;
  for (let y = 594; y >= z[0]; y -= 2) {
    const ka = frK(a, y), kb = frK(b, y), d = ka * fa[2] - kb * fb[0] + 4; // the feet apart so that the two boxes just do not meet
    for (let cx = 60; cx <= 940; cx += 4) {
      const s = -Math.abs(y - yp) - Math.abs(cx - pref) * 0.5; if (best && s <= best.s) continue;
      if (frSpotOk(a, cx - d / 2, y, { face: 'right' }) && frSpotOk(b, cx + d / 2, y, { face: 'left' })) best = { s, a: [cx - d / 2, y], b: [cx + d / 2, y] };
    }
  }
  return best;
}
const frAt = (v, p) => { v.x = p[0]; v.y = p[1]; v.home = p.slice(); v.k = frK(v, v.y); frHold(v); };
// where my leader starts its walk in (left of its spot, the way clear of the others), or its spot itself
function frWalkFrom(a) {
  if (motionOff()) return null;
  const at = frEnv(a, a.x, a.y, a.k, 'right'), wk = (x) => { const e = frExt(a, 'walk', 'right'); return [x + a.k * e[0], a.y + a.k * e[1], x + a.k * e[2], a.y + a.k * e[3]]; };
  for (const dx of FR_WALK_IN) {
    const x = a.x - dx; if (x < 40) continue;
    const me = frRes(a, frU(at, wk(x)), a.y, a.k); // it walks in its walk pose along one depth: a dog behind may show all but its legs, as beside a dog standing there
    if (!FRV.dogs.some((d) => d !== a && d.res && frClash(me, d.res) > 1)) return { x, res: me };
  }
  return null;
}
function frGreetStart(delay) {
  const a = FRV.dogs.find((v) => v.mine && v.play), b = FRV.dogs.find((v) => !v.mine && v.play); if (!a || !b) return false;
  const calm = motionOff(), now = performance.now();
  a.tw = b.tw = null; a.happy = b.happy = 0; a.gr = b.gr = true; a.face = 'right'; b.face = 'left'; a.pose = b.pose = 'idle';
  const w = frWalkFrom(a);
  if (w) { a.from = w.x; a.x = w.x; a.res = w.res; } else a.from = null;
  FRV.gr = { a, b, i: -1, at: now + (delay || 0), steps: calm ? FR_GREET_CALM : FR_GREET, fx: [] };
  frPaint(a); frPaint(b); frOrder(); return true;
}
function frGreetHeart(G, n) {
  const { a, b } = G, ea = frExt(a, 'sniff', 'right'), eb = frExt(b, 'sniff', 'left'), play = G.i > 0;
  const nx = (a.x + a.k * ea[2] + b.x + b.k * eb[0]) / 2, top = Math.min(a.y + a.k * frExt(a, 'jump', 'right')[1], b.y + b.k * frExt(b, 'jump', 'left')[1]);
  const y = play ? top + 10 : (a.y + a.k * ea[1] * 0.45 + b.y + b.k * eb[1] * 0.45) / 2;
  fxText('♥', nx + (n % 2 ? 14 : -6), y - (n % 2 ? 26 : 0), '#F28FA5', play ? 32 : 36);
}
function frGreetTick(t) {
  const G = FRV.gr; if (!G) return;
  G.fx = G.fx.filter((h) => { if (t < h) return true; frGreetHeart(G, G.n = (G.n || 0) + 1); return false; });
  if (t < G.at) return;
  const { a, b } = G;
  if (G.i === -1) { // the walk in
    G.i = -0.5;
    if (a.from != null && Math.abs(a.home[0] - a.x) > 1) { a.tw = { x0: a.x, y0: a.y, x1: a.home[0], y1: a.home[1], k0: a.k, t0: t, dur: (Math.abs(a.home[0] - a.x) / RM_WALK) * 1000 }; frPaint(a); }
    return;
  }
  if (G.i === -0.5 && a.tw) return; // still walking in
  G.i = G.i < 0 ? 0 : G.i + 1;
  const st = G.steps[G.i];
  if (!st) { // the visit goes on
    a.gr = b.gr = false; FRV.gr = null;
    a.pose = PICK(['idle', 'sit', 'happy']); b.pose = PICK(['sit', 'happy', 'idle']); a.wait = t + RINT(2500, 6500); b.wait = t + RINT(2500, 6500);
    frHold(a); frHold(b); frPaint(a); frPaint(b); return;
  }
  a.pose = st.a; b.pose = st.b; G.at = t + st.ms; (st.fx || []).forEach((ms) => G.fx.push(t + ms));
  if (st.s === 'sniff') sfx('sniff'); else if (st.s === 'boop') SFX.boop(760);
  frPaint(a); frPaint(b);
}
// the test hook greet(): the greeting again on this visit (Marketing films it), the pair back at its spots first
function frGreet() {
  if (cur.mode !== 'fryard') return false;
  const a = FRV.dogs.find((v) => v.mine && v.play), b = FRV.dogs.find((v) => !v.mine && v.play); if (!a || !b) return false;
  a.tw = b.tw = null; a.face = 'right'; b.face = 'left'; frScan();
  const keep = [a.res, b.res]; a.res = b.res = null;
  const p = frPairAt(a, b);
  if (p) { frAt(a, p.a); frAt(b, p.b); } else { a.res = keep[0]; b.res = keep[1]; frAt(a, a.home); frAt(b, b.home); }
  return frGreetStart(250);
}
// one try at one scale: the pair first, then the others where the camera shows them (all clear, else only their legs behind a dog in front).
// final: the ones that do not fit go off to the side of a phone's crop (the look-around button shows them), else where the others cover them least
function frLayout(list, fit, final) {
  FRV.fit = fit; FRV.dogs = [];
  const ph = FRC.w < 1000, a = list.find((v) => v.mine), b = list.find((v) => !v.mine), now = performance.now(), put = (v, p) => { frAt(v, p); v.wait = now + RINT(1500, 5000); FRV.dogs.push(v); };
  list.forEach((v) => { v.res = null; v.play = false; v.envc = {}; });
  let pair = null, n = 0, path = null;
  if (a && b) {
    a.play = b.play = true; a.face = 'right'; b.face = 'left'; b.pose = 'idle';
    pair = frPairAt(a, b);
    if (pair) { frAt(a, pair.a); frAt(b, pair.b); FRV.dogs.push(a, b); n = 2; const w = frWalkFrom(a); path = w && w.res; }
    else { a.play = b.play = false; a.envc = {}; b.envc = {}; }
  }
  const rest = [];
  list.filter((v) => !FRV.dogs.includes(v)).forEach((v) => { // where the camera shows them: all clear, else only the legs behind a dog in front; off my leader's walk in when there is room
    let sp = frSpots(v); if (!sp.length) sp = frSpots(v, null, { legs: true });
    if (!sp.length) { rest.push(v); return; }
    const off = path ? sp.filter((p) => frClash(frRes(v, frEnv(v, p[0], p[1], frK(v, p[1]), v.face), p[1], frK(v, p[1])), path) <= 1) : sp;
    put(v, PICK(off.length ? off : sp)); n++;
  });
  if (pair) { const w = frWalkFrom(a); if (w) a.res = w.res; } // the rest keep clear of the walk in too
  if (!final) return { pair, n };
  rest.forEach((v) => {
    let sp = [];
    if (ph) { // off to the side of the crop, as near as there is room
      sp = frSpots(v, null, { wide: true }); if (!sp.length) sp = frSpots(v, null, { wide: true, legs: true });
      const c = FRV.crop, gap = (p) => { const R = frEnv(v, p[0], p[1], frK(v, p[1]), v.face); return R[2] <= c.x0 ? c.x0 - R[2] : R[0] >= c.x1 ? R[0] - c.x1 : 1e4 - Math.abs(p[0] - (c.x0 + c.x1) / 2); };
      sp.sort((p, q) => gap(p) - gap(q)); sp = sp.slice(0, 3);
    }
    if (!sp.length) { // nowhere clear at all: the spot the others cover least
      const all = frSpots(v, null, { wide: ph, any: true }), box = (r) => [r[0], r[1], r[2] - r[0], r[3] - r[1]];
      const cover = (p) => { const R = box(frEnv(v, p[0], p[1], frK(v, p[1]), v.face)); return FRV.dogs.reduce((m, o) => m + (o.res ? frOver(R, box(o.res.r)) : 0), 0); };
      if (all.length) { all.sort((p, q) => cover(p) - cover(q)); sp = [all[0]]; }
    }
    if (sp.length) put(v, PICK(sp));
  });
  return { pair, n };
}
function frDrawDogs() {
  const g = $('#frDogs'); if (!g) return;
  frScan(); FRV.dogs = []; FRV.gr = null; FRV.fit = 1;
  const list = [];
  FRV.card.dogs.forEach((x, i) => { const dog = dcDog(FRV.card, i); if (dog) list.push({ dog, mine: false, i }); });
  if (S.dog) list.splice(Math.min(1, list.length), 0, { dog: S.dog, mine: true, i: -1 }); // my leader walks in beside their leader
  list.forEach((o) => {
    Object.assign(o, { x: 0, y: 0, k: 1, face: Math.random() < 0.5 ? 'left' : 'right', pose: PICK(['idle', 'sit', 'happy']), tw: null, wait: 0, home: null, hidden: false, happy: 0, drawn: '', res: null, play: false, gr: false, from: null });
    if (o.mine) { o.pose = 'idle'; o.face = 'right'; }
  });
  frMeasure(list, [list.find((v) => v.mine), list.find((v) => !v.mine)].filter(Boolean)); // the two who greet also play: their play poses are measured too
  // the whole pack a little smaller when that lets the greeting pair and (a phone) a third dog or (a desktop) all of them fit the view clear of each other (owner, 2 Nov 2026)
  const ph = FRC.w < 1000, both = list.some((v) => v.mine) && list.some((v) => !v.mine), want = ph ? Math.min(list.length, 3) : list.length;
  let best = null;
  for (const f of [1, 0.95, 0.9, 0.86, 0.82, 0.78, 0.74, 0.7]) {
    const r = frLayout(list, f, false), s = (r.pair || !both ? 100 : 0) + Math.min(r.n, want);
    if (!best || s > best.s) best = { s, f };
    if (s >= 100 + want) break;
  }
  const L = frLayout(list, best ? best.f : 1, true);
  FRV.dogs = list.filter((v) => FRV.dogs.includes(v)); // the list's order: their leader, mine, then theirs
  g.innerHTML = FRV.dogs.map((v, i) => frDogSVG(v, i)).join('');
  g.querySelectorAll('.frdog:not(.fr-mine)').forEach((el) => {
    const go = (e) => { if (e) e.stopPropagation(); const v = FRV.dogs[+el.dataset.frd]; if (v) frPetDog(v); };
    el.addEventListener('click', go); el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(e); } });
  });
  if (L.pair) frGreetStart(600);
  frOrder(); FRV.last = 0; if (!FRV.raf) FRV.raf = requestAnimationFrame(frFrame);
}
// a wander: a clear spot near home, and the whole way there clear of the others too
function frNext(v, now) {
  const from = frEnv(v, v.x, v.y, v.k, null);
  const sp = frSpots(v, v.home, { face: null }).filter((p) => Math.hypot(p[0] - v.x, p[1] - v.y) > 50).filter((p) => {
    const me = frRes(v, frU(from, frEnv(v, p[0], p[1], frK(v, p[1]), null)), null, v.k); return !FRV.dogs.some((d) => d !== v && d.res && frClash(me, d.res) > 0);
  });
  if (!sp.length) { v.wait = now + RINT(2000, 4000); return; }
  const p = PICK(sp), dist = Math.hypot(p[0] - v.x, p[1] - v.y);
  v.tw = { x0: v.x, y0: v.y, x1: p[0], y1: p[1], k0: v.k, t0: now, dur: (dist / RM_WALK) * 1000 }; v.face = p[0] < v.x ? 'left' : 'right';
  v.res = frRes(v, frU(from, frEnv(v, p[0], p[1], frK(v, p[1]), null)), null, v.k); frPaint(v);
}
function frFrame(t) {
  FRV.raf = 0; if (cur.mode !== 'fryard' || !$('#frDogs')) return;
  const dt = FRV.last ? Math.min(100, t - FRV.last) : 0; FRV.last = t;
  const held = !modal.hidden || document.visibilityState === 'hidden';
  if (t > FRV.chk && !held) { FRV.chk = t + 1000; frScan(); }
  if (held && FRV.gr) { FRV.gr.at += dt; FRV.gr.fx = FRV.gr.fx.map((h) => h + dt); }
  FRV.dogs.forEach((v) => {
    if (held) { if (v.tw) v.tw.t0 += dt; v.wait += dt; return; }
    if (v.tw) {
      const w = v.tw, k = w.dur > 0 ? clamp((t - w.t0) / w.dur, 0, 1) : 1;
      v.x = w.x0 + (w.x1 - w.x0) * k; v.y = w.y0 + (w.y1 - w.y0) * k; v.k = w.k0 + (frK(v, w.y1) - w.k0) * k;
      if (k >= 1) { v.tw = null; frHold(v); if (!v.gr) { v.pose = PICK(['idle', 'idle', 'sit', 'happy']); v.wait = t + RINT(2500, 6500); } }
      frPaint(v);
    } else {
      if (v.drawn && frPose(v) + '|' + v.face !== v.drawn) frPaint(v); // the happy pose ends
      if (t > v.wait && rmWander() && !v.gr) frNext(v, t);
    }
  });
  if (!held) frGreetTick(t);
  frOrder(); FRV.raf = requestAnimationFrame(frFrame);
}
/* ---------- pet: hearts, a happy pose and a line from the dog's personality. The first pet per friend per day sends `pet` ---------- */
function frPetDog(v) {
  if (!v || v.mine || cur.mode !== 'fryard') return;
  if (v.tw) { v.x = v.tw.x1; v.y = v.tw.y1; v.k = frK(v, v.y); v.tw = null; frHold(v); }
  v.happy = performance.now() + 2200; v.wait = v.happy + RINT(1500, 3000); frPaint(v);
  const lf = v.face === 'left', hx = v.x + (lf ? -43 : 43) * v.k, hy = v.y - 175 * v.k;
  SFX.boop(760); fxText('♥', hx, hy - 20); setTimeout(() => fxText('♥', hx + 18, hy - 50), 180);
  say(persLine(v.dog), hx, hy, 3400);
  frPet();
}
async function frPet() {
  const fid = FRV.fid; if (!fid || frSentToday(fid, 'pet') || FRV.busy === 'pet') return false; // later pets that day are just hearts
  FRV.busy = 'pet';
  let r = null;
  try { r = await frApi('POST', '/friends/send', { fid, kind: 'pet', data: {} }); } catch (e) { r = null; }
  FRV.busy = '';
  if (r && r.ok) {
    frMarkSent(fid, 'pet'); frDay();
    if (S.fr.pets < FR_PET_MAX) { S.fr.pets++; markDirty(); const n = addBond(1, { raw: true }); toast(tt('fr.pet_bond', '{dog} made friends. +{n} Bond.', { dog: NAME(), n }), 'good'); }
    return true;
  }
  if (frErr(r) === 'limit') frMarkSent(fid, 'pet');
  return false;
}
/* ---------- the paw-print note: one of FR_NOTES, once per friend per day ---------- */
function frNoteSheet() {
  const name = frPairName(FRV.pair) || tt('fr.a_friend', 'A friend');
  const list = FR_NOTES.map((en, i) => `<button class="btn fr-note" type="button" data-frnote="${i}">${esc(tdata('fr_notes.' + i, en))}</button>`).join('');
  const p = openModal(esc(tt('fr.paw_leave', 'Leave a paw print')), `<div class="fr-notes"><p>${esc(tt('fr.note_lead', 'Pick a note for {name}.', { name }))}</p><div class="fr-notelist">${list}</div></div>`, { cls: 'frsheet fr-notesheet' });
  p.querySelectorAll('[data-frnote]').forEach((b) => { b.onclick = () => { SFX.click(); frNote(+b.dataset.frnote, p); }; });
  return p;
}
async function frNote(i, p) {
  const fid = FRV.fid;
  if (!fid || !Number.isInteger(i) || i < 0 || i >= FR_NOTES.length || FRV.busy === 'note' || frSentToday(fid, 'note')) return false;
  FRV.busy = 'note';
  const btns = p ? [...p.querySelectorAll('[data-frnote]')] : []; btns.forEach((b) => { b.disabled = true; });
  let r = null;
  try { r = await frApi('POST', '/friends/send', { fid, kind: 'note', data: { i } }); } catch (e) { r = null; }
  FRV.busy = ''; btns.forEach((b) => { b.disabled = false; });
  if (r && r.ok) {
    frMarkSent(fid, 'note'); frDay(); S.fr.notes++; markDirty();
    if (!modal.hidden) closeModal();
    if (cur.mode === 'fryard' && FRV.fid === fid) { const g = $('#frStampG'); if (g) g.innerHTML = frStampSVG(); frBtns(); }
    toast(tt('fr.paw_left', 'Paw print left!'), 'good');
    return true;
  }
  if (frErr(r) === 'limit') { frMarkSent(fid, 'note'); if (!modal.hidden) closeModal(); if (cur.mode === 'fryard') frBtns(); return false; }
  toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad');
  return false;
}
/* ---------- part 4: gifts (V219.md section 5). One a day in all (S.fr.gift), from the bag, FR_GIFTS only. The bag changes only after the Worker says ok ----------
   Food safety: every FR_GIFTS entry is a FOOD row (each with its safety tip), a walk treasure food, a garden seed packet or a garden crop. The garden grows
   nothing toxic and no shop sells anything toxic, so every entry is dog-safe by the game's own rules. No PEOPLE_FB food is in the list (v219_friends checks it). */
const FR_GIFT_OFF = []; // FR_GIFTS indices that may no longer be given (the slot stays: the Worker stores the index). None today
const FR_GOT_MAX = 5; // gifts turned into letters a day (S.fr.gotGifts). The rest stay unclaimed until tomorrow
// where FR_GIFTS[i] lives in the bag: a food (S.inv.food[name]), a seed packet (S.inv.seeds[crop id]) or a crop (S.inv.crops[crop id] = [1★, 2★, 3★])
function frGiftRef(i) {
  const n = Number.isInteger(i) ? FR_GIFTS[i] : null;
  if (!n || FR_GIFT_OFF.includes(i)) return null;
  const seed = CROPS_FB.find((c) => c.seedItem === n), crop = CROPS_FB.find((c) => c.item === n);
  if (seed) return { i, n, cat: 'seeds', id: seed.id, name: gkCropSeed(seed) };
  if (crop) return { i, n, cat: 'crops', id: crop.id, name: gkCropItem(crop) };
  if (n !== 'Golden Bone' && FOOD_ALL.some((f) => f.n === n)) return { i, n, cat: 'food', id: n, name: shNameAny(n) };
  return null;
}
function frGiftHave(g) {
  const inv = (S && S.inv) || {};
  if (g.cat === 'crops') { const a = (inv.crops || {})[g.id]; return Array.isArray(a) ? a.reduce((s, k) => s + (k > 0 ? Math.floor(k) : 0), 0) : 0; }
  const v = (inv[g.cat] || {})[g.id]; return v > 0 ? Math.floor(v) : 0;
}
function frGiftTake(g) { // one from the bag. A crop goes from its lowest star first
  if (frGiftHave(g) < 1) return false;
  if (g.cat === 'crops') { const a = S.inv.crops[g.id]; a[a.findIndex((k) => k >= 1)]--; }
  else { const b = S.inv[g.cat]; b[g.id]--; if (g.cat === 'food' && b[g.id] <= 0) delete b[g.id]; }
  markDirty(); return true;
}
const frGiftsOwned = () => FR_GIFTS.map((n, i) => frGiftRef(i)).filter((g) => g && frGiftHave(g) >= 1);
// today's one gift is used: sent from here (S.fr.gift), or today's list says one went out (from another device)
function frGiftUsed() {
  if (!S || !S.fr) return false;
  frDay();
  return !!S.fr.gift || (FR.loadDay === frToday() && ((S.fr.cache && S.fr.cache.friends) || []).some((f) => f && f.sent && f.sent.gift));
}
function frGiftBtnHTML(id, attrs, label) {
  const done = frGiftUsed();
  return `<button class="btn${done ? ' soon' : ''}" type="button"${id ? ` id="${id}"` : ''}${attrs ? ' ' + attrs : ''}${done ? ' aria-disabled="true"' : ''}>${esc(done ? tt('fr.gift_done', 'Sent today') : label)}</button>`;
}
const frGiftLimit = () => toast(tt('fr.gift_limit', "You've sent today's gift. You can send another tomorrow."), 'good');
function frWrapSVG(n) {
  let svg = '';
  try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.wrap === 'function') svg = P.FRIENDS.wrap(n); } catch (e) { svg = ''; }
  return svg || `<svg viewBox="-18 -18 36 36" aria-hidden="true">${doodle('bone', 0, 2, 0.8)}</svg>`; // TODO art
}
// the letter's doodle (07b_mailbox.js letterBody): a paw for a note, the wrapped gift for a gift
function frLetterArt(m) {
  if (m && (m.frPaw || m.frPets) && m.kind === 'postcard') return ''; // drawn in the postcard's photo (frLetterPhoto)
  if (m && m.frPaw) return frPawHTML();
  if (m && m.frDog && typeof m.frDog === 'object' && !(m.dog && m.kind !== 'gift')) return `<span class="fr-letterpaw fr-letterdog" aria-hidden="true">${frHeadHTML(m.frDog)}</span>`; // a walk letter: the friend's dog that walked
  if (m && Number.isInteger(m.frWrap)) return `<span class="fr-letterpaw fr-letterwrap" aria-hidden="true">${frWrapSVG(m.frWrap)}</span>`;
  return '';
}
// the postcard photo of a note or pet letter (07b_mailbox.js letterPhoto): the paw doodle, never an empty frame
function frLetterPhoto(m) { return m && (m.frPaw || m.frPets) ? frPawHTML() : ''; }
function frGiftSheet(fid, from) {
  if (!S || !frOn() || !fid) return null;
  if (frGiftUsed()) { frGiftLimit(); return null; }
  const f = frFriend(fid), name = frPairName((f && f.name) || (FRV.fid === fid ? FRV.pair : null)) || tt('fr.a_friend', 'A friend');
  const own = frGiftsOwned();
  const cell = (g) => { const k = frGiftHave(g); return `<button class="btn fr-gift" type="button" data-frgift="${g.i}" aria-label="${esc(tt('fr.gift_aria', '{item}, you have {n}', { item: g.name, n: k }))}"><span class="fr-gic" aria-hidden="true">${art('item', g.n)}</span><span class="fr-gnm">${esc(g.name)}</span><b class="fr-gn" aria-hidden="true">${esc(tt('fr.gift_n', '×{n}', { n: k }))}</b></button>`; };
  const body = own.length ? `<p>${esc(tt('fr.gift_lead', 'Pick a gift for {name}.', { name }))}</p><div class="fr-giftgrid">${own.map(cell).join('')}</div>` : `<p class="fr-gempty">${esc(tt('fr.gift_empty', 'Your bag has nothing to give yet. Treats, seeds and flowers can be gifts.'))}</p>`;
  const p = openModal(esc(tt('fr.gift_send', 'Send a gift')), `<div class="fr-gifts">${body}</div>`, { cls: 'frsheet fr-giftsheet' });
  p.querySelectorAll('[data-frgift]').forEach((b) => {
    b.onclick = async () => {
      SFX.click();
      const g = frGiftRef(+b.dataset.frgift); if (!g || FRV.busy === 'gift') return;
      const ok = await confirmIn(p, esc(tt('fr.gift_ask', 'Send 1 {item} to {friend}?', { item: g.name, friend: name })), esc(tt('fr.gift_yes', 'Send')), esc(tt('fr.gift_no', 'Not now')));
      if (ok) frGiftSend(fid, g.i, p, from);
    };
  });
  return p;
}
function frGiftAfter(from) { // after a send (or a limit): back to the list, or the yard's buttons, where Gift now reads "Sent today"
  const sheet = !modal.hidden && !!document.querySelector('#modal .fr-giftsheet');
  if (sheet && from === 'list') { FR.back = { top: FR.listTop || 0 }; frSheet(); }
  else if (sheet) closeModal();
  if (cur.mode === 'fryard') frBtns();
}
function frWrapFx(n) { // a short crayon wrap: the parcel pops up, wobbles and floats off (an overlay over the stage)
  try {
    const el = document.createElement('div'); el.className = 'fr-wrapfx'; el.setAttribute('aria-hidden', 'true'); el.innerHTML = frWrapSVG(n);
    (document.getElementById('stage') || document.body).appendChild(el); setTimeout(() => el.remove(), 1700);
  } catch (e) { /* the toast still says it */ }
}
async function frGiftSend(fid, i, p, from) {
  const g = frGiftRef(i);
  if (!S || !fid || !g || FRV.busy === 'gift') return false;
  if (frGiftUsed()) { frGiftLimit(); frGiftAfter(from); return false; }
  if (frGiftHave(g) < 1) return false;
  FRV.busy = 'gift';
  const btns = p ? [...p.querySelectorAll('[data-frgift]')] : []; btns.forEach((b) => { b.disabled = true; });
  let r = null;
  try { r = await frApi('POST', '/friends/send', { fid, kind: 'gift', data: { i, n: 1 } }); } catch (e) { r = null; }
  FRV.busy = ''; btns.forEach((b) => { b.disabled = false; });
  if (r && r.ok) { // only now does the item leave the bag
    frDay(); frGiftTake(g); S.fr.gift = true; frMarkSent(fid, 'gift'); markDirty();
    frGiftAfter(from); try { SFX.pop(); } catch (e) { /* audio off */ } frWrapFx(i % 3);
    toast(tt('fr.gift_sent', 'Your gift is on its way!'), 'good');
    return true;
  }
  if (frErr(r) === 'limit') { frDay(); S.fr.gift = true; markDirty(); frGiftLimit(); frGiftAfter(from); return false; } // today's gift went out (another device). The bag stays
  if (r && r.status === 404) toast(tt('fr.not_friend', 'That friend is not on your list any more.'), '');
  else toast(tt('fr.offline', 'Friends need an internet connection. Your dog is happy at home.'), 'bad');
  return false;
}
// receiving: each gift event becomes a mailbox gift letter (Collect as ever, mbCollect), at most FR_GOT_MAX a day; the rest stay unclaimed until tomorrow.
// An event that comes back (its claim did not reach the Worker) is only claimed again: S.fr.gotIds and the letter id keep it from giving twice. Returns the letters made
function frGiftLetters(events, claim) {
  if (typeof mailPush !== 'function') return 0;
  if (typeof mailFields === 'function') mailFields();
  let made = 0;
  events.forEach((ev) => {
    if (!ev || ev.kind !== 'gift' || !ev.from) return;
    const i = ev.data && ev.data.i;
    if (!Number.isInteger(i) || i < 0 || i >= FR_GIFTS.length) return; // an item from a newer copy waits for the update
    const id = 'fr_gift_' + ev.id;
    if (S.fr.gotIds.includes(ev.id) || (S.mail || []).some((m) => m && m.id === id)) { claim.push(ev.id); return; }
    const g = frGiftRef(i);
    if (!g) { claim.push(ev.id); return; } // a slot that may no longer be given: nothing arrives
    if (S.fr.gotGifts >= FR_GOT_MAX) return; // waits for tomorrow
    S.fr.gotGifts++; S.fr.gotIds = S.fr.gotIds.concat(ev.id).slice(-60); markDirty();
    const name = frPairName(ev.from.name) || tt('fr.a_friend', 'A friend');
    mailPush({ kind: 'gift', id, from: name, title: tt('fr.gift_title', 'A gift from {name}!', { name }), text: tt('fr.gift_text', '{name} wrapped up something for {dog}.', { name, dog: NAME() }), gift: { item: g.n, cat: g.cat, id: g.id, n: 1 }, frWrap: (Number(ev.id) || 0) % 3 });
    claim.push(ev.id); made++;
  });
  return made;
}
/* ---------- part 5: walk together (V219.md section 6). A friend's dog from their snapshot joins the next walk as one more o.pack follower ----------
   The route picker row (17_walk_route_carousel.js) lists the friends' snapshot dogs from the cached list (GET /friends, fetched at most once a day for the row:
   S.fr.cache.day). The pick is S.fr.guest { fid, dog } ("Just us" = null, the default). It lasts until the walk ends: it is cleared when the walk ends or is
   left, on every yard:enter and on a reload, so a walk started from a run gate never takes an old pick. In the runner the guest is cosmetic: drawn from its card
   look with the friend ribbon, no stats, no Bond, no food, not a walker of mine (PKS.walk never holds it, so no pack bonus). It takes one follower slot: with
   the leader and the walkers it never goes over MAX_DOGS. At the end: +10 coins (before BOOST) for at most 2 friend walks a day, and one walk event per friend
   per day ({ dog, mine, t? }). A later walk with the same friend that day pays nothing and sends nothing (S.fr.walked). */
const FR_WALK_COINS = 10, FR_WALK_MAX = 2; // friends add at most 20 coins a day before BOOST (the only coins from friends)
const FR_GOT_WALKS = 3; // walk letters a day (S.fr.gotWalks). The rest stay unclaimed until tomorrow
const FR_WALK_SHOW = 30; // dogs in the picker row at most (50 friends x 5 dogs would be a very long row)
const FRW = { g: null, ask: '' }; // g: the guest of the walk that is running { fid, dog, pair, d }. ask: the day the row fetched the list
function frRibbonSVG() {
  try { const P = window.PawArt; if (P && P.FRIENDS && typeof P.FRIENDS.ribbon === 'function') { const s = P.FRIENDS.ribbon(); if (s) return s; } } catch (e) { /* art missing */ }
  return ICON('bond'); // TODO art
}
// the friends' snapshot dogs: { fid, dog (the index in their snapshot), pair (their friend name), d (the card dog as dcDog draws it) }
function frWalkDogs() {
  if (!S || !S.fr || !S.fr.cache || typeof dcDog !== 'function') return [];
  const out = [];
  frSorted(S.fr.cache.friends || []).forEach((f) => {
    if (!f || typeof f.fid !== 'string' || !Array.isArray(f.dogs)) return;
    const card = { id: 'fr:' + f.fid, name: Array.isArray(f.name) ? f.name : [0, 0], dogs: f.dogs.slice(0, 5) };
    card.dogs.forEach((x, i) => {
      if (!x || typeof x !== 'object' || out.length >= FR_WALK_SHOW) return;
      let d = null; try { d = dcDog(card, i); } catch (e) { d = null; } // a breed this copy does not know yet
      if (d) out.push({ fid: f.fid, dog: i, pair: card.name, d });
    });
  });
  return out;
}
const frWalkWho = (o) => tt('fr.walk_who', "{name}'s {dog}", { name: frPairName(o.pair) || tt('fr.a_friend', 'A friend'), dog: o.d.name });
// the pack has no room for a guest on route k: the leader and the walkers already make MAX_DOGS
const frWalkFull = (k) => typeof pkDogs === 'function' && pkDogs('walk', k).length >= MAX_DOGS;
function frGuestClear() { if (S && S.fr && S.fr.guest) { S.fr.guest = null; markDirty(); } }
function frWalkRowInner(list) {
  const k = ROUTE_KEYS[routeIdx], full = frWalkFull(k), g = S.fr.guest;
  const on = (o) => !full && !!g && g.fid === o.fid && g.dog === o.dog, picked = list.some(on);
  const dis = full ? ' disabled aria-disabled="true"' : '';
  const just = `<button class="chip cr-chip on pk-pickb fr-wchip fr-wjust" type="button" data-frg=""${dis} aria-pressed="${!picked}"><span class="cr-name">${esc(tt('fr.walk_just', 'Just us'))}</span></button>`;
  const chips = list.map((o) => {
    const fn = frPairName(o.pair) || tt('fr.a_friend', 'A friend');
    return `<button class="chip cr-chip on pk-pickb fr-wchip" type="button" data-frg="${esc(o.fid)}:${o.dog}"${dis} aria-pressed="${on(o)}" aria-label="${esc(tt('fr.walk_aria', '{dog}, {name}\'s dog', { dog: o.d.name, name: fn }))}"><span class="cr-head" aria-hidden="true">${headSVG(o.d)}</span><span class="fr-wnm"><b class="cr-name">${esc(o.d.name)}</b><small>${esc(fn)}</small></span></button>`;
  }).join('');
  const cap = full ? `<p class="small fr-walkcap fr-walkfull">${esc(tt('fr.walk_full', 'Your pack is full today'))}</p>` : `<p class="small fr-walkcap">${esc(tt('fr.walk_row', "Walk with a friend's dog"))}</p>`; // a full pack: the row says so instead
  return `${cap}<div class="cr-chips fr-wchips" role="group" aria-label="${esc(tt('fr.walk_row', "Walk with a friend's dog"))}">${just}${chips}</div>`;
}
// the route picker row: hidden when Friends is off or there is no friend dog to walk with
function frWalkRowHTML() {
  if (!frOn() || !S || !S.fr || !S.fr.fid) return '';
  const list = frWalkDogs(); if (!list.length) return '';
  return `<div class="fr-walkrow" id="frWalkRow">${frWalkRowInner(list)}</div>`;
}
function frWalkBind() {
  const row = $('#frWalkRow', view); if (!row || row.dataset.bound) return;
  row.dataset.bound = '1';
  row.addEventListener('click', (e) => {
    const b = e.target.closest('[data-frg]'); if (!b || b.disabled || !row.contains(b)) return;
    SFX.click();
    const v = b.dataset.frg, cut = v.lastIndexOf(':');
    S.fr.guest = v && cut > 0 ? { fid: v.slice(0, cut), dog: +v.slice(cut + 1) } : null; markDirty();
    frWalkSync();
  });
}
// redraw the row for the route that is showing (the pack can be full on one route and not on another). Called by layoutRoutes and the pack chips
function frWalkSync() {
  if (cur.mode !== 'routes') return;
  const row = $('#frWalkRow', view), html = frWalkRowHTML();
  const rts = $('.routes', view); if (rts) rts.classList.toggle('rt-fr', !!html);
  if (!html) { if (row) row.remove(); return; }
  if (!row) { const foot = $('.rt-foot', view); if (!foot) return; foot.insertAdjacentHTML('beforebegin', html); frWalkBind(); return; }
  const sc = $('.fr-wchips', row), x = sc ? sc.scrollLeft : 0;
  row.innerHTML = frWalkRowInner(frWalkDogs());
  const sc2 = $('.fr-wchips', row); if (sc2) sc2.scrollLeft = x;
}
// the route picker opened: bind the row and, once a day, fetch the friends' list (their snapshot dogs)
function frWalkInit() {
  frWalkBind();
  if (!frOn() || !S || !S.fr || !S.fr.fid) return;
  const today = frToday();
  if (S.fr.cache.day === today || FRW.ask === today) return;
  FRW.ask = today;
  frLoad().then(() => frWalkSync()).catch(() => { /* the cached dogs stay */ });
}
// the walk starts (enterWalk): the picked guest, if the pack has room and the friend's dog is still in the list. Else none, and the pick is cleared
function frWalkStart() {
  FRW.g = null;
  const g = S && S.fr && S.fr.guest;
  if (!g || !frOn()) { frGuestClear(); return null; }
  const o = pkWalkers().length + 2 <= MAX_DOGS ? frWalkDogs().find((x) => x.fid === g.fid && x.dog === g.dog) : null;
  if (!o) { frGuestClear(); return null; }
  FRW.g = o; return o;
}
// the runner's look for the guest, as pkWalkLooks makes one for a walker (dogForMod's fields), plus friend: true and the ribbon. [] without a guest
function frGuestLooks() {
  const o = FRW.g; if (!o) return [];
  const d = o.d, c = coatInfo(d);
  return [Object.assign({ key: artKey(d.key), name: d.name, outfit: Object.assign({}, d.outfit), sex: d.sex, size: sizeK(d), friend: true, ribbon: frRibbonSVG() }, lookOpts(d, c))];
}
function frWalkDrop() { FRW.g = null; frGuestClear(); }
// the walk ended (finishWalkMod, endWalk). tName: the walk's treasure (its English name), if one was found. Returns the summary line, or ''
function frWalkEnd(tName) {
  const o = FRW.g; FRW.g = null; frGuestClear();
  if (!o || !S || !S.fr) return '';
  frDay();
  const who = frWalkWho(o);
  let n = 0;
  if (!S.fr.walked.includes(o.fid) && !frSentToday(o.fid, 'walk')) { // the first walk with this friend today: the coins (2 friends a day) and the walk event
    S.fr.walked = S.fr.walked.concat(o.fid).slice(-50); markDirty();
    if (S.fr.walks < FR_WALK_MAX) { S.fr.walks++; n = addCoins(FR_WALK_COINS); }
    frWalkSend(o, tName);
  }
  return `<p class="small fr-walked">${esc(n ? tt('fr.walk_paid', 'Walked with {who}: +{n}', { who, n: tnum(n) }) : tt('fr.walk_with', 'Walked with {who}.', { who }))}</p>`;
}
async function frWalkSend(o, tName) {
  const mine = frCardOf(S.dog) || ((frYardDogs()[0] || {}).x) || null; if (!mine) return false; // no dog the cards can show: nothing to send
  const data = { dog: o.dog, mine };
  const t = tName ? FR_GIFTS.indexOf(tName) : -1; if (t >= 0 && !FR_GIFT_OFF.includes(t)) data.t = t;
  let r = null;
  try { r = await frApi('POST', '/friends/send', { fid: o.fid, kind: 'walk', data }); } catch (e) { r = null; }
  if ((r && r.ok) || frErr(r) === 'limit') { frMarkSent(o.fid, 'walk'); return !!(r && r.ok); }
  return false;
}
// receiving: each walk event becomes a letter, at most FR_GOT_WALKS a day (the rest wait for tomorrow). With a treasure (t, an FR_GIFTS index) it is a gift to
// Collect; without one, just the letter. Saved before the claim, and S.fr.gotIds keeps an event that comes back (a failed claim) from giving twice. Returns the letters made
function frWalkLetters(events, claim) {
  if (typeof mailPush !== 'function') return 0;
  if (typeof mailFields === 'function') mailFields();
  let made = 0;
  events.forEach((ev) => {
    if (!ev || ev.kind !== 'walk' || !ev.from) return;
    const d = ev.data && typeof ev.data === 'object' ? ev.data : {}, id = 'fr_walk_' + ev.id;
    if (S.fr.gotIds.includes(ev.id) || (S.mail || []).some((m) => m && m.id === id)) { claim.push(ev.id); return; }
    const hasT = d.t != null;
    if (hasT && !(Number.isInteger(d.t) && d.t >= 0 && d.t < FR_GIFTS.length)) return; // an item from a newer copy waits for the update
    if (S.fr.gotWalks >= FR_GOT_WALKS) return; // waits for tomorrow
    S.fr.gotWalks++; S.fr.gotIds = S.fr.gotIds.concat(ev.id).slice(-60); markDirty();
    const g = hasT ? frGiftRef(d.t) : null; // a slot that may no longer be given: just the letter
    const name = frPairName(ev.from.name) || tt('fr.a_friend', 'A friend');
    let theirs = null; try { theirs = d.mine && typeof d.mine === 'object' ? dcDog({ id: 'fr:' + ev.from.fid, name: ev.from.name || [0, 0], dogs: [d.mine] }, 0) : null; } catch (e) { theirs = null; }
    const who = theirs ? tt('fr.walk_who', "{name}'s {dog}", { name, dog: theirs.name }) : name;
    // my dog it walked with: by the last snapshot I sent (S.fr.snap holds its dogs' ids), else my leader (code review 6)
    const sid = Number.isInteger(d.dog) && Array.isArray(S.fr.snap) ? S.fr.snap[d.dog] : null, me = sid != null ? (S.dogs || []).concat(S.dog || []).find((x) => x && x.id === sid) : null, dog = me ? me.name : NAME();
    const m = { id, from: name, title: tt('fr.walk_title', 'A walk with {who}', { who }), frDog: theirs ? d.mine : null };
    if (theirs) m.dog = theirs; // the postcard's photo (phone review 5)
    if (g) Object.assign(m, { kind: 'gift', text: tt('fr.walk_found', '{dog} went for a walk with {who} and found {item} for you!', { dog, who, item: g.name }), gift: { item: g.n, cat: g.cat, id: g.id, n: 1 } });
    else Object.assign(m, { kind: 'postcard', text: tt('fr.walk_text', '{dog} went for a walk with {who}!', { dog, who }) });
    mailPush(m);
    claim.push(ev.id); made++;
  });
  return made;
}
function enterFrYard() {
  if (!FRV.yard || !FRV.card) { setTimeout(() => { if (cur.mode === 'fryard') go('yard'); }, 0); return; }
  setChrome(true, true);
  stage.classList.add('frvisit'); onCleanup(() => stage.classList.remove('frvisit'));
  view.style.background = ''; view.style.removeProperty('--vfit'); view.style.removeProperty('--trayH');
  clearTimeout(phPanT); cancelAnimationFrame(camRaf); phPeekOn = false; phZoom = 1;
  view.innerHTML = frYardSVG(FRV.yard);
  frCam(); frBtns(); updateHUD(); frChip();
  frPan($('#view > svg.world')); frDrawDogs(); // the look-around button first, so the dogs keep clear of it
  cur.key = (e) => { if (e.key === 'Escape') { e.preventDefault(); SFX.click(); frHome(); } };
  const onHide = () => { if (document.visibilityState === 'hidden') frHome(); }; // the app went to the background: home again
  document.addEventListener('visibilitychange', onHide);
  const onSize = () => { const pk = $('#phPeek'); frCam(); frScan(); if (pk) pk.classList.remove('back'); };
  window.addEventListener('resize', onSize);
  onCleanup(() => { cur.key = null; cancelAnimationFrame(FRV.raf); FRV.raf = 0; FRV.dogs = []; FRV.gr = null; document.removeEventListener('visibilitychange', onHide); window.removeEventListener('resize', onSize); });
}

/* ---------- boot ---------- */
function frExpose() {
  if (!window.__paw || window.__paw.fr) return;
  window.__paw.fr = {
    on: () => frOn(), live: () => FR_LIVE, news: () => NEWS_V219, open: () => frOpen(),
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
    visit: (fid) => frVisit(fid), home: () => frHome(), sent: (fid, kind) => frSentToday(fid, kind),
    gifts: () => frGiftsOwned().map((g) => ({ i: g.i, n: g.n, cat: g.cat, have: frGiftHave(g) })), giftUsed: () => frGiftUsed(),
    giftRefs: () => FR_GIFTS.map((n, i) => { const g = frGiftRef(i); return g ? { i, n, cat: g.cat, id: g.id } : { i, n, cat: null }; }), people: () => PEOPLE_FB.map((x) => x.name),
    giftSheet: (fid) => frGiftSheet(fid, 'list'), sendGift: (fid, i) => frGiftSend(fid, i, null, ''),
    walkDogs: () => frWalkDogs().map((o) => ({ fid: o.fid, dog: o.dog, name: o.d.name, key: o.d.key })), guest: () => (S && S.fr ? S.fr.guest : null), walkGuest: () => (FRW.g ? { fid: FRW.g.fid, dog: FRW.g.dog } : null),
    walkFull: (k) => frWalkFull(k || ROUTE_KEYS[routeIdx]), econ: () => ({ one: FR_WALK_COINS, max: FR_WALK_MAX, cap: FR_WALK_COINS * FR_WALK_MAX, got: FR_GOT_WALKS }),
    cam: () => ({ x: FRC.x, w: FRC.w, home: FRC.home }), fit: (root) => frFit(root),
    greet: () => frGreet(), greeting: () => (FRV.gr ? { step: FRV.gr.i, pose: [FRV.gr.a.pose, FRV.gr.b.pose] } : null), // the greeting again on this visit (Marketing films it); where it is
    crop: () => FRV.crop && { x0: FRV.crop.x0, x1: FRV.crop.x1, y1: FRV.crop.y1, fit: FRV.fit, boxes: FRV.crop.boxes.map((b) => b.map(Math.round)) },
    scene: () => ({ mode: cur.mode, fid: FRV.fid, house: FRV.yard && FRV.yard.house, season: FRV.yard && FRV.yard.season, decor: FRV.yard ? FRV.yard.decor.map((d) => d.n) : [], dogs: FRV.dogs.map((v) => ({ mine: v.mine, name: v.dog.name, key: v.dog.key, pose: frPose(v), face: v.face, x: Math.round(v.x), y: Math.round(v.y), k: +v.k.toFixed(3), play: v.play, walking: !!v.tw })) })
  };
}
frReadInvite();
on('game:ready', () => { frExpose(); frDay(); setTimeout(() => { frHudSync(); frInboxSoon(true); frInviteTry(); }, 300); });
on('yard:enter', () => { frWalkDrop(); setTimeout(frInviteTry, 400); }); // part 5: a walk pick lasts until the walk; home again is "Just us"
on('game:ready', () => frGuestClear()); // part 5: a reload (also one in the middle of a walk) forgets the pick
window.addEventListener('focus', () => frInboxSoon(false));
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') frInboxSoon(false); });
setInterval(() => { try { frExpose(); frDay(); frHudSync(); frInviteTry(); } catch (e) { /* a tick never breaks the game */ } }, 4000);
