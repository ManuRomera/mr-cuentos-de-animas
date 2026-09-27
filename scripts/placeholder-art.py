"""
Arte provisional de MR · Cuentos de Ánimas, generado por código (sin fotos ni IA).
Sirve mientras llega el arte definitivo descrito en docs/ARTE.md; cada archivo
se sustituye dejando el definitivo con el mismo nombre (scripts/import-art.py).

Uso:  python3 scripts/placeholder-art.py        (necesita Pillow y NumPy)
"""
import math, random
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageChops

ROOT = Path(__file__).resolve().parent.parent / "assets"
rng = np.random.default_rng(7)
random.seed(7)
SERIF = "/System/Library/Fonts/Supplemental/Baskerville.ttc"

def save(img, rel, quality=84):
    p = ROOT / rel
    p.parent.mkdir(parents=True, exist_ok=True)
    img.save(p, "WEBP", quality=quality, method=6)
    print("·", rel, img.size)

def noise(w, h, scale=64, octaves=5, seed=0):
    """Ruido de valor fractal (suave) en [0,1]."""
    r = np.random.default_rng(seed)
    out = np.zeros((h, w), np.float32)
    amp, total = 1.0, 0.0
    for o in range(octaves):
        s = max(2, int(scale / (2 ** o)))
        gw, gh = w // s + 2, h // s + 2
        grid = r.random((gh, gw)).astype(np.float32)
        layer = np.array(Image.fromarray((grid * 255).astype(np.uint8)).resize((gw * s, gh * s), Image.BICUBIC), np.float32)[:h, :w] / 255
        out += layer * amp
        total += amp
        amp *= 0.5
    return out / total

def grain(img, amount=10, seed=1):
    a = np.asarray(img.convert("RGB"), np.float32)
    g = np.random.default_rng(seed).normal(0, amount, a.shape[:2])[..., None]
    return Image.fromarray(np.clip(a + g, 0, 255).astype(np.uint8))

