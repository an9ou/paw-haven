// doodledoggo.app v2 art and dog pages: pre-renders the game's own art for the site, so the site needs no art modules at run time.
//   NODE_PATH=$(npm root -g) node tools/site_art.js        (needs Node and Playwright; the outputs are committed)
// Writes site/img/art/:
//   dogs/<key>-<pose>.svg      the 14 dogs, scene poses (walk, jump, sit, happy, sniff), 3 boiling frames (the game's 3 fps flip)
//   dogs/<key>-still.svg       each dog's card pose, one frame (cards, profiles, the reduced-motion scene)
//   dogs/<key>-pup.svg         a puppy of each dog, one frame (profiles)
//   loves/<slug>.svg           the game's item and icon drawings for each dog's favourites
//   ball.svg, momiji.svg, sakura.svg   the playroom toss toy and one leaf / one blossom from the game's Japan art
//   washi.svg                  a washi-paper fibre tile (seeded)
//   playroom.webp              the Shelter Playroom (world C), 2000 x 1200, with the site's own Caveat for its painted sign
//   fuji-<season>.webp         the Mt. Fuji Lookout (world C, Japan scenery on) for each season, 1280 x 768
//   torii.webp                 the Lookout's torii and shrine, cropped
// and fills the dog cards in site/index.html and the profiles in site/dogs.html between the <!-- dogs:... --> markers.
// Profile text: tools/site_dogs.js. Dog art is never changed here: everything is drawn by dogs/ and world/ as the game draws it.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), OUT = path.join(ROOT, 'site', 'img', 'art');
const req = (m) => { for (const r of [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean), module.paths)) { try { return require(path.join(r, m)); } catch (e) { /* next */ } } return require(m); };
const PROFILES = require('./site_dogs');

