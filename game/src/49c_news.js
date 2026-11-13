/* ======================= v2.18.2 "What's new in town": 49c_news.js (tag nw) =======================
   After an update with news, every player sees one crayon sheet once, the first time the yard is calm on that version.
   Data: NEWS below, newest first. Each entry: { id (the version), date (ISO), title(), items: [{ ic(), tx() }] (3 to 5), pic? }.
   pic: 'dog' (the player's own dog's crayon head) or { item: 'Shop item name' }. Every text goes through tt() (key nw.<id>.*): add the
   English here, run `node tools/i18n_extract.js --en`, translate the new keys in one batch, `node tools/i18n_pack.js`.
   Save field S.newsSeen: the last id seen ('' on an old save, so it sees the newest entry once; a new save gets the newest id at adoption).
   When: on a calm yard (no popup, no first-day guide, no level-up or Bond 2 party, and the calendar's daily page goes first), after 3 s of calm.
   Again: Settings "What's new" and the phone "..." menu. Under the test harness it needs prefs.nwTest (the older suites never see it).
   Test hook: window.__paw.nw. How to add an entry each release: V218.md section "What's new". */
function nwOn() { return !navigator.webdriver || !!prefs.nwTest; }
const NW = { calm: 0, exposed: false };
const nwDate = (iso) => tdate(new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10)), { day: 'numeric', month: 'long' });
const nwItemArt = (n) => art('item', n);
const nwFmDate = (id, i) => { const m = FM_MARKETS.find((x) => x.id === id); return m ? nwDate('2026-' + m.win()[i]) : ''; }; // a market's first (0) or last (1) day, 2026
const NEWS = [
  { // v2.19.3 Puppy start (V2193.md, owner 5 Nov 2026): before the Friends news of 7 Nov, so that one stays the newest when it goes live
    id: '2.19.3', date: '2026-11-05', c: '#FBE3D6', d: 'paw', pic: 'dog',
    title: () => tt('nw.v2193.title', 'Puppies at the shelter'),
    items: [
      { ic: () => nwSafe(() => ICON('heart')), tx: () => tt('nw.v2193.pup', 'Starter dogs from the shelter now come home as 3-month-old puppies and grow up a little every day') },
      { ic: () => nwSafe(() => ICON('star')), tx: () => tt('nw.v2193.back', 'Starter dogs that have not had puppies got some puppy months back, so there is more growing up to watch') }
    ]
  },
  { // Daily rhythm (docs/design/daily-rhythm.md). The date is a placeholder until the release day is set (after v2.19, 7 Nov 2026)
    id: '2.19.2', date: '2026-11-04', c: '#E2F0D9', d: 'paw', pic: 'dog',
    title: () => tt('nw.v2192.title', 'A calmer day in town'),
    items: [
      { ic: () => nwSafe(() => msHudIcon()), tx: () => tt('nw.v2192.mission', 'One daily mission now, worth {n} coins and a crayon stamp, with one free swap a day', { n: MS_PAY }) },
      { ic: () => nwItemArt('Pupcake'), tx: () => tt('nw.v2192.stamps', 'Every finished mission stamps the card. Seven stamps bring a surprise, and later cards give {n} coins and a Pupcake', { n: MS_CARD_COINS }) },
      { ic: () => nwSafe(() => ICON('sleep')), tx: () => tt('nw.v2192.clock', 'A calmer clock: a game day lasts one real hour, so dogs get hungry and sleepy more slowly') },
      { ic: () => fwCalIcon(), tx: () => tt('nw.v2192.daily', 'Daily bonuses and the mission start again every day at midnight in Japan') },
      { ic: () => nwSafe(() => ICON('walk')), tx: () => tt('nw.v2192.walks', 'The first {n} walks of a day pay full coins. After that your dog is happily tired and walks pay half', { n: WALK_FULL }) }
    ]
  },
  {
    id: '2.18.4', date: '2026-10-30', c: '#D3E4F4', d: 'snow', pic: { item: 'Snowman Suit' },
    title: () => tt('nw.v2184.title', 'The Winter Market is coming!'),
    items: [
      { ic: () => nwItemArt('Present Pile'), tx: () => tt('nw.v2184.market', 'The {market} comes to town from {from} to {to}', { market: tt('fm.m_winter', 'Winter Market'), from: nwFmDate('winter', 0), to: nwFmDate('winter', 1) }) },
      { ic: () => nwItemArt('Puffer Jacket'), tx: () => tt('nw.v2184.costumes', '10 winter costumes from the {first} to the {last}, and two of them keep a dog warm in the snow', { first: tItem('Father Christmas Suit'), last: tItem('Penguin Suit') }) },
      { ic: () => nwItemArt('Star Lantern'), tx: () => tt('nw.v2184.decor', '5 yard decorations, and the lights glow after dark') },
      { ic: () => nwItemArt('Gingerbread Kennel'), tx: () => tt('nw.v2184.homes', 'A {kennel}, 4 cosy beds and 5 winter toys', { kennel: tItem('Gingerbread Kennel') }) },
      { ic: () => nwItemArt('Reindeer Crunch'), tx: () => tt('nw.v2184.treats', '3 dog-safe winter treats') }
    ]
  },
  {
    id: '2.18.2', date: '2026-10-30', c: '#FFE3A1', d: 'leaf', pic: 'dog',
    title: () => tt('nw.v2182.title', 'The Fun Fair is in town!'),
    items: [
      { ic: () => nwItemArt('Paper Kite'), tx: () => tt('nw.v2182.fair', 'Fun Fair: 5 minigames ({games}) and 3 town jobs', { games: tlist(['catch', 'bubble', 'seek', 'show', 'kite'].map((k) => ffName(k))) }) },
      { ic: () => nwItemArt('Yellow Raincoat'), tx: () => tt('nw.v2182.rain', 'Rainy days: dogs get wet in the rain, and a raincoat keeps them dry') },
      { ic: () => nwItemArt('Pumpkin Ball'), tx: () => tt('nw.v2182.halloween', '{market}: 25 new items, open until {date}', { market: tt('fm.m_halloween', 'Halloween Market'), date: nwDate('2026-11-15') }) },
      { ic: () => fwCalIcon(), tx: () => tt('nw.v2182.gift', 'A daily gift in the calendar every day you play') },
      { ic: () => nwItemArt('Market Basket'), tx: () => tt('nw.v2182.stall', 'Saturday market stall and the weekly photo contest') }
    ]
  }
];
/* v2.19 "Friends first": 50_friends.js adds this entry only when FR_LIVE is on (nwSort puts it in date order), so the news never shows Friends before the release */
const nwFrArt = (k) => nwSafe(() => { const P = window.PawArt; return P && P.FRIENDS && typeof P.FRIENDS[k] === 'function' ? P.FRIENDS[k]() : ''; });
const NEWS_V219 = {
  id: '2.19', date: '2026-11-07', c: '#FFE3EC', d: 'paw', pic: 'dog',
  title: () => tt('nw.v219.title', 'Friends are here!'),
  items: [
    { ic: () => nwFrArt('badge'), tx: () => tt('nw.v219.friends', 'Pick a friend name, then share your code or an invite link. Up to 50 friends') },
    { ic: () => nwFrArt('paw'), tx: () => tt('nw.v219.visit', "Visit a friend's yard, pet their dogs and leave a paw-print note") },
    { ic: () => nwFrArt('wrap'), tx: () => tt('nw.v219.gift', 'Send one gift a day: a treat, seeds or something from your garden') },
    { ic: () => nwFrArt('ribbon'), tx: () => tt('nw.v219.walk', "Take a friend's dog on your walk, and your friend gets a letter about it") },
    { ic: () => nwSafe(() => ICON('lock')), tx: () => tt('nw.v219.safe', 'No typing and no search: a friend joins only with your code or invite link') }
  ]
};
/* v2.20 "Little Helps" (Missions v2; V220.md, docs/design/missions-v2.md): nwSort adds this entry only with MS2_LIVE on (24b_missions2.js; like Friends,
   never on the GitHub Pages test copy or with the dev switch) and once the Japan date reaches its date, so the news never shows Missions v2 before the release */
