/* ======================= v2.11 DOG CARDS: opt-in public dog cards, visiting dogs and paws (V211.md section 5) =======================
   Lane CARDS owns this file and game/css/42_dogcards.css (tag dc, test hook __paw.dc). Save field S.dc (v211Fields in 00_core.js). No free text anywhere.
   A card is only indices into the append-only lists below (and PawGenes BREEDS, by position) plus coat alleles: the Worker
   (cloudflare/worker.js, DC_LIM) checks every field and refuses anything else, so nothing a player typed ever reaches another player.
   The lists only ever grow at the end. When one grows, raise its count in the Worker's DC_LIM in the same release (test_v211_cards checks).
   Modes (dcMode): 'on' with cloud save on and a session (guests see visitors and give paws, only email accounts share a card),
   'fake' on the claude.ai artifact and under the test harness (unless window.__pawCloudMock), 'off' otherwise. Visitors come from DC_FAKE
   whenever the Worker can't fill a scene (fake, off, offline, or fewer than 2 cards). */

/* ---------------- the lists (append only) ---------------- */
const DC_WORDS_A = ['Sunny', 'Happy', 'Cozy', 'Fluffy', 'Sleepy', 'Jolly', 'Lucky', 'Merry', 'Gentle', 'Bouncy', 'Cheery', 'Snug', 'Brave', 'Bright', 'Calm', 'Kind', 'Little', 'Lovely', 'Mellow', 'Plucky',
  'Rosy', 'Sparkly', 'Sweet', 'Swift', 'Tiny', 'Waggy', 'Warm', 'Wiggly', 'Zippy', 'Golden', 'Breezy', 'Dreamy', 'Friendly', 'Giggly', 'Misty', 'Peppy', 'Starry', 'Toasty', 'Fuzzy', 'Dapper'];
const DC_WORDS_B = ['Biscuit', 'Pancake', 'Dewdrop', 'Acorn', 'Button', 'Cloud', 'Clover', 'Comet', 'Cookie', 'Daisy', 'Feather', 'Fern', 'Kite', 'Lantern', 'Maple', 'Meadow', 'Mitten', 'Moon', 'Marigold', 'Otter',
  'Pebble', 'Pine', 'Pumpkin', 'Rainbow', 'Robin', 'Sock', 'Sprout', 'Star', 'Sunflower', 'Teacup', 'Toast', 'Tulip', 'Waffle', 'Willow', 'Paw', 'Snowflake', 'Bubble', 'Blossom', 'Breeze', 'Puffin'];
// 80 common pet names, then one name word per breed in PawGenes BREEDS order (the default card name of a dog whose own name is not here)
const DC_PET_NAMES = ['Mochi', 'Noodle', 'Biscuit', 'Bella', 'Luna', 'Max', 'Charlie', 'Daisy', 'Lucy', 'Cooper', 'Bailey', 'Buddy', 'Rocky', 'Coco', 'Milo', 'Teddy', 'Rosie', 'Bear', 'Duke', 'Sadie',
  'Molly', 'Toby', 'Ruby', 'Oscar', 'Penny', 'Maple', 'Ginger', 'Pepper', 'Hazel', 'Olive', 'Winston', 'Leo', 'Ollie', 'Finn', 'Gus', 'Murphy', 'Rex', 'Rusty', 'Scout', 'Ziggy',
  'Lola', 'Nala', 'Stella', 'Zoe', 'Willow', 'Honey', 'Peanut', 'Waffles', 'Pancake', 'Muffin', 'Cookie', 'Tofu', 'Kuma', 'Hana', 'Sora', 'Yuki', 'Momo', 'Kiki', 'Taro', 'Pip',
  'Bean', 'Button', 'Sunny', 'Lucky', 'Bingo', 'Rufus', 'Benji', 'Archie', 'Frankie', 'Louie', 'Marley', 'Maggie', 'Poppy', 'Sasha', 'Tilly', 'Sammy', 'Bruno', 'Otis', 'Juno', 'Chip'];
const DC_BREED_WORDS = ['Shiba', 'Corgi', 'Golden', 'Dachshund', 'Husky', 'Mutt', 'Chihuahua', 'Pug', 'Greyhound', 'Beagle', 'Poodle', 'Collie', 'Samoyed', 'Frenchie', 'Akita', 'Spitz', 'Pom', 'Hound', 'Dane', 'Mastiff', 'Shepherd',
  'Dobie', 'Corso', 'Pittie', 'Pinscher', 'Lab', 'Malamute', 'Chow', 'Big Poodle', 'Schnauzer', 'Westie', 'Yorkie', 'Bichon', 'Maltese', 'Shih Tzu']; // v2.12: the fourteen (V212.md 2)
const DC_DOG_NAMES = DC_PET_NAMES.concat(DC_BREED_WORDS);
// v2.14 (V214.md 4.3): Dog Cards stay language-neutral. The Worker, the saves and the lists keep only indices; each viewer sees the word at an index in
// their own language. DC_PET_NAMES are names and never change. The lists stay append only, in every language
const dcWordA = (i) => tdata('dc_words_a.' + i, DC_WORDS_A[i]);
const dcWordB = (i) => tdata('dc_words_b.' + i, DC_WORDS_B[i]);
const dcBreedWord = (i) => tdata('dc_breed_words.' + i, DC_BREED_WORDS[i]);
const dcNameShown = (i) => (i < DC_PET_NAMES.length ? DC_DOG_NAMES[i] : dcBreedWord(i - DC_PET_NAMES.length)); // a card dog name (an index into DC_DOG_NAMES) as shown
// every wearable a card can show (one per dog): the shop clothes, the treasure wearables, the v2.11 Tokyo bandanas, the v2.11.1 Halloween costumes (append only)
const DC_OUTFITS = ['Red Bandana', 'Party Hat', 'Bow Tie', 'Flower Crown', 'Heart Sunglasses', 'Yellow Raincoat', 'Polka-dot Raincoat', 'Frog Raincoat', 'Bubble Raincoat', 'Rain Hat',
  'Pom-pom Beanie', 'Knit Winter Sweater', 'Superhero Cape', 'Sailor Collar', 'Chef Hat', 'Tutu', 'Cowboy Hat', 'Pyjamas', 'Bumblebee Suit', 'Wizard Hat',
  'Happi Coat', 'Cozy Hoodie', 'Knit Scarf', 'Leaf Beret', 'Autumn Scarf', 'Ghost Sheet', 'Pumpkin Suit', 'Parade Rosette', 'Witch Hat', 'Vampire Cape',
  'Candy Corn Bandana', 'Bat Wings', 'Very Ugly Sweater', 'Reindeer Antlers', 'Snowflake Snood', 'Ugly Sweater Rosette', 'Year of the Sheep Hood', 'Astronaut Helmet',
  'Acorn Cap', 'Explorer Goggles', 'Seashell Necklace', 'Mossy Poncho', 'Clover Collar', 'Sun Hat', 'Shibuya Bandana', 'Asakusa Bandana', 'Tokyo Tower Bandana',
  'Pumpkin Patch Suit', 'Trick-or-Treat Ghost', 'Little Bat Costume'];