def vignette(img, strength=0.75, power=2.2):
    w, h = img.size
    y, x = np.ogrid[:h, :w]
    d = np.sqrt(((x - w / 2) / (w / 2)) ** 2 + ((y - h / 2) / (h / 2)) ** 2) / math.sqrt(2)
    m = 1 - strength * np.clip(d, 0, 1) ** power
    a = np.asarray(img.convert("RGB"), np.float32) * m[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def glow(img, cx, cy, radius, color, strength=0.6):
    w, h = img.size
    y, x = np.ogrid[:h, :w]
    d = np.sqrt((x - cx) ** 2 + (y - cy) ** 2) / radius
    m = np.clip(1 - d, 0, 1) ** 2 * strength
    a = np.asarray(img.convert("RGB"), np.float32)
    c = np.array(color, np.float32)
    a = a + (c - a * 0.3) * m[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def colorize(v, dark, light):
    v = v[..., None]
    return (np.array(dark, np.float32) * (1 - v) + np.array(light, np.float32) * v)

def fog(w, h, seed, color=(200, 205, 210), density=0.5, scale=260):
    n = noise(w, h, scale, 5, seed)
    n = np.clip((n - 0.35) * 2.2, 0, 1) * density
    return n

# ---------------------------------------------------------------- madera
def streaks(w, h, sx, sy, seed):
    """Ruido alargado en horizontal: vetas de madera."""
    r = np.random.default_rng(seed)
    gw, gh = max(2, w // sx + 2), max(2, h // sy + 2)
    grid = (r.random((gh, gw)) * 255).astype(np.uint8)
    return np.asarray(Image.fromarray(grid).resize((gw * sx, gh * sy), Image.BICUBIC), np.float32)[:h, :w] / 255

def wood(w, h, seed=3, dark=(18, 11, 7), light=(96, 62, 37)):
    y = np.mgrid[:h, :w][0].astype(np.float32)
    warp = streaks(w, h, 420, 90, seed) * 26
    lines = np.sin((y + warp) / 5.5) * 0.5 + 0.5
    grain_ = streaks(w, h, 160, 3, seed + 1) * 0.55 + streaks(w, h, 60, 2, seed + 2) * 0.25 + streaks(w, h, 600, 30, seed + 3) * 0.4
    v = np.clip(grain_ * 0.75 + lines * 0.18, 0, 1) ** 1.6
    plank = h / 5
    idx = np.floor(y / plank)
    v = v * (0.82 + 0.18 * ((idx * 7919) % 5) / 4)
    seam = np.exp(-((y % plank) ** 2) / 6) + np.exp(-((plank - y % plank) ** 2) / 6)
    v = np.clip(v - seam * 0.6, 0, 1)
    return Image.fromarray(colorize(v, dark, light).astype(np.uint8))

def table(w=1920, h=1080, seed=3, props=False):
    img = wood(w, h, seed)
    img = glow(img, w * 0.1, h * 0.14, w * 0.42, (255, 170, 80), 0.45)
    img = glow(img, w * 0.92, h * 0.86, w * 0.35, (255, 150, 70), 0.3)
    d = ImageDraw.Draw(img, "RGBA")
    if props:
        # platillo de vela
        cx, cy = int(w * 0.09), int(h * 0.16)
        d.ellipse([cx - 90, cy - 60, cx + 90, cy + 60], fill=(60, 44, 24, 255), outline=(150, 115, 60, 255), width=4)
        d.ellipse([cx - 34, cy - 30, cx + 34, cy + 30], fill=(228, 214, 185, 255))
        d.ellipse([cx - 8, cy - 8, cx + 8, cy + 8], fill=(255, 220, 140, 255))
        # papeles
        for i, (px, py, rot) in enumerate([(0.78, 0.12, -8), (0.86, 0.22, 6), (0.12, 0.8, 4)]):
            paper = Image.new("RGBA", (260, 180), (225, 210, 180, 235))
            pd = ImageDraw.Draw(paper)
            for k in range(8):
                pd.line([(20, 24 + k * 18), (230 - (k * 13) % 60, 24 + k * 18)], fill=(90, 70, 50, 120), width=2)
            paper = paper.rotate(rot, expand=True, resample=Image.BICUBIC)
            img.paste(paper, (int(w * px - paper.width / 2), int(h * py - paper.height / 2)), paper)
        # piedras y ámbar sueltos
        for k in range(5):
            x0, y0 = w * 0.05 + k * 26, h * 0.62 + (k % 2) * 22
            d.ellipse([x0, y0, x0 + 30, y0 + 22], fill=(200, 210, 220, 200))
        for k in range(4):
            x0, y0 = w * 0.9 + k * 20, h * 0.5 + (k % 2) * 18
            d.ellipse([x0, y0, x0 + 24, y0 + 20], fill=(210, 130, 40, 210))
        img = img.filter(ImageFilter.GaussianBlur(0.6))
    img = vignette(img, 0.8, 1.8)
    return grain(img, 7, seed)

# ---------------------------------------------------------------- ornamento
def ornament(size, gold=(205, 165, 95), seed=5, emblem="moon"):
    """Reverso: cuero oscuro con estampación dorada simétrica y desgaste."""
    w, h = size
    leather = noise(w, h, 30, 5, seed) * 0.5 + noise(w, h, 4, 2, seed + 1) * 0.5
    base = Image.fromarray(colorize(leather, (14, 10, 9), (48, 30, 24)).astype(np.uint8))
    layer = Image.new("L", (w, h), 0)
    d = ImageDraw.Draw(layer)
    m = 36
    d.rounded_rectangle([m, m, w - m, h - m], 26, outline=255, width=6)
    d.rounded_rectangle([m + 16, m + 16, w - m - 16, h - m - 16], 18, outline=255, width=2)
    # esquinas
    for sx, sy in [(1, 1), (-1, 1), (1, -1), (-1, -1)]:
        cx = w / 2 + sx * (w / 2 - m - 16)
        cy = h / 2 + sy * (h / 2 - m - 16)
        for r in (70, 48, 26):
            d.arc([cx - r, cy - r, cx + r, cy + r], 0, 360, fill=255, width=2)
    # ramas simétricas
    cx, cy = w / 2, h / 2
    def branch(side, flip):
        pts = []
        for t in np.linspace(0, 1, 60):
            x = cx + side * (40 + 230 * t)
            y = cy + flip * (-260 * t + 70 * math.sin(t * math.pi * 2))
            pts.append((x, y))
        d.line(pts, fill=255, width=4)
        for k, t in enumerate(np.linspace(0.12, 0.95, 9)):
            x, y = pts[int(t * 59)]
            ang = (-1 if k % 2 else 1) * 0.9 + (0 if side > 0 else math.pi)
            lx, ly = x + math.cos(ang) * 38 * side, y + math.sin(ang) * 30 * flip
            d.polygon([(x, y), ((x + lx) / 2 + 8, (y + ly) / 2 - 8), (lx, ly), ((x + lx) / 2 - 8, (y + ly) / 2 + 8)], fill=255)
            # espina
            d.line([(x, y), (x + side * 10, y - flip * 14)], fill=255, width=2)
    for side in (1, -1):
        for flip in (1, -1):
            branch(side, flip)
    # emblema central
    if emblem == "moon":
        d.ellipse([cx - 110, cy - 110, cx + 110, cy + 110], outline=255, width=5)
        d.ellipse([cx - 78, cy - 78, cx + 78, cy + 78], fill=255)
        d.ellipse([cx - 52, cy - 92, cx + 104, cy + 64], fill=0)
        # rayos
        for k in range(24):
            a = k / 24 * 2 * math.pi
            d.line([(cx + math.cos(a) * 124, cy + math.sin(a) * 124), (cx + math.cos(a) * (150 if k % 2 else 170), cy + math.sin(a) * (150 if k % 2 else 170))], fill=255, width=3)
    else:  # rombo para el mazo numérico
        s = 120
        d.polygon([(cx, cy - s), (cx + s * 0.72, cy), (cx, cy + s), (cx - s * 0.72, cy)], outline=255, width=6)
        d.polygon([(cx, cy - s * 0.55), (cx + s * 0.38, cy), (cx, cy + s * 0.55), (cx - s * 0.38, cy)], fill=255)
    # desgaste del dorado
    wear = noise(w, h, 10, 3, seed + 9)
    mask = np.asarray(layer, np.float32) / 255 * np.clip((wear - 0.28) * 2.4, 0.15, 1)
    goldtex = colorize(noise(w, h, 20, 3, seed + 4), tuple(c * 0.55 for c in gold), tuple(min(255, c * 1.25) for c in gold))
    out = np.asarray(base, np.float32) * (1 - mask[..., None]) + goldtex * mask[..., None]
    # relieve: sombra bajo la estampación
    shadow = np.asarray(layer.filter(ImageFilter.GaussianBlur(3)), np.float32) / 255
    out = out * (1 - 0.25 * np.roll(np.roll(shadow, 3, 0), 3, 1)[..., None] * (1 - mask[..., None]))
    img = vignette(Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), 0.55, 2)
    return grain(img, 6, seed)

# ---------------------------------------------------------------- escenas atmosféricas
def atmosphere(size, seed, dark, light, fog_color=(190, 196, 200), fog_density=0.55, light_pos=(0.5, 0.3), light_color=(255, 190, 110)):
    w, h = size
    y = np.linspace(0, 1, h)[:, None]
    grad = colorize(np.broadcast_to(1 - y, (h, w)) * 0.8, dark, light)
    img = Image.fromarray(grad.astype(np.uint8))
    img = glow(img, w * light_pos[0], h * light_pos[1], w * 0.6, light_color, 0.35)
    f = fog(w, h, seed, density=fog_density)
    a = np.asarray(img, np.float32)
    a = a * (1 - f[..., None]) + np.array(fog_color, np.float32) * f[..., None]
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def silhouette_layer(size, draw_fn, blur=2):
    layer = Image.new("L", size, 0)
    draw_fn(ImageDraw.Draw(layer), *size)
    return layer.filter(ImageFilter.GaussianBlur(blur))

def composite(img, mask, color, opacity=1.0):
    a = np.asarray(img, np.float32)
    m = np.asarray(mask, np.float32)[..., None] / 255 * opacity
    a = a * (1 - m) + np.array(color, np.float32) * m
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))

