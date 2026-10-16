/* ======================= v2.8.2 ACCOUNT SAFETY: Forgot password (CLOUD lane, tag rs) ======================= */
// docs/CLOUDFLARE_LOGIN.md "v2.8.2". Log in -> "Forgot your password?" -> an email -> the emailed link opens the game with
// ?reset=TOKEN (our email) or #...type=recovery (Supabase's own email, for an old account not moved over yet) -> "Set a new password".
// The answer to "send me a link" never says whether the email has an account. The transport is in 22b_cloud.js (clForgot, clReset).

// read the link from the address once, at load, and take it out of the address bar and the history straight away
const RS = (() => {
  const o = { link: null };
  try {
    const q = new URLSearchParams(location.search), h = new URLSearchParams(String(location.hash || '').replace(/^#/, ''));
    if (/^[A-Za-z0-9_-]{20,100}$/.test(q.get('reset') || '')) o.link = { token: q.get('reset') };
    else if (h.get('type') === 'recovery' && h.get('access_token')) o.link = { sb_token: h.get('access_token') };
    if (q.has('reset') || q.has('sbreset') || h.get('type') === 'recovery') {
      q.delete('reset'); q.delete('sbreset');
      history.replaceState(null, '', location.pathname + (q.toString() ? '?' + q : ''));
    }
  } catch (e) { /* no address to read */ }
  return o;
})();

function rsForm(id, lead, fields) {
  return `<div class="clset acform"><div class="aclead"><span class="acdog" aria-hidden="true">${art('dog', 'dachs', { pose: id === 'fg' ? 'sit' : 'happy' })}</span><p>${lead}</p></div>${fields}<p class="clmsg" id="${id}Msg" role="alert" hidden></p></div>`;
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

/* ---------- the emailed link: "Set a new password" ---------- */
function rsOpen() {
  const link = RS.link; if (!link) return null;
  const p = openModal('Set a new password', rsForm('rs', 'Pick a new password. Every other device logs out, and your dogs stay safe.',
    clIn('rsPw', 'password', `New password (${CL_PW_MIN} or more characters)`, 'new-password') + clIn('rsPw2', 'password', 'New password again', 'new-password')),
    { cls: 'acct acformp rsp', foot: '<button class="btn" id="rsBack">Not now</button><button class="btn yes" id="rsGo">Save password</button>' });
  const msg = $('#rsMsg', p), btn = $('#rsGo', p), val = (id) => $('#' + id, p).value;
  const say = (t) => { msg.textContent = t; msg.hidden = !t; if (t) SFX.nope(); };
  $('#rsBack', p).onclick = () => { SFX.click(); closeModal(); };
  btn.onclick = async () => {
    const pw = val('rsPw');
    if (pw.length < CL_PW_MIN) return say(`Pick a password with at least ${CL_PW_MIN} characters.`);
    if (pw !== val('rsPw2')) return say("The two passwords don't match.");
    say(''); btn.disabled = true; btn.textContent = 'Saving...';
    const r = await clReset(link, pw);
    if (!r.ok) { btn.disabled = false; btn.textContent = 'Save password'; return say(r.msg); }
    RS.link = null; acGuest = false; if (!modal.hidden) closeModal();
    const now = clLocal();
    if (!now) { go('adopt'); return; } // an account with no game yet: pick a crayon dog
    if (cur.mode === 'title') { tAcctKey = ''; titleAcctRender(); }
    toast(`Password changed. You're logged in, and ${acDogName(now)} is right here.`, 'good');
  };
  rsWire(p, btn);
  return p;
}
// opens once the game is up (the title or the yard: a new device with no game opens the link too), only where the cloud is on
function rsWhenReady(tries) {
  if (!RS.link) return;
  if (CL.inited && !CL.on) return; // the claude.ai copy or the test harness: no cloud, no reset
  if (CL.inited && cur.mode && modal.hidden) { rsOpen(); return; }
  if (tries > 0) setTimeout(() => rsWhenReady(tries - 1), 300);
}
if (RS.link) setTimeout(() => rsWhenReady(60), 300);
