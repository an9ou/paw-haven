/* ======================= v2.2 CLOUD: real-time cloud save (CLOUD lane, tag cl) ======================= */
// PHONE.md section 3. Local first: saveNow() writes localStorage as before, then clOnSaved() schedules a push about 2 s later.
// The game never waits on the network. The newer changed_at always wins and the losing save goes to save_backups.
// A "change" is a save that follows real player input (tap, click, key). Saves made only by the clock ticking are not pushed,
// so an idle device left open never overwrites the device the player is actually using.
// Cloud is OFF on the claude.ai artifact (its sandbox blocks outside servers) and under the test harness (navigator.webdriver)
// unless a test installs window.__pawCloudMock (a fake supabase-js with createClient).
const CL = {
  inited: false, on: false, why: '', sb: null, libP: null, startP: null, signP: null,
  uid: null, email: '', anon: true, ch: null,
  timer: null, retryT: null, applyT: null, busy: false, again: false, flush: false,
  err: '', lastSync: 0, lastPull: 0, inputAt: 0, savedAt: 0,
  pending: null, ready: false, offShown: false, regPath: '', ui: '', msg: '', bk: null, code: '',
  started: false, out: false // v2.3 title: the first start finished / logged out on this page
};
function clMeta() { let m = null; try { m = JSON.parse(lsGet(CL_CFG.metaKey) || 'null'); } catch (e) { m = null; } return Object.assign({ rev: 0, changedAt: 0, pushedAt: 0, uid: null, dogId: null, nudged: false }, m || {}); }
function clMetaSet(patch) { const m = Object.assign(clMeta(), patch); lsSet(CL_CFG.metaKey, JSON.stringify(m)); return m; }
function clHost() { return String(window.__pawCloudHost || location.hostname || ''); }
function clArtifact() {
  const h = clHost();
  if (/(^|\.)(claude\.ai|claudeusercontent\.com|claude\.site|anthropic\.com)$/i.test(h)) return true;
  if (window.__pawCloudHost) return false;
  return location.protocol !== 'file:' && (window.origin === 'null' || location.protocol === 'about:' || location.protocol === 'blob:' || location.protocol === 'data:');
}
function clModeOf() { if (clArtifact()) return 'artifact'; if (navigator.webdriver && !window.__pawCloudMock) return 'harness'; return 'on'; }
function clLocal() { try { const s = JSON.parse(lsGet(SAVE_KEY) || 'null'); return s && s.v === 1 && (s.dog || (s.dogs && s.dogs.length)) ? s : null; } catch (e) { return null; } }
function clDogId(d) { return d && d.dogs && d.dogs[0] ? d.dogs[0].id || null : null; }
function clStrip(d) { return JSON.stringify(d, (k, v) => (k === 'lastReal' ? undefined : v)); }
// what counts as a real change: the save without the fields the clock moves on its own (live check fix: a device where the
// player only tapped through menus must not out-date another device's real progress)
const CL_TICK_KEYS = new Set(['lastReal', 'gameMin', 'stats', 'lastOut', 'drainAt']); // drainAt: a per-page timer on yard messes
function clFp(d) { try { return JSON.stringify(d, (k, v) => (CL_TICK_KEYS.has(k) ? undefined : v)); } catch (e) { return ''; } }
function clSame(a, b) { try { return clStrip(a) === clStrip(b); } catch (e) { return false; } }
function clDevice() {
  const u = navigator.userAgent || '';
  const os = /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) ? 'iPad' : /Android/.test(u) ? 'Android' : /Mac OS X/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : /Linux/.test(u) ? 'Linux' : 'Device';
  const br = /Edg\//.test(u) ? 'Edge' : /Firefox\//.test(u) ? 'Firefox' : /CriOS|Chrome\//.test(u) ? 'Chrome' : /Safari\//.test(u) ? 'Safari' : 'Browser';
  return os + ' ' + br;
}
function clToast(t, kind) { if (S) toast(t, kind || ''); }
// v2.3 review fix: which account the local save belongs to (meta.owner, tied to the save's dog id so a new game or reset drops it).
// A save owned by an account is never pushed or backed up anywhere else (a guest included): the next player may be someone else.
function clOwner() { const m = clMeta(), l = clLocal(); return m.owner && l && clDogId(l) === m.ownerDog ? m.owner : null; }
function clOwn(uid) { clMetaSet({ owner: uid || null, ownerDog: uid ? clDogId(clLocal()) : null }); }
function clMine() { const o = clOwner(); return !o || o === CL.uid; } // may the local save go to the signed-in user's cloud?
function clMask(e) { const m = String(e || '').match(/^(.)[^@]*@(.+)$/); return m ? `${m[1]}…@${m[2]}` : 'your account'; }

