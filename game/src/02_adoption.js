/* ======================= ADOPTION ======================= */
let adoptIdx = 0, adoptSex = null, adoptCoat = 0, adoptEye = 0, adoptPid = null; // v2.23 Coat pick: the colour option, the eye option and the dog id that gives those eyes
/* v2.23 "Coat pick" (owner, 7 Nov 2026; V223.md): the starter's colour (and, for the husky, the Aussie, the Border Collie and merle coats, its eyes) is chosen on the card.
   The table and the genetics are STARTER_COATS / starterPick in 10_sex_age_genes.js; option 1 is the old starter, so a player who picks nothing gets it. */
function adPick(key) { const p = starterPick(key, adoptCoat, adoptEye, adoptPid); adoptPid = p ? p.id : null; return p; }
function adReset() { adoptSex = null; adoptCoat = 0; adoptEye = 0; adoptPid = null; }
// the meet dog of the playroom (30_shelter.js srMeetSVG): the starter look in the colour picked on the card
function adLook(key) { const L = srStarterLook(key), d = dogsList()[adoptIdx]; if (!d || d.key !== key) return L; const p = adPick(key); if (p) { L.genes = p.genes; L.id = p.id; } return L; }
const CP_EYE = { brown: ['#6B3E1E', '#6B3E1E'], amber: ['#C98A2E', '#C98A2E'], blue: ['#4F9BE0', '#4F9BE0'], odd: ['#4F9BE0', '#6B3E1E'] };
function cpEyeSVG(e) { const c = CP_EYE[e] || CP_EYE.brown; return `<svg viewBox="0 0 44 24" aria-hidden="true">${[12, 32].map((x, i) => `<path d="M${x - 9} 12.5c0-5 4.3-8.6 9.2-8.4 4.8.2 8.6 3.8 8.4 8.6-.2 4.6-4.4 7.9-9 7.7-4.7-.2-8.6-3.4-8.6-7.9z" fill="#fff" stroke="#3a2e2e" stroke-width="2.2" stroke-linejoin="round"/><circle cx="${x + 0.4}" cy="12.6" r="5" fill="${c[i]}"/><circle cx="${x + 0.6}" cy="12.8" r="2.2" fill="#2a2226"/><circle cx="${x - 1.6}" cy="10.4" r="1.4" fill="#fff"/>`).join('')}</svg>`; }
/* v2.23 review fix: a swatch is the whole dog sitting, cropped to the dog (a head hid the coat: a Yorkie's head is tan in every coat, a piebald's white
   is on its body). The crop is measured once per breed in the page (getBBox, cpCrop) and then written into the drawing, so later cards never jump. */
