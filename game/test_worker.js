// WORKER (v2.8.1): the Cloudflare login and cloud save API (cloudflare/worker.js) against a local D1 (v2.9.1: no Supabase any more).
//   NODE_PATH=$(npm root -g) node game/test_worker.js      (or: node game/run_tests.js worker)
// Runs the same checks twice when it can: in Miniflare (workerd + a real local D1, from the global wrangler install) and
// in-process in Node (cloudflare/d1_node.js over node:sqlite). Node-only: prints ALL OK when every check passes.
process.removeAllListeners('warning'); // node:sqlite is still "experimental" on Node 22
const path = require('path'), crypto = require('crypto');
const ROOT = path.join(__dirname, '..');
let fails = 0, passes = 0;
const ok = (c, m) => { if (c) passes++; else { fails++; console.log('  FAIL', m); } };
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

const { fakeMail } = require('./cloud_mock');

/* ---------------- the checks (same for both backends) ---------------- */
async function checks(label, call, sql, mail) {
  console.log(`--- ${label}`);
  const save = (coins, extra) => Object.assign({ v: 1, coins, dogs: [{ id: 'dog1', name: 'Mochi' }], dog: { id: 'dog1', name: 'Mochi' } }, extra || {});

  let r = await call('GET', '/');
  ok(r.status === 200 && r.json.ok, 'GET / answers');

  // CORS: only the game's own origins
  for (const o of ['https://doodledoggo.app', 'https://www.doodledoggo.app', 'https://an9ou.github.io', 'https://html-classic.itch.zone', 'https://html.itch.zone', 'http://localhost:8765', 'http://127.0.0.1:8765']) {
    r = await call('OPTIONS', '/save', null, null, { Origin: o, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization,content-type' });
    ok(r.status === 204 && r.headers.get('access-control-allow-origin') === o && /Authorization/.test(r.headers.get('access-control-allow-headers')), `CORS preflight allowed for ${o}`);
  }
  for (const o of ['https://evil.example', 'https://doodledoggo.app.evil.example', 'null', 'https://claude.ai']) {
    r = await call('OPTIONS', '/save', null, null, { Origin: o });
    ok(r.status === 403 && !r.headers.get('access-control-allow-origin'), `CORS refused for ${o}`);
  }
  r = await call('POST', '/guest', {}, null, { Origin: 'https://doodledoggo.app' });
  ok(r.headers.get('access-control-allow-origin') === 'https://doodledoggo.app', 'a real request from the game carries the CORS header');

  // a guest and its save
  const g = (await call('POST', '/guest', {})).json;
  ok(g.token && g.token.length >= 40 && g.user.guest === true && !g.user.email, 'POST /guest makes a guest with a bearer token');
  r = await call('GET', '/me', null, g.token); ok(r.status === 200 && r.json.user.id === g.user.id && r.json.user.guest, 'GET /me knows the guest');
  ok((await call('GET', '/me')).status === 401 && (await call('GET', '/me', null, 'x'.repeat(43))).status === 401, 'no token or a wrong token: 401');
  r = await call('GET', '/save', null, g.token); ok(r.status === 200 && r.json.save === null, 'no save yet');
  const s1 = save(100), t1 = new Date(Date.now() - 5000).toISOString();
  r = await call('PUT', '/save', { data: s1, rev: 1, changed_at: t1, device: 'iPhone Safari' }, g.token); ok(r.status === 200 && r.json.rev === 1, 'PUT /save rev 1');
  r = await call('GET', '/save', null, g.token);
  ok(r.status === 200 && r.text.includes(JSON.stringify(s1)) && r.json.save.rev === 1 && r.json.save.device === 'iPhone Safari' && Date.parse(r.json.save.changed_at) === Date.parse(t1), 'GET /save returns the same JSON text, rev, device and changed_at');
  r = await call('GET', '/save?meta=1', null, g.token); ok(r.json.save.rev === 1 && !('data' in r.json.save), 'GET /save?meta=1 is rev and changed_at only');
  r = await call('PUT', '/save', { data: save(5), rev: 1, changed_at: t1 }, g.token);
  ok(r.status === 409 && r.json.error === 'stale' && r.json.rev === 1, 'a PUT with a rev the cloud already has is refused (409 stale)');
  ok((await call('GET', '/save', null, g.token)).json.save.data.coins === 100, 'the refused PUT changed nothing');
  ok((await call('PUT', '/save', { data: { v: 2 }, rev: 2, changed_at: t1 }, g.token)).status === 400, 'a save that is not v 1 is refused');
  ok((await call('PUT', '/save', { data: save(1, { big: 'x'.repeat(530000) }), rev: 2, changed_at: t1 }, g.token)).status === 413, 'a save of 512 KB or more is refused');
  ok((await call('PUT', '/save', { data: s1, rev: 2, changed_at: t1 })).status === 401, 'PUT /save needs a session');
  r = await call('POST', '/register', 'not json', g.token); ok(r.status === 400, 'bad JSON: 400');

  // register: the guest becomes the account (same id, same save)
  r = await call('POST', '/register', { email: 'mochi@example.com', password: 'short' }, g.token); ok(r.status === 400 && r.json.error === 'weak_password', 'a password under 8 characters is refused');
  r = await call('POST', '/register', { email: 'not-an-email', password: 'pupper123' }, g.token); ok(r.status === 400 && r.json.error === 'invalid_email', 'a bad email is refused');
  r = await call('POST', '/register', { email: ' Mochi@Example.com ', password: 'pupper123' }, g.token);
  ok(r.status === 200 && r.json.upgraded === true && r.json.user.id === g.user.id && r.json.user.email === 'mochi@example.com' && !r.json.user.guest, 'register on a guest keeps the user id (email stored in lower case)');
  const a = r.json;
  ok((await call('GET', '/me', null, g.token)).status === 401, 'the guest token is replaced by a fresh one');
  ok((await call('GET', '/save', null, a.token)).json.save.data.coins === 100, 'the account keeps the guest save');
  r = await call('POST', '/register', { email: 'MOCHI@example.com', password: 'pupper999' }); ok(r.status === 409 && r.json.error === 'email_exists', 'an email that has an account is refused (any case)');

  // the stored secrets
  const u = await sql('select * from users where id = ?', a.user.id);
  ok(/^[0-9a-f]{64}$/.test(u.pw_hash) && /^[0-9a-f]{32}$/.test(u.pw_salt) && !JSON.stringify(u).includes('pupper123'), 'the password is a PBKDF2 hash with a 16-byte salt, never plain');
  ok(u.pw_hash === crypto.pbkdf2Sync('pupper123', Buffer.from(u.pw_salt, 'hex'), 100000, 32, 'sha256').toString('hex'), 'PBKDF2-SHA256 with 100k iterations');
  const sess = await sql('select * from sessions where user_id = ? order by created_at desc', a.user.id);
  ok(sess && sess.token_hash === sha(a.token) && !JSON.stringify(sess).includes(a.token), 'sessions store only the SHA-256 of the token');

  // login and logout
  r = await call('POST', '/login', { email: 'mochi@example.com', password: 'wrongpass1' }); ok(r.status === 401 && r.json.error === 'invalid_credentials', 'wrong password: invalid_credentials');
  r = await call('POST', '/login', { email: 'nobody@example.com', password: 'whatever1' }); ok(r.status === 401 && r.json.error === 'invalid_credentials', 'unknown email: invalid_credentials');
  ok(!(await sql('select * from users where email = ?', 'nobody@example.com')), 'a failed login makes no user');
  r = await call('POST', '/login', { email: 'Mochi@example.com', password: 'pupper123' }); ok(r.status === 200 && r.json.user.id === a.user.id && r.json.migrated === undefined, 'right password logs in');
  const d2 = r.json.token;
  ok((await call('GET', '/save', null, d2)).json.save.data.coins === 100, 'a second device reads the same save');
  r = await call('PUT', '/save', { data: save(200), rev: 2, changed_at: new Date().toISOString(), device: 'Pixel Chrome' }, d2); ok(r.json.rev === 2, 'device 2 pushes rev 2');
  ok((await call('GET', '/save', null, a.token)).json.save.data.coins === 200, 'device 1 pulls rev 2');
  r = await call('POST', '/password', { password: 'pupper456' }, a.token); ok(r.status === 200, 'change password');
  ok((await call('POST', '/login', { email: 'mochi@example.com', password: 'pupper123' })).status === 401 && (await call('POST', '/login', { email: 'mochi@example.com', password: 'pupper456' })).status === 200, 'the old password stops working, the new one works');
  ok((await call('POST', '/password', { password: 'pupper789' }, (await call('POST', '/guest', {})).json.token)).status === 403, 'a guest has no password to change');
  r = await call('POST', '/logout', {}, d2); ok(r.status === 200 && (await call('GET', '/me', null, d2)).status === 401, 'log out ends that session');
  ok((await call('GET', '/me', null, a.token)).status === 200, 'other devices stay logged in');

  // a fresh account while logged in to an account or a guest with fresh: a new user
  const g2 = (await call('POST', '/guest', {})).json;
  r = await call('POST', '/register', { email: 'second@example.com', password: 'biscuits9', fresh: true }, g2.token);
  ok(r.status === 200 && r.json.upgraded === false && r.json.user.id !== g2.user.id, 'register with fresh makes a new user, the guest stays');
  r = await call('POST', '/register', { email: 'third@example.com', password: 'biscuits9' }, a.token);
  ok(r.status === 200 && r.json.upgraded === false && r.json.user.id !== a.user.id, 'register while logged in to an account never renames it');
  ok((await call('GET', '/me', null, a.token)).json.user.email === 'mochi@example.com', 'the first account keeps its email');

  // backups: the newest 5
  for (let i = 1; i <= 7; i++) await call('POST', '/backups', { data: save(i), reason: 'older than your other device' }, a.token);
  r = await call('GET', '/backups', null, a.token);
  ok(r.json.backups.length === 5 && r.json.backups.map((b) => b.data.coins).join() === '7,6,5,4,3' && r.json.backups[0].reason === 'older than your other device' && r.json.backups[0].created_at, 'GET /backups: the newest 5, newest first, with reason and time');
  ok((await sql('select count(*) as n from save_backups where user_id = ?', a.user.id)).n === 5, 'older backups are trimmed in D1');
  ok((await call('GET', '/backups', null, g2.token)).json.backups.length === 0, 'backups are per player');

  // rate limits
  let codes = [];
  for (let i = 0; i < 11; i++) codes.push((await call('POST', '/login', { email: 'mochi@example.com', password: 'nope-nope-' + i }, null, { 'CF-Connecting-IP': '10.0.0.' + i })).status);
  ok(codes[0] === 401 && codes[codes.length - 1] === 429, `login is rate-limited per email (${codes.join(' ')})`);
  r = await call('POST', '/login', { email: 'mochi@example.com', password: 'pupper456' }, null, { 'CF-Connecting-IP': '10.0.1.1' }); ok(r.status === 429 && r.json.error === 'rate_limited', 'even the right password waits out the limit');
  codes = [];
  for (let i = 0; i < 31; i++) codes.push((await call('POST', '/login', { email: `x${i}@example.com`, password: 'nope-nope-1' }, null, { 'CF-Connecting-IP': '10.9.9.9' })).status);
  ok(codes[0] === 401 && codes[30] === 429, 'login is rate-limited per IP');
  ok((await call('POST', '/login', { email: 'second@example.com', password: 'biscuits9' }, null, { 'CF-Connecting-IP': '10.9.9.10' })).status === 200, 'other IPs and emails still log in');

  // v2.9.1: Supabase is gone. An old Supabase email is just an email nobody has: it can sign up, and nothing is carried over.
  r = await call('POST', '/login', { email: 'legacy@example.com', password: 'oldpass123' }); ok(r.status === 401 && r.json.error === 'invalid_credentials', 'an old Supabase email cannot log in (no account here): invalid_credentials');
  ok(!(await sql('select * from users where email = ?', 'legacy@example.com')), 'and no user is made for it');
  const gR = (await call('POST', '/guest', {})).json;
  r = await call('POST', '/register', { email: 'Legacy@example.com', password: 'newpass123' }, gR.token);
  ok(r.status === 200 && r.json.upgraded === true && r.json.user.email === 'legacy@example.com', 'an old Supabase email can sign up now (no more 409 from the legacy list)');
  ok((await call('POST', '/register', { email: 'legacy@example.com', password: 'other-pass-1' })).status === 409, 'and then it has one account');
  ok((await call('POST', '/login', { email: 'legacy@example.com', password: 'newpass123' })).status === 200, 'which logs in with the new password');
  ok(!(await sql("select name from sqlite_master where type = 'table' and name = 'legacy'")), 'the legacy table is gone');
  r = await call('POST', '/migrate', { access_token: 'sbat_bogus', refresh_token: 'sbrt_bogus' }); ok(r.status === 410 && r.json.error === 'gone', 'POST /migrate answers 410 gone');
  r = await call('POST', '/register', { email: 'carry2@example.com', password: 'carrypass2' }); const other = r.json;
  r = await call('POST', '/login', { email: 'carry2@example.com', password: 'zzzzzzzz9' }); ok(r.status === 401, 'a wrong password on a registered email is refused');
  ok((await call('GET', '/me', null, other.token)).json.user.id === other.user.id, 'that account is untouched');

  // Forgot password (v2.9.2): an emailed 6-digit code, typed in the game (no website link)
  const fu = (await call('POST', '/register', { email: 'forgetful@example.com', password: 'forgetful1' }, null, { 'CF-Connecting-IP': '10.6.6.5' })).json;
  const fd2 = (await call('POST', '/login', { email: 'forgetful@example.com', password: 'forgetful1' })).json; // a second device
  const rc = (email, code, password, ip) => call('POST', '/reset-code', { email, code, password }, null, ip ? { 'CF-Connecting-IP': ip } : undefined);
  const other6 = (c) => String((Number(c) + 1) % 1e6).padStart(6, '0'); // a wrong code, for sure
  let m0 = mail.mails.length;
  r = await call('POST', '/forgot', { email: 'nobody-here@example.com' });
  ok(r.status === 200 && r.json.ok && r.json.mail === true && mail.mails.length === m0, 'an unknown email: the same answer, no email');
  ok((await call('POST', '/forgot', { email: 'not-an-email' })).status === 400, 'a malformed email: 400');
  r = await call('POST', '/forgot', { email: 'Forgetful@example.com' }, null, { Origin: 'https://an9ou.github.io' });
  const fm = mail.mails[mail.mails.length - 1];
  ok(r.status === 200 && r.json.mail === true && mail.mails.length === m0 + 1 && fm.to[0] === 'forgetful@example.com' && /noreply@doodledoggo\.app/.test(fm.from), 'a known email gets one email from noreply@doodledoggo.app, same answer');
  ok(/^\d{6}$/.test(fm.code) && fm.html.includes(fm.code), 'the email carries a 6-digit code');
  ok(fm.subject === 'Your Doodle Doggo code' && fm.text.startsWith(`Your Doodle Doggo code is ${fm.code}. It works for 30 minutes. If you didn't ask for it, ignore this email.`), "the owner's wording: Your Doodle Doggo code is 123456. It works for 30 minutes...");
  ok(!/https?:\/\//.test(fm.text) && !/href=/.test(fm.html), 'no website link in the email');
  let row = await sql('select * from reset_codes where k = ?', sha('forgetful@example.com'));
  ok(row && row.code_hash === sha(row.salt + ':' + fm.code) && row.salt.length === 32 && !Object.values(row).includes(fm.code), 'only a salted SHA-256 of the code is stored, keyed by the email\'s SHA-256');
  ok(row.expires_at - row.created_at === 30 * 60 * 1000 && row.tries === 0, 'the code works for 30 minutes');
  ok((await rc('forgetful@example.com', fm.code, 'short')).json.error === 'weak_password', 'the new password needs 8 or more characters (same rule as Make an account)');
  ok((await rc('forgetful@example.com', '12345', 'remembered1')).json.error === 'wrong_code', 'not six digits: wrong_code');
  ok((await sql('select tries from reset_codes where k = ?', sha('forgetful@example.com'))).tries === 0, 'a short password or a code that is not 6 digits costs no try');
  r = await rc('forgetful@example.com', other6(fm.code), 'remembered1');
  ok(r.status === 400 && r.json.error === 'wrong_code' && r.json.left === 4, 'a wrong code: wrong_code, 4 tries left');
  r = await rc(' Forgetful@Example.com ', ' ' + fm.code.slice(0, 3) + ' ' + fm.code.slice(3), 'remembered1');
  ok(r.status === 200 && r.json.user.id === fu.user.id && r.json.token && r.json.user.email === 'forgetful@example.com' && !r.json.user.guest, 'the right code sets the new password and logs in (spaces and capitals are fine)');
  ok((await call('GET', '/me', null, fu.token)).status === 401 && (await call('GET', '/me', null, fd2.token)).status === 401 && (await call('GET', '/me', null, r.json.token)).status === 200, 'a reset logs every other device out, this one stays in');
  ok((await call('POST', '/login', { email: 'forgetful@example.com', password: 'forgetful1' })).status === 401 && (await call('POST', '/login', { email: 'forgetful@example.com', password: 'remembered1' })).status === 200, 'the old password stops working, the new one works');
  r = await rc('forgetful@example.com', fm.code, 'again-again1'); ok(r.status === 400 && r.json.error === 'expired', 'a code works only once');
  // 5 wrong tries kill the code
  await call('POST', '/forgot', { email: 'forgetful@example.com' }); const fk = mail.mails[mail.mails.length - 1];
  const tries = [];
  for (let i = 0; i < 5; i++) { const x = (await rc('forgetful@example.com', other6(fk.code), 'killed-code1')).json; tries.push(x.error + ':' + x.left); }
  ok(tries.join(' ') === 'wrong_code:4 wrong_code:3 wrong_code:2 wrong_code:1 too_many_tries:0', 'wrong tries count down, the 5th says too_many_tries ' + tries.join(' '));
  r = await rc('forgetful@example.com', fk.code, 'killed-code1');
  ok(r.status === 400 && r.json.error === 'too_many_tries', 'after 5 wrong tries even the right code is dead');
  ok((await call('POST', '/login', { email: 'forgetful@example.com', password: 'remembered1' })).status === 200, 'and the password did not change');
  await call('POST', '/forgot', { email: 'forgetful@example.com' }); const fk2 = mail.mails[mail.mails.length - 1];
  ok((await rc('forgetful@example.com', fk2.code, 'fresh-code-1')).status === 200, 'a new code works again after a dead one');
  // expiry and replacement
  const ip2 = { 'CF-Connecting-IP': '10.6.6.6' };
  await call('POST', '/register', { email: 'forgetful2@example.com', password: 'forgetful2' }, null, ip2); // "make an account" allows 10 an hour per IP
  await call('POST', '/forgot', { email: 'forgetful2@example.com' }, null, ip2); const f1 = mail.mails[mail.mails.length - 1];
  await sql('update reset_codes set expires_at = ? where k = ?', Date.now() - 1, sha('forgetful2@example.com'), true);
  ok((await rc('forgetful2@example.com', f1.code, 'late-late-1')).json.error === 'expired', 'a code older than 30 minutes: expired');
  await call('POST', '/forgot', { email: 'forgetful2@example.com' }, null, ip2); const f2 = mail.mails[mail.mails.length - 1];
  await call('POST', '/forgot', { email: 'forgetful2@example.com' }, null, ip2); const f3 = mail.mails[mail.mails.length - 1];
  ok((await sql('select count(*) as n from reset_codes where k = ?', sha('forgetful2@example.com'))).n === 1, 'one code row per email');
  ok(f2.code === f3.code || (await rc('forgetful2@example.com', f2.code, 'older-code-1')).json.error === 'wrong_code', 'a new code replaces the old one');
  ok((await rc('forgetful2@example.com', f3.code, 'newest-code1')).status === 200, 'only the newest code works');
  // per-email limit on /forgot (quiet), per-IP limit (429)
  const ip3 = { 'CF-Connecting-IP': '10.6.6.7' };
  await call('POST', '/register', { email: 'forgetful3@example.com', password: 'forgetful3' }, null, ip3);
  m0 = mail.mails.length; for (let i = 0; i < 5; i++) await call('POST', '/forgot', { email: 'forgetful3@example.com' }, null, ip3);
  const last3 = mail.mails[mail.mails.length - 1];
  r = await call('POST', '/forgot', { email: 'forgetful3@example.com' }, null, ip3);
  ok(mail.mails.length === m0 + 5 && r.status === 200 && r.json.mail === true, 'at most 5 codes an hour per email (the 6th: the same answer, no email)');
  ok((await rc('forgetful3@example.com', last3.code, 'still-works1')).status === 200, 'and the quiet 6th left the last code working');
  codes = [];
  for (let i = 0; i < 11; i++) codes.push((await call('POST', '/forgot', { email: `ip${i}@example.com` }, null, { 'CF-Connecting-IP': '10.7.7.7' })).status);
  ok(codes[0] === 200 && codes[10] === 429, 'Forgot password is rate-limited per IP');
  codes = [];
  for (let i = 0; i < 31; i++) codes.push((await rc(`guess${i}@example.com`, '123456', 'guessing-1', '10.5.5.5')).status);
  ok(codes[0] === 400 && codes[29] === 400 && codes[30] === 429, 'typing codes is rate-limited per IP (30 in 10 minutes)');
  // no account leak: an email with no account answers exactly like one with an account
  m0 = mail.mails.length; r = await call('POST', '/forgot', { email: 'NeverHadOne@example.com' });
  ok(r.status === 200 && r.json.mail === true && mail.mails.length === m0, 'an email with no account gets the same answer and no mail');
  const a1 = await rc('neverhadone@example.com', '000000', 'whatever-1');
  await call('POST', '/forgot', { email: 'forgetful@example.com' });
  const b2 = await rc('forgetful@example.com', mail.mails[mail.mails.length - 1].code === '000000' ? '000001' : '000000', 'whatever-1');
  ok(a1.status === b2.status && a1.text === b2.text && a1.json.error === 'wrong_code' && a1.json.left === 4, 'a wrong code: the same answer with or without an account ' + a1.text + ' / ' + b2.text);
  for (let i = 0; i < 4; i++) await rc('neverhadone@example.com', '000000', 'whatever-1');
  ok((await rc('neverhadone@example.com', '000000', 'whatever-1')).json.error === 'too_many_tries', 'and 5 wrong tries end the same way');
  const n1 = await rc('never-asked@example.com', '123456', 'whatever-1'), n2 = await rc('carry2@example.com', '123456', 'whatever-1');
  ok(n1.status === 400 && n1.text === n2.text && n1.json.error === 'expired', 'no code asked for: expired, with or without an account');
  // the v2.8.2 links already sent keep working until they run out (no new ones are made)
  const old = 'L'.repeat(43);
  await sql('insert into resets (token_hash, user_id, created_at, expires_at) values (?, ?, ?, ?)', sha(old), fu.user.id, Date.now(), Date.now() + 6e5, true);
  ok((await call('POST', '/reset', { token: old, password: 'from-a-link1' })).status === 200 && (await call('POST', '/login', { email: 'forgetful@example.com', password: 'from-a-link1' })).status === 200, 'an old emailed link still sets the password');
  ok((await call('POST', '/reset', { token: old, password: 'again-again1' })).json.error === 'expired', 'an old link works only once');
  ok((await call('POST', '/reset', { token: 'x'.repeat(43), password: 'whatever-1' })).json.error === 'expired' && (await call('POST', '/reset', { password: 'whatever-1' })).json.error === 'expired', 'a made-up or missing token: expired');
  ok((await call('POST', '/reset', { sb_token: 'sbat_bogus', password: 'whatever-1' })).json.error === 'expired', 'a Supabase link token is no longer accepted: expired');
  ok((await call('GET', '/nope')).status === 404, 'unknown paths: 404');
}

/* ---------------- backends ---------------- */
async function inNode() {
  const { d1 } = require(path.join(ROOT, 'cloudflare', 'd1_node.js'));
  const worker = (await import(path.join(ROOT, 'cloudflare', 'worker.js'))).default;
  const DB = d1(), mail = fakeMail();
  const env = { DB, RESEND_API_KEY: 're_test', MAIL_FETCH: mail.fetch, MAIL_WAIT: '1' };
  const call = async (method, p, body, token, headers) => {
    const h = Object.assign({}, headers || {}); if (token) h.Authorization = 'Bearer ' + token;
    let b; if (body !== null && body !== undefined) { b = typeof body === 'string' ? body : JSON.stringify(body); h['Content-Type'] = 'application/json'; }
    const res = await worker.fetch(new Request('https://api.test' + p, { method, headers: h, body: method === 'GET' || method === 'OPTIONS' ? undefined : b }), env, { waitUntil() {} });
    const text = method === 'OPTIONS' ? '' : await res.text(); let json = null; try { json = JSON.parse(text); } catch (e) { json = null; }
    return { status: res.status, headers: res.headers, text, json };
  };
  const sql = async (q, ...a) => { const write = a[a.length - 1] === true; if (write) a.pop(); const st = DB.raw.prepare(q); return write ? st.run(...a) : st.get(...a); };
  await checks('in-process Node, D1 over node:sqlite', call, sql, mail);
  { // in production the code mail goes out through ctx.waitUntil, after the answer (an account is not answered any slower)
    delete env.MAIL_WAIT; const pend = [], m1 = mail.mails.length;
    const res = await worker.fetch(new Request('https://api.test/forgot', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '10.8.8.9' }, body: JSON.stringify({ email: 'forgetful2@example.com' }) }), env, { waitUntil(p) { pend.push(p); } });
    ok(res.status === 200 && pend.length >= 1 && mail.mails.length === m1, 'without MAIL_WAIT the answer comes first and the mail waits in ctx.waitUntil');
    await Promise.all(pend); ok(mail.mails.length === m1 + 1 && /^\d{6}$/.test(mail.mails[m1].code), 'and then it is sent');
    env.MAIL_WAIT = '1';
  }
  delete env.RESEND_API_KEY; const m0 = mail.mails.length; // no email service set up yet: the game is told, nothing is sent
  const r = await call('POST', '/forgot', { email: 'forgetful@example.com' }, null, { 'CF-Connecting-IP': '10.8.8.8' });
  ok(r.status === 200 && r.json.ok === true && r.json.mail === false && mail.mails.length === m0, 'without RESEND_API_KEY: { mail: false } and no email');
}
function findMiniflare() {
  const roots = [].concat((process.env.NODE_PATH || '').split(path.delimiter).filter(Boolean), module.paths);
  for (const r of roots) for (const sub of ['miniflare', 'wrangler/node_modules/miniflare']) { try { return require(path.join(r, sub)); } catch (e) { /* next */ } }
  try { return require('miniflare'); } catch (e) { return null; }
}
async function inMiniflare() {
  const MF = findMiniflare();
  if (!MF) { console.log('--- Miniflare: not installed here (npm i -g wrangler); skipped'); return; }
  const fs = require('fs'), mail = fakeMail();
  const worker = {
    name: 'pawhaven-api', modules: true, script: require('fs').readFileSync(path.join(ROOT, 'cloudflare', 'worker.js'), 'utf8'), // the code itself: workerd refuses paths above its starting directory compatibilityDate: '2026-08-01',
    d1Databases: { DB: 'pawhaven-test-' + Date.now() },
    bindings: { RESEND_API_KEY: 're_test', MAIL_WAIT: '1' },
    outboundService: (req) => (req.url.startsWith('https://api.resend.com/') ? mail.fetch(req) : new Response('{}', { status: 404 }))
  };
  let mf; // Miniflare 4 takes the worker's options at the top; Miniflare 5 wants them in workers[]
  try { mf = new MF.Miniflare(Object.assign({ d1Persist: false }, worker)); } catch (e) { mf = new MF.Miniflare({ workers: [worker] }); }
  try {
    const DB = await mf.getD1Database('DB');
    const schema = fs.readFileSync(path.join(ROOT, 'cloudflare', 'schema.sql'), 'utf8').replace(/--.*$/gm, '');
    for (const s of schema.split(';').map((x) => x.trim()).filter(Boolean)) await DB.prepare(s).run();
    const call = async (method, p, body, token, headers) => {
      const h = Object.assign({}, headers || {}); if (token) h.Authorization = 'Bearer ' + token;
      let b; if (body !== null && body !== undefined) { b = typeof body === 'string' ? body : JSON.stringify(body); h['Content-Type'] = 'application/json'; }
      const res = await mf.dispatchFetch('https://api.test' + p, { method, headers: h, body: method === 'GET' || method === 'OPTIONS' ? undefined : b });
      const text = await res.text(); let json = null; try { json = JSON.parse(text); } catch (e) { json = null; }
      return { status: res.status, headers: res.headers, text, json };
    };
    const sql = async (q, ...a) => { const write = a[a.length - 1] === true; if (write) a.pop(); const st = DB.prepare(q).bind(...a); return write ? st.run() : st.first(); };
    await checks('Miniflare (workerd + local D1)', call, sql, mail);
  } finally { await mf.dispose(); }
}

(async () => {
  const t0 = Date.now();
  try { await inNode(); await inMiniflare(); } catch (e) { fails++; console.log('  CRASH', e && e.stack || e); }
  console.log(`${passes} passed, ${fails} failed (${((Date.now() - t0) / 1000).toFixed(1)} s)`);
  if (!fails) console.log('ALL OK');
  process.exit(fails ? 1 : 0);
})();
