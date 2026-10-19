/* ======================= v2.10 FREE TO ROAM: breed personality (V210.md section 5.1) =======================
   Shared by ROAM (37_roam.js: wandering, attention asks) and BALL (38_ball.js: the race for the ball). Owned by the Coordinator:
   a lane that wants a different number says so in its report instead of editing here.
   Every number is 0..1 except ball (a speed factor, 1 = an ordinary dog).
     attention  how often it comes to the player and asks for pets (the dachshund is the top)
     energy     walking versus napping
     zoomies    the chance of a sudden run when it picks its next move
     follows    likes to tag along with another dog (collie: herds them instead, see trait)
     ball       race speed factor (with its Energy, V210.md section 5.4)
     steal      the chance it steals the ball from the winner, or runs a keep-away lap with it
   spots: the spot kinds it likes (37_roam.js RM_ZONES tags them): open, shade, edge, gate, bowl, dig, bed, front, sun
   trait: one special habit the roam engine knows by name (section 5.1)
   ask: what it says when it comes to ask for pets. v2.14: messages ({name} is the dog's name, pronouns are {sex, select, female {..} other {..}}; the sex is the dog's own). Short, kind, no semicolons. */
const BREED_PERS = {
  shiba: { attention: 0.3, energy: 0.6, zoomies: 0.4, follows: 0.1, ball: 1.0, steal: 0.3, spots: ['edge', 'shade'], trait: 'aloof',
    ask: ['{name} wanders over. On {sex, select, female {her} other {his}} own terms.', '{name} has decided you may pet {sex, select, female {her} other {him}} now.'] },
  corgi: { attention: 0.6, energy: 0.7, zoomies: 0.5, follows: 0.3, ball: 0.9, steal: 0.15, spots: ['bowl', 'open'], trait: 'beg',
    ask: ['{name} looks at you. Then the bowl. Then you.', '{name} sits very nicely. Very, very nicely.'] },
  golden: { attention: 0.6, energy: 0.8, zoomies: 0.3, follows: 0.4, ball: 1.15, steal: 0.05, spots: ['open', 'sun'], trait: 'ball',
    ask: ['{name} leans on your legs. All of {sex, select, female {her} other {him}}.', '{name} brought you a leaf. It is a gift.'] },
  dachs: { attention: 0.95, energy: 0.5, zoomies: 0.2, follows: 0.3, ball: 0.8, steal: 0.2, spots: ['dig', 'front'], trait: 'needy',
    ask: ['{name} stares at you. Pet me eyes, full power.', '{name} nudges your hand. Then nudges it again.', '{name} would like one pet. Or eleven.', '{name} has been unpetted for ages. Two minutes.'] },
  husky: { attention: 0.5, energy: 0.9, zoomies: 0.6, follows: 0.4, ball: 1.05, steal: 0.3, spots: ['open', 'shade'], trait: 'chatty',
    ask: ['{name} has a lot to tell you. A-woo-woo.', '{name} talks and talks. The topic is pets.'] },
  mutt: { attention: 0.7, energy: 0.6, zoomies: 0.3, follows: 0.5, ball: 1.0, steal: 0.1, spots: ['front', 'open'], trait: 'follow',
    ask: ['{name} sits by your feet and wags softly.', '{name} just wanted to be near you.'] },
  chihuahua: { attention: 0.6, energy: 0.7, zoomies: 0.4, follows: 0.1, ball: 0.85, steal: 0.3, spots: ['gate', 'edge'], trait: 'guard',
    ask: ['{name} reports for duty. Pets are the pay.', '{name} guarded everything. Now {sex, select, female {she} other {he}} wants a pet.'] },
  pug: { attention: 0.5, energy: 0.2, zoomies: 0.1, follows: 0.2, ball: 0.7, steal: 0.1, spots: ['bed', 'sun'], trait: 'lazy',
    ask: ['{name} snorts at you. It means pet me.', '{name} rolls over. The belly is open for business.'] },
  greyhound: { attention: 0.4, energy: 0.3, zoomies: 0.9, follows: 0.2, ball: 1.4, steal: 0.05, spots: ['bed', 'open'], trait: 'burst',
    ask: ['{name} rests {sex, select, female {her} other {his}} long nose on your knee.', '{name} leans in, very gently.'] },
  beagle: { attention: 0.5, energy: 0.7, zoomies: 0.3, follows: 0.3, ball: 0.95, steal: 0.25, spots: ['dig', 'edge'], trait: 'sniff',
    ask: ['{name} sniffed everything. Now {sex, select, female {she} other {he}} sniffs you.', '{name} bays a tiny hello. Pets, please.'] },
  poodle: { attention: 0.5, energy: 0.6, zoomies: 0.2, follows: 0.3, ball: 1.0, steal: 0.05, spots: ['front', 'sun'], trait: 'polite',
    ask: ['{name} sits politely and waits.', '{name} offers a paw, ever so politely.'] },
  collie: { attention: 0.5, energy: 0.9, zoomies: 0.4, follows: 0.6, ball: 1.2, steal: 0.1, spots: ['open', 'edge'], trait: 'herd',
    ask: ['{name} rounded everyone up. Job done. Pets now.', '{name} checks on you. You are part of the flock.'] },
  samoyed: { attention: 0.7, energy: 0.7, zoomies: 0.5, follows: 0.5, ball: 0.95, steal: 0.15, spots: ['shade', 'open'], trait: 'smile',
    ask: ['{name} smiles at you. It is hard to say no.', '{name} is fluffy and would like to be patted.'] },
  frenchie: { attention: 0.7, energy: 0.35, zoomies: 0.5, follows: 0.3, ball: 0.8, steal: 0.3, spots: ['bed', 'front'], trait: 'cheeky',
    ask: ['{name} snorts, then sits on your foot.', '{name} gives you the bat-ear look.'] },
  // v2.11 Tokyo Trip (V211.md section 5.2): traits loyal / show / spin are handled in 37_roam.js rmPackAct
  akita: { attention: 0.4, energy: 0.5, zoomies: 0.15, follows: 0.2, ball: 1.0, steal: 0.05, spots: ['gate', 'shade'], trait: 'loyal',
    ask: ['{name} sits by you, calm and proud.', '{name} waited for you. {sex, select, female {She} other {He}} always does.', '{name} leans on you, just a little.'] },
  spitz: { attention: 0.6, energy: 0.75, zoomies: 0.5, follows: 0.4, ball: 1.05, steal: 0.15, spots: ['front', 'sun'], trait: 'show',
    ask: ['{name} fluffs up and poses. Admire {sex, select, female {her} other {him}}, please.', '{name} does a little twirl. Applause is pets.'] },
  pom: { attention: 0.7, energy: 0.8, zoomies: 0.6, follows: 0.3, ball: 0.85, steal: 0.3, spots: ['front', 'open'], trait: 'spin',
    ask: ['{name} spins in a circle. Pet {sex, select, female {her} other {him}} and {sex, select, female {she} other {he}} spins again.', '{name} yips a tiny hello. A loud tiny hello.'] },
  // v2.11 owner's addition (V211.md section 6): four more breeds, existing traits only
  afghan: { attention: 0.3, energy: 0.5, zoomies: 0.6, follows: 0.1, ball: 1.3, steal: 0.1, spots: ['open', 'sun'], trait: 'aloof',
    ask: ['{name} drifts over, hair flowing. A pet is allowed.', '{name} rests {sex, select, female {her} other {his}} long nose on your hand, very elegantly.'] },
  dane: { attention: 0.7, energy: 0.4, zoomies: 0.2, follows: 0.4, ball: 0.95, steal: 0.05, spots: ['bed', 'front'], trait: 'follow',
    ask: ['{name} leans on you. All of {sex, select, female {her} other {him}}. It is a lot of dog.', '{name} thinks {sex, select, female {she} other {he}} is a lap dog. {sex, select, female {She} other {He}} is not.'] },
  mastiff: { attention: 0.5, energy: 0.15, zoomies: 0.05, follows: 0.2, ball: 0.6, steal: 0.05, spots: ['bed', 'shade'], trait: 'lazy',
    ask: ['{name} sighs a big happy sigh by your feet.', '{name} puts {sex, select, female {her} other {his}} huge head on your knee. Slightly drooly.'] },
  gsd: { attention: 0.6, energy: 0.85, zoomies: 0.3, follows: 0.4, ball: 1.15, steal: 0.05, spots: ['gate', 'open'], trait: 'herd',
    ask: ['{name} checks in. Everyone is where they should be.', '{name} sits, ears up, waiting for the next job. Pets will do.'] },
  // v2.12 Fourteen New Friends (V212.md section 2): existing traits only
  dobie: { attention: 0.75, energy: 0.8, zoomies: 0.5, follows: 0.4, ball: 1.25, steal: 0.05, spots: ['gate', 'front'], trait: 'guard',
    ask: ['{name} finished the patrol. Cuddle time.', '{name} leans {sex, select, female {her} other {his}} sleek head on your knee.'] },
  corso: { attention: 0.5, energy: 0.5, zoomies: 0.2, follows: 0.3, ball: 0.95, steal: 0.05, spots: ['gate', 'shade'], trait: 'loyal',
    ask: ['{name} sits beside you, calm and steady.', '{name} rests {sex, select, female {her} other {his}} big head on your hand. Gently.'] },
  pitbull: { attention: 0.85, energy: 0.8, zoomies: 0.6, follows: 0.4, ball: 1.1, steal: 0.2, spots: ['sun', 'front'], trait: 'needy',
    ask: ['{name} wiggles over. The whole back half wags.', '{name} gives you a big happy grin. Pets, please.', '{name} leans in for a hug. A long one.'] },
  minpin: { attention: 0.6, energy: 0.9, zoomies: 0.7, follows: 0.2, ball: 1.05, steal: 0.35, spots: ['front', 'gate'], trait: 'burst',
    ask: ['{name} prances over, very important.', '{name} stops mid-zoom for one quick pet.'] },
  lab: { attention: 0.7, energy: 0.85, zoomies: 0.4, follows: 0.4, ball: 1.2, steal: 0.2, spots: ['bowl', 'open'], trait: 'beg',
    ask: ['{name} sits and wags the whole floor clean.', '{name} checks your pockets for snacks. Then asks for pets.'] },
  malamute: { attention: 0.5, energy: 0.8, zoomies: 0.4, follows: 0.3, ball: 1.0, steal: 0.25, spots: ['shade', 'dig'], trait: 'chatty',
    ask: ['{name} woo-woos at you. That is a request.', '{name} flops at your feet, big and fluffy. Pets now.'] },
  chow: { attention: 0.25, energy: 0.3, zoomies: 0.1, follows: 0.1, ball: 0.8, steal: 0.05, spots: ['shade', 'edge'], trait: 'aloof',
    ask: ['{name} allows you one pet. Maybe two.', '{name} sits near you. Not on you. Near you.'] },
  stdpoodle: { attention: 0.5, energy: 0.75, zoomies: 0.4, follows: 0.3, ball: 1.2, steal: 0.05, spots: ['open', 'front'], trait: 'polite',
    ask: ['{name} bows politely. A pet would be lovely.', '{name} offers a long curly paw.'] },
  schnauzer: { attention: 0.6, energy: 0.7, zoomies: 0.3, follows: 0.3, ball: 0.9, steal: 0.2, spots: ['gate', 'edge'], trait: 'guard',
    ask: ['{name} reports all clear. Beard scratches, please.', '{name} wiggles {sex, select, female {her} other {his}} eyebrows at you.'] },
  westie: { attention: 0.6, energy: 0.75, zoomies: 0.4, follows: 0.2, ball: 0.9, steal: 0.25, spots: ['dig', 'edge'], trait: 'sniff',
    ask: ['{name} trots over with a muddy nose.', '{name} wags {sex, select, female {her} other {his}} carrot tail at you.'] },
  yorkie: { attention: 0.7, energy: 0.75, zoomies: 0.5, follows: 0.2, ball: 0.85, steal: 0.35, spots: ['front', 'gate'], trait: 'cheeky',
    ask: ['{name} demands a pet. A tiny, loud demand.', '{name} sits on your foot like a little queen.'] },
  bichon: { attention: 0.8, energy: 0.7, zoomies: 0.7, follows: 0.5, ball: 0.9, steal: 0.15, spots: ['front', 'sun'], trait: 'spin',
    ask: ['{name} bounces over like a cotton ball.', '{name} spins, then waits for applause. Pets count.'] },
  maltese: { attention: 0.8, energy: 0.5, zoomies: 0.3, follows: 0.5, ball: 0.8, steal: 0.1, spots: ['bed', 'front'], trait: 'follow',
    ask: ['{name} floats over and sits by you.', '{name} looks up through {sex, select, female {her} other {his}} long white fringe.'] },
  shihtzu: { attention: 0.7, energy: 0.3, zoomies: 0.15, follows: 0.3, ball: 0.75, steal: 0.1, spots: ['bed', 'sun'], trait: 'lazy',
    ask: ['{name} rolls over. The top-knot stays perfect.', '{name} would like a lap. Yours will do.'] },
};
const PERS_DEF = { attention: 0.5, energy: 0.6, zoomies: 0.3, follows: 0.3, ball: 1.0, steal: 0.1, spots: ['open'], trait: '', ask: ['{name} comes over for a pet.'] };
function persOf(d) { return Object.assign({}, PERS_DEF, (d && BREED_PERS[d.key]) || {}); }
function persLine(d) { // one of the breed's ask lines, with the dog's name and sex filled in (v2.14: the line is looked up by breed and index so it can be translated)
  const has = !!(d && BREED_PERS[d.key] && BREED_PERS[d.key].ask), L = persOf(d).ask, en = PICK(L), i = L.indexOf(en);
  return tdata((has ? 'breed_pers.' + d.key + '.ask.' : 'pers_def.ask.') + i, en, { name: d.name, sex: d.sex === 'female' ? 'female' : 'male' });
}

