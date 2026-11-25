// Suite merch_legal: the four DRAFT legal pages of the merch shop (docs/design/merch/PART7.md):
//   /merch/terms/, /merch/shipping/, /merch/seller/, /merch/tokushoho/
//   NODE_PATH=$(npm root -g) node merch/test_legal.js            all checks (Playwright's Chromium; this file serves site/ itself, as merch/test_page.js does)
//   SHOTS=1 NODE_PATH=$(npm root -g) node merch/test_legal.js    also writes docs/design/merch/part7_shots/<page>_390.png (390x844, dpr 2, top of page)
// Covers, on every page: loads with no console errors, no failed request and no request off the origin; noindex; no inline script; the draft banner
// right under the only h1; the "Last updated" line; the site header and footer; in-page links and every same-origin link work; the links between the
// four pages and back to /merch/; at 360x640, 390x844 and 1280x720 no sideways scroll, no text past its box, body text at least 15 px, standalone
// taps at least 44 px tall, every text at least 4.5:1; every money figure equals site/merch/catalog.json (fees, thresholds, the extra-item fee,
// product prices, delivery times); every placeholder marked; none of the banned words; the Japanese page has every heading the notice needs.
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SITE = path.join(ROOT, 'site'), BRAND = path.join(ROOT, 'brand');
const CAT = JSON.parse(fs.readFileSync(path.join(SITE, 'merch', 'catalog.json'), 'utf8'));
const SHOTS = process.env.SHOTS === '1', SHOT_DIR = path.join(ROOT, 'docs', 'design', 'merch', 'part7_shots');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { console.error('Playwright is needed (NODE_PATH=$(npm root -g))'); process.exit(1); }

let pass = 0, fail = 0; const fails = [];
function ok(name, cond, detail) { if (cond) { pass++; } else { fail++; fails.push(name + (detail !== undefined ? ': ' + (typeof detail === 'string' ? detail : JSON.stringify(detail)) : '')); console.log('FAIL ' + name, detail !== undefined ? detail : ''); } }

const PAGES = ['terms', 'shipping', 'seller', 'tokushoho'];
const PATH = (id) => '/merch/' + id + '/';
const DRAFT_EN = 'Draft: to be checked by a professional before the shop opens.';
const JP_HEADINGS = ['販売業者', '運営統括責任者', '所在地', '電話番号', 'メールアドレス', '販売価格', '商品代金以外の必要料金', '支払方法', '支払時期', '商品の引渡時期', '返品・交換・キャンセル'];

// ---- the catalog's money, in cents, by key ("product.mug.price", "zone.us_jp.fee", ...); every figure a page may show
const MONEY = {};
for (const p of CAT.products) MONEY['product.' + p.id + '.price'] = p.price;
for (const z of CAT.zones) { MONEY['zone.' + z.id + '.fee'] = z.fee; if (z.free_from != null) MONEY['zone.' + z.id + '.free_from'] = z.free_from; if (z.extra) MONEY['zone.' + z.id + '.extra'] = z.extra; }
const ALLOWED = new Set(Object.values(MONEY));
const cents = (s) => { const m = /(\d+(?:\.\d{1,2})?)/.exec(String(s).replace(/,/g, '')); return m ? Math.round(parseFloat(m[1]) * 100) : NaN; };

