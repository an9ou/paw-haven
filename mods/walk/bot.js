// in-page bot: reacts `lead` seconds before each obstacle (tap for low, hold for wide, crouch for high)
window.__runBot = function (lead, digHot, jitter) {
  const st = { handled: {}, jumping: false, jumpUntil: 0, crouching: false, crouchEnd: 0, frames: [], last: 0 };
  const key = (type, k) => window.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true }));
  window.__botStats = st;
  function tick(now) {
    const c = window.__ctl; if (!c) return; const P = c._peek();
    if (st.last) st.frames.push(now - st.last); st.last = now;
    if (P.mode === 'end') return;
    requestAnimationFrame(tick);
    if (P.mode === 'reveal') return;
    if (P.mode !== 'run') return;
    if (st.jumping && now > st.jumpUntil) { key('keyup', ' '); st.jumping = false; }
    const back = P.dogX + P.box.off - P.box.hw, front = P.dogX + P.box.off + P.box.hw, feet = P.dogX + P.box.feet;
    if (st.crouching && back > st.crouchEnd + 4) { key('keyup', 'ArrowDown'); st.crouching = false; }
    if (P.prompt && digHot && P.heat !== null && P.heat > 0.6 && !st.dug) { st.dug = true; key('keydown', 'd'); setTimeout(() => { st.dug = false; }, 1500); }
    const v = Math.max(P.v, 40);
    for (const b of (P.bonus || [])) { if (!st.handled['b' + b.x] && (b.x - 60 - front) / v < 0.3) { st.handled['b' + b.x] = true; if (!st.jumping) { key('keydown', ' '); st.jumping = true; st.jumpUntil = now + 300; } } }
    for (const ob of P.obs) {
      if (st.handled[ob.id]) continue;
      const ref = ob.cat === 'wide' ? feet : front;
      const tt = (ob.ex0 - ref) / v;
      if (ob._lead == null) ob._lead = jitter ? lead + (Math.random() * 2 - 1) * jitter : lead;
      st.leads = st.leads || {}; if (st.leads[ob.id] == null) st.leads[ob.id] = ob._lead;
      if (tt > st.leads[ob.id]) continue;
      st.handled[ob.id] = true;
      if (ob.cat === 'high') { if (st.jumping) { key('keyup', ' '); st.jumping = false; } key('keydown', 'ArrowDown'); st.crouching = true; st.crouchEnd = Math.max(st.crouching ? st.crouchEnd : 0, ob.ex1); }
      else {
        if (st.crouching) { key('keyup', 'ArrowDown'); st.crouching = false; }
        if (st.jumping) key('keyup', ' ');
        key('keydown', ' '); st.jumping = true; st.jumpUntil = now + (ob.cat === 'wide' ? (jitter ? 700 + Math.random() * 500 : 1150) : (jitter ? 70 + Math.random() * 200 : 120));
      }
    }
  }
  requestAnimationFrame(tick);
};
