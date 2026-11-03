#!/usr/bin/env node
// Cantonese (yue) translation plan (docs/i18n/coord/yue_plan.md): game/i18n/en.json in 6 chunks of about equal word
// count, plus chunk 7 = site/i18n/en.json (the website).
//   node tools/yue_chunks.js                    the chunk table; checks every key is in exactly one chunk; writes the
//                                               map docs/i18n/coord/yue_chunks.json ({ game: { key: chunk }, site: { key: 7 } })
//   node tools/yue_chunks.js --check            the same, without writing the map
//   node tools/yue_chunks.js --stats            keys done / total per chunk (from the ledger, see below)
//   node tools/yue_chunks.js --next <chunk> [--n 120] [--out f.json]
//                                               the next keys of that chunk not yet in its ledger, with their English,
//                                               one area at a time (chunk 7: site keys)
//   node tools/yue_chunks.js --leaks f.json     the Mandarin / Taiwan check of docs/i18n/yue.md section 10 on a batch
//                                               { key: "translation" }: lists every hit, exit 1 if any
//   node tools/yue_chunks.js --done <chunk> f.json
//                                               after a batch is merged, record its keys in the ledger of that chunk
// Why a ledger: game/i18n/yue.json and site/i18n/yue.json start as copies of zh-Hant, so "has a value" does not mean
// "translated" and tools/i18n_todo.js --next sees nothing to do. Each chunk has its own ledger file,
// docs/i18n/coord/yue_done/<chunk>.txt (one key per line), so parallel chunk lanes never touch the same file.
// A chunk is a list of areas. An area is what tools/i18n_todo.js calls one: the first two parts of a data.* or mod.*
// key (data.jokes, mod.toys), else the first part (yard, fr). The script fails (exit 1) when an area of en.json is in
// no chunk or in two, or a listed area no longer exists: then update CHUNKS here and the table in the plan.
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const EN = JSON.parse(fs.readFileSync(path.join(ROOT, 'game/i18n/en.json'), 'utf8'));
const SITE = JSON.parse(fs.readFileSync(path.join(ROOT, 'site/i18n/en.json'), 'utf8'));
const OUT = path.join(ROOT, 'docs/i18n/coord/yue_chunks.json');
const LEDGER = path.join(ROOT, 'docs/i18n/coord/yue_done');
const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(k); return i < 0 ? undefined : (argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? true : argv[i + 1]); };

const CHUNKS = {
  1: { name: 'UI, settings, account, journal, missions, care, tricks, shop, Dog Cards, photo, first week, diary, the yard', areas: 'shell phone settings title core cloud reset guide journal missions adopt care bath train tricks wardrobe shop cards photo idle time expressions fw dd home shelter yard data.ac_ch data.acts data.meters data.badge data.hint data.hint_name data.rarity data.stage_txt data.step_name data.tcmd data.tpose data.tricks data.slot_name data.spot_ord data.ms_pool data.dc_breed_words data.dc_outfits data.dc_words_a data.dc_words_b data.ph_caps data.ph_season_cap data.ex_words data.buff_text data.buff_txt data.perk data.perk_line data.jr_grand data.jr_mile_txt data.wrong' },
  2: { name: 'Dog lines: jokes, greetings, meals, potty, signature tricks, personalities, toy play', areas: 'data.jokes data.greet_lines data.eat_lines data.potty_lines data.sig data.sig_fb data.breed_pers data.breed_line data.bl_lines data.lines data.pl_lines data.ag_lines data.toys_lines data.pers_def data.duck_lines data.fluff_lines data.guard_lines data.chi_alert data.harvest_lines data.plant_lines data.water_lines data.sr_lines data.sr_traits data.ho_lines data.npc_jokes data.npc_lines data.mud' },
  3: { name: 'Gerald, letters and families, lessons and food safety, puppies, pack, genes and coats, vet', areas: 'mail vet playdate puppies genes mod.genes pack packplay pupplay data.gene_fb data.loci data.merle_by data.merle_words data.dapple_words data.tri_solid data.pig_need data.words data.starter_genes data.breed_names data.mix_list data.fallback_dogs data.bd_tips data.gd_lessons data.gd_steps data.people_food data.people_fb data.extra_unsafe data.tfood data.notes data.families data.town_families data.npc_boys data.npc_girls' },
  4: { name: 'Items and home: clothes, food, toys, decor, beds, houses, treasures, kitchen, garden', areas: 'data.clothes data.food data.toys data.hm_decor data.beds data.houses data.treasures data.fav data.recipes data.recipes_fb data.grand_recipes data.crops data.crops_fb data.crop_names data.pantry data.pantry_fb data.junk data.shop_name mod.toys mod.kitchen mod.garden garden toys' },
  5: { name: 'Places, walks, weather, the runner, the town map, Training Ground, Splash Pool', areas: 'data.place_lines data.walk_lines data.wx_lines data.wx_txt data.weather_txt data.places data.smells data.clues data.route_hint data.route_name data.route_notes data.route_word data.route_wx data.routes data.obs_label data.tg_miss data.spot_toast walk mod.walk route map map215 town agility pool ground tracks ball fetch roam' },
  6: { name: 'Japan trip and Tokyo, festivals and markets, Fun Fair, Friends, news', areas: 'tokyo japan data.tk_lines data.jp_place_lines data.tk_care data.tk_fb_hots data.tk_hot_label data.tk_places data.tk_stamp_n data.tk_station data.tk_ueno data.tk_fortunes data.jp_first data.jp_letter data.jp_mochi data.jp_place data.jp_toasts fest fm ff fr nw hw winter newyear popup data.fs_letters data.fs_months data.fs_season_line data.hw_cats data.hw_letter data.hw_plum data.wn_cats data.wn_letters data.ny_fortunes data.ny_zodiac data.season_name data.fr_notes' }
};

