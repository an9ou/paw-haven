// v2.7 PACK CARE lane test, V27.md. Placeholder from the coordinator's stub commit: the PACK CARE lane replaces it.
// node game/run_tests.js v27_pack
require('./test_lib').run('v27_pack', async (t) => {
  const p = await t.boot();
  t.ok(await p.locator('#tNew').count() === 1, 'title screen loads');
}, { packCare: true });
