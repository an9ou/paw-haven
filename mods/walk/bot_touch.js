// in-page TOUCH bot: synthetic touch pointer events. Jump = tap/hold on the right half; duck = Duck button or swipe down; dig = Dig button.
window.__runTouchBot = function (lead) {
  const st = { handled: {}, jump: null, duck: null, frames: [], last: 0, n: 0, swipes: 0, buttons: 0, digs: 0 };
  window.__botStats = st; let pid = 100;
  const fire = (el, type, x, y, id) => el.dispatchEvent(new PointerEvent(type, { pointerType: 'touch', pointerId: id, isPrimary: true, clientX: x, clientY: y, bubbles: true, cancelable: true, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));
  const stageR = () => document.querySelector('.pw-stage').getBoundingClientRect();
  function down(x, y) { const el = document.elementFromPoint(x, y); const id = ++pid; fire(el, 'pointerdown', x, y, id); return { el, x, y, id }; }
  function up(g) { if (g) fire(g.el, 'pointerup', g.x, g.y, g.id); }
  function tick(now) {
    const c = window.__ctl; if (!c) return; const P = c._peek();
    if (st.last) st.frames.push(now - st.last); st.last = now;
    if (P.mode === 'end') return;
    requestAnimationFrame(tick);
    if (P.mode !== 'run') return;
    if (st.jump && now > st.jump.until) { up(st.jump); st.jump = null; }
    const back = P.dogX + P.box.off - P.box.hw, front = P.dogX + P.box.off + P.box.hw, feet = P.dogX + P.box.feet;
    if (st.duck && back > st.duck.end + 4) { up(st.duck); st.duck = null; }
    if (P.prompt && P.heat !== null && P.heat > 0.6 && !st.dug) { st.dug = true; st.digs++; const b = document.querySelector('.pw-dig').getBoundingClientRect(); const g = down(b.left + b.width / 2, b.top + b.height / 2); up(g); setTimeout(() => { st.dug = false; }, 1500); }
    const v = Math.max(P.v, 40);
    for (const b of (P.bonus || [])) { if (!st.handled['b' + b.x] && (b.x - 60 - front) / v < lead && !st.jump) { st.handled['b' + b.x] = true; const r = stageR(); const g = down(r.left + r.width * 0.8, r.top + r.height * 0.5); g.until = now + 300; st.jump = g; } }
    for (const ob of P.obs) {
      if (st.handled[ob.id]) continue;
      const tt = (ob.ex0 - (ob.cat === 'wide' ? feet : front)) / v; if (tt > lead) continue;
      st.handled[ob.id] = true; st.n++;
      if (ob.cat === 'high') {
        if (st.jump) { up(st.jump); st.jump = null; }
        if (st.duck) { st.duck.end = Math.max(st.duck.end, ob.ex1); continue; }
        if (st.n % 2) { const b = document.querySelector('.pw-duck').getBoundingClientRect(); st.duck = down(b.left + b.width / 2, b.top + b.height / 2); st.buttons++; }
        else { const r = stageR(); const x = r.left + r.width * 0.25, y = r.top + r.height * 0.4; const g = down(x, y); fire(g.el, 'pointermove', x, y + 50, g.id); g.y = y + 50; st.duck = g; st.swipes++; }
        st.duck.end = ob.ex1;
      } else {
        if (st.duck) { up(st.duck); st.duck = null; }
        if (st.jump) { up(st.jump); st.jump = null; }
        let g; if (st.n % 3 === 0) { const b = document.querySelector('.pw-jump').getBoundingClientRect(); g = down(b.left + b.width / 2, b.top + b.height / 2); st.buttons++; }
        else { const r = stageR(); g = down(r.left + r.width * 0.8, r.top + r.height * 0.5); }
        g.until = now + (ob.cat === 'wide' ? 1150 : 120); st.jump = g;
      }
    }
  }
  requestAnimationFrame(tick);
};
