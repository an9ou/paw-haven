// Profile pictures (PNG), story highlight covers and the profile grid mockup.
const fs = require('fs'), path = require('path');
module.exports = async function ({ render, helpers: h, what }) {
  const { f1, doodle, txt, lines, box, line, prop, swash, paper, defs, svgPage, PA, inner, INK, PINK, PAPER, MUTED, ORANGE, PLUM, OUT, DOT } = h;
  const igDir = path.join(OUT, '..');
  const file = (n) => 'file://' + path.join(OUT, n);

  // ---------- profile pictures: bio.md names them -1080.png, so export the three svgs ----------
  if (what === 'profile' || what === 'all') {
    for (const n of ['doodle-doggo-instagram-halloween', 'doodle-doggo-instagram-dachshund', 'doodle-doggo-instagram']) {
      await render(fs.readFileSync(path.join(igDir, n + '.svg'), 'utf8'), 1080, 1080, n + '-1080.png', 'png');
      fs.renameSync(path.join(OUT, n + '-1080.png'), path.join(igDir, n + '-1080.png'));
    }
  }

  // ---------- highlight covers: 1080 x 1920, the icon sits in the centre circle ----------
  const HW = 1080, HH = 1920, CY = 960;
  const cover = (art, tint) => svgPage(HW, HH, paper(HW, HH) + `<circle cx="540" cy="${CY}" r="400" fill="${tint}" opacity=".55"/>` + box(140, CY - 400, 800, 800, 400, 61, 5, 8) + art + doodle('spark', 840, CY - 330, 2.2) + doodle('heart', 230, CY + 330, 1.8, -12));
  const headVB = '2 6 96 96', headSvg = (key, x, y, s) => `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="${headVB}" overflow="visible">${inner(PA.dogHead(key))}</svg>`;
  const fuji = (cx, cy) => { const p = [[cx - 300, cy + 170], [cx - 120, cy - 100], [cx - 60, cy - 160], [cx + 60, cy - 160], [cx + 120, cy - 100], [cx + 300, cy + 170]]; return `<path d="M${p.map((q) => q.join(' ')).join('L')}Z" fill="#E9A0A0"/><path d="M${cx - 120} ${cy - 100}L${cx - 60} ${cy - 160}L${cx + 60} ${cy - 160}L${cx + 120} ${cy - 100}L${cx + 70} ${cy - 70}L${cx + 30} ${cy - 105}L${cx - 20} ${cy - 66}L${cx - 70} ${cy - 100}Z" fill="#FFF5F3"/>` + line(p, 7, 3, 9) + line([[cx - 120, cy - 100], [cx - 70, cy - 100], [cx - 20, cy - 66], [cx + 30, cy - 105], [cx + 70, cy - 70], [cx + 120, cy - 100]], 8, 2, 6) + `<ellipse cx="${cx}" cy="${cy + 175}" rx="330" ry="26" fill="#C9CF9A" stroke="${INK}" stroke-width="6"/>`; };
  const covers = [
    ['highlight-1-meet.png', cover(headSvg('dachs', 340, CY - 200, 400) + swash(540, CY + 230, 520, 80, -3, PINK, 0.5), '#F9D0D9')],
    ['highlight-2-play.png', cover(`<g transform="translate(540 ${CY + 10}) scale(15)">${doodle('paw', 0, 0, 1, 0, 1).replace(/^<g[^>]*>/, '<g>')}</g>`, '#E0D5F0')],
    ['highlight-3-fuji.png', cover(fuji(540, CY - 10), '#FFE3A1')],
    ['highlight-4-events.png', cover(prop('jackolantern', { lit: true }, 340, CY - 200, 400, 400) + doodle('leaf', 250, CY - 200, 3, 20, 1.2) + doodle('leaf', 830, CY + 160, 3, -30, 1.2), '#F6C99A')],
  ];
  if (what === 'covers' || what === 'all') for (const [n, s] of covers) await render(s, HW, HH, n, 'png');

  // ---------- the profile grid mockup (both versions side by side) ----------
  if (what === 'grid' || what === 'all') {
    const PW = 780, GAP = 4, CW = (PW - 2 * GAP) / 3, CH = CW * 4 / 3; // grid cells are 3:4
    const SANS = 'Inter, Arial, sans-serif';
    const cellImg = (img, x, y) => `<svg x="${x}" y="${y}" width="${CW}" height="${CH}" viewBox="0 0 ${CW} ${CH}"><image href="${file(img)}" width="${CW}" height="${CH}" preserveAspectRatio="xMidYMid slice"/></svg>`;
    const placeholder = (x, y, label) => `<rect x="${x + 2}" y="${y + 2}" width="${CW - 4}" height="104" rx="6" fill="#F4F1EC" stroke="#CFC6B8" stroke-width="2" stroke-dasharray="8 8"/>` + txt(label, x + CW / 2, y + 62, 30, { fill: '#9C8E80', w: 600 });
    const pin = (x, y) => `<g transform="translate(${x} ${y})"><circle r="15" fill="#000" opacity=".55"/><path d="M-5 -8H5L4 -1L8 3H1V9H-1V3H-8L-4 -1Z" fill="#fff"/></g>`;
    const panel = (ox, title, sub, cells, pinned, row2) => {
      let g = `<g transform="translate(${ox} 150)"><rect width="${PW}" height="1180" rx="36" fill="#fff" stroke="#DDD5CA" stroke-width="3"/>`;
      g += txt(title, PW / 2, -60, 62, { w: 700 }) + txt(sub, PW / 2, -18, 38, { fill: MUTED, w: 600 });
      // header
      g += `<svg x="36" y="40" width="150" height="150"><defs><clipPath id="av"><circle cx="75" cy="75" r="75"/></clipPath></defs><image href="${file('../doodle-doggo-instagram-halloween-1080.png')}" width="150" height="150" clip-path="url(#av)"/><circle cx="75" cy="75" r="74" fill="none" stroke="#E5DDD2" stroke-width="2"/></svg>`;
      const stat = (x, n, l) => `<text x="${x}" y="108" font-family="${SANS}" font-weight="700" font-size="34" text-anchor="middle" fill="#222">${n}</text><text x="${x}" y="142" font-family="${SANS}" font-size="24" text-anchor="middle" fill="#444">${l}</text>`;
      g += stat(330, '3', 'posts') + stat(500, '0', 'followers') + stat(670, '0', 'following');
      g += `<text x="36" y="236" font-family="${SANS}" font-weight="700" font-size="27" fill="#222">Doodle Doggo 🐾 Cozy Dog Game</text>`;
      ['🖍️ Adopt a wobbly crayon pup to love', '🐶 Walks, cuddles, gardens &amp; puppy playdates', '🎮 Free · play in your browser 👇'].forEach((t, i) => { g += `<text x="36" y="${276 + i * 36}" font-family="${SANS}" font-size="25" fill="#222">${t}</text>`; });
      g += `<text x="36" y="394" font-family="${SANS}" font-weight="600" font-size="25" fill="#00376B">an9ou.github.io/paw-haven</text>`;
      g += `<rect x="36" y="420" width="${(PW - 96) / 2}" height="52" rx="12" fill="#EFEFEF"/><text x="${36 + (PW - 96) / 4}" y="455" font-family="${SANS}" font-weight="700" font-size="24" text-anchor="middle" fill="#222">Follow</text><rect x="${48 + (PW - 96) / 2}" y="420" width="${(PW - 96) / 2}" height="52" rx="12" fill="#EFEFEF"/><text x="${48 + (PW - 96) * 3 / 4}" y="455" font-family="${SANS}" font-weight="700" font-size="24" text-anchor="middle" fill="#222">Message</text>`;
      // highlights
      ['highlight-1-meet', 'highlight-2-play', 'highlight-3-fuji', 'highlight-4-events'].forEach((n, i) => {
        const x = 36 + i * 180, lab = ['Meet', 'Play', 'Fuji', 'Events'][i];
        const k = 130 / 1080 * 1.0; g += `<svg x="${x}" y="500" width="130" height="130"><defs><clipPath id="hc${i}"><circle cx="65" cy="65" r="62"/></clipPath></defs><g clip-path="url(#hc${i})"><image href="${file(n + '.png')}" x="0" y="${f1(-420 * k)}" width="130" height="${f1(1920 * k)}"/></g><circle cx="65" cy="65" r="62" fill="none" stroke="#DBDBDB" stroke-width="2"/></svg><text x="${x + 65}" y="660" font-family="${SANS}" font-size="22" text-anchor="middle" fill="#222">${lab}</text>`;
      });
      g += `<line x1="0" y1="690" x2="${PW}" y2="690" stroke="#DBDBDB" stroke-width="2"/>`;
      const gy = 700; // grid starts here: three columns, the cells are 3:4 crops
      cells.forEach((c, i) => { const x = i * (CW + GAP), y = gy; g += cellImg(c, x, y) + (pinned ? pin(x + CW - 24, y + 26) : ''); });
      for (let i = 0; i < 3; i++) g += placeholder(i * (CW + GAP), gy + CH + GAP, row2);
      return g + '</g>';
    };
    const body = `<rect width="1700" height="1400" fill="#F5EFE6"/><rect width="1700" height="1400" fill="url(#dd-dots)"/>`
      + panel(50, 'A · The 3-tile banner', 'row 1 is pinned, so new posts always start below it', ['banner-1-left-newest.jpg', 'banner-2-middle.jpg', 'banner-3-right-post-first.jpg'], true, 'next posts')
      + panel(870, 'B · Three separate posts', 'each one stands alone (newest on the left)', ['post3-play-free-halloween.jpg', 'post2-pencil-town-fuji.jpg', 'post1-meet-noodle.jpg'], false, 'next posts')
      + txt('mockup: how the profile could look (follower numbers are placeholders)', 850, 1372, 36, { fill: MUTED, w: 600 });
    await render(svgPage(1700, 1400, body), 1700, 1400, 'grid-preview.jpg');
  }
};
