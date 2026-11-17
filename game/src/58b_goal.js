/* ======================= v2.30 "Better together" part 2: the shared town goal (V230.md 5-7). Tag gl, test hook window.__paw.gl ======================= */
// One count for the whole town each Japan month (the Worker's town_goal): belly rubs from normal play, a pet counts 1 and a walk counts 3. The game
// keeps what is waiting (S.goal.q) and sends it in one small POST at most every 5 minutes; the Worker caps each account and each IP a day. When the
// town reaches the goal, everyone who added at least one belly rub that month gets Gerald's treat bag (once per month, per save). A missed goal just
// ends kindly with a "So close!" letter and a new goal starts. No names, no leaderboard, no chat, no coins. Off until NEWS_V230.date (btOn()).
const GL_EVERY = 5 * 60e3, GL_POST = 40, GL_Q_MAX = 200, GL_PET = 1, GL_WALK = 3, GL_FRESH = 60e3;
const GL_TREATS = [['Pupcake', 1], ['Bone-shaped Biscuit', 3]]; // the treat bag (dog-safe FOOD rows): no coins, so walks stay the main income
const GL = { st: null, at: 0, getP: null, postP: null };

/* ---------------- save (additive) ---------------- */
function glFields(s) {
  if (!s) return s;
  if (!s.goal || typeof s.goal !== 'object' || Array.isArray(s.goal)) s.goal = {};
  const g = s.goal;
  if (!Number.isInteger(g.q) || g.q < 0) g.q = 0; if (g.q > GL_Q_MAX) g.q = GL_Q_MAX;
  if (!Number.isFinite(g.at) || g.at < 0) g.at = 0;
  if (!Array.isArray(g.got)) g.got = []; g.got = g.got.filter((m) => typeof m === 'string').slice(-24);
  if (!g.sent || typeof g.sent !== 'object' || Array.isArray(g.sent)) g.sent = {};
  Object.keys(g.sent).sort().slice(0, -3).forEach((k) => { delete g.sent[k]; }); // the last three months are enough for the sheet
  if (typeof g.miss !== 'string') g.miss = '';
  return s;
}
// on: btOn() and cloud here (guest or email: almost every itch.io player is a cloud guest; V230.md 6). Tests: window.__ddGlMode ('on' | 'off')
function glOn() {
  if (!btOn() || BT_GONE) return false; // BT_GONE: an older Worker without the routes (58_invite.js)
  const o = typeof window !== 'undefined' && window.__ddGlMode; if (o) return o === 'on';
  return typeof CL !== 'undefined' && !!CL.on;
}
const glLive = () => glOn() && typeof CL !== 'undefined' && !!CL.uid; // a token to count with (never makes a guest by itself)
const glMonth = () => jstISO().slice(0, 7);
function glMonthName(m) { try { return tdate(new Date(+m.slice(0, 4), +m.slice(5, 7) - 1, 1), { month: 'long' }); } catch (e) { return m; } }

/* ---------------- counting ---------------- */
function glAdd(n) {
  if (!S || !glOn() || !(n > 0) || cur.mode === 'title') return 0;
  glFields(S); const g = S.goal, add = Math.min(GL_Q_MAX - g.q, Math.floor(n)); if (add <= 0) return 0;
  g.q += add; markDirty();
  return add;
}
on('act:pet', (d) => { glAdd(d && Array.isArray(d.ids) && d.ids.length ? d.ids.length : (d && d.dogs) || GL_PET); });
on('act:walk', () => { glAdd(GL_WALK); });

