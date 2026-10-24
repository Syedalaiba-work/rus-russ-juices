"""The four RUS RUSS drinks, modelled and rendered in Blender (Cycles).

One cup, one camera, one light set-up; only the smoothie and the fruit change, so the four
pictures register exactly. Canvas and placement follow public/assets/hero/layers/README.md
(1400 x 1656, transparent) and the drink-alone pictures the site already uses.

  blender -b --python tools/blender_drinks.py -- <flavour> [percent] [samples]

  percent 100 = 1400 x 1656, 200 = the 2800 x 3312 master.
Writes design/blender/renders/<flavour>.png and design/blender/<flavour>.blend.
Then: python tools/blender_post.py site
"""
import math
import os
import random
import sys
from math import cos, exp, pi, radians, sin, sqrt

import bmesh
import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Euler, Matrix, Vector, noise
from mathutils.kdtree import KDTree

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
FLAVOUR = argv[0] if argv else "berry-blast"
PERCENT = int(argv[1]) if len(argv) > 1 else 100
SAMPLES = int(argv[2]) if len(argv) > 2 else 256
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "design", "blender")

# what is in each drink. The recipes are placeholder (DESIGN.md appendix C): fruit follows the
# farmers-market reference picture, nothing here is a product claim.
LOOKS = {
    "berry-blast": dict(
        seed=11, base=(0.84, 0.06, 0.24), light=(0.95, 0.42, 0.58), swirl=(0.22, 0.01, 0.09), speck=(0.07, 0.0, 0.03), specks=0.07,
        top=[("straw", 0.0155)] * 3 + [("black", 0.012)] * 5 + [("rasp", 0.0105)] * 8 + [("blue", 0.0075)] * 9,
        foot=[("straw", 0.019), ("straw", 0.0165), ("black", 0.0125), ("straw", 0.0175), ("black", 0.012), ("rasp", 0.011), ("rasp", 0.0105),
              ("blue", 0.008), ("blue", 0.0075), ("blue", 0.0078), ("blue", 0.0072), ("black", 0.0115)],
    ),
    "blue-rush": dict(
        seed=23, base=(0.24, 0.22, 0.72), light=(0.50, 0.50, 0.90), swirl=(0.05, 0.03, 0.30), speck=(0.02, 0.01, 0.10), specks=0.07,
        top=[("blue", 0.0082)] * 14 + [("blue", 0.0074)] * 34,
        foot=[("blue", 0.0085), ("blue", 0.008), ("blue", 0.0078), ("blue", 0.0082), ("blue", 0.0075), ("blue", 0.008), ("blue", 0.0072),
              ("blue", 0.0078), ("blue", 0.0083), ("blue", 0.0074), ("blue", 0.008), ("blue", 0.0076), ("blue", 0.0079), ("blue", 0.0073)],
    ),
    "mango-madness": dict(
        seed=37, base=(1.0, 0.47, 0.0), light=(1.0, 0.63, 0.06), swirl=(0.95, 0.28, 0.0), speck=(0.9, 0.2, 0.0), specks=0.015,
        top=[("mango", 0.0115)] * 12 + [("mango", 0.010)] * 14,
        foot=[("mango", 0.013), ("mango", 0.012), ("mango", 0.0115), ("mango", 0.0125), ("mango", 0.011), ("mango", 0.012), ("mango", 0.0105),
              ("mango", 0.0115), ("mango", 0.011)],
    ),
    "tropical-mix": dict(
        seed=53, base=(1.0, 0.22, 0.08), light=(1.0, 0.45, 0.22), swirl=(0.88, 0.08, 0.03), speck=(0.5, 0.02, 0.02), specks=0.03,
        top=[("straw", 0.015)] * 2 + [("pine", 0.0125)] * 9 + [("mango", 0.010)] * 4,
        foot=[("straw", 0.018), ("pine", 0.014), ("pine", 0.013), ("straw", 0.0165), ("pine", 0.0125), ("mango", 0.0115), ("pine", 0.012),
              ("mango", 0.011)],
    ),
}
LOOK = LOOKS[FLAVOUR]
rnd = random.Random(LOOK["seed"])

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# ------------------------------------------------------------------ the cup, in metres
H, RB, RT, WALL = 0.112, 0.0375, 0.0478, 0.0007
FILL = 0.92 * H


def smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def r_out(z):
    t = z / H
    return RB + (RT - RB) * t + 0.0011 * smooth((t - 0.80) / 0.03)


def linspace(a, b, n):
    return [a + (b - a) * i / (n - 1) for i in range(n)]


# ------------------------------------------------------------------ mesh helpers
def lathe(profile, segs=128):
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        if r < 1e-7:
            rings.append([bm.verts.new((0, 0, z))])
        else:
            rings.append([bm.verts.new((r * cos(2 * pi * i / segs), r * sin(2 * pi * i / segs), z)) for i in range(segs)])
    for a, b in zip(rings, rings[1:]):
        for i in range(segs):
            j = (i + 1) % segs
            if len(a) == 1 and len(b) == 1:
                continue
            if len(a) == 1:
                bm.faces.new((a[0], b[j], b[i]))
            elif len(b) == 1:
                bm.faces.new((a[i], a[j], b[0]))
            else:
                bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    return bm


