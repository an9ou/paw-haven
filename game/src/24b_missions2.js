/* ======================= v2.20 "Missions v2": 24b_missions2.js (MISSIONS lane, tag ms2) =======================
   Contract: V220.md. Design: docs/design/missions-v2.md (its "Decided" section).
   Part A: the save fields (v220Fields: S.missions.help, pouch, life, tr, wk, wkAreas, nb, grow), the backfill of the lifetime counters
   from what an old save already knows, the counters on the act bus (ms2Count), the 7-day route list (wkAreas).
   Part B: the Today tab. Today's story mission (24_missions.js) plus two little helps a Japan day from MS_HELPS: tiny kind acts that pay no
   coins (the Bond their action gives is all), seeded by the Japan date and the first dog like msPick, so a reload never rerolls. All three
   done: Gerald's treat pouch, one dog-safe treat (MS2_POUCH, a different one each day) and a paw doodle on today's diary page, once a Japan day.
   The free swap (S.missions.swap, one a day) works on any one row. The sheet (msOpen) gets a tab strip: Today, Week, Badges (and Notebook
   for a new player); a tab whose part is not built yet shows a short placeholder. Under the test harness progress needs prefs.msTest (msAllowed).
   Calm: a soft crayon dot on the clipboard when a help or the pouch is newly done, batched toasts that wait for Gerald (msGuideBusy).
   Test hook: window.__paw.ms2. */
/* The launch switch (owner, 4 Nov 2026; the v2.19 Friends pattern, 50_friends.js FR_LIVE): Missions v2 stays off until the owner's launch date.
   Off, the player sees exactly the v2.19.2 missions (one mission, no tabs, helps, pouch, Week, Badges, Notebook, Growing up, no new story missions
   in the draw, no news entry, the old lesson). The save fields and the lifetime counters are still kept, silently, so the badges are right when it
   turns on; then an old or off-time save gets its earned badges quietly with one letter (S.missions.on2, trbf). On: MS2_LIVE, the GitHub Pages
   test copy (tools/pages.js sets window.__ddMs2Test, never itch.io or /play/) or the dev panel's "Missions v2 test" switch (prefs.ms2Test). */
const MS2_LIVE = true; // the Game Manager turns this on at the v2.20 release (owner's launch date)
function ms2On() { return MS2_LIVE || (typeof window !== 'undefined' && !!window.__ddMs2Test) || !!(typeof prefs !== 'undefined' && prefs && prefs.ms2Test); }
// Missions v2 progress: switched on, and (under the test harness) prefs.msTest like today's mission (msAllowed)
const ms2Ok = () => ms2On() && msAllowed();
const MS2 = { tab: 'today', dot: false, q: [], own: null, sfx: '', resets: [] }; // own: the S these caches belong to (ms2Mine), sfx: a sound held for Gerald
const ms2Obj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);
const MS2_LIFE = ['ms', 'help', 'harvest', 'cook', 'bath', 'trick', 'fetch', 'boards'];

