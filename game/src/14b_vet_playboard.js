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
const isNursing = (d) => !!d && Array.isArray(S.litters) && S.litters.some((l) => l && l.mum === d.id); // shared by TOWN + PLAY
// v2.14 i18n: a stored family text ("the Tanakas by the bakery") is shown through TOWN_FAMILIES' translation when it is one of that list. The stored value stays English.
function townFamily(s) { const i = TOWN_FAMILIES.indexOf(s); return i >= 0 ? tdata('town_families.' + i, s) : s; }
const famName = (f) => { const s = typeof f === 'string' ? f : f && (f.name || f.n || f.family); return s ? townFamily(s) : tt('vet.a_kind_family', 'a kind family'); };
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
    let txt = n === 2 ? tdata('gene_fb.' + tid(k) + '.both', F.both) : n === 1 ? tdata('gene_fb.' + tid(k) + '.het', F.het) : tdata('gene_fb.' + tid(k) + '.hom', F.hom);
    if (k === 'M' && n === 1 && genes.E && genes.E.every((x) => x === 'e')) { txt = tt('vet.hidden_merle', 'hidden merle (the red coat covers it)'); carriers.push('merle'); }
    if (n === 1 && F.carry) carriers.push(F.carry);
    lines.push(`${pair}: ${txt}`);
  });
  return { lines, carriers };
}
function geneReport(d) {
  const genes = genesOf(d); let r = null;
  const G = window.PawGenes;
  if (G && typeof G.describe === 'function' && genes) { try { r = G.describe(genes); } catch (e) { r = null; } }
  if (!r || !Array.isArray(r.lines) || !r.lines.length) r = genes ? geneDescribeFB(genes) : { lines: [tt('vet.drool', 'The sample was mostly drool. Dr. Paws says: 100% dog.')], carriers: [] };
  const carriers = Array.isArray(r.carriers) ? r.carriers : [];
  // what a carrier is called (carrier words come from the genes module in English) and what puppies it can give; unknown words are shown as they are
  const CARRY = { liver: () => tt('vet.carry_liver', 'liver'), dilute: () => tt('vet.carry_dilute', 'dilute'), red: () => tt('vet.carry_red', 'red'), piebald: () => tt('vet.carry_piebald', 'piebald'), merle: () => tt('vet.carry_merle', 'merle'), cream: () => tt('vet.carry_cream', 'cream'), lilac: () => tt('vet.carry_lilac', 'lilac'), 'blue eyes': () => tt('vet.carry_blue_eyes', 'blue eyes') };
  const PUP = { liver: () => tt('vet.pup_liver', 'chocolate'), dilute: () => tt('vet.pup_dilute', 'blue'), red: () => tt('vet.pup_red', 'red or gold'), piebald: () => tt('vet.pup_piebald', 'piebald'), merle: () => tt('vet.pup_merle', 'merle'), cream: () => tt('vet.pup_cream', 'cream'), lilac: () => tt('vet.pup_lilac', 'lilac'), 'blue eyes': () => tt('vet.pup_blue_eyes', 'blue-eyed') };
  const word = (T, c) => { const f = T[String(c).toLowerCase()]; return f ? f() : String(c).toLowerCase(); };
  const pups = [...new Set(carriers.map((c) => word(PUP, c)))];
  const summary = carriers.length ? tt('vet.sum_carries', '{name} carries {list}. With the right partner, {list2} puppies are possible.', { name: d.name, list: tlist(carriers.map((c) => { const f = CARRY[String(c).toLowerCase()]; return f ? f() : String(c); })), list2: townOrList(pups) }) : tt('vet.sum_none', '{sex, select, female {{name} carries no hidden coat surprises. What you see is what she passes on.} other {{name} carries no hidden coat surprises. What you see is what he passes on.}}', { name: d.name, sex: d.sex });
  return { lines: r.lines.map(String), carriers, summary };
}
const DNA_SVG = `<svg class="dna-helix" viewBox="0 0 240 70" aria-hidden="true"><g class="dna-run">${Array.from({ length: 12 }, (_, i) => { const x = 10 + i * 20, y1 = 35 + 24 * Math.sin(i * 0.9), y2 = 70 - y1; return `<path d="M${x} ${y1.toFixed(1)} L${x} ${y2.toFixed(1)}" stroke="${['#F28FA5', '#8FC1E3', '#F2C14E', '#9CCB8A'][i % 4]}" stroke-width="5" stroke-linecap="round"/><circle cx="${x}" cy="${y1.toFixed(1)}" r="5" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.5"/><circle cx="${x}" cy="${y2.toFixed(1)}" r="5" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.5"/>`; }).join('')}</g></svg>`;
function vetGeneCard(d, anim) {
  const R = geneReport(d), id = d.id;
  const p = openModal(tt('vet.gene_title', 'Gene test: {name}', { name: esc(d.name) }), `<div class="dnacard ${anim && !motionOff() ? 'run' : 'done'}"><div class="dna-top"><span class="dna-head">${headSVG(d)}</span>${DNA_SVG}</div>
    <p class="dna-wait">${tt('vet.gene_reading', "Reading {name}'s genes... (Dr. Paws is squinting very hard.)", { name: esc(d.name) })}</p>
    <ul class="dna-lines">${R.lines.map((l, i) => `<li style="--i:${i}">${esc(l)}</li>`).join('')}</ul>
    <p class="dna-sum"><b>${esc(R.summary)}</b></p><p class="small dna-note">${tt('vet.gene_note', 'Coat genes only. The full results are in the Journal Profile now.')}</p></div>`, { cls: 'vetgene', foot: `<button class="btn" id="dnaBack">${tt('vet.back_clinic', 'Back to the clinic')}</button><button class="btn yes" id="dnaOk">${tt('vet.gene_ok', 'Neat!')}</button>` });
  $('#dnaBack', p).onclick = () => { SFX.click(); vetCheck(id); };
  $('#dnaOk', p).onclick = () => closeModal();
  if (anim && !motionOff()) setTimeout(() => { const c = $('.dnacard', p); if (c) { c.classList.remove('run'); c.classList.add('done'); SFX.chime ? SFX.chime() : SFX.boop(880); } }, 1500);
}
function vetGeneTest(d) {
  if (d.geneTested) { vetGeneCard(d, false); return; }
  if (S.coins < 60) { nope(tt('vet.gene_broke', 'Not enough coins for a gene test. Science is expensive. So are swabs.')); return; }
  S.coins -= 60; SFX.kaching(); d.geneTested = true; markDirty(); updateHUD();
  vetGeneCard(d, true);
  toast(tt('vet.gene_toast', '{sex, select, female {{name} tolerated a cheek swab. She would like it noted that she was very brave.} other {{name} tolerated a cheek swab. He would like it noted that he was very brave.}}', { name: d.name, sex: d.sex }), 'good');
}

