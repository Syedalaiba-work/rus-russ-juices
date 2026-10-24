"""TEMPORARY artwork: lifts the hero product out of the approved Clean Classic picture.

The client wants the hero to be exactly the product in the picture: that rabbit, that cup,
that juice. The source files for it have not been supplied, so this cuts the product out of
the largest copy of the picture there is (design/approved/hero-tile-large.png) and writes it
as the cup layer for each flavour (public/assets/hero/layers/<flavour>/3-cup.webp).

Known limits, all because the source is a screenshot:
  - it is soft (the product is about 750 px wide in the picture);
  - the top of the left ear is outside the picture, so it is patched in from the small
    concept sheet, which is softer still;
  - the foot of the cup is hidden behind the flavour cards in the picture, so it fades out;
  - only Blue Rush exists as artwork. The other three are the same picture with the juice
    recoloured; the fruit in them is still blueberries.
Replace these files with real exported artwork (see layers/README.md) as soon as it exists.

Run: python tools/cut_concept_product.py
"""
import colorsys
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = Image.open("design/approved/hero-tile-large.png").convert("RGB")
SHEET = Image.open("design/approved/concept-sheet.png").convert("RGB")
W, H = SRC.size

# ---------------------------------------------------------------- outlines, in picture pixels
RABBIT = [
    (925, 96), (914, 40), (917, 0), (986, 0), (992, 40), (977, 92), (1000, 102), (1030, 90), (1080, 60), (1150, 38), (1212, 44),
    (1227, 76), (1202, 112), (1140, 132), (1070, 142), (1046, 140), (1061, 170), (1069, 200), (1063, 240), (1046, 262), (1021, 274),
    (1012, 286), (1022, 310), (1046, 336), (1066, 352), (1071, 396), (1056, 432), (1021, 450), (980, 447), (964, 420), (959, 392),
    (930, 386), (900, 377), (852, 386), (838, 397), (805, 387), (794, 352), (760, 347), (754, 320), (769, 280), (800, 245),
    (815, 226), (829, 216), (817, 190), (814, 160), (837, 140), (843, 100), (880, 94),
]
CUP = [(700, 382), (1140, 432), (1122, 520), (1076, 884), (726, 884), (706, 520)]
# things in the picture that belong to the page, not the product
NOT_PRODUCT = [(1098, 150, 1262, 372), (736, 76, 804, 142), (0, 0, 575, H), (540, 722, 652, 804)]
REGION = (560, 0, 1308, 886)


def polygon(points, blur=0.0):
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


# ---------------------------------------------------------------- the matte
rgb = np.asarray(SRC).astype(np.float32)
# how far each pixel is from the white of the background
ink = 255.0 - rgb.min(axis=2)
matte = np.clip((ink - 50.0) / 60.0, 0, 1) * 255.0
alpha = Image.fromarray(matte.astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(0.8))
alpha = ImageChops.lighter(alpha, polygon(RABBIT, 1.4))  # the rabbit is white: keep all of it
alpha = ImageChops.lighter(alpha, polygon(CUP, 3.0))  # and the whole of the cup, highlights included
keep = Image.new("L", (W, H), 0)
ImageDraw.Draw(keep).rectangle(REGION, fill=255)
for box in NOT_PRODUCT:
    ImageDraw.Draw(keep).rectangle(box, fill=0)
keep = ImageChops.lighter(keep.filter(ImageFilter.GaussianBlur(6)), polygon(RABBIT, 1.4))
alpha = ImageChops.multiply(alpha, keep)
# the foot of the cup runs behind the cards in the picture: let it fade rather than end in a line
fade = np.ones((H, W), np.float32)
fade[826:886, :] = np.linspace(1, 0, 60)[:, None]
fade[886:, :] = 0
alpha = Image.fromarray((np.asarray(alpha) * fade).astype(np.uint8), "L")

# ---------------------------------------------------------------- the missing ear tip
# Find where the big picture sits on the small sheet by matching the sunglasses.
def gray(img):
    return np.asarray(img.convert("L")).astype(np.float32)


