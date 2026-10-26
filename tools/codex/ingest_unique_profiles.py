#!/usr/bin/env python3
"""
THE CHRONOSCOPE — unique profile ingest.

Feeds freshly generated "Unique Profiles" archive plates (the per-record
PDFs whose page one carries the four role artworks: being / world /
technology / life) into the instrument's live data:

  public/chronoscope/art/*.webp   — the role artwork, re-encoded WebP q85
  public/chronoscope/assets.json  — the ready-asset manifest (extended)
  public/chronoscope/index.json   — the catalogue manifest (counts refreshed)

THE UNIQUENESS CONTRACT (enforced, not aspirational):

  1. Every incoming picture is fingerprinted twice — sha256 of the raw
     bytes the PDF embeds (the pilot manifest's own convention) AND a
     decoded-pixel sha256 (catches re-encodes of the same picture).
  2. Inside the batch: one picture may never claim two slots. A repeat
     aborts the whole ingest before anything is published.
  3. Against the live archive: a byte-identical picture for a slot that
     already holds one is reported as "already present" and skipped (the
     published plate stays). The very same picture offered under a
     DIFFERENT record or role is a violation and aborts the ingest.
  4. A pixel-identical picture in a new byte-dress (re-encode) is a
     violation too — artwork is never silently substituted, recoloured
     or reused.

Role mapping law: page one lays the four plates out two by two. Reading
them in visual order (top-left, top-right, bottom-left, bottom-right)
gives being, world, technology, life — the order verified byte-for-byte
against the hash-reviewed pilot plates of CIV-0001..0004, 0009, 0012.
The page's own text must also name all four role files, and the number
of embedded plates must be exactly four; anything else aborts.

Usage:
  python3 tools/codex/ingest_unique_profiles.py                      # upload/Unique_Profiles_*.zip
  python3 tools/codex/ingest_unique_profiles.py --zips 'upload/X*.zip'
  python3 tools/codex/ingest_unique_profiles.py --src /folder/of/pdfs

Idempotent: already-present plates are skipped, so the same batch (and
future batches) may be replayed safely at any time.
"""

from __future__ import annotations

import argparse
import hashlib
import io
import json
import re
import sys
import tempfile
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public/chronoscope"
ASSETS = OUT / "assets.json"
INDEX = OUT / "index.json"
ROLES = ["being", "world", "technology", "life"]
ART_QUALITY = 85


def pixel_sha(data: bytes) -> str:
    im = Image.open(io.BytesIO(data)).convert("RGB")
    return hashlib.sha256(im.tobytes()).hexdigest()


