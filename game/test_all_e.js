// all_e (shard 5 of 5 of the old test_all.js): old-save handling + the four v1.7 breeds adopted from scratch.
// Coverage: old save (no sex) -> sex prompt, seed gift exactly once; for chihuahua / pug / greyhound / beagle: 10 dogs in the adoption carousel,
// shelter card + own art, adopted with the right name, drawn in the yard.
require('./test_lib').run('all_e', async (t) => {
  const { ok, sec, ev, S } = t;
  sec('old save: sex prompt + seed gift');
  await t.newGame({}, false);
  const old = await ev(() => { window.__paw.saveNow(); const s = JSON.parse(localStorage.getItem('pawhaven_proto_v1')); const d = s.dogs[0]; delete d.sex; s.seedGiftPending = true; s.inv.seeds = {}; delete s.gkEarly; return JSON.stringify(s); });
  await t.ctx.close();
  let p = await t.mk({ storage: { pawhaven_proto_v1: old } }); await p.goto(require('./test_lib').URL); await p.waitForSelector('#tContinue'); await p.click('#tContinue');
  ok(await t.waitH2(/paperwork/i, 8000), 'old save: sex prompt'); await p.click('#sxM');
  ok(await t.until(() => window.__paw.S.dog.sex === 'male' && window.__paw.S.inv.seeds.carrot === 3, null, 10000), 'sex set, seeds given');
  await t.waitToast(/Pip left a packet/); await t.sleep(400);
  const s0 = await S(); ok(s0.dog.sex === 'male' && s0.inv.seeds.carrot === 3 && (await t.toasts()).filter((x) => /Pip left a packet/.test(x)).length === 1, 'seed gift once');

  sec('v1.7: adopt each new breed and check it renders');
  for (const [k, br, nm] of [['chihuahua', 'Chihuahua', 'Peanut'], ['pug', 'Pug', 'Dumpling'], ['greyhound', 'Greyhound', 'Rocket'], ['beagle', 'Beagle', 'Bagel']]) {
    p = await t.boot(); await p.click('#tNew'); await p.waitForSelector('.heads button');
    ok(await p.locator('.heads button').count() === 10, `${br}: 10 dogs in the adoption carousel`);
    await p.click(`.heads button[aria-label$="the ${br}"]`); await t.until((br) => /the Chihuahua|the Pug|the Greyhound|the Beagle/.test(document.querySelector('.adopt-card h3').textContent) && document.querySelector('.adopt-card h3').textContent.includes(br), br);
    ok(/the Chihuahua|the Pug|the Greyhound|the Beagle/.test(await p.textContent('.adopt-card h3')) && (await p.getAttribute('#adoptDog svg.pa-dog', 'aria-label') || '').includes(br), `${br}: shelter card + art`);
    await p.click('#aBoy'); await p.click('#aAdopt'); await p.waitForSelector('#nOk'); await p.click('#nOk'); await t.intro(); await t.calm();
    const s = await S(); const lab = await p.getAttribute('#dogArt svg.pa-dog', 'aria-label').catch(() => '');
    ok(s.dog.key === k && s.dog.name === nm && (await t.mode()) === 'yard' && (lab || '').includes(br), `${br}: adopted ${nm}, drawn in the yard (${lab})`);
    if (k === 'beagle') await t.SH('20_new_breed_' + k);
    await t.ctx.close();
  }
});