const DC_LOCI = { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'sp'], M: ['M', 'm'], Bl: ['Bl', 'bl'] }; // the Worker's DC_COAT
const DC_PLACES = ['dogpark', 'yoyogi'];
const DC_MAX_DOGS = 4, DC_VIS_CARDS = 2, DC_VIS_DOGS = 3;

/* ---------------- the town players: 11 preset cards (fake mode, and to fill up a scene; v2.12 appended town-9 to town-11) ---------------- */
// genes: 12 allele tokens in B D E S M Bl order. b: the PawGenes BREEDS index (a copy of the game that does not know that breed yet
// leaves the dog out; 17 to 20 are afghan, dane, mastiff, gsd, 21 to 34 the v2.12 fourteen). o: an outfit name from DC_OUTFITS.
const dcGenes = (s) => { const t = s.split(' '), g = {}; Object.keys(DC_LOCI).forEach((k, i) => { g[k] = [t[2 * i], t[2 * i + 1]]; }); return g; };
const dcFk = (b, nm, genes, o, a, s, sp) => ({ b, c: dcGenes(genes), o: o ? DC_OUTFITS.indexOf(o) : -1, a: a || 'adult', s: s || 'f', sp: sp ? 1 : 0, n: DC_DOG_NAMES.indexOf(nm) });
const DC_FAKE = [
  { id: 'town-1', fake: true, name: [2, 3], paws: 14, dogs: [dcFk(0, 'Mochi', 'B b D d e e S S m m bl bl', 'Red Bandana'), dcFk(1, 'Biscuit', 'B B D D e e S sp m m bl bl', null, 'pup', 'm'), dcFk(14, 'Kuma', 'B B D D e e S S m m bl bl', null, 'adult', 'm')] },
  { id: 'town-2', fake: true, name: [0, 1], paws: 9, dogs: [dcFk(2, 'Honey', 'B b D D e e S S m m bl bl', 'Flower Crown'), dcFk(3, 'Peanut', 'b b D D E E S S m m bl bl', null, 'adult', 'm')] },
  { id: 'town-3', fake: true, name: [5, 7], paws: 23, dogs: [dcFk(4, 'Yuki', 'B B D d E e S sp m m Bl Bl', 'Knit Scarf', 'adult', 'm'), dcFk(12, 'Sora', 'B b D D e e S S m m bl bl', 'Party Hat')] },
  { id: 'town-4', fake: true, name: [7, 6], paws: 6, dogs: [dcFk(5, 'Bean', 'B b D d E e sp sp m m bl bl', null, 'adult', 'm'), dcFk(6, 'Kiki', 'B b D d e e S S m m bl bl', null, 'pup', 'f', true), dcFk(7, 'Taro', 'B b D D e e S S m m bl bl', 'Bow Tie', 'adult', 'm')] },
  { id: 'town-5', fake: true, name: [8, 33], paws: 11, dogs: [dcFk(8, 'Juno', 'B B d d E e S sp m m bl bl', 'Cozy Hoodie'), dcFk(9, 'Cooper', 'B b D D E e S sp m m bl bl', null, 'adult', 'm')] },
  { id: 'town-6', fake: true, name: [9, 32], paws: 17, dogs: [dcFk(10, 'Coco', 'B b D d e e S S m m bl bl', 'Tutu'), dcFk(11, 'Scout', 'B b D D E E S sp M m bl bl', 'Red Bandana', 'adult', 'm')] },
  { id: 'town-7', fake: true, name: [36, 13], paws: 4, dogs: [dcFk(13, 'Louie', 'B B D d e e S S m m bl bl', 'Sailor Collar', 'adult', 'm')] },
  { id: 'town-8', fake: true, name: [37, 2], paws: 8, dogs: [dcFk(15, 'Momo', 'B B D D e e S S m m bl bl', 'Happi Coat'), dcFk(16, 'Pip', 'B b D d e e S sp m m bl bl', null, 'pup', 'm')] },
  // v2.12: three more town players, with the v2.11 big breeds and some of the fourteen
  { id: 'town-9', fake: true, name: [12, 25], paws: 12, dogs: [dcFk(25, 'Bear', 'B b D D e e S S m m bl bl', 'Knit Scarf', 'adult', 'm'), dcFk(23, 'Rosie', 'B b d d E e S sp m m bl bl', 'Flower Crown'), dcFk(34, 'Button', 'B b D d e e sp sp m m bl bl', null, 'pup', 'f')] },
  { id: 'town-10', fake: true, name: [20, 14], paws: 7, dogs: [dcFk(17, 'Ginger', 'B b D d e e S S m m bl bl', 'Bow Tie'), dcFk(18, 'Duke', 'B b D d e e S S m m bl bl', null, 'adult', 'm'), dcFk(30, 'Ziggy', 'B B D D e e S S m m bl bl', 'Pumpkin Patch Suit', 'adult', 'm')] },
  { id: 'town-11', fake: true, name: [28, 6], paws: 15, dogs: [dcFk(19, 'Bruno', 'B b D D e e S S m m bl bl', null, 'adult', 'm'), dcFk(20, 'Rex', 'B b D D E e S S m m bl bl', 'Red Bandana', 'adult', 'm'), dcFk(27, 'Hana', 'B b D d e e S S m m bl bl', 'Little Bat Costume', 'pup', 'f')] }
];

/* ---------------- mode and helpers ---------------- */
const DC = { place: '', cards: null, vis: [], pos: {}, tagFs: 19, raf: 0, last: 0, chk: 0, uid: null, mine: null, syncAt: 0, syncP: null, seq: 0, fetchP: null, pick: null };
function dcMode() {
  if (CL.why === 'artifact' || (navigator.webdriver && !window.__pawCloudMock)) return 'fake';
  return CL.on && CL.uid && clTok() ? 'on' : 'off';
}
const dcAcct = () => dcMode() === 'on' && !CL.anon && !!CL.email; // only email accounts share a card
const dcOptIn = () => !!S && S.dc.on && !!CL.uid && S.dc.uid === CL.uid; // switched on by this account (a save that stays on a device after a log out never shares for the next account)
const dcBreeds = () => { const G = PGN(); return (G && G.BREEDS) || []; };
const dcDay = () => jstISO(); // one day for the paws on both sides: the Worker counts them by the Japan day too (dcDay in worker.js)
const dcCardName = (c) => tt('cards.name_pattern', '{a} {b}', { a: dcWordA(c.name[0]), b: dcWordB(c.name[1]) }); // the card name order is the translator's (fr, es, pt may write {b} {a})
const dcGiven = (c) => S && S.dc.given[c.id] === dcDay();
const dcPawsOf = (c) => (c.paws | 0) + (c.fake && dcGiven(c) ? 1 : 0); // a paw to a town player stays in this save
function dcPrune() { const y = new Date(Date.now() + 9 * 3600e3 - 864e5).toISOString().slice(0, 10); Object.keys(S.dc.given).forEach((k) => { if (!(S.dc.given[k] >= y)) delete S.dc.given[k]; }); }
// a card dog -> a dog object the game's art draws (null when this copy of the game does not know its breed yet)
function dcDog(c, i) {
  const x = c.dogs[i], key = dcBreeds()[x.b]; if (!key) return null;
  const G = PGN(), base = (G && G.STARTER_GENES && (G.STARTER_GENES[key] || G.STARTER_GENES.shiba)) || null;
  const genes = x.c && typeof x.c === 'object' ? Object.assign({}, base || {}, x.c) : base;
  const wear = x.o >= 0 ? ALL_WEAR.find((w) => w.n === DC_OUTFITS[x.o]) : null, outfit = { head: null, eyes: null, neck: null, body: null };
  if (wear) outfit[wear.slot] = wear.n;
  const d = { id: `dcv:${c.id}:${i}`, key, genes, sex: x.s === 'f' ? 'female' : 'male', sparkle: !!x.sp, name: DC_DOG_NAMES[x.n] ? dcNameShown(x.n) : DC_BREED_WORDS[x.b] ? dcBreedWord(x.b) : tt('cards.pup', 'Pup'), outfit };
  if (x.a === 'pup') d.born = localISO(new Date(Date.now() - 3 * 864e5)); // a puppy: about 3 dog months old
  return d;
}
// a card this copy can show: name words and at least one dog it knows
function dcShowable(c) {
  if (!c || typeof c.id !== 'string' || !Array.isArray(c.name) || !Array.isArray(c.dogs) || DC_WORDS_A[c.name[0]] == null || DC_WORDS_B[c.name[1]] == null) return false;
  return c.dogs.some((x, i) => x && DC_DOG_NAMES[x.n] != null && !!dcDog(c, i));
}
async function dcApi(method, path, body) { const r = await clApi(method, path, body); return r; }

