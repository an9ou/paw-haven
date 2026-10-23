# v2.15 coordinator handoff (23 Oct 2026, late; from session_015hxeEvVfJnoVFWXme4aCfc)

## State (integration/v2.15, pushed)
Merged and green: main v2.14.2, MAP, GROUND ART B (+ engine: market roaming via rmScene(), yard house/mailbox/bowl in #pack), ACTIVITIES 1–4 (Training Ground, Splash Pool, run tracks + 6 treasures + gates, Market Street rename), v215_migrate test fix (harness `storage` seeding; Chromium drops reload writes). v215-base = origin/v215-base = v2.14.1.
Left, in order: ITEM ART (Doggy Life Vest, Sunflower Collar, Sailor Cap in dogs/ OUT lists; icons for those + Lucky Horseshoe, Bamboo Ring (shows "?"), Paper Lantern, Sea Glass; optional low puppy bar in world G training) → I18N batch (~250 keys x 10 languages, fonts re-run, i18n_fit + site_fit 0) → one combined pass of the three reviews (code, phone, art) → fix batch → all + phone, check_identical → as-built notes V215.md 18 → "v2.15 ready" to the Game Manager.

## Review notes (for the combined review)
- grOn places other than the yard keep #bowlG over the scene; ball play on Kibble Corner untested with grOn; PACK_SPOTS cafe [930,466] by the bed; RM_ZONES rows for cafe/vet/salon are the old bands (engine uses FLOOR).
- Square winter all-flags render 527 KB (cap 560 in v215_gart-b); world C B blocks 109 KB source, minified size unmeasured; wide scenes 340–480 KB.
- phone_v215_ground "golden at the back can be tapped" flaked once; phGndLayers returns '' for 1600-wide scenes (phone ground strip in wide places).
- Puppy course jumps the tall bar; #agBoard overlay hides the art scoreboard face; Bond rewards use addBond (BOOST x3).
- Roaming dogs never enter pool water (GR_ACTS water weight 0, only the daily paddle); Sunflower Lanes has no Common treasure (Common roll = 40 coins).
- Square festival visitor moved to FS_PACK_SQ_GR [800,400] in a grOn square; desktop place buttons block part of the yard's front-right corner.
- kiteWatch kite in 1000-wide #fx on the wide hilltop; Dog Card visitors always behind floor props.

Screenshots from the lanes (untracked) were in the old container's scratchpad; re-take in the reviews.

## Owner rules for v2.15 (23 Oct; they replace "3 subagents per step")
- Paused until the Game Manager says resume (v2.14.1 ships first). On resume, merge main into integration/v2.15 first.
- One part at a time, in order, no parallel lanes; at most 2 subagents at a time in total; Sonnet paw-fixers for routine work; one test suite at a time (shared lock, `flock /tmp/v215_test.lock`, tracked background tasks, no pollers: two container restarts on 23 Oct came from load).
- Hand over at about 150k context (25-line handoff to the Game Manager).
- Translate all new v2.15 text in one batch near the end.
- Message the Game Manager only when a part is done or blocked, briefly.
- Usage limit: send_later a resume for 2 minutes after the reset.

## Done (on integration/v2.15, pushed)
STUBS (mpOn, grOn, MP_PLACES, v215Fields, artChunk lazy chunks, harness `map215`/`ground` options; V215.md 13b), MAP ART (world F), PLACE ART (world G), GROUND (43_ground.js), GROUND ART A (7 wide scenes in world C). Suites green on integration: smoke, i18n, v215_migrate, v215_env, v215_places_art; the lanes ran v215_ground, phone_v215_ground, v215_gart-a, the old art and roam suites, check_identical (0 differ).

## Paused lane branches (all pushed)
1. `lane/v215-map` edc801c: done. Merge it next, then re-run v2_town, v21_town, phone_town, all_a, v211_tokyo, v28_jp one at a time; MAP writes as-built notes. Decisions to list in the report: phone default map a bit taller than short screens (captions ≥ 15 px); no "moved" sticker on Kibble Corner.
2. `lane/v215-gart-b` 5cff84b: yard, house, Kibble Corner drawn (world A block, untested). Left: square, cafe, vet, salon, fujihill (world C), suite v215_gart-b, test_v215_env list, screenshots, old suites. Brief: brief_gart_b.md. Note for GROUND: mailbox MB_BOX and dog house stand on the deep yard outside #floorG.
3. `lane/v215-act`: nothing built. Brief: brief_act.md (Sonnet). Add: rename "Market Street" in missions (24) and Gerald's lessons (25).
Then: ITEM ART (Doggy Life Vest, Sunflower Collar, Sailor Cap in dogs/ OUT lists, and icons for those plus Lucky Horseshoe, Bamboo Ring, Paper Lantern, Sea Glass), I18N in one batch (about 245 keys x 10 languages, fonts re-run, fit audits 0), three reviews (code, phone, art) one at a time, fix batches, all + phone, check_identical, as-built notes V215.md 18, "v2.15 ready" report.

## Review notes collected so far
World C wide-scene renders are 340–480 KB SVG in winter / all flags (phone perf); kiteWatch draws its kite in 1000-wide #fx on the wide hilltop; desktop place-button no-go boxes can close front corners of deep floors; Dog Card visitors are always behind floor props; dogs don't enter water until ACTIVITIES registers GR_ACTS.

Files here: v215_common.md (lane rules), brief_*.md, coord_notes.md (full log).
