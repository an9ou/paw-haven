// v2.14 i18n (V214.md section 13): node only, no browser. node game/test_i18n_node.js   (the `i18n` suite in run_tests.js, in `all`)
//  1. game/i18n/msg.js: format (plural per language, =N, #, select, nesting, missing vars, bad syntax), parse errors, args, pickLang, num
//  2. every game/i18n/glossary/<lang>.json that exists: shape, all 35 breed keys, bans compile, no ban hits an `allow` phrase or a glossary term
//  3. every game/i18n/<lang>.json and site/i18n/<lang>.json that exists: parses, keys and placeholders exist in that folder's en.json,
//     no ban hits (the language's glossary bans, the franchise names everywhere, the English copy rules on en.json), no emoji, no semicolons
//  4. the shared scope: no local binding shadows the i18n helper names (tt, tdata, ...) outside 00b_i18n.js (needs acorn; skipped without it)
//  5. build parity: if game/build.js fills the @@I18N@@ slot, tools/build.pl, tools/artifact.js and game/harness.js do too
const fs = require('fs'), path = require('path'), cp = require('child_process');
const ROOT = path.join(__dirname, '..');
const M = require(path.join(ROOT, 'game/i18n/msg.js'));
let fail = 0, pass = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  FAIL', m); } };
const eq = (a, b, m) => ok(a === b, `${m}: got ${JSON.stringify(a)}, want ${JSON.stringify(b)}`);
const throws = (fn, m) => { let t = false; try { fn(); } catch (e) { t = true; } ok(t, m + ' should throw'); };
const readJson = (f, m) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { ok(false, `${m}: bad JSON (${e.message})`); return null; } };
const NBSP = /[  ]/g, sp = (s) => s.replace(NBSP, ' ');