/* ---------------- Part A: save fields ---------------- */
// additive (S.v stays 1). fresh: a brand-new save (freshState), which gets the new-player notebook; an old save gets nb: null
function v220Fields(s, fresh) {
  if (!s) return s;
  if (!ms2Obj(s.missions)) s.missions = {};
  const m = s.missions, num = (o, k) => { if (typeof o[k] !== 'number' || !(o[k] >= 0)) o[k] = 0; }, str = (o, k) => { if (typeof o[k] !== 'string') o[k] = ''; };
  if (!ms2Obj(m.help)) m.help = {}; str(m.help, 'date'); str(m.help, 'sw'); if (!Array.isArray(m.help.list)) m.help.list = [];
  if (!ms2Obj(m.pouch)) m.pouch = {}; str(m.pouch, 'day'); str(m.pouch, 'n'); num(m.pouch, 'c');
  if (!ms2Obj(m.life)) m.life = {}; MS2_LIFE.forEach((k) => num(m.life, k));
  if (m.life.bf !== 1) { m.life.bf = 1; if (!fresh) ms2Backfill(s); }
  if (!ms2Obj(m.tr)) m.tr = {};
  if (m.trbf !== 0 && m.trbf !== 1) m.trbf = fresh ? 1 : 0; // part C: 0 until an old save's earned badges are given quietly (one letter)
  // the launch switch: on2 1 once Missions v2 was on for this save. Until then the badges earned meanwhile are given quietly with one letter when it turns on
  if (ms2On()) m.on2 = 1; else if (m.on2 !== 1) { m.on2 = 0; m.trbf = 0; }
  if (m.mpop !== 1) m.mpop = 0; // part C (fix batch): 1 while the Crayon Medal popup is still to show, saved so a reload before a quiet yard keeps it
  if (!ms2Obj(m.wk)) m.wk = {}; str(m.wk, 'w'); str(m.wk, 'got'); num(m.wk, 'card'); if (!Array.isArray(m.wk.list)) m.wk.list = [];
  // part D (24d_week.js): lt the thank-you letter on its way (null or { w, d: local date filled, ids, c: card stamps, g: card gift }), cards: full
  // neighbour cards, cg: this week's card gift { w, n }, seen: the board state last looked at (the soft dot)
  if (m.wk.lt !== null && !ms2Obj(m.wk.lt)) m.wk.lt = null; num(m.wk, 'cards'); str(m.wk, 'seen'); if (!ms2Obj(m.wk.cg)) m.wk.cg = { w: '', n: '' };
  if (!ms2Obj(m.wkAreas)) m.wkAreas = {};
  if (m.nb === undefined || (m.nb !== null && !ms2Obj(m.nb))) m.nb = fresh ? {} : null;
  if (m.nb) { num(m.nb, 'pages'); if (!ms2Obj(m.nb.done)) m.nb.done = {}; if (!Array.isArray(m.nb.got)) m.nb.got = []; }
  // part E (24e_notebook.js): day the local day the last page opened, p step counts { 'page.step': n }, seen pages looked at (the dot),
  // pop the gift popups still to show (7, 14), dec the day-14 decoration given ('' none)
  if (m.nb) { str(m.nb, 'day'); if (!ms2Obj(m.nb.p)) m.nb.p = {}; num(m.nb, 'seen'); if (!Array.isArray(m.nb.pop)) m.nb.pop = []; str(m.nb, 'dec'); }
  if (!ms2Obj(m.grow)) m.grow = {};
  return s;
}
// the lifetime counters from what an old save already knows (once; never lowers a stored value)
function ms2Backfill(s) {
  const L = s.missions.life, n = (v) => (typeof v === 'number' && v > 0 ? Math.floor(v) : 0), wk = (s.dd && ms2Obj(s.dd.wk) && s.dd.wk) || {};
  const set = (k, v) => { L[k] = Math.max(L[k] || 0, n(v)); };
  set('ms', n(s.missions.stamps) + 7 * n(s.missions.cards));
  set('cook', s.recipes && ms2Obj(s.recipes.best) ? Object.keys(s.recipes.best).length : 0); // the dishes cooked at least once (known also holds the starter recipes)
  set('harvest', Object.values((s.garden && ms2Obj(s.garden.harvests) && s.garden.harvests) || {}).reduce((a, b) => a + n(b), 0));
  set('bath', wk.bath);
  let shows = 0; (Array.isArray(s.dogs) && s.dogs.length ? s.dogs : [s.dog]).forEach((d) => { if (d && ms2Obj(d.tricks)) Object.values(d.tricks).forEach((v) => { if (ms2Obj(v)) shows += n(v.shows); }); });
  set('trick', shows + n(wk.trick));
  set('fetch', n(s.bl && s.bl.n) + n(wk.ball));
}
const ms2Life = (k, n = 1) => { if (S && S.missions && S.missions.life && MS2_LIFE.includes(k)) { S.missions.life[k] = (S.missions.life[k] || 0) + n; markDirty(); } };
// Japan dates: days between two ISO dates, and the Monday of a Japan week (the board's week, part D)
const ms2Days = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);
function ms2WeekKey(j) { j = j || jstISO(); const d = new Date(j + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); }
// the routes walked in the last 7 Japan days (walk_fresh)
function ms2Walked7(area) { const w = S && S.missions && S.missions.wkAreas, d = w && w[area]; return typeof d === 'string' && d && ms2Days(d, jstISO()) < 7; }
function ms2WalkSeen(area) {
  const w = S.missions.wkAreas, t = jstISO(); w[area] = t;
  Object.keys(w).forEach((k) => { if (typeof w[k] !== 'string' || ms2Days(w[k], t) >= 7) delete w[k]; });
}
const ms2FreshRoutes = () => Object.keys(ROUTES).filter((k) => wOpen('route', k, ROUTES[k].bond) && !ms2Walked7(k) && msCanWalk(k)); // v2.22: the town level with lvOn; v2.19.3: a route some dog can walk
const ms2Dressed = () => !!S.outfit && ['head', 'eyes', 'neck', 'body'].some((k) => !!S.outfit[k]);
const ms2FriendsN = () => ((S && S.fr && S.fr.cache && Array.isArray(S.fr.cache.friends)) ? S.fr.cache.friends.length : 0);
// the counters (always, under the harness too: they pay nothing)
function ms2Count(a) {
  const k = a.kind, ids = Array.isArray(a.ids) ? a.ids.length : 0;
  if (k === 'garden' && a.what === 'harvest') ms2Life('harvest');
  else if (k === 'cook') ms2Life('cook');
  else if (k === 'bath') ms2Life('bath', Math.max(1, +a.dogs || ids || 1));
  else if (k === 'trick') ms2Life('trick');
  else if (k === 'fetch' || k === 'toy') ms2Life('fetch');
  else if (k === 'walk' && a.area) ms2WalkSeen(a.area);
}
// the art lane's pieces (V220.md section 5): '' until they are merged, so every caller has a plain fallback
function ms2Art(k, ...args) { try { const M = window.PawArt && window.PawArt.MISSIONS; return M && typeof M[k] === 'function' ? String(M[k](...args) || '') : ''; } catch (e) { return ''; } }
// an art piece stretched to fill its box (the Week notes, V220.md 5: "stretching to another aspect is fine")
function ms2Stretch(svg) { return svg ? svg.replace(/^<svg\b([^>]*)>/, (m, a) => '<svg' + a.replace(/\s(preserveAspectRatio|width|height)="[^"]*"/g, '') + ' preserveAspectRatio="none">') : ''; }
// an art piece as a CSS background image (the notebook page, a repeat-y tile): w x h its own box
function ms2BgURL(svg, w, h) {
  if (!svg) return '';
  const s = svg.replace(/^<svg\b([^>]*)>/, (m, a) => '<svg' + a.replace(/\s(width|height)="[^"]*"/g, '') + (/\sxmlns=/.test(a) ? '' : ' xmlns="http://www.w3.org/2000/svg"') + ` width="${w}" height="${h}">`);
  return `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
}
// batched toasts: grouped by kind of news, and held while Gerald or the parade is talking
function ms2Say(text, kind, group, many) { if (msGuideBusy()) MS2.q.push([text, kind, group, many]); else toast(text, kind, group ? { group, many } : {}); }
// a sound that waits like the toasts (one held at a time, ms2Flush plays it once Gerald and the parade are done)
function ms2Sfx(k) { if (msGuideBusy()) { MS2.sfx = k; return; } try { SFX[k](); } catch (e) { /* audio off */ } }
// the in-memory state of Missions v2 belongs to one S: an import, a restore or a cloud pull (clApply, 22b_cloud.js) puts a new S in its place,
// so the queue, the dots and each part's caches start again (a part adds its own reset with ms2OnSwap). Returns false when S was just swapped
function ms2OnSwap(fn) { MS2.resets.push(fn); }
function ms2Mine() {
  if (MS2.own === S) return true;
  const first = MS2.own === null; MS2.own = S; if (first || !S) return true;
  MS2.q = []; MS2.dot = false; MS2.sfx = ''; MS2.tab = 'today';
  MS2.resets.forEach((f) => { try { f(); } catch (e) { /* a part is not ready */ } });
  return false;
}
function ms2Flush() { ms2Mine(); if (MS2.sfx && !msGuideBusy()) { const k = MS2.sfx; MS2.sfx = ''; ms2Sfx(k); } if (!MS2.q.length || msGuideBusy()) return; const q = MS2.q; MS2.q = []; q.forEach(([t, k, g, m], i) => setTimeout(() => toast(t, k, g ? { group: g, many: m } : {}), i * 700)); }

/* ---------------- Part B: little helps ---------------- */
// t: the row, s: the short name, g: the gate, m: does an act count, x: story missions it would repeat (never drawn beside them)
const ms2FedDogs = (a) => (Array.isArray(a.ids) && a.ids.length ? a.ids.map((id) => dogById(id)).filter(Boolean) : [D()]);
const MS2_POUCH = ['Carrot Sticks', 'Apple Slices', 'Blueberry Bites', 'Bone-shaped Biscuit', 'Sweet Potato Chews']; // dog-safe treats (FOOD rows)
const ms2IsTreat = (n) => n !== 'Fresh Water' && (MS2_POUCH.includes(n) || !!(FOOD.find((f) => f.n === n) || {}).snack);
const MS_HELPS = [
  { id: 'h_pet', n: 1, x: ['pet'], t: 'Give {dog} a good rub', s: 'A good rub', m: (a) => a.kind === 'pet' },
  { id: 'h_water', n: 1, t: 'Fill the water bowl', s: 'Fresh water', m: (a) => a.kind === 'water' },
  { id: 'h_ball', n: 3, x: ['toy', 'toy_new'], t: 'Throw the ball three times', s: 'Three throws', m: (a) => a.kind === 'fetch' },
  { id: 'h_toy', n: 1, x: ['toy', 'toy_new'], t: 'Play with a toy', s: 'Toy time', g: () => S.inv.toys.length > 0, m: (a) => a.kind === 'toy' },
  { id: 'h_nap', n: 1, x: ['nap'], t: 'Tuck {dog} in for a nap', s: 'Nap time', m: (a) => a.kind === 'nap' },
  { id: 'h_bath', n: 1, x: ['bath', 'yearclean'], t: 'Bath time for {dog}', s: 'Bath time', g: () => D().stats.clean < 80, m: (a) => a.kind === 'bath' },
  { id: 'h_wear', n: 1, x: ['wear', 'walk_dressed'], t: 'Try on an outfit', s: 'Dress up', g: () => S.inv.clothes.length > 0, m: (a) => a.kind === 'wear' },
  { id: 'h_scoop', n: 1, x: ['scoop'], t: 'Tidy the yard', s: 'Tidy the yard', m: (a) => a.kind === 'scoop' },
  { id: 'h_mail', n: 1, x: ['mail'], t: 'Open the mailbox', s: 'The mailbox', g: () => typeof mailUnread === 'function' && (mailUnread() > 0 || (Array.isArray(S.mail) && typeof mbOwed === 'function' && S.mail.some((x) => mbOwed(x)))), m: (a) => a.kind === 'collect' || a.kind === 'mail' },
  { id: 'h_trick', n: 1, x: ['trick', 'trick_show'], t: 'Practise a trick once', s: 'Trick practice', g: () => TRICKS.some((x) => x.bond <= topBond()), m: (a) => a.kind === 'trick' },
  { id: 'h_gwater', n: 1, x: ['garden_water'], t: 'Water the garden', s: 'Water the garden', g: () => gkOn() && gardenUnlocked() && !!(S.garden && Array.isArray(S.garden.plots) && S.garden.plots.some((p) => p && p.crop)), m: (a) => a.kind === 'garden' && a.what === 'water' },
  { id: 'h_treat', n: 1, x: ['feed_new'], t: 'Give a dog-safe treat', s: 'A treat', g: () => Object.keys(S.inv.food || {}).some((n) => S.inv.food[n] > 0 && ms2IsTreat(n)), m: (a) => a.kind === 'feed' && ms2IsTreat(a.name) },
  { id: 'h_fav', n: 1, x: ['feed_new'], t: 'Feed {dog} the favourite food', s: 'Favourite food', g: () => (D().favFood || []).some((n) => (S.inv.food[n] || 0) > 0), m: (a) => a.kind === 'feed' && ms2FedDogs(a).some((d) => (d.favFood || []).includes(a.name)) },
  { id: 'h_pack', n: 1, t: 'Feed the whole pack at once', s: 'Pack dinner', g: () => typeof crPack === 'function' && crPack(), m: (a) => a.kind === 'feed' && Math.max(+a.dogs || 0, Array.isArray(a.ids) ? a.ids.length : 0) >= 2 },
  { id: 'h_photo', n: 1, x: ['photo'], t: 'Snap one photo', s: 'One photo', m: (a) => a.kind === 'photo' },
  { id: 'h_paw', n: 1, t: 'Shake paws with a Dog Card dog', s: 'Paw shake', g: () => tkOn() && wOpen('place', 'station', TK_STATION_BOND), m: (a) => a.kind === 'paw' }
];
const ms2HelpDef = (id) => MS_HELPS.find((x) => x.id === id);
// the story missions today's little helps stand for (their x lists): the mission swap never draws one of them, so one act never ticks two rows
function ms2HelpX() { const h = S && S.missions && S.missions.help; if (!ms2On() || !h || h.date !== jstISO() || !Array.isArray(h.list)) return []; return h.list.reduce((a, it) => a.concat((it && (ms2HelpDef(it.id) || {}).x) || []), []); }
// the helps that can be drawn today: gate ok, not a repeat of the story mission (excl: mission ids) nor of a help in hand (ids)
function ms2HelpEligible(excl, ids) {
  return MS_HELPS.filter((d) => { if ((ids && ids.includes(d.id)) || (d.x && excl && d.x.some((x) => excl.includes(x)))) return false; try { return !d.g || !!d.g(); } catch (e) { return false; } });
}
const ms2Item = (d) => ({ id: d.id, n: d.n, p: 0, done: null });
// two helps for a Japan day, seeded like msPick (the date and the first dog): the same day and dog draw the same two
function ms2HelpPick(date) {
  const rnd = msSeed(date, '|help'), excl = (S.missions && S.missions.date === date ? S.missions.list : msPick(date)).map((x) => x.id), pool = ms2HelpEligible(excl), out = [];
  while (out.length < 2 && pool.length) out.push(ms2Item(pool.splice(Math.floor(rnd() * pool.length) % pool.length, 1)[0]));
  return out;
}
function ms2HelpRoll(force) {
  if (!S) return []; msFields(); const t = jstISO(), h = S.missions.help;
  if (h.date !== t || force) { h.date = t; h.sw = ''; h.list = ms2HelpPick(t); markDirty(); }
  return h.list;
}
function ms2Helps() { if (!S) return []; msRoll(); return ms2HelpRoll(); }
function ms2HelpText(it, short) { const d = ms2HelpDef(it.id); if (!d) return it.id; return tdata('ms_helps.' + d.id + (short ? '.s' : '.t'), short ? d.s : d.t, { dog: NAME() }); }
const ms2HelpsDone = () => ms2Helps().filter((x) => x.done).length;

/* the free swap on any one row: 'm' today's mission (msSwap), 0 or 1 a little help. One swap a Japan day for all three rows */
function ms2SwapFree(row) {
  const m = S && S.missions; if (!m || m.swap === jstISO()) return false;
  if (row === 'm') return msSwapFree();
  const H = ms2Helps(), it = H[row]; if (!it || it.done) return false;
  return ms2HelpEligible(m.list.map((x) => x.id), H.map((x) => x.id)).length > 0;
}
function ms2SwapRow(row) {
  if (!S) return false;
  if (row === 'm' || row === 'mission') { const ok = msSwap(); if (ok) { S.missions.help.sw = 'm'; markDirty(); } return ok; }
  row = +row; if (!ms2SwapFree(row)) return false;
  const m = S.missions, t = jstISO(), H = ms2Helps(), pool = ms2HelpEligible(m.list.map((x) => x.id), H.map((x) => x.id)), rnd = msSeed(t, '|hswap' + row);
  const it = ms2Item(pool[Math.floor(rnd() * pool.length) % pool.length]);
  H[row] = it; m.swap = t; m.help.sw = 'h'; markDirty(); SFX.boop(760);
  msSay(tt('ms2.swapped_help', 'A new little help for today: {help}.', { help: ms2HelpText(it, true) }), 'good'); msRefresh(); return true;
}

/* ---------------- Part B: Gerald's treat pouch ---------------- */
// the treat of a Japan day: the five take turns, day by day
function ms2PouchTreat(date) { const L = MS2_POUCH.filter((n) => FOOD.some((f) => f.n === n)); return L[((ms2Days('2026-01-01', date) % L.length) + L.length) % L.length]; }
// all three rows done (a forced test list: every mission in it): one treat, once a Japan day, and a paw doodle on today's diary page
function ms2PouchCheck() {
  if (!S || !S.missions || !ms2Ok() || cur.mode === 'title') return false;
  const m = S.missions, t = jstISO(); if (m.pouch.day === t) return false;
  const H = ms2Helps(), L = m.list; if (!H.length || !H.every((x) => x.done) || !L.every((x) => x && x.done)) return false;
  const n = ms2PouchTreat(t); m.pouch.day = t; m.pouch.n = n; m.pouch.c++;
  S.inv.food[n] = (S.inv.food[n] || 0) + 1;
  try { if (typeof ddReady === 'function' && ddReady()) { const p = ddToday(); if (p && !p.x.includes('q')) p.x += 'q'; } } catch (e) { /* no diary today */ }
  markDirty(); MS2.dot = true; msHudSync(true);
  ms2Say(tt('ms2.pouch_got', 'All three done! Gerald opens his treat pouch: one {treat} for {name}. It is in the Feed tray.', { treat: shNameAny(n), name: NAME() }), 'gold');
  setTimeout(() => ms2Sfx('kaching'), 0);
  return true;
}
function ms2OnAct(a) {
  if (!S || !a || !a.kind || cur.mode === 'title' || !S.missions || !S.missions.life) return;
  try { ms2Count(a); } catch (e) { console.warn('ms2 count', e); }
  if (!ms2Ok()) return; // off (MS2_LIVE): the counters above still count, nothing else
  const H = ms2Helps(); let changed = false, done = 0;
  H.forEach((it) => {
    const d = ms2HelpDef(it.id); if (!d || it.done) return;
    let hit = false; try { hit = !!d.m(a, it); } catch (e) { hit = false; }
    if (!hit) return;
    it.p = Math.min(it.n, (it.p || 0) + 1); changed = true;
    if (it.p >= it.n) { it.done = jstISO(); done++; ms2Life('help'); if (typeof lvGain === 'function') lvGain('help', 10); /* v2.22: town XP */ ms2Say(tt('ms2.help_done', 'Little help done: {help}.', { help: ms2HelpText(it, true) }), 'good', 'ms2h', (k) => tt('ms2.help_done_many', '{n} little helps done.', { n: k })); }
  });
  if (changed) { markDirty(); if (done) { MS2.dot = true; msHudSync(); } }
  const got = ms2PouchCheck();
  if (changed || got) msRefresh();
}
on('act', ms2OnAct); // after msOnAct (24_missions.js loads first): the story mission is ticked before the pouch looks

/* ---------------- Part B: the sheet (tabs) ---------------- */
const MS2_TABS = [
  { k: 'today', label: () => tt('ms2.tab_today', 'Today'), ic: () => msHudIcon(), shown: () => true },
  { k: 'week', label: () => tt('ms2.tab_week', 'Week'), ic: () => iconOr('mail', doodle('heart', 0, 0, 1)), shown: () => true },
  { k: 'badges', label: () => tt('ms2.tab_badges', 'Badges'), ic: () => ICON('star'), shown: () => true },
  { k: 'notebook', label: () => tt('ms2.tab_notebook', 'Notebook'), ic: () => iconOr('journal', doodle('paw', 0, 2, 1.1)), shown: () => typeof msNbShown === 'function' && !!msNbShown() }
];
const ms2Tabs = () => MS2_TABS.filter((x) => { try { return x.shown(); } catch (e) { return false; } });
function ms2TabsHTML() {
  const L = ms2Tabs(); if (!L.some((x) => x.k === MS2.tab)) MS2.tab = 'today';
  return `<div class="ms-tabs" role="tablist" aria-label="${esc(tt('journal.tab_missions', 'Missions'))}">${L.map((x) => { const on = x.k === MS2.tab, ic = ms2Art('tab', x.k) || x.ic(); return `<button class="ms-tab${on ? ' on' : ''}" type="button" role="tab" aria-selected="${on}" data-mstab="${x.k}"><span class="ms-tic" aria-hidden="true">${ic}</span><span class="ms-tl">${esc(x.label())}</span></button>`; }).join('')}</div>`;
}
function ms2Soon(ic, text) { return `<div class="ms2-soon"><span class="ms2-soonic" aria-hidden="true">${ic}</span><p>${esc(text)}</p></div>`; }
function ms2TabBody(stampNew) {
  const k = MS2.tab;
  if (k === 'week') return typeof msWeekHTML === 'function' ? msWeekHTML() : ms2Soon(ms2Art('board') || iconOr('mail', doodle('heart', 0, 0, 1)), tt('ms2.week_soon', 'Gerald is pinning up a help-wanted board for the neighbours. It opens soon.'));
  if (k === 'badges') return typeof msBadgesHTML === 'function' ? msBadgesHTML() : ms2Soon(ms2Art('rosette', 'g') || ICON('star'), tt('ms2.badges_soon', 'Badges for walks, gardens, tricks and more are on their way.'));
  if (k === 'notebook' && typeof msNbHTML === 'function') return msNbHTML();
  return msBodyHTML(stampNew);
}
// the whole sheet: the tab strip and the open tab. The popup (msOpen) and Journal > Missions (msTabHTML) both show it
function ms2SheetHTML(stampNew) { ms2Mine(); return `<div class="ms-sheet" data-tab="${MS2.tab}">${ms2TabsHTML()}<div class="ms-tabbody" role="tabpanel">${ms2TabBody(stampNew)}</div></div>`; }
// the two help rows under the clipboard (the story mission is the clipboard itself, the larger row)
function ms2HelpsHTML() {
  const H = ms2Helps(), free = S.missions.swap !== jstISO();
  const rows = H.map((it, i) => `<li class="ms2-h${it.done ? ' done' : ''}" data-help="${esc(it.id)}">${MS_TICK}<span class="ms2-t">${esc(ms2HelpText(it))}</span><span class="ms2-p">${it.done ? `<span class="ms2-bond">${esc(tt('ms2.bond', 'Bond'))}</span>` : `${Math.min(it.p || 0, it.n)}/${it.n}`}</span>${free && ms2SwapFree(i) ? `<button class="btn ms2-swap" type="button" data-row="${i}" aria-label="${esc(tt('ms2.swap_help_aria', 'Swap this little help: {help}', { help: ms2HelpText(it, true) }))}">${esc(tt('ms2.swap_short', 'Swap'))}</button>` : ''}</li>`).join('');
  return `<section class="ms2-helps" aria-label="${esc(tt('ms2.helps', 'Little helps'))}"><h3>${esc(tt('ms2.helps', 'Little helps'))}</h3><ul>${rows}</ul><p class="small ms2-hnote">${esc(tt('ms2.helps_note', 'Tiny kind things. They give Bond, not coins.'))}</p></section>`;
}
function ms2PouchHTML() {
  const m = S.missions, got = m.pouch.day === jstISO(), n = got ? m.pouch.n : ms2PouchTreat(jstISO());
  const ic = ms2Art('pouch') || art('item', n);
  const txt = got ? tt('ms2.pouch_done', "Today's treat pouch is open: a {treat} for {name}.", { treat: shNameAny(n), name: NAME() }) : tt('ms2.pouch_todo', "Finish all three for Gerald's treat pouch: today it holds a dog-safe treat.");
  return `<p class="ms2-pouch${got ? ' got' : ''}"><span class="ms2-pic" aria-hidden="true">${ic}</span><span>${esc(txt)}</span></p>`;
}
// the swap line: the mission's own Swap button (the help rows carry theirs), or a short line once today's swap is used
function ms2SwapLineHTML() {
  const m = S.missions, t = jstISO();
  if (m.swap === t) return `<p class="small ms-swapline">${esc(m.help.sw === 'h' ? tt('ms2.swap_used_help', 'Swapped today. New little helps come tomorrow.') : tt('missions.swap_used', 'Swapped today. A new mission comes tomorrow.'))}</p>`;
  const mis = msSwapFree(), any = mis || [0, 1].some((i) => ms2SwapFree(i));
  if (!any) return '';
  return `<p class="ms-swapline">${mis ? `<button class="btn ms-swap" type="button" id="msSwap">${esc(tt('ms2.swap_mission', 'Swap the mission'))}</button> ` : ''}<span class="small">${esc(tt('ms2.swap_note', 'One free swap a day, for any one row.'))}</span></p>`;
}
document.addEventListener('click', (e) => {
  const t = e.target && e.target.closest; if (!t || !S) return;
  const sw = e.target.closest('.ms2-swap[data-row]'); if (sw) { e.stopPropagation(); ms2SwapRow(+sw.dataset.row); return; }
  const tb = e.target.closest('.ms-tab[data-mstab]'); if (tb) { e.stopPropagation(); if (MS2.tab !== tb.dataset.mstab) { SFX.click(); MS2.tab = tb.dataset.mstab; msRefresh(); const nb = document.querySelector(`#modal .ms-tab[data-mstab="${MS2.tab}"]`); if (nb) nb.focus(); } }
});
// the soft crayon dot on the clipboard (never a number): a help or the pouch newly done, or a later part's news (the board ready, a new badge)
function ms2Dot(on) { MS2.dot = !!on; msHudSync(); }
function ms2DotOn() { if (!S || !S.missions || !ms2On()) return false; ms2Mine(); let o = MS2.dot; try { if (!o && typeof msWeekDot === 'function') o = !!msWeekDot(); if (!o && typeof msBadgeDot === 'function') o = !!msBadgeDot(); if (!o && typeof msNbDot === 'function') o = !!msNbDot(); } catch (e) { /* a later part */ } return o; }

/* ---------------- tests ---------------- */
function ms2Expose() {
  if (!window.__paw) return;
  window.__paw.ms2 = {
    on: () => ms2On(), live: () => MS2_LIVE, test: (v) => { prefs.ms2Test = !!v; return ms2On(); }, howto: () => gdTabHTML(), // the launch switch (prefs.ms2Test is the dev panel's)
    pagesFlag: () => { const p = prefs.ms2Test; let off, on; try { prefs.ms2Test = false; off = ms2On(); window.__ddMs2Test = 1; on = ms2On(); } finally { delete window.__ddMs2Test; prefs.ms2Test = p; } return { off, on }; }, // the Pages test copy's flag alone turns it on
    fields: (s, fresh) => v220Fields(s || S, fresh), backfill: (s) => ms2Backfill(s || S), helps: () => ms2Helps(), roll: (f) => ms2HelpRoll(f), pick: (date) => ms2HelpPick(date), pool: MS_HELPS.map((d) => d.id),
    eligible: () => ms2HelpEligible(S.missions.list.map((x) => x.id)).map((d) => d.id), swapFree: (row) => ms2SwapFree(row), swap: (row) => ms2SwapRow(row), pouch: () => ms2PouchCheck(), treat: (date) => ms2PouchTreat(date || jstISO()),
    force: (ids) => { ms2HelpRoll(); S.missions.help.list = ids.map((id) => { const d = ms2HelpDef(id); return d ? ms2Item(d) : null; }).filter(Boolean); markDirty(); msRefresh(); return S.missions.help.list; },
    text: (it, s) => ms2HelpText(it, s), weekKey: (j) => ms2WeekKey(j), walked7: (a) => ms2Walked7(a), fresh: () => ms2FreshRoutes(), tab: (k) => { if (k) { MS2.tab = k; msRefresh(); } return MS2.tab; }, tabs: () => ms2Tabs().map((x) => x.k),
    dot: () => ms2DotOn(), open: (k) => msOpen(k), get queue() { return MS2.q.length; }, say: (t) => MS2.q.push([t, 'good']), swapPool: () => msEligible(msSwapExcl(S.missions)).map((d) => d.id), helpX: () => ms2HelpX(), outfit: (id) => outfitOf(id ? dogById(id) : D()), dogOutfit: () => dogOutfit()
  };
}
on('game:ready', () => setTimeout(ms2Expose, 0));
on('yard:enter', () => { if (window.__paw && !window.__paw.ms2) ms2Expose(); });
setInterval(() => { if (S && cur.mode !== 'title') ms2Flush(); }, 1000);
