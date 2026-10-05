/* ======================= WALK (v1.1: treasure hunt) ======================= */
let W = null;
const SPEED = 160;
function grantTreasure(t, area) {
  if (isUnique(t) && hasTreasure(t)) return { dup: true, coins: addCoins(40, { raw: true }) };
  if (t.kind === 'food') S.inv.food[t.n] = (S.inv.food[t.n] || 0) + 1;
  if (t.kind === 'wearable') S.inv.clothes.push(t.n);
  if (t.kind === 'toy') S.inv.toys.push(t.n);
  if (t.kind === 'charm') S.inv.charms.push(t.n);
  if (t.kind === 'quest') S.mapPieces.push(t.piece);
  const first = !S.found[t.n]; if (first) S.found[t.n] = { day: day(), route: area };
  markDirty(); return { first };
}
function rollTreasure(area, o = {}) {
  if (area === 'river' && S.stoneHint && !hasTreasure(tInfo('Sparkle Stone')) && o.not !== 'Sparkle Stone' && !o.common && !(o.maxR != null && o.maxR < 2)) { // v2.1 BREED: the Stone hint
    const st = tInfo('Sparkle Stone'); if (st) return { item: st, r: st.r };
  }
  const p = RAR_P.slice(); if (S.outfit.neck === 'Clover Collar') { p[2] *= 2; p[3] *= 2; p[0] = 100 - p[1] - p[2] - p[3]; }
  let ri = 0;
  if (!o.common) { let x = Math.random() * 100; while (ri < 3 && x >= p[ri]) { x -= p[ri]; ri++; } }
  if (o.maxR != null) ri = Math.min(ri, o.maxR);
  for (let r = ri; r >= 0; r--) {
    const c = TREASURES.filter((t) => t.r === r && t.routes.includes(area) && !(isUnique(t) && hasTreasure(t)) && t.n !== o.not);
    if (c.length) return { item: PICK(c), r };
  }
  return { coins: RAR_COINS[ri], r: ri };
}
function enterWalk(area) {
  const wb = walkBlock(D(), area); if (wb) { nope(wb); go('yard'); return; } // v2: puppies, expecting and nursing mums (16b)
  walkPackNote(area);
  if (window.PawWalk && typeof window.PawWalk.start === 'function') { enterWalkMod(area); return; } enterWalkClassic(area); }
