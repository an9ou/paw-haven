/* ======================= v2.29 "Story mode", part 1: 57_scenes.js (tag sc) =======================
   Contract: V229.md. Design: docs/design/story-mode.md. Test hook: window.__paw.sc. Suite: v229_story.
   The scene engine: a short animated scene, drawn live with the game's own art (the place scenes through sceneArt, the player's dog through
   dogSVG with its coat and outfit, Gerald through gdDuck), a camera that pans and zooms, simple tweened moves, a caption per shot (tt()) and a
   PawAudio stinger. No video files: a scene is a small script (SC_SCRIPTS, filled by 57b_story.js).
   - It plays full screen over the stage (#scLayer), pauses the game loop (tick() returns while SC.on) and the roaming dogs (rmPause).
   - A Skip button shows after SC_SKIP_MS (3 s). Escape skips too, once Skip shows.
   - Settings Motion off (html[data-motion="off"]): nothing moves; each shot shows its final picture and the shots cross-fade.
   - Automatic scenes wait in S.story.q and never stack: they play on a calm yard or Market Street only (no sheet, no guide, no level card,
     not before the What's new sheet, the calendar's daily page or the While you were out page), SC_CALM_MS calm, SC_GAP_MS after the last one.
   Script: { id, sting, shots: [{ d: seconds, bg: place id | 'card', cam: [[x, y, zoom], [x, y, zoom]], title: () => text (card shots),
     cap: () => text, actors: [{ who: 'dog' | 'gerald' | 'book' | 'doodle', pose, pose2 (once the move ends), face, expr, at: [x, y] (feet),
     to: [x, y], s: scale, hop: px, t0, t1 (move window, 0-1 of the shot), k (doodle kind), open (book), fade: 'in' | 'out' }] }] } */
const SC_SKIP_MS = 3000, SC_CALM_MS = 1500, SC_GAP_MS = 8000, SC_FADE_MS = 380;
const SC_SCRIPTS = {}; // id -> script (57b_story.js)
const SC = { on: null, raf: 0, calm: 0, lastEnd: 0 };
function scAllowed() { return !navigator.webdriver || !!(typeof prefs !== 'undefined' && prefs && prefs.scTest); }
const scStill = () => document.documentElement.dataset.motion === 'off';
const scEase = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const scLerp = (a, b, t) => a + (b - a) * t;
function scPlaying() { return !!SC.on; }

