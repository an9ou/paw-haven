/* ======================= v2: 14b_vet_playboard.js (TOWN lane) =======================
   Vet v2 (gene test, spay/neuter, ultrasound), the Dog Park Playdate Board (NPC dogs seeded by date)
   and rehomed puppies visiting around town. Other lanes' helpers (openPlaydates, canPair, PawGenes.describe,
   PawArt props) are always typeof-guarded with a fallback. */

/* ---------- shared bits ---------- */
const TOWN_FAMILIES = ['the Tanakas by the bakery', 'Old Mr. Reyes at the pier', 'the Okafor twins', 'Mrs. Lindqvist from the flower shop', 'the Patels on Maple Lane', 'Grandpa Joe with the red bike', 'the Moreau family', 'Rosa from the café', 'the Nguyen kids', 'Coach Bell from the school', 'the Abernathys by the library', 'Dr. Kim (the dentist, not the vet)'];
const NPC_BOYS = ['Duke', 'Rufus', 'Bentley', 'Ziggy', 'Moose', 'Captain Waffles', 'Bruno', 'Tofu', 'Gus', 'Sir Pickle'];
const NPC_GIRLS = ['Daisy', 'Luna', 'Clementine', 'Penny', 'Maple', 'Bijou', 'Rosie', 'Miso', 'Hazel', 'Lady Fluffington'];
const NPC_LINES = ['Loves belly rubs and stealing socks.', 'Has strong opinions about squirrels.', 'Very polite. Sits for everything, even nothing.', 'Snores like a tiny tractor.', 'Will trade any toy for one cheese cube.', 'Fastest sniff in the park.', 'Brings a stick to every playdate. The same stick.', 'Shy for five minutes, then a total goofball.', 'Has never met a puddle he or she did not like.', 'Thinks the mailman is a long-lost friend.'];
const motionOff = () => document.documentElement.dataset.motion === 'off';
const isNursing = (d) => (Array.isArray(S.litters) ? S.litters : []).some((l) => l && l.mum === d.id);
const famName = (f) => (typeof f === 'string' ? f : f && (f.name || f.n || f.family)) || 'a kind family';
function genesOf(d) {
  if (d && d.genes) return d.genes;
  const g = (typeof STARTER_GENES !== 'undefined' && (STARTER_GENES[d && d.key] || STARTER_GENES.mutt)) || null;
  return g ? JSON.parse(JSON.stringify(g)) : null;
}

