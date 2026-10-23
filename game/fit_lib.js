// FIT AUDIT library (v2.14, the owner: "all languages fit in all the menus, windows and boxes"). Shared by game/test_i18n_fit.js (suite i18n_fit)
// and game/test_site_fit.js (suite site_fit). docs/i18n/coord/FIT.md describes the suites, the env vars and every rule below.
//
//   MEASURE(cfg)  runs IN THE PAGE (page.evaluate(MEASURE, cfg)) and returns { findings, n } for what is on screen right now.
//   HILITE(o)     runs in the page: a red box (and a label) over a finding, for its screenshot; HILITE(null) removes it.
//   report(...)   node: merges the parts into <name>.json and <name>.md (counts, the worst 50 deduped by selector + kind).
//
// Kinds (one finding = { kind, how, sel, text, num, sev, rect }):
//   clip     (a) text cut by an overflow hidden/clip box (its own box or an ancestor), a text-overflow ellipsis that truncates, or a small text box that scrolls
//   escape   (b) text that leaves the nearest bordered / backgrounded box (how: 'box'), or the viewport (how: 'viewport')
//   overlap  (c) two text-bearing elements (buttons, labels, chips, tabs, text) that cross by more than 2 px both ways
//   hscroll  (d) the page (or the game's #stage) scrolls sideways
//   tap      (e) phone layouts only: a button / link / [role=button] / [role=tab] under 44 px in either dimension
//   font     (e) phone layouts only: text under 15 px (13 px for captions, cfg.captions)
//   crowd    (f) v2.14.1: text too close to its window's drawn pencil line (R12; cfg.frames false turns it off, as the site suite does)
// sev: the size of the problem in CSS px (font: 3 x the missing px, so 2 px too small ranks like 6 px of clipping).
//
// FALSE-POSITIVE RULES (each one is a rule, never a hard-coded finding; calibrated on English, V214 fit audit 22 Oct 2026):
//   R1  only what the player can see: display none, visibility hidden, opacity 0 (own or an ancestor's), zero-size boxes, the cfg.skip subtrees
//       (the dev button and panel: stripped on itch.io, never translated), the inside of a closed <details> (checkVisibility), visually hidden
//       text (the screen-reader-only pattern: a 1-2 px box that hides its overflow, clip: rect(0 0 0 0), clip-path: inset(50%)) and everything
//       inside <svg>/<canvas> (art) are left out. SVG text is measured only where cfg.svgText names it (the map pin names), only for overlaps.
//   R2  scrolled or panned away: a text node whose every line box lies outside an ancestor that clips or scrolls (a carousel slide, a tab row
//       scrolled sideways, a sheet body scrolled down, a hidden off-screen panel, a marquee) is not visible, so it is skipped; a text node
//       partly inside an overflow auto/scroll box is fine (that box is meant to scroll). Only overflow hidden/clip cuts count as clips.
//   R2c a control's box is cut to its clipping or scrolling ancestors before the overlap test (a button half scrolled out of a sheet body).
//   R2d a clipping box whose edge coincides with an inner scrolling box's edge on that axis does not clip (text at a scroller's fold).
//   R2e a line leaving its box is judged on the part its clipping or scrolling ancestors show (a line half scrolled out of a sheet body).
//   R2b panned cards: when the text's own card is itself cut SIDEWAYS by a clipping ancestor (the peeking next card of the walk route
//       carousel, a pup row), the card is panned, not clipped; a card cut downwards is a real clip (a box too short for its content).
//   R3  covered: with pointer-events forced on for the measurement, document.elementsFromPoint() tells what is on top, line by line. A line
//       under an opaque surface that is not its own ancestor (the modal veil and sheet over the yard, the dock tray over the scene) is not
//       seen; an element with no seen line is skipped. Art (svg, canvas, aria-hidden, .art), transparent wrappers and surfaces under 30 %
//       opacity never count as cover. The crayon surfaces paint their paper in an inset ::after / ::before: that counts as their background.
//   R4  containing blocks: an absolutely positioned element is only clipped by (and only "leaves") ancestors that are its containing block
//       chain, so a badge placed outside its card on purpose, or a fixed toast inside a clipped stage, is not a finding.
//   R5  intentional layers: an overlap is ignored when one side sits on a positioned, opaque surface (or a known overlay: cfg.layers) that is
//       not an ancestor of the other side (a sheet, a popover, a toast over the page), or is itself one of cfg.layers (a toast, a speech
//       bubble, a tip). Overlaps inside one surface are real (a sheet footer with no background over the scrolled body is reported).
//   R6  glyphs, not boxes: vertically, Thai text is judged on its whole content box (its marks stack above and below) and every other script
//       on its em box, because a Latin or CJK content box is taller than the line-height 1 chips that hold it and nothing visible is cut there.
//       Overlaps use each seen line cut to 0.8 em (two lines of a paragraph never "overlap"), line by line (an inline run's union box would
//       cover the words beside its first line). Tolerances: 1 px sideways and 2 px downwards for clips, 2 px both ways for overlaps, 3 px for
//       text leaving a box (the crayon boxes are drawn a little rotated, which grows their bounding boxes).
//   R7  inline links in running text (an <a> or .tlink inside a sentence) are exempt from the 44 px rule (WCAG 2.5.8), so are disabled controls,
//       visually hidden inputs (under 2 px: the label is the target) and checkboxes inside their label.
//   R8  font size: the floor is checked on the text's own element (CSS px, before any transform: scale(), so the site's scaled game box does not
//       count); whitespace-only nodes skipped; the caption list (cfg.captions) at 13 px.
//   R9  sideways scroll names the outermost elements whose right edge passes the viewport (position fixed ones and what an inner box clips
//       or scrolls excluded).
//   R10 one finding per element and kind per state (the worst); the suites keep one per session (the worst, with the number of states it
//       was seen in), so the HUD and the action bar count once, not on every screen. A box whose cut was found on one of its lines is not
//       reported again by the box-level scrollWidth check.
//   R12 crowd: see (f) in MEASURE (windows with a stretched pencil frame only; nested cards, controls and scroll folds are not judged).
//   R11 small absolutely placed badges (32 x 32 px or less: a sex symbol, a count on a chip's corner) may sit over their box's border.
'use strict';