function enterWalkClassic(area) {
  setChrome(true, false);
  const sc = walkScale(), R = sc < 1 ? Object.assign({}, ROUTES[area], { secs: Math.round(ROUTES[area].secs * sc) }) : ROUTES[area], wx = weatherNow(); // 3 to 6 months: shorter walks
  const len = R.secs * SPEED, firstWalk = !S.walks;
  W = { env: envNow(), area, R, len, dist: 0, hold: false, auto: false, objs: [], coins: 0, happy: 0, bond: 0, clean: 0, e0: S.stats.energy, pauseUntil: 0, hopUntil: 0, digWait: null, ended: false, pose: '', npcs: 0, wx, raf: 0, t: performance.now(), skipAt: 0,
    digsLeft: 2 + (S.outfit.head === 'Acorn Cap' ? 1 : 0) + (buffOn('dig1') ? 1 : 0), loot: rollTreasure(area, { common: firstWalk }), found: null, extra: [], junk: [], nudge: 0, noseT: 0, firstWalk, outOfDigsSaid: false };
  // route layout: 4-5 sniff clues, 3-4 dig spots (one holds the treasure), few coins, 0-2 puddles, 1-2 dogs
  const spots = [], add = (type, n) => { for (let i = 0; i < n; i++) spots.push(type); };
  add('sniff', RINT(4, 5)); add('puddle', area === 'beach' ? 0 : RINT(1, 2)); add('npc', RINT(1, 2) + (S.outfit.neck === 'Red Bandana' ? 1 : 0)); add('col', Math.round(len / 1300));
  if (Math.random() < 0.1) add('surprise', 1);
  spots.sort(() => Math.random() - 0.5);
  const step = (len - 1100) / spots.length;
  spots.forEach((t, i) => {
    const ox = 700 + i * step + RAND(0, step * 0.4);
    if (t === 'col') W.objs.push({ t: 'col', kind: 'coin', x: ox, y: Math.random() < 0.4 ? 220 : 270 });
    else if (t === 'npc') W.objs.push({ t: 'npc', kind: PICK(dogsList().filter((d) => d.key !== S.dog.key)).key, x: ox + 120 });
    else if (t === 'surprise') { const sr = rollTreasure(area, { maxR: 1, not: W.loot.item && W.loot.item.n }); if (sr.item) W.objs.push({ t: 'surprise', item: sr.item, x: ox, y: 250 }); }
    else W.objs.push({ t, x: ox });
  });
  const nDig = RINT(3, 4), digs = [];
  for (let i = 0; i < nDig; i++) { const o = { t: 'dig', x: len * (0.22 + 0.68 * (i + RAND(0.15, 0.85)) / nDig) }; digs.push(o); W.objs.push(o); }
  W.treasureDig = firstWalk ? digs[0] : PICK(digs); W.treasureDig.treasure = true;
  buildWalk();
  dock.innerHTML = `<div class="tray"><div class="tray-h"><h3>${esc(R.n)}: find the hidden treasure</h3><button class="xbtn" id="walkQuit" aria-label="Go home early">x</button></div>
    <div class="walkctl"><div class="nose cold" id="nose"><span class="ic">${iconOr('nose', '<ellipse cx="0" cy="2" rx="13" ry="9" fill="#5B3D32"/><ellipse cx="-4" cy="-1" rx="3" ry="2" fill="#FFFBF3" opacity=".7"/>')}</span><span class="lbl" id="noseLbl">Cold</span><div class="prog" aria-label="Nose-o-meter"><i id="noseBar"></i></div></div>
      <span class="digs" id="digsLeft"></span><div class="prog" style="max-width:220px" aria-label="Walk progress"><i id="walkBar"></i></div><span id="walkTime" class="small" style="min-width:56px;text-align:right"></span></div>
    <div class="walkctl"><button class="btn holdbtn" id="holdBtn">Hold to walk</button><button class="btn" id="hopBtn">Hop</button><button class="btn yes" id="digBtn" disabled>Dig!</button><button class="btn" id="bagBtn"><span class="ic">${iconOr('bag', '<path d="M-12 -4 Q0 -16 12 -4 L14 14 L-14 14 Z" fill="#FCD8BC" stroke="#5B3D32" stroke-width="2"/>')}</span>Bag</button><label class="tog"><input type="checkbox" id="autoWalk"> Auto-walk</label></div>
    <div class="walkbag" id="walkBag" hidden></div>
    <p class="small" style="margin:0">${isPhone() ? 'Hold the button, or press the scene, to walk.' : 'Hold to walk (button, scene, Space or right arrow).'} Sniff spots give clues; the Nose-o-meter gets hotter near the treasure. You have only ${W.digsLeft} digs, so choose your X wisely.</p></div>`;
  const hb = $('#holdBtn');
  const down = (e) => { e.preventDefault(); SFX.init(); W.hold = true; W.holdAt = performance.now(); hb.classList.add('down'); };
  const up = () => { W.hold = false; hb.classList.remove('down'); };
  hb.addEventListener('pointerdown', down); hb.addEventListener('pointerup', up); hb.addEventListener('pointerleave', up); hb.addEventListener('pointercancel', up);
  hb.addEventListener('keydown', (e) => { if (e.key === 'Enter') { W.hold = true; W.holdAt = performance.now(); hb.classList.add('down'); } }); hb.addEventListener('keyup', up);
  $('#hopBtn').onclick = hop; $('#digBtn').onclick = () => W.digWait && dig(W.digWait);
  $('#bagBtn').onclick = toggleBag;
  $('#autoWalk').onchange = (e) => { W.auto = e.target.checked; };
  $('#walkQuit').onclick = () => endWalk(false);
  cur.key = (e) => {
    if (!W || W.ended) return;
    if ((e.key === ' ' || e.key === 'ArrowRight') && !e.repeat) { e.preventDefault(); W.hold = true; W.holdAt = performance.now(); hb.classList.add('down'); }
    if (e.key === 'ArrowUp') { e.preventDefault(); hop(); }
    if ((e.key === 'Enter' || e.key === 'd') && W.digWait && document.activeElement.tagName !== 'BUTTON') dig(W.digWait);
  };
  cur.keyup = (e) => { if (e.key === ' ' || e.key === 'ArrowRight') up(); };
  const onResize = () => buildWalk(); window.addEventListener('resize', onResize);
  W.raf = requestAnimationFrame(walkLoop);
  onCleanup(() => { cancelAnimationFrame(W && W.raf); window.removeEventListener('resize', onResize); cur.key = null; cur.keyup = null; });
  if (buffOn('walk15')) { W.len += 15 * SPEED; } if (buffOn('walk15') || buffOn('dig1')) { S.buff = null; markDirty(); }
  updateDigs();
  toast(firstWalk ? `First treasure hunt! Sniff the clues, then dig at an X. (Psst: try the first X.)` : wx === 'rain' ? `It's raining.${hasRaincoat() ? ' Good thing about that raincoat.' : ' Expect mud.'}` : wx === 'snow' ? 'Snowy treasure hunt! Crunch crunch.' : `Off to ${R.n}. Something is buried here...`, 'gold');
}
function updateDigs() { const d = $('#digsLeft'); if (d) d.textContent = W.found ? 'Treasure found!' : `Digs left: ${W.digsLeft}`; }
function toggleBag() {
  const b = $('#walkBag'); if (!b) return; SFX.click(); b.hidden = !b.hidden; if (b.hidden) return;
  const n = S.inv.food['Wild Berries'] || 0;
  b.innerHTML = n ? `<span class="ic" style="width:34px;height:34px">${art('item', 'Wild Berries')}</span><span>Wild Berries x${n}</span><button class="btn yes" id="useBerries">Use: +15 seconds</button>` : '<span class="small">Nothing usable on a walk. Wild Berries (a treasure) add +15 seconds.</span>';
  const u = $('#useBerries'); if (u) u.onclick = () => { S.inv.food['Wild Berries']--; if (S.inv.food['Wild Berries'] <= 0) delete S.inv.food['Wild Berries']; W.len += 15 * SPEED; markDirty(); SFX.slurp(); toast(`${NAME()} ate the berries. +15 seconds of walk!`, 'good'); toggleBag(); };
}
function buildWalk() {
  const r = view.getBoundingClientRect(); const VW = Math.max(520, Math.round(400 * (r.width / Math.max(1, r.height))));
  W.VW = VW; W.dogX = Math.min(Math.round(VW * 0.3), 380);
  const strip = art('walkStrip', W.area, W.env), n = Math.ceil(VW / 1200) + 1;
  const tiles = Array.from({ length: n }, (_, i) => place(strip, i * 1200, 0, 1200, 400)).join('');
  const clouds = Array.from({ length: Math.ceil(VW / 500) + 1 }, (_, i) => `<path d="M${i * 500 + 60} 70 q20 -30 50 -10 q25 -25 50 5 q30 -5 25 20 q-5 20 -40 15 q-30 15 -55 0 q-35 5 -30 -30z" fill="#FFFBF3" fill-opacity=".85" stroke="#5B3D32" stroke-width="2.2" stroke-linejoin="round"/>`).join('');
  const tufts = Array.from({ length: Math.ceil(VW / 300) + 2 }, (_, i) => `<path d="M${i * 300 + 40} 400 l8 -34 l6 30 l9 -40 l5 44" fill="none" stroke="#6E9E62" stroke-width="2.6" stroke-linecap="round" opacity=".85"/>`).join('');
  const objs = W.objs.map((o, i) => objSVG(o, i)).join('');
  view.innerHTML = `<svg class="world" viewBox="0 0 ${VW} 400" preserveAspectRatio="xMidYMid slice">
    <g id="stripL">${tiles}</g><g id="farL" opacity=".85">${clouds}</g><g id="objL">${objs}</g>
    <g id="dogW" transform="translate(${W.dogX - 102} ${330 - 158})"><g id="dogWA" class="walkdog"></g></g>
    <g id="nearL">${tufts}</g><g id="fx"></g></svg>${W.wx === 'rain' || W.wx === 'snow' ? `<div class="wxfx ${W.wx}"></div>` : ''}`;
  W.pose = ''; W.facing = 'right';
  const svg = $('svg.world', view);
  svg.addEventListener('pointerdown', (e) => {
    SFX.init();
    const o = e.target.closest('[data-i]'); if (o) { tapObj(W.objs[+o.dataset.i]); return; }
    W.hold = true; W.holdAt = performance.now(); try { svg.setPointerCapture(e.pointerId); } catch (er) { /* none */ }
  });
  const rel = () => { W.hold = false; const hb = $('#holdBtn'); if (hb) hb.classList.remove('down'); };
  svg.addEventListener('pointerup', rel); svg.addEventListener('pointercancel', rel);
  drawWalk(0);
}
const SPARK_FB = `<svg viewBox="0 0 60 60"><path d="M30 8 Q32 28 52 30 Q32 32 30 52 Q28 32 8 30 Q28 28 30 8Z" fill="#FFE3A1" stroke="#5B3D32" stroke-width="2" opacity=".85"/></svg>`;
function objSVG(o, i) {
  if (o.done && o.t !== 'npc') return '';
  let s = '';
  if (o.t === 'col') s = place(art('collectible', 'coin'), -27, o.y, 54, 54);
  if (o.t === 'sniff') s = place(art('collectible', 'sniff'), -35, 262, 70, 70);
  if (o.t === 'puddle') s = place(art('collectible', 'puddle'), -50, 262, 100, 75);
  if (o.t === 'dig') s = place(art('collectible', 'dig'), -36, 266, 72, 72) + (o.treasure && S.outfit.eyes === 'Explorer Goggles' ? place(artReal('collectible', 'sparkle-spot') || SPARK_FB, -30, 216, 60, 60, 'class="gogglespark"') : '');
  if (o.t === 'surprise') s = place(artReal('collectible', 'sparkle-spot') || SPARK_FB, -40, o.y - 20, 80, 80) + place(art('item', o.item.n), -24, o.y, 48, 48);
  if (o.t === 'npc') s = place(art('dog', o.kind, { pose: o.met ? 'happy' : 'idle', facing: 'left' }), -102, 172, 204, 170);
  return `<g id="wo${i}" data-i="${i}" class="wobj hot" transform="translate(${o.x} 0)">${s}</g>`;
}
function setWalkPose(p) {
  if (W.pose === p) return; W.pose = p;
  const g = $('#dogWA'); if (g) g.innerHTML = place(dogSVG(D(), { pose: p, outfit: dogOutfit() }), 0, 0, 204, 170);
}
function hop() {
  if (!W || W.ended || performance.now() < W.hopUntil) return;
  W.hopUntil = performance.now() + 700; SFX.whoosh();
  const g = $('#dogWA'); g.classList.remove('hop'); void g.getBBox(); g.classList.add('hop');
}
function noseHeat() {
  const o = W.treasureDig; if (!o || o.done || W.found) return null;
  const range = 1500 * (S.outfit.neck === 'Seashell Necklace' ? 2 : 1) * noseMul();
  return clamp(1 - Math.abs(o.x - (W.dist + W.dogX)) / range + W.nudge, 0, 1);
}
function updateNose(now) {
  if (now - W.noseT < 120) return; W.noseT = now; W.nudge *= 0.9;
  const el = $('#nose'); if (!el) return;
  const h = noseHeat(), bar = $('#noseBar'), lbl = $('#noseLbl');
  if (h === null) { el.className = 'nose warm'; bar.style.width = '100%'; lbl.textContent = W.found ? 'Found!' : 'Dug'; return; }
  const k = h > 0.72 ? 'hot' : h > 0.38 ? 'warm' : 'cold';
  el.className = 'nose ' + k; bar.style.width = Math.round(6 + h * 94) + '%'; lbl.textContent = k === 'hot' ? 'HOT' : k === 'warm' ? 'Warm' : 'Cold';
}
function sniffClue() {
  const o = W.treasureDig, dx = W.dist + W.dogX;
  if (!o || o.done || W.found) return PICK(['Smells like... a job well done.', 'Sniff sniff. Just happy smells now.']);
  W.nudge = Math.min(0.25, W.nudge + 0.18);
  const h = noseHeat();
  if (o.x < dx - 200) return PICK(CLUES.past);
  return PICK(h > 0.72 ? CLUES.hot : h > 0.38 ? CLUES.warm : CLUES.far);
}
function walkLoop(now) {
  if (!W || W.ended) return;
  const dt = Math.min(0.05, (now - W.t) / 1000); W.t = now;
  const paused = now < W.pauseUntil || !!W.digWait;
  const walking = (W.hold || W.auto) && !paused;
  if (W.digWait && W.hold && (W.holdAt || 0) > W.skipAt) { W.digWait.skipped = true; W.digWait = null; $('#digBtn').disabled = true; toast('Not this X. Onwards!'); }
  if (walking) {
    const sp = SPEED * (S.outfit.body === 'Superhero Cape' ? 1.15 : 1);
    W.dist = Math.min(W.len, W.dist + sp * dt);
    const drain = W.R.energy / (W.R.secs * SPEED) * (S.dog.key === 'husky' ? 0.8 : 1) * (W.wx === 'snow' && isWarm() ? 0.9 : 1);
    S.stats.energy = Math.max(0, S.stats.energy - drain * sp * dt);
  }
  const hopping = now < W.hopUntil;
  setWalkPose(hopping ? 'jump' : paused ? (W.digWait ? 'idle' : W.pose === 'eat' ? 'eat' : 'happy') : walking ? 'walk' : 'idle');
  const dx = W.dist + W.dogX;
  W.objs.forEach((o, i) => {
    if (o.done) return;
    if (o.t === 'npc') { if (!o.met && o.x - 170 <= dx) meetNpc(o, i); if (o.x < dx - 400) o.done = true; return; }
    if (o.x - 22 > dx) return;
    if (o.t === 'col' || o.t === 'surprise') collect(o, i);
    else if (o.t === 'sniff') { o.done = true; W.pauseUntil = now + 1700; W.happy += 2; W.bond += 1; SFX.sniff(); sayW(sniffClue(), W.dogX + 40, 160, 2200); removeObj(i); }
    else if (o.t === 'puddle') { o.done = true; if (hopping) toast('Nice hop! Paws stay (mostly) clean.'); else if (S.outfit.body === 'Mossy Poncho') toast('Splash! The Mossy Poncho kept everything clean. Puddle-proof.', 'good'); else { W.clean += 5; addStat('clean', -5); SFX.splash(); toast(PICK(MUD), 'bad'); } }
    else if (o.t === 'dig' && !o.skipped && !o.prompted) {
      o.prompted = true;
      if (W.found) return;
      if (W.digsLeft <= 0) { if (!W.outOfDigsSaid) { W.outOfDigsSaid = true; sayW('Out of digs. The nose sighs.', W.dogX + 40, 160, 1800); } return; }
      W.digWait = o; W.skipAt = now + 300; $('#digBtn').disabled = false;
      sayW(`Dig here? ${W.digsLeft} dig${W.digsLeft > 1 ? 's' : ''} left. (Dig! or D to dig, hold walk to skip.)`, W.dogX + 40, 160, 3000); SFX.boop(440);
    }
  });
  if (S.stats.energy <= 0 && !W.ended) { toast(`${NAME()} is out of puff. Heading home.`, 'bad'); endWalk(false); return; }
  updateNose(now); drawWalk(now);
  if (W.dist >= W.len) { endWalk(true); return; }
  W.raf = requestAnimationFrame(walkLoop);
}
function sayW(t, x, y, ms) { say(t, x, y, ms); }
function drawWalk() {
  const s = W.dist;
  const sL = $('#stripL'), oL = $('#objL'), fL = $('#farL'), nL = $('#nearL');
  if (sL) sL.setAttribute('transform', `translate(${-(s % 1200)} 0)`);
  if (fL) fL.setAttribute('transform', `translate(${-((s * 0.35) % 500)} 0)`);
  if (nL) nL.setAttribute('transform', `translate(${-((s * 1.35) % 300)} 0)`);
  if (oL) oL.setAttribute('transform', `translate(${-s} 0)`);
  const bar = $('#walkBar'); if (bar) bar.style.width = (s / W.len * 100) + '%';
  const tm = $('#walkTime'); if (tm) tm.textContent = Math.ceil((W.len - s) / SPEED) + 's left';
  updateHUD();
}
function removeObj(i) { const el = $('#wo' + i); if (el) { el.classList.add('got'); setTimeout(() => el.remove(), 600); } }
function collect(o, i) {
  if (o.done) return; o.done = true; SFX.pop();
  if (o.t === 'surprise') { const g = grantTreasure(o.item, W.area); W.extra.push({ item: o.item, dup: g.dup }); SFX.treasure(); toast(g.dup ? `A sparkle on the path! Another ${o.item.n}... sold to a squirrel for 40 coins.` : `Surprise treasure on the path: ${o.item.n}! (${RARITY[o.item.r]})`, 'gold'); }
  else W.coins += RINT(1, 4);
  removeObj(i);
}
function tapObj(o) {
  if (!o || o.done || W.ended) return; const i = W.objs.indexOf(o), d = o.x - (W.dist + W.dogX);
  if ((o.t === 'col' || o.t === 'surprise') && d < W.VW) { collect(o, i); return; }
  if (o.t === 'puddle' && d < 320) { hop(); return; }
  if (o.t === 'dig') { if (W.digWait === o || (Math.abs(d) < 200 && !W.found && W.digsLeft > 0)) dig(o); else if (d >= 200) toast('Walk up to the X to dig it.'); return; }
  if (o.t === 'npc') { SFX.bark(BARK[o.kind]); sayW(PICK(NPC_JOKES), o.x - W.dist, 150, 2200); }
}
function dig(o) {
  if (o.done || W.digsLeft <= 0 || W.found) return;
  o.done = true; W.digWait = null; W.digsLeft--; $('#digBtn').disabled = true; updateDigs();
  W.pauseUntil = performance.now() + 1500; W.pose = ''; setWalkPose('dig'); W.pose = 'eat';
  SFX.crunch(); setTimeout(SFX.crunch, 350);
  const i = W.objs.indexOf(o); removeObj(i);
  const sx = o.x - W.dist;
  W.happy += favAct('digging') ? 5 : 2; W.bond += 2;
  if (o.treasure) {
    const L = W.loot; W.found = L; updateDigs();
    if (L.item) { const g = grantTreasure(L.item, W.area); L.dup = g.dup; L.first = g.first; }
    else W.coins += L.coins;
    setTimeout(() => {
      SFX.treasure(); setTimeout(SFX.fanfare, 300); audioCue('treasure');
      const fx = $('#fx'); if (fx) { fx.insertAdjacentHTML('beforeend', `<g class="popfx">${place(artReal('collectible', 'chest') || art('collectible', 'dig'), sx - 45, 220, 90, 90)}${L.item ? place(art('item', L.item.n), sx - 32, 150, 64, 64) : ''}</g>`); setTimeout(() => { const g = fx.lastElementChild; if (g) g.remove(); }, 1400); }
      fxText('TREASURE!', sx, 140, '#F2C744', 48);
      toast(L.item ? (L.dup ? `Treasure: another ${L.item.n}. A squirrel bought it for 40 coins.` : `TREASURE! ${L.item.n} (${RARITY[L.item.r]})!`) : `A treasure pouch of coins! +${L.coins * BOOST.coins} coins at the end.`, 'gold');
    }, 600);
  } else {
    if (Math.random() < 0.5) { const v = RINT(5, 15); W.coins += v / BOOST.coins; setTimeout(() => toast(`No treasure here. Just ${v} coins. Consolation coins!`), 500); }
    else if (Math.random() < 0.1) { const f = PICK(peopleFood().filter((x) => x.where.includes('junk'))); W.coins += 5 / BOOST.coins; setTimeout(() => safetyNote(f.id, 'It went to the town compost. (+5 coins)'), 500); }
    else { const [k, line] = PICK(JUNK); W.junk.push(k); W.coins += RINT(2, 4) / BOOST.coins; setTimeout(() => toast(`${line} (Turned into a few coins.)`), 500); }
    if (W.digsLeft === 0) setTimeout(() => sayW('That was the last dig. The treasure keeps its secret.', W.dogX + 40, 160, 2400), 1600);
  }
}
function meetNpc(o, i) {
  o.met = true; W.npcs++; const el = $('#wo' + i); if (el) el.innerHTML = place(art('dog', o.kind, { pose: 'happy', facing: 'left' }), -102, 172, 204, 170);
  SFX.bark(BARK[o.kind]); W.happy += 5; W.bond += 2; W.pauseUntil = performance.now() + 1500;
  let line = PICK(NPC_JOKES);
  const dressed = SLOTS.some((s) => S.outfit[s]);
  if (dressed) { const c = 3 + (S.outfit.neck === 'Bow Tie' ? 2 : 0); W.coins += c; line = PICK(['Love the outfit. Here, have some coins.', 'Fancy! Is that designer?', 'Wow. Stylish. Take my money.']); setTimeout(() => toast(`Compliment! +${c * BOOST.coins} coins.`, 'gold'), 400); }
  sayW(line, o.x - W.dist - 60, 150, 2600);
}
function endWalk(complete) {
  if (!W || W.ended) return; W.ended = true; pottyWalked(); cancelAnimationFrame(W.raf);
  const R = W.R, frac = complete ? 1 : Math.min(1, W.dist / (R.secs * SPEED));
  const base = Math.round(RAND(R.coins[0], R.coins[1]) * frac);
  const penny = S.outfit.charm === 'Lucky Penny' ? 1.1 : 1;
  const coins = addCoins((base + W.coins) * penny);
  const happy = Math.round((R.happy * frac + W.happy + (W.wx === 'rain' && hasRaincoat() ? 5 : 0)) * (W.wx === 'sunny' && S.outfit.eyes === 'Heart Sunglasses' ? 1.1 : 1) * (favAct('walks') ? 1.5 : 1));
  addStat('happy', happy);
  const cleanLoss = Math.round(R.clean * frac + (W.wx === 'rain' && !hasRaincoat() ? 5 * frac : 0)) - (W.wx === 'rain' && hasRaincoat() ? Math.round(R.clean * frac) : 0);
  addStat('clean', -cleanLoss);
  const bond = frac > 0.05 ? addBond(R.bp * frac + W.bond) : 0;
  const energy = Math.round(W.e0 - S.stats.energy);
  if (frac > 0.05 || W.found) { dailyCare('play'); S.walks = (S.walks || 0) + 1; }
  markDirty(); hideBubble(); setWalkPose('happy');
  const L = W.found;
  let tre;
  if (L && L.item) {
    const t = L.item;
    tre = `<div class="tfind"><div class="tbig">${art('item', t.n)}</div><div><h3>${esc(t.n)}</h3>${stamp(t.r)}<p class="ab"><b>${esc(t.ab)}.</b> ${esc(t.txt)}</p>${L.dup ? '<p class="small">You already have one. A squirrel bought this one for 40 coins.</p>' : t.kind === 'quest' ? `<p class="small">Map pieces: ${S.mapPieces.length}/4.${S.mapPieces.length >= 4 ? ' The map is complete! Check your yard for an X.' : ''}</p>` : `<p class="small">${t.kind === 'wearable' || t.kind === 'charm' ? 'Equip it from the Journal or the Wardrobe.' : t.kind === 'food' ? 'Feed it from the Journal or the Feed tray.' : 'Find it in the Journal, Toys tab.'}</p>`}</div></div>`;
  } else if (L) tre = `<div class="tfind"><div class="tbig">${artReal('collectible', 'chest') || art('collectible', 'coin')}</div><div><h3>A pouch of coins</h3>${stamp(L.r)}<p class="ab">You own every ${RARITY[L.r]} treasure from this route, so it was coins: +${L.coins * BOOST.coins}.</p></div></div>`;
  else tre = `<div class="tfind"><div class="tbig" style="filter:grayscale(1) opacity(.5)">${artReal('collectible', 'chest') || art('collectible', 'dig')}</div><div><h3>The treasure stayed hidden</h3><p class="ab">${W.digsLeft > 0 && complete ? 'You walked past the right X without digging.' : 'It was under a different X.'} Watch the Nose-o-meter: dig when it says HOT.</p></div></div>`;
  const extra = W.extra.length ? `<p class="small">Also found on the path: ${W.extra.map((e) => esc(e.item.n) + (e.dup ? ' (sold, duplicate)' : '')).join(', ')}.</p>` : '';
  const junk = W.junk.length ? `<p class="small">Junk dug up (turned into coins): ${W.junk.map((k) => k === 'junk-sock' ? 'a sock' : 'a rock').join(', ')}.</p>` : '';
  const p = openModal(L ? `<span class="hl">Treasure found: ${esc(R.n)}</span>` : (complete ? `Walk complete: ${esc(R.n)}` : `Walk cut short: ${esc(R.n)}`), `${tre}${extra}${junk}
    <div class="results compact"><div class="res"><div class="v">+${coins}</div><div class="k">Paw Coins${penny > 1 ? ' (Penny +10%)' : ''}</div></div><div class="res"><div class="v">+${happy}</div><div class="k">Happiness</div></div><div class="res"><div class="v">+${bond}</div><div class="k">Bond points</div></div><div class="res"><div class="v">-${energy}</div><div class="k">Energy</div></div><div class="res"><div class="v">${cleanLoss + W.clean ? '-' + (cleanLoss + W.clean) : '0'}</div><div class="k">Cleanliness</div></div></div>`,
    { cls: 'celebrate', foot: `${L && L.item && !L.dup ? '<button class="btn" id="resJournal">Open Journal</button>' : ''}<button class="btn yes big" id="resOk">${L && L.item && !L.dup ? 'Add to Journal' : 'Back to ' + esc((PLACES[S.place] || PLACES.yard).n)}</button>`, onClose: () => go('yard') });
  $('#resOk', p).onclick = () => { SFX.boop(700); closeModal(); };
  const rj = $('#resJournal', p); if (rj) rj.onclick = () => { modalClose = null; closeModal(); go('yard'); setTimeout(() => openJournal('treasures'), 300); };
  SFX.fanfare();
}

