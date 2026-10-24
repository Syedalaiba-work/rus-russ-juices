"""Before and after the Blender drink renders (tools/blender_drinks.py).

  python tools/blender_post.py tex               the stacked white RUS RUSS mark printed on the cup
  python tools/blender_post.py site [flavour..]  masters in design/blender/renders -> site files:
                                                 layers/<flavour>/3-cup.webp, drinks/<flavour>.webp, cards/<flavour>.webp
"""
import os
import sys

from PIL import Image, ImageChops, ImageDraw, ImageFilter

FLAVOURS = ["berry-blast", "blue-rush", "mango-madness", "tropical-mix"]
HERO = "public/assets/hero"
OUT = "design/blender"


def tex():
    # the official wordmark is one line: RUS (0..894) RUSS (970..2138) and the ringed R (2199..2390)
    src = Image.open(f"{HERO}/wordmark/wordmark-white.png").convert("RGBA")
    rus, russ, reg = src.crop((0, 0, 895, 439)), src.crop((970, 0, 2139, 439)), src.crop((2199, 0, 2391, 439))
    gap, pad = 70, 40
    w = russ.size[0] + 61 + reg.size[0] + pad * 2
    h = 439 * 2 + gap + pad * 2
    out = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    out.alpha_composite(rus, (pad, pad))
    out.alpha_composite(russ, (pad, pad + 439 + gap))
    out.alpha_composite(reg, (pad + russ.size[0] + 61, pad + 439 + gap))
    os.makedirs(f"{OUT}/tex", exist_ok=True)
    out.save(f"{OUT}/tex/wordmark-stacked-white.png")
    print(out.size)


def save(img, path, budget_kb):
    # written beside the target and swapped in, so a half-written file never reaches the site
    tmp = path + ".tmp"
    for q in (92, 90, 88, 85, 82, 78, 74):
        img.save(tmp, "WEBP", quality=q, method=6)
        if os.path.getsize(tmp) <= budget_kb * 1024:
            break
    os.replace(tmp, path)
    print(f"{path}  {img.size[0]}x{img.size[1]}  q{q}  {os.path.getsize(path) // 1024} kB")


def grounded(img):
    """Soft shadow on the table under the product, so it stands on the page instead of floating."""
    w, h = img.size
    alpha = img.getchannel("A")
    l, t, r, b = alpha.point(lambda v: 255 if v > 150 else 0).getbbox()
    # contact: the lowest part of the silhouette, blurred and slipped down a little
    foot = Image.new("L", (w, h), 0)
    band = (0, b - round(h * 0.07), w, b)
    foot.paste(alpha.crop(band), (0, band[1] + round(h * 0.006)))
    foot = foot.filter(ImageFilter.GaussianBlur(w * 0.008)).point(lambda v: v * 0.5)
    # and a wide, faint pool under the whole thing
    pool = Image.new("L", (w, h), 0)
    ImageDraw.Draw(pool).ellipse((l + (r - l) * 0.04, b - h * 0.05, r - (r - l) * 0.04, b - h * 0.004), fill=80)
    pool = pool.filter(ImageFilter.GaussianBlur(w * 0.011))
    shadow = Image.new("RGBA", (w, h), (28, 40, 64, 255))
    shadow.putalpha(ImageChops.lighter(foot, pool))
    out = Image.new("RGBA", (w, h), (255, 255, 255, 0))
    out.alpha_composite(shadow)
    out.alpha_composite(img)
    return out


def site(ids):
    for fid in ids:
        master = grounded(Image.open(f"{OUT}/renders/{fid}.png").convert("RGBA"))
        save(master.resize((1400, 1656), Image.LANCZOS), f"{HERO}/layers/{fid}/3-cup.webp", 450)
        save(master.resize((1980, 2340), Image.LANCZOS), f"{HERO}/drinks/{fid}.webp", 600)
        # card: the product alone, standing on the bottom edge
        solid = master.getchannel("A").point(lambda v: 255 if v > 150 else 0)
        l, t, r, b = solid.getbbox()
        piece = master.crop((l, t, r, min(master.size[1], b + 6)))
        scale = min(840 / piece.size[0], 880 / piece.size[1])
        piece = piece.resize((round(piece.size[0] * scale), round(piece.size[1] * scale)), Image.LANCZOS)
        card = Image.new("RGBA", (900, 900), (255, 255, 255, 0))
        card.alpha_composite(piece, ((900 - piece.size[0]) // 2, 900 - piece.size[1]))
        save(card, f"{HERO}/cards/{fid}.webp", 150)


if __name__ == "__main__":
    if sys.argv[1] == "tex":
        tex()
    else:
        site(sys.argv[2:] or FLAVOURS)