def to_mesh(bm, name, mats=(), sharp=None):
    if sharp is not None:
        edges = [e for e in bm.edges if len(e.link_faces) == 2 and e.calc_face_angle() > sharp]
        bmesh.ops.split_edges(bm, edges=edges)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    me.polygons.foreach_set("use_smooth", [True] * len(me.polygons))
    return me


def place(me, name, loc=(0, 0, 0), rot=(0, 0, 0), scale=1.0, subsurf=0):
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = rot
    ob.scale = (scale,) * 3 if isinstance(scale, (int, float)) else scale
    if subsurf:
        mod = ob.modifiers.new("sub", "SUBSURF")
        mod.levels = mod.render_levels = subsurf
    return ob


def append(bm, me, matrix, mat_index=0):
    """Add a copy of mesh `me` to `bm`, transformed, with the given material slot."""
    nv, nf = len(bm.verts), len(bm.faces)
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    for v in bm.verts[nv:]:
        v.co = matrix @ v.co
    for f in bm.faces[nf:]:
        f.material_index = mat_index


def ico_mesh(subdiv=2):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=1.0)
    return to_mesh(bm, "ico")


def trs(loc, rot=None, scale=(1, 1, 1)):
    m = Matrix.Translation(loc)
    if rot is not None:
        m = m @ (rot if isinstance(rot, Matrix) else Euler(rot).to_matrix().to_4x4())
    return m @ Matrix.Diagonal((*scale, 1))


