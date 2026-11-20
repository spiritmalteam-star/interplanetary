#!/usr/bin/env python3
"""
CODEX EXOBIOLOGICA — archival build engine.

Turns the museum's civilization PDFs (3 pages each: overview / technology &
anatomy / ecology & vistas) into the web archive's own data:

  public/codex/index.json        — the full catalogue (every row of INDEX.csv,
                                   enriched with the parsed summary fields)
  public/codex/details/chunk-NNN.json
                                 — the full entries, chunked for lazy loading
  public/codex/art/civ-XXXX-a|b|c.webp
                                 — the three plates (civilisation, technology,
                                   life) lifted from the PDFs and re-encoded

Re-runnable: drop a new batch of PDFs (or zips) into a source folder and run
again — already-built entries are simply refreshed, sealed plates stay.

Usage:
  python3 tools/codex/build_codex.py --src /tmp/civex --out public/codex
  python3 tools/codex/build_codex.py --zips 'upload/Civilisations_*.zip' --out public/codex
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import re
import sys
import zipfile
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path

import fitz  # PyMuPDF
from PIL import Image

# --------------------------------------------------------------------------
# the known vocabulary of the plates
# --------------------------------------------------------------------------

SECTIONS = {
    "OVERVIEW": "overview",
    "SOCIETY & ARCHITECTURE": "society",
    "CHRONICLE": "chronicle",
    "MECHANISM": "mechanism",
    "FIELD NOTES": "notes",
    "ANATOMY & INTEGRATION": "anatomy",
    "TECHNOLOGY METRICS": "metrics",
    "LIFECYCLE & SYMBIOSIS": "lifecycle",
    "ARCHIVE QUOTATION": "quote",
}

LABELS_P1 = [
    "Star system", "Sector", "Coordinates", "Distance (light-years)",
    "Homeworld", "Kinship", "Development", "Population", "Governance",
    "Communication", "Catalogued year",
]
LABELS_P2 = [
    "Technology ID", "Domain", "Energy output", "Frequency", "Materials",
    "Schematic", "Biochemistry", "Morphology", "Gravity (g)", "Atmosphere",
]
LABELS_P3 = [
    "Biota ID", "Kingdom", "Trophic method", "Typical scale",
    "Bioluminescence", "Anatomy", "Location", "Architecture",
    "Elevation / orbit", "Density", "Biochemistry",
]
ALL_LABELS = set(LABELS_P1 + LABELS_P2 + LABELS_P3) | set(SECTIONS)

CHUNK_SIZE = 40
ART_QUALITY = 80


def is_caps(line: str) -> bool:
    s = re.sub(r"[^A-Za-z]", "", line)
    return len(s) >= 8 and s.isupper()


def clean(lines):
    return " ".join(l.strip() for l in lines if l.strip()).strip()


def parse_page(page: fitz.Page):
    """Return (lines, fields, sections, titles) for one plate page."""
    text = page.get_text("text")
    lines = [l.rstrip() for l in text.splitlines()]

    fields: "OrderedDict[str, str]" = OrderedDict()
    sections: dict[str, str] = {}
    titles: list[str] = []

    i = 0
    n = len(lines)
    # skip the running header (CODEX... / name / subtitle / id / page no)
    while i < n:
        if re.match(r"^\d+\s*/\s*3\s*$", lines[i].strip()):
            i += 1
            break
        i += 1

    mode = None          # current capture target: ("label", name) | ("section", name) | ("desc", idx)
    buf: list[str] = []

    def flush():
        nonlocal buf, mode
        if mode is None:
            buf = []
            return
        kind, name = mode
        val = clean(buf)
        if kind == "label":
            fields[name] = val
        elif kind == "section":
            sections[name] = (sections.get(name, "") + " " + val).strip()
        elif kind == "titledesc":
            # the paragraph beneath a plate's title is that title's voice
            sections[f"@title:{name}"] = (sections.get(f"@title:{name}", "") + " " + val).strip()
        buf = []

    while i < n:
        raw = lines[i].strip()
        i += 1
        if not raw:
            continue
        if raw in ALL_LABELS:
            flush()
            if raw in SECTIONS:
                mode = ("section", SECTIONS[raw])
            else:
                mode = ("label", raw)
            continue
        if is_caps(raw):
            flush()
            titles.append(raw)
            mode = ("titledesc", len(titles) - 1)
            continue
        buf.append(raw)
    flush()

    return fields, sections, titles


def split_quote(raw: str):
    raw = raw.strip()
    m = re.match(r"^(?P<q>[\u201c\"])(?P<text>.*?)[\u201d\"]\s*[—–-]\s*\*?(?P<src>.*?)\*?$", raw, re.S)
    if m:
        return m.group("text").strip(), m.group("src").strip()
    m = re.match(r"^(?P<text>.+?)\s*[—–-]\s*\*?(?P<src>[^—-]+?)\*?$", raw, re.S)
    if m:
        return m.group("text").strip(' \u201c\u201d"'), m.group("src").strip()
    return raw.strip(' \u201c\u201d"'), ""


def parse_metrics(raw: str) -> dict:
    out = {}
    for part in raw.split("|"):
        if ":" in part:
            k, v = part.split(":", 1)
            out[k.strip()] = v.strip()
    return out


def extract_art(doc: fitz.Document, civ_id: str, art_dir: Path) -> list[str]:
    """One plate per page (first unique image), re-encoded as webp."""
    names = []
    seen: set[int] = set()
    slots = ["a", "b", "c"]
    slot_i = 0
    for page in doc:
        if slot_i >= len(slots):
            break
        for im in page.get_images(full=True):
            xref = im[0]
            if xref in seen:
                continue
            seen.add(xref)
            pix = fitz.Pixmap(doc, xref)
            if pix.alpha:
                pix = fitz.Pixmap(fitz.csRGB, pix)
            img = Image.open(io.BytesIO(pix.tobytes("png"))).convert("RGB")
            name = f"{civ_id.lower()}-{slots[slot_i]}.webp"
            img.save(art_dir / name, "WEBP", quality=ART_QUALITY, method=4)
            names.append(name)
            slot_i += 1
            break
    return names


def kinship_pct(v: str):
    m = re.search(r"(\d+(?:\.\d+)?)\s*%", v)
    return float(m.group(1)) if m else None


def distance_ly(fields: dict) -> float | None:
    v = fields.get("Distance (light-years)", "")
    try:
        return float(v.replace(",", ""))
    except Exception:
        pass
    m = re.search(r"([\d,]+(?:\.\d+)?)\s*LY", fields.get("Sector", "") + " " + fields.get("Kinship", ""))
    if m:
        try:
            return float(m.group(1).replace(",", ""))
        except Exception:
            return None
    return None


def parse_pdf(path: Path, art_dir: Path) -> dict | None:
    civ_id = path.stem.split("_")[0]
    try:
        doc = fitz.open(path)
    except Exception as e:
        print(f"  ! cannot open {path.name}: {e}", file=sys.stderr)
        return None

    # page 1 — the name sits on line 2, the epithet on line 3
    p1_lines = [l.strip() for l in doc[0].get_text().splitlines() if l.strip()]
    name = p1_lines[1] if len(p1_lines) > 1 else civ_id
    epithet = p1_lines[2] if len(p1_lines) > 2 and not is_caps(p1_lines[2]) and "CIV-" not in p1_lines[2] else ""

    f1, s1, _ = parse_page(doc[0])
    f2, s2, t2 = parse_page(doc[1])
    f3, s3, t3 = parse_page(doc[2])

    art = extract_art(doc, civ_id, art_dir)
    doc.close()

    dev = f1.get("Development", "")
    km = re.match(r"Type\s+([IVXΩ]+)", dev)
    kard = km.group(1) if km else None

    quote_text, quote_src = split_quote(s3.get("quote", ""))

    bio_raw = f2.get("Biochemistry", "")
    bio_short = bio_raw.split("(")[0].strip() or None

    rec = {
        "i": civ_id,
        "name": name,
        "epithet": epithet,
        "fields": {
            "starSystem": f1.get("Star system", ""),
            "sector": f1.get("Sector", ""),
            "coordinates": f1.get("Coordinates", ""),
            "distance": f1.get("Distance (light-years)", ""),
            "homeworld": f1.get("Homeworld", ""),
            "kinship": f1.get("Kinship", ""),
            "development": dev,
            "population": f1.get("Population", ""),
            "governance": f1.get("Governance", ""),
            "communication": f1.get("Communication", ""),
            "catalogued": f1.get("Catalogued year", ""),
        },
        "summary": {
            "distance_ly": distance_ly(f1),
            "kardashev": kard,
            "kardashev_label": dev,
            "kinship": kinship_pct(f1.get("Kinship", "")),
            "biochemistry": bio_short,
        },
        "overview": s1.get("overview", ""),
        "society": s1.get("society", ""),
        "chronicle": s1.get("chronicle", ""),
        "tech": {
            "name": t2[0] if t2 else "",
            "desc": s2.get("@title:0", ""),
            "mechanism": s2.get("mechanism", ""),
            "id": f2.get("Technology ID", ""),
            "domain": f2.get("Domain", ""),
            "energy": f2.get("Energy output", ""),
            "frequency": f2.get("Frequency", ""),
            "materials": f2.get("Materials", ""),
            "schematic": f2.get("Schematic", ""),
            "notes": s2.get("notes", ""),
        },
        "metrics": parse_metrics(s2.get("metrics", "")),
        "body": {
            "anatomy": s2.get("anatomy", ""),
            "biochemistry": bio_raw,
            "morphology": f2.get("Morphology", ""),
            "gravity": f2.get("Gravity (g)", ""),
            "atmosphere": f2.get("Atmosphere", ""),
        },
        "biota": {
            "name": (t3[0].split(" / ")[0] if t3 else ""),
            "binomial": (t3[0].split(" / ", 1)[1] if t3 and " / " in t3[0] else ""),
            "desc": s3.get("@title:0", ""),
            "id": f3.get("Biota ID", ""),
            "kingdom": f3.get("Kingdom", ""),
            "biochemistry": f3.get("Biochemistry", ""),
            "trophic": f3.get("Trophic method", ""),
            "scale": f3.get("Typical scale", ""),
            "bioluminescence": f3.get("Bioluminescence", ""),
            "anatomy": f3.get("Anatomy", ""),
            "lifecycle": s3.get("lifecycle", ""),
        },
        "vista": {
            "title": (t3[1] if len(t3) > 1 else ""),
            "desc": s3.get("@title:1", ""),
            "location": f3.get("Location", ""),
            "architecture": f3.get("Architecture", ""),
            "elevation": f3.get("Elevation / orbit", ""),
            "density": f3.get("Density", ""),
        },
        "quote": {"text": quote_text, "source": quote_src},
        "art": art,
    }
    return rec


def read_zips(pattern: str, workdir: Path) -> Path:
    """Extract matching zips into a scratch dir and return it."""
    workdir.mkdir(parents=True, exist_ok=True)
    import glob
    for zp in glob.glob(pattern):
        with zipfile.ZipFile(zp) as z:
            z.extractall(workdir)
    return workdir


def main():
    ap = argparse.ArgumentParser()
    src_group = ap.add_mutually_exclusive_group(required=True)
    src_group.add_argument("--src", help="folder holding the PDFs (and optional INDEX.csv)")
    src_group.add_argument("--zips", help="glob of civilization zips to extract first")
    ap.add_argument("--work", default="/tmp/codex-src", help="scratch dir for --zips")
    ap.add_argument("--out", default="public/codex")
    args = ap.parse_args()

    src = Path(args.src) if args.src else read_zips(args.zips, Path(args.work))
    out = Path(args.out)
    art_dir = out / "art"
    det_dir = out / "details"
    art_dir.mkdir(parents=True, exist_ok=True)
    det_dir.mkdir(parents=True, exist_ok=True)

    # the catalogue's own index (all 3,212 rows, even the sealed ones)
    catalogue: "OrderedDict[str, dict]" = OrderedDict()
    index_csv = src / "INDEX.csv"
    if index_csv.exists():
        with index_csv.open(newline="", encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                cid = (row.get("ID") or "").strip()
                if not cid:
                    continue
                catalogue[cid] = {
                    "i": cid,
                    "n": (row.get("Civilisation") or "").strip(),
                    "s": (row.get("Star system") or "").strip(),
                    "h": (row.get("Homeworld") or "").strip(),
                }

    pdfs = sorted(src.glob("CIV-*.pdf"))
    print(f"catalogue rows: {len(catalogue)} · pdfs: {len(pdfs)}")

    parsed: list[dict] = []
    for k, pdf in enumerate(pdfs):
        rec = parse_pdf(pdf, art_dir)
        if rec is None:
            continue
        parsed.append(rec)
        if (k + 1) % 100 == 0:
            print(f"  parsed {k+1}/{len(pdfs)}")

    # merge parsed entries into the catalogue order
    by_id = {r["i"]: r for r in parsed}
    missing = [r["i"] for r in parsed if r["i"] not in catalogue]
    for cid in missing:  # a pdf without a catalogue row still belongs
        catalogue[cid] = {"i": cid, "n": by_id[cid]["name"], "s": "", "h": ""}

    rows: list[dict] = []
    chunk_no = 0
    offset = 0
    chunk_buf: list[dict] = []

    def flush_chunk():
        nonlocal chunk_no, offset, chunk_buf
        if not chunk_buf:
            return
        (det_dir / f"chunk-{chunk_no:03d}.json").write_text(
            json.dumps(chunk_buf, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        chunk_no += 1
        offset = 0
        chunk_buf = []

    for cid, base in catalogue.items():
        rec = by_id.get(cid)
        if rec is None:
            rows.append(base)
            continue
        if offset >= CHUNK_SIZE:
            flush_chunk()
        row = {
            "i": cid,
            "n": rec["name"],
            "s": rec["fields"]["starSystem"] or base["s"],
            "h": rec["fields"]["homeworld"] or base["h"],
            "e": rec["epithet"],
            "d": rec["summary"]["distance_ly"],
            "k": rec["summary"]["kardashev"],
            "b": rec["summary"]["biochemistry"],
            "kn": rec["summary"]["kinship"],
            "y": rec["fields"]["catalogued"] or None,
            "c": chunk_no,
            "x": offset,
        }
        rows.append(row)
        chunk_buf.append(rec)
        offset += 1
    flush_chunk()

    manifest = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "total": len(rows),
        "entries": len(parsed),
        "chunks": chunk_no,
        "chunkSize": CHUNK_SIZE,
    }
    (out / "index.json").write_text(
        json.dumps({"manifest": manifest, "rows": rows}, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    art_count = len(list(art_dir.glob("*.webp")))
    print(f"done: {manifest}")
    print(f"art plates: {art_count}")


if __name__ == "__main__":
    main()