/* ======================= v2.11.1 SIZES: dogs shown at three sizes by real size (V2111.md section 2) =======================
   Reverses the v2.10 "every dog the same size" rule. A scene factor only: the dog art never changes (the scenes scale the drawing round its feet).
   Owner, 17 Oct 2026: every dog first grows SIZE_GROW (1.25) from the v2.10 size, then the class applies (so the small dogs are not too small on a
   phone): big 1.25 x the v2.10 size, medium 1.075 x, small 0.9 x. Sizes fitted to a prop (the nap door, a bed, the Mt. Fuji bench, a sofa) take the
   class only, not the growth (37_roam.js rmPropK). Unknown keys (an old save, a mod) are medium. Puppies keep their age scaling on top: the art
   draws them small inside the same box (pupScale), and this factor multiplies it. Owned by the SIZE lane in v2.11.1. */
const BREED_SIZE = {
  chihuahua: 'small', pom: 'small', pug: 'small', frenchie: 'small', dachs: 'small', corgi: 'small',
  shiba: 'medium', spitz: 'medium', beagle: 'medium', mutt: 'medium', poodle: 'medium', collie: 'medium', husky: 'medium',
  golden: 'big', greyhound: 'big', samoyed: 'big', akita: 'big', afghan: 'big', dane: 'big', mastiff: 'big', gsd: 'big',
  // v2.12 (V212.md section 2)
  minpin: 'small', schnauzer: 'small', westie: 'small', bichon: 'small', maltese: 'small', shihtzu: 'small', yorkie: 'small',
  pitbull: 'medium', chow: 'medium',
  dobie: 'big', corso: 'big', lab: 'big', malamute: 'big', stdpoodle: 'big',
};
const SIZE_K = { small: 0.72, medium: 0.86, big: 1 }; // the classes, relative to a big dog
const SIZE_GROW = 1.25; // every dog, on top of the v2.10 size
function sizeOf(d) { const k = typeof d === 'string' ? d : d && d.key; return (k && BREED_SIZE[k]) || 'medium'; } // a dog (or a breed key) -> 'small' | 'medium' | 'big'
function sizeClassK(d) { return SIZE_K[sizeOf(d)] || 1; } // the class alone (big 1)
function sizeK(d) { return SIZE_GROW * sizeClassK(d); } // the scene factor for that dog: the growth times its class
