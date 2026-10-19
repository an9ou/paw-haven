/* ======================= v2: 13b_breeding.js (BREED lane) =======================
   Puppy Playdates: rules (canPair), the playdate popup + scene, pregnancy, the family register (S.tree), the coat log,
   NPC playdates (your female x NPC male = your litter; your male x NPC female = a "pick of the litter" letter) and adoptPick.
   Birth, nursery, Who stays and rehoming live in 13c_litter.js. 1 real day = 1 dog month. */
(function brRulesOn() { const R = BREEDING.RULES; R.enabled = true; R.welfare = Object.assign({}, R.welfare, { minBond: 6 }); R.maleRestDays = R.maleRestDays || 2; R.success = 0.85; R.sparkleOdds = 1 / 512; R.sparklePity = 24; })();

/* ---- small helpers (dates are local ISO 'YYYY-MM-DD') ---- */
const brToday = () => localISO();
function brAddDays(iso, n) { const d = new Date((iso || brToday()) + 'T12:00:00'); d.setDate(d.getDate() + n); return localISO(d); }
function brDaysUntil(iso) { if (!iso) return 0; const a = new Date(brToday() + 'T12:00:00'), b = new Date(iso + 'T12:00:00'); return Math.round((b - a) / 864e5); }
const brBreed = (k) => { const i = dogInfo(k); return i ? adBreed(i) : k; }; // shown to the player (the translated long form)
const brBreedEn = (k) => (dogInfo(k) || {}).breed || k; // the English long form: saved mix names are always English
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
  const r = { id: d.id, name: d.name, key: d.key, mix: d.mix || null, sex: d.sex, coat: coatNameOf(d) || d.coat || '', eyes: eyesOf(d) || d.eyes || 'brown', sparkle: !!d.sparkle, born: d.born || null, parents: brPar(d.parents), gen: d.gen || 0, status: status || 'home' };
  if (d.anc) r.anc = d.anc; // v2.1: never overwrite a stored anc with undefined
  return Object.assign(r, extra || {});
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
  brAncBackfill();
}
on('game:ready', () => { brBackfill(); brStoneLetter(); setTimeout(breedTick, 1200); });

/* ---- v2.1 ancestry: { breedKey: fraction } (PawGenes.ancestry when present, else the same rules here) ---- */
const BR_KEYS = ['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle', 'poodle', 'collie', 'samoyed', 'frenchie', 'akita', 'spitz', 'pom', 'afghan', 'dane', 'mastiff', 'gsd',
  'dobie', 'corso', 'pitbull', 'minpin', 'lab', 'malamute', 'chow', 'stdpoodle', 'schnauzer', 'westie', 'yorkie', 'bichon', 'maltese', 'shihtzu']; // v2.12: the same order as PawGenes.BREEDS
const brKeyOf = (k) => (BR_KEYS.includes(k) ? k : 'mutt');
function brAncRound(a) { const o = {}; let t = 0; Object.keys(a).forEach((k) => { t += a[k]; }); Object.keys(a).forEach((k) => { const v = Math.round((a[k] / (t || 1)) * 64) / 64; if (v > 0) o[k] = v; }); return o; }
function brAncLocal(rec, depth, memo) {
  if (!rec) return { mutt: 1 }; if (rec.anc) return rec.anc;
  memo = memo || {}; if (rec.id && memo[rec.id]) return memo[rec.id];
  const p = brPar(rec.parents), A = p && depth > 0 ? brLookup(p.dam) : null, B = p && depth > 0 ? brLookup(p.sire) : null;
  let out;
  if (A && B) { const a = brAncLocal(A, depth - 1, memo), b = brAncLocal(B, depth - 1, memo), m = {}; Object.keys(a).forEach((k) => { m[k] = (m[k] || 0) + a[k] / 2; }); Object.keys(b).forEach((k) => { m[k] = (m[k] || 0) + b[k] / 2; }); out = brAncRound(m); }
  else if (rec.mix && rec.mix.a && rec.mix.b) { const a = brKeyOf(rec.mix.a), b = brKeyOf(rec.mix.b); out = a === b ? { [a]: 1 } : { [a]: 0.5, [b]: 0.5 }; }
  else out = { [brKeyOf(rec.key)]: 1 };
  if (rec.id) memo[rec.id] = out; return out;
}
// ancOf(recOrDog): the stored anc, else PawGenes.ancestry over the family register, else one breed
function ancOf(x) {
  if (!x) return { mutt: 1 }; if (x.anc) return x.anc;
  const G = brG(); if (G && typeof G.ancestry === 'function') { try { const a = G.ancestry(x, (id) => brLookup(id)); if (a && Object.keys(a).length) return a; } catch (e) { /* fall through */ } }
  try { return brAncLocal(x, 6); } catch (e) { return { [brKeyOf(x.key)]: 1 }; }
}
function brAncMix(a, b) { const m = {}; Object.keys(a).forEach((k) => { m[k] = (m[k] || 0) + a[k] / 2; }); Object.keys(b).forEach((k) => { m[k] = (m[k] || 0) + b[k] / 2; }); return brAncRound(m); }
function brGrand(anc) { const G = brG(); if (!G || typeof G.grandMix !== 'function') return null; try { return G.grandMix(anc) || null; } catch (e) { return null; } }
const BR_GRAND = ['grand', 'everything', 'family'];
function brAncBackfill() {
  if (!S || !S.dogs) return; let ch = false;
  S.dogs.forEach((d) => { if (!d.anc) { d.anc = ancOf(d); ch = true; } });
  Object.values(S.tree || {}).forEach((r) => { if (!r.anc) { const d = dogById(r.id); r.anc = d && d.anc ? d.anc : ancOf(r); ch = true; } });
  if (ch) markDirty();
}

