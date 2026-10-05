/* ======================= v2: 13b_breeding.js (BREED lane) =======================
   Puppy Playdates: rules (canPair), the playdate popup + scene, pregnancy, the family register (S.tree), the coat log,
   NPC playdates (your female x NPC male = your litter; your male x NPC female = a "pick of the litter" letter) and adoptPick.
   Birth, nursery, Who stays and rehoming live in 13c_litter.js. 1 real day = 1 dog month. */
(function brRulesOn() { const R = BREEDING.RULES; R.enabled = true; R.welfare = Object.assign({}, R.welfare, { minBond: 6 }); R.maleRestDays = R.maleRestDays || 2; R.success = 0.85; R.sparkleOdds = 1 / 512; R.sparklePity = 24; })();

/* ---- small helpers (dates are local ISO 'YYYY-MM-DD') ---- */
const brToday = () => localISO();
function brAddDays(iso, n) { const d = new Date((iso || brToday()) + 'T12:00:00'); d.setDate(d.getDate() + n); return localISO(d); }
function brDaysUntil(iso) { if (!iso) return 0; const a = new Date(brToday() + 'T12:00:00'), b = new Date(iso + 'T12:00:00'); return Math.round((b - a) / 864e5); }
const brBreed = (k) => (dogInfo(k) || {}).breed || k;
const brG = () => window.PawGenes || null;
const brPR = (d) => (d && d.sex === 'female' ? { he: 'she', him: 'her', his: 'her', He: 'She', His: 'Her', boy: 'girl' } : { he: 'he', him: 'him', his: 'his', He: 'He', His: 'His', boy: 'boy' });
const brFix = (d) => (d.sex === 'female' ? 'spayed' : 'neutered');
function brFields(s) {
  s = s || S; if (!s) return;
  s.tree = s.tree && typeof s.tree === 'object' ? s.tree : {}; s.litters = Array.isArray(s.litters) ? s.litters : []; s.rehomed = Array.isArray(s.rehomed) ? s.rehomed : [];
  s.npcLitters = Array.isArray(s.npcLitters) ? s.npcLitters : []; s.coatBook = s.coatBook || {}; s.sparkleBook = s.sparkleBook || {};
  s.pupsBorn = s.pupsBorn || 0; s.pupsSinceSparkle = s.pupsSinceSparkle || 0; s.playFun = s.playFun || {};
}
// parents in either shape -> {dam, sire} | null
function brPar(p) { if (!p) return null; if (Array.isArray(p)) return p.length ? { dam: p[0], sire: p[1] } : null; return p.dam || p.sire ? { dam: p.dam || null, sire: p.sire || null } : null; }
const brIsNursing = (d) => !!(S && S.litters && d && S.litters.some((l) => l.mum === d.id));
function nursingMum(d) { return brIsNursing(d); }

/* ---- family register + coat log ---- */
function brRec(d, status, extra) {
  return Object.assign({ id: d.id, name: d.name, key: d.key, mix: d.mix || null, sex: d.sex, coat: coatNameOf(d) || d.coat || '', eyes: eyesOf(d) || d.eyes || 'brown', sparkle: !!d.sparkle, born: d.born || null, parents: brPar(d.parents), gen: d.gen || 0, status: status || 'home' }, extra || {});
}
function treePut(rec) {
  if (!S || !rec || !rec.id) return null; brFields();
  const old = S.tree[rec.id] || {}; const r = Object.assign({}, old, rec); r.parents = brPar(r.parents) || brPar(old.parents); S.tree[rec.id] = r; markDirty(); return r;
}
function coatLog(rec) {
  if (!S || !rec || !rec.key) return false; brFields();
  const coat = rec.coat || coatNameOf(rec); if (!coat) return false;
  const k = rec.key + '|' + coat, fresh = !S.coatBook[k]; if (fresh) S.coatBook[k] = brToday();
  if (rec.sparkle && !S.sparkleBook[rec.key]) S.sparkleBook[rec.key] = brToday();
  markDirty(); return fresh;
}
function brBackfill() {
  if (!S || !S.dogs) return; brFields();
  S.dogs.forEach((d) => { if (d.gen == null) d.gen = 0; if (d.sparkle == null) d.sparkle = false; const r = S.tree[d.id]; treePut(brRec(d, 'home', r && r.family ? { family: r.family } : {})); coatLog(brRec(d)); });
}
on('game:ready', () => { brBackfill(); setTimeout(breedTick, 1200); });
on('dog:added', (e) => { if (!e || !e.dog) return; brFields(); treePut(brRec(e.dog, 'home')); coatLog(brRec(e.dog)); });

