"""Draws the app icons (a white heart on a pink gradient) using pure math —
no image libraries needed. Run:  python tools/make_icons.py"""
import struct, zlib, os

def heart(x, y):
    # classic heart curve: (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0  means "inside"
    a = x * x + y * y - 1
    return a * a * a - x * x * y * y * y

def lerp(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))

def color_at(px, py, size, ss):
    top, mid, bot = (255, 179, 209), (240, 82, 143), (197, 107, 214)
    acc = [0.0, 0.0, 0.0]
    for sy in range(ss):
        for sx in range(ss):
            u = (px + (sx + 0.5) / ss) / size
            v = (py + (sy + 0.5) / ss) / size
            t = (u + v) / 2
            bg = lerp(top, mid, t * 2) if t < 0.5 else lerp(mid, bot, (t - 0.5) * 2)
            # heart coordinates (y up), heart fills ~46% of the icon
            hx = (u - 0.5) * 3.5
            hy = -(v - 0.53) * 3.5
            shadow = heart(hx - 0.04, hy + 0.07) <= 0
            inside = heart(hx, hy) <= 0
            c = bg
            if shadow:
                c = lerp(c, (150, 30, 90), 0.25)
            if inside:
                shine = max(0.0, 1 - ((hx + 0.45) ** 2 + (hy - 0.55) ** 2) * 3)
                c = lerp((255, 240, 247), (255, 255, 255), shine)
            for i in range(3):
                acc[i] += c[i]
    n = ss * ss
    return bytes(int(round(acc[i] / n)) for i in range(3))

def write_png(path, size, ss=2):
    rows = []
    for y in range(size):
        rows.append(b"\x00" + b"".join(color_at(x, y, size, ss) for x in range(size)))
    raw = zlib.compress(b"".join(rows), 9)
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0)) + chunk(b"IDAT", raw) + chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)
    print("made", path, len(png), "bytes")

here = os.path.dirname(os.path.abspath(__file__))
out = os.path.join(here, "..", "icons")
os.makedirs(out, exist_ok=True)
write_png(os.path.join(out, "icon-192.png"), 192, 3)
write_png(os.path.join(out, "icon-512.png"), 512, 2)
