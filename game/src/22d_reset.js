/* ======================= ACCOUNT SAFETY: Forgot password (CLOUD lane, tag rs) ======================= */
// docs/CLOUDFLARE_LOGIN.md "v2.9.2". Log in -> "Forgot your password?" -> an email -> a 6-digit code is emailed -> the code and a new
// password, typed here -> logged in at once (v2.9.2, owner's decision: the reset happens in the game, no website link).
// The answer to "send me a code" never says whether the email has an account. The transport is in 22b_cloud.js (clForgot, clResetCode).
const RS_AGAIN_S = 60; // "Send a new code" waits this long after each code

function rsForm(id, lead, fields) {
  return `<div class="clset acform"><div class="aclead"><span class="acdog" aria-hidden="true">${art('dog', 'dachs', { pose: 'sit' })}</span><p>${lead}</p></div>${fields}<p class="clmsg" id="${id}Msg" role="alert" hidden></p></div>`;
}
// shared wiring: Enter submits, desktop focuses the first field, phones wait for a tap (no keyboard pop-up)
function rsWire(p, btn) {
  p.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } }));
  const f = p.querySelector('input'); if (f && !isPhone()) f.focus({ preventScroll: true });
  rsKeyboard(p);
  p.dataset.ready = '1';
}
function rsSay(msg, t, good) { msg.textContent = t; msg.hidden = !t; msg.classList.toggle('good', !!good); msg.setAttribute('role', good ? 'status' : 'alert'); if (t && !good) SFX.nope(); }

// Phones: the on-screen keyboard must never cover the field in use. The sheet gets room under its last field as tall as the keyboard
// (--rs-kb), and the focused field scrolls up into the part of the screen the keyboard leaves (window.visualViewport).
function rsKeyboard(p) {
  const vv = window.visualViewport; if (!isPhone() || !vv) return;
  const fit = () => {
    if (!p.isConnected) { vv.removeEventListener('resize', fit); vv.removeEventListener('scroll', fit); return; }
    const kb = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop));
    p.style.setProperty('--rs-kb', kb + 'px');
    const f = document.activeElement; if (!f || !p.contains(f) || !f.matches('input')) return;
    const r = f.getBoundingClientRect(), top = vv.offsetTop + 8, bottom = vv.offsetTop + vv.height - 12;
    if (r.top >= top && r.bottom <= bottom) return;
    let s = f.parentElement; while (s && s !== p.parentElement && !(s.scrollHeight > s.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(s).overflowY))) s = s.parentElement;
    if (s && s !== p.parentElement) s.scrollTop += r.bottom > bottom ? r.bottom - bottom : r.top - top;
    else f.scrollIntoView({ block: 'center' });
  };
  vv.addEventListener('resize', fit); vv.addEventListener('scroll', fit);
  p.addEventListener('focusin', () => setTimeout(fit, 320)); // after the keyboard has slid up
}

/* ---------- step 1: "Forgot your password?" (from the title's Log in, or Settings -> Cloud save -> Log in) ---------- */
function acOpenForgot(email, back) {
  const p = openModal(tt('reset.forgot_title', 'Forgot your password?'), rsForm('fg', esc(tt('reset.forgot_lead', "Type the email you signed up with. We'll email you a 6-digit code to pick a new password.")), clIn('fgEmail', 'email', esc(tt('reset.email', 'Email')), 'username')),
    { cls: 'acct acformp rsp', foot: `<button class="btn" id="fgBack">${esc(tt('reset.back', 'Back'))}</button><button class="btn yes" id="fgGo">${esc(tt('reset.send_code', 'Send the code'))}</button>` });
  const inp = $('#fgEmail', p), msg = $('#fgMsg', p), btn = $('#fgGo', p), bk = $('#fgBack', p);
  if (email) inp.value = email;
  const say = (t, good) => rsSay(msg, t, good);
  bk.onclick = () => { SFX.click(); if (back) back(); else closeModal(); };
  btn.onclick = async () => {
    const em = inp.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return say(tt('cloud.email_wrong', 'That email looks wrong. Check it and try again.'));
    say(''); btn.disabled = true; btn.textContent = tt('reset.sending', 'Sending...');
    const r = await clForgot(em);
    if (!r.ok) { btn.disabled = false; btn.textContent = tt('reset.send_code', 'Send the code'); return say(r.msg); }
    if (!r.mail) {
      btn.hidden = true; bk.textContent = tt('reset.done', 'Done'); inp.disabled = true;
      return say(tt('reset.no_mail', "Passwords can't be reset by email yet. If you're logged in on another device, change it there. The game on this device is never lost."), true);
    }
    SFX.boop(700);
    rsOpenCode(em, back, Date.now());
  };
  rsWire(p, btn);
  return p;
}

