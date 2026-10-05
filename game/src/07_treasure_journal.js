/* ======================= TREASURE JOURNAL ======================= */
let jTab = 'treasures', jProfDog = null, jFamId = null, jCoatKey = null;
function stamp(r) { return `<span class="stamp r${r}">${RARITY[r]}</span>`; }
function tornMap() {
  const pieces = S.mapPieces.slice();
  const real = artReal('prop', 'torn-map', { pieces });
  if (real) return real;
  const q = { park: [0, 0], river: [120, 0], woods: [0, 80], beach: [120, 80] };
  return `<svg viewBox="0 0 240 160"><rect x="2" y="2" width="236" height="156" fill="none" stroke="#A8968A" stroke-dasharray="5 5"/>${ALL_ROUTES.map((k) => pieces.includes(k) ? `<rect x="${q[k][0] + 4}" y="${q[k][1] + 4}" width="112" height="72" rx="6" fill="#F5E6C8" stroke="${INKG}" stroke-width="2"/><text x="${q[k][0] + 60}" y="${q[k][1] + 46}" text-anchor="middle" font-family="Caveat,cursive" font-size="20" fill="${INKG}">${k}</text>` : '').join('')}${pieces.length >= 4 ? `<path d="M40 120 Q90 40 150 90 T200 40" fill="none" stroke="${INKG}" stroke-width="2.5" stroke-dasharray="6 6"/><path d="M190 30 l20 20 M210 30 l-20 20" stroke="#C9475E" stroke-width="4"/>` : ''}</svg>`;
}
function openJournal(tab) {
  if (tab) jTab = tab; audioPlace('journal');
  if (jTab === 'coats') { coatSync(); coatRewardsCheck(); }
  const foundN = TREASURES.filter((t) => S.found[t.n]).length;
  const tabs = [['profile', 'Profile'], ['family', 'Family'], ['coats', 'Coats'], ['treasures', `Treasures ${foundN}/${TREASURES.length}`], ['food', 'Food'], ['toys', 'Toys'], ['clothes', 'Clothes'], ['garden', gkOn() ? 'Garden' : 'Garden (soon)'], ['recipes', kOn() ? 'Recipes' : 'Recipes (soon)']];
  let body = '';
  if (jTab === 'family') body = journalFamily();
  else if (jTab === 'coats') body = journalCoats();
  else if (jTab === 'garden') body = gkOn() ? journalGarden() : soonCard('garden');
  else if (jTab === 'recipes') body = kOn() ? journalRecipes() : soonCard('kitchen');
  else if (jTab === 'profile') { const pd = dogById(jProfDog) || D(); body = pdogTabs(pd.id) + withDog(pd, () => journalProfile()); }
  else if (jTab === 'treasures') {
    const mp = S.mapPieces.length;
    const mapMsg = S.secretDug ? `Secret dig done. ${esc(NAME())} is a Treasure Legend.` : mp >= 4 ? 'All 4 pieces! An X has appeared on your lawn at home. Go dig it!' : `Map pieces: ${mp}/4. Each route hides one piece.`;
    body = `<div class="jtop"><div class="jprog"><b>${foundN} / ${TREASURES.length}</b><span class="small">treasures found</span><div class="prog"><i style="width:${foundN / TREASURES.length * 100}%"></i></div><p class="small" style="margin:6px 0 0">Every walk hides one treasure under one of its dig spots. Follow the Nose-o-meter.</p></div>
      <div class="jmap"><div class="jmap-art">${tornMap()}</div><span class="small">${mapMsg}</span></div></div>
      <div class="jgrid">${TREASURES.map((t) => {
        const f = S.found[t.n];
        if (!f) return `<div class="jent unk"><span class="art">${art('item', t.n)}</span><b>???</b><span class="small">${t.routes.length >= 6 ? 'Found anywhere, if you are lucky...' : 'Found ' + t.routes.map((r) => ROUTE_WORD[r]).join(' or ') + '...'}</span></div>`;
        let act = '';
        if (t.kind === 'wearable' || t.kind === 'charm') act = hasTreasure(t) ? `<button class="btn ${wearing(t.n) ? '' : 'yes'}" data-jeq="${esc(t.n)}">${wearing(t.n) ? 'Unequip' : 'Equip'}</button>` : '';
        if (t.kind === 'food') act = (S.inv.food[t.n] || 0) > 0 ? `<button class="btn yes" data-jfeed="${esc(t.n)}">Feed (${S.inv.food[t.n]})</button>` : '<span class="small">All eaten. Find more on walks.</span>';
        if (t.kind === 'toy') act = FETCH_TOYS.includes(t.n) ? `<button class="btn yes" data-jplay="${esc(t.n)}">Play fetch</button>` : '<span class="chip own">Works automatically</span>';
        if (t.kind === 'quest') act = '<span class="chip own">In the map</span>';
        return `<div class="jent"><span class="art">${art('item', t.n)}</span><b>${esc(t.n)}</b>${stamp(t.r)}<span class="ab"><b>${esc(t.ab)}.</b> ${esc(t.txt)}</span><span class="small">Found in ${esc(ROUTES[f.route] ? ROUTES[f.route].n : 'your yard')}, day ${f.day}</span>${act}</div>`;
      }).join('')}</div>`;
  } else if (jTab === 'food') {
    const fs = FOOD_ALL.filter((f) => f.n === 'Fresh Water' || (S.inv.food[f.n] || 0) > 0);
    body = `<div class="jgrid">${fs.map((f) => `<div class="jent"><span class="art">${art('item', f.n)}</span><b>${esc(f.n)}</b>${tInfo(f.n) ? stamp(tInfo(f.n).r) : ''}<span class="ab">${esc(f.note || '')}</span><span class="small">${f.n === 'Fresh Water' ? 'Always free' : 'You have ' + S.inv.food[f.n]}</span><button class="btn yes" data-jfeed="${esc(f.n)}">Feed</button></div>`).join('')}</div>${fs.length <= 1 ? '<p class="small">The pantry is empty. Kibble Corner sells food, walks hide snacks.</p>' : ''}`;
  } else if (jTab === 'toys') {
    const ts = TOYS.map((t) => t.n).concat(TREASURES.filter((t) => t.kind === 'toy').map((t) => t.n)).filter((n) => owns('toys', n));
    body = `<div class="jgrid">${ts.map((n) => { const t = tInfo(n), shop = TOYS.find((x) => x.n === n); const act = toySupported(n) ? `<button class="btn yes" data-jtoyplay="${esc(n)}">Play</button>${FETCH_TOYS.includes(n) ? ` <button class="btn" data-jplay="${esc(n)}">Fetch</button>` : ''}` : FETCH_TOYS.includes(n) ? `<button class="btn yes" data-jplay="${esc(n)}">Play fetch</button>` : n === 'Squeaky Duck' || n === 'Rope Tug' ? `<button class="btn yes" data-jtoy="${n === 'Squeaky Duck' ? 'duck' : 'tug'}">Play</button>` : '<span class="chip own">Works automatically</span>'; return `<div class="jent"><span class="art">${art('item', n)}</span><b>${esc(n)}</b>${t ? stamp(t.r) : ''}<span class="ab">${esc(t ? t.ab + '. ' + t.txt : shop.note)}</span>${act}</div>`; }).join('')}</div>${ts.length ? '' : '<p class="small">No toys yet.</p>'}`;
  } else {
    const ws = ALL_WEAR.filter((c) => owns('clothes', c.n)).concat(CHARMS.filter((c) => S.inv.charms.includes(c.n)));
    body = `<div class="jgrid">${ws.map((c) => { const t = tInfo(c.n); return `<div class="jent"><span class="art">${art('item', c.n)}</span><b>${esc(c.n)}</b>${t ? stamp(t.r) : ''}<span class="small">${c.slot === 'charm' ? 'Charm slot' : SLOT_NAME[c.slot] + ' slot'}</span><span class="ab">${esc(c.perk)}</span><button class="btn ${wearing(c.n) ? '' : 'yes'}" data-jeq="${esc(c.n)}">${wearing(c.n) ? 'Unequip' : 'Equip'}</button></div>`; }).join('')}</div>${ws.length ? '' : '<p class="small">Nothing to wear yet. Bow-Wow Boutique sells clothes, walks hide treasures.</p>'}`;
  }
  const p = openModal('Treasure Journal', `<div class="tabs jtabs" role="tablist">${tabs.map(([k, l]) => `<button class="btn" role="tab" data-jt="${k}" aria-selected="${jTab === k}">${l}</button>`).join('')}</div>${body}`, { cls: 'journal j-' + jTab });
  p.querySelectorAll('[data-jt]').forEach((b) => { b.onclick = () => { SFX.click(); openJournal(b.dataset.jt); }; });
  p.querySelectorAll('[data-pdog]').forEach((b) => { b.onclick = () => { SFX.click(); jProfDog = b.dataset.pdog; jFamId = b.dataset.pdog; openJournal(); }; });
  p.querySelectorAll('[data-fam]').forEach((b) => { b.onclick = () => { SFX.click(); jFamId = b.dataset.fam; if (dogById(jFamId)) jProfDog = jFamId; openJournal('family'); }; });
  p.querySelectorAll('[data-cbreed]').forEach((b) => { b.onclick = () => { SFX.click(); jCoatKey = b.dataset.cbreed; openJournal('coats'); }; });
  p.querySelectorAll('[data-spots]').forEach((b) => { b.onclick = () => { SFX.click(); if (typeof openSpots === 'function') openSpots(); else toast(`Dog spots: ${S.dogs.length} dog${S.dogs.length > 1 ? 's' : ''} at home. More spots open with Bond.`); }; });
  if (jTab === 'family') pinFamNodes(p);
  p.querySelectorAll('[data-jeq]').forEach((b) => { b.onclick = () => { equip(b.dataset.jeq); openJournal(); }; });
  const toYard = (fn) => { closeModal(); if (cur.mode !== 'yard') go('yard'); setTimeout(fn, 350); };
  p.querySelectorAll('[data-jfeed]').forEach((b) => { b.onclick = () => toYard(() => feed(b.dataset.jfeed)); });
  p.querySelectorAll('[data-jplay]').forEach((b) => { b.onclick = () => toYard(() => playPick('fetch:' + b.dataset.jplay)); });
  p.querySelectorAll('[data-jtoy]').forEach((b) => { b.onclick = () => toYard(() => playPick(b.dataset.jtoy)); });
  p.querySelectorAll('[data-jopen]').forEach((b) => { b.onclick = () => { closeModal(); b.dataset.jopen === 'garden' ? openGarden() : openKitchen(); }; });
  p.querySelectorAll('[data-jtoyplay]').forEach((b) => { b.onclick = () => toYard(() => playPick('toy:' + b.dataset.jtoyplay)); });
}