# ------------------------------------------------------------------ material helpers
def material(name, color=(0.8, 0.8, 0.8), rough=0.4, sss=0.0, sss_radius=(1, 0.4, 0.2), sss_scale=0.004, **extra):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = next((n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"), None)
    if b is None:
        b = nt.nodes.new("ShaderNodeBsdfPrincipled")
        o = nt.nodes.new("ShaderNodeOutputMaterial")
        nt.links.new(b.outputs[0], o.inputs[0])
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Subsurface Weight"].default_value = sss
    b.inputs["Subsurface Radius"].default_value = sss_radius
    b.inputs["Subsurface Scale"].default_value = sss_scale
    for k, v in extra.items():
        b.inputs[k].default_value = v
    return m, nt, b


def node(nt, kind, **props):
    n = nt.nodes.new(kind)
    for k, v in props.items():
        if k in n.inputs:
            n.inputs[k].default_value = v
        else:
            setattr(n, k, v)
    return n


def mix(nt, fac, a, b):
    """Colour mix; fac, a, b are sockets or constants."""
    n = nt.nodes.new("ShaderNodeMix")
    n.data_type = "RGBA"
    for sock, val in ((n.inputs[0], fac), (n.inputs[6], a), (n.inputs[7], b)):
        if isinstance(val, bpy.types.NodeSocket):
            nt.links.new(val, sock)
        elif isinstance(val, (int, float)):
            sock.default_value = val
        else:
            sock.default_value = (*val, 1)
    return n.outputs[2]


def math_node(nt, op, a, b=None):
    n = nt.nodes.new("ShaderNodeMath")
    n.operation = op
    for sock, val in ((n.inputs[0], a), (n.inputs[1], b)):
        if val is None:
            continue
        if isinstance(val, bpy.types.NodeSocket):
            nt.links.new(val, sock)
        else:
            sock.default_value = val
    return n.outputs[0]


def ramp(nt, fac, stops):
    n = nt.nodes.new("ShaderNodeValToRGB")
    els = n.color_ramp.elements
    els.remove(els[1])
    for k, (pos, col) in enumerate(stops):
        e = els[0] if k == 0 else els.new(pos)
        e.position = pos
        e.color = (*col, 1)
    nt.links.new(fac, n.inputs[0])
    return n.outputs[0]


def bump(nt, bsdf, height, strength=0.2, distance=0.001):
    n = node(nt, "ShaderNodeBump", Strength=strength, Distance=distance)
    nt.links.new(height, n.inputs["Height"])
    nt.links.new(n.outputs[0], bsdf.inputs["Normal"])


def obj_coords(nt):
    return nt.nodes.new("ShaderNodeTexCoord").outputs["Object"]


G = lambda v: (v, v, v)

# ------------------------------------------------------------------ cup
def build_cup():
    R = r_out(H)
    prof = [(0, 0), (RB - 0.004, 0), (RB - 0.0012, 0.0003), (RB, 0.0016)]
    prof += [(r_out(z), z) for z in linspace(0.004, H - 0.003, 64)]
    prof += [(R + 0.0010, H - 0.0022), (R + 0.0019, H - 0.0012), (R + 0.0021, H), (R + 0.0016, H + 0.0010), (R + 0.0006, H + 0.0013), (R - WALL, H + 0.0008)]
    prof += [(r_out(z) - WALL, z) for z in linspace(H - 0.002, 0.004, 64)]
    prof += [(r_out(0.0025) - WALL, 0.0025), (RB - 0.004, 0.0012), (0, 0.0012)]
    m, nt, b = material("cup", (1, 1, 1), 0.03, **{"Transmission Weight": 1.0, "IOR": 1.45})
    # a little haze, as on a cold PET cup
    n = node(nt, "ShaderNodeTexNoise", Scale=140.0, Detail=3.0)
    nt.links.new(obj_coords(nt), n.inputs["Vector"])
    nt.links.new(ramp(nt, n.outputs[0], [(0.35, G(0.02)), (0.75, G(0.11))]), b.inputs["Roughness"])
    return place(to_mesh(lathe(prof), "cup", [m]), "cup", subsurf=1)


def build_smoothie():
    RF = r_out(FILL) - WALL * 0.5
    prof = [(0, 0.0009), (RB - 0.004, 0.0009)]
    prof += [(r_out(z) - WALL * 0.5, z) for z in linspace(0.003, FILL, 50)]
    prof += [(RF * (1 - k / 22), FILL + 0.010 * (1 - (1 - k / 22) ** 2)) for k in range(1, 23)]
    bm = lathe(prof)
    for v in bm.verts:
        if v.co.z > FILL + 1e-5:
            r = min(1.0, sqrt(v.co.x ** 2 + v.co.y ** 2) / RF)
            v.co.z += 0.0035 * noise.noise(Vector((v.co.x * 70, v.co.y * 70, LOOK["seed"]))) * sqrt(1 - r * r)

    m, nt, b = material("smoothie", LOOK["base"], 0.38, sss=0.3, sss_radius=LOOK["light"], sss_scale=0.004)
    co = obj_coords(nt)
    warp = node(nt, "ShaderNodeTexNoise", Scale=22.0, Detail=2.0)
    nt.links.new(co, warp.inputs["Vector"])
    off = node(nt, "ShaderNodeVectorMath", operation="SCALE")
    off.inputs["Scale"].default_value = 0.05
    nt.links.new(warp.outputs[1], off.inputs[0])
    add = node(nt, "ShaderNodeVectorMath", operation="ADD")
    nt.links.new(co, add.inputs[0])
    nt.links.new(off.outputs[0], add.inputs[1])
    # streaks of puree folded through the drink
    wave = node(nt, "ShaderNodeTexWave", Scale=17.0, Distortion=4.5, Detail=1.5)
    wave.wave_type, wave.bands_direction = "BANDS", "DIAGONAL"
    wave.inputs["Detail Scale"].default_value = 0.9
    nt.links.new(add.outputs[0], wave.inputs["Vector"])
    streak = ramp(nt, wave.outputs[1], [(0.38, G(0)), (0.80, G(1))])
    patch = node(nt, "ShaderNodeTexNoise", Scale=19.0, Detail=4.0)
    nt.links.new(add.outputs[0], patch.inputs["Vector"])
    streak = math_node(nt, "MULTIPLY", streak, ramp(nt, patch.outputs[0], [(0.40, G(0.0)), (0.66, G(1))]))
    cream = node(nt, "ShaderNodeTexNoise", Scale=48.0, Detail=5.0)
    nt.links.new(co, cream.inputs["Vector"])
    col = mix(nt, ramp(nt, cream.outputs[0], [(0.42, G(0)), (0.70, G(0.75))]), LOOK["base"], LOOK["light"])
    col = mix(nt, streak, col, LOOK["swirl"])
    # flecks of skin and seed
    vor = node(nt, "ShaderNodeTexVoronoi", Scale=850.0)
    nt.links.new(co, vor.inputs["Vector"])
    sep = nt.nodes.new("ShaderNodeSeparateColor")
    nt.links.new(vor.outputs[1], sep.inputs[0])
    fleck = math_node(nt, "MULTIPLY", math_node(nt, "LESS_THAN", sep.outputs[0], LOOK["specks"]), math_node(nt, "LESS_THAN", vor.outputs[0], 0.34))
    col = mix(nt, fleck, col, LOOK["speck"])
    nt.links.new(col, b.inputs["Base Color"])
    grain = node(nt, "ShaderNodeTexNoise", Scale=900.0, Detail=2.0)
    nt.links.new(co, grain.inputs["Vector"])
    bump(nt, b, grain.outputs[0], 0.25, 0.0004)
    return place(to_mesh(bm, "smoothie", [m]), "smoothie")


def build_mark():
    """The RUS RUSS mark, printed white on the front of the cup."""
    img = bpy.data.images.load(os.path.join(OUT, "tex", "wordmark-stacked-white.png"))
    aspect = img.size[0] / img.size[1]
    width = 0.045
    zc, hh = 0.52 * H, width / aspect / 2
    half = (width / 2) / r_out(zc)
    NU, NV = 48, 24
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    grid = [[None] * (NU + 1) for _ in range(NV + 1)]
    for j in range(NV + 1):
        z = zc - hh + 2 * hh * j / NV
        r = r_out(z) + 0.00018
        for i in range(NU + 1):
            a = -half + 2 * half * i / NU
            grid[j][i] = bm.verts.new((r * sin(a), -r * cos(a), z))
    for j in range(NV):
        for i in range(NU):
            f = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
            for loop, (u, v) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                loop[uv].uv = (u / NU, v / NV)
    m, nt, b = material("mark", (1, 1, 1), 0.45)
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    tex.extension = "CLIP"
    nt.links.new(math_node(nt, "MULTIPLY", tex.outputs["Alpha"], 0.96), b.inputs["Alpha"])
    return place(to_mesh(bm, "mark", [m]), "mark")


def build_droplets():
    """Condensation on the outside of the cup."""
    ico = ico_mesh(2)
    bm = bmesh.new()
    for _ in range(650):
        a = rnd.uniform(-2.2, 2.2)
        z = rnd.uniform(0.005, 0.87 * H)
        s = min(0.0009, 0.00020 * exp(rnd.gauss(0, 0.6)))
        r = r_out(z) - s * 0.12
        n, t = Vector((sin(a), -cos(a), 0)), Vector((cos(a), sin(a), 0))
        basis = Matrix((t, Vector((0, 0, 1)), n)).transposed().to_4x4()
        append(bm, ico, trs((r * sin(a), -r * cos(a), z), basis, (s, s * (1.0 + 300 * s), s * 0.55)))
    m, _, _ = material("water", (1, 1, 1), 0.0, **{"Transmission Weight": 1.0, "IOR": 1.33})
    return place(to_mesh(bm, "droplets", [m]), "droplets")


# ------------------------------------------------------------------ fruit (unit size, scaled when placed)
def blueberry_mesh():
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=48, v_segments=28, radius=1.0)
    for v in bm.verts:
        p = v.co
        a = math.acos(max(-1.0, min(1.0, p.z / p.length)))
        if a < 0.7:
            star = 0.5 + 0.5 * cos(5 * math.atan2(p.y, p.x))
            v.co.z += -0.17 * smooth(1 - a / 0.30) + 0.055 * star * exp(-((a - 0.34) / 0.07) ** 2)
        v.co.z *= 0.86
    m, nt, b = material("blueberry", (0.02, 0.03, 0.10), 0.5, sss=0.05, sss_radius=(0.3, 0.2, 0.6))
    co = obj_coords(nt)
    n = node(nt, "ShaderNodeTexNoise", Scale=2.2, Detail=6.0, Roughness=0.65)
    nt.links.new(co, n.inputs["Vector"])
    bloom = ramp(nt, n.outputs[0], [(0.34, G(0)), (0.72, G(1))])
    nt.links.new(mix(nt, bloom, (0.018, 0.022, 0.085), (0.20, 0.26, 0.48)), b.inputs["Base Color"])
    nt.links.new(ramp(nt, n.outputs[0], [(0.34, G(0.3)), (0.72, G(0.62))]), b.inputs["Roughness"])
    return to_mesh(bm, "blueberry", [m])


def drupe_mesh(name, count, rad, color, rough, sss, seed):
    """Raspberries and blackberries: beads packed on a core."""
    r = random.Random(seed)
    ico = ico_mesh(2)
    bm = bmesh.new()
    append(bm, ico, trs((0, 0, 0), None, (0.62, 0.62, 0.8)))
    golden = pi * (3 - sqrt(5))
    for i in range(count):
        z = 1 - 2 * (i + 0.5) / count
        ring = sqrt(1 - z * z) * (0.74 + 0.12 * (z + 1) / 2)
        a = i * golden + r.uniform(-0.12, 0.12)
        s = rad * r.uniform(0.88, 1.12)
        append(bm, ico, trs((ring * cos(a), ring * sin(a), z * 0.86), None, (s, s, s)))
    m, nt, b = material(name, color, rough, sss=sss, sss_radius=(1.0, 0.25, 0.2), sss_scale=0.003, **{"Coat Weight": 0.12})
    n = node(nt, "ShaderNodeTexNoise", Scale=1.6, Detail=2.0)
    nt.links.new(obj_coords(nt), n.inputs["Vector"])
    dark = tuple(c * 0.45 for c in color)
    nt.links.new(mix(nt, ramp(nt, n.outputs[0], [(0.35, G(0)), (0.7, G(1))]), dark, color), b.inputs["Base Color"])
    return to_mesh(bm, name, [m])


def strawberry_mesh():
    def prof(u):
        return 0.8 * sin(pi * u ** 1.8) ** 0.8, -1 + 1.75 * u

    rings, segs = 96, 128
    bm = lathe([prof(i / rings) for i in range(rings + 1)], segs)
    seeds, normals = [], []
    row = 0
    u = 0.10
    while u < 0.93:
        r, z = prof(u)
        (r2, z2), (r1, z1) = prof(u + 0.004), prof(u - 0.004)
        count = max(3, int(2 * pi * r / 0.2))
        for k in range(count):
            a = 2 * pi * (k + 0.5 * (row % 2)) / count + random.Random(row * 31 + k).uniform(-0.05, 0.05)
            n = Vector(((z2 - z1) * cos(a), (z2 - z1) * sin(a), -(r2 - r1))).normalized()
            seeds.append(Vector((r * cos(a), r * sin(a), z)))
            normals.append(n)
        u += 0.078
        row += 1
    tree = KDTree(len(seeds))
    for i, p in enumerate(seeds):
        tree.insert(p, i)
    tree.balance()
    for v in bm.verts:
        _, i, d = tree.find(v.co)
        v.co -= normals[i] * 0.045 * exp(-(d / 0.06) ** 2)
    ico = ico_mesh(1)
    for p, n in zip(seeds, normals):
        rot = n.to_track_quat("Z", "Y").to_matrix().to_4x4()
        append(bm, ico, trs(p - n * 0.03, rot, (0.026, 0.04, 0.016)), 1)
    # calyx and stalk
    leaf = bmesh.new()
    cols = []
    for i in range(7):
        t = i / 6
        w = 0.15 * sin(pi * t ** 0.7) + 0.002
        zz = 0.07 * sin(pi * t) - 0.22 * t * t
        cols.append([leaf.verts.new((t * 0.62, -w, zz)), leaf.verts.new((t * 0.62, 0, zz + 0.03 * sin(pi * t))), leaf.verts.new((t * 0.62, w, zz))])
    for a, b2 in zip(cols, cols[1:]):
        leaf.faces.new((a[0], b2[0], b2[1], a[1]))
        leaf.faces.new((a[1], b2[1], b2[2], a[2]))
    leaf_me = to_mesh(leaf, "calyx-leaf")
    lr = random.Random(5)
    for k in range(9):
        rot = Euler((lr.uniform(-0.2, 0.2), lr.uniform(-0.05, 0.3), 2 * pi * k / 9 + lr.uniform(-0.15, 0.15))).to_matrix().to_4x4()
        s = lr.uniform(0.8, 1.1)
        append(bm, leaf_me, trs((0, 0, 0.745), rot, (s, s, s)), 2)
    stalk = bmesh.new()
    bmesh.ops.create_cone(stalk, cap_ends=True, segments=10, radius1=0.04, radius2=0.03, depth=0.3)
    append(bm, to_mesh(stalk, "stalk"), trs((0, 0, 0.88), (0.15, 0.1, 0)), 2)

    red, nt, b = material("strawberry", (0.72, 0.02, 0.02), 0.22, sss=0.25, sss_radius=(1.0, 0.2, 0.1), sss_scale=0.003, **{"Coat Weight": 0.4})
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(obj_coords(nt), sep.inputs[0])
    n = node(nt, "ShaderNodeTexNoise", Scale=1.5, Detail=2.0)
    nt.links.new(obj_coords(nt), n.inputs["Vector"])
    body = mix(nt, n.outputs[0], (0.80, 0.03, 0.02), (0.55, 0.01, 0.02))
    shoulder = ramp(nt, sep.outputs[2], [(0.50, G(0)), (0.76, G(0.75))])
    nt.links.new(mix(nt, shoulder, body, (0.85, 0.42, 0.22)), b.inputs["Base Color"])
    seed, _, _ = material("strawberry-seed", (0.75, 0.55, 0.16), 0.4)
    green, _, _ = material("calyx", (0.10, 0.32, 0.04), 0.5, sss=0.1, sss_radius=(0.4, 1.0, 0.2), sss_scale=0.001)
    return to_mesh(bm, "strawberry", [red, seed, green])


def chunk_mesh(name, color, deep, taper=False, seed=1):
    """A cut cube of fruit: mango, or a wedge of pineapple."""
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=2.0)
    bmesh.ops.bevel(bm, geom=bm.edges[:], offset=0.2, segments=3, profile=0.5, affect="EDGES")
    bmesh.ops.subdivide_edges(bm, edges=bm.edges[:], cuts=3, use_grid_fill=True)
    for v in bm.verts:
        p = v.co.copy()
        v.co += p.normalized() * 0.09 * noise.noise(p * 1.1 + Vector((seed, 0, 0)))
        if taper:
            v.co.x *= 0.42 + 0.58 * (p.y + 1) / 2
            v.co.z *= 0.6
    m, nt, b = material(name, color, 0.22, sss=0.2, sss_radius=(1.0, 0.6, 0.15), sss_scale=0.004, **{"Coat Weight": 0.6, "Coat Roughness": 0.08})
    co = obj_coords(nt)
    mp = nt.nodes.new("ShaderNodeMapping")
    mp.inputs["Scale"].default_value = (9.0, 1.2, 9.0) if taper else (2.5, 2.5, 7.0)
    nt.links.new(co, mp.inputs["Vector"])
    n = node(nt, "ShaderNodeTexNoise", Scale=1.6, Detail=4.0)
    nt.links.new(mp.outputs[0], n.inputs["Vector"])
    nt.links.new(mix(nt, ramp(nt, n.outputs[0], [(0.3, G(0)), (0.75, G(1))]), deep, color), b.inputs["Base Color"])
    bump(nt, b, n.outputs[0], 0.5 if taper else 0.3, 0.06)
    return to_mesh(bm, name, [m])


