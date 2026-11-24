// The eight test dogs for the print files (tests and tools/merch_render.js): different breeds, shapes, ages, coats and name lengths; the Akita sitting and the Dane in a tall hat reach past the 240 x 200 art box.
// sampleDogs(PawPrint) -> [{ id, r: recipe, pose, note }]
module.exports = function sampleDogs(P) {
  const B = (k) => P.BREEDS.indexOf(k), W = (n) => P.WEAR.findIndex((w) => w.n === n);
  return [
    { id: 'akita', r: { v: 1, b: B('akita'), g: '220200', e: 0, p: P.hashId('sample-akita'), a: 0, s: 'f', n: 'Mochi' }, pose: 'sit', note: 'red Akita, sitting (the curled tail)' },
    { id: 'dane', r: { v: 1, b: B('dane'), g: '222010', e: 2, p: P.hashId('sample-dane'), a: 0, s: 'm', o: [W('Witch Hat')], n: 'Duke' }, pose: 'stand', note: 'harlequin Great Dane in a Witch Hat' },
    { id: 'dachs', r: { v: 1, b: B('dachs'), g: '220200', e: 0, p: P.hashId('sample-dachs'), a: 1, s: 'f', n: 'Noodle' }, pose: 'stand', note: 'red Dachshund puppy (3 months)' },
    { id: 'golden', r: { v: 1, b: B('golden'), g: '220200', e: 0, p: P.hashId('sample-golden'), a: 0, s: 'f', sp: 1, o: [W('Flower Crown'), W('Red Bandana'), W('Superhero Cape'), W('Little Sneakers')], n: 'Sir Wigglesworth III' }, pose: 'stand', note: 'Golden, sparkle, 4 pieces' },
    { id: 'corgi', r: { v: 1, b: B('corgi'), g: '221100a2', e: 0, p: P.hashId('sample-corgi'), a: 0, s: 'm', n: "D'Artagnan" }, pose: 'happy', note: 'black-headed tricolour Corgi' },
    { id: 'newborn', r: { v: 1, b: B('beagle'), g: null, e: 0, p: P.hashId('sample-newborn'), a: 2, s: 'f', n: 'Bo' }, pose: 'sit', note: 'a newborn Beagle' },
    { id: 'black', r: { v: 1, b: B('lab'), g: '222200', e: 1, p: P.hashId('sample-black'), a: 0, s: 'm', n: 'Captain Fluffybottom' }, pose: 'happy', note: 'black Labrador' },
    { id: 'white', r: { v: 1, b: B('samoyed'), g: null, e: 0, p: P.hashId('sample-white'), a: 0, s: 'f', n: 'Zoë' }, pose: 'stand', note: 'white Samoyed' }
  ];
};
