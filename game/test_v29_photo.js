// v29_photo (V29.md section 2, lane PHOTO): the camera button, photo mode, the postcard frame, the choices, Save (share / download / hold to save), the mission, the journal count, Gerald once.
// node game/run_tests.js v29_photo
const { run } = require('./test_lib');

// the PNG header: width and height (bytes 16-23), after the 8 byte signature
const pngSize = (buf) => (buf.length > 24 && buf.slice(1, 4).toString() === 'PNG' ? { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) } : null);
const readStream = async (dl) => { const rs = await dl.createReadStream(); const parts = []; for await (const c of rs) parts.push(c); return Buffer.concat(parts); };

run('v29_photo', async (t) => {
  const { ok, sec, ev, S } = t; let s0;
  sec('the camera is hidden on the title');
  const p = await t.boot({ prefs: { msTest: true } }); // msTest: missions only move on request under the harness
  ok(await ev(() => document.getElementById('phBtn').hidden), 'title: the camera button is hidden');
  await t.adopt({ sex: 'girl' });
  await t.patch({ bond: { level: 7, pts: 1450 }, coins: 500, stats: { hunger: 80, happy: 80, energy: 90, clean: 90 } });
  await t.calm();
  const API = () => ev(() => !!(window.__paw && window.__paw.ph));
  ok(await t.until(() => !!(window.__paw && window.__paw.ph), null, 5000) && await API(), 'the test hook exists');

  sec('the camera button: next to the sound button, only where it belongs');
  ok(await ev(() => { const m = document.getElementById('muteBtn'), c = document.getElementById('phBtn'); return !c.hidden && m.nextElementSibling === c && !!c.querySelector('svg'); }), 'yard: the camera button sits right after #muteBtn and has an icon');
  ok(await ev(() => /camera|photo/i.test(document.getElementById('phBtn').getAttribute('aria-label'))), 'the camera button has a label');
  const hb = await ev(() => { const r = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return [b.left, b.right, b.top, b.bottom]; }; return { m: r('muteBtn'), c: r('phBtn'), g: r('gearBtn') }; });
  ok(hb.c[0] >= hb.m[1] - 0.5 && hb.c[1] <= hb.g[0] + 0.5 && Math.abs(hb.c[2] - hb.m[2]) < 4, `on screen the camera sits straight after the sound button, before the gear (mute ${hb.m.map(Math.round)}, camera ${hb.c.map(Math.round)}, gear ${hb.g.map(Math.round)})`);
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal');
  ok(await ev(() => document.getElementById('phBtn').hidden), 'a modal is open: the camera button is hidden');
  ok(!(await ev(() => window.__paw.ph.open())), 'a modal is open: photo mode will not open');
  await t.closeX(); await t.modalGone();
  ok(await ev(() => !document.getElementById('phBtn').hidden), 'modal closed: the camera button is back');
  await p.click('[data-act=map]'); await p.waitForSelector('[data-area=park]');
  ok(await ev(() => document.getElementById('phBtn').hidden), 'the map: hidden');
  await p.keyboard.press('Escape'); await t.untilMode('yard');
  await ev(() => window.__paw.go('walk', 'park')); await t.untilMode('walk');
  ok(await ev(() => !window.__paw.ph.can() && getComputedStyle(document.getElementById('phBtn')).display === 'none'), 'a walk: hidden');
  ok(!(await ev(() => window.__paw.ph.open())), 'a walk: photo mode will not open');
  await t.home();
  ok(await ev(() => !document.getElementById('phBtn').hidden), 'back in the yard: visible');

  sec('photo mode in the yard: the frame');
  s0 = await S();
  const name = s0.dog.name;
  await p.click('#phBtn');
  ok(await t.until(() => window.__paw.ph.ready(), null, 15000), 'the picture and the PNG are ready');
  ok(await ev(() => window.__paw.ph.active() && !!document.getElementById('phMode') && !document.getElementById('phMode').hidden), 'photo mode is open');
  ok(await ev(() => ['hud', 'bar', 'dock'].every((id) => getComputedStyle(document.getElementById(id)).visibility === 'hidden')), 'the HUD, the bar and the trays are hidden');
  ok(await ev(() => document.getElementById('phBtn').hidden), 'the camera button hides while photo mode is open');
  let svg = await ev(() => window.__paw.ph.svg());
  ok(svg.includes('>Home<') || /Home ·/.test(svg), 'the frame names the place: Home');
  const jst = await ev(() => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10));
  const [yy, mm, dd] = jst.split('-').map(Number), MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  ok(svg.includes(`${dd} ${MON[mm - 1]} ${yy}`), `the frame has the Japan date, written out (${dd} ${MON[mm - 1]} ${yy})`);
  ok(svg.includes(`>${name}<`), `the frame names the dog (${name})`);
  ok(svg.includes('Best day ever'), 'the default caption shows');
  ok((svg.match(/@font-face/g) || []).length === 2 && svg.includes('Caveat') && svg.includes('Patrick Hand') && (svg.match(/data:font\/woff2;base64,/g) || []).length === 2, 'both crayon fonts are embedded as data URIs');
  ok(!/(href|src)\s*=\s*["'](?!#|data:)/i.test(svg) && !/url\(\s*["']?(?!#|data:)/i.test(svg) && !/<image|<script|foreignObject/i.test(svg), 'nothing in the image points outside the file (the canvas stays clean)');
  ok(svg.length < 2.5e6, `the image markup is a sane size (${Math.round(svg.length / 1024)} KB)`);
  ok(!/animation-name|@keyframes/i.test(svg.replace(/<style>.*?<\/style>/s, '')), 'no running animation is left in the picture');
  ok(await ev(() => { const z = window.__paw.ph.size(); return z.w === 1080 && z.h > 600 && z.h < 1080; }), 'the postcard is 1080 px on the long side');

  sec('the choices: frame colour, caption, square');
  ok(await ev(() => document.querySelectorAll('#phMode .ph-swatch').length) === 5, 'five frame colours');
  const caps = await ev(() => [...document.querySelectorAll('#phMode .ph-cap')].map((b) => b.textContent));
  ok(caps.length === 9, `eight captions plus the season line (${caps.length})`);
  const season = await ev(() => window.__paw.ph.caps().slice(-1)[0].t);
  ok(caps.includes(season) && /Sunny paws/.test(season), `the season line is there (summer: ${season})`);
  ok(caps.every((c) => !/;/.test(c) && !/[\u{1F300}-\u{1FAFF}☀-➿]/u.test(c)), 'captions: no semicolons, no emoji');
  const svg0 = svg;
  await p.click('#phMode [data-frame=mint]'); await t.until((old) => window.__paw.ph.svg() !== old && window.__paw.ph.ready(), svg0, 8000);
  svg = await ev(() => window.__paw.ph.svg());
  ok(svg !== svg0 && svg.split('#BDE7D2').length > svg0.split('#BDE7D2').length, 'frame colour: mint changes the picture');
  ok(await ev(() => JSON.parse(localStorage.getItem('pawhaven_prefs_v1')).phFrame) === 'mint', 'the frame colour is remembered (prefs)');
  await p.click('#phMode [data-cap=c1]'); await t.until(() => window.__paw.ph.svg().includes('Nap champions'), null, 8000);
  ok(await ev(() => window.__paw.ph.svg().includes('Nap champions') && !window.__paw.ph.svg().includes('Best day ever')), 'caption: Nap champions replaces the old one');
  await p.click('#phMode [data-cap=season]'); await t.until(() => window.__paw.ph.svg().includes('Sunny paws'), null, 8000);
  ok(true, 'caption: the season line works');
  await p.click('#phMode [data-sq="1"]'); await t.until(() => { const z = window.__paw.ph.size(); return z.w === z.h && window.__paw.ph.ready(); }, null, 10000);
  ok(await ev(() => { const z = window.__paw.ph.size(); return z.w === 1080 && z.h === 1080; }), 'Square: 1080 x 1080');
  await p.click('#phMode [data-sq="0"]'); await t.until(() => window.__paw.ph.size().h < 1080 && window.__paw.ph.ready(), null, 10000);
  ok(true, 'Postcard: back to the postcard shape');

  sec('Save: the download is a PNG of the right size');
  let dl = p.waitForEvent('download'); await p.click('#phSave'); let d = await dl;
  let buf = await readStream(d), sz = pngSize(buf);
  const want = await ev(() => window.__paw.ph.size());
  ok(!!sz && sz.w === want.w && sz.h === want.h && sz.w === 1080, `the downloaded file is a PNG, ${sz && sz.w}x${sz && sz.h}`);
  ok(/^doodle-doggo-\d{4}-\d\d-\d\d-1\.png$/.test(d.suggestedFilename()), `file name: ${d.suggestedFilename()}`);
  ok(buf.length > 50000 && buf.length < 4e6, `a real picture, not a blank one (${Math.round(buf.length / 1024)} KB)`);
  s0 = await S();
  ok(s0.ph.n === 1 && /^\d{4}-\d\d-\d\d$/.test(s0.ph.first), 'S.ph.n is 1 and S.ph.first is the date');
  ok(!JSON.stringify(s0).includes('data:image') && !JSON.stringify(s0).includes('iVBOR'), 'the save holds no picture');
  dl = p.waitForEvent('download'); await p.click('#phMode [data-sq="1"]'); await t.until(() => { const z = window.__paw.ph.size(); return z.w === z.h && window.__paw.ph.ready(); }, null, 10000);
  await p.click('#phSave'); d = await dl; sz = pngSize(await readStream(d));
  ok(!!sz && sz.w === 1080 && sz.h === 1080, 'the square download is 1080 x 1080');
  ok((await S()).ph.n === 2, 'S.ph.n counts every saved photo (2)');

  sec('Gerald, once');
  ok(await ev(() => window.__paw.ph.say()), 'the first time: Gerald had his line');
  ok(await t.waitToast(/Say cheese\. Or kibble\./, 3000).catch(() => false) || await ev(() => window.__toasts.some((x) => /Say cheese\. Or kibble\./.test(x))), 'Gerald says: Say cheese. Or kibble.');

  sec('Esc and the Close button');
  await p.keyboard.press('Escape');
  ok(await t.until(() => !window.__paw.ph.active(), null, 3000) && await ev(() => document.getElementById('phMode').hidden), 'Esc closes photo mode');
  ok(await ev(() => getComputedStyle(document.getElementById('hud')).visibility !== 'hidden' && !document.getElementById('phBtn').hidden), 'the HUD and the camera button are back');
  await p.click('#phBtn'); await t.until(() => window.__paw.ph.ready(), null, 15000);
  await p.click('#phClose'); ok(await t.until(() => !window.__paw.ph.active(), null, 3000), 'the Close button closes it');
  await ev(() => window.__paw.toast('x')); // keep the toast list moving
  await p.click('#phBtn'); await t.until(() => window.__paw.ph.ready(), null, 15000);
  await ev(() => window.__paw.go('yard'));
  ok(await t.until(() => !window.__paw.ph.active(), null, 3000), 'leaving the place (a new scene) ends photo mode');
  await t.calm();

  sec('Web Share with the file');
  await ev(() => { window.__shared = null; navigator.canShare = (d) => !!(d && d.files && d.files.length && d.files[0].type === 'image/png'); navigator.share = async (d) => { window.__shared = { n: d.files[0].name, type: d.files[0].type, size: d.files[0].size }; }; });
  await p.click('#phBtn'); await t.until(() => window.__paw.ph.ready(), null, 15000);
  await p.click('#phSave'); ok(await t.until(() => !!window.__shared, null, 5000), 'Save hands the file to the share sheet');
  const sh = await ev(() => window.__shared);
  ok(sh && sh.type === 'image/png' && sh.size > 50000 && /\.png$/.test(sh.n), `the shared file is the PNG (${sh && sh.n}, ${sh && Math.round(sh.size / 1024)} KB)`);
  ok(await t.until(() => window.__paw.S.ph.n === 3, null, 3000), 'a shared photo counts');
  await ev(() => { window.__shared = null; navigator.share = async () => { const e = new Error('closed'); e.name = 'AbortError'; throw e; }; });
  await p.click('#phSave'); await t.sleep(400);
  ok((await S()).ph.n === 3, 'closing the share sheet saves nothing and counts nothing');
  await ev(() => { navigator.share = async () => { const e = new Error('no'); e.name = 'NotAllowedError'; throw e; }; });
  dl = p.waitForEvent('download'); await p.click('#phSave'); d = await dl;
  ok(!!pngSize(await readStream(d)), 'a share that fails falls back to the download');
  ok(await t.until(() => window.__paw.S.ph.n === 4, null, 3000), 'and it counts');

  sec('neither share nor download: press and hold to save');
  await ev(() => { navigator.canShare = undefined; navigator.share = undefined; window.__paw.ph.force('none'); });
  await p.click('#phSave'); await p.waitForSelector('#phMode .ph-hold');
  ok(await ev(() => /Press and hold to save/.test(document.querySelector('#phMode .ph-hold').textContent)), 'the full-screen overlay says: Press and hold to save');
  ok(await ev(() => { const im = document.querySelector('#phMode .ph-holdpic'); return !!im && im.src.startsWith('data:image/png;base64,') && im.src.length > 60000; }), 'it shows the saved PNG');
  ok(await ev(() => { const r = document.querySelector('#phMode .ph-holdpic').getBoundingClientRect(); return r.height > 300 && r.width > 300; }), 'the picture fills the screen');
  ok(await t.until(() => window.__paw.S.ph.n === 5, null, 3000), 'it counts');
  await p.keyboard.press('Escape'); ok(await ev(() => !document.querySelector('#phMode .ph-hold') && window.__paw.ph.active()), 'Esc closes the picture first');
  await p.keyboard.press('Escape'); ok(await t.until(() => !window.__paw.ph.active(), null, 3000), 'a second Esc closes photo mode');
  await ev(() => window.__paw.ph.force(''));
  await p.click('#phBtn'); await t.sleep(200); ok(await ev(() => !document.querySelector('#phMode .ph-hold')), 'Gerald does not repeat and the overlay starts fresh');
  await p.keyboard.press('Escape');

  sec('the mission and the journal');
  ok(await ev(() => window.__paw.ms.pool.includes('photo')), 'the photo mission is in the pool');
  await ev(() => window.__paw.ms.force(['photo']));
  ok(await ev(() => { const l = window.__paw.S.missions.list; return l.length === 1 && l[0].id === 'photo' && !l[0].done; }), 'the photo mission is on the card');
  ok(await ev(() => { document.querySelector('[data-act=journal]').click(); return true; }), 'open the journal');
  await p.waitForSelector('.panel.journal'); await ev(() => document.querySelector('[data-jt=missions]').click());
  ok(await ev(() => /Take a photo of your pack/.test(document.querySelector('.panel.journal').textContent)), 'the mission reads: Take a photo of your pack');
  await t.closeX(); await t.modalGone();
  await ev(() => { navigator.canShare = () => true; navigator.share = async () => {}; });
  await p.click('#phBtn'); await t.until(() => window.__paw.ph.ready(), null, 15000); await p.click('#phSave');
  ok(await t.until(() => { const l = window.__paw.S.missions.list; return !!(l[0] && l[0].done); }, null, 6000), 'one saved photo completes the mission');
  await p.keyboard.press('Escape'); await t.until(() => !window.__paw.ph.active(), null, 3000);
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await ev(() => document.querySelector('[data-jt=profile]').click());
  ok(await ev(() => /Photos taken: 6/.test(document.querySelector('.panel.journal').textContent)), 'the journal says: Photos taken: 6');
  await t.closeX(); await t.modalGone();

  sec('a town place and the house');
  await t.home('market');
  ok(await ev(() => !document.getElementById('phBtn').hidden), 'Market Street: the camera is there');
  await p.click('#phBtn'); await t.until(() => window.__paw.ph.ready(), null, 15000);
  ok(await ev(() => window.__paw.ph.svg().includes('Market Street')), 'the frame names Market Street');
  await p.keyboard.press('Escape');
  await t.home('house');
  await p.click('#phBtn'); await t.until(() => window.__paw.ph.ready(), null, 15000);
  ok(await ev(() => window.__paw.ph.svg().includes('The house')), 'the frame names the house: The house');
  await p.keyboard.press('Escape');
  await t.home('park'); await p.click('#phBtn'); await t.until(() => window.__paw.ph.ready(), null, 15000);
  ok(await ev(() => window.__paw.ph.svg().includes('Sunny Park')), 'the frame names Sunny Park');
  await p.keyboard.press('Escape');

  sec('every dog in the shot');
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 20 }, 'Biscuit'); P.addDog({ key: 'golden', sex: 'female', months: 20 }, 'Sunny'); });
  await t.home(); await p.click('#phBtn'); await t.until(() => window.__paw.ph.ready(), null, 15000);
  svg = await ev(() => window.__paw.ph.svg());
  ok(/Biscuit/.test(svg) && /Sunny/.test(svg) && svg.includes(`${name}, `), 'the frame lists the whole pack');
  ok(/ and /.test(await ev(() => window.__paw.ph.names().join(' and '))) && (await ev(() => window.__paw.ph.names().length)) === 3, 'three dogs, three names');
  ok(!/data-dog|tabindex|onclick|onkeydown/.test(svg), 'no click handles or data hooks leak into the picture');
  await p.keyboard.press('Escape');

  sec('the square holds every dog, however far apart');
  await ev(() => { window.__paw.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); });
  await t.home(); await t.freezeMotion(true); await t.sleep(300);
  await ev(() => { const svg = document.querySelector('#view > svg.world'), inv = svg.getScreenCTM().inverse(), sx = (x) => new DOMPoint(x, 0).matrixTransform(inv).x; const ds = [...svg.querySelectorAll('#pack .packdog')].map((g) => ({ g, r: g.getBoundingClientRect() })).sort((a, b) => a.r.left - b.r.left); const lo = ds[0], hi = ds[ds.length - 1]; lo.g.style.transform = `translate(${(20 - sx(lo.r.left)).toFixed(1)}px,0)`; hi.g.style.transform = `translate(${(985 - sx(hi.r.right)).toFixed(1)}px,0)`; }); // spread the pack from edge to edge
  await p.click('#phBtn'); await t.until(() => window.__paw.ph.ready(), null, 15000);
  await p.click('#phMode [data-sq="1"]'); await t.until(() => { const z = window.__paw.ph.size(); return z.w === z.h && window.__paw.ph.ready(); }, null, 10000);
  const sq = await ev(() => ({ crop: window.__paw.ph.crop(), boxes: window.__paw.ph.boxes(), names: window.__paw.ph.names(), inShot: window.__paw.ph.inShot(), svg: window.__paw.ph.svg() }));
  const placed = sq.boxes.filter((b) => b[1] != null), L = Math.min(...placed.map((b) => b[1])), R = Math.max(...placed.map((b) => b[2]));
  ok(sq.names.length === 4 && placed.length === 4, `four dogs with a place in the scene (${sq.names.join(', ')})`);
  ok(placed.every(([, a, b]) => a >= sq.crop[0] - 1 && b <= sq.crop[0] + sq.crop[2] + 1 || (a < 0 || b > 1000)), `every dog is inside the square crop (crop x ${Math.round(sq.crop[0])} to ${Math.round(sq.crop[0] + sq.crop[2])}, dogs ${Math.round(L)} to ${Math.round(R)})`);
  ok(Math.abs(sq.crop[2] / sq.crop[3] - (await ev(() => { const w = window.PawArt.postcardWindow(1080, 1080); return w.w / w.h; }))) < 0.01, 'the crop keeps the picture window shape');
  const strip = 600 * sq.crop[2] / sq.crop[3]; // the full scene height at the window shape
  if (R - L > strip) ok(sq.crop[2] >= Math.min(R - L, 1000) - 1 && sq.crop[1] < -1 && new RegExp(`<rect x="[^"]+" y="${+sq.crop[1].toFixed(2)}" width="[^"]+" height="[^"]+" fill="#(?!FFFBF3)`).test(sq.svg), `spread out wider than the strip (${Math.round(strip)}): the crop widens to ${Math.round(sq.crop[2])} and the extra height above the scene takes the sky colour`);
  else ok(false, `the test spreads the pack wider than the strip (dogs ${Math.round(L)} to ${Math.round(R)}, strip ${Math.round(strip)})`);
  ok(sq.inShot.length === 4 && sq.inShot.join() === sq.names.join() && sq.inShot.every((n) => sq.svg.includes(n)), `the names line is built from the dogs in the crop: all four (${sq.inShot.join(', ')})`);
  await p.click('#phMode [data-sq="0"]'); await t.until(() => window.__paw.ph.size().h < 1080 && window.__paw.ph.ready(), null, 10000);
  await p.keyboard.press('Escape'); await t.freezeMotion(false);

  sec('night, rain and snow are in the picture');
  await ev(() => document.getElementById('devBtn').click()); await p.waitForSelector('#devPanel:not([hidden])');
  await p.selectOption('#dvTime', 'night'); await p.selectOption('#dvWeather', 'rain'); await p.click('#dvX');
  await p.click('#phBtn'); await t.until(() => window.__paw.ph.ready(), null, 15000);
  svg = await ev(() => window.__paw.ph.svg());
  ok(svg.includes('phx-rain'), 'a rainy night: the rain is drawn in');
  await p.keyboard.press('Escape');
  await ev(() => document.getElementById('devBtn').click()); await p.waitForSelector('#devPanel:not([hidden])');
  await p.selectOption('#dvTime', 'day'); await p.selectOption('#dvWeather', 'snow'); await p.click('#dvX');
  await p.click('#phBtn'); await t.until(() => window.__paw.ph.ready(), null, 15000);
  ok((await ev(() => window.__paw.ph.svg())).includes('phx-snow'), 'snow: the flakes are drawn in');
  await p.keyboard.press('Escape');
  await ev(() => document.getElementById('devBtn').click()); await p.waitForSelector('#devPanel:not([hidden])');
  await p.selectOption('#dvTime', 'day'); await p.selectOption('#dvWeather', 'cloudy'); await p.click('#dvX');
});
