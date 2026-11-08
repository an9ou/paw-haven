// Doodle Doggo winter profile picture for every channel (Instagram, Threads, X, TikTok, YouTube, RedNote).
//   node brand/winter/make_winter_icon.js [all]      (needs playwright; chromium at /opt/pw-browsers/chromium)
// Same layout as the Halloween icon (brand/instagram/doodle-doggo-instagram-halloween.svg): a night background,
// the paper circle with its pencil ring (taken from that file), Noodle the dachshund in the game's own winter outfits,
// and the game's Christmas art (Winter Market) as a softened background. Noodle is the main character, in front, lifted by a glow. Everything important sits inside the circle, so every round crop keeps it.
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..', '..'), OUT = __dirname;
const win = {}, ctx = { window: win, console }; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const PA = win.PawArt;
const inner = (svg) => svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
const f1 = (n) => Math.round(n * 10) / 10;
function seeded(seed) { let a = seed >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const INK = '#3B2A33', NIGHT = '#2C4468', SNOW = '#FFFFFF', PAPER = '#FFF8EC', ICE = '#DCEBF7';
const OUTFIT = { head: 'Reindeer Antlers', neck: 'Snowflake Snood', body: 'Knit Winter Sweater' };

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
// a crayon bauble hanging on a string from the top of the ring
function bauble(x, len, r, col, rot = 0) {
  const top = 540 - Math.sqrt(400 * 400 - (x - 540) * (x - 540)) + 6, y = top + len;
  return `<g transform="rotate(${rot} ${x} ${f1(top)})"><path d="M${x} ${f1(top)}Q${x + 4} ${f1(top + len / 2)} ${x} ${f1(y - r - 8)}" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
    + `<rect x="${x - r * .32}" y="${f1(y - r - 9)}" width="${f1(r * .64)}" height="11" rx="3" fill="#F2C14E" stroke="${INK}" stroke-width="3.2"/>`
    + `<circle cx="${x}" cy="${f1(y)}" r="${r}" fill="${col}" stroke="${INK}" stroke-width="4.4"/>`
    + `<path d="M${f1(x - r * .55)} ${f1(y - r * .2)}Q${f1(x - r * .45)} ${f1(y - r * .6)} ${f1(x - r * .05)} ${f1(y - r * .66)}" fill="none" stroke="#fff" stroke-width="${f1(r * .16)}" stroke-linecap="round" opacity=".75"/>`
    + `<path d="M${f1(x - r * .9)} ${f1(y + r * .12)}Q${x} ${f1(y + r * .4)} ${f1(x + r * .9)} ${f1(y + r * .12)}" fill="none" stroke="#FFF1D6" stroke-width="3" stroke-linecap="round" opacity=".8"/></g>`;
}
// a holly sprig: two leaves and three berries
const holly = (x, y, s, rot) => `<g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})"><path d="M0 0 Q-14 -10 -30 -6 Q-26 -2 -28 4 Q-20 2 -16 8 Q-8 2 0 0Z" fill="#3F8F3A" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/><path d="M0 0 Q14 -10 30 -6 Q26 -2 28 4 Q20 2 16 8 Q8 2 0 0Z" fill="#3F8F3A" stroke="${INK}" stroke-width="3.4" stroke-linejoin="round"/><circle cx="-5" cy="-4" r="6" fill="#D7263D" stroke="${INK}" stroke-width="3"/><circle cx="5" cy="-4" r="6" fill="#D7263D" stroke="${INK}" stroke-width="3"/><circle cx="0" cy="-12" r="6" fill="#D7263D" stroke="${INK}" stroke-width="3"/></g>`;
const star = (x, y, r, sw = 3) => `<path d="M${x} ${y - r}Q${x + r * .15} ${y - r * .15} ${x + r} ${y}Q${x + r * .15} ${y + r * .15} ${x} ${y + r}Q${x - r * .15} ${y + r * .15} ${x - r} ${y}Q${x - r * .15} ${y - r * .15} ${x} ${y - r}Z" fill="#FFE8B0" stroke="${INK}" stroke-width="${sw}" stroke-linejoin="round"/>`;

