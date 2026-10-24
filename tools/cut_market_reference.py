"""TEMPORARY artwork from the farmers-market reference (design/approved/farmers-market-reference.png).

The client's reference picture is the visual north star, so until production files arrive the
site uses the picture itself, cut into pieces:

  hero product   layers/<flavour>/4-hero.webp   rabbit + Berry Blast cup + fruit + splash (hero only)
  drink alone    layers/<flavour>/3-cup.webp    the four drinks from the stall (everywhere else)
  stills         stills/<flavour>.webp, drinks/<flavour>.webp, cards/<flavour>.webp
  market pieces  public/assets/market/*.webp    the "Juices" sign, the chalkboard, the blurred market edges

Known limits: the source is 1536 x 1024, so the hero product is enlarged about 1.8x and the
stall drinks about 4x (soft). Only Berry Blast exists as a hero picture; the other three are
the same picture with the smoothie and splash recoloured, and the strawberries at the foot
stay. Replace with real files per layers/README.md.

Run: python tools/cut_market_reference.py
"""
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

SRC = Image.open("design/approved/farmers-market-reference.png").convert("RGB")
W, H = SRC.size
rgb = np.asarray(SRC).astype(np.float32) / 255.0
hsv = np.asarray(SRC.convert("HSV")).astype(np.float32)
HUE, SAT, VAL = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
CANVAS = (1400, 1656)
STILL = (1980, 2340)


def polygon(points, blur=0.0, size=(W, H)):
    m = Image.new("L", size, 0)
    ImageDraw.Draw(m).polygon(points, fill=255)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


def boxes(rects, blur=0.0, value=255):
    m = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(m)
    for r in rects:
        d.rectangle(r, fill=value)
    return m.filter(ImageFilter.GaussianBlur(blur)) if blur else m


def arr(img):
    return np.asarray(img).astype(np.float32) / 255.0


def to_img(a):
    return Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), "L")


def save(img, path, quality=88):
    img.save(path, quality=quality, method=6)
    print(path)


def on_canvas(piece, size, width, bottom=None, cy=None, shadow=0.0):
    """Scale a cut-out to `width` and place it on a transparent canvas, centred horizontally.
    `shadow` adds a soft ground shadow under it, so it sits on the page instead of floating."""
    scale = width / piece.size[0]
    piece = piece.resize((round(piece.size[0] * scale), round(piece.size[1] * scale)), Image.LANCZOS)
    piece = piece.filter(ImageFilter.UnsharpMask(radius=2.0, percent=50, threshold=2))
    canvas = Image.new("RGBA", size, (255, 255, 255, 0))
    x = (size[0] - piece.size[0]) // 2
    y = size[1] - bottom - piece.size[1] if bottom is not None else round(cy - piece.size[1] / 2)
    if shadow:
        sh = Image.new("L", size, 0)
        w, h = piece.size
        ImageDraw.Draw(sh).ellipse((x + w * 0.12, y + h * 0.88, x + w * 0.88, y + h * 1.01), fill=round(255 * shadow))
        sh = sh.filter(ImageFilter.GaussianBlur(w * 0.03))
        tint = Image.new("RGBA", size, (28, 40, 64, 255))
        tint.putalpha(sh)
        canvas.alpha_composite(tint)
    canvas.alpha_composite(piece, (x, y))
    return canvas


# ---------------------------------------------------------------- 1. the hero product
# sky: pale, low saturation, blue-ish or white
sky = ((VAL > 0.85) & ((((HUE > 190) & (HUE < 228)) & (SAT < 0.36)) | (SAT < 0.07))).astype(np.float32)
sky = arr(to_img(sky).filter(ImageFilter.GaussianBlur(0.7)))
matte = 1 - sky
RABBIT = [(612, 92), (625, 84), (648, 92), (672, 120), (690, 170), (700, 215), (712, 200), (725, 130), (740, 80), (757, 62), (770, 68), (775, 110),
          (768, 180), (752, 230), (790, 240), (815, 275), (830, 320), (838, 360), (840, 410), (830, 440), (800, 470), (790, 520), (775, 560),
          (700, 575), (655, 560), (650, 480), (655, 400), (662, 350), (675, 320), (685, 270), (670, 240), (640, 200), (615, 150), (605, 115)]
CUP = [(833, 212), (1085, 232), (1090, 300), (1015, 522), (895, 527), (840, 505), (828, 300)]
STRAW = [(890, 58), (925, 60), (918, 206), (882, 202)]
force = ImageChops.lighter(polygon(CUP, 1.5), polygon(STRAW, 1.0))
region = boxes([(520, 48, 1268, 592)], 4)
# what is in that region but is not the product: page text and doodles, leaves, the nav
region = ImageChops.multiply(region, ImageChops.invert(boxes([(930, 62, 1030, 140), (933, 138, 972, 172), (1105, 345, 1245, 478), (1060, 370, 1098, 400), (1150, 495, 1180, 530),
                                                                (1195, 290, 1258, 342), (0, 0, W, 50), (1208, 380, W, 600), (470, 360, 560, 505), (470, 48, 590, 360),
                                                                (1055, 365, 1100, 405), (1140, 470, 1250, 540), (585, 258, 632, 410)], 1.5)))
