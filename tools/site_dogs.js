// The dog profiles on doodledoggo.app (the home page cards and /dogs): the data that is not text. tools/site_i18n.js writes the card and profile HTML.
// v2.14: every English text of a profile (name, line, personality, the four traits, the playroom habit, the three favourites, the fun fact) is in
// site/i18n/en.json under dog.<key>.*, so translators have it in one place; this module adds them back (quote, traits, play, loves labels, fun) for older readers.
// Sources: the game's own facts (game/src/00_core.js through PawArt.DOGS: name, dog type, personality; FAV: food, toy, activity),
// the marketing posts (marketing/launch: docs/marketing/DOG_INTRO_POSTS.md, brand/instagram/launch/make_dogs.js: the line and the four traits)
// and the v2.10 personality table (integration/v2.10: V210.md 5.1, game/src/36_personality.js: how each dog behaves in the playroom).
// jp: the dog type in Japanese with its reading; nameJp: the dog's name written in katakana (never translated).
// loves: the game item (or 'icon:<name>' or 'dig') whose drawing shows each favourite. pose: the drawing on the card.
const EN = require('../site/i18n/en.json');
const DOGS = [
  { key: 'shiba', jp: '柴犬', jpRead: 'shiba inu', nameJp: 'モチ', pose: 'happy', loves: ['Salmon Pâté', 'Plush Bone', 'icon:star'] },
  { key: 'corgi', jp: 'コーギー', jpRead: 'kōgī', nameJp: 'ビスケット', pose: 'happy', loves: ['Pupcake', 'Puzzle Feeder', 'icon:feed'] },
  { key: 'golden', jp: 'ゴールデンレトリバー', jpRead: 'gōruden retoribā', nameJp: 'サニー', pose: 'happy', loves: ['Basic Kibble', 'Tennis Ball', 'icon:play'] },
  { key: 'dachs', jp: 'ダックスフンド', jpRead: 'dakkusufundo', nameJp: 'ヌードル', pose: 'happy', loves: ['Bone-shaped Biscuit', 'Squeaky Duck', 'dig'] },
  { key: 'husky', jp: 'ハスキー', jpRead: 'hasukī', nameJp: 'フロスト', pose: 'howl', loves: ['Chicken & Rice Bowl', 'Rope Tug', 'icon:walk'] },
  { key: 'mutt', jp: 'ミックス犬', jpRead: 'mikkusu ken', nameJp: 'ペッパー', pose: 'happy', loves: ['icon:pet', 'icon:home', 'icon:heart'] },
  { key: 'chihuahua', jp: 'チワワ', jpRead: 'chiwawa', nameJp: 'ピーナッツ', pose: 'speak', loves: ['Salmon Pâté', 'Squeaky Duck', 'icon:pet'] },
  { key: 'pug', jp: 'パグ', jpRead: 'pagu', nameJp: 'ダンプリング', pose: 'sit', loves: ['Pupcake', 'Plush Bone', 'icon:feed'] },
  { key: 'greyhound', jp: 'グレイハウンド', jpRead: 'gureihaundo', nameJp: 'ロケット', pose: 'happy', loves: ['Chicken & Rice Bowl', 'Frisbee', 'icon:play'] },
  { key: 'beagle', jp: 'ビーグル', jpRead: 'bīguru', nameJp: 'ベーグル', pose: 'sniff', loves: ['Basic Kibble', 'Puzzle Feeder', 'dig'] },
  { key: 'poodle', jp: 'ミニチュア・プードル', jpRead: 'minichua pūdoru', nameJp: 'プレッツェル', pose: 'bow', loves: ['Salmon Pâté', 'Puzzle Feeder', 'icon:star'] },
  { key: 'collie', jp: 'ボーダーコリー', jpRead: 'bōdā korī', nameJp: 'スカウト', pose: 'happy', loves: ['Chicken & Rice Bowl', 'Frisbee', 'icon:play'] },
  { key: 'samoyed', jp: 'サモエド', jpRead: 'samoedo', nameJp: 'クラウド', pose: 'happy', loves: ['Chicken & Rice Bowl', 'Rope Tug', 'icon:walk'] },
  { key: 'frenchie', jp: 'フレンチブルドッグ', jpRead: 'furenchi burudoggu', nameJp: 'ブリオッシュ', pose: 'sit', loves: ['Pupcake', 'Plush Bone', 'icon:pet'] },
  { key: 'akita', jp: '秋田犬', jpRead: 'akita inu', nameJp: 'クマ', pose: 'sit', loves: ['Chicken & Rice Bowl', 'Tennis Ball', 'icon:walk'] },
  { key: 'spitz', jp: '日本スピッツ', jpRead: 'nihon supittsu', nameJp: 'ダイフク', pose: 'happy', loves: ['Bone-shaped Biscuit', 'Frisbee', 'icon:star'] },
  { key: 'pom', jp: 'ポメラニアン', jpRead: 'pomeranian', nameJp: 'ミカン', pose: 'happy', loves: ['Salmon Pâté', 'Squeaky Duck', 'icon:pet'] },
  { key: 'afghan', jp: 'アフガン・ハウンド', jpRead: 'afugan haundo', nameJp: 'サフラン', pose: 'sit', loves: ['Salmon Pâté', 'Frisbee', 'icon:walk'] },
  { key: 'dane', jp: 'グレート・デーン', jpRead: 'gurēto dēn', nameJp: 'ワッフル', pose: 'sit', loves: ['Chicken & Rice Bowl', 'Plush Bone', 'icon:pet'] },
  { key: 'mastiff', jp: 'イングリッシュ・マスティフ', jpRead: 'ingurisshu masutifu', nameJp: 'クランペット', pose: 'down', loves: ['Pupcake', 'Rope Tug', 'icon:feed'] },
  { key: 'gsd', jp: 'ジャーマン・シェパード', jpRead: 'jāman shepādo', nameJp: 'シュトゥルーデル', pose: 'sit', loves: ['Chicken & Rice Bowl', 'Puzzle Feeder', 'icon:star'] },
  { key: 'dobie', jp: 'ドーベルマン', jpRead: 'dōberuman', nameJp: 'エスプレッソ', pose: 'sit', loves: ['Chicken & Rice Bowl', 'Rope Tug', 'icon:walk'] },
  { key: 'corso', jp: 'カネ・コルソ', jpRead: 'kane koruso', nameJp: 'カンノーロ', pose: 'sit', loves: ['Pupcake', 'Plush Bone', 'icon:pet'] },
  { key: 'pitbull', jp: 'ピット・ブル', jpRead: 'pitto buru', nameJp: 'ピーチ', pose: 'happy', loves: ['Pupcake', 'Rope Tug', 'icon:pet'] },
  { key: 'minpin', jp: 'ミニチュア・ピンシャー', jpRead: 'minichua pinshā', nameJp: 'ジェリービーン', pose: 'happy', loves: ['Salmon Pâté', 'Squeaky Duck', 'icon:star'] },
  { key: 'lab', jp: 'ラブラドール・レトリバー', jpRead: 'raburadōru retoribā', nameJp: 'バター', pose: 'happy', loves: ['Basic Kibble', 'Tennis Ball', 'icon:play'] },
  { key: 'malamute', jp: 'アラスカン・マラミュート', jpRead: 'arasukan maramyūto', nameJp: 'メープル', pose: 'speak', loves: ['Chicken & Rice Bowl', 'Rope Tug', 'dig'] },
  { key: 'chow', jp: 'チャウチャウ', jpRead: 'chau chau', nameJp: 'バオ', pose: 'sit', loves: ['Salmon Pâté', 'Plush Bone', 'icon:walk'] },
  { key: 'stdpoodle', jp: 'スタンダード・プードル', jpRead: 'sutandādo pūdoru', nameJp: 'マドレーヌ', pose: 'happy', loves: ['Salmon Pâté', 'Frisbee', 'icon:star'] },
  { key: 'schnauzer', jp: 'ミニチュア・シュナウザー', jpRead: 'minichua shunauzā', nameJp: 'ミューズリー', pose: 'sit', loves: ['Bone-shaped Biscuit', 'Puzzle Feeder', 'icon:walk'] },
  { key: 'westie', jp: 'ウエスト・ハイランド・ホワイト・テリア', jpRead: 'uesuto hairando howaito teria', nameJp: 'ショートブレッド', pose: 'happy', loves: ['Bone-shaped Biscuit', 'Squeaky Duck', 'dig'] },
  { key: 'yorkie', jp: 'ヨークシャー・テリア', jpRead: 'yōkushā teria', nameJp: 'トフィー', pose: 'sit', loves: ['Salmon Pâté', 'Plush Bone', 'icon:pet'] },
  { key: 'bichon', jp: 'ビションフリーゼ', jpRead: 'bishon furīze', nameJp: 'メレンゲ', pose: 'happy', loves: ['Pupcake', 'Squeaky Duck', 'icon:star'] },
  { key: 'maltese', jp: 'マルチーズ', jpRead: 'maruchīzu', nameJp: 'マシュマロ', pose: 'sit', loves: ['Salmon Pâté', 'Plush Bone', 'icon:pet'] },
  { key: 'shihtzu', jp: 'シーズー', jpRead: 'shīzū', nameJp: 'ワンタン', pose: 'down', loves: ['Pupcake', 'Plush Bone', 'icon:feed'] }
];
module.exports = DOGS.map((d) => { const t = (k) => EN[`dog.${d.key}.${k}`]; return Object.assign({}, d, {
  quote: t('quote'), play: t('play'), fun: t('fun'), loves: d.loves.map((n, i) => [n, t('love' + (i + 1))]),
  traits: [1, 2, 3, 4].map((i) => [t('trait' + i), t('trait' + i + '_line')])
}); });