/* ---------- vet: gene test ---------- */
const GENE_FB = {
  B: { dom: 'B', rec: 'b', both: 'black pigment, nothing hidden', het: 'black pigment, carries liver', hom: 'liver (chocolate) pigment', carry: 'liver' },
  D: { dom: 'D', rec: 'd', both: 'full-strength colour', het: 'full colour, carries dilute', hom: 'dilute: blue, lilac or cream', carry: 'dilute' },
  E: { dom: 'E', rec: 'e', both: 'can show black or liver pigment', het: 'shows dark pigment, carries red', hom: 'red coat: red, gold or tan', carry: 'red' },
  S: { dom: 'S', rec: 'sp', both: 'no white spotting', het: 'small white markings, carries piebald', hom: 'piebald: big white patches', carry: 'piebald' },
  M: { dom: 'M', rec: 'm', both: 'double merle (never bred on purpose)', het: 'merle marbling', hom: 'no merle', carry: null },
  Bl: { dom: 'Bl', rec: 'bl', both: 'blue eyes', het: 'blue eyes, sometimes one of each', hom: 'brown eyes', carry: null }
};
// fallback when the genes module has no describe(): plain words built from d.genes
function geneDescribeFB(genes) {
  const lines = [], carriers = [];
  ['B', 'D', 'E', 'S', 'M', 'Bl'].forEach((k) => {
    const a = genes && Array.isArray(genes[k]) ? genes[k] : null, F = GENE_FB[k]; if (!a || a.length < 2) return;
    const n = a.filter((x) => x === F.dom).length, pair = `${n ? F.dom : F.rec}/${n === 2 ? F.dom : F.rec}`;
    let txt = n === 2 ? F.both : n === 1 ? F.het : F.hom;
    if (k === 'M' && n === 1 && genes.E && genes.E.every((x) => x === 'e')) { txt = 'hidden merle (the red coat covers it)'; carriers.push('merle'); }
    if (n === 1 && F.carry) carriers.push(F.carry);
    lines.push(`${pair}: ${txt}`);
  });
  return { lines, carriers };
}
function geneReport(d) {
  const genes = genesOf(d); let r = null;
  const G = window.PawGenes;
  if (G && typeof G.describe === 'function' && genes) { try { r = G.describe(genes); } catch (e) { r = null; } }
  if (!r || !Array.isArray(r.lines) || !r.lines.length) r = genes ? geneDescribeFB(genes) : { lines: ['The sample was mostly drool. Dr. Paws says: 100% dog.'], carriers: [] };
  const carriers = Array.isArray(r.carriers) ? r.carriers : [];
  const PUP = { liver: 'chocolate', dilute: 'blue', red: 'red or gold', piebald: 'piebald', merle: 'merle', cream: 'cream', lilac: 'lilac', 'blue eyes': 'blue-eyed' };
  const pups = [...new Set(carriers.map((c) => PUP[String(c).toLowerCase()] || String(c).toLowerCase()))];
  const list = (a, w = 'and') => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ` ${w} ` + a[a.length - 1]);
  const summary = carriers.length ? `${d.name} carries ${list(carriers.map(String))}. With the right partner, ${list(pups, 'or')} puppies are possible.` : `${d.name} carries no hidden coat surprises. What you see is what ${PRd(d).he} passes on.`;
  return { lines: r.lines.map(String), carriers, summary };
}
const DNA_SVG = `<svg class="dna-helix" viewBox="0 0 240 70" aria-hidden="true"><g class="dna-run">${Array.from({ length: 12 }, (_, i) => { const x = 10 + i * 20, y1 = 35 + 24 * Math.sin(i * 0.9), y2 = 70 - y1; return `<path d="M${x} ${y1.toFixed(1)} L${x} ${y2.toFixed(1)}" stroke="${['#F28FA5', '#8FC1E3', '#F2C14E', '#9CCB8A'][i % 4]}" stroke-width="5" stroke-linecap="round"/><circle cx="${x}" cy="${y1.toFixed(1)}" r="5" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.5"/><circle cx="${x}" cy="${y2.toFixed(1)}" r="5" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.5"/>`; }).join('')}</g></svg>`;
function vetGeneCard(d, anim) {
  const R = geneReport(d), id = d.id;
  const p = openModal(`Gene test: ${esc(d.name)}`, `<div class="dnacard ${anim && !motionOff() ? 'run' : 'done'}"><div class="dna-top"><span class="dna-head">${headSVG(d)}</span>${DNA_SVG}</div>
    <p class="dna-wait">Reading ${esc(d.name)}'s genes... (Dr. Paws is squinting very hard.)</p>
    <ul class="dna-lines">${R.lines.map((l, i) => `<li style="--i:${i}">${esc(l)}</li>`).join('')}</ul>
    <p class="dna-sum"><b>${esc(R.summary)}</b></p><p class="small dna-note">Coat genes only. The full results are in the Journal Profile now.</p></div>`, { cls: 'vetgene', foot: '<button class="btn" id="dnaBack">Back to the clinic</button><button class="btn yes" id="dnaOk">Neat!</button>' });
  $('#dnaBack', p).onclick = () => { SFX.click(); vetCheck(id); };
  $('#dnaOk', p).onclick = () => closeModal();
  if (anim && !motionOff()) setTimeout(() => { const c = $('.dnacard', p); if (c) { c.classList.remove('run'); c.classList.add('done'); SFX.chime ? SFX.chime() : SFX.boop(880); } }, 1500);
}
function vetGeneTest(d) {
  if (d.geneTested) { vetGeneCard(d, false); return; }
  if (S.coins < 60) { nope('Not enough coins for a gene test. Science is expensive. So are swabs.'); return; }
  S.coins -= 60; SFX.kaching(); d.geneTested = true; markDirty(); updateHUD();
  vetGeneCard(d, true);
  toast(`${d.name} tolerated a cheek swab. ${PRd(d).He} would like it noted that ${PRd(d).he} was very brave.`, 'good');
}

