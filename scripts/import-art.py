"""
Incorpora el arte definitivo descrito en docs/ARTE.md.

Deja las imágenes en art-inbox/ con el nombre de su clave (gray-2.png, table.jpg,
spirit-on.png…) y ejecuta:  python3 scripts/import-art.py
Cada imagen se recorta al encuadre, se reduce, se convierte a WebP y va a su sitio.
Necesita Pillow (pip install pillow).
"""
import sys
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
INBOX = ROOT / "art-inbox"

# clave: (destino, ancho, alto, transparente)
TARGETS = {
    "table": ("assets/table/table.webp", 1920, 1080, False),
    "scene": ("assets/table/scene.webp", 1920, 1080, False),
    "cover": ("assets/branding/cover.webp", 1920, 1080, False),
    "logo": ("assets/branding/logo.webp", 512, 512, False),
    "portrait": ("assets/branding/portrait.webp", 512, 640, False),
    "back": ("assets/cards/back.webp", 900, 1275, False),
    "number-back": ("assets/cards/number-back.webp", 900, 1275, False),
    "number-art": ("assets/cards/number-art.webp", 600, 850, False),
    "clue": ("assets/cards/clue.webp", 900, 1275, False),
    "environment": ("assets/cards/environment.webp", 900, 1275, False),
    "character": ("assets/cards/character.webp", 900, 1275, False),
    "incident": ("assets/cards/incident.webp", 900, 1275, False),
    "gray-1": ("assets/cards/gray-1.webp", 900, 1275, False),
    "gray-2": ("assets/cards/gray-2.webp", 900, 1275, False),
    "gray-3": ("assets/cards/gray-3.webp", 900, 1275, False),
    "spirit-on": ("assets/counters/spirit-on.webp", 256, 256, True),
    "spirit-off": ("assets/counters/spirit-off.webp", 256, 256, True),
    "determination-on": ("assets/counters/determination-on.webp", 256, 256, True),
    "determination-off": ("assets/counters/determination-off.webp", 256, 256, True),
    "voice": ("assets/scenarios/la-voz-que-dejaste-atras.webp", 900, 1275, False),
    "house": ("assets/scenarios/la-casa-que-respira.webp", 900, 1275, False),
    "voice-tapes": ("assets/scenarios/voice/voice-tapes.webp", 1600, 1000, False),
    "voice-photo": ("assets/scenarios/voice/voice-photo.webp", 1200, 900, False),
    "voice-key": ("assets/scenarios/voice/voice-key.webp", 1200, 900, False),
    "voice-letter": ("assets/scenarios/voice/voice-letter.webp", 1200, 900, False),
    "voice-door": ("assets/scenarios/voice/voice-door.webp", 1000, 1400, False),
    "voice-blank-tape": ("assets/scenarios/voice/voice-blank-tape.webp", 1200, 900, False),
}
EXTS = {".png", ".jpg", ".jpeg", ".webp", ".tif", ".tiff"}


def convert(src: Path, key: str):
    dest, w, h, alpha = TARGETS[key]
    img = ImageOps.exif_transpose(Image.open(src))
    img = img.convert("RGBA" if alpha else "RGB")
    if alpha:
        # Contadores: encajar sin recortar, centrado sobre transparente.
        img.thumbnail((w, h), Image.LANCZOS)
        canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        canvas.paste(img, ((w - img.width) // 2, (h - img.height) // 2), img)
        img = canvas
        warn = "" if src.suffix.lower() in {".png", ".webp", ".tif", ".tiff"} and Image.open(src).mode in ("RGBA", "LA", "P") else "  ⚠ sin transparencia"
    else:
        img = ImageOps.fit(img, (w, h), Image.LANCZOS, centering=(0.5, 0.45))
        warn = "" if min(Image.open(src).size) >= min(w, h) * 0.9 else "  ⚠ original pequeño"
    out = ROOT / dest
    out.parent.mkdir(parents=True, exist_ok=True)
    img.save(out, "WEBP", quality=86 if not alpha else 90, method=6)
    print(f"✓ {src.name:28} → {dest} ({out.stat().st_size // 1024} KB){warn}")


def main():
    if not INBOX.exists():
        INBOX.mkdir()
        print(f"Creada {INBOX.relative_to(ROOT)}/: deja ahí las imágenes y vuelve a ejecutar.")
        return
    files = [p for p in sorted(INBOX.iterdir()) if p.suffix.lower() in EXTS]
    unknown = []
    for f in files:
        key = f.stem.lower().strip()
        if key in TARGETS:
            convert(f, key)
        else:
            unknown.append(f.name)
    if unknown:
        print("\nSin clave reconocida (renómbralas según docs/ARTE.md):", ", ".join(unknown))
    missing = [k for k in TARGETS if not any(f.stem.lower() == k for f in files)]
    print(f"\n{len(files) - len(unknown)} incorporadas · pendientes: {', '.join(missing) or 'ninguna'}")


if __name__ == "__main__":
    sys.exit(main())
