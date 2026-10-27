#!/usr/bin/env python3
"""Merge cover + body into the final replication prompt PDF."""
from pypdf import PdfReader, PdfWriter

A4_W, A4_H = 595.28, 841.89

def normalize(page):
    w, h = float(page.mediabox.width), float(page.mediabox.height)
    if abs(w - A4_W) > 0.4 or abs(h - A4_H) > 0.4:
        page.scale_to(A4_W, A4_H)
    return page

writer = PdfWriter()
writer.add_page(normalize(PdfReader("/home/z/my-project/.pdfbuild/cover.pdf").pages[0]))
for p in PdfReader("/home/z/my-project/.pdfbuild/replication_body.pdf").pages:
    writer.add_page(normalize(p))
writer.add_metadata({
    "/Title": "Mirror Entity - Full Replication Prompt",
    "/Author": "Z.ai",
    "/Creator": "Z.ai",
    "/Subject": "The complete replication directive for reflectme.space - vision, directive, architecture, economy, runbook, Google OAuth repair, gallery",
})
out = "/home/z/my-project/public/reflectme-full-replication-prompt.pdf"
with open(out, "wb") as f:
    writer.write(f)
print("FINAL:", out, "pages:", len(writer.pages))