const nwMsArt = (k, ...a) => nwSafe(() => (typeof ms2Art === 'function' ? ms2Art(k, ...a) : '')); // PawArt.MISSIONS through ms2Art, '' until the art lands
const NEWS_V220 = {
  id: '2.20', date: '2026-11-07', // LAUNCH DATE: set at release (owner's date)
  c: '#FFF1C9', d: 'paw', pic: 'dog',
  title: () => tt('nw.v220.title', 'More little things to do'),
  items: [
    { ic: () => nwMsArt('tab', 'today') || nwSafe(() => msHudIcon()), tx: () => tt('nw.v220.helps', "Two little helps a day beside the mission. Finish all three for a treat from Gerald's pouch") },
    { ic: () => nwMsArt('tab', 'week') || nwSafe(() => ICON('walk')), tx: () => tt('nw.v220.board', "Gerald's help-wanted board comes every Monday. Do any {need} of its {notes} notes for a thank-you letter with {n} coins", { need: MSW_NEED, notes: MSW_NOTES, n: MSW_COINS }) },
    { ic: () => nwMsArt('medal') || nwSafe(() => ICON('star')), tx: () => tt('nw.v220.badges', 'Badges for all the things you love to do, with stickers, titles, cups and the Crayon Medal') },
    { ic: () => nwMsArt('tab', 'notebook') || fwCalIcon(), tx: () => tt('nw.v220.notebook', "New in town? Gerald's notebook has one page a day for your first {n} days", { n: 14 }) },
    { ic: () => nwMsArt('chart', []) || nwSafe(() => ICON('bond')), tx: () => tt('nw.v220.grow', "Growing up moments for every dog, marked on a crayon height chart in each dog's Profile") }
  ]
};
const nwV220Due = () => MS2_LIVE && jstISO() >= NEWS_V220.date; // the launch switch first (MS2_LIVE), then the date
/* v2.21 "Five New Friends" (V221.md 8): launches with v2.20 on the same switch and date (v221On = ms2On), so it shows only with MS2_LIVE on, from its date */
const nwHead = (k) => nwSafe(() => art('dogHead', k)); // PawArt.dogHead (the neutral mutt until the art lands, artKey)
const NEWS_V221 = {
  id: '2.21', date: NEWS_V220.date, // LAUNCH DATE: the v2.20 date (owner's date)
  c: '#E9F3FF', d: 'paw', pic: 'dog',
  title: () => tt('nw.v221.title', 'Five new friends at the shelter'),
  items: [
    { ic: () => nwHead('dalmatian'), tx: () => tt('nw.v221.dalmatian', 'Dalmatians, black or liver spotted, who love a long run') },
    { ic: () => nwHead('bernese'), tx: () => tt('nw.v221.bernese', 'Bernese Mountain Dogs, big, gentle and fluffy in three colours') },
    { ic: () => nwHead('aussie'), tx: () => tt('nw.v221.aussie', 'Australian Shepherds in black, red and merle, with or without copper and white') },
    { ic: () => nwHead('cavalier'), tx: () => tt('nw.v221.cavalier', 'Cavalier King Charles Spaniels: Blenheim, tricolour, ruby and black and tan') },
    { ic: () => nwHead('jrt'), tx: () => tt('nw.v221.jrt', 'Jack Russell Terriers, small, white and full of bounce') }
  ]
};
const nwV221Due = () => MS2_LIVE && jstISO() >= NEWS_V221.date;
const NEWS_V222 = { // v2.22 Town levels and dog habits (V222.md), launches with v2.20 + v2.21 on the owner's date
  id: '2.22', date: NEWS_V220.date, // LAUNCH DATE: the v2.20 date (owner's date)
  c: '#FFF4C9', d: 'paw', pic: 'dog',
  title: () => tt('nw.v222.title', 'Town levels and dog habits'),
  items: [
    { ic: () => nwSafe(() => (window.PawArt && PawArt.LEVELS ? PawArt.LEVELS.star(5, 0.6, {}) : ICON('star'))), tx: () => tt('nw.v222.level', 'You have a Town level now. Everything you do in town fills your star, and new levels open new places, walks and shop rows') },
    { ic: () => nwSafe(() => (window.PawArt && PawArt.LEVELS ? PawArt.LEVELS.habit(3) : ICON('heart'))), tx: () => tt('nw.v222.habits', 'Every Bond level shows one of your dog\'s habits. Find them in Journal, Profile') },
    { ic: () => nwSafe(() => (window.PawArt && PawArt.LEVELS ? PawArt.LEVELS.sticker(0) : ICON('star'))), tx: () => tt('nw.v222.stars', 'Nothing that was open closes. Past level 20, every full star brings a sticker') }
  ]
};
const nwV222Due = () => MS2_LIVE && jstISO() >= NEWS_V222.date;
const NEWS_V223 = { // v2.23 Coat colours (V223.md): the starter's coat and eye colour on the adoption card
  id: '2.23', date: '2026-11-07', c: '#FDE7D3', d: 'paw', pic: 'dog',
  title: () => tt('nw.v223.title', 'Pick your dog\'s coat colour'),
  items: [
    { ic: () => nwHead('lab'), tx: () => tt('nw.v223.coat', 'When you adopt a starter dog, you can pick its coat colour. Every breed has its own real colours') },
    { ic: () => nwHead('husky'), tx: () => tt('nw.v223.eyes', 'Huskies, Aussies, Border Collies and merle dogs can have blue, brown or odd eyes too') }
  ]
};
const nwV223Due = () => MS2_LIVE && jstISO() >= NEWS_V223.date;
const NEWS_V2232 = { // v2.23.2 Cantonese (docs/i18n/yue.md): 廣東話, the 12th language, live with YUE_LIVE (owner, 9 Nov 2026)
  id: '2.23.2', date: '2026-11-09', c: '#F9E0E6', d: 'heart', pic: 'dog',
  title: () => tt('nw.v2232.title', 'Now in Cantonese!'),
  items: [
    { ic: () => nwSafe(() => ICON('settings')), tx: () => tt('nw.v2232.yue', 'Doodle Doggo now speaks 廣東話 (Cantonese). Pick it in Settings: that makes 12 languages') },
    { ic: () => nwSafe(() => ICON('heart')), tx: () => tt('nw.v2232.thanks', 'A big thank you to a native speaker from Hong Kong who checked every line') }
  ]
};
const nwV2232Due = () => MS2_LIVE && jstISO() >= NEWS_V2232.date;
/* v2.24 "Kind shop" (V224.md 7): added by nwSort only with SHOP_LIVE on (52_kindshop.js), so the news never mentions the shop before the release.
   LAUNCH DATE: the date below is a placeholder; the launch step must set it to the owner's date (V224.md, "Launch checklist"). */