/* ---------------- my card (the payload) ---------------- */
function dcOwnNameIdx(d) { const i = DC_DOG_NAMES.findIndex((n) => n.toLowerCase() === String(d.name || '').trim().toLowerCase()); return i; }
function dcDefaultNm(d) { const own = dcOwnNameIdx(d); if (own >= 0) return own; const b = dcBreeds().indexOf(d.key); return b >= 0 && b < DC_BREED_WORDS.length ? DC_PET_NAMES.length + b : 0; }
function dcOutfitIdx(d) { const o = d.outfit || {}; for (const s of ['body', 'neck', 'head', 'eyes']) { const i = DC_OUTFITS.indexOf(o[s]); if (i >= 0) return i; } return -1; }
function dcCoat(d) {
  const g = d.genes; if (!g || typeof g !== 'object') return null;
  const out = {}; Object.keys(DC_LOCI).forEach((k) => { const v = g[k]; if (Array.isArray(v) && v.length === 2 && v.every((a) => DC_LOCI[k].includes(a))) out[k] = [v[0], v[1]]; });
  return Object.keys(out).length ? out : null;
}
function dcDogOf(d, nm) {
  const own = dcOwnNameIdx(d), n = own >= 0 ? own : (typeof nm === 'number' && DC_DOG_NAMES[nm] != null ? nm : dcDefaultNm(d)); // its own name when the list has it
  return { b: dcBreeds().indexOf(d.key), c: dcCoat(d), o: dcOutfitIdx(d), a: ageMonths(d) < 6 ? 'pup' : 'adult', s: d.sex === 'female' ? 'f' : 'm', sp: d.sparkle ? 1 : 0, n };
}
const dcCanShow = (d) => !!d && dcBreeds().indexOf(d.key) >= 0;
function dcPayload(dc) {
  dc = dc || S.dc;
  const dogs = (dc.dogs || []).map((x) => ({ x, d: dogById(x.id) })).filter((o) => dcCanShow(o.d)).slice(0, DC_MAX_DOGS).map((o) => dcDogOf(o.d, o.x.nm));
  const nm = Array.isArray(dc.name) && DC_WORDS_A[dc.name[0]] != null && DC_WORDS_B[dc.name[1]] != null ? dc.name.slice(0, 2) : [0, 0];
  return { name: nm, dogs };
}
const dcSame = (a, b) => !!a && !!b && JSON.stringify({ name: a.name, dogs: a.dogs }) === JSON.stringify({ name: b.name, dogs: b.dogs });

/* ---------------- the card sheet ---------------- */
function dcDogFig(c, i, pose) {
  const d = dcDog(c, i); if (!d) return '';
  const x = c.dogs[i], coat = coatNameOf(d);
  return `<figure class="dc-dog"><span class="dc-art">${dogSVG(d, { pose: pose || 'sit', outfit: d.outfit })}</span><figcaption><b>${esc(d.name)}</b> ${sexSym(d.sex)}<span>${esc(coat ? tt('cards.breed_coat', '{breed} · {coat}', { breed: dogInfo(d.key).breed, coat }) : dogInfo(d.key).breed)}</span><span>${esc(tt('cards.age_line', '{age, select, pup {Puppy} other {Grown-up}}{sparkle, select, yes { · Sparkly} other {}}', { age: x.a === 'pup' ? 'pup' : 'adult', sparkle: x.sp ? 'yes' : 'no' }))}</span></figcaption></figure>`;
}
const dcPawWord = (n) => tt('cards.paws_html', '{n, plural, one {<b>#</b> paw} other {<b>#</b> paws}}', { n });
function dcCardBody(c, note) {
  const n = dcPawsOf(c);
  return `<div class="dc-card"><p class="dc-paws"><span class="dc-pawic">${artReal('item', 'Paw') ? place(artReal('item', 'Paw'), 0, 0, 30, 30) : '<svg viewBox="0 0 30 30" aria-hidden="true"><g fill="#F28FA5" stroke="#5B3D32" stroke-width="1.6"><ellipse cx="15" cy="19" rx="7" ry="6"/><circle cx="7" cy="11" r="3"/><circle cx="12" cy="7" r="3"/><circle cx="18" cy="7" r="3"/><circle cx="23" cy="11" r="3"/></g></svg>'}</span><span class="dc-pawn">${dcPawWord(n)}</span></p><div class="dc-dogs">${c.dogs.map((x, i) => dcDogFig(c, i)).join('')}</div>${note ? `<p class="small">${note}</p>` : ''}</div>`;
}
function dcCard(c) {
  if (!c || !dcShowable(c)) return null;
  SFX.boop(700);
  const given = dcGiven(c);
  const p = openModal(esc(dcCardName(c)), dcCardBody(c, esc(tt('cards.from_player', 'A Dog Card from another player. Their dogs are visiting today.'))), { cls: 'dcpop', foot: `<button class="btn" id="dcHide">${esc(tt('cards.hide', 'Hide this card'))}</button><button class="btn yes big" id="dcPaw" ${given ? 'aria-disabled="true"' : ''}>${esc(given ? tt('cards.paw_given', 'Paw given today') : tt('cards.give_paw', 'Give a paw'))}</button>` });
  p.dataset.dcCard = c.id;
  $('#dcPaw', p).onclick = () => { if ($('#dcPaw', p).getAttribute('aria-disabled') === 'true' && !dcGiven(c)) return; dcGive(c, p); }; // a paw on its way: a second tap waits
  $('#dcHide', p).onclick = async () => {
    SFX.click();
    const ok = await confirmIn(p, tt('cards.hide_ask', 'Hide this card? Its dogs will not visit you again.'), tt('cards.hide_it', 'Hide it'), tt('cards.keep_it', 'Keep it')); if (!ok) return;
    if (!S.dc.hide.includes(c.id)) S.dc.hide.push(c.id); if (S.dc.hide.length > 200) S.dc.hide.splice(0, S.dc.hide.length - 200);
    markDirty(); DC.cards = (DC.cards || []).filter((x) => x.id !== c.id); dcDrop(c.id); closeModal();
    toast(tt('cards.hidden', '{name} is hidden. Those dogs will not visit again.', { name: dcCardName(c) }), 'good');
  };
  return p;
}
async function dcGive(c, p) {
  if (dcGiven(c)) { nope(tt('cards.already_gave', 'You already gave {name} a paw today. Come back tomorrow.', { name: dcCardName(c) })); return false; }
  const btn = p && $('#dcPaw', p); if (btn) btn.setAttribute('aria-disabled', 'true');
  if (!c.fake) {
    if (dcMode() !== 'on') { if (btn) btn.removeAttribute('aria-disabled'); nope(tt('cards.paw_cloud', 'Paws need the cloud. Try again in a moment.')); return false; }
    let r = null; try { r = await dcApi('POST', '/paw', { id: c.id }); } catch (e) { r = null; }
    if (!r || !r.ok || !r.data) { if (btn) btn.removeAttribute('aria-disabled'); nope(r && r.status === 404 ? tt('cards.gone', 'That card is not shared any more.') : tt('cards.paw_cloud', 'Paws need the cloud. Try again in a moment.')); return false; }
    c.paws = r.data.paws | 0;
    if (r.data.given === false) { // the Worker already has a paw from this account today (another device, or a race)
      S.dc.given[c.id] = dcDay(); dcPrune(); markDirty();
      if (p && p.dataset.dcCard === c.id) { if (btn) btn.textContent = tt('cards.paw_given', 'Paw given today'); const pw = $('.dc-pawn', p); if (pw) pw.innerHTML = dcPawWord(dcPawsOf(c)); }
      toast(tt('cards.got_paw', '{name} already got your paw today. Come back tomorrow.', { name: dcCardName(c) }), 'good'); return false;
    }
  }
  S.dc.given[c.id] = dcDay(); dcPrune(); markDirty(); trackAct('paw', { id: c.id });
  SFX.boop(860);
  if (p && p.dataset.dcCard === c.id) { if (btn) btn.textContent = tt('cards.paw_given', 'Paw given today'); const pw = $('.dc-pawn', p); if (pw) pw.innerHTML = dcPawWord(dcPawsOf(c)); }
  const v = DC.vis.find((o) => o.card.id === c.id); if (v) { const k = v.k; fxText('♥', v.x, v.y - 170 * k); setTimeout(() => fxText('♥', v.x + 18, v.y - 196 * k), 200); }
  toast(tt('cards.gave', 'You gave {name} a paw. Their dogs wag.', { name: dcCardName(c) }), 'good');
  return true;
}