/* ---- 1. the formatter ---- */
const DOGS = '{n, plural, =0 {no dogs} one {# dog} other {# dogs}}';
eq(M.format(DOGS, { n: 0 }, 'en'), 'no dogs', 'en =0');
eq(M.format(DOGS, { n: 1 }, 'en'), '1 dog', 'en one');
eq(M.format(DOGS, { n: 2 }, 'en'), '2 dogs', 'en other');
eq(M.format(DOGS, { n: 1234 }, 'en'), '1,234 dogs', 'en # is grouped');
eq(sp(M.format(DOGS, { n: 1234 }, 'fr')), '1 234 dogs', 'fr # grouping');
eq(M.format(DOGS, { n: 1234 }, 'de'), '1.234 dogs', 'de # grouping');
const FR = '{n, plural, one {# chien} other {# chiens}}';
eq(M.format(FR, { n: 0 }, 'fr'), '0 chien', 'fr 0 is one');
eq(M.format(FR, { n: 1 }, 'fr'), '1 chien', 'fr 1 is one');
eq(M.format(FR, { n: 2 }, 'fr'), '2 chiens', 'fr 2 is other');
eq(M.format(FR, { n: 0 }, 'en'), '0 chiens', 'en 0 is other');
eq(M.format('{n, plural, =0 {aucun chien} one {# chien} other {# chiens}}', { n: 0 }, 'fr'), 'aucun chien', 'fr =0 beats one');
eq(M.format('{n, plural, one {# perro} other {# perros}}', { n: 1 }, 'es'), '1 perro', 'es one');
eq(M.format('{n, plural, one {# cão} other {# cães}}', { n: 0 }, 'pt-BR'), '0 cão', 'pt-BR 0 is one');
eq(M.format('{n, plural, one {# Hund} other {# Hunde}}', { n: 0 }, 'de'), '0 Hunde', 'de 0 is other');
// many (fr/es/pt for a million) falls back to other when there is no many branch
eq(sp(M.format(FR, { n: 1000000 }, 'fr')), '1 000 000 chiens', 'fr many -> other');
for (const l of ['ja', 'zh-Hans', 'zh-Hant', 'ko', 'th', 'id']) {
  for (const n of [0, 1, 2, 21]) eq(M.pluralCat(n, l), 'other', `${l} ${n} is other`);
  eq(M.format('{n, plural, one {ONE} other {#匹}}', { n: 1 }, l), '1匹', `${l} one branch unused`);
}
eq(M.format('{n, plural, =1 {ちょうど一匹} other {#匹}}', { n: 1 }, 'ja'), 'ちょうど一匹', 'ja =1 still matches');
// select, nesting, # inside a nested select, vars inside branches
const SEL = '{sex, select, female {{name} wags her tail} male {{name} wags his tail} other {{name} wags}}';
eq(M.format(SEL, { sex: 'female', name: 'Mochi' }, 'en'), 'Mochi wags her tail', 'select female');
eq(M.format(SEL, { sex: 'male', name: 'Bao' }, 'en'), 'Bao wags his tail', 'select male');
eq(M.format(SEL, { sex: 'x', name: 'Bao' }, 'en'), 'Bao wags', 'select other');
const NEST = '{who, select, pack {{n, plural, one {Your # dog is} other {All # dogs are}} happy} other {{name} is happy, {n, plural, one {# treat} other {# treats}}}}';
eq(M.format(NEST, { who: 'pack', n: 3 }, 'en'), 'All 3 dogs are happy', 'nested plural in select');
eq(M.format(NEST, { who: 'one', n: 1, name: 'Bao' }, 'en'), 'Bao is happy, 1 treat', 'nested plural with var');
eq(M.format('{n, plural, one {{sex, select, female {# girl} other {# boy}}} other {{sex, select, female {# girls} other {# boys}}}}', { n: 2, sex: 'female' }, 'en'), '2 girls', '# inside a select inside a plural');
eq(M.format('{a, plural, other {{b, plural, one {# b} other {# bs}} and # a}}', { a: 5, b: 1 }, 'en'), '1 b and 5 a', '# is the innermost plural');
// plain text, apostrophes, # outside a plural, missing vars, non-number vars
eq(M.format("It's {name}'s ball. #1 fan!", { name: 'Pip' }, 'en'), "It's Pip's ball. #1 fan!", 'apostrophes and # are text');
eq(M.format('Hello {name}', {}, 'en'), 'Hello {name}', 'missing var stays visible');
eq(M.format('Hello {name}', null, 'en'), 'Hello {name}', 'null vars');
eq(M.format('{year} edition', { year: 2026 }, 'en'), '2026 edition', '{x} is not grouped');
eq(M.format('{n} coins', { n: 0 }, 'en'), '0 coins', 'zero is a value');
eq(M.format('No vars here.', { a: 1 }, 'de'), 'No vars here.', 'plain text');
eq(M.format('', {}, 'en'), '', 'empty');
eq(M.format(null), '', 'null msg');
eq(M.format('Broken {n, plural, one {x}', { n: 1 }, 'en'), 'Broken {n, plural, one {x}', 'broken message comes back as written');
eq(M.format('{ name }', { name: 'Kiki' }, 'en'), 'Kiki', 'spaces inside braces');
eq(M.format('{n, plural, one {# day} other {# days}}', { n: '3' }, 'en'), '3 days', 'numeric string');
// parse errors (tables are checked with parse, so these must throw)
throws(() => M.parse('{n, plural, one {# dog}}'), 'plural without other');
throws(() => M.parse('{x, select, a {A}}'), 'select without other');
throws(() => M.parse('{n, number}'), 'unknown type');
throws(() => M.parse('{n, plural, some {x} other {y}}'), 'bad plural key');
throws(() => M.parse('Hello }'), 'stray }');
throws(() => M.parse('Hello {name'), 'unclosed {');
throws(() => M.parse('{n, plural, one {a} one {b} other {c}}'), 'duplicate key');
throws(() => M.parse('{1abc}'), 'bad var name');
// args: what a message uses
eq(JSON.stringify(M.args(NEST)), JSON.stringify({ who: 'select', n: 'plural', name: 'arg' }), 'args of a nested message');
eq(JSON.stringify(M.args('plain')), '{}', 'args of plain text');
// the parse cache returns the same result twice
eq(M.format(DOGS, { n: 5 }, 'en'), M.format(DOGS, { n: 5 }, 'en'), 'cache stable');
// lookup: per-key English fallback
const EN = { 'walk.home_early': 'Head home early', 'pack.n': DOGS }, JA = { 'walk.home_early': '早めに帰る', 'pack.n': '' };
eq(M.lookup(JA, EN, 'walk.home_early', null, 'ja'), '早めに帰る', 'lookup hit');
eq(M.lookup(JA, EN, 'pack.n', { n: 2 }, 'ja'), '2 dogs', 'empty translation falls back to English');
eq(M.lookup(JA, EN, 'nope.key', null, 'ja'), 'nope.key', 'unknown key comes back as the key');
eq(M.lookup(null, EN, 'walk.home_early', null, 'ja'), 'Head home early', 'no table');
eq(M.lookup(JA, 'Head home early', 'walk.home_early', null, 'ja'), '早めに帰る', 'inline English, translated');
eq(M.lookup({}, '{n, plural, one {# dog} other {# dogs}}', 'pack.n', { n: 1 }, 'ja'), '1 dog', 'inline English fallback uses English plurals');
// id: the data-row key part
eq(M.id('Bone-shaped Biscuit'), 'bone_shaped_biscuit', 'id dashes'); eq(M.id('Hachikō'), 'hachiko', 'id macron');
eq(M.id("Mrs. Plum's Pie"), 'mrs_plum_s_pie', 'id punctuation'); eq(M.id('  '), '_', 'id empty'); eq(M.id('Café Crème'), 'cafe_creme', 'id accents');
// Korean particles: {name, josa, 이/가} picks by the last syllable's batchim (V214.md 3.2)
const KO = '{name, josa, 이/가} 왔어요. {name, josa, 을/를} 봐요. {name, josa, 은/는} 졸려요. {name, josa, 과/와} 놀아요. {name, josa, 으로/로} 가요.';
eq(M.format(KO, { name: '모찌' }, 'ko'), '모찌가 왔어요. 모찌를 봐요. 모찌는 졸려요. 모찌와 놀아요. 모찌로 가요.', 'josa after a vowel');
eq(M.format(KO, { name: '콩' }, 'ko'), '콩이 왔어요. 콩을 봐요. 콩은 졸려요. 콩과 놀아요. 콩으로 가요.', 'josa after a batchim');
eq(M.format('{name, josa, 으로/로}', { name: '하늘' }, 'ko'), '하늘로', 'josa (으)로 after ㄹ is 로');
eq(M.format('{name, josa, 이/가}', { name: 'Mochi' }, 'ko'), 'Mochi이(가)', 'josa fallback for a Latin name');
eq(M.format('{name, josa, 으로/로}', { name: 'Bao' }, 'ko'), 'Bao(으)로', 'josa fallback (으)로');
eq(M.format('{n, josa, 을/를}', { n: 3 }, 'ko'), '3을', 'josa after a digit (삼)');
eq(M.format('{n, josa, 을/를}', { n: 2 }, 'ko'), '2를', 'josa after a digit (이)');
eq(M.format('{name, josa, 이/가}', { name: '보리!' }, 'ko'), '보리!가', 'josa looks past trailing punctuation');
eq(M.format('{name, josa, 아/야}', { name: '별' }, 'ko'), '별아', 'josa vocative');
throws(() => M.parse('{name, josa, 이/는}'), 'josa with an unknown pair');
throws(() => M.parse('{name, josa}'), 'josa without a pair');
eq(JSON.stringify(M.args('{name, josa, 은/는} {n}')), JSON.stringify({ name: 'josa', n: 'arg' }), 'args of a josa message');
// num / date
eq(M.num(1234.5, 'de'), '1.234,5', 'num de');
eq(M.num(1234, 'ja'), '1,234', 'num ja');
ok(/2569/.test(M.date(new Date(2026, 9, 18), 'th', { year: 'numeric' })), 'th dates use the Buddhist year by default');
ok(/2026/.test(M.date(new Date(2026, 9, 18), 'ja', { year: 'numeric' })), 'ja dates stay Gregorian');