/* ---------------- the Worker ---------------- */
// one small POST with what is waiting (at most GL_POST), at most every GL_EVERY. What the Worker did not take (its daily caps) is dropped
async function glPost(force) {
  if (!S || !glLive()) return null;
  glFields(S); const g = S.goal;
  if (!g.q || (!force && Date.now() - g.at < GL_EVERY)) return null;
  if (GL.postP) return GL.postP;
  GL.postP = (async () => {
    const n = Math.min(GL_POST, g.q);
    let r = null; try { r = await clApi('POST', '/town/goal', { n }); } catch (e) { return null; } // offline: kept for the next try
    g.at = Date.now(); markDirty();
    if (btGoneAns(r)) { btGoneSet(); return null; } // an older Worker without the route: the belly rubs stay waiting (code review 1)
    if (!r || r.status === 429 || r.status >= 500 || r.status === 401) return null; // later (the 2-minute gap, busy, a login gone)
    g.q = Math.max(0, g.q - n);
    if (r.ok && r.data && typeof r.data.month === 'string') {
      const d = r.data; g.sent[d.month] = (g.sent[d.month] | 0) + Math.max(0, d.took | 0);
      GL.st = Object.assign({}, GL.st || {}, { month: d.month, goal: d.goal, n: d.n, done: !!d.done, mine: d.mine | 0, part: !!d.part }); GL.at = Date.now();
      glGift(GL.st, d.month); glMiniDraw();
    }
    saveNow();
    return r.data;
  })().finally(() => { GL.postP = null; });
  return GL.postP;
}
async function glFetch(force) {
  if (!glOn() || typeof CL === 'undefined' || !CL.on) return null;
  if (!force && GL.st && Date.now() - GL.at < GL_FRESH) return GL.st;
  if (GL.getP) return GL.getP;
  GL.getP = (async () => {
    let r = null; try { r = await clApi('GET', '/town/goal'); } catch (e) { return null; }
    if (btGoneAns(r)) { btGoneSet(); return null; }
    if (!r || !r.ok || !r.data || typeof r.data.month !== 'string') return null;
    const d = r.data; GL.st = d; GL.at = Date.now();
    if (S) {
      glGift(d, d.month); if (d.last) glGift(d.last, d.month); // code review 9: "over" means before the Worker's month, never the device clock
      if (Array.isArray(d.owed)) d.owed.forEach((o) => glGift(o, d.month)); // code review 10: a treat bag earned months ago (two or more months away) still comes
    }
    glMiniDraw();
    return GL.st;
  })().finally(() => { GL.getP = null; });
  return GL.getP;
}

/* ---------------- the gift, and the kind letter for a missed month ---------------- */
const glTreatLine = () => tlist(GL_TREATS.map(([n, q]) => tt('pm.treat_n', '{n} × {item}', { n: tnum(q), item: homeName(n) })));
// st: { month, goal, n, done, mine, part } for one month; cur: the Worker's month now. Took part: mine > 0, or part (this account posted that month even
// when a daily cap took 0: a shared network's IP cap never costs a real player the gift). The treat bag once per month (S.goal.got); "So close!" once,
// only for a month that is over
function glGift(st, cur) {
  if (!S || !st || typeof st.month !== 'string' || !/^\d{4}-\d{2}$/.test(st.month) || !((st.mine | 0) > 0 || st.part === true)) return null;
  glFields(S); const g = S.goal, mine = st.mine | 0, z = mine > 0 ? '' : '_0';
  if (g.got.includes(st.month)) return null;
  const vars = { month: glMonthName(st.month), goal: tnum(st.goal), n: tnum(st.n), name: NAME(), mine: tnum(mine), gift: glTreatLine() };
  if (st.done) {
    g.got.push(st.month); g.got.sort();
    GL_TREATS.forEach(([n, q]) => { S.inv.food[n] = (S.inv.food[n] || 0) + q; });
    mailPush({ kind: 'news', id: 'gl_' + st.month, keep: true, quiet: true, from: tt('ks.letter_from', 'Gerald'), title: tt('gl.done_title', 'The town did it!'),
      text: z ? tt('gl.done_text_0', 'Dear friend,\nThe whole town reached the goal for {month}: {goal} belly rubs! You and {name} were part of it. Thank you!\nHere is a treat bag to say thank you: {gift}. It is in your pantry.\nWith a happy waddle,\nGerald', vars)
        : tt('gl.done_text', 'Dear friend,\nThe whole town reached the goal for {month}: {goal} belly rubs! You and {name} added {mine} of them.\nHere is a treat bag to say thank you: {gift}. It is in your pantry.\nWith a happy waddle,\nGerald', vars) });
    setTimeout(() => toast(tt('gl.done_toast', 'The town reached its goal! Gerald sent you a treat bag.'), 'gold'), 400); // the letter is quiet: this toast says it
    markDirty(); saveNow();
    return 'gift';
  }
  if (typeof cur === 'string' && st.month < cur && g.miss < st.month) {
    g.miss = st.month;
    mailPush({ kind: 'news', id: 'gl_miss_' + st.month, from: tt('ks.letter_from', 'Gerald'), title: tt('gl.miss_title', 'So close!'),
      text: z ? tt('gl.miss_text_0', 'Dear friend,\nIn {month} the town got to {n} of {goal} belly rubs. Not quite there, and that is just fine. Thank you for being part of it with {name}!\nA new goal starts this month, and every belly rub counts again.\nWith a happy waddle,\nGerald', vars)
        : tt('gl.miss_text', 'Dear friend,\nIn {month} the town got to {n} of {goal} belly rubs. Not quite there, and that is just fine. Thank you for the {mine} you and {name} added!\nA new goal starts this month, and every belly rub counts again.\nWith a happy waddle,\nGerald', vars) });
    markDirty(); saveNow();
    return 'miss';
  }
  return null;
}

