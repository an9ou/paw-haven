/* ======================= v2.7 PACK CARE lane (tag cr): Feed, Pet, Bath and Nap for every dog present, with a row of dog chips to untick some. See V27.md sections 1 and 6 =======================
   The PACK CARE lane owns this file (and css/32_pack_care.css). This is the coordinator's stub: the names resolve and the game behaves exactly as v2.6
   (the active dog only, plus the old Feed all button) until the PACK CARE lane fills it in. */

// pack care is on with two or more dogs. Under the test harness it is off unless a suite opts in (test_lib.js pins prefs.crOne = true, `packCare: true` lifts it)
function crOn() { return !!(S && Array.isArray(S.dogs) && S.dogs.length > 1 && !prefs.crOne); }
// the dogs present here (the active dog first, then others()), whether ticked or not
function crPresent() { return S ? [S.dog].concat(typeof others === 'function' ? others() : []) : []; }
// the ticked dogs present here (S.careOff holds the unticked ids). With pack care off: the active dog only
function crDogs() { if (!crOn()) return S ? [S.dog] : []; const l = crPresent().filter((d) => !(S.careOff && S.careOff[d.id])); return l.length ? l : [S.dog]; }
// the chip row for a tray (Feed, Care). Stub: nothing
function crChipsHTML() { return ''; }
function crBindChips(root) { /* PACK CARE: toggles S.careOff, keeps at least one dog ticked, redraws the tray */ }

function crExpose() {
  if (!window.__paw) return;
  window.__paw.cr = { on: () => crOn(), dogs: () => crDogs().map((d) => d.id), present: () => crPresent().map((d) => d.id) };
}
on('game:ready', () => setTimeout(crExpose, 0));
on('yard:enter', () => { if (!window.__paw || !window.__paw.cr) crExpose(); });
setTimeout(crExpose, 0);