const NEWS_V224 = {
  id: '2.24', date: '2026-11-09', // LAUNCH DATE: the owner's launch, 9 Nov 2026
  c: '#FFEFD0', d: 'paw', pic: 'dog',
  title: () => tt('nw.v224.title', 'The Kind shop is open'),
  items: [
    { ic: () => nwSafe(() => nwItemArt('Sukajan Jacket')) || nwSafe(() => ICON('star')), tx: () => tt('nw.v224.shop', 'The Kind shop on Market Street has coins and looks only, nothing that changes a dog or its Bond') },
    { ic: () => nwSafe(() => nwItemArt('Little Sneakers')) || nwSafe(() => ICON('walk')), tx: () => tt('nw.v224.tokyo', 'Tokyo Street outfits, with Little Sneakers for the new Feet slot in the Wardrobe') },
    { ic: () => nwSafe(() => nwItemArt('Cocoa Mug Lamp')) || nwSafe(() => ICON('heart')), tx: () => tt('nw.v224.cozy', 'Cozy Winter decorations for the yard and the house') },
    { ic: () => nwSafe(() => nwItemArt('Garden Sprinkler')) || nwSafe(() => ICON('sleep')), tx: () => tt('nw.v224.tools', 'Comfort tools: a Robo Scoop, a Garden Sprinkler and an Auto Water Bowl. Switch them off any time in Settings') },
    { ic: () => nwSafe(() => nwItemArt('Golden Name Tag')) || nwSafe(() => ICON('bond')), tx: () => tt('nw.v224.free', "The Supporter Pack and coin packs are there if you like. Gerald says: the game stays complete for free, and looks can be earned with coins too") }
  ]
};
const nwV224Due = () => SHOP_LIVE && jstISO() >= NEWS_V224.date;
const NEWS_V2241 = { // v2.24.1 "Delivered!" (V224.md): the delivery card, Gerald's letter and My purchases
  id: '2.24.1', date: '2026-11-10', c: '#E3F1DC', d: 'heart', pic: 'dog',
  title: () => tt('ks.got_h', 'Delivered!'),
  items: [
    { ic: () => nwSafe(() => ICON('heart')), tx: () => tt('nw.v2241.card', 'After a Kind shop purchase, a Delivered! card and a letter from Gerald show what arrived and where to find it') },
    { ic: () => nwSafe(() => ICON('star')), tx: () => tt('nw.v2241.mine', 'My purchases in the Kind shop lists everything you have bought, with an email for help') }
  ]
};
const nwV2241Due = () => SHOP_LIVE && jstISO() >= NEWS_V2241.date;
const NEWS_V225 = { // v2.25 "Glad you're back" (V225.md): the While you were out page, days played forever, the welcome-back letter, the tomorrow line
  id: '2.25', date: '2026-11-12', c: '#FCE6C8', d: 'heart', pic: 'dog',
  title: () => tt('nw.v225.title', "Glad you're back!"),
  items: [
    { ic: () => nwSafe(() => ICON('sleep')), tx: () => tt('nw.v225.away', 'Back after a few hours? Your dog greets you with a diary page of what it got up to, and once a day a small gift') },
    { ic: () => fwCalIcon(), tx: () => tt('nw.v225.days', 'The calendar counts every day you play, forever. A missed day costs nothing, and Gerald has gifts at 7, 30, 100 and 365 days') },
    { ic: () => nwSafe(() => mailIcon()), tx: () => tt('nw.v225.letter', 'Away for a few days? Gerald keeps your spot warm and sends a letter with a treat bag and coins') },
    { ic: () => nwSafe(() => ICON('star')), tx: () => tt('nw.v225.tmrw', 'Finish the day\'s little jobs and you get a hint of what tomorrow brings') }
  ]
};
const nwV225Due = () => jstISO() >= NEWS_V225.date;
// v2.26-v2.29 (GM, 12 Nov 2026): each release goes live on its NEWS date (LAUNCH DATE: set from the owner's go-ahead); the feature's On() reads
// nwDue(NEWS_V22x) too, so all four can sit on main and open one by one. The GitHub Pages test copy opens all four early (window.__ddNextTest).
const nwNext = () => typeof window !== 'undefined' && !!window.__ddNextTest;
const nwDue = (e) => nwNext() || jstISO() >= e.date;
const NEWS_V226 = { // v2.26 "Yard visitors" (V226.md)
  id: '2.26', date: '2026-11-19', c: '#E2F0D9', d: 'paw', pic: { item: 'Tug Post' }, // LAUNCH DATE (owner, 12 Nov: all four together)
  title: () => tt('nw.v226.title', 'Visitors in the yard!'),
  items: [
    { ic: () => nwSafe(() => ICON('heart')), tx: () => tt('nw.v226.come', 'While you are away, neighbourhood dogs come round to play in your yard. The last one is still there when you come back') },
    { ic: () => nwItemArt('Puddle Pool'), tx: () => tt('nw.v226.toys', 'Four new yard toys, the Tug Post, Puddle Pool, Play Tunnel and Bubble Fountain, bring more visitors') },
    { ic: () => nwSafe(() => ICON('star')), tx: () => tt('nw.v226.book', 'Meet 20 visitors in the Visitors Book. Some only come on snowy days or in autumn, and every one comes back') },
    { ic: () => nwSafe(() => ICON('bond')), tx: () => tt('nw.v226.gift', 'Pet a visitor once a day, and some leave a little thank-you gift') }
  ]
};
const NEWS_V227 = { // v2.27 "Town projects" (V227.md)
  id: '2.27', date: '2026-11-19', c: '#D3E4F4', d: 'star', pic: 'dog', // LAUNCH DATE (owner, 12 Nov: all four together)
  title: () => tt('nw.v227.title', 'Town projects'),
  items: [
    { ic: () => nwSafe(() => ICON('star')), tx: () => tt('nw.v227.board', 'A project board in the Town Square: put in coins whenever you like to build something new for the whole town') },
    { ic: () => nwSafe(() => ICON('heart')), tx: () => tt('nw.v227.four', 'Four builds, one after another: a dog fountain, a bandstand, Sakura Avenue and a lighthouse') },
    { ic: () => nwSafe(() => mailIcon()), tx: () => tt('nw.v227.ribbon', 'Each build takes two days, then Gerald cuts the ribbon and sends you a letter') },
    { ic: () => nwSafe(() => ICON('walk')), tx: () => tt('nw.v227.fun', 'Every build has something to do: a drink, a tune, blossom in spring and a light at night') }
  ]
};
const NEWS_V228 = { // v2.28 "Stories and stars" (V228.md)
  id: '2.28', date: '2026-11-19', c: '#FBE3D6', d: 'heart', pic: { item: 'Star Collar' }, // LAUNCH DATE (owner, 12 Nov: all four together)
  title: () => tt('nw.v228.title', 'Stories and stars'),
  items: [
    { ic: () => nwSafe(() => ICON('star')), tx: () => tt('nw.v228.stars', 'Past Bond 10 your dog keeps earning Bond stars, with a Framed Paw Print at 5 stars and a Star Collar at 10') },
    { ic: () => nwSafe(() => mailIcon()), tx: () => tt('nw.v228.stories', 'Four neighbours write to you with little stories: Plum, Rosa, the mail carrier and Pip') },
    { ic: () => nwSafe(() => ICON('heart')), tx: () => tt('nw.v228.help', 'Help each neighbour with small requests, and their story unfolds a letter at a time') },
    { ic: () => nwSafe(() => ICON('bond')), tx: () => tt('nw.v228.card', 'Make a postcard of your dog to keep or share') }
  ]
};
const NEWS_V229 = { // v2.29 "Story mode" (V229.md)
  id: '2.29', date: '2026-11-19', c: '#FCE6C8', d: 'star', pic: 'dog', // LAUNCH DATE (owner, 12 Nov: all four together)
  title: () => tt('nw.v229.title', 'Story mode'),
  items: [
    { ic: () => nwSafe(() => ICON('star')), tx: () => tt('nw.v229.book', 'Gerald has written a story for you and your dog: 8 chapters to play at your own pace, next to everything else') },
    { ic: () => nwSafe(() => ICON('walk')), tx: () => tt('nw.v229.tasks', 'Each chapter has small tasks that give coins, Bond and level points') },
    { ic: () => nwSafe(() => ICON('heart')), tx: () => tt('nw.v229.scenes', 'Finish a chapter and watch a little crayon scene. Rewatch them all in Memories') },
    { ic: () => nwSafe(() => ICON('bond')), tx: () => tt('nw.v229.open', 'Open the story from the book button, or Story in the phone menu') }
  ]
};
const NEWS_V2291 = { // v2.29.1 "Balance follow-ups" (V2291.md); the date is a placeholder, the Game Manager sets the real one
  id: '2.29.1', date: '2026-11-20', c: '#E2F0D9', d: 'paw', pic: 'dog',
  title: () => tt('nw.v2291.title', 'Little town tweaks'),
  items: [
    { ic: () => nwSafe(() => ICON('star')), tx: () => tt('nw.v2291.swap', 'The free mission swap now picks missions you can do at home or on a walk') },
    { ic: () => nwSafe(() => ICON('coin')), tx: () => tt('nw.v2291.goals', 'Gerald points out the Town projects board, and the Bow-Wow Boutique shows the Kind shop looks') },
    { ic: () => nwSafe(() => ICON('heart')), tx: () => tt('nw.v2291.tmrw', 'The evening line tells you how the town project is coming along') }
  ]
};
// Daily rhythm: NEWS is read newest first by date (a later version first on the same date), so an entry put in front at load time (50_friends.js unshifts NEWS_V219 when FR_LIVE is on) still lands in its place
const nwVer = (a, b) => { const x = String(a).split('.').map(Number), y = String(b).split('.').map(Number); for (let i = 0; i < Math.max(x.length, y.length); i++) { const d = (x[i] || 0) - (y[i] || 0); if (d) return d; } return 0; };
function nwSort() { if (nwV220Due() && !NEWS.includes(NEWS_V220)) NEWS.unshift(NEWS_V220); if (nwV221Due() && !NEWS.includes(NEWS_V221)) NEWS.unshift(NEWS_V221); if (nwV222Due() && !NEWS.includes(NEWS_V222)) NEWS.unshift(NEWS_V222); if (nwV223Due() && !NEWS.includes(NEWS_V223)) NEWS.unshift(NEWS_V223); if (nwV2232Due() && !NEWS.includes(NEWS_V2232)) NEWS.unshift(NEWS_V2232); if (nwV224Due() && !NEWS.includes(NEWS_V224)) NEWS.unshift(NEWS_V224); if (nwV2241Due() && !NEWS.includes(NEWS_V2241)) NEWS.unshift(NEWS_V2241); if (nwV225Due() && !NEWS.includes(NEWS_V225)) NEWS.unshift(NEWS_V225); [NEWS_V226, NEWS_V227, NEWS_V228, NEWS_V229, NEWS_V2291].forEach((e) => { if (nwDue(e) && !NEWS.includes(e)) NEWS.unshift(e); }); NEWS.sort((a, b) => (a.date === b.date ? nwVer(b.id, a.id) : a.date < b.date ? 1 : -1)); return NEWS; }
const nwLatest = () => nwSort()[0].id;
const nwSafe = (f) => { try { return f(); } catch (e) { return ''; } };
function v2182Fields(s) { if (s && typeof s.newsSeen !== 'string') s.newsSeen = ''; return s; } // additive: '' = an old save, it sees the newest entry once
function nwPic(e) {
  if (!e.pic) return '';
  const svg = nwSafe(() => (e.pic === 'dog' ? headSVG(D()) : e.pic.item ? art('item', e.pic.item) : ''));
  return svg ? `<span class="nw-pic${e.pic === 'dog' ? ' dog' : ''}" aria-hidden="true">${svg}</span>` : '';
}
function nwEntryHTML(e, big) {
  const border = `<svg class="fw-border nw-border" viewBox="0 0 300 40" preserveAspectRatio="xMidYMid meet" aria-hidden="true">${[24, 84, 150, 216, 276].map((x, i) => fwDoodle(i === 2 ? 'paw' : e.d || 'paw', x, 20, i === 2 ? 0.8 : 1, i % 2 ? 12 : -10)).join('')}</svg>`;
  const li = e.items.map((x) => `<li><span class="nw-ic" aria-hidden="true">${nwSafe(x.ic)}</span><span class="nw-tx">${esc(x.tx())}</span></li>`).join('');
  return `<section class="fw-page nw-page${big ? ' big' : ''}" style="--fwc:${e.c || 'var(--paper)'}" aria-label="${esc(e.title())}">${big ? border : ''}<div class="nw-head">${big ? nwPic(e) : ''}<div><h3>${esc(e.title())}</h3><p class="small nw-ver">${esc(tt('nw.version', 'Version {v} · {date}', { v: e.id, date: nwDate(e.date) }))}</p></div></div><ul class="nw-list">${li}</ul></section>`;
}
// the sheet: the newest entry; "See all updates" swaps in every entry, newest first
function nwOpen(auto) {
  if (!S) return false;
  if (auto) { S.newsSeen = nwLatest(); markDirty(); try { saveNow(); } catch (e) { /* storage */ } }
  nwSort();
  const draw = (all) => {
    const body = all ? `<div class="nw-sheet nw-all">${NEWS.map((e) => nwEntryHTML(e, false)).join('')}</div>`
      : `<div class="nw-sheet">${nwEntryHTML(NEWS[0], true)}${NEWS.length ? `<button class="btn nw-more" type="button" id="nwAll">${esc(tt('nw.see_all', 'See all updates'))}</button>` : ''}</div>`;
    const p = openModal(esc(tt('nw.title', "What's new in town")), body, { cls: 'fw-calpop nw-pop', foot: `<button class="btn yes big nw-ok" id="nwOk">${esc(tt('nw.ok', 'OK!'))}</button>` });
    $('#nwOk', p).onclick = () => { SFX.click(); closeModal(); };
    const a = $('#nwAll', p); if (a) a.onclick = () => { SFX.click(); draw(true); };
  };
  draw(false); return true;
}
// the automatic open: once per news id, on a calm yard, never on top of the guide, the calendar's daily page, a level-up or the Bond 2 party
function nwCalmNow() {
  if (!S || cur.mode !== 'yard' || !modal.hidden || busy || levelQueue.length || !titleEl.hidden) return false;
  if (typeof scPlaying === 'function' && scPlaying()) return false; // v2.29: never under a story scene; it waits until the scene ends
  if (typeof popOpen === 'function' && popOpen()) return false;
  if (typeof gdLive === 'function' && gdLive() && gdAllowed()) return false;
  if (typeof phActive === 'function' && phActive()) return false; if (typeof blOn === 'function' && blOn()) return false;
  if ($('#gdLayer .gd-card:not([hidden])')) return false;
  if (S.fw && typeof fwOn === 'function' && fwOn()) { const f = S.fw; if (f.morning && f.shown !== f.morning) return false; if (Object.keys(f.b2pending || {}).length) return false; }
  return true;
}
function nwTry() {
  if (!S || !nwOn() || S.newsSeen === nwLatest()) { NW.calm = 0; return; }
  if (!nwCalmNow()) { NW.calm = 0; return; }
  if (!NW.calm) NW.calm = Date.now();
  if (Date.now() - NW.calm < 3000) return; // three calm seconds: the calendar or a party that is about to open goes first
  NW.calm = 0; nwOpen(true);
}
function nwMenuBtn() { return S ? `<button class="btn big" id="mmNews"><span class="ic">${nwSafe(() => fwCalIcon())}</span>${esc(tt('nw.menu', "What's new"))}</button>` : ''; }
function nwExpose() {
  if (!window.__paw || window.__paw.nw) return;
  window.__paw.nw = { due: (v) => nwDue({ '2.26': NEWS_V226, '2.27': NEWS_V227, '2.28': NEWS_V228, '2.29': NEWS_V229, '2.29.1': NEWS_V2291 }[v]), dates: () => [NEWS_V226, NEWS_V227, NEWS_V228, NEWS_V229, NEWS_V2291].map((e) => e.date), on: () => nwOn(), test: (v) => { prefs.nwTest = !!v; }, latest: () => nwLatest(), lines: () => nwSort()[0].items.length, list: () => nwSort().map((e) => e.id), seen: () => S && S.newsSeen, open: () => nwOpen(false), calm: () => nwCalmNow(), migrate: (s) => v2182Fields(s),
    add: (e) => { NEWS.unshift(Object.assign({ date: '2026-12-01', c: '#D3E4F4', title: () => 'Test news', items: [{ ic: () => '', tx: () => 'A test line' }, { ic: () => '', tx: () => 'Another line' }, { ic: () => '', tx: () => 'A third line' }] }, e)); return NEWS[0].id; },
    v219: () => { if (!NEWS.includes(NEWS_V219)) NEWS.unshift(NEWS_V219); return nwSort().map((e) => e.id); }, // what 50_friends.js does with FR_LIVE on (test hook)
    v220: () => { if (!NEWS.includes(NEWS_V220)) NEWS.unshift(NEWS_V220); return nwSort().map((e) => e.id); }, v220Due: () => nwV220Due(), // Missions v2 before its date (test hook)
    drop: () => { nwSort(); if (NEWS.length > 1) NEWS.shift(); return NEWS[0].id; } };
}
setInterval(() => { try { nwExpose(); nwTry(); } catch (e) { console.warn('nw tick', e); } }, 500);
on('game:ready', () => { NW.calm = 0; nwExpose(); });
