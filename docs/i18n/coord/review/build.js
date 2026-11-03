// Picks the review rows from the Cantonese worktree (read only) and writes rows.json.
const fs = require('fs'), path = require('path');
const R = '/home/user/paw-haven-yue';
const OUT = __dirname;
const J = (p) => JSON.parse(fs.readFileSync(path.join(R, p), 'utf8'));
const en = J('game/i18n/en.json'), yue = J('game/i18n/yue.json');
const flat = (o, p = '', r = {}) => { for (const [k, v] of Object.entries(o)) { const q = p ? p + '.' + k : k; if (v && typeof v === 'object' && !Array.isArray(v)) flat(v, q, r); else r[q] = v; } return r; };
const sen = flat(J('site/i18n/en.json')), syue = flat(J('site/i18n/yue.json'));
const qzh = JSON.parse(fs.readFileSync(path.join(OUT, 'q_zh.json'), 'utf8'));
const K = Object.keys(en);

// ---------- display: ICU, placeholders, HTML ----------
const JP = { muryo: '無料 muryō', osanpo: 'お散歩 osanpo', inu: '犬 inu', asobo: 'あそぼ asobo', arigato: 'ありがとう arigatō' };
const NAME = new Set(['name', 'dog', 'names', 'pup', 'n_name']);
const NUM = { n: 3, b: 12, total: 35, i: 2, l: 3, bond: 2, coins: 20, c: 40, q: 3, count: 35, pts: 120, max: 180, happy: 10, hunger: 15, age: 2, bonus: 10, m: 4, g: 2, max_n: 50 };
const LAB = { item: ['物品', 'item'], food: ['食物', 'food'], place: ['地方', 'place'], friend: ['朋友', 'friend'], who: ['朋友', 'friend'], family: ['家庭', 'family'], house: ['狗屋', 'house'], trick: ['把戲', 'trick'], date: ['日期', 'date'], month: ['月份', 'month'], what: ['禮物', 'gift'], gift: ['禮物', 'gift'], status: ['狀態', 'status'], breed: ['品種', 'breed'], route: ['路線', 'route'], list: ['清單', 'list'], email: ['電郵', 'email'], from: ['寄件人', 'sender'], title: ['標題', 'title'], word: ['字', 'word'], a: ['第一個字', 'word 1'], b2: ['第二個字', 'word 2'], dogs: ['狗狗', 'dogs'], mail: ['電郵地址', 'email address'], house_n: ['狗屋', 'house'], ability: ['能力', 'ability'], text: ['文字', 'text'], head: ['…', '…'], last: ['…', '…'], multi: ['', ''], kind: ['', ''] };
function findClose(s, i) { let d = 0; for (let j = i; j < s.length; j++) { if (s[j] === '{') d++; else if (s[j] === '}') { d--; if (!d) return j; } } return -1; }
function parseOpts(s) { const o = {}; let i = 0; while (i < s.length) { while (i < s.length && /\s/.test(s[i])) i++; let k = ''; while (i < s.length && s[i] !== '{' && !/\s/.test(s[i])) k += s[i++]; while (i < s.length && /\s/.test(s[i])) i++; if (s[i] !== '{') break; const e = findClose(s, i); o[k] = s.slice(i + 1, e); i = e + 1; } return o; }
function render(s, lang, ctx, hash) {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '#' && hash != null) { out += hash; continue; }
    if (ch !== '{') { out += ch; continue; }
    const e = findClose(s, i); if (e < 0) { out += s.slice(i); break; }
    const inner = s.slice(i + 1, e); i = e;
    const m = inner.match(/^\s*([A-Za-z0-9_]+)\s*(?:,\s*(plural|select|selectordinal)\s*,([\s\S]*))?$/);
    if (!m) { out += '{' + inner + '}'; continue; }
    const v = m[1];
    if (m[2]) {
      const o = parseOpts(m[3]);
      if (m[2] === 'select') { const pick = o.yes != null && v === 'done' ? o.other : (o.other != null ? o.other : Object.values(o)[0]); out += render(pick || '', lang, ctx, hash); }
      else { const num = NUM[v] != null ? NUM[v] : 3; const pick = o['=' + num] != null ? o['=' + num] : (o.other != null ? o.other : Object.values(o)[0]); out += render(pick || '', lang, ctx, String(num)); }
      continue;
    }
    out += ph(v, lang, ctx);
  }
  return out;
}
function ph(v, lang, ctx) {
  if (ctx.fr && (v === 'name' || v === 'friend')) return lang === 'en' ? '[friend]' : '［朋友］';
  if (NAME.has(v) || (v === 'n' && ctx.nameN)) return 'Mochi';
  if (v === 'code') return 'DOG-XXXXX';
  if (JP[v]) return JP[v];
  if (NUM[v] != null) return String(NUM[v]);
  const lab = LAB[v];
  if (lab && !lab[0]) return '';
  const t = lab ? lab[lang === 'en' ? 1 : 0] : v;
  return lang === 'en' ? '[' + t + ']' : '［' + t + '］';
}
function strip(s) {
  return s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/[ \t]+/g, ' ').trim();
}
function show(raw, lang, key) {
  if (raw == null) return '';
  const ctx = { fr: /^fr\./.test(key), nameN: /^(mail\.card_|data\.eat_lines\.|mail\.)/.test(key) && !/\{n,\s*plural/.test(raw) };
  return strip(render(String(raw), lang, ctx, null));
}

// ---------- rows ----------
const rows = []; const seen = new Set();
const docId = (file, key) => (file === 'site' ? 'site:' : '') + key.replace(/\*/g, '~');
function add(sec, group, key, extra = {}) {
  const file = extra.file || 'game';
  const E = file === 'site' ? sen : en, Y = file === 'site' ? syue : yue;
  const realKey = extra.example || key;
  if (seen.has(file + ':' + realKey)) return; seen.add(file + ':' + realKey);
  if (E[realKey] == null) { console.error('missing en', realKey); return; }
  if (Y[realKey] == null) { console.error('missing yue', realKey); return; }
  rows.push({ id: docId(file, key), key, ex: extra.example || undefined, file, sec, group, en: show(E[realKey], 'en', realKey), yue: show(Y[realKey], 'yue', realKey), raw: String(Y[realKey]), q: extra.q, qzh: extra.qzh, ok: extra.approved ? 1 : undefined });
}

// A: native-check questions
const md = fs.readFileSync(path.join(R, 'docs/i18n/coord/yue_native_check.md'), 'utf8').split('\n');
const AREAS = { 'Words used all over the game': ['成個遊戲都會見到嘅字', 'Words used all over the game'], 'Menus, settings, journal, care (chunk 1)': ['選單、設定、日記、照顧', 'Menus, settings, journal, care'], 'Dog lines and jokes (chunk 2)': ['狗狗對白同笑話', 'Dog lines and jokes'], 'Gerald, letters, vet, puppies, genes (chunk 3)': ['傑拉德、信件、獸醫、狗BB、遺傳', 'Gerald, letters, vet, puppies, genes'], 'Items, home, kitchen, garden (chunk 4)': ['物品、屋企、廚房、菜園', 'Items, home, kitchen, garden'], 'Places, walks, weather, town (chunk 5)': ['地方、散步、天氣、小鎮', 'Places, walks, weather, town'], 'Japan, New Year, festivals, Fun Fair, Friends (chunk 6)': ['日本、新年、節日、遊樂場、好友', 'Japan, New Year, festivals, Fun Fair, Friends'] };
const EXAMPLE = { 'data.toys_lines.*.conelick.*': 'data.toys_lines.beagle.conelick.0', 'data.words.*': 'data.words.afghan.black', 'data.people_food.*.why': 'data.people_food.grapes.why' };
let area = null, qi = 0;
for (const line of md) {
  const h = line.match(/^## (.+)$/); if (h) { area = AREAS[h[1].trim()] || [h[1], h[1]]; continue; }
  if (!line.startsWith('| `')) continue;
  const c = line.split(' | ');
  const key = c[0].replace(/^\|\s*`|`$/g, '');
  const q = c[3].trim();
  add('A', area, key, { q, qzh: qzh[qi], example: EXAMPLE[key] });
  qi++;
}
console.error('A questions', qi, 'zh', qzh.length);

// owner-approved sample keys
const sample = new Set(fs.readFileSync(path.join(R, 'docs/i18n/yue_sample.md'), 'utf8').split('\n').filter((l) => /^\| [a-z]/.test(l) && !/^\| Key/.test(l)).map((l) => l.split('|')[1].trim()));
const B = (g, keys) => keys.forEach((k) => add('B', g, k, { approved: sample.has(k) }));
const re = (r, f = () => true) => K.filter((k) => r.test(k) && f(k));

B(['底部按鈕同照顧選單', 'Bottom bar and Care buttons'], ['data.acts.feed.1', 'data.acts.play.1', 'data.acts.care.1', 'data.acts.walk.1', 'data.acts.wardrobe.1', 'data.acts.journal.1', 'data.acts.map.1', 'fw.more', 'fw.bath_nap', 'dd.st_title', 'fr.menu', 'yard.bath', 'yard.nap', 'yard.bed', 'yard.houses', 'yard.go_home', 'data.meters.hunger.1', 'data.meters.happy.1', 'data.meters.energy.1', 'data.meters.clean.1', 'shell.bond', 'shell.coins_title', 'core.close', 'core.yes', 'core.no']);
B(['設定同儲存', 'Settings and saving'], [...re(/^settings\./, (k) => !/economy|clock|no_audio|vol_|bark_fewer|lang_busy/.test(k)), 'phone.menu', 'phone.cloud', 'phone.photo', 'phone.turn_upright', 'cloud.saved_here', 'cloud.guest', 'cloud.log_in', 'cloud.log_out', 'cloud.make_an_account', 'cloud.email', 'cloud.password', 'cloud.forgot', 'cloud.export_code', 'cloud.import_code', 'cloud.paste_code', 'cloud.copy', 'cloud.copied', 'cloud.offline_saved', 'cloud.nudge']);
B(['第一日：傑拉德帶你玩', "The first day with Gerald"], [...re(/^fw\.step_/), 'fw.tag_title', 'fw.tag_colour', 'fw.tag_btn', 'fw.tag_ok', 'fw.tag_on', 'fw.first_day_done', 'fw.wel_title', 'fw.wel_sub', 'fw.cal_title', 'fw.dg_title', 'fw.claim', 'fw.got', 'fw.party_title', 'fw.paw_say', 'fw.morning', ...['hello', 'pet', 'feed', 'nap', 'walk', 'map', 'shops', 'missions', 'garden', 'done'].flatMap((s) => re(new RegExp('^data\\.gd_steps\\.' + s + '\\.')))]);
B(['狗狗返屋企同你打招呼', 'Dogs say hello when you come back'], re(/^data\.greet_lines\./));
B(['每隻狗嘅招牌把戲', 'Signature tricks'], re(/^data\.sig\.[a-z]+\.(n|say)$/));
B(['照顧小知識（兩句）', 'Care lessons (two sentences each)'], ['data.food.blueberry_bites.tip', 'data.bd_tips.dane', ...re(/^data\.food\.[a-z_]+\.tip$/).slice(0, 15)]);
B(['狗BB新家庭寄嚟嘅信', 'Letters from puppy families'], Array.from({ length: 12 }, (_, i) => 'mail.card_' + (i + 1)));
const items = [['food', 'basic_kibble'], ['food', 'chicken_rice_bowl'], ['food', 'carrot_sticks'], ['food', 'apple_slices'], ['food', 'bone_shaped_biscuit'], ['food', 'blueberry_bites'], ['food', 'frozen_pupsicle'], ['food', 'fresh_water'], ['toys', 'tennis_ball'], ['toys', 'squeaky_duck'], ['toys', 'frisbee'], ['toys', 'plush_bone'], ['toys', 'rope_tug'], ['toys', 'bubble_machine'], ['clothes', 'red_bandana'], ['clothes', 'bow_tie'], ['clothes', 'yellow_raincoat'], ['clothes', 'cozy_hoodie'], ['clothes', 'flower_crown'], ['clothes', 'party_hat']];
B(['商店物品', 'Shop items'], items.flatMap(([t, id]) => ['data.' + t + '.' + id + '.n', 'data.' + t + '.' + id + (t === 'clothes' ? '.perk' : '.note')]));
B(['好友', 'Friends'], ['title', 'share', 'copy', 'code_copied', 'link_copied', 'add', 'add_title', 'added', 'already', 'none', 'not_found', 'self', 'visit', 'yard_of', 'pet_title', 'pet_text', 'paw_leave', 'paw_left', 'note_title', 'note_lead', 'gift_send', 'gift_title', 'gift_text', 'gift_lead', 'gift_limit', 'gift_empty', 'walk_row', 'walk_title', 'walk_text', 'walk_just', 'pick_title', 'pick_lead', 'this_name', 'random', 'poster', 'poster_head', 'poster_scan', 'offline', 'remove', 'block', 'leave', 'leave_ask', 'stay'].map((k) => 'fr.' + k));
B(['散步跑步嘅道具', 'Walk runner power-ups'], re(/^mod\.walk\.pw_/));
B(['地圖上嘅地方', 'Places on the map'], ['town.map_title', 'map215.map_label', ...re(/^data\.places\.[a-z]+\.n$/), ...re(/^map215\.place_/), ...re(/^town\.place_/), ...re(/^data\.tk_places\.[a-z]+\.n$/)]);
B(['常見小訊息', 'Common little messages'], ['cloud.saved_here', 'yard.learned_bond', 'care.gone', 'care.shh', 'care.magic_hands', 'care.breakfast', 'care.fav_food', 'care.petted_100', 'care.water_wait', 'core.seed_gift', 'core.bond_max', 'fw.step_done', 'mail.new_letters', 'settings.reset_done', 'fr.gift_sent', 'fr.paw_left', 'cloud.copied', 'map.too_sleepy']);
// any owner-approved line not placed yet
B(['作者已經睇過嘅其他句子', 'Other lines the owner already approved'], [...sample]);

// C: website
const C = (g, keys) => keys.forEach((k) => add('C', g, k, { file: 'site' }));
C(['頂部選單', 'The menu'], ['nav.home', 'nav.dogs', 'nav.map', 'nav.guide', 'nav.about', 'nav.menu']);
C(['主頁', 'Home page'], ['home.title', 'home.tagline', 'home.intro', 'home.free_line', 'home.game_saves', 'home.save_line', 'home.dogs.title', 'home.dogs.lead', 'home.do.title', 'home.feat.walks.title', 'home.feat.walks.text', 'home.feat.cuddles.text', 'home.feat.garden.text', 'home.feat.playdates.text', 'home.toss']);
C(['狗狗資料', 'Dog profiles'], ['shiba', 'corgi', 'golden', 'chihuahua', 'husky', 'mutt'].flatMap((d) => ['dog.' + d + '.quote', 'dog.' + d + '.personality']));
C(['私隱政策重點', 'Privacy in short'], ['privacy.h1', 'privacy.short', 'privacy.dont.ads', 'privacy.dont.tracking', 'privacy.dont.share', 'privacy.children.text']);

const cnt = { A: 0, B: 0, C: 0 }; rows.forEach((r) => cnt[r.sec]++);
console.error('rows', rows.length, JSON.stringify(cnt), 'approved', rows.filter((r) => r.ok).length);
const ids = new Set(); rows.forEach((r) => { if (ids.has(r.id)) console.error('dup id', r.id); ids.add(r.id); if (!/^[A-Za-z0-9_\-.~:@+]+$/.test(r.id) || r.id.length > 190) console.error('bad id', r.id); });
fs.writeFileSync(path.join(OUT, 'rows.json'), JSON.stringify(rows));
// placeholder audit
const bad = rows.filter((r) => /[{}]/.test(r.yue + r.en) || /［[a-z_]+］/.test(r.yue));
console.error('leftover braces / unknown placeholders:', bad.length); bad.slice(0, 30).forEach((r) => console.error(' ', r.key, '|', r.en.slice(0, 80), '|', r.yue.slice(0, 60)));
