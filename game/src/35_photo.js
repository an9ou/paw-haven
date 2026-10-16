/* ======================= v2.9 PHOTO lane (tag ph): photo mode, the crayon postcard frame, Save / Share. See V29.md sections 2 and 5 =======================
   Save field S.ph { n, first } (v29Fields in 00_core.js). Photos are never kept in the save. The PHOTO lane owns this file.
   Flow: the camera button (desktop: next to #muteBtn, phone: the "..." sheet) -> phOpen() covers the stage with the photo screen -> the live scene SVG is cloned
   (page CSS inlined, animations frozen, nothing external) and framed by PawArt.postcard() -> one SVG string shown as an <img> and drawn to a canvas for the PNG.
   Save: Web Share with the file, else a download, else (the claude.ai artifact sandbox) a full-screen picture with "Press and hold to save".
   API: phOpen(), phClose(), phActive(), phPlaceName(), PH_CAPS, phCaps(), phCan(). Test hook: window.__paw.ph. */
const PH_CAPS = ['Best day ever', 'Nap champions', 'Snack o\'clock', 'Zoomies loading', 'Drawn on purpose', 'Good dogs, mostly', 'This is my pack', 'Wish you were here'];
const PH_SEASON_CAP = { spring: 'Spring in my paws', summer: 'Sunny paws, happy dogs', autumn: 'Leaf pile pending', winter: 'Cold noses, warm hearts' };
const PH_LONG = 1080;
const PH = { on: false, cap: null, tok: 0, svg: '', size: null, blob: null, blobTok: -1, blobP: null, url: '', saving: false, said: false, force: '', obs: [], keyFn: null, lastFocus: null, timer: 0, hold: null };

const phCaps = () => PH_CAPS.map((t, i) => ({ id: 'c' + i, t })).concat([{ id: 'season', t: PH_SEASON_CAP[seasonNow()] || PH_SEASON_CAP.summer }]);
function phCapNow() { const l = phCaps(); return l.find((c) => c.id === prefs.phCap) || l[0]; }
function phColorNow() { const l = (window.PawArt && PawArt.POSTCARD_COLORS) || []; return l.find((c) => c.k === prefs.phFrame) || l[0] || { k: 'rose', n: 'Rose', c: '#F7B2C4' }; }
function phPlaceName() { const p = S && S.place; return p === 'yard' ? 'Home' : p === 'house' ? 'The house' : (PLACES[p] && PLACES[p].n) || 'Doodle Town'; }
function phDateLine() { const [y, m, d] = jstISO().split('-').map(Number); return `${d} ${FS_MONTHS[m - 1]} ${y}`; } // the Japan date, written like the festival dates
function phNames(list) { return list.length < 2 ? list.join('') : list.slice(0, -1).join(', ') + ' and ' + list[list.length - 1]; }
const phActive = () => PH.on;

/* the camera is for the yard, the house and every town place: not on the title, walks, mini-games, the map, in a modal or while placing decorations */
function phCan() {
  return !!S && !PH.on && (cur.mode === 'yard' || cur.mode === 'market') && modal.hidden && !hud.hidden && !(typeof HO === 'object' && HO && HO.pl) && !!$('#view > svg.world');
}

/* ---------- the camera button (desktop), inserted next to the mute button ---------- */
const phBtn = document.createElement('button');
phBtn.id = 'phBtn'; phBtn.className = 'iconbtn'; phBtn.type = 'button'; phBtn.hidden = true; phBtn.setAttribute('aria-label', 'Take a photo'); phBtn.title = 'Take a photo';
phBtn.innerHTML = ICON('camera');
phBtn.onclick = () => { firstGesture(); SFX.click(); phOpen(); };
$('#muteBtn').insertAdjacentElement('afterend', phBtn);
function phSync() { phBtn.hidden = !phCan(); }
[[modal, { attributes: true, attributeFilter: ['hidden'] }], [hud, { attributes: true, attributeFilter: ['hidden'] }], [view, { childList: true }], [stage, { attributes: true, attributeFilter: ['class'] }]].forEach(([el, o]) => new MutationObserver(phSync).observe(el, o));
phSync();