/* ---------- vet: free sniff with the Gene Sniffer (v2.1) ---------- */
function twSnifferArt() {
  const raw = artReal('prop', 'sniffer');
  return raw ? place(raw, 0, 0, 200, 140) : `<g fill="none" stroke="#5B3D32" stroke-width="4" stroke-linecap="round"><rect x="50" y="40" width="80" height="60" rx="12" fill="#CFE6F2"/><path d="M130 58 L176 48 L176 92 L130 82 Z" fill="#F2C14E" stroke-linejoin="round"/><circle cx="82" cy="70" r="14" fill="#FFFBF3"/><path d="M82 70 L90 60"/><path d="M184 56 q8 6 0 12 M184 74 q8 6 0 12" class="sniffwave"/></g>`;
}
function twVetSniff(d) {
  if (d.geneTested) { vetGeneCard(d, false); return; }
  if (!S.sniffer) { nope(tt('vet.sniff_need', 'You need the Gene Sniffer from Kibble Corner first.')); return; }
  SFX.boop(700);
  const p = openModal(tt('vet.sniff_title', 'Sniffing: {name}', { name: esc(d.name) }), `<div class="sniffcard"><svg class="sniff-art" viewBox="0 0 200 140" aria-hidden="true">${twSnifferArt()}</svg><p>${tt('vet.sniff_hum', "{sex, select, female {The Gene Sniffer hums over {name}'s ears. She holds very still. Mostly.} other {The Gene Sniffer hums over {name}'s ears. He holds very still. Mostly.}}", { name: esc(d.name), sex: d.sex })}</p></div>`, { cls: 'vetgene' });
  d.geneTested = true; markDirty(); updateHUD();
  setTimeout(() => { if ($('.sniffcard', modal) && !modal.hidden) { vetGeneCard(d, true); toast(tt('vet.sniff_free', '{sex, select, female {{name} was sniffed for free. She thinks sniffing should be her job.} other {{name} was sniffed for free. He thinks sniffing should be his job.}}', { name: d.name, sex: d.sex }), 'good'); } }, motionOff() ? 300 : 2000);
  return p;
}

