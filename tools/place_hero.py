"""Puts the Blender hero renders (blender/out/hero-<flavour>-<pass>.png) into the site's layers.

  layers/<flavour>/4-hero.webp          the hero product          (budget 450 kB)
  layers/<flavour>/1-splash-back.webp   the splash, behind it     (budget 250 kB)
  layers/<flavour>/5-fruit-front.webp   fruit and ice at the foot (budget 250 kB)
  stills/<flavour>.webp                 everything flattened, with the rabbit, for first paint
                                        and for when 3D or motion is off (budget 600 kB)

The renders are made at 150% (2100 x 2484) and brought down to the 1400 x 1656 canvas here.
The rabbit layers come from tools/cut_rabbit.py (temporary).

Run: python tools/place_hero.py
"""
import io
import os
from PIL import Image

FLAVOURS = ["berry-blast", "blue-rush", "mango-madness", "tropical-mix"]
CANVAS, STILL = (1400, 1656), (1980, 2340)
ROOT = "public/assets/hero"
# which set of renders to place: RR_OUT=blender/out/v1 for the earlier set (the one live on the site)
OUT = os.environ.get("RR_OUT", "blender/out")


def save(img, path, budget_kb, quality=88):
    """WebP with alpha, stepping the quality down until it is inside its budget."""
    while True:
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=quality, method=6)
        if buf.tell() <= budget_kb * 1024 or quality <= 60:
            break
        quality -= 4
    with open(path, "wb") as f:
        f.write(buf.getvalue())
    print(f"{path}  {buf.tell() // 1024} kB  q{quality}")


rabbit_back = Image.open(f"{ROOT}/layers/shared/2-rabbit-back.webp").convert("RGBA")
rabbit_front = Image.open(f"{ROOT}/layers/shared/4-rabbit.webp").convert("RGBA")
for fid in FLAVOURS:
    passes = {p: Image.open(f"{OUT}/hero-{fid}-{p}.png").convert("RGBA") for p in ("product", "splash", "fruit")}
    os.makedirs(f"{ROOT}/layers/{fid}", exist_ok=True)
    small = {p: im.resize(CANVAS, Image.LANCZOS) for p, im in passes.items()}
    save(small["product"], f"{ROOT}/layers/{fid}/4-hero.webp", 450)
    save(small["splash"], f"{ROOT}/layers/{fid}/1-splash-back.webp", 250)
    save(small["fruit"], f"{ROOT}/layers/{fid}/5-fruit-front.webp", 250)
    still = Image.new("RGBA", STILL, (255, 255, 255, 0))
    for layer in (rabbit_back, passes["splash"], passes["product"], rabbit_front, passes["fruit"]):
        still.alpha_composite(layer.resize(STILL, Image.LANCZOS))
    save(still, f"{ROOT}/stills/{fid}.webp", 600, quality=86)
