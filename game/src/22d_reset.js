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
  const p = openModal('Forgot your password?', rsForm('fg', 'Type the email you signed up with. We\'ll email you a 6-digit code to pick a new password.', clIn('fgEmail', 'email', 'Email', 'username')),
    { cls: 'acct acformp rsp', foot: '<button class="btn" id="fgBack">Back</button><button class="btn yes" id="fgGo">Send the code</button>' });
  const inp = $('#fgEmail', p), msg = $('#fgMsg', p), btn = $('#fgGo', p), bk = $('#fgBack', p);
  if (email) inp.value = email;
  const say = (t, good) => rsSay(msg, t, good);
  bk.onclick = () => { SFX.click(); if (back) back(); else closeModal(); };
  btn.onclick = async () => {
    const em = inp.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return say('That email looks wrong. Check it and try again.');
    say(''); btn.disabled = true; btn.textContent = 'Sending...';
    const r = await clForgot(em);
    if (!r.ok) { btn.disabled = false; btn.textContent = 'Send the code'; return say(r.msg); }
    if (!r.mail) {
      btn.hidden = true; bk.textContent = 'Done'; inp.disabled = true;
      return say("Passwords can't be reset by email yet. If you're logged in on another device, change it there. The game on this device is never lost.", true);
    }
    SFX.boop(700);
    rsOpenCode(em, back, Date.now());
  };
  rsWire(p, btn);
  return p;
}

/* ---------- step 2: the emailed code and a new password -> logged in ---------- */
function rsOpenCode(email, back, sentAt) {
  const code = `<label class="clfield rs-code" for="rcCode"><span>Code from the email</span><input id="rcCode" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" autocapitalize="off" spellcheck="false" enterkeyhint="next"></label>`;
  const fields = code + clIn('rcPw', 'password', `New password (${CL_PW_MIN} or more characters)`, 'new-password') + clIn('rcPw2', 'password', 'New password again', 'new-password')
    + '<button class="tlink rs-again" id="rcAgain" type="button">Send a new code</button>';
  const lead = `We've sent a code to <b>${esc(email)}</b> if that email has an account. It works for 30 minutes. Check the spam folder too.`;
  const p = openModal('New password', rsForm('rc', lead, fields), { cls: 'acct acformp rsp rs-step2', foot: '<button class="btn" id="rcBack">Back</button><button class="btn yes" id="rcGo">Set password</button>' });
  const cd = $('#rcCode', p), pw = $('#rcPw', p), pw2 = $('#rcPw2', p), msg = $('#rcMsg', p), btn = $('#rcGo', p), again = $('#rcAgain', p);
  const say = (t, good) => rsSay(msg, t, good);
  cd.addEventListener('input', () => { const v = cd.value.replace(/\D+/g, '').slice(0, 6); if (v !== cd.value) cd.value = v; }); // a pasted "123 456" works too
  $('#rcBack', p).onclick = () => { SFX.click(); acOpenForgot(email, back); };
  // "Send a new code", with a cooldown so a tap-happy player can't fill their inbox (the Worker also sends at most 5 an hour)
  let last = sentAt;
  const tick = () => {
    if (!again.isConnected) { clearInterval(iv); return; }
    const s = Math.ceil(RS_AGAIN_S - (Date.now() - last) / 1000);
    again.disabled = s > 0; again.textContent = s > 0 ? `Send a new code (in ${s} s)` : 'Send a new code';
  };
  const iv = setInterval(tick, 1000); tick();
  again.onclick = async () => {
    if (again.disabled) return; SFX.click(); again.disabled = true; again.textContent = 'Sending...';
    const r = await clForgot(email);
    if (!r.ok) { tick(); return say(r.msg); }
    last = Date.now(); tick(); cd.value = '';
    say('A new code is on its way. Only the newest code works.', true);
  };
  btn.onclick = async () => {
    const c = cd.value.trim(), a = pw.value;
    if (!/^\d{6}$/.test(c)) return say('Type the 6-digit code from the email.');
    if (a.length < CL_PW_MIN) return say(`Pick a password with at least ${CL_PW_MIN} characters.`);
    if (a !== pw2.value) return say("The two passwords don't match.");
    say(''); btn.disabled = true; btn.textContent = 'Setting it...';
    let r;
    try { r = await clResetCode(email, c, a); } catch (e) { r = { ok: false, msg: clErrText(e) }; }
    if (!r || !r.ok) {
      btn.disabled = false; btn.textContent = 'Set password';
      if (r && (r.err === 'too_many_tries' || r.err === 'expired')) { cd.value = ''; last = 0; tick(); } // that code is dead: a new one may go at once
      const left = r && r.err === 'wrong_code' && r.left ? ` ${r.left} ${r.left === 1 ? 'try' : 'tries'} left.` : '';
      return say(((r && r.msg) || "That didn't work. Try again in a moment.") + left);
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
    toast(`New password set, and you're logged in. ${acDogName(now)} is right where you left them.`, 'good');
    const tc = $('#tContinue'); if (tc) tc.focus({ preventScroll: true });
    return;
  }
  if (!r.loaded && !now) { go('title'); return; } // another account's game left this device
  toast(r.loaded ? "New password set, and you're logged in. Your saved game is here." : "New password set, and you're logged in. This game is now saved to your account.", 'good');
}
