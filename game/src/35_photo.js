/* ======================= v2.9 PHOTO lane (tag ph): photo mode, the crayon postcard frame, Save / Share. See V29.md sections 2 and 5 =======================
   Save field S.ph { n, first } (v29Fields in 00_core.js). Photos are never kept in the save. The PHOTO lane owns this file.
   Flow: the camera button (desktop: next to #muteBtn, phone: the "..." sheet) -> phOpen() covers the stage with the photo screen -> the live scene SVG is cloned
   (page CSS inlined, animations frozen, nothing external) and framed by PawArt.postcard() -> one SVG string shown as an <img> and drawn to a canvas for the PNG.
   Save: Web Share with the file, else a download, else (the claude.ai artifact sandbox) a full-screen picture with "Press and hold to save".
   API: phOpen(), phClose(), phActive(), phPlaceName(), PH_CAPS, phCaps(), phCan(). Test hook: window.__paw.ph. */
const PH_CAPS = ['Best day ever', 'Nap champions', 'Snack o\'clock', 'Zoomies loading', 'Drawn on purpose', 'Good dogs, mostly', 'This is my pack', 'Wish you were here'];
const PH_SEASON_CAP = { spring: 'Spring in my paws', summer: 'Sunny paws, happy dogs', autumn: 'Leaf pile pending', winter: 'Cold noses, warm hearts' };
const PH_LONG = 1080;
const PH_SQ_MARGIN = 80; // scene units around the dogs in the square picture
const PH = { on: false, cap: null, names: null, vb: null, tok: 0, svg: '', size: null, blob: null, blobTok: -1, blobP: null, url: '', saving: false, said: false, force: '', obs: [], keyFn: null, lastFocus: null, timer: 0, hold: null };

const phCaps = () => PH_CAPS.map((t, i) => ({ id: 'c' + i, t: tdata('ph_caps.' + i, t) })).concat([{ id: 'season', t: (() => { const k = PH_SEASON_CAP[seasonNow()] ? seasonNow() : 'summer'; return tdata('ph_season_cap.' + k, PH_SEASON_CAP[k]); })() }]);
function phCapNow() { const l = phCaps(); return l.find((c) => c.id === prefs.phCap) || l[0]; }
const phFrames = () => ((window.PawArt && PawArt.POSTCARD_COLORS) || []).concat(typeof tkFrameList === 'function' ? tkFrameList() : []); // v2.11: the Tokyo stamp frame once all seven stamps are in (39_tokyo.js)
function phColorNow() { const l = phFrames(); return l.find((c) => c.k === prefs.phFrame) || l[0] || { k: 'rose', n: 'Rose', c: '#F7B2C4' }; }
// the frame colour names come from world B (PawArt.POSTCARD_COLORS) and the Tokyo frame: shown through static keys, the table keys stay as they are
function phFrameName(c) {
  switch (c.k) {
    case 'rose': return tt('photo.frame_rose', 'Rose');
    case 'sun': return tt('photo.frame_sun', 'Sunny');
    case 'mint': return tt('photo.frame_mint', 'Mint');
    case 'sky': return tt('photo.frame_sky', 'Sky');
    case 'lilac': return tt('photo.frame_lilac', 'Lilac');
    case 'tokyo': return tt('photo.frame_tokyo', 'Tokyo stamps');
    default: return c.n;
  }
}
function phPlaceName() { const p = S && S.place; return p === 'yard' ? tt('photo.place_home', 'Home') : p === 'house' ? tt('photo.place_house', 'The house') : (PLACES[p] && (mpPlaceName(p) || tdata('places.' + p + '.n', PLACES[p].n))) || tt('photo.place_town', 'Doodle Town'); }
// the Japan date, written like the festival dates ("19 October 2026"); the message gives the word order of each language, the month name comes from Intl
function phDateLine() { const [y, m, d] = jstISO().split('-').map(Number); return tt('photo.date_line', '{d} {month} {y}', { d, month: tdate(new Date(2000, m - 1, 1), { month: 'long' }), y }); }
function phNames(list) { return tlist(list); }
// I18N CORE: the postcard's font hook. Return the extra CSS (@font-face / font-family overrides) that the current language needs inside the postcard SVG; '' keeps the Latin postcard fonts
function phLangFontCSS() { const c = tfontCSS(); return c ? c + "text,tspan{font-family:'DD Local','Caveat',cursive}" : ''; } // CSS beats the font-family attributes of the postcard art; 'DD Local' only covers its own glyphs, Caveat takes the rest
const phActive = () => PH.on;