/* ---------------- visitors: which cards ---------------- */
function dcFakes(n, not) { const pool = DC_FAKE.filter((c) => !not.includes(c.id) && !S.dc.hide.includes(c.id) && dcShowable(c)); const out = []; while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]); return out; }
async function dcPickCards() {
  if (DC.pick) return DC.pick.map((id) => DC_FAKE.find((c) => c.id === id) || (DC.cards || []).find((c) => c.id === id)).filter(dcShowable); // a test hook pinned them
  let got = [];
  if (dcMode() === 'on') {
    try {
      const not = S.dc.hide.filter((id) => /^[A-Za-z0-9_-]{22}$/.test(id)).slice(-40).join(',');
      const r = await dcApi('GET', `/cards/visit?n=${DC_VIS_CARDS + 1}${not ? '&not=' + not : ''}`);
      if (r.ok && Array.isArray(r.data)) got = r.data.filter((c) => dcShowable(c) && !S.dc.hide.includes(c.id) && !(DC.mine && c.id === DC.mine.id)).slice(0, DC_VIS_CARDS);
    } catch (e) { got = []; }
  }
  return got.concat(dcFakes(DC_VIS_CARDS - got.length, got.map((c) => c.id))); // fewer than 2 real cards: town players fill up
}

/* ---------------- visitors: placing and roaming (inside rmZone, at rmScale x the size class (dcK), held by the roam holds) ---------------- */
const dcTapHeld = () => (typeof blOn === 'function' && blOn()) || (typeof phActive === 'function' && phActive()) || !!TRN; // ball play, photo mode, training own the taps
const dcHeld = () => !rmOn() || !modal.hidden || (typeof blOn === 'function' && blOn()) || (typeof phActive === 'function' && phActive()) || !!TRN;
const dcK = (v, y) => rmScale(y) * (v ? sizeK(v.dog) : 1); // v2.11.1: a visitor's drawn scale (depth times its size class)
function dcCrop() { if (!isPhone()) { if (grWide()) { const c = grCam(); return [c.x, c.x + c.w]; } return [0, 1000]; } const w = rmCropW(), c = phCamHome; return [c - w / 2, c + w / 2]; } // phones: the home crop
// the box a spot must stay clear of: every tappable thing (rmScan's boxes; feet only for big scenery), every player dog's tap rect where it is and
// where it is going, the other visitors, and on phones the edges of the crop
function dcOk(v, x, y) {
  const z = rmZoneOf(S.place); if (x < z.x0 || x > z.x1 || y < z.y0 || y > z.y1) return false; if (z.poly && !grIn(z.poly, x, y)) return false; // v2.15: the floor polygon
  const k = dcK(v, y), T = rmTapBox(x, y, k), cr = dcCrop();
  if (T[0] < cr[0] + 4 || T[0] + T[2] > cr[1] - 4 || T[1] < 0) return false;
  if (rmHard(x, y)) return false;
  if (rmBoxes().some((b) => b[4] !== 'scene' && b[4] !== 'dctag' && rmOver(T, b) > 0)) return false; // (the visitors' own tags are drawn under the visitors: not a box for them)
  // #dcVis is drawn behind #pack, so a player dog's tap rect always stays on top. A visitor may stand partly behind a player dog (further back,
  // where it is also drawn behind), never in front of one, and keeps at least 55% of its own tap rect clear for its own tap
  let hid = 0;
  for (const d of rmDogs()) {
    const r = rmSt(d), dst = rmDest(d);
    for (const [px, py, pk] of [[r.x, r.y, rmK(r)], dst]) { const o = rmOver(T, rmTapBox(px, py, pk)); if (o > 0 && y > py - 12) return false; hid = Math.max(hid, o); }
  }
  if (hid > 0.45 * T[2] * T[3]) return false;
  // the other visitors (drawn back to front among themselves): at most a third of each other's tap rects, where they are and where they go
  return !DC.vis.some((o) => o !== v && (rmOver(T, rmTapBox(o.x, o.y, o.k)) > T[2] * T[3] / 3 || (o.tw && rmOver(T, rmTapBox(o.tw.x1, o.tw.y1, dcK(o, o.tw.y1))) > T[2] * T[3] / 3)));
}
function dcSpots(v, near) {
  const z = rmZoneOf(S.place), out = [];
  for (let y = z.y0; y <= z.y1; y += 14) for (let x = z.x0; x <= z.x1; x += 20) if ((!near || (Math.abs(x - near[0]) < 150 && Math.abs(y - near[1]) < 60)) && dcOk(v, x, y)) out.push([x, y]);
  const fs = isPhone() ? dcTagFs(sizeK(v.dog)) : DC.tagFs || 19, free = out.filter((p) => dcTagFree(v, p[0], p[1], fs)); return free.length || near ? free : out; // v2.12 LAYOUT: spots whose "visitor" tag no player dog covers first (a loop leg, near: only those, or it waits)
}
// v2.12 LAYOUT: no player dog (where it is and where it goes, its tap rect raised by a sixth as in rmSoft) covers more than 8% of the visitor's tag at
// feet x, y. The player dogs keep off the tags themselves (rmScan 'dctag'); this keeps a visitor from walking its tag under them
function dcTagFree(v, x, y, fs) {
  const k = dcK(v, y), w = 88 * fs / 19 * k, h = 25 * fs / 19 * k, TG = [x - w / 2, y + 10 * k, w, h];
  return !rmDogs().some((d) => { const r = rmSt(d); return [[r.x, r.y, rmK(r)], rmDest(d)].some(([px, py, pk]) => { const U = rmTapBox(px, py, pk); return rmOver([U[0], U[1] - U[3] / 6, U[2], U[3] * 7 / 6], TG) > TG[2] * TG[3] * 0.08; }); });
}
// a walk: the feet never cross a no-go box, and (taps: true) the tap rect never passes over a tappable spot on the way, so a visitor walking
// under a sign never takes its tap
function dcLineOk(x0, y0, x1, y1, taps, v) { // v: the walking visitor (its size class)
  const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 16)), hots = taps ? rmBoxes().filter((b) => b[4] !== 'scene' && b[4] !== 'dctag') : [];
  for (let i = 1; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t; if (rmHard(x, y)) return false; if (hots.length) { const T = rmTapBox(x, y, v ? dcK(v, y) : rmScale(y)); if (hots.some((b) => rmOver(T, b) > 0)) return false; } }
  return true;
}
// the "visitor" tag's font size in world units: 19, and on phones big enough for 13 px (PHONE.md's caption minimum) at the smallest depth scale
function dcTagFs(sz) { // sz: the visitor's size class (v2.11.1: a small dog's tag is drawn a little bigger in its own units, so it still reads at 13 px)
  if (!isPhone()) return 19;
  const svg = $('#view > svg.world'), M = svg && svg.getScreenCTM(), px = M ? Math.hypot(M.a, M.b) : 1;
  return Math.max(19, 13.6 / (rmScale(rmZoneOf(S.place).y0) * (sz || 1) * px));
}
function dcVisSVG(v, i) {
  const d = v.dog, pose = v.tw ? 'walk' : v.pose, ex = exNow(d, pose); v.drawn = pose + '|' + v.face + (ex ? '|' + ex : ''); // v2.13: the face (41_expressions.js)
  const fs = isPhone() ? dcTagFs(sizeK(d)) : DC.tagFs || 19, w = 88 * fs / 19, h = 25 * fs / 19;
  const tag = `<g class="dc-tag" pointer-events="none" transform="translate(430 512)"><rect x="${f1(-w / 2)}" y="-2" width="${f1(w)}" height="${f1(h)}" rx="8" fill="#FFF3DA" stroke="#5B3D32" stroke-width="2"/><text y="${f1(h * 0.68)}" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="${f1(fs)}" fill="#5B3D32">${esc(tt('cards.visitor_tag', 'visitor'))}</text></g>`;
  return `<g class="dcvis" data-dcv="${i}" data-card="${esc(v.card.id)}" tabindex="0" role="button" aria-label="${esc(tt('cards.visitor_aria', '{dog}, visiting with {card}. Tap for the Dog Card.', { dog: d.name, card: dcCardName(v.card) }))}"${v.hidden ? ' style="display:none"' : ''}><g class="dc-at" transform="${dcXf(v)}"><rect class="dc-hit" x="${DX + 44}" y="${DY + 35}" width="${DW - 88}" height="180" fill="transparent"/><g class="dc-art">${place(dogSVG(d, ex ? { pose, outfit: d.outfit, facing: v.face, expr: ex } : { pose, outfit: d.outfit, facing: v.face }), DX, DY, DW, DH)}</g>${tag}</g></g>`;
}
const dcXf = (v) => `translate(${f1(v.x)} ${f1(v.y)}) scale(${v.k.toFixed(3)}) translate(-430 -500)`;
function dcEl(v) { return $(`#dcVis [data-dcv="${DC.vis.indexOf(v)}"]`); }
function dcPaint(v) {
  const el = dcEl(v); if (!el) return; el.style.display = v.hidden ? 'none' : '';
  const at = el.querySelector('.dc-at'); if (at) at.setAttribute('transform', dcXf(v));
  const pose = v.tw ? 'walk' : v.pose, ex = exNow(v.dog, pose), key = pose + '|' + v.face + (ex ? '|' + ex : ''); if (key === v.drawn) return; v.drawn = key; // v2.13: a face change redraws this visitor
  const a = el.querySelector('.dc-art'); if (a) a.innerHTML = place(dogSVG(v.dog, exOpt(v.dog, pose, { pose, outfit: v.dog.outfit, facing: v.face })), DX, DY, DW, DH);
}
function dcOrder() { const g = $('#dcVis'); if (!g) return; const els = DC.vis.map((v) => dcEl(v)).filter(Boolean), want = els.slice().sort((a, b) => DC.vis[+a.dataset.dcv].y - DC.vis[+b.dataset.dcv].y); if (want.some((e, i) => g.children[i] !== e)) want.forEach((e) => g.appendChild(e)); }
// draw the picked cards' dogs in the scene: up to 2 cards, at most 3 dogs, each on a free spot
function dcDraw(cards) {
  const svg = $('#view > svg.world'), pack = svg && $('#pack', svg); if (!pack || !S || !DC_PLACES.includes(S.place)) return;
  dcClear(); rmScan(); DC.tagFs = dcTagFs();
  const per = cards.length > 1 ? [Math.min(2, cards[0].dogs.length), DC_VIS_DOGS] : [DC_VIS_DOGS];
  cards.forEach((c, ci) => {
    let n = 0;
    c.dogs.forEach((x, i) => {
      if (DC.vis.length >= DC_VIS_DOGS || n >= per[ci] || (ci === 0 && cards.length > 1 && DC.vis.length >= DC_VIS_DOGS - 1)) return;
      const dog = dcDog(c, i); if (!dog) return;
      const v = { card: c, i, dog, x: 0, y: 0, k: 1, face: Math.random() < 0.5 ? 'left' : 'right', pose: PICK(['idle', 'sit', 'happy']), tw: null, wait: 0, home: null, hidden: false, drawn: '' };
      const was = DC.pos[c.id + ':' + i]; // back in the same place (the scene was rebuilt): where it stood, if that spot is still free
      if (was && dcOk(v, was.x, was.y)) { v.x = was.x; v.y = was.y; v.face = was.face; v.home = was.home; }
      else { const sp = dcSpots(v); if (!sp.length) return; const at = PICK(sp); v.x = at[0]; v.y = at[1]; v.home = at.slice(); }
      v.k = dcK(v, v.y); v.wait = performance.now() + RINT(1500, 5000);
      DC.vis.push(v); n++;
    });
  });
  if (!DC.vis.length) return;
  pack.insertAdjacentHTML('beforebegin', `<g id="dcVis">${DC.vis.map((v, i) => dcVisSVG(v, i)).join('')}</g>`);
  document.querySelectorAll('#dcVis .dcvis').forEach((el) => {
    const open = (e) => { if (e) e.stopPropagation(); const v = DC.vis[+el.dataset.dcv]; if (v && !dcTapHeld()) dcCard(v.card); };
    el.addEventListener('click', open); el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(e); } });
  });
  dcOrder(); dcLoop();
}
function dcClear() { dcKeep(); cancelAnimationFrame(DC.raf); DC.raf = 0; DC.vis = []; const g = $('#dcVis'); if (g) g.remove(); }
function dcKeep() { DC.vis.forEach((v) => { const w = v.tw; DC.pos[v.card.id + ':' + v.i] = { x: w ? w.x1 : v.x, y: w ? w.y1 : v.y, face: v.face, home: v.home }; }); }
function dcDrop(cardId) { const keep = DC.vis.filter((v) => v.card.id !== cardId); if (keep.length === DC.vis.length) return; const cards = []; keep.forEach((v) => { if (!cards.includes(v.card)) cards.push(v.card); }); const pos = keep.map((v) => [v.x, v.y, v.face]); dcDraw(cards); DC.vis.forEach((v, i) => { if (pos[i]) { v.x = pos[i][0]; v.y = pos[i][1]; v.k = dcK(v, v.y); v.face = pos[i][2]; dcPaint(v); } }); }
// one leg of a visitor's small loop: a free spot near its home, straight there at a walk
function dcNext(v, now) {
  const sp = dcSpots(v, v.home).filter((p) => Math.hypot(p[0] - v.x, p[1] - v.y) > 50 && dcLineOk(v.x, v.y, p[0], p[1], true, v));
  if (!sp.length) { v.wait = now + RINT(2000, 4000); return; }
  const p = PICK(sp), dist = Math.hypot(p[0] - v.x, p[1] - v.y);
  v.tw = { x0: v.x, y0: v.y, x1: p[0], y1: p[1], k0: v.k, t0: now, dur: (dist / RM_WALK) * 1000 }; v.face = p[0] < v.x ? 'left' : 'right'; dcPaint(v);
}
// a player dog walked onto a visitor (or a prop arrived): the visitor steps aside, or waits out of sight until there is room
function dcClearOf(v, now) {
  if (v.tw) return; const ok = dcOk(v, v.x, v.y); if (ok && !v.hidden) return;
  if (ok) { v.hidden = false; dcPaint(v); return; }
  const all = dcSpots(v), clear = all.filter((p) => dcLineOk(v.x, v.y, p[0], p[1], true, v)), sp = clear.length ? clear : all.filter((p) => dcLineOk(v.x, v.y, p[0], p[1])); sp.sort((a, b) => Math.hypot(a[0] - v.x, a[1] - v.y) - Math.hypot(b[0] - v.x, b[1] - v.y));
  if (sp.length && !v.hidden) { const p = sp[0]; v.tw = { x0: v.x, y0: v.y, x1: p[0], y1: p[1], k0: v.k, t0: now, dur: Math.max(200, (Math.hypot(p[0] - v.x, p[1] - v.y) / RM_RUN) * 1000) }; v.face = p[0] < v.x ? 'left' : 'right'; dcPaint(v); return; }
  if (sp.length) { v.x = sp[0][0]; v.y = sp[0][1]; v.k = dcK(v, v.y); v.hidden = false; dcPaint(v); return; }
  if (!v.hidden) { v.hidden = true; dcPaint(v); }
}
// a rehomed pup was drawn (14b drawVisitor) while card visitors are out: rescan the tappable spots now and move any card visitor on its tap
// area straight to the nearest free spot (or out of sight), so the pup's tap is never taken, not even for the walk off
function dcRoom() {
  if (!$('#dcVis') || !DC.vis.length) return; rmScan();
  DC.vis.forEach((v) => {
    const w = v.tw; if (w) { v.x = w.x1; v.y = w.y1; v.k = dcK(v, v.y); v.tw = null; }
    if (dcOk(v, v.x, v.y)) { dcPaint(v); return; }
    const sp = dcSpots(v).sort((a, b) => Math.hypot(a[0] - v.x, a[1] - v.y) - Math.hypot(b[0] - v.x, b[1] - v.y));
    if (sp.length) { v.x = sp[0][0]; v.y = sp[0][1]; v.k = dcK(v, v.y); v.hidden = false; } else v.hidden = true;
    dcPaint(v);
  });
  dcOrder();
}
function dcFrame(t) {
  DC.raf = 0; if (!S || cur.mode !== 'yard' || !$('#dcVis')) return;
  const dt = DC.last ? Math.min(100, t - DC.last) : 0; DC.last = t;
  const held = dcHeld();
  if (t > DC.chk && !held) { DC.chk = t + 400; if (!RM.no || performance.now() > RM.noAt) rmScan(); DC.vis.forEach((v) => dcClearOf(v, t)); }
  DC.vis.forEach((v) => {
    if (held) { if (v.tw) v.tw.t0 += dt; v.wait += dt; return; } // held where it stands (ball play, photo mode, a modal, training), like the player's dogs
    if (v.tw) {
      const w = v.tw, k = w.dur > 0 ? Math.min(1, (t - w.t0) / w.dur) : 1;
      v.x = w.x0 + (w.x1 - w.x0) * k; v.y = w.y0 + (w.y1 - w.y0) * k; v.k = w.k0 + (dcK(v, w.y1) - w.k0) * k;
      if (k >= 1) { v.tw = null; v.pose = PICK(['idle', 'idle', 'sit', 'happy']); v.wait = t + RINT(2500, 6500); }
      dcPaint(v);
    } else if (t > v.wait && !v.hidden && rmWander()) dcNext(v, t); // the small loop (under the harness only when a suite sets prefs.rmTest, like roaming)
  });
  dcOrder(); DC.raf = requestAnimationFrame(dcFrame);
}
function dcLoop() { DC.last = 0; if (!DC.raf) DC.raf = requestAnimationFrame(dcFrame); }
// after the scene is built (yard:enter, after the roam engine read it): the same cards for as long as the player stays in this place
async function dcVisit(place) {
  place = place || (S && S.place); DC.vis = [];
  if (!S || cur.mode !== 'yard' || !DC_PLACES.includes(place)) { DC.place = ''; DC.cards = null; return []; }
  const seq = ++DC.seq;
  if (DC.place !== place || !DC.cards) { DC.place = place; DC.cards = null; DC.pos = {}; DC.cards = await dcPickCards(); }
  if (seq !== DC.seq || cur.mode !== 'yard' || S.place !== place) return [];
  dcDraw(DC.cards); return DC.vis;
}
on('yard:enter', (e) => { if (!S) return; if (!DC_PLACES.includes(S.place)) { DC.place = ''; DC.cards = null; DC.pos = {}; return; } onCleanup(() => { ++DC.seq; dcClear(); }); dcVisit(S.place); });