// the Mandarin and Taiwan-word check (docs/i18n/yue.md sections 10 and 11): almost never right in spoken Cantonese
const LEAKS = [
  [/們|牠|(?<!其)他|她|它/u, 'Mandarin pronoun: say 佢 / 佢哋, 我哋, 你哋, or 啲 for a group'],
  [/沒有|沒什麼|還沒|沒問題/u, 'Mandarin 沒: say 冇 / 未 / 冇問題'],
  [/什麼|怎麼|為什麼|這|那|哪/u, 'Mandarin 什麼/怎麼/這/那/哪: say 乜嘢 / 咩, 點, 點解, 呢, 嗰, 邊'],
  [/不要|不是|不會|不能|不用|不可以/u, 'Mandarin 不: say 唔好, 唔係, 唔會, 唔可以, 唔使'],
  [/喜歡|東西|現在|今天|明天|昨天|知道了|一下子/u, 'Mandarin word: say 鍾意, 嘢, 而家, 今日, 聽日, 琴日'],
  [/(?:[吧嗎喔]|(?<!摩)耶)(?=[！。？，、：」』）…\s]|$)/u, 'Mandarin particle: say 啦, 呀 / A唔A, 喎'],
  [/飼料|存檔|帳號|毛孩|米克斯|米格魯|吉娃娃|柯基|巴哥|黃金獵犬|雪納瑞|貴賓|動物之家|動物醫院|衣櫥|項圈|牽繩|院子|澆水|才藝|拍照|卡片|遊行|園遊會|攤位|腳踏車|冰箱|冰淇淋|冰棒|馬鈴薯|地瓜|玉米|紅蘿蔔|草莓|葡萄|鳳梨|酪梨|巧克力|起司|優格|鮭魚|鮪魚|吐司|甜甜圈|餛飩|磁鐵|飛盤|肉球|麋鹿/u, 'Taiwan word: use the HK word (yue.md section 11)']
];
// soft: printed as "check", never fails (fixed words like 的士, 了解, 實在, 自在, 但是 in a quote are fine)
const SOFT = [[/[的了是在]/u, 'Mandarin 的 / 了 / 是 / 在? Usually 嘅, 咗 / 喇, 係, 喺']];

const area = (k) => { const p = k.split('.'); return p[0] === 'data' || p[0] === 'mod' ? p[0] + '.' + p[1] : p[0]; };
// words as a translator meets them: HTML tags dropped, each {var} or ICU block counted as one word
const words = (s) => String(s).replace(/<[^>]+>/g, ' ').replace(/\{[^{}]*\}/g, ' x ').replace(/[{}]/g, ' ').split(/\s+/).filter(Boolean).length;
const readBatch = (f) => { const b = JSON.parse(fs.readFileSync(f, 'utf8')); if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error(f + ': not a { key: text } object'); return b; };

/* ---- the map: every game key in exactly one chunk ---- */
let bad = 0;
const owner = {};
for (const [n, c] of Object.entries(CHUNKS)) for (const a of c.areas.split(/\s+/)) {
  if (owner[a]) { console.error(`area ${a} is listed twice (chunk ${owner[a]} and chunk ${n})`); bad++; }
  owner[a] = n;
}
const map = {}, stat = {};
for (const n of Object.keys(CHUNKS)) stat[n] = { keys: 0, words: 0 };
const seen = new Set();
for (const k of Object.keys(EN)) {
  const a = area(k), n = owner[a];
  seen.add(a);
  if (!n) { console.error(`key ${k}: area ${a} is in no chunk`); bad++; continue; }
  map[k] = +n; stat[n].keys++; stat[n].words += words(EN[k]);
}
for (const a of Object.keys(owner)) if (!seen.has(a)) { console.error(`area ${a} is listed but has no keys in en.json`); bad++; }
const siteKeys = Object.keys(SITE).filter((k) => typeof SITE[k] === 'string' && !k.startsWith('_')).sort();
let siteWords = 0;
for (const k of siteKeys) siteWords += words(SITE[k]);
const total = Object.keys(EN).length, covered = Object.keys(map).length;
if (bad || covered !== total) { console.error(`FAIL: ${bad} problem(s), ${covered} of ${total} keys in a chunk`); process.exit(1); }
const keysOf = (n) => (+n === 7 ? siteKeys : Object.keys(map).filter((k) => map[k] === +n).sort());
const srcOf = (n) => (+n === 7 ? SITE : EN);
const chunkArg = (v) => { if (!/^[1-7]$/.test(String(v))) { console.error('chunk must be 1 to 7'); process.exit(2); } return +v; };
const ledgerFile = (n) => path.join(LEDGER, n + '.txt');
const ledger = (n) => new Set(fs.existsSync(ledgerFile(n)) ? fs.readFileSync(ledgerFile(n), 'utf8').split('\n').filter(Boolean) : []);

