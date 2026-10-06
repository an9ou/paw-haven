/* ======================= TITLE ======================= */
function enterTitle() {
  setChrome(false, false); view.innerHTML = ''; titleEl.hidden = false;
  const has = !!loadSave() || !!(S && S.dog);
  const rings = `<svg viewBox="0 0 44 600" preserveAspectRatio="none">${Array.from({ length: 13 }, (_, i) => `<ellipse cx="25" cy="${24 + i * 46}" rx="6" ry="6" fill="#E6D7BF" stroke="${INKG}" stroke-width="1.6"/><path d="M27 ${24 + i * 46} C 10 ${10 + i * 46}, 2 ${22 + i * 46}, 8 ${34 + i * 46}" fill="none" stroke="#A8968A" stroke-width="3" stroke-linecap="round"/><path d="M27 ${24 + i * 46} C 10 ${10 + i * 46}, 2 ${22 + i * 46}, 8 ${34 + i * 46}" fill="none" stroke="${INKG}" stroke-width="1.3"/>`).join('')}</svg>`;
  const doodles = `<svg viewBox="0 0 800 500" preserveAspectRatio="xMidYMid meet">${doodle('spark', 120, 70, 1.3)}${doodle('spark', 690, 120, 0.9)}${doodle('spark', 150, 330, 0.7)}${doodle('heart', 660, 62, 1.2, 12)}${doodle('heart', 718, 330, 0.8, -10)}${doodle('note', 96, 190, 1.1, -8)}${doodle('note', 700, 230, 0.9, 10)}<g class="dd-low">${doodle('flower', 640, 420, 1.2)}${doodle('flower', 100, 430, 0.9, 20)}${doodle('paw', 250, 450, 0.8, -20)}${doodle('paw', 300, 470, 0.8, -10)}${doodle('paw', 350, 455, 0.8, -25)}${doodle('bone', 560, 455, 1.1, -8)}</g></svg>`;
  titleEl.innerHTML = `<div class="bg">${art('scene', 'yard', envNow())}</div>
    <div class="cover"><div class="rings" aria-hidden="true">${rings}</div><div class="doodles" aria-hidden="true">${doodles}</div>
      <h1 class="logo" aria-label="Paw Haven"><span style="transform:rotate(-3deg)">Paw</span> <span style="transform:rotate(2deg) translateY(4px)">Haven</span></h1>
      <div class="tagline">a cozy dog game, sketchbook edition</div>
      <div id="tAcct"></div>
      <div class="crayon-note">Everything here is lovingly sketched. Except the dogs. The dogs drew themselves, with crayons, on purpose.</div>
    </div>
    <div class="tdog2" aria-hidden="true">${art('dog', 'dachs', { pose: 'idle' })}</div>
    <div class="tdog" aria-hidden="true">${art('dog', 'corgi', { pose: 'happy', facing: 'left' })}</div>`;
  tAcctKey = ''; titleAcctRender();
}

/* ---------- v2.3 title: account choice (ACCOUNT lane) ----------
   Cloud on and no session: Log in / Make an account / Play as guest, right on the cover.
   Signed in (account or guest): Continue / New game plus a small "Signed in as" line with a Switch / Log in link.
   Cloud off (claude.ai artifact, test harness): Continue / New game plus a small note. The cloud calls live in 22b_cloud.js. */