def orange_mesh(half=False):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=96, radius1=1.0, radius2=1.0, depth=0.11)
    if half:
        res = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 1, 0), clear_outer=True)
        bmesh.ops.holes_fill(bm, edges=[e for e in res["geom_cut"] if isinstance(e, bmesh.types.BMEdge)])
    m, nt, b = material("orange", (1.0, 0.4, 0.0), 0.2, sss=0.12, sss_radius=(1.0, 0.5, 0.1), sss_scale=0.003)
    co = obj_coords(nt)
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(co, sep.inputs[0])
    r = math_node(nt, "SQRT", math_node(nt, "ADD", math_node(nt, "POWER", sep.outputs[0], 2.0), math_node(nt, "POWER", sep.outputs[1], 2.0)))
    ang = math_node(nt, "ARCTAN2", sep.outputs[1], sep.outputs[0])
    spoke = math_node(nt, "ABSOLUTE", math_node(nt, "SINE", math_node(nt, "MULTIPLY", ang, 5.0)))
    # membranes get thinner on screen toward the rind, so widen the angle test near the centre
    membrane = math_node(nt, "LESS_THAN", math_node(nt, "MULTIPLY", spoke, r), 0.07)
    cells = node(nt, "ShaderNodeTexVoronoi", Scale=24.0)
    nt.links.new(co, cells.inputs["Vector"])
    pulp = mix(nt, ramp(nt, cells.outputs[0], [(0.05, G(0)), (0.55, G(1))]), (1.0, 0.33, 0.0), (0.95, 0.14, 0.0))
    pith = (1.0, 0.72, 0.36)
    flesh = mix(nt, membrane, pulp, pith)
    bands = ramp(nt, r, [(0.0, G(1)), (0.07, G(1)), (0.10, G(0)), (0.83, G(0)), (0.86, G(1)), (0.90, G(1))])
    col = mix(nt, bands, flesh, pith)
    rind = ramp(nt, r, [(0.915, G(0)), (0.935, G(1))])
    col = mix(nt, rind, col, (1.0, 0.33, 0.0))
    nt.links.new(col, b.inputs["Base Color"])
    bump(nt, b, cells.outputs[0], 0.5, 0.0012)

    return to_mesh(bm, "orange-half" if half else "orange", [m], sharp=radians(40))


