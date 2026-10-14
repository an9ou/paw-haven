// v2.8 WINTER lane test, V28.md section 7 and 10. Placeholder from the coordinator's stub commit: the lane replaces it.
// node game/run_tests.js v28_winter
require('./test_lib').run('v28_winter', async (t) => {
  const p = await t.boot();
  t.ok(await p.locator('#tNew').count() === 1, 'title screen loads');
});
