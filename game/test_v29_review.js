// v29_review (V29.md section 6): the integration review fixes (Coordinator). Training another pack dog never reaches the save as the leader,
// photo mode does not open mid-training or mid-tug and keeps the number keys off, the play row has its own refusal line, the sniff summary wording.
// node game/run_tests.js v29_review
require('./test_lib').run('v29_review', async (t) => {
  const { ok, sec } = t; const ev = (f, a) => t.ev(f, a), p = () => t.p;
  await t.newGame({}, { coins: 2000 });
  await ev(() => { const P = window.__paw; P.addDog({ key: 'corgi', sex: 'male', months: 14 }, 'Bun'); P.addDog({ key: 'pug', sex: 'female', months: 30 }, 'Pip'); });
  await t.calm(); await t.home('yard');
  const [A, , C] = (await t.S()).dogs.map((d) => d.id);
  const stored = () => ev(() => JSON.parse(localStorage.getItem('pawhaven_proto_v1')).activeId);

  sec('1. training another dog: the save keeps the leader');
  await p().click('[data-act=play]'); await t.waitPop(true); await p().click('[data-play=tricks]');
  await t.until(() => document.querySelectorAll('#dock .pk-pickb').length === 3, null, 3000);
  await p().click(`#dock [data-pkdog="${C}"]`);
  ok(await t.until((c) => !!window.__paw.train && window.__paw.S.activeId === c, C, 5000), 'Pip trains (active for the session)');
  await ev(() => window.__paw.saveNow());
  ok((await stored()) === A, 'the saved leader is still the leader, not the dog in training');

  sec('2. photo mode is closed to a training session');
  ok((await ev(() => window.__paw.ph.can())) === false, 'no photo while training is open');
  await p().click('#trX');
  ok(await t.until((a) => !window.__paw.train && window.__paw.S.activeId === a, A, 4000), 'closing training puts the leader back');
  await ev(() => window.__paw.saveNow());
  ok((await stored()) === A, 'and the save agrees');

  sec('3. number keys do nothing in photo mode');
  await p().keyboard.press('Escape'); ok(await t.waitPop(false), 'no tray open before the photo');
  await t.until(() => window.__paw.ph.can(), null, 4000);
  await ev(() => window.__paw.ph.open());
  ok(await t.until(() => window.__paw.ph.active(), null, 3000), 'photo mode opens in the yard');
  await p().keyboard.press('2'); await t.sleep(300);
  ok(!(await ev(() => !!document.querySelector('#dock .tray:not(.dock-idle):not(.mini)'))), 'pressing 2 opens no hidden Play tray');
  await ev(() => window.__paw.ph.close());
  ok(await t.until(() => !window.__paw.ph.active(), null, 3000), 'photo mode closes');

  sec('4. the play row refuses with a play line');
  await p().click('[data-act=play]'); await t.waitPop(true);
  await ev((a) => { window.__paw.S.careOff = {}; }, A);
  const chips = await ev(() => [...document.querySelectorAll('#dock [data-crdog]')].map((b) => b.dataset.crdog));
  for (const id of chips.slice(1)) await p().click(`#dock [data-crdog="${id}"]`);
  await p().click(`#dock [data-crdog="${chips[0]}"]`);
  ok(await t.waitToast(/Somebody has to play/), 'unticking the last dog in Play says a play line, not the treat line');
}, { packCare: true });