/* ---------- start-up ---------- */
// hook from 00_core.js, after the local save is read (it runs often: only the first call does anything)
function clOnLoaded() {
  if (CL.inited) return; CL.inited = true; CL.fp = clFp(clLocal());
  const mode = clModeOf(); CL.why = mode === 'on' ? '' : mode; CL.on = mode === 'on';
  const mark = () => { CL.inputAt = Date.now(); };
  window.addEventListener('pointerdown', mark, { capture: true, passive: true }); window.addEventListener('keydown', mark, { capture: true });
  if (!CL.on) return;
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') clFlush(); else clPullSoon(); });
  window.addEventListener('pagehide', clFlush);
  window.addEventListener('focus', clPullSoon);
  window.addEventListener('online', () => { CL.err = ''; clStart().then(() => { clPull(); clPush(); }); });
  setTimeout(() => { clStart().then(() => { if (CL.uid) clPull(); }); }, 0);
}
on('game:ready', () => { CL.ready = true; clOnLoaded(); });
setTimeout(clOnLoaded, 0); // also covers a hot-reload start, which skips loadSave()

function clLib() {
  if (window.__pawCloudMock) return Promise.resolve(window.__pawCloudMock);
  if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
  if (!CL.libP) {
    CL.libP = new Promise((res, rej) => {
      const s = document.createElement('script'); s.src = CL_CFG.lib; s.async = true; s.crossOrigin = 'anonymous';
      const t = setTimeout(() => rej(new Error('timeout')), 15000);
      s.onload = () => { clearTimeout(t); window.supabase && window.supabase.createClient ? res(window.supabase) : rej(new Error('no lib')); };
      s.onerror = () => { clearTimeout(t); rej(new Error('blocked')); };
      document.head.appendChild(s);
    });
    CL.libP.catch(() => { CL.libP = null; });
  }
  return CL.libP;
}
// small keepalive requests survive the page closing (the browser caps keepalive bodies at 64 KB)
function clFetch(u, o) { return fetch(u, CL.flush && o && typeof o.body === 'string' && o.body.length < 60000 ? Object.assign({}, o, { keepalive: true }) : o); }
function clStart() {
  if (!CL.on) return Promise.resolve(false);
  if (CL.sb) return Promise.resolve(true);
  if (!CL.startP) {
    CL.startP = (async () => {
      try {
        const lib = await clLib();
        CL.sb = lib.createClient(CL_CFG.url, CL_CFG.key, { auth: { storageKey: CL_CFG.authKey, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }, global: { fetch: clFetch } });
        const r = await CL.sb.auth.getSession(); const ses = r && r.data && r.data.session;
        if (ses && ses.user) clSetUser(ses.user);
        else if (clLocal() && !clOwner()) await clEnsureUser(); // an account's save after a log out stays on this device only
        CL.err = ''; clRender(); return true;
      } catch (e) {
        CL.sb = null; clOffline(); return false;
      } finally { CL.startP = null; CL.started = true; titleAcctRender(); }
    })();
  }
  return CL.startP;
}
function clOffline() {
  CL.err = 'offline'; clRender();
  if (!CL.offShown && S) { CL.offShown = true; clToast('Cloud save is offline. Your game is saved on this device.'); } // once, as soon as there is a game to keep
  clearTimeout(CL.retryT); CL.retryT = setTimeout(() => { CL.retryT = null; clStart().then((ok) => { if (ok && CL.uid) { clPull(); clPush(); } }); }, 20000);
}
async function clEnsureUser() {
  if (CL.uid) return true;
  if (!(await clStart()) || !CL.sb) return false;
  if (CL.uid) return true;
  if (!CL.signP) {
    CL.signP = (async () => {
      const r = await CL.sb.auth.signInAnonymously();
      if (r.error || !r.data || !r.data.user) throw r.error || new Error('no user');
      clSetUser(r.data.user); return true;
    })().catch(() => { clOffline(); return false; }).finally(() => { CL.signP = null; });
  }
  return CL.signP;
}
function clSetUser(u) {
  CL.uid = u.id; CL.email = u.email || ''; CL.anon = u.is_anonymous === true || !u.email; CL.out = false;
  const m = clMeta(); if (m.uid !== u.id) clMetaSet({ uid: u.id, rev: 0, pushedAt: 0 });
  if (!CL.anon && clLocal() && !clOwner() && !CL.loggingIn) clOwn(u.id); // a guest game upgraded to this account
  clSub(); clRender();
}
function clSub() {
  if (!CL.sb || !CL.uid) return;
  if (CL.ch) { try { CL.sb.removeChannel(CL.ch); } catch (e) { /* gone */ } CL.ch = null; }
  try {
    CL.ch = CL.sb.channel('paw-save-' + CL.uid)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'saves', filter: 'user_id=eq.' + CL.uid }, (p) => { const row = p && p.new; if (row && row.user_id === CL.uid) { if (row.data) clRemote(row); else clPull(); } })
      .subscribe();
  } catch (e) { CL.ch = null; }
}