def mint_mesh():
    def leaf_bm():
        bm = bmesh.new()
        NU, NV = 40, 12
        g = [[None] * (NV + 1) for _ in range(NU + 1)]
        for i in range(NU + 1):
            u = i / NU
            w = 0.40 * sin(pi * u ** 0.7) ** 0.75
            for j in range(NV + 1):
                v = -1 + 2 * j / NV
                edge = 1 + (0.035 * sin(u * 60) if abs(v) == 1 else 0)
                z = 0.10 * abs(v) ** 1.5 * w * 2 - 0.22 * u * u + 0.008 * sin(u * 30) * abs(v) * (1 - abs(v)) * 4
                g[i][j] = bm.verts.new((u, v * w * edge, z))
        for i in range(NU):
            for j in range(NV):
                bm.faces.new((g[i][j], g[i + 1][j], g[i + 1][j + 1], g[i][j + 1]))
        return bm

    leaf = to_mesh(leaf_bm(), "mint-leaf")
    bm = bmesh.new()
    lr = random.Random(3)
    for k, (size, pitch) in enumerate(((1.0, -0.9), (0.85, -0.6), (0.9, -0.75), (0.6, -1.25))):
        rot = Euler((lr.uniform(-0.3, 0.3), pitch, k * 2.2 + lr.uniform(-0.3, 0.3))).to_matrix().to_4x4()
        append(bm, leaf, trs((0, 0, 0), rot, (size,) * 3))
    m, nt, b = material("mint", (0.06, 0.26, 0.03), 0.38, sss=0.2, sss_radius=(0.4, 1.0, 0.2), sss_scale=0.001)
    co = obj_coords(nt)
    n = node(nt, "ShaderNodeTexNoise", Scale=3.0, Detail=2.0)
    nt.links.new(co, n.inputs["Vector"])
    nt.links.new(mix(nt, n.outputs[0], (0.03, 0.17, 0.02), (0.09, 0.32, 0.04)), b.inputs["Base Color"])
    # veins: a midrib, and side veins running out and forward from it
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(co, sep.inputs[0])
    ay = math_node(nt, "ABSOLUTE", sep.outputs[1])
    along = nt.nodes.new("ShaderNodeCombineXYZ")
    nt.links.new(math_node(nt, "SUBTRACT", sep.outputs[0], math_node(nt, "MULTIPLY", ay, 0.9)), along.inputs[0])
    veins = node(nt, "ShaderNodeTexWave", Scale=4.5, Distortion=0.0)
    veins.wave_type, veins.bands_direction = "BANDS", "X"
    nt.links.new(along.outputs[0], veins.inputs["Vector"])
    side = ramp(nt, veins.outputs[1], [(0.0, G(0)), (0.22, G(1))])
    rib = ramp(nt, ay, [(0.0, G(0)), (0.03, G(1))])
    bump(nt, b, math_node(nt, "MULTIPLY", side, rib), 0.22, 0.004)
    return to_mesh(bm, "mint", [m])


