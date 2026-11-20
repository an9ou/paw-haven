#!/usr/bin/env node
// v2.32 "A letter from your dog" (V232_letters.md 3): the small crayon header of the weekly email, site/img/mail/letter.png.
//   NODE_PATH=$(npm root -g) node tools/letters_art.js
// One picture for everyone (no per-person address, so it tracks nobody): the game's own Shiba, drawn by dogs/pawart_dogs.js as the game draws it,
// beside a crayon envelope with a paw-print seal, on the email's own paper colour. 952 x 240 (shown at 476 wide). No words in it: the letter is in
// 12 languages. doodledoggo.app serves it at /img/mail/letter.png after the next site deploy (tools/cf_site.js walks site/); the Worker puts it in
// the email only when its variable LETTERS_IMG is 1.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'site', 'img', 'mail', 'letter.png');
const req = (m) => { for (const r of [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean), module.paths)) { try { return require(path.join(r, m)); } catch (e) { /* next */ } } return require(m); };
const ctx = { window: {}, console }; ctx.window.window = ctx.window; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'dogs/pawart_dogs.js'), 'utf8'), ctx);
const PA = ctx.window.PawArt, INK = '#5B3D32', W = 952, H = 240;
const inner = (svg) => { const m = svg.match(/^<svg[^>]*viewBox="([^"]*)"[^>]*>([\s\S]*)<\/svg>\s*$/); if (!m) throw new Error('unexpected dog svg'); return { vb: m[1].split(/\s+/).map(Number), body: m[2] }; };
const dog = inner(PA.dog('shiba', { pose: 'sit', anim: false }));
// a flat fill under a two-stroke pencil line of the same path (the hand of the game's small doodles)
const two = (d, fill, w) => `<path d="${d}" fill="${fill}"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${INK}" stroke-width="${(w * 0.42).toFixed(1)}" opacity=".5" transform="translate(-1 .7)" stroke-linecap="round"/>`;
const env = `<g transform="translate(500 62) rotate(5) scale(1.55)">${two('M10 16 Q60 11 110 16 Q114 17 114 22 Q116 46 113 72 Q113 78 108 79 Q60 83 12 79 Q7 78 7 72 Q4 46 7 22 Q7 17 10 16Z', '#FFF4DF', 2.6)}<path d="M9 19 Q36 42 60 52 Q84 42 111 19" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`
  + `<g transform="translate(60 56)"><circle r="11" fill="#F28FA5" stroke="${INK}" stroke-width="2"/><ellipse cy="2.5" rx="4.2" ry="3.4" fill="#FFFBF3"/><circle cx="-4.6" cy="-2.6" r="1.7" fill="#FFFBF3"/><circle cx="0" cy="-4.6" r="1.7" fill="#FFFBF3"/><circle cx="4.6" cy="-2.6" r="1.7" fill="#FFFBF3"/></g></g>`;
const spark = (x, y, s, r) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0 -10 Q1.5 -1.5 10 0 Q1.5 1.5 0 10 Q-1.5 1.5 -10 0 Q-1.5 -1.5 0 -10Z" fill="#F6C453" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
const heart = (x, y, s, r) => `<path transform="translate(${x} ${y}) rotate(${r}) scale(${s})" d="M0 6 Q-11 -2 -6 -8 Q-2 -11 0 -5 Q2 -11 6 -8 Q11 -2 0 6Z" fill="#F28FA5" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>`;
const dh = 212, dw = dh * dog.vb[2] / dog.vb[3];
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#FBF6EA"/>`
  + `<path d="M40 226 Q240 218 476 224 Q700 230 912 222" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-dasharray="2 12" opacity=".45"/>`
  + `<svg x="${(300 - dw / 2).toFixed(1)}" y="${H - dh - 12}" width="${dw.toFixed(1)}" height="${dh}" viewBox="${dog.vb.join(' ')}">${dog.body}</svg>${env}`
  + spark(452, 52, 1.5, 12) + spark(742, 96, 1.1, -8) + heart(420, 120, 1.3, -12) + spark(176, 70, 1, 20) + heart(718, 176, 1, 14) + '</svg>';
(async () => {
  const { chromium } = req('playwright');
  const CHROME = process.env.PAW_CHROME || ['/opt/pw-browsers/chromium', '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find((f) => fs.existsSync(f));
  const browser = await chromium.launch(CHROME ? { executablePath: CHROME } : {}); const page = await browser.newPage();
  await page.setViewportSize({ width: W, height: H });
  await page.setContent(`<style>body{margin:0}svg{display:block}</style>${svg}`);
  // 32 colours are plenty for flat crayon fills: a small file for a picture that rides in every letter
  const png = await page.screenshot({ type: 'png' });
  await browser.close();
  fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, png);
  console.log('wrote ' + path.relative(ROOT, OUT) + ': ' + W + ' x ' + H + ', ' + (png.length / 1024).toFixed(1) + ' KB');
})().catch((e) => { console.error(e); process.exit(1); });
