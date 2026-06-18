#!/usr/bin/env python3
"""
Generate AgriDirect app icons for all Android mipmap densities.
Logo: green circle background, white leaf + "AD" text.
"""
import os
import math
from PIL import Image, ImageDraw

BASE = os.path.join(os.path.dirname(__file__), "android", "app", "src", "main", "res")

SIZES = {
    "mipmap-mdpi":    48,
    "mipmap-hdpi":    72,
    "mipmap-xhdpi":   96,
    "mipmap-xxhdpi":  144,
    "mipmap-xxxhdpi": 192,
}

# Brand colours
GREEN_DARK  = (27, 94, 32)    # #1B5E20
GREEN_MID   = (46, 125, 50)   # #2E7D32
GREEN_LIGHT = (76, 175, 80)   # #4CAF50
WHITE       = (255, 255, 255)
YELLOW      = (255, 213, 79)  # #FFD54F


def draw_leaf(draw: ImageDraw.ImageDraw, cx: float, cy: float, r: float, color):
    """Draw a simple 3-petal leaf / plant sprout."""
    # Stem
    stem_w = max(1, int(r * 0.07))
    draw.line([(cx, cy + r * 0.1), (cx, cy - r * 0.35)], fill=color, width=stem_w)

    # Left leaf (ellipse rotated ~-45 deg via polygon approximation)
    def ellipse_points(ecx, ecy, ew, eh, angle_deg, steps=24):
        pts = []
        a = math.radians(angle_deg)
        for i in range(steps):
            t = 2 * math.pi * i / steps
            x = ew * math.cos(t)
            y = eh * math.sin(t)
            rx = x * math.cos(a) - y * math.sin(a) + ecx
            ry = x * math.sin(a) + y * math.cos(a) + ecy
            pts.append((rx, ry))
        return pts

    lw, lh = r * 0.28, r * 0.14
    left_pts  = ellipse_points(cx - r * 0.18, cy - r * 0.05, lw, lh, -40)
    right_pts = ellipse_points(cx + r * 0.18, cy - r * 0.05, lw, lh,  40)
    top_pts   = ellipse_points(cx,             cy - r * 0.28, lw, lh,   0)

    draw.polygon(left_pts,  fill=color)
    draw.polygon(right_pts, fill=color)
    draw.polygon(top_pts,   fill=color)


def make_icon(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    r = size / 2
    pad = size * 0.04

    # Outer circle (dark green)
    draw.ellipse([pad, pad, size - pad, size - pad], fill=GREEN_DARK)

    # Inner circle gradient effect (mid green)
    inner_pad = size * 0.10
    draw.ellipse([inner_pad, inner_pad, size - inner_pad, size - inner_pad], fill=GREEN_MID)

    # Leaf cluster (white)
    draw_leaf(draw, r, r + size * 0.04, r * 0.52, WHITE)

    # Small sun / dot above leaf
    sun_r = size * 0.06
    draw.ellipse(
        [r - sun_r, r * 0.18, r + sun_r, r * 0.18 + sun_r * 2],
        fill=YELLOW,
    )

    return img


def make_round_icon(size: int) -> Image.Image:
    """Same as square but with a circular mask for ic_launcher_round."""
    img = make_icon(size)
    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.ellipse([0, 0, size, size], fill=255)
    img.putalpha(mask)
    return img


def main():
    for folder, size in SIZES.items():
        out_dir = os.path.join(BASE, folder)
        os.makedirs(out_dir, exist_ok=True)

        # Square icon (Android clips to circle/squircle itself)
        sq = make_icon(size)
        sq.save(os.path.join(out_dir, "ic_launcher.png"))

        # Round icon
        rd = make_round_icon(size)
        rd.save(os.path.join(out_dir, "ic_launcher_round.png"))

        print(f"[icon] {folder}: {size}x{size} written")

    print("[icon] Done.")


if __name__ == "__main__":
    main()
