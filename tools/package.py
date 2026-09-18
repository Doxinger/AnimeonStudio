#!/usr/bin/env python3
"""Упаковка сборок в архивы для публикации (Chrome Web Store / AMO)."""
import json
import os
import shutil
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TARGETS = [
    ("dist", "chromium"),
    ("dist-firefox", "firefox"),
]

SKIP_NAMES = {"sample-generated.css", "icon-preview.png"}


def package(dist_name, suffix):
    dist = os.path.join(ROOT, dist_name)
    if not os.path.isdir(dist):
        print(f"  ! нет {dist_name}/ — сначала запустите tools/build.mjs")
        return None

    manifest = json.load(open(os.path.join(dist, "manifest.json"), encoding="utf-8"))
    version = manifest.get("version", "0.0.0")
    out_dir = os.path.join(ROOT, "releases")
    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, f"animeon-studio-v{version}-{suffix}.zip")

    files = []
    files.append(("manifest.json", os.path.join(dist, "manifest.json")))
    for root, _dirs, names in os.walk(dist):
        for name in sorted(names):
            if name in SKIP_NAMES:
                continue
            full = os.path.join(root, name)
            rel = os.path.relpath(full, dist).replace(os.sep, "/")
            if rel == "manifest.json":
                continue
            files.append((rel, full))

    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for arc, full in files:
            z.write(full, arc)

    print(f"  {os.path.relpath(out, ROOT)}  {os.path.getsize(out)} байт, {len(files)} файлов")

    if suffix == "firefox":
        xpi = out[: -len(".zip")] + ".xpi"
        shutil.copyfile(out, xpi)
        print(f"  {os.path.relpath(xpi, ROOT)}  {os.path.getsize(xpi)} байт, для загрузки на AMO")

    return out


def main():
    for dist_name, suffix in TARGETS:
        package(dist_name, suffix)


if __name__ == "__main__":
    main()