/* ---- relatives: shared ancestor within 2 generations (parent, sibling, grandparent, aunt/uncle, first cousin) ---- */
function brLookup(id) { if (!id) return null; return dogById(id) || (S.tree && S.tree[id]) || null; }
function brRelated(a, b) {
  if (!a || !b) return false; if (a.id === b.id) return true;
  const map = {}; const put = (r) => { if (r && r.id) { const p = brPar(r.parents); map[r.id] = { id: r.id, parents: p ? [p.dam, p.sire] : null }; } };
  Object.values(S.tree || {}).forEach(put); S.dogs.forEach(put); put(a); put(b);
  const G = brG(); if (G && typeof G.related === 'function') { try { return !!G.related(map[a.id], map[b.id], map); } catch (e) { /* fall through */ } }
  const anc = (id) => { const seen = new Set(); let gen = [id]; for (let k = 0; k <= 2; k++) { const nx = []; gen.forEach((x) => { if (!x) return; seen.add(x); const r = map[x]; if (r && r.parents) r.parents.forEach((p) => p && nx.push(p)); }); gen = nx; } return seen; };
  const A = anc(a.id); for (const x of anc(b.id)) if (A.has(x)) return true; return false;
}
function brMerleX(a, b) {
  const G = brG(); if (G && typeof G.isDoubleMerle === 'function') { try { return !!G.isDoubleMerle(a.genes, b.genes); } catch (e) { /* fall through */ } }
  const m = (d) => !!(d.genes && d.genes.M && d.genes.M.includes('M')); return m(a) && m(b);
}

/* ---- readiness: one dog's issues (kind words) ---- */
const brMetersOK = (d) => Object.values(d.stats || {}).every((v) => v >= BREEDING.RULES.welfare.minMeters);
function brIssues(d, o) {
  o = o || {}; const R = BREEDING.RULES, P = brPR(d), out = [], npc = !!d.npc || !dogById(d.id), m = d.born ? ageMonths(d) : npc ? +(d.months || d.ageMonths || 24) : 10;
  const add = (code, txt) => out.push({ code, txt });
  if (d.fixed) add('fixed', `${d.name} is ${brFix(d)}. That was a loving choice, and it's for keeps.`);
  if (m < R.adultMonths) add('young', `${d.name} is only ${ageText(m)} old. Puppies can't have puppies: wait until 12 months.`);
  if (d.sex === 'male' && m >= R.noBreedFromMonths) add('old', `${d.name} has retired from romance. ${P.He} has earned ${P.his} naps.`);
  if (d.sex === 'female' && m >= R.female.noLittersFromMonths) add('old', `${d.name} is past litter age. ${P.He} is retired to full-time napping, with honours.`);
  if (!npc && ((d.bond && d.bond.level) || 1) < R.welfare.minBond) add('bond', `${d.name} needs Bond ${R.welfare.minBond} first (now ${(d.bond && d.bond.level) || 1}). A well-loved dog makes a calm parent.`);
  if (!npc && !brMetersOK(d)) add('meters', `${d.name} needs every care meter at ${R.welfare.minMeters}+ first. Hungry, tired dogs are not in the mood.`);
  if (d.sex === 'female') {
    if (d.preg) add('preg', `${d.name} is already expecting. ${P.He} is busy growing puppies.`);
    else if (!npc && brIsNursing(d)) add('nursing', `${d.name} is busy feeding ${P.his} puppies. Mum duty first.`);
    if ((d.litters || 0) >= R.female.maxLitters) add('litters', `${d.name} has had ${R.female.maxLitters} litters. ${P.He} is retired from mum duty, with a medal.`);
    if (d.lastLitter && brDaysUntil(brAddDays(d.lastLitter, R.heat.everyDays)) > 0) { const n = brDaysUntil(brAddDays(d.lastLitter, R.heat.everyDays)); add('recover', `${d.name} is resting one season after ${P.his} last litter (${n} more day${n > 1 ? 's' : ''}).`); }
    if (!o.force && !d.fixed && m >= R.adultMonths && !(npc ? d.inSeason !== false : seasonStatus(d).inSeason)) add('season', `${d.name} isn't in season. ${seasonStatus(d).txt}.`);
  } else if (d.restUntil && brDaysUntil(d.restUntil) > 0) { const n = brDaysUntil(d.restUntil); add('rest', `${d.name} is resting after ${P.his} last playdate (${n} more day${n > 1 ? 's' : ''}).`); }
  if (!npc && d.lastPlaydate === brToday() && !o.force) add('today', `${d.name} already had a playdate today. Tomorrow!`);
  return out;
}
const brAsDog = (x) => (typeof x === 'string' ? dogById(x) || (brNpc && brNpc.id === x ? brNpc : null) : x);
// canPair(a, b) -> { ok, why, code, dam, sire, friends }
function canPair(a, b, o) {
  a = brAsDog(a); b = brAsDog(b); o = o || {};
  if (!a || !b) return { ok: false, code: 'none', why: 'Pick two dogs first.' };
  if (a.id === b.id) return { ok: false, code: 'same', why: `That's ${a.name} twice. Even ${a.name} knows that.` };
  if (!a.sex || !b.sex || a.sex === b.sex) return { ok: false, code: 'sex', friends: true, why: 'Best friends! Puppies need a boy and a girl.' };
  const dam = a.sex === 'female' ? a : b, sire = dam === a ? b : a;
  for (const d of [dam, sire]) { const is = brIssues(d, o); if (is.length) return { ok: false, code: is[0].code, why: is[0].txt, dam, sire, friends: true }; }
  if (brRelated(dam, sire)) return { ok: false, code: 'related', why: `${dam.name} and ${sire.name} are family. Relatives never have puppies together.`, dam, sire, friends: true };
  if (BREEDING.RULES.welfare.noMerleXMerle && brMerleX(dam, sire)) return { ok: false, code: 'merle', why: `Both carry merle. Two merles can have puppies with eye and ear trouble, so these two stay friends.`, dam, sire, friends: true };
  return { ok: true, code: 'ok', why: `${dam.name} and ${sire.name} are a lovely match.`, dam, sire };
}

