/* ======================= v2.7 SHELTER lane (tag sr): the Shelter Playroom. See V27.md sections 1 and 7 =======================
   The SHELTER lane owns this file (and css/33_shelter.css). This is the coordinator's stub: the room layout, the board slots, the resident names and
   traits and the roster are final here, so the art lane, the SHELTER lane and the tests agree on them. The playroom itself is the SHELTER lane's. */

// the playroom scene (PawArt.scene('playroom'), 1000 x 600, world_c). Boxes are [x, y, w, h] in world units, points are [x, y].
const SR_ROOM = {
  sign: [370, 10, 260, 64], // painted "Paw Haven Shelter" sign (art)
  board: [350, 84, 300, 220], // plain wall: the game draws PawArt.prop('adoptboard') here (viewBox 300 x 220, 1:1)
  window: [70, 90, 230, 180], // the window with the real sky (art)
  shelf: [716, 96, 236, 264], // the toy shelf against the right wall (art)
  toys: [800, 360, 140, 84], // the toy basket on the floor by the shelf, <g data-hot="toys"> in the art: tap it to toss a toy
  tables: [[214, 392, 120, 48], [610, 392, 120, 48]], // low café tables against the back wall (art), bottom edges at y <= 440, one with a water bowl
  cushions: [[170, 560], [500, 576], [850, 562]], // floor cushion centres (art draws them flat): the nap spots
  floor: [40, 450, 960, 596] // where room dogs stand: feet x in [40, 960], feet y in [450, 596]. Nothing upright stands in this band.
};
// the board's poster slots, in the board's own viewBox (300 x 220): portrait box [x, y, w, h] for slot i (0..7, 2 rows of 4). PawArt.ADOPT_SLOTS wins if the art publishes it.
const SR_SLOTS = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [20 + (i % 4) * 70, 58 + Math.floor(i / 4) * 80, 54, 50]);
const SR_NAMES = ['Clementine', 'Rusty', 'Mabel', 'Pudding', 'Ziggy', 'Hazel', 'Otis', 'Peanut', 'Juniper', 'Bramble', 'Toffee', 'Winnie', 'Buster', 'Maple', 'Scout', 'Pickle Jr.'];
const SR_TRAITS = ['Loves belly rubs more than dinner.', 'Shy for five minutes, then your shadow.', 'Snores like a tiny tractor.', 'Brings you a toy and keeps it.',
  'Sits very nicely for a biscuit.', 'Thinks every visitor came to see them.', 'Likes long naps in a sunny spot.', 'Leans on your legs to say hello.',
  'Chases bubbles and never catches one.', 'Gentle with puppies and very old cats.', 'Waits by the door in case of walks.', 'Talks back in small grumbles.'];

// Monday of the week of an ISO date (residents stay a week)
function srWeekKey(dk) { const d = new Date(dk + 'T12:00:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return localISO(d); }
// a dog's trait line, seeded by its id
function srTrait(id) { return SR_TRAITS[hashId('trait|' + id) % SR_TRAITS.length]; }
// The playroom roster for a date: today's 2 rescues (rescuesToday, unchanged, kind 'rescue') then 4 residents of the week (kind 'resident'):
// a puppy (3 to 5 months), a senior (96 to 150 months) and two adults (12 to 60 months), any of the 14 breeds, coats from PawGenes.
// Seeded, never saved. Dogs already home (dogById) or adopted from here before (S.shelter.adopted) are left out.
function srRoster(dk) {
  dk = dk || localISO(); const wk = srWeekKey(dk), r = seeded(hashId('resident|' + wk)), G = PGN(), taken = new Set();
  const ages = [[3, 5], [96, 150], [12, 60], [12, 60]];
  const res = ages.map(([a, b], i) => {
    const key = BREED_KEYS[Math.floor(r() * BREED_KEYS.length)], sex = r() < 0.5 ? 'female' : 'male', months = a + Math.floor(r() * (b - a + 1));
    let ni = Math.floor(r() * SR_NAMES.length); while (taken.has(ni)) ni = (ni + 1) % SR_NAMES.length; taken.add(ni);
    let genes = null; if (G && typeof G.randomGenotype === 'function') { try { genes = G.randomGenotype(key, r); } catch (e) { genes = null; } }
    if (!genes) { const g = STARTER_GENES[key] || STARTER_GENES.mutt; genes = { B: g.B.slice(), D: g.D.slice(), E: g.E.slice(), S: g.S.slice(), M: g.M.slice(), Bl: g.Bl.slice() }; }
    return { id: 'sr_' + wk + '_' + i, key, sex, months, name: SR_NAMES[ni], genes, rescue: { date: dk }, kind: 'resident' };
  });
  const all = rescuesToday(dk).map((x) => Object.assign({ kind: 'rescue' }, x)).concat(res);
  const gone = (S && S.shelter && Array.isArray(S.shelter.adopted)) ? S.shelter.adopted : [];
  return all.filter((x) => !(S && Array.isArray(S.dogs) && dogById(x.id)) && !gone.includes(x.id)).map((x) => Object.assign(x, { trait: srTrait(x.id) }));
}

function srExpose() {
  if (!window.__paw) return;
  // list(): the full "Looking for a home" sheet (the stub: the v2.6 shelter list), roster(): today's roster
  window.__paw.sr = { list: () => openShelterList(), roster: (dk) => srRoster(dk).map((x) => ({ id: x.id, key: x.key, sex: x.sex, months: x.months, name: x.name, kind: x.kind, trait: x.trait })), room: SR_ROOM, slots: SR_SLOTS };
}
on('game:ready', () => setTimeout(srExpose, 0));
setTimeout(srExpose, 0);
