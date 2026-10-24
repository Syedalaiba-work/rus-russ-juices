"""TEMPORARY hero rabbit: lifted from the farmers-market concept picture, on its own layers.

The hero product is now rendered in Blender (blender/make_hero.py). The realistic rabbit has not
been authored yet, so the one in the concept picture is kept, cut away from the cup and the fruit
it was painted with, and registered to the same canvas:

  layers/shared/2-rabbit-back.webp   the rabbit, drawn BEHIND the cup
  layers/shared/4-rabbit.webp        its paw, drawn IN FRONT of the cup (it holds the cup)

It is soft (the concept is 1536 px wide) and it is not an original production character.
Replace both files with the authored rabbit (see layers/README.md).

Run: python tools/cut_rabbit.py
"""
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = Image.open("design/approved/farmers-market-reference.png").convert("RGB")
W, H = SRC.size
hsv = np.asarray(SRC.convert("HSV")).astype(np.float32)
HUE, SAT, VAL = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
CANVAS = (1400, 1656)
# how the concept sits on the canvas; nudged right so its cheek and arm tuck in behind the rendered cup
SCALE, ORIGIN, BOX0 = 1340 / 748, (58, 438 - 14), (520, 40)


def arr(img):
    return np.asarray(img).astype(np.float32) / 255.0


def to_img(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), "L")


def polygon(points, blur=0.0):
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


# sky that connects to the outside is background; pale parts of the rabbit are not
sky = ((VAL > 0.85) & ((((HUE > 190) & (HUE < 228)) & (SAT < 0.36)) | (SAT < 0.07))).astype(np.uint8) * 255
hole = Image.fromarray(np.ascontiguousarray(sky), "L").copy()
for seed in [(600, 100), (700, 60), (560, 300), (1200, 300)]:
    if hole.getpixel(seed) == 255:
        ImageDraw.floodfill(hole, seed, 128)
outside = arr(Image.eval(hole, lambda v: 255 if v == 128 else 0).filter(ImageFilter.GaussianBlur(0.8)))

REGION = [(596, 52), (800, 42), (832, 200), (845, 330), (850, 470), (835, 600), (590, 600), (596, 420), (640, 330), (600, 200)]
CUP = [(822, 206), (1085, 232), (1090, 300), (1015, 522), (895, 527), (828, 510), (816, 300)]
PAW = [(766, 394), (800, 382), (836, 390), (844, 420), (830, 448), (792, 454), (764, 432)]
# page lettering and doodles that fall inside the region
NOT = [(585, 258, 632, 410), (470, 360, 560, 505)]

hoodie = (HUE > 195) & (HUE < 233) & (SAT > 0.45) & (VAL > 0.28)
fur = (HUE > 10) & (HUE < 50) & (SAT > 0.12) & (SAT < 0.75) & (VAL > 0.3)
white_fur = (SAT < 0.16) & (VAL > 0.6)
own = arr(to_img((hoodie | fur | white_fur).astype(np.float32)).filter(ImageFilter.GaussianBlur(0.7)))

region = arr(polygon(REGION, 2))
for box in NOT:
    m = Image.new("L", (W, H), 0)
    ImageDraw.Draw(m).rectangle(box, fill=255)
    region = region * (1 - arr(m.filter(ImageFilter.GaussianBlur(1.5))))
body = (1 - outside) * region * (1 - arr(polygon(CUP, 1.2)))
# lower down the picture has fruit and a leaf in front of the rabbit: keep only what is rabbit
ys = np.arange(H)[:, None]
xs = np.arange(W)[None, :]
low = ((ys > 440) | ((ys > 412) & (xs < 662))).astype(np.float32)
body = body * (1 - low) + body * low * own
# below the hem of the hoodie the concept shows fruit, not rabbit: end it there, softly.
# The fruit heap rendered in Blender stands in front of this edge.
hem = np.clip((468 - ys) / 12.0, 0, 1) * np.ones((1, W), np.float32)
body = body * hem
# the berry tucked by its ear is not part of it
only_fur = arr(to_img(fur.astype(np.float32)).filter(ImageFilter.GaussianBlur(0.7)))
berry = np.zeros((H, W), np.float32)
berry[166:232, 780:840] = 1
body = body * (1 - berry * (1 - only_fur * (xs < 800)))
# nor is any of the concept's pink cup that the outline let through
pink = (((HUE > 295) | (HUE < 9)) & (SAT > 0.35) & (xs > 796)).astype(np.float32)
body = body * (1 - arr(to_img(pink).filter(ImageFilter.GaussianBlur(1.0))))

paw = arr(polygon(PAW, 1.2)) * arr(to_img(fur.astype(np.float32)).filter(ImageFilter.GaussianBlur(0.7)))
body = np.maximum(body * (1 - arr(polygon(PAW, 1.0))), 0)


def layer(alpha, path):
    piece = SRC.convert("RGBA")
    piece.putalpha(to_img(alpha))
    piece = piece.crop((BOX0[0], BOX0[1], BOX0[0] + 748, BOX0[1] + 554))
    size = (round(748 * SCALE), round(554 * SCALE))
    piece = piece.resize(size, Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2.0, percent=50, threshold=2))
    canvas = Image.new("RGBA", CANVAS, (255, 255, 255, 0))
    canvas.alpha_composite(piece, ORIGIN)
    canvas.save(path, quality=88, method=6)
    print(path)


layer(body, "public/assets/hero/layers/shared/2-rabbit-back.webp")
layer(paw, "public/assets/hero/layers/shared/4-rabbit.webp")