alpha = np.maximum(matte * arr(region), arr(force))
# white parts of the product (the lettering on the hoodie, the light fur, the ice) read as sky
# pixel by pixel; only sky that connects to the outside is sky
hole = Image.fromarray(np.ascontiguousarray((alpha < 0.45).astype(np.uint8) * 255), "L").copy()
for seed in [(1200, 300), (600, 100), (1250, 570), (1000, 55), (560, 560), (700, 60), (1240, 60)]:
    if hole.getpixel(seed) == 255:
        ImageDraw.floodfill(hole, seed, 128)
outside = arr(Image.eval(hole, lambda v: 255 if v == 128 else 0).filter(ImageFilter.GaussianBlur(0.8)))
alpha = np.maximum(alpha, (1 - outside) * arr(region))
# the fruit at the foot sits on the awning: fade out over the last rows rather than cut
fade = np.ones((H, W), np.float32)
fade[578:594, :] = np.linspace(1, 0, 16)[:, None]
fade[594:, :] = 0
alpha = alpha * fade
hero = SRC.convert("RGBA")
hero.putalpha(to_img(alpha))
HERO_BOX = (520, 48, 1268, 594)
hero_piece = hero.crop(HERO_BOX)

# the other flavours: the smoothie and the splash change colour, nothing else
paint = ImageChops.lighter(polygon(CUP, 2), boxes([(1000, 48, 1268, 330)], 2))
paint = arr(paint.crop(HERO_BOX))


def recolour(piece, hue, sat=1.0, lift=1.0):
    h, s, v = [np.asarray(c).astype(np.float32) for c in piece.convert("RGB").convert("HSV").split()]
    hue360 = h * 360 / 255
    pink = ((hue360 > 285) | (hue360 < 14)) & (s > 60) & (paint > 0.5)
    h = np.where(pink, hue * 255.0 / 360.0, h)
    s = np.where(pink, np.clip(s * sat, 0, 255), s)
    v = np.where(pink, np.clip(v * lift, 0, 255), v)
    out = Image.merge("HSV", [Image.fromarray(c.astype(np.uint8), "L") for c in (h, s, v)]).convert("RGBA")
    out.putalpha(piece.getchannel("A"))
    return out


HERO = {
    "berry-blast": hero_piece,
    "blue-rush": recolour(hero_piece, 222, 1.05, 1.0),
    "mango-madness": recolour(hero_piece, 44, 1.1, 1.08),
    "tropical-mix": recolour(hero_piece, 22, 1.05, 1.04),
}
for fid, piece in HERO.items():
    # LIVE AGAIN (client decision, 5 October 2026): the hero is the rabbit and its drink exactly
    # as in the market picture, as one piece. The Blender hero (blender/make_hero.py) is archived.
    save(on_canvas(piece, CANVAS, 1340, cy=CANVAS[1] * 0.56, shadow=0.38), f"public/assets/hero/layers/{fid}/4-hero.webp")
    save(on_canvas(piece, STILL, 1900, cy=STILL[1] * 0.56, shadow=0.38), f"public/assets/hero/stills/{fid}.webp")