/* ---------- vet: spay / neuter ---------- */
function fixBlock(d) {
  if (d.fixed) return d.sex === 'female' ? tt('vet.fix_spayed', 'Already spayed') : tt('vet.fix_neutered', 'Already neutered');
  if (d.preg && d.preg.due) return tt('vet.fix_expecting', 'Not while expecting');
  if (isNursing(d)) return tt('vet.fix_nursing', 'Not while nursing');
  if (ageMonths(d) < 6) return tt('vet.fix_young', 'Too young: 6 months+');
  return '';
}
async function vetFix(d, panel) {
  const blk = fixBlock(d); if (blk) { nope(tt('vet.fix_blocked', '{reason}. Dr. Paws says there is no rush.', { reason: blk })); return; }
  const yes = await confirmIn(panel, tt('vet.fix_confirm', "This is permanent. {name} will never have puppies, and that's a loving choice too.", { name: esc(d.name) }), d.sex === 'female' ? tt('vet.fix_yes_f', 'Spay her') : tt('vet.fix_yes_m', 'Neuter him'), tt('vet.fix_no', 'Not now'));
  if (!yes) return;
  d.fixed = true; d.fixedOn = localISO(); markDirty(); SFX.boop(660);
  vetCheck(d.id);
  toast(tt('vet.fix_toast', '{sex, select, female {{name} is home from the vet in the Cone of Dignity (one day only). She will remember this forever. She has already forgotten.} other {{name} is home from the vet in the Cone of Dignity (one day only). He will remember this forever. He has already forgotten.}}', { name: d.name, sex: d.sex }), 'good');
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
  return `<div class="ultra"><div class="ultra-art">${ultraSVG(n)}</div><p class="ultra-txt"><b>${n ? tt('vet.scan_expecting', 'Expecting {n, plural, one {# puppy} other {# puppies}}!', { n }) : tt('vet.scan_expecting_none', 'Expecting puppies!')}</b> ${due != null ? tt('vet.scan_due', 'Due in {n, plural, one {# day} other {# days}}.', { n: due }) : ''} ${tt('vet.scan_hearts', 'Dr. Paws counts the tiny heartbeats twice, just to enjoy it.')}</p></div>`;
}
function vetScan(d) {
  if (!(d.preg && d.preg.due)) { nope(tt('vet.scan_none', 'No puppies on the way. The screen shows mostly lunch.')); return; }
  SFX.boop(520);
  const p = openModal(tt('vet.scan_title', 'Ultrasound: {name}', { name: esc(d.name) }), `<div class="vetcard">${vetScanHTML(d)}</div>`, { foot: `<button class="btn" id="usBack">${tt('vet.back_clinic', 'Back to the clinic')}</button><button class="btn yes" id="usOk">${tt('vet.scan_ok', 'Aww!')}</button>` });
  $('#usBack', p).onclick = () => { SFX.click(); vetCheck(d.id); };
  $('#usOk', p).onclick = () => closeModal();
}

