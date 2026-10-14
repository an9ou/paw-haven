// v2.8 NEW YEAR lane test, V28.md section 8 and 10. Placeholder from the coordinator's stub commit: the lane replaces it.
// node game/run_tests.js v28_newyear
require('./test_lib').run('v28_newyear', async (t) => {
  const p = await t.boot();
  t.ok(await p.locator('#tNew').count() === 1, 'title screen loads');
});
