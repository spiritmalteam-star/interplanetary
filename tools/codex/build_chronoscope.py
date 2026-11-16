#!/usr/bin/env python3
"""
THE CHRONOSCOPE — canonical data build.

Turns the museum's canonical source catalogue (tools/codex/chronoscope/
source-catalogue.json, 3,212 civilizations + 8 interdimensional records)
into the instrument's web data:

  public/chronoscope/index.json     — the full catalogue with chunk pointers
  public/chronoscope/details/chunk-NNN.json
                                    — the complete canonical records, chunked
  public/chronoscope/idm.json       — the eight hyperspace records, verbatim
  public/chronoscope/assets.json    — the role-asset manifest (24 ready pilots;
                                      everything else is honestly pending)
  public/chronoscope/art/*.webp     — the six pilot profiles' role artwork

Uniqueness contract: the legacy PDF-lifted image library was found to hold
only 19 distinct pictures across 5,436 files (a shared illustration library
recycled across records). It is quarantined — kept recoverable in git
history (commit e6fed32) but excluded from the live mapping. Only the 24
newly generated pilot role images (hash-verified against the bundle
manifest) carry status "ready"; every other record shows an honest
"artwork pending" state until its own four images are generated and
reviewed. Artwork is never silently substituted, recoloured or reused.

Usage: python3 tools/codex/build_chronoscope.py
"""

from __future__ import annotations

import hashlib
import json
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path

import fitz  # noqa: F401  (kept for parity with the elder builder)
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "tools/codex/chronoscope"
OUT = ROOT / "public/chronoscope"

CHUNK_SIZE = 40
ART_QUALITY = 85
ROLES = ["being", "world", "technology", "life"]


def kardashev_short(raw: str) -> str | None:
    if not raw:
        return None
    for token in ("Ω", "IV", "III", "II", "I"):
        if token in raw:
            return token
    return None


def bio_short(raw: str | None) -> str | None:
    if not raw:
        return None
    return raw.split("(")[0].strip() or None


def build_civ_record(civ: dict) -> dict:
    """Keep the canonical values verbatim; short keys keep the payload light."""
    tech = civ.get("technology") or {}
    biota = civ.get("biota") or {}
    vista = civ.get("vista") or {}
    return {
        "i": civ["id"],
        "idx": civ.get("index"),
        "n": civ.get("name"),
        "e": civ.get("epithet"),
        "kinship": civ.get("humanKinshipRank"),
        "star": civ.get("starSystem"),
        "sector": civ.get("galacticSector"),
        "coords": civ.get("coordinates"),
        "d": civ.get("distanceLightYears"),
        "kard": civ.get("kardashev"),
        "kn": civ.get("kardashevNumeric"),
        "bio": civ.get("biochemistry"),
        "morph": civ.get("morphology"),
        "home": civ.get("homeworld"),
        "g": civ.get("gravityG"),
        "atm": civ.get("atmosphere"),
        "gov": civ.get("governance"),
        "comm": civ.get("communicationModality"),
        "pop": civ.get("estimatedPopulation"),
        "year": civ.get("firstCatalogedYear"),
        "hue": civ.get("accentHue"),
        "thesis": civ.get("openingThesis"),
        "anat": civ.get("anatomicalAndRoboticIntegration"),
        "society": civ.get("societalArchitecture"),
        "chron": civ.get("chronicleEpoch"),
        "q": {"t": civ.get("archivalPullQuote"), "s": civ.get("quoteAttribution")},
        "tech": {
            "id": tech.get("id"),
            "name": tech.get("name"),
            "domain": tech.get("domain"),
            "energy": tech.get("energyOutput"),
            "freq": tech.get("operatingFrequency"),
            "mat": tech.get("materialComposition"),
            "schem": tech.get("schematicType"),
            "sum": tech.get("summary"),
            "mech": tech.get("mechanismOfAction"),
            "notes": tech.get("fieldNotes"),
            "metrics": tech.get("radarMetrics") or {},
        },
        "biota": {
            "id": biota.get("id"),
            "name": biota.get("commonName"),
            "sci": biota.get("scientificName"),
            "kingdom": biota.get("kingdom"),
            "trophic": biota.get("trophicMethod"),
            "bio": biota.get("biochemistry"),
            "scale": biota.get("typicalScale"),
            "lum": biota.get("bioluminescence"),
            "anat": biota.get("anatomyType"),
            "sum": biota.get("summary"),
            "eco": biota.get("lifecycleAndEcology"),
            "sym": biota.get("symbiosisWithCivilization"),
        },
        "vista": {
            "id": vista.get("id"),
            "title": vista.get("title"),
            "loc": vista.get("locationName"),
            "style": vista.get("architecturalStyle"),
            "tint": vista.get("atmosphereTint"),
            "starSpec": vista.get("primaryStarSpectrum"),
            "elev": vista.get("elevationOrOrbit"),
            "dens": vista.get("populationDensity"),
            "type": vista.get("vistaType"),
            "cap": vista.get("caption"),
            "analysis": vista.get("architecturalAnalysis"),
            "sensory": vista.get("sensoryImpression"),
        },
    }


