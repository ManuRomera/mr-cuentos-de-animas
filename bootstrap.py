from __future__ import annotations
import base64
import hashlib
import pathlib
import tarfile

ROOT = pathlib.Path(".")
PARTS = [ROOT / f"bootstrap.part.{i:02d}" for i in range(7)]
B64_SHA256 = "3aeeb0225276399a46c0c6fe5272588dc6a5ebd2ebd31a00381a07f143a6548e"
XZ_SHA256 = "743e5193eb47ba0aa99ecd88b8466586b0b4415affca7e40912f672a6eaad54e"

payload = b"".join(p.read_bytes() for p in PARTS)
assert hashlib.sha256(payload).hexdigest() == B64_SHA256, "Payload base64 checksum mismatch"
archive = base64.b64decode(payload, validate=True)
assert hashlib.sha256(archive).hexdigest() == XZ_SHA256, "Archive checksum mismatch"

archive_path = pathlib.Path("/tmp/mr-cda-source.tar.xz")
archive_path.write_bytes(archive)
with tarfile.open(archive_path, "r:xz") as tf:
    tf.extractall(ROOT, filter="data")

print(f"Verified and expanded {len(archive)} bytes")