/* ---------- capturing the live scene ---------- */
// The scene is one SVG (#view > svg.world). Saved as an image it has no page, so what the page CSS does to it is written into the clone: the matching rules'
// presentation properties become inline styles, frozen animations and transitions keep the value they have now, and nothing may point outside the file.
const PH_KEEP = /^(display|visibility|opacity|fill|fill-opacity|fill-rule|stroke|stroke-[a-z]+|transform|transform-origin|transform-box|translate|rotate|scale|filter|mix-blend-mode|clip-path|mask|paint-order|font-[a-z]+|text-anchor|letter-spacing|word-spacing|color|overflow|stop-color|stop-opacity|marker-[a-z]+|isolation)$/;
const PH_ANIM = ['transform', 'transform-origin', 'transform-box', 'translate', 'rotate', 'scale', 'opacity', 'fill', 'stroke', 'stroke-dashoffset', 'filter', 'visibility', 'display'];
function phRules(root) {
  const out = [];
  const walk = (rules) => {
    for (const r of rules) {
      if (r.type === 1) {
        const sel = r.selectorText || ''; if (/:(hover|focus|active|focus-visible|focus-within|before|after|checked|disabled)|::/.test(sel)) continue;
        const props = []; for (let i = 0; i < r.style.length; i++) { const p = r.style[i]; if (PH_KEEP.test(p)) props.push(p); }
        if (!props.length) continue;
        let hit; try { hit = root.querySelectorAll(sel); } catch (e) { continue; }
        hit.forEach((el) => { if (el !== root) out.push([el, props]); });
      } else if (r.type === 4) { try { if (matchMedia(r.conditionText || r.media.mediaText).matches) walk(r.cssRules); } catch (e) { /* skip */ } }
      else if (r.type === 12) { try { if (CSS.supports(r.conditionText)) walk(r.cssRules); } catch (e) { /* skip */ } }
    }
  };
  for (const sh of document.styleSheets) { let rs; try { rs = sh.cssRules; } catch (e) { continue; } if (rs) walk(rs); } // a cross-origin sheet (the web fonts) cannot be read: it holds no scene rules
  return out;
}
function phDogBox(svg) { // the dogs' x range in scene units, so the phone and square crops keep every dog in
  const m = svg.getScreenCTM(); if (!m) return null; const inv = m.inverse(); let L = 1e9, R = -1e9;
  svg.querySelectorAll('#dogPos, #pack .packdog, #visitorG').forEach((el) => {
    const r = el.getBoundingClientRect(); if (!r.width) return;
    L = Math.min(L, new DOMPoint(r.left, r.top).matrixTransform(inv).x); R = Math.max(R, new DOMPoint(r.right, r.bottom).matrixTransform(inv).x);
  });
  return R > L ? [L, R] : null;
}
function phCapture() {
  const svg = $('#view > svg.world'); if (!svg) return null;
  const cl = svg.cloneNode(true), src = [...svg.querySelectorAll('*')], dst = [...cl.querySelectorAll('*')], at = new Map(src.map((e, i) => [e, dst[i]]));
  const setStyle = (el, props) => { const c = at.get(el); if (!c) return; const cs = getComputedStyle(el); props.forEach((p) => { const v = cs.getPropertyValue(p); if (v) c.style.setProperty(p, v); }); };
  phRules(svg).forEach(([el, props]) => setStyle(el, props));
  try { svg.getAnimations({ subtree: true }).forEach((a) => { const t = a.effect && a.effect.target; if (t && at.has(t)) setStyle(t, PH_ANIM); }); } catch (e) { /* no Web Animations: the CSS values stand */ }
  cl.querySelectorAll('#fx, .soon-tag, #dogHit').forEach((e) => e.remove());
  const clean = (e) => { // no scripts, no handlers, nothing that points outside the file (a tainted canvas would stop the PNG)
    [...e.attributes].forEach((a) => {
      const n = a.name.toLowerCase(), v = a.value;
      if (n.startsWith('on') || n === 'tabindex' || n === 'role' || n === 'aria-label' || n === 'data-dog') e.removeAttribute(a.name);
      else if ((n === 'href' || n === 'xlink:href') && !/^(#|data:)/.test(v)) e.removeAttribute(a.name);
      else if (/url\(\s*['"]?(?!#|data:)/i.test(v)) e.removeAttribute(a.name);
    });
    if (e.style && /url\(\s*['"]?(?!#|data:)/i.test(e.getAttribute('style') || '')) e.removeAttribute('style');
  };
  clean(cl); cl.querySelectorAll('*').forEach(clean); cl.querySelectorAll('script, foreignObject').forEach((e) => e.remove());
  const lv = (svg.getAttribute('viewBox') || '0 0 1000 600').split(/\s+/).map(Number), vb = [0, lv[1], 1000, lv[3]]; // the whole scene width: the phone camera crop is not the photo
  const tint = $('.tintfx', view), wx = $('.wxfx', view);
  const names = [S.dog.name].concat([...svg.querySelectorAll('#pack [data-dog]')].map((e) => (dogById(e.dataset.dog) || {}).name).filter(Boolean));
  cl.removeAttribute('class'); cl.removeAttribute('style'); cl.removeAttribute('id');
  return { inner: new XMLSerializer().serializeToString(cl).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''), vb, dogs: phDogBox(svg), tint: tint ? tint.className : '', wx: wx ? (wx.classList.contains('snow') ? 'snow' : 'rain') : '', names, place: phPlaceName(), date: phDateLine(), year: jstISO().slice(0, 4) };
}
// the daylight and weather washes live in <div>s over the scene: here they are drawn into the picture
const PH_TINT = {
  night: ['#2b3566', '#46507a', '#5b6386', .62], dusk: ['#e7a3b8', '#f3c49a', '#f3c49a', .45], dawn: ['#f9c6b6', '#fde3c4', '#fde3c4', .35]
};
function phWash(c, vb) {
  const [x, y, w, h] = vb; let s = '';
  const cls = (c.tint || '').split(/\s+/), time = ['night', 'dusk', 'dawn', 'day'].find((t) => cls.includes(t)), wet = cls.includes('w-rain') || cls.includes('w-cloudy'), snowy = cls.includes('w-snow');
  if (PH_TINT[time]) { const t = PH_TINT[time]; s += `<defs><linearGradient id="phx-tint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t[0]}"/><stop offset=".6" stop-color="${t[1]}"/><stop offset="1" stop-color="${t[2]}"/></linearGradient></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#phx-tint)" opacity="${t[3]}" style="mix-blend-mode:multiply"/>`; }
  else if (time === 'day' && (wet || snowy)) s += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${snowy ? '#dfe6ee' : '#b9c2cf'}" opacity="${snowy ? .35 : .45}" style="mix-blend-mode:multiply"/>`;
  if (c.wx === 'rain') s += `<defs><pattern id="phx-rain" width="38" height="46" patternUnits="userSpaceOnUse" patternTransform="rotate(14)"><path d="M7 2V20M25 24V42" stroke="#465c80" stroke-opacity=".42" stroke-width="1.4" stroke-linecap="round" fill="none"/><path d="M34 8V16" stroke="#5b3d32" stroke-opacity=".22" stroke-width="1.1" stroke-linecap="round"/></pattern></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#phx-rain)"/>`;
  if (c.wx === 'snow') s += `<defs><pattern id="phx-snow" width="52" height="52" patternUnits="userSpaceOnUse"><circle cx="9" cy="8" r="2.4" fill="#fff" stroke="#5b3d32" stroke-opacity=".5" stroke-width=".7"/><circle cx="33" cy="30" r="1.8" fill="#fff" stroke="#5b3d32" stroke-opacity=".4" stroke-width=".6"/><circle cx="46" cy="12" r="1.5" fill="#fff" stroke="#5b3d32" stroke-opacity=".4" stroke-width=".6"/><circle cx="18" cy="44" r="2.1" fill="#fff" stroke="#5b3d32" stroke-opacity=".5" stroke-width=".7"/></pattern></defs><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#phx-snow)"/>`;
  return s;
}

/* ---------- composing the postcard ---------- */
function phLayout(c, sq) { // the card size and the part of the scene the picture shows
  const PA = window.PawArt, base = c.vb, bh = base[3], by = base[1];
  let vb = base.slice(), size;
  if (sq) {
    size = { w: PH_LONG, h: PH_LONG }; const win = PA.postcardWindow(size.w, size.h), a = win.w / win.h;
    vb = [0, by, bh * a, bh];
  } else if (isPhone()) {
    const span = c.dogs ? c.dogs[1] - c.dogs[0] : 300, w = clamp(span + 110, 480, base[2]) * bh / 600;
    vb = [0, by, w, bh]; size = PA.postcardSize(w / bh, PH_LONG);
  } else size = PA.postcardSize(base[2] / bh, PH_LONG);
  if (vb[2] < base[2] && vb[0] === 0) { // centre the crop on the dogs and keep it inside the scene
    const mid = c.dogs ? (c.dogs[0] + c.dogs[1]) / 2 : base[0] + base[2] / 2;
    vb[0] = clamp(mid - vb[2] / 2, base[0], base[0] + base[2] - vb[2]);
  }
  return { vb, size };
}
function phCompose(c, o) {
  const PA = window.PawArt, L = phLayout(c, o.sq), win = PA.postcardWindow(L.size.w, L.size.h), vb = L.vb.map((n) => +n.toFixed(2));
  const scene = `<svg x="${win.x.toFixed(2)}" y="${win.y.toFixed(2)}" width="${win.w.toFixed(2)}" height="${win.h.toFixed(2)}" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid slice" overflow="hidden"><rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#FFFBF3"/>${c.inner}${phWash(c, vb)}</svg>`;
  let svg = PA.postcard(L.size.w, L.size.h, { color: o.color, stamp: c.year, scene, caption: o.caption, place: c.place, date: c.date, dogs: phNames(c.names) });
  svg = svg.replace(/^(<svg[^>]*>)/, `$1<style>${PH_FONT_CSS}*{animation:none!important;transition:none!important}</style>`);
  return { svg, size: L.size };
}
function phDataURL(svg) {
  const bytes = new TextEncoder().encode(svg); let bin = ''; for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return 'data:image/svg+xml;base64,' + btoa(bin);
}
const phSafari = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (/Safari/.test(navigator.userAgent) && !/Chrome|Chromium|Android/.test(navigator.userAgent));
function phLoadImg(url) { return new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('photo image failed')); im.src = url; }); }
async function phLoad(url) {
  let im = await phLoadImg(url);
  if (phSafari()) { // Safari draws the fonts of an SVG image only from its second load
    try { const t = document.createElement('canvas'); t.width = t.height = 2; t.getContext('2d').drawImage(im, 0, 0, 2, 2); } catch (e) { /* ignore */ }
    await new Promise((r) => setTimeout(r, 60)); im = await phLoadImg(url);
  }
  try { if (im.decode) await im.decode(); } catch (e) { /* ignore */ }
  return im;
}

/* ---------- the photo screen ---------- */
function phOpts() { return { sq: !!prefs.phSq, color: phColorNow().k, caption: phCapNow().t }; }
function phDraw(delay) {
  clearTimeout(PH.timer);
  const run = async () => {
    if (!PH.on || !PH.cap) return; const tok = ++PH.tok; PH.blob = null; PH.blobTok = -1;
    const o = phOpts(), r = phCompose(PH.cap, o); PH.svg = r.svg; PH.size = r.size;
    const url = phDataURL(r.svg), pic = $('.ph-pic'), root = $('#phMode'); if (root) root.classList.add('ph-busy');
    let im; try { im = await phLoad(url); } catch (e) { if (root) root.classList.remove('ph-busy'); toast('The camera jammed. Try again.'); return; }
    if (tok !== PH.tok || !PH.on) return;
    if (pic) { pic.src = url; pic.width = r.size.w; pic.height = r.size.h; }
    if (root) { root.classList.remove('ph-busy'); root.dataset.size = r.size.w + 'x' + r.size.h; root.dataset.sq = o.sq ? '1' : '0'; }
    // the PNG is made now, so a tap on Save can hand it straight to the share sheet (browsers want the share inside the tap)
    const cv = document.createElement('canvas'); cv.width = r.size.w; cv.height = r.size.h; const ctx = cv.getContext('2d');
    ctx.fillStyle = '#FFFBF3'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(im, 0, 0, cv.width, cv.height);
    PH.blobP = new Promise((res) => { try { cv.toBlob((b) => { if (tok === PH.tok) { PH.blob = b; PH.blobTok = tok; } res(b); }, 'image/png'); } catch (e) { res(null); } });
  };
  if (delay) PH.timer = setTimeout(run, delay); else run();
}
function phPanel() {
  const cols = PawArt.POSTCARD_COLORS, caps = phCaps(), col = phColorNow(), cap = phCapNow();
  return `<div class="ph-view"><img class="ph-pic" alt="Your photo, framed as a postcard" draggable="false"></div>
  <div class="ph-side">
    <h2 class="ph-h">Say cheese</h2>
    <div class="ph-sec"><span class="ph-lbl">Frame</span><div class="ph-row ph-frames" role="group" aria-label="Frame colour">${cols.map((c) => `<button type="button" class="ph-swatch" data-frame="${c.k}" aria-label="${c.n} frame" title="${c.n}" aria-pressed="${c.k === col.k}" style="--sw:${c.c}"></button>`).join('')}</div></div>
    <div class="ph-sec"><span class="ph-lbl">Caption</span><div class="ph-row ph-caps" role="group" aria-label="Caption">${caps.map((c) => `<button type="button" class="btn ph-cap" data-cap="${c.id}" aria-pressed="${c.id === cap.id}">${esc(c.t)}</button>`).join('')}</div></div>
    <div class="ph-sec"><span class="ph-lbl">Shape</span><div class="ph-row ph-shapes" role="group" aria-label="Picture shape"><button type="button" class="btn ph-shape" data-sq="0" aria-pressed="${!prefs.phSq}">Postcard</button><button type="button" class="btn ph-shape" data-sq="1" aria-pressed="${!!prefs.phSq}" aria-label="Square picture">Square</button></div></div>
    <div class="ph-acts"><button type="button" class="btn yes" id="phSave">Save photo</button><button type="button" class="btn" id="phAgain">Retake</button><button type="button" class="btn" id="phClose">Close</button></div>
  </div>`;
}
function phOpen() {
  if (!phCan()) return false;
  const cap = phCapture(); if (!cap) return false;
  PH.on = true; PH.cap = cap; PH.lastFocus = document.activeElement; hideBubble(); toasts.innerHTML = ''; // a clear screen: the hints that were up fold away
  let root = $('#phMode'); if (!root) { root = document.createElement('div'); root.id = 'phMode'; root.className = 'ph-mode'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Photo mode'); stage.appendChild(root); }
  root.hidden = false; root.classList.remove('ph-busy'); root.innerHTML = phPanel(); stage.classList.add('ph-on'); phBtn.hidden = true;
  root.querySelectorAll('[data-frame]').forEach((b) => { b.onclick = () => { SFX.click(); prefs.phFrame = b.dataset.frame; savePrefs(); root.querySelectorAll('[data-frame]').forEach((x) => x.setAttribute('aria-pressed', x === b)); phDraw(30); }; });
  root.querySelectorAll('[data-cap]').forEach((b) => { b.onclick = () => { SFX.click(); prefs.phCap = b.dataset.cap; savePrefs(); root.querySelectorAll('[data-cap]').forEach((x) => x.setAttribute('aria-pressed', x === b)); phDraw(30); }; });
  root.querySelectorAll('[data-sq]').forEach((b) => { b.onclick = () => { SFX.click(); prefs.phSq = b.dataset.sq === '1' && !prefs.phSq; savePrefs(); root.querySelectorAll('[data-sq]').forEach((x) => x.setAttribute('aria-pressed', (x.dataset.sq === '1') === !!prefs.phSq)); phDraw(30); }; }); // on a phone the Square button is a switch: tapping it again goes back to the postcard
  $('#phSave', root).onclick = () => phSave();
  $('#phAgain', root).onclick = () => { SFX.click(); const c = phCapture(); if (c) { PH.cap = c; phDraw(); } };
  $('#phClose', root).onclick = () => { SFX.click(); phClose(); };
  PH.keyFn = (e) => { if (e.key !== 'Escape' || !PH.on) return; e.preventDefault(); e.stopPropagation(); if (PH.hold) phHoldClose(); else phClose(); };
  window.addEventListener('keydown', PH.keyFn, true);
  PH.obs = [new MutationObserver(() => { if (!modal.hidden) phClose(); })]; PH.obs[0].observe(modal, { attributes: true, attributeFilter: ['hidden'] }); // a pop-up (a level-up, a letter) ends the photo
  onCleanup(() => phClose(true)); // leaving the place (any go()) ends it too
  phDraw();
  if (S.ph && !S.ph.first && !PH.said) { PH.said = true; setTimeout(() => { if (PH.on) toast('Gerald the duck: "Say cheese. Or kibble."', 'gold'); }, 250); }
  setTimeout(() => { const b = $('#phSave'); if (b && PH.on && !PH.hold) b.focus({ preventScroll: true }); }, 0);
  return true;
}
function phClose(quiet) {
  if (!PH.on) return; PH.on = false; clearTimeout(PH.timer); PH.tok++; phHoldClose();
  window.removeEventListener('keydown', PH.keyFn, true); PH.obs.forEach((o) => o.disconnect()); PH.obs = [];
  const root = $('#phMode'); if (root) { root.hidden = true; root.innerHTML = ''; }
  stage.classList.remove('ph-on'); PH.cap = null; PH.blob = null; PH.svg = '';
  phSync();
  if (!quiet) { const f = PH.lastFocus; if (f && document.contains(f) && !f.hidden && f.focus) try { f.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
}

/* ---------- Save: share, download, or hold to save ---------- */
function phFileName() { return `doodle-doggo-${jstISO()}-${(S.ph && S.ph.n || 0) + 1}.png`; }
const phDownloadOK = () => !PH.force && !(typeof clArtifact === 'function' && clArtifact()); // the claude.ai artifact sandbox blocks downloads
function phCounted(how) {
  const n = PH.cap ? PH.cap.names.length : 1;
  S.ph.n = (S.ph.n || 0) + 1; if (!S.ph.first) S.ph.first = localISO(); markDirty(); saveNow();
  trackAct('photo', { dogs: n, how });
}
async function phDeliver(blob) {
  const file = new File([blob], phFileName(), { type: 'image/png' });
  let how = '';
  if (PH.force !== 'none' && navigator.share && navigator.canShare) {
    let can = false; try { can = navigator.canShare({ files: [file] }); } catch (e) { can = false; }
    if (can) {
      try { await navigator.share({ files: [file], title: 'Doodle Doggo' }); how = 'share'; }
      catch (e) { if (e && e.name === 'AbortError') return null; how = ''; } // closed the share sheet: nothing was saved. Any other error: try the download
    }
  }
  if (!how && phDownloadOK()) {
    const url = URL.createObjectURL(blob), a = document.createElement('a'); a.href = url; a.download = file.name; a.rel = 'noopener'; a.style.display = 'none';
    document.body.appendChild(a); a.click(); setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 4000); how = 'download';
  }
  if (!how) { await phHoldOpen(blob); how = 'hold'; }
  return how;
}
async function phSave() {
  if (!PH.on || PH.saving || !PH.cap) return;
  PH.saving = true; const root = $('#phMode'); if (root) root.classList.add('ph-saving');
  try {
    let blob = PH.blobTok === PH.tok ? PH.blob : null;
    if (!blob) { try { blob = await PH.blobP; } catch (e) { blob = null; } }
    if (!blob) { toast('The camera jammed. Try again.'); return; }
    const how = await phDeliver(blob);
    if (how) { phCounted(how); SFX.boop(760); if (how === 'download') toast('Photo saved. Look in your downloads.', 'good'); else if (how === 'share') toast('Photo shared.', 'good'); }
  } finally { PH.saving = false; if (root) root.classList.remove('ph-saving'); }
}
function phHoldOpen(blob) { // no share and no download here: the picture fills the screen so it can be pressed and held
  return new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => {
      const root = $('#phMode'); if (!root) return res();
      const h = document.createElement('div'); h.className = 'ph-hold'; h.setAttribute('role', 'dialog'); h.setAttribute('aria-label', 'Save your photo');
      h.innerHTML = `<p class="ph-holdtxt">Press and hold to save</p><img class="ph-holdpic" alt="Your photo. Press and hold it to save." src="${fr.result}"><button type="button" class="btn yes" id="phHoldDone">Done</button>`;
      root.appendChild(h); PH.hold = h; $('#phHoldDone', h).onclick = () => { SFX.click(); phHoldClose(); }; setTimeout(() => { const b = $('#phHoldDone', h); if (b) b.focus({ preventScroll: true }); }, 0); res();
    };
    fr.onerror = () => res(); fr.readAsDataURL(blob);
  });
}
function phHoldClose() { if (PH.hold) { PH.hold.remove(); PH.hold = null; const b = $('#phSave'); if (b && PH.on) b.focus({ preventScroll: true }); } }

/* ---------- journal line, test hook ---------- */
function phJournalLine() { const n = (S && S.ph && S.ph.n) || 0; return `<p class="small ph-jline">Photos taken: <b>${n}</b>${n ? '' : '. The camera button is by the sound button, or in the menu on a phone.'}</p>`; }
function phExpose() {
  if (!window.__paw || window.__paw.ph) return;
  window.__paw.ph = { open: () => phOpen(), close: () => phClose(), active: () => PH.on, can: () => phCan(), caps: () => phCaps(), svg: () => PH.svg, size: () => PH.size, ready: () => PH.blobTok === PH.tok && !!PH.blob, blobSize: () => PH.blob && PH.blob.size, force: (v) => { PH.force = v || ''; }, say: () => PH.said, place: () => phPlaceName(), date: () => phDateLine(), names: () => PH.cap && PH.cap.names };
}
on('game:ready', () => setTimeout(phExpose, 0)); on('yard:enter', () => { phExpose(); phSync(); });