/* ---- LANGS and pickLang ---- */
const CODES = ['en', 'ja', 'zh-Hans', 'zh-Hant', 'ko', 'es', 'pt-BR', 'fr', 'de', 'th', 'id'];
eq(JSON.stringify(M.CODES), JSON.stringify(CODES), 'CODES in picker order');
eq(M.LANGS.ja, '日本語', 'native name ja'); eq(M.LANGS['zh-Hant'], '繁體中文', 'native name zh-Hant'); eq(M.LANGS['pt-BR'], 'Português (Brasil)', 'native name pt-BR');
CODES.forEach((c) => { ok(typeof M.LANGS[c] === 'string' && M.LANGS[c], 'LANGS has ' + c); ok(typeof M.LANG_EN[c] === 'string' && M.LANG_EN[c], 'LANG_EN has ' + c); });
const PICK = [
  [['zh-TW'], 'zh-Hant'], [['zh-HK'], 'zh-Hant'], [['zh-MO'], 'zh-Hant'], [['zh-Hant'], 'zh-Hant'], [['zh-Hant-TW'], 'zh-Hant'], [['zh-Hant-HK'], 'zh-Hant'],
  [['zh'], 'zh-Hans'], [['zh-CN'], 'zh-Hans'], [['zh-SG'], 'zh-Hans'], [['zh-Hans'], 'zh-Hans'], [['zh-Hans-CN'], 'zh-Hans'], [['zh_TW'], 'zh-Hant'],
  [['pt'], 'pt-BR'], [['pt-PT'], 'pt-BR'], [['pt-BR'], 'pt-BR'], [['es-MX'], 'es'], [['es-419'], 'es'], [['es'], 'es'],
  [['ja-JP'], 'ja'], [['ja'], 'ja'], [['ko-KR'], 'ko'], [['fr-CA'], 'fr'], [['de-AT'], 'de'], [['th-TH'], 'th'], [['id-ID'], 'id'], [['in-ID'], 'id'],
  [['en-GB'], 'en'], [['EN-us'], 'en'], [['nl-NL', 'de-DE'], 'de'], [['nl', 'sv'], 'en'], [[], 'en'], [null, 'en'], [undefined, 'en'], ['fr-FR', 'fr'],
  [['', '  ', 42, 'ko'], 'ko'], [['ar-EG', 'zh-HK', 'ja'], 'zh-Hant'], [['it-IT', 'pt-BR', 'es-ES'], 'pt-BR'], [['zh-hant'], 'zh-Hant'], [['pt-br'], 'pt-BR']
];
for (const [inp, want] of PICK) eq(M.pickLang(inp), want, 'pickLang ' + JSON.stringify(inp));
CODES.forEach((c) => eq(M.pickLang([c]), c, 'pickLang round trip ' + c));

