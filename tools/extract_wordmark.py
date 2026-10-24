"""Cuts the official RUS RUSS wordmark out of the branding PDF as transparent artwork.

The wordmark in the PDF is type set in Mont Bold with the registered mark beside it (page 1).
This renders that area at high resolution and turns it into clean black-on-transparent and
white-on-transparent PNGs for the wordmark slot in public/assets/hero/wordmark/.
Run: python tools/extract_wordmark.py [path to the PDF]
"""
import sys
import pymupdf
from PIL import Image, ImageOps

SRC = sys.argv[1] if len(sys.argv) > 1 else "RUS RUSS Branding.pdf"  # path to the brand PDF (not in the repo)
OUT = "public/assets/hero/wordmark"
page = pymupdf.open(SRC)[0]

# the largest "RUS RUSS" on the page is the primary lockup
spans = [s for b in page.get_text("dict")["blocks"] for l in b.get("lines", []) for s in l["spans"]]
word = max((s for s in spans if s["text"].strip() == "RUS RUSS"), key=lambda s: s["size"])
juices = min((s for s in spans if s["text"].strip() == "Juices"), key=lambda s: abs(s["bbox"][1] - word["bbox"][3]))
x0, y0, x1, y1 = word["bbox"]
h = y1 - y0
print("wordmark", [round(v) for v in word["bbox"]], "size", round(word["size"]), word["font"], "| Juices", [round(v) for v in juices["bbox"]])


def cut(rect, name, width):
    zoom = width / rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), clip=rect, colorspace=pymupdf.csGRAY)
    gray = Image.frombytes("L", (pix.width, pix.height), pix.samples)
    alpha = ImageOps.invert(gray)  # black artwork on a white page: darkness is coverage
    # The foot of the rabbit drawing above the lockup reaches down beside the registered
    # mark. Clear everything above the top of the capitals, except the corner the mark is in.
    # The top of the capitals is found from the R at the far left, which nothing overlaps.
    left = alpha.crop((0, 0, int(pix.width * 0.08), pix.height)).point(lambda v: 255 if v > 128 else 0)
    caps_top = left.getbbox()[1]
    alpha.paste(0, (0, 0, int(pix.width * 0.86), caps_top))
    box = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    alpha = alpha.crop(box)
    for ink, colour in (("black", 0), ("white", 255)):
        img = Image.new("LA", alpha.size, colour)
        img.putalpha(alpha)
        img.convert("RGBA").save(f"{OUT}/{name}-{ink}.png", optimize=True)
    print(name, alpha.size)


# wordmark with its registered mark (the ring sits up and to the right of the last S)
top = y0 - h * 0.068  # just under the rabbit artwork that sits above the lockup
cut(pymupdf.Rect(x0 - h * 0.12, top, x1 + h * 0.62, juices["bbox"][1] - 2), "wordmark", 2600)
# the full lockup, with "Juices" beneath
cut(pymupdf.Rect(x0 - h * 0.12, top, x1 + h * 0.62, juices["bbox"][3] + h * 0.04), "lockup", 2600)