# ---------------------------------------------------------------- 2. the four drinks on the stall
# crop coordinates are in the full picture. cup: (rim left, rim right, base left, base right, fruit top, rim y, base y)
DRINKS = {
    "berry-blast": dict(box=(210, 700, 470, 922), cup=(290, 422, 310, 405, 708, 752, 916)),
    "blue-rush": dict(box=(505, 700, 715, 922), cup=(535, 660, 550, 650, 718, 760, 916)),
    "mango-madness": dict(box=(745, 700, 965, 922), cup=(790, 910, 805, 900, 718, 765, 916)),
    "tropical-mix": dict(box=(975, 700, 1230, 922), cup=(1015, 1150, 1030, 1135, 728, 765, 916)),
}
white = ((SAT < 0.08) & (VAL > 0.93)).astype(np.float32)
# the gingham: blue of any strength, or white
gingham = (((HUE > 195) & (HUE < 236) & (SAT > 0.12) & (VAL > 0.42)) | (white > 0)).astype(np.float32)
not_wall = 1 - arr(to_img(white).filter(ImageFilter.GaussianBlur(0.6)))
not_table = 1 - arr(to_img(gingham).filter(ImageFilter.GaussianBlur(0.6)))
table_top = 850  # above this line the drinks stand against the white wall; below it, on the cloth
bg = np.where(np.arange(H)[:, None] < table_top, not_wall, not_table)
DRINK = {}
for fid, spec in DRINKS.items():
    L, R, Lb, Rb, top, rim, base = spec["cup"]
    poly = polygon([(L - 3, rim), (L + 14, top), (R - 14, top), (R + 3, rim), (Rb + 3, base), (Lb - 3, base)], 1.5)
    # the fruit heaped at the foot: whatever is not wall or cloth, below the rim, inside the box
    foot = boxes([(spec["box"][0], rim + 60, spec["box"][2], spec["box"][3])], 2)
    a = np.maximum(arr(poly), bg * arr(foot) * arr(boxes([spec["box"]], 0)))
    # the fruit on the cloth is cut at the label line
    f2 = np.ones((H, W), np.float32)
    f2[912:922, :] = np.linspace(1, 0, 10)[:, None]
    f2[922:, :] = 0
    a = a * f2
    piece = SRC.convert("RGBA")
    piece.putalpha(to_img(a))
    piece = piece.crop(spec["box"])
    DRINK[fid] = piece
    # The drink-alone pictures (layers/<flavour>/3-cup, drinks/, cards/) are no longer taken
    # from here: they are rendered in Blender (blender/make_drink.py, tools/place_renders.py).

# ---------------------------------------------------------------- 3. market pieces
import os

os.makedirs("public/assets/market", exist_ok=True)
sign = SRC.convert("RGBA")
sign.putalpha(polygon([(183, 626), (443, 608), (447, 684), (178, 702)], 1.0))
save(sign.crop((170, 600, 455, 710)), "public/assets/market/sign-juices.webp")
board = SRC.convert("RGBA")
board.putalpha(polygon([(1276, 676), (1468, 666), (1474, 902), (1270, 910)], 1.0))
save(board.crop((1258, 655, 1486, 922)), "public/assets/market/chalkboard.webp")
# the blurred market edges, used as soft backgrounds with a fade in CSS
for name, box in {
    "edge-hero-left": (0, 50, 205, 592),
    "edge-hero-right": (1282, 60, W, 592),
    "edge-stall-left": (0, 594, 200, H),
    "edge-stall-right": (1330, 594, W, H),
}.items():
    save(SRC.crop(box).convert("RGBA"), f"public/assets/market/{name}.webp", quality=80)

# ---------------------------------------------------------------- 4. loose fruit, for the floating pieces
os.makedirs("public/assets/market/fruit", exist_ok=True)
not_sky = 1 - sky
LOOSE = {
    "blueberry-1": dict(box=(1118, 72, 1178, 132)),
    "blueberry-2": dict(box=(1148, 208, 1208, 272)),
    "strawberry": dict(box=(1020, 460, 1092, 538)),
    "blackberry": dict(box=(1092, 538, 1146, 582)),
    "leaf": dict(poly=[(590, 462), (600, 435), (622, 426), (646, 438), (650, 458), (636, 478), (612, 484), (594, 478)], keep="green"),
    "ice": dict(poly=[(962, 520), (992, 510), (1022, 528), (1018, 562), (982, 570), (960, 550)], keep="notpink"),
}
green = ((SAT > 0.2) & (HUE > 50) & (HUE < 170)).astype(np.float32)
notpink = 1 - (((HUE > 295) | (HUE < 16)) & (SAT > 0.35)).astype(np.float32)
for name, spec in LOOSE.items():
    if "poly" in spec:
        a = arr(polygon(spec["poly"], 1.0))
        if spec.get("keep") == "green":
            a = a * arr(to_img(green).filter(ImageFilter.GaussianBlur(0.8)))
        if spec.get("keep") == "notpink":
            a = a * arr(to_img(notpink).filter(ImageFilter.GaussianBlur(0.8)))
        xs, ys = zip(*spec["poly"])
        box = (min(xs) - 3, min(ys) - 3, max(xs) + 3, max(ys) + 3)
    else:
        box = spec["box"]
        a = not_sky * arr(boxes([box], 1.0))
    piece = SRC.convert("RGBA")
    piece.putalpha(to_img(a))
    piece = piece.crop(box)
    piece = piece.resize((piece.size[0] * 3, piece.size[1] * 3), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=2, percent=40, threshold=2))
    save(piece, f"public/assets/market/fruit/{name}.webp")

# the fruit in the bottom corner of the picture, out of focus: the first beat of the story
corner = SRC.crop((1332, 896, W, H)).resize((600, 376), Image.LANCZOS)
save(corner.convert("RGBA"), "public/assets/market/fruit-bokeh.webp", quality=82)
