#!/usr/bin/env python3
"""Prepare a minimal static bundle for GitHub Pages deployment."""

from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DIST = ROOT / "dist"

FILES_TO_COPY = [
    "dashboard.html",
    "dashboard-app.js",
    "config/datasets.json",
    "config/runtime.js",
]

DIRS_TO_COPY = [
    "data/aggregates",
]


def copy_file(relative_path: str) -> None:
    src = ROOT / relative_path
    if not src.exists():
        return
    dst = DIST / relative_path
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def copy_dir(relative_path: str) -> None:
    src = ROOT / relative_path
    if not src.exists():
        return
    dst = DIST / relative_path
    if dst.exists():
        shutil.rmtree(dst)
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copytree(src, dst)


def write_nojekyll() -> None:
    (DIST / ".nojekyll").write_text("", encoding="utf-8")


def main() -> None:
    if DIST.exists():
        shutil.rmtree(DIST)
    DIST.mkdir(parents=True, exist_ok=True)

    for file_path in FILES_TO_COPY:
        copy_file(file_path)

    for dir_path in DIRS_TO_COPY:
        copy_dir(dir_path)

    write_nojekyll()
    print(f"[OK] Static bundle created at: {DIST}")


if __name__ == "__main__":
    main()
