#!/usr/bin/env python3
"""
ReflectMe visual QA matrix.

Loads every room at every viewport width and records, per cell:
  - horizontal overflow (elements poking outside the viewport that no
    clipping ancestor hides) - the app is a fixed frame with internal
    scrolling, so document.scrollWidth is NOT a usable signal here;
  - console errors and uncaught page errors;
  - touch targets smaller than 44x44 CSS px (touch viewports only);
  - a screenshot.

It writes screenshots/ + results.json + matrix.md into the output folder.
It changes nothing on the site and needs no extra repo dependency:

    pip install playwright && playwright install chromium
    python3 tests/visual/qa-matrix.py --base https://<preview-url> --out qa-out

Signed-in rooms: log in once in a browser context, save its storage state
(playwright codegen --save-storage=state.json) and pass --state state.json.
A Vercel preview behind deployment protection needs a bypass cookie or
header: pass --header "x-vercel-protection-bypass: <secret>" (never commit it).
"""
import argparse
import json
import os
import sys
from playwright.sync_api import sync_playwright

# width, height, touch - the matrix from the visual directive
VIEWPORTS = [
    (320, 640, True), (360, 740, True), (375, 667, True), (390, 844, True),
    (430, 932, True), (480, 854, True), (768, 1024, True), (820, 1180, True),
    (1024, 768, True), (1280, 800, False), (1440, 900, False),
    (1600, 900, False), (1920, 1080, False), (2560, 1440, False),
]

# ?room= keys from src/components/mirror/UrlRooms.tsx ("" = the landing)
ROOMS = [
    "", "codex", "books", "music", "akashic", "invent", "quantum", "healx",
    "atelier", "studio", "library", "mirroros", "scopes", "spatial",
    "profile", "about", "signin", "billing", "gathering",
]