/* ---------- push ---------- */
// hook from 00_core.js saveNow(), right after localStorage was written
function clOnSaved() {
  if (!CL.on) return;
  const fp = clFp(clLocal()), changed = CL.inputAt > CL.savedAt && fp !== CL.fp; CL.savedAt = Date.now(); CL.fp = fp;
  if (changed) { clMetaSet({ changedAt: Math.max(CL.inputAt, clMeta().changedAt || 0) }); clSchedule(); } // the time the player acted, not the autosave time: a device that only loaded or rolled over a day is never "newer"
  clNudge();
}
function clSchedule() { if (!CL.on || CL.timer) return; CL.timer = setTimeout(() => { CL.timer = null; clPush(); }, CL_CFG.pushMs); clStat(); }
function clFlush() {
  if (!CL.on) return; const m = clMeta();
  if (!CL.timer && m.changedAt <= m.pushedAt) return;
  clearTimeout(CL.timer); CL.timer = null; CL.flush = true; clPush().finally(() => { CL.flush = false; });
}
async function clBackup(data, reason) {
  if (!CL.sb || !CL.uid || !data) return false;
  try { const r = await CL.sb.from('save_backups').insert({ user_id: CL.uid, data, reason }); return !r.error; } catch (e) { return false; }
}
async function clPush(force) {
  if (!CL.on) return;
  if (CL.loggingIn && !force) return; // review fix: never push the guest game onto the account mid-login
  if (CL.busy) { CL.again = true; return; }
  let m = clMeta(); const data = clLocal();
  if (!data || (!force && m.rev && m.changedAt <= m.pushedAt)) { clStat(); return; }
  if (!clMine()) { clStat(); return; } // another account's game: never into this cloud
  if (CL.pending && !force) { if (Date.parse(CL.pending.changed_at) > m.changedAt) return; CL.pending = null; }
  CL.busy = true; clStat();
  try {
    if (!(await clEnsureUser())) return;
    m = clMeta(); const changedAt = m.changedAt || Date.now(), uid = CL.uid;
    const q = await CL.sb.from('saves').select('rev,changed_at').eq('user_id', uid).maybeSingle();
    if (q.error) throw q.error;
    const row = q.data;
    if (row && row.rev > (m.rev || 0)) { // another device saved since we last looked
      if (Date.parse(row.changed_at) > changedAt && !force) { // theirs is newer: ours loses
        await clBackup(data, 'older than your other device'); clMetaSet({ pushedAt: changedAt });
        CL.busy = false; await clPull(); return;
      }
      const full = await CL.sb.from('saves').select('data').eq('user_id', uid).maybeSingle();
      if (full.data && full.data.data && !clSame(full.data.data, data)) await clBackup(full.data.data, 'older than your other device');
    } else if (row && m.dogId && clDogId(data) !== m.dogId) { // "New dog" or "Reset save" on this device: keep the old dog's cloud save
      const full = await CL.sb.from('saves').select('data').eq('user_id', uid).maybeSingle();
      if (full.data && full.data.data) await clBackup(full.data.data, 'before a new game');
    }
    const rev = Math.max(row ? row.rev : 0, m.rev || 0) + 1;
    const up = await CL.sb.from('saves').upsert({ user_id: uid, data, rev, changed_at: new Date(changedAt).toISOString(), device: clDevice() }, { onConflict: 'user_id' });
    if (up.error) throw up.error;
    if (uid === CL.uid) { clMetaSet({ rev, pushedAt: changedAt, dogId: clDogId(data) }); CL.lastSync = Date.now(); CL.err = ''; if (!CL.anon) clOwn(uid); }
  } catch (e) {
    CL.err = 'offline'; clearTimeout(CL.retryT); CL.retryT = setTimeout(() => { CL.retryT = null; CL.err = ''; clPush(); }, 15000);
  } finally {
    CL.busy = false; clStat();
    if (CL.again) { CL.again = false; clPush(); }
  }
}

