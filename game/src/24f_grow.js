/* ======================= v2.20 "Missions v2": 24f_grow.js (MISSIONS lane, Part F: Growing up) =======================
   Contract: V220.md (section 3, part F). Design: docs/design/missions-v2.md 3.5 and its "Decided" section.
   Every dog has a "Growing up" strip in Journal > Profile: four moments for each life stage (lifeStage: puppy under 6 months, young under 12,
   adult, senior from 84; one real day is one dog month). A dog shows the moments of the stage it is in now; a stage it joined after (a dog
   adopted as an adult) is skipped quietly, and the moments of a stage it grew out of simply stay as they are, done or not.
   A moment done: S.missions.grow[dogId][momentId] = the Japan date. Its rewards (no coins, ever): a dated mark on the pencil height chart
   (PawArt.MISSIONS.chart(marks), a plain chart until the art is merged), a line on today's diary page in the dog's voice (S.dd.today.gu,
   48_dogdays.js ddPageLines), and the stage's lesson in the strip. A moment can also be that dog's daily wish (msGrowWish, asked by
   48_dogdays.js ddWishMake): about one day in three, gently, and only a moment the wish can really make come true.
   Every dog counts the same, puppies included. No puppy or litter goal anywhere (welfare); a puppy's first walk is a short one.
   Under the test harness all of it needs prefs.msTest (msAllowed). Test hook: window.__paw.msg. */
const MSG = { t: 0 };
const MSG_STAGES = ['puppy', 'young', 'adult', 'senior'];
const msgHas = (o, k) => o.some((x) => x[0] === k);
const msgArgs = (o, k) => { const r = o.find((x) => x[0] === k); return (r && Array.isArray(r[1]) && r[1]) || []; };
// the dog's softest bed (the bed it naps on is the best one owned)
function msgBestBed(d) {
  const beds = Array.isArray(S.beds) && S.beds.length ? S.beds : [S.bed], mine = (S.bedOf && S.bedOf[d.id]) || S.bed;
  const best = Math.max(...beds.map((n) => (bedInfo(n).bonus || 0)));
  return (bedInfo(mine).bonus || 0) >= best;
}
/* the 16 moments. st: the stage, t: the name, s: what to do, d: the diary line in the dog's own voice, m: does an act count (a, dog),
   v: a state that counts (dog), w: the daily wish that makes it come true (the dog's wish options, a seeded random) or null */
