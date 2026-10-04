/* ======================= YARD ======================= */
const DX = 298, DY = 295, DW = 264, DH = 220; // dog box: feet at y=500, centre x=430
let dogKey = '', tempPose = null, tempUntil = 0, busy = false, pet = { start: 0, gain: 0, bonded: false, capped: false, dist: 0 };
function yardWorldSVG(extra = '') {
  return `<svg class="world" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMax slice">
    ${sceneG(S.place || 'yard', S.place === 'yard' ? { patch: gkOn() ? patchState() : 'empty' } : S.place === 'house' && hasBedArt() ? { bed: false } : {})}${S.place === 'yard' && !gkOn() ? '<g class="soon-tag" pointer-events="none" transform="translate(112 432) rotate(-6)"><rect x="-58" y="-17" width="116" height="30" rx="6" fill="#FFF3B8" stroke="#5B3D32" stroke-width="2"/><text y="6" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="22" fill="#5B3D32">coming soon</text></g>' : ''}${bedLayers().back}<g id="messG"></g><g id="snowmanG">${S.place === 'yard' ? snowmanSVG() : ''}</g>
    ${S.place === 'yard' ? `<g id="houseG" class="hot" tabindex="0" role="button" aria-label="Dog house: ${esc(S.house)}">${place(art('house', S.house), 620, 330, 240, 200)}</g>` : ''}
    <g id="bowlG" class="hot" tabindex="0" role="button" aria-label="Food bowl">${place(art('prop', 'bowl-empty'), 205, 462, 90, 90)}</g>
    <g id="pack">${packSVG()}</g><g id="dogPos"><g id="dogFx"><g id="dogArt"></g><rect id="dogHit" x="${DX + 30}" y="${DY + 40}" width="${DW - 60}" height="${DH - 40}" fill="transparent" pointer-events="all" class="hot" tabindex="0" role="button" aria-label="Pet the dog"/></g><g id="fluffFx" pointer-events="none"></g></g>${bedLayers().front}
    ${S.place === 'yard' && S.mapPieces.length >= 4 && !S.secretDug ? `<g id="secretX" class="hot" tabindex="0" role="button" aria-label="Secret dig: X marks the spot"><rect x="585" y="452" width="150" height="140" fill="transparent"/>${place(artReal('collectible', 'dig') || art('collectible', 'dig'), 615, 495, 90, 90)}<text x="660" y="488" text-anchor="middle" font-family="Caveat,cursive" font-weight="700" font-size="26" fill="#5B3D32">X marks the spot!</text></g>` : ''}
    <g id="zzz"></g>${extra}<g id="fx"></g></svg><div id="status"></div><div id="placeBtns"></div><button id="devBtn">dev</button>`;
}
function dogPoseNow() {
  if (tempPose && performance.now() < tempUntil) return tempPose;
  tempPose = null;
  if (S.sleeping) return 'sleep';
  if (IDLE.act && IDLE.act.pose && performance.now() < IDLE.act.until) return IDLE.act.pose;
  if (S.stats.clean < 25) return 'dirty';
  if (S.stats.hunger < 25 || S.stats.happy < 25 || S.stats.energy < 25) return 'sad';
  if ((outdoorsNow() || S.dog.key === 'chihuahua') && weatherNow() === 'snow' && !isWarm()) return 'cold';
  if (isHot() && S.place !== 'woods' && S.place !== 'house') return 'hot';
  if (glowing()) return 'happy';
  return 'idle';
}
const POSE_FB = { crouch: 'sit', shake: 'happy', cold: 'sad', hot: 'happy', dig: 'eat', squat: 'sit', leglift: 'sit' };
function dogArtSafe(key, o) { let sv = art('dog', key, o); if (o.pose && POSE_FB[o.pose] && !sv.includes('pa-pose-' + o.pose)) sv = art('dog', key, Object.assign({}, o, { pose: POSE_FB[o.pose] })); return sv; }
function renderDog(pose, facing = 'right', force) {
  const g = $('#dogArt'); if (!g) return;
  const k = pose + '|' + facing + '|' + JSON.stringify(S.outfit) + '|' + S.dog.key;
  if (k === dogKey && !force) return; dogKey = k;
  g.innerHTML = place(dogSVG(D(), { pose, outfit: dogOutfit(), facing }), DX, DY, DW, DH);
  const fx = $('#dogFx'); if (fx) { fx.classList.toggle('tk-shake', pose === 'shake'); fx.classList.toggle('tk-shiver', pose === 'cold'); }
  const bf = $('#bedFront'); if (bf) bf.style.display = pose === 'sleep' ? '' : 'none';
}
function setTemp(pose, ms) { tempPose = pose; tempUntil = performance.now() + ms; renderDog(pose); }
function dogTo(tx, ty = 0, scale = 1, secs = 0.9) {
  const p = $('#dogPos'); if (!p) return; camTo(430 * scale + tx, secs); p.style.transitionDuration = secs + 's';
  p.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
}
function bowlArt(food) {
  if (!food) return artReal('prop', 'bowl', {}) || art('prop', 'bowl-empty');
  const real = artReal('prop', 'bowl', { food }); if (real) return real;
  if (food === 'Fresh Water') return artReal('prop', 'water-bowl') || art('prop', 'bowl-empty');
  return `<svg viewBox="0 0 120 120">${place(art('prop', 'bowl-empty'), 0, 0, 120, 120)}${place(art('item', food), 32, 22, 56, 56)}</svg>`;
}
function setBowl(food) { const b = $('#bowlG'); if (b) { b.innerHTML = (isPhone() ? '<rect x="195" y="452" width="110" height="110" fill="transparent"/>' : '') + place(bowlArt(food), 205, 462, 90, 90); b.setAttribute('aria-label', food ? 'Food bowl with ' + food : 'Empty food bowl'); } }
function fxText(txt, x, y, color = '#F28FA5', size = 38) {
  const fx = $('#fx'); if (!fx) return;
  const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', x); t.setAttribute('y', y); t.setAttribute('font-size', size); t.setAttribute('fill', color); t.setAttribute('stroke', INKG); t.setAttribute('stroke-width', '1.4'); t.setAttribute('paint-order', 'stroke');
  t.setAttribute('class', 'heartfx'); t.setAttribute('text-anchor', 'middle'); t.textContent = txt; fx.appendChild(t); setTimeout(() => t.remove(), 1000);
}
function enterYard() {
  setChrome(true, true);
  view.innerHTML = yardWorldSVG(); dogKey = ''; busy = false;
  renderDog(dogPoseNow()); setBowl(S.bowl || null);
  camCx = 430; camApply(camCx);
  if (S.sleeping) { dogTo(417.5, S.place === 'house' ? 130 : 140, 0.75, 0); showZzz(true); }
  updateHUD(); bindDev(); bindMess(); bindPack(); greetWalker(); drawFluff(); setTimeout(() => yardReaction(false), 700);
  const bedG = $('#bedG'); if (bedG) { bedG.onclick = () => { popAct = 'care'; openCareTray(); }; bedG.onkeydown = (e) => { if (e.key === 'Enter') { popAct = 'care'; openCareTray(); } }; }
  const svg = $('svg.world', view), hit = $('#dogHit');
  // petting: rub (mouse hover-rub or touch drag) or tap
  let last = null, down = false, moved = 0;
  const tickFrom = (e) => { const w = toWorld(svg, e.clientX, e.clientY); petTick(w.x, w.y); };
  hit.addEventListener('pointerdown', (e) => { SFX.init(); down = true; moved = 0; last = { x: e.clientX, y: e.clientY }; try { hit.setPointerCapture(e.pointerId); } catch (er) { /* capture unsupported */ } });
  hit.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && !down) return;
    if (!last) { last = { x: e.clientX, y: e.clientY }; return; }
    const d = Math.hypot(e.clientX - last.x, e.clientY - last.y); last = { x: e.clientX, y: e.clientY }; moved += d; pet.dist += d;
    if (pet.dist > 70) { pet.dist = 0; tickFrom(e); }
  });
  hit.addEventListener('pointerup', (e) => { if (down && moved < 8) { tickFrom(e); tickFrom(e); } down = false; });
  hit.addEventListener('pointerleave', () => { if (!down) last = null; });
  hit.addEventListener('pointercancel', () => { down = false; last = null; });
  hit.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); petTick(560, 380); } });
  const bowl = $('#bowlG'); bowl.onclick = () => { popAct = 'feed'; openFeedTray(); }; bowl.onkeydown = (e) => { if (e.key === 'Enter') { popAct = 'feed'; openFeedTray(); } };
  if (S.place !== 'house' && S.place !== 'yard' && S.place !== 'market') setTimeout(() => placeAmbient(), 2500);
  const sx = $('#secretX'); if (sx) { sx.onclick = secretDig; sx.onkeydown = (e) => { if (e.key === 'Enter') secretDig(); }; }
  const house = $('#houseG'); if (house) { house.onclick = () => { popAct = 'care'; openCareTray(); }; house.onkeydown = (e) => { if (e.key === 'Enter') { popAct = 'care'; openCareTray(); } }; }
  placeButtons();
  if (S.place === 'market') hotify($('svg.world', view), '#sceneG [data-shop]', 'data-shop', (k) => openShop(k), (k) => 'Enter ' + (SHOP_NAME[k] || k));
  hotify($('svg.world', view), '#sceneG [data-hot]', 'data-hot', (k) => ({ garden: openGarden, kitchen: openKitchen, notice: squareNotice, 'cafe-menu': cafeMenu, 'vet-desk': vetCheck, 'salon-chair': salonGroom }[k] || (() => {}))(), (k) => 'Open the ' + k);
  // ambient jokes
  let next = performance.now() + 6000;
  const iv = setInterval(() => {
    if (busy || curling || TRN || !modal.hidden || cur.mode !== 'yard' || popOpen()) return;
    if (performance.now() > next) { next = performance.now() + RAND(14000, 24000); if (popOpen()) return; if (S.dogs.length > 1 && Math.random() < 0.5) packAmbient(); else if (!IDLE.act) dogJoke(); }
  }, 1000);
  onCleanup(() => clearInterval(iv));
  if (S.sleeping) sleepTray(); else dockIdle();
}
const WX_LINES = {
  shiba: { rain: 'Rain? On ME? I would like to speak to the manager of the sky.', coat: 'Behold. A dog who does not get wet. Bow.', snow: 'Cold. Unacceptable. A sweater, please. Now.', warm: 'Snow is beneath me. I will zoom across it anyway.', hot: 'Too hot to be this dramatic. I will try.', night: '*yawn* Even legends sleep.', dawn: 'Morning. You may bring breakfast.' },
  corgi: { rain: 'Wet butt alert! Wet butt alert!', coat: 'Raincoat on! Puddles are basically soup now!', snow: 'My legs are too short for this. Sweater? Snacks? Both?', warm: 'SNOW ZOOMIES! Low to the ground, maximum speed!', hot: 'Too hot. Is it ice-cream weather? It is ice-cream weather.', night: '*yawn* Dreaming about snacks in 3... 2...', dawn: 'GOOD MORNING! Is it breakfast? It is breakfast!' },
  golden: { rain: 'RAIN! I love rain! I am now 40% water!', coat: 'Splash splash splash! I love my coat! I love puddles!', snow: 'Brr! Snow is great but my toes are cold. Sweater?', warm: 'SNOW! Best day ever! Again!', hot: '*pant pant* Water? Water would be great!', night: '*yawn* Best day. Can tomorrow be best day too?', dawn: 'You are AWAKE! Best morning ever!' },
  dachs: { rain: 'Rain makes the dirt extra diggable. Also soggy.', coat: 'Fully covered. Every one of my 40 centimetres.', snow: 'My belly is touching the snow. All of it. Help.', warm: 'Snow tunnels! I am a submarine now!', hot: 'Too hot to dig. Digging a cool spot anyway.', night: '*yawn* The back half fell asleep first.', dawn: 'Morning! I dug up the sunrise. You are welcome.' },
  husky: { rain: 'AWOO. This is not snow. I demand snow.', coat: 'I look ridiculous and I am very dry. AWOO.', snow: 'Snow! But my fancy coat is wet. A sweater would be nice. AWOO.', warm: 'SNOW! THIS IS MY MOMENT! AWOOOOO!', hot: '*pant* I was built for snow, not this.', night: 'AWOO at the moon. Then nap. Then AWOO.', dawn: 'AWOO! The sun is up! Everyone wake up!' },
  mutt: { rain: 'I do not mind the rain if you are here.', coat: 'Thank you for keeping me dry. You are the best.', snow: 'Brr. Could I borrow something warm? Only if it is okay.', warm: 'Toasty and snowy! Can we play?', hot: 'It is warm. Can I sit in your shadow?', night: '*yawn* Goodnight. You are my favourite.', dawn: 'Good morning. I waited for you. Hi.' },
  chihuahua: { rain: 'Rain is a personal attack. I am shivering in protest.', coat: 'Coat on. Still shivering. It is my brand.', snow: 'I am FREEZING. I am also furious. Sweater. NOW.', warm: 'Sweater on. Now I fear nothing. Not even snow. Mostly.', hot: 'Finally, my temperature. I will sunbathe aggressively.', night: '*yawn* Security system entering sleep mode. Still watching.', dawn: 'GOOD MORNING. I barked at the sun. It came up anyway.' },
  pug: { rain: 'Rain. No. I will be indoors. snort.', coat: 'Raincoat on. I look like a tiny dry potato.', snow: 'Cold nose. Cold toes. Cold everything. Sweater?', warm: 'Toasty sweater. I could nap in the snow. Do not let me.', hot: '*snort pant snort* Flat faces do not do heat. Shade, please.', night: '*SNORE* (that was a yawn)', dawn: 'Morning? Already? Five more hours. snort.' },
  greyhound: { rain: 'Rain. I will lie on the sofa until it stops. Or forever.', coat: 'Coat on. My legs are still wet. There is a lot of leg.', snow: 'No fur. No fat. Just legs. Please, a sweater.', warm: 'Sweater on. Snow zoomies? One lap. Okay, three.', hot: 'Too hot to run. Perfect weather to lie flat.', night: '*yawn* Upside-down sleep time. Do not judge.', dawn: 'Morning. I have been awake for one minute. Nap soon.' },
  beagle: { rain: 'Rain makes every smell louder! Worms! Mud! Sandwich!', coat: 'Coat on. My nose is still out. That is the important part.', snow: 'Snow hides the smells. This is a tragedy. Also cold. Sweater?', warm: 'Warm and snowy. Let us find out what is under the snow. AROO!', hot: '*pant* Hot pavement smells like chips. Still too hot.', night: '*yawn* The night smells different. One more sniff. Then bed.', dawn: 'AROOOO! Morning! I smelled breakfast before you woke up!' }
};
/* v1.7: per-breed lines for feeding, potty, greetings and walks ({n} name, {He}/{he}/{him}/{his} pronouns) */
const EAT_LINES = { shiba: '{n} ate it slowly. {He} wants you to know who is in charge.', corgi: '{n} finished and checked the bowl for a sequel. {He} is still checking.', golden: '{n} ate it, then thanked you with {his} whole tail. And the bum.', dachs: '{n} ate it, then tried to bury the bowl. {He} is saving it for later.', husky: '{n} ate it and sang {his} review. AWOO.', mutt: '{n} ate it and looked at you like you hung the moon. {He} means it.', chihuahua: '{n} ate three bites, growled at the bowl, then finished {his} meal.', pug: '{n} inhaled it. {His} snorts say ten out of ten.', greyhound: '{n} ate it delicately with {his} very long face, then lay down.', beagle: '{n} finished in one second. {He} is now sniffing for crumbs in the next street.' };
const POTTY_LINES = { shiba: '{n} did {his} business and then pretended it never happened.', corgi: '{n} finished and looked at you. Snack for good potty? Snack?', golden: '{n} went potty and is SO proud. Tell everyone.', dachs: '{n} went, then tried to dig a hole for it. Thorough.', husky: '{n} went potty and announced it to the whole street. AWOO.', mutt: '{n} went and checked you saw. Good dog? Good dog.', chihuahua: '{n} picked the exact spot after inspecting nine others. Security reasons.', pug: '{n} went potty, snorted twice and sat down for a rest.', greyhound: '{n} went potty, then did one victory lap.', beagle: '{n} sniffed for two whole minutes first. Research is important.' };
const GREET_LINES = { shiba: 'Oh. You are back. I did not notice. (Tail: wagging.)', corgi: 'YOU ARE BACK! Did you bring snacks? You smell like snacks!', golden: 'You came back! Best day! Again!', dachs: 'You are home! I dug you a welcome hole.', husky: 'AWOO! Where were you! Tell me everything! AWOO!', mutt: 'You came back. I knew you would. Hi.', chihuahua: 'WHO GOES THERE. Oh. You. Welcome home. Still checking your ID.', pug: '*snort* You are back. Lap, please. Right now.', greyhound: '*soft roo* You are home. I will lean on you now.', beagle: 'AROOO! I smelled you coming from the corner! What did you eat?' };
const WALK_LINES = { shiba: '{n} walked like the path was built for {him}. It was not.', corgi: '{n} checked every bench for dropped snacks. Two found. Zero shared.', golden: '{n} said hello to every dog, person, and one lamp post.', dachs: '{n} wanted to dig at every single X. And several non-Xs.', husky: '{n} howled at three dogs, one bus, and the concept of walking.', mutt: '{n} kept looking back to check you were still there. You were.', chihuahua: '{n} barked at a dog fourteen times bigger. The dog apologised.', pug: '{n} walked the whole way. Mostly. The last bit was a carry.', greyhound: '{n} sprinted for six seconds and strolled for the rest. Perfect walk.', beagle: '{n} sniffed the whole route. Beagle nose: the Nose-o-meter reached 25% further.' };
const NOSE_MUL = { beagle: 1.25 };
const noseMul = (d = D()) => NOSE_MUL[d && d.key] || 1;
function breedLine(map, d) { const l = d && map[d.key]; if (!l) return ''; const p = PRd(d); return l.replace(/\{n\}/g, d.name).replace(/\{He\}/g, p.He).replace(/\{he\}/g, p.he).replace(/\{him\}/g, p.him).replace(/\{his\}/g, p.his).replace(/\{His\}/g, p.His); }
const reacted = new Set();
function wxLine(k) { return (WX_LINES[S.dog.key] || WX_LINES.mutt)[k]; }
function yardReaction(force) {
  if (cur.mode !== 'yard' || busy || S.sleeping) return;
  const w = outdoorsNow() ? weatherNow() : 'indoor', t = timePhase(), key = weatherPeriodKey() + '|' + w + '|' + t + '|' + S.place;
  if (reacted.has(key) && !force) return; reacted.add(key);
  const h = dogHeadWorld();
  if (w === 'rain') {
    if (hasRaincoat()) { addStat('happy', 5); setTemp('happy', 1600); SFX.splash(); say(wxLine('coat') + ' (+5 Happiness)', h.x, h.y); }
    else {
      addStat('clean', -4); say(wxLine('rain'), h.x, h.y);
      if (!hasRainHat()) setTimeout(() => { if (cur.mode === 'yard' && !busy) { setTemp('shake', 1500); SFX.shake(); fxText('splsh!', h.x, h.y - 30, '#86B3EA', 30); } }, 1300);
    }
  } else if (w === 'snow') {
    if (isWarm()) { setTemp('happy', 1900); const fx = $('#dogFx'); if (fx) { fx.classList.remove('tk-zoom'); void fx.getBBox(); fx.classList.add('tk-zoom'); setTimeout(() => fx.classList.remove('tk-zoom'), 1900); } SFX.snowCrunch(); say(wxLine('warm'), h.x, h.y); }
    else { renderDog('cold'); say(wxLine('snow'), h.x, h.y); }
  } else if (isHot() && S.place !== 'woods' && S.place !== 'house') { renderDog('hot'); say(wxLine('hot') + ' (Water is extra refreshing now.)', h.x, h.y); }
  else if (t === 'night') say(wxLine('night'), h.x, h.y);
  else if (t === 'dawn') { dailyCheck(); if (!S.daily.dawn) { S.daily.dawn = true; addStat('happy', 5); setTemp('happy', 1600); SFX.bark(BARK[S.dog.key]); say(wxLine('dawn') + ' (+5 Happiness)', h.x, h.y); } }
  updateHUD(); markDirty();
}
function secretDig() {
  if (busy || S.secretDug || S.mapPieces.length < 4) return;
  if (S.sleeping) { nope(`${NAME()} is asleep. Treasure can wait one nap.`); return; }
  busy = true; hideBubble(); dogTo(225, 30, 1, 0.9); renderDog('walk');
  setTimeout(() => { renderDog('dig'); SFX.crunch(); }, 950); setTimeout(SFX.crunch, 1500); setTimeout(SFX.crunch, 2000);
  setTimeout(() => {
    S.secretDug = true; S.title = 'Treasure Legend'; S.inv.food['Golden Bone'] = (S.inv.food['Golden Bone'] || 0) + 3;
    if (!S.found['Golden Bone']) S.found['Golden Bone'] = { day: day(), route: 'yard' };
    const c = addCoins(1000, { raw: true }); SFX.treasure(); setTimeout(SFX.fanfare, 400); audioCue('treasure'); markDirty();
    const sx = $('#secretX'); if (sx) sx.remove(); setHudDog(); hudDogKey = ''; setHudDog();
    const chest = artReal('collectible', 'chest') || artReal('icon', 'chest') || art('collectible', 'dig');
    const p = openModal('<span class="hl">The Grand Treasure Chest!</span>', `<div class="tfind"><div class="tbig">${chest}</div><div><p>The X was real. ${esc(NAME())} dug up the Grand Treasure Chest of Paw Haven.</p><ul class="unlocks"><li>+${c} Paw Coins</li><li>3 Golden Bones (in the Food tab)</li><li>New title: <b>Treasure Legend</b> (on your name tag)</li></ul><div class="jmap-art small-map">${tornMap()}</div></div></div>`, { cls: 'celebrate', foot: '<button class="btn yes big" id="sdOk">Legendary!</button>' });
    $('#sdOk', p).onclick = () => { SFX.boop(700); closeModal(); };
    busy = false; dogTo(0, 0, 1, 0.9); setTemp('happy', 2500);
  }, 2600);
}
function placeButtons() {
  const pb = $('#placeBtns'); if (!pb) return; const b = [];
  if (S.place === 'yard') b.push(gkOn() ? `<button class="btn ${gardenUnlocked() ? 'yes' : ''}" data-pb="garden">Garden${gardenUnlocked() ? '' : ' (Bond 2)'}</button>` : '<button class="btn soon" data-pb="garden" aria-disabled="true">Garden: coming soon</button>', '<button class="btn" data-pb="house">Go inside</button>');
  if (S.place === 'house') b.push(kOn() ? `<button class="btn ${kitchenUnlocked() ? 'yes' : ''}" data-pb="kitchen">Kitchen${kitchenUnlocked() ? '' : ' (Bond 3)'}</button>` : '<button class="btn soon" data-pb="kitchen" aria-disabled="true">Kitchen: coming soon</button>', '<button class="btn" data-pb="yard">Go outside</button>');
  if (S.place === 'market') Object.keys(SHOP_NAME).forEach((k) => b.push(`<button class="btn" data-sh="${k}">${SHOP_NAME[k]}</button>`));
  if (S.place === 'beach') { dailyCheck(); b.push(`<button class="btn yes" data-pb="dig" ${S.daily.beachDig ? 'aria-disabled="true"' : ''}>${S.daily.beachDig ? 'Dug today' : 'Dig in the sand'}</button>`); }
  const placeBtn = { square: ['notice', 'Town notice'], cafe: ['cafe', 'Café menu'], dogpark: ['social', 'Socialise'], vet: ['vet', 'Check-up'], salon: ['groom', 'Full groom'], hilltop: weatherNow() === 'sunny' ? ['kites', 'Watch kites'] : null }[S.place];
  if (placeBtn) b.push(`<button class="btn yes" data-pb="${placeBtn[0]}">${placeBtn[1]}</button>`);
  if (S.place !== 'yard' && S.place !== 'house') b.push('<button class="btn" data-pb="yard">Go home</button>');
  pb.innerHTML = b.join('');
  pb.querySelectorAll('[data-sh]').forEach((x) => { x.onclick = () => openShop(x.dataset.sh); });
  pb.querySelectorAll('[data-pb]').forEach((x) => { x.onclick = () => { const v = x.dataset.pb, f = { dig: beachDig, garden: openGarden, kitchen: openKitchen, notice: squareNotice, cafe: cafeMenu, social: socialise, vet: vetCheck, groom: salonGroom, kites: kiteWatch }[v]; if (f) f(); else travelTo(v); }; });
}
function placeAmbient() {
  if (cur.mode !== 'yard' || busy || S.sleeping || !modal.hidden) return;
  const h = dogHeadWorld();
  if (S.place === 'river' && Math.random() < 0.6) { say(PICK(DUCK_LINES), h.x, h.y); SFX.honk(); return; }
  if (S.place === 'dogpark' && Math.random() < 0.8) { const k = PICK(dogsList().filter((d) => d.key !== S.dog.key)).key; SFX.bark(BARK[k] || 1); toast(`A ${dogInfo(k).breed} zooms past: "${PICK(NPC_JOKES)}" (+2 Happiness)`, 'good'); addStat('happy', 2); alertBark(); return; }
  if (S.place === 'hilltop' && weatherNow() === 'sunny' && Math.random() < 0.6) { kiteWatch(); return; }
  if (S.place === 'pier' && Math.random() < 0.5) { say(PICK(['A seagull is staring at my snacks. I am staring back.', 'The sea is very big. I approve.', 'Boats! Floating houses for fish.']), h.x, h.y); return; }
  if (S.place === 'park' && Math.random() < 0.5) { const k = PICK(dogsList().filter((d) => d.key !== S.dog.key)).key; SFX.bark(BARK[k] || 1); toast(`A friendly ${dogInfo(k).breed} trots by: "${PICK(NPC_JOKES)}" (+2 Happiness)`, 'good'); addStat('happy', 2); alertBark(); return; }
  const l = (PLACE_LINES[S.dog.key] || PLACE_LINES.mutt)[S.place]; if (l) say(l, h.x, h.y);
}
function beachDig() {
  dailyCheck(); if (S.daily.beachDig) { nope('One beach dig a day. The sand needs to recover. (It does not.)'); return; }
  if (busy || S.sleeping) return; S.daily.beachDig = true; busy = true; hideBubble(); renderDog('dig'); SFX.crunch(); setTimeout(SFX.crunch, 400);
  setTimeout(() => {
    if (Math.random() < 0.55) { const c = addCoins(RINT(5, 20)); toast(`Dug up ${c} coins in the sand! Pirate dog.`, 'gold'); }
    else { const j = PICK(JUNK.concat([['junk-rock', 'A shell with a smaller shell inside. Shell-ception.']])); const c = addCoins(RINT(2, 5)); toast(`${j[1]} (+${c} coins)`, 'gold'); }
    addStat('happy', favAct('digging') ? 6 : 3); busy = false; renderDog(dogPoseNow(), 'right', true); placeButtons(); markDirty();
  }, 1300);
}
function travelTo(id) {
  clearCurl();
  const P = PLACES[id]; if (!P || busy) return;
  if (topBond() < P.bond) { nope(`Nope. ${P.n} opens at Bond ${P.bond}. ${NAME()} is not emotionally ready.`); return; }
  if (S.sleeping) { nope(`${NAME()} is asleep. Wake up first (Care menu).`); return; }
  if (id === S.place && cur.mode === 'yard') return;
  if (id === S.place) { go('yard'); return; }
  busy = true; hideBubble(); SFX.whoosh();
  const card = document.createElement('div'); card.className = 'onway';
  card.innerHTML = `<div class="onway-card"><span class="onway-dog">${S.dogs.map((d) => dogSVG(d, { pose: 'walk', outfit: outfitOf(d) })).join('')}</span><b>On the way to ${esc(P.n)}...</b><span class="small">${S.dogs.length > 1 ? 'The whole pack trots along. -2 Energy each.' : esc(NAME()) + ' trots happily. -2 Energy.'}</span></div>`;
  stage.appendChild(card);
  setTimeout(() => {
    card.remove(); busy = false;
    S.place = id; S.dogs.forEach((d) => { d.stats.energy = clamp(d.stats.energy - 2, 0, 100); }); dailyCheck(); S.daily.visited = S.daily.visited || [];
    const first = !S.daily.visited.includes(id); if (first) { S.daily.visited.push(id); addStat('happy', 5); }
    markDirty(); go(id === 'market' ? 'market' : 'yard');
    let msg = `${NAME()} arrived at ${P.n}.${first ? ' First visit today: +5 Happiness.' : ''}`;
    if (id === 'river' && weatherNow() === 'rain' && !hasRaincoat() && Math.random() < 0.6) { addStat('clean', -3); msg += ' Splashed through a puddle on the way (-3 Cleanliness).'; }
    toast(msg, 'good');
  }, 1200);
}
function dogHeadWorld() { const p = $('#dogPos'); let tx = 0, ty = 0, sc = 1; const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*scale\(([\d.]+)\)/.exec(p ? p.style.transform : ''); if (m) { tx = +m[1]; ty = +m[2]; sc = +m[3]; } return { x: (DX + 175) * sc + tx, y: (DY + 30) * sc + ty }; }
function dogJoke(text) {
  const n = NAME(); let line = text;
  if (!line) {
    const low = [];
    if (S.stats.hunger < 30) low.push(`${n} would like to inform you that ${PR().he} is hungry. Loudly.`);
    if (S.stats.energy < 30) low.push(`${n} is running on 3% battery.`);
    if (S.stats.clean < 30) low.push(`${n} smells like an adventure. A bad one.`);
    if (S.stats.happy < 30) low.push(`${n} is doing the big sad eyes. At you.`);
    line = low.length && Math.random() < 0.6 ? PICK(low) : PICK(JOKES[S.dog.key] || JOKES.mutt);
  }
  if (!text && isNight() && Math.random() < 0.4) line = PICK(['*big yawn*', wxLine('night'), 'Is it bedtime? It feels like bedtime.']);
  if (!text && weatherNow() === 'rain' && !hasRaincoat() && Math.random() < 0.3) line = wxLine('rain') + ' A nap in the house sounds good.';
  if (S.sleeping) line = PICK(['zzz... squirrel... zzz', 'zzz (dreaming of a bigger box)', 'mrrf. zzz.']);
  const h = dogHeadWorld(); say(line, h.x, h.y);
  if (!S.sleeping && Math.random() < 0.5) S.dog.key === 'husky' && Math.random() < 0.4 ? SFX.howl() : SFX.bark(BARK[S.dog.key]);
}
function petTick(wx, wy) {
  if (busy) return;
  if (S.sleeping) { barkDog(D(), 'huff', { player: true, volume: 0.6 }); if (performance.now() - (pet.shh || 0) > 2500) { pet.shh = performance.now(); toast(`Shh. ${NAME()} is asleep. Wake up from the Care menu.`); } return; }
  const now = performance.now();
  if (now - pet.start > 120000) pet = { start: now, gain: 0, bonded: false, capped: false, dist: 0 };
  let g = 1.5 * (favAct('petting') ? 1.5 : 1);
  if (pet.gain >= 20) { g *= 0.25; if (!pet.capped) { pet.capped = true; toast(`${NAME()} is 100% petted. More petting is now a luxury.`); } }
  pet.gain += g; addStat('happy', g);
  if (S.place === 'woods' && !pet.woods) { pet.woods = true; addStat('happy', 2); }
  if (S.place === 'hilltop' && !pet.hill) { pet.hill = true; addStat('happy', 3); toast('Hilltop breeze petting: +3 Happiness. The view helps.', 'good'); }
  if (outdoorsNow() && weatherNow() === 'rain' && !hasRaincoat() && !pet.wet) { pet.wet = true; toast('Wet dog smell intensifies.'); }
  setTemp('pet', 900); fxText('♥', wx + RAND(-20, 20), wy - 10);
  Math.random() < 0.7 ? SFX.squeak() : SFX.boop(RAND(500, 800));
  if (!pet.bonded && pet.gain >= 10) { pet.bonded = true; const n = addBond(3); const st = S.outfit.charm === 'Sparkle Stone'; if (st) addStat('happy', 5); toast(`+${n} Bond.${st ? ' The Sparkle Stone hums: +5 Happiness.' : ''} ${NAME()} pretends ${PR().he} did not enjoy that.`, 'good'); dailyCare('pet'); }
  updateHUD();
}
function showZzz(on) { const z = $('#zzz'); if (z) z.innerHTML = on ? place(art('prop', 'zzz'), 760, 280, 90, 90) : ''; }
function dockIdle() {
  dailyCheck();
  const L = S.bond.level, need = L >= 10 ? 0 : BOND_TH[L] - S.bond.pts;
  const chk = (k, label) => `<li>${S.daily[k] ? '[x]' : '[ ]'} ${label}</li>`;
  dock.innerHTML = `<div class="tray dock-idle"><div class="tray-h"><h3>${esc(NAME())} the ${esc(dogInfo(S.dog.key).breed)}</h3></div>
    <p style="margin:0">${esc(moodLine())}</p>
    <p style="margin:0"><b>Today's care bonus</b> (+${10 * BOOST.coins} coins each):</p>
    <ul style="margin:0;padding-left:4px;list-style:none;line-height:1.4">${chk('feed', 'First meal')}${chk('pet', 'First good petting session')}${chk('play', 'First play or walk')}</ul>
    <p style="margin:0">${L >= 10 ? 'Bond 10: best friends. Maximum love achieved.' : `Next Bond level in <b>${need}</b> points.`}</p>
    <p class="small" style="margin:0">Tip: ${esc(PICK([`rub ${NAME()} to pet ${PR().him}.`, 'tap Feed, then tap a food.', 'walks earn the most coins.', 'better houses mean faster naps.', 'Space pets the dog. Gently.', 'the Map has walk routes. Some are locked.']))}</p></div>`;
}
function moodLine() {
  const n = NAME(), s = S.stats;
  if (S.sleeping) return `${n} is asleep in the ${S.house}. Snoring at a medium volume.`;
  if (s.clean < 25) return `${n} is filthy. Like, artistically filthy. Bath time.`;
  if (s.hunger < 25) return `${n} is staring at the bowl. And then at you. And then at the bowl.`;
  if (s.energy < 25) return `${n} is very sleepy. A nap in the dog house would help.`;
  if (s.happy < 25) return `${n} is a bit glum. Pets, play or a walk would fix it.`;
  if (glowing()) return `${n} is GLOWING. All meters above 80: +20% Bond points.`;
  return `${n} is doing fine. Suspiciously fine.`;
}
function closeTray() { SFX.click(); if (cur.mode === 'yard') { S.sleeping ? sleepTray() : dockIdle(); } else dock.innerHTML = ''; }
function trayHTML(title, body) { return `<div class="tray"><div class="tray-h"><h3>${title}</h3><button class="xbtn" id="trayX" aria-label="Close">x</button></div><div class="tray-body">${body}</div></div>`; }
function setTray(title, body, opt = {}) { if (!opt.mini && !modal.hidden) closeModal(); dock.innerHTML = trayHTML(title, body).replace('class="tray"', `class="tray${opt.mini ? ' mini' : ''}"`); $('#trayX').onclick = closeTray; if (!opt.mini) sheetSwipe($('#dock > .tray'), closeTray); }

