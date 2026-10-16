// v29_photo (V29.md): stub from the Coordinator. The owning lane replaces it with the real suite.
require('./test_lib').run('v29_photo', async (t) => {
  await t.boot();
  t.ok(true, 'stub: the game loads');
});