/* ---------- vet popup parts (used by vetCheck in 14_town_places.js) ---------- */
function vetV2Options(d) {
  const blk = fixBlock(d), word = d.sex === 'female' ? tt('vet.spay', 'Spay') : tt('vet.neuter', 'Neuter'), preg = !!(d.preg && d.preg.due);
  return `<div class="vet2-grid">
    <div class="vopt"><span class="vic">${iconOr('dna', '<path d="M-8 -14 C8 -6 -8 6 8 14 M8 -14 C-8 -6 8 6 -8 14" fill="none" stroke="#5B3D32" stroke-width="3"/>')}</span><b>${tt('vet.gene_test', 'Gene test')}</b><span class="small">${d.geneTested ? esc(tt('vet.gene_done', "Done. {name}'s gene card is on file.", { name: d.name })) : esc(tt('vet.gene_cost', '60 coins, once per dog. A cheek swab shows what {name} carries in secret.', { name: d.name }))}</span><button class="btn ${d.geneTested ? '' : 'yes'}" id="vetGene">${d.geneTested ? tt('vet.gene_see', 'See gene card') : tt('vet.gene_go', 'Gene test (60)')}</button>${S.sniffer && !d.geneTested ? `<button class="btn yes" id="vetSniff">${tt('vet.sniff_use', 'Use your Gene Sniffer (free)')}</button>` : ''}</div>
    <div class="vopt"><span class="vic">${iconOr('heart', '<path d="M0 12 C-16 0 -12 -14 0 -6 C12 -14 16 0 0 12 Z" fill="#F28FA5" stroke="#5B3D32" stroke-width="2.5"/>')}</span><b>${word}</b><span class="small">${d.fixed ? esc(tt('vet.fixed_note', '{sex, select, female {{name} is spayed. No seasons, no puppies, all the cuddles.} other {{name} is neutered. No seasons, no puppies, all the cuddles.}}', { name: d.name, sex: d.sex })) : tt('vet.fix_info', 'Free. Permanent. Dr. Paws will explain everything gently.')}</span><button class="btn" id="vetFix" ${blk ? 'aria-disabled="true"' : ''}>${blk || tt('vet.fix_free', '{word} (free)', { word })}</button></div>
    ${preg ? `<div class="vopt"><span class="vic">${iconOr('nursery', '<circle r="12" fill="#CFE6F2" stroke="#5B3D32" stroke-width="2.5"/>')}</span><b>${tt('vet.preg_check', 'Expecting check-up')}</b><span class="small">${tt('vet.preg_info', 'Free for mums-to-be: a peek at the puppies on the ultrasound.')}</span><button class="btn yes" id="vetScan">${tt('vet.preg_go', 'Ultrasound')}</button></div>` : ''}
  </div>`;
}
function vetV2Bind(p, d) {
  const g = $('#vetGene', p); if (g) g.onclick = () => { SFX.click(); vetGeneTest(d); };
  const sn = $('#vetSniff', p); if (sn) sn.onclick = () => { SFX.click(); twVetSniff(d); };
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
    const lineIdx = NPC_LINES.indexOf(line); // the shown line is npcLineText(n) (the stored n.owner / n.line stay English: litters keep the owner)
    let genes = null; if (G && typeof G.randomGenotype === 'function') { try { genes = G.randomGenotype(key, r); } catch (e) { genes = null; } }
    if (!genes) genes = genesOf({ key });
    const id = `npc_${dk}_${i}`, c = coatInfo({ id, key, genes });
    const coat = c ? c.coatName : (STARTER_GENES[key] || {}).coat || '', eyes = c ? c.eyes : (STARTER_GENES[key] || {}).eyes || 'brown';
    return { npc: true, id, name, key, sex, born: bornDaysAgo(months), genes, owner, lineIdx, line: line.replace('he or she', sex === 'female' ? 'she' : 'he'), coat, eyes };
  });
}
// the shown text of a board dog's line (the table entry has "he or she" in it, so that one is a message with the dog's sex)
function npcLineText(n) {
  if (n.lineIdx === 8) return tt('vet.npc_puddle', '{sex, select, female {Has never met a puddle she did not like.} other {Has never met a puddle he did not like.}}', { sex: n.sex });
  return n.lineIdx >= 0 ? tdata('npc_lines.' + n.lineIdx, NPC_LINES[n.lineIdx]) : n.line;
}
function npcReady(npc) {
  const mine = S.dogs.filter((x) => x.sex && x.sex !== npc.sex);
  if (!mine.length) return `<li class="no">${esc(tt('vet.npc_none', '{want, select, boy {None of your dogs is a boy. Puppies need a boy and a girl. (Same-sex playdates are just fun play.)} other {None of your dogs is a girl. Puppies need a boy and a girl. (Same-sex playdates are just fun play.)}}', { want: npc.sex === 'female' ? 'boy' : 'girl' }))}</li>`;
  if (typeof canPair !== 'function') return mine.map((x) => `<li class="maybe">${esc(tt('vet.npc_vet_checks', '{name}: the vet will check on the day.', { name: x.name }))}</li>`).join('');
  return mine.map((x) => { let r = null; try { r = canPair(x, npc); } catch (e) { r = null; } const ok = !!(r && r.ok); return `<li class="${ok ? 'yes' : 'no'}">${ok ? '&#10003;' : '&#10007;'} ${esc(ok ? tt('vet.npc_ready', '{name} is ready', { name: x.name }) : r && r.why ? tt('vet.npc_why', '{name}: {why}', { name: x.name, why: r.why }) : tt('vet.npc_not_today', '{name}: not today', { name: x.name }))}</li>`; }).join('');
}
function npcTested(npc) { return !!(S && S.sniffed && npc && S.sniffed[npc.id]); }
function twNpcSummary(n) {
  const G = window.PawGenes; let r = null;
  if (G && typeof G.describe === 'function' && n.genes) { try { r = G.describe(n.genes); } catch (e) { r = null; } }
  if (r && r.summary) return String(r.summary);
  return geneReport(n).summary;
}
function twSniffBlock(n) { return npcTested(n) ? `<p class="pbsniff"><span class="pbsl">${esc(tt('vet.sniff_test', "{name}'s sniff test:", { name: n.name }))}</span> ${esc(twNpcSummary(n))}</p>` : ''; }
function openPlayboard() {
  SFX.boop(640);
  const list = playboardDogs();
  const cards = list.map((n, i) => `<div class="pbcard" data-npc="${i}"><span class="pin" aria-hidden="true"></span><span class="pbdog">${dogSVG(n, { pose: i % 2 ? 'happy' : 'sit' })}</span>
    <b>${esc(n.name)} ${sexSym(n.sex)}</b><span class="desc">${esc(tt('vet.npc_desc', '{breed} · {sex, select, female {Girl} other {Boy}} · {age}', { breed: tbreed(n.key), sex: n.sex, age: ageText(ageMonths(n)) }))}<br>${esc(n.eyes ? tt('vet.coat_eyes', '{coat}, {eyes} eyes', { coat: n.coat, eyes: n.eyes }) : n.coat)}<br><i>"${esc(npcLineText(n))}"</i><br><span class="small">${esc(tt('vet.lives_with', 'Lives with {owner}', { owner: townFamily(n.owner) }))}</span></span>
    <ul class="pbready">${npcReady(n)}</ul><div class="pbsniffbox">${twSniffBlock(n)}</div>${S.sniffer && !npcTested(n) ? `<button class="btn" data-sniff="${i}">${tt('vet.sniff', 'Sniff')}</button>` : ''}<button class="btn yes" data-pd="${i}">${tt('vet.ask_playdate', 'Ask for a playdate')}</button></div>`).join('');
  const p = openModal(tt('vet.board_title', 'Playdate Board'), `<p class="small">${tt('vet.board_intro', 'New friends pinned up every day. Pick a partner, and Puppy Playdates does the rest. Nobody here is related to your dogs.')}</p><div class="pbgrid">${cards}</div>`, { cls: 'shop playboard' });
  p.querySelectorAll('[data-pd]').forEach((b) => { b.onclick = () => { SFX.click(); const npc = list[+b.dataset.pd]; if (typeof openPlaydates === 'function') openPlaydates({ npc }); else nope(tt('vet.board_soon', 'Playdates open soon!')); }; });
  p.querySelectorAll('[data-sniff]').forEach((b) => { b.onclick = () => {
    const n = list[+b.dataset.sniff]; if (!S.sniffer || npcTested(n)) return;
    SFX.boop(760); S.sniffed = S.sniffed || {}; S.sniffed[n.id] = localISO(); markDirty();
    const card = b.closest('.pbcard'); card.querySelector('.pbsniffbox').innerHTML = twSniffBlock(n); b.remove();
  }; });
  return p;
}
function playboardFB() {
  // doodle cork board (0 0 300 220) used while PawArt.prop('playboard') is missing
  const frames = [[34, 70], [96, 70], [158, 70], [220, 70]];
  return `<svg viewBox="0 0 300 220"><path d="M60 180 V214 M240 180 V214" stroke="#8A6248" stroke-width="10" stroke-linecap="round"/><rect x="12" y="20" width="276" height="166" rx="12" fill="#D9A877" stroke="#5B3D32" stroke-width="5"/><rect x="24" y="32" width="252" height="142" rx="6" fill="#E8C397" stroke="#B88A5E" stroke-width="2" stroke-dasharray="3 6"/>
    <rect x="80" y="4" width="140" height="36" rx="8" fill="#FFF3DA" stroke="#5B3D32" stroke-width="3" transform="rotate(-3 150 22)"/><text x="150" y="31" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="28" fill="#5B3D32" transform="rotate(-3 150 22)">${esc(tt('vet.board_sign', 'Playdates!'))}</text>
    ${frames.map(([x, y], i) => `<g transform="rotate(${[-4, 3, -2, 5][i]} ${x + 23} ${y + 30})"><rect x="${x}" y="${y}" width="46" height="62" rx="3" fill="#FFFBF3" stroke="#5B3D32" stroke-width="2.5"/><rect x="${x + 5}" y="${y + 5}" width="36" height="36" fill="${['#CFE6F2', '#FBE0E6', '#E3F1D8', '#FFF0C2'][i]}"/><path d="M${x + 8} ${y + 50} h30 M${x + 8} ${y + 56} h20" stroke="#B09A86" stroke-width="2"/><circle cx="${x + 23}" cy="${y}" r="5" fill="${['#F28FA5', '#8FC1E3', '#F2C14E', '#9CCB8A'][i]}" stroke="#5B3D32" stroke-width="2"/></g>`).join('')}
    <path d="M40 150 q10 -8 20 0 t20 0" fill="none" stroke="#5B3D32" stroke-width="2"/><text x="250" y="162" text-anchor="end" font-family="Caveat,cursive" font-size="18" fill="#5B3D32">${esc(tt('vet.board_pal', 'pick a pal'))}</text></svg>`;
}
const BOARD_AT = { x: 22, y: 262, w: 156, h: 114 }; // dog park: back-left, above the agility tent, clear of every pack spot and the bowl
function playboardSVG() {
  const real = artReal('prop', 'playboard'), B = isPhone() ? { x: 194, y: 318, w: 94, h: 69 } : BOARD_AT; // v2.3 phone: beside the dog, inside the camera crop
  const heads = (S && real ? [] : playboardDogs().map((n, i) => place(headSVG(n), 34 + i * 62 + 5, 70 + 5, 36, 36))).join('');
  const inner = real ? place(real, 0, 0, 300, 220) : place(playboardFB(), 0, 0, 300, 220) + heads;
  return `<g id="playboardG" class="hot" tabindex="0" role="button" aria-label="${esc(tt('vet.board_aria', "Playdate Board: meet today's dogs"))}" transform="translate(${B.x} ${B.y}) scale(${(B.w / 300).toFixed(4)})"><rect width="300" height="220" fill="transparent"/>${inner}</g>`;
}