/* ---- litter roll (deterministic: dam id + sire id + date) ---- */
function brLitterSize(key, r) {
  const L = BREEDING.RULES.litters; const sz = Object.values(L).find((x) => x.breeds.includes(key)) || L.medium;
  let t = r() * sz.weights.reduce((s, w) => s + w, 0); for (let i = 0; i < sz.sizes.length; i++) { t -= sz.weights[i]; if (t < 0) return sz.sizes[i]; } return sz.sizes[sz.sizes.length - 1];
}
function brMix(dam, sire, r) {
  if (dam.key === sire.key && !dam.mix && !sire.mix) return { key: dam.key, mix: null };
  const parentsBreeds = [dam.key, sire.key, dam.mix && dam.mix.head, sire.mix && sire.mix.head].filter((k) => k && k !== 'mutt');
  if (dam.key === 'mutt' || sire.key === 'mutt' || dam.mix || sire.mix) {
    const pool = [...new Set(parentsBreeds)]; const head = pool.length && r() < 0.5 ? pool[Math.floor(r() * pool.length)] : 'mutt';
    return { key: 'mutt', mix: { a: dam.key, b: sire.key, body: 'mutt', head, name: 'Mutt mix' } };
  }
  const G = brG();
  if (G && typeof G.mixOf === 'function') { try { const m = G.mixOf(dam.key, sire.key, r); if (m && m.body) return { key: m.body, mix: { a: m.a || dam.key, b: m.b || sire.key, body: m.body, head: m.head || m.body, name: m.name || `${brBreed(dam.key)} × ${brBreed(sire.key)} mix` } }; } catch (e) { /* fallback */ } }
  const body = r() < 0.5 ? dam.key : sire.key, head = body === dam.key ? sire.key : dam.key;
  return { key: body, mix: { a: dam.key, b: sire.key, body, head, name: `${brBreed(dam.key)} × ${brBreed(sire.key)} mix` } };
}
function brPendingPups() { let n = 0; (S.dogs || []).forEach((d) => { if (d.preg && d.preg.pups) n += d.preg.pups.length; }); return n; }
function brGenes(dam, sire, r) {
  const G = brG(); let g = null;
  if (G && typeof G.inherit === 'function') { try { g = G.inherit(dam.genes, sire.genes, r); } catch (e) { g = null; } }
  if (!g) { g = {}; ['B', 'D', 'E', 'S', 'M', 'Bl'].forEach((k) => { const a = (dam.genes && dam.genes[k]) || ['x', 'x'], b = (sire.genes && sire.genes[k]) || ['x', 'x']; g[k] = [a[r() < 0.5 ? 0 : 1], b[r() < 0.5 ? 0 : 1]]; }); }
  if (g.M && g.M[0] === 'M' && g.M[1] === 'M') g.M = ['M', 'm']; // never double merle (the pair is blocked anyway)
  return g;
}
function rollLitter(dam, sire, o) {
  o = o || {}; const r = seeded(hashId('litter|' + dam.id + '|' + sire.id + '|' + brToday()));
  const n = o.size || brLitterSize(dam.key, r);
  const charm = (d) => d.outfit && d.outfit.charm === 'Sparkle Stone';
  const odds = BREEDING.RULES.sparkleOdds * (charm(dam) || charm(sire) ? 4 : 1);
  let pity = o.npc ? -1e9 : (S.pupsSinceSparkle || 0) + brPendingPups();
  const pups = [];
  for (let i = 0; i < n; i++) {
    const sex = r() < BREEDING.RULES.puppySex ? 'female' : 'male', genes = brGenes(dam, sire, r), bm = brMix(dam, sire, r);
    const sparkle = r() < odds || pity >= BREEDING.RULES.sparklePity - 1 || (o.sparkle && i === 0); pity = sparkle ? 0 : pity + 1;
    const id = 'p_' + hashId(dam.id + '|' + sire.id + '|' + brToday() + '|' + i).toString(36) + i;
    const pup = { id, name: '', key: bm.key, sex, genes, mix: bm.mix, sparkle: !!sparkle, born: null, parents: { dam: dam.id, sire: sire.id }, gen: Math.max(dam.gen || 0, sire.gen || 0) + 1 };
    const c = coatInfo(pup); pup.coat = c ? c.coatName : (STARTER_GENES[pup.key] || STARTER_GENES.mutt).coat; pup.eyes = c ? c.eyes : 'brown';
    pups.push(pup);
  }
  return pups;
}