/* ---------- pull ---------- */
function clPullSoon() { if (!CL.on || Date.now() - CL.lastPull < CL_CFG.pullGapMs) return; clPull(); }
async function clPull() {
  if (!CL.on || !CL.sb || !CL.uid) return;
  CL.lastPull = Date.now();
  try {
    const q = await CL.sb.from('saves').select('*').eq('user_id', CL.uid).maybeSingle();
    if (q.error) throw q.error;
    if (!q.data) { if (clLocal()) { const m = clMeta(); clMetaSet({ changedAt: m.changedAt || Date.now(), rev: 0 }); clPush(true); } return; }
    CL.err = ''; clRemote(q.data);
  } catch (e) { CL.err = 'offline'; clStat(); }
}
// a cloud row arrived (pull or Realtime). The newer changed_at wins, every time, with no question asked.
function clRemote(row) {
  const m = clMeta(); if (!row || !row.data) return;
  if (row.rev <= (m.rev || 0)) { CL.lastSync = CL.lastSync || Date.now(); clStat(); return; } // our own save coming back, or one we already have
  const rt = Date.parse(row.changed_at) || 0, local = clLocal();
  if (local && clSame(local, row.data)) { clMetaSet({ rev: row.rev, changedAt: Math.max(m.changedAt, rt), pushedAt: Math.max(m.changedAt, rt) }); CL.lastSync = Date.now(); clStat(); return; }
  if (!local || rt > (m.changedAt || 0)) {
    if (local && m.changedAt > (m.pushedAt || 0) && clMine()) clBackup(local, 'older than your other device'); // changes that never reached the cloud
    CL.pending = row; clApplySoon(); return;
  }
  clPush(true); // ours is newer: the push backs theirs up first
}
function clIdle() {
  if (!['title', 'yard', 'market', 'map'].includes(cur.mode) || !modal.hidden) return false;
  if (cur.mode === 'yard' && typeof popOpen === 'function' && popOpen()) return false;
  if (typeof psSheetOpen === 'function' && psSheetOpen()) return false;
  return !document.querySelector('.buyveil, .onway');
}
function clApplySoon() {
  if (CL.applyT) return;
  const tryIt = () => { if (!CL.pending) { clearInterval(CL.applyT); CL.applyT = null; return; } if (clIdle()) { clearInterval(CL.applyT); CL.applyT = null; const r = CL.pending; clApply(r.data, r, 'Synced from your other device.'); } };
  CL.applyT = setInterval(tryIt, 1000); tryIt();
}
// load a save into the running game. row: the cloud row it came from (null for an import or a restore)
function clApply(data, row, msg) {
  CL.pending = null;
  if (!data || data.v !== 1 || !(data.dog || (data.dogs && data.dogs.length))) return false;
  lsSet(SAVE_KEY, JSON.stringify(data)); CL.fp = clFp(data);
  if (row) { const t = Date.parse(row.changed_at) || Date.now(); clMetaSet({ rev: row.rev, changedAt: t, pushedAt: t, dogId: clDogId(data) }); CL.lastSync = Date.now(); }
  clOwn(row && CL.uid && !CL.anon ? CL.uid : null); // an import or restore is the player's own pick: it goes to whoever is signed in
  CL.savedAt = Date.now();
  const onTitle = cur.mode === 'title' || cur.mode === 'adopt' || !cur.mode;
  S = loadSave(); hudDogKey = ''; if (typeof coatCache !== 'undefined' && coatCache.clear) coatCache.clear();
  if (!S) return false;
  if (!onTitle) { if (!modal.hidden) closeModal(); applyAway(); gardenAdvance(); birthdayCheck(); go('yard'); }
  else go('title');
  if (!CL.ready) emit('game:ready', { fresh: false });
  if (msg) toast(msg, 'good');
  clStat(); return true;
}