def finish(img, seed, strength=0.7):
    return grain(vignette(img, strength, 2.0), 9, seed)

def art_clue(size=(900, 1200)):
    img = atmosphere(size, 11, (18, 12, 8), (70, 50, 32), fog_density=0.15, light_pos=(0.3, 0.25))
    def draw(d, w, h):
        # fotografía antigua ladeada y una llave
        d.rectangle([w * .2, h * .32, w * .78, h * .72], fill=180)
        d.ellipse([w * .52, h * .6, w * .72, h * .74], outline=255, width=16)
        d.rectangle([w * .3, h * .655, w * .56, h * .685], fill=255)
        for k in range(3):
            d.rectangle([w * (.32 + k * .05), h * .685, w * (.35 + k * .05), h * .72], fill=255)
    photo = silhouette_layer(size, draw, 1)
    img = composite(img, photo, (205, 185, 150), 0.85)
    img = glow(img, size[0] * .24, size[1] * .2, size[0] * .45, (255, 190, 110), .5)
    return finish(img, 11)

def art_environment(size=(900, 1200)):
    img = atmosphere(size, 12, (8, 12, 10), (70, 86, 72), fog_color=(170, 185, 175), fog_density=0.6, light_pos=(0.5, 0.35), light_color=(200, 220, 230))
    def trees(d, w, h):
        for k in range(14):
            x = random.uniform(-0.05, 1.05) * w
            tw = random.uniform(10, 34)
            d.rectangle([x - tw / 2, h * random.uniform(0, .2), x + tw / 2, h], fill=int(random.uniform(120, 255)))
            for b in range(5):
                by = h * random.uniform(.1, .6)
                d.line([(x, by), (x + random.choice([-1, 1]) * random.uniform(40, 140), by - random.uniform(30, 120))], fill=200, width=int(tw / 3) + 1)
        d.polygon([(w * .42, h), (w * .58, h), (w * .52, h * .62), (w * .49, h * .62)], fill=0)
    layer = silhouette_layer(size, trees, 3)
    img = composite(img, layer, (10, 14, 12), 0.9)
    f = fog(*size, 22, density=0.4)
    a = np.asarray(img, np.float32); a = a * (1 - f[..., None] * .6) + 170 * f[..., None] * .6
    return finish(Image.fromarray(a.astype(np.uint8)), 12)