/* ======================= v2: family register helpers (SYSTEMS) ======================= */
// Every record a dog id can point at: home dogs, nursery pups, rehomed pups, NPC litters, then the S.tree register.
const famParents = (r) => { const p = r && r.parents; if (!p) return [null, null]; if (Array.isArray(p)) return [p[0] || null, p[1] || null]; return [p.dam || null, p.sire || null]; };
function famRec(id) {
  if (!id || !S) return null;
  const T = (S.tree && typeof S.tree === 'object' && S.tree[id]) || null, home = dogById(id);
  if (home) return Object.assign({}, T || {}, { id, name: home.name, key: home.key, sex: home.sex, born: home.born, genes: home.genes, mix: home.mix || (T && T.mix) || null, sparkle: !!(home.sparkle || (T && T.sparkle)), parents: home.parents || (T && T.parents) || null, gen: home.gen, status: 'home', live: home, rescue: home.rescue });
  for (const l of S.litters || []) for (const p of (l && l.pups) || []) if (p && p.id === id) return Object.assign({}, T || {}, p, { status: 'litter', mum: l.mum });
  const r = (S.rehomed || []).find((x) => x && x.id === id); if (r) return Object.assign({}, T || {}, r, { status: 'rehomed' });
  for (const l of S.npcLitters || []) for (const p of (l && l.pups) || []) if (p && p.id === id) return Object.assign({ status: 'npc' }, T || {}, p);
  return T ? Object.assign({ status: 'npc' }, T, { id }) : null;
}
function famAllIds() {
  const ids = new Set(); if (!S) return ids;
  S.dogs.forEach((d) => ids.add(d.id)); Object.keys(S.tree || {}).forEach((k) => ids.add(k));
  (S.rehomed || []).forEach((r) => r && r.id && ids.add(r.id));
  (S.litters || []).concat(S.npcLitters || []).forEach((l) => ((l && l.pups) || []).forEach((p) => p && p.id && ids.add(p.id)));
  return ids;
}
function famChildren(id) {
  const out = []; if (!id) return out;
  famAllIds().forEach((k) => { const r = famRec(k); if (r && famParents(r).includes(id)) out.push(r); });
  return out.sort((a, b) => String(a.born || '').localeCompare(String(b.born || '')) || String(a.name).localeCompare(String(b.name)));
}
/* genes that show a given coat name for a breed (exact 3^5*2 enumeration, memoised): used to draw records that only stored a coat name */
const coatGeneMemo = {};
function coatGeneMap(key) {
  if (coatGeneMemo[key]) return coatGeneMemo[key];
  const G = PGN(), m = {}; if (!G) return m;
  const P = { B: [['B', 'B'], ['B', 'b'], ['b', 'b']], D: [['D', 'D'], ['D', 'd'], ['d', 'd']], E: [['E', 'E'], ['E', 'e'], ['e', 'e']], S: [['S', 'S'], ['S', 'sp'], ['sp', 'sp']], M: [['m', 'm'], ['M', 'm']], Bl: [['bl', 'bl'], ['Bl', 'bl'], ['Bl', 'Bl']] };
  try {
    for (const b of P.B) for (const d of P.D) for (const e of P.E) for (const s of P.S) for (const mm of P.M) for (const bl of P.Bl) {
      const g = { B: b, D: d, E: e, S: s, M: mm, Bl: bl }, ph = G.phenotype(g, key, 'coatbook');
      if (ph && ph.coatName && !m[ph.coatName]) m[ph.coatName] = g;
    }
  } catch (e) { /* genes module changed */ }
  coatGeneMemo[key] = m; return m;
}
function famDraw(r) { // something dogSVG/headSVG can draw
  if (!r) return null; if (r.live) return r.live;
  const o = { id: r.id, key: r.key || 'mutt', genes: r.genes, born: r.born, mix: r.mix || null, sparkle: !!r.sparkle, sex: r.sex, name: r.name };
  if (!o.genes && r.coat) { const g = coatGeneMap(o.key)[r.coat]; if (g) o.genes = g; }
  return o;
}
function famHead(r) { const d = famDraw(r); if (!d) return ''; try { return headSVG(d); } catch (e) { return art('dogHead', d.key); } }
const breedName = (k) => (dogInfo(k) || {}).breed || k;
function mixLine(r) {
  if (r && r.mix && r.mix.name) { const a = r.mix.a, b = r.mix.b; return a && b && a !== b ? `${r.mix.name}: ${breedName(a)} × ${breedName(b)}` : r.mix.name; }
  return r ? breedName(r.key) : '';
}
function famChip(r) {
  if (!r) return '';
  if (r.status === 'home') return '<span class="fchip home">Home</span>';
  if (r.status === 'litter') return '<span class="fchip nursery">Nursery</span>';
  if (r.status === 'rehomed') return `<span class="fchip away">With ${esc(shortFam(r.family))}</span>`;
  const who = r.family || r.owner; return `<span class="fchip npc">${who ? 'With ' + esc(shortFam(who)) : 'Town dog'}</span>`;
}
function pdogTabs(selId) {
  return S.dogs.length > 1 ? `<div class="tabs pdogs" role="tablist">${S.dogs.map((d) => `<button class="btn" role="tab" data-pdog="${d.id}" aria-selected="${d.id === selId}"><span class="ic">${headSVG(d)}</span>${esc(d.name)} ${d.sex === 'female' ? '♀' : '♂'}</button>`).join('')}</div>` : '';
}

