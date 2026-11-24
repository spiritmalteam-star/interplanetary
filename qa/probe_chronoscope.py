"""Scroll the live page to the Chronoscope and prove it RENDERS (not just HTTP 200).
Writes captures/chronoscope-<w>.png and chronoscope-probe.json. Read-only."""
import json, sys
from playwright.sync_api import sync_playwright
base = sys.argv[1].rstrip('/') if len(sys.argv) > 1 else 'https://www.reflectme.space'
out = sys.argv[2] if len(sys.argv) > 2 else 'captures'
import os; os.makedirs(out, exist_ok=True)
res = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h in [(390, 844), (1440, 900)]:
        pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        failed = []
        pg.on('response', lambda r: failed.append(f'{r.status} {r.url[:120]}') if r.status >= 400 else None)
        pg.goto(base + '/', wait_until='networkidle', timeout=60000)
        pg.wait_for_timeout(1500)
        pg.keyboard.press('Escape')
        pg.wait_for_timeout(800)
        stage = pg.locator('.codex-stage').first
        info = {'viewport': w, 'stage_found': stage.count() > 0, 'failed': failed}
        if stage.count():
            stage.scroll_into_view_if_needed(timeout=15000)
            pg.wait_for_timeout(2500)
            txt = stage.inner_text(timeout=5000)
            info['winding'] = 'winding' in txt.lower()
            info['load_error'] = 'could not be wound' in txt.lower()
            info['text_len'] = len(txt)
            info['text_head'] = txt[:300]
            info['imgs'] = stage.locator('img').count()
            box = stage.bounding_box() or {}
            info['box'] = box
            stage.screenshot(path=f'{out}/chronoscope-{w}.png')
        else:
            pg.screenshot(path=f'{out}/chronoscope-{w}-notfound.png')
        res.append(info); pg.close()
    b.close()
json.dump(res, open(f'{out}/chronoscope-probe.json', 'w'), indent=1)
print(json.dumps(res, indent=1)[:1500])