function MEASURE(cfg) {
  cfg = cfg || {};
  const W = innerWidth, H = innerHeight, phone = !!cfg.phone, docScrolls = !!cfg.docScrolls;
  const SKIP = cfg.skip || '#devPanel, #devBtn';
  const CAPTIONS = (cfg.captions || 'small, .small').split(',').map((x) => x.trim()).filter((x) => { try { document.querySelector(x); return !!x; } catch (e) { return false; } }).join(', ') || 'small';
  const LAYERS = cfg.layers || '';
  const CONTROLS = 'button, a[href], [role=button], [role=tab], [role=menuitem], [role=option], summary, select, label, .btn, .chip, .tab';
  const TAPS = 'button, a[href], [role=button], [role=tab], [role=menuitem], [role=option], summary, select, input:not([type=hidden])';
  const out = [], n = { els: 0, text: 0, atoms: 0 };
  const csC = new Map(); const cs = (e) => { let c = csC.get(e); if (!c) { c = getComputedStyle(e); csC.set(e, c); } return c; };
  const alpha = (col) => { if (!col || col === 'transparent') return 0; const m = col.match(/rgba?\(([^)]+)\)/); if (!m) return 1; const p = m[1].split(/[ ,/]+/).filter(Boolean); return p.length > 3 ? parseFloat(p[3]) : 1; };
  const solid = (c) => alpha(c.backgroundColor) >= 0.5 || (c.backgroundImage && c.backgroundImage !== 'none' && !/gradient\(\s*(to [a-z ]+,\s*)?transparent/.test(c.backgroundImage));
  // the crayon surfaces (.panel, .buybox, the dock tray, #trainPanel) paint their paper in an inset:0 ::after / ::before, so a pseudo-element that
  // covers the box counts as the element's own background
  const pseC = new Map();
  const pseudoSurface = (e) => {
    if (pseC.has(e)) return pseC.get(e); let r = null;
    for (const ps of ['::after', '::before']) { const c = getComputedStyle(e, ps); if (!c || c.content === 'none' || c.content === 'normal' || c.display === 'none') continue; const w = parseFloat(c.width), h = parseFloat(c.height); if (!(w >= 0.8 * e.offsetWidth && h >= 0.8 * e.offsetHeight)) continue; r = c; break; }
    pseC.set(e, r); return r;
  };
  const opaqueBg = (e) => { if (solid(cs(e))) return true; const p = pseudoSurface(e); return !!p && solid(p); };
  const hasBox = (e) => {
    const c = cs(e); if (/^inline/.test(c.display) && c.display !== 'inline-block' && c.display !== 'inline-flex' && c.display !== 'inline-grid') return false;
    if (alpha(c.backgroundColor) > 0.05 || (c.backgroundImage && c.backgroundImage !== 'none')) return true;
    const ps = pseudoSurface(e); if (ps && (alpha(ps.backgroundColor) > 0.05 || (ps.backgroundImage && ps.backgroundImage !== 'none'))) return true;
    for (const s of ['Top', 'Right', 'Bottom', 'Left']) if (parseFloat(c['border' + s + 'Width']) > 0 && !/none|hidden/.test(c['border' + s + 'Style']) && alpha(c['border' + s + 'Color']) > 0.05) return true;
    return false;
  };
  const R = (r) => [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
  // a short, language-independent selector path: tag#id, tag.class.class, a whitelisted data-* attribute, :nth-of-type when siblings look alike
  const DATA = ['data-act', 'data-jt', 'data-tab', 'data-sh', 'data-area', 'data-buy', 'data-food', 'data-play', 'data-care', 'data-tr', 'data-hot', 'data-lang', 'data-page', 'data-ac', 'data-pb', 'data-pb2', 'data-t', 'data-ptab', 'data-mt', 'data-k', 'data-id', 'data-step'];
  const selC = new Map();
  const sig = (e) => {
    let s = e.tagName.toLowerCase();
    if (e.id) return s + '#' + e.id;
    const cl = typeof e.className === 'string' ? e.className.trim().split(/\s+/).filter((c) => c && !/^(on|off|sel|selected|cur|current|pop|show|open|active|hexp|stuck|unread|read|seen|new|done|pg-sel|pg-show|tmerge|below)$/.test(c)).slice(0, 2) : [];
    if (cl.length) s += '.' + cl.join('.');
    for (const a of DATA) if (e.hasAttribute(a)) { const v = e.getAttribute(a); s += `[${a}${v && v.length < 40 && !/[\s"]/.test(v) ? '=' + v : ''}]`; break; }
    return s;
  };
  const sel = (e) => {
    if (selC.has(e)) return selC.get(e);
    const parts = []; let x = e;
    for (let i = 0; x && x.nodeType === 1 && i < 5 && x !== document.body; i++, x = x.parentElement) {
      let s = sig(x);
      if (!x.id && x.parentElement) { const same = [...x.parentElement.children].filter((y) => y.tagName === x.tagName && sig(y) === s); if (same.length > 1 && !/\[data-/.test(s)) s += `:nth-of-type(${[...x.parentElement.children].filter((y) => y.tagName === x.tagName).indexOf(x) + 1})`; }
      parts.unshift(s); if (x.id) break;
    }
    const v = parts.join(' > '); selC.set(e, v); return v;
  };
  const textOf = (e) => (e.innerText || e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60);
  const push = (kind, how, el, num, sev, rect, text) => out.push({ kind, how, sel: sel(el), text: text != null ? text : textOf(el), num, sev: Math.round(sev * 10) / 10, rect: rect ? R(rect) : R(el.getBoundingClientRect()) });

  // ---------- R1: walk the visible element tree (no svg internals, no skipped subtrees) ----------
  const skipEls = new Set(SKIP ? [...document.querySelectorAll(SKIP)] : []);
  const els = [], opac = new Map();
  const walk = (e, op) => {
    if (skipEls.has(e)) return;
    const tag = e.tagName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEMPLATE' || tag === 'NOSCRIPT' || tag === 'svg' || tag === 'SVG' || tag === 'CANVAS' || tag === 'IFRAME') return;
    const c = cs(e); if (c.display === 'none') return;
    const o = op * (parseFloat(c.opacity) || 0); if (o < 0.05) return;
    if (e.hidden && c.display !== 'contents') return;
    if (e.checkVisibility && c.display !== 'contents' && !e.checkVisibility({ contentVisibilityAuto: false })) return; // inside a closed <details>, content-visibility: hidden
    // R1: visually hidden (the screen-reader-only pattern: a 1 px box that hides its overflow, or clip: rect(0 0 0 0) / clip-path: inset(50%))
    if ((/hidden|clip/.test(c.overflowX) && (e.offsetWidth <= 2 || e.offsetHeight <= 2) && c.display !== 'contents') || /rect\(0(px)?,? 0(px)?,? 0(px)?,? 0(px)?\)/.test(c.clip) || /inset\(50%\)/.test(c.clipPath)) return;
    opac.set(e, o); els.push(e);
    for (const k of e.children) walk(k, o);
  };
  walk(document.body, 1); n.els = els.length; const elSet = new Set(els);

  // ---------- clip chains (R2, R4) ----------
  const box = (a) => { const r = a.getBoundingClientRect(), sx = a.offsetWidth ? r.width / a.offsetWidth : 1, sy = a.offsetHeight ? r.height / a.offsetHeight : 1; return { left: r.left + a.clientLeft * sx, top: r.top + a.clientTop * sy, right: r.left + (a.clientLeft + a.clientWidth) * sx, bottom: r.top + (a.clientTop + a.clientHeight) * sy, el: a }; };
  const chainC = new Map();
  // the ancestors (self included) that clip this element's content, innermost first, following the containing-block chain
  const clipChain = (el) => {
    if (chainC.has(el)) return chainC.get(el);
    const chain = []; let mode = 'normal';
    for (let a = el; a && a !== document.documentElement; a = a.parentElement) {
      const c = cs(a); let inCB = false;
      if (a === el || mode === 'normal') inCB = true;
      else if (mode === 'abs' && (c.position !== 'static' || c.transform !== 'none')) { inCB = true; mode = 'normal'; }
      else if (mode === 'fixed' && (c.transform !== 'none' || c.filter !== 'none')) { inCB = true; mode = 'normal'; }
      if (!inCB) continue;
      if ((c.overflowX !== 'visible' || c.overflowY !== 'visible') && a !== document.body) chain.push({ a, ox: c.overflowX, oy: c.overflowY });
      if (c.position === 'absolute') mode = 'abs'; else if (c.position === 'fixed') mode = 'fixed';
    }
    chainC.set(el, chain); return chain;
  };
  // the nearest bordered / backgrounded box in the containing-block chain (R4), not html/body
  const boxC = new Map();
  const nearestBox = (el) => {
    if (boxC.has(el)) return boxC.get(el);
    let res = null, mode = 'normal';
    for (let a = el; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const c = cs(a); let inCB = false;
      if (a === el || mode === 'normal') inCB = true;
      else if (mode === 'abs' && (c.position !== 'static' || c.transform !== 'none')) { inCB = true; mode = 'normal'; }
      else if (mode === 'fixed' && c.transform !== 'none') { inCB = true; mode = 'normal'; }
      if (!inCB) continue;
      if (hasBox(a)) { res = a; break; }
      if (c.position === 'absolute') mode = 'abs'; else if (c.position === 'fixed') { mode = 'fixed'; }
    }
    boxC.set(el, res); return res;
  };

  // ---------- text nodes and their line boxes ----------
  const range = document.createRange();
  const items = []; // { el, node, rects (all), vis (visible parts) }
  for (const el of els) {
    if (cs(el).visibility === 'hidden') continue;
    for (const nd of el.childNodes) {
      if (nd.nodeType !== 3 || !nd.nodeValue.trim()) continue;
      range.selectNodeContents(nd);
      const rects = [...range.getClientRects()].filter((r) => r.width > 0.5 && r.height > 0.5);
      if (!rects.length) continue;
      items.push({ el, node: nd, rects });
    }
  }
  n.text = items.length;
  // R6 vertical: Thai marks stack above and below, so Thai text is judged on its whole content box; other scripts on their em box (the glyphs),
  // because a Latin or CJK font's content box is taller than the line-height 1 chips that hold it, and nothing visible is cut there
  const THAI = /[\u0E00-\u0E7F]/;
  const vbox = (it, r) => { if (it.thai) return [r.top, r.bottom]; const em = parseFloat(cs(it.el).fontSize), cy = (r.top + r.bottom) / 2, hh = Math.min(r.bottom - r.top, em) / 2; return [cy - hh, cy + hh]; };
  const clipF = new Map(); // el -> worst clip finding data
  for (const it of items) {
    it.thai = THAI.test(it.node.nodeValue);
    const chain = clipChain(it.el); let vis = it.rects.map((r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom, o: r })); let cut = null;
    const nb = nearestBox(it.el), nbr = nb ? nb.getBoundingClientRect() : null;
    const scr = []; // inner ancestors that scroll (R2d)
    for (const cc of chain) {
      const b = box(cc.a); const hx = /hidden|clip/.test(cc.ox), hy = /hidden|clip/.test(cc.oy);
      // R2d: a clipping box whose edge is also the edge of an inner box that scrolls on that axis cuts nothing the scroller would not:
      // the text straddles the scroller's fold (a phone page that scrolls inside a clipped stage), it is not clipped
      const near = (u, v) => Math.abs(u - v) <= 2, fold = { t: scr.some((s) => s.y && near(s.b.top, b.top)), b: scr.some((s) => s.y && near(s.b.bottom, b.bottom)), l: scr.some((s) => s.x && near(s.b.left, b.left)), r: scr.some((s) => s.x && near(s.b.right, b.right)) };
      { const sx = /auto|scroll/.test(cc.ox), sy = /auto|scroll/.test(cc.oy); if (sx || sy) scr.push({ b, x: sx, y: sy }); }
      // R2b: a card cut sideways by a clipping ancestor whose content is wider than it (a carousel, a panned track: the route cards, the pup row)
      // is panned, not clipped; a vertical cut is real (a box too short for its text)
      const panned = hx && !!nbr && nb !== cc.a && cc.a.contains(nb) && (nbr.left < b.left - 1 || nbr.right > b.right + 1);
      const nv = [];
      for (const r of vis) {
        const [vt, vb] = vbox(it, r.o);
        const ix = Math.min(r.right, b.right) - Math.max(r.left, b.left), iy = Math.min(r.bottom, b.bottom) - Math.max(r.top, b.top);
        const dx = Math.max(0, fold.l ? 0 : b.left - r.left, fold.r ? 0 : r.right - b.right), dy = Math.max(0, fold.t ? 0 : b.top - vt, fold.b ? 0 : vb - b.bottom);
        if (ix > 0.5 && iy > 0.5) {
          if ((hx && dx > 1 && !panned) || (hy && dy > 2)) { const amt = Math.max(hx && !panned ? dx : 0, hy ? dy : 0); if (!cut || amt > cut.amt) cut = { amt, by: cc.a, dx: Math.round(dx), dy: Math.round(dy) }; }
          nv.push({ left: Math.max(r.left, b.left), top: Math.max(r.top, b.top), right: Math.min(r.right, b.right), bottom: Math.min(r.bottom, b.bottom), o: r.o });
        } else if (((hx && dx > 0 && !panned) || (hy && dy > 0))) {
          // a whole line outside a clipping box: cut, unless every line of the node is outside (R2: scrolled / panned away)
          const amt = Math.max(hx && !panned ? dx + (r.right - r.left) : 0, hy ? dy + (r.bottom - r.top) : 0); if (amt > 0 && (!cut || amt > cut.amt)) cut = { amt: Math.min(amt, 400), by: cc.a, dx: Math.round(dx), dy: Math.round(dy), line: true };
        }
      }
      vis = nv; if (!vis.length) break;
    }
    if (!vis.length) { it.hidden = true; continue; }
    it.vis = vis; it.cut = cut;
    // viewport (the game never scrolls; the site scrolls down, so only sideways counts there)
    const allOut = vis.every((r) => r.right <= 0 || r.left >= W || (!docScrolls && (r.bottom <= 0 || r.top >= H)));
    if (allOut) { it.hidden = true; continue; }
  }

  // ---------- atoms: controls (their box) and other text (its line boxes), R3 occlusion ----------
  const atomOf = new Map(), atoms = [];
  for (const it of items) {
    if (it.hidden) continue;
    const ctl = it.el.closest(CONTROLS);
    const key = ctl && elSet.has(ctl) ? ctl : it.el;
    let a = atomOf.get(key);
    if (!a) { a = { el: key, ctl: key === ctl, items: [], rect: null }; atomOf.set(key, a); atoms.push(a); }
    a.items.push(it);
  }
  const st = document.createElement('style'); st.textContent = '*{pointer-events:auto!important}'; document.head.appendChild(st);
  const transparentHit = (e) => !!(e.closest && (e.closest('svg') || e.tagName === 'CANVAS' || e.closest('.art, [aria-hidden=true]'))) || !opaqueBg(e) || (opac.get(e) != null && opac.get(e) < 0.3);
  const skipArr = [...skipEls];
  const seenAt = (a, x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return true; // off the viewport (the site scrolls): judged elsewhere
    for (const e of document.elementsFromPoint(x, y)) {
      if (e === a.el || a.el.contains(e) || e.contains(a.el)) return true;
      if (skipEls.has(e) || skipArr.some((s) => s.contains(e))) continue;
      if (!transparentHit(e)) return false;
    }
    return true;
  };
  try {
    for (const a of atoms) {
      // every line box is sampled at its middle (at most 8 per atom): a line under an opaque surface is not seen (R3)
      let seen = 0; const u = { left: 1e9, top: 1e9, right: -1e9, bottom: -1e9 }; a.rects = [];
      for (const it of a.items) {
        const em = 0.8 * parseFloat(cs(it.el).fontSize); it.seen = []; let last = true;
        it.vis.forEach((r, i) => {
          const ok = i >= 8 ? last : seenAt(a, (r.left + r.right) / 2, (r.top + r.bottom) / 2); last = ok;
          if (!ok) return; seen++; it.seen.push(r);
          // text atoms: their seen line boxes, each cut down to the em box of the uncut line (the content area is taller than the line-height
          // in most fonts, so the content boxes of two lines touch while the glyphs never do)
          const o = r.o || r, cy = (o.top + o.bottom) / 2, hh = Math.min(o.bottom - o.top, em) / 2, t = Math.max(r.top, cy - hh), b = Math.min(r.bottom, cy + hh);
          if (b - t < 1) return;
          const q = { left: r.left, top: t, right: r.right, bottom: b }; a.rects.push(q);
          u.left = Math.min(u.left, q.left); u.top = Math.min(u.top, q.top); u.right = Math.max(u.right, q.right); u.bottom = Math.max(u.bottom, q.bottom);
        });
      }
      if (a.ctl) { const r = a.el.getBoundingClientRect(); a.rect = { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
        // R2c: a control is only seen inside the ancestors that clip or scroll it (a button half scrolled out of a sheet body does not reach
        // the sheet's title or footer); a fixed control leaves its ancestors' clips behind
        for (let x = a.el; x && x !== document.documentElement; x = x.parentElement) {
          const c = cs(x); if (c.position === 'fixed') break; const p = x.parentElement; if (!p || p === document.body || p === document.documentElement) break;
          const pc = cs(p), q = p.getBoundingClientRect(), L = q.left + p.clientLeft, T = q.top + p.clientTop;
          if (pc.overflowX !== 'visible') { a.rect.left = Math.max(a.rect.left, L); a.rect.right = Math.min(a.rect.right, L + p.clientWidth); }
          if (pc.overflowY !== 'visible') { a.rect.top = Math.max(a.rect.top, T); a.rect.bottom = Math.min(a.rect.bottom, T + p.clientHeight); }
        }
        a.rects = a.rect.right - a.rect.left > 1 && a.rect.bottom - a.rect.top > 1 ? [a.rect] : []; if (!seen && seenAt(a, (r.left + r.right) / 2, (r.top + r.bottom) / 2)) seen = 1; }
      else a.rect = u;
      a.covered = seen === 0 || !a.rects.length;
    }
  } finally { st.remove(); }
  const live = atoms.filter((a) => !a.covered); n.atoms = live.length;

  // ---------- (a) clip, (b) escape ----------
  for (const a of live) {
    for (const it of a.items) {
      const el = it.el; if (!it.seen || !it.seen.length) continue; // R3: this text is under a surface
      if (it.cut) { const k = it.cut.by; const prev = clipF.get(el); if (!prev || it.cut.amt > prev.amt) clipF.set(el, Object.assign({ el }, it.cut, { how: cs(k).textOverflow === 'ellipsis' ? 'ellipsis' : k === el ? 'own box' : 'ancestor' })); continue; }
      // (b) leaves its nearest box (only boxes that do not clip: a clipping box is (a))
      const bx = nearestBox(el);
      // R11: a small badge placed absolutely (a sex symbol, a count on a chip's corner) may sit over its box's border on purpose
      let badge = false; for (let x = el; x && x !== bx; x = x.parentElement) { const c = cs(x); if (/absolute|fixed/.test(c.position)) { const q = x.getBoundingClientRect(); if (q.width <= 32 && q.height <= 32) badge = true; break; } }
      if (!badge && bx && /absolute|fixed/.test(cs(bx).position)) { const q = bx.getBoundingClientRect(); if (q.width <= 32 && q.height <= 32) badge = true; }
      if (bx && !badge && cs(bx).overflowX === 'visible' && cs(bx).overflowY === 'visible') {
        const b = bx.getBoundingClientRect(); let worst = 0, wr = it.rects[0];
        for (const v of it.vis) { const r = v.o; let [vt, vb] = vbox(it, r); vt = Math.max(vt, v.top); vb = Math.min(vb, v.bottom); const d = Math.max(b.left - v.left, v.right - b.right, b.top - vt, vb - b.bottom); if (d > worst) { worst = d; wr = r; } } // the part of each line its clipping / scrolling ancestors show (R2e)
        if (worst > 3) push('escape', 'box', el, { by: sel(bx), px: Math.round(worst) }, worst, wr, textOf(el));
      }
      // (b) leaves the viewport
      let vo = 0; for (const r of it.seen) vo = Math.max(vo, -r.left, r.right - W, docScrolls ? 0 : -r.top, docScrolls ? 0 : r.bottom - H);
      if (vo > 1) push('escape', 'viewport', el, { px: Math.round(vo), vw: W, vh: H }, vo, it.seen[0], textOf(el));
    }
  }
  // element-level: ellipsis / scrollWidth on text boxes that hide overflow, and small text boxes that scroll (not again for a box whose cut
  // was already found on one of its lines)
  const cutBy = new Set([...clipF.values()].map((f) => f.by));
  for (const a of live) {
    const el = a.el; const c = cs(el); if (clipF.has(el) || cutBy.has(el)) continue;
    const hx = /hidden|clip/.test(c.overflowX), hy = /hidden|clip/.test(c.overflowY), sx = /auto|scroll/.test(c.overflowX), sy = /auto|scroll/.test(c.overflowY);
    const ow = el.scrollWidth - el.clientWidth, oh = el.scrollHeight - el.clientHeight;
    // sideways: scrollWidth (an ellipsis, a nowrap label); downwards only with a line clamp (the rest of the vertical cuts are judged per line above)
    const clamp = parseInt(c.webkitLineClamp || c.getPropertyValue('-webkit-line-clamp'), 10) > 0;
    if ((hx && ow > 1) || (hy && clamp && oh > 1)) { clipF.set(el, { el, amt: Math.max(hx ? ow : 0, hy && clamp ? oh : 0), by: el, dx: ow, dy: oh, how: c.textOverflow === 'ellipsis' ? 'ellipsis' : clamp ? 'line clamp' : 'own box' }); continue; }
    // a label-sized box that scrolls its own text (an intentional scroll area holds blocks, and is taller than 3 lines): R2
    const lh = parseFloat(c.lineHeight) || parseFloat(c.fontSize) * 1.3;
    if (((sx && ow > 1) || (sy && oh > 1)) && el.clientHeight < 3 * lh && ![...el.children].some((k) => !/^inline/.test(cs(k).display))) clipF.set(el, { el, amt: Math.max(sx ? ow : 0, sy ? oh : 0), by: el, dx: ow, dy: oh, how: 'scrolls' });
  }
  for (const f of clipF.values()) push('clip', f.how, f.el, { by: sel(f.by), dx: f.dx, dy: f.dy, sw: f.el.scrollWidth, cw: f.el.clientWidth, sh: f.el.scrollHeight, ch: f.el.clientHeight }, f.amt, null, textOf(f.el));

  // ---------- (c) overlaps (R5) ----------
  const surface = (e) => { const c = cs(e); return (LAYERS && e.matches(LAYERS)) || (c.position !== 'static' && opaqueBg(e)); };
  const chainTo = (e, stop) => { const l = []; for (let x = e.parentElement; x && x !== stop; x = x.parentElement) l.push(x); return l; };
  const lca = (x, y) => { const s = new Set(); for (let e = x; e; e = e.parentElement) s.add(e); for (let e = y; e; e = e.parentElement) if (s.has(e)) return e; return document.documentElement; };
  const svgAtoms = cfg.svgText ? [...document.querySelectorAll(cfg.svgText)].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 1 && r.height > 1 && r.right > 0 && r.left < W && r.bottom > 0 && r.top < H && e.textContent.trim(); }).map((e) => { const r = e.getBoundingClientRect(); return { el: e, svg: true, rect: { left: r.left, top: r.top, right: r.right, bottom: r.bottom } }; }) : [];
  const ov = live.concat(svgAtoms), seenPair = new Set();
  for (let i = 0; i < ov.length; i++) for (let j = i + 1; j < ov.length; j++) {
    const A = ov[i], B = ov[j];
    // line by line (an inline run's union box would cover the words beside its first line)
    let ix = 0, iy = 0, a = null, b = null;
    for (const p of A.rects || [A.rect]) for (const q of B.rects || [B.rect]) { const x = Math.min(p.right, q.right) - Math.max(p.left, q.left), y = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top); if (x > 2 && y > 2 && Math.min(x, y) > Math.min(ix, iy)) { ix = x; iy = y; a = p; b = q; } }
    if (!a) continue;
    if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
    if (A.svg !== B.svg && (A.svg || B.svg)) { /* an HTML label over a map pin name: only when the HTML one is not a surface over the map */ }
    const L = lca(A.el, B.el);
    if (chainTo(A.el, L).some(surface) || chainTo(B.el, L).some(surface)) continue;
    if (LAYERS && (A.el.matches(LAYERS) || B.el.matches(LAYERS))) continue; // a toast, bubble or tip is itself a layer
    const k = sel(A.el) + '|' + sel(B.el); if (seenPair.has(k)) continue; seenPair.add(k);
    const r = { left: Math.max(a.left, b.left), top: Math.max(a.top, b.top), right: Math.min(a.right, b.right), bottom: Math.min(a.bottom, b.bottom) };
    push('overlap', A.svg || B.svg ? 'map label' : 'text', A.el, { with: sel(B.el), withText: textOf(B.el), ix: Math.round(ix), iy: Math.round(iy) }, Math.min(ix, iy), r, textOf(A.el) + ' / ' + textOf(B.el).slice(0, 30));
  }

  // ---------- (f) crowd (R12): text too close to the pencil line its window draws ----------
  // Only windows (cfg.frames) whose own background is a stretched pencil frame (an svg data URI with preserveAspectRatio none): the
  // frame's first path is read and scaled to the box, so the measured edge is the drawn line (a tall sheet stretches its line's wobble
  // and inset with it), not the box. Each seen line is judged on its em box (Thai: its whole box), against the frame points beside it.
  // Limits: cfg.crowdDense (default 10 px) for CJK, Hangul and Thai text, whose glyphs fill the whole em square; cfg.crowd (default
  // 4 px) for other scripts (Latin ink sits well inside its em box, and the English windows keep their v2.14 spacing).
  // Not judged: text inside a nested framed card or a control (that card's own business), a line cut by a box it scrolls in, and a line
  // within the limit of the edge of a box it scrolls in, on a side that box can still scroll to (a fold: scrolling moves the text away).
  if (cfg.frames !== false) {
    const FR = cfg.frames || '#dock > .tray, .panel, .buybox, .confirm, .onway-card, #trainPanel, .ps-turn-card, .rt-card, .gd-say, .gd-lesson, .sitem';
    const LIM = cfg.crowd || 4, LIMD = cfg.crowdDense || 10, DENSE = /[\u0E00-\u0E7F\u1100-\u11FF\u3040-\u30FF\u3400-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/, frC = new Map();
    const frameOf = (w) => {
      if (frC.has(w)) return frC.get(w); let f = null;
      const bg = cs(w).backgroundImage || '';
      if (/preserveAspectRatio/.test(bg) && /5B3D32/i.test(bg)) {
        let s = ''; try { s = decodeURIComponent((bg.match(/url\("data:image\/svg\+xml[^"]*"\)/) || [''])[0]); } catch (e) { s = ''; }
        const vb = s.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/), d = (s.match(/<path d="([^"]+)"/) || [])[1];
        if (vb && d) { const nums = d.match(/-?[\d.]+/g).map(Number), P = []; for (let i = 0; i + 1 < nums.length; i += 2) P.push([nums[i] / +vb[1], nums[i + 1] / +vb[2]]); f = P; }
      }
      frC.set(w, f); return f;
    };
    const crowdF = new Map();
    for (const a of live) {
      if (a.ctl) continue;
      for (const it of a.items) {
        if (!it.seen || !it.seen.length) continue;
        let w = null; for (let x = it.el; x && x !== document.body; x = x.parentElement) { if (x !== it.el && x.matches(CONTROLS)) break; if (x.matches(FR)) { w = x; break; } if (x !== it.el && frameOf(x)) break; }
        if (!w) continue; const P0 = frameOf(w); if (!P0) continue;
        const b = w.getBoundingClientRect(); if (b.width < 120 || b.height < 60) continue;
        const P = P0.map((p) => [b.left + p[0] * b.width, b.top + p[1] * b.height]), lim = DENSE.test(it.node.nodeValue) ? LIMD : LIM;
        const scrollers = []; for (let x = it.el; x && x !== w.parentElement; x = x.parentElement) { const c = cs(x); if (/auto|scroll/.test(c.overflowY) || /auto|scroll/.test(c.overflowX)) scrollers.push(box(x)); }
        const side = (p) => { const dl = p[0] - b.left, dr = b.right - p[0], dt = p[1] - b.top, db = b.bottom - p[1], m = Math.min(dl, dr, dt, db); return m === dl ? 0 : m === dr ? 1 : m === dt ? 2 : 3; };
        for (const r of it.seen) {
          const o = r.o || r; if (Math.abs(r.top - o.top) > 0.5 || Math.abs(r.bottom - o.bottom) > 0.5 || Math.abs(r.left - o.left) > 0.5 || Math.abs(r.right - o.right) > 0.5) continue;
          if (scrollers.some((q) => (q.el.scrollTop > 0 && o.top - q.top < lim) || (q.el.scrollTop + q.el.clientHeight < q.el.scrollHeight - 1 && q.bottom - o.bottom < lim) || (q.el.scrollLeft > 0 && o.left - q.left < lim) || (q.el.scrollLeft + q.el.clientWidth < q.el.scrollWidth - 1 && q.right - o.right < lim))) continue;
          let [vt, vb2] = vbox(it, o); vt = Math.max(vt, r.top); vb2 = Math.min(vb2, r.bottom); if (vb2 - vt < 1) continue;
          let g = 1e9;
          for (const p of P) {
            const s = side(p);
            if (s < 2 && p[1] >= vt - 4 && p[1] <= vb2 + 4) g = Math.min(g, s === 0 ? r.left - p[0] : p[0] - r.right);
            else if (s >= 2 && p[0] >= r.left - 4 && p[0] <= r.right + 4) g = Math.min(g, s === 2 ? vt - p[1] : p[1] - vb2);
          }
          if (g < lim) { const prev = crowdF.get(it.el); if (!prev || g < prev.g) crowdF.set(it.el, { g, r, w, lim }); }
        }
      }
    }
    for (const [el, f] of crowdF) push('crowd', f.g < 0 ? 'over the line' : 'near the line', el, { by: sel(f.w), px: Math.round(f.g), min: f.lim }, f.lim - f.g, f.r, textOf(el));
  }

  // ---------- (d) sideways scroll (R9) ----------
  const de = document.scrollingElement || document.documentElement;
  const stage = cfg.stage ? document.querySelector(cfg.stage) : null;
  const hs = Math.max(de.scrollWidth - W, stage ? stage.scrollWidth - stage.clientWidth : 0);
  if (hs > 1) {
    const RW = Math.min(W, stage ? stage.getBoundingClientRect().right : W);
    // the outermost elements past the right edge (their ancestors are not), skipping what an inner box clips or scrolls (all elements here,
    // art included: an svg ring can push the stage too)
    const past = [...(stage || document.body).querySelectorAll('*')].filter((e) => { const r = e.getBoundingClientRect(); return r.width >= 1 && r.right > RW + 1 && cs(e).display !== 'none' && cs(e).position !== 'fixed'; });
    const pastSet = new Set(past);
    const wide = past.filter((e) => !pastSet.has(e.parentElement)).filter((e) => !clipChain(e.parentElement || e).some((c) => c.a !== stage && c.a !== document.body && c.a !== e && /hidden|clip|auto|scroll/.test(c.ox)));
    const culprit = wide.sort((x, y) => y.getBoundingClientRect().right - x.getBoundingClientRect().right)[0] || document.body;
    push('hscroll', stage && stage.scrollWidth - stage.clientWidth > 1 ? 'stage' : 'page', culprit, { scrollWidth: de.scrollWidth, innerWidth: W, culprits: wide.slice(0, 3).map((e) => sel(e) + ' right ' + Math.round(e.getBoundingClientRect().right)) }, hs, null);
  }

  // ---------- (e) phone: tap targets (R7) and font sizes (R8) ----------
  if (phone) {
    const liveEls = new Set(live.map((a) => a.el));
    for (const el of els) {
      if (!el.matches(TAPS) || cs(el).visibility === 'hidden') continue;
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue;
      const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue; // R7 visually hidden input
      if (r.right <= 0 || r.left >= W || r.bottom <= 0 || r.top >= H) continue;
      if (el.tagName === 'INPUT' && /checkbox|radio/.test(el.type) && el.closest('label')) continue;
      if (!liveEls.has(el) && el.textContent.trim()) { const at = atomOf.get(el); if (at && at.covered) continue; if (!at) { /* a text-less icon button: still a target */ } }
      if ((el.tagName === 'A' || el.classList.contains('tlink')) && /^inline$/.test(cs(el).display) && el.parentElement && [...el.parentElement.childNodes].some((x) => x.nodeType === 3 && x.nodeValue.trim().length > 3)) continue; // R7 inline link
      // hidden behind something (R3) when it has no text: sample its centre
      if (!el.textContent.trim()) {
        const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2; if (cx >= 0 && cy >= 0 && cx < W && cy < H) { const top = document.elementFromPoint(cx, cy); if (top && !el.contains(top) && !top.contains(el) && opaqueBg(top) && !top.closest('svg')) continue; }
      }
      const m = Math.min(r.width, r.height); if (m >= 43.5) continue;
      push('tap', r.width < 43.5 && r.height < 43.5 ? 'both' : r.width < 43.5 ? 'width' : 'height', el, { w: Math.round(r.width), h: Math.round(r.height) }, 44 - m, r);
    }
    for (const a of live) for (const it of a.items) {
      if (!it.seen || !it.seen.length) continue;
      const el = it.el, fs = parseFloat(cs(el).fontSize), cap = !!el.closest(CAPTIONS), min = cap ? 13 : 15;
      if (fs < min - 0.05) push('font', cap ? 'caption' : 'text', el, { px: Math.round(fs * 10) / 10, min }, 3 * (min - fs), it.seen[0], textOf(el));
    }
  }
  // one finding per element and kind (the worst one)
  const best = new Map(); for (const f of out) { const k = f.kind + '|' + f.how + '|' + f.sel; const p = best.get(k); if (!p || f.sev > p.sev) best.set(k, f); }
  return { findings: [...best.values()], n };
}

// a red frame over a finding for its screenshot (fixed, above everything, no pointer events). HILITE(null) removes it.
function HILITE(o) {
  let d = document.getElementById('__fitHi'); if (d) d.remove(); let l = document.getElementById('__fitHiL'); if (l) l.remove();
  if (!o) return;
  const [x0, y0, x1, y1] = o.rect;
  d = document.createElement('div'); d.id = '__fitHi';
  d.style.cssText = `position:fixed;left:${x0 - 3}px;top:${y0 - 3}px;width:${Math.max(4, x1 - x0 + 6)}px;height:${Math.max(4, y1 - y0 + 6)}px;outline:3px solid #e0006f;box-shadow:0 0 0 9999px rgba(0,0,0,.18);z-index:2147483647;pointer-events:none;border-radius:3px`;
  l = document.createElement('div'); l.id = '__fitHiL'; l.textContent = o.label;
  l.style.cssText = `position:fixed;left:4px;${y0 > 60 ? 'top:4px' : 'bottom:4px'};max-width:${innerWidth - 8}px;font:bold 12px/1.3 monospace;background:#e0006f;color:#fff;padding:3px 6px;z-index:2147483647;pointer-events:none;white-space:normal`;
  document.documentElement.appendChild(d); document.documentElement.appendChild(l);
}

// ---------- node: reports ----------
const fs = require('fs'), path = require('path');
const KINDS = ['clip', 'escape', 'overlap', 'hscroll', 'tap', 'font', 'crowd'];
// i18n key lookup for the report: the key whose text is exactly the finding's text (static strings only)
function keyFinder(dir) {
  const maps = {};
  return (lang, text) => {
    if (!dir || !text) return null;
    if (!maps[lang]) { maps[lang] = new Map(); try { const j = JSON.parse(fs.readFileSync(path.join(dir, lang + '.json'), 'utf8')); for (const [k, v] of Object.entries(j)) if (typeof v === 'string') { const s = v.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 60); if (s && !maps[lang].has(s)) maps[lang].set(s, k); } } catch (e) { /* no table */ } }
    const s = text.split(' / ')[0].trim(); return maps[lang].get(s) || null;
  };
}
// all: [{ lang, size, screen, ...finding }]; meta: { title, langs, sizes, unreached: [..], secs, i18nDir, extra: [lines] }
function report(name, all, meta) {
  const LOGS = path.join(__dirname, 'test_logs'); fs.mkdirSync(LOGS, { recursive: true });
  const keyOf = keyFinder(meta.i18nDir);
  all.forEach((f) => { if (f.key === undefined) f.key = keyOf(f.lang, f.text); });
  fs.writeFileSync(path.join(LOGS, name + '.json'), JSON.stringify({ meta: Object.assign({}, meta, { i18nDir: undefined }), count: all.length, findings: all }, null, 1));
  const L = [`# ${meta.title}`, '', `${new Date().toISOString().slice(0, 16)}Z, ${all.length} findings, ${meta.langs.length} languages x ${meta.sizes.length} sizes, ${Math.round(meta.secs)} s. Rules: game/fit_lib.js, docs/i18n/coord/FIT.md.`, ''];
  const cnt = (f) => { const c = {}; KINDS.forEach((k) => { c[k] = 0; }); f.forEach((x) => { c[x.kind] = (c[x.kind] || 0) + 1; }); return c; };
  L.push('## Per language', '', '| lang | ' + KINDS.join(' | ') + ' | total |', '|' + '---|'.repeat(KINDS.length + 2));
  for (const l of meta.langs) { const f = all.filter((x) => x.lang === l), c = cnt(f); L.push(`| ${l} | ${KINDS.map((k) => c[k]).join(' | ')} | ${f.length} |`); }
  L.push('', '## Per size', '', '| size | ' + KINDS.join(' | ') + ' | total |', '|' + '---|'.repeat(KINDS.length + 2));
  for (const s of meta.sizes) { const f = all.filter((x) => x.size === s), c = cnt(f); L.push(`| ${s} | ${KINDS.map((k) => c[k]).join(' | ')} | ${f.length} |`); }
  L.push('', '## Language x size x kind', '', '| lang | size | ' + KINDS.join(' | ') + ' | total |', '|' + '---|'.repeat(KINDS.length + 3));
  for (const l of meta.langs) for (const s of meta.sizes) { const f = all.filter((x) => x.lang === l && x.size === s); if (!f.length && !(meta.ran || []).includes(l + ':' + s)) continue; const c = cnt(f); L.push(`| ${l} | ${s} | ${KINDS.map((k) => c[k]).join(' | ')} | ${f.length} |`); }
  // the worst 50, deduped by selector + kind across languages, sizes and screens
  const groups = new Map();
  for (const f of all) { const k = f.kind + '|' + f.sel; let g = groups.get(k); if (!g) { g = { worst: f, langs: new Set(), sizes: new Set(), screens: new Set(), n: 0 }; groups.set(k, g); } g.n++; g.langs.add(f.lang); g.sizes.add(f.size); g.screens.add(f.screen); if (f.sev > g.worst.sev) g.worst = f; }
  const top = [...groups.values()].sort((a, b) => b.worst.sev - a.worst.sev || b.n - a.n);
  L.push('', `## The worst 50 (of ${groups.size} distinct selector + kind)`, '', '| # | kind | sev | screen | lang / size (worst) | text | key | selector | where else | numbers |', '|---|---|---|---|---|---|---|---|---|---|');
  const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  top.slice(0, 50).forEach((g, i) => { const f = g.worst; L.push(`| ${i + 1} | ${f.kind} ${f.how} | ${f.sev} | ${esc(f.screen)} | ${f.lang} ${f.size} | ${esc(f.text)} | ${esc(f.key || '')} | \`${esc(f.sel)}\` | ${g.langs.size} langs, ${g.sizes.size} sizes, ${g.screens.size} screens (${g.n}) | ${esc(JSON.stringify(f.num))} |`); });
  if (meta.unreached && meta.unreached.length) { L.push('', '## Screens the audit could not open', ''); meta.unreached.forEach((u) => L.push('- ' + u)); }
  if (meta.extra) L.push('', ...meta.extra);
  fs.writeFileSync(path.join(LOGS, name + '.md'), L.join('\n') + '\n');
  return { groups: top, md: path.join(LOGS, name + '.md') };
}
// short console summary
function summary(all, meta) {
  const by = (k) => { const m = {}; all.forEach((f) => { m[f[k]] = (m[f[k]] || 0) + 1; }); return m; };
  return [`findings: ${all.length}`, 'per language: ' + meta.langs.map((l) => `${l} ${by('lang')[l] || 0}`).join(', '), 'per size: ' + meta.sizes.map((s) => `${s} ${by('size')[s] || 0}`).join(', '), 'per kind: ' + KINDS.map((k) => `${k} ${by('kind')[k] || 0}`).join(', ')];
}
// pick the screenshots: the worst N groups' worst instances that have a shot; copies them into dir and deletes the rest of tmp
function keepShots(all, tmp, dir, N) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const groups = new Map(); for (const f of all) { if (!f.shot) continue; const k = f.kind + '|' + f.sel; const g = groups.get(k); if (!g || f.sev > g.sev) groups.set(k, f); }
  const pick = [...groups.values()].sort((a, b) => b.sev - a.sev).slice(0, N); let i = 0;
  for (const f of pick) { const src = path.join(tmp, f.shot); if (!fs.existsSync(src)) continue; const nm = `${String(++i).padStart(2, '0')}_${f.kind}_${f.lang}_${f.size}_${f.screen.replace(/[^\w]+/g, '-').slice(0, 30)}${path.extname(f.shot) || '.png'}`; fs.copyFileSync(src, path.join(dir, nm)); f.shotKept = path.basename(dir) + '/' + nm; }
  fs.rmSync(tmp, { recursive: true, force: true });
  return i;
}
module.exports = { MEASURE, HILITE, report, summary, keepShots, KINDS };
