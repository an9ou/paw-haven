/* ======================= v2.15 AROUND TOWN: the Splash Pool (V215.md section 6.2, ACTIVITIES lane, tag pl, test hook __paw.pl) =======================
   Owner: the ACTIVITIES lane (with css/47_pool.css). Laid down by the stubs lane: the names work today, the ACTIVITIES lane fills in the bodies.
   Place: PLACES.pool (Bond 2, only while mpOn()). Save: S.pool { day: { dogId: localISO of the last paddle }, vest, seen } (v215Fields in 00_core.js).
   Rules to keep: shallow, a ramp out, the free Doggy Life Vest on the first visit (never sold), one paddle a day per dog, flat-faced breeds paddle
   on the step only, float fetch inside the ball play cap (BL_COIN_DAY), no coins from the pool itself, the Winter Dome. Strings: tt('pool.<what>', 'English').
   API (stubs now)
     plOn()             the pool activities show here now (stub: false)
     plPaddle(d)        dog d paddles (once a day). Stub: false (nothing happens)
     plPaddled(d)       dog d has paddled today
     plVest()           the Doggy Life Vest has been given */

function plOn() { return false; }
function plPaddle(d) { return false; }
function plPaddled(d) { return !!(S && S.pool && d && S.pool.day[d.id] === localISO()); }
function plVest() { return !!(S && S.pool && S.pool.vest); }

/* ---- tests: window.__paw.pl ---- */
function plExpose() {
  if (!window.__paw) return;
  window.__paw.pl = { on: () => plOn(), paddle: (id) => plPaddle(dogById(id) || D()), paddled: (id) => plPaddled(dogById(id) || D()), vest: () => plVest() };
}
on('game:ready', () => setTimeout(plExpose, 0));
setTimeout(plExpose, 0);