/* ---------------- FEED ---------------- */
function openFeedTray() {
  if (cur.mode !== 'yard') go('yard');
  if (D().key === 'corgi') barkDog(D(), 'yip', { player: true }); else if (Math.random() < 0.5) barkDog(D(), 'yip', {});
  const home = atHome(), items = FOOD_ALL.filter((f) => f.n === 'Fresh Water' || (S.inv.food[f.n] || 0) > 0);
  const cards = items.map((f) => {
    const cnt = f.n === 'Fresh Water' ? '' : `<span class="cnt">${S.inv.food[f.n]}</span>`;
    const wait = f.n === 'Fresh Water' && S.gameMin - S.waterAt < 120, off = !home && isMeal(f.n);
    return `<button class="card ${off ? 'off meal' : ''}" data-food="${esc(f.n)}" ${wait || off ? 'aria-disabled="true"' : ''} aria-label="Feed ${esc(f.n)}${off ? ' (meals are served at home)' : ''}">${cnt}<span class="art">${art('item', f.n)}</span><b>${esc(f.n)}</b><span class="small">${off ? 'at home' : wait ? 'refilling...' : isFavFood(f.n) ? 'favourite!' : SNACKS.includes(f.n) ? 'snack' : ''}</span></button>`;
  }).join('');
  const dishes = kOn() ? dishRowHTML(!home) : '';
  setTray(home ? 'Feed: tap a food' : `Feed: snacks and water at ${esc(PLACES[S.place] ? PLACES[S.place].n : 'this place')}`, `<div class="row">${cards}${dishes}</div>${items.length <= 1 && !dishes ? '<p class="small" style="margin:0">Pantry is empty. Kibble Corner on Market Street sells food.</p>' : ''}${home && S.dogs.length > 1 ? `<div class="awaynote"><p class="small">${feedAllFood() ? `One portion of <b>${esc(feedAllFood().n)}</b> for every dog (you have ${S.inv.food[feedAllFood().n]}).` : 'No meals left for Feed all.'}</p><button class="btn go" id="feedAll" ${feedAllFood() ? '' : 'aria-disabled="true"'}>Feed all (${S.dogs.length} dogs)</button></div>` : ''}${home ? '' : `<div class="awaynote"><p class="small">Meals are served at home. Out here ${esc(NAME())} eats snacks from your hand.</p><button class="btn go" id="feedHome">Go home</button></div>`}`);
  dock.querySelectorAll('[data-food]').forEach((c) => { c.onclick = () => { SFX.init(); feed(c.dataset.food); }; });
  const fh = $('#feedHome'); if (fh) fh.onclick = () => { closeTray(); travelTo('yard'); };
  const fa = $('#feedAll'); if (fa) fa.onclick = () => feedAll();
  dock.querySelectorAll('[data-dish]').forEach((b) => { b.onclick = () => { const [id, st] = b.dataset.dish.split('|'); eatDish(id, +st); }; });
}
function dragFeed(card) {
  let start = null, ghost = null;
  card.addEventListener('pointerdown', (e) => { SFX.init(); start = { x: e.clientX, y: e.clientY }; try { card.setPointerCapture(e.pointerId); } catch (er) { /* no capture */ } });
  card.addEventListener('pointermove', (e) => {
    if (!start) return;
    if (!ghost && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 8) { ghost = document.createElement('div'); ghost.className = 'ghost'; ghost.innerHTML = art('item', card.dataset.food); document.body.appendChild(ghost); }
    if (ghost) { ghost.style.left = e.clientX + 'px'; ghost.style.top = e.clientY + 'px'; }
  });
  const end = (e, cancel) => {
    if (!start) return; start = null;
    if (ghost) { ghost.remove(); ghost = null; if (cancel) return; const b = $('#bowlG'); const r = b && b.getBoundingClientRect(); if (r && e.clientX > r.left - 30 && e.clientX < r.right + 30 && e.clientY > r.top - 30 && e.clientY < r.bottom + 30) feed(card.dataset.food); else toast('Missed the bowl. The grass says thanks.'); }
    else if (!cancel) feed(card.dataset.food);
  };
  card.addEventListener('pointerup', (e) => end(e, false)); card.addEventListener('pointercancel', (e) => end(e, true));
  card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); feed(card.dataset.food); } });
}
function feed(name) {
  clearCurl();
  const f = FOOD_ALL.find((x) => x.n === name); if (!f || busy) return;
  const n = NAME();
  if (S.sleeping) { nope(`${n} is asleep. Wake ${n} from the Care menu first.`); return; }
  if (!atHome() && isMeal(name)) { nope('Meals are served at home. Snacks and water are fine out here.'); return; }
  if (S.place === 'pier' && name !== 'Fresh Water' && Math.random() < 0.2) { popDown(); SFX.honk(); toast(`A seagull took the ${name}! Rude. (Snack refunded: Pip has a deal with the gulls.)`, 'bad'); return; }
  if (name === 'Fresh Water') {
    if (S.gameMin - S.waterAt < 120) { nope(`The water bowl is refilling. Water takes time. That's science.`); return; }
    S.waterAt = S.gameMin;
  } else {
    if ((S.inv.food[name] || 0) <= 0) { nope('You have none of that. Kibble Corner has some.'); return; }
    if (f.hunger > 0 && S.stats.hunger > 90) { nope(['corgi', 'pug', 'beagle'].includes(S.dog.key) ? `${n} is... full? Call a scientist. (Food not used.)` : `${n} is full. ${PR().He} has never said that before. (Food not used.)`); setTemp('happy', 1200); return; }
    if (name === 'Pupcake') { dailyCheck(); if (S.daily.pupcake) { nope('One Pupcake per day. Doctor\'s orders. The doctor is a duck.'); return; } S.daily.pupcake = true; }
    S.inv.food[name]--; if (S.inv.food[name] <= 0) delete S.inv.food[name];
  }
  busy = true; hideBubble(); markDirty(); popDown(); clearCurl(); if (D().key === 'corgi' && name !== 'Fresh Water') barkDog(D(), 'yip', {});
  const hand = !atHome() && name !== 'Fresh Water';
  if (hand) { renderDog('happy', 'right', true); setTimeout(() => { renderDog('eat', 'right', true); SFX.crunch(); }, 400); }
  else { S.bowl = name; setBowl(name); dogTo(-125, 0, 1, 0.8); renderDog('walk', 'left'); setTimeout(() => { renderDog('eat', 'left'); name === 'Fresh Water' ? SFX.slurp() : SFX.crunch(); }, 850); }
  setTimeout(() => { if (name !== 'Fresh Water') SFX.crunch(); }, 1500);
  setTimeout(() => {
    S.bowl = null; setBowl(null); pottyAfter(name === 'Fresh Water' ? 'water' : isMeal(name) ? 'meal' : 'snack');
    let happy = f.happy || 0;
    if (isFavFood(name)) happy = Math.round(happy * 1.5) + (happy ? 0 : 5);
    if (S.dog.key === 'corgi' && name !== 'Fresh Water') happy += 5;
    if (name === 'Pupcake' && S.outfit.head === 'Party Hat') happy = Math.round(happy * 1.5);
    const feeder = owns('toys', 'Puzzle Feeder') && name !== 'Fresh Water';
    if (feeder) happy += 10;
    if (S.place === 'river' && name !== 'Fresh Water') happy += 5;
    let extraMsg = '';
    if (name === 'Fresh Water' && isHot()) { happy += 5; addStat('energy', 10); extraMsg += ' So refreshing on a hot day! Extra Energy.'; }
    if (name !== 'Fresh Water' && timePhase() === 'dawn') { dailyCheck(); if (!S.daily.breakfast) { S.daily.breakfast = true; happy += 5; addBond(3); extraMsg += ' Breakfast bonus!'; } }
    addStat('hunger', f.hunger || 0); addStat('happy', happy); addStat('energy', f.energy || 0); addStat('clean', f.clean || 0);
    let bp = name === 'Fresh Water' ? 0 : 2 + (f.bond || 0); if (feeder) bp *= 2;
    if (name === 'Pupcake') S.pupUntil = S.gameMin + 60;
    if (f.golden) { S.glowUntil = S.gameMin + 1440; addStat('happy', 80 - Math.min(80, S.stats.happy)); bp = 20; }
    const got = bp ? addBond(bp) : 0;
    const secs = (Math.random() * 0.9 + 0.2).toFixed(1);
    const eatL = breedLine(EAT_LINES, D());
    const msg = name === 'Fresh Water' ? `${n} drank it. Most of it went on the floor.` : eatL && Math.random() < 0.5 ? eatL : PICK([`${n} ate it in ${secs} seconds. ${PR().His} tail approves.`, `${n} inhaled that. ${PR().He} thinks chewing is for quitters.`, `Gone. ${n} is now looking at the bowl for more.`]);
    toast(`${msg}${isFavFood(name) ? ' Favourite food!' : ''}${got ? ` +${got} Bond.` : ''}${name === 'Pupcake' ? ' Double Bond for 1 game hour!' : ''}${f.golden ? ' GLOWING for a whole game day!' : ''}${S.place === 'river' && name !== 'Fresh Water' ? ' Riverside picnic: +5 Happiness.' : ''}${extraMsg}`, 'good');
    if (name !== 'Fresh Water') dailyCare('feed');
    setTemp('happy', 1600); dogTo(0, 0, 1, 0.8); updateHUD();
    setTimeout(() => { busy = false; renderDog(dogPoseNow()); }, 900);
  }, 2300);
}