/* ---------- accounts ---------- */
const CL_PW_MIN = 8;
function clErrText(e) {
  const s = String((e && (e.message || e.code)) || e || '');
  if (/invalid.*(login|credential)|invalid_credentials/i.test(s)) return "That email and password don't match. Check them and try again.";
  if (/already|exists|registered|taken/i.test(s)) return 'That email already has an account. Log in instead.';
  if (/password/i.test(s) && /(short|weak|least|characters)/i.test(s)) return `Pick a password with at least ${CL_PW_MIN} characters.`;
  if (/email/i.test(s) && /invalid|format/i.test(s)) return 'That email looks wrong. Check it and try again.';
  if (/fetch|network|offline|timeout|blocked|load/i.test(s)) return 'Cloud save is offline. Your game is saved on this device.';
  return 'That did not work. Try again in a moment.';
}
// v2.3 review fix: before the signed-in user changes, its last changes reach its own cloud. Waits out a push in flight (a busy push
// only marks CL.again), then pushes what is left. Callers set CL.loggingIn first, so no other push starts meanwhile.
async function clFlushNow() {
  clearTimeout(CL.timer); CL.timer = null;
  const idle = async () => { for (let i = 0; i < 300 && CL.busy; i++) await new Promise((res) => setTimeout(res, 50)); };
  await idle(); CL.again = false;
  const m = clMeta(); if (CL.uid && clLocal() && clMine() && m.changedAt > (m.pushedAt || 0)) { await clPush(true); await idle(); }
}
function clDropLocal() { lsDel(SAVE_KEY); S = null; CL.fp = clFp(null); CL.pending = null; clMetaSet({ rev: 0, changedAt: 0, pushedAt: 0, dogId: null, owner: null, ownerDog: null }); }
// fresh (v2.3 title "Switch" while logged in to an account): skip updateUser, which would rename the current account.
// The new account starts with no game: the old account's dogs stay in the old account (they may be someone else's).
async function clRegister(email, pw, fresh) {
  if (!(await clEnsureUser())) return { ok: false, msg: 'Cloud save is offline. Your game is saved on this device.' };
  if (!fresh) {
    const r = await CL.sb.auth.updateUser({ email, password: pw });
    if (r.error) return { ok: false, msg: clErrText(r.error) };
    const u = r.data && r.data.user;
    if (u && u.email && u.email.toLowerCase() === email.toLowerCase()) { // the guest became the account: same user id, same save
      CL.regPath = 'updateUser'; clSetUser(u); if (!clMine()) clDropLocal(); clRender(); return { ok: true };
    }
  }
  // the project still wants the email change confirmed: make a fresh account instead and give it this device's save
  clearTimeout(CL.timer); CL.timer = null; CL.loggingIn = true; // v2.3 fix (TODO "register fallback"): no guest push mid-switch, like clLogin
  try {
    if (CL.uid && !CL.anon) await clFlushNow(); // an account's last changes go to its own cloud first (a guest's game comes along anyway)
    const r2 = await CL.sb.auth.signUp({ email, password: pw });
    if (r2.error) return { ok: false, msg: clErrText(r2.error) };
    if (!r2.data || !r2.data.session || !r2.data.user) return { ok: false, msg: 'That did not work. Try again in a moment.' };
    CL.regPath = 'signUp'; clSetUser(r2.data.user);
    if (!clMine()) clDropLocal(); // another account's game stays with that account
    if (clLocal()) { clMetaSet({ changedAt: Math.max(clMeta().changedAt, 1), rev: 0, pushedAt: 0 }); await clPush(true); }
    return { ok: true };
  } finally { CL.loggingIn = false; CL.again = false; }
}
async function clLogin(email, pw) {
  if (!(await clStart())) return { ok: false, msg: 'Cloud save is offline. Your game is saved on this device.' };
  clearTimeout(CL.timer); CL.timer = null; CL.loggingIn = true; // the scheduled guest push must not run after the switch
  try {
    await clFlushNow(); // the signed-in user's last changes reach its own cloud first
    const local = clLocal(), owner = clOwner();
    const r = await CL.sb.auth.signInWithPassword({ email, password: pw });
    if (r.error || !r.data || !r.data.user) return { ok: false, msg: clErrText(r.error || 'invalid login') };
    const other = !!owner && r.data.user.id !== owner; // another account's game (maybe another person's) never goes into this one, backups included
    clSetUser(r.data.user);
    const q = await CL.sb.from('saves').select('*').eq('user_id', CL.uid).maybeSingle();
    if (q.data && q.data.data) {
      if (local && !other && !clSame(local, q.data.data)) await clBackup(local, 'guest save before sign-in');
      clApply(q.data.data, q.data, null); return { ok: true, loaded: true };
    }
    if (other) { clDropLocal(); return { ok: true, loaded: false }; } // no save here: the other account's dogs leave this device (they are safe in its cloud)
    if (local) { clOwn(CL.uid); clMetaSet({ changedAt: Date.now(), rev: 0, pushedAt: 0 }); await clPush(true); }
    return { ok: true, loaded: false };
  } finally { CL.loggingIn = false; CL.again = false; }
}
async function clLogout() {
  CL.loggingIn = true; try { await clFlushNow(); } finally { CL.loggingIn = false; CL.again = false; } // the last ~2 s reach this account, not the next guest
  if (CL.sb) { if (CL.ch) { try { CL.sb.removeChannel(CL.ch); } catch (e) { /* gone */ } CL.ch = null; } try { await CL.sb.auth.signOut(); } catch (e) { /* offline: the local copy is still logged out below */ } }
  CL.uid = null; CL.email = ''; CL.anon = true; CL.lastSync = 0; CL.pending = null;
  clMetaSet({ uid: null, rev: 0, pushedAt: 0 }); // the next change makes a fresh guest that carries this device's save
  CL.out = true; titleAcctRender();
}
async function clChangePw(pw) {
  if (!CL.sb || !CL.uid) return { ok: false, msg: 'Log in first.' };
  const r = await CL.sb.auth.updateUser({ password: pw });
  return r.error ? { ok: false, msg: clErrText(r.error) } : { ok: true };
}
async function clBackups() {
  if (!(await clStart()) || !CL.uid) return null;
  const q = await CL.sb.from('save_backups').select('id,data,reason,created_at').eq('user_id', CL.uid).order('created_at', { ascending: false }).limit(5);
  return q.error ? null : q.data || [];
}
// restoring makes the backup the newest save (the current game becomes a backup first)
async function clRestore(b) {
  const cur0 = clLocal(); if (cur0) { lsSet(CL_CFG.backupKey, JSON.stringify(cur0)); if (clMine()) await clBackup(cur0, 'before a restore'); }
  if (!clApply(b.data, null, 'Backup restored.')) return false;
  clMetaSet({ changedAt: Date.now() }); clPush(true); return true;
}

