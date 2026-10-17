/* ======================= v2.8.2 ACCOUNT SAFETY: Forgot password (CLOUD lane, tag rs) ======================= */
// docs/CLOUDFLARE_LOGIN.md "v2.8.2". Log in -> "Forgot your password?" -> an email -> its link opens https://doodledoggo.app/reset
// (site/reset.html), which sets the new password, then the player logs in here as usual.
// The answer to "send me a link" never says whether the email has an account. The transport is in 22b_cloud.js (clForgot).

function rsForm(id, lead, fields) {
  return `<div class="clset acform"><div class="aclead"><span class="acdog" aria-hidden="true">${art('dog', 'dachs', { pose: 'sit' })}</span><p>${lead}</p></div>${fields}<p class="clmsg" id="${id}Msg" role="alert" hidden></p></div>`;
}
// shared wiring: Enter submits, desktop focuses the first field, phones wait for a tap (no keyboard pop-up)
function rsWire(p, btn) {
  p.querySelectorAll('input').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); btn.click(); } }));
  const f = p.querySelector('input'); if (f && !isPhone()) f.focus({ preventScroll: true });
  p.dataset.ready = '1';
}

/* ---------- "Forgot your password?" (from the title's Log in, or Settings -> Cloud save -> Log in) ---------- */
function acOpenForgot(email, back) {
  const p = openModal('Forgot your password?', rsForm('fg', 'Type the email you signed up with. We\'ll send a link to pick a new password.', clIn('fgEmail', 'email', 'Email', 'username')),
    { cls: 'acct acformp rsp', foot: '<button class="btn" id="fgBack">Back</button><button class="btn yes" id="fgGo">Send the link</button>' });
  const inp = $('#fgEmail', p), msg = $('#fgMsg', p), btn = $('#fgGo', p), bk = $('#fgBack', p);
  if (email) inp.value = email;
  const say = (t, good) => { msg.textContent = t; msg.hidden = !t; msg.classList.toggle('good', !!good); msg.setAttribute('role', good ? 'status' : 'alert'); if (t && !good) SFX.nope(); };
  bk.onclick = () => { SFX.click(); if (back) back(); else closeModal(); };
  btn.onclick = async () => {
    const em = inp.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return say('That email looks wrong. Check it and try again.');
    say(''); btn.disabled = true; btn.textContent = 'Sending...';
    const r = await clForgot(em);
    if (!r.ok) { btn.disabled = false; btn.textContent = 'Send the link'; return say(r.msg); }
    btn.hidden = true; bk.textContent = 'Done'; inp.disabled = true;
    say(r.mail ? 'If that email has an account, a link is on its way. Check your inbox and the spam folder. The link works for 30 minutes.'
      : "Passwords can't be reset by email yet. If you're logged in on another device, change it there. The game on this device is never lost.", true);
    SFX.boop(700);
  };
  rsWire(p, btn);
  return p;
}