/* ---- the playdate itself (state only; the popup animates around it) ---- */
let brNpc = null; // the NPC partner of the open playdate popup
function brPutNpc(n) { if (!n) return; treePut({ id: n.id, name: n.name, key: n.key, mix: n.mix || null, sex: n.sex, coat: n.coat || coatNameOf(n), eyes: n.eyes || eyesOf(n), sparkle: false, born: n.born || null, parents: null, gen: n.gen || 0, status: 'npc', owner: n.owner || n.family || null }); }
function doPlaydate(a, b, o) {
  o = o || {}; brFields(); a = brAsDog(a); b = brAsDog(b);
  const chk = canPair(a, b, o); if (!chk.ok) return { ok: false, why: chk.why, code: chk.code };
  const dam = chk.dam, sire = chk.sire, today = brToday(), R = BREEDING.RULES;
  [dam, sire].forEach((d) => { if (!d.npc) d.lastPlaydate = today; else brPutNpc(d); });
  const r = seeded(hashId('playdate|' + dam.id + '|' + sire.id + '|' + today));
  const hit = o.miss ? false : o.force || o.hit ? true : r() < R.success;
  [dam, sire].forEach((d) => { if (!d.npc && d.stats) d.stats.happy = clamp(d.stats.happy + 10, 0, 100); });
  if (!hit) { markDirty(); saveNow(); return { ok: true, pups: 0, why: `No puppies this time. ${dam.name} and ${sire.name} had a lovely day anyway.` }; }
  if (!sire.npc) sire.restUntil = brAddDays(today, R.maleRestDays);
  if (dam.npc) {
    // your boy x an NPC girl: her family keeps the litter; a letter arrives after 4 days
    const pups = rollLitter(dam, sire, { npc: true, sparkle: o.sparkle, size: o.size });
    const nl = { id: 'nl_' + hashId(dam.id + sire.id + today).toString(36), npc: dam.id, npcName: dam.name, owner: dam.owner || dam.family || 'her family', sire: sire.id, due: brAddDays(today, R.pregnancyDays), ready: brAddDays(today, R.pregnancyDays + R.puppyStayDays), pups, offered: false };
    S.npcLitters.push(nl); markDirty(); saveNow(); SFX.fanfare && SFX.fanfare();
    return { ok: true, pups: pups.length, npcLitter: nl.id, why: `Puppies on the way for ${dam.name}! ${nl.owner.replace(/^the /, 'The ')} will send news when they arrive.` };
  }
  const pups = rollLitter(dam, sire, { sparkle: o.sparkle, size: o.size });
  dam.preg = { sire: sire.id, sireKey: sire.key, sireName: sire.name, since: today, due: brAddDays(today, R.pregnancyDays), pups, scanned: false };
  if (sire.npc) brPutNpc(sire); treePut(brRec(dam, 'home')); if (!sire.npc) treePut(brRec(sire, 'home'));
  markDirty(); saveNow();
  return { ok: true, pups: pups.length, why: `Puppies on the way! ${dam.name} is expecting. Due in ${R.pregnancyDays} days.` };
}