FRUIT = {
    # mesh, scale for a bounding radius of 1, sub-division, lies on its side
    "blue": (blueberry_mesh, 1.0, 1),
    "rasp": (lambda: drupe_mesh("raspberry", 96, 0.158, (0.62, 0.025, 0.07), 0.42, 0.3, 1), 1 / 1.08, 1),
    "black": (lambda: drupe_mesh("blackberry", 44, 0.245, (0.035, 0.012, 0.045), 0.16, 0.05, 2), 1 / 1.1, 1),
    "straw": (strawberry_mesh, 1 / 0.95, 0),
    "mango": (lambda: chunk_mesh("mango", (1.0, 0.53, 0.01), (1.0, 0.37, 0.0)), 1 / 1.25, 1),
    "pine": (lambda: chunk_mesh("pineapple", (1.0, 0.72, 0.08), (0.92, 0.50, 0.02), taper=True, seed=4), 1 / 1.1, 1),
}
_meshes = {}


def fruit(kind, loc, s, rot=None):
    make, unit, sub = FRUIT[kind]
    if kind not in _meshes:
        _meshes[kind] = make()
    if rot is None:
        if kind == "straw":
            rot = (radians(90 + rnd.uniform(-22, 22)), rnd.uniform(-0.4, 0.4), rnd.uniform(0, 2 * pi))
        elif kind == "blue":
            rot = (rnd.uniform(-1.3, 1.3), rnd.uniform(-1.3, 1.3), rnd.uniform(0, 2 * pi))
        else:
            rot = tuple(rnd.uniform(0, 2 * pi) for _ in range(3))
    k = s * unit
    scale = (k * rnd.uniform(0.85, 1.15), k * rnd.uniform(0.85, 1.15), k * rnd.uniform(0.8, 1.1)) if kind in ("mango", "pine") else k
    return place(_meshes[kind], kind, loc, rot, scale, sub)


