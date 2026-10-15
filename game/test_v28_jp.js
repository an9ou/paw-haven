// v2.8 FUJI HILL lane test (V28.md sections 12.4 and 12.6), prefs { jpTest, wnTest }.
// Without jpTest the game is exactly the winter-only game (no hill, no letter, no Japan scenery). The hill is on the map at Bond 2 and not at Bond 1 (locked pin,
// travel refused), Gerald's letter once when it opens, the arrival line for all 14 breeds, Look at Fuji once a real day (the walk to the bench, the seat, the ease,
// +6 Happiness, +1 Bond, act gaze, then "Fuji says see you tomorrow."), the toast table (rain, snow, cloudy, dusk, night, dawn, winter day, summer day, spring day),
// 2027-01-02: the first Fuji of the year pays once (gold, +10 Happiness, +2 Bond) and the mochi tip shows once, 2027-01-08: no first Fuji. The three missions
// gate and match. iPhone 15: the place passes the minimums, Fuji's summit in the yard, Square and hill crops.
// Screenshots (PAW_SHOTS=1 or PAW_JP_SHOTS=1): game/shots_v28/fuji-hill/ (jpeg, under 300 KB).
// node game/run_tests.js v28_jp
const fs = require('fs'); const path = require('path');
require('./test_lib').run('v28_jp', async (t) => {
  const { ok, sec, ev } = t;
  const p = () => t.p;
  const SHOTS = !!(process.env.PAW_SHOTS || process.env.PAW_JP_SHOTS), DIR = path.join(__dirname, 'shots_v28', 'fuji-hill');
  const shot = async (n, keepToasts) => {
    if (!SHOTS) return; if (!keepToasts) await ev(() => document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()));
    await t.sleep(500); fs.mkdirSync(DIR, { recursive: true });
    const f = path.join(DIR, n + '.jpg'); await p().screenshot({ path: f, type: 'jpeg', quality: 80 });
    if (fs.statSync(f).size > 295000) await p().screenshot({ path: f, type: 'jpeg', quality: 55 });
  };
  const setDate = (d) => { t.clockOffset = new Date(d + 'T10:00:00').getTime() - Date.now(); };
  const motion = (on) => ev((on) => { document.documentElement.dataset.motion = on ? 'on' : 'off'; }, on);
  const quiet = () => ev(() => { window.__toasts.splice(0); document.querySelectorAll('#toasts .toast').forEach((e) => e.remove()); });
  const env = (o) => t.dev(async () => { for (const k of Object.keys(o)) await p().selectOption('#dv' + k, o[k]); });
  const at = async (place) => { await ev((k) => { const S = window.__paw.S; S.sleeping = false; S.place = k; window.__paw.go('yard'); }, place); await t.until((k) => window.__paw.S.place === k && window.__paw.mode === 'yard' && !!document.getElementById('placeBtns'), place, 8000); await t.calm(); await t.lu(); };
  const btn = () => ev(() => { const b = document.querySelector('#placeBtns [data-jp]'); return b ? { text: b.textContent, dis: b.getAttribute('aria-disabled') === 'true' } : null; });
  const eligible = (ids) => ev((ids) => { const seen = new Set(); for (let i = 0; i < 200; i++) window.__paw.ms.pick('x' + i).forEach((m) => seen.add(m.id)); return ids.map((id) => seen.has(id)); }, ids);
  const msDone = (id) => ev((id) => { const m = window.__paw.S.missions.list.find((x) => x.id === id); return !!(m && m.done); }, id);
  const today = () => ev(() => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); });
  const yesterday = () => ev(() => { const d = new Date(Date.now() - 864e5); window.__paw.S.jp.gazed = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); });
  // one look with motion off: the toasts, the Happiness and Bond points it paid
  const look = async () => {
    await quiet(); await motion(false);
    const b0 = await ev(() => { const S = window.__paw.S; S.stats.happy = 50; return S.bond.pts; });
    await ev(() => document.querySelector('#placeBtns [data-jp]').click());
    await t.until(() => !window.__paw.jp.gazing, null, 8000);
    const s1 = await ev(() => ({ happy: window.__paw.S.stats.happy, pts: window.__paw.S.bond.pts }));
    return { toasts: await ev(() => window.__toasts.slice()), happy: s1.happy - 50, bond: s1.pts - b0 };
  };
  // mid-look with motion on (the dog on the bench, the scene eased in), for the pictures
  const lookShot = async (name) => {
    await motion(true); await quiet(); await ev(() => document.querySelector('#placeBtns [data-jp]').click());
    await t.until(() => !!document.querySelector('#view > svg.world.jp-ease'), null, 4000); await t.sleep(4400);
    await shot(name); await t.until(() => !window.__paw.jp.gazing, null, 9000);
  };

  /* ======================= without jpTest: the winter-only game ======================= */
  sec('without jpTest: no hill, no letter, no Japan scenery');
  setDate('2026-12-10');
  await t.newGame({ prefs: { wnTest: true, msTest: true }, fest: 'auto', season: 'winter' }, { bond: { level: 5, pts: 500 } });
  await t.home('yard'); await t.sleep(2200);
  const off = await ev(() => ({ on: window.__paw.jp.on(), place: window.__paw.jp.place(), open: window.__paw.jp.open(), jp: window.__paw.S.jp, mail: window.__paw.S.mail.some((m) => /^jp_/.test(m.id)), dataJp: !!document.querySelector('#sceneG [data-jp]'), fuji: !!document.querySelector('#sceneG [data-fuji]') }));
  ok(!off.on && off.place === null && !off.open, 'jpOn() is false, PLACES.fujihill does not exist, the hill is not open');
  ok(!off.mail && off.jp.letter === null && off.jp.gazed === null, 'no letter, nothing written to S.jp');
  ok(!off.dataJp && !off.fuji, 'the yard has no Japan scenery (no data-jp, no data-fuji)');
  ok((await eligible(['gaze', 'hatsufuji', 'travel_fuji'])).every((x) => !x), 'none of the three Fuji missions is eligible');
  ok(await ev(() => window.__paw.jp.gaze() === null && window.__paw.jp.letter() === null), 'jpGaze() and jpLetter() do nothing');
  await p().click('[data-act=map]'); await t.untilMode('map');
  ok(await ev(() => !document.querySelector('[data-area=fujihill]')), 'the map has no Fuji View Hill');
  await t.ctx.close();

  /* ======================= Bond 1 and Bond 2 ======================= */
  sec('jpTest, Bond 1: the hill is on the map, locked');
  setDate('2026-10-20');
  await t.newGame({ prefs: { jpTest: true, wnTest: true, msTest: true } }, { bond: { level: 1, pts: 0 } });
  await t.home('yard'); await t.sleep(2200);
  ok(await ev(() => window.__paw.jp.on() && !!window.__paw.jp.place() && !window.__paw.jp.open()), 'jpOn(), PLACES.fujihill exists, jpHillOpen() is false at Bond 1');
  ok(await ev(() => window.__paw.S.jp.letter === null && !window.__paw.S.mail.some((m) => m.id === 'jp_hill')), 'no letter at Bond 1');
  ok((await eligible(['gaze', 'travel_fuji'])).join() === 'false,false', 'gaze and travel_fuji are not eligible at Bond 1');
  await p().click('[data-act=map]'); await p().waitForSelector('[data-area=fujihill]');
  await ev(() => window.__paw.mapTo('fujihill')); await quiet();
  ok(await ev(() => document.querySelector('[data-area=fujihill]').dataset.locked === '1' || document.querySelector('[data-area=fujihill]').classList.contains('locked')), 'the pin is drawn locked');
  await p().click('[data-area=fujihill]', { force: true });
  ok(await t.waitToast(/Fuji View Hill opens at Bond 2/, 4000), 'a tap on the pin at Bond 1: "Fuji View Hill opens at Bond 2"');
  ok(await ev(() => window.__paw.S.place) !== 'fujihill', 'and the dog stays home');
  await shot('map_bond1_locked');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');

  sec('Bond 2: Gerald\'s letter once, the pin opens, travel');
  await t.patch({ bond: { level: 2, pts: 120 } }); await t.home('yard');
  ok(await t.until(() => window.__paw.S.mail.filter((m) => m.id === 'jp_hill').length === 1, null, 8000), 'the letter arrives by itself once the hill opens');
  const dog = await ev(() => window.__paw.S.dog.name);
  const L = await ev(() => window.__paw.S.mail.find((m) => m.id === 'jp_hill'));
  ok(L.kind === 'news' && L.from === 'Gerald the duck' && L.text === `There is a hill past the meadow where you can see Fuji. Bring ${dog}. Bring a snack. Not for Fuji.` && !L.gift, 'from Gerald, news, the spec text, no gift');
  ok(await ev(() => !!window.__paw.S.jp.letter), 'S.jp.letter is set');
  await t.home('house'); await t.home('yard'); await t.sleep(2200);
  ok(await ev(() => window.__paw.S.mail.filter((m) => m.id === 'jp_hill').length === 1 && window.__paw.jp.letter() === null), 'a second yard entry and jpLetter() send nothing more');
  ok((await eligible(['gaze', 'hatsufuji', 'travel_fuji'])).join() === 'true,false,true', 'Bond 2 in October: gaze and travel_fuji eligible, hatsufuji not');
  await ev(() => window.__paw.openMailbox('jp_hill')); await t.until(() => !!document.querySelector('#modal .panel.mailbox'), null, 5000);
  await shot('letter_gerald'); await t.closeX(); await t.modalGone();
  await ev(() => window.__paw.ms.force(['travel_fuji']));
  await p().click('[data-act=map]'); await p().waitForSelector('[data-area=fujihill]'); await ev(() => window.__paw.mapTo('fujihill'));
  ok(await ev(() => { const a = document.querySelector('[data-area=fujihill]'); return a.dataset.locked !== '1' && !a.classList.contains('locked'); }), 'the pin is open at Bond 2');
  await shot('map_pin');
  await ev(() => window.__paw.go('yard')); await t.untilMode('yard');
  await t.travel('fujihill');
  ok(await ev(() => window.__paw.S.place) === 'fujihill', 'travel through the map reaches Fuji View Hill');
  ok(await t.until(() => { const m = window.__paw.S.missions.list.find((x) => x.id === 'travel_fuji'); return !!(m && m.done); }, null, 4000), 'travel_fuji is done by the trip');
  const b0 = await btn();
  ok(b0 && b0.text === 'Look at Fuji' && !b0.dis, 'the place button reads "Look at Fuji"');
  const bh = await ev(() => [...document.querySelectorAll('#placeBtns .btn')].map((b) => b.getBoundingClientRect().height));
  ok(bh.length === 2 && bh.every((h) => h >= 43.5), `Look at Fuji and Go home are 44 px (${bh.map(Math.round).join(', ')})`);
  ok(await ev(() => [...document.querySelectorAll('#placeBtns .btn')].map((b) => b.dataset.jp || b.dataset.pb).join()) === 'gaze,yard', 'Look at Fuji sits before Go home');
  ok(await ev(() => !document.querySelector('#sceneG [role=button], #sceneG .hot')), 'the torii, the shrine and the lanterns are scenery: nothing in the scene is a button');
  await quiet(); await shot('arrive');

  sec('the arrival line, all 14 breeds');
  const lines = await ev(() => window.__paw.jp.lines);
  const keys = await ev(() => Object.keys(window.__paw.S.dogs.length ? window.__paw.jp.lines : {}));
  const BREEDS = ['shiba', 'corgi', 'golden', 'dachs', 'husky', 'mutt', 'chihuahua', 'pug', 'greyhound', 'beagle', 'poodle', 'collie', 'samoyed', 'frenchie'];
  ok(BREEDS.every((k) => typeof lines[k] === 'string' && lines[k].length > 10 && lines[k].length < 110 && !/;/.test(lines[k])) && keys.length === 14, 'a line for each of the 14 breeds');
  ok(lines.shiba === 'Fuji is very tall. I am very proud. We understand each other.', 'the Shiba line is the spec line');
  ok(await ev(() => { const k = window.__paw.S.dog.key; window.__paw.voice.ambient(); const b = document.getElementById('bubble'); return !b.hidden && b.textContent === window.__paw.jp.lines[k]; }), 'placeAmbient on the hill says the breed\'s hill line');

  sec('Look at Fuji: the walk, the seat, the ease (motion on)');
  await motion(true); await env({ Weather: 'sunny' }); await quiet();
  const hp0 = await ev(() => { window.__paw.S.stats.happy = 50; return window.__paw.S.bond.pts; });
  await ev(() => document.querySelector('#placeBtns [data-jp]').click());
  ok(await ev(() => window.__paw.jp.gazing), 'the look starts');
  ok((await btn()).dis, 'the button is aria-disabled during the look');
  ok(await t.until(() => /scale\(0\.6/.test(document.getElementById('dogPos').style.transform) && !!document.querySelector('#view > svg.world.jp-ease'), null, 4000), 'the dog goes to the bench and the scene eases in');
  ok(await ev(() => /pa-pose-sit/.test(document.getElementById('dogArt').innerHTML)), 'the dog sits');
  const seat = await ev(() => { const svg = document.querySelector('#view svg.world'); svg.classList.remove('jp-ease'); const r = document.getElementById('dogHit').getBoundingClientRect(), M = svg.getScreenCTM().inverse(), a = new DOMPoint(r.left, r.top).matrixTransform(M), b = new DOMPoint(r.right, r.bottom).matrixTransform(M); svg.classList.add('jp-ease'); return { cx: (a.x + b.x) / 2, by: b.y }; });
  ok(Math.abs(seat.cx - 530) < 30 && seat.by > 400 && seat.by < 440, `the dog sits on the middle of the bench seat (centre x ${Math.round(seat.cx)}, bottom y ${Math.round(seat.by)})`);
  await t.sleep(4000); await shot('gaze_day_summer');
  ok(await t.waitToast(/^Fuji has nearly no snow\. It is too warm for hats\. \+6 Happiness, \+\d+ Bond\.$/, 6000), 'summer day: "Fuji has nearly no snow. It is too warm for hats."');
  const st1 = await ev(() => ({ happy: window.__paw.S.stats.happy, pts: window.__paw.S.bond.pts, gazed: window.__paw.S.jp.gazed }));
  ok(Math.abs(st1.happy - 56) < 1 && st1.pts > hp0 && st1.gazed === await today(), `+6 Happiness, +1 Bond (${st1.pts - hp0} pts), S.jp.gazed = today`);
  ok(await t.until(() => !window.__paw.jp.gazing && window.__paw.jp.pending === 0, null, 8000), 'the dog walks back and the look ends');
  ok(await ev(() => /scale\(1\)/.test(document.getElementById('dogPos').style.transform) && !document.querySelector('#view > svg.world.jp-ease')), 'the dog is back on the path, the scene is back');
  const b1 = await btn();
  ok(b1.text === 'Fuji says see you tomorrow.' && b1.dis, 'then the button reads "Fuji says see you tomorrow." (aria-disabled)');
  ok(await ev(() => document.querySelector('#placeBtns [data-jp]').getBoundingClientRect().height >= 43.5), 'still 44 px');

  sec('once per real day, the gaze mission');
  await quiet(); const s2 = await ev(() => ({ h: window.__paw.S.stats.happy, b: window.__paw.S.bond.pts }));
  await ev(() => document.querySelector('#placeBtns [data-jp]').click()); await t.sleep(300);
  ok(await ev(() => !window.__paw.jp.gazing && window.__paw.jp.gaze() === null), 'a second look the same day does not start');
  ok(await ev((s) => Math.abs(window.__paw.S.stats.happy - s.h) < 0.5 && window.__paw.S.bond.pts === s.b, s2), 'and pays nothing');
  ok(await t.waitToast(/already looked at Fuji today\. Fuji says see you tomorrow\./, 2000), 'a kind note instead');
  ok((await eligible(['gaze']))[0] === false, 'gaze is not eligible after today\'s look');
  await yesterday(); await at('fujihill');
  ok((await btn()).text === 'Look at Fuji', 'a new day: the button is back');
  await ev(() => window.__paw.ms.force(['gaze'])); await env({ Weather: 'cloudy' });
  let r = await look();
  ok(r.toasts.includes(`Only the top of Fuji is in the clouds. ${dog} is sure it is still there. +6 Happiness, +${r.bond} Bond.`) && Math.abs(r.happy - 6) < 1 && r.bond >= 1, `cloudy: the clouds toast, +6 Happiness, +${r.bond} Bond pts`);
  ok(await t.until(() => { const m = window.__paw.S.missions.list.find((x) => x.id === 'gaze'); return !!(m && m.done); }, null, 4000), 'act:gaze completes "Look at Fuji from Fuji View Hill"');

  sec('the toast table: rain, snow, dusk, night, dawn, winter day, spring day');
  const cases = [
    [{ Weather: 'rain', Time: 'day' }, `Fuji is shy today. It is behind the clouds. ${dog} looked anyway.`, 'rain'],
    [{ Weather: 'snow', Time: 'day' }, `Fuji is shy today. It is behind the clouds. ${dog} looked anyway.`, 'snow'],
    [{ Weather: 'sunny', Time: 'dusk' }, `Fuji has turned pink. ${dog} is not sure why but approves.`, 'dusk'],
    [{ Weather: 'sunny', Time: 'night' }, `Fuji is a dark shape with a star on top. ${dog} said goodnight to it.`, 'night'],
    [{ Weather: 'sunny', Time: 'dawn' }, `Fuji. Very big. Very still. ${dog} sat very still too, for nearly a minute.`, 'other (dawn)'],
    [{ Weather: 'sunny', Time: 'day', Season: 'winter' }, 'Fuji has its winter hat on. So does half of Doodle Doggo Town.', 'winter day'],
    [{ Weather: 'sunny', Time: 'day', Season: 'spring' }, `Fuji. Very big. Very still. ${dog} sat very still too, for nearly a minute.`, 'other (spring day)']
  ];
  for (const [e, want, name] of cases) {
    await yesterday(); await env(e); await at('fujihill');
    r = await look();
    ok(r.toasts.includes(`${want} +6 Happiness, +${r.bond} Bond.`) && Math.abs(r.happy - 6) < 1, `${name}: "${want}"${r.toasts.length ? '' : ' (no toast)'}`);
    if (['dusk', 'night', 'winter day'].includes(name)) { await yesterday(); await at('fujihill'); await lookShot('gaze_' + name.replace(/\s+/g, '_')); }
  }
  sec('the owner picture: spring, a sunny day, the dog on the bench looking at Fuji');
  await yesterday(); await at('fujihill'); await lookShot('owner_fuji_bench');
  await env({ Season: 'summer', Time: 'day' });
  await t.ctx.close();

  /* ======================= 2027-01-02: the first Fuji of the year ======================= */
  sec('2027-01-02: the first Fuji of the year, the mochi lesson, hatsufuji');
  setDate('2027-01-02');
  await t.newGame({ prefs: { jpTest: true, wnTest: true, msTest: true }, fest: 'auto', season: 'winter', weather: 'sunny' }, { bond: { level: 3, pts: 300 } });
  await t.home('yard');
  ok((await eligible(['hatsufuji', 'gaze'])).join() === 'true,true', 'hatsufuji and gaze are eligible on 2 January');
  await ev(() => window.__paw.ms.force(['hatsufuji'])); await at('fujihill');
  const ny = await ev(() => ({ first: window.__paw.S.jp.first, mochi: window.__paw.S.jp.mochi }));
  ok(ny.first === null && ny.mochi === null, 'S.jp.first and S.jp.mochi start empty');
  await quiet(); await motion(true);
  const f0 = await ev(() => { window.__paw.S.stats.happy = 50; return window.__paw.S.bond.pts; });
  await ev(() => document.querySelector('#placeBtns [data-jp]').click());
  ok(await t.waitToast(/^The first Fuji of the year\. In Japan that is very lucky\. .+ feels lucky too\. \+10 Happiness, \+\d+ Bond\.$/, 10000), 'the toast: "The first Fuji of the year. In Japan that is very lucky."');
  ok(await ev(() => [...document.querySelectorAll('#toasts .toast.gold')].some((e) => /first Fuji/.test(e.textContent))), 'it is a gold toast');
  await ev(() => document.querySelectorAll('#toasts .toast').forEach((e) => { if (!/first Fuji/.test(e.textContent)) e.remove(); }));
  await shot('first_fuji_2jan', true);
  const f1 = await ev(() => ({ h: window.__paw.S.stats.happy, b: window.__paw.S.bond.pts, first: window.__paw.S.jp.first }));
  ok(Math.abs(f1.h - 60) < 1 && f1.first === 2027 && f1.b - f0 >= 2, `+10 Happiness, +2 Bond (${f1.b - f0} pts), S.jp.first = 2027`);
  ok(await t.waitToast(/^Mochi is for people at New Year\. It is far too sticky for dogs to swallow, so .+ gets a pat instead\.$/, 6000), 'then the mochi lesson');
  ok(await ev(() => window.__paw.S.jp.mochi) === 2027, 'S.jp.mochi = 2027');
  ok(await t.until(() => { const m = window.__paw.S.missions.list.find((x) => x.id === 'hatsufuji'); return !!(m && m.done); }, null, 4000), 'act:gaze { first } completes "See the first Fuji of the year"');
  await t.until(() => !window.__paw.jp.gazing, null, 9000);
  ok((await eligible(['hatsufuji']))[0] === false, 'hatsufuji is not eligible after the first Fuji');
  await yesterday(); await at('fujihill'); await ev(() => window.__paw.ms.force(['hatsufuji']));
  r = await look(); await t.sleep(3000);
  const all = await ev(() => window.__toasts.slice());
  ok(r.toasts.some((x) => x.startsWith('Fuji has its winter hat on.')) && Math.abs(r.happy - 6) < 1, 'the next look: the plain winter toast, +6 Happiness');
  ok(!all.some((x) => /first Fuji|Mochi is for people/.test(x)), 'no second first Fuji and no second mochi tip');
  ok(!(await msDone('hatsufuji')), 'a plain look does not complete hatsufuji');
  await t.ctx.close();
  setDate('2027-01-08');
  await t.newGame({ prefs: { jpTest: true, wnTest: true, msTest: true }, fest: 'auto', season: 'winter' }, { bond: { level: 3, pts: 300 } });
  await t.home('yard');
  ok((await eligible(['hatsufuji']))[0] === false, '8 January: hatsufuji is not eligible');
  await at('fujihill'); r = await look();
  ok(r.toasts.some((x) => /^Only the top of Fuji/.test(x)) && !r.toasts.some((x) => /first Fuji/.test(x)), '8 January: a plain look, no first Fuji');
  await t.ctx.close();

  /* ======================= phones ======================= */
  sec('iPhone 15: Fuji in the yard and Square crops, the hill passes the minimums');
  setDate('2026-10-20');
  await t.newGame({ device: 'iPhone 15', prefs: { jpTest: true, wnTest: true, msTest: true }, weather: 'sunny' }, { bond: { level: 3, pts: 300 } });
  for (const pl of ['yard', 'square']) {
    await at(pl); await motion(false); await t.sleep(400);
    const f = await ev(() => { const v = document.getElementById('view').getBoundingClientRect(), fj = document.querySelector('#sceneG [data-fuji]'); if (!fj) return null; const r = fj.getBoundingClientRect(), cx = (r.left + r.right) / 2; return { cx: Math.round(cx), top: Math.round(r.top), view: [v.left, v.top, v.right].map(Math.round) }; });
    ok(!!f && f.cx > f.view[0] + 10 && f.cx < f.view[2] - 10 && f.top >= f.view[1] - 1, `${pl}: Fuji's summit is inside the phone crop ${JSON.stringify(f)}`);
    await shot('phone_' + pl);
  }
  await at('fujihill'); await motion(false); await t.sleep(400);
  const ph = await ev(() => {
    const svg = document.querySelector('#view svg.world'), vb = svg.viewBox.baseVal, M = svg.getScreenCTM().inverse();
    const fj = document.querySelector('#sceneG [data-fuji]').getBoundingClientRect(), fw = new DOMPoint((fj.left + fj.right) / 2, fj.top).matrixTransform(M);
    const btns = [...document.querySelectorAll('#placeBtns .btn')].map((b) => { const r = b.getBoundingClientRect(); return [r.width, r.height]; });
    const d = document.getElementById('dogHit').getBoundingClientRect(), c = [(d.left + d.right) / 2, (d.top + d.bottom) / 2], top = document.elementFromPoint(c[0], c[1]);
    return { vb: [vb.x, vb.y, vb.width], btns, summit: [fw.x, fw.y], dogTop: !!top && (top.id === 'dogHit' || !!top.closest('#dogPos')), sw: document.documentElement.scrollWidth, iw: innerWidth };
  });
  ok(ph.btns.length === 2 && ph.btns.every(([w, h]) => w >= 43.5 && h >= 43.5), `the place buttons are 44 px ${JSON.stringify(ph.btns.map((b) => b.map(Math.round)))}`);
  ok(ph.vb[0] <= 330 && ph.vb[0] + ph.vb[2] >= 572, `the dog (x 330-530) and the bench (x 488-572) are inside the crop (x ${Math.round(ph.vb[0])}-${Math.round(ph.vb[0] + ph.vb[2])})`);
  ok(ph.summit[0] >= ph.vb[0] && ph.summit[0] <= ph.vb[0] + ph.vb[2] && ph.summit[1] >= ph.vb[1], `Fuji's summit (${Math.round(ph.summit[0])}, ${Math.round(ph.summit[1])}) is in the crop`);
  ok(ph.dogTop, 'nothing covers #dogHit');
  ok(ph.sw === ph.iw, 'no sideways scroll');
  // review 2: the hill line sits over the dog's head (no signs there), never under it on the place-button row
  const ln = await ev(() => { const b = document.getElementById('bubble'); for (let i = 0; i < 20 && (b.hidden || !b.textContent); i++) window.__paw.voice.ambient(); if (b.hidden) return null; b.getAnimations().forEach((a) => a.finish());
    const r = b.getBoundingClientRect(), d = document.getElementById('dogHit').getBoundingClientRect(), row = [...document.querySelectorAll('#placeBtns .btn')].map((x) => x.getBoundingClientRect());
    return { below: b.classList.contains('below'), overRow: row.some((q) => q.left < r.right && q.right > r.left && q.top < r.bottom && q.bottom > r.top), aboveDog: r.top < d.top, r: [r.left, r.top, r.right, r.bottom].map(Math.round), sw: innerWidth }; });
  ok(!!ln && !ln.below && !ln.overRow && ln.aboveDog && ln.r[0] >= 0 && ln.r[2] <= ln.sw, `the hill line sits over the dog's head, clear of the place buttons ${JSON.stringify(ln)}`);
  await ev(() => { document.getElementById('bubble').hidden = true; });
  // review 2: a nap on the hill (360 and 393 px) keeps the hill crop: the dog, the bench and Fuji's summit
  for (const [w, h] of [[360, 740], [393, 659]]) {
    await p().setViewportSize({ width: w, height: h }); await t.until((w) => innerWidth === w, w, 5000);
    await ev(() => { const S = window.__paw.S; S.sleeping = true; window.__paw.go('yard'); }); await t.until(() => window.__paw.mode === 'yard' && !!document.getElementById('placeBtns'), null, 8000); await t.calm(); await t.sleep(600);
    const nap = await ev(() => { const svg = document.querySelector('#view svg.world'), vb = svg.viewBox.baseVal, v = document.getElementById('view').getBoundingClientRect(), M = svg.getScreenCTM().inverse();
      const fj = document.querySelector('#sceneG [data-fuji]').getBoundingClientRect(), fw = new DOMPoint((fj.left + fj.right) / 2, fj.top).matrixTransform(M), a = new DOMPoint(v.left, 0).matrixTransform(M), b = new DOMPoint(v.right, 0).matrixTransform(M);
      const d = document.getElementById('dogArt').getBoundingClientRect(); return { crop: [a.x, b.x].map(Math.round), summit: Math.round(fw.x), dog: [d.left, d.right].map(Math.round), vw: [v.left, v.right].map(Math.round) }; });
    ok(nap.crop[0] <= 488 && nap.crop[1] >= 572 && nap.summit > nap.crop[0] && nap.summit < nap.crop[1] && nap.dog[0] >= nap.vw[0] - 1 && nap.dog[1] <= nap.vw[1] + 1, `${w} px: napping on the hill keeps the bench, Fuji's summit and the dog in the crop ${JSON.stringify(nap)}`);
  }
  await ev(() => { const S = window.__paw.S; S.sleeping = false; }); await p().setViewportSize({ width: 393, height: 659 }); await at('fujihill'); await motion(false);
  await shot('phone_fujihill');
  await quiet(); await motion(true); await ev(() => document.querySelector('#placeBtns [data-jp]').click());
  await t.until(() => !!document.querySelector('#view > svg.world.jp-ease'), null, 4000); await t.sleep(4200); await shot('phone_fujihill_gaze');
  ok(await t.waitToast(/Fuji has nearly no snow/, 8000), 'the look works on the phone');
  await t.until(() => !window.__paw.jp.gazing, null, 9000); await t.sleep(400);
  const dn = await ev(() => { const b = document.querySelector('#placeBtns [data-jp]').getBoundingClientRect(); return [b.width, b.height, new Set([...document.querySelectorAll('#placeBtns .btn')].map((x) => Math.round(x.getBoundingClientRect().top))).size]; });
  ok(dn[1] >= 43.5 && dn[2] === 1, `"Fuji says see you tomorrow." is 44 px and the row stays one line (${Math.round(dn[0])}x${Math.round(dn[1])})`);
  await shot('phone_fujihill_done');
  await t.ctx.close();
}, { prefs: { jpTest: true, wnTest: true, msTest: true } });