const CP_BOX = {};
function cpSit(key, o) { const s = dogArtSafe(key, Object.assign({ pose: 'sit' }, o)), b = CP_BOX[key]; return b ? s.replace(/viewBox="[^"]*"/, `viewBox="${b}"`) : s.replace('<svg', `<svg data-cpcrop="${key}"`); }
function cpCrop(root) {
  (root || document).querySelectorAll('svg[data-cpcrop]').forEach((s) => {
    const k = s.dataset.cpcrop; let b = CP_BOX[k];
    if (!b) { let r = null; try { r = s.getBBox(); } catch (e) { r = null; } if (!r || !(r.width > 4) || !(r.height > 4)) return; const side = Math.max(r.width, r.height) + 8; b = CP_BOX[k] = [r.x + r.width / 2 - side / 2, r.y + r.height / 2 - side / 2, side, side].map((v) => Math.round(v * 10) / 10).join(' '); }
    s.setAttribute('viewBox', b); s.removeAttribute('data-cpcrop');
  });
}
/* the colour row of a starter card: crayon dog heads in each coat, then the eye choices when the breed has them. ci, ei: the picked options; pid: the
   picked dog id; at: the data attribute the buttons carry (the adoption card 'cp', the Shelter list 'shcp|<key>'). One option: just the coat line. */
function coatPickHTML(key, ci, ei, pid, at) {
  const cs = starterCoats(key), es = starterEyes(key, ci), G = window.PawGenes, pk = starterPick(key, ci, ei, pid);
  const cur = cs[ci] || cs[0], eyes = pk ? pk.eyes : es.length ? es[0].eyes : ((G && G.phenotype(cur.genes, key, 'x')) || {}).eyes || 'brown';
  const head = (c, i) => { let o = {}; try { const ph = G.phenotype(c.genes, key, 'tmp_' + key), e0 = starterEyes(key, i)[0]; o = { coat: Object.assign({}, ph.coat, e0 ? { eyes: e0.eyes } : {}), seed: hashId('tmp_' + key) }; } catch (e) { o = {}; } return cpSit(key, o); }; // the sitting dog in that coat (cpSit)
  const sw = cs.length > 1 ? cs.map((c, i) => `<button type="button" class="cp-sw" data-${at.split('|')[0]}="${at.indexOf('|') > 0 ? at.split('|')[1] + '|' : ''}c|${i}" aria-pressed="${i === ci}" aria-label="${esc(coatShown(c.coat, key))}" title="${esc(coatShown(c.coat, key))}">${head(c, i)}</button>`).join('') : `<span class="cp-sw one" aria-hidden="true">${head(cs[0], 0)}</span>`;
  const ew = es.length ? `<span class="cp-eyes" role="group" aria-label="${esc(tt('adopt.label_eye_colour', 'Eye colour'))}">${es.map((e, j) => `<button type="button" class="cp-ey" data-${at.split('|')[0]}="${at.indexOf('|') > 0 ? at.split('|')[1] + '|' : ''}e|${j}" aria-pressed="${j === ei}" aria-label="${esc(eyeShown(e.eyes))}" title="${esc(eyeShown(e.eyes))}">${cpEyeSVG(e.eyes)}</button>`).join('')}</span>` : '';
  return `<div class="coatpick"><p class="cp-lbl">${esc(tt('adopt.coat_line', 'Coat: {coat}', { coat: coatShown(pk ? pk.coat : cur.coat, key) }))}${es.length ? ` <span class="cp-eyelbl">${esc(tt('adopt.eyes_line', 'Eyes: {eyes}', { eyes: eyeShown(eyes) }))}</span>` : ''}</p>
    <div class="cp-row"><span class="cp-coats" role="group" aria-label="${esc(tt('adopt.label_coat_colour', 'Coat colour'))}">${sw}</span>${ew}</div></div>`;
}
// a tap on a colour or eye button: [kind 'c' | 'e', index] from its data value (the last two parts)
function cpTap(v) { const a = String(v).split('|'); return [a[a.length - 2], +a[a.length - 1]]; }
// v2.14: a random line out of a text table, shown through tdata (the path is the table path plus the index; the tables only grow)
function homePick(path, arr) { const i = Math.floor(Math.random() * arr.length); return tdata(path + '.' + i, arr[i]); }
// v2.14: the sex of a dog as the select value of a message ('female' or 'male'; a dog without a sex counts as male, like PR())
function homeSx(d) { return d && d.sex === 'female' ? 'female' : 'male'; }
// v2.14: a mix as shown to the player. The saved mix.name is always English (it is compared and stored); PawGenes.mixName(mix) (mods/genes.js)
// gives the name in the current language when it has one, else the English name.
function mixShown(m) { if (!m) return ''; const G = window.PawGenes; if (G && typeof G.mixName === 'function') { try { const v = G.mixName(m); if (v) return v; } catch (e) { /* use the English name */ } } return m.name || ''; }
// v2.14: a saved English coat name as shown (display only; never use it for comparing or saving)
function coatShown(c, key) { if (!c) return c; const G = window.PawGenes; if (G && typeof G.coatLabel === "function") { try { const v = G.coatLabel(c, key); if (v) return v; } catch (e) { /* use the English name */ } } return c; }
// Eye colour labels: phenotype() gives a fixed English word ('brown' | 'amber' | 'blue' | 'odd').
function eyeShown(e) { const m = { brown: tt('genes.eye_brown', 'brown'), amber: tt('genes.eye_amber', 'amber'), blue: tt('genes.eye_blue', 'blue'), odd: tt('genes.eye_odd', 'odd') }; return m[e] || e; }
// v2.14: a stored English mix word (a chip name) as shown
function mixWordShown(n) { const G = window.PawGenes; if (n && G && typeof G.mixLabel === "function") { try { const v = G.mixLabel(n); if (v) return v; } catch (e) { /* use the English name */ } } return n; }
// v2.14: the name of an item as shown to the player (food, toys, clothes, houses, beds, decorations). The English name stays the id everywhere else.
function homeName(n) {
  const T = [['food', FOOD], ['tfood', typeof TFOOD !== 'undefined' ? TFOOD : []], ['toys', TOYS], ['clothes', CLOTHES], ['houses', HOUSES], ['beds', typeof BEDS !== 'undefined' ? BEDS : []]];
  for (const [t, arr] of T) if (arr.some((x) => x.n === n)) return tdata(t + '.' + tid(n) + '.n', n);
  if (typeof HM_DECOR !== 'undefined' && HM_DECOR[n]) return tdata('hm_decor.' + tid(n) + '.n', n);
  return n;
}
// v2.14: a dog's signature trick text (the SIG table in 00_core.js: n = the trick name, say = its line) in the current language
function homeSig(k, field) { const s = sigOf(k); return SIG[k] ? tdata('sig.' + k + '.' + field, s[field]) : s[field]; }
// v2.14: a family / owner name as shown (townFamily from 14b when present: the saved text stays English)
function homeFam(s) { return s && typeof townFamily === 'function' ? townFamily(s) : s || ''; }
// v2.14: a shop's name (shopTitle from 05_market_shops when present)
function shopName(k) { return typeof shopTitle === 'function' ? shopTitle(k) : tdata('shop_name.' + k, SHOP_NAME[k]); }
// v2.14: a place's name as shown (Tokyo places and the station come from 39_tokyo.js tkPlaceName)
function placeName(k) { const mp = mpPlaceName(k); if (mp) return mp; return typeof tkPlaceName === 'function' && (k === 'station' || (typeof TK_PLACES !== 'undefined' && TK_PLACES[k])) ? tkPlaceName(k) : PLACES[k] ? townPlaceName(k) : k; } // QA 6 Nov 2026: townPlaceName has the eight places the places table lacks
function enterAdopt() {
  setChrome(false, false);
  view.innerHTML = srRoomSVG('adopt'); // v2.7: the Shelter Playroom (30_shelter.js). No S is read or written here
  srEnter('adopt');
  renderAdopt(true);
  const onKey = (e) => { if (!modal.hidden) return; const n = dogsList().length; if (e.key === 'ArrowLeft') { adoptIdx = (adoptIdx + n - 1) % n; adReset(); renderAdopt(); } if (e.key === 'ArrowRight') { adoptIdx = (adoptIdx + 1) % n; adReset(); renderAdopt(); } }; // v2.23: a new dog starts on its first colour, Boy / Girl unpicked (as the < > buttons)
  window.addEventListener('keydown', onKey); onCleanup(() => window.removeEventListener('keydown', onKey));
}
function renderAdopt(first) {
  const dogs = dogsList(); if (adoptIdx >= dogs.length) adoptIdx = 0; const d = dogs[adoptIdx], pk = adPick(d.key); // v2.23: the picked colour (null: the starter coat)
  srMeetShow(d.key); // v2.7: the selected dog trots to the meet spot at the front of the playroom
  dock.innerHTML = `<div class="tray"><div class="tray-h"><h3>${tt('adopt.doodle_doggo_shelter_pick_your', 'Doodle Doggo Shelter: pick your new best friend')}</h3></div>
    <div class="adopt-card"><button class="arrow" id="aPrev" aria-label="${esc(tt('adopt.label_previous_dog', 'Previous dog'))}">&lt;</button>
      <div class="info"><h3>${esc(d.name)} <span class="small">${esc(tt('adopt.the_breed', 'the {breed}', { breed: adBreed(d) }))}</span></h3><p>${esc(tdata('fallback_dogs.' + d.key + '.personality', d.personality))}</p>
      <p class="small">${esc(tt('adopt.loves', 'Loves: {favLine}', { favLine: favLine(d.key) }))}</p>${typeof bdTip === 'function' && bdTip(d.key) ? `<p class="small bd-tip">${esc(bdTip(d.key))}</p>` : ''}
      <p class="sexpick">${esc(tt('adopt.has_a_brother_and_a', '{name} has a brother and a sister here. Which one is coming home?', { name: d.name }))} <button class="btn sexbtn m" id="aBoy" aria-pressed="${adoptSex === 'male'}">&#9794; ${tt('adopt.boy', 'Boy')}</button><button class="btn sexbtn f" id="aGirl" aria-pressed="${adoptSex === 'female'}">&#9792; ${tt('adopt.girl', 'Girl')}</button></p>${coatPickHTML(d.key, adoptCoat, adoptEye, adoptPid, 'cp')}</div>
      <button class="arrow" id="aNext" aria-label="${esc(tt('adopt.label_next_dog', 'Next dog'))}">&gt;</button></div>
    <div class="heads">${dogs.map((x, i) => `<button data-i="${i}" aria-label="${esc(tt('adopt.label_the', '{name} the {breed}', { name: x.name, breed: adBreed(x) }))}" aria-current="${i === adoptIdx}">${i === adoptIdx && pk ? headSVG({ id: pk.id, key: x.key, genes: pk.genes }) : art('dogHead', x.key)}</button>`).join('')}</div>
    <div class="foot" style="margin-top:4px"><button class="btn big" id="aRandom">&#127922; ${esc(tt('adopt.random', 'Random dog'))}</button><button class="btn big yes" id="aAdopt">${esc(tt('adopt.adopt', 'Adopt {name}', { name: d.name }))}</button></div></div>`;
  $('#aPrev').onclick = () => { adoptIdx = (adoptIdx + dogs.length - 1) % dogs.length; adReset(); renderAdopt(); };
  $('#aNext').onclick = () => { adoptIdx = (adoptIdx + 1) % dogs.length; adReset(); renderAdopt(); };
  dock.querySelectorAll('.heads button').forEach((b) => { b.onclick = () => { if (+b.dataset.i !== adoptIdx) adReset(); adoptIdx = +b.dataset.i; renderAdopt(); }; });
  dock.querySelectorAll('[data-cp]').forEach((b) => { b.onclick = () => { // v2.23: a colour or eye swatch; the meet dog shows it off
    const [k, i] = cpTap(b.dataset.cp); if (k === 'c') { if (i === adoptCoat) return; adoptCoat = i; adoptEye = 0; adoptPid = null; } else { if (i === adoptEye) return; adoptEye = i; adoptPid = null; }
    SFX.boop(k === 'c' ? 600 + i * 40 : 820); renderAdopt(true); if (typeof srMeetCoat === 'function') srMeetCoat(d.key);
  }; });
  cpCrop(dock); // v2.23: crop the sitting-dog swatches
  $('#aRandom').onclick = () => { // owner, 24 Oct 2026: a random dog and a random sibling, ready to adopt
    adoptIdx = dogs.length > 1 ? (adoptIdx + 1 + Math.floor(Math.random() * (dogs.length - 1))) % dogs.length : 0;
    adReset(); adoptSex = Math.random() < 0.5 ? 'male' : 'female';
    const nd = dogs[adoptIdx].key; adoptCoat = Math.floor(Math.random() * starterCoats(nd).length); adoptEye = Math.floor(Math.random() * Math.max(1, starterEyes(nd, adoptCoat).length)); renderAdopt(); // v2.23: a random colour (and eyes) too
  };
  $('#aBoy').onclick = () => { adoptSex = 'male'; SFX.boop(520); renderAdopt(true); };
  $('#aGirl').onclick = () => { adoptSex = 'female'; SFX.boop(700); renderAdopt(true); };
  $('#aAdopt').onclick = () => { if (!adoptSex) { nope(tt('adopt.pick_boy_or_girl_first', "Pick Boy or Girl first. {name}'s siblings are waiting politely.", { name: d.name })); return; } adoptName(d); };
  if (!first) SFX.bark(BARK[d.key] || 1);
  setTimeout(() => { if (cur.mode === 'adopt' && modal.hidden) (typeof srSay === 'function' ? srSay : say)(d.joke ? tdata('fallback_dogs.' + d.key + '.joke', d.joke) : JOKES[d.key] ? homePick('jokes.' + d.key, JOKES[d.key]) : homePick('jokes.mutt', JOKES.mutt), SR_MEET[0] + 30, SR_MEET[1] - srSayUp(), 6000, 'meet'); }, 60);
  if (!isPhone()) { const H = dock.querySelector('.heads'), b = H && H.querySelector('button[aria-current="true"]'); if (b && H.scrollHeight > H.clientHeight + 1) { const hr = H.getBoundingClientRect(), br = b.getBoundingClientRect(); H.scrollTop = Math.max(0, br.top - hr.top - (H.clientHeight - br.height) / 2); } } // v2.12 LAYOUT: desktop, the heads row scrolls inside a full card: the picked head stays in view
  if (typeof srCam === 'function') requestAnimationFrame(srCam); // the tray's height can change with the dog's text
}
// v2.14: the dog's breed as shown on the adoption cards (the long English form from the dog table, e.g. "Shiba Inu")
function adBreed(d) { return tdata('fallback_dogs.' + d.key + '.breed', d.breed); }
function favLine(k) {
  const f = FAV[k]; if (k === 'mutt' || !f) return tt('adopt.petting_favourite_snack_and_toy', 'petting. Favourite snack and toy: a surprise, rolled at adoption.');
  return tt('adopt.fav_line', '{act}, {food}, {toy}', { act: tdata('fav.' + k + '.act', f.act), food: tlist(f.food.map((n) => tdata('food.' + tid(n) + '.n', n))), toy: tdata('toys.' + tid(f.toy) + '.n', f.toy) });
}
function adoptName(d) {
  SFX.boop(660);
  const p = openModal(tt('adopt.name_your', '{sex, select, female {Name your girl {breed} {sexSym}} other {Name your boy {breed} {sexSym}}}', { sex: adoptSex, breed: adBreed(d), sexSym: sexSym(adoptSex) }), `<p>${tt('adopt.the_shelter_calls_html', '{sex, select, female {The shelter calls her <b>{name}</b>. You can keep that name, or pick something even sillier.} other {The shelter calls him <b>{name}</b>. You can keep that name, or pick something even sillier.}}', { sex: adoptSex, name: d.name })}</p>
    <label for="nameIn" class="small">${tt('adopt.name_12_letters_max', 'Name (12 letters max)')}</label><input id="nameIn" class="namebox" maxlength="12" value="${esc(d.name)}" autocomplete="off" autofocus>
    <p class="small" id="nameHint"></p>`, { foot: `<button class="btn no" id="nBack">${tt('adopt.back', 'Back')}</button><button class="btn yes big" id="nOk">${tt('adopt.that_s_the_name', "That's the name")}</button>` });
  const inp = $('#nameIn', p); setTimeout(() => { inp.focus(); inp.select(); }, 60);
  const done = () => {
    let nm = inp.value.replace(/\s+/g, ' ').trim().slice(0, 12); if (!nm) nm = d.name;
    if (/\b(poo+p?|butt|fart)\b/i.test(nm)) $('#nameHint', p).textContent = tt('adopt.bold_choice_we_respect_it', 'Bold choice. We respect it.');
    S = freshState(d.key, nm, adoptSex, adPick(d.key)); /* v2.23: in the colour picked on the card */ S.careDays = 0; S.careDayLast = ''; S.spotsSeen = 1; if (!Array.isArray(S.litters)) S.litters = []; levelQueue = []; dailyCheck(); saveNow(); closeModal(); audioCue('adopt'); intro();
  };
  $('#nOk', p).onclick = done; inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') done(); });
  $('#nBack', p).onclick = () => { SFX.click(); closeModal(); };
}
function intro() {
  const nm = NAME();
  const pages = [
    [tt('adopt.welcome_to_doodle_doggo', 'Welcome to Doodle Doggo'), `<p>${tt('adopt.population_you_html', 'Population: you, <b>{name}</b>, and one suspicious duck.', { name: nm })}</p><p>${tt('adopt.is_now_your_dog_there_html', '{name} is now your dog. There is no take-backs policy. {name} checked.', { name: nm })}</p>`],
    [tt('adopt.how_this_works', 'How this works'), `<p>${tt('adopt.keep_the_four_meters_up_html', 'Keep the four meters up: <b>Hunger</b>, <b>Happiness</b>, <b>Energy</b>, <b>Cleanliness</b>. Nothing bad ever happens if they drop. {name} just gets very dramatic about it.', { name: nm })}</p><p>${tt('adopt.game_day_real_hour', 'A game day here is one real hour.')}</p>`],
    [tt('adopt.your_starter_kit', 'Your starter kit'), `<p>${tt('adopt.5_basic_kibble_3_bone', '5 Basic Kibble, 3 Bone-shaped Biscuits, 1 Pupcake, a Tennis Ball, a Cardboard Box (luxury) and 150 Paw Coins.')}</p><p>${tt('adopt.tip_rub_html', '<b>Tip:</b> rub {name} with your mouse or finger to pet. Go on. Rub.', { name: nm })}</p>`]
  ];
  let i = 0;
  const show = () => {
    const [t, b] = pages[i];
    const p = openModal(t, b, { noX: true, foot: `<button class="btn yes big" id="iNext">${i < pages.length - 1 ? tt('adopt.next', 'Next') : tt('adopt.let_s_go_home', 'Let\'s go home')}</button>` });
    $('#iNext', p).onclick = () => { SFX.boop(600 + i * 80); i++; if (i < pages.length) { modal.hidden = true; show(); } else { closeModal(); go('yard'); if (typeof gdStart === 'function') setTimeout(gdStart, 900); /* v2.4: Gerald's walkthrough for new saves */ setTimeout(() => { if (cur.mode === 'yard') toast((isPhone() ? tt('adopt.rub_to_pet_tap_care_feed', 'Rub {name} to pet. Tap Care, then Feed to fill the bowl.', { name: NAME() }) : tt('adopt.rub_to_pet_tap_feed', 'Rub {name} to pet. Tap Feed to fill the bowl.', { name: NAME() })), 'gold'); }, 900); } };
  };
  show();
}

// v2.23 test hook (test_v223_coats.js): the coat table, the pick helpers and the card's state
function cpExpose() {
  if (!window.__paw) return;
  window.__paw.cp = {
    table: STARTER_COATS, eyesBy: STARTER_EYES, coats: (k) => starterCoats(k), eyes: (k, i) => starterEyes(k, i), pick: (k, i, j, id) => starterPick(k, i, j, id),
    fields: (k, pick) => newDogFields(k, 'male', '2026-01-01', pick || null), starter: (k) => STARTER_GENES[k],
    state: () => ({ key: (dogsList()[adoptIdx] || {}).key, coat: adoptCoat, eye: adoptEye, id: adoptPid, sex: adoptSex }),
    meet: () => { const L = SR && SR.meet ? adLook(SR.meet.key) : null; return L ? { key: L.key, id: L.id, genes: L.genes } : null; },
    shelter: () => JSON.parse(JSON.stringify(shelterCoat)),
    // v2.23 review fix: a dog through the Dog Card / Friends wire and back (40_dogcards.js dcDogOf -> dcDog), and the same wire without e and p (an old card)
    card: (id) => { const d = id ? dogById(id) : S.dog, x = dcDogOf(d), v = dcDog({ id: 'cpTestCard', name: [0, 0], dogs: [x] }, 0), old = Object.assign({}, x); delete old.e; delete old.p; const v0 = dcDog({ id: 'cpTestCard', name: [0, 0], dogs: [old] }, 0), own = dogSVG(d, { pose: 'sit' });
      return { wire: x, fr: typeof frCardOf === 'function' ? frCardOf(d) : null, seed: hashId(d.id), id: v.id, eyes: eyesOf(v), coat: coatNameOf(v), same: dogSVG(v, { pose: 'sit' }) === own, oldId: v0.id, oldEyes: eyesOf(v0), oldSame: dogSVG(v0, { pose: 'sit' }) === own }; },
    dog: (id) => { const d = id ? dogById(id) : S.dog; return d ? { id: d.id, key: d.key, genes: d.genes, coat: d.coat, eyes: d.eyes, shown: coatNameOf(d), shownEyes: eyesOf(d) } : null; }
  };
}
on('game:ready', () => setTimeout(cpExpose, 0));
setTimeout(cpExpose, 0);
