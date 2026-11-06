// v2.19 "Friends first": the "add a friend in 3 steps" carousel (owner's go-ahead 2 Nov 2026; plan docs/marketing/V219_FRIENDS_FIRST.md).
// 8 slides, 1080 x 1350, on the sketchbook paper, with the REAL Friends screens (capture_friends.js stills) and our friend card drawn from the game's
// own card art and QR on the last slide. Every text in a box is ink-centred (centre_text.js) and checked on every slide.
//
//   NODE_PATH=$(npm root -g) node brand/instagram/launch/friends_reel/build_carousel.js <game checkout> <footage dir> <outdir>
// Without the real code (layout.json placeholder) slides 4 and 8 carry a red "placeholder" patch: a preview for the owner, never posted.
const path = require('path'), fs = require('fs'), vm = require('vm');
const { chromium } = require('playwright');
const { CENTRE_JS, SAFE_JS } = require('../centre_text.js'); // SAFE_JS for apartCheck() (owner, 6 Nov 2026: dogs never overlap or touch)
const { loadArt, cardSVG, FIT_JS, apartRects } = require('./friends_card.js');
const DEV = path.resolve(process.argv[2] || '.'), FOOT = path.resolve(process.argv[3] || 'friends_footage');
const OUT = path.resolve(process.argv[4] || 'friends_carousel'); fs.mkdirSync(OUT, { recursive: true });
const W = 1080, H = 1350, fam = 'Caveat';
const LAY = JSON.parse(fs.readFileSync(path.join(FOOT, 'layout.json'), 'utf8')), PH = LAY.placeholder;