/* ---------- Town Square painter: Family Portrait (v2.1) ---------- */
const twPortraitCost = 500;
const twEaselAt = { x: 222, y: 250, w: 76, h: 95 }; // Town Square: between the fountain and the active dog, clear of the notice board and every pack spot
function twEaselFB() {
  return `<svg viewBox="0 0 160 200"><path d="M40 190 L70 40 M120 190 L90 40 M80 120 V196" stroke="#8A6248" stroke-width="8" stroke-linecap="round" fill="none"/><rect x="34" y="30" width="92" height="110" rx="4" fill="#FFFBF3" stroke="#5B3D32" stroke-width="5"/><circle cx="80" cy="80" r="22" fill="#E8C397" stroke="#5B3D32" stroke-width="3"/><circle cx="72" cy="76" r="3" fill="#5B3D32"/><circle cx="88" cy="76" r="3" fill="#5B3D32"/><path d="M70 90 q10 8 20 0" fill="none" stroke="#5B3D32" stroke-width="3"/></svg>`;
}
function twEaselSVG() {
  const real = artReal('prop', 'easel'), E = twEaselAt;
  return `<g id="easelG" class="hot" tabindex="0" role="button" aria-label="${esc(tt('vet.painter_aria', 'The town painter: Family Portrait'))}" transform="translate(${E.x} ${E.y}) scale(${(E.w / 160).toFixed(4)})"><rect width="160" height="200" fill="transparent"/>${real ? place(real, 0, 0, 160, 200) : place(twEaselFB(), 0, 0, 160, 200)}</g>`;
}
function twOpenPainter() {
  SFX.boop(600);
  const old = S.portrait && Array.isArray(S.portrait.ids) ? S.portrait.ids : [], sel = new Set(old.filter((id) => dogById(id)).slice(0, 4));
  if (!sel.size) S.dogs.slice(0, 4).forEach((x) => sel.add(x.id));
  const chips = S.dogs.map((x) => `<button class="dchip tw-pick" data-tpick="${x.id}" aria-pressed="${sel.has(x.id)}" title="${esc(x.name)}">${headSVG(x)}<span>${esc(x.name)}</span></button>`).join('');
  const p = openModal(tt('vet.painter_title', 'Town painter'), `<div class="painter"><span class="tw-easel">${twEaselSVGStandalone()}</span><div><p>${esc(tt('vet.painter_quote', '"Family Portrait: {cost} coins. Hold still. Everyone. Even you, the one licking the easel."', { cost: twPortraitCost }))}</p>
    <p class="small">${esc(tt('vet.painter_pick', 'Pick up to 4 dogs. {replace, select, yes {A new portrait replaces the old one.} other {It hangs in the yard as a Family Photo Frame.}} {coins, plural, one {You have # coin.} other {You have # coins.}}', { replace: S.portrait ? 'yes' : 'no', coins: S.coins }))}</p><div class="vdogs" role="group" aria-label="${tt('vet.painter_who', 'Who is in the portrait?')}">${chips}</div><p class="small" id="twPickNote"></p></div></div>`,
    { cls: 'painterpop', foot: `<button class="btn no" id="twPaintNo">${tt('vet.painter_no', 'Not today')}</button><button class="btn yes big" id="twPaintGo">${tt('vet.painter_go', 'Paint ({cost})', { cost: twPortraitCost })}</button>` });
  const note = () => { $('#twPickNote', p).textContent = tt('vet.painter_picked', '{n} of 4 picked.', { n: sel.size }); $('#twPaintGo', p).setAttribute('aria-disabled', sel.size ? 'false' : 'true'); };
  p.querySelectorAll('[data-tpick]').forEach((b) => { b.onclick = () => {
    const id = b.dataset.tpick; SFX.click();
    if (sel.has(id)) sel.delete(id); else if (sel.size >= 4) { nope(tt('vet.painter_full', 'The canvas only fits 4 dogs. The rest will be jealous.')); return; } else sel.add(id);
    b.setAttribute('aria-pressed', String(sel.has(id))); note();
  }; });
  note();
  $('#twPaintNo', p).onclick = () => { SFX.click(); closeModal(); };
  $('#twPaintGo', p).onclick = () => {
    if (!sel.size) { nope(tt('vet.painter_none', 'Pick at least one dog first.')); return; }
    if (S.coins < twPortraitCost) { nope(tt('vet.painter_broke', 'Not enough coins. The painter accepts coins, not exposure.')); return; }
    S.coins -= twPortraitCost; SFX.kaching();
    S.portrait = { date: localISO(), ids: S.dogs.filter((x) => sel.has(x.id)).map((x) => x.id) };
    const name = 'Family Photo Frame';
    S.decor = S.decor || {}; if (!S.decor[name]) { S.decor[name] = { got: localISO(), out: true }; markDirty(); emit('decor:new', { name }); }
    markDirty(); updateHUD(); closeModal();
    toast(tt('vet.painter_done', 'The portrait is done. Nobody blinked. Well, one dog blinked.'), 'gold');
  };
}
function twEaselSVGStandalone() { const real = artReal('prop', 'easel'); return `<svg viewBox="0 0 160 200" aria-hidden="true">${real ? place(real, 0, 0, 160, 200) : place(twEaselFB(), 0, 0, 160, 200)}</svg>`; }