/* ---------------- my card: settings in the account panel ---------------- */
// the Settings hook (22b_cloud.js clSection / clRender): a short status and the Dog Card button
function dcSection() { return `<h4 class="clh">${esc(tt('cards.title', 'Dog Card'))}</h4><div id="dcBox">${dcBoxHTML()}</div>`; }
const dcNeedWeb = () => tt('cards.need_web', 'Dog Cards work on the web version, with an email account.');
const dcNeedLogin = () => tt('cards.need_login', 'Log in with email to share a Dog Card.');
function dcBoxHTML() {
  if (CL.why === 'artifact') return `<p class="small">${esc(dcNeedWeb())}</p>`;
  if (!dcAcct()) return `<p class="small">${esc(dcNeedLogin())}</p>`;
  const on = dcOptIn(), n = DC.mine ? DC.mine.paws | 0 : 0;
  const line = !on ? tt('cards.stat_off', 'Your Dog Card is not shared. Other players see only cards that are switched on.') : !dcPayload().dogs.length ? tt('cards.stat_empty', 'Your Dog Card has no dogs now, so it is not shared. Pick dogs to share it again.') : DC.mine ? tt('cards.stat_paws', 'Your Dog Card is shared. {n, plural, one {# paw} other {# paws}} so far.', { n }) : tt('cards.stat_on', 'Your Dog Card is shared.');
  return `<p class="small" id="dcStat">${esc(line)}</p><div class="clrow"><button class="btn" data-dcs="open">${esc(tt('cards.title', 'Dog Card'))}</button></div>`;
}
function dcRender() {
  const b = document.getElementById('dcBox'); if (b) { const h = dcBoxHTML(); if (b.dataset.h !== h) { b.dataset.h = h; b.innerHTML = h; } } // only when it changed: a tap on the button never meets a fresh copy of it
  const uid = dcMode() === 'on' && !CL.anon ? CL.uid : null; if (uid !== DC.uid) { DC.uid = uid; DC.mine = null; if (uid) dcSyncSoon(1500); }
}
modal.addEventListener('click', (e) => { const b = e.target.closest('[data-dcs="open"]'); if (!b) return; SFX.click(); dcSettings(); });
// shown(i, word): the option text for index i (the option values stay the indices)
const dcSel = (id, list, val, label, shown) => `<label class="dc-sel" for="${id}"><span>${esc(label)}</span><select id="${id}">${list.map((w, i) => `<option value="${i}"${i === val ? ' selected' : ''}>${esc(shown(i, w))}</option>`).join('')}</select></label>`;
function dcSettings(force) {
  if (!S) return null;
  if (!dcAcct() && !force) { openModal(tt('cards.title', 'Dog Card'), `<p>${esc(CL.why === 'artifact' ? dcNeedWeb() : dcNeedLogin())}</p>`, { foot: `<button class="btn yes" id="dcBack">${esc(tt('cards.ok', 'OK'))}</button>` }); $('#dcBack').onclick = () => { SFX.click(); closeModal(); }; return null; }
  const ed = { on: dcOptIn(), name: Array.isArray(S.dc.name) ? S.dc.name.slice() : [RINT(0, DC_WORDS_A.length - 1), RINT(0, DC_WORDS_B.length - 1)], dogs: S.dc.dogs.filter((x) => dcCanShow(dogById(x.id))).map((x) => ({ id: x.id, nm: x.nm })) };
  if (!ed.dogs.length) ed.dogs = S.dogs.filter(dcCanShow).slice(0, DC_MAX_DOGS).map((d) => ({ id: d.id, nm: dcDefaultNm(d) }));
  const rows = S.dogs.filter(dcCanShow).map((d) => {
    const own = dcOwnNameIdx(d), sel = ed.dogs.find((x) => x.id === d.id), nm = sel && typeof sel.nm === 'number' ? sel.nm : dcDefaultNm(d);
    return `<div class="dc-row"><label class="tog"><input type="checkbox" data-dcdog="${esc(d.id)}" ${sel ? 'checked' : ''}> ${esc(d.name)}</label>${own >= 0 ? `<span class="small">${esc(tt('cards.card_name_is', 'Card name: {name}', { name: dcNameShown(own) }))}</span>` : dcSel('dcNm-' + d.id, DC_DOG_NAMES, nm, tt('cards.card_name', 'Card name'), (i, w) => dcNameShown(i))}</div>`;
  }).join('');
  const p = openModal(tt('cards.my_title', 'My Dog Card'), `<div class="dc-set"><label class="tog dc-share"><input type="checkbox" id="dcOn" ${ed.on ? 'checked' : ''}> ${esc(tt('cards.share', 'Share my Dog Card'))}</label>
    <p class="small">${esc(tt('cards.privacy', "Other players see your card name, your dogs' drawings, breeds, coats, outfits, card names and paws. Never your email. Turning it off deletes the card."))}</p>
    <div class="dc-name">${dcSel('dcA', DC_WORDS_A, ed.name[0], tt('cards.card_name', 'Card name'), (i) => dcWordA(i))}${dcSel('dcB', DC_WORDS_B, ed.name[1], tt('cards.and', 'and'), (i) => dcWordB(i))}<button class="btn" data-dcset="rand">${esc(tt('cards.pick_for_me', 'Pick for me'))}</button></div>
    <p class="small">${esc(tt('cards.up_to', '{n, plural, one {Up to # dog.} other {Up to # dogs.}} A dog shows its own name when the list has it.', { n: DC_MAX_DOGS }))}</p><div class="dc-pick">${rows}</div>
    <h4 class="clh">${esc(tt('cards.preview', 'Preview'))}</h4><div id="dcPrev"></div><p class="clmsg" id="dcMsg" role="status"></p></div>`,
  { cls: 'dcpop dcsetpop', foot: `<button class="btn" id="dcSetBack">${esc(tt('cards.back', 'Back'))}</button><button class="btn yes big" id="dcSave">${esc(tt('cards.save', 'Save'))}</button>` });
  const msg = (t) => { const m = $('#dcMsg', p); if (m) m.textContent = t || ''; };
  const read = () => {
    ed.name = [+$('#dcA', p).value, +$('#dcB', p).value];
    ed.dogs = [...p.querySelectorAll('[data-dcdog]')].filter((c) => c.checked).map((c) => { const d = dogById(c.dataset.dcdog), s = document.getElementById('dcNm-' + c.dataset.dcdog); return { id: d.id, nm: s ? +s.value : dcOwnNameIdx(d) }; });
  };
  const prev = () => { read(); const pl = dcPayload(ed), c = { id: 'preview', name: pl.name, dogs: pl.dogs, paws: DC.mine ? DC.mine.paws | 0 : 0 }; $('#dcPrev', p).innerHTML = pl.dogs.length ? `<div class="dc-prevcard"><h3>${esc(dcCardName(c))}</h3>${dcCardBody(c)}</div>` : `<p class="small">${esc(tt('cards.pick_one', 'Pick at least one dog.'))}</p>`; };
  p.addEventListener('change', async (e) => {
    const t = e.target;
    if (t.matches('[data-dcdog]') && t.checked && p.querySelectorAll('[data-dcdog]:checked').length > DC_MAX_DOGS) { t.checked = false; nope(tt('cards.fits', '{n, plural, one {A Dog Card fits # dog.} other {A Dog Card fits # dogs.}}', { n: DC_MAX_DOGS })); }
    if (t.id === 'dcOn' && !t.checked && S.dc.on) { // turning it off deletes the card at once
      S.dc.on = false; S.dc.uid = null; markDirty(); saveNow(); msg(tt('cards.deleting', 'Deleting your Dog Card...'));
      const ok = await dcUnshare(); msg(ok ? tt('cards.deleted', 'Your Dog Card is not shared any more. It was deleted.') : tt('cards.delete_later', 'Your Dog Card is off. It will be deleted when the cloud is back.')); dcRender(); return;
    }
    prev();
  });
  p.querySelector('[data-dcset="rand"]').onclick = () => { SFX.click(); $('#dcA', p).value = RINT(0, DC_WORDS_A.length - 1); $('#dcB', p).value = RINT(0, DC_WORDS_B.length - 1); prev(); };
  $('#dcSetBack', p).onclick = () => { SFX.click(); cloudOpen(); };
  $('#dcSave', p).onclick = async () => {
    read(); const on = $('#dcOn', p).checked;
    if (on && !ed.dogs.length) { msg(tt('cards.pick_one_card', 'Pick at least one dog for your card.')); return; }
    S.dc.name = ed.name.slice(); S.dc.dogs = ed.dogs.map((x) => ({ id: x.id, nm: x.nm })); S.dc.on = on; S.dc.uid = on ? CL.uid : null; markDirty(); saveNow();
    if (!on) { await dcUnshare(); msg(tt('cards.saved_off', 'Saved. Your Dog Card is not shared.')); dcRender(); return; }
    const b = $('#dcSave', p); b.disabled = true; msg(tt('cards.sharing', 'Sharing your Dog Card...'));
    const r = await dcPublish(); b.disabled = false;
    msg(r.ok ? tt('cards.saved_on', 'Saved. Your Dog Card is shared. Other players can visit with your dogs now.') : r.msg); dcRender();
  };
  prev(); return p;
}

