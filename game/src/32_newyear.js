/* ======================= v2.8 NEW YEAR lane (tag ny): New Year cards, the Fortune box, the year-end clean. See V28.md sections 1, 2 and 8 =======================
   The NEW YEAR lane owns this file (and css/35_newyear.css). This is the coordinator's stub: the cross-lane names resolve and return ''/false/no-op.
   Core names (00_core.js): nyYear, nyDays (cards and the box, 1-7 Jan JST), nyEve (26-31 Dec), festOn('newyear'), S.ny (v28Fields).
   Mailbox (v2.7, 07b_mailbox.js): mailPush(msg), mbCollect(ids), mbOwed(m), mbGrant(m); gifts { coins } or { item, cat: 'clothes' } or { item, cat, id, n }. */

// the fortune sheet (fsChooser, the place button). Stub: nothing
function nyFortuneOpen() { return null; }
// the Journal line while nyDays(), '' for none
function nyJournalLine() { return ''; }
// draws the Fortune box in <g id="nyFortuneG"> in the Square (called by fsSquareDraw). Stub: nothing
function nySquareDraw() { }

function nyExpose() {
  if (!window.__paw) return;
  window.__paw.ny = { fortuneOpen: () => nyFortuneOpen(), draw: () => nySquareDraw(), journal: () => nyJournalLine(), get knots() { return S && S.ny && S.ny.fortune ? S.ny.fortune.knots : 0; } };
}
on('game:ready', () => setTimeout(nyExpose, 0));
on('yard:enter', () => { if (!window.__paw || !window.__paw.ny) nyExpose(); });
setTimeout(nyExpose, 0);