/* ---- v2.1 Sparkle odds: Stone, Sparkle parents and Bond (PawGenes.sparkleOdds when present) ---- */
const brStone = (d) => !!(d && d.outfit && d.outfit.charm === 'Sparkle Stone');
const brBondOf = (d) => (d && !d.npc && d.bond && d.bond.level) || 0;
function brOddsText(p, parts) { const n = 1 / p, v = Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1); return parts.length ? tt('playdate.1_in_today', '1 in {odds} today: {parts}', { odds: v, parts: tlist(parts.map((x) => tt('playdate.odds_part', '{label} ×{x}', { label: x.label, x: x.x }))) }) : tt('playdate.1_in', '1 in {odds}', { odds: v }); }
// sparkleNow(dam, sire): today's Sparkle odds for this pair
function sparkleNow(dam, sire) {
  dam = brAsDog(dam); sire = brAsDog(sire);
  const o = { stone: brStone(dam) || brStone(sire), sparkleParents: (dam && dam.sparkle ? 1 : 0) + (sire && sire.sparkle ? 1 : 0), bondA: brBondOf(dam), bondB: brBondOf(sire), base: BREEDING.RULES.sparkleOdds || 1 / 512 };
  const G = brG(); if (G && typeof G.sparkleOdds === 'function') { try { const r = G.sparkleOdds(o); if (r && r.p > 0) return r; } catch (e) { /* fallback */ } }
  const parts = o.stone ? [{ label: tdata('clothes.sparkle_stone.n', 'Sparkle Stone'), x: 4 }] : [], p = o.base * (o.stone ? 4 : 1); // the v2 rule: Stone x4
  return { p, mult: o.stone ? 4 : 1, parts, text: brOddsText(p, parts) };
}
const brMeter = () => Math.min(BREEDING.RULES.sparklePity, (S && S.pupsSinceSparkle) || 0);
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
  o = o || {}; const R = BREEDING.RULES, out = [], npc = !!d.npc || !dogById(d.id), m = d.born ? ageMonths(d) : npc ? +(d.months || d.ageMonths || 24) : 10;
  const add = (code, txt) => out.push({ code, txt }), G = giantRules(d), AM = G ? G.adultMonths : R.adultMonths, ML = G ? G.maxLitters : R.female.maxLitters;
  const sex = homeSx(d), name = d.name;
  if (d.fixed) add('fixed', tt('playdate.is_spayed_or_neutered', "{sex, select, female {{name} is spayed. That was a loving choice, and it's for keeps.} other {{name} is neutered. That was a loving choice, and it's for keeps.}}", { sex, name }));
  if (m < AM) add('young', tt('playdate.is_only_old_puppies_can', "{name} is only {age} old. Puppies can't have puppies: wait until {months, plural, one {# month} other {# months}}.", { name, age: ageText(m), months: AM }));
  if (d.sex === 'male' && m >= R.noBreedFromMonths) add('old', tt('playdate.has_retired_from_romance', '{name} has retired from romance. He has earned his naps.', { name }));
  if (d.sex === 'female' && m >= R.female.noLittersFromMonths) add('old', tt('playdate.is_past_litter_age', '{name} is past litter age. She is retired to full-time napping, with honours.', { name }));
  if (!npc && ((d.bond && d.bond.level) || 1) < R.welfare.minBond) add('bond', tt('playdate.needs_bond_first_now', '{name} needs Bond {bond} first (now {now}). A well-loved dog makes a calm parent.', { name, bond: R.welfare.minBond, now: (d.bond && d.bond.level) || 1 }));
  if (!npc && !brMetersOK(d)) add('meters', tt('playdate.needs_every_care_meter_at', '{name} needs every care meter at {min}+ first. Hungry, tired dogs are not in the mood.', { name, min: R.welfare.minMeters }));
  if (d.sex === 'female') {
    if (d.preg) add('preg', tt('playdate.is_already_expecting', '{name} is already expecting. She is busy growing puppies.', { name }));
    else if (!npc && brIsNursing(d)) add('nursing', tt('playdate.is_busy_feeding_her_puppies', '{name} is busy feeding her puppies. Mum duty first.', { name }));
    if ((d.litters || 0) >= ML) add('litters', tt('playdate.has_had_litters', '{name} has had {n, plural, one {# litter} other {# litters}}. She is retired from mum duty, with a medal.', { name, n: ML }));
    const rest = G ? G.restDays : R.heat.everyDays;
    if (d.lastLitter && brDaysUntil(brAddDays(d.lastLitter, rest)) > 0) { const n = brDaysUntil(brAddDays(d.lastLitter, rest)); add('recover', tt('playdate.is_resting_after_her_last_litter', '{giant, select, yes {{name} is resting two seasons after her last litter ({n, plural, one {# more day} other {# more days}}).} other {{name} is resting one season after her last litter ({n, plural, one {# more day} other {# more days}}).}}', { giant: G ? 'yes' : 'no', name, n })); }
    if (!o.force && !d.fixed && m >= AM && !(npc ? d.inSeason !== false : seasonStatus(d).inSeason)) add('season', tt('playdate.isn_t_in_season', "{name} isn't in season. {status}.", { name, status: seasonStatus(d).txt }));
  } else if (d.restUntil && brDaysUntil(d.restUntil) > 0) { const n = brDaysUntil(d.restUntil); add('rest', tt('playdate.is_resting_after_his_last_playdate', '{name} is resting after his last playdate ({n, plural, one {# more day} other {# more days}}).', { name, n })); }
  if (!npc && d.lastPlaydate === brToday() && !o.force) add('today', tt('playdate.already_had_a_playdate_today', '{name} already had a playdate today. Tomorrow!', { name }));
  return out;
}
const brAsDog = (x) => (typeof x === 'string' ? dogById(x) || (brNpc && brNpc.id === x ? brNpc : null) : x);
// canPair(a, b) -> { ok, why, code, dam, sire, friends }
function canPair(a, b, o) {
  a = brAsDog(a); b = brAsDog(b); o = o || {};
  if (!a || !b) return { ok: false, code: 'none', why: tt('playdate.pick_two_dogs_first', 'Pick two dogs first.') };
  if (a.id === b.id) return { ok: false, code: 'same', why: tt('playdate.that_s_twice_even_knows', "That's {name} twice. Even {name2} knows that.", { name: a.name, name2: a.name }) };
  if (!a.sex || !b.sex || a.sex === b.sex) return { ok: false, code: 'sex', friends: true, why: tt('playdate.best_friends_puppies_need_a', 'Best friends! Puppies need a boy and a girl.') };
  const dam = a.sex === 'female' ? a : b, sire = dam === a ? b : a;
  for (const d of [dam, sire]) { const is = brIssues(d, o); if (is.length) return { ok: false, code: is[0].code, why: is[0].txt, dam, sire, friends: true }; }
  if (brRelated(dam, sire)) return { ok: false, code: 'related', why: tt('playdate.and_are_family_relatives_never', '{name} and {name2} are family. Relatives never have puppies together.', { name: dam.name, name2: sire.name }), dam, sire, friends: true };
  if (BREEDING.RULES.welfare.noMerleXMerle && brMerleX(dam, sire)) return { ok: false, code: 'merle', why: tt('playdate.both_carry_merle_two_merles', `Both carry merle. Two merles can have puppies with eye and ear trouble, so these two stay friends.`), dam, sire, friends: true };
  return { ok: true, code: 'ok', why: tt('playdate.and_are_a_lovely_match', '{name} and {name2} are a lovely match.', { name: dam.name, name2: sire.name }), dam, sire };
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
  if (G && typeof G.mixOf === 'function') { try { const m = G.mixOf(dam.key, sire.key, r); if (m && m.body) return { key: m.body, mix: { a: m.a || dam.key, b: m.b || sire.key, body: m.body, head: m.head || m.body, name: m.name || `${brBreedEn(dam.key)} × ${brBreedEn(sire.key)} mix` } }; } catch (e) { /* fallback */ } }
  const body = r() < 0.5 ? dam.key : sire.key, head = body === dam.key ? sire.key : dam.key;
  return { key: body, mix: { a: dam.key, b: sire.key, body, head, name: `${brBreedEn(dam.key)} × ${brBreedEn(sire.key)} mix` } };
}
// a grand-mix pup: body and head art from mixOf on the parents' body keys, the name from grandMix
function brGrandPup(pup, dam, sire, gm) {
  const G = brG(), r = seeded(hashId('grand|' + pup.id)); let m = null;
  if (G && typeof G.mixOf === 'function') { try { m = G.mixOf(dam.key, sire.key, r); } catch (e) { m = null; } }
  const top = (gm.breeds || []).map((x) => x[0]);
  const body = m && m.body ? m.body : dam.key, head = m && m.head ? m.head : top.find((k) => k !== body) || body;
  pup.key = body; pup.mix = { a: dam.key, b: sire.key, body, head, name: gm.name, grand: gm.name };
}
/* v2.5 (BREEDS): a named mix stays a named mix. Horgi x Horgi = Horgi, and a 3/4 Corgi is a Corgi, not a "Mutt mix".
   Body and head come from mixOf on the two biggest breeds (own rng, so the litter's other rolls do not change). */
