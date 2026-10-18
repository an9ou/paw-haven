// v2 GENES lane test (plain node). Run: node game/test_v2_genes_node.js   (exits 1 on any failure)
'use strict';
const path = require('path');
const G = require(path.join(__dirname, '..', 'mods', 'genes.js'));
const S = G.STARTER_GENES;

let pass = 0, fail = 0;
function ok(c, msg) { if (c) pass++; else { fail++; console.log('FAIL:', msg); } }
function near(x, want, tol, msg) { ok(Math.abs(x - want) <= tol, `${msg}: got ${x}, want ${want} ±${tol}`); }
function seeded(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const NAMED = G.BREEDS.filter((k) => k !== 'mutt');
const BANNED = /nintendo|nintendogs|pok[eé]mon|animal crossing/i;

/* 1. MIXES: all 595 pairs resolve (45 up to v2.4, 46 more with the v2.5 breeds, 45 with the first three v2.11 breeds, 74 with the owner's four more, 385 with the v2.12 fourteen) */
ok(G.BREEDS.length === 35, '35 breeds');
ok(Object.keys(G.MIXES).length === 595, `595 MIXES entries (got ${Object.keys(G.MIXES).length})`);
const names = new Set();
let pairs = 0;
for (let i = 0; i < G.BREEDS.length; i++) for (let j = i + 1; j < G.BREEDS.length; j++) {
  const a = G.BREEDS[i], b = G.BREEDS[j], m = G.MIXES[G.mixKey(a, b)];
  pairs++;
  ok(m && typeof m.name === 'string' && m.name.length > 1, `mix ${a}x${b} has a name`);
  if (!m) continue;
  ok(G.mixKey(a, b) === G.mixKey(b, a), `mixKey symmetric ${a}/${b}`);
  ok(m.head === a || m.head === b, `mix ${a}x${b} head ${m.head} is a parent`);
  ok(!BANNED.test(m.name), `mix name ${m.name} clean`);
  if (a !== 'mutt' && b !== 'mutt') { ok(!names.has(m.name), `unique mix name ${m.name}`); names.add(m.name); }
  else ok(m.name === 'Mutt mix', `${a}x${b} is Mutt mix`);
  for (const [dam, sire] of [[a, b], [b, a]]) {
    for (let s = 0; s < 40; s++) {
      const r = G.mixOf(dam, sire, seeded(s * 7 + i * 100 + j));
      ok(r && r.a === dam && r.b === sire && r.name === m.name, `mixOf ${dam}x${sire} shape`);
      if (!r) break;
      if (dam === 'mutt' || sire === 'mutt') {
        ok(r.body === 'mutt', `mutt mix body mutt (${dam}x${sire})`);
        ok(r.head === 'mutt' || r.head === (dam === 'mutt' ? sire : dam), `mutt mix head (${dam}x${sire})`);
      } else {
        ok(r.body === dam || r.body === sire, `mixOf body is a parent ${dam}x${sire}`);
        ok((r.head === dam || r.head === sire) && r.head !== r.body, `mixOf head is the other parent when needed ${dam}x${sire} body ${r.body} head ${r.head}`);
        ok(r.head === m.head || r.body === m.head, `mixOf uses the table head ${dam}x${sire}`);
      }
    }
  }
}
ok(pairs === 595, '595 pairs walked');
ok(names.size === 561, `561 unique named mixes (got ${names.size})`);
// examples from the brief
const want = { 'beagle|pug': 'Puggle', 'chihuahua|dachs': 'Chiweenie', 'golden|husky': 'Goberian', 'corgi|husky': 'Horgi', 'chihuahua|pug': 'Chug', 'corgi|dachs': 'Dorgi', 'shiba|corgi': 'Shorgi', 'golden|beagle': 'Beago', 'greyhound|beagle': 'Greagle' };
for (const k of Object.keys(want)) { const [a, b] = k.split('|'); ok(G.MIXES[G.mixKey(a, b)].name === want[k], `${k} = ${want[k]} (got ${G.MIXES[G.mixKey(a, b)].name})`); }
ok(G.MIXES[G.mixKey('corgi', 'husky')].head === 'husky', 'Horgi: husky head');
// v2.5: the 42 new names (V25.md 6b), each on its pair
const want25 = {
  'shiba|poodle': 'Shiba-poo', 'corgi|poodle': 'Corgipoo', 'golden|poodle': 'Goldendoodle', 'dachs|poodle': 'Doxiepoo', 'husky|poodle': 'Huskypoo',
  'chihuahua|poodle': 'Chipoo', 'pug|poodle': 'Pugapoo', 'greyhound|poodle': 'Greydoodle', 'beagle|poodle': 'Poogle',
  'corgi|collie': 'Borgi', 'shiba|collie': 'Border Shiba', 'golden|collie': 'Golden Collie', 'dachs|collie': 'Border Doxie', 'husky|collie': 'Border Husky',
  'chihuahua|collie': 'Border Chi', 'pug|collie': 'Border Pug', 'greyhound|collie': 'Border Grey', 'beagle|collie': 'Border Beagle', 'poodle|collie': 'Bordoodle',
  'husky|samoyed': 'Samusky', 'poodle|samoyed': 'Samoodle', 'shiba|samoyed': 'Sammy Shiba', 'corgi|samoyed': 'Sammy Corgi', 'golden|samoyed': 'Golden Sammy',
  'dachs|samoyed': 'Sammy Doxie', 'chihuahua|samoyed': 'Sammy Chi', 'pug|samoyed': 'Sammy Pug', 'greyhound|samoyed': 'Sammy Grey', 'beagle|samoyed': 'Sammy Beagle',
  'collie|samoyed': 'Border Sammy',
  'pug|frenchie': 'Frug', 'poodle|frenchie': 'Froodle', 'shiba|frenchie': 'French Shiba', 'corgi|frenchie': 'French Corgi', 'golden|frenchie': 'French Golden',
  'dachs|frenchie': 'French Doxie', 'husky|frenchie': 'French Husky', 'chihuahua|frenchie': 'French Chi', 'greyhound|frenchie': 'French Grey',
  'beagle|frenchie': 'French Beagle', 'collie|frenchie': 'French Collie', 'samoyed|frenchie': 'French Sammy'
};
ok(Object.keys(want25).length === 42 && new Set(Object.values(want25)).size === 42, '42 new mix names listed');
for (const k of Object.keys(want25)) { const [a, b] = k.split('|'); ok(G.MIXES[G.mixKey(a, b)].name === want25[k], `${k} = ${want25[k]} (got ${G.MIXES[G.mixKey(a, b)].name})`); }
['poodle', 'collie', 'samoyed', 'frenchie'].forEach((k) => ok(G.MIXES[G.mixKey('mutt', k)].name === 'Mutt mix', `mutt x ${k} is Mutt mix`));
// v2.11: the 42 new names (V211.md 5.2), each on its pair
const want211 = {
  'shiba|akita': 'Shibakita', 'corgi|akita': 'Corgikita', 'golden|akita': 'Goldkita', 'dachs|akita': 'Doxkita', 'husky|akita': 'Huskita',
  'chihuahua|akita': 'Chikita', 'pug|akita': 'Pugkita', 'greyhound|akita': 'Greykita', 'beagle|akita': 'Beakita', 'poodle|akita': 'Akipoo',
  'collie|akita': 'Border Akita', 'samoyed|akita': 'Sammy Kita', 'frenchie|akita': 'French Akita',
  'shiba|spitz': 'Spitziba', 'corgi|spitz': 'Spitzgi', 'golden|spitz': 'Goldspitz', 'dachs|spitz': 'Spitzdox', 'husky|spitz': 'Spitzky',
  'chihuahua|spitz': 'Chispitz', 'pug|spitz': 'Pugspitz', 'greyhound|spitz': 'Greyspitz', 'beagle|spitz': 'Spitzle', 'poodle|spitz': 'Spitzpoo',
  'collie|spitz': 'Border Spitz', 'samoyed|spitz': 'Sammy Spitz', 'frenchie|spitz': 'French Spitz',
  'shiba|pom': 'Pomiba', 'corgi|pom': 'Pomgi', 'golden|pom': 'Golden Pom', 'dachs|pom': 'Pomdox', 'husky|pom': 'Pomsky',
  'chihuahua|pom': 'Pomchi', 'pug|pom': 'Pugeranian', 'greyhound|pom': 'Pomhound', 'beagle|pom': 'Pomagle', 'poodle|pom': 'Pomapoo',
  'collie|pom': 'Border Pom', 'samoyed|pom': 'Sammy Pom', 'frenchie|pom': 'French Pom',
  'akita|spitz': 'Spitzkita', 'akita|pom': 'Pomkita', 'spitz|pom': 'Pomspitz'
};
ok(Object.keys(want211).length === 42 && new Set(Object.values(want211)).size === 42, '42 new v2.11 mix names listed');
for (const k of Object.keys(want211)) { const [a, b] = k.split('|'); ok(G.MIXES[G.mixKey(a, b)].name === want211[k], `${k} = ${want211[k]} (got ${G.MIXES[G.mixKey(a, b)].name})`); }
['akita', 'spitz', 'pom'].forEach((k) => ok(G.MIXES[G.mixKey('mutt', k)].name === 'Mutt mix', `mutt x ${k} is Mutt mix`));
// v2.11 (the owner's four more): the 70 new names, each on its pair (the big breeds with the 16 older non-mutt breeds, then among themselves)
const want211b = {
  'shiba|afghan': 'Afghan Shiba', 'corgi|afghan': 'Afghan Corgi', 'golden|afghan': 'Golden Afghan', 'dachs|afghan': 'Afghan Doxie',
  'husky|afghan': 'Afghusky', 'chihuahua|afghan': 'Afghan Chi', 'pug|afghan': 'Afghan Pug', 'greyhound|afghan': 'Afghan Grey',
  'beagle|afghan': 'Afghan Beagle', 'poodle|afghan': 'Afghandoodle', 'collie|afghan': 'Afghan Collie', 'samoyed|afghan': 'Afghan Sammy',
  'frenchie|afghan': 'French Afghan', 'akita|afghan': 'Afghan Akita', 'spitz|afghan': 'Afghan Spitz', 'pom|afghan': 'Afghan Pom',
  'afghan|dane': 'Afghan Dane', 'afghan|mastiff': 'Afghan Mastiff', 'afghan|gsd': 'Afghan Shepherd', 'shiba|dane': 'Dane Shiba',
  'corgi|dane': 'Dane Corgi', 'golden|dane': 'Golden Dane', 'dachs|dane': 'Dane Doxie', 'husky|dane': 'Dane Husky',
  'chihuahua|dane': 'Dane Chi', 'pug|dane': 'Dane Pug', 'greyhound|dane': 'Dane Grey', 'beagle|dane': 'Dane Beagle',
  'poodle|dane': 'Daneoodle', 'collie|dane': 'Border Dane', 'samoyed|dane': 'Sammy Dane', 'frenchie|dane': 'French Dane',
  'akita|dane': 'Akita Dane', 'spitz|dane': 'Spitz Dane', 'pom|dane': 'Pom Dane', 'dane|mastiff': 'Daniff',
  'dane|gsd': 'Shepdane', 'shiba|mastiff': 'Mastiba', 'corgi|mastiff': 'Mastigi', 'golden|mastiff': 'Golden Mastiff',
  'dachs|mastiff': 'Mastidox', 'husky|mastiff': 'Mastusky', 'chihuahua|mastiff': 'Mastichi', 'pug|mastiff': 'Mastipug',
  'greyhound|mastiff': 'Greymastiff', 'beagle|mastiff': 'Mastigle', 'poodle|mastiff': 'Mastipoo', 'collie|mastiff': 'Border Mastiff',
  'samoyed|mastiff': 'Sammy Mastiff', 'frenchie|mastiff': 'Frenchiff', 'akita|mastiff': 'Akita Mastiff', 'spitz|mastiff': 'Spitz Mastiff',
  'pom|mastiff': 'Pom Mastiff', 'mastiff|gsd': 'Mastishep', 'shiba|gsd': 'Shepiba', 'corgi|gsd': 'Shepgi',
  'golden|gsd': 'Golden Shepherd', 'dachs|gsd': 'Shepdox', 'husky|gsd': 'Shepsky', 'chihuahua|gsd': 'Shepchi',
  'pug|gsd': 'Pugshep', 'greyhound|gsd': 'Greyshep', 'beagle|gsd': 'Sheagle', 'poodle|gsd': 'Shepadoodle',
  'collie|gsd': 'Border Shepherd', 'samoyed|gsd': 'Sammy Shepherd', 'frenchie|gsd': 'French Shepherd', 'akita|gsd': 'Akita Shepherd',
  'spitz|gsd': 'Spitz Shepherd', 'pom|gsd': 'Pom Shepherd'
};
ok(Object.keys(want211b).length === 70 && new Set(Object.values(want211b)).size === 70, '70 new big-breed mix names listed');
for (const k of Object.keys(want211b)) { const [a, b] = k.split('|'); ok(G.MIXES[G.mixKey(a, b)].name === want211b[k], `${k} = ${want211b[k]} (got ${G.MIXES[G.mixKey(a, b)].name})`); }
['afghan', 'dane', 'mastiff', 'gsd'].forEach((k) => ok(G.MIXES[G.mixKey('mutt', k)].name === 'Mutt mix', `mutt x ${k} is Mutt mix`));
// v2.12: the 371 new names (V212.md 3), each on its pair: the fourteen with the 20 older non-mutt breeds, then among themselves
const want212 = {
  'shiba|dobie': 'Dobie Shiba', 'corgi|dobie': 'Dobie Corgi', 'golden|dobie': 'Golden Dobie', 'dachs|dobie': 'Dobie Doxie',
  'husky|dobie': 'Dobsky', 'chihuahua|dobie': 'Dobie Chi', 'pug|dobie': 'Dobie Pug', 'greyhound|dobie': 'Greyberman',
  'beagle|dobie': 'Dobie Beagle', 'poodle|dobie': 'Dobiepoo', 'collie|dobie': 'Border Dobie', 'samoyed|dobie': 'Sammy Dobie',
  'frenchie|dobie': 'French Dobie', 'akita|dobie': 'Dobie Akita', 'spitz|dobie': 'Dobie Spitz', 'pom|dobie': 'Dobie Pom',
  'afghan|dobie': 'Dobie Afghan', 'dane|dobie': 'Dobie Dane', 'mastiff|dobie': 'Dobie Mastiff', 'gsd|dobie': 'Doberman Shepherd',
  'shiba|corso': 'Corso Shiba', 'corgi|corso': 'Corso Corgi', 'golden|corso': 'Golden Corso', 'dachs|corso': 'Corso Doxie',
  'husky|corso': 'Corsky', 'chihuahua|corso': 'Corso Chi', 'pug|corso': 'Corso Pug', 'greyhound|corso': 'Corso Grey',
  'beagle|corso': 'Corso Beagle', 'poodle|corso': 'Corsopoo', 'collie|corso': 'Border Corso', 'samoyed|corso': 'Sammy Corso',
  'frenchie|corso': 'French Corso', 'akita|corso': 'Corso Akita', 'spitz|corso': 'Corso Spitz', 'pom|corso': 'Corso Pom',
  'afghan|corso': 'Corso Afghan', 'dane|corso': 'Great Corso', 'mastiff|corso': 'Corso Mastiff', 'gsd|corso': 'Shepherd Corso',
  'shiba|pitbull': 'Shiba Pittie', 'corgi|pitbull': 'Pitgi', 'golden|pitbull': 'Golden Pittie', 'dachs|pitbull': 'Doxie Pit',
  'husky|pitbull': 'Pitsky', 'chihuahua|pitbull': 'Chipit', 'pug|pitbull': 'Pugbull', 'greyhound|pitbull': 'Pittie Grey',
  'beagle|pitbull': 'Pitbeagle', 'poodle|pitbull': 'Pitpoo', 'collie|pitbull': 'Border Pittie', 'samoyed|pitbull': 'Sammy Pittie',
  'frenchie|pitbull': 'French Pittie', 'akita|pitbull': 'Pitkita', 'spitz|pitbull': 'Pittie Spitz', 'pom|pitbull': 'Pittie Pom',
  'afghan|pitbull': 'Pittie Afghan', 'dane|pitbull': 'Great Danebull', 'mastiff|pitbull': 'Mastibull', 'gsd|pitbull': 'Shepherd Pittie',
  'shiba|minpin': 'Shiba Pin', 'corgi|minpin': 'Corgi Pin', 'golden|minpin': 'Golden Pinny', 'dachs|minpin': 'Doxie Pin',
  'husky|minpin': 'Pinsky', 'chihuahua|minpin': 'Chipin', 'pug|minpin': 'Mugin', 'greyhound|minpin': 'Grey Pin',
  'beagle|minpin': 'Meagle', 'poodle|minpin': 'Pinny-poo', 'collie|minpin': 'Border Pinny', 'samoyed|minpin': 'Sammy Pinny',
  'frenchie|minpin': 'French Pinscher', 'akita|minpin': 'Pinny Akita', 'spitz|minpin': 'Pinny Spitz', 'pom|minpin': 'Pom-a-Pin',
  'afghan|minpin': 'Pinny Afghan', 'dane|minpin': 'Pinny Dane', 'mastiff|minpin': 'Pinny Mastiff', 'gsd|minpin': 'Pinny Shepherd',
  'shiba|lab': 'Shibador', 'corgi|lab': 'Corgidor', 'golden|lab': 'Goldador', 'dachs|lab': 'Dachsador',
  'husky|lab': 'Labsky', 'chihuahua|lab': 'Labrahuahua', 'pug|lab': 'Pugador', 'greyhound|lab': 'Greyador',
  'beagle|lab': 'Labbe', 'poodle|lab': 'Mini Labradoodle', 'collie|lab': 'Borador', 'samoyed|lab': 'Samoyador',
  'frenchie|lab': 'French Lab', 'akita|lab': 'Labrakita', 'spitz|lab': 'Spitzador', 'pom|lab': 'Pomador',
  'afghan|lab': 'Afghan Lab', 'dane|lab': 'Labradane', 'mastiff|lab': 'Mastador', 'gsd|lab': 'Shepador',
  'shiba|malamute': 'Shibamute', 'corgi|malamute': 'Corgimute', 'golden|malamute': 'Golden Malamute', 'dachs|malamute': 'Doximute',
  'husky|malamute': 'Alusky', 'chihuahua|malamute': 'Chimute', 'pug|malamute': 'Pugamute', 'greyhound|malamute': 'Greymute',
  'beagle|malamute': 'Beaglemute', 'poodle|malamute': 'Malapoo', 'collie|malamute': 'Border Malamute', 'samoyed|malamute': 'Samamute',
  'frenchie|malamute': 'French Malamute', 'akita|malamute': 'Alaskan Akita', 'spitz|malamute': 'Spitzamute', 'pom|malamute': 'Pomamute',
  'afghan|malamute': 'Afghan Malamute', 'dane|malamute': 'Great Malamute', 'mastiff|malamute': 'Mastimute', 'gsd|malamute': 'Alaskan Shepherd',
  'shiba|chow': 'Shiba Chow', 'corgi|chow': 'Chorgi', 'golden|chow': 'Golden Chow', 'dachs|chow': 'Chow Doxie',
  'husky|chow': 'Chowsky', 'chihuahua|chow': 'Chi Chow', 'pug|chow': 'Pug Chow', 'greyhound|chow': 'Grey Chow',
  'beagle|chow': 'Chabeagle', 'poodle|chow': 'Chow-poo', 'collie|chow': 'Border Chow', 'samoyed|chow': 'Sammy Chow',
  'frenchie|chow': 'French Chow', 'akita|chow': 'Chakita', 'spitz|chow': 'Spitz Chow', 'pom|chow': 'Pomchow',
  'afghan|chow': 'Afghan Chow', 'dane|chow': 'Dane Chow', 'mastiff|chow': 'Mastichow', 'gsd|chow': 'Chow Shepherd',
  'shiba|stdpoodle': 'Shiba Doodle', 'corgi|stdpoodle': 'Corgidoodle', 'golden|stdpoodle': 'Big Goldendoodle', 'dachs|stdpoodle': 'Doxiedoodle',
  'husky|stdpoodle': 'Huskydoodle', 'chihuahua|stdpoodle': 'Chidoodle', 'pug|stdpoodle': 'Pugadoodle', 'greyhound|stdpoodle': 'Big Greydoodle',
  'beagle|stdpoodle': 'Beadoodle', 'poodle|stdpoodle': 'Medium Poodle', 'collie|stdpoodle': 'Big Bordoodle', 'samoyed|stdpoodle': 'Sammydoodle',
  'frenchie|stdpoodle': 'Frenchdoodle', 'akita|stdpoodle': 'Akidoodle', 'spitz|stdpoodle': 'Spitzdoodle', 'pom|stdpoodle': 'Pomadoodle',
  'afghan|stdpoodle': 'Big Afghandoodle', 'dane|stdpoodle': 'Great Danoodle', 'mastiff|stdpoodle': 'Mastidoodle', 'gsd|stdpoodle': 'Big Shepadoodle',
  'shiba|schnauzer': 'Schnauzer Shiba', 'corgi|schnauzer': 'Schnorgi', 'golden|schnauzer': 'Golden Schnauzer', 'dachs|schnauzer': 'Schnauzer Doxie',
  'husky|schnauzer': 'Schnusky', 'chihuahua|schnauzer': 'Chizer', 'pug|schnauzer': 'Schnug', 'greyhound|schnauzer': 'Schnauzer Grey',
  'beagle|schnauzer': 'Schneagle', 'poodle|schnauzer': 'Schnoodle', 'collie|schnauzer': 'Border Schnauzer', 'samoyed|schnauzer': 'Sammy Schnauzer',
  'frenchie|schnauzer': 'French Schnauzer', 'akita|schnauzer': 'Schnauzer Akita', 'spitz|schnauzer': 'Schnauzer Spitz', 'pom|schnauzer': 'Pom Schnauzer',
  'afghan|schnauzer': 'Schnauzer Afghan', 'dane|schnauzer': 'Schnauzer Dane', 'mastiff|schnauzer': 'Schnauzer Mastiff', 'gsd|schnauzer': 'Schnauzer Shepherd',
  'shiba|westie': 'Westie Shiba', 'corgi|westie': 'Corgi Westie', 'golden|westie': 'Golden Westie', 'dachs|westie': 'Westie Doxie',
  'husky|westie': 'Westsky', 'chihuahua|westie': 'Chi Westie', 'pug|westie': 'Wug', 'greyhound|westie': 'Westie Grey',
  'beagle|westie': 'Westeagle', 'poodle|westie': 'Westiepoo', 'collie|westie': 'Border Westie', 'samoyed|westie': 'Sammy Westie',
  'frenchie|westie': 'French Westie', 'akita|westie': 'Westie Akita', 'spitz|westie': 'Westie Spitz', 'pom|westie': 'Westie Pom',
  'afghan|westie': 'Westie Afghan', 'dane|westie': 'Westie Dane', 'mastiff|westie': 'Westie Mastiff', 'gsd|westie': 'Westie Shepherd',
  'shiba|yorkie': 'Shiba Yorkie', 'corgi|yorkie': 'Corkie', 'golden|yorkie': 'Golden Yorkie', 'dachs|yorkie': 'Doxie Yorkie',
  'husky|yorkie': 'Yorksky', 'chihuahua|yorkie': 'Chorkie', 'pug|yorkie': 'Pugshire', 'greyhound|yorkie': 'Yorkie Grey',
  'beagle|yorkie': 'Borkie', 'poodle|yorkie': 'Yorkipoo', 'collie|yorkie': 'Border Yorkie', 'samoyed|yorkie': 'Sammy Yorkie',
  'frenchie|yorkie': 'Frenchie Yorkie', 'akita|yorkie': 'Yorkie Akita', 'spitz|yorkie': 'Yorkie Spitz', 'pom|yorkie': 'Yoranian',
  'afghan|yorkie': 'Yorkie Afghan', 'dane|yorkie': 'Yorkie Dane', 'mastiff|yorkie': 'Yorkie Mastiff', 'gsd|yorkie': 'Yorkie Shepherd',
  'shiba|bichon': 'Bichon Shiba', 'corgi|bichon': 'Corgi-chon', 'golden|bichon': 'Golden Bichon', 'dachs|bichon': 'Doxie-chon',
  'husky|bichon': 'Bichsky', 'chihuahua|bichon': 'Chi-chon', 'pug|bichon': 'Pug-a-chon', 'greyhound|bichon': 'Bichon Grey',
  'beagle|bichon': 'Beachon', 'poodle|bichon': 'Poochon', 'collie|bichon': 'Border Bichon', 'samoyed|bichon': 'Sammy Bichon',
  'frenchie|bichon': 'French Bichon', 'akita|bichon': 'Bichon Akita', 'spitz|bichon': 'Spitz-chon', 'pom|bichon': 'Bichonaranian',
  'afghan|bichon': 'Bichon Afghan', 'dane|bichon': 'Bichon Dane', 'mastiff|bichon': 'Bichon Mastiff', 'gsd|bichon': 'Bichon Shepherd',
  'shiba|maltese': 'Malti Shiba', 'corgi|maltese': 'Corgi Malti', 'golden|maltese': 'Golden Malti', 'dachs|maltese': 'Mauxie',
  'husky|maltese': 'Maltsky', 'chihuahua|maltese': 'Malchi', 'pug|maltese': 'Malti Pug', 'greyhound|maltese': 'Malti Grey',
  'beagle|maltese': 'Malteagle', 'poodle|maltese': 'Maltipoo', 'collie|maltese': 'Border Malti', 'samoyed|maltese': 'Sammy Malti',
  'frenchie|maltese': 'Frenchie Malti', 'akita|maltese': 'Malti Akita', 'spitz|maltese': 'Malti Spitz', 'pom|maltese': 'Maltipom',
  'afghan|maltese': 'Malti Afghan', 'dane|maltese': 'Malti Dane', 'mastiff|maltese': 'Malti Mastiff', 'gsd|maltese': 'Malti Shepherd',
  'shiba|shihtzu': 'Shiba Tzu', 'corgi|shihtzu': 'Corgi Tzu', 'golden|shihtzu': 'Golden Tzu', 'dachs|shihtzu': 'Schweenie',
  'husky|shihtzu': 'Shihsky', 'chihuahua|shihtzu': 'Shichi', 'pug|shihtzu': 'Pugzu', 'greyhound|shihtzu': 'Grey Tzu',
  'beagle|shihtzu': 'Beagle Tzu', 'poodle|shihtzu': 'Shih-poo', 'collie|shihtzu': 'Border Tzu', 'samoyed|shihtzu': 'Sammy Tzu',
  'frenchie|shihtzu': 'French Tzu', 'akita|shihtzu': 'Akita Tzu', 'spitz|shihtzu': 'Spitz Tzu', 'pom|shihtzu': 'Shiranian',
  'afghan|shihtzu': 'Afghan Tzu', 'dane|shihtzu': 'Dane Tzu', 'mastiff|shihtzu': 'Mastiff Tzu', 'gsd|shihtzu': 'Shepherd Tzu',
  'dobie|corso': 'Corsoberman', 'dobie|pitbull': 'Doberbull', 'dobie|minpin': 'Little Dobie', 'dobie|lab': 'Doberdor',
  'dobie|malamute': 'Dobermute', 'dobie|chow': 'Dobie Chow', 'dobie|stdpoodle': 'Doberdoodle', 'dobie|schnauzer': 'Dobie Schnauzer',
  'dobie|westie': 'Dobie Westie', 'dobie|yorkie': 'Dobie Yorkie', 'dobie|bichon': 'Dobie-chon', 'dobie|maltese': 'Dobie Malti',
  'dobie|shihtzu': 'Dobie Tzu', 'corso|pitbull': 'Bully Corso', 'corso|minpin': 'Pin Corso', 'corso|lab': 'Corsador',
  'corso|malamute': 'Corsomute', 'corso|chow': 'Corso Chow', 'corso|stdpoodle': 'Corsodoodle', 'corso|schnauzer': 'Corso Schnauzer',
  'corso|westie': 'Corso Westie', 'corso|yorkie': 'Corso Yorkie', 'corso|bichon': 'Corso-chon', 'corso|maltese': 'Corso Malti',
  'corso|shihtzu': 'Corso Tzu', 'pitbull|minpin': 'Pinny Pittie', 'pitbull|lab': 'Labrabull', 'pitbull|malamute': 'Pitamute',
  'pitbull|chow': 'Chow Pittie', 'pitbull|stdpoodle': 'Pitdoodle', 'pitbull|schnauzer': 'Schnau-bull', 'pitbull|westie': 'Westie Pittie',
  'pitbull|yorkie': 'Yorkie Pittie', 'pitbull|bichon': 'Bichon Pittie', 'pitbull|maltese': 'Malti Pittie', 'pitbull|shihtzu': 'Pit Tzu',
  'minpin|lab': 'Labrapin', 'minpin|malamute': 'Pinnymute', 'minpin|chow': 'Chow Pin', 'minpin|stdpoodle': 'Pinny-doodle',
  'minpin|schnauzer': 'Schnau-pin', 'minpin|westie': 'Westie Pin', 'minpin|yorkie': 'Yorkie Pin', 'minpin|bichon': 'Pin-chon',
  'minpin|maltese': 'Malti-pin', 'minpin|shihtzu': 'Pin Tzu', 'lab|malamute': 'Labmute', 'lab|chow': 'Chabrador',
  'lab|stdpoodle': 'Labradoodle', 'lab|schnauzer': 'Schnauzador', 'lab|westie': 'Westador', 'lab|yorkie': 'Yorkador',
  'lab|bichon': 'Labrachon', 'lab|maltese': 'Maltador', 'lab|shihtzu': 'Labratzu', 'malamute|chow': 'Chowmute',
  'malamute|stdpoodle': 'Maladoodle', 'malamute|schnauzer': 'Schnaumute', 'malamute|westie': 'Westiemute', 'malamute|yorkie': 'Yorkiemute',
  'malamute|bichon': 'Bichomute', 'malamute|maltese': 'Maltimute', 'malamute|shihtzu': 'Mally Tzu', 'chow|stdpoodle': 'Chowdoodle',
  'chow|schnauzer': 'Schnau-chow', 'chow|westie': 'Westie Chow', 'chow|yorkie': 'Yorkie Chow', 'chow|bichon': 'Chow-chon',
  'chow|maltese': 'Malti Chow', 'chow|shihtzu': 'Chow Tzu', 'stdpoodle|schnauzer': 'Big Schnoodle', 'stdpoodle|westie': 'Westiedoodle',
  'stdpoodle|yorkie': 'Yorkiedoodle', 'stdpoodle|bichon': 'Big Poochon', 'stdpoodle|maltese': 'Maltidoodle', 'stdpoodle|shihtzu': 'Shih-doodle',
  'schnauzer|westie': 'Wauzer', 'schnauzer|yorkie': 'Snorkie', 'schnauzer|bichon': 'Schnau-chon', 'schnauzer|maltese': 'Mauzer',
  'schnauzer|shihtzu': 'Schnau-Tzu', 'westie|yorkie': 'Wee-Yorkie', 'westie|bichon': 'Wee-chon', 'westie|maltese': 'Highland Malti',
  'westie|shihtzu': 'Wee-Tzu', 'yorkie|bichon': 'Yo-chon', 'yorkie|maltese': 'Morkie', 'yorkie|shihtzu': 'Shorkie',
  'bichon|maltese': 'Maltichon', 'bichon|shihtzu': 'Shichon', 'maltese|shihtzu': 'Malshi'
};
ok(Object.keys(want212).length === 371 && new Set(Object.values(want212)).size === 371, '371 new v2.12 mix names listed');
for (const k of Object.keys(want212)) { const [a, b] = k.split('|'); ok(G.MIXES[G.mixKey(a, b)].name === want212[k], `${k} = ${want212[k]} (got ${G.MIXES[G.mixKey(a, b)].name})`); }
['dobie', 'corso', 'pitbull', 'minpin', 'lab', 'malamute', 'chow', 'stdpoodle', 'schnauzer', 'westie', 'yorkie', 'bichon', 'maltese', 'shihtzu'].forEach((k) => ok(G.MIXES[G.mixKey('mutt', k)].name === 'Mutt mix', `mutt x ${k} is Mutt mix`));
// the real names the spec asks for
{ const real = { 'lab|stdpoodle': 'Labradoodle', 'poodle|lab': 'Mini Labradoodle', 'golden|lab': 'Goldador', 'poodle|maltese': 'Maltipoo', 'poodle|shihtzu': 'Shih-poo', 'poodle|yorkie': 'Yorkipoo',
    'poodle|schnauzer': 'Schnoodle', 'yorkie|maltese': 'Morkie', 'maltese|shihtzu': 'Malshi', 'yorkie|shihtzu': 'Shorkie', 'chihuahua|yorkie': 'Chorkie', 'poodle|westie': 'Westiepoo',
    'poodle|bichon': 'Poochon', 'dobie|lab': 'Doberdor', 'husky|pitbull': 'Pitsky', 'husky|chow': 'Chowsky', 'husky|malamute': 'Alusky', 'chihuahua|minpin': 'Chipin', 'beagle|minpin': 'Meagle' };
  for (const k of Object.keys(real)) { const [a, b] = k.split('|'); ok(G.MIXES[G.mixKey(a, b)].name === real[k], `real name ${k} = ${real[k]}`); } }
// same breed -> null (purebred); unknown key counts as mutt
G.BREEDS.forEach((k) => ok(G.mixOf(k, k, seeded(1)) === null, `same breed ${k} -> null`));
ok(G.mixOf('wolfy', 'corgi', seeded(2)).body === 'mutt', 'unknown key -> mutt');
// 50/50 splits and determinism
{
  let bodyDam = 0, muttHead = 0; const N = 4000, R = seeded(99);
  for (let i = 0; i < N; i++) { if (G.mixOf('corgi', 'pug', R).body === 'corgi') bodyDam++; if (G.mixOf('mutt', 'beagle', R).head === 'beagle') muttHead++; }
  near(bodyDam / N, 0.5, 0.03, 'body 50/50 by rng');
  near(muttHead / N, 0.5, 0.03, 'mutt head = other breed 50%');
  ok(JSON.stringify(G.mixOf('husky', 'shiba', seeded(5))) === JSON.stringify(G.mixOf('husky', 'shiba', seeded(5))), 'mixOf deterministic with injected rng');
}

/* 2. predict */
const sum = (rows) => rows.reduce((s, r) => s + r.pct, 0);
const pctWhere = (rows, f) => rows.filter(f).reduce((s, r) => s + r.pct, 0);
{
  const R = seeded(7);
  for (let i = 0; i < 420; i++) {
    const ka = G.BREEDS[i % G.BREEDS.length], kb = G.BREEDS[(i * 3 + 1) % G.BREEDS.length];
    const ga = G.randomGenotype(ka, R), gb = G.randomGenotype(kb, R);
    const rows = G.predict(ga, gb, ka, kb);
    near(sum(rows), 100, 1e-6, `predict sums to 100 (${ka}x${kb} #${i})`);
    ok(rows.every((r, j) => j === 0 || rows[j - 1].pct >= r.pct), 'predict sorted by pct');
    ok(rows.every((r) => ['brown', 'amber', 'blue', 'odd'].includes(r.eyes) && typeof r.odds === 'string'), 'predict row shape');
    near(sum(G.predict(ga, gb, ka, kb, { byCoat: true })), 100, 1e-6, 'byCoat sums to 100');
  }
}
// teaching examples (V2_GENES.md)
{
  const mp = G.predict(S.shiba, S.mutt, 'shiba', 'mutt');
  const lil = pctWhere(mp, (r) => /Lilac/.test(r.coat));
  near(lil, 100 / 32, 1e-9, 'Mochi x Pepper lilac = 1/32');
  console.log(`  Mochi x Pepper: lilac ${lil}% (${mp.find((r) => /Lilac/.test(r.coat)).odds}), rows ${mp.length}`);
  const mpShiba = G.predict(S.shiba, S.mutt, 'shiba', 'mutt', { body: 'shiba' });
  near(pctWhere(mpShiba, (r) => /^Lilac/.test(r.coat)), 100 / 32, 1e-9, 'Mochi x Pepper lilac 1/32 with a shiba body');
  const bf = G.predict(S.corgi, S.husky, 'corgi', 'husky');
  const pie = pctWhere(bf, (r) => /piebald/.test(r.coat));
  near(pie, 25, 1e-9, 'Biscuit x Frost piebald = 1/4');
  console.log(`  Biscuit x Frost: piebald ${pie}%, rows ${bf.length}`);
  // eye split: husky Bl/Bl x corgi bl/bl -> all Bl/bl -> 75% blue / 25% odd
  near(pctWhere(bf, (r) => r.eyes === 'odd'), 25, 1e-9, 'Biscuit x Frost odd eyes 1/4');
  // names match phenotype for the body breed
  const coats = new Set(bf.map((r) => r.coat));
  ok(coats.has('Red and white') && coats.has('Red & white piebald'), 'corgi-body names');
}
// double merle block: M/m x M/m -> M/M removed, rest renormalised
{
  const mer = { B: ['B', 'B'], D: ['D', 'D'], E: ['E', 'E'], S: ['S', 'S'], M: ['M', 'm'], Bl: ['bl', 'bl'] };
  const rows = G.predict(mer, mer, 'dachs', 'dachs');
  near(sum(rows), 100, 1e-9, 'merle x merle sums to 100');
  near(pctWhere(rows, (r) => /dapple/.test(r.coat)), 200 / 3, 1e-9, 'merle x merle: 2/3 dapple after removing M/M');
  ok(G.predict({ ...mer, M: ['M', 'M'] }, { ...mer, M: ['M', 'M'] }, 'dachs', 'dachs').length === 0, 'all-M/M -> []');
}
// predict agrees with inherit + phenotype (Monte Carlo, re-rolling M/M)
{
  const ga = { B: ['B', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['S', 'sp'], M: ['M', 'm'], Bl: ['Bl', 'bl'] };
  const gb = { B: ['b', 'b'], D: ['D', 'd'], E: ['E', 'e'], S: ['sp', 'sp'], M: ['M', 'm'], Bl: ['bl', 'bl'] };
  const rows = G.predict(ga, gb, 'chihuahua', 'beagle', { byCoat: true }), R = seeded(3), N = 60000, cnt = {};
  for (let i = 0; i < N; i++) { let g; do g = G.inherit(ga, gb, R); while (g.M[0] === 'M' && g.M[1] === 'M'); const n = G.phenotype(g, 'chihuahua').coatName; cnt[n] = (cnt[n] || 0) + 1; }
  let worst = 0;
  rows.forEach((r) => { worst = Math.max(worst, Math.abs((cnt[r.coat] || 0) / N * 100 - r.pct)); });
  ok(Object.keys(cnt).every((n) => rows.some((r) => r.coat === n)), 'every simulated coat is predicted');
  ok(worst < 0.8, `predict vs simulation max diff ${worst.toFixed(3)} pts`);
}
// body naming rule: mutt parent -> mutt body names
ok(G.predict(S.shiba, S.mutt, 'shiba', 'mutt').every((r) => !/urajiro/.test(r.coat)), 'mutt parent -> mutt body names');

/* 3. coatCatalog */
function independentNames(k) { // brute force every allele pair allowed by FREQ (written separately from the module)
  const f = G.FREQ[k], opts = (rec, dom, p) => (p <= 0 ? [[dom, dom]] : p >= 1 ? [[rec, rec]] : [[dom, dom], [dom, rec], [rec, rec]]);
  const L = [['B', opts('b', 'B', f.b)], ['D', opts('d', 'D', f.d)], ['E', opts('e', 'E', f.e)], ['S', opts('sp', 'S', f.sp)], ['M', f.M > 0 ? [['m', 'm'], ['M', 'm']] : [['m', 'm']]], ['Bl', opts('bl', 'Bl', 1 - f.Bl)]];
  const out = new Set();
  (function rec(i, g) { if (i === L.length) { out.add(G.phenotype(g, k).coatName); return; } for (const p of L[i][1]) { g[L[i][0]] = p; rec(i + 1, g); } })(0, {});
  return out;
}
let total = 0;
const sizes = [];
for (const k of G.BREEDS) {
  const cat = G.coatCatalog(k), set = new Set(cat.map((c) => c.coat));
  total += cat.length; sizes.push(`${k} ${cat.length}`);
  ok(set.size === cat.length, `${k} catalog has no duplicates`);
  ok(cat.every((c) => typeof c.how === 'string' && c.how.length > 5 && c.how.length < 200 && typeof c.rare === 'boolean'), `${k} catalog entry shape`);
  ok(cat.every((c) => !BANNED.test(c.how)), `${k} hints clean`);
  const starter = G.phenotype(S[k], k).coatName;
  ok(set.has(starter), `${k} starter coat ${starter} in catalog`);
  ok(!cat.find((c) => c.coat === starter).rare, `${k} starter coat not rare`);
  // every coat seen over 20k random genotypes is in the catalog
  const R = seeded(1000 + G.BREEDS.indexOf(k)), seen = new Set();
  for (let i = 0; i < 20000; i++) seen.add(G.phenotype(G.randomGenotype(k, R), k, 'pup' + i).coatName);
  const missing = [...seen].filter((n) => !set.has(n));
  ok(missing.length === 0, `${k} catalog covers all 20k random coats (missing: ${missing.join(', ')})`);
  // every catalog entry is reachable: equals the independent brute-force set of coats randomGenotype can produce
  const ind = independentNames(k);
  const extra = [...set].filter((n) => !ind.has(n)), lack = [...ind].filter((n) => !set.has(n));
  ok(extra.length === 0 && lack.length === 0, `${k} catalog = reachable set (extra: ${extra.join(', ')}; lacking: ${lack.join(', ')})`);
  console.log(`  ${k.padEnd(9)} catalog ${String(cat.length).padStart(2)} (rare ${cat.filter((c) => c.rare).length}), seen in 20k: ${seen.size}`);
}
ok(G.coatCatalog('pug').every((c) => !/merle|piebald/.test(c.coat)), 'pug: no merle or piebald');
ok(G.coatCatalog('golden').every((c) => /Golden|Cream/.test(c.coat)), 'golden: golden or cream only');
ok(G.coatCatalog('husky').every((c) => !/merle/.test(c.coat)), 'husky: no merle');
ok(G.coatCatalog('dachs').some((c) => /dapple/.test(c.coat)), 'dachs: dapples');
{ const c = G.coatCatalog('mutt'); c[0].coat = 'x'; ok(G.coatCatalog('mutt')[0].coat !== 'x', 'coatCatalog returns copies'); }
ok(G.coatCatalog('mutt').find((c) => c.coat === 'Lilac').rare, 'lilac is rare');
console.log(`  catalog total ${total}`);

/* 4. describe */
{
  const d = G.describe(S.shiba);
  ok(d.lines.length === 6 && d.lines[0] === 'B/b: black pigment (nose and eye rims), carries liver', 'Mochi B line');
  ok(JSON.stringify(d.carriers) === '["liver","dilute"]', `Mochi carriers ${d.carriers}`);
  ok(/chocolate or blue/.test(d.summary), 'Mochi summary');
  ok(G.describe(S.mutt).lines[0] === 'B/b: black coat, carries liver', 'Pepper B line (dark coat wording)');
  ok(JSON.stringify(G.describe(S.husky).carriers) === '["dilute","red","piebald"]', 'Frost carriers');
  ok(G.describe(S.dachs).carriers.length === 0, 'Noodle carries nothing');
  ok(G.describe({ B: ['b', 'B'], D: ['d', 'D'], E: ['e', 'E'], S: ['sp', 'S'], M: ['m', 'M'], Bl: ['bl', 'Bl'] }).lines.every((l) => /^(B\/b|D\/d|E\/e|S\/sp|M\/m|Bl\/bl):/.test(l)), 'describe puts the dominant allele first');
  ok(G.describe({ ...S.shiba, M: ['M', 'm'] }).carriers.includes('merle'), 'hidden merle on red is a carrier');
  ok(G.describe({ pup: 1, genes: S.corgi }).carriers[0] === 'piebald', 'describe accepts a dog object');
}

/* 5. old API unchanged for starters */
ok(G.phenotype(S.shiba, 'shiba').coatName === 'Red with cream urajiro', 'phenotype unchanged');

console.log(`\nCatalog sizes: ${sizes.join(', ')}`);
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
