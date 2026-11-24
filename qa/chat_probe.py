"""Drive the Mirror Entity chat: floor -> ask -> answer -> follow-up. Screenshots + metrics."""
import json, sys, os
from playwright.sync_api import sync_playwright
base = sys.argv[1].rstrip('/'); out = sys.argv[2]; tag = sys.argv[3] if len(sys.argv) > 3 else 'chat'
os.makedirs(out, exist_ok=True)
res = []
Q = 'What is the quiet meaning of a mirror at night?'
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp, mobile in [('phone', (390, 844), True), ('tablet', (820, 1180), True), ('desktop', (1440, 900), False)]:
        ctx = b.new_context(viewport={'width': vp[0], 'height': vp[1]}, device_scale_factor=1, has_touch=mobile, is_mobile=mobile)
        pg = ctx.new_page(); info = {'name': name, 'title': None}
        try:
            r = pg.goto(base + '/', wait_until='networkidle', timeout=60000)
            info['status'] = r.status if r else None
            info['title'] = pg.title()
            pg.wait_for_timeout(1200); pg.keyboard.press('Escape'); pg.wait_for_timeout(600)
            inp = pg.locator('[data-testid="realm-tree-ask-input"]').first
            info['composer_found'] = inp.count() > 0
            if inp.count():
                inp.scroll_into_view_if_needed(timeout=10000)
                pg.screenshot(path=f'{out}/{tag}-{name}-1-floor.png')
                inp.click(); inp.fill(Q)
                pg.wait_for_timeout(300)
                info['field_tag'] = inp.evaluate('e=>e.tagName')
                info['field_font_px'] = inp.evaluate('e=>getComputedStyle(e).fontSize')
                inp.fill('line one\nline two\nline three\nline four')
                pg.wait_for_timeout(200)
                info['grown_height'] = inp.evaluate('e=>e.getBoundingClientRect().height')
                pg.screenshot(path=f'{out}/{tag}-{name}-2-grown.png')
                inp.fill(Q); inp.press('Enter')
                try:
                    pg.wait_for_selector('[data-testid="realm-tree-zoom-answer"] .canopy-answer, [data-testid="realm-tree-zoom"]', timeout=20000)
                    pg.wait_for_timeout(25000)
                except Exception as e:
                    info['answer_wait'] = str(e)[:80]
                pg.screenshot(path=f'{out}/{tag}-{name}-3-answer.png')
                z = pg.locator('[data-testid="realm-tree-zoom"]').first
                if z.count():
                    hd = z.locator('header').first
                    info['header_h'] = (hd.bounding_box() or {}).get('height')
                    info['zoom_box'] = z.bounding_box()
                    info['answer_text_len'] = len(pg.locator('[data-testid="realm-tree-zoom-answer"]').first.inner_text())
                info['overflowX'] = pg.evaluate('document.documentElement.scrollWidth>document.documentElement.clientWidth')
        except Exception as e:
            info['error'] = str(e)[:200]
        res.append(info); ctx.close()
    b.close()
json.dump(res, open(f'{out}/{tag}-probe.json', 'w'), indent=1); print(json.dumps(res, indent=1))
