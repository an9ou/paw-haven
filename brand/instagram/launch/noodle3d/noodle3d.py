# A 3D Noodle (the dachshund, from his game design in dogs/pawart_dogs.js) dancing for 5 s, built from simple shapes in Blender and
# rendered with flat crayon colours and thick dark outlines (Freestyle). Owner's request (25 Oct 2026), a test of a free 3D route.
#   blender -b -P brand/instagram/launch/noodle3d/noodle3d.py -- <outdir> [still|anim] [scale]
# Colours from the game: body #A65A34, socks and chest #F5B26B, ear #6E3315, ink #2E2320. Every colour stays inside its outline.
import bpy, math, sys, os
from mathutils import Vector, Euler

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
OUT = os.path.abspath(argv[0] if argv else 'noodle3d_out'); os.makedirs(OUT, exist_ok=True)
MODE = argv[1] if len(argv) > 1 else 'still'
SCALE = int(argv[2]) if len(argv) > 2 else 100
FPS, SECS = 30, 5

def hexcol(h, a=1.0):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((x + 0.055) / 1.055) ** 2.4 if x > 0.04045 else x / 12.92 for x in c) + (a,)  # sRGB -> linear

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
sc.render.fps = FPS; sc.frame_start = 1; sc.frame_end = FPS * SECS

# ---- materials: a flat crayon colour (mostly emission, a little diffuse so the forms still read) ----
def mat(name, hexc, flat=0.55):
    m = bpy.data.materials.new(name); m.use_nodes = True; nt = m.node_tree; nt.nodes.clear()
    o = nt.nodes.new('ShaderNodeOutputMaterial'); mix = nt.nodes.new('ShaderNodeMixShader'); d = nt.nodes.new('ShaderNodeBsdfDiffuse'); e = nt.nodes.new('ShaderNodeEmission')
    d.inputs['Color'].default_value = hexcol(hexc); e.inputs['Color'].default_value = hexcol(hexc); e.inputs['Strength'].default_value = 1.0
    mix.inputs['Fac'].default_value = flat
    nt.links.new(d.outputs[0], mix.inputs[1]); nt.links.new(e.outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], o.inputs[0])
    return m
M = {k: mat(k, v) for k, v in dict(body='#A65A34', light='#F5B26B', ear='#6E3315', ink='#2E2320', white='#FFFFFF', tongue='#EE6A8A').items()}
M['paper'] = mat('paper', '#FFF8EC', 0.35)

def obj_mat(o, m):
    o.data.materials.clear(); o.data.materials.append(m)

def box(name, size, loc, m, bevel=0.08, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot); o = bpy.context.object; o.name = name; o.scale = size
    bpy.ops.object.transform_apply(scale=True)
    if bevel: b = o.modifiers.new('bev', 'BEVEL'); b.width = bevel; b.segments = 3
    obj_mat(o, m)
    if parent: o.parent = parent
    return o

def ball(name, r, loc, m, parent=None, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, location=loc, segments=24, ring_count=12); o = bpy.context.object; o.name = name; o.scale = scale
    bpy.ops.object.transform_apply(scale=True); bpy.ops.object.shade_smooth(); obj_mat(o, m)
    if parent: o.parent = parent
    return o

def pivot(name, loc, parent=None):
    o = bpy.data.objects.new(name, None); sc.collection.objects.link(o); o.location = loc
    if parent: o.parent = parent
    return o

