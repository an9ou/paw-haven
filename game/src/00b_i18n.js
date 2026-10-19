// v2.14 "Hello in Every Language": the shared-scope i18n helpers (V214.md 4.2). STUB from the Coordinator: every helper returns
// the English, formatted with game/i18n/msg.js (window.PawI18nMsg, loaded by the shell's pawi18n slot). The I18N CORE lane
// makes it real (tables, S.lang, the picker). The names below must not be bound anywhere else in game/src (the i18n suite checks).
const PIM = window.PawI18nMsg || null;
function tlang() { return 'en'; }
function tid(s) { return PIM ? PIM.id(s) : String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
function tt(key, en, vars) { return PIM ? PIM.format(en, vars, 'en') : en; }
function tdata(path, en, vars) { return tt('data.' + path, en, vars); }
function tbreed(key) { const G = window.PawGenes; return (G && G.BREED_NAMES && G.BREED_NAMES[key]) || key; }
function tnum(n, opts) { return PIM ? PIM.num(n, 'en', opts) : String(n); }
function tdate(d, opts) { return PIM ? PIM.date(d, 'en', opts) : String(d); }
function tlist(arr) { return PIM ? PIM.list(arr, 'en') : arr.join(', '); }
function tsetLang(code) { return false; }
window.PawI18n = { tt, tdata, tbreed, tnum, tlang };