def rest(placed, x, y, s, ground):
    """Height at which a ball of radius s comes to rest at (x, y) on the ground and on what is already there."""
    z = ground + s * 0.85
    for px, py, pz, ps in placed:
        d2 = (x - px) ** 2 + (y - py) ** 2
        reach = (s + ps) * 0.9
        if d2 < reach * reach:
            z = max(z, pz + sqrt(reach * reach - d2))
    return z


def heap(items, placed):
    """Fruit piled on top of the drink."""
    RF = r_out(FILL) - WALL
    for kind, s in sorted(items, key=lambda it: -it[1]):
        best = None
        for _ in range(40):
            r = (RF - 0.8 * s) * rnd.random() ** 0.8
            a = rnd.uniform(0, 2 * pi)
            x, y = r * cos(a), r * sin(a)
            z = rest(placed, x, y, s, FILL + 0.010 * (1 - (r / RF) ** 2) - 0.5 * s)
            if best is None or z < best[2]:
                best = (x, y, z)
        placed.append((*best, s))
        fruit(kind, best, s)


def scatter(items, placed):
    """Fruit on the table round the foot of the cup."""
    for n, (kind, s) in enumerate(items):
        side = -1 if n % 2 == 0 else 1
        best = None
        for _ in range(200):
            x = side * rnd.uniform(0.0, 0.099 - s)
            y = rnd.uniform(-0.072, 0.02)
            d = sqrt(x * x + y * y)
            if d < RB + s * 0.95 + 0.002 or (s > 0.011 and abs(x) < 0.05):
                continue
            z = rest(placed, x, y, s, 0.0)
            if s > 0.011 and z > s * 0.86:
                continue
            cost = z + 0.16 * d + (0.012 if abs(x) < 0.028 else 0)
            if best is None or cost < best[0]:
                best = (cost, x, y, z)
        if best:
            placed.append((*best[1:], s))
            fruit(kind, best[1:], s)


# ------------------------------------------------------------------ build
build_cup()
build_smoothie()
build_mark()
build_droplets()

top, foot = [], []
if FLAVOUR == "tropical-mix":
    # a wheel of orange stood in the drink, and slices on the table
    place(orange_mesh(), "orange-top", (0.014, 0.020, FILL + 0.020), (radians(78), radians(8), radians(-14)), 0.031)
    top += [(0.014, 0.020, FILL + 0.016, 0.016), (-0.004, 0.022, FILL + 0.016, 0.014), (0.032, 0.016, FILL + 0.016, 0.014)]
    place(orange_mesh(), "orange-lean", (0.071, -0.030, 0.0295), (radians(68), radians(4), radians(28)), 0.031)
    place(orange_mesh(half=True), "orange-flat", (-0.050, -0.058, 0.0018), (0, 0, radians(200)), 0.031)
    foot += [(0.071, -0.030, 0.02, 0.022), (0.060, -0.045, 0.012, 0.014), (0.085, -0.02, 0.012, 0.014), (-0.050, -0.070, -0.004, 0.02), (-0.066, -0.066, -0.004, 0.014), (-0.034, -0.066, -0.004, 0.014)]
heap(LOOK["top"], top)
scatter(LOOK["foot"], foot)