PROBE_JS = r"""
() => {
  const vw = window.innerWidth;
  const clipped = (el) => {
    for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) {
      const o = getComputedStyle(p).overflowX;
      /* only hidden/clip truly hide overflow; auto/scroll containers
         SCROLL sideways, which is reported separately as `hscroll` */
      if (o === 'hidden' || o === 'clip') {
        const r = p.getBoundingClientRect();
        if (r.left >= -1 && r.right <= vw + 1) return true;
      }
    }
    return false;
  };
  const visible = (el, cs, r) =>
    cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && r.width > 0 && r.height > 0;
  const label = (el) =>
    (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') +
     (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '')).slice(0, 80);

  const overflow = [];
  const small = [];
  const hscroll = [];
  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (!visible(el, cs, r)) continue;
    if ((cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1) {
      hscroll.push({ el: label(el), scrollWidth: el.scrollWidth, clientWidth: el.clientWidth });
    }
    if ((r.right > vw + 1 || r.left < -1) && cs.position !== 'fixed' && !clipped(el)) {
      overflow.push({ el: label(el), left: Math.round(r.left), right: Math.round(r.right) });
    }
    if (el.matches('button, a[href], [role="button"], [role="tab"], input:not([type="hidden"]), select, textarea, summary')) {
      if (r.right > 0 && r.left < vw && (r.width < 44 || r.height < 44)) {
        small.push({ el: label(el), w: Math.round(r.width), h: Math.round(r.height) });
      }
    }
  }
  return { vw, overflow, small, hscroll };
}
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True, help="site origin, e.g. https://preview.example.vercel.app")
    ap.add_argument("--out", default="qa-out")
    ap.add_argument("--rooms", default=",".join(ROOMS), help="comma list of ?room= keys ('' = landing)")
    ap.add_argument("--widths", default="", help="comma list of widths to restrict the matrix")
    ap.add_argument("--state", default="", help="Playwright storage-state JSON for a signed-in session")
    ap.add_argument("--header", action="append", default=[], help="extra request header 'Name: value'")
    ap.add_argument("--settle", type=int, default=1500, help="ms to wait after load")
    args = ap.parse_args()

    rooms = args.rooms.split(",") if args.rooms != "" else [""]
    only = {int(w) for w in args.widths.split(",") if w.strip()}
    viewports = [v for v in VIEWPORTS if not only or v[0] in only]
    headers = dict(h.split(":", 1) for h in args.header)
    headers = {k.strip(): v.strip() for k, v in headers.items()}

    os.makedirs(os.path.join(args.out, "screenshots"), exist_ok=True)
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for room in rooms:
            for (w, h, touch) in viewports:
                ctx = browser.new_context(
                    viewport={"width": w, "height": h},
                    has_touch=touch, is_mobile=touch and w < 900,
                    device_scale_factor=2 if touch else 1,
                    storage_state=args.state or None,
                    extra_http_headers=headers or None,
                )
                page = ctx.new_page()
                errors, page_errors = [], []
                page.on("console", lambda m, e=errors: e.append(m.text[:200]) if m.type == "error" else None)
                page.on("pageerror", lambda e, pe=page_errors: pe.append(str(e)[:200]))
                url = args.base.rstrip("/") + ("/?room=" + room if room else "/")
                cell = {"room": room or "(landing)", "width": w, "height": h, "url": url}
                try:
                    resp = page.goto(url, wait_until="domcontentloaded", timeout=45000)
                    cell["status"] = resp.status if resp else None
                    page.wait_for_timeout(args.settle)
                    probe = page.evaluate(PROBE_JS)
                    cell["overflow"] = probe["overflow"][:8]
                    cell["overflow_count"] = len(probe["overflow"])
                    cell["hscroll"] = probe["hscroll"][:8]
                    cell["hscroll_count"] = len(probe["hscroll"])
                    small = probe["small"] if touch else []
                    cell["small_targets"] = small[:8]
                    cell["small_target_count"] = len(small)
                    shot = f"{(room or 'landing')}-{w}.png"
                    page.screenshot(path=os.path.join(args.out, "screenshots", shot))
                    cell["screenshot"] = shot
                except Exception as e:  # noqa: BLE001 - a failed cell is data, not a crash
                    cell["error"] = str(e).split("\n")[0][:200]
                cell["console_errors"] = errors[:5]
                cell["page_errors"] = page_errors[:5]
                results.append(cell)
                ctx.close()
                flag = "ERR" if cell.get("error") else ("!" if cell.get("overflow_count") or cell.get("hscroll_count") or page_errors else ".")
                print(flag, end="", flush=True)
            print(f"  {room or '(landing)'}")
        browser.close()

    with open(os.path.join(args.out, "results.json"), "w") as f:
        json.dump(results, f, indent=2)

    lines = ["| room | " + " | ".join(str(v[0]) for v in viewports) + " |",
             "|---|" + "---|" * len(viewports)]
    for room in rooms:
        row = []
        for (w, _, _) in viewports:
            c = next(x for x in results if x["room"] == (room or "(landing)") and x["width"] == w)
            if c.get("error"):
                row.append("ERR")
            else:
                bits = []
                if c["overflow_count"]:
                    bits.append(f"ovf{c['overflow_count']}")
                if c["hscroll_count"]:
                    bits.append(f"hs{c['hscroll_count']}")
                if c["page_errors"]:
                    bits.append("js")
                if c["small_target_count"]:
                    bits.append(f"t{c['small_target_count']}")
                row.append(" ".join(bits) or "ok")
        lines.append(f"| {room or '(landing)'} | " + " | ".join(row) + " |")
    legend = "\n\nLegend: ok = clean; ovfN = N elements overflow the viewport; hsN = N containers scroll sideways (a carousel may be intended - check); js = uncaught page error; tN = N touch targets under 44px; ERR = page failed to load.\n"
    with open(os.path.join(args.out, "matrix.md"), "w") as f:
        f.write("\n".join(lines) + legend)
    bad = sum(1 for c in results if c.get("error") or c.get("overflow_count") or c.get("hscroll_count") or c.get("page_errors"))
    print(f"\n{len(results)} cells, {bad} with overflow / page errors / load failure. See {args.out}/matrix.md")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
