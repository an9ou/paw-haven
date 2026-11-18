/* ======================= "Home screen tip": 59_a2hs.js (tag a2) =======================
   Marketing idea, owner's go-ahead 16 Nov 2026: a kind tip that Doodle Doggo can live on the phone's home screen, one tap from the dog.
   Where: only the site copy, https://doodledoggo.app/play/ (opened by itself, or in the game box of the site's own pages), on a phone or a
     tablet. Never in the itch.io frame (any frame that is not the site's own), never on a computer, never on a test copy (test.doodledoggo.app,
     GitHub Pages, a local file) unless prefs.a2Force is set, and never when the game already runs as an installed app (display-mode standalone,
     navigator.standalone). The Android app's WebView and in-app browsers have no way to add an icon, so they never see it either.
   When: from the player's 2nd day played (S.daysPlayed, 53_welcome.js), a little into the session, on a calm home yard or house: after the
     calendar's daily page, What's new and While you were out, never over a sheet, a story scene, a walk, photo mode, ball play or a guide step
     (nwCalmNow, 49c_news.js). At most once a week and A2_MAX times in all; never again after "No thanks", after "Got it" or once it was added.
   How: Android (Chrome, Edge, Samsung Internet): the browser's beforeinstallprompt event is kept (so its own bar never pops up on the first
     visit) and our card's "Add to home screen" button calls its prompt(). In the site's game box the site page keeps the event for us
     (window.__ddInstall, site/js/site.js). iPhone and iPad (Safari only): there is no prompt, so the card shows the two steps, Share and then
     "Add to Home Screen". An iOS home screen icon keeps its own save, so that card also says how the dogs come along (an account).
   State: prefs.a2 = { n: times shown, at: last shown (ms), no: "No thanks", done: added or "Got it" }. It is about this device and this
     browser, not about the dogs, so it lives in prefs like the other device-only choices (prefs.shSize, the sound levels) and never in the
     cloud save: an icon added on one phone must not hide the tip on another, and a new game keeps the "No thanks". No save field.
   Under the test harness it needs prefs.a2Test. Test hook: window.__paw.a2. Suite: a2hs. */
const A2_HOSTS = ['doodledoggo.app', 'www.doodledoggo.app'], A2_WEEK = 7 * 864e5, A2_MAX = 3, A2_DAYS = 2;
const A2 = { evt: null, calm: 0, readyAt: 0, wait: 45000, calmMs: 5000, fake: null };
function a2On() { return !navigator.webdriver || !!(typeof prefs !== 'undefined' && prefs && prefs.a2Test); }

