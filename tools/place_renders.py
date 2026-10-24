"""Puts the Blender drink renders (blender/out/<flavour>.png) on the site's canvases.

  layers/<flavour>/3-cup.webp   1400 x 1656   the drink alone, for the 3D scene
  drinks/<flavour>.webp         1980 x 2340   the drink alone, as a still (stage, tour)
  cards/<flavour>.webp          900 x 900     the small picture on the stall and in the story

The hero picture (rabbit and cup, layers/<flavour>/4-hero.webp and stills/) still comes from
tools/cut_market_reference.py: Blender does not make the rabbit.

Run: python tools/place_renders.py
"""
import os
import numpy as np
from PIL import Image

# which set of renders to place: RR_OUT=blender/out/v1 for the earlier set (the one live on the site)
OUT = os.environ.get("RR_OUT", "blender/out")
FLAVOURS = ["berry-blast", "blue-rush", "mango-madness", "tropical-mix"]


def trimmed(img):
    """Crop to what is really there. The soft ground shadow fades for a long way; ignore its tail."""
    a = np.asarray(img.getchannel("A"))
    ys, xs = np.where(a > 240)  # the product itself; the shadow is never this opaque
    solid = (xs.min(), ys.min(), xs.max(), ys.max())
    pad_x = int((solid[2] - solid[0]) * 0.07)
    pad_bottom = int((solid[3] - solid[1]) * 0.05)
    box = (max(0, solid[0] - pad_x), max(0, solid[1] - 8), min(img.size[0], solid[2] + pad_x), min(img.size[1], solid[3] + pad_bottom))
    piece = img.crop(box)
    # fade the shadow out at the cut edges so nothing ends in a line
    w, h = piece.size
    fade = np.ones((h, w), np.float32)
    edge = max(8, pad_x)
    ramp = np.linspace(0, 1, edge)
    fade[:, :edge] *= ramp[None, :]
    fade[:, w - edge :] *= ramp[::-1][None, :]
    fade[h - pad_bottom :, :] *= np.linspace(1, 0, pad_bottom)[:, None]
    alpha = np.asarray(piece.getchannel("A")).astype(np.float32)
    keep = (alpha > 200).astype(np.float32)  # the product itself is never faded
    alpha = alpha * np.maximum(fade, keep)
    piece.putalpha(Image.fromarray(alpha.astype(np.uint8), "L"))
    return piece


def on_canvas(piece, size, width, bottom):
    scale = width / piece.size[0]
    piece = piece.resize((round(piece.size[0] * scale), round(piece.size[1] * scale)), Image.LANCZOS)
    canvas = Image.new("RGBA", size, (255, 255, 255, 0))
    canvas.alpha_composite(piece, ((size[0] - piece.size[0]) // 2, size[1] - bottom - piece.size[1]))
    return canvas


for fid in FLAVOURS:
    piece = trimmed(Image.open(f"{OUT}/{fid}.png").convert("RGBA"))
    on_canvas(piece, (1400, 1656), 1180, 90).save(f"public/assets/hero/layers/{fid}/3-cup.webp", quality=88, method=6)
    on_canvas(piece, (1980, 2340), 1660, 130).save(f"public/assets/hero/drinks/{fid}.webp", quality=86, method=6)
    on_canvas(piece, (900, 900), 860, 0).save(f"public/assets/hero/cards/{fid}.webp", quality=86, method=6)
    print(fid, piece.size)