function bdSameMix(dam, sire) {
  const a = dam.mix, b = sire.mix;
  return !!(a && b && a.name && a.name === b.name && a.name !== 'Mutt mix' && !a.grand && !b.grand);
}
function bdKeepMix(pup, dam, sire, gm, name) {
  const G = brG(), r = seeded(hashId('keep|' + pup.id));
  const top = gm && gm.breeds && gm.breeds.length ? gm.breeds.map((x) => brKeyOf(x[0])) : [];
  let x = top[0] || brKeyOf(dam.key), y = top[1] || x;
  // 3/4 or more of one breed: that breed's body and head, whatever the parents' mix names say
  if (gm && gm.kind === 'breed') { pup.key = x; pup.mix = { a: x, b: y, body: x, head: x, name: gm.name || name }; return; }
  if (bdSameMix(dam, sire) && dam.mix.a && dam.mix.b && dam.mix.a !== dam.mix.b) { x = brKeyOf(dam.mix.a); y = brKeyOf(dam.mix.b); }
  let m = null; if (G && typeof G.mixOf === 'function' && x !== y) { try { m = G.mixOf(x, y, r); } catch (e) { m = null; } }
  const body = m && m.body ? m.body : x, head = m && m.head ? m.head : (body === x ? y : x);
  pup.key = body; pup.mix = { a: x, b: y, body, head, name };
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
  const odds = sparkleNow(dam, sire).p, anc = brAncMix(ancOf(dam), ancOf(sire)), gm = brGrand(anc);
  let pity = o.npc ? -1e9 : (S.pupsSinceSparkle || 0) + brPendingPups();
  const pups = [];
  for (let i = 0; i < n; i++) {
    const sex = r() < BREEDING.RULES.puppySex ? 'female' : 'male', genes = brGenes(dam, sire, r), bm = brMix(dam, sire, r);
    const sparkle = r() < odds || pity >= BREEDING.RULES.sparklePity - 1 || (o.sparkle && i === 0); pity = sparkle ? 0 : pity + 1;
    const id = 'p_' + hashId(dam.id + '|' + sire.id + '|' + brToday() + '|' + i).toString(36) + i;
    const pup = { id, name: '', key: bm.key, sex, genes, mix: bm.mix, sparkle: !!sparkle, born: null, parents: { dam: dam.id, sire: sire.id }, gen: Math.max(dam.gen || 0, sire.gen || 0) + 1, anc };
    if (bdSameMix(dam, sire)) bdKeepMix(pup, dam, sire, gm, dam.mix.name);
    else if (gm && BR_GRAND.includes(gm.kind) && gm.name) brGrandPup(pup, dam, sire, gm);
    else if (gm && (gm.kind === 'mix' || gm.kind === 'breed') && gm.name && (dam.mix || sire.mix)) bdKeepMix(pup, dam, sire, gm, gm.name);
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
  if (!hit) { markDirty(); saveNow(); return { ok: true, pups: 0, why: tt('playdate.no_puppies_this_time_and', 'No puppies this time. {name} and {name2} had a lovely day anyway.', { name: dam.name, name2: sire.name }) }; }
  if (!sire.npc) sire.restUntil = brAddDays(today, R.maleRestDays);
  if (dam.npc) {
    // your boy x an NPC girl: her family keeps the litter; a letter arrives after 4 days
    const pups = rollLitter(dam, sire, { npc: true, sparkle: o.sparkle, size: o.size });
    const nl = { id: 'nl_' + hashId(dam.id + sire.id + today).toString(36), npc: dam.id, npcName: dam.name, owner: dam.owner || dam.family || 'her family', sire: sire.id, due: brAddDays(today, R.pregnancyDays), ready: brAddDays(today, R.pregnancyDays + R.puppyStayDays), pups, offered: false };
    S.npcLitters.push(nl); markDirty(); saveNow(); SFX.fanfare && SFX.fanfare();
    return { ok: true, pups: pups.length, npcLitter: nl.id, why: tt('playdate.puppies_on_the_way_for', 'Puppies on the way for {name}! {owner} will send news when they arrive.', { name: dam.name, owner: homeFam(nl.owner).replace(/^the /, 'The ') }) };
  }
  const pups = rollLitter(dam, sire, { sparkle: o.sparkle, size: o.size });
  dam.preg = { sire: sire.id, sireKey: sire.key, sireName: sire.name, since: today, due: brAddDays(today, R.pregnancyDays), pups, scanned: false };
  if (sire.npc) brPutNpc(sire); treePut(brRec(dam, 'home')); if (!sire.npc) treePut(brRec(sire, 'home'));
  markDirty(); saveNow();
  return { ok: true, pups: pups.length, why: tt('playdate.puppies_on_the_way_is_expecting', 'Puppies on the way! {name} is expecting. Due in {n, plural, one {# day} other {# days}}.', { name: dam.name, n: R.pregnancyDays }) };
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
  const sub = `${esc(d.mix && d.mix.name ? mixShown(d.mix) : brBreed(d.key))} · ${ageText(m)}${npc ? ` · ${esc(homeFam(d.owner || d.family) || tt('playdate.a_neighbour', 'a neighbour'))}` : ''}`;
  return `<button class="pd-dog ${picked ? 'on' : ''} ${is.length ? 'notready' : 'ready'}" data-pd="${slot}|${d.id}" ${npc ? 'disabled' : ''} aria-pressed="${picked}">
    <span class="pd-head">${headSVG(d)}</span><span class="pd-txt"><b>${esc(d.name)} ${sexSym(d.sex)}</b><span class="small">${sub}</span>
    <span class="pd-st small">${is.length ? '✗ ' + esc(is[0].txt) : tt('playdate.ready_for_a_playdate', '✓ Ready for a playdate')}</span></span></button>`;
}
function brPredict(dam, sire) {
  const tested = (d) => !!d.geneTested || (!!d.npc && typeof npcTested === 'function' && !!npcTested(d)); // v2.1: a sniffed NPC counts
  const G = brG(); if (!G || typeof G.predict !== 'function' || !dam.genes || !sire.genes || !tested(dam) || !tested(sire)) return '';
  let rows = []; try { rows = G.predict(dam.genes, sire.genes, dam.key, sire.key) || []; } catch (e) { return ''; }
  if (!rows.length) return '';
  return `<div class="pd-predict"><b>${tt('playdate.puppy_predictor', 'Puppy Predictor')}</b> <span class="small">${tt('playdate.from_the_gene_tests', '(from the gene tests)')}</span><ul>${rows.slice(0, 6).map((x) => `<li><span class="pd-bar" style="width:${Math.max(4, Math.round(x.pct))}%"></span>${esc(x.eyes ? tt('playdate.coat_and_eyes', '{coat}, {eyes} eyes', { coat: x.coat, eyes: x.eyes }) : x.coat)} <b>${Math.round(x.pct * 10) / 10}%</b></li>`).join('')}</ul></div>`;
}
function openPlaydates(opts) {
  opts = opts || {}; brFields();
  if (opts.npc) { brNpc = Object.assign({ npc: true, stats: null, bond: null, fixed: false, litters: 0 }, opts.npc); brNpc.npc = true; if (!brNpc.id) brNpc.id = 'npc_' + hashId((brNpc.name || '') + (brNpc.key || '') + brToday()).toString(36); } else if (!opts.keep) brNpc = null;
  const mine = S.dogs.filter((d) => !brNpc || d.sex !== brNpc.sex);
  if (!brNpc && S.dogs.length < 2) { openModal(tt('playdate.puppy_playdates', 'Puppy Playdates'), `<div class="pd-empty"><span class="pd-ic">${iconOr('playdate', '<path d="M-8 -2a6 6 0 0 1 8 -6a6 6 0 0 1 8 6c0 8 -8 12 -8 12s-8 -4 -8 -12z" fill="#F28FA5" stroke="#5B3D32" stroke-width="2"/>')}</span><p>${tt('playdate.playdates_need_two_dogs_bring', 'Playdates need two dogs. Bring home another friend, or visit the playdate board at the Dog Park.')}</p></div>`, { cls: 'playdates' }); return; }
  if (brNpc && !mine.length) { openModal(tt('playdate.puppy_playdates', 'Puppy Playdates'), `<p>${esc(tt('playdate.would_love_a_friend_but_none', '{sex, select, female {{name} would love a friend, but none of your dogs is a boy. Puppies need a boy and a girl.} other {{name} would love a friend, but none of your dogs is a girl. Puppies need a boy and a girl.}}', { sex: brNpc.sex, name: brNpc.name }))}</p>`, { cls: 'playdates' }); return; }
  const valid = (id) => mine.some((d) => d.id === id);
  if (opts.with && valid(opts.with)) { brSel.a = opts.with; if (!brNpc) brSel.b = null; } // v2.1: preselect (Family tab "Find a partner")
  if (brNpc) { brSel.b = brNpc.id; if (!valid(brSel.a)) brSel.a = (mine.find((d) => !brIssues(d).length) || mine[0]).id; }
  else {
    if (!valid(brSel.a)) brSel.a = (mine.find((d) => d.sex === 'female' && !brIssues(d).length) || mine.find((d) => d.sex === 'female') || mine[0]).id;
    if (!valid(brSel.b) || brSel.b === brSel.a) { const a = dogById(brSel.a); brSel.b = (mine.find((d) => d.id !== a.id && d.sex !== a.sex && !brIssues(d).length) || mine.find((d) => d.id !== a.id && d.sex !== a.sex) || mine.find((d) => d.id !== a.id)).id; }
  }
  const A = dogById(brSel.a), B = brNpc || dogById(brSel.b), chk = canPair(A, B);
  const col = (slot, list, sel) => `<div class="pd-col"><h3>${slot === 'a' ? (brNpc ? tt('playdate.your_dog', 'Your dog') : tt('playdate.first_friend', 'First friend')) : brNpc ? tt('playdate.visiting_friend', 'Visiting friend') : tt('playdate.second_friend', 'Second friend')}</h3>${list.map((d) => brDogCard(d, d.id === sel, slot)).join('')}</div>`;
  const pre = chk.ok ? brPredict(chk.dam, chk.sire) : '';
  const spk = chk.dam && chk.sire ? sparkleNow(chk.dam, chk.sire) : null;
  const spark = spk ? `<div class="pd-sparkle" id="pdSparkle"><span class="pd-mic">${iconOr('meter', '<path d="M-9 -12h18v4h-2v18a4 4 0 0 1 -4 4h-6a4 4 0 0 1 -4 -4v-18h-2z" fill="#FFF6D6" stroke="#5B3D32" stroke-width="2"/><path d="M-2 0l2 -5l2 5l5 2l-5 2l-2 5l-2 -5l-5 -2z" fill="#FFD75A"/>')}</span><span>${tt('playdate.sparkle_odds_html', '<b>Sparkle:</b> <span id="pdOdds">{odds}</span>. <span class="small">Cosmetic only.</span>', { odds: spk.text })}</span><span class="pd-meter" id="pdMeter">${esc(tt('playdate.sparkle_meter', 'Sparkle Meter: {n} / {max}', { n: brMeter(), max: BREEDING.RULES.sparklePity }))}</span></div>` : '';
  const verdict = `<div class="pd-verdict ${chk.ok ? 'ok' : 'no'}"><b>${chk.ok ? '✓' : chk.friends ? '♥' : '✗'}</b> ${esc(chk.why)}${chk.ok ? ' <span class="small">' + tt('playdate.85_chance_of_puppies', '(85% chance of puppies)') + '</span>' : ''}</div>`;
  const rules = `<details class="pd-rules"><summary>${tt('playdate.playdate_rules_real_dog_logic', 'Playdate rules (real dog logic)')}</summary><ul class="small"><li>${tt('playdate.a_boy_and_a_girl', 'A boy and a girl, both adults (12 months+), not spayed or neutered.')}</li><li>${esc(tt('playdate.both_at_bond_with_every_care', 'Both at Bond {bond}+ with every care meter at 50+.', { bond: BREEDING.RULES.welfare.minBond }))}</li><li>${tt('playdate.she_must_be_in_season', 'She must be in season, under 6 years, with fewer than 4 litters, and rest one season after a litter.')}</li><li>${tt('playdate.he_rests_2_days_after', 'He rests 2 days after puppies are on the way. No relatives, and never merle with merle.')}</li><li>${tt('playdate.giant_breeds_great_dane_english', 'Giant breeds (Great Dane, English Mastiff) take their time: 18 months or more, at most 3 litters, and two seasons of rest after a litter.')}</li></ul></details>`;
  const p = openModal(tt('playdate.puppy_playdates', 'Puppy Playdates'), `<div class="pd-pick">${col('a', mine, brSel.a)}${col('b', brNpc ? [brNpc] : mine.filter((d) => d.id !== brSel.a), brSel.b)}</div>${verdict}${spark}${pre}${rules}<div class="pd-scene" id="pdScene" hidden></div>`,
    { cls: 'playdates', foot: `<button class="btn no" id="pdNo">${tt('playdate.not_today', 'Not today')}</button>${chk.ok ? '<button class="btn yes big" id="pdGo">' + tt('playdate.playdate', 'Playdate!') + '</button>' : chk.friends && !brNpc ? '<button class="btn go big" id="pdFun">' + tt('playdate.just_play', 'Just play') + '</button>' : ''}` });
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
      res = { ok: true, pups: 0, fun: true, why: tt('playdate.zoomed_wrestled_and_flopped', '{bonus, select, yes {{name} and {name2} zoomed, wrestled and flopped. Best friends! +5 Happiness each.} other {{name} and {name2} zoomed, wrestled and flopped. Best friends!}}', { bonus: first ? 'yes' : 'no', name: A.name, name2: B.name }) };
      markDirty(); updateHUD();
    } else res = doPlaydate(A, B);
    brResult(res);
  }, fast ? 200 : 3000);
}
function brResult(res) {
  const ok = res.ok && res.pups > 0;
  const p = openModal(ok ? '<span class="hl">' + tt('playdate.puppies_on_the_way', 'Puppies on the way!') + '</span>' : res.fun ? tt('playdate.best_friends', 'Best friends!') : tt('playdate.a_lovely_day', 'A lovely day'), `<div class="pd-result ${ok ? 'yay' : ''}" id="pdResult" data-pups="${res.pups || 0}"><p>${esc(res.why)}</p>${ok && !res.npcLitter ? '<p class="small">' + tt('playdate.expecting_mums_eat_a_bit', 'Expecting mums eat a bit more, skip long walks and love a vet check-up. Puppies arrive in 2 days.') + '</p>' : ''}${!ok && !res.fun && res.ok ? '<p class="small">' + tt('playdate.they_may_try_again_tomorrow', 'They may try again tomorrow while she is still in season.') + '</p>' : ''}${!res.ok ? '<p class="small">' + tt('playdate.nothing_happened_no_hard_feelings', 'Nothing happened. No hard feelings, just naps.') + '</p>' : ''}</div>`, { cls: 'playdates celebrate', foot: '<button class="btn yes big" id="pdOk">' + tt('playdate.aww', 'Aww') + '</button>' });
  $('#pdOk', p).onclick = () => { SFX.click(); closeModal(); };
  if (ok) { SFX.fanfare && SFX.fanfare(); audioCue('levelup'); }
  updateHUD();
}

