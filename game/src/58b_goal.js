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
  if (!btOn()) return false;
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
    if (!r || r.status === 429 || r.status >= 500 || r.status === 401) return null; // later (the 2-minute gap, busy, a login gone)
    g.q = Math.max(0, g.q - n);
    if (r.ok && r.data && typeof r.data.month === 'string') {
      const d = r.data; g.sent[d.month] = (g.sent[d.month] | 0) + Math.max(0, d.took | 0);
      GL.st = Object.assign({}, GL.st || {}, { month: d.month, goal: d.goal, n: d.n, done: !!d.done, mine: d.mine | 0 }); GL.at = Date.now();
      glGift(GL.st); glMiniDraw();
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
    if (!r || !r.ok || !r.data || typeof r.data.month !== 'string') return null;
    GL.st = r.data; GL.at = Date.now();
    if (S) { glGift(r.data); if (r.data.last) glGift(r.data.last); }
    glMiniDraw();
    return GL.st;
  })().finally(() => { GL.getP = null; });
  return GL.getP;
}

/* ---------------- the gift, and the kind letter for a missed month ---------------- */
const glTreatLine = () => tlist(GL_TREATS.map(([n, q]) => tt('pm.treat_n', '{n} × {item}', { n: tnum(q), item: homeName(n) })));
// st: { month, goal, n, done, mine } for one month. Gives the treat bag once per month (S.goal.got); the "So close!" letter once, only for a month that is over
function glGift(st) {
  if (!S || !st || typeof st.month !== 'string' || !(st.mine > 0)) return null;
  glFields(S); const g = S.goal;
  if (g.got.includes(st.month)) return null;
  if (st.done) {
    g.got.push(st.month);
    GL_TREATS.forEach(([n, q]) => { S.inv.food[n] = (S.inv.food[n] || 0) + q; });
    mailPush({ kind: 'news', id: 'gl_' + st.month, keep: true, from: tt('ks.letter_from', 'Gerald'), title: tt('gl.done_title', 'The town did it!'),
      text: tt('gl.done_text', 'Dear friend,\nThe whole town reached the goal for {month}: {goal} belly rubs! You and {name} added {mine} of them.\nHere is a treat bag to say thank you: {gift}. It is in your pantry.\nWith a happy waddle,\nGerald', { month: glMonthName(st.month), goal: tnum(st.goal), name: NAME(), mine: tnum(st.mine), gift: glTreatLine() }) });
    setTimeout(() => toast(tt('gl.done_toast', 'The town reached its goal! Gerald sent you a treat bag.'), 'gold'), 400);
    markDirty(); saveNow();
    return 'gift';
  }
  if (st.month < glMonth() && g.miss < st.month) {
    g.miss = st.month;
    mailPush({ kind: 'news', id: 'gl_miss_' + st.month, from: tt('ks.letter_from', 'Gerald'), title: tt('gl.miss_title', 'So close!'),
      text: tt('gl.miss_text', 'Dear friend,\nIn {month} the town got to {n} of {goal} belly rubs. Not quite there, and that is just fine. Thank you for the {mine} you and {name} added!\nA new goal starts this month, and every belly rub counts again.\nWith a happy waddle,\nGerald', { month: glMonthName(st.month), n: tnum(st.n), goal: tnum(st.goal), mine: tnum(st.mine), name: NAME() }) });
    markDirty(); saveNow();
    return 'miss';
  }
  return null;
}

