// v171_garden (V171.md Part A): crops grow in real hours, hourly watering, Captain Fluff after 3 h, Pip's 60-coin daily cart,
// old day-based saves convert, hour wording in the UI, dev "+1 hour" / "+1 period", balance script numbers.
// Growth is driven by the Dev panel ticks (the page clock is pinned at 10:00, so real hours never pass during the test).
const fs = require('fs'), path = require('path');
require('./test_lib').run('v171_garden', async (t) => {
  const { ok, sec, ev, S } = t;

  sec('crop table: module = game copy (CROPS_FB), hours per V171');
  const G = require('../mods/garden.js');
  const src = fs.readFileSync(path.join(__dirname, 'src/11_garden_kitchen.js'), 'utf8');
  const fb = eval(src.slice(src.indexOf('const CROPS_FB = [') + 'const CROPS_FB = '.length, src.indexOf('];', src.indexOf('const CROPS_FB = [')) + 1)); // eslint-disable-line no-eval
  ok(JSON.stringify(fb) === JSON.stringify(G.CROPS), 'CROPS_FB in 11_garden_kitchen.js matches PawGarden.CROPS exactly');
  const H = Object.fromEntries(G.CROPS.map((c) => [c.id, c.hours]));
  ok(H.peas === 2 && H.spinach === 2 && H.carrot === 3 && H['sweet-potato'] === 4 && H.blueberries === 4 && H.pumpkin === 6 && G.CROPS.find((c) => c.id === 'blueberries').regrow === 2, `grow hours ${JSON.stringify(H)}, blueberries regrow 2 h`);
  const bal = require('./balance_v171.js');
  ok(bal.maxEffort <= 45 && bal.maxEffortMochi <= 46 && bal.casual < 60 && bal.dishBond <= 37, `balance: max effort ${bal.maxEffort}/day (Mochi ${bal.maxEffortMochi}), casual ${bal.casual}/day, dish Bond ${bal.dishBond}`);

  sec('prepared save; dev hours grow an in-season crop in its real hours');
  await t.newGame({}, { inv: { seeds: { carrot: 3, peas: 3, spinach: 3, pumpkin: 3, 'sweet-potato': 3, blueberries: 3 } } }); const p = t.p;
  await t.home('yard');
  const info = await ev(() => { const G = window.PawGarden, S = window.__paw.S, m = new Date().getMonth() + 1, sz = G.seasonOf(m); const c = G.CROPS.filter((x) => x.seasons.includes(sz)).sort((a, b) => a.hours - b.hours)[0]; return { crop: c.id, hours: c.hours, buddy: G.BUDDY[S.dog.key] || null, month: m, v: S.garden.v, last: S.garden.last }; });
  ok(info.v === 2 && /-h10$/.test(info.last), `new garden runs on the hourly clock (v2, last ${info.last})`);
  ok(info.buddy !== 'guard', `adopted dog's buddy perk is not "guard" (${info.buddy}), so Captain Fluff can be tested`);
  // plant + water plot 0 with the fastest in-season crop (pure module call, the same one the garden screen uses)
  const prep = (fn, arg) => ev((a) => { const S = window.__paw.S, G = window.PawGarden; S.garden = new Function('S', 'G', 'a', a.fn)(S, G, a.arg); window.__paw.saveNow(); }, { fn: fn.toString().replace(/^[^{]*\{|\}$/g, ''), arg });
  await prep(function () { let g = S.garden; g = G.plant(g, 0, a.crop, { month: a.month }).state; return G.water(g, 0); }, info);
  const toYard = async () => { for (let i = 0; i < 5 && (await t.mode()) !== 'yard'; i++) { await p.keyboard.press('Escape'); await t.untilMode('yard', 700); } return (await t.mode()) === 'yard'; };
  const openG = () => t.retryUntil(() => p.click('#sceneG [data-hot=garden]'), () => window.__paw.mode === 'garden', null, { tries: 5, each: 2500 });
  const tick = async (n, w, which) => t.dev(async () => { await p.selectOption('#dvGW', w || 'cloudy'); for (let i = 0; i < n; i++) await p.click(which || '#dvGHour'); });
  ok(await openG(), 'garden opens'); await p.waitForSelector('.pg-plot[data-i="0"]');
  await p.click('.pg-plot[data-i="0"]');
  const eta = await p.textContent('.pg-info'); await t.SH('01_plot_info_hours');
  ok(new RegExp(`Ready in about ${info.hours} hours`).test(eta) && /about \d+ hours? left/.test(eta), `plot info speaks hours: "${eta.replace(/\s+/g, ' ').slice(0, 120)}"`);
  await p.click('.pg-tool[data-t="seeds"]'); await p.waitForSelector('.pg-pk');
  const pouch = await p.textContent('.pg-pouch'); await t.SH('02_seed_pouch');
  ok(/2 hours/.test(pouch) && !/days/.test(pouch), 'seed pouch shows hours, never days');
  ok(await toYard(), 'back to the yard');
  await tick(info.hours - 1, 'cloudy');
  let s = await S(); ok(s.garden.plots[0].g < 1 && Math.abs(s.garden.plots[0].g - (info.hours - 1) / info.hours) < 1e-6, `${info.crop}: after ${info.hours - 1} cloudy hour(s) g = ${s.garden.plots[0].g.toFixed(3)} (not ready)`);
  await ev(() => window.__toasts.splice(0));
  await tick(1, 'cloudy');
  s = await S(); ok(s.garden.plots[0].g === 1 && /-h\d+$/.test(s.garden.plots[0].ready), `${info.crop}: ready after exactly ${info.hours} hours (ready at ${s.garden.plots[0].ready})`);
  ok(await t.waitToast(/ready!/), 'toast: the crop is ready');
  ok(s.garden.last === s.garden.plots[0].ready, 'dev +1 hour moved the garden clock by one hour per click');
  const l0 = s.garden.last; await tick(1, 'cloudy', '#dvGStep'); s = await S();
  const hi = (k) => { const m = /^(\d+)-(\d+)-(\d+)-h(\d+)$/.exec(k); return Math.round(Date.UTC(+m[1], m[2] - 1, +m[3]) / 864e5) * 24 + +m[4]; };
  ok(hi(s.garden.last) - hi(l0) === 8, `dev "+1 period" = 8 garden hours (${l0} -> ${s.garden.last})`);

  sec('watering: 3 drops, sunny 1/h, cloudy 1 per 2 h, night 1 per 3 h; dry pauses; rain refills');
  // a pumpkin (6 h, 12 h off-season) on plot 1, full water, g = 0
  const fresh = (water) => prep(function () { let g = S.garden; g.plots[1] = Object.assign({}, g.plots[1], { crop: null }); g = G.plant(g, 1, 'pumpkin', { month: 10 }).state; g = G.water(g, 1); g.plots[1].water = a; return g; }, water);
  await fresh(3); await tick(1, 'sunny'); s = await S(); ok(s.garden.plots[1].water === 2, `sunny: 1 hour costs 1 drop (3 -> ${s.garden.plots[1].water})`);
  await fresh(3); await tick(1, 'cloudy'); s = await S(); const c1 = s.garden.plots[1].water; await tick(1, 'cloudy'); s = await S();
  ok(c1 === 3 && s.garden.plots[1].water === 2, `cloudy: 1 drop every 2 hours (3 -> ${c1} -> ${s.garden.plots[1].water})`);
  await fresh(3);
  await t.dev(async () => { await p.selectOption('#dvTime', 'night'); }); await tick(2, 'cloudy'); s = await S(); const n2 = s.garden.plots[1].water; await tick(1, 'cloudy'); s = await S();
  await t.dev(async () => { await p.selectOption('#dvTime', 'day'); }); // back to the test pin
  ok(n2 === 3 && s.garden.plots[1].water === 2, `night: 1 drop every 3 hours (3 -> ${n2} after 2 h -> ${s.garden.plots[1].water} after 3 h)`);
  await fresh(1); await tick(1, 'sunny'); s = await S(); const gDry = s.garden.plots[1].g;
  ok(s.garden.plots[1].water === 0 && gDry > 0, `last drop: the plot grew that hour, then dried (g ${gDry.toFixed(3)}, water 0)`);
  await tick(2, 'sunny'); s = await S();
  ok(s.garden.plots[1].g === gDry && s.garden.plots[1].dry >= 1 && s.garden.plots[1].crop === 'pumpkin', `dry plot pauses growth (g stays ${s.garden.plots[1].g.toFixed(3)}, dry ${s.garden.plots[1].dry} h) and nothing dies`);
  // the yard hotspots lose their click handlers after a weather/time change re-draws the scene (checkEnv, CORE lane), so use the place button here
  ok(await t.retryUntil(() => p.click('[data-pb=garden]'), () => window.__paw.mode === 'garden', null, { tries: 4, each: 2500 }), 'garden reopens (place button)'); await p.waitForSelector('.pg-plot[data-i="1"]'); await p.click('.pg-plot[data-i="1"]');
  ok(/Thirsty: not growing until watered/.test(await p.textContent('.pg-info')), 'plot info: "Thirsty: not growing until watered."');
  await toYard();
  await tick(1, 'rain'); s = await S(); ok(s.garden.plots[1].water === 3 && s.garden.plots[1].g > gDry, `rain refills every plot (water ${s.garden.plots[1].water}) and growth resumes`);
  await tick(1, 'snow'); s = await S(); const gSnow = s.garden.plots[1].g; await tick(1, 'snow'); s = await S();
  ok(s.garden.plots[1].g === gSnow && s.garden.plots[1].water === 3, 'snow pauses a (non-hardy) crop and uses no water');

  sec('Captain Fluff: only after a ready crop is left 3 hours, takes 1');
  await prep(function () { const g = S.garden; g.plots[2] = Object.assign({}, g.plots[2], { crop: 'carrot', g: 1, ready: g.last, took: 0, water: 3, planted: g.last, dry: 0, harvested: 0 }); return g; });
  await ev(() => window.__toasts.splice(0));
  await tick(2, 'cloudy'); s = await S(); ok(s.garden.plots[2].took === 0, 'ready for 2 hours: the carrots are untouched');
  await tick(1, 'cloudy'); s = await S(); ok(s.garden.plots[2].took === 1, 'ready for 3 hours: Captain Fluff took one');
  ok(await t.waitToast(/Captain Fluff took one carrot/), 'toast: "Captain Fluff took one carrot and left an IOU."');
  await tick(3, 'cloudy'); s = await S(); ok(s.garden.plots[2].took === 1, 'and only ever one');
  const hv = await ev(() => window.PawGarden.harvest(window.__paw.S.garden, 2, {}).items.length); ok(hv === 1, `harvest gives yield 2 - 1 = ${hv}`);

  sec("Pip's cart: at most 60 coins of crops per real day");
  await t.patch({ inv: { crops: { carrot: [50, 0, 0] } }, pipSold: null });
  await t.travel('market'); await p.click('#placeBtns [data-sh=sprout]'); await p.waitForSelector('[data-ptab=seeds]');
  ok(/ready in about 2 hours/.test(await p.textContent('#modal .panel')), "Pip's seed descriptions use hours");
  await p.click('[data-ptab=sell]'); await p.waitForSelector('.pipcap');
  ok(/Pip's cart today: 0 \/ 60/.test(await p.textContent('.pipcap')), 'sell tab shows the cart: 0 / 60');
  const c0 = (await S()).coins;
  await p.locator('[data-sell^="carrot"]').first().click(); await p.waitForSelector('.buyveil');
  await t.SH('03_sell_window'); ok(/room for 30 more/.test(await p.textContent('.buybox')), 'sell window: Pip has room for 30 carrots (2 coins each)');
  await p.click('.buyveil [data-qq=max]'); await t.until(() => /Total: 60/.test(document.querySelector('.bb-sum').textContent));
  ok(/Total: 60 coins/.test(await p.textContent('.bb-sum')), 'Max = 30 carrots = 60 coins, not all 50');
  await p.click('.bb-yes'); ok(await t.until((c) => window.__paw.S.coins === c + 60, c0), 'sold for exactly 60 coins');
  s = await S(); ok(s.inv.crops.carrot[0] === 20 && s.pipSold.coins === 60, `20 carrots stay in the basket for cooking; pipSold ${JSON.stringify(s.pipSold)}`);
  ok(await t.waitToast(/Pip's cart is full! Back tomorrow\./), 'toast: "Pip\'s cart is full! Back tomorrow."');
  await p.waitForSelector('.pipcap[data-full]'); ok(/Pip's cart is full! Back tomorrow\./.test(await p.textContent('.pipcap')), 'sell tab says the cart is full'); await t.SH('04_pip_cart_full');
  await ev(() => window.__toasts.splice(0)); await p.locator('[data-sell^="carrot"]').first().click({ force: true }); // a toast may sit on top of it
  ok(await t.waitToast(/Pip's cart is full! Back tomorrow\./) && !(await p.locator('.buyveil').count()) && (await S()).coins === c0 + 60, 'a full cart sells nothing more today');
  await t.closeX();
  await t.patch({ pipSold: { date: '2000-1-1', coins: 60 } });
  await p.click('#placeBtns [data-sh=sprout]'); await p.waitForSelector('[data-ptab=sell]'); await p.click('[data-ptab=sell]'); await p.waitForSelector('.pipcap');
  ok(/Pip's cart today: 0 \/ 60/.test(await p.textContent('.pipcap')), 'a new day empties the cart');
  await t.closeX();

  sec('Journal: Garden tab in hours');
  await p.click('[data-act=journal]'); await p.waitForSelector('.panel.journal'); await p.click('[data-jt=garden]'); await p.waitForSelector('[data-jopen=garden]');
  const jt = await p.textContent('.panel.journal'); await t.SH('05_journal_garden');
  ok(/Ready in about 2 hours/.test(jt) && /regrows in 2 hours/.test(jt) && !/\d+ days?\b/.test(jt), 'Garden tab: "Ready in about 2 hours", "regrows in 2 hours", no "N days"');
  await t.closeX();

  sec('old save with day-based timers converts proportionally');
  const old = await ev(() => {
    const d = new Date(), k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`, pk = (p) => `${k}-${p}`;
    const e = { crop: null, g: 0, water: 0, dry: 0, inSeason: true, inspected: false, ready: null, took: 0, planted: null, harvested: 0 };
    const S = window.__paw.S;
    S.garden = { v: 1, last: pk(1), harvests: { carrot: 2 }, plots: [
      Object.assign({}, e, { crop: 'carrot', g: 0.5, water: 2, planted: pk(0) }),          // half grown on the old 3-day timer
      Object.assign({}, e, { crop: 'peas', g: 1, water: 1, ready: pk(0), planted: pk(0) }), // ready for 1 old period (of the squirrel's 3)
      Object.assign({}, e, { crop: 'pumpkin', g: 0.25, water: 3, planted: pk(0) }), e, e, e] };
    window.__paw.saveNow(); return { day: k };
  });
  await p.reload(); await p.waitForSelector('#tContinue'); await p.click('#tContinue'); await t.untilMode('yard'); await t.lu(); await t.calm();
  s = await S(); const gd = s.garden;
  ok(gd.v === 2 && gd.last === `${old.day}-h15`, `converted to the hourly clock: v ${gd.v}, last ${gd.last} (end of the old 08-16 period)`);
  ok(gd.plots[0].g === 0.5 && gd.plots[2].g === 0.25 && gd.plots[0].water === 2 && gd.harvests.carrot === 2, 'progress and water kept: carrot g 0.5 -> 1.5 of 3 hours left, pumpkin g 0.25 -> 4.5 of 6 hours left');
  ok(gd.plots[1].ready === `${old.day}-h14` && gd.plots[1].took === 0, `squirrel timer converted 1 period -> 1 hour (ready ${gd.plots[1].ready})`);
  const left = await ev(() => { const G = window.PawGarden, S = window.__paw.S, m = new Date().getMonth() + 1; return [G.hoursLeft(S.garden.plots[0], m), G.CROPS.find((c) => c.id === 'carrot').seasons.includes(G.seasonOf(m)) ? 1 : 0.5]; });
  ok(Math.abs(left[0] - 1.5 / left[1]) < 1e-9, `remaining time = (1 - g) x new grow time: ${left[0]} h`);
  await tick(2, 'cloudy'); s = await S(); ok(s.garden.plots[1].took === 1, 'the converted ready peas meet Captain Fluff 3 hours after they were ready');
});