# ---- Noodle (faces +X). Root at the ground under the middle of the body ----
root = pivot('noodle', (0, 0, 0))
H = 0.62                                     # leg length: body bottom height
# the long body: one smooth sausage bent by a five-bone spine (an armature), so it can wave like a noodle
BL, BZ = 3.1, H + 0.34
bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=0.34, depth=BL, location=(0, 0, BZ), rotation=(0, math.radians(90), 0)); body = bpy.context.object; body.name = 'body'
body.scale = (0.94, 1.0, 1.0); bpy.ops.object.transform_apply(rotation=True, scale=True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.mesh.loopcut_slide if False else None
bpy.ops.object.mode_set(mode='OBJECT')
import bmesh
bm = bmesh.new(); bm.from_mesh(body.data)
side = [e for e in bm.edges if abs(e.verts[0].co.x - e.verts[1].co.x) > BL * 0.9]
bmesh.ops.subdivide_edges(bm, edges=side, cuts=16, use_grid_fill=True); bm.to_mesh(body.data); bm.free()
bv = body.modifiers.new('bev', 'BEVEL'); bv.width = 0.24; bv.segments = 5; bv.limit_method = 'ANGLE'; bv.use_clamp_overlap = False
obj_mat(body, M['body']); bpy.ops.object.shade_smooth()
arm_d = bpy.data.armatures.new('spine'); arm = bpy.data.objects.new('spine', arm_d); sc.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
NB, prevb = 5, None
for i in range(NB):
    b = arm_d.edit_bones.new(f'b{i}'); b.head = (-BL / 2 + i * BL / NB, 0, BZ); b.tail = (-BL / 2 + (i + 1) * BL / NB, 0, BZ); b.roll = 0
    if prevb: b.parent = prevb; b.use_connect = True
    prevb = b
bpy.ops.object.mode_set(mode='OBJECT')
bpy.ops.object.select_all(action='DESELECT'); body.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
# move the bevel before the armature so the rounded body bends as one piece
bpy.context.view_layer.objects.active = body
while body.modifiers[0].name != 'bev': bpy.ops.object.modifier_move_up(modifier='bev')
arm.parent = root
from mathutils import Matrix
def on_bone(name, bone, loc):
    """a pivot riding on a spine bone, at world location loc (rest pose)"""
    p = bpy.data.objects.new(name, None); sc.collection.objects.link(p)
    p.parent = arm; p.parent_type = 'BONE'; p.parent_bone = bone
    eb = arm.data.bones[bone]; tailw = arm.matrix_world @ eb.matrix_local @ Matrix.Translation((0, eb.length, 0))
    p.matrix_parent_inverse = tailw.inverted(); p.location = loc
    return p
segs = [on_bone(f'seg{i}', f'b{i}', (-BL / 2 + (i + 0.5) * BL / NB, 0, BZ)) for i in range(NB)]
# the light chest patch on the front segment (inside its own outline)
ball('chest', 0.3, (0.24, 0, -0.13), M['light'], segs[4], scale=(0.8, 1.06, 0.5))
# legs: a brown upper and a light sock, on a hip pivot each (front pair on seg4, back pair on seg0)
legs = []
for (seg, dx) in ((segs[0], 0.0), (segs[4], 0.0)):
    for side in (-1, 1):
        hip = pivot('hip', (dx, side * 0.22, -0.2), seg)
        box('leg', (0.2, 0.2, 0.36), (0, 0, -0.26), M['body'], 0.06, hip)
        box('sock', (0.21, 0.21, 0.24), (0, 0, -0.52), M['light'], 0.06, hip)
        legs.append((hip, side, seg is segs[4]))
# the tail: a thin curved tube on a pivot at the back
tail_p = pivot('tailp', (-0.38, 0, 0.18), segs[0])
cu = bpy.data.curves.new('tailc', 'CURVE'); cu.dimensions = '3D'; cu.bevel_depth = 0.06; cu.bevel_resolution = 3
sp = cu.splines.new('BEZIER'); sp.bezier_points.add(2)
for bp, co in zip(sp.bezier_points, [(0, 0, 0), (-0.32, 0, 0.32), (-0.3, 0, 0.78)]):
    bp.co = co; bp.handle_left_type = bp.handle_right_type = 'AUTO'
tail = bpy.data.objects.new('tail', cu); sc.collection.objects.link(tail); tail.parent = tail_p; tail.data.materials.append(M['body'])
# the head: a blocky head, a light muzzle, a dark nose, one floppy dark ear (and one on the far side), big round eyes, the tongue out
neck = pivot('neck', (0.42, 0, 0.3), segs[4])
head = box('head', (0.86, 0.78, 0.78), (0.28, 0, 0.32), M['body'], 0.2, neck)
box('muzzle', (0.46, 0.46, 0.34), (0.82, 0, 0.18), M['light'], 0.1, neck)
ball('nose', 0.1, (1.06, 0, 0.3), M['ink'], neck)
box('tongue', (0.14, 0.18, 0.26), (0.92, 0.04, -0.06), M['tongue'], 0.05, neck, rot=(0, math.radians(-12), 0))
for side in (-1, 1):
    ear = box('ear', (0.34, 0.07, 0.62), (0.16, side * 0.43, 0.18), M['ear'], 0.05, neck, rot=(math.radians(side * 6), math.radians(14), 0))
    eye = ball('eye', 0.13, (0.58, side * 0.25, 0.52), M['white'], neck)
    ball('pupil', 0.075, (0.66, side * 0.28, 0.52), M['ink'], neck)
    ball('glint', 0.025, (0.71, side * 0.3, 0.57), M['white'], neck)
    box('brow', (0.18, 0.05, 0.04), (0.56, side * 0.25, 0.7), M['ink'], 0.01, neck, rot=(0, 0, math.radians(side * -10)))

# ---- the paper floor and backdrop (one cream colour), soft light, a soft round shadow ----
bpy.ops.mesh.primitive_plane_add(size=60, location=(0, 0, 0)); floor = bpy.context.object; obj_mat(floor, M['paper'])
wall = None   # no backdrop: the cream world colour is the sky, so there is no edge to see
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs['Color'].default_value = hexcol('#FFF8EC'); w.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.0
bpy.ops.object.light_add(type='SUN', location=(3, -2, 6)); sun = bpy.context.object; sun.data.energy = 2.2; sun.data.angle = math.radians(18)
sun.rotation_euler = Euler((math.radians(35), math.radians(25), math.radians(-30)))

# ---- camera: a 3/4 view from the front, so the long body runs back into the picture; 9:16 ----
bpy.ops.object.camera_add(location=(5.0, -6.4, 2.1)); cam = bpy.context.object; sc.camera = cam; cam.data.lens = 36
tgt = pivot('tgt', (0.55, 0, 1.2)); tc = cam.constraints.new('TRACK_TO'); tc.target = tgt; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'

# ---- the dance (keyframes). Beat: 120 bpm (0.5 s) ----
def key(o, path, f, v):
    setattr(o, path, v); o.keyframe_insert(data_path=path, frame=f)
B = 0.5
for f in range(1, FPS * SECS + 1):
    t = (f - 1) / FPS; beat = t / B
    sway = math.sin(beat * math.pi) * (1 if t < 3.0 else 0.4)
    bounce = abs(math.sin(beat * math.pi)) * 0.07
    hop = 0.0; squash = 1.0
    if 3.0 <= t < 3.6:                          # a happy hop
        k = (t - 3.0) / 0.6; hop = math.sin(k * math.pi) * 0.55; squash = 1 + 0.12 * math.sin(k * math.pi)
    elif 2.85 <= t < 3.0: squash = 0.9          # a crouch before it
    turn = 0.0 if t < 3.6 else min(1, (t - 3.6) / 0.5)   # the proud pose: turn a little toward the camera
    key(root, 'location', f, Vector((0, 0, bounce + hop)))
    key(root, 'rotation_euler', f, Euler((0, 0, math.radians(-4 + sway * 8 + turn * -34))))
    key(root, 'scale', f, Vector((1 / math.sqrt(squash), 1 / math.sqrt(squash), squash)))
    # the noodle wave: each segment yaws a little later than the one before (strongest in the middle of the clip)
    amp = 0 if t < 0.8 else min(1, (t - 0.8) / 0.4) * (1 if t < 3.0 else max(0, 1 - (t - 3.0) / 0.4))
    for i in range(1, NB):
        pb = arm.pose.bones[f'b{i}']; pb.rotation_mode = 'XYZ'
        w = 2 * math.pi * (t * 1.6 - i * 0.2)
        pb.rotation_euler = Euler((math.radians(amp * 3 * math.sin(w)), 0, math.radians(amp * 12 * math.sin(w)))); pb.keyframe_insert('rotation_euler', frame=f)
    # legs step in turn on the beat; tucked during the hop
    for j, (hip, side, front) in enumerate(legs):
        ph = (beat + (0.5 if (side > 0) == front else 0)) % 1
        step = math.sin(ph * 2 * math.pi) * 18 if hop == 0 else (-35 if front else 35)
        key(hip, 'rotation_euler', f, Euler((0, math.radians(step), 0)))
    key(tail_p, 'rotation_euler', f, Euler((math.radians(25 * math.sin(t * 2 * math.pi * 4)), 0, 0)))   # a fast wag
    key(neck, 'rotation_euler', f, Euler((math.radians(10 * math.sin(beat * math.pi)), math.radians(-6 * abs(math.sin(beat * math.pi)) - turn * 6), math.radians(turn * -12))))
    key(tgt, 'location', f, Vector((0.55 + turn * 0.2, 0, 1.2 + hop * 0.5)))
    key(cam, 'location', f, Vector((5.0 - t * 0.14, -6.4 + t * 0.2, 2.1 - t * 0.03)))   # a slow push-in
for o in list(bpy.data.objects):
    if o.animation_data and o.animation_data.action:
        for fc in o.animation_data.action.fcurves:
            for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'

# ---- render: Cycles on the CPU, flat colours, thick dark-brown outlines ----
r = sc.render; r.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = int(os.environ.get('SAMPLES', 12)); sc.cycles.use_denoising = True
r.resolution_x, r.resolution_y, r.resolution_percentage = 1080, 1920, SCALE
sc.view_settings.view_transform = 'Standard'
r.use_freestyle = True; r.line_thickness_mode = 'ABSOLUTE'; r.line_thickness = 1.0
ls = sc.view_layers[0].freestyle_settings.linesets[0] if sc.view_layers[0].freestyle_settings.linesets else sc.view_layers[0].freestyle_settings.linesets.new('ink')
ls.select_by_visibility = True; ls.select_silhouette = True; ls.select_border = True; ls.select_crease = False
ls.linestyle = ls.linestyle or bpy.data.linestyles.new('ink'); ls.linestyle.color = hexcol('#2E2320')[:3]; ls.linestyle.thickness = 5.0 * SCALE / 100
floor.hide_render = False
# the floor and wall get no outline
floor.visible_shadow = True
ls.select_by_collection = True
ink = bpy.data.collections.new('ink'); sc.collection.children.link(ink)
for o in list(sc.collection.objects):
    if o.type in ('MESH', 'CURVE') and o is not floor: ink.objects.link(o)
ls.collection = ink

if MODE == 'still':
    for f in [int(x) for x in os.environ.get('STILLS', '10,60,98,140').split(',')]:
        sc.frame_set(f); r.filepath = os.path.join(OUT, f'still_{f:03d}.png'); bpy.ops.render.render(write_still=True)
else:
    r.filepath = os.path.join(OUT, 'f_'); r.image_settings.file_format = 'PNG'
    fr = os.environ.get('FRAMES')
    if fr: a, b = map(int, fr.split('-')); sc.frame_start, sc.frame_end = a, b
    bpy.ops.render.render(animation=True)