def art_character(size=(900, 1200)):
    img = atmosphere(size, 13, (10, 6, 6), (60, 30, 28), fog_density=0.12, light_pos=(0.5, 0.45), light_color=(255, 170, 90))
    def door(d, w, h):
        d.rectangle([w * .28, h * .12, w * .72, h * .95], fill=255)
    lit = silhouette_layer(size, door, 12)
    img = composite(img, lit, (140, 90, 55), 0.55)
    def figure(d, w, h):
        d.ellipse([w * .42, h * .3, w * .58, h * .46], fill=255)
        d.polygon([(w * .33, h * .95), (w * .38, h * .5), (w * .5, h * .45), (w * .62, h * .5), (w * .67, h * .95)], fill=255)
    fig = silhouette_layer(size, figure, 5)
    img = composite(img, fig, (12, 8, 8), 0.95)
    return finish(img, 13)

def art_incident(size=(900, 1200)):
    img = atmosphere(size, 14, (8, 10, 18), (40, 50, 78), fog_density=0.2, light_pos=(0.5, 0.62), light_color=(255, 180, 90))
    def glass(d, w, h):
        cx, cy = w * .5, h * .62
        for k in range(18):
            a = random.uniform(0, 2 * math.pi); r1 = random.uniform(20, 60); r2 = random.uniform(140, 380)
            d.line([(cx + math.cos(a) * r1, cy + math.sin(a) * r1), (cx + math.cos(a) * r2, cy + math.sin(a) * r2 * .5)], fill=255, width=3)
        for k in range(26):
            x, y = cx + random.uniform(-340, 340), cy + random.uniform(40, 200)
            s = random.uniform(8, 26)
            d.polygon([(x, y), (x + s, y + s * .3), (x + s * .4, y + s)], fill=200)
    layer = silhouette_layer(size, glass, 1)
    img = composite(img, layer, (200, 210, 225), 0.7)
    return finish(img, 14)