/* ---------- vet: spay / neuter ---------- */
function fixBlock(d) {
  if (d.fixed) return d.sex === 'female' ? 'Already spayed' : 'Already neutered';
  if (d.preg && d.preg.due) return 'Not while expecting';
  if (isNursing(d)) return 'Not while nursing';
  if (ageMonths(d) < 6) return 'Too young: 6 months+';
  return '';
}
async function vetFix(d, panel) {
  const blk = fixBlock(d); if (blk) { nope(`${blk}. Dr. Paws says there is no rush.`); return; }
  const P = PRd(d);
  const yes = await confirmIn(panel, `This is permanent. ${esc(d.name)} will never have puppies, and that's a loving choice too.`, d.sex === 'female' ? 'Spay her' : 'Neuter him', 'Not now');
  if (!yes) return;
  d.fixed = true; d.fixedOn = localISO(); markDirty(); SFX.boop(660);
  vetCheck(d.id);
  toast(`${d.name} is home from the vet in the Cone of Dignity (one day only). ${P.He} will remember this forever. ${P.He} has already forgotten.`, 'good');
}

/* ---------- vet: expecting check-up (ultrasound) ---------- */
function ultraScreen(raw) {
  // the prop marks its screen with data-screen; use its rect if it has one, else a safe middle area
  const m = /<rect[^>]*data-screen[^>]*>/.exec(raw || '') || /<[^>]*data-screen[^>]*>/.exec(raw || '');
  if (m) { const g = (a) => { const r = new RegExp(`\\s${a}="([\\d.]+)"`).exec(m[0]); return r ? +r[1] : null; }; const x = g('x'), y = g('y'), w = g('width'), h = g('height'); if ([x, y, w, h].every((v) => v != null)) return { x, y, w, h }; }
  return { x: 46, y: 30, w: 148, h: 92 };
}
function ultraSVG(n) {
  const raw = artReal('prop', 'ultrasound'), sc = raw ? ultraScreen(raw) : { x: 30, y: 22, w: 180, h: 104 };
  const base = raw ? place(raw, 0, 0, 240, 160) : `<rect x="14" y="10" width="212" height="128" rx="14" fill="#E9DCC8" stroke="#5B3D32" stroke-width="4"/><rect x="${sc.x}" y="${sc.y}" width="${sc.w}" height="${sc.h}" rx="10" fill="#2F3440" stroke="#5B3D32" stroke-width="3"/><path d="M96 138 L90 152 H150 L144 138" fill="#D9C7AB" stroke="#5B3D32" stroke-width="3"/><circle cx="200" cy="130" r="0" />`;
  const k = Math.max(1, n), cols = Math.min(k, k > 4 ? 3 : k), rows = Math.ceil(k / cols), cw = sc.w / cols, rh = sc.h / rows, s = Math.min(1, Math.min(cw / 54, rh / 40));
  const blobs = Array.from({ length: n }, (_, i) => { const cx = sc.x + cw * (i % cols + 0.5), cy = sc.y + rh * (Math.floor(i / cols) + 0.5); return `<g class="ublob" style="animation-delay:-${(i * 0.37).toFixed(2)}s" transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) scale(${s.toFixed(2)})"><path d="M-20 4 C-22 -12 -6 -18 6 -14 C18 -10 22 0 16 10 C10 18 -16 18 -20 4 Z" fill="#CFE6F2" fill-opacity=".85" stroke="#FFFFFF" stroke-width="2"/><circle cx="8" cy="-4" r="5" fill="#E7F3FA"/><circle cx="-2" cy="2" r="2.2" fill="#F28FA5" class="ubeat"/></g>`; }).join('');
  return `<svg class="ultra-svg" viewBox="0 0 240 160">${base}<g class="ublobs">${blobs}</g></svg>`;
}
// builds the scan card AND records the scan on the pregnancy (preg.scanned = true)
function vetScanHTML(d) {
  const n = d.preg && Array.isArray(d.preg.pups) ? d.preg.pups.length : 0;
  if (d.preg) { d.preg.scanned = true; markDirty(); }
  const due = d.preg && d.preg.due ? Math.max(0, Math.round((new Date(d.preg.due + 'T00:00:00') - new Date(localISO() + 'T00:00:00')) / 864e5)) : null;
  return `<div class="ultra"><div class="ultra-art">${ultraSVG(n)}</div><p class="ultra-txt"><b>${n ? `Expecting ${n} ${n === 1 ? 'puppy' : 'puppies'}!` : 'Expecting puppies!'}</b> ${due != null ? `Due in ${due} ${due === 1 ? 'day' : 'days'}.` : ''} Dr. Paws counts the tiny heartbeats twice, just to enjoy it.</p></div>`;
}
function vetScan(d) {
  if (!(d.preg && d.preg.due)) { nope('No puppies on the way. The screen shows mostly lunch.'); return; }
  SFX.boop(520);
  const p = openModal(`Ultrasound: ${esc(d.name)}`, `<div class="vetcard">${vetScanHTML(d)}</div>`, { foot: '<button class="btn" id="usBack">Back to the clinic</button><button class="btn yes" id="usOk">Aww!</button>' });
  $('#usBack', p).onclick = () => { SFX.click(); vetCheck(d.id); };
  $('#usOk', p).onclick = () => closeModal();
}