/* ---- NPC letters + pick of the litter ---- */
function brNpcTick() {
  if (!S || !S.npcLitters) return; const today = brToday();
  S.npcLitters.forEach((nl) => {
    if (nl.offered || today < nl.ready) return;
    nl.offered = true; const sire = dogById(nl.sire) || brLookup(nl.sire) || { name: tt('playdate.your_dog', 'Your dog') }, born = nl.due;
    nl.pups.forEach((pp, i) => { if (!pp.born) pp.born = born; if (!pp.name) pp.name = brPupName(seeded(hashId(nl.id + i)), nl.pups, i); treePut(Object.assign({}, brRecSpec(pp), { status: 'npc', owner: nl.owner })); coatLog(pp); });
    const free = brFree(), Owner = homeFam(nl.owner).replace(/^the /, 'The ');
    const msg = { kind: 'litter', from: nl.owner, title: tt('playdate.s_puppies_are_here', "{name}'s puppies are here!", { name: sire.name }), text: tt('playdate.healthy_pups_family_says_thank_you', "{free, select, yes {{n, plural, one {# healthy pup} other {# healthy pups}}. {npcName}'s family says thank you! As a thank-you, you may adopt one pup: pick of the litter, free.} other {{n, plural, one {# healthy pup} other {# healthy pups}}. {npcName}'s family says thank you! (No free dog spot right now, so the pups stay with them. They send kisses.)}}", { free: free > 0 ? 'yes' : 'no', n: nl.pups.length, npcName: nl.npcName }), dog: nl.pups[0], litter: nl.id, pick: free > 0 };
    let sent = null; if (typeof mailPush === 'function') { try { sent = mailPush(msg); } catch (e) { sent = null; } }
    if (sent && sent.id) nl.mailId = sent.id;
    else if (typeof mailPush === 'function') { const last = (S.mail || []).slice(-1)[0]; if (last && last.litter === nl.id) nl.mailId = last.id; }
    if (typeof mailPush !== 'function') { nl.letterPending = true; toast(tt('playdate.s_family_says_thank_you', "{owner}: {title} {npcName}'s family says thank you.", { owner: Owner, title: msg.title, npcName: nl.npcName }), 'gold'); }
    markDirty();
  });
}
function brLetterPopup() { // fallback when the mailbox lane is missing: show the letter as a popup in the yard
  const nl = (S.npcLitters || []).find((x) => x.letterPending); if (!nl) return false;
  nl.letterPending = false; const sire = dogById(nl.sire) || { name: tt('playdate.your_dog', 'Your dog') }, free = brFree();
  const p = openModal(tt('playdate.s_puppies_are_here', "{name}'s puppies are here!", { name: esc(sire.name) }), `<p>${tt('playdate.a_letter_from_html', 'A letter from {owner}: "{n, plural, one {# healthy pup} other {# healthy pups}}! {npcName}\'s family says thank you."', { owner: homeFam(nl.owner), n: nl.pups.length, npcName: nl.npcName })}</p><div class="lt-row">${nl.pups.map((pp) => `<span class="lt-mini">${dogSVG(pp, { pose: 'sleep' })}</span>`).join('')}</div>`, { cls: 'litter', foot: `<button class="btn no" id="ltNo">${tt('playdate.lovely', 'Lovely')}</button>${free > 0 && !nl.picked ? '<button class="btn yes big" id="ltPick">' + tt('playdate.adopt_a_pup', 'Adopt a pup') + '</button>' : ''}` });
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
  if (!nl) { nope(tt('playdate.that_litter_letter_is_a', 'That litter letter is a bit smudged. No puppies found.')); return false; }
  if (nl.picked) { nope(tt('playdate.you_already_adopted_from_this', 'You already adopted {pickedName} from this litter.', { pickedName: nl.pickedName || tt('playdate.a_pup', 'a pup') })); return false; }
  if (brFree() <= 0) { nope(tt('playdate.no_free_dog_spot_right_2', 'No free dog spot right now. New friends need a free spot.')); return false; }
  const take = (pp) => {
    const d = brKeepPup(pp, pp.name); nl.picked = pp.id; nl.pickedName = d.name; treePut(brRec(d, 'home')); markDirty(); saveNow();
    closeModal(); SFX.fanfare && SFX.fanfare(); toast(tt('playdate.is_home_brought_favourite_sock', "{sex, select, female {{name} is home! She brought her favourite sock from {owner}'s house.} other {{name} is home! He brought his favourite sock from {owner}'s house.}}", { sex: homeSx(d), name: d.name, owner: homeFam(nl.owner) }), 'gold');
    if (cur.mode === 'yard') go('yard'); brRampPopup(); return d;
  };
  if (pupId) { const pp = nl.pups.find((x) => x.id === pupId); return pp ? take(pp) : false; }
  const p = openModal(tt('playdate.pick_of_the_litter', 'Pick of the litter'), `<p>${esc(tt('playdate.s_family_lets_you_choose_one', "{npcName}'s family lets you choose one pup to bring home, free.", { npcName: nl.npcName }))}</p><div class="lt-pups">${nl.pups.map((pp) => `<button class="lt-card pick" data-pick="${pp.id}">${pp.sparkle ? '<span class="lt-spark">' + tt('playdate.sparkle', 'Sparkle!') + '</span>' : ''}<span class="lt-art">${dogSVG(Object.assign({}, pp, { born: brAddDays(brToday(), -2) }), { pose: 'sit' })}</span><b>${esc(pp.name)} ${sexSym(pp.sex)}</b><span class="small">${esc(pp.mix ? mixShown(pp.mix) : brBreed(pp.key))}<br>${esc(tt('playdate.coat_and_eyes', '{coat}, {eyes} eyes', { coat: pp.coat, eyes: pp.eyes }))}</span></button>`).join('')}</div>`, { cls: 'litter' });
  p.querySelectorAll('[data-pick]').forEach((b) => { b.onclick = () => take(nl.pups.find((x) => x.id === b.dataset.pick)); });
  return true;
}
