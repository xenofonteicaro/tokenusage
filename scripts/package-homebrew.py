#!/usr/bin/env python3
"""Build a reproducible source package from an explicit Git revision allowlist."""
import argparse
import gzip
import hashlib
import io
import json
from pathlib import Path
import subprocess
import tarfile

ROOT_FILES = {
    "package.json", "package-lock.json", "next.config.ts",
    "tsconfig.json", "postcss.config.mjs", "eslint.config.mjs",
}


def git(*args):
    return subprocess.check_output(["git", *args])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ref", default="HEAD")
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    revision = git("rev-parse", "--verify", args.ref + "^{commit}").decode().strip()
    version = json.loads(git("show", f"{revision}:package.json"))["version"]
    entries = git("ls-tree", "-rz", revision).split(b"\0")
    selected = []
    for entry in entries:
        if not entry:
            continue
        metadata, raw_path = entry.split(b"\t", 1)
        path = raw_path.decode()
        if path not in ROOT_FILES and not path.startswith(("src/", "public/")):
            continue
        mode, kind, _ = metadata.split()
        if kind != b"blob" or mode not in (b"100644", b"100755"):
            raise ValueError(f"Unsupported source entry: {path}")
        selected.append((path, 0o755 if mode == b"100755" else 0o644))
    if not ROOT_FILES.issubset({path for path, _ in selected}):
        raise ValueError("Required build source is missing")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("wb") as output:
        with gzip.GzipFile(fileobj=output, mode="wb", filename="", mtime=0) as zipped:
            with tarfile.open(fileobj=zipped, mode="w", format=tarfile.USTAR_FORMAT) as archive:
                for path, mode in sorted(selected):
                    content = git("show", f"{revision}:{path}")
                    item = tarfile.TarInfo(f"tokenusage-{version}/{path}")
                    item.size, item.mode, item.mtime = len(content), mode, 0
                    item.uid = item.gid = 0
                    item.uname = item.gname = ""
                    archive.addfile(item, io.BytesIO(content))
    print(f"{len(selected)} build-source files; SHA-256 {hashlib.sha256(args.out.read_bytes()).hexdigest()}")


if __name__ == "__main__":
    main()