/* ---------------- my card: the Worker ---------------- */
async function dcPublish() {
  if (!dcAcct()) return { ok: false, msg: dcNeedLogin() };
  if (!dcOptIn()) return { ok: false, msg: tt('cards.switch_on', 'Switch on Share my Dog Card first.') };
  const pl = dcPayload(); if (!pl.dogs.length) return { ok: false, msg: tt('cards.pick_one_card', 'Pick at least one dog for your card.') };
  let r = null; try { r = await dcApi('PUT', '/card', pl); } catch (e) { r = null; }
  if (!r) return { ok: false, msg: tt('cards.offline', 'Cloud save is offline. Try again in a moment.') };
  if (!r.ok || !r.data) return { ok: false, msg: r.status === 429 ? tt('cards.too_many', 'Too many saves. Wait a few minutes and try again.') : tt('cards.failed', "That didn't work. Try again in a moment.") };
  DC.mine = r.data; if ((DC.mine.paws | 0) < S.dc.got) { S.dc.got = DC.mine.paws | 0; markDirty(); }
  return { ok: true };
}
async function dcUnshare() { DC.mine = null; if (dcMode() !== 'on' || CL.anon) return false; try { const r = await dcApi('DELETE', '/card'); return !!r.ok; } catch (e) { return false; } }
// on load, on focus and after a log in: my card matches S.dc (shared, refreshed, or deleted), and new paws get one toast
function dcSyncSoon(ms) { clearTimeout(DC.syncT); DC.syncT = setTimeout(dcSync, ms || 0); }
async function dcSync() {
  if (!S || !dcAcct() || DC.syncP) return DC.syncP; if (CL.pending || CL.loggingIn) { dcSyncSoon(2000); return null; } // a save from another device loads first
  DC.syncAt = Date.now();
  DC.syncP = (async () => {
    let r = null; try { r = await dcApi('GET', '/card'); } catch (e) { return null; }
    if (!r.ok) return null;
    let mine = r.data || null;
    if (dcOptIn()) {
      const pl = dcPayload();
      if (!pl.dogs.length) { if (mine) { await dcUnshare(); mine = null; } } // every dog on the card has left (adopted out): the card goes
      else if (!mine || !dcSame(pl, mine) || Date.now() - (mine.at || 0) > 7 * 864e5) { const p = await dcPublish(); if (p.ok) mine = DC.mine; } // keeps the card fresh (visitors are cards updated in the last 30 days)
    } else if (S.dc.on) { DC.mine = mine; dcRender(); return mine; } // switched on by another account on this device: this account's card is left as it is, and never published from here
    else if (mine) { await dcUnshare(); mine = null; } // switched off on this save: never left online
    DC.mine = mine;
    if (mine) {
      const n = mine.paws | 0, add = n - (S.dc.got | 0);
      if (add > 0) toast(tt('cards.new_paws', 'Your Dog Card got {n, plural, one {# new paw} other {# new paws}}.', { n: add }), 'gold');
      if (n !== S.dc.got) { S.dc.got = n; markDirty(); }
    }
    dcRender(); return mine;
  })().finally(() => { DC.syncP = null; });
  return DC.syncP;
}
on('game:ready', () => { if (S) dcPrune(); const wait = (i) => { if (CL.started || i > 40) dcRender(); else setTimeout(() => wait(i + 1), 500); }; wait(0); });
window.addEventListener('focus', () => { if (DC.uid && Date.now() - DC.syncAt > 60000) dcSyncSoon(1500); });