/* ---------------- the Square: Gerald's note on the town notice board (owner, 17 Nov), the link in Town projects, and Gerald's notice ---------------- */
const glFrac = (st) => (st && st.goal > 0 ? Math.max(0, Math.min(1, st.n / st.goal)) : 0);
const glFill = (st) => (st && st.n > 0 ? Math.max(glFrac(st), 0.03) : 0); // art review 3: a town that has started shows a sliver
// Gerald's paper, pinned over the right-hand notes of the Square's notice board (world C: the board's own coordinates, its face x 660..820, y 366..464;
// the newer drawing sqNoticeB2 is the same board at 0.8 round its foot, so glBoardDraw adds that transform when its tap box is the smaller one,
// 200 wide, not 224):
// a heart, a thin crayon meter and two pencil lines. The group goes right after the board's data-hot (same space, on top of its tap box). Its own tap
// box (44 px and more on a 360 x 640 phone); the rest of the board is still the Town notice
const GL_NOTE = { x: 766, y: 380, w: 52, h: 78, hot: [752, 346, 112, 128] };
function glNoteSVG(st) {
  const k = praKit(3021), { x, y, w, h } = GL_NOTE, cx = x + w / 2, f = glFill(st);
  k.raw(`<g transform="rotate(4 ${cx} ${y + h / 2})">`);
  k.shape(praSharp(praRect(x, y, w, h), 2), '#FFFBF3', { w: 1.6, amp: 0.6 });
  const hy = y + 14; // a heart
  k.shape([[cx, hy + 17], [cx - 10, hy + 7], [cx - 10, hy + 2], [cx - 5.5, hy - 1], [cx, hy + 2.5], [cx + 5.5, hy - 1], [cx + 10, hy + 2], [cx + 10, hy + 7]], PRA_C.pinkD, { w: 1.4, amp: 0.4 });
  const mx = x + 7, my = y + 42, mw = w - 14, mh = 7;
  k.raw(`<rect x="${mx}" y="${my}" width="${mw}" height="${mh}" rx="3" fill="${PRA_C.white}" stroke="${PRA_C.ink}" stroke-width="1.3"/>`);
  k.raw(`<rect class="gl-note-fill" x="${mx + 1.2}" y="${my + 1.2}" width="${praR1((mw - 2.4) * f)}" height="${mh - 2.4}" rx="1.8" fill="${PRA_C.pinkD}" data-w="${mw - 2.4}"/>`);
  k.line([[x + 8, y + 60], [x + w - 10, y + 59]], { w: 1.1, c: PRA_C.graph }); k.line([[x + 8, y + 67], [x + w - 18, y + 67]], { w: 1.1, c: PRA_C.graph });
  k.raw(`<circle cx="${cx}" cy="${y + 4}" r="2.6" fill="#E86A7C" stroke="${PRA_C.ink}" stroke-width=".8"/></g>`);
  return k.svg();
}
function glBoardDraw() {
  const svg = typeof view !== 'undefined' && view && $('svg.world', view); if (!svg) return;
  svg.querySelectorAll('#glG').forEach((e) => e.remove());
  if (!S || cur.mode !== 'yard' || S.place !== 'square' || !glOn()) return;
  const hot = svg.querySelector('#sceneG [data-hot="notice"]'); if (!hot) return; // drawn in the board's own space, right after it (so on top of its tap box)
  const tint = (h) => (h && window.PawArt && typeof PawArt.tint === 'function' ? PawArt.tint(h, { time: timePhase(), lit: true }) : h);
  const b = GL_NOTE.hot;
  let bw = 224; try { const hit = hot.querySelector('.pa-wc-hit'); bw = (hit && hit.getBBox().width) || 224; } catch (e) { /* not laid out: the plain board */ }
  const tf = Math.abs(bw - 224) > 6 ? ' transform="matrix(.8 0 0 .8 153 -17.6)"' : ''; // sqNoticeB2 (its tap box is 200 wide): cx 745, gy 392, s .8 round (740, 512)
  hot.insertAdjacentHTML('afterend', `<g id="glG"${tf}><g class="hot gl-hot" data-gl-hot="board" role="button" tabindex="0" aria-label="${esc(tt('gl.title', 'Town goal'))}"><rect x="${b[0]}" y="${b[1]}" width="${b[2]}" height="${b[3]}" fill="transparent"/>${tint(glNoteSVG(GL.st))}</g></g>`);
  const g = $('#glG [data-gl-hot]', svg), go = () => { if (typeof blOn === 'function' && blOn()) return; SFX.click(); glOpen(); };
  g.onclick = (e) => { e.stopPropagation(); go(); }; g.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } };
  glFetch(false).catch(() => {});
}
function glMiniDraw() {
  const f = glFill(GL.st);
  document.querySelectorAll('#glG .gl-note-fill').forEach((r) => r.setAttribute('width', String(praR1((+r.dataset.w || 0) * f))));
  document.querySelectorAll('.gl-link .gl-mini i').forEach((i) => { i.style.width = (f * 100).toFixed(1) + '%'; });
}
// the link at the top of the Town projects sheet (55_projects.js prSheetHTML): a thin, centred meter under "Town goal"
function glLinkHTML() {
  if (!S || !glOn()) return '';
  const st = GL.st, f = glFill(st);
  const sub = st ? tt('gl.so_far', 'Belly rubs so far: {n} of {goal}', { n: tnum(st.n), goal: tnum(st.goal) }) : tt('gl.link_sub', 'One goal for the whole town');
  return `<button class="btn gl-link" type="button" id="glLink"><span class="gl-link-t">${esc(tt('gl.title', 'Town goal'))}</span><span class="gl-mini" aria-hidden="true"><i style="width:${(f * 100).toFixed(1)}%"></i></span><span class="small gl-link-s">${esc(sub)}</span></button>`;
}
function glLinkBind(p) { const b = p && $('#glLink', p); if (b) b.onclick = () => { SFX.click(); glOpen(); }; if (b) glFetch(false).then(() => { const s = $('.gl-link-s', p), st = GL.st; if (s && st) s.textContent = tt('gl.so_far', 'Belly rubs so far: {n} of {goal}', { n: tnum(st.n), goal: tnum(st.goal) }); glMiniDraw(); }).catch(() => {}); }
function glGeraldArt() { try { const s = typeof scGeraldSVG === 'function' ? scGeraldSVG('wave') : ''; if (s) return s; } catch (e) { /* no Gerald art */ } return ICON('heart'); }
function glSheetHTML() {
  glFields(S);
  const st = GL.st, parts = [], m = (st && st.month) || glMonth(), mine = Math.max((st && st.mine) | 0, S.goal.sent[m] | 0);
  parts.push(`<div class="gl-head"><span class="gl-ic" aria-hidden="true">${glGeraldArt()}</span><div><h3>${esc(tt('gl.goal_line', '{goal} belly rubs in {month}', { goal: tnum((st && st.goal) || 10000), month: glMonthName(m) }))}</h3>`
    + `<p class="small">${esc(tt('gl.intro', 'One goal for the whole town. Every pet counts 1 and every walk counts 3. No names, no ranks: just the town together.'))}</p></div></div>`);
  if (st) {
    const f = glFill(st), pct = Math.floor(glFrac(st) * 100);
    parts.push(`<div class="gl-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${(f * 100).toFixed(1)}%"></i></div>`
      + `<p class="gl-num">${esc(tt('gl.so_far', 'Belly rubs so far: {n} of {goal}', { n: tnum(st.n), goal: tnum(st.goal) }))}</p>`);
    parts.push(`<p class="gl-mine">${esc(mine > 0 ? tt('gl.mine', 'You added {n} this month. Thank you!', { n: tnum(mine) }) : tt('gl.mine_0', 'Pet your dog or go for a walk to add your first belly rubs.'))}</p>`);
    if (st.done) parts.push(`<p class="gl-done">${esc(tt('gl.done', 'The town did it! Thank you for every belly rub. A new goal starts next month.'))}</p>`);
  } else parts.push(`<p class="gl-off">${esc(tt('gl.offline', 'The board can\'t be read right now. Your belly rubs are kept and sent later.'))}</p>`);
  if (S.goal.q > 0) parts.push(`<p class="small gl-wait">${esc(tt('gl.waiting', '{n} of yours are on their way to the board.', { n: tnum(S.goal.q) }))}</p>`);
  parts.push(`<div class="gl-gift"><span class="art" aria-hidden="true">${glTreatArt()}</span><p class="small">${esc(st && st.done ? tt('gl.gift_done', 'Everyone who helped this month gets a treat bag from Gerald: {gift}.', { gift: glTreatLine() }) : tt('gl.gift', 'When the town gets there, everyone who helped gets a treat bag from Gerald: {gift}. If the town is not there by the end of the month, nothing is lost: a new goal simply starts.', { gift: glTreatLine() }))}</p></div>`);
  return `<div class="gl gl-page">${parts.join('')}</div>`; // art review 4: Gerald's notice on ruled paper
}
function glTreatArt() { try { return itemArt(GL_TREATS[0][0]); } catch (e) { return ICON('star'); } }
function glOpen() {
  if (!S || !glOn()) return null;
  const p = openModal(esc(tt('gl.title', 'Town goal')), glSheetHTML(), { cls: 'gl-sheet' });
  const redraw = () => { const b = $('.panel-body', p); if (b && !modal.hidden && p.isConnected && b.querySelector('.gl')) b.innerHTML = glSheetHTML(); };
  Promise.resolve(glPost(true)).then(() => glFetch(false)).then(redraw).catch(() => {});
  return p;
}