/* ---------- rehomed visitors (Dog Park, Town Square, Pier, Café) ---------- */
const VISIT_PLACES = ['dogpark', 'square', 'pier', 'cafe'];
// used only when every pack spot of the place is taken (3 other dogs): solved against the furniture, the active dog and the place buttons
const VISIT_EXTRA = { dogpark: [905, 432, 'left', 0.5], square: [572, 426, 'left', 0.46], pier: [578, 426, 'left', 0.46], cafe: [568, 426, 'left', 0.46] };
const V2T = { rollPlace: null, visitor: null, line: '' };
function visitorSpot() {
  const sp = typeof packSpots === 'function' ? packSpots() : [], used = Math.min(3, Math.max(0, S.dogs.length - 1));
  const free = sp.slice(used).concat([VISIT_EXTRA[S.place] || [905, 432, 'left', 0.5]]);
  return free[0];
}
function visitorDog(v) { return { id: v.id, key: v.key, genes: v.genes, born: v.born, mix: v.mix || null, sparkle: !!v.sparkle }; }
// v2.11.1: the visitor's drawing takes its size class (sizeK) round its feet, and so does its tap rect
function visitorSVG(v) {
  const [fx, fy, face, sc] = visitorSpot(), w = 264 * sc, h = 220 * sc, z = sizeK(v);
  // the tap rect scales with the drawing round the feet; on phones never smaller than the spot's own rect (the 44 px one)
  const ph = isPhone(), rw = Math.max((w - 52) * z, ph ? w - 52 : 0), up = Math.max((h * (205 / 220) - 26) * z, ph ? h * (205 / 220) - 26 : 0), dn = h * (15 / 220) * Math.max(z, ph ? 1 : 0);
  return `<g id="visitorG" class="visitor hot" data-visitor="${esc(v.id)}" tabindex="0" role="button" aria-label="${esc(tt('vet.visit_aria', '{name} is visiting with {family}', { name: v.name, family: famName(v.family) }))}"><rect x="${(fx - rw / 2).toFixed(1)}" y="${(fy - up).toFixed(1)}" width="${rw.toFixed(1)}" height="${(up + dn).toFixed(1)}" fill="transparent"/>${place(dogSVG(visitorDog(v), { pose: 'happy', facing: face }), fx - w * z / 2, fy - h * z * (205 / 220), w * z, h * z)}<g class="vtag" pointer-events="none" transform="translate(${fx} ${fy + 4})"><rect x="-46" y="-2" width="92" height="22" rx="7" fill="#FFF3DA" stroke="#5B3D32" stroke-width="2"/><text y="15" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="17" fill="#5B3D32">${esc(v.name.length > 12 ? v.name.slice(0, 11) + '.' : v.name)}</text></g></g>`;
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
  if (typeof phHomeRefit === 'function') phHomeRefit(); // v2.3 phone: dog and visitor share the crop
  if (typeof dcRoom === 'function') dcRoom(); // v2.11: a Dog Card visitor never stands on the pup's tap area
  V2T.line = tt('vet.visit_line', '{sparkle, select, yes {Look who it is! {name} grew up! ...and still sparkly!} other {Look who it is! {name} grew up!}}', { name: v.name, sparkle: v.sparkle ? 'yes' : 'no' });
  if (greet) setTimeout(() => { if (cur.mode === 'yard' && $('#visitorG', view) && modal.hidden) { const [fx, fy, , sc] = visitorSpot(); say(V2T.line, fx, fy - 200 * sc, 3200); SFX.bark(BARK[v.key] || 1); } }, 900);
}
function openVisitor(id) {
  const v = (S.rehomed || []).find((x) => x.id === id); if (!v) return;
  const today = localISO(), petted = v.petDay === today, m = v.born ? ageMonths(v) : 0;
  const breed = v.mix && v.mix.name ? `${v.mix.name}` : tbreed(v.key);
  SFX.boop(700);
  const p = openModal(tt('vet.visit_title', '{name} is visiting!', { name: esc(v.name) }), `<div class="visitcard"><span class="vzdog">${dogSVG(visitorDog(v), { pose: 'sit' })}</span><div><p><b>${esc(v.name)}</b> ${sexSym(v.sex)} · ${esc(breed)}</p><p>${tt('vet.visit_age_html', '<b>Age:</b> {age}', { age: ageText(m) })}</p><p>${tt('vet.visit_family_html', '<b>Family:</b> lives with {family}.', { family: famName(v.family) })}</p><p class="small">${esc(PICK([tt('vet.visit_wiggle', '{sex, select, female {{name} wiggles so hard her whole back half joins in.} other {{name} wiggles so hard his whole back half joins in.}}', { name: v.name, sex: v.sex }), tt('vet.visit_treats', '{sex, select, female {{name} remembers you. She also remembers where you keep the treats.} other {{name} remembers you. He also remembers where you keep the treats.}}', { name: v.name, sex: v.sex }), tt('vet.visit_feet', 'The family says {name} sleeps on their feet every night. Classic.', { name: v.name })]))}</p></div></div>`,
    { foot: `<button class="btn yes big" id="vzPet" ${petted ? 'aria-disabled="true"' : ''}>${petted ? tt('vet.visit_petted', 'Petted today') : tt('vet.visit_pet', 'Pet')}</button>` });
  $('#vzPet', p).onclick = () => {
    if (v.petDay === localISO()) { nope(tt('vet.visit_already', '{sex, select, female {{name} already got pets today. She is pretending otherwise.} other {{name} already got pets today. He is pretending otherwise.}}', { name: v.name, sex: v.sex })); return; }
    v.petDay = localISO(); v.lastVisit = localISO(); addStat('happy', 5); markDirty(); SFX.boop(820); updateHUD();
    closeModal(); const [fx, fy, , sc] = visitorSpot(); fxText('\u2665', fx, fy - 150 * sc); setTimeout(() => fxText('\u2665', fx + 20, fy - 170 * sc), 200);
    toast(tt('vet.visit_hello', '{name} and {friend} sniff hello like old friends. +5 Happiness.', { name: NAME(), friend: v.name }), 'good');
  };
}

