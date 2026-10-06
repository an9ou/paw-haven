/* ======================= TIME LOOP ======================= */
function applyAway() {
  if (!S) return; const secs = clamp((Date.now() - (S.lastReal || Date.now())) / 1000, 0, 7 * 86400); const hrs = secs / 60;
  if (secs < 5) return;
  S.gameMin += secs;
  const fl = (v, rate, floor) => (v > floor ? Math.max(floor, v - rate * hrs) : v);
  S.dogs.forEach((d) => { const s = d.stats; s.hunger = fl(s.hunger, 3, 30); s.happy = fl(s.happy, 2, 40); s.clean = fl(s.clean, 1, 40); s.energy = clamp(s.energy + 20 * hrs, 0, 100); });
  S.lastReal = Date.now(); dailyCheck(); markDirty();
  if (secs > 120) setTimeout(() => { if (cur.mode === 'yard') toast(`While you were away, ${NAME()} napped for ${Math.round(hrs)} game hours and missed you a normal amount.`, 'gold'); }, 800);
}
let lastTick = performance.now(), saveClock = 0, voiceClock = 0;
function tick() {
  const now = performance.now(), dt = Math.min(5, (now - lastTick) / 1000); lastTick = now;
  if (!S || !['yard', 'market', 'map', 'shelter', 'walk', 'fetch', 'bath', 'toy'].includes(cur.mode)) return;
  S.gameMin += dt; const h = dt / 60;
  const wasDay = S.daily.day; if (dailyCheck() && wasDay) { toast(`Day ${day()} begins. Daily bonuses reset.`, 'gold'); emit('day:new', { day: day() }); }
  checkEnv();
  addStat('hunger', -6 * h * (S.dog.key === 'corgi' ? 1.2 : 1));
  const pack = S.dogs.length > 1 ? 0.75 : 1;
  addStat('happy', -houseInfo().hd * h * (buffOn('warm') ? 0.5 : 1) * pack * (fluffyOn() ? 0.5 : 1));
  S.dogs.filter((d) => d.id !== S.activeId).forEach((d) => { const st = d.stats, c = (k, v) => { st[k] = clamp(st[k] + v, 0, 100); }; c('hunger', -6 * h * (d.key === 'corgi' ? 1.2 : 1)); c('happy', -houseInfo().hd * h * pack * (fluffyOn(d) ? 0.5 : 1)); c('clean', -3 * h); if (d.sleeping) { c('energy', napRate() * h); if (st.energy >= 100) { d.sleeping = false; if (cur.mode === 'yard') redrawPackDog(d); } } else c('energy', -2 * h); });
  buffTick();
  pottyTick();
  if (Date.now() - lastGardenTick > 60000) { lastGardenTick = Date.now(); gardenAdvance(); birthdayCheck(); emit('clock:minute', {}); }
  addStat('clean', -3 * h);
  if (S.gameMin < (S.glowUntil || -1) && S.stats.happy < 80) S.stats.happy = 80;
  if (S.sleeping) {
    addStat('energy', napRate() * h); const nb = $('#napBar'); if (nb) nb.style.width = S.stats.energy + '%';
    if (S.stats.energy >= 100) wake(true);
  } else if (cur.mode !== 'walk' && cur.mode !== 'toy') addStat('energy', -2 * h);
  idleTick(); packIdleTick(); if ((voiceClock += dt) >= 1) { voiceClock = 0; voiceTick(); }
  if (cur.mode === 'yard' && !busy && $('#dogArt')) renderDog(dogPoseNow(), IDLE.act ? IDLE.act.facing : 'right');
  updateHUD();
  saveClock += dt; if (saveClock > 3 && dirty) { saveClock = 0; saveNow(); }
}