const MS_GROW = [
  { id: 'p_bath', st: 'puppy', t: 'First bath', s: 'Give a bubbly bath', d: 'I had my very first bath today. Bubbles everywhere, and I smell like a flower now.', m: (a) => a.kind === 'bath', w: (o) => (msgHas(o, 'bath') ? ['bath', null] : null) },
  { id: 'p_ball', st: 'puppy', t: 'First ball game', s: 'Throw a ball', d: 'I played my first ball game! My ears flapped the whole time.', m: (a) => a.kind === 'fetch', w: (o) => (msgHas(o, 'ball') ? ['ball', null] : null) },
  { id: 'p_walk', st: 'puppy', t: 'First short walk', s: 'A short walk, like the Sunny Park', d: 'My first walk! A short one, because my legs are still small. I sniffed everything.', m: (a) => a.kind === 'walk' && !!ROUTES[a.area] && (ROUTES[a.area].secs || 99) <= 60, w: (o) => (msgArgs(o, 'walk').includes('park') ? ['walk', 'park'] : null) },
  { id: 'p_tag', st: 'puppy', t: 'A name tag', s: 'Make a name tag', d: 'I have a name tag now. Everybody in town will know who I am.', m: (a) => a.kind === 'nametag' },
  { id: 'y_trick', st: 'young', t: 'A new trick', s: 'Teach a trick until it is learned', d: 'I learned a whole new trick today. I am very clever.', m: (a) => a.kind === 'trick' && !!a.learned },
  { id: 'y_trail', st: 'young', t: 'A new trail', s: 'Walk any route but the Sunny Park', d: 'We walked a brand new trail. So many new smells!', m: (a) => a.kind === 'walk' && !!a.area && a.area !== 'park', w: (o, r) => { const L = msgArgs(o, 'walk').filter((k) => k !== 'park'); return L.length ? ['walk', L[Math.floor(r() * L.length) % L.length]] : null; } },
  { id: 'y_paddle', st: 'young', t: 'First paddle', s: 'Paddle at the Splash Pool', d: 'I paddled for the first time. Wet paws, happy dog.', m: (a) => a.kind === 'paddle', w: (o) => (msgHas(o, 'paddle') ? ['paddle', null] : null) },
  { id: 'y_photo', st: 'young', t: 'First photo', s: 'Take a photo with {name} in it', d: 'My first photo! I did my very best face.', m: (a) => a.kind === 'photo', w: (o) => (msgHas(o, 'photo') ? ['photo', null] : null) },
  { id: 'a_agility', st: 'adult', t: 'An agility run', s: 'Run the course at the Training Ground', d: 'I ran the whole agility course today. Jumps, tunnels and a big cheer at the end.', m: (a) => a.kind === 'agility' },
  { id: 'a_bond5', st: 'adult', t: 'Bond 5', s: 'Reach Bond 5 together', d: 'We are Bond 5 now. I knew we would be best friends.', v: (d) => !!(d.bond && d.bond.level >= 5) },
  { id: 'a_pack', st: 'adult', t: 'A pack walk', s: 'Walk with two or more dogs', d: 'We all went for a walk together, the whole pack. Best walk ever.', m: (a) => a.kind === 'walk' && (+a.pack || 1) >= 2 },
  { id: 'a_cafe', st: 'adult', t: 'A café visit', s: 'Visit the Pupuccino Café', d: 'We went to the café today. I sat very nicely and everybody said so.', m: (a) => a.kind === 'travel' && a.place === 'cafe', w: (o) => (msgArgs(o, 'place').includes('cafe') ? ['place', 'cafe'] : null) },
  { id: 's_sniff', st: 'senior', t: 'A slow sniff walk', s: 'Any walk, at an easy pace', d: 'We took a slow walk today and I sniffed every single thing. No hurry at all.', m: (a) => a.kind === 'walk', w: (o) => (msgHas(o, 'walk') ? ['walk', null] : null) },
  { id: 's_bed', st: 'senior', t: 'A nap on the best bed', s: 'Nap indoors on your softest bed', d: 'I had a long nap on the softest bed in the house. My old bones say thank you.', m: (a, d) => a.kind === 'nap' && S.place === 'house' && msgBestBed(d) },
  { id: 's_vet', st: 'senior', t: 'A vet check', s: 'Visit the Vet Clinic', d: 'The vet checked me over today. Dr. Paws says I am in fine shape for my age.', m: (a) => a.kind === 'travel' && a.place === 'vet', v: (d) => d.vetDay === todayKey(), w: (o) => (msgArgs(o, 'place').includes('vet') ? ['place', 'vet'] : null) },
  { id: 's_photo', st: 'senior', t: 'A portrait', s: 'Take a photo with {name} in it', d: 'We took a portrait of me today. Grey muzzle and all, I look very wise.', m: (a) => a.kind === 'photo', w: (o) => (msgHas(o, 'photo') ? ['photo', null] : null) }
];
const msgDef = (id) => MS_GROW.find((x) => x.id === id);
const msgName = (m) => tdata('ms_grow.' + m.id + '.t', m.t);
const msgStage = (d) => lifeStage(ageMonths(d));
function msgOk() { return !!(S && S.missions && S.missions.grow && Array.isArray(S.dogs) && S.dogs.length && msAllowed()); }
const msgOf = (d) => { const g = S.missions.grow[d.id]; return g && typeof g === 'object' && !Array.isArray(g) ? g : {}; };
const msgDone = (d, id) => !!msgOf(d)[id];
// the dogs an act was for: the walkers of a walk, the dog in the pool or on the course, the dogs in the photo, the dogs it names, else the active dog
function msgActDogs(a) {
  const byName = (n) => S.dogs.find((x) => x.name === n);
  if (a.kind === 'walk' && Array.isArray(a.walkers) && a.walkers.length) return a.walkers.map((id) => dogById(id)).filter(Boolean);
  if ((a.kind === 'paddle' || a.kind === 'agility') && a.name) { const d = byName(a.name); return d ? [d] : [D()]; }
  if (a.kind === 'photo' && Array.isArray(a.names) && a.names.length) return S.dogs.filter((x) => a.names.includes(x.name));
  if (a.kind === 'nametag' && a.id) { const d = dogById(a.id); return d ? [d] : [D()]; }
  if (Array.isArray(a.ids) && a.ids.length) return a.ids.map((id) => dogById(id)).filter(Boolean);
  return [D()];
}
// a moment done: the date, a line on today's diary page, one batched toast
function msgMark(d, m) {
  if (!d || msgDone(d, m.id)) return false;
  const G = S.missions.grow; if (!G[d.id] || typeof G[d.id] !== 'object' || Array.isArray(G[d.id])) G[d.id] = {};
  G[d.id][m.id] = jstISO(); markDirty();
  try { if (typeof ddReady === 'function' && ddReady()) { const p = ddToday(); if (p) { if (!Array.isArray(p.gu)) p.gu = []; if (p.gu.length < 4 && !p.gu.some((x) => x.i === d.id && x.m === m.id)) p.gu.push({ i: d.id, n: d.name, m: m.id }); } } } catch (e) { /* no diary today */ }
  ms2Say(tt('ms2g.done', '{name} is growing up: {moment}. A new mark on the height chart, in the Profile.', { name: d.name, moment: msgName(m) }), 'good', 'msg', (k) => tt('ms2g.done_many', '{n} growing up moments. New marks on the height chart.', { n: k }));
  return true;
}
function msGrowOnAct(a) {
  if (!a || !a.kind || !msgOk() || cur.mode === 'title') return;
  let any = false;
  msgActDogs(a).forEach((d) => { const st = msgStage(d); MS_GROW.forEach((m) => { if (m.st !== st || !m.m || msgDone(d, m.id)) return; let hit = false; try { hit = !!m.m(a, d); } catch (e) { hit = false; } if (hit && msgMark(d, m)) any = true; }); });
  if (any) msgRefresh();
}
on('act', msGrowOnAct);
// the moments that count by state (Bond 5, a vet check-up today), every 2 s
function msgTick() {
  if (!msgOk() || cur.mode === 'title' || cur.mode === 'adopt') return;
  let any = false;
  S.dogs.forEach((d) => { const st = msgStage(d); MS_GROW.forEach((m) => { if (m.st !== st || !m.v || msgDone(d, m.id)) return; let ok = false; try { ok = !!m.v(d); } catch (e) { ok = false; } if (ok && msgMark(d, m)) any = true; }); });
  if (any) msgRefresh();
}
// a moment as the dog's daily wish (48_dogdays.js ddWishMake asks first): about one day in three, seeded by the day and the dog, never forced
function msGrowWish(d, day) {
  if (!d || !msgOk() || typeof ddWishOpts !== 'function') return null;
  const r = seeded(hashId(day + '|grow|' + d.id)); if (r() >= 0.34) return null;
  const st = msgStage(d), o = ddWishOpts(d), L = [];
  MS_GROW.forEach((m) => { if (m.st !== st || !m.w || msgDone(d, m.id)) return; let w = null; try { w = m.w(o, r); } catch (e) { w = null; } if (w) L.push({ k: w[0], a: w[1], m: m.id }); });
  return L.length ? L[Math.floor(r() * L.length) % L.length] : null;
}
// the diary lines for today's page (48_dogdays.js ddPageLines): the writer's own moments in its voice, a pack mate's in a short line
function msGrowLines(p) {
  return (Array.isArray(p.gu) ? p.gu : []).map((e) => { const m = e && msgDef(e.m); if (!m) return ''; return e.i === p.id ? tdata('ms_grow.' + m.id + '.d', m.d) : tt('ms2g.d_other', '{name} grew up a little today: {moment}.', { name: e.n, moment: msgName(m) }); }).filter(Boolean);
}