/* ---------- Family tab ---------- */
const FT_POS = [[12.5, 16], [37.5, 16], [62.5, 16], [87.5, 16], [25, 47], [75, 47], [50, 79]]; // % of the 600x380 tree: grandparents, dam, sire, dog
function famTreeDoodle() {
  const leaf = (x, y, r, c) => `<path d="M${x - r} ${y} q${r * 0.2} -${r * 1.05} ${r} -${r * 0.95} q${r * 0.95} -${r * 0.15} ${r} ${r * 0.9} q-${r * 0.1} ${r * 1.05} -${r} ${r} q-${r * 1.0} ${r * 0.1} -${r} -${r * 0.95}z" fill="${c}" stroke="#5B3D32" stroke-width="2" stroke-linejoin="round"/>`;
  const br = (a, b, w) => `<path d="M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2 + 8} ${(a[1] + b[1]) / 2 + 14} ${b[0]} ${b[1]}" fill="none" stroke="#9C7452" stroke-width="${w}" stroke-linecap="round"/><path d="M${a[0]} ${a[1]} Q${(a[0] + b[0]) / 2 + 8} ${(a[1] + b[1]) / 2 + 14} ${b[0]} ${b[1]}" fill="none" stroke="#5B3D32" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`;
  const P = FT_POS.map(([x, y]) => [x * 6, y * 3.8]);
  return `<svg viewBox="0 0 600 380" class="ft-doodle" aria-hidden="true"><path d="M30 372 Q300 352 570 372" fill="none" stroke="#8FBF7A" stroke-width="6" stroke-linecap="round"/>
    ${br([300, 370], P[6], 18)}${br(P[6], P[4], 12)}${br(P[6], P[5], 12)}${br(P[4], P[0], 7)}${br(P[4], P[1], 7)}${br(P[5], P[2], 7)}${br(P[5], P[3], 7)}
    ${P.map(([x, y], i) => leaf(x - 34, y + 4, i === 6 ? 50 : 40, ['#CFEAB0', '#BFE3A6', '#D8EFC0', '#C6E6AE', '#BFE3A6', '#CFEAB0', '#E2F3CF'][i])).join('')}
    ${[[150, 330], [460, 335], [95, 250], [520, 240]].map(([x, y], i) => leaf(x, y, 9, i % 2 ? '#F7C6CF' : '#CFEAB0')).join('')}</svg>`;
}
function famNode(id, i, unknownTxt) {
  const r = famRec(id), [x, y] = FT_POS[i], st = `left:${x}%;top:${y}%`;
  if (!r) return `<div class="fnode unk ${i === 6 ? 'me' : ''}" data-node-i="${i}" style="${st}"><span class="fhead"><b>?</b></span><span class="fname">${esc(unknownTxt || '?')}</span></div>`;
  return `<button class="fnode ${i === 6 ? 'me' : ''} ${r.sparkle ? 'spk' : ''}" data-node-i="${i}" data-fam="${esc(r.id)}" style="${st}" title="${esc(mixLine(r))}"><span class="fhead">${famHead(r)}</span><span class="fname">${esc(r.name || '?')} ${sexSym(r.sex)}</span>${i === 6 ? '' : `<span class="fsub">${esc(r.mix && r.mix.name ? r.mix.name : breedName(r.key))}</span>`}</button>`;
}
function journalFamily() {
  if (!jFamId || !famRec(jFamId)) jFamId = (dogById(jProfDog) || D()).id;
  const me = famRec(jFamId), [dam, sire] = famParents(me);
  const shelterTxt = (r) => (r && (r.status === 'home' || r.status === 'rehomed' || r.status === 'litter') && !(r.gen > 0) ? 'Shelter rescue' : '?');
  const pRec = [famRec(dam), famRec(sire)];
  const gp = pRec.map((pr) => famParents(pr)).flat();
  const unkP = shelterTxt(me), unkG = pRec.map((pr) => (pr ? shelterTxt(pr) : '?'));
  const nodes = [0, 1, 2, 3].map((i) => famNode(gp[i], i, unkG[i < 2 ? 0 : 1])).join('') + famNode(dam, 4, unkP === '?' ? 'Mum: ?' : unkP) + famNode(sire, 5, unkP === '?' ? 'Dad: ?' : unkP) + famNode(me.id, 6);
  const art0 = artReal('prop', 'familytree');
  const kids = famChildren(me.id);
  const homeSel = dogById(me.id) ? me.id : null;
  const P = prOf(me), m = me.born ? ageMonths(me) : null;
  const about = `<div class="fam-me"><span class="portrait big">${famHead(me)}</span><div><h3>${esc(me.name)} ${sexSym(me.sex)}${me.sparkle ? ' <span class="spkbadge">Sparkle</span>' : ''}</h3>
    <p>${esc(mixLine(me))}</p><p class="small">${m != null ? `${ageText(m)} old · ` : ''}Generation ${me.gen || (dam || sire ? 1 : 0)}</p><p>${famChip(me)}</p></div></div>`;
  const kidsHTML = kids.length ? `<div class="fkids">${kids.map((k) => `<button class="fkid ${k.sparkle ? 'spk' : ''}" data-fam="${esc(k.id)}"><span class="fhead">${famHead(k)}</span><span class="fname">${esc(k.name || '?')} ${sexSym(k.sex)}</span>${famChip(k)}</button>`).join('')}</div>`
    : `<p class="small fnone">No puppies yet. ${me.status === 'home' ? `When ${P.he} is grown up, a Puppy Playdate could change that.` : 'This branch is still growing.'}</p>`;
  return `${pdogTabs(homeSel)}<div class="famwrap"><div class="ft ${art0 ? 'ft-real' : ''}"><div class="ft-art">${art0 || famTreeDoodle()}</div>${nodes}</div>
    <div class="fside">${about}${homeSel ? '' : `<button class="btn fback" data-fam="${esc((dogById(jProfDog) || D()).id)}">Back to ${esc((dogById(jProfDog) || D()).name)}</button>`}<h4>Puppies (${kids.length})</h4>${kidsHTML}<p class="small">Tap anyone on the tree to put them at the bottom.</p></div></div>`;
}
// When the real familytree prop marks its leaf spots with data-node, move our nodes onto them (sorted by height: 4 grandparents, 2 parents, the dog).
function pinFamNodes(p) {
  try {
    const ft = p.querySelector('.ft'), spots = ft ? [...ft.querySelectorAll('.ft-art [data-node]')] : []; if (spots.length < 7) return;
    const box = ft.getBoundingClientRect(); if (!box.width) return;
    const c = spots.map((el) => { const r = el.getBoundingClientRect(); return { x: (r.left + r.width / 2 - box.left) / box.width * 100, y: (r.top + r.height / 2 - box.top) / box.height * 100 }; }).sort((a, b) => a.y - b.y);
    const ord = c.slice(0, 4).sort((a, b) => a.x - b.x).concat(c.slice(4, 6).sort((a, b) => a.x - b.x), c.slice(6, 7));
    ft.querySelectorAll('[data-node-i]').forEach((n) => { const q = ord[+n.dataset.nodeI]; if (q) { n.style.left = q.x + '%'; n.style.top = q.y + '%'; } });
  } catch (e) { /* keep the default spots */ }
}