/* ---------------- PLAY ---------------- */
function openPlayTray() {
  if (cur.mode !== 'yard') go('yard');
  const fts = FETCH_TOYS.filter((t) => owns('toys', t)), sub = { 'Tennis Ball': 'Tennis Ball', Frisbee: 'Frisbee: 3 coins', 'Driftwood Stick': 'Stick: +1 coin', 'Glow Ball': 'Glow Ball: easy' };
  const b = fts.map((t) => `<button class="card" data-play="fetch:${esc(t)}"><span class="art">${art('item', t)}</span><b>Fetch</b><span class="small">${sub[t]} (challenge)</span></button>`);
  toysPlayable().forEach((t) => b.push(`<button class="card" data-play="toy:${esc(t)}"><span class="art">${art('item', t)}</span><b>Play</b><span class="small">${esc(t)}</span></button>`));
  b.push(`<button class="card" data-play="tricks"><span class="art">${ICON('star')}</span><b>Tricks</b><span class="small">${learnedCount()} learned</span></button>`);
  if (owns('toys', 'Squeaky Duck')) b.push(`<button class="card" data-play="duck"><span class="art">${art('item', 'Squeaky Duck')}</span><b>Squeak</b><span class="small">+10 Happiness</span></button>`);
  if (owns('toys', 'Rope Tug')) b.push(`<button class="card" data-play="tug"><span class="art">${art('item', 'Rope Tug')}</span><b>Tug</b><span class="small">+15 Happy, -10 Energy</span></button>`);
  if (!fts.length) b.push('<p class="small">No fetch toy. Kibble Corner sells balls.</p>');
  setTray('Play', `<div class="row">${b.join('')}</div>`);
  dock.querySelectorAll('[data-play]').forEach((el) => { el.onclick = () => playPick(el.dataset.play); });
}
function playPick(p) {
  SFX.click();
  if (S.sleeping) { nope(`${NAME()} is asleep. Even fun has to wait.`); return; }
  if (p.startsWith('toy:')) { if (S.stats.energy < 5) { nope(`${NAME()} is too tired to play. A nap would help.`); return; } go('toy', p.slice(4)); return; }
  if (p.startsWith('fetch:')) { if (S.stats.energy < 10) { nope(`${NAME()} is too tired to fetch. A nap would help.`); return; } go('fetch', p.slice(6)); return; }
  if (p === 'tricks') { openTraining(); return; }
  if (busy) return;
  popDown(); clearCurl();
  const toy = p === 'duck' ? 'Squeaky Duck' : 'Rope Tug';
  const now = S.gameMin, key = 'toyAt_' + toy; const full = !S[key] || now - S[key] >= 10;
  const k = full ? 1 : 0.25; S[key] = now;
  let happy = (p === 'duck' ? 10 : 15) * k * (S.dog.favToy === toy ? 1.5 : 1) * (S.place === 'park' ? 1.2 : 1);
  busy = true;
  if (p === 'duck') { [0, 250, 500].forEach((t) => setTimeout(SFX.squeak, t)); setTemp('happy', 1300); }
  else { $('#dogFx').classList.add('tk-tug'); renderDog('happy'); SFX.whoosh(); setTimeout(() => barkDog(D(), 'growl-play', { player: true }), 600); }
  setTimeout(() => {
    $('#dogFx').classList.remove('tk-tug'); addStat('happy', happy);
    let msg = p === 'duck' ? `SQUEAK. ${NAME()} is delighted. Your ears are not.` : `${NAME()} won the tug-of-war. As always.`;
    if (p === 'tug') { addStat('energy', -10 * k); msg += ` +${addBond(5 * k)} Bond.`; }
    if (S.dog.favToy === toy) msg += ' Favourite toy!'; if (!full) msg += ' (Less exciting the second time. Wait 10 game minutes.)';
    toast(msg, 'good'); dailyCare('play'); busy = false; renderDog(dogPoseNow(), 'right', true); updateHUD();
  }, 1300);
}
const TNEED = () => (owns('toys', 'Rubber Chicken') ? 2 : 3);
const learnedCount = () => TRICKS.filter((t) => trickSt(t.n).p >= 1).length;
function openTricks() {
  const btns = TRICKS.map((t) => {
    const lock = S.bond.level < t.bond, prog = S.tricks[t.n] || 0, name = t.n === 'Signature' ? sigOf(S.dog.key).n : t.n;
    return `<button class="btn" data-trick="${t.n}" ${lock ? 'aria-disabled="true"' : ''}>${esc(name)}<small>${lock ? 'Bond ' + t.bond : prog >= TNEED() ? 'learned' : `teach ${prog}/${TNEED()}`}</small></button>`;
  }).join('');
  setTray(`Tricks: tap ${TNEED()} times to teach, then show off${owns('toys', 'Rubber Chicken') ? ' (Rubber Chicken helps)' : ''}`, `<div class="trickgrid">${btns}</div>`, { mini: true });
  dock.querySelectorAll('[data-trick]').forEach((b) => { b.onclick = () => doTrick(b.dataset.trick); });
}
let trickLog = [];
function doTrick(n) {
  const t = TRICKS.find((x) => x.n === n); if (!t || busy) return;
  if (S.sleeping) { nope(`${NAME()} is asleep. Sleep is the only trick right now.`); return; }
  if (S.bond.level < t.bond) { nope(`Nope. ${t.n === 'Signature' ? 'The signature trick' : t.n} unlocks at Bond ${t.bond}. ${NAME()} is not emotionally ready.`); return; }
  const sig = t.n === 'Signature' ? sigOf(S.dog.key) : null, fx = sig ? sig.fx : t.fx, pose = sig ? sig.pose : t.pose;
  const need = TNEED(), prog = S.tricks[n] || 0, learning = prog < need;
  if (owns('toys', 'Rubber Chicken')) setTimeout(SFX.honk, 250);
  busy = true; hideBubble();
  const el = $('#dogFx'); renderDog(pose); if (fx.startsWith('tk-')) { el.classList.remove(fx); void el.getBBox(); el.classList.add(fx); }
  if (sig && sig.snd) barkDog(D(), sig.snd, { player: true }); else if (fx === 'speak' || (sig && S.dog.key === 'husky')) S.dog.key === 'husky' ? SFX.howl() : SFX.bark(BARK[S.dog.key]); else SFX.boop(660);
  const h = dogHeadWorld();
  if (fx === 'speak') say(S.dog.key === 'husky' ? 'AWOOOOO!' : PICK(['BORK.', 'Woof. (Yes, that was the trick.)', 'ARF!']), h.x, h.y, 2000);
  if (sig) say(sig.say, h.x, h.y, 2600);
  setTimeout(() => {
    el.classList.remove(fx);
    if (learning) {
      S.tricks[n] = prog + 1;
      if (prog + 1 >= need) { SFX.fanfare(); toast(`${NAME()} learned ${sig ? sig.n : n}! +${addBond(4)} Bond.`, 'gold'); }
      else toast(`Practice ${prog + 1}/${need}: ${PICK(['close enough!', 'that was... something.', 'getting there!', 'good effort, wrong trick.'])}`);
    } else {
      const now = performance.now(); trickLog = trickLog.filter((x) => now - x < 120000); trickLog.push(now);
      const k = trickLog.length > 6 ? 0.25 : 1;
      const hp = 4 * k * (favAct('tricks') ? 1.5 : 1); addStat('happy', hp);
      toast(`${PICK(['Nailed it.', 'Flawless.', 'The crowd (you) goes wild.', 'Ten out of ten.'])} +${Math.round(hp)} Happiness, +${addBond(4 * k)} Bond.`, 'good');
      dailyCare('play');
    }
    busy = false; renderDog(dogPoseNow(), 'right', true); updateHUD(); markDirty();
    if (dock.querySelector('[data-trick]')) openTricks();
  }, fx === 'tk-zoom' || fx === 'tk-tornado' ? 1900 : fx === 'tk-lap' ? 2300 : 1600);
}

