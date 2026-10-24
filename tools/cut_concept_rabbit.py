"""TEMPORARY artwork: cuts the hoodie rabbit out of the approved concept tile.

The concept image is small, so this is soft. It exists so the approved rabbit can be seen in
place on the site until the real artwork file is supplied (public/assets/hero/layers/README.md).
Run: python tools/cut_concept_rabbit.py
"""
from PIL import Image, ImageDraw, ImageFilter

SCALE = 5
BOX = (272, 66, 492, 306)  # the rabbit in tile 01 of the concept sheet
# outline of the rabbit, traced on the 5x enlargement
OUTLINE = [
    (405, 380), (400, 300), (420, 210), (470, 120), (540, 70), (610, 56), (655, 78), (667, 130), (647, 220), (602, 300), (562, 360),
    (600, 374), (660, 398), (700, 368), (760, 318), (850, 288), (950, 282), (1032, 308), (1062, 345), (1042, 388), (980, 412), (880, 442), (790, 458), (732, 462),
    (748, 520), (762, 560), (747, 620), (767, 650), (737, 692), (702, 717), (662, 742), (668, 790), (692, 815),
    (742, 840), (768, 880), (772, 940), (742, 1012), (692, 1052), (622, 1057), (572, 1022), (542, 962), (482, 932), (402, 922),
    (372, 962), (302, 978), (236, 958), (200, 902), (150, 882), (154, 840), (194, 760), (250, 700), (264, 650), (298, 630),
    (293, 600), (263, 545), (278, 510), (298, 486), (316, 404), (365, 393),
]

src = Image.open("design/approved/concept-sheet.png").convert("RGB")
big = src.crop(BOX).resize(((BOX[2] - BOX[0]) * SCALE, (BOX[3] - BOX[1]) * SCALE), Image.LANCZOS)
big = big.filter(ImageFilter.UnsharpMask(radius=3, percent=60, threshold=2))
mask = Image.new("L", big.size, 0)
ImageDraw.Draw(mask).polygon(OUTLINE, fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(2.2))
out = big.convert("RGBA")
out.putalpha(mask)
out = out.crop(mask.point(lambda v: 255 if v > 8 else 0).getbbox())
out.save("public/assets/hero/rabbit/hoodie-from-concept.png", optimize=True)
print("rabbit", out.size)