/* ---- 2. glossaries ---- */
const G = require(path.join(ROOT, 'mods/genes.js'));
eq(G.BREEDS.length, 35, 'BREEDS has 35 keys');
// the franchise names in every language (V214.md section 10): English plus the common local spellings
const FRANCHISE = /nintendo|pok[eé]mon|animal crossing|任天堂|ポケモン|ポケットモンスター|どうぶつの森|宝可梦|寶可夢|精灵宝可梦|神奇宝贝|神奇寶貝|动物森友会|動物森友會|集合啦|닌텐도|포켓몬|동물의 숲|นินเทนโด|โปเกมอน|แอนิมอล ครอสซิง/i;
const GL = {};
const gdir = path.join(ROOT, 'game/i18n/glossary');
const compile = (b, where) => { try { return new RegExp(b.re, b.flags || ''); } catch (e) { ok(false, `${where}: ban ${JSON.stringify(b.re)} does not compile (${e.message})`); return null; } };
if (fs.existsSync(gdir)) {
  for (const f of fs.readdirSync(gdir).filter((x) => x.endsWith('.json')).sort()) {
    const lang = f.slice(0, -5), where = 'glossary/' + f, g = readJson(path.join(gdir, f), where);
    if (!g) continue;
    ok(CODES.includes(lang) && lang !== 'en', `${where}: file name is one of the 10 codes`);
    eq(g.lang, lang, `${where}: lang`);
    const bk = Object.keys(g.breeds || {});
    ok(G.BREEDS.every((k) => typeof g.breeds[k] === 'string' && g.breeds[k].trim()), `${where}: every breed key has a name (missing: ${G.BREEDS.filter((k) => !(g.breeds || {})[k]).join(' ')})`);
    ok(bk.every((k) => G.BREEDS.includes(k)), `${where}: no unknown breed keys (${bk.filter((k) => !G.BREEDS.includes(k)).join(' ')})`);
    ok(g.terms && typeof g.terms === 'object' && Object.values(g.terms).every((v) => typeof v === 'string'), `${where}: terms is an object of strings`);
    ok(Array.isArray(g.bans) && g.bans.length > 0, `${where}: bans is a non-empty list`);
    ok(Array.isArray(g.allow || []), `${where}: allow is a list`);
    const res = (g.bans || []).map((b) => { ok(b && typeof b.re === 'string' && typeof b.why === 'string' && b.why, `${where}: ban has re and why`); ok(!b.flags || /^[dgimsuyv]*$/.test(b.flags), `${where}: ban flags ${b.flags}`); return b && compile({ re: b.re, flags: (b.flags || '').replace('g', '') }, where); }).filter(Boolean);
    for (const a of g.allow || []) for (const r of res) ok(!r.test(a), `${where}: ban /${r.source}/ hits the allow phrase "${a}"`);
    const words = Object.values(g.breeds || {}).concat(Object.values(g.terms || {}));
    for (const w of words) { ok(!FRANCHISE.test(w), `${where}: franchise name in "${w}"`); for (const r of res) ok(!r.test(w), `${where}: ban /${r.source}/ hits the glossary word "${w}"`); }
    GL[lang] = res;
  }
}