/* ---------- Coats tab: the Coat Collection ---------- */
const COAT_MILESTONES = [[5, 100], [15, 300], [30, 800], [50, 0]];
const RIBBON = 'Coat Collector Ribbon';
if (!CHARMS.some((c) => c.n === RIBBON)) CHARMS.push({ n: RIBBON, slot: 'charm', perk: 'Coat Collector: 15 coats found. Pure bragging rights. Other dogs can tell.' });
const coatBreeds = () => { const G = window.PawGenes; const b = G && Array.isArray(G.BREEDS) && G.BREEDS.length ? G.BREEDS : dogsList().map((d) => d.key); return b.slice(0, 12); };
function coatCatalogOf(key) {
  try { const G = window.PawGenes; if (G && typeof G.coatCatalog === 'function') { const c = G.coatCatalog(key); if (Array.isArray(c) && c.length) return c; } } catch (e) { /* older genes module */ }
  return null;
}
const coatBookOf = () => (S.coatBook && typeof S.coatBook === 'object' ? S.coatBook : (S.coatBook = {}));
const coatsFound = (key) => Object.keys(coatBookOf()).filter((k) => k.split('|')[0] === key).map((k) => k.slice(key.length + 1));
const coatCount = () => Object.keys(coatBookOf()).length;
// Log the coats of everyone at home and every rehomed pup (BREED logs births; this keeps starters, rescues and old saves in the book)
function coatSync() {
  if (!S || !S.dogs) return 0; const book = coatBookOf(); let n = 0;
  const log = (d, when) => { if (!d || !d.key) return; let c = ''; try { c = coatNameOf(d); } catch (e) { c = d.coat || ''; } if (!c) return; const k = d.key + '|' + c; if (!book[k]) { book[k] = when || localISO(); n++; } };
  S.dogs.forEach((d) => log(d, d.rescue && d.rescue.date)); (S.rehomed || []).forEach((r) => log(r, r.since));
  if (n) markDirty(); return n;
}
function coatRewardsCheck() {
  if (!S) return []; if (!S.coatRewards || typeof S.coatRewards !== 'object') S.coatRewards = {};
  const have = coatCount(), got = [];
  COAT_MILESTONES.forEach(([n, coins]) => {
    if (have < n || S.coatRewards[n]) return; S.coatRewards[n] = localISO(); got.push(n);
    if (coins) addCoins(coins, { raw: true });
    if (n === 15 && !S.inv.charms.includes(RIBBON)) S.inv.charms.push(RIBBON);
    const msg = n === 5 ? `Coat Collection: 5 coats! +${coins} coins. A very fashionable family.` : n === 15 ? `Coat Collection: 15 coats! +${coins} coins and the ${RIBBON} charm.` : n === 30 ? `Coat Collection: 30 coats! +${coins} coins. Scientists are taking notes.` : 'Coat Collection: 50 coats! You are now a Master Breeder. It says so on the Profile.';
    toast(msg, 'gold'); try { SFX.fanfare(); } catch (e) { /* audio off */ }
  });
  if (got.length) markDirty(); return got;
}
function coatFrame(found, inner, cls) {
  const fr = artReal('prop', 'coatframe', { found });
  return `<span class="cframe ${fr ? 'cf-real' : 'cf-doodle'} ${found ? 'found' : 'unk'} ${cls || ''}">${fr ? `<span class="cf-bg">${fr}</span>` : ''}<span class="cf-in">${inner}</span></span>`;
}
function journalCoats() {
  const breeds = coatBreeds(); if (!jCoatKey || !breeds.includes(jCoatKey)) jCoatKey = breeds.includes((D() || {}).key) ? D().key : breeds[0];
  const cats = {}; breeds.forEach((k) => { cats[k] = coatCatalogOf(k); });
  const haveCats = breeds.every((k) => cats[k]);
  const total = haveCats ? breeds.reduce((a, k) => a + cats[k].length, 0) : 0, found = coatCount();
  const book = coatBookOf(), key = jCoatKey, mine = coatsFound(key), cat = cats[key];
  const list = cat ? cat.map((c) => ({ coat: c.coat, rare: !!c.rare, how: c.how || '', found: mine.includes(c.coat) })).concat(mine.filter((n) => !cat.some((c) => c.coat === n)).map((n) => ({ coat: n, found: true }))) : mine.map((n) => ({ coat: n, found: true }));
  const cell = (c) => {
    if (c.found) { const g = coatGeneMap(key)[c.coat]; const d = { id: 'coat|' + key + '|' + c.coat, key, genes: g }; return `<div class="coat found ${c.rare ? 'rare' : ''}" data-coat="${esc(c.coat)}">${coatFrame(true, (() => { try { return headSVG(d); } catch (e) { return art('dogHead', key); } })())}<b>${esc(c.coat)}</b><span class="small">${c.rare ? '<span class="rarechip">Rare</span> ' : ''}Found ${esc(book[key + '|' + c.coat] || '')}</span></div>`; }
    return `<div class="coat unk ${c.rare ? 'rare' : ''}">${coatFrame(false, '<b class="q">?</b>')}<b>???</b><span class="small">${mine.length ? esc(c.how || 'Keep breeding to discover it.') : 'Find any coat of this breed for a hint.'}</span></div>`;
  };
  const tabs = `<div class="cbreeds" role="tablist">${breeds.map((k) => { const n = coatsFound(k).length, t = cats[k] ? cats[k].length : null; return `<button class="cbreed ${k === key ? 'on' : ''}" role="tab" aria-selected="${k === key}" data-cbreed="${k}" title="${esc(breedName(k))}"><span class="ic">${art('dogHead', k)}</span><span>${n}${t ? '/' + t : ''}</span>${S.sparkleBook && S.sparkleBook[k] ? '<i class="cspk" aria-label="sparkle found">&#10022;</i>' : ''}</button>`; }).join('')}</div>`;
  const sp = S.sparkleBook && typeof S.sparkleBook === 'object' ? S.sparkleBook : {};
  const spN = breeds.filter((k) => sp[k]).length;
  const miles = COAT_MILESTONES.map(([n, c]) => `<span class="cmile ${S.coatRewards && S.coatRewards[n] ? 'done' : ''}" title="${n} coats"><b>${n}</b>${n === 50 ? 'Master Breeder' : n === 15 ? `${c} + Ribbon` : `${c} coins`}${S.coatRewards && S.coatRewards[n] ? ' &#10003;' : ''}</span>`).join('');
  return `<div class="ctop"><div class="ccount"><b>${found}${haveCats ? ' / ' + total : ''}</b><span class="small">coats${haveCats ? '' : ' found'}</span><div class="prog"><i style="width:${haveCats && total ? Math.min(100, found / total * 100) : Math.min(100, found * 2)}%"></i></div></div>
    <div class="cmiles">${miles}</div>
    <div class="csparkle" aria-label="Sparkle puppies: ${spN} of ${breeds.length}"><span class="small">Sparkle pups ${spN}/${breeds.length}</span><span class="cstars">${breeds.map((k) => `<i class="${sp[k] ? 'on' : ''}" title="${esc(breedName(k))}${sp[k] ? ': sparkle found' : ''}">&#10022;</i>`).join('')}</span></div></div>
    ${tabs}<h4 class="cbh">${esc(breedName(key))} <span class="small">${mine.length}${cat ? ' of ' + cat.length : ''} found</span></h4>
    ${list.length ? `<div class="cgrid">${list.map(cell).join('')}</div>` : `<p class="small cnone">No ${esc(breedName(key))} coats yet. Every dog you raise, every puppy born and every rescue adds their coat here.</p>`}`;
}
on('game:ready', () => { coatSync(); coatRewardsCheck(); });
on('dog:added', () => setTimeout(() => { coatSync(); coatRewardsCheck(); }, 0));
on('yard:enter', () => { coatSync(); coatRewardsCheck(); });
