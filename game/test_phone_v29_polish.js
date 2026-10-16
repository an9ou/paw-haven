// phone_v29_polish (V29.md): stub from the Coordinator. The owning lane replaces it with the real suite.
require('./test_lib').run('phone_v29_polish', async (t) => {
  await t.boot({ device: 'iPhone 15' });
  t.ok(true, 'stub: the game loads');
});