/* the camera is for the yard, the house and every town place: not on the title, walks, mini-games, the map, in a modal or while placing decorations */
function phCan() {
  return !!S && !PH.on && !busy && !TRN && (cur.mode === 'yard' || cur.mode === 'market') && modal.hidden && !hud.hidden && !(typeof HO === 'object' && HO && HO.pl) && !!$('#view > svg.world');
}

/* ---------- the camera button (desktop), inserted next to the mute button ---------- */
const phBtn = document.createElement('button');
phBtn.id = 'phBtn'; phBtn.className = 'iconbtn'; phBtn.type = 'button'; phBtn.hidden = true; phBtn.innerHTML = ICON('camera');
phBtn.onclick = () => { firstGesture(); SFX.click(); phOpen(); };
$('#muteBtn').insertAdjacentElement('afterend', phBtn);
function phSync() { // the label is set here, not at load: the language is known only once the game has booted
  const l = tt('photo.take', 'Take a photo'); if (phBtn.title !== l) { phBtn.setAttribute('aria-label', l); phBtn.title = l; }
  phBtn.hidden = !phCan();
}
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
function phDogBox(svg) { // the dogs' x ranges in scene units, so the phone and square crops keep every dog in. who: [name, left, right] for each named dog (the leader first)
  const m = svg.getScreenCTM(); if (!m) return { box: null, who: [] }; const inv = m.inverse(); let L = 1e9, R = -1e9; const who = [];
  svg.querySelectorAll('#dogPos, #pack .packdog, #visitorG').forEach((el) => {
    const nm = el.id === 'dogPos' ? S.dog.name : el.dataset.dog ? (dogById(el.dataset.dog) || {}).name : null, r = el.getBoundingClientRect();
    if (!r.width) { if (nm) who.push([nm, null, null]); return; } // no box (hidden for a moment): the dog is still named
    const a = new DOMPoint(r.left, r.top).matrixTransform(inv).x, b = new DOMPoint(r.right, r.bottom).matrixTransform(inv).x;
    L = Math.min(L, a); R = Math.max(R, b); if (nm) who.push([nm, a, b]);
  });
  const li = who.findIndex((w) => w[0] === S.dog.name); if (li < 0) who.unshift([S.dog.name, null, null]); else if (li > 0) who.unshift(who.splice(li, 1)[0]); // the leader first
  return { box: R > L ? [L, R] : null, who };
}
// the colour at the top of the scene (the sky, or the wall indoors): the square picture fills the extra height above the scene with it
function phSkyCol(svg) {
  const top = [...svg.querySelectorAll('rect')].find((r) => !+(r.getAttribute('x') || 0) && !+(r.getAttribute('y') || 0) && +r.getAttribute('width') >= 900 && +r.getAttribute('height') > 60 && +r.getAttribute('height') < 560 && (r.getAttribute('fill') || 'none') !== 'none' && !/transparent/.test(r.getAttribute('fill')));
  if (!top) return '#D3E9F6';
  let col = top.getAttribute('fill'); const g = /url\(#([^)]+)\)/.exec(col);
  if (g) { const st = svg.querySelector('#' + CSS.escape(g[1]) + ' stop'); col = st ? st.getAttribute('stop-color') || getComputedStyle(st).stopColor : '#D3E9F6'; }
  const op = +(top.getAttribute('fill-opacity') || 1), hex = /^#([0-9a-f]{6})$/i.exec(col || '');
  if (!hex) return col || '#D3E9F6';
  if (op >= 1) return col;
  const n = parseInt(hex[1], 16), paper = [255, 251, 243]; // drawn over the paper: mix it the same way
  return '#' + [n >> 16, (n >> 8) & 255, n & 255].map((c, i) => Math.round(c * op + paper[i] * (1 - op)).toString(16).padStart(2, '0')).join('');
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
  const lv = (svg.getAttribute('viewBox') || '0 0 1000 600').split(/\s+/).map(Number), vb = [cur.mode === 'yard' && grWide() ? grPhotoX() : 0, lv[1], 1000, lv[3]]; // the whole scene width: the phone camera crop is not the photo (v2.15: a wide place, the 1000 round the camera)
  const tint = $('.tintfx', view), wx = $('.wxfx', view);
  const db = phDogBox(svg);
  cl.removeAttribute('class'); cl.removeAttribute('style'); cl.removeAttribute('id');
  return { inner: new XMLSerializer().serializeToString(cl).replace(/^<svg[^>]*>/, '').replace(/<\/svg>\s*$/, ''), vb, dogs: db.box, who: db.who, names: db.who.map((w) => w[0]), sky: phSkyCol(svg), tint: tint ? tint.className : '', wx: wx ? (wx.classList.contains('snow') ? 'snow' : 'rain') : '', place: phPlaceName(), date: phDateLine(), year: jstISO().slice(0, 4) };
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
  if (sq) { // the square keeps the full scene height. When the dogs spread wider than that strip, the crop widens to hold them all and the extra height goes above the scene (the sky colour)
    size = { w: PH_LONG, h: PH_LONG }; const win = PA.postcardWindow(size.w, size.h), a = win.w / win.h;
    const need = c.dogs ? Math.min(c.dogs[1] - c.dogs[0] + PH_SQ_MARGIN, base[2]) : 0, w = Math.max(bh * a, need), h = w / a;
    vb = [0, by + bh - h, w, h];
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
// the dogs in the picture: a dog counts when most of it is inside the crop (a dog without a box is always in)
function phNamesIn(c, vb) {
  const x0 = vb[0], x1 = vb[0] + vb[2];
  return (c.who || []).filter(([, a, b]) => a == null || Math.min(b, x1) - Math.max(a, x0) >= (b - a) * 0.5).map((w) => w[0]);
}
function phCompose(c, o) {
  const PA = window.PawArt, L = phLayout(c, o.sq), win = PA.postcardWindow(L.size.w, L.size.h), vb = L.vb.map((n) => +n.toFixed(2)), names = phNamesIn(c, vb);
  const scene = `<svg x="${win.x.toFixed(2)}" y="${win.y.toFixed(2)}" width="${win.w.toFixed(2)}" height="${win.h.toFixed(2)}" viewBox="${vb.join(' ')}" preserveAspectRatio="xMidYMid slice" overflow="hidden"><rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#FFFBF3"/>${vb[1] < c.vb[1] ? `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${f1(c.vb[1] - vb[1] + 2)}" fill="${c.sky}"/>` : ''}${c.inner}${phWash(c, vb)}</svg>`;
  let svg = (o.color === 'tokyo' && typeof tkPostcard === 'function' ? tkPostcard : PA.postcard)(L.size.w, L.size.h, { color: o.color, stamp: c.year, scene, caption: o.caption, place: c.place, date: c.date, dogs: phNames(names) });
  svg = svg.replace(/^(<svg[^>]*>)/, `$1<style>${PH_FONT_CSS}${phLangFontCSS()}*{animation:none!important;transition:none!important}</style>`);
  return { svg, size: L.size, names, vb };
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

// v2.14 PERF (PERF.md): the split builds (tools/split.js) ship the postcard fonts as their own file, PH_FONT_FILE, loaded on the first photo;
// phFontsSet fills PH_FONT_CSS. The single-file builds and the test harness have them inline (no PH_FONT_FILE): null, nothing to wait for.
// Offline, the postcard is drawn with the fallback fonts after at most 6 s, and the next photo tries again.
let phFontsP = null;
function phFonts() {
  if (typeof PH_FONT_FILE !== 'string' || PH_FONT_CSS) return null;
  if (!phFontsP) {
    const load = new Promise((res) => {
      const s = document.createElement('script'); s.src = PH_FONT_FILE; s.async = true;
      s.onload = () => { if (typeof window.PAW_PH_FONTS === 'string') phFontsSet(window.PAW_PH_FONTS); res(); };
      s.onerror = () => { if (s.parentNode) s.parentNode.removeChild(s); res(); };
      document.head.appendChild(s);
    });
    phFontsP = Promise.race([load, new Promise((r) => setTimeout(r, 6000))]).then(() => { phFontsP = null; });
  }
  return phFontsP;
}

/* ---------- the photo screen ---------- */
function phOpts() { return { sq: !!prefs.phSq, color: phColorNow().k, caption: phCapNow().t }; }
function phDraw(delay) {
  clearTimeout(PH.timer);
  const run = async () => {
    if (!PH.on || !PH.cap) return; const tok = ++PH.tok; PH.blob = null; PH.blobTok = -1;
    const fw = phFonts(); if (fw) { await fw; if (tok !== PH.tok || !PH.on) return; } // split builds: the postcard fonts come with the first photo
    const o = phOpts(), r = phCompose(PH.cap, o); PH.svg = r.svg; PH.size = r.size; PH.names = r.names; PH.vb = r.vb;
    const url = phDataURL(r.svg), pic = $('.ph-pic'), root = $('#phMode'); if (root) root.classList.add('ph-busy');
    let im; try { im = await phLoad(url); } catch (e) { if (root) root.classList.remove('ph-busy'); toast(tt('photo.jammed', 'The camera jammed. Try again.')); return; }
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
  const cols = phFrames(), caps = phCaps(), col = phColorNow(), cap = phCapNow();
  return `<div class="ph-view">${exPickerHTML()}<img class="ph-pic" alt="${esc(tt('photo.pic_alt', 'Your photo, framed as a postcard'))}" draggable="false"></div>
  <div class="ph-side">
    <h2 class="ph-h">${esc(tt('photo.say_cheese', 'Say cheese'))}</h2>
    <div class="ph-sec"><span class="ph-lbl">${esc(tt('photo.frame', 'Frame'))}</span><div class="ph-row ph-frames" role="group" aria-label="${esc(tt('photo.frame_colour', 'Frame colour'))}">${cols.map((c) => `<button type="button" class="ph-swatch" data-frame="${c.k}" aria-label="${esc(tt('photo.frame_named', '{name} frame', { name: phFrameName(c) }))}" title="${esc(phFrameName(c))}" aria-pressed="${c.k === col.k}" style="--sw:${c.c}"></button>`).join('')}</div></div>
    <div class="ph-sec"><span class="ph-lbl">${esc(tt('photo.caption', 'Caption'))}</span><div class="ph-row ph-caps" role="group" aria-label="${esc(tt('photo.caption', 'Caption'))}">${caps.map((c) => `<button type="button" class="btn ph-cap" data-cap="${c.id}" aria-pressed="${c.id === cap.id}">${esc(c.t)}</button>`).join('')}</div></div>
    <div class="ph-sec"><span class="ph-lbl">${esc(tt('photo.shape', 'Shape'))}</span><div class="ph-row ph-shapes" role="group" aria-label="${esc(tt('photo.picture_shape', 'Picture shape'))}"><button type="button" class="btn ph-shape" data-sq="0" aria-pressed="${!prefs.phSq}">${esc(tt('photo.postcard', 'Postcard'))}</button><button type="button" class="btn ph-shape" data-sq="1" aria-pressed="${!!prefs.phSq}" aria-label="${esc(tt('photo.square_picture', 'Square picture'))}">${esc(tt('photo.square', 'Square'))}</button></div></div>
    <div class="ph-acts"><button type="button" class="btn yes" id="phSave">${esc(tt('photo.save', 'Save photo'))}</button><button type="button" class="btn" id="phAgain">${esc(tt('photo.retake', 'Retake'))}</button><button type="button" class="btn" id="phClose">${esc(tt('photo.close', 'Close'))}</button></div>
  </div>`;
}
function phOpen() {
  if (!phCan()) return false;
  exPhoto(true); const cap = phCapture(); if (!cap) { exPhoto(false); return false; } // v2.13: the face picked for the photo goes on every dog first (41_expressions.js)
  PH.on = true; PH.cap = cap; PH.lastFocus = document.activeElement; hideBubble(); toasts.innerHTML = ''; // a clear screen: the hints that were up fold away
  let root = $('#phMode'); if (!root) { root = document.createElement('div'); root.id = 'phMode'; root.className = 'ph-mode'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', tt('photo.mode', 'Photo mode')); stage.appendChild(root); }
  root.hidden = false; root.classList.remove('ph-busy'); root.innerHTML = phPanel(); stage.classList.add('ph-on'); phBtn.hidden = true;
  root.querySelectorAll('[data-frame]').forEach((b) => { b.onclick = () => { SFX.click(); prefs.phFrame = b.dataset.frame; savePrefs(); root.querySelectorAll('[data-frame]').forEach((x) => x.setAttribute('aria-pressed', x === b)); phDraw(30); }; });
  root.querySelectorAll('[data-cap]').forEach((b) => { b.onclick = () => { SFX.click(); prefs.phCap = b.dataset.cap; savePrefs(); root.querySelectorAll('[data-cap]').forEach((x) => x.setAttribute('aria-pressed', x === b)); phDraw(30); }; });
  root.querySelectorAll('[data-sq]').forEach((b) => { b.onclick = () => { SFX.click(); prefs.phSq = b.dataset.sq === '1' && !prefs.phSq; savePrefs(); root.querySelectorAll('[data-sq]').forEach((x) => x.setAttribute('aria-pressed', (x.dataset.sq === '1') === !!prefs.phSq)); phDraw(30); }; }); // on a phone the Square button is a switch: tapping it again goes back to the postcard
  exPickerBind(root); // v2.13: the face picker
  $('#phSave', root).onclick = () => phSave();
  $('#phAgain', root).onclick = () => { SFX.click(); const c = phCapture(); if (c) { PH.cap = c; phDraw(); } };
  $('#phClose', root).onclick = () => { SFX.click(); phClose(); };
  PH.keyFn = (e) => { if (e.key !== 'Escape' || !PH.on) return; e.preventDefault(); e.stopPropagation(); if (PH.hold) phHoldClose(); else phClose(); };
  window.addEventListener('keydown', PH.keyFn, true);
  PH.obs = [new MutationObserver(() => { if (!modal.hidden) phClose(); })]; PH.obs[0].observe(modal, { attributes: true, attributeFilter: ['hidden'] }); // a pop-up (a level-up, a letter) ends the photo
  onCleanup(() => phClose(true)); // leaving the place (any go()) ends it too
  phDraw();
  if (S.ph && !S.ph.first && !PH.said) { PH.said = true; setTimeout(() => { if (PH.on) toast(tt('photo.gerald', 'Gerald the duck: "Say cheese. Or kibble."'), 'gold'); }, 250); }
  setTimeout(() => { const b = $('#phSave'); if (b && PH.on && !PH.hold) b.focus({ preventScroll: true }); }, 0);
  return true;
}
function phClose(quiet) {
  if (!PH.on) return; PH.on = false; clearTimeout(PH.timer); PH.tok++; phHoldClose();
  window.removeEventListener('keydown', PH.keyFn, true); PH.obs.forEach((o) => o.disconnect()); PH.obs = [];
  const root = $('#phMode'); if (root) { root.hidden = true; root.innerHTML = ''; }
  stage.classList.remove('ph-on'); PH.cap = null; PH.blob = null; PH.svg = '';
  exPhoto(false); // v2.13: the dogs take their own faces back
  phSync();
  if (!quiet) { const f = PH.lastFocus; if (f && document.contains(f) && !f.hidden && f.focus) try { f.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
}

/* ---------- Save: share, download, or hold to save ---------- */
function phFileName() { return `doodle-doggo-${jstISO()}-${(S.ph && S.ph.n || 0) + 1}.png`; }
const phDownloadOK = () => !PH.force && !(typeof clArtifact === 'function' && clArtifact()); // the claude.ai artifact sandbox blocks downloads
function phCounted(how) {
  const n = (PH.names && PH.names.length) || (PH.cap ? PH.cap.names.length : 1);
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
    if (!blob) { toast(tt('photo.jammed', 'The camera jammed. Try again.')); return; }
    const how = await phDeliver(blob);
    if (how) { phCounted(how); SFX.boop(760); if (how === 'download') toast(tt('photo.saved', 'Photo saved. Look in your downloads.'), 'good'); else if (how === 'share') toast(tt('photo.shared', 'Photo shared.'), 'good'); }
  } finally { PH.saving = false; if (root) root.classList.remove('ph-saving'); }
}
function phHoldOpen(blob) { // no share and no download here: the picture fills the screen so it can be pressed and held
  return new Promise((res) => {
    const fr = new FileReader();
    fr.onload = () => {
      const root = $('#phMode'); if (!root) return res();
      const h = document.createElement('div'); h.className = 'ph-hold'; h.setAttribute('role', 'dialog'); h.setAttribute('aria-label', tt('photo.save_dialog', 'Save your photo'));
      h.innerHTML = `<p class="ph-holdtxt">${esc(tt('photo.hold_save', 'Press and hold to save'))}</p><img class="ph-holdpic" alt="${esc(tt('photo.hold_alt', 'Your photo. Press and hold it to save.'))}" src="${fr.result}"><button type="button" class="btn yes" id="phHoldDone">${esc(tt('photo.done', 'Done'))}</button>`;
      root.appendChild(h); PH.hold = h; $('#phHoldDone', h).onclick = () => { SFX.click(); phHoldClose(); }; setTimeout(() => { const b = $('#phHoldDone', h); if (b) b.focus({ preventScroll: true }); }, 0); res();
    };
    fr.onerror = () => res(); fr.readAsDataURL(blob);
  });
}
function phHoldClose() { if (PH.hold) { PH.hold.remove(); PH.hold = null; const b = $('#phSave'); if (b && PH.on) b.focus({ preventScroll: true }); } }

/* ---------- journal line, test hook ---------- */
function phJournalLine() { const n = (S && S.ph && S.ph.n) || 0; return `<p class="small ph-jline">${n ? tt('photo.taken_html', 'Photos taken: <b>{n}</b>', { n: tnum(n) }) : tt('photo.taken_none_html', 'Photos taken: <b>{n}</b>. The camera button is by the sound button, or in the menu on a phone.', { n: tnum(0) })}</p>`; }
function phExpose() {
  if (!window.__paw || window.__paw.ph) return;
  window.__paw.ph = { open: () => phOpen(), close: () => phClose(), active: () => PH.on, can: () => phCan(), caps: () => phCaps(), svg: () => PH.svg, size: () => PH.size, ready: () => PH.blobTok === PH.tok && !!PH.blob, blobSize: () => PH.blob && PH.blob.size, force: (v) => { PH.force = v || ''; }, say: () => PH.said, place: () => phPlaceName(), date: () => phDateLine(), names: () => PH.cap && PH.cap.names, inShot: () => PH.names, crop: () => PH.vb, boxes: () => PH.cap && PH.cap.who };
}
on('game:ready', () => setTimeout(phExpose, 0)); on('yard:enter', () => { phExpose(); phSync(); });
