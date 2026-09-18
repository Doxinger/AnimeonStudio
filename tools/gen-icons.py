#!/usr/bin/env python3
"""Генерация иконок расширения: скруглённый квадрат с градиентом и треугольником play."""
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "icons")
SIZES = [16, 32, 48, 128]

TOP = (124, 77, 255)
BOTTOM = (255, 77, 157)
DARK = (12, 12, 18)


def lerp(a, b, t):
    return tuple(int(round(a[i] + (b[i] - a[i]) * t)) for i in range(3))


def gradient(size, top, bottom):
    base = Image.new("RGB", (size, size))
    px = base.load()
    for y in range(size):
        t = y / max(1, size - 1)
        c = lerp(top, bottom, t)
        for x in range(size):
            d = abs(x / max(1, size - 1) - 0.5) * 0.35
            px[x, y] = lerp(c, (0, 0, 0), d)
    return base


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def make(size):
    ss = size * 4
    radius = int(ss * 0.235)

    canvas = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    grad = gradient(ss, TOP, BOTTOM).convert("RGBA")
    mask = rounded_mask(ss, radius)
    canvas.paste(grad, (0, 0), mask)

    d = ImageDraw.Draw(canvas)

    inner_r = int(radius * 0.82)
    inner = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    idr = ImageDraw.Draw(inner)
    pad = int(ss * 0.055)
    idr.rounded_rectangle([pad, pad, ss - pad - 1, ss - pad - 1], radius=inner_r, fill=DARK + (235,))
    inner_mask = rounded_mask(ss, radius)
    canvas.paste(inner, (0, 0), inner)
    _ = inner_mask

    cx, cy = ss * 0.5, ss * 0.52
    tri_h = ss * 0.44
    tri_w = tri_h * 0.92
    off = tri_w * 0.06
    pts = [
        (cx - tri_w / 2 + off, cy - tri_h / 2),
        (cx - tri_w / 2 + off, cy + tri_h / 2),
        (cx + tri_w / 2 + off, cy),
    ]

    glow = Image.new("RGBA", (ss, ss), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.polygon(pts, fill=(157, 120, 255, 190))
    glow = glow.filter(ImageFilter.GaussianBlur(ss * 0.035))
    canvas.alpha_composite(glow)

    d = ImageDraw.Draw(canvas)
    d.polygon(pts, fill=(255, 255, 255, 255))

    d.rounded_rectangle(
        [int(ss * 0.045), int(ss * 0.045), int(ss * 0.955), int(ss * 0.955)],
        radius=int(radius * 0.9),
        outline=(255, 255, 255, 46),
        width=max(1, int(ss * 0.006)),
    )

    return canvas.resize((size, size), Image.LANCZOS)


def main():
    os.makedirs(OUT, exist_ok=True)
    for s in SIZES:
        img = make(s)
        path = os.path.join(OUT, f"icon-{s}.png")
        img.save(path, "PNG", optimize=True)
        print(f"  {os.path.relpath(path, ROOT)}  {s}x{s}  {os.path.getsize(path)} байт")

    promo = make(660)
    sheet = Image.new("RGBA", (660, 660), (0, 0, 0, 0))
    sheet.paste(promo, (0, 0), promo)
    sheet.save(os.path.join(OUT, "icon-preview.png"), "PNG", optimize=True)
    print("  icons/icon-preview.png")


if __name__ == "__main__":
    main()