def parse_pdf(pdf_path: Path) -> tuple[str, str, list[dict]]:
    """Pull the four role plates out of one profile PDF → (civ, version, plates)."""
    doc = fitz.open(pdf_path)
    try:
        page = doc[0]
        m = re.search(r"CIV-(\d+)", pdf_path.name)
        if not m:
            raise SystemExit(f"cannot read a CIV id from {pdf_path.name}")
        civ_id = f"CIV-{m.group(1)}"

        info = page.get_image_info(xrefs=True)
        if len(info) != 4:
            raise SystemExit(
                f"{pdf_path.name}: expected exactly 4 role plates, found {len(info)}"
            )

        text = page.get_text()
        found_roles = [r for r in ROLES if f"{civ_id}-{r}-v" in text]
        if found_roles != ROLES:
            raise SystemExit(
                f"{pdf_path.name}: page text does not name all four roles "
                f"({found_roles})"
            )

        vm = re.search(rf"{civ_id}-being-v(\d+)\.jpg", text)
        version = f"v{vm.group(1)}" if vm else "v001"

        # visual reading order: top-left, top-right, bottom-left, bottom-right
        info.sort(key=lambda i: (round(i["bbox"][1]), i["bbox"][0]))
        plates = []
        for inf, role in zip(info, ROLES):
            raw = doc.extract_image(inf["xref"])["image"]
            plates.append(
                {
                    "civ": civ_id,
                    "role": role,
                    "version": version,
                    "raw": raw,
                    "sha256": hashlib.sha256(raw).hexdigest(),
                    "pix": pixel_sha(raw),
                    "width": inf["width"],
                    "height": inf["height"],
                }
            )
        return civ_id, version, plates
    finally:
        doc.close()


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument(
        "--zips",
        default="upload/Unique_Profiles_*.zip",
        help="glob of profile zips (each holding a profiles/*.pdf folder)",
    )
    ap.add_argument("--src", default=None, help="folder of profile PDFs instead of zips")
    args = ap.parse_args()

    assets = json.loads(ASSETS.read_text(encoding="utf-8"))
    index = json.loads(INDEX.read_text(encoding="utf-8"))

    # ---- the live archive's fingerprints --------------------------------
    live_raw: dict[str, tuple[str, str]] = {}
    for a in assets["ready"]:
        live_raw.setdefault(a["sha256"], (a["entityId"], a["role"]))
    live_pix: dict[str, str] = {}
    for f in sorted((OUT / "art").glob("*.webp")):
        live_pix[pixel_sha(f.read_bytes())] = f.name

    # ---- gather the incoming plates (parsed once) ------------------------
    pdfs: list[Path] = []
    if args.src:
        pdfs = sorted(Path(args.src).glob("**/*.pdf"))
    else:
        zips = sorted(ROOT.glob(args.zips))
        if not zips:
            raise SystemExit(f"no zips match {args.zips}")
        tmp = Path(tempfile.mkdtemp(prefix="chronoscope-ingest-"))
        for z in zips:
            with zipfile.ZipFile(z) as zf:
                zf.extractall(tmp)
        pdfs = sorted(tmp.glob("profiles/*.pdf"))
    if not pdfs:
        raise SystemExit("no profile PDFs found")

    fresh: list[dict] = []
    already: list[dict] = []
    seen_raw: dict[str, str] = {}
    seen_pix: dict[str, str] = {}

    for pdf in pdfs:
        civ, _ver, plates = parse_pdf(pdf)
        for p in plates:
            slot = f"{p['civ']}/{p['role']}"
            held_slot = live_raw.get(p["sha256"])
            held_pix = live_pix.get(p["pix"])

            if held_pix or held_slot:
                # the picture already lives in the archive — same slot or a crime
                if held_slot and held_slot == (p["civ"], p["role"]):
                    already.append(p)
                    continue
                twin = held_slot or held_pix
                raise SystemExit(
                    f"UNIQUENESS VIOLATION: {slot}'s plate already serves {twin}. "
                    "Nothing was published."
                )

            # inside the batch: one picture, one slot
            if p["sha256"] in seen_raw or p["pix"] in seen_pix:
                twin = seen_raw.get(p["sha256"]) or seen_pix.get(p["pix"])
                raise SystemExit(
                    f"UNIQUENESS VIOLATION: {slot}'s plate repeats {twin}. "
                    "Nothing was published."
                )
            seen_raw[p["sha256"]] = slot
            seen_pix[p["pix"]] = slot
            fresh.append(p)

    # ---- publish ---------------------------------------------------------
    out_art = OUT / "art"
    out_art.mkdir(parents=True, exist_ok=True)
    new_profiles: set[str] = set()
    for p in fresh:
        name = f"{p['civ']}-{p['role']}-{p['version']}.webp"
        im = Image.open(io.BytesIO(p["raw"])).convert("RGB")
        im.save(out_art / name, "WEBP", quality=ART_QUALITY, method=4)
        assets["ready"].append(
            {
                "entityId": p["civ"],
                "role": p["role"],
                "version": p["version"],
                "file": name,
                "width": im.width,
                "height": im.height,
                "sha256": p["sha256"],
                "reviewStatus": "unique batch plate · pixel-audited at ingest",
            }
        )
        new_profiles.add(p["civ"])

    # ---- manifests -------------------------------------------------------
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    assets["generated"] = now
    assets["counts"]["readyRoleAssets"] = len(assets["ready"])
    civilian = sum(1 for a in assets["ready"] if a["entityId"].startswith("CIV-"))
    assets["counts"]["pendingRoleAssets"] = (
        assets["counts"]["civilian"] - civilian // len(ROLES)
    ) * len(ROLES) + assets["counts"]["idm"] * len(ROLES)
    assets.setdefault("batches", []).append(
        {
            "source": args.src or args.zips,
            "ingested": now,
            "profilesNew": len(new_profiles),
            "platesPublished": len(fresh),
            "platesAlreadyPresent": len(already),
            "uniquenessAudit": "raw sha256 + decoded-pixel sha256, batch and archive",
        }
    )
    ASSETS.write_text(json.dumps(assets, ensure_ascii=False, indent=1), encoding="utf-8")

    index["manifest"]["generated"] = now
    index["manifest"]["readyProfiles"] = civilian // len(ROLES)
    INDEX.write_text(
        json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

    # ---- the report ------------------------------------------------------
    print(f"ingested {len(fresh)} new role plates for {len(new_profiles)} profiles")
    if new_profiles:
        ids = sorted(new_profiles)
        print(f"  new profiles: {ids[0]} .. {ids[-1]} ({len(ids)})")
    print(f"  already present (skipped, published plate kept): {len(already)}")
    print(f"  ready role assets now: {assets['counts']['readyRoleAssets']}")
    print(f"  ready profiles now: {index['manifest']['readyProfiles']}")
    print("  uniqueness audit passed: raw + pixel fingerprints, batch and archive")


if __name__ == "__main__":
    try:
        main()
    except SystemExit as e:
        if e.code not in (0, None):
            print(f"ABORTED: {e}", file=sys.stderr)
            sys.exit(1)
        raise