/* ---- expecting / nursing mums eat for more (x1.2 / x1.3 hunger decay; base is 6 per real minute) ---- */
let brLastMin = Date.now();
on('clock:minute', () => {
  const now = Date.now(), mins = clamp((now - brLastMin) / 60000, 0, 2); brLastMin = now; if (!S || !S.dogs) return;
  S.dogs.forEach((d) => { const x = d.preg ? 0.2 : brIsNursing(d) ? 0.3 : 0; if (x && d.stats) d.stats.hunger = clamp(d.stats.hunger - 6 * x * mins, 0, 100); });
});

/* ---- the playdate popup ---- */
let brSel = { a: null, b: null };
function brCheck(ok, txt) { return `<li class="${ok ? 'ok' : 'no'}"><b>${ok ? '✓' : '✗'}</b> ${esc(txt)}</li>`; }
function brDogCard(d, picked, slot) {
  const is = brIssues(d), npc = !!d.npc || !dogById(d.id), m = d.born ? ageMonths(d) : npc ? +(d.months || d.ageMonths || 24) : 10;
  const sub = `${esc(d.mix && d.mix.name ? d.mix.name : brBreed(d.key))} · ${ageText(m)}${npc ? ` · ${esc(d.owner || d.family || 'a neighbour')}` : ''}`;
  return `<button class="pd-dog ${picked ? 'on' : ''} ${is.length ? 'notready' : 'ready'}" data-pd="${slot}|${d.id}" ${npc ? 'disabled' : ''} aria-pressed="${picked}">
    <span class="pd-head">${headSVG(d)}</span><span class="pd-txt"><b>${esc(d.name)} ${sexSym(d.sex)}</b><span class="small">${sub}</span>
    <span class="pd-st small">${is.length ? '✗ ' + esc(is[0].txt) : '✓ Ready for a playdate'}</span></span></button>`;
}
function brPredict(dam, sire) {
  const G = brG(); if (!G || typeof G.predict !== 'function' || !dam.geneTested || !sire.geneTested) return '';
  let rows = []; try { rows = G.predict(dam.genes, sire.genes, dam.key, sire.key) || []; } catch (e) { return ''; }
  if (!rows.length) return '';
  return `<div class="pd-predict"><b>Puppy Predictor</b> <span class="small">(from the gene tests)</span><ul>${rows.slice(0, 6).map((x) => `<li><span class="pd-bar" style="width:${Math.max(4, Math.round(x.pct))}%"></span>${esc(x.coat)}${x.eyes ? ', ' + esc(x.eyes) + ' eyes' : ''} <b>${Math.round(x.pct * 10) / 10}%</b></li>`).join('')}</ul></div>`;
}
function openPlaydates(opts) {
  opts = opts || {}; brFields();
  if (opts.npc) { brNpc = Object.assign({ npc: true, stats: null, bond: null, fixed: false, litters: 0 }, opts.npc); brNpc.npc = true; if (!brNpc.id) brNpc.id = 'npc_' + hashId((brNpc.name || '') + (brNpc.key || '') + brToday()).toString(36); } else if (!opts.keep) brNpc = null;
  const mine = S.dogs.filter((d) => !brNpc || d.sex !== brNpc.sex);
  if (!brNpc && S.dogs.length < 2) { openModal('Puppy Playdates', `<div class="pd-empty"><span class="pd-ic">${iconOr('playdate', '<path d="M-8 -2a6 6 0 0 1 8 -6a6 6 0 0 1 8 6c0 8 -8 12 -8 12s-8 -4 -8 -12z" fill="#F28FA5" stroke="#5B3D32" stroke-width="2"/>')}</span><p>Playdates need two dogs. Bring home another friend, or visit the playdate board at the Dog Park.</p></div>`, { cls: 'playdates' }); return; }
  if (brNpc && !mine.length) { openModal('Puppy Playdates', `<p>${esc(brNpc.name)} would love a friend, but none of your dogs ${brNpc.sex === 'female' ? 'is a boy' : 'is a girl'}. Puppies need a boy and a girl.</p>`, { cls: 'playdates' }); return; }
  const valid = (id) => mine.some((d) => d.id === id);
  if (brNpc) { brSel.b = brNpc.id; if (!valid(brSel.a)) brSel.a = (mine.find((d) => !brIssues(d).length) || mine[0]).id; }
  else {
    if (!valid(brSel.a)) brSel.a = (mine.find((d) => d.sex === 'female' && !brIssues(d).length) || mine.find((d) => d.sex === 'female') || mine[0]).id;
    if (!valid(brSel.b) || brSel.b === brSel.a) { const a = dogById(brSel.a); brSel.b = (mine.find((d) => d.id !== a.id && d.sex !== a.sex && !brIssues(d).length) || mine.find((d) => d.id !== a.id && d.sex !== a.sex) || mine.find((d) => d.id !== a.id)).id; }
  }
  const A = dogById(brSel.a), B = brNpc || dogById(brSel.b), chk = canPair(A, B);
  const col = (slot, list, sel) => `<div class="pd-col"><h3>${slot === 'a' ? (brNpc ? 'Your dog' : 'First friend') : brNpc ? 'Visiting friend' : 'Second friend'}</h3>${list.map((d) => brDogCard(d, d.id === sel, slot)).join('')}</div>`;
  const pre = chk.ok ? brPredict(chk.dam, chk.sire) : '';
  const verdict = `<div class="pd-verdict ${chk.ok ? 'ok' : 'no'}"><b>${chk.ok ? '✓' : chk.friends ? '♥' : '✗'}</b> ${esc(chk.why)}${chk.ok ? ' <span class="small">(85% chance of puppies)</span>' : ''}</div>`;
  const rules = `<details class="pd-rules"><summary>Playdate rules (real dog logic)</summary><ul class="small"><li>A boy and a girl, both adults (12 months+), not spayed or neutered.</li><li>Both at Bond ${BREEDING.RULES.welfare.minBond}+ with every care meter at 50+.</li><li>She must be in season, under 6 years, with fewer than 4 litters, and rest one season after a litter.</li><li>He rests 2 days after puppies are on the way. No relatives, and never merle with merle.</li></ul></details>`;
  const p = openModal('Puppy Playdates', `<div class="pd-pick">${col('a', mine, brSel.a)}${col('b', brNpc ? [brNpc] : mine.filter((d) => d.id !== brSel.a), brSel.b)}</div>${verdict}${pre}${rules}<div class="pd-scene" id="pdScene" hidden></div>`,
    { cls: 'playdates', foot: `<button class="btn no" id="pdNo">Not today</button>${chk.ok ? '<button class="btn yes big" id="pdGo">Playdate!</button>' : chk.friends && !brNpc ? '<button class="btn go big" id="pdFun">Just play</button>' : ''}` });
  p.querySelectorAll('[data-pd]').forEach((el) => { el.onclick = () => { const [slot, id] = el.dataset.pd.split('|'); brSel[slot] = id; if (slot === 'a' && brSel.b === id) brSel.b = null; SFX.click(); openPlaydates({ keep: true }); }; });
  $('#pdNo', p).onclick = () => { SFX.click(); closeModal(); };
  const go1 = $('#pdGo', p); if (go1) go1.onclick = () => brRunScene(p, A, B, false);
  const fun = $('#pdFun', p); if (fun) fun.onclick = () => brRunScene(p, A, B, true);
}
// play-bow -> chase -> lie down together, then the result
function brRunScene(p, A, B, justPlay) {
  const sc = $('#pdScene', p); if (!sc) return; p.classList.add('pd-playing');
  p.querySelectorAll('.foot .btn').forEach((b) => { b.disabled = true; });
  const pose = (d, ps, face) => dogSVG(d, { pose: ps, facing: face, outfit: d.outfit ? outfitOf(d) : undefined });
  const draw = (pa, pb, cls) => { sc.className = 'pd-scene ' + cls; sc.innerHTML = `<div class="pd-pal a">${pose(A, pa, 'right')}</div><div class="pd-pal b">${pose(B, pb, 'left')}</div><div class="pd-hearts" aria-hidden="true"><i></i><i></i><i></i></div>`; };
  sc.hidden = false; const fast = document.documentElement.dataset.motion === 'off';
  draw('bow', 'bow', 'ph-bow'); if (window.PawAudio && typeof PawAudio.sting === 'function') { try { PawAudio.sting('playdate'); } catch (e) { /* ignore */ } }
  setTimeout(() => draw('walk', 'walk', 'ph-chase'), fast ? 60 : 900);
  setTimeout(() => draw('down', 'down', 'ph-rest'), fast ? 120 : 2100);
  setTimeout(() => {
    let res;
    if (justPlay) {
      const k = [A.id, B.id].sort().join('|'), first = S.playFun[k] !== brToday(); S.playFun[k] = brToday();
      if (first) [A, B].forEach((d) => { if (d.stats) d.stats.happy = clamp(d.stats.happy + 5, 0, 100); });
      res = { ok: true, pups: 0, fun: true, why: `${A.name} and ${B.name} zoomed, wrestled and flopped. Best friends!${first ? ' +5 Happiness each.' : ''}` };
      markDirty(); updateHUD();
    } else res = doPlaydate(A, B);
    brResult(res);
  }, fast ? 200 : 3000);
}
function brResult(res) {
  const ok = res.ok && res.pups > 0;
  const p = openModal(ok ? '<span class="hl">Puppies on the way!</span>' : res.fun ? 'Best friends!' : 'A lovely day', `<div class="pd-result ${ok ? 'yay' : ''}" id="pdResult" data-pups="${res.pups || 0}"><p>${esc(res.why)}</p>${ok && !res.npcLitter ? '<p class="small">Expecting mums eat a bit more, skip long walks and love a vet check-up. Puppies arrive in 2 days.</p>' : ''}${!ok && !res.fun && res.ok ? '<p class="small">They may try again tomorrow while she is still in season.</p>' : ''}${!res.ok ? '<p class="small">Nothing happened. No hard feelings, just naps.</p>' : ''}</div>`, { cls: 'playdates celebrate', foot: '<button class="btn yes big" id="pdOk">Aww</button>' });
  $('#pdOk', p).onclick = () => { SFX.click(); closeModal(); };
  if (ok) { SFX.fanfare && SFX.fanfare(); audioCue('levelup'); }
  updateHUD();
}

