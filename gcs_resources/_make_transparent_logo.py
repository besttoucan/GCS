"""
Convert LOGO.jpeg (color logo on pure black) into a transparent-background PNG.

Strategy: in the source, the logo is a colorful gradient (blue/orange) painted on
pure black. We set each pixel's alpha to its luminance (max of R/G/B), so:
  - Pure-black pixels  -> alpha 0  (fully transparent)
  - Bright color pixels -> alpha 255 (fully opaque)
  - The smooth edges of the gradient stay smooth.

Output: assets/logo.png (the new single transparent logo used everywhere).
"""

from pathlib import Path
from PIL import Image

src = Path(__file__).resolve().parent / "LOGO2.jpeg"  # 1024x1024 master, full-blades design
dst = Path(__file__).resolve().parent.parent / "assets" / "logo.png"

im = Image.open(src).convert("RGB")
w, h = im.size
px = im.load()

out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
op = out.load()

LO, HI = 16, 56  # luminance band used for edge feathering

for y in range(h):
    for x in range(w):
        r, g, b = px[x, y]
        m = max(r, g, b)
        if m <= LO:
            op[x, y] = (0, 0, 0, 0)
        elif m >= HI:
            # Keep the original saturated color, full opacity.
            op[x, y] = (r, g, b, 255)
        else:
            # Smooth edge ramp so anti-aliased borders fade cleanly rather
            # than leaving a jagged or haloed outline.
            a = int(round((m - LO) / (HI - LO) * 255))
            op[x, y] = (r, g, b, a)

# Crop to the non-transparent bounding box so the icon fills the 36px slot.
bbox = out.getbbox()
if bbox:
    out = out.crop(bbox)

out.save(dst, "PNG", optimize=True)
print(f"wrote {dst} ({out.size[0]}x{out.size[1]})")