const ctx = { window: {}, console }; ctx.window.window = ctx.window; vm.createContext(ctx);
for (const f of ['dogs/pawart_dogs.js', 'world/pawart_world_a.js', 'world/pawart_world_b.js', 'world/pawart_world_c.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const PA = ctx.window.PawArt;
const DOGS = PA.DOGS.map((d) => Object.assign({}, d, PROFILES.find((p) => p.key === d.key)));
if (DOGS.length !== 14 || DOGS.some((d) => !d.quote)) throw new Error('every dog needs a profile in tools/site_dogs.js');

const SCENE_POSES = ['walk', 'jump', 'sit', 'happy', 'sniff'];
const FLIP = '<style>.pa-d-f1,.pa-d-f2{opacity:0}.pa-d-f0{animation:b0 1s steps(1,end) infinite}.pa-d-f1{animation:b1 1s steps(1,end) infinite}.pa-d-f2{animation:b2 1s steps(1,end) infinite}'
  + '@keyframes b0{0%{opacity:1}33.333%{opacity:0}100%{opacity:0}}@keyframes b1{0%{opacity:0}33.333%{opacity:1}66.666%{opacity:0}100%{opacity:0}}@keyframes b2{0%{opacity:0}66.666%{opacity:1}100%{opacity:1}}'
  + '.pa-d-tw{transform-box:fill-box;transform-origin:50% 50%}</style>';
const standalone = (svg, w, h, style) => svg.replace(/^<svg(?! xmlns)/, '<svg xmlns="http://www.w3.org/2000/svg"').replace(/^<svg /, `<svg width="${w}" height="${h}" `).replace(/(<svg[^>]*>)/, '$1' + (style || ''));
const write = (rel, s) => { const p = path.join(OUT, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, s); };
const slug = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/^icon:/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

fs.rmSync(OUT, { recursive: true, force: true });
// ---- dogs
for (const d of DOGS) {
  for (const pose of SCENE_POSES) write(`dogs/${d.key}-${pose}.svg`, standalone(PA.dog(d.key, { pose }), 240, 200, FLIP));
  write(`dogs/${d.key}-still.svg`, standalone(PA.dog(d.key, { pose: d.pose, anim: false }), 240, 200));
  write(`dogs/${d.key}-pup.svg`, standalone(PA.dog(d.key, { pose: 'happy', age: 'puppy', facing: 'left', anim: false }), 240, 200));
}
// ---- favourites: the game's item and icon drawings; 'dig' is the marketing posts' dirt mound with a bone
const DIG = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="digging"><ellipse cx="32" cy="54" rx="28" ry="6" fill="#5B3D32" opacity=".16"/><path d="M4 54Q8 24 32 22Q56 24 60 54Z" fill="#B98F68" stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"/><path d="M14 44l8 -2M34 36l8 3M26 48l8 0" stroke="#8A6A48" stroke-width="2.4" stroke-linecap="round"/><g transform="translate(34 16) rotate(-30) scale(.55)"><path d="M-14 -4 Q-20 -10 -14 -12 Q-11 -14 -10 -8 L10 -8 Q11 -14 14 -12 Q20 -10 14 -4 Q20 2 14 4 Q11 6 10 0 L-10 0 Q-11 6 -14 4 Q-20 2 -14 -4Z" fill="#FFF4DF" stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"/></g></svg>';
const loves = new Set(); DOGS.forEach((d) => d.loves.forEach(([n]) => loves.add(n)));
for (const n of loves) write(`loves/${slug(n)}.svg`, n === 'dig' ? DIG : standalone(n.startsWith('icon:') ? PA.icon(n.slice(5)) : PA.item(n), 64, 64));
write('ball.svg', standalone(PA.prop('tosstoy', { kind: 'ball' }), 60, 60));
// ---- one momiji leaf and one sakura blossom, drawn by world C's own functions (momijiAt, skFlowerD)
{
  const src = fs.readFileSync(path.join(ROOT, 'world', 'pawart_world_c.js'), 'utf8');
  const grab = (re) => { const m = src.match(re); if (!m) throw new Error('world C changed: ' + re); return m[0]; };
  const code = [grab(/const R1=n=>[^\n;]*;/), 'const C={ink:"#5B3D32"};', grab(/const MJ_L=[^\n]*\n/), grab(/function momijiAt\([\s\S]*?\n(?=function jpMomiji)/), grab(/function skFlowerD\([^\n]*\n/)].join('\n');
  const jp = new Function(code + '\nreturn {momijiAt, skFlowerD};')();
  let buf = ''; jp.momijiAt({ add: (s) => { buf += s; } }, 16, 16, 12.5, 0, '#E8623A');
  write('momiji.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">${buf}</svg>`);
  write('sakura.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="${jp.skFlowerD(16, 16, 14, 0.3)}" fill="#F9C9D6" stroke="#C97A90" stroke-width="1.2"/><circle cx="16" cy="16" r="2.6" fill="#E0697F"/></svg>`);
}

// ---- washi paper: a tile of soft fibres (seeded, so it is the same every run)
{
  let x = 0x5eed; const r = () => ((x = (x * 1103515245 + 12345) >>> 0) / 4294967296);
  let d = ''; for (let i = 0; i < 70; i++) { const ax = r() * 220, ay = r() * 220, a = r() * Math.PI * 2, L = 8 + r() * 26, bx = ax + Math.cos(a) * L, by = ay + Math.sin(a) * L, cx = (ax + bx) / 2 + (r() - .5) * 10, cy = (ay + by) / 2 + (r() - .5) * 10; d += `M${ax.toFixed(1)} ${ay.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${bx.toFixed(1)} ${by.toFixed(1)}`; }
  let dots = ''; for (let i = 0; i < 40; i++) dots += `<circle cx="${(r() * 220).toFixed(1)}" cy="${(r() * 220).toFixed(1)}" r="${(0.6 + r() * 1.2).toFixed(1)}"/>`;
  write('washi.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><path d="${d}" fill="none" stroke="#C9B48F" stroke-width=".8" stroke-linecap="round" opacity=".45"/><g fill="#D9C7A6" opacity=".5">${dots}</g></svg>`);
}

// ---- the dog cards (home) and profiles (/dogs)
const lovesHTML = (d) => d.loves.map(([n, l]) => `<li><img src="/img/art/loves/${slug(n)}.svg" alt="" width="64" height="64" loading="lazy">${esc(l)}</li>`).join('');
const card = (d) => `<li><a class="dcard" href="/dogs#${d.key}" id="card-${d.key}">
  <img class="dimg" src="/img/art/dogs/${d.key}-still.svg" alt="${esc(d.name)} the ${esc(d.breed)}, a wobbly crayon dog" width="240" height="200" loading="lazy">
  <span class="dname">${esc(d.name)}</span><span class="dtype">the ${esc(d.breed)} <span class="jp" lang="ja">${d.jp}</span></span>
  <span class="dquote">“${esc(d.quote)}”</span><span class="dmore">Full profile <span aria-hidden="true">→</span></span></a></li>`;
const profile = (d) => `<article class="prof" id="${d.key}" aria-labelledby="h-${d.key}">
  <div class="pics"><img class="big" src="/img/art/dogs/${d.key}-still.svg" alt="${esc(d.name)} the ${esc(d.breed)}" width="240" height="200" loading="lazy"><img class="pup" src="/img/art/dogs/${d.key}-pup.svg" alt="A ${esc(d.name)} puppy" width="240" height="200" loading="lazy"><span class="cap">a ${esc(d.name)} puppy</span></div>
  <div class="txt">
    <h2 id="h-${d.key}">${esc(d.name)} <span class="dtype">the ${esc(d.breed)}</span></h2>
    <p class="jpline"><span class="jp" lang="ja">${d.jp}</span> <i>${esc(d.jpRead)}</i> · ${esc(d.name)} in katakana: <span class="jp" lang="ja">${d.nameJp}</span></p>
    <p class="bubble">“${esc(d.quote)}”</p>
    <p><b>Personality:</b> ${esc(d.personality)}.</p>
    <ul class="traits">${d.traits.map(([t, s]) => `<li><b>${esc(t)}</b>${esc(s)}</li>`).join('')}</ul>
    <p class="playline"><b>In the playroom:</b> ${esc(d.play)}</p>
    <div class="loves"><b>Loves</b><ul>${lovesHTML(d)}</ul></div>
    ${d.fun ? `<p class="fun"><span class="tip"><span lang="ja">豆知識</span> <i>mame-chishiki</i>, a fun fact:</span> ${esc(d.fun)}</p>` : ''}
  </div>
</article>`;
const fill = (file, tag, html) => {
  const p = path.join(ROOT, 'site', file), s = fs.readFileSync(p, 'utf8'), re = new RegExp(`(<!-- dogs:${tag} -->)[\\s\\S]*?(<!-- /dogs:${tag} -->)`);
  if (!re.test(s)) throw new Error(`site/${file} has no <!-- dogs:${tag} --> markers`);
  fs.writeFileSync(p, s.replace(re, (m, a, b) => `${a}\n${html}\n${b}`));
};
fill('index.html', 'cards', DOGS.map(card).join('\n'));
fill('dogs.html', 'profiles', DOGS.map(profile).join('\n'));
fill('dogs.html', 'nav', DOGS.map((d) => `<li><a href="#${d.key}"><img src="/img/art/dogs/${d.key}-still.svg" alt="" width="240" height="200">${esc(d.name)}</a></li>`).join('\n'));

// ---- rasters (Playwright): the playroom, the Mt. Fuji Lookout in four seasons, the torii crop
(async () => {
  const { chromium } = req('playwright');
  const browser = await chromium.launch(); const page = await browser.newPage();
  const font = (n) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROOT, 'site', 'fonts', n)).toString('base64');
  const raster = async (svg, w, h, file, q, viewBox) => {
    if (viewBox) svg = svg.replace(/viewBox="[^"]*"/, `viewBox="${viewBox}"`);
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<style>@font-face{font-family:'Caveat';font-weight:500 700;src:url(${font('caveat.woff2')})}body{margin:0}svg{display:block;width:${w}px;height:${h}px}</style>${svg}`);
    await page.evaluate(() => document.fonts.ready);
    const png = await page.screenshot({ type: 'png' });
    const webp = await page.evaluate(async ([b64, q]) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; c.getContext('2d').drawImage(img, 0, 0);
      return c.toDataURL('image/webp', q).split(',')[1];
    }, [png.toString('base64'), q]);
    write(file, Buffer.from(webp, 'base64'));
  };
  await raster(PA.scene('playroom', {}), 2000, 1200, 'playroom.webp', 0.82);
  for (const season of ['spring', 'summer', 'autumn', 'winter']) await raster(PA.scene('fujihill', { season, jp: true }), 1280, 768, `fuji-${season}.webp`, 0.78);
  await raster(PA.scene('fujihill', { season: 'autumn', jp: true }), 720, 600, 'torii.webp', 0.82, '100 268 300 250');
  await browser.close();
  const size = (dir) => fs.readdirSync(dir).reduce((n, f) => { const p = path.join(dir, f); return n + (fs.statSync(p).isDirectory() ? size(p) : fs.statSync(p).size); }, 0);
  console.log('site art:', (size(OUT) / 1e6).toFixed(2), 'MB in site/img/art; cards and profiles filled');
})().catch((e) => { console.error(e); process.exit(1); });
