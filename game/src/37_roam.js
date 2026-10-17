/* ======================= v2.10 FREE TO ROAM: the roam engine (lane ROAM, V210.md sections 1 and 5) =======================
   Stub from the Coordinator: the cross-lane API with safe defaults. ROAM replaces the bodies and keeps the names (section 5.3). */
const RM = { paused: new Set() };
function rmOn() { return !!S && cur.mode === 'yard' && RM.paused.size === 0; } // roaming runs now (the scene is up and nothing holds it)
function rmDogs() { return S ? [D()].concat(others()) : []; } // every dog drawn in this scene, the leader first
function rmPos(d) { return d === D() ? { x: 430, y: 500, face: 'right', sc: 1, pose: 'idle' } : { x: 430, y: 500, face: 'right', sc: 1, pose: 'idle' }; } // feet in world units
function rmScale(y) { return 1; } // the depth scale at feet y, the same for every dog
function rmSet(d, o) {} // place a dog at once: { x, y, face, pose } (any subset)
function rmTo(d, x, y, o) { if (o && typeof o.done === 'function') o.done(); } // walk (or run, o.run) there, then o.done()
function rmPause(tag) { RM.paused.add(tag); }
function rmResume(tag) { RM.paused.delete(tag); }
function rmZone(place) { return null; } // the walkable zone of a place (section 5.2)
function rmEl(d) { return d ? document.querySelector(`#view [data-dog="${d.id}"]`) : null; } // the dog's <g data-dog> in the scene