/* ---------- step 2: the emailed code and a new password -> logged in ---------- */
function rsOpenCode(email, back, sentAt) {
  const code = `<label class="clfield rs-code" for="rcCode"><span>${esc(tt('reset.code_label', 'Code from the email'))}</span><input id="rcCode" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" autocapitalize="off" spellcheck="false" enterkeyhint="next"></label>`;
  const fields = code + clIn('rcPw', 'password', esc(tt('cloud.new_pw_label', 'New password ({n} or more characters)', { n: CL_PW_MIN })), 'new-password') + clIn('rcPw2', 'password', esc(tt('cloud.new_pw_again', 'New password again')), 'new-password')
    + `<button class="tlink rs-again" id="rcAgain" type="button">${esc(tt('reset.send_new', 'Send a new code'))}</button>`;
  const lead = tt('reset.sent_lead_html', "We've sent a code to <b>{email}</b> if that email has an account. It works for 30 minutes. Check the spam folder too.", { email });
  const p = openModal(tt('reset.new_pw_title', 'New password'), rsForm('rc', lead, fields), { cls: 'acct acformp rsp rs-step2', foot: `<button class="btn" id="rcBack">${esc(tt('reset.back', 'Back'))}</button><button class="btn yes" id="rcGo">${esc(tt('reset.set_pw', 'Set password'))}</button>` });
  const cd = $('#rcCode', p), pw = $('#rcPw', p), pw2 = $('#rcPw2', p), msg = $('#rcMsg', p), btn = $('#rcGo', p), again = $('#rcAgain', p);
  const say = (t, good) => rsSay(msg, t, good);
  cd.addEventListener('input', () => { const v = cd.value.replace(/\D+/g, '').slice(0, 6); if (v !== cd.value) cd.value = v; }); // a pasted "123 456" works too
  $('#rcBack', p).onclick = () => { SFX.click(); acOpenForgot(email, back); };
  // "Send a new code", with a cooldown so a tap-happy player can't fill their inbox (the Worker also sends at most 5 an hour)
  let last = sentAt;
  const tick = () => {
    if (!again.isConnected) { clearInterval(iv); return; }
    const s = Math.ceil(RS_AGAIN_S - (Date.now() - last) / 1000);
    again.disabled = s > 0; again.textContent = s > 0 ? tt('reset.send_new_in', 'Send a new code (in {n} s)', { n: s }) : tt('reset.send_new', 'Send a new code');
  };
  const iv = setInterval(tick, 1000); tick();
  again.onclick = async () => {
    if (again.disabled) return; SFX.click(); again.disabled = true; again.textContent = tt('reset.sending', 'Sending...');
    const r = await clForgot(email);
    if (!r.ok) { tick(); return say(r.msg); }
    last = Date.now(); tick(); cd.value = '';
    say(tt('reset.new_code_sent', 'A new code is on its way. Only the newest code works.'), true);
  };
  btn.onclick = async () => {
    const c = cd.value.trim(), a = pw.value;
    if (!/^\d{6}$/.test(c)) return say(tt('reset.type_code', 'Type the 6-digit code from the email.'));
    if (a.length < CL_PW_MIN) return say(tt('cloud.pw_too_short', 'Pick a password with at least {n} characters.', { n: CL_PW_MIN }));
    if (a !== pw2.value) return say(tt('cloud.pw_mismatch', "The two passwords don't match."));
    say(''); btn.disabled = true; btn.textContent = tt('reset.setting', 'Setting it...');
    let r;
    try { r = await clResetCode(email, c, a); } catch (e) { r = { ok: false, msg: clErrText(e) }; }
    if (!r || !r.ok) {
      btn.disabled = false; btn.textContent = tt('reset.set_pw', 'Set password');
      if (r && (r.err === 'too_many_tries' || r.err === 'expired')) { cd.value = ''; last = 0; tick(); } // that code is dead: a new one may go at once
      const left = r && r.err === 'wrong_code' && r.left ? ' ' + tt('reset.tries_left', '{n, plural, one {# try left.} other {# tries left.}}', { n: r.left }) : '';
      return say(((r && r.msg) || tt('cloud.err_generic', "That didn't work. Try again in a moment.")) + left);
    }
    rsDone(r);
  };
  rsWire(p, btn);
  return p;
}

// logged in with the new password: the same ending as a log in, from the title screen or from Settings
function rsDone(r) {
  if (!modal.hidden) closeModal();
  const now = clLocal();
  SFX.boop(700);
  if (cur.mode === 'title') {
    acGuest = false;
    if (!now) { go('adopt'); return; }
    tAcctKey = ''; titleAcctRender();
    toast(tt('reset.done_title', "New password set, and you're logged in. {name} is right where you left them.", { name: acDogName(now) }), 'good');
    const tc = $('#tContinue'); if (tc) tc.focus({ preventScroll: true });
    return;
  }
  if (!r.loaded && !now) { go('title'); return; } // another account's game left this device
  toast(r.loaded ? tt('reset.done_loaded', "New password set, and you're logged in. Your saved game is here.") : tt('reset.done_saved', "New password set, and you're logged in. This game is now saved to your account."), 'good');
}