if (opt('--leaks')) {
  const f = opt('--leaks'), b = readBatch(f);
  let hard = 0, soft = 0;
  for (const [k, v] of Object.entries(b)) {
    if (typeof v !== 'string') continue;
    const text = v.replace(/\{[A-Za-z_$][\w$]*\}/g, ' ').replace(/<[^>]+>/g, ' ');
    for (const [re, why] of LEAKS) { const m = re.exec(text); if (m) { hard++; console.log(`LEAK ${k}: "${m[0]}" ${why}\n     ${v.slice(0, 100)}`); } }
    for (const [re, why] of SOFT) { const m = re.exec(text); if (m) { soft++; console.log(`check ${k}: "${m[0]}" ${why}\n     ${v.slice(0, 100)}`); } }
  }
  console.log(`${Object.keys(b).length} keys: ${hard} leak(s), ${soft} to check by hand`);
  process.exit(hard ? 1 : 0);
}

if (opt('--done')) {
  const n = chunkArg(opt('--done')), f = argv[argv.indexOf('--done') + 2];
  if (!f) { console.error('usage: --done <chunk> f.json'); process.exit(2); }
  const want = new Set(keysOf(n)), have = ledger(n), b = readBatch(f);
  const wrong = Object.keys(b).filter((k) => !want.has(k));
  if (wrong.length) { console.error(`not in chunk ${n}: ${wrong.slice(0, 10).join(' ')}${wrong.length > 10 ? ' …' : ''}`); process.exit(1); }
  for (const k of Object.keys(b)) if (typeof b[k] === 'string' && b[k] !== '') have.add(k);
  fs.mkdirSync(LEDGER, { recursive: true });
  fs.writeFileSync(ledgerFile(n), [...have].sort().join('\n') + '\n');
  console.log(`chunk ${n}: ${have.size} / ${want.size} keys done`);
  process.exit(0);
}

if (opt('--next')) {
  const n = chunkArg(opt('--next')), max = +opt('--n') || 120, done = ledger(n), src = srcOf(n);
  const left = keysOf(n).filter((k) => !done.has(k));
  const first = left.length ? (n === 7 ? k0(left[0]) : area(left[0])) : '';
  function k0(k) { return k.split('.')[0]; }
  const out = {};
  for (const k of left.filter((k) => (n === 7 ? k0(k) : area(k)) === first).slice(0, max)) out[k] = src[k];
  const txt = JSON.stringify(out, null, 1) + '\n';
  if (typeof opt('--out') === 'string') { fs.writeFileSync(opt('--out'), txt); console.log(`chunk ${n}: ${Object.keys(out).length} keys of ${first || '(none)'} (${left.length} left) -> ${opt('--out')}`); }
  else process.stdout.write(txt);
  process.exit(0);
}

if (opt('--stats')) {
  for (let n = 1; n <= 7; n++) { const all = keysOf(n), d = ledger(n); console.log(`chunk ${n}: ${all.filter((k) => d.has(k)).length} / ${all.length} keys done${n === 7 ? ' (site)' : ''}`); }
  process.exit(0);
}

const sumW = Object.values(stat).reduce((s, x) => s + x.words, 0);
console.log('chunk | keys | words | share | name');
for (const [n, c] of Object.entries(CHUNKS)) console.log(`${n} | ${stat[n].keys} | ${stat[n].words} | ${(100 * stat[n].words / sumW).toFixed(1)} % | ${c.name}`);
console.log(`7 | ${siteKeys.length} | ${siteWords} | site | site/i18n/en.json (the website)`);
console.log(`game: ${covered} of ${total} keys in exactly one chunk, ${sumW} words`);
if (!opt('--check')) {
  fs.writeFileSync(OUT, '{\n "game": {\n' + Object.keys(map).sort().map((k) => `  ${JSON.stringify(k)}: ${map[k]}`).join(',\n') + '\n },\n "site": {\n' + siteKeys.map((k) => `  ${JSON.stringify(k)}: 7`).join(',\n') + '\n }\n}\n');
  console.log('wrote ' + path.relative(ROOT, OUT));
}
console.log('OK');