/* ---------------- test hook ---------------- */
function dcExpose() {
  if (!window.__paw) return;
  window.__paw.dc = {
    mode: () => dcMode(), fake: DC_FAKE, lists: { a: DC_WORDS_A, b: DC_WORDS_B, n: DC_DOG_NAMES, outfits: DC_OUTFITS, breeds: dcBreeds() },
    visitors: () => DC.vis.map((v) => ({ card: v.card.id, i: v.i, key: v.dog.key, size: sizeOf(v.dog), name: v.dog.name, x: v.x, y: v.y, k: v.k, hidden: v.hidden, moving: !!v.tw, tap: rmTapBox(v.x, v.y, v.k) })),
    cards: () => (DC.cards || []).map((c) => c.id), visit: (ids) => { DC.pick = ids || null; DC.place = ''; DC.cards = null; return dcVisit(); },
    card: (id) => dcCard((DC.cards || []).concat(DC_FAKE).find((c) => c.id === id)), give: (id) => { const c = (DC.cards || []).concat(DC_FAKE).find((x) => x.id === id); return c ? dcGive(c, document.querySelector('#modal .panel')) : false; },
    settings: (force) => dcSettings(force), payload: () => dcPayload(), sync: () => dcSync(), get mine() { return DC.mine; }, name: (c) => dcCardName(c), ok: (x, y) => dcOk(null, x, y)
  };
}
on('game:ready', () => setTimeout(dcExpose, 0)); setTimeout(dcExpose, 0);
