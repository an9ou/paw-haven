// v2.7 SHELTER lane test, V27.md. Placeholder from the coordinator's stub commit: the SHELTER lane replaces it.
// node game/run_tests.js v27_shelter
require('./test_lib').run('v27_shelter', async (t) => {
  const p = await t.boot();
  t.ok(await p.locator('#tNew').count() === 1, 'title screen loads');
});