// ---- the site, served as the web root (the brand icons at the root, as tools/cf_site.js serves them)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webp': 'image/webp', '.webmanifest': 'application/manifest+json' };
const server = http.createServer((q, s) => {
  const p = decodeURIComponent(q.url.split(/[?#]/)[0]);
  let f = /^\/(favicon\.svg|icon-\d+\.png|doodle-doggo-(icon|logo)\.svg|site\.webmanifest)$/.test(p) ? path.join(BRAND, p) : path.join(SITE, p);
  if (!f.startsWith(SITE) && !f.startsWith(BRAND)) { s.writeHead(403); return s.end(); }
  try { if (fs.statSync(f).isDirectory()) { if (!p.endsWith('/')) { s.writeHead(301, { location: p + '/' }); return s.end(); } f = path.join(f, 'index.html'); } } catch (e) { if (fs.existsSync(f + '.html')) f += '.html'; }
  fs.readFile(f, (e, b) => { if (e) { s.writeHead(404); return s.end(); } s.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); s.end(b); });
});

let BASE, browser;
async function open(id, vp, dpr) {
  const ctx = await browser.newContext({ viewport: { width: vp[0], height: vp[1] }, deviceScaleFactor: dpr || 1, locale: 'en-US' });
  const page = await ctx.newPage();
  const errors = [], outside = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => { if (!r.url().startsWith(BASE) && !r.url().startsWith('data:')) outside.push(r.url()); });
  page.on('response', (r) => { if (r.status() >= 400) errors.push(r.status() + ' ' + r.url()); });
  page.on('dialog', (d) => { errors.push('dialog ' + d.message()); d.dismiss().catch(() => {}); });
  await page.goto(BASE + PATH(id), { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(120);
  return { ctx, page, errors, outside };
}

// ---- in the page: the fit, the sizes and the contrast (WCAG 2), as merch/test_page.js measures them
function measure() {
  const out = { wide: document.documentElement.scrollWidth - document.documentElement.clientWidth, spill: [], tiny: [], small: [], low: [], n: 0 };
  // visible: drawn, not hidden, and not inside a box clipped to a pixel or two (a visually hidden table head)
  const shut = (e) => { for (let x = e; x && x !== document.body; x = x.parentElement) { const b = x.getBoundingClientRect(); if (b.width <= 4 || b.height <= 4) return true; } return false; };
  const vis = (e) => { const b = e.getBoundingClientRect(), s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' && !e.closest('[hidden],dialog:not([open]),details:not([open])>:not(summary)') && !shut(e); };
  const label = (e) => (e.id || e.className || e.tagName) + ' "' + e.textContent.trim().replace(/\s+/g, ' ').slice(0, 24) + '"';
  const hasText = (e) => [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
  // no text past its box: every element inside the sheet, every box's children inside the box
  const sheet = document.querySelector('#legal'), sb = sheet.getBoundingClientRect();
  sheet.querySelectorAll('*').forEach((k) => { if (!vis(k) || k.closest('svg') || k.closest('.sitehead,.sitetop')) return; const b = k.getBoundingClientRect(); if (b.right > sb.right + 1.5 || b.left < sb.left - 1.5) out.spill.push('sheet > ' + label(k) + ' ' + Math.round(b.left) + '-' + Math.round(b.right)); });
  document.querySelectorAll('#legal .card, #legal .decide, #legal .draft, #legal .facts>div, #legal .fees tr, #legal .fees td, #legal .fees th, #legal .legalnav a, footer.mfoot').forEach((c) => {
    if (!vis(c)) return; const cb = c.getBoundingClientRect();
    c.querySelectorAll('*').forEach((k) => { if (!vis(k) || k.closest('svg')) return; const b = k.getBoundingClientRect(); if (b.right > cb.right + 1.5 || b.left < cb.left - 1.5) out.spill.push((c.className || c.tagName) + ' > ' + label(k) + ' ' + Math.round(b.left) + '-' + Math.round(b.right) + ' in ' + Math.round(cb.left) + '-' + Math.round(cb.right)); });
    if (c.scrollWidth > c.clientWidth + 1 && getComputedStyle(c).overflowX !== 'visible') out.spill.push('scrolls ' + label(c));
  });
  // body text at least 15 px
  document.querySelectorAll('main *, footer *').forEach((e) => { if (!vis(e) || e.closest('svg') || !hasText(e)) return; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 15) out.tiny.push(label(e) + ' ' + fs + 'px'); });
  // standalone taps at least 44 px tall: links in a nav, the footer, the header, or alone in their block; every button and summary
  document.querySelectorAll('main a, main button, main summary, main select, footer a').forEach((e) => {
    if (!vis(e)) return;
    const alone = e.tagName !== 'A' || e.closest('nav,footer,header,.sitetop,.toc,.legalnav') || (e.parentElement && e.parentElement.textContent.trim() === e.textContent.trim());
    if (!alone) return; const b = e.getBoundingClientRect();
    if (b.height < 43.5) out.small.push(label(e) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height));
  });
  const rgb = (s) => { const m = /rgba?\(([^)]+)\)/.exec(s); if (!m) return null; const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const over = (top, bot) => [0, 1, 2].map((i) => top[i] * top[3] + bot[i] * (1 - top[3])).concat([1]);
  const bgOf = (e) => { const layers = []; for (let x = e; x; x = x.parentElement) { const c = rgb(getComputedStyle(x).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } } let b = [255, 251, 243, 1]; for (let i = layers.length - 1; i >= 0; i--) b = over(layers[i], b); return b; };
  document.querySelectorAll('main *, footer *').forEach((e) => {
    if (!vis(e) || e.closest('svg') || !hasText(e)) return;
    const s = getComputedStyle(e), fg = rgb(s.color); let op = 1; for (let x = e; x; x = x.parentElement) op *= +getComputedStyle(x).opacity;
    const bg = bgOf(e), f2 = over([fg[0], fg[1], fg[2], fg[3] * op], bg), a = L(f2), b = L(bg), r = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    out.n++; if (r < 4.5) out.low.push(label(e) + ' ' + r.toFixed(2));
  });
  for (const k of ['spill', 'tiny', 'small', 'low']) out[k] = out[k].slice(0, 6);
  return out;
}

// ---- in the page: what it says and links to
function facts() {
  const txt = (e) => (e ? e.textContent.replace(/\s+/g, ' ').trim() : '');
  const main = document.querySelector('main'), sheet = document.querySelector('#legal'), h1s = [...document.querySelectorAll('h1')];
  const head = sheet.querySelector('.sitehead'), top = sheet.querySelector('.sitetop');
  // the page's own words: the sheet without the copied site header
  const own = sheet.cloneNode(true); own.querySelectorAll('.sitehead,.sitetop').forEach((n) => n.remove());
  const ownNoPh = own.cloneNode(true); ownNoPh.querySelectorAll('.ph').forEach((n) => n.remove());
  const foot = document.querySelector('footer.mfoot');
  return {
    lang: document.documentElement.lang,
    robots: (document.querySelector('meta[name=robots]') || {}).content || '',
    inline: [...document.scripts].filter((s) => !s.src).length + [...document.querySelectorAll('*')].filter((e) => [...e.attributes].some((a) => /^on/i.test(a.name))).length,
    scripts: [...document.scripts].map((s) => s.getAttribute('src')),
    styles: [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => l.getAttribute('href')),
    h1n: h1s.length, h1: txt(h1s[0]),
    draftNext: !!(h1s[0] && h1s[0].nextElementSibling && h1s[0].nextElementSibling.id === 'draft'),
    draft: txt(document.querySelector('#draft')),
    draftBox: (() => { const d = document.querySelector('#draft'); if (!d) return null; const s = getComputedStyle(d); return { bg: s.backgroundColor, border: s.borderTopStyle, fw: s.fontWeight }; })(),
    updated: txt(document.querySelector('#draft + .updated')),
    header: !!(head && top && head.querySelector('.sitenav a[href="/"]') && head.querySelector('.sitenav a[href="/about"]') && top.querySelector('img.logo')),
    footer: !!foot, footLinks: foot ? [...foot.querySelectorAll('a')].map((a) => a.getAttribute('href')) : [],
    navLinks: [...sheet.querySelectorAll('.legalnav a')].map((a) => [a.getAttribute('href'), a.getAttribute('aria-current')]),
    hashLinks: [...document.querySelectorAll('a[href^="#"]')].map((a) => [a.getAttribute('href'), !!document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)))]),
    pageHash: [...document.querySelectorAll('a[href*="#"]')].map((a) => a.getAttribute('href')).filter((h) => /^\/merch\/(terms|shipping|seller|tokushoho)\/#/.test(h)),
    links: [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')),
    ownText: txt(own), ownNoPh: txt(ownNoPh), allText: txt(main) + ' ' + txt(foot),
    ph: [...sheet.querySelectorAll('.ph')].map(txt),
    money: [...sheet.querySelectorAll('[data-money]')].map((e) => [e.dataset.money, txt(e)]),
    eta: [...sheet.querySelectorAll('[data-eta]')].map((e) => [e.dataset.eta, txt(e)]),
    short: (() => { const s = sheet.querySelector('.short'); return s ? { h: txt(s.querySelector('h2')), n: s.querySelectorAll('li').length } : null; })(),
    decide: [...sheet.querySelectorAll('.decide .dlabel')].map(txt),
    dts: [...sheet.querySelectorAll('.facts dt')].map(txt),
    feeZones: [...sheet.querySelectorAll('.fees tbody tr')].map((r) => r.dataset.zone),
    phStyle: (() => { const p = sheet.querySelector('.ph'); if (!p) return null; const s = getComputedStyle(p); return { bg: s.backgroundColor, border: s.borderTopStyle }; })(),
  };
}

const BANNED = [/nintendo/i, /pok[eé]mon/i, /animal crossing/i, /printful/i, /\bAI\b/, /artificial intelligence/i, /chatgpt|\bclaude\b|\bgpt\b/i,
  /\bbreed(s|ing|er|ers)?\b/i, /\bstud\b/i, /litter price/i, /\b(sell|sells|selling|sold|buy|buys|buying|bought)\b/i,
  /hurry|only \d+ left|limited time|act now|don'?t miss|last chance|while stocks last/i, /lorem|\bTODO\b|\bTBD\b|\bXXX\b/i];
const BANNED_JA = [/(犬|子犬|ワンちゃん)を(売|買|販売)/, /生体販売|繁殖|交配|ブリーダー/, /任天堂|ポケモン|どうぶつの森/];
const EMOJI = /\p{Extended_Pictographic}/u;

async function pageChecks() {
  const seenLinks = new Set();
  for (const id of PAGES) {
    const t = await open(id, [390, 844]);
    const f = await t.page.evaluate(facts);
    const tag = id;
    ok(tag + ': no console errors or failed requests', t.errors.length === 0, t.errors.slice(0, 3));
    ok(tag + ': no request left the origin', t.outside.length === 0, t.outside.slice(0, 3));
    ok(tag + ': noindex', /noindex/.test(f.robots), f.robots);
    ok(tag + ': no inline script or handler', f.inline === 0, f.inline);
    ok(tag + ': scripts and styles from the site only', f.scripts.every((s) => s && s.startsWith('/')) && f.styles.join() === '/style.css,/merch/merch.css,/merch/legal.css', [f.scripts, f.styles]);
    ok(tag + ': exactly one h1', f.h1n === 1, f.h1n);
    ok(tag + ': the draft banner is right under the title', f.draftNext && f.draft.includes(DRAFT_EN), f.draft);
    ok(tag + ': the draft banner stands out (filled, dashed, bold)', !!f.draftBox && f.draftBox.bg !== 'rgba(0, 0, 0, 0)' && f.draftBox.border === 'dashed' && +f.draftBox.fw >= 600, f.draftBox);
    ok(tag + ': the Last updated line (25 November 2026, draft)', /Last updated: 25 November 2026 \(draft\)/.test(f.updated), f.updated);
    if (id === 'tokushoho') {
      ok(tag + ': the draft banner in Japanese too', /下書き/.test(f.draft) && /専門家/.test(f.draft), f.draft);
      ok(tag + ': the date line in Japanese too', /2026年11月25日（下書き）/.test(f.updated), f.updated);
      ok(tag + ': the page is in Japanese', f.lang === 'ja', f.lang);
      ok(tag + ': a short English line on top', /Act on Specified Commercial Transactions/.test(f.ownText), '');
      for (const h of JP_HEADINGS) ok(tag + ': has the heading ' + h, f.dts.includes(h), f.dts);
      ok(tag + ': the phone option is marked for the professional', f.decide.some((d) => /専門家/.test(d)) && /遅滞なく/.test(f.ownText), f.decide);
      ok(tag + ': no 動作環境 (not software)', !f.dts.includes('動作環境'));
      ok(tag + ': returns: made to order, faults, the 1-hour cancel', /受注生産/.test(f.ownText) && /30日以内/.test(f.ownText) && /1時間以内/.test(f.ownText), '');
      for (const re of BANNED_JA) ok(tag + ': no banned Japanese words ' + re, !re.test(f.allText), (f.allText.match(re) || [])[0]);
    } else ok(tag + ': the page is in English', f.lang === 'en', f.lang);
    ok(tag + ': the site header', f.header);
    ok(tag + ': the site footer', f.footer);
    // links between the four pages and back to /merch/
    const others = PAGES.filter((x) => x !== id).map(PATH);
    ok(tag + ': links to the other three pages', others.every((p) => f.links.includes(p)), others.filter((p) => !f.links.includes(p)));
    ok(tag + ': links back to /merch/', f.links.includes('/merch/'));
    ok(tag + ': the four pages in the page nav, this one marked', f.navLinks.length === 4 && f.navLinks.every(([h, c]) => (h === PATH(id)) === (c === 'page')), f.navLinks);
    ok(tag + ': the footer links the four pages, the shop, privacy and contact', [...PAGES.map(PATH), '/merch/', '/privacy', 'mailto:contact@doodledoggo.app'].every((p) => f.footLinks.includes(p)), f.footLinks);
    const deadHash = f.hashLinks.filter(([, there]) => !there);
    ok(tag + ': every in-page link has its target', deadHash.length === 0, deadHash);
    f.links.forEach((h) => seenLinks.add(h));
    // placeholders: every one marked and bracketed; nothing bracketed left unmarked
    ok(tag + ': every placeholder is a marked [..] in the placeholder style', f.ph.every((p) => /^\[[^\[\]]+\]$/.test(p)) && (f.ph.length === 0 || (f.phStyle && f.phStyle.bg !== 'rgba(0, 0, 0, 0)' && f.phStyle.border === 'dashed')), [f.ph.filter((p) => !/^\[[^\[\]]+\]$/.test(p)), f.phStyle]);
    ok(tag + ': no unmarked placeholder left', !/[\[\]［］]|\{\{|\}\}/.test(f.ownNoPh), (f.ownNoPh.match(/.{0,30}[\[\]［］].{0,30}/) || [])[0]);
    if (id === 'seller' || id === 'tokushoho') ok(tag + ': the unknown seller facts are placeholders', f.ph.length >= 4, f.ph.length);
    // words
    for (const re of BANNED) ok(tag + ': no banned words ' + re, !re.test(f.ownText) && !re.test(f.allText.replace(/Seller details/g, '')), (f.allText.match(re) || [])[0]);
    ok(tag + ': no emoji in the page\'s own words', !EMOJI.test(f.ownText), (f.ownText.match(EMOJI) || [])[0]);
    // money: every marked figure equals the catalog, and every figure in the text is a catalog figure
    const badMoney = f.money.filter(([k, v]) => !(k in MONEY) || cents(v) !== MONEY[k]);
    ok(tag + ': every marked money figure equals catalog.json', badMoney.length === 0, badMoney);
    const figs = (f.ownText.match(/(?:US)?\$\s?\d[\d,]*(?:\.\d{1,2})?|\d[\d,]*(?:\.\d{1,2})?\s?米ドル/g) || []);
    const odd = figs.filter((x) => !ALLOWED.has(cents(x)));
    if (id !== 'seller') ok(tag + ': the money figures were found', figs.length >= 2, figs);
    ok(tag + ': every money figure in the text is a catalog figure', odd.length === 0, odd);
    const badEta = f.eta.filter(([z, v]) => { const zz = CAT.zones.find((q) => q.id === z); const n = (v.match(/\d+/g) || []).map(Number); return !zz || n.length !== 2 || n[0] !== zz.eta[0] || n[1] !== zz.eta[1]; });
    ok(tag + ': every delivery time equals catalog.json', badEta.length === 0, badEta);
    if (id === 'terms' || id === 'shipping') {
      ok(tag + ': "The short version" with 5 lines', !!f.short && f.short.h === 'The short version' && f.short.n === 5, f.short);
      ok(tag + ': the product prices are shown', f.money.some(([k]) => k === 'product.mug.price') && f.money.some(([k]) => k === 'product.tee.price'), f.money);
    }
    if (id === 'shipping') {
      const want = Object.keys(MONEY).filter((k) => k.startsWith('zone.'));
      ok(tag + ': every zone fee, threshold and extra-item fee is in the table', want.every((k) => f.money.some(([m]) => m === k)), want.filter((k) => !f.money.some(([m]) => m === k)));
      ok(tag + ': one table row per catalog zone, in no other order of facts', f.feeZones.slice().sort().join() === CAT.zones.map((z) => z.id).sort().join(), f.feeZones);
      ok(tag + ': every zone with a threshold says "Orders of $N or more ship free."', CAT.zones.filter((z) => z.free_from != null).every((z) => f.ownText.includes('Orders of $' + (z.free_from % 100 ? (z.free_from / 100).toFixed(2) : z.free_from / 100) + ' or more ship free.')), '');
      ok(tag + ': a zone with no threshold never says free', CAT.zones.filter((z) => z.free_from == null).length === 0 || /Not offered/.test(f.ownText));
      ok(tag + ': every delivery time is in the table', CAT.zones.every((z) => f.eta.some(([e]) => e === z.id)), f.eta);
      ok(tag + ': "We can\'t deliver to some places yet."', f.ownText.includes("We can't deliver to some places yet."));
      ok(tag + ': separate parcels, tracking, the 7 days, the cancel hour, 30 days', /their own parcels/.test(f.ownText) && /tracking link/.test(f.ownText) && /7 days/.test(f.ownText) && /1 hour/.test(f.ownText) && /30 days/.test(f.ownText));
    }
    if (id === 'terms') {
      ok(tag + ': the governing law choice is in a box to be decided with a professional', f.decide.includes('To be decided with a professional'), f.decide);
      ok(tag + ': the policy text of TRANSACTIONS.md 4, word for word', f.ownText.includes("Everything is printed just for you with your own dog, so we can't take it back if you change your mind. You can cancel the whole order for a full refund within 1 hour of paying, from your order page. If something arrives damaged or misprinted, or never arrives, email us within 30 days of delivery (or of the latest delivery date we gave you) with a photo, and we'll reprint it or refund it, whichever you prefer. This doesn't affect your legal rights."));
      ok(tag + ': 18 or over', /18 or over/.test(f.ownText));
      ok(tag + ': says "no returns", never "no refunds"', !/no refunds/i.test(f.ownText));
      ok(tag + ': the gift code has no cash value and may be absent', /no cash value/.test(f.ownText) && /not every order/.test(f.ownText));
    }
    if (SHOTS) {
      const s = await open(id, [390, 844], 2);
      fs.mkdirSync(SHOT_DIR, { recursive: true });
      await s.page.screenshot({ path: path.join(SHOT_DIR, id + '_390.png') });
      await s.ctx.close();
    }
    await t.ctx.close();
  }
  // every same-origin link of the four pages answers (in-page anchors on another page included)
  const ctx = await browser.newContext();
  for (const h of seenLinks) {
    if (!h.startsWith('/')) { ok('link ' + h + ': mailto or https only', /^(mailto:contact@doodledoggo\.app|https:\/\/)/.test(h) || h.startsWith('#'), h); continue; }
    const r = await ctx.request.get(BASE + h.split('#')[0]);
    ok('link ' + h + ': answers 200', r.status() === 200, r.status());
    const frag = h.split('#')[1];
    if (frag && !frag.startsWith('/') && /^\/merch\/(terms|shipping|seller|tokushoho)\//.test(h)) { const body = await r.text(); ok('link ' + h + ': its anchor exists', body.includes('id="' + frag + '"')); }
  }
  await ctx.close();
}

async function fitChecks() {
  for (const vp of [[360, 640], [390, 844], [1280, 720]]) {
    for (const id of PAGES) {
      const t = await open(id, vp);
      const r = await t.page.evaluate(measure);
      const tag = 'fit ' + id + ' ' + vp.join('x');
      ok(tag + ': no sideways scroll', r.wide <= 0, r.wide);
      ok(tag + ': no text past its box', r.spill.length === 0, r.spill);
      ok(tag + ': body text at least 15 px', r.tiny.length === 0, r.tiny);
      ok(tag + ': standalone taps at least 44 px tall', r.small.length === 0, r.small);
      ok(tag + ': every text at least 4.5:1', r.low.length === 0 && r.n >= 40, r.n < 40 ? 'only ' + r.n + ' texts measured' : r.low);
      ok(tag + ': no console errors, nothing off the origin', t.errors.length === 0 && t.outside.length === 0, t.errors.concat(t.outside).slice(0, 3));
      await t.ctx.close();
    }
  }
}

(async () => {
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  BASE = 'http://127.0.0.1:' + server.address().port;
  browser = await chromium.launch();
  const t0 = Date.now();
  try { await pageChecks(); await fitChecks(); } catch (e) { ok('the suite ran to the end', false, String(e && e.stack || e)); }
  await browser.close(); server.close();
  console.log(`merch_legal: ${pass} passed, ${fail} failed (${((Date.now() - t0) / 1000).toFixed(0)} s)`);
  if (fail) { console.log(fails.join('\n')); process.exit(1); }
})();