/* ---- 3. string tables ---- */
// the English copy rules (test_copy_node.js RULES), for en.json
const EN_RULES = [
  { name: 'breed as a verb', re: /\b(to breed|breed (them|your|her|him|my|our|dogs)|breeding (your|her|him|them|dogs)|bred (by|with|from))\b/i },
  { name: 'stud', re: /\bstuds?\b/i },
  { name: 'litter price', re: /litter price/i },
  { name: 'selling dogs', re: /\b(sell|sells|selling|sold)\b[^.!?]*\b(dog|dogs|pup|pups|puppy|puppies)\b|\b(dog|dogs|pup|pups|puppy|puppies)\b[^.!?]*\b(sell|sells|selling|sold)\b/i },
  { name: 'franchise name', re: /nintendo|pok[eé]mon|animal crossing/i },
  // the site too: a dog type "was bred in Japan" is breeding talk, say "comes from Japan" (v2.14 site fix)
  { name: 'bred in / was bred', re: /\b(bred in|(was|were|is|are|been) bred)\b/i }
];
// the rules above must keep every rule of test_copy_node.js (checked here, so the two lists can't drift apart)
{
  const src = fs.readFileSync(path.join(ROOT, 'game/test_copy_node.js'), 'utf8');
  const names = [...src.slice(src.indexOf('const RULES'), src.indexOf('];', src.indexOf('const RULES'))).matchAll(/name: '([^']+)'/g)].map((m) => m[1]);
  ok(names.length > 0 && names.every((n) => EN_RULES.some((r) => r.name === n)), 'EN_RULES has every rule of game/test_copy_node.js: ' + names.join(', '));
  ok(EN_RULES.find((r) => r.name === 'bred in / was bred').re.test('The Shiba was bred in Japan.'), 'EN_RULES catch "bred in Japan"');
}
// en.json keys whose English is a reviewed exception to the semicolon and copy rules (one key per line, then # why)
const COPY_OK = new Set(fs.existsSync(path.join(ROOT, 'game/i18n/COPY_OK.txt')) ? fs.readFileSync(path.join(ROOT, 'game/i18n/COPY_OK.txt'), 'utf8').split('\n').map((l) => l.replace(/#.*$/, '').trim()).filter(Boolean) : []);
const EMOJI = /\p{Emoji_Presentation}/u, SEMI = /(?<!&[#\w]{1,8});|；/;
const flat = (o, pre, out) => { for (const [k, v] of Object.entries(o)) { const kk = pre ? pre + '.' + k : k; if (v && typeof v === 'object') flat(v, kk, out); else out[kk] = v; } return out; };
function checkDir(dir, label, flatOnly) {
  if (!fs.existsSync(dir)) return 0;
  const files = fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort();
  if (!files.length) return 0;
  const tables = {};
  for (const f of files) {
    const lang = f.slice(0, -5), where = label + '/' + f, j = readJson(path.join(dir, f), where);
    if (!j) continue;
    ok(CODES.includes(lang), `${where}: file name is one of the 11 codes`);
    if (flatOnly) ok(Object.values(j).every((v) => typeof v === 'string'), `${where}: flat keys, string values only`);
    tables[lang] = flat(j, '', {});
  }
  const en = tables.en;
  ok(!!en || !Object.keys(tables).length, `${label}: en.json exists when any table exists`);
  const enArgs = {};
  if (en) for (const [k, v] of Object.entries(en)) { if (typeof v !== 'string') continue; try { enArgs[k] = M.args(v); } catch (e) { ok(false, `${label}/en.json ${k}: ${e.message}`); } }
  let n = 0;
  for (const [lang, t] of Object.entries(tables)) {
    const where = label + '/' + lang + '.json', bans = (GL[lang] || []);
    for (const [k, v] of Object.entries(t)) {
      if (typeof v !== 'string') continue;
      n++;
      if (lang !== 'en' && en) ok(k in en, `${where}: key ${k} is not in en.json`);
      let a = null; try { a = M.args(v); } catch (e) { ok(false, `${where} ${k}: ${e.message}`); }
      if (a && lang !== 'en' && enArgs[k]) {
        for (const [name, type] of Object.entries(a)) {
          const want = enArgs[k][name];
          ok(want != null, `${where} ${k}: placeholder {${name}} is not in en.json`);
          // a translation may turn a plain {n} into a plural or select (or back), never a plural into a select
          ok(want == null || want === type || type === 'arg' || type === 'josa' || want === 'arg', `${where} ${k}: {${name}} is a ${type} here but a ${want} in en.json`);
        }
      }
      const text = v.replace(/\{[A-Za-z_$][\w$]*\}/g, ' ');
      ok(!FRANCHISE.test(text), `${where} ${k}: franchise name`);
      ok(!EMOJI.test(text), `${where} ${k}: emoji`);
      const okEn = lang === 'en' && label === 'game/i18n' && COPY_OK.has(k); // game/i18n/COPY_OK.txt: the English keeps a reviewed exception (its code line has // copy-ok)
      if (!okEn) ok(!SEMI.test(text), `${where} ${k}: semicolon in player text`);
      for (const r of bans) ok(!r.test(text), `${where} ${k}: ban /${r.source}/ in "${v.slice(0, 80)}"`);
      if (lang === 'en' && !okEn) for (const r of EN_RULES) ok(!r.re.test(text), `${where} ${k}: ${r.name} in "${v.slice(0, 80)}"`);
    }
  }
  return n;
}
const nGame = checkDir(path.join(ROOT, 'game/i18n'), 'game/i18n', true);
const nSite = checkDir(path.join(ROOT, 'site/i18n'), 'site/i18n', false);
const ord = path.join(ROOT, 'game/i18n/ORDER.txt');
if (fs.existsSync(ord)) {
  const list = fs.readFileSync(ord, 'utf8').split('\n').map((s) => s.trim()).filter(Boolean);
  eq(list[0], 'en.json', 'game/i18n/ORDER.txt starts with en.json');
  ok(list.every((f) => CODES.includes(f.replace(/\.json$/, ''))), 'game/i18n/ORDER.txt lists only the 11 codes');
  eq(JSON.stringify(list.map((f) => f.replace(/\.json$/, ''))), JSON.stringify(CODES.filter((c) => list.includes(c + '.json'))), 'game/i18n/ORDER.txt is in CODES order');
}

/* ---- 4. no local name shadows the i18n helpers in the shared scope ---- */
const HELPERS = ['tt', 'tdata', 'tid', 'tbreed', 'tnum', 'tdate', 'tlist', 'tlang', 'tsetLang'];
function loadAcorn() {
  try { return require('acorn'); } catch (e) { /* not on the default paths */ }
  const roots = [];
  try { roots.push(cp.execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()); } catch (e) { /* no npm */ }
  for (const r of roots.concat((process.env.NODE_PATH || '').split(path.delimiter)).filter(Boolean)) {
    for (const t of [path.join(r, 'acorn'), path.join(r, 'eslint/node_modules/acorn'), path.join(r, 'espree/node_modules/acorn')]) { try { return require(t); } catch (e) { /* next */ } }
    for (const h of ['eslint', 'espree']) { try { return require(path.join(fs.realpathSync(path.join(r, h)), '..', 'acorn')); } catch (e) { /* next */ } }
  }
  return null;
}
const acorn = loadAcorn();
if (!acorn) console.log('  (skip) acorn not found: the shadowing check did not run');
else {
  const D = path.join(ROOT, 'game/src');
  let code = ''; const spans = [];
  for (const f of fs.readFileSync(path.join(D, 'ORDER.txt'), 'utf8').split('\n').map((s) => s.trim()).filter(Boolean)) { const s = fs.readFileSync(path.join(D, f), 'utf8'); spans.push([f, code.length]); code += s; }
  const fileAt = (pos) => { let f = spans[0][0]; for (const [n, st] of spans) if (st <= pos) f = n; return f; };
  const bad = [];
  const bind = (p) => {
    if (!p) return;
    if (p.type === 'Identifier') { if (HELPERS.includes(p.name) && fileAt(p.start) !== '00b_i18n.js') bad.push(p.name + ' in ' + fileAt(p.start)); }
    else if (p.type === 'AssignmentPattern') bind(p.left);
    else if (p.type === 'ObjectPattern') p.properties.forEach((q) => bind(q.value || q.argument));
    else if (p.type === 'ArrayPattern') p.elements.forEach(bind);
    else if (p.type === 'RestElement') bind(p.argument);
  };
  try {
    const ast = acorn.parse(code, { ecmaVersion: 'latest', sourceType: 'script' });
    (function w(n) {
      if (!n || typeof n.type !== 'string') return;
      if (n.type === 'VariableDeclarator') bind(n.id);
      if (/Function|ClassDeclaration/.test(n.type)) { (n.params || []).forEach(bind); if (n.id) bind(n.id); }
      if (n.type === 'CatchClause') bind(n.param);
      for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(w); else if (v && typeof v.type === 'string') w(v); }
    })(ast);
    ok(!bad.length, 'i18n helper names shadowed in the shared scope: ' + bad.slice(0, 10).join(', '));
  } catch (e) { ok(false, 'game/src does not parse: ' + e.message); }
}

/* ---- 5. build parity for the @@I18N@@ slot ---- */
const has = (f, s) => fs.existsSync(path.join(ROOT, f)) && fs.readFileSync(path.join(ROOT, f), 'utf8').includes(s);
if (has('game/build.js', '@@I18N@@') || has('game/shell.html', '@@I18N@@')) {
  for (const f of ['game/shell.html', 'game/build.js', 'tools/build.pl', 'tools/artifact.js', 'game/harness.js']) ok(has(f, '@@I18N@@') || has(f, 'pawi18n'), `${f} fills the @@I18N@@ slot`);
}

/* ---- 6. phase 2 (I18N CORE): en.json and packed.js are up to date with the code, TABLES.txt and the tables ---- */
if (acorn && fs.existsSync(path.join(ROOT, 'game/i18n/TABLES.txt'))) {
  const run = (f, a) => { const r = cp.spawnSync(process.execPath, [path.join(ROOT, f)].concat(a), { encoding: 'utf8' }); return { ok: r.status === 0, out: ((r.stdout || '') + (r.stderr || '')).trim().split('\n').slice(-3).join(' / ') }; };
  const e = run('tools/i18n_extract.js', ['--en', '--check', '--quiet']); ok(e.ok, 'game/i18n/en.json is up to date (node tools/i18n_extract.js --en): ' + e.out);
  const k = run('tools/i18n_pack.js', ['--check']); ok(k.ok, 'game/i18n/packed.js is up to date (node tools/i18n_pack.js): ' + k.out);
}

console.log(`\nmsg.js + ${Object.keys(GL).length} glossaries + ${nGame} game strings + ${nSite} site strings: ${pass} checks, ${fail} problem(s)`);
if (!fail) console.log('ALL OK');
process.exit(fail ? 1 : 0);
