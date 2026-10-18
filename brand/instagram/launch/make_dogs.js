// "Meet the dogs" introduction posts: one dog per post, the whole dog and a puppy, the name and its character.
// The game's own facts (breed, likes, joke) come from game/src/00_core.js; the traits below are the creative part.
const fs = require('fs'), path = require('path');
module.exports = async function ({ render, browser, helpers: h, only }) {
  const { f1, doodle, txt, lines, box, arrow, dog, paper, svgPage, frame, tape, swash, PA, inner, INK, PINK, MUTED, ORANGE } = h;
  const W = 1080, H = 1350;
  fs.mkdirSync(path.join(h.OUT, 'dogs'), { recursive: true });
  const item = (name, x, y, s) => { const sv = PA.item(name); return `<svg x="${x}" y="${y}" width="${s}" height="${s}" viewBox="0 0 64 64" overflow="visible">${inner(sv)}</svg>`; };
  const iconAt = (name, x, y, sz) => `<svg x="${x}" y="${y}" width="${sz}" height="${sz}" viewBox="0 0 64 64" overflow="visible">${inner(PA.icon(name))}</svg>`;
  const MODE = process.env.DOG_MODE || 'puppy';
  // a dirt mound with a bone poking out (for 'digging')
  const digIcon = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s / 64})"><ellipse cx="32" cy="54" rx="28" ry="6" fill="#5B3D32" opacity=".16"/><path d="M4 54Q8 24 32 22Q56 24 60 54Z" fill="#B98F68" stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"/><path d="M14 44l8 -2M34 36l8 3M26 48l8 0" stroke="#8A6A48" stroke-width="2.4" stroke-linecap="round"/><g transform="translate(34 16) rotate(-30) scale(.55)"><path d="M-14 -4 Q-20 -10 -14 -12 Q-11 -14 -10 -8 L10 -8 Q11 -14 14 -12 Q20 -10 14 -4 Q20 2 14 4 Q11 6 10 0 L-10 0 Q-11 6 -14 4 Q-20 2 -14 -4Z" fill="#FFF4DF" stroke="#5B3D32" stroke-width="3" stroke-linejoin="round"/></g></g>`;
  // a speech bubble with a tail pointing at (tx, ty)
  const bubble = (x, y, w, hh, tx, ty, ls, seed, fs = 52) => {
    const cx = x + w / 2, bx = Math.max(x + 60, Math.min(x + w - 60, tx));
    return `<g><path d="M${bx - 26} ${y + hh - 2}L${tx} ${ty}L${bx + 24} ${y + hh - 2}Z" fill="#FFFBF2"/>${box(x, y, w, hh, 30, seed, 2.4, 4.2)}<path d="M${bx - 26} ${y + hh}L${tx} ${ty}L${bx + 24} ${y + hh}" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="${bx - 22}" y="${y + hh - 6}" width="44" height="9" fill="#FFFBF2"/>${lines(ls, cx, y + 20 + fs, fs, fs + 4, { w: 600 })}</g>`;
  };
  // real outline of a dog in its 240x200 canvas (getBBox), so adults and puppies are sized by what is drawn
  const mp = await browser.newPage(); await mp.setContent('<body></body>');
  const bbox = async (svg) => mp.evaluate((sv) => { const w = document.createElement('div'); w.innerHTML = sv; document.body.appendChild(w); const e = w.querySelector('svg'); e.setAttribute('width', 240); e.setAttribute('height', 200); const b = e.getBBox(); return [b.x, b.y, b.width, b.height]; }, svg);
  // fit a dog into a box (maxW x maxH), centred on cx, standing on the line `bottom`
  const fit = async (key, o, cx, bottom, maxW, maxH, facingKey) => { const op = Object.assign({ anim: false }, o), sv = PA.dog(key, op), b = await bbox(sv), k = Math.min(maxW / b[2], maxH / b[3]), w = b[2] * k, hh = b[3] * k, x = cx - w / 2; return { x, y: bottom - hh, w, h: hh, svg: `<svg x="${f1(x)}" y="${f1(bottom - hh)}" width="${f1(w)}" height="${f1(hh)}" viewBox="${b.map(f1).join(' ')}" overflow="visible">${inner(sv)}</svg>` }; };
  const post = async (d) => {
    const A = await fit(d.key, { pose: d.pose || 'happy' }, 420, 800, 740, 430);
    const mode = d.mode || MODE, HC = [846, 930, 148]; // the close-up: centre x, centre y, radius
    const P = mode === 'puppy' ? await fit(d.key, { pose: d.puppyPose || d.pose || 'happy', age: 'puppy', facing: 'left' }, 810, 1036, 380, 230) : null;
    const nl = d.quote.length, bh = 40 + nl * 56, qs = nl > 2 ? 46 : 52;
    const nameSize = d.nameSize || Math.min(200, Math.floor(1150 / d.name.length));
    let g = paper(W, H) + frame(W, H, 40 + d.num)
      + txt('meet the dogs', 100, 92, 44, { fill: '#D8607E', anchor: 'start' })
      + txt(d.name, 70, 262, nameSize, { rot: -3, anchor: 'start' }) + txt(d.title, 84, 336, 60, { fill: MUTED, w: 600, anchor: 'start' })
      + bubble(590, 124, 430, bh, Math.min(Math.max(A.x + A.w * 0.8, 640), 940), Math.max(A.y + A.h * 0.1, 124 + bh + 60), d.quote, 9, qs)
      + swash(A.x + A.w / 2, 796, A.w * 0.9, 60, -2, PINK, 0.45)
      + A.svg;
    if (mode === 'puppy') g += swash(P.x + P.w / 2, 1032, P.w * 0.95, 44, 2, '#FFE3A1', 0.6) + P.svg + txt(`a ${d.name} puppy`, P.x + P.w / 2, 1076, 40, { w: 700, rot: 2 });
    else g += swash(HC[0] + 14, HC[1] + 22, HC[2] * 2.1, HC[2] * 1.9, -8, '#FFE3A1', 0.7)
      + `<g><circle cx="${HC[0]}" cy="${HC[1]}" r="${HC[2]}" fill="#FFFBF2"/>${box(HC[0] - HC[2], HC[1] - HC[2], HC[2] * 2, HC[2] * 2, HC[2], 91, 2.6, 5)}<svg x="${HC[0] - 100}" y="${HC[1] - 98}" width="204" height="204" viewBox="2 6 96 96" overflow="visible">${inner(PA.dogHead(d.key))}</svg>${tape(HC[0] - 60, HC[1] - HC[2] - 16, 120, 36, -4)}</g>`
      + txt('up close', HC[0] - HC[2] - 6, HC[1] - HC[2] + 40, 42, { w: 700, rot: -6, anchor: 'end' }) + arrow(HC[0] - HC[2] + 6, HC[1] - HC[2] + 58, HC[0] - HC[2] + 52, HC[1] - 40, [-20, 10], 3);
    g += txt('loves', 100, 892, 50, { fill: '#D8607E', anchor: 'start' })
      + d.loves.map(([name, label], i) => (name === 'dig' ? digIcon(80 + i * 170, 906, 110) : name.startsWith('icon:') ? iconAt(name.slice(5), 80 + i * 170, 906, 110) : item(name, 80 + i * 170, 906, 110)) + txt(label, 135 + i * 170, 1048, 32, { w: 600, fill: MUTED })).join('')
      + doodle('heart', 1012, 330, 1.1, 12) + doodle('spark', 560, 420, 0.9) + doodle('spark', 80, 470, 0.8);
    d.traits.forEach(([t, sub], i) => {
      const x = 60 + (i % 2) * 490, y = 1092 + Math.floor(i / 2) * 100;
      g += `<g transform="rotate(${i % 2 ? 0.8 : -0.8} ${x + 235} ${y + 45})">${box(x, y, 470, 90, 30, 70 + i, 2.2, 3.8)}<circle cx="${x + 36}" cy="${y + 47}" r="15" fill="${PINK}" fill-opacity=".7" stroke="${INK}" stroke-width="3"/>${txt(t, x + 66, y + 44, 44, { anchor: 'start', w: 700 })}${txt(sub, x + 66, y + 80, 31, { anchor: 'start', fill: MUTED, w: 600 })}</g>`;
    });
    g += txt('Doodle Doggo · play free on itch.io', 540, 1312, 36, { fill: MUTED, w: 600 });
    return svgPage(W, H, g);
  };
  // The game's own facts: breed, personality line, joke/quote (game/src/00_core.js FALLBACK_DOGS, JOKES, place lines) and favourite food, toy and activity (FAV).
  // The four traits are creative, written to match each dog's personality in the game.
  const DOGS = [
    { key: 'shiba', num: 1, name: 'Mochi', title: 'the Shiba Inu', pose: 'happy', quote: ['I could leave anytime.', 'I choose not to.'],
      loves: [['Salmon Pâté', 'salmon pâté'], ['Plush Bone', 'plush bone'], ['icon:star', 'tricks']],
      traits: [['proud', 'bows to nobody, eats first'], ['dramatic', 'gasps at a closed door'], ['independent', 'cuddles on their own schedule'], ['judgy', 'has opinions about your snacks']] },
    { key: 'corgi', num: 2, name: 'Biscuit', title: 'the Corgi', pose: 'happy', quote: ['Is that a snack?', 'Is everything a snack?'],
      loves: [['Pupcake', 'pupcake'], ['Puzzle Feeder', 'puzzle feeder'], ['icon:feed', 'feeding']],
      traits: [['cheerful', 'wiggles from the middle'], ['greedy', 'knows the fridge sound'], ['short legs, big plans', 'zoomies in tiny circles'], ['snack inspector', 'checks every bowl twice']] },
    { key: 'golden', num: 3, name: 'Sunny', title: 'the Golden Retriever', pose: 'happy', quote: ['I love you.', 'Who are you?'],
      loves: [['Basic Kibble', 'kibble'], ['Tennis Ball', 'tennis ball'], ['icon:play', 'fetch']],
      traits: [['friendly', 'best friends with everyone'], ['fetch fanatic', 'brings the ball, then a stick'], ['wiggly', 'tail is a helicopter'], ['a bit forgetful', 'forgot why, ran anyway']] },
    { key: 'dachs', num: 4, name: 'Noodle', title: 'the Dachshund', pose: 'happy', quote: ['The rest of me', 'is on its way.'],
      loves: [['Bone-shaped Biscuit', 'bone biscuit'], ['Squeaky Duck', 'squeaky duck'], ['dig', 'digging']],
      traits: [['lazy', 'naps like it is a job'], ['attention seeking', 'squeaks the duck till you look'], ['curious digger', 'something smells like treasure'], ['very, very long', 'the rest of him is on its way']] },
    { key: 'husky', num: 5, name: 'Frost', title: 'the Husky', pose: 'howl', quote: ['AWOOO.'],
      loves: [['Chicken & Rice Bowl', 'chicken & rice'], ['Rope Tug', 'rope tug'], ['icon:walk', 'walks']],
      traits: [['chatty', 'has notes on everything'], ['full of energy', 'naps 5 minutes, runs 5 hours'], ['dramatic singer', 'serenades the moon and the sofa'], ['snow lover', 'cold is a spa day']] },
    { key: 'mutt', num: 6, name: 'Pepper', title: 'the Shelter Mutt', pose: 'happy', quote: ['Hi. Can I come', 'home with you?'],
      loves: [['icon:pet', 'petting'], ['icon:home', 'a home'], ['icon:heart', 'you']],
      traits: [['loyal', 'follows you room to room'], ['gentle', 'asks with a tiny paw tap'], ['one of a kind', 'a little bit of everything'], ['hopeful', 'waits by the door, just in case']] },
    { key: 'chihuahua', num: 7, name: 'Peanut', title: 'the Chihuahua', pose: 'speak', quote: ['I am the', 'security system.'],
      loves: [['Salmon Pâté', 'salmon pâté'], ['Squeaky Duck', 'squeaky duck'], ['icon:pet', 'petting']],
      traits: [['fearless', 'barks at the vacuum, wins'], ['dramatic', 'trembles at an empty bowl'], ['tiny but loud', 'the whole street hears'], ['sunbather', 'finds the one warm spot']] },
    { key: 'pug', num: 8, name: 'Dumpling', title: 'the Pug', pose: 'sit', quote: ['snort.'],
      loves: [['Pupcake', 'pupcake'], ['Plush Bone', 'plush bone'], ['icon:feed', 'feeding']],
      traits: [['snorty', 'narrates every breath'], ['cuddly', 'sits on laps, on principle'], ['lazy', 'naps in between naps'], ['food-loving', 'hears the treat bag upstairs']] },
    { key: 'greyhound', num: 9, name: 'Rocket', title: 'the Greyhound', pose: 'happy', quote: ['45 mph.', 'Then a 20-hour nap.'],
      loves: [['Chicken & Rice Bowl', 'chicken & rice'], ['Frisbee', 'frisbee'], ['icon:play', 'fetch']],
      traits: [['speedy', 'zoom, then done'], ['couch potato', 'takes the whole sofa'], ['gentle', 'soft as a cloud'], ['elegant', 'poses like a statue, asleep']] },
    { key: 'beagle', num: 10, name: 'Bagel', title: 'the Beagle', pose: 'sniff', quote: ['Smelled that from', 'three streets away.'],
      loves: [['Basic Kibble', 'kibble'], ['Puzzle Feeder', 'puzzle feeder'], ['dig', 'digging']],
      traits: [['nose-led', 'follows a smell, forgets the rest'], ['food obsessed', 'official bowl inspector'], ['loud', 'bays at squirrels and at nothing'], ['treasure hunter', 'knows where it is buried']] },
    { key: 'poodle', num: 11, name: 'Pretzel', title: 'the Poodle', pose: 'bow', quote: ['Haircut optional.', 'Dignity not.'],
      loves: [['Salmon Pâté', 'salmon pâté'], ['Puzzle Feeder', 'puzzle feeder'], ['icon:star', 'tricks']],
      traits: [['clever', 'learns it before you finish teaching'], ['dignified', 'never runs through puddles'], ['fancy', 'fluff is a lifestyle'], ['show-off', 'bows after every trick']] },
    { key: 'collie', num: 12, name: 'Scout', title: 'the Border Collie', pose: 'happy', quote: ['Will herd the puppies,', 'the ducks and', 'the furniture.'],
      loves: [['Chicken & Rice Bowl', 'chicken & rice'], ['Frisbee', 'frisbee'], ['icon:play', 'fetch']],
      traits: [['clever', 'counts everything twice'], ['born herder', 'gathers the whole family'], ['intense', 'stares until the ball moves'], ['needs a job', 'any job. Tidy-up counts.']] },
    { key: 'samoyed', num: 13, name: 'Cloud', title: 'the Samoyed', pose: 'happy', quote: ['Sheds a second dog', 'every spring.'],
      loves: [['Chicken & Rice Bowl', 'chicken & rice'], ['Rope Tug', 'rope tug'], ['icon:walk', 'walks']],
      traits: [['smiley', 'cannot stop, will not stop'], ['fluffy', 'a walking cloud'], ['friendly', 'greets even the pigeon'], ['snow lover', 'cold water is the best water']] },
    { key: 'frenchie', num: 14, name: 'Brioche', title: 'the French Bulldog', pose: 'sit', quote: ['Sofa. Cushion.', 'Your foot.', 'All good seats.'],
      loves: [['Pupcake', 'pupcake'], ['Plush Bone', 'plush bone'], ['icon:pet', 'petting']],
      traits: [['snorer', 'a tiny engine at nap time'], ['foot sitter', 'your foot is now his seat'], ['shade seeker', 'sunny day? no thanks'], ['cuddly', 'bat ears, big heart']] },
    // v2.11 Tokyo Trip: the 7 new dog types (the line, loves and traits match tools/site_dogs.js, the doodledoggo.app profiles)
    { key: 'akita', num: 15, name: 'Kuma', title: 'the Akita', pose: 'sit', quote: ['I will wait for you.', 'I am very good', 'at waiting.'],
      loves: [['Chicken & Rice Bowl', 'chicken & rice'], ['Tennis Ball', 'tennis ball'], ['icon:walk', 'walks']],
      traits: [['loyal', 'waits at the gate for you'], ['calm', 'one low woof, no fuss'], ['proud', 'likes its own space'], ['gentle', 'meets new dogs slowly']] },
    { key: 'spitz', num: 16, name: 'Daifuku', title: 'the Japanese Spitz', pose: 'happy', quote: ['Yes, I am this white', 'on purpose.', 'Look at me.'],
      loves: [['Bone-shaped Biscuit', 'bone biscuit'], ['Frisbee', 'frisbee'], ['icon:star', 'tricks']],
      traits: [['show-off', 'walks to the front and poses'], ['fluffy', 'a white cloud with ears'], ['cheerful', 'a bright little bark'], ['shedder', 'a good brush keeps it soft']] },
    { key: 'pom', num: 17, name: 'Mikan', title: 'the Pomeranian', pose: 'happy', quote: ['Yip! That was', 'my indoor voice.'],
      loves: [['Salmon Pâté', 'salmon pâté'], ['Squeaky Duck', 'squeaky duck'], ['icon:pet', 'petting']],
      traits: [['tiny', 'a small dog with big opinions'], ['spinner', 'spins when happy'], ['yippy', 'a tiny, high yip'], ['bossy', 'leads dogs ten times its size']] },
    { key: 'afghan', num: 18, name: 'Saffron', title: 'the Afghan Hound', pose: 'happy', quote: ['I do not fetch.', 'I glide.'],
      loves: [['Salmon Pâté', 'salmon pâté'], ['Frisbee', 'frisbee'], ['icon:walk', 'walks']],
      traits: [['elegant', 'not one hair out of place'], ['aloof', 'admires you from a distance'], ['silky', 'a brush a few times a week'], ['fast', 'glides, never hurries']] },
    { key: 'dane', num: 19, name: 'Waffle', title: 'the Great Dane', pose: 'happy', quote: ['I am a lap dog.', 'Your lap is', 'just too small.'],
      loves: [['Chicken & Rice Bowl', 'chicken & rice'], ['Plush Bone', 'plush bone'], ['icon:pet', 'petting']],
      traits: [['gentle giant', 'big paws, bigger heart'], ['follower', 'room to room, always'], ['leaner', 'leans on you for a hug'], ['slow grower', 'gentle walks while young']] },
    { key: 'mastiff', num: 20, name: 'Crumpet', title: 'the English Mastiff', pose: 'happy', quote: ['A little drool', 'is how I say', 'I love you.'],
      loves: [['Pupcake', 'pupcake'], ['Rope Tug', 'rope tug'], ['icon:feed', 'feeding']],
      traits: [['sleepy', 'naps in the biggest shade'], ['sweet', 'huge and soft as a cushion'], ['drooler', 'a towel for that big face'], ['slow', 'one big sigh at a time']] },
    { key: 'gsd', num: 21, name: 'Strudel', title: 'the German Shepherd', pose: 'happy', quote: ['Ears up. On duty.', 'Was that', 'a squirrel?'],
      loves: [['Chicken & Rice Bowl', 'chicken & rice'], ['Puzzle Feeder', 'puzzle feeder'], ['icon:star', 'tricks']],
      traits: [['clever', 'learns a trick in a minute'], ['alert', 'ears up at every sound'], ['loyal', 'always by your side'], ['needs a job', 'any job, even tidying']] },
  ];
  if (process.env.DOG_DOC) {
    const JP = { shiba: '柴犬', corgi: 'コーギー', golden: 'ゴールデンレトリバー', dachs: 'ダックスフンド', husky: 'ハスキー', mutt: '保護犬のミックス', chihuahua: 'チワワ', pug: 'パグ', greyhound: 'グレイハウンド', beagle: 'ビーグル', poodle: 'プードル', collie: 'ボーダーコリー', samoyed: 'サモエド', frenchie: 'フレンチブルドッグ',
      akita: '秋田犬', spitz: '日本スピッツ', pom: 'ポメラニアン', afghan: 'アフガン・ハウンド', dane: 'グレート・デーン', mastiff: 'イングリッシュ・マスティフ', gsd: 'ジャーマン・シェパード' };
    const TAG = { shiba: 'shibainu', corgi: 'corgi', golden: 'goldenretriever', dachs: 'dachshund', husky: 'husky', mutt: 'rescuedog', chihuahua: 'chihuahua', pug: 'pug', greyhound: 'greyhound', beagle: 'beagle', poodle: 'poodle', collie: 'bordercollie', samoyed: 'samoyed', frenchie: 'frenchbulldog',
      akita: 'akitainu', spitz: 'japanesespitz', pom: 'pomeranian', afghan: 'afghanhound', dane: 'greatdane', mastiff: 'englishmastiff', gsd: 'germanshepherd' };
    const JTAG = { shiba: '柴犬', corgi: 'コーギー', golden: 'ゴールデンレトリバー', dachs: 'ダックスフンド', husky: 'ハスキー', mutt: '保護犬', chihuahua: 'チワワ', pug: 'パグ', greyhound: 'グレイハウンド', beagle: 'ビーグル', poodle: 'プードル', collie: 'ボーダーコリー', samoyed: 'サモエド', frenchie: 'フレンチブルドッグ',
      akita: '秋田犬', spitz: '日本スピッツ', pom: 'ポメラニアン', afghan: 'アフガンハウンド', dane: 'グレートデーン', mastiff: 'マスティフ', gsd: 'ジャーマンシェパード' };
    // a line about the dog type for the caption (the new v2.11 dogs, the same facts as the doodledoggo.app profiles)
    const NOTE = { akita: 'Hachikō, the dog who waited at Shibuya Station, was an Akita. Say hi to him in Shibuya on the Tokyo Trip 🚄',
      spitz: 'Daifuku is a soft, round rice sweet (大福). The Japanese Spitz is always white.',
      pom: 'Mikan is a mandarin orange (みかん). A good name for an orange fluffball 🍊' };
    // the new v2.11 dogs are mixed in early (they are the news), Noodle still opens and Pepper still closes
    const order = ['dachs', 'akita', 'corgi', 'pom', 'shiba', 'gsd', 'golden', 'spitz', 'husky', 'dane', 'pug', 'chihuahua', 'afghan', 'greyhound', 'beagle', 'mastiff', 'poodle', 'collie', 'samoyed', 'frenchie', 'mutt'];
    const days = ['Sun 1 Nov', 'Wed 4 Nov', 'Sun 8 Nov', 'Wed 11 Nov', 'Sun 15 Nov', 'Wed 18 Nov', 'Sun 22 Nov', 'Wed 25 Nov', 'Sun 29 Nov', 'Wed 2 Dec', 'Sun 6 Dec', 'Wed 9 Dec', 'Sun 13 Dec', 'Wed 16 Dec', 'Sun 20 Dec', 'Wed 23 Dec', 'Sun 27 Dec', 'Wed 30 Dec', 'Sun 3 Jan', 'Wed 6 Jan', 'Sun 10 Jan'];
    const NEW = ['akita', 'spitz', 'pom', 'afghan', 'dane', 'mastiff', 'gsd'];
    let md = `# Dog introduction posts (21)\n\nOne post per dog: the whole dog, a puppy of the same dog type, the name, a line from the game, what it loves (the game's own favourites) and four traits. Files: \`brand/instagram/launch/dogs/\`. Remake: \`node brand/instagram/launch/make.js <shots> dogs [key]\` (\`DOG_DOC=1\` rewrites this file).\n\n**Facts from the game:** the dog type, personality, the speech bubble and the favourite food, toy and activity. **Creative:** the four trait boxes (the same as the dog profiles on doodledoggo.app, \`tools/site_dogs.js\`).\n\n**The game is live:** every post and caption says "play free on itch.io" (https://an9ou.itch.io/doodle-doggo, the link is in the bio).\n\n## Order and days (2 posts a week, 20:30 JST)\n\nNoodle first (the main character), Pepper last (the shelter mutt: "Can I come home with you?" is a nice closer). The 7 dogs new in v2.11 "Tokyo Trip" (marked ✨) are mixed in early, because they are the news; Kuma the Akita goes second (Hachikō, the Tokyo Trip). These run alongside the winter posts in December and the New Year posts in January.\n\n| Day | Dog | File |\n|---|---|---|\n`;
    order.forEach((k, i) => { const d = DOGS.find((x) => x.key === k); md += `| ${days[i]} | ${d.name} the ${d.title.replace(/^the /, '')}${NEW.includes(k) ? ' ✨' : ''} | \`dog-${String(d.num).padStart(2, '0')}-${d.name.toLowerCase()}.jpg\` |\n`; });
    md += `\nEach post below has a caption (English first, one short Japanese line), alt text under 100 characters and seven hashtags (five English, two Japanese).\n`;
    for (const k of order) {
      const d = DOGS.find((x) => x.key === k), breed = d.title.replace(/^the /, ''), loves = d.loves.map((l) => l[1]).join(', ');
      const alt = `${d.name} the ${breed} with a puppy, favourite things and four traits.`;
      const head = NEW.includes(k) ? `New in Doodle Doggo: meet ${d.name}, the ${breed} 🐶✨` : `Meet ${d.name}, the ${breed} 🐶`;
      md += `\n---\n\n### ${d.name} the ${breed}${NEW.includes(k) ? ' ✨' : ''}\nFile: \`dogs/dog-${String(d.num).padStart(2, '0')}-${d.name.toLowerCase()}.jpg\`\n\n**Caption**\n\`\`\`\n${head}\n"${d.quote.join(' ')}"\n\n${d.traits.map(([t, sub]) => `• ${t}: ${sub}`).join('\\n')}\n\nLoves: ${loves}.\n${NOTE[k] ? `\n${NOTE[k]}\n` : ''}\nWho is your favourite dog? 👇 Play Doodle Doggo free on itch.io (link in bio).\n\nワンコ紹介：${d.name}（${JP[k]}）🐶\n\n#cozygames #doggame #${TAG[k]} #doodledoggo #indiegame #${JTAG[k]} #doglovers\n\`\`\`\n**Alt text:** \`${alt}\` (${alt.length} characters)\n`;
    }
    fs.writeFileSync(path.join(h.OUT, '..', '..', '..', 'docs', 'marketing', 'DOG_INTRO_POSTS.md'), md.replace(/\\n/g, '\n'));
  }
  for (const d of DOGS) if (!only || only === d.key) await render(await post(d), W, H, `dogs/dog-${String(d.num).padStart(2, '0')}-${d.name.toLowerCase()}.jpg`);
  await mp.close();
};