/* ---------- scene overlay: built on every yard:enter ---------- */
function townV2Enter() {
  if (cur.mode !== 'yard' || !S) return;
  const svg = $('svg.world', view); if (!svg) return;
  if (S.place !== V2T.rollPlace) { V2T.rollPlace = S.place; V2T.visitor = null; if (VISIT_PLACES.includes(S.place)) { const v = rollVisitor(); if (v) { V2T.visitor = v.id; v.lastVisit = localISO(); markDirty(); V2T.greet = true; } } }
  if (S.place !== 'dogpark' && !VISIT_PLACES.includes(S.place)) return;
  const squareTown = S.place === 'square';
  const pack = $('#pack', svg); if (!pack) return;
  pack.insertAdjacentHTML('beforebegin', `<g id="townV2">${S.place === 'dogpark' ? playboardSVG() : ''}${squareTown ? twEaselSVG() : ''}</g>`);
  const ez = $('#easelG', svg); if (ez) { ez.onclick = () => twOpenPainter(); ez.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); twOpenPainter(); } }; }
  if (squareTown) { const pb = $('#placeBtns'); if (pb && !pb.querySelector('[data-pb3]')) { const home = pb.querySelector('[data-pb="yard"]'); const html = `<button class="btn yes" data-pb3="painter">${tt('vet.btn_portrait', 'Family Portrait')}</button>`; if (home) home.insertAdjacentHTML('beforebegin', html); else pb.insertAdjacentHTML('beforeend', html); pb.querySelector('[data-pb3]').onclick = () => twOpenPainter(); } }
  const b = $('#playboardG', svg); if (b) { b.onclick = () => openPlayboard(); b.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPlayboard(); } }; }
  if (S.place === 'dogpark') { const pb = $('#placeBtns'); if (pb && !pb.querySelector('[data-pb2]')) { const home = pb.querySelector('[data-pb="yard"]'); const html = `<button class="btn yes" data-pb2="playboard">${tt('vet.btn_board', 'Playdate board')}</button>`; if (home) home.insertAdjacentHTML('beforebegin', html); else pb.insertAdjacentHTML('beforeend', html); pb.querySelector('[data-pb2]').onclick = () => openPlayboard(); } }
  const v = V2T.visitor && (S.rehomed || []).find((x) => x.id === V2T.visitor);
  if (v) { drawVisitor(v, !!V2T.greet); V2T.greet = false; }
}
on('yard:enter', townV2Enter);

/* ---------- test hooks ---------- */
function townV2Hooks() {
  if (!window.__paw) return;
  window.__paw.town = {
    boardDogs: (dk) => playboardDogs(dk || localISO()), openBoard: openPlayboard, geneReport: (id) => geneReport(dogById(id) || D()),
    twOpenPainter, npcTested,
    visit: (id) => { const v = (S.rehomed || []).find((x) => x.id === id) || (S.rehomed || [])[0]; if (!v) return null; V2T.rollPlace = S.place; V2T.visitor = v.id; v.lastVisit = localISO(); markDirty(); if (cur.mode === 'yard') drawVisitor(v, true); return v.id; },
    get visitor() { return V2T.visitor; }, get line() { return V2T.line; }, spot: () => visitorSpot(), reroll: () => { V2T.rollPlace = null; }
  };
}
on('game:ready', () => { if (S && (!S.sniffed || typeof S.sniffed !== 'object')) S.sniffed = {}; if (S) { const t = localISO(); Object.keys(S.sniffed).forEach((k) => { if (S.sniffed[k] !== t) delete S.sniffed[k]; }); } }); // board dogs change daily: keep only today's sniffs
on('game:ready', townV2Hooks); setTimeout(townV2Hooks, 0);