/* ---------------- start-up, the tick ---------------- */
function glExpose() {
  if (!window.__paw || window.__paw.gl) return;
  window.__paw.gl = {
    on: () => glOn(), fields: (s) => glFields(s), add: (n) => glAdd(n), post: (f) => glPost(f), fetch: (f) => glFetch(f), state: () => GL.st, gift: (st, cur) => glGift(st, cur), open: () => glOpen(),
    every: GL_EVERY, max: GL_POST, treats: GL_TREATS.map((x) => x.slice()), board: () => glBoardDraw(), link: () => glLinkHTML(), fill: (st) => glFill(st), month: () => glMonth(), act: (k, d) => trackAct(k, d || {}), drop: () => { GL.st = null; GL.at = 0; }, set: (st) => { GL.st = st; GL.at = Date.now(); }, test: (v) => { prefs.btTest = !!v; window.__ddGlMode = v ? 'on' : undefined; window.__ddFiMode = v ? 'guest' : undefined; }
  };
}
on('game:ready', () => {
  if (S) glFields(S); setTimeout(glExpose, 0);
  setTimeout(() => { if (!S || !glOn()) return; Promise.resolve(typeof clStart === 'function' ? clStart() : null).then(() => pmCloudIdle()).then(() => glFetch(true)).then(() => glPost(false)).catch(() => {}); }, 2200);
});
on('yard:enter', () => { if (S) glFields(S); glExpose(); glBoardDraw(); });
on('scene:redraw', () => { if (cur.mode === 'yard' && S && S.place === 'square' && glOn() && !document.querySelector('#view svg.world #glG')) glBoardDraw(); });
on('env:season', () => { if (cur.mode === 'yard') glBoardDraw(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S && glLive() && S.goal && S.goal.q > 0 && Date.now() - S.goal.at >= GL_EVERY) glPost(false); });
setInterval(() => { try { if (S && glLive()) glPost(false); } catch (e) { /* a tick never breaks the game */ } }, 30e3);
setTimeout(glExpose, 0);