// our card as the v2.19 game draws it (friends_card.js: the code in DD Code, the QR of our invite link)
const ART = loadArt(DEV);
const dcSrc = fs.readFileSync(path.join(DEV, 'game', 'src', '40_dogcards.js'), 'utf8');
const words = (k) => JSON.parse(dcSrc.match(new RegExp('const ' + k + ' = (\\[[\\s\\S]*?\\]);'))[1].replace(/'/g, '"'));
const OUR_NAME = words('DC_WORDS_A')[LAY.name[0]] + ' ' + words('DC_WORDS_B')[LAY.name[1]];
const CARD = cardSVG(ART, { code: PH ? '' : LAY.code, name: OUR_NAME, nameFont: 'Caveat' });
const shot = (n) => 'file://' + path.join(FOOT, n + '.png'); // 1179 x 1977 (393 x 659 CSS px at DPR 3)
const clipIdx = (n, t) => { const ts = JSON.parse(fs.readFileSync(path.join(FOOT, n, 'ts.json'), 'utf8')); let i = 0; while (i + 1 < ts.length && ts[i + 1] <= t) i++; return i; };
const clipAt = (n, t) => 'file://' + path.join(FOOT, n, String(clipIdx(n, t)).padStart(5, '0') + '.jpg');
// each dog's drawn box in a still or a clip frame (capture_friends.js), for apartCheck() on the slide
const BOXES = new Map();
const boxesOf = (src) => BOXES.get(src) || [];
const shotB = (n) => { const s = shot(n); BOXES.set(s, JSON.parse(fs.readFileSync(path.join(FOOT, n + '.boxes.json'), 'utf8'))); return s; };
const clipB = (n, t) => { const s = clipAt(n, t); BOXES.set(s, JSON.parse(fs.readFileSync(path.join(FOOT, n, 'boxes.json'), 'utf8'))[clipIdx(n, t)]); return s; };

const PEN = '#5B3D32', PINK = '#F28FA5', PAPER = '#FFF8EC', SOFT = '#8A7468', YEL = '#FFE3A1', GREEN = '#4E9A54';
const N = 8;
// a phone window: a crop of a screen shot (CSS px: x, y, w, h), drawn at (X, Y) with width WW, in a rounded frame with the pen line
const win_ = (id, src, c, X, Y, WW, rot) => { const k = WW / c.w, HH = c.h * k;
  return `<g transform="rotate(${rot || 0} ${X + WW / 2} ${Y + HH / 2})"><clipPath id="${id}"><rect x="${X}" y="${Y}" width="${WW}" height="${HH}" rx="34"/></clipPath>
  <rect x="${X + 10}" y="${Y + 14}" width="${WW}" height="${HH}" rx="34" fill="${PEN}" opacity=".12"/>
  <g clip-path="url(#${id})"><image href="${src}" x="${X - c.x * k}" y="${Y - c.y * k}" width="${393 * k}" height="${659 * k}"/></g>
  <rect x="${X}" y="${Y}" width="${WW}" height="${HH}" rx="34" fill="none" stroke="${PEN}" stroke-width="6"/></g>
  ${apartRects(boxesOf(src), (x, y) => [X + (x - c.x) * k, Y + (y - c.y) * k], [c.x, c.y, c.x + c.w, c.y + c.h])}`; };
// (the dogs' rects for apartCheck sit outside the window's small tilt: a rotation keeps the distances between the dogs, but the tilted rects'
// bounding boxes would grow by a few px each and read as closer than they are)

const html = `<!doctype html><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=swap" rel="stylesheet">
<style>${ART.css}html,body{margin:0;background:#fff}svg{display:block}</style>
<svg id="sv" xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg>
<script>
${CENTRE_JS}
${SAFE_JS}
${FIT_JS}
const FAM=${JSON.stringify(fam)}, C=(lines,cx,cy)=>centred(lines,cx,cy,FAM);
const box=(x,y,w,h,lines,o)=>{ o=o||{}; return '<g data-box><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="'+(o.rx||36)+'" fill="'+(o.fill||'#FFFDF7')+'" stroke="'+(o.stroke||'${PEN}')+'" stroke-width="'+(o.sw||6)+'"/>'+C(lines,x+w/2,y+h/2).svg+'</g>'; };
const bub=(cx,cy,r,s,size,fill)=>'<g data-box><circle cx="'+cx+'" cy="'+cy+'" r="'+r+'" fill="'+(fill||'${YEL}')+'" stroke="${PEN}" stroke-width="6"/>'+C([{s,size}],cx,cy).svg+'</g>';
const page=(i)=>'<rect width="${W}" height="${H}" fill="${PAPER}"/>'+[...Array(14)].map((_,k)=>'<path d="M60 '+(110+k*90)+' H1020" stroke="#E9DCC8" stroke-width="2" opacity=".5"/>').join('')
  +C([{s:'@doodledoggo.app',size:34,fill:'${SOFT}'}],170,1300).svg+C([{s:(i+1)+'/${N}',size:38,fill:'${SOFT}'}],990,1300).svg;
window.slide=function(svg){ const sv=document.getElementById('sv'); sv.innerHTML=svg; frFit(sv); return centreCheck(sv).concat(apartCheck(sv).map((x)=>'dogs too close: '+x)); };
</script>`;

const PHPATCH = (X, Y, k, c) => { // the placeholder patch over the QR and the code line of our card in a screen shot (card rect in CSS px)
  if (!PH) return ''; const R = LAY.card, px = (x) => X + (R.x + x / 300 * R.w - c.x) * k, py = (y) => Y + (R.y + y / 200 * R.h - c.y) * k;
  return `<rect x="${px(28)}" y="${py(36)}" width="${px(156) - px(28)}" height="${py(162) - py(36)}" fill="#FFFDF7"/><rect x="${px(160)}" y="${py(112)}" width="${px(284) - px(160)}" height="${py(146) - py(112)}" fill="#FFFDF7"/>`
    + `\${'<g transform="rotate(-6 ${(px(28) + px(284)) / 2} ${py(100)})">'+pill('placeholder: our real code on 7 Nov',${(px(28) + px(284)) / 2},${py(100)},34,FAM,{fill:'#FFE0E0',stroke:'#C0392B',color:'#C0392B',padX:18})+'</g>'}`; };

// the slides: each a JS template string evaluated in the page (so it can call box(), C(), pill() with the page's ink measures)
const head = (n, title, sub, y) => `\${bub(150,${y + 75},64,'${n}.',90)+box(230,${y},760,150,[{s:${JSON.stringify(title)},size:84}],{sw:7})}`
  + (sub ? `\${C(${JSON.stringify(sub.map((s) => ({ s, size: 50, fill: SOFT, pitch: 60 })))},540,${y + 250}).svg}` : '');
const S = [];
// 1 cover
// (not the Friends badge: one of its two dogs is white, and no black or white dog is the subject of a post, owner 1 Nov 2026)
S.push(`\${page(0)}${win_('w1', shotB('visit'), { x: 20, y: 290, w: 350, h: 250 }, 170, 385, 740, -2)}
\${'<g transform="rotate(-2 540 230)">'+box(80,110,920,260,[{s:'add a friend',size:120,pitch:118},{s:'in 3 steps',size:120}],{sw:8})+'</g>'}
\${C([{s:'your dog visits theirs.',size:66,pitch:78},{s:'no chat, no messages.',size:66}],540,1035).svg}
\${pill('new in Doodle Doggo',540,1170,54,FAM,{fill:'${YEL}'})}`);
// 2 the stake: the visit
S.push(`\${page(1)}\${box(90,80,900,150,[{s:"visit a friend's yard",size:84}],{sw:7})}
\${C([{s:'pet their dogs, leave a paw print.',size:52,fill:'${SOFT}'}],540,290).svg}
${win_('w2', clipB('visit', 2.4), { x: 0, y: 140, w: 393, h: 400 }, 110, 345, 860, -1)}`);
// 3 step 1: the More tray with Friends, then the name wheels
S.push(`\${page(2)}${head(1, 'pick your friend name', ['tap More, then Friends.', 'turn the two wheels, like ' + OUR_NAME + '.'], 80)}
${win_('w3a', shotB('more_tray'), { x: 170, y: 440, w: 223, h: 219 }, 70, 520, 400, -3)}
${win_('w3b', shot('name_pick'), { x: 0, y: 60, w: 393, h: 420 }, 500, 440, 520, 2)}
<path d="M300 960 Q 380 1060 490 1010" fill="none" stroke="${PINK}" stroke-width="10" stroke-linecap="round"/><path d="M462 990 l30 20 l-34 12" fill="none" stroke="${PINK}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>`);
// 4 step 2 (GM briefing 2 Nov 2026: the Share poster button; the window shows the three buttons under the card)
S.push(`\${page(3)}${head(2, 'share your code', ['Share invite, Share poster, Copy code,', 'or let them scan your QR.'], 80)}
${win_('w4', shot('card'), { x: 0, y: 12, w: 393, h: 362 }, 140, 430, 800, -1)}${PHPATCH(140, 430, 800 / 393, { x: 0, y: 12 })}`);
// 5 step 3
S.push(`\${page(4)}${head(3, 'add theirs', ['type their DOG- code,', 'or open their invite link.'], 80)}
${win_('w5', shot('friends_list'), { x: 0, y: 190, w: 393, h: 330 }, 140, 450, 800, 1)}`);
// 6 then, every day
const tile = (id, n, cx, cy, label, c) => win_(id, shotB(n), c, cx - 210, cy - 200, 420, 0) + `\${pill(${JSON.stringify(label)},${cx},${cy + 225},46,FAM,{fill:'#FFFDF7',padX:22})}`;
S.push(`\${page(5)}\${box(90,60,900,140,[{s:'then, once a day:',size:84}],{sw:7})}
${tile('t1', 'visit', 290, 470, 'pet their dogs', { x: 20, y: 300, w: 260, h: 248 })}${tile('t2', 'notes', 790, 470, 'leave a paw print', { x: 0, y: 40, w: 300, h: 285 })}
${tile('t3', 'gift_letter', 290, 975, 'send a gift', { x: 0, y: 0, w: 393, h: 373 })}${tile('t4', 'walk', 790, 975, 'walk their dog', { x: 0, y: 215, w: 230, h: 219 })}`);
// 7 recap
S.push(`\${page(6)}\${box(90,70,900,150,[{s:'3 steps, 1 minute',size:84}],{sw:7})}
\${box(110,290,860,800,[{s:'1. More, then Friends: pick a name',size:54,pitch:96},{s:'2. share your code or QR',size:54,pitch:96},{s:'3. add theirs: code or link',size:54,pitch:120},
  {s:'then visit, pet, leave a paw print,',size:50,fill:'${SOFT}',pitch:66},{s:'send a gift, walk their dog',size:50,fill:'${SOFT}',pitch:110},{s:'no chat. no messages. remove or block any time.',size:44,fill:'${GREEN}'}],{fill:'#FFFDF7',sw:6})}`);
// 8 CTA: our card
S.push(`\${page(7)}\${'<g transform="rotate(-2 540 170)">'+C([{s:'add us!',size:150}],540,170).svg+'</g>'}<path d="M330 250 Q540 230 750 250" fill="none" stroke="${PINK}" stroke-width="14" stroke-linecap="round" opacity=".6"/>
<g transform="translate(540 640) scale(2.8) rotate(-2) translate(-150 -100)">${CARD}</g>
${PH ? `\${'<g transform="rotate(-6 540 660)">'+pill('placeholder: our real code on 7 Nov',540,660,46,FAM,{fill:'#FFE0E0',stroke:'#C0392B',color:'#C0392B',padX:24})+'</g>'}` : ''}
\${box(110,990,860,190,[{s:'then drop your friend code',size:70,pitch:80},{s:'in the comments',size:70}],{fill:'${YEL}',sw:6})}`);

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  fs.writeFileSync(path.join(OUT, 'page.html'), html); await p.goto('file://' + path.join(OUT, 'page.html')); await p.waitForLoadState('networkidle'); await p.evaluate(() => Promise.all(['600 40px Caveat', '700 40px Caveat', '700 40px "DD Code"'].map((f) => document.fonts.load(f)))); await p.evaluate(() => document.fonts.ready);
  for (let i = 0; i < S.length; i++) {
    const off = await p.evaluate((src) => window.slide(eval('`' + src + '`')), S[i]);
    if (off.length) throw new Error('slide ' + (i + 1) + ': ' + off.join('; '));
    await p.evaluate(() => Promise.all([...document.querySelectorAll('image')].map((im) => new Promise((r) => { const x = new Image(); x.onload = r; x.onerror = r; x.src = im.getAttribute('href'); }))));
    await p.waitForTimeout(150);
    const f = path.join(OUT, `friends-carousel-${i + 1}.jpg`); await p.screenshot({ path: f, type: 'jpeg', quality: 95 }); console.log('wrote', f);
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