mint = mint_mesh()
if FLAVOUR in ("mango-madness", "blue-rush"):
    place(mint, "mint-top", (-0.012, -0.012, max(p[2] + p[3] for p in top) - 0.012), (0.1, 0.0, 0.6), 0.03)
place(mint, "mint-left", (-0.082, 0.022, 0.004), (0.0, 0.05, 2.6), 0.036)
if FLAVOUR != "tropical-mix":
    place(mint, "mint-right", (0.080, 0.026, 0.004), (0.0, 0.0, 0.3), 0.033)

# the table: catches shadows only, so the drink stands on the page
catcher = bmesh.new()
bmesh.ops.create_grid(catcher, x_segments=1, y_segments=1, size=1.5)
ground = place(to_mesh(catcher, "table"), "table", (0, 0, -0.0002))
ground.is_shadow_catcher = True
ground.hide_render = True  # the ground shadow is painted in tools/blender_post.py; the catcher greys the whole canvas

# ------------------------------------------------------------------ light: soft daylight, key upper left, white fill right, rim behind
def area(name, loc, target, size, watts, color=(1, 1, 1)):
    data = bpy.data.lights.new(name, "AREA")
    data.shape, data.size, data.energy, data.color = "DISK", size, watts, color
    ob = bpy.data.objects.new(name, data)
    scene.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
    return ob


mid = (0, 0, 0.07)
area("key", (-0.55, -0.55, 0.62), mid, 0.7, 15, (1.0, 0.98, 0.95))
area("fill", (0.70, -0.45, 0.22), mid, 0.9, 4.5)
area("rim", (0.22, 0.65, 0.42), mid, 0.5, 12)
area("top", (0.0, -0.05, 0.75), mid, 0.6, 3.5)

world = bpy.data.worlds.new("daylight")
world.use_nodes = True
bg = next((n for n in world.node_tree.nodes if n.type == "BACKGROUND"), None)
if bg is None:
    bg = world.node_tree.nodes.new("ShaderNodeBackground")
    world.node_tree.links.new(bg.outputs[0], world.node_tree.nodes.new("ShaderNodeOutputWorld").inputs[0])
bg.inputs[0].default_value = (0.93, 0.96, 1.0, 1)
bg.inputs[1].default_value = 0.3
scene.world = world

# ------------------------------------------------------------------ camera: straight on, 10 degrees down, long lens, registered to the canvas
W, HT = 1400, 1656
scene.render.resolution_x, scene.render.resolution_y, scene.render.resolution_percentage = W, HT, PERCENT
cam = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
scene.collection.objects.link(cam)
scene.camera = cam
aim = Vector((0, 0, 0.06))
cam.location = aim + 0.72 * Vector((0, -cos(radians(10)), sin(radians(10))))
cam.rotation_euler = (aim - cam.location).to_track_quat("-Z", "Y").to_euler()
cam.data.lens = 85
cam.data.clip_start, cam.data.clip_end = 0.05, 10


def ndc(p):
    bpy.context.view_layer.update()
    v = world_to_camera_view(scene, cam, Vector(p))
    return v.x, v.y


RIM_PX, FOOT = 590, (700, 1462)  # rim width and the foot of the cup on the canvas, as the pictures already on the site
R = r_out(H)
cam.data.lens *= (RIM_PX / W) / (ndc((R, 0, H))[0] - ndc((-R, 0, H))[0])
want = (FOOT[0] / W, 1 - FOOT[1] / HT)
x0, y0 = ndc((0, 0, 0))
cam.data.shift_x = cam.data.shift_y = 0.1
x1, y1 = ndc((0, 0, 0))
cam.data.shift_x = 0.1 * (want[0] - x0) / (x1 - x0)
cam.data.shift_y = 0.1 * (want[1] - y0) / (y1 - y0)
print("registered: lens %.1f mm, foot at" % cam.data.lens, [round(v, 4) for v in ndc((0, 0, 0))], "want", [round(v, 4) for v in want])

# ------------------------------------------------------------------ render
scene.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
cy = scene.cycles
cy.device = "GPU"
cy.samples = SAMPLES
cy.use_adaptive_sampling, cy.adaptive_threshold = True, 0.008
cy.use_denoising, cy.denoiser = True, "OPENIMAGEDENOISE"
cy.max_bounces, cy.transmission_bounces, cy.glossy_bounces, cy.transparent_max_bounces = 14, 14, 8, 24
cy.film_transparent_glass = True
scene.render.film_transparent = True
scene.view_settings.view_transform = "Khronos PBR Neutral"
scene.view_settings.look = "None"
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.color_depth = "8"
suffix = "" if PERCENT >= 200 else f"_{PERCENT}"
scene.render.filepath = os.path.join(OUT, "renders", f"{FLAVOUR}{suffix}.png")
os.makedirs(os.path.dirname(scene.render.filepath), exist_ok=True)
for im in bpy.data.images:
    if im.filepath:
        im.pack()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, f"{FLAVOUR}.blend"))
bpy.ops.render.render(write_still=True)
print("rendered", scene.render.filepath)