def art_gray(n, size=(900, 1200)):
    img = atmosphere(size, 20 + n, (14, 15, 17), (120, 124, 128), fog_color=(205, 208, 212), fog_density=0.55 - n * 0.08, light_pos=(0.5, 0.2), light_color=(210, 220, 235))
    scale = [0.34, 0.62, 1.05][n - 1]
    def lady(d, w, h):
        cx, top = w * .5, h * (0.42 - scale * .22)
        head = 70 * scale
        d.ellipse([cx - head, top, cx + head, top + head * 2.3], fill=255)
        d.polygon([(cx - head * 1.1, top + head * .7), (cx + head * 1.1, top + head * .7), (cx + head * 3.4, h * min(1.2, .5 + scale * .55)), (cx - head * 3.4, h * min(1.2, .5 + scale * .55))], fill=255)
    layer = silhouette_layer(size, lady, 6 + (3 - n) * 4)
    img = composite(img, layer, (22, 22, 24), 0.55 + n * 0.12)
    # velo más claro sobre la cabeza
    def veil(d, w, h):
        cx, top = w * .5, h * (0.42 - scale * .22)
        head = 70 * scale
        d.polygon([(cx - head * .9, top + head * .2), (cx + head * .9, top + head * .2), (cx + head * 1.6, top + head * 3.2), (cx - head * 1.6, top + head * 3.2)], fill=255)
    v = silhouette_layer(size, veil, 10)
    img = composite(img, v, (170, 172, 176), 0.25)
    f = fog(*size, 40 + n, density=0.45 - n * 0.1)
    a = np.asarray(img, np.float32); a = a * (1 - f[..., None] * .5) + 200 * f[..., None] * .5
    img = Image.fromarray(a.astype(np.uint8)).convert("L").convert("RGB")
    return finish(img, 20 + n, 0.6 + n * 0.08)

def art_number(size=(600, 800)):
    img = atmosphere(size, 30, (8, 10, 16), (44, 54, 72), fog_density=0.35, light_pos=(0.5, 0.4), light_color=(180, 200, 230))
    return finish(img, 30, 0.8)

# ---------------------------------------------------------------- contadores
def pebble(size, base, light, glow_color, lit=True, seed=0, crack=False):
    s = size
    y, x = np.mgrid[:s, :s].astype(np.float32)
    cx, cy, rx, ry = s / 2, s / 2 + 4, s * 0.36, s * 0.29
    d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2
    inside = np.clip((1 - d) * 18, 0, 1)
    # sombreado: luz arriba a la izquierda
    nx, ny = (x - cx) / rx, (y - cy) / ry
    nz = np.sqrt(np.clip(1 - nx ** 2 - ny ** 2, 0, 1))
    lamb = np.clip(-0.45 * nx - 0.6 * ny + 0.66 * nz, 0, 1)
    tex = noise(s, s, 18, 4, seed)
    col = colorize(np.clip(lamb * 0.85 + tex * 0.25, 0, 1), base, light)
    if lit:
        inner = np.clip(1 - d, 0, 1) ** 0.6
        col = col + np.array(glow_color, np.float32) * inner[..., None] * 0.35
    spec = np.clip((-0.45 * nx - 0.62 * ny + 0.64 * nz - 0.93) * 14, 0, 1) * (0.85 if lit else 0.3)
    col = col + 255 * spec[..., None]
    if crack:
        cr = Image.new("L", (s, s), 0); cd = ImageDraw.Draw(cr)
        px, py = cx - rx * .3, cy - ry * .6
        for k in range(6):
            nx2, ny2 = px + random.uniform(4, 16), py + random.uniform(4, 12)
            cd.line([(px, py), (nx2, ny2)], fill=255, width=2); px, py = nx2, ny2
        col = col * (1 - np.asarray(cr, np.float32)[..., None] / 255 * .7)
    alpha = inside * 255
    shadow = np.clip(1 - (((x - cx - 4) / (rx * 1.05)) ** 2 + ((y - cy - 10) / (ry * 1.1)) ** 2), 0, 1) ** 0.8 * 120
    rgba = np.dstack([np.clip(col, 0, 255), np.maximum(alpha, shadow * (1 - inside))])
    rgb_shadow = rgba.copy()
    rgba[..., :3] = rgba[..., :3] * inside[..., None]
    return Image.fromarray(rgba.astype(np.uint8))

# ---------------------------------------------------------------- marca y portada
def icon_svg():
    return """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
<rect width="64" height="64" rx="12" fill="#15110e"/>
<rect x="17" y="9" width="30" height="42" rx="4" fill="#2a1c13" stroke="#c49a57" stroke-width="2.5"/>
<circle cx="32" cy="27" r="9" fill="#e9dcc0"/><circle cx="36" cy="24" r="8" fill="#2a1c13"/>
<path d="M32 58c-5 0-8-3.5-8-7.5 0-5 5-7.5 8-13 3 5.5 8 8 8 13 0 4-3 7.5-8 7.5z" fill="#e39a45"/>
<path d="M32 58c-2.4 0-4-1.7-4-3.8 0-2.6 2.5-3.8 4-6.6 1.5 2.8 4 4 4 6.6 0 2.1-1.6 3.8-4 3.8z" fill="#ffe0a6"/>
</svg>"""