/* ---------------- where am I? (A2.fake: the suite's stand-in for the address, the frame and the device) ---------------- */
const a2Fake = (k) => (A2.fake && k in A2.fake ? A2.fake[k] : undefined);
function a2Host() { const f = a2Fake('host'); return String(f !== undefined ? f : location.hostname || '').toLowerCase(); }
function a2Path() { const f = a2Fake('path'); return String(f !== undefined ? f : location.pathname || ''); }
// '' = the page itself, 'site' = the game box of one of the site's own pages (same origin), 'other' = any other frame (itch.io)
function a2Frame() {
  const f = a2Fake('frame'); if (f !== undefined) return f;
  try { if (window.top === window.self) return ''; } catch (e) { return 'other'; }
  try { return window.parent === window.top && window.parent.location.host === location.host && !!window.parent.document.getElementById('gameframe') ? 'site' : 'other'; } catch (e) { return 'other'; } // itch.io is another origin: reading it throws
}
function a2Site() {
  if (a2Frame() === 'other') return false;
  if (prefs.a2Force) return true; // a dev switch for a test copy (the dev panel shows the card at once instead)
  return A2_HOSTS.includes(a2Host()) && /^\/play(\/|$)/.test(a2Path());
}
function a2UA() { const f = a2Fake('ua'); return String(f !== undefined ? f : navigator.userAgent || ''); }
function a2Touch() { const f = a2Fake('touch'); return f !== undefined ? +f || 0 : +navigator.maxTouchPoints || 0; }
// phones and tablets only: 'android', 'ios' (an iPad says Macintosh, with touch) or ''
function a2Plat() {
  const u = a2UA();
  if (/Android/i.test(u)) return /;\s*wv\)/.test(u) ? '' : 'android';
  if (/iPhone|iPad|iPod/.test(u) || (/Macintosh/.test(u) && a2Touch() > 1)) return 'ios';
  return '';
}
// Safari itself: the other iOS browsers and the in-app ones (Instagram, Line, ...) put Add to Home Screen elsewhere or have none
function a2Safari() { const u = a2UA(); return /Version\/[\d.]+.*Safari\//.test(u) && !/CriOS|FxiOS|EdgiOS|OPiOS|OPT\/|GSA\/|DuckDuckGo|YaBrowser|FBAN|FBAV|FB_IAB|Instagram|Line\/|MicroMessenger|KAKAOTALK|NAVER|Snapchat|TikTok|musical_ly|Twitter|Pinterest|LinkedInApp/i.test(u); }
function a2Standalone() {
  const f = a2Fake('standalone'); if (f !== undefined) return !!f;
  try { if (navigator.standalone === true) return true; return ['standalone', 'minimal-ui', 'window-controls-overlay'].some((m) => window.matchMedia('(display-mode: ' + m + ')').matches); } catch (e) { return false; }
}
// the install event that is waiting: this page's own, or the one the site page kept for its game box
function a2Evt() {
  if (A2.evt) return A2.evt;
  return a2Box('__ddInstall') || null;
}
// what the site page around the game box keeps for us (site/js/site.js): __ddInstall (the install event), __ddInstalled (it was added)
function a2Box(k, v) { if (a2Fake('frame') !== undefined || a2Frame() !== 'site') return null; try { if (v !== undefined) window.parent[k] = v; return window.parent[k]; } catch (e) { return null; } }
function a2EvtDrop() { A2.evt = null; a2Box('__ddInstall', null); }
// which card this device can use: 'android' (an install prompt is waiting), 'ios' (Safari's Share menu) or '' (no card)
function a2Kind() { const p = a2Plat(); return p === 'android' ? (a2Evt() ? 'android' : '') : p === 'ios' ? (a2Safari() ? 'ios' : '') : ''; }

/* ---------------- what this device remembers (prefs, never the save) ---------------- */
function a2St() {
  let a = prefs.a2; if (!a || typeof a !== 'object' || Array.isArray(a)) a = prefs.a2 = {};
  a.n = +a.n > 0 && isFinite(+a.n) ? Math.floor(+a.n) : 0; a.at = +a.at > 0 && isFinite(+a.at) ? Math.min(+a.at, Date.now()) : 0; // a clock that was ahead never locks the tip away
  a.no = !!a.no; a.done = !!a.done; return a;
}
function a2Due() {
  if (!S || !a2On() || !a2Site() || a2Standalone()) return false;
  const a = a2St(); if (!a.done && a2Box('__ddInstalled')) { a.done = true; savePrefs(); } // added from the browser's own menu, in the site's game box
  if (a.no || a.done || a.n >= A2_MAX) return false;
  if (a.at && Date.now() - a.at < A2_WEEK) return false;
  if (!(S.daysPlayed >= A2_DAYS)) return false;
  return !!a2Kind();
}
// a calm moment at home: nothing open, nothing playing, and the day's own pages (calendar, What's new, While you were out) have had their turn
function a2Calm() {
  if (!S || !(typeof nwCalmNow === 'function' ? nwCalmNow() : cur.mode === 'yard' && modal.hidden)) return false;
  if (!['yard', 'house'].includes(S.place) || S.sleeping) return false;
  if (typeof nwOn === 'function' && nwOn() && S.newsSeen !== nwLatest()) return false;
  if (S.wbPend && typeof wbOn === 'function' && wbOn()) return false;
  if (typeof buyOpen !== 'undefined' && buyOpen) return false;
  return true;
}
function a2Try() {
  if (a2Shown() || !a2Due() || !a2Calm()) { A2.calm = 0; return; }
  const now = Date.now();
  if (!A2.readyAt) A2.readyAt = now;
  if (now - A2.readyAt < A2.wait) return; // not the moment the game opens
  if (!A2.calm) A2.calm = now;
  if (now - A2.calm < A2.calmMs) return;
  A2.calm = 0; a2Open(a2Kind(), true);
}

/* ---------------- the art: crayon doodles in the doodle() hand (a flat fill under a two-stroke pencil line of the same path) ---------------- */
function a2Two(d, fill, w) { w = w || 2.4; return `<path d="${d}" fill="${fill}" stroke="none"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${INKG}" stroke-width="${(w * .45).toFixed(1)}" opacity=".5" transform="translate(-1 .7)" stroke-linecap="round"/>`; }
const a2Line = (d, w) => `<path d="${d}" fill="none" stroke="${INKG}" stroke-width="${w || 2.6}" stroke-linecap="round" stroke-linejoin="round"/>`;
// a little phone with a few app squares and ours in the middle
function a2PhoneSVG() {
  const sq = (x, y, c) => a2Two(`M${x + 3} ${y + 1} Q${x + 10} ${y - 1} ${x + 18} ${y + 1} Q${x + 21} ${y + 2} ${x + 20} ${y + 10} Q${x + 21} ${y + 18} ${x + 18} ${y + 20} Q${x + 10} ${y + 21} ${x + 3} ${y + 20} Q${x} ${y + 18} ${x + 1} ${y + 10} Q${x} ${y + 3} ${x + 3} ${y + 1}Z`, c, 1.6);
  // ours: the crayon dog of the real icon (brand/icon-192.png), as crude as the dogs themselves
  const dog = a2Two('M46 77 Q56 68 66 74 Q73 78 80 83 Q83 90 75 92 Q66 97 56 96 Q46 95 44 87 Q43 81 46 77Z', '#C8743C', 2) + a2Two('M46 77 Q41 85 46 93 Q52 88 53 78 Q50 75 46 77Z', '#7A4326', 1.8)
    + `<circle cx="61" cy="81" r="3.2" fill="#FFFBF3" stroke="${INKG}" stroke-width="1.3"/><circle cx="61.8" cy="81.3" r="1.4" fill="${INKG}"/><ellipse cx="79" cy="85.5" rx="2.6" ry="2.1" fill="${INKG}"/>`;
  return `<svg viewBox="0 0 120 170" class="a2-phone" aria-hidden="true">${a2Two('M24 8 Q60 4 96 8 Q104 10 104 20 Q107 86 104 150 Q104 160 95 162 Q60 166 25 162 Q16 160 16 150 Q13 86 16 20 Q16 10 24 8Z', '#FFFBF3', 2.8)}${a2Line('M50 17 Q60 15.5 70 17', 2.2)}`
    + sq(27, 30, '#CFE6F2') + sq(50, 30, '#F9D0D9') + sq(73, 30, '#D5EDC9') + sq(27, 118, '#E0D5F0') + sq(73, 118, '#CFE6F2')
    + a2Two('M43 62 Q60 58 77 62 Q83 64 82 84 Q83 104 77 106 Q60 110 43 106 Q37 104 38 84 Q37 64 43 62Z', '#FFF4DF', 2.6) + dog
    + `<g transform="translate(92 54) scale(.62)">${doodle('spark', 0, 0, 1, 12)}</g><g transform="translate(30 104) scale(.42)">${doodle('spark', 0, 0, 1, -8)}</g></svg>`;
}
// Safari's Share button (a box with an arrow going up out of it) and its "Add to Home Screen" row (a box with a plus)
function a2ShareSVG() { return `<svg viewBox="0 0 48 48" class="a2-ic" aria-hidden="true">${a2Two('M11 20 Q24 18 37 20 Q39 21 39 24 Q40 33 39 41 Q38 44 35 44 Q24 46 13 44 Q10 44 10 41 Q8 32 10 23 Q10 21 11 20Z', '#CFE6F2', 2.4)}<path d="M24 31 L24 6 M15 14 L24 5 L33 14" fill="none" stroke="#FFFBF3" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>${a2Line('M24 31 L24 6 M15 14 L24 5 L33 14', 3)}</svg>`; }
function a2PlusSVG() { return `<svg viewBox="0 0 48 48" class="a2-ic" aria-hidden="true">${a2Two('M10 8 Q24 5 38 8 Q41 9 41 12 Q43 24 41 36 Q41 40 38 41 Q24 43 10 41 Q7 40 7 37 Q5 24 7 12 Q7 9 10 8Z', '#FFE3A1', 2.4)}${a2Line('M24 15 L24 34 M14.5 24.5 L33.5 24.5', 3)}</svg>`; }

/* ---------------- the card ---------------- */
function a2Account() { return typeof CL !== 'undefined' && !!CL.uid && !CL.anon; }
function a2HTML(kind) {
  const name = NAME(), duck = typeof gdDuck === 'function' ? gdDuck('wave') : '';
  const head = `<div class="a2-top"><span class="a2-art" aria-hidden="true">${a2PhoneSVG()}</span><span class="a2-duck" aria-hidden="true">${duck}</span></div><p class="a2-lead" tabindex="-1" autofocus>${esc(tt('a2.lead', 'Put {name} one tap away. The game opens full screen, just like an app.', { name }))}</p>`;
  if (kind === 'ios') {
    return `<div class="a2 a2-ios">${head}<ol class="a2-steps"><li>${a2ShareSVG()}<span>${esc(tt('a2.ios_1', 'Tap the Share button in Safari.'))}<small>${esc(tt('a2.ios_dots', 'No Share button? Look under the three dots first.'))}</small></span></li><li>${a2PlusSVG()}<span>${esc(tt('a2.ios_2', 'Choose "Add to Home Screen".'))}</span></li></ol>
      <p class="a2-small a2-save">${esc(a2Account() ? tt('a2.ios_acct', 'Log in again from the new icon and {name} will be waiting.', { name }) : tt('a2.ios_guest', 'The new icon keeps its own save. Make an account in Settings first, then log in there and {name} will be waiting.', { name }))}</p></div>`;
  }
  return `<div class="a2 a2-android">${head}<p class="a2-small">${esc(tt('a2.free', 'It is free, and you can take it off again any time.'))}</p><p class="a2-small a2-hint" id="a2Hint" role="status"></p></div>`;
}
// the focus starts on the card's first line, not on a button: the card opens by itself, so a key pressed at that moment must never answer it
function a2Shown() { return !modal.hidden && !!$('.panel.a2-pop', modal); }
function a2Close() { if (a2Shown()) closeModal(); }
// auto: the game opened it by itself (counts towards once a week); the dev panel and the test hook pass false
function a2Open(kind, auto) {
  if (!S) return null; kind = kind === 'android' ? 'android' : 'ios';
  if (auto) { const a = a2St(); a.n++; a.at = Date.now(); savePrefs(); }
  const yes = kind === 'android' ? `<button class="btn yes big a2-yes" id="a2Add">${esc(tt('a2.add', 'Add to home screen'))}</button>` : `<button class="btn yes big a2-yes" id="a2Ok">${esc(tt('a2.got', 'Got it'))}</button>`;
  const p = openModal(esc(tt('a2.title', 'Add Doodle Doggo to your home screen')), a2HTML(kind), { cls: 'a2-pop', foot: `<button class="btn a2-no" id="a2No">${esc(tt('a2.no', 'No thanks'))}</button>${yes}` });
  p.dataset.a2 = kind;
  const body = $('.panel-body', p); if (body && body.scrollHeight > body.clientHeight + 1) p.classList.add('a2-tight'); // the smallest phones in the longest languages: the words go before the drawing
  $('#a2No', p).onclick = () => { SFX.click(); a2St().no = true; savePrefs(); a2Close(); };
  const ok = $('#a2Ok', p); if (ok) ok.onclick = () => { SFX.click(); a2St().done = true; savePrefs(); a2Close(); };
  const add = $('#a2Add', p); if (add) add.onclick = () => { SFX.click(); a2Install(p); };
  return p;
}
function a2Added() { a2St().done = true; savePrefs(); a2Close(); if (S) toast(tt('a2.added', 'Done! Look for the crayon dog on your home screen.'), 'good'); }
// the browser could not show its own window (the event was used up, or it is a preview): say where the same thing lives in its menu
function a2Hint(p) {
  if (!p || !p.isConnected) return;
  const h = $('#a2Hint', p), add = $('#a2Add', p); if (h) h.textContent = tt('a2.menu', 'Your browser keeps this in its own menu too: look for "Add to Home screen".');
  if (add) { add.textContent = tt('a2.ok', 'OK'); add.onclick = () => { SFX.click(); a2Close(); }; }
}
function a2Install(p) {
  const e = a2Evt(); if (!e || typeof e.prompt !== 'function') return a2Hint(p);
  let r = null; a2EvtDrop(); // an install event works once
  try { r = e.prompt(); } catch (err) { return a2Hint(p); }
  Promise.resolve(e.userChoice || r).then((c) => { if (c && c.outcome === 'accepted') a2Added(); else a2Close(); /* not now: the weekly rule holds */ }, () => a2Hint(p));
}

/* ---------------- the browser's side ---------------- */
// Android: keep the install event for the calm moment (so the browser's own bar does not pop up on a first visit). Only on the site copy, on a phone or tablet
window.addEventListener('beforeinstallprompt', (e) => { try { if (!a2On() || !a2Site() || !a2Plat()) return; e.preventDefault(); A2.evt = e; } catch (err) { /* leave the browser to it */ } });
window.addEventListener('appinstalled', () => { try { if (a2On() && a2Site()) a2Added(); } catch (err) { /* nothing to say */ } });

/* ---------------- the loop and the hook ---------------- */
function a2Expose() {
  if (!window.__paw || window.__paw.a2) return;
  window.__paw.a2 = {
    on: () => a2On(), test: (v) => { prefs.a2Test = !!v; }, force: (v) => { prefs.a2Force = !!v; savePrefs(); }, env: (o) => { A2.fake = o || null; return A2.fake; },
    site: () => a2Site(), frame: () => a2Frame(), plat: () => a2Plat(), safari: () => a2Safari(), standalone: () => a2Standalone(), kind: () => a2Kind(), due: () => a2Due(), calm: () => a2Calm(),
    st: () => Object.assign({}, a2St()), set: (o) => { Object.assign(a2St(), o || {}); savePrefs(); return Object.assign({}, a2St()); }, open: (k) => a2Open(k || a2Kind(), false), shown: () => a2Shown(),
    timing: (wait, calmMs) => { if (typeof wait === 'number') A2.wait = wait; if (typeof calmMs === 'number') A2.calmMs = calmMs; return [A2.wait, A2.calmMs]; }, evt: () => !!a2Evt(), WEEK: A2_WEEK, MAX: A2_MAX, DAYS: A2_DAYS
  };
}
setInterval(() => { try { a2Expose(); a2Try(); } catch (e) { console.warn('a2 tick', e); } }, 1000);
on('game:ready', () => { A2.calm = 0; A2.readyAt = Date.now(); a2Expose(); });