def main() -> None:
    catalogue = json.loads((SRC / "source-catalogue.json").read_text(encoding="utf-8"))
    bundle_manifest = json.loads((SRC / "asset-manifest.json").read_text(encoding="utf-8"))

    out_art = OUT / "art"
    out_det = OUT / "details"
    out_art.mkdir(parents=True, exist_ok=True)
    out_det.mkdir(parents=True, exist_ok=True)

    # ---------------- the eight hyperspace records, verbatim ----------------
    idm = catalogue["interdimensionalBeings"]
    (OUT / "idm.json").write_text(
        json.dumps({"note": catalogue.get("archiveTitle", ""), "entities": idm}, ensure_ascii=False),
        encoding="utf-8",
    )

    # ------------------------- the civilian records -------------------------
    records = [build_civ_record(civ) for civ in catalogue["civilizations"]]

    rows: list[dict] = []
    chunk_no = 0
    offset = 0
    buf: list[dict] = []

    def flush_chunk() -> None:
        nonlocal chunk_no, offset, buf
        if not buf:
            return
        (out_det / f"chunk-{chunk_no:03d}.json").write_text(
            json.dumps(buf, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        chunk_no += 1
        offset = 0
        buf = []

    for rec in records:
        if offset >= CHUNK_SIZE:
            flush_chunk()
        rows.append(
            {
                "i": rec["i"],
                "n": rec["n"],
                "e": rec["e"],
                "s": rec["star"],
                "h": rec["home"],
                "d": rec["d"],
                "k": kardashev_short(rec["kard"]),
                "kn": rec["kn"],
                "b": bio_short(rec["bio"]),
                "hue": rec["hue"],
                "c": chunk_no,
                "x": offset,
            }
        )
        buf.append(rec)
        offset += 1
    flush_chunk()

    # ------------------- the pilot role artwork (verified) -------------------
    ready: list[dict] = []
    for asset in bundle_manifest["assets"]:
        src_file = SRC / "pilot-assets" / asset["file"]
        data = src_file.read_bytes()
        digest = hashlib.sha256(data).hexdigest()
        if digest != asset["sha256"]:
            raise SystemExit(f"hash mismatch for {asset['file']} — refusing to publish")
        webp_name = asset["file"].replace(".jpg", ".webp")
        img = Image.open(src_file).convert("RGB")
        img.save(out_art / webp_name, "WEBP", quality=ART_QUALITY, method=4)
        ready.append(
            {
                "entityId": asset["entityId"],
                "role": asset["role"],
                "version": asset["version"],
                "file": webp_name,
                "width": img.width,
                "height": img.height,
                "sha256": digest,
                "reviewStatus": asset.get("reviewStatus"),
            }
        )

    manifest = {
        "schema": "chronoscope-assets-v1",
        "promptVersion": "chronoscope-v1",
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "counts": {
            "records": len(rows) + len(idm),
            "civilian": len(rows),
            "idm": len(idm),
            "readyRoleAssets": len(ready),
            "pendingRoleAssets": (len(rows) - len(ready) // len(ROLES)) * len(ROLES)
            + len(idm) * len(ROLES),
        },
        "legacy": {
            "quarantined": True,
            "duplicateFlaggedFiles": 5432,
            "distinctLegacyPictures": 19,
            "note": (
                "The legacy PDF-lifted library held recycled artwork across records. "
                "It is excluded from the live mapping and kept recoverable in git "
                "history (e6fed32). Missing artwork stays pending; it is never "
                "substituted, recoloured or reused."
            ),
        },
        "ready": ready,
    }
    (OUT / "assets.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=1), encoding="utf-8"
    )

    # ------------------------------ the index ------------------------------
    index = {
        "manifest": {
            "generated": manifest["generated"],
            "total": len(rows) + len(idm),
            "civilian": len(rows),
            "idm": len(idm),
            "chunks": chunk_no,
            "chunkSize": CHUNK_SIZE,
            "readyProfiles": len(ready) // len(ROLES),
        },
        "rows": rows,
    }
    (OUT / "index.json").write_text(
        json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8"
    )

    print(f"done: {index['manifest']}")
    print(f"ready role assets: {len(ready)} (hash-verified)")
    art_count = len(list(out_art.glob('*.webp')))
    print(f"art plates: {art_count}")


if __name__ == "__main__":
    main()
