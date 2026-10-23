# v2.15 coordinator handoff (23 Oct 2026, 08:45 UTC; updated by session_015hxeEvVfJnoVFWXme4aCfc)

Resumed: main (v2.14.1) merged into integration (b3dde92), lane/v215-map merged (234bda0), 10 suites green. v215-base = origin/v215-base = v2.14.1. GROUND ART B done and merged (lane/v215-gart-b 83e716d + lane/v215-gart-b-eng 2a21c4e: market mode in the engine via rmScene(), yard house/mailbox/bowl in #pack, FS_PACK_SQ_GR), 12 suites green. Next: ACTIVITIES in parts (training, pool, tracks+economy, lines). Review notes added: grOn places other than the yard keep #bowlG over the scene; ball play on Kibble Corner untested with grOn; PACK_SPOTS cafe [930,466] by the bed; Square winter all-flags render 527 KB; phone_v215_ground 'golden at the back' flaked once; minified size of world C B blocks not measured (109 KB source).

Brief: build v2.15 "Around Town" per V215.md on integration/v2.15. Report to the Game Manager (session_01YWqF1YmkskA96YAshTRHg3) with send_message. Never deploy, upload, publish the artifact or merge to main.

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
