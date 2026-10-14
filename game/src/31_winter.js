/* ======================= v2.8 WINTER lane (tag wn): Snow Days, Winter Lights, the Winter Stall, the Ugly Sweater Contest. See V28.md sections 1, 2 and 7 =======================
   The WINTER lane owns this file (and css/34_winter.css), plus the 26_festival.js functions listed in V28.md section 7. This is the coordinator's stub:
   every cross-lane name resolves and returns ''/false, so the game behaves exactly as v2.7 until the WINTER lane fills it in.
   Core names (00_core.js): wnAuto, wnYear, nyYear, nyDays, nyEve, festNow/festOn ('snow', 'lights', 'newyear'), envNow().lights, S.wn (v28Fields).
   Harness gate: under the test harness the winter flags never turn on by date unless the suite sets prefs.wnTest (or calls __paw.wn.allow(true)). */

// true while the contest walk runs (fsActive holds mission toasts on it)
function wnActive() { return false; }
// mission gates: snow on, an adult who can play / no snowdog finished today
function wnCanJump() { return false; }
function wnSnowdogFree() { return false; }
// the contest sheet (fsChooser, the place button). Stub: nothing
function wnContestOpen() { return null; }
// Gerald's How to play card while festOn('snow'): a lesson [key, icon, title, text] like GD_LESSONS (or <li> HTML), '' for none
function wnLesson() { return ''; }
// the Journal line (fsJournalLine), '' for none
function wnJournalLine() { return ''; }

function wnExpose() {
  if (!window.__paw) return;
  // allow(v): the harness gate at run time, for suites that cannot pass prefs.wnTest at load (the occlusion hooks)
  window.__paw.wn = { allow: (v) => { prefs.wnTest = !!v; checkEnv(true); return festNow(); }, auto: (j) => wnAuto(j), keepOut: (pl) => fsKeepOut(pl), lesson: () => wnLesson(), journal: () => wnJournalLine(), contestOpen: () => wnContestOpen(), pending: 0 };
}
on('game:ready', () => setTimeout(wnExpose, 0));
on('yard:enter', () => { if (!window.__paw || !window.__paw.wn) wnExpose(); });
setTimeout(wnExpose, 0);
