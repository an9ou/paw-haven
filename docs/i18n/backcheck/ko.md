# Back-check: Korean (ko), v2.14.1

Checked: 736 lines (584 game keys + 152 site keys from `keys.txt`). Method: each line was read in Korean and put back into plain English first, then compared with `en.json`. Automated checks over the same lines: placeholders and ICU shape against `game/i18n/msg.js` (all `josa` pairs parse), particles written by hand right after a `{var}` (none found: every one goes through `{x, josa, …}`), HTML tags, semicolons, emoji, glossary terms, word bans.

Fixed: 2 lines (1 in the key list, plus 1 outside it with the same wording).

| Key | Old back-translation | Fix | Why |
|---|---|---|---|
| `care.night_nap` | "Night **day-naps** restore more (+40%)." (밤 낮잠) | 밤잠은 더 많이 회복돼요(+40%). | 낮잠 literally means "daytime sleep", so 밤 낮잠 contradicts itself. 밤잠 is the natural word for night sleep. Shorter. |
| `yard.climbs_into_the_night_naps` (not in the list, same wording) | "...Night day-naps fill more Energy (+40%)." | 밤잠은 기운이 더 많이 차요 (+40%). | Same fix, so the two lines stay consistent. |

Particles: every particle after a name, place, item or house uses `{…, josa, …}`, including 이에요/예요 and (으)로. The register is the friendly 해요체 in the UI and the casual 반말 for Gerald, as the style guide says. Dogs get no pronouns and the player has no gender (나 / 내 in the UI).

For a native speaker to look at:
- `title.keep_my_dog`: 내 강아지 지키기 ("protect/keep my dog") is the cancel button on "Start over?". It works, but 지키다 can sound like there is a danger. 지금 강아지 그대로 would be calmer.
- `care.cool`: 오이처럼 시원해요 is the English idiom "cool as a cucumber" translated word for word. Korean has no such idiom. It's cute but may read oddly.
- site `home.note.lead.text`: 강아지가 눈 똥 ("the poop the dog did") is casual. 배변 would be more polite if the site should sound gentler.
- `title.start_over_body_html`: the "moved to a farm" joke is kept (농장으로 이사).