let acGuest = false, tAcctKey = ''; // acGuest: "Play as guest" was picked on this page (kept while the cloud is offline)
function acCl() { try { return CL; } catch (e) { return null; } } // CL is declared in a later file
function acMode() {
  const c = acCl(); if (!c || !(c.inited ? c.on : clModeOf() === 'on')) return 'off'; // the title can draw before the cloud starts
  if (c.uid && !c.anon) return 'acct';
  if (c.uid && (acGuest || clLocal())) return 'guest'; // a guest made on the way (a sign-up that failed) is not a pick
  if (acGuest) return 'guest';
  if (clLocal() && !c.out) return c.started ? 'guest' : 'wait'; // a returning player: the cloud signs them in as it starts
  return 'choose';
}
const AC_CH = {
  login: { t: 'Log in', s: 'Welcome back. Your dog kept your spot warm.', dog: 'pug', pose: 'paw' },
  reg: { t: 'Make an account', s: 'Keep your dog safe on every device.', dog: 'golden', pose: 'happy' },
  guest: { t: 'Play as guest', s: 'Just this device. Make an account any time.', dog: 'mutt', pose: 'sit' }
};
function acChoicesHTML(pre, m) {
  const txt = { login: {}, reg: {}, guest: {} };
  if (m === 'acct') { txt.login.s = 'Use a different account.'; txt.reg.s = 'A second account, with a brand new dog.'; txt.guest.s = 'Log out. Your game stays on this device.'; }
  if (m === 'guest') { txt.guest.t = 'Stay a guest'; txt.guest.s = 'Nothing changes. Carry on.'; }
  return Object.keys(AC_CH).map((k) => {
    const c = Object.assign({}, AC_CH[k], txt[k]), id = pre + k[0].toUpperCase() + k.slice(1);
    if (pre === 'ac' && k === 'reg') c.t = 'New account'; // in the sheet the cards are narrower: short titles keep all three on one line
    return `<button class="card tch tch-${k}" id="${id}" data-ac="${k}"><span class="tch-dog" aria-hidden="true">${art('dog', c.dog, { pose: c.pose })}</span><span class="tch-t"><b>${c.t}</b><span class="tch-s">${c.s}</span></span></button>`;
  }).join('');
}
function acLine(m) {
  const c = acCl();
  if (m === 'off') return { t: 'Cloud save works on the web version.' };
  if (m === 'wait') return { t: 'Checking your cloud save...' };
  if (m === 'acct') return { t: `Signed in as <b>${esc(clMask(c.email))}</b>`, link: 'Switch' };
  if (c.err && !c.uid) return { t: 'Cloud save is offline. Your game is saved on this device.', link: 'Log in' };
  return { t: 'Playing as guest', link: 'Log in' };
}
// draws the buttons part of the cover. Called by enterTitle and by the cloud whenever its state changes (22b clRender).
function titleAcctRender() {
  const box = document.getElementById('tAcct'); if (!box || cur.mode !== 'title' || titleEl.hidden) return;
  const has = !!loadSave() || !!(S && S.dog), m = acMode(), ln = m === 'choose' ? null : acLine(m);
  const key = [m, has, ln && ln.t, ln && ln.link].join('|'); if (key === tAcctKey) return; tAcctKey = key;
  const cov = box.closest('.cover'); if (cov) cov.classList.toggle('choosing', m === 'choose');
  if (m === 'choose') {
    box.innerHTML = `<div class="tchoose" role="group" aria-label="How do you want to play?">${acChoicesHTML('t', m)}</div>`;
    acBindChoices(box, false); return;
  }
  box.innerHTML = `<div class="tbtns">
        ${has ? '<button class="btn big go" id="tContinue">Continue</button>' : ''}
        <button class="btn big ${has ? '' : 'yes'}" id="tNew">New game</button>
      </div>
      <p class="tacct" role="status"><span>${ln.t}</span>${ln.link ? `<button class="tlink" id="tSwitch">${ln.link}</button>` : ''}</p>`;
  const tn = $('#tNew'), tc = $('#tContinue'), sw = $('#tSwitch');
  tn.onclick = async () => {
    SFX.boop(600);
    if (has) { const ok = await ask('Start over?', `This replaces <b>${esc((loadSave() || S || {}).dog?.name || 'your dog')}</b> with a brand new dog. The old one will be fine. Probably moved to a farm. A real one.`, 'Yes, new dog', 'Keep my dog'); if (!ok) return; lsDel(SAVE_KEY); S = null; }
    go('adopt');
  };
  if (tc) tc.onclick = () => { SFX.boop(700); if (!S) S = loadSave(); applyAway(); gardenAdvance(); birthdayCheck(); go('yard'); migNote(); setTimeout(() => greetBark(), 1200); };
  if (sw) sw.onclick = () => { SFX.click(); acOpenChoices(); };
}
function acBindChoices(root, inSheet) {
  root.querySelectorAll('[data-ac]').forEach((b) => { b.onclick = () => { SFX.click(); const a = b.dataset.ac; if (a === 'guest') acPlayGuest(b.closest('.panel')); else acOpenForm(a, inSheet); }; });
}
function acOpenChoices() {
  const m = acMode(), c = acCl();
  const who = m === 'acct' ? `You're signed in as <b>${esc(clMask(c.email))}</b>.` : "You're playing as a guest. Your game is saved on this device.";
  const p = openModal('How do you want to play?', `<p class="acwho">${who}</p><div class="tchoose insheet" role="group" aria-label="How do you want to play?">${acChoicesHTML('ac', m)}</div>`, { cls: 'acct' });
  acBindChoices(p, true);
}
async function acPlayGuest(panel) {
  const c = acCl();
  if (c && c.uid && !c.anon) {
    if (panel) { const ok = await confirmIn(panel, 'Log out and play as guest? Your game stays on this device.', 'Log out', 'Stay'); if (!ok) return; }
    await clLogout();
  }
  if (!modal.hidden) closeModal();
  acGuest = true; titleAcctRender();
  if (await clEnsureUser()) clPull(); // a guest with a game on this device gets it into the cloud
  titleAcctRender();
}
function acDogName(d) { return (d && ((d.dogs && d.dogs[0] && d.dogs[0].name) || (d.dog && d.dog.name))) || 'Your dog'; }
function acOpenForm(kind, inSheet) {
  const reg = kind === 'reg', c = acCl(), local = clLocal(), acct = c && c.uid && !c.anon;
  const carry = local && !acct && clMine(); // a guest game comes along; an account's game stays with that account
  const lead = reg ? (carry ? `${esc(acDogName(local))} comes along to the new account. No email is ever sent.` : local ? `A fresh start with a new crayon dog. ${esc(acDogName(local))} stays safe in the other account.` : 'Make one, then pick your first crayon dog. No email is ever sent.')
    : 'Welcome back. Type the email and password you signed up with.';
  const fields = clIn('acEmail', 'email', 'Email', 'username') + (reg ? clIn('acPw', 'password', `Password (${CL_PW_MIN} or more characters)`, 'new-password') + clIn('acPw2', 'password', 'Password again', 'new-password') : clIn('acPw', 'password', 'Password', 'current-password'));
  const body = `<div class="clset acform"><div class="aclead"><span class="acdog" aria-hidden="true">${art('dog', reg ? 'golden' : 'pug', { pose: reg ? 'happy' : 'paw' })}</span><p>${lead}</p></div>${fields}<p class="clmsg" id="acMsg" role="alert" hidden></p>${reg ? '' : '<button class="tlink" id="acForgot">Forgot your password?</button><p class="small" id="acForgotTxt" hidden>Passwords can\'t be reset by email. If you\'re logged in on another device, change it there. The game on this device is never lost.</p>'}</div>`;
  const p = openModal(reg ? 'Make an account' : 'Log in', body, { cls: 'acct acformp', foot: `<button class="btn" id="acBack">Back</button><button class="btn yes" id="acGo">${reg ? 'Make account' : 'Log in'}</button>` });
  const val = (id) => { const e = document.getElementById(id); return e ? e.value : ''; };
  const msgEl = $('#acMsg', p), btn = $('#acGo', p);
  const say = (t) => { msgEl.textContent = t; msgEl.hidden = !t; if (t) SFX.nope(); };
  $('#acBack', p).onclick = () => { SFX.click(); if (inSheet) acOpenChoices(); else closeModal(); };
  const fg = $('#acForgot', p); if (fg) fg.onclick = () => { SFX.click(); $('#acForgotTxt', p).hidden = false; fg.hidden = true; };
  p.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } }));
  // Focus without ever losing a keystroke: openModal re-focuses [autofocus] 30 ms after opening, so [autofocus] always follows the
  // field in use and that late focus lands where the player already is. Desktop starts in the email field; phones wait for a tap
  // (no keyboard pop-up). data-ready: the form takes input from now on (read by the tests).
  p.addEventListener('focusin', (e) => { if (!e.target.matches('input')) return; p.querySelectorAll('[autofocus]').forEach((x) => x.removeAttribute('autofocus')); e.target.setAttribute('autofocus', ''); });
  if (!isPhone()) $('#acEmail', p).focus({ preventScroll: true });
  p.dataset.ready = '1';
  btn.onclick = async () => {
    const em = val('acEmail').trim(), pw = val('acPw');
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return say('That email looks wrong. Check it and try again.');
    if (reg && pw.length < CL_PW_MIN) return say(`Pick a password with at least ${CL_PW_MIN} characters.`);
    if (reg && pw !== val('acPw2')) return say("The two passwords don't match.");
    if (!reg && !pw) return say('Type your password too.');
    say(''); btn.disabled = true; btn.textContent = reg ? 'Making it...' : 'Logging in...';
    let r;
    try { r = reg ? await clRegister(em, pw, acct) : await clLogin(em, pw); } catch (e) { r = { ok: false, msg: clErrText(e) }; }
    if (!r || !r.ok) { btn.disabled = false; btn.textContent = reg ? 'Make account' : 'Log in'; say((r && r.msg) || "That didn't work. Try again in a moment."); return; }
    acGuest = false; if (!modal.hidden) closeModal();
    if (reg) clPull(); // the save on this device becomes the account's save
    const now = clLocal();
    if (!now) { go('adopt'); return; }
    tAcctKey = ''; titleAcctRender();
    toast(reg ? `Account made. ${acDogName(now)} is safe on every device now.` : `Logged in. ${acDogName(now)} is right where you left them.`, 'good');
    const tc = $('#tContinue'); if (tc) tc.focus({ preventScroll: true });
  };
}