/* ---------- vet popup parts (used by vetCheck in 14_town_places.js) ---------- */
function vetV2Options(d) {
  const blk = fixBlock(d), word = d.sex === 'female' ? 'Spay' : 'Neuter', preg = !!(d.preg && d.preg.due);
  return `<div class="vet2-grid">
    <div class="vopt"><span class="vic">${iconOr('dna', '<path d="M-8 -14 C8 -6 -8 6 8 14 M8 -14 C-8 -6 8 6 -8 14" fill="none" stroke="#5B3D32" stroke-width="3"/>')}</span><b>Gene test</b><span class="small">${d.geneTested ? `Done. ${esc(d.name)}'s gene card is on file.` : `60 coins, once per dog. A cheek swab shows what ${esc(d.name)} carries in secret.`}</span><button class="btn ${d.geneTested ? '' : 'yes'}" id="vetGene">${d.geneTested ? 'See gene card' : 'Gene test (60)'}</button></div>
    <div class="vopt"><span class="vic">${iconOr('heart', '<path d="M0 12 C-16 0 -12 -14 0 -6 C12 -14 16 0 0 12 Z" fill="#F28FA5" stroke="#5B3D32" stroke-width="2.5"/>')}</span><b>${word}</b><span class="small">${d.fixed ? `${esc(d.name)} is ${d.sex === 'female' ? 'spayed' : 'neutered'}. No seasons, no puppies, all the cuddles.` : 'Free. Permanent. Dr. Paws will explain everything gently.'}</span><button class="btn" id="vetFix" ${blk ? 'aria-disabled="true"' : ''}>${blk || `${word} (free)`}</button></div>
    ${preg ? `<div class="vopt"><span class="vic">${iconOr('nursery', '<circle r="12" fill="#CFE6F2" stroke="#5B3D32" stroke-width="2.5"/>')}</span><b>Expecting check-up</b><span class="small">Free for mums-to-be: a peek at the puppies on the ultrasound.</span><button class="btn yes" id="vetScan">Ultrasound</button></div>` : ''}
  </div>`;
}
function vetV2Bind(p, d) {
  const g = $('#vetGene', p); if (g) g.onclick = () => { SFX.click(); vetGeneTest(d); };
  const f = $('#vetFix', p); if (f) f.onclick = () => { SFX.click(); vetFix(d, p); };
  const s = $('#vetScan', p); if (s) s.onclick = () => vetScan(d);
}

/* ---------- Dog Park Playdate Board ---------- */
function playboardDogs(dk = localISO()) {
  const r = seeded(hashId('playboard|' + dk)), G = PGN(), sexes = ['male', 'female', 'male', 'female'], used = new Set();
  return sexes.map((sex, i) => {
    const key = BREED_KEYS[Math.floor(r() * BREED_KEYS.length)], months = 14 + Math.floor(r() * 47);
    const pool = sex === 'male' ? NPC_BOYS : NPC_GIRLS; let name = pool[Math.floor(r() * pool.length)]; while (used.has(name)) name = pool[(pool.indexOf(name) + 1) % pool.length]; used.add(name);
    const owner = TOWN_FAMILIES[Math.floor(r() * TOWN_FAMILIES.length)]; let line = NPC_LINES[Math.floor(r() * NPC_LINES.length)]; while (used.has(line)) line = NPC_LINES[(NPC_LINES.indexOf(line) + 1) % NPC_LINES.length]; used.add(line);
    let genes = null; if (G && typeof G.randomGenotype === 'function') { try { genes = G.randomGenotype(key, r); } catch (e) { genes = null; } }
    if (!genes) genes = genesOf({ key });
    const id = `npc_${dk}_${i}`, c = coatInfo({ id, key, genes });
    const coat = c ? c.coatName : (STARTER_GENES[key] || {}).coat || '', eyes = c ? c.eyes : (STARTER_GENES[key] || {}).eyes || 'brown';
    return { npc: true, id, name, key, sex, born: bornDaysAgo(months), genes, owner, line: line.replace('he or she', sex === 'female' ? 'she' : 'he'), coat, eyes };
  });
}
function npcReady(npc) {
  const mine = S.dogs.filter((x) => x.sex && x.sex !== npc.sex);
  if (!mine.length) return `<li class="no">None of your dogs is a ${npc.sex === 'female' ? 'boy' : 'girl'}. Puppies need a boy and a girl. (Same-sex playdates are just fun play.)</li>`;
  if (typeof canPair !== 'function') return mine.map((x) => `<li class="maybe">${esc(x.name)}: the vet will check on the day.</li>`).join('');
  return mine.map((x) => { let r = null; try { r = canPair(x, npc); } catch (e) { r = null; } const ok = !!(r && r.ok); return `<li class="${ok ? 'yes' : 'no'}">${ok ? '&#10003;' : '&#10007;'} ${esc(x.name)}${ok ? ' is ready' : r && r.why ? ': ' + esc(r.why) : ': not today'}</li>`; }).join('');
}
function openPlayboard() {
  SFX.boop(640);
  const list = playboardDogs();
  const cards = list.map((n, i) => `<div class="pbcard" data-npc="${i}"><span class="pin" aria-hidden="true"></span><span class="pbdog">${dogSVG(n, { pose: i % 2 ? 'happy' : 'sit' })}</span>
    <b>${esc(n.name)} ${sexSym(n.sex)}</b><span class="desc">${esc(dogInfo(n.key).breed)} · ${n.sex === 'female' ? 'Girl' : 'Boy'} · ${esc(ageText(ageMonths(n)))}<br>${esc(n.coat)}${n.eyes ? `, ${esc(n.eyes)} eyes` : ''}<br><i>"${esc(n.line)}"</i><br><span class="small">Lives with ${esc(n.owner)}</span></span>
    <ul class="pbready">${npcReady(n)}</ul><button class="btn yes" data-pd="${i}">Ask for a playdate</button></div>`).join('');
  const p = openModal('Playdate Board', `<p class="small">New friends pinned up every day. Pick a partner, and Puppy Playdates does the rest. Nobody here is related to your dogs.</p><div class="pbgrid">${cards}</div>`, { cls: 'shop playboard' });
  p.querySelectorAll('[data-pd]').forEach((b) => { b.onclick = () => { SFX.click(); const npc = list[+b.dataset.pd]; if (typeof openPlaydates === 'function') openPlaydates({ npc }); else nope('Playdates open soon!'); }; });
  return p;
}
function playboardFB() {
  // doodle cork board (0 0 300 220) used while PawArt.prop('playboard') is missing
  const frames = [[34, 70], [96, 70], [158, 70], [220, 70]];
  return `<svg viewBox="0 0 300 220"><path d="M60 180 V214 M240 180 V214" stroke="#8A6248" stroke-width="10" stroke-linecap="round"/><rect x="12" y="20" width="276" height="166" rx="12" fill="#D9A877" stroke="#5B3D32" stroke-width="5"/><rect x="24" y="32" width="252" height="142" rx="6" fill="#E8C397" stroke="#B88A5E" stroke-width="2" stroke-dasharray="3 6"/>
    <rect x="80" y="4" width="140" height="36" rx="8" fill="#FFF3DA" stroke="#5B3D32" stroke-width="3" transform="rotate(-3 150 22)"/><text x="150" y="31" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="28" fill="#5B3D32" transform="rotate(-3 150 22)">Playdates!</text>
    ${frames.map(([x, y], i) => `<g transform="rotate(${[-4, 3, -2, 5][i]} ${x + 23} ${y + 30})"><rect x="${x}" y="${y}" width="46" height="62" rx="3" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.5"/><rect x="${x + 5}" y="${y + 5}" width="36" height="36" fill="${['#CFE6F2', '#FBE0E6', '#E3F1D8', '#FFF0C2'][i]}"/><path d="M${x + 8} ${y + 50} h30 M${x + 8} ${y + 56} h20" stroke="#B09A86" stroke-width="2"/><circle cx="${x + 23}" cy="${y}" r="5" fill="${['#F28FA5', '#8FC1E3', '#F2C14E', '#9CCB8A'][i]}" stroke="#5B3D32" stroke-width="2"/></g>`).join('')}
    <path d="M40 150 q10 -8 20 0 t20 0" fill="none" stroke="#5B3D32" stroke-width="2"/><text x="250" y="162" text-anchor="end" font-family="Caveat,cursive" font-size="18" fill="#5B3D32">pick a pal</text></svg>`;
}
const BOARD_AT = { x: 22, y: 262, w: 156, h: 114 }; // dog park: back-left, above the agility tent, clear of every pack spot and the bowl
function playboardSVG() {
  const real = artReal('prop', 'playboard'), B = BOARD_AT;
  const heads = (S && real ? [] : playboardDogs().map((n, i) => place(headSVG(n), 34 + i * 62 + 5, 70 + 5, 36, 36))).join('');
  const inner = real ? place(real, 0, 0, 300, 220) : place(playboardFB(), 0, 0, 300, 220) + heads;
  return `<g id="playboardG" class="hot" tabindex="0" role="button" aria-label="Playdate Board: meet today's dogs" transform="translate(${B.x} ${B.y}) scale(${(B.w / 300).toFixed(4)})"><rect width="300" height="220" fill="transparent"/>${inner}</g>`;
}

/* ---------- rehomed visitors (Dog Park, Town Square, Pier, Café) ---------- */
const VISIT_PLACES = ['dogpark', 'square', 'pier', 'cafe'];
// used only when every pack spot of the place is taken (3 other dogs): solved against the furniture, the active dog and the place buttons
const VISIT_EXTRA = { dogpark: [905, 432, 'left', 0.5], square: [572, 455, 'left', 0.46], pier: [578, 455, 'left', 0.46], cafe: [568, 455, 'left', 0.46] };
const V2T = { rollPlace: null, visitor: null, line: '' };
function visitorSpot() {
  const sp = typeof packSpots === 'function' ? packSpots() : [], used = Math.min(3, Math.max(0, S.dogs.length - 1));
  const free = sp.slice(used).concat([VISIT_EXTRA[S.place] || [905, 432, 'left', 0.5]]);
  return free[0];
}
function visitorDog(v) { return { id: v.id, key: v.key, genes: v.genes, born: v.born, mix: v.mix || null, sparkle: !!v.sparkle }; }
function visitorSVG(v) {
  const [fx, fy, face, sc] = visitorSpot(), w = 264 * sc, h = 220 * sc, x = fx - w / 2, y = fy - h * (205 / 220);
  return `<g id="visitorG" class="visitor hot" data-visitor="${esc(v.id)}" tabindex="0" role="button" aria-label="${esc(v.name)} is visiting with ${esc(famName(v.family))}"><rect x="${(x + 26).toFixed(1)}" y="${(y + 26).toFixed(1)}" width="${(w - 52).toFixed(1)}" height="${(h - 26).toFixed(1)}" fill="transparent"/>${place(dogSVG(visitorDog(v), { pose: 'happy', facing: face }), x, y, w, h)}<g class="vtag" pointer-events="none" transform="translate(${fx} ${fy + 4})"><rect x="-46" y="-2" width="92" height="22" rx="7" fill="#FFF3DA" stroke="#5B3D32" stroke-width="2"/><text y="15" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="17" fill="#5B3D32">${esc(v.name.length > 12 ? v.name.slice(0, 11) + '.' : v.name)}</text></g></g>`;
}
function rollVisitor() {
  const pool = (Array.isArray(S.rehomed) ? S.rehomed : []).filter((v) => v && v.id && v.key);
  if (!pool.length || Math.random() >= 0.3) return null;
  pool.sort((a, b) => String(a.lastVisit || '').localeCompare(String(b.lastVisit || '')));
  const oldest = pool.filter((v) => (v.lastVisit || '') === (pool[0].lastVisit || ''));
  return oldest[Math.floor(Math.random() * oldest.length)];
}
function drawVisitor(v, greet) {
  const svg = $('svg.world', view), host = $('#townV2', view); if (!svg || !host || !v) return;
  const old = $('#visitorG', view); if (old) old.remove();
  host.insertAdjacentHTML('beforeend', visitorSVG(v));
  const g = $('#visitorG', view); g.onclick = () => openVisitor(v.id); g.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openVisitor(v.id); } };
  V2T.line = `Look who it is! ${v.name} grew up!`;
  if (greet) setTimeout(() => { if (cur.mode === 'yard' && $('#visitorG', view) && modal.hidden) { const [fx, fy, , sc] = visitorSpot(); say(V2T.line, fx, fy - 200 * sc, 3200); SFX.bark(BARK[v.key] || 1); } }, 900);
}
function openVisitor(id) {
  const v = (S.rehomed || []).find((x) => x.id === id); if (!v) return;
  const today = localISO(), petted = v.petDay === today, m = v.born ? ageMonths(v) : 0;
  const breed = v.mix && v.mix.name ? `${v.mix.name}` : dogInfo(v.key).breed;
  SFX.boop(700);
  const p = openModal(`${esc(v.name)} is visiting!`, `<div class="visitcard"><span class="vzdog">${dogSVG(visitorDog(v), { pose: 'sit' })}</span><div><p><b>${esc(v.name)}</b> ${sexSym(v.sex)} · ${esc(breed)}</p><p><b>Age:</b> ${esc(ageText(m))}</p><p><b>Family:</b> lives with ${esc(famName(v.family))}.</p><p class="small">${esc(PICK([`${v.name} wiggles so hard ${v.sex === 'female' ? 'her' : 'his'} whole back half joins in.`, `${v.name} remembers you. ${v.sex === 'female' ? 'She' : 'He'} also remembers where you keep the treats.`, `The family says ${v.name} sleeps on their feet every night. Classic.`]))}</p></div></div>`,
    { foot: `<button class="btn yes big" id="vzPet" ${petted ? 'aria-disabled="true"' : ''}>${petted ? 'Petted today' : 'Pet'}</button>` });
  $('#vzPet', p).onclick = () => {
    if (v.petDay === localISO()) { nope(`${v.name} already got pets today. ${v.sex === 'female' ? 'She' : 'He'} is pretending otherwise.`); return; }
    v.petDay = localISO(); v.lastVisit = localISO(); addStat('happy', 5); markDirty(); SFX.boop(820); updateHUD();
    closeModal(); const [fx, fy, , sc] = visitorSpot(); fxText('\u2665', fx, fy - 150 * sc); setTimeout(() => fxText('\u2665', fx + 20, fy - 170 * sc), 200);
    toast(`${NAME()} and ${v.name} sniff hello like old friends. +5 Happiness.`, 'good');
  };
}

/* ---------- scene overlay: built on every yard:enter ---------- */
function townV2Enter() {
  if (cur.mode !== 'yard' || !S) return;
  const svg = $('svg.world', view); if (!svg) return;
  if (S.place !== V2T.rollPlace) { V2T.rollPlace = S.place; V2T.visitor = null; if (VISIT_PLACES.includes(S.place)) { const v = rollVisitor(); if (v) { V2T.visitor = v.id; v.lastVisit = localISO(); markDirty(); V2T.greet = true; } } }
  if (S.place !== 'dogpark' && !VISIT_PLACES.includes(S.place)) return;
  const pack = $('#pack', svg); if (!pack) return;
  pack.insertAdjacentHTML('beforebegin', `<g id="townV2">${S.place === 'dogpark' ? playboardSVG() : ''}</g>`);
  const b = $('#playboardG', svg); if (b) { b.onclick = () => openPlayboard(); b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlayboard(); } }; }
  if (S.place === 'dogpark') { const pb = $('#placeBtns'); if (pb && !pb.querySelector('[data-pb2]')) { const home = pb.querySelector('[data-pb="yard"]'); const html = '<button class="btn yes" data-pb2="playboard">Playdate board</button>'; if (home) home.insertAdjacentHTML('beforebegin', html); else pb.insertAdjacentHTML('beforeend', html); pb.querySelector('[data-pb2]').onclick = () => openPlayboard(); } }
  const v = V2T.visitor && (S.rehomed || []).find((x) => x.id === V2T.visitor);
  if (v) { drawVisitor(v, !!V2T.greet); V2T.greet = false; }
}
on('yard:enter', townV2Enter);

/* ---------- test hooks ---------- */
function townV2Hooks() {
  if (!window.__paw) return;
  window.__paw.town = {
    boardDogs: (dk) => playboardDogs(dk || localISO()), openBoard: openPlayboard, geneReport: (id) => geneReport(dogById(id) || D()),
    visit: (id) => { const v = (S.rehomed || []).find((x) => x.id === id) || (S.rehomed || [])[0]; if (!v) return null; V2T.rollPlace = S.place; V2T.visitor = v.id; v.lastVisit = localISO(); markDirty(); if (cur.mode === 'yard') drawVisitor(v, true); return v.id; },
    get visitor() { return V2T.visitor; }, get line() { return V2T.line; }, spot: () => visitorSpot(), reroll: () => { V2T.rollPlace = null; }
  };
}
on('game:ready', townV2Hooks); setTimeout(townV2Hooks, 0);