/* ---------- Export / Import save code (every copy, cloud or not) ---------- */
function clSum(s) { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return (h >>> 0).toString(16).padStart(8, '0'); }
function clB64(bytes) { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000)); return btoa(s); }
function clUnB64(b) { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; }
async function clZip(bytes, on) {
  const st = new Blob([bytes]).stream().pipeThrough(on ? new CompressionStream('gzip') : new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(st).arrayBuffer());
}
async function clExport() {
  saveNow(); const raw = lsGet(SAVE_KEY); if (!raw || !clLocal()) return '';
  const bytes = new TextEncoder().encode(raw), sum = clSum(raw);
  if (typeof CompressionStream === 'function') { try { return `PAWZ1.${clB64(await clZip(bytes, true))}.${sum}`; } catch (e) { /* plain code below */ } }
  return `PAW1.${clB64(bytes)}.${sum}`;
}
async function clDecode(code) {
  const c = String(code || '').replace(/\s+/g, ''); const parts = c.split('.');
  if (parts.length !== 3 || !/^PAWZ?1$/.test(parts[0])) throw new Error("That isn't a Paw Haven save code.");
  let raw;
  try { let b = clUnB64(parts[1]); if (parts[0] === 'PAWZ1') b = await clZip(b, false); raw = new TextDecoder().decode(b); } catch (e) { throw new Error('That save code is broken. Copy all of it and try again.'); }
  if (clSum(raw) !== parts[2]) throw new Error('That save code is broken. Copy all of it and try again.');
  let data; try { data = JSON.parse(raw); } catch (e) { throw new Error('That save code is broken. Copy all of it and try again.'); }
  if (!data || data.v !== 1 || !(data.dog || (data.dogs && data.dogs.length))) throw new Error("That save code has no dog in it.");
  return data;
}
async function clImport(code) {
  const data = await clDecode(code);
  const cur0 = clLocal();
  if (cur0) { lsSet(CL_CFG.backupKey, JSON.stringify(cur0)); if (CL.on && CL.uid && clMine()) await clBackup(cur0, 'before an import'); }
  clApply(data, null, null);
  if (CL.on) { clMetaSet({ changedAt: Date.now(), dogId: clDogId(data) }); clPush(true); } // dogId: the push must not back the old game up a second time
  return data;
}

/* ---------- the gentle nudge (once, after 3 care days) ---------- */
function clNudge() {
  if (!CL.on || !S || (S.careDays || 0) < 3 || (CL.uid && !CL.anon) || cur.mode === 'title' || !clIdle()) return;
  const m = clMeta(); if (m.nudged) return;
  clMetaSet({ nudged: true }); setTimeout(() => clToast(`Make an account to keep ${NAME()} safe on every device. It's in Settings.`, 'gold'), 600);
}

/* ---------- status (also read by the SHELL lane's menu) ---------- */
function clAgo(ms) { const s = Math.max(0, Math.round(ms / 1000)); return s < 60 ? `${s} s ago` : s < 3600 ? `${Math.floor(s / 60)} min ago` : `${Math.floor(s / 3600)} h ago`; }
function cloudStatus() {
  if (!CL.on) return { state: 'off', text: CL.why === 'artifact' ? 'Cloud save works on the web version.' : 'Cloud save is off here.' };
  if (CL.err) return { state: 'offline', text: 'Offline' };
  const m = clMeta();
  if (!clMine()) return { state: 'guest', text: 'Saved on this device' }; // another account's game after a log out: never synced here
  if (CL.timer || CL.busy || (CL.uid && m.changedAt > m.pushedAt)) return { state: 'syncing', text: 'Syncing' };
  if (CL.lastSync) return { state: 'synced', text: 'Synced ' + clAgo(Date.now() - CL.lastSync) };
  if (CL.uid && !CL.anon) return { state: 'account', text: 'Logged in as ' + clMask(CL.email) };
  return { state: 'guest', text: 'Guest' };
}
function cloudOpen() {
  openSettings();
  const box = document.getElementById('clBox'); if (box) requestAnimationFrame(() => box.scrollIntoView({ block: 'start' }));
}

