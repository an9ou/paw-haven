// Doodle Doggo winter profile picture for every channel (Instagram, Threads, X, TikTok, YouTube, RedNote).
//   node brand/winter/make_winter_icon.js [variant]      (needs playwright; chromium at /opt/pw-browsers/chromium)
// Same layout as the Halloween icon (brand/instagram/doodle-doggo-instagram-halloween.svg): a night background,
// the paper circle with its pencil ring (taken from that file), Noodle the dachshund in the game's own winter outfits,
// and the game's own snowman. Everything important sits inside the circle, so every round crop keeps it.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..'), OUT = __dirname;
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const PA = win.PawArt;
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const f1 = (n) => Math.round(n * 10) / 10;
function seeded(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const INK = '#3B2A33', NIGHT = '#2C4468', SNOW = '#FFFFFF', PAPER = '#FFF8EC', ICE = '#DCEBF7';
const OUTFIT = { neck: 'Snowflake Snood', body: 'Knit Winter Sweater' };

// the pencil ring of the Halloween icon (its first path)
const hal = fs.readFileSync(path.join(root, 'brand/instagram/doodle-doggo-instagram-halloween.svg'), 'utf8');
const ring = (/<path d="M685\.5 165\.7[^>]*\/>/.exec(hal) || [])[0];
if (!ring) throw new Error('pencil ring not found in the Halloween icon');

const dog = (key, o, x, y, w, vb = '22 30 214 168') => { const [, , vw, vh] = vb.split(' ').map(Number); return `<svg x="${x}" y="${y}" width="${w}" height="${f1(w * vh / vw)}" viewBox="${vb}" overflow="visible">${inner(PA.dog(key, Object.assign({ anim: false }, o)))}</svg>`; };
const prop = (name, o, x, y, w, h) => { const s = PA.prop(name, o || {}), vb = /viewBox="([^"]+)"/.exec(s)[1]; return `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vb}" overflow="visible">${inner(s)}</svg>`; };
// a crayon snowflake: three crossing strokes with little V tips
function flake(x, y, s, rot, col = SNOW, sw = 3.4, ink = false) {
  let d = '';
  for (const a of [0, 60, 120]) {
    const c = Math.cos((a + rot) * Math.PI / 180), n = Math.sin((a + rot) * Math.PI / 180);
    d += `M${f1(x - c * s)} ${f1(y - n * s)}L${f1(x + c * s)} ${f1(y + n * s)}`;
    for (const sg of [1, -1]) {
      const ex = x + sg * c * s * .95, ey = y + sg * n * s * .95, mx = x + sg * c * s * .62, my = y + sg * n * s * .62, vx = -n * s * .24, vy = c * s * .24;
      d += `M${f1(mx + vx)} ${f1(my + vy)}L${f1(ex - sg * c * s * .08)} ${f1(ey - sg * n * s * .08)}L${f1(mx - vx)} ${f1(my - vy)}`;
    }
  }
  return (ink ? `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${f1(sw + 3)}" stroke-linecap="round" stroke-linejoin="round"/>` : '')
    + `<path d="${d}" fill="none" stroke="${col}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const star = (x, y, r, sw = 3) => `<path d="M${x} ${y - r}Q${x + r * .15} ${y - r * .15} ${x + r} ${y}Q${x + r * .15} ${y + r * .15} ${x} ${y + r}Q${x - r * .15} ${y + r * .15} ${x - r} ${y}Q${x - r * .15} ${y - r * .15} ${x} ${y - r}Z" fill="#FFE8B0" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;

function icon() {
  const rnd = seeded(2026);
  let bg = `<rect width="1080" height="1080" fill="${NIGHT}"/>`;
  // falling snow on the night: soft dots outside the circle
  for (let i = 0; i < 120; i++) { const x = rnd() * 1080, y = rnd() * 1080, r = 2 + rnd() * 3.4; if (Math.hypot(x - 540, y - 540) < 412) continue; bg += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${SNOW}" opacity="${f1(.45 + rnd() * .4)}"/>`; }
  // the paper circle; a snowy ground clipped to it
  let paper = `<defs><clipPath id="cc"><circle cx="540" cy="540" r="400"/></clipPath></defs><circle cx="540" cy="540" r="400" fill="${PAPER}"/>`;
  paper += `<g clip-path="url(#cc)"><circle cx="760" cy="330" r="86" fill="${ICE}" opacity=".9"/>`;
  // snow falling on the paper, very light
  for (let i = 0; i < 26; i++) { const x = 160 + rnd() * 760, y = 150 + rnd() * 470; paper += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(3 + rnd() * 3)}" fill="${ICE}"/>`; }
  paper += `<path d="M120 770 Q300 735 540 752 Q780 768 960 738 L960 960 L120 960Z" fill="${SNOW}" stroke="#B9CFE0" stroke-width="5" stroke-linejoin="round"/>`;
  paper += `<path d="M190 800 q40 -10 80 0 M640 790 q50 -12 100 0 M420 815 q30 -8 60 0" fill="none" stroke="#B9CFE0" stroke-width="4" stroke-linecap="round"/></g>`;
  // the game's snowman in the yard, behind Noodle on the left (clipped to the circle like the ground)
  const snowman = `<g clip-path="url(#cc)">${prop('snowman', {}, 78, 470, 330, 330)}</g>`;
  // Noodle in the Knit Winter Sweater and Snowflake Snood, facing right like the Halloween icon
  const noodle = dog('dachs', { pose: 'happy', outfit: OUTFIT }, 322, 282, 590);
  // crayon snowflakes and stars round the circle (inside the circle's crop for a round avatar)
  const deco = flake(300, 300, 34, 8, '#9CC3E4', 5, true) + flake(440, 235, 24, 20, '#9CC3E4', 4.4, true) + flake(560, 160, 22, 0, '#9CC3E4', 4, true)
    + flake(140, 180, 28, 12) + flake(950, 150, 22, 30) + flake(110, 900, 24, 5) + flake(960, 930, 30, 18) + flake(540, 1035, 18, 0) + flake(40, 520, 18, 10) + flake(1040, 520, 18, 25)
    + star(760, 880, 26, 4) + star(330, 880, 18) + star(700, 190, 16);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">\n${bg}${paper}${snowman}${ring}${noodle}${deco}\n</svg>\n`;
}

async function main() {
  const svg = icon();
  fs.writeFileSync(path.join(OUT, 'doodle-doggo-icon-winter.svg'), svg);
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  // 1080: Instagram, Threads, TikTok, X (uploads crop to a circle); 800: YouTube (its recommended size); 512: RedNote; 400: X's own size
  for (const s of [1080, 800, 512, 400]) {
    const page = await browser.newPage({ viewport: { width: s, height: s }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0">${svg.replace('width="1080" height="1080"', `width="${s}" height="${s}"`)}</body></html>`);
    await page.screenshot({ path: path.join(OUT, `doodle-doggo-icon-winter-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
    await page.close();
  }
  // a round-crop check, as the channels show it (not for upload)
  const page = await browser.newPage({ viewport: { width: 520, height: 520 } });
  await page.setContent(`<html><body style="margin:0;background:#fff"><div style="width:500px;height:500px;margin:10px;border-radius:50%;overflow:hidden">${svg.replace('width="1080" height="1080"', 'width="500" height="500"')}</div></body></html>`);
  await page.screenshot({ path: path.join(OUT, 'doodle-doggo-icon-winter-circle-check.png') });
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
