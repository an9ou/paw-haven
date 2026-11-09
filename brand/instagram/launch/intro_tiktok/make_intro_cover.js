// The TikTok intro's cover (owner, 9 Nov 2026): its own design, never a frame of the video. 1080 x 1920; everything that matters inside
// the 1:1 crop (y 420..1500), the logo inside the 4:5 crop (y 285..1635). Noodle is the game's own crayon dachshund (dogs/pawart_dogs.js).
//   node brand/instagram/launch/intro_tiktok/make_intro_cover.js     (Playwright; Caveat from Google Fonts)
const fs = require('fs'), path = require('path'), vm = require('vm');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'dogs', 'pawart_dogs.js'), 'utf8'), ctx);
const inner = (s) => s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const noodle = inner(win.PawArt.dog('dachs', { pose: 'happy', anim: false }));
const logo = fs.readFileSync(path.join(ROOT, 'brand', 'doodle-doggo-logo.svg'), 'utf8').replace(/<rect width="900" height="280" fill="#FFF8EC"\/>/, '');
const INK = '#5B3D32', PINK = '#F28FA5', PAPER = '#FFF8EC', MUTED = '#8A7468';
let dots = ''; let a = 7; const r = () => ((a = (a * 16807) % 2147483647) / 2147483647);
for (let i = 0; i < 260; i++) dots += `<circle cx="${(r() * 1080).toFixed(0)}" cy="${(r() * 1920).toFixed(0)}" r="${(1.5 + r() * 2).toFixed(1)}" fill="#E3D2BA"/>`;
const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<style>body{margin:0}text{font-family:Caveat}</style>
<svg id="c" xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
<rect width="1080" height="1920" fill="${PAPER}"/>${dots}
<path d="M250 600 Q540 572 830 598" fill="none" stroke="${PINK}" stroke-width="26" stroke-linecap="round" opacity=".45"/>
<text x="540" y="530" text-anchor="middle" font-size="128" font-weight="700" fill="${INK}" transform="rotate(-2 540 500)">Hi! I'm Noodle.</text>
<text x="540" y="632" text-anchor="middle" font-size="96" font-weight="700" fill="${INK}" transform="rotate(-1 540 610)">I drew myself.</text>
<g transform="translate(818 600) rotate(-28)"><rect x="0" y="-13" width="96" height="26" rx="4" fill="${PINK}" stroke="${INK}" stroke-width="4"/><path d="M96 -13 L124 0 L96 13Z" fill="#FBE3C8" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><path d="M114 -4 L124 0 L114 4Z" fill="${INK}"/></g>

<svg x="160" y="660" width="760" height="${(760 * 160 / 214).toFixed(0)}" viewBox="22 40 214 160" overflow="visible">${noodle}</svg>
<g transform="rotate(-1 540 1300)"><rect x="150" y="1232" width="780" height="140" rx="40" fill="#FFFDF7" stroke="${INK}" stroke-width="5"/>
<text x="540" y="1295" text-anchor="middle" font-size="58" font-weight="700" fill="${INK}">a cozy dog game</text>
<text x="540" y="1348" text-anchor="middle" font-size="46" font-weight="600" fill="${MUTED}">40 crayon dogs · free · in your browser</text></g>
<svg x="265" y="1452" width="550" height="171" viewBox="0 0 900 280">${inner(logo)}</svg>
</svg>`;
(async () => {
  const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'networkidle' }); await p.evaluate(() => document.fonts.ready);
  await p.locator('#c').screenshot({ path: path.join(__dirname, 'intro-tiktok-cover.jpg'), type: 'jpeg', quality: 92 }); await b.close();
})();