/* ---------- Settings -> Cloud save (drawn inside openSettings) ---------- */
function clStatLine() {
  const st = cloudStatus();
  if (!CL.on) return st.text;
  if (CL.err) return 'Cloud save is offline. Your game is saved on this device.';
  const who = CL.uid && !CL.anon ? 'Logged in as ' + clMask(CL.email) : 'Guest';
  return st.state === 'synced' || st.state === 'syncing' ? `${who} · ${st.text}` : who;
}
function clStat() { const el = document.getElementById('clStat'); if (el) el.textContent = clStatLine(); }
function clSection() { return `<section class="clset" id="clBox" aria-label="Cloud save"><h4 class="clh">Cloud save</h4><p class="clstat" id="clStat" role="status">${esc(clStatLine())}</p><div id="clBody">${clBodyHTML()}</div><h4 class="clh">Save code</h4><div id="clCode">${clCodeHTML()}</div></section>`; }
const clIn = (id, type, label, ac) => `<label class="clfield" for="${id}"><span>${label}</span><input id="${id}" type="${type}" autocomplete="${ac}" ${type === 'email' ? 'inputmode="email" autocapitalize="off" spellcheck="false"' : ''}></label>`;
function clBodyHTML() {
  if (!CL.on) return CL.why === 'artifact' ? '<p class="small">This copy keeps your game on this device. Use a save code below to move it.</p>' : '';
  const msg = CL.msg ? `<p class="clmsg" role="alert">${esc(CL.msg)}</p>` : '';
  const acct = CL.uid && !CL.anon;
  if (CL.ui === 'reg') return `<div class="clform"><p>Keep my save on every device: make an account.</p>${clIn('clEmail', 'email', 'Email', 'username')}${clIn('clPw', 'password', `Password (${CL_PW_MIN} or more letters)`, 'new-password')}${clIn('clPw2', 'password', 'Password again', 'new-password')}${msg}<div class="clrow"><button class="btn" data-cl="back">Back</button><button class="btn yes" data-cl="doReg">Make account</button></div></div>`;
  if (CL.ui === 'login') return `<div class="clform"><p>I have an account: log in.</p>${clIn('clEmail', 'email', 'Email', 'username')}${clIn('clPw', 'password', 'Password', 'current-password')}${msg}<div class="clrow"><button class="btn" data-cl="back">Back</button><button class="btn yes" data-cl="doLogin">Log in</button></div><button class="btn cllink" data-cl="forgot">Forgot your password?</button></div>`;
  if (CL.ui === 'forgot') return `<div class="clform"><p>Passwords can't be reset by email. If you're logged in on another device, change it there.</p><p class="small">The save on this device is never lost.</p><div class="clrow"><button class="btn" data-cl="login">Back</button></div></div>`;
  if (CL.ui === 'pw') return `<div class="clform">${clIn('clPw', 'password', `New password (${CL_PW_MIN} or more letters)`, 'new-password')}${clIn('clPw2', 'password', 'New password again', 'new-password')}${msg}<div class="clrow"><button class="btn" data-cl="back">Back</button><button class="btn yes" data-cl="doPw">Change password</button></div></div>`;
  if (CL.ui === 'backups') {
    const list = CL.bk === null ? '<p class="small">Loading backups...</p>' : !CL.bk.length ? '<p class="small">No backups yet. When two devices disagree, the older save lands here.</p>' : `<ul class="clbk">${CL.bk.map((b, i) => { const d = b.data || {}, dogs = (d.dogs || (d.dog ? [d.dog] : [])).map((x) => x.name).filter(Boolean); return `<li><div class="clbk-t"><b>${esc(new Date(b.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }))}</b><span>${esc(dogs.join(', ') || 'A dog')} · ${d.coins | 0} coins</span><span class="small">${esc(b.reason || '')}</span></div><button class="btn" data-clrestore="${i}">Restore</button></li>`; }).join('')}</ul>`;
    return `<div class="clform">${list}${msg}<div class="clrow"><button class="btn" data-cl="back">Back</button></div></div>`;
  }
  if (acct) return `${msg}<div class="clrow"><button class="btn" data-cl="pw">Change password</button><button class="btn" data-cl="backups">Backups</button><button class="btn" data-cl="logout">Log out</button></div>`;
  return `${msg}<div class="clrow"><button class="btn yes" data-cl="reg">Make an account</button><button class="btn" data-cl="login">Log in</button>${CL.uid ? '<button class="btn" data-cl="backups">Backups</button>' : ''}</div><p class="small">Your game saves on this device and in the cloud as a guest. An account keeps it on every device.</p>`;
}
function clCodeHTML() {
  if (CL.ui === 'export') return `<div class="clform"><label class="clfield" for="clCodeOut"><span>Your save code</span><textarea id="clCodeOut" readonly rows="4">${esc(CL.code)}</textarea></label>${CL.msg ? `<p class="clmsg" role="status">${esc(CL.msg)}</p>` : ''}<div class="clrow"><button class="btn" data-cl="codeBack">Back</button><button class="btn yes" data-cl="copy">Copy</button></div></div>`;
  if (CL.ui === 'import') return `<div class="clform"><label class="clfield" for="clCodeIn"><span>Paste a save code</span><textarea id="clCodeIn" rows="4" autocapitalize="off" spellcheck="false"></textarea></label><p class="small">Your current game is backed up first.</p>${CL.msg ? `<p class="clmsg" role="alert">${esc(CL.msg)}</p>` : ''}<div class="clrow"><button class="btn" data-cl="codeBack">Back</button><button class="btn yes" data-cl="doImport">Load this save</button></div></div>`;
  return `<div class="clrow"><button class="btn" data-cl="export">Export save code</button><button class="btn" data-cl="import">Import save code</button></div>`;
}
function clRender() {
  titleAcctRender(); // v2.3: the title's account line follows the cloud state
  const box = document.getElementById('clBox'); if (!box) return;
  const b = document.getElementById('clBody'), c = document.getElementById('clCode');
  if (b) b.innerHTML = clBodyHTML(); if (c) c.innerHTML = clCodeHTML(); clStat();
}
function clGo(ui, msg) { CL.ui = ui; CL.msg = msg || ''; clRender(); const f = document.querySelector('#clBox input, #clBox textarea:not([readonly])'); if (f && ui) f.focus({ preventScroll: true }); }
function clBind(p) {
  const box = $('#clBox', p); if (!box) return;
  CL.ui = ''; CL.msg = ''; clRender();
  const iv = setInterval(() => { if (!document.getElementById('clStat')) { clearInterval(iv); return; } clStat(); }, 1000);
  const val = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
  box.addEventListener('click', async (e) => {
    const rb = e.target.closest('[data-clrestore]');
    if (rb) {
      const b = CL.bk && CL.bk[+rb.dataset.clrestore]; if (!b) return;
      const ok = await confirmIn(p, 'Load this backup? Your current game becomes a backup first.', 'Yes, restore', 'Not now'); if (!ok) return;
      await clRestore(b); return;
    }
    const k = e.target.closest('[data-cl]'); if (!k) return; const a = k.dataset.cl; SFX.click();
    if (a === 'back') return clGo('');
    if (a === 'reg' || a === 'login' || a === 'forgot' || a === 'pw') return clGo(a);
    if (a === 'backups') { CL.bk = null; clGo('backups'); CL.bk = (await clBackups()) || []; if (CL.ui === 'backups') clRender(); return; }
    if (a === 'logout') { const ok = await confirmIn(p, 'Log out? The game stays on this device.', 'Log out', 'Stay'); if (!ok) return; await clLogout(); clGo('', 'Logged out. Your game stays on this device.'); return; }
    if (a === 'doReg' || a === 'doPw') {
      const em = val('clEmail').trim(), pw = val('clPw'), pw2 = val('clPw2');
      if (a === 'doReg' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return clGo(CL.ui, 'That email looks wrong. Check it and try again.');
      if (pw.length < CL_PW_MIN) return clGo(CL.ui, `Pick a password with at least ${CL_PW_MIN} characters.`);
      if (pw !== pw2) return clGo(CL.ui, "The two passwords don't match.");
      k.disabled = true; CL.msg = '';
      const r = a === 'doReg' ? await clRegister(em, pw) : await clChangePw(pw);
      if (!r.ok) { clGo(CL.ui, r.msg); return; }
      if (a === 'doReg' && !clLocal()) { if (!modal.hidden) closeModal(); go('title'); return; } // the game on this device was another account's: it stayed with that account
      clGo('', a === 'doReg' ? `Account made. ${NAME()} is safe on every device now.` : 'Password changed.'); return;
    }
    if (a === 'doLogin') {
      const em = val('clEmail').trim(), pw = val('clPw'); if (!em || !pw) return clGo('login', 'Type your email and password.');
      k.disabled = true; const r = await clLogin(em, pw);
      if (!r.ok) { clGo('login', r.msg); return; }
      if (!r.loaded && !clLocal()) { if (!modal.hidden) closeModal(); go('title'); return; } // another account's game left this device
      if (r.loaded) { if (!modal.hidden) closeModal(); clToast('Logged in. Your saved game is here.', 'good'); } else clGo('', 'Logged in. This game is now saved to your account.');
      return;
    }
    if (a === 'export') { CL.code = await clExport(); if (!CL.code) return clGo('', ''); clGo('export'); const t = document.getElementById('clCodeOut'); if (t) t.select(); return; }
    if (a === 'import') return clGo('import');
    if (a === 'codeBack') return clGo('');
    if (a === 'copy') {
      const t = document.getElementById('clCodeOut'); let ok = false;
      try { await navigator.clipboard.writeText(CL.code); ok = true; } catch (er) { try { t.select(); ok = document.execCommand('copy'); } catch (er2) { ok = false; } }
      CL.msg = ok ? 'Copied. Keep it somewhere safe.' : 'Select the code and copy it by hand.'; clRender(); return;
    }
    if (a === 'doImport') {
      try { const d = await clImport(val('clCodeIn')); if (!modal.hidden) closeModal(); clToast(`Save code loaded. Welcome back, ${(d.dogs && d.dogs[0] && d.dogs[0].name) || NAME()}.`, 'good'); }
      catch (er) { clGo('import', er.message || 'That save code is broken.'); }
    }
  });
}
window.__pawCloud = { get CL() { return CL; }, meta: clMeta, status: cloudStatus, push: clPush, pull: clPull, encode: clExport, decode: clDecode, open: cloudOpen };