/* ---- NPC letters + pick of the litter ---- */
function brNpcTick() {
  if (!S || !S.npcLitters) return; const today = brToday();
  S.npcLitters.forEach((nl) => {
    if (nl.offered || today < nl.ready) return;
    nl.offered = true; const sire = dogById(nl.sire) || brLookup(nl.sire) || { name: 'Your dog' }, born = nl.due;
    nl.pups.forEach((pp, i) => { if (!pp.born) pp.born = born; if (!pp.name) pp.name = brPupName(seeded(hashId(nl.id + i)), nl.pups, i); treePut(Object.assign({}, brRecSpec(pp), { status: 'npc', owner: nl.owner })); coatLog(pp); });
    const free = brFree(), Owner = nl.owner.replace(/^the /, 'The ');
    const msg = { kind: 'litter', from: nl.owner, title: `${sire.name}'s puppies are here!`, text: `${nl.pups.length} healthy pup${nl.pups.length > 1 ? 's' : ''}. ${nl.npcName}'s family says thank you!${free > 0 ? ' As a thank-you, you may adopt one pup: pick of the litter, free.' : ' (No free dog spot right now, so the pups stay with them. They send kisses.)'}`, dog: nl.pups[0], litter: nl.id, pick: free > 0 };
    let sent = null; if (typeof mailPush === 'function') { try { sent = mailPush(msg); } catch (e) { sent = null; } }
    if (sent && sent.id) nl.mailId = sent.id;
    else if (typeof mailPush === 'function') { const last = (S.mail || []).slice(-1)[0]; if (last && last.litter === nl.id) nl.mailId = last.id; }
    if (typeof mailPush !== 'function') { nl.letterPending = true; toast(`${Owner}: ${msg.title} ${nl.npcName}'s family says thank you.`, 'gold'); }
    markDirty();
  });
}
function brLetterPopup() { // fallback when the mailbox lane is missing: show the letter as a popup in the yard
  const nl = (S.npcLitters || []).find((x) => x.letterPending); if (!nl) return false;
  nl.letterPending = false; const sire = dogById(nl.sire) || { name: 'Your dog' }, free = brFree();
  const p = openModal(`${esc(sire.name)}'s puppies are here!`, `<p>A letter from ${esc(nl.owner)}: "${nl.pups.length} healthy pup${nl.pups.length > 1 ? 's' : ''}! ${esc(nl.npcName)}'s family says thank you."</p><div class="lt-row">${nl.pups.map((pp) => `<span class="lt-mini">${dogSVG(pp, { pose: 'sleep' })}</span>`).join('')}</div>`, { cls: 'litter', foot: `<button class="btn no" id="ltNo">Lovely</button>${free > 0 && !nl.picked ? '<button class="btn yes big" id="ltPick">Adopt a pup</button>' : ''}` });
  $('#ltNo', p).onclick = () => closeModal(); const pk = $('#ltPick', p); if (pk) pk.onclick = () => adoptPick(nl.id);
  return true;
}
function brFindNpcLitter(letterId) {
  const L = S.npcLitters || []; let nl = L.find((x) => x.id === letterId || x.mailId === letterId);
  if (!nl && S.mail) { const m = S.mail.find((x) => x.id === letterId); if (m && m.litter) nl = L.find((x) => x.id === m.litter); }
  return nl || null;
}
function adoptPick(letterId, pupId) {
  brFields(); const nl = brFindNpcLitter(letterId);
  if (!nl) { nope('That litter letter is a bit smudged. No puppies found.'); return false; }
  if (nl.picked) { nope(`You already adopted ${nl.pickedName || 'a pup'} from this litter.`); return false; }
  if (brFree() <= 0) { nope('No free dog spot right now. New friends need a free spot.'); return false; }
  const take = (pp) => {
    const d = brKeepPup(pp, pp.name); nl.picked = pp.id; nl.pickedName = d.name; treePut(brRec(d, 'home')); markDirty(); saveNow();
    closeModal(); SFX.fanfare && SFX.fanfare(); toast(`${d.name} is home! ${brPR(d).He} brought ${brPR(d).his} favourite sock from ${nl.owner}'s house.`, 'gold');
    if (cur.mode === 'yard') go('yard'); return d;
  };
  if (pupId) { const pp = nl.pups.find((x) => x.id === pupId); return pp ? take(pp) : false; }
  const p = openModal('Pick of the litter', `<p>${esc(nl.npcName)}'s family lets you choose one pup to bring home, free.</p><div class="lt-pups">${nl.pups.map((pp) => `<button class="lt-card pick" data-pick="${pp.id}">${pp.sparkle ? '<span class="lt-spark">Sparkle!</span>' : ''}<span class="lt-art">${dogSVG(Object.assign({}, pp, { born: brAddDays(brToday(), -2) }), { pose: 'sit' })}</span><b>${esc(pp.name)} ${sexSym(pp.sex)}</b><span class="small">${esc(pp.mix ? pp.mix.name : brBreed(pp.key))}<br>${esc(pp.coat)}, ${esc(pp.eyes)} eyes</span></button>`).join('')}</div>`, { cls: 'litter' });
  p.querySelectorAll('[data-pick]').forEach((b) => { b.onclick = () => take(nl.pups.find((x) => x.id === b.dataset.pick)); });
  return true;
}