def title_card(img, title, subtitle, size=120):
    d = ImageDraw.Draw(img, "RGBA")
    w, h = img.size
    f1 = ImageFont.truetype(SERIF, size, index=0)
    f2 = ImageFont.truetype(SERIF, int(size * 0.28), index=0)
    tw = d.textlength(title, font=f1)
    shade = Image.new("L", img.size, 0); sd = ImageDraw.Draw(shade)
    sd.text(((w - tw) / 2, h * .38), title, font=f1, fill=255)
    shade = shade.filter(ImageFilter.GaussianBlur(14))
    img = composite(img, shade, (0, 0, 0), 0.8)
    d = ImageDraw.Draw(img, "RGBA")
    d.text(((w - tw) / 2, h * .38), title, font=f1, fill=(240, 222, 186, 255))
    sw = d.textlength(subtitle, font=f2)
    d.text(((w - sw) / 2, h * .38 + size * 1.25), subtitle, font=f2, fill=(196, 154, 87, 255))
    d.line([(w / 2 - 180, h * .38 - 26), (w / 2 + 180, h * .38 - 26)], fill=(196, 154, 87, 200), width=2)
    return img

def portrait(size=(512, 640)):
    img = atmosphere(size, 50, (30, 22, 16), (120, 96, 70), fog_density=0.1, light_pos=(0.35, 0.3))
    def bust(d, w, h):
        d.ellipse([w * .34, h * .18, w * .66, h * .5], fill=255)
        d.polygon([(w * .12, h), (w * .2, h * .66), (w * .5, h * .56), (w * .8, h * .66), (w * .88, h)], fill=255)
    img = composite(img, silhouette_layer(size, bust, 6), (34, 26, 20), 0.9)
    return grain(vignette(img.convert("L").convert("RGB"), .6), 8, 50)

def main():
    tbl = table()
    save(tbl, "table/table.webp", 80)
    scene = table(seed=4)
    scene = title_card(scene, "Mesa de Ánimas", "MR · CUENTOS DE ÁNIMAS", 110)
    save(scene, "table/scene.webp", 80)
    cover = table(seed=5)
    cover = title_card(cover, "Cuentos de Ánimas", "MR · RELATOS PARA UNA NOCHE", 150)
    save(cover, "branding/cover.webp", 82)
    save(ornament((900, 1200)), "cards/back.webp")
    save(ornament((900, 1200), gold=(190, 190, 200), seed=6, emblem="diamond"), "cards/number-back.webp")
    save(art_number(), "cards/number-art.webp")
    save(art_clue(), "cards/clue.webp")
    save(art_environment(), "cards/environment.webp")
    save(art_character(), "cards/character.webp")
    save(art_incident(), "cards/incident.webp")
    for n in (1, 2, 3):
        save(art_gray(n), f"cards/gray-{n}.webp")
    save(pebble(256, (70, 82, 96), (225, 236, 246), (170, 205, 235), True, 1), "counters/spirit-on.webp", 90)
    save(pebble(256, (40, 42, 45), (120, 122, 126), (0, 0, 0), False, 2, crack=True), "counters/spirit-off.webp", 90)
    save(pebble(256, (120, 50, 8), (255, 200, 110), (255, 150, 40), True, 3), "counters/determination-on.webp", 90)
    save(pebble(256, (40, 22, 10), (95, 62, 38), (0, 0, 0), False, 4), "counters/determination-off.webp", 90)
    voice = art_character((900, 1200))
    voice = title_card(voice, "La voz", "QUE DEJASTE ATRÁS", 110)
    save(voice, "scenarios/la-voz-que-dejaste-atras.webp")
    house = art_environment((900, 1200))
    house = title_card(house, "La casa", "QUE RESPIRA", 110)
    save(house, "scenarios/la-casa-que-respira.webp")
    save(portrait(), "branding/portrait.webp")
    (ROOT / "branding").mkdir(parents=True, exist_ok=True)
    (ROOT / "branding/icon.svg").write_text(icon_svg())
    logo = Image.new("RGBA", (512, 512))
    save(ornament((512, 512), seed=8).resize((512, 512)), "branding/logo.webp")

if __name__ == "__main__":
    main()
