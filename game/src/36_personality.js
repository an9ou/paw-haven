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
   ask: what it says when it comes to ask for pets ({n} name, {he} {him} {his} {He} pronouns). Short, kind, no semicolons. */
const BREED_PERS = {
  shiba: { attention: 0.3, energy: 0.6, zoomies: 0.4, follows: 0.1, ball: 1.0, steal: 0.3, spots: ['edge', 'shade'], trait: 'aloof',
    ask: ['{n} wanders over. On {his} own terms.', '{n} has decided you may pet {him} now.'] },
  corgi: { attention: 0.6, energy: 0.7, zoomies: 0.5, follows: 0.3, ball: 0.9, steal: 0.15, spots: ['bowl', 'open'], trait: 'beg',
    ask: ['{n} looks at you. Then the bowl. Then you.', '{n} sits very nicely. Very, very nicely.'] },
  golden: { attention: 0.6, energy: 0.8, zoomies: 0.3, follows: 0.4, ball: 1.15, steal: 0.05, spots: ['open', 'sun'], trait: 'ball',
    ask: ['{n} leans on your legs. All of {him}.', '{n} brought you a leaf. It is a gift.'] },
  dachs: { attention: 0.95, energy: 0.5, zoomies: 0.2, follows: 0.3, ball: 0.8, steal: 0.2, spots: ['dig', 'front'], trait: 'needy',
    ask: ['{n} stares at you. Pet me eyes, full power.', '{n} nudges your hand. Then nudges it again.', '{n} would like one pet. Or eleven.', '{n} has been unpetted for ages. Two minutes.'] },
  husky: { attention: 0.5, energy: 0.9, zoomies: 0.6, follows: 0.4, ball: 1.05, steal: 0.3, spots: ['open', 'shade'], trait: 'chatty',
    ask: ['{n} has a lot to tell you. A-woo-woo.', '{n} talks and talks. The topic is pets.'] },
  mutt: { attention: 0.7, energy: 0.6, zoomies: 0.3, follows: 0.5, ball: 1.0, steal: 0.1, spots: ['front', 'open'], trait: 'follow',
    ask: ['{n} sits by your feet and wags softly.', '{n} just wanted to be near you.'] },
  chihuahua: { attention: 0.6, energy: 0.7, zoomies: 0.4, follows: 0.1, ball: 0.85, steal: 0.3, spots: ['gate', 'edge'], trait: 'guard',
    ask: ['{n} reports for duty. Pets are the pay.', '{n} guarded everything. Now {he} wants a pet.'] },
  pug: { attention: 0.5, energy: 0.2, zoomies: 0.1, follows: 0.2, ball: 0.7, steal: 0.1, spots: ['bed', 'sun'], trait: 'lazy',
    ask: ['{n} snorts at you. It means pet me.', '{n} rolls over. The belly is open for business.'] },
  greyhound: { attention: 0.4, energy: 0.3, zoomies: 0.9, follows: 0.2, ball: 1.4, steal: 0.05, spots: ['bed', 'open'], trait: 'burst',
    ask: ['{n} rests {his} long nose on your knee.', '{n} leans in, very gently.'] },
  beagle: { attention: 0.5, energy: 0.7, zoomies: 0.3, follows: 0.3, ball: 0.95, steal: 0.25, spots: ['dig', 'edge'], trait: 'sniff',
    ask: ['{n} sniffed everything. Now {he} sniffs you.', '{n} bays a tiny hello. Pets, please.'] },
  poodle: { attention: 0.5, energy: 0.6, zoomies: 0.2, follows: 0.3, ball: 1.0, steal: 0.05, spots: ['front', 'sun'], trait: 'polite',
    ask: ['{n} sits politely and waits.', '{n} offers a paw, ever so politely.'] },
  collie: { attention: 0.5, energy: 0.9, zoomies: 0.4, follows: 0.6, ball: 1.2, steal: 0.1, spots: ['open', 'edge'], trait: 'herd',
    ask: ['{n} rounded everyone up. Job done. Pets now.', '{n} checks on you. You are part of the flock.'] },
  samoyed: { attention: 0.7, energy: 0.7, zoomies: 0.5, follows: 0.5, ball: 0.95, steal: 0.15, spots: ['shade', 'open'], trait: 'smile',
    ask: ['{n} smiles at you. It is hard to say no.', '{n} is fluffy and would like to be patted.'] },
  frenchie: { attention: 0.7, energy: 0.35, zoomies: 0.5, follows: 0.3, ball: 0.8, steal: 0.3, spots: ['bed', 'front'], trait: 'cheeky',
    ask: ['{n} snorts, then sits on your foot.', '{n} gives you the bat-ear look.'] },
};
const PERS_DEF = { attention: 0.5, energy: 0.6, zoomies: 0.3, follows: 0.3, ball: 1.0, steal: 0.1, spots: ['open'], trait: '', ask: ['{n} comes over for a pet.'] };
function persOf(d) { return Object.assign({}, PERS_DEF, (d && BREED_PERS[d.key]) || {}); }
function persLine(d, lines) { // fills {n} and the pronouns; lines defaults to the breed's ask lines
  const p = PRd(d), L = lines || persOf(d).ask;
  return PICK(L).replace(/\{(n|he|him|his|He|His)\}/g, (m, k) => (k === 'n' ? d.name : p[k]));
}