/* ---------------- the Square: a Town goal button with a tiny meter, and Gerald's notice ---------------- */
const glFrac = (st) => (st && st.goal > 0 ? Math.max(0, Math.min(1, st.n / st.goal)) : 0);
function glMiniDraw() { const i = document.querySelector('#placeBtns [data-gl] .gl-mini i'); if (i) i.style.width = (glFrac(GL.st) * 100).toFixed(1) + '%'; }
function glPlaceBtn() {
  const pb = $('#placeBtns'); if (!pb) return; pb.querySelectorAll('[data-gl]').forEach((b) => b.remove());
  if (cur.mode !== 'yard' || !S || S.place !== 'square' || !glOn()) return;
  const html = `<button class="btn yes gl-btn" type="button" data-gl="board"><span class="gl-btn-t">${esc(tt('gl.btn', 'Town goal'))}</span><span class="gl-mini" aria-hidden="true"><i style="width:${(glFrac(GL.st) * 100).toFixed(1)}%"></i></span></button>`;
  const before = pb.querySelector('[data-pr]') || pb.querySelector('[data-pb="yard"]');
  if (before) before.insertAdjacentHTML('beforebegin', html); else pb.insertAdjacentHTML('beforeend', html);
  pb.querySelector('[data-gl]').onclick = () => { if (typeof blOn === 'function' && blOn()) return; SFX.click(); glOpen(); };
  glFetch(false).catch(() => {});
}
function glSheetHTML() {
  glFields(S);
  const st = GL.st, parts = [], m = (st && st.month) || glMonth(), mine = Math.max((st && st.mine) | 0, S.goal.sent[m] | 0);
  parts.push(`<div class="gl-head"><span class="gl-ic" aria-hidden="true">${ICON('heart')}</span><div><h3>${esc(tt('gl.goal_line', '{goal} belly rubs in {month}', { goal: tnum((st && st.goal) || 50000), month: glMonthName(m) }))}</h3>`
    + `<p class="small">${esc(tt('gl.intro', 'One goal for the whole town. Every pet counts 1 and every walk counts 3. No names, no ranks: just the town together.'))}</p></div></div>`);
  if (st) {
    const frac = glFrac(st), pct = Math.floor(frac * 100);
    parts.push(`<div class="gl-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${(frac * 100).toFixed(1)}%"></i></div>`
      + `<p class="gl-num">${esc(tt('gl.so_far', 'Belly rubs so far: {n} of {goal}', { n: tnum(st.n), goal: tnum(st.goal) }))}</p>`);
    parts.push(`<p class="gl-mine">${esc(mine > 0 ? tt('gl.mine', 'You added {n} this month. Thank you!', { n: tnum(mine) }) : tt('gl.mine_0', 'Pet your dog or go for a walk to add your first belly rubs.'))}</p>`);
    if (st.done) parts.push(`<p class="gl-done">${esc(tt('gl.done', 'The town did it! Thank you for every belly rub. A new goal starts next month.'))}</p>`);
  } else parts.push(`<p class="gl-off">${esc(tt('gl.offline', 'The board can\'t be read right now. Your belly rubs are kept and sent later.'))}</p>`);
  if (S.goal.q > 0) parts.push(`<p class="small gl-wait">${esc(tt('gl.waiting', '{n} of yours are on their way to the board.', { n: tnum(S.goal.q) }))}</p>`);
  parts.push(`<div class="gl-gift"><span class="art" aria-hidden="true">${glTreatArt()}</span><p class="small">${esc(st && st.done ? tt('gl.gift_done', 'Everyone who helped this month gets a treat bag from Gerald: {gift}.', { gift: glTreatLine() }) : tt('gl.gift', 'When the town gets there, everyone who helped gets a treat bag from Gerald: {gift}. If the town is not there by the end of the month, nothing is lost: a new goal simply starts.', { gift: glTreatLine() }))}</p></div>`);
  return `<div class="gl">${parts.join('')}</div>`;
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
    on: () => glOn(), fields: (s) => glFields(s), add: (n) => glAdd(n), post: (f) => glPost(f), fetch: (f) => glFetch(f), state: () => GL.st, gift: (st) => glGift(st), open: () => glOpen(),
    every: GL_EVERY, max: GL_POST, treats: GL_TREATS.map((x) => x.slice()), btn: () => glPlaceBtn(), month: () => glMonth(), act: (k, d) => trackAct(k, d || {}), drop: () => { GL.st = null; GL.at = 0; }
  };
}
on('game:ready', () => {
  if (S) glFields(S); setTimeout(glExpose, 0);
  setTimeout(() => { if (!S || !glOn()) return; Promise.resolve(typeof clStart === 'function' ? clStart() : null).then(() => pmCloudIdle()).then(() => glFetch(true)).then(() => glPost(false)).catch(() => {}); }, 2200);
});
on('yard:enter', () => { if (S) glFields(S); glExpose(); glPlaceBtn(); });
on('scene:redraw', () => { if (cur.mode === 'yard' && S && S.place === 'square' && glOn() && !$('#placeBtns [data-gl]')) glPlaceBtn(); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && S && glLive() && S.goal && S.goal.q > 0 && Date.now() - S.goal.at >= GL_EVERY) glPost(false); });
setInterval(() => { try { if (S && glLive()) glPost(false); } catch (e) { /* a tick never breaks the game */ } }, 30e3);
setTimeout(glExpose, 0);