/* ---------------- the strip in Journal > Profile ---------------- */
function msgLesson(st) {
  switch (st) {
    case 'puppy': return tt('ms2g.lesson_puppy', 'Puppies need short walks and lots of naps. Their bones are still growing.');
    case 'young': return tt('ms2g.lesson_young', 'Young dogs learn fast with treats and praise. Keep lessons short and fun.');
    case 'senior': return tt('ms2g.lesson_senior', 'Older dogs love soft beds and gentle walks. Regular vet checks keep them comfy.');
    default: return tt('ms2g.lesson_adult', 'Grown dogs need a walk and play every day. A busy dog is a calm dog.');
  }
}
// the plain pencil height chart (a ruler with a mark for each moment, by stage), until the art lane's PawArt.MISSIONS.chart is merged
function msgChartFB(marks) {
  const y = (i, k) => 140 - i * 30 - k * 6;
  const ticks = Array.from({ length: 13 }, (_, i) => `<path d="M30 ${16 + i * 10} h${i % 2 ? 6 : 10}" stroke="#8A7566" stroke-width="1.3" stroke-linecap="round"/>`).join('');
  const per = {}, mk = marks.map((m) => { const i = Math.max(0, MSG_STAGES.indexOf(m.stage)), k = per[i] = (per[i] || 0) + 1; const yy = y(i, k - 1); return `<path d="M44 ${yy} h22" stroke="#5B3D32" stroke-width="2.2" stroke-linecap="round"/><circle cx="68" cy="${yy}" r="3" fill="#F28FA5" stroke="#5B3D32" stroke-width="1.2"/>`; }).join('');
  return `<svg viewBox="0 0 90 160" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="8" width="24" height="144" rx="3" fill="#FFF4DF" stroke="#5B3D32" stroke-width="2"/>${ticks}${mk}</svg>`;
}
function msGrowHTML(d) {
  if (!d || !msgOk()) return '';
  const st = msgStage(d), L = MS_GROW.filter((m) => m.st === st), g = msgOf(d), n = L.filter((m) => g[m.id]).length;
  const W = S.dd && S.dd.wish && S.dd.wish.day === localISO() && S.dd.wish.w ? S.dd.wish.w[d.id] : null, gm = W && !W.done ? W.gm || '' : '';
  const day = (iso) => tdate(new Date(iso + 'T12:00:00'), { day: 'numeric', month: 'short' });
  const marks = MS_GROW.filter((m) => g[m.id]).sort((a, b) => String(g[a.id]).localeCompare(String(g[b.id]))).map((m) => ({ stage: m.st, label: day(g[m.id]), id: m.id }));
  const chart = ms2Art('chart', marks.map((x) => ({ stage: x.stage, label: x.label })));
  const rows = L.map((m) => { const on = !!g[m.id]; return `<li class="msg-m${on ? ' done' : ''}" data-moment="${m.id}">${MS_TICK}<span class="msg-mt"><b>${esc(msgName(m))}</b><span class="msg-ms">${esc(on ? tt('ms2g.marked', 'Marked on {date}', { date: day(g[m.id]) }) : tdata('ms_grow.' + m.id + '.s', m.s, { name: d.name }))}</span></span>${!on && gm === m.id ? `<span class="msg-wish">${esc(tt('ms2g.wish', "Today's wish"))}</span>` : ''}</li>`; }).join('');
  return `<section class="msg" aria-label="${esc(tt('ms2g.title', 'Growing up'))}"><div class="msg-hd"><h4>${esc(tt('ms2g.title', 'Growing up'))}</h4><span class="msg-stage">${esc(gkStage(st))}</span><span class="msg-n">${esc(tt('ms2g.count', '{n} of {total} moments', { n, total: L.length }))}</span></div>`
    + `<div class="msg-body"><span class="msg-chart${chart ? ' art' : ''}" aria-hidden="true">${chart || msgChartFB(marks)}</span><ul class="msg-list">${rows}</ul></div>`
    + `<p class="msg-lesson"><b>${esc(tt('ms2n.gerald_says', 'Gerald says'))}</b> ${esc(msgLesson(st))}</p></section>`;
}
// redraw an open Profile (only its strip)
function msgRefresh() {
  const el = document.querySelector('#modal .panel.journal .msg'); if (!el || typeof jProfDog === 'undefined') return;
  const d = dogById(jProfDog) || D(); el.outerHTML = msGrowHTML(d) || '<span hidden class="msg"></span>';
}

/* ---------------- wiring ---------------- */
setInterval(() => { try { msgTick(); } catch (e) { console.warn('growing up', e); } }, 2000);
function msgExpose() {
  if (!window.__paw) return;
  window.__paw.msg = {
    moments: MS_GROW.map((m) => ({ id: m.id, st: m.st })), stage: (id) => msgStage(id ? dogById(id) : D()), html: (id) => msGrowHTML(id ? dogById(id) : D()), tick: () => msgTick(), wish: (id, day) => msGrowWish(id ? dogById(id) : D(), day || localISO()),
    done: (id) => Object.assign({}, msgOf(id ? dogById(id) : D())), lines: (p) => msGrowLines(p), mark: (id, m) => msgMark(dogById(id) || D(), msgDef(m))
  };
}
on('game:ready', () => setTimeout(msgExpose, 0));
on('yard:enter', () => { if (window.__paw && !window.__paw.msg) msgExpose(); });
