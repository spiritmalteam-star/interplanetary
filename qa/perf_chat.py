"""Perf of the real app under a long streamed Mirror conversation (AI stubbed, 4x CPU throttle).
Usage: perf_chat.py BASE OUT [turns]. Read-only; no production data."""
import json, sys, os, time
from playwright.sync_api import sync_playwright
base = sys.argv[1].rstrip('/'); out = sys.argv[2]; turns = int(sys.argv[3]) if len(sys.argv) > 3 else 14
os.makedirs(out, exist_ok=True)
WORDS = ('a mirror keeps no image of its own it holds the dark so that whatever stands before it can be seen '
         'more plainly in the quiet the reflection is less a copy than a conversation ').split()
def answer(n):
    return ' '.join(WORDS[(i + n) % len(WORDS)] for i in range(220)) + '.'
def body_for(n):
    a = answer(n); toks = a.split(' ')
    s = ''.join('data: ' + json.dumps({'t': (t + ' ')}) + '\n\n' for t in toks)
    return s + 'data: ' + json.dumps({'done': {'transmission': a}}) + '\n\n', a
cnt = {'n': 0}
def mock(route):
    cnt['n'] += 1; b, a = body_for(cnt['n'])
    if '"stream":true' in (route.request.post_data or '').replace(' ', ''):
        route.fulfill(status=200, headers={'content-type': 'text/event-stream'}, body=b)
    else:
        route.fulfill(status=200, content_type='application/json', body=json.dumps({'transmission': a}))
SAMPLE = '''()=>({heapMB:(performance.memory?performance.memory.usedJSHeapSize/1048576:0),
 nodes:document.getElementsByTagName("*").length,
 backdrop:[...document.querySelectorAll("*")].filter(e=>{const s=getComputedStyle(e);return (s.backdropFilter&&s.backdropFilter!=="none")||(s.webkitBackdropFilter&&s.webkitBackdropFilter!=="none")}).length,
 anims:document.getAnimations().length, animBreak:Object.entries(document.getAnimations().reduce((a,x)=>{const n=(x.animationName||(x.effect&&x.effect.getKeyframes&&Object.keys(x.effect.getKeyframes()[0]||{}).filter(k=>!['offset','easing','composite','computedOffset'].includes(k)).join('+'))||'?')+' @'+((x.effect&&x.effect.target&&(x.effect.target.getAttribute('data-testid')||String(x.effect.target.className).slice(0,40)))||'');a[n]=(a[n]||0)+1;return a},{})).sort((a,b)=>b[1]-a[1]).slice(0,8), canvases:document.querySelectorAll("canvas").length,
 overflowX:document.documentElement.scrollWidth>document.documentElement.clientWidth})'''
res = {'turns': []}
with sync_playwright() as p:
    b = p.chromium.launch(args=['--enable-precise-memory-info'])
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=1, has_touch=True, is_mobile=True)
    pg = ctx.new_page(); pg.route('**/api/transmission', mock)
    cdp = ctx.new_cdp_session(pg); cdp.send('Performance.enable'); cdp.send('Emulation.setCPUThrottlingRate', {'rate': 4})
    pg.add_init_script('window.__lt=0;window.__ltn=0;try{new PerformanceObserver(l=>{for(const e of l.getEntries()){window.__lt+=e.duration;window.__ltn++}}).observe({entryTypes:["longtask"]})}catch(e){}')
    def metrics():
        m = {x['name']: x['value'] for x in cdp.send('Performance.getMetrics')['metrics']}
        return {'layouts': m.get('LayoutCount'), 'recalcs': m.get('RecalcStyleCount'), 'taskS': round(m.get('TaskDuration', 0), 2),
                'listeners': m.get('JSEventListeners'), 'domNodes': m.get('Nodes')}
    def snap(label):
        d = pg.evaluate(SAMPLE); d.update(metrics()); d['label'] = label
        d['longtasks'] = pg.evaluate('window.__ltn'); d['longtaskMs'] = round(pg.evaluate('window.__lt'))
        return d
    pg.goto(base + '/', wait_until='networkidle', timeout=60000)
    pg.wait_for_timeout(1500); pg.keyboard.press('Escape'); pg.wait_for_timeout(600)
    res['entered'] = snap('landing')
    inp = pg.locator('[data-testid="realm-tree-ask-input"]').first
    res['composer_found'] = inp.count() > 0
    if inp.count():
        inp.scroll_into_view_if_needed(timeout=10000); inp.click()
        inp.fill('What is the quiet meaning of a mirror at night?'); inp.press('Enter')
        try: pg.wait_for_selector('[data-testid="realm-tree-zoom"]', timeout=30000)
        except Exception as e: res['zoom_wait'] = str(e)[:80]
        pg.wait_for_timeout(2500); res['turns'].append(snap('turn1'))
        for i in range(2, turns + 1):
            rep = pg.locator('[data-testid="realm-tree-zoom-reply"]').first
            if not rep.count(): res['no_reply_at'] = i; break
            t0 = time.time(); rep.click(); rep.fill(f'Follow-up number {i}: and then?'); rep.press('Enter')
            pg.wait_for_timeout(2500)
            d = snap(f'turn{i}'); d['wall_s'] = round(time.time() - t0, 1); res['turns'].append(d)
        pg.wait_for_timeout(15000); res['idle15s'] = snap('idle15s')
        try: res['responsive_ms'] = pg.evaluate('()=>new Promise(r=>{const t=performance.now();requestAnimationFrame(()=>r(performance.now()-t))})')
        except Exception as e: res['responsive_err'] = str(e)[:60]
    b.close()
json.dump(res, open(f'{out}/perf-chat.json', 'w'), indent=1)
print(json.dumps(res, indent=1))