/* ---------------- CARE: bath, sleep, houses ---------------- */
function openCareTray() {
  if (cur.mode !== 'yard') go('yard');
  if (S.sleeping) { sleepTray(); return; }
  const home = atHome(), bedArt = artReal('item', S.bed);
  setTray('Care', `${home ? '' : `<p style="margin:0 0 6px">Bath and naps happen at home. ${esc(NAME())} refuses to nap on a ${S.place === 'beach' ? 'beach towel. Too sandy' : 'stranger\'s bench'}.</p>`}<div class="row">
    <button class="card ${home ? '' : 'off'}" data-care="bath" ${home ? '' : 'aria-disabled="true"'}><span class="art">${ICON('bath')}</span><b>Bath</b><span class="small">Clean ${Math.round(S.stats.clean)}</span></button>
    <button class="card ${home ? '' : 'off'}" data-care="sleep" ${home ? '' : 'aria-disabled="true"'}><span class="art">${ICON('sleep')}</span><b>Nap</b><span class="small">${S.place === 'house' ? 'on the ' + esc(S.bed) : 'Energy ' + Math.round(S.stats.energy)}</span></button>
    <button class="card" data-care="bed"><span class="art">${bedArt || ICON('sleep')}</span><b>Bed</b><span class="small">${esc(S.bed)}</span></button>
    <button class="card" data-care="house"><span class="art">${ICON('house')}</span><b>Houses</b><span class="small">${S.inv.houses.length} owned</span></button>
    ${home ? '' : `<button class="card" data-care="home"><span class="art">${ICON('house')}</span><b>Go home</b><span class="small">to the yard</span></button>`}</div>`);
  dock.querySelectorAll('[data-care]').forEach((b) => { b.onclick = () => { SFX.click(); const c = b.dataset.care; if (!home && (c === 'bath' || c === 'sleep')) { nope(`Bath and naps happen at home. ${NAME()} insists.`); return; } if (c === 'bath') go('bath'); if (c === 'sleep') startSleep(); if (c === 'house') openHouses(); if (c === 'bed') openBeds(); if (c === 'home') { closeTray(); travelTo('yard'); } }; });
}
function napRate() { const h = houseInfo(); const c = S.place === 'house' ? 0.25 + bedInfo().bonus : h.comfort * (S.dog.key === 'husky' && h.n === 'Snow Igloo' ? 2 : 1); return 20 * BOOST.nap * (1 + c) * (owns('toys', 'Plush Bone') ? 1.1 : 1) * (isNight() ? 1.4 : 1) * (weatherNow() === 'rain' ? 1.2 : 1); }
function startSleep() {
  if (busy) return; if (S.stats.energy >= 99) { nope(`${NAME()} is not tired. ${PR().He} is vibrating.`); return; }
  clearCurl(); busy = false; S.sleeping = true; markDirty(); hideBubble(); popDown(); dogTo(417.5, S.place === 'house' ? 130 : 140, 0.75, 1); renderDog('walk');
  setTimeout(() => { if (S.sleeping) { renderDog('sleep'); showZzz(true); } }, 1000);
  sleepTray(); toast(S.place === 'house' ? `${NAME()} curls up on the ${S.bed}. Indoor naps: +25%${bedInfo().bonus ? `, bed +${Math.round(bedInfo().bonus * 100)}%` : ''}.` : weatherNow() === 'rain' ? `${NAME()} curls up in the ${S.house}. Rain on the roof: the best nap sound (+20% nap).` : isNight() ? `${NAME()} climbs into the ${S.house}. Night naps restore more (+40%).` : `${NAME()} climbs into the ${S.house}. Goodnight.`); if (ROACH[D().key]) setTimeout(() => toast(`${NAME()} flips upside down, legs in the air. Greyhounds call that roaching.`, ''), 900); audioPlace();
}
function sleepTray() {
  const h = houseInfo(), b = bedInfo(), indoor = S.place === 'house';
  setTray(`${esc(NAME())} is napping`, `<p style="margin:0">Energy refills at <b>${Math.round(napRate())}</b> per game hour${indoor ? ` (${esc(b.n)}: +25% indoors${b.bonus ? `, +${Math.round(b.bonus * 100)}% bed` : ''})` : h.comfort ? ` (${esc(h.n)}: +${Math.round(h.comfort * 100)}% comfort)` : ' (Cardboard Box: no comfort bonus, lots of character)'}${owns('toys', 'Plush Bone') ? ', +10% Plush Bone' : ''}${isNight() ? ', +40% night' : ''}${weatherNow() === 'rain' ? ', +20% rain on the roof' : ''}.</p>
    <div class="walkctl" style="margin-top:6px"><div class="prog" aria-label="Energy"><i id="napBar" style="width:${S.stats.energy}%"></i></div><button class="btn yes" id="wakeBtn">Wake up</button></div>`, { mini: true });
  $('#trayX').remove();
  $('#wakeBtn').onclick = () => wake();
}
function wake(auto) {
  focusSet(100); S.sleeping = false; setTimeout(() => audioPlace(), 0); markDirty(); showZzz(false); dogTo(0, 0, 1, 0.9); setTemp('happy', 1500);
  toast(auto ? 'Fully charged. Zoomies imminent.' : `${NAME()} wakes up, stretches, and decides ${PR().he} wants something.`, 'good');
  if (cur.mode === 'yard') dockIdle();
}
function openHouses() {
  const cards = HOUSES.filter((h) => owns('houses', h.n)).map((h) => `<div class="sitem"><span class="art house">${art('house', h.n)}</span><b>${esc(h.n)}</b><span class="desc">Nap Energy +${Math.round(h.comfort * 100)}%</span>${h.n === S.house ? '<span class="chip own">Living here</span>' : `<button class="btn yes" data-house="${esc(h.n)}">Move in</button>`}</div>`).join('');
  const p = openModal('Your dog houses', `<p class="small">Switching is free. Buy more at Barkitecture on Market Street.</p><div class="shopgrid">${cards}</div>`);
  p.querySelectorAll('[data-house]').forEach((b) => { b.onclick = () => { switchHouse(b.dataset.house); closeModal(); }; });
}
function switchHouse(n) {
  if ((HOUSE_CAP[n] || 1) < S.dogs.length) { nope(`The ${n} only fits ${HOUSE_CAP[n] || 1}. You have ${S.dogs.length} dogs, and nobody is getting left out.`); return; }
  S.house = n; markDirty(); SFX.thud(); setTimeout(() => SFX.boop(700), 150);
  toast(`${NAME()} moved into the ${n}. ${PICK(['Sniffed every corner.', 'Approves. Mostly.', 'Already shed on it.'])}`, 'good');
  if (cur.mode === 'yard') { const g = $('#houseG'); if (g) { g.innerHTML = place(art('house', n), 620, 330, 240, 200); g.setAttribute('aria-label', 'Dog house: ' + n); } if (S.sleeping) sleepTray(); }
}