/* ---------------- art ---------------- */
// a crayon book (closed or open): every fill sits under its own outline, drawn from the same path
function scBookSVG(open) {
  const two = (d, fill, w) => `<path d="${d}" fill="${fill}"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="${w || 3}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const lines = (x0, x1) => [40, 56, 72, 88, 104].map((y, i) => `<path d="M${x0} ${y + (i % 2)} Q${(x0 + x1) / 2} ${y - 2} ${x1 - (i === 4 ? 30 : 0)} ${y + 1}" fill="none" stroke="#B9A89A" stroke-width="2" stroke-linecap="round"/>`).join('');
  if (!open) return `<svg viewBox="0 0 140 160" class="sc-book">${two('M18 12 Q70 6 122 12 L124 148 Q70 154 16 148 Z', '#F28FA5')}${two('M18 12 L30 8 L30 144 L16 148', '#E0708C', 2.4)}${two('M44 40 Q76 36 108 40 L108 92 Q76 96 44 92 Z', '#FFFBF3', 2.4)}<g transform="translate(76 66)">${doodle('paw', 0, 0, 1.1, -8)}</g></svg>`;
  return `<svg viewBox="0 0 240 150" class="sc-book">${two('M120 22 Q70 8 14 18 L12 138 Q70 128 120 142 Q170 128 228 138 L226 18 Q170 8 120 22 Z', '#FFFBF3')}${two('M120 22 L120 142', 'none', 2.4)}${lines(28, 108)}${lines(134, 214)}<g transform="translate(70 120)">${doodle('heart', 0, 0, 0.8, -6)}</g><g transform="translate(176 118)">${doodle('paw', 0, 0, 0.8, 10)}</g></svg>`;
}
// a sketchbook card: paper, a ruled margin and a few doodles in the corners
function scCardSVG() {
  const dd = [['heart', 90, 90, -10], ['paw', 910, 100, 12], ['sun', 880, 510, 0], ['paw', 120, 520, -14], ['heart', 760, 70, 8]].map(([k, x, y, r]) => doodle(k, x, y, 1.6, r)).join('');
  return `<g class="sc-card"><rect x="-200" y="-200" width="1400" height="1000" fill="#FFFBF3"/>${[150, 230, 310, 390, 470].map((y) => `<path d="M-200 ${y} L1200 ${y + 2}" stroke="#DCE7F2" stroke-width="2"/>`).join('')}<path d="M70 -200 L72 800" stroke="#F2B8C4" stroke-width="2.4"/>${dd}</g>`;
}
// the world art's Gerald looks right, the crayon fallback (gdDuck) looks left: face 'left' | 'right' turns him the way the shot needs
function scGeraldSVG(pose, face) { const real = !!artReal('prop', 'gerald', { pose: pose || 'wave' }), s = typeof gdDuck === 'function' ? gdDuck(pose || 'wave') : ''; return (real ? face === 'left' : face === 'right') ? s.replace(/^\s*<svg\b([^>]*)>/, '<svg$1><g transform="translate(160 0) scale(-1 1)">').replace(/<\/svg>\s*$/, '</g></svg>') : s; }
function scDogSVG(d, a, pose) {
  const o = { pose, facing: a.face || 'right' }; try { o.outfit = shSleepOutfit(d, pose); } catch (e) { /* no wardrobe */ }
  try { const P = window.PawArt; if (a.expr && P && typeof P.exprOk === 'function' && P.exprOk(a.expr, pose)) o.expr = a.expr; } catch (e) { /* no faces */ }
  return dogSVG(d, o);
}
// one actor at its feet point (x, y), scale s: [svg, w, h, feet fraction]
function scActor(a, pose) {
  const s = a.s || 1;
  if (a.who === 'dog') return [scDogSVG(a.dog || D(), a, pose), 264 * s, 220 * s, 0.93];
  if (a.who === 'gerald') return [scGeraldSVG(pose, a.face), 140 * s, 140 * s, 0.93];
  if (a.who === 'book') return a.open ? [scBookSVG(true), 300 * s, 188 * s, 0.9] : [scBookSVG(false), 140 * s, 160 * s, 0.93];
  return [`<svg viewBox="-24 -24 48 48">${doodle(a.k || 'heart', 0, 0, 1.2, a.rot || 0)}</svg>`, 60 * s, 60 * s, 0.5];
}
function scActorInner(a, pose) { const [svg, w, h, f] = scActor(a, pose); return [place(svg, -w / 2, 0, w, h), h, f]; }
function scBg(bg) {
  if (bg === 'card') return scCardSVG();
  try { return sceneArt(bg, envNow()); } catch (e) { return scCardSVG(); }
}

/* ---------------- the player ---------------- */
function scLayer() {
  let L = $('#scLayer'); if (L) return L;
  L = document.createElement('div'); L.id = 'scLayer'; L.className = 'sc-layer'; L.hidden = true;
  L.setAttribute('role', 'dialog'); L.setAttribute('aria-modal', 'true');
  L.innerHTML = '<div class="sc-film"><svg class="sc-svg" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><g class="sc-cam"></g></svg><div class="sc-title" hidden></div><div class="sc-fade"></div></div>'
    + '<div class="sc-foot"><p class="sc-cap" aria-live="polite"></p><button class="btn sc-skip" type="button" hidden></button></div>';
  ($('#stage') || document.body).appendChild(L);
  $('.sc-skip', L).onclick = () => { try { SFX.click(); } catch (e) { /* audio off */ } scEnd(true); };
  return L;
}
// o.replay: from the Memories album (no queue bookkeeping); o.onEnd(skipped)
function scPlay(id, o) {
  const sc = SC_SCRIPTS[id]; if (!sc || SC.on || !S) return false;
  o = o || {};
  const L = scLayer(), d = D();
  const shots = sc.shots(d).map((x) => Object.assign({ d: 4, cam: [[500, 300, 1], [500, 300, 1]], actors: [] }, x));
  const total = shots.reduce((n, x) => n + x.d * 1000, 0);
  SC.on = { id, sc, shots, total, t0: performance.now(), shot: -1, o, dog: d, skipAt: SC_SKIP_MS, still: scStill() };
  L.setAttribute('aria-label', sc.title ? sc.title() : id);
  $('.sc-skip', L).textContent = tt('sc.skip', 'Skip'); $('.sc-skip', L).hidden = true;
  L.hidden = false; L.classList.toggle('sc-still', SC.on.still);
  try { if (typeof rmPause === 'function') rmPause('scene'); } catch (e) { /* no roaming */ }
  try { if (typeof hideBubble === 'function') hideBubble(); } catch (e) { /* no bubble */ }
  try { if (sc.sting && window.PawAudio && typeof PawAudio.stinger === 'function') PawAudio.stinger(sc.sting); } catch (e) { /* audio off */ }
  emit('sc:start', { id, replay: !!o.replay });
  cancelAnimationFrame(SC.raf); SC.raf = requestAnimationFrame(scFrame);
  return true;
}
function scShotAt(ms) { const P = SC.on; let acc = 0; for (let i = 0; i < P.shots.length; i++) { const e = acc + P.shots[i].d * 1000; if (ms < e) return [i, (ms - acc) / (P.shots[i].d * 1000)]; acc = e; } return [P.shots.length - 1, 1]; }
function scEnterShot(i) {
  const P = SC.on, x = P.shots[i], L = scLayer(); P.shot = i; P.poses = x.actors.map((a) => (P.still && a.pose2 ? a.pose2 : a.pose || 'idle'));
  x.actors.forEach((a) => { if (a.who === 'dog' && !a.dog) a.dog = P.dog; });
  const parts = x.actors.map((a, k) => scActorInner(a, P.poses[k])); P.sz = parts.map((q) => [q[1], q[2]]);
  $('.sc-cam', L).innerHTML = scBg(x.bg || 'card') + parts.map((q, k) => `<g class="sc-a" data-a="${k}">${q[0]}</g>`).join('');
  const T = $('.sc-title', L), tl = x.title ? x.title() : ''; T.hidden = !tl; T.textContent = tl;
  const c = $('.sc-cap', L); c.textContent = x.cap ? x.cap() : ''; c.classList.remove('sc-in'); void c.offsetWidth; c.classList.add('sc-in');
}
// the camera: a pan and zoom with easing, kept inside the 1000x600 box; a narrow (phone) film zooms less, so at least 360 scene units stay in view
function scCam(x, p) {
  const L = scLayer(), svg = $('.sc-svg', L), r = svg.getBoundingClientRect(), k = Math.max(r.width / 1000, r.height / 600) || 1;
  const W = r.width / k || 1000, H = r.height / k || 600, A = x.cam[0], B = x.cam[1] || A, e = SC.on.still ? 1 : scEase(p);
  const z = Math.min(Math.max(1, scLerp(A[2] || 1, B[2] || 1, e)), Math.max(1, W / 360)), hw = W / 2 / z, hh = H / 2 / z;
  const cx = Math.min(Math.max(scLerp(A[0], B[0], e), hw), 1000 - hw), cy = Math.min(Math.max(scLerp(A[1], B[1], e), hh), 600 - hh);
  return `translate(500 300) scale(${z.toFixed(4)}) translate(${(-cx).toFixed(1)} ${(-cy).toFixed(1)})`;
}
function scFrame(now) {
  const P = SC.on; if (!P) return;
  const ms = now - P.t0, L = scLayer();
  if (ms >= P.total) { scEnd(false); return; }
  const [i, p] = scShotAt(ms); if (i !== P.shot) scEnterShot(i);
  const x = P.shots[i];
  $('.sc-cam', L).setAttribute('transform', scCam(x, p));
  x.actors.forEach((a, k) => {
    const g = L.querySelector(`.sc-a[data-a="${k}"]`); if (!g) return;
    const t0 = a.t0 || 0, t1 = a.t1 == null ? 1 : a.t1, q = P.still ? 1 : Math.min(1, Math.max(0, (p - t0) / Math.max(0.01, t1 - t0))), e = scEase(q);
    const A = a.at || [500, 500], B = a.to || A, moving = q > 0 && q < 1 && (A[0] !== B[0] || A[1] !== B[1]);
    const hop = moving && a.hop && !P.still ? -Math.abs(Math.sin(q * Math.PI * 6)) * a.hop : 0;
    const [hh, ff] = P.sz[k], ax = scLerp(A[0], B[0], e), ay = scLerp(A[1], B[1], e) + hop;
    g.setAttribute('transform', `translate(${ax.toFixed(1)} ${(ay - hh * ff).toFixed(1)})`);
    if (a.fade) g.setAttribute('opacity', (a.fade === 'in' ? Math.min(1, p * 3) : Math.max(0, 1 - p * 1.4)).toFixed(2));
    if (a.pose2 && q >= 1 && P.poses[k] !== a.pose2) { P.poses[k] = a.pose2; g.innerHTML = scActorInner(a, a.pose2)[0]; }
  });
  // the cross-fade at each cut (also with Motion off: it is a fade, not a move)
  const into = ms - P.shots.slice(0, i).reduce((n, s) => n + s.d * 1000, 0), left = x.d * 1000 - into, fd = $('.sc-fade', L);
  const fo = i === 0 && into < SC_FADE_MS ? 1 - into / SC_FADE_MS : into < SC_FADE_MS && i > 0 ? 1 - into / SC_FADE_MS : left < SC_FADE_MS ? 1 - left / SC_FADE_MS : 0;
  fd.style.opacity = Math.max(0, Math.min(1, fo)).toFixed(2);
  const sk = $('.sc-skip', L); if (sk.hidden && ms >= P.skipAt) { sk.hidden = false; }
  SC.raf = requestAnimationFrame(scFrame);
}
function scEnd(skipped) {
  const P = SC.on; if (!P) return; SC.on = null; cancelAnimationFrame(SC.raf);
  const L = scLayer(); L.hidden = true; $('.sc-cam', L).innerHTML = ''; SC.lastEnd = Date.now(); SC.calm = 0;
  try { lastTick = performance.now(); } catch (e) { /* the loop has its own clock */ }
  try { if (typeof rmResume === 'function') rmResume('scene'); } catch (e) { /* no roaming */ }
  emit('sc:end', { id: P.id, skipped: !!skipped, replay: !!P.o.replay });
  if (P.o.onEnd) { try { P.o.onEnd(!!skipped); } catch (e) { console.warn('sc end', e); } }
}
document.addEventListener('keydown', (e) => { if (SC.on && e.key === 'Escape') { const sk = $('#scLayer .sc-skip'); if (sk && !sk.hidden) { e.preventDefault(); e.stopPropagation(); scEnd(true); } } }, true);

/* ---------------- the automatic queue: never on top of anything ---------------- */
function scCalmNow() {
  if (!S || SC.on || !titleEl.hidden || !['yard', 'market'].includes(cur.mode) || !modal.hidden || busy) return false;
  if (typeof levelQueue !== 'undefined' && levelQueue.length) return false;
  if (typeof lvQueue !== 'undefined' && lvQueue.length) return false;
  if (typeof popOpen === 'function' && popOpen()) return false;
  if (typeof gdLive === 'function' && gdLive() && gdAllowed()) return false;
  if (typeof phActive === 'function' && phActive()) return false; if (typeof blOn === 'function' && blOn()) return false;
  if ($('#gdLayer .gd-card:not([hidden])')) return false;
  if (S.fw && typeof fwOn === 'function' && fwOn()) { const f = S.fw; if (f.morning && f.shown !== f.morning) return false; if (Object.keys(f.b2pending || {}).length) return false; }
  if (typeof nwOn === 'function' && nwOn() && typeof nwLatest === 'function' && S.newsSeen !== nwLatest()) return false; // What's new goes first
  if (S.wbPend && typeof wbOn === 'function' && wbOn()) return false; // then While you were out
  return true;
}
function scQueue(id) {
  if (!S || !S.story || !SC_SCRIPTS[id] || S.story.q.includes(id) || S.story.w[id]) return false;
  S.story.q.push(id); markDirty(); return true;
}
function scTick() {
  if (!S || !S.story || !S.story.q.length || !scAllowed()) { SC.calm = 0; return; }
  if (!scCalmNow() || Date.now() - SC.lastEnd < SC_GAP_MS) { SC.calm = 0; return; }
  if (!SC.calm) SC.calm = Date.now();
  if (Date.now() - SC.calm < SC_CALM_MS) return;
  SC.calm = 0;
  const id = S.story.q[0];
  if (!SC_SCRIPTS[id]) { S.story.q.shift(); markDirty(); return; }
  scPlayAuto(id);
}
// an automatic play: unlocks the memory at the start, marks it watched (whether it ran to the end or was skipped)
function scPlayAuto(id) {
  const ok = scPlay(id, { onEnd: () => { const T = S && S.story; if (!T) return; T.q = T.q.filter((x) => x !== id); T.w[id] = 1; markDirty(); try { saveNow(); } catch (e) { /* storage */ } } });
  if (ok) { const T = S.story; if (!T.m[id]) T.m[id] = jstISO(); markDirty(); }
  return ok;
}
setInterval(() => { try { scTick(); } catch (e) { console.warn('sc tick', e); } }, 400);