function icon() {
  const rnd = seeded(2026);
  let bg = `<rect width="1080" height="1080" fill="${NIGHT}"/>`;
  // falling snow on the night: soft dots outside the circle
  for (let i = 0; i < 120; i++) { const x = rnd() * 1080, y = rnd() * 1080, r = 2 + rnd() * 3.4; if (Math.hypot(x - 540, y - 540) < 412) continue; bg += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${SNOW}" opacity="${f1(.45 + rnd() * .4)}"/>`; }
  // the paper circle; a snowy ground clipped to it
  let paper = `<defs><clipPath id="cc"><circle cx="540" cy="540" r="400"/></clipPath></defs><circle cx="540" cy="540" r="400" fill="${PAPER}"/>`;
  paper += `<g clip-path="url(#cc)">`;
  // snow falling on the paper, very light
  for (let i = 0; i < 26; i++) { const x = 160 + rnd() * 760, y = 150 + rnd() * 420; paper += `<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(3 + rnd() * 3)}" fill="${ICE}"/>`; }
  paper += `<path d="M120 715 Q300 680 540 697 Q780 713 960 683 L960 960 L120 960Z" fill="${SNOW}" stroke="#B9CFE0" stroke-width="5" stroke-linejoin="round"/>`;
  paper += `<path d="M200 760 q40 -10 80 0 M640 750 q50 -12 100 0 M420 790 q30 -8 60 0 M560 850 q40 -10 80 0" fill="none" stroke="#B9CFE0" stroke-width="4" stroke-linecap="round"/></g>`;
  // THE BACKGROUND: the game's Christmas art (Felt Fir Trees, Present Piles, Candy-Cane Fairy Lights) and crayon baubles,
  // softened (a light blur and a paper wash) so it reads as a background and Noodle stands out in front of it
  const back = `<defs><filter id="soft" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.6"/></filter>`
    + `<radialGradient id="halo"><stop offset="0" stop-color="#FFFFFF" stop-opacity=".9"/><stop offset=".55" stop-color="#FFFFFF" stop-opacity=".6"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/></radialGradient></defs>`
    + `<g clip-path="url(#cc)"><g filter="url(#soft)">`
    + prop('wmcanelights', {}, 200, 196, 680, 181)
    + bauble(290, 62, 22, '#D7263D', 3) + bauble(400, 96, 19, '#F2C14E', -2) + bauble(690, 104, 19, '#3F8F3A', 2) + bauble(800, 62, 22, '#4A7FC1', -3)
    + prop('wmfirtree', {}, 726, 330, 236, 337)
    + prop('wmfirtree', {}, 104, 300, 272, 389)
    + prop('wmpresents', {}, 262, 600, 160, 120) + prop('wmpresents', {}, 640, 604, 150, 112)
    + `</g><rect x="140" y="140" width="800" height="800" fill="${PAPER}" opacity=".42"/>`
    // the glow behind Noodle that lifts him off the background
    + `<ellipse cx="540" cy="600" rx="340" ry="150" fill="url(#halo)"/></g>`;
  const top = holly(540, 148, 1.25, 0);
  // Noodle, the main character, in front: full colour, the Reindeer Antlers, Knit Winter Sweater and Snowflake Snood, facing right
  const noodle = dog('dachs', { pose: 'happy', outfit: OUTFIT }, 236, 270, 596);
  // crayon snowflakes on the night, outside the circle
  const deco = flake(140, 180, 28, 12) + flake(950, 150, 22, 30) + flake(110, 900, 24, 5) + flake(960, 930, 30, 18) + flake(540, 1035, 18, 0) + flake(40, 520, 18, 10) + flake(1040, 520, 18, 25);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1080" width="1080" height="1080">\n${bg}${paper}${back}${ring}${top}${noodle}${deco}\n</svg>\n`;
}

async function main() {
  const svg = icon();
  fs.writeFileSync(path.join(OUT, 'doodle-doggo-icon-winter.svg'), svg);
  const { chromium } = require('playwright');
  const browser = await chromium.launch();
  // 1080: Instagram, Threads, TikTok, X (uploads crop to a circle). With 'all' also 800: YouTube; 512: RedNote; 400: X's own size,
  // and a round-crop check (owner, 8 Nov: one picture per request while the design is being worked on)
  const ALL = process.argv[2] === 'all';
  for (const s of ALL ? [1080, 800, 512, 400] : [1080]) {
    const page = await browser.newPage({ viewport: { width: s, height: s }, deviceScaleFactor: 1 });
    await page.setContent(`<html><body style="margin:0">${svg.replace('width="1080" height="1080"', `width="${s}" height="${s}"`)}</body></html>`);
    await page.screenshot({ path: path.join(OUT, `doodle-doggo-icon-winter-${s}.png`), clip: { x: 0, y: 0, width: s, height: s } });
    await page.close();
  }
  if (!ALL) return browser.close();
  // a round-crop check, as the channels show it (not for upload)
  const page = await browser.newPage({ viewport: { width: 520, height: 520 } });
  await page.setContent(`<html><body style="margin:0;background:#fff"><div style="width:500px;height:500px;margin:10px;border-radius:50%;overflow:hidden">${svg.replace('width="1080" height="1080"', 'width="500" height="500"')}</div></body></html>`);
  await page.screenshot({ path: path.join(OUT, 'doodle-doggo-icon-winter-circle-check.png') });
  await browser.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