tile = gray(SHEET.crop((0, 30, 520, 560)))
probe_box = (840, 96, 1072, 232)
best = None
for s in np.arange(0.36, 0.43, 0.004):
    t = gray(SRC.crop(probe_box).resize((round((probe_box[2] - probe_box[0]) * s), round((probe_box[3] - probe_box[1]) * s)), Image.LANCZOS))
    t -= t.mean()
    th, tw = t.shape
    for y in range(40, 140):
        for x in range(300, 380):
            win = tile[y : y + th, x : x + tw]
            score = ((win - win.mean() - t) ** 2).mean()
            if best is None or score < best[0]:
                best = (score, s, x, y)
_, s, tx, ty = best
print(f"aligned to the sheet at scale {s:.3f}")
PAD = 46  # picture pixels added above the top edge
sx = lambda x: tx + (x - probe_box[0]) * s
sy = lambda y: ty + 30 + (y - probe_box[1]) * s
ear_box = (900, -PAD, 1004, 14)
ear = SHEET.crop((round(sx(ear_box[0])), round(sy(ear_box[1])), round(sx(ear_box[2])), round(sy(ear_box[3])))).resize((ear_box[2] - ear_box[0], ear_box[3] - ear_box[1]), Image.LANCZOS)
ear_ink = 255.0 - np.asarray(ear).astype(np.float32).min(axis=2)
# the ear is white with a grey middle and a dark outline: everything inside the outline stays
ear_mask = Image.new("L", ear.size, 0)
ImageDraw.Draw(ear_mask).ellipse((10, 6, ear.size[0] - 12, ear.size[1] * 2), fill=255)
ear_alpha = ImageChops.lighter(Image.fromarray(np.clip((ear_ink - 30) / 50, 0, 1).astype(np.float32).__mul__(255).astype(np.uint8), "L"), ear_mask.filter(ImageFilter.GaussianBlur(3)))

full = Image.new("RGBA", (W, H + PAD), (255, 255, 255, 0))
pic = SRC.convert("RGBA")
pic.putalpha(alpha)
ear_rgba = ear.convert("RGBA")
ear_rgba.putalpha(ear_alpha)
full.paste(ear_rgba, (ear_box[0], 0))
full.alpha_composite(pic, (0, PAD))
rabbit_mask = Image.new("L", full.size, 0)
rabbit_mask.paste(polygon(RABBIT, 1.4), (0, PAD))
ImageDraw.Draw(rabbit_mask).rectangle((ear_box[0], 0, ear_box[2], PAD + 14), fill=255)

# ---------------------------------------------------------------- onto the layer canvas
CANVAS = (1400, 1656)
SCALE = 1.6
box = (REGION[0], 0, REGION[2], REGION[3] + PAD)
product = full.crop(box)
size = (round(product.size[0] * SCALE), round(product.size[1] * SCALE))
product = product.resize(size, Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.5, percent=55, threshold=2))
rabbit_big = rabbit_mask.crop(box).resize(size, Image.LANCZOS)
origin = ((CANVAS[0] - size[0]) // 2, 70)


def layer(img, path):
    canvas = Image.new("RGBA", CANVAS, (255, 255, 255, 0))
    canvas.alpha_composite(img, origin)
    canvas.save(path, quality=90, method=6)
    print(path)


# Blue Rush is the picture as it is. The others are the same picture with the juice turned:
# only bright, coloured pixels outside the rabbit are moved, so the dark berries, the black
# lettering and the rabbit's blue hoodie and shades stay as they are.
def recolour(img, hue, lift=1.0, satur=1.0):
    h, s_, v = [np.asarray(c).astype(np.float32) for c in img.convert("RGB").convert("HSV").split()]
    move = (s_ > 55) & (v > 120) & (np.asarray(rabbit_big) < 40)
    h = np.where(move, hue * 255.0, h)
    s_ = np.where(move, np.clip(s_ * satur, 0, 255), s_)
    v = np.where(move, np.clip(v * lift, 0, 255), v)
    out = Image.merge("HSV", [Image.fromarray(c.astype(np.uint8), "L") for c in (h, s_, v)]).convert("RGBA")
    out.putalpha(img.getchannel("A"))
    return out


layer(product, "public/assets/hero/layers/blue-rush/3-cup.webp")
layer(recolour(product, 350 / 360, 1.02, 1.1), "public/assets/hero/layers/berry-blast/3-cup.webp")
layer(recolour(product, 44 / 360, 1.06, 1.15), "public/assets/hero/layers/mango-madness/3-cup.webp")
layer(recolour(product, 20 / 360, 1.04, 1.12), "public/assets/hero/layers/tropical-mix/3-cup.webp")
