/* ======================= v2.15 AROUND TOWN: the Training Ground agility course (V215.md section 6.1, ACTIVITIES lane, tag ag, test hook __paw.ag) =======================
   Owner: the ACTIVITIES lane (with css/46_agility.css). Laid down by the stubs lane: the names work today, the ACTIVITIES lane fills in the bodies.
   Place: PLACES.training (Bond 3, only while mpOn()). Save: S.ag { day, runs, coins, best: { dogId: 1-3 }, seen } (v215Fields in 00_core.js).
   Rules to keep: no fail state (every run ends with 1 to 3 rosettes), the puppy course for puppies and seniors (no jumps), Bond +10 for a dog's
   first run of the day, coins 10 / 20 / 30 for the first two runs of the day with AG_COIN_DAY 40 pack-wide, Energy -10 a run, rmPause('agility')
   during a run. Strings: tt('agility.<what>', 'English').
   API (stubs now)
     agOn()             the course can be run here now (stub: false, so nothing shows yet)
     agStart(d, o)      start a run for dog d (o.puppy: the puppy course). Stub: false (no run)
     agBest(id)         the best rosettes of a dog (0 = none yet)
     agCoinsLeft()      agility coins still to earn today (AG_COIN_DAY minus today's) */

const AG_COIN_DAY = 40;
function agOn() { return false; }
function agStart(d, o) { return false; }
function agBest(id) { return (S && S.ag && S.ag.best && +S.ag.best[id]) || 0; }
function agCoinsLeft() { if (!S || !S.ag) return AG_COIN_DAY; return S.ag.day === localISO() ? Math.max(0, AG_COIN_DAY - (S.ag.coins || 0)) : AG_COIN_DAY; }

/* ---- tests: window.__paw.ag ---- */
function agExpose() {
  if (!window.__paw) return;
  window.__paw.ag = { on: () => agOn(), start: (id, o) => agStart(dogById(id) || D(), o || {}), best: (id) => agBest(id), left: () => agCoinsLeft(), cap: AG_COIN_DAY };
}
on('game:ready', () => setTimeout(agExpose, 0));
setTimeout(agExpose, 0);
